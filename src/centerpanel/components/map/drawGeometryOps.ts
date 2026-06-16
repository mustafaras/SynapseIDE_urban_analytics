/* ================================================================== */
/*  Drawn-feature geometry operations (pure, testable)                 */
/*                                                                     */
/*  Bounds, translate/duplicate, and GeoJSON import/export for the     */
/*  premium drawing modal. No UI, no map, no store deps.               */
/* ================================================================== */

import { drawId } from "../../../utils/drawingHelpers";
import { visitDrawnGeometryPositions } from "../../../services/map/DrawnGeometryValidation";
import type { DrawnFeature, FeatureStyle } from "./mapTypes";

export type DrawnFeatureBounds = [[number, number], [number, number]];

/** Axis-aligned [[minLng, minLat], [maxLng, maxLat]] over all positions, or null. */
export function geometryBounds(geometry: GeoJSON.Geometry): DrawnFeatureBounds | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let seen = false;
  visitDrawnGeometryPositions(geometry, (position) => {
    const lng = position[0];
    const lat = position[1];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    seen = true;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });
  if (!seen) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Combined bounds over many features, or null when empty. */
export function featuresBounds(features: readonly DrawnFeature[]): DrawnFeatureBounds | null {
  let acc: DrawnFeatureBounds | null = null;
  for (const f of features) {
    const b = geometryBounds(f.geometry);
    if (!b) continue;
    if (!acc) {
      acc = [[b[0][0], b[0][1]], [b[1][0], b[1][1]]];
    } else {
      acc[0][0] = Math.min(acc[0][0], b[0][0]);
      acc[0][1] = Math.min(acc[0][1], b[0][1]);
      acc[1][0] = Math.max(acc[1][0], b[1][0]);
      acc[1][1] = Math.max(acc[1][1], b[1][1]);
    }
  }
  return acc;
}

function mapPosition(p: number[], dLng: number, dLat: number): number[] {
  return [p[0] + dLng, p[1] + dLat, ...p.slice(2)];
}

/** Translate Point/LineString/Polygon by a lng/lat delta. Other types pass through. */
export function translateGeometry(
  geometry: GeoJSON.Geometry,
  dLng: number,
  dLat: number,
): GeoJSON.Geometry {
  switch (geometry.type) {
    case "Point":
      return { type: "Point", coordinates: mapPosition(geometry.coordinates, dLng, dLat) };
    case "LineString":
      return {
        type: "LineString",
        coordinates: geometry.coordinates.map((p) => mapPosition(p, dLng, dLat)),
      };
    case "Polygon":
      return {
        type: "Polygon",
        coordinates: geometry.coordinates.map((ring) => ring.map((p) => mapPosition(p, dLng, dLat))),
      };
    default:
      return geometry;
  }
}

/** Clone a feature with a fresh id, a "(copy)" label, and a small visible offset. */
export function duplicateDrawnFeature(
  feature: DrawnFeature,
  offsetLng = 0.0008,
  offsetLat = -0.0008,
): DrawnFeature {
  return {
    id: drawId(),
    geometry: translateGeometry(feature.geometry, offsetLng, offsetLat),
    properties: {
      ...feature.properties,
      label: `${feature.properties.label} (copy)`,
      createdAt: new Date().toISOString(),
    },
  };
}

/** Export drawn features as a GeoJSON FeatureCollection (label + style preserved). */
export function drawnFeaturesToGeoJSON(
  features: readonly DrawnFeature[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: {
        label: f.properties.label,
        createdAt: f.properties.createdAt,
        ...(f.properties.style ? { style: f.properties.style } : {}),
      },
    })),
  };
}

const SUPPORTED_IMPORT_TYPES = new Set(["Point", "LineString", "Polygon"]);

export interface ParseDrawnFeaturesResult {
  features: DrawnFeature[];
  error: string | null;
  /** Geometries skipped because they were unsupported/invalid. */
  skipped: number;
}

function coerceStyle(value: unknown): FeatureStyle | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const style: FeatureStyle = {};
  if (typeof v.strokeColor === "string") style.strokeColor = v.strokeColor;
  if (typeof v.fillColor === "string") style.fillColor = v.fillColor;
  if (typeof v.strokeWidth === "number") style.strokeWidth = v.strokeWidth;
  if (typeof v.fillOpacity === "number") style.fillOpacity = v.fillOpacity;
  return Object.keys(style).length > 0 ? style : undefined;
}

function toDrawnFeature(
  geometry: GeoJSON.Geometry,
  rawProps: unknown,
  index: number,
): DrawnFeature {
  const props = (rawProps && typeof rawProps === "object" ? rawProps : {}) as Record<string, unknown>;
  const label =
    typeof props.label === "string" && props.label.trim().length > 0
      ? props.label
      : typeof props.name === "string" && props.name.trim().length > 0
        ? props.name
        : `Imported ${geometry.type} ${index + 1}`;
  const style = coerceStyle(props.style);
  return {
    id: drawId(),
    geometry,
    properties: {
      label,
      createdAt:
        typeof props.createdAt === "string" ? props.createdAt : new Date().toISOString(),
      ...(style ? { style } : {}),
    },
  };
}

/**
 * Parse pasted/loaded GeoJSON text into drawable features. Accepts a
 * FeatureCollection, a single Feature, or a bare Geometry. Only
 * Point/LineString/Polygon are kept; everything else is counted as skipped.
 */
export function parseDrawnFeaturesFromGeoJSON(text: string): ParseDrawnFeaturesResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { features: [], error: "Not valid JSON.", skipped: 0 };
  }
  if (!parsed || typeof parsed !== "object") {
    return { features: [], error: "GeoJSON must be an object.", skipped: 0 };
  }

  const root = parsed as { type?: string; features?: unknown; geometry?: unknown; properties?: unknown };
  let rawFeatures: Array<{ geometry: unknown; properties: unknown }> = [];

  if (root.type === "FeatureCollection" && Array.isArray(root.features)) {
    rawFeatures = (root.features as unknown[]).map((f) => {
      const feat = (f && typeof f === "object" ? f : {}) as { geometry?: unknown; properties?: unknown };
      return { geometry: feat.geometry, properties: feat.properties };
    });
  } else if (root.type === "Feature") {
    rawFeatures = [{ geometry: root.geometry, properties: root.properties }];
  } else if (typeof root.type === "string" && SUPPORTED_IMPORT_TYPES.has(root.type)) {
    rawFeatures = [{ geometry: parsed, properties: null }];
  } else {
    return { features: [], error: "Unrecognised GeoJSON: expected FeatureCollection, Feature, or Geometry.", skipped: 0 };
  }

  const features: DrawnFeature[] = [];
  let skipped = 0;
  rawFeatures.forEach((entry, index) => {
    const geometry = entry.geometry as GeoJSON.Geometry | undefined;
    if (
      !geometry ||
      typeof geometry !== "object" ||
      typeof (geometry as { type?: unknown }).type !== "string" ||
      !SUPPORTED_IMPORT_TYPES.has((geometry as { type: string }).type) ||
      !Array.isArray((geometry as { coordinates?: unknown }).coordinates)
    ) {
      skipped += 1;
      return;
    }
    features.push(toDrawnFeature(geometry, entry.properties, index));
  });

  if (features.length === 0) {
    return { features: [], error: "No supported Point/Line/Polygon features found.", skipped };
  }
  return { features, error: null, skipped };
}
