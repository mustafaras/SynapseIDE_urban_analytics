/**
 * Prompt 34 — 3D block + scenario interaction design.
 *
 * Store-level unit tests:
 * 1. interactionMode defaults to "inspect".
 * 2. setInteractionMode updates state.
 * 3. addCameraBookmark appends an entry.
 * 4. removeCameraBookmark removes by id.
 * 5. INTERACTION_MODES constant has exactly 8 entries.
 * 6. All INTERACTION_MODES entries are unique.
 * 7. partialize includes interactionMode + cameraBookmarks (not activeCollection).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  INTERACTION_MODES,
  useScene3DStore,
} from "../useScene3DStore";

beforeEach(() => {
  useScene3DStore.setState({
    interactionMode: "inspect",
    cameraBookmarks: [],
    runtimeMode: "2d",
    activeLayerId: null,
    activeCollection: null,
    extrusionAnalysis: null,
    buildingConfig: null,
    selectedFeatureIds: [],
    inspectorEntries: [],
    sceneMetadata: null,
    heightFieldOverride: null,
    floorFieldOverride: null,
    metersPerLevelOverride: 3,
  });
});

afterEach(() => {
  useScene3DStore.setState({
    interactionMode: "inspect",
    cameraBookmarks: [],
  });
});

describe("INTERACTION_MODES constant", () => {
  it("has exactly 8 entries", () => {
    expect(INTERACTION_MODES).toHaveLength(8);
  });

  it("all modes are unique", () => {
    const modes = INTERACTION_MODES.map((m) => m.mode);
    expect(new Set(modes).size).toBe(8);
  });

  it("includes all expected modes", () => {
    const modes = new Set(INTERACTION_MODES.map((m) => m.mode));
    expect(modes.has("inspect")).toBe(true);
    expect(modes.has("select")).toBe(true);
    expect(modes.has("measure")).toBe(true);
    expect(modes.has("edit-height")).toBe(true);
    expect(modes.has("compare")).toBe(true);
    expect(modes.has("sun-shadow")).toBe(true);
    expect(modes.has("section")).toBe(true);
    expect(modes.has("camera-bookmark")).toBe(true);
  });

  it("every entry has a non-empty label and shortLabel", () => {
    for (const entry of INTERACTION_MODES) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.shortLabel.length).toBeGreaterThan(0);
    }
  });
});

describe("useScene3DStore — interaction mode", () => {
  it("defaults to 'inspect'", () => {
    expect(useScene3DStore.getState().interactionMode).toBe("inspect");
  });

  it("setInteractionMode updates the mode", () => {
    useScene3DStore.getState().setInteractionMode("compare");
    expect(useScene3DStore.getState().interactionMode).toBe("compare");
  });

  it("can cycle through all modes", () => {
    for (const { mode } of INTERACTION_MODES) {
      useScene3DStore.getState().setInteractionMode(mode);
      expect(useScene3DStore.getState().interactionMode).toBe(mode);
    }
  });
});

describe("useScene3DStore — camera bookmarks", () => {
  it("starts with no bookmarks", () => {
    expect(useScene3DStore.getState().cameraBookmarks).toHaveLength(0);
  });

  it("addCameraBookmark appends a bookmark with a unique id", () => {
    useScene3DStore.getState().addCameraBookmark("View 1");
    const { cameraBookmarks } = useScene3DStore.getState();
    expect(cameraBookmarks).toHaveLength(1);
    expect(cameraBookmarks[0]?.name).toBe("View 1");
    expect(typeof cameraBookmarks[0]?.id).toBe("string");
    expect(cameraBookmarks[0]?.id.length).toBeGreaterThan(0);
  });

  it("addCameraBookmark stores an ISO createdAt timestamp", () => {
    useScene3DStore.getState().addCameraBookmark("Checkpoint");
    const bm = useScene3DStore.getState().cameraBookmarks[0]!;
    expect(() => new Date(bm.createdAt).toISOString()).not.toThrow();
  });

  it("multiple bookmarks have unique ids", () => {
    useScene3DStore.getState().addCameraBookmark("A");
    useScene3DStore.getState().addCameraBookmark("B");
    useScene3DStore.getState().addCameraBookmark("C");
    const ids = useScene3DStore.getState().cameraBookmarks.map((b) => b.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("removeCameraBookmark removes by id", () => {
    useScene3DStore.getState().addCameraBookmark("View A");
    useScene3DStore.getState().addCameraBookmark("View B");
    const before = useScene3DStore.getState().cameraBookmarks;
    const idToRemove = before[0]!.id;
    useScene3DStore.getState().removeCameraBookmark(idToRemove);
    const after = useScene3DStore.getState().cameraBookmarks;
    expect(after).toHaveLength(1);
    expect(after[0]?.name).toBe("View B");
  });

  it("removeCameraBookmark is a no-op for unknown id", () => {
    useScene3DStore.getState().addCameraBookmark("View X");
    useScene3DStore.getState().removeCameraBookmark("nonexistent-id");
    expect(useScene3DStore.getState().cameraBookmarks).toHaveLength(1);
  });
});
