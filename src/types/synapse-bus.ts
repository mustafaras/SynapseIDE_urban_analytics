/**
 * Synapse Bus — Typed Event Contract Map  (Prompt 19)
 *
 * Defines every cross-module event that travels through the Synapse typed bus.
 * These contracts are the single source of truth for cross-module communication
 * between Synapse IDE, Map Explorer, and Urban Analytics.
 *
 * Payload principles (alignment spec §7.2):
 *   ✓  IDs and references only — no bulk geometry or file contents.
 *   ✓  Every event carries `source` (owner) and `requestedAt` (ISO timestamp).
 *   ✗  No raw GeoJSON, no full editor content, no complete data tables.
 *
 * Event ownership table:
 * ┌─────────────────────────────────┬───────────────┬──────────────────────────────┐
 * │ Event                           │ Owner         │ Consumers                    │
 * ├─────────────────────────────────┼───────────────┼──────────────────────────────┤
 * │ ide.file.open                   │ ide           │ any (audit, MRU, cross-nav)  │
 * │ ide.range.open                  │ ide           │ problems, outline, map-ref   │
 * │ ide.code.insert                 │ ide           │ ai-panel, apply-pipeline     │
 * │ map.layer.focus                 │ map-explorer  │ ide, urban-analytics         │
 * │ map.selection.export            │ map-explorer  │ ide, urban-analytics         │
 * │ analytics.scenario.open         │ urban-analytics│ ide, map-explorer           │
 * │ analytics.artifact.publish      │ urban-analytics│ ide, evidence-tray          │
 * │ analytics.recent.open           │ urban-analytics│ shell                       │
 * │ analytics.recommendations.refresh│ urban-analytics│ shell, urban-analytics     │
 * │ analytics.compare.open          │ urban-analytics│ shell, urban-analytics      │
 * │ ui.shortcuts.open               │ system        │ shell                         │
 * │ ui.theme.toggle                 │ system        │ shell                         │
 * │ evidence.artifact.register      │ system        │ ide, map-explorer,           │
 * │                                 │               │ urban-analytics              │
 * └─────────────────────────────────┴───────────────┴──────────────────────────────┘
 */

import type {
  SynapseArtifactType,
  SynapseArtifactUncertainty,
  SynapseModule,
} from './synapse-workspace';

// ── Shared base ────────────────────────────────────────────────────────────

/** Every bus event payload carries an ISO timestamp and owning module. */
export interface SynapseBusBase {
  /** Originating module. Used for routing guards and audit. */
  source: SynapseModule;
  /** ISO 8601 timestamp — set by the publisher. */
  requestedAt: string;
}

// ── ide.* events ───────────────────────────────────────────────────────────

/**
 * A file path was opened or made active in the IDE editor.
 *
 * Owner: ide
 */
export interface IdeFileOpenPayload extends SynapseBusBase {
  /** Project-relative path that was opened. */
  path: string;
  /** Optional tab ID if the editor has already assigned one. */
  tabId?: string;
}

/**
 * A specific line range within a file was revealed in the IDE.
 *
 * Owner: ide
 */
export interface IdeRangeOpenPayload extends SynapseBusBase {
  path: string;
  fromLine: number;
  toLine: number;
  /** Optional tab ID if the editor has already assigned one. */
  tabId?: string;
}

/**
 * A code snippet was inserted at the cursor in the IDE.
 *
 * Owner: ide — consumers must not re-emit this on every keystroke.
 */
export interface IdeCodeInsertPayload extends SynapseBusBase {
  /**
   * The code that was inserted.
   *
   * Size constraint: ≤ 32 KB. Larger snippets must be routed through the
   * apply-plan pipeline and are not suitable for bus transport.
   */
  code: string;
  /** ID of the editor tab that received the insert. */
  tabId?: string;
  /** Language hint for downstream consumers. */
  language?: string;
}

// ── map.* events ───────────────────────────────────────────────────────────

/**
 * A map layer was focused or highlighted in Map Explorer.
 *
 * Owner: map-explorer
 */
export interface MapLayerFocusPayload extends SynapseBusBase {
  /** Stable layer ID owned by Map Explorer. */
  layerId: string;
  /** Human-readable layer title for labeling — not for data lookup. */
  layerTitle?: string;
  /** Optional artifact reference ID if this layer is registered as an artifact. */
  artifactId?: string;
}

/**
 * A spatial selection was exported from Map Explorer for downstream use.
 *
 * Owner: map-explorer
 */
export interface MapSelectionExportPayload extends SynapseBusBase {
  /**
   * Opaque selection ID — consumers use this to retrieve selection details
   * from the Map Explorer store. No geometry in the payload.
   */
  selectionId: string;
  /** How many features are in the selection — for UI display only. */
  featureCount: number;
  /** Layer the selection came from (if single-layer selection). */
  layerId?: string;
  /** Optional AOI ID if the selection is an AOI-bounded export. */
  aoiId?: string;
  /** Spatial reference or CRS string — for validation, not for computation. */
  crs?: string;
  /** Optional artifact reference ID if already registered. */
  artifactId?: string;
}

