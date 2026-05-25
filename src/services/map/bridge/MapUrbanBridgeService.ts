import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import type {
  DrawnFeature,
  LayerSchemaFieldRole,
  LayerSourceKind,
  MapEvidenceArtifact,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import { summarizeOverlayLayer } from "@/centerpanel/components/map/mapContextSummary";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type {
  MapToUrbanAoiPayloadReference,
  MapToUrbanContextDestinationIntent,
  MapToUrbanContextPayload,
  MapToUrbanContextQaSummary,
  MapToUrbanContextCrsSummary,
  MapToUrbanEvidenceSummary,
  MapToUrbanLayerFieldDescriptor,
  MapToUrbanLayerFieldSummary,
  MapToUrbanLayerPayloadSummary,
  MapToUrbanWorkflowSummary,
  UrbanToMapGeometryRequirement,
  UrbanToMapLayerRequirements,
  UrbanToMapMethodRequestAction,
  UrbanToMapMethodRequestActionInput,
  UrbanToMapMethodRequestActionType,
  UrbanToMapMethodRequestPayload,
} from "../contracts/gisContracts";
import type { MapScientificQAIssue, MapScientificQAState } from "../MapScientificQA";
import {
  createDefaultDraft,
  generateMapWorkflowPreview,
  type MapWorkflowAOIDraft,
  type MapWorkflowBufferDraft,
  type MapWorkflowComparisonDraft,
  type MapWorkflowContext,
  type MapWorkflowDifferenceDraft,
  type MapWorkflowDraft,
  type MapWorkflowIntersectDraft,
  type MapWorkflowKind,
  type MapWorkflowPreview,
  type MapWorkflowUnionDraft,
} from "../MapWorkflowService";

export type {
  MapToUrbanAoiPayloadReference,
  MapToUrbanContextDestinationIntent,
  MapToUrbanContextPayload,
  MapToUrbanContextQaSummary,
  MapToUrbanContextCrsSummary,
  MapToUrbanEvidenceSummary,
  MapToUrbanLayerFieldDescriptor,
  MapToUrbanLayerFieldSummary,
  MapToUrbanLayerPayloadSummary,
  MapToUrbanWorkflowSummary,
  UrbanToMapAoiRequirements,
  UrbanToMapGeometryRequirement,
  UrbanToMapLayerRequirements,
  UrbanToMapMethodRequestAction,
  UrbanToMapMethodRequestActionInput,
  UrbanToMapMethodRequestActionType,
  UrbanToMapMethodRequestPayload,
  UrbanToMapMethodRequirements,
  UrbanToMapMethodValiditySummary,
  UrbanToMapTemporalRequirement,
  UrbanToMapWorkflowRequirements,
} from "../contracts/gisContracts";

export const MAP_URBAN_BRIDGE_VERSION = 1;
export const MAP_TO_URBAN_CONTEXT_EVENT = "map:urban-sync:provided";
export const MAP_TO_URBAN_CONTEXT_PAYLOAD_VERSION = MAP_URBAN_BRIDGE_VERSION;
export const URBAN_TO_MAP_METHOD_REQUEST_VERSION = MAP_URBAN_BRIDGE_VERSION;
export const URBAN_TO_MAP_METHOD_REQUEST_EVENT = "urban:map-method-request";

const MAX_FIELD_SCAN_FEATURES = 120;
const MAX_FIELD_SUMMARY_FIELDS = 48;
const MAX_EVIDENCE_SUMMARIES = 48;
const MAX_TEXT_LIST = 12;
let pendingUrbanToMapMethodRequest: UrbanToMapMethodRequestPayload | null = null;
let urbanToMapMethodRequestSubscriberCount = 0;

export type MapToUrbanContextStatus = "sent" | "blocked";
export type UrbanToMapMethodRequest =
  Omit<UrbanToMapMethodRequestPayload, "version" | "createdAt" | "destinationModule">
  & Partial<Pick<UrbanToMapMethodRequestPayload, "version" | "createdAt" | "destinationModule">>;
export type UrbanToMapPreviewStatus = "ready" | "needs-review" | "blocked";

export interface MapToUrbanContextReadiness {
  canSend: boolean;
  disabledReasons: string[];
  usableLayerIds: string[];
}

export interface BuildMapToUrbanContextPayloadInput {
  contextSummary: MapExplorerContextSummary;
  overlayLayers: readonly OverlayLayerConfig[];
  drawnFeatures?: readonly DrawnFeature[];
  activeAoiId?: string | undefined;
  selectedFeatureIds?: Readonly<Record<string, readonly string[]>>;
  mapEvidenceArtifacts?: readonly MapEvidenceArtifact[];
  scientificQA?: MapScientificQAState | null;
  activeWorkflowId?: AnalyticalFlowId | string | null;
  completedRunIds?: readonly string[];
  requestedLayerId?: string | null;
  now?: string;
}

export interface MapToUrbanContextReceiverResult {
  contextId: string | null;
  evidenceArtifactId?: string;
  recommendationTriggered?: boolean;
  recommendationReason?: string | null;
}

export interface SendMapToUrbanContextInput extends BuildMapToUrbanContextPayloadInput {
  receiver?: (payload: MapToUrbanContextPayload) => MapToUrbanContextReceiverResult;
  dispatchEvent?: boolean;
}

export interface SendMapToUrbanContextResult {
  status: MapToUrbanContextStatus;
  payload: MapToUrbanContextPayload;
  disabledReasons: string[];
  eventDispatched: boolean;
  urbanContextId: string | null;
  evidenceArtifactId: string | null;
  recommendationTriggered: boolean;
  recommendationReason: string | null;
}

export interface UrbanToMapLayerCompatibility {
  layerId: string;
  name: string;
  status: UrbanToMapPreviewStatus;
  visible: boolean;
  queryable: boolean;
  geometryFamilies: UrbanToMapGeometryRequirement[];
  requiredFields: string[];
  matchedRequiredFields: string[];
  missingRequiredFields: string[];
  optionalFields: string[];
  matchedOptionalFields: string[];
  temporalFields: string[];
  featureCount: number | null;
  crs: string | null;
  qaStatus: string | null;
  reasons: string[];
  warnings: string[];
  sourceKind?: LayerSourceKind;
}

export interface UrbanToMapAoiPreview {
  status: UrbanToMapPreviewStatus;
  activeAoiId: string | null;
  preferredAoiId: string | null;
  geometryFamily: string | null;
  missingPrerequisites: string[];
  warnings: string[];
}

export interface UrbanToMapWorkflowPreviewSummary {
  workflow: MapWorkflowKind;
  canApply: boolean;
  needsWorker: boolean;
  featureCount: number;
  geometryClass: string;
  nextRequiredStep: string | null;
  issueCount: number;
  blockerCount: number;
  warningCount: number;
  sourceLayerIds: string[];
  metrics: Record<string, number | string | null>;
  outputLayerName: string | null;
}

export interface UrbanToMapWorkflowDraftRequest {
  requestId: string;
  kind: MapWorkflowKind;
  draft: MapWorkflowDraft;
}

export interface UrbanToMapReportSnapshotPreview {
  status: UrbanToMapPreviewStatus;
  scope: "map-view" | "layer";
  targetLayerIds: string[];
  visibleLayerCount: number;
  blockers: string[];
  warnings: string[];
}

export interface UrbanToMapActionPreview {
  type: UrbanToMapMethodRequestActionType;
  label: string;
  status: UrbanToMapPreviewStatus;
  targetLayerIds: string[];
  missingPrerequisites: string[];
  warnings: string[];
}

export interface UrbanToMapQABlockerSummary {
  issueId: string;
  severity: MapScientificQAIssue["severity"];
  title: string;
  layerId: string | null;
  category: MapScientificQAIssue["category"];
}

export interface UrbanToMapMethodRequestPreview {
  version: typeof URBAN_TO_MAP_METHOD_REQUEST_VERSION;
  previewId: string;
  requestId: string;
  createdAt: string;
  status: UrbanToMapPreviewStatus;
  sourceModule: "map-explorer";
  destinationModule: "urban-analytics";
  methodId: string;
  methodLabel: string;
  requestedActions: UrbanToMapActionPreview[];
  compatibleLayers: UrbanToMapLayerCompatibility[];
  blockedLayerIds: string[];
  missingPrerequisites: string[];
  warnings: string[];
  qaBlockers: UrbanToMapQABlockerSummary[];
  aoiPreview: UrbanToMapAoiPreview;
  workflowPreview: UrbanToMapWorkflowPreviewSummary | null;
  workflowDraftRequest: UrbanToMapWorkflowDraftRequest | null;
  reportSnapshotPreview: UrbanToMapReportSnapshotPreview | null;
}

export interface BuildUrbanToMapMethodRequestPreviewInput {
  request: UrbanToMapMethodRequest;
  contextSummary: MapExplorerContextSummary;
  overlayLayers: ReadonlyArray<OverlayLayerConfig>;
  workflowContext: MapWorkflowContext;
  scientificQA?: MapScientificQAState | null;
  now?: string;
}

export type UrbanToMapMethodRequestEventDetail =
  | UrbanToMapMethodRequestPayload
  | { request: UrbanToMapMethodRequestPayload };

function uniqueStrings(values: Iterable<string | null | undefined>, limit = 96): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function clipList(values: readonly string[] | undefined, limit = MAX_TEXT_LIST): string[] {
  return uniqueStrings(values ?? [], limit);
}

function sourceDataToFeatureCollection(sourceData: OverlayLayerConfig["sourceData"]): GeoJSON.FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") return null;
  if (sourceData.type === "FeatureCollection") return sourceData;
  if (sourceData.type === "Feature") {
    return { type: "FeatureCollection", features: [sourceData] };
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: sourceData }],
  };
}

