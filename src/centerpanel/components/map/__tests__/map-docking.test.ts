import { describe, expect, it } from "vitest";
import {
  clampMapRightDockFloatingRect,
  createDefaultMapRightDockFloatingRect,
  getActiveRightDockPanel,
  getMapDockLayout,
  MAP_RIGHT_PANEL_MAX_WIDTH,
  MAP_RIGHT_PANEL_MIN_WIDTH,
} from "../mapDocking";
import { MAP_NUMERIC } from "../mapTokens";

describe("map docking layout", () => {
  it("keeps layer and right-side tools open on wide layouts", () => {
    const layout = getMapDockLayout({
      containerWidth: 1440,
      layerPanelRequested: true,
      rightPanel: "draw",
      navigatorStageMode: false,
    });

    expect(layout.compactDock).toBe(false);
    expect(layout.showLayerPanel).toBe(true);
    expect(layout.layerPanelPlacement).toBe("left");
    expect(layout.showDrawPanel).toBe(true);
    expect(layout.leftInset).toBe(MAP_NUMERIC.layerPanelWidth + MAP_NUMERIC.overlayMargin);
    expect(layout.rightInset).toBe(MAP_NUMERIC.drawingPanelWidth + MAP_NUMERIC.overlayMargin);
    expect(layout.centerLaneWidth).toBeGreaterThanOrEqual(MAP_NUMERIC.mapDockMinCenterWidth);
  });

  it("presents the right panel as an overlay drawer at medium widths to protect the center lane", () => {
    const layout = getMapDockLayout({
      containerWidth: 1280,
      layerPanelRequested: true,
      rightPanel: "scientificQA",
      navigatorStageMode: false,
    });

    expect(layout.activeRightPanel).toBe("scientificQA");
    expect(layout.showScientificQAPanel).toBe(true);
    expect(layout.rightPanelPlacement).toBe("drawer");
    expect(layout.rightInset).toBe(MAP_NUMERIC.overlayMargin);
  });

  it("collapses the layer panel into a left-side overlay drawer (never a bottom drawer) on compact widths", () => {
    const layout = getMapDockLayout({
      containerWidth: 720,
      layerPanelRequested: true,
      rightPanel: "measure",
      navigatorStageMode: false,
    });

    expect(layout.compactDock).toBe(true);
    expect(layout.showLayerPanel).toBe(true);
    expect(layout.layerPanelPlacement).toBe("drawer");
    expect(layout.showMeasurePanel).toBe(true);
    expect(layout.leftInset).toBe(MAP_NUMERIC.overlayMargin);
    expect(layout.rightInset).toBe(MAP_NUMERIC.overlayMargin);
  });

  it("keeps the layer panel visible as a left-side overlay drawer on very narrow widths", () => {
    const layout = getMapDockLayout({
      containerWidth: 420,
      layerPanelRequested: true,
      rightPanel: null,
      navigatorStageMode: false,
    });

    expect(layout.compactDock).toBe(true);
    expect(layout.showLayerPanel).toBe(true);
    expect(layout.layerPanelPlacement).toBe("drawer");
    expect(layout.showPinSidebar).toBe(false);
    expect(layout.showDrawPanel).toBe(false);
    expect(layout.showMeasurePanel).toBe(false);
  });

  it("never produces a bottom workspace placement at desktop, short desktop, tablet, or narrow widths", () => {
    // Desktop, short desktop, tablet, and narrow compositions.
    for (const containerWidth of [1366, 1280, 1024, 768, 420, 320]) {
      const layout = getMapDockLayout({
        containerWidth,
        layerPanelRequested: true,
        rightPanel: "measure",
        navigatorStageMode: false,
      });

      const placement = layout.layerPanelPlacement;
      // Structurally impossible to dock the workspace to the bottom edge.
      expect(placement === "left" || placement === "drawer").toBe(true);
      expect(layout.showLayerPanel).toBe(true);
    }
  });

  it("suppresses panels while the navigator stage owns the workspace", () => {
    const layout = getMapDockLayout({
      containerWidth: 1200,
      layerPanelRequested: true,
      rightPanel: "pins",
      navigatorStageMode: true,
    });

    expect(layout.activeRightPanel).toBeNull();
    expect(layout.showLayerPanel).toBe(false);
    expect(layout.layerPanelPlacement).toBeNull();
    expect(layout.showPinSidebar).toBe(false);
    expect(layout.leftInset).toBe(MAP_NUMERIC.overlayMargin);
    expect(layout.rightInset).toBe(MAP_NUMERIC.overlayMargin);
  });

  it("allocates a dedicated right dock lane for the scientific QA panel", () => {
    const layout = getMapDockLayout({
      containerWidth: 1440,
      layerPanelRequested: true,
      rightPanel: "scientificQA",
      navigatorStageMode: false,
    });

    expect(layout.activeRightPanel).toBe("scientificQA");
    expect(layout.showScientificQAPanel).toBe(true);
    expect(layout.showDrawPanel).toBe(false);
    expect(layout.showPinSidebar).toBe(false);
    expect(layout.showMeasurePanel).toBe(false);
    expect(layout.rightInset).toBe(layout.rightPanelWidth + MAP_NUMERIC.overlayMargin);
  });

  it("allocates the right dock lane for report handoff", () => {
    const layout = getMapDockLayout({
      containerWidth: 1440,
      layerPanelRequested: true,
      rightPanel: "report",
      navigatorStageMode: false,
      rightPanelWidth: 440,
    });

    expect(layout.activeRightPanel).toBe("report");
    expect(layout.showReportPanel).toBe(true);
    expect(layout.showScientificQAPanel).toBe(false);
    expect(layout.rightPanelWidth).toBe(440);
    expect(layout.rightInset).toBe(440 + MAP_NUMERIC.overlayMargin);
  });

  it("allocates a dedicated right dock lane for an Urban method request", () => {
    const layout = getMapDockLayout({
      containerWidth: 1440,
      layerPanelRequested: true,
      rightPanel: "urbanMethod",
      navigatorStageMode: false,
    });

    expect(layout.activeRightPanel).toBe("urbanMethod");
    expect(layout.showUrbanMethodPanel).toBe(true);
    expect(layout.showWorkflowPanel).toBe(false);
    expect(layout.rightInset).toBe(layout.rightPanelWidth + MAP_NUMERIC.overlayMargin);
  });

  it("accepts the expanded right-dock panel IDs and reserves a right lane for each", () => {
    const migratedPanels = [
      "inspect",
      "attributes",
      "problems",
      "timeline",
      "tasks",
      "diagnostics",
      "selection",
      "qa",
      "performance",
      "collaboration",
    ] as const;

    for (const rightPanel of migratedPanels) {
      const layout = getMapDockLayout({
        containerWidth: 1440,
        layerPanelRequested: true,
        rightPanel,
        navigatorStageMode: false,
      });

      expect(layout.activeRightPanel).toBe(rightPanel);
      expect(layout.rightPanelWidth).toBeGreaterThanOrEqual(MAP_RIGHT_PANEL_MIN_WIDTH);
      expect(layout.rightPanelWidth).toBeLessThanOrEqual(MAP_RIGHT_PANEL_MAX_WIDTH);
      expect(layout.rightInset).toBe(layout.rightPanelWidth + MAP_NUMERIC.overlayMargin);
      // No bottom workspace placement is introduced for any migrated surface.
      const placement = layout.layerPanelPlacement;
      expect(placement === "left" || placement === "drawer").toBe(true);
    }
  });

  it("uses persisted layer panel width in the center lane calculation", () => {
    const layout = getMapDockLayout({
      containerWidth: 1440,
      layerPanelRequested: true,
      rightPanel: "scientificQA",
      navigatorStageMode: false,
      layerPanelWidth: 480,
      rightPanelWidth: 420,
    });

    expect(layout.compactDock).toBe(false);
    expect(layout.layerPanelWidth).toBe(480);
    expect(layout.rightPanelWidth).toBe(420);
    expect(layout.leftInset).toBe(480 + MAP_NUMERIC.overlayMargin);
    expect(layout.rightInset).toBe(420 + MAP_NUMERIC.overlayMargin);
    expect(layout.centerLaneWidth).toBe(1440 - layout.leftInset - layout.rightInset);
  });

  it("prioritizes measure, then pins, then draw for the single right rail", () => {
    expect(getActiveRightDockPanel({ showPinSidebar: true, showDrawPanel: true, showMeasurePanel: true })).toBe("measure");
    expect(getActiveRightDockPanel({ showPinSidebar: true, showDrawPanel: true, showMeasurePanel: false })).toBe("pins");
    expect(getActiveRightDockPanel({ showPinSidebar: false, showDrawPanel: true, showMeasurePanel: false })).toBe("draw");
    expect(getActiveRightDockPanel({ showPinSidebar: false, showDrawPanel: false, showMeasurePanel: false })).toBeNull();
  });

  it("clamps floating right dock rect within viewport bounds", () => {
    const clamped = clampMapRightDockFloatingRect(
      {
        x: -120,
        y: -80,
        width: 999,
        height: 999,
      },
      {
        width: 1280,
        height: 720,
      },
    );

    expect(clamped.x).toBeGreaterThanOrEqual(16);
    expect(clamped.y).toBeGreaterThanOrEqual(16);
    expect(clamped.width).toBeLessThanOrEqual(520);
    expect(clamped.height).toBeLessThanOrEqual(688);
  });

  it("creates a default floating rect anchored to top-right and already clamped", () => {
    const rect = createDefaultMapRightDockFloatingRect(
      { width: 1440, height: 900 },
      420,
      560,
    );

    expect(rect.width).toBe(420);
    expect(rect.height).toBe(560);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1440 - 16);
    expect(rect.y).toBeGreaterThanOrEqual(16);
  });
});
