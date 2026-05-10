/**
 * Map Explorer → IDE Handoff Receiver  (Prompt 22)
 *
 * IDE-side receiver that listens for cross-module events emitted by Map
 * Explorer through the typed Synapse Bus and translates them into safe,
 * traceable IDE actions:
 *
 *   1. Maintains a bounded inbox of incoming Map Explorer events so the
 *      AI panel and other IDE surfaces can display provenance (which layer
 *      was focused, which selection was exported, which artifact was
 *      registered, and when).
 *   2. Auto-registers spatial artifacts the Map Explorer publishes through
 *      `evidence.artifact.register` into the local Synapse workspace memory
 *      so they survive a reload and can be referenced as evidence.
 *   3. Updates the cross-module sync snapshot for `map-explorer` whenever
 *      an event is received, so the IDE has a truthful "last contact" timestamp.
 *   4. Exposes explicit, user-driven imperative actions:
 *        • `openMapAnalysisScript(...)` — open the analysis script or file
 *           a Map Explorer artifact references.
 *        • `insertSpatialQueryScaffold(...)` — insert a small, fully-typed
 *           code snippet at the cursor that references the latest map
 *           selection / layer by id (never raw geometry).
 *
 * Architecture guarantees
 * ───────────────────────
 *   • No direct dependency on Map Explorer rendering internals — only on
 *     bus payload contracts in `@/types/synapse-bus.ts`.
 *   • No bulky payloads ever reach the IDE — the receiver records ids,
 *     titles, counts, and timestamps only.
 *   • Bidirectional loop-safe — events emitted by the IDE itself
 *     (`source === 'ide'`) are skipped; we only react to genuine
 *     Map Explorer traffic.
 *   • Idempotent install — `installMapToIdeReceiver()` is safe to call
 *     multiple times; subsequent calls are no-ops.
 *
 * Event filtering rules
 * ─────────────────────
 *   ┌─────────────────────────────┬────────────────────────────────────────┐
 *   │ Event                       │ Accepted when …                        │
 *   ├─────────────────────────────┼────────────────────────────────────────┤
 *   │ map.layer.focus             │ payload.source === 'map-explorer'      │
 *   │ map.selection.export        │ payload.source === 'map-explorer'      │
 *   │ evidence.artifact.register  │ payload.sourceModule === 'map-explorer'│
 *   └─────────────────────────────┴────────────────────────────────────────┘
 *
 * @module mapToIdeHandoff
 */

import { editorBridge } from '@/services/editor/bridge';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { FileNode } from '@/types/state';
import type {
  EvidenceArtifactRegisterPayload,
  MapLayerFocusPayload,
  MapSelectionExportPayload,
  SynapseBusSubscription,
} from '@/types/synapse-bus';
import type { SynapseArtifactEntry } from '@/types/synapse-workspace';

// ── Inbox event model ──────────────────────────────────────────────────────

/**
 * Discriminated incoming event captured by the IDE receiver.
 *
 * The receiver wraps every accepted bus payload with a stable `receivedAt`
 * timestamp and a friendly `kind` discriminator that downstream UI can
 * narrow on directly.
 */
export type MapToIdeIncomingEvent =
  | {
      kind: 'layer.focus';
      receivedAt: string;
      payload: MapLayerFocusPayload;
    }
  | {
      kind: 'selection.export';
      receivedAt: string;
      payload: MapSelectionExportPayload;
    }
  | {
      kind: 'artifact.register';
      receivedAt: string;
      payload: EvidenceArtifactRegisterPayload;
    };

/** Maximum number of incoming events retained in the inbox. */
export const MAP_INBOX_LIMIT = 32;

/** Maximum bytes of a single inserted spatial scaffold snippet. */
const SCAFFOLD_MAX_BYTES = 4 * 1024;

/** Tag applied to artifacts auto-registered from incoming map events. */
export const MAP_HANDOFF_INCOMING_TAG = 'prompt-22:map-to-ide';

// ── Internal state ─────────────────────────────────────────────────────────

const inbox: MapToIdeIncomingEvent[] = [];
const listeners = new Set<(event: MapToIdeIncomingEvent) => void>();

