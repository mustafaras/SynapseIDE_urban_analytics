import { useCallback, useRef, useState } from 'react';
import { drainSseBuffer, normalizeSseNewlines } from '@/services/ai/http';
import { useAiConfigStore } from '@/stores/useAiConfigStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  getOpenAIGpt5FallbackModel,
  openAIModelSupportsSampling,
  PRIMARY_OPENAI_GPT5_MODEL,
} from '@/utils/ai/models/openaiGpt5';

interface SimpleStreamParams {
  prompt: string;
  model?: string | undefined;
  systemPrompt?: string | undefined;
  temperature?: number | undefined;
  topP?: number | undefined;
  maxTokens?: number | undefined;
  apiKey?: string | undefined;
  onDelta?: (chunk: string) => void;
  onComplete?: (full: string) => void;
  onError?: (err: unknown) => void;
}

interface SimpleStreamState {
  isStreaming: boolean;
  startedAt?: number | undefined;
  firstByteAt?: number | undefined;
  endedAt?: number | undefined;
  error?: string | undefined;
  errorStatus?: number | undefined;
}

type SimpleStreamError = Error & {
  code?: string;
  status?: number;
  userMessage?: string;
  detail?: string;
  retryAfterMs?: number | null;
  category?: string;
  providerCode?: string;
};

type SimpleOpenAIMessage = {
  role: 'system' | 'user';
  content: string;
};

function isResponsesModel(model: string): boolean {
  return model.trim().toLowerCase().startsWith('gpt-5');
}

