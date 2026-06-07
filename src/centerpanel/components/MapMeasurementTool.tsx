/* ================================================================== */
/*  MapMeasurementTool                                                 */
/*  Geodesic distance and area measurement on the MapLibre canvas.     */
/* ================================================================== */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Clock3 } from "lucide-react";
import type maplibregl from "maplibre-gl";
import type { Measurement, MeasureToolId, MeasureUnit } from "./map/mapTypes";
import {
  formatArea,
  formatBearing,
  formatDistance,
  haversineDistance,
  initialBearing,
  type LngLat,
  midpoint,
  polygonPerimeter,
  polylineLength,
  sphericalPolygonArea,
} from "../../utils/geodesic";
import { featureCollection } from "../../utils/drawingHelpers";
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
import { IconArea, IconClose, IconMeasure, IconRuler } from "./map/MapIcons";
import { preflight as preflightCrs } from "@/services/map/crs/CrsPreflight";

const MEASURE_SOURCE = "synapse-measure-src";
const MEASURE_LINE_LAYER = "synapse-measure-line";
const MEASURE_FILL_LAYER = "synapse-measure-fill";
const MEASURE_VERTEX_LAYER = "synapse-measure-vertex";
const MEASURE_LABEL_LAYER = "synapse-measure-label";
const GHOST_MEASURE_SOURCE = "synapse-measure-ghost-src";
const GHOST_MEASURE_LINE_LAYER = "synapse-measure-ghost-line";
const GHOST_MEASURE_FILL_LAYER = "synapse-measure-ghost-fill";
const GHOST_MEASURE_VERTEX_LAYER = "synapse-measure-ghost-vertex";
const GHOST_MEASURE_LABEL_LAYER = "synapse-measure-ghost-label";

interface LivePreviewState {
  primary: string;
  secondary?: string;
}

let measurementCounter = 0;

function nextMeasurementId(): string {
  measurementCounter += 1;
  return `measure-${Date.now()}-${measurementCounter}`;
}

function isMapAlive(map: maplibregl.Map): boolean {
  try {
    return map.getStyle() != null;
  } catch {
    return false;
  }
}

function isSameCoordinate(a: LngLat, b: LngLat): boolean {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

function appendDistinctCoordinate(coords: LngLat[], coordinate: LngLat): LngLat[] {
  const last = coords[coords.length - 1];
  if (last && isSameCoordinate(last, coordinate)) {
    return coords;
  }
  return [...coords, coordinate];
}

function createPointFeature(coordinate: LngLat, properties: Record<string, unknown>): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coordinate },
    properties,
  };
}

function createLineFeature(coordinates: LngLat[], properties: Record<string, unknown>): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
    properties,
  };
}

function createPolygonFeature(coordinates: LngLat[], properties: Record<string, unknown>): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coordinates] },
    properties,
  };
}

function formatMeasurementTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getMeasurementKindLabel(type: MeasureToolId): string {
  return type === "measure-distance" ? "Distance" : "Area";
}

function getMeasurementInstructions(type: MeasureToolId | null): string {
  if (type === "measure-distance") {
    return "Click to add path vertices. Double-click to finish. Esc cancels.";
  }
  if (type === "measure-area") {
    return "Click to add polygon vertices. Double-click to close and finish. Esc cancels.";
  }
  return "Choose a tool to start measuring.";
}

function buildMeasurementAssumptions(type: MeasureToolId): NonNullable<Measurement["assumptions"]> {
  const preflight = preflightCrs(
    {
      id: `measurement:${type}`,
      label: type === "measure-area" ? "Area measurement" : "Distance measurement",
      metric: type === "measure-area" ? "area" : "distance",
      executionKind: "geodesic",
    },
    [],
    null,
  );
  return {
    method: "geodesic-wgs84",
    crsBasis: "EPSG:4326",
    coordinateBasis: "map-display-coordinates",
    distanceModel: "haversine",
    areaModel: type === "measure-area" ? "spherical-polygon" : "not-applicable",
    unitBase: "metres",
    caveats: [
      ...preflight.caveats,
      "Coordinates are captured from the map display as longitude/latitude.",
      "Use projected analytical tools for legal, engineering, or parcel-accurate area claims.",
    ],
  };
}

