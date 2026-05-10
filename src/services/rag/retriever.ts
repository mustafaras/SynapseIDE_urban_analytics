import type { Result, SearchFilters } from './types';
import { HybridIndex } from './index';
import { getAdapter } from '@/services/ai/adapters/index';
import {
  matchTopics,
  renderBuiltInCorpusDocument,
  searchBuiltInCorpus,
} from './corpus';

export async function retrieve(idx: HybridIndex, query: string, k = 8, filters?: SearchFilters, rerank?: { provider: 'openai' | 'anthropic' | 'gemini'; model: string }): Promise<Result[]> {
  const topics = matchTopics(query, 3);
  const expandedQuery = topics.length
    ? `${query} ${topics.flatMap(t => t.keywords.slice(0, 3)).join(' ')}`
    : query;
  const base = idx.search(expandedQuery, Math.max(16, k * 2), filters);
  const combined = mergeResults(base, materializeBuiltInCorpusResults(query, k));
  if (!rerank) return combined.slice(0, k);
  try {
    const adapter = getAdapter(rerank.provider as any);
    const prompt = [
      'Score the relevance of each snippet to the query from 0 to 1.',
      `Query: ${query}`,
      ...combined.map((r, i) => `#${i + 1} (${r.chunk.path}:${r.chunk.fromLine}-${r.chunk.toLine})\n${r.chunk.text.slice(0, 800)}`),
    ].join('\n\n');
  const { text } = await adapter.complete({ options: { model: rerank.model } as any, messages: [{ role: 'user', content: prompt } as any], timeoutMs: 8000 });
    const scores = parseScores(text || '');
    const ranked = combined.map((r, i) => ({ r, s: scores[i] ?? r.score }));
    ranked.sort((a, b) => b.s - a.s);
    return ranked.slice(0, k).map(x => x.r);
  } catch {
    return combined.slice(0, k);
  }
}

function parseScores(t: string) {
  const m = [...t.matchAll(/(\d+)\)\s*(0\.\d+|1(?:\.0+)?)/g)].map(x => ({ i: parseInt(x[1] || '0', 10) - 1, s: parseFloat(x[2] || '0') }));
  const arr: number[] = [];
  m.forEach(o => arr[o.i] = o.s);
  return arr;
}

function materializeBuiltInCorpusResults(query: string, k: number): Result[] {
  return searchBuiltInCorpus(query, Math.max(2, Math.ceil(k / 2))).map(({ document, score }) => {
    const text = renderBuiltInCorpusDocument(document);
    const lines = text.split('\n').length;
    return {
      chunk: {
        id: `builtin:${document.id}`,
        path: `builtin://corpus/${document.id}`,
        lang: 'md',
        fromLine: 1,
        toLine: lines,
        text,
        tokens: text.split(/\s+/).filter(Boolean).length,
        hash: document.id,
      },
      score,
      bm25: score,
      cosine: score,
    };
  });
}

function mergeResults(primary: Result[], secondary: Result[]): Result[] {
  const merged = new Map<string, Result>();
  for (const candidate of [...primary, ...secondary]) {
    const key = `${candidate.chunk.path}:${candidate.chunk.fromLine}-${candidate.chunk.toLine}`;
    const existing = merged.get(key);
    if (!existing || existing.score < candidate.score) {
      merged.set(key, candidate);
    }
  }
  return [...merged.values()].sort((left, right) => right.score - left.score);
}
