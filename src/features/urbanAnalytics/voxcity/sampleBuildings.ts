/**
 * Sample building dataset for BuildingExtruder demo.
 *
 * 50 buildings with varied footprints, heights, floor counts, types, and years.
 * Coordinates are in a local metric CRS (metres) centered near (0, 0).
 */

import type { BuildingFeature } from "./buildingTypes";
import { SAMPLE_BUILDING_COUNT } from "./sampleBuildingSummary";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Create a closed rectangular footprint at (cx, cy) with width × depth. */
function rect(
  cx: number,
  cy: number,
  w: number,
  d: number,
): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [cx - hw, cy - hd],
    [cx + hw, cy - hd],
    [cx + hw, cy + hd],
    [cx - hw, cy + hd],
    [cx - hw, cy - hd], // close
  ];
}

/** Create a closed L-shaped footprint. */
function lShape(
  cx: number,
  cy: number,
  w: number,
  d: number,
): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  // L-shape: full bottom + half-width top
  return [
    [cx - hw, cy - hd],
    [cx + hw, cy - hd],
    [cx + hw, cy],
    [cx, cy],
    [cx, cy + hd],
    [cx - hw, cy + hd],
    [cx - hw, cy - hd],
  ];
}

/* ------------------------------------------------------------------ */
/*  Building data                                                     */
/* ------------------------------------------------------------------ */

const TYPES = ["residential", "commercial", "office", "industrial", "public", "mixed"];

function mkBuilding(
  id: number,
  cx: number,
  cy: number,
  w: number,
  d: number,
  attrs: Record<string, unknown>,
  shape: "rect" | "L" = "rect",
): BuildingFeature {
  return {
    id: `bldg-${String(id).padStart(3, "0")}`,
    footprint: {
      outer: shape === "L" ? lShape(cx, cy, w, d) : rect(cx, cy, w, d),
    },
    attributes: {
      type: TYPES[id % TYPES.length],
      year: 1950 + (id * 7) % 75,
      ...attrs,
    },
  };
}

/**
 * 50 sample buildings arranged in a grid-like urban block pattern.
 * Heights range from 4m to 120m. Some have explicit height, some only floors.
 */
export const SAMPLE_BUILDINGS: readonly BuildingFeature[] = [
  // Row 1 — residential block (low-rise)
  mkBuilding(1, 0, 0, 12, 10, { height: 9, "building:levels": 3 }),
  mkBuilding(2, 20, 0, 14, 12, { height: 12, "building:levels": 4 }),
  mkBuilding(3, 40, 0, 10, 10, { "building:levels": 2 }),
  mkBuilding(4, 60, 0, 16, 14, { height: 15 }),
  mkBuilding(5, 80, 0, 12, 10, { height: 6, "building:levels": 2 }),

  // Row 2 — mixed mid-rise
  mkBuilding(6, 0, 25, 18, 16, { height: 24, "building:levels": 8 }),
  mkBuilding(7, 25, 25, 14, 14, { height: 18, "building:levels": 6 }),
  mkBuilding(8, 50, 25, 20, 18, { height: 30 }, "L"),
  mkBuilding(9, 75, 25, 16, 14, { "building:levels": 5 }),
  mkBuilding(10, 100, 25, 12, 12, { height: 21 }),

  // Row 3 — commercial strip
  mkBuilding(11, 5, 55, 22, 20, { height: 45, "building:levels": 15 }),
  mkBuilding(12, 35, 55, 18, 16, { height: 36, "building:levels": 12 }),
  mkBuilding(13, 60, 55, 24, 20, { height: 54, "building:levels": 18 }, "L"),
  mkBuilding(14, 90, 55, 16, 14, { height: 27, "building:levels": 9 }),
  mkBuilding(15, 115, 55, 14, 12, { height: 33 }),

  // Row 4 — high-rise cluster
  mkBuilding(16, 10, 85, 28, 24, { height: 90, "building:levels": 30 }),
  mkBuilding(17, 45, 85, 24, 22, { height: 75, "building:levels": 25 }),
  mkBuilding(18, 80, 85, 30, 26, { height: 120, "building:levels": 40 }),
  mkBuilding(19, 115, 85, 20, 18, { height: 60, "building:levels": 20 }),
  mkBuilding(20, 145, 85, 18, 16, { height: 48 }),

  // Row 5 — industrial / low
  mkBuilding(21, 0, 120, 30, 24, { height: 8 }),
  mkBuilding(22, 40, 120, 25, 20, { height: 6 }),
  mkBuilding(23, 75, 120, 20, 16, { height: 10 }),
  mkBuilding(24, 105, 120, 35, 28, { height: 7 }),
  mkBuilding(25, 150, 120, 22, 18, { height: 5 }),

  // Row 6 — public & mixed
  mkBuilding(26, 10, 155, 40, 30, { height: 16, "building:levels": 4 }),
  mkBuilding(27, 60, 155, 20, 20, { height: 35, "building:levels": 10 }),
  mkBuilding(28, 90, 155, 16, 14, { height: 22 }),
  mkBuilding(29, 115, 155, 24, 20, { height: 28, "building:levels": 9 }, "L"),
  mkBuilding(30, 150, 155, 18, 16, { height: 40, "building:levels": 12 }),

  // Row 7 — varied
  mkBuilding(31, 0, 190, 14, 12, { "building:levels": 7 }),
  mkBuilding(32, 25, 190, 16, 14, { height: 42 }),
  mkBuilding(33, 50, 190, 12, 10, { height: 18 }),
  mkBuilding(34, 75, 190, 20, 16, { height: 55, "building:levels": 17 }),
  mkBuilding(35, 105, 190, 18, 14, { height: 66, "building:levels": 22 }),

  // Row 8 — dense residential
  mkBuilding(36, 0, 220, 10, 10, { height: 12 }),
  mkBuilding(37, 15, 220, 10, 10, { height: 15 }),
  mkBuilding(38, 30, 220, 10, 10, { height: 9 }),
  mkBuilding(39, 45, 220, 10, 10, { height: 12 }),
  mkBuilding(40, 60, 220, 10, 10, { height: 18, "building:levels": 6 }),

  // Row 9 — towers
  mkBuilding(41, 85, 220, 22, 20, { height: 100, "building:levels": 33 }),
  mkBuilding(42, 115, 220, 20, 18, { height: 80, "building:levels": 26 }),
  mkBuilding(43, 145, 220, 18, 16, { height: 65, "building:levels": 21 }),

  // Row 10 — defaults only (no height or floor attributes)
  mkBuilding(44, 0, 255, 14, 12, {}),
  mkBuilding(45, 25, 255, 16, 14, {}),
  mkBuilding(46, 50, 255, 12, 10, {}),
  mkBuilding(47, 75, 255, 20, 18, {}),

  // Extras
  mkBuilding(48, 110, 255, 15, 13, { height: 4 }),
  mkBuilding(49, 140, 255, 26, 22, { height: 50, "building:levels": 16 }, "L"),
  mkBuilding(50, 170, 255, 12, 10, { "building:levels": 3 }),
];

if (SAMPLE_BUILDINGS.length !== SAMPLE_BUILDING_COUNT) {
  throw new Error(`VoxCity sample building count drifted: expected ${SAMPLE_BUILDING_COUNT}, received ${SAMPLE_BUILDINGS.length}.`);
}

/** Available numeric attribute keys in the sample dataset for thematic styling. */
export const SAMPLE_ATTRIBUTE_KEYS = ["height", "building:levels", "year"] as const;
