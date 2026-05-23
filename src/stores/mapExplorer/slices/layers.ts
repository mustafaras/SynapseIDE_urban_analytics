import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Layers slice.
 * Persistence: mixed. Only selected analysis result IDs are durable; overlay
 * layer records can carry sourceData and must remain out of persisted storage.
 */
export const layersSlicePolicy = defineMapExplorerSlicePolicy({
  id: "layers",
  label: "Overlay layer registry",
  persistence: "mixed",
  stateKeys: ["overlayLayers", "activeAnalysisResultLayerIds"],
  actionKeys: [
    "addOverlayLayer",
    "removeOverlayLayer",
    "toggleLayerVisibility",
    "setLayerOpacity",
    "updateLayerMetadata",
    "reorderLayers",
    "replaceOverlayLayers",
    "setActiveAnalysisResultLayers",
  ],
  persistedKeys: ["activeAnalysisResultLayerIds"],
  transientKeys: ["overlayLayers"],
  heavyGeometryKeys: ["overlayLayers"],
  rationale: "Layer summaries can be restored from project/source handles later; raw sourceData is potentially huge geometry.",
});