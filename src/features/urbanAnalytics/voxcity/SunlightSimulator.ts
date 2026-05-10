/**
 * SunlightSimulator — Deterministic sun-position and shadow-casting engine.
 *
 * Computes solar altitude and azimuth using standard astronomical equations,
 * then projects axis-aligned building shadows onto a uniform analysis grid.
 * Provides cumulative shadow-hours and solar-exposure-hours per cell, plus
 * per-building summary statistics.
 *
 * Coordinate conventions:
 *   X → East, Y → North, Z → up (right-hand rule).
 *   Azimuth is measured clockwise from North.
 */

import type {
  BuildingExposureSummary,
  BuildingVolume,
  GeoLocation,
  ShadowSample,
  SunlightConfig,
  SunlightResult,
  SunPosition,
} from "./sunlightTypes";

/* ================================================================== */
/*  §1  Astronomical helpers                                          */
/* ================================================================== */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Convert a Date to Julian Day Number (JD).
 * Uses the standard conversion from calendar date to JD.
 */
export function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

/**
 * Compute solar declination and equation of time for a given Julian Day.
 * Simplified formula based on Jean Meeus "Astronomical Algorithms".
 */
export function solarDeclination(jd: number): {
  declination: number;
  eqTime: number;
} {
  const n = jd - 2451545.0; // days since J2000.0
  const L = (280.46 + 0.9856474 * n) % 360; // mean longitude
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG; // mean anomaly, radians
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG; // ecliptic longitude
  const epsilon = 23.439 * DEG - 0.0000004 * n * DEG; // obliquity
  const sinDecl = Math.sin(epsilon) * Math.sin(lambda);
  const declination = Math.asin(sinDecl) * RAD;

  // Equation of time (minutes)
  const y = Math.tan(epsilon / 2) ** 2;
  const Lrad = L * DEG;
  const eqTime =
    4 *
    RAD *
    (y * Math.sin(2 * Lrad) -
      2 * 0.01671 * Math.sin(g) +
      4 * 0.01671 * y * Math.sin(g) * Math.cos(2 * Lrad) -
      0.5 * y * y * Math.sin(4 * Lrad) -
      1.25 * 0.01671 * 0.01671 * Math.sin(2 * g));

  return { declination, eqTime };
}

/**
 * Compute sun altitude and azimuth given location, date/time, and UTC offset.
 * Returns SunPosition with altitude (degrees above horizon) and azimuth
 * (degrees clockwise from north).
 */
export function sunPosition(
  location: GeoLocation,
  timestamp: number,
  utcOffset: number,
): SunPosition {
  const date = new Date(timestamp);
  const jd = julianDay(date);
  const { declination, eqTime } = solarDeclination(jd);

  // True solar time
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const localMinutes = utcMinutes + utcOffset * 60;
  const trueSolarTime = localMinutes + eqTime + 4 * location.longitude - 60 * utcOffset;
  const hourAngle = (trueSolarTime / 4 - 180) * DEG;

  const latRad = location.latitude * DEG;
  const declRad = declination * DEG;

  // Altitude
  const sinAlt =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;

  // Azimuth
  let cosAz =
    (Math.sin(declRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(altitude * DEG));
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let azimuth = Math.acos(cosAz) * RAD;
  if (hourAngle > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth, timestamp };
}

/* ================================================================== */
/*  §2  Time-step generation                                          */
/* ================================================================== */

/**
 * Generate timestamps (UTC milliseconds) for all simulation intervals.
 * Deterministic: identical inputs always yield identical output.
 */
export function generateTimestamps(config: SunlightConfig): number[] {
  const timestamps: number[] = [];
  const start = new Date(`${config.startDate}T00:00:00Z`);
  const end = new Date(`${config.endDate}T00:00:00Z`);

  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getTime() + 86_400_000)
  ) {
    const dayBase = new Date(d);
    for (let h = config.startHour; h <= config.endHour; ) {
      const hr = Math.floor(h);
      const min = Math.round((h - hr) * 60);
      const ts = new Date(dayBase);
      // Convert local hour to UTC
      ts.setUTCHours(hr - config.utcOffset, min, 0, 0);
      timestamps.push(ts.getTime());
      h += config.intervalMinutes / 60;
    }
  }
  return timestamps;
}

/* ================================================================== */
/*  §3  Shadow projection                                             */
/* ================================================================== */

