import type { FeatureCollection } from 'geojson';
import { selectMapExplorerContextSummary } from '@/centerpanel/components/map/mapContextSummary';
import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import {
  buildMapToUrbanContextPayload,
  type MapToUrbanContextPayload,
} from '@/services/map/bridge/MapUrbanBridgeService';
import type { MapExplorerState } from '@/stores/useMapExplorerStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useUrbanStore } from '../store';
import { useUrbanContextStore } from '../useUrbanContextStore';
import { computeUrbanDataFitnessFromMapContext } from './dataFitness';
import { recommendUrbanMethodsFromMapContext } from './methodValidity';
import type {
  BoundingBox,
  MapToUrbanContextSummary,
  MapToUrbanQaSummary,
  UrbanDataFitnessProfile,
  UrbanEvidenceQAState,
} from '../lib/types';

const TEMPORAL_FIELD_PATTERN = /(date|time|year|month|day|timestamp|datetime|period)/i;
const MAX_FEATURE_SCAN = 160;
const MAP_TO_URBAN_EVENT = 'urban:recommendations:map-context';

function toFeatureCollection(sourceData: OverlayLayerConfig['sourceData']): FeatureCollection | null {
  if (!sourceData || typeof sourceData === 'string') {
    return null;
  }

  if (sourceData.type === 'FeatureCollection') {
    return sourceData;
  }

  if (sourceData.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [sourceData],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: sourceData,
      properties: {},
    }],
  };
}

function resolveLayerFeatureCount(layer: OverlayLayerConfig): number | null {
  const metadataCount = layer.metadata?.featureCount;
  if (typeof metadataCount === 'number' && Number.isFinite(metadataCount) && metadataCount >= 0) {
    return metadataCount;
  }
  const collection = toFeatureCollection(layer.sourceData);
  return collection ? collection.features.length : null;
}

function resolveLayerCrs(layer: OverlayLayerConfig): string | null {
  const crs = layer.metadata?.datasetContext?.crs
    ?? layer.metadata?.columnar?.crs
    ?? layer.metadata?.eoSource?.crs
    ?? layer.metadata?.externalService?.crs;
  if (typeof crs !== 'string') {
    return null;
  }
  const normalized = crs.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveGeometryType(layer: OverlayLayerConfig): string {
  const fromMetadata = layer.metadata?.geometryType;
  if (typeof fromMetadata === 'string' && fromMetadata.trim().length > 0) {
    return fromMetadata;
  }

  const collection = toFeatureCollection(layer.sourceData);
  const geometryType = collection?.features.find((feature) => feature.geometry)?.geometry?.type;
  if (typeof geometryType === 'string' && geometryType.length > 0) {
    return geometryType;
  }

  return 'unknown';
}

function looksTemporalValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === 'number') {
    return value > 1800 && value < 2200;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed);
}

function collectLayerFields(layer: OverlayLayerConfig): { fields: string[]; temporalFields: string[] } {
  const collection = toFeatureCollection(layer.sourceData);
  if (!collection || collection.features.length === 0) {
    return { fields: [], temporalFields: [] };
  }

  const fields = new Set<string>();
  const temporalFields = new Set<string>();
  const scanLimit = Math.min(collection.features.length, MAX_FEATURE_SCAN);

  for (let index = 0; index < scanLimit; index += 1) {
    const properties = collection.features[index]?.properties ?? {};
    for (const [key, value] of Object.entries(properties)) {
      if (key.startsWith('__')) {
        continue;
      }
      fields.add(key);
      if (TEMPORAL_FIELD_PATTERN.test(key) || looksTemporalValue(value)) {
        temporalFields.add(key);
      }
    }
  }

  return {
    fields: [...fields].sort((left, right) => left.localeCompare(right)),
    temporalFields: [...temporalFields].sort((left, right) => left.localeCompare(right)),
  };
}

