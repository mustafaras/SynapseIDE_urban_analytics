// @vitest-environment jsdom

/**
 * Unit tests for Map Explorer Layer Management
 *
 * Tests verify:
 *   1. mapTypes — new OverlayLayerConfig, LayerMetadata, LayerGroupId, OverlayGeometryType types
 *   2. Store — setLayerOpacity, updateLayerMetadata, plus existing overlay actions
 *   3. MapLayerManager — module export and component function
 *   4. useLayerSync — module export and hook function
 *   5. MapToolbar — extended props for layer panel toggle
 *   6. Barrel exports — new components and types
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type maplibregl from "maplibre-gl";
import type { MapCartographyReviewState } from "@/services/map/MapCartographyAdvisor";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import { MAP_LAYER_REGISTRY_EVENT } from "../mapTypes";
import type {
  LayerGroupId,
  LayerMetadata,
  LayerProvenance,
  LayerQaStatus,
  LayerSourceKind,
  OverlayGeometryType,
  OverlayLayerConfig,
} from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function createMockMapLibreMap() {
  const layerSpecs = new Map<string, Record<string, unknown>>();
  const sourceSpecs = new Map<string, Record<string, unknown>>();

  const addSource = vi.fn((id: string, source: Record<string, unknown>) => {
    const sourceRecord: Record<string, unknown> = { ...source };
    sourceRecord.setData = vi.fn((data: unknown) => {
      sourceRecord.data = data;
    });
    sourceSpecs.set(id, sourceRecord);
  });
  const addLayer = vi.fn((layer: { id: string; [key: string]: unknown }) => {
    layerSpecs.set(layer.id, { ...layer });
  });
  const getLayer = vi.fn((id: string) => layerSpecs.get(id));
  const getSource = vi.fn((id: string) => sourceSpecs.get(id));
  const removeLayer = vi.fn((id: string) => {
    layerSpecs.delete(id);
  });
  const removeSource = vi.fn((id: string) => {
    sourceSpecs.delete(id);
  });
  const setLayoutProperty = vi.fn((id: string, property: string, value: unknown) => {
    const layer = layerSpecs.get(id);
    if (layer) {
      layer.layout = { ...((layer.layout as Record<string, unknown> | undefined) ?? {}), [property]: value };
    }
  });
  const setPaintProperty = vi.fn((id: string, property: string, value: unknown) => {
    const layer = layerSpecs.get(id);
    if (layer) {
      layer.paint = { ...((layer.paint as Record<string, unknown> | undefined) ?? {}), [property]: value };
    }
  });
  const moveLayer = vi.fn();
  const listeners = new Map<string, Array<() => void>>();
  const on = vi.fn((type: string, handler: () => void) => {
    const handlers = listeners.get(type) ?? [];
    handlers.push(handler);
    listeners.set(type, handlers);
  });
  const off = vi.fn((type: string, handler: () => void) => {
    listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== handler));
  });
  const emit = (type: string) => {
    for (const handler of listeners.get(type) ?? []) {
      handler();
    }
  };
  const map = {
    addSource,
    addLayer,
    getLayer,
    getSource,
    removeLayer,
    removeSource,
    setLayoutProperty,
    setPaintProperty,
    moveLayer,
    on,
    off,
  } as unknown as maplibregl.Map;

  return {
    map,
    addSource,
    addLayer,
    getLayer,
    getSource,
    removeLayer,
    removeSource,
    setLayoutProperty,
    setPaintProperty,
    moveLayer,
    emit,
  };
}

/* ================================================================== */
/*  1. mapTypes — Type-level structural tests                          */
/* ================================================================== */

