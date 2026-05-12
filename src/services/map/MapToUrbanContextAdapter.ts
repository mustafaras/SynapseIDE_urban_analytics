import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import type {
  DrawnFeature,
  LayerSchemaFieldRole,
  LayerScientificQACategorySummary,
  MapEvidenceArtifact,
  MapEvidenceArtifactKind,
  MapEvidenceArtifactState,
  MapEvidenceQAState,
  MapLayerRegistryLayerSummary,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import { summarizeOverlayLayer } from "@/centerpanel/components/map/mapContextSummary";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type { MapScientificQAState } from "./MapScientificQA";

export const MAP_TO_URBAN_CONTEXT_EVENT = "map:urban-sync:provided";
export const MAP_TO_URBAN_CONTEXT_PAYLOAD_VERSION = 1;

const MAX_FIELD_SCAN_FEATURES = 120;
const MAX_FIELD_SUMMARY_FIELDS = 48;
const MAX_EVIDENCE_SUMMARIES = 48;
const MAX_TEXT_LIST = 12;

export type MapToUrbanContextDestinationIntent = "urban-evidence-tray" | "method-recommendations";
export type MapToUrbanContextStatus = "sent" | "blocked";

export interface MapToUrbanAoiPayloadReference {
  aoiId: string | null;
  label: string | null;
  geometryFamily: NonNullable<MapExplorerContextSummary["activeAoi"]>["geometryFamily"] | null;
  bbox: [number, number, number, number] | null;
  source: "active-aoi" | "map-view" | "none";
  validationStatus: DrawnFeature["properties"]["validation"] extends infer Validation
    ? Validation extends { status: infer Status }
      ? Status | null
      : null
    : null;
  validationIssueCodes: string[];
  caveats: string[];
}

export interface MapToUrbanLayerFieldDescriptor {
  name: string;
  role: LayerSchemaFieldRole | "unknown";
  source: "schema" | "metadata" | "feature-scan";
  type?: string;
}

export interface MapToUrbanLayerFieldSummary {
  layerId: string;
  fieldCount: number;
  fields: MapToUrbanLayerFieldDescriptor[];
  temporalFields: string[];
  truncated: boolean;
}

export interface MapToUrbanLayerPayloadSummary {
  layerId: string;
  name: string;
  registry: MapLayerRegistryLayerSummary;
  selectedFeatureCount: number;
  activeAnalysisResult: boolean;
  fieldSummary: MapToUrbanLayerFieldSummary;
  crs: {
    crs: string | null;
    status: string;
    source: string;
    notes: string[];
  };
  qa: {
    status: string;
    issueIds: string[];
    badges: string[];
    featureIssueCount: number;
    caveats: string[];
    categorySummaries?: LayerScientificQACategorySummary[];
  };
  readiness: {
    status: string;
    missingFields: string[];
    blockingIssueIds: string[];
    caveats: string[];
  };
  workflow: {
    runId: string | null;
    sourceRunId: string | null;
    workflowId: string | null;
    evidenceArtifactId: string | null;
    reproducibilityManifestId: string | null;
  };
}

export interface MapToUrbanContextCrsSummary {
  distinct: string[];
  missingLayerIds: string[];
  mixedCrs: boolean;
  byLayer: Array<{
    layerId: string;
    crs: string | null;
    status: string;
    source: string;
  }>;
}

export interface MapToUrbanContextQaSummary {
  status: string;
  checkedAt: string | null;
  layerCount: number;
  blockedLayerCount: number;
  issueCounts: Record<string, number>;
  blockingIssueIds: string[];
  warningIssueIds: string[];
}

export interface MapToUrbanEvidenceSummary {
  artifactId: string;
  kind: MapEvidenceArtifactKind;
  title: string;
  state: MapEvidenceArtifactState;
  sourceModule: string;
  linkedLayerIds: string[];
  sourceLayerIds: string[];
  linkedAoiId: string | null;
  linkedRunId: string | null;
  linkedWorkflowId: string | null;
  derivedLayerId: string | null;
  qaState: MapEvidenceQAState;
  qaIssueCount: number;
  qaBlockerCount: number;
  updatedAt: string;
}

export interface MapToUrbanWorkflowSummary {
  activeWorkflowId: AnalyticalFlowId | string | null;
  activeAnalysisResultLayerIds: string[];
  activeRunIds: string[];
  layerRunIds: string[];
  manifestIds: string[];
}

export interface MapToUrbanContextPayload {
  version: typeof MAP_TO_URBAN_CONTEXT_PAYLOAD_VERSION;
  payloadId: string;
  sourceModule: "map-explorer";
  destinationModule: "urban-analytics";
  destinationIntent: MapToUrbanContextDestinationIntent[];
  createdAt: string;
  requestedLayerId: string | null;
  context: MapExplorerContextSummary;
  aoiReference: MapToUrbanAoiPayloadReference;
  layerSummaries: MapToUrbanLayerPayloadSummary[];
  visibleLayerIds: string[];
  queryableLayerIds: string[];
  selectedFeatureCounts: Array<{ layerId: string; count: number }>;
  fieldSummaries: MapToUrbanLayerFieldSummary[];
  crsSummary: MapToUrbanContextCrsSummary;
  qaSummary: MapToUrbanContextQaSummary;
  evidenceSummaries: MapToUrbanEvidenceSummary[];
  workflowSummary: MapToUrbanWorkflowSummary;
  disabledReasons: string[];
}

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
    destinationIntent: ["urban-evidence-tray", "method-recommendations"],
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