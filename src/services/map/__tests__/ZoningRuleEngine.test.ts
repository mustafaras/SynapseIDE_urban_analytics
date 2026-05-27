import { describe, it, expect, beforeEach } from "vitest";
import {
  computeParcelMetrics,
  computeParcelMetricsBatch,
  createZoningRule,
  polygonAreaM2,
  shoelaceRingArea,
  ZoningRuleEngine,
  _resetRuleCounter,
  _resetAssignCounter,
} from "../zoning/ZoningRuleEngine";
import {
  buildingFootprints,
  fcPolygonsProjected,
  fcMissingCrs,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import type { Feature, Polygon } from "geojson";

beforeEach(() => {
  _resetRuleCounter();
  _resetAssignCounter();
});

/* ------------------------------------------------------------------ */
/*  shoelaceRingArea — unit geometry                                   */
/* ------------------------------------------------------------------ */

describe("shoelaceRingArea", () => {
  it("computes area of a 10 × 10 square correctly", () => {
    // projected: ring in metres
    const ring = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    expect(shoelaceRingArea(ring as [number, number][])).toBe(100);
  });

  it("computes area of a 30 × 50 rectangle", () => {
    const ring = [[0, 0], [30, 0], [30, 50], [0, 50], [0, 0]];
    expect(shoelaceRingArea(ring as [number, number][])).toBe(1500);
  });

  it("returns the same result regardless of ring winding", () => {
    const cw = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const ccw = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
    expect(shoelaceRingArea(cw as [number, number][])).toBe(
      shoelaceRingArea(ccw as [number, number][]),
    );
  });
});

/* ------------------------------------------------------------------ */
/*  polygonAreaM2                                                       */
/* ------------------------------------------------------------------ */

describe("polygonAreaM2", () => {
  it("computes area of a Polygon feature with known dimensions", () => {
    const feature: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [100, 0], [100, 200], [0, 200], [0, 0]]],
      },
      properties: {},
    };
    expect(polygonAreaM2(feature)).toBe(20_000);
  });
});

/* ------------------------------------------------------------------ */
/*  computeParcelMetrics — CRS gate                                    */
/* ------------------------------------------------------------------ */

