/* ================================================================== */
/*  GeometryWorkflowEngine                                             */
/*                                                                    */
/*  Canonical buffer / intersect / difference / union computation for */
/*  the Map Explorer spatial workflows (Prompt 13). Single home for    */
/*  the heavy geometry math so the main-thread bounded preview and the */
/*  worker execution run identical code — no fork.                     */
/*                                                                    */
/*  Two interchangeable backends implement the `GeometryOps` seam:     */
/*   - turf (geodesic, lng/lat) — synchronous; used by the preview.    */
/*   - geos-wasm (rigorous planar topology) — used by the worker when  */
/*     a projected execution CRS is available. The engine reprojects   */
/*     display(4326) → execution once, runs geos in projected metres,  */
/*     then reprojects the result back; if geos cannot initialise it   */
/*     transparently falls back to turf. The backend that ran is       */
/*     recorded truthfully on the result.                              */
/* ================================================================== */

import * as turf from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";
import { isProjected } from "../crs/MapProjectionService";
import {
  createGeosGeometryOps,
  getGeosModule,
  isGeosBackendAvailable,
  reprojectGeometry,
} from "./geosGeometryBackend";
import {
  buildFeatureCollectionChangeToken,
  projectFeatureCollectionWithReprojectionCache,
  summarizeReprojectionCacheRun,
  type ReprojectionCacheAccessSummary,
  type ReprojectionCacheRunSummary,
} from "./ReprojectionCache";

export type GeometryWorkflowOp = "buffer" | "intersect" | "difference" | "union";

/** Backend that actually executed the geometry op (truthful state). */
export type GeometryWorkflowBackend = "turf" | "geos-wasm";

export type GeometryWorkflowGeometryClass = "point" | "line" | "polygon" | "mixed" | "unknown";

/**
 * Pluggable geometry primitives. `turfGeometryOps` runs geodesically in
 * lng/lat; the geos-wasm ops run on geometries already in a projected CRS.
 * The op bookkeeping (attribute tagging, dissolve, progress) is shared.
 */
export interface GeometryOps {
  name: GeometryWorkflowBackend;
  buffer(geometry: Geometry, meters: number, segments: number): Geometry | null;
  intersection(a: Geometry, b: Geometry): Geometry | null;
  difference(a: Geometry, b: Geometry): Geometry | null;
  union(a: Geometry, b: Geometry): Geometry | null;
  unaryUnion(geometries: Geometry[]): Geometry | null;
}

export interface GeometryWorkflowBufferParams {
  op: "buffer";
  meters: number;
  segments: number;
  dissolve: boolean;
  sourceLayerId: string;
}

export interface GeometryWorkflowIntersectParams {
  op: "intersect";
  preserveAttributes: "a" | "b" | "both";
}

export interface GeometryWorkflowDifferenceParams {
  op: "difference";
}

export interface GeometryWorkflowUnionParams {
  op: "union";
  dissolve: boolean;
}

export type GeometryWorkflowParams =
  | GeometryWorkflowBufferParams
  | GeometryWorkflowIntersectParams
  | GeometryWorkflowDifferenceParams
  | GeometryWorkflowUnionParams;

/**
 * Serializable request handed to the worker. Carries the full source
 * geometry (in `displayCrs`, transferred once via postMessage), the resolved
 * execution CRS, and the source layer ids for provenance — never the store.
 */
export interface GeometryWorkflowRequest {
  op: GeometryWorkflowOp;
  /** Source feature collections in input order (buffer uses [0]; binary ops use [0,1]). */
  sources: FeatureCollection[];
  params: GeometryWorkflowParams;
  /** Resolved execution CRS from CrsPreflight; null when none was available. */
  executionCrs: string | null;
  /** CRS the source geometry is stored/rendered in (MapLibre canvas = EPSG:4326). */
  displayCrs?: string;
  sourceLayerIds: string[];
  sourceFingerprints?: GeometryWorkflowSourceFingerprint[];
  /** Prefer the geos-wasm backend when available + a projected execution CRS exists. */
  preferGeos?: boolean;
}

export interface GeometryWorkflowSourceFingerprint {
  sourceId: string;
  sourceCrs?: string | null;
  dataVersion?: string | null;
  changeToken?: string | null;
}

