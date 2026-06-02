import React from "react";
import {
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  LocateFixed,
  Maximize2,
  MousePointer2,
  Navigation,
  Ruler,
  RotateCcw,
  Scale,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  BaseLayerId,
  DrawToolId,
  MapToolId,
  MeasureToolId,
} from "./mapTypes";
import { MapLayerPanel } from "./MapLayerPanel";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

export interface MapCanvasControlsProps {
  activeBaseLayer: BaseLayerId;
  onSetBaseLayer: (layer: BaseLayerId) => void;
  activeTool: MapToolId;
  activeDrawTool: DrawToolId | null;
  activeMeasureTool: MeasureToolId | null;
  selectedFeatureCount: number;
  visibleLayerCount: number;
  hasActiveAoi: boolean;
  legendVisible: boolean;
  legendAvailable: boolean;
  scaleBarVisible: boolean;
  northArrowVisible: boolean;
  bearing: number;
  fitSelectedDisabled?: boolean;
  fitSelectedReason?: string;
  fitVisibleDisabled?: boolean;
  fitVisibleReason?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitVisibleLayers: () => void;
  onFitSelectedContext: () => void;
  onOpenCrsReadiness: () => void;
  onToggleLegend: () => void;
  onToggleScaleBar: () => void;
  onToggleNorthArrow: () => void;
  onClearActiveTool: () => void;
}

const rootStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: MAP_Z_INDEX.dropdown - 1,
};

const viewportClusterStyle: React.CSSProperties = {
  position: "absolute",
  top: "5.25rem",
  left: `calc(var(--map-dock-left, 0px) + ${MAP_SPACING.md})`,
  display: "grid",
  gap: MAP_SPACING.xs,
  pointerEvents: "auto",
};

const furnitureClusterStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.md,
  right: `calc(var(--map-dock-right, 0px) + ${MAP_SPACING.md})`,
  display: "grid",
  gap: MAP_SPACING.xs,
  justifyItems: "end",
  pointerEvents: "auto",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.1875rem",
  width: "fit-content",
  padding: "0.1875rem",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.88))",
  boxShadow: MAP_SHADOWS.none,
};

const verticalGroupStyle: React.CSSProperties = {
  ...buttonGroupStyle,
  display: "grid",
  gridTemplateColumns: "repeat(2, 1.875rem)",
};

const buttonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid transparent",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.62))",
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const toolIndicatorStyle: React.CSSProperties = {
  display: "inline-grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: "11.75rem",
  maxWidth: "min(17rem, calc(100vw - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.9))",
  color: MAP_COLORS.textSecondary,
  boxShadow: MAP_SHADOWS.none,
  pointerEvents: "auto",
};

const toolTextStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  display: "grid",
  gap: "0.0625rem",
};

const toolLabelStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const toolMetaStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.6875rem",
};

const northArrowStyle: React.CSSProperties = {
  position: "absolute",
  right: `calc(var(--map-dock-right, 0px) + ${MAP_SPACING.md})`,
  bottom: "6.75rem",
  width: "2.5rem",
  height: "2.5rem",
  display: "grid",
  placeItems: "center",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.full,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.9))",
  color: MAP_COLORS.text,
  pointerEvents: "none",
};

const northArrowNeedleStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  color: MAP_COLORS.interaction,
};

function iconButtonStyle(active = false, disabled = false): React.CSSProperties {
  if (disabled) return disabledButtonStyle;
  return active ? activeButtonStyle : buttonStyle;
}

function drawToolLabel(tool: DrawToolId): string {
  if (tool === "linestring") return "Draw line";
  return `Draw ${tool}`;
}

function measureToolLabel(tool: MeasureToolId): string {
  return tool === "measure-distance" ? "Measure distance" : "Measure area";
}

function activeToolCopy(input: {
  activeTool: MapToolId;
  activeDrawTool: DrawToolId | null;
  activeMeasureTool: MeasureToolId | null;
  selectedFeatureCount: number;
  hasActiveAoi: boolean;
}): { label: string; detail: string; clearable: boolean; icon: React.ReactElement } {
  if (input.activeDrawTool) {
    return {
      label: drawToolLabel(input.activeDrawTool),
      detail: "Drawing mode active",
      clearable: true,
      icon: <Crosshair size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
    };
  }
  if (input.activeMeasureTool) {
    return {
      label: measureToolLabel(input.activeMeasureTool),
      detail: "Measurement mode active",
      clearable: true,
      icon: <Ruler size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
    };
  }
  if (input.activeTool === "pin") {
    return {
      label: "Pin placement",
      detail: "Click map to add a pin",
      clearable: true,
      icon: <LocateFixed size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
    };
  }
  if (input.activeTool === "annotate") {
    return {
      label: "Annotation",
      detail: "Click map to place text",
      clearable: true,
      icon: <Crosshair size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
    };
  }
  const selectedLabel = input.selectedFeatureCount > 0
    ? `${input.selectedFeatureCount.toLocaleString()} selected`
    : input.hasActiveAoi
      ? "AOI active"
      : "No selection";
  return {
    label: "Select",
    detail: selectedLabel,
    clearable: false,
    icon: <MousePointer2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  };
}

