import { useCallback } from "react";

import type { MapAnalyzeTabId } from "../analyze";
import type { MapPublishTabId } from "../publish";
import type { MapSceneTabId } from "../scene";
import type { MapStyleTabId } from "../style";
import type { MapActivityDefinition } from "../mapActivityRuntime";
import type { MapRightDockPanel } from "../mapDocking";
import type { MapRightDockRouteSource } from "../mapRightDockRoutes";
import type { WorkbenchSidebarTabId } from "../MapLayerManager";

interface UseMapActivityRailSelectionParams {
  announce: (message: string) => void;
  dismissMapStartDialogForWorkspaceInteraction: () => void;
  openAnalyzeActivityTab: (tabId: MapAnalyzeTabId, announcement: string) => void;
  openStyleActivityTab: (tabId: MapStyleTabId, announcement: string, focusLayerId?: string | null) => void;
  openSceneActivityTab: (tabId: MapSceneTabId, announcement: string) => void;
  openPublishActivityTab: (tabId: MapPublishTabId, announcement: string) => void;
  openMapProblems: (source: MapRightDockRouteSource) => void;
  openRightDockPanel: (panel: MapRightDockPanel, announcement: string, source: MapRightDockRouteSource) => void;
  openDiagnosticsRightDock: (announcement?: string, source?: MapRightDockRouteSource) => void;
  setActiveActivityId: (activityId: MapActivityDefinition["id"]) => void;
  setShowLayerPanel: (show: boolean) => void;
  setShowModelBuilder: (show: boolean) => void;
  setShowPluginPanel: (show: boolean) => void;
  setShowProcessingToolbox: (show: boolean) => void;
  setWorkbenchSidebarTab: (tab: WorkbenchSidebarTabId) => void;
  setWorkspaceView: (view: "explore" | "compare") => void;
}

export function useMapActivityRailSelection({
  announce,
  dismissMapStartDialogForWorkspaceInteraction,
  openAnalyzeActivityTab,
  openStyleActivityTab,
  openSceneActivityTab,
  openPublishActivityTab,
  openMapProblems,
  openRightDockPanel,
  openDiagnosticsRightDock,
  setActiveActivityId,
  setShowLayerPanel,
  setShowModelBuilder,
  setShowPluginPanel,
  setShowProcessingToolbox,
  setWorkbenchSidebarTab,
  setWorkspaceView,
}: UseMapActivityRailSelectionParams) {
  return useCallback((activity: MapActivityDefinition) => {
    dismissMapStartDialogForWorkspaceInteraction();
    setActiveActivityId(activity.id);

    switch (activity.id) {
      case "overview":
        setWorkspaceView("explore");
        setShowLayerPanel(true);
        setWorkbenchSidebarTab("overview-readiness");
        break;
      case "data":
        setWorkspaceView("explore");
        setShowLayerPanel(true);
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
        setShowPluginPanel(false);
        setWorkbenchSidebarTab("data-import");
        break;
      case "layers":
        setWorkspaceView("explore");
        setShowLayerPanel(true);
        setWorkbenchSidebarTab("layers-stack");
        break;
      case "analyze":
        openAnalyzeActivityTab("analyze-workflows", "Analyze workspace opened");
        break;
      case "style":
        openStyleActivityTab("style-renderer", "Style workspace opened");
        break;
      case "scene":
        openSceneActivityTab("scene-3d", "Scene workspace opened");
        break;
      case "publish":
        openPublishActivityTab("publish-figure", "Publish workspace opened");
        break;
      case "qa":
        openMapProblems("activity-rail");
        break;
      case "review":
        openRightDockPanel("timeline", "Review timeline opened in the right dock", "activity-rail");
        break;
      case "diagnostics":
        openDiagnosticsRightDock("Diagnostics opened in the right dock", "activity-rail");
        break;
      case "extensions":
        setShowPluginPanel(true);
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
        break;
      default:
        break;
    }

    announce(`${activity.label} activity selected`);
  }, [
    announce,
    dismissMapStartDialogForWorkspaceInteraction,
    openAnalyzeActivityTab,
    openDiagnosticsRightDock,
    openMapProblems,
    openPublishActivityTab,
    openRightDockPanel,
    openSceneActivityTab,
    openStyleActivityTab,
    setActiveActivityId,
    setShowLayerPanel,
    setShowModelBuilder,
    setShowPluginPanel,
    setShowProcessingToolbox,
    setWorkbenchSidebarTab,
    setWorkspaceView,
  ]);
}
