import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { AnalyticalFlowId } from "@/features/urbanAnalytics/lib/types";
import type {
  MapLayerRegistryLayerSummary,
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type {
  MapScientificQAIssue,
  MapScientificQAState,
} from "./MapScientificQA";

export const MAP_ANALYSIS_RECOMMENDER_VERSION = 1;

export type MapAnalysisRecommendationSeverity = "blocked" | "high" | "medium" | "low";

export type MapAnalysisRecommendationReadinessStatus = "ready" | "needs-review" | "blocked";

export type MapAnalysisRecommendationReasonKind =
  | "layer-type"
  | "geometry"
  | "fields"
  | "temporal"
  | "aoi"
  | "qa"
  | "urban-context"
  | "selection"
  | "workflow-manifest"
  | "provenance";

export type MapAnalysisRecommendationReasonTone = "supporting" | "context" | "warning" | "blocker";

export interface MapAnalysisRecommendationReason {
  kind: MapAnalysisRecommendationReasonKind;
  tone: MapAnalysisRecommendationReasonTone;
  label: string;
  detail: string;
  layerIds?: string[];
}

export interface MapAnalysisRecommendationReadiness {
  status: MapAnalysisRecommendationReadinessStatus;
  label: string;
  blockers: string[];
  warnings: string[];
  requiredActions: string[];
  qaBlockingIssueCount: number;
  hasActiveAoi: boolean;
  checkedAt: string;
  contextId?: string;
  urbanContextId?: string;
}

export interface MapAnalysisUrbanContextSummary {
  hasContext: boolean;
  contextId?: string | null;
  studyAreaId?: string | null;
  studyAreaName?: string | null;
  studyAreaBounds?: [number, number, number, number] | null;
  activeFlowId?: AnalyticalFlowId | string | null;
  activeLayerIds?: readonly string[];
  activeAoiId?: string | null;
  activeRunId?: string | null;
  selectedIndicatorKinds?: readonly string[];
  layerCount?: number;
  artifactCount?: number;
  fitnessStatus?: string;
  syncState?: string;
  hasRestoreWarnings?: boolean;
  restoreWarningCount?: number;
}

export type MapAnalysisRecommendationCategory =
  | "qa"
  | "selection"
  | "polygon"
  | "point"
  | "temporal"
  | "voxcity"
  | "geoai";

export type MapAnalysisRecommendationPanel =
  | "scientific-qa"
  | "choropleth"
  | "cluster"
  | "hotspot"
  | "emerging-hotspot"
  | "point-symbology"
  | "voxcity-overlay"
  | "workflow"
  | "nl-query"
  | "layer-panel";

export type MapAnalysisRecommendationIntent = "navigator" | "explore" | "analyze";

export type MapAnalysisRecommendationAction =
  | {
      type: "open-panel";
      panel: MapAnalysisRecommendationPanel;
      layerId?: string;
      symbologyMode?: "heatmap" | "proportional" | "graduated";
    }
  | {
      type: "open-flow";
      flowId: AnalyticalFlowId;
      layerIds?: string[];
      preferredMethod?: string;
    }
  | {
      type: "run-selection-statistics";
      layerIds: string[];
    };

export interface MapAnalysisRecommendation {
  id: string;
  category: MapAnalysisRecommendationCategory;
  severity: MapAnalysisRecommendationSeverity;
  score: number;
  title: string;
  rationale: string;
  requiredInputs: string[];
  expectedOutput: string;
  scientificCaveat: string;
  actionLabel: string;
  action: MapAnalysisRecommendationAction;
  layerIds: string[];
  evidence: string[];
  reasons: MapAnalysisRecommendationReason[];
  readiness: MapAnalysisRecommendationReadiness;
  blockedByIssueIds?: string[];
}

export interface MapAnalysisRecommendationContext {
  overlayLayers: OverlayLayerConfig[];
  selectedFeatureIds?: Record<string, string[]>;
  scientificQA?: MapScientificQAState | null;
  currentMapBounds?: [number, number, number, number] | null;
  userIntent?: MapAnalysisRecommendationIntent;
  mapContextSummary?: MapExplorerContextSummary | null;
  layerSummaries?: readonly MapLayerRegistryLayerSummary[];
  urbanContext?: MapAnalysisUrbanContextSummary | null;
}

export interface MapAnalysisRecommendationState {
  recommendations: MapAnalysisRecommendation[];
  metadata: {
    generatedBy: "MapAnalysisRecommender";
    version: number;
    visibleLayerCount: number;
    selectedFeatureCount: number;
    qaBlockingIssueCount: number;
    recommendationCounts: Record<MapAnalysisRecommendationSeverity, number>;
    readinessCounts: Record<MapAnalysisRecommendationReadinessStatus, number>;
    signature: string;
    contextId?: string;
    urbanContextId?: string;
  };
}

interface LayerAnalysisProfile {
  layer: OverlayLayerConfig;
  featureCollection: FeatureCollection | null;
  featureCount: number;
  geometryFamilies: Set<"point" | "line" | "polygon" | "mixed" | "unknown" | "raster">;
  fieldNames: string[];
  numericFields: string[];
  temporalFields: string[];
  temporalFrameCount: number;
  manifestIds: string[];
  isBuildingLayer: boolean;
  isGeoAiLayer: boolean;
}

const BLOCKING_QA_SEVERITIES = new Set<MapScientificQAIssue["severity"]>(["error", "blocker"]);

function sanitizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "item";
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sourceDataToFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData || typeof sourceData === "string") {
    return null;
  }

  if (sourceData.type === "FeatureCollection") {
    return sourceData;
  }

  if (sourceData.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [sourceData as Feature],
    };
  }

  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: sourceData as Geometry,
    }],
  };
}

function geometryFamilyFromText(value: string | undefined): LayerAnalysisProfile["geometryFamilies"] extends Set<infer T> ? T : never {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("point")) return "point";
  if (normalized.includes("polygon")) return "polygon";
  if (normalized.includes("line")) return "line";
  if (normalized.includes("mixed")) return "mixed";
  return "unknown";
}