export interface GeometryWorkflowComputation {
  op: GeometryWorkflowOp;
  featureCollection: FeatureCollection;
  featureCount: number;
  geometryClass: GeometryWorkflowGeometryClass;
  bounds: [number, number, number, number] | null;
  metrics: Record<string, number | string | null>;
  backend: GeometryWorkflowBackend;
  /** Echoed from the request so the result is self-describing for the manifest. */
  executionCrs: string | null;
  inputFeatureCount: number;
  reprojectionCache?: ReprojectionCacheRunSummary;
}

export interface GeometryWorkflowProgress {
  percent: number;
  stage?: string | undefined;
  detail?: string | undefined;
}

export type GeometryWorkflowReporter = (progress: GeometryWorkflowProgress) => void;

/** Thrown when a request cannot be executed; surfaced as a worker error. */
export class GeometryWorkflowError extends Error {
  readonly op: GeometryWorkflowOp;

  constructor(op: GeometryWorkflowOp, message: string) {
    super(message);
    this.name = "GeometryWorkflowError";
    this.op = op;
  }
}

const DEFAULT_DISPLAY_CRS = "EPSG:4326";

/* ------------------------------------------------------------------ */
/*  Shared polygon helpers (canonical — imported by MapWorkflowService) */
/* ------------------------------------------------------------------ */

export function isPolygonGeometry(geometry: Geometry | null | undefined): boolean {
  return !!geometry && (geometry.type === "Polygon" || geometry.type === "MultiPolygon");
}

export function mergePolygons(
  polygons: Array<Feature<Polygon | MultiPolygon>>,
  label = "AOI",
): Feature<Polygon | MultiPolygon> | null {
  if (polygons.length === 0) return null;
  if (polygons.length === 1) {
    const cloned = JSON.parse(JSON.stringify(polygons[0])) as Feature<Polygon | MultiPolygon>;
    cloned.properties = { ...(cloned.properties ?? {}), aoi_label: label };
    return cloned;
  }
  let acc: Feature<Polygon | MultiPolygon> | null = null;
  for (const polygon of polygons) {
    if (!acc) {
      acc = polygon;
      continue;
    }
    try {
      const fc = turf.featureCollection([acc, polygon]);
      const merged = turf.union(fc);
      if (merged) {
        acc = merged as Feature<Polygon | MultiPolygon>;
      }
    } catch {
      // skip
    }
  }
  if (acc) {
    acc.properties = { ...(acc.properties ?? {}), aoi_label: label };
  }
  return acc;
}

export function mergeAllPolygons(
  source: FeatureCollection,
): Feature<Polygon | MultiPolygon> | null {
  const polygons = source.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon> => isPolygonGeometry(feature.geometry),
  );
  return mergePolygons(polygons);
}

/* ------------------------------------------------------------------ */
/*  Backends                                                           */
/* ------------------------------------------------------------------ */

function geometryFeature(geometry: Geometry): Feature {
  return { type: "Feature", properties: {}, geometry };
}

/** turf backend — geodesic, operates directly on lng/lat geometries. */
export const turfGeometryOps: GeometryOps = {
  name: "turf",
  buffer(geometry, meters, segments) {
    try {
      const result = turf.buffer(geometryFeature(geometry), meters, { units: "meters", steps: segments });
      return result?.geometry ?? null;
    } catch {
      return null;
    }
  },
  intersection(a, b) {
    try {
      const result = turf.intersect(turf.featureCollection([
        geometryFeature(a) as Feature<Polygon | MultiPolygon>,
        geometryFeature(b) as Feature<Polygon | MultiPolygon>,
      ]));
      return result?.geometry ?? null;
    } catch {
      return null;
    }
  },
  difference(a, b) {
    try {
      const result = turf.difference(turf.featureCollection([
        geometryFeature(a) as Feature<Polygon | MultiPolygon>,
        geometryFeature(b) as Feature<Polygon | MultiPolygon>,
      ]));
      return result?.geometry ?? null;
    } catch {
      return null;
    }
  },
  union(a, b) {
    try {
      const result = turf.union(turf.featureCollection([
        geometryFeature(a) as Feature<Polygon | MultiPolygon>,
        geometryFeature(b) as Feature<Polygon | MultiPolygon>,
      ]));
      return result?.geometry ?? null;
    } catch {
      return null;
    }
  },
  unaryUnion(geometries) {
    if (geometries.length === 0) return null;
    let acc: Geometry | null = geometries[0] ?? null;
    for (let index = 1; index < geometries.length; index += 1) {
      const next = geometries[index];
      if (!acc || !next) continue;
      try {
        const merged = turf.union(turf.featureCollection([
          geometryFeature(acc) as Feature<Polygon | MultiPolygon>,
          geometryFeature(next) as Feature<Polygon | MultiPolygon>,
        ]));
        if (merged?.geometry) acc = merged.geometry;
      } catch {
        // skip
      }
    }
    return acc;
  },
};

