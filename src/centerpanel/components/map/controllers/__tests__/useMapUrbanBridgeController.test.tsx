// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import {
  applyMapFitBounds,
  useMapUrbanBridgeController,
} from "../useMapUrbanBridgeController";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function createMapMock() {
  return {
    getZoom: vi.fn(() => 11),
    easeTo: vi.fn(),
    fitBounds: vi.fn(),
  };
}

function renderUrbanBridgeHook(map: ReturnType<typeof createMapMock>) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const mapRef = { current: map };

  function Harness() {
    useMapUrbanBridgeController({
      open: true,
      reducedMotion: true,
      mapInstanceRef: mapRef as never,
      onUrbanToMapMethodRequest: () => undefined,
    });
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

beforeEach(() => {
  useMapExplorerStore.setState({
    pendingFitBounds: null,
    lastExplicitFitRequest: null,
  });
});

describe("useMapUrbanBridgeController", () => {
  it("applies point and extent bounds with the same map commands as the modal", () => {
    const pointMap = createMapMock();
    applyMapFitBounds(pointMap as never, [29, 41, 29, 41], true);
    expect(pointMap.easeTo).toHaveBeenCalledWith({
      center: [29, 41],
      zoom: 14,
      duration: 0,
      essential: true,
    });

    const extentMap = createMapMock();
    applyMapFitBounds(extentMap as never, [28.9, 40.9, 29.2, 41.2], false);
    expect(extentMap.fitBounds).toHaveBeenCalledWith(
      [[28.9, 40.9], [29.2, 41.2]],
      { padding: 64, duration: 900, essential: true },
    );
  });

  it("consumes queued pending fit-bounds requests through the typed store bridge", () => {
    const map = createMapMock();
    useMapExplorerStore.getState().requestFitBounds({
      bounds: [28.9, 40.9, 29.2, 41.2],
      source: "urban-study-area",
    });

    const hook = renderUrbanBridgeHook(map);

    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(useMapExplorerStore.getState().pendingFitBounds).toBeNull();

    hook.cleanup();
  });
});
