/**
 * Urban Analytics Workbench — Core Zustand Store
 *
 * Urban analytics domain types (Card, SectionId, UrbanTag).
 */

import { create } from 'zustand';
import type { SectionId, UrbanTag } from './lib/types';
import { resolveSectionFilter, SECTION_TREE } from './lib/sectionHierarchy';

// ---------------------------------------------------------------------------
// Card lite type & library holder
// ---------------------------------------------------------------------------

interface UrbanCardLite {
  id: string;
  title?: string;
  sectionId?: string;
  summary?: string;
  tags?: string[];
}

let __urbanLibrary: UrbanCardLite[] | null = null;

/** Inject the full card library (called once on modal mount). */
export function __setUrbanLibrary(lib: UrbanCardLite[]) {
  __urbanLibrary = lib;
}

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

export function parseQuery(q: string): string[] {
  return (q || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => tok.trim());
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export interface FilterInput {
  library: UrbanCardLite[];
  section: string;
  tokens: string[];
  tags: Set<string>;
  favOnly: boolean;
  favorites: Set<string>;
}

export function filterCards(inp: FilterInput): UrbanCardLite[] {
  const { library, section, tokens, tags, favOnly, favorites } = inp;
  const allowed = resolveSectionFilter(section === 'all' ? 'all' : section);

  return library.filter((c) => {
    const sid = (c.sectionId || '').toLowerCase();

    if (section !== 'all') {
      if (allowed.length) {
        if (!allowed.includes(c.sectionId as SectionId)) return false;
      } else if (sid !== section.toLowerCase()) return false;
    }

    if (favOnly && !favorites.has(c.id)) return false;

    const ctags = Array.isArray(c.tags) ? c.tags.map((t) => t.toLowerCase()) : [];
    if (tags.size && ![...tags].every((t) => ctags.includes(t))) return false;

    if (!tokens.length) return true;

    const hay = `${c.title || ''} ${c.summary || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
    return tokens.every((tok) => {
      if (tok.startsWith('tag:')) return ctags.includes(tok.slice(4));
      if (tok.startsWith('section:')) return sid.includes(tok.slice(8));
      if (tok === 'is:fav') return favorites.has(c.id);
      return hay.includes(tok);
    });
  });
}

// ---------------------------------------------------------------------------
// Recommendation ranking
// ---------------------------------------------------------------------------

function rankRecommended(
  cards: UrbanCardLite[],
  favorites: Set<string>,
  recent: string[],
): UrbanCardLite[] {
  if (!cards.length) return cards;

  const favTags = new Set<string>();
  for (const id of favorites) {
    const c = cards.find((x) => x.id === id);
    if (c && Array.isArray(c.tags)) c.tags.forEach((t) => favTags.add(t.toLowerCase()));
  }

  const recIndex = new Map<string, number>();
  recent.forEach((id, idx) => recIndex.set(id, recent.length - idx));

  const scored = cards.map((c) => {
    let s = 0;
    if (Array.isArray(c.tags)) for (const t of c.tags) if (favTags.has(t.toLowerCase())) s += 2;
    if ((recIndex.get(c.id) || 0) > 0) s += 1;
    return { ...c, recScore: s } as UrbanCardLite & { recScore: number };
  });

  scored.sort((a, b) => b.recScore - a.recScore || (a.title || '').localeCompare(b.title || ''));
  return scored;
}

// ---------------------------------------------------------------------------
// LocalStorage persistence helpers
// ---------------------------------------------------------------------------

const NAV_PREFIX = 'urban.nav.';

function navLoad<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NAV_PREFIX + k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function navSave(k: string, v: unknown) {
  try {
    localStorage.setItem(NAV_PREFIX + k, JSON.stringify(v));
  } catch {
    /* quota exceeded — ignore */
  }
}

// ---------------------------------------------------------------------------
// Memoisation cache
// ---------------------------------------------------------------------------

interface MemoSig {
  key: string;
  cards: UrbanCardLite[];
  counts: Record<string, number>;
  recScores: Map<string, number>;
}

let _navMemo: MemoSig | null = null;

function buildSignature(args: {
  library: UrbanCardLite[];
  section: string;
  q: string;
  tags: Set<string>;
  favOnly: boolean;
  rec: boolean;
  favsKey: string;
  recentKey: string;
}): string {
  return [
    args.library.length,
    args.section,
    args.q,
    [...args.tags].sort().join(','),
    args.favOnly ? 1 : 0,
    args.rec ? 1 : 0,
    args.favsKey,
    args.recentKey,
  ].join('|');
}

// ---------------------------------------------------------------------------
// Store state type
// ---------------------------------------------------------------------------

export interface UrbanStoreState {
  // core UI
  isOpen: boolean;
  query: string;
  section: SectionId;
  selectedCardId: string | null;

  // filters
  activeTags: Set<UrbanTag>;
  favOnly: boolean;
  recMode: boolean;

  // persisted lists
  favorites: string[];
  recentlyViewedIds: string[];

  // UI prefs
  drawerWidth: number;

  // derived
  visibleCards: () => UrbanCardLite[];
  sectionCounts: () => Record<string, number>;
  getRecScore: (id: string) => number;

  // actions — lifecycle
  open: () => void;
  close: () => void;

  // actions — navigation
  setQuery: (q: string) => void;
  setSection: (s: SectionId) => void;
  selectCard: (id: string | null) => void;
  clearSelection: () => void;

  // actions — filters
  toggleTag: (tag: UrbanTag) => void;
  clearTags: () => void;
  toggleFav: (id: string) => void;
  toggleFavOnly: () => void;
  toggleRecMode: () => void;
  setRecMode: (enabled: boolean) => void;
  navClearFilters: () => void;

  // actions — UI
  setDrawerWidth: (w: number) => void;

  // record
  recordView: (cardId: string) => void;

  // selected card accessor
  getSelectedCard: () => UrbanCardLite | null;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useUrbanStore = create<UrbanStoreState>((set, get) => ({
  // --- initial state ---
  isOpen: false,
  query: navLoad('query', ''),
  section: navLoad<SectionId>('section', 'all'),
  selectedCardId: navLoad<string | null>('selectedCardId', null),

  activeTags: new Set<UrbanTag>(navLoad<UrbanTag[]>('tags', [])),
  favOnly: navLoad('favOnly', false),
  recMode: navLoad('recMode', false),

  favorites: navLoad<string[]>('favorites', []),
  recentlyViewedIds: navLoad<string[]>('recent', []),

  drawerWidth: navLoad('drawerWidth', 460),

  // --- derived ---

  visibleCards: () => {
    const state = get();
    if (!__urbanLibrary) return [];

    const library = __urbanLibrary;
    const favorites = new Set<string>(state.favorites);
    const tokens = parseQuery(state.query);

    const sig = buildSignature({
      library,
      section: state.section,
      q: state.query.trim().toLowerCase(),
      tags: state.activeTags as Set<string>,
      favOnly: state.favOnly,
      rec: state.recMode,
      favsKey: [...favorites].join(','),
      recentKey: state.recentlyViewedIds.join(','),
    });

    if (_navMemo && _navMemo.key === sig) return _navMemo.cards;

    const base = filterCards({
      library,
      section: state.section,
      tokens,
      tags: state.activeTags as Set<string>,
      favOnly: state.favOnly,
      favorites,
    });

    const ranked = state.recMode
      ? rankRecommended(base, favorites, state.recentlyViewedIds)
      : base.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    const counts: Record<string, number> = { all: 0 };
    for (const c of base) {
      counts.all++;
      const sid = c.sectionId || 'other';
      counts[sid] = (counts[sid] || 0) + 1;
    }

    const recScores = new Map<string, number>();
    for (const c of ranked) {
      const maybeScore = (c as Partial<{ recScore: number }>).recScore;
      recScores.set(c.id, typeof maybeScore === 'number' ? maybeScore : 0);
    }

    _navMemo = { key: sig, cards: ranked, counts, recScores };
    return ranked;
  },

  sectionCounts: () => {
    const state = get();
    state.visibleCards(); // ensure memo is fresh
    const base = _navMemo?.counts || { all: 0 };

    // Aggregate child counts into group totals
    const agg: Record<string, number> = { ...base };
    for (const group of SECTION_TREE) {
      if (group.children) {
        agg[group.id] = group.children.reduce(
          (sum, kid) => sum + (base[kid.id] || 0),
          0,
        );
      }
    }
    return agg;
  },

  getRecScore: (id: string) => {
    get().visibleCards(); // ensure memo
    return _navMemo?.recScores.get(id) || 0;
  },

  getSelectedCard: () => {
    const id = get().selectedCardId;
    if (!id) return null;
    return (__urbanLibrary ?? []).find((c) => c.id === id) || null;
  },

  // --- actions ---

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  setQuery: (query) => {
    set({ query });
    navSave('query', query);
  },

  setSection: (section) => {
    set({ section });
    navSave('section', section);
  },

  selectCard: (id) => {
    set((s) => {
      if (s.selectedCardId === id) return s;
      const ru = id
        ? [id, ...s.recentlyViewedIds.filter((r) => r !== id)].slice(0, 20)
        : s.recentlyViewedIds;
      navSave('selectedCardId', id);
      navSave('recent', ru);
      return { selectedCardId: id, recentlyViewedIds: ru };
    });
  },

  clearSelection: () => {
    set({ selectedCardId: null });
    navSave('selectedCardId', null);
  },

  toggleTag: (tag) => {
    set((s) => {
      const next = new Set(s.activeTags);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      navSave('tags', [...next]);
      return { activeTags: next };
    });
  },

  clearTags: () => {
    set({ activeTags: new Set() });
    navSave('tags', []);
  },

  toggleFav: (id) => {
    set((s) => {
      const has = s.favorites.includes(id);
      const favorites = has ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites];
      navSave('favorites', favorites);
      return { favorites };
    });
  },

  toggleFavOnly: () => {
    set((s) => {
      const v = !s.favOnly;
      navSave('favOnly', v);
      return { favOnly: v };
    });
  },

  toggleRecMode: () => {
    set((s) => {
      const v = !s.recMode;
      navSave('recMode', v);
      return { recMode: v };
    });
  },

  setRecMode: (enabled) => {
    set(() => {
      navSave('recMode', enabled);
      return { recMode: enabled };
    });
  },

  navClearFilters: () => {
    navSave('query', '');
    navSave('tags', []);
    navSave('favOnly', false);
    set({ query: '', activeTags: new Set(), favOnly: false });
  },

  setDrawerWidth: (w) => {
    set({ drawerWidth: w });
    navSave('drawerWidth', w);
  },

  recordView: (cardId) => {
    set((s) => {
      if (s.recentlyViewedIds[0] === cardId) return s;
      const nextList = [cardId, ...s.recentlyViewedIds.filter((i) => i !== cardId)].slice(0, 20);
      navSave('recent', nextList);
      return { recentlyViewedIds: nextList };
    });
  },
}));

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------

export const selectSelectedCardId = (s: UrbanStoreState) => s.selectedCardId;
export const selectSelectedCard = (s: UrbanStoreState) => s.getSelectedCard();

export const useSelectedCardId = () => useUrbanStore(selectSelectedCardId);
export const useSelectedCard = () => useUrbanStore(selectSelectedCard);
