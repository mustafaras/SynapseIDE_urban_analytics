import { describe, expect, it, beforeEach } from "vitest";
import {
  buildMapExplorerContextSummary,
  resolveOverlayLayerCrs,
  resolveOverlayLayerQueryable,
  selectMapExplorerContextSummary,
  selectMapExplorerLayerSummaries,
  selectMapExplorerVisibleLayerSummaries,
  summarizeOverlayLayer,
  _resetMapContextSummaryCacheForTests,
  type MapExplorerContextSummaryInput,
} from "../mapContextSummary";
import type { DrawnFeature, OverlayLayerConfig } from "../mapTypes";
import type { MapScientificQAState } from "../../../../services/map/MapScientificQA";
import type { MapExplorerState } from "../../../../stores/useMapExplorerStore";

const baseInput = (): MapExplorerContextSummaryInput => ({
  center: [29.0, 41.0],
  zoom: 10,
  bearing: 0,
  pitch: 0,
  activeBaseLayer: "streets",
  overlayLayers: [],
  drawnFeatures: [],
  activeAoiId: undefined,
  selectedFeatureIds: {},
  activeAnalysisResultLayerIds: [],
  scientificQA: null,
  currentMapBounds: null,
  currentMapBoundsUpdatedAt: null,
});

const layer = (overrides: Partial<OverlayLayerConfig> & { id: string }): OverlayLayerConfig => ({
  name: overrides.name ?? overrides.id,
  type: "geojson",
  visible: true,
  opacity: 1,
  ...overrides,
});

const drawn = (id: string, geometry: GeoJSON.Geometry): DrawnFeature => ({
  id,
  geometry,
  properties: { label: id, createdAt: "2026-05-10T00:00:00.000Z" },
});

