import { describe, expect, it } from "vitest";
import type { Feature } from "geojson";
import {
  buildAttributeJoinPreview,
  buildSpatialJoinPreview,
  resolveJoinExecutionPlan,
  runMapJoinWorkerTask,
  type MapJoinLayerInput,
} from "@/services/map/join/MapJoinPreviewService";
import {
  fcPointsWGS84,
  fcPolygonsProjected,
  FC_POINTS_WGS84_COUNT,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

function feature(id: string | number, properties: Record<string, unknown>, geometry: GeoJSON.Geometry | null = null): Feature {
  return { type: "Feature", id, geometry, properties } as Feature;
}

function layer(input: Partial<MapJoinLayerInput> & { layerId: string; features: Feature[] }): MapJoinLayerInput {
  return {
    layerId: input.layerId,
    layerName: input.layerName ?? input.layerId,
    features: input.features,
    crs: input.crs ?? "EPSG:4326",
    geometryClass: input.geometryClass ?? "Point",
    fields: input.fields ?? ["id"],
  };
}

describe("MapJoinPreviewService — Prompt 50", () => {
  it("previews an attribute join with correct match and unmatched counts", () => {
    const result = buildAttributeJoinPreview({
      mode: "attribute",
      primary: layer({
        layerId: "primary",
        fields: ["id", "name"],
        features: [feature("p1", { id: "a", name: "Alpha" }), feature("p2", { id: "b", name: "Beta" }), feature("p3", { id: "x", name: "No match" })],
      }),
      join: layer({
        layerId: "lookup",
        fields: ["lookup_id", "score"],
        features: [feature("j1", { lookup_id: "a", score: 10 }), feature("j2", { lookup_id: "b", score: 20 })],
      }),
      primaryKey: "id",
      joinKey: "lookup_id",
    });

    expect(result.ok).toBe(true);
    expect(result.summary.matchedPrimaryCount).toBe(2);
    expect(result.summary.unmatchedPrimaryCount).toBe(1);
    expect(result.summary.outputFeatureCount).toBe(3);
    expect(result.summary.cardinalityLabel).toBe("1:1");
    expect(result.summary.unmatchedPrimaryIds).toEqual(["p3"]);
    expect(result.outputFeatures.features[0]!.properties).toMatchObject({ join_score: 10, __join_matched: true });
    expect(result.outputFeatures.features[2]!.properties).toMatchObject({ __join_matched: false });
  });

  it("flags 1:N attribute cardinality before apply", () => {
    const result = buildAttributeJoinPreview({
      mode: "attribute",
      primary: layer({ layerId: "primary", features: [feature("p1", { id: "a" })] }),
      join: layer({
        layerId: "lookup",
        features: [feature("j1", { id: "a", label: "first" }), feature("j2", { id: "a", label: "second" })],
      }),
      primaryKey: "id",
      joinKey: "id",
    });

    expect(result.summary.cardinalityLabel).toBe("1:N");
    expect(result.summary.cardinalityWarning).toMatch(/duplicate primary features/i);
    expect(result.summary.outputFeatureCount).toBe(2);
    expect(result.outputFeatures.features.every((output) => output.properties?.__join_match_count === 2)).toBe(true);
  });

  it("flags N:M attribute cardinality before apply", () => {
    const result = buildAttributeJoinPreview({
      mode: "attribute",
      primary: layer({
        layerId: "primary",
        features: [feature("p1", { id: "a" }), feature("p2", { id: "a" })],
      }),
      join: layer({
        layerId: "lookup",
        features: [feature("j1", { id: "a", label: "first" }), feature("j2", { id: "a", label: "second" })],
      }),
      primaryKey: "id",
      joinKey: "id",
    });

    expect(result.summary.cardinalityLabel).toBe("N:M");
    expect(result.summary.cardinalityWarning).toMatch(/review before applying/i);
    expect(result.summary.matchedPairCount).toBe(4);
    expect(result.summary.outputFeatureCount).toBe(4);
  });

  it("previews a within spatial join on the canonical fixtures with match and unmatched counts", () => {
    const result = buildSpatialJoinPreview({
      mode: "spatial",
      primary: layer({
        layerId: "fcPointsWGS84",
        layerName: "fcPointsWGS84",
        features: fcPointsWGS84.features as Feature[],
        crs: "EPSG:4326",
        geometryClass: "Point",
        fields: ["id", "name", "value", "date"],
      }),
      join: layer({
        layerId: "fcPolygonsProjected",
        layerName: "fcPolygonsProjected",
        features: fcPolygonsProjected.featureCollection.features as Feature[],
        crs: fcPolygonsProjected.declaredCrs,
        geometryClass: "Polygon",
        fields: ["id", "zone", "area_m2"],
      }),
      predicate: "within",
    });

    expect(result.ok).toBe(true);
    expect(result.summary.primaryFeatureCount).toBe(FC_POINTS_WGS84_COUNT);
    expect(result.summary.matchedPrimaryCount).toBeGreaterThan(0);
    expect(result.summary.unmatchedPrimaryCount).toBeGreaterThan(0);
    expect(result.summary.matchedPrimaryCount + result.summary.unmatchedPrimaryCount).toBe(FC_POINTS_WGS84_COUNT);
    expect(result.summary.outputFeatureCount).toBeGreaterThanOrEqual(FC_POINTS_WGS84_COUNT);
    expect(result.caveats.join(" ")).toMatch(/different CRS values/i);
  });

  it("blocks nearest spatial joins in geographic CRS", () => {
    const result = buildSpatialJoinPreview({
      mode: "spatial",
      primary: layer({ layerId: "a", features: fcPointsWGS84.features.slice(0, 2) as Feature[], crs: "EPSG:4326" }),
      join: layer({ layerId: "b", features: fcPointsWGS84.features.slice(2, 4) as Feature[], crs: "EPSG:4326" }),
      predicate: "nearest",
    });

    expect(result.ok).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/geographic CRS EPSG:4326/i);
  });

  it("routes large join estimates away from the UI thread", () => {
    expect(resolveJoinExecutionPlan(100, 100).strategy).toBe("main-thread");
    expect(resolveJoinExecutionPlan(1_000, 300).strategy).toBe("worker");
    expect(resolveJoinExecutionPlan(2_000, 2_000).strategy).toBe("duckdb");
  });

  it("exposes the join preview through the worker task entry point", () => {
    const stages: string[] = [];
    const result = runMapJoinWorkerTask(
      {
        request: {
          mode: "attribute",
          primary: layer({ layerId: "primary", features: [feature("p1", { id: "a" })] }),
          join: layer({ layerId: "lookup", features: [feature("j1", { id: "a", value: 4 })] }),
          primaryKey: "id",
          joinKey: "id",
        },
      },
      (progress) => {
        if (progress.stage) stages.push(progress.stage);
      },
    );

    expect(result.ok).toBe(true);
    expect(result.summary.matchedPrimaryCount).toBe(1);
    expect(stages).toContain("Join preview ready");
  });
});