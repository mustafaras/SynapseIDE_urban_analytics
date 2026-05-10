// @vitest-environment jsdom

import React, { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

import {
  buildScenarioComparisonResult,
  DEFAULT_SCENARIO_COMPARISON_FORM,
} from '@/centerpanel/Flows/scenarioComparisonShared';
import { buildScenarioComparisonCompletedRun } from '@/centerpanel/Flows/scenarioComparisonArtifacts';
import { synapseBus } from '@/services/synapseBus';
import { drainPendingInserts } from '@/services/reporting/storage';
import { useFlowStore } from '@/stores/useFlowStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import { UrbanEvidenceTray } from '../evidence/UrbanEvidenceTray';
import type { AnalyticalFlowId, CompletedAnalysisRun, MapOutput, UrbanWorkflowRunManifest } from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';
import * as reproduciblePackageExport from '../context/reproduciblePackageExport';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const exportReproduciblePackageSpy = vi.spyOn(
  reproduciblePackageExport,
  'buildAndDownloadUrbanReproduciblePackageJsonFromActiveContext',
);

function mountTray() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

async function dispatchClick(element: Element | null): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function rowByText(container: HTMLElement, text: string): HTMLElement {
  const row = Array.from(container.querySelectorAll<HTMLElement>('.ua-evidence-row')).find((node) =>
    node.textContent?.includes(text),
  );
  expect(row).toBeTruthy();
  return row as HTMLElement;
}

function registerContextFixture(): string {
  useUrbanContextStore.getState().createContext({
    studyAreaId: 'istanbul-heat-study',
    activeLayerIds: ['layer-hotspots'],
    activeRunId: 'run-heat-001',
  });

  const contextId = useUrbanContextStore.getState().context?.contextId;
  expect(contextId).toBeTruthy();

  useUrbanContextStore.getState().registerEvidenceArtifact({
    id: 'artifact-heat-layer',
    kind: 'map-layer',
    title: 'Heat exposure cluster layer',
    summary: 'Reference to the current heat exposure cluster layer produced by the workflow run.',
    state: 'active',
    sourceModule: 'urban-analytics',
    linkedContextId: contextId,
    linkedRunId: 'run-heat-001',
    linkedLayerIds: ['layer-hotspots'],
    mapLayerId: 'layer-hotspots',
    dashboardBindingId: 'city.green_space',
    provenance: {
      methodName: 'Heat exposure screening',
      flowId: 'heat_island',
      runId: 'run-heat-001',
      layerIds: ['layer-hotspots'],
    },
    qa: {
      state: 'warning',
      confidence: 0.72,
      warnings: ['Layer should be reviewed against current land-surface temperature inputs.'],
      limitations: ['Fixture layer is a reference, not raw geometry.'],
    },
    createdAt: '2026-05-08T09:00:00.000Z',
    updatedAt: '2026-05-08T10:00:00.000Z',
  });

  useUrbanContextStore.getState().registerEvidenceArtifact({
    id: 'artifact-heat-script',
    kind: 'code-artifact',
    title: 'Heat workflow reproducibility script',
    summary: 'Project-relative script reference for the heat workflow run.',
    state: 'active',
    sourceModule: 'synapse-ide',
    linkedContextId: contextId,
    linkedFilePaths: ['analysis/heat_workflow.py'],
    codeArtifactId: 'code-heat-001',
    qa: {
      state: 'valid',
      warnings: [],
      limitations: [],
    },
    createdAt: '2026-05-08T08:30:00.000Z',
    updatedAt: '2026-05-08T09:30:00.000Z',
  });

  return contextId as string;
}

function makeMapOutput(id = 'output-1', overrides?: Partial<MapOutput>): MapOutput {
  return {
    id,
    type: 'choropleth',
    title: `Output ${id}`,
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [29, 41] },
          properties: { value: 42 },
        },
      ],
    },
    ...overrides,
  };
}

function makeRun(runId = 'run-publish-001', outputs?: MapOutput[]): CompletedAnalysisRun {
  return {
    runId,
    flowId: 'site-suitability' as AnalyticalFlowId,
    label: `Run ${runId}`,
    insertedAt: '2026-05-08T11:00:00.000Z',
    paragraph: 'Run complete.',
    paragraphPreview: 'Run',
    paragraphFull: 'Run complete with map outputs.',
    mapOutputs: outputs ?? [makeMapOutput()],
    chartOutputs: [],
    dataOutputs: [],
  };
}

