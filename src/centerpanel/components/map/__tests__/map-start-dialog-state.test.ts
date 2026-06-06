import { describe, expect, it } from "vitest";

import {
  createInitialMapStartDialogState,
  dismissMapStartDialog,
  getMapStartDialogQuickActionHandoff,
  hasMapStartDialogWorkspaceContent,
  normalizeLegacyMapStartDialogDismissedAt,
  normalizeMapStartDialogState,
  openMapStartDialog,
  resolveInitialMapStartDialogReason,
  type MapStartDialogContext,
} from "../mapStartDialogState";

const EMPTY_CONTEXT: MapStartDialogContext = {
  selectedProjectId: null,
  layerCount: 0,
  pinCount: 0,
  drawnFeatureCount: 0,
  annotationCount: 0,
  measurementCount: 0,
};

describe("map start dialog state", () => {
  it("opens for an empty workspace without coupling the reason to workspace tabs", () => {
    const state = createInitialMapStartDialogState(EMPTY_CONTEXT);

    expect(state).toMatchObject({
      open: true,
      reason: "no-project",
      dismissedAt: null,
      lastAction: null,
    });
  });

  it("uses no-layers when a project exists but no map content is loaded", () => {
    expect(resolveInitialMapStartDialogReason({
      ...EMPTY_CONTEXT,
      selectedProjectId: "proj-istanbul",
    })).toBe("no-layers");
  });

  it("does not reopen the launch dialog for restored workspace content", () => {
    const context = {
      ...EMPTY_CONTEXT,
      selectedProjectId: "proj-istanbul",
      layerCount: 1,
    };

    expect(hasMapStartDialogWorkspaceContent(context)).toBe(true);
    expect(createInitialMapStartDialogState(context)).toEqual({
      open: false,
      reason: null,
      dismissedAt: null,
      lastAction: null,
    });
  });

  it("records deterministic close, escape, continue, import, project load, and demo pack exits", () => {
    const opened = openMapStartDialog("user-requested");

    expect(dismissMapStartDialog(opened, "close", "2026-06-05T10:00:00.000Z")).toMatchObject({
      open: false,
      reason: null,
      dismissedAt: "2026-06-05T10:00:00.000Z",
      lastAction: "close",
    });
    expect(dismissMapStartDialog(opened, "escape", "2026-06-05T10:01:00.000Z").lastAction).toBe("escape");
    expect(dismissMapStartDialog(opened, "continue", "2026-06-05T10:02:00.000Z").lastAction).toBe("continue");
    expect(dismissMapStartDialog(opened, "import", "2026-06-05T10:03:00.000Z").lastAction).toBe("import");
    expect(dismissMapStartDialog(opened, "project-load", "2026-06-05T10:04:00.000Z").lastAction).toBe("project-load");
    expect(dismissMapStartDialog(opened, "demo-pack", "2026-06-05T10:05:00.000Z").lastAction).toBe("demo-pack");
  });

  it("maps quick actions to launch handoffs without persisting readiness metrics", () => {
    expect(getMapStartDialogQuickActionHandoff("import-data")).toBe("import");
    expect(getMapStartDialogQuickActionHandoff("review-layers")).toBe("continue");
    expect(getMapStartDialogQuickActionHandoff("draw-aoi")).toBe("continue");
  });

  it("normalizes old cockpit and launch dismissal flags without honoring forced-open flags", () => {
    expect(normalizeLegacyMapStartDialogDismissedAt({
      showCockpit: false,
    })).toBe("1970-01-01T00:00:00.000Z");
    expect(normalizeLegacyMapStartDialogDismissedAt({
      launchDialog: { dismissedAt: "2026-06-05T09:00:00.000Z" },
    })).toBe("2026-06-05T09:00:00.000Z");
    expect(normalizeMapStartDialogState({
      showCockpit: true,
    })).toEqual({
      open: false,
      reason: null,
      dismissedAt: null,
      lastAction: null,
    });
  });

  it("keeps a prior dismissal from reopening in the same launch session", () => {
    const dismissed = dismissMapStartDialog(
      openMapStartDialog("no-layers"),
      "dismiss",
      "2026-06-05T11:00:00.000Z",
    );

    expect(createInitialMapStartDialogState(EMPTY_CONTEXT, dismissed)).toEqual({
      open: false,
      reason: null,
      dismissedAt: "2026-06-05T11:00:00.000Z",
      lastAction: null,
    });
  });
});
