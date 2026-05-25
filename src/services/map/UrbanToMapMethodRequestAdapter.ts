import {
  buildUrbanToMapMethodRequestPreview as buildUrbanToMapMethodRequestPreviewViaBridge,
  extractUrbanToMapMethodRequestFromEvent as extractUrbanToMapMethodRequestFromEventViaBridge,
  publishUrbanToMapMethodRequest as publishUrbanToMapMethodRequestViaBridge,
  subscribeUrbanToMapMethodRequests as subscribeUrbanToMapMethodRequestsViaBridge,
} from "./bridge/MapUrbanBridgeService";

import type {
  BuildUrbanToMapMethodRequestPreviewInput,
  UrbanToMapMethodRequest,
  UrbanToMapMethodRequestPreview,
} from "./bridge/MapUrbanBridgeService";

export {
  URBAN_TO_MAP_METHOD_REQUEST_EVENT,
  URBAN_TO_MAP_METHOD_REQUEST_VERSION,
} from "./bridge/MapUrbanBridgeService";

export type {
  BuildUrbanToMapMethodRequestPreviewInput,
  UrbanToMapActionPreview,
  UrbanToMapAoiPreview,
  UrbanToMapAoiRequirements,
  UrbanToMapGeometryRequirement,
  UrbanToMapLayerCompatibility,
  UrbanToMapLayerRequirements,
  UrbanToMapMethodRequest,
  UrbanToMapMethodRequestAction,
  UrbanToMapMethodRequestActionInput,
  UrbanToMapMethodRequestActionType,
  UrbanToMapMethodRequestEventDetail,
  UrbanToMapMethodRequestPreview,
  UrbanToMapPreviewStatus,
  UrbanToMapQABlockerSummary,
  UrbanToMapReportSnapshotPreview,
  UrbanToMapTemporalRequirement,
  UrbanToMapWorkflowDraftRequest,
  UrbanToMapWorkflowPreviewSummary,
  UrbanToMapWorkflowRequirements,
} from "./bridge/MapUrbanBridgeService";

export function buildUrbanToMapMethodRequestPreview(
  input: BuildUrbanToMapMethodRequestPreviewInput,
): UrbanToMapMethodRequestPreview {
  return buildUrbanToMapMethodRequestPreviewViaBridge(input);
}

export function extractUrbanToMapMethodRequestFromEvent(event: Event): UrbanToMapMethodRequest | null {
  return extractUrbanToMapMethodRequestFromEventViaBridge(event);
}

export function publishUrbanToMapMethodRequest(request: UrbanToMapMethodRequest): boolean {
  return publishUrbanToMapMethodRequestViaBridge(request);
}

export function subscribeUrbanToMapMethodRequests(
  handler: (request: UrbanToMapMethodRequest) => void,
): () => void {
  return subscribeUrbanToMapMethodRequestsViaBridge(handler);
}