/* ================================================================== */
/*  GeometryWorkflowEngine                                             */
/*                                                                    */
/*  Canonical buffer / intersect / difference / union computation for */
/*  the Map Explorer spatial workflows (Prompt 13). This module is    */
/*  the single home for the heavy geometry math so that BOTH the      */
/*  main-thread bounded preview and the worker execution path run the */
/*  identical code — no forked implementation.                        */
/*                                                                    */
/*  `computeGeometryWorkflow` is the worker-facing entry point: it    */
/*  validates inputs (throwing GeometryWorkflowError on unusable      */
/*  input so failures surface), reports progress, runs the op, and    */
/*  returns a fully attributed computation (feature collection,       */
/*  metrics, bounds, geometry class, execution CRS, and the backend   */
/*  that actually ran).                                               */
/* ================================================================== */

import * as turf from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";

export type GeometryWorkflowOp = "buffer" | "intersect" | "difference" | "union";

/** Backend that actually executed the geometry op (truthful state). */
export type GeometryWorkflowBackend = "turf" | "geos-wasm";

export type GeometryWorkflowGeometryClass = "point" | "line" | "polygon" | "mixed" | "unknown";

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
 * geometry (transferred once via postMessage), the resolved execution
 * CRS, and the source layer ids for provenance — never the live store.
 */
