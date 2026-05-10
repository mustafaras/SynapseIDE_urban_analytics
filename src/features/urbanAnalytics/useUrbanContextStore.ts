/**
 * Urban Analytics Workbench — Urban Analysis Context Store (Prompt 02)
 *
 * Dedicated Zustand store for the Urban Analysis Context Kernel.
 *
 * The context is the single shared scientific state contract that ties
 * together method recommendations, data fitness scoring, workflow manifests,
 * map handoffs, IDE code generation, and report/dashboard bindings.
 *
 * Architecture decisions:
 *   - Separate store from useUrbanStore to keep navigation/selection state
 *     and analytical context state orthogonal. Mirrors the pattern used by
 *     useFlowStore and usePanelBridgeStore.
 *   - Persistence is intentionally lightweight: only stable context references
 *     and small metadata are stored under the `urban.ctx.` namespace.
 *   - context is nullable: null = no active analytical session.
 *   - All mutations update `updatedAt` to an ISO timestamp.
 *   - Fine-grained per-field selectors exported as hooks to prevent
 *     unnecessary re-renders of large components (e.g. UrbanAnalyticsModal).
 *   - crypto.randomUUID() used for contextId — available in all modern
 *     browsers and Node 19+; no external dependency required.
 *
 * Planned consumers:
 *   Prompt 03: persistence / restore
 *   Prompt 04: evidence artifact linking (contextId ref)
 *   Prompt 05: data fitness (activeLayerIds, activeAoiId)
 *   Prompt 06: method validity (activeScale, activeFlowId)
 *   Prompt 16: Map Explorer incoming adapter
 *   Prompt 17: map evidence publication (activeRunId)
 *   Prompt 18: IDE code artifact generation (activeCodeArtifactId)
 *   Prompt 20: reporting evidence blocks
 *   Prompt 21: dashboard bindings
 */

import { create } from 'zustand';
import {
  createUrbanEvidenceArtifact,
  markUrbanEvidenceArtifactInvalid,
  markUrbanEvidenceArtifactStale,
  patchUrbanEvidenceArtifact,
  selectUrbanEvidenceArtifactsByContext,
  selectUrbanEvidenceArtifactsByKind,
  selectUrbanEvidenceArtifactsByRun,
  selectUrbanEvidenceArtifactsBySourceModule,
  upsertUrbanEvidenceArtifact,
  type UrbanEvidenceArtifactDraft,
  type UrbanEvidenceArtifactUpdate,
} from './context/evidenceArtifacts';
import type {
  AnalyticalFlowId,
  UrbanAnalysisContext,
  UrbanEvidenceArtifact,
  UrbanEvidenceArtifactKind,
  UrbanEvidenceSourceModule,
  UrbanIndicatorKind,
  UrbanScale,
} from './lib/types';

// ---------------------------------------------------------------------------
// Persistence contracts
// ---------------------------------------------------------------------------

export const URBAN_CONTEXT_PERSISTENCE_VERSION = 1 as const;
const CONTEXT_PREFIX = 'urban.ctx.';
const CONTEXT_SLOT = 'active';
export const URBAN_CONTEXT_STORAGE_KEY = `${CONTEXT_PREFIX}${CONTEXT_SLOT}`;

const MAX_ID_LENGTH = 160;
const MAX_QUESTION_LENGTH = 600;
const MAX_REFERENCE_COUNT = 64;

const URBAN_SCALE_VALUES = [
  'parcel',
  'block',
  'neighborhood',
  'district',
  'city',
  'metropolitan',
  'regional',
  'national',
] as const satisfies readonly UrbanScale[];

const ANALYTICAL_FLOW_VALUES = [
  'site_suitability',
  'accessibility',
  'vulnerability',
  'emerging_hot_spot',
  'object_detection',
  'indicator_composite',
  'scenario_comparison',
  'equity_audit',
  'change_detection',
  'urban_growth_ca',
  'facility_optimisation',
  'system_dynamics',
  'walkability',
  'fifteen_min_city',
  'urban_morphology',
  'transit_gap',
  'heat_island',
  'green_deficit',
  'voxcity_3d',
  'cityjson_loader',
  'sunlight_sim',
  'review',
] as const satisfies readonly AnalyticalFlowId[];

export type UrbanContextRestoreWarningCode =
  | 'invalid_payload'
  | 'incompatible_schema_version'
  | 'legacy_schema_migrated'
  | 'missing_study_area'
  | 'missing_aoi'
  | 'missing_layer'
  | 'missing_run'
  | 'missing_code_artifact'
  | 'storage_unavailable'
  | 'storage_write_failed';

