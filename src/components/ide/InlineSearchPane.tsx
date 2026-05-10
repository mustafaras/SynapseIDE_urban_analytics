import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Hash, Layers, Loader2, Search, X } from 'lucide-react';
import { indexDocs, queryDocs } from '../../services/search';
import { useFileExplorerStore } from '../../stores/fileExplorerStore';
import { useEditorStore, useTabActions } from '../../stores/editorStore';
import type { FileNode, FileSemanticStatus } from '../../types/state';
import './styles/inlineSearchPane.css';

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

function ArtifactBadges({ status }: { status: FileSemanticStatus }) {
  return (
    <>
      {status.generated ? <span className="isp-badge" data-color="amber">gen</span> : null}
      {status.analysisOutput ? <span className="isp-badge" data-color="teal">analysis</span> : null}
      {status.mapLayerCandidate ? <span className="isp-badge" data-color="blue">map</span> : null}
      {status.scenarioArtifact ? <span className="isp-badge" data-color="purple">scenario</span> : null}
      {status.synced ? <span className="isp-badge" data-color="green">synced</span> : null}
    </>
  );
}

function Highlight({ text, idx, len }: { text: string; idx: number; len: number }) {
  if (idx < 0 || len <= 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="isp-mark">{text.slice(idx, idx + len)}</mark>
      {text.slice(idx + len)}
    </>
  );
}

