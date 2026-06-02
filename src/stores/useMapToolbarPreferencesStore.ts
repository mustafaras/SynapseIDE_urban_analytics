import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapTaskLensId } from "../centerpanel/components/map/navigation";

export type MapToolbarDensityPreference = "compact" | "comfortable" | "expert";
export type MapToolbarTaskLensPreference = MapTaskLensId;

interface MapToolbarPreferencesState {
  density: MapToolbarDensityPreference;
  taskLens: MapToolbarTaskLensPreference;
  setDensity: (density: MapToolbarDensityPreference) => void;
  setTaskLens: (taskLens: MapToolbarTaskLensPreference) => void;
}

type PersistedMapToolbarPreferencesState = Pick<MapToolbarPreferencesState, "density" | "taskLens">;

export const useMapToolbarPreferencesStore = create<MapToolbarPreferencesState>()(
  persist<MapToolbarPreferencesState, [], [], PersistedMapToolbarPreferencesState>(
    (set) => ({
      density: "expert",
      taskLens: "analyst",
      setDensity: (density) => set({ density }),
      setTaskLens: (taskLens) => set({ taskLens }),
    }),
    {
      name: "synapse-map-toolbar-preferences",
      partialize: (state) => ({
        density: state.density,
        taskLens: state.taskLens,
      }),
    },
  ),
);
