import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Viewport slice.
 * Persistence: mixed. Durable camera/base-map preferences are persisted;
 * modal openness and fit-bounds handoff requests stay session-only.
 */
export const viewportSlicePolicy = defineMapExplorerSlicePolicy({
  id: "viewport",
  label: "Viewport and modal lifecycle",
  persistence: "mixed",
  stateKeys: [
    "isOpen",
    "center",
    "zoom",
    "bearing",
    "pitch",
    "pendingFitBounds",
    "lastExplicitFitRequest",
    "activeBaseLayer",
  ],
  actionKeys: [
    "open",
    "close",
    "toggle",
    "setViewport",
    "applyImmediateViewport",
    "requestFitBounds",
    "consumePendingFitBounds",
    "clearLastExplicitFitRequest",
    "setBaseLayer",
    "restoreProjectState",
    "clearProjectContent",
  ],
  persistedKeys: ["center", "zoom", "bearing", "pitch", "activeBaseLayer"],
  transientKeys: ["isOpen", "pendingFitBounds", "lastExplicitFitRequest"],
  heavyGeometryKeys: [],
  rationale: "Camera and base-map choices are lightweight restore context; lifecycle and fit requests are live UI coordination.",
});