import { backupCorrupt, remove, safeGet, safeSet } from '@/utils/storage';

const DRAFT_KEY_V1 = 'synapse.chatDraft.v1';
const HIST_KEY_V1  = 'synapse.chatHistory.v1';

export const DRAFT_KEY_V2 = 'synapse.chatDraft.v2';
export const HIST_KEY_V2  = 'synapse.chatHistory.v2';

export type ChatRole = 'system' | 'user' | 'assistant';
export type ChatMsg = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
  provider?: string;
  model?: string;
};

export type DraftV2 = { version: 2; updatedAt: number; text: string };
export type HistoryV2 = { version: 2; updatedAt: number; messages: ChatMsg[] };

const MAX_BYTES = 2 * 1024 * 1024;
const DEBOUNCE_MS = 300;

let draftTimer: number | null = null;
let histTimer: number | null = null;

function normalizeProvider(provider: unknown): string | undefined {
  if (typeof provider !== 'string' || !provider.trim()) return undefined;
  const p = provider.trim().toLowerCase();
  if (p === 'google') return 'gemini';
  return p;
}

function normalizeRole(role: unknown): ChatRole {
  return role === 'user' || role === 'assistant' || role === 'system' ? role : 'assistant';
}

function toDraftV2(input: unknown): DraftV2 {
  const v = (input && typeof input === 'object') ? (input as Partial<DraftV2>) : {};
  return {
    version: 2,
    updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
    text: typeof v.text === 'string' ? v.text : '',
  };
}

function toHistoryV2(input: unknown): HistoryV2 {
  const v = (input && typeof input === 'object') ? (input as Partial<HistoryV2> & { messages?: any[] }) : {};
  const source = Array.isArray(v.messages) ? v.messages : [];
  const messages: ChatMsg[] = source.map((m: any, i) => {
    const provider = normalizeProvider(m?.provider);
    const model = typeof m?.model === 'string' ? m.model : undefined;
    return {
      id: typeof m?.id === 'string' ? m.id : `restored-${i}`,
      role: normalizeRole(m?.role),
      content: typeof m?.content === 'string' ? m.content : String(m?.content ?? ''),
      ts: typeof m?.ts === 'number' ? m.ts : Date.now(),
      ...(provider ? { provider } : {}),
      ...(model ? { model } : {}),
    };
  });
  return {
    version: 2,
    updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
    messages,
  };
}

export function validateDraft(v: any): v is DraftV2 {
  return v && v.version === 2 && typeof v.updatedAt === 'number' && typeof v.text === 'string';
}
export function validateHistory(v: any): v is HistoryV2 {
  if (!v || v.version !== 2 || typeof v.updatedAt !== 'number' || !Array.isArray(v.messages)) return false;
  return v.messages.every((m: any) =>
    m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant' || m.role === 'system')
    && typeof m.content === 'string' && typeof m.ts === 'number'
  );
}

export function migrateV1toV2() {

  const d1 = safeGet<string>(DRAFT_KEY_V1);
  if (!safeGet(DRAFT_KEY_V2).ok && d1.ok) {
    const v2: DraftV2 = toDraftV2({ version: 2, updatedAt: Date.now(), text: d1.value || '' });
    safeSet(DRAFT_KEY_V2, v2);
    remove(DRAFT_KEY_V1);
  }

  const h1 = safeGet<any[]>(HIST_KEY_V1);
  if (!safeGet(HIST_KEY_V2).ok && h1.ok) {
    const v2: HistoryV2 = toHistoryV2({ version: 2, updatedAt: Date.now(), messages: h1.value || [] });
    safeSet(HIST_KEY_V2, v2);
    remove(HIST_KEY_V1);
  }
}


export function pruneToSize(v: HistoryV2): HistoryV2 {
  let json = JSON.stringify(v);
  if (json.length <= MAX_BYTES) return v;
  const copy: HistoryV2 = { ...v, messages: [...v.messages] };
  while (copy.messages.length > 0 && json.length > MAX_BYTES) {
    copy.messages.shift();
    json = JSON.stringify(copy);
  }
  return copy;
}

export function loadDraft(): DraftV2 | null {
  const res = safeGet<unknown>(DRAFT_KEY_V2);
  if (!res.ok) {
    if (res.error === 'parse') backupCorrupt(DRAFT_KEY_V2, (res as any).raw);
    return null;
  }
  return validateDraft(res.value) ? toDraftV2(res.value) : null;
}

export function loadHistory(): HistoryV2 | null {
  const res = safeGet<unknown>(HIST_KEY_V2);
  if (!res.ok) {
    if (res.error === 'parse') backupCorrupt(HIST_KEY_V2, (res as any).raw);
    return null;
  }
  return validateHistory(res.value) ? toHistoryV2(res.value) : null;
}


export function saveDraftDebounced(text: string) {
  if (draftTimer) window.clearTimeout(draftTimer);
  draftTimer = window.setTimeout(() => {
    const v2: DraftV2 = { version: 2, updatedAt: Date.now(), text };
    safeSet(DRAFT_KEY_V2, v2);
  }, DEBOUNCE_MS);
}

export function saveHistoryDebounced(messages: ChatMsg[]) {
  if (histTimer) window.clearTimeout(histTimer);
  histTimer = window.setTimeout(() => {
    let v2: HistoryV2 = { version: 2, updatedAt: Date.now(), messages };
    v2 = pruneToSize(v2);
    const res = safeSet(HIST_KEY_V2, v2);
    if (!(res as any).ok) {

      const drop = Math.max(1, Math.floor(v2.messages.length * 0.1));
      v2.messages = v2.messages.slice(drop);
      v2.updatedAt = Date.now();
      safeSet(HIST_KEY_V2, v2);
    }
  }, DEBOUNCE_MS);
}


export function subscribeStorage(onNewDraft: (d: DraftV2) => void, onNewHistory: (h: HistoryV2) => void) {
  function onStorage(e: StorageEvent) {
    if (!e.key || e.newValue == null) return;
    if (e.key === DRAFT_KEY_V2) {
      try {
        const d = JSON.parse(e.newValue);
        if (validateDraft(d)) onNewDraft(d);
      } catch {}
    } else if (e.key === HIST_KEY_V2) {
      try {
        const h = JSON.parse(e.newValue);
        if (validateHistory(h)) onNewHistory(h);
      } catch {}
    }
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
