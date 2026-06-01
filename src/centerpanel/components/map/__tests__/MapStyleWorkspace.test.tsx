// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MapStyleAdvisorPanel,
  MapStyleLegendPanel,
  MapStyleRendererPanel,
  MapStyleSymbolsPanel,
  MapStyleWorkspace,
} from "../style";
import {
  buildLayerStyleUpdate,
  getDefaultLayerStyleOptions,
} from "../inspector/style/legendContract";
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

function queryAll<T extends Element = Element>(testId: string): T[] {
  return Array.from(host!.querySelectorAll(`[data-testid="${testId}"]`)) as T[];
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function featureCollection(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Station A", ridership: 120, district: "north" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ]],
        },
      },
      {
        type: "Feature",
        properties: { name: "Station B", ridership: 240, district: "south" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [1, 1],
            [2, 1],
            [2, 2],
            [1, 2],
            [1, 1],
          ]],
        },
      },
    ],
  };
}

function polygonLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "districts",
    name: "District choropleth",
    type: "geojson",
    visible: true,
    opacity: 0.92,
    sourceData: featureCollection(),
    qaStatus: "passed",
    metadata: {
      featureCount: 2,
      geometryType: "Polygon",
      fields: ["name", "ridership", "district"],
      publicationReadiness: {
        status: "ready",
        missingFields: [],
        blockingIssueIds: [],
        caveats: [],
        checkedAt: "2026-06-01T00:00:00.000Z",
      },
    },
    ...overrides,
  };
}

function pointLayer(): OverlayLayerConfig {
  return {
    id: "stops",
    name: "Transit stops",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Stop A", boardings: 42 },
          geometry: { type: "Point", coordinates: [0, 0] },
        },
      ],
    },
    metadata: {
      featureCount: 1,
      geometryType: "Point",
      fields: ["name", "boardings"],
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

describe("MapStyleWorkspace", () => {
  it("exposes the Prompt 12 Style tabs and lazily swaps tab content", () => {
    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("style-renderer");
      return (
        <MapStyleWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          renderer={<div data-testid="style-content-renderer">Renderer content</div>}
          symbols={<div data-testid="style-content-symbols">Symbols content</div>}
          labels={<div data-testid="style-content-labels">Labels content</div>}
          legend={<div data-testid="style-content-legend">Legend content</div>}
          advisor={<div data-testid="style-content-advisor">Advisor content</div>}
        />
      );
    };

    render(<Harness />);

    expect(query("map-style-workspace")).not.toBeNull();
    expect(query("map-workbench-sidebar-tab-style-renderer")?.textContent).toContain("Renderer");
    expect(query("map-workbench-sidebar-tab-style-symbols")?.textContent).toContain("Symbols");
    expect(query("map-workbench-sidebar-tab-style-labels")?.textContent).toContain("Labels");
    expect(query("map-workbench-sidebar-tab-style-legend")?.textContent).toContain("Legend");
    expect(query("map-workbench-sidebar-tab-style-advisor")?.textContent).toContain("Advisor");
    expect(query("style-content-renderer")).not.toBeNull();
    expect(query("style-content-symbols")).toBeNull();

    click("map-workbench-sidebar-tab-style-symbols");
    expect(query("style-content-symbols")).not.toBeNull();
    expect(query("style-content-renderer")).toBeNull();

    click("map-workbench-sidebar-tab-style-advisor");
    expect(query("style-content-advisor")).not.toBeNull();
  });

  it("shows active layer style readiness in the renderer header", () => {
    const layer = polygonLayer();
    const openPreview = vi.fn();

    render(
      <MapStyleRendererPanel
        layers={[layer]}
        activeLayer={layer}
        activeLayerId={layer.id}
        onActiveLayerChange={vi.fn()}
        onOpenChoroplethPreview={openPreview}
        choroplethPreviewActive={false}
      />,
    );

    const headerText = query("map-style-active-layer-header")?.textContent ?? "";
    expect(headerText).toContain("District choropleth");
    expect(headerText).toContain("Polygon");
    expect(headerText).toContain("Renderer eligible");
    expect(headerText).toContain("QA Passed");
    expect(headerText).toContain("Publish Ready");

    click("map-style-open-choropleth-preview");
    expect(openPreview).toHaveBeenCalledTimes(1);
  });

  it("names missing geometry and field prerequisites for symbol renderers", () => {
    const layer = polygonLayer({ id: "no-fields", metadata: { geometryType: "Polygon", fields: [] } });

    render(
      <MapStyleSymbolsPanel
        layers={[layer]}
        activeLayer={layer}
        activeLayerId={layer.id}
        onActiveLayerChange={vi.fn()}
        activeMode="heatmap"
        symbologyActive={false}
        isLoading={false}
        error={null}
        symbolControls={null}
        onOpenPointSymbology={vi.fn()}
        onClosePointSymbology={vi.fn()}
      />,
    );

    expect(query("map-style-symbols-blocked")?.textContent).toContain("Symbols need point geometry");
    expect(query<HTMLButtonElement>("map-style-symbol-mode-heatmap")!.disabled).toBe(true);
    expect(query<HTMLButtonElement>("map-style-symbol-mode-proportional")!.disabled).toBe(true);
  });

  it("renders the serialized legend contract used by map, report, and export", () => {
    const layer = polygonLayer();
    const update = buildLayerStyleUpdate(layer, getDefaultLayerStyleOptions(layer), "2026-06-01T00:00:00.000Z");
    const styledLayer = {
      ...layer,
      style: update.style,
    } satisfies OverlayLayerConfig;

    render(
      <MapStyleLegendPanel
        layers={[styledLayer]}
        activeLayer={styledLayer}
        activeLayerId={styledLayer.id}
        onActiveLayerChange={vi.fn()}
      />,
    );

    expect(query("map-style-legend-panel")?.textContent).toContain(update.legendSpec.mode);
    expect(query("map-style-legend-contract-targets")?.textContent).toContain("Map");
    expect(query("map-style-legend-contract-targets")?.textContent).toContain("Report");
    expect(query("map-style-legend-contract-targets")?.textContent).toContain("Export");
    expect(queryAll("map-style-legend-entry").length).toBeGreaterThan(0);
  });

  it("keeps advisor apply, dismiss, and undo callbacks reachable", () => {
    const layer = pointLayer();
    const apply = vi.fn();
    const dismiss = vi.fn();
    const undo = vi.fn();

    render(
      <MapStyleAdvisorPanel
        layers={[layer]}
        activeLayer={layer}
        activeLayerId={layer.id}
        onActiveLayerChange={vi.fn()}
        advisor={(
          <div data-testid="style-advisor-actions">
            <button type="button" data-testid="advisor-apply" onClick={() => apply("rec-1")}>Apply</button>
            <button type="button" data-testid="advisor-dismiss" onClick={() => dismiss("rec-1")}>Dismiss</button>
            <button type="button" data-testid="advisor-undo" onClick={undo}>Undo</button>
          </div>
        )}
      />,
    );

    click("advisor-apply");
    click("advisor-dismiss");
    click("advisor-undo");

    expect(apply).toHaveBeenCalledWith("rec-1");
    expect(dismiss).toHaveBeenCalledWith("rec-1");
    expect(undo).toHaveBeenCalledTimes(1);
  });
});