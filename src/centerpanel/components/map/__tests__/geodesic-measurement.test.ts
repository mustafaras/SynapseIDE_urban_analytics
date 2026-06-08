/**
 * Unit tests for Geodesic Measurement Tools
 *
 * Tests verify:
 *   1. geodesic.ts — haversine, polyline, area, bearing, midpoint, formatting
 *   2. mapTypes — MeasureToolId, MeasureUnit, Measurement type structures
 *   3. Store — measurement actions (add/remove/clear, unit switching)
 *   4. MapMeasurementTool — module export
 *   5. MapToolbar — extended props for measure tools
 *   6. Geodesic benchmarks — London→Paris, equatorial area
 */

import type { Map as MapLibreMap } from "maplibre-gl";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  convertArea,
  convertDistance,
  formatArea,
  formatBearing,
  formatDistance,
  haversineDistance,
  initialBearing,
  type LngLat,
  midpoint,
  polygonPerimeter,
  polylineLength,
  R,
  segmentDistances,
  sphericalPolygonArea,
} from "../../../../utils/geodesic";
import type {
  Measurement,
  MeasureToolId,
  MeasureUnit,
} from "../mapTypes";

/* ================================================================== */
/*  1. Haversine distance                                              */
/* ================================================================== */

describe("geodesic — haversineDistance", () => {
  it("London → Paris ≈ 343 km", () => {
    const london: LngLat = [-0.1278, 51.5074];
    const paris: LngLat = [2.3522, 48.8566];
    const d = haversineDistance(london, paris);
    expect(d).toBeGreaterThan(340_000);
    expect(d).toBeLessThan(345_000);
  });

  it("same point returns 0", () => {
    const p: LngLat = [29.0, 41.0];
    expect(haversineDistance(p, p)).toBe(0);
  });

  it("antipodal points ≈ half circumference", () => {
    const a: LngLat = [0, 0];
    const b: LngLat = [180, 0];
    const d = haversineDistance(a, b);
    const halfCircumference = Math.PI * R;
    expect(d).toBeCloseTo(halfCircumference, -2);
  });

  it("New York → Los Angeles ≈ 3,944 km", () => {
    const ny: LngLat = [-74.006, 40.7128];
    const la: LngLat = [-118.2437, 34.0522];
    const d = haversineDistance(ny, la);
    expect(d).toBeGreaterThan(3_930_000);
    expect(d).toBeLessThan(3_960_000);
  });
});

/* ================================================================== */
/*  2. Polyline length                                                 */
/* ================================================================== */

describe("geodesic — polylineLength", () => {
  it("returns 0 for a single point", () => {
    expect(polylineLength([[0, 0]])).toBe(0);
  });

  it("two points equals haversineDistance", () => {
    const a: LngLat = [-0.1278, 51.5074];
    const b: LngLat = [2.3522, 48.8566];
    expect(polylineLength([a, b])).toBeCloseTo(haversineDistance(a, b), 6);
  });

  it("sum of three segments", () => {
    const pts: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const total = polylineLength(pts);
    const expected =
      haversineDistance(pts[0], pts[1]) +
      haversineDistance(pts[1], pts[2]) +
      haversineDistance(pts[2], pts[3]);
    expect(total).toBeCloseTo(expected, 6);
  });
});

/* ================================================================== */
/*  3. Segment distances                                               */
/* ================================================================== */

describe("geodesic — segmentDistances", () => {
  it("first entry is 0", () => {
    const pts: LngLat[] = [
      [0, 0],
      [1, 0],
    ];
    const dists = segmentDistances(pts);
    expect(dists[0]).toBe(0);
    expect(dists.length).toBe(2);
  });

  it("cumulative distances are correct", () => {
    const pts: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
    ];
    const dists = segmentDistances(pts);
    expect(dists[0]).toBe(0);
    expect(dists[1]).toBeCloseTo(haversineDistance(pts[0], pts[1]), 6);
    expect(dists[2]).toBeCloseTo(
      haversineDistance(pts[0], pts[1]) + haversineDistance(pts[1], pts[2]),
      6,
    );
  });
});

