/**
 * MassingEngine — generate building massing alternatives under FAR/height/coverage constraints.
 *
 * Deterministic: same params + CRS → same output. No randomness.
 *
 * Algorithm:
 *  1. CRS-gate via computeZoningEnvelope.
 *  2. Clamp coverageRatio to rule.maxCoverageRatio.
 *  3. Compute per-building footprint = buildableAreaM2 * clampedCoverage / buildingCount.
 *  4. Place buildingCount equal rectangular strips within the envelope bbox.
 *  5. Validate FAR, coverage, and height compliance.
 */
import type { Feature, Polygon, Position } from "geojson";
import {
  computeZoningEnvelope,
  type ZoningEnvelopeResult,
} from "./ZoningEnvelopeEngine";
import { shoelaceRingArea, type ZoningRule } from "./ZoningRuleEngine";

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */

export interface MassingParams {
  parcelId: string | number;
  buildingCount: number;
  floorCount: number;
  coverageRatio: number; // footprint coverage ratio (0–1)
}

export interface MassingAlternative {
  id: string;
  scenarioLabel: string;
  params: MassingParams;
  envelopeResult: ZoningEnvelopeResult;
  buildingFootprintAreaM2: number;
  totalFloorAreaM2: number;
  achievedFAR: number;
  achievedCoverage: number;
  maxHeightMetres: number;
  farCompliant: boolean;
  coverageCompliant: boolean;
  heightCompliant: boolean;
  compliant: boolean;
  caveats: string[];
  buildingGeometries: Feature<Polygon>[];
}

/* ------------------------------------------------------------------ */
/*  Deterministic ID hash                                               */
/* ------------------------------------------------------------------ */

/**
 * Deterministic stable ID based on parcelId + params.
 * Uses a djb2-style hash; no randomness.
 */
