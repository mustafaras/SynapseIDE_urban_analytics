/**
 * Prompt 46 — temporal playback service surface. Import from here.
 */
export {
  BASE_FRAME_ADVANCE_MS,
  TEMPORAL_PLAYBACK_SPEEDS,
  buildFrameReference,
  buildTemporalEvidenceMetadata,
  buildTemporalStep,
  buildTemporalTimeRange,
  clampFrameIndex,
  computeFrameAdvanceMs,
  createTemporalTicker,
  framesHaveMetricChange,
  resolveNextFrameIndex,
  resolvePrevFrameIndex,
  shouldAutoPlay,
  summarizeFrameFeatures,
} from "./TemporalPlaybackEngine";
export type {
  BuildTemporalEvidenceInput,
  FrameFeatureSummary,
  TemporalFrameDefinition,
  TemporalRuntimeMode,
  TemporalTicker,
} from "./TemporalPlaybackEngine";

export { mergeTemporalEvidenceIntoMetadata } from "./temporalLayerHandoff";