/* ================================================================== */
/*  4. Spherical polygon area                                          */
/* ================================================================== */

describe("geodesic — sphericalPolygonArea", () => {
  it("1° × 1° square at equator ≈ 12,309 km²", () => {
    // A 1°×1° box at the equator is approximately 111km × 111km ≈ 12,321 km²
    const ring: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const area = sphericalPolygonArea(ring);
    expect(area / 1e6).toBeGreaterThan(12_200); // km²
    expect(area / 1e6).toBeLessThan(12_400);
  });

  it("area ≈ 1,000,000 m² for small 1km² square at equator", () => {
    const d = 1000 / ((Math.PI / 180) * R);
    const ring: LngLat[] = [
      [0, 0],
      [d, 0],
      [d, d],
      [0, d],
    ];
    const area = sphericalPolygonArea(ring);
    expect(area).toBeGreaterThan(999_000);
    expect(area).toBeLessThan(1_001_000);
  });

  it("degenerate polygon (< 3 points) returns 0", () => {
    expect(sphericalPolygonArea([[0, 0]])).toBe(0);
    expect(
      sphericalPolygonArea([
        [0, 0],
        [1, 1],
      ]),
    ).toBe(0);
  });

  it("handles closed ring (first === last)", () => {
    const ring: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0], // closed
    ];
    const area = sphericalPolygonArea(ring);
    expect(area / 1e6).toBeGreaterThan(12_200);
    expect(area / 1e6).toBeLessThan(12_400);
  });

  it("area is always positive regardless of winding", () => {
    const ringCw: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const ringCcw: LngLat[] = [...ringCw].reverse();
    expect(sphericalPolygonArea(ringCw)).toBeGreaterThan(0);
    expect(sphericalPolygonArea(ringCcw)).toBeGreaterThan(0);
    expect(sphericalPolygonArea(ringCw)).toBeCloseTo(
      sphericalPolygonArea(ringCcw),
      0,
    );
  });
});

/* ================================================================== */
/*  5. Polygon perimeter                                               */
/* ================================================================== */

describe("geodesic — polygonPerimeter", () => {
  it("perimeter of a 1° square at equator ≈ 443 km", () => {
    const ring: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const perim = polygonPerimeter(ring);
    // each side ≈ 111 km → 444 km
    expect(perim / 1000).toBeGreaterThan(440);
    expect(perim / 1000).toBeLessThan(448);
  });

  it("handles already-closed ring", () => {
    const ring: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const perim = polygonPerimeter(ring);
    expect(perim / 1000).toBeGreaterThan(440);
    expect(perim / 1000).toBeLessThan(448);
  });
});

/* ================================================================== */
/*  6. Initial bearing                                                 */
/* ================================================================== */

describe("geodesic — initialBearing", () => {
  it("due east from equator ≈ 90°", () => {
    const a: LngLat = [0, 0];
    const b: LngLat = [10, 0];
    expect(initialBearing(a, b)).toBeCloseTo(90, 0);
  });

  it("due north from equator ≈ 0°", () => {
    const a: LngLat = [0, 0];
    const b: LngLat = [0, 10];
    expect(initialBearing(a, b)).toBeCloseTo(0, 0);
  });

  it("due south ≈ 180°", () => {
    const a: LngLat = [0, 10];
    const b: LngLat = [0, 0];
    expect(initialBearing(a, b)).toBeCloseTo(180, 0);
  });

  it("due west ≈ 270°", () => {
    const a: LngLat = [10, 0];
    const b: LngLat = [0, 0];
    expect(initialBearing(a, b)).toBeCloseTo(270, 0);
  });
});

/* ================================================================== */
/*  7. Midpoint                                                        */
/* ================================================================== */

