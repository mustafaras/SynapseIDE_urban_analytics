import { defineMapExplorerSlicePolicy } from "./types";

/**
 * QA slice.
 * Persistence: transient. Scientific QA and current bounds are derived from
 * live layers/viewport and should be recomputed or restored from artifacts.
 */
export const qaSlicePolicy = defineMapExplorerSlicePolicy({
  id: "qa",
  label: "Scientific QA and live bounds",
  persistence: "transient",
  stateKeys: ["scientificQA", "currentMapBounds", "currentMapBoundsUpdatedAt"],
  actionKeys: ["setScientificQA", "setCurrentMapBounds"],
  persistedKeys: [],
  transientKeys: ["scientificQA", "currentMapBounds", "currentMapBoundsUpdatedAt"],
  heavyGeometryKeys: [],
  rationale: "QA can go stale when sources change; live map bounds are not durable analytical context.",
});