function geometryFamilyFromGeometry(geometry: Geometry | null | undefined): "point" | "line" | "polygon" | "unknown" {
  if (!geometry) return "unknown";
  if (geometry.type === "Point" || geometry.type === "MultiPoint") return "point";
  if (geometry.type === "LineString" || geometry.type === "MultiLineString") return "line";
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") return "polygon";
  return "unknown";
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function uniqueStrings(values: readonly string[], limit = 24): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, limit);
}

function collectFieldNames(featureCollection: FeatureCollection | null, layer: OverlayLayerConfig): string[] {
  const fields: string[] = [];
  fields.push(...(layer.metadata?.fields ?? []));
  fields.push(...(layer.metadata?.schemaSummary?.fields.map((field) => field.name) ?? []));
  fields.push(...(layer.metadata?.datasetContext?.schemaSummary ?? []));

  for (const feature of featureCollection?.features ?? []) {
    fields.push(...Object.keys(feature.properties ?? {}).filter((field) => !field.startsWith("__")));
  }

  return uniqueStrings(fields, 48).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

function collectNumericFields(featureCollection: FeatureCollection | null): string[] {
  if (!featureCollection) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const feature of featureCollection.features) {
    for (const [field, rawValue] of Object.entries(feature.properties ?? {})) {
      if (field.startsWith("__")) {
        continue;
      }
      if (finiteNumber(rawValue) == null) {
        continue;
      }
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([field]) => field);
}

const TEMPORAL_FIELD_PATTERN = /(^|_)(date|time|timestamp|year|month|period|observed|valid)(_|\b)/i;

function collectTemporalFields(featureCollection: FeatureCollection | null, layer: OverlayLayerConfig, fieldNames: readonly string[]): string[] {
  const schemaTemporalFields = layer.metadata?.schemaSummary?.fields
    .filter((field) => field.role === "temporal")
    .map((field) => field.name) ?? [];
  const nameMatches = fieldNames.filter((field) => TEMPORAL_FIELD_PATTERN.test(field));
  const valueMatches: string[] = [];

  for (const feature of featureCollection?.features.slice(0, 24) ?? []) {
    for (const [field, rawValue] of Object.entries(feature.properties ?? {})) {
      if (field.startsWith("__") || valueMatches.includes(field)) {
        continue;
      }
      if (typeof rawValue === "string" && Number.isFinite(Date.parse(rawValue))) {
        valueMatches.push(field);
      }
    }
  }

  return uniqueStrings([...schemaTemporalFields, ...nameMatches, ...valueMatches], 16)
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

function collectManifestIds(layer: OverlayLayerConfig): string[] {
  return uniqueStrings([
    layer.metadata?.reproducibilityManifest?.manifestId ?? "",
    layer.metadata?.analysisResult?.reproducibilityManifest?.manifestId ?? "",
  ]);
}

function resolveTemporalFrameCount(layer: OverlayLayerConfig): number {
  return layer.metadata?.analysisResult?.visualization?.temporalFrames?.length ?? 0;
}

function resolveIsBuildingLayer(layer: OverlayLayerConfig): boolean {
  const text = [
    layer.id,
    layer.name,
    layer.metadata?.geometryType,
    layer.metadata?.datasetContext?.thematicCoverage?.join(" "),
    layer.metadata?.externalService?.kind,
    layer.metadata?.analysisResult?.engine,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (layer.group ?? "data") === "voxcity"
    || layer.metadata?.externalService?.kind === "cityjson"
    || layer.metadata?.analysisResult?.engine === "BuildingExtrusion"
    || text.includes("building")
    || text.includes("footprint")
    || text.includes("cityjson");
}

function resolveIsGeoAiLayer(layer: OverlayLayerConfig): boolean {
  const engine = layer.metadata?.analysisResult?.engine;
  return engine === "LandCoverClassifier"
    || engine === "ObjectDetector"
    || engine === "QueryToSQL"
    || Boolean(layer.metadata?.eoSource)
    || layer.type === "raster-tile";
}

function buildLayerProfile(layer: OverlayLayerConfig): LayerAnalysisProfile {
  const featureCollection = sourceDataToFeatureCollection(layer.sourceData);
  const geometryFamilies = new Set<"point" | "line" | "polygon" | "mixed" | "unknown" | "raster">();

  if (layer.type === "raster-tile" || layer.type === "vector-tile") {
    geometryFamilies.add("raster");
  }

  if (layer.metadata?.geometryType) {
    geometryFamilies.add(geometryFamilyFromText(layer.metadata.geometryType));
  }

  for (const feature of featureCollection?.features ?? []) {
    geometryFamilies.add(geometryFamilyFromGeometry(feature.geometry));
  }

  if (geometryFamilies.size === 0) {
    geometryFamilies.add("unknown");
  }

  const fieldNames = collectFieldNames(featureCollection, layer);

  return {
    layer,
    featureCollection,
    featureCount: layer.metadata?.featureCount ?? featureCollection?.features.length ?? 0,
    geometryFamilies,
    fieldNames,
    numericFields: collectNumericFields(featureCollection),
    temporalFields: collectTemporalFields(featureCollection, layer, fieldNames),
    temporalFrameCount: resolveTemporalFrameCount(layer),
    manifestIds: collectManifestIds(layer),
    isBuildingLayer: resolveIsBuildingLayer(layer),
    isGeoAiLayer: resolveIsGeoAiLayer(layer),
  };
}

function getSelectedFeatureCount(selectedFeatureIds: Record<string, string[]> | undefined): number {
  return Object.values(selectedFeatureIds ?? {}).reduce((sum, ids) => sum + ids.length, 0);
}

function issueMatchesLayers(issue: MapScientificQAIssue, layerIds: readonly string[]): boolean {
  return !issue.layerId || layerIds.length === 0 || layerIds.includes(issue.layerId);
}

function findBlockingIssues(scientificQA: MapScientificQAState | null | undefined, layerIds: readonly string[]): MapScientificQAIssue[] {
  return scientificQA?.issues.filter((issue) => BLOCKING_QA_SEVERITIES.has(issue.severity) && issueMatchesLayers(issue, layerIds)) ?? [];
}

function applyIntentBoost(
  score: number,
  category: MapAnalysisRecommendationCategory,
  userIntent: MapAnalysisRecommendationIntent,
): number {
  if (userIntent === "analyze" && (category === "polygon" || category === "point" || category === "temporal" || category === "selection")) {
    return score + 45;
  }
  if (userIntent === "explore" && (category === "qa" || category === "geoai" || category === "voxcity")) {
    return score + 30;
  }
  if (userIntent === "navigator") {
    return score + 8;
  }
  return score;
}

function withQaGate(
  recommendation: MapAnalysisRecommendation,
  scientificQA: MapScientificQAState | null | undefined,
): MapAnalysisRecommendation {
  const blockingIssues = findBlockingIssues(scientificQA, recommendation.layerIds);
  if (blockingIssues.length === 0) {
    return recommendation;
  }

  const firstIssue = blockingIssues[0]!;
  return {
    ...recommendation,
    severity: "blocked",
    score: Math.max(recommendation.score + 130, 960),
    expectedOutput: "Validated analysis inputs before the workflow runs.",
    scientificCaveat: `Blocked by ${firstIssue.title}: ${firstIssue.explanation}`,
    actionLabel: "Review QA blocker",
    action: { type: "open-panel", panel: "scientific-qa" },
    blockedByIssueIds: blockingIssues.map((issue) => issue.id),
  };
}

function createFallbackReadiness(): MapAnalysisRecommendationReadiness {
  return {
    status: "needs-review",
    label: "Needs review",
    blockers: [],
    warnings: ["Recommendation has not been checked against the current map context."],
    requiredActions: ["Review map context before dispatch."],
    qaBlockingIssueCount: 0,
    hasActiveAoi: false,
    checkedAt: new Date(0).toISOString(),
  };
}

function createRecommendation(
  input: Omit<MapAnalysisRecommendation, "id" | "reasons" | "readiness"> & {
    idParts: string[];
    reasons?: MapAnalysisRecommendationReason[];
    readiness?: MapAnalysisRecommendationReadiness;
  },
): MapAnalysisRecommendation {
  const id = ["analysis-rec", ...input.idParts].map(sanitizeIdPart).join(":");
  const { idParts: _idParts, reasons, readiness, ...recommendation } = input;
  void _idParts;
  return {
    id,
    reasons: reasons ?? [],
    readiness: readiness ?? createFallbackReadiness(),
    ...recommendation,
  };
}

function describeLayer(layer: OverlayLayerConfig, profile?: LayerAnalysisProfile): string {
  const featureCount = profile?.featureCount ?? layer.metadata?.featureCount;
  return featureCount != null ? `${layer.name} (${featureCount.toLocaleString()} features)` : layer.name;
}

function formatList(values: readonly string[], limit = 4): string {
  const shown = values.slice(0, limit);
  const suffix = values.length > limit ? ` +${values.length - limit}` : "";
  return shown.length > 0 ? `${shown.join(", ")}${suffix}` : "none";
}

function pushReason(
  reasons: MapAnalysisRecommendationReason[],
  reason: MapAnalysisRecommendationReason,
): void {
  const key = `${reason.kind}:${reason.label}:${reason.detail}:${reason.layerIds?.join("|") ?? ""}`;
  if (reasons.some((entry) => `${entry.kind}:${entry.label}:${entry.detail}:${entry.layerIds?.join("|") ?? ""}` === key)) {
    return;
  }
  reasons.push(reason);
}

function recommendationNeedsAoi(recommendation: MapAnalysisRecommendation): boolean {
  if (recommendation.category === "qa" || recommendation.category === "selection" || recommendation.action.type === "run-selection-statistics") {
    return false;
  }
  if (recommendation.action.type === "open-flow") {
    return recommendation.action.flowId !== "accessibility" && recommendation.action.flowId !== "voxcity_3d";
  }
  return recommendation.category === "polygon" || recommendation.category === "temporal";
}

function findWarningIssues(scientificQA: MapScientificQAState | null | undefined, layerIds: readonly string[]): MapScientificQAIssue[] {
  return scientificQA?.issues.filter((issue) => issue.severity === "warning" && issueMatchesLayers(issue, layerIds)) ?? [];
}

function createLayerReasons(profile: LayerAnalysisProfile): MapAnalysisRecommendationReason[] {
  const { layer } = profile;
  const layerIds = [layer.id];
  const reasons: MapAnalysisRecommendationReason[] = [];
  const sourceKind = layer.sourceKind ?? layer.metadata?.registry?.sourceKind ?? "project";
  const geometryFamilies = [...profile.geometryFamilies].sort();

  pushReason(reasons, {
    kind: "layer-type",
    tone: "supporting",
    label: "Layer type",
    detail: `${layer.name} is a visible ${layer.type}${sourceKind ? ` layer from ${sourceKind}` : " layer"}.`,
    layerIds,
  });

  pushReason(reasons, {
    kind: "geometry",
    tone: geometryFamilies.includes("unknown") ? "warning" : "supporting",
    label: "Geometry",
    detail: geometryFamilies.includes("unknown")
      ? `${layer.name} has incomplete geometry metadata; verify before analytical interpretation.`
      : `${layer.name} exposes ${formatList(geometryFamilies)} geometry suitable for this route.`,
    layerIds,
  });

  pushReason(reasons, {
    kind: "fields",
    tone: profile.numericFields.length > 0 || profile.fieldNames.length > 0 ? "supporting" : "warning",
    label: "Fields",
    detail: profile.numericFields.length > 0
      ? `${profile.numericFields.length} numeric field(s) available: ${formatList(profile.numericFields)}.`
      : profile.fieldNames.length > 0
        ? `${profile.fieldNames.length} attribute field(s) available; numeric analysis may need field selection.`
        : "No attribute schema was detected for this layer.",
    layerIds,
  });

  const temporalSignalCount = profile.temporalFrameCount + profile.temporalFields.length;
  pushReason(reasons, {
    kind: "temporal",
    tone: temporalSignalCount > 0 ? "supporting" : "context",
    label: "Temporal data",
    detail: profile.temporalFrameCount > 0
      ? `${profile.temporalFrameCount} temporal frame(s) are attached to the layer output.`
      : profile.temporalFields.length > 0
        ? `Temporal field candidates detected: ${formatList(profile.temporalFields)}.`
        : "No temporal frame or temporal field signal was detected.",
    layerIds,
  });

  if (profile.manifestIds.length > 0) {
    pushReason(reasons, {
      kind: "workflow-manifest",
      tone: "supporting",
      label: "Manifest",
      detail: `Reproducibility manifest reference(s): ${formatList(profile.manifestIds, 2)}.`,
      layerIds,
    });
  }

  if (layer.metadata?.registry?.metadataReady === false || layer.metadata?.publicationReadiness?.status === "blocked") {
    pushReason(reasons, {
      kind: "provenance",
      tone: "warning",
      label: "Provenance",
      detail: `${layer.name} needs metadata review before formal handoff or publication use.`,
      layerIds,
    });
  }

  return reasons;
}

function createAoiReason(
  recommendation: MapAnalysisRecommendation,
  context: MapAnalysisRecommendationContext,
): MapAnalysisRecommendationReason {
  const activeAoi = context.mapContextSummary?.activeAoi;
  if (activeAoi) {
    return {
      kind: "aoi",
      tone: "supporting",
      label: "AOI",
      detail: `Active ${activeAoi.geometryFamily} AOI ${activeAoi.aoiId} is available for scoped dispatch.`,
    };
  }

  return {
    kind: "aoi",
    tone: recommendationNeedsAoi(recommendation) ? "warning" : "context",
    label: "AOI",
    detail: recommendationNeedsAoi(recommendation)
      ? "No active AOI is selected; dispatch should open a preview or require AOI confirmation before analysis runs."
      : "No AOI is required for the immediate recommendation action.",
  };
}

function createQaReasons(
  recommendation: MapAnalysisRecommendation,
  context: MapAnalysisRecommendationContext,
): MapAnalysisRecommendationReason[] {
  const qa = context.scientificQA;
  if (!qa) {
    return [{
      kind: "qa",
      tone: "warning",
      label: "QA",
      detail: "Scientific QA has not run for the current map context; review before formal analysis or report handoff.",
      layerIds: recommendation.layerIds,
    }];
  }

  const blockers = findBlockingIssues(qa, recommendation.layerIds);
  if (blockers.length > 0) {
    return [{
      kind: "qa",
      tone: "blocker",
      label: "QA blocker",
      detail: `${blockers.length} blocking QA issue(s): ${formatList(blockers.map((issue) => issue.title), 2)}.`,
      layerIds: recommendation.layerIds,
    }];
  }

  const warnings = findWarningIssues(qa, recommendation.layerIds);
  if (warnings.length > 0) {
    return [{
      kind: "qa",
      tone: "warning",
      label: "QA warning",
      detail: `${warnings.length} warning(s) should travel with this recommendation: ${formatList(warnings.map((issue) => issue.title), 2)}.`,
      layerIds: recommendation.layerIds,
    }];
  }

  return [{
    kind: "qa",
    tone: "supporting",
    label: "QA",
    detail: qa.status === "passed"
      ? "Current scientific QA status is passed for visible layers."
      : `Current scientific QA status is ${qa.status}; no blocking issue matches this recommendation.`,
    layerIds: recommendation.layerIds,
  }];
}

function createUrbanContextReasons(
  recommendation: MapAnalysisRecommendation,
  context: MapAnalysisRecommendationContext,
): MapAnalysisRecommendationReason[] {
  const urbanContext = context.urbanContext;
  if (!urbanContext?.hasContext) {
    return [];
  }

  const reasons: MapAnalysisRecommendationReason[] = [];
  if (urbanContext.studyAreaName || urbanContext.studyAreaId) {
    pushReason(reasons, {
      kind: "urban-context",
      tone: "context",
      label: "Urban context",
      detail: `Urban context is active for ${urbanContext.studyAreaName ?? urbanContext.studyAreaId ?? "the current study area"}.`,
    });
  }

  if (urbanContext.activeFlowId && recommendation.action.type === "open-flow") {
    const matchesFlow = urbanContext.activeFlowId === recommendation.action.flowId;
    pushReason(reasons, {
      kind: "urban-context",
      tone: matchesFlow ? "supporting" : "context",
      label: matchesFlow ? "Urban flow match" : "Urban flow context",
      detail: matchesFlow
        ? `Active Urban flow ${urbanContext.activeFlowId} matches this recommendation route.`
        : `Active Urban flow ${urbanContext.activeFlowId} is different from this route; preserve context in the dispatch payload.`,
    });
  }

  const activeLayerIds = urbanContext.activeLayerIds ?? [];
  const matchingLayerIds = recommendation.layerIds.filter((layerId) => activeLayerIds.includes(layerId));
  if (matchingLayerIds.length > 0) {
    pushReason(reasons, {
      kind: "urban-context",
      tone: "supporting",
      label: "Urban layer match",
      detail: `${matchingLayerIds.length} recommendation layer(s) are already active in Urban Analytics.`,
      layerIds: matchingLayerIds,
    });
  }

  if ((urbanContext.restoreWarningCount ?? 0) > 0 || urbanContext.syncState === "stale") {
    pushReason(reasons, {
      kind: "urban-context",
      tone: "warning",
      label: "Urban sync",
      detail: "Urban context has restore or sync warnings; include caveats in dispatch and review before interpretation.",
    });
  }

  return reasons;
}

function applyUrbanContextScoreBoost(
  recommendation: MapAnalysisRecommendation,
  urbanContext: MapAnalysisUrbanContextSummary | null | undefined,
): number {
  if (!urbanContext?.hasContext) return recommendation.score;
  let score = recommendation.score + 12;
  if (urbanContext.activeFlowId && recommendation.action.type === "open-flow" && urbanContext.activeFlowId === recommendation.action.flowId) {
    score += 70;
  }
  const activeLayerIds = urbanContext.activeLayerIds ?? [];
  if (recommendation.layerIds.some((layerId) => activeLayerIds.includes(layerId))) {
    score += 24;
  }
  if (urbanContext.studyAreaId || urbanContext.studyAreaBounds) {
    score += 10;
  }
  if ((urbanContext.restoreWarningCount ?? 0) > 0 || urbanContext.syncState === "stale") {
    score -= 24;
  }
  return score;
}

function buildRecommendationReadiness(
  recommendation: MapAnalysisRecommendation,
  reasons: readonly MapAnalysisRecommendationReason[],
  context: MapAnalysisRecommendationContext,
): MapAnalysisRecommendationReadiness {
  const blockers = reasons
    .filter((reason) => reason.tone === "blocker")
    .map((reason) => reason.detail);
  const warnings = reasons
    .filter((reason) => reason.tone === "warning")
    .map((reason) => reason.detail);
  const status: MapAnalysisRecommendationReadinessStatus = blockers.length > 0
    ? "blocked"
    : warnings.length > 0
      ? "needs-review"
      : "ready";
  const requiredActions = status === "blocked"
    ? ["Resolve QA blockers or choose a review-only action before dispatch."]
    : warnings.length > 0
      ? ["Review warnings and preserve caveats in workflow/report handoff."]
      : ["Dispatch explicitly from the recommendation action."];
  const contextId = context.mapContextSummary?.contextId;
  const urbanContextId = context.urbanContext?.contextId ?? undefined;

  return {
    status,
    label: status === "ready" ? "Ready" : status === "blocked" ? "Blocked" : "Needs review",
    blockers: uniqueStrings(blockers, 8),
    warnings: uniqueStrings(warnings, 8),
    requiredActions,
    qaBlockingIssueCount: recommendation.blockedByIssueIds?.length ?? 0,
    hasActiveAoi: Boolean(context.mapContextSummary?.activeAoi),
    checkedAt: context.mapContextSummary?.updatedAt ?? context.scientificQA?.checkedAt ?? new Date(0).toISOString(),
    ...(contextId ? { contextId } : {}),
    ...(urbanContextId ? { urbanContextId } : {}),
  };
}

function enrichRecommendation(
  recommendation: MapAnalysisRecommendation,
  context: MapAnalysisRecommendationContext,
  profilesByLayerId: ReadonlyMap<string, LayerAnalysisProfile>,
): MapAnalysisRecommendation {
  const reasons: MapAnalysisRecommendationReason[] = [];
  for (const layerId of recommendation.layerIds) {
    const profile = profilesByLayerId.get(layerId);
    if (profile) {
      for (const reason of createLayerReasons(profile)) {
        pushReason(reasons, reason);
      }
    }
  }

  if (recommendation.action.type === "run-selection-statistics") {
    pushReason(reasons, {
      kind: "selection",
      tone: "supporting",
      label: "Selection",
      detail: `${getSelectedFeatureCount(context.selectedFeatureIds).toLocaleString()} selected feature(s) are available for descriptive statistics.`,
      layerIds: recommendation.layerIds,
    });
  }

  pushReason(reasons, createAoiReason(recommendation, context));
  for (const reason of createQaReasons(recommendation, context)) {
    pushReason(reasons, reason);
  }
  for (const reason of createUrbanContextReasons(recommendation, context)) {
    pushReason(reasons, reason);
  }

  const readiness = buildRecommendationReadiness(recommendation, reasons, context);
  return {
    ...recommendation,
    score: applyUrbanContextScoreBoost(recommendation, context.urbanContext),
    reasons,
    readiness,
  };
}

function addPolygonRecommendations(
  recommendations: MapAnalysisRecommendation[],
  profile: LayerAnalysisProfile,
  context: MapAnalysisRecommendationContext,
): void {
  if (!profile.geometryFamilies.has("polygon") || profile.numericFields.length === 0) {
    return;
  }

  const { layer } = profile;
  const primaryField = profile.numericFields[0]!;
  const layerLabel = describeLayer(layer, profile);
  const intent = context.userIntent ?? "navigator";

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["polygon", "choropleth", layer.id],
    category: "polygon",
    severity: "high",
    score: applyIntentBoost(820 + Math.min(profile.numericFields.length * 6, 36), "polygon", intent),
    title: "Classify polygon layer",
    rationale: `${layerLabel} has numeric attributes suitable for a choropleth review; start with ${primaryField}.`,
    requiredInputs: ["Visible polygon layer", `Numeric field: ${primaryField}`],
    expectedOutput: "Classified choropleth with legend, class counts, and inspectable layer metadata.",
    scientificCaveat: "Classification is sensitive to MAUP, outliers, and class-break choice; compare quantile and natural breaks before interpretation.",
    actionLabel: "Open choropleth",
    action: { type: "open-panel", panel: "choropleth", layerId: layer.id },
    layerIds: [layer.id],
    evidence: [`${profile.numericFields.length} numeric field(s)`, `${profile.featureCount.toLocaleString()} feature(s)`],
  }), context.scientificQA));

  if (profile.featureCount >= 8) {
    recommendations.push(withQaGate(createRecommendation({
      idParts: ["polygon", "lisa", layer.id],
      category: "polygon",
      severity: "high",
      score: applyIntentBoost(785 + Math.min(profile.featureCount, 60) / 3, "polygon", intent),
      title: "Test local spatial clustering",
      rationale: `${layerLabel} can support Local Moran's I if the geography has meaningful adjacency and ${primaryField} captures a comparable measure.`,
      requiredInputs: ["Polygon layer with neighboring units", `Numeric field: ${primaryField}`, "QA-cleared geometry"],
      expectedOutput: "LISA HH/HL/LH/LL cluster layer with p-value filter and report-ready metadata.",
      scientificCaveat: "Local autocorrelation is exploratory and multiple-testing sensitive; use it to target review, not to prove causality.",
      actionLabel: "Open LISA",
      action: { type: "open-panel", panel: "cluster", layerId: layer.id },
      layerIds: [layer.id],
      evidence: [`${profile.featureCount.toLocaleString()} polygon feature(s)`, "Local cluster renderer available"],
    }), context.scientificQA));
  }

  if (profile.numericFields.length >= 2) {
    recommendations.push(withQaGate(createRecommendation({
      idParts: ["polygon", "regression", layer.id],
      category: "polygon",
      severity: "medium",
      score: applyIntentBoost(720 + Math.min(profile.numericFields.length * 10, 60), "polygon", intent),
      title: "Prepare OLS/GWR covariate review",
      rationale: `${layerLabel} has multiple numeric attributes that can seed regression or composite-indicator diagnostics.`,
      requiredInputs: ["Dependent variable", "Candidate explanatory fields", "Comparable spatial units"],
      expectedOutput: "Workflow route for regression-ready variable review and interpretable residual or local-fit mapping.",
      scientificCaveat: "OLS/GWR require explicit model assumptions, multicollinearity checks, and residual diagnostics before map interpretation.",
      actionLabel: "Open indicator workflow",
      action: {
        type: "open-flow",
        flowId: "indicator_composite",
        layerIds: [layer.id],
        preferredMethod: "OLS/GWR covariate preparation",
      },
      layerIds: [layer.id],
      evidence: [`Fields: ${profile.numericFields.slice(0, 4).join(", ")}`],
    }), context.scientificQA));
  }

  if (profile.numericFields.length >= 3 || profile.featureCount >= 30) {
    recommendations.push(withQaGate(createRecommendation({
      idParts: ["polygon", "cluster", layer.id],
      category: "polygon",
      severity: "medium",
      score: applyIntentBoost(700 + Math.min(profile.numericFields.length * 8, 48), "polygon", intent),
      title: "Segment districts into morphotypes",
      rationale: `${layerLabel} has enough attribute structure to support an interpretable typology workflow.`,
      requiredInputs: ["Polygon units", "Two or more comparable indicators", "Cluster-count decision"],
      expectedOutput: "Urban morphology clustering workflow with typed map outputs and caveats.",
      scientificCaveat: "Cluster labels are exploratory typologies; validate them against local knowledge before policy use.",
      actionLabel: "Open morphology flow",
      action: {
        type: "open-flow",
        flowId: "urban_morphology",
        layerIds: [layer.id],
        preferredMethod: "morphotype clustering",
      },
      layerIds: [layer.id],
      evidence: [`${profile.numericFields.length} numeric field(s)`, `${profile.featureCount.toLocaleString()} feature(s)`],
    }), context.scientificQA));
  }
}

