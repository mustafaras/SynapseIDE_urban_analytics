// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import { useFlowStore } from '@/stores/useFlowStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import type {
  AnalyticalFlowId,
  CompletedAnalysisRun,
  MapOutput,
  UrbanWorkflowRunManifest,
} from '../../lib/types';
import { useUrbanContextStore } from '../../useUrbanContextStore';
import {
  buildUrbanReproduciblePackageFromActiveContext,
} from '../reproduciblePackageExport';

function makeMapOutput(id = 'output-1'): MapOutput {
  return {
    id,
    type: 'choropleth',
    title: `Output ${id}`,
    geojson: {
      type: 'FeatureCollection',
      features: [],
    },
  };
}

function makeRun(runId = 'run-1'): CompletedAnalysisRun {
  return {
    runId,
    flowId: 'site_suitability' as AnalyticalFlowId,
    label: `Run ${runId}`,
    insertedAt: '2026-05-09T09:00:00.000Z',
    paragraph: 'Run complete.',
    paragraphPreview: 'Run complete.',
    paragraphFull: 'Run complete with reproducibility metadata.',
    mapOutputs: [makeMapOutput('map-output-1')],
    chartOutputs: [],
    dataOutputs: [],
  };
}

function makeManifest(runId = 'run-1'): UrbanWorkflowRunManifest {
  return {
    runId,
    flowId: 'site_suitability',
    contextId: useUrbanContextStore.getState().context?.contextId ?? null,
    inputs: {
      zoneLayerId: 'layer-1',
      valueField: 'risk_score',
    },
    parameters: {
      weighting: 'equal',
    },
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: ['map-artifact-1'],
    codeArtifactIds: ['code-1'],
    reportInsertIds: ['report-1'],
    dashboardBindingIds: ['dashboard-1'],
    indicatorResultIds: [],
    runtimeMode: 'live',
    readiness: null,
    createdAt: '2026-05-09T09:00:00.000Z',
  };
}

beforeEach(() => {
  window.localStorage.clear();

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
    overlayLayers: [
      {
        id: 'layer-1',
        name: 'Layer 1',
        type: 'geojson',
        visible: true,
        opacity: 0.9,
        queryable: true,
        group: 'analysis',
      },
    ],
    activeAnalysisResultLayerIds: [],
  });
});