function roleFromFieldName(fieldName: string): LayerSchemaFieldRole | "unknown" {
  const normalized = fieldName.toLowerCase();
  if (["geom", "geometry", "the_geom", "wkb_geometry"].includes(normalized)) return "geometry";
  if (["id", "fid", "objectid", "ogc_fid", "feature_id"].includes(normalized)) return "identifier";
  if (normalized.includes("date") || normalized.includes("time") || normalized.includes("year")) return "temporal";
  return "attribute";
}

function addFieldDescriptor(
  fields: Map<string, MapToUrbanLayerFieldDescriptor>,
  descriptor: MapToUrbanLayerFieldDescriptor,
): void {
  const key = descriptor.name.trim();
  if (!key || fields.has(key)) return;
  fields.set(key, { ...descriptor, name: key });
}

function collectFeatureScanFields(layer: OverlayLayerConfig): MapToUrbanLayerFieldDescriptor[] {
  const collection = sourceDataToFeatureCollection(layer.sourceData);
  if (!collection) return [];

  const descriptors = new Map<string, MapToUrbanLayerFieldDescriptor>();
  const scanLimit = Math.min(collection.features.length, MAX_FIELD_SCAN_FEATURES);
  for (let index = 0; index < scanLimit; index += 1) {
    const properties = collection.features[index]?.properties ?? {};
    for (const fieldName of Object.keys(properties)) {
      if (fieldName.startsWith("__")) continue;
      addFieldDescriptor(descriptors, {
        name: fieldName,
        role: roleFromFieldName(fieldName),
        source: "feature-scan",
      });
    }
  }
  return [...descriptors.values()];
}

function buildLayerFieldSummary(layer: OverlayLayerConfig): MapToUrbanLayerFieldSummary {
  const registry = normalizeLayerRegistryMetadata(layer);
  const descriptors = new Map<string, MapToUrbanLayerFieldDescriptor>();

  registry.schemaSummary.fields.forEach((field) => {
    const descriptor: MapToUrbanLayerFieldDescriptor = {
      name: field.name,
      role: field.role,
      source: "schema",
    };
    if (field.type) descriptor.type = field.type;
    addFieldDescriptor(descriptors, descriptor);
  });

  (layer.metadata?.fields ?? []).forEach((fieldName) => {
    addFieldDescriptor(descriptors, {
      name: fieldName,
      role: roleFromFieldName(fieldName),
      source: "metadata",
    });
  });

  (layer.metadata?.datasetContext?.schemaSummary ?? []).forEach((fieldName) => {
    addFieldDescriptor(descriptors, {
      name: fieldName,
      role: roleFromFieldName(fieldName),
      source: "metadata",
    });
  });

  collectFeatureScanFields(layer).forEach((descriptor) => addFieldDescriptor(descriptors, descriptor));

  const allFields = [...descriptors.values()].sort((left, right) => left.name.localeCompare(right.name));
  const fields = allFields.slice(0, MAX_FIELD_SUMMARY_FIELDS);
  const temporalFields = uniqueStrings(
    allFields
      .filter((field) => field.role === "temporal")
      .map((field) => field.name),
    MAX_FIELD_SUMMARY_FIELDS,
  );

  return {
    layerId: layer.id,
    fieldCount: allFields.length,
    fields,
    temporalFields,
    truncated: allFields.length > fields.length,
  };
}

function findAoiFeature(
  drawnFeatures: readonly DrawnFeature[] | undefined,
  contextSummary: MapExplorerContextSummary,
  activeAoiId: string | undefined,
): DrawnFeature | null {
  const aoiId = contextSummary.activeAoi?.aoiId ?? activeAoiId;
  if (!aoiId || !drawnFeatures) return null;
  return drawnFeatures.find((feature) => feature.id === aoiId) ?? null;
}

