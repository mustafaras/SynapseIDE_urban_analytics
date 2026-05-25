import {
  assessMapToUrbanContextReadiness as assessMapToUrbanContextReadinessViaBridge,
  buildMapToUrbanContextPayload as buildMapToUrbanContextPayloadViaBridge,
  publishMapToUrbanContextPayload as publishMapToUrbanContextPayloadViaBridge,
  sendMapContextToUrban as sendMapContextToUrbanViaBridge,
} from "./bridge/MapUrbanBridgeService";

import type {
  BuildMapToUrbanContextPayloadInput,
  MapToUrbanContextPayload,
  MapToUrbanContextReadiness,
  SendMapToUrbanContextInput,
  SendMapToUrbanContextResult,
} from "./bridge/MapUrbanBridgeService";

export {
  MAP_TO_URBAN_CONTEXT_EVENT,
  MAP_TO_URBAN_CONTEXT_PAYLOAD_VERSION,
} from "./bridge/MapUrbanBridgeService";

export type {
  BuildMapToUrbanContextPayloadInput,
  MapToUrbanAoiPayloadReference,
  MapToUrbanContextDestinationIntent,
  MapToUrbanContextPayload,
  MapToUrbanContextReadiness,
  MapToUrbanContextReceiverResult,
  MapToUrbanContextStatus,
  MapToUrbanEvidenceSummary,
  MapToUrbanLayerFieldDescriptor,
  MapToUrbanLayerFieldSummary,
  MapToUrbanLayerPayloadSummary,
  MapToUrbanWorkflowSummary,
  SendMapToUrbanContextInput,
  SendMapToUrbanContextResult,
} from "./bridge/MapUrbanBridgeService";

export function assessMapToUrbanContextReadiness(payload: Omit<MapToUrbanContextPayload, "disabledReasons">): MapToUrbanContextReadiness {
  return assessMapToUrbanContextReadinessViaBridge(payload);
}

export function buildMapToUrbanContextPayload(input: BuildMapToUrbanContextPayloadInput): MapToUrbanContextPayload {
  return buildMapToUrbanContextPayloadViaBridge(input);
}

export function publishMapToUrbanContextPayload(payload: MapToUrbanContextPayload): boolean {
  return publishMapToUrbanContextPayloadViaBridge(payload);
}

export function sendMapContextToUrban(input: SendMapToUrbanContextInput): SendMapToUrbanContextResult {
  return sendMapContextToUrbanViaBridge(input);
}