/* ------------------------------------------------------------------ */
/*  Canonical op implementations (backend-agnostic via GeometryOps)    */
/* ------------------------------------------------------------------ */

export function computeBuffer(
  source: FeatureCollection,
  meters: number,
  options: { segments: number; dissolve: boolean; sourceLayerId: string },
  ops: GeometryOps = turfGeometryOps,
  onFeature?: (index: number, total: number) => void,
): FeatureCollection {
  const buffered: Feature<Polygon | MultiPolygon>[] = [];
  const total = source.features.length;
  let index = 0;
  for (const feature of source.features) {
    index += 1;
    onFeature?.(index, total);
    if (!feature.geometry) continue;
    const geometry = ops.buffer(feature.geometry, meters, options.segments);
    if (!geometry) continue;
    buffered.push({
      type: "Feature",
      geometry: geometry as Polygon | MultiPolygon,
      properties: {
        ...(feature.properties ?? {}),
        __buffer_meters: meters,
        __buffer_source_id: feature.id ?? null,
        __buffer_source_layer: options.sourceLayerId,
      },
    });
  }

  if (options.dissolve && buffered.length > 1) {
    const merged = ops.unaryUnion(buffered.map((feature) => feature.geometry));
    if (merged) {
      return {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: merged as Polygon | MultiPolygon,
          properties: {
            __buffer_meters: meters,
            __buffer_source_layer: options.sourceLayerId,
            __dissolved: true,
            __input_features: source.features.length,
          },
        }],
      };
    }
  }

  return { type: "FeatureCollection", features: buffered };
}

export function computeIntersect(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  preserveAttributes: "a" | "b" | "both",
  ops: GeometryOps = turfGeometryOps,
  onPair?: (index: number, total: number) => void,
): { featureCollection: FeatureCollection; pairCount: number } {
  const features: Feature[] = [];
  let pairCount = 0;
  const total = sourceA.features.length;
  let aIndex = 0;
  for (const a of sourceA.features) {
    aIndex += 1;
    onPair?.(aIndex, total);
    if (!isPolygonGeometry(a.geometry) || !a.geometry) continue;
    for (const b of sourceB.features) {
      if (!isPolygonGeometry(b.geometry) || !b.geometry) continue;
      const geometry = ops.intersection(a.geometry, b.geometry);
      if (!geometry) continue;
      pairCount += 1;
      const properties: Record<string, unknown> = {};
      if (preserveAttributes === "a" || preserveAttributes === "both") {
        for (const [key, value] of Object.entries(a.properties ?? {})) {
          properties[`a_${key}`] = value;
        }
      }
      if (preserveAttributes === "b" || preserveAttributes === "both") {
        for (const [key, value] of Object.entries(b.properties ?? {})) {
          properties[`b_${key}`] = value;
        }
      }
      properties.__intersect_pair_index = pairCount;
      features.push({ type: "Feature", geometry, properties });
    }
  }
  return {
    featureCollection: { type: "FeatureCollection", features },
    pairCount,
  };
}

export function computeDifference(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  ops: GeometryOps = turfGeometryOps,
  onFeature?: (index: number, total: number) => void,
): FeatureCollection {
  const dissolveB = ops.unaryUnion(
    sourceB.features
      .filter((feature) => isPolygonGeometry(feature.geometry) && feature.geometry)
      .map((feature) => feature.geometry as Geometry),
  );
  if (!dissolveB) {
    return { type: "FeatureCollection", features: [] };
  }
  const features: Feature[] = [];
  const total = sourceA.features.length;
  let index = 0;
  for (const a of sourceA.features) {
    index += 1;
    onFeature?.(index, total);
    if (!isPolygonGeometry(a.geometry) || !a.geometry) continue;
    const geometry = ops.difference(a.geometry, dissolveB);
    if (!geometry) continue;
    features.push({
      type: "Feature",
      geometry,
      properties: { ...(a.properties ?? {}), __difference: true },
    });
  }
  return { type: "FeatureCollection", features };
}

