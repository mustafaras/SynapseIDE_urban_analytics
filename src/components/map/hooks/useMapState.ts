import { create } from 'zustand';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  transitionDuration?: number;
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MapState {
  /** Current viewport */
  viewState: ViewState;
  /** Last-known visible bounds (updated on move end) */
  bounds: Bounds | null;

  /* Actions */
  setViewState: (vs: Partial<ViewState>) => void;
  flyTo: (opts: { longitude: number; latitude: number; zoom?: number; duration?: number }) => void;
  fitBounds: (bounds: Bounds, opts?: { padding?: number; duration?: number }) => void;
  resetNorth: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_VIEW: ViewState = {
  longitude: 29.0,
  latitude: 41.01,
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useMapState = create<MapState>((set) => ({
  viewState: { ...DEFAULT_VIEW },
  bounds: null,

  setViewState: (vs) =>
    set((s) => ({ viewState: { ...s.viewState, ...vs } })),

  flyTo: ({ longitude, latitude, zoom, duration = 1400 }) =>
    set((s) => ({
      viewState: {
        ...s.viewState,
        longitude,
        latitude,
        ...(zoom !== undefined ? { zoom } : {}),
        transitionDuration: duration,
      },
    })),

  fitBounds: (bounds, opts) => {
    const lng = (bounds.west + bounds.east) / 2;
    const lat = (bounds.south + bounds.north) / 2;
    // Rough zoom estimation from bounds span
    const latSpan = bounds.north - bounds.south;
    const lngSpan = bounds.east - bounds.west;
    const maxSpan = Math.max(latSpan, lngSpan);
    const zoom = Math.max(1, Math.min(18, Math.log2(360 / maxSpan)));
    set((s) => ({
      viewState: {
        ...s.viewState,
        longitude: lng,
        latitude: lat,
        zoom,
        transitionDuration: opts?.duration ?? 1200,
      },
      bounds,
    }));
  },

  resetNorth: () =>
    set((s) => ({
      viewState: { ...s.viewState, bearing: 0, pitch: 0, transitionDuration: 600 },
    })),
}));
