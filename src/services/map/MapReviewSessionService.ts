import type {
  MapLayerRegistryChangeDetail,
  OverlayLayerConfig,
  ViewportState,
} from "@/centerpanel/components/map/mapTypes";
import type {
  MapAnalysisRecommendation,
  MapAnalysisRecommendationState,
} from "./MapAnalysisRecommender";
import type { MapReportHandoffDraft } from "./MapReportHandoffService";
import type { MapScientificQAState } from "./MapScientificQA";
import type { MapReproducibilityManifest } from "@/centerpanel/components/map/mapTypes";
import type { PendingReportInsert } from "@/services/reporting/types";
import { downloadText } from "@/centerpanel/lib/download";

// v3: events carry first-class `sourceIds` (SourceHandle ids) and `runIds`
// (reproducibility manifest ids) so an exported audit can be fully
// reconstructed against source/layer/run/evidence references.
export const MAP_REVIEW_SESSION_VERSION = 3;
export const MAP_REVIEW_SESSION_EVENT_LIMIT = 400;

export type MapReviewTimelineEventType =
  | "snapshot"
  | "layer-change"
  | "query-run"
  | "analysis-dispatch"
  | "workflow-action"
  | "report-handoff"
  | "qa-event"
  | "recommendation"
  | "annotation"
  | "bookmark"
  | "action-status";

export type MapReviewTimelineEventStatus =
  | "recorded"
  | "proposed"
  | "previewed"
  | "applied"
  | "rejected"
  | "undone"
  | "acknowledged"
  | "resolved"
  | "failed";

export type MapReviewAuditCategory =
  | "session-snapshot"
  | "layer-import"
  | "layer-derived"
  | "source-restore"
  | "layer-registry"
  | "crs-correction"
  | "qa-run"
  | "workflow-preview"
  | "workflow-apply"
  | "export-report-handoff"
  | "urban-sync"
  | "ide-sync"
  | "nl-query-decision"
  | "voxcity-2d-3d-handoff"
  | "cartography-review"
  | "annotation-bookmark"
  | "action-audit";

export type MapReviewDetailValue =
  | string
  | number
  | boolean
  | null
  | MapReviewDetailValue[]
  | { [key: string]: MapReviewDetailValue };

export type MapReviewDetailRecord = Record<string, MapReviewDetailValue>;

export interface MapReviewLayerSnapshotSummary {
  layerId: string;
  name: string;
  visible: boolean;
  group: string;
  sourceKind: string | null;
  qaStatus: string | null;
  featureCount: number | null;
  geometryType: string | null;
  evidenceArtifactId: string | null;
}

export interface MapReviewSelectedFeatureSummary {
  layerId: string;
  selectedFeatureCount: number;
}

export interface MapReviewContextSnapshot {
  viewport: ViewportState;
  bounds: [number, number, number, number] | null;
  layerCount: number;
  visibleLayerIds: string[];
  layerSummaries: MapReviewLayerSnapshotSummary[];
  selectedFeatures: MapReviewSelectedFeatureSummary[];
  activeAoiId: string | null;
  activeAnalysisResultLayerIds: string[];
  qaStatus: string | null;
  qaIssueCount: number;
  recommendationCount: number;
}

export interface MapReviewUndoSummary {
  available: boolean;
  outcome?: string | undefined;
  actionLabel?: string | undefined;
}

export interface MapReviewTimelineEvent {
  id: string;
  version: number;
  type: MapReviewTimelineEventType;
  category: MapReviewAuditCategory;
  status: MapReviewTimelineEventStatus;
  timestamp: string;
  title: string;
  summary: string;
  layerIds: string[];
  sourceIds: string[];
  runIds: string[];
  evidenceArtifactIds: string[];
  reportItemIds: string[];
  qaIssueIds: string[];
  recommendationIds: string[];
  annotationIds: string[];
  bookmarkIds: string[];
  actionIds: string[];
  snapshot?: MapReviewContextSnapshot | undefined;
  undo?: MapReviewUndoSummary | undefined;
  details: MapReviewDetailRecord;
}

export interface MapReviewTimelineEventInput {
  id?: string;
  type: MapReviewTimelineEventType;
  category?: MapReviewAuditCategory;
  status?: MapReviewTimelineEventStatus;
  timestamp?: string;
  title: string;
  summary: string;
  layerIds?: string[];
  sourceIds?: string[];
  runIds?: string[];
  evidenceArtifactIds?: string[];
  reportItemIds?: string[];
  qaIssueIds?: string[];
  recommendationIds?: string[];
  annotationIds?: string[];
  bookmarkIds?: string[];
  actionIds?: string[];
  snapshot?: MapReviewContextSnapshot | undefined;
  undo?: MapReviewUndoSummary | undefined;
  details?: Record<string, unknown>;
}

export interface MapReviewSession {
  id: string;
  version: number;
  title: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  events: MapReviewTimelineEvent[];
  metadata: {
    generatedBy: "MapReviewSessionService";
    eventLimit: number;
    eventCounts: Record<MapReviewTimelineEventType, number>;
    categoryCounts: Record<MapReviewAuditCategory, number>;
    statusCounts: Record<MapReviewTimelineEventStatus, number>;
    sourceIds: string[];
    runIds: string[];
    evidenceArtifactIds: string[];
  };
}

