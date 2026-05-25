// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useFlowStore } from '@/stores/useFlowStore';
import { useUrbanContextStore } from '../useUrbanContextStore';
import {
  assessPublicationEligibility,
  publishUrbanRunOutputsToMap,
  supersedePublishedUrbanMapEvidenceForLayerChange,
} from '../context/mapEvidencePublisher';
import { fcMissingCrs } from '@/centerpanel/components/map/__tests__/fixtures/gisFixtures';
import type {
  AnalyticalFlowId,
  CompletedAnalysisRun,
  MapOutput,
  UrbanWorkflowRunManifest,
} from '../lib/types';

// ---------------------------------------------------------------------------
// Minimal helpers
// ---------------------------------------------------------------------------

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
          geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
          properties: { value: 42 },
        },
      ],
    },
    ...overrides,
  };
}

function makeRun(runId = 'run-1', outputs?: MapOutput[]): CompletedAnalysisRun {
  return {
    runId,
    flowId: 'site-suitability' as AnalyticalFlowId,
    label: `Test run ${runId}`,
    insertedAt: '2026-06-01T12:00:00.000Z',
    paragraph: 'Analysis complete.',
    paragraphPreview: 'Analysis',
    paragraphFull: 'Analysis complete. Results are ready.',
    mapOutputs: outputs ?? [makeMapOutput()],
    chartOutputs: [],
    dataOutputs: [],
  };
}