describe("geodesic — midpoint", () => {
  it("midpoint of equator segment", () => {
    const a: LngLat = [0, 0];
    const b: LngLat = [10, 0];
    const m = midpoint(a, b);
    expect(m[0]).toBeCloseTo(5, 1);
    expect(m[1]).toBeCloseTo(0, 1);
  });

  it("midpoint of meridian segment", () => {
    const a: LngLat = [0, 0];
    const b: LngLat = [0, 10];
    const m = midpoint(a, b);
    expect(m[0]).toBeCloseTo(0, 1);
    expect(m[1]).toBeCloseTo(5, 1);
  });
});

/* ================================================================== */
/*  8. Unit formatting                                                 */
/* ================================================================== */

describe("geodesic — formatDistance", () => {
  it("formats metres (metric)", () => {
    expect(formatDistance(500, "metric")).toBe("500.0 m");
  });

  it("formats kilometres (metric)", () => {
    expect(formatDistance(1500, "metric")).toBe("1.500 km");
  });

  it("formats feet (imperial)", () => {
    expect(formatDistance(100, "imperial")).toContain("ft");
  });

  it("formats miles (imperial)", () => {
    expect(formatDistance(5000, "imperial")).toContain("mi");
  });
});

describe("geodesic — formatArea", () => {
  it("formats square metres (metric)", () => {
    expect(formatArea(500, "metric")).toBe("500.0 m²");
  });

  it("formats hectares (metric)", () => {
    expect(formatArea(50000, "metric")).toContain("ha");
  });

  it("formats km² (metric)", () => {
    expect(formatArea(5_000_000, "metric")).toContain("km²");
  });

  it("formats acres (imperial)", () => {
    expect(formatArea(10000, "imperial")).toContain("acres");
  });

  it("formats ft² for small areas (imperial)", () => {
    expect(formatArea(100, "imperial")).toContain("ft²");
  });
});

describe("geodesic — formatBearing", () => {
  it("formats bearing to 1 decimal", () => {
    expect(formatBearing(45.67)).toBe("45.7°");
  });
});

/* ================================================================== */
/*  9. Unit conversion                                                 */
/* ================================================================== */

describe("geodesic — convertDistance / convertArea", () => {
  it("metric metres for small distances", () => {
    expect(convertDistance(500, "metric")).toBe(500);
  });

  it("metric km for >= 1000 m", () => {
    expect(convertDistance(1500, "metric")).toBe(1.5);
  });

  it("imperial feet for small distances", () => {
    expect(convertDistance(100, "imperial")).toBeCloseTo(328.084, 0);
  });

  it("imperial miles for large distances", () => {
    // 5000 m in feet
    const feet = 5000 * 3.28084;
    expect(convertDistance(5000, "imperial")).toBeCloseTo(feet / 5280, 2);
  });

  it("metric area m² for small areas", () => {
    expect(convertArea(500, "metric")).toBe(500);
  });

  it("metric area ha for medium areas", () => {
    expect(convertArea(50000, "metric")).toBe(5);
  });

  it("metric area km² for large areas", () => {
    expect(convertArea(5_000_000, "metric")).toBe(5);
  });
});

/* ================================================================== */
/*  10. Constants                                                      */
/* ================================================================== */

describe("geodesic — constants", () => {
  it("R = 6,371,008.8 m (WGS-84 mean radius)", () => {
    expect(R).toBe(6_371_008.8);
  });
});

/* ================================================================== */
/*  11. Type structures                                                */
/* ================================================================== */