export type UrbanContextReferenceType =
  | 'payload'
  | 'schema'
  | 'storage'
  | 'studyArea'
  | 'aoi'
  | 'layer'
  | 'run'
  | 'codeArtifact';

export interface UrbanContextRestoreWarning {
  code: UrbanContextRestoreWarningCode;
  severity: 'warning' | 'error';
  referenceType: UrbanContextReferenceType;
  message: string;
  referenceId?: string;
}

export interface UrbanContextReferenceRegistry {
  studyAreaIds?: Iterable<string>;
  aoiIds?: Iterable<string>;
  layerIds?: Iterable<string>;
  runIds?: Iterable<string>;
  codeArtifactIds?: Iterable<string>;
}

export interface UrbanContextRestoreOptions {
  registry?: UrbanContextReferenceRegistry;
}

export interface UrbanContextRestoreResult {
  ok: boolean;
  source: 'storage' | 'empty' | 'invalid';
  context: UrbanAnalysisContext | null;
  warnings: UrbanContextRestoreWarning[];
  storageKey: string;
  savedAt: string | null;
}

export type UrbanContextPersistenceResult =
  | { ok: true; status: 'saved'; storageKey: string; savedAt: string }
  | { ok: true; status: 'removed'; storageKey: string; savedAt: null }
  | { ok: false; status: 'unavailable' | 'write_failed'; storageKey: string; message: string };

export interface UrbanPersistedContextV1 {
  schemaVersion: typeof URBAN_CONTEXT_PERSISTENCE_VERSION;
  savedAt: string;
  context: {
    contextId: string;
    studyAreaId: string | null;
    studyAreaName: string | null;
    studyAreaBounds: [number, number, number, number] | null;
    activeQuestion: string;
    activeScale: UrbanScale | null;
    activeAoiId: string | null;
    activeLayerIds: string[];
    selectedIndicatorKinds: UrbanIndicatorKind[];
    activeFlowId: AnalyticalFlowId | null;
    activeRunId: string | null;
    activeCodeArtifactId: string | null;
    updatedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function newContextId(): string {
  // crypto.randomUUID is available in all modern browsers and Node 19+.
  // Falls back to a timestamp-based string in environments where it is
  // unavailable (e.g. test environments that do not polyfill crypto).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function storage(): Storage | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function clampText(value: unknown, maxLength: number, fallback = ''): string {
  const text = typeof value === 'string' ? value.trim() : fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeNullableId(value: unknown): string | null {
  const text = clampText(value, MAX_ID_LENGTH);
  return text || null;
}

function normalizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = normalizeNullableId(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_REFERENCE_COUNT) break;
  }
  return ids;
}

function normalizeScale(value: unknown): UrbanScale | null {
  return URBAN_SCALE_VALUES.includes(value as UrbanScale) ? (value as UrbanScale) : null;
}

function normalizeFlowId(value: unknown): AnalyticalFlowId | null {
  return ANALYTICAL_FLOW_VALUES.includes(value as AnalyticalFlowId)
    ? (value as AnalyticalFlowId)
    : null;
}

function normalizeStudyAreaBounds(
  value: unknown,
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length < 4) return null;
  const [a, b, c, d] = value;
  if (
    typeof a !== 'number' || typeof b !== 'number' ||
    typeof c !== 'number' || typeof d !== 'number'
  ) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || !Number.isFinite(d)) return null;
  return [a, b, c, d];
}

function normalizeIndicatorKinds(value: unknown): UrbanIndicatorKind[] {
  return normalizeIdList(value) as UrbanIndicatorKind[];
}

function normalizeIso(value: unknown): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return now();
}

function makeWarning(
  code: UrbanContextRestoreWarningCode,
  referenceType: UrbanContextReferenceType,
  message: string,
  referenceId?: string,
  severity: 'warning' | 'error' = 'warning',
): UrbanContextRestoreWarning {
  return referenceId
    ? { code, referenceType, message, referenceId, severity }
    : { code, referenceType, message, severity };
}

function idSet(ids: Iterable<string> | undefined): Set<string> | null {
  if (!ids) return null;
  return new Set([...ids].map((id) => id.trim()).filter(Boolean));
}

