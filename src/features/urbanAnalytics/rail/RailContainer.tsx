/**
 * Urban Analytics Workbench — Left Rail Container
 *
 * Full left-sidebar navigation with:
 *   • Search bar (Fuse.js fuzzy search)
 *   • Collapsible section tree (SECTION_TREE)
 *   • Tag filter grid (TAG_GROUPS)
 *   • Favorites toggle
 *   • Section dropdown filter
 *   • Error boundary, loading skeleton, empty state
 *
 * Architecture mirrors the original rail/RailContainer.tsx
 * but uses urban domain types and the urban Zustand store.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Fuse from 'fuse.js';
import { resolveSectionFilter, SECTION_TREE, type SectionTreeNode } from '../lib/sectionHierarchy';
import { TAG_GROUPS } from '../lib/tagGroups';
import { useUrbanStore } from '../store';
import { useUrbanContextSummary } from '../useUrbanContextStore';
import type {
  Card,
  UrbanMethodCapabilityStatus,
  UrbanMethodMaturityLevel,
  UrbanScale,
} from '../lib/types';

import './rail.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RailContainerProps {
  cards: Card[];
  favorites: Record<string, true>;
  toggleFavorite(id: string): void;
  onSelectCard(id: string): void;
  selectedCardId?: string;
  activeTags: string[];
  onToggleTag(tag: string): void;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const LS_KEY = 'urban/rail:v1';

interface PersistedState {
  width: number;
  collapsed: string[];
}

function loadPersist(): PersistedState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch { /* ignore */ }
  return { width: 460, collapsed: [] };
}

function savePersist(next: PersistedState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* quota */ }
}

// ---------------------------------------------------------------------------
// Metadata config constants (used in both RailContainer and RailItemMeta)
// ---------------------------------------------------------------------------

const CAP_STATUS_CONFIG: Record<UrbanMethodCapabilityStatus, { color: string; label: string }> = {
  implemented:           { color: '#22c55e', label: 'implemented' },
  demo_mode:             { color: '#f59e0b', label: 'demo' },
  residual_gap:          { color: '#ef4444', label: 'gap' },
  environment_dependent: { color: '#38bdf8', label: 'env-dep' },
  deferred:              { color: 'rgba(255,255,255,0.28)', label: 'deferred' },
};

const MATURITY_SHORT: Record<UrbanMethodMaturityLevel, string | null> = {
  reference:    'ref',
  established:  'est',
  emerging:     'emrg',
  experimental: 'exp',
  teaching:     'teach',
  unknown:      null,
};