function buildAoiReference(input: BuildMapToUrbanContextPayloadInput): MapToUrbanAoiPayloadReference {
  const activeAoi = input.contextSummary.activeAoi;
  const feature = findAoiFeature(input.drawnFeatures, input.contextSummary, input.activeAoiId);
  if (activeAoi) {
    const validation = feature?.properties.validation;
    return {
      aoiId: activeAoi.aoiId,
      label: feature?.properties.label ?? activeAoi.aoiId,
      geometryFamily: activeAoi.geometryFamily,
      bbox: activeAoi.bbox ?? null,
      source: "active-aoi",
      validationStatus: validation?.status ?? null,
      validationIssueCodes: [...(validation?.issueCodes ?? [])],
      caveats: clipList(validation?.caveats),
    };
  }

  if (input.contextSummary.currentBounds) {
    return {
      aoiId: null,
      label: "Current map view",
      geometryFamily: null,
      bbox: input.contextSummary.currentBounds,
      source: "map-view",
      validationStatus: null,
      validationIssueCodes: [],
      caveats: ["Current map bounds are a view extent reference only; draw or select an AOI for method-specific study-area evidence."],
    };
  }

  return {
    aoiId: null,
    label: null,
    geometryFamily: null,
    bbox: null,
    source: "none",
    validationStatus: null,
    validationIssueCodes: [],
    caveats: [],
  };
}

function buildLayerSummary(
  layer: OverlayLayerConfig,
  input: BuildMapToUrbanContextPayloadInput,
): MapToUrbanLayerPayloadSummary {
  const registry = normalizeLayerRegistryMetadata(layer);
  const scientificQA = layer.metadata?.scientificQA;
  const analysisResult = layer.metadata?.analysisResult;
  const manifestId = layer.metadata?.reproducibilityManifest?.manifestId
    ?? analysisResult?.reproducibilityManifest?.manifestId
    ?? null;
  const workflowId = analysisResult?.algorithmWorkflowId
    ?? analysisResult?.reproducibilityManifest?.workflowId
    ?? null;

  const qa = {
    status: registry.qaStatus,
    issueIds: [...(scientificQA?.issueIds ?? [])],
    badges: [...(scientificQA?.badges ?? [])],
    featureIssueCount: scientificQA?.featureIssueCount ?? 0,
    caveats: clipList(scientificQA?.caveats),
    ...(scientificQA?.categorySummaries ? { categorySummaries: scientificQA.categorySummaries } : {}),
  };

  return {
    layerId: layer.id,
    name: layer.name,
    registry: summarizeOverlayLayer(layer),
    selectedFeatureCount: input.selectedFeatureIds?.[layer.id]?.length ?? 0,
    activeAnalysisResult: input.contextSummary.activeAnalysisResultLayerIds.includes(layer.id),
    fieldSummary: buildLayerFieldSummary(layer),
    crs: {
      crs: registry.crsSummary.crs,
      status: registry.crsSummary.status,
      source: registry.crsSummary.source,
      notes: clipList(registry.crsSummary.notes),
    },
    qa,
    readiness: {
      status: registry.publicationReadiness.status,
      missingFields: [...registry.readiness.missingFields],
      blockingIssueIds: [...registry.readiness.blockingIssueIds],
      caveats: clipList(registry.readiness.caveats),
    },
    workflow: {
      runId: analysisResult?.runId ?? null,
      sourceRunId: analysisResult?.sourceRunId ?? null,
      workflowId,
      evidenceArtifactId: analysisResult?.evidenceArtifactId ?? registry.evidenceArtifactId ?? null,
      reproducibilityManifestId: manifestId,
    },
  };
}

function buildCrsSummary(layers: readonly MapToUrbanLayerPayloadSummary[]): MapToUrbanContextCrsSummary {
  const byLayer = layers.map((layer) => ({
    layerId: layer.layerId,
    crs: layer.crs.crs,
    status: layer.crs.status,
    source: layer.crs.source,
  }));
  const distinct = uniqueStrings(byLayer.map((entry) => entry.crs)).sort((left, right) => left.localeCompare(right));
  return {
    distinct,
    missingLayerIds: byLayer.filter((entry) => entry.status !== "known").map((entry) => entry.layerId),
    mixedCrs: distinct.length > 1,
    byLayer,
  };
}

function buildQaSummary(
  contextSummary: MapExplorerContextSummary,
  scientificQA: MapScientificQAState | null | undefined,
): MapToUrbanContextQaSummary {
  const blockingIssueIds = scientificQA?.issues
    .filter((issue) => issue.severity === "blocker" || issue.severity === "error")
    .map((issue) => issue.id) ?? [];
  const warningIssueIds = scientificQA?.issues
    .filter((issue) => issue.severity === "warning")
    .map((issue) => issue.id) ?? [];

  return {
    status: contextSummary.qa.status,
    checkedAt: contextSummary.qa.checkedAt,
    layerCount: contextSummary.qa.layerCount,
    blockedLayerCount: contextSummary.qa.blockedLayerCount,
    issueCounts: { ...contextSummary.qa.issueCounts },
    blockingIssueIds: uniqueStrings(blockingIssueIds, 48),
    warningIssueIds: uniqueStrings(warningIssueIds, 48),
  };
}

function isEvidenceRelevant(
  artifact: MapEvidenceArtifact,
  layerIds: Set<string>,
  activeAoiId: string | null,
  runIds: Set<string>,
): boolean {
  if (activeAoiId && artifact.linkedAoiId === activeAoiId) return true;
  if (artifact.linkedRunId && runIds.has(artifact.linkedRunId)) return true;
  if (artifact.linkedWorkflowId && runIds.has(artifact.linkedWorkflowId)) return true;
  return [
    ...artifact.linkedLayerIds,
    ...artifact.sourceLayerIds,
    artifact.derivedLayerId,
  ].some((layerId) => layerId != null && layerIds.has(layerId));
}

function buildEvidenceSummaries(
  artifacts: readonly MapEvidenceArtifact[] | undefined,
  layerSummaries: readonly MapToUrbanLayerPayloadSummary[],
  activeAoiId: string | null,
  runIds: readonly string[],
): MapToUrbanEvidenceSummary[] {
  const layerIds = new Set(layerSummaries.map((layer) => layer.layerId));
  const runIdSet = new Set(runIds);
  return (artifacts ?? [])
    .filter((artifact) => isEvidenceRelevant(artifact, layerIds, activeAoiId, runIdSet))
    .slice(0, MAX_EVIDENCE_SUMMARIES)
    .map((artifact) => ({
      artifactId: artifact.artifactId,
      kind: artifact.kind,
      title: artifact.title,
      state: artifact.state,
      sourceModule: artifact.sourceModule,
      linkedLayerIds: [...artifact.linkedLayerIds],
      sourceLayerIds: [...artifact.sourceLayerIds],
      linkedAoiId: artifact.linkedAoiId ?? null,
      linkedRunId: artifact.linkedRunId ?? null,
      linkedWorkflowId: artifact.linkedWorkflowId ?? null,
      derivedLayerId: artifact.derivedLayerId ?? null,
      qaState: artifact.qa.state,
      qaIssueCount: artifact.qa.issueCount,
      qaBlockerCount: artifact.qa.blockerCount,
      updatedAt: artifact.updatedAt,
    }));
}

