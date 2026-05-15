/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-duplicate-imports */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, Terminal as TerminalIcon, X } from 'lucide-react';
import { XTermTerminal } from './XTermTerminal';
import type { ShellType } from '../types/shellTypes';
import { SHELL_CONFIGS } from '../types/shellTypes';
import { subscribeTerminalLogs } from '../terminalLogBus';
import type { TerminalSyntheticLog } from '../terminalLogBus';

interface TerminalProps {
 shell?: ShellType;
 onShellChange?: (shell: ShellType) => void;
 onClose?: () => void;
 height?: number;
 onHeightChange?: (height: number) => void;
 className?: string;
 aiAssistantWidth?: number;
 fileExplorerWidth?: number;
}


const HEIGHT_CONST = {
 MIN: 28,
 DEFAULT: 320,
 MAX_RATIO: 0.7,
 SNAP_THRESHOLD_MIN: 12,
 SNAP_THRESHOLD_MAX: 16,
};

export const Terminal: React.FC<TerminalProps> = ({
 shell = 'powershell',
 onShellChange,
 onClose,

 height: _height = HEIGHT_CONST.DEFAULT,
 onHeightChange,
 className = '',
 aiAssistantWidth = 500,
 fileExplorerWidth = 300,
}) => {
 const [currentShell, setCurrentShell] = useState<ShellType>(shell);
 const [xtermKey, setXtermKey] = useState(0); // bump to reconnect xterm
 const [isMaximized, setIsMaximized] = useState(false);
 const [isMinimized, setIsMinimized] = useState(false);


 const persistedHeightRef = useRef<number | null>(null);
 const previousNonMinHeightRef = useRef<number>(_height || HEIGHT_CONST.DEFAULT);

 const dragHeightRef = useRef<number | null>(null);


 useEffect(() => {
 try {
 const stored = localStorage.getItem('synTerminal:height');
 if (stored) {
 const parsed = parseInt(stored, 10);
 if (!Number.isNaN(parsed) && parsed > HEIGHT_CONST.MIN) {
 onHeightChange?.(parsed);
 previousNonMinHeightRef.current = parsed;
 persistedHeightRef.current = parsed;
 }
 }
 } catch {

 }

 }, []);

 // Synthetic log messages are shown inside the xterm instance itself via the
 // WebSocket server; for now we simply discard them on the old bus.
 useEffect(() => {
 const unsub = subscribeTerminalLogs((_log: TerminalSyntheticLog) => { /* forwarded via WS */ });
 return () => { try { unsub(); } catch {} };
 }, []);

 const handleShellChange = (newShell: ShellType) => {
 setCurrentShell(newShell);
 setXtermKey(k => k + 1); // reconnect with new shell
 onShellChange?.(newShell);
 };

 const applySnappedHeight = useCallback(
 (raw: number) => {
 const maxHeight = Math.floor(window.innerHeight * HEIGHT_CONST.MAX_RATIO);
 let target = raw;

 if (Math.abs(raw - HEIGHT_CONST.MIN) <= HEIGHT_CONST.SNAP_THRESHOLD_MIN) {
 target = HEIGHT_CONST.MIN;
 } else if (Math.abs(raw - maxHeight) <= HEIGHT_CONST.SNAP_THRESHOLD_MAX) {
 target = maxHeight;
 }

 target = Math.min(Math.max(target, HEIGHT_CONST.MIN), maxHeight);
 onHeightChange?.(target);
 if (target > HEIGHT_CONST.MIN && target < maxHeight) {
 previousNonMinHeightRef.current = target;
 persistedHeightRef.current = target;
 try {
 localStorage.setItem('synTerminal:height', String(target));
 } catch {}
 }
 },
 [onHeightChange]
 );

 const handleToggleMaximize = () => {

 if (isMinimized) {
 setIsMinimized(false);
 const restoreMin = previousNonMinHeightRef.current || HEIGHT_CONST.DEFAULT;
 onHeightChange?.(restoreMin);
 return;
 }
 if (isMaximized) {
 setIsMaximized(false);
 const restore = previousNonMinHeightRef.current || HEIGHT_CONST.DEFAULT;
 onHeightChange?.(restore);
 } else {
 setIsMaximized(true);
 const maxH = Math.floor(window.innerHeight * HEIGHT_CONST.MAX_RATIO);
 onHeightChange?.(maxH);
 }
 };

 const handleToggleMinimize = () => {
 if (isMinimized) {
 setIsMinimized(false);
 const target = previousNonMinHeightRef.current || HEIGHT_CONST.DEFAULT;
 onHeightChange?.(target);
 } else {
 if (_height > HEIGHT_CONST.MIN) {
 previousNonMinHeightRef.current = _height;
 }
 setIsMinimized(true);
 onHeightChange?.(HEIGHT_CONST.MIN);
 setIsMaximized(false);
 }
 };


 useEffect(() => {
 if (!isMaximized && !isMinimized && _height < HEIGHT_CONST.MIN) {
 onHeightChange?.(HEIGHT_CONST.MIN);
 }
 }, [_height, isMaximized, isMinimized, onHeightChange]);

 const handleClearTerminal = () => {
 // Reconnect (clear) xterm session
 setXtermKey(k => k + 1);
 };


 const effectiveHeight = isMaximized
 ? Math.floor(window.innerHeight * HEIGHT_CONST.MAX_RATIO)
 : _height;

 const isUltraCompact = isMinimized || _height <= HEIGHT_CONST.MIN + 2;

 const terminalContainer = (
 <div
 className={`${className} syn-terminal-container`}
 style={{
 height: `${effectiveHeight}px`,

 background: 'var(--syn-surface-workbench, #0f1115)',
 backdropFilter: 'none',
 border: '1px solid var(--syn-border-subtle, rgba(255,255,255,0.08))',
 borderBottom: 'none',
 borderTop: '1px solid color-mix(in srgb, var(--syn-border-active, #60a5fa) 42%, transparent)',
 color: 'var(--syn-text-primary, #d4d4d4)',
 fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
 fontSize: '13px',
 overflow: 'hidden',
 position: 'absolute',

 bottom: '22px',

 left: fileExplorerWidth && fileExplorerWidth > 0 ? `${fileExplorerWidth}px` : 0,
 right: aiAssistantWidth ? `${aiAssistantWidth}px` : 0,
 zIndex: 2147483647,
 boxShadow: 'none',
 flexShrink: 0,
 display: 'flex',
 flexDirection: 'column',
 transition: 'var(--syn-transition-medium)',
 }}
 >
 {}
 <div
 onMouseDown={e => {
 const startY = e.clientY;
 const startHeight = _height;
 dragHeightRef.current = startHeight;
 const onMove = (moveEvt: MouseEvent) => {
 const delta = startY - moveEvt.clientY;
 const newH = startHeight + delta;
 if (!isMaximized && !isMinimized) {
 onHeightChange?.(Math.max(newH, HEIGHT_CONST.MIN));
 dragHeightRef.current = Math.max(newH, HEIGHT_CONST.MIN);
 }
 };
 const onUp = () => {
 window.removeEventListener('mousemove', onMove);
 window.removeEventListener('mouseup', onUp);
 if (!isMaximized && !isMinimized) {

 applySnappedHeight(dragHeightRef.current ?? _height);
 }
 setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
 };
 window.addEventListener('mousemove', onMove);
 window.addEventListener('mouseup', onUp);
 }}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 height: 5,
 cursor: 'row-resize',
 zIndex: 10,
 background: 'color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 22%, transparent)',
 transition: 'background 0.15s',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 40%, transparent)'; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 22%, transparent)'; }}
 />
 {}
 <div
 style={{
 background: 'var(--syn-surface-panel, #121212)',
 borderBottom: '1px solid var(--syn-border-subtle, rgba(255,255,255,0.08))',
 padding: '8px 16px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 flexShrink: 0,
 }}
 onDoubleClick={handleToggleMinimize}
 title={isMinimized ? 'Restore Height (Double Click)' : 'Minimize (Double Click)'}
 >
 {}
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <div
 style={{
 background: 'var(--syn-surface-elevated, #1a1d24)',
 borderRadius: '50%',
 width: '8px',
 height: '8px',
 }}
 />
 <TerminalIcon size={16} color="var(--syn-interaction-active, #60a5fa)" />
 <span
 style={{
 color: 'var(--syn-text-primary, #d4d4d4)',
 fontWeight: 600,
 fontSize: '13px',
 letterSpacing: '.5px',
 }}
 >
 Terminal
 </span>
 </div>

 {}
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 {}
 <div
 style={{
 color: SHELL_CONFIGS[currentShell].color,
 display: 'flex',
 alignItems: 'center',
 filter: 'none',
 }}
 >
 {React.createElement(SHELL_CONFIGS[currentShell].icon, {
 size: 16,
 strokeWidth: 2,
 })}
 </div>

 <div style={{ position: 'relative' }}>
 <select
 value={currentShell}
 onChange={e => handleShellChange(e.target.value as ShellType)}
 aria-label="Terminal shell"
 className="terminal-shell-select"
 style={{
 background: 'var(--syn-surface-editor, #111827)',
 border: '1px solid var(--syn-border-subtle, rgba(255,255,255,0.12))',
 borderRadius: '6px',
 color: 'var(--syn-text-secondary, #b4b4b4)',
 fontSize: '12px',
 fontWeight: 500,
 padding: '6px 24px 6px 10px',
 cursor: 'pointer',
 fontFamily: 'inherit',
 transition: 'background .18s var(--syn-easing-bauhaus), border-color .18s var(--syn-easing-bauhaus), color .18s var(--syn-easing-bauhaus)',
 boxShadow: 'none',
 backdropFilter: 'none',
 WebkitAppearance: 'none',
 MozAppearance: 'none',
 appearance: 'none',
 minWidth: '120px',

 margin: 0,
 textIndent: 0,
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'var(--syn-surface-elevated, #1a1d24)'; e.currentTarget.style.borderColor = 'var(--syn-border-default, rgba(255,255,255,0.2))'; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'var(--syn-surface-editor, #111827)'; e.currentTarget.style.borderColor = 'var(--syn-border-subtle, rgba(255,255,255,0.12))'; }}
 >
 {Object.entries(SHELL_CONFIGS).map(([key, config]) => (
 <option key={key} value={key} className="terminal-shell-option">
 {config.name}
 </option>
 ))}
 </select>

 {}
 <div
 style={{
 position: 'absolute',
 right: '8px',
 top: '50%',
 transform: 'translateY(-50%)',
 color: 'var(--syn-text-muted, #8b949e)',
 pointerEvents: 'none',
 fontSize: '10px',
 opacity: 0.8,
 }}
 >
 ▼
 </div>
 </div>
 </div>

 {}
 </div>

 {}
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 {}
 <button
 onClick={handleClearTerminal}
 aria-label="New terminal session"
 title="New session (reconnect)"
 style={{
 background: 'transparent',
 border: 'none',
 color: 'var(--syn-text-muted, #8b949e)',
 cursor: 'pointer',
 padding: '4px',
 borderRadius: '4px',
 display: 'flex',
 alignItems: 'center',
 transition: 'var(--syn-transition-medium)',
 }}
 onMouseEnter={e => {
 e.currentTarget.style.color = 'var(--syn-text-primary, #d4d4d4)';
 e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-interaction-hover, rgba(255,255,255,0.08)) 70%, transparent)';
 }}
 onMouseLeave={e => {
 e.currentTarget.style.color = 'var(--syn-text-muted, #8b949e)';
 e.currentTarget.style.background = 'transparent';
 }}
 >
 <RotateCcw size={14} />
 </button>

 {}
 <button
 onClick={handleToggleMaximize}
 onContextMenu={e => {
 e.preventDefault();
 handleToggleMinimize();
 }}
 aria-label={isMinimized ? 'Restore terminal size' : isMaximized ? 'Restore terminal size' : 'Maximize terminal'}
 title={isMinimized ? 'Restore Size' : isMaximized ? 'Restore Size' : 'Maximize'}
 style={{
 background: 'transparent',
 border: 'none',
 color: 'var(--syn-text-muted, #8b949e)',
 cursor: 'pointer',
 padding: '4px',
 borderRadius: '4px',
 display: 'flex',
 alignItems: 'center',
 transition: 'var(--syn-transition-medium)',
 }}
 onMouseEnter={e => {
 e.currentTarget.style.color = 'var(--syn-text-primary, #d4d4d4)';
 e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-interaction-hover, rgba(255,255,255,0.08)) 70%, transparent)';
 }}
 onMouseLeave={e => {
 e.currentTarget.style.color = 'var(--syn-text-muted, #8b949e)';
 e.currentTarget.style.background = 'transparent';
 }}
 >
 {isMinimized ? (
 <Minimize2 size={14} style={{ transform: 'rotate(180deg)' }} />
 ) : isMaximized ? (
 <Minimize2 size={14} />
 ) : (
 <Maximize2 size={14} />
 )}
 </button>

 {}
 {onClose ? <button
 onClick={onClose}
 aria-label="Close terminal"
 title="Close terminal"
 style={{
 background: 'transparent',
 border: 'none',
 color: 'var(--syn-text-muted, #8b949e)',
 cursor: 'pointer',
 padding: '4px',
 borderRadius: '4px',
 display: 'flex',
 alignItems: 'center',
 transition: 'var(--syn-transition-medium)',
 }}
 onMouseEnter={e => {
 e.currentTarget.style.color = 'var(--syn-status-error, #ef4444)';
 e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-status-error, #ef4444) 18%, transparent)';
 }}
 onMouseLeave={e => {
 e.currentTarget.style.color = 'var(--syn-text-muted, #8b949e)';
 e.currentTarget.style.background = 'transparent';
 }}
 >
 <X size={14} />
 </button> : null}
 </div>
 </div>

 {}
 {!isUltraCompact && (
 <XTermTerminal
 key={`xterm-${currentShell}-${xtermKey}`}
 shell={currentShell}
 onReconnect={() => setXtermKey(k => k + 1)}
 />
 )}

 {}
 <style>
 {`
 @keyframes spin {
 0% { transform: rotate(0deg); }
 100% { transform: rotate(360deg); }
 }


 .syn-terminal-container {
 --terminal-focus-ring-color: var(--syn-border-focus, rgba(96, 165, 250, 0.85));
 --terminal-focus-ring-width: var(--ide-focus-width, 1px);
 --terminal-focus-shadow: var(--ide-focus-shadow, 0 0 0 2px color-mix(in srgb, var(--syn-border-focus, #60a5fa) 38%, transparent));
 }


 .syn-terminal-container button:focus-visible {
 outline: var(--terminal-focus-ring-width) solid var(--terminal-focus-ring-color) !important;
 outline-offset: 2px !important;
 box-shadow: var(--terminal-focus-shadow) !important;
 }

 .syn-terminal-container button:focus:not(:focus-visible) {
 outline: none !important;
 box-shadow: none !important;
 }


 .syn-terminal-container button[title="Clear terminal"]:hover,
 .syn-terminal-container button[title="Maximize"]:hover,
 .syn-terminal-container button[title="Restore"]:hover,
 .syn-terminal-container button[title="Close terminal"]:hover,
 .syn-terminal-container button[title="Copy command"]:hover {
 background: #1A1A1A !important;
 }


 .terminal-shell-select:hover {
 background: #121212 !important;
 }


 .terminal-shell-select {
 position: relative;
 }


 .terminal-shell-select::-ms-expand {
 display: none;
 }

 .terminal-shell-select:focus {
 border-color: color-mix(in srgb, var(--syn-border-active, #60a5fa) 55%, transparent) !important;
 }

 .terminal-shell-select:focus-visible {
 border-color: var(--terminal-focus-ring-color) !important;
 box-shadow: var(--terminal-focus-shadow) !important;
 outline: var(--terminal-focus-ring-width) solid var(--terminal-focus-ring-color) !important;
 outline-offset: 2px !important;
 }

 .terminal-shell-select:focus:not(:focus-visible) {
 box-shadow: none !important;
 outline: none !important;
 }


 .terminal-shell-select option {
 background: var(--syn-surface-editor, #111827) !important;
 color: var(--syn-text-secondary, #b4b4b4) !important;
 padding: 12px 16px !important;
 border: none !important;
 font-weight: 500 !important;
 font-size: 12px !important;
 margin: 0 !important;
 }

 .terminal-shell-select option:hover {
 background: var(--syn-surface-elevated, #1a1d24) !important;
 color: var(--syn-text-primary, #d4d4d4) !important;
 border: none !important;
 }

 .terminal-shell-select option:checked,
 .terminal-shell-select option:selected {
 background: color-mix(in srgb, var(--syn-interaction-selected, rgba(96,165,250,0.18)) 55%, var(--syn-surface-panel, #121212)) !important;
 color: var(--syn-text-primary, #d4d4d4) !important;
 font-weight: 600 !important;
 border: none !important;
 }


 /* Terminal scrollbar: uses .syn-scrollbar-accent globally */
 .syn-terminal-container,
 .syn-terminal-container * {
 scrollbar-width: thin;
 scrollbar-color: color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 42%, transparent) transparent;
 }
 .syn-terminal-container::-webkit-scrollbar,
 .syn-terminal-container *::-webkit-scrollbar {
 width: 8px;
 height: 8px;
 }
 .syn-terminal-container::-webkit-scrollbar-thumb,
 .syn-terminal-container *::-webkit-scrollbar-thumb {
 background: color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 42%, transparent);
 border-radius: 4px;
 }
 .syn-terminal-container::-webkit-scrollbar-thumb:hover,
 .syn-terminal-container *::-webkit-scrollbar-thumb:hover {
 background: color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 62%, transparent);
 }
 .syn-terminal-container::-webkit-scrollbar-track,
 .syn-terminal-container *::-webkit-scrollbar-track {
 background: transparent;
 }


 @-moz-document url-prefix() {
 .terminal-shell-select {
 background: var(--syn-surface-editor, #111827) !important;
 color: var(--syn-text-secondary, #b4b4b4) !important;
 border: 1px solid var(--syn-border-subtle, rgba(255,255,255,0.12)) !important;
 }

 .terminal-shell-select option {
 background: var(--syn-surface-editor, #111827) !important;
 color: var(--syn-text-secondary, #b4b4b4) !important;
 border: none !important;
 box-shadow: none !important;
 }

 .terminal-shell-select option:hover,
 .terminal-shell-select option:focus {
 background: var(--syn-surface-elevated, #1a1d24) !important;
 color: var(--syn-text-primary, #d4d4d4) !important;
 border: none !important;
 box-shadow: none !important;
 }

 .terminal-shell-select option:checked {
 background: color-mix(in srgb, var(--syn-interaction-selected, rgba(96,165,250,0.18)) 55%, var(--syn-surface-panel, #121212)) !important;
 color: var(--syn-text-primary, #d4d4d4) !important;
 border: none !important;
 box-shadow: none !important;
 }

 .terminal-shell-select:focus {
 border: 1px solid color-mix(in srgb, var(--syn-border-active, #60a5fa) 55%, transparent) !important;
 }

 .terminal-shell-select:focus-visible {
 border: 1px solid var(--terminal-focus-ring-color) !important;
 box-shadow: var(--terminal-focus-shadow) !important;
 outline: var(--terminal-focus-ring-width) solid var(--terminal-focus-ring-color) !important;
 outline-offset: 2px !important;
 }
 }


 @media screen and (-webkit-min-device-pixel-ratio:0) {
 .terminal-shell-select {
 background: var(--syn-surface-editor, #111827) !important;
 border: 1px solid var(--syn-border-subtle, rgba(255,255,255,0.12)) !important;
 -webkit-appearance: none !important;
 appearance: none !important;
 }

 .terminal-shell-select:focus {
 border-color: color-mix(in srgb, var(--syn-border-active, #60a5fa) 55%, transparent) !important;
 }

 .terminal-shell-select:focus-visible {
 border-color: var(--terminal-focus-ring-color) !important;
 box-shadow: var(--terminal-focus-shadow) !important;
 outline: var(--terminal-focus-ring-width) solid var(--terminal-focus-ring-color) !important;
 outline-offset: 2px !important;
 }

 .terminal-shell-select option {
 background: var(--syn-surface-editor, #111827) !important;
 color: var(--syn-text-secondary, #b4b4b4) !important;
 border: none !important;
 box-shadow: none !important;
 }


 .syn-terminal-container button[title="Clear terminal"]:hover,
 .syn-terminal-container button[title="Maximize"]:hover,
 .syn-terminal-container button[title="Restore"]:hover,
 .syn-terminal-container button[title="Close terminal"]:hover,
 .syn-terminal-container button[title="Copy command"]:hover {
 background: #1A1A1A !important;
 }


 .terminal-shell-select:hover {
 background: #121212 !important;
 }
 }


 @supports (-ms-ime-align: auto) {
 .terminal-shell-select {
 background: #0d0d0d !important;
 border: 1px solid #2A2A2A !important;
 }
 }


 .terminal-shell-select::-webkit-scrollbar {
 width: 8px;
 background: transparent;
 }

 .terminal-shell-select::-webkit-scrollbar-track {
 background: transparent;
 border-radius: 4px;
 }

 .terminal-shell-select::-webkit-scrollbar-thumb {
 background: color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 42%, transparent);
 border-radius: 4px;
 }

 .terminal-shell-select::-webkit-scrollbar-thumb:hover {
 background: color-mix(in srgb, var(--syn-interaction-active, #60a5fa) 62%, transparent);
 }


 .terminal-shell-select:focus-visible {
 border-color: var(--terminal-focus-ring-color) !important;
 box-shadow: var(--terminal-focus-shadow) !important;
 outline: var(--terminal-focus-ring-width) solid var(--terminal-focus-ring-color) !important;
 outline-offset: 2px !important;
 }

 @media (forced-colors: active) {
 .terminal-shell-select,
 .syn-terminal-container button {
 forced-color-adjust: auto;
 }

 .terminal-shell-select:focus-visible,
 .syn-terminal-container button:focus-visible {
 border-color: Highlight !important;
 outline: 2px solid Highlight !important;
 outline-offset: 2px !important;
 box-shadow: none !important;
 }
 }
 `}
 </style>
 </div>
 );

 return terminalContainer;
};
