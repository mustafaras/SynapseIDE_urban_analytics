/**
 * useSynapseWorkspaceStore — unified Zustand store for .synapse/ workspace memory.
 *
 * Manages all four `.synapse/` sections in reactive in-memory state:
 *   workspace      → identity, session metadata, recent paths
 *   artifacts      → IDE-side artifact registry (references + metadata only)
 *   applyHistoryRefs → lightweight index of apply plan executions
 *   syncState      → cross-module synchronization snapshots
 *
 * Persistence strategy:
 *   - Each section is independently flushed to its localStorage slot via
 *     synapseMemory helpers (synapse.ws.<slot>).
 *   - Not using Zustand `persist` middleware to avoid double-writes and to
 *     keep slot routing explicit and testable.
 *   - `hydrate()` reads all four slots on app init; safe to call multiple times.
 *   - `flush()` writes all four slots; called internally by mutating actions.
 *
 * Bounds:
 *   MAX_ARTIFACTS    = 200 entries (oldest dropped when exceeded)
 *   MAX_APPLY_REFS   = 100 entries (oldest dropped when exceeded)
 *   MAX_RECENT_PATHS = 50  entries (oldest dropped when exceeded)
 */

import { create } from 'zustand';
import {
  isSynapseWritable,
  readSynapseFile,
  writeSynapseFile,
} from '@/utils/synapseMemory';
import type {
  SynapseApplyHistoryRef,
  SynapseArtifactEntry,
  SynapseArtifactStatus,
  SynapseArtifactType,
  SynapseArtifactUncertainty,
  SynapseArtifactValidationState,
  SynapseModule,
  SynapseModuleSyncEntry,
  SynapseSyncStateJson,
  SynapseWorkspaceJson,
} from '@/types/synapse-workspace';

// ── Bounds ─────────────────────────────────────────────────────────────────

export const MAX_ARTIFACTS    = 200;
export const MAX_APPLY_REFS   = 100;
export const MAX_RECENT_PATHS = 50;
export const MAX_PENDING_HANDOFF_IDS = 100;

const SCHEMA_VERSION = '1.0' as const;
const MAX_SHORT_TEXT = 200;
const MAX_TITLE_TEXT = 160;
const MAX_URI_TEXT = 512;
const MAX_TAGS = 20;
const MAX_UNCERTAINTY_ITEMS = 12;

// ── State interface ────────────────────────────────────────────────────────

export interface SynapseWorkspaceState {
  // ── Data sections ────────────────────────────────────────────────────────
  /** Current workspace.json contents. Null before hydrate() or initWorkspace(). */
  workspace: SynapseWorkspaceJson | null;
  /** In-memory artifact registry (mirrors artifacts.json). */
  artifacts: SynapseArtifactEntry[];
  /** Lightweight apply plan refs (mirrors apply-history.json). */
  applyHistoryRefs: SynapseApplyHistoryRef[];
  /** Cross-module sync state (mirrors sync-state.json). */
  syncState: SynapseSyncStateJson;

  // ── Meta ─────────────────────────────────────────────────────────────────
  /** True after the first successful hydrate() call. */
  isHydrated: boolean;
  /**
   * Where data was loaded from last hydrate.
   * 'storage' = localStorage, 'memory' = in-memory fallback, 'none' = missing.
   */
  storageSource: 'storage' | 'memory' | 'none';

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Load all four .synapse/ slots from storage into memory.
   * Idempotent — safe to call on every app mount.
   * Missing slots are left as defaults (not an error).
   */
  hydrate: () => void;

  /**
   * Initialize or reset the workspace.json section.
   * Preserves an existing workspaceId if one already exists.
   * Flushes immediately.
   */
  initWorkspace: (opts?: {
    projectName?: string;
    tags?: string[];
  }) => void;

  /**
   * Update `lastOpenedAt` and push a path to `recentPaths`.
   * No-op if workspace is not initialized.
   * Flushes immediately.
   */
  touchWorkspace: (path?: string) => void;

  /**
   * Register or replace an artifact entry.
   * Prepends; drops oldest beyond MAX_ARTIFACTS.
   * Flushes immediately.
   */
  registerArtifact: (entry: SynapseArtifactEntry) => void;

  /**
   * Patch an existing artifact by id.
   * No-op if id is not found.
   * Flushes immediately.
   */
  updateArtifact: (id: string, patch: Partial<SynapseArtifactEntry>) => void;

  /**
   * Remove an artifact by id.
   * Flushes immediately.
   */
  removeArtifact: (id: string) => void;

