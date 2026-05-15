
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { estimateTokens, timeAndLog } from '@/services/telemetry';
import { computeSanitizeDiff, sanitizeHtmlForPreview } from '../ai/AiAssistantConfig';
import { Editor } from '@monaco-editor/react';
import { defineSynapseMonacoTheme } from './monacoTheme';
import { useEditorStore, useTabActions } from '../../stores/editorStore';
import { useEditorPrefsStore } from '../../stores/useEditorPrefsStore';
import { focusOutline, SYNAPSE_COLORS, SYNAPSE_TYPO, withAlpha } from '@/ui/theme/synapseTheme';
import { ChevronRight, Eye, EyeOff, FileCode2, Play } from 'lucide-react';

import { sbCounts, sbCursor, sbOptions, sbSelection, sbSetFile } from '@/components/StatusBar/statusBridge';

import { projectApi } from '@/services/api';
import Modal from '@/components/molecules/Modal';
import { EditorPreviewToolbar } from './EditorPreviewToolbar';
import { subscribeEditorBridge } from '@/services/editor/bridge';
import { extractDocumentOutline, outlineThrottleMs } from '@/services/language/symbolOutline';
import { showToast } from '@/ui/toast/api';
import { reportError } from '@/lib/error-bus';
import { useOutlineStore } from '@/stores/outlineStore';
import {
  createDiagnosticId,
  type DiagnosticInput,
  type DiagnosticSeverity,
  type DiagnosticSource,
  useProblemsStore,
} from '@/stores/problemsStore';
import './monacoSurface.css';

interface MonacoEditorProps {
  tabId: string;
  content: string;
  language: string;
  onChange?: (value: string) => void;
}

type EditorSurfaceMetadata = {
  line: number;
  column: number;
  selectionChars: number;
  selectionLines: number;
  lines: number;
  words: number;
  chars: number;
  bytes: number;
  tabSize: number;
  indentation: 'spaces' | 'tabs';
  encoding: string;
  eol: 'LF' | 'CRLF';
  languageId: string;
  largeFile: boolean;
};

const LARGE_FILE_CHAR_THRESHOLD = 750000;
const LARGE_FILE_LINE_THRESHOLD = 20000;

const getByteLength = (value: string) =>
  typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).length : value.length;

const getLineCountFromText = (value: string) => {
  if (!value) return 1;
  return value.split(/\r\n|\r|\n/).length;
};

const getWordCount = (value: string) => (value.match(/\S+/g) || []).length;

const getEolFromText = (value: string): 'LF' | 'CRLF' => (/\r\n/.test(value) ? 'CRLF' : 'LF');

const normalizeLanguageLabel = (value?: string) => {
  const raw = String(value || 'plaintext').trim();
  if (!raw) return 'Plain Text';
  const known: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    jsx: 'JSX',
    javascriptreact: 'JSX',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    tsx: 'TSX',
    typescriptreact: 'TSX',
    py: 'Python',
    python: 'Python',
    md: 'Markdown',
    markdown: 'Markdown',
    json: 'JSON',
    html: 'HTML',
    css: 'CSS',
    tex: 'LaTeX',
    latex: 'LaTeX',
    plaintext: 'Plain Text',
  };
  return known[raw.toLowerCase()] || raw.toUpperCase();
};

const getFileExtension = (path?: string) => {
  const name = String(path || '').split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : '';
};