function addPointRecommendations(
  recommendations: MapAnalysisRecommendation[],
  profile: LayerAnalysisProfile,
  context: MapAnalysisRecommendationContext,
): void {
  if (!profile.geometryFamilies.has("point")) {
    return;
  }

  const { layer } = profile;
  const layerLabel = describeLayer(layer, profile);
  const intent = context.userIntent ?? "navigator";

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["point", "heatmap", layer.id],
    category: "point",
    severity: "high",
    score: applyIntentBoost(810 + Math.min(profile.featureCount, 400) / 20, "point", intent),
    title: "Map point-event intensity",
    rationale: `${layerLabel} is a point layer; a KDE/heatmap surface is the fastest way to inspect event concentration and scale effects.`,
    requiredInputs: ["Visible point layer", "Optional weight field", "Heatmap radius"],
    expectedOutput: "Interactive heatmap or graduated symbols with adjustable radius, intensity, and legend context.",
    scientificCaveat: "Heatmaps are scale-dependent exploratory surfaces; radius and zoom can change the apparent pattern.",
    actionLabel: "Open heatmap",
    action: { type: "open-panel", panel: "point-symbology", layerId: layer.id, symbologyMode: "heatmap" },
    layerIds: [layer.id],
    evidence: [`${profile.featureCount.toLocaleString()} point feature(s)`, profile.numericFields.length > 0 ? `Weight candidates: ${profile.numericFields.slice(0, 3).join(", ")}` : "Uniform event weight"],
  }), context.scientificQA));

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["point", "accessibility", layer.id],
    category: "point",
    severity: "medium",
    score: applyIntentBoost(735, "point", intent),
    title: "Test access around point events",
    rationale: `${layerLabel} can seed accessibility or service-area questions when points represent facilities, stops, or observed incidents.`,
    requiredInputs: ["Point origins or destinations", "Travel mode", "Time threshold"],
    expectedOutput: "Accessibility workflow with isochrone-ready map output and equity disaggregation options.",
    scientificCaveat: "Network accessibility depends on routable network quality and service-capacity assumptions, not just Euclidean proximity.",
    actionLabel: "Open accessibility",
    action: { type: "open-flow", flowId: "accessibility", layerIds: [layer.id], preferredMethod: "network accessibility from point layer" },
    layerIds: [layer.id],
    evidence: ["Accessibility workflow available", `${profile.featureCount.toLocaleString()} candidate point(s)`],
  }), context.scientificQA));
}