/**
 * Project a single building shadow onto the analysis grid for a given
 * sun position.  Uses simple axis-aligned shadow geometry.
 *
 * A building casts a shadow in the direction opposite to the sun.
 * The shadow length on the ground is:  height / tan(altitude).
 * The shadow direction is azimuth + 180°.
 */
export function projectShadow(
  sun: SunPosition,
  building: BuildingVolume,
  gridOrigin: readonly [number, number],
  gridSize: readonly [number, number],
  gridResolution: number,
  grid: Uint8Array,
): void {
  if (sun.altitude <= 0) return; // sun below horizon — no shadow

  const shadowLen = building.height / Math.tan(sun.altitude * DEG);
  // Shadow direction vector (opposite to sun azimuth)
  const shadowAz = (sun.azimuth + 180) % 360;
  const dx = Math.sin(shadowAz * DEG) * shadowLen;
  const dy = Math.cos(shadowAz * DEG) * shadowLen;

  const [minX, minY, maxX, maxY] = building.bbox;
  const [cols, rows] = gridSize;
  const [ox, oy] = gridOrigin;

  // Shadow polygon = building footprint + offset footprint → bounding box
  const allXs = [minX, maxX, minX + dx, maxX + dx];
  const allYs = [minY, maxY, minY + dy, maxY + dy];
  const sMinX = Math.min(...allXs);
  const sMaxX = Math.max(...allXs);
  const sMinY = Math.min(...allYs);
  const sMaxY = Math.max(...allYs);

  // Convert to grid indices
  const c0 = Math.max(0, Math.floor((sMinX - ox) / gridResolution));
  const c1 = Math.min(cols - 1, Math.floor((sMaxX - ox) / gridResolution));
  const r0 = Math.max(0, Math.floor((sMinY - oy) / gridResolution));
  const r1 = Math.min(rows - 1, Math.floor((sMaxY - oy) / gridResolution));

  // For each cell in the shadow bounding box, test if the cell center
  // lies within the shadow quadrilateral.
  for (let r = r0; r <= r1; r++) {
    const cellY = oy + (r + 0.5) * gridResolution;
    for (let c = c0; c <= c1; c++) {
      const cellX = ox + (c + 0.5) * gridResolution;
      if (
        isInsideShadowQuad(
          cellX,
          cellY,
          minX,
          minY,
          maxX,
          maxY,
          dx,
          dy,
        )
      ) {
        const idx = r * cols + c;
        if (grid[idx] < 255) grid[idx]++;
      }
    }
  }
}

/**
 * Point-in-quadrilateral test for the shadow polygon.
 * The shadow quad is formed by the building footprint corners and their
 * offset by (dx, dy).  We decompose into two triangles and test each.
 */
function isInsideShadowQuad(
  px: number,
  py: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  dx: number,
  dy: number,
): boolean {
  // Four corners of the shadow quad:
  // A = (minX, minY), B = (maxX, minY),
  // C = (maxX + dx, maxY + dy), D = (minX + dx, maxY + dy)
  // But we need to handle the building footprint + projected footprint correctly.
  // The shadow is a hexagon formed by the union of the building rect and the projected rect.
  // For simplicity with axis-aligned boxes, we use the convex hull approach:
  // shadow = convex hull of {(minX,minY), (maxX,minY), (maxX,maxY), (minX,maxY),
  //                          (minX+dx,minY+dy), (maxX+dx,minY+dy), (maxX+dx,maxY+dy), (minX+dx,maxY+dy)}
  //
  // For a fast conservative test, we use the bounding-box approach (caller already filtered)
  // combined with checking if the point is inside at least one of the two rectangles
  // or the connecting parallelogram.

  // Check if inside the building footprint
  if (px >= minX && px <= maxX && py >= minY && py <= maxY) return true;

  // Check if inside the projected footprint
  if (
    px >= minX + dx &&
    px <= maxX + dx &&
    py >= minY + dy &&
    py <= maxY + dy
  )
    return true;

  // Check if inside the connecting parallelogram using the cross-product method.
  // The connecting parallelogram has 4 vertices depending on shadow direction.
  // We approximate by testing the center point's position relative to the swept area.
  // If the direction from (minX+maxX)/2, (minY+maxY)/2 to the point, projected
  // onto the shadow direction, falls within [0, shadowLen], and the perpendicular
  // distance is within the building extent — it's a hit.
  const bCx = (minX + maxX) / 2;
  const bCy = (minY + maxY) / 2;
  const relX = px - bCx;
  const relY = py - bCy;

  const sLen = Math.sqrt(dx * dx + dy * dy);
  if (sLen < 1e-9) return false;
  const sdx = dx / sLen;
  const sdy = dy / sLen;

  // Project onto shadow direction
  const along = relX * sdx + relY * sdy;
  if (along < -sLen * 0.1 || along > sLen * 1.1) return false;

  // Perpendicular distance
  const perp = Math.abs(relX * sdy - relY * sdx);
  const halfW = (maxX - minX) / 2;
  const halfH = (maxY - minY) / 2;
  const maxPerp = Math.max(halfW, halfH) * 1.2;

  return perp <= maxPerp;
}

