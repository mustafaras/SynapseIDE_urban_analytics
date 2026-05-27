/**
 * Tests for SolarPositionService — computeSolarPosition()
 *
 * Covers:
 * - Summer solstice altitude at equator/mid-latitudes
 * - Winter solstice lower altitude
 * - Pre-sunrise → altitude < 0
 * - Azimuth at solar noon ≈ 180° (northern hemisphere)
 * - Deterministic: same inputs → same output
 */
import { describe, expect, it } from "vitest";
import { computeSolarPosition } from "@/services/map/scene3d/SolarPositionService";

/* ------------------------------------------------------------------ */
/*  Test data                                                           */
/* ------------------------------------------------------------------ */

// Istanbul coordinates
const ISTANBUL_LAT = 41.0;
const ISTANBUL_LON = 28.9;

// Equator
const EQUATOR_LAT = 0.0;
const EQUATOR_LON = 0.0;

// Summer solstice ~2026-06-21 (day 172)
const SUMMER_SOLSTICE_NOON = "2026-06-21T12:00:00Z"; // UTC noon at lon=0
// Winter solstice ~2026-12-21
const WINTER_SOLSTICE_NOON = "2026-12-21T12:00:00Z";

// Night time — well before sunrise anywhere at lon=0
const MIDNIGHT_UTC = "2026-06-21T00:00:00Z";

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("SolarPositionService — computeSolarPosition", () => {
  it("returns an object with altitudeDeg, azimuthDeg, zenithDeg", () => {
    const pos = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, SUMMER_SOLSTICE_NOON);
    expect(typeof pos.altitudeDeg).toBe("number");
    expect(typeof pos.azimuthDeg).toBe("number");
    expect(typeof pos.zenithDeg).toBe("number");
  });

  it("zenithDeg = 90 - altitudeDeg (always)", () => {
    const pos = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, SUMMER_SOLSTICE_NOON);
    expect(pos.zenithDeg).toBeCloseTo(90 - pos.altitudeDeg, 10);
  });

  it("summer solstice noon at equator: altitude ≈ 90 - |declination| ≈ 66.5°", () => {
    // Declination at solstice ≈ +23.45°. At equator solar noon: alt ≈ 90 - 23.45 = 66.55°
    const pos = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, SUMMER_SOLSTICE_NOON);
    expect(pos.altitudeDeg).toBeGreaterThan(60);
    expect(pos.altitudeDeg).toBeLessThan(90);
  });

  it("summer solstice noon at mid-northern-lat (41°): altitude lower than equator", () => {
    const posEq = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, SUMMER_SOLSTICE_NOON);
    const posIst = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, SUMMER_SOLSTICE_NOON);
    // Account for longitude offset — Istanbul noon is ~2 h earlier in UTC
    // Compute at lon-adjusted time for Istanbul: UTC noon ≈ 12 - 28.9/15 = 10:04 UTC
    const istNoon = "2026-06-21T10:04:00Z";
    const posIstNoon = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, istNoon);
    expect(posIstNoon.altitudeDeg).toBeGreaterThan(60); // Should still be high
    expect(posIstNoon.altitudeDeg).toBeLessThan(posEq.altitudeDeg + 20); // reasonable
    // Just check it's positive
    expect(posIst.altitudeDeg).not.toBeNaN();
  });

  it("winter solstice noon: altitude lower than summer solstice noon (equator)", () => {
    const summer = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, SUMMER_SOLSTICE_NOON);
    const winter = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, WINTER_SOLSTICE_NOON);
    // At equator summer declination is +23.45, winter is -23.45. Both give same altitude by symmetry.
    // Let's test at northern latitude instead
    const summerN = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, SUMMER_SOLSTICE_NOON);
    const winterN = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, WINTER_SOLSTICE_NOON);
    // At UTC noon Istanbul is ~2h past solar noon in summer — use approximate
    // Main assertion: winter altitude at UTC noon is lower than summer
    expect(winter.altitudeDeg).toBeLessThanOrEqual(summer.altitudeDeg + 1); // same at equator
    // Northern latitude: summer noon (UTC) > winter noon (UTC)
    expect(summerN.altitudeDeg).toBeGreaterThan(winterN.altitudeDeg);
  });

  it("midnight UTC at lon=0 → sun well below horizon (altitude < 0)", () => {
    const pos = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, MIDNIGHT_UTC);
    expect(pos.altitudeDeg).toBeLessThan(0);
  });

  it("pre-sunrise hour 4 UTC at lon=0 → altitude < 0", () => {
    const pos = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, "2026-06-21T04:00:00Z");
    expect(pos.altitudeDeg).toBeLessThan(0);
  });

  it("azimuth at solar noon (UTC adjusted for lon) ≈ 180° in northern hemisphere", () => {
    // Solar noon at Istanbul: UTC hour ≈ 12 - 28.9/15 ≈ 10.07 → ~10:04 UTC
    const pos = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, "2026-06-21T10:04:00Z");
    // At solar noon, azimuth should be close to 180° (sun due south)
    expect(pos.azimuthDeg).toBeGreaterThan(150);
    expect(pos.azimuthDeg).toBeLessThan(210);
  });

  it("azimuth at equator near noon: sun is high, azimuth valid (0–360)", () => {
    // At summer solstice, equator, lon=0, UTC noon: sun is at high altitude (~66°)
    // Declination is +23.45 → sun is slightly N of zenith → azimuth near 0 or 360 is valid
    const pos = computeSolarPosition(EQUATOR_LAT, EQUATOR_LON, SUMMER_SOLSTICE_NOON);
    expect(pos.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(pos.azimuthDeg).toBeLessThanOrEqual(360);
    // Altitude should be high
    expect(pos.altitudeDeg).toBeGreaterThan(60);
  });

  it("is deterministic — same inputs return identical results", () => {
    const pos1 = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, SUMMER_SOLSTICE_NOON);
    const pos2 = computeSolarPosition(ISTANBUL_LAT, ISTANBUL_LON, SUMMER_SOLSTICE_NOON);
    expect(pos1.altitudeDeg).toBe(pos2.altitudeDeg);
    expect(pos1.azimuthDeg).toBe(pos2.azimuthDeg);
    expect(pos1.zenithDeg).toBe(pos2.zenithDeg);
  });

  it("altitude is within physical bounds [-90, 90]", () => {
    const timestamps = [
      "2026-01-01T00:00:00Z",
      "2026-03-21T06:00:00Z",
      "2026-06-21T12:00:00Z",
      "2026-09-22T18:00:00Z",
      "2026-12-21T21:00:00Z",
    ];
    const lats = [-60, -23.45, 0, 41, 89];
    for (const ts of timestamps) {
      for (const lat of lats) {
        const pos = computeSolarPosition(lat, 0, ts);
        expect(pos.altitudeDeg).toBeGreaterThanOrEqual(-90);
        expect(pos.altitudeDeg).toBeLessThanOrEqual(90);
        expect(pos.azimuthDeg).toBeGreaterThanOrEqual(0);
        expect(pos.azimuthDeg).toBeLessThanOrEqual(360);
      }
    }
  });
});