function getMeasurementAssumptionLabel(assumptions: Measurement["assumptions"] | undefined): string {
  const resolved = assumptions ?? buildMeasurementAssumptions("measure-distance");
  return resolved.method === "geodesic-wgs84" ? "WGS84 geodesic" : resolved.method;
}

function isValidCompletedMeasurement(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function getDistanceBearingLabel(coordinates: LngLat[]): string | null {
  if (coordinates.length < 2) {
    return null;
  }
  const start = coordinates[coordinates.length - 2]!;
  const end = coordinates[coordinates.length - 1]!;
  return `Bearing ${formatBearing(initialBearing(start, end))}`;
}

function buildDistanceFeatures(
  coordinates: LngLat[],
  unit: MeasureUnit,
  labelPrefix: string,
): GeoJSON.Feature[] {
  if (coordinates.length === 0) {
    return [];
  }

  const features: GeoJSON.Feature[] = [];
  if (coordinates.length >= 2) {
    features.push(createLineFeature(coordinates, { _kind: "path" }));
  }

  coordinates.forEach((coordinate) => {
    features.push(createPointFeature(coordinate, { _kind: "vertex" }));
  });

  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1]!;
    const end = coordinates[index]!;
    features.push(
      createPointFeature(midpoint(start, end), {
        _kind: "label",
        _label: formatDistance(haversineDistance(start, end), unit),
      }),
    );
  }

  if (coordinates.length >= 2) {
    features.push(
      createPointFeature(coordinates[coordinates.length - 1]!, {
        _kind: "label",
        _label: `${labelPrefix} ${formatDistance(polylineLength(coordinates), unit)}`,
      }),
    );
  }

  return features;
}

function buildAreaFeatures(
  coordinates: LngLat[],
  unit: MeasureUnit,
  labelPrefix: string,
): GeoJSON.Feature[] {
  if (coordinates.length === 0) {
    return [];
  }

  const features: GeoJSON.Feature[] = [];
  coordinates.forEach((coordinate) => {
    features.push(createPointFeature(coordinate, { _kind: "vertex" }));
  });

  if (coordinates.length === 1) {
    return features;
  }

  if (coordinates.length === 2) {
    features.push(createLineFeature(coordinates, { _kind: "path" }));
    features.push(
      createPointFeature(midpoint(coordinates[0]!, coordinates[1]!), {
        _kind: "label",
        _label: formatDistance(haversineDistance(coordinates[0]!, coordinates[1]!), unit),
      }),
    );
    return features;
  }

  const closedRing: LngLat[] = [...coordinates, coordinates[0]!];
  features.push(createPolygonFeature(closedRing, { _kind: "area" }));
  features.push(createLineFeature(closedRing, { _kind: "path" }));

  for (let index = 1; index < closedRing.length; index += 1) {
    const start = closedRing[index - 1]!;
    const end = closedRing[index]!;
    features.push(
      createPointFeature(midpoint(start, end), {
        _kind: "label",
        _label: formatDistance(haversineDistance(start, end), unit),
      }),
    );
  }

  features.push(
    createPointFeature(coordinates[coordinates.length - 1]!, {
      _kind: "label",
      _label: `${labelPrefix} ${formatArea(sphericalPolygonArea(coordinates), unit)} / P ${formatDistance(polygonPerimeter(coordinates), unit)}`,
    }),
  );

  return features;
}

function buildMeasurementFeatures(
  type: MeasureToolId,
  coordinates: LngLat[],
  unit: MeasureUnit,
  labelPrefix: string,
): GeoJSON.Feature[] {
  return type === "measure-distance"
    ? buildDistanceFeatures(coordinates, unit, labelPrefix)
    : buildAreaFeatures(coordinates, unit, labelPrefix);
}

