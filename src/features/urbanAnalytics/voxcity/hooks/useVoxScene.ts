// VoxCity 3D — Zustand store for scene state
import { create } from "zustand";
import type {
  ColorRampName,
  MaterialVisibility,
  SimulationResult,
  SlicePlane,
  VoxelGrid,
} from "../types";

/* ------------------------------------------------------------------ */
/*  State shape                                                       */
/* ------------------------------------------------------------------ */

export interface VoxSceneState {
  /** Currently loaded voxel grid. */
  grid: VoxelGrid | null;

  /** Active simulation result overlaid onto the grid. */
  simulation: SimulationResult | null;

  /** Slice planes (up to 3 axes). */
  slicePlanes: readonly SlicePlane[];

  /** Per-material-id visibility & opacity. Key = materialId. */
  visibility: Record<number, MaterialVisibility>;

  /** Color ramp used for simulation overlay. */
  colorRamp: ColorRampName;

  /** Simulation value filter range [min, max]. */
  valueRange: readonly [number, number];

  /** Active camera preset name (empty = free orbit). */
  cameraPreset: string;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                           */
/* ------------------------------------------------------------------ */

export interface VoxSceneActions {
  /** Load a new voxel grid and reset related state. */
  loadGrid: (grid: VoxelGrid) => void;

  /** Clear the current grid. */
  clearGrid: () => void;

  /** Apply a simulation result overlay. */
  setSimulation: (sim: SimulationResult | null) => void;

  /** Update a slice plane by axis. */
  setSlicePlane: (axis: "x" | "y" | "z", position: number, enabled: boolean) => void;

  /** Toggle visibility for a material id. */
  toggleMaterial: (materialId: number) => void;

  /** Set opacity for a material id (0–1). */
  setMaterialOpacity: (materialId: number, opacity: number) => void;

  /** Select a color ramp for simulation overlay. */
  setColorRamp: (ramp: ColorRampName) => void;

  /** Set simulation value filter range. */
  setValueRange: (range: readonly [number, number]) => void;

  /** Select a named camera preset (empty string = free orbit). */
  setCameraPreset: (name: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_SLICE_PLANES: readonly SlicePlane[] = [
  { axis: "x", position: 0, enabled: false },
  { axis: "y", position: 0, enabled: false },
  { axis: "z", position: 0, enabled: false },
];

function buildVisibilityMap(grid: VoxelGrid): Record<number, MaterialVisibility> {
  const map: Record<number, MaterialVisibility> = {};
  for (const m of grid.materials) {
    map[m.id] = { visible: m.opacity > 0, opacity: m.opacity };
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

export const useVoxScene = create<VoxSceneState & VoxSceneActions>()((set) => ({
  // --- state ---
  grid: null,
  simulation: null,
  slicePlanes: DEFAULT_SLICE_PLANES,
  visibility: {},
  colorRamp: "viridis",
  valueRange: [0, 1] as const,
  cameraPreset: "",

  // --- actions ---
  loadGrid: (grid) =>
    set({
      grid,
      simulation: null,
      visibility: buildVisibilityMap(grid),
      slicePlanes: [
        { axis: "x", position: (grid.bounds.minX + grid.bounds.maxX) / 2, enabled: false },
        { axis: "y", position: (grid.bounds.minY + grid.bounds.maxY) / 2, enabled: false },
        { axis: "z", position: (grid.bounds.minZ + grid.bounds.maxZ) / 2, enabled: false },
      ],
      valueRange: [0, 1] as const,
      cameraPreset: "",
    }),

  clearGrid: () =>
    set({
      grid: null,
      simulation: null,
      visibility: {},
      slicePlanes: DEFAULT_SLICE_PLANES,
      valueRange: [0, 1] as const,
    }),

  setSimulation: (sim) =>
    set({
      simulation: sim,
      valueRange: sim ? ([sim.min, sim.max] as const) : ([0, 1] as const),
    }),

  setSlicePlane: (axis, position, enabled) =>
    set((s) => ({
      slicePlanes: s.slicePlanes.map((sp) =>
        sp.axis === axis ? { axis, position, enabled } : sp,
      ),
    })),

  toggleMaterial: (materialId) =>
    set((s) => {
      const cur = s.visibility[materialId];
      if (!cur) return s;
      return {
        visibility: { ...s.visibility, [materialId]: { ...cur, visible: !cur.visible } },
      };
    }),

  setMaterialOpacity: (materialId, opacity) =>
    set((s) => {
      const cur = s.visibility[materialId];
      if (!cur) return s;
      return {
        visibility: {
          ...s.visibility,
          [materialId]: { ...cur, opacity: Math.max(0, Math.min(1, opacity)) },
        },
      };
    }),

  setColorRamp: (ramp) => set({ colorRamp: ramp }),

  setValueRange: (range) => set({ valueRange: range }),

  setCameraPreset: (name) => set({ cameraPreset: name }),
}));
