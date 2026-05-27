/**
 * Prompt 32b — MassingEngine unit tests.
 *
 * Covers:
 * 1. generateMassingAlternative with projected CRS → compliant scenario.
 * 2. generateMassingAlternative with EPSG:4326 → CRS blocked.
 * 3. Same params → same id and same achievedFAR (determinism).
 * 4. coverageRatio clamped to rule.maxCoverageRatio → coverageCompliant.
 * 5. achievedFAR > rule.maxFAR → farCompliant=false.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { Feature, Polygon } from "geojson";
import { generateMassingAlternative } from "../zoning/MassingEngine";
import { createZoningRule, _resetRuleCounter } from "../zoning/ZoningRuleEngine";
import type { MassingParams } from "../zoning/MassingEngine";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                            */
/* ------------------------------------------------------------------ */

const PROJECTED_CRS = "EPSG:32635";
const GEOGRAPHIC_CRS = "EPSG:4326";

function makeSquareParcel(x0: number, y0: number, side: number): Feature<Polygon> {
  return {
    type: "Feature",
    id: "p1",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [x0, y0],
          [x0 + side, y0],
          [x0 + side, y0 + side],
          [x0, y0 + side],
          [x0, y0],
        ],
      ],
    },
    properties: { id: "p1" },
  };
}

function makeRule(opts: Partial<{
  maxFAR: number;
  maxCoverageRatio: number;
  maxHeightMetres: number;
  minSetbackMetres: number;
}> = {}) {
  return createZoningRule({
    name: "Test Zone",
    zoneCode: "T1",
    maxFAR: opts.maxFAR ?? 2.0,
    maxCoverageRatio: opts.maxCoverageRatio ?? 0.6,
    maxHeightMetres: opts.maxHeightMetres ?? 15,
    minSetbackMetres: opts.minSetbackMetres ?? 3,
    minParcelAreaM2: 100,
  });
}

beforeEach(() => {
  _resetRuleCounter();
});

/* ------------------------------------------------------------------ */
/*  Test 1: Projected CRS → compliant scenario                         */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — projected CRS", () => {
  it("produces a non-blocked result with positive metrics", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule({ maxFAR: 2.0, maxCoverageRatio: 0.6, maxHeightMetres: 20 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 3,
      coverageRatio: 0.5,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.envelopeResult.crsResult.blocked).toBe(false);
    expect(alt.buildingFootprintAreaM2).toBeGreaterThan(0);
    expect(alt.totalFloorAreaM2).toBeGreaterThan(0);
    expect(alt.achievedFAR).toBeGreaterThan(0);
    expect(alt.achievedCoverage).toBeGreaterThan(0);
    expect(alt.buildingGeometries.length).toBe(1);
  });

  it("marks scenario compliant when FAR, coverage, and height are within limits", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    // maxFAR=3 gives plenty of headroom for 3 floors at 50% coverage
    const rule = makeRule({ maxFAR: 3.0, maxCoverageRatio: 0.6, maxHeightMetres: 30 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 3,
      coverageRatio: 0.5,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.farCompliant).toBe(true);
    expect(alt.coverageCompliant).toBe(true);
    expect(alt.heightCompliant).toBe(true);
    expect(alt.compliant).toBe(true);
  });

  it("places buildingCount rectangles in the envelope", () => {
    const parcel = makeSquareParcel(0, 0, 200);
    const rule = makeRule({ maxFAR: 4.0, maxCoverageRatio: 0.8, maxHeightMetres: 60 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 3,
      floorCount: 5,
      coverageRatio: 0.4,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.envelopeResult.crsResult.blocked).toBe(false);
    expect(alt.buildingGeometries.length).toBe(3);
  });
});

