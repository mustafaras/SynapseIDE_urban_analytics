import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

import type { MapOutput } from "@/features/urbanAnalytics/lib/types";
import type { DrawnFeature, OverlayLayerConfig } from "../mapTypes";
import { MAP_COLORS } from "../mapTokens";
import type { MapDrawingSnapSource } from "../../MapDrawingManager";
import { validateDrawnGeometry } from "@/services/map/DrawnGeometryValidation";
import {
  buildBoundsPolygon,
} from "../../../../services/map/MapAnalysisDispatcher";
import { getFeatureCollectionBounds } from "../../../../services/map/MapDataImporter";
import type { MapWorkflowApplyResult } from "../../../../services/map/MapWorkflowService";

export interface FlowDispatchAoiCandidate {
  feature: Feature<Polygon | MultiPolygon>;
  source: "drawn-aoi" | "map-context-menu";
  label: string;
}

export function matchesSpatialStatsOutput(
  output: MapOutput,
  layerId: string,
  rerunToken?: string | null,
  runId?: string,
): boolean {
  if (output.id === layerId) {
    return true;
  }

  if (rerunToken && output.engineBridge?.rerunToken === rerunToken) {
    return true;
  }

  return Boolean(runId && output.engineBridge?.runId === runId);
}

export function replaceSpatialStatsOutput(
  outputs: MapOutput[],
  nextOutput: MapOutput,
  layerId: string,
  rerunToken?: string | null,
  runId?: string,
): MapOutput[] {
  const index = outputs.findIndex((output) => matchesSpatialStatsOutput(output, layerId, rerunToken, runId));
  if (index === -1) {
    return [...outputs, nextOutput];
  }

  const nextOutputs = [...outputs];
  nextOutputs[index] = nextOutput;
  return nextOutputs;
}

export function isPolygonGeometry(geometry: GeoJSON.Geometry | null | undefined): geometry is Polygon | MultiPolygon {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

export function isPolygonLayerCandidate(layer: OverlayLayerConfig): boolean {
  if (!layer.visible || layer.type !== "geojson") {
    return false;
  }
  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  return !geometryType || geometryType.includes("polygon") || geometryType.includes("multi");
}

export function hasPolygonGeometry(collection: GeoJSON.FeatureCollection): boolean {
  return collection.features.some((feature) => isPolygonGeometry(feature.geometry));
}

export function visitCoordinates(geometry: GeoJSON.Geometry, visitor: (coordinate: [number, number]) => void): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitCoordinates(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visitor([Number(value[0]), Number(value[1])]);
      return;
    }
    for (const entry of value) {
      walk(entry);
    }
  };
  walk(geometry.coordinates);
}

