import React from 'react';

type LazyModule<T extends React.ComponentType<any>> = Promise<{ default: T }>;

type LazyRetryOptions = {
  retries?: number;
  delayMs?: number;
  recoveryPath?: string;
  recoveryAttempts?: number;
};

type RecoveryProbeOptions = {
  recoveryPath?: string;
  attempts?: number;
  delayMs?: number;
};

const RETRYABLE_IMPORT_PATTERNS = [
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'unable to preload css',
  'failed to load resource',
  'preload css',
  'outdated optimize dep',
  'loading chunk',
  'chunkloaderror',
  'err_connection_refused',
  'err_connection_reset',
  'networkerror',
];

const CHUNK_RECOVERY_RELOAD_KEY = 'synapse:chunk-recovery:reload-state';
const CHUNK_RECOVERY_RELOAD_MAX_ATTEMPTS = 2;
const CHUNK_RECOVERY_RELOAD_WINDOW_MS = 30_000;

type ChunkRecoveryReloadState = {
  count: number;
  lastTs: number;
};

function hasBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof fetch === 'function';
}

function resolveRecoveryUrl(recoveryPath = '/'): string | null {
  if (!hasBrowserRuntime()) {
    return null;
  }
  return new URL(recoveryPath, window.location.href).toString();
}

async function probeRecoveryUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function readChunkRecoveryReloadState(): ChunkRecoveryReloadState | null {
  if (!hasBrowserRuntime()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHUNK_RECOVERY_RELOAD_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ChunkRecoveryReloadState> | null;
    const count = parsed?.count;
    const lastTs = parsed?.lastTs;
    if (typeof count !== "number" || !Number.isFinite(count) || typeof lastTs !== "number" || !Number.isFinite(lastTs)) {
      return null;
    }

    return {
      count: Math.max(0, Math.floor(count)),
      lastTs,
    };
  } catch {
    return null;
  }
}

