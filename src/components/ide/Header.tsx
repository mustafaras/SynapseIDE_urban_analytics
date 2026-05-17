import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SYNAPSE_COLORS, SYNAPSE_TYPO, withAlpha } from '../../ui/theme/synapseTheme';
import { hasCustomTasksHandler, type TaskState, useTaskStates } from '../../services/tasksBridge';

type TabLike = { id: string; name: string; isDirty?: boolean; isPinned?: boolean };

export type Density = 'compact' | 'comfortable' | 'relaxed';

interface HeaderProps {
  aiAssistantRightGutter: number;

  onNewFile: () => void;
  onClearAll: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onToggleAI?: () => void;
  onOpenAnalytics?: () => void;
  sidebarActive: boolean;
  terminalActive: boolean;
  aiActive?: boolean;

  tabs: TabLike[];
  activeTabId?: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onOpenCommandPalette?: () => void;
  onGlobalSearch?: () => void;
  onCloseOthers?: (id: string) => void;
  onCloseRight?: (id: string) => void;
  onTogglePin?: (id: string) => void;

  dirtyCount?: number;
  onSaveAll?: () => void;
  onRun?: () => void;
  onBuild?: () => void;
}

const ICON_SIZE = 16;

const useLocalStorageState = <T,>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
};

const useOnlineState = () => {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
};

type ProjectStatus =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'dirty'; count: number }
  | { kind: 'offline' }
  | { kind: 'error' };

const PROJECT_STATUS_LABEL: Record<ProjectStatus['kind'], string> = {
  idle: 'Idle',
  running: 'Running',
  dirty: 'Unsaved',
  offline: 'Offline',
  error: 'Error',
};

const projectStatusColor = (kind: ProjectStatus['kind']) => {
  switch (kind) {
    case 'running':
      return {
        fg: 'var(--syn-status-running)',
        bg: 'color-mix(in srgb, var(--syn-status-running) 20%, var(--syn-surface-panel) 80%)',
        bd: 'color-mix(in srgb, var(--syn-status-running) 45%, var(--syn-border-subtle) 55%)',
      };
    case 'dirty':
      return {
        fg: 'var(--syn-status-warning)',
        bg: 'color-mix(in srgb, var(--syn-status-warning) 18%, var(--syn-surface-panel) 82%)',
        bd: 'color-mix(in srgb, var(--syn-status-warning) 42%, var(--syn-border-subtle) 58%)',
      };
    case 'offline':
      return {
        fg: 'var(--syn-text-secondary)',
        bg: 'var(--syn-surface-hover)',
        bd: 'var(--syn-border-subtle)',
      };
    case 'error':
      return { fg: 'var(--syn-danger)', bg: 'var(--syn-danger-bg)', bd: 'var(--syn-danger-border)' };
    default:
      return { fg: 'var(--ide-status-ready-text, #34D399)', bg: 'rgba(52,211,153,0.10)', bd: 'rgba(52,211,153,0.35)' };
  }
};

const taskStateColor = (state: TaskState) => {
  switch (state) {
    case 'running':
      return 'var(--syn-status-running)';
    case 'success':
      return 'var(--ide-status-ready-text, #34D399)';
    case 'error':
      return 'var(--syn-danger)';
    default:
      return SYNAPSE_COLORS.textSecondary;
  }
};

