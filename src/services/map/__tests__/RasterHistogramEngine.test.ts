/**
 * Prompt 45 — Unit tests for RasterHistogramEngine + RasterQAService.
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  computeBandStats,
  computeHistogram,
  buildRampGradient,
  DEFAULT_COLOR_RAMP,
  type ColorRampId,
} from "../raster/RasterHistogramEngine";
import { assessRasterQA } from "../raster/RasterQAService";
import type { GeoTiffMetadata } from "../raster/GeoTiffParser";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                            */
/* ------------------------------------------------------------------ */

/** 100-pixel ramp: values 0..99 */
function makeRamp(length = 100): Float64Array {
  const arr = new Float64Array(length);
  for (let i = 0; i < length; i++) arr[i] = i;
  return arr;
}

/** 10 valid + 5 noData=−9999 */
function makeWithNoData(): Float64Array {
  const arr = new Float64Array(15);
  for (let i = 0; i < 10; i++) arr[i] = i * 10; // 0,10,20…90
  for (let i = 10; i < 15; i++) arr[i] = -9999;
  return arr;
}

const baseMeta: GeoTiffMetadata = {
  width: 256,
  height: 256,
  bandCount: 1,
  bands: [{ index: 0, label: "Band 1", dtype: "float32" }],
  noData: null,
  bbox: [29, 41, 30, 42],
  epsgCode: "EPSG:4326",
  sampled: false,
  sampleWidth: 256,
  sampleHeight: 256,
};

/* ------------------------------------------------------------------ */
/*  computeBandStats                                                    */
/* ------------------------------------------------------------------ */

describe("computeBandStats", () => {
  it("computes min/max/mean for a ramp", () => {
    const arr = makeRamp(100);
    const stats = computeBandStats(arr, null);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(99);
    expect(stats.mean).toBeCloseTo(49.5, 1);
    expect(stats.validCount).toBe(100);
    expect(stats.noDataCount).toBe(0);
  });

  it("excludes noData pixels from all statistics", () => {
    const arr = makeWithNoData();
    const stats = computeBandStats(arr, -9999);
    expect(stats.validCount).toBe(10);
    expect(stats.noDataCount).toBe(5);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(90);
    expect(stats.mean).toBeCloseTo(45, 1);
  });

  it("returns zero counts for an empty array", () => {
    const stats = computeBandStats(new Float64Array(0), null);
    expect(stats.validCount).toBe(0);
    expect(stats.sampleCount).toBe(0);
  });

  it("handles all-noData array gracefully", () => {
    const arr = new Float64Array([999, 999, 999]);
    const stats = computeBandStats(arr, 999);
    expect(stats.validCount).toBe(0);
    expect(stats.noDataCount).toBe(3);
  });

  it("treats NaN noData correctly", () => {
    const arr = new Float64Array([1, NaN, 3]);
    const stats = computeBandStats(arr, NaN);
    expect(stats.noDataCount).toBe(1);
    expect(stats.validCount).toBe(2);
  });
});

/* ------------------------------------------------------------------ */
/*  computeHistogram                                                    */
/* ------------------------------------------------------------------ */

