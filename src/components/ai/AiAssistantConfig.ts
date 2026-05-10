


export type ProviderId = 'openai' | 'anthropic' | 'ollama' | string;

export type QuickPrompt = { id: string; label: string; prompt: string };
export type ModelInfo = { id: string; label: string; provider: ProviderId };

export const aiModels: ModelInfo[] = [
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai' },
  { id: 'gpt-5', label: 'GPT-5', provider: 'openai' },
  { id: 'gpt-5-nano', label: 'GPT-5 Nano', provider: 'openai' },
  { id: 'claude-4-sonnet', label: 'Claude 4 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', provider: 'gemini' },
  { id: 'llama3.1', label: 'Llama 3.1 (Ollama)', provider: 'ollama' },
];

export const quickPrompts: QuickPrompt[] = [
  { id: 'explain', label: 'Explain this code', prompt: 'Explain the following code step by step:' },
  { id: 'improve', label: 'Improve readability', prompt: 'Refactor to improve readability without changing behavior:' },
  { id: 'walkability', label: 'Analyze walkability', prompt: 'Perform a 15-minute city walkability analysis for the study area using osmnx and pandana.' },
  { id: 'ndvi', label: 'Compute NDVI', prompt: 'Write a Python script to compute NDVI from Sentinel-2 B4/B8 bands using rasterio.' },
  { id: 'moran', label: "Run Moran's I", prompt: "Perform spatial autocorrelation analysis (Global + Local Moran's I) on the selected variable." },
  { id: 'network', label: 'Network centrality', prompt: 'Compute betweenness and closeness centrality for the street network using osmnx + networkx.' },
  { id: 'spatial_sql', label: 'Spatial SQL query', prompt: 'Write a DuckDB spatial SQL query for the loaded datasets.' },
];


export function estimateTokens(text: string): number {
  const s = String(text || '');
  return Math.max(1, Math.ceil(s.length / 4));
}

export type StoredMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; ts?: number };


export function buildSummaryRequestPayload(t: { messages: StoredMessage[]; [k: string]: any }) {
  const messages = Array.isArray(t?.messages) ? t.messages : [];
  const keepTailFromIndex = Math.max(0, messages.length - 10 - 0);
  const system = 'Please compress prior conversation into a concise project brief.';
  const user = 'Summarize the following prior dialogue focusing on user intent and constraints.';
  return { keepTailFromIndex, system, user };
}


export function selectRecentForBudget(messages: StoredMessage[], baseTokens: number, budget: number, margin: number): StoredMessage[] {
  const out: StoredMessage[] = [];
  let acc = baseTokens;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const cost = estimateTokens(`[${m.role}] ${m.content}\n`);
    if (acc + cost > budget - margin) break;
    out.push(m);
    acc += cost;
  }
  return out.reverse();
}

export function notify(level: 'success' | 'info' | 'warning' | 'error' | string, message: string) {
  try {

    (window as any)?.telemetry?.emit?.({ type: 'notify', level, message });


    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log']('[notify]', level, message);
  } catch {

  }
}


export function sanitizeHtmlForPreview(html: string, _opts?: any): string {
  return String(html ?? '');
}


export function computeSanitizeDiff(before: string, after: string): string {
  const a = String(before ?? '').split('\n');
  const b = String(after ?? '').split('\n');
  const max = Math.max(a.length, b.length);
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    const l = a[i];
    const r = b[i];
    if (l === r) out.push(` ${  l ?? ''}`);
    else {
      if (typeof l !== 'undefined') out.push(`-${  l}`);
      if (typeof r !== 'undefined') out.push(`+${  r}`);
    }
  }
  return out.join('\n');
}

