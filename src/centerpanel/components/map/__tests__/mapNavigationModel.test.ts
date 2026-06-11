import { describe, expect, it } from "vitest";

import {
  buildMapInventoryNavigationBinding,
  getMapActivityDefinition,
  getMapInventoryNavigationBinding,
  MAP_ACTIVITY_DEFINITIONS,
  MAP_INSPECTOR_CONTEXT_DEFINITIONS,
  MAP_INVENTORY_NAVIGATION_BINDINGS,
  MAP_PRIMARY_ACTIVITY_ORDER,
  MAP_SIDEBAR_TAB_DEFINITIONS,
  MAP_SURFACE_INVENTORY,
  MAP_TASK_LENSES,
  MAP_UTILITY_ACTIVITY_ORDER,
} from "../navigation";
import { MAP_RIGHT_DOCK_PANEL_IDS } from "../mapRightDockRoutes";

const allActivityIds = [...MAP_PRIMARY_ACTIVITY_ORDER, ...MAP_UTILITY_ACTIVITY_ORDER];
const EXPECTED_ACTIVITY_RIGHT_DOCK_DEFAULTS = {
  analyze: "tasks",
  data: "tasks",
  diagnostics: "diagnostics",
  layers: "attributes",
  publish: "tasks",
  qa: "problems",
  review: "timeline",
  scene: "timeline",
} as const;
const EXPECTED_TASK_LENS_RIGHT_DOCK_PRIORITIES = {
  analyst: ["problems", "attributes", "tasks", "diagnostics"],
  planner: ["attributes", "timeline", "problems", "tasks"],
  publisher: ["timeline", "problems", "tasks", "attributes"],
  reviewer: ["problems", "timeline", "diagnostics"],
} as const;

function uniqueValues<T>(values: readonly T[]): Set<T> {
  return new Set(values);
}

function expectUnique(values: readonly string[], label: string): void {
  expect(uniqueValues(values).size, label).toBe(values.length);
}

