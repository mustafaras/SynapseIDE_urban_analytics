/**
 * Unit tests — Legacy Editor Bridge Adapter  (Prompt 20)
  * @vitest-environment jsdom
  *
 * Coverage:
 *   ── Type guards ──────────────────────────────────────────────────────────
 *   - isOpenTabPayload: valid, missing filename, empty filename, missing code, bad language
 *   - isInsertAtCursorPayload: valid, missing code, wrong type
 *   - isReplaceActivePayload: valid, missing code, null input
 *   - isOpenRangePayload: valid, missing path, fromLine 0, toLine < fromLine, non-integer
 *   - isLegacyBridgeEvent: valid for each type, unknown type, malformed detail
 *
 *   ── Legacy → Bus forwarding ──────────────────────────────────────────────
 *   - editor:openTab   → ide.file.open
 *   - editor:insertAtCursor → ide.code.insert
 *   - editor:replaceActive  → ide.code.insert
 *   - editor:openRange → ide.range.open
 *   - oversized code payload is dropped (not forwarded to bus)
 *   - malformed event detail is silently dropped (no bus emit)
 *
 *   ── Bus → Legacy forwarding ──────────────────────────────────────────────
 *   - ide.code.insert on bus → editor:insertAtCursor legacy event
 *   - ide.range.open on bus  → editor:openRange legacy event
 *   - ide.file.open on bus   → no legacy event dispatched (content-less)
 *
 *   ── Re-entrancy ──────────────────────────────────────────────────────────
 *   - Legacy event forwarded to bus does NOT trigger bus→legacy re-dispatch
 *   - Bus event forwarded to legacy does NOT trigger legacy→bus re-emission
 *
 *   ── Lifecycle ────────────────────────────────────────────────────────────
 *   - installBridgeAdapter is idempotent
 *   - isBridgeAdapterInstalled reflects state
 *   - After uninstall, legacy events no longer forwarded to bus
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { synapseBus } from '../../synapseBus';
import {
  _uninstallBridgeAdapterForTesting,
  installBridgeAdapter,
  isBridgeAdapterInstalled,
  isInsertAtCursorPayload,
  isLegacyBridgeEvent,
  isOpenRangePayload,
  isOpenTabPayload,
  isReplaceActivePayload,
  type LegacyBridgeEvent,
} from '../bridgeAdapter';

// ── Helpers ────────────────────────────────────────────────────────────────

const LEGACY_BUS_KEY = '___editor_bridge___';

/** Dispatch a legacy CustomEvent on window. */
function dispatchLegacy(event: LegacyBridgeEvent): void {
  window.dispatchEvent(new CustomEvent(LEGACY_BUS_KEY, { detail: event }));
}

/** Dispatch a malformed CustomEvent (raw detail, not a LegacyBridgeEvent). */
function dispatchRaw(detail: unknown): void {
  window.dispatchEvent(new CustomEvent(LEGACY_BUS_KEY, { detail }));
}

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  // Start each test with a clean adapter installation
  _uninstallBridgeAdapterForTesting();
  synapseBus._resetForTesting();
  installBridgeAdapter();
});

