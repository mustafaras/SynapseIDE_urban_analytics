/**
 * Sample CityJSON fixture — a small urban block with 8 buildings.
 *
 * Each building has semantic surfaces (RoofSurface, WallSurface, GroundSurface)
 * and attributes (function, yearBuilt, measuredHeight, storeysAboveGround).
 *
 * Vertices use integer compression with a transform (scale + translate)
 * as per real-world CityJSON practice.
 */

import type { CityJSONDocument } from "./cityJsonTypes";

/* ================================================================== */
/*  Helpers to build sample geometry compactly                        */
/* ================================================================== */

type Vert3 = [number, number, number];

/**
 * Build a LoD 2 Solid geometry object for a simple extruded box.
 * Ground at z=0, roof at z=height. All faces annotated semantically.
 *
 * Returns { geometry, vertices } pair — vertices are integer-compressed.
 */
function buildBoxSolid(
  originX: number,
  originY: number,
  width: number,
  depth: number,
  height: number,
  baseVIdx: number,
): {
  vertices: Vert3[];
  geometry: {
    type: "Solid";
    lod: string;
    boundaries: number[][][][];
    semantics: {
      surfaces: { type: string }[];
      values: (number | null)[][];
    };
  };
} {
  // 8 corner vertices (integer-compressed: divide by scale later)
  // Bottom: 0-3 (CCW from above), Top: 4-7
  const v: Vert3[] = [
    [originX, originY, 0],
    [originX + width, originY, 0],
    [originX + width, originY + depth, 0],
    [originX, originY + depth, 0],
    [originX, originY, height],
    [originX + width, originY, height],
    [originX + width, originY + depth, height],
    [originX, originY + depth, height],
  ];

  const b = baseVIdx;
  // Solid → shell → polygon → ring → vertex indices
  const boundaries: number[][][][] = [
    [
      // Ground (bottom face — CW from outside looking up = CCW from outside looking down)
      [[b + 0, b + 3, b + 2, b + 1]],
      // Roof (top face — CCW from above)
      [[b + 4, b + 5, b + 6, b + 7]],
      // Wall: front (y=0)
      [[b + 0, b + 1, b + 5, b + 4]],
      // Wall: right (x=width)
      [[b + 1, b + 2, b + 6, b + 5]],
      // Wall: back (y=depth)
      [[b + 2, b + 3, b + 7, b + 6]],
      // Wall: left (x=0)
      [[b + 3, b + 0, b + 4, b + 7]],
    ],
  ];

  return {
    vertices: v,
    geometry: {
      type: "Solid",
      lod: "2.0",
      boundaries,
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
  };
}

/* ================================================================== */
/*  Sample buildings                                                  */
/* ================================================================== */

interface BuildingSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  function: string;
  yearBuilt: number;
  storeys: number;
}

const SPECS: BuildingSpec[] = [
  { id: "bld-01", x: 0, y: 0, w: 150, d: 120, h: 450, function: "office", yearBuilt: 2005, storeys: 15 },
  { id: "bld-02", x: 200, y: 0, w: 100, d: 100, h: 300, function: "residential", yearBuilt: 1995, storeys: 10 },
  { id: "bld-03", x: 350, y: 0, w: 80, d: 140, h: 180, function: "commercial", yearBuilt: 2012, storeys: 6 },
  { id: "bld-04", x: 0, y: 200, w: 120, d: 100, h: 360, function: "residential", yearBuilt: 2018, storeys: 12 },
  { id: "bld-05", x: 180, y: 200, w: 160, d: 130, h: 600, function: "office", yearBuilt: 2021, storeys: 20 },
  { id: "bld-06", x: 400, y: 200, w: 90, d: 90, h: 120, function: "retail", yearBuilt: 1988, storeys: 4 },
  { id: "bld-07", x: 0, y: 400, w: 200, d: 150, h: 240, function: "mixed_use", yearBuilt: 2015, storeys: 8 },
  { id: "bld-08", x: 260, y: 400, w: 130, d: 110, h: 540, function: "residential", yearBuilt: 2020, storeys: 18 },
];

/**
 * Generate a realistic sample CityJSON document with 8 buildings,
 * semantic surfaces, and compressed integer vertices.
 */
function buildSampleDocument(): CityJSONDocument {
  const allVertices: Vert3[] = [];
  const cityObjects: Record<string, {
    type: string;
    attributes: Record<string, unknown>;
    geometry: unknown[];
  }> = {};

  for (const spec of SPECS) {
    const baseIdx = allVertices.length;
    const { vertices, geometry } = buildBoxSolid(
      spec.x, spec.y, spec.w, spec.d, spec.h, baseIdx,
    );
    allVertices.push(...vertices);

    cityObjects[spec.id] = {
      type: "Building",
      attributes: {
        function: spec.function,
        yearBuilt: spec.yearBuilt,
        measuredHeight: spec.h / 10, // Convert to metres (1 unit = 0.1m)
        storeysAboveGround: spec.storeys,
        roofType: spec.storeys > 10 ? "flat" : "gabled",
      },
      geometry: [geometry],
    };
  }

  return {
    type: "CityJSON",
    version: "2.0",
    transform: {
      scale: [0.1, 0.1, 0.1],    // 1 integer unit = 0.1 metre
      translate: [0, 0, 0],
    },
    metadata: {
      identifier: "sample-urban-block",
      referenceSystem: "urn:ogc:def:crs:EPSG::7415",
      title: "Sample Urban Block — 8 Buildings",
      referenceDate: "2024-01-15",
    },
    CityObjects: cityObjects as CityJSONDocument["CityObjects"],
    vertices: allVertices,
  };
}

/** Pre-built sample CityJSON document. */
export const SAMPLE_CITYJSON: Readonly<CityJSONDocument> = buildSampleDocument();

/** Serialized JSON string of the sample document for loader tests. */
export const SAMPLE_CITYJSON_STRING: string = JSON.stringify(SAMPLE_CITYJSON);

/** List of attribute keys present in the sample data. */
export const SAMPLE_CITYJSON_ATTRIBUTE_KEYS = [
  "function",
  "measuredHeight",
  "roofType",
  "storeysAboveGround",
  "yearBuilt",
] as const;
