import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sbSpatialIndex } from '@/components/StatusBar/statusBridge';
import type { StatusSnapshot } from '@/components/StatusBar/statusTypes';

export type SpatialIndexBackend = 'wasm' | 'javascript';
export type SpatialIndexState = 'idle' | 'building' | 'ready' | 'querying' | 'fallback' | 'error';
export type SpatialIndexQueryKind = 'bbox' | 'nearest' | 'benchmark';

export interface SpatialIndexBenchmarkSnapshot {
  datasetSize: number;
  baselineMs: number;
  backendMs: number;
  speedup: number;
  queryCount: number;
}

type SpatialIndexRuntime = {
  state: SpatialIndexState;
  backend: SpatialIndexBackend;
  records: number;
  lastQueryMs: number | undefined;
  lastQueryKind: SpatialIndexQueryKind | undefined;
  lastResultCount: number | undefined;
  lastSpeedup: number | undefined;
  fallbackReason: string | undefined;
};

type SpatialIndexStore = SpatialIndexRuntime & {
  enableWasm: boolean;
  benchmark: SpatialIndexBenchmarkSnapshot | undefined;
  setEnableWasm: (enabled: boolean) => void;
  updateRuntime: (patch: Partial<SpatialIndexRuntime>) => void;
  reportQuery: (patch: {
    backend: SpatialIndexBackend;
    records: number;
    elapsedMs: number;
    kind: SpatialIndexQueryKind;
    resultCount: number;
    state: SpatialIndexState | undefined;
    fallbackReason: string | undefined;
  }) => void;
  reportBenchmark: (snapshot: SpatialIndexBenchmarkSnapshot, backend: SpatialIndexBackend, records: number) => void;
  reportError: (message: string, backend?: SpatialIndexBackend) => void;
  resetRuntime: () => void;
};

const initialRuntime: SpatialIndexRuntime = {
  state: 'idle',
  backend: 'wasm',
  records: 0,
  lastQueryMs: undefined,
  lastQueryKind: undefined,
  lastResultCount: undefined,
  lastSpeedup: undefined,
  fallbackReason: undefined,
};

function syncStatus(state: Pick<SpatialIndexStore, 'enableWasm' | 'state' | 'backend' | 'records' | 'lastQueryMs' | 'lastQueryKind' | 'lastResultCount' | 'lastSpeedup'>) {
  const update: Partial<NonNullable<StatusSnapshot['spatialIndex']>> = {
    wasmEnabled: state.enableWasm,
    state: state.state,
    backend: state.backend,
    records: state.records,
  };
  if (state.lastQueryMs !== undefined) {
    update.lastQueryMs = state.lastQueryMs;
  }
  if (state.lastQueryKind !== undefined) {
    update.lastQueryKind = state.lastQueryKind;
  }
  if (state.lastResultCount !== undefined) {
    update.lastResultCount = state.lastResultCount;
  }
  if (state.lastSpeedup !== undefined) {
    update.benchmarkSpeedup = state.lastSpeedup;
  }
  sbSpatialIndex(update);
}

export const useSpatialIndexStore = create<SpatialIndexStore>()(
  persist(
    (set) => ({
      enableWasm: true,
      benchmark: undefined,
      ...initialRuntime,
      setEnableWasm(enabled) {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            enableWasm: enabled,
            state: enabled ? 'idle' : 'fallback',
            backend: enabled ? 'wasm' : 'javascript',
            fallbackReason: undefined,
          };
          syncStatus(next);
          return next;
        });
      },
      updateRuntime(patch) {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            ...patch,
          };
          syncStatus(next);
          return next;
        });
      },
      reportQuery(patch) {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            state: patch.state ?? (patch.backend === 'wasm' ? 'ready' : state.enableWasm ? 'fallback' : 'ready'),
            backend: patch.backend,
            records: patch.records,
            lastQueryMs: patch.elapsedMs,
            lastQueryKind: patch.kind,
            lastResultCount: patch.resultCount,
            fallbackReason: patch.fallbackReason,
          };
          syncStatus(next);
          return next;
        });
      },
      reportBenchmark(snapshot, backend, records) {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            benchmark: snapshot,
            backend,
            records,
            state: backend === 'wasm' ? 'ready' : state.enableWasm ? 'fallback' : 'ready',
            lastQueryKind: 'benchmark',
            lastQueryMs: snapshot.backendMs,
            lastResultCount: snapshot.queryCount,
            lastSpeedup: snapshot.speedup,
          };
          syncStatus(next);
          return next;
        });
      },
      reportError(message, backend = 'javascript') {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            state: 'error',
            backend,
            fallbackReason: message,
          };
          syncStatus(next);
          return next;
        });
      },
      resetRuntime() {
        set((state) => {
          const next: SpatialIndexStore = {
            ...state,
            ...initialRuntime,
            backend: state.enableWasm ? 'wasm' : 'javascript',
            state: 'idle',
            benchmark: undefined,
          };
          syncStatus(next);
          return next;
        });
      },
    }),
    {
      name: 'synapse.spatial-index.settings.v1',
      partialize: (state) => ({ enableWasm: state.enableWasm }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.updateRuntime({
          ...initialRuntime,
          state: state.enableWasm ? 'idle' : 'fallback',
          backend: state.enableWasm ? 'wasm' : 'javascript',
          records: 0,
        });
      },
    },
  ),
);