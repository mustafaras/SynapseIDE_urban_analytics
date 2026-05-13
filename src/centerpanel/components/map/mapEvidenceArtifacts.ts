/* ================================================================== */
/*  Map Evidence Artifact Helpers                                      */
/*                                                                     */
/*  Lightweight artifact records for Map Explorer evidence. These      */
/*  helpers intentionally store references, provenance, QA summaries,  */
/*  CRS summaries, and geometry summaries only. They never copy        */
/*  GeoJSON/sourceData, rendered canvases, screenshots, or raw tables. */
/* ================================================================== */

import type {
  DrawnFeature,
  LayerProvenance,
  LayerQaStatus,
  LayerScientificQACategorySummary,
  MapEvidenceArtifact,
  MapEvidenceArtifactKind,
  MapEvidenceArtifactState,
  MapEvidenceCrsSummary,
  MapEvidenceExportReference,
  MapEvidenceGeometrySummary,
  MapEvidenceProvenance,
  MapEvidenceQA,
  MapEvidenceQAState,
  MapEvidenceReportReference,
  MapEvidenceScalar,
  MapEvidenceSourceModule,
  MapScenarioComparisonEvidenceMetadata,
  MapTemporalEvidenceMetadata,
  MapVoxCitySyncMetadata,
  OverlayLayerConfig,
} from "./mapTypes";
import type {
  MapScientificQAIssue,
  MapScientificQAState,
} from "../../../services/map/MapScientificQA";

export const MAX_MAP_EVIDENCE_ARTIFACTS = 200;

const MAX_ID_LENGTH = 180;
const MAX_TITLE_LENGTH = 180;
const MAX_SUMMARY_LENGTH = 600;
const MAX_NOTE_LENGTH = 400;
const MAX_REFERENCE_COUNT = 80;
const MAP_DISPLAY_CRS = "EPSG:4326";