/* ------------------------------------------------------------------ */
/*  Test 2: EPSG:4326 → CRS blocked                                    */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — geographic CRS", () => {
  it("blocks EPSG:4326 and returns empty metrics with caveats", () => {
    const parcel = makeSquareParcel(28.9, 41.0, 0.001);
    const rule = makeRule();
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 3,
      coverageRatio: 0.5,
    };

    const alt = generateMassingAlternative(parcel, rule, params, GEOGRAPHIC_CRS);

    expect(alt.envelopeResult.crsResult.blocked).toBe(true);
    expect(alt.compliant).toBe(false);
    expect(alt.buildingFootprintAreaM2).toBe(0);
    expect(alt.totalFloorAreaM2).toBe(0);
    expect(alt.achievedFAR).toBe(0);
    expect(alt.buildingGeometries).toHaveLength(0);
    expect(alt.caveats.length).toBeGreaterThan(0);
  });

  it("blocks null CRS and returns caveats", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule();
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 2,
      floorCount: 4,
      coverageRatio: 0.5,
    };

    const alt = generateMassingAlternative(parcel, rule, params, null);

    expect(alt.envelopeResult.crsResult.blocked).toBe(true);
    expect(alt.compliant).toBe(false);
    expect(alt.caveats.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Test 3: Determinism — same params → same id and same achievedFAR  */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — determinism", () => {
  it("produces the same id for identical params", () => {
    const parcel = makeSquareParcel(500_000, 4_500_000, 80);
    const rule = makeRule({ maxFAR: 3.0 });
    const params: MassingParams = {
      parcelId: "parcel-42",
      buildingCount: 2,
      floorCount: 4,
      coverageRatio: 0.45,
    };

    const alt1 = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);
    const alt2 = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt1.id).toBe(alt2.id);
    expect(alt1.achievedFAR).toBe(alt2.achievedFAR);
    expect(alt1.totalFloorAreaM2).toBe(alt2.totalFloorAreaM2);
  });

  it("produces different ids for different params", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule();
    const paramsA: MassingParams = { parcelId: "p1", buildingCount: 1, floorCount: 3, coverageRatio: 0.5 };
    const paramsB: MassingParams = { parcelId: "p1", buildingCount: 2, floorCount: 3, coverageRatio: 0.5 };

    const altA = generateMassingAlternative(parcel, rule, paramsA, PROJECTED_CRS);
    const altB = generateMassingAlternative(parcel, rule, paramsB, PROJECTED_CRS);

    expect(altA.id).not.toBe(altB.id);
  });
});

/* ------------------------------------------------------------------ */
/*  Test 4: coverageRatio clamped to rule.maxCoverageRatio             */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — coverage clamping", () => {
  it("clamps coverageRatio above rule.maxCoverageRatio", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule({ maxCoverageRatio: 0.5, maxFAR: 3.0, maxHeightMetres: 30 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 2,
      coverageRatio: 0.8, // exceeds rule.maxCoverageRatio of 0.5
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    // The achieved coverage should be ≤ rule.maxCoverageRatio
    // (coverage = footprint / parcel, so it'll be below 0.5 since it's off the buildable area)
    expect(alt.coverageCompliant).toBe(true);
    // A caveat should be present about clamping
    expect(alt.caveats.some((c) => /clamp/i.test(c))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Test 5: FAR compliance — achievedFAR > rule.maxFAR → farCompliant  */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — FAR compliance", () => {
  it("farCompliant=false when achievedFAR exceeds rule.maxFAR", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    // Very low maxFAR ensures violation with typical params
    const rule = makeRule({ maxFAR: 0.1, maxCoverageRatio: 0.9, maxHeightMetres: 100 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 10,   // 10 floors at high coverage will push FAR well above 0.1
      coverageRatio: 0.8,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.achievedFAR).toBeGreaterThan(rule.maxFAR);
    expect(alt.farCompliant).toBe(false);
    expect(alt.compliant).toBe(false);
    expect(alt.caveats.some((c) => /FAR/i.test(c))).toBe(true);
  });

  it("farCompliant=true when achievedFAR is within rule.maxFAR", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule({ maxFAR: 5.0, maxCoverageRatio: 0.9, maxHeightMetres: 100 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 2,
      coverageRatio: 0.3,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.achievedFAR).toBeLessThanOrEqual(rule.maxFAR);
    expect(alt.farCompliant).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Additional: height compliance                                       */
/* ------------------------------------------------------------------ */

describe("generateMassingAlternative — height compliance", () => {
  it("heightCompliant=false when height exceeds rule.maxHeightMetres", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule({ maxFAR: 100, maxCoverageRatio: 0.9, maxHeightMetres: 5 });
    const params: MassingParams = {
      parcelId: "p1",
      buildingCount: 1,
      floorCount: 5,  // 5 * 3.3 = 16.5 m > 5 m
      coverageRatio: 0.2,
    };

    const alt = generateMassingAlternative(parcel, rule, params, PROJECTED_CRS);

    expect(alt.heightCompliant).toBe(false);
    expect(alt.compliant).toBe(false);
    expect(alt.caveats.some((c) => /height/i.test(c))).toBe(true);
  });
});
