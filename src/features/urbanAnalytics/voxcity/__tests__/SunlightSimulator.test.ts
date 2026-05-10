/**
 * SunlightSimulator — Test Suite
 *
 * Covers astronomical helpers, timestamp generation, shadow projection,
 * full simulation run, per-building exposure summaries, export utilities,
 * determinism, and benchmark geometry validation.
 */
import { describe, expect, it } from "vitest";
import {
  buildingExposureSummary,
  exportBuildingJSON,
  exportGridCSV,
  generateTimestamps,
  julianDay,
  projectShadow,
  runSimulation,
  solarDeclination,
  sunPosition,
} from "../SunlightSimulator";
import { SAMPLE_SUNLIGHT_BUILDINGS } from "../sampleSunlightBuildings";
import type { BuildingVolume, SunlightConfig } from "../sunlightTypes";

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

const ISTANBUL: SunlightConfig = {
  location: { latitude: 41.0082, longitude: 28.9784 },
  startDate: "2025-06-21",
  endDate: "2025-06-21",
  startHour: 8,
  endHour: 18,
  intervalMinutes: 60,
  utcOffset: 3,
};

/** A single 10x10m, 20m-tall building at the origin. */
const SINGLE_BUILDING: BuildingVolume[] = [
  { id: "B1", label: "Test Building", bbox: [0, 0, 10, 10], height: 20 },
];

/** Two buildings: one tall, one short. */
const TWO_BUILDINGS: BuildingVolume[] = [
  { id: "B1", label: "Tall", bbox: [0, 0, 10, 10], height: 40 },
  { id: "B2", label: "Short", bbox: [30, 0, 40, 10], height: 5 },
];

/* ================================================================== */
/*  §1  Astronomical helpers                                          */
/* ================================================================== */

describe("julianDay", () => {
  it("returns correct JD for J2000.0 epoch (2000-01-01T12:00Z)", () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = julianDay(d);
    expect(Math.abs(jd - 2451545.0)).toBeLessThan(1.0);
  });

  it("is monotonically increasing for successive days", () => {
    const d1 = new Date(Date.UTC(2025, 5, 21, 12, 0, 0));
    const d2 = new Date(Date.UTC(2025, 5, 22, 12, 0, 0));
    expect(julianDay(d2)).toBeGreaterThan(julianDay(d1));
  });
});

describe("solarDeclination", () => {
  it("produces positive declination near summer solstice (northern hemisphere)", () => {
    const jd = julianDay(new Date(Date.UTC(2025, 5, 21, 12, 0, 0)));
    const { declination } = solarDeclination(jd);
    expect(declination).toBeGreaterThan(20);
    expect(declination).toBeLessThan(24);
  });

  it("produces negative declination near winter solstice", () => {
    const jd = julianDay(new Date(Date.UTC(2025, 11, 21, 12, 0, 0)));
    const { declination } = solarDeclination(jd);
    expect(declination).toBeLessThan(-20);
    expect(declination).toBeGreaterThan(-24);
  });
});

describe("sunPosition", () => {
  it("returns positive altitude at solar noon in Istanbul, summer solstice", () => {
    // Solar noon at lon 28.98° is approximately UTC 12:00 - eqTime - 4*(28.98-45) ≈ ~09:00 UTC
    // For Istanbul UTC+3, local noon ≈ 12:00 local = 09:00 UTC
    const ts = new Date("2025-06-21T09:00:00Z").getTime();
    const pos = sunPosition({ latitude: 41.0082, longitude: 28.9784 }, ts, 3);
    expect(pos.altitude).toBeGreaterThan(50);
    expect(pos.altitude).toBeLessThan(80);
  });

  it("returns negative altitude at midnight", () => {
    const ts = new Date("2025-06-21T21:00:00Z").getTime();
    const pos = sunPosition({ latitude: 41.0082, longitude: 28.9784 }, ts, 3);
    expect(pos.altitude).toBeLessThan(0);
  });

  it("azimuth is between 0 and 360", () => {
    const ts = new Date("2025-06-21T09:00:00Z").getTime();
    const pos = sunPosition({ latitude: 41.0082, longitude: 28.9784 }, ts, 3);
    expect(pos.azimuth).toBeGreaterThanOrEqual(0);
    expect(pos.azimuth).toBeLessThan(360);
  });

  it("is deterministic — same inputs yield identical outputs", () => {
    const ts = new Date("2025-06-21T09:00:00Z").getTime();
    const loc = { latitude: 41.0082, longitude: 28.9784 };
    const p1 = sunPosition(loc, ts, 3);
    const p2 = sunPosition(loc, ts, 3);
    expect(p1.altitude).toBe(p2.altitude);
    expect(p1.azimuth).toBe(p2.azimuth);
  });
});

/* ================================================================== */
/*  §2  Timestamp generation                                          */
/* ================================================================== */