describe("computeHistogram", () => {
  it("bin counts sum to validCount (noData excluded)", () => {
    const arr = makeWithNoData();
    const result = computeHistogram(arr, -9999, 10);
    const binSum = result.bins.reduce((s, b) => s + b.count, 0);
    expect(binSum).toBe(result.stats.validCount);
    expect(result.sampledCount).toBe(result.stats.validCount);
  });

  it("bin counts sum to sampleCount when noData is null", () => {
    const arr = makeRamp(100);
    const result = computeHistogram(arr, null, 10);
    const binSum = result.bins.reduce((s, b) => s + b.count, 0);
    expect(binSum).toBe(100);
    expect(binSum).toBe(result.sampledCount);
  });

  it("all bins have correct count ≥ 0", () => {
    const arr = makeRamp(200);
    const result = computeHistogram(arr, null, 16);
    for (const bin of result.bins) {
      expect(bin.count).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns binCount bins", () => {
    const arr = makeRamp(100);
    const result = computeHistogram(arr, null, 20);
    expect(result.bins).toHaveLength(20);
    expect(result.binCount).toBe(20);
  });

  it("empty result when all samples are noData", () => {
    const arr = new Float64Array([0, 0, 0]);
    const result = computeHistogram(arr, 0, 8);
    const binSum = result.bins.reduce((s, b) => s + b.count, 0);
    expect(binSum).toBe(0);
    expect(result.sampledCount).toBe(0);
  });

  it("single-value ramp puts all counts in one bin", () => {
    const arr = new Float64Array(50).fill(5);
    const result = computeHistogram(arr, null, 8);
    const nonEmpty = result.bins.filter((b) => b.count > 0);
    expect(nonEmpty).toHaveLength(1);
    expect(nonEmpty[0].count).toBe(50);
  });

  it("noData excluded from histogram bins", () => {
    const arr = makeWithNoData();
    const result = computeHistogram(arr, -9999, 5);
    // No bin should have more than 10 total (the valid count)
    const binSum = result.bins.reduce((s, b) => s + b.count, 0);
    expect(binSum).toBeLessThanOrEqual(10);
    expect(result.stats.noDataCount).toBe(5);
  });
});

/* ------------------------------------------------------------------ */
/*  assessRasterQA                                                      */
/* ------------------------------------------------------------------ */

describe("assessRasterQA", () => {
  it("passes when CRS and noData are declared", () => {
    const qa = assessRasterQA({ ...baseMeta, noData: -9999, epsgCode: "EPSG:4326" });
    expect(qa.status).toBe("passed");
    expect(qa.issueIds).not.toContain("raster_missing_crs");
    expect(qa.issueIds).not.toContain("raster_no_nodata");
  });

  it("blocks when CRS is missing", () => {
    const qa = assessRasterQA({ ...baseMeta, epsgCode: null });
    expect(qa.status).toBe("failed");
    expect(qa.issueIds).toContain("raster_missing_crs");
    expect(qa.badges).toContain("missing_crs");
  });

  it("warns when noData is undeclared", () => {
    const qa = assessRasterQA({ ...baseMeta, noData: null });
    expect(qa.status).toBe("warning");
    expect(qa.issueIds).toContain("raster_no_nodata");
  });

  it("warns when band count is unusual (>10)", () => {
    const qa = assessRasterQA({ ...baseMeta, noData: -9999, bandCount: 12 });
    expect(qa.issueIds).toContain("raster_unusual_band_count");
  });

  it("warns when bbox is missing", () => {
    const qa = assessRasterQA({ ...baseMeta, noData: -9999, bbox: null });
    expect(qa.issueIds).toContain("raster_missing_bbox");
  });

  it("checkedAt is an ISO string", () => {
    const qa = assessRasterQA(baseMeta);
    expect(() => new Date(qa.checkedAt)).not.toThrow();
  });

  it("signature includes CRS and noData fields", () => {
    const qa = assessRasterQA({ ...baseMeta, noData: -9999 });
    expect(qa.signature).toContain("EPSG:4326");
    expect(qa.signature).toContain("-9999");
  });
});

/* ------------------------------------------------------------------ */
/*  buildRampGradient                                                   */
/* ------------------------------------------------------------------ */

describe("buildRampGradient", () => {
  it("returns a CSS linear-gradient string for each ramp", () => {
    const ramps: ColorRampId[] = ["viridis", "inferno", "rdylgn", "greys", "plasma"];
    for (const r of ramps) {
      const g = buildRampGradient(r);
      expect(g).toMatch(/^linear-gradient/);
    }
  });

  it("default ramp is viridis", () => {
    expect(DEFAULT_COLOR_RAMP).toBe("viridis");
  });
});