export const MapCanvasControls: React.FC<MapCanvasControlsProps> = ({
  activeBaseLayer,
  onSetBaseLayer,
  activeTool,
  activeDrawTool,
  activeMeasureTool,
  selectedFeatureCount,
  visibleLayerCount,
  hasActiveAoi,
  legendVisible,
  legendAvailable,
  scaleBarVisible,
  northArrowVisible,
  bearing,
  fitSelectedDisabled = false,
  fitSelectedReason = "Select a feature, layer, or AOI before fitting the map.",
  fitVisibleDisabled = false,
  fitVisibleReason = "Show at least one layer before fitting visible layers.",
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitVisibleLayers,
  onFitSelectedContext,
  onOpenCrsReadiness,
  onToggleLegend,
  onToggleScaleBar,
  onToggleNorthArrow,
  onClearActiveTool,
}) => {
  const tool = activeToolCopy({
    activeTool,
    activeDrawTool,
    activeMeasureTool,
    selectedFeatureCount,
    hasActiveAoi,
  });
  const safeBearing = Number.isFinite(bearing) ? bearing : 0;

  return (
    <div style={rootStyle} role="group" aria-label="Map canvas controls" data-testid="map-canvas-controls">
      <div style={viewportClusterStyle} data-testid="map-canvas-viewport-controls">
        <div style={verticalGroupStyle} role="group" aria-label="Viewport recovery controls">
          <button type="button" style={buttonStyle} onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
            <ZoomIn size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={buttonStyle} onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
            <ZoomOut size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={buttonStyle} onClick={onResetView} aria-label="Reset map view" title="Reset map view">
            <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            style={iconButtonStyle(false, fitVisibleDisabled)}
            onClick={onFitVisibleLayers}
            aria-label={`Fit to visible layers, ${visibleLayerCount} visible`}
            title={fitVisibleDisabled ? fitVisibleReason : "Fit to visible layers"}
            disabled={fitVisibleDisabled}
          >
            <Maximize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            style={iconButtonStyle(false, fitSelectedDisabled)}
            onClick={onFitSelectedContext}
            aria-label="Fit to selected layer, feature, or AOI"
            title={fitSelectedDisabled ? fitSelectedReason : "Fit to selected layer, feature, or AOI"}
            disabled={fitSelectedDisabled}
          >
            <LocateFixed size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={buttonStyle} onClick={onOpenCrsReadiness} aria-label="Open CRS readiness" title="Open CRS readiness">
            <Navigation size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </div>

        <div style={toolIndicatorStyle} data-testid="map-active-tool-indicator">
          {tool.icon}
          <span style={toolTextStyle}>
            <span style={toolLabelStyle}>{tool.label}</span>
            <span style={toolMetaStyle}>{tool.detail}</span>
          </span>
          <button
            type="button"
            style={iconButtonStyle(false, !tool.clearable)}
            disabled={!tool.clearable}
            onClick={onClearActiveTool}
            aria-label={tool.clearable ? "Clear active map tool" : "No active map tool to clear"}
            title={tool.clearable ? "Clear active map tool" : "No active map tool to clear"}
          >
            <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div style={furnitureClusterStyle} data-testid="map-canvas-furniture-controls">
        <MapLayerPanel compact activeLayer={activeBaseLayer} onSetLayer={onSetBaseLayer} />
        <div style={buttonGroupStyle} role="group" aria-label="Publish preview furniture controls">
          <button
            type="button"
            style={iconButtonStyle(scaleBarVisible)}
            onClick={onToggleScaleBar}
            aria-label={scaleBarVisible ? "Hide scale bar" : "Show scale bar"}
            aria-pressed={scaleBarVisible}
            title={scaleBarVisible ? "Hide scale bar" : "Show scale bar"}
          >
            <Scale size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            style={iconButtonStyle(northArrowVisible)}
            onClick={onToggleNorthArrow}
            aria-label={northArrowVisible ? "Hide north arrow" : "Show north arrow"}
            aria-pressed={northArrowVisible}
            title={northArrowVisible ? "Hide north arrow" : "Show north arrow"}
          >
            <Compass size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            style={iconButtonStyle(legendVisible, !legendAvailable)}
            onClick={onToggleLegend}
            aria-label={legendVisible ? "Hide legend" : "Show legend"}
            aria-pressed={legendVisible}
            title={legendAvailable ? (legendVisible ? "Hide legend" : "Show legend") : "No visible layer legend available"}
            disabled={!legendAvailable}
          >
            {legendVisible ? (
              <Eye size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            ) : (
              <EyeOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            )}
          </button>
          <span style={{ ...toolMetaStyle, padding: `0 ${MAP_SPACING.xs}` }}>
            Preview
          </span>
        </div>
      </div>

      {northArrowVisible ? (
        <div
          style={northArrowStyle}
          aria-hidden="true"
          data-testid="map-north-arrow-preview"
        >
          <span style={{ ...northArrowNeedleStyle, transform: `rotate(${-safeBearing}deg)` }}>
            <Navigation size={MAP_ICON_SIZES.md} aria-hidden="true" />
          </span>
          <span style={{ position: "absolute", top: "0.25rem", fontSize: "0.625rem", fontWeight: 700 }}>N</span>
        </div>
      ) : null}
    </div>
  );
};
