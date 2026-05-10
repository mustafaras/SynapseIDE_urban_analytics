import type { Adapter, CompleteResult, FinishReason, Message } from './types';
import { errorFromResponse, fromHttpError, makeError } from './errors';
import { requestJSON, requestSSE } from '@/services/ai/http';
import { fetchWithRetry } from '@/utils/resilience/fetchWithRetry';
import { flags } from '@/config/flags';
import { logger } from '@/lib/logger';
import type { EndpointId } from '@/utils/ai/models/schema';
import { isUsableOpenAIGpt5Model, openAIModelSupportsSampling } from '@/utils/ai/models/openaiGpt5';

export const ENDPOINTS: Record<'openai'|'anthropic'|'gemini'|'ollama', EndpointId> = {
  openai: 'openai_chat_completions',
  anthropic: 'anthropic_messages',
  gemini: 'gemini_generate',
  ollama: 'ollama_generate',
};

const textDecoder = () => new TextDecoder();


const pickBase = (explicit?: string, fallback?: string): string => explicit ?? (fallback ?? '');

function usesOpenAIResponses(model: string): boolean {
  return isUsableOpenAIGpt5Model(model);
}

function normalizeMessages(messages: Message[]): Array<{ role: 'system'|'user'|'assistant'; content: string }> {

  return messages.filter(m => m.role !== 'tool').map(m => ({ role: m.role as 'system'|'user'|'assistant', content: m.content }));
}

function normalizeOpenAIInput(messages: Message[]): Array<{ type: 'message'; role: 'system'|'user'|'assistant'; content: string }> {
  return normalizeMessages(messages).map((message) => ({ type: 'message', role: message.role, content: message.content }));
}

function buildOpenAIResponsesError(payload: Record<string, any>) {
  const nested = payload?.error ?? payload?.response?.error ?? payload;
  const providerCode = typeof nested?.code === 'string'
    ? nested.code
    : typeof nested?.type === 'string'
      ? nested.type
      : '';
  const message = typeof nested?.message === 'string' ? nested.message : 'OpenAI stream error';
  const normalizedProviderCode = providerCode.toLowerCase();
  const code: FinishReason | 'rate_limit' | 'auth' | 'invalid_request' | 'server' | 'unknown' =
    normalizedProviderCode === 'insufficient_quota' || normalizedProviderCode === 'rate_limit_exceeded'
      ? 'rate_limit'
      : normalizedProviderCode === 'invalid_api_key' || normalizedProviderCode === 'authentication_error'
        ? 'auth'
        : normalizedProviderCode === 'invalid_request_error'
          ? 'invalid_request'
          : normalizedProviderCode.startsWith('server_')
            ? 'server'
            : 'unknown';
  const err = makeError(message, code === 'server' ? 'server' : code === 'auth' ? 'auth' : code === 'rate_limit' ? 'rate_limit' : code === 'invalid_request' ? 'invalid_request' : 'unknown', 'openai', undefined, payload);
  if (providerCode) {
    (err as typeof err & { providerCode?: string }).providerCode = providerCode;
  }
  if (code !== 'unknown') {
    (err as typeof err & { category?: string }).category = code;
  }
  return err;
}

function parseOpenAIStreamPayload(payload: string): {
  delta?: string;
  finishReason?: FinishReason;
  usage?: { prompt: number; completion: number } | undefined;
  error?: ReturnType<typeof makeError>;
} | null {
  if (!payload) return null;
  if (payload === '[DONE]') {
    return { finishReason: 'stop' };
  }

  try {
    const json = JSON.parse(payload);
    if (json?.type === 'response.output_text.delta') {
      return { delta: typeof json.delta === 'string' ? json.delta : '' };
    }
    if (json?.type === 'response.completed') {
      const usage = json.response?.usage
        ? {
            prompt: json.response.usage.input_tokens ?? 0,
            completion: json.response.usage.output_tokens ?? 0,
          }
        : undefined;
      return usage ? { finishReason: 'stop', usage } : { finishReason: 'stop' };
    }
    if (json?.type === 'error' || json?.type === 'response.failed') {
      return { error: buildOpenAIResponsesError(json) };
    }

    const choice = json.choices?.[0];
    const usage = json.usage ? {
      prompt: json.usage.prompt_tokens ?? 0,
      completion: json.usage.completion_tokens ?? 0,
    } : undefined;
    const raw = choice?.delta?.content;
    const delta = typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw.filter((part: { type?: string }) => part?.type === 'text').map((part: { text: string }) => part.text).join('')
        : '';
    return {
      ...(delta ? { delta } : {}),
      ...(choice?.finish_reason ? { finishReason: choice.finish_reason as FinishReason } : {}),
      ...(usage ? { usage } : {}),
    };
  } catch {
    return null;
  }
}