  /**
   * Prepend a lightweight apply plan reference.
   * Drops oldest beyond MAX_APPLY_REFS.
   * Flushes immediately.
   */
  pushApplyHistoryRef: (ref: SynapseApplyHistoryRef) => void;

  /**
   * Update or create the sync snapshot for a single module.
   * Flushes immediately.
   */
  updateModuleSync: (
    module: SynapseModule,
    patch: Partial<SynapseModuleSyncEntry>,
  ) => void;

  /**
   * Replace the pending handoff artifact ID list.
   * Pass an empty array to clear after a successful handoff.
   * Flushes immediately.
   */
  setPendingHandoffIds: (ids: string[]) => void;

  /**
   * Persist all four sections to their respective .synapse/ slots.
   * Called internally by every mutating action.
   * Safe to call externally for explicit save points.
   */
  flush: () => void;

  /**
   * Stale-state recovery for restored artifacts (Prompt 27).
   *
   * Marks artifacts whose `uri` references a file that no longer resolves
   * in the current workspace tree as `validationState: 'stale'`. Active
   * artifacts that resolve again are restored to their prior state. URIs
   * with non-file schemes (`http`, `https`, `synapse://`, `bus://`, etc.)
   * are skipped because their resolution is not the IDE's authority.
   *
   * No-op if `artifacts` is empty or no transitions are needed.
   */
  recoverRestoredArtifacts: (knownFilePaths: Iterable<string>) => void;
}

// ── Default sync state ──────────────────────────────────────────────────────

function defaultSyncState(): SynapseSyncStateJson {
  return {
    schemaVersion: SCHEMA_VERSION,
    modules: {},
    pendingHandoffIds: [],
    updatedAt: new Date().toISOString(),
  };
}

// ── Stable workspace ID ────────────────────────────────────────────────────

function generateWorkspaceId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for non-secure contexts (should not happen in modern browsers)
    return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clampString(value: unknown, max: number, fallback = ''): string {
  const raw = typeof value === 'string' ? value.trim() : fallback;
  return raw.length > max ? raw.slice(0, max) : raw;
}

