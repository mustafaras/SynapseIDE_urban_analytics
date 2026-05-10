import React from 'react';
import { flags } from '@/config/flags';
import { logger } from '@/lib/logger';
import { reportError } from '@/lib/error-bus';

export class AppErrorBoundary extends React.Component<React.PropsWithChildren> {
  override state = { hasError: false } as { hasError: boolean };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: any, info: any) {
    if (flags.aiTrace) {
      logger.error('[ERROR_BOUNDARY]', String(error?.message || error), 'info=', String(info?.componentStack || ''));
    }
    try { reportError({ source: 'ui', code: 'unknown', message: String(error?.message || error) }); } catch {}
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          data-app-shell="root"
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '100vh',
            padding: '24px',
            background: 'var(--syn-bg-root)',
            color: 'var(--syn-text-primary)',
          }}
        >
          <div
            data-app-shell="frame"
            style={{
              width: 'min(560px, 100%)',
              border: '1px solid var(--syn-border-default)',
              borderRadius: '16px',
              background: 'var(--syn-bg-surface-1)',
              boxShadow: 'var(--shadow-lg)',
              padding: '20px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', lineHeight: 1.4 }}>Something went wrong</h2>
            <p style={{ margin: '10px 0 0', color: 'var(--syn-text-muted)', lineHeight: 1.6 }}>
              The app hit an unexpected error. You can refresh to recover.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                border: '1px solid var(--syn-accent-primary)',
                background: 'var(--syn-accent-primary)',
                color: '#121212',
                borderRadius: '10px',
                padding: '8px 12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}

export function installGlobalRejectionHandler() {
  if (!('window' in globalThis)) return;
  const startedAt = Date.now();
  const QUIET_MS = 1500;
  const shouldIgnore = (raw: unknown) => {
    const msg = String((raw as any)?.message || raw || '').toLowerCase();
    if (!msg) return true;

    if (msg.includes('resizeobserver')) return true;
    if (msg.includes('resizeobserver loop')) return true;
    if (msg.includes('non-error promise rejection')) return true;
    if (msg.includes('aborterror')) return true;
    if (msg.includes('networkerror') && msg.includes('fetch')) return true;
    if (msg.includes('script error')) return true;
    return false;
  };
  window.addEventListener('unhandledrejection', (e) => {
  const reason = (e as any)?.reason;
  if (flags.aiTrace) logger.error('[UNHANDLED_REJECTION]', String(reason?.message || reason || e));
  if (Date.now() - startedAt < QUIET_MS) return;
  if (shouldIgnore(reason)) return;
  try { reportError({ source: 'ui', code: 'unknown', message: String(reason?.message || reason || 'Unhandled rejection') }); } catch {}
  });
  window.addEventListener('error', (e: ErrorEvent) => {
  if (flags.aiTrace) logger.error('[WINDOW_ERROR]', String(e?.message || e));
  if (Date.now() - startedAt < QUIET_MS) return;
  if (shouldIgnore(e?.message)) return;
  try { reportError({ source: 'ui', code: 'unknown', message: String(e?.message || 'Window error') }); } catch {}
  });
}
