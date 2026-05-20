/* ================================================================== */
/*  MapDrawingManager                                                  */
/*  Manages drawing interactions on the MapLibre GL canvas.            */
/*  Renders ghost feedback, vertex handles, and the feature sidebar.   */
/* ================================================================== */

import React, { useCallback, useEffect, useRef } from "react";
import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";
import type maplibregl from "maplibre-gl";
import type { DrawnFeature, DrawnGeometryValidation, DrawToolId } from "./map/mapTypes";
import {
  IconLine,
  IconPencil,
  IconPoint,
  IconPolygon,
  IconTrash,
  IconUnknown,
} from "./map/MapIcons";
import {
  drawId,
  featureCollection,
  haversineDistance,
  isWithinPixels,
  makeCircle,
  makeLineString,
  makePoint,
  makePolygon,
  makeRectangle,
} from "../../utils/drawingHelpers";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_ICON_SIZES,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
  resolveMapPaintColor,
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const SNAP_TOLERANCE_PX = 10;
const DRAW_SOURCE = "synapse-draw-src";
const DRAW_FILL_LAYER = "synapse-draw-fill";
const DRAW_LINE_LAYER = "synapse-draw-line";
const DRAW_VERTEX_LAYER = "synapse-draw-vertex";
const GHOST_SOURCE = "synapse-ghost-src";
const GHOST_LINE_LAYER = "synapse-ghost-line";
const GHOST_FILL_LAYER = "synapse-ghost-fill";
const GHOST_VERTEX_LAYER = "synapse-ghost-vertex";
const GHOST_SNAP_LAYER = "synapse-ghost-snap";

const DRAW_TOOL_LABELS: Record<DrawToolId, string> = {
  point: "Point",
  linestring: "Line",
  polygon: "Polygon",
  rectangle: "Rectangle",
  circle: "Circle",
};

const DRAWING_VALIDATION_BASE_CAVEAT =
  "Drawing coordinates use map display longitude/latitude; structural validation does not verify a source CRS.";

/** Returns false if the MapLibre instance has already been destroyed via map.remove(). */
const isMapAlive = (map: maplibregl.Map): boolean => {
  try {
    // After map.remove(), map.style is nullified.
    // getStyle() returns undefined silently; getLayer() throws.
    return map.getStyle() != null;
  } catch {
    return false;
  }
};

function createDrawnValidation(
  status: DrawnGeometryValidation["status"],
  issueCodes: string[],
  caveats: string[],
): DrawnGeometryValidation {
  return {
    status,
    issueCodes: Array.from(new Set(issueCodes)),
    caveats: Array.from(new Set(caveats)),
    checkedAt: new Date().toISOString(),
  };
}

function visitDrawnGeometryPositions(
  geometry: GeoJSON.Geometry,
  visitor: (position: readonly number[]) => void,
): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitDrawnGeometryPositions(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visitor(value as readonly number[]);
      return;
    }
    value.forEach(walk);
  };

  walk(geometry.coordinates);
}

function isFiniteCoordinatePair(position: readonly number[]): boolean {
  return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function coordinateKey(position: readonly number[]): string {
  return `${position[0]},${position[1]}`;
}

function positionsMatch(first: readonly number[], second: readonly number[]): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

function distinctPositionCount(positions: readonly (readonly number[])[]): number {
  return new Set(positions.map(coordinateKey)).size;
}

function polygonRingHasArea(ring: readonly (readonly number[])[]): boolean {
  let signedArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index]!;
    const next = ring[index + 1]!;
    signedArea += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(signedArea) > 1e-12;
}

function validateLinePositions(
  positions: readonly (readonly number[])[],
  blockedIssueCodes: string[],
  caveats: string[],
): void {
  if (positions.length < 2) {
    blockedIssueCodes.push("short_line");
    caveats.push("Line drawings need at least two coordinate positions.");
    return;
  }
  if (distinctPositionCount(positions) < 2) {
    blockedIssueCodes.push("degenerate_line");
    caveats.push("Line drawings need at least two distinct positions.");
  }
}

