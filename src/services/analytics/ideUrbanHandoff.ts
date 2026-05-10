/**
 * Synapse IDE → Urban Analytics Handoff Adapter  (Prompt 23)
 *
 * IDE-side adapter that converts editor / file-explorer context into typed
 * Urban Analytics handoff actions. Mirrors the architecture of the IDE → Map
 * Explorer adapter (Prompt 21):
 *
 *   • Pure eligibility evaluation — no UI mutation.
 *   • User-driven imperative actions — never auto-fire on selection change.
 *   • Workspace artifact registration (provenance, not raw data).
 *   • Typed Synapse Bus events with `source: 'ide'`.
 *   • Calls `useUrbanStore.getState().open()` to surface the workbench, but
 *     never mutates Urban Analytics internal scenario / indicator data
 *     (alignment spec §8 module ownership).
 *
 * Per Prompt 23 Stop Condition: the Urban Analytics store does not expose
 * scenario / artifact ingestion APIs, so all evidence flows through the
 * shared workspace artifact registry + typed bus. Future Urban Analytics
 * receiver work (Prompt 24) will subscribe to these events.
 */

import { useUrbanStore } from '@/features/urbanAnalytics/store';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { SynapseArtifactEntry, SynapseArtifactType } from '@/types/synapse-workspace';

// ── Types ─────────────────────────────────────────────────────────────────

export interface IdeUrbanHandoffEligibility {
  hasActiveTab: boolean;
  hasScenarioFile: boolean;
  hasIndicatorDefinition: boolean;
  hasAnalysisScript: boolean;
  hasResultArtifact: boolean;
  hasUserSelection: boolean;
  canOpenScenario: boolean;
  canAttachScript: boolean;
  canRegisterIndicator: boolean;
  canSendResultArtifact: boolean;
}

export interface IdeUrbanHandoffOutcome {
  ok: boolean;
  reason?: string;
  artifactId?: string;
  scenarioId?: string;
}

interface ActiveTabContext {
  path: string;
  name: string;
  language: string;
  contentLength: number;
  selectionText?: string;
  selectionLineRange?: { startLine: number; endLine: number };
  semanticGenerated: boolean;
  semanticAnalysisOutput: boolean;
  semanticScenarioArtifact: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Tag stamped onto every artifact registered by this Prompt 23 adapter. */
export const IDE_URBAN_HANDOFF_TAG = 'prompt-23:ide-to-urban';

/** Maximum size of the handoff selection summary stored in artifact provenance. */
const SUMMARY_MAX_CHARS = 200;

/** Extensions reasonably interpreted as analytical scripts. */
const ANALYSIS_SCRIPT_EXTS = new Set([
  '.py', '.ipynb', '.r', '.rmd', '.sql', '.jl', '.qmd',
]);

/** Extensions reasonably interpreted as result / output data artifacts. */
const RESULT_ARTIFACT_EXTS = new Set([
  '.csv', '.tsv', '.parquet', '.geoparquet', '.json', '.geojson', '.xlsx',
]);

/** Filename token heuristics for scenario configuration files. */
const SCENARIO_FILENAME_TOKENS = ['scenario', 'scenarios'];
const SCENARIO_EXTS = new Set(['.json', '.yaml', '.yml', '.toml']);

/** Filename / path token heuristics for indicator definitions. */
const INDICATOR_FILENAME_TOKENS = ['indicator', 'indicators', 'kpi', 'metric'];
const INDICATOR_EXTS = new Set(['.json', '.yaml', '.yml', '.toml']);

/** Path token heuristics for result artifacts. */
const RESULT_PATH_TOKENS = ['/results/', '/outputs/', '/reports/', '/exports/'];

// ── Path helpers ──────────────────────────────────────────────────────────

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

function pathBaseName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function pathStem(path: string): string {
  const base = pathBaseName(path);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? base.toLowerCase() : base.slice(0, dot).toLowerCase();
}

function pathExt(path: string): string {
  const base = pathBaseName(path);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot).toLowerCase();
}

function createHandoffId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function truncateSummary(text: string, max = SUMMARY_MAX_CHARS): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

// ── Heuristics ────────────────────────────────────────────────────────────

function isScenarioFilePath(path: string, semanticScenarioArtifact: boolean): boolean {
  if (semanticScenarioArtifact) return true;
  const ext = pathExt(path);
  if (!SCENARIO_EXTS.has(ext)) return false;
  const stem = pathStem(path);
  // Match filename containing "scenario" or full segment (e.g. "city-scenario.json").
  return SCENARIO_FILENAME_TOKENS.some((token) => stem.includes(token));
}