function normalizeIso(value: unknown): string {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

function boundedStrings(value: unknown, limit: number, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = clampString(item, maxChars);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeModule(value: unknown): SynapseModule {
  return value === 'ide' ||
    value === 'map-explorer' ||
    value === 'urban-analytics' ||
    value === 'system'
    ? value
    : 'system';
}

function normalizeArtifactType(value: unknown): SynapseArtifactType {
  return value === 'code' ||
    value === 'spatial-layer' ||
    value === 'spatial-selection' ||
    value === 'scenario' ||
    value === 'indicator' ||
    value === 'analysis-result' ||
    value === 'report' ||
    value === 'generated-patch' ||
    value === 'unknown'
    ? value
    : 'unknown';
}

function normalizeArtifactStatus(value: unknown): SynapseArtifactStatus {
  return value === 'active' || value === 'archived' || value === 'superseded' || value === 'error'
    ? value
    : 'error';
}

function normalizeValidationState(value: unknown): SynapseArtifactValidationState {
  return value === 'unvalidated' ||
    value === 'validating' ||
    value === 'validated' ||
    value === 'failed' ||
    value === 'stale'
    ? value
    : 'failed';
}

function normalizeConfidence(value: unknown): number | undefined {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.max(0, Math.min(1, numeric));
}

function normalizeUncertainty(value: unknown): SynapseArtifactUncertainty | undefined {
  if (!isRecord(value)) return undefined;
  const result: SynapseArtifactUncertainty = {};
  const confidence = normalizeConfidence(value.confidence);
  if (confidence !== undefined) result.confidence = confidence;
  if (isRecord(value.confidenceInterval)) {
    const lower = normalizeConfidence(value.confidenceInterval.lower);
    const upper = normalizeConfidence(value.confidenceInterval.upper);
    const level = normalizeConfidence(value.confidenceInterval.level);
    if (lower !== undefined && upper !== undefined) {
      result.confidenceInterval = {
        lower,
        upper,
        ...(level !== undefined ? { level } : {}),
      };
    }
  }
  const assumptions = boundedStrings(value.assumptions, MAX_UNCERTAINTY_ITEMS, MAX_SHORT_TEXT);
  const caveats = boundedStrings(value.caveats, MAX_UNCERTAINTY_ITEMS, MAX_SHORT_TEXT);
  const dataLineage = clampString(value.dataLineage, MAX_SHORT_TEXT);
  const methodologyId = clampString(value.methodologyId, MAX_SHORT_TEXT);
  if (assumptions.length) result.assumptions = assumptions;
  if (caveats.length) result.caveats = caveats;
  if (dataLineage) result.dataLineage = dataLineage;
  if (methodologyId) result.methodologyId = methodologyId;
  return Object.keys(result).length ? result : undefined;
}

function normalizeArtifact(value: unknown): SynapseArtifactEntry | null {
  if (!isRecord(value)) return null;
  const id = clampString(value.id, MAX_SHORT_TEXT);
  const title = clampString(value.title, MAX_TITLE_TEXT, id);
  if (!id || !title) return null;

  const provenance = isRecord(value.provenance) ? value.provenance : {};
  const confidence = normalizeConfidence(value.confidence);
  const uncertainty = normalizeUncertainty(value.uncertainty);
  const tags = boundedStrings(value.tags, MAX_TAGS, MAX_SHORT_TEXT);
  const method = clampString(provenance.method, MAX_SHORT_TEXT);
  const uri = clampString(value.uri, MAX_URI_TEXT);
  const spatialRef = clampString(value.spatialRef, MAX_SHORT_TEXT);
  const scenarioId = clampString(value.scenarioId, MAX_SHORT_TEXT);
  const fileRange = isRecord(value.fileRange)
    ? {
        startLine: Math.max(1, Math.floor(Number(value.fileRange.startLine) || 1)),
        endLine: Math.max(1, Math.floor(Number(value.fileRange.endLine) || Number(value.fileRange.startLine) || 1)),
      }
    : undefined;

  return {
    id,
    type: normalizeArtifactType(value.type),
    title,
    ...(uri ? { uri } : {}),
    status: normalizeArtifactStatus(value.status),
    provenance: {
      sourceModule: normalizeModule(provenance.sourceModule),
      createdAt: normalizeIso(provenance.createdAt),
      ...(method ? { method } : {}),
      ...(clampString(provenance.applyPlanId, MAX_SHORT_TEXT)
        ? { applyPlanId: clampString(provenance.applyPlanId, MAX_SHORT_TEXT) }
        : {}),
      ...(clampString(provenance.parentArtifactId, MAX_SHORT_TEXT)
        ? { parentArtifactId: clampString(provenance.parentArtifactId, MAX_SHORT_TEXT) }
        : {}),
    },
    updatedAt: normalizeIso(value.updatedAt),
    ...(confidence !== undefined ? { confidence } : {}),
    ...(spatialRef ? { spatialRef } : {}),
    ...(scenarioId ? { scenarioId } : {}),
    ...(fileRange ? { fileRange } : {}),
    ...(tags.length ? { tags } : {}),
    ...(uncertainty ? { uncertainty } : {}),
    validationState: normalizeValidationState(value.validationState),
  };
}

function normalizeWorkspace(value: unknown): SynapseWorkspaceJson | null {
  if (!isRecord(value)) return null;
  const workspaceId = clampString(value.workspaceId, MAX_SHORT_TEXT, generateWorkspaceId());
  const fallbackProjectName =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'synapse-workspace';
  const projectName = clampString(value.projectName, MAX_TITLE_TEXT, fallbackProjectName);
  const tags = boundedStrings(value.tags, MAX_TAGS, MAX_SHORT_TEXT);
  return {
    schemaVersion: SCHEMA_VERSION,
    workspaceId,
    projectName,
    createdAt: normalizeIso(value.createdAt),
    lastOpenedAt: normalizeIso(value.lastOpenedAt),
    recentPaths: boundedStrings(value.recentPaths, MAX_RECENT_PATHS, MAX_URI_TEXT),
    ...(tags.length ? { tags } : {}),
    ...(isRecord(value.featureOverrides)
      ? {
          featureOverrides: Object.fromEntries(
            Object.entries(value.featureOverrides)
              .filter((entry): entry is [string, boolean] =>
                typeof entry[0] === 'string' && typeof entry[1] === 'boolean'
              )
              .slice(0, 50)
          ),
        }
      : {}),
  };
}

function normalizeApplyRefs(value: unknown): SynapseApplyHistoryRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ref): SynapseApplyHistoryRef | null => {
      if (!isRecord(ref)) return null;
      const id = clampString(ref.id, MAX_SHORT_TEXT);
      if (!id) return null;
      const promptSnippet = clampString(ref.promptSnippet, 120);
      return {
        id,
        appliedAt: normalizeIso(ref.appliedAt),
        status: clampString(ref.status, MAX_SHORT_TEXT, 'unknown'),
        fileCount: Math.max(0, Math.floor(Number(ref.fileCount) || 0)),
        ...(promptSnippet ? { promptSnippet } : {}),
      };
    })
    .filter((ref): ref is SynapseApplyHistoryRef => Boolean(ref))
    .slice(0, MAX_APPLY_REFS);
}

