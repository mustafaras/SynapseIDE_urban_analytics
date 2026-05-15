import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MapToolbarDensityPreference = "compact" | "comfortable" | "expert";

interface MapToolbarPreferencesState {
  density: MapToolbarDensityPreference;
  setDensity: (density: MapToolbarDensityPreference) => void;
}

export const useMapToolbarPreferencesStore = create<MapToolbarPreferencesState>()(
  persist(
    (set) => ({
      density: "expert",
      setDensity: (density) => set({ density }),
    }),
    { name: "synapse-map-toolbar-preferences" },
  ),
);