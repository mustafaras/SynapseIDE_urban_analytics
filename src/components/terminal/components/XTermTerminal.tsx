import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import type { ShellType } from '../types/shellTypes';

const TERM_SERVER_URL = `ws://127.0.0.1:${import.meta.env.VITE_TERM_PORT ?? 9231}`;

type ConnState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface XTermTerminalProps {
  shell: ShellType;
  onStateChange?: (state: ConnState) => void;
  onTitleChange?: (title: string) => void;
  /** Called when the Retry button is clicked — parent should bump xterm key to force remount. */
  onReconnect?: () => void;
}

const XTERM_THEME = {
  background: '#0f1115',
  foreground: '#d4d4d4',
  cursor: '#60a5fa',
  cursorAccent: '#0f1115',
  selectionBackground: 'rgba(96,165,250,0.28)',
  selectionForeground: '#d4d4d4',
  black: '#111318',
  red: '#EF4444',
  green: '#4ADE80',
  yellow: '#EAB308',
  blue: '#60A5FA',
  magenta: '#C084FC',
  cyan: '#22D3EE',
  white: '#d4d4d4',
  brightBlack: '#3D3D3D',
  brightRed: '#F87171',
  brightGreen: '#86EFAC',
  brightYellow: '#FDE047',
  brightBlue: '#93C5FD',
  brightMagenta: '#D8B4FE',
  brightCyan: '#67E8F9',
  brightWhite: '#f3f4f6',
};

export const XTermTerminal: React.FC<XTermTerminalProps> = ({
  shell,
  onStateChange,
  onTitleChange,
  onReconnect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connState, setConnState] = useState<ConnState>('connecting');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [autoRetryIn, setAutoRetryIn] = useState<number | null>(null);

  const notifyState = (s: ConnState) => {
    setConnState(s);
    onStateChange?.(s);
  };

  // Auto-retry countdown on disconnect/error
  useEffect(() => {
    if (connState !== 'disconnected' && connState !== 'error') {
      if (autoRetryTimerRef.current) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
      setAutoRetryIn(null);
      return undefined;
    }
    let remaining = 5;
    setAutoRetryIn(remaining);
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setAutoRetryIn(null);
        onReconnect?.();
      } else {
        setAutoRetryIn(remaining);
        autoRetryTimerRef.current = setTimeout(tick, 1000);
      }
    };
    autoRetryTimerRef.current = setTimeout(tick, 1000);
    return () => {
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connState]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    // Create xterm instance
    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowTransparency: true,
      convertEol: false,
      macOptionIsMeta: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onTitleChange(title => onTitleChange?.(title));

    // Build WebSocket URL with shell + initial dimensions
    const { cols, rows } = term;
    const wsUrl = `${TERM_SERVER_URL}?shell=${encodeURIComponent(shell)}&cols=${cols}&rows=${rows}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      notifyState('connected');
    };

    ws.onclose = () => {
      notifyState('disconnected');
      term.writeln('\r\n\x1b[33m--- Terminal disconnected. Restart the terminal server to reconnect. ---\x1b[0m');
    };

    ws.onerror = () => {
      notifyState('error');
      setErrorMsg('Cannot connect to terminal server. Run: node server/terminal-server.cjs');
      term.writeln('\r\n\x1b[31m[Synapse] Terminal server not reachable.\x1b[0m');
      term.writeln('\x1b[31m[Synapse] Start it with:  node server/terminal-server.cjs\x1b[0m');
      term.writeln('\x1b[31m[Synapse] Or use: npm run dev:full\x1b[0m\r\n');
    };

    ws.onmessage = evt => {
      let msg: { type: string; data?: string; code?: number; message?: string };
      try { msg = JSON.parse(evt.data); } catch { return; }

      if (msg.type === 'data' && typeof msg.data === 'string') {
        term.write(msg.data);
      } else if (msg.type === 'exit') {
        term.writeln(`\r\n\x1b[33m--- Process exited (code ${msg.code ?? '?'}) ---\x1b[0m`);
        notifyState('disconnected');
      } else if (msg.type === 'error') {
        term.writeln(`\r\n\x1b[31m[Synapse Error] ${msg.message}\x1b[0m`);
        notifyState('error');
      }
    };

    // keyboard input → server
    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // resize → server
    term.onResize(({ cols: c, rows: r }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: c, rows: r }));
      }
    });

    // Container resize → fit
    const ro = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    if (containerRef.current) ro.observe(containerRef.current);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      ws.close();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
    // shell change → full reconnect (handled by key prop from parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shell]);

  const handleReconnect = useCallback(() => {
    // Cancel auto-retry countdown
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    setAutoRetryIn(null);
    // Close the current WS (cleanup runs), then ask parent to bump key → full remount.
    try { wsRef.current?.close(); } catch {}
    onReconnect?.();
  }, [onReconnect]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        position: 'relative',
      }}
    >
      {/* Connection status badge */}
      {connState !== 'connected' && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'color-mix(in srgb, var(--syn-surface-panel, #121212) 90%, transparent)',
            border: `1px solid ${connState === 'error' ? 'var(--syn-status-error, #ef4444)' : 'var(--syn-status-info, #60a5fa)'}`,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: connState === 'error' ? 'var(--syn-status-error, #ef4444)' : 'var(--syn-status-info, #60a5fa)',
            pointerEvents: 'all',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: connState === 'connecting' ? 'var(--syn-status-running, #38bdf8)'
                : connState === 'error' ? 'var(--syn-status-error, #ef4444)'
                : 'var(--syn-text-muted, #8b949e)',
              animation: connState === 'connecting' ? 'pulse 1.2s ease-in-out infinite' : 'none',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {connState === 'connecting' && 'Connecting…'}
          {connState === 'disconnected' && (autoRetryIn != null ? `Reconnecting in ${autoRetryIn}s…` : 'Disconnected')}
          {connState === 'error' && (errorMsg || 'Server not running')}
          {(connState === 'disconnected' || connState === 'error') && (
            <button
              onClick={handleReconnect}
              style={{
                marginLeft: 6,
                background: 'transparent',
                border: '1px solid currentColor',
                color: 'inherit',
                borderRadius: 4,
                fontSize: 10,
                padding: '1px 6px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* xterm.js mount point */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          padding: '6px 10px',
          overflow: 'hidden',
          minHeight: 0,
          background: '#0f1115',
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .xterm { height: 100%; background: #0f1115; }
        .xterm-screen { background: #0f1115; }
        .xterm-viewport { overflow-y: auto !important; background: #0f1115 !important; }
        .xterm-viewport::-webkit-scrollbar { width: 8px; }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: rgba(96,165,250,0.42);
          border-radius: 4px;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: rgba(96,165,250,0.62);
        }
        .xterm-viewport::-webkit-scrollbar-track { background: #0b0f14; }
      `}</style>
    </div>
  );
};

export default XTermTerminal;
