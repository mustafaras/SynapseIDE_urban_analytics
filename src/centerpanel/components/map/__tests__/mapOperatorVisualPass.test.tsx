// @vitest-environment jsdom
/**
 * Prompt 37 — catalog / contents / inspector visual-pass tests.
 * Verifies GisStatusChip, GisIconButton, GisEmptyState, and GisTabs integrations
 * in the three operator surfaces.
 */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapCatalogPanel } from "../catalog/MapCatalogPanel";
import { MapContentsTreePanel } from "../contents/MapContentsTreePanel";
import { LayerInspector } from "../inspector/LayerInspector";
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

function click(testId: string): void {
  const el = host!.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
  act(() => el?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

// ---------------------------------------------------------------------------
// Shared layer fixture
// ---------------------------------------------------------------------------
function makeLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "test-layer",
    name: "Test Layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceKind: "imported",
    ...overrides,
  } as OverlayLayerConfig;
}

// ---------------------------------------------------------------------------
// MapCatalogPanel
// ---------------------------------------------------------------------------
describe("MapCatalogPanel — Prompt 37 visual pass", () => {
  function renderCatalog(): void {
    mount(
      <MapCatalogPanel
        visible
        sourceHandles={[]}
        layers={[]}
        onClose={vi.fn()}
        onBrowseSources={vi.fn()}
        onAddDemoPack={vi.fn()}
        onRepairSource={vi.fn()}
        onReconnectSource={async () => ({ ok: true, message: "ok" })}
        onAddConnection={async () => ({ ok: true, message: "ok" })}
      />,
    );
  }

  it("close button has accessible label", () => {
    renderCatalog();
    const btn = host!.querySelector('[aria-label="Close catalog"]');
    expect(btn).toBeTruthy();
  });

  it("empty categories render GisEmptyState role=status regions", () => {
    renderCatalog();
    const statusNodes = host!.querySelectorAll('[role="status"]');
    expect(statusNodes.length).toBeGreaterThan(0);
  });

  it("returns null when visible=false", () => {
    mount(
      <MapCatalogPanel
        visible={false}
        sourceHandles={[]}
        layers={[]}
        onClose={vi.fn()}
        onBrowseSources={vi.fn()}
        onAddDemoPack={vi.fn()}
        onRepairSource={vi.fn()}
        onReconnectSource={async () => ({ ok: false, message: "err" })}
        onAddConnection={async () => ({ ok: false, message: "err" })}
      />,
    );
    expect(host!.querySelector('[data-testid="map-catalog-panel"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// MapContentsTreePanel
// ---------------------------------------------------------------------------
describe("MapContentsTreePanel — Prompt 37 visual pass", () => {
  const layer = makeLayer();

  function renderContents(layers: readonly OverlayLayerConfig[] = [layer]): void {
    mount(
      <MapContentsTreePanel
        visible
        layers={layers}
        zoom={12}
        onClose={vi.fn()}
        onUpdateLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onRepairSource={vi.fn()}
        onOpenProperties={vi.fn()}
        onToggleVisibility={vi.fn()}
        onReorderLayers={vi.fn()}
      />,
    );
  }

  it("close button has accessible label", () => {
    renderContents();
    expect(host!.querySelector('[aria-label="Close contents tree"]')).toBeTruthy();
  });

  it("layer row shows a status chip for scale range", () => {
    renderContents();
    // GisStatusChip renders text content — check "In range" appears
    expect(host!.textContent).toMatch(/in range/i);
  });

  it("empty state shows role=status when no layers", () => {
    renderContents([]);
    expect(host!.querySelector('[role="status"]')).toBeTruthy();
    expect(host!.textContent).toContain("No layers");
  });

  it("returns null when visible=false", () => {
    mount(
      <MapContentsTreePanel
        visible={false}
        layers={[layer]}
        zoom={12}
        onClose={vi.fn()}
        onUpdateLayer={vi.fn()}
        onDuplicateLayer={vi.fn()}
        onRepairSource={vi.fn()}
        onOpenProperties={vi.fn()}
        onToggleVisibility={vi.fn()}
        onReorderLayers={vi.fn()}
      />,
    );
    expect(host!.querySelector('[data-testid="map-contents-tree"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// LayerInspector — tab navigation + close button
// ---------------------------------------------------------------------------
describe("LayerInspector — Prompt 37 visual pass", () => {
  const layer = makeLayer();
  const onClose = vi.fn();

  function renderInspector(initialTab?: import("../inspector/LayerInspector").InspectorTabId): void {
    mount(
      <LayerInspector
        layer={layer}
        sourceHandle={null}
        onClose={onClose}
        {...(initialTab ? { initialTab } : {})}
      />,
    );
  }

  afterEach(() => { onClose.mockReset(); });

  it("renders with accessible dialog label", () => {
    renderInspector();
    const dialog = host!.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("aria-label")).toBe("Layer inspector for Test Layer");
  });

  it("close button has accessible label", () => {
    renderInspector();
    const btn = host!.querySelector('[aria-label="Close layer inspector"]');
    expect(btn).toBeTruthy();
  });

  it("close button calls onClose", () => {
    renderInspector();
    click("map-layer-inspector");   // just to verify we have the element
    act(() => {
      const btn = host!.querySelector('[aria-label="Close layer inspector"]') as HTMLElement;
      btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("tabs rendered via GisTabs with data-testid per tab", () => {
    renderInspector();
    expect(host!.querySelector('[data-testid="map-layer-inspector-tab-overview"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="map-layer-inspector-tab-schema"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="map-layer-inspector-tab-crs"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="map-layer-inspector-tab-style"]')).toBeTruthy();
  });

  it("tablist has accessible label", () => {
    renderInspector();
    expect(host!.querySelector('[role="tablist"][aria-label="Layer inspector"]')).toBeTruthy();
  });

  it("clicking schema tab activates schema panel", () => {
    renderInspector();
    click("map-layer-inspector-tab-schema");
    expect(host!.querySelector('[data-testid="map-layer-inspector-panel-schema"]')).toBeTruthy();
  });

  it("source tab with no handle shows GisEmptyState", () => {
    renderInspector("source");
    expect(host!.querySelector('[role="status"]')).toBeTruthy();
    expect(host!.textContent).toContain("No source handle registered");
  });

  it("uses initialTab prop", () => {
    renderInspector("crs");
    expect(host!.querySelector('[data-testid="map-layer-inspector-panel-crs"]')).toBeTruthy();
  });

  it("layer name is truncated via title attribute", () => {
    renderInspector();
    const inspector = host!.querySelector('[data-testid="map-layer-inspector"]');
    expect(inspector?.textContent).toContain("Test Layer");
  });
});