describe("buildMapExplorerContextSummary", () => {
  it("produces a stable summary for an empty map state", () => {
    const summary = buildMapExplorerContextSummary(baseInput());
    expect(summary.viewport).toEqual({
      center: [29.0, 41.0],
      zoom: 10,
      bearing: 0,
      pitch: 0,
      baseLayerId: "streets",
    });
    expect(summary.activeAoi).toBeNull();
    expect(summary.visibleLayerIds).toEqual([]);
    expect(summary.selectedLayerIds).toEqual([]);
    expect(summary.activeAnalysisResultLayerIds).toEqual([]);
    expect(summary.selection).toEqual({ totalSelectedFeatures: 0, layerCounts: [] });
    expect(summary.qa).toEqual({
      status: "unchecked",
      checkedAt: null,
      layerCount: 0,
      blockedLayerCount: 0,
      issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
    });
    expect(summary.contextId).toMatch(/^[0-9a-f]{8}$/);
    expect(summary.updatedAt).toBe("1970-01-01T00:00:00.000Z");
  });

  it("includes IDs only — never raw GeoJSON or feature payloads", () => {
    const polygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[
        [29.0, 41.0], [29.1, 41.0], [29.1, 41.1], [29.0, 41.1], [29.0, 41.0],
      ]],
    };
    const summary = buildMapExplorerContextSummary({
      ...baseInput(),
      drawnFeatures: [drawn("aoi-1", polygon)],
      activeAoiId: "aoi-1",
      overlayLayers: [
        layer({ id: "lyr-a", visible: true }),
        layer({ id: "lyr-b", visible: false }),
      ],
      selectedFeatureIds: { "lyr-a": ["f1", "f2", "f3"] },
    });

    expect(summary.activeAoi).toEqual({
      aoiId: "aoi-1",
      geometryFamily: "polygon",
      bbox: [29.0, 41.0, 29.1, 41.1],
    });
    expect(summary.visibleLayerIds).toEqual(["lyr-a"]);
    expect(summary.selectedLayerIds).toEqual(["lyr-a", "lyr-b"]);
    expect(summary.selection.totalSelectedFeatures).toBe(3);
    expect(summary.selection.layerCounts).toEqual([{ layerId: "lyr-a", count: 3 }]);

    // No serialised GeoJSON anywhere in the summary.
    const serialised = JSON.stringify(summary);
    expect(serialised).not.toContain("Polygon");
    expect(serialised).not.toContain("coordinates");
  });

  it("falls back to first eligible polygon when activeAoiId references a non-AOI feature", () => {
    const point: GeoJSON.Point = { type: "Point", coordinates: [29.0, 41.0] };
    const polygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    };
    const summary = buildMapExplorerContextSummary({
      ...baseInput(),
      drawnFeatures: [drawn("pt", point), drawn("poly", polygon)],
      activeAoiId: "pt",
    });
    expect(summary.activeAoi?.aoiId).toBe("poly");
    expect(summary.activeAoi?.geometryFamily).toBe("polygon");
  });

  it("summarises QA state including blocked layer count and severity buckets", () => {
    const qa: MapScientificQAState = {
      status: "warning",
      checkedAt: "2026-05-10T12:00:00.000Z",
      issues: [],
      layerSummaries: [
        {
          layerId: "ok",
          layerName: "OK",
          status: "passed",
          issueIds: [],
          badges: [],
          caveats: [],
          featureIssueCount: 0,
          usedWorker: false,
          checkedAt: "2026-05-10T12:00:00.000Z",
          signature: "sig-ok",
          geometryFamilies: ["polygon"],
          vertexCount: 5,
          featureCount: 1,
          metadata: {
            status: "passed",
            issueIds: [],
            badges: [],
            checkedAt: "2026-05-10T12:00:00.000Z",
            featureIssueCount: 0,
            usedWorker: false,
            caveats: [],
            signature: "sig-ok",
          },
        },
        {
          layerId: "bad",
          layerName: "Bad",
          status: "error",
          issueIds: ["i1"],
          badges: ["invalid_geometry"],
          caveats: [],
          featureIssueCount: 3,
          usedWorker: true,
          checkedAt: "2026-05-10T12:00:00.000Z",
          signature: "sig-bad",
          geometryFamilies: ["polygon"],
          vertexCount: 12,
          featureCount: 4,
          metadata: {
            status: "error",
            issueIds: ["i1"],
            badges: ["invalid_geometry"],
            checkedAt: "2026-05-10T12:00:00.000Z",
            featureIssueCount: 3,
            usedWorker: true,
            caveats: [],
            signature: "sig-bad",
          },
        },
      ],
      metadata: {
        generatedBy: "MapScientificQA",
        version: 1,
        signature: "agg-sig",
        visibleLayerCount: 2,
        workerLayerCount: 1,
        issueCounts: { info: 0, warning: 1, error: 2, blocker: 0 },
      },
    };
    const summary = buildMapExplorerContextSummary({
      ...baseInput(),
      scientificQA: qa,
      currentMapBoundsUpdatedAt: "2026-05-10T11:00:00.000Z",
    });
    expect(summary.qa.status).toBe("warning");
    expect(summary.qa.layerCount).toBe(2);
    expect(summary.qa.blockedLayerCount).toBe(1);
    expect(summary.qa.issueCounts).toEqual({ info: 0, warning: 1, error: 2, blocker: 0 });
    // updatedAt picks the latest available timestamp.
    expect(summary.updatedAt).toBe("2026-05-10T12:00:00.000Z");
  });

  it("contextId is deterministic for the same input and changes when content changes", () => {
    const a = buildMapExplorerContextSummary(baseInput());
    const b = buildMapExplorerContextSummary(baseInput());
    expect(a.contextId).toBe(b.contextId);

    const c = buildMapExplorerContextSummary({
      ...baseInput(),
      overlayLayers: [layer({ id: "lyr-a" })],
    });
    expect(c.contextId).not.toBe(a.contextId);

    const d = buildMapExplorerContextSummary({
      ...baseInput(),
      zoom: 11,
    });
    expect(d.contextId).not.toBe(a.contextId);
  });

  it("contextId is insensitive to selectedFeatureIds key insertion order", () => {
    const a = buildMapExplorerContextSummary({
      ...baseInput(),
      selectedFeatureIds: { layerA: ["1"], layerB: ["2", "3"] },
    });
    const b = buildMapExplorerContextSummary({
      ...baseInput(),
      selectedFeatureIds: { layerB: ["2", "3"], layerA: ["1"] },
    });
    expect(a.contextId).toBe(b.contextId);
  });
});

