import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapTaskLensId } from "../centerpanel/components/map/navigation";

export type MapToolbarDensityPreference = "compact" | "comfortable";
export type MapToolbarTaskLensPreference = MapTaskLensId;

interface MapToolbarPreferencesState {
  density: MapToolbarDensityPreference;
  taskLens: MapToolbarTaskLensPreference;
  setDensity: (density: MapToolbarDensityPreference) => void;
  setTaskLens: (taskLens: MapToolbarTaskLensPreference) => void;
}

type PersistedMapToolbarPreferencesState = Pick<MapToolbarPreferencesState, "density" | "taskLens">;

function normalizeDensity(input: unknown): MapToolbarDensityPreference {
  return input === "compact" ? "compact" : "comfortable";
}

function normalizeTaskLens(input: unknown): MapToolbarTaskLensPreference {
  return input === "planner" || input === "reviewer" || input === "publisher" ? input : "analyst";
}

export const useMapToolbarPreferencesStore = create<MapToolbarPreferencesState>()(
  persist<MapToolbarPreferencesState, [], [], PersistedMapToolbarPreferencesState>(
    (set) => ({
      density: "comfortable",
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
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedMapToolbarPreferencesState> | null | undefined;
        return {
          ...currentState,
          density: normalizeDensity(persisted?.density),
          taskLens: normalizeTaskLens(persisted?.taskLens),
        };
      },
    },
  ),
);
