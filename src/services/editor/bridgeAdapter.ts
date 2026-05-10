/**
 * Legacy Editor Bridge Adapter  (Prompt 20)
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  COMPATIBILITY LAYER — Do not add new callers that rely on the legacy   ║
 * ║  CustomEvent bus (`editor:*` events).  New callers must use the typed   ║
 * ║  Synapse Bus (`synapseBus`) from `@/services/synapseBus` directly.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Purpose
 * ───────
 * This adapter bridges the legacy DOM-based editor event system (`editor:*`
 * CustomEvents dispatched on `window`) and the typed Synapse Bus introduced in
 * Prompt 19.  It provides bi-directional forwarding so that:
 *
 *   1. Existing callers of `editorBridge.openNewTab()`, `insertAtCursor()`, etc.
 *      continue to work without any changes.
 *   2. External modules (Map Explorer, Urban Analytics) that emit typed bus
 *      events (`ide.code.insert`, `ide.range.open`, …) have their events
 *      forwarded to the legacy DOM bus so legacy subscribers still receive them.
 *   3. Every legacy event is validated before forwarding; invalid payloads are
 *      dropped with a `console.warn` — they never throw or crash the IDE.
 *
 * Event mapping table
 * ───────────────────
 * ┌───────────────────────────────┬──────────────────────────────────────────┐
 * │ Legacy event                  │ Synapse Bus event                        │
 * ├───────────────────────────────┼──────────────────────────────────────────┤
 * │ editor:openTab      (→ bus)   │ ide.file.open                            │
 * │ editor:insertAtCursor (→ bus) │ ide.code.insert                          │
 * │ editor:replaceActive  (→ bus) │ ide.code.insert  (replace=true metadata) │
 * │ editor:openRange    (→ bus)   │ ide.range.open                           │
 * ├───────────────────────────────┼──────────────────────────────────────────┤
 * │ ide.code.insert  (bus → leg.) │ editor:insertAtCursor                    │
 * │ ide.range.open   (bus → leg.) │ editor:openRange                         │
 * │ ide.file.open    (bus → leg.) │ — (content not available; skipped)       │
 * └───────────────────────────────┴──────────────────────────────────────────┘
 *
 * Note: `ide.file.open` from the bus cannot be forwarded to `editor:openTab`
 * because the bus carries path references only; the legacy event requires full
 * file content.  External callers that need to open a file in the IDE must use
 * the editor store directly or call `editorBridge.openNewTab()`.
 *
 * Re-entrancy protection
 * ──────────────────────
 * Two boolean flags guard against forwarding loops in each direction:
 *   `_inLegacyToBus`  — set while a legacy event is being forwarded to the bus.
 *   `_inBusToLegacy`  — set while a bus event is being forwarded to the legacy DOM.
 *
 * Because JavaScript is single-threaded, these flags are sufficient to break
 * any circular dispatch chain.
 *
 * Initialization
 * ──────────────
 * Call `installBridgeAdapter()` once at application startup.  The function is
 * idempotent — repeated calls are no-ops.
 *
 * The adapter is installed automatically when this module is first imported if
 * `typeof window !== 'undefined'` (browser environment).  In test environments
 * you can call `installBridgeAdapter()` manually after creating the jsdom window.
 *
 * @module bridgeAdapter
 */

import { busTimestamp, synapseBus } from '@/services/synapseBus';
import type {
  IdeCodeInsertPayload,
  IdeFileOpenPayload,
  IdeRangeOpenPayload,
  SynapseBusSubscription,
} from '@/types/synapse-bus';

// ── Internal constants ────────────────────────────────────────────────────

/** The CustomEvent type used by the legacy editor bridge. */
const LEGACY_BUS_KEY = '___editor_bridge___';

/** Maximum code size (bytes) the adapter will forward to the typed bus. */
const MAX_CODE_BYTES = 32 * 1024;

// ── Legacy event payload shapes ───────────────────────────────────────────

/**
 * Documented payload shapes for each legacy event.
 *
 * These are what `src/services/editor/bridge.ts` has always dispatched; they
 * are preserved here as the single source of truth for downstream consumers.
 *
 * @deprecated  New callers should use the Synapse Bus contract types from
 *              `@/types/synapse-bus`.
 */
export interface LegacyOpenTabPayload {
  filename: string;
  code: string;
  language?: string;
}

export interface LegacyInsertAtCursorPayload {
  code: string;
}

export interface LegacyReplaceActivePayload {
  code: string;
}

export interface LegacyOpenRangePayload {
  path: string;
  fromLine: number;
  toLine: number;
}

/** Discriminated union of all legacy event shapes. */
export type LegacyBridgeEvent =
  | { type: 'editor:openTab'; payload: LegacyOpenTabPayload }
  | { type: 'editor:insertAtCursor'; payload: LegacyInsertAtCursorPayload }
  | { type: 'editor:replaceActive'; payload: LegacyReplaceActivePayload }
  | { type: 'editor:openRange'; payload: LegacyOpenRangePayload };

