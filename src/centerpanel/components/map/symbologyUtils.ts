import { resolveGeoJSONSourceToFeatureCollection } from "../../../services/map/MapDataImporter";
import type { OverlayLayerConfig } from "./mapTypes";

export interface NumericFieldInfo {
  name: string;
  numericCount: number;
}

export interface ResolvedPointLayer {
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
}

export const SYMBOLOGY_FEATURE_ID_FIELD = "__symbologyFeatureId";

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function inferGeometryType(geometry: GeoJSON.Geometry | null | undefined): string {
  if (!geometry) return "unknown";
  return geometry.type.toLowerCase();
}

export function hasPointGeometry(collection: GeoJSON.FeatureCollection): boolean {
  return collection.features.some((feature) => {
    const geometryType = inferGeometryType(feature.geometry);
    return geometryType === "point" || geometryType === "multipoint";
  });
}

export function isPointCandidate(layer: OverlayLayerConfig): boolean {
  if (layer.type !== "geojson") return false;
  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  if (!geometryType) return false;
  return geometryType.includes("point");
}

export function collectNumericFields(collection: GeoJSON.FeatureCollection): NumericFieldInfo[] {
  const fieldStats = new Map<string, { numericCount: number; nonEmptyCount: number }>();

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};
    for (const [key, rawValue] of Object.entries(properties)) {
      const numeric = toFiniteNumber(rawValue);
      const hasValue =
        rawValue != null &&
        (!(typeof rawValue === "string") || rawValue.trim().length > 0);
      const current = fieldStats.get(key) ?? { numericCount: 0, nonEmptyCount: 0 };
      if (hasValue) {
        current.nonEmptyCount += 1;
      }
      if (numeric != null) {
        current.numericCount += 1;
      }
      fieldStats.set(key, current);
    }
  }

  return [...fieldStats.entries()]
    .filter(([, stats]) => stats.numericCount > 0)
    .map(([name, stats]) => ({ name, numericCount: stats.numericCount }))
    .sort((left, right) => right.numericCount - left.numericCount || left.name.localeCompare(right.name));
}

export async function resolveFeatureCollection(
  layer: OverlayLayerConfig,
): Promise<GeoJSON.FeatureCollection> {
  return resolveGeoJSONSourceToFeatureCollection(layer.sourceData, layer.name);
}

export function buildFeatureIdentifier(feature: GeoJSON.Feature, index: number): string {
  if (feature.id != null) return String(feature.id);
  const propertyId = feature.properties?.id;
  if (propertyId != null) return String(propertyId);
  return `feature-${index + 1}`;
}

export function decoratePointFeatures(
  collection: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature, index) => ({
      ...feature,
      id: feature.id ?? buildFeatureIdentifier(feature, index),
      properties: {
        ...(feature.properties ?? {}),
        [SYMBOLOGY_FEATURE_ID_FIELD]: buildFeatureIdentifier(feature, index),
      },
    })),
  };
}
