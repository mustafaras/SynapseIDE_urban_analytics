// @vitest-environment jsdom
/**
 * Prompt 38 — table / toolbox / layout visual pass tests.
 * Verifies GisIconButton, GisEmptyState, GisProgressBar, GisStatusChip
 * integrations in the three heavy work surfaces.
 */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapAttributeTable } from "../table/MapAttributeTable";
import { MapProcessingToolboxPanel } from "../processing/MapProcessingToolboxPanel";
import { MapLayoutDesignerPanel } from "../layout/MapLayoutDesignerPanel";
import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(element: React.ReactElement): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root!.render(element); });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

// ---------------------------------------------------------------------------
// MapAttributeTable
// ---------------------------------------------------------------------------
describe("MapAttributeTable — Prompt 38 visual pass", () => {
  function makeLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
    return {
      id: "tbl-layer",
      name: "Table Layer",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      ...overrides,
    } as OverlayLayerConfig;
  }

  it("close button has accessible label via GisIconButton", () => {
    mount(
      <MapAttributeTable
        layer={makeLayer()}
        selectedIds={[]}
        onSelectFeatures={vi.fn()}
        onFocusFeature={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(host!.querySelector('[aria-label="Close attribute table"]')).toBeTruthy();
  });

  it("empty attributes shows GisEmptyState role=status", () => {
    mount(
      <MapAttributeTable
        layer={makeLayer({ sourceData: undefined })}
        selectedIds={[]}
        onSelectFeatures={vi.fn()}
        onFocusFeature={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(host!.querySelector('[role="status"]')).toBeTruthy();
    expect(host!.textContent).toContain("No attributes");
  });

  it("null cell values render italic null span instead of empty", () => {
    const featureWithNull: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { zone: null, name: "Test" },
    };
    mount(
      <MapAttributeTable
        layer={makeLayer({
          sourceData: { type: "FeatureCollection", features: [featureWithNull] },
        })}
        selectedIds={[]}
        onSelectFeatures={vi.fn()}
        onFocusFeature={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    // The null cell should render "null" text (italic span)
    expect(host!.textContent).toContain("null");
  });
});

// ---------------------------------------------------------------------------
// MapProcessingToolboxPanel
// ---------------------------------------------------------------------------
describe("MapProcessingToolboxPanel — Prompt 38 visual pass", () => {
  const noopTool = {
    toolId: "buffer",
    title: "Buffer",
    category: "geometry",
    summary: "Creates a buffer around features.",
    requiresCrs: true,
    executionMode: "main-preview" as const,
    implemented: true,
    parameters: [],
  };

  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    searchTools: vi.fn(() => [noopTool]),
    layers: [],
    onPreview: vi.fn(() => ({
      preview: { blockers: [], caveats: [], outputFeatureCount: 0, outputGeometryClass: "polygon" },
    })),
    onRun: vi.fn(() => null),
  };

  it("close button has accessible label via GisIconButton", () => {
    mount(<MapProcessingToolboxPanel {...defaultProps} />);
    expect(host!.querySelector('[aria-label="Close processing toolbox"]')).toBeTruthy();
  });

  it("empty tool list shows GisEmptyState role=status", () => {
    mount(<MapProcessingToolboxPanel {...defaultProps} searchTools={() => []} />);
    // Input "xyz" to trigger empty state message
    act(() => {
      const input = host!.querySelector('[data-testid="processing-tool-search"]') as HTMLInputElement;
      if (input) {
        input.value = "xyz";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    // With no results the GisEmptyState role=status appears
    const statusEl = host!.querySelector('[role="status"]');
    expect(statusEl).toBeTruthy();
  });

  it("blocked preflight is visible before run", () => {
    mount(
      <MapProcessingToolboxPanel
        {...defaultProps}
        onPreview={() => ({
          preview: {
            blockers: ["CRS is missing — declare before buffering."],
            caveats: [],
            outputFeatureCount: 0,
            outputGeometryClass: "polygon",
          },
        })}
      />,
    );
    expect(host!.querySelector('[data-testid="processing-preflight-blocked"]')).toBeTruthy();
    expect(host!.textContent).toContain("Blocked before run");
  });

  it("run result renders GisProgressBar role=progressbar", () => {
    const onRun = vi.fn(() => ({
      status: "applied" as const,
      outputLayer: { id: "out", name: "Buffer result" } as OverlayLayerConfig,
      manifest: { manifestId: "manifest-buffer-001" },
      preview: { blockers: [], caveats: [], outputFeatureCount: 5, outputGeometryClass: "polygon" as const },
      logs: ["Buffer applied."],
    }));
    mount(<MapProcessingToolboxPanel {...defaultProps} onRun={onRun} />);
    act(() => {
      const runBtn = host!.querySelector('[data-testid="processing-tool-run"]') as HTMLElement;
      runBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(host!.querySelector('[role="progressbar"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="processing-run-progress"]')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MapLayoutDesignerPanel
// ---------------------------------------------------------------------------
describe("MapLayoutDesignerPanel — Prompt 38 visual pass", () => {
  const defaultProps = {
    visible: true,
    overlayLayers: [],
    qaState: null,
    onClose: vi.fn(),
  };

  it("close button has accessible label via GisIconButton", () => {
    mount(<MapLayoutDesignerPanel {...defaultProps} />);
    expect(host!.querySelector('[aria-label="Close layout designer"]')).toBeTruthy();
  });

  it("returns null when visible=false", () => {
    mount(<MapLayoutDesignerPanel {...defaultProps} visible={false} />);
    expect(host!.querySelector('[data-testid="map-layout-designer"]')).toBeNull();
  });

  it("layout designer renders dialog role", () => {
    mount(<MapLayoutDesignerPanel {...defaultProps} />);
    expect(host!.querySelector('[role="dialog"][aria-label="Layout designer"]')).toBeTruthy();
  });

  it("page tabs have data-testid", () => {
    mount(<MapLayoutDesignerPanel {...defaultProps} />);
    expect(host!.querySelector('[data-testid="map-layout-page-tab-1"]')).toBeTruthy();
  });
});
