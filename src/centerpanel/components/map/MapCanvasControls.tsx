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
import { GisIconButton } from "./ui";

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
  /** Optional product wordmark shown at the start of the command bar. */
  brandTitle?: string;
  brandSubtitle?: string;
  /**
   * Render surface:
   * - "full"   — standalone floating overlay bar + north arrow + keyboard popover (default; used by unit tests)
   * - "bar"    — inline tool cluster only, to embed inside the unified command header
   * - "overlay"— north arrow + keyboard popover only, anchored over the map canvas
   */
  surface?: "full" | "bar" | "overlay";
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

/* ------------------------------------------------------------------ */
/*  Premium top command bar                                            */
/*  One branded horizontal strip replaces the old floating corner      */
/*  clusters: wordmark · viewport · interaction tools · furniture.     */
/* ------------------------------------------------------------------ */

const commandBarStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  left: "calc(var(--map-dock-left, 0px))",
  right: "calc(var(--map-dock-right, 0px))",
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  height: "2.75rem",
  minHeight: "2.75rem",
  padding: `0 ${MAP_SPACING.sm}`,
  boxSizing: "border-box",
  background: MAP_COLORS.bgHeader,
  borderBottom: MAP_STROKES.hairlineStrong,
  boxShadow: MAP_SHADOWS.none,
  pointerEvents: "auto",
  overflowX: "visible",
  overflowY: "visible",
  zIndex: MAP_Z_INDEX.dropdown,
};

const embeddedBarStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "visible",
  overflowY: "visible",
};

const barGroupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  flexShrink: 0,
};

const barDividerStyle: React.CSSProperties = {
  width: 1,
  height: "1.5rem",
  background: "var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
  flexShrink: 0,
  margin: "0 0.1875rem",
};

