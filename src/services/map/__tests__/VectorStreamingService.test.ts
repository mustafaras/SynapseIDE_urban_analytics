/**
 * Prompt 44 — Unit tests for VectorStreamingService + ExtentQueryEngine.
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FeatureCollection, Feature, Point, Polygon } from "geojson";
import {
  buildRbushIndex,
  queryExtent,
  boundsToExtent,
  extentChanged,
  geomBbox,
  type ViewportExtent,
} from "../streaming/ExtentQueryEngine";
import {
  buildIndexedStreamingConfig,
  queryIndexedLayer,
  resolveStreamingStrategy,
  buildStreamingSourceHandle,
  createStreamingLayerState,
  debounce,
} from "../streaming/VectorStreamingService";

/* ------------------------------------------------------------------ */
/*  Fixture helpers                                                     */
/* ------------------------------------------------------------------ */

function pt(lng: number, lat: number, id: number): Feature<Point> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { id },
  };
}

/** 9 points on a 3×3 grid starting at (29, 41) with 0.1° spacing. */
function makeGrid(): FeatureCollection {
  const features: Feature[] = [];
  let id = 1;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      features.push(pt(29 + i * 0.1, 41 + j * 0.1, id++));
    }
  }
  return { type: "FeatureCollection", features };
}

/** Tight viewport covering only the SW corner (29.0..29.05, 41.0..41.05). */
const SW_EXTENT: ViewportExtent = { west: 29.0, south: 41.0, east: 29.05, north: 41.05 };

/** Full extent covering all 9 grid points. */
const FULL_EXTENT: ViewportExtent = { west: 28.9, south: 40.9, east: 29.3, north: 41.3 };

/* ------------------------------------------------------------------ */
/*  geomBbox                                                            */
/* ------------------------------------------------------------------ */

describe("geomBbox", () => {
  it("returns bbox for a Point", () => {
    const bb = geomBbox({ type: "Point", coordinates: [29, 41] });
    expect(bb).toEqual([29, 41, 29, 41]);
  });

  it("returns bbox for a Polygon ring", () => {
    const bb = geomBbox({
      type: "Polygon",
      coordinates: [[[29, 41], [29.1, 41], [29.1, 41.1], [29, 41.1], [29, 41]]],
    });
    expect(bb).not.toBeNull();
    if (!bb) return;
    expect(bb[0]).toBeCloseTo(29, 4);
    expect(bb[1]).toBeCloseTo(41, 4);
    expect(bb[2]).toBeCloseTo(29.1, 4);
    expect(bb[3]).toBeCloseTo(41.1, 4);
  });
});

/* ------------------------------------------------------------------ */
/*  buildRbushIndex + queryExtent                                       */
/* ------------------------------------------------------------------ */

describe("buildRbushIndex", () => {
  it("indexes all features", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    expect(idx.totalCount).toBe(9);
    expect(idx.features).toHaveLength(9);
  });

  it("handles empty FeatureCollection", () => {
    const idx = buildRbushIndex({ type: "FeatureCollection", features: [] });
    expect(idx.totalCount).toBe(0);
  });

  it("skips null-geometry features gracefully", () => {
    const fc: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: null as unknown as Polygon, properties: {} },
        pt(29, 41, 1),
      ],
    };
    const idx = buildRbushIndex(fc);
    expect(idx.totalCount).toBe(2); // null geometry not indexed but feature kept
  });
});

