import { describe, expect, it } from "vitest";
import {
  buildHeatmapColorExpression,
  HEATMAP_GRADIENTS,
} from "../heatmapStyleUtils";
import {
  buildGraduatedSymbolCollection,
  buildProportionalRadiusExpression,
  computeProportionalRadius,
} from "../symbolStyleUtils";
import { collectNumericFields } from "../symbologyUtils";

describe("heatmapStyleUtils", () => {
  it("builds a valid heatmap density expression", () => {
    const expression = buildHeatmapColorExpression("viridis");
    expect(expression[0]).toBe("interpolate");
    expect(expression[2]).toEqual(["heatmap-density"]);
    expect(expression).toContain(HEATMAP_GRADIENTS.viridis[0]);
    expect(expression).toContain(HEATMAP_GRADIENTS.viridis[4]);
  });
});

describe("symbolStyleUtils", () => {
  it("keeps partially numeric fields available for real point datasets", () => {
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29, 41] },
          properties: { magnitude: 10, optionalScore: 1 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.01, 41.01] },
          properties: { magnitude: 20, optionalScore: null },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.02, 41.02] },
          properties: { magnitude: 30, optionalScore: "not collected" },
        },
      ],
    };

    expect(collectNumericFields(collection)).toEqual([
      { name: "magnitude", numericCount: 3 },
      { name: "optionalScore", numericCount: 1 },
    ]);
  });

  it("computes proportional radius with the documented formula", () => {
    const radius = computeProportionalRadius(50, 0, 100, 2, 40);
    expect(radius).toBe(21);
  });

  it("builds a proportional radius expression", () => {
    const expression = buildProportionalRadiusExpression("value", 0, 100, 2, 40);
    expect(expression).toEqual([
      "interpolate",
      ["linear"],
      ["to-number", ["get", "value"], 0],
      0,
      2,
      100,
      40,
    ]);
  });

  it("classifies graduated symbols into bins with legend metadata", () => {
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [10, 20, 30, 40, 50, 60].map((value, index) => ({
        type: "Feature",
        id: `f-${index + 1}`,
        geometry: {
          type: "Point",
          coordinates: [29 + index * 0.01, 41],
        },
        properties: {
          value,
        },
      })),
    };

    const result = buildGraduatedSymbolCollection(
      collection,
      "value",
      "equal-interval",
      3,
      4,
      16,
      ["#fee8c8", "#fdbb84", "#e34a33"],
    );

    expect(result.classification.classes).toHaveLength(3);
    expect(result.legend).toHaveLength(3);
    expect(result.legend[0]?.radius).toBe(4);
    expect(result.legend[2]?.radius).toBe(16);
  });
});