export interface MapEvidenceArtifactDraft {
  id?: string;
  artifactId?: string;
  kind: MapEvidenceArtifactKind;
  title: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceModule?: MapEvidenceSourceModule;
  sourceId?: string;
  linkedLayerIds?: string[];
  sourceLayerIds?: string[];
  derivedLayerId?: string;
  linkedAoiId?: string;
  linkedRunId?: string;
  linkedWorkflowId?: string;
  linkedFileIds?: string[];
  linkedArtifactIds?: string[];
  qaIssueIds?: string[];
  reportInsertId?: string;
  reportSnapshotId?: string;
  dashboardBindingId?: string;
  ideArtifactId?: string;
  urbanEvidenceId?: string;
  exportId?: string;
  tags?: string[];
  provenance?: Partial<MapEvidenceProvenance>;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MapEvidenceArtifactUpdate {
  title?: string;
  summary?: string | null;
  state?: MapEvidenceArtifactState;
  sourceId?: string | null;
  linkedLayerIds?: string[];
  sourceLayerIds?: string[];
  derivedLayerId?: string | null;
  linkedAoiId?: string | null;
  linkedRunId?: string | null;
  linkedWorkflowId?: string | null;
  linkedFileIds?: string[];
  linkedArtifactIds?: string[];
  qaIssueIds?: string[];
  reportInsertId?: string | null;
  reportSnapshotId?: string | null;
  dashboardBindingId?: string | null;
  ideArtifactId?: string | null;
  urbanEvidenceId?: string | null;
  exportId?: string | null;
  tags?: string[];
  provenance?: Partial<MapEvidenceProvenance>;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar> | null;
  updatedAt?: string;
}

export interface MapLayerEvidenceArtifactOptions {
  id?: string;
  title?: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceModule?: MapEvidenceSourceModule;
  linkedAoiId?: string;
  linkedRunId?: string;
  linkedWorkflowId?: string;
  linkedArtifactIds?: string[];
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
}

export interface MapAoiEvidenceArtifactOptions {
  id?: string;
  title?: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceModule?: MapEvidenceSourceModule;
  linkedLayerIds?: string[];
  linkedWorkflowId?: string;
  linkedRunId?: string;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
}

export interface MapWorkflowResultEvidenceArtifactInput {
  id?: string;
  title: string;
  summary?: string;
  workflowId: string;
  runId?: string;
  sourceLayerIds?: string[];
  derivedLayerId?: string;
  linkedLayerIds?: string[];
  linkedAoiId?: string;
  linkedArtifactIds?: string[];
  crsSummary?: Partial<MapEvidenceCrsSummary>;
  geometrySummary?: Partial<MapEvidenceGeometrySummary>;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
}

export interface MapTemporalEvidenceArtifactInput {
  temporal: MapTemporalEvidenceMetadata;
  id?: string;
  title?: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceLayerIds?: string[];
  linkedArtifactIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapScenarioComparisonEvidenceArtifactInput {
  scenarioComparison: MapScenarioComparisonEvidenceMetadata;
  id?: string;
  title?: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceLayerIds?: string[];
  linkedLayerIds?: string[];
  derivedLayerId?: string;
  linkedRunId?: string;
  linkedWorkflowId?: string;
  linkedArtifactIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapVoxCityHandoffEvidenceArtifactInput {
  voxCitySync: MapVoxCitySyncMetadata;
  id?: string;
  title?: string;
  summary?: string;
  state?: MapEvidenceArtifactState;
  sourceLayerIds?: string[];
  linkedLayerIds?: string[];
  derivedLayerId?: string;
  linkedRunId?: string;
  linkedArtifactIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapQAFindingEvidenceArtifactOptions {
  id?: string;
  title?: string;
  summary?: string;
  sourceLayerIds?: string[];
  linkedAoiId?: string;
  linkedWorkflowId?: string;
  linkedRunId?: string;
  metadata?: Record<string, MapEvidenceScalar>;
}

export interface MapExportEvidenceArtifactInput {
  id?: string;
  title: string;
  summary?: string;
  exportReference: Partial<MapEvidenceExportReference>;
  linkedLayerIds?: string[];
  sourceLayerIds?: string[];
  linkedAoiId?: string;
  linkedWorkflowId?: string;
  linkedRunId?: string;
  crsSummary?: Partial<MapEvidenceCrsSummary>;
  geometrySummary?: Partial<MapEvidenceGeometrySummary>;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
}

export interface MapReportSnapshotEvidenceArtifactInput {
  id?: string;
  title: string;
  summary?: string;
  reportReference: Partial<MapEvidenceReportReference>;
  linkedLayerIds?: string[];
  sourceLayerIds?: string[];
  linkedAoiId?: string;
  linkedWorkflowId?: string;
  linkedRunId?: string;
  qa?: Partial<MapEvidenceQA>;
  metadata?: Record<string, MapEvidenceScalar>;
  createdAt?: string;
}

function now(): string {
  return new Date().toISOString();
}

function newArtifactId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `map-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeReferencePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || "ref";
}

function clipText(value: unknown, maxLength: number, fallback = ""): string {
  const text = typeof value === "string" ? value.trim() : fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeNullableId(value: unknown): string | null {
  const id = clipText(value, MAX_ID_LENGTH);
  return id || null;
}

function optionalId(value: unknown): string | undefined {
  return normalizeNullableId(value) ?? undefined;
}

function optionalText(value: unknown, maxLength = MAX_NOTE_LENGTH): string | undefined {
  return clipText(value, maxLength) || undefined;
}

function normalizeIso(value: unknown, fallback = now()): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback;
}

function normalizeStringList(value: unknown, limit = MAX_REFERENCE_COUNT): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = normalizeNullableId(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= limit) break;
  }
  return ids;
}

function normalizeTextList(value: unknown, limit = MAX_REFERENCE_COUNT): string[] {
  if (!Array.isArray(value)) return [];
  const entries: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = clipText(item, MAX_NOTE_LENGTH);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    entries.push(text);
    if (entries.length >= limit) break;
  }
  return entries;
}

function normalizeCategorySummaries(value: unknown): LayerScientificQACategorySummary[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const summaries: LayerScientificQACategorySummary[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Partial<LayerScientificQACategorySummary>;
    const category = record.category;
    const severity = record.severity;
    if (
      category !== "crs"
      && category !== "geometry-validity"
      && category !== "schema"
      && category !== "scale"
      && category !== "missingness"
      && category !== "source-provenance"
      && category !== "attribution-license"
      && category !== "workflow-readiness"
      && category !== "export-readiness"
    ) continue;
    if (severity !== "pass" && severity !== "warning" && severity !== "blocked" && severity !== "unknown") continue;
    summaries.push({
      category,
      severity,
      issueIds: normalizeStringList(record.issueIds, 24),
      affectedLayerIds: normalizeStringList(record.affectedLayerIds, 24),
      reasons: normalizeTextList(record.reasons, 4),
      recommendedFixes: normalizeTextList(record.recommendedFixes, 4),
    });
    if (summaries.length >= 9) break;
  }
  return summaries.length > 0 ? summaries : undefined;
}

function mergeStringLists(...lists: unknown[]): string[] {
  const merged: string[] = [];
  for (const list of lists) {
    for (const id of normalizeStringList(list)) {
      if (!merged.includes(id)) merged.push(id);
      if (merged.length >= MAX_REFERENCE_COUNT) return merged;
    }
  }
  return merged;
}

function isScalar(value: unknown): value is MapEvidenceScalar {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeMetadata(
  metadata: Record<string, MapEvidenceScalar> | undefined,
): Record<string, MapEvidenceScalar> | undefined {
  if (!metadata) return undefined;
  const normalized: Record<string, MapEvidenceScalar> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = clipText(key, 80);
    if (!normalizedKey || !isScalar(value)) continue;
    normalized[normalizedKey] = value;
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeSourceLayerCrs(
  value: MapEvidenceCrsSummary["sourceLayerCrs"] | undefined,
): MapEvidenceCrsSummary["sourceLayerCrs"] {
  if (!Array.isArray(value)) return [];
  const entries: MapEvidenceCrsSummary["sourceLayerCrs"] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const layerId = normalizeNullableId(item.layerId);
    if (!layerId || seen.has(layerId)) continue;
    seen.add(layerId);
    const crs = optionalText(item.crs);
    entries.push({ layerId, crs: crs ?? null });
  }
  return entries;
}

function normalizeBounds(value: unknown): [number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined;
  const numbers = value.map((entry) => typeof entry === "number" && Number.isFinite(entry) ? entry : null);
  if (numbers.some((entry) => entry === null)) return undefined;
  return [numbers[0]!, numbers[1]!, numbers[2]!, numbers[3]!];
}

function normalizeCrsSummary(
  input: Partial<MapEvidenceCrsSummary> | undefined,
): MapEvidenceCrsSummary | undefined {
  if (!input) return undefined;
  const sourceLayerCrs = normalizeSourceLayerCrs(input.sourceLayerCrs);
  const missingLayerIds = normalizeStringList(input.missingLayerIds);
  const notes = normalizeTextList(input.notes);
  const declaredCrs = optionalText(input.declaredCrs);
  const displayCrs = optionalText(input.displayCrs);

  if (!declaredCrs && !displayCrs && sourceLayerCrs.length === 0 && missingLayerIds.length === 0 && notes.length === 0) {
    return undefined;
  }

  const summary: MapEvidenceCrsSummary = {
    sourceLayerCrs,
    missingLayerIds,
    notes,
  };
  if (declaredCrs) summary.declaredCrs = declaredCrs;
  if (displayCrs) summary.displayCrs = displayCrs;
  return summary;
}

function normalizeGeometrySummary(
  input: Partial<MapEvidenceGeometrySummary> | undefined,
): MapEvidenceGeometrySummary | undefined {
  if (!input) return undefined;
  const geometryTypes = normalizeStringList(input.geometryTypes);
  const notes = normalizeTextList(input.notes);
  const bounds = normalizeBounds(input.bounds);
  const featureCount = typeof input.featureCount === "number" && Number.isFinite(input.featureCount) && input.featureCount >= 0
    ? Math.floor(input.featureCount)
    : undefined;
  const vertexCount = typeof input.vertexCount === "number" && Number.isFinite(input.vertexCount) && input.vertexCount >= 0
    ? Math.floor(input.vertexCount)
    : undefined;

  if (geometryTypes.length === 0 && featureCount === undefined && vertexCount === undefined && !bounds && notes.length === 0) {
    return undefined;
  }

  const summary: MapEvidenceGeometrySummary = {
    geometryTypes,
    source: input.source ?? "unknown",
    notes,
  };
  if (featureCount !== undefined) summary.featureCount = featureCount;
  if (vertexCount !== undefined) summary.vertexCount = vertexCount;
  if (bounds) summary.bounds = bounds;
  return summary;
}

function normalizeExportReference(
  input: Partial<MapEvidenceExportReference> | undefined,
): MapEvidenceExportReference | undefined {
  if (!input) return undefined;
  const reference: MapEvidenceExportReference = {};
  const exportId = optionalId(input.exportId);
  const filename = optionalText(input.filename);
  const format = optionalText(input.format);
  const mimeType = optionalText(input.mimeType);
  const fileId = optionalId(input.fileId);
  if (exportId) reference.exportId = exportId;
  if (filename) reference.filename = filename;
  if (format) reference.format = format;
  if (mimeType) reference.mimeType = mimeType;
  if (fileId) reference.fileId = fileId;
  return Object.keys(reference).length > 0 ? reference : undefined;
}

function normalizeReportReference(
  input: Partial<MapEvidenceReportReference> | undefined,
): MapEvidenceReportReference | undefined {
  if (!input) return undefined;
  const reportInsertId = optionalId(input.reportInsertId);
  const reportDraftId = optionalId(input.reportDraftId);
  const snapshotAssetId = optionalId(input.snapshotAssetId);
  const sectionIds = normalizeStringList(input.sectionIds);
  if (!reportInsertId && !reportDraftId && !snapshotAssetId && sectionIds.length === 0) {
    return undefined;
  }
  const reference: MapEvidenceReportReference = { sectionIds };
  if (reportInsertId) reference.reportInsertId = reportInsertId;
  if (reportDraftId) reference.reportDraftId = reportDraftId;
  if (snapshotAssetId) reference.snapshotAssetId = snapshotAssetId;
  return reference;
}

function normalizeLayerProvenance(value: unknown): LayerProvenance[] {
  if (!Array.isArray(value)) return [];
  const entries: LayerProvenance[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<LayerProvenance>;
    const label = clipText(record.label, MAX_TITLE_LENGTH);
    if (!label) continue;
    const entry: LayerProvenance = { label };
    const sourceName = optionalText(record.sourceName, MAX_TITLE_LENGTH);
    const sourceUrl = optionalText(record.sourceUrl);
    const license = optionalText(record.license);
    const attribution = optionalText(record.attribution);
    const method = optionalText(record.method);
    const collectedAt = optionalText(record.collectedAt);
    const generatedAt = optionalText(record.generatedAt);
    const sourceLayerIds = normalizeStringList(record.sourceLayerIds);
    const notes = normalizeTextList(record.notes);
    if (sourceName) entry.sourceName = sourceName;
    if (sourceUrl) entry.sourceUrl = sourceUrl;
    if (license) entry.license = license;
    if (attribution) entry.attribution = attribution;
    if (method) entry.method = method;
    if (collectedAt) entry.collectedAt = collectedAt;
    if (generatedAt) entry.generatedAt = generatedAt;
    if (sourceLayerIds.length > 0) entry.sourceLayerIds = sourceLayerIds;
    if (notes.length > 0) entry.notes = notes;
    entries.push(entry);
  }
  return entries;
}

function qaStateFromLayerStatus(status: LayerQaStatus | undefined): MapEvidenceQAState {
  if (status === "passed") return "passed";
  if (status === "warning") return "warning";
  if (status === "error") return "error";
  return "unchecked";
}

function qaStateFromIssues(status: LayerQaStatus, issues: readonly MapScientificQAIssue[]): MapEvidenceQAState {
  if (issues.some((issue) => issue.severity === "blocker")) return "blocked";
  return qaStateFromLayerStatus(status);
}

function normalizeQa(
  input: Partial<MapEvidenceQA> | undefined,
  fallbackIssueIds: string[] = [],
): MapEvidenceQA {
  const issueIds = mergeStringLists(input?.issueIds, fallbackIssueIds);
  const caveats = normalizeTextList(input?.caveats);
  const issueCount = typeof input?.issueCount === "number" && Number.isFinite(input.issueCount) && input.issueCount >= 0
    ? Math.floor(input.issueCount)
    : issueIds.length;
  const blockerCount = typeof input?.blockerCount === "number" && Number.isFinite(input.blockerCount) && input.blockerCount >= 0
    ? Math.floor(input.blockerCount)
    : 0;

  const qa: MapEvidenceQA = {
    state: input?.state ?? "unchecked",
    issueIds,
    issueCount,
    blockerCount,
    caveats,
  };
  const categorySummaries = normalizeCategorySummaries(input?.categorySummaries);
  const checkedAt = input?.checkedAt ? normalizeIso(input.checkedAt) : undefined;
  const reviewedAt = input?.reviewedAt ? normalizeIso(input.reviewedAt) : undefined;
  const reviewedBy = optionalId(input?.reviewedBy);
  if (categorySummaries) qa.categorySummaries = categorySummaries;
  if (checkedAt) qa.checkedAt = checkedAt;
  if (reviewedAt) qa.reviewedAt = reviewedAt;
  if (reviewedBy) qa.reviewedBy = reviewedBy;
  return qa;
}

function buildProvenance(
  draft: MapEvidenceArtifactDraft,
  createdAt: string,
  sourceLayerIds: string[],
  derivedLayerId: string | undefined,
  qaIssueIds: string[],
): MapEvidenceProvenance {
  const provenanceInput = draft.provenance;
  const sourceModule = provenanceInput?.sourceModule ?? draft.sourceModule ?? "map-explorer";
  const exportReference = normalizeExportReference(provenanceInput?.exportReference);
  const reportReference = normalizeReportReference(provenanceInput?.reportReference);
  const crsSummary = normalizeCrsSummary(provenanceInput?.crsSummary);
  const geometrySummary = normalizeGeometrySummary(provenanceInput?.geometrySummary);
  const layerProvenance = normalizeLayerProvenance(provenanceInput?.layerProvenance);
  const inputArtifactIds = normalizeStringList(provenanceInput?.inputArtifactIds);
  const parentArtifactIds = mergeStringLists(provenanceInput?.parentArtifactIds, draft.linkedArtifactIds);
  const notes = normalizeTextList(provenanceInput?.notes);

  const provenance: MapEvidenceProvenance = {
    sourceModule,
    createdAt: normalizeIso(provenanceInput?.createdAt ?? createdAt, createdAt),
    sourceLayerIds,
    layerProvenance,
    inputArtifactIds,
    parentArtifactIds,
    notes,
  };
  const sourceName = optionalText(provenanceInput?.sourceName ?? draft.title, MAX_TITLE_LENGTH);
  const sourceKind = provenanceInput?.sourceKind;
  const sourceUrl = optionalText(provenanceInput?.sourceUrl);
  const license = optionalText(provenanceInput?.license);
  const updatedAt = provenanceInput?.updatedAt ? normalizeIso(provenanceInput.updatedAt, createdAt) : undefined;
  const method = optionalText(provenanceInput?.method);
  const workflowId = optionalId(provenanceInput?.workflowId ?? draft.linkedWorkflowId);
  const runId = optionalId(provenanceInput?.runId ?? draft.linkedRunId);
  if (sourceName) provenance.sourceName = sourceName;
  if (sourceKind) provenance.sourceKind = sourceKind;
  if (sourceUrl) provenance.sourceUrl = sourceUrl;
  if (license) provenance.license = license;
  if (updatedAt) provenance.updatedAt = updatedAt;
  if (method) provenance.method = method;
  if (derivedLayerId) provenance.derivedLayerId = derivedLayerId;
  if (crsSummary) provenance.crsSummary = crsSummary;
  if (geometrySummary) provenance.geometrySummary = geometrySummary;
  if (workflowId) provenance.workflowId = workflowId;
  if (runId) provenance.runId = runId;
  if (exportReference) provenance.exportReference = exportReference;
  if (reportReference) provenance.reportReference = reportReference;
  if (qaIssueIds.length > 0 && notes.length === 0) {
    provenance.notes = [`QA issue references: ${qaIssueIds.join(", ")}`];
  }
  return provenance;
}

export function createMapEvidenceArtifact(draft: MapEvidenceArtifactDraft): MapEvidenceArtifact {
  const id = normalizeNullableId(draft.id) ?? normalizeNullableId(draft.artifactId) ?? newArtifactId();
  const createdAt = normalizeIso(draft.createdAt);
  const updatedAt = normalizeIso(draft.updatedAt, createdAt);
  const title = clipText(draft.title, MAX_TITLE_LENGTH, draft.kind);
  const derivedLayerId = optionalId(draft.derivedLayerId ?? draft.provenance?.derivedLayerId);
  const sourceLayerIds = mergeStringLists(draft.sourceLayerIds, draft.provenance?.sourceLayerIds);
  const linkedLayerIds = mergeStringLists(
    draft.linkedLayerIds,
    sourceLayerIds,
    derivedLayerId ? [derivedLayerId] : [],
  );
  const linkedFileIds = normalizeStringList(draft.linkedFileIds);
  const linkedArtifactIds = normalizeStringList(draft.linkedArtifactIds);
  const qaIssueIds = mergeStringLists(draft.qaIssueIds, draft.qa?.issueIds);
  const sourceModule = draft.sourceModule ?? draft.provenance?.sourceModule ?? "map-explorer";
  const provenance = buildProvenance(draft, createdAt, sourceLayerIds, derivedLayerId, qaIssueIds);
  const qa = normalizeQa(draft.qa, qaIssueIds);

  const artifact: MapEvidenceArtifact = {
    id,
    artifactId: id,
    kind: draft.kind,
    title: title || draft.kind,
    state: draft.state ?? "active",
    sourceModule,
    linkedLayerIds,
    sourceLayerIds,
    linkedFileIds,
    linkedArtifactIds,
    qaIssueIds,
    tags: normalizeStringList(draft.tags, 24),
    provenance,
    qa,
    createdAt,
    updatedAt,
  };

  const summary = optionalText(draft.summary, MAX_SUMMARY_LENGTH);
  const sourceId = optionalId(draft.sourceId);
  const linkedAoiId = optionalId(draft.linkedAoiId);
  const linkedRunId = optionalId(draft.linkedRunId);
  const linkedWorkflowId = optionalId(draft.linkedWorkflowId);
  const reportInsertId = optionalId(draft.reportInsertId);
  const reportSnapshotId = optionalId(draft.reportSnapshotId);
  const dashboardBindingId = optionalId(draft.dashboardBindingId);
  const ideArtifactId = optionalId(draft.ideArtifactId);
  const urbanEvidenceId = optionalId(draft.urbanEvidenceId);
  const exportId = optionalId(draft.exportId);
  const metadata = normalizeMetadata(draft.metadata);
  if (summary) artifact.summary = summary;
  if (sourceId) artifact.sourceId = sourceId;
  if (derivedLayerId) artifact.derivedLayerId = derivedLayerId;
  if (linkedAoiId) artifact.linkedAoiId = linkedAoiId;
  if (linkedRunId) artifact.linkedRunId = linkedRunId;
  if (linkedWorkflowId) artifact.linkedWorkflowId = linkedWorkflowId;
  if (reportInsertId) artifact.reportInsertId = reportInsertId;
  if (reportSnapshotId) artifact.reportSnapshotId = reportSnapshotId;
  if (dashboardBindingId) artifact.dashboardBindingId = dashboardBindingId;
  if (ideArtifactId) artifact.ideArtifactId = ideArtifactId;
  if (urbanEvidenceId) artifact.urbanEvidenceId = urbanEvidenceId;
  if (exportId) artifact.exportId = exportId;
  if (metadata) artifact.metadata = metadata;
  return artifact;
}

function matchesArtifactId(artifact: MapEvidenceArtifact, id: string): boolean {
  return artifact.id === id || artifact.artifactId === id;
}

function compareRecency(a: MapEvidenceArtifact, b: MapEvidenceArtifact): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function upsertMapEvidenceArtifact(
  artifacts: readonly MapEvidenceArtifact[],
  artifact: MapEvidenceArtifact,
): MapEvidenceArtifact[] {
  const filtered = artifacts.filter((entry) => !matchesArtifactId(entry, artifact.id));
  return [artifact, ...filtered].slice(0, MAX_MAP_EVIDENCE_ARTIFACTS);
}

export function patchMapEvidenceArtifact(
  artifact: MapEvidenceArtifact,
  patch: MapEvidenceArtifactUpdate,
): MapEvidenceArtifact {
  const updatedAt = normalizeIso(patch.updatedAt, now());
  const next: MapEvidenceArtifact = { ...artifact, updatedAt };

  if (patch.title !== undefined) next.title = clipText(patch.title, MAX_TITLE_LENGTH, artifact.title);
  if (patch.summary !== undefined) {
    const summary = patch.summary === null ? "" : clipText(patch.summary, MAX_SUMMARY_LENGTH);
    if (summary) next.summary = summary;
    else delete next.summary;
  }
  if (patch.state) next.state = patch.state;
  if (patch.sourceId !== undefined) {
    const sourceId = normalizeNullableId(patch.sourceId);
    if (sourceId) next.sourceId = sourceId;
    else delete next.sourceId;
  }
  if (patch.sourceLayerIds) {
    next.sourceLayerIds = normalizeStringList(patch.sourceLayerIds);
    next.provenance = { ...next.provenance, sourceLayerIds: next.sourceLayerIds };
  }
  if (patch.derivedLayerId !== undefined) {
    const derivedLayerId = normalizeNullableId(patch.derivedLayerId);
    if (derivedLayerId) {
      next.derivedLayerId = derivedLayerId;
      next.provenance = { ...next.provenance, derivedLayerId };
    } else {
      delete next.derivedLayerId;
      next.provenance = { ...next.provenance };
      delete next.provenance.derivedLayerId;
    }
  }
  if (patch.linkedLayerIds) next.linkedLayerIds = normalizeStringList(patch.linkedLayerIds);
  if (patch.linkedAoiId !== undefined) {
    const linkedAoiId = normalizeNullableId(patch.linkedAoiId);
    if (linkedAoiId) next.linkedAoiId = linkedAoiId;
    else delete next.linkedAoiId;
  }
  if (patch.linkedRunId !== undefined) {
    const linkedRunId = normalizeNullableId(patch.linkedRunId);
    if (linkedRunId) {
      next.linkedRunId = linkedRunId;
      next.provenance = { ...next.provenance, runId: linkedRunId };
    } else {
      delete next.linkedRunId;
      next.provenance = { ...next.provenance };
      delete next.provenance.runId;
    }
  }
  if (patch.linkedWorkflowId !== undefined) {
    const linkedWorkflowId = normalizeNullableId(patch.linkedWorkflowId);
    if (linkedWorkflowId) {
      next.linkedWorkflowId = linkedWorkflowId;
      next.provenance = { ...next.provenance, workflowId: linkedWorkflowId };
    } else {
      delete next.linkedWorkflowId;
      next.provenance = { ...next.provenance };
      delete next.provenance.workflowId;
    }
  }
  if (patch.linkedFileIds) next.linkedFileIds = normalizeStringList(patch.linkedFileIds);
  if (patch.linkedArtifactIds) next.linkedArtifactIds = normalizeStringList(patch.linkedArtifactIds);
  if (patch.qaIssueIds) next.qaIssueIds = normalizeStringList(patch.qaIssueIds);
  if (patch.reportInsertId !== undefined) {
    const reportInsertId = normalizeNullableId(patch.reportInsertId);
    if (reportInsertId) next.reportInsertId = reportInsertId;
    else delete next.reportInsertId;
  }
  if (patch.reportSnapshotId !== undefined) {
    const reportSnapshotId = normalizeNullableId(patch.reportSnapshotId);
    if (reportSnapshotId) next.reportSnapshotId = reportSnapshotId;
    else delete next.reportSnapshotId;
  }
  if (patch.dashboardBindingId !== undefined) {
    const dashboardBindingId = normalizeNullableId(patch.dashboardBindingId);
    if (dashboardBindingId) next.dashboardBindingId = dashboardBindingId;
    else delete next.dashboardBindingId;
  }
  if (patch.ideArtifactId !== undefined) {
    const ideArtifactId = normalizeNullableId(patch.ideArtifactId);
    if (ideArtifactId) next.ideArtifactId = ideArtifactId;
    else delete next.ideArtifactId;
  }
  if (patch.urbanEvidenceId !== undefined) {
    const urbanEvidenceId = normalizeNullableId(patch.urbanEvidenceId);
    if (urbanEvidenceId) next.urbanEvidenceId = urbanEvidenceId;
    else delete next.urbanEvidenceId;
  }
  if (patch.exportId !== undefined) {
    const exportId = normalizeNullableId(patch.exportId);
    if (exportId) next.exportId = exportId;
    else delete next.exportId;
  }
  if (patch.tags) next.tags = normalizeStringList(patch.tags, 24);
  if (patch.provenance) {
    const provenanceDraft: MapEvidenceArtifactDraft = {
      ...next,
      provenance: { ...next.provenance, ...patch.provenance },
    };
    next.provenance = buildProvenance(
      provenanceDraft,
      next.createdAt,
      next.sourceLayerIds,
      next.derivedLayerId,
      next.qaIssueIds,
    );
  }
  if (patch.qa) next.qa = normalizeQa({ ...next.qa, ...patch.qa }, next.qaIssueIds);
  if (patch.metadata !== undefined) {
    const metadata = patch.metadata === null ? undefined : normalizeMetadata(patch.metadata);
    if (metadata) next.metadata = metadata;
    else delete next.metadata;
  }
  return next;
}

export function selectMapEvidenceArtifactsByLayer(
  artifacts: readonly MapEvidenceArtifact[],
  layerId: string | null | undefined,
): MapEvidenceArtifact[] {
  if (!layerId) return [];
  return artifacts
    .filter((artifact) =>
      artifact.linkedLayerIds.includes(layerId)
      || artifact.sourceLayerIds.includes(layerId)
      || artifact.derivedLayerId === layerId
      || artifact.provenance.sourceLayerIds.includes(layerId)
      || artifact.provenance.derivedLayerId === layerId,
    )
    .sort(compareRecency);
}

export function selectMapEvidenceArtifactsByAoi(
  artifacts: readonly MapEvidenceArtifact[],
  aoiId: string | null | undefined,
): MapEvidenceArtifact[] {
  if (!aoiId) return [];
  return artifacts.filter((artifact) => artifact.linkedAoiId === aoiId).sort(compareRecency);
}

export function selectMapEvidenceArtifactsByWorkflow(
  artifacts: readonly MapEvidenceArtifact[],
  workflowId: string | null | undefined,
): MapEvidenceArtifact[] {
  if (!workflowId) return [];
  return artifacts
    .filter((artifact) =>
      artifact.linkedWorkflowId === workflowId
      || artifact.provenance.workflowId === workflowId,
    )
    .sort(compareRecency);
}

export function selectMapEvidenceArtifactsBySource(
  artifacts: readonly MapEvidenceArtifact[],
  sourceModule: MapEvidenceSourceModule,
): MapEvidenceArtifact[] {
  return artifacts
    .filter((artifact) => artifact.sourceModule === sourceModule || artifact.provenance.sourceModule === sourceModule)
    .sort(compareRecency);
}

export function selectRecentMapEvidenceArtifacts(
  artifacts: readonly MapEvidenceArtifact[],
  limit: number,
): MapEvidenceArtifact[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return [...artifacts].sort(compareRecency).slice(0, Math.floor(limit));
}

function resolveLayerCrs(layer: OverlayLayerConfig): string | undefined {
  return optionalText(
    layer.metadata?.datasetContext?.crs
      ?? layer.metadata?.columnar?.crs
      ?? layer.metadata?.eoSource?.crs
      ?? layer.metadata?.externalService?.crs,
  );
}

function sourceLayerIdsFromLayer(layer: OverlayLayerConfig): string[] {
  return mergeStringLists(
    layer.metadata?.analysisResult?.sourceLayerIds,
    layer.provenance?.sourceLayerIds,
  );
}

function geometrySummaryFromLayer(layer: OverlayLayerConfig): MapEvidenceGeometrySummary {
  const geometryTypes = normalizeStringList(layer.metadata?.geometryType ? [layer.metadata.geometryType] : []);
  const notes = geometryTypes.length === 0 && layer.metadata?.featureCount === undefined && !layer.metadata?.bounds
    ? ["No layer geometry metadata was available; raw geometry was not copied into the artifact."]
    : [];
  const summary: MapEvidenceGeometrySummary = {
    geometryTypes,
    source: geometryTypes.length > 0 || layer.metadata?.featureCount !== undefined || layer.metadata?.bounds ? "metadata" : "unknown",
    notes,
  };
  if (typeof layer.metadata?.featureCount === "number" && Number.isFinite(layer.metadata.featureCount)) {
    summary.featureCount = Math.max(0, Math.floor(layer.metadata.featureCount));
  }
  if (layer.metadata?.bounds) {
    summary.bounds = layer.metadata.bounds;
  }
  return summary;
}

function crsSummaryFromLayer(layer: OverlayLayerConfig, sourceLayerIds: string[]): MapEvidenceCrsSummary {
  const declaredCrs = resolveLayerCrs(layer);
  const notes = [
    declaredCrs
      ? "Layer CRS metadata was copied as a scalar declaration only."
      : "Layer has no declared CRS metadata; analytical CRS readiness is unknown.",
    "Map Explorer display coordinates use EPSG:4326 and do not validate analytical CRS requirements.",
  ];
  const summary: MapEvidenceCrsSummary = {
    sourceLayerCrs: sourceLayerIds.map((layerId) => ({ layerId, crs: null })),
    missingLayerIds: sourceLayerIds,
    displayCrs: MAP_DISPLAY_CRS,
    notes,
  };
  if (declaredCrs) summary.declaredCrs = declaredCrs;
  return summary;
}

function qaFromLayer(layer: OverlayLayerConfig): MapEvidenceQA {
  const scientificQA = layer.metadata?.scientificQA;
  const qaState = qaStateFromLayerStatus(scientificQA?.status ?? layer.qaStatus);
  return normalizeQa({
    state: qaState,
    issueIds: scientificQA?.issueIds ?? [],
    issueCount: scientificQA?.issueIds.length ?? 0,
    blockerCount: qaState === "error" ? scientificQA?.issueIds.length ?? 1 : 0,
    caveats: scientificQA?.caveats ?? [],
    categorySummaries: scientificQA?.categorySummaries,
    checkedAt: scientificQA?.checkedAt,
  });
}

export function createMapLayerEvidenceArtifact(
  layer: OverlayLayerConfig,
  options: MapLayerEvidenceArtifactOptions = {},
): MapEvidenceArtifact {
  const createdAt = normalizeIso(options.createdAt ?? layer.metadata?.updatedAt ?? layer.provenance?.generatedAt);
  const sourceLayerIds = sourceLayerIdsFromLayer(layer);
  const derivedLayerId = layer.sourceKind === "derived" || layer.group === "analysis" ? layer.id : undefined;
  const layerQa = qaFromLayer(layer);
  return createMapEvidenceArtifact({
    id: options.id ?? `map-evidence-layer-${safeReferencePart(layer.id)}`,
    kind: "layer",
    title: options.title ?? layer.name,
    summary: options.summary ?? `Map layer evidence reference for ${layer.name}.`,
    state: options.state ?? "active",
    sourceModule: options.sourceModule ?? "map-explorer",
    sourceId: layer.id,
    linkedLayerIds: [layer.id],
    sourceLayerIds,
    derivedLayerId,
    linkedAoiId: options.linkedAoiId,
    linkedRunId: options.linkedRunId ?? layer.metadata?.analysisResult?.runId,
    linkedWorkflowId: options.linkedWorkflowId,
    linkedArtifactIds: options.linkedArtifactIds,
    qaIssueIds: layerQa.issueIds,
    provenance: {
      sourceModule: options.sourceModule ?? "map-explorer",
      sourceName: layer.provenance?.sourceName ?? layer.name,
      sourceKind: layer.sourceKind,
      sourceUrl: layer.provenance?.sourceUrl,
      license: layer.provenance?.license,
      createdAt,
      method: layer.metadata?.analysisResult?.engine ?? layer.provenance?.method,
      sourceLayerIds,
      derivedLayerId,
      crsSummary: crsSummaryFromLayer(layer, sourceLayerIds),
      geometrySummary: geometrySummaryFromLayer(layer),
      runId: layer.metadata?.analysisResult?.runId,
      layerProvenance: layer.provenance ? [layer.provenance] : [],
      notes: layer.provenance?.notes ?? [],
    },
    qa: { ...layerQa, ...options.qa },
    metadata: {
      ...(options.metadata ?? {}),
      layerType: layer.type,
      visible: layer.visible,
      opacity: layer.opacity,
      queryable: layer.queryable ?? (layer.type === "geojson" || layer.type === "heatmap"),
    },
    createdAt,
  });
}

function collectGeometryDetails(geometry: GeoJSON.Geometry): {
  geometryTypes: string[];
  vertexCount: number;
  bounds?: [number, number, number, number];
} {
  const geometryTypes = new Set<string>();
  let vertexCount = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const visitPosition = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
      const x = coords[0];
      const y = coords[1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      vertexCount += 1;
      return;
    }
    for (const child of coords) {
      visitPosition(child);
    }
  };

  const visitGeometry = (entry: GeoJSON.Geometry): void => {
    geometryTypes.add(entry.type);
    if (entry.type === "GeometryCollection") {
      for (const child of entry.geometries) {
        visitGeometry(child);
      }
      return;
    }
    visitPosition(entry.coordinates);
  };

  visitGeometry(geometry);
  const result = {
    geometryTypes: [...geometryTypes].sort(),
    vertexCount,
  };
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return result;
  }
  return { ...result, bounds: [minX, minY, maxX, maxY] };
}

export function createMapAoiEvidenceArtifact(
  aoi: DrawnFeature,
  options: MapAoiEvidenceArtifactOptions = {},
): MapEvidenceArtifact {
  const createdAt = normalizeIso(options.createdAt ?? aoi.properties.createdAt);
  const geometryDetails = collectGeometryDetails(aoi.geometry);
  const title = options.title ?? aoi.properties.label;
  return createMapEvidenceArtifact({
    id: options.id ?? `map-evidence-aoi-${safeReferencePart(aoi.id)}`,
    kind: "aoi",
    title,
    summary: options.summary ?? `Area-of-interest evidence reference for ${title}.`,
    state: options.state ?? "active",
    sourceModule: options.sourceModule ?? "map-explorer",
    sourceId: aoi.id,
    linkedLayerIds: options.linkedLayerIds,
    linkedAoiId: aoi.id,
    linkedWorkflowId: options.linkedWorkflowId,
    linkedRunId: options.linkedRunId,
    provenance: {
      sourceModule: options.sourceModule ?? "map-explorer",
      sourceName: title,
      sourceKind: "generated",
      createdAt,
      sourceLayerIds: [],
      crsSummary: {
        displayCrs: MAP_DISPLAY_CRS,
        sourceLayerCrs: [],
        missingLayerIds: [],
        notes: ["AOI was drawn in Map Explorer display coordinates; analytical CRS is not validated by this artifact."],
      },
      geometrySummary: {
        geometryTypes: geometryDetails.geometryTypes,
        featureCount: 1,
        vertexCount: geometryDetails.vertexCount,
        bounds: geometryDetails.bounds,
        source: "aoi-summary",
        notes: ["Artifact stores AOI id, geometry type, bbox, and vertex count only; raw coordinates remain in the map store."],
      },
    },
    qa: {
      state: "unchecked",
      issueIds: [],
      issueCount: 0,
      blockerCount: 0,
      caveats: [
        "AOI geometry summary does not establish suitability for area or distance calculations.",
        ...(options.qa?.caveats ?? []),
      ],
      ...options.qa,
    },
    metadata: options.metadata,
    createdAt,
  });
}

export function createMapWorkflowResultEvidenceArtifact(
  input: MapWorkflowResultEvidenceArtifactInput,
): MapEvidenceArtifact {
  const sourceLayerIds = normalizeStringList(input.sourceLayerIds);
  const derivedLayerId = optionalId(input.derivedLayerId);
  return createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-workflow-${safeReferencePart(input.workflowId)}-${safeReferencePart(input.runId ?? derivedLayerId ?? input.title)}`,
    kind: "workflow-result",
    title: input.title,
    summary: input.summary,
    state: input.qa?.state === "blocked" ? "blocked" : "active",
    sourceModule: "map-explorer",
    linkedLayerIds: mergeStringLists(input.linkedLayerIds, sourceLayerIds, derivedLayerId ? [derivedLayerId] : []),
    sourceLayerIds,
    derivedLayerId,
    linkedAoiId: input.linkedAoiId,
    linkedRunId: input.runId,
    linkedWorkflowId: input.workflowId,
    linkedArtifactIds: input.linkedArtifactIds,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: input.title,
      sourceKind: "derived",
      createdAt: input.createdAt,
      sourceLayerIds,
      derivedLayerId,
      workflowId: input.workflowId,
      runId: input.runId,
      crsSummary: input.crsSummary,
      geometrySummary: input.geometrySummary,
    },
    qa: input.qa,
    metadata: input.metadata,
    createdAt: input.createdAt,
  });
}

