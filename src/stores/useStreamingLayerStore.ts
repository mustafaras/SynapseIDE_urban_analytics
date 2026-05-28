/**
 * Prompt 44 — Zustand store for per-layer streaming state.
 * Tracks in-view feature counts, fetch state, and debounced extent queries.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  StreamingLayerConfig,
  StreamingLayerState,
  StreamingStrategy,
} from "../services/map/streaming/VectorStreamingService";
import {
  createStreamingLayerState,
  debounce,
  queryIndexedLayer,
  resolveStreamingStrategy,
} from "../services/map/streaming/VectorStreamingService";
import type { ViewportExtent } from "../services/map/streaming/ExtentQueryEngine";
import { extentChanged } from "../services/map/streaming/ExtentQueryEngine";

/* ------------------------------------------------------------------ */
/*  Store shape                                                         */
/* ------------------------------------------------------------------ */

export interface StreamingLayerStoreState {
  /** Per-layer streaming state keyed by layerId. */
  layers: Record<string, StreamingLayerState>;
  /** Per-layer streaming configs (index, url, format). */
  configs: Record<string, StreamingLayerConfig>;

  /** Register a streaming layer. */
  registerStreamingLayer: (config: StreamingLayerConfig) => void;

  /** Remove a streaming layer and clean up. */
  unregisterStreamingLayer: (layerId: string) => void;

  /**
   * Trigger an extent query for a layer.
   * For rbush-index layers this is synchronous;
   * for flatgeobuf layers this schedules an async fetch (debounced).
   */
  queryLayerByExtent: (layerId: string, extent: ViewportExtent) => void;

  /** Mark fetching started (used by async flatgeobuf path). */
  _setFetching: (layerId: string, fetching: boolean) => void;

  /** Apply a completed extent query result to the store. */
  _applyExtentResult: (params: {
    layerId: string;
    features: StreamingLayerState["featuresInView"];
    inViewCount: number;
    totalCount: number | null;
    extent: ViewportExtent;
  }) => void;

  /** Record a fetch error. */
  _setFetchError: (layerId: string, error: string) => void;

  /** Get the streaming state for a layer. */
  getStreamingState: (layerId: string) => StreamingLayerState | undefined;

  /** Get the strategy for a layer. */
  getStrategy: (layerId: string) => StreamingStrategy | undefined;
}

/* ------------------------------------------------------------------ */
/*  Debounced fetch registry (module-level — not in Zustand state)     */
/* ------------------------------------------------------------------ */

type DebouncedQuery = { cancel: () => void };
const debouncedQueries = new Map<string, DebouncedQuery>();

const DEBOUNCE_MS = 200;

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

export const useStreamingLayerStore = create<StreamingLayerStoreState>()(
  immer((set, get) => ({
    layers: {},
    configs: {},

    registerStreamingLayer: (config) => {
      const strategy = resolveStreamingStrategy(config.format);
      set((state) => {
        state.configs[config.layerId] = config;
        state.layers[config.layerId] = createStreamingLayerState(config.layerId, strategy);
      });
    },

    unregisterStreamingLayer: (layerId) => {
      debouncedQueries.get(layerId)?.cancel();
      debouncedQueries.delete(layerId);
      set((state) => {
        delete state.configs[layerId];
        delete state.layers[layerId];
      });
    },

    queryLayerByExtent: (layerId, extent) => {
      const { configs } = get();
      const config = configs[layerId];
      if (!config) return;

      const currentLayer = get().layers[layerId];
      if (currentLayer?.lastExtent && !extentChanged(currentLayer.lastExtent, extent)) {
        return; // extent unchanged — skip query
      }

      if (config.format === "flatgeobuf" && config.url) {
        // Async FlatGeobuf path: debounce to avoid fetching on every pan frame.
        let dq = debouncedQueries.get(layerId);
        if (!dq) {
          const fn = debounce(async (ext: ViewportExtent) => {
            get()._setFetching(layerId, true);
            try {
              const { queryFlatGeobufByExtent } = await import(
                "../services/map/streaming/VectorStreamingService"
              );
              const result = await queryFlatGeobufByExtent(config.url!, ext);
              get()._applyExtentResult({
                layerId,
                features: result.features,
                inViewCount: result.inViewCount,
                totalCount: result.totalCount,
                extent: ext,
              });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              get()._setFetchError(layerId, msg);
            } finally {
              get()._setFetching(layerId, false);
            }
          }, DEBOUNCE_MS);
          debouncedQueries.set(layerId, fn);
          dq = fn;
        }
        (dq as ReturnType<typeof debounce<[ViewportExtent]>>)(extent);
      } else {
        // Synchronous rbush-index path.
        const result = queryIndexedLayer(config, extent);
        get()._applyExtentResult({
          layerId,
          features: result.features,
          inViewCount: result.inViewCount,
          totalCount: result.totalCount,
          extent,
        });
      }
    },

    _setFetching: (layerId, fetching) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (layer) layer.fetching = fetching;
      });
    },

    _applyExtentResult: ({ layerId, features, inViewCount, totalCount, extent }) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (!layer) return;
        layer.featuresInView = features;
        layer.inViewCount = inViewCount;
        layer.totalCount = totalCount;
        layer.lastExtent = extent;
        layer.lastFetchedAt = new Date().toISOString();
        layer.fetchError = null;
        layer.fetching = false;
      });
    },

    _setFetchError: (layerId, error) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (layer) {
          layer.fetchError = error;
          layer.fetching = false;
        }
      });
    },

    getStreamingState: (layerId) => get().layers[layerId],

    getStrategy: (layerId) => get().layers[layerId]?.strategy,
  })),
);