function isIndicatorFilePath(path: string): boolean {
  const normalized = `/${normalizePath(path).toLowerCase()}`;
  if (normalized.includes('/indicator')) return true;
  const ext = pathExt(path);
  if (!INDICATOR_EXTS.has(ext)) return false;
  const stem = pathStem(path);
  return INDICATOR_FILENAME_TOKENS.some((token) => stem.includes(token));
}

function isAnalysisScriptPath(path: string): boolean {
  return ANALYSIS_SCRIPT_EXTS.has(pathExt(path));
}

function inferUrbanArtifactKind(path: string): string | undefined {
  const ext = pathExt(path);
  const base = pathBaseName(path).toLowerCase();
  if (base.endsWith('.urban.json')) return 'urban-manifest';
  if (ext === '.geojson') return 'geojson-layer';
  if (ext === '.ipynb') return 'notebook';
  if (ext === '.py') return 'python-script';
  if (ext === '.sql') return 'sql-query';
  if (base === 'manifest.json' || base.endsWith('.manifest.json')) return 'project-manifest';
  return undefined;
}

function isResultArtifactPath(path: string, ctx: { semanticAnalysisOutput: boolean; semanticGenerated: boolean }): boolean {
  if (ctx.semanticAnalysisOutput) return true;
  const normalized = `/${normalizePath(path).toLowerCase()}`;
  if (RESULT_PATH_TOKENS.some((token) => normalized.includes(token))) {
    return RESULT_ARTIFACT_EXTS.has(pathExt(path));
  }
  // Pure extension match without a results/ token is too noisy (eg. *.json
  // could be a scenario file). Generated semantic flag is enough confidence.
  if (ctx.semanticGenerated && RESULT_ARTIFACT_EXTS.has(pathExt(path))) return true;
  return false;
}

// ── Editor / file-explorer context ────────────────────────────────────────

function getSelectionText(content: string, selection: { start: { line: number; column: number }; end: { line: number; column: number } }): string {
  const lines = content.split(/\r?\n/);
  const startLineIdx = Math.max(0, selection.start.line - 1);
  const endLineIdx = Math.max(startLineIdx, selection.end.line - 1);
  const selectedLines = lines.slice(startLineIdx, endLineIdx + 1);
  if (selectedLines.length === 0) return '';

  if (selectedLines.length === 1) {
    const line = selectedLines[0] ?? '';
    const startCol = Math.max(0, selection.start.column - 1);
    const endCol = Math.max(startCol, selection.end.column - 1);
    return line.slice(startCol, endCol || line.length);
  }

  const firstLine = selectedLines[0] ?? '';
  const lastLine = selectedLines[selectedLines.length - 1] ?? '';
  const startCol = Math.max(0, selection.start.column - 1);
  const endCol = Math.max(0, selection.end.column - 1);

  selectedLines[0] = firstLine.slice(startCol);
  selectedLines[selectedLines.length - 1] = endCol > 0 ? lastLine.slice(0, endCol) : lastLine;
  return selectedLines.join('\n');
}

function getActiveTabContext(): ActiveTabContext | null {
  const ed = useEditorStore.getState();
  const tab = ed.tabs.find((t) => t.id === ed.activeTabId);
  if (!tab) return null;

  // Pick the largest non-empty selection for handoff context.
  let chosenSelection: typeof tab.selections[number] | undefined;
  let chosenText: string | undefined;
  for (const sel of tab.selections) {
    const text = getSelectionText(tab.content, sel);
    if (!text) continue;
    if (!chosenText || text.length > chosenText.length) {
      chosenSelection = sel;
      chosenText = text;
    }
  }

  const fileNode = useFileExplorerStore
    .getState()
    .getFileByPath(normalizePath(tab.path))
    ?? useFileExplorerStore.getState().getFileByPath(tab.path);

  const semantic = fileNode?.semanticStatus;

  const selectionLineRange = chosenSelection
    ? {
        startLine: Math.max(1, chosenSelection.start.line),
        endLine: Math.max(chosenSelection.start.line, chosenSelection.end.line),
      }
    : undefined;

  return {
    path: tab.path,
    name: tab.name,
    language: tab.language,
    contentLength: tab.content.length,
    ...(chosenText && chosenText.length > 0 ? { selectionText: chosenText } : {}),
    ...(selectionLineRange ? { selectionLineRange } : {}),
    semanticGenerated: Boolean(semantic?.generated),
    semanticAnalysisOutput: Boolean(semantic?.analysisOutput),
    semanticScenarioArtifact: Boolean(semantic?.scenarioArtifact),
  };
}