function makeManifest(
  runId = 'run-publish-001',
  runtimeMode: UrbanWorkflowRunManifest['runtimeMode'] = 'live',
): UrbanWorkflowRunManifest {
  return {
    runId,
    flowId: 'site-suitability' as AnalyticalFlowId,
    contextId: useUrbanContextStore.getState().context?.contextId ?? null,
    inputs: {},
    parameters: {},
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: [],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode,
    readiness: null,
    createdAt: '2026-05-08T10:50:00.000Z',
  };
}

function registerWorkflowRunArtifact(
  run: CompletedAnalysisRun,
  manifest: UrbanWorkflowRunManifest,
): void {
  const contextId = useUrbanContextStore.getState().context?.contextId;
  if (!contextId) throw new Error('Expected test context before registering workflow artifact.');
  useFlowStore.getState().upsertCompletedRun(run);
  useFlowStore.getState().registerManifest(manifest);
  useUrbanContextStore.getState().registerEvidenceArtifact({
    id: `artifact-${run.runId}`,
    kind: 'workflow-run',
    title: `Workflow ${run.runId}`,
    summary: 'Workflow run artifact for publish testing.',
    state: 'active',
    sourceModule: 'urban-analytics',
    linkedContextId: contextId,
    linkedRunId: run.runId,
    provenance: {
      runId: run.runId,
      flowId: run.flowId,
    },
    qa: {
      state: 'unvalidated',
      warnings: [],
      limitations: [],
    },
    createdAt: '2026-05-08T11:00:00.000Z',
    updatedAt: '2026-05-08T11:00:00.000Z',
  });
}

beforeEach(() => {
  exportReproduciblePackageSpy.mockReset();
  exportReproduciblePackageSpy.mockReturnValue({
    packageManifest: {} as never,
    warnings: [],
    filename: 'urban_repro_fixture.json',
    bytes: 1024,
  });

  window.localStorage.clear();
  document.body.innerHTML = '';
  synapseBus._resetForTesting();
  useFlowStore.setState({
    activeFlow: null,
    currentStep: 0,
    stepData: {},
    completedRuns: [],
    manifests: {},
    step: 0,
    eligible: null,
    contraindications: '',
    baselineNotes: '',
    doseMg: 1,
    route: 'IV',
    effect: 'none',
    adverse: '',
  });
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useMapExplorerStore.setState({
    isOpen: false,
    overlayLayers: [{
      id: 'layer-hotspots',
      name: 'Heat risk layer',
      type: 'geojson',
      visible: true,
      opacity: 0.86,
      queryable: true,
      group: 'analysis',
    }],
    activeAnalysisResultLayerIds: [],
  });
});

