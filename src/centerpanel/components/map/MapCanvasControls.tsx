import React from "react";
import {
  BoxSelect,
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Keyboard,
  LassoSelect,
  LocateFixed,
  MapPinned,
  Maximize2,
  MousePointer2,
  Navigation,
  Ruler,
  RotateCcw,
  Scale,
  Square,
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
import type { SelectionDragTool } from "./MapSelectionTools";
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
  selectionDragTool: SelectionDragTool | null;
  activeDrawTool: DrawToolId | null;
  activeMeasureTool: MeasureToolId | null;
  selectionModeDisabled?: boolean;
  selectionModeDisabledReason?: string;
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
  onSetSelectionDragTool: (tool: SelectionDragTool | null) => void;
  onDrawAoi: () => void;
  onMeasureDistance: () => void;
  onMeasureArea: () => void;
  keyboardHelpVisible: boolean;
  onToggleKeyboardHelp: () => void;
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

const interactionStripStyle: React.CSSProperties = {
  ...buttonGroupStyle,
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  maxWidth: "min(34rem, calc(100vw - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
};

const interactionButtonStyle: React.CSSProperties = {
  minWidth: "5.5rem",
  height: "2rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.xs,
  padding: `0 ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.62))",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
};

const activeInteractionButtonStyle: React.CSSProperties = {
  ...interactionButtonStyle,
  border: "1px solid var(--syn-border-active, rgba(245, 158, 11, 0.62))",
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.text,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const disabledInteractionButtonStyle: React.CSSProperties = {
  ...interactionButtonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const interactionLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const interactionStateStyle: React.CSSProperties = {
  minWidth: "1.5rem",
  textAlign: "right",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  textTransform: "uppercase",
};

const keyboardHelpPanelStyle: React.CSSProperties = {
  ...toolIndicatorStyle,
  display: "grid",
  gap: MAP_SPACING.xs,
  maxWidth: "min(24rem, calc(100vw - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
};

const keyboardShortcutRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const keyboardKeyStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "1.5rem",
  height: "1.25rem",
  padding: `0 ${MAP_SPACING.xs}`,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.xs,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.68))",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
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

function interactionToolButtonStyle(active = false, disabled = false): React.CSSProperties {
  if (disabled) return disabledInteractionButtonStyle;
  return active ? activeInteractionButtonStyle : interactionButtonStyle;
}

function selectionToolLabel(tool: SelectionDragTool): string {
  return tool === "rectangle" ? "Rect select" : "Lasso select";
}

function drawToolLabel(tool: DrawToolId): string {
  if (tool === "polygon") return "Draw polygon";
  if (tool === "linestring") return "Draw line";
  return `Draw ${tool}`;
}

function measureToolLabel(tool: MeasureToolId): string {
  return tool === "measure-distance" ? "Measure distance" : "Measure area";
}

function activeToolCopy(input: {
  activeTool: MapToolId;
  selectionDragTool: SelectionDragTool | null;
  activeDrawTool: DrawToolId | null;
  activeMeasureTool: MeasureToolId | null;
  selectedFeatureCount: number;
  hasActiveAoi: boolean;
}): { label: string; detail: string; clearable: boolean; icon: React.ReactElement } {
  if (input.selectionDragTool) {
    return {
      label: selectionToolLabel(input.selectionDragTool),
      detail: "Selection mode active",
      clearable: true,
      icon: input.selectionDragTool === "rectangle"
        ? <BoxSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        : <LassoSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
    };
  }
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
  selectionDragTool,
  activeDrawTool,
  activeMeasureTool,
  selectionModeDisabled = false,
  selectionModeDisabledReason = "No queryable visible layers are available for selection.",
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
  onSetSelectionDragTool,
  onDrawAoi,
  onMeasureDistance,
  onMeasureArea,
  keyboardHelpVisible,
  onToggleKeyboardHelp,
  onClearActiveTool,
}) => {
  const tool = activeToolCopy({
    activeTool,
    selectionDragTool,
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

        <div style={interactionStripStyle} role="group" aria-label="Canvas interaction tools" data-testid="map-canvas-interaction-strip">
          <button
            type="button"
            data-testid="map-rectangle-select-tool"
            style={interactionToolButtonStyle(selectionDragTool === "rectangle", selectionModeDisabled)}
            onClick={() => onSetSelectionDragTool(selectionDragTool === "rectangle" ? null : "rectangle")}
            aria-label={selectionDragTool === "rectangle" ? "Cancel rectangle select" : "Rectangle select"}
            aria-pressed={selectionDragTool === "rectangle"}
            title={selectionModeDisabled ? selectionModeDisabledReason : (selectionDragTool === "rectangle" ? "Cancel rectangle select" : "Rectangle select")}
            disabled={selectionModeDisabled}
          >
            <span style={interactionLabelStyle}>
              <BoxSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>Rect</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {selectionDragTool === "rectangle" ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            data-testid="map-lasso-select-tool"
            style={interactionToolButtonStyle(selectionDragTool === "lasso", selectionModeDisabled)}
            onClick={() => onSetSelectionDragTool(selectionDragTool === "lasso" ? null : "lasso")}
            aria-label={selectionDragTool === "lasso" ? "Cancel lasso select" : "Lasso select"}
            aria-pressed={selectionDragTool === "lasso"}
            title={selectionModeDisabled ? selectionModeDisabledReason : (selectionDragTool === "lasso" ? "Cancel lasso select" : "Lasso select")}
            disabled={selectionModeDisabled}
          >
            <span style={interactionLabelStyle}>
              <LassoSelect size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>Lasso</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {selectionDragTool === "lasso" ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            data-testid="map-canvas-draw-aoi"
            style={interactionToolButtonStyle(activeDrawTool === "polygon")}
            onClick={onDrawAoi}
            aria-label={activeDrawTool === "polygon" ? "Cancel draw AOI" : "Draw AOI"}
            aria-pressed={activeDrawTool === "polygon"}
            title={activeDrawTool === "polygon" ? "Cancel draw AOI" : "Draw AOI"}
          >
            <span style={interactionLabelStyle}>
              <MapPinned size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>AOI</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {activeDrawTool === "polygon" ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            data-testid="map-canvas-measure-distance"
            style={interactionToolButtonStyle(activeMeasureTool === "measure-distance")}
            onClick={onMeasureDistance}
            aria-label={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Measure distance"}
            aria-pressed={activeMeasureTool === "measure-distance"}
            title={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Measure distance"}
          >
            <span style={interactionLabelStyle}>
              <Ruler size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>Dist</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {activeMeasureTool === "measure-distance" ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            data-testid="map-canvas-measure-area"
            style={interactionToolButtonStyle(activeMeasureTool === "measure-area")}
            onClick={onMeasureArea}
            aria-label={activeMeasureTool === "measure-area" ? "Cancel measure area" : "Measure area"}
            aria-pressed={activeMeasureTool === "measure-area"}
            title={activeMeasureTool === "measure-area" ? "Cancel measure area" : "Measure area"}
          >
            <span style={interactionLabelStyle}>
              <Square size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>Area</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {activeMeasureTool === "measure-area" ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            data-testid="map-canvas-keyboard-help"
            style={interactionToolButtonStyle(keyboardHelpVisible)}
            onClick={onToggleKeyboardHelp}
            aria-label={keyboardHelpVisible ? "Hide keyboard map help" : "Show keyboard map help"}
            aria-pressed={keyboardHelpVisible}
            aria-expanded={keyboardHelpVisible}
            aria-controls="map-canvas-keyboard-help-panel"
            title={keyboardHelpVisible ? "Hide keyboard map help" : "Show keyboard map help"}
          >
            <span style={interactionLabelStyle}>
              <Keyboard size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>Keys</span>
            </span>
            <span style={interactionStateStyle} aria-hidden="true">
              {keyboardHelpVisible ? "Open" : "Off"}
            </span>
          </button>
        </div>

        {keyboardHelpVisible ? (
          <div id="map-canvas-keyboard-help-panel" style={keyboardHelpPanelStyle} role="note" aria-label="Map keyboard shortcuts">
            <span style={toolLabelStyle}>Keyboard path</span>
            <span style={toolMetaStyle}>Fallback controls stay available at the bottom-right edge of the canvas.</span>
            <div style={keyboardShortcutRowStyle}>
              <span style={keyboardKeyStyle}>Arrows</span>
              <span>Pan</span>
              <span style={keyboardKeyStyle}>+/-</span>
              <span>Zoom</span>
              <span style={keyboardKeyStyle}>R</span>
              <span>Reset</span>
            </div>
            <div style={keyboardShortcutRowStyle}>
              <span style={keyboardKeyStyle}>Esc</span>
              <span>Cancel rectangle, lasso, draw, or measure mode.</span>
            </div>
          </div>
        ) : null}
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
