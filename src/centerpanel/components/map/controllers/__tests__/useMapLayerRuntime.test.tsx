// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";

import type { OverlayLayerConfig } from "../../mapTypes";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useMapLayerRuntime } from "../useMapLayerRuntime";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeLayer(id: string): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
  };
}

function renderLayerRuntimeHook() {
  let current: ReturnType<typeof useMapLayerRuntime> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  function Harness() {
    current = useMapLayerRuntime();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    get current() {
      if (!current) {
        throw new Error("useMapLayerRuntime did not render");
      }
      return current;
    },
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

beforeEach(() => {
  useMapExplorerStore.setState({ overlayLayers: [] });
});

describe("useMapLayerRuntime", () => {
  it("adds, removes, and reorders overlay layers through the store", () => {
    const hook = renderLayerRuntimeHook();

    act(() => {
      hook.current.addOverlayLayer(makeLayer("a"));
      hook.current.addOverlayLayer(makeLayer("b"));
      hook.current.addOverlayLayer(makeLayer("c"));
    });

    expect(useMapExplorerStore.getState().overlayLayers.map((layer) => layer.id)).toEqual(["a", "b", "c"]);

    act(() => {
      hook.current.reorderLayers(["c", "a", "b"]);
    });

    expect(useMapExplorerStore.getState().overlayLayers.map((layer) => layer.id)).toEqual(["c", "a", "b"]);

    act(() => {
      hook.current.removeOverlayLayer("a");
    });

    expect(useMapExplorerStore.getState().overlayLayers.map((layer) => layer.id)).toEqual(["c", "b"]);

    hook.cleanup();
  });
});
