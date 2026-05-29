import { describe, it, expect } from "vitest";
import {
  runProcessingTool,
  previewProcessingTool,
  createMapProcessingRegistry,
  listProcessingToolDescriptors,
} from "@/services/map/processing";
import type { MapActionEffects } from "@/services/map/actions/MapActionExecutor";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  fcPointsWGS84,
  fcPolygonsProjected,
  FC_POINTS_WGS84_COUNT,
  FC_POLYGONS_PROJECTED_COUNT,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

function makeEffects(layers: OverlayLayerConfig[]): { effects: MapActionEffects; all: () => OverlayLayerConfig[] } {
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

function projectedPolygons(id = "polys"): OverlayLayerConfig {
  return {
    id,
    name: "Projected polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      fields: ["zone", "area_m2"],
      crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
    },
  };
}

function pointsWgs84(id = "points"): OverlayLayerConfig {
  return {
    id,
    name: "WGS84 points",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcPointsWGS84,
    metadata: {
      featureCount: FC_POINTS_WGS84_COUNT,
      geometryType: "Point",
      fields: ["id", "name", "value", "date"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
    },
  };
}

describe("processing catalogue — Prompt 24b", () => {
  it("publishes at least 12 implemented tools plus disabled stubs", () => {
    const registry = createMapProcessingRegistry();
    expect(registry.implementedCount()).toBeGreaterThanOrEqual(12);
    const stubs = listProcessingToolDescriptors().filter((tool) => !tool.implemented);
    expect(stubs.length).toBeGreaterThan(0);
    // every stub still carries a human reason in its summary
    for (const stub of stubs) expect(stub.summary.length).toBeGreaterThan(0);
  });

  it("spatial-join attaches polygon attributes to points with correct provenance", () => {
    const { effects } = makeEffects([pointsWgs84(), projectedPolygons()]);
    const result = runProcessingTool("spatial-join", { layer: "points", layerB: "polys" }, effects);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("applied");
    expect(result!.command.manifest).toBeDefined();
    // output is one point per input point
    expect(result!.manifest!.expectedOutput.geometryClass).toBe("Point");
    expect(result!.manifest!.expectedOutput.featureCount).toBe(FC_POINTS_WGS84_COUNT);
    expect(result!.preview.joinSummary).toMatchObject({
      mode: "spatial",
      predicate: "within",
      primaryFeatureCount: FC_POINTS_WGS84_COUNT,
    });
    expect(result!.preview.joinSummary!.matchedPrimaryCount).toBeGreaterThan(0);
    expect(result!.preview.joinSummary!.unmatchedPrimaryCount).toBeGreaterThan(0);
    // provenance records BOTH source layers
    expect(result!.manifest!.sourceLayerIds.sort()).toEqual(["points", "polys"]);
    expect(result!.manifest!.sourceLayers.map((layer) => layer.layerId).sort()).toEqual(["points", "polys"]);
    expect(result!.outputLayer?.provenance?.sourceLayerIds?.sort()).toEqual(["points", "polys"]);
    // joined attributes are present on output features
    const features = (result!.outputLayer?.sourceData as GeoJSON.FeatureCollection).features;
    expect(features.every((feature) => "__join_matched" in (feature.properties ?? {}))).toBe(true);
  });

  it("attribute-join previews cardinality and preserves unmatched rows", () => {
    const points = pointsWgs84();
    const lookup: OverlayLayerConfig = {
      id: "lookup",
      name: "Lookup table",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceData: {
        type: "FeatureCollection",
        features: [
          { type: "Feature", id: "a", geometry: null, properties: { id: 1, class: "inside" } } as GeoJSON.Feature,
          { type: "Feature", id: "b", geometry: null, properties: { id: 1, class: "duplicate" } } as GeoJSON.Feature,
          { type: "Feature", id: "c", geometry: null, properties: { id: 2, class: "single" } } as GeoJSON.Feature,
        ],
      },
      metadata: {
        featureCount: 3,
        geometryType: "Table",
        fields: ["id", "class"],
      },
    };
    const { effects } = makeEffects([points, lookup]);
    const result = runProcessingTool("attribute-join", { layer: "points", layerB: "lookup", field: "id", joinField: "id" }, effects);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("applied");
    expect(result!.preview.joinSummary!.cardinalityLabel).toBe("1:N");
    expect(result!.preview.joinSummary!.cardinalityWarning).toMatch(/duplicate primary features/i);
    expect(result!.preview.joinSummary!.unmatchedPrimaryCount).toBe(FC_POINTS_WGS84_COUNT - 2);
    const fc = result!.outputLayer?.sourceData as GeoJSON.FeatureCollection;
    expect(fc.features.some((feature) => feature.properties?.__join_matched === false)).toBe(true);
    expect(result!.manifest!.sourceLayerIds.sort()).toEqual(["lookup", "points"]);
  });

  it("each implemented service tool yields an applied MapCommandResult with a manifest", () => {
    const cases: Array<{ toolId: string; params: Record<string, unknown> }> = [
      { toolId: "intersect", params: { layer: "polys", layerB: "polys2" } },
      { toolId: "difference", params: { layer: "polys", layerB: "polys2" } },
      { toolId: "union", params: { layer: "polys", layerB: "polys2" } },
      { toolId: "clip", params: { layer: "polys", layerB: "polys2" } },
      { toolId: "dissolve", params: { layer: "polys" } },
      { toolId: "simplify", params: { layer: "polys", tolerance: 0.0005 } },
      { toolId: "reproject", params: { layer: "polys", targetCrs: "EPSG:3857" } },
      { toolId: "hotspot", params: { layer: "polys", valueField: "area_m2", weightsMethod: "queen" } },
    ];
    for (const { toolId, params } of cases) {
      const { effects } = makeEffects([projectedPolygons("polys"), projectedPolygons("polys2")]);
      const result = runProcessingTool(toolId, params, effects);
      expect(result, `${toolId} resolves`).not.toBeNull();
      expect(result!.status, `${toolId} status`).toBe("applied");
      expect(result!.command.manifest, `${toolId} manifest`).toBeDefined();
      expect(result!.manifest!.workflowKind).toBe(`processing.${toolId}`);
    }
  });

  it("blocks overlay tools when a source layer has no CRS", () => {
    const noCrs: OverlayLayerConfig = {
      ...projectedPolygons("polys"),
      metadata: { featureCount: FC_POLYGONS_PROJECTED_COUNT, geometryType: "Polygon", fields: ["zone"] },
    };
    const { effects, all } = makeEffects([noCrs, projectedPolygons("polys2")]);
    const before = all().length;
    const result = runProcessingTool("intersect", { layer: "polys", layerB: "polys2" }, effects);
    expect(result!.status).toBe("blocked");
    expect(result!.command.manifest).toBeUndefined();
    expect(result!.preview.blockers.join(" ")).toMatch(/CRS/i);
    expect(all().length).toBe(before);
  });

  it("reproject moves coordinates out of the WGS84 degree range", () => {
    const { effects } = makeEffects([projectedPolygons("polys")]);
    const result = runProcessingTool("reproject", { layer: "polys", targetCrs: "EPSG:3857" }, effects);
    const fc = result!.outputLayer?.sourceData as GeoJSON.FeatureCollection;
    const [x] = (fc.features[0]!.geometry as GeoJSON.Polygon).coordinates[0]![0]!;
    // EPSG:3857 metres around Istanbul are ~3.2e6, far outside [-180,180]
    expect(Math.abs(x)).toBeGreaterThan(1000);
    expect(result!.manifest!.crsSummary.executionCrs).toBe("EPSG:3857");
  });

  it("surfaces not-yet-wired tools as blocked with a reason and never applies", () => {
    const { effects, all } = makeEffects([projectedPolygons("polys")]);
    const outcome = previewProcessingTool("raster-zonal-stats", { layer: "polys" }, effects.getLayer);
    expect(outcome).not.toBeNull();
    expect(outcome!.preview.ok).toBe(false);
    expect(outcome!.preview.blockers.join(" ")).toMatch(/not yet wired/i);

    const before = all().length;
    const result = runProcessingTool("raster-zonal-stats", { layer: "polys" }, effects);
    expect(result!.status).toBe("blocked");
    expect(all().length).toBe(before);
  });
});
