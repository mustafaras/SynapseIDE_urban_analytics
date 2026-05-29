/* ================================================================== */
/*  useTemporalLayerStore — Prompt 46                                   */
/*                                                                      */
/*  Zustand store driving the temporal player. Holds the ordered frame  */
/*  list, the active cursor, playback mode/speed/run state, and the      */
/*  reduced-motion gate. Frame export reuses the Prompt 22 layout        */
/*  composer path. Playback state is transient (live workspace state):   */
/*  no persistence, no direct localStorage.                              */
/* ================================================================== */

import { create } from "zustand";
import type {
  MapTemporalEvidenceLayerReferences,
  MapTemporalEvidenceMetadata,
  PlaybackSpeed,
  TemporalMode,
} from "@/centerpanel/components/map/mapTypes";
import {
  serializeLayoutRestoreMetadata,
  type MapFigureRestoreMetadata,
} from "@/services/map/layout/MapLayoutComposer";
import {
  buildTemporalEvidenceMetadata,
  clampFrameIndex,
  resolveNextFrameIndex,
  resolvePrevFrameIndex,
  shouldAutoPlay,
  type TemporalFrameDefinition,
  type TemporalRuntimeMode,
} from "@/services/map/temporal/TemporalPlaybackEngine";

/* ================================================================== */
/*  Bounds                                                             */
/* ================================================================== */

/** Defensive cap on the frame list to avoid unbounded growth. */
export const MAX_TEMPORAL_FRAMES = 500;

/* ================================================================== */
/*  Frame export payload                                               */
/* ================================================================== */

/**
 * Payload returned by `exportCurrentFrame`. Carries the frame identity
 * (`frameIndex` / `frameKey` / `frameLabel`) plus the serialised layout
 * restore metadata produced via the Prompt 22 composer path.
 */
export interface TemporalFrameExportPayload {
  frameIndex: number;
  frameKey: string;
  frameLabel: string;
  temporalEvidenceId: string;
  exportedAt: string;
  restoreMetadata: MapFigureRestoreMetadata;
}

/* ================================================================== */
/*  Store shape                                                        */
/* ================================================================== */

export interface TemporalLayerReferenceState {
  activeLayerId: string | null;
  sourceId: string | null;
  layerId: string | null;
  layerName: string | null;
  sourceFields: string[];
  timeField: string | null;
  runtimeMode: TemporalRuntimeMode;
}

export interface TemporalLayerState extends TemporalLayerReferenceState {
  temporalEvidenceId: string;
  frames: TemporalFrameDefinition[];
  activeFrameIndex: number;
  playbackMode: TemporalMode;
  speed: PlaybackSpeed;
  isPlaying: boolean;
  prefersReducedMotion: boolean;

  /* --- frame + layer wiring --- */
  setFrames: (frames: TemporalFrameDefinition[]) => void;
  setLayerReferences: (refs: Partial<TemporalLayerReferenceState>) => void;
  setPlaybackMode: (mode: TemporalMode) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setReducedMotion: (reduced: boolean) => void;

  /* --- transport --- */
  play: () => void;
  pause: () => void;
  nextFrame: () => void;
  prevFrame: () => void;
  goToFrame: (index: number) => void;

