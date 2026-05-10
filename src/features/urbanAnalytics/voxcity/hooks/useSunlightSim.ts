// Sunlight Simulation — Zustand store for UI state
import { create } from "zustand";
import type {
  BuildingExposureSummary,
  BuildingVolume,
  SimulationStatus,
  SunlightConfig,
  SunlightResult,
} from "../sunlightTypes";

/* ------------------------------------------------------------------ */
/*  State shape                                                       */
/* ------------------------------------------------------------------ */

export interface SunlightSimState {
  /** Current simulation config. */
  config: SunlightConfig;
  /** Buildings used for simulation. */
  buildings: readonly BuildingVolume[];
  /** Simulation result (null until first run). */
  result: SunlightResult | null;
  /** Per-building exposure summaries (null until computed). */
  buildingSummaries: readonly BuildingExposureSummary[] | null;
  /** Current simulation status. */
  status: SimulationStatus;
  /** Progress fraction 0–1 during a run. */
  progress: number;
  /** Error message if simulation failed. */
  error: string | null;
  /** Currently active animation frame index (for playback). */
  animationFrame: number;
  /** Whether the animation is playing. */
  animationPlaying: boolean;
  /** Animation playback speed (frames per second). */
  animationFps: number;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                           */
/* ------------------------------------------------------------------ */

export interface SunlightSimActions {
  setConfig: (config: Partial<SunlightConfig>) => void;
  setBuildings: (buildings: readonly BuildingVolume[]) => void;
  setResult: (result: SunlightResult) => void;
  setBuildingSummaries: (summaries: readonly BuildingExposureSummary[]) => void;
  setStatus: (status: SimulationStatus) => void;
  setProgress: (p: number) => void;
  setError: (err: string | null) => void;
  setAnimationFrame: (frame: number) => void;
  setAnimationPlaying: (playing: boolean) => void;
  setAnimationFps: (fps: number) => void;
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_CONFIG: SunlightConfig = {
  location: { latitude: 41.0082, longitude: 28.9784 }, // Istanbul
  startDate: "2025-06-21",
  endDate: "2025-06-21",
  startHour: 6,
  endHour: 20,
  intervalMinutes: 30,
  utcOffset: 3,
};

const INITIAL_STATE: SunlightSimState = {
  config: DEFAULT_CONFIG,
  buildings: [],
  result: null,
  buildingSummaries: null,
  status: "idle",
  progress: 0,
  error: null,
  animationFrame: 0,
  animationPlaying: false,
  animationFps: 4,
};

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

export const useSunlightSimStore = create<SunlightSimState & SunlightSimActions>(
  (set) => ({
    ...INITIAL_STATE,

    setConfig: (partial) =>
      set((s) => ({ config: { ...s.config, ...partial } })),

    setBuildings: (buildings) => set({
      buildings,
      result: null,
      buildingSummaries: null,
      status: "idle",
      progress: 0,
      error: null,
      animationFrame: 0,
      animationPlaying: false,
    }),

    setResult: (result) => set({ result, status: "complete", progress: 1 }),

    setBuildingSummaries: (summaries) => set({ buildingSummaries: summaries }),

    setStatus: (status) => set({ status }),

    setProgress: (progress) => set({ progress }),

    setError: (error) => set({ error, status: "error" }),

    setAnimationFrame: (animationFrame) => set({ animationFrame }),

    setAnimationPlaying: (animationPlaying) => set({ animationPlaying }),

    setAnimationFps: (animationFps) => set({ animationFps }),

    reset: () => set(INITIAL_STATE),
  }),
);
