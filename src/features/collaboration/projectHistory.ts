import type {
  ProjectRecentChange,
  ProjectRecord,
  ProjectReviewArtifactRef,
  ProjectReviewSnapshot,
  ProjectReviewSourceMode,
} from "@/centerpanel/registry/types";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import type {
  ProjectHistoryEventDetail,
  ProjectHistoryFeedItem,
  ProjectHistoryFeedOptions,
} from "./types";

export const PROJECT_HISTORY_EVENT = "project-history/record";
export const PROJECT_HISTORY_REFRESH_EVENT = "project-history/refreshed";
const MAX_PROJECT_HISTORY_ITEMS = 24;
const MAX_PROJECT_SNAPSHOTS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asIsoString(value: unknown, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const direct = asString(value);
  if (!direct) {
    return fallback;
  }
  const parsed = Date.parse(direct);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function asSourceMode(value: unknown): ProjectReviewSourceMode {
  return value === "real" || value === "demo" || value === "mixed" || value === "unknown"
    ? value
    : "unknown";
}

function asArtifact(value: unknown, fallbackKind: ProjectReviewArtifactRef["kind"], fallbackLabel: string): ProjectReviewArtifactRef {
  if (!isRecord(value)) {
    return { kind: fallbackKind, label: fallbackLabel };
  }
  const artifactId = asString(value.id);
  const artifactFlowId = asString(value.flowId);
  return {
    kind: value.kind === "note-slot" || value.kind === "report" || value.kind === "analysis-run" || value.kind === "snapshot"
      ? value.kind
      : fallbackKind,
    label: asString(value.label) ?? fallbackLabel,
    ...(artifactId ? { id: artifactId } : {}),
    ...(artifactFlowId ? { flowId: artifactFlowId } : {}),
  };
}

function trimHistory<T>(items: T[], maxItems: number): T[] {
  return items.slice(0, maxItems);
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeProjectSnapshots(value: unknown): ProjectReviewSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbackNow = new Date(0).toISOString();
  return trimHistory(value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const id = asString(entry.id) ?? createId("snapshot");
    const createdAt = asIsoString(entry.createdAt ?? entry.when, fallbackNow);
    const slots = isRecord(entry.slots)
      ? Object.fromEntries(
          Object.entries(entry.slots)
            .filter(([, slotValue]) => typeof slotValue === "string")
            .map(([slotId, slotValue]) => [slotId, String(slotValue)]),
        )
      : {};
    const label = asString(entry.label) ?? "Snapshot";
    const summary = asString(entry.summary)
      ?? Object.values(slots).find((slotValue) => slotValue.trim().length > 0)?.slice(0, 160)
      ?? "Snapshot created for report review.";
    return [{
      id,
      createdAt,
      label,
      summary,
      slots,
      sourceMode: asSourceMode(entry.sourceMode),
      artifact: asArtifact(entry.artifact, "snapshot", label),
    } satisfies ProjectReviewSnapshot];
  }).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)), MAX_PROJECT_SNAPSHOTS);
}

export function normalizeProjectRecentChanges(value: unknown): ProjectRecentChange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbackNow = new Date(0).toISOString();
  return trimHistory(value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const kind = entry.kind === "snapshot-created"
      || entry.kind === "report-saved"
      || entry.kind === "report-restored"
      || entry.kind === "report-updated"
      || entry.kind === "analysis-run"
      ? entry.kind
      : undefined;
    if (!kind) {
      return [];
    }
    const title = asString(entry.title) ?? "Recent change";
    const slotId = asString(entry.slotId);
    const preview = asString(entry.preview);
    return [{
      id: asString(entry.id) ?? createId("change"),
      changedAt: asIsoString(entry.changedAt, fallbackNow),
      kind,
      title,
      description: asString(entry.description) ?? title,
      ...(slotId ? { slotId } : {}),
      sourceMode: asSourceMode(entry.sourceMode),
      artifact: asArtifact(entry.artifact, kind === "analysis-run" ? "analysis-run" : "report", title),
      ...(preview ? { preview } : {}),
    } satisfies ProjectRecentChange];
  }).sort((left, right) => Date.parse(right.changedAt) - Date.parse(left.changedAt)), MAX_PROJECT_HISTORY_ITEMS);
}

