import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import {
  type GeoJSONRenderNormalizationOptions,
  normalizeGeoJSONSourceDataForRender,
} from "@/services/map/MapDataImporter";
import {
  createMapPerformanceTiming,
  type MapPerformanceTimingMetric,
} from "@/services/map/MapPerformanceDiagnostics";
import { normalizeXyzTileUrlTemplate } from "@/services/map/ExternalTileUrlTemplates";
import {
  buildMapLibreLabelFragments,
  getSerializedMapLabelSpecFromStyle,
  STYLE_LABEL_SPEC_KEY,
} from "@/services/map/labels/MapLabelEngine";
import {
  buildDotDensityFeatureCollection,
  getSerializedAdvancedCartographySpecFromStyle,
  STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY,
} from "@/services/map/cartography/AdvancedCartographyEngine";
import {
  buildVectorTilePipeline,
  buildVectorTileRenderFeatureCollection,
  type VectorTilePipeline,
} from "@/services/map/tiling/VectorTilePipelineService";
import type { OverlayLayerConfig } from "./mapTypes";
import { MAP_COLORS, resolveMapPaintColor } from "./mapTokens";

const INTERNAL_STYLE_PREFIX = "__";
const LABEL_FIELD_STYLE_KEY = "__labelField";
const LABEL_SIZE_STYLE_KEY = "__labelSize";
const LABEL_COLOR_STYLE_KEY = "__labelColor";
const LABEL_HALO_COLOR_STYLE_KEY = "__labelHaloColor";
const LABEL_HALO_WIDTH_STYLE_KEY = "__labelHaloWidth";
const LABEL_ALLOW_OVERLAP_STYLE_KEY = "__labelAllowOverlap";
const LABEL_IGNORE_PLACEMENT_STYLE_KEY = "__labelIgnorePlacement";
const COMPANION_CIRCLE_STYLE_KEY = "__companionCircle";
const COMPANION_CIRCLE_RADIUS_STYLE_KEY = "__companionCircleRadius";
const COMPANION_CIRCLE_COLOR_STYLE_KEY = "__companionCircleColor";
const COMPANION_CIRCLE_OPACITY_STYLE_KEY = "__companionCircleOpacity";
const COMPANION_CIRCLE_STROKE_COLOR_STYLE_KEY = "__companionCircleStrokeColor";
const COMPANION_CIRCLE_STROKE_WIDTH_STYLE_KEY = "__companionCircleStrokeWidth";
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const TRANSPARENT_RASTER_DATA_URL = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%2F%3E";
const WORLD_EXTENT = { west: -180, south: -85.05112878, east: 180, north: 85.05112878 };
const WORLD_IMAGE_COORDINATES: [[number, number], [number, number], [number, number], [number, number]] = [
  [WORLD_EXTENT.west, WORLD_EXTENT.north],
  [WORLD_EXTENT.east, WORLD_EXTENT.north],
  [WORLD_EXTENT.east, WORLD_EXTENT.south],
  [WORLD_EXTENT.west, WORLD_EXTENT.south],
];

const vectorTilePipelineCache = new WeakMap<GeoJSON.FeatureCollection, Map<string, VectorTilePipeline>>();

export type LayerSyncPerformanceHandler = (metric: MapPerformanceTimingMetric) => void;

function labelLayerId(layerId: string): string {
  return `${layerId}__labels`;
}

function companionCircleLayerId(layerId: string): string {
  return `${layerId}__companionCircle`;
}

function dotDensitySourceId(layerId: string): string {
  return `${layerId}__dotDensitySource`;
}

function dotDensityLayerId(layerId: string): string {
  return `${layerId}__dotDensity`;
}

function stripInternalStyle(style?: Record<string, unknown>): Record<string, unknown> {
  const nonPaintKeys = new Set([
    "legend",
    "legendEntries",
    "legendSpec",
    STYLE_LABEL_SPEC_KEY,
    STYLE_ADVANCED_CARTOGRAPHY_SPEC_KEY,
    "classes",
    "classificationField",
    "classificationFieldSecondary",
    "classificationMethod",
    "cartography",
    "cartographyReview",
  ]);
  return Object.fromEntries(
    Object.entries(style ?? {}).filter(([key]) => !key.startsWith(INTERNAL_STYLE_PREFIX) && !nonPaintKeys.has(key)),
  );
}

