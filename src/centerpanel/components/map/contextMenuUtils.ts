import type { DrawnFeature, MapPin, OverlayLayerConfig } from "./mapTypes";

export type LngLat = [number, number];

export interface ContextMenuPositionClampInput {
  x: number;
  y: number;
  menuWidth: number;
  menuHeight: number;
  containerWidth: number;
  containerHeight: number;
  padding?: number;
}

export function clampContextMenuPosition({
  x,
  y,
  menuWidth,
  menuHeight,
  containerWidth,
  containerHeight,
  padding = 8,
}: ContextMenuPositionClampInput): { x: number; y: number } {
  return {
    x: Math.max(padding, Math.min(x, containerWidth - menuWidth - padding)),
    y: Math.max(padding, Math.min(y, containerHeight - menuHeight - padding)),
  };
}

export function formatCoordinatePair([lng, lat]: LngLat): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function appendNestedCoordinates(
  input: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
  bucket: Array<[number, number]>,
): void {
  if (!Array.isArray(input) || input.length === 0) return;
  if (typeof input[0] === "number" && typeof input[1] === "number") {
    bucket.push([input[0], input[1]] as [number, number]);
    return;
  }
  for (const part of input as Array<
    GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][]
  >) {
    appendNestedCoordinates(
      part as GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][],
      bucket,
    );
  }
}

function extractFeatureCoordinates(feature: DrawnFeature): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  switch (feature.geometry.type) {
    case "Point":
      appendNestedCoordinates(
        (feature.geometry as GeoJSON.Point).coordinates,
        coords,
      );
      break;
    case "LineString":
      appendNestedCoordinates(
        (feature.geometry as GeoJSON.LineString).coordinates,
        coords,
      );
      break;
    case "Polygon":
      appendNestedCoordinates(
        (feature.geometry as GeoJSON.Polygon).coordinates,
        coords,
      );
      break;
    default:
      break;
  }
  return coords;
}

export function collectVisibleBounds({
  pins,
  drawnFeatures,
  overlayLayers,
}: {
  pins: MapPin[];
  drawnFeatures: DrawnFeature[];
  overlayLayers: OverlayLayerConfig[];
}): [number, number, number, number] | null {
  const coords: Array<[number, number]> = [];

  for (const pin of pins) {
    coords.push([pin.lng, pin.lat]);
  }

  for (const feature of drawnFeatures) {
    coords.push(...extractFeatureCoordinates(feature));
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  for (const layer of overlayLayers) {
    if (!layer.visible || !layer.metadata?.bounds) continue;
    const [layerMinLng, layerMinLat, layerMaxLng, layerMaxLat] = layer.metadata.bounds;
    minLng = Math.min(minLng, layerMinLng);
    minLat = Math.min(minLat, layerMinLat);
    maxLng = Math.max(maxLng, layerMaxLng);
    maxLat = Math.max(maxLat, layerMaxLat);
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}