describe("computeParcelMetrics — CRS gate", () => {
  const parcel = fcPolygonsProjected.featureCollection.features[0]!;

  it("blocks computation for geographic CRS (EPSG:4326)", () => {
    const result = computeParcelMetrics({
      parcel,
      buildings: [],
      declaredCrs: "EPSG:4326",
    });
    expect(result.crsResult.blocked).toBe(true);
    expect(result.existingFAR).toBeNull();
    expect(result.existingCoverage).toBeNull();
    expect(result.caveats.length).toBeGreaterThan(0);
    expect(result.caveats[0]).toMatch(/projected CRS|geographic CRS/i);
  });

  it("blocks computation when CRS is null/unknown", () => {
    const result = computeParcelMetrics({
      parcel,
      buildings: [],
      declaredCrs: null,
    });
    expect(result.crsResult.blocked).toBe(true);
    expect(result.existingFAR).toBeNull();
  });

  it("passes computation for a projected CRS (EPSG:32635)", () => {
    const result = computeParcelMetrics({
      parcel,
      buildings: [],
      declaredCrs: "EPSG:32635",
    });
    expect(result.crsResult.blocked).toBe(false);
    expect(result.crsResult.ok).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  computeParcelMetrics — FAR / coverage math                         */
/* ------------------------------------------------------------------ */

describe("computeParcelMetrics — FAR and coverage", () => {
  it("computes FAR = totalFloorArea / parcelArea correctly", () => {
    // Known projected geometry: 100×200 parcel, 20×20 building with 3 floors
    const parcel: Feature<Polygon> = {
      type: "Feature",
      id: "p1",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [100, 0], [100, 200], [0, 200], [0, 0]]],
      },
      properties: { id: "p1" },
    };
    const building: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]],
      },
      properties: { floors: 3 },
    };

    const result = computeParcelMetrics({
      parcel,
      buildings: [building],
      buildingFloors: [3],
      declaredCrs: "EPSG:32635",
    });

    // parcel = 100×200 = 20 000 m²
    // building footprint = 20×20 = 400 m²
    // total floor area = 400 × 3 = 1 200 m²
    // FAR = 1200 / 20000 = 0.06
    // coverage = 400 / 20000 = 0.02
    expect(result.parcelAreaM2).toBe(20_000);
    expect(result.buildingFootprintAreaM2).toBe(400);
    expect(result.totalFloorAreaM2).toBe(1_200);
    expect(result.existingFAR).toBeCloseTo(0.06, 5);
    expect(result.existingCoverage).toBeCloseTo(0.02, 5);
  });

  it("computes capacity correctly when a rule is assigned", () => {
    const parcel: Feature<Polygon> = {
      type: "Feature",
      id: "p2",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]],
      },
      properties: { id: "p2" },
    };
    const rule = createZoningRule({
      name: "Residential 2",
      zoneCode: "R2",
      maxFAR: 2.0,
      maxCoverageRatio: 0.6,
      maxHeightMetres: 12,
      minSetbackMetres: 3,
      minParcelAreaM2: 100,
    });

    const result = computeParcelMetrics({
      parcel,
      buildings: [],
      declaredCrs: "EPSG:32635",
      rule,
    });

    // parcel = 100×100 = 10 000 m²
    // maxFloorArea = 2.0 × 10 000 = 20 000 m²
    // maxBuildingArea = 0.6 × 10 000 = 6 000 m²
    expect(result.parcelAreaM2).toBe(10_000);
    expect(result.capacityMaxFloorAreaM2).toBe(20_000);
    expect(result.capacityMaxBuildingAreaM2).toBe(6_000);
    expect(result.farExceeded).toBe(false);
    expect(result.coverageExceeded).toBe(false);
  });

  it("flags FAR exceeded when buildings violate the rule", () => {
    const parcel: Feature<Polygon> = {
      type: "Feature",
      id: "p3",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
      },
      properties: { id: "p3" },
    };
    // 9×9 building, 5 floors → FAR = (81 × 5) / 100 = 4.05 > maxFAR 2.0
    const building: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[0.5, 0.5], [9.5, 0.5], [9.5, 9.5], [0.5, 9.5], [0.5, 0.5]]],
      },
      properties: { floors: 5 },
    };
    const rule = createZoningRule({
      name: "Low-rise",
      zoneCode: "R1",
      maxFAR: 2.0,
      maxCoverageRatio: 0.9,
      maxHeightMetres: 9,
      minSetbackMetres: 0.5,
      minParcelAreaM2: 50,
    });

    const result = computeParcelMetrics({
      parcel,
      buildings: [building],
      buildingFloors: [5],
      declaredCrs: "EPSG:32635",
      rule,
    });

    expect(result.farExceeded).toBe(true);
    expect(result.existingFAR).toBeGreaterThan(2.0);
    expect(result.caveats.some((c) => c.includes("FAR"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  computeParcelMetrics — using fixtures                              */
/* ------------------------------------------------------------------ */

describe("computeParcelMetrics with fixtures", () => {
  it("uses buildingFootprints as buildings inside a parcel (EPSG:32635)", () => {
    const parcel = fcPolygonsProjected.featureCollection.features[0]!;
    const buildings = buildingFootprints.features as Feature<Polygon>[];
    const result = computeParcelMetrics({
      parcel,
      buildings,
      declaredCrs: fcPolygonsProjected.declaredCrs,
    });
    expect(result.crsResult.blocked).toBe(false);
    expect(result.buildingFootprintAreaM2).toBeGreaterThan(0);
    expect(result.existingFAR).not.toBeNull();
  });

  it("blocks computation for fcMissingCrs collection (null CRS)", () => {
    const parcel = fcMissingCrs.featureCollection.features[0]!;
    const result = computeParcelMetrics({
      parcel,
      buildings: [],
      declaredCrs: fcMissingCrs.declaredCrs,
    });
    expect(result.crsResult.blocked).toBe(true);
    expect(result.existingFAR).toBeNull();
    expect(result.existingCoverage).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  computeParcelMetricsBatch                                          */
/* ------------------------------------------------------------------ */

describe("computeParcelMetricsBatch", () => {
  it("processes all parcels in the projected fixture collection", () => {
    const results = computeParcelMetricsBatch(
      fcPolygonsProjected.featureCollection as any,
      fcPolygonsProjected.declaredCrs,
      new Map(),
    );
    expect(results.length).toBe(fcPolygonsProjected.featureCollection.features.length);
    results.forEach((r) => {
      expect(r.crsResult.blocked).toBe(false);
    });
  });

  it("returns all blocked when CRS is null", () => {
    const results = computeParcelMetricsBatch(
      fcMissingCrs.featureCollection as any,
      fcMissingCrs.declaredCrs,
      new Map(),
    );
    results.forEach((r) => {
      expect(r.crsResult.blocked).toBe(true);
      expect(r.existingFAR).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  ZoningRuleEngine namespace                                         */
/* ------------------------------------------------------------------ */

describe("ZoningRuleEngine namespace", () => {
  it("exports the expected functions", () => {
    expect(typeof ZoningRuleEngine.computeParcelMetrics).toBe("function");
    expect(typeof ZoningRuleEngine.computeParcelMetricsBatch).toBe("function");
    expect(typeof ZoningRuleEngine.createZoningRule).toBe("function");
    expect(typeof ZoningRuleEngine.createZoningAssignment).toBe("function");
  });
});