// ── analytics.* events ─────────────────────────────────────────────────────

/**
 * An Urban Analytics scenario was opened or made active.
 *
 * Owner: urban-analytics
 */
export interface AnalyticsScenarioOpenPayload extends SynapseBusBase {
  /** Scenario ID owned by Urban Analytics. */
  scenarioId: string;
  /** Optional project-relative file path if the scenario maps to a file. */
  filePath?: string;
  /** Human-readable scenario title — for labeling only. */
  title?: string;
}

/**
 * An Urban Analytics artifact (indicator run, analysis result) was published.
 *
 * Owner: urban-analytics
 */
export interface AnalyticsArtifactPublishPayload extends SynapseBusBase {
  /** Stable artifact ID. */
  artifactId: string;
  artifactType: SynapseArtifactType;
  /** Human-readable artifact title. */
  title: string;
  /** Short summary for preview — max 256 chars. */
  summary?: string;
  /** Card ID from Urban Analytics indicator catalog, if applicable. */
  cardId?: string;
}

/**
 * Uncertainty / assumption metadata that may travel with an analytics artifact.
 *
 * Carried by-reference: keep payloads small. Bulk distributions or sampling
 * traces must remain in the Urban Analytics store.
 *
 * All fields optional — publishers populate only what they actually know.
 *
 * @remarks Prompt 25 promoted the canonical definition to
 *   {@link SynapseArtifactUncertainty} in `synapse-workspace.ts`; this name
 *   is kept as a structural alias for the analytics bus surface.
 */
export type AnalyticsUncertaintyMetadata = SynapseArtifactUncertainty;

/**
 * Urban Analytics requests the IDE to open the source script that produced
 * an indicator, scenario, or report. Owner: urban-analytics.
 */
export interface AnalyticsScriptOpenPayload extends SynapseBusBase {
  /** Project-relative path of the script. */
  path: string;
  /** Optional originating artifact id (provenance only). */
  artifactId?: string;
  /** Optional human-readable title for context. */
  title?: string;
  /** Optional line range to reveal. */
  fromLine?: number;
  toLine?: number;
}

/**
 * Urban Analytics requests the IDE to open a generated report file
 * (Markdown, HTML, etc.). Owner: urban-analytics.
 */
export interface AnalyticsReportOpenPayload extends SynapseBusBase {
  path: string;
  /** Optional originating scenario id. */
  scenarioId?: string;
  /** Optional originating artifact id. */
  artifactId?: string;
  /** Optional title for context. */
  title?: string;
}

/**
 * Urban Analytics proposes a reproducibility scaffold for the IDE.
 *
 * **The scaffold MUST NOT be inserted silently.** The receiver stages the
 * proposal in a pending queue; an explicit user decision (via the AI panel
 * apply-preview surface) is required before the snippet reaches the editor.
 *
 * Owner: urban-analytics.
 */
export interface AnalyticsScaffoldProposePayload extends SynapseBusBase {
  /** Stable id for the scaffold proposal — required for accept/reject. */
  scaffoldId: string;
  /** Code snippet to propose. ≤ 16 KB. */
  code: string;
  /** Suggested target language (informational). */
  language?: string;
  /** Optional target file the scaffold is associated with. */
  targetPath?: string;
  /** Originating scenario / artifact id (provenance). */
  scenarioId?: string;
  artifactId?: string;
  /** Human-readable purpose. ≤ 200 chars. */
  purpose?: string;
  /** Uncertainty / assumption metadata to surface alongside the scaffold. */
  uncertainty?: AnalyticsUncertaintyMetadata;
}

/**
 * Urban Analytics requests the IDE to inspect an indicator definition file
 * at a specific line range. Owner: urban-analytics.
 */
export interface AnalyticsIndicatorInspectPayload extends SynapseBusBase {
  /** Project-relative path of the indicator definition. */
  path: string;
  /** Stable indicator id. */
  indicatorId: string;
  /** Optional human-readable title. */
  title?: string;
  /** Optional line range to reveal. */
  fromLine?: number;
  toLine?: number;
  /** Optional uncertainty metadata to preserve as artifact provenance. */
  uncertainty?: AnalyticsUncertaintyMetadata;
}

/**
 * Urban Analytics asks the IDE to register a scenario as a workspace
 * artifact (provenance, not raw scenario data). Owner: urban-analytics.
 */
export interface AnalyticsScenarioRegisterPayload extends SynapseBusBase {
  /** Stable scenario id. */
  scenarioId: string;
  /** Human-readable title. */
  title: string;
  /** Optional summary (≤ 256 chars). */
  summary?: string;
  /** Optional related file path (e.g. scenario manifest). */
  filePath?: string;
  /** Optional list of related artifact ids that compose this scenario. */
  relatedArtifactIds?: string[];
  /** Optional uncertainty / assumption metadata. */
  uncertainty?: AnalyticsUncertaintyMetadata;
}

