import { describe, expect, it } from "vitest";

import type { MapRightDockPanel } from "../mapDocking";
import {
  buildMapRightDockRouteAnnouncement,
  closeMapRightDockRouteState,
  createMapRightDockRoute,
  createMapRightDockRouteFromBottomTab,
  deriveContextualToolPanelVisibility,
  EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE,
  getMapActivityIdForRightDockPanel,
  getRightDockPanelForBottomTab,
  isFloatingModalRoutePanel,
  isHostRenderedRoutePanel,
  MAP_EXTERNALLY_RENDERED_ROUTE_PANELS,
  MAP_FLOATING_MODAL_ROUTE_PANELS,
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

  it("supports single-click inspector open and second-click close semantics", () => {
    const inspectorRoute = createMapRightDockRoute("inspect", {
      source: "toolbar",
      detail: "single-click inspector",
      focusReturn: "trigger",
    });

    const opened = openMapRightDockRouteState(EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE, inspectorRoute);
    expect(opened.activeRoute?.panel).toBe("inspect");
    expect(opened.activeRoute?.source).toBe("toolbar");
    expect(opened.activeRoute?.focusReturn).toBe("trigger");

    const closed = closeMapRightDockRouteState(opened);
    expect(closed.activeRoute).toBeNull();
    expect(closed.lastRoute?.panel).toBe("inspect");
  });
});

describe("contextual tool panel single source of truth (p04)", () => {
  it("derives pins / draw / measure visibility from the active route only", () => {
    expect(deriveContextualToolPanelVisibility("pins")).toEqual({
      showPinSidebar: true,
      showDrawPanel: false,
      showMeasurePanel: false,
    });
    expect(deriveContextualToolPanelVisibility("draw")).toEqual({
      showPinSidebar: false,
      showDrawPanel: true,
      showMeasurePanel: false,
    });
    expect(deriveContextualToolPanelVisibility("measure")).toEqual({
      showPinSidebar: false,
      showDrawPanel: false,
      showMeasurePanel: true,
    });
    // A non-tool route (or no route) leaves every contextual tool panel closed.
    expect(deriveContextualToolPanelVisibility("inspect")).toEqual({
      showPinSidebar: false,
      showDrawPanel: false,
      showMeasurePanel: false,
    });
    expect(deriveContextualToolPanelVisibility(null)).toEqual({
      showPinSidebar: false,
      showDrawPanel: false,
      showMeasurePanel: false,
    });
  });

  it("never projects two contextual tool panels open at once for any panel", () => {
    for (const panel of MAP_RIGHT_DOCK_PANEL_IDS) {
      const visibility = deriveContextualToolPanelVisibility(panel);
      const openCount = [visibility.showPinSidebar, visibility.showDrawPanel, visibility.showMeasurePanel].filter(Boolean).length;
      expect(openCount, panel).toBeLessThanOrEqual(1);
    }
  });

  it("flips the projected tool visibility as the single route is opened, switched, then closed", () => {
    const drawRoute = createMapRightDockRoute("draw", { source: "toolbar" });
    const measureRoute = createMapRightDockRoute("measure", { source: "toolbar" });

    const opened = openMapRightDockRouteState(EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE, drawRoute);
    expect(deriveContextualToolPanelVisibility(opened.activeRoute?.panel ?? null).showDrawPanel).toBe(true);

    const switched = switchMapRightDockRouteState(opened, measureRoute);
    const switchedVisibility = deriveContextualToolPanelVisibility(switched.activeRoute?.panel ?? null);
    expect(switchedVisibility.showDrawPanel).toBe(false);
    expect(switchedVisibility.showMeasurePanel).toBe(true);

    const closed = closeMapRightDockRouteState(switched);
    expect(deriveContextualToolPanelVisibility(closed.activeRoute?.panel ?? null)).toEqual({
      showPinSidebar: false,
      showDrawPanel: false,
      showMeasurePanel: false,
    });
  });

  it("classifies the drawing modal as a floating-modal route and pins/draw as externally rendered", () => {
    expect([...MAP_FLOATING_MODAL_ROUTE_PANELS]).toEqual(["draw"]);
    expect(isFloatingModalRoutePanel("draw")).toBe(true);
    expect(isFloatingModalRoutePanel("measure")).toBe(false);
    expect(isFloatingModalRoutePanel("pins")).toBe(false);
    expect(isFloatingModalRoutePanel(null)).toBe(false);

    // The pin sidebar and drawing modal render in dedicated surfaces, so the
    // shared right-dock host must stay hidden for them (no empty "No routed
    // content" shell behind the dedicated surface).
    expect(new Set(MAP_EXTERNALLY_RENDERED_ROUTE_PANELS)).toEqual(new Set(["pins", "draw"]));
    expect(isHostRenderedRoutePanel("pins")).toBe(false);
    expect(isHostRenderedRoutePanel("draw")).toBe(false);
    expect(isHostRenderedRoutePanel("measure")).toBe(true);
    expect(isHostRenderedRoutePanel("inspect")).toBe(true);
    expect(isHostRenderedRoutePanel(null)).toBe(false);
  });
});
