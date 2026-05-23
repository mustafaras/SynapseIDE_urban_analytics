import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  CrsExecutionKind,
  CrsPreflightResult,
  CrsRemedy,
} from "@/services/map/contracts/gisContracts";
import {
  isProjected,
  normalizeCrs,
  WGS84_CRS,
  type MapExtent,
} from "./MapProjectionService";
import { planExecutionCrs } from "./ExecutionCrsPlanner";

export type CrsPreflightMetric =
  | "area"
  | "buffer"
  | "distance"
  | "difference"
  | "intersection"
  | "method"
  | "report-scale"
  | "union"
  | "visual";

export interface CrsPreflightOperation {
  id: string;
  label: string;
  metric: CrsPreflightMetric;
  executionKind: CrsExecutionKind;
  displayCrs?: string;
  requiredCrs?: string | null;
  preferEqualArea?: boolean;
}

export interface CrsPreflightLayer {
  id?: string;
  name?: string;
  crs?: string | null | undefined;
}

export function preflight(
  op: CrsPreflightOperation,
  layers: ReadonlyArray<CrsPreflightLayer>,
  aoi?: Feature<Geometry> | FeatureCollection | Geometry | MapExtent | null,
): CrsPreflightResult {
  const displayCrs = normalizeCrs(op.displayCrs ?? WGS84_CRS);
  const requiredCrs = op.requiredCrs ? normalizeCrs(op.requiredCrs) : null;
  const layerCrs = layers.map((layer) => normalizeOptionalCrs(layer.crs));
  const missingLayerCount = layerCrs.filter((crs) => !crs).length;
  const declaredCrs = unique(layerCrs.filter((crs): crs is string => Boolean(crs)));
  const hasLayers = layers.length > 0;
  const hasMissingLayerCrs = hasLayers && missingLayerCount > 0;
  const hasMixedLayerCrs = declaredCrs.length > 1;
  const sourceCrs = !hasLayers
    ? displayCrs
    : hasMissingLayerCrs || hasMixedLayerCrs
      ? null
      : declaredCrs[0] ?? null;
  const plan = planExecutionCrs({
    sourceCrs,
    displayCrs,
    executionKind: op.executionKind,
    ...(Array.isArray(aoi) ? { extent: aoi } : {}),
    ...(!Array.isArray(aoi) && aoi ? { aoi } : {}),
    preferEqualArea: op.preferEqualArea ?? op.metric === "area",
  });

  const requiredCrsConflict = requiredCrs && sourceCrs && sourceCrs !== requiredCrs;
  if (requiredCrs && !sourceCrs) {
    return blockedResult({
      plan,
      reason: `${op.label} requires ${requiredCrs}, but one or more source layers have missing or conflicting CRS metadata. Declare the CRS or reproject before running.`,
      remedy: hasMissingLayerCrs ? "declare-crs" : "reproject",
    });
  }
  if (requiredCrsConflict) {
    return blockedResult({
      plan,
      reason: `${op.label} requires ${requiredCrs}, but the source CRS is ${sourceCrs}. Reproject before running this method.`,
      remedy: "reproject",
    });
  }

  if (op.metric === "visual") {
    return okResult({ plan, caveats: [] });
  }

  if (op.executionKind === "geodesic") {
    const caveats = [
      `${op.label} uses geodesic WGS84 map-display positions; use a projected workflow for legal, engineering, or parcel-accurate metric claims.`,
    ];
    if (hasMissingLayerCrs) {
      caveats.push("One or more source layers have missing CRS metadata; the display measurement is caveated, not authoritative.");
    }
    if (hasMixedLayerCrs) {
      caveats.push("Source layers declare multiple CRS values; the display measurement is caveated, not an analytical reprojection.");
    }
    return okResult({ plan, caveats });
  }

  if (hasMissingLayerCrs) {
    return blockedResult({
      plan,
      reason: `${op.label} needs a projected source CRS for planar metric work, but ${missingLayerCount} source layer${missingLayerCount === 1 ? "" : "s"} lack CRS metadata. Declare the CRS before running.`,
      remedy: "declare-crs",
    });
  }

  if (hasMixedLayerCrs) {
    return blockedResult({
      plan,
      reason: `${op.label} needs one consistent projected CRS, but source layers declare ${declaredCrs.join(", ")}. Reproject to a common CRS before running.`,
      remedy: "reproject",
    });
  }

  if (!sourceCrs) {
    return blockedResult({
      plan,
      reason: `${op.label} needs a known projected CRS for planar metric work. Declare the CRS before running.`,
      remedy: "declare-crs",
    });
  }

  if (!isProjected(sourceCrs)) {
    return blockedResult({
      plan,
      reason: `${op.label} cannot run as planar metric work in geographic CRS ${sourceCrs}. Reproject to a suitable projected CRS before running.`,
      remedy: "reproject",
    });
  }

  return okResult({ plan, caveats: [] });
}

function normalizeOptionalCrs(crs: string | null | undefined): string | null {
  return crs ? normalizeCrs(crs) : null;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function okResult(input: {
  plan: Pick<CrsPreflightResult, "sourceCrs" | "displayCrs" | "executionCrs" | "executionKind">;
  caveats: string[];
}): CrsPreflightResult {
  return {
    ok: true,
    blocked: false,
    sourceCrs: input.plan.sourceCrs,
    displayCrs: input.plan.displayCrs,
    executionCrs: input.plan.executionCrs,
    executionKind: input.plan.executionKind,
    caveats: input.caveats,
  };
}

function blockedResult(input: {
  plan: Pick<CrsPreflightResult, "sourceCrs" | "displayCrs" | "executionCrs" | "executionKind">;
  reason: string;
  remedy: CrsRemedy;
}): CrsPreflightResult {
  return {
    ok: false,
    blocked: true,
    sourceCrs: input.plan.sourceCrs,
    displayCrs: input.plan.displayCrs,
    executionCrs: input.plan.executionCrs,
    executionKind: input.plan.executionKind,
    reason: input.reason,
    remedy: input.remedy,
    caveats: [],
  };
}

export const CrsPreflight = {
  preflight,
} as const;
