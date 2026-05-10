import { describe, expect, it } from "vitest";
import {
  buildHotSpotDecoratedCollection,
  buildLisaDecoratedCollection,
  classifyHotSpotFromZScore,
  HOT_SPOT_COLORS,
  LISA_CLUSTER_COLORS,
  normalizeHotSpotConfidence,
  normalizeLisaClusterType,
  resolveHotSpotStats,
  resolveLisaStats,
} from "../spatialStatsVizUtils";

describe("spatialStatsVizUtils", () => {
  it("normalizes LISA cluster values from prompt and engine contracts", () => {
    expect(normalizeLisaClusterType("HH")).toBe("HH");
    expect(normalizeLisaClusterType("not-significant")).toBe("NS");
    expect(normalizeLisaClusterType("NS")).toBe("NS");
    expect(resolveLisaStats({
      local_i: 1.42,
      p_value: 0.012,
      cluster_type: "HL",
    }).clusterType).toBe("HL");
    expect(resolveLisaStats({
      localI: 0.88,
      pValue: 0.021,
      clusterType: "LL",
    }).clusterType).toBe("LL");
  });

  it("reclassifies non-significant LISA features above the threshold", () => {
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "hh-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[29, 41], [29.01, 41], [29.01, 41.01], [29, 41.01], [29, 41]]],
          },
          properties: {
            localI: 1.2,
            pValue: 0.01,
            clusterType: "HH",
          },
        },
        {
          type: "Feature",
          id: "hl-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[29.02, 41], [29.03, 41], [29.03, 41.01], [29.02, 41.01], [29.02, 41]]],
          },
          properties: {
            local_i: 0.8,
            p_value: 0.08,
            cluster_type: "HL",
          },
        },
      ],
    };

    const result = buildLisaDecoratedCollection(collection, 0.05);
    expect(result.validFeatureCount).toBe(2);
    expect(result.legend.find((entry) => entry.category === "HH")?.count).toBe(1);
    expect(result.legend.find((entry) => entry.category === "NS")?.count).toBe(1);
    expect(result.decoratedCollection.features[1]?.properties?.__lisaCluster).toBe("NS");
  });

  it("normalizes and derives hot spot confidence categories", () => {
    expect(normalizeHotSpotConfidence("hot-95")).toBe("hot-95");
    expect(normalizeHotSpotConfidence("cold spot 99")).toBe("cold-99");
    expect(classifyHotSpotFromZScore(2.7)).toBe("hot-99");
    expect(classifyHotSpotFromZScore(-2.1)).toBe("cold-95");
    expect(resolveHotSpotStats({
      gi_star: 2.82,
      z_score: 2.82,
      p_value: 0.004,
    }).confidence).toBe("hot-99");
  });

  it("reclassifies non-significant Gi* features above the threshold", () => {
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "hot-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[29, 41], [29.01, 41], [29.01, 41.01], [29, 41.01], [29, 41]]],
          },
          properties: {
            giStar: 2.6,
            zScore: 2.6,
            pValue: 0.009,
            confidence: "hot-99",
          },
        },
        {
          type: "Feature",
          id: "cold-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[29.02, 41], [29.03, 41], [29.03, 41.01], [29.02, 41.01], [29.02, 41]]],
          },
          properties: {
            gi_star: -1.8,
            z_score: -1.8,
            p_value: 0.072,
            confidence_level: "cold-90",
          },
        },
      ],
    };

    const result = buildHotSpotDecoratedCollection(collection, 0.05);
    expect(result.validFeatureCount).toBe(2);
    expect(result.legend.find((entry) => entry.category === "hot-99")?.count).toBe(1);
    expect(result.legend.find((entry) => entry.category === "not-significant")?.count).toBe(1);
    expect(result.decoratedCollection.features[1]?.properties?.__hotSpotCategory).toBe("not-significant");
  });

  it("uses the exact academic LISA color scheme and stable hotspot diverging colors", () => {
    expect(LISA_CLUSTER_COLORS).toEqual({
      HH: "#FF0000",
      HL: "#FF9999",
      LH: "#9999FF",
      LL: "#0000FF",
      NS: "#CCCCCC",
    });
    expect(HOT_SPOT_COLORS["not-significant"]).toBe("#FFFFBF");
    expect(HOT_SPOT_COLORS["hot-99"]).not.toBe(HOT_SPOT_COLORS["cold-99"]);
  });
});