export const Header: React.FC<HeaderProps> = ({
  aiAssistantRightGutter,
  onNewFile,
  onClearAll,
  onToggleSidebar,
  onToggleTerminal,
  onToggleAI,
  onOpenAnalytics,
  sidebarActive,
  terminalActive,
  aiActive = true,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onReorder,
  onOpenCommandPalette,
  onGlobalSearch,
  onCloseOthers,
  onCloseRight,
  onTogglePin,
  dirtyCount = 0,
  onSaveAll,
  onRun,
  onBuild,
}) => {
  const [density, setDensity] = useLocalStorageState<Density>(
    'synapse.header.density',
    'comfortable'
  );

  const densityScale = useMemo(
    () =>
      ({
        compact: 0.9,
        comfortable: 1.0,
        relaxed: 1.1,
      })[density],
    [density]
  );

  const headerHeight = Math.round((density === 'compact' ? 36 : 40) * densityScale);
  const padInline = Math.round(12 * densityScale);
  const gap = Math.round(10 * densityScale);
  const groupGap = Math.round(6 * densityScale);

  const taskStates = useTaskStates();
  const online = useOnlineState();
  const tasksReal = hasCustomTasksHandler();
  const anyTaskRunning = taskStates.run === 'running' || taskStates.build === 'running';
  const anyTaskError = taskStates.run === 'error' || taskStates.build === 'error';

  const projectStatus: ProjectStatus = useMemo(() => {
    if (!online) return { kind: 'offline' };
    if (anyTaskError) return { kind: 'error' };
    if (anyTaskRunning) return { kind: 'running' };
    if (dirtyCount > 0) return { kind: 'dirty', count: dirtyCount };
    return { kind: 'idle' };
  }, [online, anyTaskError, anyTaskRunning, dirtyCount]);

  // ── Tabs popover ────────────────────────────────────────────────────────────
  const [tabsPopoverOpen, setTabsPopoverOpen] = useState(false);
  const tabsPopoverRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!tabsPopoverOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!tabsPopoverRef.current?.contains(e.target as Node)) setTabsPopoverOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [tabsPopoverOpen]);

  // ── Run/Build menu ──────────────────────────────────────────────────────────
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const runMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!runMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!runMenuRef.current?.contains(e.target as Node)) setRunMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [runMenuOpen]);

  // ── Tab strip ───────────────────────────────────────────────────────────────
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const orderedTabs = useMemo(
    () =>
      tabs
        .map((t, originalIndex) => ({ t, originalIndex }))
        .sort((a, b) => Number(b.t.isPinned) - Number(a.t.isPinned) || a.originalIndex - b.originalIndex),
    [tabs]
  );
  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -160 : 160;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const focusAndSelectTab = (tabId: string) => {
    onTabClick(tabId);
    requestAnimationFrame(() => tabItemRefs.current[tabId]?.focus());
  };

  const handleEditorTabKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    orderedIndex: number,
    tabId: string
  ) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (orderedIndex + 1) % orderedTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (orderedIndex - 1 + orderedTabs.length) % orderedTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = orderedTabs.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const next = orderedTabs[nextIndex]?.t;
      if (next) focusAndSelectTab(next.id);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      focusAndSelectTab(tabId);
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      const fallback =
        orderedTabs[orderedIndex + 1]?.t.id ??
        orderedTabs[orderedIndex - 1]?.t.id ??
        null;
      onTabClose(tabId);
      if (fallback) requestAnimationFrame(() => tabItemRefs.current[fallback]?.focus());
    }
  };

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        const boost = 1.75;
        const dx = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * boost;
        el.scrollLeft += dx;
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as any);
  }, [tabsRef.current]);

  const dragFrom = useRef<number | null>(null);
  const autoScroll = (clientX: number) => {
    const el = tabsRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const edge = 40;
    if (clientX < rect.left + edge) el.scrollLeft -= 24;
    if (clientX > rect.right - edge) el.scrollLeft += 24;
  };

  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    autoScroll(e.clientX);
  };
  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    setDropIndex(null);
    if (from === null) return;
    let to = index;
    if (from < to) to = to - 1;
    if (from === to) return;
    onReorder(from, to);
  };

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isShiftOrMeta = e.shiftKey || e.metaKey || e.ctrlKey;
      if (!isAlt || !isShiftOrMeta) return;
      if (!activeTabId) return;
      const i = tabs.findIndex(t => t.id === activeTabId);
      if (i < 0) return;
      if (e.key === 'ArrowLeft' && i > 0) {
        e.preventDefault();
        onReorder(i, i - 1);
      } else if (e.key === 'ArrowRight' && i < tabs.length - 1) {
        e.preventDefault();
        onReorder(i, i + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabs, activeTabId, onReorder]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (e.altKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }
      if (isMeta && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }
      if (isMeta && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        onGlobalSearch?.();
        return;
      }
      if (isMeta && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setTabsPopoverOpen(true);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onOpenCommandPalette, onGlobalSearch]);

  const [ctxOpenId, setCtxOpenId] = useState<string | null>(null);
  const ctxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ctxRef.current?.contains(e.target as Node)) setCtxOpenId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const groupDivider: React.CSSProperties = {
    width: 1,
    height: 16,
    alignSelf: 'center',
    marginInline: Math.round(groupGap / 2),
    background: 'var(--syn-border-subtle)',
  };

  return (
    <header
      className="synapse-ide-shell__header"
      data-region="top-band"
      role="banner"
      aria-label="Synapse IDE header"
      style={{
        minHeight: headerHeight,
        display: 'flex',
        alignItems: 'center',
        paddingInline: padInline,
        gap,
        background: 'var(--syn-surface-navigation)',
        borderBottom: '1px solid var(--syn-border-subtle)',
        boxShadow: 'none',
        position: 'relative',
        zIndex: 10020,
        userSelect: 'none',
        width: aiAssistantRightGutter > 0 ? `calc(100vw - ${aiAssistantRightGutter}px)` : '100vw',
        borderRight: aiAssistantRightGutter > 0 ? `1px solid ${'var(--syn-overlay-light)'}` : 'none',
      }}
    >
      {/* ─── Group: Brand + Project ─────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Project"
        data-group="project"
        style={{ display: 'flex', alignItems: 'center', gap: groupGap, minWidth: 0, flexShrink: 0 }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="var(--syn-text-secondary)"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="18" r="2" />
            <circle cx="12" cy="12" r="2.2" />
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SYNAPSE_TYPO.fontFamily,
              fontSize: '13px',
              letterSpacing: 0,
              fontWeight: 500,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              color: 'var(--syn-text-default)',
            }}
          >
            Synapse_IDE
          </div>
          <div
            className="hdr-sub"
            style={{
              fontFamily: SYNAPSE_TYPO.fontFamily,
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--syn-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200,
            }}
          >
            AI‑Assisted IDE
          </div>
        </div>

        <ProjectStatusPill status={projectStatus} />

        <button
          aria-label="Create new file"
          title="New File (Ctrl+N)"
          onClick={onNewFile}
          style={primaryBtn(densityScale)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hdr-label">New</span>
        </button>

        <button
          aria-label="Clear workspace"
          title="Clear all files and tabs"
          onClick={onClearAll}
          style={dangerBtn(densityScale)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M3 6h18M8 6l1 14h6l1-14M10 6V4h4v2" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hdr-label">Clear</span>
        </button>
      </div>

      <span aria-hidden="true" style={groupDivider} className="hdr-divider" />

      {/* ─── Group: Tabs ────────────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Editor tabs"
        data-group="tabs"
        style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <button
          aria-label="Scroll tabs left"
          title="Scroll left"
          onClick={() => scrollTabs('left')}
          style={chevStyle()}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Editor tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: Math.max(8, Math.round(12 * densityScale)),
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            paddingBlock: 6,
            minWidth: 0,
          }}
        >
          {orderedTabs
            .map(({ t, originalIndex: idx }, orderedIndex) => (
              <div
                key={t.id}
                ref={element => {
                  tabItemRefs.current[t.id] = element;
                }}
                role="tab"
                aria-selected={t.id === activeTabId}
                aria-controls="synapse-editor-region"
                tabIndex={t.id === activeTabId ? 0 : -1}
                title={t.name}
                draggable
                onDragStart={onDragStart(idx)}
                onDragOver={onDragOver}
                onDrop={onDrop(idx)}
                onDragEnter={() => setDropIndex(idx)}
                onContextMenu={e => {
                  e.preventDefault();
                  setCtxOpenId(t.id);
                }}
                onMouseDown={e => {
                  if (e.button === 1) {
                    e.preventDefault();
                    onTabClose(t.id);
                  }
                }}
                onClick={() => onTabClick(t.id)}
                onKeyDown={event => handleEditorTabKeyDown(event, orderedIndex, t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  height: 26,
                  borderRadius: 0,
                  borderBottom: t.id === (activeTabId ?? '')
                    ? '1px solid var(--syn-interaction-active)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: SYNAPSE_TYPO.fontFamily,
                  fontSize: 12,
                  fontWeight: 500,
                  color:
                    t.id === (activeTabId ?? '')
                      ? 'var(--syn-text-default)'
                      : 'var(--syn-text-muted)',
                  background: 'transparent',
                  position: 'relative',
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {dropIndex === idx && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: -4,
                      top: 6,
                      bottom: 6,
                      width: 2,
                      background: 'var(--syn-interaction-active)',
                      borderRadius: 2,
                    }}
                  />
                )}
                {t.isPinned ? (
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill={
                      t.id === (activeTabId ?? '')
                        ? 'var(--syn-interaction-active)'
                        : 'var(--syn-text-muted)'
                    }
                    aria-hidden
                    style={{ marginRight: 2 }}
                  >
                    <path d="M14 3l7 7-4 4-7-7 4-4zm-5 8l-5 10 10-5" />
                  </svg>
                ) : null}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                {t.isDirty ? (
                  <span
                    aria-label="Unsaved changes"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--syn-status-warning)',
                    }}
                  />
                ) : null}
                <button
                  aria-label={`Close ${t.name}`}
                  onClick={e => {
                    e.stopPropagation();
                    onTabClose(t.id);
                  }}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    color: withAlpha(SYNAPSE_COLORS.textSecondary, 0.9),
                  }}
                >
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {ctxOpenId === t.id && (
                  <div
                    ref={ctxRef}
                    role="menu"
                    style={{
                      position: 'absolute',
                      marginTop: 36,
                      right: 0,
                      minWidth: 180,
                      background: 'var(--syn-bg-surface-1)',
                      border: `1px solid ${SYNAPSE_COLORS.border}`,
                      borderRadius: 8,
                      boxShadow: 'var(--shadow-overlay)',
                      display: 'grid',
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={e => {
                        e.stopPropagation();
                        onTabClose(t.id);
                        setCtxOpenId(null);
                      }}
                      style={ctxItem()}
                    >
                      Close
                    </button>
                    <button
                      role="menuitem"
                      onClick={e => {
                        e.stopPropagation();
                        onCloseOthers?.(t.id);
                        setCtxOpenId(null);
                      }}
                      style={ctxItem()}
                    >
                      Close Others
                    </button>
                    <button
                      role="menuitem"
                      onClick={e => {
                        e.stopPropagation();
                        onCloseRight?.(t.id);
                        setCtxOpenId(null);
                      }}
                      style={ctxItem()}
                    >
                      Close to the Right
                    </button>
                    <button
                      role="menuitem"
                      onClick={e => {
                        e.stopPropagation();
                        onTogglePin?.(t.id);
                        setCtxOpenId(null);
                      }}
                      style={ctxItem()}
                    >
                      {t.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        <button
          aria-label="Scroll tabs right"
          title="Scroll right"
          onClick={() => scrollTabs('right')}
          style={chevStyle()}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* All-tabs popover */}
        <div style={{ position: 'relative', zIndex: 10030 }} ref={tabsPopoverRef}>
          <button
            aria-haspopup="menu"
            aria-expanded={tabsPopoverOpen}
            aria-label="Show all tabs"
            title="All tabs (Ctrl+P)"
            onClick={() => setTabsPopoverOpen(v => !v)}
            style={chevStyle()}
          >
            <svg
              width={ICON_SIZE}
              height={ICON_SIZE}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {tabsPopoverOpen ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                minWidth: 240,
                maxHeight: 300,
                overflow: 'auto',
                background: 'var(--syn-bg-surface-1)',
                border: `1px solid ${SYNAPSE_COLORS.border}`,
                borderRadius: 10,
                boxShadow: 'var(--shadow-overlay)',
                padding: 8,
              }}
            >
              <TypeAhead
                tabs={tabs}
                onPick={id => {
                  onTabClick(id);
                  setTabsPopoverOpen(false);
                }}
                onDensityChange={setDensity}
                currentDensity={density}
              />
            </div>
          ) : null}
        </div>
      </div>

      <span aria-hidden="true" style={groupDivider} className="hdr-divider" />

      {/* ─── Group: Tasks (Save / Run / Build) ───────────────────────────── */}
      <div
        role="group"
        aria-label="Tasks"
        data-group="tasks"
        style={{ display: 'flex', alignItems: 'center', gap: groupGap, flexShrink: 0 }}
      >
        <button
          aria-label={dirtyCount > 0 ? `Save All (${dirtyCount} unsaved)` : 'Save All — nothing to save'}
          title={dirtyCount > 0 ? `Save All (${dirtyCount} unsaved) · Ctrl+Shift+S` : 'Save All · all changes saved'}
          aria-disabled={dirtyCount === 0}
          onClick={() => onSaveAll?.()}
          style={ghostBtn(dirtyCount > 0)}
        >
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <svg
              width={ICON_SIZE}
              height={ICON_SIZE}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <path d="M5 5h14v14H5z" strokeWidth="2" />
              <path d="M7 5h6v6H7z" strokeWidth="2" />
            </svg>
            {dirtyCount > 0 && (
              <span
                aria-label={`${dirtyCount} unsaved`}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  background: 'var(--syn-danger)',
                  color: 'var(--syn-text-primary)',
                  borderRadius: 8,
                  padding: '0 5px',
                  fontSize: 10,
                  lineHeight: '14px',
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {dirtyCount > 9 ? '9+' : dirtyCount}
              </span>
            )}
          </div>
        </button>

        <div style={{ position: 'relative', zIndex: 10030 }} ref={runMenuRef}>
          <button
            aria-haspopup="menu"
            aria-expanded={runMenuOpen}
            aria-label={
              anyTaskRunning
                ? 'Tasks running'
                : tasksReal
                  ? 'Run or build'
                  : 'Run or build (simulated — no task host connected)'
            }
            title={
              anyTaskRunning
                ? 'A task is running'
                : tasksReal
                  ? 'Run / Build'
                  : 'Run / Build (simulated — connect a task host for real builds)'
            }
            onClick={() => setRunMenuOpen(v => !v)}
            style={ghostBtn(anyTaskRunning)}
          >
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <svg
                width={ICON_SIZE}
                height={ICON_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <TaskStateDot
                runState={taskStates.run}
                buildState={taskStates.build}
              />
            </div>
          </button>
          {runMenuOpen ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                minWidth: 220,
                background: 'var(--syn-bg-surface-1)',
                border: `1px solid ${SYNAPSE_COLORS.border}`,
                borderRadius: 8,
                boxShadow: 'var(--shadow-overlay)',
                padding: 6,
              }}
            >
              <button
                role="menuitem"
                onClick={() => {
                  onRun?.();
                  setRunMenuOpen(false);
                }}
                style={ctxItem()}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Run Dev Server</span>
                  <TaskStateLabel state={taskStates.run} />
                </span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  onBuild?.();
                  setRunMenuOpen(false);
                }}
                style={ctxItem()}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Build Project</span>
                  <TaskStateLabel state={taskStates.build} />
                </span>
              </button>
              {!tasksReal ? (
                <div
                  role="note"
                  style={{
                    padding: '6px 10px',
                    fontSize: 11,
                    color: SYNAPSE_COLORS.textSecondary,
                    borderTop: `1px solid var(--syn-overlay-whisper)`,
                    fontFamily: SYNAPSE_TYPO.fontFamily,
                  }}
                >
                  Simulated mode — no task host connected.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <span aria-hidden="true" style={groupDivider} className="hdr-divider" />

      {/* ─── Group: Search & Command ─────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Search and command"
        data-group="search"
        style={{ display: 'flex', alignItems: 'center', gap: groupGap, flexShrink: 0 }}
      >
        <button
          aria-label="Global Search"
          title="Global Search (Ctrl+Shift+F)"
          onClick={() => onGlobalSearch?.()}
          style={ghostBtn(false)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          aria-label="Command Palette"
          title="Command Palette (Alt+Shift+P)"
          onClick={() => onOpenCommandPalette?.()}
          style={ghostBtn(false)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="14" rx="3" strokeWidth="2" />
            <path d="M7 9h10M7 13h6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <span aria-hidden="true" style={groupDivider} className="hdr-divider" />

      {/* ─── Group: Cross-module handoff ─────────────────────────────────── */}
      {onOpenAnalytics ? (
        <div
          role="group"
          aria-label="Cross-module handoff"
          data-group="handoff"
          style={{ display: 'flex', alignItems: 'center', gap: groupGap, flexShrink: 0 }}
        >
          <button
            aria-label="Open Urban Analytics"
            title="Open Urban Analytics workbench"
            onClick={onOpenAnalytics}
            style={analyticsBtn()}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <rect x="3" y="12" width="4" height="9" rx="1" strokeWidth="1.8" />
              <rect x="10" y="7" width="4" height="14" rx="1" strokeWidth="1.8" />
              <rect x="17" y="3" width="4" height="18" rx="1" strokeWidth="1.8" />
            </svg>
            <span className="hdr-label" style={{ lineHeight: 1 }}>
              Analytics
            </span>
          </button>
        </div>
      ) : null}

      <span aria-hidden="true" style={groupDivider} className="hdr-divider" />

      {/* ─── Group: View toggles ─────────────────────────────────────────── */}
      <div
        className="hdr-right"
        role="group"
        aria-label="Workspace panels"
        data-group="view"
        style={{ display: 'flex', alignItems: 'center', gap: groupGap, flexShrink: 0 }}
      >
        <button
          aria-label="Toggle sidebar"
          aria-pressed={sidebarActive}
          title={sidebarActive ? 'Hide sidebar' : 'Show sidebar'}
          onClick={onToggleSidebar}
          style={ghostBtn(sidebarActive)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M3 5h18M3 12h8M3 19h18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          aria-label="Toggle terminal"
          aria-pressed={terminalActive}
          title={terminalActive ? 'Hide terminal' : 'Show terminal'}
          onClick={onToggleTerminal}
          style={ghostBtn(terminalActive)}
        >
          <svg
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              d="M4 5h16v14H4zM7 9l4 3-4 3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          data-testid="toggle-ai"
          aria-label="Toggle AI Assistant"
          aria-pressed={!!aiActive}
          title={aiActive ? 'Hide AI Assistant' : 'Show AI Assistant'}
          onClick={onToggleAI}
          style={ghostBtn(!!aiActive)}
        >
          <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" aria-hidden>
            <circle cx="6" cy="6" r="1.8" fill="currentColor" />
            <circle cx="18" cy="6" r="1.8" fill="currentColor" />
            <circle cx="6" cy="18" r="1.8" fill="currentColor" />
            <circle cx="18" cy="18" r="1.8" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>
      </div>

      <style>{`
        @media (max-width: 1100px){
          .hdr-sub{ display:none; }
          .hdr-label{ display:none; }
        }
        @media (max-width: 900px){
          .hdr-divider{ display:none; }
        }
        @media (max-width: 1200px){
          [role="tablist"]{ gap: 8px !important; }
        }
        header button:focus-visible,
        header [role="tab"]:focus-visible,
        .syn-header-tabs-filter:focus-visible{
          outline: var(--ide-focus-width, 2px) solid var(--ide-focus-ring, var(--syn-interaction-focus-ring));
          outline-offset: var(--ide-focus-offset, 2px);
          box-shadow: var(--ide-focus-shadow, var(--shadow-focus));
        }
        @keyframes synSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
};

const ProjectStatusPill: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const c = projectStatusColor(status.kind);
  const label =
    status.kind === 'dirty'
      ? `${PROJECT_STATUS_LABEL.dirty} (${status.count})`
      : PROJECT_STATUS_LABEL[status.kind];
  const showSpinner = status.kind === 'running';
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Project status: ${label}`}
      title={`Project status: ${label}`}
      data-status={status.kind}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        paddingInline: 8,
        borderRadius: 999,
        background: 'transparent',
        color: c.fg,
        fontFamily: SYNAPSE_TYPO.fontFamily,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {showSpinner ? (
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
          style={{ animation: 'synSpin 1s linear infinite' }}
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <span
          aria-hidden="true"
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}
        />
      )}
      <span>{label}</span>
    </div>
  );
};