function getInternalStyleValue<T>(
  style: Record<string, unknown> | undefined,
  key: string,
): T | undefined {
  return style?.[key] as T | undefined;
}

function collectExpressionPropertyKeys(value: unknown, output: Set<string>): void {
  if (!Array.isArray(value)) return;
  if (value[0] === "get" && typeof value[1] === "string") {
    output.add(value[1]);
  }
  for (const entry of value) {
    collectExpressionPropertyKeys(entry, output);
  }
}

function buildRenderNormalizationOptions(layer: OverlayLayerConfig): GeoJSONRenderNormalizationOptions {
  const preservePropertyKeys = new Set<string>();
  const labelSpec = getSerializedMapLabelSpecFromStyle(layer.style);
  const labelField = labelSpec?.field ?? getInternalStyleValue<string>(layer.style, LABEL_FIELD_STYLE_KEY);
  if (labelField) preservePropertyKeys.add(labelField);
  if (labelSpec?.priorityField) preservePropertyKeys.add(labelSpec.priorityField);
  const advancedSpec = getSerializedAdvancedCartographySpecFromStyle(layer.style);
  if (advancedSpec?.valueField) preservePropertyKeys.add(advancedSpec.valueField);
  if (advancedSpec?.secondaryField) preservePropertyKeys.add(advancedSpec.secondaryField);
  if (advancedSpec?.normalizationField) preservePropertyKeys.add(advancedSpec.normalizationField);

  const classificationField = typeof layer.style?.classificationField === "string"
    ? layer.style.classificationField
    : null;
  if (classificationField) preservePropertyKeys.add(classificationField);

  Object.values(layer.style ?? {}).forEach((value) => collectExpressionPropertyKeys(value, preservePropertyKeys));

  return { preservePropertyKeys: Array.from(preservePropertyKeys) };
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function countVisibleFeatures(layers: readonly OverlayLayerConfig[]): number {
  return layers.reduce((sum, layer) => {
    if (!layer.visible) return sum;
    return sum + (layer.metadata?.rendering?.featureCount ?? layer.metadata?.featureCount ?? 0);
  }, 0);
}

function isFeatureCollection(value: unknown): value is GeoJSON.FeatureCollection {
  return Boolean(value) && typeof value === "object" && (value as GeoJSON.FeatureCollection).type === "FeatureCollection" && Array.isArray((value as GeoJSON.FeatureCollection).features);
}

function isOnTheFlyVectorTileLayer(layer: OverlayLayerConfig): boolean {
  return layer.metadata?.vectorTiles?.sourceMode === "on-the-fly" && isFeatureCollection(layer.sourceData);
}

function getMapZoom(map: maplibregl.Map | null | undefined): number {
  const maybeMap = map as { getZoom?: () => number } | null | undefined;
  const zoom = maybeMap?.getZoom?.();
  return Number.isFinite(zoom) ? zoom : 12;
}

function getMapExtent(map: maplibregl.Map | null | undefined): typeof WORLD_EXTENT {
  const maybeBounds = (map as { getBounds?: () => unknown } | null | undefined)?.getBounds?.();
  const bounds = maybeBounds as {
    getWest?: () => number;
    getSouth?: () => number;
    getEast?: () => number;
    getNorth?: () => number;
  } | null | undefined;
  const west = bounds?.getWest?.();
  const south = bounds?.getSouth?.();
  const east = bounds?.getEast?.();
  const north = bounds?.getNorth?.();
  if ([west, south, east, north].every((value) => Number.isFinite(value))) {
    return { west: west!, south: south!, east: east!, north: north! };
  }
  return WORLD_EXTENT;
}

function vectorTilePipelineCacheKey(layer: OverlayLayerConfig): string {
  const metadata = layer.metadata?.vectorTiles;
  return JSON.stringify({
    sourceId: metadata?.sourceId ?? layer.id,
    minZoom: metadata?.minZoom ?? null,
    maxZoom: metadata?.maxZoom ?? null,
    tileSize: metadata?.tileSize ?? null,
    zoomLevels: metadata?.zoomLevels.map((entry) => entry.zoom) ?? null,
  });
}

function getVectorTilePipeline(layer: OverlayLayerConfig, sourceData: GeoJSON.FeatureCollection): VectorTilePipeline {
  let layerCache = vectorTilePipelineCache.get(sourceData);
  if (!layerCache) {
    layerCache = new Map<string, VectorTilePipeline>();
    vectorTilePipelineCache.set(sourceData, layerCache);
  }
  const cacheKey = vectorTilePipelineCacheKey(layer);
  const cached = layerCache.get(cacheKey);
  if (cached) return cached;

  const metadata = layer.metadata?.vectorTiles;
  const pipeline = buildVectorTilePipeline(sourceData, {
    ...(metadata?.sourceId ? { sourceId: metadata.sourceId } : {}),
    ...(metadata?.sourceLayer ? { sourceLayer: metadata.sourceLayer } : {}),
    ...(metadata?.sourceUrl ? { sourceUrl: metadata.sourceUrl } : {}),
    ...(metadata?.minZoom != null ? { minZoom: metadata.minZoom } : {}),
    ...(metadata?.maxZoom != null ? { maxZoom: metadata.maxZoom } : {}),
    ...(metadata?.tileSize != null ? { tileSize: metadata.tileSize } : {}),
    ...(metadata?.zoomLevels.length ? { zoomLevels: metadata.zoomLevels.map((entry) => entry.zoom) } : {}),
  });
  layerCache.set(cacheKey, pipeline);
  return pipeline;
}

function resolveOnTheFlyVectorTileRenderData(
  layer: OverlayLayerConfig,
  map: maplibregl.Map | null | undefined,
): GeoJSON.FeatureCollection | null {
  if (!isOnTheFlyVectorTileLayer(layer)) return null;
  if (!layer.visible) return EMPTY_FEATURE_COLLECTION;
  const sourceData = layer.sourceData as GeoJSON.FeatureCollection;
  const pipeline = getVectorTilePipeline(layer, sourceData);
  return buildVectorTileRenderFeatureCollection(pipeline, getMapExtent(map), getMapZoom(map)).featureCollection;
}

function normalizePmtilesUrl(value: string): string {
  return value.startsWith("pmtiles://") ? value : `pmtiles://${value}`;
}

/* ================================================================== */
/*  useLayerSync — Bridge between overlay-layer store state and        */
/*  the MapLibre GL JS instance.                                       */
/*                                                                     */
/*  Responsibilities:                                                  */
/*  • Add/remove MapLibre sources + layers when store state changes.   */
/*  • Toggle visibility via setLayoutProperty.                         */
/*  • Update opacity via setPaintProperty.                             */
/*  • Reorder layers via moveLayer when ordered IDs change.            */
/* ================================================================== */

/** Map from overlay type + geometry hint to MapLibre layer type */
function resolveLayerType(
  layer: OverlayLayerConfig,
): maplibregl.LayerSpecification["type"] {
  if (layer.type === "heatmap") return "heatmap";
  if (layer.type === "raster-tile") return "raster";

  const geo = layer.metadata?.geometryType?.toLowerCase() ?? "";
  // 3D buildings: polygon layers flagged render3D extrude with MapLibre.
  if (layer.metadata?.render3D && (geo.includes("polygon") || geo === "")) return "fill-extrusion";
  if (geo.includes("point")) return "circle";
  if (geo.includes("line")) return "line";
  if (geo.includes("polygon")) return "fill";

  // Default for unknown GeoJSON / vector-tile
  return "circle";
}

/**
 * MapLibre height expression for extruded buildings from real attributes:
 * explicit height (m) → levels x 3m → building:levels x 3m → 6m fallback.
 */
const BUILDING_HEIGHT_EXPRESSION: unknown = [
  "coalesce",
  ["to-number", ["get", "height"]],
  ["to-number", ["get", "render_height"]],
  ["*", ["to-number", ["get", "levels"]], 3],
  ["*", ["to-number", ["get", "building:levels"]], 3],
  6,
];

const BUILDING_BASE_EXPRESSION: unknown = [
  "coalesce",
  ["to-number", ["get", "min_height"]],
  ["to-number", ["get", "render_min_height"]],
  0,
];

/** Build the paint property relevant for the layer type with the given opacity */
function buildPaint(
  mlType: maplibregl.LayerSpecification["type"],
  opacity: number,
  style?: Record<string, unknown>,
): Record<string, unknown> {
  const base: Record<string, unknown> = stripInternalStyle(style);

  switch (mlType) {
    case "circle":
      base["circle-opacity"] = opacity;
      if (!base["circle-radius"]) base["circle-radius"] = 6;
      if (!base["circle-color"]) base["circle-color"] = MAP_COLORS.interaction;
      break;
    case "line":
      base["line-opacity"] = opacity;
      if (!base["line-color"]) base["line-color"] = MAP_COLORS.interaction;
      if (!base["line-width"]) base["line-width"] = 2;
      break;
    case "fill":
      base["fill-opacity"] = opacity * 0.6;
      if (!base["fill-color"]) base["fill-color"] = MAP_COLORS.interaction;
      break;
    case "fill-extrusion":
      base["fill-extrusion-opacity"] = Math.min(0.95, opacity);
      if (!base["fill-extrusion-color"]) base["fill-extrusion-color"] = MAP_COLORS.interaction;
      // Real attributes drive height/base; clearly-labelled fallback when absent.
      base["fill-extrusion-height"] = BUILDING_HEIGHT_EXPRESSION;
      base["fill-extrusion-base"] = BUILDING_BASE_EXPRESSION;
      // Strip 2D fill keys that MapLibre rejects on an extrusion layer.
      delete base["fill-color"];
      delete base["fill-opacity"];
      delete base["fill-outline-color"];
      break;
    case "heatmap":
      base["heatmap-opacity"] = opacity;
      break;
    case "raster":
      base["raster-opacity"] = opacity;
      break;
    default:
      break;
  }

  // MapLibre paint properties cannot parse CSS var()/color-mix() expressions, which
  // is exactly what the MAP_COLORS tokens (and some classified styles) are. An
  // unparseable color makes MapLibre reject the layer paint on every render pass, so
  // resolve any literal color string to a concrete rgb()/rgba() before handing it over.
  for (const key of COLOR_PAINT_KEYS) {
    const value = base[key];
    if (typeof value === "string") {
      base[key] = resolveMapPaintColor(value);
    }
  }

  return base;
}

/** Paint keys whose values are colors that may carry var()/color-mix() expressions. */
const COLOR_PAINT_KEYS = [
  "circle-color",
  "circle-stroke-color",
  "line-color",
  "fill-color",
  "fill-outline-color",
  "fill-extrusion-color",
  "text-color",
  "text-halo-color",
] as const;

/** Opacity paint property key for a given MapLibre layer type */
function opacityKey(mlType: string): string {
  switch (mlType) {
    case "circle": return "circle-opacity";
    case "line": return "line-opacity";
    case "fill": return "fill-opacity";
    case "fill-extrusion": return "fill-extrusion-opacity";
    case "heatmap": return "heatmap-opacity";
    case "raster": return "raster-opacity";
    default: return "circle-opacity";
  }
}

function isGeoJSONBackedLayer(layer: OverlayLayerConfig): boolean {
  return layer.type === "geojson" || layer.type === "heatmap";
}

function resolveGeoJSONRenderData(
  layer: OverlayLayerConfig,
  map?: maplibregl.Map | null,
): GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry | string {
  if (!layer.visible) {
    return EMPTY_FEATURE_COLLECTION;
  }
  const tiledRenderData = resolveOnTheFlyVectorTileRenderData(layer, map);
  if (tiledRenderData) {
    return tiledRenderData;
  }
  return (normalizeGeoJSONSourceDataForRender(layer.sourceData, buildRenderNormalizationOptions(layer)) as
    | GeoJSON.FeatureCollection
    | GeoJSON.Feature
    | GeoJSON.Geometry
    | string
    | undefined) ?? EMPTY_FEATURE_COLLECTION;
}

function getManagedLayerIds(layer: OverlayLayerConfig): string[] {
  const ids = [layer.id];
  if (getInternalStyleValue(layer.style, COMPANION_CIRCLE_STYLE_KEY)) {
    ids.push(companionCircleLayerId(layer.id));
  }
  if (getSerializedAdvancedCartographySpecFromStyle(layer.style)?.mode === "dot-density") {
    ids.push(dotDensityLayerId(layer.id));
  }
  if (getSerializedMapLabelSpecFromStyle(layer.style) || getInternalStyleValue(layer.style, LABEL_FIELD_STYLE_KEY)) {
    ids.push(labelLayerId(layer.id));
  }
  return ids;
}

function buildLabelLayerSpec(
  layer: OverlayLayerConfig,
): maplibregl.LayerSpecification | null {
  if (!isGeoJSONBackedLayer(layer)) {
    return null;
  }

  const serializedLabelSpec = getSerializedMapLabelSpecFromStyle(layer.style);
  if (serializedLabelSpec) {
    const fragments = buildMapLibreLabelFragments(serializedLabelSpec);
    return {
      id: labelLayerId(layer.id),
      type: "symbol",
      source: layer.id,
      minzoom: fragments.minzoom,
      maxzoom: fragments.maxzoom,
      layout: {
        visibility: layer.visible ? "visible" : "none",
        ...fragments.layout,
      },
      paint: Object.fromEntries(
        Object.entries({
          ...fragments.paint,
          "text-opacity": Math.min(1, Math.max(0.25, layer.opacity)),
        }).map(([key, value]) => [key, typeof value === "string" ? resolveMapPaintColor(value) : value]),
      ),
    } as maplibregl.LayerSpecification;
  }

  const field = getInternalStyleValue<string>(layer.style, LABEL_FIELD_STYLE_KEY);
  if (!field) {
    return null;
  }

  return {
    id: labelLayerId(layer.id),
    type: "symbol",
    source: layer.id,
    layout: {
      visibility: layer.visible ? "visible" : "none",
      "text-field": ["to-string", ["coalesce", ["get", field], ""]],
      "text-size": getInternalStyleValue<number>(layer.style, LABEL_SIZE_STYLE_KEY) ?? 11,
      "text-anchor": "top",
      "text-offset": [0, 1],
      "text-allow-overlap": getInternalStyleValue<boolean>(layer.style, LABEL_ALLOW_OVERLAP_STYLE_KEY) ?? false,
      "text-ignore-placement": getInternalStyleValue<boolean>(layer.style, LABEL_IGNORE_PLACEMENT_STYLE_KEY) ?? false,
    },
    paint: {
      "text-color": resolveMapPaintColor(getInternalStyleValue<string>(layer.style, LABEL_COLOR_STYLE_KEY) ?? "rgb(249,250,251)"),
      "text-halo-color": resolveMapPaintColor(getInternalStyleValue<string>(layer.style, LABEL_HALO_COLOR_STYLE_KEY) ?? "rgba(17,24,39,0.9)"),
      "text-halo-width": getInternalStyleValue<number>(layer.style, LABEL_HALO_WIDTH_STYLE_KEY) ?? 1.25,
      "text-opacity": Math.min(1, Math.max(0.25, layer.opacity)),
    },
  } as maplibregl.LayerSpecification;
}

function buildCompanionCircleLayerSpec(
  layer: OverlayLayerConfig,
): maplibregl.LayerSpecification | null {
  if (!isGeoJSONBackedLayer(layer)) {
    return null;
  }

  if (!getInternalStyleValue(layer.style, COMPANION_CIRCLE_STYLE_KEY)) {
    return null;
  }

  return {
    id: companionCircleLayerId(layer.id),
    type: "circle",
    source: layer.id,
    layout: {
      visibility: layer.visible ? "visible" : "none",
    },
    paint: {
      "circle-radius": getInternalStyleValue<number>(layer.style, COMPANION_CIRCLE_RADIUS_STYLE_KEY) ?? 4,
      "circle-color": getInternalStyleValue<string>(layer.style, COMPANION_CIRCLE_COLOR_STYLE_KEY) ?? "rgba(255,255,255,0.75)",
      "circle-opacity": (getInternalStyleValue<number>(layer.style, COMPANION_CIRCLE_OPACITY_STYLE_KEY) ?? 0.55) * layer.opacity,
      "circle-stroke-color": getInternalStyleValue<string>(layer.style, COMPANION_CIRCLE_STROKE_COLOR_STYLE_KEY) ?? "rgba(17,24,39,0.7)",
      "circle-stroke-width": getInternalStyleValue<number>(layer.style, COMPANION_CIRCLE_STROKE_WIDTH_STYLE_KEY) ?? 0.8,
    },
  } as maplibregl.LayerSpecification;
}

function buildDotDensityLayerSpec(
  layer: OverlayLayerConfig,
): maplibregl.LayerSpecification | null {
  if (!isGeoJSONBackedLayer(layer)) {
    return null;
  }

  const spec = getSerializedAdvancedCartographySpecFromStyle(layer.style);
  if (!spec || spec.mode !== "dot-density") {
    return null;
  }

  return {
    id: dotDensityLayerId(layer.id),
    type: "circle",
    source: dotDensitySourceId(layer.id),
    layout: {
      visibility: layer.visible ? "visible" : "none",
    },
    paint: {
      "circle-radius": spec.dotRadius ?? 2.4,
      "circle-color": resolveMapPaintColor(spec.dotColor ?? "rgb(249, 115, 22)"),
      "circle-opacity": Math.min(1, Math.max(0.25, layer.opacity)),
      "circle-stroke-color": "rgba(17,24,39,0.72)",
      "circle-stroke-width": 0.5,
    },
  } as maplibregl.LayerSpecification;
}

function removeManagedLayer(map: maplibregl.Map, layerId: string): void {
  try {
    if (map.getLayer(labelLayerId(layerId))) map.removeLayer(labelLayerId(layerId));
    if (map.getLayer(dotDensityLayerId(layerId))) map.removeLayer(dotDensityLayerId(layerId));
    if (map.getLayer(companionCircleLayerId(layerId))) map.removeLayer(companionCircleLayerId(layerId));
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(dotDensitySourceId(layerId))) map.removeSource(dotDensitySourceId(layerId));
    if (map.getSource(layerId)) map.removeSource(layerId);
  } catch {
    /* layer already cleaned up by style/source change */
  }
}

