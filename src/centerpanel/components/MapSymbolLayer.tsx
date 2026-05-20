import React, { useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { normalizeGeoJSONSourceDataForRender } from "@/services/map/MapDataImporter";
import { COLOR_RAMPS, type ColorRampName, getColorRampColors } from "../../utils/colorRamps";
import { MAP_COLORS, MAP_RADIUS, MAP_TYPOGRAPHY } from "./map/mapTokens";
import type { OverlayLayerConfig } from "./map/mapTypes";
import {
  decoratePointFeatures,
  type NumericFieldInfo,
  toFiniteNumber,
} from "./map/symbologyUtils";
import {
  buildAttributeColorExpression,
  buildGraduatedSymbolCollection,
  buildProportionalRadiusExpression,
  type GraduatedClassificationMethod,
  type GraduatedSymbolResult,
  SYMBOL_CLASS_FIELD,
} from "./map/symbolStyleUtils";

export type SymbolMode = "proportional" | "graduated";

export interface MapSymbolLayerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
  mode: SymbolMode;
}

type ColorMode = "single" | "attribute";

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
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(12,12,12,0.88)",
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  outline: "none",
};

const rangeInputStyle: React.CSSProperties = {
  width: "100%",
  accentColor: MAP_COLORS.interaction,
};

function symbolSourceId(layerId: string): string {
  return `${layerId}--symbology-symbol-source`;
}

function symbolCircleLayerId(layerId: string): string {
  return `${layerId}--symbology-symbol-circles`;
}

function symbolClusterLayerId(layerId: string): string {
  return `${layerId}--symbology-symbol-clusters`;
}

function symbolClusterCountLayerId(layerId: string): string {
  return `${layerId}--symbology-symbol-cluster-count`;
}

function getNumericDomain(
  collection: GeoJSON.FeatureCollection,
  field: string | null,
): [number, number] | null {
  if (!field) return null;
  const values = collection.features
    .map((feature) => toFiniteNumber(feature.properties?.[field]))
    .filter((value): value is number => value != null);

  if (values.length === 0) return null;
  return [Math.min(...values), Math.max(...values)];
}

function cleanupSymbolArtifacts(map: maplibregl.Map, layerId: string): void {
  if (map.getLayer(symbolClusterCountLayerId(layerId))) {
    map.removeLayer(symbolClusterCountLayerId(layerId));
  }
  if (map.getLayer(symbolClusterLayerId(layerId))) {
    map.removeLayer(symbolClusterLayerId(layerId));
  }
  if (map.getLayer(symbolCircleLayerId(layerId))) {
    map.removeLayer(symbolCircleLayerId(layerId));
  }
  if (map.getSource(symbolSourceId(layerId))) {
    map.removeSource(symbolSourceId(layerId));
  }
}

