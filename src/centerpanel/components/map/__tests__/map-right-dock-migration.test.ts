import { describe, expect, it } from "vitest";

import { MAP_SURFACE_INVENTORY } from "../navigation";
import {
  createMapRightDockRoute,
  getMapRightDockPanelDefinition,
  MAP_RIGHT_DOCK_PANEL_IDS,
} from "../mapRightDockRoutes";

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

describe("Map Explorer right dock migration", () => {
  it("maps migrated surfaces to right inspector slots", () => {
    const migrated = MAP_SURFACE_INVENTORY
      .filter((entry) => MIGRATED_RIGHT_DOCK_TARGET_IDS.includes(entry.id as (typeof MIGRATED_RIGHT_DOCK_TARGET_IDS)[number]))
      .map((entry) => entry.targetSlot);

    expect(migrated.length).toBe(MIGRATED_RIGHT_DOCK_TARGET_IDS.length);
    expect(new Set(migrated)).toEqual(new Set(["right-inspector"]));
  });

  it("keeps right dock route contracts resolvable for every panel", () => {
    for (const panelId of MAP_RIGHT_DOCK_PANEL_IDS) {
      const definition = getMapRightDockPanelDefinition(panelId);
      const route = createMapRightDockRoute(panelId, { source: "toolbar" });

      expect(definition.id).toBe(panelId);
      expect(route.panel).toBe(panelId);
      expect(route.source).toBe("toolbar");
    }
  });

  it("does not route any inventory item to a retired bottom-panel target slot", () => {
    const bottomPanelTargets = MAP_SURFACE_INVENTORY.filter((entry) => entry.targetSlot === "bottom-panel");
    expect(bottomPanelTargets).toEqual([]);
  });
});
