import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DESIGN_TOKENS } from "@/constants/design";
import type { EmergingHotSpotCategory, EmergingHotSpotLegendEntry } from "@/engine/spatial-stats/spatiotemporal/EmergingHotSpots";
import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import {
  attachSpatialStatsRerun,
  createSpatialStatsCompletedRun,
} from "@/services/map/MapEngineAdapter";
import {
  createSpatialStatsExecutionIdentity,
  type SpatialStatsContiguityMethod,
} from "@/services/map/SpatialStatsExecutionService";
import { executeEmergingHotSpotSpatialStatsAsync } from "@/services/map/SpatialStatsExecutionQueue";
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
} from "./map/mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./map/useDraggableMapPanel";
import { collectNumericFields, resolveFeatureCollection } from "./map/symbologyUtils";
import { IconClose, IconMeasure } from "./map/MapIcons";

const PANEL_WIDTH = 420;
const DEFAULT_TIME_FIELD_COUNT = 4;

type NumericFieldInfo = ReturnType<typeof collectNumericFields>[number];

type ResolvedLayerState = {
  layer: OverlayLayerConfig;
  featureCollection: GeoJSON.FeatureCollection;
  numericFields: NumericFieldInfo[];
};

type LastRunState = {
  insertedAt: string;
  layerName: string;
  summary: Record<EmergingHotSpotCategory, number>;
  legend: EmergingHotSpotLegendEntry[];
  unclassifiedCount: number;
  validFeatureCount: number;
  skippedFeatureCount: number;
  timeStepCount: number;
};

interface MapEmergingHotSpotVizProps {
  overlayLayers: OverlayLayerConfig[];
  visible: boolean;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
  presentation?: "overlay" | "embedded";
  flowId?: AnalyticalFlowId;
  showMapExplorerShortcut?: boolean;
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

const helperTextStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  lineHeight: 1.5,
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "8px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amber}`,
  background: MAP_COLORS.amber,
  color: MAP_COLORS.bg,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 12px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(255,255,255,0.03)",
  color: MAP_COLORS.text,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const checkboxGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const timeFieldCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(255,255,255,0.03)",
};

const legendRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "14px minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(255,255,255,0.02)",
};

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

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function naturalSort(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function temporalFieldPriority(fieldName: string): number {
  if (/(^|[_-])(19|20)\d{2}([_-]|$)/.test(fieldName)) {
    return 2;
  }
  if (/\d/.test(fieldName)) {
    return 1;
  }
  return 0;
}

function pickDefaultTimeFields(fieldNames: string[]): string[] {
  const prioritized = [...fieldNames].sort((left, right) => {
    const priorityDelta = temporalFieldPriority(right) - temporalFieldPriority(left);
    return priorityDelta !== 0 ? priorityDelta : naturalSort(left, right);
  });

  return prioritized.slice(0, Math.min(DEFAULT_TIME_FIELD_COUNT, prioritized.length)).sort(naturalSort);
}

export const MapEmergingHotSpotViz: React.FC<MapEmergingHotSpotVizProps> = ({
  overlayLayers,
  visible,
  onClose,
  onAnnounce,
  presentation = "overlay",
  flowId = "emerging_hot_spot",
  showMapExplorerShortcut = false,
}) => {
  const isEmbedded = presentation === "embedded";
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const openTaskPanel = useBackgroundTaskStore((state) => state.openPanel);
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMapExplorer = useMapExplorerStore((state) => state.open);
  const upsertCompletedRun = useFlowStore((state) => state.upsertCompletedRun);

  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [selectedTimeFields, setSelectedTimeFields] = useState<string[]>([]);
  const [weightsMethod, setWeightsMethod] = useState<SpatialStatsContiguityMethod>("queen");
  const [significanceThreshold, setSignificanceThreshold] = useState(0.05);
  const [selfWeight, setSelfWeight] = useState(true);
  const [resolvedLayer, setResolvedLayer] = useState<ResolvedLayerState | null>(null);
  const [isResolvingLayer, setIsResolvingLayer] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<LastRunState | null>(null);

  const eligibleLayers = useMemo(
    () => overlayLayers.filter((layer) => layer.visible && isPolygonLayerCandidate(layer)),
    [overlayLayers],
  );

  const activeLayer = useMemo(
    () => eligibleLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [eligibleLayers, selectedLayerId],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (activeLayer) {
      return;
    }
    setSelectedLayerId(eligibleLayers[0]?.id ?? "");
    setSelectedTimeFields([]);
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
        if (cancelled) {
          return;
        }
        if (!hasPolygonGeometry(featureCollection)) {
          throw new Error("Selected layer does not contain polygon geometries.");
        }

        const numericFields = [...collectNumericFields(featureCollection)].sort((left, right) =>
          naturalSort(left.name, right.name),
        );
        setResolvedLayer({
          layer: activeLayer,
          featureCollection,
          numericFields,
        });
        setSelectedTimeFields((current) => {
          const retained = numericFields
            .map((field) => field.name)
            .filter((fieldName) => current.includes(fieldName));
          if (retained.length >= 3) {
            return retained;
          }
          return pickDefaultTimeFields(numericFields.map((field) => field.name));
        });
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

  const selectedTimeFieldSet = useMemo(() => new Set(selectedTimeFields), [selectedTimeFields]);
  const canRun = Boolean(resolvedLayer && selectedTimeFields.length >= 3);

  const toggleTimeField = useCallback((fieldName: string) => {
    setSelectedTimeFields((current) => {
      const next = current.includes(fieldName)
        ? current.filter((entry) => entry !== fieldName)
        : [...current, fieldName];
      return [...next].sort(naturalSort);
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (!resolvedLayer || selectedTimeFields.length < 3) {
      return;
    }

    const orderedTimeFields = [...selectedTimeFields].sort(naturalSort);
    const executionIdentity = createSpatialStatsExecutionIdentity(
      "emerging-hotspot",
      resolvedLayer.layer.id,
      orderedTimeFields.join("-"),
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

      return (await executeEmergingHotSpotSpatialStatsAsync({
        sourceLayer: latestLayer,
        featureCollection: latestCollection,
        timeFields: orderedTimeFields,
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
      const execution = await executeEmergingHotSpotSpatialStatsAsync({
        sourceLayer: resolvedLayer.layer,
        featureCollection: resolvedLayer.featureCollection,
        timeFields: orderedTimeFields,
        weightsMethod,
        significanceThreshold,
        selfWeight,
        runId: executionIdentity.runId,
        layerId: executionIdentity.layerId,
      }, {
        viewAction: {
          label: "View result",
          onClick: () => {
            openMapExplorer();
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
      upsertCompletedRun(createSpatialStatsCompletedRun(rerunnableResult, { flowId }));
      setLastRun({
        insertedAt: rerunnableResult.layer.metadata?.analysisResult?.runTimestamp ?? new Date().toISOString(),
        layerName: rerunnableResult.layer.name,
        summary: execution.summary,
        legend: execution.legend,
        unclassifiedCount: execution.unclassifiedCount,
        validFeatureCount: execution.validFeatureCount,
        skippedFeatureCount: execution.skippedFeatureCount,
        timeStepCount: execution.timeStepCount,
      });
      toastSuccess(`Added ${rerunnableResult.layer.name} to Analysis Results.`, {
        action: {
          label: "View result",
          onClick: () => {
            openMapExplorer();
            onClose();
          },
        },
      });
      onAnnounce?.(`${rerunnableResult.layer.name} added to analysis results`);
    } catch (error) {
      if (isBackgroundTaskCancelledError(error)) {
        const message = "Emerging hot spot analysis cancelled.";
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

      const message = error instanceof Error ? error.message : "Emerging hot spot analysis failed.";
      setRunError(message);
      toastError(message, {
        action: {
          label: "Open tasks",
          onClick: () => openTaskPanel(),
        },
      });
      onAnnounce?.(`Emerging hot spot analysis failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  }, [
    addOverlayLayer,
    onAnnounce,
    onClose,
    openMapExplorer,
    openTaskPanel,
    resolvedLayer,
    selectedTimeFields,
    selfWeight,
    significanceThreshold,
    flowId,
    upsertCompletedRun,
    weightsMethod,
  ]);

  const containerStyle: React.CSSProperties = isEmbedded
    ? {
        ...panelStyle,
        position: "relative",
        top: "auto",
        right: "auto",
        width: "100%",
        maxWidth: "none",
        maxHeight: "none",
        height: "100%",
        minHeight: 0,
        boxShadow: MAP_SHADOWS.dropdown,
        zIndex: "auto",
      }
    : {
        ...panelStyle,
        ...panelPositionStyle,
      };

  const bodyStyle: React.CSSProperties = isEmbedded
    ? {
        ...panelBodyStyle,
        flex: 1,
        minHeight: 0,
      }
    : panelBodyStyle;

  if (!visible) {
    return null;
  }

  return (
    <div
      style={containerStyle}
      role={isEmbedded ? "region" : "dialog"}
      aria-label="Emerging hot spot analysis panel"
      data-testid={isEmbedded ? "emerging-hotspot-workflow-panel" : "emerging-hotspot-map-panel"}
    >
      <div
        style={isEmbedded ? panelHeaderStyle : { ...panelHeaderStyle, ...dragHandleStyle }}
        {...(!isEmbedded ? dragHandleProps : {})}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: MAP_COLORS.amber,
              fontSize: 12,
              fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
              textTransform: "uppercase",
              letterSpacing: 0.7,
            }}
          >
            <IconMeasure size={13} />
            Emerging Hot Spots
          </div>
          <div style={{ marginTop: 4, color: MAP_COLORS.textSecondary, fontSize: 11 }}>
            Run per-step Gi* across multiple numeric fields, classify the temporal pattern, and publish a playback-ready result with saved legend metadata.
          </div>
        </div>

        {isEmbedded && showMapExplorerShortcut ? (
          <button
            type="button"
            onClick={openMapExplorer}
            data-testid="emerging-hotspot-open-map"
            style={secondaryButtonStyle}
          >
            Open Map Explorer
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close emerging hot spot panel"
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
          >
            <IconClose size={14} />
          </button>
        )}
      </div>

      <div style={bodyStyle}>
        {isEmbedded ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.5fr) minmax(220px, 1fr)",
              gap: 12,
              padding: "12px 14px",
              borderRadius: MAP_RADIUS.sm,
              border: `1px solid ${MAP_COLORS.amberBorder}`,
              background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,255,255,0.02))",
            }}
          >
            <div>
              <div style={labelStyle}>Workflow Entry</div>
              <div style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Run temporal Gi* without toolbar hunting
              </div>
              <div style={helperTextStyle}>
                Choose a polygon layer with at least three ordered numeric time fields, publish the temporal result to Map Explorer, and keep a review-ready run in the workflow workspace.
              </div>
            </div>
            <div>
              <div style={labelStyle}>Saved metadata</div>
              <div style={helperTextStyle}>
                Category legend, valid and skipped feature counts, time-step totals, and the playback-ready map layer are persisted together for downstream review.
              </div>
            </div>
          </div>
        ) : null}

        <div style={sectionStyle}>
          <label htmlFor="emerging-hotspot-source-layer" style={labelStyle}>
            Polygon Layer
          </label>
          <select
            id="emerging-hotspot-source-layer"
            data-testid="emerging-hotspot-source-select"
            value={selectedLayerId}
            onChange={(event) => {
              setSelectedLayerId(event.target.value);
              setRunError(null);
              onAnnounce?.(
                `Emerging hot spot source layer set to ${eligibleLayers.find((layer) => layer.id === event.target.value)?.name ?? event.target.value}`,
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
          {isEmbedded && eligibleLayers.length === 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={helperTextStyle}>
                Add or import a polygon layer in Map Explorer first, then return here to run the temporal analysis workflow.
              </div>
              <button type="button" onClick={openMapExplorer} style={secondaryButtonStyle}>
                Open Map Explorer
              </button>
            </div>
          ) : null}
        </div>

        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={labelStyle}>Temporal Fields</div>
            <div style={{ color: MAP_COLORS.amber, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {selectedTimeFields.length} selected
            </div>
          </div>
          <div style={helperTextStyle}>
            Select at least 3 numeric fields ordered in time. The map player will animate the resulting Gi* categories step by step.
          </div>

          {resolvedLayer && resolvedLayer.numericFields.length > 0 ? (
            <div style={checkboxGridStyle}>
              {resolvedLayer.numericFields.map((field) => {
                const checked = selectedTimeFieldSet.has(field.name);
                return (
                  <label
                    key={field.name}
                    style={{
                      ...timeFieldCardStyle,
                      border: `1px solid ${checked ? MAP_COLORS.amberBorderStrong : MAP_COLORS.amberBorder}`,
                      background: checked ? MAP_COLORS.amberDim : timeFieldCardStyle.background,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTimeField(field.name)}
                      aria-label={`Include ${field.name} in the temporal sequence`}
                    />
                    <span
                      style={{
                        color: MAP_COLORS.text,
                        fontSize: 12,
                        fontFamily: MAP_TYPOGRAPHY.fontFamily,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={field.name}
                    >
                      {field.name}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div style={helperTextStyle}>No numeric fields are available on the selected layer.</div>
          )}

          {selectedTimeFields.length > 0 ? (
            <div style={helperTextStyle}>
              Sequence order: {selectedTimeFields.join(" -> ")}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div style={sectionStyle}>
            <label htmlFor="emerging-hotspot-weights-method" style={labelStyle}>
              Weights
            </label>
            <select
              id="emerging-hotspot-weights-method"
              value={weightsMethod}
              onChange={(event) => setWeightsMethod(event.target.value as SpatialStatsContiguityMethod)}
              style={selectStyle}
            >
              <option value="queen">Queen contiguity</option>
              <option value="rook">Rook contiguity</option>
            </select>
          </div>

          <div style={sectionStyle}>
            <label htmlFor="emerging-hotspot-self-weight" style={labelStyle}>
              Self Weight
            </label>
            <select
              id="emerging-hotspot-self-weight"
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
            <label htmlFor="emerging-hotspot-threshold" style={labelStyle}>
              Significance Filter
            </label>
            <span style={{ color: MAP_COLORS.amber, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {significanceThreshold.toFixed(3)}
            </span>
          </div>
          <input
            id="emerging-hotspot-threshold"
            type="range"
            min={0.001}
            max={0.1}
            step={0.001}
            value={significanceThreshold}
            onChange={(event) => setSignificanceThreshold(Number(event.target.value))}
            style={{ width: "100%", accentColor: MAP_COLORS.amber }}
          />
        </div>

        <div style={helperTextStyle}>
          The published layer uses the shared temporal player for play, pause, step, and speed controls while retaining the emerging hot spot legend and category counts in analysis metadata.
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
          data-testid="emerging-hotspot-run"
          disabled={isRunning || isResolvingLayer || !canRun}
          style={{
            ...primaryButtonStyle,
            opacity: isRunning || isResolvingLayer || !canRun ? 0.55 : 1,
            cursor: isRunning || isResolvingLayer || !canRun ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "Running Emerging Hot Spots..." : "Run Emerging Hot Spots"}
        </button>

        {lastRun ? (
          <>
            <div
              data-testid="emerging-hotspot-last-run"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                padding: "10px 12px",
                borderRadius: MAP_RADIUS.sm,
                border: `1px solid ${MAP_COLORS.amberBorder}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
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
              <div>
                <div style={labelStyle}>Frames</div>
                <div style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                  {lastRun.timeStepCount.toLocaleString()} time steps
                </div>
                <div style={helperTextStyle}>{lastRun.unclassifiedCount.toLocaleString()} unclassified</div>
              </div>
            </div>

            <div style={{ ...sectionStyle, gap: 6 }}>
              <div style={labelStyle}>Category Legend</div>
              <div data-testid="emerging-hotspot-legend">
              {lastRun.legend.map((entry) => (
                <div key={entry.category} style={legendRowStyle}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: entry.color,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                    aria-hidden="true"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: MAP_COLORS.text, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                      {entry.label}
                    </div>
                    <div style={helperTextStyle}>{entry.description}</div>
                  </div>
                  <span style={{ color: MAP_COLORS.textSecondary, fontSize: 12 }}>
                    {lastRun.summary[entry.category].toLocaleString()}
                  </span>
                </div>
              ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
