import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import {
  collectSelectionStatistics,
  dispatchFlowSelection,
  dispatchIsochroneNavigation,
  type MapDispatchCompatibleFlow,
  type SelectionStatisticsSummary,
} from "@/services/map/MapAnalysisDispatcher";
import type { MapReviewTimelineEventInput } from "@/services/map/MapReviewSessionService";
import { toastInfo } from "@/ui/toast/api";
import type { OverlayLayerConfig } from "./mapTypes";

type DispatchFeedbackTone = "info" | "busy" | "success" | "error";

interface DispatchFeedbackState {
  tone: DispatchFeedbackTone;
  title: string;
  description: string;
}

interface FlowDispatchAoiCandidate {
  feature: Feature<Polygon | MultiPolygon>;
  source: "drawn-aoi" | "map-context-menu";
  label: string;
}

interface UseMapAoiDispatchArgs {
  announce: (message: string) => void;
  compatibleAoiFlows: readonly MapDispatchCompatibleFlow[];
  currentMapBounds: [number, number, number, number] | null;
  flowDispatchAoi: FlowDispatchAoiCandidate | null;
  overlayLayers: OverlayLayerConfig[];
  recordMapReviewEvent: (event: MapReviewTimelineEventInput) => void;
  restrictToMapView: boolean;
  selectedFeatureIds: Record<string, string[]>;
  setDispatchFeedback: Dispatch<SetStateAction<DispatchFeedbackState | null>>;
  setIsFlowDispatchDialogOpen: Dispatch<SetStateAction<boolean>>;
  setRestrictToMapView: Dispatch<SetStateAction<boolean>>;
  setSelectionStatsSummary: Dispatch<SetStateAction<SelectionStatisticsSummary[] | null>>;
}

