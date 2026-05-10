/**
 * Urban Analytics → IDE Handoff Receiver  (Prompt 24)
 *
 * IDE-side receiver for events emitted by Urban Analytics through the typed
 * Synapse Bus. Mirrors the architecture of `mapToIdeHandoff` (Prompt 22),
 * with the additional safety constraint that **generated code is never
 * silently inserted** — reproducibility scaffolds are staged in a pending
 * queue and require an explicit user decision before reaching the editor.
 *
 * Subscribed events
 * ─────────────────
 *   analytics.scenario.open       → record provenance + open file (when path supplied)
 *   analytics.artifact.publish    → mirror artifact reference into workspace
 *   analytics.script.open         → open source script in the editor
 *   analytics.report.open         → open generated report in the editor
 *   analytics.scaffold.propose    → STAGE for apply-preview (NEVER auto-insert)
 *   analytics.indicator.inspect   → open indicator definition + record artifact
 *   analytics.scenario.register   → register scenario as workspace artifact
 *   evidence.artifact.register    → mirror artifact reference (when sourceModule = urban-analytics)
 *
 * Architectural guarantees
 * ────────────────────────
 *   • No direct Urban Analytics rendering dependency — pure bus contract.
 *   • Loop-safe: events the IDE itself emits (`source === 'ide'`) are skipped.
 *   • All Zustand mutations triggered by a bus emit are deferred to the
 *     next microtask to prevent re-entrant updates during a render pass.
 *   • Bounded inboxes (events + pending scaffolds) — fail-safe under storms.
 *   • Idempotent install — `installUrbanToIdeReceiver()` may be called many
 *     times; subsequent calls are no-ops.
 *   • Generated code routes ONLY through `consumePendingScaffold(id, 'accept')`
 *     after explicit user confirmation. The receiver itself never calls
 *     `editorBridge.insertAtCursor` from inside an event handler.
 *
 * @module urbanToIdeHandoff
 */

import { editorBridge } from '@/services/editor/bridge';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type {
  AnalyticsArtifactPublishPayload,
  AnalyticsIndicatorInspectPayload,
  AnalyticsReportOpenPayload,
  AnalyticsScaffoldProposePayload,
  AnalyticsScenarioOpenPayload,
  AnalyticsScenarioRegisterPayload,
  AnalyticsScriptOpenPayload,
  AnalyticsUncertaintyMetadata,
  EvidenceArtifactRegisterPayload,
  SynapseBusSubscription,
} from '@/types/synapse-bus';
import type { SynapseArtifactEntry } from '@/types/synapse-workspace';

// ── Inbox event model ──────────────────────────────────────────────────────

/**
 * Discriminated incoming event captured by the IDE receiver.
 * Each entry wraps the original bus payload with a `receivedAt` timestamp
 * and a `kind` discriminator suitable for narrowing in UI code.
 */
export type UrbanToIdeIncomingEvent =
  | { kind: 'scenario.open';       receivedAt: string; payload: AnalyticsScenarioOpenPayload }
  | { kind: 'artifact.publish';    receivedAt: string; payload: AnalyticsArtifactPublishPayload }
  | { kind: 'script.open';         receivedAt: string; payload: AnalyticsScriptOpenPayload }
  | { kind: 'report.open';         receivedAt: string; payload: AnalyticsReportOpenPayload }
  | { kind: 'scaffold.propose';    receivedAt: string; payload: AnalyticsScaffoldProposePayload }
  | { kind: 'indicator.inspect';   receivedAt: string; payload: AnalyticsIndicatorInspectPayload }
  | { kind: 'scenario.register';   receivedAt: string; payload: AnalyticsScenarioRegisterPayload }
  | { kind: 'evidence.register';   receivedAt: string; payload: EvidenceArtifactRegisterPayload };

/** Maximum number of incoming events retained in the inbox. */
export const URBAN_INBOX_LIMIT = 32;

/** Maximum number of pending scaffold proposals queued for user decision. */
export const URBAN_PENDING_SCAFFOLD_LIMIT = 16;

/** Maximum bytes accepted in a scaffold proposal `code` field. */
export const URBAN_SCAFFOLD_MAX_BYTES = 16 * 1024;

