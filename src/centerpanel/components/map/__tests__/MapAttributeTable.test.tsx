// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  buildAttributeRows,
  filterRows,
  MapAttributeTable,
  sortRows,
} from "../table/MapAttributeTable";
import { buildMapExplorerContextSummary } from "../mapContextSummary";
import { fcLarge, fcPointsWGS84 } from "./fixtures/gisFixtures";
import { useMapExplorerStore } from "../../../../stores/useMapExplorerStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function pointsLayer(overrides?: Partial<OverlayLayerConfig>): OverlayLayerConfig {
  return {
    id: "points",
    name: "Fixture points",
    type: "geojson",
    visible: true,
    opacity: 1,
    queryable: true,
    group: "data",
    sourceKind: "imported",
    sourceData: fcPointsWGS84,
    metadata: {
      geometryType: "Point",
      featureCount: fcPointsWGS84.features.length,
      fields: ["id", "name", "value", "date"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
    },
    ...overrides,
  };
}

function renderTable(
  layer: OverlayLayerConfig,
  selectedIds: readonly string[],
  onSelectFeatures: (featureIds: string[]) => void,
  viewportHeight = 360,
  onCreateDerivedLayer?: Parameters<typeof MapAttributeTable>[0]["onCreateDerivedLayer"],
): void {
  if (!host) {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  }
  act(() => {
    root?.render(
      <MapAttributeTable
        layer={layer}
        selectedIds={selectedIds}
        onSelectFeatures={onSelectFeatures}
        onFocusFeature={vi.fn()}
        onClose={vi.fn()}
        onCreateDerivedLayer={onCreateDerivedLayer}
        viewportHeight={viewportHeight}
      />,
    );
  });
}

function setControlValue(selector: string, value: string): void {
  const control = host?.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector) ?? null;
  expect(control).not.toBeNull();
  act(() => {
    const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(control, value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function baseContextInput(selectedFeatureIds: Record<string, string[]>) {
  return {
    center: [29.0, 41.0] as [number, number],
    zoom: 10,
    bearing: 0,
    pitch: 0,
    activeBaseLayer: "streets" as const,
    overlayLayers: [pointsLayer()],
    drawnFeatures: [],
    activeAoiId: undefined,
    selectedFeatureIds,
    activeAnalysisResultLayerIds: [],
    scientificQA: null,
    currentMapBounds: null,
    currentMapBoundsUpdatedAt: null,
  };
}

describe("MapAttributeTable", () => {
  beforeEach(() => {
    useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    host?.remove();
    host = null;
    document.body.innerHTML = "";
  });

  it("sorts and filters fixture rows without mutating source order", () => {
    const rows = buildAttributeRows(fcPointsWGS84.features, "points");
    const filtered = filterRows(rows, { name: "site-2" });
    const sorted = sortRows(rows, "value", "desc");

    expect(filtered.map((row) => row.feature.properties?.name)).toContain("site-2");
    expect(filtered.map((row) => row.feature.properties?.name)).not.toContain("site-1");
    expect(sorted[0]?.feature.properties?.value).toBe(100);
    expect(rows[0]?.feature.properties?.value).toBe(4);
  });

  it("keeps fcLarge bounded to a virtualized row window", () => {
    const layer = pointsLayer({
      id: "large-points",
      name: "Large points",
      sourceData: fcLarge(100_000),
      metadata: {
        geometryType: "Point",
        featureCount: 100_000,
        fields: ["id", "value"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });

    renderTable(layer, [], vi.fn(), 280);

    expect(host?.querySelectorAll('[data-testid="map-attribute-row"]').length).toBeLessThanOrEqual(30);
    expect(host?.querySelector('[data-testid="map-attribute-table-count"]')?.textContent).toContain("100,000");
  });

  it("writes row selection through the store and updates the map context summary", () => {
    const layer = pointsLayer();
    renderTable(layer, [], (ids) => useMapExplorerStore.getState().setSelectedFeatures(layer.id, ids));

    const firstRow = host?.querySelector<HTMLElement>('[data-testid="map-attribute-row"]');
    expect(firstRow).not.toBeNull();

    act(() => {
      firstRow?.click();
    });

    const selectedFeatureIds = useMapExplorerStore.getState().selectedFeatureIds;
    expect(selectedFeatureIds).toEqual({ points: ["1"] });

    const summary = buildMapExplorerContextSummary(baseContextInput(selectedFeatureIds));
    expect(summary.selection.totalSelectedFeatures).toBe(1);
    expect(summary.selection.layerCounts).toEqual([{ layerId: "points", count: 1 }]);

    renderTable(layer, selectedFeatureIds.points ?? [], (ids) => useMapExplorerStore.getState().setSelectedFeatures(layer.id, ids));
    expect(host?.querySelector('[data-feature-id="1"]')?.getAttribute("aria-selected")).toBe("true");
  });

  it("shows a numeric field profile drawer with distribution and summary stats", () => {
    renderTable(pointsLayer(), [], vi.fn());

    act(() => {
      host?.querySelector<HTMLButtonElement>('[data-testid="map-attribute-column-value"]')?.click();
    });

    const profileButton = [...(host?.querySelectorAll<HTMLButtonElement>("button") ?? [])]
      .find((button) => button.textContent?.includes("Field profile"));
    expect(profileButton).not.toBeNull();

    act(() => {
      profileButton?.click();
    });

    const drawer = host?.querySelector('[data-testid="map-attribute-profile-drawer"]');
    expect(drawer).not.toBeNull();
    expect(drawer?.textContent).toContain("value profile");
    expect(drawer?.textContent).toContain("numeric");
    expect(drawer?.textContent).toContain("4");
    expect(drawer?.textContent).toContain("100");
    expect(drawer?.textContent).toContain("52");
  });

  it("creates a derived field draft through the sandboxed calculator UI", () => {
    const onCreateDerivedLayer = vi.fn();
    renderTable(pointsLayer(), [], vi.fn(), 360, onCreateDerivedLayer);

    act(() => {
      host?.querySelector<HTMLButtonElement>('button[title="Create a derived field with the sandboxed calculator."]')?.click();
    });
    setControlValue('input[aria-label="Derived field name"]', "value_x2");
    setControlValue('textarea[aria-label="Field calculator expression"]', "value * 2");

    act(() => {
      host?.querySelector<HTMLButtonElement>('[data-testid="map-field-calculator-apply"]')?.click();
    });

    expect(onCreateDerivedLayer).toHaveBeenCalledTimes(1);
    const draft = onCreateDerivedLayer.mock.calls[0]?.[0];
    expect(draft.fieldName).toBe("value_x2");
    expect(draft.referencedFields).toEqual(["value"]);
    expect(draft.featureCollection.features[0]?.properties?.value_x2).toBe(8);
    expect(draft.featureCollection.features[24]?.properties?.value_x2).toBe(200);
  });
});
