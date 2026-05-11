import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import type {
  MapLayerRegistryLayerSummary,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import { summarizeOverlayLayer } from "@/centerpanel/components/map/mapContextSummary";
import { useFlowStore } from "@/stores/useFlowStore";
import type {
  MapAnalysisRecommendation,
  MapAnalysisRecommendationReadiness,
  MapAnalysisRecommendationReason,
  MapAnalysisUrbanContextSummary,
} from "./MapAnalysisRecommender";

export const MAP_ANALYSIS_DISPATCH_KEY = "map_analysis_dispatch";
export const MAP_ANALYSIS_VIEW_RESTRICTION_KEY = "map_analysis_view_restriction";
export const MAP_ANALYSIS_RECOMMENDATION_KEY = "map_analysis_recommendation";

export interface MapDispatchOriginPoint {
  lng: number;
  lat: number;
}

export interface MapViewRestriction {
  enabled: boolean;
  bounds: [number, number, number, number] | null;
  updatedAt: string;
}

export type MapAnalysisLayerReferenceRole =
  | "visible-context"
  | "selected-context"
  | "recommendation-source"
  | "analysis-result"
  | "aoi-context";

export interface MapAnalysisLayerReference {
  layerId: string;
  name: string;
  role: MapAnalysisLayerReferenceRole;
  layerType: OverlayLayerConfig["type"];
  visible: boolean;
  sourceKind?: string;
  geometryType?: string;
  featureCount?: number;
  crs?: string;
  crsStatus?: string;
  qaStatus?: string;
  publicationReadiness?: string;
  evidenceArtifactId?: string;
  reproducibilityManifestId?: string;
}

export interface MapAnalysisDispatchContextSummary {
  contextId: string | null;
  updatedAt: string;
  activeAoiId: string | null;
  activeAoiGeometryFamily: string | null;
  currentBounds: [number, number, number, number] | null;
  visibleLayerIds: string[];
  selectedLayerIds: string[];
  activeAnalysisResultLayerIds: string[];
  selectedFeatureCount: number;
  qaStatus: string;
  qaIssueCounts: Record<string, number>;
  urbanContext: {
    hasContext: boolean;
    contextId: string | null;
    studyAreaId: string | null;
    studyAreaName: string | null;
    activeFlowId: string | null;
    activeAoiId: string | null;
    activeRunId: string | null;
    layerCount: number;
    artifactCount: number;
    fitnessStatus: string | null;
    syncState: string | null;
    restoreWarningCount: number;
  };
}

export interface MapAnalysisDispatchAuditSummary {
  explicit: true;
  reversible: boolean;
  reviewEventType: "analysis-dispatch";
  note: string;
}

interface MapAnalysisDispatchPayloadBase {
  contextSummary?: MapAnalysisDispatchContextSummary;
  layerReferences?: MapAnalysisLayerReference[];
  audit?: MapAnalysisDispatchAuditSummary;
}

interface OptionalDispatchFieldsInput {
  contextSummary?: MapAnalysisDispatchContextSummary | undefined;
  layerReferences?: MapAnalysisLayerReference[] | undefined;
  audit?: MapAnalysisDispatchAuditSummary | undefined;
}

export interface MapFlowAoiDispatchPayload extends MapAnalysisDispatchPayloadBase {
  kind: "flow-aoi";
  flowId: AnalyticalFlowId;
  requestId: string;
  source: "drawn-aoi" | "map-context-menu";
  aoi: Feature<Polygon | MultiPolygon>;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  createdAt: string;
}

export interface MapIsochroneDispatchPayload extends MapAnalysisDispatchPayloadBase {
  kind: "isochrone";
  requestId: string;
  source: "map-context-menu";
  origin: MapDispatchOriginPoint;
  thresholdMinutes: number;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  createdAt: string;
}

export interface MapHotSpotDispatchPayload extends MapAnalysisDispatchPayloadBase {
  kind: "hotspot";
  requestId: string;
  source: "map-context-menu";
  origin: MapDispatchOriginPoint;
  analysisBounds: [number, number, number, number];
  layerId?: string;
  valueField?: string;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  createdAt: string;
}

export type MapAnalysisDispatchPayload =
  | MapFlowAoiDispatchPayload
  | MapIsochroneDispatchPayload
  | MapHotSpotDispatchPayload;

export interface MapDispatchCompatibleFlow {
  id: AnalyticalFlowId;
  label: string;
  description: string;
}

export interface NumericFieldSelectionStats {
  field: string;
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  sum: number;
}

export interface SelectionStatisticsSummary {
  layerId: string;
  layerName: string;
  selectedFeatureCount: number;
  numericFields: NumericFieldSelectionStats[];
}

const AOI_COMPATIBLE_FLOWS: readonly MapDispatchCompatibleFlow[] = [
  {
    id: "site_suitability",
    label: "Site Suitability Analysis",
    description: "Open weighted-overlay suitability design scoped to the selected area.",
  },
  {
    id: "vulnerability",
    label: "Vulnerability Assessment",
    description: "Frame hazard, exposure, and adaptive-capacity analysis inside this AOI.",
  },
  {
    id: "equity_audit",
    label: "Equity Audit",
    description: "Audit service or burden equity for the selected geography.",
  },
  {
    id: "change_detection",
    label: "Change Detection",
    description: "Constrain temporal change review to the current analysis area.",
  },
  {
    id: "facility_optimisation",
    label: "Facility Optimisation",
    description: "Evaluate candidate sites and service burden within this AOI.",
  },
  {
    id: "urban_morphology",
    label: "Urban Morphology Clustering",
    description: "Cluster the selected district envelope using the active morphology indicators.",
  },
] as const;

function createRequestId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function dispatchNavigate(detail: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent("synapse:navigate", { detail }));
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolveFeatureId(feature: GeoJSON.Feature, fallbackIndex: number): string {
  const properties = feature.properties ?? {};
  return String(
    feature.id ??
      properties.id ??
      properties.feature_id ??
      properties.detection_id ??
      properties.cell_id ??
      properties.agent_id ??
      properties.name ??
      `${fallbackIndex + 1}`,
  );
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function normalizeBounds(bounds: [number, number, number, number]): [number, number, number, number] {
  const [aLng, aLat, bLng, bLat] = bounds;
  return [
    Math.min(aLng, bLng),
    Math.min(aLat, bLat),
    Math.max(aLng, bLng),
    Math.max(aLat, bLat),
  ];
}

function uniqueStrings(values: readonly string[], limit = 64): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, limit);
}

