/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

/**
 * Urban Analytics Workbench — Main Modal Container
 *
 * Replicates the exact architecture of the original modal:
 * - 3-panel layout: Left Rail | Center Panel | Right Panel
 * - Portal rendering to document.body
 * - Keyboard handlers (Escape, Ctrl+Enter, etc.)
 * - Library injection via __setUrbanLibrary on mount
 * - Open/close animation
 *
 * Seed content: 101 cards across 9 seed modules (Phase 4 complete).
 * RailContainer built in Prompt 11.
 * RightPanelBoundary built in Prompt 12.
 */

import React, {
 Suspense,
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { MapExplorerButton } from '@/centerpanel/components/MapExplorerButton';
import { type MapExplorerState, useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { usePanelBridgeStore } from '@/stores/usePanelBridgeStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

import {
 __setUrbanLibrary,
 selectSelectedCard,
 useSelectedCardId,
 useUrbanStore,
} from './store';
import type { Card, SectionId, UrbanTag } from './lib/types';
import { SECTION_TREE } from './lib/sectionHierarchy';
import { RailContainer } from './rail/RailContainer';
import { buildFullLibrary } from './seeds/index';
import { IconCode, IconCopy, IconPrint, IconSend } from './icons';
import { UrbanEvidenceTray } from './evidence/UrbanEvidenceTray';
import { StudyAreaPicker } from './StudyAreaPicker';

import {
 useUrbanContextStore,
 useUrbanContextSummary,
} from './useUrbanContextStore';
import { subscribeMapContextToUrban } from './context/mapContextAdapter';

// Dev-only: expose store on window.__urbanCtx for console testing
if (import.meta.env.DEV) {
 (window as Record<string, unknown>).__urbanCtx = useUrbanContextStore.getState();
 useUrbanContextStore.subscribe((state) => {
 (window as Record<string, unknown>).__urbanCtx = state;
 });
}

import CenterPanelShell from '@/centerpanel/CenterPanelShell';
import OutlineNav from '@/centerpanel/OutlineNav';
import { ChunkLoadBoundary, lazyWithRetry } from '@/utils/lazyWithRetry';

// Lazy-load the right panel (Prompt 12)
const RightPanelBoundary = lazyWithRetry(() =>
 import('./RightPanelFourBlock').then((m) => ({ default: m.RightPanelBoundary })),
);

// ---------------------------------------------------------------------------
// Build merged library from seed builders
// ---------------------------------------------------------------------------

const LIBRARY: Card[] = buildFullLibrary();

// Inject library into the store at module-load time so visibleCards() can
// access it on the very first render (before any useEffect runs).
__setUrbanLibrary(LIBRARY);

// Build a fast lookup set for validating persisted card IDs.
const LIBRARY_IDS = new Set(LIBRARY.map((c) => c.id));

// ---------------------------------------------------------------------------
// Toast utility
// ---------------------------------------------------------------------------

function useToast() {
 const [msg, setMsg] = useState<string | null>(null);
 const timer = useRef<number | null>(null);
 const show = (text: string, ms = 2000) => {
 setMsg(text);
 if (timer.current) clearTimeout(timer.current);
 timer.current = window.setTimeout(() => setMsg(null), ms) as unknown as number;
 };
 useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
 const Toast = () =>
 msg ? (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: 'fixed',
 left: '50%',
 bottom: 24,
 transform: 'translateX(-50%)',
      background: 'var(--syn-surface-overlay)',
      color: 'var(--syn-text-default)',
 padding: '8px 12px',
 borderRadius: 10,
 fontSize: 12,
 // Toast tier matches Toaster.css .ai-toaster-layer (10080).
 zIndex: 10080,
      border: '1px solid var(--syn-border-subtle)',
 }}
 >
 {msg}
 </div>
 ) : null;
 return { show, Toast };
}

// ---------------------------------------------------------------------------
// UrbanCommandBar — fused premium one-line header + study area + context pills
// Replaces both the old header <header> block and the multi-row context bar.
// ---------------------------------------------------------------------------

const URBAN_CMD_CSS = `
@keyframes ua-area-pulse {
 0%,100% { opacity: 1; }
 50% { opacity: 0.7; }
}
@keyframes ua-slide-in {
 from { opacity: 0; transform: translateY(-4px); }
 to { opacity: 1; transform: translateY(0); }
}
.ua-area-set {
 box-shadow: inset 2px 0 0 var(--syn-interaction-active);
}
.ua-area-unset {
 animation: ua-area-pulse 2.5s ease-in-out infinite;
}
.ua-chip {
 display: inline-flex;
 align-items: center;
 gap: 3px;
 padding: 2px 6px;
 border-radius: 3px;
 font-size: 10px;
 white-space: nowrap;
 font-family: var(--codefont);
 line-height: 1.3;
 transition: opacity 0.15s;
}
.ua-chip:hover { opacity: 0.8; }
.ua-area-input {
 animation: ua-slide-in 0.12s ease;
 background: var(--syn-surface-input);
 border: 1px solid var(--syn-border-subtle);
 border-radius: 3px;
 padding: 2px 8px;
 font-size: 12px;
 font-family: var(--codefont);
 color: var(--syn-text-default);
 outline: none;
 width: 220px;
 transition: border-color 0.15s, box-shadow 0.15s;
}
.ua-area-input:focus {
 border-color: var(--syn-border-focus);
 box-shadow: 0 0 0 1px var(--syn-border-focus);
}
.ua-iconbtn {
 background: transparent;
 border: 1px solid transparent;
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 3px;
 transition: background 0.12s, border-color 0.12s, color 0.12s, opacity 0.12s;
 opacity: 0.7;
}
.ua-iconbtn:hover { background: var(--syn-interaction-hover); border-color: var(--syn-border-subtle); opacity: 1; }
.ua-iconbtn:focus-visible { outline: none; box-shadow: var(--ua-focus-ring-offset); opacity: 1; }
.ua-layout-toggle {
 position: relative;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 0;
 height: 26px;
 width: 26px;
 padding: 0;
 overflow: hidden;
 border: 1px solid var(--syn-border-subtle);
 border-radius: 3px;
 background: color-mix(in srgb, var(--syn-surface-editor) 72%, transparent);
 color: var(--syn-text-secondary);
 cursor: pointer;
 font-family: var(--codefont);
 font-size: 10px;
 font-weight: 700;
 letter-spacing: .06em;
 text-transform: uppercase;
 transition: background .14s cubic-bezier(.2,.75,.25,1), border-color .14s cubic-bezier(.2,.75,.25,1), color .14s cubic-bezier(.2,.75,.25,1), transform .14s cubic-bezier(.2,.75,.25,1), box-shadow .14s cubic-bezier(.2,.75,.25,1);
}
.ua-layout-toggle::after {
 content: "";
 position: absolute;
 inset-block: 0;
 inline-size: 42%;
 background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--syn-interaction-active) 20%, transparent), transparent);
 opacity: 0;
 transform: translateX(-120%);
 pointer-events: none;
}
.ua-layout-toggle:hover {
 transform: translateY(-1px);
 background: color-mix(in srgb, var(--syn-interaction-active) 10%, transparent);
 border-color: color-mix(in srgb, var(--syn-interaction-active) 42%, var(--syn-border-subtle));
 color: var(--syn-text-default);
}
.ua-layout-toggle:hover::after { opacity: 1; animation: ua-layout-sweep .52s ease-out both; }
.ua-layout-toggle.is-on {
 background: color-mix(in srgb, var(--syn-interaction-active) 14%, transparent);
 border-color: color-mix(in srgb, var(--syn-interaction-active) 48%, var(--syn-border-subtle));
 color: var(--syn-text-default);
 box-shadow: inset 0 -2px 0 var(--syn-interaction-active);
}
.ua-layout-toggle svg { color: var(--syn-interaction-active); flex: 0 0 auto; }
.ua-layout-toggle:focus-visible { outline: none; box-shadow: var(--ua-focus-ring-offset); }
@keyframes ua-layout-sweep {
 from { transform: translateX(-120%); }
 to { transform: translateX(160%); }
}
@media (prefers-reduced-motion: reduce) {
 .ua-layout-toggle,
 .ua-layout-toggle::after {
  animation: none !important;
  transition: none !important;
  transform: none !important;
 }
}
.ua-brand-shell {
 display: inline-flex;
 align-items: center;
 gap: 6px;
 padding: 0;
 border: 0;
 border-radius: 0;
 background: transparent;
}
.ua-brand-core {
 font-weight: 700;
 font-size: 11px;
 letter-spacing: .11em;
 text-transform: uppercase;
 color: var(--syn-text-default);
 white-space: nowrap;
}
.ua-brand-core::after {
 content: '  //  UAW v1.6';
 color: var(--syn-text-muted);
 font-size: 9px;
 font-weight: 600;
 letter-spacing: .16em;
 margin-left: 8px;
}
`;

