import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type { MapNLQueryLayer } from "../MapNLQueryBuilder";
import { fcLarge, fcPointsWGS84 } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import {
  createMapSpatialBboxShape,
  executeMapQueryPlan,
  MAP_QUERY_PLANNER_VERSION,
  planMapQuery,
} from "../query/MapQueryPlanner";

function makeLayer(id: string, featureCollection: FeatureCollection): MapNLQueryLayer {
  return {
    id,
    name: id,
    tableAlias: id,
    tableKind: "geojson-overlay",
    visible: true,
    sourceKind: "imported",
    featureCount: featureCollection.features.length,
    geometryType: "Point",
    geometryColumn: "geometry",
    fields: ["id", "name", "value", "date"],
    crs: "EPSG:4326",
    qaStatus: "passed",
    publicationReadiness: "ready",
    evidenceArtifactId: null,
    sourceData: featureCollection,
  };
}

describe("MapQueryPlanner", () => {
  it("returns the expected count for a bounded rectangle selection over fcPointsWGS84", () => {
    const plan = planMapQuery({
      kind: "spatial",
      layers: [makeLayer("points", fcPointsWGS84)],
      scope: {
        mode: "visible-layers",
        layerIds: ["points"],
        maxFeaturesPerLayer: 100,
        maxTotalFeatures: 100,
        reason: "Prompt 15 rectangle selection test over a visible fixture layer.",
      },
      spatial: {
        source: "rectangle-select",
        predicate: "intersects",
        shape: createMapSpatialBboxShape([28.999, 40.999, 29.041, 41.011]),
      },
      requestedAt: "2026-05-24T12:00:00.000Z",
      queryId: "test-rectangle-selection",
    });

    const result = executeMapQueryPlan(plan, "2026-05-24T12:00:01.000Z");

    expect(result.status).toBe("success");
    expect(result.totalMatched).toBe(10);
    expect(result.matchedByLayer.points).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(result.provenance.plannerVersion).toBe(MAP_QUERY_PLANNER_VERSION);
    expect(result.provenance.spatial?.source).toBe("rectangle-select");
  });

  it("caps fcLarge execution to the declared scope instead of scanning all features", () => {
    const plan = planMapQuery({
      kind: "spatial",
      layers: [makeLayer("large", fcLarge())],
      scope: {
        mode: "visible-layers",
        layerIds: ["large"],
        maxFeaturesPerLayer: 1_000,
        maxTotalFeatures: 750,
        reason: "Prompt 15 large-layer guardrail.",
      },
      spatial: {
        source: "rectangle-select",
        predicate: "intersects",
        shape: createMapSpatialBboxShape([28.9, 40.9, 29.6, 41.6]),
      },
      requestedAt: "2026-05-24T12:02:00.000Z",
      queryId: "test-large-bounded-selection",
    });

    const result = executeMapQueryPlan(plan, "2026-05-24T12:02:01.000Z");

    expect(result.status).toBe("success");
    expect(result.bounded).toBe(true);
    expect(result.truncated).toBe(true);
    expect(result.scannedFeatureCount).toBe(750);
    expect(result.layers[0]?.sourceFeatureCount).toBe(100_000);
    expect(result.layers[0]?.truncated).toBe(true);
    expect(result.provenance.scope.maxTotalFeatures).toBe(750);
    expect(result.warnings).toContain("Query execution was truncated by the declared feature scan budget.");
  });

  it("attaches provenance to attribute query results", () => {
    const plan = planMapQuery({
      kind: "attribute",
      layers: [makeLayer("points", fcPointsWGS84)],
      scope: {
        mode: "filter",
        layerIds: ["points"],
        maxFeaturesPerLayer: 100,
        maxTotalFeatures: 100,
        reason: "Prompt 15 attribute filter over queryable fixture layer.",
      },
      attribute: {
        field: "name",
        operator: "equals",
        value: "site-13",
      },
      requestedAt: "2026-05-24T12:04:00.000Z",
      queryId: "test-attribute-provenance",
    });

    const result = executeMapQueryPlan(plan, "2026-05-24T12:04:01.000Z");

    expect(result.status).toBe("success");
    expect(result.totalMatched).toBe(1);
    expect(result.matchedByLayer.points).toEqual(["13"]);
    expect(result.provenance.executedAt).toBe("2026-05-24T12:04:01.000Z");
    expect(result.provenance.sourceLayers).toEqual([
      {
        layerId: "points",
        name: "points",
        sourceKind: "imported",
        featureCount: 25,
        crs: "EPSG:4326",
      },
    ]);
    expect(result.provenance.attribute).toMatchObject({
      field: "name",
      operator: "equals",
      value: "site-13",
    });
  });
});