// ── Eligibility ───────────────────────────────────────────────────────────

export function evaluateIdeUrbanHandoffEligibility(): IdeUrbanHandoffEligibility {
  const ctx = getActiveTabContext();

  if (!ctx) {
    return {
      hasActiveTab: false,
      hasScenarioFile: false,
      hasIndicatorDefinition: false,
      hasAnalysisScript: false,
      hasResultArtifact: false,
      hasUserSelection: false,
      canOpenScenario: false,
      canAttachScript: false,
      canRegisterIndicator: false,
      canSendResultArtifact: false,
    };
  }

  const hasScenarioFile = isScenarioFilePath(ctx.path, ctx.semanticScenarioArtifact);
  const hasIndicatorDefinition = isIndicatorFilePath(ctx.path);
  const hasAnalysisScript = isAnalysisScriptPath(ctx.path);
  const hasResultArtifact = isResultArtifactPath(ctx.path, {
    semanticAnalysisOutput: ctx.semanticAnalysisOutput,
    semanticGenerated: ctx.semanticGenerated,
  });
  const hasUserSelection = Boolean(ctx.selectionText && ctx.selectionText.length > 0);

  return {
    hasActiveTab: true,
    hasScenarioFile,
    hasIndicatorDefinition,
    hasAnalysisScript,
    hasResultArtifact,
    hasUserSelection,
    canOpenScenario: hasScenarioFile,
    // Attaching a script is meaningful for any analysis script (a selection is
    // a stronger signal of explicit intent but not strictly required).
    canAttachScript: hasAnalysisScript,
    canRegisterIndicator: hasIndicatorDefinition,
    canSendResultArtifact: hasResultArtifact,
  };
}

// ── Workspace + bus helpers ───────────────────────────────────────────────

function buildArtifact(
  id: string,
  type: SynapseArtifactType,
  title: string,
  uri: string,
  options: {
    method: string;
    summary?: string;
    fileRange?: { startLine: number; endLine: number };
    scenarioId?: string;
  },
): SynapseArtifactEntry {
  const now = busTimestamp();
  return {
    id,
    type,
    title,
    uri,
    status: 'active',
    ...(options.fileRange ? { fileRange: options.fileRange } : {}),
    ...(options.scenarioId ? { scenarioId: options.scenarioId } : {}),
    provenance: {
      sourceModule: 'ide',
      createdAt: now,
      method: truncateSummary(options.method, SUMMARY_MAX_CHARS),
    },
    updatedAt: now,
    tags: [IDE_URBAN_HANDOFF_TAG],
  };
}

function appendPendingHandoffId(artifactId: string): void {
  const ws = useSynapseWorkspaceStore.getState();
  const existing = ws.syncState.pendingHandoffIds;
  ws.setPendingHandoffIds(Array.from(new Set([...existing, artifactId])));
}

function markUrbanHandoff(artifactId?: string): void {
  const ws = useSynapseWorkspaceStore.getState();
  ws.updateModuleSync('urban-analytics', {
    online: true,
    lastHandoffAt: busTimestamp(),
    ...(artifactId ? { lastArtifactId: artifactId } : {}),
  });
}

function emitArtifactRegister(
  entry: SynapseArtifactEntry,
  summary: string,
  relatedFilePaths: string[],
  options: {
    language?: string | undefined;
    artifactKind?: string | undefined;
    sizeBytes?: number | undefined;
    relatedRunIds?: string[] | undefined;
    relatedArtifactIds?: string[] | undefined;
  } = {},
): void {
  synapseBus.emit('evidence.artifact.register', {
    artifactId: entry.id,
    artifactType: entry.type,
    sourceModule: 'ide',
    source: 'ide',
    title: entry.title,
    summary: truncateSummary(summary, 256),
    relatedFilePaths,
    ...(options.language ? { language: options.language } : {}),
    ...(options.artifactKind ? { artifactKind: options.artifactKind } : {}),
    ...(typeof options.sizeBytes === 'number' ? { sizeBytes: options.sizeBytes } : {}),
    ...(options.relatedRunIds?.length ? { relatedRunIds: options.relatedRunIds } : {}),
    ...(options.relatedArtifactIds?.length ? { relatedArtifactIds: options.relatedArtifactIds } : {}),
    requestedAt: busTimestamp(),
  });
}

