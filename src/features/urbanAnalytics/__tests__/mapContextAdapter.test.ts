// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMapExplorerContextSummary } from '@/centerpanel/components/map/mapContextSummary';
import type { DrawnFeature, MapReproducibilityManifest, OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import type { MapScientificQAState } from '@/services/map/MapScientificQA';
import { buildMapToUrbanContextPayload } from '@/services/map/bridge/MapUrbanBridgeService';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useUrbanStore } from '../store';
import { useUrbanContextStore } from '../useUrbanContextStore';
import {
  applyMapContextToUrban,
  buildMapToUrbanContextSummary,
  subscribeMapContextToUrban,
} from '../context/mapContextAdapter';

function makeLayer(id: string, overrides?: Partial<OverlayLayerConfig>): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: 'geojson',
    visible: true,
    opacity: 1,
    sourceData: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[29, 41], [29.1, 41], [29.1, 41.1], [29, 41.1], [29, 41]]],
          },
          properties: {
            district: 'Kadikoy',
            capture_date: '2025-01-10',
            population: 1200,
          },
        },
      ],
    },
    metadata: {
      featureCount: 1,
      datasetContext: {
        datasetId: 'dataset-1',
        crs: 'EPSG:4326',
      },
    },
    ...overrides,
  };
}

function makeQaState(): MapScientificQAState {
  return {
    status: 'warning',
    checkedAt: '2026-05-08T10:00:00.000Z',
    issues: [
      {
        id: 'qa:layer-1:geometry:missing-crs',
        code: 'missing-crs',
        category: 'crs',
        severity: 'warning',
        title: 'Missing CRS metadata',
        explanation: 'Layer lacks full CRS declaration.',
        suggestedFix: 'Provide EPSG metadata.',
        layerId: 'layer-1',
      },
    ],
    layerSummaries: [],
    metadata: {
      generatedBy: 'MapScientificQA',
      version: 1,
      signature: 'qa-signature-1',
      visibleLayerCount: 1,
      workerLayerCount: 0,
      issueCounts: {
        info: 0,
        warning: 1,
        error: 0,
        blocker: 0,
      },
    },
  };
}

function makeAoi(id: string): DrawnFeature {
  return {
    id,
    geometry: {
      type: 'Polygon',
      coordinates: [[[28.95, 40.95], [29.15, 40.95], [29.15, 41.15], [28.95, 41.15], [28.95, 40.95]]],
    },
    properties: {
      label: id,
      createdAt: '2026-05-08T10:00:00.000Z',
    },
  };
}