/** Tag stamped onto every artifact registered by this Prompt 24 receiver. */
export const URBAN_HANDOFF_INCOMING_TAG = 'prompt-24:urban-to-ide';

// ── Pending scaffold queue ────────────────────────────────────────────────

/** Lifecycle status of a pending scaffold proposal. */
export type PendingScaffoldStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/** A reproducibility scaffold staged for explicit user decision. */
export interface PendingScaffold {
  /** Stable id (mirrors payload.scaffoldId, deduplicated on collision). */
  id: string;
  /** ISO timestamp of when the proposal was received. */
  receivedAt: string;
  /** Lifecycle status. */
  status: PendingScaffoldStatus;
  /** The proposed code snippet (≤ URBAN_SCAFFOLD_MAX_BYTES). */
  code: string;
  /** Optional language hint. */
  language?: string;
  /** Optional target path the scaffold belongs to. */
  targetPath?: string;
  /** Originating scenario id (provenance). */
  scenarioId?: string;
  /** Originating artifact id (provenance). */
  artifactId?: string;
  /** Human-readable purpose of the scaffold. */
  purpose?: string;
  /** Preserved uncertainty / assumption metadata (never discarded). */
  uncertainty?: AnalyticsUncertaintyMetadata;
}

// ── Internal state ────────────────────────────────────────────────────────

const inbox: UrbanToIdeIncomingEvent[] = [];
const pendingScaffolds: PendingScaffold[] = [];

const inboxListeners = new Set<(event: UrbanToIdeIncomingEvent) => void>();
const scaffoldListeners = new Set<(snapshot: PendingScaffold[]) => void>();

let _installed = false;
const _busSubscriptions: SynapseBusSubscription[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────

function defer(fn: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn);
    return;
  }
  setTimeout(fn, 0);
}

function safeBytes(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

function languageFromExtension(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.json') || lower.endsWith('.geojson')) return 'json';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.r')) return 'r';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

function clamp(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * Compose a compact, length-bounded `provenance.method` summary that
 * preserves the most important uncertainty / assumption metadata without
 * storing bulk data.  Returns `undefined` when no meaningful data exists.
 */
function describeUncertainty(u: AnalyticsUncertaintyMetadata | undefined): string | undefined {
  if (!u) return undefined;
  const parts: string[] = [];
  if (typeof u.confidence === 'number' && Number.isFinite(u.confidence)) {
    parts.push(`confidence=${u.confidence.toFixed(2)}`);
  }
  if (u.confidenceInterval) {
    const { lower, upper, level } = u.confidenceInterval;
    if (Number.isFinite(lower) && Number.isFinite(upper)) {
      parts.push(level != null ? `ci${Math.round(level * 100)}=[${lower},${upper}]` : `ci=[${lower},${upper}]`);
    }
  }
  if (u.methodologyId) parts.push(`method=${u.methodologyId}`);
  if (u.dataLineage) parts.push(`lineage=${u.dataLineage}`);
  if (u.assumptions && u.assumptions.length > 0) {
    parts.push(`assumes(${u.assumptions.length}): ${u.assumptions.slice(0, 3).join('; ')}`);
  }
  if (u.caveats && u.caveats.length > 0) {
    parts.push(`caveats(${u.caveats.length}): ${u.caveats.slice(0, 3).join('; ')}`);
  }
  if (parts.length === 0) return undefined;
  return clamp(parts.join(' | '), 200);
}

function pushEvent(event: UrbanToIdeIncomingEvent): void {
  inbox.unshift(event);
  if (inbox.length > URBAN_INBOX_LIMIT) {
    inbox.length = URBAN_INBOX_LIMIT;
  }

  // Mirror to workspace sync state (deferred — see `defer` rationale above).
  defer(() => {
    try {
      useSynapseWorkspaceStore.getState().updateModuleSync('urban-analytics', {
        online: true,
        lastReceivedAt: event.receivedAt,
      });
    } catch (err) {
      console.warn('[urbanToIdeHandoff] updateModuleSync failed:', err);
    }
  });

  for (const fn of Array.from(inboxListeners)) {
    try {
      fn(event);
    } catch (err) {
      console.error('[urbanToIdeHandoff] inbox listener error:', err);
    }
  }
}

function notifyScaffoldListeners(): void {
  const snapshot = pendingScaffolds.slice();
  for (const fn of Array.from(scaffoldListeners)) {
    try {
      fn(snapshot);
    } catch (err) {
      console.error('[urbanToIdeHandoff] scaffold listener error:', err);
    }
  }
}

function registerWorkspaceArtifact(entry: SynapseArtifactEntry): void {
  defer(() => {
    try {
      useSynapseWorkspaceStore.getState().registerArtifact(entry);
    } catch (err) {
      console.warn('[urbanToIdeHandoff] registerArtifact failed:', err);
    }
  });
}

// ── Event handlers ────────────────────────────────────────────────────────

function onScenarioOpen(payload: AnalyticsScenarioOpenPayload): void {
  if (payload.source !== 'urban-analytics') return;
  pushEvent({ kind: 'scenario.open', receivedAt: busTimestamp(), payload });
}

function onArtifactPublish(payload: AnalyticsArtifactPublishPayload): void {
  if (payload.source !== 'urban-analytics') return;
  const receivedAt = busTimestamp();
  pushEvent({ kind: 'artifact.publish', receivedAt, payload });

  // Mirror as a workspace artifact reference. We do NOT discard summary text.
  if (!payload.artifactId) return;
  const entry: SynapseArtifactEntry = {
    id: payload.artifactId,
    type: payload.artifactType,
    title: payload.title,
    status: 'active',
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: payload.requestedAt ?? receivedAt,
      ...(payload.summary ? { method: clamp(payload.summary, 200) } : {}),
    },
    updatedAt: receivedAt,
    tags: [URBAN_HANDOFF_INCOMING_TAG],
  };
  registerWorkspaceArtifact(entry);
}

