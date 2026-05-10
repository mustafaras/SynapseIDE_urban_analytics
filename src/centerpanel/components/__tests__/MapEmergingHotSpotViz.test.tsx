// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import { MapEmergingHotSpotViz } from "../MapEmergingHotSpotViz";
import type { OverlayLayerConfig } from "../map/mapTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

vi.mock("@/ui/toast/api", () => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeTemporalPolygonLayer(): OverlayLayerConfig {
  return {
    id: "emerging-hotspot-source",
    name: "District Heat Trajectories",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "district-a",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.94, 41.01], [28.945, 41.01], [28.945, 41.015], [28.94, 41.015], [28.94, 41.01]]],
          },
          properties: {
            district: "A",
            heat_2020: 12,
            heat_2021: 16,
            heat_2022: 21,
            heat_2023: 24,
          },
        },
        {
          type: "Feature",
          id: "district-b",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.945, 41.01], [28.95, 41.01], [28.95, 41.015], [28.945, 41.015], [28.945, 41.01]]],
          },
          properties: {
            district: "B",
            heat_2020: 18,
            heat_2021: 21,
            heat_2022: 26,
            heat_2023: 29,
          },
        },
        {
          type: "Feature",
          id: "district-c",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.94, 41.015], [28.945, 41.015], [28.945, 41.02], [28.94, 41.02], [28.94, 41.015]]],
          },
          properties: {
            district: "C",
            heat_2020: 7,
            heat_2021: 9,
            heat_2022: 8,
            heat_2023: 6,
          },
        },
        {
          type: "Feature",
          id: "district-d",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.945, 41.015], [28.95, 41.015], [28.95, 41.02], [28.945, 41.02], [28.945, 41.015]]],
          },
          properties: {
            district: "D",
            heat_2020: 14,
            heat_2021: 13,
            heat_2022: 17,
            heat_2023: 15,
          },
        },
      ],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 4,
      fields: ["district", "heat_2020", "heat_2021", "heat_2022", "heat_2023"],
      datasetContext: {
        datasetTitle: "District Heat Trajectories",
        source: "Vitest seeded polygon layer",
      },
    },
  };
}

function mountPanel() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

async function dispatchClick(element: Element | null): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function waitFor(check: () => void, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - started > timeoutMs) {
        throw error;
      }
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
    }
  }
}

beforeEach(() => {
  useFlowStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
});

describe("MapEmergingHotSpotViz", () => {
  it("runs from the embedded workflow surface, publishes a temporal layer, and saves a workflow-specific completed run", async () => {
    const sourceLayer = makeTemporalPolygonLayer();
    useMapExplorerStore.setState({ overlayLayers: [sourceLayer] });

    const { container, root } = mountPanel();
    await act(async () => {
      root.render(
        <MapEmergingHotSpotViz
          overlayLayers={[sourceLayer]}
          visible
          onClose={() => {}}
          presentation="embedded"
          flowId="emerging_hot_spot"
          showMapExplorerShortcut
        />,
      );
    });

    await dispatchClick(container.querySelector('[data-testid="emerging-hotspot-open-map"]'));
    expect(useMapExplorerStore.getState().isOpen).toBe(true);

    await waitFor(() => {
      const sourceSelect = container.querySelector('[data-testid="emerging-hotspot-source-select"]') as HTMLSelectElement | null;
      const runButton = container.querySelector('[data-testid="emerging-hotspot-run"]') as HTMLButtonElement | null;
      expect(sourceSelect?.value).toBe("emerging-hotspot-source");
      expect(runButton).not.toBeNull();
      expect(runButton?.disabled).toBe(false);
    });

    await dispatchClick(container.querySelector('[data-testid="emerging-hotspot-run"]'));

    await waitFor(() => {
      const state = useMapExplorerStore.getState();
      expect(state.overlayLayers).toHaveLength(2);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    const analysisLayer = useMapExplorerStore.getState().overlayLayers.find((layer) => layer.group === "analysis");
    const completedRun = useFlowStore.getState().completedRuns[0];

    expect(analysisLayer?.metadata?.analysisResult?.engine).toBe("EmergingHotSpots");
    expect(completedRun?.flowId).toBe("emerging_hot_spot");
    expect(completedRun?.label).toContain("Emerging Hot Spots");
    expect(container.querySelector('[data-testid="emerging-hotspot-last-run"]')?.textContent).toContain("time steps");
    expect(container.querySelector('[data-testid="emerging-hotspot-legend"]')?.textContent).toMatch(/Hot Spot|Cold Spot/);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});