let _installed = false;
const _busSubscriptions: SynapseBusSubscription[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Defer side-effects off the synchronous bus-emit call stack so that
 * Zustand mutations from inside a bus handler can never re-enter a render
 * pass that may be in flight. Falls back to setTimeout for environments
 * without `queueMicrotask` (e.g. very old test runners).
 */
function defer(fn: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn);
    return;
  }
  setTimeout(fn, 0);
}

function pushEvent(event: MapToIdeIncomingEvent): void {
  inbox.unshift(event);
  if (inbox.length > MAP_INBOX_LIMIT) {
    inbox.length = MAP_INBOX_LIMIT;
  }

  // Mirror to workspace sync state — truthful "last contact" timestamp.
  // Deferred so an emit that happens during a React render can never
  // synchronously trigger a Zustand update on the same tick.
  defer(() => {
    try {
      useSynapseWorkspaceStore.getState().updateModuleSync('map-explorer', {
        online: true,
        lastReceivedAt: event.receivedAt,
      });
    } catch (err) {
      console.warn('[mapToIdeHandoff] updateModuleSync failed:', err);
    }
  });

  // Notify subscribers, but never let one bad listener block the others.
  for (const fn of Array.from(listeners)) {
    try {
      fn(event);
    } catch (err) {
      console.error('[mapToIdeHandoff] inbox listener error:', err);
    }
  }
}

function pathBaseName(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function languageFromExtension(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.geojson') || lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.r')) return 'r';
  return 'plaintext';
}