export interface MapReviewSessionInput {
  id?: string;
  title?: string;
  projectId?: string | null;
  createdAt?: string;
  initialSnapshot?: MapReviewContextSnapshot;
}

export interface MapReviewTimelineFilters {
  type?: MapReviewTimelineEventType | "all";
  category?: MapReviewAuditCategory | "all";
  status?: MapReviewTimelineEventStatus | "all";
  layerId?: string | "all";
  sourceId?: string | "all";
  runId?: string | "all";
  evidenceArtifactId?: string | "all";
  reportItemId?: string | "all";
  startDate?: string | null;
  endDate?: string | null;
  query?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function uniqueStrings(values: readonly (string | null | undefined)[] | undefined, limit = 48): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function collectEvidenceArtifactIdsFromValue(value: unknown, depth = 0): string[] {
  if (depth > 5 || value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.slice(0, 64).flatMap((entry) => collectEvidenceArtifactIdsFromValue(entry, depth + 1));
  }
  if (!isPlainRecord(value)) {
    return [];
  }

  const ids: string[] = [];
  for (const [key, entry] of Object.entries(value).slice(0, 64)) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes("evidenceartifactid")) {
      if (typeof entry === "string") {
        ids.push(entry);
      } else if (Array.isArray(entry)) {
        ids.push(...entry.filter((item): item is string => typeof item === "string"));
      }
    }
    ids.push(...collectEvidenceArtifactIdsFromValue(entry, depth + 1));
  }
  return ids;
}

function collectEvidenceArtifactIdsFromSnapshot(snapshot?: MapReviewContextSnapshot): string[] {
  return uniqueStrings(snapshot?.layerSummaries.map((layer) => layer.evidenceArtifactId));
}

function getOverlayLayerEvidenceArtifactId(layer: OverlayLayerConfig): string | null {
  return layer.metadata?.evidenceArtifactId ?? layer.metadata?.analysisResult?.evidenceArtifactId ?? layer.metadata?.registry?.evidenceArtifactId ?? null;
}