const TaskStateDot: React.FC<{ runState: TaskState; buildState: TaskState }> = ({
  runState,
  buildState,
}) => {
  // Pick the most informative state to surface on the icon
  const merged: TaskState =
    runState === 'running' || buildState === 'running'
      ? 'running'
      : runState === 'error' || buildState === 'error'
        ? 'error'
        : runState === 'success' || buildState === 'success'
          ? 'success'
          : 'idle';
  if (merged === 'idle') return null;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: -3,
        right: -4,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: taskStateColor(merged),
        border: '1.5px solid var(--syn-bg-surface-1, #161616)',
        animation: merged === 'running' ? 'synSpin 1.6s linear infinite' : undefined,
      }}
    />
  );
};

const TaskStateLabel: React.FC<{ state: TaskState }> = ({ state }) => {
  const text =
    state === 'running'
      ? 'Running…'
      : state === 'success'
        ? 'OK'
        : state === 'error'
          ? 'Error'
          : 'Idle';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: taskStateColor(state),
        opacity: state === 'idle' ? 0.55 : 1,
        marginLeft: 8,
      }}
    >
      {text}
    </span>
  );
};

function chevStyle(): React.CSSProperties {
  return {
    height: 24,
    width: 24,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 4,
    border: 'none',
    color: 'var(--syn-text-secondary)',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  };
}