function addTemporalRecommendations(
  recommendations: MapAnalysisRecommendation[],
  profile: LayerAnalysisProfile,
  context: MapAnalysisRecommendationContext,
): void {
  if (profile.temporalFrameCount < 2) {
    return;
  }

  const { layer } = profile;
  const intent = context.userIntent ?? "navigator";
  recommendations.push(withQaGate(createRecommendation({
    idParts: ["temporal", layer.id],
    category: "temporal",
    severity: "high",
    score: applyIntentBoost(850 + Math.min(profile.temporalFrameCount, 60), "temporal", intent),
    title: "Review temporal change pattern",
    rationale: `${layer.name} contains ${profile.temporalFrameCount} temporal frames, so trend comparison or playback should come before static interpretation.`,
    requiredInputs: ["Temporal result layer", "Ordered frames", "Time-step metadata"],
    expectedOutput: "Playback-ready temporal review or change-detection workflow route.",
    scientificCaveat: "Temporal comparison is sensitive to inconsistent observation intervals, classification drift, and changing spatial units.",
    actionLabel: "Open change flow",
    action: { type: "open-flow", flowId: "change_detection", layerIds: [layer.id], preferredMethod: "temporal trend comparison" },
    layerIds: [layer.id],
    evidence: [`${profile.temporalFrameCount} temporal frame(s)`],
  }), context.scientificQA));
}