export const MapSymbolLayer: React.FC<MapSymbolLayerProps> = ({
  mapRef,
  layer,
  featureCollection,
  numericFields,
  mode,
}) => {
  const [valueField, setValueField] = useState("");
  const [minRadius, setMinRadius] = useState(4);
  const [maxRadius, setMaxRadius] = useState(24);
  const [opacity, setOpacity] = useState(0.72);
  const [colorMode, setColorMode] = useState<ColorMode>("single");
  const [singleColor, setSingleColor] = useState("#3794ff");
  const [colorField, setColorField] = useState("");
  const [colorRamp, setColorRamp] = useState<ColorRampName>("YlOrRd");
  const [clusteringEnabled, setClusteringEnabled] = useState(false);
  const [clusterMaxZoom, setClusterMaxZoom] = useState(11);
  const [classCount, setClassCount] = useState(5);
  const [classificationMethod, setClassificationMethod] =
    useState<GraduatedClassificationMethod>("quantile");
  const originalOpacityRef = useRef<unknown>(null);
  const originalLayerIdRef = useRef<string | null>(null);
  const effectiveMinRadius = Math.min(minRadius, maxRadius);
  const effectiveMaxRadius = Math.max(minRadius, maxRadius);

  useEffect(() => {
    if (valueField) return;
    setValueField(numericFields[0]?.name ?? "");
  }, [numericFields, valueField]);

  useEffect(() => {
    if (colorField) return;
    const fallback = numericFields.find((field) => field.name !== valueField)?.name ?? "";
    if (fallback) {
      setColorField(fallback);
    }
  }, [colorField, numericFields, valueField]);

  const decoratedCollection = useMemo(
    () => decoratePointFeatures(featureCollection),
    [featureCollection],
  );

  const valueDomain = useMemo(
    () => getNumericDomain(featureCollection, valueField || null),
    [featureCollection, valueField],
  );

  const secondaryColorDomain = useMemo(
    () => getNumericDomain(featureCollection, colorField || null),
    [colorField, featureCollection],
  );

  const sequentialRampOptions = useMemo(
    () => Object.keys(COLOR_RAMPS.sequential) as ColorRampName[],
    [],
  );

  const graduatedState = useMemo(() => {
    if (mode !== "graduated" || !valueField) {
      return { result: null as GraduatedSymbolResult | null, error: null as string | null };
    }

    try {
      const colors = getColorRampColors(colorRamp, classCount);
      return {
        result: buildGraduatedSymbolCollection(
          featureCollection,
          valueField,
          classificationMethod,
          classCount,
          effectiveMinRadius,
          effectiveMaxRadius,
          colors,
        ),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Failed to build graduated symbol classes.",
      };
    }
  }, [
    classCount,
    classificationMethod,
    colorRamp,
    effectiveMaxRadius,
    effectiveMinRadius,
    featureCollection,
    mode,
    valueField,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !valueField || !valueDomain) return undefined;

    const originalLayer = map.getLayer(layer.id);
    if (!originalLayer || originalLayer.type !== "circle") {
      return undefined;
    }

    if (originalLayerIdRef.current && originalLayerIdRef.current !== layer.id) {
      try {
        map.setPaintProperty(originalLayerIdRef.current, "circle-opacity", originalOpacityRef.current);
        cleanupSymbolArtifacts(map, originalLayerIdRef.current);
      } catch {
        /* ignore */
      }
    }

    if (originalLayerIdRef.current !== layer.id) {
      originalOpacityRef.current = map.getPaintProperty(layer.id, "circle-opacity");
      originalLayerIdRef.current = layer.id;
    }

    map.setPaintProperty(layer.id, "circle-opacity", 0);
    cleanupSymbolArtifacts(map, layer.id);

    const sourceId = symbolSourceId(layer.id);
    const pointSourceData =
      mode === "graduated" && graduatedState.result
        ? graduatedState.result.classifiedCollection
        : decoratedCollection;
    const renderPointSourceData = (normalizeGeoJSONSourceDataForRender(pointSourceData, {
      preservePropertyKeys: [valueField, colorField, SYMBOL_CLASS_FIELD],
    }) as GeoJSON.FeatureCollection | undefined) ?? { type: "FeatureCollection", features: [] };

    map.addSource(sourceId, {
      type: "geojson",
      data: renderPointSourceData,
      cluster: clusteringEnabled,
      clusterMaxZoom,
      clusterRadius: 52,
    });

    let circleColor: unknown = singleColor;
    if (mode === "proportional" && colorMode === "attribute" && colorField && secondaryColorDomain) {
      circleColor = buildAttributeColorExpression(
        colorField,
        secondaryColorDomain[0],
        secondaryColorDomain[1],
        getColorRampColors(colorRamp, 5),
      );
    }

    if (mode === "graduated" && graduatedState.result) {
      const matchExpression: unknown[] = ["match", ["get", SYMBOL_CLASS_FIELD]];
      graduatedState.result.legend.forEach((entry) => {
        matchExpression.push(entry.index, entry.color);
      });
      matchExpression.push(singleColor);
      circleColor = matchExpression;
    }

    let circleRadius: unknown = buildProportionalRadiusExpression(
      valueField,
      valueDomain[0],
      valueDomain[1],
      effectiveMinRadius,
      effectiveMaxRadius,
    );

    if (mode === "graduated" && graduatedState.result) {
      const radiusExpression: unknown[] = ["match", ["get", SYMBOL_CLASS_FIELD]];
      graduatedState.result.legend.forEach((entry) => {
        radiusExpression.push(entry.index, entry.radius);
      });
      radiusExpression.push(effectiveMinRadius);
      circleRadius = radiusExpression;
    }

    const circleLayer: maplibregl.CircleLayerSpecification = {
      id: symbolCircleLayerId(layer.id),
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": circleRadius as maplibregl.ExpressionSpecification,
        "circle-color": circleColor as maplibregl.ExpressionSpecification,
        "circle-opacity": opacity,
        "circle-stroke-color": "rgba(255,255,255,0.55)",
        "circle-stroke-width": 0.8,
      },
      ...(clusteringEnabled
        ? { filter: ["!", ["has", "point_count"]] as maplibregl.FilterSpecification }
        : {}),
    };

    map.addLayer(circleLayer);

    if (clusteringEnabled) {
      map.addLayer({
        id: symbolClusterLayerId(layer.id),
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "rgba(55,148,255,0.4)",
          "circle-stroke-color": "rgba(255,255,255,0.4)",
          "circle-stroke-width": 1,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14,
            20,
            18,
            100,
            24,
            500,
            30,
          ] as maplibregl.ExpressionSpecification,
          "circle-opacity": Math.max(0.2, opacity * 0.8),
        },
      });

      map.addLayer({
        id: symbolClusterCountLayerId(layer.id),
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
        },
        paint: {
          "text-color": MAP_COLORS.white,
        },
      });
    }

    return () => {
      try {
        map.setPaintProperty(layer.id, "circle-opacity", originalOpacityRef.current);
      } catch {
        /* layer removed */
      }
      cleanupSymbolArtifacts(map, layer.id);
    };
  }, [
    clusterMaxZoom,
    clusteringEnabled,
    colorField,
    colorMode,
    colorRamp,
    decoratedCollection,
    effectiveMaxRadius,
    effectiveMinRadius,
    graduatedState.result,
    layer.id,
    mapRef,
    mode,
    opacity,
    secondaryColorDomain,
    singleColor,
    valueDomain,
    valueField,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="symbol-value-field">Value field</label>
        <select
          id="symbol-value-field"
          value={valueField}
          onChange={(event) => setValueField(event.target.value)}
          style={selectStyle}
        >
          {numericFields.length === 0 ? <option value="">No numeric fields</option> : null}
          {numericFields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.name} ({field.numericCount.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="symbol-min-radius">Min radius: {minRadius}px</label>
          <input
            id="symbol-min-radius"
            type="range"
            min={2}
            max={20}
            step={1}
            value={minRadius}
            onChange={(event) => {
              const next = Number(event.target.value);
              setMinRadius(next);
              setMaxRadius((current) => Math.max(current, next));
            }}
            style={rangeInputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="symbol-max-radius">Max radius: {maxRadius}px</label>
          <input
            id="symbol-max-radius"
            type="range"
            min={8}
            max={40}
            step={1}
            value={maxRadius}
            onChange={(event) => {
              const next = Number(event.target.value);
              setMaxRadius(next);
              setMinRadius((current) => Math.min(current, next));
            }}
            style={rangeInputStyle}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="symbol-opacity">Opacity: {opacity.toFixed(2)}</label>
        <input
          id="symbol-opacity"
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(event) => setOpacity(Number(event.target.value))}
          style={rangeInputStyle}
        />
      </div>

      {mode === "proportional" ? (
        <>
          <div style={sectionStyle}>
            <label style={labelStyle} htmlFor="symbol-color-mode">Color by</label>
            <select
              id="symbol-color-mode"
              value={colorMode}
              onChange={(event) => setColorMode(event.target.value as ColorMode)}
              style={selectStyle}
            >
              <option value="single">Single color</option>
              <option value="attribute">Secondary attribute</option>
            </select>
          </div>

          {colorMode === "single" ? (
            <div style={sectionStyle}>
              <label style={labelStyle} htmlFor="symbol-single-color">Symbol color</label>
              <input
                id="symbol-single-color"
                type="color"
                value={singleColor}
                onChange={(event) => setSingleColor(event.target.value)}
                style={{
                  width: 52,
                  height: 34,
                  border: `1px solid ${MAP_COLORS.hairline}`,
                  borderRadius: MAP_RADIUS.sm,
                  background: "transparent",
                }}
              />
            </div>
          ) : (
            <>
              <div style={sectionStyle}>
                <label style={labelStyle} htmlFor="symbol-color-field">Secondary attribute</label>
                <select
                  id="symbol-color-field"
                  value={colorField}
                  onChange={(event) => setColorField(event.target.value)}
                  style={selectStyle}
                >
                  {numericFields.filter((field) => field.name !== valueField).map((field) => (
                    <option key={field.name} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>

              <div style={sectionStyle}>
                <label style={labelStyle} htmlFor="symbol-color-ramp">Sequential ramp</label>
                <select
                  id="symbol-color-ramp"
                  value={colorRamp}
                  onChange={(event) => setColorRamp(event.target.value as ColorRampName)}
                  style={selectStyle}
                >
                  {sequentialRampOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 2 }}>
                  {getColorRampColors(colorRamp, 5).map((color) => (
                    <span
                      key={`${colorRamp}-${color}`}
                      style={{ flex: 1, height: 10, borderRadius: 999, background: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={sectionStyle}>
              <label style={labelStyle} htmlFor="graduated-method">Classification</label>
              <select
                id="graduated-method"
                value={classificationMethod}
                onChange={(event) => setClassificationMethod(event.target.value as GraduatedClassificationMethod)}
                style={selectStyle}
              >
                <option value="equal-interval">Equal Interval</option>
                <option value="quantile">Quantile</option>
                <option value="natural-breaks">Natural Breaks (Jenks)</option>
              </select>
            </div>

            <div style={sectionStyle}>
              <label style={labelStyle} htmlFor="graduated-class-count">Classes</label>
              <select
                id="graduated-class-count"
                value={classCount}
                onChange={(event) => setClassCount(Number(event.target.value))}
                style={selectStyle}
              >
                {Array.from({ length: 7 }, (_, index) => index + 3).map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle} htmlFor="graduated-ramp">Sequential ramp</label>
            <select
              id="graduated-ramp"
              value={colorRamp}
              onChange={(event) => setColorRamp(event.target.value as ColorRampName)}
              style={selectStyle}
            >
              {sequentialRampOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 2 }}>
              {getColorRampColors(colorRamp, Math.max(3, Math.min(classCount, 5))).map((color) => (
                <span
                  key={`${colorRamp}-${color}`}
                  style={{ flex: 1, height: 10, borderRadius: 999, background: color }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: MAP_COLORS.textSecondary,
          fontSize: 12,
        }}
      >
        <input
          type="checkbox"
          checked={clusteringEnabled}
          onChange={(event) => setClusteringEnabled(event.target.checked)}
          style={{ accentColor: MAP_COLORS.interaction }}
        />
        Cluster points at low zoom
      </label>

      {clusteringEnabled ? (
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="symbol-cluster-max-zoom">
            Cluster max zoom: {clusterMaxZoom}
          </label>
          <input
            id="symbol-cluster-max-zoom"
            type="range"
            min={6}
            max={16}
            step={1}
            value={clusterMaxZoom}
            onChange={(event) => setClusterMaxZoom(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>
      ) : null}

      {mode === "graduated" && graduatedState.error ? (
        <div style={{ color: MAP_COLORS.error, fontSize: 12, lineHeight: 1.5 }}>
          {graduatedState.error}
        </div>
      ) : null}

      {mode === "graduated" && graduatedState.result ? (
        <div style={sectionStyle}>
          <div style={labelStyle}>Legend</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {graduatedState.result.legend.map((entry) => (
              <div
                key={entry.index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: MAP_RADIUS.sm,
                  border: `1px solid ${MAP_COLORS.hairline}`,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    width: entry.radius,
                    height: entry.radius,
                    minWidth: entry.radius,
                    minHeight: entry.radius,
                    borderRadius: 999,
                    background: entry.color,
                    opacity,
                    justifySelf: "center",
                  }}
                />
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ color: MAP_COLORS.text, fontSize: 12 }}>{entry.label}</span>
                  <span style={{ color: MAP_COLORS.textMuted, fontSize: 10 }}>
                    {entry.min.toLocaleString(undefined, { maximumFractionDigits: 4 })} to {entry.max.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </span>
                <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
                  {entry.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