export function createMapTemporalEvidenceArtifact(
  input: MapTemporalEvidenceArtifactInput,
): MapEvidenceArtifact {
  const temporal = input.temporal;
  const sourceLayerIds = normalizeStringList([
    ...temporal.layerReferences.sourceLayerIds,
    ...(input.sourceLayerIds ?? []),
  ]);
  const derivedLayerId = optionalId(temporal.layerReferences.derivedLayerId ?? temporal.activeLayerId);
  const artifact = createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-temporal-${safeReferencePart(temporal.temporalEvidenceId)}`,
    kind: "temporal-state",
    title: input.title ?? `${temporal.layerName ?? temporal.activeLayerId} temporal playback`,
    summary: input.summary ?? `${temporal.frameCount} frame temporal playback, current frame ${temporal.step.index + 1}.`,
    state: input.state ?? (temporal.qa.state === "blocked" ? "blocked" : "active"),
    sourceModule: "map-explorer",
    sourceId: temporal.temporalEvidenceId,
    linkedLayerIds: mergeStringLists(
      [temporal.activeLayerId, temporal.layerReferences.layerId],
      sourceLayerIds,
      derivedLayerId ? [derivedLayerId] : [],
    ),
    sourceLayerIds,
    derivedLayerId,
    linkedArtifactIds: input.linkedArtifactIds,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: temporal.layerName ?? temporal.activeLayerId,
      sourceKind: "generated",
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      sourceLayerIds,
      derivedLayerId,
      method: "Temporal playback state capture",
      notes: [
        `Time field: ${temporal.timeField ?? "not declared"}.`,
        `Playback speed: ${temporal.playback.speed}x.`,
        ...temporal.caveats,
      ],
      geometrySummary: {
        geometryTypes: [],
        source: "unknown",
        notes: ["Temporal evidence records playback parameters and layer references only; frame geometry remains in the map source."],
      },
    },
    qa: {
      state: temporal.qa.state,
      issueIds: [],
      issueCount: 0,
      blockerCount: temporal.qa.state === "blocked" ? 1 : 0,
      caveats: [...temporal.qa.caveats, ...temporal.qa.uncertaintyNotes],
    },
    metadata: {
      temporalEvidenceId: temporal.temporalEvidenceId,
      activeLayerId: temporal.activeLayerId,
      sourceId: temporal.layerReferences.sourceId,
      layerId: temporal.layerReferences.layerId,
      mode: temporal.mode,
      frameCount: temporal.frameCount,
      currentStepIndex: temporal.step.index,
      currentStepKey: temporal.step.key ?? null,
      currentStepLabel: temporal.step.label ?? null,
      timeRangeStartKey: temporal.timeRange.startKey ?? null,
      timeRangeEndKey: temporal.timeRange.endKey ?? null,
      playbackSpeed: temporal.playback.speed,
      isPlaying: temporal.playback.isPlaying,
      timeField: temporal.timeField ?? null,
      sourceFieldCount: temporal.sourceFields.length,
      caveatCount: temporal.caveats.length,
    },
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });

  return { ...artifact, temporal };
}

export function createMapScenarioComparisonEvidenceArtifact(
  input: MapScenarioComparisonEvidenceArtifactInput,
): MapEvidenceArtifact {
  const scenarioComparison = input.scenarioComparison;
  const sourceLayerIds = normalizeStringList(input.sourceLayerIds);
  const linkedLayerIds = mergeStringLists(input.linkedLayerIds, scenarioComparison.outputLayerIds, sourceLayerIds);
  const derivedLayerId = optionalId(input.derivedLayerId ?? scenarioComparison.outputLayerIds[0]);
  const artifact = createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-scenario-${safeReferencePart(scenarioComparison.comparisonId)}`,
    kind: "scenario-comparison",
    title: input.title ?? `Scenario comparison ${scenarioComparison.baseline.label}`,
    summary: input.summary ?? `${scenarioComparison.candidates.length} candidate scenario(s), ${scenarioComparison.indicatorsCompared.length} indicator(s), guidance-only interpretation.`,
    state: input.state ?? "active",
    sourceModule: "map-explorer",
    sourceId: scenarioComparison.comparisonId,
    linkedLayerIds,
    sourceLayerIds,
    derivedLayerId,
    linkedRunId: input.linkedRunId ?? scenarioComparison.runId ?? undefined,
    linkedWorkflowId: "scenario_comparison",
    linkedArtifactIds: mergeStringLists(input.linkedArtifactIds, scenarioComparison.evidenceArtifactIds),
    dashboardBindingId: scenarioComparison.handoff.dashboardBindingId,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: input.title ?? "Scenario comparison",
      sourceKind: "generated",
      createdAt: input.createdAt ?? scenarioComparison.createdAt,
      updatedAt: input.updatedAt,
      sourceLayerIds,
      derivedLayerId,
      workflowId: "scenario_comparison",
      runId: input.linkedRunId ?? scenarioComparison.runId ?? undefined,
      method: "Map scenario comparison evidence registration",
      notes: [
        `Comparison metric: ${scenarioComparison.comparisonMetric.label}.`,
        `Policy interpretation mode: ${scenarioComparison.policyInterpretationMode}.`,
        ...scenarioComparison.uncertaintyNotes,
      ],
      geometrySummary: {
        geometryTypes: ["Polygon"],
        source: "workflow-summary",
        notes: ["Scenario comparison evidence keeps output layer ids and metric deltas by reference; raw map geometry remains in layer state."],
      },
    },
    qa: {
      state: scenarioComparison.uncertaintyNotes.length > 0 || scenarioComparison.limitations.length > 0 ? "warning" : "unchecked",
      issueIds: [],
      issueCount: 0,
      blockerCount: 0,
      caveats: [...scenarioComparison.uncertaintyNotes, ...scenarioComparison.limitations],
      checkedAt: scenarioComparison.createdAt,
    },
    metadata: {
      comparisonId: scenarioComparison.comparisonId,
      baselineLabel: scenarioComparison.baseline.label,
      candidateCount: scenarioComparison.candidates.length,
      indicatorCount: scenarioComparison.indicatorsCompared.length,
      activeScenarioId: scenarioComparison.activeScenarioId,
      comparisonMetricId: scenarioComparison.comparisonMetric.indicatorId,
      deltaMode: scenarioComparison.deltaMode,
      mapOutputCount: scenarioComparison.mapOutputIds.length,
      chartOutputCount: scenarioComparison.chartOutputIds.length,
      dataOutputCount: scenarioComparison.dataOutputIds.length,
      outputLayerCount: scenarioComparison.outputLayerIds.length,
      sourceRunCount: scenarioComparison.sourceRunIds.length,
      uncertaintyNoteCount: scenarioComparison.uncertaintyNotes.length,
      limitationCount: scenarioComparison.limitations.length,
      policyInterpretationMode: scenarioComparison.policyInterpretationMode,
      reportHandoffId: scenarioComparison.handoff.reportHandoffId,
      dashboardBindingId: scenarioComparison.handoff.dashboardBindingId,
      refreshMode: scenarioComparison.handoff.refreshMode,
    },
    createdAt: input.createdAt ?? scenarioComparison.createdAt,
    updatedAt: input.updatedAt,
  });

  return { ...artifact, scenarioComparison };
}

