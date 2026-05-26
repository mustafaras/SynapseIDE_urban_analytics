import { describe, it, expect } from "vitest";
import { runProcessingTool, previewProcessingTool } from "@/services/map/processing";
import type { MapActionEffects } from "@/services/map/actions/MapActionExecutor";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  fcPolygonsProjected,
  fcMissingCrs,
  FC_POLYGONS_PROJECTED_COUNT,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

function makeEffects(layers: OverlayLayerConfig[]): {
  effects: MapActionEffects;
  all: () => OverlayLayerConfig[];
} {
  const store = new Map(layers.map((layer) => [layer.id, layer]));
  let order = layers.map((layer) => layer.id);
  const effects: MapActionEffects = {
    getLayer: (id) => store.get(id) ?? null,
    getLayerOrder: () => [...order],
    addLayer: (layer) => {
      store.set(layer.id, layer);
      order.push(layer.id);
    },
    removeLayer: (id) => {
      store.delete(id);
      order = order.filter((entry) => entry !== id);
    },
    setLayerOrder: (ids) => {
      order = [...ids];
    },
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
  return { effects, all: () => [...store.values()] };
}

function projectedLayer(): OverlayLayerConfig {
  return {
    id: "layer-projected",
    name: "Projected polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      crsSummary: {
        crs: fcPolygonsProjected.declaredCrs,
        status: "known",
        source: "explicit",
        notes: [],
      },
    },
  };
}

function missingCrsLayer(): OverlayLayerConfig {
  return {
    id: "layer-missing-crs",
    name: "Polygons without CRS",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcMissingCrs.featureCollection,
    metadata: { featureCount: fcMissingCrs.featureCollection.features.length, geometryType: "Polygon" },
  };
}

const detIds = () => {
  let n = 0;
  return () => `t${(n += 1)}`;
};

describe("processing reference tools — command lifecycle + manifest", () => {
  it("each reference tool yields an applied MapCommandResult carrying a manifest", () => {
    const cases: Array<{ toolId: string; params: Record<string, unknown> }> = [
      { toolId: "buffer", params: { layer: "layer-projected", distanceMeters: 100 } },
      { toolId: "centroid", params: { layer: "layer-projected" } },
      { toolId: "attribute-filter", params: { layer: "layer-projected", field: "zone", operator: "=", value: "residential" } },
    ];

    for (const { toolId, params } of cases) {
      const { effects, all } = makeEffects([projectedLayer()]);
      const before = all().length;
      const result = runProcessingTool(toolId, params, effects, { now: () => "2026-05-26T00:00:00.000Z", idFactory: detIds() });

      expect(result, `${toolId} should resolve`).not.toBeNull();
      expect(result!.status, `${toolId} status`).toBe("applied");
      expect(result!.command.status).toBe("applied");
      expect(result!.command.kind).toBe("workflow.apply");
      expect(result!.command.manifest, `${toolId} manifest on command`).toBeDefined();
      expect(result!.manifest, `${toolId} manifest on result`).not.toBeNull();
      expect(result!.manifest!.workflowKind).toBe(`processing.${toolId}`);
      expect(all().length, `${toolId} added one output layer`).toBe(before + 1);
      expect(result!.outputLayer?.metadata?.reproducibilityManifest).toBeDefined();
      expect(result!.logs.length).toBeGreaterThan(0);
    }
  });

  it("buffer turns 10 projected polygons into 10 buffer polygons", () => {
    const { effects } = makeEffects([projectedLayer()]);
    const result = runProcessingTool("buffer", { layer: "layer-projected", distanceMeters: 250 }, effects);
    expect(result!.status).toBe("applied");
    expect(result!.manifest!.expectedOutput.geometryClass).toBe("Polygon");
    expect(result!.manifest!.expectedOutput.featureCount).toBe(FC_POLYGONS_PROJECTED_COUNT);
    expect(result!.manifest!.crsSummary.sourceCrs).toBe("EPSG:32635");
  });

  it("centroid produces one point per input feature", () => {
    const { effects } = makeEffects([projectedLayer()]);
    const result = runProcessingTool("centroid", { layer: "layer-projected" }, effects);
    expect(result!.manifest!.expectedOutput.geometryClass).toBe("Point");
    expect(result!.manifest!.expectedOutput.featureCount).toBe(FC_POLYGONS_PROJECTED_COUNT);
  });

  it("attribute-filter keeps only matching features", () => {
    const { effects } = makeEffects([projectedLayer()]);
    const result = runProcessingTool(
      "attribute-filter",
      { layer: "layer-projected", field: "zone", operator: "=", value: "residential" },
      effects,
    );
    // residential zones are the even indices (0,2,4,6,8) → 5 features
    expect(result!.manifest!.expectedOutput.featureCount).toBe(5);
  });

  it("attribute-filter supports numeric comparisons", () => {
    const { effects } = makeEffects([projectedLayer()]);
    const result = runProcessingTool(
      "attribute-filter",
      { layer: "layer-projected", field: "area_m2", operator: ">", value: "2000" },
      effects,
    );
    // area_m2 = 1500 + index*250 → index 2 == 2000 (not >), so > 2000 for index 3..9 → 7 features
    expect(result!.manifest!.expectedOutput.featureCount).toBe(7);
  });

  it("blocks buffer on a layer with no CRS and does not add a layer", () => {
    const { effects, all } = makeEffects([missingCrsLayer()]);
    const before = all().length;
    const result = runProcessingTool("buffer", { layer: "layer-missing-crs", distanceMeters: 100 }, effects);

    expect(result!.status).toBe("blocked");
    expect(result!.command.status).toBe("blocked");
    expect(result!.command.manifest).toBeUndefined();
    expect(result!.outputLayer).toBeNull();
    expect(result!.preview.blockers.join(" ")).toMatch(/CRS/i);
    expect(all().length).toBe(before);
  });

  it("blocks when the input layer is missing", () => {
    const { effects } = makeEffects([]);
    const outcome = previewProcessingTool("buffer", { layer: "nope" }, effects.getLayer);
    expect(outcome).not.toBeNull();
    expect(outcome!.preview.ok).toBe(false);
    expect(outcome!.inputLayer).toBeNull();
  });

  it("returns null for an unknown tool id", () => {
    const { effects } = makeEffects([projectedLayer()]);
    expect(runProcessingTool("does-not-exist", {}, effects)).toBeNull();
  });
});
