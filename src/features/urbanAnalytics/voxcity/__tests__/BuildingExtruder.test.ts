/**
 * BuildingExtruder — Test Suite
 *
 * Covers geometry utilities, height resolution, single-building extrusion,
 * batch extrusion, edge cases, and LOD variations.
 */
import { describe, expect, it } from "vitest";
import {
  centroid,
  extrudeBuilding,
  extrudeBuildings,
  extrudeBuildingsSync,
  polygonArea,
  resolveHeight,
  signedArea,
} from "../BuildingExtruder";
import {
  type BuildingFeature,
  DEFAULT_HEIGHT_STRATEGY,
  type HeightStrategy,
} from "../buildingTypes";
import { SAMPLE_BUILDINGS } from "../sampleBuildings";

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

/** Simple square footprint: (0,0)→(10,0)→(10,10)→(0,10)→(0,0) — CCW, 100 m² */
const SQUARE: BuildingFeature = {
  id: "sq-1",
  footprint: {
    outer: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
  },
  attributes: { height: 20, "building:levels": 6, type: "office", year: 2010 },
};

/** Triangle footprint: 50 m² */
const TRIANGLE: BuildingFeature = {
  id: "tri-1",
  footprint: {
    outer: [[0, 0], [10, 0], [5, 10], [0, 0]],
  },
  attributes: { "building:levels": 3 },
};

/** L-shaped footprint (6 vertices). */
const L_SHAPE: BuildingFeature = {
  id: "l-1",
  footprint: {
    outer: [[0, 0], [20, 0], [20, 10], [10, 10], [10, 20], [0, 20], [0, 0]],
  },
  attributes: { height: 15 },
};

