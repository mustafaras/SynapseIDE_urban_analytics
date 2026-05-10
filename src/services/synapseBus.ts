/**
 * Synapse Bus — Typed Publish / Subscribe Utility  (Prompt 19)
 *
 * A lightweight, fully-typed pub/sub bus for cross-module coordination between
 * Synapse IDE, Map Explorer, and Urban Analytics.
 *
 * Architecture guarantees:
 *   • No hidden globals — the bus is an exported module singleton, not attached
 *     to `window` or any other ambient object.
 *   • No large payloads — each event carries IDs and references; bulk data
 *     travels via store selectors after the event is received.
 *   • No direct module internals — consumers receive only what the bus contract
 *     specifies; they must read their own store if they need more data.
 *   • Every subscription returns an object with `.off()` for safe cleanup.
 *   • Subscribers are called synchronously in insertion order (no setTimeout /
 *     microtask deferral).  If a subscriber throws, the remaining subscribers
 *     are still called and the error is reported via `console.error` to avoid
 *     silently dropping events in development.
 *
 * Usage:
 *   // Publish
 *   synapseBus.emit('map.layer.focus', {
 *     layerId: 'layer-abc',
 *     source: 'map-explorer',
 *     requestedAt: new Date().toISOString(),
 *   });
 *
 *   // Subscribe
 *   const sub = synapseBus.on('map.layer.focus', (payload) => {
 *     console.log('Layer focused:', payload.layerId);
 *   });
 *
 *   // Unsubscribe
 *   sub.off();
 *
 * See `src/types/synapse-bus.ts` for the full event contract map.
 */

import type {
  SynapseBusEventMap,
  SynapseBusEventType,
  SynapseBusHandler,
  SynapseBusSubscription,
} from '../types/synapse-bus';
import { SYNAPSE_BUS_LIMITS } from '../config/synapseBus';

// ── Internal handler registry ──────────────────────────────────────────────

type HandlerSet<T extends SynapseBusEventType> = Set<SynapseBusHandler<T>>;

// Uses a Map keyed by event type.  Each entry is a Set of registered handlers.
// Generics are deliberately widened internally; external API is fully typed.
type InternalRegistry = Map<SynapseBusEventType, Set<unknown>>;