function ghostBtn(active: boolean): React.CSSProperties {
  return {
    height: 24,
    width: 28,
    borderRadius: 4,
    border: 'none',
    background: active ? 'var(--syn-interaction-hover)' : 'transparent',
    color: active ? 'var(--syn-interaction-active)' : 'var(--syn-text-secondary)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };
}

function primaryBtn(densityScale: number): React.CSSProperties {
  return {
    height: Math.round(24 * densityScale),
    padding: `0 ${Math.round(8 * densityScale)}px`,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: 'var(--syn-interaction-active)',
    fontWeight: 500,
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    flexShrink: 0,
  };
}

function dangerBtn(densityScale: number): React.CSSProperties {
  return {
    height: Math.round(24 * densityScale),
    padding: `0 ${Math.round(8 * densityScale)}px`,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: 'var(--syn-status-error)',
    fontWeight: 500,
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    flexShrink: 0,
  };
}

function analyticsBtn(): React.CSSProperties {
  return {
    height: 24,
    padding: '0 10px',
    borderRadius: 4,
    border: '1px solid var(--syn-border-subtle)',
    background: 'transparent',
    color: 'var(--syn-interaction-active)',
    fontWeight: 500,
    fontSize: 12,
    fontFamily: SYNAPSE_TYPO.fontFamily,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    letterSpacing: 0,
    transition: 'background 0.15s ease',
    flexShrink: 0,
  };
}

function ctxItem(): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '8px 10px',
    background: 'transparent',
    color: SYNAPSE_COLORS.textPrimary,
    fontFamily: SYNAPSE_TYPO.fontFamily,
    fontSize: 13,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  };
}