export function openaiAdapter(): Adapter {
  return {
    async stream({ requestId, signal, baseUrl, apiKey, options, messages, onEvent, timeoutMs }) {
      if (flags.aiTrace) logger.debug('[ADAPTER_ASSERT]', 'endpoint=', ENDPOINTS.openai);
      const useResponses = usesOpenAIResponses(options.model);
      const supportsSampling = openAIModelSupportsSampling(options.model);
      const url = `${pickBase(baseUrl, 'https://api.openai.com')}${useResponses ? '/v1/responses' : '/v1/chat/completions'}`;
      onEvent({ type: 'start', requestId });
      if (flags.aiTrace) logger.info('[ADAPTER_REQUEST]', 'provider=openai', 'model=', options.model, 'stream=true');
      const key = (apiKey || '').trim();
      if (!key) {
        onEvent({ type: 'error', requestId, error: fromHttpError({ code: 'http_4xx', status: 401, retriable: false, userMessage: 'Missing API key', detail: 'no_key' }, 'openai') });
        return;
      }
      const headers: Record<string,string> = { Authorization: `Bearer ${key}` };
      const body: Record<string, unknown> = useResponses
        ? {
            model: options.model,
            input: normalizeOpenAIInput(messages),
            max_output_tokens: options.maxTokens,
            stream: true,
          }
        : {
            model: options.model,
            messages: normalizeMessages(messages),
            ...(supportsSampling ? { temperature: options.temperature, top_p: options.topP } : {}),
            max_tokens: options.maxTokens,
            stop: options.stop,
            stream: true,
          };
      if (options.jsonMode && !useResponses) body.response_format = { type: 'json_object' };
      let first = true;
      try {
        await new Promise<void>((resolve, reject) => {
          const sseOpts: Parameters<typeof requestSSE>[0] = {
            url,
            method: 'POST',
            headers,
            body,
            signal,
            onEvent: (evt) => {
              if (evt.type === 'open') { if (flags.aiTrace) logger.debug('[ADAPTER_CONNECTION_OPENED]');  try { console.debug(`SSE_OPEN(openai)`); } catch {} return; }
              if (evt.type === 'error') {  try { console.debug(`SSE_ERROR(${  (evt.error as unknown as Error)?.message || evt.error || 'unknown'  })`); } catch {} reject(fromHttpError(evt.error!, 'openai')); return; }
              if (evt.type === 'done') { onEvent({ type: 'done', requestId, finishReason: 'stop' }); if (flags.aiTrace) logger.info('[ADAPTER_STREAM_END]'); resolve(); return; }
              if (evt.type === 'message' && evt.data) {
                const payload = evt.data;
                const parsed = parseOpenAIStreamPayload(payload);
                if (!parsed) return;
                if (parsed.error) {
                  reject(parsed.error);
                  return;
                }
                if (parsed.delta) {
                  if (first) { if (flags.aiTrace) logger.info('[ADAPTER_FIRST_CHUNK]'); first = false; }
                  try { console.debug(`SSE_DELTA(${parsed.delta.length})`); } catch {}
                  onEvent({ type: 'delta', requestId, text: parsed.delta });
                }
                if (parsed.usage) {
                  onEvent({ type: 'usage', requestId, usage: parsed.usage });
                }
                if (parsed.finishReason) {
                  onEvent({ type: 'done', requestId, finishReason: parsed.finishReason });
                  resolve();
                }
              }
            },
          };
          if (typeof timeoutMs === 'number') sseOpts.openTimeoutMs = timeoutMs;
          sseOpts.onConnect = () => { try { onEvent({ type: 'handshake', requestId }); } catch {} };
          sseOpts.onFirstByte = () => { try { onEvent({ type: 'first_byte', requestId }); } catch {} };
          const { cancel } = requestSSE(sseOpts);
          signal.addEventListener('abort', () => cancel(), { once: true });
        });
      } catch (e: any) {
        if (flags.aiTrace) logger.error('[ADAPTER_STREAM_ERROR]', String(e?.message || e));
        throw e;
      }
    },
    async complete({ baseUrl, apiKey, options, messages, signal, timeoutMs }) {
      const useResponses = usesOpenAIResponses(options.model);
      const supportsSampling = openAIModelSupportsSampling(options.model);
      const url = `${pickBase(baseUrl, 'https://api.openai.com')}${useResponses ? '/v1/responses' : '/v1/chat/completions'}`;
      const headers: Record<string,string> = {};
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const body: Record<string, unknown> = useResponses
        ? {
            model: options.model,
            input: normalizeOpenAIInput(messages),
            max_output_tokens: options.maxTokens,
          }
        : {
            model: options.model,
            messages: normalizeMessages(messages),
            ...(supportsSampling ? { temperature: options.temperature, top_p: options.topP } : {}),
            max_tokens: options.maxTokens,
            stop: options.stop,
          };
      if (options.jsonMode && !useResponses) body.response_format = { type: 'json_object' };
      const jsonOpts: Parameters<typeof requestJSON>[0] = { url, method: 'POST', headers, body };
      if (signal) jsonOpts.signal = signal;
      if (typeof timeoutMs === 'number') jsonOpts.timeout = timeoutMs;
      const data = await requestJSON<any>(jsonOpts).catch(e => { throw fromHttpError(e, 'openai'); });
      const choice = data.choices?.[0];
      const text: string = useResponses ? (data.output_text ?? '') : (choice?.message?.content ?? '');
      const finishReason = (useResponses ? 'stop' : choice?.finish_reason) as FinishReason | undefined;
      const usage = useResponses
        ? (data.usage ? { prompt: data.usage.input_tokens ?? 0, completion: data.usage.output_tokens ?? 0 } : undefined)
        : (data.usage ? { prompt: data.usage.prompt_tokens ?? 0, completion: data.usage.completion_tokens ?? 0 } : undefined);
      const result: CompleteResult = { text };
      if (finishReason !== undefined) result.finishReason = finishReason;
      if (usage) result.usage = usage;
      return result;
    },
  };
}