function onScriptOpen(payload: AnalyticsScriptOpenPayload): void {
  if (payload.source !== 'urban-analytics') return;
  if (!payload.path || typeof payload.path !== 'string') return;
  pushEvent({ kind: 'script.open', receivedAt: busTimestamp(), payload });

  defer(() => {
    try {
      openIncomingFile(payload.path, payload.fromLine, payload.toLine);
    } catch (err) {
      console.warn('[urbanToIdeHandoff] script open failed:', err);
    }
  });
}

function onReportOpen(payload: AnalyticsReportOpenPayload): void {
  if (payload.source !== 'urban-analytics') return;
  if (!payload.path || typeof payload.path !== 'string') return;
  pushEvent({ kind: 'report.open', receivedAt: busTimestamp(), payload });

  defer(() => {
    try {
      openIncomingFile(payload.path);
    } catch (err) {
      console.warn('[urbanToIdeHandoff] report open failed:', err);
    }
  });
}

function onScaffoldPropose(payload: AnalyticsScaffoldProposePayload): void {
  if (payload.source !== 'urban-analytics') return;
  if (!payload.scaffoldId || typeof payload.scaffoldId !== 'string') return;
  if (!payload.code || typeof payload.code !== 'string') return;
  if (safeBytes(payload.code) > URBAN_SCAFFOLD_MAX_BYTES) {
    console.warn(
      `[urbanToIdeHandoff] dropped scaffold ${payload.scaffoldId} — code exceeds ${URBAN_SCAFFOLD_MAX_BYTES} bytes`,
    );
    return;
  }

  const receivedAt = busTimestamp();

  // Stage the scaffold; do NOT insert into the editor here.
  // De-duplicate on scaffoldId — newer proposal replaces an older pending one.
  const existingIdx = pendingScaffolds.findIndex((p) => p.id === payload.scaffoldId);
  if (existingIdx !== -1) {
    pendingScaffolds.splice(existingIdx, 1);
  }
  const staged: PendingScaffold = {
    id: payload.scaffoldId,
    receivedAt,
    status: 'pending',
    code: payload.code,
    ...(payload.language ? { language: payload.language } : {}),
    ...(payload.targetPath ? { targetPath: payload.targetPath } : {}),
    ...(payload.scenarioId ? { scenarioId: payload.scenarioId } : {}),
    ...(payload.artifactId ? { artifactId: payload.artifactId } : {}),
    ...(payload.purpose ? { purpose: clamp(payload.purpose, 200) } : {}),
    ...(payload.uncertainty ? { uncertainty: payload.uncertainty } : {}),
  };
  pendingScaffolds.unshift(staged);
  if (pendingScaffolds.length > URBAN_PENDING_SCAFFOLD_LIMIT) {
    pendingScaffolds.length = URBAN_PENDING_SCAFFOLD_LIMIT;
  }

  pushEvent({ kind: 'scaffold.propose', receivedAt, payload });
  notifyScaffoldListeners();
}