export function useMapAoiDispatch({
  announce,
  compatibleAoiFlows,
  currentMapBounds,
  flowDispatchAoi,
  overlayLayers,
  recordMapReviewEvent,
  restrictToMapView,
  selectedFeatureIds,
  setDispatchFeedback,
  setIsFlowDispatchDialogOpen,
  setRestrictToMapView,
  setSelectionStatsSummary,
}: UseMapAoiDispatchArgs) {
  const handleToggleRestrictToMapView = useCallback(() => {
    setRestrictToMapView((current) => {
      const next = !current;
      setDispatchFeedback({
        tone: "info",
        title: next ? "Map extent filter enabled" : "Map extent filter disabled",
        description: next
          ? "New dispatches will carry the current visible map bounds into workflows and quick analyses."
          : "New dispatches can use the selected AOI or local analysis window without the current map extent filter.",
      });
      return next;
    });
  }, [setDispatchFeedback, setRestrictToMapView]);

  const handleOpenFlowDispatchDialog = useCallback(() => {
    if (!flowDispatchAoi) {
      const message = "Missing prerequisite: draw or select a polygon AOI, or keep the current view focused before routing analysis to a workflow.";
      setDispatchFeedback({ tone: "error", title: "No AOI available", description: message });
      toastInfo(message);
      announce(message);
      return;
    }

    setIsFlowDispatchDialogOpen(true);
    setDispatchFeedback({
      tone: "info",
      title: "AOI ready for workflow dispatch",
      description: `${flowDispatchAoi.label} can now be routed into a compatible workflow with${restrictToMapView ? "" : "out"} the current extent restriction.`,
    });
  }, [announce, flowDispatchAoi, restrictToMapView, setDispatchFeedback, setIsFlowDispatchDialogOpen]);

  const handleRunSelectionStatistics = useCallback(() => {
    const summary = collectSelectionStatistics(overlayLayers, selectedFeatureIds);
    if (summary.length === 0) {
      const message = "Select one or more features on a queryable layer to compute quick statistics.";
      setSelectionStatsSummary(null);
      setDispatchFeedback({ tone: "error", title: "Selection statistics unavailable", description: message });
      toastInfo(message);
      announce(message);
      return;
    }

    const selectedFeatureCount = summary.reduce((total, entry) => total + entry.selectedFeatureCount, 0);
    setSelectionStatsSummary(summary);
    recordMapReviewEvent({
      type: "analysis-dispatch",
      status: "applied",
      title: "Selection statistics computed",
      summary: `Computed descriptive statistics for ${selectedFeatureCount.toLocaleString()} selected feature(s).`,
      layerIds: summary.map((entry) => entry.layerId),
      details: {
        selectedFeatureCount,
        layerCount: summary.length,
        numericFieldCounts: Object.fromEntries(summary.map((entry) => [entry.layerId, entry.numericFields.length])),
      },
    });
    setDispatchFeedback({
      tone: "success",
      title: "Selection statistics ready",
      description: `Computed descriptive statistics for ${selectedFeatureCount.toLocaleString()} selected feature(s).`,
    });
    announce("Selection statistics panel updated");
  }, [
    announce,
    overlayLayers,
    recordMapReviewEvent,
    selectedFeatureIds,
    setDispatchFeedback,
    setSelectionStatsSummary,
  ]);

  const handleDispatchFlowSelection = useCallback((flowId: MapDispatchCompatibleFlow["id"]) => {
    if (!flowDispatchAoi) {
      return;
    }

    const selectedFlow = compatibleAoiFlows.find((flow) => flow.id === flowId);
    dispatchFlowSelection({
      flowId,
      aoi: flowDispatchAoi.feature,
      source: flowDispatchAoi.source,
      restrictToView: restrictToMapView,
      ...(restrictToMapView && currentMapBounds ? { viewBounds: currentMapBounds } : {}),
    });
    setIsFlowDispatchDialogOpen(false);
    setDispatchFeedback({
      tone: "success",
      title: `${selectedFlow?.label ?? flowId} launched`,
      description: `${flowDispatchAoi.label} was attached to the workflow${restrictToMapView && currentMapBounds ? " with the current view restriction" : ""}.`,
    });
    recordMapReviewEvent({
      type: "analysis-dispatch",
      status: "applied",
      title: `AOI workflow dispatched: ${selectedFlow?.label ?? flowId}`,
      summary: `${flowDispatchAoi.label} was attached to ${flowId}${restrictToMapView && currentMapBounds ? " with current extent restriction" : ""}.`,
      details: {
        flowId,
        aoiSource: flowDispatchAoi.source,
        restrictToView: restrictToMapView,
        viewBounds: restrictToMapView ? currentMapBounds : null,
      },
    });
    announce(`${selectedFlow?.label ?? flowId} opened from map dispatch`);
  }, [
    announce,
    compatibleAoiFlows,
    currentMapBounds,
    flowDispatchAoi,
    recordMapReviewEvent,
    restrictToMapView,
    setDispatchFeedback,
    setIsFlowDispatchDialogOpen,
  ]);

  const handleIsochroneDispatch = useCallback((coordinate: [number, number]) => {
    const origin = { lng: coordinate[0], lat: coordinate[1] };
    dispatchIsochroneNavigation({
      origin,
      thresholdMinutes: 15,
      restrictToView: restrictToMapView,
      ...(restrictToMapView && currentMapBounds ? { viewBounds: currentMapBounds } : {}),
    });
    setDispatchFeedback({
      tone: "busy",
      title: "Accessibility workflow launched",
      description: "Isochrone dispatch is opening the Accessibility flow and will auto-publish a map result into Map Explorer.",
    });
    recordMapReviewEvent({
      type: "analysis-dispatch",
      status: "applied",
      title: "Isochrone workflow dispatched",
      summary: "Point context was sent to the network accessibility engine for isochrone analysis.",
      details: {
        longitude: origin.lng,
        latitude: origin.lat,
        thresholdMinutes: 15,
        restrictToView: restrictToMapView,
        viewBounds: restrictToMapView ? currentMapBounds : null,
      },
    });
    announce("Accessibility workflow opened from map dispatch");
  }, [announce, currentMapBounds, recordMapReviewEvent, restrictToMapView, setDispatchFeedback]);

  return {
    handleToggleRestrictToMapView,
    handleOpenFlowDispatchDialog,
    handleRunSelectionStatistics,
    handleDispatchFlowSelection,
    handleIsochroneDispatch,
  };
}