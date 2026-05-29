import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { CrsPreflightResult } from "@/services/map/contracts/gisContracts";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";
import { normalizeCrs, WGS84_CRS } from "@/services/map/crs/MapProjectionService";

export type MapJoinMode = "attribute" | "spatial";
export type SpatialJoinPredicate = "intersects" | "within" | "nearest";
export type JoinCardinality = "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
export type JoinExecutionStrategy = "main-thread" | "worker" | "duckdb";

export const JOIN_WORKER_PAIR_THRESHOLD = 250_000;
export const JOIN_DUCKDB_PAIR_THRESHOLD = 2_000_000;
export const JOIN_UNMATCHED_SAMPLE_LIMIT = 8;

export interface MapJoinLayerInput {
  layerId: string;
  layerName: string;
  features: Feature[];
  crs: string | null;
  geometryClass: string;
  fields: string[];
}

export interface AttributeJoinRequest {
  mode: "attribute";
  primary: MapJoinLayerInput;
  join: MapJoinLayerInput;
  primaryKey: string;
  joinKey: string;
}

export interface SpatialJoinRequest {
  mode: "spatial";
  primary: MapJoinLayerInput;
  join: MapJoinLayerInput;
  predicate: SpatialJoinPredicate;
}

export type MapJoinPreviewRequest = AttributeJoinRequest | SpatialJoinRequest;

export interface JoinExecutionPlan {
  strategy: JoinExecutionStrategy;
  estimatedPairCount: number;
  reason: string;
}

export interface MapJoinPreviewSummary {
  mode: MapJoinMode;
  predicate: SpatialJoinPredicate | null;
  primaryLayerId: string;
  joinLayerId: string;
  primaryFeatureCount: number;
  joinFeatureCount: number;
  matchedPrimaryCount: number;
  unmatchedPrimaryCount: number;
  matchedPairCount: number;
  outputFeatureCount: number;
  cardinality: JoinCardinality;
  cardinalityLabel: "1:1" | "1:N" | "N:1" | "N:M";
  cardinalityWarning: string | null;
  unmatchedPrimaryIds: string[];
  execution: JoinExecutionPlan;
  primaryKey: string | null;
  joinKey: string | null;
}

export interface MapJoinPreviewResult {
  ok: boolean;
  blockers: string[];
  caveats: string[];
  logs: string[];
  crs: CrsPreflightResult | null;
  outputFeatures: FeatureCollection;
  outputGeometryClass: string;
  parameters: Record<string, unknown>;
  secondarySourceIds: string[];
  summary: MapJoinPreviewSummary;
}

export interface MapJoinWorkerInput {
  request: MapJoinPreviewRequest;
}

export type MapJoinWorkerOutput = MapJoinPreviewResult;

type ProgressReporter = (progress: { percent: number; stage?: string; detail?: string }) => void;

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export function resolveJoinExecutionPlan(primaryFeatureCount: number, joinFeatureCount: number): JoinExecutionPlan {
  const estimatedPairCount = primaryFeatureCount * joinFeatureCount;
  if (estimatedPairCount >= JOIN_DUCKDB_PAIR_THRESHOLD) {
    return {
      strategy: "duckdb",
      estimatedPairCount,
      reason: "Join pair count is large enough to require a DuckDB/worker-backed execution path.",
    };
  }
  if (estimatedPairCount >= JOIN_WORKER_PAIR_THRESHOLD) {
    return {
      strategy: "worker",
      estimatedPairCount,
      reason: "Join pair count is large enough to run outside the map UI thread.",
    };
  }
  return {
    strategy: "main-thread",
    estimatedPairCount,
    reason: "Join preview is small enough for an immediate in-memory preview.",
  };
}

