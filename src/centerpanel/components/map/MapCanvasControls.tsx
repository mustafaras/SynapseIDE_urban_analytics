import React from "react";
import {
  BoxSelect,
  Compass,
  Columns2,
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
  RotateCcw,
  Ruler,
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
import { MapCanvasControlDock } from "./shell/MapCanvasControlDock";
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
  swipeCompareVisible?: boolean;
  northArrowVisible: boolean;
  bearing: number;
  fitSelectedDisabled?: boolean;
  fitSelectedReason?: string;
  fitVisibleDisabled?: boolean;
  fitVisibleReason?: string;
  /** Optional product wordmark shown at the start of the command bar. */
  brandTitle?: string;
  brandSubtitle?: string;
  mapOnlyMode?: boolean;
  pinCount?: number;
  bookmarkCount?: number;
  /**
   * Render surface:
   * - "full"   — standalone canvas dock + keyboard popover (default; used by unit tests)
   * - "bar"    — inline tool cluster only, to embed inside the unified command header
   * - "overlay"— safe-inset canvas dock + keyboard popover over the map canvas
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
  onToggleSwipeCompare?: () => void;
  onToggleNorthArrow: () => void;
  onSetSelectionDragTool: (tool: SelectionDragTool | null) => void;
  onDrawAoi: () => void;
  onMeasureDistance: () => void;
  onMeasureArea: () => void;
  onToggleMapOnlyMode?: () => void;
  keyboardHelpVisible: boolean;
  onToggleKeyboardHelp: () => void;
  onClearActiveTool: () => void;
}

const rootStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  /* Below MAP_Z_INDEX.sidebar so docked/overlay panel rails always paint
     above canvas furniture (command bar, legend, help) at compact widths. */
  zIndex: MAP_Z_INDEX.mapFurniture,
};

/* ------------------------------------------------------------------ */
/*  Premium top command bar                                            */
/*  One branded horizontal strip replaces the old floating corner      */
/*  clusters: wordmark · viewport · interaction tools · furniture.     */
/* ------------------------------------------------------------------ */

const commandBarStyle: React.CSSProperties = {
  width: "min(42rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  maxWidth: "calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem)",
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
  borderRadius: MAP_RADIUS.full,
  borderColor: "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 28%, transparent)",
};

const northArrowNeedleStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  color: MAP_COLORS.interaction,
};

const dockDividerStyle: React.CSSProperties = {
  width: 1,
  height: "1.5rem",
  background: "var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
  flexShrink: 0,
  margin: "0 0.1875rem",
};

const dockChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  minHeight: "1.5rem",
  maxWidth: "9.5rem",
  padding: "0 0.5rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.full,
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.68)) 78%, transparent)",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const dockChipActiveStyle: React.CSSProperties = {
  ...dockChipStyle,
  borderColor: "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 32%, transparent)",
  color: MAP_COLORS.interaction,
  background: "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent)",
};

const contextualTrayStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.72)) 86%, transparent)",
};

const contextualTrayTextStyle: React.CSSProperties = {
  display: "grid",
  gap: 1,
  minWidth: 0,
};

