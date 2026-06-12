import { useCallback, useRef, useState } from "react";

import type { MapRightDockPanel } from "../mapDocking";
import {
  closeMapRightDockRouteState,
  createMapRightDockRoute,
  EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
  getMapRightDockPanelDefinition,
  type MapRightDockRoute,
  type MapRightDockRouteSource,
  type MapRightDockRouteState,
  openMapRightDockRouteState,
  switchMapRightDockRouteState,
} from "../mapRightDockRoutes";
import type {
  MapWorkspaceView,
} from "../mapExperience";
import type { MapStartDialogHandoff } from "../mapStartDialogState";

interface UseMapRightDockRoutingInput {
  announce: (message: string) => void;
  closeMapStartDialog: (action: MapStartDialogHandoff | "dismiss" | "close" | "escape", announcement?: string) => void;
  mapStartDialogOpen: boolean;
  setShowDrawPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMeasurePanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowReviewTimeline: React.Dispatch<React.SetStateAction<boolean>>;
  setShowScientificQAPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setWorkspaceView: React.Dispatch<React.SetStateAction<MapWorkspaceView>>;
  workspaceView: MapWorkspaceView;
}

export interface MapRightDockRoutingController {
  activeRightDockRoute: MapRightDockRoute | null;
  bottomPanelReturnFocusRef: React.MutableRefObject<HTMLElement | null>;
  closeRightDockRoute: () => void;
  openDiagnosticsRightDock: (announcement?: string, routeSource?: MapRightDockRouteSource) => void;
  openPerformanceRightDock: (announcement?: string, routeSource?: MapRightDockRouteSource) => void;
  openRightDockPanel: (
    panel: MapRightDockPanel,
    announcement?: string,
    routeSource?: MapRightDockRouteSource,
    detail?: string | null,
  ) => void;
  rightDockRouteState: MapRightDockRouteState;
  switchRightDockRoute: (route: MapRightDockRoute) => void;
  toggleRightDockPanel: (
    panel: MapRightDockPanel,
    announcement?: string,
    routeSource?: MapRightDockRouteSource,
    detail?: string | null,
  ) => void;
}

export function useMapRightDockRouting({
  announce,
  closeMapStartDialog,
  mapStartDialogOpen,
  setShowDrawPanel,
  setShowMeasurePanel,
  setShowReviewTimeline,
  setShowScientificQAPanel,
  setShowSidebar,
  setWorkspaceView,
  workspaceView,
}: UseMapRightDockRoutingInput): MapRightDockRoutingController {
  const [rightDockRouteState, setRightDockRouteState] = useState<MapRightDockRouteState>(
    EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
  );
  const bottomPanelReturnFocusRef = useRef<HTMLElement | null>(null);

  const activeRightDockRoute = rightDockRouteState.activeRoute;

  const switchRightDockRoute = useCallback((route: MapRightDockRoute) => {
    setRightDockRouteState((current) => switchMapRightDockRouteState(current, route));
  }, []);

  const closeRightDockRoute = useCallback(() => {
    setRightDockRouteState((current) => closeMapRightDockRouteState(current));
  }, []);

  const openRightDockPanel = useCallback((
    panel: MapRightDockPanel,
    announcement?: string,
    routeSource: MapRightDockRouteSource = "programmatic",
    detail?: string | null,
  ) => {
    if (typeof document !== "undefined") {
      const activeElement = document.activeElement;
      bottomPanelReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    }

    const route = createMapRightDockRoute(panel, {
      source: routeSource,
      detail: detail ?? announcement ?? null,
    });
    setRightDockRouteState((current) => (
      current.activeRoute
        ? switchMapRightDockRouteState(current, route)
        : openMapRightDockRouteState(current, route)
    ));

    if (mapStartDialogOpen) {
      closeMapStartDialog("continue", "Map launch dialog dismissed");
    }

    if (workspaceView === "navigator") {
      setWorkspaceView("explore");
    }

    setShowReviewTimeline(false);
    setShowScientificQAPanel(false);
    setShowSidebar(false);
    setShowDrawPanel(false);
    setShowMeasurePanel(false);

    const definition = getMapRightDockPanelDefinition(panel);
    // Deliberately NOT calling setActiveActivityId here: the right dock is an
    // inspector surface and must not hijack the left activity rail/sidebar.
    // Activity-rail clicks set the activity themselves before routing here,
    // so rail-driven opens keep their highlight while toolbar/menu-driven
    // opens leave the left workspace untouched.
    announce(announcement ?? `${definition.label} opened in the right dock`);
  }, [
    announce,
    closeMapStartDialog,
    mapStartDialogOpen,
    setShowDrawPanel,
    setShowMeasurePanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowSidebar,
    setWorkspaceView,
    workspaceView,
  ]);

  const toggleRightDockPanel = useCallback((
    panel: MapRightDockPanel,
    announcement?: string,
    routeSource: MapRightDockRouteSource = "programmatic",
    detail?: string | null,
  ) => {
    const definition = getMapRightDockPanelDefinition(panel);
    if (activeRightDockRoute?.panel === panel) {
      closeRightDockRoute();
      announce(`${definition.label} right dock closed`);
      return;
    }
    openRightDockPanel(panel, announcement, routeSource, detail);
  }, [activeRightDockRoute?.panel, announce, closeRightDockRoute, openRightDockPanel]);

  const openDiagnosticsRightDock = useCallback((
    announcement = "Diagnostics opened in the right dock",
    routeSource: MapRightDockRouteSource = "programmatic",
  ) => {
    openRightDockPanel("diagnostics", announcement, routeSource);
  }, [openRightDockPanel]);

  const openPerformanceRightDock = useCallback((
    announcement = "Performance diagnostics opened in the right dock",
    routeSource: MapRightDockRouteSource = "programmatic",
  ) => {
    openRightDockPanel("performance", announcement, routeSource);
  }, [openRightDockPanel]);

  return {
    activeRightDockRoute,
    bottomPanelReturnFocusRef,
    closeRightDockRoute,
    openDiagnosticsRightDock,
    openPerformanceRightDock,
    openRightDockPanel,
    rightDockRouteState,
    switchRightDockRoute,
    toggleRightDockPanel,
  };
}