describe('reproduciblePackageExport', () => {
  it('builds a reproducible package from active context with linked references', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'study-1',
      studyAreaName: 'Istanbul QA Study',
      activeLayerIds: ['layer-1'],
      activeRunId: 'run-1',
      activeCodeArtifactId: 'code-1',
    });

    const contextId = useUrbanContextStore.getState().context?.contextId;
    expect(contextId).toBeTruthy();

    const run = makeRun('run-1');
    const manifest = makeManifest('run-1');
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest(manifest);

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-run-1',
      kind: 'workflow-run',
      title: 'Workflow run evidence',
      sourceModule: 'urban-analytics',
      linkedContextId: contextId as string,
      linkedRunId: 'run-1',
      qa: { state: 'unvalidated', warnings: [], limitations: [] },
      provenance: { runId: 'run-1', flowId: 'site_suitability' },
    });

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'map-artifact-1',
      kind: 'map-layer',
      title: 'Map publication evidence',
      sourceModule: 'map-explorer',
      linkedContextId: contextId as string,
      linkedRunId: 'run-1',
      linkedLayerIds: ['layer-1'],
      mapLayerId: 'layer-1',
      qa: { state: 'valid', warnings: [], limitations: [] },
      provenance: { runId: 'run-1', layerIds: ['layer-1'] },
    });

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'code-artifact-1',
      kind: 'code-artifact',
      title: 'Python reproducibility script',
      sourceModule: 'synapse-ide',
      linkedContextId: contextId as string,
      linkedRunId: 'run-1',
      linkedFilePaths: ['analysis/run_1.py'],
      codeArtifactId: 'code-1',
      qa: { state: 'valid', warnings: [], limitations: [] },
      provenance: { runId: 'run-1', filePaths: ['analysis/run_1.py'] },
    });

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'report-artifact-1',
      kind: 'report-insert',
      title: 'Report insert reference',
      sourceModule: 'reporting',
      linkedContextId: contextId as string,
      linkedRunId: 'run-1',
      reportInsertId: 'report-1',
      qa: { state: 'valid', warnings: [], limitations: [] },
      provenance: { runId: 'run-1' },
    });

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'dashboard-artifact-1',
      kind: 'dashboard-binding',
      title: 'Dashboard binding reference',
      sourceModule: 'dashboard',
      linkedContextId: contextId as string,
      linkedRunId: 'run-1',
      dashboardBindingId: 'dashboard-1',
      qa: { state: 'valid', warnings: [], limitations: [] },
      provenance: { runId: 'run-1' },
    });

    const result = buildUrbanReproduciblePackageFromActiveContext({
      createdAt: '2026-05-09T09:30:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.packageManifest).not.toBeNull();

    const pkg = result.packageManifest!;
    expect(pkg.context.contextId).toBe(contextId);
    expect(pkg.runManifests).toHaveLength(1);
    expect(pkg.runManifests[0]?.runId).toBe('run-1');
    expect(pkg.codeArtifactReferences.some((entry) => entry.codeArtifactId === 'code-1')).toBe(true);
    expect(pkg.reportBindings.some((entry) => entry.reportInsertId === 'report-1')).toBe(true);
    expect(pkg.dashboardBindings.some((entry) => entry.dashboardBindingId === 'dashboard-1')).toBe(true);
    expect(pkg.mapLayerReferences.some((entry) => entry.layerId === 'layer-1')).toBe(true);
    expect(pkg.environmentNotes.exportMode).toBe('manifest_only');
    expect(result.warnings).toHaveLength(0);
  });

  it('reports missing references for unresolved active run and code artifact', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: null,
      activeRunId: 'run-missing',
      activeCodeArtifactId: 'code-missing',
      activeLayerIds: ['layer-404'],
    });

    const result = buildUrbanReproduciblePackageFromActiveContext({
      createdAt: '2026-05-09T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.packageManifest).not.toBeNull();

    const warningCodes = result.warnings.map((entry) => entry.code);
    expect(warningCodes).toContain('missing_study_area_reference');
    expect(warningCodes).toContain('missing_active_run_reference');
    expect(warningCodes).toContain('missing_run_manifest');
    expect(warningCodes).toContain('missing_active_code_artifact_reference');
    expect(warningCodes).toContain('missing_map_layer_reference');
  });

  it('serializes package manifest to JSON fixture shape', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'fixture-study',
      activeLayerIds: ['layer-1'],
    });

    const result = buildUrbanReproduciblePackageFromActiveContext({
      createdAt: '2026-05-09T11:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    const pkg = result.packageManifest!;

    const fixture = JSON.parse(JSON.stringify(pkg)) as Record<string, unknown>;
    expect(fixture.packageId).toBeTypeOf('string');
    expect(fixture.context).toBeTruthy();
    expect(Array.isArray(fixture.runManifests)).toBe(true);
    expect(Array.isArray(fixture.evidenceArtifacts)).toBe(true);
    expect(Array.isArray(fixture.dataReferences)).toBe(true);
    expect(Array.isArray(fixture.mapLayerReferences)).toBe(true);
    expect(Array.isArray(fixture.codeArtifactReferences)).toBe(true);
    expect(Array.isArray(fixture.reportBindings)).toBe(true);
    expect(Array.isArray(fixture.dashboardBindings)).toBe(true);
    expect(fixture.environmentNotes).toBeTruthy();
    expect(Array.isArray(fixture.limitations)).toBe(true);
    expect(Array.isArray(fixture.validationWarnings)).toBe(true);
    expect(fixture.createdAt).toBe('2026-05-09T11:00:00.000Z');
  });
});
