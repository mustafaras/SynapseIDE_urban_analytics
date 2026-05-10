import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  fileName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

const CSS = `
@keyframes ucd-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ucd-panel-in {
  from { opacity: 0; transform: scale(0.90) translateY(6px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}

.ucd-backdrop {
  animation: ucd-backdrop-in 160ms ease-out both;
}
.ucd-panel {
  animation: ucd-panel-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.ucd-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
  font-family: inherit;
  outline: none;
  white-space: nowrap;
}
.ucd-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(245,158,11,0.55);
}

/* Cancel — neutral ghost */
.ucd-btn-cancel {
  background: transparent;
  color: #A8A29E;
  border: 1px solid rgba(255,255,255,0.10);
}
.ucd-btn-cancel:hover {
  background: rgba(255,255,255,0.06);
  color: #E8E8E8;
  border-color: rgba(255,255,255,0.18);
}
.ucd-btn-cancel:active { background: rgba(255,255,255,0.10); }

/* Don't Save — danger ghost */
.ucd-btn-discard {
  background: transparent;
  color: #EF4444;
  border: 1px solid rgba(239,68,68,0.30);
}
.ucd-btn-discard:hover {
  background: rgba(239,68,68,0.10);
  border-color: rgba(239,68,68,0.55);
}
.ucd-btn-discard:active { background: rgba(239,68,68,0.18); }

/* Save — gold filled primary */
.ucd-btn-save {
  background: #F59E0B;
  color: #0E0E0E;
  border: 1px solid #F59E0B;
  font-weight: 600;
}
.ucd-btn-save:hover {
  background: #D97706;
  border-color: #D97706;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.22);
}
.ucd-btn-save:active { background: #B45309; border-color: #B45309; }
`;

let _styleInjected = false;
function ensureStyles() {
  if (_styleInjected) return;
  _styleInjected = true;
  const el = document.createElement('style');
  el.dataset['ucd'] = '1';
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function UnsavedChangesDialog({
  fileName,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps): React.ReactElement {
  ensureStyles();

  const saveRef   = useRef<HTMLButtonElement>(null);
  const discardRef= useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  // Focus Save (primary action) on mount; restore focus on unmount
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    saveRef.current?.focus();
    return () => { prev?.focus(); };
  }, []);

  // Focus trap: Tab / Shift+Tab cycle within the three buttons
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { onCancel(); return; }
    if (e.key !== 'Tab') return;

    const focusable = [cancelRef.current, discardRef.current, saveRef.current].filter(Boolean) as HTMLButtonElement[];
    const idx = focusable.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;

    e.preventDefault();
    const next = e.shiftKey
      ? focusable[(idx - 1 + focusable.length) % focusable.length]
      : focusable[(idx + 1) % focusable.length];
    next.focus();
  }, [onCancel]);

  return createPortal(
    <div
      className="ucd-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="ucd-title"
      aria-describedby="ucd-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        className="ucd-panel"
        style={{
          background: '#1C1C1C',
          border: '1px solid rgba(255,255,255,0.09)',
          borderTop: '2px solid #F59E0B',
          borderRadius: 10,
          boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.3)',
          padding: '24px 24px 20px',
          width: 380,
          fontFamily: 'var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
        }}
      >
        {/* Header row: icon + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={17} color="#F59E0B" strokeWidth={2.2} />
          </div>
          <div style={{ paddingTop: 2 }}>
            <h3
              id="ucd-title"
              style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F0EDE8', lineHeight: 1.3 }}
            >
              Save changes?
            </h3>
            <p
              id="ucd-desc"
              style={{ margin: '4px 0 0', fontSize: 12.5, color: '#7A7572', lineHeight: 1.45 }}
            >
              Your changes will be lost if you don't save.
            </p>
          </div>
        </div>

        {/* File name chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 10px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#F59E0B',
              flexShrink: 0,
              boxShadow: '0 0 5px rgba(245,158,11,0.6)',
            }}
          />
          <span
            style={{
              fontSize: 12.5,
              color: '#C9C5BF',
              fontFamily: '"JetBrains Mono", "Cascadia Code", ui-monospace, monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={fileName}
          >
            {fileName}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button ref={cancelRef}  className="ucd-btn ucd-btn-cancel"  onClick={onCancel}>
            Cancel
          </button>
          <button ref={discardRef} className="ucd-btn ucd-btn-discard" onClick={onDiscard}>
            Don't Save
          </button>
          <button ref={saveRef}    className="ucd-btn ucd-btn-save"    onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