const contextualTrayTitleStyle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const contextualTrayMetaStyle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
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
  swipeCompareVisible = false,
  northArrowVisible,
  bearing,
  mapOnlyMode = false,
  pinCount = 0,
  bookmarkCount = 0,
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
  onToggleSwipeCompare,
  onToggleNorthArrow,
  onDrawAoi,
  onMeasureDistance,
  onMeasureArea,
  onToggleMapOnlyMode,
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
              label={swipeCompareVisible ? "Hide swipe compare" : "Show swipe compare"}
              tooltip={swipeCompareVisible ? "Hide swipe compare" : "Show swipe compare"}
              icon={<Columns2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              active={swipeCompareVisible}
              onClick={onToggleSwipeCompare ?? (() => undefined)}
              data-testid="map-canvas-swipe-compare"
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
    <GisIconButton
      label="Reset north arrow bearing"
      tooltip="Reset north arrow bearing"
      icon={(
        <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
          <span style={{ ...northArrowNeedleStyle, transform: `rotate(${-safeBearing}deg)` }}>
            <Navigation size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-0.5rem",
              color: MAP_COLORS.text,
              fontSize: "0.5rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            N
          </span>
        </span>
      )}
      size="sm"
      active={Math.abs(safeBearing) > 1}
      showPressedState={false}
      onClick={onResetView}
      style={northArrowStyle}
      data-testid="map-north-arrow-preview"
    />
  ) : null;

  const mapOnlyNode = (
    <GisIconButton
      label={mapOnlyMode ? "Restore map workspace chrome" : "Map-only mode"}
      tooltip={mapOnlyMode ? "Restore map workspace chrome" : "Map-only mode"}
      icon={<Maximize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
      size="sm"
      active={mapOnlyMode}
      onClick={onToggleMapOnlyMode ?? (() => undefined)}
      data-testid="map-canvas-map-only-toggle"
    />
  );

  const dockPrimaryNode = (
    <>
      {viewportGroup}
      <span style={dockDividerStyle} aria-hidden="true" />
      {northArrowNode}
      <span style={dockDividerStyle} aria-hidden="true" />
      {furnitureGroup}
      <span style={dockDividerStyle} aria-hidden="true" />
      {mapOnlyNode}
    </>
  );

  const dockChipsNode = (
    <>
      <span
        style={visibleLayerCount > 0 ? dockChipActiveStyle : dockChipStyle}
        data-map-canvas-dock-chip="layers"
        title={`${visibleLayerCount.toLocaleString()} visible layers`}
      >
        {visibleLayerCount.toLocaleString()} visible
      </span>
      <span
        style={selectedFeatureCount > 0 || hasActiveAoi ? dockChipActiveStyle : dockChipStyle}
        data-map-canvas-dock-chip="selection"
        title={hasActiveAoi ? "AOI active" : `${selectedFeatureCount.toLocaleString()} selected features`}
      >
        {hasActiveAoi ? "AOI" : `${selectedFeatureCount.toLocaleString()} selected`}
      </span>
      <span
        style={pinCount > 0 || bookmarkCount > 0 ? dockChipActiveStyle : dockChipStyle}
        data-map-canvas-dock-chip="pins-bookmarks"
        title={`${pinCount.toLocaleString()} pins / ${bookmarkCount.toLocaleString()} bookmarks`}
      >
        {pinCount.toLocaleString()} pins / {bookmarkCount.toLocaleString()} views
      </span>
    </>
  );

  const selectionContextTray = selectionDragTool || selectedFeatureCount > 0 || hasActiveAoi ? (
    <div
      style={contextualTrayStyle}
      data-map-canvas-context-tray="selection"
      data-active={selectionDragTool ? "true" : undefined}
      role="status"
      aria-label="Selection context"
    >
      <MousePointer2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      <span style={contextualTrayTextStyle}>
        <span style={contextualTrayTitleStyle}>
          {selectionDragTool ? selectionToolLabel(selectionDragTool) : "Selection"}
        </span>
        <span style={contextualTrayMetaStyle}>
          {hasActiveAoi ? "AOI active" : `${selectedFeatureCount.toLocaleString()} selected`}
        </span>
      </span>
      <GisIconButton
        label={tool.clearable ? "Clear active map tool" : "Clear selected context"}
        tooltip={tool.clearable ? "Clear active map tool" : "Clear selected context"}
        icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
        size="sm"
        showPressedState={false}
        disabled={!tool.clearable && selectedFeatureCount === 0 && !hasActiveAoi}
        disabledReason="No active map selection context to clear"
        onClick={onClearActiveTool}
      />
    </div>
  ) : null;

  const drawContextTray = activeDrawTool ? (
    <div
      style={contextualTrayStyle}
      data-map-canvas-context-tray="draw"
      data-active="true"
      role="status"
      aria-label="Drawing tool context"
    >
      <Crosshair size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      <span style={contextualTrayTextStyle}>
        <span style={contextualTrayTitleStyle}>{drawToolLabel(activeDrawTool)}</span>
        <span style={contextualTrayMetaStyle}>Click the canvas to continue drawing</span>
      </span>
      <GisIconButton
        label="Cancel draw AOI"
        tooltip="Cancel draw AOI"
        icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
        size="sm"
        active
        onClick={onDrawAoi}
      />
    </div>
  ) : null;

  const measureContextTray = activeMeasureTool ? (
    <div
      style={contextualTrayStyle}
      data-map-canvas-context-tray="measure"
      data-active="true"
      role="status"
      aria-label="Measurement tool context"
    >
      <Ruler size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      <span style={contextualTrayTextStyle}>
        <span style={contextualTrayTitleStyle}>{measureToolLabel(activeMeasureTool)}</span>
        <span style={contextualTrayMetaStyle}>Readouts stay in the dock edge</span>
      </span>
      <GisIconButton
        label={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Cancel measure area"}
        tooltip={activeMeasureTool === "measure-distance" ? "Cancel measure distance" : "Cancel measure area"}
        icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
        size="sm"
        active
        onClick={activeMeasureTool === "measure-distance" ? onMeasureDistance : onMeasureArea}
      />
    </div>
  ) : null;

  const overlayContextNode = (
    <>
      {drawContextTray}
      {measureContextTray}
      {selectionContextTray}
    </>
  );

  if (surface === "overlay") {
    return (
      <div style={rootStyle} role="group" aria-label="Map canvas overlays" data-testid="map-canvas-overlays">
        <MapCanvasControlDock
          primary={dockPrimaryNode}
          chips={dockChipsNode}
          contextual={drawContextTray || measureContextTray || selectionContextTray ? overlayContextNode : null}
        />
        {keyboardPanel}
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
      <MapCanvasControlDock
        primary={(
          <>
            {viewportGroup}
            <span style={dockDividerStyle} aria-hidden="true" />
            {indicatorNode}
            <span style={dockDividerStyle} aria-hidden="true" />
            {interactionGroup}
            <span style={dockDividerStyle} aria-hidden="true" />
            {furnitureGroup}
            <span style={dockDividerStyle} aria-hidden="true" />
            {northArrowNode}
            {mapOnlyNode}
          </>
        )}
        chips={dockChipsNode}
        contextual={drawContextTray || measureContextTray || selectionContextTray ? overlayContextNode : null}
        style={commandBarStyle}
      />
      {keyboardPanel}
    </div>
  );
};