export function buildAttributeJoinPreview(request: AttributeJoinRequest): MapJoinPreviewResult {
  const primaryKey = request.primaryKey.trim();
  const joinKey = request.joinKey.trim();
  const execution = resolveJoinExecutionPlan(request.primary.features.length, request.join.features.length);
  const logs = [
    `attribute-join: primary="${request.primary.layerName}" (${request.primary.layerId})`,
    `attribute-join: join="${request.join.layerName}" (${request.join.layerId})`,
    `attribute-join: execution strategy ${execution.strategy} (${execution.estimatedPairCount} candidate pair(s))`,
  ];
  const blockers: string[] = [];
  if (!primaryKey) blockers.push("Choose a key field from the primary layer.");
  if (!joinKey) blockers.push("Choose a key field from the join layer.");
  if (request.primary.features.length === 0) blockers.push("Primary layer has no rows to join.");
  if (request.join.features.length === 0) blockers.push("Join layer has no rows to match against.");
  if (primaryKey && request.primary.fields.length > 0 && !request.primary.fields.includes(primaryKey)) {
    blockers.push(`Primary key field "${primaryKey}" is not available on ${request.primary.layerName}.`);
  }
  if (joinKey && request.join.fields.length > 0 && !request.join.fields.includes(joinKey)) {
    blockers.push(`Join key field "${joinKey}" is not available on ${request.join.layerName}.`);
  }
  if (blockers.length > 0) {
    return blockedJoinResult(request, blockers, logs, execution, {
      primaryKey: primaryKey || null,
      joinKey: joinKey || null,
      predicate: null,
    });
  }

  const primaryKeyCounts = countKeys(request.primary.features, primaryKey);
  const joinKeyCounts = countKeys(request.join.features, joinKey);
  const joinIndex = indexByKey(request.join.features, joinKey);
  const matchedKeys = new Set<string>();
  const output: Feature[] = [];
  const unmatchedPrimaryIds: string[] = [];
  let matchedPrimaryCount = 0;
  let matchedPairCount = 0;

  request.primary.features.forEach((feature, featureIndex) => {
    const key = keyValue(feature, primaryKey);
    const matches = key ? joinIndex.get(key) ?? [] : [];
    if (matches.length === 0) {
      if (unmatchedPrimaryIds.length < JOIN_UNMATCHED_SAMPLE_LIMIT) {
        unmatchedPrimaryIds.push(featureId(feature, featureIndex));
      }
      output.push(buildJoinedFeature(feature, featureIndex, null, 0, 0, "attribute", null));
      return;
    }
    matchedPrimaryCount += 1;
    matchedPairCount += matches.length;
    matchedKeys.add(key!);
    matches.forEach((match, matchIndex) => {
      output.push(buildJoinedFeature(feature, featureIndex, match, matches.length, matchIndex, "attribute", null));
    });
  });

  const cardinality = classifyAttributeCardinality(primaryKeyCounts, joinKeyCounts, matchedKeys);
  const summary = buildSummary({
    mode: "attribute",
    predicate: null,
    request,
    matchedPrimaryCount,
    matchedPairCount,
    outputFeatureCount: output.length,
    unmatchedPrimaryIds,
    cardinality,
    execution,
    primaryKey,
    joinKey,
  });
  const caveats = buildJoinCaveats(summary);
  logs.push(`attribute-join: ${matchedPrimaryCount}/${request.primary.features.length} primary row(s) matched`);
  logs.push(`attribute-join: ${summary.unmatchedPrimaryCount} unmatched row(s); cardinality ${summary.cardinalityLabel}`);

  return {
    ok: true,
    blockers: [],
    caveats,
    logs,
    crs: null,
    outputFeatures: { type: "FeatureCollection", features: output },
    outputGeometryClass: request.primary.geometryClass,
    parameters: {
      mode: "attribute",
      primaryKey,
      joinKey,
      joinLayerId: request.join.layerId,
      matchedPrimaryCount,
      unmatchedPrimaryCount: summary.unmatchedPrimaryCount,
      cardinality: summary.cardinalityLabel,
      executionStrategy: execution.strategy,
    },
    secondarySourceIds: [request.join.layerId],
    summary,
  };
}