export function buildSystemPrompt(opts: { mode: 'beginner' | 'pro'; preset: any; pinnedContext?: string[] }) {
  const ctx = (opts.pinnedContext || []).join('\n');
  if (opts.mode === 'beginner') {
    return `You are a patient urban analytics mentor. Explain geospatial concepts clearly, provide step-by-step guidance, and relate methods to real-world urban planning outcomes. When suggesting Python code, include inline comments explaining each step.\n\nYou are an expert urban analytics AI assistant integrated into a spatial analysis workbench. Your expertise spans GIS, remote sensing, transport planning, spatial statistics, SDG 11 indicators, and the Python geospatial stack (geopandas, osmnx, pysal, rasterio, folium). Cite methodological sources. Specify CRS considerations. Include uncertainty qualifications. Follow FAIR data principles. Consider equity and environmental justice. Provide reproducible Python code.\n${ctx}`.trim();
  }
  return `PLAN:\n- Analyse the urban analytics request and identify spatial, statistical, and data requirements.\n- Propose methodology with references to established techniques.\n- List impacted files, datasets, and CRS considerations.\nFILES:\n- Enumerate files to create or modify.\n\nYou are an expert urban analytics AI assistant. Your expertise spans GIS, remote sensing, transport planning, spatial statistics, SDG 11 indicators, VoxCity simulation, and the Python geospatial stack. Cite sources. Specify CRS. Provide reproducible code.\n${ctx}`.trim();
}

export function buildSystemPromptV2(opts: { mode: 'beginner' | 'pro'; pinnedContext?: string[]; projectBrief?: string }) {
  const ctx = (opts.pinnedContext || []).join('\n');
  const brief = opts.projectBrief ? `PROJECT:\n${opts.projectBrief}\n` : '';
  if (opts.mode === 'beginner') {
    return { systemPrompt: `You are a patient urban analytics mentor. Explain geospatial concepts clearly. Relate methods to urban planning outcomes. Cite sources e.g. (Hillier & Hanson 1984), (Anselin 1995). Specify CRS considerations. Include uncertainty qualifications. Provide reproducible Python code with the geospatial stack (geopandas, osmnx, pysal, rasterio, folium).\n${brief}${ctx}`.trim() };
  }
  return {
    systemPrompt: `PLAN:\n- Analyse the urban analytics request — identify spatial, statistical, and data requirements.\n- Propose methodology with peer-reviewed references.\n- List impacted files, datasets, CRS, and classification schemes.\nFILES:\n- Enumerate files to create or modify.\n\nYou are an expert urban analytics AI assistant. GIS, remote sensing, transport, spatial statistics, SDG 11, VoxCity, Python geospatial stack. Cite sources. CRS-aware. Reproducible.\n${brief}${ctx}`.trim(),
  };
}

export function classifyProviderError(err: unknown): { retryable: boolean; type: 'rate_limit' | 'server' | 'auth' | 'network' | 'unknown'; status?: number } {
  const msg = String((err as any)?.message || err || '');
  const statusMatch = msg.match(/\b(\d{3})\b/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
  if (/429|Too Many Requests/i.test(msg)) return { retryable: true, type: 'rate_limit', status: 429 } as const;
  if (/500|Server error/i.test(msg)) return { retryable: true, type: 'server', status: 500 } as const;
  if (/401|Unauthorized/i.test(msg)) return { retryable: false, type: 'auth', status: 401 } as const;
  if (/Failed to fetch|Network|ECONN|ENET|EAI_AGAIN/i.test(msg) || (err as any)?.name === 'AbortError') {
    const base = { retryable: true, type: 'network' as const };
    return typeof status === 'number' ? { ...base, status } : base;
  }
  const base = { retryable: false, type: 'unknown' as const };
  return typeof status === 'number' ? { ...base, status } : base;
}

export function selectFallbackModel(current: string, provider: ProviderId): string | null {
  const choices = aiModels.filter(m => (provider === 'auto' ? m.provider === 'openai' : m.provider === provider));
  const alt = choices.find(m => m.id !== current) || choices[0];
  return alt ? alt.id : null;
}
