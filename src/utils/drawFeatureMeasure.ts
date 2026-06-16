/* ================================================================== */
/*  Drawn-feature measurement summaries                                */
/*  Pure math — zero UI deps, independently testable.                  */
/*                                                                     */
/*  CRS-safe: all area/length use the geodesic (WGS-84 spherical)      */
/*  helpers in geodesic.ts. We NEVER compute planar area/length in     */
/*  EPSG:4326 degrees.                                                  */
/* ================================================================== */

import {
  type LngLat,
  polygonPerimeter,
  polylineLength,
  sphericalPolygonArea,
} from "./geodesic";

export type DrawnMeasureKind = "point" | "line" | "polygon" | "other";

export interface DrawnFeatureMeasurement {
  kind: DrawnMeasureKind;
  /** Number of distinct vertices (closing ring vertex excluded for polygons). */
  vertexCount: number;
  /** Geodesic area in m² — polygons only, else null. */
  areaM2: number | null;
  /** Geodesic perimeter in m — polygons only, else null. */
  perimeterM: number | null;
  /** Geodesic length in m — lines only, else null. */
  lengthM: number | null;
  /** Representative point (vertex average) — null for empty geometry. */
  centroid: [number, number] | null;
}

function toLngLatList(coords: readonly (readonly number[])[]): LngLat[] {
  return coords
    .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map((c) => [c[0] as number, c[1] as number]);
}

function averagePoint(pts: LngLat[]): [number, number] | null {
  if (pts.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of pts) {
    sx += x;
    sy += y;
  }
  return [sx / pts.length, sy / pts.length];
}

/** Strip a trailing closing vertex (first === last) if present. */
function openRing(ring: LngLat[]): LngLat[] {
  if (
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  ) {
    return ring.slice(0, -1);
  }
  return ring;
}

/** Measure a single drawn geometry. Only Point/LineString/Polygon are scored. */
export function measureDrawnGeometry(geometry: GeoJSON.Geometry): DrawnFeatureMeasurement {
  if (geometry.type === "Point") {
    const c = geometry.coordinates;
    const centroid: [number, number] | null =
      Number.isFinite(c[0]) && Number.isFinite(c[1]) ? [c[0], c[1]] : null;
    return { kind: "point", vertexCount: centroid ? 1 : 0, areaM2: null, perimeterM: null, lengthM: null, centroid };
  }

  if (geometry.type === "LineString") {
    const pts = toLngLatList(geometry.coordinates);
    return {
      kind: "line",
      vertexCount: pts.length,
      areaM2: null,
      perimeterM: null,
      lengthM: pts.length >= 2 ? polylineLength(pts) : 0,
      centroid: averagePoint(pts),
    };
  }

  if (geometry.type === "Polygon") {
    const ringRaw = toLngLatList(geometry.coordinates[0] ?? []);
    const ring = openRing(ringRaw);
    return {
      kind: "polygon",
      vertexCount: ring.length,
      areaM2: ring.length >= 3 ? sphericalPolygonArea(ring) : 0,
      perimeterM: ring.length >= 2 ? polygonPerimeter(ring) : 0,
      lengthM: null,
      centroid: averagePoint(ring),
    };
  }

  return { kind: "other", vertexCount: 0, areaM2: null, perimeterM: null, lengthM: null, centroid: null };
}

export interface DrawnFeaturesSummary {
  count: number;
  polygonCount: number;
  lineCount: number;
  pointCount: number;
  totalAreaM2: number;
  totalLengthM: number;
}

/** Aggregate totals across many geometries (for the modal status line). */
export function summarizeDrawnGeometries(
  geometries: readonly GeoJSON.Geometry[],
): DrawnFeaturesSummary {
  const summary: DrawnFeaturesSummary = {
    count: geometries.length,
    polygonCount: 0,
    lineCount: 0,
    pointCount: 0,
    totalAreaM2: 0,
    totalLengthM: 0,
  };
  for (const geometry of geometries) {
    const m = measureDrawnGeometry(geometry);
    if (m.kind === "polygon") {
      summary.polygonCount += 1;
      summary.totalAreaM2 += m.areaM2 ?? 0;
    } else if (m.kind === "line") {
      summary.lineCount += 1;
      summary.totalLengthM += m.lengthM ?? 0;
    } else if (m.kind === "point") {
      summary.pointCount += 1;
    }
  }
  return summary;
}