function optionalDispatchFields(input: OptionalDispatchFieldsInput): MapAnalysisDispatchPayloadBase {
  const output: MapAnalysisDispatchPayloadBase = {};
  if (input.contextSummary) {
    output.contextSummary = input.contextSummary;
  }
  if (input.layerReferences && input.layerReferences.length > 0) {
    output.layerReferences = [...input.layerReferences];
  }
  if (input.audit) {
    output.audit = input.audit;
  }
  return output;
}

function referenceFromLayer(
  layer: OverlayLayerConfig,
  role: MapAnalysisLayerReferenceRole,
  summary?: MapLayerRegistryLayerSummary,
): MapAnalysisLayerReference {
  const registrySummary = summary ?? summarizeOverlayLayer(layer);
  const manifestId = layer.metadata?.reproducibilityManifest?.manifestId
    ?? layer.metadata?.analysisResult?.reproducibilityManifest?.manifestId;
  return {
    layerId: layer.id,
    name: layer.name,
    role,
    layerType: layer.type,
    visible: layer.visible,
    ...(registrySummary.sourceKind ? { sourceKind: registrySummary.sourceKind } : {}),
    ...(registrySummary.geometryType ? { geometryType: registrySummary.geometryType } : {}),
    ...(registrySummary.featureCount != null ? { featureCount: registrySummary.featureCount } : {}),
    ...(registrySummary.crs ? { crs: registrySummary.crs } : {}),
    ...(registrySummary.crsStatus ? { crsStatus: registrySummary.crsStatus } : {}),
    ...(registrySummary.qaStatus ? { qaStatus: registrySummary.qaStatus } : {}),
    ...(registrySummary.publicationReadiness ? { publicationReadiness: registrySummary.publicationReadiness } : {}),
    ...(registrySummary.evidenceArtifactId ? { evidenceArtifactId: registrySummary.evidenceArtifactId } : {}),
    ...(manifestId ? { reproducibilityManifestId: manifestId } : {}),
  };
}

export function buildMapAnalysisLayerReferences(
  overlayLayers: readonly OverlayLayerConfig[],
  layerIds: readonly string[] = [],
  role: MapAnalysisLayerReferenceRole = "visible-context",
): MapAnalysisLayerReference[] {
  const wanted = layerIds.length > 0 ? new Set(layerIds.map(String)) : null;
  const summariesByLayerId = new Map(overlayLayers.map((layer) => [layer.id, summarizeOverlayLayer(layer)]));
  return overlayLayers
    .filter((layer) => (wanted ? wanted.has(layer.id) : layer.visible))
    .map((layer) => referenceFromLayer(layer, role, summariesByLayerId.get(layer.id)));
}