export function getFeatureBounds(feature: GeoJSON.Feature): [number, number, number, number] | null {
  if (!feature.geometry) {
    return null;
  }
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  visitCoordinates(feature.geometry, ([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function mergeBounds(
  boundsList: Array<[number, number, number, number] | null | undefined>,
): [number, number, number, number] | null {
  const finiteBounds = boundsList.filter((bounds): bounds is [number, number, number, number] =>
    Boolean(bounds) && bounds.every((value) => Number.isFinite(value)),
  );
  if (finiteBounds.length === 0) {
    return null;
  }

  return finiteBounds.reduce<[number, number, number, number]>((merged, bounds) => [
    Math.min(merged[0], bounds[0]),
    Math.min(merged[1], bounds[1]),
    Math.max(merged[2], bounds[2]),
    Math.max(merged[3], bounds[3]),
  ], finiteBounds[0]!);
}

export function getLayerFitBounds(layer: OverlayLayerConfig): [number, number, number, number] | null {
  const metadataBounds = layer.metadata?.bounds ?? layer.metadata?.geometrySummary?.bounds ?? null;
  if (metadataBounds) {
    return metadataBounds;
  }

  const sourceData = layer.sourceData;
  if (!sourceData || typeof sourceData === "string") {
    return null;
  }

  const collection = (sourceData as FeatureCollection).type === "FeatureCollection"
    ? (sourceData as FeatureCollection)
    : null;
  return collection ? getFeatureCollectionBounds(collection) : null;
}

export function getFeatureSelectionKeys(feature: GeoJSON.Feature, layerId: string): Set<string> {
  const properties = feature.properties as Record<string, unknown> | null | undefined;
  const keys = [
    feature.id,
    properties?.id,
    properties?.feature_id,
    properties?.detection_id,
    properties?.cell_id,
    properties?.agent_id,
    properties?.name,
    `${layerId}-feature`,
  ];
  return new Set(
    keys
      .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
      .map(String),
  );
}

export function getSelectedFeatureFitBounds(
  layers: readonly OverlayLayerConfig[],
  selectedFeatureIds: Record<string, string[]>,
): [number, number, number, number] | null {
  const selectedBounds: Array<[number, number, number, number]> = [];

  for (const [layerId, ids] of Object.entries(selectedFeatureIds)) {
    if (ids.length === 0) continue;
    const layer = layers.find((entry) => entry.id === layerId);
    if (!layer || !layer.sourceData || typeof layer.sourceData === "string") continue;

    const collection = (layer.sourceData as FeatureCollection).type === "FeatureCollection"
      ? (layer.sourceData as FeatureCollection)
      : null;
    if (!collection) continue;

    const idSet = new Set(ids.map(String));
    for (const feature of collection.features) {
      const featureKeys = getFeatureSelectionKeys(feature, layerId);
      if (![...featureKeys].some((key) => idSet.has(key))) continue;
      const bounds = getFeatureBounds(feature);
      if (bounds) selectedBounds.push(bounds);
    }
  }

  return mergeBounds(selectedBounds);
}

export function doBoundsIntersect(
  first: [number, number, number, number],
  second: [number, number, number, number],
): boolean {
  return first[0] <= second[2]
    && first[2] >= second[0]
    && first[1] <= second[3]
    && first[3] >= second[1];
}

export function filterFeatureCollectionToBounds(
  collection: GeoJSON.FeatureCollection,
  bounds: [number, number, number, number],
): GeoJSON.FeatureCollection {
  return {
    ...collection,
    features: collection.features.filter((feature) => {
      const featureBounds = getFeatureBounds(feature);
      return featureBounds ? doBoundsIntersect(featureBounds, bounds) : false;
    }),
  };
}

export function coerceOverlayFeatureCollection(layer: OverlayLayerConfig): GeoJSON.FeatureCollection | null {
  const { sourceData } = layer;
  if (!sourceData || typeof sourceData === "string") return null;
  return (sourceData as GeoJSON.FeatureCollection).type === "FeatureCollection"
    ? sourceData as GeoJSON.FeatureCollection
    : null;
}

export function buildDrawingSnapSources(layers: readonly OverlayLayerConfig[]): MapDrawingSnapSource[] {
  const sources: MapDrawingSnapSource[] = [];
  for (const layer of layers) {
    if (!layer.visible || !layer.queryable) continue;
    const featureCollection = coerceOverlayFeatureCollection(layer);
    if (!featureCollection || featureCollection.features.length === 0) continue;
    sources.push({
      id: layer.id,
      name: layer.name,
      featureCollection: {
        ...featureCollection,
        features: featureCollection.features.slice(0, 1_000),
      },
    });
    if (sources.length >= 8) break;
  }
  return sources;
}

export function cloneGeometry<T extends GeoJSON.Geometry>(geometry: T): T {
  return JSON.parse(JSON.stringify(geometry)) as T;
}

export function buildDrawnAoiFromWorkflowResult(result: MapWorkflowApplyResult): DrawnFeature | null {
  if (result.preview.workflow !== "aoi") return null;
  const feature = result.preview.featureCollection?.features[0];
  if (!feature?.geometry || !isPolygonGeometry(feature.geometry)) return null;
  const validation = validateDrawnGeometry(feature.geometry);
  if (validation.status === "blocked") return null;
  return {
    id: `aoi-${result.layer.id}`,
    geometry: cloneGeometry(feature.geometry),
    properties: {
      label: result.layer.name || "Workflow AOI",
      createdAt: new Date().toISOString(),
      style: {
        strokeColor: MAP_COLORS.interaction,
        fillColor: MAP_COLORS.interaction,
        strokeWidth: 2,
        fillOpacity: 0.12,
      },
      validation,
    },
  };
}

export function resolveFlowDispatchAoiCandidate(
  drawnFeatures: DrawnFeature[],
  selectedFeatureId: string | null,
  currentMapBounds: [number, number, number, number] | null,
): FlowDispatchAoiCandidate | null {
  const selectedPolygon = selectedFeatureId
    ? drawnFeatures.find((feature) => feature.id === selectedFeatureId && isPolygonGeometry(feature.geometry))
    : null;
  const latestPolygon = selectedPolygon
    ?? [...drawnFeatures].reverse().find((feature) => isPolygonGeometry(feature.geometry));

  if (latestPolygon && isPolygonGeometry(latestPolygon.geometry)) {
    return {
      feature: {
        type: "Feature",
        id: latestPolygon.id,
        geometry: latestPolygon.geometry,
        properties: latestPolygon.properties,
      } as Feature<Polygon | MultiPolygon>,
      source: "drawn-aoi",
      label: String(latestPolygon.properties?.label ?? "Latest drawn AOI"),
    };
  }

  if (currentMapBounds) {
    return {
      feature: buildBoundsPolygon(currentMapBounds),
      source: "map-context-menu",
      label: "Current visible map extent",
    };
  }

  return null;
}