// ── Type guards ──────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Validates a `editor:openTab` payload.
 * Requires: `filename` (non-empty string), `code` (string).
 */
export function isOpenTabPayload(v: unknown): v is LegacyOpenTabPayload {
  if (!isObject(v)) return false;
  if (typeof v['filename'] !== 'string' || v['filename'].trim() === '') return false;
  if (typeof v['code'] !== 'string') return false;
  if ('language' in v && v['language'] !== undefined && typeof v['language'] !== 'string') return false;
  return true;
}

/**
 * Validates a `editor:insertAtCursor` payload.
 * Requires: `code` (string).
 */
export function isInsertAtCursorPayload(v: unknown): v is LegacyInsertAtCursorPayload {
  if (!isObject(v)) return false;
  if (typeof v['code'] !== 'string') return false;
  return true;
}

/**
 * Validates a `editor:replaceActive` payload.
 * Requires: `code` (string).
 */
export function isReplaceActivePayload(v: unknown): v is LegacyReplaceActivePayload {
  if (!isObject(v)) return false;
  if (typeof v['code'] !== 'string') return false;
  return true;
}

/**
 * Validates a `editor:openRange` payload.
 * Requires: `path` (non-empty string), `fromLine` (integer ≥ 1), `toLine` (integer ≥ fromLine).
 */
export function isOpenRangePayload(v: unknown): v is LegacyOpenRangePayload {
  if (!isObject(v)) return false;
  if (typeof v['path'] !== 'string' || v['path'].trim() === '') return false;
  if (typeof v['fromLine'] !== 'number' || !Number.isInteger(v['fromLine']) || v['fromLine'] < 1) return false;
  if (typeof v['toLine'] !== 'number' || !Number.isInteger(v['toLine']) || v['toLine'] < v['fromLine']) return false;
  return true;
}

/**
 * Validates that a raw CustomEvent detail is a well-formed LegacyBridgeEvent.
 */
export function isLegacyBridgeEvent(v: unknown): v is LegacyBridgeEvent {
  if (!isObject(v)) return false;
  const { type, payload } = v as { type?: unknown; payload?: unknown };
  switch (type) {
    case 'editor:openTab':       return isOpenTabPayload(payload);
    case 'editor:insertAtCursor': return isInsertAtCursorPayload(payload);
    case 'editor:replaceActive':  return isReplaceActivePayload(payload);
    case 'editor:openRange':      return isOpenRangePayload(payload);
    default:                      return false;
  }
}

// ── Size helpers ──────────────────────────────────────────────────────────

function byteLength(s: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(s).length;
  }
  return s.length * 2;
}

// ── Re-entrancy guards ────────────────────────────────────────────────────

let _inLegacyToBus = false;
let _inBusToLegacy = false;

// ── Singleton install state ───────────────────────────────────────────────

let _installed = false;
const _busSubscriptions: SynapseBusSubscription[] = [];

// ── Legacy → Bus forwarding ───────────────────────────────────────────────

function handleLegacyEvent(event: LegacyBridgeEvent): void {
  if (_inBusToLegacy) return; // skip: this event originated from bus→legacy forwarding

  _inLegacyToBus = true;
  try {
    const ts = busTimestamp();
    switch (event.type) {
      case 'editor:openTab': {
        const p = event.payload;
        const busPayload: IdeFileOpenPayload = {
          path: p.filename,
          source: 'ide',
          requestedAt: ts,
        };
        synapseBus.emit('ide.file.open', busPayload);
        break;
      }
      case 'editor:insertAtCursor': {
        const p = event.payload;
        if (byteLength(p.code) > MAX_CODE_BYTES) {
          console.warn(
            '[BridgeAdapter] editor:insertAtCursor payload exceeds 32 KB — not forwarded to bus.'
          );
          break;
        }
        const busPayload: IdeCodeInsertPayload = {
          code: p.code,
          source: 'ide',
          requestedAt: ts,
        };
        synapseBus.emit('ide.code.insert', busPayload);
        break;
      }
      case 'editor:replaceActive': {
        const p = event.payload;
        if (byteLength(p.code) > MAX_CODE_BYTES) {
          console.warn(
            '[BridgeAdapter] editor:replaceActive payload exceeds 32 KB — not forwarded to bus.'
          );
          break;
        }
        // The typed bus does not have a dedicated replace event. We forward as
        // ide.code.insert so consumers that care about code changes receive it.
        // Consumers must not assume insert vs replace semantics from bus events.
        const busPayload: IdeCodeInsertPayload = {
          code: p.code,
          source: 'ide',
          requestedAt: ts,
        };
        synapseBus.emit('ide.code.insert', busPayload);
        break;
      }
      case 'editor:openRange': {
        const p = event.payload;
        const busPayload: IdeRangeOpenPayload = {
          path: p.path,
          fromLine: p.fromLine,
          toLine: p.toLine,
          source: 'ide',
          requestedAt: ts,
        };
        synapseBus.emit('ide.range.open', busPayload);
        break;
      }
    }
  } finally {
    _inLegacyToBus = false;
  }
}

