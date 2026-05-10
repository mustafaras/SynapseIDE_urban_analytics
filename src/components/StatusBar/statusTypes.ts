export type StatusSnapshot = {

  filePath?: string;
  fileName?: string;
  ext?: string;
  formatLabel?: string;
  language?: string;
  eol?: 'LF' | 'CRLF';
  encoding?: string;
  tabSize?: number;
  indentation?: 'spaces' | 'tabs';
  cursor?: { line: number; column: number };
  selection?: { chars: number; lines: number };
  counts?: { lines: number; words: number; chars: number; sizeBytes?: number };
  diagnostics?: { errors: number; warnings: number; infos: number };
  dirty?: boolean;

  git?: { branch?: string; ahead?: number; behind?: number; changed?: number; stashed?: number };

  liveServer?: { on: boolean; port?: number };

  online?: boolean;
  collaboration?: {
    state: 'connected' | 'paused' | 'reconnecting' | 'offline';
    collaborators: number;
    pendingChanges: number;
    lastSyncedAt?: number;
  };
  cpu?: number;
  mem?: number;

  ai?: {
    state: 'idle' | 'thinking' | 'responded' | 'error';
    lastAction?: string;
    latencyMs?: number;
  };

  geoai?: {
    state: 'idle' | 'loading' | 'ready' | 'inferring' | 'error';
    loadedModels: number;
    memoryUsedMB: number;
    backend: 'wasm' | 'webgpu';
  };

  streaming?: {
    state: 'idle' | 'connecting' | 'streaming' | 'paused' | 'error';
    connector: 'replay' | 'websocket' | 'mqtt';
    received: number;
    messagesPerMinute: number;
    lastTopic?: string;
  };

  spatialIndex?: {
    state: 'idle' | 'building' | 'ready' | 'querying' | 'fallback' | 'error';
    backend: 'wasm' | 'javascript';
    wasmEnabled: boolean;
    records: number;
    lastQueryKind?: 'bbox' | 'nearest' | 'benchmark';
    lastQueryMs?: number;
    lastResultCount?: number;
    benchmarkSpeedup?: number;
  };

  now?: number;
};
