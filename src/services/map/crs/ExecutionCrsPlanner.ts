import type { CrsExecutionKind, CrsPreflightResult } from "@/services/map/contracts/gisContracts";
import {
  centroidForExtent,
  equalAreaForExtent,
  isProjected,
  localUtmFor,
  normalizeCrs,
  type MapExtent,
  WGS84_CRS,
  worldEqualArea,
} from "./MapProjectionService";

export type ExecutionCrsPlan = Pick<
  CrsPreflightResult,
  "sourceCrs" | "displayCrs" | "executionCrs" | "executionKind"
> & {
  planningExtent: MapExtent | null;
};

export interface ExecutionCrsPlannerInput {
  sourceCrs: string | null | undefined;
  displayCrs?: string;
  executionKind?: CrsExecutionKind;
  extent?: MapExtent | null;
  aoi?: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.Geometry | null;
  preferEqualArea?: boolean;
}

export function planExecutionCrs(input: ExecutionCrsPlannerInput): ExecutionCrsPlan {
  const displayCrs = normalizeCrs(input.displayCrs ?? WGS84_CRS);
  const executionKind = input.executionKind ?? "planar";
  const planningExtent = input.extent ?? extentFromAoi(input.aoi) ?? null;
  const sourceCrs = input.sourceCrs ? normalizeCrs(input.sourceCrs) : null;

  if (!sourceCrs) {
    return {
      sourceCrs: null,
      displayCrs,
      executionCrs: null,
      executionKind,
      planningExtent,
    };
  }

  if (executionKind === "geodesic") {
    return {
      sourceCrs,
      displayCrs,
      executionCrs: null,
      executionKind,
      planningExtent,
    };
  }

  if (isProjected(sourceCrs)) {
    return {
      sourceCrs,
      displayCrs,
      executionCrs: sourceCrs,
      executionKind,
      planningExtent,
    };
  }

  if (!planningExtent) {
    return {
      sourceCrs,
      displayCrs,
      executionCrs: input.preferEqualArea ? equalAreaForExtent(null) : worldEqualArea(),
      executionKind,
      planningExtent,
    };
  }

  const [lng, lat] = centroidForExtent(planningExtent);
  return {
    sourceCrs,
    displayCrs,
    executionCrs: input.preferEqualArea ? equalAreaForExtent(planningExtent) : localUtmFor(lng, lat),
    executionKind,
    planningExtent,
  };
}

export function extentFromAoi(
  aoi: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.Geometry | null | undefined,
): MapExtent | null {
  if (!aoi) return null;
  const extent: MutableExtent = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

  if (aoi.type === "FeatureCollection") {
    for (const feature of aoi.features) {
      expandGeometry(feature.geometry, extent);
    }
  } else if (aoi.type === "Feature") {
    expandGeometry(aoi.geometry, extent);
  } else {
    expandGeometry(aoi, extent);
  }

  if (!Number.isFinite(extent[0]) || !Number.isFinite(extent[1]) || !Number.isFinite(extent[2]) || !Number.isFinite(extent[3])) {
    return null;
  }

  return [extent[0], extent[1], extent[2], extent[3]];
}

type MutableExtent = [number, number, number, number];

function expandGeometry(geometry: GeoJSON.Geometry | null | undefined, extent: MutableExtent): void {
  if (!geometry) return;
  switch (geometry.type) {
    case "Point":
      expandPosition(geometry.coordinates, extent);
      break;
    case "MultiPoint":
    case "LineString":
      for (const position of geometry.coordinates) expandPosition(position, extent);
      break;
    case "MultiLineString":
    case "Polygon":
      for (const line of geometry.coordinates) {
        for (const position of line) expandPosition(position, extent);
      }
      break;
    case "MultiPolygon":
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          for (const position of ring) expandPosition(position, extent);
        }
      }
      break;
    case "GeometryCollection":
      for (const child of geometry.geometries) expandGeometry(child, extent);
      break;
  }
}

function expandPosition(position: GeoJSON.Position, extent: MutableExtent): void {
  const [x, y] = position;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  extent[0] = Math.min(extent[0], x);
  extent[1] = Math.min(extent[1], y);
  extent[2] = Math.max(extent[2], x);
  extent[3] = Math.max(extent[3], y);
}

export const ExecutionCrsPlanner = {
  plan: planExecutionCrs,
  extentFromAoi,
  localUtmFor,
  isProjected,
} as const;