export function buildSpatialJoinPreview(request: SpatialJoinRequest): MapJoinPreviewResult {
  const execution = resolveJoinExecutionPlan(request.primary.features.length, request.join.features.length);
  const logs = [
    `spatial-join: primary="${request.primary.layerName}" (${request.primary.layerId})`,
    `spatial-join: join="${request.join.layerName}" (${request.join.layerId})`,
    `spatial-join: predicate ${request.predicate}`,
    `spatial-join: execution strategy ${execution.strategy} (${execution.estimatedPairCount} candidate pair(s))`,
  ];
  const blockers: string[] = [];
  if (request.primary.features.length === 0) blockers.push("Primary layer has no features to spatially join.");
  if (request.join.features.length === 0) blockers.push("Join layer has no features to spatially match against.");

  const crs = request.predicate === "nearest" ? nearestCrsPreflight(request) : topologicalCrsPreflight(request);
  if (crs.blocked && crs.reason) blockers.push(crs.reason);
  if (blockers.length > 0) {
    return blockedJoinResult(request, blockers, logs, execution, {
      primaryKey: null,
      joinKey: null,
      predicate: request.predicate,
      crs,
    });
  }

  const primaryMatchCounts = new Map<number, number>();
  const joinHitCounts = new Map<number, number>();
  const output: Feature[] = [];
  const unmatchedPrimaryIds: string[] = [];
  let matchedPrimaryCount = 0;
  let matchedPairCount = 0;

  request.primary.features.forEach((feature, featureIndex) => {
    const matches = request.predicate === "nearest"
      ? nearestMatches(feature, request.join.features)
      : topologicalMatches(feature, request.join.features, request.predicate);
    primaryMatchCounts.set(featureIndex, matches.length);
    if (matches.length === 0) {
      if (unmatchedPrimaryIds.length < JOIN_UNMATCHED_SAMPLE_LIMIT) {
        unmatchedPrimaryIds.push(featureId(feature, featureIndex));
      }
      output.push(buildJoinedFeature(feature, featureIndex, null, 0, 0, "spatial", null));
      return;
    }
    matchedPrimaryCount += 1;
    matchedPairCount += matches.length;
    matches.forEach((match, matchIndex) => {
      joinHitCounts.set(match.index, (joinHitCounts.get(match.index) ?? 0) + 1);
      output.push(buildJoinedFeature(feature, featureIndex, match.feature, matches.length, matchIndex, "spatial", match.distanceMeters));
    });
  });

  const cardinality = classifySpatialCardinality(primaryMatchCounts, joinHitCounts);
  const summary = buildSummary({
    mode: "spatial",
    predicate: request.predicate,
    request,
    matchedPrimaryCount,
    matchedPairCount,
    outputFeatureCount: output.length,
    unmatchedPrimaryIds,
    cardinality,
    execution,
    primaryKey: null,
    joinKey: null,
  });
  const caveats = [...crs.caveats, ...buildJoinCaveats(summary)];
  logs.push(`spatial-join: ${matchedPrimaryCount}/${request.primary.features.length} primary feature(s) matched`);
  logs.push(`spatial-join: ${summary.unmatchedPrimaryCount} unmatched feature(s); cardinality ${summary.cardinalityLabel}`);

  return {
    ok: true,
    blockers: [],
    caveats,
    logs,
    crs,
    outputFeatures: { type: "FeatureCollection", features: output },
    outputGeometryClass: request.primary.geometryClass,
    parameters: {
      mode: "spatial",
      predicate: request.predicate,
      joinLayerId: request.join.layerId,
      matchedPrimaryCount,
      unmatchedPrimaryCount: summary.unmatchedPrimaryCount,
      cardinality: summary.cardinalityLabel,
      executionStrategy: execution.strategy,
    },
    secondarySourceIds: [request.join.layerId],
    summary,
  };
}

