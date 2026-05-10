import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { MapWorkflowPreview } from "@/services/map/MapWorkflowService";
import type { MapWorkspaceView } from "./mapExperience";

interface UseMapPanelCommandsArgs {
  announce: (message: string) => void;
  compactDock: boolean;
  effectiveShowLayerPanel: boolean;
  navigatorStageMode: boolean;
  setPointSymbologyLayerId: Dispatch<SetStateAction<string | null>>;
  setShowChoroplethPanel: Dispatch<SetStateAction<boolean>>;
  setShowClusterViz: Dispatch<SetStateAction<boolean>>;
  setShowDrawPanel: Dispatch<SetStateAction<boolean>>;
  setShowEmergingHotSpotViz: Dispatch<SetStateAction<boolean>>;
  setShowHotSpotViz: Dispatch<SetStateAction<boolean>>;
  setShowLayerPanel: Dispatch<SetStateAction<boolean>>;
  setShowMeasurePanel: Dispatch<SetStateAction<boolean>>;
  setShowNLQueryPanel: Dispatch<SetStateAction<boolean>>;
  setShowReviewTimeline: Dispatch<SetStateAction<boolean>>;
  setShowScientificQAPanel: Dispatch<SetStateAction<boolean>>;
  setShowSidebar: Dispatch<SetStateAction<boolean>>;
  setShowVoxCityOverlay: Dispatch<SetStateAction<boolean>>;
  setShowWorkflowDrawer: Dispatch<SetStateAction<boolean>>;
  setWorkspaceView: Dispatch<SetStateAction<MapWorkspaceView>>;
  setWorkflowPreview: Dispatch<SetStateAction<MapWorkflowPreview | null>>;
  showLayerPanel: boolean;
}