const toolIndicatorStyle: React.CSSProperties = {
  display: "inline-grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: "7.25rem",
  maxWidth: "10rem",
  height: "1.75rem",
  padding: `0 ${MAP_SPACING.xs} 0 ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.5))",
  color: MAP_COLORS.textSecondary,
  flexShrink: 0,
};

const furnitureGroupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.xs,
  flexShrink: 0,
};

const furnitureButtonsStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.1875rem",
  flexShrink: 0,
};

const keyboardHelpPanelStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
  left: "calc(var(--map-dock-left, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  display: "grid",
  gap: MAP_SPACING.xs,
  maxWidth: "min(24rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.95))",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.textSecondary,
  pointerEvents: "auto",
  zIndex: MAP_Z_INDEX.dropdown + 1,
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
  fontSize: "0.625rem",
};

const northArrowStyle: React.CSSProperties = {
  position: "absolute",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  bottom: "var(--map-overlay-safe-bottom, 6.75rem)",
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
  surface = "full",
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitVisibleLayers,
  onFitSelectedContext,
  onOpenCrsReadiness,
  onToggleLegend,
  onToggleScaleBar,
  onToggleNorthArrow,
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
  const showIndicator = true;

  const viewportGroup = (
        <div style={barGroupStyle} role="group" aria-label="Viewport recovery controls" data-testid="map-canvas-viewport-controls">
          <GisIconButton
            label="Zoom in"
            tooltip="Zoom in"
            icon={<ZoomIn size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            onClick={onZoomIn}
          />
          <GisIconButton
            label="Zoom out"
            tooltip="Zoom out"
            icon={<ZoomOut size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            onClick={onZoomOut}
          />
          <GisIconButton
            label="Reset map view"
            tooltip="Reset map view"
            icon={<RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            onClick={onResetView}
          />
          <GisIconButton
            label={`Fit to visible layers, ${visibleLayerCount} visible`}
            tooltip={fitVisibleDisabled ? fitVisibleReason : "Fit to visible layers"}
            icon={<Maximize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            disabled={fitVisibleDisabled}
            disabledReason={fitVisibleReason}
            onClick={onFitVisibleLayers}
          />
          <GisIconButton
            label="Fit to selected layer, feature, or AOI"
            tooltip={fitSelectedDisabled ? fitSelectedReason : "Fit to selected layer, feature, or AOI"}
            icon={<LocateFixed size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            disabled={fitSelectedDisabled}
            disabledReason={fitSelectedReason}
            onClick={onFitSelectedContext}
          />
          <GisIconButton
            label="Open CRS readiness"
            tooltip="Open CRS readiness"
            icon={<Navigation size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            onClick={onOpenCrsReadiness}
          />
        </div>
  );

  const indicatorNode = (
        <div style={toolIndicatorStyle} data-testid="map-active-tool-indicator">
          {tool.icon}
          <span style={toolTextStyle}>
            <span style={toolLabelStyle}>{tool.label}</span>
            <span style={toolMetaStyle}>{tool.detail}</span>
          </span>
          <GisIconButton
            label={tool.clearable ? "Clear active map tool" : "No active map tool to clear"}
            tooltip={tool.clearable ? "Clear active map tool" : "No active map tool to clear"}
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            showPressedState={false}
            disabled={!tool.clearable}
            disabledReason="No active map tool to clear"
            onClick={onClearActiveTool}
          />
        </div>
  );

  const interactionGroup = (
        <div style={barGroupStyle} role="group" aria-label="Canvas interaction tools" data-testid="map-canvas-interaction-strip">
          <GisIconButton
            label={activeDrawTool === "polygon" ? "Cancel draw AOI" : "Draw AOI"}
            tooltip={activeDrawTool === "polygon" ? "Cancel draw AOI" : "Draw AOI"}
            icon={<MapPinned size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            active={activeDrawTool === "polygon"}
            onClick={onDrawAoi}
            data-testid="map-canvas-draw-aoi"
          />

          <GisIconButton
            label={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Measure distance"}
            tooltip={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Measure distance"}
            icon={<Ruler size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            active={activeMeasureTool === "measure-distance"}
            onClick={onMeasureDistance}
            data-testid="map-canvas-measure-distance"
          />

          <GisIconButton
            label={activeMeasureTool === "measure-area" ? "Cancel measure area" : "Measure area"}
            tooltip={activeMeasureTool === "measure-area" ? "Cancel measure area" : "Measure area"}
            icon={<Square size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            active={activeMeasureTool === "measure-area"}
            onClick={onMeasureArea}
            data-testid="map-canvas-measure-area"
          />

          <GisIconButton
            label={keyboardHelpVisible ? "Hide keyboard map help" : "Show keyboard map help"}
            tooltip={keyboardHelpVisible ? "Hide keyboard map help" : "Show keyboard map help"}
            icon={<Keyboard size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            size="sm"
            active={keyboardHelpVisible}
            aria-expanded={keyboardHelpVisible}
            aria-controls="map-canvas-keyboard-help-panel"
            onClick={onToggleKeyboardHelp}
            data-testid="map-canvas-keyboard-help"
          />
        </div>
  );

  const furnitureGroup = (
        <div style={furnitureGroupStyle} data-testid="map-canvas-furniture-controls">
          <div style={furnitureButtonsStyle} role="group" aria-label="Publish preview furniture controls">
            <GisIconButton
              label={scaleBarVisible ? "Hide scale bar" : "Show scale bar"}
              tooltip={scaleBarVisible ? "Hide scale bar" : "Show scale bar"}
              icon={<Scale size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              active={scaleBarVisible}
              onClick={onToggleScaleBar}
            />
            <GisIconButton
              label={northArrowVisible ? "Hide north arrow" : "Show north arrow"}
              tooltip={northArrowVisible ? "Hide north arrow" : "Show north arrow"}
              icon={<Compass size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              active={northArrowVisible}
              onClick={onToggleNorthArrow}
            />
            <GisIconButton
              label={legendVisible ? "Hide legend" : "Show legend"}
              tooltip={legendAvailable ? (legendVisible ? "Hide legend" : "Show legend") : "No visible layer legend available"}
              icon={legendVisible
                ? <Eye size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                : <EyeOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              active={legendVisible}
              disabled={!legendAvailable}
              disabledReason="No visible layer legend available"
              onClick={onToggleLegend}
            />
          </div>
          <span style={barDividerStyle} aria-hidden="true" />
          <MapLayerPanel compact activeLayer={activeBaseLayer} onSetLayer={onSetBaseLayer} />
        </div>
  );

  const keyboardPanel = keyboardHelpVisible ? (
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
  ) : null;

  const northArrowNode = northArrowVisible ? (
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
  ) : null;

  if (surface === "overlay") {
    return (
      <div style={rootStyle} role="group" aria-label="Map canvas overlays" data-testid="map-canvas-overlays">
        {keyboardPanel}
        {northArrowNode}
      </div>
    );
  }

  if (surface === "bar") {
    return (
      <div
        style={embeddedBarStyle}
        role="group"
        aria-label="Map canvas controls"
        data-testid="map-canvas-controls"
        data-map-canvas-surface="bar"
      >
        {viewportGroup}
        <span style={barDividerStyle} aria-hidden="true" />
        {showIndicator ? (
          <>
            {indicatorNode}
            <span style={barDividerStyle} aria-hidden="true" />
          </>
        ) : null}
        {interactionGroup}
        <span style={barDividerStyle} aria-hidden="true" />
        {furnitureGroup}
      </div>
    );
  }

  return (
    <div style={rootStyle} role="group" aria-label="Map canvas controls" data-testid="map-canvas-controls">
      <div style={commandBarStyle} data-testid="map-command-bar" data-map-command-bar="true">
        {viewportGroup}
        <span style={barDividerStyle} aria-hidden="true" />
        {indicatorNode}
        <span style={barDividerStyle} aria-hidden="true" />
        {interactionGroup}
        {furnitureGroup}
      </div>
      {keyboardPanel}
      {northArrowNode}
    </div>
  );
};
