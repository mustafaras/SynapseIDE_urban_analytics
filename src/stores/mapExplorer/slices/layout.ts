import { defineMapExplorerSlicePolicy } from "./types";

/**
 * Layout and annotation slice.
 * Persistence: mixed. User UI widths, map-first/collapsed chrome mode,
 * pins, bookmarks, and bounded text annotations are lightweight restore
 * state; selected annotation/tool focus is live.
 */
export const layoutSlicePolicy = defineMapExplorerSlicePolicy({
  id: "layout",
  label: "Layout preferences and lightweight map marks",
  persistence: "mixed",
  stateKeys: [
    "pins",
    "bookmarks",
    "annotations",
    "annotationToolSettings",
    "selectedAnnotationId",
    "activeTool",
    "layoutPreferences",
  ],
  actionKeys: [
    "addPin",
    "removePin",
    "updatePin",
    "clearPins",
    "replacePins",
    "addMapBookmark",
    "renameMapBookmark",
    "removeMapBookmark",
    "restoreMapBookmark",
    "replaceMapBookmarks",
    "clearMapBookmarks",
    "setAnnotationToolSettings",
    "addMapAnnotation",
    "updateMapAnnotation",
    "moveMapAnnotation",
    "removeMapAnnotation",
    "setSelectedAnnotationId",
    "replaceMapAnnotations",
    "clearMapAnnotations",
    "setActiveTool",
    "setLayoutPreferences",
    "restoreDefaultLayoutPreferences",
  ],
  persistedKeys: ["pins", "bookmarks", "annotations", "annotationToolSettings", "layoutPreferences"],
  transientKeys: ["selectedAnnotationId", "activeTool"],
  heavyGeometryKeys: [],
  rationale: "Bounded lightweight marks, panel widths, and map-first/collapsed chrome mode are restore UX; active tool/selection focus is session-only.",
});