function sourceKindFromVoxCitySync(sync: MapVoxCitySyncMetadata): LayerSourceKind | "generated" {
  if (sync.source.runtimeMode === "sample" || sync.source.kind === "sample") return "demo";
  if (sync.source.kind === "cityjson") return "external";
  if (sync.source.kind === "map-layer") return "project";
  return "generated";
}

export function createMapVoxCityHandoffEvidenceArtifact(
  input: MapVoxCityHandoffEvidenceArtifactInput,
): MapEvidenceArtifact {
  const sync = input.voxCitySync;
  const sourceLayerIds = mergeStringLists(
    input.sourceLayerIds,
    sync.source.sourceLayerId ? [sync.source.sourceLayerId] : [],
    sync.mapLayerId && sync.mapLayerId !== sync.outputLayerId ? [sync.mapLayerId] : [],
  );
  const derivedLayerId = optionalId(input.derivedLayerId ?? sync.outputLayerId);
  const linkedLayerIds = mergeStringLists(
    input.linkedLayerIds,
    sync.mapLayerId ? [sync.mapLayerId] : [],
    sync.outputLayerId ? [sync.outputLayerId] : [],
    sourceLayerIds,
    derivedLayerId ? [derivedLayerId] : [],
  );
  const artifact = createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-voxcity-${safeReferencePart(sync.syncId)}`,
    kind: "voxcity-handoff",
    title: input.title ?? `${sync.source.title} VoxCity 2D/3D handoff`,
    summary: input.summary ?? `${sync.source.runtimeMode === "sample" ? "Sample-mode" : "Project"} VoxCity handoff with ${sync.selectedBuildingIds.length} selected building reference(s).`,
    state: input.state ?? (sync.qa.state === "blocked" ? "blocked" : "active"),
    sourceModule: "map-explorer",
    sourceId: sync.syncId,
    linkedLayerIds,
    sourceLayerIds,
    derivedLayerId,
    linkedRunId: input.linkedRunId ?? sync.linkedRunId,
    linkedWorkflowId: input.linkedWorkflowId ?? "voxcity_3d",
    linkedArtifactIds: mergeStringLists(input.linkedArtifactIds, sync.linkedArtifactIds),
    dashboardBindingId: sync.handoff.dashboardBindingId,
    ideArtifactId: sync.handoff.ideArtifactId,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: sync.source.title,
      sourceKind: sourceKindFromVoxCitySync(sync),
      sourceUrl: sync.source.sourceUrl ?? undefined,
      createdAt: input.createdAt ?? sync.createdAt,
      updatedAt: input.updatedAt,
      sourceLayerIds,
      derivedLayerId,
      workflowId: input.linkedWorkflowId ?? "voxcity_3d",
      runId: input.linkedRunId ?? sync.linkedRunId,
      method: "VoxCity 2D/3D sync reference registration",
      crsSummary: {
        declaredCrs: sync.projection.sourceCrs ?? undefined,
        displayCrs: sync.projection.targetCrs,
        sourceLayerCrs: sourceLayerIds.map((layerId) => ({
          layerId,
          crs: sync.source.crs,
        })),
        missingLayerIds: sync.source.crs ? [] : sourceLayerIds,
        notes: [
          `Projection mode: ${sync.projection.mode}.`,
          ...sync.projection.assumptions,
        ],
      },
      geometrySummary: {
        geometryTypes: ["Polygon"],
        featureCount: sync.source.featureCount,
        ...(sync.source.bbox ? { bounds: sync.source.bbox } : {}),
        source: "metadata",
        notes: [
          "VoxCity evidence stores source, building, voxel, and layer identifiers only; raw geometry, meshes, voxel grids, and feature collections remain in their owning stores.",
        ],
      },
      notes: [
        `Source reference: ${sync.source.sourceRef}.`,
        `Scenario reference: ${sync.scenarioId ?? "not declared"}.`,
        ...sync.caveats,
      ],
    },
    qa: {
      state: sync.qa.state,
      issueIds: [],
      issueCount: 0,
      blockerCount: sync.qa.state === "blocked" ? 1 : 0,
      caveats: [...sync.qa.caveats, ...sync.qa.uncertaintyNotes],
      checkedAt: sync.createdAt,
    },
    metadata: {
      voxCitySyncId: sync.syncId,
      mapLayerId: sync.mapLayerId,
      outputLayerId: sync.outputLayerId ?? null,
      sourceId: sync.source.id,
      sourceKind: sync.source.kind,
      runtimeMode: sync.source.runtimeMode,
      sourceRef: sync.source.sourceRef,
      sourceFeatureCount: sync.source.featureCount,
      selectedFeatureCount: sync.selectedFeatureIds.length,
      selectedBuildingCount: sync.selectedBuildingIds.length,
      buildingReferenceCount: sync.buildingReferences.length,
      voxelReferenceCount: sync.voxelReferences.length,
      scenarioId: sync.scenarioId ?? null,
      linkedRunId: sync.linkedRunId ?? null,
      projectionMode: sync.projection.mode,
      projectionSourceCrs: sync.projection.sourceCrs,
      projectionTargetCrs: sync.projection.targetCrs,
      sampleData: sync.qa.sampleData,
      qaState: sync.qa.state,
      reportHandoffId: sync.handoff.reportHandoffId,
      dashboardBindingId: sync.handoff.dashboardBindingId,
      ideArtifactId: sync.handoff.ideArtifactId,
    },
    createdAt: input.createdAt ?? sync.createdAt,
    updatedAt: input.updatedAt,
  });

  return { ...artifact, voxCitySync: sync };
}

export function createMapQAFindingEvidenceArtifact(
  qa: MapScientificQAState,
  options: MapQAFindingEvidenceArtifactOptions = {},
): MapEvidenceArtifact {
  const sourceLayerIds = mergeStringLists(
    options.sourceLayerIds,
    qa.issues.map((issue) => issue.layerId).filter((layerId): layerId is string => Boolean(layerId)),
  );
  const blockerCount = qa.issues.filter((issue) => issue.severity === "blocker" || issue.severity === "error").length;
  const warningCount = qa.issues.filter((issue) => issue.severity === "warning").length;
  const qaIssueIds = qa.issues.map((issue) => issue.id);
  return createMapEvidenceArtifact({
    id: options.id ?? `map-evidence-qa-${safeReferencePart(qa.metadata.signature)}`,
    kind: "qa-finding",
    title: options.title ?? (qa.status === "passed" ? "Map scientific QA passed" : "Map scientific QA findings"),
    summary: options.summary ?? `${qaIssueIds.length} QA issue reference(s), ${blockerCount} blocker/error issue(s), ${warningCount} warning issue(s).`,
    state: blockerCount > 0 ? "blocked" : "active",
    sourceModule: "map-explorer",
    sourceId: qa.metadata.signature,
    linkedLayerIds: sourceLayerIds,
    sourceLayerIds,
    linkedAoiId: options.linkedAoiId,
    linkedWorkflowId: options.linkedWorkflowId,
    linkedRunId: options.linkedRunId,
    qaIssueIds,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: "MapScientificQA",
      sourceKind: "generated",
      createdAt: qa.checkedAt,
      sourceLayerIds,
      crsSummary: {
        sourceLayerCrs: sourceLayerIds.map((layerId) => ({ layerId, crs: null })),
        missingLayerIds: sourceLayerIds,
        notes: ["QA artifact records issue references only; inspect source layers for CRS declarations."],
      },
      geometrySummary: {
        geometryTypes: [],
        source: "qa-summary",
        notes: ["QA artifact does not copy geometries or feature payloads."],
      },
      notes: [`QA signature: ${qa.metadata.signature}`],
    },
    qa: {
      state: qaStateFromIssues(qa.status, qa.issues),
      issueIds: qaIssueIds,
      issueCount: qaIssueIds.length,
      blockerCount,
      caveats: qa.issues.map((issue) => issue.title),
      categorySummaries: qa.metadata.categorySummaries ?? [],
      checkedAt: qa.checkedAt,
    },
    metadata: {
      ...(options.metadata ?? {}),
      visibleLayerCount: qa.metadata.visibleLayerCount,
      workerLayerCount: qa.metadata.workerLayerCount,
    },
    createdAt: qa.checkedAt,
  });
}

export function createMapExportEvidenceArtifact(
  input: MapExportEvidenceArtifactInput,
): MapEvidenceArtifact {
  const exportReference = normalizeExportReference(input.exportReference);
  const exportId = exportReference?.exportId ?? exportReference?.filename ?? input.title;
  return createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-export-${safeReferencePart(exportId)}`,
    kind: "publication-export",
    title: input.title,
    summary: input.summary,
    state: "published",
    sourceModule: "map-explorer",
    sourceId: exportReference?.exportId,
    linkedLayerIds: input.linkedLayerIds,
    sourceLayerIds: input.sourceLayerIds,
    linkedAoiId: input.linkedAoiId,
    linkedWorkflowId: input.linkedWorkflowId,
    linkedRunId: input.linkedRunId,
    linkedFileIds: exportReference?.fileId ? [exportReference.fileId] : [],
    exportId: exportReference?.exportId,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: input.title,
      sourceKind: "generated",
      createdAt: input.createdAt,
      sourceLayerIds: input.sourceLayerIds ?? [],
      exportReference,
      crsSummary: input.crsSummary,
      geometrySummary: input.geometrySummary,
    },
    qa: input.qa,
    metadata: input.metadata,
    createdAt: input.createdAt,
  });
}