function validatePolygonRing(
  ring: readonly (readonly number[])[],
  blockedIssueCodes: string[],
  caveats: string[],
): void {
  if (ring.length < 4) {
    blockedIssueCodes.push("short_ring");
    caveats.push("Polygon drawings need at least three vertices and a closing coordinate.");
    return;
  }
  if (!positionsMatch(ring[0]!, ring[ring.length - 1]!)) {
    blockedIssueCodes.push("non_closed_ring");
    caveats.push("Polygon rings must close before they can be used as an AOI.");
  }
  if (distinctPositionCount(ring.slice(0, -1)) < 3) {
    blockedIssueCodes.push("degenerate_polygon");
    caveats.push("Polygon drawings need at least three distinct positions.");
  }
  if (!polygonRingHasArea(ring)) {
    blockedIssueCodes.push("zero_area_polygon");
    caveats.push("Polygon drawings must enclose a measurable area.");
  }
}

function validateDrawnGeometry(geometry: GeoJSON.Geometry): DrawnGeometryValidation {
  const blockedIssueCodes: string[] = [];
  const warningIssueCodes: string[] = [];
  const caveats = [DRAWING_VALIDATION_BASE_CAVEAT];

  visitDrawnGeometryPositions(geometry, (position) => {
    if (!isFiniteCoordinatePair(position)) {
      blockedIssueCodes.push("invalid_numeric_coordinate");
      caveats.push("Every drawn coordinate must be finite before it can be stored.");
      return;
    }
    if (Math.abs(position[1]) > 90) {
      warningIssueCodes.push("latitude_out_of_range");
      caveats.push("At least one latitude is outside the WGS84 display range.");
    }
  });

  if (geometry.type === "Point") {
    if (!isFiniteCoordinatePair(geometry.coordinates)) {
      blockedIssueCodes.push("invalid_point_coordinate");
    }
  } else if (geometry.type === "LineString") {
    validateLinePositions(geometry.coordinates, blockedIssueCodes, caveats);
  } else if (geometry.type === "MultiLineString") {
    geometry.coordinates.forEach((linePositions) => validateLinePositions(linePositions, blockedIssueCodes, caveats));
  } else if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => validatePolygonRing(ring, blockedIssueCodes, caveats));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => validatePolygonRing(ring, blockedIssueCodes, caveats));
    });
  } else if (geometry.type === "GeometryCollection" && geometry.geometries.length === 0) {
    blockedIssueCodes.push("empty_geometry_collection");
    caveats.push("Geometry collections need at least one geometry.");
  }

  try {
    if ((geometry.type === "Polygon" || geometry.type === "MultiPolygon")
      && kinks({ type: "Feature", geometry, properties: {} }).features.length > 0) {
      blockedIssueCodes.push("self_intersection");
      caveats.push("Self-intersecting polygons are blocked because area and overlay results are unreliable.");
    }
    if (!booleanValid(geometry)) {
      blockedIssueCodes.push("invalid_geojson_geometry");
      caveats.push("The drawn geometry failed GeoJSON validity checks.");
    }
  } catch {
    warningIssueCodes.push("topology_validation_unknown");
    caveats.push("Topology validation could not complete for this drawing.");
  }

  if (blockedIssueCodes.length > 0) {
    return createDrawnValidation("blocked", blockedIssueCodes, caveats);
  }
  if (warningIssueCodes.length > 0) {
    return createDrawnValidation("warning", warningIssueCodes, caveats);
  }
  return createDrawnValidation("valid", [], caveats);
}

function getDrawnValidationLabel(status: DrawnGeometryValidation["status"] | undefined): string {
  if (status === "valid") return "Validated";
  if (status === "warning") return "Needs review";
  if (status === "blocked") return "Invalid";
  return "Validation unknown";
}

function getDrawnValidationColor(status: DrawnGeometryValidation["status"] | undefined): string {
  if (status === "valid") return MAP_COLORS.success;
  if (status === "warning" || status === "unknown") return MAP_COLORS.warning;
  if (status === "blocked") return MAP_COLORS.error;
  return MAP_COLORS.textMuted;
}

function summarizeValidationBlock(validation: DrawnGeometryValidation): string {
  return validation.caveats.find((caveat) => caveat !== DRAWING_VALIDATION_BASE_CAVEAT)
    ?? "Geometry validation blocked this drawing.";
}

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapDrawingManagerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  activeDrawTool: DrawToolId | null;
  sidebarVisible?: boolean;
  seedDrawStart?: {
    coordinate: [number, number];
    tool: DrawToolId;
    token: number;
  } | null;
  drawnFeatures: DrawnFeature[];
  selectedFeatureId: string | null;
  onAddFeature: (feature: DrawnFeature) => void;
  onRemoveFeature: (id: string) => void;
  onUpdateFeature: (id: string, patch: Partial<DrawnFeature>) => void;
  onClearFeatures: () => void;
  onSelectFeature: (id: string | null) => void;
  onCancelDraw: () => void;
  onSeedHandled?: (token: number) => void;
  onAnnounce?: (msg: string) => void;
}

