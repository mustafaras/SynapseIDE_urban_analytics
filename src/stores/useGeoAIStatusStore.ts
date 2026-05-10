import { create } from 'zustand';
import { sbGeoAiError, sbGeoAiIdle, sbGeoAiInferring, sbGeoAiLoading, sbGeoAiReady } from '@/components/StatusBar/statusBridge';

export type GeoAIRuntimeState = 'idle' | 'loading' | 'ready' | 'inferring' | 'error';
export type GeoAIBackend = 'wasm' | 'webgpu';

type GeoAIStatusStore = {
  state: GeoAIRuntimeState;
  loadedModels: number;
  memoryUsedMB: number;
  backend: GeoAIBackend;
  lastEngine: string | undefined;
  lastMessage: string | undefined;
  lastUpdatedAt: number | undefined;
  reportLoading: (message?: string, backend?: GeoAIBackend) => void;
  reportReady: (payload: {
    loadedModels: number;
    memoryUsedMB: number;
    backend?: GeoAIBackend;
    engine?: string;
    message?: string;
  }) => void;
  reportInferring: (message?: string) => void;
  reportError: (message: string, backend?: GeoAIBackend) => void;
  reset: () => void;
};

const initialState = {
  state: 'idle' as const,
  loadedModels: 0,
  memoryUsedMB: 0,
  backend: 'wasm' as const,
  lastEngine: undefined,
  lastMessage: undefined,
  lastUpdatedAt: undefined,
};

export const useGeoAIStatusStore = create<GeoAIStatusStore>((set) => ({
  ...initialState,
  reportLoading(message, backend = 'wasm') {
    sbGeoAiLoading();
    set((state) => ({
      ...state,
      state: 'loading',
      backend,
      lastMessage: message,
      lastUpdatedAt: Date.now(),
    }));
  },
  reportReady(payload) {
    const backend = payload.backend ?? 'wasm';
    sbGeoAiReady(payload.loadedModels, payload.memoryUsedMB, backend);
    set((state) => ({
      ...state,
      state: 'ready',
      loadedModels: payload.loadedModels,
      memoryUsedMB: payload.memoryUsedMB,
      backend,
      lastEngine: payload.engine ?? state.lastEngine,
      lastMessage: payload.message,
      lastUpdatedAt: Date.now(),
    }));
  },
  reportInferring(message) {
    sbGeoAiInferring();
    set((state) => ({
      ...state,
      state: 'inferring',
      lastMessage: message,
      lastUpdatedAt: Date.now(),
    }));
  },
  reportError(message, backend = 'wasm') {
    sbGeoAiError();
    set((state) => ({
      ...state,
      state: 'error',
      backend,
      lastMessage: message,
      lastUpdatedAt: Date.now(),
    }));
  },
  reset() {
    sbGeoAiIdle();
    set({ ...initialState, lastUpdatedAt: Date.now() });
  },
}));
