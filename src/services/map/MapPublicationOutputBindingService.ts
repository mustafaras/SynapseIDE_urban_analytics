import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type {
  LayerPublicationReadinessStatus,
  MapEvidenceArtifact,
  MapEvidenceQA,
  MapEvidenceScalar,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import type {
  DashboardBindingQAState,
  DashboardBindingRefreshMode,
  DashboardMapBinding,
  DashboardWidgetType,
} from "@/features/dashboard/types";
import type {
  EducationFocusRequest,
  EducationPanelView,
  LearningPathId,
  MethodologyExplainerId,
} from "@/features/education/types";
import type { MapPublicationManifest, MapPublicationReadiness } from "./MapExportService";

export const MAP_PUBLICATION_OUTPUT_BINDING_VERSION = 1;

export type MapOutputBindingMode = "static-snapshot" | "static-reference" | "manual-refresh" | "live";

export interface MapOutputBindingQA {
  state: MapEvidenceQA["state"];
  issueIds: string[];
  blockerCount: number;
  warningCount: number;
  caveats: string[];
  checkedAt?: string;
}

export interface MapOutputBindingProvenance {
  sourceModule: "map-explorer";
  layerIds: string[];
  evidenceArtifactIds: string[];
  contextId?: string;
  sourceRunId?: string;
  publicationManifestId?: string;
  notes: string[];
}

export interface MapDashboardBinding {
  version: number;
  bindingId: string;
  title: string;
  summary: string;
  widgetType: DashboardWidgetType;
  bindingKind: "map";
  bindingMode: "static-snapshot";
  refreshMode: DashboardBindingRefreshMode;
  isLive: false;
  liveStateLabel: string;
  layerIds: string[];
  sourceLayerIds: string[];
  dataFields: string[];
  visualEncodingSummary: string;
  sourceContext: MapDashboardSourceContext;
  dashboardBinding: DashboardMapBinding;
  qa: MapOutputBindingQA;
  provenance: MapOutputBindingProvenance;
  metadata: Record<string, MapEvidenceScalar>;
}

export interface MapDashboardSourceContext {
  label: string;
  crsLabel: string;
  publicationReadinessStatus: LayerPublicationReadinessStatus | MapPublicationReadiness["status"];
  contextId?: string;
  sourceName?: string;
}

export interface MapEducationReferenceTarget {
  view: EducationPanelView;
  pathId: LearningPathId;
  explainerId?: MethodologyExplainerId;
  rationale: string;
}

export interface MapEducationReference {
  version: number;
  referenceId: string;
  title: string;
  summary: string;
  topic: string;
  bindingMode: "static-reference";
  isLive: false;
  liveStateLabel: string;
  layerIds: string[];
  evidenceArtifactIds: string[];
  target: MapEducationReferenceTarget;
  focusRequest: EducationFocusRequest;
  qa: MapOutputBindingQA;
  provenance: MapOutputBindingProvenance;
  metadata: Record<string, MapEvidenceScalar>;
}

export interface BuildMapDashboardBindingInput {
  layer: OverlayLayerConfig;
  contextSummary?: MapExplorerContextSummary | null;
  publicationReadiness?: MapPublicationReadiness | null;
  publicationManifest?: MapPublicationManifest | null;
  evidenceArtifacts?: readonly MapEvidenceArtifact[];
  createdAt?: string;
}

export interface BuildMapEducationReferenceInput {
  layer: OverlayLayerConfig;
  contextSummary?: MapExplorerContextSummary | null;
  publicationReadiness?: MapPublicationReadiness | null;
  publicationManifest?: MapPublicationManifest | null;
  evidenceArtifacts?: readonly MapEvidenceArtifact[];
  requestedAt?: number;
  createdAt?: string;
}

function safeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "map-output";
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function isoNow(value?: string): string {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function collectLayerEvidenceArtifactIds(
  layer: OverlayLayerConfig,
  artifacts: readonly MapEvidenceArtifact[] | undefined,
): string[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const linkedArtifactIds = (artifacts ?? [])
    .filter((artifact) => artifact.linkedLayerIds.includes(layer.id) || artifact.sourceLayerIds.includes(layer.id))
    .map((artifact) => artifact.id);
  return unique([
    registry.evidenceArtifactId,
    layer.metadata?.evidenceArtifactId,
    layer.metadata?.analysisResult?.evidenceArtifactId,
    ...linkedArtifactIds,
  ]);
}

function layerReadinessToDashboardQA(status: LayerPublicationReadinessStatus): DashboardBindingQAState {
  switch (status) {
    case "ready":
      return "valid";
    case "ready-with-caveats":
    case "needs-review":
      return "warning";
    case "blocked":
      return "blocked";
    default:
      return "unvalidated";
  }
}

function dashboardQAState(input: {
  layer: OverlayLayerConfig;
  publicationReadiness?: MapPublicationReadiness | null;
}): DashboardBindingQAState {
  const registry = normalizeLayerRegistryMetadata(input.layer);
  if (input.publicationReadiness?.status === "blocked" || registry.publicationReadiness.status === "blocked") {
    return "blocked";
  }
  if (input.layer.metadata?.analysisResult?.stale) return "stale";
  if (registry.qaStatus === "error") return "invalid";
  if (input.publicationReadiness?.status === "ready-with-caveats" || registry.qaStatus === "warning") return "warning";
  if (registry.qaStatus === "passed" && registry.publicationReadiness.status === "ready") return "valid";
  return layerReadinessToDashboardQA(registry.publicationReadiness.status);
}

function dashboardQAStateToEvidenceState(state: DashboardBindingQAState): MapEvidenceQA["state"] {
  switch (state) {
    case "valid":
      return "passed";
    case "invalid":
      return "error";
    case "blocked":
      return "blocked";
    case "warning":
    case "stale":
    case "unvalidated":
    default:
      return "warning";
  }
}

function buildOutputQA(input: {
  layer: OverlayLayerConfig;
  publicationReadiness?: MapPublicationReadiness | null;
}): MapOutputBindingQA {
  const registry = normalizeLayerRegistryMetadata(input.layer);
  const state = dashboardQAState(input);
  const layerQaIssueIds = input.layer.metadata?.scientificQA?.issueIds ?? [];
  const readinessIssueIds = input.publicationReadiness?.checks.flatMap((check) => check.issueIds) ?? [];
  const blockerCount = input.publicationReadiness?.blockers.length ?? registry.publicationReadiness.blockingIssueIds.length;
  const warningCount = input.publicationReadiness?.warnings.length
    ?? (registry.publicationReadiness.status === "ready-with-caveats" || registry.publicationReadiness.status === "needs-review" ? 1 : 0);
  const caveats = unique([
    ...registry.publicationReadiness.caveats,
    ...(input.layer.metadata?.scientificQA?.caveats ?? []),
    ...(input.layer.metadata?.analysisResult?.caveats ?? []),
    ...(input.publicationReadiness?.caveats ?? []),
  ]).slice(0, 12);

  const qa: MapOutputBindingQA = {
    state: dashboardQAStateToEvidenceState(state),
    issueIds: unique([...registry.publicationReadiness.blockingIssueIds, ...layerQaIssueIds, ...readinessIssueIds]),
    blockerCount,
    warningCount,
    caveats,
  };
  const checkedAt = input.publicationReadiness?.checkedAt ?? input.layer.metadata?.scientificQA?.checkedAt;
  if (checkedAt) qa.checkedAt = checkedAt;
  return qa;
}

function areaStatus(state: DashboardBindingQAState): DashboardMapBinding["areas"][number]["status"] {
  switch (state) {
    case "blocked":
    case "invalid":
      return "critical";
    case "warning":
    case "stale":
      return "watch";
    case "valid":
      return "improving";
    case "unvalidated":
    default:
      return "steady";
  }
}

function buildProvenance(input: {
  layer: OverlayLayerConfig;
  contextSummary?: MapExplorerContextSummary | null;
  publicationManifest?: MapPublicationManifest | null;
  evidenceArtifactIds: string[];
}): MapOutputBindingProvenance {
  const registry = normalizeLayerRegistryMetadata(input.layer);
  const notes = unique([
    "Map Explorer generated this as a lightweight output binding descriptor; raw spatial data and rendered images remain in map/export services.",
    "Binding mode is static unless a future reactive dashboard receiver explicitly subscribes to map state.",
    registry.provenance.label,
    ...(registry.provenance.notes ?? []),
  ]).slice(0, 8);

  const provenance: MapOutputBindingProvenance = {
    sourceModule: "map-explorer",
    layerIds: [input.layer.id],
    evidenceArtifactIds: input.evidenceArtifactIds,
    notes,
  };
  if (input.contextSummary?.contextId) provenance.contextId = input.contextSummary.contextId;
  if (input.layer.metadata?.analysisResult?.runId) provenance.sourceRunId = input.layer.metadata.analysisResult.runId;
  if (input.publicationManifest?.manifestId) provenance.publicationManifestId = input.publicationManifest.manifestId;
  return provenance;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function collectDashboardDataFields(layer: OverlayLayerConfig): string[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const visualization = asRecord(layer.metadata?.analysisResult?.visualization);
  const fields = unique([
    optionalString(visualization?.valueField),
    optionalString(visualization?.colorField),
    optionalString(visualization?.weightField),
    optionalString(visualization?.labelField),
    ...registry.schemaSummary.fields
      .filter((field) => field.role !== "geometry")
      .map((field) => field.name),
    ...(layer.metadata?.fields ?? []),
  ]);
  return fields.slice(0, 16);
}

function summarizeVisualEncoding(layer: OverlayLayerConfig): string {
  const registry = normalizeLayerRegistryMetadata(layer);
  const visualization = asRecord(layer.metadata?.analysisResult?.visualization);
  const style = asRecord(layer.style);
  const legendEntries = Array.isArray(style?.legendEntries) ? style.legendEntries.length : 0;
  const parts = unique([
    optionalString(visualization?.kind) ? `analysis ${optionalString(visualization?.kind)}` : null,
    optionalString(visualization?.title),
    optionalString(visualization?.valueField) ? `value field ${optionalString(visualization?.valueField)}` : null,
    legendEntries > 0 ? `${legendEntries} legend entries` : null,
    Object.keys(style ?? {}).length > 0 ? `style keys ${Object.keys(style ?? {}).slice(0, 6).join(", ")}` : null,
    `${layer.type} layer`,
    registry.geometrySummary.geometryType ? `geometry ${registry.geometrySummary.geometryType}` : null,
  ]);
  return parts.join("; ");
}

function buildDashboardSourceContext(input: {
  layer: OverlayLayerConfig;
  contextSummary?: MapExplorerContextSummary | null;
  publicationReadiness?: MapPublicationReadiness | null;
}): MapDashboardSourceContext {
  const registry = normalizeLayerRegistryMetadata(input.layer);
  const sourceName = registry.provenance.sourceName ?? registry.licenseAttribution.sourceName ?? registry.provenance.label;
  const crsLabel = registry.crsSummary.crs ? `CRS ${registry.crsSummary.crs}` : "CRS unknown";
  const publicationReadinessStatus = input.publicationReadiness?.status ?? registry.publicationReadiness.status;
  const label = unique([
    sourceName,
    input.contextSummary?.contextId ? `context ${input.contextSummary.contextId}` : null,
    crsLabel,
    `publication ${publicationReadinessStatus}`,
  ]).join(" | ");

  return {
    label,
    crsLabel,
    publicationReadinessStatus,
    ...(input.contextSummary?.contextId ? { contextId: input.contextSummary.contextId } : {}),
    ...(sourceName ? { sourceName } : {}),
  };
}

export function buildMapDashboardBinding(input: BuildMapDashboardBindingInput): MapDashboardBinding {
  const createdAt = isoNow(input.createdAt);
  const registry = normalizeLayerRegistryMetadata(input.layer);
  const dashboardQaState = dashboardQAState({ layer: input.layer, publicationReadiness: input.publicationReadiness });
  const evidenceArtifactIds = collectLayerEvidenceArtifactIds(input.layer, input.evidenceArtifacts);
  const bindingId = `map-dashboard:${safeIdPart(input.layer.id)}:${safeIdPart(createdAt)}`;
  const featureCount = registry.geometrySummary.featureCount ?? input.layer.metadata?.featureCount ?? null;
  const title = `${input.layer.name} map evidence`;
  const summary = `Static dashboard map binding for ${input.layer.name} with ${registry.publicationReadiness.status} publication readiness and ${registry.qaStatus} QA.`;
  const qa = buildOutputQA({ layer: input.layer, publicationReadiness: input.publicationReadiness });
  const dataFields = collectDashboardDataFields(input.layer);
  const visualEncodingSummary = summarizeVisualEncoding(input.layer);
  const sourceContext = buildDashboardSourceContext({
    layer: input.layer,
    contextSummary: input.contextSummary,
    publicationReadiness: input.publicationReadiness,
  });
  const provenance = buildProvenance({
    layer: input.layer,
    contextSummary: input.contextSummary,
    publicationManifest: input.publicationManifest,
    evidenceArtifactIds,
  });
  const traceability = {
    ...(evidenceArtifactIds[0] ? { sourceArtifactId: evidenceArtifactIds[0] } : {}),
    ...(input.layer.metadata?.analysisResult?.runId ? { sourceRunId: input.layer.metadata.analysisResult.runId } : {}),
    sourceLayerIds: [input.layer.id],
    refreshMode: "static" as const,
    scaleLabel: sourceContext.crsLabel,
    uncertaintyLabel: qa.caveats.length > 0 ? `${qa.caveats.length} caveat(s)` : "No QA caveats recorded",
    sourceContextLabel: sourceContext.label,
    dataFields,
    visualEncodingSummary,
    publicationReadinessStatus: sourceContext.publicationReadinessStatus,
    provenanceNotes: provenance.notes,
    qaState: dashboardQaState,
    qaWarnings: input.publicationReadiness?.warnings.map((check) => check.message) ?? [],
    qaLimitations: qa.caveats,
  };
  const dashboardBinding: DashboardMapBinding = {
    id: bindingId,
    kind: "map",
    label: title,
    description: summary,
    areas: [{
      id: input.layer.id,
      label: input.layer.name,
      value: featureCount ?? 1,
      formattedValue: featureCount == null ? "Layer reference" : `${featureCount.toLocaleString()} features`,
      status: areaStatus(dashboardQaState),
    }],
    updatedAt: createdAt,
    tags: ["city_profile"],
    ...(registry.geometrySummary.featureCount == null ? {} : { unit: "features" }),
    traceability,
  };

  return {
    version: MAP_PUBLICATION_OUTPUT_BINDING_VERSION,
    bindingId,
    title,
    summary,
    widgetType: "map",
    bindingKind: "map",
    bindingMode: "static-snapshot",
    refreshMode: "static",
    isLive: false,
    liveStateLabel: "Static map binding; refresh manually from Map Explorer after source map state changes.",
    layerIds: [input.layer.id],
    sourceLayerIds: [input.layer.id],
    dataFields,
    visualEncodingSummary,
    sourceContext,
    dashboardBinding,
    qa,
    provenance,
    metadata: {
      dashboardBindingId: bindingId,
      bindingMode: "static-snapshot",
      refreshMode: "static",
      isLive: false,
      layerId: input.layer.id,
      qaState: qa.state,
      publicationReadinessStatus: input.publicationReadiness?.status ?? registry.publicationReadiness.status,
      sourceContextLabel: sourceContext.label,
      visualEncodingSummary,
      dataFields: dataFields.join(", ") || null,
      dataFieldCount: dataFields.length,
      featureCount,
      evidenceArtifactCount: evidenceArtifactIds.length,
      ...(input.publicationManifest?.manifestId ? { publicationManifestId: input.publicationManifest.manifestId } : {}),
    },
  };
}

function resolveEducationTarget(layer: OverlayLayerConfig): MapEducationReferenceTarget & { topic: string } {
  const registry = normalizeLayerRegistryMetadata(layer);
  const analysis = layer.metadata?.analysisResult;
  const haystack = [
    layer.id,
    layer.name,
    layer.type,
    layer.metadata?.geometryType,
    analysis?.engine,
    analysis?.algorithmWorkflowId,
    analysis?.parameterSummary,
  ].filter(Boolean).join(" ").toLowerCase();

  if (/hot\s*spot|hotspot|gi\*|getis|cluster/.test(haystack)) {
    return {
      view: "paths",
      pathId: "spatial_statistics_planners",
      explainerId: "getis_ord_gi",
      topic: "Hot spot analysis",
      rationale: "Layer metadata suggests hot-spot or cluster interpretation, so the education link opens Getis-Ord Gi* guidance.",
    };
  }
  if (/moran|lisa|autocorrelation|spatial\s*weights|weights/.test(haystack)) {
    return {
      view: "paths",
      pathId: "spatial_statistics_planners",
      explainerId: "morans_i",
      topic: "Spatial weights and autocorrelation",
      rationale: "Layer metadata mentions spatial weights or autocorrelation, so the link opens Moran's I guidance.",
    };
  }
  if (/gwr|regression|\bols\b/.test(haystack)) {
    return {
      view: "paths",
      pathId: "spatial_statistics_planners",
      explainerId: "ols_gwr",
      topic: "Regression and GWR",
      rationale: "Layer metadata suggests regression diagnostics or GWR interpretation.",
    };
  }
  if (/ndvi|remote\s*sensing|raster|earth\s*observation|\beo\b|classification/.test(haystack)) {
    return {
      view: "paths",
      pathId: "environmental_resilience",
      explainerId: "ndvi",
      topic: "Remote sensing classification",
      rationale: "Layer metadata suggests remote-sensing or classification interpretation.",
    };
  }
  if (/building|cityjson|\b3d\b|vox|lod|extrusion/.test(haystack)) {
    return {
      view: "paths",
      pathId: "urban_modelling_3d",
      explainerId: "building_extrusion",
      topic: "3D and CityJSON LoD",
      rationale: "Layer metadata suggests building, voxel, or 3D interpretation.",
    };
  }
  if (/composite|indicator|sdg/.test(haystack)) {
    return {
      view: "paths",
      pathId: "sdg11_monitoring_reporting",
      explainerId: "composite_index",
      topic: "Composite indicator map output",
      rationale: "Layer metadata suggests indicator or composite-index interpretation.",
    };
  }
  if (registry.crsSummary.status !== "known") {
    return {
      view: "paths",
      pathId: "foundations_urban_analytics",
      topic: "CRS and projection",
      rationale: "Layer CRS is missing or uncertain, so the education link opens foundational spatial-analysis guidance.",
    };
  }
  return {
    view: "paths",
    pathId: "foundations_urban_analytics",
    topic: "Map evidence interpretation",
    rationale: "Map layer is eligible for a static education reference that explains evidence interpretation and QA caveats.",
  };
}

export function buildMapEducationReference(input: BuildMapEducationReferenceInput): MapEducationReference {
  const createdAt = isoNow(input.createdAt);
  const requestedAt = input.requestedAt ?? Date.parse(createdAt);
  const target = resolveEducationTarget(input.layer);
  const evidenceArtifactIds = collectLayerEvidenceArtifactIds(input.layer, input.evidenceArtifacts);
  const qa = buildOutputQA({ layer: input.layer, publicationReadiness: input.publicationReadiness });
  const provenance = buildProvenance({
    layer: input.layer,
    contextSummary: input.contextSummary,
    publicationManifest: input.publicationManifest,
    evidenceArtifactIds,
  });
  const referenceId = `map-education:${safeIdPart(input.layer.id)}:${safeIdPart(target.topic)}:${safeIdPart(createdAt)}`;
  const focusRequest: EducationFocusRequest = {
    view: target.view,
    pathId: target.pathId,
    requestedAt,
    ...(target.explainerId ? { explainerId: target.explainerId } : {}),
  };

  return {
    version: MAP_PUBLICATION_OUTPUT_BINDING_VERSION,
    referenceId,
    title: `${input.layer.name} education reference`,
    summary: `${target.topic} guidance reference for ${input.layer.name}; static link only, with map QA/provenance retained in metadata.`,
    topic: target.topic,
    bindingMode: "static-reference",
    isLive: false,
    liveStateLabel: "Static education reference; it does not subscribe to map state changes.",
    layerIds: [input.layer.id],
    evidenceArtifactIds,
    target: {
      view: target.view,
      pathId: target.pathId,
      ...(target.explainerId ? { explainerId: target.explainerId } : {}),
      rationale: target.rationale,
    },
    focusRequest,
    qa,
    provenance,
    metadata: {
      educationReferenceId: referenceId,
      educationTopic: target.topic,
      bindingMode: "static-reference",
      isLive: false,
      layerId: input.layer.id,
      educationPathId: target.pathId,
      ...(target.explainerId ? { educationExplainerId: target.explainerId } : {}),
      qaState: qa.state,
      publicationReadinessStatus: input.publicationReadiness?.status ?? normalizeLayerRegistryMetadata(input.layer).publicationReadiness.status,
      evidenceArtifactCount: evidenceArtifactIds.length,
      ...(input.publicationManifest?.manifestId ? { publicationManifestId: input.publicationManifest.manifestId } : {}),
    },
  };
}