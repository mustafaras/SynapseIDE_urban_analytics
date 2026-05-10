/**
 * synapseMemory — safe read/write helpers for .synapse/ workspace files.
 *
 * Since this is a browser-only application with no native file write API,
 * all persistence uses localStorage under the `synapse.ws.*` key namespace.
 * An in-memory fallback activates transparently when localStorage is
 * unavailable (private browsing, storage disabled) or full (quota exceeded).
 *
 * localStorage key format: "synapse.ws.<slot>"
 *   synapse.ws.workspace
 *   synapse.ws.artifacts
 *   synapse.ws.apply-history
 *   synapse.ws.sync-state
 *
 * Constraints:
 *   - Each slot is capped at MAX_SLOT_BYTES (256 KB) on write.
 *   - Reads and writes never throw; errors are returned as typed results.
 *   - Writability is detected once and cached for the session.
 *   - clearSynapseFile / clearAllSynapseFiles are provided for testing/reset.
 */

import type {
  SynapseMemorySlot,
  SynapseSlotTypeMap,
} from '@/types/synapse-workspace';

// ── localStorage key helpers ───────────────────────────────────────────────

const LS_PREFIX = 'synapse.ws.' as const;

function lsKey(slot: SynapseMemorySlot): string {
  return `${LS_PREFIX}${slot}`;
}

// ── In-memory fallback ─────────────────────────────────────────────────────

/**
 * In-memory fallback store — used when localStorage is unavailable or full.
 * Scoped to the module; survives the session but not page reload.
 */
const _memStore: Partial<Record<SynapseMemorySlot, unknown>> = {};

// ── Storage writability detection ──────────────────────────────────────────

let _writableCache: boolean | null = null;

/**
 * Returns true if localStorage is available and writable.
 * Performs a probe write on first call; result is cached for the session.
 * If quota is exceeded during a write, the cache is invalidated to `false`.
 */
export function isSynapseWritable(): boolean {
  if (_writableCache !== null) return _writableCache;
  try {
    const probe = '__synapse_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    _writableCache = true;
  } catch {
    _writableCache = false;
  }
  return _writableCache;
}

/** Force-reset the writability cache. Useful in tests. */
export function resetSynapseWritabilityCache(): void {
  _writableCache = null;
}

// ── Read ───────────────────────────────────────────────────────────────────

export type SynapseReadResult<T> =
  | { ok: true;  value: T;    source: 'storage' | 'memory' }
  | { ok: false; error: 'missing' | 'parse'; source: 'storage' | 'memory' };

/**
 * Read a .synapse/ file from localStorage (or in-memory fallback).
 *
 * Returns a discriminated union — never throws.
 * `source` indicates where the value was actually found.
 */
export function readSynapseFile<S extends SynapseMemorySlot>(
  slot: S,
): SynapseReadResult<SynapseSlotTypeMap[S]> {
  type T = SynapseSlotTypeMap[S];

  if (isSynapseWritable()) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(lsKey(slot));
    } catch {
      // localStorage read failed — fall through to memory
    }
    if (raw !== null) {
      try {
        const value = JSON.parse(raw) as T;
        return { ok: true, value, source: 'storage' };
      } catch {
        return { ok: false, error: 'parse', source: 'storage' };
      }
    }
    // Not in storage — check in-memory (could have been written after a quota error)
  }

  const mem = _memStore[slot] as T | undefined;
  if (mem !== undefined) {
    return { ok: true, value: mem, source: 'memory' };
  }
  return { ok: false, error: 'missing', source: isSynapseWritable() ? 'storage' : 'memory' };
}

// ── Write ──────────────────────────────────────────────────────────────────

/** Maximum serialized bytes per slot. Protects against localStorage quota exhaustion. */
export const MAX_SLOT_BYTES = 256 * 1024; // 256 KB

export type SynapseWriteResult =
  | { ok: true;  source: 'storage' | 'memory' }
  | { ok: false; error: 'oversized' | 'serialize' | 'quota'; source: 'storage' | 'memory' };

/**
 * Write a .synapse/ file to localStorage (or in-memory fallback).
 *
 * - Rejects serialized payloads exceeding MAX_SLOT_BYTES (256 KB).
 * - On quota error, falls back to in-memory and marks storage unavailable.
 * - Never throws.
 */
export function writeSynapseFile<S extends SynapseMemorySlot>(
  slot: S,
  value: SynapseSlotTypeMap[S],
): SynapseWriteResult {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, error: 'serialize', source: 'memory' };
  }

  if (serialized.length > MAX_SLOT_BYTES) {
    // Still save to memory so the session doesn't lose state
    _memStore[slot] = value;
    return { ok: false, error: 'oversized', source: 'memory' };
  }

  if (isSynapseWritable()) {
    try {
      localStorage.setItem(lsKey(slot), serialized);
      return { ok: true, source: 'storage' };
    } catch {
      // Quota exceeded — invalidate cache, fall through to memory
      _writableCache = false;
    }
  }

  // In-memory fallback
  _memStore[slot] = value;
  return { ok: true, source: 'memory' };
}

// ── Delete ─────────────────────────────────────────────────────────────────

/**
 * Remove a single .synapse/ slot from both storage and in-memory cache.
 * Used for testing or targeted workspace reset. Never throws.
 */
export function clearSynapseFile(slot: SynapseMemorySlot): void {
  try { localStorage.removeItem(lsKey(slot)); } catch {}
  delete _memStore[slot];
}

/**
 * Remove all .synapse/ slots from both storage and in-memory cache.
 * Used for full workspace reset or test teardown.
 */
export function clearAllSynapseFiles(): void {
  const slots: SynapseMemorySlot[] = [
    'workspace',
    'artifacts',
    'apply-history',
    'sync-state',
  ];
  for (const slot of slots) clearSynapseFile(slot);
}

// ── Utility: list present slots ────────────────────────────────────────────

/**
 * Returns which slots currently have persisted data (storage or memory).
 * Useful for diagnostics and the Prompt 28 QA harness.
 */
export function listPresentSlots(): SynapseMemorySlot[] {
  const all: SynapseMemorySlot[] = [
    'workspace',
    'artifacts',
    'apply-history',
    'sync-state',
  ];
  return all.filter((slot) => {
    if (isSynapseWritable()) {
      try {
        if (localStorage.getItem(lsKey(slot)) !== null) return true;
      } catch {}
    }
    return _memStore[slot] !== undefined;
  });
}
