/**
 * Synapse Evidence Registry — Prompt 25 (Evidence Artifact Model)
 *
 * Pure, store-agnostic helpers that operate on `SynapseArtifactEntry[]`.
 * Provides:
 *
 *   • Typed selectors           — by type, module, scenario, uri, recency.
 *   • Eligibility predicates    — "do I have at least one artifact of X?"
 *                                 used to gate command-palette commands and
 *                                 AI-panel context toggles.
 *   • AI context summarizer     — bounded markdown rendering of the most
 *                                 relevant artifacts for inclusion in a
 *                                 prompt context bundle.
 *
 * Everything here is read-only and side-effect free. Mutation goes through
 * `useSynapseWorkspaceStore.registerArtifact / updateArtifact / removeArtifact`
 * and the Prompt 18 bounded-write rules continue to apply.
 *
 * Design constraints:
 *   - Results MUST be stable across calls with identical input
 *     (sort by `updatedAt` desc, ties broken by `id`).
 *   - Summaries MUST be bounded — never emit more than `maxChars` characters.
 *   - All numeric/string fields are defensively clamped before rendering.
 *
 * @see ./synapseMemory.ts                 — bounded artifact registry primitive
 * @see ../stores/useSynapseWorkspaceStore — single source of truth for state
 * @see ../types/synapse-workspace          — canonical `SynapseArtifactEntry`
 */

import type {
  SynapseArtifactEntry,
  SynapseArtifactStatus,
  SynapseArtifactType,
  SynapseArtifactValidationState,
  SynapseModule,
} from '../types/synapse-workspace';

// ── Bounds ─────────────────────────────────────────────────────────────────

/** Max characters of a single rendered artifact line in the AI summary. */
const SUMMARY_LINE_MAX_CHARS = 240;

/** Default character ceiling for the full AI evidence section. */
export const EVIDENCE_SUMMARY_DEFAULT_MAX_CHARS = 1600;

/** Default number of artifacts surfaced to AI context. */
export const EVIDENCE_SUMMARY_DEFAULT_LIMIT = 8;

// ── Selectors ──────────────────────────────────────────────────────────────

