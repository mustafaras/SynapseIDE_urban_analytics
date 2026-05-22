import { useState } from "react";

import type {
  MapWorkflowGeocodedPlace,
  MapWorkflowPreview,
  MapWorkflowReportItem,
} from "@/services/map/MapWorkflowService";
import type { UrbanToMapWorkflowDraftRequest } from "@/services/map/UrbanToMapMethodRequestAdapter";

export function useMapWorkflowController() {
  const [showWorkflowDrawer, setShowWorkflowDrawer] = useState(false);
  const [workflowPreview, setWorkflowPreview] = useState<MapWorkflowPreview | null>(null);
  const [urbanWorkflowDraftRequest, setUrbanWorkflowDraftRequest] =
    useState<UrbanToMapWorkflowDraftRequest | null>(null);
  const [workflowGeocodedPlace, setWorkflowGeocodedPlace] = useState<MapWorkflowGeocodedPlace | null>(null);
  const [_workflowReportItems, setWorkflowReportItems] = useState<MapWorkflowReportItem[]>([]);

  return {
    showWorkflowDrawer,
    setShowWorkflowDrawer,
    workflowPreview,
    setWorkflowPreview,
    urbanWorkflowDraftRequest,
    setUrbanWorkflowDraftRequest,
    workflowGeocodedPlace,
    setWorkflowGeocodedPlace,
    setWorkflowReportItems,
  };
}
