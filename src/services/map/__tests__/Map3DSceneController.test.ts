import { describe, it, expect, beforeEach } from "vitest";
import {
  analyseExtrusion,
  buildScene3DMetadata,
  buildingConfigFromAnalysis,
  inspectBuildings,
  syncSelectionTo2D,
  syncSelectionTo3D,
  _resetSceneCounter,
} from "../scene3d/Map3DSceneController";
import { buildingFootprints } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

beforeEach(() => {
  _resetSceneCounter();
});

/* ------------------------------------------------------------------ */
/*  analyseExtrusion — uses buildingFootprints fixture                 */
/* ------------------------------------------------------------------ */

describe("analyseExtrusion", () => {
  it("detects the height field from buildingFootprints", () => {
    const result = analyseExtrusion(buildingFootprints);
    expect(result.canExtrude).toBe(true);
    expect(result.heightField).toBe("height");
    expect(result.heights).toHaveLength(6);
  });

  it("uses the height field values directly", () => {
    const result = analyseExtrusion(buildingFootprints, { heightField: "height" });
    // fixture: height = 9 + index * 3 → 9, 12, 15, 18, 21, 24
    const heightValues = result.heights.map((h) => h.heightMetres).sort((a, b) => a - b);
    expect(heightValues).toEqual([9, 12, 15, 18, 21, 24]);
  });

  it("uses floor count when no height field, falling back to floors field", () => {
    // Build a collection that only has 'floors', no 'height'
    const noHeight = {
      type: "FeatureCollection" as const,
      features: buildingFootprints.features.map((f) => ({
        ...f,
        properties: { id: f.properties?.id, floors: f.properties?.floors },
      })),
    };
    const result = analyseExtrusion(noHeight, { metersPerLevel: 3 });
    expect(result.canExtrude).toBe(true);
    expect(result.floorField).toBe("floors");
    expect(result.heightField).toBeNull();
    // heights are floors * 3 m
    result.heights.forEach((h) => {
      expect(h.isDirect).toBe(false);
    });
    // caveat about floor-count estimation
    expect(result.caveats.some((c) => c.includes("floor count"))).toBe(true);
  });

  it("emits a caveat and canExtrude=false when no height source exists", () => {
    const noHeightNoFloors = {
      type: "FeatureCollection" as const,
      features: buildingFootprints.features.map((f) => ({
        ...f,
        properties: { id: f.properties?.id },
      })),
    };
    const result = analyseExtrusion(noHeightNoFloors);
    expect(result.canExtrude).toBe(false);
    expect(result.caveats.length).toBeGreaterThan(0);
    expect(result.caveats[0]).toMatch(/No height or floor-count field/);
  });

  it("respects an explicit heightField override", () => {
    const result = analyseExtrusion(buildingFootprints, { heightField: "height" });
    expect(result.heightField).toBe("height");
  });
});

/* ------------------------------------------------------------------ */
/*  buildingConfigFromAnalysis                                          */
/* ------------------------------------------------------------------ */

describe("buildingConfigFromAnalysis", () => {
  it("produces a BuildingConfig with the correct heightProperty", () => {
    const analysis = analyseExtrusion(buildingFootprints, { heightField: "height" });
    const config = buildingConfigFromAnalysis("test-layer", buildingFootprints, analysis);
    expect(config.id).toBe("test-layer");
    expect(config.heightProperty).toBe("height");
    expect(config.data).toBe(buildingFootprints);
  });
});

/* ------------------------------------------------------------------ */
/*  Selection sync                                                      */
/* ------------------------------------------------------------------ */

describe("syncSelectionTo3D / syncSelectionTo2D", () => {
  it("maps 2D feature IDs to matching 3D building IDs", () => {
    const scene3dIds = ["1", "2", "3", "4", "5", "6"];
    const result = syncSelectionTo3D(["2", "4"], scene3dIds);
    expect(result).toEqual(["2", "4"]);
  });

  it("returns empty when no overlap", () => {
    const result = syncSelectionTo3D(["99"], ["1", "2", "3"]);
    expect(result).toEqual([]);
  });

  it("round-trips 3D selection back to 2D IDs", () => {
    const selected3d = ["3", "5"];
    const allIds = ["1", "2", "3", "4", "5", "6"];
    const result = syncSelectionTo2D(selected3d, allIds);
    expect(result).toEqual(["3", "5"]);
  });

  it("handles numeric feature IDs by coercing to string", () => {
    const result = syncSelectionTo3D([1, 2], ["1", "2", "3"]);
    expect(result).toContain("1");
    expect(result).toContain("2");
  });
});

/* ------------------------------------------------------------------ */
/*  inspectBuildings                                                    */
/* ------------------------------------------------------------------ */

describe("inspectBuildings", () => {
  it("returns one entry per polygon feature", () => {
    const analysis = analyseExtrusion(buildingFootprints, { heightField: "height" });
    const entries = inspectBuildings(buildingFootprints, analysis, []);
    expect(entries).toHaveLength(6);
  });

  it("marks selected entries correctly", () => {
    const analysis = analyseExtrusion(buildingFootprints, { heightField: "height" });
    const entries = inspectBuildings(buildingFootprints, analysis, ["1", "3"]);
    const selected = entries.filter((e) => e.isSelected);
    expect(selected.map((e) => String(e.featureId))).toContain("1");
    expect(selected.map((e) => String(e.featureId))).toContain("3");
    expect(selected).toHaveLength(2);
  });

  it("includes heightMetres from the height field", () => {
    const analysis = analyseExtrusion(buildingFootprints, { heightField: "height" });
    const entries = inspectBuildings(buildingFootprints, analysis, []);
    // first feature: height = 9
    const first = entries.find((e) => String(e.featureId) === "1");
    expect(first?.heightMetres).toBe(9);
  });
});

/* ------------------------------------------------------------------ */
/*  buildScene3DMetadata — runtime mode recorded                       */
/* ------------------------------------------------------------------ */

describe("buildScene3DMetadata", () => {
  it("records the runtime mode", () => {
    const analysis = analyseExtrusion(buildingFootprints, { heightField: "height" });
    const meta = buildScene3DMetadata({
      layerId: "layer-abc",
      runtimeMode: "2.5d",
      extrusionAnalysis: analysis,
      selectedFeatureIds: ["1"],
    });
    expect(meta.runtimeMode).toBe("2.5d");
    expect(meta.layerId).toBe("layer-abc");
    expect(meta.voxCityCompat.version).toBe(1);
    expect(meta.voxCityCompat.sourceView).toBe("map-2d");
  });

  it("includes extrusion caveats in voxCityCompat", () => {
    const noHeightCollection = {
      type: "FeatureCollection" as const,
      features: buildingFootprints.features.map((f) => ({
        ...f,
        properties: { id: f.properties?.id },
      })),
    };
    const analysis = analyseExtrusion(noHeightCollection);
    const meta = buildScene3DMetadata({
      layerId: "layer-xyz",
      runtimeMode: "2d",
      extrusionAnalysis: analysis,
      selectedFeatureIds: [],
    });
    expect(meta.voxCityCompat.caveats.length).toBeGreaterThan(0);
  });
});
