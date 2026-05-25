import { describe, expect, it } from "vitest";
import { getActiveRightDockPanel, getMapDockLayout } from "../mapDocking";
import { MAP_NUMERIC } from "../mapTokens";

describe("map docking layout", () => {
  it("keeps layer and right-side tools open on wide layouts", () => {
    const layout = getMapDockLayout({
      containerWidth: 1200,
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

  it("moves the layer panel into a bottom drawer on compact widths", () => {
    const layout = getMapDockLayout({
      containerWidth: 720,
      layerPanelRequested: true,
      rightPanel: "measure",
      navigatorStageMode: false,
    });

    expect(layout.compactDock).toBe(true);
    expect(layout.showLayerPanel).toBe(true);
    expect(layout.layerPanelPlacement).toBe("bottom");
    expect(layout.showMeasurePanel).toBe(true);
    expect(layout.leftInset).toBe(MAP_NUMERIC.overlayMargin);
    expect(layout.rightInset).toBe(MAP_NUMERIC.overlayMargin);
  });

  it("keeps the layer panel visible as a bottom drawer on very narrow widths", () => {
    const layout = getMapDockLayout({
      containerWidth: 420,
      layerPanelRequested: true,
      rightPanel: null,
      navigatorStageMode: false,
    });

    expect(layout.compactDock).toBe(true);
    expect(layout.showLayerPanel).toBe(true);
    expect(layout.layerPanelPlacement).toBe("bottom");
    expect(layout.showPinSidebar).toBe(false);
    expect(layout.showDrawPanel).toBe(false);
    expect(layout.showMeasurePanel).toBe(false);
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
      containerWidth: 1220,
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
      containerWidth: 1320,
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
      containerWidth: 1320,
      layerPanelRequested: true,
      rightPanel: "urbanMethod",
      navigatorStageMode: false,
    });

    expect(layout.activeRightPanel).toBe("urbanMethod");
    expect(layout.showUrbanMethodPanel).toBe(true);
    expect(layout.showWorkflowPanel).toBe(false);
    expect(layout.rightInset).toBe(layout.rightPanelWidth + MAP_NUMERIC.overlayMargin);
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
});
