/* ================================================================== */
/*  Geodesic Measurement Utilities                                     */
/*  Pure math — zero UI dependencies, independently testable           */
/*                                                                     */
/*  Earth model: WGS-84 mean radius (6,371,008.8 m)                   */
/*  Accuracy target: < 0.1 % error at distances up to 100 km          */
/* ================================================================== */

/** WGS-84 mean Earth radius in metres */
export const R = 6_371_008.8;

/* ---- Internal helpers ---- */
const toRad = (d: number): number => (d * Math.PI) / 180;

/* ================================================================== */
/*  Coordinate type                                                    */
/* ================================================================== */

/** A geographic point as [longitude, latitude] in decimal degrees. */
export type LngLat = [number, number];

/* ================================================================== */
/*  Unit system                                                        */
/* ================================================================== */

/** Supported unit systems. */
export type UnitSystem = "metric" | "imperial";

/* ================================================================== */
/*  Haversine distance                                                 */
/* ================================================================== */

/**
 * Compute the great-circle distance between two points using the
 * Haversine formula.
 *
 * d = 2R·arcsin(√(sin²(Δφ/2) + cosφ₁·cosφ₂·sin²(Δλ/2)))
 *
 * @param a First point [lng, lat]
 * @param b Second point [lng, lat]
 * @returns Distance in metres.
 */
export function haversineDistance(a: LngLat, b: LngLat): number {
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
/*  Polyline length                                                    */
/* ================================================================== */

/**
 * Sum of geodesic segment distances along a polyline.
 *
 * @param coords Array of [lng, lat] points (at least 2).
 * @returns Total length in metres.
 */
export function polylineLength(coords: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1], coords[i]);
  }
  return total;
}

/**
 * Cumulative segment distances for a polyline.
 * Returns an array of length `coords.length` where index 0 is 0 and
 * index i is the sum of all segment distances up to point i.
 */
export function segmentDistances(coords: LngLat[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    result.push(result[i - 1] + haversineDistance(coords[i - 1], coords[i]));
  }
  return result;
}

/* ================================================================== */
/*  Spherical polygon area                                             */
/* ================================================================== */

/**
 * Compute the area of a spherical polygon given its ring of vertices
 * using the spherical excess formula.
 *
 * Uses the shoelface-like formula on a sphere:
 *   A = |R² · Σ (λ_{i+1} − λ_{i-1}) · sin(φ_i) | / 2
 *
 * This is accurate to < 0.1 % for urban-scale polygons (< 100 km edges).
 *
 * @param ring Array of [lng, lat] vertices. The ring should NOT be
 *             closed (first !== last). If it is, the last vertex is ignored.
 * @returns Area in square metres (always positive).
 */
export function sphericalPolygonArea(ring: LngLat[]): number {
  // Remove closing vertex if present
  let pts = ring;
  if (
    pts.length > 1 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
  ) {
    pts = pts.slice(0, -1);
  }

  const n = pts.length;
  if (n < 3) return 0;

  const radLng = pts.map((p) => toRad(p[0]));
  const radLat = pts.map((p) => toRad(p[1]));

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const k = (i + n - 1) % n;
    sum += (radLng[j] - radLng[k]) * Math.sin(radLat[i]);
  }

  return Math.abs((sum * R * R) / 2);
}

/* ================================================================== */
/*  Polygon perimeter                                                  */
/* ================================================================== */

/**
 * Geodesic perimeter of a closed polygon ring.
 *
 * @param ring Array of [lng, lat] vertices. If not closed, the
 *             closing edge (last → first) is added automatically.
 * @returns Perimeter in metres.
 */
export function polygonPerimeter(ring: LngLat[]): number {
  if (ring.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < ring.length; i++) {
    total += haversineDistance(ring[i - 1], ring[i]);
  }
  // Close the ring if necessary
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    total += haversineDistance(last, first);
  }
  return total;
}

/* ================================================================== */
/*  Initial bearing                                                    */
/* ================================================================== */

/**
 * Compute the initial (forward) bearing from point A to point B.
 *
 * θ = atan2(sin Δλ · cos φ₂, cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ)
 *
 * @returns Bearing in degrees, normalised to 0–360.
 */
export function initialBearing(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/* ================================================================== */
/*  Midpoint between two points                                        */
/* ================================================================== */

/**
 * Compute the midpoint along the great-circle path between two points.
 */
export function midpoint(a: LngLat, b: LngLat): LngLat {
  const lat1 = toRad(a[1]);
  const lng1 = toRad(a[0]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);

  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by),
  );
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);

  return [((lng3 * 180) / Math.PI + 540) % 360 - 180, (lat3 * 180) / Math.PI];
}

/* ================================================================== */
/*  Unit conversion                                                    */
/* ================================================================== */

/** Format a distance value with a unit label. */
export function formatDistance(metres: number, system: UnitSystem): string {
  if (system === "imperial") {
    const feet = metres * 3.28084;
    if (feet < 5280) return `${feet.toFixed(0)} ft`;
    return `${(feet / 5280).toFixed(3)} mi`;
  }
  if (metres < 1000) return `${metres.toFixed(1)} m`;
  return `${(metres / 1000).toFixed(3)} km`;
}

/** Format an area value with a unit label. */
export function formatArea(sqMetres: number, system: UnitSystem): string {
  if (system === "imperial") {
    const acres = sqMetres / 4046.8564224;
    if (acres < 1) return `${(sqMetres * 10.7639).toFixed(0)} ft²`;
    return `${acres.toFixed(3)} acres`;
  }
  if (sqMetres < 10000) return `${sqMetres.toFixed(1)} m²`;
  if (sqMetres < 1_000_000) return `${(sqMetres / 10000).toFixed(3)} ha`;
  return `${(sqMetres / 1_000_000).toFixed(3)} km²`;
}

/** Format a bearing in degrees. */
export function formatBearing(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

/** Return the raw numeric value in the chosen unit system. */
export function convertDistance(metres: number, system: UnitSystem): number {
  if (system === "imperial") {
    const feet = metres * 3.28084;
    return feet < 5280 ? feet : feet / 5280;
  }
  return metres < 1000 ? metres : metres / 1000;
}

/** Return the raw numeric area in the chosen unit system. */
export function convertArea(sqMetres: number, system: UnitSystem): number {
  if (system === "imperial") {
    const acres = sqMetres / 4046.8564224;
    return acres < 1 ? sqMetres * 10.7639 : acres;
  }
  if (sqMetres < 10000) return sqMetres;
  if (sqMetres < 1_000_000) return sqMetres / 10000;
  return sqMetres / 1_000_000;
}
