import { useMemo } from "react";

import {
  getActiveRightDockPanel,
  getMapDockLayout,
  type MapRightDockPanel,
} from "../mapDocking";

interface MapPanelLayoutPreferences {
  layerPanelWidth: number;
  rightPanelWidth: number;
}

interface UseMapPanelLayoutOptions {
  mapContainerWidth: number;
  showLayerPanel: boolean;
  showSidebar: boolean;
  showDrawPanel: boolean;
  showMeasurePanel: boolean;
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
  showSidebar,
  showDrawPanel,
  showMeasurePanel,
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
  const requestedRightDockPanel = activeRightDockRoutePanel ?? (hasReportHandoffSource
    ? "report"
    : showUrbanMethodPanel
      ? "urbanMethod"
      : showScientificQAPanel
        ? "scientificQA"
        : showWorkflowDrawer
          ? "workflow"
          : getActiveRightDockPanel({
            showPinSidebar: showSidebar,
            showDrawPanel,
            showMeasurePanel,
          }));

  const dockLayout = useMemo(() => getMapDockLayout({
    containerWidth: mapContainerWidth,
    layerPanelRequested: showLayerPanel,
    rightPanel: requestedRightDockPanel,
    rightPanelCollapsed: rightDockCollapsed && activeRightDockRoutePanel != null,
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