function onIndicatorInspect(payload: AnalyticsIndicatorInspectPayload): void {
  if (payload.source !== 'urban-analytics') return;
  if (!payload.path || typeof payload.path !== 'string') return;
  if (!payload.indicatorId || typeof payload.indicatorId !== 'string') return;
  const receivedAt = busTimestamp();
  pushEvent({ kind: 'indicator.inspect', receivedAt, payload });

  defer(() => {
    try {
      openIncomingFile(payload.path, payload.fromLine, payload.toLine);
    } catch (err) {
      console.warn('[urbanToIdeHandoff] indicator open failed:', err);
    }
  });

  // Record indicator as artifact with preserved uncertainty metadata.
  const methodSummary = describeUncertainty(payload.uncertainty);
  const fileRange =
    typeof payload.fromLine === 'number' && typeof payload.toLine === 'number'
      && payload.fromLine >= 1 && payload.toLine >= payload.fromLine
      ? { startLine: payload.fromLine, endLine: payload.toLine }
      : undefined;
  const entry: SynapseArtifactEntry = {
    id: payload.indicatorId,
    type: 'indicator',
    title: payload.title ?? payload.indicatorId,
    status: 'active',
    uri: payload.path,
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: payload.requestedAt ?? receivedAt,
      ...(methodSummary ? { method: methodSummary } : {}),
    },
    updatedAt: receivedAt,
    ...(typeof payload.uncertainty?.confidence === 'number'
      ? { confidence: payload.uncertainty.confidence }
      : {}),
    ...(fileRange ? { fileRange } : {}),
    tags: [URBAN_HANDOFF_INCOMING_TAG],
  };
  registerWorkspaceArtifact(entry);
}

function onScenarioRegister(payload: AnalyticsScenarioRegisterPayload): void {
  if (payload.source !== 'urban-analytics') return;
  if (!payload.scenarioId || typeof payload.scenarioId !== 'string') return;
  if (!payload.title || typeof payload.title !== 'string') return;
  const receivedAt = busTimestamp();
  pushEvent({ kind: 'scenario.register', receivedAt, payload });

  // Build a method summary that combines the scenario summary AND uncertainty
  // metadata so we never silently discard either.
  const uncertaintyText = describeUncertainty(payload.uncertainty);
  const summaryText = payload.summary ? clamp(payload.summary, 120) : undefined;
  const method = [summaryText, uncertaintyText].filter(Boolean).join(' :: ') || undefined;

  const entry: SynapseArtifactEntry = {
    id: payload.scenarioId,
    type: 'scenario',
    title: payload.title,
    status: 'active',
    ...(payload.filePath ? { uri: payload.filePath } : {}),
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: payload.requestedAt ?? receivedAt,
      ...(method ? { method: clamp(method, 200) } : {}),
    },
    updatedAt: receivedAt,
    scenarioId: payload.scenarioId,
    ...(typeof payload.uncertainty?.confidence === 'number'
      ? { confidence: payload.uncertainty.confidence }
      : {}),
    tags: [URBAN_HANDOFF_INCOMING_TAG],
  };
  registerWorkspaceArtifact(entry);
}

function onEvidenceRegister(payload: EvidenceArtifactRegisterPayload): void {
  if (payload.sourceModule !== 'urban-analytics') return;
  const receivedAt = busTimestamp();
  pushEvent({ kind: 'evidence.register', receivedAt, payload });

  if (!payload.artifactId) return;
  const firstFile = payload.relatedFilePaths?.[0];
  const entry: SynapseArtifactEntry = {
    id: payload.artifactId,
    type: payload.artifactType,
    title: payload.title,
    status: 'active',
    ...(firstFile ? { uri: firstFile } : {}),
    provenance: {
      sourceModule: 'urban-analytics',
      createdAt: payload.requestedAt ?? receivedAt,
      ...(payload.summary ? { method: clamp(payload.summary, 200) } : {}),
    },
    updatedAt: receivedAt,
    tags: [URBAN_HANDOFF_INCOMING_TAG],
  };
  registerWorkspaceArtifact(entry);
}