function addManagedLayer(map: maplibregl.Map, layer: OverlayLayerConfig): void {
  const mlType = resolveLayerType(layer);

  if (layer.type === "raster-tile" && layer.metadata?.raster?.renderMode === "sampled-image") {
    map.addSource(layer.id, {
      type: "image",
      url: typeof layer.sourceData === "string" ? layer.sourceData : TRANSPARENT_RASTER_DATA_URL,
      coordinates: layer.metadata.raster.imageCoordinates ?? WORLD_IMAGE_COORDINATES,
    });
  } else if (layer.type === "raster-tile" && typeof layer.sourceData === "string") {
    map.addSource(layer.id, {
      type: "raster",
      tiles: [normalizeXyzTileUrlTemplate(layer.sourceData)],
      tileSize: 256,
    });
  } else if (layer.type === "vector-tile" && typeof layer.sourceData === "string") {
    const vectorTileMetadata = layer.metadata?.vectorTiles;
    if (vectorTileMetadata?.sourceMode === "pmtiles") {
      map.addSource(layer.id, {
        type: "vector",
        url: normalizePmtilesUrl(vectorTileMetadata.sourceUrl ?? layer.sourceData),
      });
    } else {
      map.addSource(layer.id, {
        type: "vector",
        tiles: [layer.sourceData],
        ...(vectorTileMetadata?.minZoom != null ? { minzoom: vectorTileMetadata.minZoom } : {}),
        ...(vectorTileMetadata?.maxZoom != null ? { maxzoom: vectorTileMetadata.maxZoom } : {}),
      });
    }
  } else {
    map.addSource(layer.id, {
      type: "geojson",
      data: resolveGeoJSONRenderData(layer, map),
    });
  }

  const layerSpec: Record<string, unknown> = {
    id: layer.id,
    type: mlType,
    source: layer.id,
    paint: buildPaint(mlType, layer.opacity, layer.style),
    layout: {
      visibility: layer.visible ? "visible" : "none",
    },
  };

  if (layer.type === "vector-tile") {
    layerSpec["source-layer"] = layer.metadata?.vectorTiles?.sourceLayer ?? "default";
  }

  map.addLayer(layerSpec as maplibregl.LayerSpecification);

  const companionCircleSpec = buildCompanionCircleLayerSpec(layer);
  if (companionCircleSpec) {
    map.addLayer(companionCircleSpec);
  }

  const dotDensitySpec = getSerializedAdvancedCartographySpecFromStyle(layer.style);
  const dotDensityLayerSpec = buildDotDensityLayerSpec(layer);
  if (dotDensitySpec?.mode === "dot-density" && dotDensityLayerSpec) {
    map.addSource(dotDensitySourceId(layer.id), {
      type: "geojson",
      data: layer.visible ? buildDotDensityFeatureCollection(layer, dotDensitySpec) : EMPTY_FEATURE_COLLECTION,
    });
    map.addLayer(dotDensityLayerSpec);
  }

  const labelSpec = buildLabelLayerSpec(layer);
  if (labelSpec) {
    map.addLayer(labelSpec);
  }
}