describe("mapTypes — measurement types", () => {
  it("MeasureToolId accepts valid values", () => {
    const tools: MeasureToolId[] = ["measure-distance", "measure-area"];
    expect(tools).toHaveLength(2);
  });

  it("MeasureUnit accepts metric and imperial", () => {
    const units: MeasureUnit[] = ["metric", "imperial"];
    expect(units).toHaveLength(2);
  });

  it("Measurement interface has correct shape", () => {
    const m: Measurement = {
      id: "m-1",
      type: "measure-distance",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      value: 12345,
      label: "Distance: 12.345 km",
      timestamp: new Date().toISOString(),
      assumptions: {
        method: "geodesic-wgs84",
        crsBasis: "EPSG:4326",
        coordinateBasis: "map-display-coordinates",
        distanceModel: "haversine",
        areaModel: "not-applicable",
        unitBase: "metres",
        caveats: ["Display-coordinate measurement"],
      },
    };
    expect(m.id).toBeTruthy();
    expect(m.type).toBe("measure-distance");
    expect(m.coordinates).toHaveLength(2);
    expect(m.value).toBeGreaterThan(0);
    expect(m.label).toContain("km");
    expect(m.timestamp).toBeTruthy();
    expect(m.assumptions?.method).toBe("geodesic-wgs84");
    expect(m.assumptions?.crsBasis).toBe("EPSG:4326");
  });
});

/* ================================================================== */
/*  12. Store — measurement state                                      */
/* ================================================================== */

describe("useMapExplorerStore — measurement state", () => {
  let useMapExplorerStore: typeof import("../../../../stores/useMapExplorerStore").useMapExplorerStore;

  beforeEach(async () => {
    const mod = await import("../../../../stores/useMapExplorerStore");
    useMapExplorerStore = mod.useMapExplorerStore;
    // Reset measurement state
    useMapExplorerStore.setState({
      activeMeasureTool: null,
      measurements: [],
      measureUnit: "metric",
    });
  });

  it("initial measurement state is empty", () => {
    const state = useMapExplorerStore.getState();
    expect(state.activeMeasureTool).toBeNull();
    expect(state.measurements).toEqual([]);
    expect(state.measureUnit).toBe("metric");
  });

  it("setActiveMeasureTool updates tool", () => {
    useMapExplorerStore.getState().setActiveMeasureTool("measure-distance");
    expect(useMapExplorerStore.getState().activeMeasureTool).toBe("measure-distance");
  });

  it("addMeasurement appends a measurement", () => {
    const m: Measurement = {
      id: "m-test-1",
      type: "measure-distance",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      value: 157_000,
      label: "Distance: 157 km",
      timestamp: "2024-01-01T00:00:00Z",
    };
    useMapExplorerStore.getState().addMeasurement(m);
    expect(useMapExplorerStore.getState().measurements).toHaveLength(1);
    expect(useMapExplorerStore.getState().measurements[0].id).toBe("m-test-1");
  });

  it("removeMeasurement removes by id", () => {
    const m: Measurement = {
      id: "m-del",
      type: "measure-area",
      coordinates: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      value: 12_000_000,
      label: "Area: 12 km²",
      timestamp: "2024-01-01T00:00:00Z",
    };
    useMapExplorerStore.getState().addMeasurement(m);
    expect(useMapExplorerStore.getState().measurements).toHaveLength(1);
    useMapExplorerStore.getState().removeMeasurement("m-del");
    expect(useMapExplorerStore.getState().measurements).toHaveLength(0);
  });

  it("clearMeasurements removes all", () => {
    const m1: Measurement = {
      id: "m-1",
      type: "measure-distance",
      coordinates: [[0, 0], [1, 1]],
      value: 100,
      label: "100m",
      timestamp: "2024-01-01T00:00:00Z",
    };
    const m2: Measurement = {
      id: "m-2",
      type: "measure-area",
      coordinates: [[0, 0], [1, 0], [1, 1]],
      value: 500,
      label: "500m²",
      timestamp: "2024-01-01T00:00:00Z",
    };
    useMapExplorerStore.getState().addMeasurement(m1);
    useMapExplorerStore.getState().addMeasurement(m2);
    expect(useMapExplorerStore.getState().measurements).toHaveLength(2);
    useMapExplorerStore.getState().clearMeasurements();
    expect(useMapExplorerStore.getState().measurements).toHaveLength(0);
  });

  it("setMeasureUnit switches between metric and imperial", () => {
    useMapExplorerStore.getState().setMeasureUnit("imperial");
    expect(useMapExplorerStore.getState().measureUnit).toBe("imperial");
    useMapExplorerStore.getState().setMeasureUnit("metric");
    expect(useMapExplorerStore.getState().measureUnit).toBe("metric");
  });
});

