/**
 * SunShadowEngine — evidence-ready shadow footprint computation.
 *
 * Computes per-building shadow polygons by projecting building footprints
 * along the opposite-sun direction vector. Pure geometry — no WebGL rendering.
 *
 * Runtime mode: demo. Not real raycast. Assumes flat terrain.
 * Intended for evidence-grade analytical export, not visual rendering.
 */
import type { Feature, Polygon, Position } from "geojson";
import type { SolarPosition } from "./SolarPositionService";

/* ------------------------------------------------------------------ */
/*  Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface ShadowAssumptions {
  solarModel: "simplified-declination-hour-angle";
  verticalDatum: "assumed-flat-terrain";
  runtimeMode: "demo";
  geometrySource: "massing-engine" | "user-provided" | "unknown";
}

export interface BuildingShadowResult {
  buildingId: string | number;
  heightMetres: number;
  shadowLengthM: number;
  /** null when sun is below the horizon */
  shadowPolygon: Feature<Polygon> | null;
  shadowAreaM2: number;
}

export interface ShadowAnalysisResult {
  scenarioId: string;
  dateTime: string;
  solarPosition: SolarPosition;
  buildingResults: BuildingShadowResult[];
  totalShadowAreaM2: number;
  parcelAreaM2: number;
  shadowCoverageRatio: number;
  sunBelowHorizon: boolean;
  assumptions: ShadowAssumptions;
  caveats: string[];
}

export interface ShadowScenario {
  id: string;
  label: string;
  buildings: Feature<Polygon>[];
  heightsM: number[];
  parcelAreaM2: number;
  geometrySource: ShadowAssumptions["geometrySource"];
  createdAt: string;
  /** Latest computed result — null until first computation. */
  result: ShadowAnalysisResult | null;
}

export interface ShadowAnalysisInput {
  buildings: Feature<Polygon>[];
  heightsM: number[];
  parcelAreaM2: number;
  solarPosition: SolarPosition;
  dateTime: string;
  scenarioId?: string;
  geometrySource: ShadowAssumptions["geometrySource"];
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/** Approximate planar area in m² for a lon/lat polygon ring using shoelace. */
function shoelaceAreaDeg2(ring: Position[]): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n - 1; i++) {
    const x0 = ring[i]![0]!;
    const y0 = ring[i]![1]!;
    const x1 = ring[i + 1]![0]!;
    const y1 = ring[i + 1]![1]!;
    area += x0 * y1 - x1 * y0;
  }
  return Math.abs(area) / 2;
}

/**
 * Convert shoelace area in degree² to approximate m²
 * using equirectangular projection at centroid latitude.
 */
function degAreaToM2(ring: Position[]): number {
  if (ring.length < 3) return 0;
  // Estimate centroid latitude
  const latSum = ring.reduce((acc, p) => acc + p[1]!, 0) / ring.length;
  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos(latSum * (Math.PI / 180));
  const degArea = shoelaceAreaDeg2(ring);
  return degArea * metersPerDegLat * metersPerDegLon;
}

/** Shift all polygon vertices by (dx, dy) in degrees. */
function shiftRing(ring: Position[], dxDeg: number, dyDeg: number): Position[] {
  return ring.map((p) => [p[0]! + dxDeg, p[1]! + dyDeg]);
}

/**
 * Compute approximate shadow polygon for a single building.
 * Returns null when the sun is below the horizon.
 */
function computeBuildingShadow(
  building: Feature<Polygon>,
  heightM: number,
  solar: SolarPosition,
): Feature<Polygon> | null {
  if (solar.altitudeDeg <= 0) return null;

  const altRad = solar.altitudeDeg * (Math.PI / 180);
  const azRad = solar.azimuthDeg * (Math.PI / 180);

  // Shadow length on flat ground
  const shadowLengthM = heightM / Math.tan(altRad);

  // Opposite direction to sun
  const shadowOffsetXm = shadowLengthM * Math.sin(azRad + Math.PI);
  const shadowOffsetYm = shadowLengthM * Math.cos(azRad + Math.PI);

  // Convert m offset to approximate degrees (at ~0° lat this is fine for demo)
  // For accuracy we use 111,320 m/deg lat and adjust lon by cos(lat)
  const ring = building.geometry.coordinates[0];
  if (!ring || ring.length === 0) return null;

  const centLat = ring.reduce((acc, p) => acc + p[1]!, 0) / ring.length;
  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos(centLat * (Math.PI / 180));

  const dxDeg = shadowOffsetXm / metersPerDegLon;
  const dyDeg = shadowOffsetYm / metersPerDegLat;

  // Shadow footprint = shifted building ring
  const shiftedRing = shiftRing(ring, dxDeg, dyDeg);

  return {
    type: "Feature",
    id: `shadow-${building.id ?? "?"}`,
    geometry: {
      type: "Polygon",
      coordinates: [shiftedRing],
    },
    properties: {
      buildingId: building.id ?? null,
      heightM,
      shadowLengthM,
      altitudeDeg: solar.altitudeDeg,
      azimuthDeg: solar.azimuthDeg,
      runtimeMode: "demo",
    },
  };
}

