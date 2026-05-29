/* ================================================================== */
/*  TemporalPlaybackEngine — Prompt 46                                  */
/*                                                                      */
/*  Pure, DOM-free engine for temporal layer playback. Owns frame       */
/*  definitions, snapshot/continuous advance logic, speed → interval     */
/*  resolution, per-frame evidence frame references, and assembly of a   */
/*  `MapTemporalEvidenceMetadata` payload for the Urban handoff.         */
/*                                                                      */
/*  The engine never touches the DOM directly. The optional ticker uses  */
/*  the ambient timer functions (available in both browser and node)     */
/*  so it can be unit-tested with fake timers.                           */
/* ================================================================== */

import type {
  MapEvidenceScalar,
  MapTemporalEvidenceFrameReference,
  MapTemporalEvidenceLayerReferences,
  MapTemporalEvidenceMetadata,
  MapTemporalEvidenceQA,
  MapTemporalEvidenceStep,
  MapTemporalEvidenceTimeRange,
  PlaybackSpeed,
  TemporalMode,
} from "@/centerpanel/components/map/mapTypes";

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

/**
 * Truthful provenance mode for the temporal frames. Drives QA state and
 * caveats — never label demonstration or synthetic data as `live`.
 */
export type TemporalRuntimeMode = "live" | "demo" | "synthetic" | "unknown";

/** A single playback frame definition. */
export interface TemporalFrameDefinition {
  /** Zero-based position in the ordered frame list. */
  index: number;
  /** Stable key: ISO 8601 timestamp, unix value, or a label. */
  key: string;
  /** Human-readable label shown in the player rail. */
  label: string;
  /** Optional per-frame feature count (for bin-count correctness). */
  featureCount?: number;
  /** Optional per-frame summed metric value (for bin-sum correctness). */
  binSum?: number;
}

/** Supported playback speed multipliers, ordered slow → fast. */
export const TEMPORAL_PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2, 4] as const;

/**
 * Base auto-advance interval at 1× speed, in milliseconds. One second per
 * frame reads as a deliberate snapshot cadence (not a flicker animation).
 */
export const BASE_FRAME_ADVANCE_MS = 1000;

export interface BuildTemporalEvidenceInput {
  temporalEvidenceId: string;
  mode: TemporalMode;
  frames: TemporalFrameDefinition[];
  activeFrameIndex: number;
  speed: PlaybackSpeed;
  isPlaying: boolean;
  prefersReducedMotion: boolean;
  layerReferences: MapTemporalEvidenceLayerReferences;
  sourceFields: string[];
  runtimeMode: TemporalRuntimeMode;
  layerName?: string;
  timeField?: string;
}

/* ================================================================== */
/*  Frame indexing                                                     */
/* ================================================================== */

/** Clamp an index into the valid `[0, frameCount - 1]` range. */
export function clampFrameIndex(index: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  const floored = Math.floor(index);
  if (floored < 0) return 0;
  if (floored > frameCount - 1) return frameCount - 1;
  return floored;
}

/**
 * Resolve the next frame index. Continuous mode loops back to 0 after the
 * last frame (auto-advance); snapshot mode clamps at the final frame.
 */
export function resolveNextFrameIndex(
  current: number,
  frameCount: number,
  mode: TemporalMode,
): number {
  if (frameCount <= 0) return 0;
  const safeCurrent = clampFrameIndex(current, frameCount);
  const next = safeCurrent + 1;
  if (next > frameCount - 1) {
    return mode === "continuous" ? 0 : frameCount - 1;
  }
  return next;
}

/**
 * Resolve the previous frame index. Continuous mode wraps to the last frame;
 * snapshot mode clamps at frame 0.
 */
export function resolvePrevFrameIndex(
  current: number,
  frameCount: number,
  mode: TemporalMode,
): number {
  if (frameCount <= 0) return 0;
  const safeCurrent = clampFrameIndex(current, frameCount);
  const prev = safeCurrent - 1;
  if (prev < 0) {
    return mode === "continuous" ? frameCount - 1 : 0;
  }
  return prev;
}

