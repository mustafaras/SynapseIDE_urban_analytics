import { describe, expect, it } from "vitest";
import type { DrawnFeature } from "@/centerpanel/components/map/mapTypes";
import { getGeometryBounds, resolveMapAnalysisBounds } from "../MapAnalysisBounds";

function polygonFeature(id: string, label: string, offset = 0): DrawnFeature {
  return {
    id,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [13 + offset, 52],
        [13.01 + offset, 52],
        [13.01 + offset, 52.01],
        [13 + offset, 52.01],
        [13 + offset, 52],
      ]],
    },
    properties: { label, createdAt: "2026-04-26T00:00:00.000Z" },
  };
}

describe("MapAnalysisBounds", () => {
  it("computes bounds for polygon geometry", () => {
    expect(getGeometryBounds(polygonFeature("aoi-1", "Study Area").geometry)).toEqual([13, 52, 13.01, 52.01]);
  });

  it("prioritizes selected AOI over active AOI and viewport", () => {
    const selected = polygonFeature("selected", "Selected district", 0.1);
    const active = polygonFeature("active", "Active district", 0.2);

    const result = resolveMapAnalysisBounds({
      drawnFeatures: [active, selected],
      selectedFeatureId: "selected",
      activeAoiId: "active",
      currentMapBounds: [0, 0, 1, 1],
    });

    expect(result?.source).toBe("selected-aoi");
    expect(result?.label).toBe("Selected district");
    expect(result?.bounds).toEqual([13.1, 52, 13.11, 52.01]);
  });

  it("falls back to current map extent when no drawn AOI exists", () => {
    expect(resolveMapAnalysisBounds({ drawnFeatures: [], currentMapBounds: [1, 2, 3, 4] })).toEqual({
      bounds: [1, 2, 3, 4],
      source: "map-view",
      label: "Current visible map extent",
    });
  });
});
