import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { Bold, Italic, Type, X } from "lucide-react";
import {
  MAP_ANNOTATION_COLOR_PALETTE,
  MAP_ANNOTATION_LIMIT,
  type MapAnnotation,
  type MapAnnotationProperties,
  type MapAnnotationStyleSettings,
} from "./map/mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./map/mapTokens";

const ANNOTATION_SOURCE_ID = "synapse-map-annotations-src";
const ANNOTATION_LEADER_SOURCE_ID = "synapse-map-annotation-leaders-src";
export const ANNOTATION_SYMBOL_LAYER_ID = "synapse-map-annotations-symbol";
const ANNOTATION_SELECTED_LAYER_ID = "synapse-map-annotations-selected";
const ANNOTATION_LEADER_LAYER_ID = "synapse-map-annotation-leaders";

export interface MapAnnotationLayerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  active: boolean;
  annotations: MapAnnotation[];
  selectedAnnotationId: string | null;
  settings: MapAnnotationStyleSettings;
  onAddAnnotation: (annotation: {
    coordinate: [number, number];
    text: string;
    style: MapAnnotationStyleSettings;
    leaderTarget?: [number, number] | null;
  }) => MapAnnotation | null;
  onUpdateAnnotation: (id: string, patch: {
    geometry?: GeoJSON.Point;
    properties?: Partial<MapAnnotationProperties>;
  }) => void;
  onMoveAnnotation: (id: string, coordinate: [number, number]) => void;
  onRemoveAnnotation: (id: string) => void;
  onSelectAnnotation: (id: string | null) => void;
  onSettingsChange: (settings: Partial<MapAnnotationStyleSettings>) => void;
  onDeactivate: () => void;
  onAnnounce?: (message: string) => void;
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.sm,
  left: `calc(var(--map-dock-left, 0px) + ${MAP_SPACING.sm})`,
  zIndex: MAP_Z_INDEX.sidebar,
  width: "min(27rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const panelTitleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.interaction,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const controlsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(7rem, 1fr) auto auto",
  gap: MAP_SPACING.xs,
  alignItems: "center",
};

const secondaryControlsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
};

const inputStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: "1.875rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "rgba(255,255,255,0.04)",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const swatchStyle = (color: string, active: boolean): React.CSSProperties => ({
  width: "1.4rem",
  height: "1.4rem",
  borderRadius: MAP_RADIUS.sm,
  border: active ? MAP_STROKES.hairlineStrong : MAP_STROKES.hairlineSubtle,
  background: color,
  cursor: "pointer",
  boxShadow: active ? `0 0 0 1px ${MAP_COLORS.focus}` : MAP_SHADOWS.none,
});

const inlineLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
};

function isMapAlive(map: maplibregl.Map): boolean {
  try {
    return map.getStyle() != null;
  } catch {
    return false;
  }
}

function isStyleReady(map: maplibregl.Map): boolean {
  const maybeMap = map as maplibregl.Map & { isStyleLoaded?: () => boolean | void };
  if (typeof maybeMap.isStyleLoaded !== "function") {
    return true;
  }
  return maybeMap.isStyleLoaded() !== false;
}

function toCoordinate(event: maplibregl.MapMouseEvent): [number, number] {
  return [Number(event.lngLat.lng.toFixed(6)), Number(event.lngLat.lat.toFixed(6))];
}

function getAnnotationCoordinate(annotation: MapAnnotation): [number, number] {
  return [annotation.geometry.coordinates[0], annotation.geometry.coordinates[1]] as [number, number];
}

function buildAnnotationCollection(annotations: MapAnnotation[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: annotations.map((annotation) => ({
      type: "Feature",
      id: annotation.id,
      geometry: annotation.geometry,
      properties: {
        ...annotation.properties,
        __annotationId: annotation.id,
      },
    })),
  };
}

function buildLeaderCollection(annotations: MapAnnotation[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: annotations.flatMap((annotation) => {
      const target = annotation.properties.leaderLine ? annotation.properties.leaderTarget : null;
      if (!target) return [];
      const coordinate = getAnnotationCoordinate(annotation);
      if (Math.abs(target[0] - coordinate[0]) < 1e-9 && Math.abs(target[1] - coordinate[1]) < 1e-9) {
        return [];
      }
      return [{
        type: "Feature" as const,
        id: `${annotation.id}-leader`,
        geometry: {
          type: "LineString" as const,
          coordinates: [target, coordinate],
        },
        properties: {
          __annotationId: annotation.id,
          color: annotation.properties.color,
        },
      }];
    }),
  };
}

