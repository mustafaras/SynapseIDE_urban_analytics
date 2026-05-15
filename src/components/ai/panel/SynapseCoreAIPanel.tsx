
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelRoot } from './styles';
import styled from 'styled-components';

import { PanelHeader } from './Header';
import { AiSelectors, useAiConfigStore } from '@/stores/useAiConfigStore';
import { deriveModelMeta } from '@/ai/modelMeta';
import MessageList from './MessageList';

import UnifiedComposer from './UnifiedComposer';
import { useChatFSM } from '@/features/chat/state/useChatFSM';
import { useSynapseChat } from './hooks/useSynapseChat';
import { type AiProvider, useAiStreaming } from '@/hooks/useAiStreaming';
import { useSimpleOpenAIStream } from '@/hooks/useSimpleOpenAIStream';
import { phaseLabel, useStreamingPhaseController } from '@/hooks/useStreamingPhaseController';

import DebugTray from './DebugTray';
import { flags } from '@/config/flags';
import { annotateTrace, beginTrace, endTraceError, endTraceOk, spanEnd, spanStart } from '@/utils/obs/instrument';
import { useObs } from '@/utils/obs/store';
import { logger } from '@/lib/logger';
import { useSettingsStore } from '@/store/useSettingsStore';
import { buildNormalizedPrompt } from './utils/normalize';

export interface NormalizedError { code?: string; status?: number; userMessage?: string; detail?: string; retryAfterMs?: number | null; category?: string; providerCode?: string }
import { useAiSettingsStore } from '@/stores/useAiSettingsStore';
import { showToast } from '@/ui/toast/api';
import { buildContextBundle, type BuiltContext } from '@/lib/ai/context';
import { useCtxAttachStore } from '@/features/attachments/store';
import { resolveProviderKey } from '@/ai/utils/resolveKey';
import { useEditorStore } from '@/stores/editorStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';

/** Returns a live editor bridge that reads from editorStore at call time (not captured in closure). */
function makeEditorBridge() {
  return {
    getActiveFilePath: () => {
      const s = useEditorStore.getState();
      return s.tabs.find(t => t.id === s.activeTabId)?.path;
    },
    getActiveFileContent: () => {
      const s = useEditorStore.getState();
      return s.tabs.find(t => t.id === s.activeTabId)?.content;
    },
    getSelection: () => {
      const s = useEditorStore.getState();
      const tab = s.tabs.find(t => t.id === s.activeTabId);
      if (!tab?.selections?.length) return undefined;
      const sel = tab.selections[0];
      if (!sel) return undefined;
      const lines = (tab.content || '').split('\n');
      const text = lines.slice(sel.start.line - 1, sel.end.line).join('\n');
      return { text, path: tab.path, startLine: sel.start.line, endLine: sel.end.line };
    },
  };
}

/** Builds a compact diagnostics summary for the AI system prompt. */
function buildDiagnosticsSummary(): string {
  const diags = useProblemsStore.getState().diagnostics.filter(d => !d.stale);
  if (!diags.length) return '';
  const counts = diags.reduce<Record<string, number>>((acc, d) => {
    acc[d.severity] = (acc[d.severity] || 0) + 1;
    return acc;
  }, {});
  const countLine = Object.entries(counts)
    .map(([sev, n]) => `${n} ${sev}${n !== 1 ? 's' : ''}`)
    .join(', ');
  const items = diags.slice(0, 8).map(d =>
    `- [${d.severity.toUpperCase()}]${d.file ? ` ${d.file}` : ''}: ${d.message}`
  );
  return `### Active diagnostics (${countLine})\n${items.join('\n')}`;
}