/* ================================================================== */
/*  §4  Main simulation runner                                        */
/* ================================================================== */

/**
 * Run a complete sunlight simulation.
 *
 * @param config   Temporal parameters (dates, hours, interval)
 * @param buildings  Array of building volumes to cast shadows
 * @param gridResolution  Size of each analysis cell in metres (default 2)
 * @param onProgress  Optional callback (fraction 0–1) for UI progress bars
 * @returns SunlightResult with shadow grids, cumulative hours, and stats
 */
export function runSimulation(
  config: SunlightConfig,
  buildings: readonly BuildingVolume[],
  gridResolution = 2,
  onProgress?: (fraction: number) => void,
): SunlightResult {
  // 1. Compute analysis grid bounds from building extents
  const { origin, size } = computeGridBounds(buildings, gridResolution);
  const [cols, rows] = size;
  const totalCells = cols * rows;

  // 2. Generate timestamps
  const timestamps = generateTimestamps(config);
  const sampleCount = timestamps.length;
  const intervalHours = config.intervalMinutes / 60;

  // 3. Allocate cumulative arrays
  const shadowCounts = new Float32Array(totalCells); // accumulates shadow-count per cell
  const samples: ShadowSample[] = [];
  const buildingCastCells = new Map<string, number>();
  for (const b of buildings) buildingCastCells.set(b.id, 0);

  let daylightSamples = 0;

  // 4. Iterate over all timestamps
  for (let i = 0; i < sampleCount; i++) {
    const sun = sunPosition(config.location, timestamps[i], config.utcOffset);

    if (sun.altitude <= 0) {
      // Sun below horizon — skip but still record sample
      samples.push({ sun, shadowGrid: new Uint8Array(totalCells) });
      onProgress?.((i + 1) / sampleCount);
      continue;
    }

    daylightSamples++;
    const shadowGrid = new Uint8Array(totalCells);

    for (const b of buildings) {
      const preShadow = shadowGrid.slice();
      projectShadow(sun, b, origin, size, gridResolution, shadowGrid);
      // Count new cells this building shadowed
      let newCells = 0;
      for (let j = 0; j < totalCells; j++) {
        if (shadowGrid[j] > preShadow[j]) newCells++;
      }
      buildingCastCells.set(
        b.id,
        (buildingCastCells.get(b.id) ?? 0) + newCells,
      );
    }

    // Accumulate: each shadowed cell gets +1 toward shadow count
    for (let j = 0; j < totalCells; j++) {
      if (shadowGrid[j] > 0) shadowCounts[j]++;
    }

    samples.push({ sun, shadowGrid });
    onProgress?.((i + 1) / sampleCount);
  }

  // 5. Convert counts to hours
  const shadowHours = new Float32Array(totalCells);
  const exposureHours = new Float32Array(totalCells);
  const totalDaylightHours = daylightSamples * intervalHours;

  let sumExposure = 0;
  let minExposure = Infinity;
  let maxExposure = -Infinity;

  for (let j = 0; j < totalCells; j++) {
    shadowHours[j] = shadowCounts[j] * intervalHours;
    exposureHours[j] = totalDaylightHours - shadowHours[j];
    if (exposureHours[j] < minExposure) minExposure = exposureHours[j];
    if (exposureHours[j] > maxExposure) maxExposure = exposureHours[j];
    sumExposure += exposureHours[j];
  }

  const meanExposure = totalCells > 0 ? sumExposure / totalCells : 0;

  // Convert building cast cells to hours
  const buildingCastHours = new Map<string, number>();
  for (const [id, count] of buildingCastCells) {
    buildingCastHours.set(id, count * intervalHours);
  }

  return {
    id: `sunlight-${Date.now()}`,
    config,
    buildings,
    gridResolution,
    gridSize: size,
    gridOrigin: origin,
    samples,
    shadowHours,
    exposureHours,
    buildingCastHours,
    sampleCount,
    totalDaylightHours,
    stats: {
      minExposure: minExposure === Infinity ? 0 : minExposure,
      maxExposure: maxExposure === -Infinity ? 0 : maxExposure,
      meanExposure,
    },
  };
}