function mapQaSummaryFromState(mapState: Pick<MapExplorerState, 'scientificQA'>): MapToUrbanQaSummary {
  const qa = mapState.scientificQA;
  if (!qa) {
    return {
      status: 'unknown',
      issueCount: 0,
      warningCount: 0,
      blockerCount: 0,
      checkedAt: null,
      signature: null,
    };
  }

  const warningCount = qa.issues.filter((issue) => issue.severity === 'warning').length;
  const blockerCount = qa.issues.filter((issue) => issue.severity === 'blocker' || issue.severity === 'error').length;
  const status = qa.status === 'passed'
    ? 'passed'
    : qa.status === 'warning'
      ? 'warning'
      : qa.status === 'error'
        ? 'blocked'
        : 'unknown';

  return {
    status,
    issueCount: qa.issues.length,
    warningCount,
    blockerCount,
    checkedAt: qa.checkedAt,
    signature: qa.metadata.signature,
  };
}

function buildRecommendationHints(summary: Omit<MapToUrbanContextSummary, 'recommendationHints'>): string[] {
  const hints: string[] = [];

  if (summary.layerIds.length === 0) {
    hints.push('No active map layer references detected. Load or enable at least one layer for contextual method ranking.');
    return hints;
  }

  const geometryKinds = new Set(summary.geometryTypeSummary.map((entry) => entry.geometryType.toLowerCase()));
  if ([...geometryKinds].some((kind) => kind.includes('polygon'))) {
    hints.push('Polygon geometries detected: site suitability, vulnerability, and equity workflows can be prioritized.');
  }
  if ([...geometryKinds].some((kind) => kind.includes('point'))) {
    hints.push('Point geometries detected: accessibility and transit-oriented methods are likely relevant.');
  }
  if (summary.temporalFields.length > 0) {
    hints.push(`Temporal fields detected (${summary.temporalFields.slice(0, 3).join(', ')}): change and hotspot workflows can be scoped.`);
  }
  if (summary.activeAnalysisResultLayerIds.length > 0) {
    hints.push('Existing analysis layers detected: scenario comparison and review workflows can use this context directly.');
  }
  if (summary.qaSummary.status === 'blocked') {
    hints.push('Map QA reports blockers. Preserve caution and resolve QA issues before treating methods as report-ready.');
  } else if (summary.qaSummary.status === 'warning') {
    hints.push('Map QA reports warnings. Prioritize methods tolerant to data quality caveats.');
  }

  if (hints.length === 0) {
    hints.push('Map context is synchronized. Method recommendations can rank by AOI and active layer references.');
  }

  return hints;
}

function mapQaStateToEvidenceState(status: MapToUrbanQaSummary['status']): UrbanEvidenceQAState {
  if (status === 'passed') {
    return 'valid';
  }
  if (status === 'warning') {
    return 'warning';
  }
  if (status === 'blocked') {
    return 'blocked';
  }
  return 'unvalidated';
}

function toBounds(bounds: [number, number, number, number] | null): BoundingBox | null {
  if (!bounds) {
    return null;
  }
  return [bounds[0], bounds[1], bounds[2], bounds[3]];
}

