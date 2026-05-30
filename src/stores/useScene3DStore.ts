/**
 * Standalone Zustand store for 3D scene / 2.5D extrusion state.
 * Kept separate from the large MapExplorer store to isolate 3D lifecycle.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FeatureCollection } from "geojson";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import { cloneSourceHandle } from "@/services/map/sources/MapSourceRegistry";

/* ------------------------------------------------------------------ */
/*  3D interaction mode                                                 */
/* ------------------------------------------------------------------ */

export type Scene3DInteractionMode =
  | "inspect"
  | "select"
  | "measure"
  | "edit-height"
  | "compare"
  | "sun-shadow"
  | "section"
  | "camera-bookmark";

export const INTERACTION_MODES: Readonly<{
  mode: Scene3DInteractionMode;
  label: string;
  shortLabel: string;
}[]> = [
  { mode: "inspect",         label: "Inspect building",         shortLabel: "Inspect" },
  { mode: "select",          label: "Select features",          shortLabel: "Select" },
  { mode: "measure",         label: "Measure distance/height",  shortLabel: "Measure" },
  { mode: "edit-height",     label: "Edit building height",     shortLabel: "Edit height" },
  { mode: "compare",         label: "Compare scenarios",        shortLabel: "Compare" },
  { mode: "sun-shadow",      label: "Sun & shadow analysis",    shortLabel: "Sun/shadow" },
  { mode: "section",         label: "Section / cut plane",      shortLabel: "Section" },
  { mode: "camera-bookmark", label: "Camera bookmark",          shortLabel: "Bookmark" },
] as const;

export interface CameraBookmark {
  id: string;
  name: string;
  createdAt: string;
}
import {
  analyseExtrusion,
  buildingConfigFromAnalysis,
  buildScene3DMetadata,
  inspectBuildings,
  syncSelectionTo2D,
  syncSelectionTo3D,
  type BuildingInspectorEntry,
  type ExtrusionAnalysis,
  type Scene3DMetadata,
  type Scene3DRuntimeMode,
} from "@/services/map/scene3d/Map3DSceneController";
import type { BuildingConfig } from "@/components/map/layers/BuildingLayer";

/* ------------------------------------------------------------------ */
/*  State shape                                                         */
/* ------------------------------------------------------------------ */

export interface Scene3DState {
  /* --- Runtime mode --- */
  runtimeMode: Scene3DRuntimeMode;
  setRuntimeMode: (mode: Scene3DRuntimeMode) => void;

  /* --- Interaction mode (tool strip) --- */
  interactionMode: Scene3DInteractionMode;
  setInteractionMode: (mode: Scene3DInteractionMode) => void;

  /* --- Camera bookmarks --- */
  cameraBookmarks: CameraBookmark[];
  addCameraBookmark: (name: string) => void;
  removeCameraBookmark: (id: string) => void;

  /* --- Active layer --- */
  activeLayerId: string | null;
  activeCollection: FeatureCollection | null;
  cityModelSourceHandle: SourceHandle | null;
  terrainSourceHandle: SourceHandle | null;

  /** Set the active building footprint layer for 3D extrusion. */
  setActiveLayer: (
    layerId: string,
    collection: FeatureCollection,
    options?: {
      heightField?: string;
      floorField?: string;
      metersPerLevel?: number;
      cityModelSourceHandle?: SourceHandle | null;
      terrainSourceHandle?: SourceHandle | null;
    },
  ) => void;
  setSceneSourceHandles: (handles: {
    cityModelSourceHandle?: SourceHandle | null;
    terrainSourceHandle?: SourceHandle | null;
  }) => void;
  clearActiveLayer: () => void;

  /* --- Extrusion analysis --- */
  extrusionAnalysis: ExtrusionAnalysis | null;
  buildingConfig: BuildingConfig | null;

  /* --- Selection --- */
  selectedFeatureIds: string[];
  setSelectedFeatures: (ids: string[]) => void;
  clearSelectedFeatures: () => void;

  /** Receive 3D building selections and sync them back to 2D IDs. */
  syncFrom3DSelection: (buildingIds: string[]) => void;

  /* --- Inspector --- */
  inspectorEntries: BuildingInspectorEntry[];

