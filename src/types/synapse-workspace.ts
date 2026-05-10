/**
 * Synapse Workspace Schema Types — Prompt 18
 *
 * Defines the typed schema for the `.synapse/` workspace memory layer.
 * Since this is a browser-only application with no native file write API,
 * these files are persisted to localStorage under the `synapse.ws.*` key
 * namespace. An in-memory fallback activates when localStorage is
 * unavailable or full.
 *
 * Conceptual file mapping:
 *   synapse.ws.workspace      → .synapse/workspace.json
 *   synapse.ws.artifacts      → .synapse/artifacts.json
 *   synapse.ws.apply-history  → .synapse/apply-history.json
 *   synapse.ws.sync-state     → .synapse/sync-state.json
 *
 * Constraints:
 *   - No raw bulk data is stored here (coordinates, datasets, snapshots).
 *   - Stores references, IDs, metadata, and provenance only.
 *   - All arrays are bounded (see MAX_* constants in useSynapseWorkspaceStore).
 *   - Schema version field present on every file root for migration safety.
 */

// ── Shared primitives ──────────────────────────────────────────────────────

/** Schema version string — increment when structure changes incompatibly. */
export type SynapseSchemaVersion = '1.0';

/** Tri-modal modules that can produce or consume artifacts. */
export type SynapseModule =
  | 'ide'
  | 'map-explorer'
  | 'urban-analytics'
  | 'system';

/** Artifact lifecycle status. */
export type SynapseArtifactStatus =
  | 'active'
  | 'archived'
  | 'superseded'
  | 'error';

/**
 * Validation state for an evidence artifact (Prompt 25).
 *
 * Tracks whether downstream consumers (Map Explorer renderers, Urban
 * Analytics scenario validators, IDE apply pipeline) have confirmed that
 * the artifact still resolves and matches its declared shape.
 *
 *   unvalidated → never checked since registration
 *   validating  → a validator is currently running
 *   validated   → last check passed
 *   failed      → last check rejected the artifact (schema, missing file…)
 *   stale       → underlying source changed since last validation
 */
export type SynapseArtifactValidationState =
  | 'unvalidated'
  | 'validating'
  | 'validated'
  | 'failed'
  | 'stale';

/**
 * Uncertainty / assumption metadata that may travel with an analytics or
 * evidence artifact (Prompt 25 canonical home; mirrored by
 * `AnalyticsUncertaintyMetadata` in `synapse-bus.ts` for backward compat).
 *
 * Carried by-reference: keep payloads small. Bulk distributions and
 * sampling traces remain in their source store.
 *
 * All fields optional — publishers populate only what they actually know.
 */
export interface SynapseArtifactUncertainty {
  /** Confidence score 0–1. Higher = stronger backing data. */
  confidence?: number;
  /** Statistical confidence interval, if computed. */
  confidenceInterval?: { lower: number; upper: number; level?: number };
  /** Free-form list of explicit assumptions. Each entry ≤ 200 chars. */
  assumptions?: string[];
  /** Free-form list of known caveats / limitations. Each entry ≤ 200 chars. */
  caveats?: string[];
  /** Brief data lineage descriptor (≤ 200 chars). */
  dataLineage?: string;
  /** Stable identifier of the methodology / model used. */
  methodologyId?: string;
}

/**
 * Minimal artifact type vocabulary recognized by the IDE layer.
 * Extended in Prompt 25 (Evidence Artifact Model).
 */
export type SynapseArtifactType =
  | 'code'
  | 'spatial-layer'
  | 'spatial-selection'
  | 'scenario'
  | 'indicator'
  | 'analysis-result'
  | 'report'
  | 'generated-patch'
  | 'unknown';

// ── .synapse/workspace.json ────────────────────────────────────────────────

/**
 * Top-level workspace identity and session metadata.
 * Persisted to `synapse.ws.workspace`.
 */
export interface SynapseWorkspaceJson {
  schemaVersion: SynapseSchemaVersion;
  /** Stable UUID identifying this workspace. */
  workspaceId: string;
  /** Human-readable project name; defaults to browser origin. */
  projectName: string;
  /** ISO timestamp of first initialization in this browser. */
  createdAt: string;
  /** ISO timestamp of the most recent session open. */
  lastOpenedAt: string;
  /**
   * Project-relative paths open at last save — max 50 entries.
   * Used as MRU restore hints; not guaranteed to resolve.
   */
  recentPaths: string[];
  /** Free-form tags for project classification (e.g. "geospatial", "urban"). */
  tags?: string[];
  /**
   * Workspace-scoped feature flag overrides.
   * Merged on top of global flags.ts values.
   */
  featureOverrides?: Record<string, boolean>;
}

// ── .synapse/artifacts.json ────────────────────────────────────────────────

/**
 * Provenance chain for a single artifact.
 * Records how and when the artifact was produced.
 */
export interface SynapseArtifactProvenance {
  /** Module that produced the artifact. */
  sourceModule: SynapseModule;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ID of the apply plan that generated this artifact, if applicable. */
  applyPlanId?: string;
  /** ID of a parent artifact this was derived from. */
  parentArtifactId?: string;
  /** Brief note on methodology or generation context (max 200 chars). */
  method?: string;
}