export function buildMapToUrbanContextSummary(
  mapState: Pick<
    MapExplorerState,
    | 'activeAoiId'
    | 'overlayLayers'
    | 'selectedFeatureIds'
    | 'activeAnalysisResultLayerIds'
    | 'currentMapBounds'
    | 'scientificQA'
  >,
): MapToUrbanContextSummary {
  const layerIds = mapState.overlayLayers.map((layer) => layer.id);
  const geometryTypeSummary = mapState.overlayLayers.map((layer) => ({
    layerId: layer.id,
    geometryType: resolveGeometryType(layer),
  }));

  const fieldSummary = mapState.overlayLayers.map((layer) => {
    const fields = collectLayerFields(layer);
    return {
      layerId: layer.id,
      fields: fields.fields,
      temporalFields: fields.temporalFields,
    };
  });

  const temporalFields = [...new Set(fieldSummary.flatMap((entry) => entry.temporalFields))]
    .sort((left, right) => left.localeCompare(right));

  const featureCountByLayer = mapState.overlayLayers.map((layer) => ({
    layerId: layer.id,
    featureCount: resolveLayerFeatureCount(layer),
  }));
  const total = featureCountByLayer.reduce((sum, entry) => sum + (entry.featureCount ?? 0), 0);

  const crsByLayer = mapState.overlayLayers.map((layer) => ({
    layerId: layer.id,
    crs: resolveLayerCrs(layer),
  }));
  const distinct = [...new Set(crsByLayer.map((entry) => entry.crs).filter((entry): entry is string => entry != null))]
    .sort((left, right) => left.localeCompare(right));
  const missingLayerIds = crsByLayer
    .filter((entry) => entry.crs == null)
    .map((entry) => entry.layerId);

  const selectionSummary = Object.entries(mapState.selectedFeatureIds)
    .map(([layerId, featureIds]) => ({
      layerId,
      selectedFeatureCount: featureIds.length,
    }))
    .filter((entry) => entry.selectedFeatureCount > 0)
    .sort((left, right) => left.layerId.localeCompare(right.layerId));

  const summaryBase: Omit<MapToUrbanContextSummary, 'recommendationHints'> = {
    createdAt: new Date().toISOString(),
    aoiReference: {
      aoiId: mapState.activeAoiId ?? null,
      bounds: toBounds(mapState.currentMapBounds),
    },
    layerIds,
    activeAnalysisResultLayerIds: [...mapState.activeAnalysisResultLayerIds],
    geometryTypeSummary,
    fieldSummary,
    temporalFields,
    featureCountSummary: {
      total,
      byLayer: featureCountByLayer,
    },
    crsSummary: {
      distinct,
      missingLayerIds,
      byLayer: crsByLayer,
    },
    qaSummary: mapQaSummaryFromState(mapState),
    selectionSummary,
  };

  return {
    ...summaryBase,
    recommendationHints: buildRecommendationHints(summaryBase),
  };
}

function payloadQaStatus(status: string): MapToUrbanQaSummary['status'] {
  if (status === 'passed') return 'passed';
  if (status === 'warning') return 'warning';
  if (status === 'error' || status === 'blocked') return 'blocked';
  return 'unknown';
}

function buildSummaryFromPayload(
  payload: MapToUrbanContextPayload,
  recommendationHints: string[],
): MapToUrbanContextSummary {
  const featureCounts = payload.layerSummaries.map((layer) => ({
    layerId: layer.layerId,
    featureCount: layer.registry.featureCount ?? null,
  }));
  const issueCount = Object.values(payload.qaSummary.issueCounts)
    .reduce((total, count) => total + count, 0);

  return {
    createdAt: payload.createdAt,
    aoiReference: {
      aoiId: payload.aoiReference.aoiId,
      bounds: payload.aoiReference.bbox,
    },
    layerIds: payload.layerSummaries.map((layer) => layer.layerId),
    activeAnalysisResultLayerIds: [...payload.workflowSummary.activeAnalysisResultLayerIds],
    geometryTypeSummary: payload.layerSummaries.map((layer) => ({
      layerId: layer.layerId,
      geometryType: layer.registry.geometryType ?? 'unknown',
    })),
    fieldSummary: payload.fieldSummaries.map((fields) => ({
      layerId: fields.layerId,
      fields: fields.fields.map((field) => field.name),
      temporalFields: [...fields.temporalFields],
    })),
    temporalFields: [...new Set(payload.fieldSummaries.flatMap((fields) => fields.temporalFields))],
    featureCountSummary: {
      total: featureCounts.reduce((total, entry) => total + (entry.featureCount ?? 0), 0),
      byLayer: featureCounts,
    },
    crsSummary: {
      distinct: [...payload.crsSummary.distinct],
      missingLayerIds: [...payload.crsSummary.missingLayerIds],
      byLayer: payload.crsSummary.byLayer.map((layer) => ({
        layerId: layer.layerId,
        crs: layer.crs,
      })),
    },
    qaSummary: {
      status: payloadQaStatus(payload.qaSummary.status),
      issueCount,
      warningCount: payload.qaSummary.warningIssueIds.length,
      blockerCount: payload.qaSummary.blockingIssueIds.length,
      checkedAt: payload.qaSummary.checkedAt,
      signature: payload.payloadId,
    },
    selectionSummary: payload.selectedFeatureCounts.map((selection) => ({
      layerId: selection.layerId,
      selectedFeatureCount: selection.count,
    })),
    recommendationHints,
  };
}

