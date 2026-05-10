import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapScientificQAState } from "../MapScientificQA";
import { generateMapAnalysisRecommendations } from "../MapAnalysisRecommender";

function featureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

function polygonLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  const features = Array.from({ length: 12 }, (_, index) => ({
    type: "Feature" as const,
    id: `district-${index}`,
    properties: {
      population: 1_000 + index * 100,
      heat: 20 + index,
      income: 45_000 - index * 750,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[
        [index, 0],
        [index + 0.8, 0],
        [index + 0.8, 0.8],
        [index, 0.8],
        [index, 0],
      ]],
    },
  }));

  return {
    id: "districts",
    name: "District indicators",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: featureCollection(features),
    metadata: {
      geometryType: "polygon",
      featureCount: features.length,
    },
    ...overrides,
  };
}

function pointLayer(): OverlayLayerConfig {
  const features = Array.from({ length: 30 }, (_, index) => ({
    type: "Feature" as const,
    id: `event-${index}`,
    properties: {
      severity: index % 5,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [29 + index * 0.01, 41 + index * 0.005],
    },
  }));

  return {
    id: "events",
    name: "Incident events",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: featureCollection(features),
    metadata: {
      geometryType: "point",
      featureCount: features.length,
    },
  };
}

function temporalLayer(): OverlayLayerConfig {
  return polygonLayer({
    id: "change-surface",
    name: "Land use change surface",
    metadata: {
      geometryType: "polygon",
      featureCount: 12,
      analysisResult: {
        engine: "EmergingHotSpots",
        runTimestamp: "2025-01-01T00:00:00.000Z",
        parameterSummary: "Temporal Gi* run",
        inputParameters: {},
        statisticalSummary: {},
        visualization: {
          type: "temporal-layer",
          temporalFrames: [
            { id: "2020", label: "2020", timestamp: "2020-01-01T00:00:00.000Z", layerId: "change-surface" },
            { id: "2021", label: "2021", timestamp: "2021-01-01T00:00:00.000Z", layerId: "change-surface" },
            { id: "2022", label: "2022", timestamp: "2022-01-01T00:00:00.000Z", layerId: "change-surface" },
          ],
        } as never,
      },
    },
  });
}

function buildingLayer(): OverlayLayerConfig {
  return {
    id: "building-footprints",
    name: "Building footprints",
    type: "geojson",
    group: "voxcity",
    visible: true,
    opacity: 0.9,
    sourceData: featureCollection([
      {
        type: "Feature",
        id: "b-1",
        properties: { height: 32 },
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      },
    ]),
    metadata: {
      geometryType: "polygon",
      featureCount: 1,
      datasetContext: {
        thematicCoverage: ["buildings", "urban form"],
      },
    },
  };
}

function qaStateForLayer(layerId: string): MapScientificQAState {
  return {
    status: "error",
    checkedAt: "2025-01-01T00:00:00.000Z",
    issues: [
      {
        id: "qa-missing-crs",
        code: "missing-crs",
        category: "crs",
        severity: "blocker",
        title: "Missing CRS",
        explanation: "Layer CRS is unknown, so distance and adjacency results may be invalid.",
        suggestedFix: "Assign EPSG:4326 or re-import with CRS metadata.",
        layerId,
      },
    ],
    layerSummaries: [],
    metadata: {
      generatedBy: "MapScientificQA",
      version: 1,
      signature: "qa-test",
      visibleLayerCount: 1,
      workerLayerCount: 0,
      issueCounts: {
        info: 0,
        warning: 0,
        error: 0,
        blocker: 1,
      },
    },
  };
}

describe("generateMapAnalysisRecommendations", () => {
  it("ranks polygon numeric recommendations for choropleth, LISA, regression, and morphology", () => {
    const state = generateMapAnalysisRecommendations({
      overlayLayers: [polygonLayer()],
      userIntent: "analyze",
    });

    const ids = state.recommendations.map((recommendation) => recommendation.id);
    expect(ids).toContain("analysis-rec:polygon:choropleth:districts");
    expect(ids).toContain("analysis-rec:polygon:lisa:districts");
    expect(ids).toContain("analysis-rec:polygon:regression:districts");
    expect(ids).toContain("analysis-rec:polygon:cluster:districts");
    expect(state.recommendations[0]?.category).toBe("polygon");
    expect(state.recommendations.find((recommendation) => recommendation.id.includes("choropleth"))?.action).toMatchObject({
      type: "open-panel",
      panel: "choropleth",
    });
  });

  it("recommends point heatmap and accessibility workflows for event layers", () => {
    const state = generateMapAnalysisRecommendations({
      overlayLayers: [pointLayer()],
      userIntent: "analyze",
    });

    expect(state.recommendations[0]).toMatchObject({
      id: "analysis-rec:point:heatmap:events",
      action: {
        type: "open-panel",
        panel: "point-symbology",
        symbologyMode: "heatmap",
      },
    });
    expect(state.recommendations.some((recommendation) => recommendation.action.type === "open-flow" && recommendation.action.flowId === "accessibility")).toBe(true);
  });

  it("raises temporal playback and change analysis above static polygon styling", () => {
    const state = generateMapAnalysisRecommendations({
      overlayLayers: [temporalLayer()],
      userIntent: "analyze",
    });

    expect(state.recommendations[0]).toMatchObject({
      id: "analysis-rec:temporal:change-surface",
      category: "temporal",
      action: {
        type: "open-flow",
        flowId: "change_detection",
      },
    });
  });

  it("recommends VoxCity extrusion and sunlight workflows for building footprints", () => {
    const state = generateMapAnalysisRecommendations({
      overlayLayers: [buildingLayer()],
      userIntent: "explore",
    });

    expect(state.recommendations.some((recommendation) => recommendation.id === "analysis-rec:voxcity:extrude:building-footprints")).toBe(true);
    expect(state.recommendations.some((recommendation) => recommendation.action.type === "open-flow" && recommendation.action.flowId === "sunlight_sim")).toBe(true);
  });

  it("puts QA blockers first and blocks layer analysis actions", () => {
    const state = generateMapAnalysisRecommendations({
      overlayLayers: [polygonLayer()],
      scientificQA: qaStateForLayer("districts"),
      userIntent: "analyze",
    });

    expect(state.recommendations[0]).toMatchObject({
      id: "analysis-rec:qa:blockers",
      severity: "blocked",
      action: {
        type: "open-panel",
        panel: "scientific-qa",
      },
    });

    const choropleth = state.recommendations.find((recommendation) => recommendation.id === "analysis-rec:polygon:choropleth:districts");
    expect(choropleth).toMatchObject({
      severity: "blocked",
      action: {
        type: "open-panel",
        panel: "scientific-qa",
      },
      blockedByIssueIds: ["qa-missing-crs"],
    });
  });
});