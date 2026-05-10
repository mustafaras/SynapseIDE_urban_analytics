import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { useFlowStore } from "@/stores/useFlowStore";

export const MAP_ANALYSIS_DISPATCH_KEY = "map_analysis_dispatch";
export const MAP_ANALYSIS_VIEW_RESTRICTION_KEY = "map_analysis_view_restriction";

export interface MapDispatchOriginPoint {
  lng: number;
  lat: number;
}

export interface MapViewRestriction {
  enabled: boolean;
  bounds: [number, number, number, number] | null;
  updatedAt: string;
}

export interface MapFlowAoiDispatchPayload {
  kind: "flow-aoi";
  flowId: AnalyticalFlowId;
  requestId: string;
  source: "drawn-aoi" | "map-context-menu";
  aoi: Feature<Polygon | MultiPolygon>;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  createdAt: string;
}

export interface MapIsochroneDispatchPayload {
  kind: "isochrone";
  requestId: string;
  source: "map-context-menu";
  origin: MapDispatchOriginPoint;
  thresholdMinutes: number;
  restrictToView: boolean;
  viewBounds?: [number, number, number, number];
  createdAt: string;
}

export interface MapHotSpotDispatchPayload {
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
  };
  queueMapDispatch(payload);
  dispatchNavigate({ tab: "Workflows", flowId: "emerging_hot_spot" });
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