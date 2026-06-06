// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MapWorkspaceOverviewSummary,
  type MapWorkspaceOverviewSummaryProps,
} from "../MapWorkspaceOverviewSummary";
import { buildMapExplorerContextSummary } from "../mapContextSummary";
import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function contextSummary(overlayLayers: OverlayLayerConfig[] = []) {
  return buildMapExplorerContextSummary({
    center: [29.0, 41.0],
    zoom: 10,
    bearing: 0,
    pitch: 0,
    activeBaseLayer: "streets",
    overlayLayers,
    drawnFeatures: [],
    activeAoiId: undefined,
    selectedFeatureIds: {},
    activeAnalysisResultLayerIds: [],
    scientificQA: null,
    currentMapBounds: null,
    currentMapBoundsUpdatedAt: null,
  });
}

function renderSummary(overrides: Partial<MapWorkspaceOverviewSummaryProps> = {}): {
  onSelectView: ReturnType<typeof vi.fn>;
  onQuickAction: ReturnType<typeof vi.fn>;
} {
  const onSelectView = vi.fn();
  const onQuickAction = vi.fn();

  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapWorkspaceOverviewSummary
        workspaceView="explore"
        onSelectView={onSelectView}
        onQuickAction={onQuickAction}
        contextSummary={contextSummary()}
        overlayLayers={[]}
        pinCount={0}
        drawnFeatureCount={0}
        measurementCount={0}
        selectedProjectId={null}
        lastSavedAt={null}
        {...overrides}
      />,
    );
  });

  return { onSelectView, onQuickAction };
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapWorkspaceOverviewSummary", () => {
  it("renders a compact readiness summary with map-state signals", () => {
    renderSummary();
    const summary = host!.querySelector('[data-testid="map-overview-summary"]');
    expect(summary).toBeTruthy();

    const text = host!.textContent ?? "";
    expect(text).toContain("Readiness");
    expect(text).toContain("Project");
    expect(text).toContain("Layers");
    expect(text).toContain("AOI");
    expect(text).toContain("QA");
    expect(text).toContain("CRS");
    // Truthful empty state: no project and unchecked QA.
    expect(text).toContain("Local-only");
    expect(text).toContain("Unchecked");
  });

  it("does NOT render the full launch/readiness cockpit body in the left panel", () => {
    renderSummary();
    const text = host!.textContent ?? "";
    // Full-cockpit-only sections must never appear in the left-panel overview tab.
    expect(text).not.toContain("Delivery Sequence");
    expect(text).not.toContain("Integration Rail");
    expect(text).not.toContain("Workflow Control");
    expect(text).not.toContain("Readiness Cockpit");
    expect(host!.querySelector('[data-testid="map-workspace-context-strip"]')).toBeNull();
  });

  it("wires the primary next action through onQuickAction", () => {
    const { onQuickAction } = renderSummary();
    const primaryButton = Array.from(host!.querySelectorAll("button")).find((btn) =>
      btn.getAttribute("aria-label")?.startsWith("Run next readiness action"),
    ) as HTMLButtonElement;
    expect(primaryButton).toBeTruthy();
    act(() => primaryButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    // Empty workspace recommends importing data.
    expect(onQuickAction).toHaveBeenCalledWith("import-data");
  });

  it("switches workspace mode through onSelectView", () => {
    const { onSelectView } = renderSummary();
    const navigatorButton = Array.from(host!.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Navigator"),
    ) as HTMLButtonElement;
    expect(navigatorButton).toBeTruthy();
    act(() => navigatorButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onSelectView).toHaveBeenCalledWith("navigator");
  });
});
