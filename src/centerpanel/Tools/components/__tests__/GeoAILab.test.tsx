// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import GeoAILab from "../GeoAILab";
import { createImportedRasterSource, useEOSourceStore } from "@/services/data/eo";
import { useFlowStore } from "@/stores/useFlowStore";
import { useGeoAIStatusStore } from "@/stores/useGeoAIStatusStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import type { CatalogItem } from "@/services/data/connectors/types";

const spatialDbMock = vi.hoisted(() => ({
  loadGeoJSON: vi.fn(async () => {}),
  bindTableAlias: vi.fn(async () => {}),
  inspectTable: vi.fn(async (tableName: string) => {
    if (tableName === "worker_parcels_import") {
      return {
        name: tableName,
        columns: [
          { name: "parcel_id", type: "VARCHAR" },
          { name: "risk_score", type: "DOUBLE" },
          { name: "name", type: "VARCHAR" },
          { name: "geometry", type: "GEOMETRY" },
        ],
        rowCount: 2,
        geometryColumn: "geometry",
        geometryType: "POLYGON",
        sampleRows: [
          { parcel_id: "P-104", risk_score: 81, name: "Parcel Alpha", geometry: "POLYGON((...))" },
          { parcel_id: "P-208", risk_score: 52, name: "Parcel Beta", geometry: "POLYGON((...))" },
        ],
      };
    }

    return {
      name: tableName,
      columns: [],
      rowCount: 0,
      geometryColumn: null,
      geometryType: null,
      sampleRows: [],
    };
  }),
  runQuery: vi.fn(async (sql: string) => {
    if (sql.includes("risk_score > 70")) {
      return {
        columns: [
          { name: "parcel_id", type: "VARCHAR" },
          { name: "risk_score", type: "DOUBLE" },
          { name: "geometry", type: "GEOMETRY" },
        ],
        rows: [{ parcel_id: "P-104", risk_score: 81, geometry: "POLYGON((28.94 41.01,28.95 41.01,28.95 41.02,28.94 41.02,28.94 41.01))" }],
        rowCount: 1,
        elapsed: 12,
      };
    }

    return {
      columns: [{ name: "geometry", type: "GEOMETRY" }],
      rows: [{ geometry: "POINT(28.94 41.01)" }],
      rowCount: 1,
      elapsed: 8,
    };
  }),
  runToGeoJSON: vi.fn(async () => ({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[28.94, 41.01], [28.95, 41.01], [28.95, 41.02], [28.94, 41.02], [28.94, 41.01]]],
        },
        properties: {
          parcel_id: "P-104",
          risk_score: 81,
        },
      },
    ],
  })),
}));