function addVoxCityRecommendations(
  recommendations: MapAnalysisRecommendation[],
  profile: LayerAnalysisProfile,
  context: MapAnalysisRecommendationContext,
): void {
  if (!profile.isBuildingLayer) {
    return;
  }

  const { layer } = profile;
  const intent = context.userIntent ?? "navigator";

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["voxcity", "extrude", layer.id],
    category: "voxcity",
    severity: "high",
    score: applyIntentBoost(835, "voxcity", intent),
    title: "Inspect buildings in VoxCity 3D",
    rationale: `${layer.name} looks like a building footprint layer; extrusion can reveal height, form, and urban canyon context.`,
    requiredInputs: ["Building footprints", "Height or fallback height strategy", "CRS/provenance metadata"],
    expectedOutput: "VoxCity 3D workflow with linked footprint context and inspectable building attributes.",
    scientificCaveat: "Extrusion is a visual analytical model; height defaults or missing LOD metadata must be labelled before interpretation.",
    actionLabel: "Open VoxCity",
    action: { type: "open-flow", flowId: "voxcity_3d", layerIds: [layer.id], preferredMethod: "building extrusion" },
    layerIds: [layer.id],
    evidence: [profile.featureCount > 0 ? `${profile.featureCount.toLocaleString()} footprint feature(s)` : "Building footprint signal"],
  }), context.scientificQA));

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["voxcity", "sunlight", layer.id],
    category: "voxcity",
    severity: "medium",
    score: applyIntentBoost(770, "voxcity", intent),
    title: "Simulate solar exposure",
    rationale: `${layer.name} can support shadow and solar-access screening when building volume assumptions are available.`,
    requiredInputs: ["Building geometry", "Date/time range", "Location/time zone"],
    expectedOutput: "Sunlight simulation workflow with exposure summaries and caveats.",
    scientificCaveat: "Shadow models depend on simplified geometry and do not include atmosphere, reflection, or interior daylight performance.",
    actionLabel: "Open sunlight",
    action: { type: "open-flow", flowId: "sunlight_sim", layerIds: [layer.id], preferredMethod: "solar exposure simulation" },
    layerIds: [layer.id],
    evidence: ["VoxCity/Sunlight workflow available"],
  }), context.scientificQA));
}