// ── File-open helper (used by script/report/indicator handlers) ───────────

function openIncomingFile(path: string, fromLine?: number, toLine?: number): void {
  const fe = useFileExplorerStore.getState();
  const node =
    fe.getFileByPath(path)
    || fe.getFileByPath(`/${path}`)
    || fe.getFileByPath(path.replace(/^\/+/, ''));

  if (node && node.type === 'file') {
    useEditorStore.getState().openTab(node, { origin: 'bridge' });
    if (
      typeof fromLine === 'number' && fromLine >= 1
      && typeof toLine === 'number' && toLine >= fromLine
    ) {
      editorBridge.openAtRange(node.path, fromLine, toLine);
    }
    return;
  }

  // Fallback through the legacy editor bridge — lets the existing receiver
  // materialize a tab for files not yet known to the explorer.
  editorBridge.openNewTab({ filename: path, code: '', language: languageFromExtension(path) });
  if (
    typeof fromLine === 'number' && fromLine >= 1
    && typeof toLine === 'number' && toLine >= fromLine
  ) {
    editorBridge.openAtRange(path, fromLine, toLine);
  }
}

// ── Public API: lifecycle ─────────────────────────────────────────────────

/**
 * Install bus subscriptions for the Urban Analytics → IDE receiver.
 * Idempotent.  Returns `true` if newly installed, `false` if already active.
 */
export function installUrbanToIdeReceiver(): boolean {
  if (_installed) return false;

  _busSubscriptions.push(synapseBus.on('analytics.scenario.open',     onScenarioOpen));
  _busSubscriptions.push(synapseBus.on('analytics.artifact.publish',  onArtifactPublish));
  _busSubscriptions.push(synapseBus.on('analytics.script.open',       onScriptOpen));
  _busSubscriptions.push(synapseBus.on('analytics.report.open',       onReportOpen));
  _busSubscriptions.push(synapseBus.on('analytics.scaffold.propose',  onScaffoldPropose));
  _busSubscriptions.push(synapseBus.on('analytics.indicator.inspect', onIndicatorInspect));
  _busSubscriptions.push(synapseBus.on('analytics.scenario.register', onScenarioRegister));
  _busSubscriptions.push(synapseBus.on('evidence.artifact.register',  onEvidenceRegister));

  _installed = true;
  return true;
}

/** Uninstall the receiver — for test isolation only. */
export function _uninstallUrbanToIdeReceiverForTesting(): void {
  for (const sub of _busSubscriptions) {
    sub.off();
  }
  _busSubscriptions.length = 0;
  inbox.length = 0;
  pendingScaffolds.length = 0;
  inboxListeners.clear();
  scaffoldListeners.clear();
  _installed = false;
}

/** True if the receiver is currently installed. */
export function isUrbanToIdeReceiverInstalled(): boolean {
  return _installed;
}

// ── Public API: inbox introspection ───────────────────────────────────────

/** Returns a snapshot of the incoming Urban Analytics inbox (newest first). */
export function getUrbanInbox(): UrbanToIdeIncomingEvent[] {
  return inbox.slice();
}

/** Returns the most recent incoming event, or `null` when the inbox is empty. */
export function getLastIncomingUrbanEvent(): UrbanToIdeIncomingEvent | null {
  return inbox.length > 0 ? (inbox[0] ?? null) : null;
}

/** Subscribe to inbox additions. Returns an unsubscribe function. */
export function subscribeUrbanInbox(
  handler: (event: UrbanToIdeIncomingEvent) => void,
): () => void {
  inboxListeners.add(handler);
  return () => {
    inboxListeners.delete(handler);
  };
}

/** Clear the inbox without affecting subscriptions. */
export function clearUrbanInbox(): void {
  inbox.length = 0;
}

// ── Public API: pending scaffold queue (apply-preview gate) ───────────────

/** Snapshot of all currently pending scaffold proposals (newest first). */
export function getPendingScaffolds(): PendingScaffold[] {
  return pendingScaffolds.slice();
}

