import { describe, expect, it } from "vitest";

import { MAP_QUICK_ACTIONS, MAP_WORKSPACE_VIEWS } from "../mapExperience";
import {
  getMapSurfaceInventoryByHome,
  MAP_SURFACE_INVENTORY,
  MAP_WORKBENCH_TARGET_HOMES,
} from "../navigation";

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

const MIGRATED_RIGHT_DOCK_TARGET_IDS = [
  "quick-action.review-problems",
  "rail.diagnostics.activity",
  "rail.qa",
  "state.activeTemporalLayer",
  "state.attributeTableLayerId",
  "state.showPerformanceDiagnostics",
  "state.showReviewTimeline",
  "state.showScientificQAPanel",
  "state.temporalStoreFrameCount",
  "toolbar.measure-results",
  "toolbar.performance-diagnostics",
  "toolbar.qa",
  "toolbar.review-timeline",
] as const;

const BASELINE_FLOATING_SURFACE_IDS = [
  "state.pointSymbologyLayerId",
  "state.showChoroplethPanel",
  "state.showClusterViz",
  "state.showEmergingHotSpotViz",
  "state.showHotSpotViz",
] as const;

const BASELINE_CANVAS_OVERLAY_HOME_IDS = [
  "quick-action.draw-aoi",
  "quick-action.measure",
  "state.showCanvasKeyboardHelp",
  "state.showDrawPanel",
  "state.showMeasurePanel",
  "surface.MapCanvasControls",
  "surface.MapContextMenu",
  "surface.MapSelectionTools",
  "toolbar.draw-circle",
  "toolbar.draw-linestring",
  "toolbar.draw-point",
  "toolbar.draw-polygon",
  "toolbar.draw-rectangle",
  "toolbar.drawings",
  "toolbar.focus-map-canvas",
  "toolbar.measure-area",
  "toolbar.measure-distance",
  "toolbar.pin-mode",
] as const;

const BASELINE_DIALOG_IDS = [
  "state.isFlowDispatchDialogOpen",
  "state.pendingColumnarImport",
  "state.pendingCsvImport",
  "state.pendingImportPreview",
  "state.showExportDialog",
  "state.showExternalServiceDialog",
  "state.showImportHub",
  "state.showMapExportDialog",
] as const;

const BASELINE_DRAWER_IDS = [
  "state.reportHandoffDraft",
  "state.showWorkflowDrawer",
] as const;

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
      "MapCanvasControls",
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

  it("has target-home coverage for all future workbench destinations", () => {
    for (const targetHome of MAP_WORKBENCH_TARGET_HOMES) {
      expect(getMapSurfaceInventoryByHome(targetHome).length, targetHome).toBeGreaterThan(0);
    }
  });

  it("routes selection statistics into the right inspector instead of a canvas HUD", () => {
    const selectionStatsEntry = MAP_SURFACE_INVENTORY.find((entry) => entry.id === "state.selectionStatsSummary");

    expect(selectionStatsEntry).toMatchObject({
      kind: "panel-flag",
      targetHome: "analyze",
      targetSlot: "right-inspector",
      targetSurface: "Right dock > Selection statistics",
    });
  });

  it("routes migrated bottom workspace inventory to the right dock and forbids bottom-panel target slots", () => {
    const bottomPanelTargetIds = MAP_SURFACE_INVENTORY
      .filter((entry) => (entry.targetSlot as string) === "bottom-panel")
      .map((entry) => entry.id)
      .sort();
    const migratedRightDockTargetIds = MAP_SURFACE_INVENTORY
      .filter((entry) => MIGRATED_RIGHT_DOCK_TARGET_IDS.includes(entry.id as (typeof MIGRATED_RIGHT_DOCK_TARGET_IDS)[number]))
      .filter((entry) => entry.targetSlot === "right-inspector")
      .map((entry) => entry.id)
      .sort();
    expect(bottomPanelTargetIds).toEqual([]);
    expect(migratedRightDockTargetIds).toEqual([...MIGRATED_RIGHT_DOCK_TARGET_IDS].sort());
  });

  it("freezes the current floating and canvas-overlay baseline until dock consolidation owns it", () => {
    const floatingSurfaceIds = MAP_SURFACE_INVENTORY
      .filter((entry) => entry.currentSurface.toLowerCase().includes("floating"))
      .map((entry) => entry.id)
      .sort();
    const canvasOverlayHomeIds = MAP_SURFACE_INVENTORY
      .filter((entry) => entry.targetHome === "canvas-overlay")
      .map((entry) => entry.id)
      .sort();

    expect(floatingSurfaceIds).toEqual([...BASELINE_FLOATING_SURFACE_IDS].sort());
    expect(canvasOverlayHomeIds).toEqual([...BASELINE_CANVAS_OVERLAY_HOME_IDS].sort());
  });

  it("freezes current dialog and drawer routing so modal inventory changes are explicit", () => {
    const dialogIds = MAP_SURFACE_INVENTORY
      .filter((entry) => entry.kind === "dialog")
      .map((entry) => entry.id)
      .sort();
    const drawerIds = MAP_SURFACE_INVENTORY
      .filter((entry) => entry.kind === "drawer")
      .map((entry) => entry.id)
      .sort();

    expect(dialogIds).toEqual([...BASELINE_DIALOG_IDS].sort());
    expect(drawerIds).toEqual([...BASELINE_DRAWER_IDS].sort());
  });
});
