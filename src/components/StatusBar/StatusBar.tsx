import React, { useEffect, useMemo, useState } from 'react';
import { emit, mergeEmit, useStatus } from './statusBus';
import { sbAiStart, sbDiagnostics, sbOnline, sbOptions } from './statusBridge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code2,
  CornerDownLeft,
  FileCode,
  FileText,
  GitBranch,
  Hash,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Scissors,
  Settings,
  Type,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { alpha, SB_COLORS, sbFont } from './statusTheme';


const containerStyle: React.CSSProperties = {
  height: '30px',
  background: SB_COLORS.bgPrimary,
  borderTop: `1px solid ${SB_COLORS.borderSoft}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  fontSize: '11px',
  fontFamily: sbFont,
  fontWeight: '500',
  color: SB_COLORS.textPrimary,
  userSelect: 'none',
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  overflow: 'hidden',
  boxShadow: `0 -1px 0 ${SB_COLORS.borderSoft}, 0 -6px 20px rgba(0,0,0,0.55)`,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
};

const chipBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '2px 6px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
  transition: 'background 0.15s var(--syn-easing-bauhaus), border-color 0.15s var(--syn-easing-bauhaus)',
  boxShadow: 'none',
  color: SB_COLORS.textSecondary,
};

const chipHoverOn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = String(alpha('var(--syn-interaction-hover)', 0.65));
  e.currentTarget.style.borderColor = String(alpha(SB_COLORS.borderSoft, 0.7));
  e.currentTarget.style.boxShadow = 'none';
};
const chipHoverOff = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = 'transparent';
  e.currentTarget.style.borderColor = 'transparent';
  e.currentTarget.style.boxShadow = 'none';
};

const chipFocusOn = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.outline = `1px solid ${SB_COLORS.borderHighlight}`;
  (e.currentTarget.style as any).outlineOffset = '0px';
};
const chipFocusOff = (e: React.FocusEvent<HTMLElement>) => {
  e.currentTarget.style.outline = 'none';
};

const neutralLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  color: SB_COLORS.textSecondary,
  padding: '2px 6px',
  borderRadius: '0px',
  transition: 'background 0.2s var(--syn-easing-bauhaus)',
};

const statusTextItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 6px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 0,
};
const neutralHoverOn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = String(alpha('var(--syn-interaction-hover)', 0.65));
};
const neutralHoverOff = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = 'transparent';
};

function formatBackendLabel(backend: 'wasm' | 'javascript'): string {
  return backend === 'wasm' ? 'WASM' : 'JS';
}

const diagChipStyle = (kind: 'error' | 'warning' | 'info'): React.CSSProperties => {
  const tone =
    kind === 'error'
      ? SB_COLORS.error
      : kind === 'warning'
        ? SB_COLORS.warning
        : SB_COLORS.info;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 7px',
    background: alpha(tone, 0.2),
    border: `1px solid ${alpha(tone, 0.45)}`,
    borderRadius: '3px',
    color: tone,
    cursor: 'pointer',
    transition: 'background 0.15s',
  };
};

const netChipStyle = (online: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  fontSize: '10px',
  padding: '2px 6px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '0px',
  color: online ? SB_COLORS.textSecondary : SB_COLORS.stale,
});

const collabChipStyle = (state: 'connected' | 'paused' | 'reconnecting' | 'offline'): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  padding: '2px 6px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '0px',
  color:
    state === 'connected'
      ? SB_COLORS.success
      : state === 'paused'
        ? SB_COLORS.pending
        : state === 'reconnecting'
          ? SB_COLORS.running
          : SB_COLORS.stale,
});


const bytesToHuman = (bytes?: number) => {
  if (bytes == null) return '';
  const thresh = 1024;
  if (bytes < thresh) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  let b = bytes;
  do {
    b /= thresh;
    ++u;
  } while (b >= thresh && u < units.length - 1);
  return `${b.toFixed(1)} ${units[u]}`;
};

interface StatusBarProps {
  language: string;
  content: string;
  cursorPosition?: { line: number; column: number };
  encoding?: string;
  lineEnding?: string;
  tabSize?: number;
  indentation?: 'spaces' | 'tabs';
  fontSize?: number;
  errors?: number;
  warnings?: number;
  isLiveServer?: boolean;
  gitBranch?: string;
  isModified?: boolean;
  onLanguageChange?: (lang: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  language = 'javascript',
  content,
  cursorPosition = { line: 1, column: 1 },
  encoding = 'UTF-8',
  lineEnding = 'LF',
  tabSize = 2,
  indentation = 'spaces',
  errors = 0,
  warnings = 0,
  isLiveServer = false,
  gitBranch = 'main',
  isModified = false,
  onLanguageChange,
}) => {

  const s = useStatus();


  useEffect(() => {
    const on = () => sbOnline(true);
    const off = () => sbOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);


  useEffect(() => {
    let simId: number | undefined;
    if (s.cpu == null || s.mem == null) {
      simId = window.setInterval(() => {
        const cpu = Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 5));
        const mem = Math.min(100, Math.max(0, Math.floor(Math.random() * 40) + 30));
        emit({ cpu, mem });
      }, 3000);
    }
    return () => {
      if (simId) window.clearInterval(simId);
    };
  }, [s.cpu, s.mem]);


  const langDisplay = s.language ?? language;
  const cursorDisplay = s.cursor ?? cursorPosition;
  const encodingDisplay = s.encoding ?? encoding;
  const lineEndingDisplay = s.eol ?? lineEnding;
  const tabSizeDisplay = s.tabSize ?? tabSize;
  const indentationDisplay = s.indentation ?? indentation;
  const errorsDisplay = s.diagnostics?.errors ?? errors;
  const warningsDisplay = s.diagnostics?.warnings ?? warnings;
  const isLiveServerDisplay = s.liveServer?.on ?? isLiveServer;
  const gitBranchDisplay = s.git?.branch ?? gitBranch;
  const isModifiedDisplay = s.dirty ?? isModified;
  const onlineDisplay = s.online ?? navigator.onLine;
  const collaborationDisplay = s.collaboration;

  const aiState = s.ai?.state ?? 'idle';
  const aiLastAction = s.ai?.lastAction ?? 'AI ready';

  const contentSizeBytes = useMemo(() => new TextEncoder().encode(content ?? '').length, [content]);
  const sizeBytesDisplay = s.counts?.sizeBytes ?? contentSizeBytes;


  const fallbackLines = (content ?? '').split(/\r\n|\r|\n/).length;
  const fallbackChars = content.length;
  const fallbackWords = (content.match(/\S+/g) || []).length;
  const lineCount = s.counts?.lines ?? fallbackLines;
  const charCount = s.counts?.chars ?? fallbackChars;
  const wordCount = s.counts?.words ?? fallbackWords;
  const selectedChars = s.selection?.chars ?? 0;
  const selectedLines = s.selection?.lines ?? 0;


  useEffect(() => {
    if (!s.counts) {
      const fc = content ?? '';
      const lines = fc.split('\n').length;
      const chars = fc.length;
      const words = fc.split(/\s+/).filter(Boolean).length;
      const sizeBytes =
        typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(fc).length : chars;
      mergeEmit('counts', { lines, words, chars, sizeBytes });
    }
  }, [content, s.counts]);

  const nowDate = new Date(s.now ?? Date.now());


  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [encMenuOpen, setEncMenuOpen] = useState(false);
  const [indentMenuOpen, setIndentMenuOpen] = useState(false);
  const [gitPanelOpen, setGitPanelOpen] = useState(false);
  const [indentMode, setIndentMode] = useState<'spaces' | 'tabs'>(indentationDisplay);
  const [indentSize, setIndentSize] = useState<number>(tabSizeDisplay);
  const [checkoutBranch, setCheckoutBranch] = useState<string>('');


  const activateWithKeys = (e: React.KeyboardEvent, cb: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cb();
    }
  };

  const getLanguageIcon = (lang: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      javascript: <Code2 size={12} color={SB_COLORS.textAccent} />,
      typescript: <Code2 size={12} color={SB_COLORS.mutedNeutral} />,
      html: <FileCode size={12} color={SB_COLORS.warning} />,
      css: <Type size={12} color={SB_COLORS.mutedNeutral} />,
      json: <FileText size={12} color={SB_COLORS.textAccent} />,
      python: <Code2 size={12} color={SB_COLORS.mutedNeutral} />,
      java: <Code2 size={12} color={SB_COLORS.warning} />,
      cpp: <Zap size={12} color={SB_COLORS.mutedNeutral} />,
      csharp: <Code2 size={12} color={SB_COLORS.success} />,
      go: <Code2 size={12} color={SB_COLORS.mutedNeutral} />,
      rust: <Settings size={12} color={SB_COLORS.error} />,
      php: <Code2 size={12} color={SB_COLORS.mutedNeutral} />,
      ruby: <Code2 size={12} color={SB_COLORS.error} />,
      swift: <Code2 size={12} color={SB_COLORS.warning} />,
      kotlin: <Code2 size={12} color={SB_COLORS.mutedNeutral} />,
    };
    return iconMap[lang.toLowerCase()] || <FileText size={12} color={SB_COLORS.textAccent} />;
  };

  return (
    <div data-component="status-bar" className="status-bar" style={containerStyle}>
      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {}
        <div
          style={{
            ...chipBase,
            background: alpha(SB_COLORS.info, 0.18),
            border: `1px solid ${alpha(SB_COLORS.info, 0.42)}`,
            borderRadius: '3px',
            padding: '2px 8px',
          }}
          title={`Git: ${gitBranchDisplay}${isModifiedDisplay ? ' (modified)' : ''}`}
          aria-label={`Git branch: ${gitBranchDisplay}${isModifiedDisplay ? ', modified' : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => activateWithKeys(e, () => setGitPanelOpen(v => !v))}
          onClick={() => setGitPanelOpen(v => !v)}
          onMouseEnter={chipHoverOn}
          onMouseLeave={chipHoverOff}
          onFocus={chipFocusOn}
          onBlur={chipFocusOff}
        >
          <GitBranch size={12} color={SB_COLORS.textAccent} />
          <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: '10px' }}>
            {gitBranchDisplay}
          </span>
          {isModifiedDisplay ? <span
              title="Unsaved changes"
              style={{ color: SB_COLORS.goldMuted, marginLeft: 4, fontSize: 12, lineHeight: 1 }}
            >
              •
            </span> : null}
        </div>
        {gitPanelOpen ? <div
            style={{
              position: 'fixed',
              bottom: '32px',
              left: '16px',
              background: SB_COLORS.bgPrimary,
              border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
              borderRadius: 0,
              padding: 8,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                title="Checkout Branch"
                placeholder="branch name"
                value={checkoutBranch}
                onChange={e => setCheckoutBranch(e.target.value)}
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.2)}`,
                  borderRadius: 0,
                  padding: '2px 6px',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
              />
              <button
                title="Checkout"
                style={{
                  background: alpha(SB_COLORS.goldSoft, 0.2),
                  color: SB_COLORS.textAccent,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.4)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  fontFamily: sbFont,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('synapse:git', {
                      detail: { action: 'checkout', branch: checkoutBranch },
                    })
                  )
                }
              >
                Checkout
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                title="Pull"
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('synapse:git', { detail: { action: 'pull' } })
                  )
                }
              >
                Pull
              </button>
              <button
                title="Push"
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('synapse:git', { detail: { action: 'push' } })
                  )
                }
              >
                Push
              </button>
              <button
                title="Stash"
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('synapse:git', { detail: { action: 'stash' } })
                  )
                }
              >
                Stash
              </button>
              <button
                title="Open Changes"
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('synapse:git', { detail: { action: 'open-changes' } })
                  )
                }
              >
                Open Changes
              </button>
            </div>
          </div> : null}

        {}
        {s.fileName ? <div
            style={{ ...neutralLabel, cursor: 'default' }}
            title={`${s.filePath || s.fileName}${s.formatLabel ? ` · ${  s.formatLabel}` : s.ext ? ` · ${  s.ext.toUpperCase()}` : ''}`}
          >
            <FileText size={10} color={SB_COLORS.textSecondary} />
            <span style={{ color: SB_COLORS.textSecondary, fontSize: '10px' }}>{s.fileName}</span>
          </div> : null}

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            title={`${aiLastAction}${s.ai?.latencyMs != null ? ` · ${s.ai.latencyMs}ms` : ''}`}
            aria-label={`AI status: ${aiState}. ${aiLastAction}`}
            style={{
              ...statusTextItem,
              boxShadow: 'none',
            }}
          >
            {aiState === 'thinking' ? (
              <Loader2
                size={12}
                color={SB_COLORS.running}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            ) : aiState === 'responded' ? (
              <CheckCircle size={12} color={SB_COLORS.success} />
            ) : aiState === 'error' ? (
              <XCircle size={12} color={SB_COLORS.error} />
            ) : (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 0,
                  display: 'inline-block',
                  background: SB_COLORS.pending,
                }}
              />
            )}
            <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: 10 }}>
              AI
            </span>
            <span style={{ color: SB_COLORS.textSecondary, fontSize: 10 }}>
              {aiLastAction}
              {s.ai?.latencyMs != null ? ` · ${s.ai.latencyMs}ms` : ''}
            </span>
          </div>
          {(() => {
            const handleAiAction = (label: string, intent: string) => {
              sbAiStart(label);
              window.dispatchEvent(new CustomEvent('synapse:ai', { detail: { action: intent } }));
            };
            const qaStyle: React.CSSProperties = { padding: 4, borderRadius: 0, cursor: 'pointer' };
            const qaHover = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = String(alpha(SB_COLORS.goldSoft, 0.15));
            };
            const qaOut = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = 'transparent';
            };
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  title="Explain selection"
                  aria-label="AI: Explain selection"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e =>
                    activateWithKeys(e, () =>
                      handleAiAction('Explain selection', 'ai:explain-selection')
                    )
                  }
                  onClick={() => handleAiAction('Explain selection', 'ai:explain-selection')}
                  style={qaStyle}
                  onMouseEnter={qaHover}
                  onMouseLeave={qaOut}
                >
                  <MessageSquare size={14} color={SB_COLORS.goldSoft} />
                </div>
                <div
                  title="Summarize file"
                  aria-label="AI: Summarize file"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e =>
                    activateWithKeys(e, () => handleAiAction('Summarize file', 'ai:summarize-file'))
                  }
                  onClick={() => handleAiAction('Summarize file', 'ai:summarize-file')}
                  style={qaStyle}
                  onMouseEnter={qaHover}
                  onMouseLeave={qaOut}
                >
                  <FileText size={14} color={SB_COLORS.goldSoft} />
                </div>
                <div
                  title="Fix diagnostics"
                  aria-label="AI: Fix diagnostics"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e =>
                    activateWithKeys(e, () =>
                      handleAiAction('Fix diagnostics', 'ai:fix-diagnostics')
                    )
                  }
                  onClick={() => handleAiAction('Fix diagnostics', 'ai:fix-diagnostics')}
                  style={qaStyle}
                  onMouseEnter={qaHover}
                  onMouseLeave={qaOut}
                >
                  <Wrench size={14} color={SB_COLORS.goldSoft} />
                </div>
                <div
                  title="Ask about API"
                  aria-label="AI: Ask about API"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e =>
                    activateWithKeys(e, () => handleAiAction('Ask about API', 'ai:ask-about-api'))
                  }
                  onClick={() => handleAiAction('Ask about API', 'ai:ask-about-api')}
                  style={qaStyle}
                  onMouseEnter={qaHover}
                  onMouseLeave={qaOut}
                >
                  <HelpCircle size={14} color={SB_COLORS.goldSoft} />
                </div>
              </div>
            );
          })()}

          {/* GeoAI engine status chip */}
          {(() => {
            const geo = s.geoai;
            const gState = geo?.state ?? 'idle';
            const gModels = geo?.loadedModels ?? 0;
            const gMem = geo?.memoryUsedMB ?? 0;
            const gBackend = geo?.backend ?? 'wasm';
            const gLabel =
              gState === 'inferring' ? 'Inferring…' :
              gState === 'loading' ? 'Loading…' :
              gState === 'ready' ? `${gModels} model${gModels !== 1 ? 's' : ''} · ${gMem.toFixed(0)} MB` :
              gState === 'error' ? 'Error' :
              'Idle';
            return (
              <div
                title={`GeoAI: ${gLabel} (${gBackend.toUpperCase()})`}
                aria-label={`GeoAI engine: ${gLabel}`}
                style={{
                  ...statusTextItem,
                }}
              >
                {gState === 'inferring' || gState === 'loading' ? (
                  <Loader2
                    size={11}
                    color={SB_COLORS.running}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                ) : gState === 'ready' ? (
                  <Zap size={11} color={SB_COLORS.success} />
                ) : gState === 'error' ? (
                  <AlertTriangle size={11} color={SB_COLORS.error} />
                ) : (
                  <Activity size={11} color={SB_COLORS.textSecondary} />
                )}
                <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: 10 }}>
                  GeoAI
                </span>
                <span style={{ color: SB_COLORS.textSecondary, fontSize: 10 }}>
                  {gLabel}
                </span>
              </div>
            );
          })()}

          {(() => {
            const streaming = s.streaming;
            const streamState = streaming?.state ?? 'idle';
            const connector = streaming?.connector ?? 'replay';
            const throughput = streaming?.messagesPerMinute ?? 0;
            const received = streaming?.received ?? 0;
            const lastTopic = streaming?.lastTopic;
            const label = streamState === 'streaming'
              ? `${connector.toUpperCase()} · ${throughput.toFixed(0)} msg/min · ${received} total`
              : streamState === 'connecting'
                ? `${connector.toUpperCase()} · connecting`
                : streamState === 'paused'
                  ? `${connector.toUpperCase()} · paused`
                  : streamState === 'error'
                    ? `${connector.toUpperCase()} · error`
                    : 'Idle';

            return (
              <div
                title={`Streaming: ${label}${lastTopic ? ` · ${lastTopic}` : ''}`}
                aria-label={`Streaming runtime: ${label}`}
                style={{
                  ...statusTextItem,
                }}
              >
                {streamState === 'connecting' || streamState === 'streaming' ? (
                  <Loader2 size={11} color={SB_COLORS.running} style={{ animation: 'spin 1s linear infinite' }} />
                ) : streamState === 'paused' ? (
                  <MessageSquare size={11} color={SB_COLORS.stale} />
                ) : streamState === 'error' ? (
                  <AlertTriangle size={11} color={SB_COLORS.error} />
                ) : (
                  <Activity size={11} color={SB_COLORS.textSecondary} />
                )}
                <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: 10 }}>
                  Stream
                </span>
                <span style={{ color: SB_COLORS.textSecondary, fontSize: 10 }}>
                  {label}
                </span>
              </div>
            );
          })()}

          {(() => {
            const spatial = s.spatialIndex;
            const runtimeState = spatial?.state ?? 'idle';
            const runtimeBackend = spatial?.backend ?? 'javascript';
            const runtimeRecords = spatial?.records ?? 0;
            const label = runtimeState === 'querying'
              ? `${formatBackendLabel(runtimeBackend)} · ${spatial?.lastQueryKind ?? 'query'} · ${spatial?.lastQueryMs?.toFixed(1) ?? '—'} ms`
              : runtimeState === 'building'
                ? `${formatBackendLabel(runtimeBackend)} · building`
                : runtimeState === 'fallback'
                  ? `JS fallback · ${runtimeRecords.toLocaleString()} records`
                  : runtimeState === 'ready'
                    ? `${formatBackendLabel(runtimeBackend)} · ${runtimeRecords.toLocaleString()} records`
                    : runtimeState === 'error'
                      ? 'Error'
                      : spatial?.wasmEnabled === false
                        ? 'JS fallback preferred'
                        : 'Idle';

            return (
              <div
                title={`Spatial index: ${label}`}
                aria-label={`Spatial index: ${label}`}
                style={{
                  ...statusTextItem,
                }}
              >
                {runtimeState === 'building' || runtimeState === 'querying' ? (
                  <Loader2 size={11} color={SB_COLORS.running} style={{ animation: 'spin 1s linear infinite' }} />
                ) : runtimeState === 'ready' ? (
                  <MapPin size={11} color={runtimeBackend === 'wasm' ? SB_COLORS.success : SB_COLORS.pending} />
                ) : runtimeState === 'fallback' ? (
                  <AlertTriangle size={11} color={SB_COLORS.stale} />
                ) : runtimeState === 'error' ? (
                  <XCircle size={11} color={SB_COLORS.error} />
                ) : (
                  <Activity size={11} color={SB_COLORS.textSecondary} />
                )}
                <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: 10 }}>
                  Index
                </span>
                <span style={{ color: SB_COLORS.textSecondary, fontSize: 10 }}>
                  {label}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{ ...neutralLabel, cursor: 'default' }}
            title={`Lines: ${lineCount}`}
            aria-label={`Lines: ${lineCount}`}
          >
            <FileText size={10} color={SB_COLORS.textSecondary} />
            <span style={{ color: SB_COLORS.textSecondary }}>{lineCount}</span>
            <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>lines</span>
          </div>
          <div
            style={{ ...neutralLabel, cursor: 'default' }}
            title={`Words: ${wordCount}`}
            aria-label={`Words: ${wordCount}`}
          >
            <Type size={10} color={SB_COLORS.textSecondary} />
            <span style={{ color: SB_COLORS.textSecondary }}>{wordCount}</span>
            <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>words</span>
          </div>
          <div
            style={{ ...neutralLabel, cursor: 'default' }}
            title={`Characters: ${charCount}`}
            aria-label={`Characters: ${charCount}`}
          >
            <Hash size={10} color={SB_COLORS.textSecondary} />
            <span style={{ color: SB_COLORS.textSecondary }}>{charCount}</span>
            <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>chars</span>
          </div>
          <div
            style={{ ...neutralLabel, cursor: 'default' }}
            title={`Size: ${bytesToHuman(sizeBytesDisplay)}`}
            aria-label={`Size: ${bytesToHuman(sizeBytesDisplay)}`}
          >
            <FileCode size={10} color={SB_COLORS.textSecondary} />
            <span style={{ color: SB_COLORS.textSecondary }}>{bytesToHuman(sizeBytesDisplay)}</span>
            <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>size</span>
          </div>
          {(s.formatLabel || s.ext) ? <div
              style={{ ...neutralLabel, cursor: 'default' }}
              title={`Format: ${s.formatLabel ?? s.ext?.toUpperCase()}`}
              aria-label={`Format: ${s.formatLabel ?? s.ext?.toUpperCase()}`}
            >
              <Type size={10} color={SB_COLORS.textSecondary} />
              <span style={{ color: SB_COLORS.textSecondary }}>
                {s.formatLabel ?? s.ext?.toUpperCase()}
              </span>
              <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>format</span>
            </div> : null}
          {selectedChars > 0 && (
            <div
              style={{ ...neutralLabel, cursor: 'default' }}
              title={`Selected: ${selectedChars} chars`}
            >
              <Scissors size={10} color={SB_COLORS.textSecondary} />
              <span style={{ color: SB_COLORS.textSecondary }}>{selectedChars}</span>
              <span style={{ color: SB_COLORS.textSecondary, fontSize: '9px' }}>selected</span>
            </div>
          )}
        </div>

        {}
        {(errorsDisplay > 0 || warningsDisplay > 0 || (s.diagnostics?.infos ?? 0) > 0) && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 16 }}
            title="Open Problems"
            role="button"
            tabIndex={0}
            onKeyDown={e =>
              activateWithKeys(e, () => {
                sbDiagnostics(errorsDisplay, warningsDisplay, s.diagnostics?.infos ?? 0);
                window.dispatchEvent(
                  new CustomEvent('synapse:problems', { detail: { lastAction: 'open-problems' } })
                );
              })
            }
            onClick={() => {
              sbDiagnostics(errorsDisplay, warningsDisplay, s.diagnostics?.infos ?? 0);
              window.dispatchEvent(
                new CustomEvent('synapse:problems', { detail: { lastAction: 'open-problems' } })
              );
            }}
          >
            {errorsDisplay > 0 && (
              <div style={diagChipStyle('error')} aria-label={`Errors: ${errorsDisplay}`}>
                <XCircle size={11} color={SB_COLORS.error} />
                <span style={{ color: SB_COLORS.error, fontSize: '10px', fontWeight: 700 }}>
                  {errorsDisplay}
                </span>
              </div>
            )}
            {warningsDisplay > 0 && (
              <div style={diagChipStyle('warning')} aria-label={`Warnings: ${warningsDisplay}`}>
                <AlertTriangle size={11} color={SB_COLORS.warning} />
                <span style={{ color: SB_COLORS.warning, fontSize: '10px', fontWeight: 700 }}>
                  {warningsDisplay}
                </span>
              </div>
            )}
            {(s.diagnostics?.infos ?? 0) > 0 && (
              <div style={diagChipStyle('info')} aria-label={`Infos: ${s.diagnostics?.infos}`}>
                <span style={{ color: SB_COLORS.textSecondary, fontSize: '10px', fontWeight: 600 }}>
                  Info {s.diagnostics?.infos}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {}
        <div
          style={chipBase}
          title={`Language: ${langDisplay}`}
          aria-label={`Language: ${langDisplay}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => activateWithKeys(e, () => setLangMenuOpen(v => !v))}
          onClick={() => setLangMenuOpen(v => !v)}
          onMouseEnter={chipHoverOn}
          onMouseLeave={chipHoverOff}
          onFocus={chipFocusOn}
          onBlur={chipFocusOff}
        >
          {getLanguageIcon(langDisplay)}
          <span
            style={{
              color: SB_COLORS.textAccent,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            {langDisplay}
          </span>
        </div>
        {langMenuOpen ? <div
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '320px',
              background: SB_COLORS.bgPrimary,
              border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
              borderRadius: 0,
              padding: 8,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 160,
            }}
          >
            {[
              'javascript',
              'typescript',
              'html',
              'css',
              'json',
              'python',
              'java',
              'cpp',
              'csharp',
              'go',
              'rust',
              'php',
              'ruby',
              'swift',
              'kotlin',
            ].map(l => (
              <button
                key={l}
                title={`Set language: ${l}`}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: 'none',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() => {
                  sbOptions(l);
                  onLanguageChange?.(l);
                  setLangMenuOpen(false);
                }}
              >
                {l}
              </button>
            ))}
          </div> : null}

        {}
        <div
          style={chipBase}
          title={`Ln ${cursorDisplay?.line ?? 1}, Col ${cursorDisplay?.column ?? 1}${selectedChars > 0 ? `, Sel ${selectedChars}${selectedLines > 0 ? ` chars, ${selectedLines} lines` : ''}` : ''}`}
          aria-label={`Cursor at line ${cursorDisplay?.line ?? 1}, column ${cursorDisplay?.column ?? 1}${selectedChars > 0 ? `, selection ${selectedChars} chars${selectedLines > 0 ? `, ${selectedLines} lines` : ''}` : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => activateWithKeys(e, () => emit({ now: Date.now() }))}
          onClick={() => emit({ now: Date.now() })}
          onMouseEnter={chipHoverOn}
          onMouseLeave={chipHoverOff}
          onFocus={chipFocusOn}
          onBlur={chipFocusOff}
        >
          <MapPin size={12} color={SB_COLORS.textAccent} />
          <span style={{ color: SB_COLORS.textAccent, fontWeight: 'bold', fontSize: '10px' }}>
            Ln {cursorDisplay?.line ?? 1}, Col {cursorDisplay?.column ?? 1}
            {selectedChars > 0 ? `  ·  Sel ${selectedChars}` : ''}
          </span>
        </div>

        {}
        <div
          style={neutralLabel}
          title={`Indentation: ${indentationDisplay === 'spaces' ? `${tabSizeDisplay} Spaces` : `${tabSizeDisplay} Tabs`}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => activateWithKeys(e, () => setIndentMenuOpen(v => !v))}
          onClick={() => setIndentMenuOpen(v => !v)}
          onMouseEnter={neutralHoverOn}
          onMouseLeave={neutralHoverOff}
        >
          <Settings size={10} color={SB_COLORS.textSecondary} />
          <span style={{ fontSize: '10px', color: SB_COLORS.textSecondary }}>
            {indentationDisplay === 'spaces'
              ? `${tabSizeDisplay} Spaces`
              : `${tabSizeDisplay} Tabs`}
          </span>
        </div>
        {indentMenuOpen ? <div
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '180px',
              background: SB_COLORS.bgPrimary,
              border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
              borderRadius: 0,
              padding: 8,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ color: SB_COLORS.textSecondary, fontFamily: sbFont, fontSize: 11 }}>
                Mode
              </label>
              <select
                title="Indentation Mode"
                value={indentMode}
                onChange={e => setIndentMode(e.target.value as 'spaces' | 'tabs')}
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 6px',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
              >
                <option value="spaces">Spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ color: SB_COLORS.textSecondary, fontFamily: sbFont, fontSize: 11 }}>
                Size
              </label>
              <input
                title="Tab Size"
                type="number"
                min={1}
                max={8}
                value={indentSize}
                onChange={e => setIndentSize(Number(e.target.value))}
                style={{
                  width: 60,
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
                  borderRadius: 0,
                  padding: '2px 6px',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                title="Cancel"
                style={{
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() => setIndentMenuOpen(false)}
              >
                Cancel
              </button>
              <button
                title="Apply"
                style={{
                  background: alpha(SB_COLORS.goldSoft, 0.2),
                  color: SB_COLORS.textAccent,
                  border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.4)}`,
                  borderRadius: 0,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() => {
                  sbOptions(undefined, indentSize, indentMode);
                  setIndentMenuOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div> : null}

        {}
        <div
          style={{ ...neutralLabel, fontSize: '10px' }}
          title={`Encoding: ${encodingDisplay}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => activateWithKeys(e, () => setEncMenuOpen(v => !v))}
          onClick={() => setEncMenuOpen(v => !v)}
          onMouseEnter={neutralHoverOn}
          onMouseLeave={neutralHoverOff}
        >
          <FileCode size={10} color={SB_COLORS.textSecondary} />
          <span style={{ color: SB_COLORS.textSecondary }}>{encodingDisplay}</span>
        </div>
        {encMenuOpen ? <div
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '120px',
              background: SB_COLORS.bgPrimary,
              border: `1px solid ${alpha(SB_COLORS.goldSoft, 0.3)}`,
              borderRadius: 0,
              padding: 8,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 160,
            }}
          >
            {['UTF-8', 'UTF-16LE', 'ISO-8859-9', 'Windows-1254'].map(enc => (
              <button
                key={enc}
                title={`Set encoding: ${enc}`}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  color: SB_COLORS.textSecondary,
                  border: 'none',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontFamily: sbFont,
                  fontSize: 11,
                }}
                onClick={() => {
                  sbOptions(undefined, undefined, undefined, enc);
                  setEncMenuOpen(false);
                }}
              >
                {enc}
              </button>
            ))}
          </div> : null}

        {}
        <div
          style={{ ...neutralLabel, fontSize: '10px' }}
          title={`End of Line: ${lineEndingDisplay}`}
          role="button"
          tabIndex={0}
          onKeyDown={e =>
            activateWithKeys(e, () =>
              sbOptions(
                undefined,
                undefined,
                undefined,
                undefined,
                lineEndingDisplay === 'LF' ? 'CRLF' : 'LF'
              )
            )
          }
          onClick={() =>
            sbOptions(
              undefined,
              undefined,
              undefined,
              undefined,
              lineEndingDisplay === 'LF' ? 'CRLF' : 'LF'
            )
          }
          onMouseEnter={neutralHoverOn}
          onMouseLeave={neutralHoverOff}
        >
          <CornerDownLeft size={10} color={SB_COLORS.textSecondary} />
          <span style={{ color: SB_COLORS.textSecondary }}>{lineEndingDisplay}</span>
        </div>

        {}
        <div
          style={{
            ...chipBase,
            background: 'transparent',
            border: '1px solid transparent',
          }}
          title={s.liveServer?.port ? `Live Server: ${s.liveServer?.port}` : 'Toggle Live Server'}
          aria-label={
            s.liveServer?.port ? `Live Server on port ${s.liveServer?.port}` : 'Toggle Live Server'
          }
          role="button"
          tabIndex={0}
          onKeyDown={e =>
            activateWithKeys(e, () =>
              emit({
                liveServer:
                  s.liveServer?.port != null
                    ? { on: !isLiveServerDisplay, port: s.liveServer.port }
                    : { on: !isLiveServerDisplay },
              })
            )
          }
          onClick={() =>
            emit({
              liveServer:
                s.liveServer?.port != null
                  ? { on: !isLiveServerDisplay, port: s.liveServer.port }
                  : { on: !isLiveServerDisplay },
            })
          }
          onMouseEnter={chipHoverOn}
          onMouseLeave={chipHoverOff}
          onFocus={chipFocusOn}
          onBlur={chipFocusOff}
        >
          <Activity
            size={12}
            color={isLiveServerDisplay ? SB_COLORS.running : SB_COLORS.textSecondary}
          />
          <span
            style={{
              color: isLiveServerDisplay ? SB_COLORS.running : SB_COLORS.textSecondary,
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            LIVE{isLiveServerDisplay && s.liveServer?.port ? `:${s.liveServer.port}` : ''}
          </span>
        </div>

        {}
        <div
          style={netChipStyle(onlineDisplay)}
          title={onlineDisplay ? 'Online' : 'Offline'}
          aria-label={onlineDisplay ? 'Online' : 'Offline'}
        >
          {onlineDisplay ? (
            <Wifi size={10} color={SB_COLORS.success} />
          ) : (
            <WifiOff size={10} color={SB_COLORS.error} />
          )}
          <span
            style={{
              color: onlineDisplay ? SB_COLORS.success : SB_COLORS.stale,
              fontWeight: 'bold',
            }}
          >
            {onlineDisplay ? 'Online' : 'Offline'}
          </span>
        </div>

        {collaborationDisplay ? (
          <div
            style={collabChipStyle(collaborationDisplay.state)}
            title={`Collaboration ${collaborationDisplay.state}`}
            aria-label={`Collaboration ${collaborationDisplay.state}`}
          >
            <Users
              size={10}
              color={
                collaborationDisplay.state === 'connected'
                  ? SB_COLORS.success
                  : collaborationDisplay.state === 'paused'
                    ? SB_COLORS.pending
                    : collaborationDisplay.state === 'reconnecting'
                      ? SB_COLORS.running
                      : SB_COLORS.stale
              }
            />
            <span
              style={{
                color:
                  collaborationDisplay.state === 'connected'
                    ? SB_COLORS.success
                    : collaborationDisplay.state === 'paused'
                      ? SB_COLORS.pending
                      : collaborationDisplay.state === 'reconnecting'
                        ? SB_COLORS.running
                        : SB_COLORS.stale,
                fontWeight: 'bold',
              }}
            >
              COLLAB {collaborationDisplay.collaborators}
            </span>
            {collaborationDisplay.pendingChanges > 0 ? (
              <span style={{ color: SB_COLORS.pending, fontWeight: 'bold' }}>
                +{collaborationDisplay.pendingChanges}
              </span>
            ) : null}
          </div>
        ) : null}

        {}
        <div
          style={{ ...chipBase, fontSize: '10px', fontWeight: 'bold' }}
          title={new Intl.DateTimeFormat(navigator.language || 'en-US', {
            dateStyle: 'full',
            timeStyle: 'long',
          }).format(nowDate)}
          onMouseEnter={chipHoverOn}
          onMouseLeave={chipHoverOff}
          onFocus={chipFocusOn}
          onBlur={chipFocusOff}
          role="button"
          tabIndex={0}
          aria-label={`Time ${new Intl.DateTimeFormat(navigator.language || 'en-US', { hour: '2-digit', minute: '2-digit' }).format(nowDate)}`}
        >
          <Clock size={10} color={SB_COLORS.textAccent} />
          <span style={{ color: SB_COLORS.textAccent }}>
            {(() => {
              const locale = navigator.language || 'en-US';
              const opts: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              };
              if (locale.toLowerCase().startsWith('tr')) opts.hour12 = false;
              return new Intl.DateTimeFormat(locale, opts).format(nowDate);
            })()}
          </span>
        </div>
      </div>

      {}
      <style>{`
        @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
        @keyframes glow { 0%, 100% { box-shadow: var(--syn-glow-subtle);} 50% { box-shadow: var(--shadow-glow);} }
        @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .status-bar { animation: slideIn 0.3s ease-out; }
        .status-bar::-webkit-scrollbar { height: 2px; }
        .status-bar::-webkit-scrollbar-track { background: ${alpha(SB_COLORS.borderSoft, 0.35)}; }
        .status-bar::-webkit-scrollbar-thumb { background: ${alpha(SB_COLORS.info, 0.55)}; border-radius: 0; }
        .status-bar::-webkit-scrollbar-thumb:hover { background: ${alpha(SB_COLORS.info, 0.75)}; }
        @media (max-width: 768px) { .status-bar { padding: 0 8px; font-size: 10px; } }
        @media (prefers-contrast: high) { .status-bar { background: ${SB_COLORS.bgPrimary} !important; border-top: 2px solid ${SB_COLORS.borderHighlight} !important; color: ${SB_COLORS.textPrimary} !important; } }
        @media (prefers-reduced-motion: reduce) { .status-bar, .status-bar * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
};

export default StatusBar;
