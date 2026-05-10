/**
 * useCityJSONScene — Zustand store for CityJSON scene state.
 *
 * Manages loaded CityJSON objects, summary metadata, loading status,
 * selected object, and semantic surface visibility.
 */
import { create } from "zustand";
import type {
  CityJSONLoadResult,
  CityJSONSummary,
  ParsedCityObject,
  SemanticSurfaceType,
} from "../cityJsonTypes";

/* ------------------------------------------------------------------ */
/*  State shape                                                       */
/* ------------------------------------------------------------------ */

export interface CityJSONSceneState {
  /** Parsed CityObjects. */
  objects: readonly ParsedCityObject[];
  /** Aggregated metadata. */
  summary: CityJSONSummary | null;
  /** Loading indicators. */
  loading: boolean;
  progressPhase: string;
  progressDone: number;
  progressTotal: number;
  /** Error message. */
  error: string | null;
  /** Selected object ID for attribute inspection. */
  selectedObjectId: string | null;
  /** Semantic surface visibility toggles. */
  surfaceVisibility: Record<string, boolean>;
  /** Whether the metadata panel is open. */
  metadataOpen: boolean;

  // Actions
  setLoadResult: (result: CityJSONLoadResult) => void;
  setLoading: (loading: boolean) => void;
  setProgress: (phase: string, done: number, total: number) => void;
  setError: (error: string | null) => void;
  selectObject: (id: string | null) => void;
  toggleSurfaceVisibility: (type: SemanticSurfaceType | string) => void;
  setMetadataOpen: (open: boolean) => void;
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

const INITIAL_VISIBILITY: Record<string, boolean> = {
  RoofSurface: true,
  WallSurface: true,
  GroundSurface: true,
  OuterCeilingSurface: true,
  OuterFloorSurface: true,
  ClosureSurface: true,
  Window: true,
  Door: true,
};

export const useCityJSONScene = create<CityJSONSceneState>((set) => ({
  objects: [],
  summary: null,
  loading: false,
  progressPhase: "",
  progressDone: 0,
  progressTotal: 0,
  error: null,
  selectedObjectId: null,
  surfaceVisibility: { ...INITIAL_VISIBILITY },
  metadataOpen: false,

  setLoadResult: (result) =>
    set({
      objects: result.objects,
      summary: result.summary,
      loading: false,
      error: null,
      selectedObjectId: null,
    }),

  setLoading: (loading) => set({ loading }),

  setProgress: (phase, done, total) =>
    set({ progressPhase: phase, progressDone: done, progressTotal: total }),

  setError: (error) => set({ error, loading: false }),

  selectObject: (id) => set({ selectedObjectId: id }),

  toggleSurfaceVisibility: (type) =>
    set((s) => ({
      surfaceVisibility: {
        ...s.surfaceVisibility,
        [type]: !(s.surfaceVisibility[type] ?? true),
      },
    })),

  setMetadataOpen: (open) => set({ metadataOpen: open }),

  reset: () =>
    set({
      objects: [],
      summary: null,
      loading: false,
      progressPhase: "",
      progressDone: 0,
      progressTotal: 0,
      error: null,
      selectedObjectId: null,
      surfaceVisibility: { ...INITIAL_VISIBILITY },
      metadataOpen: false,
    }),
}));