function makeBridgePayload(layer: OverlayLayerConfig, activeAoiId = 'aoi-kadikoy') {
  const drawnFeatures = [makeAoi(activeAoiId)];
  const contextSummary = buildMapExplorerContextSummary({
    center: [29, 41],
    zoom: 11,
    bearing: 0,
    pitch: 0,
    activeBaseLayer: 'dark',
    overlayLayers: [layer],
    drawnFeatures,
    activeAoiId,
    selectedFeatureIds: {},
    activeAnalysisResultLayerIds: [],
    scientificQA: null,
    currentMapBounds: [28.9, 40.9, 29.2, 41.2],
    currentMapBoundsUpdatedAt: '2026-05-08T10:00:00.000Z',
  });
  return buildMapToUrbanContextPayload({
    contextSummary,
    overlayLayers: [layer],
    drawnFeatures,
    activeAoiId,
    now: '2026-05-08T10:00:00.000Z',
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useUrbanStore.setState(useUrbanStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('buildMapToUrbanContextSummary', () => {
  it('builds lightweight map context summary with fields, temporal hints, CRS and QA', () => {
    const layer = makeLayer('layer-1');

    const summary = buildMapToUrbanContextSummary({
      activeAoiId: 'aoi-1',
      overlayLayers: [layer],
      selectedFeatureIds: { 'layer-1': ['f-1', 'f-2'] },
      activeAnalysisResultLayerIds: ['analysis-1'],
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      scientificQA: makeQaState(),
    });

    expect(summary.aoiReference.aoiId).toBe('aoi-1');
    expect(summary.layerIds).toEqual(['layer-1']);
    expect(summary.featureCountSummary.total).toBe(1);
    expect(summary.crsSummary.distinct).toEqual(['EPSG:4326']);
    expect(summary.temporalFields).toContain('capture_date');
    expect(summary.selectionSummary[0]).toMatchObject({ layerId: 'layer-1', selectedFeatureCount: 2 });
    expect(summary.qaSummary.status).toBe('warning');
    expect(summary.recommendationHints.length).toBeGreaterThan(0);
  });
});

describe('applyMapContextToUrban', () => {
  it('creates or updates urban context and registers map-origin evidence by reference', () => {
    const layer = makeLayer('layer-1');
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

    const result = applyMapContextToUrban({
      mapState: {
        activeAoiId: 'aoi-kadikoy',
        overlayLayers: [layer],
        selectedFeatureIds: { 'layer-1': ['f-1'] },
        activeAnalysisResultLayerIds: ['analysis-1'],
        currentMapBounds: [28.9, 40.9, 29.2, 41.2],
        scientificQA: makeQaState(),
      },
      triggerRecommendations: true,
    });

    const context = useUrbanContextStore.getState().context;
    expect(context).not.toBeNull();
    expect(context?.activeAoiId).toBe('aoi-kadikoy');
    expect(context?.activeLayerIds).toEqual(['layer-1']);

    const artifacts = useUrbanContextStore.getState().evidenceArtifacts;
    const artifact = artifacts.find((entry) => entry.id === result.evidenceArtifactId);
    expect(artifact).toBeDefined();
    expect(artifact?.sourceModule).toBe('map-explorer');
    expect(artifact?.linkedLayerIds).toEqual(['layer-1']);

    expect(useUrbanStore.getState().recMode).toBe(true);
    expect(result.recommendationTriggered).toBe(true);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('registers visible attributed recommendations and conservative fitness from a bridge payload', () => {
    const layer = makeLayer('demo-polygons', {
      sourceKind: 'demo',
      metadata: {
        featureCount: 45,
        crsSummary: { crs: 'EPSG:3857', status: 'known', source: 'explicit', notes: [] },
        geometrySummary: { geometryType: 'Polygon', geometryTypes: ['Polygon'], featureCount: 45, source: 'explicit', notes: [] },
        schemaSummary: {
          fieldCount: 1,
          fields: [{ name: 'numeric_indicator', role: 'attribute' }],
          source: 'explicit',
          notes: [],
        },
      },
    });

    const result = applyMapContextToUrban({
      payload: makeBridgePayload(layer),
      triggerRecommendations: true,
    });
    const artifact = useUrbanContextStore.getState().evidenceArtifacts
      .find((entry) => entry.id === result.evidenceArtifactId);

    expect(result.summary.recommendationHints.join(' ')).toContain('based on: Layer demo-polygons / AOI aoi-kadikoy');
    expect(artifact?.summary).toContain('based on: Layer demo-polygons / AOI aoi-kadikoy');
    expect(artifact?.dataFitness?.status).not.toBe('ready');
    expect(artifact?.dataFitness?.issues.some((issue) => issue.code === 'demo_data')).toBe(true);
  });

  it('publishes a model result as evidence referencing its bridge-carried manifest', () => {
    const modelManifest: MapReproducibilityManifest = {
      version: 1,
      manifestId: 'manifest-model-transit-abc123',
      workflowId: 'model:transit-access:exec-1',
      status: 'applied',
      createdAt: '2026-05-26T09:00:00.000Z',
      mapContextId: 'map-model-context',
      operation: 'model.execute',
      workflowKind: 'model.transit-access',
      inputLayerIds: ['model-source'],
      sourceLayerIds: ['model-source'],
      outputLayerIds: ['model-result'],
      sourceLayers: [{ layerId: 'model-source', role: 'source', name: 'Source' }],
      outputLayers: [{ layerId: 'model-result', role: 'derived', name: 'Result' }],
      aoiReference: { source: 'model-input', selectedLayerIds: ['model-source'], selectedFeatureCount: 0, drawnPolygonCount: 0 },
      viewportBounds: null,
      parameters: { manifestHash: 'abc123', stepCount: 2 },
      crsSummary: { status: 'known', displayCrs: 'EPSG:4326', sourceLayerCrs: [{ layerId: 'model-source', crs: 'EPSG:3857' }], missingLayerIds: [], notes: [] },
      qaSummary: { status: 'passed', issueIds: [], blockerCount: 0, warningCount: 0, infoCount: 0, blockers: [], warnings: [], caveats: [] },
      expectedOutput: { layerName: 'Result', geometryClass: 'Polygon', featureCount: 1, bounds: null, outputLayerGroup: 'analysis', needsWorker: false, reportCompatible: true, dashboardCompatible: true, ideCompatible: true },
      handoffReferences: { reportItemIds: [], dashboardBindingIds: [], ideArtifactIds: [] },
      qaIssueIds: [],
      sourceDataVersions: { 'model-source': 'v1' },
      engine: 'MapWorkflowService',
      engineVersion: 'map-model-builder-1',
    };
    const layer = makeLayer('model-result', {
      sourceKind: 'derived',
      metadata: {
        featureCount: 1,
        geometryType: 'Polygon',
        crsSummary: { crs: 'EPSG:3857', status: 'known', source: 'analysis-result', notes: [] },
        reproducibilityManifest: modelManifest,
      },
    });
    const payload = makeBridgePayload(layer);

    const result = applyMapContextToUrban({
      payload,
      triggerRecommendations: false,
      modelResult: {
        modelId: 'transit-access',
        modelTitle: 'Transit access coverage',
        manifestId: modelManifest.manifestId,
        manifestHash: 'abc123',
        workflowId: modelManifest.workflowId,
        outputLayerId: layer.id,
        sourceLayerIds: ['model-source'],
        stepCount: 2,
        batchTargetCount: 1,
        runtimeMode: 'unknown',
      },
    });
    const artifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.id === result.evidenceArtifactId);

    expect(payload.workflowSummary.manifestIds).toContain(modelManifest.manifestId);
    expect(artifact?.title).toBe('Map model result: Transit access coverage');
    expect(artifact?.metadata).toMatchObject({
      mapModelManifestId: modelManifest.manifestId,
      mapModelManifestHash: 'abc123',
      mapModelManifestLinked: true,
    });
    expect(artifact?.linkedLayerIds).toContain('model-result');
    expect(artifact?.qa.state).toBe('warning');
    expect(artifact?.qa.warnings.join(' ')).toContain('runtime mode is unknown');
  });
});

describe('subscribeMapContextToUrban', () => {
  it('syncs map changes into urban context on subscription updates', () => {
    const unsubscribe = subscribeMapContextToUrban({
      debounceMs: 50,
      triggerRecommendations: false,
      runInitialSync: true,
    });

    useMapExplorerStore.getState().replaceDrawnFeatures([makeAoi('aoi-2')]);
    useMapExplorerStore.getState().replaceOverlayLayers([makeLayer('layer-sub')]);

    vi.advanceTimersByTime(60);

    const context = useUrbanContextStore.getState().context;
    expect(context?.activeAoiId).toBe('aoi-2');
    expect(context?.activeLayerIds).toEqual(['layer-sub']);

    unsubscribe();
  });
});