export function createMapReportSnapshotEvidenceArtifact(
  input: MapReportSnapshotEvidenceArtifactInput,
): MapEvidenceArtifact {
  const reportReference = normalizeReportReference(input.reportReference);
  const reportId = reportReference?.reportInsertId ?? reportReference?.reportDraftId ?? reportReference?.snapshotAssetId ?? input.title;
  return createMapEvidenceArtifact({
    id: input.id ?? `map-evidence-report-${safeReferencePart(reportId)}`,
    kind: "report-snapshot",
    title: input.title,
    summary: input.summary,
    state: "published",
    sourceModule: "map-explorer",
    sourceId: reportReference?.reportDraftId ?? reportReference?.reportInsertId,
    linkedLayerIds: input.linkedLayerIds,
    sourceLayerIds: input.sourceLayerIds,
    linkedAoiId: input.linkedAoiId,
    linkedWorkflowId: input.linkedWorkflowId,
    linkedRunId: input.linkedRunId,
    reportInsertId: reportReference?.reportInsertId,
    reportSnapshotId: reportReference?.snapshotAssetId,
    provenance: {
      sourceModule: "map-explorer",
      sourceName: input.title,
      sourceKind: "generated",
      createdAt: input.createdAt,
      sourceLayerIds: input.sourceLayerIds ?? [],
      reportReference,
    },
    qa: input.qa,
    metadata: input.metadata,
    createdAt: input.createdAt,
  });
}