/* ================================================================== */
/*  Speed + reduced-motion                                             */
/* ================================================================== */

/** Per-frame interval in milliseconds for the given speed multiplier. */
export function computeFrameAdvanceMs(speed: PlaybackSpeed): number {
  return Math.round(BASE_FRAME_ADVANCE_MS / speed);
}

/**
 * Whether auto-play should actually run. Auto-play is force-disabled when the
 * user prefers reduced motion — continuous animation is suppressed and the
 * user steps frames manually instead.
 */
export function shouldAutoPlay(
  requestedPlaying: boolean,
  prefersReducedMotion: boolean,
): boolean {
  return requestedPlaying && !prefersReducedMotion;
}

/* ================================================================== */
/*  Frame aggregation (bin-sum / count)                                */
/* ================================================================== */

export interface FrameFeatureSummary {
  featureCount: number;
  binSum: number;
}

/**
 * Summarise a frame's features into a count and a numeric bin-sum. When
 * `valueField` is supplied, only finite numeric values of that property are
 * summed; non-numeric values contribute to the count but not the sum.
 */
export function summarizeFrameFeatures(
  features: ReadonlyArray<{ properties?: Record<string, unknown> | null } | null | undefined>,
  valueField?: string,
): FrameFeatureSummary {
  let featureCount = 0;
  let binSum = 0;
  for (const feature of features) {
    if (!feature) continue;
    featureCount += 1;
    if (!valueField) continue;
    const raw = feature.properties?.[valueField];
    const num = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(num)) {
      binSum += num;
    }
  }
  return { featureCount, binSum };
}

/* ================================================================== */
/*  Evidence references + metadata assembly                            */
/* ================================================================== */

/** Build a per-frame evidence reference from a frame and the layer references. */
export function buildFrameReference(
  frame: TemporalFrameDefinition,
  layerReferences: MapTemporalEvidenceLayerReferences,
): MapTemporalEvidenceFrameReference {
  return {
    frameIndex: frame.index,
    sourceId: layerReferences.sourceId,
    layerId: layerReferences.layerId,
    ...(frame.key ? { frameKey: frame.key } : {}),
    ...(frame.label ? { frameLabel: frame.label } : {}),
  };
}

/** Build the time range from the ordered frame list. */
export function buildTemporalTimeRange(
  frames: TemporalFrameDefinition[],
): MapTemporalEvidenceTimeRange {
  const first = frames[0];
  const last = frames[frames.length - 1];
  return {
    startIndex: first?.index ?? 0,
    endIndex: last?.index ?? 0,
    ...(first?.key ? { startKey: first.key } : {}),
    ...(last?.key ? { endKey: last.key } : {}),
    ...(first?.label ? { startLabel: first.label } : {}),
    ...(last?.label ? { endLabel: last.label } : {}),
  };
}

/** Build the active-step descriptor. */
export function buildTemporalStep(
  frame: TemporalFrameDefinition | undefined,
): MapTemporalEvidenceStep {
  return {
    index: frame?.index ?? 0,
    ...(frame?.key ? { key: frame.key } : {}),
    ...(frame?.label ? { label: frame.label } : {}),
  };
}

/**
 * Whether the frames carry an observable metric change. Used to avoid emitting
 * a false "metric changed across frames" caveat when every frame is identical.
 */
export function framesHaveMetricChange(frames: TemporalFrameDefinition[]): boolean {
  if (frames.length < 2) return false;
  const counts = new Set<number>();
  const sums = new Set<number>();
  for (const frame of frames) {
    if (typeof frame.featureCount === "number") counts.add(frame.featureCount);
    if (typeof frame.binSum === "number") sums.add(frame.binSum);
  }
  return counts.size > 1 || sums.size > 1;
}

function resolveQaState(
  runtimeMode: TemporalRuntimeMode,
): MapTemporalEvidenceQA["state"] {
  switch (runtimeMode) {
    case "live":
      return "passed";
    case "demo":
    case "synthetic":
      return "warning";
    case "unknown":
    default:
      return "unchecked";
  }
}

