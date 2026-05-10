/**
 * CityJSONLoader — Test Suite
 *
 * Covers document validation, vertex transform, semantic surface parsing,
 * triangulation, summary generation, sync/async loading, file loading,
 * and sample data integration.
 */
import { describe, expect, it } from "vitest";
import {
  loadCityJSON,
  loadCityJSONSync,
  validateCityJSON,
} from "../CityJSONLoader";
import type { CityJSONDocument } from "../cityJsonTypes";
import { SAMPLE_CITYJSON_STRING } from "../sampleCityJSON";

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

/** Minimal valid CityJSON document with 1 building (triangle roof + walls). */
function makeMinimalDoc(): CityJSONDocument {
  return {
    type: "CityJSON",
    version: "2.0",
    CityObjects: {
      bld1: {
        type: "Building",
        attributes: { function: "residential", height: 10 },
        geometry: [
          {
            type: "MultiSurface",
            lod: "1.0",
            boundaries: [
              // Triangle face (3 vertices)
              [[0, 1, 2]],
              // Quad face (4 vertices)
              [[0, 1, 4, 3]],
            ],
            semantics: {
              surfaces: [
                { type: "RoofSurface" },
                { type: "WallSurface" },
              ],
              values: [0, 1],
            },
          },
        ],
      },
    },
    vertices: [
      [0, 0, 0],
      [10, 0, 0],
      [5, 10, 0],
      [0, 0, 10],
      [10, 0, 10],
    ],
  };
}

/** Minimal doc with affine transform. */
function makeTransformedDoc(): CityJSONDocument {
  return {
    ...makeMinimalDoc(),
    transform: {
      scale: [0.01, 0.01, 0.01],
      translate: [100, 200, 0],
    },
    vertices: [
      [0, 0, 0],
      [1000, 0, 0],
      [500, 1000, 0],
      [0, 0, 1000],
      [1000, 0, 1000],
    ],
  };
}

/* ================================================================== */
/*  §1  DOCUMENT VALIDATION                                           */
/* ================================================================== */

describe("validateCityJSON", () => {
  it("accepts a valid document", () => {
    expect(validateCityJSON(makeMinimalDoc())).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(validateCityJSON(null)).toContain("not an object");
    expect(validateCityJSON("string")).toContain("not an object");
  });

  it("rejects wrong type field", () => {
    expect(validateCityJSON({ type: "GeoJSON", version: "2.0", CityObjects: {}, vertices: [] }))
      .toContain("CityJSON");
  });

  it("rejects missing version", () => {
    expect(validateCityJSON({ type: "CityJSON", CityObjects: {}, vertices: [] }))
      .toContain("version");
  });

  it("rejects missing CityObjects", () => {
    expect(validateCityJSON({ type: "CityJSON", version: "2.0", vertices: [] }))
      .toContain("CityObjects");
  });

  it("rejects missing vertices", () => {
    expect(validateCityJSON({ type: "CityJSON", version: "2.0", CityObjects: {} }))
      .toContain("vertices");
  });
});

/* ================================================================== */
/*  §2  SYNC LOADING — MINIMAL DOC                                    */
/* ================================================================== */

describe("loadCityJSONSync — minimal doc", () => {
  it("loads a minimal CityJSON document", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].id).toBe("bld1");
    expect(result.objects[0].type).toBe("Building");
  });

  it("preserves attributes", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.objects[0].attributes.function).toBe("residential");
    expect(result.objects[0].attributes.height).toBe(10);
  });

  it("assigns semantic surface types", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    const obj = result.objects[0];
    const types = obj.surfaces.map((s) => s.semanticType);
    expect(types).toContain("RoofSurface");
    expect(types).toContain("WallSurface");
  });

  it("produces valid geometry arrays", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    for (const s of result.objects[0].surfaces) {
      expect(s.positions.length).toBeGreaterThan(0);
      expect(s.positions.length % 3).toBe(0);
      expect(s.normals.length).toBe(s.positions.length);
      expect(s.indices.length % 3).toBe(0);
    }
  });

  it("computes bounding box", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    const bbox = result.objects[0].bbox;
    expect(bbox[0]).toBeLessThanOrEqual(bbox[3]);
    expect(bbox[1]).toBeLessThanOrEqual(bbox[4]);
    expect(bbox[2]).toBeLessThanOrEqual(bbox[5]);
  });
});

/* ================================================================== */
/*  §3  VERTEX TRANSFORM                                              */
/* ================================================================== */