function getAnnotationIdFromFeature(feature: maplibregl.MapGeoJSONFeature | GeoJSON.Feature | undefined): string | null {
  const value = feature?.properties?.__annotationId;
  return typeof value === "string" ? value : null;
}

function queryAnnotationAtPoint(map: maplibregl.Map, point: maplibregl.PointLike): string | null {
  if (!map.getLayer(ANNOTATION_SYMBOL_LAYER_ID)) {
    return null;
  }
  const feature = map.queryRenderedFeatures(point, { layers: [ANNOTATION_SYMBOL_LAYER_ID] })[0] as maplibregl.MapGeoJSONFeature | undefined;
  return getAnnotationIdFromFeature(feature);
}

function ensureAnnotationLayers(map: maplibregl.Map): void {
  if (!isMapAlive(map) || !isStyleReady(map)) return;

  try {
    if (!map.getSource(ANNOTATION_LEADER_SOURCE_ID)) {
      map.addSource(ANNOTATION_LEADER_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getLayer(ANNOTATION_LEADER_LAYER_ID)) {
      map.addLayer({
        id: ANNOTATION_LEADER_LAYER_ID,
        type: "line",
        source: ANNOTATION_LEADER_SOURCE_ID,
        paint: {
          "line-color": ["coalesce", ["get", "color"], MAP_COLORS.interaction],
          "line-opacity": 0.82,
          "line-width": 1.25,
          "line-dasharray": [2, 2],
        },
      } as maplibregl.LayerSpecification);
    }
    if (!map.getSource(ANNOTATION_SOURCE_ID)) {
      map.addSource(ANNOTATION_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    if (!map.getLayer(ANNOTATION_SELECTED_LAYER_ID)) {
      map.addLayer({
        id: ANNOTATION_SELECTED_LAYER_ID,
        type: "circle",
        source: ANNOTATION_SOURCE_ID,
        filter: ["==", ["get", "__annotationId"], ""],
        paint: {
          "circle-radius": 9,
          "circle-color": "rgba(55, 148, 255, 0.16)",
          "circle-stroke-color": MAP_COLORS.interaction,
          "circle-stroke-width": 1.5,
        },
      } as maplibregl.LayerSpecification);
    }
    if (!map.getLayer(ANNOTATION_SYMBOL_LAYER_ID)) {
      map.addLayer({
        id: ANNOTATION_SYMBOL_LAYER_ID,
        type: "symbol",
        source: ANNOTATION_SOURCE_ID,
        layout: {
          "text-field": ["to-string", ["coalesce", ["get", "text"], ""]],
          "text-font": [
            "case",
            ["all", ["==", ["get", "bold"], true], ["==", ["get", "italic"], true]],
            ["literal", ["Open Sans Bold Italic", "Arial Unicode MS Bold"]],
            ["==", ["get", "bold"], true],
            ["literal", ["Open Sans Bold", "Arial Unicode MS Bold"]],
            ["==", ["get", "italic"], true],
            ["literal", ["Open Sans Italic", "Arial Unicode MS Regular"]],
            ["literal", ["Open Sans Regular", "Arial Unicode MS Regular"]],
          ],
          "text-size": ["coalesce", ["to-number", ["get", "fontSize"]], 16],
          "text-rotate": ["coalesce", ["to-number", ["get", "rotation"]], 0],
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        } as unknown as maplibregl.SymbolLayerSpecification["layout"],
        paint: {
          "text-color": ["coalesce", ["get", "color"], MAP_COLORS.interaction],
          "text-halo-color": ["case", ["==", ["get", "hasBackground"], true], "rgba(12, 12, 12, 0.92)", "rgba(12, 12, 12, 0)"],
          "text-halo-width": ["case", ["==", ["get", "hasBackground"], true], 3.5, 0],
          "text-opacity": 1,
        },
      } as maplibregl.LayerSpecification);
    }
  } catch {
    /* MapLibre can reject layer mutations during style transitions. */
  }
}

function syncAnnotationSources(map: maplibregl.Map, annotations: MapAnnotation[]): void {
  try {
    const annotationSource = map.getSource(ANNOTATION_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    annotationSource?.setData(buildAnnotationCollection(annotations));
    const leaderSource = map.getSource(ANNOTATION_LEADER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    leaderSource?.setData(buildLeaderCollection(annotations));
  } catch {
    /* ignore transient style reload errors */
  }
}

function removeAnnotationLayers(map: maplibregl.Map): void {
  try {
    for (const layerId of [ANNOTATION_SYMBOL_LAYER_ID, ANNOTATION_SELECTED_LAYER_ID, ANNOTATION_LEADER_LAYER_ID]) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    if (map.getSource(ANNOTATION_SOURCE_ID)) map.removeSource(ANNOTATION_SOURCE_ID);
    if (map.getSource(ANNOTATION_LEADER_SOURCE_ID)) map.removeSource(ANNOTATION_LEADER_SOURCE_ID);
  } catch {
    /* style already cleaned up */
  }
}

function keyboardTargetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

export const MapAnnotationLayer: React.FC<MapAnnotationLayerProps> = ({
  mapRef,
  active,
  annotations,
  selectedAnnotationId,
  settings,
  onAddAnnotation,
  onUpdateAnnotation,
  onMoveAnnotation,
  onRemoveAnnotation,
  onSelectAnnotation,
  onSettingsChange,
  onDeactivate,
  onAnnounce,
}) => {
  const [styleRevision, setStyleRevision] = useState(0);
  const annotationsRef = useRef(annotations);
  const selectedAnnotationIdRef = useRef(selectedAnnotationId);
  const settingsRef = useRef(settings);
  const dragAnnotationIdRef = useRef<string | null>(null);

  annotationsRef.current = annotations;
  selectedAnnotationIdRef.current = selectedAnnotationId;
  settingsRef.current = settings;

  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    ensureAnnotationLayers(map);
    syncAnnotationSources(map, annotationsRef.current);

    const handleStyleLoad = () => {
      setStyleRevision((revision) => revision + 1);
    };
    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
      if (isMapAlive(map)) {
        removeAnnotationLayers(map);
      }
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ensureAnnotationLayers(map);
    syncAnnotationSources(map, annotations);
  }, [annotations, mapRef, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(ANNOTATION_SELECTED_LAYER_ID)) return;
    try {
      map.setFilter(
        ANNOTATION_SELECTED_LAYER_ID,
        ["==", ["get", "__annotationId"], selectedAnnotationId ?? ""],
      );
    } catch {
      /* ignore */
    }
  }, [mapRef, selectedAnnotationId, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const annotationId = queryAnnotationAtPoint(map, event.point);
      if (annotationId) {
        onSelectAnnotation(annotationId);
        onAnnounce?.("Annotation selected");
        event.preventDefault();
        return;
      }

      if (!active) {
        return;
      }

      const coordinate = toCoordinate(event);
      const fallbackText = `Annotation ${annotationsRef.current.length + 1}`;
      const text = typeof window.prompt === "function"
        ? window.prompt("Annotation text", fallbackText)
        : fallbackText;
      if (text == null) return;

      const created = onAddAnnotation({
        coordinate,
        text,
        style: settingsRef.current,
        leaderTarget: settingsRef.current.leaderLine ? coordinate : null,
      });
      if (!created) {
        onAnnounce?.(`Maximum ${MAP_ANNOTATION_LIMIT} annotations reached`);
        return;
      }
      onAnnounce?.("Annotation placed");
      event.preventDefault();
    };

    const handleDoubleClick = (event: maplibregl.MapMouseEvent) => {
      const annotationId = queryAnnotationAtPoint(map, event.point);
      if (!annotationId) return;
      const annotation = annotationsRef.current.find((entry) => entry.id === annotationId);
      if (!annotation) return;
      event.preventDefault();
      const text = typeof window.prompt === "function"
        ? window.prompt("Edit annotation text", annotation.properties.text)
        : annotation.properties.text;
      if (text == null) return;
      onUpdateAnnotation(annotationId, { properties: { text } });
      onSelectAnnotation(annotationId);
      onAnnounce?.("Annotation text updated");
    };

    const handleMouseDown = (event: maplibregl.MapMouseEvent) => {
      const annotationId = queryAnnotationAtPoint(map, event.point);
      if (!annotationId) return;
      dragAnnotationIdRef.current = annotationId;
      onSelectAnnotation(annotationId);
      map.dragPan.disable();
      map.getCanvas().style.cursor = "grabbing";
      event.preventDefault();
    };

    const handleMouseMove = (event: maplibregl.MapMouseEvent) => {
      const draggingAnnotationId = dragAnnotationIdRef.current;
      if (draggingAnnotationId) {
        onMoveAnnotation(draggingAnnotationId, toCoordinate(event));
        event.preventDefault();
        return;
      }

      if (active) {
        map.getCanvas().style.cursor = "crosshair";
        return;
      }

      const annotationId = queryAnnotationAtPoint(map, event.point);
      map.getCanvas().style.cursor = annotationId ? "pointer" : "";
    };

    const handleMouseUp = () => {
      if (!dragAnnotationIdRef.current) return;
      dragAnnotationIdRef.current = null;
      map.dragPan.enable();
      map.getCanvas().style.cursor = active ? "crosshair" : "";
      onAnnounce?.("Annotation moved");
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDoubleClick);
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDoubleClick);
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
    };
  }, [active, mapRef, onAddAnnotation, onAnnounce, onMoveAnnotation, onSelectAnnotation, onUpdateAnnotation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboardTargetIsEditable(event.target)) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedAnnotationIdRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onRemoveAnnotation(selectedAnnotationIdRef.current);
        onAnnounce?.("Annotation deleted");
        return;
      }
      if (event.key === "Escape" && active) {
        event.preventDefault();
        event.stopPropagation();
        onDeactivate();
        onAnnounce?.("Annotation tool deactivated");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [active, onAnnounce, onDeactivate, onRemoveAnnotation]);

  const applySettings = useCallback((patch: Partial<MapAnnotationStyleSettings>) => {
    onSettingsChange(patch);
    if (!selectedAnnotation) return;
    const coordinate = getAnnotationCoordinate(selectedAnnotation);
    onUpdateAnnotation(selectedAnnotation.id, {
      properties: {
        ...patch,
        ...(patch.leaderLine === true && !selectedAnnotation.properties.leaderTarget
          ? { leaderTarget: coordinate }
          : {}),
        ...(patch.leaderLine === false ? { leaderTarget: null } : {}),
      },
    });
  }, [onSettingsChange, onUpdateAnnotation, selectedAnnotation]);

  const activeSettings = selectedAnnotation?.properties ?? settings;

  if (!active && !selectedAnnotation) {
    return null;
  }

  return (
    <div style={panelStyle} role="group" aria-label="Map annotation controls">
      <div style={panelHeaderStyle}>
        <span style={panelTitleStyle}>
          <Type size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          {selectedAnnotation ? "Annotation" : "Text Annotation"}
        </span>
        <button
          type="button"
          style={mapStyles.btn}
          onClick={() => {
            onSelectAnnotation(null);
            onDeactivate();
          }}
          aria-label="Close annotation controls"
        >
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </div>

      <div style={controlsStyle}>
        <input
          style={inputStyle}
          value={selectedAnnotation?.properties.text ?? ""}
          placeholder="Click map to place text"
          aria-label="Selected annotation text"
          disabled={!selectedAnnotation}
          onChange={(event) => {
            if (!selectedAnnotation) return;
            onUpdateAnnotation(selectedAnnotation.id, { properties: { text: event.target.value } });
          }}
        />
        <button
          type="button"
          style={activeSettings.bold ? mapStyles.btnActive : mapStyles.btn}
          onClick={() => applySettings({ bold: !activeSettings.bold })}
          aria-label="Toggle annotation bold"
          aria-pressed={activeSettings.bold}
        >
          <Bold size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button
          type="button"
          style={activeSettings.italic ? mapStyles.btnActive : mapStyles.btn}
          onClick={() => applySettings({ italic: !activeSettings.italic })}
          aria-label="Toggle annotation italic"
          aria-pressed={activeSettings.italic}
        >
          <Italic size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </div>

      <div style={secondaryControlsStyle}>
        <label style={inlineLabelStyle}>
          Size
          <input
            type="range"
            min={12}
            max={36}
            value={activeSettings.fontSize}
            onChange={(event) => applySettings({ fontSize: Number(event.target.value) })}
            aria-label="Annotation font size"
          />
          <span>{activeSettings.fontSize}px</span>
        </label>
        {MAP_ANNOTATION_COLOR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            style={swatchStyle(color, activeSettings.color.toLowerCase() === color.toLowerCase())}
            onClick={() => applySettings({ color })}
            aria-label={`Set annotation color ${color}`}
            aria-pressed={activeSettings.color.toLowerCase() === color.toLowerCase()}
          />
        ))}
        <label style={inlineLabelStyle}>
          Rotate
          <input
            type="number"
            min={-180}
            max={180}
            value={activeSettings.rotation}
            onChange={(event) => applySettings({ rotation: Number(event.target.value) })}
            aria-label="Annotation rotation angle"
            style={{ ...inputStyle, width: "4.5rem" }}
          />
        </label>
        <label style={inlineLabelStyle}>
          <input
            type="checkbox"
            checked={activeSettings.hasBackground}
            onChange={(event) => applySettings({ hasBackground: event.target.checked })}
          />
          Bg
        </label>
        <label style={inlineLabelStyle}>
          <input
            type="checkbox"
            checked={activeSettings.leaderLine}
            onChange={(event) => applySettings({ leaderLine: event.target.checked })}
          />
          Leader
        </label>
      </div>
    </div>
  );
};