function addGeoAiRecommendations(
  recommendations: MapAnalysisRecommendation[],
  profile: LayerAnalysisProfile,
  context: MapAnalysisRecommendationContext,
): void {
  if (!profile.isGeoAiLayer) {
    return;
  }

  const { layer } = profile;
  const intent = context.userIntent ?? "navigator";
  const engine = layer.metadata?.analysisResult?.engine ?? (layer.metadata?.eoSource ? "EO source" : "Raster/GeoAI");

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["geoai", "uncertainty", layer.id],
    category: "geoai",
    severity: "high",
    score: applyIntentBoost(825, "geoai", intent),
    title: "Review GeoAI uncertainty",
    rationale: `${layer.name} is a ${engine} layer; class/confidence metadata should be reviewed before overlay comparison.`,
    requiredInputs: ["GeoAI or raster layer", "Confidence/class metadata where available", "Source/provenance"],
    expectedOutput: "Layer inspection with class distribution, source labels, and uncertainty caveats.",
    scientificCaveat: "Model outputs are screening evidence; missing confidence or validation metadata must be carried into reports as a caveat.",
    actionLabel: "Inspect layer",
    action: { type: "open-panel", panel: "layer-panel", layerId: layer.id },
    layerIds: [layer.id],
    evidence: [`Source: ${engine}`, layer.sourceKind ? `Kind: ${layer.sourceKind}` : "GeoAI/raster signal"],
  }), context.scientificQA));

  recommendations.push(withQaGate(createRecommendation({
    idParts: ["geoai", "compare", layer.id],
    category: "geoai",
    severity: "medium",
    score: applyIntentBoost(760, "geoai", intent),
    title: "Compare GeoAI output with context layers",
    rationale: `${layer.name} should be compared against visible planning, parcel, or field-observation layers before conclusions are drawn.`,
    requiredInputs: ["GeoAI output layer", "At least one contextual comparison layer", "Comparison mode"],
    expectedOutput: "Split, swipe, or opacity-blend comparison workflow with reportable provenance.",
    scientificCaveat: "Overlay agreement can reflect temporal mismatch, resolution mismatch, or classification uncertainty rather than true urban change.",
    actionLabel: "Open compare",
    action: { type: "open-panel", panel: "workflow", layerId: layer.id },
    layerIds: [layer.id],
    evidence: ["Comparison workflow available"],
  }), context.scientificQA));
}