describe("vertex transform", () => {
  it("applies scale and translate", () => {
    const result = loadCityJSONSync(JSON.stringify(makeTransformedDoc()));
    const obj = result.objects[0];
    // Vertex 0 should be at (0*0.01 + 100, 0*0.01 + 200, 0*0.01 + 0) = (100, 200, 0)
    // Check that positions include these transformed coordinates
    let foundOrigin = false;
    for (const s of obj.surfaces) {
      for (let i = 0; i < s.positions.length; i += 3) {
        if (Math.abs(s.positions[i] - 100) < 0.01 && Math.abs(s.positions[i + 1] - 200) < 0.01) {
          foundOrigin = true;
          break;
        }
      }
    }
    expect(foundOrigin).toBe(true);
  });

  it("global bbox reflects transformed coordinates", () => {
    const result = loadCityJSONSync(JSON.stringify(makeTransformedDoc()));
    const bbox = result.summary.bbox;
    expect(bbox).not.toBeNull();
    if (bbox) {
      // Min X should be around 100, max X around 110 (1000 * 0.01 + 100)
      expect(bbox[0]).toBeCloseTo(100, 0);
      expect(bbox[3]).toBeCloseTo(110, 0);
    }
  });
});

/* ================================================================== */
/*  §4  SUMMARY GENERATION                                            */
/* ================================================================== */

describe("summary", () => {
  it("counts objects by type", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.objectTypeCounts.Building).toBe(1);
  });

  it("counts semantic surfaces", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.semanticSurfaceCounts.RoofSurface).toBe(1);
    expect(result.summary.semanticSurfaceCounts.WallSurface).toBe(1);
  });

  it("collects attribute keys", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.attributeKeys).toContain("function");
    expect(result.summary.attributeKeys).toContain("height");
  });

  it("reports vertex count", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.vertexCount).toBe(5);
  });

  it("reports version", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.version).toBe("2.0");
  });

  it("reports parse time", () => {
    const result = loadCityJSONSync(JSON.stringify(makeMinimalDoc()));
    expect(result.summary.parseTimeMs).toBeGreaterThanOrEqual(0);
  });
});

/* ================================================================== */
/*  §5  SOLID GEOMETRY TYPE                                           */
/* ================================================================== */

describe("Solid geometry", () => {
  function makeSolidDoc(): CityJSONDocument {
    return {
      type: "CityJSON",
      version: "2.0",
      CityObjects: {
        box1: {
          type: "Building",
          attributes: { id: "box" },
          geometry: [
            {
              type: "Solid",
              lod: "2.0",
              boundaries: [
                [
                  // bottom face
                  [[0, 3, 2, 1]],
                  // top face
                  [[4, 5, 6, 7]],
                  // front wall
                  [[0, 1, 5, 4]],
                  // right wall
                  [[1, 2, 6, 5]],
                  // back wall
                  [[2, 3, 7, 6]],
                  // left wall
                  [[3, 0, 4, 7]],
                ],
              ],
              semantics: {
                surfaces: [
                  { type: "GroundSurface" },
                  { type: "RoofSurface" },
                  { type: "WallSurface" },
                  { type: "WallSurface" },
                  { type: "WallSurface" },
                  { type: "WallSurface" },
                ],
                values: [[0, 1, 2, 3, 4, 5]],
              },
            },
          ],
        },
      },
      vertices: [
        [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
        [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
      ],
    };
  }

  it("parses solid geometry into 6 surfaces", () => {
    const result = loadCityJSONSync(JSON.stringify(makeSolidDoc()));
    expect(result.objects.length).toBe(1);
    expect(result.objects[0].surfaces.length).toBe(6);
  });

  it("preserves all semantic types", () => {
    const result = loadCityJSONSync(JSON.stringify(makeSolidDoc()));
    const types = result.objects[0].surfaces.map((s) => s.semanticType);
    expect(types.filter((t) => t === "WallSurface").length).toBe(4);
    expect(types.filter((t) => t === "GroundSurface").length).toBe(1);
    expect(types.filter((t) => t === "RoofSurface").length).toBe(1);
  });
});

/* ================================================================== */
/*  §6  ASYNC LOADING                                                 */
/* ================================================================== */

describe("loadCityJSON (async)", () => {
  it("loads with progress callback", async () => {
    const phases: string[] = [];
    const result = await loadCityJSON(JSON.stringify(makeMinimalDoc()), (phase) => {
      if (!phases.includes(phase)) phases.push(phase);
    });
    expect(result.objects.length).toBe(1);
    expect(phases).toContain("Parsing JSON");
    expect(phases).toContain("Converting objects");
  });

  it("rejects invalid JSON", async () => {
    await expect(loadCityJSON("{invalid")).rejects.toThrow("Invalid JSON");
  });

  it("rejects invalid CityJSON structure", async () => {
    await expect(loadCityJSON(JSON.stringify({ type: "GeoJSON" }))).rejects.toThrow("Invalid CityJSON");
  });
});

/* ================================================================== */
/*  §7  ERROR HANDLING                                                */
/* ================================================================== */

describe("error handling", () => {
  it("sync loader rejects invalid JSON", () => {
    expect(() => loadCityJSONSync("{bad")).toThrow();
  });

  it("skips objects with no geometry", () => {
    const doc = makeMinimalDoc();
    doc.CityObjects["empty"] = {
      type: "GenericCityObject",
      attributes: {},
    };
    const result = loadCityJSONSync(JSON.stringify(doc));
    expect(result.objects.length).toBe(1); // only bld1
    expect(result.summary.objectCount).toBe(1);
  });

  it("handles empty CityObjects", () => {
    const doc: CityJSONDocument = {
      type: "CityJSON",
      version: "2.0",
      CityObjects: {},
      vertices: [],
    };
    const result = loadCityJSONSync(JSON.stringify(doc));
    expect(result.objects.length).toBe(0);
    expect(result.summary.objectCount).toBe(0);
  });
});

/* ================================================================== */
/*  §8  GEOMETRY VALIDATION                                           */
/* ================================================================== */

describe("geometry validation", () => {
  it("all vertex positions are finite", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      for (const s of obj.surfaces) {
        for (let i = 0; i < s.positions.length; i++) {
          expect(Number.isFinite(s.positions[i])).toBe(true);
        }
      }
    }
  });

  it("all normals are unit length", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      for (const s of obj.surfaces) {
        for (let i = 0; i < s.normals.length; i += 3) {
          const len = Math.sqrt(
            s.normals[i] ** 2 + s.normals[i + 1] ** 2 + s.normals[i + 2] ** 2,
          );
          expect(len).toBeCloseTo(1, 1);
        }
      }
    }
  });

  it("all indices reference valid vertices", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      for (const s of obj.surfaces) {
        const vertCount = s.positions.length / 3;
        for (let i = 0; i < s.indices.length; i++) {
          expect(s.indices[i]).toBeLessThan(vertCount);
          expect(s.indices[i]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("all index arrays have length divisible by 3", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      for (const s of obj.surfaces) {
        expect(s.indices.length % 3).toBe(0);
      }
    }
  });
});