export const SynapseCoreAIPanel: React.FC = () => {
  const ui = useAiSettingsStore(s => s.ui);


  type Mode = 'implement';
  const mode: Mode = 'implement';


  const systemByMode = useMemo<Record<Mode,string>>(() => ({
    implement: 'You are a senior coding copilot. Provide concise, production-ready code answers. Focus on applicability to the current project.',
  }), []);
  function buildContextHint(scope: 'selection'|'file'|'workspace'|'pinned') {
    switch(scope){
      case 'selection': return 'Context scope: Use ONLY the current editor selection if provided.';
      case 'file': return 'Context scope: Operate within the active file.';
      case 'workspace': return 'Context scope: Consider relevant files in the workspace.';
      case 'pinned': return 'Context scope: Prioritize the pinned snippets.';
      default: return 'Context scope: Scoped context.';
    }
  }
  const composeSystemPrefix = useCallback((currentMode: Mode) => {
    const { defaults, context, tokenBudget } = useAiSettingsStore.getState();
    return [
      systemByMode[currentMode],
      buildContextHint(context.scope),
      `Hard token budget: ${tokenBudget}. Temperature: ${defaults.temperature}, Max tokens: ${defaults.maxTokens}.`
    ].join(' ');
  }, [systemByMode]);


  const { canSend, send, open, delta, done, fail, cancel } = useChatFSM();

  const traces = useObs((s) => s.traces);
  const sessionTokens = useMemo(() => {

    return traces.reduce((acc, t) => acc + (t.usage?.prompt || 0) + (t.usage?.completion || 0), 0);
  }, [traces]);
  const lastContextRef = useRef<BuiltContext | null>(null);
  const attachments = useCtxAttachStore(s => s.items);
  const chat = useSynapseChat();

  const simpleEnabled = flags.simpleStream === true;
  const simpleHook = useSimpleOpenAIStream();
  const fullStream = useAiStreaming({});
  const stream = simpleEnabled ? {
    startStreaming: (p: any) => {
      if (p.provider !== 'openai') {

        return fullStream.startStreaming(p);
      }
      console.debug('[SIMPLE_STREAM] start', p.modelId);
      simpleHook.start({
        prompt: p.prompt,
        model: p.modelId,
        systemPrompt: p.systemPrompt,
        temperature: p.temperature,
        topP: p.topP,
        maxTokens: p.maxTokens,
        apiKey: p.openai || p.runtime?.apiKey,
        onDelta: (d) => { p.onDelta?.(d); },
        onComplete: (f) => { p.onComplete?.(f); },
        onError: (e) => { p.onError?.(e); },
      });
      return { opToken: 'simple', abort: () => simpleHook.abort(), groupKey: p.modelId };
    },
    abortStreaming: (_reason?: string) => { simpleHook.abort(); },
    getLastMeta: () => ({
      attempts: 1,
      lastHttpStatus: simpleHook.state.errorStatus ?? (simpleHook.state.error ? 500 : 200),
      lastError: simpleHook.state.error,
      startedAt: simpleHook.state.startedAt,
      endedAt: simpleHook.state.endedAt,
    }),
    streamState: { isStreaming: simpleHook.state.isStreaming, isTyping: simpleHook.state.isStreaming, abortReason: null, activeJobId: null, provider: 'openai', queuedJobs: 0 },
  } : fullStream;

  const phaseCtl = useStreamingPhaseController();
  const [lastError, setLastError] = useState<NormalizedError | null>(null);
  interface SwitchState { from?: string | null; to?: string | null }
  const [uiSwitching, setUiSwitching] = useState<SwitchState | null>(null);
  const lastUserPromptRef = useRef<string>('');
  const traceRef = useRef<{ id: string | null; net?: string | null; stream?: string | null }>({ id: null });

  const onStart = React.useCallback(() => {
    try {
      if (traceRef.current.id && traceRef.current.net) {
        spanEnd(traceRef.current.id, traceRef.current.net, {});
        traceRef.current.stream = spanStart(traceRef.current.id, 'stream', 'Tokens');
      }
    } catch {}
  }, []);
  const onDelta = React.useCallback((chunk: string) => {
    try {
      if (traceRef.current.id && traceRef.current.stream) {
        spanEnd(traceRef.current.id, traceRef.current.stream, { bytes: chunk.length });
        traceRef.current.stream = spanStart(traceRef.current.id, 'stream', 'Tokens');
      }
    } catch {}
  }, []);
  const onComplete = React.useCallback(() => {
    try {
      try {
        const provider = useAiConfigStore.getState().provider;
        if (provider !== 'ollama' && provider !== 'custom') {
          useAiConfigStore.setState((state) => ({
            keyStatus: {
              ...state.keyStatus,
              [provider]: {
                state: 'verified',
                checkedAt: Date.now(),
              },
            },
          }));
        }
      } catch {}
      if (traceRef.current.id) {
        endTraceOk(traceRef.current.id);
        traceRef.current = { id: null };
        setLastError(null);
      }
    } catch {}
  }, []);
  const onError = React.useCallback((err: unknown) => {
    const e = err as Record<string, unknown> | null | undefined;
    const rec = e as { code?: string; providerCode?: string; status?: number; userMessage?: string; message?: string; detail?: string; raw?: unknown; causeClass?: unknown; retryAfterMs?: number; category?: string } | null | undefined;
    const userMessage: string = rec?.userMessage || rec?.message || (typeof err === 'string' ? err : 'error');
    const detail = typeof rec?.detail === 'string' ? rec.detail : (rec?.raw ? String(rec.raw) : (rec?.causeClass ? String(rec.causeClass) : (rec?.code ? String(rec.code) : '')));
    const mapped: NormalizedError = {
      userMessage,
      detail,
      retryAfterMs: typeof rec?.retryAfterMs === 'number' ? rec.retryAfterMs : null,
    };
    if (rec?.code || rec?.providerCode) mapped.code = (rec.code || rec?.providerCode)!;
    if (rec?.providerCode) mapped.providerCode = rec.providerCode;
    if (typeof rec?.status === 'number') mapped.status = rec.status;
    if (rec?.category) mapped.category = rec.category;

    const normalizedProviderCode = String(mapped.providerCode || mapped.code || '').toLowerCase();
    if (mapped.category === 'rate_limit' && normalizedProviderCode.includes('insufficient_quota')) {
      mapped.userMessage = 'OpenAI returned insufficient_quota. This API key can authenticate, but the linked project cannot execute completions. Check the key\'s project or organization and the Usage limits page, not just the prepaid billing balance.';
      if (!mapped.detail) {
        mapped.detail = userMessage;
      }
    }

    setLastError(mapped);
    try {
      const provider = useAiConfigStore.getState().provider;
      if (provider !== 'ollama' && provider !== 'custom') {
        if (mapped.category === 'rate_limit') {
          useAiConfigStore.setState((state) => ({
            keyStatus: {
              ...state.keyStatus,
              [provider]: {
                state: 'rate-limited',
                message: normalizedProviderCode.includes('insufficient_quota')
                  ? 'Quota exceeded or project usage limit reached'
                  : (mapped.userMessage || 'Rate limited'),
                checkedAt: Date.now(),
                retryAt: normalizedProviderCode.includes('insufficient_quota') ? undefined : (mapped.retryAfterMs ? Date.now() + mapped.retryAfterMs : Date.now() + 60_000),
              },
            },
          }));
        } else if (mapped.category === 'auth' || mapped.status === 401 || mapped.status === 403) {
          useAiConfigStore.setState((state) => ({
            keyStatus: {
              ...state.keyStatus,
              [provider]: {
                state: 'invalid',
                message: mapped.userMessage || 'Unauthorized',
                checkedAt: Date.now(),
              },
            },
          }));
        }
      }
    } catch {}
    try {
      if (traceRef.current.id) {
        annotateTrace(traceRef.current.id, {
          errorCategory: mapped.category || '',
          providerCode: mapped.providerCode || mapped.code || '',
          errorDetail: mapped.detail || '',
          retryAfterMs: mapped.retryAfterMs != null ? String(mapped.retryAfterMs) : '',
        });
        const traceErr: { code: string; status?: number; message?: string } = { code: String(mapped.code || 'unknown'), message: mapped.userMessage || '' };
        if (typeof mapped.status === 'number') traceErr.status = mapped.status;
        endTraceError(traceRef.current.id, traceErr);
      }
    } catch {}
    if (flags.aiTrace) logger.error('[AI][ERROR]', mapped.code, mapped.status, mapped.userMessage);
  }, []);

  interface ProfileData { settings?: { provider?: string; model?: string; jsonMode?: boolean; ollamaBaseUrl?: string }; provider?: string; model?: string; keys?: Record<string, { apiKey?: string } | string>; sampling?: { temperature?: number; top_p?: number; max_output_tokens?: number | null }; meta?: { systemPrompt?: string } }
  const getActiveProfileData = useCallback((): ProfileData => {
    const s = useSettingsStore.getState();
    const active = s.profiles.find(p => p.id === s.activeProfileId);
    return (active?.data as unknown as ProfileData) || {};
  }, []);

  const retry = React.useCallback(async () => {

    let text = (lastUserPromptRef.current || '').trim();
    if (!text) {

      for (let i = chat.messages.length - 1; i >= 0; i--) {
        const m = chat.messages[i];
        if (m.role === 'user' && m.content) { text = m.content.trim(); break; }
      }
    }
    if (!text) return;

    if (!canSend) {

      try { stream.abortStreaming('manual_retry'); } catch {}
  try { cancel('provider_abort'); } catch {}
      await new Promise(r => setTimeout(r, 25));
    }

    setLastError(null);
    phaseCtl.onStart();

    try {
      const id = beginTrace({ requestId: `ui_retry_${Date.now()}`, provider: 'n/a', model: 'n/a', userTextBytes: text.length, attachmentsCount: attachments.length });
      traceRef.current = { id, net: spanStart(id, 'network_connect', 'Connect'), stream: null };
    } catch {}

    const active = getActiveProfileData();
    const provider = (active.settings?.provider || active.provider || 'openai') as AiProvider;
    const model = (active.settings?.model || active.model || 'gpt-5-mini');
    const keys = active.keys || {};
    const stg = active.settings || {};
    const sampling = active.sampling || { temperature: 0.3, top_p: 1, max_output_tokens: null };
    const sysPrompt = active.meta?.systemPrompt || '';
    const jsonMode = !!stg?.jsonMode;
    const route = { provider, model } as const;
    lastUserPromptRef.current = text;
    chat.appendUser(text, route);
    const assistant = chat.appendAssistantPlaceholder(route);
    const { prompt, systemPrompt: normSystem } = buildNormalizedPrompt({ userText: text });
    let finalSystemPrompt: string | undefined = normSystem;
    send(text, route.provider, route.model);
    const { rid, signal } = open();
    const sysPrefix = composeSystemPrefix(mode);
    try {
      const settings = useAiSettingsStore.getState();
      const evidence = useSynapseWorkspaceStore.getState().artifacts;
      const bundle = buildContextBundle({
        scope: settings.context.scope as 'selection'|'file'|'workspace'|'pinned',
        tokenBudget: settings.tokenBudget,
        responseTokens: settings.defaults.maxTokens,
        pinned: attachments.filter(a => a.type === 'selection').map(a => ({ path: a.path || '', name: a.label, content: a.text })),
        attachments: attachments.map(a => ({ path: a.path || '', name: a.label, content: a.text })),
        editor: makeEditorBridge(),
        evidence,
      });
      lastContextRef.current = bundle;
      const diagSummary = settings.context.includeDiagnostics ? buildDiagnosticsSummary() : '';
      const pieces = [sysPrefix, sysPrompt, normSystem, bundle.text, diagSummary].filter(Boolean);
      finalSystemPrompt = pieces.join('\n\n');
    } catch {}


    const providerForKey = (provider === 'gemini' ? 'google' : provider) as 'openai' | 'anthropic' | 'google';
    const resolvedKey = resolveProviderKey(providerForKey, keys, useAiSettingsStore.getState().keys);
    const bypassKeys = flags.e2e === true;
    if (!resolvedKey && provider !== 'ollama' && !bypassKeys) {
      showToast({ kind: 'error', message: `No API key configured for ${provider}. Open Settings → Providers & Keys.`, contextKey: 'ai:no-key' });
      try { window.dispatchEvent(new Event('ai:openKeys')); } catch {}
      return;
    }
    if (flags.aiTrace) logger.info('[AI][RETRY] (manual) provider=', provider, 'model=', model, 'hasKey=', !!resolvedKey);
    const keyPayload: Partial<Record<'openai'|'anthropic'|'google', string>> =
      provider === 'openai' ? { openai: resolvedKey as string } :
      provider === 'anthropic' ? { anthropic: resolvedKey as string } :
      provider === 'gemini' ? { google: resolvedKey as string } : {};

    stream.startStreaming({
      provider: route.provider,
      modelId: route.model,
      prompt,
      ...(finalSystemPrompt ? { systemPrompt: finalSystemPrompt } : {}),
      temperature: Number(sampling?.temperature ?? 0.3),
      topP: Number(sampling?.top_p ?? 1),
      ...(typeof (sampling?.max_output_tokens) === 'number' ? { maxTokens: Number(sampling?.max_output_tokens) } : {}),
      jsonMode: !!jsonMode,
      ...(stg.ollamaBaseUrl ? { ollama: stg.ollamaBaseUrl } : {}),
      ...keyPayload,
  onStart: (_m) => { onStart(); phaseCtl.onConnect(); },
      onFirstByte: () => { phaseCtl.onFirstByte(); },
      onDelta: (chunk) => { phaseCtl.onDelta(); chat.mergeAssistantDelta(assistant.id, chunk); try { delta(rid, chunk); } catch {} },
      onComplete: (_full) => { chat.finalizeAssistant(assistant.id); try { done(rid); } catch {}; onComplete(); phaseCtl.onFinal(); },
      onError: (err) => {
        const e = err as { message?: string };
        const msg = e?.message || String(err ?? 'error');
        chat.setErrorOnAssistant(assistant.id, msg);
        try { fail(msg, undefined, rid); } catch {}
        onError(err); phaseCtl.onError(err);
      },
    }, { groupKey: `assistant:${assistant.id}`, signal });
  }, [attachments, canSend, cancel, chat, delta, done, fail, onComplete, onError, onStart, open, send, stream, mode, phaseCtl, composeSystemPrefix, getActiveProfileData]);


  const handleOpenSettings = useCallback(() => { try { window.dispatchEvent(new Event('ai:openKeys')); } catch {} }, []);

  interface StartWrapperParams { provider: AiProvider; modelId: string; prompt: string; systemPrompt?: string; onStart?: (meta: { requestId: string }) => void; onConnect?: () => void; onFirstByte?: () => void; onDelta?: (c: string)=>void; onComplete?: (f: string)=>void; onError?: (e: unknown)=>void; assistantId?: string; id?: string }
  const handleStartStreaming = useCallback((params: StartWrapperParams, opts?: { groupKey?: string; signal?: AbortSignal }) => {
    try {
      lastUserPromptRef.current = params.prompt || '';
  const id = beginTrace({ requestId: `ui_${Date.now()}`, provider: params.provider, model: params.modelId, userTextBytes: (params.prompt || '').length, attachmentsCount: 0 });
      traceRef.current.id = id;
      traceRef.current.net = spanStart(id, 'network_connect', 'Connect');
      phaseCtl.onStart();
    } catch {}
    const sysPrefix = composeSystemPrefix(mode);

    const nextParams: StartWrapperParams & { systemPrompt?: string } = { ...params };
    nextParams.systemPrompt = nextParams.systemPrompt ? `${sysPrefix}\n${nextParams.systemPrompt}` : sysPrefix;
    try {
      const settings = useAiSettingsStore.getState();
      const evidence = useSynapseWorkspaceStore.getState().artifacts;
      const bundle = buildContextBundle({
        scope: settings.context.scope as 'selection'|'file'|'workspace'|'pinned',
        tokenBudget: settings.tokenBudget,
        responseTokens: settings.defaults.maxTokens,
        pinned: attachments.filter(a => a.type === 'selection').map(a => ({ path: a.path || '', name: a.label, content: a.text })),
        attachments: attachments.map(a => ({ path: a.path || '', name: a.label, content: a.text })),
        editor: makeEditorBridge(),
        evidence,
      });
      lastContextRef.current = bundle;
      const diagSummary = settings.context.includeDiagnostics ? buildDiagnosticsSummary() : '';
      const bundleAndDiag = [bundle.text, diagSummary].filter(Boolean).join('\n\n');
      nextParams.systemPrompt = nextParams.systemPrompt ? `${nextParams.systemPrompt}\n\n${bundleAndDiag}` : bundleAndDiag;
    } catch {}
    const activeProvider = nextParams.provider as AiProvider;
    const keyLookup = (() => {
      const legacyStore = useSettingsStore.getState();
      const legacyProfile = legacyStore.profiles.find(p => p.id === legacyStore.activeProfileId);
      type LegacyKeys = Record<string, { apiKey?: string }>;
      const legacyKeys = (legacyProfile?.data as { keys?: LegacyKeys })?.keys || {};
      const resolved = resolveProviderKey((activeProvider === 'gemini' ? 'google' : activeProvider) as 'openai'|'anthropic'|'google', legacyKeys, useAiSettingsStore.getState().keys);
      return resolved;
    })();
    const bypass = flags.e2e === true;
    if (!keyLookup && activeProvider !== 'ollama' && !bypass) {
      showToast({ kind: 'error', message: `No API key for ${activeProvider}. Open Settings → Providers & Keys.`, contextKey: 'ai:no-key-send' });
      try { window.dispatchEvent(new Event('ai:openKeys')); } catch {}

      try { chat.finalizeLatestStreamingAssistant('Missing API key'); } catch {}
      return { opToken: 'no_key', abort: () => {}, groupKey: opts?.groupKey || 'assistant' } as { opToken: string; abort: () => void; groupKey: string };
    }
    const creds: Partial<{ openai: string; anthropic: string; google: string }> = {};
    if (activeProvider === 'openai' && keyLookup) creds.openai = keyLookup;
    if (activeProvider === 'anthropic' && keyLookup) creds.anthropic = keyLookup;
    if (activeProvider === 'gemini' && keyLookup) creds.google = keyLookup;
    return stream.startStreaming({
      ...nextParams,
      ...creds,
      onStart: (m) => { onStart(); phaseCtl.onConnect(); params.onStart?.(m); },
      onFirstByte: () => { phaseCtl.onFirstByte(); params.onFirstByte?.(); },
      onDelta: (c) => { phaseCtl.onDelta(); onDelta(c); params.onDelta?.(c); },
      onComplete: (f) => {

        try {
          if (params.assistantId) chat.finalizeAssistant(params.assistantId); else chat.finalizeLatestStreamingAssistant();
        } catch {}
        onComplete();
        params.onComplete?.(f);
        phaseCtl.onFinal();
      },
      onError: (e) => {

        try {
          const msg = (e as { message?: string })?.message || 'error';
          if (params.assistantId) chat.finalizeAssistant(params.assistantId); else chat.finalizeLatestStreamingAssistant(msg);
        } catch {}
        onError(e);
        params.onError?.(e);
        phaseCtl.onError(e);
      },
    }, { ...opts, groupKey: opts?.groupKey || (params?.assistantId ? `assistant:${params.assistantId}` : (params?.id ? `assistant:${params.id}` : 'assistant')) });
  }, [attachments, chat, composeSystemPrefix, mode, onStart, onDelta, onComplete, onError, phaseCtl, stream]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ from?: string; to?: string; reason?: string }>).detail || {};
      const from = detail.from ?? null; const to = detail.to ?? null;
      console.warn?.('[AI][UI] SWITCHING_PROVIDER', { from, to, reason: detail.reason });
      setUiSwitching({ from, to });
      window.clearTimeout((handler as unknown as { t?: number }).t);
      (handler as unknown as { t?: number }).t = window.setTimeout(() => { setUiSwitching(null); }, 2200);
    };
    window.addEventListener('ai:providerSwitch', handler as EventListener);

    const mismatch = (ev: Event) => {
      const d = (ev as CustomEvent<{ provider: string; attemptedModel: string }>).detail; if(!d) return;
      try { showToast?.({ kind:'warning', message:`Model "${d.attemptedModel}" is not valid for ${d.provider}`, contextKey:'ai:model-mismatch' }); } catch {}
    };
    const autoAdj = (ev: Event) => {
      const d = (ev as CustomEvent<{ fromProvider:string; toProvider:string; previousModel:string; newModel:string }>).detail; if(!d) return;
      try { showToast?.({ kind:'info', message:`Model adjusted to ${d.newModel} for ${d.toProvider}`, contextKey:'ai:model-auto' }); } catch {}
    };
    const failover = (ev: Event) => {
      const d = (ev as CustomEvent<{ from:string; to:string; category?:string; code?:string; attempt:number }>).detail; if(!d) return;
      try { showToast?.({ kind:'info', message:`Failover ${d.from} → ${d.to} (${d.category||d.code||'retry'})`, contextKey:'ai:failover' }); } catch {}
    };
    window.addEventListener('ai:modelProviderMismatch', mismatch as EventListener);
    window.addEventListener('ai:modelAutoAdjusted', autoAdj as EventListener);
    window.addEventListener('ai:failoverNotice', failover as EventListener);
    return () => {
      window.removeEventListener('ai:providerSwitch', handler as EventListener);
      window.removeEventListener('ai:modelProviderMismatch', mismatch as EventListener);
      window.removeEventListener('ai:modelAutoAdjusted', autoAdj as EventListener);
      window.removeEventListener('ai:failoverNotice', failover as EventListener);
      window.clearTimeout((handler as unknown as { t?: number }).t);
    };
  }, []);
  const dismissSwitch = useCallback(() => { setUiSwitching(null); }, []);
  const handleOpenKeys = useCallback(() => { try { window.dispatchEvent(new Event('ai:openKeys')); } catch {} }, []);
  const handleOpenLogs = useCallback(() => { try { window.dispatchEvent(new Event('ai:openLogs')); } catch {} }, []);
  return (
    <PanelRoot
      role="complementary"
      aria-label="SynapseCore AI"
      tabIndex={-1}
      data-testid="assistant-panel"
      style={{ fontSize: ui.fontSize, lineHeight: ui.compactMode ? 1.3 : 1.45, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      <PanelHeader />
      <PanelStatusStrip sessionTokens={sessionTokens} />
      {uiSwitching ? (
        <InfoBar from={uiSwitching.from || undefined} to={uiSwitching.to || undefined} onClose={dismissSwitch} />
      ) : null}
      {}
      {!stream.streamState.isStreaming && lastError ? (
        <ErrorCard
          message={lastError.userMessage || 'Streaming failed'}
          onSwitch={handleOpenKeys}
          onOpenLogs={handleOpenLogs}
        />
      ) : null}
      <MessageList messages={chat.messages} />
      {}
      <ContextPreviewStrip ctxRef={lastContextRef} />
      {flags.aiTrace ? <DebugTrayWrap><DebugTray /></DebugTrayWrap> : null}
      <UnifiedComposer
        draft={chat.draft}
        setDraft={chat.setDraft}
        messages={chat.messages}
        appendUser={chat.appendUser}
        appendAssistantPlaceholder={chat.appendAssistantPlaceholder}
        mergeAssistantDelta={chat.mergeAssistantDelta}
        finalizeAssistant={chat.finalizeAssistant}
        setErrorOnAssistant={chat.setErrorOnAssistant}
        fsm={{ canSend, send, open, delta, done, fail, cancel: (r: unknown) => { try { (cancel as unknown as (reason: unknown) => void)(r); } catch {} } }}
        clearAll={chat.clearAll}
        onRetry={retry}
        hasError={!!lastError}
        onOpenSettings={handleOpenSettings}
        abortStreaming={stream.abortStreaming}
        startStreaming={handleStartStreaming}
      />
      <PhaseStrip aria-live="polite">
        {phaseLabel(phaseCtl.phase) && <span>{phaseLabel(phaseCtl.phase)}</span>}
        {stream.streamState.isStreaming ? <span style={{ marginLeft: 8 }}>Generating…</span> : null}
      </PhaseStrip>
    </PanelRoot>
  );
};

export default SynapseCoreAIPanel;


const PanelStatusStrip: React.FC<{ sessionTokens: number }> = ({ sessionTokens }) => {

  const provider = useAiConfigStore(AiSelectors.provider);
  const model = useAiConfigStore(AiSelectors.model);
  const keyStatus = useAiConfigStore((s) => s.keyStatus?.[s.provider as keyof typeof s.keyStatus]);
  const refreshKeyStatus = useAiConfigStore((s) => s.refreshKeyStatus);
  const meta = model ? deriveModelMeta(provider, model) : null;
  const metaSubset = meta ? { family: meta.family, tags: meta.tags, ctx: meta.ctx } : null;
  const handleRefreshKey = useCallback(() => { void refreshKeyStatus(); }, [refreshKeyStatus]);
  const handleToggleOpen = useCallback(() => { setOpen(o => !o); }, []);
  const [open, setOpen] = React.useState<boolean>(() => {
    try { const v = localStorage.getItem('synapse.ai.statusStrip.open'); if (v === '0') return false; } catch {} return true;
  });
  useEffect(() => { try { localStorage.setItem('synapse.ai.statusStrip.open', open ? '1':'0'); } catch {} }, [open]);
  const [now, setNow] = React.useState<number>(Date.now());
  React.useEffect(()=>{ const t = setInterval(()=> setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const state: string = keyStatus?.state || 'unknown';
  const retryIn = state === 'rate-limited' && keyStatus?.retryAt ? Math.max(0, keyStatus.retryAt - now) : 0;
  const retrySecs = Math.ceil(retryIn/1000);
  const palette: Record<string,string> = {
    verified: 'var(--syn-status-valid, #4ec27d)',
    invalid: 'var(--syn-status-error, #f87171)',
    'rate-limited': 'var(--syn-status-warning, #d6a84f)',
    missing: 'var(--syn-status-blocked, #f87171)',
    unknown: 'var(--syn-status-unknown, #858b96)',
  };
  const color = palette[state] || 'var(--syn-status-unknown, #858b96)';
  const last = keyStatus?.checkedAt ? new Date(keyStatus.checkedAt).toLocaleTimeString() : '—';


  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;
  return (
    <StatusStripRoot data-expanded={open ? 'true' : 'false'}>
      <StatusTopRow>
        <StatusLeft>
          <StatusPill label={provider} value={model || '—'} meta={metaSubset} />
          {meta ? <MiniTag text={(meta.family && meta.family !== model) ? meta.family : 'family'} subtle /> : null}
          {meta ? meta.tags?.slice(0, isNarrow ? 1 : 3).map(t => <MiniTag key={t} text={t} />) : null}
          <KeyMetaGroup>
            <KeyDot style={{ background: color }} title={`Key: ${state}`} />
            {!isNarrow && <span className="syn-label">Key {state.replace('-', ' ')}</span>}
            {retrySecs > 0 && <span className="syn-retry" aria-live="polite">retry in {retrySecs}s</span>}
            {!isNarrow && <span className="syn-last">last {last}</span>}
          </KeyMetaGroup>
        </StatusLeft>
        <ActionBtnRow>
          <StatusBtn onClick={handleRefreshKey} title='Re-validate key' aria-label='Re-validate key'>↻</StatusBtn>
          <StatusBtn onClick={handleToggleOpen} aria-expanded={open} aria-label='Toggle panel status' title={open ? 'Collapse status' : 'Expand status'}>{open ? '−' : '+'}</StatusBtn>
        </ActionBtnRow>
      </StatusTopRow>
      <StatusDetails data-open={open ? 'true' : 'false'}>
        <StatusDetailInner>
          {meta?.ctx ? <InfoStat label='Ctx' value={meta.ctx.toString()} /> : null}
          <InfoStat label='Session tokens' value={sessionTokens.toString()} />
          {!isNarrow && <InfoStat label='Model count' value={useAiConfigStore.getState().modelList[provider]?.length.toString()} />}
            {!isNarrow && <InfoStat label='Favorites' value={(useAiConfigStore.getState().favorites?.[provider]?.length || 0).toString()} />}
          {!isNarrow && <InfoStat label='Status' value={state} />}
        </StatusDetailInner>
      </StatusDetails>
    </StatusStripRoot>
  );
};


const DebugTrayWrap = styled.div`
  padding: 0 14px 8px;
`;

const PhaseStrip = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  opacity: 0.55;
`;

const StatusStripRoot = styled.div`
  border-bottom: none;
  background: transparent;
  padding: 4px 10px 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatusTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const KeyMetaGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  .syn-label { opacity: .7; }
  .syn-retry { font-size: 10px; color: var(--syn-status-warning, #d6a84f); }
  .syn-last { font-size: 10px; opacity: .55; }
`;

const KeyDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ActionBtnRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusBtn = styled.button`
  font-size: 11px;
  padding: 2px 7px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--syn-text-secondary, #a4adbb);
  cursor: pointer;
  line-height: 1.2;
  transition: background 140ms var(--syn-easing-bauhaus), color 140ms var(--syn-easing-bauhaus);
  &:hover { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 64%, transparent); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent); }
`;

const StatusDetails = styled.div`
  overflow: hidden;
  transition: max-height 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms 40ms;
  max-height: 0;
  opacity: 0;
  &[data-open='true'] { max-height: 120px; opacity: 1; }
`;

const StatusDetailInner = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 2px 2px 4px;
`;

interface MetaSubset { family?: string; tags?: string[]; ctx?: number | undefined }
const StatusPillWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 20px;
  background: transparent;
  max-width: 220px;
`;
const StatusPillLabel = styled.span`
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: .5px;
  opacity: .8;
`;
const StatusPillValue = styled.span`
  font-size: 11px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const StatusPill: React.FC<{ label: string; value: string; meta: MetaSubset | null }> = ({ label, value, meta }) => (
  <StatusPillWrap title={`${label}\n${value}${meta?.family ? `\nFamily: ${meta.family}` : ''}`}>
    <StatusPillLabel>{label}</StatusPillLabel>
    <StatusPillValue>{value}</StatusPillValue>
  </StatusPillWrap>
);

const MiniTagBase = styled.span<{ $subtle: boolean }>`
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 6px;
  background: ${({ $subtle }) => $subtle ? 'transparent' : 'color-mix(in srgb, var(--syn-surface-hover, #303642) 52%, transparent)'};
  border: none;
  letter-spacing: .5px;
  text-transform: uppercase;
  opacity: ${({ $subtle }) => $subtle ? 0.6 : 0.9};
`;
const MiniTag: React.FC<{ text: string; subtle?: boolean }> = ({ text, subtle = false }) => (
  <MiniTagBase $subtle={subtle}>{text}</MiniTagBase>
);

const InfoStatWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 70px;
`;
const InfoStatLabel = styled.span`
  font-size: 9px;
  letter-spacing: .5px;
  text-transform: uppercase;
  opacity: .55;
`;
const InfoStatValue = styled.span`
  font-size: 11px;
`;
const InfoStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <InfoStatWrap>
    <InfoStatLabel>{label}</InfoStatLabel>
    <InfoStatValue>{value}</InfoStatValue>
  </InfoStatWrap>
);


interface InfoBarProps { from?: string | null | undefined; to?: string | null | undefined; onClose?: () => void }
const InfoBarWrap = styled.div`
  border-bottom: none;
  background: transparent;
  padding: 6px 10px;
  font-size: 11px;
  display: flex;
  gap: 8px;
  align-items: center;
  .msg { opacity: .8; }
  button { margin-left: auto; font-size: 11px; opacity: .8; background: transparent; border: none; color: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--syn-interaction-focus-ring, #3794ff); outline-offset: 2px; }
`;
const InfoBar: React.FC<InfoBarProps> = ({ from, to, onClose }) => (
  <InfoBarWrap aria-live="polite">
    <span className="msg">Switching provider… {from ? `${from} → ` : ''}{to ?? 'next'}</span>
    <button onClick={onClose} aria-label="Dismiss" title="Dismiss">✕</button>
  </InfoBarWrap>
);


interface ErrorCardProps { message: string; onSwitch: () => void; onOpenLogs: () => void }
const ErrorCardWrap = styled.div`
  border: none;
  background: color-mix(in srgb, var(--syn-status-error, #f87171) 8%, transparent);
  padding: 10px 10px 8px;
  border-radius: 6px;
  font-size: 12px;
  margin: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  h4 { font-weight: 600; margin: 0; }
  .msg { opacity: .9; }
  .actions { display: flex; gap: 8px; }
`;
const ErrorActionBtn = styled.button`
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
  &:focus-visible { outline: none; box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent); }
`;
const ErrorCard: React.FC<ErrorCardProps> = ({ message, onSwitch, onOpenLogs }) => (
  <ErrorCardWrap role="alert">
    <h4>Streaming failed</h4>
    <div className="msg">{message}</div>
    <div className="actions">
      <ErrorActionBtn onClick={onSwitch}>Switch provider/model</ErrorActionBtn>
      <ErrorActionBtn onClick={onOpenLogs}>Open logs</ErrorActionBtn>
    </div>
  </ErrorCardWrap>
);



const SCOPE_OPTIONS: Array<{ value: 'selection' | 'file' | 'workspace' | 'pinned'; label: string }> = [
  { value: 'selection', label: 'Sel' },
  { value: 'file', label: 'File' },
  { value: 'workspace', label: 'WS' },
  { value: 'pinned', label: 'Pin' },
];

const ContextPreviewStrip: React.FC<{ ctxRef: React.MutableRefObject<BuiltContext | null> }> = ({ ctxRef }) => {
  const scope = useAiSettingsStore(s => s.context.scope);
  const includeDiagnostics = useAiSettingsStore(s => s.context.includeDiagnostics);
  const setContext = useAiSettingsStore(s => s.setContext);

  const activeTab = useEditorStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const severityCounts = useProblemsStore(s => s.severityCounts);
  const attachmentCount = useCtxAttachStore(s => s.items.length);

  const fileName = activeTab?.name || 'none';
  const hasSelection = !!(activeTab?.selections?.length && activeTab.selections[0]);
  const diagCount = severityCounts.error + severityCounts.warning;
  const lastTokens = ctxRef.current?.tokens;

  return (
    <CtxStrip aria-label="AI context summary">
      <CtxRow>
        <CtxGroup>
          <CtxLabel>scope</CtxLabel>
          {SCOPE_OPTIONS.map(opt => (
            <CtxToggleBtn
              key={opt.value}
              $active={scope === opt.value}
              onClick={() => setContext({ scope: opt.value })}
              title={`Set context scope to ${opt.value}`}
              aria-pressed={scope === opt.value}
            >
              {opt.label}
            </CtxToggleBtn>
          ))}
        </CtxGroup>
        <CtxGroup>
          <CtxLabel>file</CtxLabel>
          <CtxValue title={activeTab?.path || 'no active file'}>{fileName}</CtxValue>
          {hasSelection ? <CtxBadge title="Selection active">sel</CtxBadge> : null}
        </CtxGroup>
        <CtxGroup>
          <CtxToggleBtn
            $active={includeDiagnostics}
            onClick={() => setContext({ includeDiagnostics: !includeDiagnostics })}
            title={includeDiagnostics ? 'Remove diagnostics from context' : 'Include diagnostics in context'}
            aria-pressed={includeDiagnostics}
          >
            diag {diagCount > 0 ? `(${diagCount})` : '—'}
          </CtxToggleBtn>
        </CtxGroup>
        {attachmentCount > 0 && (
          <CtxGroup>
            <CtxBadge title={`${attachmentCount} artifact${attachmentCount !== 1 ? 's' : ''} attached`}>
              arts {attachmentCount}
            </CtxBadge>
          </CtxGroup>
        )}
        {lastTokens ? (
          <CtxGroup style={{ marginLeft: 'auto' }}>
            <CtxLabel>last ctx</CtxLabel>
            <CtxValue>{lastTokens.used}/{lastTokens.budget} tok</CtxValue>
          </CtxGroup>
        ) : null}
      </CtxRow>
    </CtxStrip>
  );
};

const CtxStrip = styled.div`
  border-bottom: none;
  padding: 4px 10px 5px;
  font-size: 10px;
  font-family: var(--font-mono);
  background: transparent;
`;

const CtxRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const CtxGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const CtxLabel = styled.span`
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: .5px;
  opacity: .5;
`;

const CtxValue = styled.span`
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: .85;
`;

const CtxBadge = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--syn-status-info, #6aa9ff);
  letter-spacing: .3px;
`;

const CtxToggleBtn = styled.button<{ $active: boolean }>`
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  border: none;
  background: ${({ $active }) => $active ? 'color-mix(in srgb, var(--syn-interaction-active, #3794ff) 10%, transparent)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--syn-interaction-active, #3794ff)' : 'var(--syn-text-secondary, #a4adbb)'};
  cursor: pointer;
  letter-spacing: .3px;
  transition: background 120ms, color 120ms;
  &:hover { background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 10%, transparent); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent);
  }
`;