function deriveScenarioId(path: string): string {
  // Stable, human-readable scenario ID from path stem; keeps cross-session
  // correlation possible when the same scenario file is reopened.
  const stem = pathStem(path).replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return stem ? `scenario-${stem}` : `scenario-${Date.now().toString(36)}`;
}

// ── Public commands ───────────────────────────────────────────────────────

/**
 * Opens the Urban Analytics workbench and announces an active scenario.
 * The scenario reference is registered as a workspace artifact and broadcast
 * via `analytics.scenario.open` for any future Urban Analytics receiver.
 */
export function openScenarioInUrbanAnalytics(): IdeUrbanHandoffOutcome {
  const eligibility = evaluateIdeUrbanHandoffEligibility();
  if (!eligibility.canOpenScenario) {
    return { ok: false, reason: 'Open a scenario configuration file (filename containing "scenario") first.' };
  }

  const ctx = getActiveTabContext();
  if (!ctx) return { ok: false, reason: 'No active file context.' };

  const normalizedPath = normalizePath(ctx.path);
  const scenarioId = deriveScenarioId(ctx.path);
  const artifactId = createHandoffId('artifact');

  const entry = buildArtifact(
    artifactId,
    'scenario',
    `Scenario: ${pathBaseName(ctx.path)}`,
    normalizedPath,
    {
      method: 'IDE → Urban Analytics scenario open',
      scenarioId,
    },
  );

  const ws = useSynapseWorkspaceStore.getState();
  ws.registerArtifact(entry);
  appendPendingHandoffId(artifactId);
  markUrbanHandoff(artifactId);

  // Open the workbench (signature verified: () => void).
  useUrbanStore.getState().open();

  // Typed bus: scenario open contract.
  synapseBus.emit('analytics.scenario.open', {
    scenarioId,
    filePath: normalizedPath,
    title: pathBaseName(ctx.path),
    source: 'ide',
    requestedAt: busTimestamp(),
  });

  // Companion evidence registration so generic consumers (AI panel, evidence
  // tray) see the same artifact.
  emitArtifactRegister(
    entry,
    `Scenario configuration referenced from ${pathBaseName(ctx.path)}`,
    [normalizedPath],
    {
      language: ctx.language,
      artifactKind: inferUrbanArtifactKind(ctx.path),
      sizeBytes: ctx.contentLength,
    },
  );

  return { ok: true, artifactId, scenarioId };
}

/**
 * Attaches the active analysis script to the most recently opened scenario
 * (or, if none is known, registers the script as a standalone code artifact).
 * The script is never copied — only its path / range / provenance is stored.
 */
export function attachScriptToScenario(): IdeUrbanHandoffOutcome {
  const eligibility = evaluateIdeUrbanHandoffEligibility();
  if (!eligibility.canAttachScript) {
    return { ok: false, reason: 'Open a Python / R / SQL / notebook analysis script first.' };
  }

  const ctx = getActiveTabContext();
  if (!ctx) return { ok: false, reason: 'No active file context.' };

  const normalizedPath = normalizePath(ctx.path);
  const artifactId = createHandoffId('artifact');

  // Reuse the most recent scenario in workspace memory (if any) so the script
  // links to a real scenario reference rather than fabricating one.
  const recentScenario = useSynapseWorkspaceStore
    .getState()
    .artifacts.find((a) => a.type === 'scenario');

  const entry = buildArtifact(
    artifactId,
    'code',
    `Script: ${pathBaseName(ctx.path)}`,
    normalizedPath,
    {
      method: recentScenario
        ? `Attached to scenario ${recentScenario.scenarioId ?? recentScenario.id}`
        : 'IDE → Urban Analytics script attach (no active scenario)',
      ...(ctx.selectionLineRange ? { fileRange: ctx.selectionLineRange } : {}),
      ...(recentScenario?.scenarioId ? { scenarioId: recentScenario.scenarioId } : {}),
    },
  );

  const ws = useSynapseWorkspaceStore.getState();
  ws.registerArtifact(entry);
  appendPendingHandoffId(artifactId);
  markUrbanHandoff(artifactId);

  useUrbanStore.getState().open();

  emitArtifactRegister(
    entry,
    recentScenario
      ? `Script attached to scenario "${recentScenario.title}"`
      : `Analysis script registered without an active scenario`,
    [normalizedPath],
    {
      language: ctx.language,
      artifactKind: inferUrbanArtifactKind(ctx.path),
      sizeBytes: ctx.contentLength,
      ...(recentScenario ? { relatedArtifactIds: [recentScenario.id] } : {}),
    },
  );

  return {
    ok: true,
    artifactId,
    ...(recentScenario?.scenarioId ? { scenarioId: recentScenario.scenarioId } : {}),
  };
}