vi.mock("@/engine/spatial-db", () => ({
  useSpatialDB: () => ({
    ready: true,
    error: null,
    tables: [],
    runQuery: spatialDbMock.runQuery,
    inspectTable: spatialDbMock.inspectTable,
    bindTableAlias: spatialDbMock.bindTableAlias,
    runToGeoJSON: spatialDbMock.runToGeoJSON,
    loadGeoJSON: spatialDbMock.loadGeoJSON,
    loadCSV: vi.fn(),
    refreshTables: vi.fn(),
  }),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeAnalysisRaster() {
  const width = 10;
  const height = 10;
  const pixelCount = width * height;
  return {
    width,
    height,
    bandCount: 4,
    bbox: [28.94, 41.01, 28.95, 41.02] as [number, number, number, number],
    data: [
      Float64Array.from({ length: pixelCount }, (_, index) => index % width),
      Float64Array.from({ length: pixelCount }, (_, index) => (index % width) * 0.25),
      Float64Array.from({ length: pixelCount }, (_, index) => Math.floor(index / width)),
      Float64Array.from({ length: pixelCount }, (_, index) => (index % width) + Math.floor(index / width)),
    ],
  };
}

function makeCatalogItem(): CatalogItem {
  return {
    id: "STAC_BLOCKED_ITEM",
    collection: "sentinel-2-l2a",
    provider: "stac",
    bbox: [28.94, 41.01, 29.04, 41.08],
    datetime: "2026-03-03T10:15:00Z",
    crs: "EPSG:4326",
    assets: [],
    geometry: null,
    properties: {},
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

async function setTextareaValue(element: HTMLTextAreaElement | null, value: string): Promise<void> {
  await act(async () => {
    if (element) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

async function waitFor(check: () => void, timeoutMs = 4000): Promise<void> {
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
  useEOSourceStore.getState().clear();
  useFlowStore.getState().reset();
  useGeoAIStatusStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  spatialDbMock.loadGeoJSON.mockClear();
  spatialDbMock.bindTableAlias.mockClear();
  spatialDbMock.inspectTable.mockClear();
  spatialDbMock.runQuery.mockClear();
  spatialDbMock.runToGeoJSON.mockClear();
});

function makeLiveQueryLayer() {
  return {
    id: "live-parcels-layer",
    name: "Imported Parcels Layer",
    type: "geojson" as const,
    visible: true,
    opacity: 1,
    group: "data" as const,
    sourceData: {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "Polygon" as const,
            coordinates: [[[28.94, 41.01], [28.95, 41.01], [28.95, 41.02], [28.94, 41.02], [28.94, 41.01]]],
          },
          properties: {
            parcel_id: "P-104",
            risk_score: 81,
            name: "Parcel Alpha",
          },
        },
        {
          type: "Feature" as const,
          geometry: {
            type: "Polygon" as const,
            coordinates: [[[28.951, 41.015], [28.956, 41.015], [28.956, 41.019], [28.951, 41.019], [28.951, 41.015]]],
          },
          properties: {
            parcel_id: "P-208",
            risk_score: 52,
            name: "Parcel Beta",
          },
        },
      ],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 2,
      fields: ["parcel_id", "risk_score", "name"],
      datasetContext: {
        datasetTitle: "Imported Parcels",
        source: "Manual import",
      },
    },
  };
}

function makeColumnarQueryLayer() {
  return {
    ...makeLiveQueryLayer(),
    id: "columnar-live-parcels-layer",
    name: "Imported GeoParquet Parcels",
    metadata: {
      geometryType: "Polygon",
      featureCount: 2,
      fields: ["parcel_id", "risk_score", "name"],
      columnar: {
        format: "geoparquet" as const,
        geometryColumn: "geometry",
        geometryEncoding: "wkb" as const,
        rowCount: 2,
        estimatedMemoryBytes: 256,
        transferSizeBytes: 128,
        workerTableName: "worker_parcels_import",
        crs: "EPSG:4326",
      },
      datasetContext: {
        datasetTitle: "Imported GeoParquet Parcels",
        source: "GeoParquet import",
      },
    },
  };
}

describe("GeoAILab", () => {
  it("labels demo mode explicitly and blocks STAC metadata-only selections", async () => {
    const stacSource = useEOSourceStore.getState().registerStacItems([makeCatalogItem()])[0];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    const sourceSelect = container.querySelector('[data-testid="geoai-land-cover-source-select"]') as HTMLSelectElement | null;
    await setSelectValue(sourceSelect, "demo-raster-bosphorus");
    expect(container.querySelector('[data-testid="geoai-land-cover-mode"]')?.textContent).toContain("Demo source");

    await setSelectValue(sourceSelect, stacSource!.id);

    expect(container.querySelector('[data-testid="geoai-land-cover-readiness"]')?.textContent).toContain("Catalog items are metadata only");
    expect((container.querySelector('[data-testid="geoai-land-cover-run"]') as HTMLButtonElement | null)?.disabled).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("runs on a real imported raster and persists map plus completed-run provenance", async () => {
    const source = createImportedRasterSource({
      title: "Imported Raster Real Source",
      sourceRef: "file://real-source.tif",
      bbox: [28.94, 41.01, 28.95, 41.02],
      crs: "EPSG:4326",
      bandMapping: [
        { key: "blue", source: "band-1", label: "Blue" },
        { key: "green", source: "band-2", label: "Green" },
        { key: "red", source: "band-3", label: "Red" },
        { key: "nir", source: "band-4", label: "Near Infrared" },
      ],
      analysisRaster: makeAnalysisRaster(),
    });
    useEOSourceStore.getState().upsertSource(source);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    const sourceSelect = container.querySelector('[data-testid="geoai-land-cover-source-select"]') as HTMLSelectElement | null;
    await setSelectValue(sourceSelect, source.id);
    expect(container.querySelector('[data-testid="geoai-land-cover-mode"]')?.textContent).toContain("Real source");

    await dispatchClick(container.querySelector('[data-testid="geoai-land-cover-run"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    expect(container.querySelector('[data-testid="geoai-land-cover-notice"]')?.textContent).toContain("Real source classification published");
    expect(useMapExplorerStore.getState().overlayLayers[0]?.metadata?.eoSource?.sourceId).toBe(source.id);
    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[0]?.preview[0]).toMatchObject({
      runtime_mode: "real-source",
      source_id: source.id,
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("adds selected GeoAI land-cover output as a map layer", async () => {
    const source = createImportedRasterSource({
      title: "Imported Raster Real Source",
      sourceRef: "file://real-source.tif",
      bbox: [28.94, 41.01, 28.95, 41.02],
      crs: "EPSG:4326",
      bandMapping: [
        { key: "blue", source: "band-1", label: "Blue" },
        { key: "green", source: "band-2", label: "Green" },
        { key: "red", source: "band-3", label: "Red" },
        { key: "nir", source: "band-4", label: "Near Infrared" },
      ],
      analysisRaster: makeAnalysisRaster(),
    });
    useEOSourceStore.getState().upsertSource(source);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    const sourceSelect = container.querySelector('[data-testid="geoai-land-cover-source-select"]') as HTMLSelectElement | null;
    await setSelectValue(sourceSelect, source.id);
    await dispatchClick(container.querySelector('[data-testid="geoai-land-cover-run"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    });

    const store = useMapExplorerStore.getState();
    const selectedLayer = store.overlayLayers[0];
    expect(selectedLayer?.metadata?.analysisResult?.engine).toBe("LandCoverClassifier");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("runs live SQL against a real map layer and publishes the result", async () => {
    useMapExplorerStore.getState().addOverlayLayer(makeLiveQueryLayer());

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-readiness"]')?.textContent).toContain("table");
    });

    expect(container.querySelector('[data-testid="geoai-query-mode"]')?.textContent).toContain("Live project data");
    expect((container.querySelector('[data-testid="geoai-query-alias-live-parcels-layer"]') as HTMLSelectElement | null)?.value).toBe("parcels");

    await setTextareaValue(container.querySelector('[data-testid="geoai-query-input"]') as HTMLTextAreaElement | null, "Find parcels where risk score > 70");
    await dispatchClick(container.querySelector('[data-testid="geoai-query-run"]'));

    await waitFor(() => {
      expect(spatialDbMock.loadGeoJSON).toHaveBeenCalledWith("parcels", expect.any(Object));
      expect(spatialDbMock.runQuery).toHaveBeenCalledTimes(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(2);
    });

    expect(container.querySelector('[data-testid="geoai-query-notice"]')?.textContent).toContain("Live project data query published");
    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[0]?.preview[0]).toMatchObject({
      runtime_mode: "live-project-data",
      executed: true,
      published: true,
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("runs live SQL against an imported worker-backed table and binds a safe alias", async () => {
    useMapExplorerStore.getState().addOverlayLayer(makeColumnarQueryLayer());

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-readiness"]')?.textContent).toContain("worker-backed import table");
      expect(spatialDbMock.inspectTable).toHaveBeenCalledWith("worker_parcels_import", 2);
    });

    await setTextareaValue(container.querySelector('[data-testid="geoai-query-input"]') as HTMLTextAreaElement | null, "Find parcels where risk score > 70");
    await dispatchClick(container.querySelector('[data-testid="geoai-query-run"]'));

    await waitFor(() => {
      expect(spatialDbMock.bindTableAlias).toHaveBeenCalledWith("parcels", "worker_parcels_import");
      expect(spatialDbMock.runQuery).toHaveBeenCalledTimes(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(2);
    });

    expect(container.querySelector('[data-testid="geoai-query-notice"]')?.textContent).toContain("Live project data query published");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("explains missing live fields without silently falling back to demo data", async () => {
    useMapExplorerStore.getState().addOverlayLayer(makeLiveQueryLayer());

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-readiness"]')?.textContent).toContain("table");
    });

    await setTextareaValue(container.querySelector('[data-testid="geoai-query-input"]') as HTMLTextAreaElement | null, "Find parcels where height > 10");
    await dispatchClick(container.querySelector('[data-testid="geoai-query-run"]'));

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-notice"]')?.textContent ?? "").toContain('Requested field "height" is not available');
    });

    expect(container.querySelector('[data-testid="geoai-query-mode"]')?.textContent).toContain("Live project data");
    expect(spatialDbMock.runQuery).not.toHaveBeenCalledWith(expect.stringContaining("height > 10"));

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("surfaces live-mode rejection without silently switching to demo data", async () => {
    useMapExplorerStore.getState().addOverlayLayer(makeLiveQueryLayer());

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeoAILab />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-readiness"]')?.textContent).toContain("table");
    });

    await setTextareaValue(container.querySelector('[data-testid="geoai-query-input"]') as HTMLTextAreaElement | null, "DROP TABLE parcels");
    await dispatchClick(container.querySelector('[data-testid="geoai-query-run"]'));

    await waitFor(() => {
      expect(container.querySelector('[data-testid="geoai-query-notice"]')?.textContent ?? "").toMatch(/mutating|rejected/i);
    });

    expect(container.querySelector('[data-testid="geoai-query-mode"]')?.textContent).toContain("Live project data");
    expect(spatialDbMock.runQuery).not.toHaveBeenCalled();
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
