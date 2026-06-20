import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../molecules/Modal';
import { SYNAPSE_TYPO } from '../../ui/theme/synapseTheme';
import styled from 'styled-components';
import { useEditorStore, useTabActions } from '../../stores/editorStore';
import { indexDocs, queryDocs } from '../../services/search';
import { useFileExplorerStore } from '../../stores/fileExplorerStore';
import type { FileNode, FileSemanticStatus } from '../../types/state';

// ── Styled components ───────────────────────────────────────────────────────

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--syn-surface-hover, #303642) 60%, transparent);
  border: none;
  border-radius: 6px;
  padding: 0 12px;
  height: 46px;
  transition: background 160ms var(--syn-easing-bauhaus);
  &:focus-within {
    background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 10%, var(--syn-surface-input, #1a1f26));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 58%, transparent);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--syn-text-default, #d7dce5);
  font-family: ${SYNAPSE_TYPO.fontFamily};
  font-size: 14px;
  line-height: 1.4;
  &::placeholder { color: var(--syn-text-muted, #778190); }
`;

const ScopeTabs = styled.div`
  display: flex;
  gap: 4px;
`;

const ScopeBtn = styled.button<{ $active: boolean }>`
  padding: 3px 10px;
  border-radius: 20px;
  font-family: ${SYNAPSE_TYPO.fontFamily};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: transparent;
  color: ${({ $active }) => ($active ? 'var(--syn-text-default, #d7dce5)' : 'var(--syn-text-muted, #778190)')};
  box-shadow: ${({ $active }) => ($active ? 'inset 0 -2px 0 var(--syn-interaction-active, #3794ff)' : 'none')};
  transition: color 120ms, opacity 120ms;
  &:hover { color: var(--syn-text-default, #d7dce5); opacity: 1; }
  &:focus-visible {
    outline: none;
    color: var(--syn-text-default, #d7dce5);
    box-shadow: inset 0 -2px 0 var(--syn-interaction-active, #3794ff), 0 0 0 2px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 55%, transparent);
  }
`;

const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 52vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
`;

const SectionHeader = styled.div`
  font-family: ${SYNAPSE_TYPO.fontFamily};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--syn-text-muted, #778190);
  padding: 10px 4px 4px;
  user-select: none;
`;

const ResultRow = styled.div`
  text-align: left;
  padding: 9px 10px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--syn-text-secondary, #a4adbb);
  font-family: ${SYNAPSE_TYPO.fontFamily};
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  transition: background 100ms;
  &:hover { background: color-mix(in srgb, var(--syn-surface-hover, #303642) 68%, transparent); }
  /* Active option is driven by aria-activedescendant on the combobox input —
     rows never take DOM focus, so selection styling keys off aria-selected. */
  &[aria-selected='true'] {
    background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent);
    box-shadow: inset 2px 0 0 var(--syn-interaction-active, #3794ff);
  }
`;

const RowTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--syn-text-default, #d7dce5);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RowPath = styled.div`
  font-size: 11px;
  color: var(--syn-text-secondary, #a4adbb);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowPreview = styled.div`
  font-size: 12px;
  color: var(--syn-text-secondary, #a4adbb);
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
`;

const LineNum = styled.span`
  font-size: 11px;
  color: var(--syn-text-muted, #778190);
  min-width: 32px;
  flex-shrink: 0;
`;

const OpenDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--syn-status-info, #6aa9ff);
  flex-shrink: 0;
`;

const BadgeInline = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 600;
  padding: 0;
  border-radius: 3px;
  background: transparent;
  color: ${({ $color }) => $color};
`;

const Empty = styled.div`
  font-size: 13px;
  color: var(--syn-text-muted, #778190);
  padding: 14px 4px;
  text-align: center;
`;

// ── Types ───────────────────────────────────────────────────────────────────

type ResultKind = 'filename' | 'content' | 'artifact';
type Scope = 'all' | 'files' | 'content' | 'artifacts';

const SCOPE_ORDER: Scope[] = ['all', 'files', 'content', 'artifacts'];
const GS_LISTBOX_ID = 'global-search-listbox';
const optionId = (idx: number) => `global-search-opt-${idx}`;

interface SearchResult {
  docId: string;
  docName: string;
  docPath: string;
  line: number;
  preview: string;
  matchIndex: number;
  matchLength: number;
  kind: ResultKind;
  isOpen: boolean;
  semanticStatus?: FileSemanticStatus;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  const recurse = (ns: FileNode[]) => {
    for (const n of ns) {
      if (n.type === 'file') out.push(n);
      if (n.children) recurse(n.children);
    }
  };
  recurse(nodes);
  return out;
}

function hasArtifact(s?: FileSemanticStatus): boolean {
  return !!(s && (s.generated || s.analysisOutput || s.mapLayerCandidate || s.scenarioArtifact || s.synced));
}

// ── Highlight utility ────────────────────────────────────────────────────────

function Highlight({ text, idx, len, q }: { text: string; idx: number; len: number; q: string }) {
  if (!q || idx < 0 || len <= 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'color-mix(in srgb, var(--syn-status-info, #3b82f6) 28%, transparent)',
          color: 'var(--syn-text-default, #d7dce5)',
          borderRadius: 2,
        }}
      >
        {text.slice(idx, idx + len)}
      </mark>
      {text.slice(idx + len)}
    </>
  );
}

// ── Artifact badges ──────────────────────────────────────────────────────────

function ArtifactBadges({ status }: { status: FileSemanticStatus }) {
  return (
    <>
      {status.generated ? <BadgeInline $color="var(--syn-status-warning, #d6a84f)">gen</BadgeInline> : null}
      {status.analysisOutput ? <BadgeInline $color="var(--syn-status-info, #6aa9ff)">analysis</BadgeInline> : null}
      {status.mapLayerCandidate ? <BadgeInline $color="var(--syn-status-info, #6aa9ff)">map layer</BadgeInline> : null}
      {status.scenarioArtifact ? <BadgeInline $color="var(--syn-status-unknown, #858b96)">scenario</BadgeInline> : null}
      {status.synced ? <BadgeInline $color="var(--syn-status-valid, #4ec27d)">synced</BadgeInline> : null}
    </>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export const GlobalSearch: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const tabs = useEditorStore(s => s.tabs);
  const files = useFileExplorerStore(s => s.files);
  const { setActiveTab, openTab } = useTabActions();

  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focusIdx, setFocusIdx] = useState(-1);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scopeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // The base Modal moves initial focus to its first focusable (the close button);
  // for a search dialog the combobox input must own focus, so claim it on open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Reset on close.
  useEffect(() => {
    if (!isOpen) { setQ(''); setResults([]); setFocusIdx(-1); }
  }, [isOpen]);

  // Memoised flat file list — avoids repeating recursion on every effect.
  const flatFiles = useMemo(() => flattenFiles(files), [files]);

  // Re-index whenever the modal opens, tabs change, or explorer changes.
  useEffect(() => {
    if (!isOpen) return;
    const openByPath = new Map<string, string>();
    tabs.forEach(t => openByPath.set(t.path, t.content ?? ''));

    const docs = flatFiles.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      content: openByPath.get(f.path) ?? f.content ?? '',
      ...(f.size !== undefined ? { size: f.size } : {}),
      isOpen: openByPath.has(f.path),
      ...(f.semanticStatus !== undefined ? { semanticStatus: f.semanticStatus } : {}),
    }));
    indexDocs(docs);
  }, [isOpen, tabs, flatFiles]);

  // Debounced query — 200 ms after last keystroke to avoid queuing every character.
  useEffect(() => {
    if (!isOpen || !q.trim()) { setResults([]); setFocusIdx(-1); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      queryDocs(q.trim(), 400).then(list => {
        if (!cancelled) { setResults(list as SearchResult[]); setFocusIdx(-1); }
      });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, isOpen]);

  // Click-to-open: resolve tab by path, open if not yet open, then reveal line.
  const handleOpen = useCallback((r: SearchResult) => {
    const edTabs = useEditorStore.getState().tabs;
    const existing = edTabs.find(t => t.path === r.docPath || t.path === r.docPath.replace(/^\//, ''));
    if (existing) {
      setActiveTab(existing.id);
      if (r.line > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('synapse.editor.reveal', {
            detail: { tabId: existing.id, line: r.line, column: 1 },
          }));
        }, 50);
      }
    } else {
      const fileNode = flatFiles.find(f => f.path === r.docPath);
      if (fileNode) {
        openTab(fileNode);
        if (r.line > 0) {
          setTimeout(() => {
            const newTab = useEditorStore.getState().tabs.find(t => t.path === r.docPath);
            if (newTab) {
              window.dispatchEvent(new CustomEvent('synapse.editor.reveal', {
                detail: { tabId: newTab.id, line: r.line, column: 1 },
              }));
            }
          }, 80);
        }
      }
    }
    onClose();
  }, [setActiveTab, openTab, flatFiles, onClose]);

  // Scope counts for badge labels.
  const counts = useMemo(() => ({
    all: results.length,
    files: results.filter(r => r.kind === 'filename').length,
    content: results.filter(r => r.kind === 'content').length,
    artifacts: results.filter(r => r.kind === 'artifact' || (r.kind === 'filename' && hasArtifact(r.semanticStatus))).length,
  }), [results]);

  // Filtered + grouped results.
  const { fileMatches, contentByFile, artifactMatches } = useMemo(() => {
    let pool = results;
    if (scope === 'files') pool = results.filter(r => r.kind === 'filename');
    else if (scope === 'content') pool = results.filter(r => r.kind === 'content');
    else if (scope === 'artifacts') pool = results.filter(r =>
      r.kind === 'artifact' || (r.kind === 'filename' && hasArtifact(r.semanticStatus))
    );

    const fileMatches = pool.filter(r => r.kind === 'filename');
    const artifactMatches = pool.filter(r => r.kind === 'artifact');

    // Group content results by file path.
    const contentByFile = new Map<string, SearchResult[]>();
    for (const r of pool.filter(r => r.kind === 'content')) {
      const group = contentByFile.get(r.docPath) ?? [];
      group.push(r);
      contentByFile.set(r.docPath, group);
    }

    return { fileMatches, contentByFile, artifactMatches };
  }, [results, scope]);

  const totalVisible = fileMatches.length +
    [...contentByFile.values()].reduce((s, arr) => s + arr.length, 0) +
    artifactMatches.length;

  // Flat ordered list mirrors the rendered order for keyboard navigation.
  const flatResults = useMemo<SearchResult[]>(() => {
    const out: SearchResult[] = [];
    for (const r of fileMatches) out.push(r);
    for (const rows of contentByFile.values()) for (const r of rows) out.push(r);
    for (const r of artifactMatches) out.push(r);
    return out;
  }, [fileMatches, contentByFile, artifactMatches]);

  // Combobox keyboard navigation: the input keeps DOM focus; the active option is
  // tracked via aria-activedescendant and scrolled into view (no focus stealing).
  // Arrows wrap; Home/End jump; Enter opens; Escape is owned by the base Modal.
  const moveActive = useCallback((next: number) => {
    setFocusIdx(next);
    resultRefs.current[next]?.scrollIntoView?.({ block: 'nearest' });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = flatResults.length;
    if (count === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(focusIdx < 0 ? 0 : (focusIdx + 1) % count);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(focusIdx <= 0 ? count - 1 : focusIdx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveActive(count - 1);
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault();
      handleOpen(flatResults[focusIdx]);
    }
  }, [flatResults, focusIdx, handleOpen, moveActive]);

  // Scope radiogroup: roving focus with arrows + Home/End.
  const handleScopeKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = SCOPE_ORDER.length;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % count;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next >= 0) {
      e.preventDefault();
      setScope(SCOPE_ORDER[next]);
      scopeRefs.current[next]?.focus();
    }
  }, []);

  const scopeLabel = (s: Scope, label: string) => {
    const n = counts[s];
    return n > 0 ? `${label} ${n}` : label;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search" size="palette" variant="palette">
      <Root>
        {/* Search input (combobox controlling the results listbox) */}
        <InputWrapper role="search">
          <SearchInput
            ref={inputRef}
            autoFocus
            placeholder="Search filenames, paths, and file content…"
            value={q}
            aria-label="Global search"
            role="combobox"
            aria-expanded={totalVisible > 0}
            aria-controls={totalVisible > 0 ? GS_LISTBOX_ID : undefined}
            aria-autocomplete="list"
            aria-activedescendant={focusIdx >= 0 ? optionId(focusIdx) : undefined}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </InputWrapper>

        {/* Scope filters (segmented radiogroup) */}
        <ScopeTabs role="radiogroup" aria-label="Search scope">
          {SCOPE_ORDER.map((s, i) => (
            <ScopeBtn
              key={s}
              ref={(el: HTMLButtonElement | null) => { scopeRefs.current[i] = el; }}
              $active={scope === s}
              role="radio"
              aria-checked={scope === s}
              tabIndex={scope === s ? 0 : -1}
              onClick={() => setScope(s)}
              onKeyDown={e => handleScopeKeyDown(e, i)}
            >
              {scopeLabel(s, s.charAt(0).toUpperCase() + s.slice(1))}
            </ScopeBtn>
          ))}
        </ScopeTabs>

        {/* Results */}
        <Results
          id={GS_LISTBOX_ID}
          role={totalVisible > 0 ? 'listbox' : undefined}
          aria-label={totalVisible > 0 ? 'Search results' : undefined}
        >
          {!q.trim() ? (
            <Empty>Type to search across filenames, paths, and file content</Empty>
          ) : totalVisible === 0 ? (
            <Empty>No results for &ldquo;{q}&rdquo;</Empty>
          ) : (() => {
            // Running index matches flatResults order for keyboard navigation refs.
            let idx = 0;
            return (
              <>
                {/* ── File / path matches ─────────────────────────────── */}
                {fileMatches.length > 0 ? (
                  <>
                    <SectionHeader>File matches — {fileMatches.length}</SectionHeader>
                    {fileMatches.map((r, i) => {
                      const refIdx = idx++;
                      return (
                        <ResultRow
                          key={`fn-${i}`}
                          ref={el => { resultRefs.current[refIdx] = el; }}
                          role="option"
                          id={optionId(refIdx)}
                          onClick={() => handleOpen(r)}
                          aria-label={r.docPath}
                          aria-selected={focusIdx === refIdx}
                        >
                          <RowTitle>
                            {r.isOpen ? <OpenDot title="Open in editor" /> : null}
                            <Highlight
                              text={r.docName}
                              idx={r.docName.toLowerCase().indexOf(q.trim().toLowerCase())}
                              len={q.trim().length}
                              q={q.trim()}
                            />
                            {r.semanticStatus ? <ArtifactBadges status={r.semanticStatus} /> : null}
                          </RowTitle>
                          <RowPath>{r.docPath}</RowPath>
                        </ResultRow>
                      );
                    })}
                  </>
                ) : null}

                {/* ── Content matches ─────────────────────────────────── */}
                {contentByFile.size > 0 ? (
                  <>
                    <SectionHeader>
                      Content — {[...contentByFile.values()].reduce((s, a) => s + a.length, 0)} matches in {contentByFile.size} {contentByFile.size === 1 ? 'file' : 'files'}
                    </SectionHeader>
                    {[...contentByFile.entries()].map(([path, rows]) => (
                      <div key={`cg-${path}`} style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                        <div style={{
                          fontSize: 11, fontFamily: SYNAPSE_TYPO.fontFamily,
                          color: 'var(--syn-text-muted, #778190)', padding: '2px 12px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {rows[0].isOpen ? <OpenDot title="Open in editor" /> : null}
                          {rows[0].docName}
                          {rows[0].semanticStatus ? <ArtifactBadges status={rows[0].semanticStatus} /> : null}
                        </div>
                        {rows.map((r, i) => {
                          const refIdx = idx++;
                          return (
                            <ResultRow
                              key={`cm-${i}`}
                              ref={el => { resultRefs.current[refIdx] = el; }}
                              role="option"
                              id={optionId(refIdx)}
                              onClick={() => handleOpen(r)}
                              aria-label={`${r.docName} line ${r.line}`}
                              aria-selected={focusIdx === refIdx}
                            >
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <LineNum>:{r.line}</LineNum>
                                <RowPreview>
                                  <Highlight text={r.preview} idx={r.matchIndex} len={r.matchLength} q={q.trim()} />
                                </RowPreview>
                              </div>
                            </ResultRow>
                          );
                        })}
                      </div>
                    ))}
                  </>
                ) : null}

                {/* ── Artifact metadata matches ────────────────────────── */}
                {artifactMatches.length > 0 ? (
                  <>
                    <SectionHeader>Artifact metadata — {artifactMatches.length}</SectionHeader>
                    {artifactMatches.map((r, i) => {
                      const refIdx = idx++;
                      return (
                        <ResultRow
                          key={`ar-${i}`}
                          ref={el => { resultRefs.current[refIdx] = el; }}
                          role="option"
                          id={optionId(refIdx)}
                          onClick={() => handleOpen(r)}
                          aria-label={r.docPath}
                          aria-selected={focusIdx === refIdx}
                        >
                          <RowTitle>
                            {r.isOpen ? <OpenDot title="Open in editor" /> : null}
                            {r.docName}
                            {r.semanticStatus ? <ArtifactBadges status={r.semanticStatus} /> : null}
                          </RowTitle>
                          <RowPath>{r.docPath}</RowPath>
                        </ResultRow>
                      );
                    })}
                  </>
                ) : null}
              </>
            );
          })()}
        </Results>
      </Root>
    </Modal>
  );
};

export default GlobalSearch;
