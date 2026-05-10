import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { DESIGN_TOKENS } from "@/constants/design";
import { resolveGeoJSONSourceToFeatureCollection } from "../../services/map/MapDataImporter";
import {
  type ClassificationMethod,
  type ClassificationResult,
  classifyNumericValues,
  findClassificationClassIndex,
  parseManualBreaks,
} from "../../utils/classification";
import {
  COLOR_RAMPS,
  type ColorRampCategory,
  type ColorRampName,
  getColorRampColors,
  getRampPreviewColors,
} from "../../utils/colorRamps";
import type { OverlayLayerConfig } from "./map/mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";
import { IconClose, IconLayers } from "./map/MapIcons";

const CHOROPLETH_CLASS_FIELD = "__choroplethClass";
const CHOROPLETH_CLASS_LABEL_FIELD = "__choroplethClassLabel";
const CHOROPLETH_VALUE_FIELD = "__choroplethValue";
const CHOROPLETH_FEATURE_ID_FIELD = "__choroplethFeatureId";

const PANEL_WIDTH = 360;

type NumericFieldInfo = {
  name: string;
  numericCount: number;
};

type ResolvedLayerState = {
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
};

type DecoratedLegendClass = ClassificationResult["classes"][number] & {
  color: string;
};

type ChoroplethComputation = {
  classifiedCollection: GeoJSON.FeatureCollection;
  classification: ClassificationResult;
  legendClasses: DecoratedLegendClass[];
  totalFeatureCount: number;
  numericFeatureCount: number;
  noDataCount: number;
  activeColors: string[];
};

type HoverState = {
  x: number;
  y: number;
  featureId: string;
  valueLabel: string;
  classLabel: string;
};

interface MapChoroplethLayerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  overlayLayers: OverlayLayerConfig[];
  visible: boolean;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
}

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(PANEL_WIDTH),
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
  color: MAP_COLORS.text,
};

const panelBodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: "14px",
  overflowY: "auto",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 34,
  padding: "7px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(12,12,12,0.88)",
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  outline: "none",
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
};

const legendButtonStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "12px minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "center",
  width: "100%",
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(255,255,255,0.02)",
  color: MAP_COLORS.text,
  textAlign: "left",
  cursor: "pointer",
  transition: DESIGN_TOKENS.transitions.sm,
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  minWidth: 180,
  maxWidth: 260,
  padding: "8px 10px",
  background: "rgba(13,13,13,0.94)",
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
  pointerEvents: "none",
  zIndex: MAP_Z_INDEX.dropdown + 10,
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isGeoJsonLayer(layer: OverlayLayerConfig): boolean {
  return layer.type === "geojson";
}

function inferGeometryType(geometry: GeoJSON.Geometry | null | undefined): string {
  if (!geometry) return "unknown";
  return geometry.type.toLowerCase();
}

function hasPolygonGeometry(collection: GeoJSON.FeatureCollection): boolean {
  return collection.features.some((feature) => {
    const geometryType = inferGeometryType(feature.geometry);
    return geometryType === "polygon" || geometryType === "multipolygon";
  });
}

