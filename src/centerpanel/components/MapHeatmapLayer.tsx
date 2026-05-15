import React, { useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { MAP_COLORS, MAP_RADIUS, MAP_TYPOGRAPHY } from "./map/mapTokens";
import type { OverlayLayerConfig } from "./map/mapTypes";
import {
  buildHeatmapColorExpression,
  HEATMAP_GRADIENTS,
  type HeatmapGradientName,
} from "./map/heatmapStyleUtils";
import {
  decoratePointFeatures,
  type NumericFieldInfo,
  toFiniteNumber,
} from "./map/symbologyUtils";
import { normalizeGeoJSONSourceDataForRender } from "@/services/map/MapDataImporter";

export interface MapHeatmapLayerProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
}

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

const rangeInputStyle: React.CSSProperties = {
  width: "100%",
  accentColor: MAP_COLORS.amber,
};

function heatmapSourceId(layerId: string): string {
  return `${layerId}--symbology-heatmap-source`;
}

function heatmapLayerId(layerId: string): string {
  return `${layerId}--symbology-heatmap-layer`;
}

function heatmapCircleLayerId(layerId: string): string {
  return `${layerId}--symbology-heatmap-circles`;
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

function cleanupHeatmapArtifacts(map: maplibregl.Map, layerId: string): void {
  if (map.getLayer(heatmapCircleLayerId(layerId))) {
    map.removeLayer(heatmapCircleLayerId(layerId));
  }
  if (map.getLayer(heatmapLayerId(layerId))) {
    map.removeLayer(heatmapLayerId(layerId));
  }
  if (map.getSource(heatmapSourceId(layerId))) {
    map.removeSource(heatmapSourceId(layerId));
  }
}

export const MapHeatmapLayer: React.FC<MapHeatmapLayerProps> = ({
  mapRef,
  layer,
  featureCollection,
  numericFields,
}) => {
  const [radius, setRadius] = useState(24);
  const [weightField, setWeightField] = useState<string>("uniform");
  const [intensity, setIntensity] = useState(1.2);
  const [gradient, setGradient] = useState<HeatmapGradientName>("hot");
  const [opacity, setOpacity] = useState(0.9);
  const [dynamicRadius, setDynamicRadius] = useState(true);
  const [transitionZoom, setTransitionZoom] = useState(12);
  const originalOpacityRef = useRef<unknown>(null);
  const originalLayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (weightField !== "uniform") return;
    const suggested = numericFields.find((field) =>
      ["weight", "count", "value", "intensity", "magnitude"].some((token) =>
        field.name.toLowerCase().includes(token),
      ),
    );
    if (suggested) {
      setWeightField(suggested.name);
    }
  }, [numericFields, weightField]);

  const decoratedCollection = useMemo(
    () => decoratePointFeatures(featureCollection),
    [featureCollection],
  );

  const weightDomain = useMemo(
    () => getNumericDomain(featureCollection, weightField === "uniform" ? null : weightField),
    [featureCollection, weightField],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const originalLayer = map.getLayer(layer.id);
    if (!originalLayer || originalLayer.type !== "circle") {
      return undefined;
    }

    if (originalLayerIdRef.current && originalLayerIdRef.current !== layer.id) {
      try {
        map.setPaintProperty(originalLayerIdRef.current, "circle-opacity", originalOpacityRef.current);
        cleanupHeatmapArtifacts(map, originalLayerIdRef.current);
      } catch {
        /* layer may already be gone */
      }
    }

    if (originalLayerIdRef.current !== layer.id) {
      originalOpacityRef.current = map.getPaintProperty(layer.id, "circle-opacity");
      originalLayerIdRef.current = layer.id;
    }

    map.setPaintProperty(layer.id, "circle-opacity", 0);

    const sourceId = heatmapSourceId(layer.id);
    const heatLayerId = heatmapLayerId(layer.id);
    const circleLayerId = heatmapCircleLayerId(layer.id);

    const heatmapWeight =
      weightField === "uniform" || !weightDomain
        ? 1
        : weightDomain[0] === weightDomain[1]
          ? 1
          : [
            "interpolate",
            ["linear"],
            ["to-number", ["get", weightField], 0],
            weightDomain[0],
            0.05,
            weightDomain[1],
            1,
          ];

    const heatmapRadius = dynamicRadius
      ? [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        Math.max(5, Math.round(radius * 0.45)),
        transitionZoom,
        radius,
        22,
        Math.min(60, Math.round(radius * 1.5)),
      ]
      : radius;

    const heatmapOpacity = [
      "interpolate",
      ["linear"],
      ["zoom"],
      Math.max(0, transitionZoom - 1.5),
      opacity,
      transitionZoom + 1,
      0,
    ];

    const circleOpacity = [
      "interpolate",
      ["linear"],
      ["zoom"],
      Math.max(0, transitionZoom - 1),
      0,
      transitionZoom + 1.25,
      Math.max(0.15, Math.min(0.95, opacity * 0.82)),
    ];

    const companionRadius =
      weightField === "uniform" || !weightDomain || weightDomain[0] === weightDomain[1]
        ? 4
        : [
          "interpolate",
          ["linear"],
          ["to-number", ["get", weightField], 0],
          weightDomain[0],
          3,
          weightDomain[1],
          9,
        ];

    const renderCollection = (normalizeGeoJSONSourceDataForRender(decoratedCollection, {
      preservePropertyKeys: weightField === "uniform" ? [] : [weightField],
    }) as GeoJSON.FeatureCollection | undefined) ?? { type: "FeatureCollection", features: [] };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(renderCollection);
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: renderCollection,
      });
    }

    const heatmapPaint: maplibregl.HeatmapLayerSpecification["paint"] = {
      "heatmap-weight": heatmapWeight as maplibregl.ExpressionSpecification,
      "heatmap-intensity": intensity,
      "heatmap-radius": heatmapRadius as maplibregl.ExpressionSpecification,
      "heatmap-opacity": heatmapOpacity as maplibregl.ExpressionSpecification,
      "heatmap-color": buildHeatmapColorExpression(gradient) as maplibregl.ExpressionSpecification,
    };

    if (map.getLayer(heatLayerId)) {
      map.setPaintProperty(heatLayerId, "heatmap-weight", heatmapPaint["heatmap-weight"]);
      map.setPaintProperty(heatLayerId, "heatmap-intensity", heatmapPaint["heatmap-intensity"]);
      map.setPaintProperty(heatLayerId, "heatmap-radius", heatmapPaint["heatmap-radius"]);
      map.setPaintProperty(heatLayerId, "heatmap-opacity", heatmapPaint["heatmap-opacity"]);
      map.setPaintProperty(heatLayerId, "heatmap-color", heatmapPaint["heatmap-color"]);
    } else {
      map.addLayer({
        id: heatLayerId,
        type: "heatmap",
        source: sourceId,
        paint: heatmapPaint,
      });
    }

    const circlePaint: maplibregl.CircleLayerSpecification["paint"] = {
      "circle-radius": companionRadius as maplibregl.ExpressionSpecification,
      "circle-color": HEATMAP_GRADIENTS[gradient][HEATMAP_GRADIENTS[gradient].length - 1],
      "circle-stroke-color": "rgba(255,255,255,0.55)",
      "circle-stroke-width": 0.8,
      "circle-opacity": circleOpacity as maplibregl.ExpressionSpecification,
    };

    if (map.getLayer(circleLayerId)) {
      map.setPaintProperty(circleLayerId, "circle-radius", circlePaint["circle-radius"]);
      map.setPaintProperty(circleLayerId, "circle-color", circlePaint["circle-color"]);
      map.setPaintProperty(circleLayerId, "circle-stroke-color", circlePaint["circle-stroke-color"]);
      map.setPaintProperty(circleLayerId, "circle-stroke-width", circlePaint["circle-stroke-width"]);
      map.setPaintProperty(circleLayerId, "circle-opacity", circlePaint["circle-opacity"]);
    } else {
      map.addLayer({
        id: circleLayerId,
        type: "circle",
        source: sourceId,
        paint: circlePaint,
      });
    }

    return () => {
      try {
        map.setPaintProperty(layer.id, "circle-opacity", originalOpacityRef.current);
      } catch {
        /* layer removed */
      }
      cleanupHeatmapArtifacts(map, layer.id);
    };
  }, [
    decoratedCollection,
    dynamicRadius,
    gradient,
    intensity,
    layer.id,
    mapRef,
    opacity,
    radius,
    transitionZoom,
    weightDomain,
    weightField,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="heatmap-weight-field">Weight field</label>
        <select
          id="heatmap-weight-field"
          value={weightField}
          onChange={(event) => setWeightField(event.target.value)}
          style={selectStyle}
        >
          <option value="uniform">Uniform weight</option>
          {numericFields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.name} ({field.numericCount.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="heatmap-gradient">Gradient</label>
        <select
          id="heatmap-gradient"
          value={gradient}
          onChange={(event) => setGradient(event.target.value as HeatmapGradientName)}
          style={selectStyle}
        >
          <option value="hot">Hot</option>
          <option value="cool">Cool</option>
          <option value="viridis">Viridis</option>
          <option value="plasma">Plasma</option>
        </select>
        <div style={{ display: "flex", gap: 2 }}>
          {HEATMAP_GRADIENTS[gradient].map((color) => (
            <span
              key={color}
              style={{ flex: 1, height: 10, borderRadius: 999, background: color }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="heatmap-radius">Radius: {radius}px</label>
          <input
            id="heatmap-radius"
            type="range"
            min={5}
            max={50}
            step={1}
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="heatmap-intensity">
            Intensity: {intensity.toFixed(1)}
          </label>
          <input
            id="heatmap-intensity"
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="heatmap-opacity">
            Opacity: {opacity.toFixed(2)}
          </label>
          <input
            id="heatmap-opacity"
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="heatmap-transition-zoom">
            Transition zoom: {transitionZoom.toFixed(1)}
          </label>
          <input
            id="heatmap-transition-zoom"
            type="range"
            min={6}
            max={18}
            step={0.5}
            value={transitionZoom}
            onChange={(event) => setTransitionZoom(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>
      </div>

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
          checked={dynamicRadius}
          onChange={(event) => setDynamicRadius(event.target.checked)}
          style={{ accentColor: MAP_COLORS.amber }}
        />
        Scale heatmap radius with zoom
      </label>
    </div>
  );
};