afterEach(() => {
  _uninstallBridgeAdapterForTesting();
  synapseBus._resetForTesting();
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

describe('isOpenTabPayload', () => {
  it('accepts a valid payload', () => {
    expect(isOpenTabPayload({ filename: 'test.ts', code: 'const x = 1;' })).toBe(true);
  });
  it('accepts optional language field', () => {
    expect(isOpenTabPayload({ filename: 'a.py', code: 'pass', language: 'python' })).toBe(true);
  });
  it('rejects missing filename', () => {
    expect(isOpenTabPayload({ code: 'x' })).toBe(false);
  });
  it('rejects empty filename', () => {
    expect(isOpenTabPayload({ filename: '  ', code: 'x' })).toBe(false);
  });
  it('rejects missing code', () => {
    expect(isOpenTabPayload({ filename: 'a.ts' })).toBe(false);
  });
  it('rejects non-string code', () => {
    expect(isOpenTabPayload({ filename: 'a.ts', code: 42 })).toBe(false);
  });
  it('rejects non-string language when present', () => {
    expect(isOpenTabPayload({ filename: 'a.ts', code: '', language: 99 })).toBe(false);
  });
  it('rejects null', () => {
    expect(isOpenTabPayload(null)).toBe(false);
  });
});

describe('isInsertAtCursorPayload', () => {
  it('accepts a valid payload', () => {
    expect(isInsertAtCursorPayload({ code: 'print("hello")' })).toBe(true);
  });
  it('accepts empty string code', () => {
    expect(isInsertAtCursorPayload({ code: '' })).toBe(true);
  });
  it('rejects missing code', () => {
    expect(isInsertAtCursorPayload({})).toBe(false);
  });
  it('rejects numeric code', () => {
    expect(isInsertAtCursorPayload({ code: 123 })).toBe(false);
  });
  it('rejects null', () => {
    expect(isInsertAtCursorPayload(null)).toBe(false);
  });
});

describe('isReplaceActivePayload', () => {
  it('accepts a valid payload', () => {
    expect(isReplaceActivePayload({ code: 'x = 1' })).toBe(true);
  });
  it('rejects missing code', () => {
    expect(isReplaceActivePayload({})).toBe(false);
  });
  it('rejects null', () => {
    expect(isReplaceActivePayload(null)).toBe(false);
  });
});

describe('isOpenRangePayload', () => {
  it('accepts a valid payload', () => {
    expect(isOpenRangePayload({ path: 'src/run.py', fromLine: 1, toLine: 10 })).toBe(true);
  });
  it('accepts fromLine === toLine (single-line range)', () => {
    expect(isOpenRangePayload({ path: 'a.ts', fromLine: 5, toLine: 5 })).toBe(true);
  });
  it('rejects empty path', () => {
    expect(isOpenRangePayload({ path: '', fromLine: 1, toLine: 2 })).toBe(false);
  });
  it('rejects fromLine = 0 (1-based)', () => {
    expect(isOpenRangePayload({ path: 'a.ts', fromLine: 0, toLine: 1 })).toBe(false);
  });
  it('rejects toLine < fromLine', () => {
    expect(isOpenRangePayload({ path: 'a.ts', fromLine: 5, toLine: 3 })).toBe(false);
  });
  it('rejects fractional fromLine', () => {
    expect(isOpenRangePayload({ path: 'a.ts', fromLine: 1.5, toLine: 2 })).toBe(false);
  });
  it('rejects string fromLine', () => {
    expect(isOpenRangePayload({ path: 'a.ts', fromLine: '1', toLine: 2 })).toBe(false);
  });
  it('rejects null', () => {
    expect(isOpenRangePayload(null)).toBe(false);
  });
});

describe('isLegacyBridgeEvent', () => {
  it('validates editor:openTab', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:openTab', payload: { filename: 'a.ts', code: '' } })).toBe(true);
  });
  it('validates editor:insertAtCursor', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:insertAtCursor', payload: { code: 'x' } })).toBe(true);
  });
  it('validates editor:replaceActive', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:replaceActive', payload: { code: 'y' } })).toBe(true);
  });
  it('validates editor:openRange', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:openRange', payload: { path: 'a.ts', fromLine: 1, toLine: 3 } })).toBe(true);
  });
  it('rejects unknown type', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:unknown', payload: {} })).toBe(false);
  });
  it('rejects missing type', () => {
    expect(isLegacyBridgeEvent({ payload: { code: 'x' } })).toBe(false);
  });
  it('rejects null detail', () => {
    expect(isLegacyBridgeEvent(null)).toBe(false);
  });
  it('rejects valid type with invalid payload', () => {
    expect(isLegacyBridgeEvent({ type: 'editor:openTab', payload: { filename: '' } })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY → BUS FORWARDING
// ═══════════════════════════════════════════════════════════════════════════

describe('Legacy → Bus: editor:openTab → ide.file.open', () => {
  it('emits ide.file.open on the bus with the filename as path', () => {
    const handler = vi.fn();
    synapseBus.on('ide.file.open', handler);
    dispatchLegacy({ type: 'editor:openTab', payload: { filename: 'src/main.ts', code: 'const x = 1;' } });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ path: 'src/main.ts', source: 'ide' });
  });

  it('includes a valid ISO requestedAt timestamp', () => {
    const handler = vi.fn();
    synapseBus.on('ide.file.open', handler);
    dispatchLegacy({ type: 'editor:openTab', payload: { filename: 'a.py', code: '' } });
    const { requestedAt } = handler.mock.calls[0][0];
    expect(() => new Date(requestedAt)).not.toThrow();
    expect(new Date(requestedAt).toISOString()).toBe(requestedAt);
  });
});

describe('Legacy → Bus: editor:insertAtCursor → ide.code.insert', () => {
  it('emits ide.code.insert on the bus', () => {
    const handler = vi.fn();
    synapseBus.on('ide.code.insert', handler);
    dispatchLegacy({ type: 'editor:insertAtCursor', payload: { code: 'print("hello")' } });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ code: 'print("hello")', source: 'ide' });
  });

  it('drops oversized code (> 32 KB) without crashing', () => {
    const handler = vi.fn();
    synapseBus.on('ide.code.insert', handler);
    const bigCode = 'x'.repeat(33 * 1024);
    expect(() =>
      dispatchLegacy({ type: 'editor:insertAtCursor', payload: { code: bigCode } })
    ).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('Legacy → Bus: editor:replaceActive → ide.code.insert', () => {
  it('emits ide.code.insert on the bus', () => {
    const handler = vi.fn();
    synapseBus.on('ide.code.insert', handler);
    dispatchLegacy({ type: 'editor:replaceActive', payload: { code: 'new content' } });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ code: 'new content', source: 'ide' });
  });

  it('drops oversized code (> 32 KB) without crashing', () => {
    const handler = vi.fn();
    synapseBus.on('ide.code.insert', handler);
    const bigCode = 'y'.repeat(33 * 1024);
    expect(() =>
      dispatchLegacy({ type: 'editor:replaceActive', payload: { code: bigCode } })
    ).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('Legacy → Bus: editor:openRange → ide.range.open', () => {
  it('emits ide.range.open on the bus', () => {
    const handler = vi.fn();
    synapseBus.on('ide.range.open', handler);
    dispatchLegacy({ type: 'editor:openRange', payload: { path: 'src/app.ts', fromLine: 10, toLine: 20 } });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      path: 'src/app.ts',
      fromLine: 10,
      toLine: 20,
      source: 'ide',
    });
  });
});

describe('Legacy → Bus: malformed payloads', () => {
  it('drops an event with an unknown type without throwing', () => {
    const fileHandler = vi.fn();
    const insertHandler = vi.fn();
    synapseBus.on('ide.file.open', fileHandler);
    synapseBus.on('ide.code.insert', insertHandler);
    expect(() => dispatchRaw({ type: 'editor:unknown', payload: { code: 'x' } })).not.toThrow();
    expect(fileHandler).not.toHaveBeenCalled();
    expect(insertHandler).not.toHaveBeenCalled();
  });

  it('drops a null detail without throwing', () => {
    expect(() => dispatchRaw(null)).not.toThrow();
  });

  it('drops an event with a valid type but invalid payload without throwing', () => {
    const handler = vi.fn();
    synapseBus.on('ide.file.open', handler);
    expect(() =>
      dispatchRaw({ type: 'editor:openTab', payload: { filename: '', code: 42 } })
    ).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUS → LEGACY FORWARDING
// ═══════════════════════════════════════════════════════════════════════════

describe('Bus → Legacy: ide.code.insert → editor:insertAtCursor', () => {
  it('dispatches a legacy editor:insertAtCursor CustomEvent', () => {
    const received: LegacyBridgeEvent[] = [];
    const listener = (e: Event) =>
      received.push((e as CustomEvent<LegacyBridgeEvent>).detail);
    window.addEventListener(LEGACY_BUS_KEY, listener);

    synapseBus.emit('ide.code.insert', {
      code: 'import pandas as pd',
      source: 'map-explorer',
      requestedAt: new Date().toISOString(),
    });

    window.removeEventListener(LEGACY_BUS_KEY, listener);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('editor:insertAtCursor');
    expect((received[0] as { type: 'editor:insertAtCursor'; payload: { code: string } }).payload.code).toBe('import pandas as pd');
  });
});

describe('Bus → Legacy: ide.range.open → editor:openRange', () => {
  it('dispatches a legacy editor:openRange CustomEvent', () => {
    const received: LegacyBridgeEvent[] = [];
    const listener = (e: Event) =>
      received.push((e as CustomEvent<LegacyBridgeEvent>).detail);
    window.addEventListener(LEGACY_BUS_KEY, listener);

    synapseBus.emit('ide.range.open', {
      path: 'src/utils.ts',
      fromLine: 5,
      toLine: 15,
      source: 'map-explorer',
      requestedAt: new Date().toISOString(),
    });

    window.removeEventListener(LEGACY_BUS_KEY, listener);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('editor:openRange');
    const p = (received[0] as { type: 'editor:openRange'; payload: LegacyBridgeEvent['payload'] }).payload as { path: string; fromLine: number; toLine: number };
    expect(p.path).toBe('src/utils.ts');
    expect(p.fromLine).toBe(5);
    expect(p.toLine).toBe(15);
  });
});

describe('Bus → Legacy: ide.file.open → (no legacy event dispatched)', () => {
  it('does NOT dispatch a legacy event for ide.file.open (content unavailable)', () => {
    const received: LegacyBridgeEvent[] = [];
    const listener = (e: Event) =>
      received.push((e as CustomEvent<LegacyBridgeEvent>).detail);
    window.addEventListener(LEGACY_BUS_KEY, listener);

    synapseBus.emit('ide.file.open', {
      path: 'src/main.ts',
      source: 'map-explorer',
      requestedAt: new Date().toISOString(),
    });

    window.removeEventListener(LEGACY_BUS_KEY, listener);
    expect(received).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RE-ENTRANCY
// ═══════════════════════════════════════════════════════════════════════════

describe('Re-entrancy: legacy → bus does NOT loop back to legacy', () => {
  it('bus handler is called exactly once, not recursively', () => {
    const busHandler = vi.fn();
    synapseBus.on('ide.code.insert', busHandler);

    // This legacy event goes:  legacy dispatch → adapter → bus.emit(ide.code.insert)
    // The bus.emit triggers the forwardInsertToBus handler which would normally
    // dispatch a legacy event AGAIN — but the re-entrancy guard must block that.
    const legacyReceived: unknown[] = [];
    const legacyListener = (e: Event) => legacyReceived.push((e as CustomEvent).detail);
    window.addEventListener(LEGACY_BUS_KEY, legacyListener);

    dispatchLegacy({ type: 'editor:insertAtCursor', payload: { code: 'x = 1' } });

    window.removeEventListener(LEGACY_BUS_KEY, legacyListener);

    // busHandler must be called exactly once (no re-loop)
    expect(busHandler).toHaveBeenCalledOnce();
    // Only the original legacy dispatch is in legacyReceived (not a second one from bus→legacy)
    expect(legacyReceived).toHaveLength(1);
  });
});

describe('Re-entrancy: bus → legacy does NOT emit back to bus', () => {
  it('bus subscriber is called exactly once, not recursively', () => {
    const busHandler = vi.fn();
    synapseBus.on('ide.code.insert', busHandler);

    // This bus event goes: bus.emit(ide.code.insert) → forwardInsertToBus → legacy dispatch
    // The legacy dispatch fires the DOM listener → adapter → but _inBusToLegacy guard must block bus re-emit
    synapseBus.emit('ide.code.insert', {
      code: 'y = 2',
      source: 'urban-analytics',
      requestedAt: new Date().toISOString(),
    });

    // busHandler is our own subscriber — should be called once (from our emit, not from re-loop)
    expect(busHandler).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

describe('installBridgeAdapter lifecycle', () => {
  it('returns true on first install', () => {
    _uninstallBridgeAdapterForTesting();
    expect(installBridgeAdapter()).toBe(true);
  });

  it('returns false on repeated install (idempotent)', () => {
    expect(isBridgeAdapterInstalled()).toBe(true);
    expect(installBridgeAdapter()).toBe(false);
  });

  it('isBridgeAdapterInstalled reflects installed state', () => {
    expect(isBridgeAdapterInstalled()).toBe(true);
    _uninstallBridgeAdapterForTesting();
    expect(isBridgeAdapterInstalled()).toBe(false);
  });

  it('after uninstall, legacy events are no longer forwarded to bus', () => {
    const handler = vi.fn();
    synapseBus.on('ide.file.open', handler);

    _uninstallBridgeAdapterForTesting();

    dispatchLegacy({ type: 'editor:openTab', payload: { filename: 'x.ts', code: '' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('after uninstall, bus events are no longer forwarded to legacy', () => {
    _uninstallBridgeAdapterForTesting();

    const legacyReceived: unknown[] = [];
    const listener = (e: Event) => legacyReceived.push((e as CustomEvent).detail);
    window.addEventListener(LEGACY_BUS_KEY, listener);

    synapseBus.emit('ide.code.insert', {
      code: 'z = 3',
      source: 'ide',
      requestedAt: new Date().toISOString(),
    });

    window.removeEventListener(LEGACY_BUS_KEY, listener);
    expect(legacyReceived).toHaveLength(0);
  });

  it('can be reinstalled after uninstall', () => {
    _uninstallBridgeAdapterForTesting();
    expect(installBridgeAdapter()).toBe(true);
    expect(isBridgeAdapterInstalled()).toBe(true);

    const handler = vi.fn();
    synapseBus.on('ide.range.open', handler);
    dispatchLegacy({ type: 'editor:openRange', payload: { path: 'r.ts', fromLine: 1, toLine: 1 } });
    expect(handler).toHaveBeenCalledOnce();
  });
});