export function runMapJoinWorkerTask(input: MapJoinWorkerInput, report: ProgressReporter): MapJoinWorkerOutput {
  report({ percent: 8, stage: "Preparing join preview" });
  const result = input.request.mode === "attribute"
    ? buildAttributeJoinPreview(input.request)
    : buildSpatialJoinPreview(input.request);
  report({
    percent: 92,
    stage: "Join preview complete",
    detail: `${result.summary.matchedPrimaryCount} matched / ${result.summary.unmatchedPrimaryCount} unmatched`,
  });
  report({ percent: 100, stage: "Join preview ready" });
  return result;
}

function blockedJoinResult(
  request: MapJoinPreviewRequest,
  blockers: string[],
  logs: string[],
  execution: JoinExecutionPlan,
  options: {
    primaryKey: string | null;
    joinKey: string | null;
    predicate: SpatialJoinPredicate | null;
    crs?: CrsPreflightResult;
  },
): MapJoinPreviewResult {
  const summary = buildSummary({
    mode: request.mode,
    predicate: options.predicate,
    request,
    matchedPrimaryCount: 0,
    matchedPairCount: 0,
    outputFeatureCount: 0,
    unmatchedPrimaryIds: [],
    cardinality: "one-to-one",
    execution,
    primaryKey: options.primaryKey,
    joinKey: options.joinKey,
  });
  return {
    ok: false,
    blockers,
    caveats: options.crs?.caveats ?? [],
    logs: [...logs, ...blockers.map((reason) => `${request.mode}-join: blocked — ${reason}`)],
    crs: options.crs ?? null,
    outputFeatures: EMPTY_FC,
    outputGeometryClass: request.primary.geometryClass,
    parameters: {
      mode: request.mode,
      joinLayerId: request.join.layerId,
      ...(options.primaryKey ? { primaryKey: options.primaryKey } : {}),
      ...(options.joinKey ? { joinKey: options.joinKey } : {}),
      ...(options.predicate ? { predicate: options.predicate } : {}),
      executionStrategy: execution.strategy,
    },
    secondarySourceIds: [request.join.layerId],
    summary,
  };
}

function buildSummary(input: {
  mode: MapJoinMode;
  predicate: SpatialJoinPredicate | null;
  request: MapJoinPreviewRequest;
  matchedPrimaryCount: number;
  matchedPairCount: number;
  outputFeatureCount: number;
  unmatchedPrimaryIds: string[];
  cardinality: JoinCardinality;
  execution: JoinExecutionPlan;
  primaryKey: string | null;
  joinKey: string | null;
}): MapJoinPreviewSummary {
  const cardinalityLabel = labelCardinality(input.cardinality);
  return {
    mode: input.mode,
    predicate: input.predicate,
    primaryLayerId: input.request.primary.layerId,
    joinLayerId: input.request.join.layerId,
    primaryFeatureCount: input.request.primary.features.length,
    joinFeatureCount: input.request.join.features.length,
    matchedPrimaryCount: input.matchedPrimaryCount,
    unmatchedPrimaryCount: Math.max(0, input.request.primary.features.length - input.matchedPrimaryCount),
    matchedPairCount: input.matchedPairCount,
    outputFeatureCount: input.outputFeatureCount,
    cardinality: input.cardinality,
    cardinalityLabel,
    cardinalityWarning: warningForCardinality(input.cardinality),
    unmatchedPrimaryIds: input.unmatchedPrimaryIds,
    execution: input.execution,
    primaryKey: input.primaryKey,
    joinKey: input.joinKey,
  };
}

function buildJoinCaveats(summary: MapJoinPreviewSummary): string[] {
  const caveats: string[] = [];
  if (summary.unmatchedPrimaryCount > 0) {
    caveats.push(`${summary.unmatchedPrimaryCount} primary row(s) have no match and will be preserved with __join_matched=false.`);
  }
  if (summary.cardinalityWarning) caveats.push(summary.cardinalityWarning);
  if (summary.execution.strategy !== "main-thread") caveats.push(summary.execution.reason);
  return caveats;
}