function writeChunkRecoveryReloadState(state: ChunkRecoveryReloadState) {
  if (!hasBrowserRuntime()) {
    return;
  }

  try {
    window.sessionStorage.setItem(CHUNK_RECOVERY_RELOAD_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}

export function clearChunkRecoveryReloadFlag() {
  if (!hasBrowserRuntime()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_RELOAD_KEY);
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}

export function consumeChunkRecoveryReloadAllowance(nowTs = Date.now()): boolean {
  if (!hasBrowserRuntime()) {
    return false;
  }

  const current = readChunkRecoveryReloadState();
  if (!current || (nowTs - current.lastTs) > CHUNK_RECOVERY_RELOAD_WINDOW_MS) {
    writeChunkRecoveryReloadState({ count: 1, lastTs: nowTs });
    return true;
  }

  if (current.count >= CHUNK_RECOVERY_RELOAD_MAX_ATTEMPTS) {
    return false;
  }

  writeChunkRecoveryReloadState({ count: current.count + 1, lastTs: nowTs });
  return true;
}

async function reloadAppOnceAfterChunkFailure(recoveryPath = '/'): Promise<boolean> {
  if (!hasBrowserRuntime()) {
    return false;
  }

  const recovered = await waitForImportRecovery({ recoveryPath, attempts: 4, delayMs: 500 });
  if (!recovered) {
    return false;
  }

  try {
    if (!consumeChunkRecoveryReloadAllowance()) {
      return false;
    }

    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function isRetryableDynamicImportError(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? error ?? '').toLowerCase();
  return RETRYABLE_IMPORT_PATTERNS.some((pattern) => message.includes(pattern));
}

export async function waitForImportRecovery(options: RecoveryProbeOptions = {}): Promise<boolean> {
  const {
    recoveryPath = '/',
    attempts = 3,
    delayMs = 400,
  } = options;

  const url = resolveRecoveryUrl(recoveryPath);
  if (!url) {
    return false;
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (online && await probeRecoveryUrl(url)) {
      return true;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs * (attempt + 1));
    }
  }

  return false;
}

export function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => LazyModule<T>,
  options: LazyRetryOptions = {},
): React.LazyExoticComponent<T> {
  const {
    retries = 2,
    delayMs = 350,
    recoveryPath = '/',
    recoveryAttempts = 3,
  } = options;

  return React.lazy(async () => {
    let attempt = 0;

    while (true) {
      try {
        const module = await importer();
        clearChunkRecoveryReloadFlag();
        return module;
      } catch (error) {
        const retryable = isRetryableDynamicImportError(error);
        if (!retryable) {
          throw error;
        }

        if (attempt >= retries) {
          const reloaded = await reloadAppOnceAfterChunkFailure(recoveryPath);
          if (reloaded) {
            return new Promise<{ default: T }>(() => {});
          }
          throw error;
        }

        attempt += 1;
        await waitForImportRecovery({ recoveryPath, attempts: recoveryAttempts, delayMs });
        await sleep(delayMs * attempt);
      }
    }
  });
}

type ChunkLoadBoundaryProps = React.PropsWithChildren<{
  compact?: boolean;
  title?: string;
  message?: string;
}>;

type ChunkLoadBoundaryState = {
  error: Error | null;
  nonce: number;
};

export class ChunkLoadBoundary extends React.Component<ChunkLoadBoundaryProps, ChunkLoadBoundaryState> {
  override state: ChunkLoadBoundaryState = {
    error: null,
    nonce: 0,
  };

  private recoveryIntervalId: number | null = null;

  private recoveryListener: (() => void) | null = null;

  private recoveryInFlight = false;

  private autoRetryCount = 0;

  private readonly autoRetryLimit = 3;

  override componentDidMount() {
    this.syncRecoveryWatchers();
  }

  override componentDidUpdate(_prevProps: ChunkLoadBoundaryProps, prevState: ChunkLoadBoundaryState) {
    if (prevState.error !== this.state.error) {
      if (!this.state.error) {
        this.autoRetryCount = 0;
      }
      this.syncRecoveryWatchers();
    }
  }

  override componentWillUnmount() {
    this.clearRecoveryWatchers();
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkLoadBoundaryState> {
    return { error };
  }

  private handleRetry = () => {
    clearChunkRecoveryReloadFlag();
    this.autoRetryCount = 0;
    this.setState((current) => ({ error: null, nonce: current.nonce + 1 }));
  };

  private tryAutoRecovery = async () => {
    if (!this.state.error || !isRetryableDynamicImportError(this.state.error) || this.recoveryInFlight) {
      return;
    }
    if (this.autoRetryCount >= this.autoRetryLimit) {
      return;
    }

    this.recoveryInFlight = true;
    const recovered = await waitForImportRecovery({ attempts: 1, delayMs: 0 });
    this.recoveryInFlight = false;

    if (!recovered) {
      return;
    }

    this.autoRetryCount += 1;
    this.setState((current) => ({ error: null, nonce: current.nonce + 1 }));
  };

  private clearRecoveryWatchers() {
    if (this.recoveryIntervalId !== null) {
      window.clearInterval(this.recoveryIntervalId);
      this.recoveryIntervalId = null;
    }
    if (this.recoveryListener) {
      this.recoveryListener();
      this.recoveryListener = null;
    }
  }

  private syncRecoveryWatchers() {
    this.clearRecoveryWatchers();

    if (!this.state.error || !isRetryableDynamicImportError(this.state.error) || typeof window === 'undefined') {
      return;
    }

    const onSignal = () => {
      void this.tryAutoRecovery();
    };

    window.addEventListener('online', onSignal);
    window.addEventListener('focus', onSignal);
    this.recoveryListener = () => {
      window.removeEventListener('online', onSignal);
      window.removeEventListener('focus', onSignal);
    };
    this.recoveryIntervalId = window.setInterval(onSignal, 2500);
    void this.tryAutoRecovery();
  }

  override render() {
    const { compact = false, title, message, children } = this.props;

    if (this.state.error) {
      const retryable = isRetryableDynamicImportError(this.state.error);
      const resolvedTitle = title ?? 'Panel could not be loaded';
      const resolvedMessage = message ?? (retryable
        ? 'A temporary module load failure occurred. The app will retry automatically when the asset host responds again.'
        : 'An unexpected panel error occurred. Reload the app if the problem persists.');

      return (
        <div
          style={{
            display: 'grid',
            gap: 10,
            padding: compact ? '16px' : '20px',
            borderRadius: 12,
            border: '1px solid rgba(245,158,11,0.24)',
            background: 'rgba(28,25,23,0.92)',
            color: '#f5f5f4',
          }}
        >
          <div style={{ fontSize: compact ? 14 : 16, fontWeight: 700 }}>{resolvedTitle}</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(245,245,244,0.78)' }}>{resolvedMessage}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {retryable ? (
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  border: '1px solid rgba(245,158,11,0.6)',
                  background: 'rgba(245,158,11,0.16)',
                  color: '#fbbf24',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Retry panel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                clearChunkRecoveryReloadFlag();
                window.location.reload();
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
                color: '#f5f5f4',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.nonce}>{children}</React.Fragment>;
  }
}