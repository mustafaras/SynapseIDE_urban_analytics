import { defineMapExplorerSlicePolicy } from "./types";

/**
 * AOI and drawing slice.
 * Persistence: mixed. The active AOI ID is lightweight context, while drawn
 * geometries are session/project payloads and must not be persisted in Zustand.
 */
export const aoiSlicePolicy = defineMapExplorerSlicePolicy({
  id: "aoi",
  label: "AOI and drawing state",
  persistence: "mixed",
  stateKeys: ["activeAoiId", "activeDrawTool", "drawnFeatures"],
  actionKeys: [
    "setActiveAoi",
    "setActiveDrawTool",
    "addDrawnFeature",
    "removeDrawnFeature",
    "updateDrawnFeature",
    "clearDrawnFeatures",
    "replaceDrawnFeatures",
    "getAoi",
  ],
  persistedKeys: ["activeAoiId"],
  transientKeys: ["activeDrawTool", "drawnFeatures"],
  heavyGeometryKeys: ["drawnFeatures"],
  rationale: "AOI identity is bridge metadata; drawn geometries are potentially large and belong in project/source payloads.",
});