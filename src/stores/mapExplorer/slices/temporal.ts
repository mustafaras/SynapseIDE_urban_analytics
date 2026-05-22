import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Temporal and measurement slice.
 * Persistence: transient. Playback cursor, measurement mode, and measurement
 * geometries are live workspace state and are omitted from localStorage.
 */
export const temporalSlicePolicy = defineMapExplorerSlicePolicy({
  id: "temporal",
  label: "Temporal playback and measurements",
  persistence: "transient",
  stateKeys: [
    "currentTimestep",
    "isPlaying",
    "playbackSpeed",
    "timeRange",
    "activeMeasureTool",
    "measureUnit",
    "measurements",
  ],
  actionKeys: [
    "setCurrentTimestep",
    "setIsPlaying",
    "setPlaybackSpeed",
    "setTimeRange",
    "setActiveMeasureTool",
    "setMeasureUnit",
    "addMeasurement",
    "removeMeasurement",
    "clearMeasurements",
  ],
  persistedKeys: [],
  transientKeys: [
    "currentTimestep",
    "isPlaying",
    "playbackSpeed",
    "timeRange",
    "activeMeasureTool",
    "measureUnit",
    "measurements",
  ],
  heavyGeometryKeys: ["measurements"],
  rationale: "Temporal cursor and measurement overlays are live analysis affordances, not durable source metadata.",
});