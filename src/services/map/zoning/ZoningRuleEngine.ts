/**
 * ZoningRuleEngine — block/parcel model with CRS-gated metric computation.
 *
 * Core rule: ALL area/FAR/coverage work requires a projected CRS.
 * Geographic CRS (EPSG:4326, WGS84) is blocked via CrsPreflight.
 */
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";
import type { CrsPreflightResult } from "@/services/map/contracts/gisContracts";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";

/* ------------------------------------------------------------------ */
/*  Domain types                                                        */
/* ------------------------------------------------------------------ */

export interface ZoningRule {
  id: string;
  name: string;
  /** Zone code, e.g. "R2", "C1", "MX". */
  zoneCode: string;
  /** Maximum floor area ratio (total floor area / parcel area). */
  maxFAR: number;
  /** Maximum building coverage ratio (footprint area / parcel area), 0–1. */
  maxCoverageRatio: number;
  /** Maximum building height in metres. */
  maxHeightMetres: number;
  /** Minimum setback from parcel boundary in metres. */
  minSetbackMetres: number;
  /** Minimum parcel area in m² for this zone to apply. */
  minParcelAreaM2: number;
  notes?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export type ZoningRuleInput = Omit<ZoningRule, "id" | "createdAt" | "updatedAt">;

/** Computed metrics for a single parcel. */
export interface ParcelMetrics {
  parcelId: string | number;
  parcelAreaM2: number;
  /** Sum of footprint areas of buildings within (or assigned to) this parcel. */
  buildingFootprintAreaM2: number;
  /** Sum of total floor areas (footprint × floors) of buildings. */
  totalFloorAreaM2: number;
  /** Existing FAR = totalFloorAreaM2 / parcelAreaM2. Null when CRS blocked. */
  existingFAR: number | null;
  /** Existing coverage = buildingFootprintAreaM2 / parcelAreaM2. Null when CRS blocked. */
  existingCoverage: number | null;
  /** Max allowable floor area under the assigned rule. Null when no rule or CRS blocked. */
  capacityMaxFloorAreaM2: number | null;
  /** Max allowable coverage area under the assigned rule. Null when no rule or CRS blocked. */
  capacityMaxBuildingAreaM2: number | null;
  /** Whether existing FAR exceeds the rule maximum. */
  farExceeded: boolean;
  /** Whether existing coverage exceeds the rule maximum. */
  coverageExceeded: boolean;
  /** CRS preflight result for this computation. */
  crsResult: CrsPreflightResult;
  caveats: string[];
}

/** A rule assignment binding a rule to a parcel or block feature. */
export interface ZoningAssignment {
  id: string;
  parcelFeatureId: string | number;
  ruleId: string;
  assignedAt: string;
  metrics: ParcelMetrics | null;
}

/* ------------------------------------------------------------------ */
/*  Polygon area — shoelace formula (projected CRS coordinates)         */
/* ------------------------------------------------------------------ */

/**
 * Compute the area of a GeoJSON Polygon ring using the shoelace formula.
 * Coordinates MUST be in a projected CRS (metres) — geographic degrees give
 * meaningless results and are blocked upstream by CrsPreflight.
 */
export function shoelaceRingArea(ring: Position[]): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % n]!;
    area += (x1 * y2) - (x2 * y1);
  }
  return Math.abs(area) / 2;
}

export function polygonAreaM2(feature: Feature<Polygon | MultiPolygon>): number {
  if (feature.geometry.type === "Polygon") {
    const outerRing = feature.geometry.coordinates[0];
    if (!outerRing) return 0;
    return shoelaceRingArea(outerRing);
  }
  // MultiPolygon: sum outer rings
  let total = 0;
  for (const poly of feature.geometry.coordinates) {
    const outerRing = poly[0];
    if (outerRing) total += shoelaceRingArea(outerRing);
  }
  return total;
}

/* ------------------------------------------------------------------ */
/*  CRS preflight operation definition for metric work                  */
/* ------------------------------------------------------------------ */

const ZONING_METRIC_OP = {
  id: "zoning-metrics",
  label: "Zoning metric computation (FAR/coverage/area)",
  metric: "area" as const,
  executionKind: "planar" as const,
};

/* ------------------------------------------------------------------ */
/*  Core computation                                                    */
/* ------------------------------------------------------------------ */

export interface ComputeParcelMetricsInput {
  parcel: Feature<Polygon | MultiPolygon>;
  /** Optional: buildings whose footprints lie within (or are assigned to) this parcel. */
  buildings: Feature<Polygon | MultiPolygon>[];
  /** Floors per building (parallel array; default 1 per building if absent). */
  buildingFloors?: number[];
  /** Declared CRS of the parcel data, e.g. "EPSG:32635". */
  declaredCrs: string | null;
  rule?: ZoningRule | null;
}

/**
 * Compute FAR, coverage, and capacity for a parcel.
 * Returns a blocked CrsPreflightResult and null metrics if the CRS is
 * geographic or unknown — never silently computes in EPSG:4326.
 */
