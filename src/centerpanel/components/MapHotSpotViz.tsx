import React, { useCallback, useEffect, useMemo, useState } from "react";
import type maplibregl from "maplibre-gl";
import { DESIGN_TOKENS } from "@/constants/design";
import type { HotSpotConfidence } from "@/engine/spatial-stats/types";
import {
  attachSpatialStatsRerun,
  createSpatialStatsCompletedRun,
} from "@/services/map/MapEngineAdapter";
import { normalizeGeoJSONSourceDataForRender } from "@/services/map/MapDataImporter";
import {
  createSpatialStatsExecutionIdentity,
  type SpatialStatsContiguityMethod,
} from "@/services/map/SpatialStatsExecutionService";
import { executeHotSpotSpatialStatsAsync } from "@/services/map/SpatialStatsExecutionQueue";
import { useBackgroundTaskStore } from "@/stores/useBackgroundTaskStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { isBackgroundTaskCancelledError } from "@/workers/pool";
import { toastError, toastInfo, toastSuccess } from "@/ui/toast/api";
import type { OverlayLayerConfig } from "./map/mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";
import { collectNumericFields, resolveFeatureCollection } from "./map/symbologyUtils";
import {
  buildHotSpotDecoratedCollection,
  HOT_SPOT_CATEGORY_FIELD,
  HOT_SPOT_CATEGORY_LABEL_FIELD,
  HOT_SPOT_COLORS,
  HOT_SPOT_FEATURE_ID_FIELD,
  HOT_SPOT_GI_FIELD,
  HOT_SPOT_P_VALUE_FIELD,
  resolveSpatialStatsLayerContext,
  HOT_SPOT_Z_SCORE_FIELD,
} from "./map/spatialStatsVizUtils";
import { IconClose, IconMeasure } from "./map/MapIcons";

const PANEL_WIDTH = 360;

type NumericFieldInfo = ReturnType<typeof collectNumericFields>[number];

type ResolvedLayerState = {
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
};

type LastRunState = {
  insertedAt: string;
  layerId: string;
  layerName: string;
  summary: Record<HotSpotConfidence, number>;
  validFeatureCount: number;
  skippedFeatureCount: number;
};

interface MapHotSpotVizProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  overlayLayers: OverlayLayerConfig[];
  visible: boolean;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
}

type HotSpotHoverState = {
  x: number;
  y: number;
  featureId: string;
  giStar: number | null;
  zScore: number | null;
  pValue: number | null;
  categoryLabel: string;
};

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(PANEL_WIDTH),
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderBottom: `1px solid ${MAP_COLORS.hairline}`,
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

const helperTextStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "8px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const summaryCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  padding: "10px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.03)",
};

const legendRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "14px minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
  padding: "7px 9px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
  color: MAP_COLORS.text,
  fontSize: 12,
};

const mapTooltipStyle: React.CSSProperties = {
  position: "absolute",
  minWidth: 200,
  maxWidth: 270,
  padding: "9px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: "rgba(10,10,10,0.92)",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
  fontSize: 11,
  lineHeight: 1.45,
  pointerEvents: "none",
  zIndex: MAP_Z_INDEX.dropdown + 14,
};

const readinessGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const readinessCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "10px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.03)",
};

const readinessValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: 13,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const caveatListStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const caveatRowStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.hairline}`,
  background: "rgba(255,255,255,0.02)",
  color: MAP_COLORS.textSecondary,
  fontSize: 12,
  lineHeight: 1.45,
};

function dedupeMessages(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  values.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }
    const normalized = value.trim();
    if (normalized.length === 0) {
      return;
    }
    const fingerprint = normalized.toLowerCase();
    if (seen.has(fingerprint)) {
      return;
    }
    seen.add(fingerprint);
    deduped.push(normalized);
  });

  return deduped;
}

function isPolygonLayerCandidate(layer: OverlayLayerConfig): boolean {
  if (layer.type !== "geojson") {
    return false;
  }

  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  if (!geometryType) {
    return true;
  }

  return geometryType.includes("polygon") || geometryType.includes("multi");
}

function hasPolygonGeometry(collection: GeoJSON.FeatureCollection): boolean {
  return collection.features.some((feature) => {
    const geometryType = feature.geometry?.type?.toLowerCase() ?? "";
    return geometryType === "polygon" || geometryType === "multipolygon";
  });
}

function normalizeFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasFieldSet(layer: OverlayLayerConfig, requiredFields: string[][]): boolean {
  const fields = new Set((layer.metadata?.fields ?? []).map(normalizeFieldName));
  if (fields.size === 0) {
    return false;
  }

  return requiredFields.every((aliases) => aliases.some((alias) => fields.has(normalizeFieldName(alias))));
}

function isHotSpotResultLayerCandidate(layer: OverlayLayerConfig): boolean {
  if (!layer.visible || !isPolygonLayerCandidate(layer)) {
    return false;
  }

  const analysis = layer.metadata?.analysisResult;
  if (analysis?.engine === "GetisOrdGi" || analysis?.visualization.kind === "hotspot") {
    return true;
  }

  return hasFieldSet(layer, [
    ["gi_star", "giStar"],
    ["z_score", "zScore"],
    ["p_value", "pValue"],
    ["confidence_level", "confidence"],
  ]);
}

function buildMatchColorExpression(
  field: string,
  colors: Record<string, string>,
  fallback: string,
): unknown[] {
  const expression: unknown[] = ["match", ["get", field]];
  for (const [category, color] of Object.entries(colors)) {
    expression.push(category, color);
  }
  expression.push(fallback);
  return expression;
}

function applyHotSpotPaint(map: maplibregl.Map, layerId: string): void {
  const layer = map.getLayer(layerId);
  if (!layer) return;

  const colorExpression = buildMatchColorExpression(
    HOT_SPOT_CATEGORY_FIELD,
    HOT_SPOT_COLORS,
    HOT_SPOT_COLORS["not-significant"],
  ) as maplibregl.ExpressionSpecification;

  if (layer.type === "fill") {
    map.setPaintProperty(layerId, "fill-color", colorExpression);
    map.setPaintProperty(layerId, "fill-opacity", 0.76);
    map.setPaintProperty(layerId, "fill-outline-color", "rgba(17,24,39,0.85)");
    return;
  }

  if (layer.type === "circle") {
    map.setPaintProperty(layerId, "circle-color", colorExpression);
    map.setPaintProperty(layerId, "circle-opacity", 0.84);
    map.setPaintProperty(layerId, "circle-stroke-color", "rgba(17,24,39,0.85)");
    map.setPaintProperty(layerId, "circle-stroke-width", 0.8);
    return;
  }

  if (layer.type === "line") {
    map.setPaintProperty(layerId, "line-color", colorExpression);
    map.setPaintProperty(layerId, "line-opacity", 0.9);
    map.setPaintProperty(layerId, "line-width", 2.4);
  }
}

function formatStat(value: number | null, digits = 4): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MapHotSpotViz: React.FC<MapHotSpotVizProps> = ({
  mapRef,
  overlayLayers,
  visible,
  onClose,
  onAnnounce,
}) => {
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const openTaskPanel = useBackgroundTaskStore((state) => state.openPanel);
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMap = useMapExplorerStore((state) => state.open);
  const upsertCompletedRun = useFlowStore((state) => state.upsertCompletedRun);

  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedValueField, setSelectedValueField] = useState("");
  const [weightsMethod, setWeightsMethod] = useState<SpatialStatsContiguityMethod>("queen");
  const [significanceThreshold, setSignificanceThreshold] = useState(0.05);
  const [selfWeight, setSelfWeight] = useState(true);
  const [resolvedLayer, setResolvedLayer] = useState<ResolvedLayerState | null>(null);
  const [isResolvingLayer, setIsResolvingLayer] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<LastRunState | null>(null);
  const [selectedResultLayerId, setSelectedResultLayerId] = useState("");
  const [rendererThreshold, setRendererThreshold] = useState(0.05);
  const [resultCollection, setResultCollection] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isResolvingResult, setIsResolvingResult] = useState(false);
  const [rendererError, setRendererError] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<HotSpotHoverState | null>(null);

  const eligibleLayers = useMemo(
    () => overlayLayers.filter((layer) => layer.visible && isPolygonLayerCandidate(layer)),
    [overlayLayers],
  );

  const resultLayers = useMemo(
    () => overlayLayers.filter(isHotSpotResultLayerCandidate),
    [overlayLayers],
  );

  const activeLayer = useMemo(
    () => eligibleLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [eligibleLayers, selectedLayerId],
  );

  const activeResultLayer = useMemo(
    () => resultLayers.find((layer) => layer.id === selectedResultLayerId) ?? null,
    [resultLayers, selectedResultLayerId],
  );

  const sourceLayerSummary = useMemo(
    () => resolveSpatialStatsLayerContext(resolvedLayer?.layer ?? activeLayer ?? null),
    [activeLayer, resolvedLayer],
  );

  const publishedLayer = useMemo(
    () => (lastRun ? overlayLayers.find((layer) => layer.id === lastRun.layerId) ?? null : null),
    [lastRun, overlayLayers],
  );

  const publishedLayerSummary = useMemo(
    () => resolveSpatialStatsLayerContext(publishedLayer),
    [publishedLayer],
  );

  const readinessCaveats = useMemo(
    () => dedupeMessages([
      !resolvedLayer ? "Choose a visible polygon layer before running Getis-Ord Gi*." : null,
      !selectedValueField ? "Choose a numeric field so hot and cold spots can be computed." : null,
      ...sourceLayerSummary.caveats,
      ...sourceLayerSummary.uncertaintyNotes,
      `Contiguity (${weightsMethod}) and self-weight ${selfWeight ? "inclusion" : "exclusion"} can shift marginal hot and cold spot classes at alpha ${significanceThreshold.toFixed(3)}.`,
    ]),
    [resolvedLayer, selectedValueField, sourceLayerSummary, weightsMethod, selfWeight, significanceThreshold],
  );

  const renderedHotSpot = useMemo(
    () => resultCollection ? buildHotSpotDecoratedCollection(resultCollection, rendererThreshold) : null,
    [rendererThreshold, resultCollection],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (activeLayer) {
      return;
    }
    setSelectedLayerId(eligibleLayers[0]?.id ?? "");
    setSelectedValueField("");
  }, [activeLayer, eligibleLayers, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (activeResultLayer) {
      return;
    }
    setSelectedResultLayerId(resultLayers[0]?.id ?? "");
  }, [activeResultLayer, resultLayers, visible]);

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
        if (cancelled) {
          return;
        }
        if (!hasPolygonGeometry(featureCollection)) {
          throw new Error("Selected layer does not contain polygon geometries.");
        }

        const numericFields = collectNumericFields(featureCollection);
        setResolvedLayer({
          layer: activeLayer,
          featureCollection,
          numericFields,
        });
        setSelectedValueField((current) =>
          numericFields.some((field) => field.name === current)
            ? current
            : numericFields[0]?.name ?? "",
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setResolvedLayer(null);
        setLoadError(error instanceof Error ? error.message : "Failed to load polygon layer.");
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

  useEffect(() => {
    if (!visible || !activeResultLayer) {
      setResultCollection(null);
      setRendererError(null);
      setHoverState(null);
      return undefined;
    }

    let cancelled = false;
    setIsResolvingResult(true);
    setRendererError(null);

    void resolveFeatureCollection(activeResultLayer)
      .then((featureCollection) => {
        if (cancelled) return;
        if (!hasPolygonGeometry(featureCollection)) {
          throw new Error("Selected Gi* result layer does not contain polygon geometries.");
        }
        setResultCollection(featureCollection);
      })
      .catch((error) => {
        if (cancelled) return;
        setResultCollection(null);
        setRendererError(error instanceof Error ? error.message : "Failed to load Gi* result layer.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingResult(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeResultLayer, visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!visible || !map || !activeResultLayer || !renderedHotSpot) {
      return undefined;
    }

    const applyRender = () => {
      const source = map.getSource(activeResultLayer.id) as maplibregl.GeoJSONSource | undefined;
      if (!source || !map.getLayer(activeResultLayer.id)) {
        return;
      }
      source.setData(
        (normalizeGeoJSONSourceDataForRender(renderedHotSpot.decoratedCollection, {
          preservePropertyKeys: [
            HOT_SPOT_CATEGORY_FIELD,
            HOT_SPOT_CATEGORY_LABEL_FIELD,
            HOT_SPOT_FEATURE_ID_FIELD,
            HOT_SPOT_GI_FIELD,
            HOT_SPOT_P_VALUE_FIELD,
            HOT_SPOT_Z_SCORE_FIELD,
          ],
        }) as GeoJSON.FeatureCollection | undefined) ?? { type: "FeatureCollection", features: [] },
      );
      applyHotSpotPaint(map, activeResultLayer.id);
    };

    applyRender();
    if (!map.getSource(activeResultLayer.id) || !map.getLayer(activeResultLayer.id)) {
      map.once("idle", applyRender);
      return () => {
        map.off("idle", applyRender);
      };
    }

    return undefined;
  }, [activeResultLayer, mapRef, renderedHotSpot, visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!visible || !map || !activeResultLayer) {
      return undefined;
    }

    const layerId = activeResultLayer.id;
    if (!map.getLayer(layerId)) {
      return undefined;
    }

    const toNumberOrNull = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const handleMove = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const properties = feature.properties ?? {};
      setHoverState({
        x: event.point.x,
        y: event.point.y,
        featureId: String(properties[HOT_SPOT_FEATURE_ID_FIELD] ?? feature.id ?? "feature"),
        giStar: toNumberOrNull(properties[HOT_SPOT_GI_FIELD]),
        zScore: toNumberOrNull(properties[HOT_SPOT_Z_SCORE_FIELD]),
        pValue: toNumberOrNull(properties[HOT_SPOT_P_VALUE_FIELD]),
        categoryLabel: String(properties[HOT_SPOT_CATEGORY_LABEL_FIELD] ?? "Not Significant"),
      });
      map.getCanvas().style.cursor = "pointer";
    };

    const handleLeave = () => {
      setHoverState(null);
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", layerId, handleMove);
    map.on("mouseleave", layerId, handleLeave);

    return () => {
      map.off("mousemove", layerId, handleMove);
      map.off("mouseleave", layerId, handleLeave);
      map.getCanvas().style.cursor = "";
    };
  }, [activeResultLayer, mapRef, visible]);

  const handleRun = useCallback(async () => {
    if (!resolvedLayer || !selectedValueField) {
      return;
    }

    const executionIdentity = createSpatialStatsExecutionIdentity(
      "hotspot",
      resolvedLayer.layer.id,
      selectedValueField,
    );

    const buildLatestResult = async () => {
      const latestLayer = useMapExplorerStore.getState().overlayLayers.find(
        (layer) => layer.id === resolvedLayer.layer.id,
      );
      if (!latestLayer) {
        throw new Error("The source layer is no longer available for re-run.");
      }

      const latestCollection = await resolveFeatureCollection(latestLayer);
      if (!hasPolygonGeometry(latestCollection)) {
        throw new Error("The source layer no longer contains polygon geometries.");
      }

      return (await executeHotSpotSpatialStatsAsync({
        sourceLayer: latestLayer,
        featureCollection: latestCollection,
        valueField: selectedValueField,
        weightsMethod,
        significanceThreshold,
        selfWeight,
        runId: executionIdentity.runId,
        layerId: executionIdentity.layerId,
      }).promise).adaptedResult;
    };

    setIsRunning(true);
    setRunError(null);

    try {
      const execution = await executeHotSpotSpatialStatsAsync({
        sourceLayer: resolvedLayer.layer,
        featureCollection: resolvedLayer.featureCollection,
        valueField: selectedValueField,
        weightsMethod,
        significanceThreshold,
        selfWeight,
        runId: executionIdentity.runId,
        layerId: executionIdentity.layerId,
      }, {
        viewAction: {
          label: "View result",
          onClick: () => {
            openMap();
            onClose();
          },
        },
      }).promise;
      const rerunnableResult = attachSpatialStatsRerun(
        execution.adaptedResult,
        buildLatestResult,
        `${executionIdentity.layerId}::rerun`,
      );

      addOverlayLayer(rerunnableResult.layer);
      setSelectedResultLayerId(rerunnableResult.layer.id);
      upsertCompletedRun(createSpatialStatsCompletedRun(rerunnableResult, { flowId: "review" }));
      setLastRun({
        insertedAt: rerunnableResult.layer.metadata?.analysisResult?.runTimestamp ?? new Date().toISOString(),
        layerId: rerunnableResult.layer.id,
        layerName: rerunnableResult.layer.name,
        summary: execution.summary,
        validFeatureCount: execution.validFeatureCount,
        skippedFeatureCount: execution.skippedFeatureCount,
      });
      toastSuccess(`Added ${rerunnableResult.layer.name} to Analysis Results.`, {
        action: {
          label: "View result",
          onClick: () => {
            openMap();
            onClose();
          },
        },
      });
      onAnnounce?.(`${rerunnableResult.layer.name} added to analysis results`);
    } catch (error) {
      if (isBackgroundTaskCancelledError(error)) {
        const message = "Getis-Ord Gi* analysis cancelled.";
        setRunError(null);
        toastInfo(message, {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
        onAnnounce?.(message);
        return;
      }

      const message = error instanceof Error ? error.message : "Getis-Ord Gi* analysis failed.";
      setRunError(message);
      toastError(message, {
        action: {
          label: "Open tasks",
          onClick: () => openTaskPanel(),
        },
      });
      onAnnounce?.(`Getis-Ord Gi* analysis failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  }, [
    addOverlayLayer,
    onAnnounce,
    onClose,
    openMap,
    openTaskPanel,
    resolvedLayer,
    selectedValueField,
    selfWeight,
    significanceThreshold,
    upsertCompletedRun,
    weightsMethod,
  ]);

  if (!visible) {
    return null;
  }

  return (
    <>
    <div style={{ ...panelStyle, ...panelPositionStyle }} role="dialog" aria-label="Getis-Ord Gi-star analysis panel">
      <div style={{ ...panelHeaderStyle, ...dragHandleStyle }} {...dragHandleProps}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: MAP_COLORS.interaction,
              fontSize: 12,
              fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
              textTransform: "uppercase",
              letterSpacing: 0.7,
            }}
          >
            <IconMeasure size={13} />
            Getis-Ord Gi*
          </div>
          <div style={{ marginTop: 4, color: MAP_COLORS.textSecondary, fontSize: 11 }}>
            Run a real hot-spot analysis from any visible polygon layer and publish the result to Analysis Results.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Getis-Ord Gi-star panel"
          style={{
            border: `1px solid ${MAP_COLORS.hairline}`,
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
        >
          <IconClose size={14} />
        </button>
      </div>

      <div style={panelBodyStyle}>
        <div
          style={{
            ...sectionStyle,
            padding: "10px 12px",
            borderRadius: MAP_RADIUS.sm,
            border: `1px solid ${MAP_COLORS.hairline}`,
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <div style={labelStyle}>Gi* Hot/Cold Spot Renderer</div>
          <div style={helperTextStyle}>
            Renders GeoJSON fields gi_star, z_score, p_value, and confidence_level with the graduated hot-neutral-cold confidence scheme.
          </div>

          <label htmlFor="hotspot-result-layer" style={labelStyle}>
            Gi* Result Layer
          </label>
          <select
            id="hotspot-result-layer"
            value={selectedResultLayerId}
            onChange={(event) => {
              setSelectedResultLayerId(event.target.value);
              setRendererError(null);
            }}
            style={selectStyle}
          >
            {resultLayers.length === 0 ? <option value="">No visible Gi* result layers</option> : null}
            {resultLayers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>

          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <label htmlFor="hotspot-render-threshold" style={labelStyle}>
                Confidence Filter
              </label>
              <span style={{ color: MAP_COLORS.interaction, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                p ≤ {rendererThreshold.toFixed(3)}
              </span>
            </div>
            <input
              id="hotspot-render-threshold"
              type="range"
              min={0.001}
              max={0.1}
              step={0.001}
              value={rendererThreshold}
              onChange={(event) => setRendererThreshold(Number(event.target.value))}
              style={rangeInputStyle}
              disabled={!activeResultLayer}
            />
          </div>

          {isResolvingResult ? <div style={helperTextStyle}>Loading Gi* result layer...</div> : null}
          {rendererError ? (
            <div style={{ color: DESIGN_TOKENS.colors.semantic.error, fontSize: 12, lineHeight: 1.5 }}>
              {rendererError}
            </div>
          ) : null}

          {renderedHotSpot ? (
            <div style={sectionStyle}>
              <div style={labelStyle}>Legend</div>
              {renderedHotSpot.legend.map((entry) => (
                <div key={entry.category} style={legendRowStyle}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: entry.color,
                      border: "1px solid rgba(255,255,255,0.45)",
                    }}
                  />
                  <span>{entry.label}</span>
                  <span style={{ color: MAP_COLORS.textSecondary }}>{entry.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={sectionStyle}>
          <label htmlFor="hotspot-source-layer" style={labelStyle}>
            Polygon Layer
          </label>
          <select
            id="hotspot-source-layer"
            value={selectedLayerId}
            onChange={(event) => {
              setSelectedLayerId(event.target.value);
              setRunError(null);
              onAnnounce?.(
                `Getis-Ord Gi-star source layer set to ${eligibleLayers.find((layer) => layer.id === event.target.value)?.name ?? event.target.value}`,
              );
            }}
            style={selectStyle}
          >
            {eligibleLayers.length === 0 ? <option value="">No visible polygon GeoJSON layers</option> : null}
            {eligibleLayers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </div>

        <div style={sectionStyle}>
          <label htmlFor="hotspot-value-field" style={labelStyle}>
            Numeric Field
          </label>
          <select
            id="hotspot-value-field"
            value={selectedValueField}
            onChange={(event) => setSelectedValueField(event.target.value)}
            style={selectStyle}
            disabled={!resolvedLayer || resolvedLayer.numericFields.length === 0}
          >
            {!resolvedLayer || resolvedLayer.numericFields.length === 0 ? (
              <option value="">No numeric fields</option>
            ) : null}
            {resolvedLayer?.numericFields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name}
              </option>
            ))}
          </select>
          {resolvedLayer ? (
            <div style={helperTextStyle}>
              {resolvedLayer.numericFields.length.toLocaleString()} numeric field(s) available on the selected layer.
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div style={sectionStyle}>
            <label htmlFor="hotspot-weights-method" style={labelStyle}>
              Weights
            </label>
            <select
              id="hotspot-weights-method"
              value={weightsMethod}
              onChange={(event) => setWeightsMethod(event.target.value as SpatialStatsContiguityMethod)}
              style={selectStyle}
            >
              <option value="queen">Queen contiguity</option>
              <option value="rook">Rook contiguity</option>
            </select>
          </div>

          <div style={sectionStyle}>
            <label htmlFor="hotspot-self-weight" style={labelStyle}>
              Self Weight
            </label>
            <select
              id="hotspot-self-weight"
              value={selfWeight ? "true" : "false"}
              onChange={(event) => setSelfWeight(event.target.value === "true")}
              style={selectStyle}
            >
              <option value="true">Include self</option>
              <option value="false">Exclude self</option>
            </select>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <label htmlFor="hotspot-threshold" style={labelStyle}>
              Significance Filter
            </label>
            <span style={{ color: MAP_COLORS.interaction, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {significanceThreshold.toFixed(3)}
            </span>
          </div>
          <input
            id="hotspot-threshold"
            type="range"
            min={0.001}
            max={0.1}
            step={0.001}
            value={significanceThreshold}
            onChange={(event) => setSignificanceThreshold(Number(event.target.value))}
            style={rangeInputStyle}
          />
        </div>

        <div style={helperTextStyle}>
          The result layer is recorded as a completed run and appears under Analysis Results with rerun support.
        </div>

        <div style={sectionStyle} data-testid="hotspot-readiness-panel">
          <div style={labelStyle}>Readiness and Caveats</div>
          <div style={readinessGridStyle}>
            <div style={readinessCardStyle}>
              <div style={labelStyle}>Required geometry</div>
              <div style={readinessValueStyle}>{resolvedLayer ? "Polygon geometry ready" : "Polygon geometry required"}</div>
              <div style={helperTextStyle}>
                {resolvedLayer ? `${resolvedLayer.layer.name} is ready for neighborhood hot and cold spot analysis.` : "Choose a visible polygon layer before running Gi*."}
              </div>
            </div>
            <div style={readinessCardStyle}>
              <div style={labelStyle}>Numeric field</div>
              <div style={readinessValueStyle}>{selectedValueField || "Numeric field required"}</div>
              <div style={helperTextStyle}>
                {resolvedLayer
                  ? `${resolvedLayer.numericFields.length.toLocaleString()} numeric field(s) are available on the selected layer.`
                  : "Field availability appears after the source layer loads."}
              </div>
            </div>
            <div style={readinessCardStyle}>
              <div style={labelStyle}>CRS and execution</div>
              <div style={readinessValueStyle}>{sourceLayerSummary.crsLabel}</div>
              <div style={helperTextStyle}>
                {(weightsMethod === "queen" ? "Queen" : "Rook")} contiguity with self weight {selfWeight ? "enabled" : "disabled"} at alpha {significanceThreshold.toFixed(3)}.
              </div>
            </div>
            <div style={readinessCardStyle}>
              <div style={labelStyle}>Output layer group</div>
              <div style={readinessValueStyle}>{lastRun ? publishedLayerSummary.publicationStatusLabel : "Publishes to Analysis Results"}</div>
              <div style={helperTextStyle}>
                {lastRun
                  ? `${publishedLayerSummary.outputGroupLabel} · ${publishedLayerSummary.outputModeLabel}`
                  : "Completed runs preserve QA, output mode, and rerun metadata in Analysis Results."}
              </div>
            </div>
          </div>
          <div style={caveatListStyle}>
            {readinessCaveats.map((message) => (
              <div key={message} style={caveatRowStyle}>{message}</div>
            ))}
          </div>
        </div>

        {isResolvingLayer ? <div style={helperTextStyle}>Loading polygon layer...</div> : null}
        {loadError ? (
          <div style={{ color: DESIGN_TOKENS.colors.semantic.error, fontSize: 12, lineHeight: 1.5 }}>{loadError}</div>
        ) : null}
        {runError ? (
          <div style={{ color: DESIGN_TOKENS.colors.semantic.error, fontSize: 12, lineHeight: 1.5 }}>{runError}</div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleRun();
          }}
          disabled={isRunning || isResolvingLayer || !resolvedLayer || !selectedValueField}
          style={{
            ...primaryButtonStyle,
            opacity: isRunning || isResolvingLayer || !resolvedLayer || !selectedValueField ? 0.55 : 1,
            cursor: isRunning || isResolvingLayer || !resolvedLayer || !selectedValueField ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "Running Getis-Ord Gi*..." : "Run Getis-Ord Gi*"}
        </button>

        {lastRun ? (
          <>
            <div style={summaryCardStyle}>
              <div>
                <div style={labelStyle}>Last Result</div>
                <div style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                  {lastRun.layerName}
                </div>
                <div style={helperTextStyle}>{formatTimestamp(lastRun.insertedAt)}</div>
              </div>
              <div>
                <div style={labelStyle}>Features</div>
                <div style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                  {lastRun.validFeatureCount.toLocaleString()} included
                </div>
                <div style={helperTextStyle}>{lastRun.skippedFeatureCount.toLocaleString()} skipped</div>
              </div>
            </div>

            <div style={{ ...sectionStyle, gap: 6 }}>
              <div style={labelStyle}>Confidence Summary</div>
              {([
                ["hot-99", "Hot Spot 99%"],
                ["hot-95", "Hot Spot 95%"],
                ["hot-90", "Hot Spot 90%"],
                ["not-significant", "Not Significant"],
                ["cold-90", "Cold Spot 90%"],
                ["cold-95", "Cold Spot 95%"],
                ["cold-99", "Cold Spot 99%"],
              ] as const).map(([key, label]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: MAP_RADIUS.sm,
                    border: `1px solid ${MAP_COLORS.hairline}`,
                    background: "rgba(255,255,255,0.02)",
                    color: MAP_COLORS.text,
                    fontSize: 12,
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: MAP_COLORS.textSecondary }}>{lastRun.summary[key].toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
    {hoverState ? (
      <div
        style={{
          ...mapTooltipStyle,
          left: hoverState.x + 14,
          top: hoverState.y + 14,
        }}
        role="tooltip"
        aria-label="Gi-star feature hover details"
      >
        <div style={{ color: MAP_COLORS.interaction, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
          {hoverState.featureId}
        </div>
        <div>Category: {hoverState.categoryLabel}</div>
        <div>Gi*: {formatStat(hoverState.giStar)}</div>
        <div>z-score: {formatStat(hoverState.zScore)}</div>
        <div>p-value: {formatStat(hoverState.pValue, 5)}</div>
      </div>
    ) : null}
    </>
  );
};
