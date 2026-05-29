/**
 * Prompt 44 — Large vector streaming + extent-based render/query.
 *
 * Supports two streaming strategies:
 *   1. FlatGeobuf — fetches only the bbox-intersecting slice via its
 *      HTTP range / bbox streaming API; never loads the full file.
 *   2. rbush index (in-memory or worker) — extent queries against a
 *      pre-built RBush tree; used when the full source is already local
 *      (e.g. a large imported GeoJSON) and we want instant pan queries.
 *
 * Anti-patterns avoided:
 *   - Full FlatGeobuf is never loaded into memory.
 *   - Pan/zoom never blocks on a fetch (debounce + cancellation).
 *   - inViewCount is always viewport-scoped; totalCount is null when unknown.
 */
import type { FeatureCollection, Feature } from "geojson";
import {
  buildRbushIndex,
  queryExtent,
  type ExtentIndex,
  type ExtentQueryResult,
  type ViewportExtent,
} from "./ExtentQueryEngine";
import type { SourceHandle, SourceFormat } from "../contracts/gisContracts";

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */

export type StreamingStrategy = "flatgeobuf" | "rbush-index";

export interface StreamingLayerConfig {
  layerId: string;
  /** Source format — determines the streaming strategy. */
  format: SourceFormat;
  /** URL for FlatGeobuf streaming; undefined for index-only strategy. */
  url?: string;
  /**
   * Pre-built rbush index for the layer. Required for "rbush-index"
   * strategy; ignored (but may be provided as a fast fallback) for
   * FlatGeobuf sources.
   */
  index?: ExtentIndex;
}

export interface StreamingLayerState {
  layerId: string;
  strategy: StreamingStrategy;
  /** Features currently in view. */
  featuresInView: Feature[];
  inViewCount: number;
  /** null when source is a remote stream (unknown until fully fetched). */
  totalCount: number | null;
  /** True while an async extent fetch is in flight. */
  fetching: boolean;
  lastExtent: ViewportExtent | null;
  lastFetchedAt: string | null;
  /** Set when the last fetch produced an error. */
  fetchError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Debounce utility                                                    */
/* ------------------------------------------------------------------ */

type DebouncedFn<T extends unknown[]> = {
  (...args: T): void;
  cancel: () => void;
};

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: T): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };

  debounced.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/* ------------------------------------------------------------------ */
/*  FlatGeobuf streaming                                                */
/* ------------------------------------------------------------------ */

/**
 * Fetch only features that intersect `extent` from a FlatGeobuf file.
 * Uses the FlatGeobuf HTTP range / bbox iterator API so the full file
 * is never loaded into memory.
 *
 * This is an async generator so the caller can process features
 * incrementally and cancel early by breaking out of the loop.
 */
export async function* streamFlatGeobufByExtent(
  url: string,
  extent: ViewportExtent,
): AsyncGenerator<Feature, void, unknown> {
  // Dynamic import keeps flatgeobuf off the critical boot path.
  const { flatgeobuf } = await import("flatgeobuf");

  const { west, south, east, north } = extent;
  const rect = { minX: west, minY: south, maxX: east, maxY: north };

  // deserialize() with a rect parameter uses FlatGeobuf's built-in
  // spatial index to fetch only the matching HTTP ranges.
  for await (const feature of flatgeobuf.deserialize(url, rect)) {
    yield feature as Feature;
  }
}

/**
 * Materialise an extent slice from a FlatGeobuf URL into an
 * ExtentQueryResult. Use this when you need the full result at once
 * (e.g. for tests or small extents).
 *
 * NOTE: an AbortSignal can be wired in here in the future; for now
 * the caller is expected to debounce so stale fetches are rare.
 */
export async function queryFlatGeobufByExtent(
  url: string,
  extent: ViewportExtent,
): Promise<ExtentQueryResult> {
  const features: Feature[] = [];

  for await (const f of streamFlatGeobufByExtent(url, extent)) {
    features.push(f);
  }

  return {
    features,
    inViewCount: features.length,
    totalCount: null, // total unknown — must not claim full count
    isStreaming: true,
    queryMode: "flatgeobuf-stream",
  };
}

/* ------------------------------------------------------------------ */
/*  rbush index strategy (in-process, no worker needed for small sets) */
/* ------------------------------------------------------------------ */

/**
 * Build a streaming config backed by a pre-loaded FeatureCollection.
 * Useful for large imported GeoJSON sources that are already in memory
 * and need viewport-scoped queries without blocking the main thread.
 */
export function buildIndexedStreamingConfig(
  layerId: string,
  fc: FeatureCollection,
): StreamingLayerConfig {
  const index = buildRbushIndex(fc);
  return {
    layerId,
    format: "geojson",
    index,
  };
}

/**
 * Synchronous extent query against an in-memory rbush index.
 * The returned inViewCount is truthful and totalCount reflects the full
 * original feature count.
 */
export function queryIndexedLayer(
  config: StreamingLayerConfig,
  extent: ViewportExtent,
): ExtentQueryResult {
  if (!config.index) {
    return {
      features: [],
      inViewCount: 0,
      totalCount: null,
      isStreaming: false,
      queryMode: "full-scan",
    };
  }
  return queryExtent(config.index, extent);
}

/* ------------------------------------------------------------------ */
/*  Strategy resolver                                                   */
/* ------------------------------------------------------------------ */

/** Resolve which streaming strategy a source should use. */
export function resolveStreamingStrategy(format: SourceFormat): StreamingStrategy {
  if (format === "flatgeobuf") return "flatgeobuf";
  return "rbush-index";
}

/* ------------------------------------------------------------------ */
/*  SourceHandle builder for streaming sources                         */
/* ------------------------------------------------------------------ */

/**
 * Build a minimal SourceHandle descriptor for a streaming source.
 * The handle records storageMode as "url-refetch" for FlatGeobuf
 * (bytes are fetched on demand by extent) or "worker-table" for
 * rbush-indexed local sources.
 */
export function buildStreamingSourceHandle(params: {
  sourceId: string;
  format: SourceFormat;
  url?: string;
  crsSummary: SourceHandle["crsSummary"];
  featureCount: number | null;
  sizeBytes?: number;
}): SourceHandle {
  const { sourceId, format, url, crsSummary, featureCount, sizeBytes } = params;

  const storageMode =
    format === "flatgeobuf" || format === "pmtiles" ? "url-refetch" : "worker-table";

  const caveats: string[] = [
    "Source streams features by viewport extent; total feature count may be unknown.",
  ];
  if (format === "flatgeobuf") {
    caveats.push("FlatGeobuf streaming requires HTTP range request support from the server.");
  }

  return {
    sourceId,
    kind: format === "flatgeobuf" || format === "pmtiles" ? "external" : "imported",
    storageMode,
    restoreStatus: format === "flatgeobuf" || format === "pmtiles" ? "recoverable" : "metadata-only",
    format,
    crsSummary,
    featureCount,
    sizeBytes,
    sourceRef: url,
    caveats,
    profiledAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Initial state factory                                               */
/* ------------------------------------------------------------------ */

export function createStreamingLayerState(
  layerId: string,
  strategy: StreamingStrategy,
): StreamingLayerState {
  return {
    layerId,
    strategy,
    featuresInView: [],
    inViewCount: 0,
    totalCount: null,
    fetching: false,
    lastExtent: null,
    lastFetchedAt: null,
    fetchError: null,
  };
}