export function buildMapAnalysisDispatchContextSummary(input: {
  mapContextSummary?: MapExplorerContextSummary | null;
  urbanContext?: MapAnalysisUrbanContextSummary | null;
}): MapAnalysisDispatchContextSummary {
  const mapContext = input.mapContextSummary;
  const urbanContext = input.urbanContext;
  return {
    contextId: mapContext?.contextId ?? null,
    updatedAt: mapContext?.updatedAt ?? nowIso(),
    activeAoiId: mapContext?.activeAoi?.aoiId ?? null,
    activeAoiGeometryFamily: mapContext?.activeAoi?.geometryFamily ?? null,
    currentBounds: mapContext?.currentBounds ?? null,
    visibleLayerIds: [...(mapContext?.visibleLayerIds ?? [])],
    selectedLayerIds: [...(mapContext?.selectedLayerIds ?? [])],
    activeAnalysisResultLayerIds: [...(mapContext?.activeAnalysisResultLayerIds ?? [])],
    selectedFeatureCount: mapContext?.selection.totalSelectedFeatures ?? 0,
    qaStatus: mapContext?.qa.status ?? "unchecked",
    qaIssueCounts: { ...(mapContext?.qa.issueCounts ?? {}) },
    urbanContext: {
      hasContext: urbanContext?.hasContext === true,
      contextId: urbanContext?.contextId ?? null,
      studyAreaId: urbanContext?.studyAreaId ?? null,
      studyAreaName: urbanContext?.studyAreaName ?? null,
      activeFlowId: urbanContext?.activeFlowId ? String(urbanContext.activeFlowId) : null,
      activeAoiId: urbanContext?.activeAoiId ?? null,
      activeRunId: urbanContext?.activeRunId ?? null,
      layerCount: urbanContext?.layerCount ?? urbanContext?.activeLayerIds?.length ?? 0,
      artifactCount: urbanContext?.artifactCount ?? 0,
      fitnessStatus: urbanContext?.fitnessStatus ?? null,
      syncState: urbanContext?.syncState ?? null,
      restoreWarningCount: urbanContext?.restoreWarningCount ?? 0,
    },
  };
}

function buildAuditSummary(kind: string, reversible: boolean): MapAnalysisDispatchAuditSummary {
  return {
    explicit: true,
    reversible,
    reviewEventType: "analysis-dispatch",
    note: `${kind} dispatch was created by an explicit user action and queued for review before workflow execution.`,
  };
}

export function getCompatibleAoiFlows(): readonly MapDispatchCompatibleFlow[] {
  return AOI_COMPATIBLE_FLOWS;
}

export function buildBoundsPolygon(bounds: [number, number, number, number]): Feature<Polygon> {
  const [minLng, minLat, maxLng, maxLat] = normalizeBounds(bounds);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ]],
    },
    properties: {
      label: "Map dispatch AOI",
      createdAt: nowIso(),
    },
  };
}

export function buildBufferedPointBounds(
  origin: MapDispatchOriginPoint,
  radiusMeters = 1500,
): [number, number, number, number] {
  const latDelta = radiusMeters / 111_320;
  const lngScale = Math.cos((origin.lat * Math.PI) / 180);
  const lngDelta = radiusMeters / Math.max(111_320 * Math.max(lngScale, 0.15), 1);
  return normalizeBounds([
    origin.lng - lngDelta,
    origin.lat - latDelta,
    origin.lng + lngDelta,
    origin.lat + latDelta,
  ]);
}

export function setMapViewRestriction(bounds: [number, number, number, number] | null, enabled: boolean): void {
  useFlowStore.getState().setStepData(MAP_ANALYSIS_VIEW_RESTRICTION_KEY, {
    enabled,
    bounds,
    updatedAt: nowIso(),
  } satisfies MapViewRestriction);
}

export function getMapViewRestriction(): MapViewRestriction | null {
  const rawValue = useFlowStore.getState().stepData[MAP_ANALYSIS_VIEW_RESTRICTION_KEY];
  if (!rawValue || typeof rawValue !== "object") {
    return null;
  }
  const value = rawValue as Partial<MapViewRestriction>;
  return {
    enabled: value.enabled === true,
    bounds: Array.isArray(value.bounds) && value.bounds.length === 4
      ? value.bounds as [number, number, number, number]
      : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : nowIso(),
  };
}

