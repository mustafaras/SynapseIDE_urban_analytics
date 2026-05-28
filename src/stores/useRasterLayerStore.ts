/**
 * Prompt 45 — Zustand store for per-layer raster state.
 * Tracks inspection results, band selection, render config, and QA.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GeoTiffInspection, RasterLayerRenderConfig } from "../services/map/raster/GeoTiffParser";
import type { BandHistogramResult } from "../services/map/raster/RasterHistogramEngine";
import type { LayerScientificQAMetadata } from "@/centerpanel/components/map/mapTypes";

/* ------------------------------------------------------------------ */
/*  Per-layer raster state                                              */
/* ------------------------------------------------------------------ */

export interface RasterLayerState {
  layerId: string;
  /** Set once the GeoTIFF has been parsed. */
  inspection: GeoTiffInspection | null;
  /** QA assessment results. */
  qa: LayerScientificQAMetadata | null;
  /** Render configuration (band selection, color ramp, opacity). */
  renderConfig: RasterLayerRenderConfig;
  /** Histogram for the currently selected band. */
  histogram: BandHistogramResult | null;
  /** True while parsing is in progress. */
  parsing: boolean;
  /** Set when parsing produced an error. */
  parseError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Store shape                                                         */
/* ------------------------------------------------------------------ */

export interface RasterLayerStoreState {
  layers: Record<string, RasterLayerState>;

  /** Register a raster layer (called before parsing begins). */
  registerRasterLayer: (layerId: string, renderConfig: RasterLayerRenderConfig) => void;

  /** Remove a raster layer. */
  unregisterRasterLayer: (layerId: string) => void;

  /** Apply a completed inspection result. */
  applyInspection: (params: {
    layerId: string;
    inspection: GeoTiffInspection;
    qa: LayerScientificQAMetadata;
    histogram: BandHistogramResult;
  }) => void;

  /** Update the render config (band, ramp, opacity). */
  updateRenderConfig: (layerId: string, patch: Partial<RasterLayerRenderConfig>) => void;

  /** Update the histogram for the selected band. */
  updateHistogram: (layerId: string, histogram: BandHistogramResult) => void;

  /** Mark parsing started. */
  setParsing: (layerId: string, parsing: boolean) => void;

  /** Record a parse error. */
  setParseError: (layerId: string, error: string) => void;

  /** Get raster state for a layer. */
  getRasterState: (layerId: string) => RasterLayerState | undefined;
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

import { defaultRasterRenderConfig } from "../services/map/raster/GeoTiffParser";

export const useRasterLayerStore = create<RasterLayerStoreState>()(
  immer((set, get) => ({
    layers: {},

    registerRasterLayer: (layerId, renderConfig) => {
      set((state) => {
        state.layers[layerId] = {
          layerId,
          inspection: null,
          qa: null,
          renderConfig,
          histogram: null,
          parsing: false,
          parseError: null,
        };
      });
    },

    unregisterRasterLayer: (layerId) => {
      set((state) => {
        delete state.layers[layerId];
      });
    },

    applyInspection: ({ layerId, inspection, qa, histogram }) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (!layer) return;
        layer.inspection = inspection;
        layer.qa = qa;
        layer.histogram = histogram;
        layer.parsing = false;
        layer.parseError = null;
      });
    },

    updateRenderConfig: (layerId, patch) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (!layer) return;
        Object.assign(layer.renderConfig, patch);
      });
    },

    updateHistogram: (layerId, histogram) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (layer) layer.histogram = histogram;
      });
    },

    setParsing: (layerId, parsing) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (layer) layer.parsing = parsing;
      });
    },

    setParseError: (layerId, error) => {
      set((state) => {
        const layer = state.layers[layerId];
        if (layer) {
          layer.parseError = error;
          layer.parsing = false;
        }
      });
    },

    getRasterState: (layerId) => get().layers[layerId],
  })),
);

/* ------------------------------------------------------------------ */
/*  High-level parse + register helper                                  */
/* ------------------------------------------------------------------ */

/**
 * Parse a GeoTIFF ArrayBuffer, run QA, compute the band-0 histogram,
 * and apply everything to the store in one shot.
 *
 * Designed to be called from a button handler — never the hot path.
 */
export async function loadRasterLayer(
  layerId: string,
  buffer: ArrayBuffer,
  sizeBytes?: number,
): Promise<void> {
  const store = useRasterLayerStore.getState();
  const renderConfig = defaultRasterRenderConfig();

  store.registerRasterLayer(layerId, renderConfig);
  store.setParsing(layerId, true);

  try {
    const { parseGeoTiffArrayBuffer } = await import("../services/map/raster/GeoTiffParser");
    const { assessRasterQA } = await import("../services/map/raster/RasterQAService");
    const { computeHistogram } = await import("../services/map/raster/RasterHistogramEngine");

    const inspection = await parseGeoTiffArrayBuffer(buffer, sizeBytes);
    const qa = assessRasterQA(inspection.metadata);

    const bandSample = inspection.bandSamples[0];
    const histogram = bandSample
      ? computeHistogram(bandSample.samples, inspection.metadata.noData, 32)
      : { stats: { min: 0, max: 0, mean: 0, noDataCount: 0, sampleCount: 0, validCount: 0 }, bins: [], binCount: 32, sampledCount: 0 };

    store.applyInspection({ layerId, inspection, qa, histogram });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    store.setParseError(layerId, msg);
  }
}