/* ================================================================== */
/*  Sidebar styles                                                     */
/* ================================================================== */

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.drawingPanelWidth),
};

const headerStyle: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
};

const rowStyle: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  cursor: "pointer",
};

const rowSelectedStyle: React.CSSProperties = {
  ...rowStyle,
  ...mapStyles.sidePanelRowActive,
};

const smallBtn: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.5rem",
};

const emptyStyle: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapDrawingManager: React.FC<MapDrawingManagerProps> = ({
  mapRef,
  activeDrawTool,
  sidebarVisible = true,
  seedDrawStart = null,
  drawnFeatures,
  selectedFeatureId,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  onClearFeatures,
  onSelectFeature,
  onCancelDraw,
  onSeedHandled,
  onAnnounce,
}) => {
  /* ---- Refs for transient drawing state (NOT React state to avoid
         excessive re-renders during mousemove) ---- */
  const verticesRef = useRef<[number, number][]>([]);
  const cursorRef = useRef<[number, number] | null>(null);
  const snapRef = useRef<[number, number] | null>(null);
  const dragStartRef = useRef<[number, number] | null>(null);
  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeDrawTool);
  const featuresRef = useRef(drawnFeatures);
  const handledSeedTokenRef = useRef<number | null>(null);

  // Keep refs in sync
  activeToolRef.current = activeDrawTool;
  featuresRef.current = drawnFeatures;

  /* ---- Editing state ---- */
  const editingRef = useRef<{
    featureId: string;
    vertexIndex: number;
  } | null>(null);

  /* ================================================================ */
  /*  MapLibre source/layer lifecycle                                  */
  /* ================================================================ */

  const ensureSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) return;
    // MapLibre paint props cannot parse CSS var()/color-mix(); resolve first.
    const accentColor = resolveMapPaintColor(MAP_COLORS.interaction);
    const vertexStrokeColor = resolveMapPaintColor(MAP_COLORS.white);
    const bgColor = resolveMapPaintColor(MAP_COLORS.bg);
    try {
      if (!map.getSource(DRAW_SOURCE)) {
        map.addSource(DRAW_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });
        map.addLayer({
          id: DRAW_FILL_LAYER,
          type: "fill",
          source: DRAW_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": accentColor,
            "fill-opacity": 0.15,
          },
        });
        map.addLayer({
          id: DRAW_LINE_LAYER,
          type: "line",
          source: DRAW_SOURCE,
          paint: {
            "line-color": accentColor,
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
        map.addLayer({
          id: DRAW_VERTEX_LAYER,
          type: "circle",
          source: DRAW_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": accentColor,
            "circle-stroke-color": vertexStrokeColor,
            "circle-stroke-width": 2,
          },
        });
      }
      if (!map.getSource(GHOST_SOURCE)) {
        map.addSource(GHOST_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });
        map.addLayer({
          id: GHOST_FILL_LAYER,
          type: "fill",
          source: GHOST_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": accentColor,
            "fill-opacity": 0.08,
          },
        });
        map.addLayer({
          id: GHOST_LINE_LAYER,
          type: "line",
          source: GHOST_SOURCE,
          paint: {
            "line-color": accentColor,
            "line-width": 1.5,
            "line-dasharray": [4, 4],
          },
        });
        map.addLayer({
          id: GHOST_VERTEX_LAYER,
          type: "circle",
          source: GHOST_SOURCE,
          filter: ["all", ["==", "$type", "Point"], ["!=", "_snap", true]],
          paint: {
            "circle-radius": 4,
            "circle-color": accentColor,
            "circle-stroke-color": bgColor,
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: GHOST_SNAP_LAYER,
          type: "circle",
          source: GHOST_SOURCE,
          filter: ["all", ["==", "$type", "Point"], ["==", "_snap", true]],
          paint: {
            "circle-radius": 7,
            "circle-color": bgColor,
            "circle-stroke-color": accentColor,
            "circle-stroke-width": 2.5,
          },
        });
      }
    } catch {
      /* Source/layer add may fail during style transitions — safe to ignore */
    }
  }, []);

  const removeSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) return;
    for (const lid of [
      DRAW_FILL_LAYER,
      DRAW_LINE_LAYER,
      DRAW_VERTEX_LAYER,
      GHOST_SNAP_LAYER,
      GHOST_VERTEX_LAYER,
      GHOST_LINE_LAYER,
      GHOST_FILL_LAYER,
    ]) {
      if (map.getLayer(lid)) map.removeLayer(lid);
    }
    if (map.getSource(DRAW_SOURCE)) map.removeSource(DRAW_SOURCE);
    if (map.getSource(GHOST_SOURCE)) map.removeSource(GHOST_SOURCE);
  }, []);

  /* ================================================================ */
  /*  Render features to MapLibre                                      */
  /* ================================================================ */

  const syncFeaturesToMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    const src = map.getSource(DRAW_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    for (const f of featuresRef.current) {
      features.push({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties, _fid: f.id },
      });
      // Also render vertex dots for editable features
      if (f.id === selectedFeatureId && f.geometry.type === "Polygon") {
        const ring = (f.geometry as GeoJSON.Polygon).coordinates[0];
        for (let i = 0; i < ring.length - 1; i++) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: ring[i] },
            properties: { _vertex: true, _fid: f.id, _vi: i },
          });
        }
      } else if (f.id === selectedFeatureId && f.geometry.type === "LineString") {
        const coords = (f.geometry as GeoJSON.LineString).coordinates;
        for (let i = 0; i < coords.length; i++) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: coords[i] },
            properties: { _vertex: true, _fid: f.id, _vi: i },
          });
        }
      }
    }
    src.setData(featureCollection(features));
  }, [mapRef, selectedFeatureId]);

  /* ================================================================ */
  /*  Ghost preview rendering                                          */
  /* ================================================================ */

  const syncGhost = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    const src = map.getSource(GHOST_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const verts = verticesRef.current;
    const cursor = snapRef.current ?? cursorRef.current;
    const tool = activeToolRef.current;

    if (!tool || !cursor) {
      src.setData(featureCollection([]));
      return;
    }

    const features: GeoJSON.Feature[] = [];

    if (snapRef.current) {
      features.push({
        type: "Feature",
        geometry: makePoint(snapRef.current),
        properties: { _snap: true },
      });
    }

    if (verts.length === 0) {
      src.setData(featureCollection(features));
      return;
    }

    if (tool === "linestring") {
      const coords = [...verts, cursor];
      features.push({
        type: "Feature",
        geometry: makeLineString(coords),
        properties: {},
      });
      // Vertex dots
      for (const c of verts) {
        features.push({
          type: "Feature",
          geometry: makePoint(c),
          properties: {},
        });
      }
    } else if (tool === "polygon") {
      const coords = [...verts, cursor, verts[0]];
      features.push({
        type: "Feature",
        geometry: makePolygon(coords),
        properties: {},
      });
      for (const c of verts) {
        features.push({
          type: "Feature",
          geometry: makePoint(c),
          properties: {},
        });
      }
    } else if (tool === "rectangle" && dragStartRef.current) {
      features.push({
        type: "Feature",
        geometry: makeRectangle(dragStartRef.current, cursor),
        properties: {},
      });
    } else if (tool === "circle" && verts.length === 1) {
      const radius = haversineDistance(verts[0], cursor);
      features.push({
        type: "Feature",
        geometry: makeCircle(verts[0], radius),
        properties: {},
      });
    }

    src.setData(featureCollection(features));
  }, [mapRef]);

  /* ================================================================ */
  /*  Snap helper                                                      */
  /* ================================================================ */

  const trySnap = useCallback(
    (lngLat: [number, number], map: maplibregl.Map): [number, number] | null => {
      const pt = map.project(lngLat);
      for (const f of featuresRef.current) {
        let coords: number[][] = [];
        if (f.geometry.type === "Polygon") {
          coords = (f.geometry as GeoJSON.Polygon).coordinates[0];
        } else if (f.geometry.type === "LineString") {
          coords = (f.geometry as GeoJSON.LineString).coordinates;
        } else if (f.geometry.type === "Point") {
          coords = [(f.geometry as GeoJSON.Point).coordinates];
        }
        for (const c of coords) {
          const cp = map.project([c[0], c[1]]);
          if (isWithinPixels(pt, cp, SNAP_TOLERANCE_PX)) {
            return [c[0], c[1]];
          }
        }
      }
      return null;
    },
    [],
  );

  /* ================================================================ */
  /*  Feature finalization helpers                                     */
  /* ================================================================ */

  const finishFeature = useCallback(
    (geometry: GeoJSON.Geometry, label: string) => {
      const validation = validateDrawnGeometry(geometry);
      if (validation.status === "blocked") {
        onAnnounce?.(`${label} was not added: ${summarizeValidationBlock(validation)}`);
        return;
      }

      const feature: DrawnFeature = {
        id: drawId(),
        geometry,
        properties: {
          label,
          createdAt: new Date().toISOString(),
          validation,
        },
      };
      onAddFeature(feature);
      onAnnounce?.(
        validation.status === "warning"
          ? `${label} added with geometry validation warnings`
          : `${label} added`,
      );

      /* Immediately push the new feature to the MapLibre source so it
         renders without waiting for the React re-render → useEffect cycle.
         The sync effect will overwrite this with the same data later. */
      const map = mapRef.current;
      if (map && isMapAlive(map)) {
        const src = map.getSource(DRAW_SOURCE) as maplibregl.GeoJSONSource | undefined;
        if (src) {
          const all = [...featuresRef.current, feature];
          const geoFeatures: GeoJSON.Feature[] = all.map((f) => ({
            type: "Feature" as const,
            geometry: f.geometry,
            properties: { ...f.properties, _fid: f.id },
          }));
          src.setData(featureCollection(geoFeatures));
        }
      }

      // Reset transient drawing state
      verticesRef.current = [];
      cursorRef.current = null;
      snapRef.current = null;
      dragStartRef.current = null;
      isDrawingRef.current = false;
    },
    [onAddFeature, onAnnounce, mapRef],
  );

  const cancelDrawing = useCallback(() => {
    verticesRef.current = [];
    cursorRef.current = null;
    snapRef.current = null;
    dragStartRef.current = null;
    isDrawingRef.current = false;
    // Clear ghost
    const map = mapRef.current;
    if (map && isMapAlive(map)) {
      const src = map.getSource(GHOST_SOURCE) as maplibregl.GeoJSONSource | undefined;
      src?.setData(featureCollection([]));
    }
    onCancelDraw();
    onAnnounce?.("Drawing cancelled");
  }, [mapRef, onCancelDraw, onAnnounce]);

  /* ================================================================ */
  /*  MapLibre source/layer lifecycle + sync                           */
  /* ================================================================ */

  /* Keep a ref to syncFeaturesToMap so style.load handler can call
     it without adding it as an effect dependency (which would cause
     the source setup effect to re-run on every selectedFeatureId change). */
  const syncFeaturesRef = useRef(syncFeaturesToMap);
  syncFeaturesRef.current = syncFeaturesToMap;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const onStyleLoad = () => {
      if (!isMapAlive(map)) return;
      ensureSources(map);
      // Re-sync drawn features after sources are (re)created on style change
      syncFeaturesRef.current();
    };
    // Ensure sources survive style switches
    map.on("style.load", onStyleLoad);
    if (isMapAlive(map) && map.isStyleLoaded()) {
      ensureSources(map);
      syncFeaturesRef.current();
    }

    return () => {
      if (!isMapAlive(map)) return;
      map.off("style.load", onStyleLoad);
      removeSources(map);
    };
  }, [mapRef, ensureSources, removeSources]);

  /* Sync drawn features whenever they change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    if (map.isStyleLoaded()) {
      syncFeaturesToMap();
    }
    // If style isn't loaded, the style.load handler above will sync after sources exist
  }, [mapRef, drawnFeatures, selectedFeatureId, syncFeaturesToMap]);

  useEffect(() => {
    if (!seedDrawStart || activeDrawTool !== seedDrawStart.tool) return;
    if (handledSeedTokenRef.current === seedDrawStart.token) return;
    handledSeedTokenRef.current = seedDrawStart.token;

    if (seedDrawStart.tool === "polygon" || seedDrawStart.tool === "linestring") {
      verticesRef.current = [seedDrawStart.coordinate];
      cursorRef.current = seedDrawStart.coordinate;
      dragStartRef.current = null;
      isDrawingRef.current = true;
      syncGhost();
      onAnnounce?.(
        `${seedDrawStart.tool === "polygon" ? "Polygon" : "Line"} drawing started from selected point`,
      );
      onSeedHandled?.(seedDrawStart.token);
    }
  }, [activeDrawTool, onAnnounce, onSeedHandled, seedDrawStart, syncGhost]);

  /* ---- Main click / mousemove / dblclick / mousedown / mouseup ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    /* Ensure drawing sources exist before event handlers try to use them */
    if (isMapAlive(map) && map.isStyleLoaded()) {
      ensureSources(map);
    }

    /* Disable double-click zoom while a draw tool is active so that
       finishing a line/polygon with dblclick doesn't also zoom the map. */
    const hasDrawTool = !!activeDrawTool;
    if (hasDrawTool) {
      map.doubleClickZoom.disable();
    }

    /* ---------- Click ---------- */
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const tool = activeToolRef.current;
      if (!tool) {
        const selectableLayers = [DRAW_VERTEX_LAYER, DRAW_LINE_LAYER, DRAW_FILL_LAYER]
          .filter((layerId) => Boolean(map.getLayer(layerId)));
        if (selectableLayers.length === 0) {
          onSelectFeature(null);
          return;
        }

        const feature = map
          .queryRenderedFeatures(e.point, { layers: selectableLayers })
          .find((candidate) => typeof candidate.properties?._fid === "string");
        const featureId = feature?.properties?._fid as string | undefined;
        onSelectFeature(featureId ?? null);
        if (featureId) {
          onAnnounce?.(`Selected drawn feature ${featureId}`);
          e.preventDefault();
        }
        return;
      }
      const coord: [number, number] = [
        +e.lngLat.lng.toFixed(6),
        +e.lngLat.lat.toFixed(6),
      ];

      // Snap
      const snapped = trySnap(coord, map);
      const pt = snapped ?? coord;

      if (tool === "point") {
        finishFeature(makePoint(pt), `Point ${featuresRef.current.length + 1}`);
        syncGhost();
        return;
      }

      if (tool === "linestring" || tool === "polygon") {
        // Deduplicate: skip if this coord matches the last vertex
        // (double-click fires two click events before dblclick)
        const verts = verticesRef.current;
        const last = verts[verts.length - 1];
        if (last && last[0] === pt[0] && last[1] === pt[1]) return;

        verts.push(pt);
        isDrawingRef.current = true;
        syncGhost();
        return;
      }

      /* rectangle and circle use mousedown/mouseup drag, not click */
    };

    /* ---------- Mousemove ---------- */
    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const coord: [number, number] = [+e.lngLat.lng.toFixed(6), +e.lngLat.lat.toFixed(6)];

      // Editing drag
      if (editingRef.current) {
        cursorRef.current = coord;
        snapRef.current = null;
        const { featureId, vertexIndex } = editingRef.current;
        const feat = featuresRef.current.find((f) => f.id === featureId);
        if (feat) {
          const c = cursorRef.current;
          if (feat.geometry.type === "Polygon") {
            const ring = [...(feat.geometry as GeoJSON.Polygon).coordinates[0]];
            ring[vertexIndex] = c;
            // Also close the ring if editing index 0
            if (vertexIndex === 0) ring[ring.length - 1] = c;
            const geometry: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] };
            onUpdateFeature(featureId, {
              geometry,
              properties: {
                ...feat.properties,
                validation: validateDrawnGeometry(geometry),
              },
            });
          } else if (feat.geometry.type === "LineString") {
            const coords = [...(feat.geometry as GeoJSON.LineString).coordinates] as [number, number][];
            coords[vertexIndex] = c;
            const geometry = makeLineString(coords);
            onUpdateFeature(featureId, {
              geometry,
              properties: {
                ...feat.properties,
                validation: validateDrawnGeometry(geometry),
              },
            });
          }
        }
        return;
      }

      const tool = activeToolRef.current;
      if (!tool) {
        cursorRef.current = null;
        snapRef.current = null;
        syncGhost();
        return;
      }

      const snapped = trySnap(coord, map);
      cursorRef.current = snapped ?? coord;
      snapRef.current = snapped;

      if (tool === "rectangle" && dragStartRef.current) {
        // Ghost preview
        syncGhost();
      } else if (isDrawingRef.current || verticesRef.current.length > 0 || snapRef.current) {
        syncGhost();
      }
    };

    /* ---------- Double-click → finish line/polygon ---------- */
    const onDblClick = (e: maplibregl.MapMouseEvent) => {
      const tool = activeToolRef.current;
      if (!tool) return;
      e.preventDefault();

      const verts = verticesRef.current;

      /* Remove the extra vertex added by the second click of the
         double-click (the first click's duplicate was already blocked
         by the dedup check in onClick, but a stray extra may remain). */
      if (verts.length >= 2) {
        const last = verts[verts.length - 1];
        const prev = verts[verts.length - 2];
        if (last[0] === prev[0] && last[1] === prev[1]) {
          verts.pop();
        }
      }

      if (tool === "linestring" && verts.length >= 2) {
        finishFeature(
          makeLineString(verts),
          `Line ${featuresRef.current.length + 1}`,
        );
        syncGhost();
      } else if (tool === "polygon" && verts.length >= 3) {
        finishFeature(
          makePolygon(verts),
          `Polygon ${featuresRef.current.length + 1}`,
        );
        syncGhost();
      }
    };

    /* ---------- Mousedown → rectangle start / vertex edit start ---------- */
    const onMouseDown = (e: maplibregl.MapMouseEvent) => {
      const tool = activeToolRef.current;

      // Vertex editing: check if we're clicking on a vertex of the selected feature
      if (selectedFeatureId) {
        const feat = featuresRef.current.find((f) => f.id === selectedFeatureId);
        if (feat) {
          let coords: number[][] = [];
          if (feat.geometry.type === "Polygon") {
            const ring = (feat.geometry as GeoJSON.Polygon).coordinates[0];
            coords = ring.slice(0, -1); // exclude closing vertex
          } else if (feat.geometry.type === "LineString") {
            coords = (feat.geometry as GeoJSON.LineString).coordinates;
          }
          const click = map.project(e.lngLat);
          for (let i = 0; i < coords.length; i++) {
            const vp = map.project([coords[i][0], coords[i][1]]);
            if (isWithinPixels(click, vp, SNAP_TOLERANCE_PX)) {
              editingRef.current = { featureId: selectedFeatureId, vertexIndex: i };
              map.dragPan.disable();
              e.preventDefault();
              return;
            }
          }
        }
      }

      if (tool === "rectangle") {
        const coord: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        dragStartRef.current = coord;
        isDrawingRef.current = true;
        map.dragPan.disable();
        e.preventDefault();
      }

      if (tool === "circle") {
        const coord: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        verticesRef.current = [coord];
        cursorRef.current = coord;
        snapRef.current = null;
        dragStartRef.current = coord;
        isDrawingRef.current = true;
        map.dragPan.disable();
        e.preventDefault();
        syncGhost();
      }
    };

    /* ---------- Mouseup → rectangle finish / vertex edit end ---------- */
    const onMouseUp = (e: maplibregl.MapMouseEvent) => {
      // Vertex editing end
      if (editingRef.current) {
        editingRef.current = null;
        map.dragPan.enable();
        return;
      }

      const tool = activeToolRef.current;
      if (tool === "rectangle" && dragStartRef.current) {
        const coord: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        // Only create if there's meaningful distance
        if (
          Math.abs(coord[0] - dragStartRef.current[0]) > 0.00001 ||
          Math.abs(coord[1] - dragStartRef.current[1]) > 0.00001
        ) {
          finishFeature(
            makeRectangle(dragStartRef.current, coord),
            `Rectangle ${featuresRef.current.length + 1}`,
          );
        }
        dragStartRef.current = null;
        isDrawingRef.current = false;
        map.dragPan.enable();
        syncGhost();
      }

      if (tool === "circle" && dragStartRef.current && verticesRef.current.length === 1) {
        const coord: [number, number] = [
          +e.lngLat.lng.toFixed(6),
          +e.lngLat.lat.toFixed(6),
        ];
        const center = verticesRef.current[0];
        const radius = haversineDistance(center, coord);
        if (radius > 1) {
          finishFeature(
            makeCircle(center, radius),
            `Circle ${featuresRef.current.length + 1}`,
          );
        }
        verticesRef.current = [];
        cursorRef.current = null;
        snapRef.current = null;
        dragStartRef.current = null;
        isDrawingRef.current = false;
        map.dragPan.enable();
        syncGhost();
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    map.on("dblclick", onDblClick);
    map.on("mousedown", onMouseDown);
    map.on("mouseup", onMouseUp);

    return () => {
      if (!isMapAlive(map)) return;
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      map.off("dblclick", onDblClick);
      map.off("mousedown", onMouseDown);
      map.off("mouseup", onMouseUp);
      map.dragPan.enable();
      map.doubleClickZoom.enable();
    };
  }, [
    mapRef,
    activeDrawTool,
    selectedFeatureId,
    finishFeature,
    syncGhost,
    trySnap,
    onUpdateFeature,
    onSelectFeature,
    onAnnounce,
    ensureSources,
  ]);

  /* ================================================================ */
  /*  Keyboard: Escape to cancel, Ctrl+Z to undo, Delete to remove    */
  /* ================================================================ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (isDrawingRef.current || activeToolRef.current)) {
        e.stopPropagation(); // Prevent modal close
        e.preventDefault();
        cancelDrawing();
        return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && isDrawingRef.current) {
        e.preventDefault();
        if (verticesRef.current.length > 0) {
          verticesRef.current.pop();
          if (verticesRef.current.length === 0) {
            isDrawingRef.current = false;
          }
          syncGhost();
          onAnnounce?.("Last vertex undone");
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFeatureId) {
        onRemoveFeature(selectedFeatureId);
        onSelectFeature(null);
        onAnnounce?.("Selected feature deleted");
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    selectedFeatureId,
    cancelDrawing,
    syncGhost,
    onRemoveFeature,
    onSelectFeature,
    onAnnounce,
  ]);

  /* ================================================================ */
  /*  Map cursor style                                                 */
  /* ================================================================ */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return undefined;
    const canvas = map.getCanvas();
    if (activeDrawTool) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
    return () => {
      if (!isMapAlive(map)) return;
      canvas.style.cursor = "";
    };
  }, [mapRef, activeDrawTool]);

  /* ================================================================ */
  /*  Feature sidebar rendered in React                                */
  /* ================================================================ */

  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();

  if (!sidebarVisible) {
    return null;
  }

  const selectedFeature = drawnFeatures.find((feature) => feature.id === selectedFeatureId) ?? null;
  const activeToolLabel = activeDrawTool ? DRAW_TOOL_LABELS[activeDrawTool] : "Select";

  return (
    <div style={{ ...panelStyle, ...panelPositionStyle }} role="region" aria-label="Drawn features">
      <div style={{ ...headerStyle, ...dragHandleStyle }} {...dragHandleProps}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Sketch</span>
          <span style={mapStyles.sidePanelTitle}><IconPencil size={MAP_ICON_SIZES.sm} /> Drawings</span>
        </div>
        <div style={mapStyles.sidePanelHeaderActions}>
          {drawnFeatures.length > 0 ? (
            <button
              type="button"
              style={smallBtn}
              onClick={onClearFeatures}
              aria-label="Clear all drawn features"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Sketch summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Tool</span>
          <span style={mapStyles.sidePanelMetricValue}>{activeToolLabel}</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Features</span>
          <span style={mapStyles.sidePanelMetricValue}>{drawnFeatures.length}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Selected</span>
          <span style={mapStyles.sidePanelMetricValue}>{selectedFeature ? selectedFeature.geometry.type : "None"}</span>
        </div>
      </div>

      {drawnFeatures.length === 0 ? (
        <div style={emptyStyle}>
          No drawn features.
        </div>
      ) : (
        <div style={mapStyles.sidePanelBody} role="listbox" aria-label="Drawn feature list">
          {drawnFeatures.map((f) => {
            const validationStatus = f.properties.validation?.status;
            const validationLabel = getDrawnValidationLabel(validationStatus);
            const validationColor = getDrawnValidationColor(validationStatus);

            return (
            <div
              key={f.id}
              role="option"
              style={f.id === selectedFeatureId ? rowSelectedStyle : rowStyle}
              onClick={() => onSelectFeature(f.id === selectedFeatureId ? null : f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectFeature(f.id === selectedFeatureId ? null : f.id);
                }
              }}
              tabIndex={0}
              aria-selected={f.id === selectedFeatureId}
              aria-label={`${f.properties.label} — ${f.geometry.type}`}
            >
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", color: f.id === selectedFeatureId ? MAP_COLORS.interaction : MAP_COLORS.textMuted }}>
                {f.geometry.type === "Point" ? <IconPoint size={MAP_ICON_SIZES.sm} /> : f.geometry.type === "LineString" ? <IconLine size={MAP_ICON_SIZES.sm} /> : f.geometry.type === "Polygon" ? <IconPolygon size={MAP_ICON_SIZES.sm} /> : <IconUnknown size={MAP_ICON_SIZES.sm} />}
              </span>
              <span style={{ minWidth: MAP_SPACING.zero, display: "grid", gap: MAP_SPACING.xs }}>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: f.id === selectedFeatureId ? MAP_COLORS.interaction : MAP_COLORS.text,
                    fontWeight: f.id === selectedFeatureId ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
                  }}
                >
                  {f.properties.label}
                </span>
                <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  {f.geometry.type} - <span style={{ color: validationColor }}>{validationLabel}</span>
                </span>
              </span>
              <button
                type="button"
                style={smallBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFeature(f.id);
                  if (f.id === selectedFeatureId) onSelectFeature(null);
                  onAnnounce?.(`${f.properties.label} removed`);
                }}
                aria-label={`Delete ${f.properties.label}`}
              >
                <IconTrash size={12} />
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