/**
 * Urban Analytics requests that the shell open the recent-items surface.
 *
 * Owner: urban-analytics.
 */
export type AnalyticsRecentOpenPayload = SynapseBusBase;

/**
 * Urban Analytics requests recommendation refresh without carrying result data.
 *
 * Owner: urban-analytics.
 */
export type AnalyticsRecommendationsRefreshPayload = SynapseBusBase;

/**
 * Urban Analytics requests compare mode for the current card, if one exists.
 *
 * Owner: urban-analytics.
 */
export interface AnalyticsCompareOpenPayload extends SynapseBusBase {
  /** Optional Urban Analytics card ID to seed comparison. */
  cardId?: string;
}

// ── ui.* events ───────────────────────────────────────────────────────────

/**
 * A module requests that the shell open the keyboard shortcuts surface.
 *
 * Owner: system.
 */
export type UiShortcutsOpenPayload = SynapseBusBase;

/**
 * A module requests that the shell toggle the active theme.
 *
 * Owner: system.
 */
export type UiThemeTogglePayload = SynapseBusBase;

// ── evidence.* events ──────────────────────────────────────────────────────

/**
 * An evidence artifact was registered in the shared workspace artifact registry.
 * Any module may produce this event; the evidence-tray and workspace store consume it.
 *
 * Owner: system (any module may publish, workspace store is the authority)
 */
export interface EvidenceArtifactRegisterPayload extends SynapseBusBase {
  /** Stable artifact ID. */
  artifactId: string;
  artifactType: SynapseArtifactType;
  /** Which module produced the artifact. */
  sourceModule: SynapseModule;
  /** Human-readable title. */
  title: string;
  /** Short provenance summary — max 256 chars. */
  summary?: string;
  /** Optional related file path(s). */
  relatedFilePaths?: string[];
  /** Optional related layer ID(s). */
  relatedLayerIds?: string[];
  /** Optional related workflow run ID(s). */
  relatedRunIds?: string[];
  /** Optional upstream artifact ID(s). */
  relatedArtifactIds?: string[];
  /** Optional language hint for file-backed code or manifest references. */
  language?: string;
  /** Optional artifact-kind hint for domain receivers. */
  artifactKind?: string;
  /** Optional parsed manifest metadata. Keep scalar/ID-only and bounded. */
  manifestMetadata?: Record<string, unknown>;
  /** Optional content hash supplied by the owner; content itself is never sent. */
  contentHash?: string;
  /** Optional file size supplied by the owner. */
  sizeBytes?: number;
}

// ── Canonical event map ────────────────────────────────────────────────────

/**
 * Complete map of every typed Synapse bus event.
 *
 * Key format: `<domain>.<noun>.<verb>` (dot-separated, lowercase).
 * Add new events here — do not introduce loose string keys elsewhere.
 */
export interface SynapseBusEventMap {
  'ide.file.open':              IdeFileOpenPayload;
  'ide.range.open':             IdeRangeOpenPayload;
  'ide.code.insert':            IdeCodeInsertPayload;
  'map.layer.focus':            MapLayerFocusPayload;
  'map.selection.export':       MapSelectionExportPayload;
  'analytics.scenario.open':    AnalyticsScenarioOpenPayload;
  'analytics.artifact.publish': AnalyticsArtifactPublishPayload;
  'analytics.script.open':      AnalyticsScriptOpenPayload;
  'analytics.report.open':      AnalyticsReportOpenPayload;
  'analytics.scaffold.propose': AnalyticsScaffoldProposePayload;
  'analytics.indicator.inspect': AnalyticsIndicatorInspectPayload;
  'analytics.scenario.register': AnalyticsScenarioRegisterPayload;
  'analytics.recent.open':       AnalyticsRecentOpenPayload;
  'analytics.recommendations.refresh': AnalyticsRecommendationsRefreshPayload;
  'analytics.compare.open':      AnalyticsCompareOpenPayload;
  'ui.shortcuts.open':           UiShortcutsOpenPayload;
  'ui.theme.toggle':             UiThemeTogglePayload;
  'evidence.artifact.register': EvidenceArtifactRegisterPayload;
}

/** Union of all valid bus event type strings. */
export type SynapseBusEventType = keyof SynapseBusEventMap;

/** Extract the payload type for a specific bus event. */
export type SynapseBusPayload<T extends SynapseBusEventType> = SynapseBusEventMap[T];

/** A handler function for a specific bus event. */
export type SynapseBusHandler<T extends SynapseBusEventType> = (
  payload: SynapseBusPayload<T>
) => void;

/** A subscription returned by `synapseBus.on(…)`. Call `.off()` to unsubscribe. */
export interface SynapseBusSubscription {
  /** Remove this subscription. Safe to call multiple times. */
  off(): void;
}