export function normalizeProjectRecordForHistory(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    ...(normalizeProjectSnapshots(project.reportSnapshots).length > 0
      ? { reportSnapshots: normalizeProjectSnapshots(project.reportSnapshots) }
      : {}),
    ...(normalizeProjectRecentChanges(project.recentChanges).length > 0
      ? { recentChanges: normalizeProjectRecentChanges(project.recentChanges) }
      : {}),
  };
}

export function createProjectSnapshot(params: {
  label: string;
  slots: Record<string, string>;
  sourceMode: ProjectReviewSourceMode;
  artifact?: Partial<ProjectReviewArtifactRef>;
  now?: string;
}): ProjectReviewSnapshot {
  const now = params.now ?? new Date().toISOString();
  const firstFilledSlot = Object.values(params.slots).find((slotValue) => slotValue.trim().length > 0) ?? "";
  return {
    id: createId("snapshot"),
    createdAt: now,
    label: params.label,
    summary: firstFilledSlot ? firstFilledSlot.slice(0, 160) : "Snapshot created for report review.",
    slots: params.slots,
    sourceMode: params.sourceMode,
    artifact: {
      kind: params.artifact?.kind ?? "snapshot",
      label: params.artifact?.label ?? params.label,
      ...(params.artifact?.id ? { id: params.artifact.id } : {}),
      ...(params.artifact?.flowId ? { flowId: params.artifact.flowId } : {}),
    },
  };
}

export function createProjectRecentChange(params: {
  kind: ProjectRecentChange["kind"];
  title: string;
  description: string;
  sourceMode: ProjectReviewSourceMode;
  artifact: ProjectReviewArtifactRef;
  slotId?: string;
  preview?: string;
  changedAt?: string;
}): ProjectRecentChange {
  return {
    id: createId("change"),
    changedAt: params.changedAt ?? new Date().toISOString(),
    kind: params.kind,
    title: params.title,
    description: params.description,
    sourceMode: params.sourceMode,
    artifact: params.artifact,
    ...(params.slotId ? { slotId: params.slotId } : {}),
    ...(params.preview ? { preview: params.preview } : {}),
  };
}

function inspectUnknown(value: unknown, flags: { demo: boolean; real: boolean }): void {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("demo") || normalized.includes("sample")) {
      flags.demo = true;
    }
    if (normalized.includes("real") || normalized.includes("project") || normalized.includes("imported")) {
      flags.real = true;
    }
    return;
  }
  if (typeof value === "boolean") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => inspectUnknown(entry, flags));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  Object.entries(value).forEach(([key, nestedValue]) => {
    const normalizedKey = key.toLowerCase();
    if ((normalizedKey.includes("demo") || normalizedKey.includes("sample")) && nestedValue === true) {
      flags.demo = true;
    }
    if (normalizedKey.includes("runtimemode") || normalizedKey.includes("sourcemode") || normalizedKey.includes("sourcekind")) {
      inspectUnknown(nestedValue, flags);
      return;
    }
    inspectUnknown(nestedValue, flags);
  });
}

export function detectCompletedRunSourceMode(run: CompletedAnalysisRun): ProjectReviewSourceMode {
  const flags = { demo: false, real: false };
  inspectUnknown(run, flags);
  if (flags.demo && flags.real) {
    return "mixed";
  }
  if (flags.demo) {
    return "demo";
  }
  if (flags.real) {
    return "real";
  }
  return "unknown";
}

export function emitProjectHistoryEvent(detail: ProjectHistoryEventDetail): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(PROJECT_HISTORY_EVENT, { detail }));
}

export function emitProjectHistoryRefresh(projectId?: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(PROJECT_HISTORY_REFRESH_EVENT, { detail: { projectId } }));
}