/**
 * A single artifact entry stored in `.synapse/artifacts.json`.
 *
 * Stores references, metadata, and provenance — never raw bulk data
 * (coordinates, dataset rows, revert snapshots).
 */
export interface SynapseArtifactEntry {
  /** Stable UUID. */
  id: string;
  /** Artifact classification. */
  type: SynapseArtifactType;
  /** Human-readable title. */
  title: string;
  /**
   * URI or project-relative path to the artifact file.
   * Absent for transient in-memory artifacts.
   */
  uri?: string;
  /** Lifecycle status. */
  status: SynapseArtifactStatus;
  /** Provenance chain. */
  provenance: SynapseArtifactProvenance;
  /** ISO timestamp of last status change or update. */
  updatedAt: string;
  /** Confidence level 0–1; absent means unknown. */
  confidence?: number;
  /** Spatial reference system identifier (e.g. "EPSG:4326"). */
  spatialRef?: string;
  /** Scenario ID this artifact belongs to, for analytics traceability. */
  scenarioId?: string;
  /** Optional: file range the artifact refers to (e.g. a generated function). */
  fileRange?: {
    startLine: number;
    endLine: number;
  };
  /** Free-form tags. */
  tags?: string[];
  /**
   * Uncertainty / assumption metadata (Prompt 25).
   *
   * Stored by-reference; bulk distributions stay in source stores.
   * If both `confidence` (top-level shortcut) and `uncertainty.confidence`
   * are present, the explicit `uncertainty.confidence` wins.
   */
  uncertainty?: SynapseArtifactUncertainty;
  /**
   * Downstream validation state (Prompt 25). Defaults to `'unvalidated'`
   * when omitted. Updated by Map / Analytics / IDE validators.
   */
  validationState?: SynapseArtifactValidationState;
}

/**
 * Root structure of `.synapse/artifacts.json`.
 * Bounded to MAX_ARTIFACTS (200) entries.
 */
export interface SynapseArtifactsJson {
  schemaVersion: SynapseSchemaVersion;
  /** Artifact entries, newest first. */
  entries: SynapseArtifactEntry[];
  /** ISO timestamp of last write. */
  updatedAt: string;
}

// ── .synapse/apply-history.json ────────────────────────────────────────────

/**
 * Lightweight reference to an apply plan execution.
 *
 * Full records (including per-file revert snapshots) are maintained in
 * `useApplyHistoryStore` (Zustand + localStorage). This file holds a
 * bounded index for cross-session provenance lookup without duplicating
 * snapshot data.
 */
export interface SynapseApplyHistoryRef {
  /** Matches ApplyHistoryRecord.id from useApplyHistoryStore. */
  id: string;
  /** ISO timestamp when the plan was applied. */
  appliedAt: string;
  /** Final execution status (mirrors ApplyStatus). */
  status: string;
  /** Number of files affected by this plan. */
  fileCount: number;
  /** First 120 chars of the source prompt, for human readability. */
  promptSnippet?: string;
}

/**
 * Root structure of `.synapse/apply-history.json`.
 * Bounded to MAX_APPLY_REFS (100) entries.
 */
export interface SynapseApplyHistoryJson {
  schemaVersion: SynapseSchemaVersion;
  /** Apply plan refs, newest first. */
  refs: SynapseApplyHistoryRef[];
  /** ISO timestamp of last write. */
  updatedAt: string;
}

// ── .synapse/sync-state.json ───────────────────────────────────────────────

/** Synchronization snapshot for one tri-modal module. */
export interface SynapseModuleSyncEntry {
  /** ISO timestamp of last successful handoff *to* this module. */
  lastHandoffAt?: string;
  /** ISO timestamp of last event *received from* this module. */
  lastReceivedAt?: string;
  /** Whether the module reported itself online at the last check. */
  online: boolean;
  /** Last artifact ID exchanged with this module (for correlation). */
  lastArtifactId?: string;
}

/**
 * Root structure of `.synapse/sync-state.json`.
 * Records cross-module synchronization state for reproducibility and
 * session-resume confidence.
 */
export interface SynapseSyncStateJson {
  schemaVersion: SynapseSchemaVersion;
  /** Per-module sync snapshots. */
  modules: Partial<Record<SynapseModule, SynapseModuleSyncEntry>>;
  /** ISO timestamp of last full sync attempt across all known modules. */
  lastSyncAt?: string;
  /**
   * Artifact IDs queued for handoff on next sync.
   * Cleared when the handoff succeeds.
   */
  pendingHandoffIds: string[];
  /** ISO timestamp of last write. */
  updatedAt: string;
}

// ── Slot union ─────────────────────────────────────────────────────────────

/** All recognized `.synapse/` persistence slots. */
export type SynapseMemorySlot =
  | 'workspace'
  | 'artifacts'
  | 'apply-history'
  | 'sync-state';

/**
 * Maps each slot name to its corresponding JSON schema type.
 * Used by the generic read/write helpers in synapseMemory.ts.
 */
export interface SynapseSlotTypeMap {
  workspace: SynapseWorkspaceJson;
  artifacts: SynapseArtifactsJson;
  'apply-history': SynapseApplyHistoryJson;
  'sync-state': SynapseSyncStateJson;
}
