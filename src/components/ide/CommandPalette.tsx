import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../molecules/Modal';
import { SYNAPSE_COLORS, SYNAPSE_TYPO, withAlpha } from '../../ui/theme/synapseTheme';
import styled from 'styled-components';
import { type Command as Cmd, fuzzyFilter, listCommands } from '../../services/commandRegistry';
import { useFileExplorerStore } from '../../stores/fileExplorerStore';
import { useEditorStore, useTabActions } from '../../stores/editorStore';
import {
  flattenOutlineSymbols,
  type OutlineExtractionSource,
  useOutlineStore,
} from '../../stores/outlineStore';
import type { FileNode } from '../../types/state';

type Mode = 'files' | 'tabs' | 'symbols' | 'commands';

type SymbolResult = {
  tabId: string;
  tabName: string;
  symbol: string;
  kind: string;
  line: number;
  column: number;
  source: OutlineExtractionSource;
  detail?: string;
};


const PaletteRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const ModeRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;
const ModeChip = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.2;
  background: ${({ $active }) => ($active ? withAlpha('#F59E0B', 0.14) : 'transparent')};
  color: ${({ $active }) => ($active ? '#D6D3D1' : SYNAPSE_COLORS.textSecondary)};
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? '#F59E0B' : 'transparent')};
  cursor: pointer;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  transition: background 140ms var(--syn-easing-bauhaus), color 140ms var(--syn-easing-bauhaus), border-color 140ms var(--syn-easing-bauhaus);
  &:hover { background: ${({ $active }) => ($active ? withAlpha('#F59E0B', 0.20) : withAlpha('#ffffff', 0.05))}; }
  &:focus-visible { outline: 2px solid #F59E0B; outline-offset: 2px; }
`;
const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: ${withAlpha('#ffffff', 0.04)};
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 0 12px;
  height: 46px;
  transition: border-color 160ms var(--syn-easing-bauhaus), background 160ms var(--syn-easing-bauhaus);
  &:focus-within {
    border-color: var(--ide-focus-ring, ${withAlpha('#F59E0B', 0.6)});
    background: ${withAlpha('#F59E0B', 0.08)};
    box-shadow: var(--ide-focus-shadow, 0 0 0 3px rgba(245, 158, 11, 0.35));
  }
`;
const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #D6D3D1;
  font-family: ${SYNAPSE_TYPO.fontFamily};
  font-size: 14px;
  line-height: 1.4;
  &::placeholder { color: ${withAlpha('#D6D3D1', 0.45)}; }
`;
const HintBar = styled.div`
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #A8A29E;
  padding: 0 2px;
`;
const ResultsViewport = styled.div`
  display: grid;
  gap: 10px;
  max-height: 56vh;
  overflow: auto;
  padding-right: 4px;
`;
const GroupHeading = styled.div`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${withAlpha('#A8A29E', 0.9)};
  padding: 4px 2px 0;
`;
const ResultButton = styled.button<{ $active: boolean; $dense?: boolean; $disabled?: boolean }>`
  text-align: left;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid
    ${({ $active }) => ($active ? withAlpha('#F59E0B', 0.50) : 'rgba(255,255,255,0.08)')};
  opacity: ${({ $disabled }) => ($disabled ? 0.48 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: ${({ $active }) =>
    $active ? withAlpha('#F59E0B', 0.16) : withAlpha('#ffffff', 0.02)};
  color: #D6D3D1;
  font-family: ${SYNAPSE_TYPO.fontFamily};
  display: grid;
  gap: 4px;
  cursor: pointer;
  min-height: 52px;
  transition: background 120ms var(--syn-easing-bauhaus), border-color 120ms var(--syn-easing-bauhaus), color 120ms var(--syn-easing-bauhaus);
  &:hover { background: ${({ $active }) => ($active ? withAlpha('#F59E0B', 0.20) : withAlpha('#ffffff', 0.05))}; }
  &:focus-visible { outline: 2px solid #F59E0B; outline-offset: 2px; }
`;
const ResultMeta = styled.small`
  color: #A8A29E;
  font-size: 12px;
`;
const NoResults = styled.div`
  color: #A8A29E;
  font-size: 13px;
  padding: 12px 4px;
`;
const FooterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 12px;
  color: #A8A29E;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 4px;
`;


/** Evaluates whether a command is currently enabled. Defaults to true when omitted. */
function evalEnabled(cmd: Cmd): boolean {
  if (cmd.enabled === undefined) return true;
  return typeof cmd.enabled === 'function' ? cmd.enabled() : cmd.enabled;
}

const MRU_KEY = 'synapse.palette.mru.v1';
function useMRU() {
  const [mru, setMru] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(MRU_KEY) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(MRU_KEY, JSON.stringify(mru.slice(0, 30)));
    } catch {}
  }, [mru]);
  const touch = (id: string) => setMru(prev => [id, ...prev.filter(x => x !== id)].slice(0, 30));
  return { mru, touch };
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  const walk = (list: FileNode[]) => {
    for (const n of list) {
      if (n.type === 'file') out.push(n);
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  const before = text.slice(0, i);
  const mid = text.slice(i, i + query.length);
  const after = text.slice(i + query.length);
  return (
    <>
      {before}
  <mark style={{ background: withAlpha('#F59E0B', 0.25), color: SYNAPSE_COLORS.textPrimary }}>
        {mid}
      </mark>
      {after}
    </>
  );
}

export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  commands?: Cmd[];
}> = ({ isOpen, onClose, commands }) => {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<Mode>('files');
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modeButtonRefs = useRef<Record<Mode, HTMLButtonElement | null>>({
    files: null,
    tabs: null,
    symbols: null,
    commands: null,
  });
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { mru, touch } = useMRU();
  const files = useFileExplorerStore(s => s.files);
  const tabs = useEditorStore(s => s.tabs);
  const activeTabId = useEditorStore(s => s.activeTabId);
  const activeOutlineEntry = useOutlineStore(s => (activeTabId ? s.byTabId[activeTabId] : undefined));
  const { openTab, setActiveTab } = useTabActions();


  useEffect(() => {
    if (!isOpen) {
      setQ('');
      setMode('files');
      setActiveIndex(0);
    }
  }, [isOpen]);


  useEffect(() => {
    if (!q) return;
    if (q.startsWith('>')) setMode('commands');
    else if (q.startsWith('@')) setMode('symbols');
    else if (q.startsWith('#')) setMode('tabs');
    else setMode('files');
  }, [q]);

  const filesFlat = useMemo(() => flattenFiles(files), [files]);
  const allCmds = useMemo(() => commands ?? listCommands(), [commands, isOpen]);
  const qStripped = useMemo(
    () => (q.startsWith('>') || q.startsWith('@') || q.startsWith('#') ? q.slice(1) : q),
    [q]
  );

  const fileResults = useMemo(() => {
    const v = qStripped.trim().toLowerCase();
    const base = !v
      ? filesFlat.slice(0, 200)
      : filesFlat.filter(f => f.name.toLowerCase().includes(v) || f.path.toLowerCase().includes(v));

    const byId = new Map(base.map(f => [f.id, f] as const));
    const prioritized: typeof base = [] as any;
    mru.forEach(id => {
      const f = byId.get(id);
      if (f) {
        prioritized.push(f);
        byId.delete(id);
      }
    });
    const rest = Array.from(byId.values());
    return [...prioritized, ...rest].slice(0, 50);
  }, [filesFlat, qStripped]);

  const tabResults = useMemo(() => {
    const v = qStripped.trim().toLowerCase();
    const base = !v ? tabs : tabs.filter(t => t.name.toLowerCase().includes(v));
    const byId = new Map(base.map(t => [t.id, t] as const));
    const prioritized: typeof base = [] as any;
    mru.forEach(id => {
      const t = byId.get(id);
      if (t) {
        prioritized.push(t);
        byId.delete(id);
      }
    });
    return [...prioritized, ...Array.from(byId.values())];
  }, [tabs, qStripped]);

  const activeSymbolTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId) || null,
    [activeTabId, tabs]
  );
  const activeSymbols = useMemo(
    () => flattenOutlineSymbols(activeOutlineEntry?.symbols ?? []),
    [activeOutlineEntry?.symbols]
  );

  const symbolResults = useMemo<SymbolResult[]>(() => {
    if (!activeTabId) return [];
    const v = qStripped.trim().toLowerCase();
    const tabName = activeSymbolTab?.name || activeOutlineEntry?.path || 'Active file';
    const list = activeSymbols.map(symbol => ({
      tabId: activeTabId,
      tabName,
      symbol: symbol.name,
      kind: symbol.kind,
      line: symbol.selectionRange.startLine,
      column: symbol.selectionRange.startColumn,
      source: symbol.source,
      ...(symbol.detail ? { detail: symbol.detail } : {}),
    }));
    if (!v) return list.slice(0, 100);
    return list
      .filter(s =>
        s.symbol.toLowerCase().includes(v) ||
        s.kind.toLowerCase().includes(v) ||
        (s.detail || '').toLowerCase().includes(v)
      )
      .slice(0, 100);
  }, [activeOutlineEntry?.path, activeSymbolTab?.name, activeSymbols, activeTabId, qStripped]);

  const commandResults = useMemo(() => fuzzyFilter(qStripped, allCmds), [qStripped, allCmds]);

  const commandGroups = useMemo(() => {
    if (!commandResults.length || mode !== 'commands') return [] as Array<{ name: string; items: Cmd[] }>;
    const map = new Map<string, Cmd[]>();
    commandResults.forEach(cmd => {
      const cat = cmd.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(cmd);
    });
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [commandResults, mode]);


  const fileGroups = useMemo(() => {
    if (mode !== 'files') return [] as Array<{ name: string; items: typeof fileResults }>;
    const mruSet = new Set(mru);
    const recent: typeof fileResults = [] as any;
    const others: typeof fileResults = [] as any;
    fileResults.forEach(f => (mruSet.has(f.id) ? recent.push(f) : others.push(f)));
    const out: Array<{ name: string; items: typeof fileResults }> = [];
    if (recent.length) out.push({ name: 'Recent', items: recent });
    if (others.length) out.push({ name: 'Files', items: others });
    return out;
  }, [fileResults, mode, mru]);

  const activeListLength = useMemo(() => {
    switch (mode) {
      case 'files':
        return fileResults.length;
      case 'tabs':
        return tabResults.length;
      case 'symbols':
        return symbolResults.length;
      case 'commands':
        return commandResults.length;
      default:
        return 0;
    }
  }, [mode, fileResults, tabResults, symbolResults, commandResults]);
  const activeOptionId =
    activeListLength > 0 && activeIndex < activeListLength
      ? `command-palette-option-${mode}-${activeIndex}`
      : undefined;

  useEffect(() => {
    setActiveIndex(0);
  }, [mode, qStripped]);

  useEffect(() => {
    if (activeListLength === 0) {
      if (activeIndex !== 0) setActiveIndex(0);
      return;
    }
    if (activeIndex >= activeListLength) {
      setActiveIndex(activeListLength - 1);
    }
  }, [activeIndex, activeListLength]);

  const placeholder = useMemo(() => {
    switch (mode) {
      case 'commands':
        return 'Run a command… (prefix with >)';
      case 'symbols':
        return 'Search active file symbols… (prefix with @)';
      case 'tabs':
        return 'Switch to tab… (prefix with #)';
      default:
        return 'Search files…';
    }
  }, [mode]);

  const noResultsMessage = useMemo(() => {
    if (mode === 'symbols') {
      if (!activeTabId) return 'Open a file to read active symbols.';
      if (!activeOutlineEntry) return 'Outline is waiting for the active Monaco editor.';
      if (activeOutlineEntry.status === 'loading') return 'Reading active file symbols.';
      return activeOutlineEntry.message || 'No symbols found for the active file.';
    }
    if (mode === 'commands') return 'No commands match this query.';
    if (mode === 'tabs') return 'No open tabs match this query.';
    return 'No files match this query.';
  }, [activeOutlineEntry, activeTabId, mode]);


  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        requestAnimationFrame(() => previouslyFocused.focus());
      }
    };
  }, [isOpen]);


  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const len =
          mode === 'files'
            ? fileResults.length
            : mode === 'tabs'
              ? tabResults.length
              : mode === 'symbols'
                ? symbolResults.length
                : commandResults.length;
        if (len === 0) return;
        setActiveIndex(i => {
          const delta = e.key === 'ArrowDown' ? 1 : -1;
          const next = (i + delta + len) % len;

          const container = listRef.current;
          if (!container) return next;
          const item = container.querySelector(`[data-idx="${next}"]`) as HTMLElement | null;
          item?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const runPick = (fn: (() => void) | null) => {
          if (fn) fn();
        };
        if (mode === 'files') {
          const f = fileResults[activeIndex];
          if (!f) return;
          touch(f.id);
          const t = tabs.find(t => t.fileId === f.id);
          runPick(() => {
            t ? setActiveTab(t.id) : openTab(f);
            onClose();
          });
        } else if (mode === 'tabs') {
          const t = tabResults[activeIndex];
          if (!t) return;
          touch(t.id);
          runPick(() => {
            setActiveTab(t.id);
            onClose();
          });
        } else if (mode === 'symbols') {
          const s = symbolResults[activeIndex];
          if (!s) return;
          touch(`sym:${s.tabId}:${s.symbol}`);
          runPick(() => {
            setActiveTab(s.tabId);

            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('synapse.editor.reveal', {
                  detail: { tabId: s.tabId, line: s.line, column: s.column },
                })
              );
            }, 50);
            onClose();
          });
        } else {
          const c = commandResults[activeIndex];
          if (!c) return;
          if (!evalEnabled(c)) return;
          touch(`cmd:${c.id}`);
          runPick(() => {
            c.run();
            onClose();
          });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    isOpen,
    mode,
    activeIndex,
    fileResults,
    tabResults,
    symbolResults,
    commandResults,
    onClose,
    openTab,
    setActiveTab,
    tabs,
    touch,
  ]);

  const handleModeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentMode: Mode) => {
    const order: Mode[] = ['files', 'tabs', 'symbols', 'commands'];
    const currentIndex = order.indexOf(currentMode);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % order.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + order.length) % order.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = order.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextMode = order[nextIndex];
    setMode(nextMode);
    setActiveIndex(0);
    requestAnimationFrame(() => modeButtonRefs.current[nextMode]?.focus());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Command Palette" size="palette" variant="palette">
      <PaletteRoot>
        <ModeRow role="tablist" aria-label="Palette modes">
          {([
            { key: 'files', label: 'Files' },
            { key: 'tabs', label: 'Tabs' },
            { key: 'symbols', label: 'Symbols' },
            { key: 'commands', label: 'Commands' },
          ] as Array<{ key: Mode; label: string }>).map(m => (
            <ModeChip
              key={m.key}
              ref={element => {
                modeButtonRefs.current[m.key] = element;
              }}
              $active={mode === m.key}
              role="tab"
              aria-selected={mode === m.key}
              aria-controls="command-palette-results"
              tabIndex={mode === m.key ? 0 : -1}
              onClick={() => setMode(m.key)}
              onKeyDown={event => handleModeKeyDown(event, m.key)}
            >
              {m.label}
            </ModeChip>
          ))}
        </ModeRow>
        <InputWrapper>
          <SearchInput
            ref={inputRef}
            id="command-palette-input"
            autoFocus
            placeholder={placeholder}
            value={q}
            aria-label="Command palette search"
            aria-controls="command-palette-results"
            aria-activedescendant={activeOptionId}
            onChange={e => setQ(e.target.value)}
          />
        </InputWrapper>
        <HintBar>
          <span>Tip: &gt; Commands, @ Symbols, # Tabs</span>
        </HintBar>
        <ResultsViewport id="command-palette-results" ref={listRef} role="listbox" aria-label="Results">
          {}
          <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(1px,1px,1px,1px)' }} aria-live="polite">
            {activeListLength} results
          </div>
          {mode === 'files' && fileGroups.map(group => {
            return (
              <React.Fragment key={group.name}>
                <GroupHeading>{group.name}</GroupHeading>
                {group.items.map(f => {
                  const i = fileResults.indexOf(f);
                  const active = activeIndex === i;
                  return (
                    <ResultButton
                      key={f.id}
                      id={`command-palette-option-files-${i}`}
                      data-idx={i}
                      role="option"
                      tabIndex={active ? 0 : -1}
                      aria-selected={active}
                      onClick={() => {
                        const t = tabs.find(t => t.fileId === f.id);
                        touch(f.id);
                        if (t) setActiveTab(t.id); else openTab(f);
                        onClose();
                      }}
                      $active={active}
                    >
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{highlight(f.name, qStripped)}</span>
                      <ResultMeta>{highlight(f.path, qStripped)}</ResultMeta>
                    </ResultButton>
                  );
                })}
              </React.Fragment>
            );
          })}

          {mode === 'tabs' &&
            tabResults.map((t, i) => (
              <ResultButton
                key={t.id}
                id={`command-palette-option-tabs-${i}`}
                data-idx={i}
                role="option"
                tabIndex={activeIndex === i ? 0 : -1}
                aria-selected={activeIndex === i}
                onClick={() => {
                  touch(t.id);
                  setActiveTab(t.id);
                  onClose();
                }}
                $active={activeIndex === i}
                $dense
              >
                <span>{highlight(t.name, qStripped)}</span>
                {t.isDirty ? <ResultMeta>• unsaved</ResultMeta> : null}
              </ResultButton>
            ))}

          {mode === 'symbols' &&
            symbolResults.map((s, i) => (
              <ResultButton
                key={`${s.tabId}-${i}`}
                id={`command-palette-option-symbols-${i}`}
                data-idx={i}
                role="option"
                tabIndex={activeIndex === i ? 0 : -1}
                aria-selected={activeIndex === i}
                onClick={() => {
                  touch(`sym:${s.tabId}:${s.symbol}`);
                  setActiveTab(s.tabId);
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('synapse.editor.reveal', {
                        detail: { tabId: s.tabId, line: s.line, column: s.column },
                      })
                    );
                  }, 50);
                  onClose();
                }}
                $active={activeIndex === i}
              >
                <span style={{ fontWeight: 600, fontSize: 15 }}>{highlight(s.symbol, qStripped)}</span>
                <ResultMeta>
                  {s.kind} · {s.source === 'monaco' ? 'Monaco' : 'Limited'} · {s.tabName} (Ln {s.line})
                </ResultMeta>
              </ResultButton>
            ))}

          {mode === 'commands' && commandGroups.map(group => (
            <React.Fragment key={group.name}>
              <GroupHeading>{group.name}</GroupHeading>
              {group.items.map(cmd => {
                const i = commandResults.indexOf(cmd);
                const active = activeIndex === i;
                const disabled = !evalEnabled(cmd);
                return (
                  <ResultButton
                    key={cmd.id}
                    id={`command-palette-option-commands-${i}`}
                    data-idx={i}
                    role="option"
                    tabIndex={active ? 0 : -1}
                    aria-selected={active}
                    aria-disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      touch(`cmd:${cmd.id}`);
                      cmd.run();
                      onClose();
                    }}
                    $active={active}
                    $dense
                    $disabled={disabled}
                  >
                    <span>{highlight(cmd.label, qStripped)}</span>
                    {disabled && cmd.reason
                      ? <ResultMeta style={{ color: '#F87171' }}>{cmd.reason}</ResultMeta>
                      : cmd.shortcut
                        ? <ResultMeta>{cmd.shortcut}</ResultMeta>
                        : null}
                  </ResultButton>
                );
              })}
            </React.Fragment>
          ))}

          {(mode === 'files' && fileResults.length === 0) ||
          (mode === 'tabs' && tabResults.length === 0) ||
          (mode === 'symbols' && symbolResults.length === 0) ||
          (mode === 'commands' && commandResults.length === 0) ? (
            <NoResults>{noResultsMessage}</NoResults>
          ) : null}
        </ResultsViewport>
        <FooterBar>
          <span>↑↓ navigate</span>
          <span>Enter run/open</span>
          <span>←→ switch mode tabs</span>
          <span>Esc close</span>
          <span>{activeListLength} results</span>
        </FooterBar>
      </PaletteRoot>
    </Modal>
  );
};

export default CommandPalette;
