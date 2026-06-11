import { describe, expect, it } from "vitest";

import type { MapRightDockPanel } from "../mapDocking";
import {
  buildMapRightDockRouteAnnouncement,
  closeMapRightDockRouteState,
  createMapRightDockRoute,
  createMapRightDockRouteFromBottomTab,
  EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
  getMapActivityIdForRightDockPanel,
  getRightDockPanelForBottomTab,
  MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL,
  MAP_RIGHT_DOCK_PANEL_DEFINITIONS,
  MAP_RIGHT_DOCK_PANEL_IDS,
  openMapRightDockRouteState,
  switchMapRightDockRouteState,
} from "../mapRightDockRoutes";
import { MAP_LEGACY_BOTTOM_PANEL_TAB_DEFINITIONS } from "../mapLegacyBottomTabs";

const EXPECTED_RIGHT_DOCK_PANEL_IDS = [
  "inspect",
  "style",
  "attributes",
  "problems",
  "timeline",
  "tasks",
  "diagnostics",
  "pins",
  "draw",
  "measure",
  "selection",
  "scientificQA",
  "qa",
  "workflow",
  "report",
  "performance",
  "collaboration",
  "urbanMethod",
] as const satisfies readonly MapRightDockPanel[];

describe("mapRightDockRoutes", () => {
  it("defines the expanded right dock panel route catalog", () => {
    expect(MAP_RIGHT_DOCK_PANEL_IDS).toEqual([...EXPECTED_RIGHT_DOCK_PANEL_IDS]);
    for (const panelId of EXPECTED_RIGHT_DOCK_PANEL_IDS) {
      const definition = MAP_RIGHT_DOCK_PANEL_DEFINITIONS[panelId];
      expect(definition.id).toBe(panelId);
      expect(definition.label.trim(), panelId).not.toBe("");
      expect(definition.serializable, panelId).toBe(true);
      expect(getMapActivityIdForRightDockPanel(panelId), panelId).toBe(definition.activityId);
    }
  });

  it("maps every old bottom tab to one explicit right dock destination", () => {
    const bottomTabIds = MAP_LEGACY_BOTTOM_PANEL_TAB_DEFINITIONS.map((tab) => tab.id).sort();
    expect(Object.keys(MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL).sort()).toEqual(bottomTabIds);
    expect(MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL).toEqual({
      problems: "problems",
      attributes: "attributes",
      timeline: "timeline",
      tasks: "tasks",
      diagnostics: "diagnostics",
      console: "diagnostics",
      measurements: "measure",
    });
    expect(getRightDockPanelForBottomTab("measurements")).toBe("measure");
  });

  it("creates serializable routes from old bottom tabs", () => {
    const route = createMapRightDockRouteFromBottomTab("diagnostics", {
      source: "status-bar",
      detail: "perf-segment",
    });

    expect(route).toEqual({
      panel: "diagnostics",
      source: "status-bar",
      legacyBottomTabId: "diagnostics",
      focusReturn: "trigger",
      detail: "perf-segment",
    });
    expect(JSON.parse(JSON.stringify(route))).toEqual(route);
    expect(buildMapRightDockRouteAnnouncement(route)).toBe("Diagnostics right dock route selected");
  });

  it("opens, switches, and closes route state without mutating previous state", () => {
    const problemsRoute = createMapRightDockRoute("problems", { source: "toolbar" });
    const attributesRoute = createMapRightDockRoute("attributes", { source: "status-bar" });

    const opened = openMapRightDockRouteState(EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE, problemsRoute);
    expect(opened.activeRoute).toBe(problemsRoute);
    expect(opened.lastRoute).toBeNull();
    expect(EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE.activeRoute).toBeNull();

    const switched = switchMapRightDockRouteState(opened, attributesRoute);
    expect(switched.activeRoute).toBe(attributesRoute);
    expect(switched.lastRoute).toBe(problemsRoute);

    const closed = closeMapRightDockRouteState(switched);
    expect(closed.activeRoute).toBeNull();
    expect(closed.lastRoute).toBe(attributesRoute);
  });
});