export function queueMapDispatch(payload: MapAnalysisDispatchPayload): void {
  useFlowStore.getState().setStepData(MAP_ANALYSIS_DISPATCH_KEY, payload);
}

export function queueRecommendationDispatch(payload: MapAnalysisRecommendationDispatchPayload): void {
  useFlowStore.getState().setStepData(MAP_ANALYSIS_RECOMMENDATION_KEY, payload);
}

export function readQueuedMapDispatch(): MapAnalysisDispatchPayload | null {
  const rawValue = useFlowStore.getState().stepData[MAP_ANALYSIS_DISPATCH_KEY];
  if (!rawValue || typeof rawValue !== "object") {
    return null;
  }
  return rawValue as MapAnalysisDispatchPayload;
}

export function clearQueuedMapDispatch(): void {
  useFlowStore.getState().setStepData(MAP_ANALYSIS_DISPATCH_KEY, null);
}

export function dispatchFlowSelection(input: {
  flowId: AnalyticalFlowId;
  aoi: Feature<Polygon | MultiPolygon>;
  source: MapFlowAoiDispatchPayload["source"];
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  contextSummary?: MapAnalysisDispatchContextSummary;
  layerReferences?: MapAnalysisLayerReference[];
}): MapFlowAoiDispatchPayload {
  const payload: MapFlowAoiDispatchPayload = {
    kind: "flow-aoi",
    flowId: input.flowId,
    requestId: createRequestId("flow-aoi"),
    source: input.source,
    aoi: input.aoi,
    restrictToView: input.restrictToView,
    ...(input.viewBounds ? { viewBounds: input.viewBounds } : {}),
    createdAt: nowIso(),
    ...optionalDispatchFields({
      contextSummary: input.contextSummary,
      layerReferences: input.layerReferences,
      audit: buildAuditSummary("AOI workflow", true),
    }),
  };
  queueMapDispatch(payload);
  dispatchNavigate({ tab: "Workflows", flowId: input.flowId });
  return payload;
}

export function dispatchIsochroneNavigation(input: {
  origin: MapDispatchOriginPoint;
  thresholdMinutes: number;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  contextSummary?: MapAnalysisDispatchContextSummary;
  layerReferences?: MapAnalysisLayerReference[];
}): MapIsochroneDispatchPayload {
  const payload: MapIsochroneDispatchPayload = {
    kind: "isochrone",
    requestId: createRequestId("isochrone"),
    source: "map-context-menu",
    origin: input.origin,
    thresholdMinutes: input.thresholdMinutes,
    restrictToView: input.restrictToView,
    ...(input.viewBounds ? { viewBounds: input.viewBounds } : {}),
    createdAt: nowIso(),
    ...optionalDispatchFields({
      contextSummary: input.contextSummary,
      layerReferences: input.layerReferences,
      audit: buildAuditSummary("Isochrone workflow", true),
    }),
  };
  queueMapDispatch(payload);
  dispatchNavigate({ tab: "Workflows", flowId: "accessibility" });
  return payload;
}

export function dispatchHotSpotNavigation(input: {
  origin: MapDispatchOriginPoint;
  analysisBounds: [number, number, number, number];
  layerId?: string;
  valueField?: string;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  contextSummary?: MapAnalysisDispatchContextSummary;
  layerReferences?: MapAnalysisLayerReference[];
}): MapHotSpotDispatchPayload {
  const payload: MapHotSpotDispatchPayload = {
    kind: "hotspot",
    requestId: createRequestId("hotspot"),
    source: "map-context-menu",
    origin: input.origin,
    analysisBounds: normalizeBounds(input.analysisBounds),
    ...(input.layerId ? { layerId: input.layerId } : {}),
    ...(input.valueField ? { valueField: input.valueField } : {}),
    restrictToView: input.restrictToView,
    ...(input.viewBounds ? { viewBounds: input.viewBounds } : {}),
    createdAt: nowIso(),
    ...optionalDispatchFields({
      contextSummary: input.contextSummary,
      layerReferences: input.layerReferences,
      audit: buildAuditSummary("Hot spot workflow", true),
    }),
  };
  queueMapDispatch(payload);
  dispatchNavigate({ tab: "Workflows", flowId: "emerging_hot_spot" });
  return payload;
}