/**
 * Assemble a complete `MapTemporalEvidenceMetadata` payload satisfying the
 * existing contract. Caveats are truthful: provenance caveats follow the
 * runtime mode, and a metric-change note is only added when the frames
 * actually differ.
 */
export function buildTemporalEvidenceMetadata(
  input: BuildTemporalEvidenceInput,
): MapTemporalEvidenceMetadata {
  const {
    temporalEvidenceId,
    mode,
    frames,
    activeFrameIndex,
    speed,
    isPlaying,
    prefersReducedMotion,
    layerReferences,
    sourceFields,
    runtimeMode,
    layerName,
    timeField,
  } = input;

  const frameCount = frames.length;
  const safeIndex = clampFrameIndex(activeFrameIndex, frameCount);
  const activeFrame = frames[safeIndex];
  const effectivePlaying = shouldAutoPlay(isPlaying, prefersReducedMotion);

  const caveats: string[] = [];
  if (runtimeMode === "demo") {
    caveats.push("Frames render demonstration data; not live observations.");
  } else if (runtimeMode === "synthetic") {
    caveats.push("Frames render synthetic data generated for illustration.");
  } else if (runtimeMode === "unknown") {
    caveats.push("Frame provenance is undetermined; treat values as unverified.");
  }
  if (frameCount < 2) {
    caveats.push("Single frame captured; no temporal variation is represented.");
  } else if (framesHaveMetricChange(frames)) {
    caveats.push("Metric values change across frames; verify the trend against source data.");
  }
  if (prefersReducedMotion) {
    caveats.push("Auto-play disabled: reduced-motion preference is active.");
  }

  const qa: MapTemporalEvidenceQA = {
    state: resolveQaState(runtimeMode),
    caveats,
    uncertaintyNotes:
      runtimeMode === "live"
        ? []
        : ["Frame values are not sourced from verified live observations."],
  };

  const playbackParameters: Record<string, MapEvidenceScalar> = {
    runtimeMode,
    frameCount,
    mode,
    activeFrameIndex: safeIndex,
    prefersReducedMotion,
    effectivePlaying,
  };

  return {
    version: 1,
    temporalEvidenceId,
    mode,
    activeLayerId: layerReferences.activeLayerId,
    ...(layerName ? { layerName } : {}),
    frameCount,
    timeRange: buildTemporalTimeRange(frames),
    step: buildTemporalStep(activeFrame),
    sourceFields: [...sourceFields],
    ...(timeField ? { timeField } : {}),
    playback: {
      speed,
      isPlaying: effectivePlaying,
      frameAdvanceMs: computeFrameAdvanceMs(speed),
    },
    playbackParameters,
    layerReferences,
    reportExportFrameReference: activeFrame
      ? buildFrameReference(activeFrame, layerReferences)
      : {
          frameIndex: safeIndex,
          sourceId: layerReferences.sourceId,
          layerId: layerReferences.layerId,
        },
    qa,
    caveats,
  };
}

/* ================================================================== */
/*  Continuous-mode ticker                                             */
/* ================================================================== */

export interface TemporalTicker {
  /** Begin auto-advancing; `onTick` is invoked each interval. */
  start: (onTick: () => void) => void;
  /** Stop auto-advancing and clear the interval. */
  stop: () => void;
  /** Whether the ticker currently holds an active interval. */
  isRunning: () => boolean;
}

/**
 * Create an interval-based ticker for continuous playback. The ticker is inert
 * until `start` is called and is safe to `stop` repeatedly. Reduced-motion
 * gating is the caller's responsibility (see `shouldAutoPlay`).
 */
export function createTemporalTicker(speed: PlaybackSpeed): TemporalTicker {
  let handle: ReturnType<typeof setInterval> | null = null;
  const intervalMs = computeFrameAdvanceMs(speed);
  return {
    start(onTick: () => void) {
      if (handle !== null) return;
      handle = setInterval(onTick, intervalMs);
    },
    stop() {
      if (handle !== null) {
        clearInterval(handle);
        handle = null;
      }
    },
    isRunning() {
      return handle !== null;
    },
  };
}
