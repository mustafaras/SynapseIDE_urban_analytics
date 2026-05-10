// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import AccessibilityFlow from "../AccessibilityFlow";
import { MAP_ANALYSIS_DISPATCH_KEY, type MapIsochroneDispatchPayload } from "@/services/map/MapAnalysisDispatcher";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

vi.mock("@/ui/toast/api", () => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountFlow() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

async function waitFor(check: () => void, timeoutMs = 4000): Promise<void> {
  const startedAt = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - startedAt > timeoutMs) {
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
  document.body.innerHTML = "";
});

describe("AccessibilityFlow map dispatch", () => {
  it("auto-runs an isochrone dispatch, publishes a map layer, and saves the run", async () => {
    const payload: MapIsochroneDispatchPayload = {
      kind: "isochrone",
      requestId: "isochrone-test-request",
      source: "map-context-menu",
      origin: { lng: 28.9784, lat: 41.0082 },
      thresholdMinutes: 20,
      restrictToView: true,
      viewBounds: [28.96, 40.99, 28.99, 41.02],
      createdAt: new Date().toISOString(),
    };
    useFlowStore.getState().setStepData(MAP_ANALYSIS_DISPATCH_KEY, payload);

    const { container, root } = mountFlow();
    await act(async () => {
      root.render(<AccessibilityFlow />);
    });

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
      expect(useMapExplorerStore.getState().isOpen).toBe(true);
    });

    const publishedLayer = useMapExplorerStore.getState().overlayLayers[0];
    const completedRun = useFlowStore.getState().completedRuns[0];

    expect(publishedLayer?.name).toContain("Isochrone 20 min");
    expect(publishedLayer?.sourceKind).toBe("derived");
    expect(publishedLayer?.metadata?.geometryType).toBeTruthy();
    expect(completedRun?.flowId).toBe("accessibility");
    expect(container.textContent).toContain("Published map-dispatch isochrone to Map Explorer");
    expect(useFlowStore.getState().stepData[MAP_ANALYSIS_DISPATCH_KEY]).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});