const SCALE_SHORT: Record<UrbanScale, string> = {
  parcel:       'Parcel',
  block:        'Block',
  neighborhood: 'Nbhd',
  district:     'District',
  city:         'City',
  metropolitan: 'Metro',
  regional:     'Regional',
  national:     'National',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RailContainer: React.FC<RailContainerProps> = (props) => {
  const {
    cards,
    favorites,
    toggleFavorite,
    onSelectCard,
    selectedCardId,
    activeTags,
    onToggleTag,
  } = props;

  // ── persisted collapse state ──
  const persistRef = useRef<PersistedState>(loadPersist());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(persistRef.current.collapsed),
  );

  useLayoutEffect(() => {
    persistRef.current.collapsed = Array.from(collapsedGroups);
    savePersist(persistRef.current);
  }, [collapsedGroups]);

  // ── store bindings ──
  const query = useUrbanStore((s) => s.query);
  const setQuery = useUrbanStore((s) => s.setQuery);

  // ── section filter ──
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const id = d.id as string | undefined;
      if (!id) return;
      for (const parent of SECTION_TREE) {
        if (parent.children?.some((ch) => ch.id === id)) {
          setSectionFilter(parent.id);
          return;
        }
      }
      if (SECTION_TREE.some((p) => p.id === id)) setSectionFilter(id);
    };
    window.addEventListener('urban:section:set', handler);
    return () => window.removeEventListener('urban:section:set', handler);
  }, []);

  // ── context (for project-aware ranking) ──
  const ctxSummary = useUrbanContextSummary();

  // ── search ──
  const fuse = useMemo(
    () =>
      new Fuse(cards, {
        keys: [
          { name: 'title', weight: 0.8 },
          { name: 'tags', weight: 0.2 },
          { name: 'summary', weight: 0.1 },
          { name: 'methodology', weight: 0.08 },
          { name: 'tools', weight: 0.06 },
          { name: 'datasets', weight: 0.06 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [cards],
  );

  const normalizedQ = query.trim();
  const baseFiltered: Card[] = normalizedQ
    ? (fuse.search(normalizedQ) as Array<{ item: Card }>).map((r) => r.item)
    : cards;

  // ── section filtering ──
  const sectionLeafIds = useMemo(
    () => resolveSectionFilter(sectionFilter),
    [sectionFilter],
  );

  const filteredAfterSection = sectionLeafIds.length
    ? baseFiltered.filter((c) => {
        const sid = c.sectionId;
        return sid ? sectionLeafIds.includes(sid) : false;
      })
    : baseFiltered;

  // ── tag filtering ──
  const [filtersEnabled, setFiltersEnabled] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // ── metadata filter state ──
  const [metaExpanded, setMetaExpanded] = useState(false);
  const [filterScales, setFilterScales] = useState<Set<UrbanScale>>(new Set());
  const [filterMaturity, setFilterMaturity] = useState<Set<UrbanMethodMaturityLevel>>(new Set());
  const [filterCapStatus, setFilterCapStatus] = useState<Set<UrbanMethodCapabilityStatus>>(new Set());

  const toggleMetaFilter = useCallback(<T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }, []);

  const hasMetaFilters = filterScales.size > 0 || filterMaturity.size > 0 || filterCapStatus.size > 0;

  const clearMetaFilters = useCallback(() => {
    setFilterScales(new Set());
    setFilterMaturity(new Set());
    setFilterCapStatus(new Set());
  }, []);

  const tagFiltered =
    filtersEnabled && activeTags.length
      ? filteredAfterSection.filter((c) => {
          const ct = c.tags as string[];
          return activeTags.every((t) => ct.includes(t));
        })
      : filteredAfterSection;

  // ── metadata filtering ──
  const metaFiltered = useMemo(() => {
    if (!filtersEnabled || !hasMetaFilters) return tagFiltered;
    return tagFiltered.filter((c) => {
      const env = c.validityEnvelope;
      // Cards without envelope pass metadata filters (unknown = not excluded)
      if (!env) return true;
      if (filterScales.size > 0) {
        const cardScales = env.validSpatialScales;
        if (!cardScales.some((s) => filterScales.has(s))) return false;
      }
      if (filterMaturity.size > 0) {
        if (!filterMaturity.has(env.maturityLevel)) return false;
      }
      if (filterCapStatus.size > 0) {
        if (!filterCapStatus.has(env.capabilityStatus)) return false;
      }
      return true;
    });
  }, [tagFiltered, filtersEnabled, hasMetaFilters, filterScales, filterMaturity, filterCapStatus]);

  // ── context-aware ranking ──
  const activeScale = ctxSummary.scale as UrbanScale | null;

  const finalCards = useMemo(() => {
    if (!activeScale) return metaFiltered;
    // Boost cards whose validSpatialScales includes the active project scale
    return metaFiltered.slice().sort((a, b) => {
      const aBoost = a.validityEnvelope?.validSpatialScales.includes(activeScale) ? 1 : 0;
      const bBoost = b.validityEnvelope?.validSpatialScales.includes(activeScale) ? 1 : 0;
      if (bBoost !== aBoost) return bBoost - aBoost;
      return a.title.localeCompare(b.title);
    });
  }, [metaFiltered, activeScale]);

  const isEmpty = finalCards.length === 0 && cards.length > 0;

  // ── favorites list ──
  const favoriteCards = useMemo(
    () =>
      cards
        .filter((c) => favorites[c.id])
        .sort((a, b) => a.title.localeCompare(b.title)),
    [cards, favorites],
  );

  // ── section parent map ──
  const sectionParentMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const parent of SECTION_TREE) {
      for (const child of parent.children || []) {
        map[child.id] = parent.id;
      }
    }
    return map;
  }, []);

  // ── all tags (derived from cards) ──
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) {
      for (const t of c.tags || []) set.add(String(t));
    }
    return Array.from(set).sort();
  }, [cards]);

  // ── available scale/maturity/capStatus values in current card set ──
  const availableScales = useMemo(() => {
    const set = new Set<UrbanScale>();
    for (const c of cards) if (c.validityEnvelope) for (const s of c.validityEnvelope.validSpatialScales) set.add(s);
    return set;
  }, [cards]);

  const availableMaturity = useMemo(() => {
    const set = new Set<UrbanMethodMaturityLevel>();
    for (const c of cards) if (c.validityEnvelope) set.add(c.validityEnvelope.maturityLevel);
    return set;
  }, [cards]);

  const availableCapStatus = useMemo(() => {
    const set = new Set<UrbanMethodCapabilityStatus>();
    for (const c of cards) if (c.validityEnvelope) set.add(c.validityEnvelope.capabilityStatus);
    return set;
  }, [cards]);

  // ── group IDs ──
  const allGroupIds = useMemo(
    () => SECTION_TREE.map((g) => g.id),
    [],
  );
  const isAllExpanded =
    collapsedGroups.size === 0 ||
    allGroupIds.every((id) => !collapsedGroups.has(id));

  // ── auto-open parents when tags match ──
  const prevCollapsedBeforeTagRef = useRef<Set<string> | null>(null);
  const autoOpenedParentsRef = useRef<Set<string>>(new Set());
  const manualCollapsedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!filtersEnabled) return;
    if (activeTags.length === 0) {
      if (prevCollapsedBeforeTagRef.current) {
        setCollapsedGroups(new Set(prevCollapsedBeforeTagRef.current));
        prevCollapsedBeforeTagRef.current = null;
      }
      return;
    }
    if (!prevCollapsedBeforeTagRef.current) {
      prevCollapsedBeforeTagRef.current = new Set(collapsedGroups);
    }
    const selectedSet = new Set(activeTags.map((t) => t.toLowerCase()));
    const groupsToOpen = new Set<string>();
    for (const c of cards) {
      const ct = (c.tags || []) as string[];
      if (ct.some((t) => selectedSet.has(t.toLowerCase()))) {
        const sid = c.sectionId;
        if (sid) {
          const parent = sectionParentMap[sid];
          if (parent) groupsToOpen.add(parent);
        }
      }
    }
    if (groupsToOpen.size) {
      setCollapsedGroups((prev) => {
        let changed = false;
        const next = new Set(prev);
        groupsToOpen.forEach((g) => {
          if (manualCollapsedRef.current.has(g)) return;
          if (next.has(g)) {
            next.delete(g);
            changed = true;
            autoOpenedParentsRef.current.add(g);
          }
        });
        return changed ? next : prev;
      });
    }
  }, [activeTags, cards, sectionParentMap, filtersEnabled, collapsedGroups]);

  // ── auto-open parent of selected card ──
  useEffect(() => {
    if (!selectedCardId) return;
    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return;
    const sid = card.sectionId;
    if (!sid) return;
    const parent = sectionParentMap[sid];
    if (!parent) return;
    if (manualCollapsedRef.current.has(parent)) return;
    if (collapsedGroups.has(parent)) {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        next.delete(parent);
        autoOpenedParentsRef.current.add(parent);
        return next;
      });
    }
  }, [selectedCardId, cards, sectionParentMap, collapsedGroups]);

  // ── collapse toggling ──
  const toggleGroup = useCallback(
    (id: string) =>
      setCollapsedGroups((s) => {
        const next = new Set(s);
        if (next.has(id)) {
          next.delete(id);
          manualCollapsedRef.current.delete(id);
        } else {
          next.add(id);
          manualCollapsedRef.current.add(id);
          autoOpenedParentsRef.current.delete(id);
        }
        return next;
      }),
    [],
  );

  const expandAll = useCallback(() => {
    setCollapsedGroups(() => new Set());
    manualCollapsedRef.current.clear();
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedGroups(() => new Set(allGroupIds));
    manualCollapsedRef.current = new Set(allGroupIds);
    autoOpenedParentsRef.current.clear();
  }, [allGroupIds]);

  // ── search input ──
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery],
  );

  const handleSearchClear = useCallback(() => {
    setQuery('');
    requestAnimationFrame(() => focusSearch());
  }, [setQuery, focusSearch]);

  // ── reset filters ──
  const handleResetSearch = useCallback(() => {
    setQuery('');
    if (sectionFilter !== 'all') setSectionFilter('all');
    if (activeTags.length) activeTags.forEach((t) => onToggleTag(t));
    if (!filtersEnabled) setFiltersEnabled(true);
    if (hasMetaFilters) clearMetaFilters();
    requestAnimationFrame(() => focusSearch());
  }, [setQuery, sectionFilter, activeTags, onToggleTag, filtersEnabled, hasMetaFilters, clearMetaFilters, focusSearch]);

  // ── focus management (keyboard navigation) ──
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusIdsRef = useRef<string[]>([]);

  const moveFocus = useCallback(
    (direction: 'next' | 'prev' | 'home' | 'end') => {
      const order = focusIdsRef.current;
      if (!order.length) return;
      const idx = focusId ? order.indexOf(focusId) : 0;
      let nextIdx = idx < 0 ? 0 : idx;
      if (direction === 'next') nextIdx = Math.min(order.length - 1, idx + 1);
      else if (direction === 'prev') nextIdx = Math.max(0, idx - 1);
      else if (direction === 'home') nextIdx = 0;
      else if (direction === 'end') nextIdx = order.length - 1;
      const nextId = order[nextIdx];
      if (nextId && nextId !== focusId) setFocusId(nextId);
    },
    [focusId],
  );

  const onGlobalKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus('next'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus('prev'); }
      else if (e.key === 'Home') { e.preventDefault(); moveFocus('home'); }
      else if (e.key === 'End') { e.preventDefault(); moveFocus('end'); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (focusId) { e.preventDefault(); onSelectCard(focusId); }
      }
    },
    [focusId, moveFocus, onSelectCard],
  );

  // ── section counts ──
  type LeafItem = { id: string; sectionId?: string };
  const groupCountBySection = useCallback((items: LeafItem[]) => {
    const out: Record<string, number> = Object.create(null);
    for (const it of items) {
      if (!it.sectionId) continue;
      out[it.sectionId] = (out[it.sectionId] || 0) + 1;
    }
    return out;
  }, []);

  const totalBySection = useMemo(
    () => groupCountBySection(cards as LeafItem[]),
    [cards, groupCountBySection],
  );
  const filteredBySection = useMemo(
    () => groupCountBySection(finalCards as LeafItem[]),
    [finalCards, groupCountBySection],
  );

  const globalTotal = cards.length;
  const globalFiltered = finalCards.length;

  // ── Ctrl/Cmd+K shortcut to focus search ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusSearch]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <aside
      className="urban-rail urban-sidebar"
      aria-label="Urban Analytics Library"
    >
      {/* ── topline accent bar ── */}
      <div className="urban-rail__topline" aria-hidden="true" />

      {/* ── HEADER ── */}
      <div className="urban-rail__header" role="group" aria-label="Library header">
        <div className="urban-rail__masthead">
          <div>
            <h2 className="urban-rail__title">
              Methods &amp; <span className="urban-rail__titleMain">Tools</span>
            </h2>
            <p className="urban-rail__subtitle">Spatial analysis reference library</p>
          </div>
        </div>

        {/* section dropdown */}
        <div className="urban-rail__sectionRow">
          <label htmlFor="urban-section-filter" className="urban-rail__sectionLabel">
            Section
          </label>
          <select
            id="urban-section-filter"
            className="urban-rail__sectionSelect"
            aria-label="Section"
            value={sectionFilter}
            onChange={(e) => {
              const v = e.target.value;
              setSectionFilter(v);
              window.dispatchEvent(
                new CustomEvent('urban:section:fromRail', { detail: { id: v } }),
              );
            }}
          >
            <option value="all">All Sections</option>
            {SECTION_TREE.map((parent) => (
              <optgroup key={parent.id} label={parent.label}>
                {(parent.children || []).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span
            className="urban-rail__count"
            aria-live="polite"
            data-testid="library-result-count"
          >
            {globalFiltered}
          </span>
        </div>

        {/* inline filter buttons */}
        <div
          className="urban-rail__filtersInline"
          role="group"
          aria-label="Filter controls"
        >
          <button
            type="button"
            className="inline-btn"
            onClick={() => setFiltersEnabled((f) => !f)}
            aria-pressed={filtersEnabled}
          >
            Filters: <strong>{filtersEnabled ? 'On' : 'Off'}</strong>
          </button>
          {!!filtersEnabled && (
            <button
              type="button"
              className="inline-btn"
              onClick={() => setFiltersExpanded((e) => !e)}
              aria-expanded={filtersExpanded}
            >
              {filtersExpanded ? 'Hide Tags' : 'Show Tags'}
              {activeTags.length ? ` (${activeTags.length})` : ''}
            </button>
          )}
          <button
            type="button"
            className="inline-btn"
            onClick={() => (isAllExpanded ? collapseAll() : expandAll())}
            aria-pressed={isAllExpanded}
            aria-label={isAllExpanded ? 'Collapse all sections' : 'Expand all sections'}
            data-testid="rail-expand-all"
          >
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          {!!(normalizedQ || sectionFilter !== 'all' || activeTags.length > 0 || hasMetaFilters) && (
            <button
              type="button"
              className="inline-btn danger"
              onClick={handleResetSearch}
            >
              Reset
            </button>
          )}
        </div>

        {/* tag filter grid — grouped by TAG_GROUPS */}
        {!!filtersEnabled && !!filtersExpanded && allTags.length > 0 && (
          <div
            className="urban-rail__tagsMini"
            role="list"
            aria-label="Tag filters"
          >
            {TAG_GROUPS.map((group) => (
              <div key={group.label} className="urban-rail__tagGroup" role="listitem">
                <div className="urban-rail__tagGroupLabel">{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {group.tags.map((t) => {
                    const on = activeTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`mini-chip${on ? ' on' : ''}`}
                        aria-pressed={on}
                        onClick={() => onToggleTag(t)}
                      >
                        {t.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* method metadata filters */}
        {!!filtersEnabled && (
          <div className="urban-rail__metaFilterBar">
            <button
              type="button"
              className={`inline-btn${hasMetaFilters ? ' active' : ''}`}
              onClick={() => setMetaExpanded((x) => !x)}
              aria-expanded={metaExpanded}
            >
              Method Filters{hasMetaFilters ? ` (${filterScales.size + filterMaturity.size + filterCapStatus.size})` : ''}
            </button>
            {!!hasMetaFilters && (
              <button
                type="button"
                className="inline-btn danger"
                onClick={clearMetaFilters}
                aria-label="Clear method filters"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {!!filtersEnabled && !!metaExpanded && (
          <div className="urban-rail__metaFilters" role="group" aria-label="Method metadata filters">
            {/* Scale filter */}
            {availableScales.size > 0 && (
              <div className="urban-rail__metaGroup">
                <div className="urban-rail__metaGroupLabel">Scale</div>
                <div className="urban-rail__metaChips">
                  {(Object.keys(SCALE_SHORT) as UrbanScale[]).filter((s) => availableScales.has(s)).map((s) => {
                    const on = filterScales.has(s);
                    const isActive = s === activeScale;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`mini-chip${on ? ' on' : ''}${isActive ? ' meta-ctx' : ''}`}
                        aria-pressed={on}
                        title={isActive ? `Active project scale: ${s}` : s}
                        onClick={() => toggleMetaFilter(filterScales, s, setFilterScales)}
                      >
                        {SCALE_SHORT[s]}{isActive ? ' ●' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Maturity filter */}
            {availableMaturity.size > 0 && (
              <div className="urban-rail__metaGroup">
                <div className="urban-rail__metaGroupLabel">Maturity</div>
                <div className="urban-rail__metaChips">
                  {(Object.keys(MATURITY_SHORT) as UrbanMethodMaturityLevel[]).filter((m) => availableMaturity.has(m) && m !== 'unknown').map((m) => {
                    const on = filterMaturity.has(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        className={`mini-chip${on ? ' on' : ''}`}
                        aria-pressed={on}
                        onClick={() => toggleMetaFilter(filterMaturity, m, setFilterMaturity)}
                      >
                        {MATURITY_SHORT[m] ?? m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Capability status filter */}
            {availableCapStatus.size > 0 && (
              <div className="urban-rail__metaGroup">
                <div className="urban-rail__metaGroupLabel">Status</div>
                <div className="urban-rail__metaChips">
                  {(Object.keys(CAP_STATUS_CONFIG) as UrbanMethodCapabilityStatus[]).filter((c) => availableCapStatus.has(c)).map((cs) => {
                    const cfg = CAP_STATUS_CONFIG[cs];
                    const on = filterCapStatus.has(cs);
                    return (
                      <button
                        key={cs}
                        type="button"
                        className={`mini-chip${on ? ' on' : ''}`}
                        aria-pressed={on}
                        style={on ? { borderColor: cfg.color, color: cfg.color } : undefined}
                        onClick={() => toggleMetaFilter(filterCapStatus, cs, setFilterCapStatus)}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Context summary — active scale hint */}
            {!!activeScale && (
              <div className="urban-rail__ctxHint">
                Active scale: <strong>{activeScale}</strong> — boosted methods shown first
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SEARCH ── */}
      <div className="urban-search" role="search" aria-label="Search library">
        <input
          ref={searchInputRef}
          className="urban-search__input"
          type="search"
          role="searchbox"
          aria-label="Search methods and tools"
          placeholder="Search library…   Ctrl+K"
          value={query}
          onChange={handleSearchChange}
        />
        {!!normalizedQ && (
          <button
            type="button"
            className="urban-search__clear"
            onClick={handleSearchClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        className="urban-rail__scroll"
        role="region"
        aria-label="Library navigation"
      >
        <div className="urban-rail__divider" role="separator" aria-hidden="true" />
        <div className="rail-results" role="status" aria-live="polite">
          <span className="rail-results-label">Results</span>
          <span className="rail-results-value" data-testid="rail-results-filtered">
            {globalFiltered}
          </span>
          <span className="rail-results-sep">of</span>
          <span className="rail-results-total" data-testid="rail-results-total">
            {globalTotal}
          </span>
        </div>

        <RailErrorBoundary>
          {isEmpty ? (
            <RailEmptyState
              hasFilters={!!activeTags.length}
              hasSearch={!!normalizedQ}
              onClearFilters={handleResetSearch}
              onClearSearch={handleResetSearch}
            />
          ) : cards.length === 0 ? (
            <RailLoadingSkeleton />
          ) : (
            <>
              <div className="urban-rail__body" role="region" aria-label="Library results">
                <div
                  className="urban-rail__resultsTree"
                  role="tree"
                  aria-label="Sections"
                  tabIndex={0}
                  onKeyDown={onGlobalKey}
                >
                  {/* Favorites group */}
                  {favoriteCards.length > 0 && (
                    <SimpleFlatGroup
                      title="Favorites"
                      items={favoriteCards}
                      onSelect={onSelectCard}
                      toggleFavorite={toggleFavorite}
                      favorites={favorites}
                      totalBySection={totalBySection}
                      filteredBySection={filteredBySection}
                      {...(selectedCardId ? { selectedId: selectedCardId } : {})}
                    />
                  )}

                  {/* Section tree */}
                  <SectionTree
                    sections={SECTION_TREE}
                    collapsed={collapsedGroups}
                    toggleCollapse={toggleGroup}
                    cards={finalCards}
                    favorites={favorites}
                    onSelectCard={onSelectCard}
                    toggleFavorite={toggleFavorite}
                    focusIdsRef={focusIdsRef}
                    totalBySection={totalBySection}
                    filteredBySection={filteredBySection}
                    activeScale={activeScale}
                    {...(selectedCardId ? { selectedCardId } : {})}
                  />
                </div>
              </div>
              <RailFooter total={globalFiltered} query={query} />
            </>
          )}
        </RailErrorBoundary>
      </div>
    </aside>
  );
};

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

// ── Footer ──
const RailFooter: React.FC<{ total: number; query: string }> = ({ total, query }) => (
  <div className="urban-rail__footer">
    {total} result{total !== 1 ? 's' : ''}
    {query ? ` • "${query}"` : ''}
  </div>
);

// ── Loading skeleton ──
export function RailLoadingSkeleton() {
  return (
    <div className="rail-skel" aria-hidden="true">
      <div className="skel-chipbar">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="skel skel-chip" />
        ))}
      </div>
      <div className="skel-sections">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skel skel-row">
            <span className="skel skel-chevron" />
            <span className="skel skel-title" />
            <span className="skel skel-badge" />
          </div>
        ))}
      </div>
      <div className="skel-leaflist">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skel skel-leaf" />
        ))}
      </div>
    </div>
  );
}

// ── Empty state ──
export function RailEmptyState({
  hasFilters,
  hasSearch,
  onClearFilters,
  onClearSearch,
}: {
  hasFilters: boolean;
  hasSearch: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
}) {
  return (
    <div
      className="rail-empty"
      role="status"
      aria-live="polite"
      aria-describedby="rail-empty-desc"
    >
      <div className="rail-empty-title">No items match your search and filters.</div>
      <div id="rail-empty-desc" className="rail-empty-sub">
        Try clearing filters or editing your query.
      </div>
      <div className="rail-empty-actions">
        {!!hasFilters && (
          <button className="urban-chip reset" onClick={onClearFilters}>
            Reset filters
          </button>
        )}
        {!!hasSearch && (
          <button
            className="urban-chip"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
}

// ── Error boundary ──
class RailErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  handleRetry = () => this.setState({ error: null });

  handleCopy = () => {
    try {
      const err = this.state.error;
      const payload = {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? String(err.stack ?? '') : '',
        ts: new Date().toISOString(),
        area: 'urban-left-rail',
      };
      navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    } catch { /* ignore */ }
  };

  override render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error;
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="rail-error" role="alert" aria-live="assertive">
        <div className="rail-error-title">Something went wrong in the left panel.</div>
        <pre className="rail-error-msg">{msg}</pre>
        <div className="rail-error-actions">
          <button className="urban-chip" onClick={this.handleRetry}>
            Retry
          </button>
          <button className="urban-chip reset" onClick={this.handleCopy}>
            Copy diagnostics
          </button>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Section Tree
// ═══════════════════════════════════════════════════════════════

interface SectionTreeProps {
  sections: SectionTreeNode[];
  collapsed: Set<string>;
  toggleCollapse(id: string): void;
  cards: Card[];
  favorites: Record<string, true>;
  toggleFavorite(id: string): void;
  onSelectCard(id: string): void;
  selectedCardId?: string;
  focusIdsRef: React.MutableRefObject<string[]>;
  totalBySection: Record<string, number>;
  filteredBySection: Record<string, number>;
  activeScale?: UrbanScale | null;
}

const SectionTree: React.FC<SectionTreeProps> = ({
  sections,
  collapsed,
  toggleCollapse,
  cards,
  favorites,
  toggleFavorite,
  onSelectCard,
  selectedCardId,
  focusIdsRef,
  totalBySection,
  filteredBySection,
  activeScale,
}) => {
  // Index cards by sectionId for fast lookup
  const cardsBySectionId = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const c of cards) {
      const sid = c.sectionId;
      if (!sid) continue;
      if (!map[sid]) map[sid] = [];
      map[sid].push(c);
    }
    return map;
  }, [cards]);

  // Track all visible card IDs for focus management
  useLayoutEffect(() => {
    const ids: string[] = [];
    for (const group of sections) {
      if (collapsed.has(group.id)) continue;
      for (const child of group.children || []) {
        const childCards = cardsBySectionId[child.id] || [];
        for (const c of childCards) ids.push(c.id);
      }
    }
    focusIdsRef.current = ids;
  }, [sections, collapsed, cardsBySectionId, focusIdsRef]);

  return (
    <>
      {sections.map((group) => {
        const isOpen = !collapsed.has(group.id);
        const children = group.children || [];

        // Count cards across all children
        const groupTotal = children.reduce(
          (sum, ch) => sum + (totalBySection[ch.id] || 0),
          0,
        );
        const groupFiltered = children.reduce(
          (sum, ch) => sum + (filteredBySection[ch.id] || 0),
          0,
        );

        return (
          <div
            key={group.id}
            className="urban-rail__group"
            role="treeitem"
            aria-expanded={isOpen}
            aria-selected={false}
          >
            <button
              type="button"
              className={`urban-rail__groupBtn${groupTotal === 0 ? ' is-empty' : ''}${isOpen ? ' is-open' : ''}`}
              onClick={() => toggleCollapse(group.id)}
              aria-expanded={isOpen}
            >
              <span className="urban-rail__groupChev" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="urban-rail__groupLabel">{group.label}</span>
              <span className={`rail-badge${groupFiltered > 0 ? ' has-items' : ''}`}>
                {groupFiltered}
              </span>
            </button>

            {!!isOpen && (
              <div role="group">
                {children.map((child) => {
                  const childCards = cardsBySectionId[child.id] || [];
                  if (childCards.length === 0) return null;
                  return (
                    <div key={child.id} className="urban-rail__sub">
                      <div className="urban-rail__subLabel">
                        <span className="urban-rail__subDot" aria-hidden="true" />
                        {child.label}
                        <span className="urban-rail__subCount">{childCards.length}</span>
                      </div>
                      <ul className="urban-rail__list">
                        {childCards.map((card) => {
                          const active = card.id === selectedCardId;
                          const env = card.validityEnvelope;
                          const capSt = env?.capabilityStatus;
                          const isWarning = capSt === 'residual_gap';
                          const isDim = capSt === 'deferred';
                          const isDemo = capSt === 'demo_mode';
                          const isBoosted = !!activeScale && !!env?.validSpatialScales.includes(activeScale);
                          const itemClass = [
                            'urban-rail__item',
                            active ? 'is-active' : '',
                            isWarning ? 'is-warning' : '',
                            isDim ? 'is-dim' : '',
                          ].filter(Boolean).join(' ');
                          return (
                            <li
                              key={card.id}
                              className={itemClass}
                            >
                              <button
                                type="button"
                                className="urban-rail__itemBtn"
                                aria-current={active ? 'true' : undefined}
                                data-card-id={card.id}
                                data-roving-id={card.id}
                                tabIndex={0}
                                onClick={() => onSelectCard(card.id)}
                                title={
                                  isDim
                                    ? `${card.title} — deferred (not yet implemented)`
                                    : isWarning
                                    ? `${card.title} — residual gap`
                                    : isDemo
                                    ? `${card.title} — demo mode only`
                                    : isBoosted
                                    ? `${card.title} — matches active scale: ${activeScale}`
                                    : card.title
                                }
                              >
                                <span className="urban-rail__itemTitle">{card.title}</span>
                                <RailItemMeta card={card} boosted={isBoosted} activeScale={activeScale ?? undefined} />
                              </button>
                              <FavoriteStar
                                on={!!favorites[card.id]}
                                onToggle={() => toggleFavorite(card.id)}
                                label={`${favorites[card.id] ? 'Remove' : 'Add'} favorite for ${card.title}`}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// SimpleFlatGroup (for Favorites)
// ═══════════════════════════════════════════════════════════════

interface SimpleGroupProps {
  title: string;
  items: Card[];
  onSelect(id: string): void;
  selectedId?: string;
  toggleFavorite(id: string): void;
  favorites?: Record<string, true>;
  totalBySection?: Record<string, number>;
  filteredBySection?: Record<string, number>;
}

function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [h, setH] = useState(0);
  const recalc = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = el.scrollHeight || 0;
    setH((prev) => (prev !== next ? next : prev));
  }, []);
  useLayoutEffect(() => {
    recalc();
    const el = ref.current;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => recalc());
    });
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, [recalc]);
  return { ref, h, recalc };
}

const SimpleFlatGroup: React.FC<SimpleGroupProps> = ({
  title,
  items,
  onSelect,
  selectedId,
  toggleFavorite,
  favorites = {},
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { ref: panelInnerRef, h } = useMeasuredHeight<HTMLDivElement>();
  const open = !collapsed;

  if (!items.length) return null;

  const headingId = `urban-group-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const regionId = `${headingId}-panel`;

  const onHeaderKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCollapsed((c) => !c);
    }
  };

  return (
    <div
      className={`urban-acc__section${open ? ' is-open' : ''}`}
      role="listitem"
      aria-labelledby={headingId}
    >
      <h3 className="urban-acc__heading" id={headingId}>
        <button
          type="button"
          className="urban-acc__header"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setCollapsed((c) => !c)}
          onKeyDown={onHeaderKey}
        >
          <span className="urban-acc__chev" aria-hidden="true">▸</span>
          <span className="urban-acc__title">{title}</span>
          <span className="rail-badge">{items.length}</span>
        </button>
      </h3>
      <div
        id={regionId}
        role="region"
        aria-labelledby={headingId}
        className="urban-acc__panel"
        style={{ ['--acc-h' as string]: `${h}px` } as React.CSSProperties}
      >
        <div ref={panelInnerRef} className="urban-acc__panelInner">
          <div className="urban-rail__list" role="list">
            {items.map((card) => {
              const active = card.id === selectedId;
              return (
                <li key={card.id} className="urban-list__item">
                  <button
                    type="button"
                    className="urban-list__row"
                    aria-current={active ? 'true' : undefined}
                    data-roving-id={card.id}
                    tabIndex={0}
                    onClick={() => onSelect(card.id)}
                    title={card.title}
                  >
                    <div className="urban-list__main">
                      <div className="urban-list__title">{card.title}</div>
                      {!!card.summary && <div className="urban-list__meta">{card.summary}</div>}
                    </div>
                    <div className="urban-list__actions">
                      <FavoriteStar
                        on={!!favorites[card.id]}
                        onToggle={() => toggleFavorite(card.id)}
                        label={`${favorites[card.id] ? 'Remove' : 'Add'} favorite for ${card.title}`}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Rail Item Metadata (Prompt 08 + 09)
// ═══════════════════════════════════════════════════════════════

interface RailItemMetaProps {
  card: Card;
  boosted?: boolean;
  activeScale?: UrbanScale;
}

const RailItemMeta: React.FC<RailItemMetaProps> = ({ card, boosted, activeScale }) => {
  const env = card.validityEnvelope;
  if (!env) return null;

  const capCfg = CAP_STATUS_CONFIG[env.capabilityStatus];
  const matShort = MATURITY_SHORT[env.maturityLevel];
  const rawScales = env.recommendedScales?.length ? env.recommendedScales : env.validSpatialScales;
  const scales = rawScales.slice(0, 2);

  const parts: string[] = [];
  if (env.methodFamily !== 'unknown') parts.push(env.methodFamily.replace(/-/g, ' '));
  if (matShort) parts.push(matShort);
  if (scales.length > 0) parts.push(scales.map((s) => SCALE_SHORT[s]).join('·'));

  const affordParts: string[] = [];
  const datasetCount = card.datasets?.length ?? 0;
  const toolCount = card.tools?.length ?? 0;
  const evidenceCount = card.evidence?.length ?? 0;
  if (datasetCount > 0) affordParts.push(`${datasetCount}d`);
  if (toolCount > 0) affordParts.push(`${toolCount}t`);
  if (evidenceCount > 0) affordParts.push(`${evidenceCount}c`);

  return (
    <div className="rail-item-meta" aria-hidden="true">
      <span
        className="rail-item-cap"
        style={{ '--rim-cap-color': capCfg.color } as React.CSSProperties}
        title={`Capability: ${env.capabilityStatus}`}
      >
        {capCfg.label}
      </span>
      {parts.length > 0 && (
        <span className="rail-item-text" title={parts.join(' · ')}>
          {parts.join(' · ')}
        </span>
      )}
      {affordParts.length > 0 && (
        <span className="rail-item-afford" title={`Linked: ${affordParts.join(', ')}`}>
          {affordParts.join(' ')}
        </span>
      )}
      {!!boosted && !!activeScale && (
        <span className="rail-item-boost" title={`Matches active scale: ${activeScale}`}>
          ↑ {activeScale}
        </span>
      )}
    </div>
  );
};
RailItemMeta.displayName = 'RailItemMeta';

// ═══════════════════════════════════════════════════════════════
// Inline FavoriteStar
// ═══════════════════════════════════════════════════════════════

interface FavoriteStarProps {
  on: boolean;
  onToggle(): void;
  size?: number;
  label?: string;
}

const FavoriteStar: React.FC<FavoriteStarProps> = React.memo(
  ({ on, onToggle, size = 22, label }) => (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={label ?? (on ? 'Remove favorite' : 'Add favorite')}
      data-testid="favorite-star"
      style={{ fontSize: size, cursor: 'pointer', userSelect: 'none', lineHeight: 1 }}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
    >
      {on ? '★' : '☆'}
    </span>
  ),
);
FavoriteStar.displayName = 'FavoriteStar';