/* ================================================================== */
/*  §9  SAMPLE DATA INTEGRATION                                      */
/* ================================================================== */

describe("sample CityJSON dataset", () => {
  it("loads all 8 buildings", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    expect(result.objects.length).toBe(8);
  });

  it("all objects are of type Building", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      expect(obj.type).toBe("Building");
    }
  });

  it("all objects have unique IDs", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    const ids = new Set(result.objects.map((o) => o.id));
    expect(ids.size).toBe(8);
  });

  it("all objects have semantic surfaces", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      const types = new Set(obj.surfaces.map((s) => s.semanticType));
      expect(types.has("RoofSurface")).toBe(true);
      expect(types.has("WallSurface")).toBe(true);
      expect(types.has("GroundSurface")).toBe(true);
    }
  });

  it("summary reports expected metadata", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    expect(result.summary.version).toBe("2.0");
    expect(result.summary.objectTypeCounts.Building).toBe(8);
    expect(result.summary.attributeKeys).toContain("function");
    expect(result.summary.attributeKeys).toContain("measuredHeight");
    expect(result.summary.attributeKeys).toContain("yearBuilt");
  });

  it("transform is applied — positions are in world space", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    // With scale 0.1 and translate [0,0,0], first building at (0,0) should have
    // vertex at origin in world space
    const obj = result.objects.find((o) => o.id === "bld-01");
    expect(obj).toBeDefined();
    if (!obj) return;
    let foundNearOrigin = false;
    for (const s of obj.surfaces) {
      for (let i = 0; i < s.positions.length; i += 3) {
        if (Math.abs(s.positions[i]) < 1 && Math.abs(s.positions[i + 1]) < 1) {
          foundNearOrigin = true;
          break;
        }
      }
      if (foundNearOrigin) break;
    }
    expect(foundNearOrigin).toBe(true);
  });

  it("deterministic results across runs", () => {
    const r1 = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    const r2 = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    expect(r1.objects.length).toBe(r2.objects.length);
    for (let i = 0; i < r1.objects.length; i++) {
      expect(r1.objects[i].id).toBe(r2.objects[i].id);
      expect(r1.objects[i].surfaces.length).toBe(r2.objects[i].surfaces.length);
    }
  });

  it("LOD is 2.0 (highest available)", () => {
    const result = loadCityJSONSync(SAMPLE_CITYJSON_STRING);
    for (const obj of result.objects) {
      expect(obj.lod).toBe("2.0");
    }
  });
});