export interface ApplyMapToUrbanContextOptions {
  payload?: MapToUrbanContextPayload;
  mapState?: Pick<
    MapExplorerState,
    | 'activeAoiId'
    | 'overlayLayers'
    | 'selectedFeatureIds'
    | 'activeAnalysisResultLayerIds'
    | 'currentMapBounds'
    | 'scientificQA'
  >;
  triggerRecommendations?: boolean;
}

export interface ApplyMapToUrbanContextResult {
  summary: MapToUrbanContextSummary;
  contextId: string | null;
  evidenceArtifactId: string;
  recommendationTriggered: boolean;
  recommendationReason: string | null;
  dataFitness?: UrbanDataFitnessProfile;
}

export function applyMapContextToUrban(
  options: ApplyMapToUrbanContextOptions = {},
): ApplyMapToUrbanContextResult {
  const recommendations = options.payload
    ? recommendUrbanMethodsFromMapContext(options.payload)
    : [];
  const mapState = options.mapState ?? useMapExplorerStore.getState();
  const summary = options.payload
    ? buildSummaryFromPayload(
        options.payload,
        recommendations.length > 0
          ? recommendations.map((recommendation) => recommendation.hint)
          : [`No method-specific match is available; based on: ${options.payload.layerSummaries.map((layer) => layer.name).join(', ') || 'no active layer'}.`],
      )
    : buildMapToUrbanContextSummary(mapState);
  const dataFitness = options.payload
    ? computeUrbanDataFitnessFromMapContext(options.payload)
    : undefined;

  const urbanContextStore = useUrbanContextStore.getState();
  if (!urbanContextStore.context) {
    urbanContextStore.createContext({
      activeAoiId: summary.aoiReference.aoiId,
      activeLayerIds: [...summary.layerIds],
    });
  } else {
    urbanContextStore.patchContext({
      activeAoiId: summary.aoiReference.aoiId,
      activeLayerIds: [...summary.layerIds],
    });
  }

  const resolvedContextId = useUrbanContextStore.getState().context?.contextId ?? null;
  const evidenceArtifactId = options.payload
    ? `map-context:${options.payload.context.contextId}:${options.payload.createdAt}`
    : `map-context:${resolvedContextId ?? 'unbound'}`;
  const selectedFeatureCount = summary.selectionSummary.reduce(
    (sum, entry) => sum + entry.selectedFeatureCount,
    0,
  );

  useUrbanContextStore.getState().registerEvidenceArtifact({
    id: evidenceArtifactId,
    kind: 'map-layer',
    title: 'Map context summary',
    summary: `AOI ${summary.aoiReference.aoiId ?? 'none'}, ${summary.layerIds.length} layer(s), ${summary.featureCountSummary.total} feature(s). ${summary.recommendationHints[0] ?? ''}`.trim(),
    state: summary.qaSummary.status === 'blocked' ? 'blocked' : 'active',
    sourceModule: 'map-explorer',
    sourceId: options.payload?.payloadId ?? 'map-context-summary',
    linkedContextId: resolvedContextId ?? undefined,
    linkedLayerIds: [...summary.layerIds],
    tags: ['spatial_stats', 'indicators', 'scenario'],
    qa: {
      state: mapQaStateToEvidenceState(summary.qaSummary.status),
      warnings: summary.qaSummary.status === 'blocked' || summary.qaSummary.status === 'warning'
        ? [...summary.recommendationHints]
        : [],
      limitations: summary.crsSummary.missingLayerIds.length > 0
        ? [`Missing CRS metadata for layers: ${summary.crsSummary.missingLayerIds.join(', ')}`]
        : [],
    },
    ...(dataFitness ? { dataFitness } : {}),
    metadata: {
      layerCount: summary.layerIds.length,
      featureCount: summary.featureCountSummary.total,
      selectedFeatureCount,
      qaIssueCount: summary.qaSummary.issueCount,
      qaWarningCount: summary.qaSummary.warningCount,
      qaBlockerCount: summary.qaSummary.blockerCount,
      hasAoi: summary.aoiReference.aoiId !== null,
      hasTemporalFields: summary.temporalFields.length > 0,
      ...(dataFitness ? { fitnessStatus: dataFitness.status } : {}),
    },
  });

  let recommendationTriggered = false;
  let recommendationReason: string | null = null;
  if (options.triggerRecommendations !== false && summary.layerIds.length > 0) {
    const urbanStore = useUrbanStore.getState();
    if (!urbanStore.recMode) {
      urbanStore.setRecMode(true);
      recommendationTriggered = true;
      recommendationReason = 'Map context includes active layers.';
    }

    if (typeof globalThis.CustomEvent === 'function' && typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent(MAP_TO_URBAN_EVENT, {
        detail: {
          contextId: resolvedContextId,
          layerCount: summary.layerIds.length,
          hints: summary.recommendationHints,
          createdAt: summary.createdAt,
        },
      }));
    }
  }

  return {
    summary,
    contextId: resolvedContextId,
    evidenceArtifactId,
    recommendationTriggered,
    recommendationReason,
    ...(dataFitness ? { dataFitness } : {}),
  };
}