function truncateText(value: string, limit = 600): string {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 3)}...`;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeDetailValue(value: unknown, depth = 0): MapReviewDetailValue {
  if (value == null) return null;
  if (typeof value === "string") return truncateText(value, 500);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 24).map((entry) => sanitizeDetailValue(entry, depth + 1));
  }
  if (depth >= 3 || !isPlainRecord(value)) return String(value);

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .slice(0, 24)
      .map((key) => [key, sanitizeDetailValue(value[key], depth + 1)]),
  );
}

function sanitizeDetails(details: Record<string, unknown> | undefined): MapReviewDetailRecord {
  if (!details) return {};
  return Object.fromEntries(
    Object.keys(details)
      .sort()
      .slice(0, 32)
      .map((key) => [key, sanitizeDetailValue(details[key])]),
  );
}

function createEventId(input: Pick<MapReviewTimelineEventInput, "type" | "title" | "timestamp" | "layerIds" | "reportItemIds" | "qaIssueIds" | "recommendationIds">): string {
  const timestamp = input.timestamp ?? nowIso();
  const idParts = [
    "map-review",
    timestamp,
    input.type,
    input.title,
    ...(input.layerIds ?? []),
    ...(input.reportItemIds ?? []),
    ...(input.qaIssueIds ?? []),
    ...(input.recommendationIds ?? []),
  ];
  return idParts.map((part) => sanitizeIdPart(String(part))).join(":");
}

function ensureUniqueEventId(events: readonly MapReviewTimelineEvent[], event: MapReviewTimelineEvent): MapReviewTimelineEvent {
  if (!events.some((entry) => entry.id === event.id)) {
    return event;
  }
  let suffix = 2;
  let id = `${event.id}:${suffix}`;
  while (events.some((entry) => entry.id === id)) {
    suffix += 1;
    id = `${event.id}:${suffix}`;
  }
  return { ...event, id };
}

function countBy<T extends string>(values: readonly T[], catalog: readonly T[]): Record<T, number> {
  const counts = Object.fromEntries(catalog.map((entry) => [entry, 0])) as Record<T, number>;
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export const MAP_REVIEW_EVENT_TYPES: readonly MapReviewTimelineEventType[] = [
  "snapshot",
  "layer-change",
  "query-run",
  "analysis-dispatch",
  "workflow-action",
  "report-handoff",
  "qa-event",
  "recommendation",
  "annotation",
  "bookmark",
  "action-status",
] as const;

export const MAP_REVIEW_EVENT_STATUSES: readonly MapReviewTimelineEventStatus[] = [
  "recorded",
  "proposed",
  "previewed",
  "applied",
  "rejected",
  "undone",
  "acknowledged",
  "resolved",
  "failed",
] as const;

export const MAP_REVIEW_AUDIT_CATEGORIES: readonly MapReviewAuditCategory[] = [
  "session-snapshot",
  "layer-import",
  "layer-derived",
  "source-restore",
  "layer-registry",
  "crs-correction",
  "qa-run",
  "workflow-preview",
  "workflow-apply",
  "export-report-handoff",
  "urban-sync",
  "ide-sync",
  "nl-query-decision",
  "voxcity-2d-3d-handoff",
  "cartography-review",
  "annotation-bookmark",
  "action-audit",
] as const;

function inferAuditCategory(input: MapReviewTimelineEventInput): MapReviewAuditCategory {
  if (input.category) {
    return input.category;
  }

  const status = input.status ?? "recorded";
  const detailsText = input.details ? stableStringify(input.details).toLowerCase() : "";
  const haystack = `${input.type} ${input.title} ${input.summary} ${status} ${detailsText}`.toLowerCase();

  if (includesAny(haystack, ["voxcity", "voxel", "2d/3d", "3d handoff", "vox city"])) {
    return "voxcity-2d-3d-handoff";
  }
  if (input.type === "snapshot") {
    return "session-snapshot";
  }
  if (input.type === "qa-event") {
    return "qa-run";
  }
  if (input.type === "query-run") {
    return "nl-query-decision";
  }
  if (input.type === "report-handoff") {
    return "export-report-handoff";
  }
  if (input.type === "annotation" || input.type === "bookmark") {
    return "annotation-bookmark";
  }
  if (input.type === "workflow-action") {
    return status === "previewed" || status === "proposed" ? "workflow-preview" : "workflow-apply";
  }
  if (input.type === "analysis-dispatch") {
    if (includesAny(haystack, ["urban", "analytics modal", "urban analytics"])) {
      return "urban-sync";
    }
    return status === "previewed" || status === "proposed" ? "workflow-preview" : "workflow-apply";
  }
  if (input.type === "layer-change") {
    if (includesAny(haystack, ["crs", "projection", "reproject", "epsg", "coordinate reference"])) {
      return "crs-correction";
    }
    if (includesAny(haystack, ["restore", "source handle", "recoverable", "unavailable source", "re-link"])) {
      return "source-restore";
    }
    if (includesAny(haystack, ["import", "external service", "service layer", "upload"])) {
      return "layer-import";
    }
    if (includesAny(haystack, ["derived", "analysis result", "workflow output", "buffer", "classification"])) {
      return "layer-derived";
    }
    if (includesAny(haystack, ["style", "symbology", "palette", "legend", "ramp", "cartograph"])) {
      return "cartography-review";
    }
    return "layer-registry";
  }
  if (input.type === "recommendation") {
    return includesAny(haystack, ["cartograph", "style", "palette", "legend"]) ? "cartography-review" : "action-audit";
  }
  if (input.type === "action-status") {
    if (includesAny(haystack, ["urban", "analytics modal", "urban analytics"])) {
      return "urban-sync";
    }
    if (includesAny(haystack, ["ide", "synapse", "code artifact", "editor"])) {
      return "ide-sync";
    }
  }

  return "action-audit";
}

function sessionMetadata(events: readonly MapReviewTimelineEvent[]): MapReviewSession["metadata"] {
  return {
    generatedBy: "MapReviewSessionService",
    eventLimit: MAP_REVIEW_SESSION_EVENT_LIMIT,
    eventCounts: countBy(events.map((event) => event.type), MAP_REVIEW_EVENT_TYPES),
    categoryCounts: countBy(events.map((event) => event.category), MAP_REVIEW_AUDIT_CATEGORIES),
    statusCounts: countBy(events.map((event) => event.status), MAP_REVIEW_EVENT_STATUSES),
    sourceIds: uniqueStrings(events.flatMap((event) => event.sourceIds), 200),
    runIds: uniqueStrings(events.flatMap((event) => event.runIds), 200),
    evidenceArtifactIds: uniqueStrings(events.flatMap((event) => event.evidenceArtifactIds), 200),
  };
}

function sortEvents(events: readonly MapReviewTimelineEvent[]): MapReviewTimelineEvent[] {
  return [...events].sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.id.localeCompare(right.id));
}

export function createMapReviewEvent(input: MapReviewTimelineEventInput): MapReviewTimelineEvent {
  const timestamp = input.timestamp ?? nowIso();
  const layerIds = uniqueStrings(input.layerIds);
  const evidenceArtifactIds = uniqueStrings(
    [
      ...(input.evidenceArtifactIds ?? []),
      ...collectEvidenceArtifactIdsFromValue(input.details),
      ...collectEvidenceArtifactIdsFromSnapshot(input.snapshot),
    ],
    80,
  );
  const reportItemIds = uniqueStrings(input.reportItemIds);
  const qaIssueIds = uniqueStrings(input.qaIssueIds);
  const recommendationIds = uniqueStrings(input.recommendationIds);
  return {
    id: input.id ?? createEventId({ ...input, timestamp, layerIds, reportItemIds, qaIssueIds, recommendationIds }),
    version: MAP_REVIEW_SESSION_VERSION,
    type: input.type,
    category: inferAuditCategory(input),
    status: input.status ?? "recorded",
    timestamp,
    title: truncateText(input.title, 140),
    summary: truncateText(input.summary, 500),
    layerIds,
    sourceIds: uniqueStrings(input.sourceIds),
    runIds: uniqueStrings(input.runIds),
    evidenceArtifactIds,
    reportItemIds,
    qaIssueIds,
    recommendationIds,
    annotationIds: uniqueStrings(input.annotationIds),
    bookmarkIds: uniqueStrings(input.bookmarkIds),
    actionIds: uniqueStrings(input.actionIds),
    ...(input.snapshot ? { snapshot: input.snapshot } : {}),
    ...(input.undo ? { undo: input.undo } : {}),
    details: sanitizeDetails(input.details),
  };
}

export function createMapReviewSession(input: MapReviewSessionInput = {}): MapReviewSession {
  const createdAt = input.createdAt ?? nowIso();
  const projectId = input.projectId ?? null;
  const baseSession: MapReviewSession = {
    id: input.id ?? `map-review-session-${sanitizeIdPart(projectId ?? "workspace")}-${sanitizeIdPart(createdAt)}`,
    version: MAP_REVIEW_SESSION_VERSION,
    title: input.title ?? "Map review session",
    projectId,
    createdAt,
    updatedAt: createdAt,
    events: [],
    metadata: sessionMetadata([]),
  };

  if (!input.initialSnapshot) {
    return baseSession;
  }

  return appendMapReviewEvent(baseSession, {
    type: "snapshot",
    status: "recorded",
    timestamp: createdAt,
    title: "Review session started",
    summary: "Initial map context snapshot captured for collaborative review.",
    snapshot: input.initialSnapshot,
  });
}

export function appendMapReviewEvent(session: MapReviewSession, input: MapReviewTimelineEventInput): MapReviewSession {
  const event = ensureUniqueEventId(session.events, createMapReviewEvent(input));
  const events = sortEvents([...session.events, event]).slice(-MAP_REVIEW_SESSION_EVENT_LIMIT);
  return {
    ...session,
    updatedAt: event.timestamp,
    events,
    metadata: sessionMetadata(events),
  };
}

export function updateMapReviewEventStatus(
  session: MapReviewSession,
  eventId: string,
  status: MapReviewTimelineEventStatus,
  options: { outcome?: string; timestamp?: string } = {},
): MapReviewSession {
  const timestamp = options.timestamp ?? nowIso();
  const events = session.events.map((event) => {
    if (event.id !== eventId) return event;
    return {
      ...event,
      status,
      undo: event.undo
        ? { ...event.undo, ...(options.outcome ? { outcome: options.outcome } : {}) }
        : options.outcome
          ? { available: false, outcome: options.outcome }
          : event.undo,
      details: {
        ...event.details,
        statusUpdatedAt: timestamp,
      },
    };
  });
  return {
    ...session,
    updatedAt: timestamp,
    events,
    metadata: sessionMetadata(events),
  };
}

export function buildMapReviewContextSnapshot(input: {
  overlayLayers: OverlayLayerConfig[];
  viewport: ViewportState;
  currentMapBounds?: [number, number, number, number] | null;
  selectedFeatureIds?: Record<string, string[]>;
  activeAoiId?: string | null;
  activeAnalysisResultLayerIds?: string[];
  scientificQA?: MapScientificQAState | null;
  recommendationCount?: number;
}): MapReviewContextSnapshot {
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  return {
    viewport: {
      center: [...input.viewport.center] as [number, number],
      zoom: input.viewport.zoom,
      bearing: input.viewport.bearing,
      pitch: input.viewport.pitch,
    },
    bounds: input.currentMapBounds ?? null,
    layerCount: input.overlayLayers.length,
    visibleLayerIds: visibleLayers.map((layer) => layer.id),
    layerSummaries: input.overlayLayers.map((layer) => ({
      layerId: layer.id,
      name: layer.name,
      visible: layer.visible,
      group: layer.group ?? "data",
      sourceKind: layer.sourceKind ?? null,
      qaStatus: layer.metadata?.scientificQA?.status ?? layer.qaStatus ?? null,
      featureCount: layer.metadata?.featureCount ?? null,
      geometryType: layer.metadata?.geometryType ?? null,
      evidenceArtifactId: getOverlayLayerEvidenceArtifactId(layer),
    })),
    selectedFeatures: Object.entries(input.selectedFeatureIds ?? {})
      .filter(([, ids]) => ids.length > 0)
      .map(([layerId, ids]) => ({ layerId, selectedFeatureCount: ids.length })),
    activeAoiId: input.activeAoiId ?? null,
    activeAnalysisResultLayerIds: uniqueStrings(input.activeAnalysisResultLayerIds),
    qaStatus: input.scientificQA?.status ?? null,
    qaIssueCount: input.scientificQA?.issues.filter((issue) => issue.severity !== "info").length ?? 0,
    recommendationCount: input.recommendationCount ?? 0,
  };
}

export function buildLayerRegistryReviewEvent(
  detail: MapLayerRegistryChangeDetail,
  snapshot?: MapReviewContextSnapshot,
): MapReviewTimelineEventInput {
  const layer = detail.layerId
    ? detail.layers.find((entry) => entry.layerId === detail.layerId)
      ?? detail.previousLayers.find((entry) => entry.layerId === detail.layerId)
    : null;
  const operationLabel = detail.operation.replace(/-/g, " ");
  const layerIds = detail.layerId ? [detail.layerId] : detail.layers.map((entry) => entry.layerId);
  const sourceKind = layer?.sourceKind?.toLowerCase() ?? "";
  const evidenceArtifactIds = uniqueStrings(
    [
      layer?.evidenceArtifactId,
      ...(detail.layerId
        ? [
          ...detail.layers.filter((entry) => entry.layerId === detail.layerId).map((entry) => entry.evidenceArtifactId),
          ...detail.previousLayers.filter((entry) => entry.layerId === detail.layerId).map((entry) => entry.evidenceArtifactId),
        ]
        : detail.layers.map((entry) => entry.evidenceArtifactId)),
    ],
    80,
  );
  const category: MapReviewAuditCategory = sourceKind.includes("import") || sourceKind.includes("external")
    ? "layer-import"
    : sourceKind.includes("derived") || sourceKind.includes("analysis") || layer?.group === "analysis"
      ? "layer-derived"
      : "layer-registry";
  return {
    type: "layer-change",
    category,
    status: "recorded",
    timestamp: detail.timestamp,
    title: layer ? `Layer ${operationLabel}: ${layer.name}` : `Layer stack ${operationLabel}`,
    summary: `Layer registry ${operationLabel} recorded with ${detail.layers.filter((entry) => entry.visible).length} visible layer(s) out of ${detail.layers.length}.`,
    layerIds,
    evidenceArtifactIds,
    snapshot,
    details: {
      operation: detail.operation,
      affectedLayerName: layer?.name ?? null,
      auditCategory: category,
      visibleLayerCount: detail.layers.filter((entry) => entry.visible).length,
      totalLayerCount: detail.layers.length,
    },
  };
}

export function buildScientificQAReviewEvent(
  qa: MapScientificQAState,
  snapshot?: MapReviewContextSnapshot,
): MapReviewTimelineEventInput {
  const warningCount = qa.metadata.issueCounts.warning;
  const blockerCount = qa.metadata.issueCounts.blocker + qa.metadata.issueCounts.error;
  const status: MapReviewTimelineEventStatus = qa.status === "passed" ? "resolved" : "recorded";
  return {
    type: "qa-event",
    category: "qa-run",
    status,
    timestamp: qa.checkedAt,
    title: qa.status === "passed" ? "Scientific QA passed" : "Scientific QA caveats recorded",
    summary: qa.status === "passed"
      ? "Visible map layers passed deterministic scientific QA checks for the current context."
      : `${blockerCount} blocker/error issue(s) and ${warningCount} warning(s) are visible in the current map context.`,
    layerIds: uniqueStrings(qa.issues.map((issue) => issue.layerId).filter((layerId): layerId is string => Boolean(layerId))),
    qaIssueIds: qa.issues.map((issue) => issue.id),
    snapshot,
    details: {
      status: qa.status,
      visibleLayerCount: qa.metadata.visibleLayerCount,
      workerLayerCount: qa.metadata.workerLayerCount,
      blockerCount,
      warningCount,
      signature: qa.metadata.signature,
    },
  };
}

export function buildRecommendationReviewEvent(
  state: MapAnalysisRecommendationState,
  snapshot?: MapReviewContextSnapshot,
): MapReviewTimelineEventInput | null {
  if (state.recommendations.length === 0) return null;
  const topRecommendations = state.recommendations.slice(0, 8);
  return {
    type: "recommendation",
    category: "cartography-review",
    status: "proposed",
    title: "Recommended next steps refreshed",
    summary: `${state.recommendations.length} explainable recommendation(s) generated from visible layers, selection, QA status, and map intent.`,
    recommendationIds: topRecommendations.map((recommendation) => recommendation.id),
    layerIds: uniqueStrings(topRecommendations.flatMap((recommendation) => recommendation.layerIds)),
    snapshot,
    details: {
      signature: state.metadata.signature,
      blocked: state.metadata.recommendationCounts.blocked,
      high: state.metadata.recommendationCounts.high,
      medium: state.metadata.recommendationCounts.medium,
      low: state.metadata.recommendationCounts.low,
      topTitles: topRecommendations.map((recommendation) => recommendation.title),
    },
  };
}

export function buildRecommendationActionReviewEvent(
  recommendation: MapAnalysisRecommendation,
  snapshot?: MapReviewContextSnapshot,
): MapReviewTimelineEventInput {
  return {
    type: "recommendation",
    category: "cartography-review",
    status: "applied",
    title: `Recommendation action: ${recommendation.title}`,
    summary: `${recommendation.actionLabel} was selected. Expected output: ${recommendation.expectedOutput}`,
    recommendationIds: [recommendation.id],
    layerIds: recommendation.layerIds,
    snapshot,
    details: {
      category: recommendation.category,
      severity: recommendation.severity,
      actionType: recommendation.action.type,
      scientificCaveat: recommendation.scientificCaveat,
      blockedByIssueIds: recommendation.blockedByIssueIds ?? [],
    },
  };
}

export function buildReportHandoffReviewEvent(
  draft: MapReportHandoffDraft,
  insert: PendingReportInsert,
  snapshot?: MapReviewContextSnapshot,
): MapReviewTimelineEventInput {
  const layerIds = draft.references
    .map((reference) => reference.layerId)
    .filter((layerId): layerId is string => Boolean(layerId));
  const evidenceArtifactIds = uniqueStrings(
    [
      ...draft.evidenceBlock.artifactIds,
      ...draft.evidenceBlock.payload.provenance.evidenceArtifactIds,
      ...draft.references.map((reference) =>
        typeof reference.metadata.evidenceArtifactId === "string" ? reference.metadata.evidenceArtifactId : null,
      ),
    ],
    80,
  );
  return {
    type: "report-handoff",
    category: "export-report-handoff",
    status: "applied",
    timestamp: draft.createdAt,
    title: `Report handoff inserted: ${draft.title}`,
    summary: `${insert.sections.length} report section(s) were inserted with ${draft.references.length} structured map reference(s), ${draft.citations.length} citation(s), and ${draft.caveats.length} caveat(s).`,
    layerIds,
    evidenceArtifactIds,
    reportItemIds: [draft.id, insert.id, ...insert.sections.map((section) => section.id)],
    snapshot,
    details: {
      scope: draft.scope,
      visibleLayerNames: draft.snapshot.visibleLayerNames,
      citationIds: draft.citations.map((citation) => citation.id),
      caveatCount: draft.caveats.length,
      publicationReadinessStatus: draft.publicationReadiness.status,
      publicationReadinessBlockers: draft.publicationReadiness.blockers.length,
      publicationReadinessWarnings: draft.publicationReadiness.warnings.length,
      reportInsertId: insert.id,
    },
  };
}

export interface MapSourceRestoreReviewInput {
  layerId: string;
  layerName: string;
  sourceId: string;
  restoreStatus: string;
  sourceKind?: string | null;
  evidenceArtifactId?: string | null;
  timestamp?: string;
}

/**
 * Source-handle restore audit (project reopen / re-link). Status reflects
 * whether the source resolved (`restored`), needs operator action
 * (`recoverable`/`metadata-only`), or is gone (`unavailable`/`stale-reference`).
 */
export function buildSourceRestoreReviewEvent(input: MapSourceRestoreReviewInput): MapReviewTimelineEventInput {
  const restoreStatus = input.restoreStatus.trim().toLowerCase();
  const resolved = restoreStatus === "restored" || restoreStatus === "available";
  const lost = restoreStatus === "unavailable" || restoreStatus === "stale-reference";
  const status: MapReviewTimelineEventStatus = resolved ? "resolved" : lost ? "failed" : "recorded";
  return {
    type: "layer-change",
    category: "source-restore",
    status,
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `Source restore (${restoreStatus}): ${input.layerName}`,
    summary: resolved
      ? `Source handle ${input.sourceId} was restored for ${input.layerName}.`
      : lost
        ? `Source handle ${input.sourceId} could not be restored for ${input.layerName}; the layer keeps metadata-only references.`
        : `Source handle ${input.sourceId} for ${input.layerName} is ${restoreStatus} and requires operator action to re-link.`,
    layerIds: [input.layerId],
    sourceIds: [input.sourceId],
    evidenceArtifactIds: input.evidenceArtifactId ? [input.evidenceArtifactId] : [],
    details: {
      restoreStatus,
      sourceId: input.sourceId,
      sourceKind: input.sourceKind ?? null,
    },
  };
}

export interface MapLayerStyleReviewInput {
  layerId: string;
  layerName: string;
  styleMode?: string;
  classificationMethod?: string | null;
  classCount?: number | null;
  sourceId?: string | null;
  evidenceArtifactId?: string | null;
  timestamp?: string;
}

/** Cartographic style / legend change applied to a layer. */
export function buildLayerStyleReviewEvent(input: MapLayerStyleReviewInput): MapReviewTimelineEventInput {
  const modeText = input.styleMode ? ` (${input.styleMode})` : "";
  return {
    type: "layer-change",
    category: "cartography-review",
    status: "applied",
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `Style applied${modeText}: ${input.layerName}`,
    summary: `Symbology updated for ${input.layerName}${input.classificationMethod ? ` using ${input.classificationMethod}` : ""}${typeof input.classCount === "number" ? ` across ${input.classCount} class(es)` : ""}.`,
    layerIds: [input.layerId],
    sourceIds: input.sourceId ? [input.sourceId] : [],
    evidenceArtifactIds: input.evidenceArtifactId ? [input.evidenceArtifactId] : [],
    details: {
      styleMode: input.styleMode ?? null,
      classificationMethod: input.classificationMethod ?? null,
      classCount: input.classCount ?? null,
    },
  };
}

export interface MapCrsCorrectionReviewInput {
  layerId: string;
  layerName: string;
  declaredCrs: string;
  provenance: "user-declared" | "reproject" | "detected";
  previousCrsStatus?: string | null;
  caveat?: string | null;
  sourceId?: string | null;
  timestamp?: string;
}

/** CRS declaration / reprojection correction recorded against a layer. */
export function buildCrsCorrectionReviewEvent(input: MapCrsCorrectionReviewInput): MapReviewTimelineEventInput {
  const verb = input.provenance === "reproject" ? "Reprojected" : "Declared CRS";
  return {
    type: "layer-change",
    category: "crs-correction",
    status: "applied",
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `${verb} ${input.declaredCrs}: ${input.layerName}`,
    summary: `${verb} ${input.declaredCrs} for ${input.layerName} (${input.provenance}).${input.caveat ? ` ${input.caveat}` : ""}`,
    layerIds: [input.layerId],
    sourceIds: input.sourceId ? [input.sourceId] : [],
    details: {
      declaredCrs: input.declaredCrs,
      provenance: input.provenance,
      previousCrsStatus: input.previousCrsStatus ?? null,
      caveat: input.caveat ?? null,
    },
  };
}

export interface MapAnalysisDispatchReviewInput {
  title: string;
  summary: string;
  method?: string;
  manifest?: MapReproducibilityManifest;
  inputLayerIds?: string[];
  outputLayerIds?: string[];
  runId?: string | null;
  evidenceArtifactIds?: string[];
  sourceIds?: string[];
  status?: MapReviewTimelineEventStatus;
  timestamp?: string;
  details?: Record<string, unknown>;
}

/**
 * Analysis dispatch / applied workflow. When a reproducibility manifest is
 * passed, run/layer references are derived from it so the audit always carries
 * the manifest id as the run reference.
 */
export function buildAnalysisDispatchReviewEvent(input: MapAnalysisDispatchReviewInput): MapReviewTimelineEventInput {
  const manifest = input.manifest;
  const runIds = uniqueStrings([input.runId, manifest?.manifestId]);
  const layerIds = uniqueStrings([
    ...(input.inputLayerIds ?? []),
    ...(input.outputLayerIds ?? []),
    ...(manifest?.inputLayerIds ?? []),
    ...(manifest?.outputLayerIds ?? []),
    ...(manifest?.sourceLayerIds ?? []),
  ]);
  const status: MapReviewTimelineEventStatus =
    input.status ?? (manifest?.status === "blocked" ? "failed" : manifest?.status === "preview" ? "previewed" : "applied");
  return {
    type: "analysis-dispatch",
    category: status === "previewed" || status === "proposed" ? "workflow-preview" : "workflow-apply",
    status,
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: input.title,
    summary: input.summary,
    layerIds,
    runIds,
    sourceIds: uniqueStrings(input.sourceIds),
    evidenceArtifactIds: uniqueStrings(input.evidenceArtifactIds),
    details: {
      ...(input.method ? { method: input.method } : {}),
      ...(manifest
        ? {
          workflowId: manifest.workflowId,
          operation: manifest.operation,
          workflowKind: manifest.workflowKind,
          manifestStatus: manifest.status,
        }
        : {}),
      ...(input.details ?? {}),
    },
  };
}

export interface MapExportReviewInput {
  format: string;
  scope?: string;
  layerIds?: string[];
  sourceIds?: string[];
  runIds?: string[];
  evidenceArtifactIds?: string[];
  reportItemIds?: string[];
  timestamp?: string;
  details?: Record<string, unknown>;
}

/** Map export / package download (GeoJSON, figure, package, review log, …). */
export function buildMapExportReviewEvent(input: MapExportReviewInput): MapReviewTimelineEventInput {
  const scopeText = input.scope ? ` (${input.scope})` : "";
  return {
    type: "action-status",
    category: "export-report-handoff",
    status: "applied",
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `Map export${scopeText}: ${input.format.toUpperCase()}`,
    summary: `Exported ${input.format.toUpperCase()}${input.scope ? ` for ${input.scope}` : ""} with referenced source/layer/run/evidence IDs preserved.`,
    layerIds: uniqueStrings(input.layerIds),
    sourceIds: uniqueStrings(input.sourceIds),
    runIds: uniqueStrings(input.runIds),
    evidenceArtifactIds: uniqueStrings(input.evidenceArtifactIds),
    reportItemIds: uniqueStrings(input.reportItemIds),
    details: {
      format: input.format,
      ...(input.scope ? { scope: input.scope } : {}),
      ...(input.details ?? {}),
    },
  };
}

export interface MapUrbanHandoffReviewInput {
  direction: "map-to-urban" | "urban-to-map";
  method?: string;
  requestId?: string | null;
  layerIds?: string[];
  sourceIds?: string[];
  runIds?: string[];
  evidenceArtifactIds?: string[];
  status?: MapReviewTimelineEventStatus;
  timestamp?: string;
  details?: Record<string, unknown>;
}

/** Urban Analytics handoff (Map → Urban context or Urban → Map method request). */
export function buildUrbanHandoffReviewEvent(input: MapUrbanHandoffReviewInput): MapReviewTimelineEventInput {
  const directionLabel = input.direction === "map-to-urban" ? "Map → Urban context" : "Urban → Map method request";
  return {
    type: "action-status",
    category: "urban-sync",
    status: input.status ?? "applied",
    ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    title: `Urban handoff: ${directionLabel}${input.method ? ` (${input.method})` : ""}`,
    summary: `${directionLabel}${input.method ? ` for ${input.method}` : ""} synced through the Map↔Urban bridge with attributed source/layer references.`,
    layerIds: uniqueStrings(input.layerIds),
    sourceIds: uniqueStrings(input.sourceIds),
    runIds: uniqueStrings(input.runIds),
    evidenceArtifactIds: uniqueStrings(input.evidenceArtifactIds),
    details: {
      direction: input.direction,
      ...(input.method ? { method: input.method } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
      ...(input.details ?? {}),
    },
  };
}

export function filterMapReviewTimelineEvents(
  session: MapReviewSession,
  filters: MapReviewTimelineFilters = {},
): MapReviewTimelineEvent[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const startTime = filters.startDate ? new Date(filters.startDate).getTime() : null;
  const endTime = filters.endDate ? new Date(filters.endDate).getTime() : null;
  return sortEvents(session.events).filter((event) => {
    if (filters.type && filters.type !== "all" && event.type !== filters.type) return false;
    if (filters.category && filters.category !== "all" && event.category !== filters.category) return false;
    if (filters.status && filters.status !== "all" && event.status !== filters.status) return false;
    if (filters.layerId && filters.layerId !== "all" && !event.layerIds.includes(filters.layerId)) return false;
    if (filters.sourceId && filters.sourceId !== "all" && !event.sourceIds.includes(filters.sourceId)) return false;
    if (filters.runId && filters.runId !== "all" && !event.runIds.includes(filters.runId)) return false;
    if (
      filters.evidenceArtifactId &&
      filters.evidenceArtifactId !== "all" &&
      !event.evidenceArtifactIds.includes(filters.evidenceArtifactId)
    ) {
      return false;
    }
    if (filters.reportItemId && filters.reportItemId !== "all" && !event.reportItemIds.includes(filters.reportItemId)) return false;
    const eventTime = new Date(event.timestamp).getTime();
    if (startTime != null && Number.isFinite(startTime) && eventTime < startTime) return false;
    if (endTime != null && Number.isFinite(endTime) && eventTime > endTime) return false;
    if (!query) return true;
    const haystack = [
      event.title,
      event.summary,
      event.type,
      event.category,
      event.status,
      ...event.layerIds,
      ...event.sourceIds,
      ...event.runIds,
      ...event.evidenceArtifactIds,
      ...event.reportItemIds,
      ...event.qaIssueIds,
      ...event.recommendationIds,
      ...event.actionIds,
      ...event.annotationIds,
      ...event.bookmarkIds,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function exportMapReviewSessionJson(session: MapReviewSession): string {
  const normalized: MapReviewSession = {
    ...session,
    events: sortEvents(session.events),
    metadata: sessionMetadata(session.events),
  };
  return `${stableStringify(normalized)}\n`;
}

function formatEventTime(value: string): string {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : value;
}

function formatList(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "None";
}

export function exportMapReviewSessionMarkdown(session: MapReviewSession): string {
  const events = sortEvents(session.events);
  const lines: string[] = [
    `# ${session.title}`,
    "",
    `- Session ID: ${session.id}`,
    `- Project ID: ${session.projectId ?? "None"}`,
    `- Created: ${formatEventTime(session.createdAt)}`,
    `- Updated: ${formatEventTime(session.updatedAt)}`,
    `- Event count: ${events.length}`,
    `- Source IDs: ${formatList(session.metadata.sourceIds)}`,
    `- Run IDs: ${formatList(session.metadata.runIds)}`,
    `- Evidence Artifact IDs: ${formatList(session.metadata.evidenceArtifactIds)}`,
    "",
    "## Event Summary",
    "",
    ...MAP_REVIEW_EVENT_TYPES
      .filter((type) => session.metadata.eventCounts[type] > 0)
      .map((type) => `- ${type}: ${session.metadata.eventCounts[type]}`),
    ...MAP_REVIEW_AUDIT_CATEGORIES
      .filter((category) => session.metadata.categoryCounts[category] > 0)
      .map((category) => `- ${category}: ${session.metadata.categoryCounts[category]}`),
    "",
    "## Timeline",
    "",
  ];

  for (const event of events) {
    lines.push(
      `### ${formatEventTime(event.timestamp)} - ${event.title}`,
      "",
      `- Type: ${event.type}`,
      `- Audit Category: ${event.category}`,
      `- Status: ${event.status}`,
      `- Summary: ${event.summary}`,
      `- Layer IDs: ${formatList(event.layerIds)}`,
      `- Source IDs: ${formatList(event.sourceIds)}`,
      `- Run IDs: ${formatList(event.runIds)}`,
      `- Evidence Artifact IDs: ${formatList(event.evidenceArtifactIds)}`,
      `- Report Item IDs: ${formatList(event.reportItemIds)}`,
      `- QA Issue IDs: ${formatList(event.qaIssueIds)}`,
      `- Recommendation IDs: ${formatList(event.recommendationIds)}`,
      `- Action IDs: ${formatList(event.actionIds)}`,
    );
    if (event.undo) {
      lines.push(`- Undo: ${event.undo.available ? "Available" : "Unavailable"}${event.undo.outcome ? `; ${event.undo.outcome}` : ""}`);
    }
    if (Object.keys(event.details).length > 0) {
      lines.push("", "```json", JSON.stringify(event.details, null, 2), "```");
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export function getMapReviewSessionExportFilename(session: MapReviewSession, extension: "json" | "md"): string {
  const datePart = sanitizeIdPart(session.updatedAt.slice(0, 19));
  return `${sanitizeIdPart(session.title)}-${datePart}.${extension}`;
}

export function triggerMapReviewSessionDownload(session: MapReviewSession, format: "json" | "markdown"): void {
  if (format === "json") {
    downloadText(
      getMapReviewSessionExportFilename(session, "json"),
      exportMapReviewSessionJson(session),
      "application/json;charset=utf-8",
    );
    return;
  }

  downloadText(
    getMapReviewSessionExportFilename(session, "md"),
    exportMapReviewSessionMarkdown(session),
    "text/markdown;charset=utf-8",
  );
}