function makeManifest(
  runId = 'run-1',
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
    createdAt: '2026-06-01T11:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
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
  useUrbanContextStore.getState().createContext({
    studyAreaId: 'publication-test-area',
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// assessPublicationEligibility
// ---------------------------------------------------------------------------

describe('assessPublicationEligibility', () => {
  it('returns ineligible when run has no mapOutputs', () => {
    const run = makeRun('r1', []);
    const result = assessPublicationEligibility(run, 'output-1', null);
    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('returns ineligible when outputId is not found', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const result = assessPublicationEligibility(run, 'nonexistent-output', null);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('nonexistent-output'))).toBe(true);
  });

  it('returns ineligible for synthetic runtimeMode', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'synthetic');
    const result = assessPublicationEligibility(run, 'output-1', manifest);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes('synthetic'))).toBe(true);
  });

  it('returns ineligible when output is not a renderable FeatureCollection', () => {
    const run = makeRun('r1', [makeMapOutput('bad-output', { geojson: { type: 'Feature' } })]);
    const result = assessPublicationEligibility(run, 'bad-output', null);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('FeatureCollection'))).toBe(true);
  });

  it('returns ineligible for 3D scene outputs until a 3D map contract exists', () => {
    const run = makeRun('r1', [makeMapOutput('scene-output', { type: '3d_scene' })]);
    const result = assessPublicationEligibility(run, 'scene-output', null);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('3D scene'))).toBe(true);
  });

  it('returns eligible for live runtimeMode', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'live');
    const result = assessPublicationEligibility(run, 'output-1', manifest);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('returns eligible for demo runtimeMode', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'demo');
    const result = assessPublicationEligibility(run, 'output-1', manifest);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('returns eligible when manifest is null (no manifest = live assumption)', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const result = assessPublicationEligibility(run, 'output-1', null);
    expect(result.eligible).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// publishUrbanRunOutputsToMap
// ---------------------------------------------------------------------------

describe('publishUrbanRunOutputsToMap', () => {
  it('returns ineligible when run has no mapOutputs', () => {
    const run = makeRun('r1', []);
    const result = publishUrbanRunOutputsToMap(run);
    expect(result.eligible).toBe(false);
    expect(result.publications).toHaveLength(0);
  });

  it('returns ineligible when manifest is synthetic', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'synthetic');
    useFlowStore.getState().registerManifest(manifest);
    useFlowStore.getState().upsertCompletedRun(run);

    const result = publishUrbanRunOutputsToMap(run);
    expect(result.eligible).toBe(false);
    expect(result.publications).toHaveLength(0);
  });

  it('calls addOverlayLayer with a correctly structured layer', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'live');
    useFlowStore.getState().registerManifest(manifest);
    useFlowStore.getState().upsertCompletedRun(run);

    const result = publishUrbanRunOutputsToMap(run);

    expect(result.eligible).toBe(true);
    expect(result.publications).toHaveLength(1);

    const mapState = useMapExplorerStore.getState();
    expect(mapState.overlayLayers).toHaveLength(1);

    const layer = mapState.overlayLayers[0]!;
    expect(layer.id).toContain('urban-pub-r1-output-1');
    expect(layer.name).toBe('Output output-1');
    expect(layer.visible).toBe(true);
    expect(layer.sourceKind).toBe('derived');
    expect(layer.group).toBe('analysis');
    expect(layer.provenance?.generatedAt).toBe('2026-06-01T12:00:00.000Z');
  });

  it('marks the published layer as an active analysis result layer', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    publishUrbanRunOutputsToMap(run);

    const mapState = useMapExplorerStore.getState();
    const layerId = mapState.overlayLayers[0]?.id;
    expect(layerId).toBeDefined();
    expect(mapState.activeAnalysisResultLayerIds).toContain(layerId);
  });

  it('registers an evidence artifact with kind map-layer', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    publishUrbanRunOutputsToMap(run);

    const artifacts = useUrbanContextStore.getState().evidenceArtifacts;
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]!.kind).toBe('map-layer');
    expect(artifacts[0]!.sourceModule).toBe('urban-analytics');
    expect(artifacts[0]!.state).toBe('published');
    expect(artifacts[0]!.linkedRunId).toBe('r1');
  });

  it('stores mapLayerId on the evidence artifact', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    publishUrbanRunOutputsToMap(run);

    const artifact = useUrbanContextStore.getState().evidenceArtifacts[0]!;
    const layer = useMapExplorerStore.getState().overlayLayers[0]!;
    expect(artifact.mapLayerId).toBe(layer.id);
  });

  it('creates a map-registry publication artifact with run, context, runtime, and Urban references', () => {
    const run = makeRun('r-map-registry', [makeMapOutput('output-1')]);
    const manifest = makeManifest(run.runId, 'live');
    useFlowStore.getState().registerManifest(manifest);

    publishUrbanRunOutputsToMap(run);

    const urbanArtifact = useUrbanContextStore.getState().evidenceArtifacts[0]!;
    const mapArtifact = useMapExplorerStore.getState().mapEvidenceArtifacts[0]!;
    expect(mapArtifact.state).toBe('published');
    expect(mapArtifact.urbanEvidenceId).toBe(urbanArtifact.id);
    expect(mapArtifact.linkedRunId).toBe(run.runId);
    expect(mapArtifact.metadata).toMatchObject({
      runtimeMode: 'live',
      isDemo: false,
      isSynthetic: false,
      manifestId: `urban-run-manifest:${run.runId}`,
      contextId: useUrbanContextStore.getState().context?.contextId,
    });
    expect(Object.prototype.hasOwnProperty.call(mapArtifact, 'sourceData')).toBe(false);
  });

  it('updates the sidecar manifest mapArtifactIds when a manifest exists', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r1', 'live');
    useFlowStore.getState().registerManifest(manifest);
    useFlowStore.getState().upsertCompletedRun(run);

    const result = publishUrbanRunOutputsToMap(run);
    expect(result.publications).toHaveLength(1);

    const updatedManifest = useFlowStore.getState().lookupManifest('r1');
    expect(updatedManifest).not.toBeNull();
    expect(updatedManifest!.mapArtifactIds).toContain(result.publications[0]!.artifactId);
  });

  it('returns a publication record with correct runId and layer reference', () => {
    const run = makeRun('r1', [makeMapOutput('output-1')]);
    const result = publishUrbanRunOutputsToMap(run);

    const pub = result.publications[0]!;
    expect(pub.runId).toBe('r1');
    expect(pub.outputLayerReference.mapOutputId).toBe('output-1');
    expect(pub.outputLayerReference.mapLayerId).toBeTruthy();
    expect(pub.artifactId).toBeTruthy();
    expect(pub.publishedAt).toBeTruthy();
  });

  it('returns publication metadata with style, legend, QA, uncertainty, and CRS provenance', () => {
    useMapExplorerStore.setState({
      overlayLayers: [{
        id: 'source-layer-1',
        name: 'Source parcel layer',
        type: 'geojson',
        visible: true,
        opacity: 1,
        group: 'data',
        metadata: {
          datasetContext: {
            crs: 'EPSG:3857',
          },
        },
      }],
    });

    const run = makeRun('r1', [
      makeMapOutput('output-1', {
        style: {
          fillColor: '#3794ff',
          legendEntries: [{ value: 'high', label: 'High need', color: '#ef4444', count: 12 }],
        },
        engineBridge: {
          domain: 'spatial-stats',
          engine: 'GetisOrdGi',
          runTimestamp: '2026-06-01T11:45:00.000Z',
          parameters: { threshold: 0.05 },
          statisticalSummary: { featureCount: 1 },
          sourceLayerIds: ['source-layer-1'],
          opacity: 0.62,
          visualization: {
            kind: 'hotspot',
            title: 'Hot spot output',
            valueField: 'gi_z',
            classificationMethod: 'fixed-threshold',
            colorRamp: 'YlOrRd',
            legendEntries: [{ value: 'hot', label: 'Hot spot', color: '#ef4444', count: 1 }],
          },
        },
      }),
    ]);

    const result = publishUrbanRunOutputsToMap(run);
    const publication = result.publications[0]!;
    const artifact = useUrbanContextStore.getState().evidenceArtifacts[0]!;

    expect(publication.styleLegendMetadata).toMatchObject({
      layerType: 'geojson',
      opacity: 0.62,
      legendSource: 'analysis-visualization',
      valueField: 'gi_z',
      classificationMethod: 'fixed-threshold',
      colorRamp: 'YlOrRd',
    });
    expect(publication.styleLegendMetadata.styleKeys).toContain('fillColor');
    expect(publication.styleLegendMetadata.legendEntries[0]).toMatchObject({ label: 'Hot spot' });
    expect(publication.crsSummary.declaredCrs).toBe('EPSG:3857');
    expect(publication.figureMetadata.crsSummary).toContain('EPSG:3857');
    expect(publication.qaSummary.status).toBe('unknown');
    expect(publication.uncertaintyNotes.runtimeMode).toBe('unknown');
    expect(artifact.metadata).toMatchObject({
      publicationId: publication.publicationId,
      publicationLayerType: 'geojson',
      publicationLegendEntryCount: 1,
      publicationCrsDeclared: 'EPSG:3857',
      publicationCrsDisplay: 'EPSG:4326',
    });
  });

  it('publishes multiple outputs from a single run', () => {
    const run = makeRun('r2', [makeMapOutput('o1'), makeMapOutput('o2')]);
    const result = publishUrbanRunOutputsToMap(run);

    expect(result.eligible).toBe(true);
    expect(result.publications).toHaveLength(2);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(2);
    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(2);
  });

  it('sets demo sourceKind for demo-mode manifest', () => {
    const run = makeRun('r3', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r3', 'demo');
    useFlowStore.getState().registerManifest(manifest);
    useFlowStore.getState().upsertCompletedRun(run);

    publishUrbanRunOutputsToMap(run);

    const layer = useMapExplorerStore.getState().overlayLayers[0]!;
    expect(layer.sourceKind).toBe('demo');

    const artifact = useUrbanContextStore.getState().evidenceArtifacts[0]!;
    expect(artifact.qa.state).toBe('warning');
    expect(artifact.qa.warnings.some((w) => w.toLowerCase().includes('demo'))).toBe(true);
  });

  it('retains demo labeling and missing-CRS QA from a source layer', () => {
    useMapExplorerStore.getState().addOverlayLayer({
      id: 'demo-missing-crs-source',
      name: 'Demo parcels without CRS',
      type: 'geojson',
      visible: true,
      opacity: 1,
      sourceKind: 'demo',
      group: 'data',
      sourceData: fcMissingCrs.featureCollection,
      metadata: {
        crsSummary: { crs: null, status: 'missing', source: 'unknown', notes: ['Source CRS missing.'] },
        scientificQA: {
          status: 'warning',
          issueIds: ['missing-crs'],
          badges: ['missing_crs'],
          checkedAt: '2026-06-01T11:40:00.000Z',
          featureIssueCount: 0,
          usedWorker: false,
          caveats: ['CRS was not declared by source metadata.'],
          signature: 'missing-crs-source',
        },
      },
    });
    const output = makeMapOutput('demo-output', {
      engineBridge: {
        domain: 'spatial-stats',
        engine: 'DemoEngine',
        sourceLayerIds: ['demo-missing-crs-source'],
      },
    });
    const run = makeRun('r-demo-crs', [output]);
    useFlowStore.getState().registerManifest(makeManifest(run.runId, 'demo'));

    publishUrbanRunOutputsToMap(run);

    const artifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.kind === 'map-layer')!;
    const mapArtifact = useMapExplorerStore.getState().mapEvidenceArtifacts.find((entry) => entry.sourceId?.includes('urban-pub-r-demo-crs'))!;
    expect(artifact.linkedLayerIds).toContain('demo-missing-crs-source');
    expect(artifact.metadata).toMatchObject({
      publicationIsDemo: true,
      publicationIsSynthetic: false,
      publicationMissingCrsLayerIds: 'demo-missing-crs-source',
      publicationQaStatus: 'warning',
    });
    expect(artifact.qa.warnings.join(' ')).toContain('CRS metadata is missing');
    expect(mapArtifact.metadata?.isDemo).toBe(true);
    expect(mapArtifact.qa.state).toBe('warning');
    expect(mapArtifact.provenance.crsSummary?.missingLayerIds).toEqual(['demo-missing-crs-source']);
  });

  it('marks prior Urban evidence stale and appends a successor on map-layer edits', () => {
    const run = makeRun('r-supersede', [makeMapOutput('output-1')]);
    useFlowStore.getState().registerManifest(makeManifest(run.runId, 'demo'));
    publishUrbanRunOutputsToMap(run);

    const original = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.kind === 'map-layer')!;
    const originalMetadata = { ...original.metadata };
    const layer = useMapExplorerStore.getState().overlayLayers.find((entry) => entry.id === original.mapLayerId)!;
    const successors = supersedePublishedUrbanMapEvidenceForLayerChange({
      layerId: layer.id,
      layer: {
        ...layer,
        metadata: { ...(layer.metadata ?? {}), dataVersion: 'edited-v2' },
      },
      changedAt: '2026-06-01T12:10:00.000Z',
    });

    const artifacts = useUrbanContextStore.getState().evidenceArtifacts.filter((entry) => entry.kind === 'map-layer');
    const stale = artifacts.find((entry) => entry.id === original.id)!;
    expect(successors).toHaveLength(1);
    expect(artifacts).toHaveLength(2);
    expect(stale.state).toBe('stale');
    expect(stale.metadata).toEqual(originalMetadata);
    expect(successors[0]?.id).not.toBe(original.id);
    expect(successors[0]?.linkedArtifactIds).toContain(original.id);
    expect(successors[0]?.metadata).toMatchObject({
      supersedesArtifactId: original.id,
      sourceDataVersion: 'edited-v2',
      publicationRuntimeMode: 'demo',
      publicationIsDemo: true,
    });
  });

  it('blocks a superseding Urban evidence record when its published map layer is removed', () => {
    const run = makeRun('r-removed', [makeMapOutput('output-1')]);
    publishUrbanRunOutputsToMap(run);
    const original = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.kind === 'map-layer')!;

    const successors = supersedePublishedUrbanMapEvidenceForLayerChange({
      layerId: original.mapLayerId!,
      layer: null,
      reason: 'Published layer removed.',
      changedAt: '2026-06-01T12:15:00.000Z',
    });

    expect(useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.id === original.id)?.state).toBe('stale');
    expect(successors[0]?.state).toBe('blocked');
    expect(successors[0]?.qa.state).toBe('blocked');
    expect(successors[0]?.qa.limitations.join(' ')).toContain('removed');
  });

  it('does not duplicate layers when called twice with the same run', () => {
    const run = makeRun('r4', [makeMapOutput('output-1')]);
    publishUrbanRunOutputsToMap(run);
    publishUrbanRunOutputsToMap(run);

    // addOverlayLayer upserts by id — same layer should replace itself
    const layers = useMapExplorerStore.getState().overlayLayers;
    const ids = layers.map((l) => l.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('does not duplicate evidence artifacts or manifest references when called twice with the same run', () => {
    const run = makeRun('r5', [makeMapOutput('output-1')]);
    const manifest = makeManifest('r5', 'live');
    useFlowStore.getState().registerManifest(manifest);
    useFlowStore.getState().upsertCompletedRun(run);

    const first = publishUrbanRunOutputsToMap(run);
    const second = publishUrbanRunOutputsToMap(run);

    expect(first.publications[0]?.artifactId).toBe(second.publications[0]?.artifactId);
    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(1);
    expect(useMapExplorerStore.getState().mapEvidenceArtifacts).toHaveLength(1);
    expect(useFlowStore.getState().lookupManifest('r5')?.mapArtifactIds).toEqual([first.publications[0]?.artifactId]);
  });
});