function addSelectionRecommendation(
  recommendations: MapAnalysisRecommendation[],
  context: MapAnalysisRecommendationContext,
): void {
  const selectedLayerIds = Object.entries(context.selectedFeatureIds ?? {})
    .filter(([, ids]) => ids.length > 0)
    .map(([layerId]) => layerId);
  const selectedFeatureCount = getSelectedFeatureCount(context.selectedFeatureIds);
  if (selectedFeatureCount === 0) {
    return;
  }

  const intent = context.userIntent ?? "navigator";
  recommendations.push(withQaGate(createRecommendation({
    idParts: ["selection", selectedLayerIds.join("-") || "features"],
    category: "selection",
    severity: "high",
    score: applyIntentBoost(875 + Math.min(selectedFeatureCount, 40), "selection", intent),
    title: "Summarize selected features",
    rationale: `${selectedFeatureCount.toLocaleString()} selected feature(s) can be summarized before running a heavier workflow.`,
    requiredInputs: ["Selected features", "Queryable attributes", "Numeric fields for statistics"],
    expectedOutput: "Quick statistics panel with min, max, mean, median, and exportable context.",
    scientificCaveat: "Selection summaries are conditional on the current selection and may not represent the full population or study area.",
    actionLabel: "Run statistics",
    action: { type: "run-selection-statistics", layerIds: selectedLayerIds },
    layerIds: selectedLayerIds,
    evidence: [`${selectedFeatureCount.toLocaleString()} selected feature(s)`],
  }), context.scientificQA));
}

