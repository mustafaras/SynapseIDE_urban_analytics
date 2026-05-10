// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import type { CatalogItem, COGMetadata, COGReadResult } from "@/services/data/connectors/types";
import EOConnectorPanel from "../EOConnectorPanel";
import { useEOSourceStore } from "@/services/data/eo";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { stacSearch } from "@/services/data/connectors/STACClient";
import { cogMetadata, cogRead } from "@/services/data/connectors/COGReader";

vi.mock("@/services/data/connectors/STACClient", () => ({
  stacSearch: vi.fn(),
}));

vi.mock("@/services/data/connectors/COGReader", () => ({
  cogMetadata: vi.fn(),
  cogRead: vi.fn(),
}));

vi.mock("@/services/data/connectors/SentinelHubConnector", () => ({
  ensureToken: vi.fn(),
  fetchB04: vi.fn(),
  fetchB08: vi.fn(),
  fetchBands: vi.fn(),
  fetchNDVI: vi.fn(),
  isTokenValid: vi.fn(() => false),
  searchCatalog: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeCatalogItem(): CatalogItem {
  return {
    id: "S2A_TEST_ITEM",
    collection: "sentinel-2-l2a",
    provider: "stac",
    bbox: [28.94, 41.01, 29.04, 41.08],
    datetime: {
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-03T23:59:59Z",
    },
    cloudCover: 12.5,
    gsd: 10,
    crs: "EPSG:4326",
    assets: [
      {
        key: "visual",
        title: "Visual COG",
        href: "https://example.com/visual.tif",
        mediaType: "image/tiff; application=geotiff; profile=cloud-optimized",
        extra: {},
      },
    ],
    geometry: {
      type: "Polygon",
      coordinates: [[
        [28.94, 41.01],
        [29.04, 41.01],
        [29.04, 41.08],
        [28.94, 41.08],
        [28.94, 41.01],
      ]],
    },
    properties: {},
    selfLink: "https://example.com/items/S2A_TEST_ITEM",
  };
}

function makeCogMetadata(): COGMetadata {
  return {
    width: 128,
    height: 64,
    bandCount: 1,
    dtype: "uint16",
    compression: 1,
    crs: "EPSG:4326",
    transform: [28.94, 0.0001, 0, 41.08, 0, -0.0001],
    bbox: [28.94, 41.01, 29.04, 41.08],
    overviewCount: 2,
    tileSize: [256, 256],
    noData: [0],
  };
}

function makeCogPreview(metadata: COGMetadata): COGReadResult {
  return {
    data: [Float64Array.from([1, 2, 3, 4])],
    width: 2,
    height: 2,
    metadata,
  };
}

async function dispatchClick(element: Element | null): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function setSelectValue(element: HTMLSelectElement | null, value: string): Promise<void> {
  await act(async () => {
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useEOSourceStore.getState().clear();
  useFlowStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
});

describe("EOConnectorPanel", () => {
  it("loads a demo source, publishes it to the map, and saves a completed run", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EOConnectorPanel));
    });

    await dispatchClick(container.querySelector('[data-testid="eo-load-demo"]'));

    expect(container.querySelector('[data-testid="eo-selected-source-state"]')?.textContent?.toLowerCase()).toContain("demo");

    await dispatchClick(container.querySelector('[data-testid="eo-publish-map"]'));

    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    expect(useMapExplorerStore.getState().isOpen).toBe(true);

    await dispatchClick(container.querySelector('[data-testid="eo-save-run"]'));

    expect(useFlowStore.getState().completedRuns).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("records credential-missing runtime state for Sentinel Hub attempts without credentials", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EOConnectorPanel));
    });

    const envelopeSelect = container.querySelector('[data-testid="eo-envelope-select"]') as HTMLSelectElement | null;
    await setSelectValue(envelopeSelect, "custom-bbox");

    await dispatchClick(container.querySelector('[data-testid="eo-sentinel-run"]'));

    expect(container.querySelector('[data-testid="eo-selected-source-state"]')?.textContent).toContain("credential-missing");
    expect(container.querySelector('[data-testid="eo-sentinel-credential-state"]')?.textContent).toContain("credential-missing");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("lists STAC results and inspects COG metadata with a sample preview", async () => {
    const stacSearchMock = vi.mocked(stacSearch);
    const cogMetadataMock = vi.mocked(cogMetadata);
    const cogReadMock = vi.mocked(cogRead);
    const metadata = makeCogMetadata();

    stacSearchMock.mockResolvedValue({
      items: [makeCatalogItem()],
      matched: 1,
      nextToken: null,
    });
    cogMetadataMock.mockResolvedValue(metadata);
    cogReadMock.mockResolvedValue(makeCogPreview(metadata));

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EOConnectorPanel));
    });

    const envelopeSelect = container.querySelector('[data-testid="eo-envelope-select"]') as HTMLSelectElement | null;
    await setSelectValue(envelopeSelect, "custom-bbox");

    await dispatchClick(container.querySelector('[data-testid="eo-stac-search"]'));

    expect(stacSearchMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="eo-stac-results"]')?.textContent).toContain("S2A_TEST_ITEM");
    expect(container.querySelector('[data-testid="eo-stac-matched"]')?.textContent).toContain("Matched 1");

    const inspectButton = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Inspect selected asset as COG")) ?? null;
    await dispatchClick(inspectButton);

    expect(cogMetadataMock).toHaveBeenCalledTimes(1);
    expect(cogReadMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="eo-cog-metadata"]')?.textContent).toContain("EPSG:4326");
    expect(container.querySelector('[data-testid="eo-cog-sample"]')?.textContent).toContain("Sample window");
    expect(container.querySelector('[data-testid="eo-selected-source-title"]')?.textContent).toContain("COG Asset");
    expect(container.querySelector('[data-testid="eo-activity-history"]')?.textContent).toContain("COG inspect");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