interface UrbanCommandBarProps {
 navQuery: string;
 onNavQueryChange: (q: string) => void;
 filteredCount: number;
 searchRef: React.RefObject<HTMLInputElement>;
 onOpenMap: () => void;
 workspaceLayoutExpanded: boolean;
 onToggleWorkspaceLayout: () => void;
 onClose: () => void;
}

function UrbanCommandBar({
 navQuery,
 onNavQueryChange,
 filteredCount,
 searchRef,
 onOpenMap,
 workspaceLayoutExpanded,
 onToggleWorkspaceLayout,
 onClose,
}: UrbanCommandBarProps) {
 const {
 hasContext, scale, flowId, layerCount, runId,
 artifactCount, fitnessStatus, hasRestoreWarnings,
 restoreWarningCount, restoreWarnings, syncState,
 } = useUrbanContextSummary();

 const showPills = hasContext || hasRestoreWarnings || artifactCount > 0;
 const runLabel = runId ? (runId.length > 10 ? `${runId.slice(0, 8)}\u2026` : runId) : null;

 const chipStyle = (
 border: string, bg: string, color: string
 ): React.CSSProperties => ({
 border: `1px solid ${border}`, background: bg, color,
 });
 const neutralChip = chipStyle('var(--syn-border-subtle)', 'transparent', 'var(--syn-text-secondary)');

 return (
 <header
 className="neuro-commandbar"
 role="banner"
 style={{
 position: 'sticky',
 top: 0,
 zIndex: 20,
 display: 'flex',
 alignItems: 'center',
 gap: 0,
 padding: 0,
 background: 'var(--syn-surface-navigation)',
 borderBottom: '1px solid var(--syn-border-subtle)',
 minHeight: 42,
 overflow: 'visible',
 }}
 >
 <style dangerouslySetInnerHTML={{ __html: URBAN_CMD_CSS }} />

 {/* ── Brand segment ─────────────────────────────────────────────── */}
 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 10,
 padding: '0 14px',
 borderRight: '1px solid var(--syn-border-subtle)',
 height: 42,
 flexShrink: 0,
 }}>
 <span style={{ fontSize: 11, color: 'var(--syn-interaction-active)', opacity: 0.9 }}>◈</span>
 <span className="ua-brand-shell">
 <span className="ua-brand-core">Urban Analytics Workbench</span>
 </span>
 </div>

 {/* ── Study area segment ────────────────────────────────────────── */}
 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 padding: '0 12px',
 borderRight: '1px solid var(--syn-border-subtle)',
 height: 42,
 flexShrink: 0,
 position: 'relative',
 }}>
 <StudyAreaPicker />
 </div>
 {/* ── Search segment ────────────────────────────────────────────── */}
 <div style={{
 flex: 1,
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 padding: '0 12px',
 height: 42,
 borderRight: '1px solid var(--syn-border-subtle)',
 minWidth: 0,
 }}>
 <span style={{ fontSize: 12, color: 'var(--syn-text-muted)' }}>⌕</span>
 <input
 ref={searchRef}
 type="search"
 placeholder="Search methods, indicators, tools…"
 value={navQuery}
 onChange={(e) => onNavQueryChange(e.target.value)}
 aria-label="Search urban analytics library"
 style={{
 flex: 1,
 background: 'transparent',
 border: 'none',
 fontSize: 12,
 color: 'var(--syn-text-default)',
 outline: 'none',
 minWidth: 0,
 fontFamily: 'var(--codefont)',
 }}
 />
 {filteredCount > 0 ? (
 <span style={{
 fontSize: 10,
 opacity: 0.35,
 fontFamily: 'var(--codefont)',
 letterSpacing: '.4px',
 }}>{filteredCount}</span>
 ) : null}
 </div>

 {/* ── Context pills segment ─────────────────────────────────────── */}
 {showPills ? (
 <div
 role="region"
 aria-label="Active analytical context"
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 4,
 padding: '0 10px',
 height: 42,
 borderRight: '1px solid var(--syn-border-subtle)',
 flexShrink: 0,
 maxWidth: 340,
 overflow: 'hidden',
 }}
 >
 {scale ? (
 <span className="ua-chip" style={neutralChip} title={`Active scale: ${scale}`} role="status">
 <span style={{ color: 'var(--syn-text-muted)' }} aria-hidden="true">scale:</span>{scale}
 </span>
 ) : null}
 {flowId ? (
 <span className="ua-chip" style={neutralChip} title={`Active workflow: ${flowId.replace(/_/g, ' ')}`} role="status">
 <span style={{ color: 'var(--syn-text-muted)' }} aria-hidden="true">flow:</span>{flowId.replace(/_/g,' ')}
 </span>
 ) : null}
 {layerCount > 0 ? (
 <span className="ua-chip" style={neutralChip} title={`${layerCount} active layer${layerCount === 1 ? '' : 's'}`} role="status">
 <span style={{ color: 'var(--syn-text-muted)' }} aria-hidden="true">layers:</span>{layerCount}
 </span>
 ) : null}
 {runLabel ? (
 <span className="ua-chip" style={neutralChip} title={`Active run: ${runId}`} role="status">
 <span style={{ color: 'var(--syn-text-muted)' }} aria-hidden="true">run:</span>{runLabel}
 </span>
 ) : null}
 {artifactCount > 0 ? (
 <span className="ua-chip" style={chipStyle('color-mix(in srgb, var(--syn-status-valid) 34%, transparent)','transparent','var(--syn-status-valid)')} title={`${artifactCount} evidence artifact${artifactCount === 1 ? '' : 's'}`} role="status">
 <span style={{ color: 'var(--syn-text-muted)' }} aria-hidden="true">evidence:</span>{artifactCount}
 </span>
 ) : null}
 {fitnessStatus === 'ready' ? (
 <span className="ua-chip" style={chipStyle('color-mix(in srgb, var(--syn-status-valid) 34%, transparent)','transparent','var(--syn-status-valid)')} title="Data fitness: ready" role="status">fitness: <span aria-hidden="true">ready ✓</span><span className="visually-hidden">ready</span></span>
 ) : null}
 {fitnessStatus === 'warning' ? (
 <span className="ua-chip" style={chipStyle('color-mix(in srgb, var(--syn-status-info) 35%, transparent)','transparent','var(--syn-status-info)')} title="Data fitness: warning" role="status">fitness: <span aria-hidden="true">warning !</span><span className="visually-hidden">warning</span></span>
 ) : null}
 {fitnessStatus === 'blocked' ? (
 <span className="ua-chip" style={chipStyle('color-mix(in srgb, var(--syn-status-error) 34%, transparent)','transparent','var(--syn-status-error)')} title="Data fitness: blocked" role="status">fitness: <span aria-hidden="true">blocked ✗</span><span className="visually-hidden">blocked</span></span>
 ) : null}
 {syncState === 'synced' && !hasRestoreWarnings ? (
 <span className="ua-chip" style={chipStyle('color-mix(in srgb, var(--syn-status-valid) 30%, transparent)','transparent','var(--syn-status-valid)')} title="Context synced" role="status">sync: <span aria-hidden="true">synced</span><span className="visually-hidden">Context synced</span></span>
 ) : null}
 {hasRestoreWarnings ? (
 <span
 className="ua-chip"
 title={restoreWarnings.map((w) => w.message).join(' | ')}
 style={chipStyle('color-mix(in srgb, var(--syn-status-stale) 45%, transparent)','transparent','var(--syn-status-stale)')}
 role="status"
 >
 stale: {restoreWarningCount}
 </span>
 ) : null}
 </div>
 ) : null}

 {/* ── Actions segment ───────────────────────────────────────────── */}
 <div style={{
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 padding: '0 12px',
 height: 42,
 flexShrink: 0,
 }}>
 <button
 className={`ua-layout-toggle ${workspaceLayoutExpanded ? 'is-on' : ''}`}
 aria-label={workspaceLayoutExpanded ? 'Switch workspace to standard width' : 'Expand workspace to wide layout'}
 aria-pressed={workspaceLayoutExpanded}
 title={workspaceLayoutExpanded ? 'Wide layout — click to use standard width' : 'Standard layout — click to expand'}
 onClick={onToggleWorkspaceLayout}
 >
 {workspaceLayoutExpanded ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
 </button>
 <MapExplorerButton onOpen={onOpenMap} />
 <button
 className="ua-iconbtn iconbtn--close"
 aria-label="Close urban analytics"
 onClick={onClose}
 style={{ width: 26, height: 26, color: 'var(--syn-text-secondary)', fontSize: 13 }}
 >✕</button>
 </div>
 </header>
 );
}