const TypeAhead: React.FC<{
  tabs: TabLike[];
  onPick: (id: string) => void;
  onDensityChange?: (d: Density) => void;
  currentDensity?: Density;
}> = ({ tabs, onPick, onDensityChange, currentDensity }) => {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const v = q.trim().toLowerCase();
    return v ? tabs.filter(t => t.name.toLowerCase().includes(v)) : tabs;
  }, [q, tabs]);
  return (
    <div>
      <input
        className="syn-header-tabs-filter"
        autoFocus
        placeholder="Search tabs…"
        value={q}
        onChange={e => setQ(e.target.value)}
        aria-label="Filter tabs"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--syn-overlay-whisper)',
          color: SYNAPSE_COLORS.textPrimary,
          fontFamily: SYNAPSE_TYPO.fontFamily,
          fontSize: 12,
          marginBottom: 8,
        }}
      />
      <div>
        {items.map(t => (
          <button
            key={t.id}
            role="menuitem"
            onClick={() => onPick(t.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 8,
              marginBottom: 4,
              color: SYNAPSE_COLORS.textPrimary,
              background: 'transparent',
              border: 'none',
            }}
          >
            {t.name}
          </button>
        ))}
        {items.length === 0 && (
          <div style={{ color: SYNAPSE_COLORS.textSecondary, fontSize: 12, padding: 6 }}>
            No matches
          </div>
        )}
      </div>
      <div
        style={{
          borderTop: `1px solid ${'var(--syn-overlay-whisper)'}`,
          marginTop: 8,
          paddingTop: 8,
        }}
      >
        <small style={{ color: SYNAPSE_COLORS.textSecondary }}>Density:</small>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {(['compact', 'comfortable', 'relaxed'] as Density[]).map(d => (
            <button
              key={d}
              onClick={() => onDensityChange?.(d)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                border: 'none',
                background:
                  currentDensity === d
                    ? 'color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)'
                    : 'transparent',
                color:
                  currentDensity === d ? 'var(--syn-interaction-active)' : SYNAPSE_COLORS.textSecondary,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