export function anthropicAdapter(): Adapter {
  return {
    async stream({ requestId, signal, baseUrl, apiKey, options, messages, onEvent, timeoutMs }) {
  if (flags.aiTrace) logger.debug('[ADAPTER_ASSERT]', 'endpoint=', ENDPOINTS.anthropic);
      const url = `${pickBase(baseUrl, 'https://api.anthropic.com')}/v1/messages`;
      onEvent({ type: 'start', requestId });
      if (flags.aiTrace) logger.info('[ADAPTER_REQUEST]', 'provider=anthropic', 'model=', options.model, 'stream=true');
      let sys = messages.find(m => m.role === 'system')?.content || undefined;
      if (options.jsonMode) {
        const inst = 'Respond ONLY with strict, valid JSON. No prose.';
        sys = sys ? `${sys}\n\n${inst}` : inst;
      }
      const userContent = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const body = { model: options.model, max_tokens: options.maxTokens ?? 2000, messages: [{ role: 'user', content: sys ? `${sys}\n\n${userContent}` : userContent }], temperature: options.temperature, top_p: options.topP, stream: true };
      try {
        let first = true;
        await new Promise<void>((resolve, reject) => {
          const headers: Record<string, string> = { 'anthropic-version': '2023-06-01' };
          if (apiKey) headers['x-api-key'] = apiKey;
          const sseOpts: Parameters<typeof requestSSE>[0] = {
            url,
            method: 'POST',
            headers,
            body,
            signal,
            onEvent: (evt) => {
              if (evt.type === 'open') { if (flags.aiTrace) logger.debug('[ADAPTER_CONNECTION_OPENED]');  try { console.debug('SSE_OPEN(anthropic)'); } catch {} return; }
              if (evt.type === 'error') {  try { console.debug(`SSE_ERROR(${  (evt.error as unknown as Error)?.message || evt.error || 'unknown'  })`); } catch {} reject(fromHttpError(evt.error!, 'anthropic')); return; }
              if (evt.type === 'done') { onEvent({ type: 'done', requestId, finishReason: 'stop' }); if (flags.aiTrace) logger.info('[ADAPTER_STREAM_END]'); resolve(); return; }
              if (evt.type === 'message' && evt.data) {
                const payload = evt.data;
                if (payload === '[DONE]') { onEvent({ type: 'done', requestId, finishReason: 'stop' }); resolve(); return; }
                try {
                  const json = JSON.parse(payload);
                  const delta = json.delta?.text || json.content_block_delta?.text || '';
                  if (delta) {
                    if (first) { if (flags.aiTrace) logger.info('[ADAPTER_FIRST_CHUNK]'); first = false; }
                    if (flags.aiTrace) logger.debug('[ADAPTER_CHUNK]', 'size=', String(delta.length));
                     try { console.debug(`SSE_DELTA(${delta.length})`); } catch {}
                    onEvent({ type: 'delta', requestId, text: delta });
                  }
                } catch {}
              }
            },
          };
          if (typeof timeoutMs === 'number') sseOpts.openTimeoutMs = timeoutMs;
          sseOpts.onConnect = () => { try { onEvent({ type: 'handshake', requestId }); } catch {} };
          sseOpts.onFirstByte = () => { try { onEvent({ type: 'first_byte', requestId }); } catch {} };
          const { cancel } = requestSSE(sseOpts);
          signal.addEventListener('abort', () => cancel(), { once: true });
        });
      } catch (e: any) {
        if (flags.aiTrace) logger.error('[ADAPTER_STREAM_ERROR]', String(e?.message || e));
        throw e;
      }
    },
    async complete({ baseUrl, apiKey, options, messages, signal, timeoutMs }) {
      const url = `${pickBase(baseUrl, 'https://api.anthropic.com')}/v1/messages`;
      let sys = messages.find(m => m.role === 'system')?.content || undefined;
      if (options.jsonMode) {
        const inst = 'Respond ONLY with strict, valid JSON. No prose.';
        sys = sys ? `${sys}\n\n${inst}` : inst;
      }
      const userContent = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const body = { model: options.model, max_tokens: options.maxTokens ?? 2000, messages: [{ role: 'user', content: sys ? `${sys}\n\n${userContent}` : userContent }], temperature: options.temperature, top_p: options.topP };
      const headers: Record<string, string> = { 'anthropic-version': '2023-06-01' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const jsonOpts: Parameters<typeof requestJSON>[0] = { url, method: 'POST', headers, body };
      if (signal) jsonOpts.signal = signal;
      if (typeof timeoutMs === 'number') jsonOpts.timeout = timeoutMs;
      const data = await requestJSON<{ content?: Array<{ text?: string }> }>(jsonOpts).catch((e) => { throw fromHttpError(e, 'anthropic'); });
      const text: string = data.content?.[0]?.text || '';
  return { text, finishReason: 'stop' };
    },
  };
}


export function geminiAdapter(): Adapter {
  return {
    async stream({ requestId, signal, baseUrl, apiKey, options, messages, onEvent, timeoutMs }) {
  if (flags.aiTrace) logger.debug('[ADAPTER_ASSERT]', 'endpoint=', ENDPOINTS.gemini);
      onEvent({ type: 'start', requestId });
      if (flags.aiTrace) logger.info('[ADAPTER_REQUEST]', 'provider=gemini', 'model=', options.model, 'stream=true');
      const sys = messages.find(m => m.role === 'system')?.content || undefined;
      const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const url = `${pickBase(baseUrl, 'https://generativelanguage.googleapis.com')}/v1beta/models/${options.model}:generateContent?key=${apiKey || ''}`;
      const body: Record<string, unknown> = { contents: [{ parts: [{ text: sys ? `${sys}\n\n${user}` : user }] }], generationConfig: { maxOutputTokens: options.maxTokens ?? 2000, temperature: options.temperature, topP: options.topP } };
      if (options.jsonMode) {

        body.response_mime_type = 'application/json';
      }
      try {
        const jsonOpts: Parameters<typeof requestJSON>[0] = { url, method: 'POST', body };
        if (signal) jsonOpts.signal = signal;
        if (typeof timeoutMs === 'number') jsonOpts.timeout = timeoutMs;
        const data = await requestJSON<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(jsonOpts).catch((e) => { throw fromHttpError(e, 'gemini'); });
        if (flags.aiTrace) logger.debug('[ADAPTER_CONNECTION_OPENED]');

        try { onEvent({ type: 'handshake', requestId }); } catch {}
         try { console.debug('SSE_OPEN(gemini)'); } catch {}
        const full: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!full) { onEvent({ type: 'done', requestId, finishReason: 'stop' }); if (flags.aiTrace) logger.info('[ADAPTER_STREAM_END]'); return; }
        const chunks = full.match(/.{1,60}/g) || [full];
        let first = true;

        try { onEvent({ type: 'first_byte', requestId }); } catch {}
        for (const c of chunks) {
          if (signal.aborted) break;
          if (first) { if (flags.aiTrace) logger.info('[ADAPTER_FIRST_CHUNK]'); first = false; }
          if (flags.aiTrace) logger.debug('[ADAPTER_CHUNK]', 'size=', String(c.length));
           try { console.debug(`SSE_DELTA(${c.length})`); } catch {}
          onEvent({ type: 'delta', requestId, text: c });
          await new Promise(r => setTimeout(r, 16));
        }
        onEvent({ type: 'done', requestId, finishReason: 'stop' });
        if (flags.aiTrace) logger.info('[ADAPTER_STREAM_END]');
        if (signal.aborted && flags.aiTrace) logger.warn('[ADAPTER_STREAM_ABORTED]');
      } catch (e: unknown) {
         try { console.debug(`SSE_ERROR(${  (e as Error)?.message || 'unknown'  })`); } catch {}
        if (flags.aiTrace) logger.error('[ADAPTER_STREAM_ERROR]', String((e as Error)?.message || e));
        throw e;
      }
    },
    async complete({ baseUrl, apiKey, options, messages, signal, timeoutMs }) {
      const sys = messages.find(m => m.role === 'system')?.content || undefined;
      const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const url = `${pickBase(baseUrl, 'https://generativelanguage.googleapis.com')}/v1beta/models/${options.model}:generateContent?key=${apiKey || ''}`;
  const body: Record<string, unknown> = { contents: [{ parts: [{ text: sys ? `${sys}\n\n${user}` : user }] }], generationConfig: { maxOutputTokens: options.maxTokens ?? 2000, temperature: options.temperature, topP: options.topP } };
  if (options.jsonMode) body.response_mime_type = 'application/json';
  const jsonOpts2: Parameters<typeof requestJSON>[0] = { url, method: 'POST', body };
      if (signal) jsonOpts2.signal = signal;
      if (typeof timeoutMs === 'number') jsonOpts2.timeout = timeoutMs;
  const data = await requestJSON<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(jsonOpts2).catch((e) => { throw fromHttpError(e, 'gemini'); });
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { text, finishReason: 'stop' };
    },
  };
}