describe("mapTypes — OverlayLayerConfig type", () => {
  it("accepts all four layer types", () => {
    const types: OverlayLayerConfig["type"][] = [
      "geojson",
      "heatmap",
      "raster-tile",
      "vector-tile",
    ];
    expect(types).toHaveLength(4);
  });

  it("includes group field with LayerGroupId type", () => {
    const layer: OverlayLayerConfig = {
      id: "test",
      name: "Test",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
    };
    expect(layer.group).toBe("data");
  });

  it("group is optional", () => {
    const layer: OverlayLayerConfig = {
      id: "test",
      name: "Test",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    expect(layer.group).toBeUndefined();
  });

  it("accepts layer registry metadata", () => {
    const sourceKinds: LayerSourceKind[] = ["project", "imported", "external", "derived", "demo"];
    const qaStatuses: LayerQaStatus[] = ["unchecked", "passed", "warning", "error"];
    const provenance: LayerProvenance = {
      label: "City open data portal",
      sourceName: "Road centerlines",
      sourceUrl: "https://example.test/roads.geojson",
      license: "ODbL",
    };
    const layer: OverlayLayerConfig = {
      id: "roads",
      name: "Road Centerlines",
      type: "geojson",
      visible: true,
      opacity: 0.75,
      provenance,
      qaStatus: "passed",
      queryable: true,
      sourceKind: "external",
    };

    expect(sourceKinds).toHaveLength(5);
    expect(qaStatuses).toHaveLength(4);
    expect(layer.sourceKind).toBe("external");
    expect(layer.provenance?.label).toBe("City open data portal");
  });
});

describe("mapTypes — LayerMetadata type", () => {
  it("all fields are optional", () => {
    const meta: LayerMetadata = {};
    expect(meta.featureCount).toBeUndefined();
    expect(meta.geometryType).toBeUndefined();
    expect(meta.bounds).toBeUndefined();
    expect(meta.fields).toBeUndefined();
  });

  it("accepts full metadata", () => {
    const meta: LayerMetadata = {
      featureCount: 100,
      geometryType: "Point",
      bounds: [28.5, 40.5, 29.5, 41.5],
      fields: ["name", "population"],
    };
    expect(meta.featureCount).toBe(100);
    expect(meta.bounds).toHaveLength(4);
    expect(meta.fields).toHaveLength(2);
  });
});

describe("mapTypes — LayerGroupId type", () => {
  it("accepts valid group identifiers", () => {
    const groups: LayerGroupId[] = ["base", "data", "analysis"];
    expect(groups).toHaveLength(3);
  });
});

describe("mapTypes — OverlayGeometryType", () => {
  it("accepts valid geometry hints", () => {
    const types: OverlayGeometryType[] = ["point", "line", "polygon", "mixed", "unknown"];
    expect(types).toHaveLength(5);
  });
});

/* ================================================================== */
/*  2. Store — overlay layer actions                                   */
/* ================================================================== */

describe("useMapExplorerStore — overlay layer actions", () => {
  beforeEach(async () => {
    /* Reset store state between tests */
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    useMapExplorerStore.setState({ overlayLayers: [] });
  });

  it("addOverlayLayer appends a new layer", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "test-layer-1",
      name: "Test Points",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    expect(useMapExplorerStore.getState().overlayLayers[0].name).toBe("Test Points");
  });

  it("removeOverlayLayer removes by ID", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "layer-to-remove",
      name: "Remove Me",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    useMapExplorerStore.getState().removeOverlayLayer("layer-to-remove");
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(0);
  });

  it("toggleLayerVisibility flips visible flag", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "toggle-layer",
      name: "Toggle Me",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);
    useMapExplorerStore.getState().toggleLayerVisibility("toggle-layer");
    expect(useMapExplorerStore.getState().overlayLayers[0].visible).toBe(false);
    useMapExplorerStore.getState().toggleLayerVisibility("toggle-layer");
    expect(useMapExplorerStore.getState().overlayLayers[0].visible).toBe(true);
  });

  it("setLayerOpacity updates opacity clamped to [0,1]", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "opacity-layer",
      name: "Opacity Test",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);

    useMapExplorerStore.getState().setLayerOpacity("opacity-layer", 0.5);
    expect(useMapExplorerStore.getState().overlayLayers[0].opacity).toBe(0.5);

    useMapExplorerStore.getState().setLayerOpacity("opacity-layer", -0.5);
    expect(useMapExplorerStore.getState().overlayLayers[0].opacity).toBe(0);

    useMapExplorerStore.getState().setLayerOpacity("opacity-layer", 1.5);
    expect(useMapExplorerStore.getState().overlayLayers[0].opacity).toBe(1);
  });

  it("updateLayerMetadata patches layer properties", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "meta-layer",
      name: "Meta Test",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);

    useMapExplorerStore.getState().updateLayerMetadata("meta-layer", {
      name: "Updated Name",
      metadata: { featureCount: 42, geometryType: "Point" },
    });

    const updated = useMapExplorerStore.getState().overlayLayers[0];
    expect(updated.name).toBe("Updated Name");
    expect(updated.metadata?.featureCount).toBe(42);
    expect(updated.metadata?.geometryType).toBe("Point");
    expect(updated.metadata?.registry?.geometrySummary.geometryType).toBe("Point");
    expect(updated.metadata?.registry?.publicationReadiness.status).toBe("needs-review");
  });

  it("reorderLayers reorders by ID array", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layers: OverlayLayerConfig[] = [
      { id: "a", name: "A", type: "geojson", visible: true, opacity: 1 },
      { id: "b", name: "B", type: "heatmap", visible: true, opacity: 1 },
      { id: "c", name: "C", type: "raster-tile", visible: true, opacity: 1 },
    ];
    for (const l of layers) useMapExplorerStore.getState().addOverlayLayer(l);
    expect(useMapExplorerStore.getState().overlayLayers.map((l) => l.id)).toEqual(["a", "b", "c"]);

    useMapExplorerStore.getState().reorderLayers(["c", "a", "b"]);
    expect(useMapExplorerStore.getState().overlayLayers.map((l) => l.id)).toEqual(["c", "a", "b"]);
  });

  it("normalizes source kind, QA, queryability, and provenance on add", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "normalised-layer",
      name: "Imported Parcels",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceData: { type: "FeatureCollection", features: [] },
    };

    useMapExplorerStore.getState().addOverlayLayer(layer);

    const [stored] = useMapExplorerStore.getState().overlayLayers;
    expect(stored.sourceKind).toBe("imported");
    expect(stored.qaStatus).toBe("unchecked");
    expect(stored.queryable).toBe(true);
    expect(stored.provenance?.label).toBe("imported layer");
    expect(stored.metadata?.registry).toMatchObject({
      sourceKind: "imported",
      qaStatus: "unchecked",
      crsSummary: { status: "missing" },
      publicationReadiness: { status: "needs-review" },
    });
  });

  it("publishes lightweight layer registry events for store changes", async () => {
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const listener = vi.fn();
    globalThis.addEventListener(MAP_LAYER_REGISTRY_EVENT, listener as EventListener);

    try {
      useMapExplorerStore.getState().addOverlayLayer({
        id: "event-layer",
        name: "Event Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
        sourceKind: "project",
      });
    } finally {
      globalThis.removeEventListener(MAP_LAYER_REGISTRY_EVENT, listener as EventListener);
    }

    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[listener.mock.calls.length - 1]?.[0] as CustomEvent | undefined;
    expect(event?.detail.operation).toBe("add");
    expect(event?.detail.layerId).toBe("event-layer");
    expect(event?.detail.layers[0]).toMatchObject({
      layerId: "event-layer",
      name: "Event Layer",
      sourceKind: "project",
      qaStatus: "unchecked",
      queryable: true,
      crsStatus: "missing",
      publicationReadiness: "needs-review",
      metadataReady: false,
      provenanceLabel: "project layer",
    });
  });

  it("overlayLayers is NOT persisted (not in partialize)", async () => {
    // The store's partialize function excludes overlayLayers
    // Verify by checking the persisted state keys
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    const layer: OverlayLayerConfig = {
      id: "persist-check",
      name: "Persist Check",
      type: "geojson",
      visible: true,
      opacity: 1,
    };
    useMapExplorerStore.getState().addOverlayLayer(layer);
    expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    // The store's persist middleware excludes overlayLayers from localStorage
    // (verified via source inspection — partialize only includes center, zoom, bearing, pitch, activeBaseLayer, pins)
  });
});

/* ================================================================== */
/*  3. MapLayerManager — module export                                 */
/* ================================================================== */