describe("generateTimestamps", () => {
  it("produces expected count for single day with 1h interval, 8–18", () => {
    const ts = generateTimestamps(ISTANBUL);
    // Hours 8,9,10,11,12,13,14,15,16,17,18 → 11 timestamps
    expect(ts.length).toBe(11);
  });

  it("produces expected count for multi-day range", () => {
    const cfg: SunlightConfig = {
      ...ISTANBUL,
      startDate: "2025-06-21",
      endDate: "2025-06-23",
    };
    const ts = generateTimestamps(cfg);
    expect(ts.length).toBe(33); // 11 per day * 3 days
  });

  it("timestamps are in ascending order", () => {
    const ts = generateTimestamps(ISTANBUL);
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i]).toBeGreaterThan(ts[i - 1]);
    }
  });
});

/* ================================================================== */
/*  §3  Shadow projection                                             */
/* ================================================================== */

describe("projectShadow", () => {
  it("marks at least one cell in shadow for a building with sun above horizon", () => {
    const grid = new Uint8Array(100 * 100);
    projectShadow(
      { altitude: 30, azimuth: 180, timestamp: 0 },
      { id: "B1", label: "Test", bbox: [40, 40, 50, 50], height: 20 },
      [0, 0],
      [100, 100],
      1,
      grid,
    );
    const shadowed = grid.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    expect(shadowed).toBeGreaterThan(0);
  });

  it("marks zero cells when sun is below horizon", () => {
    const grid = new Uint8Array(100 * 100);
    projectShadow(
      { altitude: -5, azimuth: 180, timestamp: 0 },
      { id: "B1", label: "Test", bbox: [40, 40, 50, 50], height: 20 },
      [0, 0],
      [100, 100],
      1,
      grid,
    );
    const shadowed = grid.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    expect(shadowed).toBe(0);
  });

  it("taller buildings produce longer shadows", () => {
    const gridA = new Uint8Array(200 * 200);
    const gridB = new Uint8Array(200 * 200);
    const sun = { altitude: 20, azimuth: 180, timestamp: 0 };
    const origin: readonly [number, number] = [0, 0];
    const size: readonly [number, number] = [200, 200];

    projectShadow(
      sun,
      { id: "A", label: "Short", bbox: [90, 90, 100, 100], height: 10 },
      origin, size, 1, gridA,
    );
    projectShadow(
      sun,
      { id: "B", label: "Tall", bbox: [90, 90, 100, 100], height: 40 },
      origin, size, 1, gridB,
    );

    const countA = gridA.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    const countB = gridB.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    expect(countB).toBeGreaterThan(countA);
  });
});

/* ================================================================== */
/*  §4  Full simulation run                                           */
/* ================================================================== */

describe("runSimulation", () => {
  it("produces a result with correct sampleCount", () => {
    const res = runSimulation(ISTANBUL, SINGLE_BUILDING, 5);
    expect(res.sampleCount).toBe(11);
  });

  it("shadowHours and exposureHours have correct length", () => {
    const res = runSimulation(ISTANBUL, SINGLE_BUILDING, 5);
    const expectedLen = res.gridSize[0] * res.gridSize[1];
    expect(res.shadowHours.length).toBe(expectedLen);
    expect(res.exposureHours.length).toBe(expectedLen);
  });

  it("exposure + shadow ≈ totalDaylightHours for every cell", () => {
    const res = runSimulation(ISTANBUL, SINGLE_BUILDING, 5);
    const len = res.shadowHours.length;
    for (let i = 0; i < len; i++) {
      const sum = res.shadowHours[i] + res.exposureHours[i];
      expect(Math.abs(sum - res.totalDaylightHours)).toBeLessThan(0.01);
    }
  });

  it("is deterministic — identical inputs yield identical outputs", () => {
    const r1 = runSimulation(ISTANBUL, SINGLE_BUILDING, 5);
    const r2 = runSimulation(ISTANBUL, SINGLE_BUILDING, 5);
    expect(r1.sampleCount).toBe(r2.sampleCount);
    expect(r1.stats.meanExposure).toBe(r2.stats.meanExposure);
    expect(r1.totalDaylightHours).toBe(r2.totalDaylightHours);
    for (let i = 0; i < r1.shadowHours.length; i++) {
      expect(r1.shadowHours[i]).toBe(r2.shadowHours[i]);
    }
  });

  it("a taller building casts more shadow-hours than a short one", () => {
    const res = runSimulation(ISTANBUL, TWO_BUILDINGS, 5);
    const tallHours = res.buildingCastHours.get("B1") ?? 0;
    const shortHours = res.buildingCastHours.get("B2") ?? 0;
    expect(tallHours).toBeGreaterThan(shortHours);
  });

  it("works with the sample dataset", () => {
    const res = runSimulation(ISTANBUL, SAMPLE_SUNLIGHT_BUILDINGS, 5);
    expect(res.sampleCount).toBe(11);
    expect(res.stats.meanExposure).toBeGreaterThan(0);
    expect(res.buildings.length).toBe(12);
  });

  it("calls onProgress callback", () => {
    const calls: number[] = [];
    runSimulation(ISTANBUL, SINGLE_BUILDING, 5, (p) => calls.push(p));
    expect(calls.length).toBe(11);
    expect(calls[calls.length - 1]).toBe(1);
  });
});