function buildMapStateSignature(state: Pick<
  MapExplorerState,
  'activeAoiId' | 'overlayLayers' | 'selectedFeatureIds' | 'activeAnalysisResultLayerIds' | 'currentMapBounds' | 'scientificQA'
>): string {
  const layerSignature = state.overlayLayers
    .map((layer) => {
      const featureCount = resolveLayerFeatureCount(layer) ?? -1;
      const crs = resolveLayerCrs(layer) ?? 'none';
      return `${layer.id}:${layer.visible ? 1 : 0}:${layer.qaStatus ?? 'unchecked'}:${featureCount}:${crs}`;
    })
    .join('|');

  const selectionSignature = Object.entries(state.selectedFeatureIds)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([layerId, ids]) => `${layerId}:${ids.length}`)
    .join('|');

  const bounds = state.currentMapBounds ? state.currentMapBounds.join(',') : 'none';
  const qaSignature = state.scientificQA?.metadata.signature ?? 'none';
  const analysisLayers = [...state.activeAnalysisResultLayerIds].sort((left, right) => left.localeCompare(right)).join(',');

  return [
    state.activeAoiId ?? 'none',
    layerSignature,
    selectionSignature,
    analysisLayers,
    bounds,
    qaSignature,
  ].join('||');
}

export interface SubscribeMapToUrbanContextOptions {
  debounceMs?: number;
  triggerRecommendations?: boolean;
  runInitialSync?: boolean;
}

function buildBridgePayloadFromMapState(state: MapExplorerState): MapToUrbanContextPayload {
  return buildMapToUrbanContextPayload({
    contextSummary: selectMapExplorerContextSummary(state),
    overlayLayers: state.overlayLayers,
    drawnFeatures: state.drawnFeatures,
    activeAoiId: state.activeAoiId,
    selectedFeatureIds: state.selectedFeatureIds,
    mapEvidenceArtifacts: state.mapEvidenceArtifacts,
    scientificQA: state.scientificQA,
  });
}

export function subscribeMapContextToUrban(
  options: SubscribeMapToUrbanContextOptions = {},
): () => void {
  const debounceMs = Math.max(0, options.debounceMs ?? 120);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSignature = '';

  const runSync = () => {
    applyMapContextToUrban({
      payload: buildBridgePayloadFromMapState(useMapExplorerStore.getState()),
      triggerRecommendations: options.triggerRecommendations,
    });
  };

  if (options.runInitialSync !== false) {
    const state = useMapExplorerStore.getState();
    lastSignature = buildMapStateSignature(state);
    runSync();
  }

  const unsubscribe = useMapExplorerStore.subscribe((state) => {
    const nextSignature = buildMapStateSignature(state);
    if (nextSignature === lastSignature) {
      return;
    }
    lastSignature = nextSignature;

    if (timer) {
      clearTimeout(timer);
    }

    if (debounceMs === 0) {
      runSync();
      return;
    }

    timer = setTimeout(() => {
      timer = null;
      runSync();
    }, debounceMs);
  });

  return () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    unsubscribe();
  };
}