function buildWorkflowSummary(
  layerSummaries: readonly MapToUrbanLayerPayloadSummary[],
  input: BuildMapToUrbanContextPayloadInput,
): MapToUrbanWorkflowSummary {
  const layerRunIds = uniqueStrings(layerSummaries.flatMap((layer) => [
    layer.workflow.runId,
    layer.workflow.sourceRunId,
  ]));
  return {
    activeWorkflowId: input.activeWorkflowId ?? null,
    activeAnalysisResultLayerIds: [...input.contextSummary.activeAnalysisResultLayerIds],
    activeRunIds: uniqueStrings([...(input.completedRunIds ?? []), ...layerRunIds], 24),
    layerRunIds,
    manifestIds: uniqueStrings(layerSummaries.map((layer) => layer.workflow.reproducibilityManifestId), 24),
  };
}

export function assessMapToUrbanContextReadiness(payload: Omit<MapToUrbanContextPayload, "disabledReasons">): MapToUrbanContextReadiness {
  const requestedLayer = payload.requestedLayerId
    ? payload.layerSummaries.find((layer) => layer.layerId === payload.requestedLayerId) ?? null
    : null;
  const usableLayerIds = payload.layerSummaries
    .filter((layer) => (payload.requestedLayerId ? layer.layerId === payload.requestedLayerId : layer.registry.visible))
    .filter((layer) => layer.registry.queryable && layer.crs.status === "known")
    .map((layer) => layer.layerId);

  const hasAoiReference = payload.aoiReference.aoiId !== null || payload.aoiReference.bbox !== null;
  const hasResultReference = payload.workflowSummary.activeAnalysisResultLayerIds.length > 0
    || payload.workflowSummary.activeRunIds.length > 0;
  const hasEvidenceReference = payload.evidenceSummaries.length > 0;
  const canSend = requestedLayer !== null
    ? usableLayerIds.length > 0
    : usableLayerIds.length > 0 || hasAoiReference || hasResultReference || hasEvidenceReference;

  if (canSend) {
    return { canSend: true, disabledReasons: [], usableLayerIds };
  }

  const disabledReasons: string[] = [];
  if (payload.requestedLayerId && !requestedLayer) {
    disabledReasons.push("Selected layer is no longer available in the map layer registry.");
  }
  if (payload.layerSummaries.length === 0 && !hasAoiReference && !hasEvidenceReference && !hasResultReference) {
    disabledReasons.push("Add or reveal a spatial layer, draw an AOI, or run an analysis before sending context to Urban Analytics.");
  }
  if (payload.layerSummaries.length > 0 && usableLayerIds.length === 0) {
    disabledReasons.push("At least one target layer must be queryable and carry declared CRS metadata before Urban Analytics handoff.");
  }
  if (payload.qaSummary.blockingIssueIds.length > 0) {
    disabledReasons.push("Resolve or acknowledge blocking map QA issues before using this context as Urban evidence.");
  }

  return {
    canSend: false,
    disabledReasons: uniqueStrings(disabledReasons, 6),
    usableLayerIds,
  };
}

export function buildMapToUrbanContextPayload(input: BuildMapToUrbanContextPayloadInput): MapToUrbanContextPayload {
  const createdAt = input.now ?? new Date().toISOString();
  const requestedLayerId = input.requestedLayerId ?? null;
  const layerSummaries = input.overlayLayers.map((layer) => buildLayerSummary(layer, input));
  const workflowSummary = buildWorkflowSummary(layerSummaries, input);
  const aoiReference = buildAoiReference(input);
  const evidenceSummaries = buildEvidenceSummaries(
    input.mapEvidenceArtifacts,
    layerSummaries,
    aoiReference.aoiId,
    workflowSummary.activeRunIds,
  );

  const payloadBase: Omit<MapToUrbanContextPayload, "disabledReasons"> = {
    version: MAP_TO_URBAN_CONTEXT_PAYLOAD_VERSION,
    payloadId: `map-urban:${input.contextSummary.contextId}:${requestedLayerId ?? "context"}:${createdAt}`,
    sourceModule: "map-explorer",
    destinationModule: "urban-analytics",
    destinationIntent: ["urban-evidence-tray", "method-recommendations"] satisfies MapToUrbanContextDestinationIntent[],
    createdAt,
    requestedLayerId,
    context: input.contextSummary,
    aoiReference,
    layerSummaries,
    visibleLayerIds: [...input.contextSummary.visibleLayerIds],
    queryableLayerIds: layerSummaries.filter((layer) => layer.registry.queryable).map((layer) => layer.layerId),
    selectedFeatureCounts: input.contextSummary.selection.layerCounts.map((entry) => ({ ...entry })),
    fieldSummaries: layerSummaries.map((layer) => layer.fieldSummary),
    crsSummary: buildCrsSummary(layerSummaries),
    qaSummary: buildQaSummary(input.contextSummary, input.scientificQA),
    evidenceSummaries,
    workflowSummary,
  };

  const readiness = assessMapToUrbanContextReadiness(payloadBase);
  return {
    ...payloadBase,
    disabledReasons: readiness.disabledReasons,
  };
}

export function publishMapToUrbanContextPayload(payload: MapToUrbanContextPayload): boolean {
  if (typeof globalThis.dispatchEvent !== "function" || typeof globalThis.CustomEvent !== "function") {
    return false;
  }
  return globalThis.dispatchEvent(new CustomEvent(MAP_TO_URBAN_CONTEXT_EVENT, { detail: payload }));
}

export function sendMapContextToUrban(input: SendMapToUrbanContextInput): SendMapToUrbanContextResult {
  const payload = buildMapToUrbanContextPayload(input);
  const readiness = assessMapToUrbanContextReadiness(payload);

  if (!readiness.canSend) {
    return {
      status: "blocked",
      payload,
      disabledReasons: readiness.disabledReasons,
      eventDispatched: false,
      urbanContextId: null,
      evidenceArtifactId: null,
      recommendationTriggered: false,
      recommendationReason: null,
    };
  }

  const receiverResult = input.receiver?.(payload) ?? null;
  const eventDispatched = input.dispatchEvent === false ? false : publishMapToUrbanContextPayload(payload);

  return {
    status: "sent",
    payload,
    disabledReasons: [],
    eventDispatched,
    urbanContextId: receiverResult?.contextId ?? null,
    evidenceArtifactId: receiverResult?.evidenceArtifactId ?? null,
    recommendationTriggered: receiverResult?.recommendationTriggered ?? false,
    recommendationReason: receiverResult?.recommendationReason ?? null,
  };
}

function isUrbanToMapMethodRequest(value: unknown): value is UrbanToMapMethodRequest {
  return typeof value === "object"
    && value !== null
    && "requestId" in value
    && "methodId" in value
    && "sourceModule" in value
    && "requestedActions" in value;
}