/* ================================================================== */
/*  §5  Per-building exposure summary                                 */
/* ================================================================== */

/**
 * Compute solar exposure summary for each building, based on the
 * ground cells that overlap each building's footprint.
 */
export function buildingExposureSummary(
  result: SunlightResult,
): readonly BuildingExposureSummary[] {
  const [cols] = result.gridSize;
  const [ox, oy] = result.gridOrigin;
  const res = result.gridResolution;

  return result.buildings.map((b) => {
    const [minX, minY, maxX, maxY] = b.bbox;
    const c0 = Math.max(0, Math.floor((minX - ox) / res));
    const c1 = Math.min(result.gridSize[0] - 1, Math.floor((maxX - ox) / res));
    const r0 = Math.max(0, Math.floor((minY - oy) / res));
    const r1 = Math.min(result.gridSize[1] - 1, Math.floor((maxY - oy) / res));

    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let count = 0;
    let sunlit = 0;

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const val = result.exposureHours[r * cols + c];
        sum += val;
        if (val < min) min = val;
        if (val > max) max = val;
        count++;
        if (val > 0) sunlit++;
      }
    }

    return {
      buildingId: b.id,
      label: b.label,
      avgExposureHours: count > 0 ? sum / count : 0,
      minExposureHours: min === Infinity ? 0 : min,
      maxExposureHours: max === -Infinity ? 0 : max,
      sunlitFraction: count > 0 ? sunlit / count : 0,
    };
  });
}

/* ================================================================== */
/*  §6  Grid bounds helper                                            */
/* ================================================================== */

/**
 * Compute origin and dimensions of the analysis grid from building extents,
 * adding a buffer around the buildings to capture cast shadows.
 */
function computeGridBounds(
  buildings: readonly BuildingVolume[],
  gridResolution: number,
): { origin: readonly [number, number]; size: readonly [number, number] } {
  if (buildings.length === 0) {
    return { origin: [0, 0] as const, size: [1, 1] as const };
  }

  let gMinX = Infinity;
  let gMinY = Infinity;
  let gMaxX = -Infinity;
  let gMaxY = -Infinity;
  let maxH = 0;

  for (const b of buildings) {
    const [bx0, by0, bx1, by1] = b.bbox;
    if (bx0 < gMinX) gMinX = bx0;
    if (by0 < gMinY) gMinY = by0;
    if (bx1 > gMaxX) gMaxX = bx1;
    if (by1 > gMaxY) gMaxY = by1;
    if (b.height > maxH) maxH = b.height;
  }

  // Buffer = max building height (longest possible shadow at low sun angle ≈ 10° altitude)
  const buffer = Math.max(maxH * 5.67, 50); // tan(10°) ≈ 0.176, so 1/tan(10°) ≈ 5.67
  gMinX -= buffer;
  gMinY -= buffer;
  gMaxX += buffer;
  gMaxY += buffer;

  const cols = Math.max(1, Math.ceil((gMaxX - gMinX) / gridResolution));
  const rows = Math.max(1, Math.ceil((gMaxY - gMinY) / gridResolution));

  return {
    origin: [gMinX, gMinY] as const,
    size: [cols, rows] as const,
  };
}

/* ================================================================== */
/*  §7  Export helpers                                                 */
/* ================================================================== */

/**
 * Export shadow hours grid as CSV rows (x, y, shadow_hours, exposure_hours).
 */
export function exportGridCSV(result: SunlightResult): string {
  const [cols, rows] = result.gridSize;
  const [ox, oy] = result.gridOrigin;
  const res = result.gridResolution;
  const lines = ["x,y,shadow_hours,exposure_hours"];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = (ox + (c + 0.5) * res).toFixed(2);
      const y = (oy + (r + 0.5) * res).toFixed(2);
      lines.push(`${x},${y},${result.shadowHours[idx].toFixed(3)},${result.exposureHours[idx].toFixed(3)}`);
    }
  }
  return lines.join("\n");
}

/**
 * Export per-building exposure summary as JSON.
 */
export function exportBuildingJSON(summaries: readonly BuildingExposureSummary[]): string {
  return JSON.stringify(summaries, null, 2);
}
