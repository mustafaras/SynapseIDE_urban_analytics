import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Durable per-dialog geometry (drag offset + size) for Map Explorer modals.
 * Persisted through Zustand `persist` (namespaced) rather than direct
 * localStorage, per project state rules.
 */
export interface MapDialogGeometry {
  /** Drag offset from centre, in px. */
  offsetX: number;
  offsetY: number;
  /** Last resized size, in px (null until the user resizes). */
  width: number | null;
  height: number | null;
}

interface MapDialogLayoutState {
  geometry: Record<string, MapDialogGeometry>;
  getGeometry: (key: string) => MapDialogGeometry | null;
  setOffset: (key: string, offsetX: number, offsetY: number) => void;
  setSize: (key: string, width: number, height: number) => void;
  resetGeometry: (key: string) => void;
}

const EMPTY: Record<string, MapDialogGeometry> = {};

export const useMapDialogLayoutStore = create<MapDialogLayoutState>()(
  persist<MapDialogLayoutState, [], [], Pick<MapDialogLayoutState, "geometry">>(
    (set, get) => ({
      geometry: EMPTY,
      getGeometry: (key) => get().geometry[key] ?? null,
      setOffset: (key, offsetX, offsetY) =>
        set((state) => {
          const prev = state.geometry[key] ?? { offsetX: 0, offsetY: 0, width: null, height: null };
          return { geometry: { ...state.geometry, [key]: { ...prev, offsetX, offsetY } } };
        }),
      setSize: (key, width, height) =>
        set((state) => {
          const prev = state.geometry[key] ?? { offsetX: 0, offsetY: 0, width: null, height: null };
          return { geometry: { ...state.geometry, [key]: { ...prev, width, height } } };
        }),
      resetGeometry: (key) =>
        set((state) => {
          if (!state.geometry[key]) return state;
          const next = { ...state.geometry };
          delete next[key];
          return { geometry: next };
        }),
    }),
    {
      name: "urban.config.map.dialog-layout",
      partialize: (state) => ({ geometry: state.geometry }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Pick<MapDialogLayoutState, "geometry">> | null | undefined;
        return {
          ...currentState,
          geometry: persisted?.geometry && typeof persisted.geometry === "object" ? persisted.geometry : EMPTY,
        };
      },
    },
  ),
);
