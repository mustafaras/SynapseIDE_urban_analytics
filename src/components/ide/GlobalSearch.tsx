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
  background: var(--syn-surface-hover, rgba(255,255,255,0.03));
  border: none;
  border-radius: 6px;
  padding: 0 12px;
  height: 46px;
  transition: background 160ms var(--syn-easing-bauhaus);
  &:focus-within {
    background: color-mix(in srgb, var(--syn-interaction-active, #3b82f6) 10%, transparent);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--syn-text-primary, #d6d3d1);
  font-family: ${SYNAPSE_TYPO.fontFamily};
  font-size: 14px;
  line-height: 1.4;
  &::placeholder { color: var(--syn-text-muted, #a8a29e); }
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
  color: ${({ $active }) => ($active ? 'var(--syn-text-primary, #f5f5f4)' : 'var(--syn-text-muted, #a8a29e)')};
  transition: color 120ms, opacity 120ms;
  &:hover { color: var(--syn-text-primary, #f5f5f4); opacity: 1; }
  &:focus-visible { outline: none; color: var(--syn-text-primary, #f5f5f4); }
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
  color: var(--syn-text-muted, #57534e);
  padding: 10px 4px 4px;
  user-select: none;
`;

const ResultRow = styled.button`
  text-align: left;
  padding: 9px 10px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--syn-text-secondary, #d6d3d1);
  font-family: ${SYNAPSE_TYPO.fontFamily};
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  transition: background 100ms;
  &:hover { background: var(--syn-surface-hover, rgba(255,255,255,0.04)); }
  &:focus-visible { outline: none; background: color-mix(in srgb, var(--syn-interaction-active, #3b82f6) 8%, transparent); }
`;

const RowTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--syn-text-primary, #e7e5e4);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RowPath = styled.div`
  font-size: 11px;
  color: var(--syn-text-muted, #78716c);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowPreview = styled.div`
  font-size: 12px;
  color: var(--syn-text-secondary, #a8a29e);
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
`;

const LineNum = styled.span`
  font-size: 11px;
  color: var(--syn-text-muted, #57534e);
  min-width: 32px;
  flex-shrink: 0;
`;

const OpenDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--syn-status-valid, #22c55e);
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
  color: var(--syn-text-muted, #57534e);
  padding: 14px 4px;
  text-align: center;
`;

// ── Types ───────────────────────────────────────────────────────────────────

type ResultKind = 'filename' | 'content' | 'artifact';
type Scope = 'all' | 'files' | 'content' | 'artifacts';

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
          color: 'var(--syn-text-primary, #f5f5f4)',
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
      {status.generated ? <BadgeInline $color="var(--syn-status-warning, #f59e0b)">gen</BadgeInline> : null}
      {status.analysisOutput ? <BadgeInline $color="var(--syn-status-info, #3b82f6)">analysis</BadgeInline> : null}
      {status.mapLayerCandidate ? <BadgeInline $color="var(--syn-status-info, #3b82f6)">map layer</BadgeInline> : null}
      {status.scenarioArtifact ? <BadgeInline $color="var(--syn-status-unknown, #8b5cf6)">scenario</BadgeInline> : null}
      {status.synced ? <BadgeInline $color="var(--syn-status-valid, #22c55e)">synced</BadgeInline> : null}
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
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Keyboard navigation: ↑/↓ to move focus, Enter to open, Escape to close.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(focusIdx + 1, flatResults.length - 1);
      setFocusIdx(next);
      resultRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(focusIdx - 1, 0);
      setFocusIdx(prev);
      resultRefs.current[prev]?.focus();
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault();
      handleOpen(flatResults[focusIdx]);
    }
  }, [flatResults, focusIdx, handleOpen]);

  const scopeLabel = (s: Scope, label: string) => {
    const n = counts[s];
    return n > 0 ? `${label} ${n}` : label;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search" size="palette" variant="palette">
      <Root>
        {/* Search input */}
        <InputWrapper>
          <SearchInput
            autoFocus
            placeholder="Search filenames, paths, and file content…"
            value={q}
            aria-label="Global search"
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </InputWrapper>

        {/* Scope tabs */}
        <ScopeTabs role="tablist" aria-label="Search scope">
          {(['all', 'files', 'content', 'artifacts'] as Scope[]).map(s => (
            <ScopeBtn
              key={s}
              $active={scope === s}
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
            >
              {scopeLabel(s, s.charAt(0).toUpperCase() + s.slice(1))}
            </ScopeBtn>
          ))}
        </ScopeTabs>

        {/* Results */}
        <Results role="listbox" aria-label="Search results">
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
                          color: 'var(--syn-text-muted, #78716C)', padding: '2px 12px', fontWeight: 600,
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