export function buildUrbanToMapMethodRequestPayload(
  request: UrbanToMapMethodRequest,
  now = new Date().toISOString(),
): UrbanToMapMethodRequestPayload {
  return {
    ...request,
    version: URBAN_TO_MAP_METHOD_REQUEST_VERSION,
    createdAt: request.createdAt ?? now,
    destinationModule: "map-explorer",
  };
}

function unique(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeAction(action: UrbanToMapMethodRequestActionInput): UrbanToMapMethodRequestAction {
  if (typeof action === "string") {
    return { type: action };
  }
  return action;
}

function hasAction(actions: ReadonlyArray<UrbanToMapMethodRequestAction>, type: UrbanToMapMethodRequestActionType): boolean {
  return actions.some((action) => action.type === type);
}

function actionLabel(type: UrbanToMapMethodRequestActionType): string {
  switch (type) {
    case "focus-compatible-layers":
      return "Focus compatible layers";
    case "validate-aoi":
      return "Validate AOI";
    case "preview-map-workflow":
      return "Preview map workflow";
    case "publish-derived-layer":
      return "Preview derived layer";
    case "prepare-report-ready-snapshot":
      return "Prepare report snapshot";
  }
}

function normalizeGeometryType(value: string | undefined | null): UrbanToMapGeometryRequirement {
  const lower = (value ?? "").toLowerCase();
  if (lower.includes("point")) return "point";
  if (lower.includes("line")) return "line";
  if (lower.includes("polygon")) return "polygon";
  if (lower.includes("mixed") || lower.includes("collection")) return "mixed";
  return "unknown";
}

function getLayerGeometryFamilies(layer: OverlayLayerConfig): UrbanToMapGeometryRequirement[] {
  const geometryTypes = unique([
    ...(layer.metadata?.geometrySummary?.geometryTypes ?? []),
    ...(layer.metadata?.columnar?.geometryTypes ?? []),
    layer.metadata?.geometrySummary?.geometryType ?? "",
    layer.metadata?.geometryType ?? "",
    layer.metadata?.registry?.geometrySummary.geometryType ?? "",
  ]);
  const families = unique(geometryTypes.map(normalizeGeometryType));
  return families.length > 0 ? families : ["unknown"];
}

function getLayerFieldNames(layer: OverlayLayerConfig): string[] {
  return unique([
    ...(layer.metadata?.fields ?? []),
    ...(layer.metadata?.schemaSummary?.fields.map((field) => field.name) ?? []),
    ...(layer.metadata?.registry?.schemaSummary.fields.map((field) => field.name) ?? []),
    ...(layer.metadata?.datasetContext?.schemaSummary ?? []),
  ]);
}

function getLayerFieldsByRole(layer: OverlayLayerConfig, role: LayerSchemaFieldRole): string[] {
  return unique([
    ...(layer.metadata?.schemaSummary?.fields.filter((field) => field.role === role).map((field) => field.name) ?? []),
    ...(layer.metadata?.registry?.schemaSummary.fields.filter((field) => field.role === role).map((field) => field.name) ?? []),
  ]);
}

function fieldMatches(requiredField: string, availableFields: ReadonlyArray<string>): boolean {
  const required = requiredField.trim().toLowerCase();
  return availableFields.some((field) => field.trim().toLowerCase() === required);
}

function getLayerCrs(layer: OverlayLayerConfig): string | null {
  return layer.metadata?.crsSummary?.crs
    ?? layer.metadata?.registry?.crsSummary.crs
    ?? layer.metadata?.datasetContext?.crs
    ?? layer.metadata?.columnar?.crs
    ?? layer.metadata?.externalService?.crs
    ?? null;
}

function getLayerFeatureCount(layer: OverlayLayerConfig): number | null {
  return layer.metadata?.registry?.geometrySummary.featureCount
    ?? layer.metadata?.geometrySummary?.featureCount
    ?? layer.metadata?.featureCount
    ?? layer.metadata?.columnar?.rowCount
    ?? layer.metadata?.importSource?.importedFeatureCount
    ?? null;
}

function layerMatchesTarget(
  layer: OverlayLayerConfig,
  requirements: UrbanToMapLayerRequirements | undefined,
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
): boolean {
  const targetLayerIds = unique([
    ...(requirements?.targetLayerIds ?? []),
    ...actions.flatMap((action) => action.targetLayerIds ?? []),
  ]);
  return targetLayerIds.length === 0 || targetLayerIds.includes(layer.id);
}

function getTargetLayerIds(
  requirements: UrbanToMapLayerRequirements | undefined,
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
): string[] {
  return unique([
    ...(requirements?.targetLayerIds ?? []),
    ...actions.flatMap((action) => action.targetLayerIds ?? []),
  ]);
}

function evaluateLayerCompatibility(
  layer: OverlayLayerConfig,
  requirements: UrbanToMapLayerRequirements | undefined,
): UrbanToMapLayerCompatibility {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const geometryFamilies = getLayerGeometryFamilies(layer);
  const requiredGeometry = requirements?.geometryTypes?.filter((geometry) => geometry !== "unknown") ?? [];
  if (requiredGeometry.length > 0 && !geometryFamilies.some((geometry) => requiredGeometry.includes(geometry))) {
    reasons.push(`Method requires ${requiredGeometry.join(" or ")} geometry; layer provides ${geometryFamilies.join(" or ")}.`);
  }

  const availableFields = getLayerFieldNames(layer);
  const requiredFields = requirements?.requiredFields ?? [];
  const optionalFields = requirements?.optionalFields ?? [];
  const matchedRequiredFields = requiredFields.filter((field) => fieldMatches(field, availableFields));
  const missingRequiredFields = requiredFields.filter((field) => !fieldMatches(field, availableFields));
  if (missingRequiredFields.length > 0) {
    reasons.push(`Missing required fields: ${missingRequiredFields.join(", ")}.`);
  }
  const matchedOptionalFields = optionalFields.filter((field) => fieldMatches(field, availableFields));
  const temporalFields = getLayerFieldsByRole(layer, "temporal");
  if (requirements?.temporal === "required" && temporalFields.length === 0) {
    reasons.push("Temporal field metadata is required but absent.");
  }
  if (requirements?.temporal === "optional" && temporalFields.length === 0) {
    warnings.push("No temporal field metadata is available for optional temporal filtering.");
  }

  const featureCount = getLayerFeatureCount(layer);
  if (requirements?.minFeatureCount != null && (featureCount == null || featureCount < requirements.minFeatureCount)) {
    reasons.push(`Layer needs at least ${requirements.minFeatureCount} features.`);
  }
  if (requirements?.requireVisible && !layer.visible) {
    warnings.push("Layer is currently hidden; reveal it before map inspection.");
  }
  const queryable = layer.queryable ?? layer.type === "geojson";
  if (requirements?.requireQueryable && !queryable) {
    reasons.push("Layer must be queryable for the requested method.");
  }
  const crs = getLayerCrs(layer);
  if (requirements?.requiredCrs) {
    if (!crs) {
      reasons.push(`Required CRS ${requirements.requiredCrs} is missing from layer metadata.`);
    } else if (crs.trim().toLowerCase() !== requirements.requiredCrs.trim().toLowerCase()) {
      reasons.push(`Layer CRS ${crs} does not match required CRS ${requirements.requiredCrs}.`);
    }
  }

  const status: UrbanToMapPreviewStatus = reasons.length > 0 ? "blocked" : warnings.length > 0 ? "needs-review" : "ready";
  return {
    layerId: layer.id,
    name: layer.name,
    status,
    visible: layer.visible,
    queryable,
    geometryFamilies,
    requiredFields,
    matchedRequiredFields,
    missingRequiredFields,
    optionalFields,
    matchedOptionalFields,
    temporalFields,
    featureCount,
    crs,
    qaStatus: layer.qaStatus ?? layer.metadata?.registry?.qaStatus ?? null,
    reasons,
    warnings,
    ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
  };
}

function buildAoiPreview(request: UrbanToMapMethodRequest, contextSummary: MapExplorerContextSummary): UrbanToMapAoiPreview {
  const activeAoiId = contextSummary.activeAoi?.aoiId ?? null;
  const required = request.requirements?.aoi?.required === true || hasRequestedAoiAction(request);
  const missingPrerequisites: string[] = [];
  const warnings: string[] = [];
  const preferredAoiId = request.requirements?.aoi?.preferredAoiId ?? null;

  if (required && !activeAoiId) {
    missingPrerequisites.push("No active AOI is selected. Draw or select an AOI before applying this Urban method request.");
  }
  if (preferredAoiId && activeAoiId && preferredAoiId !== activeAoiId) {
    warnings.push(`Active AOI ${activeAoiId} differs from requested AOI ${preferredAoiId}.`);
  }

  const geometryFamily = contextSummary.activeAoi?.geometryFamily ?? null;
  const requiredGeometry = request.requirements?.aoi?.geometryTypes?.filter((geometry) => geometry !== "unknown") ?? [];
  if (geometryFamily && requiredGeometry.length > 0) {
    const normalized = normalizeGeometryType(geometryFamily);
    if (!requiredGeometry.includes(normalized)) {
      missingPrerequisites.push(`AOI geometry must be ${requiredGeometry.join(" or ")}.`);
    }
  }

  const status: UrbanToMapPreviewStatus = missingPrerequisites.length > 0 ? "needs-review" : warnings.length > 0 ? "needs-review" : "ready";
  return {
    status,
    activeAoiId,
    preferredAoiId,
    geometryFamily,
    missingPrerequisites,
    warnings,
  };
}

function hasRequestedAoiAction(request: UrbanToMapMethodRequest): boolean {
  return request.requestedActions.map(normalizeAction).some((action) => action.type === "validate-aoi");
}

function collectQaBlockers(
  scientificQA: MapScientificQAState | null | undefined,
  targetLayerIds: ReadonlyArray<string>,
): UrbanToMapQABlockerSummary[] {
  if (!scientificQA) return [];
  const targetSet = new Set(targetLayerIds);
  return scientificQA.issues
    .filter((issue) => issue.severity === "error" || issue.severity === "blocker")
    .filter((issue) => targetSet.size === 0 || !issue.layerId || targetSet.has(issue.layerId))
    .map((issue) => ({
      issueId: issue.id,
      severity: issue.severity,
      title: issue.title,
      layerId: issue.layerId ?? null,
      category: issue.category,
    }));
}

function inferWorkflowKind(
  request: UrbanToMapMethodRequest,
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
): MapWorkflowKind | null {
  const explicitKind = actions.find((action) => action.workflowKind)?.workflowKind ?? request.requirements?.workflow?.kind;
  if (explicitKind) return explicitKind;
  const tokens = [request.methodId, request.workflowId ?? "", request.outputIntent ?? ""].join(" ").toLowerCase();
  if (tokens.includes("buffer") || tokens.includes("isochrone")) return "buffer";
  if (tokens.includes("intersect") || tokens.includes("overlap")) return "intersect";
  if (tokens.includes("difference")) return "difference";
  if (tokens.includes("union")) return "union";
  if (tokens.includes("compare") || tokens.includes("comparison")) return "comparison";
  if (tokens.includes("aoi") || hasAction(actions, "validate-aoi")) return "aoi";
  if (hasAction(actions, "preview-map-workflow") || hasAction(actions, "publish-derived-layer")) return "aoi";
  return null;
}

function getWorkflowLayerIds(
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  request: UrbanToMapMethodRequest,
): string[] {
  const explicit = unique([
    request.requirements?.workflow?.sourceLayerId ?? "",
    request.requirements?.workflow?.comparisonLayerId ?? "",
    ...(request.requirements?.layer?.targetLayerIds ?? []),
  ]);
  if (explicit.length > 0) return explicit;
  return compatibleLayers
    .filter((layer) => layer.status !== "blocked")
    .map((layer) => layer.layerId);
}

function polygonLayerIds(
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  workflowContext: MapWorkflowContext,
): string[] {
  const compatibleSet = new Set(compatibleLayers.filter((layer) => layer.status !== "blocked").map((layer) => layer.layerId));
  return workflowContext.layers
    .filter((layer) => compatibleSet.size === 0 || compatibleSet.has(layer.id))
    .filter((layer) => layer.geometryClass === "polygon" || layer.geometryClass === "mixed")
    .map((layer) => layer.id);
}

function buildWorkflowDraft(
  kind: MapWorkflowKind,
  request: UrbanToMapMethodRequest,
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  workflowContext: MapWorkflowContext,
): MapWorkflowDraft {
  const outputName = request.requirements?.workflow?.outputLayerName ?? `${request.methodLabel ?? request.methodId} preview`;
  const layerIds = getWorkflowLayerIds(compatibleLayers, request);
  const polygonIds = polygonLayerIds(compatibleLayers, workflowContext);
  const sourceLayerId = request.requirements?.workflow?.sourceLayerId ?? layerIds[0] ?? null;
  const comparisonLayerId = request.requirements?.workflow?.comparisonLayerId ?? layerIds.find((id) => id !== sourceLayerId) ?? null;

  switch (kind) {
    case "aoi": {
      const base = createDefaultDraft("aoi") as MapWorkflowAOIDraft;
      const source = workflowContext.drawnPolygons.length > 0
        ? "drawn-polygon"
        : workflowContext.selectedFeatures.length > 0
          ? "selected-features"
          : "viewport";
      return {
        ...base,
        source,
        name: outputName,
      };
    }
    case "buffer": {
      const base = createDefaultDraft("buffer") as MapWorkflowBufferDraft;
      return {
        ...base,
        sourceMode: workflowContext.selectedFeatures.length > 0 ? "selected-features" : "layer",
        sourceLayerId,
        distance: request.requirements?.workflow?.distanceMeters ?? base.distance,
        unit: "meters",
        name: outputName,
      };
    }
    case "intersect": {
      const base = createDefaultDraft("intersect") as MapWorkflowIntersectDraft;
      return {
        ...base,
        layerAId: sourceLayerId ?? polygonIds[0] ?? null,
        layerBId: comparisonLayerId ?? polygonIds.find((id) => id !== sourceLayerId) ?? null,
        name: outputName,
      };
    }
    case "difference": {
      const base = createDefaultDraft("difference") as MapWorkflowDifferenceDraft;
      return {
        ...base,
        minuendLayerId: sourceLayerId ?? polygonIds[0] ?? null,
        subtrahendLayerId: comparisonLayerId ?? polygonIds.find((id) => id !== sourceLayerId) ?? null,
        name: outputName,
      };
    }
    case "union": {
      const base = createDefaultDraft("union") as MapWorkflowUnionDraft;
      return {
        ...base,
        layerAId: sourceLayerId ?? polygonIds[0] ?? null,
        layerBId: comparisonLayerId ?? polygonIds.find((id) => id !== sourceLayerId) ?? null,
        name: outputName,
      };
    }
    case "comparison": {
      const base = createDefaultDraft("comparison") as MapWorkflowComparisonDraft;
      return {
        ...base,
        layerAId: sourceLayerId ?? layerIds[0] ?? null,
        layerBId: comparisonLayerId ?? layerIds.find((id) => id !== sourceLayerId) ?? null,
        name: outputName,
      };
    }
  }
}

function summarizeWorkflowPreview(preview: MapWorkflowPreview): UrbanToMapWorkflowPreviewSummary {
  const blockerCount = preview.issues.filter((issue) => issue.severity === "blocker").length;
  const warningCount = preview.issues.filter((issue) => issue.severity === "warning").length;
  return {
    workflow: preview.workflow,
    canApply: preview.canApply,
    needsWorker: preview.needsWorker,
    featureCount: preview.featureCount,
    geometryClass: preview.geometryClass,
    nextRequiredStep: preview.nextRequiredStep,
    issueCount: preview.issues.length,
    blockerCount,
    warningCount,
    sourceLayerIds: preview.manifest.sourceLayerIds,
    metrics: preview.metrics,
    outputLayerName: preview.expectedOutput.layerName,
  };
}

function buildWorkflowPreview(
  request: UrbanToMapMethodRequest,
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  workflowContext: MapWorkflowContext,
): { summary: UrbanToMapWorkflowPreviewSummary | null; draftRequest: UrbanToMapWorkflowDraftRequest | null } {
  const kind = inferWorkflowKind(request, actions);
  if (!kind) {
    return { summary: null, draftRequest: null };
  }
  const workflowContextWithMethodCrs: MapWorkflowContext = request.requirements?.layer?.requiredCrs
    ? { ...workflowContext, urbanRequiredCrs: request.requirements.layer.requiredCrs }
    : workflowContext;
  const draft = buildWorkflowDraft(kind, request, compatibleLayers, workflowContextWithMethodCrs);
  const preview = generateMapWorkflowPreview(draft, workflowContextWithMethodCrs);
  return {
    summary: summarizeWorkflowPreview(preview),
    draftRequest: {
      requestId: request.requestId,
      kind,
      draft,
    },
  };
}

function buildReportSnapshotPreview(
  request: UrbanToMapMethodRequest,
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  overlayLayers: ReadonlyArray<OverlayLayerConfig>,
  qaBlockers: ReadonlyArray<UrbanToMapQABlockerSummary>,
): UrbanToMapReportSnapshotPreview | null {
  if (!hasAction(actions, "prepare-report-ready-snapshot") && request.outputIntent !== "report" && !request.reportIntent) {
    return null;
  }
  const requestedLayerIds = getTargetLayerIds(request.requirements?.layer, actions);
  const compatibleLayerIds = compatibleLayers.filter((layer) => layer.status !== "blocked").map((layer) => layer.layerId);
  const targetLayerIds = requestedLayerIds.length > 0 ? requestedLayerIds : compatibleLayerIds;
  const visibleLayerCount = overlayLayers.filter((layer) => layer.visible).length;
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (visibleLayerCount === 0) {
    blockers.push("No visible map layers are available for a report snapshot.");
  }
  if (targetLayerIds.length === 0 && requestedLayerIds.length > 0) {
    blockers.push("Requested report layer references are not compatible with the current map context.");
  }
  if (qaBlockers.length > 0) {
    warnings.push("Scientific QA blockers will be carried into the report preview and must be resolved before formal publication.");
  }

  const scope = actions.find((action) => action.type === "prepare-report-ready-snapshot")?.reportScope ?? (targetLayerIds.length === 1 ? "layer" : "map-view");
  const status: UrbanToMapPreviewStatus = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "needs-review" : "ready";
  return {
    status,
    scope,
    targetLayerIds,
    visibleLayerCount,
    blockers,
    warnings,
  };
}

function buildActionPreviews(
  actions: ReadonlyArray<UrbanToMapMethodRequestAction>,
  compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>,
  aoiPreview: UrbanToMapAoiPreview,
  workflowPreview: UrbanToMapWorkflowPreviewSummary | null,
  reportSnapshotPreview: UrbanToMapReportSnapshotPreview | null,
  qaBlockers: ReadonlyArray<UrbanToMapQABlockerSummary>,
): UrbanToMapActionPreview[] {
  const compatibleLayerIds = compatibleLayers.filter((layer) => layer.status !== "blocked").map((layer) => layer.layerId);
  return actions.map((action) => {
    const missingPrerequisites: string[] = [];
    const warnings: string[] = [];
    if (action.type === "focus-compatible-layers" && compatibleLayerIds.length === 0) {
      missingPrerequisites.push("No compatible map layer matches the Urban method requirements.");
    }
    if (action.type === "validate-aoi") {
      missingPrerequisites.push(...aoiPreview.missingPrerequisites);
      warnings.push(...aoiPreview.warnings);
    }
    if ((action.type === "preview-map-workflow" || action.type === "publish-derived-layer") && workflowPreview) {
      if (!workflowPreview.canApply) {
        missingPrerequisites.push(`Workflow preview is not ready: ${workflowPreview.nextRequiredStep ?? "resolve blockers"}.`);
      }
      if (workflowPreview.warningCount > 0) {
        warnings.push(`${workflowPreview.warningCount} workflow warning${workflowPreview.warningCount === 1 ? "" : "s"} require review.`);
      }
    }
    if (action.type === "publish-derived-layer" && qaBlockers.length > 0) {
      missingPrerequisites.push("Scientific QA blockers must be resolved before publishing a derived map layer.");
    }
    if (action.type === "prepare-report-ready-snapshot" && reportSnapshotPreview) {
      missingPrerequisites.push(...reportSnapshotPreview.blockers);
      warnings.push(...reportSnapshotPreview.warnings);
    }
    const status: UrbanToMapPreviewStatus = missingPrerequisites.length > 0 ? "blocked" : warnings.length > 0 ? "needs-review" : "ready";
    return {
      type: action.type,
      label: action.label ?? actionLabel(action.type),
      status,
      targetLayerIds: action.targetLayerIds ?? compatibleLayerIds,
      missingPrerequisites,
      warnings,
    };
  });
}

function mergePreviewStatus(values: ReadonlyArray<UrbanToMapPreviewStatus>): UrbanToMapPreviewStatus {
  if (values.includes("blocked")) return "blocked";
  if (values.includes("needs-review")) return "needs-review";
  return "ready";
}

export function buildUrbanToMapMethodRequestPreview(
  input: BuildUrbanToMapMethodRequestPreviewInput,
): UrbanToMapMethodRequestPreview {
  const now = input.now ?? new Date().toISOString();
  const request = buildUrbanToMapMethodRequestPayload(input.request, now);
  const actions = request.requestedActions.length > 0
    ? request.requestedActions.map(normalizeAction)
    : [{ type: "focus-compatible-layers" } satisfies UrbanToMapMethodRequestAction];
  const layerRequirements = request.requirements?.layer;
  const candidateLayers = input.overlayLayers.filter((layer) => layerMatchesTarget(layer, layerRequirements, actions));
  const compatibleLayers = candidateLayers.map((layer) => evaluateLayerCompatibility(layer, layerRequirements));
  const targetLayerIds = getTargetLayerIds(layerRequirements, actions);
  const compatibleLayerIds = compatibleLayers.filter((layer) => layer.status !== "blocked").map((layer) => layer.layerId);
  const qaBlockers = collectQaBlockers(input.scientificQA, targetLayerIds.length > 0 ? targetLayerIds : compatibleLayerIds);
  const aoiPreview = buildAoiPreview(request, input.contextSummary);
  const workflow = buildWorkflowPreview(request, actions, compatibleLayers, input.workflowContext);
  const reportSnapshotPreview = buildReportSnapshotPreview(
    request,
    actions,
    compatibleLayers,
    input.overlayLayers,
    qaBlockers,
  );
  const requestedLayerAction = hasAction(actions, "focus-compatible-layers") || hasAction(actions, "preview-map-workflow") || hasAction(actions, "publish-derived-layer");
  const missingPrerequisites = unique([
    ...(request.methodValidity?.blockers ?? []),
    ...(requestedLayerAction && compatibleLayerIds.length === 0 ? ["No compatible map layer matches the Urban method requirements."] : []),
    ...compatibleLayers.flatMap((layer) => layer.reasons),
    ...aoiPreview.missingPrerequisites,
    ...(workflow.summary && !workflow.summary.canApply ? [`Workflow preview is not ready: ${workflow.summary.nextRequiredStep ?? "resolve blockers"}.`] : []),
    ...(reportSnapshotPreview?.blockers ?? []),
    ...(qaBlockers.length > 0 ? ["Scientific QA blockers are present in the requested map context."] : []),
  ]);
  const warnings = unique([
    ...(request.methodValidity?.warnings ?? []),
    ...(request.requirements?.recommendedScale ? [`Recommended method scale: ${request.requirements.recommendedScale}.`] : []),
    ...(request.requirements?.dataFitnessThreshold != null ? ["Urban data-fitness thresholds are evaluated in Urban Analytics; Map Explorer only previews map-side compatibility."] : []),
    ...compatibleLayers.flatMap((layer) => layer.warnings),
    ...aoiPreview.warnings,
    ...(workflow.summary && workflow.summary.warningCount > 0 ? [`Workflow preview includes ${workflow.summary.warningCount} warning${workflow.summary.warningCount === 1 ? "" : "s"}.`] : []),
    ...(reportSnapshotPreview?.warnings ?? []),
  ]);
  const actionPreviews = buildActionPreviews(actions, compatibleLayers, aoiPreview, workflow.summary, reportSnapshotPreview, qaBlockers);
  const status = mergePreviewStatus([
    ...actionPreviews.map((action) => action.status),
    aoiPreview.status,
    reportSnapshotPreview?.status ?? "ready",
    missingPrerequisites.length > 0 ? "blocked" : warnings.length > 0 ? "needs-review" : "ready",
  ]);

  return {
    version: URBAN_TO_MAP_METHOD_REQUEST_VERSION,
    previewId: `urban-map-preview-${request.requestId}`,
    requestId: request.requestId,
    createdAt: now,
    status,
    sourceModule: "map-explorer",
    destinationModule: "urban-analytics",
    methodId: request.methodId,
    methodLabel: request.methodLabel ?? request.methodId,
    requestedActions: actionPreviews,
    compatibleLayers,
    blockedLayerIds: compatibleLayers.filter((layer) => layer.status === "blocked").map((layer) => layer.layerId),
    missingPrerequisites,
    warnings,
    qaBlockers,
    aoiPreview,
    workflowPreview: workflow.summary,
    workflowDraftRequest: workflow.draftRequest,
    reportSnapshotPreview,
  };
}

export function extractUrbanToMapMethodRequestFromEvent(event: Event): UrbanToMapMethodRequestPayload | null {
  if (!("detail" in event)) return null;
  const detail = (event as CustomEvent<unknown>).detail;
  if (isUrbanToMapMethodRequest(detail)) return buildUrbanToMapMethodRequestPayload(detail);
  if (typeof detail === "object" && detail !== null && "request" in detail) {
    const request = (detail as { request?: unknown }).request;
    return isUrbanToMapMethodRequest(request) ? buildUrbanToMapMethodRequestPayload(request) : null;
  }
  return null;
}

export function publishUrbanToMapMethodRequest(request: UrbanToMapMethodRequest): boolean {
  const payload = buildUrbanToMapMethodRequestPayload(request);
  if (urbanToMapMethodRequestSubscriberCount === 0) {
    pendingUrbanToMapMethodRequest = payload;
  }
  if (typeof globalThis.dispatchEvent !== "function" || typeof globalThis.CustomEvent !== "function") {
    return false;
  }
  return globalThis.dispatchEvent(new CustomEvent<UrbanToMapMethodRequestEventDetail>(URBAN_TO_MAP_METHOD_REQUEST_EVENT, {
    detail: { request: payload },
  }));
}

export function subscribeUrbanToMapMethodRequests(
  handler: (request: UrbanToMapMethodRequestPayload) => void,
): () => void {
  urbanToMapMethodRequestSubscriberCount += 1;
  const listener = (event: Event) => {
    const request = extractUrbanToMapMethodRequestFromEvent(event);
    if (request) {
      handler(request);
    }
  };
  globalThis.addEventListener(URBAN_TO_MAP_METHOD_REQUEST_EVENT, listener);
  if (pendingUrbanToMapMethodRequest) {
    const pendingRequest = pendingUrbanToMapMethodRequest;
    pendingUrbanToMapMethodRequest = null;
    handler(pendingRequest);
  }
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    urbanToMapMethodRequestSubscriberCount = Math.max(0, urbanToMapMethodRequestSubscriberCount - 1);
    globalThis.removeEventListener(URBAN_TO_MAP_METHOD_REQUEST_EVENT, listener);
  };
}
