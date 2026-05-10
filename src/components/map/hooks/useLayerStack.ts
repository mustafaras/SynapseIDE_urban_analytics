import { create } from 'zustand';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LayerType = 'geojson' | 'choropleth' | 'heatmap' | 'point' | 'arc' | 'hex' | 'raster' | 'path';

export interface LayerConfig {
  id: string;
  label: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  /** Arbitrary data payload (GeoJSON, tile URL, etc.) */
  data: unknown;
  /** Style props forwarded to the deck.gl layer constructor */
  style: Record<string, unknown>;
}

export interface LayerStackState {
  layers: LayerConfig[];
  layerOrder: string[];         // ids, bottom-to-top
  layerVisibility: Record<string, boolean>;

  /* Actions */
  addLayer: (cfg: LayerConfig) => void;
  removeLayer: (id: string) => void;
  toggleVisibility: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  setStyle: (id: string, style: Record<string, unknown>) => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useLayerStack = create<LayerStackState>((set) => ({
  layers: [],
  layerOrder: [],
  layerVisibility: {},

  addLayer: (cfg) =>
    set((s) => {
      if (s.layers.some((l) => l.id === cfg.id)) return s;
      return {
        layers: [...s.layers, cfg],
        layerOrder: [...s.layerOrder, cfg.id],
        layerVisibility: { ...s.layerVisibility, [cfg.id]: cfg.visible },
      };
    }),

  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      layerOrder: s.layerOrder.filter((lid) => lid !== id),
      layerVisibility: (() => {
        const copy = { ...s.layerVisibility };
        delete copy[id];
        return copy;
      })(),
    })),

  toggleVisibility: (id) =>
    set((s) => {
      const current = s.layerVisibility[id] ?? true;
      return {
        layers: s.layers.map((l) =>
          l.id === id ? { ...l, visible: !current } : l,
        ),
        layerVisibility: { ...s.layerVisibility, [id]: !current },
      };
    }),

  setOpacity: (id, opacity) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l,
      ),
    })),

  moveLayer: (id, direction) =>
    set((s) => {
      const order = [...s.layerOrder];
      const idx = order.indexOf(id);
      if (idx === -1) return s;
      const target = direction === 'up' ? idx + 1 : idx - 1;
      if (target < 0 || target >= order.length) return s;
      [order[idx], order[target]] = [order[target], order[idx]];
      return { layerOrder: order };
    }),

  setStyle: (id, style) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, style: { ...l.style, ...style } } : l,
      ),
    })),
}));
