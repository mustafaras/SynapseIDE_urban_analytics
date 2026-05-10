// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearChunkRecoveryReloadFlag,
  consumeChunkRecoveryReloadAllowance,
  isRetryableDynamicImportError,
  waitForImportRecovery,
} from '../lazyWithRetry';

describe('lazyWithRetry utilities', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearChunkRecoveryReloadFlag();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it('treats CSS preload failures as retryable chunk errors', () => {
    expect(isRetryableDynamicImportError(new Error('Unable to preload CSS for /assets/app-centerpanel-registry.css'))).toBe(true);
    expect(isRetryableDynamicImportError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
  });

  it('waits for the asset host to respond before reporting recovery success', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true });
    globalThis.fetch = fetchMock as typeof fetch;

    const recovered = await waitForImportRecovery({ attempts: 2, delayMs: 1 });

    expect(recovered).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns false when the asset host stays unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('ERR_CONNECTION_REFUSED'));
    globalThis.fetch = fetchMock as typeof fetch;

    const recovered = await waitForImportRecovery({ attempts: 2, delayMs: 1 });

    expect(recovered).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows a bounded number of automatic reloads within the cooldown window', () => {
    expect(consumeChunkRecoveryReloadAllowance(1_000)).toBe(true);
    expect(consumeChunkRecoveryReloadAllowance(10_000)).toBe(true);
    expect(consumeChunkRecoveryReloadAllowance(20_000)).toBe(false);
    expect(consumeChunkRecoveryReloadAllowance(45_001)).toBe(true);
  });

  it('clears the reload state when manual recovery is requested', () => {
    expect(consumeChunkRecoveryReloadAllowance(1_000)).toBe(true);
    expect(consumeChunkRecoveryReloadAllowance(10_000)).toBe(true);
    clearChunkRecoveryReloadFlag();
    expect(consumeChunkRecoveryReloadAllowance(11_000)).toBe(true);
  });
});