export function applyProjectRecordPatch(
  projects: ProjectRecord[],
  projectId: string,
  patch: Partial<ProjectRecord>,
): ProjectRecord[] {
  return projects.map((project) => {
    if (project.id !== projectId) {
      return normalizeProjectRecordForHistory(project);
    }
    return normalizeProjectRecordForHistory({
      ...project,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function appendProjectSnapshot(project: ProjectRecord, snapshot: ProjectReviewSnapshot): Partial<ProjectRecord> {
  const snapshots = trimHistory([snapshot, ...normalizeProjectSnapshots(project.reportSnapshots)], MAX_PROJECT_SNAPSHOTS);
  const nextHistory = trimHistory([
    createProjectRecentChange({
      kind: "snapshot-created",
      title: snapshot.label,
      description: "Saved a report review snapshot for later comparison.",
      sourceMode: snapshot.sourceMode,
      artifact: { kind: "snapshot", label: snapshot.label, id: snapshot.id },
      preview: snapshot.summary,
      changedAt: snapshot.createdAt,
    }),
    ...normalizeProjectRecentChanges(project.recentChanges),
  ], MAX_PROJECT_HISTORY_ITEMS);
  return {
    reportSnapshots: snapshots,
    recentChanges: nextHistory,
  };
}

export function appendProjectHistoryEvent(project: ProjectRecord, detail: ProjectHistoryEventDetail): Partial<ProjectRecord> {
  const history = trimHistory([
    createProjectRecentChange({
      kind: detail.kind,
      title: detail.title,
      description: detail.description,
      sourceMode: detail.sourceMode ?? "unknown",
      artifact: { kind: "report", label: detail.artifact.label, ...(detail.artifact.id ? { id: detail.artifact.id } : {}) },
      ...(detail.slotId ? { slotId: detail.slotId } : {}),
      ...(detail.preview ? { preview: detail.preview } : {}),
    }),
    ...normalizeProjectRecentChanges(project.recentChanges),
  ], MAX_PROJECT_HISTORY_ITEMS);
  return { recentChanges: history };
}

export function buildProjectHistoryFeed(
  project: ProjectRecord | undefined,
  options: ProjectHistoryFeedOptions = {},
): ProjectHistoryFeedItem[] {
  if (!project) {
    return [];
  }

  const slotId = options.slotId;
  const explicitHistory = normalizeProjectRecentChanges(project.recentChanges)
    .filter((entry) => !slotId || !entry.slotId || entry.slotId === slotId)
    .map((entry) => ({
      ...entry,
      ...(entry.kind === "snapshot-created" ? { snapshotId: entry.artifact.id } : {}),
      ...(entry.artifact.flowId ? { flowId: entry.artifact.flowId } : {}),
    } satisfies ProjectHistoryFeedItem));

  const knownSnapshotIds = new Set(
    explicitHistory
      .map((entry) => entry.snapshotId)
      .filter((snapshotId): snapshotId is string => typeof snapshotId === "string"),
  );

  const snapshotHistory = normalizeProjectSnapshots(project.reportSnapshots)
    .filter((snapshot) => !knownSnapshotIds.has(snapshot.id))
    .filter((snapshot) => !slotId || snapshot.slots[slotId]?.trim().length > 0)
    .map((snapshot) => ({
      id: `snapshot-${snapshot.id}`,
      changedAt: snapshot.createdAt,
      kind: "snapshot-created" as const,
      title: snapshot.label,
      description: "Saved a report review snapshot for comparison.",
      sourceMode: snapshot.sourceMode,
      artifact: snapshot.artifact,
      preview: snapshot.summary,
      snapshotId: snapshot.id,
    } satisfies ProjectHistoryFeedItem));

  const runHistory = (options.completedRuns ?? []).map((run) => ({
    id: `run-${run.runId}`,
    changedAt: run.insertedAt,
    kind: "analysis-run" as const,
    title: run.label,
    description: run.paragraphPreview || run.paragraph || "Analytical run completed.",
    sourceMode: detectCompletedRunSourceMode(run),
    artifact: { kind: "analysis-run" as const, label: run.label, id: run.runId, flowId: run.flowId },
    preview: run.paragraphPreview,
    flowId: run.flowId,
  } satisfies ProjectHistoryFeedItem));

  const feed = [...explicitHistory, ...snapshotHistory, ...runHistory]
    .sort((left, right) => Date.parse(right.changedAt) - Date.parse(left.changedAt));

  const limit = options.limit ?? 5;
  const seen = new Set<string>();
  return feed.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  }).slice(0, limit);
}