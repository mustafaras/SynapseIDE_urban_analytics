import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { SpatialOp } from "@/components/map/SpatialFilter";
import type { MapNLQueryLayer } from "../MapNLQueryBuilder";

export const MAP_QUERY_PLANNER_VERSION = "map-query-planner/v1";
export const MAP_QUERY_DEFAULT_MAX_LAYERS = 12;
export const MAP_QUERY_DEFAULT_MAX_FEATURES_PER_LAYER = 2_500;
export const MAP_QUERY_DEFAULT_MAX_TOTAL_FEATURES = 5_000;

export type MapQueryKind = "spatial" | "attribute";
export type MapSpatialQuerySource = "rectangle-select" | "lasso-select" | "spatial-filter";
export type MapSpatialPredicate = "intersects" | "within";
export type MapAttributeOperator =
  | "equals"
  | "not-equals"
  | "contains"
  | "starts-with"
  | "ends-with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "exists";

export type MapQueryBounds = [number, number, number, number];

export interface MapSpatialBboxShape {
  kind: "bbox";
  bounds: MapQueryBounds;
}

export interface MapSpatialPolygonShape {
  kind: "polygon";
  ring: Position[];
  bounds: MapQueryBounds;
}

export type MapSpatialQueryShape = MapSpatialBboxShape | MapSpatialPolygonShape;

export interface MapSpatialQueryDefinition {
  source: MapSpatialQuerySource;
  predicate?: MapSpatialPredicate;
  shape: MapSpatialQueryShape;
  spatialFilterOp?: SpatialOp;
}

export interface MapAttributeQueryPredicate {
  field: string;
  operator: MapAttributeOperator;
  value?: string | number | boolean | null;
  caseSensitive?: boolean;
}

export interface MapQueryExecutionScopeInput {
  mode: "visible-layers" | "current-extent" | "selected-layers" | "filter";
  layerIds?: readonly string[];
  bounds?: MapQueryBounds | null;
  maxLayers?: number;
  maxFeaturesPerLayer?: number;
  maxTotalFeatures?: number;
  reason?: string;
}

export interface MapQueryExecutionScope {
  mode: MapQueryExecutionScopeInput["mode"];
  layerIds: string[];
  bounds: MapQueryBounds | null;
  maxLayers: number;
  maxFeaturesPerLayer: number;
  maxTotalFeatures: number;
  bounded: true;
  reason: string;
}

export interface MapQueryPlanLayer {
  id: string;
  name: string;
  featureCount: number | null;
  crs: string | null;
  geometryType: string;
  tableKind: MapNLQueryLayer["tableKind"];
  sourceKind: MapNLQueryLayer["sourceKind"];
  fields: string[];
  sourceData: FeatureCollection;
}

export interface MapQueryProvenanceLayer {
  layerId: string;
  name: string;
  sourceKind: MapNLQueryLayer["sourceKind"];
  featureCount: number | null;
  crs: string | null;
}

export interface MapQueryProvenance {
  plannerVersion: typeof MAP_QUERY_PLANNER_VERSION;
  queryId: string;
  queryKind: MapQueryKind;
  source: MapSpatialQuerySource | "attribute-filter";
  plannedAt: string;
  executedAt: string | null;
  scope: MapQueryExecutionScope;
  sourceLayers: MapQueryProvenanceLayer[];
  spatial: {
    source: MapSpatialQuerySource;
    predicate: MapSpatialPredicate;
    spatialFilterOp: SpatialOp | null;
    shapeKind: MapSpatialQueryShape["kind"];
    bounds: MapQueryBounds;
  } | null;
  attribute: {
    field: string;
    operator: MapAttributeOperator;
    value: string | number | boolean | null;
    caseSensitive: boolean;
  } | null;
  warnings: string[];
  blockers: string[];
}

export interface MapQueryPlan {
  queryId: string;
  kind: MapQueryKind;
  createdAt: string;
  scope: MapQueryExecutionScope;
  layers: MapQueryPlanLayer[];
  spatial: MapSpatialQueryDefinition | null;
  attribute: MapAttributeQueryPredicate | null;
  warnings: string[];
  blockers: string[];
  provenance: MapQueryProvenance;
}

export interface PlanMapQueryInput {
  kind: MapQueryKind;
  layers: readonly MapNLQueryLayer[];
  scope: MapQueryExecutionScopeInput;
  spatial?: MapSpatialQueryDefinition;
  attribute?: MapAttributeQueryPredicate;
  requestedAt?: string;
  queryId?: string;
}