/* ================================================================== */
/*  §5  Building exposure summary                                     */
/* ================================================================== */

describe("buildingExposureSummary", () => {
  it("returns one summary per building", () => {
    const res = runSimulation(ISTANBUL, TWO_BUILDINGS, 5);
    const summaries = buildingExposureSummary(res);
    expect(summaries.length).toBe(2);
  });

  it("summary values are non-negative", () => {
    const res = runSimulation(ISTANBUL, SAMPLE_SUNLIGHT_BUILDINGS, 5);
    const summaries = buildingExposureSummary(res);
    for (const s of summaries) {
      expect(s.avgExposureHours).toBeGreaterThanOrEqual(0);
      expect(s.minExposureHours).toBeGreaterThanOrEqual(0);
      expect(s.maxExposureHours).toBeGreaterThanOrEqual(0);
      expect(s.sunlitFraction).toBeGreaterThanOrEqual(0);
      expect(s.sunlitFraction).toBeLessThanOrEqual(1);
    }
  });

  it("preserves building labels", () => {
    const res = runSimulation(ISTANBUL, TWO_BUILDINGS, 5);
    const summaries = buildingExposureSummary(res);
    expect(summaries.find((s) => s.label === "Tall")).toBeDefined();
    expect(summaries.find((s) => s.label === "Short")).toBeDefined();
  });
});

/* ================================================================== */
/*  §6  Export utilities                                              */
/* ================================================================== */

describe("exportGridCSV", () => {
  it("produces a non-empty CSV string with a header row", () => {
    const res = runSimulation(ISTANBUL, SINGLE_BUILDING, 10);
    const csv = exportGridCSV(res);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("x,y,shadow_hours,exposure_hours");
    expect(lines.length).toBeGreaterThan(1);
  });

  it("number of data rows equals grid cell count", () => {
    const res = runSimulation(ISTANBUL, SINGLE_BUILDING, 10);
    const csv = exportGridCSV(res);
    const lines = csv.split("\n");
    const expectedCells = res.gridSize[0] * res.gridSize[1];
    expect(lines.length - 1).toBe(expectedCells); // minus header
  });
});

describe("exportBuildingJSON", () => {
  it("produces valid JSON", () => {
    const res = runSimulation(ISTANBUL, TWO_BUILDINGS, 5);
    const summaries = buildingExposureSummary(res);
    const json = exportBuildingJSON(summaries);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });
});

/* ================================================================== */
/*  §7  Benchmark geometry validation                                 */
/* ================================================================== */

describe("benchmark — single building shadow geometry", () => {
  it("shadow at 45° altitude with sun due south should shadow area ≈ building footprint area", () => {
    // Sun due south (azimuth 180°), altitude 45° → shadow length = height / tan(45°) = height
    // A 10x10m building at height 10m casts a shadow 10m to the north.
    // Total shadowed area ≈ building footprint + 10m strip north of it = 10*20 = 200m²
    const building: BuildingVolume = {
      id: "bench", label: "Bench",
      bbox: [45, 45, 55, 55], // 10x10m centered in a 100x100 grid
      height: 10,
    };
    const grid = new Uint8Array(100 * 100);
    projectShadow(
      { altitude: 45, azimuth: 180, timestamp: 0 },
      building,
      [0, 0],
      [100, 100],
      1,
      grid,
    );
    const shadowed = grid.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    // Expected: building footprint (100 cells) + shadow strip (~100 cells north)
    // Allow generous tolerance for the approximate shadow polygon test
    expect(shadowed).toBeGreaterThan(50);
    expect(shadowed).toBeLessThan(400);
  });

  it("shadow at 90° altitude (sun directly overhead) should shadow only the footprint", () => {
    const building: BuildingVolume = {
      id: "bench2", label: "Bench2",
      bbox: [45, 45, 55, 55],
      height: 10,
    };
    const grid = new Uint8Array(100 * 100);
    projectShadow(
      { altitude: 89.9, azimuth: 180, timestamp: 0 },
      building,
      [0, 0],
      [100, 100],
      1,
      grid,
    );
    const shadowed = grid.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    // Near-vertical sun: shadow ≈ footprint only
    expect(shadowed).toBeGreaterThan(80);
    expect(shadowed).toBeLessThan(150);
  });
});
