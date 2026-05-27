/**
 * Tests for SunShadowEngine — computeShadowAnalysis()
 *
 * Covers:
 * - Building 10m tall, sun altitude 45° → shadow length ≈ 10m
 * - Sun below horizon → sunBelowHorizon = true, shadowPolygon = null
 * - Shadow coverage ratio 0–1 bounds
 * - Deterministic (same params → same result)
 * - Assumptions always present with correct values
 */
import { describe, expect, it } from "vitest";
import type { Feature, Polygon } from "geojson";
import {
  computeShadowAnalysis,
  SunShadowEngine,
  type ShadowAnalysisInput,
} from "@/services/map/scene3d/SunShadowEngine";
import type { SolarPosition } from "@/services/map/scene3d/SolarPositionService";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                            */
/* ------------------------------------------------------------------ */

/** 10×10 unit square building footprint at (0,0) */
const makeBuilding = (id: string | number = "b1"): Feature<Polygon> => ({
  type: "Feature",
  id,
  geometry: {
    type: "Polygon",
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
  },
  properties: {},
});

const solarAt45deg: SolarPosition = {
  altitudeDeg: 45,
  azimuthDeg: 180,
  zenithDeg: 45,
};

const solarBelowHorizon: SolarPosition = {
  altitudeDeg: -5,
  azimuthDeg: 0,
  zenithDeg: 95,
};

const solarNoon: SolarPosition = {
  altitudeDeg: 72,
  azimuthDeg: 180,
  zenithDeg: 18,
};

const baseInput: ShadowAnalysisInput = {
  buildings: [makeBuilding()],
  heightsM: [10],
  parcelAreaM2: 10_000,
  solarPosition: solarAt45deg,
  dateTime: "2026-06-21T12:00:00Z",
  geometrySource: "user-provided",
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("SunShadowEngine — computeShadowAnalysis", () => {
  it("building 10m tall, sun altitude 45° → shadow length ≈ 10m (tan(45°)=1)", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.buildingResults).toHaveLength(1);
    const br = result.buildingResults[0]!;
    // tan(45°) = 1, shadow length = height / tan(45°) = 10 / 1 = 10m
    expect(br.shadowLengthM).toBeCloseTo(10, 1);
    expect(br.heightMetres).toBe(10);
  });

  it("sun below horizon → sunBelowHorizon = true, shadowPolygon = null, shadowLengthM = 0", () => {
    const result = computeShadowAnalysis({
      ...baseInput,
      solarPosition: solarBelowHorizon,
    });
    expect(result.sunBelowHorizon).toBe(true);
    expect(result.buildingResults[0]!.shadowPolygon).toBeNull();
    expect(result.buildingResults[0]!.shadowLengthM).toBe(0);
  });

  it("sun above horizon → sunBelowHorizon = false, shadowPolygon is a Feature<Polygon>", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.sunBelowHorizon).toBe(false);
    const sp = result.buildingResults[0]!.shadowPolygon;
    expect(sp).not.toBeNull();
    expect(sp!.type).toBe("Feature");
    expect(sp!.geometry.type).toBe("Polygon");
  });

  it("shadow coverage ratio is between 0 and 1", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.shadowCoverageRatio).toBeGreaterThanOrEqual(0);
    expect(result.shadowCoverageRatio).toBeLessThanOrEqual(1);
  });

  it("shadow coverage ratio = 0 when sun below horizon", () => {
    const result = computeShadowAnalysis({
      ...baseInput,
      solarPosition: solarBelowHorizon,
    });
    expect(result.totalShadowAreaM2).toBe(0);
    expect(result.shadowCoverageRatio).toBe(0);
  });

  it("shadow coverage ratio > 0 when sun above horizon", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.totalShadowAreaM2).toBeGreaterThan(0);
    expect(result.shadowCoverageRatio).toBeGreaterThan(0);
  });

  it("higher sun angle → shorter shadow length", () => {
    const low = computeShadowAnalysis({ ...baseInput, solarPosition: { altitudeDeg: 20, azimuthDeg: 180, zenithDeg: 70 } });
    const high = computeShadowAnalysis({ ...baseInput, solarPosition: solarNoon });
    expect(low.buildingResults[0]!.shadowLengthM).toBeGreaterThan(high.buildingResults[0]!.shadowLengthM);
  });

  it("is deterministic — same inputs return identical results", () => {
    const r1 = computeShadowAnalysis(baseInput);
    const r2 = computeShadowAnalysis(baseInput);
    expect(r1.buildingResults[0]!.shadowLengthM).toBe(r2.buildingResults[0]!.shadowLengthM);
    expect(r1.totalShadowAreaM2).toBe(r2.totalShadowAreaM2);
    expect(r1.shadowCoverageRatio).toBe(r2.shadowCoverageRatio);
  });

  it("assumptions are always present with correct required values", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.assumptions.solarModel).toBe("simplified-declination-hour-angle");
    expect(result.assumptions.verticalDatum).toBe("assumed-flat-terrain");
    expect(result.assumptions.runtimeMode).toBe("demo");
    expect(result.assumptions.geometrySource).toBe("user-provided");
  });

  it("caveats array is non-empty", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(result.caveats.length).toBeGreaterThan(0);
  });

  it("caveats include horizon note when sun is below horizon", () => {
    const result = computeShadowAnalysis({
      ...baseInput,
      solarPosition: solarBelowHorizon,
    });
    const horizonCaveat = result.caveats.some((c) => c.toLowerCase().includes("horizon"));
    expect(horizonCaveat).toBe(true);
  });

  it("handles multiple buildings", () => {
    const result = computeShadowAnalysis({
      buildings: [makeBuilding("b1"), makeBuilding("b2")],
      heightsM: [10, 20],
      parcelAreaM2: 50_000,
      solarPosition: solarAt45deg,
      dateTime: "2026-06-21T12:00:00Z",
      geometrySource: "massing-engine",
    });
    expect(result.buildingResults).toHaveLength(2);
    // 20m building should have longer shadow
    expect(result.buildingResults[1]!.shadowLengthM).toBeCloseTo(20, 1);
  });

  it("parcelAreaM2 = 0 → shadowCoverageRatio = 0 (no divide-by-zero)", () => {
    const result = computeShadowAnalysis({
      ...baseInput,
      parcelAreaM2: 0,
    });
    expect(result.shadowCoverageRatio).toBe(0);
  });

  it("scenarioId is present in result", () => {
    const result = computeShadowAnalysis({ ...baseInput, scenarioId: "test-sc-1" });
    expect(result.scenarioId).toBe("test-sc-1");
  });

  it("auto-generates scenarioId when not provided", () => {
    const result = computeShadowAnalysis(baseInput);
    expect(typeof result.scenarioId).toBe("string");
    expect(result.scenarioId.length).toBeGreaterThan(0);
  });
});

describe("SunShadowEngine class wrapper", () => {
  it("compute() delegates to computeShadowAnalysis correctly", () => {
    const engine = new SunShadowEngine();
    const result = engine.compute(baseInput);
    expect(result.sunBelowHorizon).toBe(false);
    expect(result.assumptions.runtimeMode).toBe("demo");
    expect(result.buildingResults[0]!.shadowLengthM).toBeCloseTo(10, 1);
  });
});
