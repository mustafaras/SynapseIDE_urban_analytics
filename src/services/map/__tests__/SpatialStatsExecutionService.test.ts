import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  createSpatialStatsExecutionIdentity,
  executeEmergingHotSpotSpatialStats,
  executeHotSpotSpatialStats,
  executeLisaSpatialStats,
} from "../SpatialStatsExecutionService";

function makePolygonFeatureCollection(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "a",
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
        properties: { score: 10, y2020: 8, y2021: 9, y2022: 10 },
      },
      {
        type: "Feature",
        id: "b",
        geometry: {
          type: "Polygon",
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
        },
        properties: { score: 20, y2020: 15, y2021: 16, y2022: 18 },
      },
      {
        type: "Feature",
        id: "c",
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 1], [1, 1], [1, 2], [0, 2], [0, 1]]],
        },
        properties: { score: 15, y2020: 25, y2021: 30, y2022: 35 },
      },
      {
        type: "Feature",
        id: "d",
        geometry: {
          type: "Polygon",
          coordinates: [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
        },
        properties: { score: 30, y2020: 35, y2021: 40, y2022: 45 },
      },
      {
        type: "Feature",
        id: "skip",
        geometry: {
          type: "Polygon",
          coordinates: [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]],
        },
        properties: { score: null, y2020: 20, y2021: null, y2022: 22 },
      },
    ],
  };
}

function makeSourceLayer(): OverlayLayerConfig {
  return {
    id: "source-polygons",
    name: "Source Polygons",
    type: "geojson",
    visible: true,
    opacity: 0.85,
    group: "data",
    metadata: {
      featureCount: 5,
      geometryType: "Polygon",
      fields: ["score"],
      dataVersion: "source-v1",
    },
  };
}

describe("SpatialStatsExecutionService", () => {
  it("executes Local Moran's I from a polygon layer and records source metadata", () => {
    const identity = createSpatialStatsExecutionIdentity("lisa", "source-polygons", "score");
    const execution = executeLisaSpatialStats({
      sourceLayer: makeSourceLayer(),
      featureCollection: makePolygonFeatureCollection(),
      valueField: "score",
      weightsMethod: "queen",
      significanceThreshold: 0.05,
      alpha: 0.05,
      correction: "fdr",
      permutations: 99,
      runId: identity.runId,
      layerId: identity.layerId,
    });

    const collection = execution.adaptedResult.layer.sourceData as GeoJSON.FeatureCollection;
    expect(execution.validFeatureCount).toBe(4);
    expect(execution.skippedFeatureCount).toBe(1);
    expect(execution.adaptedResult.layer.id).toBe(identity.layerId);
    expect(execution.adaptedResult.layer.metadata?.analysisResult?.sourceLayerIds).toEqual(["source-polygons"]);
    expect(execution.adaptedResult.layer.metadata?.analysisResult?.sourceDataVersion).toBe("source-v1");
    expect(collection.features[0]?.properties?.local_i).not.toBeUndefined();
    expect(collection.features[0]?.properties?.__lisaCluster).toBeTypeOf("string");
  });

  it("executes Getis-Ord Gi* from a polygon layer and decorates the output collection", () => {
    const identity = createSpatialStatsExecutionIdentity("hotspot", "source-polygons", "score");
    const execution = executeHotSpotSpatialStats({
      sourceLayer: makeSourceLayer(),
      featureCollection: makePolygonFeatureCollection(),
      valueField: "score",
      weightsMethod: "queen",
      significanceThreshold: 0.05,
      selfWeight: true,
      runId: identity.runId,
      layerId: identity.layerId,
    });

    const collection = execution.adaptedResult.layer.sourceData as GeoJSON.FeatureCollection;
    expect(execution.validFeatureCount).toBe(4);
    expect(execution.skippedFeatureCount).toBe(1);
    expect(execution.adaptedResult.layer.id).toBe(identity.layerId);
    expect(execution.adaptedResult.layer.metadata?.analysisResult?.engine).toBe("GetisOrdGi");
    expect(collection.features[0]?.properties?.gi_star).not.toBeUndefined();
    expect(collection.features[0]?.properties?.__hotSpotCategory).toBeTypeOf("string");
  });

  it("executes emerging hot spot analysis and publishes a temporal analysis layer", () => {
    const identity = createSpatialStatsExecutionIdentity("emerging-hotspot", "source-polygons", "y2020-y2021-y2022");
    const execution = executeEmergingHotSpotSpatialStats({
      sourceLayer: makeSourceLayer(),
      featureCollection: makePolygonFeatureCollection(),
      timeFields: ["y2020", "y2021", "y2022"],
      weightsMethod: "queen",
      significanceThreshold: 0.05,
      selfWeight: true,
      runId: identity.runId,
      layerId: identity.layerId,
    });

    const collection = execution.adaptedResult.layer.sourceData as GeoJSON.FeatureCollection;
    const visualization = execution.adaptedResult.layer.metadata?.analysisResult?.visualization;

    expect(execution.validFeatureCount).toBe(4);
    expect(execution.skippedFeatureCount).toBe(1);
    expect(execution.timeStepCount).toBe(3);
    expect(execution.adaptedResult.layer.id).toBe(identity.layerId);
    expect(execution.adaptedResult.layer.metadata?.analysisResult?.engine).toBe("EmergingHotSpots");
    expect(visualization?.kind).toBe("temporal");
    expect(visualization?.temporalFrames).toHaveLength(3);
    expect(visualization?.legendEntries).toHaveLength(8);
    expect(collection.features[0]?.properties?.__hotSpotCategory).toBeTypeOf("string");
    expect(collection.features[0]?.properties?.emerging_hotspot_reason).toBeTypeOf("string");
  });
});
