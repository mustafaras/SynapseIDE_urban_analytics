// @vitest-environment jsdom

import React, { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRoot } from 'react-dom/client';

import { drainPendingInserts } from '@/services/reporting/storage';
import { subscribeUrbanToMapMethodRequests } from '@/services/map/bridge/MapUrbanBridgeService';
import { usePanelBridgeStore } from '@/stores/usePanelBridgeStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';

import type { AnalyticalFlowId, Card } from '../lib/types';
import RightPanelFourBlock from '../RightPanelFourBlock';
import { assembleFourBlock } from '../rightPanelUtils';
import { computeUrbanDataFitnessProfile } from '../context/dataFitness';
import { requireUrbanMethodValidityEnvelopePreset } from '../context/methodValidity';
import { useUrbanContextStore } from '../useUrbanContextStore';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LEGACY_PLACEHOLDERS = [
  'No methodology details yet.',
  'No data requirements specified.',
  'No code snippets available.',
  'No references listed.',
  'Curated methodology support is currently unavailable for this selection.',
  'Curated data guidance is currently unavailable for this selection.',
  'Curated code guidance is currently unavailable for this selection.',
  'Curated references are currently unavailable for this selection.',
];

function mountPanel() {
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

async function clickTab(container: HTMLElement, label: string): Promise<void> {
  const tab = Array.from(container.querySelectorAll('[role="tab"]')).find((node) =>
    node.textContent?.includes(label),
  );
  expect(tab).toBeTruthy();
  await dispatchClick(tab ?? null);
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '';
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  usePanelBridgeStore.setState({
    activeTab: 'Projects',
    activeFlowId: null,
    activeReportSlot: null,
    contextTags: [],
    insertedCardIds: [],
    contextCardVisible: true,
  });
  useMapExplorerStore.setState({ isOpen: false });
});