describe("queryExtent", () => {
  it("returns only features intersecting the viewport", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    const result = queryExtent(idx, SW_EXTENT);
    // SW corner should match only (29.0, 41.0)
    expect(result.inViewCount).toBeGreaterThanOrEqual(1);
    expect(result.inViewCount).toBeLessThan(9);
    expect(result.totalCount).toBe(9);
    expect(result.isStreaming).toBe(false);
    expect(result.queryMode).toBe("rbush-index");
  });

  it("inViewCount < totalCount for a restricted viewport", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    const all = queryExtent(idx, FULL_EXTENT);
    const partial = queryExtent(idx, SW_EXTENT);
    expect(partial.inViewCount).toBeLessThan(all.inViewCount);
  });

  it("full extent returns all features", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    const result = queryExtent(idx, FULL_EXTENT);
    expect(result.inViewCount).toBe(9);
  });

  it("count reflects viewport, not total (anti-pattern check)", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    const result = queryExtent(idx, SW_EXTENT);
    // inViewCount must NOT equal totalCount when viewport is restricted
    expect(result.inViewCount).not.toBe(result.totalCount);
  });

  it("returns Feature objects matching the original features", () => {
    const fc = makeGrid();
    const idx = buildRbushIndex(fc);
    const result = queryExtent(idx, SW_EXTENT);
    for (const f of result.features) {
      expect(f.type).toBe("Feature");
      expect(f.geometry).toBeDefined();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  buildIndexedStreamingConfig + queryIndexedLayer                    */
/* ------------------------------------------------------------------ */

describe("buildIndexedStreamingConfig", () => {
  it("builds config with index and layerId", () => {
    const fc = makeGrid();
    const config = buildIndexedStreamingConfig("layer-1", fc);
    expect(config.layerId).toBe("layer-1");
    expect(config.index).toBeDefined();
    expect(config.index!.totalCount).toBe(9);
  });
});

describe("queryIndexedLayer", () => {
  it("returns extent-filtered features from an indexed config", () => {
    const fc = makeGrid();
    const config = buildIndexedStreamingConfig("layer-1", fc);
    const result = queryIndexedLayer(config, SW_EXTENT);
    expect(result.inViewCount).toBeGreaterThanOrEqual(1);
    expect(result.totalCount).toBe(9);
  });

  it("returns empty result when config has no index", () => {
    const config = {
      layerId: "layer-1",
      format: "geojson" as const,
    };
    const result = queryIndexedLayer(config, SW_EXTENT);
    expect(result.features).toHaveLength(0);
    expect(result.inViewCount).toBe(0);
    expect(result.totalCount).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  resolveStreamingStrategy                                            */
/* ------------------------------------------------------------------ */

describe("resolveStreamingStrategy", () => {
  it("resolves flatgeobuf to flatgeobuf strategy", () => {
    expect(resolveStreamingStrategy("flatgeobuf")).toBe("flatgeobuf");
  });

  it("resolves geojson to rbush-index strategy", () => {
    expect(resolveStreamingStrategy("geojson")).toBe("rbush-index");
  });

  it("resolves pmtiles to rbush-index strategy", () => {
    expect(resolveStreamingStrategy("pmtiles")).toBe("rbush-index");
  });
});

/* ------------------------------------------------------------------ */
/*  buildStreamingSourceHandle                                          */
/* ------------------------------------------------------------------ */

describe("buildStreamingSourceHandle", () => {
  const crsSummary = {
    status: "declared" as const,
    epsg: "EPSG:4326",
    wkt: null,
    source: "import-source" as const,
    notes: [],
  };

  it("sets storageMode=url-refetch for flatgeobuf", () => {
    const h = buildStreamingSourceHandle({
      sourceId: "src-1",
      format: "flatgeobuf",
      url: "https://example.invalid/data.fgb",
      crsSummary,
      featureCount: null,
    });
    expect(h.storageMode).toBe("url-refetch");
    expect(h.format).toBe("flatgeobuf");
    expect(h.caveats.length).toBeGreaterThan(0);
  });

  it("sets storageMode=worker-table for geojson", () => {
    const h = buildStreamingSourceHandle({
      sourceId: "src-2",
      format: "geojson",
      crsSummary,
      featureCount: 9000,
    });
    expect(h.storageMode).toBe("worker-table");
  });

  it("featureCount null is preserved (unknown for remote streams)", () => {
    const h = buildStreamingSourceHandle({
      sourceId: "src-3",
      format: "flatgeobuf",
      url: "https://example.invalid/data.fgb",
      crsSummary,
      featureCount: null,
    });
    expect(h.featureCount).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  createStreamingLayerState                                           */
/* ------------------------------------------------------------------ */

describe("createStreamingLayerState", () => {
  it("initialises with zero counts and no error", () => {
    const state = createStreamingLayerState("layer-1", "rbush-index");
    expect(state.inViewCount).toBe(0);
    expect(state.totalCount).toBeNull();
    expect(state.fetching).toBe(false);
    expect(state.fetchError).toBeNull();
    expect(state.lastExtent).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  boundsToExtent + extentChanged                                      */
/* ------------------------------------------------------------------ */

describe("boundsToExtent", () => {
  it("converts a bounds array to a ViewportExtent", () => {
    const e = boundsToExtent([28, 40, 30, 42]);
    expect(e).toEqual({ west: 28, south: 40, east: 30, north: 42 });
  });
});

describe("extentChanged", () => {
  const base: ViewportExtent = { west: 29, south: 41, east: 30, north: 42 };

  it("returns false for identical extents", () => {
    expect(extentChanged(base, { ...base })).toBe(false);
  });

  it("returns false for sub-threshold differences", () => {
    expect(extentChanged(base, { ...base, west: 29.000001 })).toBe(false);
  });

  it("returns true for meaningful difference", () => {
    expect(extentChanged(base, { ...base, west: 28 })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  debounce utility                                                    */
/* ------------------------------------------------------------------ */

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls the function once after the delay", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d("a");
    d("b");
    d("c");
    expect(fn).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("cancel() prevents the function from being called", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d("a");
    d.cancel();
    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
  });
});