describe("mapNavigationModel", () => {
  it("defines the premium activity order exactly", () => {
    expect(MAP_PRIMARY_ACTIVITY_ORDER).toEqual([
      "overview",
      "data",
      "layers",
      "analyze",
      "style",
      "scene",
      "publish",
    ]);
    expect(MAP_UTILITY_ACTIVITY_ORDER).toEqual([
      "qa",
      "review",
      "diagnostics",
      "extensions",
    ]);
  });

  it("defines stable activity metadata for labels, accessibility, keyboard order, and placement", () => {
    expect(MAP_ACTIVITY_DEFINITIONS.map((activity) => activity.id)).toEqual(allActivityIds);
    expectUnique(MAP_ACTIVITY_DEFINITIONS.map((activity) => activity.id), "activity ids");

    const primaryMnemonics = MAP_ACTIVITY_DEFINITIONS
      .filter((activity) => activity.placement === "primary-rail")
      .map((activity) => activity.mnemonic);
    const utilityMnemonics = MAP_ACTIVITY_DEFINITIONS
      .filter((activity) => activity.placement === "utility-rail")
      .map((activity) => activity.mnemonic);
    expectUnique(primaryMnemonics, "primary mnemonics");
    expectUnique(utilityMnemonics, "utility mnemonics");

    for (const activity of MAP_ACTIVITY_DEFINITIONS) {
      expect(activity.label.trim(), activity.id).not.toBe("");
      expect(activity.ariaLabel, activity.id).toContain(activity.label);
      expect(activity.description.trim().length, activity.id).toBeGreaterThan(24);
      expect(activity.iconName.trim(), activity.id).not.toBe("");
      expect(activity.commandCategory.trim(), activity.id).not.toBe("");
      expect(activity.commandKeywords.length, activity.id).toBeGreaterThanOrEqual(4);
      expect(activity.mnemonic, activity.id).toMatch(/^[A-Z]$/);
    }
  });

  it("keeps sidebar tabs, inspector contexts, and right dock defaults reference-safe", () => {
    const activityIds = new Set(allActivityIds);
    const sidebarTabIds = new Set(MAP_SIDEBAR_TAB_DEFINITIONS.map((tab) => tab.id));
    const inspectorContextIds = new Set(MAP_INSPECTOR_CONTEXT_DEFINITIONS.map((context) => context.id));
    const rightDockPanelIds = new Set(MAP_RIGHT_DOCK_PANEL_IDS);

    expectUnique(MAP_SIDEBAR_TAB_DEFINITIONS.map((tab) => tab.id), "sidebar tab ids");
    expectUnique(MAP_INSPECTOR_CONTEXT_DEFINITIONS.map((context) => context.id), "inspector context ids");

    for (const tab of MAP_SIDEBAR_TAB_DEFINITIONS) {
      expect(activityIds.has(tab.activityId), tab.id).toBe(true);
      expect(tab.ariaLabel.toLowerCase(), tab.id).toContain(tab.label.toLowerCase());
      expect(tab.description.trim().length, tab.id).toBeGreaterThan(24);
    }

    for (const context of MAP_INSPECTOR_CONTEXT_DEFINITIONS) {
      expect(context.ariaLabel.toLowerCase(), context.id).toContain(context.label.toLowerCase());
      expect(context.description.trim().length, context.id).toBeGreaterThan(24);
    }

    for (const activity of MAP_ACTIVITY_DEFINITIONS) {
      if (activity.defaultSidebarTabId !== null) {
        expect(sidebarTabIds.has(activity.defaultSidebarTabId), activity.id).toBe(true);
      }
      if (activity.defaultInspectorContextId !== null) {
        expect(inspectorContextIds.has(activity.defaultInspectorContextId), activity.id).toBe(true);
      }
      if (activity.defaultRightDockPanelId !== null) {
        expect(rightDockPanelIds.has(activity.defaultRightDockPanelId), activity.id).toBe(true);
      }
    }
  });

  it("defines persona task lenses without hiding command palette access", () => {
    expect(MAP_TASK_LENSES.map((lens) => lens.id)).toEqual([
      "analyst",
      "planner",
      "reviewer",
      "publisher",
    ]);

    const activityIds = new Set(allActivityIds);
    const sidebarTabIds = new Set(MAP_SIDEBAR_TAB_DEFINITIONS.map((tab) => tab.id));
    const inspectorContextIds = new Set(MAP_INSPECTOR_CONTEXT_DEFINITIONS.map((context) => context.id));
    const rightDockPanelIds = new Set(MAP_RIGHT_DOCK_PANEL_IDS);

    for (const lens of MAP_TASK_LENSES) {
      expect(lens.ariaLabel, lens.id).toContain(lens.label);
      expect(lens.preserveCommandPalette, lens.id).toBe(true);
      expect(activityIds.has(lens.defaultActivityId), lens.id).toBe(true);
      expect(new Set(lens.activityPriority).size, lens.id).toBe(allActivityIds.length);
      expect(lens.activityPriority.every((activityId) => activityIds.has(activityId)), lens.id).toBe(true);
      expect(lens.sidebarTabPriority.every((tabId) => sidebarTabIds.has(tabId)), lens.id).toBe(true);
      expect(lens.inspectorContextPriority.every((contextId) => inspectorContextIds.has(contextId)), lens.id).toBe(true);
      expect(lens.rightDockPanelPriority.every((panelId) => rightDockPanelIds.has(panelId)), lens.id).toBe(true);
    }
  });

  it("links every Prompt 01 inventory item to the navigation model", () => {
    expect(MAP_INVENTORY_NAVIGATION_BINDINGS.length).toBe(MAP_SURFACE_INVENTORY.length);
    expectUnique(MAP_INVENTORY_NAVIGATION_BINDINGS.map((binding) => binding.inventoryId), "binding inventory ids");

    const inventoryIds = new Set(MAP_SURFACE_INVENTORY.map((entry) => entry.id));
    const activityIds = new Set(allActivityIds);
    const sidebarTabIds = new Set(MAP_SIDEBAR_TAB_DEFINITIONS.map((tab) => tab.id));
    const inspectorContextIds = new Set(MAP_INSPECTOR_CONTEXT_DEFINITIONS.map((context) => context.id));
    const rightDockPanelIds = new Set(MAP_RIGHT_DOCK_PANEL_IDS);

    for (const binding of MAP_INVENTORY_NAVIGATION_BINDINGS) {
      expect(inventoryIds.has(binding.inventoryId), binding.inventoryId).toBe(true);
      expect(activityIds.has(binding.activityId), binding.inventoryId).toBe(true);
      expect(getMapActivityDefinition(binding.activityId).placement, binding.inventoryId).toBe(binding.placement);
      expect(Object.prototype.hasOwnProperty.call(binding, "bottomPanelTabId"), binding.inventoryId).toBe(false);
      if (binding.sidebarTabId !== null) {
        expect(sidebarTabIds.has(binding.sidebarTabId), binding.inventoryId).toBe(true);
      }
      if (binding.inspectorContextId !== null) {
        expect(inspectorContextIds.has(binding.inspectorContextId), binding.inventoryId).toBe(true);
      }
      if (binding.rightDockPanelId !== null) {
        expect(rightDockPanelIds.has(binding.rightDockPanelId), binding.inventoryId).toBe(true);
      }
    }
  });

  it("links every inventory command to a target activity", () => {
    const commandKinds = new Set(["toolbar-command", "command-palette", "processing-palette-command"]);
    const commandEntries = MAP_SURFACE_INVENTORY.filter((entry) => commandKinds.has(entry.kind));

    expect(commandEntries.length).toBeGreaterThan(40);
    for (const entry of commandEntries) {
      const binding = getMapInventoryNavigationBinding(entry.id);
      expect(binding, entry.id).toBeDefined();
      expect(allActivityIds).toContain(binding?.activityId);
    }
  });

  it("uses right dock navigation defaults instead of bottom panel defaults", () => {
    const activityRightDockDefaults = Object.fromEntries(
      MAP_ACTIVITY_DEFINITIONS
        .filter((activity) => activity.defaultRightDockPanelId !== null)
        .map((activity) => [activity.id, activity.defaultRightDockPanelId]),
    );
    const taskLensRightDockPriorities = Object.fromEntries(
      MAP_TASK_LENSES.map((lens) => [lens.id, [...lens.rightDockPanelPriority]]),
    );

    expect(activityRightDockDefaults).toEqual(EXPECTED_ACTIVITY_RIGHT_DOCK_DEFAULTS);
    expect(taskLensRightDockPriorities).toEqual(EXPECTED_TASK_LENS_RIGHT_DOCK_PRIORITIES);

    for (const activity of MAP_ACTIVITY_DEFINITIONS) {
      expect(Object.prototype.hasOwnProperty.call(activity, "defaultBottomPanelTabId"), activity.id).toBe(false);
    }
    for (const lens of MAP_TASK_LENSES) {
      expect(Object.prototype.hasOwnProperty.call(lens, "bottomPanelTabPriority"), lens.id).toBe(false);
    }
  });

  it("keeps representative inventory routes in their planned homes", () => {
    expect(getMapInventoryNavigationBinding("toolbar.import")).toMatchObject({
      activityId: "data",
      sidebarTabId: "data-import",
    });
    expect(getMapInventoryNavigationBinding("toolbar.layers")).toMatchObject({
      activityId: "layers",
      sidebarTabId: "layers-stack",
    });
    expect(getMapInventoryNavigationBinding("toolbar.workflow")).toMatchObject({
      activityId: "analyze",
      inspectorContextId: "analysis-run",
      rightDockPanelId: "workflow",
    });
    expect(getMapInventoryNavigationBinding("toolbar.qa")).toMatchObject({
      activityId: "qa",
      rightDockPanelId: "problems",
    });
    expect(getMapInventoryNavigationBinding("hidden-toggle.raster")).toMatchObject({
      activityId: "scene",
      sidebarTabId: "scene-raster",
    });
    expect(getMapInventoryNavigationBinding("status.performance")).toMatchObject({
      activityId: "diagnostics",
      rightDockPanelId: "performance",
    });
    expect(getMapInventoryNavigationBinding("state.attributeTableLayerId")).toMatchObject({
      activityId: "layers",
      rightDockPanelId: "attributes",
    });
    expect(getMapInventoryNavigationBinding("toolbar.measure-results")).toMatchObject({
      activityId: "analyze",
      rightDockPanelId: "measure",
    });
    expect(getMapInventoryNavigationBinding("state.selectionStatsSummary")).toMatchObject({
      activityId: "analyze",
      rightDockPanelId: "selection",
    });
  });

  it("builds navigation bindings without mutating inventory entries", () => {
    const entry = MAP_SURFACE_INVENTORY.find((item) => item.id === "toolbar.export-geojson");
    expect(entry).toBeDefined();
    if (!entry) return;

    const before = { ...entry };
    const binding = buildMapInventoryNavigationBinding(entry);
    expect(binding).toMatchObject({
      inventoryId: "toolbar.export-geojson",
      activityId: "publish",
      sidebarTabId: "publish-data-export",
    });
    expect(entry).toEqual(before);
  });

});