/**
 * Registers the active file (or selection) as an indicator definition
 * artifact and surfaces the Urban Analytics workbench so the user can locate
 * the matching catalog card.
 */
export function registerIndicatorDefinition(): IdeUrbanHandoffOutcome {
  const eligibility = evaluateIdeUrbanHandoffEligibility();
  if (!eligibility.canRegisterIndicator) {
    return { ok: false, reason: 'Open an indicator definition (filename or path containing "indicator" / "kpi") first.' };
  }

  const ctx = getActiveTabContext();
  if (!ctx) return { ok: false, reason: 'No active file context.' };

  const normalizedPath = normalizePath(ctx.path);
  const artifactId = createHandoffId('artifact');

  const entry = buildArtifact(
    artifactId,
    'indicator',
    `Indicator: ${pathBaseName(ctx.path)}`,
    normalizedPath,
    {
      method: 'IDE → Urban Analytics indicator registration',
      ...(ctx.selectionLineRange ? { fileRange: ctx.selectionLineRange } : {}),
    },
  );

  const ws = useSynapseWorkspaceStore.getState();
  ws.registerArtifact(entry);
  appendPendingHandoffId(artifactId);
  markUrbanHandoff(artifactId);

  useUrbanStore.getState().open();

  emitArtifactRegister(
    entry,
    `Indicator definition registered from ${pathBaseName(ctx.path)}`,
    [normalizedPath],
    {
      language: ctx.language,
      artifactKind: inferUrbanArtifactKind(ctx.path),
      sizeBytes: ctx.contentLength,
    },
  );

  return { ok: true, artifactId };
}

/**
 * Sends an analytical result artifact (CSV / Parquet / report file) reference
 * to Urban Analytics and broadcasts an `analytics.artifact.publish` event so
 * downstream consumers (evidence tray, future Urban modal) can surface it.
 */
export function sendResultArtifactToUrbanAnalytics(): IdeUrbanHandoffOutcome {
  const eligibility = evaluateIdeUrbanHandoffEligibility();
  if (!eligibility.canSendResultArtifact) {
    return { ok: false, reason: 'Open a result artifact (file under /results, /outputs, or marked as analysis output) first.' };
  }

  const ctx = getActiveTabContext();
  if (!ctx) return { ok: false, reason: 'No active file context.' };

  const normalizedPath = normalizePath(ctx.path);
  const artifactId = createHandoffId('artifact');

  // Reuse the most recent scenario in workspace memory if available so the
  // result attaches to a real scenario reference rather than dangling.
  const recentScenario = useSynapseWorkspaceStore
    .getState()
    .artifacts.find((a) => a.type === 'scenario');

  const entry = buildArtifact(
    artifactId,
    'analysis-result',
    `Result: ${pathBaseName(ctx.path)}`,
    normalizedPath,
    {
      method: 'IDE → Urban Analytics result artifact send',
      ...(recentScenario?.scenarioId ? { scenarioId: recentScenario.scenarioId } : {}),
    },
  );

  const ws = useSynapseWorkspaceStore.getState();
  ws.registerArtifact(entry);
  appendPendingHandoffId(artifactId);
  markUrbanHandoff(artifactId);

  useUrbanStore.getState().open();

  // Typed bus: artifact publish (mirrors urban-analytics → ide direction so
  // the contract remains symmetric for receivers).
  synapseBus.emit('analytics.artifact.publish', {
    artifactId,
    artifactType: entry.type,
    title: entry.title,
    summary: truncateSummary(`Result artifact published from ${pathBaseName(ctx.path)}`, 256),
    source: 'ide',
    requestedAt: busTimestamp(),
  });

  emitArtifactRegister(
    entry,
    `Result artifact handed off from ${pathBaseName(ctx.path)}`,
    [normalizedPath],
    {
      language: ctx.language,
      artifactKind: inferUrbanArtifactKind(ctx.path),
      sizeBytes: ctx.contentLength,
      ...(recentScenario ? { relatedArtifactIds: [recentScenario.id] } : {}),
    },
  );

  return {
    ok: true,
    artifactId,
    ...(recentScenario?.scenarioId ? { scenarioId: recentScenario.scenarioId } : {}),
  };
}

// ── Diagnostics (read-only) ───────────────────────────────────────────────

/** Test/debug helper — exposes the active context without leaking content. */
export function _describeActiveTabForUrbanHandoff(): ActiveTabContext | null {
  return getActiveTabContext();
}
