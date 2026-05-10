import { create } from 'zustand';

export type OutlineSymbolKind =
  | 'class'
  | 'function'
  | 'method'
  | 'property'
  | 'const'
  | 'let'
  | 'var'
  | 'interface'
  | 'type'
  | 'enum'
  | 'export'
  | 'import'
  | 'namespace'
  | 'heading';

export type OutlineExtractionSource = 'monaco' | 'heuristic' | 'none';

export type OutlineStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'unsupported' | 'error';

export interface OutlineRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface OutlineSymbol {
  id: string;
  name: string;
  kind: OutlineSymbolKind;
  range: OutlineRange;
  selectionRange: OutlineRange;
  source: OutlineExtractionSource;
  detail?: string;
  children?: OutlineSymbol[];
}

export interface OutlineEntry {
  tabId: string;
  path: string;
  language: string;
  status: OutlineStatus;
  source: OutlineExtractionSource;
  symbols: OutlineSymbol[];
  updatedAt: string;
  message: string;
}

interface OutlineStore {
  byTabId: Record<string, OutlineEntry>;
  markLoading: (tabId: string, meta: { path: string; language: string }) => void;
  setEntry: (entry: OutlineEntry) => void;
  setError: (tabId: string, meta: { path: string; language: string; message: string }) => void;
}

export const MAX_OUTLINE_ENTRIES = 40;

const nowIso = () => new Date().toISOString();

function capOutlineEntries(entries: Record<string, OutlineEntry>): Record<string, OutlineEntry> {
  const pairs = Object.entries(entries);
  if (pairs.length <= MAX_OUTLINE_ENTRIES) return entries;
  return Object.fromEntries(
    pairs
      .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_OUTLINE_ENTRIES)
  );
}

export function flattenOutlineSymbols(symbols: OutlineSymbol[]): OutlineSymbol[] {
  const out: OutlineSymbol[] = [];
  const visit = (items: OutlineSymbol[]) => {
    items.forEach(symbol => {
      out.push(symbol);
      if (symbol.children?.length) visit(symbol.children);
    });
  };
  visit(symbols);
  return out;
}

export const useOutlineStore = create<OutlineStore>()(set => ({
  byTabId: {},
  markLoading: (tabId, meta) =>
    set(state => ({
      byTabId: capOutlineEntries({
        ...state.byTabId,
        [tabId]: {
          tabId,
          path: meta.path,
          language: meta.language,
          status: 'loading',
          source: state.byTabId[tabId]?.source ?? 'none',
          symbols: state.byTabId[tabId]?.symbols ?? [],
          updatedAt: nowIso(),
          message: 'Reading active editor symbols.',
        },
      }),
    })),
  setEntry: entry =>
    set(state => ({
      byTabId: capOutlineEntries({
        ...state.byTabId,
        [entry.tabId]: entry,
      }),
    })),
  setError: (tabId, meta) =>
    set(state => ({
      byTabId: capOutlineEntries({
        ...state.byTabId,
        [tabId]: {
          tabId,
          path: meta.path,
          language: meta.language,
          status: 'error',
          source: 'none',
          symbols: [],
          updatedAt: nowIso(),
          message: meta.message,
        },
      }),
    })),
}));
