import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import type { Position } from "geojson";
import {
  BoxSelect,
  Download,
  Focus,
  LassoSelect,
  ListFilter,
  MapPinned,
  MousePointer2,
  Trash2,
} from "lucide-react";
import type { MapNLQueryLayer } from "@/services/map/MapNLQueryBuilder";
import {
  collectMapQuerySelectedFeatures,
  createMapSpatialBboxShape,
  createMapSpatialPolygonShape,
  executeMapQueryPlan,
  getMapFeatureCollectionBounds,
  planMapQuery,
  type MapAttributeOperator,
  type MapQueryExecutionResult,
  type MapSpatialQueryShape,
  type MapSpatialQuerySource,
} from "@/services/map/query/MapQueryPlanner";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
} from "@/services/map/DrawnGeometryValidation";
import { downloadText } from "@/centerpanel/lib/download";
import type { DrawnFeature } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  resolveMapPaintColor,
} from "./mapTokens";

type SelectionDragTool = "rectangle" | "lasso";

export type { SelectionDragTool };

export interface MapSelectionToolsProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  queryableLayers: readonly MapNLQueryLayer[];
  selectedFeatureIds: Readonly<Record<string, readonly string[]>>;
  activeDragTool?: SelectionDragTool | null;
  showModeButtons?: boolean;
  /**
   * - "floating" — standalone floating card over the canvas (default)
   * - "flush"    — docked card without the floating shadow
   * - "bar"      — inline compact cluster for embedding in the unified command header
   * - "embedded" — full-width dock content without absolute positioning
   */
  variant?: "floating" | "flush" | "bar" | "embedded";
  leftInset?: number;
  topOffset?: React.CSSProperties["top"];
  onSetSelectedFeatures: (layerId: string, featureIds: string[]) => void;
  onClearSelectedFeatures: () => void;
  onSetActiveAnalysisResultLayers: (layerIds: string[]) => void;
  onAddDrawnFeature: (feature: DrawnFeature) => void;
  onActiveDragToolChange?: (tool: SelectionDragTool | null) => void;
  onSelectionResult?: (result: MapQueryExecutionResult, label: string) => void;
  onAnnounce?: (message: string) => void;
}

const SELECTION_SOURCE = "synapse-selection-query-src";
const SELECTION_FILL_LAYER = "synapse-selection-query-fill";
const SELECTION_LINE_LAYER = "synapse-selection-query-line";
const MIN_DRAG_DEGREES = 0.00001;

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
  width: "min(34rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.92))",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  zIndex: MAP_Z_INDEX.dropdown,
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const barClusterStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const barToolbarStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.1875rem",
  minWidth: MAP_SPACING.zero,
};

const barFilterPopoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  left: MAP_SPACING.zero,
  zIndex: MAP_Z_INDEX.dropdown + 2,
  display: "grid",
  gridTemplateColumns:
    "minmax(8rem, 1.1fr) minmax(7rem, 0.9fr) minmax(7rem, 0.9fr) minmax(8rem, 1fr) auto",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  width: "min(40rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 1rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
  overflowY: "auto",
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.96))",
  boxShadow: MAP_SHADOWS.dropdown,
};

const embeddedPanelStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gap: MAP_SPACING.sm,
  width: "100%",
  minWidth: 0,
  padding: MAP_SPACING.md,
  border: MAP_STROKES.none,
  borderRadius: 0,
  background: MAP_COLORS.transparent,
  boxShadow: MAP_SHADOWS.none,
};

const embeddedFilterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: MAP_SPACING.xs,
  alignItems: "stretch",
  minWidth: 0,
};

const barCountChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  height: "1.875rem",
  padding: `0 ${MAP_SPACING.sm}`,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.42))",
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const barIconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.875rem",
  height: "1.875rem",
  border: "1px solid transparent",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  flexShrink: 0,
};

const barActiveIconButtonStyle: React.CSSProperties = {
  ...barIconButtonStyle,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.62))",
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
};

const iconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.62))",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const activeIconButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.62))",
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const countChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minHeight: "2rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.42))",
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  whiteSpace: "nowrap",
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  minHeight: "1.6rem",
  background: "var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
};

const filterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 1.1fr) minmax(7rem, 0.9fr) minmax(7rem, 0.9fr) minmax(8rem, 1fr) auto",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
};

const inputStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  height: "2rem",
  padding: `0 ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.68))",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const applyButtonStyle: React.CSSProperties = {
  ...inputStyle,
  width: "fit-content",
  padding: `0 ${MAP_SPACING.md}`,
  color: MAP_COLORS.bg,
  background: MAP_COLORS.interaction,
  border: `1px solid ${MAP_COLORS.interaction}`,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: MAP_COLORS.textMuted,
};

function isMapAlive(map: maplibregl.Map): boolean {
  try {
    return map.getStyle() != null;
  } catch {
    return false;
  }
}

function featureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

function makeSelectionPolygonFromBounds(bounds: [number, number, number, number]): GeoJSON.Feature<GeoJSON.Polygon> {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ]],
    },
  };
}

function makeSelectionPolygonFromShape(shape: MapSpatialQueryShape): GeoJSON.Feature<GeoJSON.Polygon> {
  if (shape.kind === "bbox") {
    return makeSelectionPolygonFromBounds(shape.bounds);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [shape.ring],
    },
  };
}

function ensureSelectionLayers(map: maplibregl.Map): void {
  if (!isMapAlive(map)) return;
  const lineColor = resolveMapPaintColor(MAP_COLORS.interaction);
  try {
    if (!map.getSource(SELECTION_SOURCE)) {
      map.addSource(SELECTION_SOURCE, {
        type: "geojson",
        data: featureCollection([]),
      });
    }
    if (!map.getLayer(SELECTION_FILL_LAYER)) {
      map.addLayer({
        id: SELECTION_FILL_LAYER,
        type: "fill",
        source: SELECTION_SOURCE,
        paint: {
          "fill-color": lineColor,
          "fill-opacity": 0.12,
        },
      });
    }
    if (!map.getLayer(SELECTION_LINE_LAYER)) {
      map.addLayer({
        id: SELECTION_LINE_LAYER,
        type: "line",
        source: SELECTION_SOURCE,
        paint: {
          "line-color": lineColor,
          "line-width": 1.8,
          "line-dasharray": [3, 2],
        },
      });
    }
  } catch {
    // Map style swaps can briefly reject source/layer changes; the next event retries.
  }
}

function clearSelectionPreview(map: maplibregl.Map | null): void {
  if (!map || !isMapAlive(map)) return;
  const source = map.getSource(SELECTION_SOURCE) as maplibregl.GeoJSONSource | undefined;
  source?.setData(featureCollection([]));
}

function setSelectionPreview(map: maplibregl.Map, shape: MapSpatialQueryShape | null): void {
  ensureSelectionLayers(map);
  const source = map.getSource(SELECTION_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData(shape ? featureCollection([makeSelectionPolygonFromShape(shape)]) : featureCollection([]));
}

function removeSelectionLayers(map: maplibregl.Map | null): void {
  if (!map || !isMapAlive(map)) return;
  try {
    if (map.getLayer(SELECTION_LINE_LAYER)) map.removeLayer(SELECTION_LINE_LAYER);
    if (map.getLayer(SELECTION_FILL_LAYER)) map.removeLayer(SELECTION_FILL_LAYER);
    if (map.getSource(SELECTION_SOURCE)) map.removeSource(SELECTION_SOURCE);
  } catch {
    // Non-fatal during map teardown.
  }
}

function selectedCount(selectedFeatureIds: Readonly<Record<string, readonly string[]>>): number {
  return Object.values(selectedFeatureIds).reduce((total, ids) => total + ids.length, 0);
}

function expandDegenerateBounds(bounds: [number, number, number, number]): [number, number, number, number] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const lngSpan = Math.abs(maxLng - minLng);
  const latSpan = Math.abs(maxLat - minLat);
  const lngPad = Math.max(lngSpan * 0.05, 0.001);
  const latPad = Math.max(latSpan * 0.05, 0.001);
  return [
    minLng - lngPad,
    minLat - latPad,
    maxLng + lngPad,
    maxLat + latPad,
  ];
}

function toCoordinate(event: maplibregl.MapMouseEvent): [number, number] {
  return [+event.lngLat.lng.toFixed(6), +event.lngLat.lat.toFixed(6)];
}

function formatCount(count: number): string {
  return `${count.toLocaleString()} selected`;
}

function parseFilterValue(value: string, operator: MapAttributeOperator): string | number | boolean | null {
  const trimmed = value.trim();
  if (operator === "exists") return null;
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  const numeric = Number(trimmed);
  if (trimmed.length > 0 && Number.isFinite(numeric) && ["gt", "gte", "lt", "lte"].includes(operator)) {
    return numeric;
  }
  return trimmed;
}

export const MapSelectionTools: React.FC<MapSelectionToolsProps> = ({
  mapRef,
  queryableLayers,
  selectedFeatureIds,
  activeDragTool: activeDragToolProp,
  showModeButtons = true,
  variant = "floating",
  leftInset = 0,
  topOffset,
  onSetSelectedFeatures,
  onClearSelectedFeatures,
  onSetActiveAnalysisResultLayers,
  onAddDrawnFeature,
  onActiveDragToolChange,
  onSelectionResult,
  onAnnounce,
}) => {
  const [internalActiveDragTool, setInternalActiveDragTool] = useState<SelectionDragTool | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLayerId, setFilterLayerId] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] = useState<MapAttributeOperator>("contains");
  const [filterValue, setFilterValue] = useState("");
  const activeDragTool = activeDragToolProp ?? internalActiveDragTool;
  const queryableLayersRef = useRef(queryableLayers);
  const dragStartRef = useRef<[number, number] | null>(null);
  const lassoRingRef = useRef<Position[]>([]);
  const activeDragToolRef = useRef<SelectionDragTool | null>(activeDragTool);

  const setResolvedActiveDragTool = useCallback((tool: SelectionDragTool | null) => {
    if (activeDragToolProp === undefined) {
      setInternalActiveDragTool(tool);
    }
    onActiveDragToolChange?.(tool);
  }, [activeDragToolProp, onActiveDragToolChange]);

  queryableLayersRef.current = queryableLayers;
  activeDragToolRef.current = activeDragTool;

  const totalSelected = useMemo(() => selectedCount(selectedFeatureIds), [selectedFeatureIds]);
  const activeLayer = useMemo(
    () => queryableLayers.find((layer) => layer.id === filterLayerId) ?? queryableLayers[0] ?? null,
    [filterLayerId, queryableLayers],
  );
  const activeFields = useMemo(
    () => activeLayer?.fields.filter((field) => !field.startsWith("__")) ?? [],
    [activeLayer],
  );
  const selectedCollection = useMemo(
    () =>
      collectMapQuerySelectedFeatures({
        layers: queryableLayers,
        selectedFeatureIds,
        includeSelectionProperties: true,
      }),
    [queryableLayers, selectedFeatureIds],
  );
  const selectedBounds = useMemo(() => getMapFeatureCollectionBounds(selectedCollection), [selectedCollection]);

  useEffect(() => {
    if (!activeLayer) {
      setFilterLayerId("");
      setFilterField("");
      return;
    }
    setFilterLayerId((current) => current || activeLayer.id);
    setFilterField((current) => current || activeFields[0] || "");
  }, [activeFields, activeLayer]);

  const applyQueryResult = useCallback((result: MapQueryExecutionResult, label: string) => {
    onClearSelectedFeatures();
    const selectedLayerIds = result.layers
      .filter((layer) => layer.featureIds.length > 0)
      .map((layer) => layer.layerId);
    for (const layer of result.layers) {
      if (layer.featureIds.length > 0) {
        onSetSelectedFeatures(layer.layerId, layer.featureIds);
      }
    }
    onSetActiveAnalysisResultLayers(selectedLayerIds);
    onSelectionResult?.(result, label);
    if (result.totalMatched > 0) {
      onAnnounce?.(`${label} selected ${result.totalMatched.toLocaleString()} feature(s).`);
    } else {
      onAnnounce?.(`${label} returned no features.`);
    }
  }, [
    onAnnounce,
    onClearSelectedFeatures,
    onSelectionResult,
    onSetActiveAnalysisResultLayers,
    onSetSelectedFeatures,
  ]);

  const runSpatialSelection = useCallback((shape: MapSpatialQueryShape, source: MapSpatialQuerySource, label: string) => {
    const layers = queryableLayersRef.current;
    if (layers.length === 0) {
      onAnnounce?.("No queryable visible layers are available for selection.");
      return;
    }
    const plan = planMapQuery({
      kind: "spatial",
      layers,
      scope: {
        mode: "visible-layers",
        layerIds: layers.map((layer) => layer.id),
        bounds: shape.kind === "bbox" ? shape.bounds : shape.bounds,
        maxFeaturesPerLayer: 2_500,
        maxTotalFeatures: 5_000,
        reason: `${label} over visible queryable layers.`,
      },
      spatial: {
        source,
        predicate: "intersects",
        shape,
        spatialFilterOp: "clip",
      },
    });
    applyQueryResult(executeMapQueryPlan(plan), label);
  }, [applyQueryResult, onAnnounce]);

  const handleApplyFilter = useCallback(() => {
    const layer = activeLayer;
    const field = filterField.trim();
    if (!layer || field.length === 0) {
      onAnnounce?.("Select a queryable layer and field before applying an attribute filter.");
      return;
    }
    const plan = planMapQuery({
      kind: "attribute",
      layers: [layer],
      scope: {
        mode: "filter",
        layerIds: [layer.id],
        maxFeaturesPerLayer: 2_500,
        maxTotalFeatures: 5_000,
        reason: "Attribute filter selection over one queryable layer.",
      },
      attribute: {
        field,
        operator: filterOperator,
        value: parseFilterValue(filterValue, filterOperator),
      },
    });
    applyQueryResult(executeMapQueryPlan(plan), "Attribute filter");
  }, [activeLayer, applyQueryResult, filterField, filterOperator, filterValue, onAnnounce]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeDragTool) {
      return undefined;
    }

    ensureSelectionLayers(map);
    map.getCanvas().style.cursor = activeDragTool === "rectangle" ? "crosshair" : "cell";
    map.dragPan.disable();

    const onMouseDown = (event: maplibregl.MapMouseEvent) => {
      const coordinate = toCoordinate(event);
      dragStartRef.current = coordinate;
      lassoRingRef.current = activeDragToolRef.current === "lasso" ? [coordinate] : [];
      event.preventDefault();
    };

    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const coordinate = toCoordinate(event);
      if (activeDragToolRef.current === "rectangle") {
        setSelectionPreview(map, createMapSpatialBboxShape([start[0], start[1], coordinate[0], coordinate[1]]));
        return;
      }
      const ring = lassoRingRef.current;
      const last = ring[ring.length - 1];
      if (!last || Math.abs(coordinate[0] - Number(last[0])) > MIN_DRAG_DEGREES || Math.abs(coordinate[1] - Number(last[1])) > MIN_DRAG_DEGREES) {
        ring.push(coordinate);
      }
      const polygonShape = createMapSpatialPolygonShape(ring);
      setSelectionPreview(map, polygonShape);
    };

    const onMouseUp = (event: maplibregl.MapMouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const coordinate = toCoordinate(event);
      const tool = activeDragToolRef.current;
      dragStartRef.current = null;

      if (tool === "rectangle") {
        const meaningful = Math.abs(coordinate[0] - start[0]) > MIN_DRAG_DEGREES || Math.abs(coordinate[1] - start[1]) > MIN_DRAG_DEGREES;
        if (meaningful) {
          runSpatialSelection(
            createMapSpatialBboxShape([start[0], start[1], coordinate[0], coordinate[1]]),
            "rectangle-select",
            "Rectangle selection",
          );
        }
      } else {
        const shape = createMapSpatialPolygonShape([...lassoRingRef.current, coordinate]);
        if (shape) {
          runSpatialSelection(shape, "lasso-select", "Lasso selection");
        }
      }

      lassoRingRef.current = [];
      clearSelectionPreview(map);
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
      setResolvedActiveDragTool(null);
      event.preventDefault();
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      if (isMapAlive(map)) {
        map.off("mousedown", onMouseDown);
        map.off("mousemove", onMouseMove);
        map.off("mouseup", onMouseUp);
        clearSelectionPreview(map);
        map.dragPan.enable();
        map.getCanvas().style.cursor = "";
      }
    };
  }, [activeDragTool, mapRef, runSpatialSelection, setResolvedActiveDragTool]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const handleStyleLoad = () => {
      if (activeDragToolRef.current) ensureSelectionLayers(map);
    };
    map.on("style.load", handleStyleLoad);
    return () => {
      if (!isMapAlive(map)) return;
      map.off("style.load", handleStyleLoad);
      removeSelectionLayers(map);
    };
  }, [mapRef]);

  const handleExportSelection = useCallback(() => {
    if (selectedCollection.features.length === 0) {
      onAnnounce?.("No selected features are available to export.");
      return;
    }
    const sourceLayerIds = Object.entries(selectedFeatureIds)
      .filter(([, ids]) => ids.length > 0)
      .map(([layerId]) => layerId);
    const payload: Record<string, unknown> = {
      ...selectedCollection,
      properties: {
        exportedAt: new Date().toISOString(),
        sourceLayerIds,
        selectedFeatureCount: selectedCollection.features.length,
        provenance: "map-query-planner-selection",
      },
    };
    if (selectedBounds) {
      payload.bbox = selectedBounds;
    }
    downloadText(
      `map_selection_${Date.now()}.geojson`,
      JSON.stringify(payload, null, 2),
      "application/geo+json;charset=utf-8",
    );
    onAnnounce?.(`Exported ${selectedCollection.features.length.toLocaleString()} selected feature(s).`);
  }, [onAnnounce, selectedBounds, selectedCollection, selectedFeatureIds]);

  const handleFocusSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map || !selectedBounds) {
      onAnnounce?.("No selected feature extent is available.");
      return;
    }
    const [minLng, minLat, maxLng, maxLat] = selectedBounds;
    if (minLng === maxLng && minLat === maxLat) {
      map.flyTo({ center: [minLng, minLat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
    } else {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 72, duration: 700, essential: true },
      );
    }
    onAnnounce?.("Map focused on selected features.");
  }, [mapRef, onAnnounce, selectedBounds]);

  const handleSendSelectionToAoi = useCallback(() => {
    if (!selectedBounds || selectedCollection.features.length === 0) {
      onAnnounce?.("Select one or more features before creating an AOI.");
      return;
    }
    const polygon = makeSelectionPolygonFromBounds(expandDegenerateBounds(selectedBounds));
    const validation = validateDrawnGeometry(polygon.geometry);
    if (validation.status === "blocked") {
      onAnnounce?.(`Selection AOI blocked: ${summarizeDrawnGeometryValidation(validation)}`);
      return;
    }
    const createdAt = new Date().toISOString();
    const feature: DrawnFeature = {
      id: `selection-aoi-${Date.now()}`,
      geometry: polygon.geometry,
      properties: {
        label: "Selection AOI",
        createdAt,
        style: {
          strokeColor: MAP_COLORS.interaction,
          fillColor: MAP_COLORS.interaction,
          strokeWidth: 2,
          fillOpacity: 0.12,
        },
        validation,
      },
    };
    onAddDrawnFeature(feature);
    onAnnounce?.(`Selection AOI created from ${selectedCollection.features.length.toLocaleString()} feature(s).`);
  }, [onAddDrawnFeature, onAnnounce, selectedBounds, selectedCollection.features.length]);

  const clearDisabled = totalSelected === 0;
  const selectedActionsDisabled = totalSelected === 0 || selectedCollection.features.length === 0;
  const panelLeft = `calc(${leftInset}px + ${MAP_SPACING.md})`;
  const flushStyle: React.CSSProperties = variant === "flush"
    ? {
        border: MAP_STROKES.hairline,
        borderRadius: MAP_RADIUS.sm,
        background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.82))",
        boxShadow: MAP_SHADOWS.none,
      }
    : {};

  const isBar = variant === "bar";
  const isEmbedded = variant === "embedded";
  const chipStyle = isBar ? barCountChipStyle : countChipStyle;
  const btnStyle = isBar ? barIconButtonStyle : iconButtonStyle;
  const btnActiveStyle = isBar ? barActiveIconButtonStyle : activeIconButtonStyle;
  const compactZeroSelectionChip = false;
  const selectionCountLabel = formatCount(totalSelected);

  const toolbarRow = (
    <div style={isBar ? barToolbarStyle : toolbarStyle}>
      <span
        style={{
          ...chipStyle,
          ...(compactZeroSelectionChip ? {
            width: "1.875rem",
            padding: MAP_SPACING.zero,
            justifyContent: "center",
            gap: MAP_SPACING.zero,
          } satisfies React.CSSProperties : null),
        }}
        data-testid="map-selection-count-chip"
        aria-label={selectionCountLabel}
        title={selectionCountLabel}
      >
        {compactZeroSelectionChip ? null : <MousePointer2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
        {compactZeroSelectionChip ? "0" : selectionCountLabel}
      </span>
      {showModeButtons ? (
        <>
          <button
            type="button"
            data-testid="map-rectangle-select-tool"
            aria-label={activeDragTool === "rectangle" ? "Cancel rectangle select" : "Rectangle select"}
            title="Rectangle select"
            style={activeDragTool === "rectangle" ? btnActiveStyle : btnStyle}
            onClick={() => setResolvedActiveDragTool(activeDragTool === "rectangle" ? null : "rectangle")}
          >
            <BoxSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-testid="map-lasso-select-tool"
            aria-label={activeDragTool === "lasso" ? "Cancel lasso select" : "Lasso select"}
            title="Lasso select"
            style={activeDragTool === "lasso" ? btnActiveStyle : btnStyle}
            onClick={() => setResolvedActiveDragTool(activeDragTool === "lasso" ? null : "lasso")}
          >
            <LassoSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </>
      ) : null}
      <button
        type="button"
        aria-label={filterOpen ? "Close filter select" : "Filter select"}
        title="Filter select"
        style={filterOpen ? btnActiveStyle : btnStyle}
        onClick={() => setFilterOpen((current) => !current)}
      >
        <ListFilter size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      </button>
      <span style={dividerStyle} aria-hidden="true" />
      <button
        type="button"
        aria-label="Export selected features"
        title="Export selected features"
        disabled={selectedActionsDisabled}
        style={{ ...btnStyle, ...(selectedActionsDisabled ? disabledButtonStyle : {}) }}
        onClick={handleExportSelection}
      >
        <Download size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Focus selected features"
        title="Focus selected features"
        disabled={selectedActionsDisabled}
        style={{ ...btnStyle, ...(selectedActionsDisabled ? disabledButtonStyle : {}) }}
        onClick={handleFocusSelection}
      >
        <Focus size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Send selected features to AOI"
        title="Send selected features to AOI"
        disabled={selectedActionsDisabled}
        style={{ ...btnStyle, ...(selectedActionsDisabled ? disabledButtonStyle : {}) }}
        onClick={handleSendSelectionToAoi}
      >
        <MapPinned size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Clear selected features"
        title="Clear selected features"
        disabled={clearDisabled}
        style={{ ...btnStyle, ...(clearDisabled ? disabledButtonStyle : {}) }}
        onClick={() => {
          onClearSelectedFeatures();
          onSetActiveAnalysisResultLayers([]);
          onAnnounce?.("Selection cleared.");
        }}
      >
        <Trash2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      </button>
    </div>
  );

  const filterControls = (
    <>
      <select
        aria-label="Selection filter layer"
        value={activeLayer?.id ?? ""}
        style={inputStyle}
        onChange={(event) => {
          setFilterLayerId(event.target.value);
          setFilterField("");
        }}
      >
        {queryableLayers.map((layer) => (
          <option key={layer.id} value={layer.id}>{layer.name}</option>
        ))}
      </select>
      <select
        aria-label="Selection filter field"
        value={filterField}
        style={inputStyle}
        onChange={(event) => setFilterField(event.target.value)}
      >
        {activeFields.map((field) => (
          <option key={field} value={field}>{field}</option>
        ))}
      </select>
      <select
        aria-label="Selection filter operator"
        value={filterOperator}
        style={inputStyle}
        onChange={(event) => setFilterOperator(event.target.value as MapAttributeOperator)}
      >
        <option value="contains">contains</option>
        <option value="equals">equals</option>
        <option value="not-equals">not equals</option>
        <option value="starts-with">starts with</option>
        <option value="ends-with">ends with</option>
        <option value="gt">&gt;</option>
        <option value="gte">&gt;=</option>
        <option value="lt">&lt;</option>
        <option value="lte">&lt;=</option>
        <option value="exists">exists</option>
      </select>
      <input
        aria-label="Selection filter value"
        value={filterValue}
        disabled={filterOperator === "exists"}
        style={{ ...inputStyle, ...(filterOperator === "exists" ? disabledButtonStyle : {}) }}
        onChange={(event) => setFilterValue(event.target.value)}
      />
      <button
        type="button"
        style={{
          ...applyButtonStyle,
          ...(queryableLayers.length === 0 || !filterField ? disabledButtonStyle : {}),
        }}
        disabled={queryableLayers.length === 0 || !filterField}
        onClick={handleApplyFilter}
      >
        Apply
      </button>
    </>
  );

  if (isBar) {
    return (
      <div
        style={barClusterStyle}
        aria-label="Map selection tools"
        data-testid="map-selection-tools"
        data-map-selection-variant="bar"
      >
        {toolbarRow}
        {filterOpen ? (
          <div style={barFilterPopoverStyle} data-testid="map-selection-filter-row">
            {filterControls}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section
      aria-label="Map selection tools"
      data-testid="map-selection-tools"
      data-map-selection-variant={variant}
      style={isEmbedded
        ? embeddedPanelStyle
        : {
            ...panelStyle,
            ...flushStyle,
            top: topOffset ?? panelStyle.top,
            left: panelLeft,
            maxWidth: `calc(100% - ${leftInset}px - ${MAP_SPACING.lg})`,
          }}
    >
      {toolbarRow}
      {filterOpen ? (
        <div style={isEmbedded ? embeddedFilterRowStyle : filterRowStyle} data-testid="map-selection-filter-row">
          {filterControls}
        </div>
      ) : (
        <span style={hintStyle}>
          {activeDragTool
            ? activeDragTool === "rectangle"
              ? "Drag a box on the map to select bounded query results."
              : "Drag a lasso on the map to select bounded query results."
            : `${queryableLayers.length.toLocaleString()} queryable visible layer(s)`}
        </span>
      )}
    </section>
  );
};

export default MapSelectionTools;
