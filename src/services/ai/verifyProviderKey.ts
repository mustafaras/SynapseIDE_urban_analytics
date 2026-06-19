import type { ProviderId } from '@/stores/useAiConfigStore.types';

export type ProviderKeyProvider = Extract<ProviderId, 'openai' | 'anthropic' | 'gemini'>;
export type ProviderKeyStatus = 'Untested' | 'Verified' | 'Invalid' | 'Rate-limited';

const statusFromResponse = (status: number, invalidStatuses: readonly number[]): ProviderKeyStatus => {
  if (status === 200) return 'Verified';
  if (invalidStatuses.includes(status)) return 'Invalid';
  if (status === 429) return 'Rate-limited';
  return 'Untested';
};

async function verifyOpenAIKey(key: string): Promise<ProviderKeyStatus> {
  try {
    const response = await fetch('/api/openai/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return statusFromResponse(response.status, [401, 403]);
  } catch {
    return 'Untested';
  }
}

async function verifyAnthropicKey(key: string): Promise<ProviderKeyStatus> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
    });
    return statusFromResponse(response.status, [401, 403]);
  } catch {
    return 'Untested';
  }
}

async function verifyGeminiKey(key: string): Promise<ProviderKeyStatus> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}`);
    return statusFromResponse(response.status, [400, 401, 403]);
  } catch {
    return 'Untested';
  }
}

export async function verifyProviderKey(
  provider: ProviderKeyProvider,
  key: string,
): Promise<ProviderKeyStatus> {
  switch (provider) {
    case 'openai':
      return verifyOpenAIKey(key);
    case 'anthropic':
      return verifyAnthropicKey(key);
    case 'gemini':
      return verifyGeminiKey(key);
  }
}