export function ollamaAdapter(): Adapter {
  return {
    async stream({ requestId, signal, baseUrl, options, messages, onEvent, timeoutMs }) {
      if (flags.aiTrace) logger.debug('[ADAPTER_ASSERT]', 'endpoint=', ENDPOINTS.ollama);
      onEvent({ type: 'start', requestId });
      const sys = messages.find(m => m.role === 'system')?.content || undefined;
  const userParts = messages.filter(m => m.role === 'user').map(m => m.content);
      const configured = pickBase(baseUrl, 'http://localhost:11434');
      const isLocalDefault = /localhost:11434\/?$/.test(configured);
      const base = isLocalDefault && typeof window !== 'undefined' ? '/ollama' : configured;
      const root = base.replace(/\/+$/,'');
      const chatUrl = `${root}/api/chat`;
      const genUrl = `${root}/api/generate`;
      const chatBody = { model: options.model, messages: normalizeMessages(messages), stream: true, ...(options.jsonMode ? { format: 'json' } : {}) };
      const genPrompt = [sys ? `system: ${sys}` : null, ...userParts.map(u => `user: ${u}`)].filter(Boolean).join('\n');
      const genBody = { model: options.model, prompt: genPrompt, stream: true, ...(options.jsonMode ? { format: 'json' } : {}) };


      let resp = await fetchWithRetry(chatUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify(chatBody), signal }, timeoutMs !== undefined ? { timeoutMs } : {});
      if (resp.status === 404) {

        resp = await fetchWithRetry(genUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify(genBody), signal }, timeoutMs !== undefined ? { timeoutMs } : {});
      }
      if (!resp.ok || !resp.body) throw await errorFromResponse(resp, 'ollama', 'stream');
      const reader = resp.body.getReader();
      const dec = textDecoder();
      let buf = '';
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;

      try { onEvent({ type: 'handshake', requestId }); } catch {}
       try { console.debug('SSE_OPEN(ollama)'); } catch {}
      let firstByteEmitted = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            const chunk: string = obj?.message?.content ?? obj?.response ?? '';
            if (!firstByteEmitted) { firstByteEmitted = true; try { onEvent({ type: 'first_byte', requestId }); } catch {} }
            if (chunk) onEvent({ type: 'delta', requestId, text: chunk });
            if (chunk) {  try { console.debug(`SSE_DELTA(${chunk.length})`); } catch {} }
            if (typeof obj?.prompt_eval_count === 'number') promptTokens = obj.prompt_eval_count;
            if (typeof obj?.eval_count === 'number') completionTokens = obj.eval_count;
            if (obj?.done === true) {
              if (promptTokens !== undefined || completionTokens !== undefined) {
                const p = promptTokens ?? 0;
                const c = completionTokens ?? 0;
                onEvent({ type: 'usage', requestId, usage: { prompt: p, completion: c } });
              }
              onEvent({ type: 'done', requestId, finishReason: 'stop' });
              }
          } catch {

          }
        }
      }
    },
    async complete({ baseUrl, options, messages, signal, timeoutMs }) {
      const sys = messages.find(m => m.role === 'system')?.content || undefined;
      const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
      const configured = pickBase(baseUrl, 'http://localhost:11434');
      const isLocalDefault = /localhost:11434\/?$/.test(configured);
      const base = isLocalDefault && typeof window !== 'undefined' ? '/ollama' : configured;
      const jsonOpts3: Parameters<typeof requestJSON>[0] = { url: `${base.replace(/\/+$/,'')}/api/generate`, method: 'POST', body: { model: options.model, prompt: sys ? `${sys}\n\n${user}` : user, stream: false, ...(options.jsonMode ? { format: 'json' } : {}) } };
      if (signal) jsonOpts3.signal = signal;
      if (typeof timeoutMs === 'number') jsonOpts3.timeout = timeoutMs;
      const data = await requestJSON<{ response?: string; message?: { content?: string } }>(jsonOpts3).catch((e) => { throw fromHttpError(e, 'ollama'); });
      const text: string = data.response || data?.message?.content || '';
      return { text, finishReason: 'stop' };
    },
    async listModels({ baseUrl }) {

      try {
        const root = pickBase(baseUrl, 'http://localhost:11434').replace(/\/+$/,'');
        for (const path of ['/api/tags', '/api/models']) {
          const res = await fetch(root + path).catch(() => undefined);
          if (!res || !res.ok) continue;
            const json = await res.json().catch(()=>({}));
            const arr = Array.isArray(json.models) ? json.models : Array.isArray(json) ? json : [];
            const models = arr.map((m: { model?: string; name?: string; tag?: string }) => m?.model || m?.name || m?.tag).filter(Boolean);
            if (models.length) return Array.from(new Set(models));
        }
      } catch {}
      return [];
    }
  };
}


export const ADAPTERS = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  ollama: ollamaAdapter,
} as const;
export type ProviderId = keyof typeof ADAPTERS;
export type AdapterFactory = typeof ADAPTERS[ProviderId];


export function normalizeProviderId(input: string): ProviderId {
  const k = (input || '').toLowerCase().trim();
  if (k === 'google' || k === 'vertex' || k === 'generativeai') return 'gemini';
  if ((ADAPTERS as any)[k]) return k as ProviderId;
  throw new Error(`Unknown provider alias: "${input}" (expected one of ${Object.keys(ADAPTERS).join(', ')})`);
}

export function getAdapter(provider: ProviderId | string): Adapter {
  const id = normalizeProviderId(provider as string);
  const factory = (ADAPTERS as any)[id];
  if (!factory) throw makeError('Unknown provider', 'invalid_request');
  return factory();
}


export const __assertProviderKeys: ProviderId[] = Object.keys(ADAPTERS) as ProviderId[];
