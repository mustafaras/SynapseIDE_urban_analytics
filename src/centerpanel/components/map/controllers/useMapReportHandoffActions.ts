import { useCallback } from "react";

import type { MapFeatureReportRequest } from "../MapCanvas";
import {
  DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  type MapReportHandoffOptions,
  type MapReportHandoffSource,
  type MapReportSnapshotInput,
} from "../../../../services/map/MapReportHandoffService";

interface LayerSummary {
  id: string;
  name: string;
}

interface UseMapReportHandoffActionsParams {
  announce: (message: string) => void;
  captureReportHandoffSnapshot: (source: MapReportHandoffSource, options: MapReportHandoffOptions) => Promise<void>;
  closeFloatingRightPanels: () => void;
  closeRightDockPanels: () => void;
  overlayLayers: LayerSummary[];
  reportHandoffOptions: MapReportHandoffOptions;
  reportHandoffSource: MapReportHandoffSource | null;
  setIsExportingReportHandoffPdf: (next: boolean) => void;
  setIsGeneratingReportHandoffSnapshot: (next: boolean) => void;
  setReportHandoffOptions: (next: MapReportHandoffOptions) => void;
  setReportHandoffSnapshot: (next: MapReportSnapshotInput | null) => void;
  setReportHandoffSource: (source: MapReportHandoffSource | null) => void;
  setShowScientificQAPanel: (next: boolean) => void;
  setShowWorkflowDrawer: (next: boolean) => void;
  setUrbanWorkflowDraftRequest: (next: null) => void;
  setWorkflowPreview: (next: null) => void;
}

export function useMapReportHandoffActions({
  announce,
  captureReportHandoffSnapshot,
  closeFloatingRightPanels,
  closeRightDockPanels,
  overlayLayers,
  reportHandoffOptions,
  reportHandoffSource,
  setIsExportingReportHandoffPdf,
  setIsGeneratingReportHandoffSnapshot,
  setReportHandoffOptions,
  setReportHandoffSnapshot,
  setReportHandoffSource,
  setShowScientificQAPanel,
  setShowWorkflowDrawer,
  setUrbanWorkflowDraftRequest,
  setWorkflowPreview,
}: UseMapReportHandoffActionsParams) {
  const handleReportHandoffOptionsChange = useCallback((nextOptions: MapReportHandoffOptions) => {
    const shouldRefreshSnapshot = nextOptions.snapshotFrame !== reportHandoffOptions.snapshotFrame
      || nextOptions.snapshotFit !== reportHandoffOptions.snapshotFit;
    setReportHandoffOptions(nextOptions);
    if (shouldRefreshSnapshot && reportHandoffSource) {
      void captureReportHandoffSnapshot(reportHandoffSource, nextOptions);
    }
  }, [
    captureReportHandoffSnapshot,
    reportHandoffOptions.snapshotFit,
    reportHandoffOptions.snapshotFrame,
    reportHandoffSource,
    setReportHandoffOptions,
  ]);

  const handleOpenReportHandoff = useCallback((source: MapReportHandoffSource) => {
    const initialOptions = DEFAULT_MAP_REPORT_HANDOFF_OPTIONS;
    closeRightDockPanels();
    closeFloatingRightPanels();
    setShowScientificQAPanel(false);
    setShowWorkflowDrawer(false);
    setWorkflowPreview(null);
    setUrbanWorkflowDraftRequest(null);
    setReportHandoffSource(source);
    setReportHandoffOptions(initialOptions);
    setReportHandoffSnapshot(null);
    void captureReportHandoffSnapshot(source, initialOptions);
    announce("Map report preview opened");
  }, [
    announce,
    captureReportHandoffSnapshot,
    closeFloatingRightPanels,
    closeRightDockPanels,
    setReportHandoffOptions,
    setReportHandoffSnapshot,
    setReportHandoffSource,
    setShowScientificQAPanel,
    setShowWorkflowDrawer,
    setUrbanWorkflowDraftRequest,
    setWorkflowPreview,
  ]);

  const handleOpenCurrentMapReportHandoff = useCallback(() => {
    handleOpenReportHandoff({ scope: "map-view", title: "Current map evidence" });
  }, [handleOpenReportHandoff]);

  const handleLayerReportRequest = useCallback((layerId: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    handleOpenReportHandoff({
      scope: "layer",
      layerId,
      title: `${layer?.name ?? "Selected layer"} map finding`,
    });
  }, [handleOpenReportHandoff, overlayLayers]);

  const handleFeatureReportRequest = useCallback((payload: MapFeatureReportRequest) => {
    const titleValue = [
      payload.properties.detection_class,
      payload.properties.land_cover_class,
      payload.properties.cluster_label,
      payload.properties.query_intent,
      payload.properties.name,
      payload.properties.label,
      payload.properties.id,
      payload.properties.feature_id,
    ].find((value) => value != null && value !== "");

    handleOpenReportHandoff({
      scope: "feature",
      featureId: payload.featureId,
      properties: payload.properties,
      coordinate: payload.coordinate,
      title: `${titleValue ? String(titleValue) : "Selected feature"} feature finding`,
      ...(payload.layerId ? { layerId: payload.layerId } : {}),
    });
  }, [handleOpenReportHandoff]);

  const handleCloseReportHandoff = useCallback(() => {
    setReportHandoffSource(null);
    setReportHandoffSnapshot(null);
    setIsGeneratingReportHandoffSnapshot(false);
    setIsExportingReportHandoffPdf(false);
    announce("Map report preview closed");
  }, [
    announce,
    setIsExportingReportHandoffPdf,
    setIsGeneratingReportHandoffSnapshot,
    setReportHandoffSnapshot,
    setReportHandoffSource,
  ]);

  return {
    handleCloseReportHandoff,
    handleFeatureReportRequest,
    handleLayerReportRequest,
    handleOpenCurrentMapReportHandoff,
    handleOpenReportHandoff,
    handleReportHandoffOptionsChange,
  };
}
