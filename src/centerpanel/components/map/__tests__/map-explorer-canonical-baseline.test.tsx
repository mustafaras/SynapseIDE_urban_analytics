// @vitest-environment jsdom

/**
 * Canonical-surface baseline smoke test (Map Explorer Production GIS, Prompt 1).
 *
 * Freezes a trusted baseline for the canonical Map Explorer surface
 * (`src/centerpanel/components/map/` — see
 * `docs/architecture/map-explorer-canonical-surface.md`). This is the Proof for
 * Prompt 1: it mounts and unmounts the orchestrator and asserts a layer can be
 * added to and removed from `useMapExplorerStore`.
 *
 * Why mount with `open={false}`: `MapExplorerModal` returns `null` before any
 * portal/`MapCanvas` render when closed, but still executes its full hook graph
 * at mount. That exercises the orchestrator's lifecycle without requiring WebGL
 * or a MapLibre mock in jsdom. Open-state rendering is covered by the Playwright
 * map smoke and by `MapCanvas.lifecycle.test.tsx` (which mocks `maplibre-gl`).
 *
 * Smoke coverage NOT duplicated here (already exists — Prompt 1 adds only where
 * missing):
 *   - Store layer add→remove unit suite: `map-layer-management.test.ts`.
 *   - Urban handoff entry point fires:
 *     `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`.
 */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";

import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(async () => {
  const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
  useMapExplorerStore.setState({ overlayLayers: [] });
});

describe("Map Explorer canonical surface — baseline smoke", () => {
  it("mounts and unmounts MapExplorerModal cleanly", async () => {
    const { MapExplorerModal } = await import("../../MapExplorerModal");

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(MapExplorerModal, {
          open: false,
          onClose: () => undefined,
        }),
      );
    });

    // Closed modal renders nothing into the document; mounting did not throw.
    expect(container.childElementCount).toBe(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  }, 30000);

  it("adds a layer to and removes it from useMapExplorerStore", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");

    const layer: OverlayLayerConfig = {
      id: "baseline-smoke-layer",
      name: "Baseline Smoke Layer",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
    };

    useMapExplorerStore.getState().addOverlayLayer(layer);
    expect(
      useMapExplorerStore.getState().overlayLayers.some((entry) => entry.id === layer.id),
    ).toBe(true);

    useMapExplorerStore.getState().removeOverlayLayer(layer.id);
    expect(
      useMapExplorerStore.getState().overlayLayers.some((entry) => entry.id === layer.id),
    ).toBe(false);
  });
});