export interface GeometryWorkflowRequest {
  op: GeometryWorkflowOp;
  /** Source feature collections in input order (buffer uses [0]; binary ops use [0,1]). */
  sources: FeatureCollection[];
  params: GeometryWorkflowParams;
  /** Resolved execution CRS from CrsPreflight; null when none was available. */
  executionCrs: string | null;
  sourceLayerIds: string[];
  /** Prefer the geos-wasm backend when available; falls back to turf. */
  preferGeos?: boolean;
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
/*  Canonical op implementations (turf)                                */
/* ------------------------------------------------------------------ */

export function computeBuffer(
  source: FeatureCollection,
  meters: number,
  options: { segments: number; dissolve: boolean; sourceLayerId: string },
  onFeature?: (index: number, total: number) => void,
): FeatureCollection {
  const buffered: Feature<Polygon | MultiPolygon>[] = [];
  const total = source.features.length;
  let index = 0;
  for (const feature of source.features) {
    index += 1;
    onFeature?.(index, total);
    if (!feature.geometry) continue;
    try {
      const result = turf.buffer(feature, meters, {
        units: "meters",
        steps: options.segments,
      });
      if (!result) continue;
      const cloned = result as Feature<Polygon | MultiPolygon>;
      cloned.properties = {
        ...(feature.properties ?? {}),
        __buffer_meters: meters,
        __buffer_source_id: feature.id ?? null,
        __buffer_source_layer: options.sourceLayerId,
      };
      buffered.push(cloned);
    } catch {
      // skip
    }
  }

  if (options.dissolve && buffered.length > 1) {
    const merged = mergePolygons(buffered, "buffered_dissolved");
    if (merged) {
      merged.properties = {
        __buffer_meters: meters,
        __buffer_source_layer: options.sourceLayerId,
        __dissolved: true,
        __input_features: source.features.length,
      };
      return { type: "FeatureCollection", features: [merged] };
    }
  }

  return { type: "FeatureCollection", features: buffered };
}

export function computeIntersect(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  preserveAttributes: "a" | "b" | "both",
  onPair?: (index: number, total: number) => void,
): { featureCollection: FeatureCollection; pairCount: number } {
  const features: Feature[] = [];
  let pairCount = 0;
  const total = sourceA.features.length;
  let aIndex = 0;
  for (const a of sourceA.features) {
    aIndex += 1;
    onPair?.(aIndex, total);
    if (!isPolygonGeometry(a.geometry)) continue;
    for (const b of sourceB.features) {
      if (!isPolygonGeometry(b.geometry)) continue;
      try {
        const fc = turf.featureCollection([
          a as Feature<Polygon | MultiPolygon>,
          b as Feature<Polygon | MultiPolygon>,
        ]);
        const result = turf.intersect(fc);
        if (!result) continue;
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
        features.push({
          ...(result as Feature),
          properties,
        });
      } catch {
        // skip
      }
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
  onFeature?: (index: number, total: number) => void,
): FeatureCollection {
  const dissolveB = mergeAllPolygons(sourceB);
  if (!dissolveB) {
    return { type: "FeatureCollection", features: [] };
  }
  const features: Feature[] = [];
  const total = sourceA.features.length;
  let index = 0;
  for (const a of sourceA.features) {
    index += 1;
    onFeature?.(index, total);
    if (!isPolygonGeometry(a.geometry)) continue;
    try {
      const fc = turf.featureCollection([
        a as Feature<Polygon | MultiPolygon>,
        dissolveB,
      ]);
      const result = turf.difference(fc);
      if (!result) continue;
      const properties = { ...(a.properties ?? {}), __difference: true };
      features.push({
        ...(result as Feature),
        properties,
      });
    } catch {
      // skip
    }
  }
  return { type: "FeatureCollection", features };
}

export function computeUnion(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  dissolve: boolean,
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

  const merged = mergePolygons(allPolygons, "union_dissolved");
  if (!merged) {
    return { type: "FeatureCollection", features: allPolygons };
  }
  merged.properties = { ...(merged.properties ?? {}), __dissolved: true };
  return { type: "FeatureCollection", features: [merged] };
}

/* ------------------------------------------------------------------ */
/*  Local metric helpers (engine-scoped; do not depend on the service) */
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

/* ------------------------------------------------------------------ */
/*  Worker-facing entry point                                          */
/* ------------------------------------------------------------------ */

const PROGRESS_REPORT_STRIDE = 250;

/**
 * Compute a geometry workflow op end-to-end. Runs the canonical turf
 * implementation by default; when `preferGeos` is set and the geos-wasm
 * backend initialises, that backend is used and recorded — otherwise it
 * transparently falls back to turf so a missing/failed wasm load never
 * breaks the operation. Throws GeometryWorkflowError on unusable input.
 */
export async function computeGeometryWorkflow(
  request: GeometryWorkflowRequest,
  report?: GeometryWorkflowReporter,
): Promise<GeometryWorkflowComputation> {
  const emit = (progress: GeometryWorkflowProgress) => report?.(progress);
  validateRequest(request);

  emit({ percent: 4, stage: "Preparing geometry inputs" });

  const backend: GeometryWorkflowBackend = request.preferGeos
    ? await resolvePreferredBackend()
    : "turf";

  const [sourceA, sourceB] = request.sources;
  const inputFeatureCount = request.sources.reduce((total, fc) => total + fc.features.length, 0);

  const makeFeatureReporter = (verb: string) => (index: number, total: number) => {
    if (total <= 0) return;
    if (index % PROGRESS_REPORT_STRIDE !== 0 && index !== total) return;
    const ratio = index / total;
    emit({
      percent: 8 + Math.round(ratio * 84),
      stage: `${verb} features`,
      detail: `${index.toLocaleString()} / ${total.toLocaleString()}`,
    });
  };

  let featureCollection: FeatureCollection;
  let metrics: Record<string, number | string | null> = {};

  switch (request.params.op) {
    case "buffer": {
      const params = request.params;
      featureCollection = computeBuffer(
        sourceA,
        params.meters,
        { segments: params.segments, dissolve: params.dissolve, sourceLayerId: params.sourceLayerId },
        makeFeatureReporter("Buffering"),
      );
      metrics = {
        buffer_meters: params.meters,
        buffer_segments: params.segments,
        buffered_features: featureCollection.features.length,
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
        makeFeatureReporter("Intersecting"),
      );
      featureCollection = result.featureCollection;
      metrics = {
        intersect_pairs: result.pairCount,
        result_features: featureCollection.features.length,
      };
      break;
    }
    case "difference": {
      featureCollection = computeDifference(
        sourceA,
        ensureSource(sourceB, request.op),
        makeFeatureReporter("Differencing"),
      );
      metrics = { result_features: featureCollection.features.length };
      break;
    }
    case "union": {
      featureCollection = computeUnion(sourceA, ensureSource(sourceB, request.op), request.params.dissolve);
      metrics = {
        result_features: featureCollection.features.length,
        dissolved: request.params.dissolve ? 1 : 0,
      };
      break;
    }
    default:
      throw new GeometryWorkflowError(request.op, `Unsupported geometry workflow op: ${String(request.op)}`);
  }

  emit({ percent: 94, stage: "Measuring output" });
  const bounds = boundsOf(featureCollection);
  metrics.area_km2 = safeAreaKm2(featureCollection);
  metrics.geometry_backend = backend;

  emit({ percent: 100, stage: "Geometry result ready" });

  return {
    op: request.op,
    featureCollection,
    featureCount: featureCollection.features.length,
    geometryClass: classifyFeatureCollectionGeometry(featureCollection),
    bounds,
    metrics,
    backend,
    executionCrs: request.executionCrs,
    inputFeatureCount,
  };
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

/* ------------------------------------------------------------------ */
/*  Backend resolution (geos-wasm preferred, turf fallback)            */
/* ------------------------------------------------------------------ */

let geosBackendState: GeometryWorkflowBackend | null = null;

/**
 * Attempt to initialise the geos-wasm backend once. Any failure (missing
 * wasm, non-worker runtime, init error) falls back to turf so the op
 * always completes. The current build uses turf for the math and records
 * geos-wasm availability for forward compatibility; geos boolean overlay
 * wiring is gated behind a verified wasm load.
 */
async function resolvePreferredBackend(): Promise<GeometryWorkflowBackend> {
  if (geosBackendState) return geosBackendState;
  try {
    const available = await tryInitGeos();
    geosBackendState = available ? "geos-wasm" : "turf";
  } catch {
    geosBackendState = "turf";
  }
  return geosBackendState;
}

async function tryInitGeos(): Promise<boolean> {
  // geos-wasm wasm loading is only meaningful in a worker/browser runtime.
  if (typeof WebAssembly === "undefined") return false;
  // The geos backend is initialised lazily by the worker entry; until a
  // verified wasm load lands we keep turf as the computation engine and do
  // not claim geos ran. Returning false keeps `backend: "turf"` truthful.
  return false;
}

/** Test/diagnostic hook: reset memoised backend state. */
export function __resetGeometryBackendForTests(): void {
  geosBackendState = null;
}
