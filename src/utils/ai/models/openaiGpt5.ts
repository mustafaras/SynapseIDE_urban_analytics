export const OPENAI_GPT5_MODELS = ['gpt-5-mini', 'gpt-5', 'gpt-5-nano'] as const;

export const PRIMARY_OPENAI_GPT5_MODEL = OPENAI_GPT5_MODELS[0];

// Default seed catalog of known chat-capable OpenAI models. Used before
// `/v1/models` has been fetched dynamically. Kept conservative and alphabetical
// within each family so that the UI has a sensible default ordering.
export const OPENAI_CHAT_DEFAULT_MODELS = [
  'gpt-5-mini',
  'gpt-5',
  'gpt-5-nano',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'chatgpt-4o-latest',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o4-mini',
  'o3',
  'o3-mini',
  'o1',
  'o1-mini',
] as const;

// Non-chat / unsupported-in-panel model families. The regex is intentionally
// broad — any id containing one of these tokens is filtered from chat model
// lists regardless of whether the OpenAI API reports it under /v1/models.
const OPENAI_NON_CHAT_BLOCKLIST_RE = /(audio|realtime|transcribe|transcription|tts|speech|whisper|embedding|image|dall-?e|moderation|search-preview|codex|instruct|davinci-edit|curie|babbage|ada|edit-|-edit|omni-moderation|computer-use|rerank)/i;

// Accept any OpenAI chat-capable model. This covers current GPT-5 / GPT-4.1 /
// GPT-4o / GPT-4 / GPT-3.5 families plus the o-series reasoning models.
export function isUsableOpenAIChatModel(modelId: string): boolean {
  const id = (modelId || '').trim().toLowerCase();
  if (!id) return false;
  if (OPENAI_NON_CHAT_BLOCKLIST_RE.test(id)) return false;
  if (id.startsWith('gpt-')) return true;
  if (id.startsWith('chatgpt-')) return true;
  // o-series reasoning models: o1, o1-mini, o3, o3-mini, o4-mini, ...
  if (/^o[0-9]+(?:[-_].*)?$/.test(id)) return true;
  return false;
}

// Narrow predicate: true only for GPT-5 family. Callers that still route to
// `/v1/responses` continue to rely on this specific check; other chat models
// use `/v1/chat/completions` which does not accept Responses-only fields.
export function isUsableOpenAIGpt5Model(modelId: string): boolean {
  const id = (modelId || '').trim().toLowerCase();
  if (!id.startsWith('gpt-5')) return false;
  return !OPENAI_NON_CHAT_BLOCKLIST_RE.test(id);
}

function weightOpenAIGpt5Model(modelId: string): number {
  const id = modelId.trim().toLowerCase();
  if (id === 'gpt-5-mini') return 400;
  if (id === 'gpt-5') return 390;
  if (id === 'gpt-5-nano') return 380;
  if (id.startsWith('gpt-5-mini')) return 370;
  if (id.startsWith('gpt-5')) return 360;
  if (id.startsWith('gpt-5-nano')) return 350;
  return 300;
}

function weightOpenAIChatModel(modelId: string): number {
  const id = modelId.trim().toLowerCase();
  // Highest-priority: GPT-5 family (preferred defaults).
  const gpt5 = weightOpenAIGpt5Model(id);
  if (gpt5 > 300) return gpt5;
  // GPT-4.1 family.
  if (id === 'gpt-4.1-mini') return 290;
  if (id === 'gpt-4.1') return 285;
  if (id === 'gpt-4.1-nano') return 280;
  if (id.startsWith('gpt-4.1')) return 270;
  // GPT-4o family.
  if (id === 'gpt-4o') return 260;
  if (id === 'gpt-4o-mini') return 255;
  if (id === 'chatgpt-4o-latest') return 250;
  if (id.startsWith('gpt-4o')) return 240;
  // o-series reasoning.
  if (id === 'o4-mini') return 230;
  if (id === 'o3') return 225;
  if (id === 'o3-mini') return 220;
  if (id === 'o1') return 215;
  if (id === 'o1-mini') return 210;
  if (/^o[0-9]+/.test(id)) return 200;
  // Remaining GPT-4 / GPT-3.5.
  if (id === 'gpt-4-turbo') return 180;
  if (id.startsWith('gpt-4')) return 170;
  if (id.startsWith('gpt-3.5')) return 150;
  return 100;
}

export function normalizeOpenAIGpt5Models(modelIds: string[]): string[] {
  return Array.from(new Set(modelIds.map((modelId) => modelId.trim()).filter(isUsableOpenAIGpt5Model)))
    .sort((left, right) => {
      const byWeight = weightOpenAIGpt5Model(right) - weightOpenAIGpt5Model(left);
      return byWeight !== 0 ? byWeight : left.localeCompare(right);
    });
}

