import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyProviderKey, type ProviderKeyProvider, type ProviderKeyStatus } from '@/services/ai/verifyProviderKey';

const originalFetch = globalThis.fetch;

const mockFetchStatus = (status: number) => {
  const mock = vi.fn<typeof fetch>(async () => new Response(null, { status }));
  Object.defineProperty(globalThis, 'fetch', {
    value: mock,
    configurable: true,
    writable: true,
  });
  return mock;
};

const mockFetchFailure = () => {
  const mock = vi.fn<typeof fetch>(async () => {
    throw new Error('network failed');
  });
  Object.defineProperty(globalThis, 'fetch', {
    value: mock,
    configurable: true,
    writable: true,
  });
  return mock;
};

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'fetch', {
    value: originalFetch,
    configurable: true,
    writable: true,
  });
});

describe('verifyProviderKey', () => {
  const providers: ProviderKeyProvider[] = ['openai', 'anthropic', 'gemini'];
  const cases: Array<[number, ProviderKeyStatus]> = [
    [200, 'Verified'],
    [401, 'Invalid'],
    [403, 'Invalid'],
    [429, 'Rate-limited'],
    [500, 'Untested'],
  ];

  it.each(providers)('maps network errors to Untested for %s', async (provider) => {
    mockFetchFailure();
    await expect(verifyProviderKey(provider, 'sk-test')).resolves.toBe('Untested');
  });

  it.each(providers.flatMap((provider) => cases.map(([status, expected]) => [provider, status, expected] as const)))(
    'maps %s HTTP %i to %s',
    async (provider, status, expected) => {
      mockFetchStatus(status);
      await expect(verifyProviderKey(provider, 'sk-test')).resolves.toBe(expected);
    },
  );

  it('posts OpenAI keys through the local verification route', async () => {
    const fetchMock = mockFetchStatus(200);
    await verifyProviderKey('openai', 'openai-key');

    expect(fetchMock).toHaveBeenCalledWith('/api/openai/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'openai-key' }),
    });
  });

  it('sends Anthropic verification headers expected by the models endpoint', async () => {
    const fetchMock = mockFetchStatus(200);
    await verifyProviderKey('anthropic', 'anthropic-key');

    expect(fetchMock).toHaveBeenCalledWith('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': 'anthropic-key',
        'anthropic-version': '2023-06-01',
      },
    });
  });

  it('uses the Gemini models endpoint with the encoded key', async () => {
    const fetchMock = mockFetchStatus(200);
    await verifyProviderKey('gemini', 'gem key');

    expect(fetchMock).toHaveBeenCalledWith('https://generativelanguage.googleapis.com/v1/models?key=gem%20key');
  });
});
