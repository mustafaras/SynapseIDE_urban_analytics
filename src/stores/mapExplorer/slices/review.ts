import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Review slice.
 * Persistence: transient. Review sessions are auditable exports/runtime logs;
 * this prompt keeps them out of local UI persistence until an explicit export.
 */
export const reviewSlicePolicy = defineMapExplorerSlicePolicy({
  id: "review",
  label: "Review timeline session",
  persistence: "transient",
  stateKeys: ["reviewSession"],
  actionKeys: ["addMapReviewEvent", "updateMapReviewEventStatus", "clearMapReviewSession"],
  persistedKeys: [],
  transientKeys: ["reviewSession"],
  heavyGeometryKeys: [],
  rationale: "Review timelines are reconstructable/exportable audit data, not silent localStorage state.",
});