describe('UrbanEvidenceTray', () => {
  it('renders active context evidence with provenance, QA, references, and truthful disabled actions', async () => {
    registerContextFixture();
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      expect(container.textContent).toContain('Evidence');
      expect(container.textContent).toContain('2 active');
      expect(container.textContent).toContain('Heat exposure cluster layer');
      expect(container.textContent).toContain('Heat workflow reproducibility script');
      expect(container.textContent).toContain('Heat risk layer');
      expect(container.textContent).toContain('Warning');
      expect(container.textContent).toContain('Confidence 72%');
      expect(container.textContent).toContain('Fixture layer is a reference, not raw geometry.');

      const mapRow = rowByText(container, 'Heat exposure cluster layer');
      const ideButton = Array.from(mapRow.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('IDE'),
      );
      expect(ideButton?.disabled).toBe(true);
      expect(ideButton?.getAttribute('title')).toContain('No code file path');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('uses existing bridge contracts for map, IDE, report, and dashboard actions', async () => {
    registerContextFixture();
    const mapEvents: unknown[] = [];
    const scriptEvents: unknown[] = [];
    const navEvents: unknown[] = [];
    const mapSub = synapseBus.on('map.layer.focus', (payload) => mapEvents.push(payload));
    const scriptSub = synapseBus.on('analytics.script.open', (payload) => scriptEvents.push(payload));
    const onNavigate = (event: Event) => navEvents.push((event as CustomEvent).detail);
    window.addEventListener('synapse:navigate', onNavigate);
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      const mapRow = rowByText(container, 'Heat exposure cluster layer');
      const codeRow = rowByText(container, 'Heat workflow reproducibility script');

      await dispatchClick(Array.from(mapRow.querySelectorAll('button')).find((button) => button.textContent?.includes('Map')) ?? null);
      expect(useMapExplorerStore.getState().isOpen).toBe(true);
      expect(useMapExplorerStore.getState().activeAnalysisResultLayerIds).toEqual(['layer-hotspots']);
      expect(mapEvents).toHaveLength(1);
      expect(mapEvents[0]).toMatchObject({
        layerId: 'layer-hotspots',
        artifactId: 'artifact-heat-layer',
        source: 'urban-analytics',
      });

      await dispatchClick(Array.from(codeRow.querySelectorAll('button')).find((button) => button.textContent?.includes('IDE')) ?? null);
      expect(scriptEvents).toHaveLength(1);
      expect(scriptEvents[0]).toMatchObject({
        path: 'analysis/heat_workflow.py',
        artifactId: 'artifact-heat-script',
        source: 'urban-analytics',
      });

      await dispatchClick(Array.from(mapRow.querySelectorAll('button')).find((button) => button.textContent?.includes('Report')) ?? null);
      const pendingInserts = drainPendingInserts();
      expect(pendingInserts).toHaveLength(1);
      expect(pendingInserts[0]?.suggestedTitle).toContain('Heat exposure cluster layer');
      expect(pendingInserts[0]?.sections[0]?.title).toContain('Heat exposure cluster layer');
      expect(pendingInserts[0]?.sections[0]?.badgeLabel).toBe('Urban evidence block');
      expect(pendingInserts[0]?.sections[1]?.title).toContain('Provenance and QA');
      expect(pendingInserts[0]?.sections[1]?.blocks.some((block) =>
        block.kind === 'bullet_list' && block.items.some((item) => item.includes('Fixture layer is a reference')),
      )).toBe(true);
      const updatedSource = useUrbanContextStore.getState().evidenceArtifacts.find((artifact) =>
        artifact.id === 'artifact-heat-layer',
      );
      expect(updatedSource?.reportInsertId).toBe(pendingInserts[0]?.id);
      expect(useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'report-insert' && artifact.reportInsertId === pendingInserts[0]?.id,
      )).toBe(true);
      expect(navEvents).toContainEqual({ tab: 'Report' });

      await dispatchClick(Array.from(mapRow.querySelectorAll('button')).find((button) => button.textContent?.includes('Dashboard')) ?? null);
      expect(navEvents).toContainEqual(expect.objectContaining({
        tab: 'Dashboard',
        dashboardBindingId: 'city.green_space',
        dashboardWidgetType: 'kpi',
      }));
    } finally {
      mapSub.off();
      scriptSub.off();
      window.removeEventListener('synapse:navigate', onNavigate);
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('publishes eligible workflow-run artifacts to Map Explorer from the tray', async () => {
    registerContextFixture();
    const run = makeRun('run-publish-001', [makeMapOutput('pub-output-1'), makeMapOutput('pub-output-2')]);
    registerWorkflowRunArtifact(run, makeManifest(run.runId, 'live'));
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      const row = rowByText(container, 'Workflow run-publish-001');
      const publishButton = Array.from(row.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('Publish'),
      );
      expect(publishButton).toBeTruthy();
      expect(publishButton?.disabled).toBe(false);

      await dispatchClick(publishButton ?? null);

      const mapState = useMapExplorerStore.getState();
      expect(mapState.isOpen).toBe(true);
      expect(mapState.overlayLayers.map((layer) => layer.id)).toEqual([
        'layer-hotspots',
        'urban-pub-run-publish-001-pub-output-1',
        'urban-pub-run-publish-001-pub-output-2',
      ]);
      expect(mapState.activeAnalysisResultLayerIds).toEqual([
        'urban-pub-run-publish-001-pub-output-1',
        'urban-pub-run-publish-001-pub-output-2',
      ]);
      expect(useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'map-layer' && artifact.mapLayerId === 'urban-pub-run-publish-001-pub-output-1',
      )).toBe(true);
      expect(container.textContent).toContain('Published 2 layers to Map Explorer');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('disables publish with a reason for workflow runs with no eligible map output', async () => {
    registerContextFixture();
    const run = makeRun('run-synthetic-001', [makeMapOutput('synthetic-output')]);
    registerWorkflowRunArtifact(run, makeManifest(run.runId, 'synthetic'));
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      const row = rowByText(container, 'Workflow run-synthetic-001');
      const publishButton = Array.from(row.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('Publish'),
      );
      expect(publishButton).toBeTruthy();
      expect(publishButton?.disabled).toBe(true);
      expect(publishButton?.getAttribute('title')).toContain('Synthetic-mode runs cannot be published');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('does not show global registry artifacts when there is no active context', async () => {
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'orphan-artifact',
      kind: 'dataset',
      title: 'Unscoped dataset artifact',
      sourceModule: 'urban-analytics',
      qa: {
        state: 'unvalidated',
        warnings: [],
        limitations: [],
      },
      createdAt: '2026-05-08T10:00:00.000Z',
      updatedAt: '2026-05-08T10:00:00.000Z',
    });
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      expect(container.textContent).toContain('No active Urban Analysis Context');
      expect(container.textContent).not.toContain('Unscoped dataset artifact');
      const exportButton = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Export requires an active Urban Analysis Context"]',
      );
      expect(exportButton).toBeTruthy();
      expect(exportButton?.disabled).toBe(true);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('shows scenario policy interpretation guidance for scenario-comparison run artifacts', async () => {
    const contextId = registerContextFixture();
    const scenarioForm = {
      ...DEFAULT_SCENARIO_COMPARISON_FORM,
      outputTitle: 'Scenario comparison tray fixture',
    };
    const scenarioResult = buildScenarioComparisonResult(scenarioForm);
    const run = buildScenarioComparisonCompletedRun(scenarioForm, scenarioResult, {
      runId: 'run-tray-scenario-001',
      insertedAt: '2026-05-08T12:00:00.000Z',
    });
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest({
      runId: run.runId,
      flowId: 'scenario_comparison',
      contextId,
      inputs: {},
      parameters: {},
      methodValidity: null,
      dataFitness: null,
      mapArtifactIds: [],
      codeArtifactIds: [],
      reportInsertIds: [],
      dashboardBindingIds: [],
      indicatorResultIds: [],
      runtimeMode: 'demo',
      readiness: null,
      createdAt: '2026-05-08T12:00:00.000Z',
    });
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-tray-scenario-run',
      kind: 'workflow-run',
      title: 'Scenario policy guidance artifact',
      summary: 'Scenario comparison artifact used to verify guidance rendering.',
      state: 'active',
      sourceModule: 'urban-analytics',
      linkedContextId: contextId,
      linkedRunId: run.runId,
      flowId: 'scenario_comparison',
      provenance: {
        runId: run.runId,
        flowId: 'scenario_comparison',
      },
      qa: {
        state: 'warning',
        warnings: [],
        limitations: [],
      },
      createdAt: '2026-05-08T12:00:00.000Z',
      updatedAt: '2026-05-08T12:00:00.000Z',
    });

    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      const row = rowByText(container, 'Scenario policy guidance artifact');
      await dispatchClick(row.querySelector('.ua-evidence-titleCell'));

      expect(container.textContent).toContain('Policy interpretation guidance');
      expect(container.textContent).toContain('guidance');
      expect(container.textContent).toContain('run-tray-scenario-001-comparison');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('exports a reproducible package from the tray header', async () => {
    registerContextFixture();
    const { container, root } = mountTray();

    try {
      await act(async () => {
        root.render(<UrbanEvidenceTray initialExpanded />);
      });

      const exportButton = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Export reproducible package JSON"]',
      );
      expect(exportButton).toBeTruthy();
      expect(exportButton?.disabled).toBe(false);

      await dispatchClick(exportButton ?? null);

      expect(exportReproduciblePackageSpy).toHaveBeenCalledTimes(1);
      expect(container.textContent).toContain('Exported urban_repro_fixture.json (1024 bytes).');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