  /* --- Scene metadata / QA --- */
  sceneMetadata: Scene3DMetadata | null;
  publishSceneMetadata: () => void;

  /* --- Height field override --- */
  heightFieldOverride: string | null;
  floorFieldOverride: string | null;
  metersPerLevelOverride: number;
  setHeightFieldOverride: (field: string | null) => void;
  setFloorFieldOverride: (field: string | null) => void;
  setMetersPerLevelOverride: (m: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                               */
/* ------------------------------------------------------------------ */

function reanalyse(
  collection: FeatureCollection,
  layerId: string,
  opts: { heightField?: string | null; floorField?: string | null; metersPerLevel?: number } = {},
) {
  const analysis = analyseExtrusion(collection, {
    ...(opts.heightField ? { heightField: opts.heightField } : {}),
    ...(opts.floorField ? { floorField: opts.floorField } : {}),
    metersPerLevel: opts.metersPerLevel ?? 3,
  });
  const config = buildingConfigFromAnalysis(layerId, collection, analysis);
  return { analysis, config };
}

export const useScene3DStore = create<Scene3DState>()(
  persist(
    (set, get) => ({
      /* ---- runtime mode ---- */
      runtimeMode: "2d",
      setRuntimeMode: (mode) => set({ runtimeMode: mode }),

      /* ---- interaction mode ---- */
      interactionMode: "inspect",
      setInteractionMode: (mode) => set({ interactionMode: mode }),

      /* ---- camera bookmarks ---- */
      cameraBookmarks: [],
      addCameraBookmark: (name) => {
        const id = `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({
          cameraBookmarks: [...s.cameraBookmarks, { id, name, createdAt: new Date().toISOString() }],
        }));
      },
      removeCameraBookmark: (id) => {
        set((s) => ({ cameraBookmarks: s.cameraBookmarks.filter((b) => b.id !== id) }));
      },

      /* ---- active layer ---- */
      activeLayerId: null,
      activeCollection: null,
      cityModelSourceHandle: null,
      terrainSourceHandle: null,
      extrusionAnalysis: null,
      buildingConfig: null,

      setActiveLayer: (layerId, collection, options = {}) => {
        const { analysis, config } = reanalyse(collection, layerId, {
          heightField: options.heightField ?? get().heightFieldOverride,
          floorField: options.floorField ?? get().floorFieldOverride,
          metersPerLevel: options.metersPerLevel ?? get().metersPerLevelOverride,
        });
        const entries = inspectBuildings(collection, analysis, get().selectedFeatureIds);
        set({
          activeLayerId: layerId,
          activeCollection: collection,
          cityModelSourceHandle: options.cityModelSourceHandle === undefined
            ? get().cityModelSourceHandle
            : options.cityModelSourceHandle
              ? cloneSourceHandle(options.cityModelSourceHandle)
              : null,
          terrainSourceHandle: options.terrainSourceHandle === undefined
            ? get().terrainSourceHandle
            : options.terrainSourceHandle
              ? cloneSourceHandle(options.terrainSourceHandle)
              : null,
          extrusionAnalysis: analysis,
          buildingConfig: config,
          inspectorEntries: entries,
          sceneMetadata: null,
        });
      },

      setSceneSourceHandles: (handles) => set((state) => ({
        cityModelSourceHandle: handles.cityModelSourceHandle === undefined
          ? state.cityModelSourceHandle
          : handles.cityModelSourceHandle
            ? cloneSourceHandle(handles.cityModelSourceHandle)
            : null,
        terrainSourceHandle: handles.terrainSourceHandle === undefined
          ? state.terrainSourceHandle
          : handles.terrainSourceHandle
            ? cloneSourceHandle(handles.terrainSourceHandle)
            : null,
        sceneMetadata: null,
      })),

      clearActiveLayer: () =>
        set({
          activeLayerId: null,
          activeCollection: null,
          cityModelSourceHandle: null,
          terrainSourceHandle: null,
          extrusionAnalysis: null,
          buildingConfig: null,
          inspectorEntries: [],
          sceneMetadata: null,
          selectedFeatureIds: [],
        }),

      /* ---- selection ---- */
      selectedFeatureIds: [],

      setSelectedFeatures: (ids) => {
        const { activeCollection, extrusionAnalysis } = get();
        const entries =
          activeCollection && extrusionAnalysis
            ? inspectBuildings(activeCollection, extrusionAnalysis, ids)
            : [];
        set({ selectedFeatureIds: ids, inspectorEntries: entries });
      },

      clearSelectedFeatures: () => set({ selectedFeatureIds: [], inspectorEntries: [] }),

      syncFrom3DSelection: (buildingIds) => {
        const allIds = get().activeCollection?.features.map((f) => f.id ?? f.properties?.id ?? "") ?? [];
        const synced2d = syncSelectionTo2D(buildingIds, allIds as string[]);
        get().setSelectedFeatures(synced2d);
      },

      /* ---- inspector ---- */
      inspectorEntries: [],

      /* ---- scene metadata ---- */
      sceneMetadata: null,

      publishSceneMetadata: () => {
        const {
          activeLayerId,
          runtimeMode,
          extrusionAnalysis,
          selectedFeatureIds,
          cityModelSourceHandle,
          terrainSourceHandle,
        } = get();
        if (!activeLayerId || !extrusionAnalysis) return;
        const metadata = buildScene3DMetadata({
          layerId: activeLayerId,
          runtimeMode,
          extrusionAnalysis,
          selectedFeatureIds,
          cityModelSourceHandle,
          terrainSourceHandle,
        });
        set({ sceneMetadata: metadata });
      },

      /* ---- field overrides ---- */
      heightFieldOverride: null,
      floorFieldOverride: null,
      metersPerLevelOverride: 3,

      setHeightFieldOverride: (field) => {
        set({ heightFieldOverride: field });
        const { activeLayerId, activeCollection } = get();
        if (activeLayerId && activeCollection) {
          get().setActiveLayer(activeLayerId, activeCollection, field ? { heightField: field } : {});
        }
      },

      setFloorFieldOverride: (field) => {
        set({ floorFieldOverride: field });
        const { activeLayerId, activeCollection } = get();
        if (activeLayerId && activeCollection) {
          get().setActiveLayer(activeLayerId, activeCollection, field ? { floorField: field } : {});
        }
      },

      setMetersPerLevelOverride: (m) => {
        set({ metersPerLevelOverride: m });
        const { activeLayerId, activeCollection } = get();
        if (activeLayerId && activeCollection) {
          get().setActiveLayer(activeLayerId, activeCollection, { metersPerLevel: m });
        }
      },
    }),
    {
      name: "urban.config.scene3d",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        runtimeMode: s.runtimeMode,
        interactionMode: s.interactionMode,
        cameraBookmarks: s.cameraBookmarks,
        heightFieldOverride: s.heightFieldOverride,
        floorFieldOverride: s.floorFieldOverride,
        metersPerLevelOverride: s.metersPerLevelOverride,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectScene3DMode = (s: Scene3DState) => s.runtimeMode;
export const selectInteractionMode = (s: Scene3DState) => s.interactionMode;
export const selectCameraBookmarks = (s: Scene3DState) => s.cameraBookmarks;
export const selectExtrusionAnalysis = (s: Scene3DState) => s.extrusionAnalysis;
export const selectBuildingConfig = (s: Scene3DState) => s.buildingConfig;
export const selectScene3DCityModelSourceHandle = (s: Scene3DState) => s.cityModelSourceHandle;
export const selectScene3DTerrainSourceHandle = (s: Scene3DState) => s.terrainSourceHandle;
export const selectScene3DSelected = (s: Scene3DState) => s.selectedFeatureIds;
export const selectInspectorEntries = (s: Scene3DState) => s.inspectorEntries;

/**
 * Derive 3D building IDs to highlight given the current 2D selection.
 * Used to sync the BuildingLayer's visual selection state.
 */
export function selectSync3DHighlight(state: Scene3DState): string[] {
  const { selectedFeatureIds, activeCollection } = state;
  const allIds =
    activeCollection?.features.map((f) => f.id ?? f.properties?.id ?? "") ?? [];
  return syncSelectionTo3D(selectedFeatureIds, allIds as (string | number)[]);
}