function warnIfMissing(
  warnings: UrbanContextRestoreWarning[],
  id: string | null,
  knownIds: Set<string> | null,
  code: UrbanContextRestoreWarningCode,
  referenceType: Exclude<UrbanContextReferenceType, 'payload' | 'schema' | 'storage'>,
  label: string,
) {
  if (!id || knownIds === null || knownIds.has(id)) return;
  warnings.push(
    makeWarning(
      code,
      referenceType,
      `Restored Urban Analytics context references a missing ${label}: ${id}.`,
      id,
    ),
  );
}

function contextFromPersistedFields(
  fields: Record<string, unknown>,
): UrbanAnalysisContext | null {
  const contextId = normalizeNullableId(fields.contextId);
  if (!contextId) return null;

  return {
    contextId,
    studyAreaId: normalizeNullableId(fields.studyAreaId),
    studyAreaName: typeof fields.studyAreaName === 'string' ? clampText(fields.studyAreaName, 120) || null : null,
    studyAreaBounds: normalizeStudyAreaBounds(fields.studyAreaBounds),
    activeQuestion: clampText(fields.activeQuestion, MAX_QUESTION_LENGTH),
    activeScale: normalizeScale(fields.activeScale),
    activeAoiId: normalizeNullableId(fields.activeAoiId),
    activeLayerIds: normalizeIdList(fields.activeLayerIds),
    selectedIndicatorKinds: normalizeIndicatorKinds(fields.selectedIndicatorKinds),
    activeFlowId: normalizeFlowId(fields.activeFlowId),
    activeRunId: normalizeNullableId(fields.activeRunId),
    activeCodeArtifactId: normalizeNullableId(fields.activeCodeArtifactId),
    updatedAt: normalizeIso(fields.updatedAt),
  };
}

function migratePersistedContext(value: unknown): {
  context: UrbanAnalysisContext | null;
  savedAt: string | null;
  warnings: UrbanContextRestoreWarning[];
  invalid: boolean;
} {
  const warnings: UrbanContextRestoreWarning[] = [];
  if (!isRecord(value)) {
    return {
      context: null,
      savedAt: null,
      warnings: [
        makeWarning(
          'invalid_payload',
          'payload',
          'Stored Urban Analytics context is not an object and was not restored.',
          undefined,
          'error',
        ),
      ],
      invalid: true,
    };
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== undefined && schemaVersion !== URBAN_CONTEXT_PERSISTENCE_VERSION) {
    return {
      context: null,
      savedAt: typeof value.savedAt === 'string' ? normalizeIso(value.savedAt) : null,
      warnings: [
        makeWarning(
          'incompatible_schema_version',
          'schema',
          `Stored Urban Analytics context schema ${String(schemaVersion)} is incompatible with schema ${URBAN_CONTEXT_PERSISTENCE_VERSION}.`,
          undefined,
          'error',
        ),
      ],
      invalid: true,
    };
  }

  const fields = isRecord(value.context) ? value.context : value;
  if (schemaVersion === undefined) {
    warnings.push(
      makeWarning(
        'legacy_schema_migrated',
        'schema',
        'Legacy Urban Analytics context payload was migrated to the current lightweight schema.',
      ),
    );
  }

  const context = contextFromPersistedFields(fields);
  if (!context) {
    return {
      context: null,
      savedAt: typeof value.savedAt === 'string' ? normalizeIso(value.savedAt) : null,
      warnings: [
        ...warnings,
        makeWarning(
          'invalid_payload',
          'payload',
          'Stored Urban Analytics context is missing a valid contextId and was not restored.',
          undefined,
          'error',
        ),
      ],
      invalid: true,
    };
  }

  return {
    context,
    savedAt: typeof value.savedAt === 'string' ? normalizeIso(value.savedAt) : null,
    warnings,
    invalid: false,
  };
}

export function buildUrbanContextPersistencePayload(
  context: UrbanAnalysisContext,
  savedAt = now(),
): UrbanPersistedContextV1 {
  return {
    schemaVersion: URBAN_CONTEXT_PERSISTENCE_VERSION,
    savedAt,
    context: {
      contextId: context.contextId,
      studyAreaId: context.studyAreaId,
      studyAreaName: context.studyAreaName,
      studyAreaBounds: context.studyAreaBounds,
      activeQuestion: clampText(context.activeQuestion, MAX_QUESTION_LENGTH),
      activeScale: context.activeScale,
      activeAoiId: context.activeAoiId,
      activeLayerIds: normalizeIdList(context.activeLayerIds),
      selectedIndicatorKinds: normalizeIndicatorKinds(context.selectedIndicatorKinds),
      activeFlowId: context.activeFlowId,
      activeRunId: context.activeRunId,
      activeCodeArtifactId: context.activeCodeArtifactId,
      updatedAt: normalizeIso(context.updatedAt),
    },
  };
}

