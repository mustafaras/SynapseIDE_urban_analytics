import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Selection slice.
 * Persistence: mixed. Feature ID selections are small enough to restore; live
 * editor focus (`selectedFeatureId`) is an ephemeral drawing interaction.
 */
export const selectionSlicePolicy = defineMapExplorerSlicePolicy({
  id: "selection",
  label: "Feature selection metadata",
  persistence: "mixed",
  stateKeys: ["selectedFeatureIds", "selectedFeatureId"],
  actionKeys: ["setSelectedFeatures", "clearSelectedFeatures", "setSelectedFeatureId"],
  persistedKeys: ["selectedFeatureIds"],
  transientKeys: ["selectedFeatureId"],
  heavyGeometryKeys: [],
  rationale: "Selection IDs are bridge-safe metadata; focused drawing feature state is live UI state.",
});