const getBreadcrumbParts = (path?: string, fallback = 'Untitled') => {
  const safePath = String(path || fallback).replace(/\\/g, '/');
  return safePath.split('/').filter(Boolean);
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const createMetadataFromContent = (value: string, languageId: string): EditorSurfaceMetadata => {
  const safe = value || '';
  const lines = getLineCountFromText(safe);
  return {
    line: 1,
    column: 1,
    selectionChars: 0,
    selectionLines: 0,
    lines,
    words: getWordCount(safe),
    chars: safe.length,
    bytes: getByteLength(safe),
    tabSize: 2,
    indentation: 'spaces',
    encoding: 'UTF-8',
    eol: getEolFromText(safe),
    languageId: languageId || 'plaintext',
    largeFile: safe.length > LARGE_FILE_CHAR_THRESHOLD || lines > LARGE_FILE_LINE_THRESHOLD,
  };
};

const normalizeMarkerCode = (code: unknown): string | number | undefined => {
  if (typeof code === 'string' || typeof code === 'number') return code;
  if (code && typeof code === 'object') {
    const value = (code as { value?: unknown }).value;
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
  return undefined;
};

const markerSeverityToDiagnostic = (severity: number): DiagnosticSeverity => {
  if (severity >= 8) return 'error';
  if (severity >= 4) return 'warning';
  if (severity >= 2) return 'info';
  return 'hint';
};

const markerOwnerToSource = (owner?: string): DiagnosticSource => {
  const normalized = String(owner || '').toLowerCase();
  if (normalized.includes('typescript')) return 'ts';
  if (normalized.includes('javascript')) return 'ts';
  if (normalized.includes('python')) return 'python';
  if (normalized.includes('eslint') || normalized.includes('lint')) return 'lint';
  return 'monaco';
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  tabId,
  content,
  language,
  onChange,
}) => {
  const { themeName } = useTheme();
  const { updateTabContent, saveTab } = useTabActions();
  const editorRef = useRef<any>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [editorWidth, setEditorWidth] = useState(() => {
    try {
      const s = localStorage.getItem('synapse.editor.split');
      if (s) return Math.max(15, Math.min(85, parseInt(s, 10)));
    } catch {}
    return 50;
  });
  const [isResizing, setIsResizing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewTimerRef = useRef<number | null>(null);

  const monacoRef = useRef<any>(null);
  const outlineRequestSeqRef = useRef(0);

  const activeThemeId =
    themeName === 'light'
      ? 'synapse-pro-light'
      : themeName === 'neutral'
        ? 'synapse-pro-neutral'
        : 'synapse-pro';
  const activeTab = useEditorStore(
    useCallback(state => state.tabs.find(tab => tab.id === tabId) || null, [tabId])
  );
  const [editorMetadata, setEditorMetadata] = useState<EditorSurfaceMetadata>(() =>
    createMetadataFromContent(content, language)
  );
  const pathForDisplay = activeTab?.path || activeTab?.name || 'Untitled';
  const breadcrumbParts = useMemo(
    () => getBreadcrumbParts(pathForDisplay, activeTab?.name || 'Untitled'),
    [pathForDisplay, activeTab?.name]
  );
  const languageLabel = normalizeLanguageLabel(editorMetadata.languageId || language || activeTab?.language);
  const previewCapable = useMemo(() => {
    const l = String(language || editorMetadata.languageId || '').toLowerCase();
    return ['javascript', 'html', 'css', 'typescript', 'ts', 'tsx', 'jsx', 'javascriptreact', 'typescriptreact'].includes(l);
  }, [language, editorMetadata.languageId]);
  const tabStateLabel = activeTab?.isDirty ? 'Unsaved' : 'Saved';
  const sourceLabel =
    activeTab?.origin === 'ai-plan'
      ? 'AI plan'
      : activeTab?.origin === 'bridge'
        ? 'Bridge'
        : activeTab?.origin === 'duplicate'
          ? 'Duplicate'
          : 'User';
  const monacoDiagnosticsProducerId = useMemo(() => `monaco:${tabId}`, [tabId]);

  const syncMonacoMarkersToProblems = useCallback(
    (markers: any[]) => {
      const file = activeTab?.path || pathForDisplay;
      const diagnostics: DiagnosticInput[] = (Array.isArray(markers) ? markers : [])
        .filter(marker => String(marker?.message || '').trim().length > 0)
        .map(marker => {
          const startLine = Math.max(1, Number(marker.startLineNumber || 1));
          const startColumn = Math.max(1, Number(marker.startColumn || 1));
          const endLine = Math.max(startLine, Number(marker.endLineNumber || startLine));
          const endColumn = Math.max(startColumn, Number(marker.endColumn || startColumn));
          const code = normalizeMarkerCode(marker.code);
          const source = markerOwnerToSource(marker.owner);
          const diagnostic: DiagnosticInput = {
            source,
            severity: markerSeverityToDiagnostic(Number(marker.severity || 1)),
            file,
            range: {
              start: { line: startLine, column: startColumn },
              end: { line: endLine, column: endColumn },
            },
            message: String(marker.message),
            relatedArtifact: {
              type: 'editor-tab',
              id: tabId,
              label: activeTab?.name || file,
              path: file,
            },
            ...(typeof code !== 'undefined' ? { code } : {}),
          };
          return {
            ...diagnostic,
            id: createDiagnosticId(diagnostic),
          };
        });

      useProblemsStore
        .getState()
        .setDiagnosticsForProducer(
          monacoDiagnosticsProducerId,
          diagnostics,
          diagnostics.length > 0 ? 'ready' : 'empty',
          `${activeTab?.name || file} Monaco markers`
        );
    },
    [activeTab?.name, activeTab?.path, monacoDiagnosticsProducerId, pathForDisplay, tabId]
  );

  const publishOutline = useCallback(
    (editorInstance?: any, monacoInstance?: any) => {
      const editor = editorInstance || editorRef.current;
      const monaco = monacoInstance || monacoRef.current || (window as any).monaco;
      const model = editor?.getModel?.();
      if (!editor || !model || !monaco) return;

      const filePath = activeTab?.path || activeTab?.name || pathForDisplay || 'Untitled';
      const languageId = model.getLanguageId?.() || language || activeTab?.language || 'plaintext';
      const requestId = outlineRequestSeqRef.current + 1;
      outlineRequestSeqRef.current = requestId;

      try {
        const existingTimer = (editor as any)._outlineTimer;
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }
      } catch {}

      useOutlineStore.getState().markLoading(tabId, { path: filePath, language: languageId });

      try {
        (editor as any)._outlineTimer = window.setTimeout(() => {
          extractDocumentOutline({
            monaco,
            model,
            tabId,
            path: filePath,
            language: languageId,
          })
            .then(entry => {
              if (outlineRequestSeqRef.current !== requestId) return;
              useOutlineStore.getState().setEntry(entry);
            })
            .catch(error => {
              if (outlineRequestSeqRef.current !== requestId) return;
              useOutlineStore.getState().setError(tabId, {
                path: filePath,
                language: languageId,
                message: String(error?.message || error || 'Outline extraction failed.'),
              });
            })
            .finally(() => {
              if (outlineRequestSeqRef.current === requestId) {
                try {
                  (editor as any)._outlineTimer = null;
                } catch {}
              }
            });
        }, outlineThrottleMs);
      } catch (error: any) {
        useOutlineStore.getState().setError(tabId, {
          path: filePath,
          language: languageId,
          message: String(error?.message || error || 'Outline extraction could not be scheduled.'),
        });
      }
    },
    [activeTab?.language, activeTab?.name, activeTab?.path, language, pathForDisplay, tabId]
  );

  useEffect(() => {
    setEditorMetadata(previous => {
      const next = createMetadataFromContent(content, language);
      return {
        ...next,
        line: previous.line,
        column: previous.column,
        selectionChars: previous.selectionChars,
        selectionLines: previous.selectionLines,
      };
    });
  }, [content, language]);

  useEffect(() => {
    if (!activeTab) return;
    try {
      sbSetFile(activeTab.path, activeTab.name, getFileExtension(activeTab.path), activeTab.isDirty);
    } catch {}
  }, [activeTab?.path, activeTab?.name, activeTab?.isDirty]);

  const publishEditorMetadata = useCallback(
    (editorInstance?: any) => {
      const editor = editorInstance || editorRef.current;
      const model = editor?.getModel?.();
      const text = model?.getValue?.() ?? content ?? '';
      const lines = model?.getLineCount?.() || getLineCountFromText(text);
      const position = editor?.getPosition?.();
      const selections = editor?.getSelections?.() || [];
      const selectionChars = selections.reduce(
        (total: number, selection: any) =>
          total + Math.abs(model?.getValueLengthInRange?.(selection) || 0),
        0
      );
      const selectionLines = selections.reduce(
        (total: number, selection: any) =>
          total +
          Math.max(
            0,
            (selection?.endLineNumber ?? selection?.startLineNumber ?? 0) -
              (selection?.startLineNumber ?? 0) +
              1
          ),
        0
      );
      const options = model?.getOptions?.();
      const eol = model?.getEOL?.() === '\r\n' ? 'CRLF' : getEolFromText(text);
      const metadata: EditorSurfaceMetadata = {
        line: position?.lineNumber || 1,
        column: position?.column || 1,
        selectionChars,
        selectionLines,
        lines,
        words: getWordCount(text),
        chars: text.length,
        bytes: getByteLength(text),
        tabSize: Number(options?.tabSize || 2),
        indentation: options?.insertSpaces === false ? 'tabs' : 'spaces',
        encoding: 'UTF-8',
        eol,
        languageId: model?.getLanguageId?.() || language || 'plaintext',
        largeFile: text.length > LARGE_FILE_CHAR_THRESHOLD || lines > LARGE_FILE_LINE_THRESHOLD,
      };

      setEditorMetadata(metadata);
      try {
        sbCursor(metadata.line, metadata.column);
        sbSelection(metadata.selectionChars, metadata.selectionLines);
        sbCounts(metadata.lines, metadata.words, metadata.chars, metadata.bytes);
        sbOptions(
          metadata.languageId,
          metadata.tabSize,
          metadata.indentation,
          metadata.encoding,
          metadata.eol
        );
      } catch {}

      return metadata;
    },
    [content, language]
  );


  useEffect(() => {

    const off = subscribeEditorBridge((e) => {
      try {
        if (e.type === 'editor:insertAtCursor') {
          const ed = editorRef.current;
          if (!ed) throw new Error('No active editor');
          const model = ed.getModel?.();
          if (!model) throw new Error('No model');
          const sel = ed.getSelection?.();
          let range: any;
          if (sel && !sel.isEmpty()) {
            range = sel;
          } else {
            const pos = ed.getPosition?.();
            const m = monacoRef.current;
            range = m?.Range ? new m.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column) : { startLineNumber: pos?.lineNumber || 1, startColumn: pos?.column || 1, endLineNumber: pos?.lineNumber || 1, endColumn: pos?.column || 1 };
          }
          ed.executeEdits('bridge-insert', [{ range, text: e.payload.code, forceMoveMarkers: true }]);
          ed.pushUndoStop?.();
          showToast({ kind: 'success', message: 'Inserted at cursor', contextKey: 'editor:insert' });
        } else if (e.type === 'editor:replaceActive') {
          const ed = editorRef.current;
          if (!ed) throw new Error('No active editor');
          const model = ed.getModel?.();
          if (!model) throw new Error('No model');
          const range = model.getFullModelRange?.();
          ed.pushUndoStop?.();
          ed.executeEdits('bridge-replace', [{ range, text: e.payload.code, forceMoveMarkers: true }]);
          ed.pushUndoStop?.();
          showToast({ kind: 'success', message: 'Replaced active file', contextKey: 'editor:replace' });
        }
      } catch (err: any) {
        reportError({ source: 'ui', code: 'unknown', message: String(err?.message || err) });
      }
    });
    return () => {
      try { off?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    const monaco = monacoRef.current || (window as any).monaco;
    if (!monaco) return;
    try {
      monaco?.editor?.setTheme?.(activeThemeId);
    } catch {}
  }, [activeThemeId]);

  // Subscribe to editor prefs changes and apply them live to the Monaco instance.
  useEffect(() => {
    function applyPrefs(prefs: ReturnType<typeof useEditorPrefsStore.getState>) {
      const ed = editorRef.current;
      if (!ed?.updateOptions) return;
      try {
        ed.updateOptions({
          fontSize: prefs.fontSize,
          fontFamily: prefs.fontFamily,
          lineHeight: prefs.lineHeight * prefs.fontSize,
          tabSize: prefs.tabSize,
          insertSpaces: prefs.insertSpaces,
          wordWrap: prefs.wordWrap ? 'on' : 'off',
          minimap: { enabled: prefs.minimap },
          lineNumbers: prefs.lineNumbers,
          cursorStyle: prefs.cursorStyle,
          renderWhitespace: prefs.renderWhitespace,
          bracketPairColorization: { enabled: prefs.bracketPairColorization },
          formatOnPaste: prefs.formatOnPaste,
          stickyScroll: { enabled: prefs.stickyScroll },
          rulers: prefs.rulers ? [80, 120] : [],
          smoothScrolling: prefs.smoothScrolling,
          mouseWheelZoom: prefs.mouseWheelZoom,
          inlineSuggest: { enabled: prefs.inlineSuggest },
        });
      } catch {}
    }
    // Apply immediately in case editor is already mounted
    applyPrefs(useEditorPrefsStore.getState());
    // Subscribe to future updates
    return useEditorPrefsStore.subscribe(applyPrefs);
  }, []);

  const [autoRefresh, setAutoRefresh] = useState(true);

  const [previewRatio, setPreviewRatio] = useState<'auto' | 'fit' | '1:1' | '16:9' | '4:3'>(() => {
    try { return (localStorage.getItem('synapse.preview.aspect') as any) || 'fit'; } catch { return 'fit'; }
  });

  const [aiBusy, setAiBusy] = useState<null | 'improve' | 'explain' | 'comment'>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffText, setDiffText] = useState('');
  const [fullResult, setFullResult] = useState('');
  const [activeDiffTab, setActiveDiffTab] = useState<'diff' | 'full'>('diff');
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanationContent, setExplanationContent] = useState('');
  const [explanationHasContent, setExplanationHasContent] = useState(false);
  interface LocalToast {
    id: string;
    msg: string;
    retry?: (() => void) | undefined;
  }
  const [localToasts, setLocalToasts] = useState<LocalToast[]>([]);
  const lastEditedModelSnapshotRef = useRef<string | null>(null);
  const improveOriginalRangeRef = useRef<any | null>(null);
  const [diffCopied, setDiffCopied] = useState(false);
  const handleCopyDiff = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(diffText);
      setDiffCopied(true);
      setTimeout(() => setDiffCopied(false), 1600);
    } catch {}
  }, [diffText]);


  // Session restoration: previous versions wiped persisted editor state on every
  // fresh session, which destroyed Prompt 05's "tabs restore deterministically"
  // guarantee. State is now durable across reloads; consumers that want a clean
  // slate must invoke the explicit Close All Tabs command.


  const runCode = useCallback(
    (force?: boolean) => {
      if (!iframeRef.current) return;

      try {
        if (!force && !autoRefresh) return;
      } catch {
        if (!autoRefresh && !force) return;
      }

      try {
        let htmlContent = '';

    const baseStyles = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { height: 100%; }
    html, body { margin: 0; padding: 0; }
  body { margin: 20px; background: var(--bg); color: var(--text) !important; font-family: ${SYNAPSE_TYPO.fontFamily}; }

        .synapse-console { background: var(--bg2); border: 1px solid var(--border); padding: 10px; margin: 10px 0; border-radius: 8px; }
        .synapse-console strong { color: var(--gold); }
        .synapse-console__content { display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.5; }
  .synapse-console__msg { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
        .synapse-console__msg.log { color: var(--info); }
        .synapse-console__msg.info { color: var(--info); }
        .synapse-console__msg.warn { color: var(--warn); }
        .synapse-console__msg.error { color: var(--error); }

        #synapse-error-overlay { position: fixed; top: 16px; right: 16px; max-width: 70%; background: var(--bg2); color: var(--error); border: 1px solid var(--error); border-radius: 10px; padding: 10px 12px; box-shadow: var(--shadow-lg); display: none; z-index: 2147483647; }
        #synapse-error-overlay.visible { display: flex; align-items: flex-start; gap: 10px; }
        #synapse-error-overlay .synapse-error-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--error); box-shadow: 0 0 8px var(--error); margin-top: 4px; }
        #synapse-error-overlay .synapse-error-message { font-family: ${SYNAPSE_TYPO.fontFamily}; font-size: 12px; }
        #synapse-error-overlay button { margin-left: 8px; background: transparent; border: 1px solid var(--error); color: var(--error); padding: 4px 8px; border-radius: 6px; cursor: pointer; }
        #synapse-error-overlay button:hover { filter: brightness(1.2); }
  pre, code { font-family: ${SYNAPSE_TYPO.fontFamily}; color: var(--text) !important; }
        .synapse-highlight { background: var(--sel); border-radius: 4px; padding: 2px 4px; }

        html { scrollbar-width: thin; scrollbar-color: ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.6)} transparent; }
        ::-webkit-scrollbar { width: 4px; height: 4px; background: transparent; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.6)}, ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.4)}); border-radius: 2px; border: none; transition: background 150ms var(--syn-easing-bauhaus); }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.8)}, ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.6)}); }

  .synapse-console:focus-visible, #synapse-error-overlay:focus-visible { outline: ${focusOutline()}; outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition-duration: 50ms !important; scroll-behavior: auto !important; } }
      `;

  const htmlVars = `--bg: ${SYNAPSE_COLORS.bgDark}; --bg2: ${SYNAPSE_COLORS.bgSecondary}; --text: ${SYNAPSE_COLORS.textPrimary}; --muted: ${SYNAPSE_COLORS.textSecondary}; --gold: ${SYNAPSE_COLORS.goldPrimary}; --border: ${SYNAPSE_COLORS.border}; --error: ${SYNAPSE_COLORS.error}; --warn: ${SYNAPSE_COLORS.warning}; --info: ${SYNAPSE_COLORS.accentNeutral}; --sel: ${SYNAPSE_COLORS.hover};`;
  const buildVarStyleTag = (vars: string) => `<style id="synapse-preview-vars">:root{${vars}}</style>`;

        const captureScript = `
        (function(){
          try {
            const d = document;
            let consoleRoot = d.getElementById('synapse-console');
            if (!consoleRoot) {
              consoleRoot = d.createElement('div');
              consoleRoot.id = 'synapse-console';
              consoleRoot.className = 'synapse-console';
              consoleRoot.innerHTML = '<strong>Console Output:</strong><div id="synapse-console-content" class="synapse-console__content"></div>';
              d.body && d.body.appendChild(consoleRoot);
              try { consoleRoot.setAttribute('tabindex', '0'); } catch {}
            }
            const consoleContent = d.getElementById('synapse-console-content');
            const errorOverlay = (function(){
              let e = d.getElementById('synapse-error-overlay');
              if (!e) {
                e = d.createElement('div');
                e.id = 'synapse-error-overlay';
                e.innerHTML = '<div class="synapse-error-dot"></div><div class="synapse-error-message" id="synapse-error-message"></div><button id="synapse-error-dismiss" aria-label="Dismiss error">Dismiss</button>';
                (d.body || d.documentElement).appendChild(e);
                const btn = e.querySelector('#synapse-error-dismiss');
                btn && btn.addEventListener('click', function(){ e.className = e.className.replace('visible','').trim(); });
              }
              try { e.setAttribute('role', 'alert'); } catch {}
              return e;
            })();

            const addMsg = (cls, text) => {
              try {
                const div = d.createElement('div');
                div.className = 'synapse-console__msg ' + cls;
                div.textContent = String(text);
                consoleContent && consoleContent.appendChild(div);
              } catch {}
            };

            const showError = (msg) => {
              try {
                if (!errorOverlay) return;
                errorOverlay.className = 'visible';
                const el = d.getElementById('synapse-error-message');
                if (el) el.textContent = 'Error: ' + String(msg);
              } catch {}
            };

            const orig = window.console;
            window.console = {
              ...orig,
              log: (...args) => { addMsg('log', args.join(' ')); orig.log && orig.log(...args); },
              info: (...args) => { addMsg('info', args.join(' ')); orig.info && orig.info(...args); },
              warn: (...args) => { addMsg('warn', args.join(' ')); orig.warn && orig.warn(...args); },
              error: (...args) => { addMsg('error', args.join(' ')); showError(args.join(' ')); orig.error && orig.error(...args); }
            };

            window.onerror = function(message, source, lineno, colno, error){
              showError(message || (error && error.message) || 'Unknown error');
              return false;
            };
            window.onunhandledrejection = function(e){
              const reason = (e && (e.reason && (e.reason.message || e.reason))) || 'Unhandled rejection';
              showError(reason);
            };
          } catch {}
        })();
      `;

        const langLower = String(language || '').toLowerCase();

        // ── HTML ──────────────────────────────────────────────────────────────
        if (langLower === 'html') {
          let raw = content || '';
          raw = raw.replace(/<style[^>]*id=("|')synapse-preview-vars\1[^>]*>[\s\S]*?<\/style>/gi, '');
          if (/<head[\s>]/i.test(raw)) {
            raw = raw.replace(/<head[^>]*>/i, (m) => `${m}${buildVarStyleTag(htmlVars)}<style>${baseStyles}</style>`);
          } else if (/<html[\s>]/i.test(raw)) {
            raw = raw.replace(/<html([^>]*)>/i, (_m, g1) => `<html${g1}><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}</style></head>`);
          }
          if (/<body[\s>]/i.test(raw)) {
            raw = raw.replace(/<body[^>]*>/i, (m) => `${m}<script>${captureScript}</script>`);
          }
          if (!/<html[\s>]/i.test(raw)) {
            raw = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}</style></head><body>${raw}<script>${captureScript}</script></body></html>`;
          }
          htmlContent = raw;

        // ── JavaScript ────────────────────────────────────────────────────────
        } else if (langLower === 'javascript' || langLower === 'js') {
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}</style></head>
          <body>
            <div id="output"></div>
            <div id="synapse-console" class="synapse-console"><strong>Console Output:</strong><div id="synapse-console-content" class="synapse-console__content"></div></div>
            <script>${captureScript}</script>
            <script>setTimeout(() => { try { (function(){ ${content} })(); } catch (e) { console.error(e && e.message ? e.message : String(e)); } }, 0);</script>
          </body></html>`;

        // ── TypeScript / TSX / JSX ────────────────────────────────────────────
        } else if (['typescript','ts','tsx','jsx','javascriptreact','typescriptreact'].includes(langLower)) {
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            #root{padding:8px;}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.25);margin-bottom:8px;font-family:monospace;}
          </style></head>
          <body>
            <span class="preview-badge">${langLower.toUpperCase()} · Babel transpile</span>
            <div id="root"></div>
            <div id="synapse-console" class="synapse-console"><strong>Console Output:</strong><div id="synapse-console-content" class="synapse-console__content"></div></div>
            <script>${captureScript}</script>
            <script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script>
              window.addEventListener('load', function() {
                try {
                  var src = ${JSON.stringify(content)};
                  var result = Babel.transform(src, { presets: [['typescript',{allExtensions:true,isTSX:true}],'react'], filename: 'preview.tsx' });
                  var mod = { exports: {} };
                  var fn = new Function('module','exports','React','ReactDOM','require', result.code);
                  fn(mod, mod.exports, React, ReactDOM, function(){ return {}; });
                  var Comp = mod.exports.default || mod.exports[Object.keys(mod.exports)[0]];
                  if (typeof Comp === 'function') {
                    var root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(React.createElement(Comp));
                  }
                } catch (e) { console.error(e && e.message ? e.message : String(e)); }
              });
            </script>
          </body></html>`;

        // ── CSS ───────────────────────────────────────────────────────────────
        } else if (langLower === 'css' || langLower === 'scss' || langLower === 'less') {
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}</style>
          <style>${content}</style></head>
          <body>
            <div class="preview-badge" style="display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(245,158,11,0.15);color:#F59E0B;border:1px solid rgba(245,158,11,0.25);margin-bottom:12px;font-family:monospace;">${langLower.toUpperCase()} Preview</div>
            <h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>
            <p>Paragraph text with <a href="#">a link</a>, <strong>bold</strong>, <em>italic</em> and <code>inline code</code>.</p>
            <button class="btn">Button</button>
            <button class="btn btn-primary">Primary</button>
            <button class="btn btn-secondary">Secondary</button>
            <input type="text" placeholder="Input field" class="input" />
            <div class="card"><div class="card-header">Card Header</div><div class="card-body">Card body content goes here.</div></div>
            <ul><li>List item one</li><li>List item two</li><li>List item three</li></ul>
            <table><thead><tr><th>Col A</th><th>Col B</th><th>Col C</th></tr></thead><tbody><tr><td>Row 1</td><td>Data</td><td>Value</td></tr><tr><td>Row 2</td><td>Data</td><td>Value</td></tr></tbody></table>
            <script>${captureScript}</script>
          </body></html>`;

        // ── JSON ──────────────────────────────────────────────────────────────
        } else if (langLower === 'json' || langLower === 'jsonc') {
          const jsonEscaped = JSON.stringify(content);
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            .json-viewer{font-family:monospace;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-all;}
            .jk{color:#60A5FA;}.js{color:#4ADE80;}.jn{color:#F59E0B;}.jb{color:#A78BFA;}.jnull{color:#9CA3AF;font-style:italic;}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(96,165,250,0.15);color:#60A5FA;border:1px solid rgba(96,165,250,0.25);margin-bottom:8px;font-family:monospace;}
            .json-error{color:#EF4444;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:4px;padding:8px 12px;font-family:monospace;font-size:12px;}
          </style></head>
          <body>
            <span class="preview-badge">JSON</span>
            <div id="root"></div>
            <script>
              (function(){
                try {
                  var raw = ${jsonEscaped};
                  var obj = JSON.parse(raw);
                  function colorize(val, depth) {
                    if (depth === undefined) depth = 0;
                    if (val === null) return '<span class="jnull">null</span>';
                    if (typeof val === 'boolean') return '<span class="jb">' + val + '</span>';
                    if (typeof val === 'number') return '<span class="jn">' + val + '</span>';
                    if (typeof val === 'string') return '<span class="js">"' + val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '"</span>';
                    var indent = '  '.repeat(depth + 1);
                    var closingIndent = '  '.repeat(depth);
                    if (Array.isArray(val)) {
                      if (val.length === 0) return '[]';
                      return '[\\n' + val.map(function(v){ return indent + colorize(v, depth+1); }).join(',\\n') + '\\n' + closingIndent + ']';
                    }
                    var keys = Object.keys(val);
                    if (keys.length === 0) return '{}';
                    return '{\\n' + keys.map(function(k){ return indent + '<span class="jk">"' + k + '"</span>: ' + colorize(val[k], depth+1); }).join(',\\n') + '\\n' + closingIndent + '}';
                  }
                  document.getElementById('root').innerHTML = '<div class="json-viewer">' + colorize(obj) + '</div>';
                } catch(e) {
                  document.getElementById('root').innerHTML = '<div class="json-error">JSON Parse Error: ' + (e.message || String(e)) + '</div>';
                }
              })();
            </script>
          </body></html>`;

        // ── Markdown ──────────────────────────────────────────────────────────
        } else if (langLower === 'markdown' || langLower === 'md' || langLower === 'mdx') {
          const mdEscaped = JSON.stringify(content);
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            .md-body{max-width:780px;line-height:1.75;font-size:14px;}
            .md-body h1,.md-body h2,.md-body h3,.md-body h4{color:#F59E0B;margin:1.2em 0 0.4em;line-height:1.3;}
            .md-body h1{font-size:1.8em;border-bottom:1px solid rgba(245,158,11,0.2);padding-bottom:0.3em;}
            .md-body h2{font-size:1.4em;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.2em;}
            .md-body h3{font-size:1.15em;} .md-body h4{font-size:1em;}
            .md-body a{color:#60A5FA;text-decoration:none;} .md-body a:hover{text-decoration:underline;}
            .md-body code{background:rgba(0,0,0,0.35);padding:2px 5px;border-radius:3px;font-size:0.85em;font-family:monospace;color:#4ADE80;}
            .md-body pre{background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);border-radius:5px;padding:12px;overflow-x:auto;}
            .md-body pre code{background:none;padding:0;color:#E5E5E5;}
            .md-body blockquote{border-left:3px solid #F59E0B;margin:0;padding:4px 12px;background:rgba(245,158,11,0.05);color:rgba(229,229,229,0.7);}
            .md-body table{border-collapse:collapse;width:100%;margin:12px 0;}
            .md-body th,.md-body td{border:1px solid rgba(255,255,255,0.1);padding:6px 10px;text-align:left;}
            .md-body th{background:rgba(245,158,11,0.08);color:#F59E0B;}
            .md-body tr:nth-child(even){background:rgba(255,255,255,0.02);}
            .md-body ul,.md-body ol{padding-left:1.4em;} .md-body li{margin:3px 0;}
            .md-body img{max-width:100%;border-radius:4px;}
            .md-body hr{border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1.5em 0;}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(74,222,128,0.12);color:#4ADE80;border:1px solid rgba(74,222,128,0.2);margin-bottom:10px;font-family:monospace;}
          </style></head>
          <body>
            <span class="preview-badge">MARKDOWN</span>
            <div id="root" class="md-body"></div>
            <script src="https://unpkg.com/marked@12.0.0/marked.min.js"></script>
            <script>
              window.addEventListener('load', function(){
                try {
                  var src = ${mdEscaped};
                  document.getElementById('root').innerHTML = marked.parse(src, { breaks: true, gfm: true });
                } catch(e) { document.getElementById('root').textContent = src; }
              });
            </script>
          </body></html>`;

        // ── SVG ───────────────────────────────────────────────────────────────
        } else if (langLower === 'svg') {
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:var(--bg);}
            .svg-wrap{max-width:100%;max-height:80vh;display:flex;align-items:center;justify-content:center;}
            svg{max-width:100%;max-height:80vh;}
            .preview-badge{font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(167,139,250,0.15);color:#A78BFA;border:1px solid rgba(167,139,250,0.25);margin-bottom:10px;font-family:monospace;}
          </style></head>
          <body>
            <span class="preview-badge">SVG</span>
            <div class="svg-wrap">${content}</div>
          </body></html>`;

        // ── CSV ───────────────────────────────────────────────────────────────
        } else if (langLower === 'csv') {
          const csvEscaped = JSON.stringify(content);
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            table{border-collapse:collapse;width:100%;font-size:12px;}
            th{background:rgba(245,158,11,0.1);color:#F59E0B;border:1px solid rgba(245,158,11,0.2);padding:6px 10px;text-align:left;position:sticky;top:0;}
            td{border:1px solid rgba(255,255,255,0.07);padding:5px 10px;}
            tr:nth-child(even) td{background:rgba(255,255,255,0.02);}
            tr:hover td{background:rgba(245,158,11,0.04);}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(245,158,11,0.12);color:#F59E0B;border:1px solid rgba(245,158,11,0.2);margin-bottom:8px;font-family:monospace;}
            .row-count{font-size:11px;color:rgba(229,229,229,0.4);margin-bottom:8px;}
          </style></head>
          <body>
            <span class="preview-badge">CSV</span>
            <div id="info" class="row-count"></div>
            <div style="overflow:auto;max-height:calc(100vh - 80px);"><table id="tbl"></table></div>
            <script>
              (function(){
                var raw = ${csvEscaped};
                var rows = raw.trim().split(/\\r?\\n/).map(function(r){ return r.split(',').map(function(c){ return c.trim().replace(/^"|"$/g,''); }); });
                if (!rows.length) return;
                var thead = '<thead><tr>' + rows[0].map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead>';
                var tbody = '<tbody>' + rows.slice(1).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
                document.getElementById('tbl').innerHTML = thead + tbody;
                document.getElementById('info').textContent = (rows.length - 1) + ' rows · ' + rows[0].length + ' columns';
              })();
            </script>
          </body></html>`;

        // ── YAML ──────────────────────────────────────────────────────────────
        } else if (langLower === 'yaml' || langLower === 'yml') {
          const safeContent = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            .yaml-body{font-family:monospace;font-size:13px;line-height:1.7;white-space:pre-wrap;}
            .yk{color:#60A5FA;}.yv{color:#4ADE80;}.yc{color:rgba(229,229,229,0.35);font-style:italic;}.ysep{color:#F59E0B;}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(96,165,250,0.12);color:#60A5FA;border:1px solid rgba(96,165,250,0.2);margin-bottom:8px;font-family:monospace;}
          </style></head>
          <body>
            <span class="preview-badge">YAML</span>
            <div id="root"></div>
            <script>
              (function(){
                var lines = ${JSON.stringify(safeContent)}.split('\\n');
                var html = lines.map(function(line){
                  if (/^\\s*#/.test(line)) return '<span class="yc">' + line + '</span>';
                  var m = line.match(/^(\\s*-?\\s*)([\\w\\-\\.]+)(\\s*:\\s*)(.*)?$/);
                  if (m) return m[1] + '<span class="yk">' + m[2] + '</span><span class="ysep">' + m[3] + '</span><span class="yv">' + (m[4]||'') + '</span>';
                  return line;
                }).join('\\n');
                document.getElementById('root').innerHTML = '<div class="yaml-body">' + html + '</div>';
              })();
            </script>
          </body></html>`;

        // ── Python / Rust / Go / Java / C / C++ / Shell / etc. ───────────────
        } else if (['python','py','rust','rs','go','java','c','cpp','csharp','cs','php','ruby','rb','swift','kotlin','kt','shell','bash','sh','powershell','ps1','r','lua','perl'].includes(langLower)) {
          const langLabels: Record<string, string> = { python:'Python', py:'Python', rust:'Rust', rs:'Rust', go:'Go', java:'Java', c:'C', cpp:'C++', csharp:'C#', cs:'C#', php:'PHP', ruby:'Ruby', rb:'Ruby', swift:'Swift', kotlin:'Kotlin', kt:'Kotlin', shell:'Shell', bash:'Bash', sh:'Shell', powershell:'PowerShell', ps1:'PowerShell', r:'R', lua:'Lua', perl:'Perl' };
          const label = langLabels[langLower] || langLower.toUpperCase();
          const safeCode = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            .code-wrap{background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.07);border-radius:5px;overflow:auto;padding:16px;}
            pre{margin:0;font-size:13px;line-height:1.6;}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(167,139,250,0.12);color:#A78BFA;border:1px solid rgba(167,139,250,0.2);margin-bottom:8px;font-family:monospace;}
            .no-run{font-size:11px;color:rgba(229,229,229,0.35);margin-bottom:10px;}
          </style></head>
          <body>
            <span class="preview-badge">${label}</span>
            <div class="no-run">Read-only — ${label} cannot run in-browser</div>
            <div class="code-wrap"><pre>${safeCode}</pre></div>
          </body></html>`;

        // ── Plain text / everything else ──────────────────────────────────────
        } else {
          const safeCode = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          const badge = langLower ? langLower.toUpperCase() : 'TEXT';
          htmlContent = `<!DOCTYPE html><html><head>${buildVarStyleTag(htmlVars)}<style>${baseStyles}
            .preview-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;background:rgba(245,158,11,0.1);color:#F59E0B;border:1px solid rgba(245,158,11,0.18);margin-bottom:8px;font-family:monospace;}
          </style></head>
          <body>
            <span class="preview-badge">${badge}</span>
            <pre style="font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${safeCode}</pre>
          </body></html>`;
        }


  const safeHtml = sanitizeHtmlForPreview(htmlContent, { allowInlineScripts: true, allowDataImages: true });
  try {

    try {
      const diff = computeSanitizeDiff(htmlContent, safeHtml);
      void diff;
    } catch {}
    iframeRef.current.srcdoc = safeHtml;
  } catch {}
      } catch (error) {
        console.error('Error running code:', error);
      }


      try {
        const ed = editorRef.current;
        ed?.updateOptions?.({ minimap: { enabled: true, renderCharacters: true } as any });
      } catch {}
    },
  [content, language, autoRefresh]
  );


  const getSelectionOrLine = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return { code: content, range: null };
    const model = editor.getModel?.();
    const selection = editor.getSelection?.();
    if (!model) return { code: content, range: null };
    if (selection && !selection.isEmpty()) {
      const selected = model.getValueInRange(selection);
      return { code: selected, range: selection };
    }

    const pos = editor.getPosition?.();
    if (pos) {
      const line = model.getLineContent(pos.lineNumber);
      const range = {
        startLineNumber: pos.lineNumber,
        startColumn: 1,
        endLineNumber: pos.lineNumber,
        endColumn: line.length + 1,
      };
      return { code: line, range } as any;
    }
    return { code: content, range: null };
  }, [content]);

  const buildImprovePrompt = (snippet: string, lang: string) =>
    `You are an AI coding assistant. Improve the following ${lang} code for readability, performance, and best practices without changing external behavior. Respond FIRST with a unified diff (no filenames needed) using lines starting with + and - and @@ hunks; if a diff is not feasible, output the full improved code only. DO NOT wrap in markdown fences.\n-----\n${snippet}\n-----`;
  const buildExplainPrompt = (snippet: string, lang: string) =>
    `Explain the following ${lang} code for a developer in concise bullet points. No code execution. Use clear bullet list.\n-----\n${snippet}\n-----`;
  const buildCommentPrompt = (snippet: string, lang: string) =>
    `Add beginner-friendly inline comments to this ${lang} code. Return ONLY the code with comments added. Keep logic unchanged. Avoid over-commenting obvious syntax.\n-----\n${snippet}\n-----`;

  const parseUnifiedDiffToPatched = useCallback((original: string, diffBody: string): string | null => {

    try {

      const lines = diffBody.replace(/```[a-z]*|```/gi, '').split(/\r?\n/);

      const contentLines = lines.filter(
        l =>
          !/^diff --git /.test(l) && !/^index /.test(l) && !/^--- /.test(l) && !/^\+\+\+ /.test(l)
      );

      if (!contentLines.some(l => /^[-+]/.test(l))) return null;
      const originalLines = original.split(/\r?\n/);
      const output: string[] = [];
      let origPtr = 0;
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (line.startsWith('@@')) {

          const m = /@@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? @@/.exec(line);
          if (m) {
            const targetStart = parseInt(m[1], 10) - 1;

            while (origPtr < targetStart) {
              output.push(originalLines[origPtr++] ?? '');
            }
          }
          continue;
        }
        if (line.startsWith('+')) {
          output.push(line.slice(1));
        } else if (line.startsWith('-')) {

          origPtr += 1;
        } else {

          output.push(originalLines[origPtr++] ?? '');
        }
      }

      while (origPtr < originalLines.length) {
        output.push(originalLines[origPtr++]);
      }
      return output.join('\n');
    } catch {
      return null;
    }
  }, []);

  const applyEdit = (newCode: string, selectionRange: any | null) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel?.();
    if (!model) return;
    editor.pushUndoStop();
    if (selectionRange) {
      editor.executeEdits('ai-edit', [
        { range: selectionRange, text: newCode, forceMoveMarkers: true },
      ]);
    } else {
      const fullRange = model.getFullModelRange();
      editor.executeEdits('ai-edit', [{ range: fullRange, text: newCode, forceMoveMarkers: true }]);
    }
    editor.pushUndoStop();
  };

  const pushToast = (msg: string, retry?: () => void) => {
    try {
      const action = retry ? ({ label: 'Retry', onClick: retry } as any) : undefined;
      showToast({ kind: 'info', message: msg, contextKey: `monaco:${msg}` , action });
    } catch {
      const id = Math.random().toString(36).slice(2);
      setLocalToasts(t => [...t, { id, msg, retry }]);
      setTimeout(() => setLocalToasts(t => t.filter(x => x.id !== id)), 4000);
    }
  };

  const requestImprove = useCallback(async () => {
    if (aiBusy) return;
    setAiBusy('improve');
    const { code, range } = getSelectionOrLine();
    improveOriginalRangeRef.current = range;
    lastEditedModelSnapshotRef.current = editorRef.current?.getModel?.().getValue?.() || null;
    try {
      const prompt = buildImprovePrompt(code, language);
      const tokensApprox = estimateTokens(`${prompt  }\n${  code}`);
      const resp: any = await timeAndLog({
        action: 'improve',
        tokensApprox,
        exec: async () => await projectApi.getAiCompletion(prompt, undefined),
      });
      const text = (resp && (resp.completion || resp.text || resp.output)) || String(resp || '');

      const patched = parseUnifiedDiffToPatched(code, text);
      if (patched) {
        setDiffText(text);
        setFullResult(patched);
      } else {

        setDiffText(`// No diff provided\n${  text}`);
        setFullResult(text);
      }
      setDiffModalOpen(true);
      setActiveDiffTab('diff');
    } catch (e: any) {
      console.error('Improve failed', e);
      pushToast('Improve failed – Retry?', () => requestImprove());
    } finally {
      setAiBusy(null);
    }
  }, [aiBusy, getSelectionOrLine, language, parseUnifiedDiffToPatched]);

  const requestExplain = useCallback(async () => {
    if (aiBusy) return;
    setAiBusy('explain');
    const { code } = getSelectionOrLine();
    try {
      const prompt = buildExplainPrompt(code, language);
      const tokensApprox = estimateTokens(`${prompt  }\n${  code}`);
      const resp: any = await timeAndLog({
        action: 'explain',
        tokensApprox,
        exec: async () => await projectApi.getAiCompletion(prompt, undefined),
      });
      const text = (resp && (resp.completion || resp.text || resp.output)) || String(resp || '');
      const cleaned = text.replace(/```[a-z]*|```/gi, '');
      setExplanationContent(cleaned);
      setExplanationHasContent(!!cleaned.trim());
      setExplainOpen(true);
    } catch (e: any) {
      console.error('Explain failed', e);
      pushToast('Explain failed – Retry?', () => requestExplain());
    } finally {
      setAiBusy(null);
    }
  }, [aiBusy, getSelectionOrLine, language]);

  const requestComments = useCallback(async () => {
    if (aiBusy) return;
    setAiBusy('comment');
    const { code, range } = getSelectionOrLine();
    lastEditedModelSnapshotRef.current = editorRef.current?.getModel?.().getValue?.() || null;
    try {
      const prompt = buildCommentPrompt(code, language);
      const tokensApprox = estimateTokens(`${prompt  }\n${  code}`);
      const resp: any = await timeAndLog({
        action: 'comment',
        tokensApprox,
        exec: async () => await projectApi.getAiCompletion(prompt, undefined),
      });
      const newCode = (resp && (resp.completion || resp.text || resp.output)) || String(resp || '');
      applyEdit(newCode, range);
    } catch (e: any) {
      console.error('Comment failed', e);
      pushToast('Add comments failed – Retry?', () => requestComments());
    } finally {
      setAiBusy(null);
    }
  }, [aiBusy, getSelectionOrLine, language]);

  const confirmApplyImprovement = () => {
    const originalRange = improveOriginalRangeRef.current;
    applyEdit(fullResult, originalRange || null);
    setDiffModalOpen(false);
  };


  const renderDiffHighlighted = (text: string) => {
    return text.split(/\r?\n/).map((line, i) => {
      let color = 'var(--syn-text-primary)';
      let bg: string | undefined;
      let borderLeft: string | undefined;
      if (
        line.startsWith('+++') ||
        line.startsWith('---') ||
        line.startsWith('diff ') ||
        line.startsWith('index ')
      ) {
        color = 'var(--syn-text-muted)';
        bg = 'var(--syn-overlay-whisper)';
      } else if (line.startsWith('@@')) {
  color = 'var(--syn-accent-primary)';
  bg = 'var(--syn-accent-bg)';
  borderLeft = '3px solid var(--syn-accent-primary)';
      } else if (line.startsWith('+')) {
        color = 'var(--syn-success)';
        bg = 'var(--syn-success-bg)';
        borderLeft = '3px solid var(--syn-success)';
      } else if (line.startsWith('-')) {
        color = 'var(--syn-danger)';
        bg = 'var(--syn-danger-bg)';
        borderLeft = '3px solid var(--syn-danger)';
      }
      return (
        <div
          key={i}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            lineHeight: 1.35,
            whiteSpace: 'pre-wrap',
            color,
            background: bg,
            borderLeft,
            paddingLeft: bg ? 6 : 0,
            borderRadius: 4,
          }}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  };


  const [latexPdfUrl, setLatexPdfUrl] = useState<string | null>(null);
  const [latexEmbedError, setLatexEmbedError] = useState(false);
  const [latexStatus, setLatexStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [latexMessage, setLatexMessage] = useState<string>('');

  const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

  const compileLatex = useCallback(async () => {
    const langLower = String(language).toLowerCase();
    if (langLower !== 'latex' && langLower !== 'tex') return;
    setLatexEmbedError(false);
    setLatexStatus('loading');
    setLatexMessage('Compiling PDF…');
    try {
      const { PDFDocument, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const { height } = page.getSize();
      const normalize = (s: string) =>
        s
          .replace(/ı/g, 'i')
          .replace(/İ/g, 'I')
          .replace(/ş/g, 's')
          .replace(/Ş/g, 'S')
          .replace(/ğ/g, 'g')
          .replace(/Ğ/g, 'G')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'C')
          .replace(/ö/g, 'o')
          .replace(/Ö/g, 'O')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'U');

      const src = content;
      const mTitle = /\\title\{([^}]*)\}/.exec(src)?.[1] || 'Untitled';
      const mAuthor = /\\author\{([^}]*)\}/.exec(src)?.[1] || 'Author';
      const mDate = /\\date\{([^}]*)\}/.exec(src)?.[1] || new Date().toLocaleDateString();
      const mAbstract =
        /\\begin{abstract}([\s\S]*?)\\end{abstract}/.exec(src)?.[1]?.trim() ||
        'No abstract provided.';
      const sectionRegex = /\\section\{([^}]*)\}/g;
      const sections: string[] = [];
      let sm: RegExpExecArray | null;
      while ((sm = sectionRegex.exec(src))) {
        sections.push(sm[1]);
        if (sections.length >= 18) break;
      }
      const wrap = (text: string, max = 100) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
          const test = (line ? `${line  } ` : '') + w;
          if (test.length > max) {
            if (line) lines.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        return lines;
      };
      let y = height - 70;
      page.drawText(normalize(mTitle), { x: 45, y, size: 22, font });
      y -= 34;
      page.drawText(`${normalize(mAuthor)  }  •  ${  normalize(mDate)}`, { x: 45, y, size: 11, font });
      y -= 26;
      page.drawText('Abstract', { x: 45, y, size: 13, font });
      y -= 18;
      for (const l of wrap(mAbstract, 105)) {
        if (y < 70) break;
        page.drawText(normalize(l), { x: 55, y, size: 10, font });
        y -= 14;
      }
      if (y > 100) {
        y -= 10;
        page.drawText('Sections', { x: 45, y, size: 13, font });
        y -= 20;
        for (const s of sections) {
          if (y < 70) break;
          page.drawText(`• ${  normalize(s)}`, { x: 55, y, size: 10, font });
          y -= 14;
        }
      }
      if (y > 60) {
        page.drawText(`Source length: ${  content.length  } chars`, {
          x: 45,
          y: 50,
          size: 8,
          font,
        });
      }
      const pdfBytes = await pdfDoc.save();

      const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes as any);
      const blob = new Blob([bytes], { type: 'application/pdf' });


      let url: string;
      if (isFirefox) {
        try {
          let binary = '';
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
          }
          const b64 = typeof btoa !== 'undefined' ? btoa(binary) : '';
          url = `data:application/pdf;base64,${  b64}`;
        } catch {
          url = URL.createObjectURL(blob);
        }
      } else {
        url = URL.createObjectURL(blob);
      }
      if (latexPdfUrl && latexPdfUrl.startsWith('blob:')) {

        try {
          URL.revokeObjectURL(latexPdfUrl);
        } catch {}
      }
      setLatexPdfUrl(url);
      setLatexStatus('ready');
      setLatexMessage('PDF ready (preview below)');
    } catch (e: any) {
      setLatexStatus('error');
      setLatexMessage(e?.message || 'Compile error');
    }
  }, [language, content, latexPdfUrl, isFirefox]);


  const handleLatexSave = useCallback(async () => {
    const langLower = String(language).toLowerCase();
    if (langLower !== 'latex' && langLower !== 'tex') {
      saveTab(tabId);
      return;
    }

    const saveBlob = async (blob: Blob, suggestedName: string) => {
      const anyWin: any = window as any;
      if (anyWin.showSaveFilePicker) {
        try {
          const handle = await anyWin.showSaveFilePicker({ suggestedName });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
  } catch {

        }
      }
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return false;
    };
    try {

      const saveSource = window.confirm('Save LaTeX source (.tex)?');
      if (saveSource) {
  const texBlob = new Blob([content], { type: 'application/x-tex' });
  await saveBlob(texBlob, `${tabId || 'document'}.tex`);
      }

      const wantPdf = window.confirm('Also save compiled PDF? (Will compile if not ready)');
      if (wantPdf) {
        if (!latexPdfUrl || latexStatus !== 'ready') {
          await compileLatex();
        }
        if (latexPdfUrl) {
          try {
            let pdfBlob: Blob | null = null;
            if (latexPdfUrl.startsWith('data:application/pdf')) {

              const base64 = latexPdfUrl.split(',')[1];
              if (base64) {
                const raw = atob(base64);
                const arr = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
                pdfBlob = new Blob([arr], { type: 'application/pdf' });
              }
            } else {
              const resp = await fetch(latexPdfUrl);
              pdfBlob = await resp.blob();
            }
            if (pdfBlob) {
              await saveBlob(pdfBlob, `${tabId || 'document'  }.pdf`);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('Save failed', e);
    }
  }, [language, tabId, content, latexPdfUrl, latexStatus, compileLatex, saveTab]);


  useEffect(() => {
    const langLower = String(language || '').toLowerCase();
    if (langLower === 'html' || langLower === 'css') {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = window.setTimeout(() => {
        runCode();
      }, 250);
    }
    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [content, language, runCode]);


  useEffect(() => {
    if (editorRef.current && !isResizing) {
      editorRef.current.layout();
    }

    if (isPreviewVisible && iframeRef.current && !isResizing) {
      runCode();
    }
    try {
      localStorage.setItem('synapse.editor.split', String(editorWidth));
    } catch {}
  }, [isPreviewVisible, editorWidth, runCode, isResizing]);


  useEffect(() => {
    try {
      const s = localStorage.getItem('synapse.preview.auto');
      if (s != null) setAutoRefresh(s === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('synapse.preview.auto', autoRefresh ? '1' : '0');
    } catch {}
  }, [autoRefresh]);

  const handleEditorDidMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      try {
        defineSynapseMonacoTheme(monaco);
        monaco.editor.setTheme('synapse-ide-pro');
      } catch {}

      try {
        const listener = (e: any) => {
          const detail = e?.detail || {};
          if (detail.tabId !== tabId) return;
          try {
            setIsPreviewVisible(true);
          } catch {}
          const langLower = String(language || '').toLowerCase();
          if (['html', 'css', 'javascript'].includes(langLower)) {
            runCode();
          }
        };
        window.addEventListener('synapse.preview.run', listener as any);
        (editor as any)._previewRunListener = listener;
      } catch {}


      try {
        const revealListener = (e: any) => {
          const detail = e?.detail || {};
          if (detail.tabId !== tabId) return;
          const line: number = Math.max(1, Number(detail.line || 1));
          const column: number = Math.max(1, Number(detail.column || 1));
          try {
            const ed = editorRef.current;
            if (!ed) return;
            ed.revealLineInCenter?.(line);
            ed.setPosition?.({ lineNumber: line, column });
            ed.focus?.();
          } catch {}
        };
        window.addEventListener('synapse.editor.reveal', revealListener as any);
        (editor as any)._revealListener = revealListener;
      } catch {}


      const model = editor.getModel();
      if (model) {
        const lang = String(language || '').toLowerCase();
        const map: Record<string, string> = {
          javascript: 'javascript',
          jsx: 'javascript',
          javascriptreact: 'javascript',
          typescript: 'typescript',
          ts: 'typescript',
          tsx: 'typescript',
          typescriptreact: 'typescript',
          html: 'html',
          htm: 'html',
          css: 'css',
          json: 'json',
          markdown: 'markdown',
          md: 'markdown',
          python: 'python',
          py: 'python',
        };
        const target = map[lang] || 'plaintext';
        monaco.editor.setModelLanguage(model, target);
        model.updateOptions({ tabSize: 2, insertSpaces: true, detectIndentation: true });
      }


      try {
        monaco.languages?.typescript?.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: false,
        });
        monaco.languages?.typescript?.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: false,
        });
      } catch {}


      if (model) {
        try {
          useProblemsStore
            .getState()
            .markProducerLoading(monacoDiagnosticsProducerId, `${activeTab?.name || pathForDisplay} Monaco markers`);
        } catch {}
        publishOutline(editor, monaco);
      }


  monaco.editor.defineTheme('synapse-pro', {
        base: 'vs-dark',
        inherit: false,
        rules: [
          { token: '', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },

          { token: 'type', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },
          { token: 'type.identifier', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },
          { token: 'interface', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },
          { token: 'class', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },
          { token: 'typeParameter', foreground: SYNAPSE_COLORS.textPrimary.replace('#', '') },

          { token: 'keyword', foreground: SYNAPSE_COLORS.textSecondary.replace('#', '') },
          { token: 'tag', foreground: SYNAPSE_COLORS.textSecondary.replace('#', '') },
          { token: 'metatag', foreground: SYNAPSE_COLORS.textSecondary.replace('#', '') },
          { token: 'tag.attribute', foreground: SYNAPSE_COLORS.textSecondary.replace('#', '') },

          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        ],
        colors: {

          'editor.background': SYNAPSE_COLORS.bgDark,
          'editor.foreground': SYNAPSE_COLORS.textPrimary,
          focusBorder: withAlpha(SYNAPSE_COLORS.goldPrimary, 0.6),

          'minimap.background': '#000000',

          'editorLineNumber.foreground': SYNAPSE_COLORS.textSecondary,
          'editorLineNumber.activeForeground': SYNAPSE_COLORS.goldPrimary,
          'editorIndentGuide.background': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.12),
          'editorIndentGuide.activeBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.22),

          'editorCursor.foreground': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.8),

          'editor.selectionBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.25),
          'editor.inactiveSelectionBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.15),
          'editor.selectionHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.12),
          'editor.lineHighlightBackground': '#050505',
          'editor.lineHighlightBorder': 'transparent',
          'editorBracketMatch.border': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.45),
          'editorBracketMatch.background': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.08),

          'editor.findMatchBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),
          'editor.findMatchBorder': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.6),
          'editor.findMatchHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.22),
          'editor.findMatchHighlightBorder': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.45),
          'editor.findRangeHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.14),
          'editor.wordHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.16),
          'editor.wordHighlightStrongBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.22),
          'editor.symbolHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.18),
          'editor.hoverHighlightBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.1),

          'editorOverviewRuler.findMatchForeground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.55),
          'editorOverviewRuler.wordHighlightForeground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),
          'editorOverviewRuler.wordHighlightStrongForeground': withAlpha(
            SYNAPSE_COLORS.accentNeutral,
            0.45
          ),
          'editorOverviewRuler.bracketMatchForeground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.45),
          'editorOverviewRuler.rangeHighlightForeground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.25),
          'editorOverviewRuler.border': '#0000',

          'editorWidget.background': '#000000',
          'editorWidget.border': SYNAPSE_COLORS.border,
          'editorSuggestWidget.background': '#000000',
          'editorSuggestWidget.border': SYNAPSE_COLORS.border,
          'editorHoverWidget.background': '#000000',
          'editorHoverWidget.border': SYNAPSE_COLORS.border,

          'scrollbarSlider.background': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.25),
          'scrollbarSlider.hoverBackground': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.4),
          'scrollbarSlider.activeBackground': withAlpha(SYNAPSE_COLORS.goldPrimary, 0.55),

          'editorError.background': '#0000',
          'editorError.foreground': SYNAPSE_COLORS.accentNeutral,
          'editorWarning.background': '#0000',
          'editorWarning.foreground': SYNAPSE_COLORS.accentNeutral,
          'editorInfo.background': '#0000',
          'editorInfo.foreground': SYNAPSE_COLORS.accentNeutral,
          'editorHint.background': '#0000',
          'editorHint.foreground': SYNAPSE_COLORS.accentNeutral,
          'editorUnnecessaryCode.opacity': '#00000000',

          'editorGutter.background': SYNAPSE_COLORS.bgDark,
          'editorGutter.addedBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.18),
          'editorGutter.modifiedBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.18),
          'editorGutter.deletedBackground': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.18),

          'editorOverviewRuler.errorForeground': '#0000',
          'editorOverviewRuler.warningForeground': '#0000',
          'editorOverviewRuler.infoForeground': '#0000',
          'editorMarkerNavigation.background': 'transparent',
          'editorMarkerNavigationError.background': '#0000',
          'editorMarkerNavigationWarning.background': '#0000',
          'editorMarkerNavigationInfo.background': '#0000',

          'diffEditor.insertedTextBackground': 'transparent',
          'diffEditor.removedTextBackground': 'transparent',
          'diffEditor.insertedTextBorder': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),
          'diffEditor.removedTextBorder': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),

          'minimap.findMatchHighlight': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.6),
          'minimap.selectionHighlight': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),
          'minimap.errorHighlight': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.45),
          'minimap.warningHighlight': withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35),
        },
      });


      try {

        monaco.editor.defineTheme('synapse-pro-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: '', foreground: '1f2937' },
            { token: 'type', foreground: '1f2937' },
            { token: 'type.identifier', foreground: '1f2937' },
            { token: 'interface', foreground: '1f2937' },
            { token: 'class', foreground: '1f2937' },
            { token: 'typeParameter', foreground: '1f2937' },
            { token: 'comment', foreground: '6b7280' },
          ],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#1A1A1A',
            'editorLineNumber.foreground': '#9ca3af',
            'editorLineNumber.activeForeground': '#B45309',
            'editor.selectionBackground': '#B4530922',
            'editor.inactiveSelectionBackground': '#B4530915',
            'editor.lineHighlightBackground': '#00000008',
            'editorWidget.background': '#f8f9fa',
            'editorWidget.border': '#e5e7eb',
          },
        });
        monaco.editor.defineTheme('synapse-pro-neutral', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'e5e7eb' },
            { token: 'type', foreground: 'e5e7eb' },
            { token: 'type.identifier', foreground: 'e5e7eb' },
            { token: 'interface', foreground: 'e5e7eb' },
            { token: 'class', foreground: 'e5e7eb' },
            { token: 'typeParameter', foreground: 'e5e7eb' },
            { token: 'comment', foreground: '9ca3af' },
          ],
          colors: {
            'editor.background': '#000000',
            'editor.foreground': '#e5e7eb',
            'editorLineNumber.foreground': '#9ca3af',
            'editorLineNumber.activeForeground': '#FBBF24',
            'editor.selectionBackground': '#FBBF2422',
            'editor.inactiveSelectionBackground': '#FBBF2415',
            'editor.lineHighlightBackground': '#050505',
            'editorWidget.background': '#000000',
            'editorWidget.border': '#374151',
          },
        });
      } catch {}

      try {
        monaco.editor.setTheme(activeThemeId);
      } catch {}


      try {
        editor.addAction({
          id: 'ai-improve-selection',
          label: 'AI: Improve Selection',
          contextMenuGroupId: 'navigation',
          contextMenuOrder: 1.01,
          run: requestImprove,
        });
        editor.addAction({
          id: 'ai-explain-selection',
          label: 'AI: Explain Selection',
          contextMenuGroupId: 'navigation',
          contextMenuOrder: 1.02,
          run: requestExplain,
        });
        editor.addAction({
          id: 'ai-add-beginner-comments',
          label: 'AI: Add Beginner Comments',
          contextMenuGroupId: 'navigation',
          contextMenuOrder: 1.03,
          run: requestComments,
        });
      } catch (e) {
        console.warn('AI context actions registration failed', e);
      }


      try {
        const m = editor.getModel();
        if (m) {
          const initialMarkers = monaco.editor.getModelMarkers?.({ resource: m.uri }) || [];
          syncMonacoMarkersToProblems(initialMarkers);
        }
        let throttle: any;
        const markerListener = monaco.editor.onDidChangeMarkers((uris: any[]) => {
          const current = editor.getModel();
          if (!current) return;
          const currentUri = String(current.uri.toString());
          const touched =
            Array.isArray(uris) &&
            uris.some(u => String((u && u.toString && u.toString()) || u) === currentUri);
          if (!touched) return;
          clearTimeout(throttle);
          throttle = setTimeout(() => {
            try {
              const markers = monaco.editor.getModelMarkers?.({ resource: current.uri }) || [];
              syncMonacoMarkersToProblems(markers);
            } catch {}
          }, 200);
        });
        (editor as any)._markerListener = markerListener;
      } catch {}


      try {
        publishEditorMetadata(editor);

        const cursorStatusDisposable = editor.onDidChangeCursorPosition?.(() => {
          publishEditorMetadata(editor);
        });
        const selectionStatusDisposable = editor.onDidChangeCursorSelection?.(() => {
          publishEditorMetadata(editor);
        });
        const contentStatusDisposable = editor.onDidChangeModelContent?.(() => {
          publishEditorMetadata(editor);
          publishOutline(editor, monaco);
        });
        const optionsStatusDisposable = editor.onDidChangeModelOptions?.(() => {
          publishEditorMetadata(editor);
        });
        const modelStatusDisposable = monaco?.editor?.onDidCreateModel?.((m: any) => {
          try {
            sbOptions(m?.getLanguageId?.());
          } catch {}
        });

        (editor as any)._surfaceStatusDisposables = [
          cursorStatusDisposable,
          selectionStatusDisposable,
          contentStatusDisposable,
          optionsStatusDisposable,
          modelStatusDisposable,
        ].filter(Boolean);
      } catch {}


      const applyVSCodeColors = () => {

        try {
          const m = editor.getModel?.();
          if (m && (m.getValueLength?.() || m.getValue?.().length || 0) > 750000) {
            return;
          }
        } catch {}
        const editorElement = editor.getDomNode();
        if (!editorElement) return;

        const allSpans = editorElement.querySelectorAll('span');
        let coloredCount = 0;

        allSpans.forEach((span: Element) => {
          const element = span as HTMLElement;
          const text = element.textContent?.trim() || '';

          if (!text) return;


          element.style.removeProperty('background-color');


          let isInImport = false;
          let isJsxTagName = false;

          let prevEl: Element | null = span.previousElementSibling;
          for (let i = 0; i < 8 && prevEl; i++) {
            const prevText = (prevEl.textContent || '').trim();
            if (prevText === 'import' || prevText === 'from' || prevText === 'require') {
              isInImport = true;
              break;
            }
            if (prevText === '<' || prevText === '</') {
              isJsxTagName = true;
              break;
            }
            prevEl = prevEl.previousElementSibling;
          }


          if (
            /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|as|interface|type|enum|public|private|static|async|await|try|catch|finally|throw|new|typeof|instanceof|extends|implements|abstract|namespace|module|declare|default|break|continue|switch|case|do|with)\b/.test(
              text
            )
          ) {

            element.style.setProperty('color', SYNAPSE_COLORS.textSecondary, 'important');
            element.style.removeProperty('font-weight');
            coloredCount++;
          } else if (
            /^(['"`]).*\1$/.test(text) ||
            text.startsWith('"') ||
            text.startsWith("'") ||
            text.startsWith('`') ||
            text.endsWith('"') ||
            text.endsWith("'") ||
            text.endsWith('`') ||
            text.includes('"') ||
            text.includes("'") ||
            text.includes('`')
          ) {

            if (isInImport) {
              element.style.setProperty('color', SYNAPSE_COLORS.textSecondary, 'important');
            } else {
              element.style.setProperty('color', '#CE9178', 'important');
            }
            coloredCount++;
          } else if (
            /^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text) ||
            /^0[xX][0-9a-fA-F]+$/.test(text) ||
            /^\d/.test(text)
          ) {

            element.style.setProperty('color', '#B5CEA8', 'important');
            coloredCount++;
          } else if (
            text.startsWith('//') ||
            text.startsWith('/*') ||
            text.includes('//') ||
            text.includes('/*') ||
            /[%=<>!&|^~?:;,.]/.test(text) ||
            text === '=' ||
            text === '+' ||
            text === '-' ||
            text === '*' ||
            text === '/' ||
            text === '%' ||
            text === '<' ||
            text === '>' ||
            text === '!'
          ) {

            element.style.setProperty('color', '#D4D4D4', 'important');
            coloredCount++;
          } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(text)) {

            let nextEl = span.nextElementSibling;
            let isFunc = false;
            for (let i = 0; i < 5 && nextEl; i++) {
              const nextText = nextEl.textContent || '';
              if (nextText.includes('(') || nextText === '(') {
                isFunc = true;
                break;
              }
              nextEl = nextEl.nextElementSibling;
            }

            if (isJsxTagName) {

              element.style.setProperty('color', SYNAPSE_COLORS.textSecondary, 'important');
              coloredCount++;
            } else if (isFunc) {

              element.style.setProperty('color', '#DCDCAA', 'important');
              element.style.setProperty('font-weight', 'bold', 'important');
              coloredCount++;
            } else {

              element.style.setProperty('color', '#9CDCFE', 'important');
              coloredCount++;
            }
          } else {

            element.style.setProperty('color', '#D4D4D4', 'important');
          }
        });

 console.warn(` VS CODE COLORS APPLIED - ${coloredCount} tokens colored`);
      };


      const startHighlighting = () => {

        setTimeout(applyVSCodeColors, 120);


        let contentChangeTimeout: any;
        const model = editor.getModel();
        if (model) {
          const disposable = model.onDidChangeContent(() => {
            clearTimeout(contentChangeTimeout);
            contentChangeTimeout = setTimeout(() => {
              applyVSCodeColors();
            }, 400);
          });
          (editor as any)._contentChangeDisposable = disposable;
        }


        let cursorTimeout: any;
        const cursorDisposable = editor.onDidChangeCursorPosition(() => {
          clearTimeout(cursorTimeout);
          cursorTimeout = setTimeout(() => {
            applyVSCodeColors();
          }, 300);
        });
        (editor as any)._cursorDisposable = cursorDisposable;

 console.warn(' Syntax post-pass armed (debounced).');
      };


      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const mountedMetadata = publishEditorMetadata(editor);
      const largeFileMode = mountedMetadata?.largeFile === true;
      editor.updateOptions({
        fontSize: 14,
        fontFamily: SYNAPSE_TYPO.fontFamily,
        fontLigatures: true,
        lineHeight: 22,
        letterSpacing: 0,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        automaticLayout: true,
        smoothScrolling: !prefersReduced && !largeFileMode,
        mouseWheelZoom: true,
        roundedSelection: true,
        cursorBlinking: 'phase',
        renderWhitespace: largeFileMode ? 'none' : 'selection',
        padding: { top: 8, bottom: 8 },
        rulers: [80, 120],


        renderValidationDecorations: 'editable',
        guides: { indentation: true, bracketPairs: !largeFileMode, bracketPairsHorizontal: false },
        showUnused: !largeFileMode,
        showDeprecated: !largeFileMode,

        minimap: {
          enabled: !largeFileMode,
          side: 'right',
          scale: 1,
          showSlider: 'always',
          renderCharacters: !largeFileMode,
          maxColumn: 120,
          autohide: false,
        },
        scrollbar: {
          verticalScrollbarSize: 3,
          horizontalScrollbarSize: 3,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          useShadows: false,
        },

        wordWrap: largeFileMode ? 'off' : 'on',
        formatOnPaste: false,
        formatOnType: false,
        autoIndent: 'full',


        cursorStyle: 'line',
        cursorWidth: 1,

        selectionHighlight: !largeFileMode,
        occurrencesHighlight: largeFileMode ? 'off' : 'multiFile',

        bracketPairColorization: {
          enabled: !largeFileMode,
        },
        matchBrackets: 'always',
        semanticHighlighting: {
          enabled: !largeFileMode,
        },
        autoClosingBrackets: 'languageDefined',
        autoClosingQuotes: 'languageDefined',

        folding: !largeFileMode,
        showFoldingControls: largeFileMode ? 'mouseover' : 'always',

        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          showMethods: true,
          showVariables: true,
          showClasses: true,
          filterGraceful: true,
          localityBonus: true,
        },

        quickSuggestions: {
          other: 'on',
          comments: 'off',
          strings: 'on',
        },

        parameterHints: {
          enabled: true,
          cycle: true,
        },

        hover: {
          enabled: true,
          delay: 300,
          sticky: true,
        },
      });


      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        runCode();
      });


      startHighlighting();


      const globalStyle = document.createElement('style');
      globalStyle.id = 'synapse-syntax-global';
      globalStyle.innerHTML = `

      .monaco-editor .view-line span[style*="color"] {
        transition: none !important;
      }

      .monaco-editor,
      .monaco-editor .monaco-editor-background,
      .monaco-editor .margin,
      .monaco-editor .lines-content,
      .monaco-editor .view-lines,
      .monaco-editor .monaco-scrollable-element,
      .monaco-editor-background,
      .monaco-diff-editor,
      .monaco-diff-editor .monaco-editor,
      .monaco-diff-editor .monaco-editor .monaco-editor-background,
      .monaco-diff-editor .monaco-editor .margin {
        background: #000000 !important;
      }

  .monaco-editor .view-line span { background: transparent !important; }

  .monaco-editor .view-line span[style*="background"],
  .monaco-editor .view-line span[style*="background-color"],
  .monaco-editor .view-line span[style*="backgroundColor"] {
    background: transparent !important;
  }

      .monaco-editor .findMatch,
      .monaco-editor .currentFindMatch {
        background: ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.28)} !important;
        outline: 1px solid ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.6)} !important;
      }

      .monaco-editor .wordHighlight,
      .monaco-editor .wordHighlightStrong,
      .monaco-editor .selectionHighlight {
        background: ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.18)} !important;
      }

      .monaco-editor .bracket-match {
        background: ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.12)} !important;
        border: 1px solid ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.35)} !important;
      }

      .monaco-editor .rangeHighlight {
        background: ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.12)} !important;
      }


      .monaco-editor .minimap .minimap-slider {
    background: ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.2)} !important;
        transition: none !important;
      }

      .monaco-editor .minimap-decorations-layer {
        opacity: 1 !important;
      }


      .monaco-editor .redsquiggly,
      .monaco-editor .greensquiggly,
      .monaco-editor .yellowsquiggly,
      .monaco-editor .squiggly-error,
      .monaco-editor .squiggly-warning {
        background: transparent !important;
        background-image: none !important;
      }


      .monaco-editor .inline-decorator,
      .monaco-editor .inline-decoration,
      .monaco-editor .line-decoration,
      .monaco-editor .squiggly-inline-text,
      .monaco-editor .mtkError,
      .monaco-editor .mtkWarning {
        background: transparent !important;
        text-decoration: none !important;
        box-shadow: none !important;
      }


      .monaco-editor .decorationsOverviewRuler {
        display: none !important;
      }


      .monaco-editor .view-overlays > .current-line,
      .monaco-editor .view-overlays [class*="decoration"],
      .monaco-editor .view-overlays [class*="Decoration"],
      .monaco-editor .view-overlays [class*="error"],
      .monaco-editor .view-overlays [class*="warning"],
      .monaco-editor .view-overlays [class*="hint"],
      .monaco-editor .view-overlays [class*="squiggly"],
      .monaco-editor .view-overlays div[style*="background"],
      .monaco-editor .view-overlays div[style*="background-color"],
      .monaco-editor .view-overlays div[style*="backgroundColor"] {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }


  .monaco-editor .margin .codicon-error,
  .monaco-editor .margin .codicon-warning,
  .monaco-editor .margin .codicon-info { display:none !important; }
  .monaco-editor .view-overlays [class*="error"],
  .monaco-editor .view-overlays [class*="warning"] { background: transparent !important; }


      .monaco-editor .mtk1,
      .monaco-editor .mtk2,
      .monaco-editor .mtk3,
      .monaco-editor .mtk4,
      .monaco-editor .mtk5,
      .monaco-editor .mtk6,
      .monaco-editor .mtk7,
      .monaco-editor .mtk8,
      .monaco-editor .mtk9,
      .monaco-editor .mtk10,
      .monaco-editor .mtk11,
      .monaco-editor .mtk12,
      .monaco-editor .mtk13,
      .monaco-editor .mtk14,
      .monaco-editor .mtk15,
      .monaco-editor .mtk16,
      .monaco-editor .mtk17,
      .monaco-editor .mtk18,
      .monaco-editor .mtk19,
      .monaco-editor .mtk20 {
        color: inherit !important;
        font-weight: inherit !important;
        font-style: inherit !important;
      }


      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.8;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }


    @keyframes borderGlow {
        0%, 100% {
      filter: brightness(1) drop-shadow(0 0 8px ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.3)});
        }
        50% {
      filter: brightness(1.2) drop-shadow(0 0 16px ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.5)});
        }
      }


  .monaco-editor .monaco-scrollable-element > .scrollbar { background: transparent !important; width: 3px !important; }
  .monaco-editor .monaco-scrollable-element > .scrollbar.vertical { width: 3px !important; }
  .monaco-editor .monaco-scrollable-element > .scrollbar.horizontal { height: 3px !important; }
  .monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
        background: linear-gradient(180deg, ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.6)}, ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.4)}) !important;
        border-radius: 2px !important;
        transition: background 150ms cubic-bezier(0.4,0,0.2,1) !important;
      }
  .monaco-editor .monaco-scrollable-element > .scrollbar > .slider:hover {
        background: linear-gradient(180deg, ${withAlpha(SYNAPSE_COLORS.goldPrimary, 0.8)}, ${withAlpha(SYNAPSE_COLORS.accentNeutral, 0.6)}) !important;
      }


      .synapse-focus-visible:focus-visible { outline: ${focusOutline()}; outline-offset: 2px; }


      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition-duration: 50ms !important; }
      }
    `;


      const existingGlobalStyle = document.getElementById('synapse-syntax-global');
      if (existingGlobalStyle) {
        existingGlobalStyle.remove();
      }
      document.head.appendChild(globalStyle);

 console.warn(' VS CODE SYNTAX HIGHLIGHTER WITH ERROR DETECTION READY!');
    },
    [
      activeTab?.name,
      activeThemeId,
      language,
      monacoDiagnosticsProducerId,
      pathForDisplay,
      publishEditorMetadata,
      publishOutline,
      runCode,
      syncMonacoMarkersToProblems,
    ]
  );


  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const model = ed.getModel?.();
    if (!model) return;
    try {
      const currentValue = model.getValue?.() ?? '';
      if (currentValue !== content) {

        model.setValue?.(content || '');
      }
      publishOutline(ed, monacoRef.current);
    } catch {}
  }, [tabId, content, publishOutline]);


  useEffect(() => {
    return () => {
      outlineRequestSeqRef.current += 1;

      try {
        (editorRef.current as any)?._contentChangeDisposable?.dispose?.();
      } catch {}
      try {
        (editorRef.current as any)?._cursorDisposable?.dispose?.();
      } catch {}

      try {
        const l = (editorRef.current as any)?._markerListener;
        if (l && l.dispose) {
          l.dispose();
        }
      } catch {}
      try {
        (editorRef.current as any)?._markerSub?.dispose?.();
      } catch {}
      try {
        const disposables = (editorRef.current as any)?._surfaceStatusDisposables || [];
        disposables.forEach((disposable: any) => disposable?.dispose?.());
      } catch {}
      try {
        const outlineTimer = (editorRef.current as any)?._outlineTimer;
        if (outlineTimer) window.clearTimeout(outlineTimer);
      } catch {}

      try {
        const pr = (editorRef.current as any)?._previewRunListener;
        if (pr) window.removeEventListener('synapse.preview.run', pr as any);
      } catch {}
      try {
        const rv = (editorRef.current as any)?._revealListener;
        if (rv) window.removeEventListener('synapse.editor.reveal', rv as any);
      } catch {}

      try {
        const existingGlobalStyle = document.getElementById('synapse-syntax-global');
        if (existingGlobalStyle) existingGlobalStyle.remove();
      } catch {}
    };
  }, []);


  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const model = ed.getModel?.();
    if (!model) return;
    const currentId = model.getLanguageId?.();
    const lang = String(language || '').toLowerCase();
    const map: Record<string, string> = {
      javascript: 'javascript',
      jsx: 'javascript',
      javascriptreact: 'javascript',
      typescript: 'typescript',
      ts: 'typescript',
      tsx: 'typescript',
      typescriptreact: 'typescript',
      html: 'html',
      htm: 'html',
      css: 'css',
      json: 'json',
      markdown: 'markdown',
      md: 'markdown',
      python: 'python',
      py: 'python',
    };
    const target = map[lang] || 'plaintext';
    if (currentId !== target) {
      try {
        monaco.editor.setModelLanguage(model, target);
        publishEditorMetadata(ed);
        publishOutline(ed, monaco);
      } catch {}
    } else {
      publishOutline(ed, monaco);
    }
  }, [language, publishEditorMetadata, publishOutline]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newValue = value || '';
      try {
        useProblemsStore
          .getState()
          .markProducerLoading(monacoDiagnosticsProducerId, `${activeTab?.name || pathForDisplay} Monaco markers`);
      } catch {}
      updateTabContent(tabId, newValue);
      onChange?.(newValue);
    },
    [activeTab?.name, monacoDiagnosticsProducerId, onChange, pathForDisplay, tabId, updateTabContent]
  );

  const handleEditorValidate = useCallback(
    (markers: any[]) => {
      syncMonacoMarkersToProblems(markers);
    },
    [syncMonacoMarkersToProblems]
  );

  return (
    <div
      className="synapse-monaco-surface"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: SYNAPSE_COLORS.bgDark,
        fontFamily: SYNAPSE_TYPO.fontFamily,
        position: 'relative',
      }}
    >
      {}
      <div
        className="synapse-monaco-surface__editor-pane"
        style={{
          width: isPreviewVisible ? `${editorWidth}%` : '100%',
          display: 'flex',
          flexDirection: 'column',
          background: SYNAPSE_COLORS.bgDark,
          borderRight: 'none',
          borderImage: 'none',
          position: 'relative',
          minWidth: '150px',
          boxShadow: 'none',
        }}
      >
        {}
        <div className="synapse-monaco-surface__context-bar" data-large-file={editorMetadata.largeFile ? 'true' : 'false'}>
          <div className="synapse-monaco-surface__context-left">
            <span className="synapse-monaco-surface__file-icon" aria-hidden="true">
              <FileCode2 size={14} strokeWidth={1.9} />
            </span>
            <nav
              className="synapse-monaco-surface__breadcrumbs"
              aria-label="Editor file path"
              title={pathForDisplay}
            >
              {breadcrumbParts.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                  <span className="synapse-monaco-surface__crumb">{part}</span>
                  {index < breadcrumbParts.length - 1 ? (
                    <ChevronRight className="synapse-monaco-surface__crumb-separator" size={12} aria-hidden="true" />
                  ) : null}
                </React.Fragment>
              ))}
            </nav>
            <span
              className="synapse-monaco-surface__chip"
              data-state={activeTab?.isDirty ? 'dirty' : 'clean'}
              title={activeTab?.isDirty ? 'Buffer has unsaved editor changes' : 'Buffer has no unsaved editor changes'}
            >
              {tabStateLabel}
            </span>
            {activeTab?.previewMode ? (
              <span className="synapse-monaco-surface__chip" data-priority="low" title="Preview tab">
                Preview
              </span>
            ) : null}
            {activeTab?.isPinned ? (
              <span className="synapse-monaco-surface__chip" data-priority="low" title="Pinned tab">
                Pinned
              </span>
            ) : null}
            <span
              className="synapse-monaco-surface__chip"
              data-priority="low"
              title={activeTab?.sourcePlanRunId ? `Source plan: ${activeTab.sourcePlanRunId}` : `Source: ${sourceLabel}`}
            >
              {sourceLabel}
            </span>
          </div>

          <div className="synapse-monaco-surface__context-right" aria-live="polite">
            <span className="synapse-monaco-surface__meta" title={`Language mode: ${languageLabel}`}>
              {languageLabel}
            </span>
            <span className="synapse-monaco-surface__meta" title="Cursor position">
              Ln {editorMetadata.line}, Col {editorMetadata.column}
            </span>
            {editorMetadata.selectionChars > 0 ? (
              <span className="synapse-monaco-surface__meta" title="Selection size">
                Sel {editorMetadata.selectionChars} chars
              </span>
            ) : null}
            <span className="synapse-monaco-surface__meta" data-priority="low" title="Line ending">
              {editorMetadata.eol}
            </span>
            <span
              className="synapse-monaco-surface__meta"
              data-priority="low"
              title="Browser buffer encoding; filesystem adapter has not provided a separate encoding"
            >
              {editorMetadata.encoding}
            </span>
            <span className="synapse-monaco-surface__meta" data-priority="medium" title={`${editorMetadata.lines} lines, ${editorMetadata.words} words, ${editorMetadata.chars} characters`}>
              {formatBytes(editorMetadata.bytes)}
            </span>
            {editorMetadata.largeFile ? (
              <span className="synapse-monaco-surface__chip" data-state="large" title="Large-file mode reduces expensive editor decorations">
                Large
              </span>
            ) : null}
            {previewCapable ? (
              <button
                type="button"
                className="synapse-monaco-surface__action"
                data-primary="true"
                onClick={() => runCode(true)}
                title="Run or refresh preview"
                aria-label="Run or refresh preview"
              >
                <Play size={13} fill="currentColor" aria-hidden="true" />
                <span>Run</span>
              </button>
            ) : null}
            <button
              type="button"
              className="synapse-monaco-surface__action"
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
              title={isPreviewVisible ? 'Hide preview pane' : 'Show preview pane'}
              aria-label={isPreviewVisible ? 'Hide preview pane' : 'Show preview pane'}
            >
              {isPreviewVisible ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
              <span>{isPreviewVisible ? 'Hide' : 'Show'}</span>
            </button>
          </div>
          <span className="synapse-monaco-surface__sr-status" aria-live="polite">
            {pathForDisplay}, {languageLabel}, line {editorMetadata.line}, column {editorMetadata.column}
          </span>
        </div>

        {}
        <div className="synapse-monaco-surface__editor-host">
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            onValidate={handleEditorValidate}
            theme={activeThemeId}
            loading={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  background: SYNAPSE_COLORS.bgDark,
                  color: SYNAPSE_COLORS.goldPrimary,
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid transparent',
                    borderImage: `linear-gradient(45deg, ${SYNAPSE_COLORS.goldPrimary}, ${SYNAPSE_COLORS.goldSecondary}, ${SYNAPSE_COLORS.goldPrimary}) 1`,
                    borderRadius: '50%',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: `linear-gradient(45deg, ${SYNAPSE_COLORS.goldPrimary}, ${SYNAPSE_COLORS.goldSecondary})`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    fontFamily: SYNAPSE_TYPO.fontFamily,
                    letterSpacing: '1px',
                    textShadow: '0 0 6px var(--syn-accent-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: `linear-gradient(45deg, ${SYNAPSE_COLORS.goldPrimary}, ${SYNAPSE_COLORS.goldSecondary})`,
                      boxShadow: 'var(--syn-glow-subtle)',
                    }}
                  />
                  Loading Synapse Editor...
                </div>
              </div>
            }
            options={{
              selectOnLineNumbers: true,
              automaticLayout: true,
              fontSize: 14,
              fontFamily: SYNAPSE_TYPO.fontFamily,
              lineHeight: 22,
              letterSpacing: 0,
              minimap: {
                enabled: !editorMetadata.largeFile,
                renderCharacters: !editorMetadata.largeFile,
                maxColumn: 120,
                showSlider: 'always',
              },
              bracketPairColorization: {
                enabled: !editorMetadata.largeFile,
              },
              guides: {
                indentation: true,
                bracketPairs: !editorMetadata.largeFile,
                bracketPairsHorizontal: false,
              },
              wordWrap: editorMetadata.largeFile ? 'off' : 'on',
              renderWhitespace: editorMetadata.largeFile ? 'none' : 'selection',
              folding: !editorMetadata.largeFile,
            }}
          />
        </div>
      </div>

      {}

      {}
      {isPreviewVisible ? <div
          className="split-resizer"
          tabIndex={0}
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={15}
          aria-valuemax={85}
          aria-valuenow={editorWidth}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setEditorWidth(w => Math.max(15, w - 5));
            }
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              setEditorWidth(w => Math.min(85, w + 5));
            }
          }}
          onMouseDown={e => {
            e.preventDefault();
            setIsResizing(true);

            const startX = e.clientX;
            const startWidth = editorWidth;
            const container = e.currentTarget.parentElement;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              if (!container) return;

              const containerWidth = container.offsetWidth;
              const deltaX = moveEvent.clientX - startX;
              const deltaPercent = (deltaX / containerWidth) * 100;
              const newWidth = Math.min(85, Math.max(15, startWidth + deltaPercent));

              setEditorWidth(Math.round(newWidth));
            };

            const handleMouseUp = () => {
              setIsResizing(false);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);

              if (editorRef.current) {
                editorRef.current.layout();
              }
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        /> : null}

      {}
      {isPreviewVisible ? <div
          className="preview-surface"
          style={{
            width: `${100 - editorWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: '150px',
            position: 'relative',
          }}
        >
          {}
          <div
            style={{
              display: 'none',
              height: '40px',
              background: `linear-gradient(135deg, ${SYNAPSE_COLORS.bgSecondary}, ${SYNAPSE_COLORS.bgDark})`,
              borderBottom: `1px solid ${  SYNAPSE_COLORS.border}`,
              alignItems: 'center',
              padding: '0 12px',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                color: SYNAPSE_COLORS.goldPrimary,
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: `linear-gradient(45deg, ${SYNAPSE_COLORS.accentNeutral}, ${SYNAPSE_COLORS.accentNeutralHover})`,
                  boxShadow: 'var(--syn-glow-subtle)',
                }}
              />
              <span
                style={{
                  letterSpacing: '1px',
                  textShadow: '0 0 6px var(--syn-accent-glow)',
                }}
              >
                LIVE PREVIEW
              </span>
            </div>

            <button
              onClick={() => runCode()}
              style={{
                background: 'transparent',
                border: '2px solid var(--syn-accent-border)',
                color: SYNAPSE_COLORS.goldPrimary,
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: SYNAPSE_TYPO.fontFamily,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--syn-accent-bg)';
                e.currentTarget.style.borderColor = 'var(--syn-accent-primary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--syn-accent-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onFocus={e => {
                e.currentTarget.style.outline = focusOutline();
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={e => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.outlineOffset = '0';
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `conic-gradient(from 0deg, ${SYNAPSE_COLORS.goldPrimary}, ${SYNAPSE_COLORS.goldSecondary}, ${SYNAPSE_COLORS.goldPrimary})`,
                  animation: 'rotate 2s linear infinite',
                }}
              />
              REFRESH
            </button>
          </div>


          {}
          <div
            style={{
              flex: 1,
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {(() => {
              const l = String(language).toLowerCase();
              return l === 'latex' || l === 'tex';
            })() ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  color: SYNAPSE_COLORS.textPrimary,
                  fontFamily: SYNAPSE_TYPO.fontFamily,
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: `1px solid ${SYNAPSE_COLORS.border}`,
                  }}
                >
                  <button
                    onClick={handleLatexSave}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${  SYNAPSE_COLORS.goldPrimary}`,
                      color: SYNAPSE_COLORS.goldPrimary,
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '.5px',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={compileLatex}
                    style={{
                      background:
                        `linear-gradient(135deg, ${
                        SYNAPSE_COLORS.goldPrimary
                        },${
                        SYNAPSE_COLORS.goldSecondary
                        })`,
                      border: 'none',
                      color: 'var(--syn-text-on-accent)',
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '.5px',
                    }}
                  >
                    Compile PDF
                  </button>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {latexStatus === 'loading' ? 'Compiling…' : latexMessage || 'Idle'}
                  </span>
                </div>
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      overflow: 'auto',
                      background: 'var(--syn-bg-surface-1)',
                    }}
                  >
                    {latexStatus === 'ready' && latexPdfUrl ? <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {!latexEmbedError &&
                          (isFirefox ? (
                            <embed
                              title="LaTeX PDF"
                              src={latexPdfUrl}
                              type="application/pdf"
                              style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                          ) : (
                            <iframe
                              title="LaTeX PDF"
                              src={latexPdfUrl}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              onError={() => setLatexEmbedError(true)}
                            />
                          ))}
                        {latexEmbedError ? <div style={{ padding: 16, fontSize: 12, lineHeight: 1.6 }}>
                            PDF iframe embed blocked.{' '}
                            <a
                              href={latexPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: SYNAPSE_COLORS.goldPrimary }}
                            >
                              Open PDF in new tab
                            </a>
                          </div> : null}
                        {}
                        {!latexEmbedError && (
                          <object
                            data={latexPdfUrl}
                            type="application/pdf"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              pointerEvents: 'none',
                            }}
                            aria-label="PDF preview fallback"
                          />
                        )}
                      </div> : null}
                    {latexStatus !== 'ready' && (
                      <div
                        style={{
                          padding: 16,
                          fontSize: 12,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {latexStatus === 'error'
                          ? latexMessage
                          : 'Click Compile PDF to generate a placeholder output.'}
                        {'\n'}This is a temporary preview. Real LaTeX engine integration pending.
                        {'\n'}Check Terminal for compile logs.
                      </div>
                    )}
                  </div>
                  {}
                </div>
              </div>
            ) : (
              <section className="preview-pane" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                <EditorPreviewToolbar
                  ratio={previewRatio}
                  onChangeRatio={(r) => {
                    setPreviewRatio(r);
                    try { localStorage.setItem('synapse.preview.aspect', r); } catch {}

                    if (r === 'auto') { setEditorWidth(70); try { localStorage.setItem('synapse.preview.ratio', '70/30'); } catch {} }
                    else if (r === 'fit') { setEditorWidth(50); try { localStorage.setItem('synapse.preview.ratio', '50/50'); } catch {} }
                  }}
                  autoClear={autoRefresh}
                  onToggleAutoClear={() => setAutoRefresh(a => !a)}
                  onRefresh={() => runCode(true)}
                  widthPercent={editorWidth}
                  onChangeWidthPercent={(v) => {
                    const clamped = Math.max(15, Math.min(85, Math.round(v)));
                    setEditorWidth(clamped);
                    try { localStorage.setItem('synapse.preview.ratio', `${clamped}/$${100 - clamped}`); } catch {}
                  }}
                />
        <div className="preview-viewport" style={{ position: 'relative', width: '100%', flex: 1, display: 'flex' }}>
                  <div
                    className="ratio-box"
                    style={{
                      width: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? 'min(100%, 1280px)' : '100%',
                      margin: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? '0 auto' : '0',
                      height: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? 'auto' : '100%',
                      aspectRatio:
                        previewRatio === '1:1' ? '1 / 1' : previewRatio === '16:9' ? '16 / 9' : previewRatio === '4:3' ? '4 / 3' : 'auto',
                      position: 'relative',
                      flex: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? '0 0 auto' : '1 1 auto',
                    }}
                  >
                  <iframe
                    ref={iframeRef}
                    style={{
                      width: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? '100%' : '100%',
                      height: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? '100%' : '100%',
                      border: 'none',
                      background: SYNAPSE_COLORS.bgDark,
                      position: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? 'relative' : 'absolute',
                      top: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? undefined : 0,
                      left: previewRatio === '1:1' || previewRatio === '16:9' || previewRatio === '4:3' ? undefined : 0,
                      right: undefined,
                      margin: '0',
                    }}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    title="Preview"
                  />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div> : null}

      {}
      <Modal
        isOpen={diffModalOpen}
        onClose={() => {
          if (!aiBusy) setDiffModalOpen(false);
        }}
        title="AI Improvement Preview"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setActiveDiffTab('diff')}
              aria-pressed={activeDiffTab === 'diff'}
              style={{
                padding: '6px 12px',
                border: `1px solid ${  activeDiffTab === 'diff' ? 'var(--syn-accent-border)' : 'var(--syn-border-strong)'}`,
                background:
                  activeDiffTab === 'diff'
                    ? 'var(--syn-gradient-glass-amber)'
                    : 'var(--syn-bg-surface-1)',
                color: 'var(--syn-text-primary)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Changes (Diff)
            </button>
            <button
              onClick={() => setActiveDiffTab('full')}
              aria-pressed={activeDiffTab === 'full'}
              style={{
                padding: '6px 12px',
                border: `1px solid ${  activeDiffTab === 'full' ? 'var(--syn-accent-border)' : 'var(--syn-border-strong)'}`,
                background:
                  activeDiffTab === 'full'
                    ? 'var(--syn-gradient-glass-amber)'
                    : 'var(--syn-bg-surface-1)',
                color: 'var(--syn-text-primary)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Full Result
            </button>
            {activeDiffTab === 'diff' && (
              <button
                onClick={handleCopyDiff}
                aria-label="Copy diff"
                style={{
                  marginLeft: 'auto',
                  padding: '6px 10px',
                  border: '1px solid var(--syn-border-strong)',
                  background: diffCopied
                    ? 'var(--syn-success-bg)'
                    : 'var(--syn-bg-surface-1)',
                  color: diffCopied ? 'var(--syn-success)' : 'var(--syn-text-primary)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                {diffCopied ? 'Copied' : 'Copy Diff'}
              </button>
            )}
          </div>
          <div
            style={{
              maxHeight: '50vh',
              overflow: 'auto',
              background: 'var(--syn-bg-root)',
              border: '1px solid var(--syn-bg-surface-2)',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {activeDiffTab === 'diff' ? (
              <div>{renderDiffHighlighted(diffText)}</div>
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {fullResult}
              </pre>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setDiffModalOpen(false)}
              style={{
                padding: '8px 14px',
                background: 'var(--syn-bg-surface-2)',
                color: 'var(--syn-text-primary)',
                border: '1px solid var(--syn-border-strong)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmApplyImprovement}
              style={{
                padding: '8px 14px',
                background: 'var(--syn-gradient-amber-strong)',
                color: 'var(--syn-bg-surface-1)',
                border: '1px solid var(--syn-accent-primary)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </Modal>

      {}
      {explainOpen ? <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '340px',
            background: 'var(--syn-bg-surface-1)',
            borderLeft: '1px solid var(--syn-overlay-whisper)',
            boxShadow: '-4px 0 18px -4px var(--syn-depth-strong)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 120,
          }}
          aria-label="AI Explanation Panel"
        >
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--syn-overlay-whisper)',
            }}
          >
            <strong
              style={{
                fontSize: 13,
                background: 'var(--syn-gradient-amber-strong)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Explanation
            </strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setExplainOpen(false)}
                aria-label="Collapse explanation"
                style={{
                  background: 'none',
                  border: '1px solid var(--syn-border-strong)',
                  color: 'var(--syn-text-secondary)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: 12,
                }}
              >
                ⤢
              </button>
              <button
                onClick={() => {
                  setExplainOpen(false);
                  setExplanationContent('');
                  setExplanationHasContent(false);
                }}
                aria-label="Close explanation"
                style={{
                  background: 'none',
                  border: '1px solid var(--syn-border-strong)',
                  color: 'var(--syn-text-secondary)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <div
            style={{
              padding: '12px 14px',
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {explanationContent}
          </div>
        </div> : null}
      {!explainOpen && explanationHasContent ? <button
          onClick={() => setExplainOpen(true)}
          aria-label="Open explanation panel"
          style={{
            position: 'absolute',
            top: '50%',
            right: 4,
            transform: 'translateY(-50%)',
            writingMode: 'vertical-rl',
            background: 'var(--syn-gradient-glass-amber)',
            border: '1px solid var(--syn-accent-glow)',
            color: 'var(--syn-accent-primary)',
            padding: '8px 4px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '.5px',
          }}
        >
          AI
        </button> : null}

      {}
      {localToasts.length > 0 && (
        <div className="ai-toast-stack" aria-live="polite">
          {localToasts.map(t => (
            <div key={t.id} className="ai-toast" data-type="info" data-autofade="true">
              <span>{t.msg}</span>
              {t.retry ? <button onClick={t.retry}>Retry</button> : null}
            </div>
          ))}
        </div>
      )}

      {}
      {aiBusy ? <>
          <style>{`@keyframes synapseSpin{to{transform:rotate(360deg)}}`}</style>
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--syn-bg-surface-1)',
              border: '1px solid var(--syn-overlay-subtle)',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--syn-text-primary)',
              boxShadow: '0 4px 18px var(--syn-depth-medium)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                border: '2px solid var(--syn-accent-glow)',
                borderTopColor: 'var(--syn-accent-primary)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'synapseSpin .8s linear infinite',
              }}
            />
            {aiBusy === 'improve'
              ? 'Improving selection…'
              : aiBusy === 'explain'
                ? 'Explaining…'
                : 'Adding comments…'}
          </div>
        </> : null}
    </div>
  );
};