function countKeys(features: Feature[], field: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const feature of features) {
    const key = keyValue(feature, field);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function indexByKey(features: Feature[], field: string): Map<string, Feature[]> {
  const index = new Map<string, Feature[]>();
  for (const feature of features) {
    const key = keyValue(feature, field);
    if (!key) continue;
    const bucket = index.get(key) ?? [];
    bucket.push(feature);
    index.set(key, bucket);
  }
  return index;
}

function keyValue(feature: Feature, field: string): string | null {
  const value = feature.properties?.[field];
  if (value === undefined || value === null) return null;
  const text = String(value);
  return text.length > 0 ? text : null;
}

function classifyAttributeCardinality(
  primaryCounts: Map<string, number>,
  joinCounts: Map<string, number>,
  matchedKeys: Set<string>,
): JoinCardinality {
  let duplicatePrimary = false;
  let duplicateJoin = false;
  for (const key of matchedKeys) {
    if ((primaryCounts.get(key) ?? 0) > 1) duplicatePrimary = true;
    if ((joinCounts.get(key) ?? 0) > 1) duplicateJoin = true;
  }
  if (duplicatePrimary && duplicateJoin) return "many-to-many";
  if (duplicateJoin) return "one-to-many";
  if (duplicatePrimary) return "many-to-one";
  return "one-to-one";
}

function classifySpatialCardinality(primaryMatchCounts: Map<number, number>, joinHitCounts: Map<number, number>): JoinCardinality {
  const onePrimaryToManyJoin = [...primaryMatchCounts.values()].some((count) => count > 1);
  const manyPrimaryToOneJoin = [...joinHitCounts.values()].some((count) => count > 1);
  if (onePrimaryToManyJoin && manyPrimaryToOneJoin) return "many-to-many";
  if (onePrimaryToManyJoin) return "one-to-many";
  if (manyPrimaryToOneJoin) return "many-to-one";
  return "one-to-one";
}

function labelCardinality(cardinality: JoinCardinality): MapJoinPreviewSummary["cardinalityLabel"] {
  switch (cardinality) {
    case "one-to-many":
      return "1:N";
    case "many-to-one":
      return "N:1";
    case "many-to-many":
      return "N:M";
    case "one-to-one":
      return "1:1";
  }
}

function warningForCardinality(cardinality: JoinCardinality): string | null {
  switch (cardinality) {
    case "one-to-many":
      return "1:N cardinality will duplicate primary features when the join is applied.";
    case "many-to-one":
      return "N:1 cardinality maps multiple primary features to the same joined row; review aggregation assumptions.";
    case "many-to-many":
      return "N:M cardinality will duplicate primary and joined rows; review before applying.";
    case "one-to-one":
      return null;
  }
}

function featureId(feature: Feature, index: number): string {
  const propertyId = feature.properties?.id;
  if (feature.id !== undefined) return String(feature.id);
  if (propertyId !== undefined && propertyId !== null) return String(propertyId);
  return String(index + 1);
}

interface SpatialMatch {
  feature: Feature;
  index: number;
  distanceMeters: number | null;
}

function topologicalMatches(feature: Feature, joinFeatures: Feature[], predicate: Exclude<SpatialJoinPredicate, "nearest">): SpatialMatch[] {
  if (!feature.geometry) return [];
  const matches: SpatialMatch[] = [];
  joinFeatures.forEach((candidate, index) => {
    if (!candidate.geometry) return;
    try {
      const matched = predicate === "within"
        ? featureWithin(feature, candidate)
        : turf.booleanIntersects(feature as never, candidate as never);
      if (matched) matches.push({ feature: candidate, index, distanceMeters: null });
    } catch {
      // Invalid geometry is handled by topology QA; joins skip untestable pairs.
    }
  });
  return matches;
}

function featureWithin(feature: Feature, candidate: Feature): boolean {
  if (feature.geometry?.type === "Point" && (candidate.geometry?.type === "Polygon" || candidate.geometry?.type === "MultiPolygon")) {
    return turf.booleanPointInPolygon(feature as never, candidate as never);
  }
  return turf.booleanWithin(feature as never, candidate as never);
}

function nearestMatches(feature: Feature, joinFeatures: Feature[]): SpatialMatch[] {
  const source = centroidCoordinate(feature);
  if (!source) return [];
  let best: SpatialMatch | null = null;
  joinFeatures.forEach((candidate, index) => {
    const target = centroidCoordinate(candidate);
    if (!target) return;
    const distanceMeters = euclideanDistance(source, target);
    if (!best || distanceMeters < (best.distanceMeters ?? Number.POSITIVE_INFINITY)) {
      best = { feature: candidate, index, distanceMeters };
    }
  });
  return best ? [best] : [];
}

function centroidCoordinate(feature: Feature): [number, number] | null {
  if (!feature.geometry) return null;
  try {
    const centroid = turf.centroid(feature as never) as Feature<Point>;
    const [x, y] = centroid.geometry.coordinates;
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
  } catch {
    return null;
  }
  return null;
}

function euclideanDistance(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function buildJoinedFeature(
  feature: Feature,
  featureIndex: number,
  match: Feature | null,
  matchCount: number,
  matchIndex: number,
  mode: MapJoinMode,
  distanceMeters: number | null,
): Feature {
  const matched = match !== null;
  const joinedProps = match ? prefixedProperties(match) : {};
  const id = matched && matchCount > 1 && feature.id !== undefined ? `${String(feature.id)}:${matchIndex + 1}` : feature.id;
  return {
    type: "Feature",
    ...(id !== undefined ? { id } : {}),
    geometry: feature.geometry,
    properties: {
      ...(feature.properties ?? {}),
      ...joinedProps,
      __join_mode: mode,
      __join_matched: matched,
      __join_match_count: matchCount,
      __join_match_index: matched ? matchIndex + 1 : null,
      __join_primary_id: featureId(feature, featureIndex),
      ...(distanceMeters !== null ? { __join_distance_m: distanceMeters } : {}),
    },
  };
}

function prefixedProperties(feature: Feature): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(feature.properties ?? {})) {
    output[`join_${key}`] = value;
  }
  return output;
}