/* ================================================================== */
/*  13. Module exports — MapMeasurementTool                            */
/* ================================================================== */

describe("MapMeasurementTool — module export", () => {
  it("exports MapMeasurementTool component", async () => {
    const mod = await import("../../MapMeasurementTool");
    expect(mod.MapMeasurementTool).toBeDefined();
    expect(typeof mod.MapMeasurementTool).toBe("function");
  });

  it("renders the compact measurement side panel summary", async () => {
    const mod = await import("../../MapMeasurementTool");
    const measurement: Measurement = {
      id: "measurement-1",
      type: "measure-distance",
      coordinates: [[29, 41], [29.1, 41.1]],
      value: 1_520,
      label: "1.5 km",
      timestamp: "2024-01-01T00:00:00Z",
    };

    const html = renderToStaticMarkup(React.createElement(mod.MapMeasurementTool, {
      mapRef: React.createRef<MapLibreMap>(),
      activeMeasureTool: "measure-distance",
      measurements: [measurement],
      measureUnit: "metric",
      onAddMeasurement: () => undefined,
      onRemoveMeasurement: () => undefined,
      onClearMeasurements: () => undefined,
      onSetMeasureUnit: () => undefined,
      onCancelMeasure: () => undefined,
    }));

    expect(html).toContain("Measure");
    expect(html).toContain("Units");
    expect(html).toContain("Metric");
    expect(html).toContain("Results");
    expect(html).toContain("Distance active");
    expect(html).toContain("WGS84 geodesic");
    expect(html).toContain("CRS preflight allows this as geodesic display measurement only");
    expect(html).toContain("1.520 km");
    expect(html).toContain("Copy");
    expect(html).toContain("2024-01-01T00:00:00Z");
  });

  it("supports headless presentation for docked-only measurement workflows", async () => {
    const mod = await import("../../MapMeasurementTool");
    const html = renderToStaticMarkup(React.createElement(mod.MapMeasurementTool, {
      mapRef: React.createRef<MapLibreMap>(),
      activeMeasureTool: "measure-distance",
      presentation: "headless",
      measurements: [],
      measureUnit: "metric",
      onAddMeasurement: () => undefined,
      onRemoveMeasurement: () => undefined,
      onClearMeasurements: () => undefined,
      onSetMeasureUnit: () => undefined,
      onCancelMeasure: () => undefined,
    }));

    expect(html).toBe("");
  });
});

/* ================================================================== */
/*  14. Geodesic benchmarks                                            */
/* ================================================================== */

describe("geodesic — benchmark accuracy", () => {
  it("Istanbul → Ankara ≈ 350 km", () => {
    const istanbul: LngLat = [28.9784, 41.0082];
    const ankara: LngLat = [32.8597, 39.9334];
    const d = haversineDistance(istanbul, ankara);
    expect(d / 1000).toBeGreaterThan(345);
    expect(d / 1000).toBeLessThan(355);
  });

  it("equatorial triangle area makes sense", () => {
    // An equilateral-ish triangle near the equator, each side ≈ 1°
    const tri: LngLat[] = [
      [0, 0],
      [1, 0],
      [0.5, 0.866],
    ];
    const area = sphericalPolygonArea(tri);
    // Expected: ~half of 1°×0.866° ≈ ~5,300 km²
    expect(area / 1e6).toBeGreaterThan(4_000); // km²
    expect(area / 1e6).toBeLessThan(7_000);
  });

  it("bearing from JFK to Heathrow ≈ 51°", () => {
    const jfk: LngLat = [-73.7781, 40.6413];
    const lhr: LngLat = [-0.4614, 51.4700];
    const b = initialBearing(jfk, lhr);
    expect(b).toBeGreaterThan(45);
    expect(b).toBeLessThan(60);
  });
});
