import { MAP_NUMERIC } from "./mapTokens";

export type MapRightDockPanel = "pins" | "draw" | "measure" | "scientificQA" | "report" | "workflow" | "urbanMethod";
export type MapLayerPanelPlacement = "left" | "bottom";

export interface MapDockLayoutInput {
  containerWidth: number;
  layerPanelRequested: boolean;
  rightPanel: MapRightDockPanel | null;
  navigatorStageMode: boolean;
  layerPanelWidth?: number;
  rightPanelWidth?: number;
}

export interface MapDockLayout {
  activeRightPanel: MapRightDockPanel | null;
  compactDock: boolean;
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
export const MAP_LAYER_PANEL_MIN_WIDTH = 420;
export const MAP_LAYER_PANEL_MAX_WIDTH = 680;
export const MAP_RIGHT_PANEL_MIN_WIDTH = 300;
export const MAP_RIGHT_PANEL_MAX_WIDTH = 520;

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Number(value)));
}

function getRightPanelWidth(panel: MapRightDockPanel | null, preferredWidth?: number): number {
  const fallback = panel === "scientificQA"
    ? MAP_SCIENTIFIC_QA_PANEL_WIDTH
    : panel === "report"
      ? 430
      : panel === "workflow"
        ? 480
        : panel === "urbanMethod"
          ? 448
    : panel === "draw"
      ? MAP_NUMERIC.drawingPanelWidth
      : panel === "measure"
        ? MAP_NUMERIC.measurementPanelWidth
        : MAP_NUMERIC.pinSidebarWidth;
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
  const rightPanelWidth = getRightPanelWidth(activeRightPanel, input.rightPanelWidth);
  const measuredWidth = Math.max(0, input.containerWidth);
  const centerWithLeftOnly = measuredWidth - layerPanelWidth - MAP_NUMERIC.overlayMargin * 2;
  const centerWithBothRails = measuredWidth - layerPanelWidth - rightPanelWidth - MAP_NUMERIC.overlayMargin * 2;
  const compactDock = measuredWidth > 0 && requestedLayerPanel && (
    centerWithLeftOnly < MAP_NUMERIC.mapDockMinCenterWidth ||
    (activeRightPanel != null && centerWithBothRails < MAP_NUMERIC.mapDockMinCenterWidth)
  );
  const layerPanelPlacement: MapLayerPanelPlacement | null = requestedLayerPanel
    ? compactDock ? "bottom" : "left"
    : null;

  const showLayerPanel = requestedLayerPanel;
  const reserveRightRail = activeRightPanel != null && !compactDock;
  const leftInset = layerPanelPlacement === "left"
    ? layerPanelWidth + MAP_NUMERIC.overlayMargin
    : MAP_NUMERIC.overlayMargin;
  const rightInset = reserveRightRail
    ? rightPanelWidth + MAP_NUMERIC.overlayMargin
    : MAP_NUMERIC.overlayMargin;

  return {
    activeRightPanel,
    compactDock,
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