export function useMapPanelCommands({
  announce,
  compactDock,
  effectiveShowLayerPanel,
  navigatorStageMode,
  setPointSymbologyLayerId,
  setShowChoroplethPanel,
  setShowClusterViz,
  setShowDrawPanel,
  setShowEmergingHotSpotViz,
  setShowHotSpotViz,
  setShowLayerPanel,
  setShowMeasurePanel,
  setShowNLQueryPanel,
  setShowReviewTimeline,
  setShowScientificQAPanel,
  setShowSidebar,
  setShowVoxCityOverlay,
  setShowWorkflowDrawer,
  setWorkspaceView,
  setWorkflowPreview,
  showLayerPanel,
}: UseMapPanelCommandsArgs) {
  const closeFloatingRightPanels = useCallback(() => {
    setPointSymbologyLayerId(null);
    setShowChoroplethPanel(false);
    setShowClusterViz(false);
    setShowHotSpotViz(false);
    setShowEmergingHotSpotViz(false);
    setShowVoxCityOverlay(false);
    setShowNLQueryPanel(false);
    setShowReviewTimeline(false);
  }, [
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowNLQueryPanel,
    setShowReviewTimeline,
    setShowVoxCityOverlay,
  ]);

  const closeRightDockPanels = useCallback(() => {
    setShowSidebar(false);
    setShowDrawPanel(false);
    setShowMeasurePanel(false);
  }, [setShowDrawPanel, setShowMeasurePanel, setShowSidebar]);

  const openScientificQAPanel = useCallback(() => {
    if (navigatorStageMode) {
      setWorkspaceView("explore");
    }
    closeRightDockPanels();
    closeFloatingRightPanels();
    setShowScientificQAPanel(true);
    announce("Scientific QA panel opened");
  }, [
    announce,
    closeFloatingRightPanels,
    closeRightDockPanels,
    navigatorStageMode,
    setShowScientificQAPanel,
    setWorkspaceView,
  ]);

  const handleToggleScientificQAPanel = useCallback(() => {
    setShowScientificQAPanel((current) => {
      const next = !current;
      if (next) {
        if (navigatorStageMode) {
          setWorkspaceView("explore");
        }
        closeRightDockPanels();
        closeFloatingRightPanels();
      }
      announce(next ? "Scientific QA panel opened" : "Scientific QA panel closed");
      return next;
    });
  }, [
    announce,
    closeFloatingRightPanels,
    closeRightDockPanels,
    navigatorStageMode,
    setShowScientificQAPanel,
    setWorkspaceView,
  ]);

  const handleToggleNLQueryPanel = useCallback(() => {
    setShowNLQueryPanel((current) => {
      const next = !current;
      if (next) {
        if (navigatorStageMode) {
          setWorkspaceView("explore");
        }
        closeRightDockPanels();
        setShowScientificQAPanel(false);
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowReviewTimeline(false);
      }
      announce(next ? "Map query builder opened" : "Map query builder closed");
      return next;
    });
  }, [
    announce,
    closeRightDockPanels,
    navigatorStageMode,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowNLQueryPanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowVoxCityOverlay,
    setShowWorkflowDrawer,
    setWorkspaceView,
  ]);

  const handleToggleWorkflowDrawer = useCallback(() => {
    setShowWorkflowDrawer((current) => {
      const next = !current;
      if (next) {
        if (navigatorStageMode) {
          setWorkspaceView("explore");
        }
        closeRightDockPanels();
        setShowScientificQAPanel(false);
        setShowNLQueryPanel(false);
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowReviewTimeline(false);
      } else {
        setWorkflowPreview(null);
      }
      announce(next ? "Spatial workflow drawer opened" : "Spatial workflow drawer closed");
      return next;
    });
  }, [
    announce,
    closeRightDockPanels,
    navigatorStageMode,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowNLQueryPanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowVoxCityOverlay,
    setShowWorkflowDrawer,
    setWorkspaceView,
    setWorkflowPreview,
  ]);

  const handleToggleReviewTimeline = useCallback(() => {
    setShowReviewTimeline((current) => {
      const next = !current;
      if (next) {
        if (navigatorStageMode) {
          setWorkspaceView("explore");
        }
        closeRightDockPanels();
        setShowScientificQAPanel(false);
        setShowNLQueryPanel(false);
        setShowWorkflowDrawer(false);
        setWorkflowPreview(null);
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
      }
      announce(next ? "Review timeline opened" : "Review timeline closed");
      return next;
    });
  }, [
    announce,
    closeRightDockPanels,
    navigatorStageMode,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowNLQueryPanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowVoxCityOverlay,
    setShowWorkflowDrawer,
    setWorkspaceView,
    setWorkflowPreview,
  ]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((current) => {
      if (!current) {
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowDrawPanel(false);
        setShowMeasurePanel(false);
      }
      announce(!current ? "Pin sidebar opened" : "Pin sidebar closed");
      return !current;
    });
  }, [
    announce,
    closeFloatingRightPanels,
    setShowDrawPanel,
    setShowMeasurePanel,
    setShowScientificQAPanel,
    setShowSidebar,
  ]);

  const handleToggleLayerPanel = useCallback(() => {
    if (navigatorStageMode) {
      setWorkspaceView("explore");
      setShowLayerPanel(true);
      announce("Layer panel opened");
      return;
    }

    if (compactDock && showLayerPanel && !effectiveShowLayerPanel) {
      setShowSidebar(false);
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
      setShowLayerPanel(true);
      announce("Layer panel opened");
      return;
    }

    setShowLayerPanel((current) => {
      announce(!current ? "Layer panel opened" : "Layer panel closed");
      return !current;
    });
  }, [
    announce,
    compactDock,
    effectiveShowLayerPanel,
    navigatorStageMode,
    setShowDrawPanel,
    setShowLayerPanel,
    setShowMeasurePanel,
    setShowSidebar,
    setWorkspaceView,
    showLayerPanel,
  ]);

  const handleToggleChoroplethPanel = useCallback(() => {
    setShowChoroplethPanel((current) => {
      if (!current) {
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
      }
      announce(!current ? "Choropleth panel opened" : "Choropleth panel closed");
      return !current;
    });
  }, [
    announce,
    closeRightDockPanels,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowScientificQAPanel,
  ]);

  const handleToggleClusterViz = useCallback(() => {
    setShowClusterViz((current) => {
      if (!current) {
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
      }
      announce(!current ? "LISA cluster panel opened" : "LISA cluster panel closed");
      return !current;
    });
  }, [
    announce,
    closeRightDockPanels,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowScientificQAPanel,
  ]);

  const handleToggleHotSpotViz = useCallback(() => {
    setShowHotSpotViz((current) => {
      if (!current) {
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowEmergingHotSpotViz(false);
      }
      announce(!current ? "Getis-Ord Gi star panel opened" : "Getis-Ord Gi star panel closed");
      return !current;
    });
  }, [
    announce,
    closeRightDockPanels,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowScientificQAPanel,
  ]);

  const handleToggleEmergingHotSpotViz = useCallback(() => {
    setShowEmergingHotSpotViz((current) => {
      if (!current) {
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
      }
      announce(!current ? "Emerging hot spot panel opened" : "Emerging hot spot panel closed");
      return !current;
    });
  }, [
    announce,
    closeRightDockPanels,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowScientificQAPanel,
  ]);

  return {
    closeFloatingRightPanels,
    closeRightDockPanels,
    openScientificQAPanel,
    handleToggleScientificQAPanel,
    handleToggleNLQueryPanel,
    handleToggleWorkflowDrawer,
    handleToggleReviewTimeline,
    handleToggleSidebar,
    handleToggleLayerPanel,
    handleToggleChoroplethPanel,
    handleToggleClusterViz,
    handleToggleHotSpotViz,
    handleToggleEmergingHotSpotViz,
  };
}