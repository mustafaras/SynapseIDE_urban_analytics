import { useMemo } from "react";

import {
  getMapDockLayout,
  type MapRightDockPanel,
} from "../mapDocking";
import {
  isFloatingModalRoutePanel,
  isHostRenderedRoutePanel,
} from "../mapRightDockRoutes";

interface MapPanelLayoutPreferences {
  layerPanelWidth: number;
  rightPanelWidth: number;
}

interface UseMapPanelLayoutOptions {
  mapContainerWidth: number;
  showLayerPanel: boolean;
  showScientificQAPanel: boolean;
  showUrbanMethodPanel: boolean;
  showNLQueryPanel: boolean;
  showWorkflowDrawer: boolean;
  showReviewTimeline: boolean;
  hasReportHandoffSource: boolean;
  activeRightDockRoutePanel: MapRightDockPanel | null;
  rightDockCollapsed?: boolean;
  navigatorStageMode: boolean;
  navigatorStageMargin: number;
  layoutPreferences: MapPanelLayoutPreferences;
}

export function useMapPanelLayout({
  mapContainerWidth,
  showLayerPanel,
  showScientificQAPanel,
  showUrbanMethodPanel,
  showNLQueryPanel,
  showWorkflowDrawer,
  showReviewTimeline,
  hasReportHandoffSource,
  activeRightDockRoutePanel,
  rightDockCollapsed = false,
  navigatorStageMode,
  navigatorStageMargin,
  layoutPreferences,
}: UseMapPanelLayoutOptions) {
  // p04: the active right-dock route is the single source of truth for which
  // contextual tool panel (pins / draw / measure) is open — there is no longer
  // a parallel `getActiveRightDockPanel(booleans)` derivation. A floating-modal
  // route (the drawing modal) reserves NO rail width: it paints over the map.
  const layoutRoutePanel = isFloatingModalRoutePanel(activeRightDockRoutePanel)
    ? null
    : activeRightDockRoutePanel;

  const requestedRightDockPanel = layoutRoutePanel ?? (hasReportHandoffSource
    ? "report"
    : showUrbanMethodPanel
      ? "urbanMethod"
      : showScientificQAPanel
        ? "scientificQA"
        : showWorkflowDrawer
          ? "workflow"
          : null);

  const dockLayout = useMemo(() => getMapDockLayout({
    containerWidth: mapContainerWidth,
    layerPanelRequested: showLayerPanel,
    rightPanel: requestedRightDockPanel,
    rightPanelCollapsed: rightDockCollapsed && isHostRenderedRoutePanel(activeRightDockRoutePanel),
    navigatorStageMode,
    layerPanelWidth: layoutPreferences.layerPanelWidth,
    rightPanelWidth: layoutPreferences.rightPanelWidth,
  }), [
    layoutPreferences.layerPanelWidth,
    layoutPreferences.rightPanelWidth,
    mapContainerWidth,
    navigatorStageMode,
    rightDockCollapsed,
    activeRightDockRoutePanel,
    requestedRightDockPanel,
    showLayerPanel,
  ]);

  return {
    dockLayout,
    effectiveShowSidebar: dockLayout.showPinSidebar,
    effectiveShowLayerPanel: dockLayout.showLayerPanel,
    effectiveShowDrawPanel: dockLayout.showDrawPanel,
    effectiveShowMeasurePanel: dockLayout.showMeasurePanel,
    effectiveShowScientificQAPanel: showScientificQAPanel && dockLayout.showScientificQAPanel,
    effectiveShowUrbanMethodPanel: showUrbanMethodPanel && dockLayout.showUrbanMethodPanel,
    effectiveShowNLQueryPanel: showNLQueryPanel && !navigatorStageMode,
    effectiveShowWorkflowDrawer: showWorkflowDrawer && dockLayout.showWorkflowPanel,
    effectiveShowReviewTimeline: showReviewTimeline && !navigatorStageMode,
    navigatorLeftInset: navigatorStageMode ? navigatorStageMargin : dockLayout.leftInset,
    navigatorRightInset: navigatorStageMode ? navigatorStageMargin : dockLayout.rightInset,
    requestedRightDockPanel,
  };
}
