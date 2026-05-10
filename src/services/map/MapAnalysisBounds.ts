import type { DrawnFeature } from "@/centerpanel/components/map/mapTypes";

export type MapAnalysisBoundsSource = "selected-aoi" | "active-aoi" | "latest-aoi" | "map-view";

export interface MapAnalysisBounds {
  bounds: [number, number, number, number];
  source: MapAnalysisBoundsSource;
  label: string;
  featureId?: string;
}

function isPolygonGeometry(geometry: GeoJSON.Geometry): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
}

function visitGeometryCoordinates(geometry: GeoJSON.Geometry, visitor: (coordinate: [number, number]) => void): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitGeometryCoordinates(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visitor([Number(value[0]), Number(value[1])]);
      return;
    }
    value.forEach(walk);
  };

  walk(geometry.coordinates);
}

export function getGeometryBounds(geometry: GeoJSON.Geometry): [number, number, number, number] | null {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  visitGeometryCoordinates(geometry, ([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  return Number.isFinite(minLng) && Number.isFinite(minLat) && Number.isFinite(maxLng) && Number.isFinite(maxLat)
    ? [minLng, minLat, maxLng, maxLat]
    : null;
}

function toCandidate(feature: DrawnFeature, source: MapAnalysisBoundsSource, fallbackLabel: string): MapAnalysisBounds | null {
  if (!isPolygonGeometry(feature.geometry)) return null;
  const bounds = getGeometryBounds(feature.geometry);
  if (!bounds) return null;
  return {
    bounds,
    source,
    label: feature.properties.label || fallbackLabel,
    featureId: feature.id,
  };
}

export function resolveMapAnalysisBounds(options: {
  drawnFeatures: readonly DrawnFeature[];
  selectedFeatureId?: string | null;
  activeAoiId?: string;
  currentMapBounds?: [number, number, number, number] | null;
}): MapAnalysisBounds | null {
  const drawnFeatures = [...options.drawnFeatures];
  const selectedFeature = options.selectedFeatureId
    ? drawnFeatures.find((feature) => feature.id === options.selectedFeatureId)
    : undefined;
  const selectedCandidate = selectedFeature ? toCandidate(selectedFeature, "selected-aoi", "Selected AOI") : null;
  if (selectedCandidate) return selectedCandidate;

  const activeFeature = options.activeAoiId
    ? drawnFeatures.find((feature) => feature.id === options.activeAoiId)
    : undefined;
  const activeCandidate = activeFeature ? toCandidate(activeFeature, "active-aoi", "Active AOI") : null;
  if (activeCandidate) return activeCandidate;

  const latestPolygon = drawnFeatures.reverse().find((feature) => isPolygonGeometry(feature.geometry));
  const latestCandidate = latestPolygon ? toCandidate(latestPolygon, "latest-aoi", "Latest drawn AOI") : null;
  if (latestCandidate) return latestCandidate;

  return options.currentMapBounds
    ? { bounds: options.currentMapBounds, source: "map-view", label: "Current visible map extent" }
    : null;
}