/* ================================================================== */
/*  Hook                                                               */
/* ================================================================== */

export function useLayerSync(
  mapRef: React.RefObject<maplibregl.Map | null>,
  overlayLayers: OverlayLayerConfig[],
  onPerformanceSample: LayerSyncPerformanceHandler | undefined = undefined,
): void {
  const [styleRevision, setStyleRevision] = useState(0);
  const [viewportRevision, setViewportRevision] = useState(0);
  /** Track which layers we've added to MapLibre so we can diff */
  const addedIdsRef = useRef<Set<string>>(new Set());
  /** Track previous snapshot for diffing */
  const prevRef = useRef<OverlayLayerConfig[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    const eventedMap = map as unknown as {
      on?: (type: string, handler: () => void) => void;
      off?: (type: string, handler: () => void) => void;
    } | null;
    if (!eventedMap?.on) return undefined;

    const handleStyleLoad = () => {
      addedIdsRef.current.clear();
      prevRef.current = [];
      setStyleRevision((revision) => revision + 1);
    };

    eventedMap.on("style.load", handleStyleLoad);
    return () => {
      eventedMap.off?.("style.load", handleStyleLoad);
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    const eventedMap = map as unknown as {
      on?: (type: string, handler: () => void) => void;
      off?: (type: string, handler: () => void) => void;
    } | null;
    if (!eventedMap?.on) return undefined;

    const handleViewportSettled = () => {
      setViewportRevision((revision) => revision + 1);
    };

    eventedMap.on("moveend", handleViewportSettled);
    eventedMap.on("zoomend", handleViewportSettled);
    return () => {
      eventedMap.off?.("moveend", handleViewportSettled);
      eventedMap.off?.("zoomend", handleViewportSettled);
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const startedAt = performanceNow();
    let operationCount = 0;

    const prev = prevRef.current;
    const prevById = new Map(prev.map((l) => [l.id, l]));
    const currentIds = new Set(overlayLayers.map((l) => l.id));

    /* ---- Remove layers that no longer exist ---- */
    for (const prevLayer of prev) {
      if (!currentIds.has(prevLayer.id) && addedIdsRef.current.has(prevLayer.id)) {
        removeManagedLayer(map, prevLayer.id);
        addedIdsRef.current.delete(prevLayer.id);
        operationCount += 1;
      }
    }

    /* ---- Add new layers / update existing ---- */
    for (const layer of overlayLayers) {
      const prevLayer = prevById.get(layer.id);
      const shouldRebuild =
        prevLayer != null && (
          prevLayer.type !== layer.type ||
          prevLayer.style !== layer.style ||
          prevLayer.metadata?.geometryType !== layer.metadata?.geometryType ||
          prevLayer.metadata?.render3D !== layer.metadata?.render3D ||
          (prevLayer.sourceData !== layer.sourceData && !isGeoJSONBackedLayer(layer))
        );

      const managedLayerMissing = addedIdsRef.current.has(layer.id) && !map.getLayer(layer.id);
      const managedSourceMissing = addedIdsRef.current.has(layer.id) && !map.getSource(layer.id);

      if ((shouldRebuild || managedLayerMissing || managedSourceMissing) && addedIdsRef.current.has(layer.id)) {
        removeManagedLayer(map, layer.id);
        addedIdsRef.current.delete(layer.id);
        operationCount += 1;
      }

      if (!addedIdsRef.current.has(layer.id)) {
        /* New layer — add source + layer to MapLibre */
        try {
          addManagedLayer(map, layer);
          addedIdsRef.current.add(layer.id);
          operationCount += 1;
        } catch {
          /* Source/layer add failed — possibly invalid data */
        }
        continue;
      }

      /* Existing layer — diff and update properties */
      if (prevLayer) {
        if ((prevLayer.sourceData !== layer.sourceData || prevLayer.visible !== layer.visible || isOnTheFlyVectorTileLayer(layer)) && isGeoJSONBackedLayer(layer)) {
          try {
            const source = map.getSource(layer.id) as maplibregl.GeoJSONSource | undefined;
            source?.setData(resolveGeoJSONRenderData(layer, map));
            const dotDensitySpec = getSerializedAdvancedCartographySpecFromStyle(layer.style);
            const dotDensitySource = map.getSource(dotDensitySourceId(layer.id)) as maplibregl.GeoJSONSource | undefined;
            if (dotDensitySpec?.mode === "dot-density" && dotDensitySource) {
              dotDensitySource.setData(layer.visible ? buildDotDensityFeatureCollection(layer, dotDensitySpec) : EMPTY_FEATURE_COLLECTION);
            }
            operationCount += 1;
          } catch { /* ignore */ }
        }

        // Visibility toggled
        if (prevLayer.visible !== layer.visible) {
          try {
            for (const managedId of getManagedLayerIds(layer)) {
              if (!map.getLayer(managedId)) continue;
              map.setLayoutProperty(
                managedId,
                "visibility",
                layer.visible ? "visible" : "none",
              );
              operationCount += 1;
            }
          } catch { /* ignore */ }
        }

        // Opacity changed
        if (prevLayer.opacity !== layer.opacity) {
          const mlType = resolveLayerType(layer);
          try {
            const key = opacityKey(mlType);
            const val = mlType === "fill" ? layer.opacity * 0.6 : layer.opacity;
            map.setPaintProperty(layer.id, key, val);
            operationCount += 1;
            if (map.getLayer(labelLayerId(layer.id))) {
              map.setPaintProperty(
                labelLayerId(layer.id),
                "text-opacity",
                Math.min(1, Math.max(0.25, layer.opacity)),
              );
              operationCount += 1;
            }
            if (map.getLayer(companionCircleLayerId(layer.id))) {
              map.setPaintProperty(
                companionCircleLayerId(layer.id),
                "circle-opacity",
                (getInternalStyleValue<number>(layer.style, COMPANION_CIRCLE_OPACITY_STYLE_KEY) ?? 0.55) * layer.opacity,
              );
              operationCount += 1;
            }
            if (map.getLayer(dotDensityLayerId(layer.id))) {
              map.setPaintProperty(
                dotDensityLayerId(layer.id),
                "circle-opacity",
                Math.min(1, Math.max(0.25, layer.opacity)),
              );
              operationCount += 1;
            }
          } catch { /* ignore */ }
        }
      }
    }

    /* ---- Reorder: ensure MapLibre z-order matches store order ---- */
    const renderOrder = overlayLayers
      .filter((layer) => addedIdsRef.current.has(layer.id))
      .flatMap((layer) => getManagedLayerIds(layer));

    let beforeId: string | undefined;
    for (let index = renderOrder.length - 1; index >= 0; index -= 1) {
      try {
        const layerId = renderOrder[index]!;
        if (!map.getLayer(layerId)) {
          continue;
        }
        map.moveLayer(layerId, beforeId);
        beforeId = layerId;
        operationCount += 1;
      } catch { /* layer may not exist yet */ }
    }

    prevRef.current = overlayLayers.map((l) => ({ ...l }));
    onPerformanceSample?.(createMapPerformanceTiming({
      kind: "render",
      label: operationCount > 0 ? `Layer sync (${operationCount} operations)` : "Layer sync",
      startedAt,
      endedAt: performanceNow(),
      featureCount: countVisibleFeatures(overlayLayers),
    }));
  }, [mapRef, overlayLayers, styleRevision, viewportRevision, onPerformanceSample]);

  /* ---- Cleanup all overlay layers on unmount ---- */
  useEffect(() => {
    const map = mapRef.current;
    const addedIds = addedIdsRef.current;
    return () => {
      if (!map) return;
      for (const id of addedIds) {
        removeManagedLayer(map, id);
      }
      addedIds.clear();
    };
  }, [mapRef]);
}