  /* --- handoff --- */
  exportCurrentFrame: () => TemporalFrameExportPayload | null;
  buildEvidence: () => MapTemporalEvidenceMetadata | null;
  reset: () => void;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function activeFrame(state: TemporalLayerState): TemporalFrameDefinition | undefined {
  return state.frames[clampFrameIndex(state.activeFrameIndex, state.frames.length)];
}

function resolveLayerReferences(
  state: TemporalLayerState,
): MapTemporalEvidenceLayerReferences {
  const layerId = state.layerId ?? state.activeLayerId ?? "temporal-layer";
  return {
    activeLayerId: state.activeLayerId ?? layerId,
    sourceId: state.sourceId ?? `${layerId}-source`,
    layerId,
    sourceLayerIds: state.activeLayerId ? [state.activeLayerId] : [layerId],
  };
}

/* ================================================================== */
/*  Initial state                                                      */
/* ================================================================== */

const INITIAL_REFERENCES: TemporalLayerReferenceState = {
  activeLayerId: null,
  sourceId: null,
  layerId: null,
  layerName: null,
  sourceFields: [],
  timeField: null,
  runtimeMode: "unknown",
};

function makeTemporalEvidenceId(): string {
  return `temporal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ================================================================== */
/*  Store                                                              */
/* ================================================================== */

export const useTemporalLayerStore = create<TemporalLayerState>((set, get) => ({
  ...INITIAL_REFERENCES,
  temporalEvidenceId: makeTemporalEvidenceId(),
  frames: [],
  activeFrameIndex: 0,
  playbackMode: "snapshot",
  speed: 1,
  isPlaying: false,
  prefersReducedMotion: false,

  setFrames: (frames) =>
    set(() => {
      const bounded = frames.slice(0, MAX_TEMPORAL_FRAMES);
      // Re-normalise indices so they are dense and zero-based.
      const normalised = bounded.map((frame, i) => ({ ...frame, index: i }));
      return {
        frames: normalised,
        activeFrameIndex: clampFrameIndex(0, normalised.length),
        isPlaying: false,
      };
    }),

  setLayerReferences: (refs) => set((s) => ({ ...s, ...refs })),

  setPlaybackMode: (mode) => set({ playbackMode: mode }),

  setSpeed: (speed) => set({ speed }),

  setReducedMotion: (reduced) =>
    set((s) => ({
      prefersReducedMotion: reduced,
      // Reduced motion force-stops auto-play.
      isPlaying: reduced ? false : s.isPlaying,
    })),

  play: () =>
    set((s) => {
      if (s.frames.length === 0) return { isPlaying: false };
      return { isPlaying: shouldAutoPlay(true, s.prefersReducedMotion) };
    }),

  pause: () => set({ isPlaying: false }),

  nextFrame: () =>
    set((s) => ({
      activeFrameIndex: resolveNextFrameIndex(
        s.activeFrameIndex,
        s.frames.length,
        s.playbackMode,
      ),
    })),

  prevFrame: () =>
    set((s) => ({
      activeFrameIndex: resolvePrevFrameIndex(
        s.activeFrameIndex,
        s.frames.length,
        s.playbackMode,
      ),
    })),

  goToFrame: (index) =>
    set((s) => ({
      activeFrameIndex: clampFrameIndex(index, s.frames.length),
    })),

  exportCurrentFrame: () => {
    const state = get();
    const frame = activeFrame(state);
    if (!frame) return null;
    const restoreMetadata = serializeLayoutRestoreMetadata(0, [
      {
        pageNumber: frame.index + 1,
        overlayLayers: [],
        title: frame.label,
        dynamicText: `Frame ${frame.index + 1} of ${state.frames.length} — ${frame.key}`,
      },
    ]);
    return {
      frameIndex: frame.index,
      frameKey: frame.key,
      frameLabel: frame.label,
      temporalEvidenceId: state.temporalEvidenceId,
      exportedAt: new Date().toISOString(),
      restoreMetadata,
    };
  },

  buildEvidence: () => {
    const state = get();
    if (state.frames.length === 0) return null;
    return buildTemporalEvidenceMetadata({
      temporalEvidenceId: state.temporalEvidenceId,
      mode: state.playbackMode,
      frames: state.frames,
      activeFrameIndex: state.activeFrameIndex,
      speed: state.speed,
      isPlaying: state.isPlaying,
      prefersReducedMotion: state.prefersReducedMotion,
      layerReferences: resolveLayerReferences(state),
      sourceFields: state.sourceFields,
      runtimeMode: state.runtimeMode,
      ...(state.layerName ? { layerName: state.layerName } : {}),
      ...(state.timeField ? { timeField: state.timeField } : {}),
    });
  },

  reset: () =>
    set(() => ({
      ...INITIAL_REFERENCES,
      temporalEvidenceId: makeTemporalEvidenceId(),
      frames: [],
      activeFrameIndex: 0,
      playbackMode: "snapshot" as TemporalMode,
      speed: 1 as PlaybackSpeed,
      isPlaying: false,
      prefersReducedMotion: false,
    })),
}));

/* ================================================================== */
/*  Selectors                                                          */
/* ================================================================== */

export const selectActiveTemporalFrame = (
  s: TemporalLayerState,
): TemporalFrameDefinition | undefined =>
  s.frames[clampFrameIndex(s.activeFrameIndex, s.frames.length)];

export const selectTemporalFrameCount = (s: TemporalLayerState): number => s.frames.length;
