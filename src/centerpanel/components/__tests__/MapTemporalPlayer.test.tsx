// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type maplibregl from "maplibre-gl";

import { MapTemporalPlayer, type TemporalFrame } from "../MapTemporalPlayer";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type FakeSource = {
  setData: ReturnType<typeof vi.fn>;
};

type FakeLayer = {
  id: string;
  type: string;
};

type FakeMap = ReturnType<typeof createFakeMap>;

function asMapLibre(map: FakeMap): maplibregl.Map {
  return map as unknown as maplibregl.Map;
}

function makeFrame(key: string, value: number): TemporalFrame {
  return {
    key,
    label: `Step ${key}`,
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: `feature-${key}`,
          geometry: {
            type: "Point",
            coordinates: [28.95 + value * 0.001, 41.01],
          },
          properties: { value },
        },
      ],
    },
  };
}

function createFakeMap(options: { hasExistingSource?: boolean; hasExistingLayer?: boolean } = {}) {
  const source: FakeSource = { setData: vi.fn() };
  const sources = new Map<string, FakeSource>();
  const layers = new Map<string, FakeLayer>();

  if (options.hasExistingSource) sources.set("temporal-source", source);
  if (options.hasExistingLayer) layers.set("temporal-layer", { id: "temporal-layer", type: "circle" });

  return {
    source,
    addSource: vi.fn((id: string) => {
      sources.set(id, source);
    }),
    addLayer: vi.fn((layer: FakeLayer) => {
      layers.set(layer.id, layer);
    }),
    getSource: vi.fn((id: string) => sources.get(id)),
    getLayer: vi.fn((id: string) => layers.get(id)),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    isStyleLoaded: vi.fn(() => true),
    on: vi.fn(),
    off: vi.fn(),
  };
}

function mountPlayer(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root, element };
}

async function renderPlayer(element: React.ReactElement) {
  const mounted = mountPlayer(element);
  await act(async () => {
    mounted.root.render(mounted.element);
  });
  return mounted;
}

async function unmountPlayer(root: ReturnType<typeof createRoot>, container: HTMLElement) {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

async function clickButton(container: HTMLElement, ariaLabel: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === ariaLabel,
  );
  expect(button).toBeTruthy();
  await act(async () => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  useMapExplorerStore.setState({
    currentTimestep: 0,
    isPlaying: false,
    playbackSpeed: 1,
    timeRange: { start: 0, end: 0 },
  });
});

describe("MapTemporalPlayer", () => {
  it("renders visible playback controls, labeled timeline, and updates the store", async () => {
    const map = createFakeMap({ hasExistingSource: true, hasExistingLayer: true });
    const frames = [makeFrame("0", 0), makeFrame("1", 1), makeFrame("2", 2)];

    const { container, root } = await renderPlayer(
      <MapTemporalPlayer
        map={asMapLibre(map)}
        frames={frames}
        layerName="Urban growth simulation"
      />,
    );

    expect(container.querySelector('[aria-label="Temporal animation player"]')).toBeTruthy();
    expect(container.textContent).toContain("Step 0");
    expect(container.textContent).toContain("1/3");
    expect(map.source.setData).toHaveBeenCalledWith(frames[0]?.data);

    await clickButton(container, "Step forward");

    expect(useMapExplorerStore.getState().currentTimestep).toBe(1);
    expect(container.textContent).toContain("Step 1");
    expect(container.textContent).toContain("2/3");

    await clickButton(container, "Set speed to 2x");

    expect(useMapExplorerStore.getState().playbackSpeed).toBe(2);

    await unmountPlayer(root, container);
  });

  it("builds continuous-mode frames from timestamp or time_step properties", async () => {
    const map = createFakeMap();
    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "a",
          geometry: { type: "Point", coordinates: [28.95, 41.01] },
          properties: { time_step: 0, value: 12 },
        },
        {
          type: "Feature",
          id: "b",
          geometry: { type: "Point", coordinates: [28.96, 41.02] },
          properties: { timestamp: "2024-01-02T00:00:00Z", value: 18 },
        },
      ],
    };

    const { container, root } = await renderPlayer(
      <MapTemporalPlayer
        map={asMapLibre(map)}
        featureCollection={featureCollection}
        layerName="Mixed temporal fields"
      />,
    );

    expect(container.querySelector('[aria-label="Timeline scrubber"]')).toBeTruthy();
    expect(container.textContent).toContain("Step 0");
    expect(container.textContent).toContain("1/2");
    expect(map.addSource).toHaveBeenCalledWith("temporal-source", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    await clickButton(container, "Step forward");

    expect(useMapExplorerStore.getState().currentTimestep).toBe(1);
    expect(container.textContent).toContain("2/2");

    await unmountPlayer(root, container);
  });

  it("does not remove MapLibre source or layer that already existed outside the player", async () => {
    const map = createFakeMap({ hasExistingSource: true, hasExistingLayer: true });

    const { container, root } = await renderPlayer(
      <MapTemporalPlayer
        map={asMapLibre(map)}
        frames={[makeFrame("0", 0), makeFrame("1", 1)]}
      />,
    );

    await unmountPlayer(root, container);

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });

  it("removes only the MapLibre source and layer it created", async () => {
    const map = createFakeMap();

    const { container, root } = await renderPlayer(
      <MapTemporalPlayer
        map={asMapLibre(map)}
        frames={[makeFrame("0", 0), makeFrame("1", 1)]}
      />,
    );

    await unmountPlayer(root, container);

    expect(map.removeLayer).toHaveBeenCalledWith("temporal-layer");
    expect(map.removeSource).toHaveBeenCalledWith("temporal-source");
  });
});