/** Sort comparator: newest `updatedAt` first; ties broken by `id` ascending. */
function compareRecency(a: SynapseArtifactEntry, b: SynapseArtifactEntry): number {
  if (a.updatedAt !== b.updatedAt) {
    return a.updatedAt < b.updatedAt ? 1 : -1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Returns artifacts with the given type, newest first. Pure. */
export function selectArtifactsByType(
  artifacts: readonly SynapseArtifactEntry[],
  type: SynapseArtifactType,
): SynapseArtifactEntry[] {
  return artifacts.filter((a) => a.type === type).sort(compareRecency);
}

/** Returns artifacts whose provenance.sourceModule matches, newest first. */
export function selectArtifactsByModule(
  artifacts: readonly SynapseArtifactEntry[],
  module: SynapseModule,
): SynapseArtifactEntry[] {
  return artifacts
    .filter((a) => a.provenance.sourceModule === module)
    .sort(compareRecency);
}

/** Returns artifacts attached to a given scenario id, newest first. */
export function selectArtifactsByScenario(
  artifacts: readonly SynapseArtifactEntry[],
  scenarioId: string,
): SynapseArtifactEntry[] {
  if (!scenarioId) return [];
  return artifacts
    .filter((a) => a.scenarioId === scenarioId)
    .sort(compareRecency);
}

/** Returns artifacts in a given lifecycle status, newest first. */
export function selectArtifactsByStatus(
  artifacts: readonly SynapseArtifactEntry[],
  status: SynapseArtifactStatus,
): SynapseArtifactEntry[] {
  return artifacts.filter((a) => a.status === status).sort(compareRecency);
}

/** Returns artifacts in a given validation state, newest first. */
export function selectArtifactsByValidation(
  artifacts: readonly SynapseArtifactEntry[],
  state: SynapseArtifactValidationState,
): SynapseArtifactEntry[] {
  return artifacts
    .filter((a) => (a.validationState ?? 'unvalidated') === state)
    .sort(compareRecency);
}

/** Returns the first artifact whose `uri` strictly equals `uri`, or undefined. */
export function findArtifactByUri(
  artifacts: readonly SynapseArtifactEntry[],
  uri: string,
): SynapseArtifactEntry | undefined {
  if (!uri) return undefined;
  return artifacts.find((a) => a.uri === uri);
}

/** Returns the first artifact with `id`, or undefined. */
export function findArtifactById(
  artifacts: readonly SynapseArtifactEntry[],
  id: string,
): SynapseArtifactEntry | undefined {
  if (!id) return undefined;
  return artifacts.find((a) => a.id === id);
}

/**
 * Returns up to `limit` artifacts ordered by recency.
 * Negative or zero `limit` yields an empty array.
 */
export function selectRecentArtifacts(
  artifacts: readonly SynapseArtifactEntry[],
  limit: number,
): SynapseArtifactEntry[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return [...artifacts].sort(compareRecency).slice(0, Math.floor(limit));
}

// ── Eligibility ────────────────────────────────────────────────────────────

/**
 * Eligibility flags computed purely from registered artifacts.
 *
 * Used by the command palette and AI panel to enable/disable cross-module
 * actions WITHOUT requiring a live module to be open. Complements (does not
 * replace) the tab-context-driven eligibility helpers in
 * `services/map/ideMapHandoff.ts` and `services/analytics/ideUrbanHandoff.ts`.
 */
export interface EvidenceEligibility {
  /** At least one artifact is registered. */
  hasAny: boolean;
  /** True if there is ≥ 1 active (non-archived/superseded/error) artifact. */
  hasActive: boolean;
  /** Counts per artifact type for quick UI badges. */
  countsByType: Readonly<Partial<Record<SynapseArtifactType, number>>>;
  /** True iff a `spatial-layer` or `spatial-selection` artifact exists. */
  canSendSpatialEvidenceToMap: boolean;
  /** True iff a `scenario` artifact exists. */
  canOpenScenarioFromEvidence: boolean;
  /** True iff an `analysis-result` or `report` artifact exists. */
  canOpenAnalysisResultInEditor: boolean;
  /** True iff a `generated-patch` artifact exists. */
  canReplayGeneratedPatch: boolean;
}

/** Compute eligibility flags from a snapshot of the artifact registry. */
export function evaluateEvidenceEligibility(
  artifacts: readonly SynapseArtifactEntry[],
): EvidenceEligibility {
  const counts: Partial<Record<SynapseArtifactType, number>> = {};
  let hasActive = false;
  for (const a of artifacts) {
    counts[a.type] = (counts[a.type] ?? 0) + 1;
    if (a.status === 'active') hasActive = true;
  }
  return {
    hasAny: artifacts.length > 0,
    hasActive,
    countsByType: counts,
    canSendSpatialEvidenceToMap:
      (counts['spatial-layer'] ?? 0) + (counts['spatial-selection'] ?? 0) > 0,
    canOpenScenarioFromEvidence: (counts['scenario'] ?? 0) > 0,
    canOpenAnalysisResultInEditor:
      (counts['analysis-result'] ?? 0) + (counts['report'] ?? 0) > 0,
    canReplayGeneratedPatch: (counts['generated-patch'] ?? 0) > 0,
  };
}

// ── AI context summarizer ─────────────────────────────────────────────────

export interface EvidenceSummaryOptions {
  /** Max characters for the entire rendered section. Default 1600. */
  maxChars?: number;
  /** Max number of artifacts to surface. Default 8. */
  limit?: number;
  /** Filter to a specific scenario. Optional. */
  scenarioId?: string;
  /** Filter to specific types. Optional. */
  types?: readonly SynapseArtifactType[];
}

/** Clamp a number into [0,1] and round to 2 decimals; undefined-passthrough. */
function clamp01(n: number | undefined): number | undefined {
  if (n === undefined || !Number.isFinite(n)) return undefined;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return Math.round(n * 100) / 100;
}

/** Truncate a string to `max` characters with a single trailing ellipsis. */
function clip(s: string | undefined, max: number): string {
  if (!s) return '';
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, Math.max(1, max - 1))}…` : flat;
}

/**
 * Resolve effective confidence: prefer explicit uncertainty.confidence,
 * fall back to the legacy top-level `confidence` field.
 */
function effectiveConfidence(a: SynapseArtifactEntry): number | undefined {
  return clamp01(a.uncertainty?.confidence ?? a.confidence);
}

/** Render one artifact as a single-line bullet, ≤ SUMMARY_LINE_MAX_CHARS. */
function renderArtifactLine(a: SynapseArtifactEntry): string {
  const parts: string[] = [];
  parts.push(`• [${a.type}]`);
  parts.push(clip(a.title, 80) || a.id);
  const meta: string[] = [];
  meta.push(`module=${a.provenance.sourceModule}`);
  meta.push(`status=${a.status}`);
  const conf = effectiveConfidence(a);
  if (conf !== undefined) meta.push(`confidence=${conf}`);
  const validation = a.validationState ?? 'unvalidated';
  if (validation !== 'unvalidated') meta.push(`validation=${validation}`);
  if (a.scenarioId) meta.push(`scenario=${clip(a.scenarioId, 24)}`);
  if (a.spatialRef) meta.push(`crs=${clip(a.spatialRef, 24)}`);
  if (a.uri) meta.push(`uri=${clip(a.uri, 80)}`);
  if (a.fileRange) meta.push(`L${a.fileRange.startLine}-${a.fileRange.endLine}`);
  const caveat = a.uncertainty?.caveats?.[0];
  if (caveat) meta.push(`caveat="${clip(caveat, 60)}"`);
  parts.push(`(${meta.join(' ')})`);
  return clip(parts.join(' '), SUMMARY_LINE_MAX_CHARS);
}

/**
 * Build a bounded markdown section describing the most relevant evidence
 * artifacts for AI prompt inclusion. Returns `''` when there is nothing
 * to surface (caller can omit the section entirely).
 *
 * Rendering rules:
 *   - Newest first (by `updatedAt`).
 *   - Optionally filtered by scenario or type set.
 *   - Each line ≤ 240 chars; whole section ≤ `maxChars` (default 1600).
 *   - No raw geometry, no payloads — only IDs, URIs, scalar metadata.
 */
export function summarizeEvidenceForAi(
  artifacts: readonly SynapseArtifactEntry[],
  options: EvidenceSummaryOptions = {},
): string {
  if (!artifacts.length) return '';
  const maxChars = Math.max(
    256,
    Math.floor(options.maxChars ?? EVIDENCE_SUMMARY_DEFAULT_MAX_CHARS),
  );
  const limit = Math.max(
    1,
    Math.floor(options.limit ?? EVIDENCE_SUMMARY_DEFAULT_LIMIT),
  );

  let pool: SynapseArtifactEntry[] = [...artifacts];
  if (options.scenarioId) {
    pool = pool.filter((a) => a.scenarioId === options.scenarioId);
  }
  if (options.types && options.types.length) {
    const allow = new Set<SynapseArtifactType>(options.types);
    pool = pool.filter((a) => allow.has(a.type));
  }
  if (!pool.length) return '';

  const ranked = pool.sort(compareRecency).slice(0, limit);

  const header =
    '### Evidence Artifacts (from .synapse/artifacts.json)\n' +
    'Reference these by id/uri. Treat low-confidence or `failed`/`stale` ' +
    'validation entries with explicit caution in your reasoning.\n';

  const lines: string[] = [];
  let used = header.length;
  for (const a of ranked) {
    const line = renderArtifactLine(a);
    if (used + line.length + 1 > maxChars) break;
    lines.push(line);
    used += line.length + 1;
  }
  if (!lines.length) return '';
  return `${header}${lines.join('\n')}\n`;
}