export const InlineSearchPane: React.FC = () => {
  const tabs = useEditorStore(s => s.tabs);
  const files = useFileExplorerStore(s => s.files);
  const { setActiveTab, openTab } = useTabActions();

  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatFiles = useMemo(() => flattenFiles(files), [files]);

  // Index whenever files or tabs change
  useEffect(() => {
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
  }, [tabs, flatFiles]);

  // Run query when q changes
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    queryDocs(q.trim(), 400).then(list => {
      if (!cancelled) {
        setResults(list as SearchResult[]);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [q]);

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
  }, [setActiveTab, openTab, flatFiles]);

  const counts = useMemo(() => ({
    all: results.length,
    files: results.filter(r => r.kind === 'filename').length,
    content: results.filter(r => r.kind === 'content').length,
    artifacts: results.filter(r =>
      r.kind === 'artifact' || (r.kind === 'filename' && hasArtifact(r.semanticStatus))
    ).length,
  }), [results]);

  const { fileMatches, contentByFile, artifactMatches } = useMemo(() => {
    let pool = results;
    if (scope === 'files') pool = results.filter(r => r.kind === 'filename');
    else if (scope === 'content') pool = results.filter(r => r.kind === 'content');
    else if (scope === 'artifacts') pool = results.filter(r =>
      r.kind === 'artifact' || (r.kind === 'filename' && hasArtifact(r.semanticStatus))
    );

    const fileMatchesArr = pool.filter(r => r.kind === 'filename');
    const artifactMatchesArr = pool.filter(r => r.kind === 'artifact');
    const contentByFileMap = new Map<string, SearchResult[]>();
    for (const r of pool.filter(r => r.kind === 'content')) {
      const group = contentByFileMap.get(r.docPath) ?? [];
      group.push(r);
      contentByFileMap.set(r.docPath, group);
    }
    return { fileMatches: fileMatchesArr, contentByFile: contentByFileMap, artifactMatches: artifactMatchesArr };
  }, [results, scope]);

  const totalVisible =
    fileMatches.length +
    [...contentByFile.values()].reduce((s, arr) => s + arr.length, 0) +
    artifactMatches.length;

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <section className="isp-root" aria-label="Search">
      <header className="isp-header">
        <Search size={13} aria-hidden="true" />
        <span>Search</span>
        {loading ? <Loader2 size={11} className="isp-spinner" aria-hidden="true" /> : null}
        {results.length > 0 && !loading ? (
          <span className="isp-total">{Math.min(totalVisible, 999)}</span>
        ) : null}
      </header>

      <div className="isp-input-wrap">
        <Search size={13} className="isp-input-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="isp-input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search files and content…"
          aria-label="Search query"
          spellCheck={false}
        />
        {q ? (
          <button
            type="button"
            className="isp-clear"
            onClick={() => { setQ(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            <X size={11} />
          </button>
        ) : null}
      </div>

      <div className="isp-scope-bar" role="tablist" aria-label="Search scope">
        {(['all', 'files', 'content', 'artifacts'] as Scope[]).map(s => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            className="isp-scope-btn"
            data-active={scope === s ? 'true' : 'false'}
            onClick={() => setScope(s)}
          >
            {s === 'all' ? 'All' : s === 'files' ? 'Files' : s === 'content' ? 'Content' : 'Artifacts'}
            {counts[s] > 0 ? <span className="isp-scope-count">{Math.min(counts[s], 99)}</span> : null}
          </button>
        ))}
      </div>

      {!q.trim() ? (
        <div className="isp-empty">
          <Search size={26} className="isp-empty-icon" aria-hidden="true" />
          <p className="isp-empty-title">Search files &amp; content</p>
          <p className="isp-empty-sub">Matches filenames, file contents, and AI-generated artifacts</p>
        </div>
      ) : totalVisible === 0 && !loading ? (
        <div className="isp-empty">
          <Hash size={26} className="isp-empty-icon" aria-hidden="true" />
          <p className="isp-empty-title">No results for &ldquo;{q}&rdquo;</p>
          <p className="isp-empty-sub">Try a different query or switch scope</p>
        </div>
      ) : (
        <div className="isp-results" role="list">
          {fileMatches.length > 0 ? (
            <>
              <div className="isp-section-label">
                <FileText size={10} aria-hidden="true" />
                Files
                <span className="isp-section-count">{fileMatches.length}</span>
              </div>
              {fileMatches.map(r => (
                <button
                  key={`${r.docId}-fn`}
                  type="button"
                  className="isp-row"
                  onClick={() => handleOpen(r)}
                  title={r.docPath}
                >
                  <span className="isp-row-name">
                    {r.isOpen ? <span className="isp-open-dot" aria-label="Open" /> : null}
                    <Highlight text={r.docName} idx={r.matchIndex} len={r.matchLength} />
                    {r.semanticStatus ? <ArtifactBadges status={r.semanticStatus} /> : null}
                  </span>
                  <span className="isp-row-path">{r.docPath}</span>
                </button>
              ))}
            </>
          ) : null}

          {[...contentByFile.entries()].map(([path, rows]) => (
            <React.Fragment key={path}>
              <div className="isp-section-label">
                <Hash size={10} aria-hidden="true" />
                {rows[0]?.docName ?? path}
                <span className="isp-section-count">{rows.length}</span>
              </div>
              {rows.map(r => (
                <button
                  key={`${r.docId}-co-${r.line}`}
                  type="button"
                  className="isp-row isp-row--content"
                  onClick={() => handleOpen(r)}
                >
                  <span className="isp-row-line">:{r.line}</span>
                  <span className="isp-row-preview">
                    <Highlight text={r.preview} idx={r.matchIndex} len={r.matchLength} />
                  </span>
                </button>
              ))}
            </React.Fragment>
          ))}

          {artifactMatches.length > 0 ? (
            <>
              <div className="isp-section-label">
                <Layers size={10} aria-hidden="true" />
                Artifacts
                <span className="isp-section-count">{artifactMatches.length}</span>
              </div>
              {artifactMatches.map(r => (
                <button
                  key={`${r.docId}-ar-${r.line}`}
                  type="button"
                  className="isp-row"
                  onClick={() => handleOpen(r)}
                  title={r.docPath}
                >
                  <span className="isp-row-name">
                    {r.docName}
                    {r.semanticStatus ? <ArtifactBadges status={r.semanticStatus} /> : null}
                  </span>
                  <span className="isp-row-path">{r.docPath}</span>
                </button>
              ))}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default InlineSearchPane;
