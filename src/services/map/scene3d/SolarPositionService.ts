/**
 * SolarPositionService — deterministic sun position computation.
 *
 * Uses a simplified declination + hour-angle formula (no SPA tables).
 * Accuracy: ±1–2° altitude/azimuth — sufficient for shadow analysis demo mode.
 *
 * NEVER use for navigation or safety-critical applications.
 * Runtime mode: demo (not production raycast).
 */

/* ------------------------------------------------------------------ */
/*  Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface SolarPosition {
  /** Degrees above horizon. Negative → sun below horizon. */
  altitudeDeg: number;
  /** Degrees clockwise from true North. */
  azimuthDeg: number;
  /** 90 − altitudeDeg */
  zenithDeg: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Returns the day of year (1-based). */
function getDayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(diff / 86_400_000);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute solar altitude + azimuth for a geographic location and UTC datetime.
 *
 * Algorithm: simplified declination / hour-angle method.
 *   - Declination: δ = 23.45° × sin((360/365)(dayOfYear − 81) × π/180)
 *   - Solar hour: h = UTCHour + UTCMin/60 + lon/15
 *   - Hour angle: H = (h − 12) × 15°
 *   - sin(alt) = sin(lat)sin(δ) + cos(lat)cos(δ)cos(H)
 *   - Azimuth resolved from cosine formula, adjusted for afternoon/AM
 *
 * @param lat       Latitude in degrees (−90 to 90)
 * @param lon       Longitude in degrees (−180 to 180)
 * @param isoDateTime  ISO 8601 date-time string (treated as UTC)
 * @returns SolarPosition with altitudeDeg, azimuthDeg, zenithDeg
 */
export function computeSolarPosition(
  lat: number,
  lon: number,
  isoDateTime: string,
): SolarPosition {
  const d = new Date(isoDateTime);

  const dayOfYear = getDayOfYear(d);

  // Solar hour accounts for longitude offset (15° per hour)
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + lon / 15;

  // Solar declination (degrees)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));

  // Hour angle (degrees) — negative in morning, positive in afternoon
  const hourAngle = (hour - 12) * 15;

  const latRad = lat * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const haRad = hourAngle * (Math.PI / 180);

  // Altitude
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const clampedSinAlt = Math.max(-1, Math.min(1, sinAlt));
  const altitudeDeg = Math.asin(clampedSinAlt) * (180 / Math.PI);

  // Azimuth — cosine formula, adjusted for AM/PM
  const cosAltRad = Math.cos(Math.asin(clampedSinAlt));
  let azimuthDeg: number;
  if (cosAltRad < 1e-10) {
    // Sun at zenith — azimuth undefined; return 180° (south) as convention
    azimuthDeg = 180;
  } else {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * clampedSinAlt) / (Math.cos(latRad) * cosAltRad);
    const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
    const azRaw = Math.acos(clampedCosAz) * (180 / Math.PI);
    // In afternoon (hourAngle > 0), azimuth is west of south → > 180°
    azimuthDeg = hourAngle > 0 ? 360 - azRaw : azRaw;
  }

  return {
    altitudeDeg,
    azimuthDeg,
    zenithDeg: 90 - altitudeDeg,
  };
}
