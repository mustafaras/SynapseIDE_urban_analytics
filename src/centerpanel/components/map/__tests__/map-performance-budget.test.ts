import { describe, expect, it } from "vitest";

import { MAP_SURFACE_INVENTORY } from "../navigation";
import { MAP_RIGHT_DOCK_PANEL_IDS } from "../mapRightDockRoutes";

function findInventoryEntry(id: string) {
  return MAP_SURFACE_INVENTORY.find((entry) => entry.id === id);
}

describe("Prompt 21 performance budget contract", () => {
  it("keeps diagnostics and performance routes in right dock panels", () => {
    expect(MAP_RIGHT_DOCK_PANEL_IDS).toContain("diagnostics");
    expect(MAP_RIGHT_DOCK_PANEL_IDS).toContain("performance");
  });

  it("routes performance diagnostics state and toolbar actions to right inspector", () => {
    const diagnosticsState = findInventoryEntry("state.showPerformanceDiagnostics");
    const diagnosticsToolbar = findInventoryEntry("toolbar.performance-diagnostics");

    expect(diagnosticsState?.targetSlot).toBe("right-inspector");
    expect(diagnosticsState?.targetHome).toBe("diagnostics");
    expect(diagnosticsToolbar?.targetSlot).toBe("right-inspector");
    expect(diagnosticsToolbar?.targetHome).toBe("diagnostics");
  });

  it("keeps attribute and selection diagnostics in dock-oriented destinations", () => {
    const attributeLayer = findInventoryEntry("state.attributeTableLayerId");
    const selectionStats = findInventoryEntry("state.selectionStatsSummary");

    expect(attributeLayer?.targetSlot).toBe("right-inspector");
    expect(attributeLayer?.targetHome).toBe("layers");
    expect(selectionStats?.targetSlot).toBe("right-inspector");
    expect(selectionStats?.targetHome).toBe("analyze");
  });
});
