import type {
  LayerSchemaFieldRole,
  LayerSourceKind,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type { MapScientificQAIssue, MapScientificQAState } from "./MapScientificQA";
import {
  createDefaultDraft,
  generateMapWorkflowPreview,
  type MapWorkflowAOIDraft,
  type MapWorkflowBufferDraft,
  type MapWorkflowComparisonDraft,
  type MapWorkflowDifferenceDraft,
  type MapWorkflowDraft,
  type MapWorkflowIntersectDraft,
  type MapWorkflowKind,
  type MapWorkflowContext,
  type MapWorkflowPreview,
  type MapWorkflowUnionDraft,
} from "./MapWorkflowService";

export const URBAN_TO_MAP_METHOD_REQUEST_VERSION = 1;
export const URBAN_TO_MAP_METHOD_REQUEST_EVENT = "urban:map-method-request";

export type UrbanToMapGeometryRequirement = "point" | "line" | "polygon" | "mixed" | "unknown";
export type UrbanToMapTemporalRequirement = "required" | "optional" | "not-required";
export type UrbanToMapPreviewStatus = "ready" | "needs-review" | "blocked";

export type UrbanToMapMethodRequestActionType =
  | "focus-compatible-layers"
  | "validate-aoi"
  | "preview-map-workflow"
  | "publish-derived-layer"
  | "prepare-report-ready-snapshot";

export interface UrbanToMapMethodRequestAction {
  type: UrbanToMapMethodRequestActionType;
  label?: string;
  workflowKind?: MapWorkflowKind;
  targetLayerIds?: string[];
  reportScope?: "map-view" | "layer";
}

export type UrbanToMapMethodRequestActionInput =
  | UrbanToMapMethodRequestActionType
  | UrbanToMapMethodRequestAction;

export interface UrbanToMapLayerRequirements {
  targetLayerIds?: string[];
  geometryTypes?: UrbanToMapGeometryRequirement[];
  requiredFields?: string[];
  optionalFields?: string[];
  temporal?: UrbanToMapTemporalRequirement;
  minFeatureCount?: number;
  requireVisible?: boolean;
  requireQueryable?: boolean;
  requiredCrs?: string;
}

export interface UrbanToMapAoiRequirements {
  required?: boolean;
  preferredAoiId?: string;
  geometryTypes?: UrbanToMapGeometryRequirement[];
}

export interface UrbanToMapWorkflowRequirements {
  kind?: MapWorkflowKind;
  distanceMeters?: number;
  outputLayerName?: string;
  sourceLayerId?: string;
  comparisonLayerId?: string;
}

export interface UrbanToMapMethodRequirements {
  layer?: UrbanToMapLayerRequirements;
  aoi?: UrbanToMapAoiRequirements;
  workflow?: UrbanToMapWorkflowRequirements;
  recommendedScale?: string;
  dataFitnessThreshold?: number | null;
}

export interface UrbanToMapMethodRequest {
  version?: typeof URBAN_TO_MAP_METHOD_REQUEST_VERSION;
  requestId: string;
  createdAt?: string;
  sourceModule: "urban-analytics";
  destinationModule?: "map-explorer";
  methodId: string;
  methodLabel?: string;
  cardId?: string;
  workflowId?: string;
  selectedIndicatorKind?: string;
  outputIntent?: "inspect" | "derive-layer" | "report" | "dashboard" | "ide";
  reportIntent?: "snapshot" | "citation" | "method-appendix";
  dashboardIntent?: "layer-binding" | "metric-binding";
  requirements?: UrbanToMapMethodRequirements;
  requestedActions: UrbanToMapMethodRequestActionInput[];
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
  | UrbanToMapMethodRequest
  | { request: UrbanToMapMethodRequest };

function isUrbanToMapMethodRequest(value: unknown): value is UrbanToMapMethodRequest {
  return typeof value === "object"
    && value !== null
    && "requestId" in value
    && "methodId" in value
    && "sourceModule" in value
    && "requestedActions" in value;
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

function layerMatchesTarget(layer: OverlayLayerConfig, requirements: UrbanToMapLayerRequirements | undefined, actions: ReadonlyArray<UrbanToMapMethodRequestAction>): boolean {
  const targetLayerIds = unique([
    ...(requirements?.targetLayerIds ?? []),
    ...actions.flatMap((action) => action.targetLayerIds ?? []),
  ]);
  return targetLayerIds.length === 0 || targetLayerIds.includes(layer.id);
}

function getTargetLayerIds(requirements: UrbanToMapLayerRequirements | undefined, actions: ReadonlyArray<UrbanToMapMethodRequestAction>): string[] {
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
    reasons.push(`Geometry must be ${requiredGeometry.join(" or ")}.`);
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

function collectQaBlockers(scientificQA: MapScientificQAState | null | undefined, targetLayerIds: ReadonlyArray<string>): UrbanToMapQABlockerSummary[] {
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

function inferWorkflowKind(request: UrbanToMapMethodRequest, actions: ReadonlyArray<UrbanToMapMethodRequestAction>): MapWorkflowKind | null {
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

function getWorkflowLayerIds(compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>, request: UrbanToMapMethodRequest): string[] {
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

function polygonLayerIds(compatibleLayers: ReadonlyArray<UrbanToMapLayerCompatibility>, workflowContext: MapWorkflowContext): string[] {
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
  const actions = input.request.requestedActions.length > 0
    ? input.request.requestedActions.map(normalizeAction)
    : [{ type: "focus-compatible-layers" } satisfies UrbanToMapMethodRequestAction];
  const layerRequirements = input.request.requirements?.layer;
  const candidateLayers = input.overlayLayers.filter((layer) => layerMatchesTarget(layer, layerRequirements, actions));
  const compatibleLayers = candidateLayers.map((layer) => evaluateLayerCompatibility(layer, layerRequirements));
  const targetLayerIds = getTargetLayerIds(layerRequirements, actions);
  const compatibleLayerIds = compatibleLayers.filter((layer) => layer.status !== "blocked").map((layer) => layer.layerId);
  const qaBlockers = collectQaBlockers(input.scientificQA, targetLayerIds.length > 0 ? targetLayerIds : compatibleLayerIds);
  const aoiPreview = buildAoiPreview(input.request, input.contextSummary);
  const workflow = buildWorkflowPreview(input.request, actions, compatibleLayers, input.workflowContext);
  const reportSnapshotPreview = buildReportSnapshotPreview(
    input.request,
    actions,
    compatibleLayers,
    input.overlayLayers,
    qaBlockers,
  );
  const requestedLayerAction = hasAction(actions, "focus-compatible-layers") || hasAction(actions, "preview-map-workflow") || hasAction(actions, "publish-derived-layer");
  const missingPrerequisites = unique([
    ...(requestedLayerAction && compatibleLayerIds.length === 0 ? ["No compatible map layer matches the Urban method requirements."] : []),
    ...compatibleLayers.flatMap((layer) => layer.reasons),
    ...aoiPreview.missingPrerequisites,
    ...(workflow.summary && !workflow.summary.canApply ? [`Workflow preview is not ready: ${workflow.summary.nextRequiredStep ?? "resolve blockers"}.`] : []),
    ...(reportSnapshotPreview?.blockers ?? []),
    ...(qaBlockers.length > 0 ? ["Scientific QA blockers are present in the requested map context."] : []),
  ]);
  const warnings = unique([
    ...(input.request.requirements?.recommendedScale ? [`Recommended method scale: ${input.request.requirements.recommendedScale}.`] : []),
    ...(input.request.requirements?.dataFitnessThreshold != null ? ["Urban data-fitness thresholds are evaluated in Urban Analytics; Map Explorer only previews map-side compatibility."] : []),
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
    previewId: `urban-map-preview-${input.request.requestId}`,
    requestId: input.request.requestId,
    createdAt: now,
    status,
    sourceModule: "map-explorer",
    destinationModule: "urban-analytics",
    methodId: input.request.methodId,
    methodLabel: input.request.methodLabel ?? input.request.methodId,
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

export function extractUrbanToMapMethodRequestFromEvent(event: Event): UrbanToMapMethodRequest | null {
  if (!("detail" in event)) return null;
  const detail = (event as CustomEvent<unknown>).detail;
  if (isUrbanToMapMethodRequest(detail)) return detail;
  if (typeof detail === "object" && detail !== null && "request" in detail) {
    const request = (detail as { request?: unknown }).request;
    return isUrbanToMapMethodRequest(request) ? request : null;
  }
  return null;
}

export function publishUrbanToMapMethodRequest(request: UrbanToMapMethodRequest): boolean {
  if (typeof globalThis.dispatchEvent !== "function" || typeof globalThis.CustomEvent !== "function") {
    return false;
  }
  return globalThis.dispatchEvent(new CustomEvent<UrbanToMapMethodRequestEventDetail>(URBAN_TO_MAP_METHOD_REQUEST_EVENT, {
    detail: { request },
  }));
}

export function subscribeUrbanToMapMethodRequests(
  handler: (request: UrbanToMapMethodRequest) => void,
): () => void {
  const listener = (event: Event) => {
    const request = extractUrbanToMapMethodRequestFromEvent(event);
    if (request) {
      handler(request);
    }
  };
  globalThis.addEventListener(URBAN_TO_MAP_METHOD_REQUEST_EVENT, listener);
  return () => globalThis.removeEventListener(URBAN_TO_MAP_METHOD_REQUEST_EVENT, listener);
}