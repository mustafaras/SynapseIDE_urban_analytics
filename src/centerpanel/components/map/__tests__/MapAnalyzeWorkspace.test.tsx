// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MapAnalyzeDataOperationsPanel,
  MapAnalyzeStatisticsPanel,
  MapAnalyzeWorkspace,
} from "../analyze";
import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(node);
  });
}

function query<T extends Element = Element>(testId: string): T | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function analysisLayer(): OverlayLayerConfig {
  return {
    id: "analysis-buffer",
    name: "Transit buffer output",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "analysis",
    metadata: {
      featureCount: 12,
      geometryType: "Polygon",
    },
  };
}

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  root = null;
  host = null;
});

describe("MapAnalyzeWorkspace", () => {
  it("exposes the Prompt 11 Analyze tabs and lazily swaps tab content", () => {
    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("analyze-workflows");
      return (
        <MapAnalyzeWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          workflows={<div data-testid="analyze-content-workflows">Workflows content</div>}
          tools={<div data-testid="analyze-content-tools">Tools content</div>}
          query={<div data-testid="analyze-content-query">Query content</div>}
          models={<div data-testid="analyze-content-models">Models content</div>}
          statistics={<div data-testid="analyze-content-statistics">Statistics content</div>}
          dataOperations={<div data-testid="analyze-content-data-operations">Data Operations content</div>}
        />
      );
    };

    render(<Harness />);

    expect(query("map-analyze-workspace")).not.toBeNull();
    expect(query("map-workbench-sidebar-tab-analyze-workflows")?.textContent).toContain("Workflows");
    expect(query("map-workbench-sidebar-tab-analyze-tools")?.textContent).toContain("Tools");
    expect(query("map-workbench-sidebar-tab-analyze-query")?.textContent).toContain("Query");
    expect(query("map-workbench-sidebar-tab-analyze-models")?.textContent).toContain("Models");
    expect(query("map-workbench-sidebar-tab-analyze-statistics")?.textContent).toContain("Statistics");
    expect(query("map-workbench-sidebar-tab-analyze-data-operations")?.textContent).toContain("Data Operations");
    expect(query("analyze-content-workflows")).not.toBeNull();
    expect(query("analyze-content-tools")).toBeNull();

    click("map-workbench-sidebar-tab-analyze-tools");
    expect(query("analyze-content-tools")).not.toBeNull();
    expect(query("analyze-content-workflows")).toBeNull();

    click("map-workbench-sidebar-tab-analyze-data-operations");
    expect(query("analyze-content-data-operations")).not.toBeNull();
  });

  it("keeps statistics launchers reachable while naming blocked prerequisites", () => {
    const openLISA = vi.fn();
    const runSelectionStatistics = vi.fn();

    render(
      <MapAnalyzeStatisticsPanel
        hasAnalysisLayers={false}
        selectedFeatureCount={0}
        selectionStatsAvailable={false}
        lisaActive={false}
        hotSpotActive={false}
        emergingHotSpotActive={false}
        onOpenLISA={openLISA}
        onOpenHotSpot={vi.fn()}
        onOpenEmergingHotSpot={vi.fn()}
        onRunSelectionStatistics={runSelectionStatistics}
      />,
    );

    expect(query("analyze-statistics-layer-blocked")?.textContent).toContain("Missing prerequisite");
    expect(query<HTMLButtonElement>("analyze-statistics-lisa")!.disabled).toBe(true);
    expect(query("analyze-statistics-selection-blocked")?.textContent).toContain("select one or more features");
    expect(query<HTMLButtonElement>("analyze-statistics-selection-summary")!.disabled).toBe(true);

    act(() => {
      root!.render(
        <MapAnalyzeStatisticsPanel
          hasAnalysisLayers
          selectedFeatureCount={3}
          selectionStatsAvailable
          lisaActive={false}
          hotSpotActive={false}
          emergingHotSpotActive={false}
          onOpenLISA={openLISA}
          onOpenHotSpot={vi.fn()}
          onOpenEmergingHotSpot={vi.fn()}
          onRunSelectionStatistics={runSelectionStatistics}
        />,
      );
    });

    click("analyze-statistics-lisa");
    click("analyze-statistics-selection-summary");
    expect(openLISA).toHaveBeenCalledTimes(1);
    expect(runSelectionStatistics).toHaveBeenCalledTimes(1);
  });

  it("routes analysis output layers to attributes, inspector, and active result state", () => {
    const openAttributes = vi.fn();
    const inspectLayer = vi.fn();
    const setActiveLayer = vi.fn();
    const openTools = vi.fn();

    render(
      <MapAnalyzeDataOperationsPanel
        layers={[analysisLayer()]}
        activeLayerIds={["analysis-buffer"]}
        selectedFeatureCount={2}
        onOpenAttributes={openAttributes}
        onInspectLayer={inspectLayer}
        onSetActiveLayer={setActiveLayer}
        onRunSelectionStatistics={vi.fn()}
        onOpenTools={openTools}
      />,
    );

    expect(query("map-analyze-data-operations")?.textContent).toContain("Transit buffer output");
    expect(query("analyze-output-layer-analysis-buffer")?.getAttribute("data-active-output")).toBe("true");

    click("analyze-output-activate-analysis-buffer");
    click("analyze-output-attributes-analysis-buffer");
    click("analyze-output-inspect-analysis-buffer");
    click("analyze-data-open-tools");

    expect(setActiveLayer).toHaveBeenCalledWith("analysis-buffer");
    expect(openAttributes).toHaveBeenCalledWith("analysis-buffer");
    expect(inspectLayer).toHaveBeenCalledWith("analysis-buffer");
    expect(openTools).toHaveBeenCalledTimes(1);
  });
});