function savePersistedContext(context: UrbanAnalysisContext | null): UrbanContextPersistenceResult {
  const target = storage();
  if (!target) {
    return {
      ok: false,
      status: 'unavailable',
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      message: 'Browser storage is unavailable; Urban Analytics context is kept in memory only.',
    };
  }

  if (!context) {
    try {
      target.removeItem(URBAN_CONTEXT_STORAGE_KEY);
      return { ok: true, status: 'removed', storageKey: URBAN_CONTEXT_STORAGE_KEY, savedAt: null };
    } catch (error) {
      return {
        ok: false,
        status: 'write_failed',
        storageKey: URBAN_CONTEXT_STORAGE_KEY,
        message: error instanceof Error ? error.message : 'Failed to remove Urban Analytics context.',
      };
    }
  }

  const savedAt = now();
  try {
    target.setItem(
      URBAN_CONTEXT_STORAGE_KEY,
      JSON.stringify(buildUrbanContextPersistencePayload(context, savedAt)),
    );
    return { ok: true, status: 'saved', storageKey: URBAN_CONTEXT_STORAGE_KEY, savedAt };
  } catch (error) {
    return {
      ok: false,
      status: 'write_failed',
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      message: error instanceof Error ? error.message : 'Failed to persist Urban Analytics context.',
    };
  }
}

function warningFromPersistenceResult(
  result: UrbanContextPersistenceResult,
): UrbanContextRestoreWarning[] {
  if (result.ok) return [];
  return [
    makeWarning(
      result.status === 'unavailable' ? 'storage_unavailable' : 'storage_write_failed',
      'storage',
      result.message,
      undefined,
      'warning',
    ),
  ];
}

export function validateUrbanContextReferences(
  context: UrbanAnalysisContext,
  registry?: UrbanContextReferenceRegistry,
): UrbanContextRestoreWarning[] {
  const warnings: UrbanContextRestoreWarning[] = [];
  if (!registry) return warnings;
  const knownStudyAreaIds = idSet(registry.studyAreaIds);
  const knownAoiIds = idSet(registry.aoiIds);
  const knownLayerIds = idSet(registry.layerIds);
  const knownRunIds = idSet(registry.runIds);
  const knownCodeArtifactIds = idSet(registry.codeArtifactIds);

  warnIfMissing(
    warnings,
    context.studyAreaId,
    knownStudyAreaIds,
    'missing_study_area',
    'studyArea',
    'study area',
  );
  warnIfMissing(
    warnings,
    context.activeAoiId,
    knownAoiIds,
    'missing_aoi',
    'aoi',
    'AOI',
  );
  for (const layerId of context.activeLayerIds) {
    warnIfMissing(
      warnings,
      layerId,
      knownLayerIds,
      'missing_layer',
      'layer',
      'layer',
    );
  }
  warnIfMissing(
    warnings,
    context.activeRunId,
    knownRunIds,
    'missing_run',
    'run',
    'analysis run',
  );
  warnIfMissing(
    warnings,
    context.activeCodeArtifactId,
    knownCodeArtifactIds,
    'missing_code_artifact',
    'codeArtifact',
    'code artifact',
  );
  return warnings;
}

export function loadPersistedUrbanContext(
  options?: UrbanContextRestoreOptions,
): UrbanContextRestoreResult {
  const target = storage();
  if (!target) {
    return {
      ok: true,
      source: 'empty',
      context: null,
      warnings: [],
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      savedAt: null,
    };
  }

  let raw: string | null;
  try {
    raw = target.getItem(URBAN_CONTEXT_STORAGE_KEY);
  } catch (error) {
    return {
      ok: false,
      source: 'invalid',
      context: null,
      warnings: [
        makeWarning(
          'storage_unavailable',
          'storage',
          error instanceof Error ? error.message : 'Browser storage could not be read.',
          undefined,
          'warning',
        ),
      ],
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      savedAt: null,
    };
  }

  if (!raw) {
    return {
      ok: true,
      source: 'empty',
      context: null,
      warnings: [],
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      savedAt: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      source: 'invalid',
      context: null,
      warnings: [
        makeWarning(
          'invalid_payload',
          'payload',
          'Stored Urban Analytics context could not be parsed and was not restored.',
          undefined,
          'error',
        ),
      ],
      storageKey: URBAN_CONTEXT_STORAGE_KEY,
      savedAt: null,
    };
  }

  const migrated = migratePersistedContext(parsed);
  const referenceWarnings = migrated.context
    ? validateUrbanContextReferences(migrated.context, options?.registry)
    : [];
  return {
    ok: !migrated.invalid,
    source: migrated.invalid ? 'invalid' : 'storage',
    context: migrated.context,
    warnings: [...migrated.warnings, ...referenceWarnings],
    storageKey: URBAN_CONTEXT_STORAGE_KEY,
    savedAt: migrated.savedAt,
  };
}

