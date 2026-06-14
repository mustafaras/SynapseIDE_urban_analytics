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

const MAP_TOOLBAR_PREFERENCES_VERSION = 1;
const DEFAULT_MAP_TOOLBAR_PREFERENCES: PersistedMapToolbarPreferencesState = {
  // GIS-grade default: a compact, ArcGIS/QGIS-style dense layout out of the box.
  density: "compact",
  taskLens: "analyst",
};

function normalizeDensity(input: unknown): MapToolbarDensityPreference {
  // Compact is the GIS-grade default; only an explicit "comfortable" opts out.
  return input === "comfortable" ? "comfortable" : "compact";
}

function normalizeTaskLens(input: unknown): MapToolbarTaskLensPreference {
  return input === "planner" || input === "reviewer" || input === "publisher" ? input : "analyst";
}

export const useMapToolbarPreferencesStore = create<MapToolbarPreferencesState>()(
  persist<MapToolbarPreferencesState, [], [], PersistedMapToolbarPreferencesState>(
    (set) => ({
      density: DEFAULT_MAP_TOOLBAR_PREFERENCES.density,
      taskLens: DEFAULT_MAP_TOOLBAR_PREFERENCES.taskLens,
      setDensity: (density) => set({ density }),
      setTaskLens: (taskLens) => set({ taskLens }),
    }),
    {
      name: "synapse-map-toolbar-preferences",
      version: MAP_TOOLBAR_PREFERENCES_VERSION,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion < MAP_TOOLBAR_PREFERENCES_VERSION) {
          return { ...DEFAULT_MAP_TOOLBAR_PREFERENCES };
        }
        const persisted = persistedState as Partial<PersistedMapToolbarPreferencesState> | null | undefined;
        return {
          density: normalizeDensity(persisted?.density),
          taskLens: normalizeTaskLens(persisted?.taskLens),
        };
      },
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
