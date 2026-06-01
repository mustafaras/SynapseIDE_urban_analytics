import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { MAP_QUICK_ACTIONS, MAP_WORKSPACE_VIEWS } from "../mapExperience";
import {
  MAP_SURFACE_INVENTORY,
  MAP_WORKBENCH_TARGET_HOMES,
  getMapSurfaceInventoryByHome,
} from "../navigation";

const toolbarPath = "src/centerpanel/components/map/MapToolbar.tsx";
const compositionPath = "src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx";
const shellPath = "src/centerpanel/components/map/MapWorkspaceShell.tsx";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function sourceSlice(source: string, startNeedle: string, endNeedle: string): string {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  expect(start, `Missing source marker ${startNeedle}`).toBeGreaterThanOrEqual(0);
  expect(end, `Missing source marker ${endNeedle}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

function inventorySourceIdsForKinds(kinds: readonly string[]): Set<string> {
  return new Set(
    MAP_SURFACE_INVENTORY
      .filter((entry) => kinds.includes(entry.kind))
      .map((entry) => entry.sourceId),
  );
}

function missingFromInventory(sourceIds: Iterable<string>, inventoryIds: Set<string>): string[] {
  return [...sourceIds].filter((sourceId) => !inventoryIds.has(sourceId)).sort();
}

function extractToolbarCommandIds(toolbarSource: string): Set<string> {
  const commandIds = new Set<string>();
  const toolbarBuilderSource = sourceSlice(
    toolbarSource,
    "function buildToolbarCommands",
    "function ToolbarCommandButton",
  );

  for (const match of toolbarBuilderSource.matchAll(/\bid:\s*"([^"]+)"/g)) {
    commandIds.add(match[1]);
  }

  const drawToolsSource = sourceSlice(toolbarSource, "const DRAW_TOOLS", "const ROLE_LABELS");
  for (const match of drawToolsSource.matchAll(/\bid:\s*"([^"]+)"/g)) {
    commandIds.add(`draw-${match[1]}`);
  }

  if (toolbarSource.includes('id: "command-palette"')) {
    commandIds.add("command-palette");
  }

  if (toolbarSource.includes("id: `processing:${tool.toolId}`")) {
    commandIds.add("processing:*");
  }

  return commandIds;
}

function extractCompositionShowStateIds(compositionSource: string): Set<string> {
  const stateIds = new Set<string>();
  for (const match of compositionSource.matchAll(/const\s+\[\s*(show[A-Za-z0-9]+)\s*,\s*setShow[A-Za-z0-9]+\s*\]\s*=\s*useState/g)) {
    stateIds.add(match[1]);
  }

  if (compositionSource.includes("showWorkflowDrawer,")) {
    stateIds.add("showWorkflowDrawer");
  }

  return stateIds;
}

function extractActivityRailIds(compositionSource: string): Set<string> {
  const railSource = [
    sourceSlice(compositionSource, "const activityRailItems = [", "const activityRailBottomItems = ["),
    sourceSlice(compositionSource, "const activityRailBottomItems = [", "return createPortal"),
  ].join("\n");

  return new Set([...railSource.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]));
}

function extractHiddenToggleIds(compositionSource: string): Set<string> {
  return new Set([...compositionSource.matchAll(/data-testid="(toggle-[^"]+)"/g)].map((match) => match[1]));
}

describe("Map surface inventory", () => {
  it("uses unique inventory IDs and stable target homes", () => {
    const inventoryIds = MAP_SURFACE_INVENTORY.map((entry) => entry.id);
    const targetHomes = new Set(MAP_WORKBENCH_TARGET_HOMES);

    expect(new Set(inventoryIds).size).toBe(inventoryIds.length);
    expect(MAP_SURFACE_INVENTORY.length).toBeGreaterThan(100);

    for (const entry of MAP_SURFACE_INVENTORY) {
      expect(entry.sourceId.trim(), `${entry.id} has a source ID`).not.toBe("");
      expect(entry.label.trim(), `${entry.id} has a label`).not.toBe("");
      expect(entry.currentSurface.trim(), `${entry.id} has a current surface`).not.toBe("");
      expect(entry.targetSurface.trim(), `${entry.id} has a target surface`).not.toBe("");
      expect(targetHomes.has(entry.targetHome), `${entry.id} target home is declared`).toBe(true);
    }
  });

  it("maps every current MapToolbar command and palette command", () => {
    const toolbarSource = readRepoFile(toolbarPath);
    const sourceCommandIds = extractToolbarCommandIds(toolbarSource);
    const inventoryCommandIds = inventorySourceIdsForKinds([
      "toolbar-command",
      "command-palette",
      "processing-palette-command",
    ]);

    expect(missingFromInventory(sourceCommandIds, inventoryCommandIds)).toEqual([]);
  });

  it("maps every modal show-state flag that affects a panel, drawer, dialog, or overlay", () => {
    const compositionSource = readRepoFile(compositionPath);
    const sourceStateIds = extractCompositionShowStateIds(compositionSource);
    const inventorySourceIds = new Set(MAP_SURFACE_INVENTORY.map((entry) => entry.sourceId));

    expect(missingFromInventory(sourceStateIds, inventorySourceIds)).toEqual([]);
  });

  it("maps the current activity rail items", () => {
    const compositionSource = readRepoFile(compositionPath);
    const railIds = extractActivityRailIds(compositionSource);
    const inventoryRailIds = inventorySourceIdsForKinds(["activity-rail-item"]);

    expect(missingFromInventory(railIds, inventoryRailIds)).toEqual([]);
  });

  it("maps hidden test-only scene toggles so later shell work cannot forget them", () => {
    const compositionSource = readRepoFile(compositionPath);
    const hiddenToggleIds = extractHiddenToggleIds(compositionSource);
    const inventoryHiddenToggleIds = inventorySourceIdsForKinds(["hidden-toggle"]);

    expect(hiddenToggleIds.size).toBeGreaterThan(0);
    expect(missingFromInventory(hiddenToggleIds, inventoryHiddenToggleIds)).toEqual([]);
  });

  it("maps workspace views and cockpit quick actions", () => {
    const workspaceIds = new Set(MAP_WORKSPACE_VIEWS.map((view) => view.id));
    const quickActionIds = new Set(MAP_QUICK_ACTIONS.map((action) => action.id));
    const inventoryWorkspaceIds = inventorySourceIdsForKinds(["workspace-view"]);
    const inventoryQuickActionIds = inventorySourceIdsForKinds(["quick-action"]);

    expect(missingFromInventory(workspaceIds, inventoryWorkspaceIds)).toEqual([]);
    expect(missingFromInventory(quickActionIds, inventoryQuickActionIds)).toEqual([]);
  });

  it("keeps major modal components, dialogs, drawers, overlays, and status surfaces inventoried", () => {
    const requiredSurfaceIds = [
      "MapLayerManager",
      "MapSelectionTools",
      "MapLegendOverlay",
      "MapPerformanceBudgetBanner",
      "WorkflowPreviewOverlay",
      "MapContextMenu",
      "MapAnnotationLayer",
      "MapStatusBarWithCursor",
      "inspectorLayerId",
      "attributeTableLayerId",
      "pointSymbologyLayerId",
      "activeUrbanMethodPreview",
      "reportHandoffDraft",
      "selectionStatsSummary",
      "isFlowDispatchDialogOpen",
      "pendingImportPreview",
      "pendingCsvImport",
      "pendingColumnarImport",
      "isDragActive",
      "dispatchFeedback",
      "activeTemporalLayer",
      "temporalStoreFrameCount",
      "hidden-local-file-input",
    ];
    const inventorySourceIds = new Set(MAP_SURFACE_INVENTORY.map((entry) => entry.sourceId));

    expect(missingFromInventory(requiredSurfaceIds, inventorySourceIds)).toEqual([]);
  });

  it("does not change runtime rendering by importing the inventory into live shell files", () => {
    const liveShellSources = [
      readRepoFile(toolbarPath),
      readRepoFile(compositionPath),
      readRepoFile(shellPath),
    ].join("\n");

    expect(liveShellSources).not.toContain("navigation/mapSurfaceInventory");
    expect(liveShellSources).not.toContain("../navigation");
    expect(liveShellSources).not.toContain("./navigation");
  });

  it("has target-home coverage for all future workbench destinations", () => {
    for (const targetHome of MAP_WORKBENCH_TARGET_HOMES) {
      expect(getMapSurfaceInventoryByHome(targetHome).length, targetHome).toBeGreaterThan(0);
    }
  });
});
