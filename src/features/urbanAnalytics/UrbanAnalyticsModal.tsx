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
import { MapExplorerButton } from '@/centerpanel/components/MapExplorerButton';
import { type MapExplorerState, useMapExplorerStore } from '@/stores/useMapExplorerStore';

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
 background: 'rgba(0,0,0,.85)',
 color: '#fff',
 padding: '8px 12px',
 borderRadius: 10,
 fontSize: 12,
 // Toast tier matches Toaster.css .ai-toaster-layer (10080).
 zIndex: 10080,
 border: '1px solid rgba(255,255,255,.15)',
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
@keyframes ua-brand-shimmer {
 0% { background-position: 0% center; }
 100% { background-position: 200% center; }
}
@keyframes ua-brand-glow {
 0%,100% { box-shadow: 0 0 0 rgba(251,191,36,0); }
 50% { box-shadow: 0 0 12px rgba(251,191,36,0.18); }
}
@keyframes ua-brand-sheen {
 0% { opacity: 0.5; transform: translateX(-8px); }
 50% { opacity: 1; transform: translateX(0); }
 100% { opacity: 0.5; transform: translateX(8px); }
}
@keyframes ua-area-glow {
 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
 50% { box-shadow: 0 0 8px 2px rgba(245,158,11,0.18); }
}
@keyframes ua-area-pulse {
 0%,100% { opacity: 1; }
 50% { opacity: 0.7; }
}
@keyframes ua-slide-in {
 from { opacity: 0; transform: translateY(-4px); }
 to { opacity: 1; transform: translateY(0); }
}
.ua-area-set {
 animation: ua-area-glow 3s ease-in-out infinite;
}
.ua-area-unset {
 animation: ua-area-pulse 2.5s ease-in-out infinite;
}
.ua-chip {
 display: inline-flex;
 align-items: center;
 gap: 3px;
 padding: 1px 6px;
 border-radius: 999px;
 font-size: 10px;
 white-space: nowrap;
 font-family: var(--codefont);
 line-height: 1.3;
 transition: opacity 0.15s;
}
.ua-chip:hover { opacity: 0.8; }
.ua-area-input {
 animation: ua-slide-in 0.12s ease;
 background: rgba(245,158,11,0.08);
 border: 1px solid rgba(245,158,11,0.35);
 border-radius: 5px;
 padding: 2px 8px;
 font-size: 12px;
 font-family: var(--codefont);
 color: #FAFAF9;
 outline: none;
 width: 220px;
 transition: border-color 0.15s, box-shadow 0.15s;
}
.ua-area-input:focus {
 border-color: rgba(245,158,11,0.7);
 box-shadow: 0 0 0 2px rgba(245,158,11,0.12);
}
.ua-iconbtn {
 background: none;
 border: none;
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 6px;
 transition: background 0.12s, opacity 0.12s;
 opacity: 0.7;
}
.ua-iconbtn:hover { background: rgba(255,255,255,0.08); opacity: 1; }
.ua-brand-shell {
 display: inline-flex;
 align-items: center;
 gap: 8px;
 padding: 2px 10px;
 border: 1px solid rgba(251,191,36,0.22);
 border-radius: 999px;
 background: linear-gradient(90deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.06) 55%, rgba(217,119,6,0.12) 100%);
 animation: ua-brand-glow 3.2s ease-in-out infinite;
}
.ua-brand-core {
 font-weight: 800;
 font-size: 11px;
 letter-spacing: .11em;
 text-transform: uppercase;
 background: linear-gradient(90deg,#fde68a 0%,#fbbf24 28%,#f59e0b 52%,#fbbf24 72%,#fde68a 100%);
 background-size: 240% auto;
 -webkit-background-clip: text;
 color: transparent;
 white-space: nowrap;
 animation: ua-brand-shimmer 4s linear infinite;
}
.ua-brand-core::after {
 content: '  //  UAW v1.6';
 color: rgba(255,255,255,0.66);
 -webkit-background-clip: initial;
 font-size: 9px;
 font-weight: 700;
 letter-spacing: .16em;
 margin-left: 8px;
 text-shadow: 0 0 8px rgba(251,191,36,0.28);
 animation: ua-brand-sheen 2.8s ease-in-out infinite;
}
`;

interface UrbanCommandBarProps {
 navQuery: string;
 onNavQueryChange: (q: string) => void;
 filteredCount: number;
 searchRef: React.RefObject<HTMLInputElement>;
 onOpenMap: () => void;
 onClose: () => void;
}

function UrbanCommandBar({
 navQuery,
 onNavQueryChange,
 filteredCount,
 searchRef,
 onOpenMap,
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
 background: 'linear-gradient(180deg, rgba(14,12,10,0.97) 0%, rgba(10,9,8,0.97) 100%)',
 borderBottom: '1px solid rgba(255,255,255,0.07)',
 backdropFilter: 'blur(14px) saturate(160%)',
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
 borderRight: '1px solid rgba(255,255,255,0.07)',
 height: 42,
 flexShrink: 0,
 }}>
 <span style={{ fontSize: 11, color: 'rgba(251,191,36,0.85)', opacity: 0.9 }}>◈</span>
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
 borderRight: '1px solid rgba(255,255,255,0.07)',
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
 borderRight: '1px solid rgba(255,255,255,0.07)',
 minWidth: 0,
 }}>
 <span style={{ fontSize: 12, opacity: 0.3 }}>⌕</span>
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
 color: '#e5e5e5',
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
 borderRight: '1px solid rgba(255,255,255,0.07)',
 flexShrink: 0,
 maxWidth: 340,
 overflow: 'hidden',
 }}
 >
 {scale ? (
 <span className="ua-chip" style={chipStyle('rgba(255,255,255,0.10)','rgba(255,255,255,0.05)','rgba(255,255,255,0.6)')}>
 <span style={{ opacity: 0.5 }}>sc:</span>{scale}
 </span>
 ) : null}
 {flowId ? (
 <span className="ua-chip" style={chipStyle('rgba(255,255,255,0.10)','rgba(255,255,255,0.05)','rgba(255,255,255,0.6)')}>
 <span style={{ opacity: 0.5 }}>fl:</span>{flowId.replace(/_/g,' ')}
 </span>
 ) : null}
 {layerCount > 0 ? (
 <span className="ua-chip" style={chipStyle('rgba(255,255,255,0.10)','rgba(255,255,255,0.05)','rgba(255,255,255,0.6)')}>
 <span style={{ opacity: 0.5 }}>ly:</span>{layerCount}
 </span>
 ) : null}
 {runLabel ? (
 <span className="ua-chip" style={chipStyle('rgba(255,255,255,0.10)','rgba(255,255,255,0.05)','rgba(255,255,255,0.6)')}>
 <span style={{ opacity: 0.5 }}>run:</span>{runLabel}
 </span>
 ) : null}
 {artifactCount > 0 ? (
 <span className="ua-chip" style={chipStyle('rgba(74,222,128,0.25)','rgba(34,197,94,0.08)','#4ade80')}>
 {artifactCount} ev
 </span>
 ) : null}
 {fitnessStatus === 'ready' ? (
 <span className="ua-chip" style={chipStyle('rgba(74,222,128,0.3)','rgba(34,197,94,0.10)','#4ade80')}>fit ✓</span>
 ) : null}
 {fitnessStatus === 'warning' ? (
 <span className="ua-chip" style={chipStyle('rgba(245,158,11,0.35)','rgba(245,158,11,0.10)','#fbbf24')}>fit !</span>
 ) : null}
 {fitnessStatus === 'blocked' ? (
 <span className="ua-chip" style={chipStyle('rgba(248,113,113,0.3)','rgba(239,68,68,0.10)','#f87171')}>fit ✗</span>
 ) : null}
 {syncState === 'synced' && !hasRestoreWarnings ? (
 <span className="ua-chip" style={chipStyle('rgba(74,222,128,0.25)','rgba(34,197,94,0.07)','#4ade80')}>⟳</span>
 ) : null}
 {hasRestoreWarnings ? (
 <span
 className="ua-chip"
 title={restoreWarnings.map((w) => w.message).join(' | ')}
 style={chipStyle('rgba(245,158,11,0.35)','rgba(245,158,11,0.10)','#fbbf24')}
 >
 {restoreWarningCount} stale
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
 <MapExplorerButton onOpen={onOpenMap} />
 <button
 className="ua-iconbtn iconbtn--close"
 aria-label="Close urban analytics"
 onClick={onClose}
 style={{ width: 26, height: 26, borderRadius: 8, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}
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
 const modalRef = useRef<HTMLDivElement>(null);
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

 // --- focus trap ---
 useEffect(() => {
 if (!active) return;
 const el = modalRef.current!;
 if (!el) return;
 const selectable = () =>
 Array.from(
 el.querySelectorAll<HTMLElement>(
 "button,[href],input,textarea,select,[tabindex]:not([tabindex='-1'])",
 ),
 ).filter((n) => !n.hasAttribute('disabled'));

 const onKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Tab') {
 const items = selectable();
 if (!items.length) return;
 const a = document.activeElement as HTMLElement | null;
 if (e.shiftKey) {
 if (a === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
 } else {
 if (a === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
 }
 }
 };
 el.addEventListener('keydown', onKeyDown);
 return () => el.removeEventListener('keydown', onKeyDown);
 }, [active]);

 // --- announce ---
 function announce(msg: string) {
 if (!liveRef.current) return;
 liveRef.current.textContent = msg;
 setTimeout(() => {
 if (liveRef.current) liveRef.current.textContent = '';
 }, 1500);
 }

 const onModalKeyDown = useCallback(
 (e: React.KeyboardEvent) => {
 const k = e.key.toLowerCase();
 const isMac = navigator.platform.toLowerCase().includes('mac');
 const mod = isMac ? e.metaKey : e.ctrlKey;
 if (k === 'escape') return;
 if (mod && k === 'enter') { e.preventDefault(); sendToChat(); announce('Sent to Chat'); }
 if (e.altKey && k === 'enter') { e.preventDefault(); insertToEditor(); announce('Inserted to Editor'); }
 if (mod && e.shiftKey && k === 'c') { e.preventDefault(); copyOut(); announce('Copied'); }
 },
 [sendToChat, insertToEditor, copyOut],
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
 ref={modalRef}
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
 background: '#000000',
 color: '#FAFAF9',
 // Sits one tier below the shared modal level (10050) so Map Explorer
 // and other modal-tier overlays opened FROM Urban Analytics layer above.
 // Toasts (10080), tooltips (10070), popovers (10060) still win.
 zIndex: 10049,
 display: 'grid',
 gridTemplateRows: 'auto 1fr 68px',
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
 onOpenMap={openMap}
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
 style={{
 gridRow: 2,
 position: 'relative',
 ['--left-w' as string]: '500px',
 ['--right-w' as string]: '600px',
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
 <div className="midCol" aria-hidden={false} style={{ pointerEvents: 'auto', overflow: 'hidden' }}>
 <div style={{ height: '100%', overflow: 'auto' }}>
 <CenterPanelShell
 title="Urban Analytics"
 subtitle="Spatial Intelligence Platform — Methods & Analysis"
 outlineSlot={<OutlineNav />}
 />
 </div>
 </div>

 {/* Right Panel */}
 <aside className="rightPane" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
 <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden', paddingBottom: 42 }}>
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

 {/* Bottom action bar */}
 <div role="toolbar" aria-label="Actions" className="bottombar urban-actions" ref={actionsRef} style={{ gridRow: 3 }}>
 <div className="btnline">
 <button className="btnpill" onClick={sendToChat}><IconSend /> <span>Send to Chat</span></button>
 <button className="btnpill" onClick={insertToEditor}><IconCode /> <span>Insert to Editor</span></button>
 <button className="btnpill" onClick={copyOut}><IconCopy /> <span>Copy</span></button>
 {selected ? (
 <button
 className={`btnpill ${selected.id && favoritesMap[selected.id] ? 'btnpill--accent' : ''}`}
 onClick={() => toggleFavorite(selected.id)}
 aria-pressed={!!(selected.id && favoritesMap[selected.id])}
 title="Favorite"
 >
 ★ <span>{selected.id && favoritesMap[selected.id] ? 'Unstar' : 'Star'}</span>
 </button>
 ) : null}
 <button className="btnpill" onClick={() => window.print()}><IconPrint /> <span>Print</span></button>
 </div>
 </div>
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
 --bg:#000000; --panel:#000000; --panel-2:#121212;
 --text:#FAFAF9; --muted:rgba(250,250,249,.65);
 --line:rgba(255,255,255,.10);
 --accent:#F59E0B; --accent-weak:rgba(245,158,11,.14);
 --amber:#ffb547; --amber-weak:rgba(255,181,71,.14);
 --accent-rgb:245,158,11;
 --brand-fx:linear-gradient(90deg,#fbbf24 0%,#F59E0B 40%,#d97706 60%,#fbbf24 100%);
 --codefont: "JetBrains Mono","Fira Code",ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
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
}

.urban-v2 .leftRail {
 grid-column: 1;
 position: relative;
 z-index: 1;
 height: 100%;
 overflow-y: auto;
 background: #000000 !important;
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
 overflow-y: auto;
 background: #000000 !important;
 border-left: 1px solid rgba(255,255,255,0.06);
}

/* Accent line */
.accentline {
 position: fixed; top:0; left:0; right:0; height:2px; z-index:2147483648;
 pointer-events: none;
 background: repeating-linear-gradient(90deg,rgba(245,158,11,1)0 90px,rgba(217,119,6,1)90px 180px,rgba(245,158,11,1)180px 270px);
 background-size: 540px 100%;
}

/* Rail */
.rail { padding:12px; overflow-y:auto; background:var(--panel); }
.railbtn { width:100%; text-align:left; padding:8px 10px; border-radius:10px; border:1px solid var(--line); background:rgba(255,255,255,.04); color:var(--text); cursor:pointer; font-size:13px; font-family: var(--codefont); }
.railbtn:hover { background:rgba(255,255,255,.08); }
.railbtn.is-on { background:var(--accent-weak); border-color:var(--accent); }
.railbtn--child { font-size:12.5px; padding:6px 10px; background:rgba(255,255,255,.03); }
.railbtn--child.is-on { background:var(--accent-weak); }
.rail__empty { font-size:12px; opacity:.6; }

/* Bottom bar */
.bottombar { border-top:1px solid var(--line); background:linear-gradient(180deg, rgba(18,18,18,0.88) 0%, rgba(12,12,12,0.88) 100%); display:flex; align-items:center; justify-content:center; padding:10px 12px; }
.btnline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.btnpill { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:14px; border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--text); font-size:13px; cursor:pointer; font-family: var(--codefont); }
.btnpill:hover { background:rgba(255,255,255,.10); }
.btnpill--accent { background:rgba(255,210,74,.15); color:#ffd24a; border-color:rgba(255,210,74,.45); }

/* Icon button */
.iconbtn { width:28px; height:28px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--text); cursor:pointer; }
.iconbtn:hover { background:rgba(255,255,255,.10); }
.iconbtn--close { margin-left:4px; }

/* Tag */
.tag { font-size:11.5px; padding:3px 8px; border-radius:999px; border:1px solid rgba(255,255,255,.14); background:rgba(30,31,36,1); }

/* Library */
.library { border-left:1px solid var(--line); border-right:1px solid var(--line); }

/* Right panel */
.rp-panel { background: var(--panel); }

/* Search in command bar */
.neuro-commandbar .search { flex:1; position:relative; display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:4px 10px; border-radius:10px; }
.neuro-commandbar .search input { flex:1; background:transparent; border:none; font-size:13px; color:#fff; outline:none; min-width:0; font-family: var(--codefont); }

/* Responsive */
@media (max-width:1024px) {
 .urban-v2 .leftRail, .urban-v2 .midCol { display:none; }
 .urban-v2 .urban-shell { grid-template-columns:1fr; }
 .urban-v2 .rightPane { grid-column:1; min-width:0; max-width:100%; width:100%; }
}

@media print {
 .bottombar, .iconbtn, .accentline { display: none !important; }
 body { color:#000 !important; }
}
`;