describe("selectMapExplorerContextSummary", () => {
  beforeEach(() => {
    _resetMapContextSummaryCacheForTests();
  });

  it("memoises by contextId so unchanged content returns the same instance", () => {
    const baseState = {
      center: [29.0, 41.0] as [number, number],
      zoom: 10,
      bearing: 0,
      pitch: 0,
      activeBaseLayer: "streets" as const,
      overlayLayers: [],
      drawnFeatures: [],
      activeAoiId: undefined,
      selectedFeatureIds: {},
      activeAnalysisResultLayerIds: [],
      scientificQA: null,
      currentMapBounds: null,
      currentMapBoundsUpdatedAt: null,
    } as unknown as MapExplorerState;

    const first = selectMapExplorerContextSummary(baseState);
    const second = selectMapExplorerContextSummary(baseState);
    expect(second).toBe(first);
  });

  it("returns a new instance when state content changes", () => {
    const stateA = {
      center: [29.0, 41.0] as [number, number],
      zoom: 10, bearing: 0, pitch: 0,
      activeBaseLayer: "streets" as const,
      overlayLayers: [],
      drawnFeatures: [],
      activeAoiId: undefined,
      selectedFeatureIds: {},
      activeAnalysisResultLayerIds: [],
      scientificQA: null,
      currentMapBounds: null,
      currentMapBoundsUpdatedAt: null,
    } as unknown as MapExplorerState;
    const stateB = { ...stateA, zoom: 12 };
    const first = selectMapExplorerContextSummary(stateA);
    const second = selectMapExplorerContextSummary(stateB);
    expect(second).not.toBe(first);
    expect(second.contextId).not.toBe(first.contextId);
  });
});

describe("layer summary helpers", () => {
  it("summarizeOverlayLayer projects to the registry summary shape (no geometry)", () => {
    const cfg: OverlayLayerConfig = {
      id: "lyr-x",
      name: "Layer X",
      type: "geojson",
      visible: true,
      opacity: 0.7,
      sourceKind: "imported",
      qaStatus: "passed",
      group: "data",
      metadata: {
        featureCount: 42,
        datasetContext: { crs: "EPSG:4326" },
      },
      provenance: { label: "imported layer" },
    };
    const summary = summarizeOverlayLayer(cfg);
    expect(summary).toEqual({
      layerId: "lyr-x",
      name: "Layer X",
      layerType: "geojson",
      group: "data",
      visible: true,
      opacity: 0.7,
      queryable: true,
      sourceKind: "imported",
      qaStatus: "passed",
      crs: "EPSG:4326",
      featureCount: 42,
      provenanceLabel: "imported layer",
    });
  });

  it("resolveOverlayLayerQueryable honours explicit false and defaults by type", () => {
    expect(resolveOverlayLayerQueryable({ id: "a", name: "a", type: "geojson", visible: true, opacity: 1 })).toBe(true);
    expect(resolveOverlayLayerQueryable({ id: "b", name: "b", type: "heatmap", visible: true, opacity: 1 })).toBe(true);
    expect(resolveOverlayLayerQueryable({ id: "c", name: "c", type: "raster-tile", visible: true, opacity: 1 })).toBe(false);
    expect(resolveOverlayLayerQueryable({ id: "d", name: "d", type: "geojson", visible: true, opacity: 1, queryable: false })).toBe(false);
  });

  it("resolveOverlayLayerCrs prefers datasetContext.crs over columnar/eo sources", () => {
    expect(resolveOverlayLayerCrs({
      id: "x", name: "x", type: "geojson", visible: true, opacity: 1,
      metadata: {
        datasetContext: { crs: "EPSG:4326" },
        columnar: { format: "geoparquet", crs: "EPSG:3857" },
      },
    })).toBe("EPSG:4326");
    expect(resolveOverlayLayerCrs({
      id: "y", name: "y", type: "geojson", visible: true, opacity: 1,
      metadata: { columnar: { format: "arrow", crs: "EPSG:3857" } },
    })).toBe("EPSG:3857");
    expect(resolveOverlayLayerCrs({
      id: "z", name: "z", type: "geojson", visible: true, opacity: 1,
    })).toBeUndefined();
  });

  it("selectMapExplorerVisibleLayerSummaries filters to visible layers", () => {
    const state = {
      overlayLayers: [
        layer({ id: "a", visible: true }),
        layer({ id: "b", visible: false }),
        layer({ id: "c", visible: true }),
      ],
    } as unknown as MapExplorerState;
    expect(selectMapExplorerVisibleLayerSummaries(state).map((s) => s.layerId)).toEqual(["a", "c"]);
    expect(selectMapExplorerLayerSummaries(state).map((s) => s.layerId)).toEqual(["a", "b", "c"]);
  });
});