function deterministicId(parcelId: string | number, params: MassingParams): string {
  const raw = `${String(parcelId)}|${params.buildingCount}|${params.floorCount}|${params.coverageRatio.toFixed(6)}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return `massing-${String(parcelId)}-${hash.toString(16)}`;
}

/* ------------------------------------------------------------------ */
/*  Envelope bbox helpers                                               */
/* ------------------------------------------------------------------ */

interface BBox2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

function ringBBox(ring: Position[]): BBox2D {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Place `n` equal rectangular strips within the envelope bbox.
 * Strips are laid out along the longer axis of the bbox.
 * Each strip's rectangle is a fixed fraction of the strip area.
 *
 * buildingFootprintAreaM2 = total footprint target / n  (per building).
 * The strip is subdivided evenly along the longer axis,
 * and the building height (shorter axis) is computed from the footprint.
 *
 * Returns Feature<Polygon> for each building (CCW, closed).
 */
function placeBuildings(
  envelopeGeometry: Feature<Polygon>,
  n: number,
  perBuildingFootprintAreaM2: number,
): Feature<Polygon>[] {
  if (n <= 0 || perBuildingFootprintAreaM2 <= 0) return [];

  const outerRing = envelopeGeometry.geometry.coordinates[0];
  if (!outerRing || outerRing.length < 4) return [];

  const bbox = ringBBox(outerRing);
  if (bbox.width <= 0 || bbox.height <= 0) return [];

  // Lay strips along the longer axis
  const alongX = bbox.width >= bbox.height;
  const stripLength = alongX ? bbox.width / n : bbox.width;
  const stripWidth = alongX ? bbox.height : bbox.height / n;

  // Building dimensions within the strip
  // footprint = buildingWidth * buildingDepth = perBuildingFootprintAreaM2
  // We keep depth = stripWidth * 0.8 and compute width
  const buildingDepth = Math.min(stripWidth * 0.8, Math.sqrt(perBuildingFootprintAreaM2));
  const buildingWidth = perBuildingFootprintAreaM2 / (buildingDepth > 0 ? buildingDepth : 1);

  const buildings: Feature<Polygon>[] = [];

  for (let i = 0; i < n; i++) {
    let x0: number;
    let y0: number;

    if (alongX) {
      // Strip i occupies [bbox.minX + i*stripLength, bbox.minX + (i+1)*stripLength]
      const stripMinX = bbox.minX + i * stripLength;
      const centerX = stripMinX + stripLength / 2;
      const centerY = bbox.minY + bbox.height / 2;
      x0 = centerX - buildingWidth / 2;
      y0 = centerY - buildingDepth / 2;
    } else {
      // Strips stacked along Y
      const stripMinY = bbox.minY + i * stripWidth;
      const centerX = bbox.minX + bbox.width / 2;
      const centerY = stripMinY + stripWidth / 2;
      x0 = centerX - buildingWidth / 2;
      y0 = centerY - buildingDepth / 2;
    }

    const x1 = x0 + buildingWidth;
    const y1 = y0 + buildingDepth;

    // CCW winding, closed ring
    const ring: Position[] = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, y0],
    ];

    buildings.push({
      type: "Feature",
      id: `building-${i}`,
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
      properties: {
        buildingIndex: i,
        footprintAreaM2: shoelaceRingArea(ring.slice(0, -1)),
      },
    });
  }

  return buildings;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Generate a single massing alternative for a parcel under a zoning rule.
 *
 * Deterministic: same (parcel, rule, params, declaredCrs) → same output.
 */
export function generateMassingAlternative(
  parcel: Feature<Polygon>,
  rule: ZoningRule,
  params: MassingParams,
  declaredCrs: string | null,
): MassingAlternative {
  const id = deterministicId(params.parcelId, params);
  const caveats: string[] = [];

  // CRS-gate via ZoningEnvelopeEngine
  const envelopeResult = computeZoningEnvelope({ parcel, rule, declaredCrs });

  if (envelopeResult.crsResult.blocked || envelopeResult.collapsed || !envelopeResult.envelopeGeometry) {
    caveats.push(
      ...envelopeResult.caveats,
    );
    if (envelopeResult.crsResult.blocked) {
      caveats.push("Massing blocked: CRS is geographic. Reproject to a projected CRS.");
    }
    return {
      id,
      scenarioLabel: `Blocked (${params.floorCount} floors, ${(params.coverageRatio * 100).toFixed(0)}% coverage)`,
      params,
      envelopeResult,
      buildingFootprintAreaM2: 0,
      totalFloorAreaM2: 0,
      achievedFAR: 0,
      achievedCoverage: 0,
      maxHeightMetres: 0,
      farCompliant: false,
      coverageCompliant: false,
      heightCompliant: false,
      compliant: false,
      caveats,
      buildingGeometries: [],
    };
  }

  const { buildableAreaM2, parcelAreaM2 } = envelopeResult;

  // Clamp coverageRatio to rule.maxCoverageRatio
  const clampedCoverage = Math.min(
    Math.max(params.coverageRatio, 0),
    rule.maxCoverageRatio,
  );
  if (clampedCoverage < params.coverageRatio) {
    caveats.push(
      `coverageRatio clamped from ${params.coverageRatio.toFixed(2)} to rule max ${rule.maxCoverageRatio.toFixed(2)}.`,
    );
  }

  // Validate buildingCount
  const buildingCount = Math.max(1, Math.floor(params.buildingCount));
  if (buildingCount !== params.buildingCount) {
    caveats.push(`buildingCount floored to ${buildingCount}.`);
  }

  const floorCount = Math.max(1, Math.floor(params.floorCount));

  // Total footprint from buildable area × coverage ratio
  const totalFootprintAreaM2 = buildableAreaM2 * clampedCoverage;
  const perBuildingFootprintAreaM2 = totalFootprintAreaM2 / buildingCount;

  // Total floor area
  const totalFloorAreaM2 = totalFootprintAreaM2 * floorCount;

  // Achieved metrics (against parcel area, not buildable area, per FAR convention)
  const achievedFAR = parcelAreaM2 > 0 ? totalFloorAreaM2 / parcelAreaM2 : 0;
  const achievedCoverage = parcelAreaM2 > 0 ? totalFootprintAreaM2 / parcelAreaM2 : 0;

  // Floor-to-floor height: assume 3.3 m per floor (standard assumption)
  const FLOOR_HEIGHT_M = 3.3;
  const maxHeightMetres = floorCount * FLOOR_HEIGHT_M;

  // Compliance
  const farCompliant = achievedFAR <= rule.maxFAR;
  const coverageCompliant = achievedCoverage <= rule.maxCoverageRatio;
  const heightCompliant = maxHeightMetres <= rule.maxHeightMetres;
  const compliant = farCompliant && coverageCompliant && heightCompliant;

  if (!farCompliant) {
    caveats.push(
      `Achieved FAR (${achievedFAR.toFixed(2)}) exceeds rule max (${rule.maxFAR}).`,
    );
  }
  if (!coverageCompliant) {
    caveats.push(
      `Achieved coverage (${(achievedCoverage * 100).toFixed(1)}%) exceeds rule max (${(rule.maxCoverageRatio * 100).toFixed(0)}%).`,
    );
  }
  if (!heightCompliant) {
    caveats.push(
      `Estimated height (${maxHeightMetres.toFixed(1)} m) exceeds rule max (${rule.maxHeightMetres} m).`,
    );
  }

  // Place building geometries deterministically
  const buildingGeometries = placeBuildings(
    envelopeResult.envelopeGeometry,
    buildingCount,
    perBuildingFootprintAreaM2,
  );

  const scenarioLabel = `Scenario (${floorCount} floor${floorCount !== 1 ? "s" : ""}, ${(clampedCoverage * 100).toFixed(0)}% coverage, ${buildingCount} bldg${buildingCount !== 1 ? "s" : ""})`;

  return {
    id,
    scenarioLabel,
    params,
    envelopeResult,
    buildingFootprintAreaM2: totalFootprintAreaM2,
    totalFloorAreaM2,
    achievedFAR,
    achievedCoverage,
    maxHeightMetres,
    farCompliant,
    coverageCompliant,
    heightCompliant,
    compliant,
    caveats,
    buildingGeometries,
  };
}

export const MassingEngine = {
  generateMassingAlternative,
} as const;
