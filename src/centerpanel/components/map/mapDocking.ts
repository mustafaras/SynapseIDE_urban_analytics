import { MAP_NUMERIC } from "./mapTokens";

export type MapRightDockPanel =
  | "inspect"
  | "style"
  | "attributes"
  | "problems"
  | "timeline"
  | "tasks"
  | "diagnostics"
  | "pins"
  | "draw"
  | "measure"
  | "selection"
  | "scientificQA"
  | "qa"
  | "workflow"
  | "report"
  | "performance"
  | "collaboration"
  | "urbanMethod";

/**
 * Workspace docking placements for the left layer/data panel.
 *
 * `"bottom"` is intentionally NOT a member: the Map Explorer redesign forbids a
 * persistent bottom workspace. On constrained widths the panel collapses into a
 * left-side overlay `"drawer"` instead of a bottom drawer. See
 * map-explorer-premium-redesign-2026-06-05 Prompt 05 (UX-03).
 */
export type MapLayerPanelPlacement = "left" | "drawer";

export interface MapDockLayoutInput {
  containerWidth: number;
  layerPanelRequested: boolean;
  rightPanel: MapRightDockPanel | null;
  rightPanelCollapsed?: boolean;
  navigatorStageMode: boolean;
  layerPanelWidth?: number;
  rightPanelWidth?: number;
}

export interface MapDockLayout {
  activeRightPanel: MapRightDockPanel | null;
  compactDock: boolean;
  rightPanelPlacement: "rail" | "drawer" | null;
  showLayerPanel: boolean;
  showPinSidebar: boolean;
  showDrawPanel: boolean;
  showMeasurePanel: boolean;
  showScientificQAPanel: boolean;
  showReportPanel: boolean;
  showWorkflowPanel: boolean;
  showUrbanMethodPanel: boolean;
  layerPanelPlacement: MapLayerPanelPlacement | null;
  layerPanelWidth: number;
  rightPanelWidth: number;
  leftInset: number;
  rightInset: number;
  centerLaneWidth: number | null;
}

export const MAP_SCIENTIFIC_QA_PANEL_WIDTH = 384;
export const MAP_LAYER_PANEL_MIN_WIDTH = 300;
export const MAP_LAYER_PANEL_MAX_WIDTH = 760;
export const MAP_RIGHT_PANEL_MIN_WIDTH = 320;
export const MAP_RIGHT_PANEL_MAX_WIDTH = 560;
export const MAP_RIGHT_PANEL_COLLAPSED_WIDTH = 48;

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Number(value)));
}

/**
 * Default lane width per right-dock panel. Declared as a `Record` so adding a
 * new `MapRightDockPanel` member is a compile error until a width is provided.
 * All values are clamped to [MIN, MAX] before use.
 */
const RIGHT_PANEL_DEFAULT_WIDTH: Record<MapRightDockPanel, number> = {
  inspect: 400,
  style: 440,
  attributes: 500,
  problems: 400,
  timeline: 420,
  tasks: 380,
  diagnostics: 480,
  pins: MAP_NUMERIC.pinSidebarWidth,
  draw: MAP_NUMERIC.drawingPanelWidth,
  measure: MAP_NUMERIC.measurementPanelWidth,
  selection: 400,
  scientificQA: MAP_SCIENTIFIC_QA_PANEL_WIDTH,
  qa: MAP_SCIENTIFIC_QA_PANEL_WIDTH,
  workflow: 480,
  report: 420,
  performance: 460,
  collaboration: 400,
  urbanMethod: 440,
};

function getRightPanelWidth(panel: MapRightDockPanel | null, preferredWidth?: number): number {
  const fallback = panel ? RIGHT_PANEL_DEFAULT_WIDTH[panel] : MAP_NUMERIC.pinSidebarWidth;
  return clampNumber(preferredWidth, MAP_RIGHT_PANEL_MIN_WIDTH, MAP_RIGHT_PANEL_MAX_WIDTH, fallback);
}

export function getActiveRightDockPanel(input: {
  showPinSidebar: boolean;
  showDrawPanel: boolean;
  showMeasurePanel: boolean;
}): MapRightDockPanel | null {
  if (input.showMeasurePanel) return "measure";
  if (input.showPinSidebar) return "pins";
  if (input.showDrawPanel) return "draw";
  return null;
}

export function getMapDockLayout(input: MapDockLayoutInput): MapDockLayout {
  const activeRightPanel = input.navigatorStageMode ? null : input.rightPanel;
  const requestedLayerPanel = input.layerPanelRequested && !input.navigatorStageMode;
  const layerPanelWidth = clampNumber(
    input.layerPanelWidth,
    MAP_LAYER_PANEL_MIN_WIDTH,
    MAP_LAYER_PANEL_MAX_WIDTH,
    MAP_NUMERIC.layerPanelWidth,
  );
  const rightPanelWidth = input.rightPanelCollapsed && activeRightPanel
    ? MAP_RIGHT_PANEL_COLLAPSED_WIDTH
    : getRightPanelWidth(activeRightPanel, input.rightPanelWidth);
  const measuredWidth = Math.max(0, input.containerWidth);
  const centerWithLeftOnly = measuredWidth - layerPanelWidth - MAP_NUMERIC.overlayMargin * 2;
  const centerWithBothRails = measuredWidth - layerPanelWidth - rightPanelWidth - MAP_NUMERIC.overlayMargin * 2;
  const rightPanelDrawerAtMediumWidth = activeRightPanel != null && measuredWidth >= 1200 && measuredWidth < 1440;
  const compactDock = measuredWidth > 0 && requestedLayerPanel && (
    centerWithLeftOnly < MAP_NUMERIC.mapDockMinCenterWidth ||
    (activeRightPanel != null && centerWithBothRails < MAP_NUMERIC.mapDockMinCenterWidth)
  );
  // Constrained widths collapse the layer panel into a left-side overlay drawer
  // — never a persistent bottom workspace.
  const layerPanelPlacement: MapLayerPanelPlacement | null = requestedLayerPanel
    ? compactDock ? "drawer" : "left"
    : null;
  const rightPanelPlacement: MapDockLayout["rightPanelPlacement"] = activeRightPanel
    ? compactDock || rightPanelDrawerAtMediumWidth ? "drawer" : "rail"
    : null;

  const showLayerPanel = requestedLayerPanel;
  const reserveRightRail = rightPanelPlacement === "rail";
  const leftInset = layerPanelPlacement === "left"
    ? layerPanelWidth + MAP_NUMERIC.overlayMargin
    : MAP_NUMERIC.overlayMargin;
  const rightInset = reserveRightRail
    ? rightPanelWidth + MAP_NUMERIC.overlayMargin
    : MAP_NUMERIC.overlayMargin;

  return {
    activeRightPanel,
    compactDock,
    rightPanelPlacement,
    showLayerPanel,
    showPinSidebar: activeRightPanel === "pins",
    showDrawPanel: activeRightPanel === "draw",
    showMeasurePanel: activeRightPanel === "measure",
    showScientificQAPanel: activeRightPanel === "scientificQA",
    showReportPanel: activeRightPanel === "report",
    showWorkflowPanel: activeRightPanel === "workflow",
    showUrbanMethodPanel: activeRightPanel === "urbanMethod",
    layerPanelPlacement,
    layerPanelWidth,
    rightPanelWidth,
    leftInset,
    rightInset,
    centerLaneWidth: input.containerWidth > 0 ? input.containerWidth - leftInset - rightInset : null,
  };
}