export function computeUnion(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  dissolve: boolean,
  ops: GeometryOps = turfGeometryOps,
): FeatureCollection {
  const allPolygons: Array<Feature<Polygon | MultiPolygon>> = [];
  for (const feature of sourceA.features) {
    if (isPolygonGeometry(feature.geometry)) {
      allPolygons.push({ ...(feature as Feature<Polygon | MultiPolygon>), properties: { ...(feature.properties ?? {}), __union_origin: "A" } });
    }
  }
  for (const feature of sourceB.features) {
    if (isPolygonGeometry(feature.geometry)) {
      allPolygons.push({ ...(feature as Feature<Polygon | MultiPolygon>), properties: { ...(feature.properties ?? {}), __union_origin: "B" } });
    }
  }

  if (!dissolve) {
    return { type: "FeatureCollection", features: allPolygons };
  }

  const merged = ops.unaryUnion(allPolygons.map((feature) => feature.geometry));
  if (!merged) {
    return { type: "FeatureCollection", features: allPolygons };
  }
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: merged as Polygon | MultiPolygon,
      properties: { __dissolved: true },
    }],
  };
}

/* ------------------------------------------------------------------ */
/*  Local metric helpers                                               */
/* ------------------------------------------------------------------ */

function safeAreaKm2(fc: FeatureCollection): number {
  try {
    const m2 = turf.area(fc);
    if (!Number.isFinite(m2)) return 0;
    return Math.max(0, m2 / 1_000_000);
  } catch {
    return 0;
  }
}

function boundsOf(fc: FeatureCollection): [number, number, number, number] | null {
  if (fc.features.length === 0) return null;
  try {
    const bbox = turf.bbox(fc);
    if (bbox.length < 4 || bbox.some((value) => !Number.isFinite(value))) return null;
    return [bbox[0], bbox[1], bbox[2], bbox[3]];
  } catch {
    return null;
  }
}

function classifyFeatureCollectionGeometry(fc: FeatureCollection): GeometryWorkflowGeometryClass {
  const kinds = new Set<string>();
  for (const feature of fc.features) {
    const type = feature.geometry?.type;
    if (!type) continue;
    if (type.includes("Point")) kinds.add("point");
    else if (type.includes("LineString")) kinds.add("line");
    else if (type.includes("Polygon")) kinds.add("polygon");
  }
  if (kinds.size === 0) return "unknown";
  if (kinds.size > 1) return "mixed";
  return [...kinds][0] as GeometryWorkflowGeometryClass;
}

