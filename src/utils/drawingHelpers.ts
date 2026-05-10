/* ================================================================== */
/*  Drawing / Geometry Helpers                                         */
/*  Pure utility — zero UI dependencies, independently testable        */
/* ================================================================== */

/** WGS-84 mean Earth radius in metres */
const R = 6_371_008.8;

/** Degrees → radians */
const toRad = (d: number): number => (d * Math.PI) / 180;

/** Radians → degrees */
const toDeg = (r: number): number => (r * 180) / Math.PI;

/* ================================================================== */
/*  Geodesic circle (64-segment approximation)                         */
/* ================================================================== */

/**
 * Build a geodesic circle polygon ring around `center` with a given
 * `radiusMetres`.  Uses the Vincenty direct formula simplified for a
 * sphere so the result is visually circular at **any** latitude —
 * including 60°N.
 *
 * @returns Closed ring of [lng, lat] pairs (first === last).
 */
export function geodesicCircle(
  center: [number, number],
  radiusMetres: number,
  segments = 64,
): [number, number][] {
  const [cLng, cLat] = center;
  const lat1 = toRad(cLat);
  const lng1 = toRad(cLng);
  const d = radiusMetres / R; // angular distance

  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const bearing = (2 * Math.PI * i) / segments;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
        Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    ring.push([toDeg(lng2), toDeg(lat2)]);
  }
  // Ensure exact closure
  ring[ring.length - 1] = ring[0];
  return ring;
}

/* ================================================================== */
/*  Haversine distance (metres)                                        */
/* ================================================================== */

/**
 * Compute Haversine distance between two [lng, lat] points in metres.
 */
export function haversineDistance(
  a: [number, number],
  b: [number, number],
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ================================================================== */
/*  Pixel ↔ snap helpers                                               */
/* ================================================================== */

/**
 * Return `true` if screen-space `a` and `b` are within `tolerance` px.
 */
export function isWithinPixels(
  a: { x: number; y: number },
  b: { x: number; y: number },
  tolerance: number,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy <= tolerance * tolerance;
}

/* ================================================================== */
/*  GeoJSON factory helpers                                            */
/* ================================================================== */

export function makePoint(
  coord: [number, number],
): GeoJSON.Point {
  return { type: "Point", coordinates: coord };
}

export function makeLineString(
  coords: [number, number][],
): GeoJSON.LineString {
  return { type: "LineString", coordinates: coords };
}

/**
 * Build a valid GeoJSON Polygon from a ring of coordinates.
 * Ensures the ring is closed (first === last).
 */
export function makePolygon(
  coords: [number, number][],
): GeoJSON.Polygon {
  const ring = [...coords];
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push(ring[0]);
  }
  return { type: "Polygon", coordinates: [ring] };
}

/**
 * Build a rectangle polygon from two diagonal corner points.
 */
export function makeRectangle(
  a: [number, number],
  b: [number, number],
): GeoJSON.Polygon {
  const ring: [number, number][] = [
    a,
    [b[0], a[1]],
    b,
    [a[0], b[1]],
    a,
  ];
  return { type: "Polygon", coordinates: [ring] };
}

/**
 * Build a geodesic circle polygon.
 */
export function makeCircle(
  center: [number, number],
  radiusMetres: number,
): GeoJSON.Polygon {
  return { type: "Polygon", coordinates: [geodesicCircle(center, radiusMetres)] };
}

/* ================================================================== */
/*  Unique ID                                                          */
/* ================================================================== */

let _drawCount = 0;

/**
 * Deterministic-prefix unique ID for drawn features.
 */
export function drawId(): string {
  return `drawn-${Date.now()}-${++_drawCount}`;
}

/* ================================================================== */
/*  GeoJSON FeatureCollection builder                                  */
/* ================================================================== */

export function featureCollection(
  features: GeoJSON.Feature[],
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

/* ================================================================== */
/*  Geometry type label (for the sidebar)                              */
/* ================================================================== */

const GEOM_LABELS: Record<string, string> = {
  Point: "●",
  LineString: "╱",
  Polygon: "⬠",
};

export function geometryIcon(type: string): string {
  return GEOM_LABELS[type] ?? "?";
}