// ---------------------------------------------------------------------------
// Empty context factory
// ---------------------------------------------------------------------------

function makeEmptyContext(
  init?: Partial<Omit<UrbanAnalysisContext, 'contextId' | 'updatedAt'>>,
): UrbanAnalysisContext {
  return {
    contextId: newContextId(),
    studyAreaId: null,
    studyAreaName: null,
    studyAreaBounds: null,
    activeQuestion: '',
    activeScale: null,
    activeAoiId: null,
    activeLayerIds: [],
    selectedIndicatorKinds: [],
    activeFlowId: null,
    activeRunId: null,
    activeCodeArtifactId: null,
    updatedAt: now(),
    ...init,
  };
}

// ---------------------------------------------------------------------------
// State and action types
// ---------------------------------------------------------------------------

export interface UrbanContextState {
  /** Active analytical context. null when no session has been created. */
  context: UrbanAnalysisContext | null;
  /** Lightweight evidence registry. Stores references/provenance only, never bulk data. */
  evidenceArtifacts: UrbanEvidenceArtifact[];
  /** Truthful warnings generated during restore or stale-reference validation. */
  restoreWarnings: UrbanContextRestoreWarning[];
  /** Last successful persistence timestamp, or null when nothing has been saved. */
  lastPersistedAt: string | null;
  /** Last restore attempt timestamp, or null before restore. */
  lastRestoredAt: string | null;
  /** Browser storage status observed by context persistence. */
  storageStatus: 'unknown' | 'available' | 'unavailable' | 'error';

  // --- lifecycle ---
  /** Create a new context, optionally pre-seeded with partial initial values. */
  createContext(init?: Partial<Omit<UrbanAnalysisContext, 'contextId' | 'updatedAt'>>): void;
  /** Apply a partial patch to the active context. No-op if context is null. */
  patchContext(patch: Partial<Omit<UrbanAnalysisContext, 'contextId'>>): void;
  /** Reset context to null (end of session). */
  resetContext(): void;
  /** Explicitly persist the current context snapshot. */
  persistContext(): UrbanContextPersistenceResult;
  /** Restore the persisted context and validate known external references. */
  restoreContext(options?: UrbanContextRestoreOptions): UrbanContextRestoreResult;
  /** Re-run stale-reference validation against the active context. */
  validateRestoredContext(registry?: UrbanContextReferenceRegistry): UrbanContextRestoreWarning[];
  /** Clear restore warnings after the UI has surfaced or dismissed them. */
  clearRestoreWarnings(): void;

  // --- evidence artifacts ---
  /** Register or replace a lightweight evidence artifact. */
  registerEvidenceArtifact(artifact: UrbanEvidenceArtifactDraft): UrbanEvidenceArtifact;
  /** Update lifecycle/QA/link metadata for an artifact without changing identity. */
  updateEvidenceArtifactState(
    artifactId: string,
    patch: UrbanEvidenceArtifactUpdate,
  ): UrbanEvidenceArtifact | null;
  /** Link an artifact to the active context or an explicit context ID. */
  linkEvidenceArtifactToContext(
    artifactId: string,
    contextId?: string | null,
  ): UrbanEvidenceArtifact | null;
  /** Mark an artifact stale while preserving the original reference. */
  markEvidenceArtifactStale(artifactId: string, reason?: string): UrbanEvidenceArtifact | null;
  /** Mark an artifact invalid while preserving the original reference. */
  markEvidenceArtifactInvalid(artifactId: string, reason?: string): UrbanEvidenceArtifact | null;

  // --- study area ---
  /** Set the human-readable study area name (and optionally a bounding box in EPSG:4326). */
  setStudyArea(
    name: string | null,
    id?: string | null,
    bounds?: [number, number, number, number] | null,
  ): void;

  // --- spatial references ---
  /** Set the active AOI layer ID (references Map Explorer AOI / drawn feature). */
  setActiveAoi(aoiId: string | null): void;
  /** Replace the full set of active spatial layer IDs. */
  setActiveLayers(layerIds: string[]): void;

