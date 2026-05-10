// BuildingExtruder — Zustand store for building scene state
import { create } from "zustand";
import {
  type BuildingFeature,
  DEFAULT_HEIGHT_STRATEGY,
  type ExtrudedBuilding,
  type ExtrusionResult,
  type HeightStrategy,
  type LODLevel,
  type ThematicStyle,
} from "../buildingTypes";

/* ------------------------------------------------------------------ */
/*  State shape                                                       */
/* ------------------------------------------------------------------ */

export interface BuildingSceneState {
  /** Raw input features. */
  features: readonly BuildingFeature[];
  /** Extrusion result (null until first extrusion). */
  result: ExtrusionResult | null;
  /** Current LOD level. */
  lod: LODLevel;
  /** Height strategy. */
  heightStrategy: HeightStrategy;
  /** Height attribute override (key from strategy.attributeKeys). */
  heightAttributeKey: string;
  /** Whether extrusion is in progress. */
  loading: boolean;
  /** Processing progress 0..1. */
  progress: number;
  /** Error message if extrusion failed. */
  error: string | null;
  /** Thematic styling state. */
  thematic: ThematicStyle | null;
  /** Available numeric attribute keys discovered from features. */
  numericAttributes: readonly string[];
  /** Selected building ID (for inspection). */
  selectedBuildingId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                           */
/* ------------------------------------------------------------------ */

export interface BuildingSceneActions {
  /** Load building features and discover numeric attributes. */
  loadFeatures: (features: readonly BuildingFeature[]) => void;
  /** Set extrusion result after processing. */
  setResult: (result: ExtrusionResult) => void;
  /** Toggle LOD level. */
  setLod: (lod: LODLevel) => void;
  /** Set the preferred height attribute key. */
  setHeightAttributeKey: (key: string) => void;
  /** Set loading state. */
  setLoading: (loading: boolean) => void;
  /** Set progress (0..1). */
  setProgress: (p: number) => void;
  /** Set error. */
  setError: (err: string | null) => void;
  /** Set thematic styling. */
  setThematic: (style: ThematicStyle | null) => void;
  /** Select a building by ID. */
  selectBuilding: (id: string | null) => void;
  /** Reset entire state. */
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function discoverNumericAttrs(
  features: readonly BuildingFeature[],
): string[] {
  const counts = new Map<string, number>();
  const sample = features.slice(0, 200);
  for (const f of sample) {
    for (const [key, val] of Object.entries(f.attributes)) {
      if (typeof val === "number" && Number.isFinite(val)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  // Only keep attributes present in at least 10% of the sample
  const threshold = Math.max(1, sample.length * 0.1);
  return [...counts.entries()]
    .filter(([, c]) => c >= threshold)
    .map(([k]) => k)
    .sort();
}

/** Compute min/max for a numeric attribute across extruded buildings. */
export function attributeRange(
  buildings: readonly ExtrudedBuilding[],
  key: string,
): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const b of buildings) {
    const v = Number(b.attributes[key]);
    if (Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) return [0, 1];
  return [min, max];
}

/* ------------------------------------------------------------------ */
/*  Initial state                                                     */
/* ------------------------------------------------------------------ */

const INITIAL: BuildingSceneState = {
  features: [],
  result: null,
  lod: "basic",
  heightStrategy: DEFAULT_HEIGHT_STRATEGY,
  heightAttributeKey: "height",
  loading: false,
  progress: 0,
  error: null,
  thematic: null,
  numericAttributes: [],
  selectedBuildingId: null,
};

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

export const useBuildingScene = create<BuildingSceneState & BuildingSceneActions>()(
  (set) => ({
    ...INITIAL,

    loadFeatures: (features) =>
      set({
        features,
        result: null,
        error: null,
        numericAttributes: discoverNumericAttrs(features),
        selectedBuildingId: null,
      }),

    setResult: (result) => set({ result, loading: false, progress: 1, error: null }),
    setLod: (lod) => set({ lod }),
    setHeightAttributeKey: (key) => {
      set((s) => ({
        heightAttributeKey: key,
        heightStrategy: {
          ...s.heightStrategy,
          attributeKeys: [key, ...s.heightStrategy.attributeKeys.filter((k) => k !== key)],
        },
      }));
    },
    setLoading: (loading) => set({ loading }),
    setProgress: (progress) => set({ progress }),
    setError: (error) => set({ error, loading: false }),
    setThematic: (thematic) => set({ thematic }),
    selectBuilding: (id) => set({ selectedBuildingId: id }),
    reset: () => set({ ...INITIAL }),
  }),
);