function reprojectFeatureCollection(fc: FeatureCollection, from: string, to: string): FeatureCollection {
  if (from === to) return fc;
  return {
    type: "FeatureCollection",
    features: fc.features.map((feature) =>
      feature.geometry
        ? { ...feature, geometry: reprojectGeometry(feature.geometry, from, to) }
        : feature,
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  Worker-facing entry point                                          */
/* ------------------------------------------------------------------ */

const PROGRESS_REPORT_STRIDE = 250;

interface ResolvedBackend {
  ops: GeometryOps;
  backend: GeometryWorkflowBackend;
}

/**
 * Choose the geos-wasm backend when requested, a projected execution CRS is
 * available, and the wasm initialises; otherwise turf. Never throws — a
 * failed geos load degrades to turf so the op always completes.
 */
async function resolveBackend(request: GeometryWorkflowRequest): Promise<ResolvedBackend> {
  const wantsGeos = request.preferGeos === true
    && typeof request.executionCrs === "string"
    && isProjected(request.executionCrs);
  if (wantsGeos && (await isGeosBackendAvailable())) {
    const geos = await getGeosModule();
    if (geos) {
      return { ops: createGeosGeometryOps(geos), backend: "geos-wasm" };
    }
  }
  return { ops: turfGeometryOps, backend: "turf" };
}

/**
 * Compute a geometry workflow op end-to-end. Validates inputs (throwing
 * GeometryWorkflowError on unusable input), reports progress, runs the op on
 * the resolved backend, and returns a fully attributed computation whose
 * geometry is always in the display CRS.
 */
export async function computeGeometryWorkflow(
  request: GeometryWorkflowRequest,
  report?: GeometryWorkflowReporter,
): Promise<GeometryWorkflowComputation> {
  const emit = (progress: GeometryWorkflowProgress) => report?.(progress);
  validateRequest(request);

  emit({ percent: 4, stage: "Preparing geometry inputs" });

  const displayCrs = request.displayCrs ?? DEFAULT_DISPLAY_CRS;
  const { ops, backend } = await resolveBackend(request);
  const executionCrs = request.executionCrs;
  const inputFeatureCount = request.sources.reduce((total, fc) => total + fc.features.length, 0);

  // geos runs in projected metres: reproject display → execution once.
  const usesProjectedBackend = backend === "geos-wasm" && typeof executionCrs === "string";
  const projection = usesProjectedBackend
    ? projectSourcesForExecution(request, displayCrs, executionCrs as string, emit)
    : { sources: request.sources, reprojectionCache: null };

  return computeGeometryWorkflowWithSources({
    request,
    emit,
    ops,
    backend,
    sources: projection.sources,
    displayCrs,
    projectionCrs: usesProjectedBackend ? executionCrs as string : null,
    inputFeatureCount,
    reprojectionCache: projection.reprojectionCache,
  });
}

interface GeometryWorkflowCoreInput {
  request: GeometryWorkflowRequest;
  emit: (progress: GeometryWorkflowProgress) => void;
  ops: GeometryOps;
  backend: GeometryWorkflowBackend;
  sources: FeatureCollection[];
  displayCrs: string;
  projectionCrs: string | null;
  inputFeatureCount: number;
  reprojectionCache: ReprojectionCacheRunSummary | null;
}

function computeGeometryWorkflowWithSources(input: GeometryWorkflowCoreInput): GeometryWorkflowComputation {
  const { request, emit, ops, backend, sources, displayCrs, projectionCrs, inputFeatureCount, reprojectionCache } = input;
  const [sourceA, sourceB] = sources;
  if (!sourceA) {
    throw new GeometryWorkflowError(request.op, "The primary source layer has no geometry.");
  }

  const makeFeatureReporter = (verb: string) => (index: number, total: number) => {
    if (total <= 0) return;
    if (index % PROGRESS_REPORT_STRIDE !== 0 && index !== total) return;
    const ratio = index / total;
    emit({
      percent: 8 + Math.round(ratio * 80),
      stage: `${verb} features`,
      detail: `${index.toLocaleString()} / ${total.toLocaleString()}`,
    });
  };

  let computed: FeatureCollection;
  let metrics: Record<string, number | string | null> = {};

  switch (request.params.op) {
    case "buffer": {
      const params = request.params;
      computed = computeBuffer(
        sourceA,
        params.meters,
        { segments: params.segments, dissolve: params.dissolve, sourceLayerId: params.sourceLayerId },
        ops,
        makeFeatureReporter("Buffering"),
      );
      metrics = {
        buffer_meters: params.meters,
        buffer_segments: params.segments,
        buffered_features: computed.features.length,
        input_features: sourceA.features.length,
        dissolved: params.dissolve ? 1 : 0,
      };
      break;
    }
    case "intersect": {
      const result = computeIntersect(
        sourceA,
        ensureSource(sourceB, request.op),
        request.params.preserveAttributes,
        ops,
        makeFeatureReporter("Intersecting"),
      );
      computed = result.featureCollection;
      metrics = { intersect_pairs: result.pairCount, result_features: computed.features.length };
      break;
    }
    case "difference": {
      computed = computeDifference(
        sourceA,
        ensureSource(sourceB, request.op),
        ops,
        makeFeatureReporter("Differencing"),
      );
      metrics = { result_features: computed.features.length };
      break;
    }
    case "union": {
      computed = computeUnion(sourceA, ensureSource(sourceB, request.op), request.params.dissolve, ops);
      metrics = { result_features: computed.features.length, dissolved: request.params.dissolve ? 1 : 0 };
      break;
    }
    default:
      throw new GeometryWorkflowError(request.op, `Unsupported geometry workflow op: ${String(request.op)}`);
  }

  emit({ percent: 92, stage: "Finalising output" });

  const featureCollection = projectionCrs
    ? reprojectFeatureCollection(computed, projectionCrs, displayCrs)
    : computed;
  metrics.area_km2 = safeAreaKm2(featureCollection);
  metrics.geometry_backend = backend;
  if (reprojectionCache) {
    metrics.reprojection_cache_hits = reprojectionCache.hits;
    metrics.reprojection_cache_misses = reprojectionCache.misses;
    metrics.reprojection_cache_bypasses = reprojectionCache.bypasses;
    metrics.reprojection_cache_evictions = reprojectionCache.evictions;
    metrics.reprojection_cache_entries = reprojectionCache.entries;
    metrics.reprojection_cache_hit_rate = Math.round(reprojectionCache.hitRate * 1000) / 1000;
  }

  emit({ percent: 100, stage: "Geometry result ready" });

  return {
    op: request.op,
    featureCollection,
    featureCount: featureCollection.features.length,
    geometryClass: classifyFeatureCollectionGeometry(featureCollection),
    bounds: boundsOf(featureCollection),
    metrics,
    backend,
    executionCrs: request.executionCrs,
    inputFeatureCount,
    ...(reprojectionCache ? { reprojectionCache } : {}),
  };
}

function projectSourcesForExecution(
  request: GeometryWorkflowRequest,
  displayCrs: string,
  executionCrs: string,
  emit: (progress: GeometryWorkflowProgress) => void,
): { sources: FeatureCollection[]; reprojectionCache: ReprojectionCacheRunSummary | null } {
  const accesses: ReprojectionCacheAccessSummary[] = [];
  const projected = request.sources.map((fc, index) => {
    const descriptor = resolveReprojectionDescriptor(request, fc, index, displayCrs, executionCrs);
    const result = projectFeatureCollectionWithReprojectionCache({
      descriptor,
      source: fc,
      project: () => reprojectFeatureCollection(fc, displayCrs, executionCrs),
    });
    accesses.push(result.access);
    if (result.access.status === "hit") {
      emit({
        percent: 6,
        stage: "Reprojection cache hit",
        detail: `${result.access.sourceId} -> ${result.access.targetCrs}`,
      });
    } else if (result.access.status === "miss") {
      emit({
        percent: 6,
        stage: "Reprojection cache miss",
        detail: `${result.access.sourceId} -> ${result.access.targetCrs}`,
      });
    }
    return result.featureCollection;
  });
  return { sources: projected, reprojectionCache: summarizeReprojectionCacheRun(accesses) };
}

function resolveReprojectionDescriptor(
  request: GeometryWorkflowRequest,
  fc: FeatureCollection,
  index: number,
  displayCrs: string,
  executionCrs: string,
) {
  const fingerprint = request.sourceFingerprints?.[index];
  const fallbackSourceId = request.sourceLayerIds[index] ?? `source-${index + 1}`;
  const sourceId = nonEmptyText(fingerprint?.sourceId) ?? fallbackSourceId;
  const sourceCrs = nonEmptyText(fingerprint?.sourceCrs) ?? displayCrs;
  const dataVersion = nonEmptyText(fingerprint?.dataVersion) ?? null;
  const changeToken = nonEmptyText(fingerprint?.changeToken) ?? dataVersion ?? buildFeatureCollectionChangeToken(fc);
  return {
    sourceId,
    sourceCrs,
    inputCrs: displayCrs,
    targetCrs: executionCrs,
    dataVersion,
    changeToken,
  };
}

function nonEmptyText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateRequest(request: GeometryWorkflowRequest): void {
  if (!Array.isArray(request.sources) || request.sources.length === 0) {
    throw new GeometryWorkflowError(request.op, "No source geometry was provided to the worker.");
  }
  const primary = request.sources[0];
  if (!primary || primary.features.length === 0) {
    throw new GeometryWorkflowError(request.op, "The primary source layer has no features to process.");
  }
  if (request.params.op === "buffer" && !(request.params.meters > 0)) {
    throw new GeometryWorkflowError(request.op, "Buffer distance must be greater than 0.");
  }
  if ((request.op === "intersect" || request.op === "difference" || request.op === "union")
    && (request.sources.length < 2 || !request.sources[1])) {
    throw new GeometryWorkflowError(request.op, `A ${request.op} operation requires two source layers.`);
  }
}

function ensureSource(source: FeatureCollection | undefined, op: GeometryWorkflowOp): FeatureCollection {
  if (!source) {
    throw new GeometryWorkflowError(op, `A ${op} operation requires a second source layer.`);
  }
  return source;
}
