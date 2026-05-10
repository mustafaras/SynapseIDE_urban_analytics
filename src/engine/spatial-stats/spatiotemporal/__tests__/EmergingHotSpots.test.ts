import { describe, expect, it } from "vitest";
import { queenContiguity, rowStandardize } from "@/engine/spatial-stats/autocorrelation/SpatialWeights";
import type { SpatialFeature } from "@/engine/spatial-stats/types";
import {
  analyse,
  classifySeriesFromZScores,
  emergingHotSpotLegend,
  trendMap,
} from "../EmergingHotSpots";

function grid2x2(): SpatialFeature[] {
  return [
    {
      id: "a",
      centroid: [0.5, 0.5],
      rings: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
    {
      id: "b",
      centroid: [1.5, 0.5],
      rings: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
    },
    {
      id: "c",
      centroid: [0.5, 1.5],
      rings: [[[0, 1], [1, 1], [1, 2], [0, 2], [0, 1]]],
    },
    {
      id: "d",
      centroid: [1.5, 1.5],
      rings: [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
    },
  ];
}

function makeFeatureCollection(): GeoJSON.FeatureCollection {
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
        properties: { name: "A" },
      },
      {
        type: "Feature",
        id: "b",
        geometry: {
          type: "Polygon",
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
        },
        properties: { name: "B" },
      },
      {
        type: "Feature",
        id: "c",
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 1], [1, 1], [1, 2], [0, 2], [0, 1]]],
        },
        properties: { name: "C" },
      },
      {
        type: "Feature",
        id: "d",
        geometry: {
          type: "Polygon",
          coordinates: [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]],
        },
        properties: { name: "D" },
      },
    ],
  };
}

describe("EmergingHotSpots", () => {
  it("classifies the planned eight category fixtures", () => {
    expect(classifySeriesFromZScores([0, 0, 0, 0, 0, 0, 0, 0, 0, 2.8]).category).toBe("new");
    expect(classifySeriesFromZScores([0, 0, 0, 0, 0, 0, 2.2, 2.3, 2.4, 2.5]).category).toBe("consecutive");
    expect(classifySeriesFromZScores([2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9]).category).toBe("intensifying");
    expect(classifySeriesFromZScores([2.4, 2.4, 2.3, 2.3, 2.4, 2.5, 2.4, 2.3, 2.4, 2.4]).category).toBe("persistent");
    expect(classifySeriesFromZScores([3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5]).category).toBe("diminishing");
    expect(classifySeriesFromZScores([2.2, 0, 2.3, 0, 2.4, 0, 2.5, 0, 2.6, 2.7]).category).toBe("sporadic");
    expect(classifySeriesFromZScores([2.4, 2.2, -2.3, -2.4, 0, 2.1, 2.3, -2.2, 0, 2.6]).category).toBe("oscillating");
    expect(classifySeriesFromZScores([2.4, 2.3, 2.5, 2.6, 2.7, 2.5, 2.4, 2.6, 2.4, 0]).category).toBe("historical");
  });

  it("returns null when a series does not match any planned category", () => {
    const result = classifySeriesFromZScores([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.category).toBeNull();
    expect(result.reason).toContain("No emerging hot spot category");
  });

  it("produces per-step Gi* outputs and trend-map diagnostics", () => {
    const weights = rowStandardize(queenContiguity(grid2x2()));
    const result = analyse(
      [
        { key: "t0", label: "Baseline", values: [1, 1, 9, 9] },
        { key: "t1", label: "Transition", values: [1, 2, 9, 10] },
        { key: "t2", label: "Current", values: [1, 2, 10, 11] },
      ],
      weights,
      { significanceThreshold: 0.05 },
    );

    expect(result.timeStepCount).toBe(3);
    expect(result.featureCount).toBe(4);
    expect(result.timeSteps).toHaveLength(3);
    expect(result.locations).toHaveLength(4);
    expect(result.legend).toHaveLength(8);
    expect(result.timeSteps[0]?.hotSpotResult.results).toHaveLength(4);
    expect(result.locations[0]?.diagnostics.mannKendall.sampleSize).toBe(3);

    const mapped = trendMap(makeFeatureCollection(), result);
    expect(mapped.features[0]?.properties?.mann_kendall_trend).toBeTypeOf("string");
    expect(mapped.features[0]?.properties?.final_hotspot_confidence).toBeTypeOf("string");
  });

  it("returns the full eight-category legend metadata", () => {
    const legend = emergingHotSpotLegend();
    expect(legend).toHaveLength(8);
    expect(legend.map((entry) => entry.category)).toEqual([
      "new",
      "consecutive",
      "intensifying",
      "persistent",
      "diminishing",
      "sporadic",
      "oscillating",
      "historical",
    ]);
  });
});