/** CW winding (should be auto-repaired to CCW). */
const CW_SQUARE: BuildingFeature = {
  id: "cw-1",
  footprint: {
    outer: [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
  },
  attributes: { height: 12 },
};

/** Degenerate: only 2 points. */
const DEGENERATE_2PT: BuildingFeature = {
  id: "deg-2",
  footprint: { outer: [[0, 0], [5, 5]] },
  attributes: {},
};

/** Degenerate: collinear points (zero area). */
const COLLINEAR: BuildingFeature = {
  id: "col-1",
  footprint: { outer: [[0, 0], [5, 0], [10, 0], [0, 0]] },
  attributes: { height: 10 },
};

/** No height or floors attributes at all. */
const NO_HEIGHT: BuildingFeature = {
  id: "nh-1",
  footprint: {
    outer: [[0, 0], [8, 0], [8, 8], [0, 8], [0, 0]],
  },
  attributes: { type: "residential" },
};

/* ================================================================== */
/*  §1  GEOMETRY UTILITIES                                            */
/* ================================================================== */

describe("signedArea", () => {
  it("returns positive for CCW ring", () => {
    const area = signedArea([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
    expect(area).toBeGreaterThan(0);
  });

  it("returns negative for CW ring", () => {
    const area = signedArea([[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]);
    expect(area).toBeLessThan(0);
  });
});

describe("polygonArea", () => {
  it("computes area of a 10×10 square", () => {
    expect(polygonArea([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]])).toBeCloseTo(100, 6);
  });

  it("computes area of a triangle", () => {
    // base=10, height=10, area=50
    expect(polygonArea([[0, 0], [10, 0], [5, 10], [0, 0]])).toBeCloseTo(50, 6);
  });
});

describe("centroid", () => {
  it("computes centroid of a square at (5, 5)", () => {
    const c = centroid([[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]);
    expect(c[0]).toBeCloseTo(5, 4);
    expect(c[1]).toBeCloseTo(5, 4);
  });

  it("computes centroid of a triangle", () => {
    const c = centroid([[0, 0], [10, 0], [5, 10], [0, 0]]);
    expect(c[0]).toBeCloseTo(5, 4);
    expect(c[1]).toBeCloseTo(10 / 3, 2);
  });
});

/* ================================================================== */
/*  §2  HEIGHT RESOLUTION                                             */
/* ================================================================== */

describe("resolveHeight", () => {
  it("resolves from direct height attribute", () => {
    const r = resolveHeight({ height: 25 });
    expect(r.height).toBe(25);
    expect(r.source).toBe("attribute");
  });

  it("tries alternative attribute keys in order", () => {
    const r = resolveHeight({ "building:height": 18 });
    expect(r.height).toBe(18);
    expect(r.source).toBe("attribute");
  });

  it("falls back to floor count when height attributes missing", () => {
    const r = resolveHeight({ "building:levels": 5 });
    expect(r.height).toBeCloseTo(5 * 3.2, 2);
    expect(r.source).toBe("floors");
  });

  it("falls back to default when no attributes match", () => {
    const r = resolveHeight({});
    expect(r.height).toBe(DEFAULT_HEIGHT_STRATEGY.defaultHeight);
    expect(r.source).toBe("default");
  });

  it("ignores non-positive height values", () => {
    const r = resolveHeight({ height: -5, "building:levels": 4 });
    expect(r.source).toBe("floors");
    expect(r.height).toBeCloseTo(4 * 3.2, 2);
  });

  it("ignores NaN and Infinity", () => {
    const r = resolveHeight({ height: NaN, "bldg_height": Infinity });
    expect(r.source).toBe("default");
  });

  it("uses custom strategy", () => {
    const custom: HeightStrategy = {
      attributeKeys: ["ht_m"],
      defaultHeight: 7,
    };
    const r = resolveHeight({ ht_m: 30 }, custom);
    expect(r.height).toBe(30);
  });
});

/* ================================================================== */
/*  §3  SINGLE BUILDING EXTRUSION                                     */
/* ================================================================== */

describe("extrudeBuilding", () => {
  it("extrudes a square to basic LOD", () => {
    const result = extrudeBuilding(SQUARE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.id).toBe("sq-1");
    expect(result.height).toBe(20);
    expect(result.heightSource).toBe("attribute");
    expect(result.area).toBeCloseTo(100, 4);
    expect(result.positions.length).toBeGreaterThan(0);
    expect(result.indices.length).toBeGreaterThan(0);
    expect(result.normals.length).toBe(result.positions.length);
    expect(result.repaired).toBe(false);
  });

  it("extrudes a triangle", () => {
    const result = extrudeBuilding(TRIANGLE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.height).toBeCloseTo(3 * 3.2, 2);
    expect(result.heightSource).toBe("floors");
    expect(result.area).toBeCloseTo(50, 4);
  });

  it("extrudes an L-shape", () => {
    const result = extrudeBuilding(L_SHAPE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.height).toBe(15);
    // L-shape area: 20*10 + 10*10 = 300? No... let me compute:
    // Outer: (0,0→20,0→20,10→10,10→10,20→0,20→0,0)
    // area = 200+100 = 300
    expect(result.area).toBeCloseTo(300, 4);
  });

  it("auto-repairs CW winding", () => {
    const result = extrudeBuilding(CW_SQUARE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.repaired).toBe(true);
    expect(result.area).toBeCloseTo(100, 4);
  });

  it("skips degenerate footprint (2 vertices)", () => {
    const result = extrudeBuilding(DEGENERATE_2PT, "basic");
    expect("skipped" in result).toBe(true);
    if (!("skipped" in result)) return;
    expect(result.reason).toContain("fewer than 3");
  });

  it("skips collinear footprint (zero area)", () => {
    const result = extrudeBuilding(COLLINEAR, "basic");
    expect("skipped" in result).toBe(true);
    if (!("skipped" in result)) return;
    expect(result.reason).toContain("zero");
  });

  it("uses default height when no attributes present", () => {
    const result = extrudeBuilding(NO_HEIGHT, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.height).toBe(DEFAULT_HEIGHT_STRATEGY.defaultHeight);
    expect(result.heightSource).toBe("default");
  });

  it("preserves source attributes", () => {
    const result = extrudeBuilding(SQUARE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    expect(result.attributes.type).toBe("office");
    expect(result.attributes.year).toBe(2010);
  });
});

/* ================================================================== */
/*  §4  LOD VARIATIONS                                                */
/* ================================================================== */

describe("LOD variations", () => {
  it("enriched LOD produces more geometry than basic", () => {
    // Square with 20m height at 3.2m floor height → ~6 floor lines
    const basic = extrudeBuilding(SQUARE, "basic");
    const enriched = extrudeBuilding(SQUARE, "enriched");
    expect("skipped" in basic).toBe(false);
    expect("skipped" in enriched).toBe(false);
    if ("skipped" in basic || "skipped" in enriched) return;

    expect(enriched.positions.length).toBeGreaterThan(basic.positions.length);
    expect(enriched.indices.length).toBeGreaterThan(basic.indices.length);
  });

  it("enriched LOD with short building has no floor lines", () => {
    const shortBuilding: BuildingFeature = {
      id: "short-1",
      footprint: { outer: [[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]] },
      attributes: { height: 2 },
    };
    const basic = extrudeBuilding(shortBuilding, "basic");
    const enriched = extrudeBuilding(shortBuilding, "enriched");
    expect("skipped" in basic).toBe(false);
    expect("skipped" in enriched).toBe(false);
    if ("skipped" in basic || "skipped" in enriched) return;

    // Short building (2m) is under floorHeight (3.2m), so no floor lines added
    expect(enriched.positions.length).toBe(basic.positions.length);
  });
});

/* ================================================================== */
/*  §5  BATCH EXTRUSION                                               */
/* ================================================================== */

describe("extrudeBuildingsSync", () => {
  it("extrudes a batch of valid features", () => {
    const features: BuildingFeature[] = [SQUARE, TRIANGLE, L_SHAPE, NO_HEIGHT];
    const result = extrudeBuildingsSync(features);

    expect(result.buildings.length).toBe(4);
    expect(result.skipped.length).toBe(0);
    expect(result.lod).toBe("basic");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("reports skipped features", () => {
    const features: BuildingFeature[] = [SQUARE, DEGENERATE_2PT, COLLINEAR];
    const result = extrudeBuildingsSync(features);

    expect(result.buildings.length).toBe(1);
    expect(result.skipped.length).toBe(2);
  });

  it("handles empty input", () => {
    const result = extrudeBuildingsSync([]);
    expect(result.buildings.length).toBe(0);
    expect(result.skipped.length).toBe(0);
  });
});

describe("extrudeBuildings (async)", () => {
  it("extrudes with progress callback", async () => {
    const progressCalls: Array<[number, number]> = [];
    const result = await extrudeBuildings([SQUARE, TRIANGLE, L_SHAPE], {
      onProgress: (done, total) => progressCalls.push([done, total]),
      batchSize: 2,
    });

    expect(result.buildings.length).toBe(3);
    // At least one progress call for batch completion + final call
    expect(progressCalls.length).toBeGreaterThanOrEqual(1);
    // Last call should be (total, total)
    const last = progressCalls[progressCalls.length - 1];
    expect(last[0]).toBe(3);
    expect(last[1]).toBe(3);
  });

  it("supports enriched LOD in batch", async () => {
    const result = await extrudeBuildings([SQUARE], { lod: "enriched" });
    expect(result.lod).toBe("enriched");
    expect(result.buildings.length).toBe(1);
    expect(result.buildings[0].positions.length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  §6  GEOMETRY VALIDATION (rendering-oriented)                      */
/* ================================================================== */

describe("geometry validation", () => {
  it("all vertex positions are finite", () => {
    const result = extrudeBuilding(SQUARE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    for (let i = 0; i < result.positions.length; i++) {
      expect(Number.isFinite(result.positions[i])).toBe(true);
    }
  });

  it("all normals are unit length", () => {
    const result = extrudeBuilding(L_SHAPE, "enriched");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    for (let i = 0; i < result.normals.length; i += 3) {
      const len = Math.sqrt(
        result.normals[i] ** 2 +
        result.normals[i + 1] ** 2 +
        result.normals[i + 2] ** 2,
      );
      expect(len).toBeCloseTo(1, 1);
    }
  });

  it("all indices reference valid vertices", () => {
    const result = extrudeBuilding(L_SHAPE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    const vertCount = result.positions.length / 3;
    for (let i = 0; i < result.indices.length; i++) {
      expect(result.indices[i]).toBeLessThan(vertCount);
      expect(result.indices[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it("index count is a multiple of 3 (triangles)", () => {
    const result = extrudeBuilding(SQUARE, "enriched");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;
    expect(result.indices.length % 3).toBe(0);
  });

  it("position and normal arrays have same length", () => {
    const result = extrudeBuilding(L_SHAPE, "enriched");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;
    expect(result.normals.length).toBe(result.positions.length);
  });

  it("roof vertices have y coordinate equal to building height", () => {
    const result = extrudeBuilding(SQUARE, "basic");
    expect("skipped" in result).toBe(false);
    if ("skipped" in result) return;

    // In our coordinate system, Y component = height
    // Roof cap starts after floor cap (4 verts for square floor cap)
    // Floor: verts 0-3 at y=0, Roof: verts 4-7 at y=height
    const vertCount = result.positions.length / 3;
    let foundRoofVert = false;
    for (let i = 0; i < vertCount; i++) {
      const y = result.positions[i * 3 + 1];
      if (Math.abs(y - 20) < 0.01) {
        foundRoofVert = true;
        break;
      }
    }
    expect(foundRoofVert).toBe(true);
  });
});

/* ================================================================== */
/*  §7  SAMPLE DATA INTEGRATION                                      */
/* ================================================================== */

describe("sample buildings dataset", () => {
  it("contains 50 buildings", () => {
    expect(SAMPLE_BUILDINGS.length).toBe(50);
  });

  it("all sample buildings have unique IDs", () => {
    const ids = new Set(SAMPLE_BUILDINGS.map((b) => b.id));
    expect(ids.size).toBe(SAMPLE_BUILDINGS.length);
  });

  it("all sample buildings have valid footprints", () => {
    for (const b of SAMPLE_BUILDINGS) {
      expect(b.footprint.outer.length).toBeGreaterThanOrEqual(4); // at least 3 + closing
    }
  });

  it("batch extrusion of all samples succeeds with no skips", () => {
    const result = extrudeBuildingsSync(SAMPLE_BUILDINGS);
    expect(result.buildings.length).toBe(50);
    expect(result.skipped.length).toBe(0);
  });

  it("deterministic height derivation across runs", () => {
    const r1 = extrudeBuildingsSync(SAMPLE_BUILDINGS);
    const r2 = extrudeBuildingsSync(SAMPLE_BUILDINGS);
    expect(r1.buildings.length).toBe(r2.buildings.length);
    for (let i = 0; i < r1.buildings.length; i++) {
      expect(r1.buildings[i].height).toBe(r2.buildings[i].height);
      expect(r1.buildings[i].heightSource).toBe(r2.buildings[i].heightSource);
    }
  });
});