// ── DOM listener for legacy CustomEvents ─────────────────────────────────

function onWindowBusEvent(evt: Event): void {
  const ce = evt as CustomEvent<unknown>;
  const detail = ce.detail;

  if (!isLegacyBridgeEvent(detail)) {
    // Unknown or malformed payload — drop safely without throwing.
    if (isObject(detail) && typeof (detail as Record<string, unknown>)['type'] === 'string') {
      console.warn(
        `[BridgeAdapter] Received malformed legacy event "${(detail as Record<string, unknown>)['type']}" — dropped.`,
        detail
      );
    }
    return;
  }

  handleLegacyEvent(detail);
}

// ── Bus → Legacy forwarding ───────────────────────────────────────────────

/**
 * Forward a typed bus `ide.code.insert` event to the legacy
 * `editor:insertAtCursor` CustomEvent so existing subscribers still receive it.
 */
function forwardInsertToBus(payload: IdeCodeInsertPayload): void {
  if (_inLegacyToBus) return; // skip: this bus event was triggered by a legacy event

  _inBusToLegacy = true;
  try {
    const legacyEvent: LegacyBridgeEvent = {
      type: 'editor:insertAtCursor',
      payload: { code: payload.code },
    };
    window.dispatchEvent(new CustomEvent(LEGACY_BUS_KEY, { detail: legacyEvent }));
  } finally {
    _inBusToLegacy = false;
  }
}

/**
 * Forward a typed bus `ide.range.open` event to the legacy `editor:openRange`
 * CustomEvent so existing range-navigation subscribers still receive it.
 */
function forwardRangeOpenToBus(payload: IdeRangeOpenPayload): void {
  if (_inLegacyToBus) return;

  _inBusToLegacy = true;
  try {
    const legacyEvent: LegacyBridgeEvent = {
      type: 'editor:openRange',
      payload: { path: payload.path, fromLine: payload.fromLine, toLine: payload.toLine },
    };
    window.dispatchEvent(new CustomEvent(LEGACY_BUS_KEY, { detail: legacyEvent }));
  } finally {
    _inBusToLegacy = false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Install the legacy bridge adapter.
 *
 * This function is **idempotent** — safe to call multiple times; subsequent
 * calls are no-ops.
 *
 * The adapter performs the following registrations:
 *   1. Adds a `window` listener for the legacy `___editor_bridge___` bus.
 *   2. Subscribes to `ide.code.insert` on the Synapse Bus (forwards to legacy).
 *   3. Subscribes to `ide.range.open` on the Synapse Bus (forwards to legacy).
 *
 * @returns `true` if the adapter was newly installed; `false` if it was already
 *          installed (idempotent call).
 */
export function installBridgeAdapter(): boolean {
  if (_installed) return false;
  if (typeof window === 'undefined') {
    // SSR / non-browser context — legacy DOM bus is not available.
    console.warn('[BridgeAdapter] window is not available; legacy DOM forwarding skipped.');
    return false;
  }

  // 1. Listen for legacy CustomEvents and forward to typed bus
  window.addEventListener(LEGACY_BUS_KEY, onWindowBusEvent);

  // 2. Forward typed bus ide.code.insert → legacy editor:insertAtCursor
  _busSubscriptions.push(synapseBus.on('ide.code.insert', forwardInsertToBus));

  // 3. Forward typed bus ide.range.open → legacy editor:openRange
  _busSubscriptions.push(synapseBus.on('ide.range.open', forwardRangeOpenToBus));

  _installed = true;
  return true;
}

/**
 * Uninstall the legacy bridge adapter.
 *
 * Removes all event listeners and bus subscriptions installed by
 * `installBridgeAdapter()`.  Resets the installed state so
 * `installBridgeAdapter()` can be called again.
 *
 * **For test isolation only.** Do not call in production code.
 */
export function _uninstallBridgeAdapterForTesting(): void {
  if (!_installed) return;

  if (typeof window !== 'undefined') {
    window.removeEventListener(LEGACY_BUS_KEY, onWindowBusEvent);
  }

  for (const sub of _busSubscriptions) {
    sub.off();
  }
  _busSubscriptions.length = 0;
  _installed = false;
}

/**
 * Returns `true` if the adapter is currently installed.
 *
 * For test assertions and debug introspection only.
 */
export function isBridgeAdapterInstalled(): boolean {
  return _installed;
}

// ── Auto-install ──────────────────────────────────────────────────────────

// Install immediately when running in a browser environment.
// In test environments, JSDOM provides `window`, so the adapter installs
// automatically unless `_uninstallBridgeAdapterForTesting()` is called.
if (typeof window !== 'undefined') {
  installBridgeAdapter();
}