function normalizeSyncState(value: unknown): SynapseSyncStateJson {
  if (!isRecord(value)) return defaultSyncState();
  const modules: SynapseSyncStateJson['modules'] = {};
  if (isRecord(value.modules)) {
    for (const [rawModule, rawEntry] of Object.entries(value.modules)) {
      const module = normalizeModule(rawModule);
      if (!isRecord(rawEntry)) continue;
      const entry: SynapseModuleSyncEntry = {
        online: typeof rawEntry.online === 'boolean' ? rawEntry.online : false,
        ...(rawEntry.lastHandoffAt ? { lastHandoffAt: normalizeIso(rawEntry.lastHandoffAt) } : {}),
        ...(rawEntry.lastReceivedAt ? { lastReceivedAt: normalizeIso(rawEntry.lastReceivedAt) } : {}),
        ...(clampString(rawEntry.lastArtifactId, MAX_SHORT_TEXT)
          ? { lastArtifactId: clampString(rawEntry.lastArtifactId, MAX_SHORT_TEXT) }
          : {}),
      };
      modules[module] = entry;
    }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    modules,
    ...(value.lastSyncAt ? { lastSyncAt: normalizeIso(value.lastSyncAt) } : {}),
    pendingHandoffIds: boundedStrings(value.pendingHandoffIds, MAX_PENDING_HANDOFF_IDS, MAX_SHORT_TEXT),
    updatedAt: normalizeIso(value.updatedAt),
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useSynapseWorkspaceStore = create<SynapseWorkspaceState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  workspace: null,
  artifacts: [],
  applyHistoryRefs: [],
  syncState: defaultSyncState(),
  isHydrated: false,
  storageSource: 'none',

  // ── hydrate ──────────────────────────────────────────────────────────────
  hydrate: () => {
    const wsResult     = readSynapseFile('workspace');
    const artResult    = readSynapseFile('artifacts');
    const histResult   = readSynapseFile('apply-history');
    const syncResult   = readSynapseFile('sync-state');

    // Determine dominant source (storage > memory > none)
    const source: 'storage' | 'memory' | 'none' =
      wsResult.ok && wsResult.source === 'storage' ? 'storage' :
      wsResult.ok && wsResult.source === 'memory'  ? 'memory'  :
      isSynapseWritable()                          ? 'storage' : 'memory';

    set({
      workspace:         wsResult.ok  ? normalizeWorkspace(wsResult.value) : null,
      artifacts:         artResult.ok && Array.isArray(artResult.value.entries)
        ? artResult.value.entries
            .map(normalizeArtifact)
            .filter((entry): entry is SynapseArtifactEntry => Boolean(entry))
            .slice(0, MAX_ARTIFACTS)
        : [],
      applyHistoryRefs:  histResult.ok ? normalizeApplyRefs(histResult.value.refs) : [],
      syncState:         syncResult.ok ? normalizeSyncState(syncResult.value) : defaultSyncState(),
      isHydrated:        true,
      storageSource:     wsResult.ok   ? source                    : 'none',
    });
  },

  // ── initWorkspace ─────────────────────────────────────────────────────────
  initWorkspace: (opts) => {
    const now = new Date().toISOString();
    const existing = get().workspace;
    const nextTags = opts?.tags ?? existing?.tags;
    const ws: SynapseWorkspaceJson = {
      schemaVersion:    SCHEMA_VERSION,
      workspaceId:      existing?.workspaceId ?? generateWorkspaceId(),
      projectName:      opts?.projectName ?? existing?.projectName ?? window.location.hostname,
      createdAt:        existing?.createdAt ?? now,
      lastOpenedAt:     now,
      recentPaths:      existing?.recentPaths ?? [],
      ...(nextTags ? { tags: nextTags } : {}),
      ...(existing?.featureOverrides
        ? { featureOverrides: existing.featureOverrides }
        : {}),
    };
    set({ workspace: ws });
    get().flush();
  },

  // ── touchWorkspace ────────────────────────────────────────────────────────
  touchWorkspace: (path) => {
    const existing = get().workspace;
    if (!existing) return;

    let recentPaths = existing.recentPaths;
    if (path) {
      // Deduplicate, prepend, cap at MAX_RECENT_PATHS
      recentPaths = [path, ...recentPaths.filter((p) => p !== path)].slice(
        0,
        MAX_RECENT_PATHS,
      );
    }

    set({
      workspace: {
        ...existing,
        lastOpenedAt: new Date().toISOString(),
        recentPaths,
      },
    });
    get().flush();
  },

  // ── registerArtifact ──────────────────────────────────────────────────────
  registerArtifact: (entry) => {
    set((s) => {
      // Remove any existing entry with the same id (replace-semantics)
      const filtered = s.artifacts.filter((a) => a.id !== entry.id);
      const next = [entry, ...filtered];
      return {
        artifacts: next.length > MAX_ARTIFACTS ? next.slice(0, MAX_ARTIFACTS) : next,
      };
    });
    get().flush();
  },

  // ── updateArtifact ────────────────────────────────────────────────────────
  updateArtifact: (id, patch) => {
    set((s) => ({
      artifacts: s.artifacts.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a,
      ),
    }));
    get().flush();
  },

  // ── removeArtifact ────────────────────────────────────────────────────────
  removeArtifact: (id) => {
    set((s) => ({ artifacts: s.artifacts.filter((a) => a.id !== id) }));
    get().flush();
  },

  // ── pushApplyHistoryRef ───────────────────────────────────────────────────
  pushApplyHistoryRef: (ref) => {
    set((s) => {
      const next = [ref, ...s.applyHistoryRefs];
      return {
        applyHistoryRefs: next.length > MAX_APPLY_REFS ? next.slice(0, MAX_APPLY_REFS) : next,
      };
    });
    get().flush();
  },

  // ── updateModuleSync ──────────────────────────────────────────────────────
  updateModuleSync: (module, patch) => {
    set((s) => {
      const existing = s.syncState.modules[module] ?? { online: false };
      return {
        syncState: {
          ...s.syncState,
          modules: {
            ...s.syncState.modules,
            [module]: { ...existing, ...patch },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
    get().flush();
  },

  // ── setPendingHandoffIds ──────────────────────────────────────────────────
  setPendingHandoffIds: (ids) => {
    set((s) => ({
      syncState: {
        ...s.syncState,
        pendingHandoffIds: boundedStrings(ids, MAX_PENDING_HANDOFF_IDS, MAX_SHORT_TEXT),
        updatedAt: new Date().toISOString(),
      },
    }));
    get().flush();
  },

  // ── flush ─────────────────────────────────────────────────────────────────
  flush: () => {
    const s = get();
    const now = new Date().toISOString();

    if (s.workspace) {
      writeSynapseFile('workspace', s.workspace);
    }

    writeSynapseFile('artifacts', {
      schemaVersion: SCHEMA_VERSION,
      entries: s.artifacts,
      updatedAt: now,
    });

    writeSynapseFile('apply-history', {
      schemaVersion: SCHEMA_VERSION,
      refs: s.applyHistoryRefs,
      updatedAt: now,
    });

    writeSynapseFile('sync-state', {
      ...s.syncState,
      updatedAt: now,
    });
  },

  // ── recoverRestoredArtifacts ──────────────────────────────────────────────
  recoverRestoredArtifacts: (knownFilePaths) => {
    const known = new Set<string>();
    for (const p of knownFilePaths) {
      if (typeof p !== 'string' || !p) continue;
      known.add(p);
      known.add(p.replace(/^\/+/, ''));
    }

    const isLocalFileUri = (uri: string): boolean => {
      // Treat bare or file: URIs as local. External schemes (http, https,
      // synapse://, bus://, mem:, blob:, data:) are not the IDE's authority.
      const lower = uri.toLowerCase();
      if (lower.startsWith('file://')) return true;
      return !/^[a-z][a-z0-9+.-]*:/i.test(uri);
    };

    const localPathFromUri = (uri: string): string => {
      if (uri.toLowerCase().startsWith('file://')) {
        return uri.slice('file://'.length);
      }
      return uri;
    };

    set((s) => {
      if (s.artifacts.length === 0) return {};
      let changed = false;
      const next = s.artifacts.map((entry) => {
        if (!entry.uri || !isLocalFileUri(entry.uri)) return entry;
        const path = localPathFromUri(entry.uri);
        const resolves = known.has(path) || known.has(path.replace(/^\/+/, ''));
        const wasStale = entry.validationState === 'stale';
        if (!resolves && !wasStale) {
          changed = true;
          return { ...entry, validationState: 'stale' as const };
        }
        if (resolves && wasStale) {
          changed = true;
          // Drop the stale marker; downstream consumers can re-validate.
          const { validationState: _drop, ...rest } = entry;
          void _drop;
          return rest as SynapseArtifactEntry;
        }
        return entry;
      });
      if (!changed) return {};
      return { artifacts: next };
    });

    // Persist transitions so reload reflects the recovered state.
    if (get().artifacts.length) get().flush();
  },
}));