function addQaRecommendations(
  recommendations: MapAnalysisRecommendation[],
  context: MapAnalysisRecommendationContext,
): void {
  const qa = context.scientificQA;
  if (!qa) {
    return;
  }

  const blockingIssues = qa.issues.filter((issue) => BLOCKING_QA_SEVERITIES.has(issue.severity));
  const warningIssues = qa.issues.filter((issue) => issue.severity === "warning");
  const intent = context.userIntent ?? "navigator";

  if (blockingIssues.length > 0) {
    recommendations.push(createRecommendation({
      idParts: ["qa", "blockers"],
      category: "qa",
      severity: "blocked",
      score: applyIntentBoost(1_050, "qa", intent),
      title: "Resolve scientific QA blockers first",
      rationale: `${blockingIssues.length} CRS, geometry, lineage, or type issue(s) can invalidate downstream analysis if ignored.`,
      requiredInputs: ["Affected layer metadata", "QA issue details", "Analyst fix or acknowledgement"],
      expectedOutput: "QA-cleared inputs or an explicit caveat before analysis continues.",
      scientificCaveat: blockingIssues[0]?.explanation ?? "Analysis is blocked until scientific QA issues are reviewed.",
      actionLabel: "Open QA",
      action: { type: "open-panel", panel: "scientific-qa" },
      layerIds: blockingIssues.map((issue) => issue.layerId).filter((layerId): layerId is string => Boolean(layerId)),
      evidence: blockingIssues.slice(0, 3).map((issue) => issue.title),
      blockedByIssueIds: blockingIssues.map((issue) => issue.id),
    }));
    return;
  }

  if (warningIssues.length > 0) {
    recommendations.push(createRecommendation({
      idParts: ["qa", "warnings"],
      category: "qa",
      severity: "high",
      score: applyIntentBoost(930, "qa", intent),
      title: "Review QA caveats before analysis",
      rationale: `${warningIssues.length} warning(s) should be carried into interpretation and report handoff.`,
      requiredInputs: ["QA warning list", "Affected layers", "Caveat decision"],
      expectedOutput: "Visible caveats attached to the next analysis or report item.",
      scientificCaveat: warningIssues[0]?.explanation ?? "QA warnings are present on the current map state.",
      actionLabel: "Open QA",
      action: { type: "open-panel", panel: "scientific-qa" },
      layerIds: warningIssues.map((issue) => issue.layerId).filter((layerId): layerId is string => Boolean(layerId)),
      evidence: warningIssues.slice(0, 3).map((issue) => issue.title),
    }));
  }
}

function countRecommendations(recommendations: MapAnalysisRecommendation[]): Record<MapAnalysisRecommendationSeverity, number> {
  return recommendations.reduce<Record<MapAnalysisRecommendationSeverity, number>>(
    (counts, recommendation) => {
      counts[recommendation.severity] += 1;
      return counts;
    },
    { blocked: 0, high: 0, medium: 0, low: 0 },
  );
}

function countReadiness(recommendations: MapAnalysisRecommendation[]): Record<MapAnalysisRecommendationReadinessStatus, number> {
  return recommendations.reduce<Record<MapAnalysisRecommendationReadinessStatus, number>>(
    (counts, recommendation) => {
      counts[recommendation.readiness.status] += 1;
      return counts;
    },
    { ready: 0, "needs-review": 0, blocked: 0 },
  );
}

function compareRecommendations(left: MapAnalysisRecommendation, right: MapAnalysisRecommendation): number {
  const scoreDifference = right.score - left.score;
  if (scoreDifference !== 0) {
    return scoreDifference;
  }
  return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
}

export function generateMapAnalysisRecommendations(
  context: MapAnalysisRecommendationContext,
): MapAnalysisRecommendationState {
  const visibleLayers = context.overlayLayers.filter((layer) => layer.visible);
  const profiles = visibleLayers.map(buildLayerProfile);
  const profilesByLayerId = new Map(profiles.map((profile) => [profile.layer.id, profile]));
  const recommendations: MapAnalysisRecommendation[] = [];

  addQaRecommendations(recommendations, context);
  addSelectionRecommendation(recommendations, context);

  for (const profile of profiles) {
    addPolygonRecommendations(recommendations, profile, context);
    addPointRecommendations(recommendations, profile, context);
    addTemporalRecommendations(recommendations, profile, context);
    addVoxCityRecommendations(recommendations, profile, context);
    addGeoAiRecommendations(recommendations, profile, context);
  }

  const uniqueRecommendations = new Map<string, MapAnalysisRecommendation>();
  for (const recommendation of recommendations) {
    const existing = uniqueRecommendations.get(recommendation.id);
    if (!existing || recommendation.score > existing.score) {
      uniqueRecommendations.set(recommendation.id, recommendation);
    }
  }

  const orderedRecommendations = [...uniqueRecommendations.values()]
    .map((recommendation) => enrichRecommendation(recommendation, context, profilesByLayerId))
    .sort(compareRecommendations);
  const selectedFeatureCount = getSelectedFeatureCount(context.selectedFeatureIds);
  const qaBlockingIssueCount = context.scientificQA?.issues.filter((issue) => BLOCKING_QA_SEVERITIES.has(issue.severity)).length ?? 0;
  const contextId = context.mapContextSummary?.contextId;
  const urbanContextId = context.urbanContext?.contextId ?? undefined;

  return {
    recommendations: orderedRecommendations,
    metadata: {
      generatedBy: "MapAnalysisRecommender",
      version: MAP_ANALYSIS_RECOMMENDER_VERSION,
      visibleLayerCount: visibleLayers.length,
      selectedFeatureCount,
      qaBlockingIssueCount,
      recommendationCounts: countRecommendations(orderedRecommendations),
      readinessCounts: countReadiness(orderedRecommendations),
      signature: stableStringify({
        layerIds: visibleLayers.map((layer) => layer.id),
        contextId: context.mapContextSummary?.contextId ?? null,
        selectedFeatureCount,
        qaBlockingIssueCount,
        intent: context.userIntent ?? "navigator",
        bounds: context.currentMapBounds ?? null,
        activeAoiId: context.mapContextSummary?.activeAoi?.aoiId ?? null,
        activeUrbanFlowId: context.urbanContext?.activeFlowId ?? null,
        urbanSyncState: context.urbanContext?.syncState ?? null,
      }),
      ...(contextId ? { contextId } : {}),
      ...(urbanContextId ? { urbanContextId } : {}),
    },
  };
}