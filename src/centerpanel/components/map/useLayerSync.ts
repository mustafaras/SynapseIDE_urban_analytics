import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import {
  normalizeGeoJSONSourceDataForRender,
  type GeoJSONRenderNormalizationOptions,
} from "@/services/map/MapDataImporter";
import { normalizeXyzTileUrlTemplate } from "@/services/map/ExternalTileUrlTemplates";
import type { OverlayLayerConfig } from "./mapTypes";
import { MAP_COLORS } from "./mapTokens";

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

function labelLayerId(layerId: string): string {
  return `${layerId}__labels`;
}

function companionCircleLayerId(layerId: string): string {
  return `${layerId}__companionCircle`;
}

function stripInternalStyle(style?: Record<string, unknown>): Record<string, unknown> {
  const nonPaintKeys = new Set([
    "legend",
    "legendEntries",
    "classes",
    "classificationField",
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
  const labelField = getInternalStyleValue<string>(layer.style, LABEL_FIELD_STYLE_KEY);
  if (labelField) preservePropertyKeys.add(labelField);

  const classificationField = typeof layer.style?.classificationField === "string"
    ? layer.style.classificationField
    : null;
  if (classificationField) preservePropertyKeys.add(classificationField);

  Object.values(layer.style ?? {}).forEach((value) => collectExpressionPropertyKeys(value, preservePropertyKeys));

  return { preservePropertyKeys: Array.from(preservePropertyKeys) };
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
  if (geo.includes("point")) return "circle";
  if (geo.includes("line")) return "line";
  if (geo.includes("polygon")) return "fill";

  // Default for unknown GeoJSON / vector-tile
  return "circle";
}

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
    case "heatmap":
      base["heatmap-opacity"] = opacity;
      break;
    case "raster":
      base["raster-opacity"] = opacity;
      break;
    default:
      break;
  }

  return base;
}

/** Opacity paint property key for a given MapLibre layer type */
function opacityKey(mlType: string): string {
  switch (mlType) {
    case "circle": return "circle-opacity";
    case "line": return "line-opacity";
    case "fill": return "fill-opacity";
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
): GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry | string {
  if (!layer.visible) {
    return EMPTY_FEATURE_COLLECTION;
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
  if (getInternalStyleValue(layer.style, LABEL_FIELD_STYLE_KEY)) {
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
      "text-allow-overlap": getInternalStyleValue<boolean>(layer.style, LABEL_ALLOW_OVERLAP_STYLE_KEY) ?? true,
      "text-ignore-placement": getInternalStyleValue<boolean>(layer.style, LABEL_IGNORE_PLACEMENT_STYLE_KEY) ?? true,
    },
    paint: {
      "text-color": getInternalStyleValue<string>(layer.style, LABEL_COLOR_STYLE_KEY) ?? "#F9FAFB",
      "text-halo-color": getInternalStyleValue<string>(layer.style, LABEL_HALO_COLOR_STYLE_KEY) ?? "rgba(17,24,39,0.9)",
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

function removeManagedLayer(map: maplibregl.Map, layerId: string): void {
  try {
    if (map.getLayer(labelLayerId(layerId))) map.removeLayer(labelLayerId(layerId));
    if (map.getLayer(companionCircleLayerId(layerId))) map.removeLayer(companionCircleLayerId(layerId));
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(layerId)) map.removeSource(layerId);
  } catch {
    /* layer already cleaned up by style/source change */
  }
}

function addManagedLayer(map: maplibregl.Map, layer: OverlayLayerConfig): void {
  const mlType = resolveLayerType(layer);

  if (layer.type === "raster-tile" && typeof layer.sourceData === "string") {
    map.addSource(layer.id, {
      type: "raster",
      tiles: [normalizeXyzTileUrlTemplate(layer.sourceData)],
      tileSize: 256,
    });
  } else if (layer.type === "vector-tile" && typeof layer.sourceData === "string") {
    map.addSource(layer.id, {
      type: "vector",
      tiles: [layer.sourceData],
    });
  } else {
    map.addSource(layer.id, {
      type: "geojson",
      data: resolveGeoJSONRenderData(layer),
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
    layerSpec["source-layer"] = "default";
  }

  map.addLayer(layerSpec as maplibregl.LayerSpecification);

  const companionCircleSpec = buildCompanionCircleLayerSpec(layer);
  if (companionCircleSpec) {
    map.addLayer(companionCircleSpec);
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
): void {
  const [styleRevision, setStyleRevision] = useState(0);
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
    if (!map) return;

    const prev = prevRef.current;
    const prevById = new Map(prev.map((l) => [l.id, l]));
    const currentIds = new Set(overlayLayers.map((l) => l.id));

    /* ---- Remove layers that no longer exist ---- */
    for (const prevLayer of prev) {
      if (!currentIds.has(prevLayer.id) && addedIdsRef.current.has(prevLayer.id)) {
        removeManagedLayer(map, prevLayer.id);
        addedIdsRef.current.delete(prevLayer.id);
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
          (prevLayer.sourceData !== layer.sourceData && !isGeoJSONBackedLayer(layer))
        );

      const managedLayerMissing = addedIdsRef.current.has(layer.id) && !map.getLayer(layer.id);
      const managedSourceMissing = addedIdsRef.current.has(layer.id) && !map.getSource(layer.id);

      if ((shouldRebuild || managedLayerMissing || managedSourceMissing) && addedIdsRef.current.has(layer.id)) {
        removeManagedLayer(map, layer.id);
        addedIdsRef.current.delete(layer.id);
      }

      if (!addedIdsRef.current.has(layer.id)) {
        /* New layer — add source + layer to MapLibre */
        try {
          addManagedLayer(map, layer);
          addedIdsRef.current.add(layer.id);
        } catch {
          /* Source/layer add failed — possibly invalid data */
        }
        continue;
      }

      /* Existing layer — diff and update properties */
      if (prevLayer) {
        if ((prevLayer.sourceData !== layer.sourceData || prevLayer.visible !== layer.visible) && isGeoJSONBackedLayer(layer)) {
          try {
            const source = map.getSource(layer.id) as maplibregl.GeoJSONSource | undefined;
            source?.setData(resolveGeoJSONRenderData(layer));
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
            if (map.getLayer(labelLayerId(layer.id))) {
              map.setPaintProperty(
                labelLayerId(layer.id),
                "text-opacity",
                Math.min(1, Math.max(0.25, layer.opacity)),
              );
            }
            if (map.getLayer(companionCircleLayerId(layer.id))) {
              map.setPaintProperty(
                companionCircleLayerId(layer.id),
                "circle-opacity",
                (getInternalStyleValue<number>(layer.style, COMPANION_CIRCLE_OPACITY_STYLE_KEY) ?? 0.55) * layer.opacity,
              );
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
      } catch { /* layer may not exist yet */ }
    }

    prevRef.current = overlayLayers.map((l) => ({ ...l }));
  }, [mapRef, overlayLayers, styleRevision]);

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