function collectNumericFields(collection: GeoJSON.FeatureCollection): NumericFieldInfo[] {
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

async function resolveFeatureCollection(layer: OverlayLayerConfig): Promise<GeoJSON.FeatureCollection> {
  return resolveGeoJSONSourceToFeatureCollection(layer.sourceData, layer.name);
}

function buildFeatureIdentifier(feature: GeoJSON.Feature, index: number): string {
  if (feature.id != null) return String(feature.id);
  const propertyId = feature.properties?.id;
  if (propertyId != null) return String(propertyId);
  return `feature-${index + 1}`;
}

function formatValueLabel(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function buildPopupContent(feature: GeoJSON.Feature, featureId: string): HTMLDivElement {
  const shell = document.createElement("div");
  shell.style.minWidth = "240px";
  shell.style.maxWidth = "340px";
  shell.style.padding = "10px 12px";
  shell.style.background = "rgba(13,13,13,0.96)";
  shell.style.border = `1px solid ${MAP_COLORS.amberBorderStrong}`;
  shell.style.borderRadius = MAP_RADIUS.md;
  shell.style.color = MAP_COLORS.text;
  shell.style.fontFamily = MAP_TYPOGRAPHY.fontFamily;
  shell.style.boxShadow = MAP_SHADOWS.dropdown;

  const header = document.createElement("div");
  header.textContent = featureId;
  header.style.color = MAP_COLORS.amber;
  header.style.fontSize = "12px";
  header.style.fontWeight = String(MAP_TYPOGRAPHY.fontWeight.semibold);
  header.style.marginBottom = "8px";
  shell.appendChild(header);

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const properties = Object.entries(feature.properties ?? {}).filter(
    ([key]) => !key.startsWith("__choropleth"),
  );

  for (const [key, value] of properties) {
    const row = document.createElement("tr");
    const keyCell = document.createElement("td");
    const valueCell = document.createElement("td");

    keyCell.textContent = key;
    keyCell.style.padding = "4px 8px 4px 0";
    keyCell.style.color = MAP_COLORS.textSecondary;
    keyCell.style.fontSize = "11px";
    keyCell.style.verticalAlign = "top";

    valueCell.textContent = value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
    valueCell.style.padding = "4px 0";
    valueCell.style.color = MAP_COLORS.text;
    valueCell.style.fontSize = "11px";
    valueCell.style.wordBreak = "break-word";

    row.appendChild(keyCell);
    row.appendChild(valueCell);
    table.appendChild(row);
  }

  shell.appendChild(table);
  return shell;
}

function buildFillColorExpression(colors: string[]): unknown[] {
  const expression: unknown[] = ["match", ["get", CHOROPLETH_CLASS_FIELD]];
  colors.forEach((color, index) => {
    expression.push(index, color);
  });
  expression.push("rgba(120,120,120,0.35)");
  return expression;
}

function buildFillOpacityExpression(baseOpacity: number, isolatedClass: number | null): unknown {
  const activeOpacity = Math.max(0.15, Math.min(0.92, baseOpacity * 0.72));
  if (isolatedClass == null) {
    return activeOpacity;
  }
  return [
    "case",
    ["==", ["get", CHOROPLETH_CLASS_FIELD], isolatedClass],
    activeOpacity,
    0.08,
  ];
}

function hoverLayerId(layerId: string): string {
  return `${layerId}--choropleth-hover`;
}

function outlineLayerId(layerId: string): string {
  return `${layerId}--choropleth-outline`;
}

function isPolygonCandidate(layer: OverlayLayerConfig): boolean {
  if (!isGeoJsonLayer(layer)) return false;
  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  if (!geometryType) return true;
  return geometryType.includes("polygon") || geometryType.includes("multi");
}

export const MapChoroplethLayer: React.FC<MapChoroplethLayerProps> = ({
  mapRef,
  overlayLayers,
  visible,
  onClose,
  onAnnounce,
}) => {
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [classificationMethod, setClassificationMethod] = useState<ClassificationMethod>("quantile");
  const [classCount, setClassCount] = useState(5);
  const [colorRamp, setColorRamp] = useState<ColorRampName>("YlOrRd");
  const [manualBreakInput, setManualBreakInput] = useState("");
  const [isolatedClassIndex, setIsolatedClassIndex] = useState<number | null>(null);
  const [resolvedLayer, setResolvedLayer] = useState<ResolvedLayerState | null>(null);
  const [isResolvingLayer, setIsResolvingLayer] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const originalLayerStateRef = useRef<{
    layerId: string;
    sourceData: OverlayLayerConfig["sourceData"];
    fillColor: unknown;
    fillOpacity: unknown;
  } | null>(null);
  const hoveredFeatureIdRef = useRef<string | null>(null);

  const eligibleLayers = useMemo(
    () => overlayLayers.filter((layer) => layer.visible && isPolygonCandidate(layer)),
    [overlayLayers],
  );

  const activeLayer = useMemo(
    () => eligibleLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [eligibleLayers, selectedLayerId],
  );

  useEffect(() => {
    if (!visible) return;
    if (activeLayer) return;
    const nextLayerId = eligibleLayers[0]?.id ?? "";
    setSelectedLayerId(nextLayerId);
    setIsolatedClassIndex(null);
  }, [activeLayer, eligibleLayers, visible]);

  useEffect(() => {
    if (!visible || !activeLayer) {
      setResolvedLayer(null);
      setLoadError(null);
      return undefined;
    }

    let cancelled = false;
    setIsResolvingLayer(true);
    setLoadError(null);

    void resolveFeatureCollection(activeLayer)
      .then((featureCollection) => {
        if (cancelled) return;
        if (!hasPolygonGeometry(featureCollection)) {
          throw new Error("Selected layer does not contain polygon geometries.");
        }

        const numericFields = collectNumericFields(featureCollection);
        setResolvedLayer({
          layer: activeLayer,
          featureCollection,
          numericFields,
        });
        setSelectedField((current) =>
          numericFields.some((field) => field.name === current)
            ? current
            : numericFields[0]?.name ?? "",
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setResolvedLayer(null);
        setLoadError(error instanceof Error ? error.message : "Failed to read polygon layer.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingLayer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeLayer, visible]);

  const classificationState = useMemo(() => {
    if (!resolvedLayer || !selectedField) {
      return { computation: null as ChoroplethComputation | null, error: null as string | null };
    }

    try {
      const featureValues = resolvedLayer.featureCollection.features.map((feature, index) => {
        const rawValue = feature.properties?.[selectedField];
        return {
          feature,
          index,
          numericValue: toFiniteNumber(rawValue),
        };
      });

      const validValues = featureValues
        .map((entry) => entry.numericValue)
        .filter((value): value is number => value != null);

      if (validValues.length === 0) {
        return {
          computation: null,
          error: "Selected attribute does not contain numeric polygon values.",
        };
      }

      const manualBreaks = classificationMethod === "manual" ? parseManualBreaks(manualBreakInput) : undefined;
      const classification = classifyNumericValues(validValues, {
        method: classificationMethod,
        classCount,
        ...(manualBreaks ? { manualBreaks } : {}),
      });

      const activeColors = getColorRampColors(colorRamp, classification.classCount);
      const classifiedCollection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: featureValues.map(({ feature, index, numericValue }) => {
          const featureId = buildFeatureIdentifier(feature, index);
          const properties: Record<string, unknown> = {
            ...(feature.properties ?? {}),
            [CHOROPLETH_FEATURE_ID_FIELD]: featureId,
          };

          if (numericValue != null) {
            const classIndex = findClassificationClassIndex(numericValue, classification);
            properties[CHOROPLETH_CLASS_FIELD] = classIndex;
            properties[CHOROPLETH_CLASS_LABEL_FIELD] =
              classification.classes[classIndex]?.label ?? "No data";
            properties[CHOROPLETH_VALUE_FIELD] = numericValue;
          } else {
            properties[CHOROPLETH_CLASS_FIELD] = -1;
            properties[CHOROPLETH_CLASS_LABEL_FIELD] = "No data";
          }

          return {
            ...feature,
            id: feature.id ?? featureId,
            properties: properties as GeoJSON.GeoJsonProperties,
          };
        }),
      };

      return {
        computation: {
          classifiedCollection,
          classification,
          legendClasses: classification.classes.map((entry, index) => ({
            ...entry,
            color: activeColors[index] ?? activeColors[activeColors.length - 1] ?? MAP_COLORS.amber,
          })),
          totalFeatureCount: resolvedLayer.featureCollection.features.length,
          numericFeatureCount: validValues.length,
          noDataCount: resolvedLayer.featureCollection.features.length - validValues.length,
          activeColors,
        },
        error: null,
      };
    } catch (error) {
      return {
        computation: null,
        error: error instanceof Error ? error.message : "Failed to classify polygon layer.",
      };
    }
  }, [
    classCount,
    classificationMethod,
    colorRamp,
    manualBreakInput,
    resolvedLayer,
    selectedField,
  ]);

  const restoreOriginalLayer = useCallback(() => {
    const map = mapRef.current;
    const originalState = originalLayerStateRef.current;
    if (!map || !originalState) return;

    popupRef.current?.remove();
    popupRef.current = null;
    setHoverState(null);
    hoveredFeatureIdRef.current = null;

    try {
      const source = map.getSource(originalState.layerId) as maplibregl.GeoJSONSource | undefined;
      if (source && originalState.sourceData != null) {
        source.setData(originalState.sourceData as string | GeoJSON.GeoJSON);
      }
    } catch {
      /* source already removed */
    }

    try {
      if (map.getLayer(originalState.layerId)) {
        map.setPaintProperty(originalState.layerId, "fill-color", originalState.fillColor);
        map.setPaintProperty(originalState.layerId, "fill-opacity", originalState.fillOpacity);
      }
    } catch {
      /* paint properties unavailable */
    }

    try {
      if (map.getLayer(outlineLayerId(originalState.layerId))) {
        map.removeLayer(outlineLayerId(originalState.layerId));
      }
      if (map.getLayer(hoverLayerId(originalState.layerId))) {
        map.removeLayer(hoverLayerId(originalState.layerId));
      }
    } catch {
      /* layer already removed */
    }

    map.getCanvas().style.cursor = "";
    originalLayerStateRef.current = null;
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!visible || !map || !activeLayer || !classificationState.computation || classificationState.error) {
      restoreOriginalLayer();
      return;
    }

    const fillLayer = map.getLayer(activeLayer.id);
    const source = map.getSource(activeLayer.id) as maplibregl.GeoJSONSource | undefined;
    if (!fillLayer || fillLayer.type !== "fill" || !source) {
      return;
    }

    if (originalLayerStateRef.current?.layerId !== activeLayer.id) {
      restoreOriginalLayer();
      originalLayerStateRef.current = {
        layerId: activeLayer.id,
        sourceData: activeLayer.sourceData,
        fillColor: map.getPaintProperty(activeLayer.id, "fill-color"),
        fillOpacity: map.getPaintProperty(activeLayer.id, "fill-opacity"),
      };
    }

    source.setData(classificationState.computation.classifiedCollection);
    map.setPaintProperty(
      activeLayer.id,
      "fill-color",
      buildFillColorExpression(classificationState.computation.activeColors) as maplibregl.ExpressionSpecification,
    );
    map.setPaintProperty(
      activeLayer.id,
      "fill-opacity",
      buildFillOpacityExpression(activeLayer.opacity, isolatedClassIndex) as maplibregl.ExpressionSpecification,
    );

    if (!map.getLayer(outlineLayerId(activeLayer.id))) {
      map.addLayer({
        id: outlineLayerId(activeLayer.id),
        type: "line",
        source: activeLayer.id,
        paint: {
          "line-color": "rgba(255,255,255,0.22)",
          "line-width": 1.1,
          "line-opacity": 0.75,
        },
      });
    }

    if (!map.getLayer(hoverLayerId(activeLayer.id))) {
      map.addLayer({
        id: hoverLayerId(activeLayer.id),
        type: "line",
        source: activeLayer.id,
        paint: {
          "line-color": MAP_COLORS.white,
          "line-width": 2.4,
          "line-opacity": 0.95,
        },
        filter: ["==", ["get", CHOROPLETH_FEATURE_ID_FIELD], ""],
      });
    }

    map.setFilter(
      hoverLayerId(activeLayer.id),
      ["==", ["get", CHOROPLETH_FEATURE_ID_FIELD], hoveredFeatureIdRef.current ?? ""],
    );
  }, [
    activeLayer,
    classificationState.computation,
    classificationState.error,
    isolatedClassIndex,
    mapRef,
    restoreOriginalLayer,
    visible,
  ]);

  useEffect(() => {
    return () => {
      restoreOriginalLayer();
    };
  }, [restoreOriginalLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!visible || !map || !activeLayer || !classificationState.computation || classificationState.error) {
      return undefined;
    }

    const currentLayerId = activeLayer.id;
    let hoverAnimationFrame: number | null = null;
    let latestHoverEvent: maplibregl.MapMouseEvent | null = null;

    const clearHover = () => {
      if (hoverAnimationFrame != null) {
        window.cancelAnimationFrame(hoverAnimationFrame);
        hoverAnimationFrame = null;
      }
      latestHoverEvent = null;
      hoveredFeatureIdRef.current = null;
      setHoverState(null);
      try {
        if (map.getLayer(hoverLayerId(currentLayerId))) {
          map.setFilter(
            hoverLayerId(currentLayerId),
            ["==", ["get", CHOROPLETH_FEATURE_ID_FIELD], ""],
          );
        }
      } catch {
        /* ignore */
      }
      map.getCanvas().style.cursor = "";
    };

    const processHover = () => {
      const event = latestHoverEvent;
      latestHoverEvent = null;
      hoverAnimationFrame = null;
      if (!event) return;

      const features = map.queryRenderedFeatures(event.point, {
        layers: [currentLayerId],
      }) as maplibregl.MapGeoJSONFeature[];

      const feature = features[0];
      if (!feature) {
        clearHover();
        return;
      }

      const properties = feature.properties ?? {};
      const featureId = String(properties[CHOROPLETH_FEATURE_ID_FIELD] ?? feature.id ?? "feature");
      const numericValue = toFiniteNumber(properties[CHOROPLETH_VALUE_FIELD]);
      const classLabel = String(properties[CHOROPLETH_CLASS_LABEL_FIELD] ?? "No data");

      hoveredFeatureIdRef.current = featureId;
      setHoverState({
        x: event.point.x + 16,
        y: event.point.y + 16,
        featureId,
        valueLabel: numericValue != null ? formatValueLabel(numericValue) : "No data",
        classLabel,
      });

      if (map.getLayer(hoverLayerId(currentLayerId))) {
        map.setFilter(
          hoverLayerId(currentLayerId),
          ["==", ["get", CHOROPLETH_FEATURE_ID_FIELD], featureId],
        );
      }
      map.getCanvas().style.cursor = "pointer";
    };

    const onMouseMove = (event: maplibregl.MapMouseEvent) => {
      latestHoverEvent = event;
      if (hoverAnimationFrame == null) {
        hoverAnimationFrame = window.requestAnimationFrame(processHover);
      }
    };

    const onClick = (event: maplibregl.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: [currentLayerId],
      })[0] as maplibregl.MapGeoJSONFeature | undefined;

      if (!feature) {
        popupRef.current?.remove();
        popupRef.current = null;
        return;
      }

      const featureId = String(
        feature.properties?.[CHOROPLETH_FEATURE_ID_FIELD] ?? feature.id ?? "feature",
      );

      const popupFeature: GeoJSON.Feature = {
        type: "Feature",
        id: feature.id as string | number | undefined,
        geometry: feature.geometry as GeoJSON.Geometry,
        properties: { ...(feature.properties ?? {}) },
      };

      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "360px",
        offset: 16,
      })
        .setLngLat(event.lngLat)
        .setDOMContent(buildPopupContent(popupFeature, featureId))
        .addTo(map);
    };

    map.on("mousemove", onMouseMove);
    map.on("mouseout", clearHover);
    map.on("movestart", clearHover);
    map.on("click", onClick);

    return () => {
      clearHover();
      popupRef.current?.remove();
      popupRef.current = null;
      map.off("mousemove", onMouseMove);
      map.off("mouseout", clearHover);
      map.off("movestart", clearHover);
      map.off("click", onClick);
    };
  }, [
    activeLayer,
    classificationState.computation,
    classificationState.error,
    mapRef,
    selectedField,
    visible,
  ]);

  if (!visible) {
    return null;
  }

  const rampGroups: Array<{ category: ColorRampCategory; names: ColorRampName[] }> = [
    {
      category: "sequential",
      names: Object.keys(COLOR_RAMPS.sequential) as ColorRampName[],
    },
    {
      category: "diverging",
      names: Object.keys(COLOR_RAMPS.diverging) as ColorRampName[],
    },
    {
      category: "qualitative",
      names: Object.keys(COLOR_RAMPS.qualitative) as ColorRampName[],
    },
  ];

  return (
    <>
      <div style={{ ...panelStyle, ...panelPositionStyle }} role="dialog" aria-label="Choropleth configuration">
        <div style={{ ...panelHeaderStyle, ...dragHandleStyle }} {...dragHandleProps}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconLayers size={14} color={MAP_COLORS.amber} />
            <div>
              <div
                style={{
                  color: MAP_COLORS.amber,
                  fontSize: 12,
                  fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Choropleth
              </div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
                Classification-based thematic rendering
              </div>
            </div>
          </div>

          <button
            type="button"
            style={{
              border: `1px solid ${MAP_COLORS.amberBorder}`,
              background: "transparent",
              color: MAP_COLORS.textSecondary,
              width: 28,
              height: 28,
              borderRadius: MAP_RADIUS.sm,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              restoreOriginalLayer();
              onClose();
            }}
            aria-label="Close choropleth panel"
          >
            <IconClose size={14} />
          </button>
        </div>

        <div style={panelBodyStyle}>
          <div style={sectionStyle}>
            <label style={labelStyle} htmlFor="choropleth-layer-select">Polygon layer</label>
            <select
              id="choropleth-layer-select"
              value={selectedLayerId}
              onChange={(event) => {
                setSelectedLayerId(event.target.value);
                setIsolatedClassIndex(null);
                onAnnounce?.(`Choropleth layer changed to ${event.target.selectedOptions[0]?.textContent ?? event.target.value}`);
              }}
              style={selectStyle}
            >
              {eligibleLayers.length === 0 ? <option value="">No polygon GeoJSON layers</option> : null}
              {eligibleLayers.map((layer) => (
                <option key={layer.id} value={layer.id}>{layer.name}</option>
              ))}
            </select>
          </div>

          {eligibleLayers.length === 0 ? (
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
              Import or enable a GeoJSON polygon layer to start thematic mapping.
            </div>
          ) : null}

          {isResolvingLayer ? (
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12 }}>Loading polygon features...</div>
          ) : null}

          {loadError ? (
            <div style={{ color: MAP_COLORS.error, fontSize: 12, lineHeight: 1.5 }}>{loadError}</div>
          ) : null}

          {resolvedLayer ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={sectionStyle}>
                  <label style={labelStyle} htmlFor="choropleth-field-select">Attribute</label>
                  <select
                    id="choropleth-field-select"
                    value={selectedField}
                    onChange={(event) => setSelectedField(event.target.value)}
                    style={selectStyle}
                  >
                    {resolvedLayer.numericFields.length === 0 ? <option value="">No numeric fields</option> : null}
                    {resolvedLayer.numericFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.name} ({field.numericCount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle} htmlFor="choropleth-method-select">Method</label>
                  <select
                    id="choropleth-method-select"
                    value={classificationMethod}
                    onChange={(event) => {
                      setClassificationMethod(event.target.value as ClassificationMethod);
                      setIsolatedClassIndex(null);
                    }}
                    style={selectStyle}
                  >
                    <option value="equal-interval">Equal Interval</option>
                    <option value="quantile">Quantile</option>
                    <option value="natural-breaks">Natural Breaks (Jenks)</option>
                    <option value="standard-deviation">Standard Deviation</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={sectionStyle}>
                  <label style={labelStyle} htmlFor="choropleth-class-count">Classes</label>
                  <select
                    id="choropleth-class-count"
                    value={classCount}
                    onChange={(event) => {
                      setClassCount(Number(event.target.value));
                      setIsolatedClassIndex(null);
                    }}
                    style={selectStyle}
                  >
                    {Array.from({ length: 7 }, (_, index) => index + 3).map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle} htmlFor="choropleth-ramp-select">Color ramp</label>
                  <select
                    id="choropleth-ramp-select"
                    value={colorRamp}
                    onChange={(event) => setColorRamp(event.target.value as ColorRampName)}
                    style={selectStyle}
                  >
                    {rampGroups.map((group) => (
                      <optgroup
                        key={group.category}
                        label={group.category[0]!.toUpperCase() + group.category.slice(1)}
                      >
                        {group.names.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {classificationMethod === "manual" ? (
                <div style={sectionStyle}>
                  <label style={labelStyle} htmlFor="choropleth-manual-breaks">
                    Manual breaks
                  </label>
                  <input
                    id="choropleth-manual-breaks"
                    type="text"
                    value={manualBreakInput}
                    onChange={(event) => setManualBreakInput(event.target.value)}
                    placeholder={`Enter ${Math.max(classCount - 1, 0)} comma-separated break values`}
                    style={inputStyle}
                  />
                  <div style={{ color: MAP_COLORS.textMuted, fontSize: 11 }}>
                    Use comma, semicolon, or line-break separators. Example: 10, 25, 50, 90
                  </div>
                </div>
              ) : null}

              <div style={sectionStyle}>
                <div style={labelStyle}>Ramp preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {rampGroups.map((group) =>
                    group.names.map((name) => {
                      const previewColors = getRampPreviewColors(name, Math.min(classCount, 5));
                      const isActive = colorRamp === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setColorRamp(name)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            padding: "8px 10px",
                            borderRadius: MAP_RADIUS.sm,
                            border: `1px solid ${isActive ? MAP_COLORS.amberBorderStrong : MAP_COLORS.amberBorder}`,
                            background: isActive ? MAP_COLORS.amberDim : "rgba(255,255,255,0.02)",
                            color: isActive ? MAP_COLORS.amber : MAP_COLORS.text,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                            {name}
                          </span>
                          <span style={{ display: "flex", gap: 2 }}>
                            {previewColors.map((color) => (
                              <span
                                key={`${name}-${color}`}
                                style={{
                                  flex: 1,
                                  height: 10,
                                  borderRadius: 999,
                                  background: color,
                                }}
                              />
                            ))}
                          </span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>

              {classificationState.error ? (
                <div style={{ color: MAP_COLORS.error, fontSize: 12, lineHeight: 1.5 }}>
                  {classificationState.error}
                </div>
              ) : null}

              {classificationState.computation ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    <div style={{ padding: "8px 10px", borderRadius: MAP_RADIUS.sm, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>Polygons</div>
                      <div style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                        {classificationState.computation.totalFeatureCount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: MAP_RADIUS.sm, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>Numeric</div>
                      <div style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                        {classificationState.computation.numericFeatureCount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: MAP_RADIUS.sm, background: "rgba(255,255,255,0.03)" }}>
                      <div style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase" }}>No data</div>
                      <div style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                        {classificationState.computation.noDataCount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={sectionStyle}>
                    <div style={{ ...labelStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Legend</span>
                      <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "none" }}>
                        Click a class to isolate it
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {classificationState.computation.legendClasses.map((entry) => {
                        const isActive = isolatedClassIndex === entry.index;
                        return (
                          <button
                            key={entry.index}
                            type="button"
                            onClick={() => setIsolatedClassIndex((current) => (current === entry.index ? null : entry.index))}
                            style={{
                              ...legendButtonStyle,
                              border: `1px solid ${isActive ? MAP_COLORS.amberBorderStrong : MAP_COLORS.amberBorder}`,
                              background: isActive ? MAP_COLORS.amberDim : legendButtonStyle.background,
                            }}
                            aria-pressed={isActive}
                          >
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                background: entry.color,
                              }}
                            />
                            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span style={{ fontSize: 12, color: MAP_COLORS.text }}>{entry.label}</span>
                              <span style={{ fontSize: 10, color: MAP_COLORS.textMuted }}>
                                {formatValueLabel(entry.min)} to {formatValueLabel(entry.max)}
                              </span>
                            </span>
                            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
                              {entry.count.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}

                      {classificationState.computation.noDataCount > 0 ? (
                        <div style={{ ...legendButtonStyle, cursor: "default" }}>
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              background: "rgba(120,120,120,0.35)",
                            }}
                          />
                          <span style={{ fontSize: 12, color: MAP_COLORS.text }}>No data</span>
                          <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
                            {classificationState.computation.noDataCount.toLocaleString()}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {hoverState ? (
        <div
          style={{
            ...tooltipStyle,
            left: Math.min(hoverState.x, window.innerWidth - 280),
            top: Math.min(hoverState.y, window.innerHeight - 140),
          }}
          aria-hidden="true"
        >
          <div style={{ color: MAP_COLORS.amber, fontSize: 11, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
            {hoverState.featureId}
          </div>
          <div style={{ color: MAP_COLORS.text, fontSize: 13, marginTop: 2 }}>
            {selectedField}: {hoverState.valueLabel}
          </div>
          <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>
            {hoverState.classLabel}
          </div>
        </div>
      ) : null}
    </>
  );
};