function safeBytes(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

function inferIncomingArtifactType(
  payload: EvidenceArtifactRegisterPayload,
): SynapseArtifactEntry['type'] {
  // Trust the publisher's declared type when it is one we recognize; otherwise
  // fall back to a conservative `unknown` so we never fabricate provenance.
  switch (payload.artifactType) {
    case 'spatial-layer':
    case 'spatial-selection':
    case 'analysis-result':
    case 'report':
    case 'scenario':
    case 'indicator':
    case 'code':
    case 'generated-patch':
    case 'unknown':
      return payload.artifactType;
    default:
      return 'unknown';
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

function onLayerFocus(payload: MapLayerFocusPayload): void {
  if (payload.source !== 'map-explorer') return;
  pushEvent({
    kind: 'layer.focus',
    receivedAt: busTimestamp(),
    payload,
  });
}

function onSelectionExport(payload: MapSelectionExportPayload): void {
  if (payload.source !== 'map-explorer') return;
  pushEvent({
    kind: 'selection.export',
    receivedAt: busTimestamp(),
    payload,
  });
}

function onEvidenceRegister(payload: EvidenceArtifactRegisterPayload): void {
  if (payload.sourceModule !== 'map-explorer') return;

  const receivedAt = busTimestamp();

  // Mirror the published artifact reference into local workspace memory so
  // the IDE has its own provenance record. We register only references and
  // metadata — never raw geometry or feature contents — per alignment spec §7.2.
  // Deferred to the next microtask so a bus emit that occurs during a React
  // render never re-enters Zustand synchronously.
  defer(() => {
    try {
      const ws = useSynapseWorkspaceStore.getState();
      const trimmedSummary = payload.summary
        ? payload.summary.slice(0, 256)
        : undefined;
      const firstFile = payload.relatedFilePaths?.[0];

      const entry: SynapseArtifactEntry = {
        id: payload.artifactId,
        type: inferIncomingArtifactType(payload),
        title: payload.title,
        status: 'active',
        ...(firstFile ? { uri: firstFile } : {}),
        provenance: {
          sourceModule: 'map-explorer',
          createdAt: payload.requestedAt ?? receivedAt,
          ...(trimmedSummary ? { method: trimmedSummary } : {}),
        },
        updatedAt: receivedAt,
        tags: [MAP_HANDOFF_INCOMING_TAG],
      };
      ws.registerArtifact(entry);
    } catch (err) {
      console.warn('[mapToIdeHandoff] registerArtifact failed:', err);
    }
  });

  pushEvent({
    kind: 'artifact.register',
    receivedAt,
    payload,
  });
}

// ── Public API: lifecycle ──────────────────────────────────────────────────

/**
 * Install the Map → IDE receiver bus subscriptions.
 *
 * Idempotent — repeated calls are no-ops. Returns `true` if the receiver
 * was newly installed, `false` if it was already active.
 */
export function installMapToIdeReceiver(): boolean {
  if (_installed) return false;

  _busSubscriptions.push(synapseBus.on('map.layer.focus', onLayerFocus));
  _busSubscriptions.push(synapseBus.on('map.selection.export', onSelectionExport));
  _busSubscriptions.push(synapseBus.on('evidence.artifact.register', onEvidenceRegister));

  _installed = true;
  return true;
}

/**
 * Uninstall the receiver — for test isolation only.
 */
export function _uninstallMapToIdeReceiverForTesting(): void {
  for (const sub of _busSubscriptions) {
    sub.off();
  }
  _busSubscriptions.length = 0;
  inbox.length = 0;
  listeners.clear();
  _installed = false;
}

/** True if the receiver is currently installed. */
export function isMapToIdeReceiverInstalled(): boolean {
  return _installed;
}

// ── Public API: inbox introspection ────────────────────────────────────────

/**
 * Returns a snapshot of the incoming Map Explorer inbox, newest first.
 * The returned array is a defensive copy — callers may mutate it freely.
 */
export function getMapInbox(): MapToIdeIncomingEvent[] {
  return inbox.slice();
}

/**
 * Returns the most recent incoming Map Explorer event, or `null` if the
 * inbox is empty. Useful for surfacing provenance in the AI context strip.
 */
export function getLastIncomingMapEvent(): MapToIdeIncomingEvent | null {
  return inbox.length > 0 ? (inbox[0] ?? null) : null;
}

/**
 * Subscribe to inbox additions. Returns an unsubscribe function.
 */
export function subscribeMapInbox(
  handler: (event: MapToIdeIncomingEvent) => void,
): () => void {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}

/** Clear the inbox without affecting subscriptions. */
export function clearMapInbox(): void {
  inbox.length = 0;
}

// ── Public API: imperative actions ────────────────────────────────────────

export interface OpenMapAnalysisScriptArgs {
  /** Required: project-relative path of the script to open. */
  path: string;
  /** Optional: line range to reveal after the tab is opened. */
  fromLine?: number;
  /** Optional: end line of the range. */
  toLine?: number;
  /** Optional: artifact id this open was triggered from (provenance only). */
  artifactId?: string;
}

export interface OpenMapAnalysisScriptResult {
  ok: boolean;
  reason?: string;
  /** Path that was opened (when `ok === true`). */
  path?: string;
}

/**
 * Open a generated analysis script or file referenced by an incoming
 * Map Explorer artifact in the IDE editor.
 *
 * The receiver never silently mutates editor content — it only **opens**
 * an existing file (or, when the file is not yet known to the file
 * explorer, registers a stub `FileNode` and opens it through the editor
 * bridge). The user retains full control of subsequent edits.
 *
 * @returns `{ ok: false, reason }` if the path cannot be resolved or the
 * receiver cannot safely open the file. `{ ok: true, path }` on success.
 */
export function openMapAnalysisScript(
  args: OpenMapAnalysisScriptArgs,
): OpenMapAnalysisScriptResult {
  const path = args.path?.trim();
  if (!path) {
    return { ok: false, reason: 'A target script path is required.' };
  }

  // Step 1 — try to resolve through the file explorer (preferred path).
  const fe = useFileExplorerStore.getState();
  const node =
    fe.getFileByPath(path)
    || fe.getFileByPath(`/${path}`)
    || fe.getFileByPath(path.replace(/^\/+/, ''));

  if (node && node.type === 'file') {
    useEditorStore.getState().openTab(node, { origin: 'bridge' });
    if (
      typeof args.fromLine === 'number'
      && args.fromLine >= 1
      && typeof args.toLine === 'number'
      && args.toLine >= args.fromLine
    ) {
      editorBridge.openAtRange(node.path, args.fromLine, args.toLine);
    }
    if (args.artifactId) {
      try {
        useSynapseWorkspaceStore.getState().updateArtifact(args.artifactId, {
          status: 'active',
        });
      } catch {
        // updateArtifact silently ignores unknown ids — but defend against future changes.
      }
    }
    return { ok: true, path: node.path };
  }

  // Step 2 — file is not yet registered. Open through the editor bridge so
  // the existing legacy receiver in `EnhancedIDE.tsx` can materialize a tab.
  // This always opens an empty buffer; we never invent file content here.
  try {
    editorBridge.openNewTab({
      filename: path,
      code: '',
      language: languageFromExtension(path),
    });
    if (
      typeof args.fromLine === 'number'
      && args.fromLine >= 1
      && typeof args.toLine === 'number'
      && args.toLine >= args.fromLine
    ) {
      editorBridge.openAtRange(path, args.fromLine, args.toLine);
    }
    return { ok: true, path };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Failed to open analysis script.',
    };
  }
}

export interface InsertSpatialQueryScaffoldArgs {
  /** Optional layer id — preferred when available. */
  layerId?: string;
  /** Optional layer title for human-readable comments. */
  layerTitle?: string;
  /** Optional selection id from a `map.selection.export` event. */
  selectionId?: string;
  /** Optional feature count for context (set when known). */
  featureCount?: number;
  /** Language hint for the snippet. Defaults to 'python'. */
  language?: 'python' | 'typescript' | 'sql';
}

export interface InsertSpatialQueryScaffoldResult {
  ok: boolean;
  reason?: string;
  /** The scaffold text actually inserted (when `ok === true`). */
  snippet?: string;
}

function buildScaffoldPython(args: InsertSpatialQueryScaffoldArgs): string {
  const layerId = args.layerId ?? '<layer-id>';
  const selectionId = args.selectionId ?? '<selection-id>';
  const layerTitle = args.layerTitle ?? '(unknown layer)';
  const featureCount = typeof args.featureCount === 'number' ? args.featureCount : '?';

  return [
    '# Spatial query scaffold — generated from Map Explorer handoff',
    `# Layer:        ${layerTitle}`,
    `# Layer ID:     ${layerId}`,
    `# Selection ID: ${selectionId}`,
    `# Features:     ${featureCount}`,
    `# Generated at: ${new Date().toISOString()}`,
    '#',
    '# Provenance is preserved by reference only — fetch geometry from the',
    '# Map Explorer store using the IDs above. Do not paste raw GeoJSON here.',
    '',
    'def query_spatial_selection(layer_id: str, selection_id: str):',
    '    """Replace this stub with your analysis logic."""',
    '    raise NotImplementedError(',
    '        f"Implement query for layer={layer_id!r}, selection={selection_id!r}"',
    '    )',
    '',
    `result = query_spatial_selection(${JSON.stringify(layerId)}, ${JSON.stringify(selectionId)})`,
    '',
  ].join('\n');
}

function buildScaffoldTypeScript(args: InsertSpatialQueryScaffoldArgs): string {
  const layerId = args.layerId ?? '<layer-id>';
  const selectionId = args.selectionId ?? '<selection-id>';
  const layerTitle = args.layerTitle ?? '(unknown layer)';
  const featureCount = typeof args.featureCount === 'number' ? args.featureCount : '?';

  return [
    '// Spatial query scaffold — generated from Map Explorer handoff',
    `// Layer:        ${layerTitle}`,
    `// Layer ID:     ${layerId}`,
    `// Selection ID: ${selectionId}`,
    `// Features:     ${featureCount}`,
    `// Generated at: ${new Date().toISOString()}`,
    '//',
    '// Provenance is preserved by reference only — fetch geometry from the',
    '// Map Explorer store using the IDs above. Do not paste raw GeoJSON here.',
    '',
    'export interface SpatialQueryRef {',
    '  layerId: string;',
    '  selectionId: string;',
    '}',
    '',
    `const ref: SpatialQueryRef = { layerId: ${JSON.stringify(layerId)}, selectionId: ${JSON.stringify(selectionId)} };`,
    'export async function querySpatialSelection(ref: SpatialQueryRef): Promise<unknown> {',
    '  // Replace this stub with the real query against your spatial backend.',
    '  throw new Error(`Implement query for ${ref.layerId} / ${ref.selectionId}`);',
    '}',
    '',
    'await querySpatialSelection(ref);',
    '',
  ].join('\n');
}

function buildScaffoldSQL(args: InsertSpatialQueryScaffoldArgs): string {
  const layerId = args.layerId ?? '<layer-id>';
  const selectionId = args.selectionId ?? '<selection-id>';
  const layerTitle = args.layerTitle ?? '(unknown layer)';
  const featureCount = typeof args.featureCount === 'number' ? args.featureCount : '?';

  return [
    '-- Spatial query scaffold — generated from Map Explorer handoff',
    `-- Layer:        ${layerTitle}`,
    `-- Layer ID:     ${layerId}`,
    `-- Selection ID: ${selectionId}`,
    `-- Features:     ${featureCount}`,
    `-- Generated at: ${new Date().toISOString()}`,
    '--',
    '-- Provenance is by reference only; replace the WHERE clause with your',
    '-- own predicate that resolves the selection through your spatial store.',
    '',
    'SELECT *',
    'FROM   spatial_features',
    `WHERE  layer_id     = '${layerId.replace(/'/g, "''")}'`,
    `  AND  selection_id = '${selectionId.replace(/'/g, "''")}'`,
    'LIMIT  1000;',
    '',
  ].join('\n');
}

/**
 * Insert a small, provenance-aware spatial query scaffold at the cursor.
 *
 * This action only fires when the IDE explicitly requests it (e.g. user
 * clicks "Insert spatial scaffold" from the AI context strip or command
 * palette). The receiver itself never auto-inserts code on event arrival.
 *
 * @returns `{ ok: false, reason }` when no editor tab is active or the
 * generated snippet would exceed the 4 KB safety cap. `{ ok: true, snippet }`
 * on success.
 */
export function insertSpatialQueryScaffold(
  args: InsertSpatialQueryScaffoldArgs = {},
): InsertSpatialQueryScaffoldResult {
  const editor = useEditorStore.getState();
  const activeTab = editor.tabs.find((t) => t.id === editor.activeTabId);
  if (!activeTab) {
    return { ok: false, reason: 'Open a file in the editor before inserting a scaffold.' };
  }

  const language = args.language ?? 'python';
  let snippet: string;
  switch (language) {
    case 'typescript':
      snippet = buildScaffoldTypeScript(args);
      break;
    case 'sql':
      snippet = buildScaffoldSQL(args);
      break;
    case 'python':
    default:
      snippet = buildScaffoldPython(args);
      break;
  }

  if (safeBytes(snippet) > SCAFFOLD_MAX_BYTES) {
    return { ok: false, reason: 'Generated scaffold exceeds the 4 KB safety cap.' };
  }

  if (!editorBridge.sizeGuard(snippet)) {
    return { ok: false, reason: 'Generated scaffold exceeds the editor bridge size guard.' };
  }

  editorBridge.insertAtCursor({ code: snippet });
  return { ok: true, snippet };
}

// ── Helpers exposed for AI context surfaces ───────────────────────────────

/**
 * Compact provenance descriptor of the most recent incoming Map Explorer
 * event, suitable for rendering inside the AI panel context strip.
 *
 * Returns `null` when the inbox is empty. The returned string is bounded
 * (≤ 240 chars) so it fits in compact UI.
 */
export function describeLastIncomingMapEvent(): string | null {
  const event = getLastIncomingMapEvent();
  if (!event) return null;

  switch (event.kind) {
    case 'layer.focus': {
      const title = event.payload.layerTitle ?? event.payload.layerId;
      return `Map focused layer "${title}"`.slice(0, 240);
    }
    case 'selection.export': {
      const layer = event.payload.layerId
        ? ` on ${pathBaseName(event.payload.layerId)}`
        : '';
      return `Map exported selection (${event.payload.featureCount} features)${layer}`.slice(0, 240);
    }
    case 'artifact.register': {
      const file = event.payload.relatedFilePaths?.[0]
        ? ` · ${pathBaseName(event.payload.relatedFilePaths[0])}`
        : '';
      return `Map registered "${event.payload.title}"${file}`.slice(0, 240);
    }
    default:
      return null;
  }
}

// Re-export the stub `FileNode` shape so external test fixtures can build
// nodes without importing through deep paths.
export type { FileNode };

// ── Vite HMR cleanup ──────────────────────────────────────────────────────
// When this module is hot-replaced in dev, tear down the old bus
// subscriptions before the new module instance reinstalls. Without this
// guard, the previous module's stale handlers would remain registered on
// the singleton bus and fire alongside the new ones, doubling work and
// leaking closures across reloads.
if (typeof import.meta !== 'undefined' && (import.meta as { hot?: { dispose: (cb: () => void) => void } }).hot) {
  (import.meta as { hot: { dispose: (cb: () => void) => void } }).hot.dispose(() => {
    _uninstallMapToIdeReceiverForTesting();
  });
}
