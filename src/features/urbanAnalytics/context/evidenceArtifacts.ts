import type {
  CompletedAnalysisRun,
  UrbanDataFitnessProfile,
  UrbanEvidenceArtifact,
  UrbanEvidenceArtifactKind,
  UrbanEvidenceArtifactState,
  UrbanEvidenceProvenance,
  UrbanEvidenceQA,
  UrbanEvidenceQAState,
  UrbanEvidenceScalar,
  UrbanEvidenceSourceModule,
  UrbanIndicatorKind,
  UrbanTag,
} from '../lib/types';

export const MAX_URBAN_EVIDENCE_ARTIFACTS = 200;

const MAX_ID_LENGTH = 160;
const MAX_TITLE_LENGTH = 180;
const MAX_SUMMARY_LENGTH = 600;
const MAX_NOTE_LENGTH = 400;
const MAX_REFERENCE_COUNT = 64;
const MAX_TAG_COUNT = 24;

export interface UrbanEvidenceArtifactDraft {
  id?: string;
  artifactId?: string;
  kind: UrbanEvidenceArtifactKind;
  title: string;
  summary?: string;
  state?: UrbanEvidenceArtifactState;
  sourceModule: UrbanEvidenceSourceModule;
  sourceId?: string;
  linkedContextId?: string;
  linkedStudyAreaId?: string;
  linkedRunId?: string;
  linkedLayerIds?: string[];
  linkedFilePaths?: string[];
  linkedArtifactIds?: string[];
  cardId?: string;
  flowId?: UrbanEvidenceArtifact['flowId'];
  indicatorKind?: UrbanIndicatorKind;
  mapLayerId?: string;
  codeArtifactId?: string;
  reportInsertId?: string;
  dashboardBindingId?: string;
  educationLinkId?: string;
  tags?: UrbanTag[];
  provenance?: Partial<UrbanEvidenceProvenance>;
  qa?: Partial<UrbanEvidenceQA>;
  dataFitness?: UrbanDataFitnessProfile;
  metadata?: Record<string, UrbanEvidenceScalar>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UrbanEvidenceArtifactUpdate {
  title?: string;
  summary?: string;
  state?: UrbanEvidenceArtifactState;
  sourceId?: string | null;
  linkedContextId?: string | null;
  linkedStudyAreaId?: string | null;
  linkedRunId?: string | null;
  linkedLayerIds?: string[];
  linkedFilePaths?: string[];
  linkedArtifactIds?: string[];
  tags?: UrbanTag[];
  qa?: Partial<UrbanEvidenceQA>;
  dataFitness?: UrbanDataFitnessProfile | null;
  metadata?: Record<string, UrbanEvidenceScalar> | null;
  reportInsertId?: string | null;
  dashboardBindingId?: string | null;
  updatedAt?: string;
}

export interface CompletedRunEvidenceOptions {
  artifactId?: string;
  contextId?: string;
  studyAreaId?: string;
  sourceModule?: UrbanEvidenceSourceModule;
  createdAt?: string;
}

function now(): string {
  return new Date().toISOString();
}

function newArtifactId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `urban-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clipText(value: unknown, maxLength: number, fallback = ''): string {
  const text = typeof value === 'string' ? value.trim() : fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeNullableId(value: unknown): string | null {
  const id = clipText(value, MAX_ID_LENGTH);
  return id || null;
}

function normalizeIso(value: unknown, fallback = now()): string {
  if (typeof value === 'string') {
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

function mergeStringLists(...lists: Array<unknown>): string[] {
  const merged: string[] = [];
  for (const list of lists) {
    for (const id of normalizeStringList(list)) {
      if (!merged.includes(id)) merged.push(id);
      if (merged.length >= MAX_REFERENCE_COUNT) return merged;
    }
  }
  return merged;
}

function normalizeTags(value: unknown): UrbanTag[] {
  return normalizeStringList(value, MAX_TAG_COUNT) as UrbanTag[];
}

function normalizeConfidence(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}

function optionalId(value: unknown): string | undefined {
  return normalizeNullableId(value) ?? undefined;
}

function optionalText(value: unknown, maxLength = MAX_NOTE_LENGTH): string | undefined {
  return clipText(value, maxLength) || undefined;
}

function normalizeQa(input: Partial<UrbanEvidenceQA> | undefined): UrbanEvidenceQA {
  const qa: UrbanEvidenceQA = {
    state: input?.state ?? 'unvalidated',
    warnings: normalizeTextList(input?.warnings, MAX_REFERENCE_COUNT),
    limitations: normalizeTextList(input?.limitations, MAX_REFERENCE_COUNT),
  };
  const confidence = normalizeConfidence(input?.confidence);
  if (confidence !== undefined) qa.confidence = confidence;
  const reviewedAt = input?.reviewedAt ? normalizeIso(input.reviewedAt) : null;
  if (reviewedAt) qa.reviewedAt = reviewedAt;
  const reviewedBy = normalizeNullableId(input?.reviewedBy);
  if (reviewedBy) qa.reviewedBy = reviewedBy;
  const staleReason = clipText(input?.staleReason, MAX_NOTE_LENGTH);
  if (staleReason) qa.staleReason = staleReason;
  const invalidReason = clipText(input?.invalidReason, MAX_NOTE_LENGTH);
  if (invalidReason) qa.invalidReason = invalidReason;
  return qa;
}

function buildProvenance(
  draft: UrbanEvidenceArtifactDraft,
  createdAt: string,
  linkedLayerIds: string[],
  linkedFilePaths: string[],
  linkedArtifactIds: string[],
): UrbanEvidenceProvenance {
  const provenance: UrbanEvidenceProvenance = {
    sourceModule: draft.provenance?.sourceModule ?? draft.sourceModule,
    createdAt: normalizeIso(draft.provenance?.createdAt ?? createdAt, createdAt),
    layerIds: mergeStringLists(draft.provenance?.layerIds, linkedLayerIds),
    filePaths: mergeStringLists(draft.provenance?.filePaths, linkedFilePaths),
    inputArtifactIds: mergeStringLists(draft.provenance?.inputArtifactIds, linkedArtifactIds),
    parentArtifactIds: normalizeStringList(draft.provenance?.parentArtifactIds),
  };

  const sourceId = optionalId(draft.provenance?.sourceId ?? draft.sourceId);
  if (sourceId) provenance.sourceId = sourceId;
  const sourceTitle = optionalText(draft.provenance?.sourceTitle ?? draft.title, MAX_TITLE_LENGTH);
  if (sourceTitle) provenance.sourceTitle = sourceTitle;
  const sourceUri = optionalText(draft.provenance?.sourceUri);
  if (sourceUri) provenance.sourceUri = sourceUri;
  const contextId = optionalId(draft.provenance?.contextId ?? draft.linkedContextId);
  if (contextId) provenance.contextId = contextId;
  const runId = optionalId(draft.provenance?.runId ?? draft.linkedRunId);
  if (runId) provenance.runId = runId;
  const flowId = draft.provenance?.flowId ?? draft.flowId;
  if (flowId) provenance.flowId = flowId;
  const methodId = optionalId(draft.provenance?.methodId);
  if (methodId) provenance.methodId = methodId;
  const methodName = optionalText(draft.provenance?.methodName, MAX_TITLE_LENGTH);
  if (methodName) provenance.methodName = methodName;
  const notes = optionalText(draft.provenance?.notes);
  if (notes) provenance.notes = notes;
  return provenance;
}

function metadataOrUndefined(
  metadata: Record<string, UrbanEvidenceScalar> | undefined,
): Record<string, UrbanEvidenceScalar> | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;
  return { ...metadata };
}

export function createUrbanEvidenceArtifact(
  draft: UrbanEvidenceArtifactDraft,
): UrbanEvidenceArtifact {
  const id = normalizeNullableId(draft.id) ?? normalizeNullableId(draft.artifactId) ?? newArtifactId();
  const createdAt = normalizeIso(draft.createdAt);
  const updatedAt = normalizeIso(draft.updatedAt, createdAt);
  const title = clipText(draft.title, MAX_TITLE_LENGTH, draft.kind);
  const linkedLayerIds = mergeStringLists(draft.linkedLayerIds, draft.mapLayerId ? [draft.mapLayerId] : []);
  const linkedFilePaths = normalizeStringList(draft.linkedFilePaths);
  const linkedArtifactIds = normalizeStringList(draft.linkedArtifactIds);

  const artifact: UrbanEvidenceArtifact = {
    id,
    artifactId: id,
    kind: draft.kind,
    title: title || draft.kind,
    state: draft.state ?? 'active',
    sourceModule: draft.sourceModule,
    linkedLayerIds,
    linkedFilePaths,
    linkedArtifactIds,
    tags: normalizeTags(draft.tags),
    provenance: buildProvenance(draft, createdAt, linkedLayerIds, linkedFilePaths, linkedArtifactIds),
    qa: normalizeQa(draft.qa),
    createdAt,
    updatedAt,
  };

  const summary = optionalText(draft.summary, MAX_SUMMARY_LENGTH);
  if (summary) artifact.summary = summary;
  const sourceId = optionalId(draft.sourceId);
  if (sourceId) artifact.sourceId = sourceId;
  const linkedContextId = optionalId(draft.linkedContextId);
  if (linkedContextId) artifact.linkedContextId = linkedContextId;
  const linkedStudyAreaId = optionalId(draft.linkedStudyAreaId);
  if (linkedStudyAreaId) artifact.linkedStudyAreaId = linkedStudyAreaId;
  const linkedRunId = optionalId(draft.linkedRunId);
  if (linkedRunId) artifact.linkedRunId = linkedRunId;
  const cardId = optionalId(draft.cardId);
  if (cardId) artifact.cardId = cardId;
  if (draft.flowId) artifact.flowId = draft.flowId;
  if (draft.indicatorKind) artifact.indicatorKind = draft.indicatorKind;
  const mapLayerId = optionalId(draft.mapLayerId);
  if (mapLayerId) artifact.mapLayerId = mapLayerId;
  const codeArtifactId = optionalId(draft.codeArtifactId);
  if (codeArtifactId) artifact.codeArtifactId = codeArtifactId;
  const reportInsertId = optionalId(draft.reportInsertId);
  if (reportInsertId) artifact.reportInsertId = reportInsertId;
  const dashboardBindingId = optionalId(draft.dashboardBindingId);
  if (dashboardBindingId) artifact.dashboardBindingId = dashboardBindingId;
  const educationLinkId = optionalId(draft.educationLinkId);
  if (educationLinkId) artifact.educationLinkId = educationLinkId;
  if (draft.dataFitness) artifact.dataFitness = draft.dataFitness;

  const metadata = metadataOrUndefined(draft.metadata);
  if (metadata) artifact.metadata = metadata;
  return artifact;
}

function compareRecency(a: UrbanEvidenceArtifact, b: UrbanEvidenceArtifact): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function matchesArtifactId(artifact: UrbanEvidenceArtifact, id: string): boolean {
  return artifact.id === id || artifact.artifactId === id;
}

export function upsertUrbanEvidenceArtifact(
  artifacts: readonly UrbanEvidenceArtifact[],
  artifact: UrbanEvidenceArtifact,
): UrbanEvidenceArtifact[] {
  const filtered = artifacts.filter((entry) => !matchesArtifactId(entry, artifact.id));
  return [artifact, ...filtered].slice(0, MAX_URBAN_EVIDENCE_ARTIFACTS);
}

export function patchUrbanEvidenceArtifact(
  artifact: UrbanEvidenceArtifact,
  patch: UrbanEvidenceArtifactUpdate,
): UrbanEvidenceArtifact {
  const updatedAt = normalizeIso(patch.updatedAt, now());
  const next: UrbanEvidenceArtifact = { ...artifact, updatedAt };

  if (patch.title !== undefined) next.title = clipText(patch.title, MAX_TITLE_LENGTH, artifact.title);
  if (patch.summary !== undefined) {
    const summary = clipText(patch.summary, MAX_SUMMARY_LENGTH);
    if (summary) next.summary = summary;
    else delete next.summary;
  }
  if (patch.state) next.state = patch.state;
  if (patch.sourceId !== undefined) {
    const sourceId = normalizeNullableId(patch.sourceId);
    if (sourceId) next.sourceId = sourceId;
    else delete next.sourceId;
  }
  if (patch.linkedContextId !== undefined) {
    const contextId = normalizeNullableId(patch.linkedContextId);
    if (contextId) {
      next.linkedContextId = contextId;
      next.provenance = { ...next.provenance, contextId };
    } else {
      delete next.linkedContextId;
      next.provenance = { ...next.provenance };
      delete next.provenance.contextId;
    }
  }
  if (patch.linkedStudyAreaId !== undefined) {
    const studyAreaId = normalizeNullableId(patch.linkedStudyAreaId);
    if (studyAreaId) next.linkedStudyAreaId = studyAreaId;
    else delete next.linkedStudyAreaId;
  }
  if (patch.linkedRunId !== undefined) {
    const runId = normalizeNullableId(patch.linkedRunId);
    if (runId) {
      next.linkedRunId = runId;
      next.provenance = { ...next.provenance, runId };
    } else {
      delete next.linkedRunId;
      next.provenance = { ...next.provenance };
      delete next.provenance.runId;
    }
  }
  if (patch.linkedLayerIds) {
    next.linkedLayerIds = normalizeStringList(patch.linkedLayerIds);
    next.provenance = { ...next.provenance, layerIds: next.linkedLayerIds };
  }
  if (patch.linkedFilePaths) {
    next.linkedFilePaths = normalizeStringList(patch.linkedFilePaths);
    next.provenance = { ...next.provenance, filePaths: next.linkedFilePaths };
  }
  if (patch.linkedArtifactIds) {
    next.linkedArtifactIds = normalizeStringList(patch.linkedArtifactIds);
  }
  if (patch.tags) next.tags = normalizeTags(patch.tags);
  if (patch.qa) next.qa = normalizeQa({ ...next.qa, ...patch.qa });
  if (patch.dataFitness !== undefined) {
    if (patch.dataFitness) next.dataFitness = patch.dataFitness;
    else delete next.dataFitness;
  }
  if (patch.reportInsertId !== undefined) {
    const reportInsertId = normalizeNullableId(patch.reportInsertId);
    if (reportInsertId) next.reportInsertId = reportInsertId;
    else delete next.reportInsertId;
  }
  if (patch.dashboardBindingId !== undefined) {
    const dashboardBindingId = normalizeNullableId(patch.dashboardBindingId);
    if (dashboardBindingId) next.dashboardBindingId = dashboardBindingId;
    else delete next.dashboardBindingId;
  }
  if (patch.metadata !== undefined) {
    const metadata = patch.metadata === null ? undefined : metadataOrUndefined(patch.metadata);
    if (metadata) next.metadata = metadata;
    else delete next.metadata;
  }
  return next;
}

export function markUrbanEvidenceArtifactStale(
  artifact: UrbanEvidenceArtifact,
  reason = 'Artifact source may no longer match the active Urban Analytics context.',
): UrbanEvidenceArtifact {
  const warnings = [...artifact.qa.warnings, clipText(reason, MAX_NOTE_LENGTH)].filter(Boolean);
  return patchUrbanEvidenceArtifact(artifact, {
    state: 'stale',
    qa: {
      ...artifact.qa,
      state: 'stale' satisfies UrbanEvidenceQAState,
      warnings,
      staleReason: reason,
    },
  });
}

export function markUrbanEvidenceArtifactInvalid(
  artifact: UrbanEvidenceArtifact,
  reason = 'Artifact reference failed validation.',
): UrbanEvidenceArtifact {
  const warnings = [...artifact.qa.warnings, clipText(reason, MAX_NOTE_LENGTH)].filter(Boolean);
  return patchUrbanEvidenceArtifact(artifact, {
    state: 'invalid',
    qa: {
      ...artifact.qa,
      state: 'invalid' satisfies UrbanEvidenceQAState,
      warnings,
      invalidReason: reason,
    },
  });
}

export function selectUrbanEvidenceArtifactsByContext(
  artifacts: readonly UrbanEvidenceArtifact[],
  contextId: string | null | undefined,
): UrbanEvidenceArtifact[] {
  if (!contextId) return [];
  return artifacts
    .filter((artifact) => artifact.linkedContextId === contextId || artifact.provenance.contextId === contextId)
    .sort(compareRecency);
}

export function selectUrbanEvidenceArtifactsByRun(
  artifacts: readonly UrbanEvidenceArtifact[],
  runId: string | null | undefined,
): UrbanEvidenceArtifact[] {
  if (!runId) return [];
  return artifacts
    .filter((artifact) => artifact.linkedRunId === runId || artifact.provenance.runId === runId)
    .sort(compareRecency);
}

export function selectUrbanEvidenceArtifactsByKind(
  artifacts: readonly UrbanEvidenceArtifact[],
  kind: UrbanEvidenceArtifactKind,
): UrbanEvidenceArtifact[] {
  return artifacts.filter((artifact) => artifact.kind === kind).sort(compareRecency);
}

export function selectUrbanEvidenceArtifactsBySourceModule(
  artifacts: readonly UrbanEvidenceArtifact[],
  sourceModule: UrbanEvidenceSourceModule,
): UrbanEvidenceArtifact[] {
  return artifacts.filter((artifact) => artifact.sourceModule === sourceModule).sort(compareRecency);
}

export function selectRecentUrbanEvidenceArtifacts(
  artifacts: readonly UrbanEvidenceArtifact[],
  limit: number,
): UrbanEvidenceArtifact[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return [...artifacts].sort(compareRecency).slice(0, Math.floor(limit));
}

function collectRunLayerIds(run: CompletedAnalysisRun): string[] {
  const ids: string[] = [];
  for (const output of run.mapOutputs) {
    ids.push(output.id);
    ids.push(...(output.engineBridge?.sourceLayerIds ?? []));
  }
  return normalizeStringList(ids);
}

export function createUrbanEvidenceArtifactFromCompletedRun(
  run: CompletedAnalysisRun,
  options: CompletedRunEvidenceOptions = {},
): UrbanEvidenceArtifact {
  const createdAt = normalizeIso(options.createdAt ?? run.insertedAt);
  const linkedLayerIds = collectRunLayerIds(run);
  const sourceModule = options.sourceModule ?? 'urban-analytics';
  const provenance: UrbanEvidenceArtifactDraft['provenance'] = {
    sourceModule,
    createdAt,
    sourceId: run.runId,
    sourceTitle: run.label,
    runId: run.runId,
    flowId: run.flowId,
    layerIds: linkedLayerIds,
    filePaths: [],
    inputArtifactIds: [],
    parentArtifactIds: [],
    methodName: `Completed ${run.flowId} workflow run`,
    notes: 'Compatibility evidence record from CompletedAnalysisRun; outputs are referenced by ID only.',
  };
  if (options.contextId) provenance.contextId = options.contextId;

  const draft: UrbanEvidenceArtifactDraft = {
    id: options.artifactId ?? `urban-evidence-run-${run.runId}`,
    kind: 'workflow-run',
    title: run.label || `Workflow run ${run.runId}`,
    summary: run.paragraphPreview || run.paragraph,
    state: 'active',
    sourceModule,
    sourceId: run.runId,
    linkedRunId: run.runId,
    linkedLayerIds,
    flowId: run.flowId,
    provenance,
    qa: {
      state: 'unvalidated',
      warnings: [],
      limitations: [
        'Compatibility record references run outputs by ID only; inspect the source run before publication.',
      ],
    },
    metadata: {
      mapOutputCount: run.mapOutputs.length,
      chartOutputCount: run.chartOutputs.length,
      dataOutputCount: run.dataOutputs.length,
    },
    createdAt,
    updatedAt: createdAt,
  };
  if (options.contextId) draft.linkedContextId = options.contextId;
  if (options.studyAreaId) draft.linkedStudyAreaId = options.studyAreaId;
  return createUrbanEvidenceArtifact(draft);
}