export interface MapQueryLayerResult {
  layerId: string;
  layerName: string;
  featureIds: string[];
  scannedFeatureCount: number;
  candidateFeatureCount: number;
  matchedFeatureCount: number;
  sourceFeatureCount: number;
  truncated: boolean;
  bounded: boolean;
}

export interface MapQueryExecutionResult {
  queryId: string;
  status: "success" | "blocked";
  matchedByLayer: Record<string, string[]>;
  layers: MapQueryLayerResult[];
  totalMatched: number;
  scannedFeatureCount: number;
  candidateFeatureCount: number;
  truncated: boolean;
  bounded: boolean;
  warnings: string[];
  blockers: string[];
  provenance: MapQueryProvenance;
}

export interface CollectSelectedFeaturesInput {
  layers: readonly MapNLQueryLayer[];
  selectedFeatureIds: Readonly<Record<string, readonly string[]>>;
  includeSelectionProperties?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeQueryId(kind: MapQueryKind, createdAt: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `map-query-${kind}-${createdAt.replace(/[^0-9]/g, "").slice(0, 14)}-${suffix}`;
}

function clampInteger(value: number | undefined, fallback: number, min: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.floor(value));
}

function normalizeBounds(bounds: MapQueryBounds): MapQueryBounds {
  const [aLng, aLat, bLng, bLat] = bounds;
  return [
    Math.min(aLng, bLng),
    Math.min(aLat, bLat),
    Math.max(aLng, bLng),
    Math.max(aLat, bLat),
  ];
}

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function visitGeometryPositions(geometry: Geometry, visitor: (position: [number, number]) => void): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((child) => visitGeometryPositions(child, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (isPosition(value)) {
      visitor([value[0], value[1]]);
      return;
    }
    if (!Array.isArray(value)) {
      return;
    }
    for (const entry of value) {
      walk(entry);
    }
  };
  walk(geometry.coordinates);
}