// Broad normalizer for the full OpenAI chat model catalog. Use this when
// presenting the model selector to the user so every chat-capable model
// discovered via `/v1/models` is available, not just the GPT-5 subset.
export function normalizeOpenAIChatModels(modelIds: string[]): string[] {
  return Array.from(new Set(modelIds.map((modelId) => modelId.trim()).filter(isUsableOpenAIChatModel)))
    .sort((left, right) => {
      const byWeight = weightOpenAIChatModel(right) - weightOpenAIChatModel(left);
      return byWeight !== 0 ? byWeight : left.localeCompare(right);
    });
}

export function getOpenAIGpt5FallbackModel(modelId: string, availableModels?: readonly string[]): string | null {
  const normalizedAvailable = Array.isArray(availableModels) && availableModels.length
    ? new Set(availableModels.map((model) => model.trim().toLowerCase()))
    : null;

  const pick = (...candidates: string[]) => {
    for (const candidate of candidates) {
      if (!normalizedAvailable || normalizedAvailable.has(candidate)) {
        return candidate;
      }
    }
    return null;
  };

  const id = modelId.trim().toLowerCase();
  if (id === 'gpt-5') {
    return pick('gpt-5-mini', 'gpt-5-nano');
  }
  if (id === 'gpt-5-mini') {
    return pick('gpt-5-nano');
  }
  if (id === 'gpt-5-nano') {
    return null;
  }
  if (isUsableOpenAIGpt5Model(id)) {
    return pick('gpt-5-mini', 'gpt-5', 'gpt-5-nano');
  }
  return null;
}

export function labelOpenAIGpt5Model(modelId: string): string {
  const id = modelId.trim();
  const lower = id.toLowerCase();
  if (lower === 'gpt-5') return 'GPT-5';
  if (lower === 'gpt-5-mini') return 'GPT-5 Mini';
  if (lower === 'gpt-5-nano') return 'GPT-5 Nano';

  const suffix = id.replace(/^gpt-5[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
  if (!suffix) {
    return 'GPT-5';
  }
  return `GPT-5 ${suffix.replace(/\b\w/g, (char) => char.toUpperCase())}`;
}

// Human-friendly label for any OpenAI chat model. Falls back to the raw id
// when no family-specific formatting applies.
export function labelOpenAIChatModel(modelId: string): string {
  const id = modelId.trim();
  if (!id) return id;
  const lower = id.toLowerCase();
  if (lower.startsWith('gpt-5')) return labelOpenAIGpt5Model(id);
  const titleCase = (part: string) => part.replace(/\b\w/g, (c) => c.toUpperCase());
  if (lower === 'chatgpt-4o-latest') return 'ChatGPT-4o (latest)';
  if (lower.startsWith('gpt-4.1')) {
    const suffix = id.replace(/^gpt-4\.1[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
    return suffix ? `GPT-4.1 ${titleCase(suffix)}` : 'GPT-4.1';
  }
  if (lower.startsWith('gpt-4o')) {
    const suffix = id.replace(/^gpt-4o[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
    return suffix ? `GPT-4o ${titleCase(suffix)}` : 'GPT-4o';
  }
  if (lower.startsWith('gpt-4')) {
    const suffix = id.replace(/^gpt-4[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
    return suffix ? `GPT-4 ${titleCase(suffix)}` : 'GPT-4';
  }
  if (lower.startsWith('gpt-3.5')) {
    const suffix = id.replace(/^gpt-3\.5[-_]?/i, '').replace(/[-_]+/g, ' ').trim();
    return suffix ? `GPT-3.5 ${titleCase(suffix)}` : 'GPT-3.5';
  }
  if (/^o[0-9]+/.test(lower)) {
    return id.toUpperCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return id;
}

export function inferOpenAIGpt5TokenCap(modelId: string): number {
  const lower = modelId.trim().toLowerCase();
  if (lower.includes('nano')) return 64000;
  if (lower.includes('mini')) return 128000;
  return 200000;
}

// Approximate context window per family for any OpenAI chat model. Only used
// for UI/metadata; actual limits are enforced by the upstream API.
export function inferOpenAIChatTokenCap(modelId: string): number {
  const lower = modelId.trim().toLowerCase();
  if (lower.startsWith('gpt-5')) return inferOpenAIGpt5TokenCap(modelId);
  if (lower.startsWith('gpt-4.1')) return 1_000_000;
  if (lower === 'chatgpt-4o-latest') return 128_000;
  if (lower.startsWith('gpt-4o')) return 128_000;
  if (lower.startsWith('gpt-4-turbo')) return 128_000;
  if (lower.startsWith('gpt-4')) return 8_192;
  if (lower.startsWith('gpt-3.5')) return 16_385;
  if (/^o[0-9]+/.test(lower)) return 200_000;
  return 128_000;
}

// Some OpenAI model families (currently GPT-5 and the o-series reasoning
// models) either require the Responses API or reject sampling parameters like
// `temperature` / `top_p`. This predicate tells the UI / adapters whether to
// strip those fields from the outbound request.
export function openAIModelSupportsSampling(modelId: string): boolean {
  const id = (modelId || '').trim().toLowerCase();
  if (!id) return true;
  if (id.startsWith('gpt-5')) return false;
  if (/^o[0-9]+/.test(id)) return false;
  return true;
}