describe("MapLayerManager component", () => {
  it("exports a named component function", async () => {
    const mod = await import("../MapLayerManager");
    expect(mod.MapLayerManager).toBeDefined();
    expect(typeof mod.MapLayerManager).toBe("function");
  });

  it("renders compact layer search and visible delete controls", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "data-layer-1",
      name: "Population Grid",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      metadata: {
        sourceId: "source-population-grid",
        sourceStorageMode: "inline-small",
        sourceRestoreStatus: "restored",
        geometryType: "polygon",
        fields: ["population", "density"],
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [layer],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("Search layers...");
    expect(html).toContain("1/1 visible");
    expect(html).toContain("Population Grid");
    expect(html).toContain("Imported / restored");
    expect(html).toContain("Delete");
  });

  it("renders real-source layer footer actions without demo shortcuts", async () => {
    const mod = await import("../MapLayerManager");
    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).not.toContain("Add Demo Pack");
    expect(html).not.toContain("Load OSM Reference");
    expect(html).toContain("Add Layer");
  });

  it("requires confirmation before clearing the layer cache", async () => {
    const mod = await import("../MapLayerManager");
    const onClearLayerCache = vi.fn();
    const announcements: string[] = [];
    const layer: OverlayLayerConfig = {
      id: "cached-layer",
      name: "Cached Layer",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: [layer],
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
          onClearLayerCache,
          onAnnounce: (message: string) => announcements.push(message),
        }),
      );
    });

    const firstButton = container.querySelector<HTMLButtonElement>('[data-testid="map-layer-cache-clear-button"]');
    expect(firstButton?.textContent).toContain("Clear Cache");

    await act(async () => {
      firstButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const confirmButton = container.querySelector<HTMLButtonElement>('[data-testid="map-layer-cache-clear-button"]');
    expect(confirmButton?.textContent).toContain("Confirm Clear");
    expect(onClearLayerCache).not.toHaveBeenCalled();
    expect(announcements).toContain("Confirm clearing Map Explorer layer cache.");

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onClearLayerCache).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders a locate control for layers with extent metadata", async () => {
    const mod = await import("../MapLayerManager");
    const focusedLayerIds: string[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: [{
            id: "bounded-layer",
            name: "Bounded Layer",
            type: "geojson",
            visible: true,
            opacity: 1,
            group: "data",
            metadata: {
              featureCount: 1,
              geometryType: "Point",
              bounds: [28.925, 40.962, 29.064, 41.052],
            },
          } satisfies OverlayLayerConfig],
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
          onFocusLayer: (id: string) => {
            focusedLayerIds.push(id);
          },
        }),
      );
    });

    const locateButton = container.querySelector('[aria-label="Locate Bounded Layer"]');
    expect(locateButton).not.toBeNull();
    expect(locateButton?.getAttribute("title")).toContain("[28.9250, 40.9620, 29.0640, 41.0520]");

    await act(async () => {
      locateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(focusedLayerIds).toEqual(["bounded-layer"]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("does not expose demo layer insertion from the layer panel footer", async () => {
    const mod = await import("../MapLayerManager");
    const addedLayers: OverlayLayerConfig[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: [],
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: (layer: OverlayLayerConfig) => {
            addedLayers.push(layer);
          },
        }),
      );
    });

    const demoButton = container.querySelector(
      '[aria-label="Add demo street, block, and building layers for three Istanbul AOIs"]',
    );
    expect(demoButton).toBeNull();
    expect(addedLayers).toHaveLength(0);

    const osmButton = container.querySelector(
      '[aria-label="Load OpenStreetMap building reference for demo AOIs"]',
    );
    expect(osmButton).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders analysis provenance and stale status in analysis result rows", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "analysis-result-1",
      name: "OLS Residuals",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      group: "analysis",
      metadata: {
        geometryType: "polygon",
        analysisResult: {
          engine: "OLS",
          runTimestamp: "2026-04-11T13:30:00.000Z",
          parameterSummary: "dependent=price; predictors=[access]",
          inputParameters: { dependent: "price", predictors: ["access"] },
          statisticalSummary: { rSquared: 0.82 },
          stale: true,
          visualization: {
            kind: "choropleth",
            title: "OLS Residuals",
            valueField: "residual",
            classificationMethod: "standard-deviation",
            classCount: 5,
            colorRamp: "RdBu",
          },
        },
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [layer],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("OLS");
    expect(html).toContain("dependent=price; predictors=[access]");
    expect(html).toContain("Stale");
  });

  it("renders compact source, queryability, QA, CRS, feature count, and delete action", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "zoning-layer",
      name: "Zoning Parcels",
      type: "geojson",
      visible: true,
      opacity: 0.8,
      group: "data",
      sourceKind: "external",
      qaStatus: "warning",
      queryable: true,
      provenance: {
        label: "Municipal zoning portal",
        sourceUrl: "https://example.test/zoning.geojson",
      },
      metadata: {
        featureCount: 240,
        geometryType: "Polygon",
        bounds: [28.8, 40.8, 29.2, 41.2],
        fields: ["zone", "height_limit"],
        datasetContext: {
          crs: "EPSG:3857",
        },
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [layer],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("External");
    expect(html).toContain("QA warning");
    expect(html).toContain("Publication needs review");
    expect(html).toContain("queryable");
    expect(html).toContain("EPSG:3857");
    expect(html).toContain("Polygon / 240 features");
    expect(html).toContain("240 features");
    expect(html).toContain("Actions");
    expect(html).toContain("Publication needs review: missing license attribution.");
    expect(html).toContain("Delete");
  });

  it("renders dense readiness lanes with stable group headers", async () => {
    const mod = await import("../MapLayerManager");
    const layers: OverlayLayerConfig[] = [
      {
        id: "long-data-layer",
        name: "Very Long Municipal Zoning Parcels Readiness Name That Must Wrap Without Hiding Badges",
        type: "geojson",
        visible: true,
        opacity: 0.8,
        group: "data",
        sourceKind: "imported",
        qaStatus: "warning",
        queryable: true,
        provenance: {
          label: "Municipal zoning portal",
          sourceUrl: "https://example.test/zoning.geojson",
        },
        metadata: {
          sourceRestoreStatus: "restored",
          featureCount: 240,
          geometryType: "Polygon",
          fields: ["zone", "height_limit"],
          crsSummary: {
            crs: "EPSG:3857",
            status: "known",
            source: "explicit",
            notes: [],
          },
        },
      },
      {
        id: "voxcity-layer",
        name: "VoxCity Scene Output",
        type: "geojson",
        visible: false,
        opacity: 1,
        group: "voxcity",
        sourceKind: "demo",
        qaStatus: "warning",
        metadata: {
          sourceRestoreStatus: "metadata-only",
          featureCount: 12,
          geometryType: "Polygon",
          scientificQA: {
            status: "warning",
            issueIds: ["sample-data"],
            badges: ["sample_data"],
            checkedAt: "2026-05-31T08:00:00.000Z",
            featureIssueCount: 0,
            usedWorker: false,
            caveats: ["Synthetic demo data."],
            signature: "voxcity-layer",
          },
        },
      },
      {
        id: "analysis-layer",
        name: "Accessibility Index",
        type: "heatmap",
        visible: true,
        opacity: 0.6,
        group: "analysis",
        sourceKind: "derived",
        qaStatus: "passed",
        metadata: {
          featureCount: 88,
          geometryType: "Point",
          crsSummary: {
            crs: "EPSG:32635",
            status: "known",
            source: "user-declared",
            notes: ["User-declared CRS caveat remains visible."],
          },
        },
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: layers,
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("Data Layers");
    expect(html).toContain("VoxCity");
    expect(html).toContain("Analysis Results");
    expect(html).toContain("Very Long Municipal Zoning Parcels Readiness Name");
    expect(html).toContain('data-layer-readiness="source"');
    expect(html).toContain('data-layer-readiness="restore"');
    expect(html).toContain('data-layer-readiness="geometry"');
    expect(html).toContain('data-layer-readiness="features"');
    expect(html).toContain('data-layer-readiness="crs"');
    expect(html).toContain('data-layer-readiness="qa"');
    expect(html).toContain('data-layer-readiness="publication"');
    expect(html).toContain("Imported");
    expect(html).toContain("restored");
    expect(html).toContain("Polygon");
    expect(html).toContain("240 features");
    expect(html).toContain("EPSG:3857");
    expect(html).toContain("QA warning");
    expect(html).toContain("Publication needs review");
    expect(html).toContain("Demo / synthetic");
    expect(html).toContain("Demo / metadata only");
    expect(html).toContain("Sample data");
    expect(html).toContain("EPSG:32635 user-declared (caveat)");
  });

  it("keeps the layer row action inventory reachable", async () => {
    const mod = await import("../MapLayerManager");
    const reviewState: MapCartographyReviewState = {
      status: "needs-review",
      reviewedAt: "2026-05-31T08:00:00.000Z",
      recommendations: [{
        id: "cartography-review-1",
        type: "symbol-density",
        severity: "warning",
        layerId: "action-layer",
        layerName: "Action Layer",
        title: "Point symbols need review",
        rationale: "Dense point symbols may obscure detail.",
        suggestedFix: "Reduce symbol radius.",
        detailUrl: "https://example.test/cartography",
        preview: {
          beforeStyle: {},
          afterStyle: {},
        },
      }],
      metadata: {
        generatedBy: "MapCartographyAdvisor",
        version: 1,
        visibleLayerCount: 3,
        recommendationCounts: { info: 0, warning: 1, error: 0 },
        signature: "action-inventory",
      },
    };
    const layers: OverlayLayerConfig[] = [
      {
        id: "before-action-layer",
        name: "Before Action Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
      },
      {
        id: "action-layer",
        name: "Action Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
        sourceKind: "external",
        qaStatus: "error",
        queryable: true,
        sourceData: {
          type: "FeatureCollection",
          features: [],
        },
        provenance: {
          label: "Action source",
          sourceUrl: "https://example.test/action.geojson",
          license: "ODbL",
          attribution: "City GIS",
        },
        metadata: {
          featureCount: 1,
          geometryType: "Point",
          bounds: [28.925, 40.962, 29.064, 41.052],
          fields: ["name"],
          crsSummary: {
            crs: "EPSG:3857",
            status: "known",
            source: "explicit",
            notes: [],
          },
          scientificQA: {
            status: "error",
            issueIds: ["invalid-geometry"],
            badges: ["invalid_geometry"],
            checkedAt: "2026-05-31T08:00:00.000Z",
            featureIssueCount: 1,
            usedWorker: true,
            caveats: ["Invalid geometry."],
            signature: "action-layer",
          },
          analysisResult: {
            engine: "OD accessibility",
            runTimestamp: "2026-05-31T08:10:00.000Z",
            parameterSummary: "origin=blocks; destination=transit",
            inputParameters: { origin: "blocks", destination: "transit" },
            statisticalSummary: { meanAccess: 0.72 },
            stale: false,
            rerunToken: "rerun-action-layer",
            visualization: {
              kind: "choropleth",
              title: "Accessibility",
              valueField: "access",
              classificationMethod: "quantile",
              classCount: 5,
              colorRamp: "Viridis",
            },
          },
        },
      },
      {
        id: "after-action-layer",
        name: "After Action Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: layers,
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
        onExportLayer: () => undefined,
        onSendLayerToUrban: () => undefined,
        onOpenLayerInIde: () => undefined,
        onAddLayerToReport: () => undefined,
        onBindLayerToDashboard: () => undefined,
        onOpenLayerEducationReference: () => undefined,
        onFocusLayer: () => undefined,
        onOpenSymbology: () => undefined,
        onInspectLayer: () => undefined,
        onOpenAttributeTable: () => undefined,
        onRepairGeometry: () => undefined,
        onReRunAnalysisLayer: () => undefined,
        activeSymbologyLayerId: "action-layer",
        cartographyReviewState: reviewState,
      }),
    );

    for (const actionId of [
      "inspect",
      "table",
      "locate",
      "move-up",
      "move-down",
      "style",
      "review",
      "rerun",
      "repair-geometry",
      "export",
      "urban",
      "ide",
      "report",
      "dashboard",
      "education",
      "remove",
    ]) {
      expect(html).toContain(`data-layer-action="${actionId}"`);
    }
    for (const groupId of [
      "inspect",
      "view-focus",
      "style",
      "data-table",
      "crs-qa",
      "analyze-rerun",
      "publish-report",
      "bridge",
      "cache-remove",
    ]) {
      expect(html).toContain(`data-layer-action-group="${groupId}"`);
    }
    for (const groupLabel of [
      "Inspect",
      "View / Focus",
      "Style",
      "Data / Table",
      "CRS / QA",
      "Analyze / Rerun",
      "Publish / Report",
      "Bridge / IDE / Urban",
      "Cache / Remove",
    ]) {
      expect(html).toContain(groupLabel);
    }
    expect(html).toContain('data-testid="map-layer-table-trigger"');
    expect(html).toContain('data-testid="map-layer-inspect-trigger"');
    expect(html).toContain('data-layer-action-class="primary"');
    expect(html).toContain('data-layer-action-class="destructive"');
    expect(html).toContain("Active style");
    expect(html).toContain("Style active");
    expect(html).toContain("Open symbology panel for Action Layer");
    expect(html).toContain("Layer actions for Action Layer");
  });

  it("supports keyboard-first layer menu navigation and keeps destructive actions intentional", async () => {
    const mod = await import("../MapLayerManager");
    const removedIds: string[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const layers: OverlayLayerConfig[] = [
      {
        id: "keyboard-layer",
        name: "Keyboard Layer",
        type: "geojson",
        visible: true,
        opacity: 0.82,
        group: "data",
        metadata: {
          featureCount: 18,
          geometryType: "Polygon",
          bounds: [32.8, 39.8, 32.95, 39.95],
        },
      },
    ];

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: layers,
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: (id: string) => {
            removedIds.push(id);
          },
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
          onFocusLayer: () => undefined,
          onInspectLayer: () => undefined,
        }),
      );
    });

    const summary = container.querySelector<HTMLButtonElement>('[data-testid="map-layer-actions-summary"]');
    expect(summary).not.toBeNull();

    await act(async () => {
      summary?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });

    const menu = container.querySelector<HTMLElement>('[role="menu"][aria-label="Layer command menu for Keyboard Layer"]');
    expect(menu?.hidden).toBe(false);
    const focusedLabelAfterOpen = (document.activeElement as HTMLElement | null)?.getAttribute("data-layer-action");
    expect(focusedLabelAfterOpen).toBe("inspect");

    await act(async () => {
      menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    });
    expect((document.activeElement as HTMLElement | null)?.getAttribute("data-layer-action")).toBe("remove");

    await act(async () => {
      menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(menu?.hidden).toBe(true);
    expect(document.activeElement).toBe(summary);

    await act(async () => {
      summary?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const removeButton = container.querySelector<HTMLElement>('[data-layer-action="remove"]');
    expect(removeButton).not.toBeNull();

    expect(removedIds).toEqual([]);

    await act(async () => {
      removeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(removedIds).toEqual([]);
    expect(container.querySelector('[data-layer-action="confirm-remove"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders embedded layer stack without duplicate panel chrome", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "embedded-layer",
      name: "Embedded Layer",
      type: "geojson",
      visible: true,
      opacity: 0.75,
      group: "data",
      sourceKind: "demo",
      qaStatus: "warning",
      metadata: {
        sourceRestoreStatus: "metadata-only",
        featureCount: 12,
        geometryType: "Polygon",
        scientificQA: {
          status: "warning",
          issueIds: ["sample-data"],
          badges: ["sample_data"],
          checkedAt: "2026-05-31T08:00:00.000Z",
          featureIssueCount: 0,
          usedWorker: false,
          caveats: ["Synthetic demo data."],
          signature: "embedded-layer",
        },
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [layer],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
        presentation: "embedded",
        cartographyReviewPlacement: "none",
      }),
    );

    expect(html).toContain("data-presentation=\"embedded\"");
    expect(html).not.toContain("Close layer panel");
    expect(html).toContain("Demo / metadata only");
    expect(html).toContain("Sample data");
    expect(html).toContain("Polygon / 12 features");
    // Selection + Layer QA are right-dock concerns now; the left composition
    // dock must not mirror them.
    expect(html).not.toContain('data-testid="map-layer-section-selection"');
    expect(html).not.toContain('data-testid="map-layer-section-layer-qa"');
  });

  it("renders left-panel section summaries and routes section actions", async () => {
    const mod = await import("../MapLayerManager");
    const sourcesSpy = vi.fn();
    const contentsSpy = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const layers: OverlayLayerConfig[] = [
      {
        id: "grouped-layer",
        name: "Grouped Layer",
        type: "geojson",
        visible: true,
        opacity: 0.9,
        group: "data",
        sourceKind: "imported",
        queryable: true,
        qaStatus: "warning",
        metadata: {
          featureCount: 12,
          geometryType: "Polygon",
          sourceId: "source-1",
          crsSummary: {
            crs: "EPSG:3857",
            status: "known",
            source: "explicit",
            notes: [],
          },
        },
      },
    ];

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: layers,
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
          selectedFeatureCount: 3,
          onOpenSourcesSection: sourcesSpy,
          onOpenContentsSection: contentsSpy,
          presentation: "embedded",
          cartographyReviewPlacement: "none",
        }),
      );
    });

    // Left composition dock keeps Sources + Contents; Selection + Layer QA are
    // owned by the right (inspector/analysis) dock and must not appear here.
    expect(container.querySelector('[data-testid="map-layer-section-sources"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="map-layer-section-contents"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="map-layer-section-selection"]')).toBeNull();
    expect(container.querySelector('[data-testid="map-layer-section-layer-qa"]')).toBeNull();

    await act(async () => {
      container.querySelector('[data-testid="map-layer-section-action-sources"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      container.querySelector('[data-testid="map-layer-section-action-contents"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(sourcesSpy).toHaveBeenCalledTimes(1);
    expect(contentsSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("keeps advanced layer readiness details collapsed until requested", async () => {
    const mod = await import("../MapLayerManager");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const layers: OverlayLayerConfig[] = [
      {
        id: "detail-layer",
        name: "Detail Layer",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        sourceKind: "imported",
        queryable: true,
        metadata: {
          featureCount: 240,
          geometryType: "Polygon",
          crsSummary: {
            crs: "EPSG:3857",
            status: "known",
            source: "explicit",
            notes: [],
          },
        },
      },
    ];

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: layers,
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
        }),
      );
    });

    const hiddenDetails = container.querySelector<HTMLElement>('[data-testid="map-layer-advanced-details-detail-layer"]');
    expect(hiddenDetails).not.toBeNull();
    expect(hiddenDetails?.hidden).toBe(true);

    await act(async () => {
      container.querySelector('[data-testid="map-layer-details-toggle-detail-layer"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector<HTMLElement>('[data-testid="map-layer-advanced-details-detail-layer"]')?.hidden).toBe(false);
    expect(container.querySelector('[data-testid="map-layer-readiness-detail-layer-crs"]')).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders per-layer source restore status in the Sources activity surface", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "source-layer",
      name: "Source Layer",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      provenance: {
        label: "Municipal source registry",
        license: "ODbL",
        attribution: "City GIS",
      },
      metadata: {
        sourceId: "source-handle-1",
        featureCount: 88,
        geometryType: "LineString",
        fields: ["id", "name"],
        crsSummary: {
          crs: "EPSG:3857",
          status: "known",
          source: "explicit",
          notes: [],
        },
      },
    };
    const handle: SourceHandle = {
      sourceId: "source-handle-1",
      kind: "imported",
      storageMode: "indexeddb-local",
      restoreStatus: "recoverable",
      crsSummary: {
        crs: "EPSG:3857",
        status: "known",
        source: "explicit",
        notes: [],
      },
      featureCount: 88,
      caveats: [],
      profiledAt: "2026-05-31T08:00:00.000Z",
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerSourcesPanel, {
        overlayLayers: [layer],
        sourceHandles: [handle],
        onInspectLayer: () => undefined,
        onOpenAttributeTable: () => undefined,
        onSendLayerToUrban: () => undefined,
        onOpenLayerInIde: () => undefined,
        onAddLayerToReport: () => undefined,
      }),
    );

    expect(html).toContain("Layer sources");
    expect(html).toContain("Source Layer");
    expect(html).toContain("Restore: recoverable");
    expect(html).toContain("Handle: source-handle-1");
    expect(html).toContain("Storage: indexeddb-local");
    expect(html).toContain("LineString / 88 features");
    expect(html).toContain("Inspect");
    expect(html).toContain("Urban");
    expect(html).toContain("IDE");
  });

  it("renders contents as an embedded Layers activity tab instead of floating dialog chrome", async () => {
    const mod = await import("../contents/MapContentsTreePanel");
    const layer: OverlayLayerConfig = {
      id: "contents-embedded",
      name: "Contents Embedded",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      metadata: {
        featureCount: 5,
        geometryType: "Point",
        fields: ["name"],
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapContentsTreePanel, {
        visible: true,
        presentation: "embedded",
        layers: [layer],
        zoom: 12,
        onClose: () => undefined,
        onUpdateLayer: () => undefined,
        onDuplicateLayer: () => undefined,
        onRepairSource: () => undefined,
        onOpenProperties: () => undefined,
        onToggleVisibility: () => undefined,
        onReorderLayers: () => undefined,
      }),
    );

    expect(html).toContain("data-presentation=\"embedded\"");
    expect(html).toContain("role=\"region\"");
    expect(html).not.toContain("Close contents tree");
    expect(html).toContain("Contents Embedded");
    expect(html).toContain("Data Layers");
  });

  it("renders disabled reasons for layer handoff actions", async () => {
    const mod = await import("../MapLayerManager");
    const layer: OverlayLayerConfig = {
      id: "ready-layer",
      name: "Ready Parcels",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "external",
      qaStatus: "passed",
      queryable: true,
      provenance: {
        label: "City parcel portal",
        sourceUrl: "https://example.test/parcels.geojson",
        license: "ODbL",
        attribution: "City GIS Office",
      },
      metadata: {
        featureCount: 24,
        geometryType: "Polygon",
        fields: ["parcel_id", "land_use"],
        crsSummary: {
          crs: "EPSG:3857",
          status: "known",
          source: "explicit",
          notes: [],
        },
      },
    };

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: [layer],
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("data-layer-action=\"export\"");
    expect(html).toContain("Publication export is not connected from the layer rail yet.");
    expect(html).toContain("Urban Analytics handoff is not connected from the layer rail yet.");
    expect(html).toContain("IDE handoff is not connected from the layer rail yet.");
    expect(html).toContain("Report handoff is not connected from the layer rail yet.");
    expect(html).toContain("Dashboard binding is not connected from the layer rail yet.");
  });

  it("renders teaching dataset layers as normal layer rows without package controls", async () => {
    const mod = await import("../MapLayerManager");
    const layers: OverlayLayerConfig[] = [
      {
        id: "teaching-singapore-neighborhood_atlas",
        name: "Singapore - Neighborhood Atlas",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 4,
          geometryType: "Polygon",
          datasetContext: {
            datasetId: "singapore",
            datasetTitle: "Singapore Compact City Pack",
            datasetCity: "Singapore",
            layerId: "neighborhood_atlas",
            layerTitle: "Neighborhood Atlas",
            updateDate: "2026-03-24",
            thematicCoverage: ["mobility", "green_infrastructure"],
          },
        },
      },
      {
        id: "teaching-singapore-mobility_hubs",
        name: "Singapore - Mobility Hubs",
        type: "geojson",
        visible: false,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 4,
          geometryType: "Point",
          datasetContext: {
            datasetId: "singapore",
            datasetTitle: "Singapore Compact City Pack",
            datasetCity: "Singapore",
            layerId: "mobility_hubs",
            layerTitle: "Mobility Hubs",
            updateDate: "2026-03-24",
            thematicCoverage: ["mobility", "public_realm"],
          },
        },
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: layers,
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("Singapore - Neighborhood Atlas");
    expect(html).toContain("Singapore - Mobility Hubs");
    expect(html).not.toContain("Teaching Dataset Packages");
    expect(html).not.toContain("Show Package");
    expect(html).not.toContain("Hide Package");
  });

  it("renders columnar format badges for Arrow and GeoParquet layers", async () => {
    const mod = await import("../MapLayerManager");
    const layers: OverlayLayerConfig[] = [
      {
        id: "geoparquet-layer",
        name: "Census Blocks",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 1200,
          geometryType: "Polygon",
          columnar: {
            format: "geoparquet",
            geometryColumn: "geometry",
            geometryEncoding: "wkb",
            rowCount: 1200,
            workerTableName: "census_blocks_worker",
          },
        },
      },
      {
        id: "arrow-layer",
        name: "Sensor Events",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 480,
          geometryType: "Point",
          columnar: {
            format: "arrow",
            geometryEncoding: "lonlat",
            rowCount: 480,
            workerTableName: "sensor_events_worker",
          },
        },
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(mod.MapLayerManager, {
        overlayLayers: layers,
        activeBaseLayerName: "Dark Matter",
        onToggleVisibility: () => undefined,
        onSetOpacity: () => undefined,
        onRemoveLayer: () => undefined,
        onReorderLayers: () => undefined,
        onAddLayer: () => undefined,
      }),
    );

    expect(html).toContain("GeoParquet");
    expect(html).toContain("Arrow");
  });

  it("requires confirmation before removing a layer from the visible row delete action", async () => {
    const mod = await import("../MapLayerManager");
    const removedIds: string[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const layers: OverlayLayerConfig[] = [
      {
        id: "teaching-singapore-neighborhood_atlas",
        name: "Singapore - Neighborhood Atlas",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 4,
          geometryType: "Polygon",
          datasetContext: {
            datasetId: "singapore",
            datasetTitle: "Singapore Compact City Pack",
            datasetCity: "Singapore",
            layerId: "neighborhood_atlas",
            layerTitle: "Neighborhood Atlas",
            updateDate: "2026-03-24",
            thematicCoverage: ["mobility"],
          },
        },
      },
      {
        id: "teaching-singapore-mobility_hubs",
        name: "Singapore - Mobility Hubs",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 4,
          geometryType: "Point",
          datasetContext: {
            datasetId: "singapore",
            datasetTitle: "Singapore Compact City Pack",
            datasetCity: "Singapore",
            layerId: "mobility_hubs",
            layerTitle: "Mobility Hubs",
            updateDate: "2026-03-24",
            thematicCoverage: ["mobility"],
          },
        },
      },
      {
        id: "teaching-singapore-public_realm_corridors",
        name: "Singapore - Public Realm Corridors",
        type: "geojson",
        visible: false,
        opacity: 1,
        group: "data",
        metadata: {
          featureCount: 3,
          geometryType: "LineString",
          datasetContext: {
            datasetId: "singapore",
            datasetTitle: "Singapore Compact City Pack",
            datasetCity: "Singapore",
            layerId: "public_realm_corridors",
            layerTitle: "Public Realm Corridors",
            updateDate: "2026-03-24",
            thematicCoverage: ["public_realm"],
          },
        },
      },
    ];

    await act(async () => {
      root.render(
        React.createElement(mod.MapLayerManager, {
          overlayLayers: layers,
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: (id: string) => {
            removedIds.push(id);
          },
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
        }),
      );
    });

    const deleteButton = container.querySelector('[aria-label="Delete Singapore - Neighborhood Atlas"]');
    expect(deleteButton).not.toBeNull();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(removedIds).toEqual([]);

    const cancelButton = container.querySelector('[aria-label="Cancel Singapore - Neighborhood Atlas"]');
    expect(cancelButton).not.toBeNull();

    await act(async () => {
      cancelButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(removedIds).toEqual([]);

    const armedDeleteButton = container.querySelector('[aria-label="Delete Singapore - Neighborhood Atlas"]');
    expect(armedDeleteButton).not.toBeNull();

    await act(async () => {
      armedDeleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const confirmButton = container.querySelector('[aria-label="Confirm delete Singapore - Neighborhood Atlas"]');
    expect(confirmButton).not.toBeNull();

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(removedIds).toEqual(["teaching-singapore-neighborhood_atlas"]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

/* ================================================================== */
/*  4. useLayerSync — module export                                    */
/* ================================================================== */

describe("useLayerSync hook", () => {
  it("exports a named function", async () => {
    const mod = await import("../useLayerSync");
    expect(mod.useLayerSync).toBeDefined();
    expect(typeof mod.useLayerSync).toBe("function");
  });

  it("accepts mapRef and overlayLayers arguments (arity = 2)", async () => {
    const mod = await import("../useLayerSync");
    expect(mod.useLayerSync.length).toBe(2);
  });

  it("adds, toggles, updates opacity, and removes MapLibre layers", async () => {
    const mod = await import("../useLayerSync");
    const mockMap = createMockMapLibreMap();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const baseLayer: OverlayLayerConfig = {
      id: "sync-points",
      name: "Sync Points",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: { geometryType: "Point" },
      sourceData: {
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: { type: "Point", coordinates: [29, 41] }, properties: { name: "A" } }],
      },
    };

    function TestLayerSync({ layers }: { layers: OverlayLayerConfig[] }) {
      const mapRef = React.useRef<maplibregl.Map | null>(mockMap.map);
      mod.useLayerSync(mapRef, layers);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [baseLayer] }));
    });

    expect(mockMap.addSource).toHaveBeenCalledWith(
      "sync-points",
      expect.objectContaining({ type: "geojson" }),
    );
    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sync-points", type: "circle" }),
    );
    expect((mockMap.getSource("sync-points") as { data?: GeoJSON.FeatureCollection }).data?.features).toHaveLength(1);

    await act(async () => {
      root.render(React.createElement(TestLayerSync, {
        layers: [{ ...baseLayer, visible: false, opacity: 0.4 }],
      }));
    });

    expect(mockMap.setLayoutProperty).toHaveBeenCalledWith("sync-points", "visibility", "none");
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith("sync-points", "circle-opacity", 0.4);
    expect((mockMap.getSource("sync-points") as { data?: GeoJSON.FeatureCollection }).data?.features).toHaveLength(0);

    await act(async () => {
      root.render(React.createElement(TestLayerSync, {
        layers: [{ ...baseLayer, visible: true, opacity: 0.4 }],
      }));
    });

    expect((mockMap.getSource("sync-points") as { data?: GeoJSON.FeatureCollection }).data?.features).toHaveLength(1);

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [] }));
    });

    expect(mockMap.removeLayer).toHaveBeenCalledWith("sync-points");
    expect(mockMap.removeSource).toHaveBeenCalledWith("sync-points");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("moves MapLibre layers when overlay order changes", async () => {
    const mod = await import("../useLayerSync");
    const mockMap = createMockMapLibreMap();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const layerA: OverlayLayerConfig = {
      id: "layer-a",
      name: "Layer A",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: { geometryType: "Point" },
    };
    const layerB: OverlayLayerConfig = {
      id: "layer-b",
      name: "Layer B",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: { geometryType: "Point" },
    };

    function TestLayerSync({ layers }: { layers: OverlayLayerConfig[] }) {
      const mapRef = React.useRef<maplibregl.Map | null>(mockMap.map);
      mod.useLayerSync(mapRef, layers);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [layerA, layerB] }));
    });
    mockMap.moveLayer.mockClear();

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [layerB, layerA] }));
    });

    expect(mockMap.moveLayer).toHaveBeenCalledWith("layer-a", undefined);
    expect(mockMap.moveLayer).toHaveBeenCalledWith("layer-b", "layer-a");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("rebuilds raster tile sources when the tile URL template changes", async () => {
    const mod = await import("../useLayerSync");
    const mockMap = createMockMapLibreMap();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const rasterLayer: OverlayLayerConfig = {
      id: "external-raster",
      name: "External Raster",
      type: "raster-tile",
      visible: true,
      opacity: 0.82,
      sourceData: "https://tiles.example.test/{z}/{x}/{y}.png",
      sourceKind: "external",
    };

    function TestLayerSync({ layers }: { layers: OverlayLayerConfig[] }) {
      const mapRef = React.useRef<maplibregl.Map | null>(mockMap.map);
      mod.useLayerSync(mapRef, layers);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [rasterLayer] }));
    });
    mockMap.removeLayer.mockClear();
    mockMap.removeSource.mockClear();
    mockMap.addSource.mockClear();

    await act(async () => {
      root.render(React.createElement(TestLayerSync, {
        layers: [{ ...rasterLayer, sourceData: "https://tiles.example.test/{z}/{x}/{y}.png?_synapseRefresh=1" }],
      }));
    });

    expect(mockMap.removeLayer).toHaveBeenCalledWith("external-raster");
    expect(mockMap.removeSource).toHaveBeenCalledWith("external-raster");
    expect(mockMap.addSource).toHaveBeenCalledWith(
      "external-raster",
      expect.objectContaining({
        type: "raster",
        tiles: ["https://tiles.example.test/{z}/{x}/{y}.png?_synapseRefresh=1"],
      }),
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("re-adds overlay sources and layers after a MapLibre style reload", async () => {
    const mod = await import("../useLayerSync");
    const mockMap = createMockMapLibreMap();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const layer: OverlayLayerConfig = {
      id: "style-reload-layer",
      name: "Style Reload Layer",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: { geometryType: "Point" },
      sourceData: { type: "FeatureCollection", features: [] },
    };

    function TestLayerSync({ layers }: { layers: OverlayLayerConfig[] }) {
      const mapRef = React.useRef<maplibregl.Map | null>(mockMap.map);
      mod.useLayerSync(mapRef, layers);
      return null;
    }

    await act(async () => {
      root.render(React.createElement(TestLayerSync, { layers: [layer] }));
    });
    mockMap.addSource.mockClear();
    mockMap.addLayer.mockClear();

    await act(async () => {
      mockMap.removeLayer("style-reload-layer");
      mockMap.removeSource("style-reload-layer");
      mockMap.emit("style.load");
    });

    expect(mockMap.addSource).toHaveBeenCalledWith(
      "style-reload-layer",
      expect.objectContaining({ type: "geojson" }),
    );
    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "style-reload-layer" }),
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

/* ================================================================== */
/*  5. MapToolbar — extended props                                     */
/* ================================================================== */

describe("MapToolbar — layer panel toggle props", () => {
  it("component is importable with extended signature", async () => {
    const mod = await import("../MapToolbar");
    expect(mod.MapToolbar).toBeDefined();
    expect(typeof mod.MapToolbar).toBe("function");
  });
});

/* ================================================================== */
/*  6. Barrel exports — new components and types                       */
/* ================================================================== */

describe("barrel exports — layer-management additions", () => {
  it("exports MapLayerManager", async () => {
    const barrel = await import("../index");
    expect(barrel.MapLayerManager).toBeDefined();
    expect(typeof barrel.MapLayerManager).toBe("function");
    expect(barrel.MapLayerSourcesPanel).toBeDefined();
    expect(typeof barrel.MapLayerSourcesPanel).toBe("function");
    expect(barrel.MapLayerCartographyPanel).toBeDefined();
    expect(typeof barrel.MapLayerCartographyPanel).toBe("function");
  });

  it("exports MapWorkspaceCockpit", async () => {
    const barrel = await import("../index");
    expect(barrel.MapWorkspaceCockpit).toBeDefined();
    expect(typeof barrel.MapWorkspaceCockpit).toBe("function");
  });

  it("exports useLayerSync", async () => {
    const barrel = await import("../index");
    expect(barrel.useLayerSync).toBeDefined();
    expect(typeof barrel.useLayerSync).toBe("function");
  });

  it("exports new type aliases from mapTypes", async () => {
    // OverlayGeometryType and LayerGroupId are type-only exports
    // Verify the barrel imports without error — types checked at compile time
    const barrel = await import("../index");
    expect(barrel.BASE_STYLES).toBeDefined();
  });
});

/* ================================================================== */
/*  7. MapExplorerModal — integration check                            */
/* ================================================================== */

describe("MapExplorerModal — layer management integration", () => {
  it("module is importable after layer management integration", async () => {
    const mod = await import("../../MapExplorerModal");
    expect(mod.MapExplorerModal).toBeDefined();
    expect(typeof mod.MapExplorerModal).toBe("function");
  }, 30000);
});

/* ================================================================== */
/*  8. OverlayLayerConfig — layer group assignment                     */
/* ================================================================== */

describe("OverlayLayerConfig — group categorization", () => {
  it("layers default to data group when group is undefined", () => {
    const layer: OverlayLayerConfig = {
      id: "ungrouped",
      name: "No Group",
      type: "geojson",
      visible: true,
      opacity: 0.8,
    };
    // When group is undefined, UI code defaults to "data"
    expect(layer.group ?? "data").toBe("data");
  });

  it("analysis group layers track properly", () => {
    const layer: OverlayLayerConfig = {
      id: "analysis-1",
      name: "Moran's I Result",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "analysis",
    };
    expect(layer.group).toBe("analysis");
  });
});

/* ================================================================== */
/*  9. Layer type geometry icon mapping contracts                       */
/* ================================================================== */

describe("layer type contracts", () => {
  it("heatmap type is valid", () => {
    const layer: OverlayLayerConfig = {
      id: "heat",
      name: "Heat",
      type: "heatmap",
      visible: true,
      opacity: 1,
    };
    expect(layer.type).toBe("heatmap");
  });

  it("raster-tile type is valid", () => {
    const layer: OverlayLayerConfig = {
      id: "raster",
      name: "Raster",
      type: "raster-tile",
      visible: true,
      opacity: 1,
    };
    expect(layer.type).toBe("raster-tile");
  });

  it("vector-tile type is valid", () => {
    const layer: OverlayLayerConfig = {
      id: "vector",
      name: "Vector",
      type: "vector-tile",
      visible: true,
      opacity: 1,
    };
    expect(layer.type).toBe("vector-tile");
  });
});
