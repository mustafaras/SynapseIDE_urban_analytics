import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  applyCartographyRecommendationToLayer,
  collectNumericDistribution,
  evaluateColorScheme,
  generateMapCartographyReview,
  suggestClassificationMethod,
} from "../MapCartographyAdvisor";

function polygonLayer(values: number[], style: Record<string, unknown> = {}): OverlayLayerConfig {
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: values.map((value, index) => ({
      type: "Feature",
      id: `parcel-${index + 1}`,
      properties: { score: value },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29 + index * 0.001, 41],
          [29.0005 + index * 0.001, 41],
          [29.0005 + index * 0.001, 41.0005],
          [29 + index * 0.001, 41.0005],
          [29 + index * 0.001, 41],
        ]],
      },
    })),
  };

  return {
    id: "parcels",
    name: "Parcels",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: collection,
    style,
    metadata: {
      featureCount: collection.features.length,
      geometryType: "Polygon",
      bounds: [29, 41, 29.2, 41.2],
      fields: ["score"],
    },
  };
}

function pointLayer(count: number): OverlayLayerConfig {
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_, index) => ({
      type: "Feature",
      id: `point-${index + 1}`,
      properties: { weight: index + 1 },
      geometry: {
        type: "Point",
        coordinates: [29 + (index % 40) * 0.0001, 41 + Math.floor(index / 40) * 0.0001],
      },
    })),
  };

  return {
    id: "stops",
    name: "Transit stops",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: collection,
    style: {
      "circle-radius": 9,
      "circle-color": "#F59E0B",
    },
    metadata: {
      featureCount: count,
      geometryType: "Point",
      bounds: [29, 41, 29.01, 41.01],
      fields: ["weight"],
    },
  };
}

describe("MapCartographyAdvisor", () => {
  it("detects skewed numeric distributions and suggests quantile classes", () => {
    const distribution = collectNumericDistribution([1, 2, 2, 3, 3, 4, 5, 60, 90, 140]);
    const suggestion = suggestClassificationMethod(distribution);

    expect(distribution.shape).toMatch(/skewed|heavy-tailed/);
    expect(suggestion.method).toBe("quantile");
  });

  it("warns about red-green color schemes for thematic layers", () => {
    const findings = evaluateColorScheme({
      colors: ["#d7191c", "#1a9641", "#ffffbf"],
      numericFieldName: "risk_score",
    });

    expect(findings.some((finding) => finding.code === "red_green_conflict")).toBe(true);
  });

  it("generates reversible proposals for dense point symbols", () => {
    const layer = pointLayer(900);
    const review = generateMapCartographyReview([layer], {
      viewport: { zoom: 9, bounds: [29, 41, 29.01, 41.01] },
      now: new Date("2026-05-01T00:00:00.000Z"),
    });
    const recommendation = review.recommendations.find((entry) => entry.type === "symbol-density");

    expect(recommendation?.proposal?.layerPatch?.opacity).toBeLessThan(1);
    expect(recommendation?.proposal?.stylePatch?.["circle-radius"]).toBeLessThan(9);

    const updated = applyCartographyRecommendationToLayer(layer, recommendation!);
    expect(updated.opacity).toBe(recommendation?.proposal?.layerPatch?.opacity);
    expect(updated.metadata?.cartographyReview?.status).toBe("reviewed");
  });

  it("creates legend and classification proposals for thematic polygon layers", () => {
    const layer = polygonLayer([1, 2, 3, 4, 5, 6, 7, 8, 9, 1000], {
      "fill-color": "#F59E0B",
    });
    const review = generateMapCartographyReview([layer], {
      now: new Date("2026-05-01T00:00:00.000Z"),
    });

    const classification = review.recommendations.find((entry) => entry.type === "classification-method");
    const legend = review.recommendations.find((entry) => entry.type === "legend-completeness");

    expect(classification?.proposal?.stylePatch?.classificationMethod).toBe("quantile");
    expect(classification?.preview.afterLegend.length).toBeGreaterThan(1);
    expect(legend?.proposal?.stylePatch?.legendEntries).toBeDefined();
  });
});
