import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";

import type { DrawnGeometryValidation } from "@/centerpanel/components/map/mapTypes";

export const DRAWING_VALIDATION_BASE_CAVEAT =
  "Drawing coordinates use map display longitude/latitude; structural validation does not verify a source CRS.";

export function createDrawnValidation(
  status: DrawnGeometryValidation["status"],
  issueCodes: string[],
  caveats: string[],
): DrawnGeometryValidation {
  return {
    status,
    issueCodes: Array.from(new Set(issueCodes)),
    caveats: Array.from(new Set(caveats)),
    checkedAt: new Date().toISOString(),
  };
}

export function visitDrawnGeometryPositions(
  geometry: GeoJSON.Geometry | null | undefined,
  visitor: (position: readonly number[]) => void,
): void {
  if (!geometry) return;
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitDrawnGeometryPositions(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visitor(value as readonly number[]);
      return;
    }
    value.forEach(walk);
  };

  walk(geometry.coordinates);
}

function isFiniteCoordinatePair(position: readonly number[]): boolean {
  return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function coordinateKey(position: readonly number[]): string {
  return `${position[0]},${position[1]}`;
}

function positionsMatch(first: readonly number[], second: readonly number[]): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

function distinctPositionCount(positions: readonly (readonly number[])[]): number {
  return new Set(positions.map(coordinateKey)).size;
}

function polygonRingHasArea(ring: readonly (readonly number[])[]): boolean {
  let signedArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index]!;
    const next = ring[index + 1]!;
    signedArea += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(signedArea) > 1e-12;
}

function validateLinePositions(
  positions: readonly (readonly number[])[],
  blockedIssueCodes: string[],
  caveats: string[],
): void {
  if (positions.length < 2) {
    blockedIssueCodes.push("short_line");
    caveats.push("Line drawings need at least two coordinate positions.");
    return;
  }
  if (distinctPositionCount(positions) < 2) {
    blockedIssueCodes.push("degenerate_line");
    caveats.push("Line drawings need at least two distinct positions.");
  }
}

function validatePolygonRing(
  ring: readonly (readonly number[])[],
  blockedIssueCodes: string[],
  caveats: string[],
): void {
  if (ring.length < 4) {
    blockedIssueCodes.push("short_ring");
    caveats.push("Polygon drawings need at least three vertices and a closing coordinate.");
    return;
  }
  if (!positionsMatch(ring[0]!, ring[ring.length - 1]!)) {
    blockedIssueCodes.push("non_closed_ring");
    caveats.push("Polygon rings must close before they can be used as an AOI.");
  }
  if (distinctPositionCount(ring.slice(0, -1)) < 3) {
    blockedIssueCodes.push("degenerate_polygon");
    caveats.push("Polygon drawings need at least three distinct positions.");
  }
  if (!polygonRingHasArea(ring)) {
    blockedIssueCodes.push("zero_area_polygon");
    caveats.push("Polygon drawings must enclose a measurable area.");
  }
}

export function validateDrawnGeometry(
  geometry: GeoJSON.Geometry | null | undefined,
): DrawnGeometryValidation {
  const blockedIssueCodes: string[] = [];
  const warningIssueCodes: string[] = [];
  const caveats = [DRAWING_VALIDATION_BASE_CAVEAT];

  if (!geometry) {
    return createDrawnValidation("blocked", ["null_geometry"], [
      ...caveats,
      "Feature geometry is null and cannot be used as an AOI or edited geometry.",
    ]);
  }

  visitDrawnGeometryPositions(geometry, (position) => {
    if (!isFiniteCoordinatePair(position)) {
      blockedIssueCodes.push("invalid_numeric_coordinate");
      caveats.push("Every drawn coordinate must be finite before it can be stored.");
      return;
    }
    if (Math.abs(position[1]) > 90) {
      warningIssueCodes.push("latitude_out_of_range");
      caveats.push("At least one latitude is outside the WGS84 display range.");
    }
  });

  if (geometry.type === "Point") {
    if (!isFiniteCoordinatePair(geometry.coordinates)) {
      blockedIssueCodes.push("invalid_point_coordinate");
    }
  } else if (geometry.type === "LineString") {
    validateLinePositions(geometry.coordinates, blockedIssueCodes, caveats);
  } else if (geometry.type === "MultiLineString") {
    geometry.coordinates.forEach((linePositions) => validateLinePositions(linePositions, blockedIssueCodes, caveats));
  } else if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => validatePolygonRing(ring, blockedIssueCodes, caveats));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => validatePolygonRing(ring, blockedIssueCodes, caveats));
    });
  } else if (geometry.type === "GeometryCollection" && geometry.geometries.length === 0) {
    blockedIssueCodes.push("empty_geometry_collection");
    caveats.push("Geometry collections need at least one geometry.");
  }

  try {
    if ((geometry.type === "Polygon" || geometry.type === "MultiPolygon")
      && kinks({ type: "Feature", geometry, properties: {} }).features.length > 0) {
      blockedIssueCodes.push("self_intersection");
      caveats.push("Self-intersecting polygons are blocked because area and overlay results are unreliable.");
    }
    if (!booleanValid(geometry)) {
      blockedIssueCodes.push("invalid_geojson_geometry");
      caveats.push("The drawn geometry failed GeoJSON validity checks.");
    }
  } catch {
    warningIssueCodes.push("topology_validation_unknown");
    caveats.push("Topology validation could not complete for this drawing.");
  }

  if (blockedIssueCodes.length > 0) {
    return createDrawnValidation("blocked", blockedIssueCodes, caveats);
  }
  if (warningIssueCodes.length > 0) {
    return createDrawnValidation("warning", warningIssueCodes, caveats);
  }
  return createDrawnValidation("valid", [], caveats);
}

export function summarizeDrawnGeometryValidation(validation: DrawnGeometryValidation): string {
  if (validation.issueCodes.includes("self_intersection")) {
    return validation.caveats.find((caveat) => caveat.includes("Self-intersecting"))
      ?? "Self-intersecting polygons are blocked because area and overlay results are unreliable.";
  }
  if (validation.issueCodes.includes("null_geometry")) {
    return validation.caveats.find((caveat) => caveat.includes("null"))
      ?? "Feature geometry is null and cannot be used as an AOI or edited geometry.";
  }
  if (validation.issueCodes.includes("invalid_geojson_geometry")) {
    return validation.caveats.find((caveat) => caveat.includes("GeoJSON validity"))
      ?? "The drawn geometry failed GeoJSON validity checks.";
  }
  return validation.caveats.find((caveat) => caveat !== DRAWING_VALIDATION_BASE_CAVEAT)
    ?? "Geometry validation blocked this drawing.";
}