function byteSizeOfString(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

function payloadByteSize(payload: unknown): number {
  try {
    return byteSizeOfString(JSON.stringify(payload));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function validatePayloadSize<T extends SynapseBusEventType>(
  type: T,
  payload: SynapseBusEventMap[T]
): boolean {
  const serializedSize = payloadByteSize(payload);
  if (serializedSize > SYNAPSE_BUS_LIMITS.maxPayloadBytes) {
    console.warn(
      `[SynapseBus] Dropped event "${type}" because payload exceeds ${SYNAPSE_BUS_LIMITS.maxPayloadBytes} bytes.`
    );
    return false;
  }

  if (type === 'ide.code.insert') {
    const insertPayload = payload as SynapseBusEventMap['ide.code.insert'];
    const codeBytes = byteSizeOfString(insertPayload.code);
    if (codeBytes > SYNAPSE_BUS_LIMITS.maxIdeCodeInsertBytes) {
      console.warn(
        `[SynapseBus] Dropped event "${type}" because code payload exceeds ${SYNAPSE_BUS_LIMITS.maxIdeCodeInsertBytes} bytes.`
      );
      return false;
    }
  }

  return true;
}

// ── Bus class ──────────────────────────────────────────────────────────────

/**
 * SynapseBus — typed cross-module event bus.
 *
 * Do not instantiate directly — use the exported `synapseBus` singleton.
 */
export class SynapseBus {
  private readonly _registry: InternalRegistry = new Map();

  // ── Subscribe ────────────────────────────────────────────────────────────

  /**
   * Subscribe to a typed bus event.
   *
   * @param type    The event key (e.g. `'map.layer.focus'`).
   * @param handler Called synchronously when the event is emitted.
   * @returns A subscription with an `.off()` method for cleanup.
   *
   * @example
   * const sub = synapseBus.on('map.layer.focus', ({ layerId }) => {
   *   // handle layer focus
   * });
   * // later:
   * sub.off();
   */
  on<T extends SynapseBusEventType>(
    type: T,
    handler: SynapseBusHandler<T>
  ): SynapseBusSubscription {
    if (!this._registry.has(type)) {
      this._registry.set(type, new Set());
    }
    const bucket = this._registry.get(type) as HandlerSet<T>;
    bucket.add(handler);

    let removed = false;
    return {
      off: () => {
        if (removed) return;
        removed = true;
        bucket.delete(handler);
        if (bucket.size === 0) {
          this._registry.delete(type);
        }
      },
    };
  }

  // ── Unsubscribe (imperative alternative) ─────────────────────────────────

  /**
   * Remove a previously registered handler.
   *
   * Prefer using the `.off()` on the subscription returned by `on()`.
   * This method is provided for cases where the handler reference must be
   * passed imperatively (e.g. component `useEffect` cleanup patterns).
   */
  off<T extends SynapseBusEventType>(
    type: T,
    handler: SynapseBusHandler<T>
  ): void {
    const bucket = this._registry.get(type) as HandlerSet<T> | undefined;
    if (!bucket) return;
    bucket.delete(handler);
    if (bucket.size === 0) {
      this._registry.delete(type);
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  /**
   * Publish a typed event to all current subscribers.
   *
   * Subscribers are called synchronously in the order they were registered.
   * If a subscriber throws, the error is logged and remaining subscribers
   * continue to execute — one bad subscriber cannot block the bus.
   *
   * @param type    The event key (e.g. `'ide.file.open'`).
   * @param payload Fully-typed payload matching the event contract.
   *
   * @example
   * synapseBus.emit('ide.file.open', {
   *   path: 'src/analysis/run.py',
   *   source: 'ide',
   *   requestedAt: new Date().toISOString(),
   * });
   */
  emit<T extends SynapseBusEventType>(
    type: T,
    payload: SynapseBusEventMap[T]
  ): void {
    if (!validatePayloadSize(type, payload)) return;

    const bucket = this._registry.get(type);
    if (!bucket || bucket.size === 0) return;

    // Snapshot to a static array so that handlers added or removed during
    // dispatch do not affect the current emission cycle.
    const handlers = Array.from(bucket) as Array<SynapseBusHandler<T>>;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.error(
          `[SynapseBus] Unhandled error in subscriber for "${type}":`,
          err
        );
      }
    }
  }

  // ── Introspection (test / debug only) ────────────────────────────────────

  /**
   * Returns the number of active subscribers for a given event type.
   *
   * Intended for unit tests and debug instrumentation only — do not use
   * subscriber counts to make runtime routing decisions.
   */
  subscriberCount(type: SynapseBusEventType): number {
    return this._registry.get(type)?.size ?? 0;
  }

  /**
   * Remove all subscribers for all event types.
   *
   * For test isolation only.  Do not call in production code.
   */
  _resetForTesting(): void {
    this._registry.clear();
  }
}

// ── Module singleton ────────────────────────────────────────────────────────

/**
 * The global Synapse Bus singleton.
 *
 * This is the only instance that should be used across the application.
 * Import it directly — do not create additional `SynapseBus` instances.
 *
 * @example
 * import { synapseBus } from '@/services/synapseBus';
 */
export const synapseBus = new SynapseBus();

// ── Convenience factory ──────────────────────────────────────────────────────

/**
 * Returns a `requestedAt` ISO timestamp string for use in event payloads.
 *
 * A tiny helper to ensure consistent timestamp generation at publish sites.
 *
 * @example
 * synapseBus.emit('ide.file.open', {
 *   path: 'src/run.py',
 *   source: 'ide',
 *   requestedAt: busTimestamp(),
 * });
 */
export function busTimestamp(): string {
  return new Date().toISOString();
}
