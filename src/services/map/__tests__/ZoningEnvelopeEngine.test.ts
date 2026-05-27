/**
 * Prompt 32a — Zoning envelope engine tests.
 *
 * Covers:
 * 1. Known parcel + setbacks → expected envelope area within epsilon.
 * 2. Deterministic: same inputs → identical output.
 * 3. Geographic CRS (EPSG:4326) blocked.
 * 4. Missing CRS blocked.
 * 5. Setback collapse → empty envelope + caveat.
 * 6. Capacity = maxFAR × buildableAreaM2.
 * 7. Batch mode: all parcels processed.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { Feature, Polygon } from "geojson";
import {
  computeZoningEnvelope,
  computeZoningEnvelopeBatch,
  insetRing,
} from "../zoning/ZoningEnvelopeEngine";
import { createZoningRule, _resetRuleCounter } from "../zoning/ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  Test fixtures                                                       */
/* ------------------------------------------------------------------ */

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

const PROJECTED_CRS = "EPSG:32635";
const GEOGRAPHIC_CRS = "EPSG:4326";

function makeRule(setback: number, maxFAR = 2.0) {
  return createZoningRule({
    name: "Test Zone",
    zoneCode: "T1",
    maxFAR,
    maxCoverageRatio: 0.6,
    maxHeightMetres: 15,
    minSetbackMetres: setback,
    minParcelAreaM2: 100,
  });
}

beforeEach(() => {
  _resetRuleCounter();
});

/* ------------------------------------------------------------------ */
/*  insetRing unit tests                                                */
/* ------------------------------------------------------------------ */

describe("insetRing", () => {
  it("insets a 100×100 square by 5 → 90×90 ring", () => {
    const ring = [
      [0, 0], [100, 0], [100, 100], [0, 100], [0, 0],
    ] as [number, number][];
    const result = insetRing(ring, 5);
    // Expect a closed ring of 5 points (4 corners + closing)
    expect(result.length).toBe(5);
    // Area of inset should be 90×90 = 8100
    const area = result
      .slice(0, -1)
      .reduce((acc, pt, i, arr) => {
        const next = arr[(i + 1) % arr.length]!;
        return acc + (pt[0] * next[1] - next[0] * pt[1]);
      }, 0);
    expect(Math.abs(area) / 2).toBeCloseTo(8100, 0);
  });

  it("collapses when setback ≥ half width", () => {
    const ring = [
      [0, 0], [10, 0], [10, 10], [0, 10], [0, 0],
    ] as [number, number][];
    const result = insetRing(ring, 6); // more than half of 10
    expect(result.length).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  computeZoningEnvelope                                               */
/* ------------------------------------------------------------------ */

describe("computeZoningEnvelope", () => {
  it("known parcel: 100×100 with 5 m setback → buildable area ≈ 8100 m²", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule(5);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(result.crsResult.blocked).toBe(false);
    expect(result.collapsed).toBe(false);
    expect(result.parcelAreaM2).toBeCloseTo(10_000, 0);
    // Inset 5 m on each side → 90×90
    expect(result.buildableAreaM2).toBeCloseTo(8_100, 0);
    expect(result.envelopeGeometry).not.toBeNull();
  });

  it("capacity = maxFAR × buildableAreaM2", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule(5, 3.0);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(result.capacityMaxFloorAreaM2).toBeCloseTo(result.buildableAreaM2 * 3.0, 1);
  });

  it("is deterministic: same inputs → identical envelope area", () => {
    const parcel = makeSquareParcel(500_000, 4_500_000, 80);
    const rule = makeRule(3, 2.5);
    const r1 = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });
    const r2 = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(r1.buildableAreaM2).toBe(r2.buildableAreaM2);
    expect(r1.capacityMaxFloorAreaM2).toBe(r2.capacityMaxFloorAreaM2);
  });

  it("blocks geographic CRS (EPSG:4326)", () => {
    const parcel = makeSquareParcel(28.9, 41.0, 0.001); // degree-scale
    const rule = makeRule(5);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: GEOGRAPHIC_CRS });

    expect(result.crsResult.blocked).toBe(true);
    expect(result.buildableAreaM2).toBe(0);
    expect(result.envelopeGeometry).toBeNull();
    expect(result.caveats.length).toBeGreaterThan(0);
  });

  it("blocks missing / null CRS", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule(5);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: null });

    expect(result.crsResult.blocked).toBe(true);
    expect(result.envelopeGeometry).toBeNull();
  });

  it("setback collapse: large setback → collapsed=true, buildableArea=0, caveat present", () => {
    const parcel = makeSquareParcel(0, 0, 10);
    const rule = makeRule(8); // 8 m setback on a 10 m parcel
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(result.collapsed).toBe(true);
    expect(result.buildableAreaM2).toBe(0);
    expect(result.envelopeGeometry).toBeNull();
    expect(result.caveats.some((c) => /collapse/i.test(c))).toBe(true);
  });

  it("envelope geometry has correct properties", () => {
    const parcel = makeSquareParcel(0, 0, 100);
    const rule = makeRule(10);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(result.envelopeGeometry).not.toBeNull();
    const geom = result.envelopeGeometry!;
    expect(geom.geometry.type).toBe("Polygon");
    expect(geom.properties?.zoneCode).toBe("T1");
    expect(geom.properties?.setbackMetres).toBe(10);
    expect(geom.properties?.buildableAreaM2).toBeCloseTo(6400, 0); // 80×80
  });

  it("zero setback: buildable area equals parcel area", () => {
    const parcel = makeSquareParcel(0, 0, 50);
    const rule = makeRule(0);
    const result = computeZoningEnvelope({ parcel, rule, declaredCrs: PROJECTED_CRS });

    expect(result.buildableAreaM2).toBeCloseTo(result.parcelAreaM2, 0);
    expect(result.collapsed).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  computeZoningEnvelopeBatch                                          */
/* ------------------------------------------------------------------ */

describe("computeZoningEnvelopeBatch", () => {
  it("processes all parcels and returns one result per parcel", () => {
    const parcels: Feature<Polygon>[] = [
      makeSquareParcel(0, 0, 100),
      makeSquareParcel(200, 0, 60),
      makeSquareParcel(400, 0, 40),
    ];
    // Assign different IDs
    parcels[0]!.id = "a";
    parcels[1]!.id = "b";
    parcels[2]!.id = "c";

    const rule = makeRule(5, 2.0);
    const results = computeZoningEnvelopeBatch(parcels, rule, PROJECTED_CRS);

    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r.crsResult.blocked).toBe(false));
    expect(results[0]!.buildableAreaM2).toBeCloseTo(8_100, 0);
    expect(results[1]!.buildableAreaM2).toBeCloseTo(2_500, 0); // 50×50
    expect(results[2]!.buildableAreaM2).toBeCloseTo(900, 0);   // 30×30
  });

  it("blocks all parcels when CRS is geographic", () => {
    const parcels = [
      makeSquareParcel(0, 0, 100),
      makeSquareParcel(200, 0, 60),
    ];
    const rule = makeRule(5);
    const results = computeZoningEnvelopeBatch(parcels, rule, GEOGRAPHIC_CRS);

    results.forEach((r) => {
      expect(r.crsResult.blocked).toBe(true);
      expect(r.buildableAreaM2).toBe(0);
    });
  });
});