function buildLivePreviewState(
  type: MeasureToolId | null,
  coordinates: LngLat[],
  unit: MeasureUnit,
): LivePreviewState | null {
  if (!type || coordinates.length === 0) {
    return null;
  }

  if (type === "measure-distance") {
    if (coordinates.length < 2) {
      return { primary: "Add another point to start measuring distance." };
    }
    const bearing = getDistanceBearingLabel(coordinates);
    return {
      primary: `Live total ${formatDistance(polylineLength(coordinates), unit)}`,
      ...(bearing ? { secondary: bearing } : {}),
    };
  }

  if (coordinates.length < 3) {
    return {
      primary: "Add one more vertex to close the area.",
      secondary: `Open edge ${formatDistance(polylineLength(coordinates), unit)}`,
    };
  }

  return {
    primary: `Live area ${formatArea(sphericalPolygonArea(coordinates), unit)}`,
    secondary: `Perimeter ${formatDistance(polygonPerimeter(coordinates), unit)}`,
  };
}

function buildMeasurementClipboardText(measurement: Measurement, unit: MeasureUnit): string {
  const assumptions = measurement.assumptions ?? buildMeasurementAssumptions(measurement.type);
  const lines = [
    `${getMeasurementKindLabel(measurement.type)} measurement`,
    `Captured: ${formatMeasurementTimestamp(measurement.timestamp)}`,
    `Method: ${getMeasurementAssumptionLabel(assumptions)}`,
    `CRS basis: ${assumptions.crsBasis} from ${assumptions.coordinateBasis}`,
  ];

  if (measurement.type === "measure-distance") {
    lines.push(`Distance: ${formatDistance(measurement.value, unit)}`);
    const bearing = getDistanceBearingLabel(measurement.coordinates as LngLat[]);
    if (bearing) {
      lines.push(bearing);
    }
  } else {
    lines.push(`Area: ${formatArea(measurement.value, unit)}`);
    lines.push(`Perimeter: ${formatDistance(polygonPerimeter(measurement.coordinates as LngLat[]), unit)}`);
  }

  lines.push(`Vertices: ${measurement.coordinates.length}`);
  assumptions.caveats.forEach((caveat) => lines.push(`Caveat: ${caveat}`));
  lines.push("Coordinates:");
  measurement.coordinates.forEach((coordinate, index) => {
    lines.push(`${index + 1}. ${coordinate[1].toFixed(6)}, ${coordinate[0].toFixed(6)}`);
  });

  return lines.join("\n");
}

export interface MapMeasurementToolProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  activeMeasureTool: MeasureToolId | null;
  presentation?: "floating" | "embedded";
  seedMeasurementStart?: {
    coordinate: LngLat;
    tool: MeasureToolId;
    token: number;
  } | null;
  measurements: Measurement[];
  measureUnit: MeasureUnit;
  onAddMeasurement: (measurement: Measurement) => void;
  onRemoveMeasurement: (id: string) => void;
  onClearMeasurements: () => void;
  onSetMeasureUnit: (unit: MeasureUnit) => void;
  onCancelMeasure: () => void;
  onSeedHandled?: (token: number) => void;
  onAnnounce?: (message: string) => void;
}

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.measurementPanelWidth),
};

const embeddedPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto auto auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
};

const headerStyle: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
  alignItems: "flex-start",
};

const rowStyle: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
};

const compactButtonStyle: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.625rem",
};

const segmentedControlStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: 8,
  background: MAP_COLORS.transparent,
};

const valueStyle: React.CSSProperties = {
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 13,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.interaction,
};

const helperTextStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const embeddedBodyStyle: React.CSSProperties = {
  ...mapStyles.sidePanelBody,
  minHeight: 0,
  overflow: "auto",
};

function getUnitButtonStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        ...mapStyles.sidePanelPrimaryButton,
        minHeight: "1.75rem",
        padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
      }
    : {
        ...compactButtonStyle,
        color: MAP_COLORS.textMuted,
      };
}

export const MapMeasurementTool: React.FC<MapMeasurementToolProps> = ({
  mapRef,
  activeMeasureTool,
  presentation = "floating",
  seedMeasurementStart = null,
  measurements,
  measureUnit,
  onAddMeasurement,
  onRemoveMeasurement,
  onClearMeasurements,
  onSetMeasureUnit,
  onCancelMeasure,
  onSeedHandled,
  onAnnounce,
}) => {
  const verticesRef = useRef<LngLat[]>([]);
  const cursorRef = useRef<LngLat | null>(null);
  const activeToolRef = useRef<MeasureToolId | null>(activeMeasureTool);
  const measurementsRef = useRef(measurements);
  const unitRef = useRef(measureUnit);
  const handledSeedTokenRef = useRef<number | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const [livePreview, setLivePreview] = useState<LivePreviewState | null>(null);
  const [copiedMeasurementId, setCopiedMeasurementId] = useState<string | null>(null);

  activeToolRef.current = activeMeasureTool;
  measurementsRef.current = measurements;
  unitRef.current = measureUnit;

  const updateLivePreview = useCallback((nextPreview: LivePreviewState | null) => {
    setLivePreview((current) => {
      if (
        current?.primary === nextPreview?.primary &&
        current?.secondary === nextPreview?.secondary
      ) {
        return current;
      }
      return nextPreview;
    });
  }, []);

  const ensureSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) {
      return;
    }

    // MapLibre paint props cannot parse CSS var()/color-mix(); resolve first.
    const accentColor = resolveMapPaintColor(MAP_COLORS.interaction);
    const labelColor = resolveMapPaintColor(MAP_COLORS.text);
    const vertexStrokeColor = resolveMapPaintColor(MAP_COLORS.white);

    try {
      if (!map.getSource(MEASURE_SOURCE)) {
        map.addSource(MEASURE_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });

        map.addLayer({
          id: MEASURE_FILL_LAYER,
          type: "fill",
          source: MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "area"],
          paint: {
            "fill-color": accentColor,
            "fill-opacity": 0.12,
          },
        });

        map.addLayer({
          id: MEASURE_LINE_LAYER,
          type: "line",
          source: MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "path"],
          paint: {
            "line-color": accentColor,
            "line-width": 2,
            "line-dasharray": [6, 4],
          },
        });

        map.addLayer({
          id: MEASURE_VERTEX_LAYER,
          type: "circle",
          source: MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "vertex"],
          paint: {
            "circle-radius": 4,
            "circle-color": accentColor,
            "circle-stroke-color": vertexStrokeColor,
            "circle-stroke-width": 1.5,
          },
        });

        map.addLayer({
          id: MEASURE_LABEL_LAYER,
          type: "symbol",
          source: MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "label"],
          layout: {
            "text-field": ["get", "_label"],
            "text-size": 11,
            "text-offset": [0, -1.2],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": labelColor,
            "text-halo-color": "rgba(0, 0, 0, 0.84)",
            "text-halo-width": 1.5,
          },
        });
      }

      if (!map.getSource(GHOST_MEASURE_SOURCE)) {
        map.addSource(GHOST_MEASURE_SOURCE, {
          type: "geojson",
          data: featureCollection([]),
        });

        map.addLayer({
          id: GHOST_MEASURE_FILL_LAYER,
          type: "fill",
          source: GHOST_MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "area"],
          paint: {
            "fill-color": accentColor,
            "fill-opacity": 0.08,
          },
        });

        map.addLayer({
          id: GHOST_MEASURE_LINE_LAYER,
          type: "line",
          source: GHOST_MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "path"],
          paint: {
            "line-color": accentColor,
            "line-width": 1.75,
            "line-dasharray": [4, 4],
          },
        });

        map.addLayer({
          id: GHOST_MEASURE_VERTEX_LAYER,
          type: "circle",
          source: GHOST_MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "vertex"],
          paint: {
            "circle-radius": 4,
            "circle-color": accentColor,
            "circle-stroke-color": vertexStrokeColor,
            "circle-stroke-width": 1.25,
          },
        });

        map.addLayer({
          id: GHOST_MEASURE_LABEL_LAYER,
          type: "symbol",
          source: GHOST_MEASURE_SOURCE,
          filter: ["==", ["get", "_kind"], "label"],
          layout: {
            "text-field": ["get", "_label"],
            "text-size": 11,
            "text-offset": [0, -1.25],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": accentColor,
            "text-halo-color": "rgba(0, 0, 0, 0.86)",
            "text-halo-width": 1.5,
          },
        });
      }
    } catch {
      // Style transitions can invalidate source insertion timing.
    }
  }, []);

  const removeSources = useCallback((map: maplibregl.Map) => {
    if (!isMapAlive(map)) {
      return;
    }

    [
      GHOST_MEASURE_LABEL_LAYER,
      GHOST_MEASURE_VERTEX_LAYER,
      GHOST_MEASURE_LINE_LAYER,
      GHOST_MEASURE_FILL_LAYER,
      MEASURE_LABEL_LAYER,
      MEASURE_VERTEX_LAYER,
      MEASURE_LINE_LAYER,
      MEASURE_FILL_LAYER,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource(GHOST_MEASURE_SOURCE)) {
      map.removeSource(GHOST_MEASURE_SOURCE);
    }
    if (map.getSource(MEASURE_SOURCE)) {
      map.removeSource(MEASURE_SOURCE);
    }
  }, []);

  const syncMeasurementsToMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) {
      return;
    }

    const source = map.getSource(MEASURE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    const features = measurementsRef.current.flatMap((measurement) =>
      buildMeasurementFeatures(
        measurement.type,
        measurement.coordinates as LngLat[],
        unitRef.current,
        measurement.type === "measure-distance" ? "Total" : "Area",
      ),
    );

    source.setData(featureCollection(features));
  }, [mapRef]);

  const syncGhost = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) {
      updateLivePreview(null);
      return;
    }

    const source = map.getSource(GHOST_MEASURE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      updateLivePreview(null);
      return;
    }

    const tool = activeToolRef.current;
    const cursor = cursorRef.current;
    let liveCoordinates = [...verticesRef.current];

    if (!tool) {
      source.setData(featureCollection([]));
      updateLivePreview(null);
      return;
    }

    if (cursor) {
      liveCoordinates = appendDistinctCoordinate(liveCoordinates, cursor);
    }

    if (liveCoordinates.length === 0) {
      source.setData(featureCollection([]));
      updateLivePreview(null);
      return;
    }

    source.setData(
      featureCollection(
        buildMeasurementFeatures(
          tool,
          liveCoordinates,
          unitRef.current,
          tool === "measure-distance" ? "Live" : "Area",
        ),
      ),
    );
    updateLivePreview(buildLivePreviewState(tool, liveCoordinates, unitRef.current));
  }, [mapRef, updateLivePreview]);

  const finishMeasurement = useCallback((
    type: MeasureToolId,
    coordinates: LngLat[],
    value: number,
  ) => {
    if (!isValidCompletedMeasurement(value)) {
      onAnnounce?.("Measurement was not captured because the completed geometry has no measurable distance or area");
      return;
    }

    const measurement: Measurement = {
      id: nextMeasurementId(),
      type,
      coordinates,
      value,
      label:
        type === "measure-distance"
          ? `Distance ${formatDistance(value, unitRef.current)}`
          : `Area ${formatArea(value, unitRef.current)}`,
      timestamp: new Date().toISOString(),
      assumptions: buildMeasurementAssumptions(type),
    };

    onAddMeasurement(measurement);
    measurementsRef.current = [...measurementsRef.current, measurement];
    verticesRef.current = [];
    cursorRef.current = null;
    updateLivePreview(null);
    syncMeasurementsToMap();

    onAnnounce?.(
      type === "measure-distance"
        ? `Distance captured: ${formatDistance(value, unitRef.current)}`
        : `Area captured: ${formatArea(value, unitRef.current)}`,
    );
  }, [onAddMeasurement, onAnnounce, syncMeasurementsToMap, updateLivePreview]);

  const clearGhost = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) {
      return;
    }
    const source = map.getSource(GHOST_MEASURE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    source?.setData(featureCollection([]));
  }, [mapRef]);

  const cancelMeasuring = useCallback(() => {
    verticesRef.current = [];
    cursorRef.current = null;
    clearGhost();
    updateLivePreview(null);
    onCancelMeasure();
    onAnnounce?.("Measurement cancelled");
  }, [clearGhost, onAnnounce, onCancelMeasure, updateLivePreview]);

  const copyMeasurement = useCallback(async (measurement: Measurement) => {
    try {
      await navigator.clipboard.writeText(buildMeasurementClipboardText(measurement, measureUnit));
      setCopiedMeasurementId(measurement.id);
      onAnnounce?.(`${getMeasurementKindLabel(measurement.type)} measurement copied to clipboard`);

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedMeasurementId((current) => (current === measurement.id ? null : current));
        copyResetTimerRef.current = null;
      }, 1800);
    } catch {
      onAnnounce?.("Clipboard access was blocked");
    }
  }, [measureUnit, onAnnounce]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const handleStyleLoad = () => {
      if (!isMapAlive(map)) {
        return;
      }
      ensureSources(map);
      syncMeasurementsToMap();
      syncGhost();
    };

    map.on("style.load", handleStyleLoad);
    if (isMapAlive(map) && map.isStyleLoaded()) {
      ensureSources(map);
      syncMeasurementsToMap();
      syncGhost();
    }

    return () => {
      if (!isMapAlive(map)) {
        return;
      }
      map.off("style.load", handleStyleLoad);
      removeSources(map);
    };
  }, [ensureSources, mapRef, removeSources, syncGhost, syncMeasurementsToMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map) || !map.isStyleLoaded()) {
      return;
    }
    syncMeasurementsToMap();
    syncGhost();
  }, [mapRef, measureUnit, measurements, syncGhost, syncMeasurementsToMap]);

  useEffect(() => {
    if (!seedMeasurementStart || activeMeasureTool !== seedMeasurementStart.tool) {
      return;
    }
    if (handledSeedTokenRef.current === seedMeasurementStart.token) {
      return;
    }

    handledSeedTokenRef.current = seedMeasurementStart.token;
    verticesRef.current = [seedMeasurementStart.coordinate];
    cursorRef.current = seedMeasurementStart.coordinate;
    syncGhost();
    onSeedHandled?.(seedMeasurementStart.token);
    onAnnounce?.("Measurement started from selected point");
  }, [
    activeMeasureTool,
    onAnnounce,
    onSeedHandled,
    seedMeasurementStart,
    syncGhost,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeMeasureTool || !isMapAlive(map)) {
      return undefined;
    }

    map.doubleClickZoom.disable();
    const previousCursor = map.getCanvas().style.cursor;
    map.getCanvas().style.cursor = "crosshair";

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const coordinate: LngLat = [event.lngLat.lng, event.lngLat.lat];
      verticesRef.current = appendDistinctCoordinate(verticesRef.current, coordinate);
      cursorRef.current = coordinate;
      syncGhost();
    };

    const handleMouseMove = (event: maplibregl.MapMouseEvent) => {
      cursorRef.current = [event.lngLat.lng, event.lngLat.lat];
      syncGhost();
    };

    const handleDoubleClick = (event: maplibregl.MapMouseEvent) => {
      event.preventDefault();
      const tool = activeToolRef.current;
      if (!tool) {
        return;
      }

      const doubleClickCoordinate: LngLat = [event.lngLat.lng, event.lngLat.lat];
      const completedCoordinates = appendDistinctCoordinate(verticesRef.current, doubleClickCoordinate);

      if (tool === "measure-distance" && completedCoordinates.length >= 2) {
        finishMeasurement(tool, completedCoordinates, polylineLength(completedCoordinates));
      }

      if (tool === "measure-area" && completedCoordinates.length >= 3) {
        finishMeasurement(tool, completedCoordinates, sphericalPolygonArea(completedCoordinates));
      }

      clearGhost();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelMeasuring();
      }
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);
    map.on("dblclick", handleDoubleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (isMapAlive(map)) {
        map.off("click", handleClick);
        map.off("mousemove", handleMouseMove);
        map.off("dblclick", handleDoubleClick);
        map.doubleClickZoom.enable();
        map.getCanvas().style.cursor = previousCursor;
      }

      window.removeEventListener("keydown", handleKeyDown);
      clearGhost();
      verticesRef.current = [];
      cursorRef.current = null;
      updateLivePreview(null);
    };
  }, [
    activeMeasureTool,
    cancelMeasuring,
    clearGhost,
    finishMeasurement,
    mapRef,
    syncGhost,
    updateLivePreview,
  ]);

  useEffect(() => () => {
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
  }, []);

  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const embedded = presentation === "embedded";

  return (
    <div
      style={embedded ? embeddedPanelStyle : { ...panelStyle, ...panelPositionStyle }}
      role="region"
      aria-label="Measurement results"
      data-testid="map-measurement-tool"
      data-map-measurement-presentation={presentation}
    >
      <div style={embedded ? headerStyle : { ...headerStyle, ...dragHandleStyle }} {...(embedded ? {} : dragHandleProps)}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Measure</span>
          <span style={mapStyles.sidePanelTitle}>
            <IconMeasure size={MAP_ICON_SIZES.sm} />
            Measurements
          </span>
        </div>

        <div style={{ ...mapStyles.sidePanelHeaderActions, flexDirection: "column", alignItems: "stretch" }}>
          <div style={segmentedControlStyle} role="group" aria-label="Measurement units">
            <button
              type="button"
              style={getUnitButtonStyle(measureUnit === "metric")}
              onClick={() => onSetMeasureUnit("metric")}
              aria-pressed={measureUnit === "metric"}
            >
              Metric
            </button>
            <button
              type="button"
              style={getUnitButtonStyle(measureUnit === "imperial")}
              onClick={() => onSetMeasureUnit("imperial")}
              aria-pressed={measureUnit === "imperial"}
            >
              Imperial
            </button>
          </div>

          {measurements.length > 0 ? (
            <button
              type="button"
              style={{ ...compactButtonStyle, color: MAP_COLORS.error, alignSelf: "flex-end" }}
              onClick={onClearMeasurements}
              aria-label="Clear all measurements"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Measurement summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Units</span>
          <span style={mapStyles.sidePanelMetricValue}>{measureUnit === "metric" ? "Metric" : "Imperial"}</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Results</span>
          <span style={mapStyles.sidePanelMetricValue}>{measurements.length}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Tool</span>
          <span style={mapStyles.sidePanelMetricValue}>
            {activeMeasureTool ? getMeasurementKindLabel(activeMeasureTool) : "Idle"}
          </span>
        </div>
      </div>

      <div style={mapStyles.sidePanelStatusBand}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: MAP_SPACING.xs,
            color: MAP_COLORS.interaction,
            fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
            marginBottom: MAP_SPACING.xs,
          }}
        >
          {activeMeasureTool === "measure-area" ? (
            <>
              <IconArea size={MAP_ICON_SIZES.sm} />
              Area active
            </>
          ) : activeMeasureTool === "measure-distance" ? (
            <>
              <IconRuler size={MAP_ICON_SIZES.sm} />
              Distance active
            </>
          ) : (
            <>
              <IconMeasure size={MAP_ICON_SIZES.sm} />
              Measurement ready
            </>
          )}
        </div>

        <div style={helperTextStyle}>{getMeasurementInstructions(activeMeasureTool)}</div>
        <div style={{ ...helperTextStyle, marginTop: MAP_SPACING.xs }}>
          Method {getMeasurementAssumptionLabel(undefined)}; display coordinates are treated as EPSG:4326.
        </div>
        <div style={{ ...helperTextStyle, marginTop: MAP_SPACING.xs }}>
          CRS preflight allows this as geodesic display measurement only; use projected workflows for analytical metric claims.
        </div>
        {livePreview ? (
          <div style={{ marginTop: MAP_SPACING.sm, display: "grid", gap: MAP_SPACING.xs }}>
            <div style={valueStyle}>{livePreview.primary}</div>
            {livePreview.secondary ? <div style={helperTextStyle}>{livePreview.secondary}</div> : null}
          </div>
        ) : null}
      </div>

      {measurements.length === 0 ? (
        <div style={mapStyles.sidePanelEmpty}>
          Completed measurements will stay listed here until you clear them or close the workspace cycle.
        </div>
      ) : null}

      <div style={embedded ? embeddedBodyStyle : mapStyles.sidePanelBody}>
        {measurements.map((measurement, index) => {
          const isDistance = measurement.type === "measure-distance";
          const isCopied = copiedMeasurementId === measurement.id;
          const perimeter = isDistance
            ? null
            : formatDistance(polygonPerimeter(measurement.coordinates as LngLat[]), measureUnit);
          const bearing = isDistance
            ? getDistanceBearingLabel(measurement.coordinates as LngLat[])
            : null;
          const assumptions = measurement.assumptions ?? buildMeasurementAssumptions(measurement.type);

          return (
            <div key={measurement.id} style={rowStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
                <div style={{ display: "grid", gap: MAP_SPACING.xs, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                      fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: MAP_SPACING.xs,
                      color: MAP_COLORS.text,
                    }}
                  >
                    {isDistance ? <IconRuler size={MAP_ICON_SIZES.sm} /> : <IconArea size={MAP_ICON_SIZES.sm} />}
                    {getMeasurementKindLabel(measurement.type)} #{index + 1}
                  </span>
                  <span style={helperTextStyle}>{measurement.coordinates.length} vertices</span>
                </div>

                <div style={{ display: "inline-flex", gap: MAP_SPACING.xs, alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={compactButtonStyle}
                    onClick={() => {
                      void copyMeasurement(measurement);
                    }}
                    aria-label={`Copy ${getMeasurementKindLabel(measurement.type).toLowerCase()} measurement #${index + 1}`}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    style={compactButtonStyle}
                    onClick={() => onRemoveMeasurement(measurement.id)}
                    aria-label={`Remove measurement #${index + 1}`}
                  >
                    <IconClose size={11} />
                  </button>
                </div>
              </div>

              <div style={valueStyle}>
                {isDistance
                  ? formatDistance(measurement.value, measureUnit)
                  : formatArea(measurement.value, measureUnit)}
              </div>

              {perimeter ? <div style={helperTextStyle}>Perimeter {perimeter}</div> : null}
              {bearing ? <div style={helperTextStyle}>{bearing}</div> : null}
              <div style={helperTextStyle}>
                Method {getMeasurementAssumptionLabel(assumptions)}; CRS {assumptions.crsBasis}
              </div>

              <div style={{ ...helperTextStyle, display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs }}>
                <Clock3 size={12} />
                <time dateTime={measurement.timestamp}>{formatMeasurementTimestamp(measurement.timestamp)}</time>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