  // --- workflow + run ---
  /** Set the active workflow flow ID. */
  setActiveFlow(flowId: AnalyticalFlowId | null): void;
  /** Set the active or most recently completed run ID. */
  setActiveRun(runId: string | null): void;

  // --- IDE code artifact ---
  /** Set the active code artifact ID (staged or generated via IDE bridge). */
  setActiveCodeArtifact(artifactId: string | null): void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialRestore = loadPersistedUrbanContext();

export const useUrbanContextStore = create<UrbanContextState>((set, get) => ({
  context: initialRestore.context,
  evidenceArtifacts: [],
  restoreWarnings: initialRestore.warnings,
  lastPersistedAt: initialRestore.savedAt,
  lastRestoredAt: initialRestore.source === 'storage' ? now() : null,
  storageStatus: initialRestore.source === 'invalid'
    ? 'error'
    : storage()
      ? 'available'
      : 'unknown',

  createContext(init) {
    const context = makeEmptyContext(init);
    const result = savePersistedContext(context);
    set({
      context,
      restoreWarnings: warningFromPersistenceResult(result),
      lastPersistedAt: result.ok ? result.savedAt : get().lastPersistedAt,
      storageStatus: result.ok ? 'available' : result.status === 'unavailable' ? 'unavailable' : 'error',
    });
  },

  patchContext(patch) {
    const current = get().context;
    if (!current) return;
    const context = { ...current, ...patch, contextId: current.contextId, updatedAt: now() };
    const result = savePersistedContext(context);
    set({
      context,
      restoreWarnings: warningFromPersistenceResult(result),
      lastPersistedAt: result.ok ? result.savedAt : get().lastPersistedAt,
      storageStatus: result.ok ? 'available' : result.status === 'unavailable' ? 'unavailable' : 'error',
    });
  },

  resetContext() {
    const result = savePersistedContext(null);
    set({
      context: null,
      restoreWarnings: warningFromPersistenceResult(result),
      lastPersistedAt: result.ok ? null : get().lastPersistedAt,
      storageStatus: result.ok ? 'available' : result.status === 'unavailable' ? 'unavailable' : 'error',
    });
  },

  persistContext() {
    const result = savePersistedContext(get().context);
    set({
      restoreWarnings: warningFromPersistenceResult(result),
      lastPersistedAt: result.ok ? result.savedAt : get().lastPersistedAt,
      storageStatus: result.ok ? 'available' : result.status === 'unavailable' ? 'unavailable' : 'error',
    });
    return result;
  },

  restoreContext(options) {
    const result = loadPersistedUrbanContext(options);
    set({
      context: result.context,
      restoreWarnings: result.warnings,
      lastPersistedAt: result.savedAt,
      lastRestoredAt: now(),
      storageStatus: result.source === 'invalid' ? 'error' : storage() ? 'available' : 'unavailable',
    });
    return result;
  },

  validateRestoredContext(registry) {
    const current = get().context;
    const warnings = current ? validateUrbanContextReferences(current, registry) : [];
    set({ restoreWarnings: warnings });
    return warnings;
  },

  clearRestoreWarnings() {
    set({ restoreWarnings: [] });
  },

  registerEvidenceArtifact(draft) {
    const artifact = createUrbanEvidenceArtifact(draft);
    set((state) => ({
      evidenceArtifacts: upsertUrbanEvidenceArtifact(state.evidenceArtifacts, artifact),
    }));
    return artifact;
  },

  updateEvidenceArtifactState(artifactId, patch) {
    let updated: UrbanEvidenceArtifact | null = null;
    set((state) => ({
      evidenceArtifacts: state.evidenceArtifacts.map((artifact) => {
        if (artifact.id !== artifactId && artifact.artifactId !== artifactId) return artifact;
        updated = patchUrbanEvidenceArtifact(artifact, patch);
        return updated;
      }),
    }));
    return updated;
  },

  linkEvidenceArtifactToContext(artifactId, contextId) {
    const targetContextId = contextId === undefined
      ? get().context?.contextId ?? null
      : contextId;
    return get().updateEvidenceArtifactState(artifactId, {
      linkedContextId: targetContextId,
    });
  },

  markEvidenceArtifactStale(artifactId, reason) {
    let updated: UrbanEvidenceArtifact | null = null;
    set((state) => ({
      evidenceArtifacts: state.evidenceArtifacts.map((artifact) => {
        if (artifact.id !== artifactId && artifact.artifactId !== artifactId) return artifact;
        updated = markUrbanEvidenceArtifactStale(artifact, reason);
        return updated;
      }),
    }));
    return updated;
  },

  markEvidenceArtifactInvalid(artifactId, reason) {
    let updated: UrbanEvidenceArtifact | null = null;
    set((state) => ({
      evidenceArtifacts: state.evidenceArtifacts.map((artifact) => {
        if (artifact.id !== artifactId && artifact.artifactId !== artifactId) return artifact;
        updated = markUrbanEvidenceArtifactInvalid(artifact, reason);
        return updated;
      }),
    }));
    return updated;
  },

  setStudyArea(name, id, bounds) {
    const current = get().context;
    if (!current) {
      get().createContext({
        studyAreaName: name,
        studyAreaId: id ?? null,
        studyAreaBounds: bounds ?? null,
      });
      return;
    }
    get().patchContext({
      studyAreaName: name,
      ...(id !== undefined ? { studyAreaId: id } : {}),
      studyAreaBounds: bounds ?? null,
    });
  },

  setActiveAoi(aoiId) {
    const current = get().context;
    if (!current) return;
    get().patchContext({ activeAoiId: aoiId });
  },

  setActiveLayers(layerIds) {
    const current = get().context;
    if (!current) return;
    get().patchContext({ activeLayerIds: [...layerIds] });
  },

  setActiveFlow(flowId) {
    const current = get().context;
    if (!current) return;
    get().patchContext({ activeFlowId: flowId });
  },

  setActiveRun(runId) {
    const current = get().context;
    if (!current) return;
    get().patchContext({ activeRunId: runId });
  },

  setActiveCodeArtifact(artifactId) {
    const current = get().context;
    if (!current) return;
    get().patchContext({ activeCodeArtifactId: artifactId });
  },
}));

// ---------------------------------------------------------------------------
// Fine-grained selector hooks
//
// Each hook selects a single scalar field so that unrelated context mutations
// do not trigger re-renders in components that only care about one field.
// ---------------------------------------------------------------------------

/** Returns the full context object. Use only when multiple fields are needed. */
export function useUrbanContext(): UrbanAnalysisContext | null {
  return useUrbanContextStore((s) => s.context);
}

/** Returns true when a context has been created. */
export function useHasUrbanContext(): boolean {
  return useUrbanContextStore((s) => s.context !== null);
}

export function useUrbanContextId(): string | null {
  return useUrbanContextStore((s) => s.context?.contextId ?? null);
}

export function useUrbanStudyAreaId(): string | null {
  return useUrbanContextStore((s) => s.context?.studyAreaId ?? null);
}

export function useUrbanStudyAreaName(): string | null {
  return useUrbanContextStore((s) => s.context?.studyAreaName ?? null);
}

export function useUrbanStudyAreaBounds(): [number, number, number, number] | null {
  return useUrbanContextStore((s) => s.context?.studyAreaBounds ?? null);
}

export function useUrbanActiveQuestion(): string {
  return useUrbanContextStore((s) => s.context?.activeQuestion ?? '');
}

export function useUrbanActiveScale(): UrbanScale | null {
  return useUrbanContextStore((s) => s.context?.activeScale ?? null);
}

export function useUrbanActiveAoiId(): string | null {
  return useUrbanContextStore((s) => s.context?.activeAoiId ?? null);
}

export function useUrbanActiveLayerIds(): string[] {
  return useUrbanContextStore((s) => s.context?.activeLayerIds ?? []);
}

export function useUrbanSelectedIndicatorKinds(): UrbanIndicatorKind[] {
  return useUrbanContextStore((s) => s.context?.selectedIndicatorKinds ?? []);
}

export function useUrbanActiveFlowId(): AnalyticalFlowId | null {
  return useUrbanContextStore((s) => s.context?.activeFlowId ?? null);
}

export function useUrbanActiveRunId(): string | null {
  return useUrbanContextStore((s) => s.context?.activeRunId ?? null);
}

export function useUrbanActiveCodeArtifactId(): string | null {
  return useUrbanContextStore((s) => s.context?.activeCodeArtifactId ?? null);
}

export function useUrbanContextUpdatedAt(): string | null {
  return useUrbanContextStore((s) => s.context?.updatedAt ?? null);
}

export function useUrbanContextRestoreWarnings(): UrbanContextRestoreWarning[] {
  return useUrbanContextStore((s) => s.restoreWarnings);
}

export function useUrbanEvidenceArtifacts(): UrbanEvidenceArtifact[] {
  return useUrbanContextStore((s) => s.evidenceArtifacts);
}

export function useUrbanEvidenceArtifactsByContext(contextId: string | null): UrbanEvidenceArtifact[] {
  return useUrbanContextStore((s) => selectUrbanEvidenceArtifactsByContext(s.evidenceArtifacts, contextId));
}

export function useUrbanEvidenceArtifactsByRun(runId: string | null): UrbanEvidenceArtifact[] {
  return useUrbanContextStore((s) => selectUrbanEvidenceArtifactsByRun(s.evidenceArtifacts, runId));
}

export function useUrbanEvidenceArtifactsByKind(kind: UrbanEvidenceArtifactKind): UrbanEvidenceArtifact[] {
  return useUrbanContextStore((s) => selectUrbanEvidenceArtifactsByKind(s.evidenceArtifacts, kind));
}

export function useUrbanEvidenceArtifactsBySourceModule(
  sourceModule: UrbanEvidenceSourceModule,
): UrbanEvidenceArtifact[] {
  return useUrbanContextStore((s) => selectUrbanEvidenceArtifactsBySourceModule(s.evidenceArtifacts, sourceModule));
}

// ---------------------------------------------------------------------------
// Prompt 07 — Context summary hook
//
// Provides a stable, structured summary of the active analytical context for
// use by context strip consumers (modal shell, note tab, report surfaces).
// Returns a plain data object — not KvPill types — to avoid UI coupling.
// Consumers build their own pill/badge representation from this summary.
// ---------------------------------------------------------------------------

export type UrbanContextFitnessStatus = 'ready' | 'warning' | 'blocked' | null;

/** Structured summary of the active Urban Analytics context.
 *  Consumed by UrbanModalContextBar, UrbanContextStrip wrappers, and report surfaces. */
export interface UrbanContextSummary {
  hasContext: boolean;
  studyAreaId: string | null;
  studyAreaName: string | null;
  studyAreaBounds: [number, number, number, number] | null;
  scale: UrbanScale | null;
  flowId: AnalyticalFlowId | null;
  layerCount: number;
  runId: string | null;
  codeArtifactId: string | null;
  artifactCount: number;
  /** Fitness derived from artifacts that carry a dataFitness profile. null = no fitness data available. */
  fitnessStatus: UrbanContextFitnessStatus;
  hasRestoreWarnings: boolean;
  restoreWarningCount: number;
  restoreWarnings: UrbanContextRestoreWarning[];
  /** Tri-modal sync state: 'synced' | 'stale' | 'none' */
  syncState: 'synced' | 'stale' | 'none';
}

function deriveFitnessStatus(artifacts: UrbanEvidenceArtifact[]): UrbanContextFitnessStatus {
  const withFitness = artifacts.filter((a) => a.dataFitness != null);
  if (withFitness.length === 0) return null;
  if (withFitness.some((a) => a.dataFitness!.status === 'blocked')) return 'blocked';
  if (withFitness.some((a) => a.dataFitness!.status === 'warning')) return 'warning';
  if (withFitness.every((a) => a.dataFitness!.status === 'ready')) return 'ready';
  return null;
}

/** Returns a stable structured summary of the active Urban Analytics context.
 *  Uses fine-grained sub-selectors so unrelated store mutations do not re-render consumers. */
export function useUrbanContextSummary(): UrbanContextSummary {
  const context = useUrbanContextStore((s) => s.context);
  const artifacts = useUrbanContextStore((s) => s.evidenceArtifacts);
  const restoreWarnings = useUrbanContextStore((s) => s.restoreWarnings);

  const fitnessStatus = deriveFitnessStatus(artifacts);
  const hasRestoreWarnings = restoreWarnings.length > 0;
  const syncState: UrbanContextSummary['syncState'] = hasRestoreWarnings
    ? 'stale'
    : context != null
      ? 'synced'
      : 'none';

  return {
    hasContext: context != null,
    studyAreaId: context?.studyAreaId ?? null,
    studyAreaName: context?.studyAreaName ?? null,
    studyAreaBounds: context?.studyAreaBounds ?? null,
    scale: context?.activeScale ?? null,
    flowId: context?.activeFlowId ?? null,
    layerCount: context?.activeLayerIds.length ?? 0,
    runId: context?.activeRunId ?? null,
    codeArtifactId: context?.activeCodeArtifactId ?? null,
    artifactCount: artifacts.length,
    fitnessStatus,
    hasRestoreWarnings,
    restoreWarningCount: restoreWarnings.length,
    restoreWarnings,
    syncState,
  };
}