function buildDirectOpenAIRequest(
  model: string,
  requestMessages: SimpleOpenAIMessage[],
  params: Pick<SimpleStreamParams, 'temperature' | 'topP' | 'maxTokens'>,
): { url: string; body: Record<string, unknown> } {
  if (isResponsesModel(model)) {
    return {
      url: 'https://api.openai.com/v1/responses',
      body: {
        model,
        input: requestMessages.map((message) => ({
          type: 'message',
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: params.maxTokens,
        stream: true,
      },
    };
  }

  return {
    url: 'https://api.openai.com/v1/chat/completions',
    body: {
      model,
      messages: requestMessages,
      ...(openAIModelSupportsSampling(model)
        ? { temperature: params.temperature, top_p: params.topP }
        : {}),
      max_tokens: params.maxTokens,
      stream: true,
    },
  };
}

function getFallbackModel(model: string): string | null {
  return getOpenAIGpt5FallbackModel(model, useAiConfigStore.getState().modelList.openai);
}

function syncFallbackModel(model: string) {
  try {
    const aiStore = useAiConfigStore.getState();
    if (aiStore.model !== model) {
      try {
        aiStore.setModel(model);
      } catch {
        useAiConfigStore.setState((current) => ({ model, configVersion: current.configVersion + 1 }));
      }
    }
  } catch {}

  try {
    const settingsStore = useSettingsStore.getState();
    settingsStore.setModel(model);
  } catch {}
}

function buildSimpleStreamError(input: {
  status?: number | undefined;
  payload?: unknown;
  fallbackModel?: string | null | undefined;
}): SimpleStreamError {
  const payload = input.payload;
  let code = 'stream_error';
  let status = input.status;
  let userMessage = '';
  let detail = '';
  let retryAfterMs: number | null = null;
  let category = 'unknown';
  let providerCode = '';

  if (typeof payload === 'string') {
    detail = payload;
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      return buildSimpleStreamError({ status, payload: parsed, fallbackModel: input.fallbackModel });
    } catch {
      if (/upstream_429|http_429|\b429\b/.test(payload)) {
        code = 'rate_limit';
        category = 'rate_limit';
        status = 429;
      } else if (/failed to fetch|networkerror|load failed/i.test(payload)) {
        code = 'network';
        category = 'network';
        userMessage = 'Network error reaching the chat backend. Make sure the dev server is running (npm run dev) and that your browser can reach api.openai.com.';
      }
    }
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    // Unwrap common nested shapes: { error: { ... } } / { response: { error: { ... } } }
    const nested = (record.error && typeof record.error === 'object')
      ? record.error as Record<string, unknown>
      : ((record.response && typeof record.response === 'object' && typeof (record.response as Record<string, unknown>).error === 'object')
        ? (record.response as Record<string, unknown>).error as Record<string, unknown>
        : null);
    const rawStatus = record.status;
    if (typeof rawStatus === 'number') {
      status = rawStatus;
    }
    const pickString = (...values: unknown[]): string => {
      for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      return '';
    };

    const rawCode = pickString(record.code, nested?.code, record.error, nested?.type, record.type);
    if (rawCode) {
      code = rawCode;
      providerCode = rawCode;
    }
    const rawProviderCode = pickString(record.providerCode, nested?.code, nested?.type);
    if (rawProviderCode) {
      providerCode = rawProviderCode;
    }
    if (typeof record.category === 'string') {
      category = record.category;
    }
    const rawDetail = pickString(record.detail, nested?.message, record.message);
    if (rawDetail) {
      detail = rawDetail;
    }
    const rawUserMessage = pickString(record.userMessage);
    if (rawUserMessage) {
      userMessage = rawUserMessage;
    } else if (!userMessage) {
      const rawMessage = pickString(nested?.message, record.message);
      if (rawMessage) userMessage = rawMessage;
    }
    if (typeof record.retryAfterMs === 'number') {
      retryAfterMs = record.retryAfterMs;
    }
  }

  const normalizedProviderCode = providerCode.toLowerCase();
  const isInsufficientQuota = normalizedProviderCode.includes('insufficient_quota');
  const isRateLimitCode = normalizedProviderCode.includes('rate_limit') || normalizedProviderCode === 'rate_limited';
  const isAuthCode = normalizedProviderCode.includes('invalid_api_key')
    || normalizedProviderCode.includes('authentication')
    || normalizedProviderCode.includes('unauthorized');
  const isInvalidRequest = normalizedProviderCode.includes('invalid_request');

  if (status === 429 || code === 'rate_limit' || code === 'upstream_429' || isRateLimitCode || isInsufficientQuota) {
    code = 'rate_limit';
    category = 'rate_limit';
    if (input.fallbackModel) {
      userMessage = `OpenAI returned 429 for the current model. Retrying with ${input.fallbackModel}.`;
    } else if (isInsufficientQuota) {
      userMessage = detail
        ? `OpenAI insufficient_quota: ${detail}`
        : 'OpenAI returned insufficient_quota for this request. The API key has no remaining quota — add billing or switch projects.';
    } else if (isRateLimitCode) {
      userMessage = detail
        ? `OpenAI rate_limit: ${detail}`
        : 'OpenAI rate-limited this request. Wait briefly or switch models.';
    } else {
      userMessage = detail
        ? `OpenAI 429: ${detail}`
        : 'OpenAI returned 429 for this request. This is usually model or project throttling, not a bad key.';
    }
  } else if (status === 401 || status === 403 || isAuthCode) {
    code = 'auth';
    category = 'auth';
    userMessage = detail
      ? `OpenAI auth error: ${detail}`
      : 'OpenAI rejected the API key for this request.';
  } else if (isInvalidRequest || status === 400) {
    code = code || 'invalid_request';
    category = 'invalid_request';
    userMessage = detail
      ? `OpenAI invalid_request: ${detail}`
      : 'OpenAI rejected the request as invalid. Check the model id and parameters.';
  } else if (status && status >= 500) {
    code = 'server';
    category = 'server';
    userMessage = detail
      ? `OpenAI server error: ${detail}`
      : 'OpenAI returned a server error. Retry in a moment.';
  }

  if (!userMessage) {
    if (detail) {
      userMessage = `OpenAI error: ${detail}`;
    } else if (providerCode) {
      userMessage = `OpenAI error (${providerCode}).`;
    } else if (typeof status === 'number') {
      userMessage = `OpenAI request failed with status ${status}.`;
    } else {
      userMessage = 'Streaming failed (no details returned by OpenAI).';
    }
  }

  try { console.error('[useSimpleOpenAIStream] error', { status, code, providerCode, category, detail, userMessage, payload }); } catch {}

  const err = new Error(userMessage) as SimpleStreamError;
  err.code = code;
  if (typeof status === 'number') {
    err.status = status;
  }
  err.userMessage = userMessage;
  if (detail) {
    err.detail = detail;
  }
  err.retryAfterMs = retryAfterMs;
  err.category = category;
  if (providerCode) {
    err.providerCode = providerCode;
  }
  return err;
}


export function useSimpleOpenAIStream() {
  const [state, setState] = useState<SimpleStreamState>({ isStreaming: false });
  const abortRef = useRef<AbortController | null>(null);
  const accRef = useRef('');

  const applySseBlock = useCallback((block: string, onDelta?: (chunk: string) => void) => {
    const lines = normalizeSseNewlines(block).split('\n');
    const dataLines: string[] = [];
    let eventType = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(':')) {
        continue;
      }
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    const payload = dataLines.join('\n').trim();
    if (!payload || payload === '[DONE]' || payload === ':done') {
      return;
    }
    const json = JSON.parse(payload);
    const normalizedEventType = eventType || (typeof json?.type === 'string' ? json.type : '');

    if (normalizedEventType === 'error' || normalizedEventType === 'response.failed') {
      throw buildSimpleStreamError({ payload: json?.response?.error ?? json });
    }

    if (normalizedEventType === 'response.output_text.delta') {
      const delta = typeof json?.delta === 'string' ? json.delta : '';
      if (delta) {
        accRef.current += delta;
        onDelta?.(delta);
      }
      return;
    }

    if (normalizedEventType === 'response.output_text.done' || normalizedEventType === 'response.completed') {
      return;
    }

    const raw = json?.choices?.[0]?.delta?.content;
    const delta = typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw
          .filter((part: { type?: string; text?: string }) => part?.type === 'text' && typeof part.text === 'string')
          .map((part: { text: string }) => part.text)
          .join('')
        : '';

    if (delta) {
      accRef.current += delta;
      onDelta?.(delta);
    }
  }, []);

  const start = useCallback((p: SimpleStreamParams) => {
    if (state.isStreaming) return;
    const requestedModel = p.model || PRIMARY_OPENAI_GPT5_MODEL;
    const controller = new AbortController();
    abortRef.current = controller;
    accRef.current = '';
    setState({ isStreaming: true, startedAt: Date.now() });

    const requestMessages: SimpleOpenAIMessage[] = [];
    if (p.systemPrompt) {
      requestMessages.push({ role: 'system', content: p.systemPrompt });
    }
    requestMessages.push({ role: 'user', content: p.prompt });

    const tryFetch = async (activeModel: string) => {
      const supportsSampling = openAIModelSupportsSampling(activeModel);
      const body = {
        model: activeModel,
        messages: requestMessages,
        ...(supportsSampling
          ? { temperature: p.temperature, top_p: p.topP }
          : {}),
        max_tokens: p.maxTokens,
        apiKey: p.apiKey,
        stream: true,
      };

      let resp: Response | null = null;
      let devProxyNetworkError: unknown = null;
      try {
        resp = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
      } catch (e) {
        devProxyNetworkError = e;
        resp = null;
      }
      if (!resp || resp.status === 404) {
        const directRequest = buildDirectOpenAIRequest(activeModel, requestMessages, {
          temperature: p.temperature,
          topP: p.topP,
          maxTokens: p.maxTokens,
        });

        try {
          resp = await fetch(directRequest.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: p.apiKey ? `Bearer ${p.apiKey}` : '',
            },
            body: JSON.stringify(directRequest.body),
            signal: controller.signal,
          });
        } catch (directErr) {
          // Both the dev proxy and the direct call failed. Surface a
          // descriptive network error so the UI never shows a blank
          // "Streaming failed." message.
          const directMsg = (directErr as { message?: string } | undefined)?.message || String(directErr ?? 'network_error');
          const proxyMsg = (devProxyNetworkError as { message?: string } | undefined)?.message || '';
          const combined = proxyMsg
            ? `Dev proxy /api/chat failed (${proxyMsg}) and the direct fetch to api.openai.com also failed (${directMsg}). Start the dev server with "npm run dev" or check network / CORS.`
            : `Network error calling OpenAI: ${directMsg}. Check network connectivity and browser CORS.`;
          const err = new Error(combined) as SimpleStreamError;
          err.code = 'network';
          err.category = 'network';
          err.userMessage = combined;
          err.detail = directMsg;
          throw err;
        }
      }
      if (!resp.ok || !resp.body) {
        const detail = await resp.text().catch(() => '');
        throw buildSimpleStreamError({ status: resp.status, payload: detail || { error: `http_${resp.status}` } });
      }

      const reader = (resp.body as ReadableStream<Uint8Array>).getReader();
      const dec = new TextDecoder();
      let firstByte = false;
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += dec.decode(value, { stream: true });
        buffer = drainSseBuffer(buffer, (block) => {
          if (!firstByte) {
            firstByte = true;
            setState(s => ({ ...s, firstByteAt: Date.now() }));
          }
          applySseBlock(block, p.onDelta);
        });
      }

      const remainder = normalizeSseNewlines(buffer).trim();
      if (remainder) {
        if (!firstByte) {
          setState(s => ({ ...s, firstByteAt: Date.now() }));
        }
        applySseBlock(remainder, p.onDelta);
      }
    };

    (async () => {
      try {
        let activeModel = requestedModel;
        try {
          await tryFetch(activeModel);
        } catch (error) {
          const normalized = buildSimpleStreamError({
            status: (error as { status?: number } | undefined)?.status,
            payload: (error as { detail?: string; message?: string } | undefined)?.detail || (error as { message?: string } | undefined)?.message || error,
            fallbackModel: getFallbackModel(activeModel),
          });
          const fallbackModel = normalized.status === 429 ? getFallbackModel(activeModel) : null;
          if (fallbackModel && fallbackModel !== activeModel) {
            window.dispatchEvent(new CustomEvent('ai:modelAutoAdjusted', {
              detail: {
                fromProvider: 'openai',
                toProvider: 'openai',
                previousModel: activeModel,
                newModel: fallbackModel,
              },
            }));
            syncFallbackModel(fallbackModel);
            activeModel = fallbackModel;
            await tryFetch(activeModel);
          } else {
            throw normalized;
          }
        }
        setState(s => ({ ...s, isStreaming: false, endedAt: Date.now(), error: undefined, errorStatus: undefined }));
        p.onComplete?.(accRef.current);
      } catch (e: any) {
        // If the error has already been normalized (e.g. thrown from
        // applySseBlock or the inner retry branch) preserve its fields so
        // the UI shows the real provider reason instead of a generic
        // "Streaming failed." message.
        const alreadyNormalized = e && typeof e === 'object' && typeof e.userMessage === 'string' && e.userMessage.length > 0;
        const normalized: SimpleStreamError = alreadyNormalized
          ? (e as SimpleStreamError)
          : buildSimpleStreamError({
              status: e?.status,
              payload: e?.detail || e?.message || e,
            });
        setState(s => ({
          ...s,
          isStreaming: false,
          endedAt: Date.now(),
          error: normalized.userMessage || normalized.message || 'stream_error',
          errorStatus: normalized.status,
        }));
        p.onError?.(normalized);
      }
    })();
  }, [state.isStreaming]);

  const abort = useCallback(() => { try { abortRef.current?.abort(); } catch {}; setState(s => ({ ...s, isStreaming: false, error: s.error || 'aborted', errorStatus: s.errorStatus, endedAt: Date.now() })); }, []);

  return { start, abort, state } as const;
}

export default useSimpleOpenAIStream;