/** Approximate polygon area in m². Falls back to 0 for nulls. */
function polygonAreaM2(polygon: Feature<Polygon> | null): number {
  if (!polygon) return 0;
  const ring = polygon.geometry.coordinates[0];
  if (!ring || ring.length < 3) return 0;
  return degAreaToM2(ring);
}

/** Simple shadow length — 0 when sun is below horizon. */
function shadowLength(heightM: number, solar: SolarPosition): number {
  if (solar.altitudeDeg <= 0) return 0;
  const altRad = solar.altitudeDeg * (Math.PI / 180);
  return heightM / Math.tan(altRad);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute shadow analysis for a set of buildings given a solar position.
 *
 * Shadow polygon computation: each building footprint is shifted opposite
 * the sun direction by (height / tan(altitude)) metres.
 * Sun below horizon → sunBelowHorizon = true, per-building shadowPolygon = null.
 *
 * @param input  ShadowAnalysisInput
 * @returns      ShadowAnalysisResult
 */
export function computeShadowAnalysis(input: ShadowAnalysisInput): ShadowAnalysisResult {
  const {
    buildings,
    heightsM,
    parcelAreaM2,
    solarPosition,
    dateTime,
    scenarioId = `shadow-${Date.now()}`,
    geometrySource,
  } = input;

  const sunBelowHorizon = solarPosition.altitudeDeg <= 0;

  const buildingResults: BuildingShadowResult[] = buildings.map((building, i) => {
    const heightMetres = heightsM[i] ?? 0;
    const shadowPolygon = sunBelowHorizon
      ? null
      : computeBuildingShadow(building, heightMetres, solarPosition);
    const shadowAreaM2 = polygonAreaM2(shadowPolygon);
    const shadowLengthM = shadowLength(heightMetres, solarPosition);

    return {
      buildingId: building.id ?? i,
      heightMetres,
      shadowLengthM,
      shadowPolygon,
      shadowAreaM2,
    };
  });

  const totalShadowAreaM2 = buildingResults.reduce((acc, r) => acc + r.shadowAreaM2, 0);
  const shadowCoverageRatio =
    parcelAreaM2 > 0 ? Math.min(1, totalShadowAreaM2 / parcelAreaM2) : 0;

  const assumptions: ShadowAssumptions = {
    solarModel: "simplified-declination-hour-angle",
    verticalDatum: "assumed-flat-terrain",
    runtimeMode: "demo",
    geometrySource,
  };

  const caveats: string[] = [
    "Shadow computation uses simplified flat-terrain projection (demo mode).",
    "No real raycast, mutual building occlusion, or terrain elevation data used.",
    "Coordinate offset uses equirectangular approximation — accuracy decreases at high latitudes.",
    "Results are indicative only and must not be used for compliance determinations.",
  ];

  if (sunBelowHorizon) {
    caveats.push("Sun is below the horizon at the selected time — shadow polygons unavailable.");
  }

  return {
    scenarioId,
    dateTime,
    solarPosition,
    buildingResults,
    totalShadowAreaM2,
    parcelAreaM2,
    shadowCoverageRatio,
    sunBelowHorizon,
    assumptions,
    caveats,
  };
}

/* ------------------------------------------------------------------ */
/*  SunShadowEngine class (thin wrapper for store usage)               */
/* ------------------------------------------------------------------ */

export class SunShadowEngine {
  compute(input: ShadowAnalysisInput): ShadowAnalysisResult {
    return computeShadowAnalysis(input);
  }
}