export function computeParcelMetrics(input: ComputeParcelMetricsInput): ParcelMetrics {
  const { parcel, buildings, buildingFloors, declaredCrs, rule } = input;
  const parcelId = parcel.id ?? parcel.properties?.id ?? "unknown";

  const crsResult = CrsPreflight.preflight(
    ZONING_METRIC_OP,
    [{ id: String(parcelId), crs: declaredCrs }],
  );

  const caveats: string[] = [...crsResult.caveats];

  if (crsResult.blocked) {
    caveats.unshift(
      crsResult.reason ??
        "Zoning metrics require a projected CRS — declare or reproject the parcel layer.",
    );
    return {
      parcelId,
      parcelAreaM2: 0,
      buildingFootprintAreaM2: 0,
      totalFloorAreaM2: 0,
      existingFAR: null,
      existingCoverage: null,
      capacityMaxFloorAreaM2: null,
      capacityMaxBuildingAreaM2: null,
      farExceeded: false,
      coverageExceeded: false,
      crsResult,
      caveats,
    };
  }

  const parcelAreaM2 = polygonAreaM2(parcel);
  let buildingFootprintAreaM2 = 0;
  let totalFloorAreaM2 = 0;

  for (let i = 0; i < buildings.length; i++) {
    const bldg = buildings[i]!;
    const footprint = polygonAreaM2(bldg);
    const floors = buildingFloors?.[i] ?? (Number(bldg.properties?.floors) || 1);
    buildingFootprintAreaM2 += footprint;
    totalFloorAreaM2 += footprint * floors;
  }

  const existingFAR = parcelAreaM2 > 0 ? totalFloorAreaM2 / parcelAreaM2 : null;
  const existingCoverage = parcelAreaM2 > 0 ? buildingFootprintAreaM2 / parcelAreaM2 : null;

  const capacityMaxFloorAreaM2 = rule && parcelAreaM2 > 0 ? rule.maxFAR * parcelAreaM2 : null;
  const capacityMaxBuildingAreaM2 =
    rule && parcelAreaM2 > 0 ? rule.maxCoverageRatio * parcelAreaM2 : null;

  const farExceeded =
    rule !== null && rule !== undefined && existingFAR !== null ? existingFAR > rule.maxFAR : false;
  const coverageExceeded =
    rule !== null && rule !== undefined && existingCoverage !== null
      ? existingCoverage > rule.maxCoverageRatio
      : false;

  if (farExceeded) {
    caveats.push(
      `Existing FAR (${existingFAR?.toFixed(2)}) exceeds the maximum allowed (${rule!.maxFAR}) for zone ${rule!.zoneCode}.`,
    );
  }
  if (coverageExceeded) {
    caveats.push(
      `Existing coverage (${((existingCoverage ?? 0) * 100).toFixed(1)}%) exceeds the maximum allowed (${(rule!.maxCoverageRatio * 100).toFixed(0)}%) for zone ${rule!.zoneCode}.`,
    );
  }

  return {
    parcelId,
    parcelAreaM2,
    buildingFootprintAreaM2,
    totalFloorAreaM2,
    existingFAR,
    existingCoverage,
    capacityMaxFloorAreaM2,
    capacityMaxBuildingAreaM2,
    farExceeded,
    coverageExceeded,
    crsResult,
    caveats,
  };
}

/**
 * Compute metrics for all parcels in a FeatureCollection.
 * Every parcel uses the same declared CRS and rule table.
 */
export function computeParcelMetricsBatch(
  parcels: FeatureCollection<Polygon | MultiPolygon>,
  declaredCrs: string | null,
  assignments: Map<string | number, ZoningRule>,
  buildingsByParcel?: Map<string | number, Feature<Polygon | MultiPolygon>[]>,
): ParcelMetrics[] {
  return parcels.features.map((parcel) => {
    const parcelId = parcel.id ?? parcel.properties?.id ?? "unknown";
    const rule = assignments.get(String(parcelId)) ?? assignments.get(parcelId) ?? null;
    const buildings = buildingsByParcel?.get(String(parcelId)) ?? [];
    return computeParcelMetrics({ parcel, buildings, declaredCrs, rule });
  });
}

/* ------------------------------------------------------------------ */
/*  ZoningRule factory                                                  */
/* ------------------------------------------------------------------ */

let _ruleCounter = 0;

export function createZoningRule(input: ZoningRuleInput): ZoningRule {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `rule-${++_ruleCounter}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}

/** Reset counter (test helper only). */
export function _resetRuleCounter(): void {
  _ruleCounter = 0;
}

/* ------------------------------------------------------------------ */
/*  ZoningAssignment factory                                            */
/* ------------------------------------------------------------------ */

let _assignCounter = 0;

export function createZoningAssignment(
  parcelFeatureId: string | number,
  ruleId: string,
  metrics: ParcelMetrics | null = null,
): ZoningAssignment {
  return {
    id: `assign-${++_assignCounter}-${Date.now()}`,
    parcelFeatureId,
    ruleId,
    assignedAt: new Date().toISOString(),
    metrics,
  };
}

/** Reset counter (test helper only). */
export function _resetAssignCounter(): void {
  _assignCounter = 0;
}

/* ------------------------------------------------------------------ */
/*  Namespace export                                                    */
/* ------------------------------------------------------------------ */

export const ZoningRuleEngine = {
  computeParcelMetrics,
  computeParcelMetricsBatch,
  createZoningRule,
  createZoningAssignment,
  polygonAreaM2,
  shoelaceRingArea,
} as const;