export function getMapFeatureBounds(feature: Feature): MapQueryBounds | null {
  if (!feature.geometry) {
    return null;
  }
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  visitGeometryPositions(feature.geometry, ([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function getMapFeatureCollectionBounds(collection: FeatureCollection): MapQueryBounds | null {
  let merged: MapQueryBounds | null = null;
  for (const feature of collection.features) {
    const bounds = getMapFeatureBounds(feature);
    if (!bounds) continue;
    merged = merged
      ? [
        Math.min(merged[0], bounds[0]),
        Math.min(merged[1], bounds[1]),
        Math.max(merged[2], bounds[2]),
        Math.max(merged[3], bounds[3]),
      ]
      : bounds;
  }
  return merged;
}

function boundsIntersect(first: MapQueryBounds, second: MapQueryBounds): boolean {
  return first[0] <= second[2] && first[2] >= second[0] && first[1] <= second[3] && first[3] >= second[1];
}

function boundsWithin(inner: MapQueryBounds, outer: MapQueryBounds): boolean {
  return inner[0] >= outer[0] && inner[2] <= outer[2] && inner[1] >= outer[1] && inner[3] <= outer[3];
}

function pointInBounds(position: [number, number], bounds: MapQueryBounds): boolean {
  return position[0] >= bounds[0] && position[0] <= bounds[2] && position[1] >= bounds[1] && position[1] <= bounds[3];
}

function getFirstPoint(feature: Feature): [number, number] | null {
  if (!feature.geometry) return null;
  if (feature.geometry.type === "Point") {
    const [lng, lat] = feature.geometry.coordinates;
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  }
  return null;
}

function closeRing(ring: Position[]): Position[] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

export function createMapSpatialBboxShape(bounds: MapQueryBounds): MapSpatialBboxShape {
  return { kind: "bbox", bounds: normalizeBounds(bounds) };
}

export function createMapSpatialPolygonShape(ring: readonly Position[]): MapSpatialPolygonShape | null {
  const sanitized = ring.filter(isPosition).map((position) => [position[0], position[1]] as Position);
  if (sanitized.length < 3) {
    return null;
  }
  const closed = closeRing(sanitized);
  const feature: Feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [closed] },
  };
  const bounds = getMapFeatureBounds(feature);
  return bounds ? { kind: "polygon", ring: closed, bounds: normalizeBounds(bounds) } : null;
}

function pointInRing(point: [number, number], ring: readonly Position[]): boolean {
  let inside = false;
  const x = point[0];
  const y = point[1];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = ring[i];
    const previous = ring[j];
    if (!isPosition(current) || !isPosition(previous)) continue;
    const xi = current[0];
    const yi = current[1];
    const xj = previous[0];
    const yj = previous[1];
    const denominator = yj - yi;
    if (Math.abs(denominator) < Number.EPSILON) continue;
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / denominator + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function featureMatchesSpatial(feature: Feature, spatial: MapSpatialQueryDefinition): boolean {
  const predicate = spatial.predicate ?? "intersects";
  const shapeBounds = spatial.shape.kind === "bbox" ? spatial.shape.bounds : spatial.shape.bounds;
  const featureBounds = getMapFeatureBounds(feature);
  if (!featureBounds) {
    return false;
  }
  if (predicate === "within" && !boundsWithin(featureBounds, shapeBounds)) {
    return false;
  }
  if (predicate === "intersects" && !boundsIntersect(featureBounds, shapeBounds)) {
    return false;
  }
  if (spatial.shape.kind === "bbox") {
    if (feature.geometry?.type === "Point") {
      const point = getFirstPoint(feature);
      return point ? pointInBounds(point, shapeBounds) : false;
    }
    return predicate === "within" ? boundsWithin(featureBounds, shapeBounds) : boundsIntersect(featureBounds, shapeBounds);
  }

  if (feature.geometry?.type === "Point") {
    const point = getFirstPoint(feature);
    return point ? pointInRing(point, spatial.shape.ring) : false;
  }
  return predicate === "within" ? boundsWithin(featureBounds, shapeBounds) : boundsIntersect(featureBounds, shapeBounds);
}

function normalizeComparable(value: unknown, caseSensitive: boolean): string {
  const text = value == null ? "" : String(value);
  return caseSensitive ? text : text.toLowerCase();
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function featureMatchesAttribute(feature: Feature, predicate: MapAttributeQueryPredicate): boolean {
  const field = predicate.field.trim();
  if (!field) return false;
  const properties = feature.properties ?? {};
  const actual = properties[field];
  const expected = predicate.value ?? null;
  const caseSensitive = predicate.caseSensitive ?? false;

  if (predicate.operator === "exists") {
    return actual !== undefined && actual !== null && String(actual).trim().length > 0;
  }

  if (predicate.operator === "gt" || predicate.operator === "gte" || predicate.operator === "lt" || predicate.operator === "lte") {
    const left = coerceNumber(actual);
    const right = coerceNumber(expected);
    if (left == null || right == null) return false;
    if (predicate.operator === "gt") return left > right;
    if (predicate.operator === "gte") return left >= right;
    if (predicate.operator === "lt") return left < right;
    return left <= right;
  }

  const actualText = normalizeComparable(actual, caseSensitive);
  const expectedText = normalizeComparable(expected, caseSensitive);
  if (predicate.operator === "equals") return actualText === expectedText;
  if (predicate.operator === "not-equals") return actualText !== expectedText;
  if (predicate.operator === "starts-with") return actualText.startsWith(expectedText);
  if (predicate.operator === "ends-with") return actualText.endsWith(expectedText);
  return actualText.includes(expectedText);
}

export function resolveMapQueryFeatureId(feature: Feature, sourceIndex: number): string {
  const properties = feature.properties ?? {};
  return String(
    feature.id ??
      properties.id ??
      properties.feature_id ??
      properties.detection_id ??
      properties.cell_id ??
      properties.agent_id ??
      properties.name ??
      `${sourceIndex + 1}`,
  );
}

function buildScope(input: PlanMapQueryInput, layerIds: string[]): MapQueryExecutionScope {
  return {
    mode: input.scope.mode,
    layerIds,
    bounds: input.scope.bounds ? normalizeBounds(input.scope.bounds) : null,
    maxLayers: clampInteger(input.scope.maxLayers, MAP_QUERY_DEFAULT_MAX_LAYERS, 1),
    maxFeaturesPerLayer: clampInteger(
      input.scope.maxFeaturesPerLayer,
      MAP_QUERY_DEFAULT_MAX_FEATURES_PER_LAYER,
      1,
    ),
    maxTotalFeatures: clampInteger(input.scope.maxTotalFeatures, MAP_QUERY_DEFAULT_MAX_TOTAL_FEATURES, 1),
    bounded: true,
    reason: input.scope.reason ?? "Map queries must declare a finite layer and feature scan scope.",
  };
}

function toPlanLayer(layer: MapNLQueryLayer): MapQueryPlanLayer | null {
  if (!layer.sourceData) return null;
  return {
    id: layer.id,
    name: layer.name,
    featureCount: layer.featureCount,
    crs: layer.crs,
    geometryType: layer.geometryType,
    tableKind: layer.tableKind,
    sourceKind: layer.sourceKind,
    fields: [...layer.fields],
    sourceData: layer.sourceData,
  };
}

function buildProvenance(input: {
  queryId: string;
  kind: MapQueryKind;
  source: MapSpatialQuerySource | "attribute-filter";
  plannedAt: string;
  executedAt: string | null;
  scope: MapQueryExecutionScope;
  layers: readonly MapQueryPlanLayer[];
  spatial: MapSpatialQueryDefinition | null;
  attribute: MapAttributeQueryPredicate | null;
  warnings: readonly string[];
  blockers: readonly string[];
}): MapQueryProvenance {
  return {
    plannerVersion: MAP_QUERY_PLANNER_VERSION,
    queryId: input.queryId,
    queryKind: input.kind,
    source: input.source,
    plannedAt: input.plannedAt,
    executedAt: input.executedAt,
    scope: input.scope,
    sourceLayers: input.layers.map((layer) => ({
      layerId: layer.id,
      name: layer.name,
      sourceKind: layer.sourceKind,
      featureCount: layer.featureCount,
      crs: layer.crs,
    })),
    spatial: input.spatial
      ? {
        source: input.spatial.source,
        predicate: input.spatial.predicate ?? "intersects",
        spatialFilterOp: input.spatial.spatialFilterOp ?? null,
        shapeKind: input.spatial.shape.kind,
        bounds: input.spatial.shape.kind === "bbox" ? input.spatial.shape.bounds : input.spatial.shape.bounds,
      }
      : null,
    attribute: input.attribute
      ? {
        field: input.attribute.field,
        operator: input.attribute.operator,
        value: input.attribute.value ?? null,
        caseSensitive: input.attribute.caseSensitive ?? false,
      }
      : null,
    warnings: [...input.warnings],
    blockers: [...input.blockers],
  };
}

export function planMapQuery(input: PlanMapQueryInput): MapQueryPlan {
  const createdAt = input.requestedAt ?? nowIso();
  const queryId = input.queryId ?? makeQueryId(input.kind, createdAt);
  const requestedLayerIds = input.scope.layerIds?.map(String) ?? input.layers.map((layer) => layer.id);
  const maxLayers = clampInteger(input.scope.maxLayers, MAP_QUERY_DEFAULT_MAX_LAYERS, 1);
  const scope = buildScope(input, requestedLayerIds.slice(0, maxLayers));
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (requestedLayerIds.length > scope.maxLayers) {
    warnings.push(`Query layer scope was capped at ${scope.maxLayers.toLocaleString()} layer(s).`);
  }

  const layerIdSet = new Set(requestedLayerIds.slice(0, scope.maxLayers));
  const layers = input.layers
    .filter((layer) => layerIdSet.has(layer.id))
    .map(toPlanLayer)
    .filter((layer): layer is MapQueryPlanLayer => layer != null);

  if (layers.length === 0) {
    blockers.push("No queryable inline GeoJSON layers are available inside the requested scope.");
  }
  if (input.kind === "spatial" && !input.spatial) {
    blockers.push("Spatial query requires a rectangle, lasso polygon, or spatial filter shape.");
  }
  if (input.kind === "attribute") {
    const field = input.attribute?.field.trim() ?? "";
    if (!input.attribute || field.length === 0) {
      blockers.push("Attribute query requires a field predicate.");
    }
  }

  const source = input.kind === "spatial" ? input.spatial?.source ?? "spatial-filter" : "attribute-filter";
  const spatial = input.spatial ?? null;
  const attribute = input.attribute ?? null;
  const provenance = buildProvenance({
    queryId,
    kind: input.kind,
    source,
    plannedAt: createdAt,
    executedAt: null,
    scope,
    layers,
    spatial,
    attribute,
    warnings,
    blockers,
  });

  return {
    queryId,
    kind: input.kind,
    createdAt,
    scope,
    layers,
    spatial,
    attribute,
    warnings,
    blockers,
    provenance,
  };
}

export function executeMapQueryPlan(plan: MapQueryPlan, executedAt: string = nowIso()): MapQueryExecutionResult {
  if (plan.blockers.length > 0) {
    return {
      queryId: plan.queryId,
      status: "blocked",
      matchedByLayer: {},
      layers: [],
      totalMatched: 0,
      scannedFeatureCount: 0,
      candidateFeatureCount: 0,
      truncated: false,
      bounded: true,
      warnings: [...plan.warnings],
      blockers: [...plan.blockers],
      provenance: buildProvenance({
        queryId: plan.queryId,
        kind: plan.kind,
        source: plan.provenance.source,
        plannedAt: plan.createdAt,
        executedAt,
        scope: plan.scope,
        layers: plan.layers,
        spatial: plan.spatial,
        attribute: plan.attribute,
        warnings: plan.warnings,
        blockers: plan.blockers,
      }),
    };
  }

  let remainingScanBudget = plan.scope.maxTotalFeatures;
  let totalMatched = 0;
  let totalScanned = 0;
  let totalCandidates = 0;
  let truncated = false;
  const matchedByLayer: Record<string, string[]> = {};
  const layerResults: MapQueryLayerResult[] = [];

  for (const layer of plan.layers) {
    if (remainingScanBudget <= 0) {
      truncated = true;
      break;
    }

    const features = layer.sourceData.features;
    const layerScanLimit = Math.min(features.length, plan.scope.maxFeaturesPerLayer, remainingScanBudget);
    const layerTruncated = features.length > layerScanLimit;
    const featureIds: string[] = [];
    let scanned = 0;
    let candidates = 0;

    for (let index = 0; index < layerScanLimit; index += 1) {
      const feature = features[index];
      if (!feature) continue;
      scanned += 1;
      const bounds = getMapFeatureBounds(feature);
      if (plan.scope.bounds && (!bounds || !boundsIntersect(bounds, plan.scope.bounds))) {
        continue;
      }
      candidates += 1;
      const spatialOk = plan.spatial ? featureMatchesSpatial(feature, plan.spatial) : true;
      const attributeOk = plan.attribute ? featureMatchesAttribute(feature, plan.attribute) : true;
      if (spatialOk && attributeOk) {
        featureIds.push(resolveMapQueryFeatureId(feature, index));
      }
    }

    remainingScanBudget -= scanned;
    totalScanned += scanned;
    totalCandidates += candidates;
    totalMatched += featureIds.length;
    truncated = truncated || layerTruncated || (features.length > scanned && remainingScanBudget <= 0);
    if (featureIds.length > 0) {
      matchedByLayer[layer.id] = featureIds;
    }
    layerResults.push({
      layerId: layer.id,
      layerName: layer.name,
      featureIds,
      scannedFeatureCount: scanned,
      candidateFeatureCount: candidates,
      matchedFeatureCount: featureIds.length,
      sourceFeatureCount: features.length,
      truncated: layerTruncated,
      bounded: true,
    });
  }

  const warnings = [...plan.warnings];
  if (truncated) {
    warnings.push("Query execution was truncated by the declared feature scan budget.");
  }

  return {
    queryId: plan.queryId,
    status: "success",
    matchedByLayer,
    layers: layerResults,
    totalMatched,
    scannedFeatureCount: totalScanned,
    candidateFeatureCount: totalCandidates,
    truncated,
    bounded: true,
    warnings,
    blockers: [],
    provenance: buildProvenance({
      queryId: plan.queryId,
      kind: plan.kind,
      source: plan.provenance.source,
      plannedAt: plan.createdAt,
      executedAt,
      scope: plan.scope,
      layers: plan.layers,
      spatial: plan.spatial,
      attribute: plan.attribute,
      warnings,
      blockers: [],
    }),
  };
}

function cloneFeature(feature: Feature, layerId: string, sourceIndex: number, includeSelectionProperties: boolean): Feature {
  const cloned = JSON.parse(JSON.stringify(feature)) as Feature;
  if (includeSelectionProperties) {
    cloned.properties = {
      ...(cloned.properties ?? {}),
      __selection_layer_id: layerId,
      __selection_feature_id: resolveMapQueryFeatureId(feature, sourceIndex),
    };
  }
  return cloned;
}

export function collectMapQuerySelectedFeatures(input: CollectSelectedFeaturesInput): FeatureCollection {
  const features: Feature[] = [];
  for (const layer of input.layers) {
    const selected = input.selectedFeatureIds[layer.id];
    if (!selected || selected.length === 0 || !layer.sourceData) {
      continue;
    }
    const selectedIds = new Set(selected.map(String));
    layer.sourceData.features.forEach((feature, index) => {
      if (selectedIds.has(resolveMapQueryFeatureId(feature, index))) {
        features.push(cloneFeature(feature, layer.id, index, input.includeSelectionProperties ?? true));
      }
    });
  }
  return { type: "FeatureCollection", features };
}