function topologicalCrsPreflight(request: SpatialJoinRequest): CrsPreflightResult {
  const crs = CrsPreflight.preflight(
    { id: "spatial-join", label: "Spatial join", metric: "visual", executionKind: "geodesic", displayCrs: WGS84_CRS },
    [
      { id: request.primary.layerId, name: request.primary.layerName, crs: request.primary.crs },
      { id: request.join.layerId, name: request.join.layerName, crs: request.join.crs },
    ],
  );
  const declared = [request.primary.crs, request.join.crs].filter((value): value is string => Boolean(value)).map(normalizeCrs);
  const unique = Array.from(new Set(declared));
  const caveats = [...crs.caveats];
  if (declared.length < 2) {
    caveats.push("One or more source layers lack CRS metadata; this topological join uses current map-display coordinates.");
  }
  if (unique.length > 1) {
    caveats.push(`Source layers declare different CRS values (${unique.join(", ")}); this topological join uses current map-display coordinates.`);
  }
  if (unique.includes(normalizeCrs(WGS84_CRS))) {
    caveats.push("Topological join uses EPSG:4326 display coordinates and does not make distance or area claims.");
  }
  return { ...crs, caveats };
}

function nearestCrsPreflight(request: SpatialJoinRequest): CrsPreflightResult {
  return CrsPreflight.preflight(
    { id: "spatial-join-nearest", label: "Nearest spatial join", metric: "distance", executionKind: "planar", displayCrs: WGS84_CRS },
    [
      { id: request.primary.layerId, name: request.primary.layerName, crs: request.primary.crs },
      { id: request.join.layerId, name: request.join.layerName, crs: request.join.crs },
    ],
  );
}