describe('RightPanelFourBlock', () => {
  it('emits a typed polygon method request when Prepare in Map is selected', async () => {
    const validityEnvelope = requireUrbanMethodValidityEnvelopePreset('card:ss-morans-i');
    const card: Card = {
      id: 'ss-morans-i',
      title: "Global Moran's I",
      sectionId: 'spatial_stats',
      summary: 'Measure spatial autocorrelation.',
      tags: ['spatial_stats'],
      methodology: 'Assess a numeric indicator across polygon zones.',
      validityEnvelope,
      capabilityStatus: validityEnvelope.capabilityStatus,
    };
    const requests: unknown[] = [];
    const unsubscribe = subscribeUrbanToMapMethodRequests((payload) => requests.push(payload));
    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={card} />);
      });
      await dispatchClick(container.querySelector("[data-testid='urban-method-prepare-in-map']"));

      expect(useMapExplorerStore.getState().isOpen).toBe(true);
      expect(requests).toContainEqual(expect.objectContaining({
        version: 1,
        methodId: 'ss-morans-i',
        sourceModule: 'urban-analytics',
        destinationModule: 'map-explorer',
        methodValidity: expect.objectContaining({ status: 'complete', capabilityStatus: 'implemented' }),
        requirements: expect.objectContaining({
          layer: expect.objectContaining({
            geometryTypes: ['polygon'],
            requiredFields: ['numeric_indicator'],
          }),
        }),
      }));
    } finally {
      unsubscribe();
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('renders substantive fallbacks for sparse cards instead of the legacy placeholders', async () => {
    const sparseCard: Card = {
      id: 'synthetic-right-panel-fallback',
      title: 'Synthetic Sparse Indicator',
      sectionId: 'urban_indicators',
      summary: 'Benchmark travel behaviour across zones without authored panel support.',
      tags: [],
    };

    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={sparseCard} />);
      });

      const methodologyPanel = container.querySelector('#rp-tabpanel-methodology');
      expect(methodologyPanel?.textContent).toContain('Methodological framing');

      await clickTab(container, 'Data Fitness');
      const dataPanel = container.querySelector('#rp-tabpanel-data');
      expect(dataPanel?.textContent).toMatch(/Representative Inputs|Common Toolchain|Comparable Use Cases|Analytical Prerequisites/);
      expect(dataPanel?.textContent).toContain('Data fitness has not been evaluated for this card.');

      await clickTab(container, 'Code & Repro');
      const codePanel = container.querySelector('#rp-tabpanel-code .rp-prompt-code');
      expect(codePanel?.textContent ?? '').toMatch(/Related Urban Indicators & Indices example:|starter scaffold/);

      await clickTab(container, 'Evidence & Refs');
      const referencesPanel = container.querySelector('#rp-tabpanel-references .rp-ref-item');
      expect((referencesPanel?.textContent ?? '').trim().length).toBeGreaterThan(16);

      for (const placeholder of LEGACY_PLACEHOLDERS) {
        expect(container.textContent).not.toContain(placeholder);
      }
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('renders method validity, data fitness, and linked evidence truthfully', async () => {
    const validityEnvelope = requireUrbanMethodValidityEnvelopePreset('card:ss-morans-i');
    const moranCard: Card = {
      id: 'ss-morans-i',
      title: "Global Moran's I",
      sectionId: 'spatial_stats',
      summary: 'Measure global spatial autocorrelation for a numeric indicator.',
      tags: ['spatial_stats'],
      methodology: 'Compute a global autocorrelation statistic against a declared spatial weights matrix.',
      evidence: ['Moran, P. A. P. (1950). Notes on continuous stochastic phenomena.'],
      prompts: ['print("moran")'],
      validityEnvelope,
      capabilityStatus: validityEnvelope.capabilityStatus,
    };

    const dataFitness = computeUrbanDataFitnessProfile({
      layers: [{
        id: 'layer-zones',
        name: 'District indicator zones',
        geometryType: 'Polygon',
        crs: 'EPSG:3857',
        fields: ['numeric_indicator'],
        featureCount: 45,
        license: 'Open data',
        temporalDate: '2026-01-01T00:00:00.000Z',
        scale: 'city',
        missingValueCount: 0,
        totalValueCount: 45,
      }],
      requiredFields: ['numeric_indicator'],
      requiredGeometryTypes: ['polygon'],
      minimumFeatureCount: 30,
      analysisScale: 'city',
      sourceScale: 'city',
      computedAt: '2026-05-08T00:00:00.000Z',
    });

    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-moran-fitness',
      kind: 'workflow-run',
      title: 'Moran fitness screening run',
      sourceModule: 'urban-analytics',
      cardId: moranCard.id,
      flowId: 'indicator_composite',
      linkedLayerIds: ['layer-zones'],
      dataFitness,
      qa: {
        state: 'warning',
        warnings: ['Review spatial weights before formal interpretation.'],
        limitations: ['Compatibility fixture only.'],
      },
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    });

    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={moranCard} />);
      });

      expect(container.textContent).toContain('Implemented');
      expect(container.textContent).toContain('Metadata complete');
      expect(container.textContent).toContain('Evidence 1');
      expect(container.textContent).toContain('spatial weights matrix');
      expect(container.textContent).toContain('A significant result shows spatial patterning');

      await clickTab(container, 'Data Fitness');
      expect(container.querySelector('#rp-tabpanel-data')?.textContent).toContain('Source layers: layer-zones');
      expect(container.querySelector('#rp-tabpanel-data')?.textContent).toContain('Score');

      await clickTab(container, 'Evidence & Refs');
      expect(container.querySelector('#rp-tabpanel-references')?.textContent).toContain('Moran fitness screening run');
      expect(container.querySelector('#rp-tabpanel-references')?.textContent).toContain('QA warning');
      expect(container.querySelector('#rp-tabpanel-references')?.textContent).toContain('Open Flow');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('keeps authored card content ahead of section-derived fallbacks', () => {
    const directCard: Card = {
      id: 'synthetic-right-panel-direct',
      title: 'Direct Authored Indicator',
      sectionId: 'urban_indicators',
      summary: 'Direct summary.',
      tags: [],
      methodology: 'Direct methodology.',
      datasets: ['Authoritative dataset'],
      tools: ['GeoPandas'],
      examples: ['Author comparison'],
      evidence: ['Direct citation'],
      prompts: ['print("authored")'],
      limitations: 'Direct limitation.',
    };

    const assembled = assembleFourBlock(directCard);

    expect(assembled.info).toContain('Direct methodology.');
    expect(assembled.info).toContain('Direct limitation.');
    expect(assembled.examples.map((example) => example.label)).toEqual(['Datasets', 'Tools', 'Examples']);
    expect(assembled.commands[0]?.text).toBe('print("authored")');
    expect(assembled.references[0]?.title).toBe('Direct citation');
  });

  it('inserts method-card report actions as structured evidence blocks', async () => {
    const validityEnvelope = requireUrbanMethodValidityEnvelopePreset('card:ss-morans-i');
    const moranCard: Card = {
      id: 'ss-morans-i',
      title: "Global Moran's I",
      sectionId: 'spatial_stats',
      summary: 'Measure global spatial autocorrelation for a numeric indicator.',
      tags: ['spatial_stats'],
      methodology: 'Compute a global autocorrelation statistic against a declared spatial weights matrix.',
      datasets: ['Polygon zones with numeric indicator'],
      tools: ['PySAL', 'GeoPandas'],
      evidence: ['Moran, P. A. P. (1950). Notes on continuous stochastic phenomena.'],
      prompts: ['print("moran")'],
      limitations: 'Interpretation depends on spatial weights and aggregation units.',
      validityEnvelope,
      capabilityStatus: validityEnvelope.capabilityStatus,
    };
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'istanbul-method-report',
      studyAreaName: 'Istanbul method report study',
      activeLayerIds: ['layer-zones'],
      activeFlowId: 'indicator_composite' as AnalyticalFlowId,
    });
    const navEvents: unknown[] = [];
    const onNavigate = (event: Event) => navEvents.push((event as CustomEvent).detail);
    window.addEventListener('synapse:navigate', onNavigate);
    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={moranCard} />);
      });

      const reportButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('To Report'),
      );
      expect(reportButton).toBeTruthy();
      await dispatchClick(reportButton ?? null);

      const inserts = drainPendingInserts();
      expect(inserts).toHaveLength(1);
      expect(inserts[0]?.suggestedTitle).toContain("Global Moran's I");
      expect(inserts[0]?.sections[0]?.badgeLabel).toBe('Urban evidence block');
      expect(inserts[0]?.sections[1]?.title).toContain('Provenance and QA');
      expect(inserts[0]?.sections[1]?.blocks.some((block) =>
        block.kind === 'bullet_list' && block.items.some((item) => item.includes('spatial weights')),
      )).toBe(true);
      expect(navEvents).toContainEqual({ tab: 'Report' });
      expect(usePanelBridgeStore.getState().insertedCardIds).toContain(moranCard.id);
      expect(useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'method-card' && artifact.cardId === moranCard.id && artifact.reportInsertId === inserts[0]?.id,
      )).toBe(true);
      expect(useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'report-insert' && artifact.reportInsertId === inserts[0]?.id,
      )).toBe(true);
    } finally {
      window.removeEventListener('synapse:navigate', onNavigate);
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('opens a linked learning path and registers an education-link artifact', async () => {
    const card: Card = {
      id: 'ss-morans-i',
      title: "Spatial Autocorrelation (Moran's I)",
      sectionId: 'spatial_stats',
      summary: 'Measure global spatial autocorrelation for a numeric indicator.',
      tags: ['spatial_stats'],
      methodology: '1. Define a spatial weights matrix.\n2. Compare each value with its neighbors.\n3. Interpret significance conservatively.',
      limitations: 'Results depend on the weights matrix and study boundary.',
      learningPath: {
        methodId: 'ss-morans-i',
        workflowId: 'indicator_composite',
        pathId: 'spatial_statistics_planners',
        explainerId: 'morans_i',
        concepts: ['spatial weights', 'autocorrelation'],
        prerequisites: ['Polygon observations with a numeric field'],
        intermediateValues: [{
          label: 'Permutation baseline',
          description: 'Inspect the null distribution before trusting the p-value.',
          source: 'methodology',
        }],
        interpretationPrompts: ['How does the weights matrix alter the conclusion?'],
        teachingSteps: [{
          id: 'assumption-weights',
          title: 'Interrogate the weights matrix',
          source: 'assumption',
          note: 'Learners should justify why the neighborhood definition is analytically defensible.',
        }],
      },
    };

    useUrbanContextStore.getState().createContext({
      studyAreaId: 'istanbul-education',
      studyAreaName: 'Istanbul education study',
      activeFlowId: 'indicator_composite' as AnalyticalFlowId,
    });
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-moran-method',
      kind: 'method-card',
      title: 'Moran method evidence',
      sourceModule: 'urban-analytics',
      cardId: card.id,
      qa: { state: 'valid', warnings: [], limitations: [] },
      createdAt: '2026-05-09T12:00:00.000Z',
      updatedAt: '2026-05-09T12:00:00.000Z',
    });

    const navEvents: unknown[] = [];
    const onNavigate = (event: Event) => navEvents.push((event as CustomEvent).detail);
    window.addEventListener('synapse:navigate', onNavigate);
    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={card} />);
      });

      expect(container.textContent).toContain('Learning path handoff');

      const openLearningPathButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('Open learning path'),
      );
      expect(openLearningPathButton).toBeTruthy();
      expect(openLearningPathButton?.disabled).toBe(false);

      await dispatchClick(openLearningPathButton ?? null);

      expect(navEvents).toContainEqual(expect.objectContaining({
        tab: 'Education',
        educationView: 'paths',
        educationPathId: 'spatial_statistics_planners',
        educationExplainerId: 'morans_i',
      }));

      const educationArtifact = useUrbanContextStore.getState().evidenceArtifacts.find((artifact) =>
        artifact.kind === 'education-link' && artifact.cardId === card.id,
      );
      expect(educationArtifact).toBeDefined();
      expect(educationArtifact?.linkedArtifactIds).toContain('artifact-moran-method');
      expect(educationArtifact?.educationLinkId).toContain('urban-education-link');
    } finally {
      window.removeEventListener('synapse:navigate', onNavigate);
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it('falls back to workflow learning-path metadata when the card has no direct education metadata', async () => {
    const card: Card = {
      id: 'synthetic-accessibility-card',
      title: 'Accessibility screening card',
      sectionId: 'thematic_analysis',
      summary: 'Synthetic accessibility card for flow-level education handoff coverage.',
      tags: ['accessibility'],
      methodology: '1. Build a network cost surface.\n2. Aggregate reachable opportunities.',
    };

    const navEvents: unknown[] = [];
    const onNavigate = (event: Event) => navEvents.push((event as CustomEvent).detail);
    window.addEventListener('synapse:navigate', onNavigate);
    const { container, root } = mountPanel();

    try {
      await act(async () => {
        root.render(<RightPanelFourBlock card={card} />);
      });

      expect(container.textContent).toContain('Learning path handoff');
      expect(container.textContent).toContain('Accessibility & Equity Analysis');

      const openLearningPathButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
        button.textContent?.includes('Open learning path'),
      );
      expect(openLearningPathButton).toBeTruthy();

      await dispatchClick(openLearningPathButton ?? null);

      expect(navEvents).toContainEqual(expect.objectContaining({
        tab: 'Education',
        educationPathId: 'accessibility_equity_analysis',
        educationExplainerId: 'hansen_accessibility',
      }));
    } finally {
      window.removeEventListener('synapse:navigate', onNavigate);
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