export function dispatchRecommendationFlow(input: {
  recommendation: MapAnalysisRecommendation;
  flowId: AnalyticalFlowId;
  overlayLayers: readonly OverlayLayerConfig[];
  mapContextSummary?: MapExplorerContextSummary | null;
  urbanContext?: MapAnalysisUrbanContextSummary | null;
}): MapAnalysisRecommendationDispatchPayload {
  const actionLayerIds = input.recommendation.action.type === "open-flow"
    ? input.recommendation.action.layerIds ?? input.recommendation.layerIds
    : input.recommendation.layerIds;
  const layerIds = uniqueStrings(actionLayerIds);
  const payload: MapAnalysisRecommendationDispatchPayload = {
    kind: "recommendation",
    requestId: createRequestId("recommendation"),
    source: "map-recommendation",
    flowId: input.flowId,
    recommendationId: input.recommendation.id,
    title: input.recommendation.title,
    layerIds,
    ...(input.recommendation.action.type === "open-flow" && input.recommendation.action.preferredMethod
      ? { preferredMethod: input.recommendation.action.preferredMethod }
      : {}),
    requiredInputs: [...input.recommendation.requiredInputs],
    expectedOutput: input.recommendation.expectedOutput,
    scientificCaveat: input.recommendation.scientificCaveat,
    readiness: input.recommendation.readiness,
    reasons: input.recommendation.reasons,
    createdAt: nowIso(),
    ...optionalDispatchFields({
      contextSummary: buildMapAnalysisDispatchContextSummary({
        mapContextSummary: input.mapContextSummary,
        urbanContext: input.urbanContext,
      }),
      layerReferences: buildMapAnalysisLayerReferences(input.overlayLayers, layerIds, "recommendation-source"),
      audit: buildAuditSummary("Recommendation workflow", true),
    }),
  };
  queueRecommendationDispatch(payload);
  dispatchNavigate({ tab: "Workflows", flowId: input.flowId });
  return payload;
}

export function collectSelectionStatistics(
  overlayLayers: OverlayLayerConfig[],
  selectedFeatureIds: Record<string, string[]>,
): SelectionStatisticsSummary[] {
  return Object.entries(selectedFeatureIds).flatMap(([layerId, featureIds]) => {
    if (featureIds.length === 0) {
      return [];
    }

    const layer = overlayLayers.find((entry) => entry.id === layerId);
    if (!layer || !layer.sourceData || typeof layer.sourceData === "string") {
      return [];
    }

    const featureCollection = layer.sourceData.type === "FeatureCollection"
      ? layer.sourceData
      : layer.sourceData.type === "Feature"
        ? { type: "FeatureCollection", features: [layer.sourceData] }
        : null;
    if (!featureCollection) {
      return [];
    }

    const wanted = new Set(featureIds.map(String));
    const selectedFeatures = featureCollection.features.filter((feature, index) =>
      wanted.has(resolveFeatureId(feature, index)),
    );
    if (selectedFeatures.length === 0) {
      return [];
    }

    const numericBuckets = new Map<string, number[]>();
    for (const feature of selectedFeatures) {
      for (const [field, rawValue] of Object.entries(feature.properties ?? {})) {
        if (field.startsWith("__")) {
          continue;
        }
        const numericValue = toFiniteNumber(rawValue);
        if (numericValue == null) {
          continue;
        }
        const values = numericBuckets.get(field) ?? [];
        values.push(numericValue);
        numericBuckets.set(field, values);
      }
    }

    const numericFields = [...numericBuckets.entries()]
      .map(([field, values]) => {
        const sum = values.reduce((accumulator, value) => accumulator + value, 0);
        return {
          field,
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          mean: sum / values.length,
          median: median(values),
          sum,
        } satisfies NumericFieldSelectionStats;
      })
      .sort((left, right) => left.field.localeCompare(right.field, undefined, { sensitivity: "base" }));

    return [{
      layerId,
      layerName: layer.name,
      selectedFeatureCount: selectedFeatures.length,
      numericFields,
    } satisfies SelectionStatisticsSummary];
  });
}

export interface MapAnalysisRecommendationDispatchPayload extends MapAnalysisDispatchPayloadBase {
  kind: "recommendation";
  requestId: string;
  source: "map-recommendation";
  flowId: AnalyticalFlowId;
  recommendationId: string;
  title: string;
  layerIds: string[];
  preferredMethod?: string;
  requiredInputs: string[];
  expectedOutput: string;
  scientificCaveat: string;
  readiness: MapAnalysisRecommendationReadiness;
  reasons: MapAnalysisRecommendationReason[];
  createdAt: string;
}