// ---------------------------------------------------------------------------
// HTML → plain helper
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UrbanAnalyticsModalProps {
 open?: boolean;
 onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UrbanAnalyticsModal({ open, onClose }: UrbanAnalyticsModalProps) {
 const [isClosing, setIsClosing] = useState(false);

 // Library is injected at module scope (above). No effect needed.

 // --- store ---
 const store = useUrbanStore?.();
 const active = open !== undefined ? open : (store?.isOpen ?? false);

 const setOpen = useCallback((v: boolean) => {
 if (!v) {
 setIsClosing(true);
 setTimeout(() => {
 setIsClosing(false);
 if (open === undefined) store?.close?.();
 onClose?.();
 }, 300);
 } else {
 if (open === undefined) store?.open?.();
 }
 }, [open, store, onClose]);

 // listen for global close
 useEffect(() => {
 const handler = () => setOpen(false);
 window.addEventListener('synapse:ui:close', handler);
 return () => window.removeEventListener('synapse:ui:close', handler);
 }, [setOpen]);

 // --- selection ---
 const selectedId = useSelectedCardId();
 const selectedCard = useUrbanStore(selectSelectedCard) as Card | null;
 const activeCenterTab = usePanelBridgeStore((state) => state.activeTab);
 const workspaceLayoutExpanded = usePanelBridgeStore((state) => state.workspaceLayoutExpanded);
 const toggleWorkspaceLayoutExpanded = usePanelBridgeStore((state) => state.toggleWorkspaceLayoutExpanded);
 const compactToolboxShell = workspaceLayoutExpanded;

 // --- favorites ---
 const favoritesRaw = useUrbanStore((s) => s.favorites);
 const favoritesMap = useMemo(() => {
 if (!favoritesRaw) return {} as Record<string, true>;
 if (Array.isArray(favoritesRaw)) {
 return favoritesRaw.reduce<Record<string, true>>((acc, id) => {
 acc[id] = true;
 return acc;
 }, {});
 }
 return {} as Record<string, true>;
 }, [favoritesRaw]);

 const toggleFavorite = useCallback((id: string) => {
 useUrbanStore.getState().toggleFav(id);
 }, []);

 // --- filter state ---
 const navQuery = useUrbanStore((s) => s.query);
 const setNavQuery = useUrbanStore((s) => s.setQuery);
 const section = useUrbanStore((s) => s.section);
 const activeTagsSet = useUrbanStore((s) => s.activeTags);
 const favOnly = useUrbanStore((s) => s.favOnly);
 const activeTags = useMemo(() => Array.from(activeTagsSet), [activeTagsSet]);

 // filtered cards
 const visibleCardsFn = useUrbanStore((s) => s.visibleCards);
 const filtered: Card[] = (visibleCardsFn ? visibleCardsFn() : []) as Card[];

 // --- status ---
 const [statusMsg, setStatusMsg] = useState('');
 useEffect(() => {
 const label = (() => {
 if (section === 'all') return 'All';
 for (const g of SECTION_TREE) {
 if (g.id === section) return g.label;
 for (const c of g.children || []) if (c.id === section) return c.label;
 }
 return 'All';
 })();
 const msg = `${filtered.length} item${filtered.length === 1 ? '' : 's'} in ${label}${activeTags.length ? `; filters: ${activeTags.join(', ')}` : ''}`;
 setStatusMsg(msg);
 }, [filtered.length, section, activeTags]);

 // --- clear stale selectedCardId from localStorage ---
 useEffect(() => {
 if (selectedId && !LIBRARY_IDS.has(selectedId)) {
 if (import.meta.env.DEV) {
 console.warn('[UrbanModal] Stale selectedCardId cleared:', selectedId);
 }
 useUrbanStore.getState().clearSelection();
 }
 }, [selectedId]);

 // --- auto-select first card ---
 useEffect(() => {
 if (!selectedId) {
 const first = filtered[0]?.id ?? LIBRARY[0]?.id ?? null;
 if (first) {
 try { useUrbanStore.getState().selectCard(first); } catch { /* noop */ }
 }
 }
 }, [filtered, selectedId]);

 // --- resolved selected card ---
 const selected = useMemo(() => {
 if (selectedCard) return selectedCard as Card;
 if (!selectedId) return LIBRARY[0] ?? null;
 const inFiltered = filtered.find((c) => c.id === selectedId);
 if (inFiltered) return inFiltered;
 return LIBRARY.find((c) => c.id === selectedId) || LIBRARY[0] || null;
 }, [filtered, selectedId, selectedCard]);

 // Debug: log when selected is null
 useEffect(() => {
 if (import.meta.env.DEV && !selected) {
 console.warn('[UrbanModal] selected is NULL — selectedId:', selectedId, 'selectedCard:', selectedCard?.id ?? 'null', 'LIBRARY.length:', LIBRARY.length);
 }
 }, [selected, selectedId, selectedCard]);

 // --- card select callback ---
 const onSelectCard = useCallback((id: string) => {
 try {
 const s = useUrbanStore.getState();
 s.selectCard(id);
 s.recordView(id);
 } catch (err) {
 console.error('[UrbanModal] onSelectCard error:', err);
 }
 }, []);

 // --- refs ---
 const { trapRef } = useFocusTrap(active);
 const actionsRef = useRef<HTMLDivElement>(null);
 const liveRef = useRef<HTMLDivElement>(null);
 const searchRef = useRef<HTMLInputElement | null>(null);
 const previouslyFocused = useRef<HTMLElement | null>(null);

 // --- focus management ---
 useEffect(() => {
 if (active) {
 previouslyFocused.current = document.activeElement as HTMLElement | null;
 setTimeout(() => searchRef.current?.focus(), 60);
 } else if (previouslyFocused.current) {
 previouslyFocused.current.focus();
 }
 }, [active]);

 // --- toast ---
 const { show, Toast } = useToast();

 // --- auto-clear filters if empty ---
 useEffect(() => {
 const hasAnyFilter = activeTags.length > 0 || !!(navQuery && navQuery.trim()) || !!favOnly || section !== 'all';
 if (LIBRARY.length > 0 && filtered.length === 0 && hasAnyFilter) {
 try {
 useUrbanStore.getState().navClearFilters();
 useUrbanStore.getState().setSection('all' as SectionId);
 show('No results with saved filters — filters reset');
 } catch { /* noop */ }
 }
 }, [filtered.length, activeTags.length, navQuery, favOnly, section, show]);

 // --- payload builders ---
 const buildPayload = useCallback(() => {
 const summary = selected?.summary || '';
 const title = selected?.title || '';
 const plain = `${title}\n\n${summary}`;
 const html = `<h2>${title}</h2><p>${summary}</p>`;
 return { htmlWrapped: html, plain, htmlRaw: html };
 }, [selected]);

 const copyOut = useCallback(async () => {
 const { plain } = buildPayload();
 try { await navigator.clipboard.writeText(plain); } catch { /* noop */ }
 show('Copied to clipboard');
 }, [buildPayload, show]);

 const sendToChat = useCallback(async () => {
 const { plain, htmlWrapped } = buildPayload();
 window.dispatchEvent(
 new CustomEvent('synapse:chat:insert', {
 detail: { plainText: plain, html: htmlWrapped, meta: { cardId: selected?.id, title: selected?.title } },
 }),
 );
 try { await navigator.clipboard.writeText(plain); } catch { /* noop */ }
 show('Sent to chat (copied)');
 }, [buildPayload, selected, show]);

 const insertToEditor = useCallback(async () => {
 const { plain, htmlWrapped } = buildPayload();
 window.dispatchEvent(
 new CustomEvent('synapse:editor:insert', {
 detail: { html: htmlWrapped, plainText: plain },
 }),
 );
 try { await navigator.clipboard.writeText(plain); } catch { /* noop */ }
 show('Inserted to editor (copied)');
 }, [buildPayload, show]);

 // --- additional status-bar actions ---
 const exportCard = useCallback(() => {
 if (!selectedCard) { show('No card selected to export'); return; }
 try {
 const blob = new Blob([JSON.stringify(selectedCard, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `${(selectedCard.id || 'card').replace(/[^a-z0-9_-]+/gi, '-')}.json`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 setTimeout(() => URL.revokeObjectURL(url), 1000);
 show('Exported card JSON');
 } catch { show('Export failed'); }
 }, [selectedCard, show]);

 const shareLink = useCallback(async () => {
 const id = selectedCard?.id;
 const url = id
 ? `${window.location.origin}${window.location.pathname}#urban=${encodeURIComponent(id)}`
 : window.location.href;
 try { await navigator.clipboard.writeText(url); show('Share link copied'); }
 catch { show('Could not copy link'); }
 }, [selectedCard, show]);

 const openRecent = useCallback(() => {
 window.dispatchEvent(new CustomEvent('synapse:urban:open-recent'));
 show('Recent items');
 }, [show]);

 const refreshRecs = useCallback(() => {
 window.dispatchEvent(new CustomEvent('synapse:urban:refresh-recs'));
 show('Refreshing recommendations…');
 }, [show]);

 const openShortcuts = useCallback(() => {
 window.dispatchEvent(new CustomEvent('synapse:open-shortcuts', { detail: { source: 'urban' } }));
 show('Keyboard shortcuts');
 }, [show]);

 const toggleTheme = useCallback(() => {
 window.dispatchEvent(new CustomEvent('synapse:theme:toggle'));
 show('Theme toggled');
 }, [show]);

 const openCompare = useCallback(() => {
 window.dispatchEvent(new CustomEvent('synapse:urban:compare', { detail: { cardId: selectedCard?.id ?? null } }));
 show('Compare mode');
 }, [selectedCard, show]);

 // --- backdrop click ---
 const backdropClick = useCallback(
 (e: React.MouseEvent<HTMLDivElement>) => {
 if (e.target === e.currentTarget) setOpen(false);
 },
 [setOpen],
 );

 // --- keyboard: escape / shortcuts ---
 useEffect(() => {
 if (!active) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === 'Escape') setOpen(false);
 const meta = e.metaKey || e.ctrlKey;
 if (meta && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
 e.preventDefault();
 copyOut();
 }
 };
 window.addEventListener('keydown', onKey);
 return () => window.removeEventListener('keydown', onKey);
 }, [active, setOpen, copyOut]);

 // --- focus trap: shared useFocusTrap(active) (MFP-13) listens at document level,
 // so it recaptures focus that escapes the panel (fixes UA1) and restores the opener. ---

 // --- announce ---
 function announce(msg: string) {
 if (!liveRef.current) return;
 liveRef.current.textContent = msg;
 setTimeout(() => {
 if (liveRef.current) liveRef.current.textContent = '';
 }, 1500);
 }

 // --- platform detection (used by status bar + key handler) ---
 const isMac = useMemo(() => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac'), []);

 const onModalKeyDown = useCallback(
 (e: React.KeyboardEvent) => {
 const k = e.key.toLowerCase();
 const mod = isMac ? e.metaKey : e.ctrlKey;
 if (k === 'escape') return;
 if (mod && k === 'enter') { e.preventDefault(); sendToChat(); announce('Sent to Chat'); }
 if (e.altKey && k === 'enter') { e.preventDefault(); insertToEditor(); announce('Inserted to Editor'); }
 if (mod && e.shiftKey && k === 'c') { e.preventDefault(); copyOut(); announce('Copied'); }
 },
 [isMac, sendToChat, insertToEditor, copyOut],
 );

 // --- map explorer ---
 const openMap = useMapExplorerStore((s: MapExplorerState) => s.open);
 const toggleMap = useMapExplorerStore((s: MapExplorerState) => s.toggle);

 useEffect(() => {
 if (!active) return undefined;
 const onKey = (e: KeyboardEvent) => {
 if ((e.key === 'm' || e.key === 'M') && e.shiftKey && (e.ctrlKey || e.metaKey)) {
 e.preventDefault();
 e.stopPropagation();
 toggleMap();
 }
 };
 window.addEventListener('keydown', onKey, { capture: true });
 return () => window.removeEventListener('keydown', onKey, { capture: true });
 }, [active, toggleMap]);

 useEffect(() => {
 if (!active) return undefined;
 return subscribeMapContextToUrban({
 debounceMs: 120,
 triggerRecommendations: true,
 runInitialSync: true,
 });
 }, [active]);

 // --- bail if not active ---
 if (!active && !isClosing) return null;

 // --- render ---
 const node = (
 <div
 ref={trapRef}
 role="dialog"
 aria-modal
 aria-labelledby="urban-modal-title"
 aria-describedby="urban-modal-desc urban-results-status"
 onMouseDown={backdropClick}
 onKeyDown={onModalKeyDown}
 className="urban-v2"
 style={{
 position: 'fixed',
 inset: 0,
 background: 'var(--syn-surface-workbench)',
 color: 'var(--syn-text-default)',
 // Sits one tier below the shared modal level (10050) so Map Explorer
 // and other modal-tier overlays opened FROM Urban Analytics layer above.
 // Toasts (10080), tooltips (10070), popovers (10060) still win.
 zIndex: 10049,
 display: 'flex',
 flexDirection: 'column',
 height: '100vh',
 maxHeight: '100vh',
 overflow: 'hidden',
 fontFamily: 'var(--codefont)',
 animation: isClosing
 ? 'urbanModalFadeOut 0.3s ease-out forwards'
 : 'urbanModalFadeIn 0.3s ease-out forwards',
 opacity: isClosing ? 1 : 0,
 }}
 >
 {/* A11y hidden title */}
 <h1
 id="urban-modal-title"
 style={{
 position: 'absolute', width: 1, height: 1, margin: 0, padding: 0,
 overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)',
 whiteSpace: 'nowrap', border: 0,
 }}
 >
 Urban Analytics Workbench
 </h1>
 <p
 id="urban-modal-desc"
 style={{
 position: 'absolute', width: 1, height: 1, margin: 0, padding: 0,
 overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)',
 whiteSpace: 'nowrap', border: 0,
 }}
 >
 Spatial intelligence platform — methods, indicators, tools, and analysis workflows for urban scientists and planners.
 </p>
 <div aria-live="polite" aria-atomic="true" ref={liveRef} className="visually-hidden" />

 {/* Fused premium command bar: brand + study area + search + context pills + actions */}
 <UrbanCommandBar
 navQuery={navQuery}
 onNavQueryChange={setNavQuery}
 filteredCount={filtered.length}
 searchRef={searchRef}
 onOpenMap={() => {
 openMap();
 setOpen(false);
 }}
 workspaceLayoutExpanded={workspaceLayoutExpanded}
 onToggleWorkspaceLayout={toggleWorkspaceLayoutExpanded}
 onClose={() => setOpen(false)}
 />
 {/* Status */}
 <div id="urban-results-status" role="status" aria-live="polite" className="visually-hidden">
 {statusMsg}
 </div>

 {/* Inline styles */}
 <style dangerouslySetInnerHTML={{ __html: MODAL_CSS }} />

 {/* 3-column layout */}
 <section
 className="urban-shell"
 data-center-tab={activeCenterTab}
 data-workspace-layout={compactToolboxShell ? 'expanded' : undefined}
 style={{
 flex: '1 1 auto',
 minHeight: 0,
 position: 'relative',
 ['--left-w' as string]: compactToolboxShell ? '280px' : '500px',
 ['--right-w' as string]: compactToolboxShell ? '420px' : '600px',
 }}
 >
 {/* Left Rail */}
 <div className="leftRail">
 <RailContainer
 cards={LIBRARY}
 favorites={favoritesMap}
 toggleFavorite={toggleFavorite}
 onSelectCard={onSelectCard}
 activeTags={activeTags}
 onToggleTag={(tag: string) => useUrbanStore.getState().toggleTag(tag as UrbanTag)}
 {...(selectedId ? { selectedCardId: selectedId } : {})}
 />
 </div>

 {/* Center Panel */}
 <div className="midCol" aria-hidden={false} style={{ pointerEvents: 'auto', overflow: 'hidden', minHeight: 0 }}>
 <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
 <CenterPanelShell
 title="Urban Analytics"
 subtitle="Spatial Intelligence Platform — Methods & Analysis"
 outlineSlot={<OutlineNav />}
 />
 </div>
 </div>

 {/* Right Panel */}
 <aside className="rightPane" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
 <div className="rightPane__content" style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
 <ChunkLoadBoundary
 title="Right panel unavailable"
 message="The detail panel could not be loaded. Retry after the dev server reconnects, or reload the app if the issue persists."
 >
 <Suspense fallback={<div style={{ padding: 20, opacity: 0.5 }}>Loading panel…</div>}>
 <RightPanelBoundary
 key={selected?.id ?? '__empty'}
 card={selected}
 onClose={() => useUrbanStore.getState().clearSelection()}
 />
 </Suspense>
 </ChunkLoadBoundary>
 </div>
 <UrbanEvidenceTray variant="right-rail" />
 </aside>
 </section>

 {/* Bottom status bar — premium VS Code style, color-coded actions */}
 <StatusBar
 selected={selected}
 favoritesMap={favoritesMap}
 filteredCount={filtered.length}
 totalCount={LIBRARY.length}
 isMac={isMac}
 onSendToChat={sendToChat}
 onInsertToEditor={insertToEditor}
 onCopy={copyOut}
 onExport={exportCard}
 onShare={shareLink}
 onCompare={openCompare}
 onToggleFavorite={toggleFavorite}
 onPrint={() => window.print()}
 onFocusSearch={() => searchRef.current?.focus()}
 onOpenRecent={openRecent}
 onRefresh={refreshRecs}
 onOpenShortcuts={openShortcuts}
 onToggleTheme={toggleTheme}
 onClose={() => setOpen(false)}
 onToggleMap={toggleMap}
 actionsRef={actionsRef}
 />
 <Toast />

 {/* Utility styles */}
 <style>{`
 .sr-only { position:absolute !important; left:-10000px !important; width:1px !important; height:1px !important; padding:0 !important; margin:-1px !important; overflow:hidden !important; clip:rect(0 0 0 0) !important; white-space:nowrap !important; border:0 !important; }
 .visually-hidden { position:absolute !important; width:1px !important; height:1px !important; padding:0 !important; margin:-1px !important; overflow:hidden !important; clip:rect(0 0 0 0) !important; white-space:nowrap !important; border:0 !important; }
 `}</style>
 </div>
 );

 return createPortal(node, document.body);
}

interface StatusBarProps {
 selected: Card | null;
 favoritesMap: Record<string, boolean>;
 filteredCount: number;
 totalCount: number;
 isMac: boolean;
 onSendToChat: () => void;
 onInsertToEditor: () => void;
 onCopy: () => void;
 onExport: () => void;
 onShare: () => void;
 onCompare: () => void;
 onToggleFavorite: (id: string) => void;
 onPrint: () => void;
 onFocusSearch: () => void;
 onOpenRecent: () => void;
 onRefresh: () => void;
 onOpenShortcuts: () => void;
 onToggleTheme: () => void;
 onClose: () => void;
 onToggleMap: () => void;
 actionsRef: React.RefObject<HTMLDivElement | null>;
}

function StatusBar({ selected, favoritesMap, filteredCount, totalCount, isMac, onSendToChat, onInsertToEditor, onCopy, onExport, onShare, onCompare, onToggleFavorite, onPrint, onFocusSearch, onOpenRecent, onRefresh, onOpenShortcuts, onToggleTheme, onClose, onToggleMap, actionsRef }: StatusBarProps): React.ReactElement {
 const [now, setNow] = useState(() => new Date());
 useEffect(() => {
 const id = window.setInterval(() => setNow(new Date()), 1000 * 30);
 return () => window.clearInterval(id);
 }, []);
 const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 const isFavorited = !!(selected?.id && favoritesMap[selected.id]);
 const mod = isMac ? '⌘' : 'Ctrl';
 const cardCategory = (selected as unknown as { category?: string; group?: string } | null)?.category
   ?? (selected as unknown as { category?: string; group?: string } | null)?.group
   ?? null;

 return (
 <div role="toolbar" aria-label="Actions" className="ua-statusbar" ref={actionsRef} style={{ flex: '0 0 auto' }}>
 {/* LEFT: live status + context + telemetry */}
 <div className="ua-sb__left">
 <span className={`ua-sb__dot ${selected ? 'ua-sb__dot--live' : 'ua-sb__dot--idle'}`} aria-hidden="true" />
 {selected ? (
 <>
 <span className="ua-sb__ctx" title={selected.title}>{selected.title}</span>
 {cardCategory ? <span className="ua-sb__sep" aria-hidden="true">·</span> : null}
 {cardCategory ? <span className="ua-sb__meta">{cardCategory}</span> : null}
 {isFavorited ? <span className="ua-sb__chip ua-sb__chip--warn" title="Favorited">★ STARRED</span> : null}
 </>
 ) : (
 <span className="ua-sb__ctx ua-sb__ctx--muted">No selection</span>
 )}
 <span className="ua-sb__divider" aria-hidden="true" />
 <span className="ua-sb__badge ua-sb__badge--info" title={`${filteredCount} of ${totalCount} cards visible`}>
 <span className="ua-sb__badgeDot" aria-hidden="true" />
 {filteredCount}<span style={{ opacity: 0.5 }}>/{totalCount}</span>
 </span>
 </div>

 {/* CENTER: primary color-coded actions */}
 <div className="ua-sb__center">
 <button className="ua-sb__btn ua-sb__btn--info" onClick={onSendToChat} title={`Send to Chat (${mod}+Enter)`}>
 <IconSend aria-hidden="true" />
 <span className="ua-sb__label">Send to Chat</span>
 <kbd className="ua-sb__kbd">{mod}↵</kbd>
 </button>
 <button className="ua-sb__btn ua-sb__btn--violet" onClick={onInsertToEditor} title="Insert to Editor (Alt+Enter)">
 <IconCode aria-hidden="true" />
 <span className="ua-sb__label">Insert</span>
 <kbd className="ua-sb__kbd">⌥↵</kbd>
 </button>
 <button className="ua-sb__btn ua-sb__btn--cyan" onClick={onCopy} title={`Copy (${mod}+Shift+C)`}>
 <IconCopy aria-hidden="true" />
 <span className="ua-sb__label">Copy</span>
 <kbd className="ua-sb__kbd">{mod}⇧C</kbd>
 </button>
 <button className="ua-sb__btn ua-sb__btn--success" onClick={onExport} title={`Export card JSON (${mod}+E)`}>
 <span className="ua-sb__icoSym" aria-hidden="true">↓</span>
 <span className="ua-sb__label">Export</span>
 <kbd className="ua-sb__kbd">{mod}E</kbd>
 </button>
 <button className="ua-sb__btn ua-sb__btn--teal" onClick={onShare} title={`Copy share link (${mod}+L)`}>
 <span className="ua-sb__icoSym" aria-hidden="true">↗</span>
 <span className="ua-sb__label">Share</span>
 <kbd className="ua-sb__kbd">{mod}L</kbd>
 </button>

 <span className="ua-sb__divider" aria-hidden="true" />

 {/* Icon-only quick toggles */}
 {selected ? (
 <button
 className={`ua-sb__btn ua-sb__btn--icon ua-sb__btn--warn ${isFavorited ? 'is-active' : ''}`}
 onClick={() => onToggleFavorite(selected.id)}
 aria-pressed={isFavorited}
 title={isFavorited ? 'Unstar' : 'Star this card'}
 >
 <span aria-hidden="true">★</span>
 </button>
 ) : null}
 <button className="ua-sb__btn ua-sb__btn--icon ua-sb__btn--pink" onClick={onCompare} title="Compare with another card">
 <span aria-hidden="true">⇄</span>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon ua-sb__btn--info" onClick={onToggleMap} title={`Toggle Map (${mod}+Shift+M)`}>
 <span aria-hidden="true">⌖</span>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon" onClick={onPrint} title="Print">
 <IconPrint aria-hidden="true" />
 </button>
 </div>

 {/* RIGHT: utilities + telemetry + close */}
 <div className="ua-sb__right">
 <button className="ua-sb__btn ua-sb__btn--ghost" onClick={onFocusSearch} title={`Focus Search (${mod}+K)`}>
 <span className="ua-sb__icoSym" aria-hidden="true">⌕</span>
 <span className="ua-sb__label">Search</span>
 <kbd className="ua-sb__kbd">{mod}K</kbd>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon" onClick={onOpenRecent} title={`Recent items (${mod}+P)`}>
 <span aria-hidden="true">◷</span>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon" onClick={onRefresh} title={`Refresh recommendations (${mod}+R)`}>
 <span aria-hidden="true">↻</span>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon" onClick={onToggleTheme} title="Toggle theme">
 <span aria-hidden="true">◐</span>
 </button>
 <button className="ua-sb__btn ua-sb__btn--icon" onClick={onOpenShortcuts} title={`Keyboard shortcuts (${mod}+/)`}>
 <span aria-hidden="true">?</span>
 </button>

 <span className="ua-sb__divider" aria-hidden="true" />

 <span className="ua-sb__hint ua-sb__hint--accent" title="Urban Analytics workbench">UA</span>
 <span className="ua-sb__hint ua-sb__hint--mono" title="Local time">{timeLabel}</span>

 <span className="ua-sb__divider" aria-hidden="true" />

 <button className="ua-sb__btn ua-sb__btn--icon ua-sb__btn--danger" onClick={onClose} title="Close (Esc)">
 <span aria-hidden="true">✕</span>
 </button>
 </div>
 </div>
 );
}

// ---------------------------------------------------------------------------
// Inline CSS — UrbanAnalyticsModal style block
// ---------------------------------------------------------------------------

const MODAL_CSS = `
@keyframes urbanModalFadeIn {
 from { opacity: 0; transform: scale(0.98); }
 to { opacity: 1; transform: scale(1); }
}
@keyframes urbanModalFadeOut {
 from { opacity: 1; transform: scale(1); }
 to { opacity: 0; transform: scale(0.98); }
}

:root {
 --bg:var(--syn-surface-workbench); --panel:var(--syn-surface-panel); --panel-2:var(--syn-surface-elevated);
 --text:var(--syn-text-default); --muted:var(--syn-text-muted);
 --line:var(--syn-border-subtle);
 --accent:var(--syn-interaction-active); --accent-weak:color-mix(in srgb, var(--syn-interaction-active) 14%, transparent);
 --accent-rgb:55,148,255;
 --brand-fx:none;
 --codefont: "JetBrains Mono","Fira Code",ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
 --ua-focus-ring: 0 0 0 1px var(--syn-border-focus);
 --ua-focus-ring-offset: 0 0 0 1px var(--syn-surface-workbench), 0 0 0 2px var(--syn-border-focus);
}

.urban-v2, .urban-v2 * { box-sizing:border-box; }
.urban-v2 { font-family: var(--codefont); }

.urban-v2 .urban-shell {
 display: grid;
 grid-template-columns: var(--left-w) minmax(0,1fr) var(--right-w);
 gap: 0;
 width: 100vw;
 max-width: 100vw;
 overflow-x: hidden;
 height: 100%;
 transition: grid-template-columns 180ms cubic-bezier(.2,.75,.25,1);
}

.urban-v2 .leftRail {
 grid-column: 1;
 position: relative;
 z-index: 1;
 height: 100%;
 overflow-y: auto;
 background: var(--syn-surface-navigation) !important;
 border-right: 1px solid var(--syn-border-subtle);
}

.urban-v2 .midCol {
 grid-column: 2;
 min-width: 0;
 width: auto;
 max-width: none;
 pointer-events: auto;
 position: relative;
 z-index: 0;
}
.urban-v2 .midCol::before,
.urban-v2 .midCol::after {
 content: none !important;
}

.urban-v2 .rightPane {
 grid-column: 3;
 position: relative;
 z-index: 1;
 min-width: var(--right-w);
 max-width: var(--right-w);
 width: var(--right-w);
 background: var(--syn-surface-panel) !important;
 border-left: 1px solid var(--syn-border-subtle);
}

.urban-v2 .rightPane__content {
 scrollbar-width: thin;
 scrollbar-color: color-mix(in srgb, var(--syn-text-muted) 28%, transparent) transparent;
}
.urban-v2 .rightPane__content::-webkit-scrollbar {
 width: 10px;
}
.urban-v2 .rightPane__content::-webkit-scrollbar-track {
 background: transparent;
}
.urban-v2 .rightPane__content::-webkit-scrollbar-thumb {
 background: color-mix(in srgb, var(--syn-text-muted) 22%, transparent);
 border: 2px solid transparent;
 background-clip: padding-box;
 border-radius: 6px;
}
.urban-v2 .rightPane__content::-webkit-scrollbar-thumb:hover {
 background: color-mix(in srgb, var(--syn-text-muted) 38%, transparent);
 background-clip: padding-box;
}

.urban-v2 .urban-shell[data-workspace-layout="expanded"] .leftRail,
.urban-v2 .urban-shell[data-workspace-layout="expanded"] .rightPane {
 transition:
  width 180ms cubic-bezier(.2,.75,.25,1),
  min-width 180ms cubic-bezier(.2,.75,.25,1),
  max-width 180ms cubic-bezier(.2,.75,.25,1);
}

.urban-v2 .urban-shell[data-workspace-layout="expanded"] .midCol {
 box-shadow:
  inset 1px 0 0 var(--syn-border-subtle),
  inset -1px 0 0 var(--syn-border-subtle);
}

/* Accent line */
.accentline {
 position: fixed; top:0; left:0; right:0; height:2px; z-index:2147483648;
 pointer-events: none;
 background: var(--syn-interaction-active);
}

/* Rail */
.rail { padding:12px; overflow-y:auto; background:var(--panel); }
.railbtn { width:100%; text-align:left; padding:8px 10px; border-radius:3px; border:1px solid transparent; background:transparent; color:var(--text); cursor:pointer; font-size:13px; font-family: var(--codefont); }
.railbtn:hover { background:var(--syn-interaction-hover); }
.railbtn.is-on { background:transparent; border-color:transparent; color:var(--accent); box-shadow:inset 2px 0 0 var(--accent); }
.railbtn--child { font-size:12.5px; padding:6px 10px; background:transparent; }
.railbtn--child.is-on { background:transparent; color:var(--accent); box-shadow:inset 2px 0 0 var(--accent); }
.rail__empty { font-size:12px; opacity:.6; }

/* ============================================================
   UA Status Bar — premium VS Code style, color-coded actions
   ============================================================ */
.ua-statusbar {
 /* color tokens local to status bar — fallbacks make it work regardless of theme */
 --uasb-info:   #4c9aff;
 --uasb-violet: #a78bfa;
 --uasb-cyan:   #22d3ee;
 --uasb-teal:   #2dd4bf;
 --uasb-success:#22c55e;
 --uasb-warn:   #f59e0b;
 --uasb-pink:   #ec4899;
 --uasb-danger: #ef4444;
 --uasb-accent: var(--syn-status-info, #4c9aff);

 border-top: 1px solid color-mix(in srgb, var(--uasb-accent) 35%, var(--syn-border-default, rgba(255,255,255,0.18)));
 background:
   linear-gradient(180deg,
     color-mix(in srgb, var(--syn-surface-navigation) 90%, #000),
     color-mix(in srgb, var(--syn-surface-navigation) 78%, #000)
   );
 display: grid;
 grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
 align-items: stretch;
 padding: 0 calc(0px + env(safe-area-inset-bottom, 0px));
 min-height: 26px;
 height: 26px;
 box-sizing: border-box;
 font-size: 11px;
 line-height: 1;
 color: var(--syn-text-secondary);
 user-select: none;
 font-family: var(--codefont);
 position: relative;
 box-shadow: 0 -2px 12px -4px color-mix(in srgb, var(--uasb-accent) 25%, transparent);
}
.ua-statusbar::before {
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 height: 1px;
 background: linear-gradient(90deg,
   transparent 0%,
   color-mix(in srgb, var(--uasb-info) 50%, transparent) 20%,
   color-mix(in srgb, var(--uasb-violet) 60%, transparent) 40%,
   color-mix(in srgb, var(--uasb-success) 60%, transparent) 60%,
   color-mix(in srgb, var(--uasb-warn) 50%, transparent) 80%,
   transparent 100%
 );
 pointer-events: none;
}
.ua-sb__left, .ua-sb__center, .ua-sb__right {
 display: flex;
 align-items: center;
 height: 100%;
 min-width: 0;
}
.ua-sb__left { justify-content: flex-start; gap: 4px; padding-left: 6px; }
.ua-sb__center { justify-content: center; gap: 0; }
.ua-sb__right { justify-content: flex-end; gap: 2px; padding-right: 2px; }

/* Live status dot — pulse animation when active */
.ua-sb__dot {
 width: 6px;
 height: 6px;
 border-radius: 50%;
 background: var(--syn-text-tertiary, #6c7080);
 flex-shrink: 0;
 margin-right: 4px;
 transition: background 200ms ease, box-shadow 200ms ease;
}
.ua-sb__dot--live {
 background: var(--uasb-success);
 box-shadow: 0 0 4px color-mix(in srgb, var(--uasb-success) 80%, transparent);
 animation: uaSbPulse 2.2s ease-out infinite;
}
@keyframes uaSbPulse {
 0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--uasb-success) 60%, transparent), 0 0 4px var(--uasb-success); }
 70%  { box-shadow: 0 0 0 6px color-mix(in srgb, var(--uasb-success) 0%, transparent), 0 0 4px var(--uasb-success); }
 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--uasb-success) 0%, transparent), 0 0 4px var(--uasb-success); }
}
.ua-sb__dot--idle { background: var(--syn-text-tertiary, #6c7080); }

/* Context label — selected card title */
.ua-sb__ctx {
 font-size: 11px;
 font-weight: 500;
 color: var(--syn-text-default);
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
 max-width: 320px;
 letter-spacing: 0.01em;
}
.ua-sb__ctx--muted { color: var(--syn-text-tertiary, #6c7080); font-style: italic; font-weight: 400; }

.ua-sb__sep {
 color: var(--syn-text-tertiary, #6c7080);
 opacity: 0.5;
 padding: 0 4px;
 font-size: 10px;
}
.ua-sb__meta {
 font-size: 10.5px;
 color: var(--syn-text-secondary);
 font-weight: 400;
 white-space: nowrap;
 font-variant-numeric: tabular-nums;
}
.ua-sb__chip {
 display: inline-flex;
 align-items: center;
 padding: 0 6px;
 height: 16px;
 margin-left: 4px;
 border-radius: 3px;
 font-size: 9.5px;
 line-height: 1;
 white-space: nowrap;
 letter-spacing: 0.08em;
 font-weight: 700;
 text-transform: uppercase;
}
.ua-sb__chip--warn {
 background: color-mix(in srgb, var(--uasb-warn) 22%, transparent);
 color: var(--uasb-warn);
 border: 1px solid color-mix(in srgb, var(--uasb-warn) 40%, transparent);
}

/* Count badge in left section */
.ua-sb__badge {
 display: inline-flex;
 align-items: center;
 gap: 4px;
 padding: 0 7px;
 height: 17px;
 border-radius: 3px;
 font-size: 10.5px;
 line-height: 1;
 font-weight: 600;
 font-variant-numeric: tabular-nums;
 white-space: nowrap;
 letter-spacing: 0.02em;
}
.ua-sb__badge--info {
 background: color-mix(in srgb, var(--uasb-info) 16%, transparent);
 color: var(--uasb-info);
 border: 1px solid color-mix(in srgb, var(--uasb-info) 35%, transparent);
}
.ua-sb__badgeDot {
 width: 5px;
 height: 5px;
 border-radius: 50%;
 background: currentColor;
 flex-shrink: 0;
 box-shadow: 0 0 4px currentColor;
}

/* Buttons — flat with per-action accent colors, hover fill + glow */
.ua-sb__btn {
 --btn-accent: var(--syn-text-secondary);
 display: inline-flex;
 align-items: center;
 gap: 4px;
 padding: 0 9px;
 height: 100%;
 border: 0;
 background: transparent;
 color: var(--syn-text-secondary);
 font-size: 11px;
 font-family: var(--codefont);
 font-weight: 500;
 line-height: 1;
 cursor: pointer;
 white-space: nowrap;
 transition: background 100ms ease, color 100ms ease, box-shadow 120ms ease, transform 60ms ease;
 border-radius: 0;
 position: relative;
}
.ua-sb__btn:hover:not(:disabled) {
 background: color-mix(in srgb, var(--btn-accent) 18%, transparent);
 color: var(--btn-accent);
}
.ua-sb__btn:active:not(:disabled) {
 background: color-mix(in srgb, var(--btn-accent) 30%, transparent);
 transform: translateY(0.5px);
}
.ua-sb__btn:focus-visible {
 outline: none;
 box-shadow: inset 0 -2px 0 var(--btn-accent);
}
.ua-sb__btn svg { width: 12px; height: 12px; flex-shrink: 0; opacity: 0.85; }
.ua-sb__btn:hover svg { opacity: 1; }
.ua-sb__btn:hover svg, .ua-sb__btn:hover .ua-sb__icoSym { color: var(--btn-accent); }
.ua-sb__icoSym {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 font-size: 13px;
 line-height: 1;
 font-weight: 700;
 width: 12px;
}

/* Bottom underline on hover for labeled buttons */
.ua-sb__btn:not(.ua-sb__btn--icon)::after {
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 bottom: 0;
 height: 2px;
 background: var(--btn-accent);
 opacity: 0;
 transform: scaleX(0.4);
 transform-origin: center;
 transition: opacity 140ms ease, transform 140ms ease;
}
.ua-sb__btn:not(.ua-sb__btn--icon):hover::after {
 opacity: 0.9;
 transform: scaleX(1);
}

/* Color variants — each action group gets a semantic accent */
.ua-sb__btn--info     { --btn-accent: var(--uasb-info); }
.ua-sb__btn--violet   { --btn-accent: var(--uasb-violet); }
.ua-sb__btn--cyan     { --btn-accent: var(--uasb-cyan); }
.ua-sb__btn--teal     { --btn-accent: var(--uasb-teal); }
.ua-sb__btn--success  { --btn-accent: var(--uasb-success); }
.ua-sb__btn--warn     { --btn-accent: var(--uasb-warn); }
.ua-sb__btn--pink     { --btn-accent: var(--uasb-pink); }
.ua-sb__btn--danger   { --btn-accent: var(--uasb-danger); }

/* Tint the icon by default for color-variant labeled buttons */
.ua-sb__btn--info svg, .ua-sb__btn--info .ua-sb__icoSym         { color: var(--uasb-info); opacity: 1; }
.ua-sb__btn--violet svg, .ua-sb__btn--violet .ua-sb__icoSym     { color: var(--uasb-violet); opacity: 1; }
.ua-sb__btn--cyan svg, .ua-sb__btn--cyan .ua-sb__icoSym         { color: var(--uasb-cyan); opacity: 1; }
.ua-sb__btn--teal svg, .ua-sb__btn--teal .ua-sb__icoSym         { color: var(--uasb-teal); opacity: 1; }
.ua-sb__btn--success svg, .ua-sb__btn--success .ua-sb__icoSym   { color: var(--uasb-success); opacity: 1; }

/* Icon buttons (no label, no underline animation) */
.ua-sb__btn--icon {
 padding: 0 7px;
 min-width: 26px;
 justify-content: center;
 font-size: 13px;
 font-weight: 700;
}

/* Active state (e.g. starred) */
.ua-sb__btn.is-active {
 color: var(--uasb-warn);
 background: color-mix(in srgb, var(--uasb-warn) 18%, transparent);
}
.ua-sb__btn.is-active::after { opacity: 1; transform: scaleX(1); background: var(--uasb-warn); }

.ua-sb__btn--ghost { color: var(--syn-text-tertiary, #6c7080); }
.ua-sb__btn--ghost:hover { color: var(--syn-text-default); background: var(--syn-interaction-hover, rgba(255,255,255,0.10)); }

.ua-sb__btn--danger:hover { background: color-mix(in srgb, var(--uasb-danger) 25%, transparent); color: #fff; }

.ua-sb__label { font-weight: 500; letter-spacing: 0.01em; }

/* Keyboard shortcut chips */
.ua-sb__kbd {
 display: inline-flex;
 align-items: center;
 padding: 1px 4px;
 margin-left: 3px;
 font-family: var(--codefont);
 font-size: 9.5px;
 line-height: 1;
 color: var(--syn-text-tertiary, #6c7080);
 background: color-mix(in srgb, var(--syn-surface-elevated, #1a1a1a) 70%, transparent);
 border: 1px solid var(--syn-border-subtle, rgba(255,255,255,0.10));
 border-radius: 2px;
 letter-spacing: 0.04em;
 font-variant-numeric: tabular-nums;
 transition: color 80ms ease, border-color 80ms ease, background 80ms ease;
}
.ua-sb__btn:hover .ua-sb__kbd {
 color: var(--syn-text-default);
 border-color: var(--syn-border-default, rgba(255,255,255,0.18));
 background: color-mix(in srgb, var(--syn-surface-elevated, #1a1a1a) 90%, transparent);
}

.ua-sb__divider {
 width: 1px;
 height: 12px;
 margin: 0 4px;
 background: var(--syn-border-subtle, rgba(255,255,255,0.10));
 align-self: center;
 flex-shrink: 0;
}

.ua-sb__hint {
 display: inline-flex;
 align-items: center;
 padding: 0 5px;
 height: 16px;
 font-size: 9.5px;
 font-weight: 700;
 letter-spacing: 0.06em;
 color: var(--syn-text-tertiary, #6c7080);
 text-transform: uppercase;
 cursor: default;
 transition: color 80ms ease;
}
.ua-sb__hint:hover { color: var(--syn-text-secondary); }
.ua-sb__hint--mono {
 font-variant-numeric: tabular-nums;
 text-transform: none;
 letter-spacing: 0.02em;
 color: var(--syn-text-secondary);
}
.ua-sb__hint--accent {
 color: var(--uasb-accent);
 background: color-mix(in srgb, var(--uasb-accent) 14%, transparent);
 border: 1px solid color-mix(in srgb, var(--uasb-accent) 28%, transparent);
 border-radius: 3px;
 padding: 0 6px;
 height: 16px;
}

/* Legacy compatibility (Toast etc.) */
.btnline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.btnpill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:3px; border:1px solid transparent; background:transparent; color:var(--syn-text-secondary); font-size:12px; cursor:pointer; font-family: var(--codefont); }
.btnpill:hover { background:var(--syn-interaction-hover); color:var(--syn-text-default); }

/* Responsive */
@media (max-width: 1200px) {
 .ua-sb__btn--ghost .ua-sb__label { display: none; }
}
@media (max-width: 1024px) {
 .ua-sb__label { display: none; }
 .ua-sb__btn { padding: 0 5px; }
 .ua-sb__hint:not(.ua-sb__hint--mono) { display: none; }
}
@media (max-width: 820px) {
 .ua-sb__kbd { display: none; }
 .ua-sb__ctx { max-width: 140px; }
 .ua-sb__meta { display: none; }
}
@media (max-width: 640px) {
 .ua-sb__left .ua-sb__ctx { display: none; }
 .ua-sb__hint--mono { display: none; }
}

/* Icon button */
.iconbtn { width:28px; height:28px; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; border:1px solid transparent; background:transparent; color:var(--text); cursor:pointer; }
.iconbtn:hover { background:var(--syn-interaction-hover); border-color:var(--syn-border-subtle); }
.iconbtn--close { margin-left:4px; }

/* Tag */
.tag { font-size:11.5px; padding:3px 8px; border-radius:3px; border:1px solid var(--syn-border-subtle); background:var(--syn-surface-elevated); }

/* Library */
.library { border-left:1px solid var(--line); border-right:1px solid var(--line); }

/* Right panel */
.rp-panel { background: var(--panel); }

/* Search in command bar */
.neuro-commandbar .search { flex:1; position:relative; display:flex; align-items:center; gap:6px; background:var(--syn-surface-input); border:1px solid var(--syn-border-subtle); padding:4px 10px; border-radius:3px; }
.neuro-commandbar .search input { flex:1; background:transparent; border:none; font-size:13px; color:var(--syn-text-default); outline:none; min-width:0; font-family: var(--codefont); }

/* Responsive */
@media (max-width:1024px) {
 .urban-v2 .leftRail, .urban-v2 .midCol { display:none; }
 .urban-v2 .urban-shell { grid-template-columns:1fr; }
 .urban-v2 .rightPane { grid-column:1; min-width:0; max-width:100%; width:100%; }
}

/* Focus-visible rings — shared tokens for all Urban Analytics interactive elements */
.urban-v2 button:focus-visible,
.urban-v2 [role="button"]:focus-visible,
.urban-v2 input:focus-visible,
.urban-v2 select:focus-visible,
.urban-v2 [tabindex="0"]:focus-visible {
 outline: none;
 box-shadow: var(--ua-focus-ring);
}
.urban-v2 .btnpill:focus-visible,
.urban-v2 .iconbtn:focus-visible,
.urban-v2 .ua-iconbtn:focus-visible {
 outline: none;
 box-shadow: var(--ua-focus-ring-offset);
}
.urban-v2 .railbtn:focus-visible,
.urban-v2 .urban-rail__itemBtn:focus-visible,
.urban-v2 .urban-rail__groupBtn:focus-visible {
 outline: none;
 box-shadow: var(--ua-focus-ring);
}

@media print {
 .bottombar, .ua-statusbar, .iconbtn, .accentline { display: none !important; }
 body { color:#000 !important; }
}
`;