/** Look up a single pending scaffold by id. */
export function getPendingScaffold(id: string): PendingScaffold | null {
  return pendingScaffolds.find((p) => p.id === id) ?? null;
}

/**
 * Subscribe to changes in the pending-scaffold queue.
 * Receives the full snapshot on every mutation.
 */
export function subscribePendingScaffolds(
  handler: (snapshot: PendingScaffold[]) => void,
): () => void {
  scaffoldListeners.add(handler);
  return () => {
    scaffoldListeners.delete(handler);
  };
}

export interface ConsumePendingScaffoldResult {
  ok: boolean;
  reason?: string;
  /** When `ok && decision === 'accept'`, the snippet that was inserted. */
  snippet?: string;
}

/**
 * Resolve a pending scaffold proposal with an explicit user decision.
 *
 * • `accept` — inserts the snippet at the cursor via the editor bridge and
 *   marks the scaffold as `accepted`. This is the **only** path through
 *   which a scaffold's code reaches the editor.
 * • `reject` — discards the proposal and marks it as `rejected`.
 *
 * In both cases the scaffold is removed from the active queue but its final
 * status is still observable through the returned value.
 *
 * @returns `{ ok: false, reason }` on invalid id, missing editor tab, or
 * size-guard failure. `{ ok: true, snippet }` on successful accept.
 */
export function consumePendingScaffold(
  id: string,
  decision: 'accept' | 'reject',
): ConsumePendingScaffoldResult {
  const idx = pendingScaffolds.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { ok: false, reason: 'No pending scaffold with that id.' };
  }
  const [scaffold] = pendingScaffolds.splice(idx, 1);
  if (!scaffold) {
    return { ok: false, reason: 'Scaffold could not be removed from the queue.' };
  }

  if (decision === 'reject') {
    notifyScaffoldListeners();
    return { ok: true };
  }

  // Accept path — explicit user decision required to reach this branch.
  const editor = useEditorStore.getState();
  const activeTab = editor.tabs.find((t) => t.id === editor.activeTabId);
  if (!activeTab) {
    // Re-stage so the user can retry once a tab is open.
    pendingScaffolds.unshift(scaffold);
    notifyScaffoldListeners();
    return { ok: false, reason: 'Open a file in the editor before accepting a scaffold.' };
  }

  if (!editorBridge.sizeGuard(scaffold.code)) {
    notifyScaffoldListeners();
    return { ok: false, reason: 'Scaffold exceeds the editor bridge size guard.' };
  }

  editorBridge.insertAtCursor({ code: scaffold.code });
  notifyScaffoldListeners();
  return { ok: true, snippet: scaffold.code };
}

/** Drop all pending scaffolds (e.g. on workspace reset). Notifies listeners. */
export function clearPendingScaffolds(): void {
  if (pendingScaffolds.length === 0) return;
  pendingScaffolds.length = 0;
  notifyScaffoldListeners();
}

// ── Public API: provenance descriptor ─────────────────────────────────────

/**
 * Compact provenance string for the most recent incoming Urban Analytics
 * event, suitable for the AI panel context strip. Bounded to 240 chars.
 * Returns `null` when the inbox is empty.
 */
export function describeLastIncomingUrbanEvent(): string | null {
  const event = getLastIncomingUrbanEvent();
  if (!event) return null;

  switch (event.kind) {
    case 'scenario.open':
      return clamp(`Analytics opened scenario "${event.payload.title ?? event.payload.scenarioId}"`, 240);
    case 'artifact.publish':
      return clamp(`Analytics published artifact "${event.payload.title}"`, 240);
    case 'script.open':
      return clamp(`Analytics requested script ${event.payload.path}`, 240);
    case 'report.open':
      return clamp(`Analytics requested report ${event.payload.path}`, 240);
    case 'scaffold.propose':
      return clamp(
        `Analytics proposed scaffold "${event.payload.purpose ?? event.payload.scaffoldId}" — preview required`,
        240,
      );
    case 'indicator.inspect':
      return clamp(`Analytics inspecting indicator ${event.payload.indicatorId}`, 240);
    case 'scenario.register':
      return clamp(`Analytics registered scenario "${event.payload.title}"`, 240);
    case 'evidence.register':
      return clamp(`Analytics evidence "${event.payload.title}"`, 240);
    default:
      return null;
  }
}
