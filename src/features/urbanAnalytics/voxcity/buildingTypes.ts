// VoxCity 3D — Building Extrusion type definitions

/* ------------------------------------------------------------------ */
/*  Footprint geometry                                                */
/* ------------------------------------------------------------------ */

/** A 2D polygon ring as [x, y] pairs (first === last for closure). */
export type Ring = readonly [number, number][];

/** A 2D polygon footprint with optional holes. */
export interface BuildingFootprint {
  /** Outer ring — counter-clockwise winding expected. */
  readonly outer: Ring;
  /** Optional inner rings (holes) — clockwise winding expected. */
  readonly holes?: readonly Ring[];
}

/* ------------------------------------------------------------------ */
/*  Building feature                                                  */
/* ------------------------------------------------------------------ */

/** Arbitrary attribute bag for a building record. */
export type BuildingAttributes = Record<string, unknown>;

/** A single building feature with footprint and attributes. */
export interface BuildingFeature {
  /** Unique identifier. */
  readonly id: string;
  /** 2D footprint polygon. */
  readonly footprint: BuildingFootprint;
  /** Arbitrary attributes (e.g. height, floors, type, year). */
  readonly attributes: BuildingAttributes;
}

/* ------------------------------------------------------------------ */
/*  Level of detail                                                   */
/* ------------------------------------------------------------------ */

/** LOD level: basic = flat roof box; enriched = floor lines + roof type hint. */
export type LODLevel = "basic" | "enriched";

/* ------------------------------------------------------------------ */
/*  Height strategy                                                   */
/* ------------------------------------------------------------------ */

/**
 * Height fallback strategy — ordered list of attribute keys to try.
 * The first attribute that yields a positive finite number wins.
 * If none match, the `defaultHeight` is used.
 */
export interface HeightStrategy {
  /** Ordered attribute keys to probe for height (metres). */
  readonly attributeKeys: readonly string[];
  /** Fallback if no attribute yields a valid height. */
  readonly defaultHeight: number;
  /** Optional per-floor height for floors-based derivation. */
  readonly floorHeight?: number;
  /** Attribute key for number of floors (only used if present and height keys fail). */
  readonly floorsKey?: string;
}

export const DEFAULT_HEIGHT_STRATEGY: HeightStrategy = {
  attributeKeys: ["height", "building:height", "bldg_height", "ht"],
  defaultHeight: 10,
  floorHeight: 3.2,
  floorsKey: "building:levels",
};

/* ------------------------------------------------------------------ */
/*  Extrusion result                                                  */
/* ------------------------------------------------------------------ */

/** Extruded mesh data for a single building — geometry arrays ready for Three.js. */
export interface ExtrudedBuilding {
  /** Back-reference to the source building ID. */
  readonly id: string;
  /** Resolved height in metres. */
  readonly height: number;
  /** How height was derived. */
  readonly heightSource: "attribute" | "floors" | "default";
  /** Centroid of footprint [x, y]. */
  readonly centroid: readonly [number, number];
  /** Footprint area in square units. */
  readonly area: number;
  /** Vertex positions (flat Float32Array: x, y, z, x, y, z, …). */
  readonly positions: Float32Array;
  /** Triangle indices (flat Uint32Array). */
  readonly indices: Uint32Array;
  /** Per-vertex normals (flat Float32Array). */
  readonly normals: Float32Array;
  /** Copy of source attributes for thematic styling. */
  readonly attributes: BuildingAttributes;
  /** Whether the source footprint was auto-repaired. */
  readonly repaired: boolean;
}

/** Result of a batch extrusion run. */
export interface ExtrusionResult {
  /** Successfully extruded buildings. */
  readonly buildings: readonly ExtrudedBuilding[];
  /** Buildings that could not be extruded (invalid geometry etc.). */
  readonly skipped: readonly { id: string; reason: string }[];
  /** Total processing time in milliseconds. */
  readonly durationMs: number;
  /** LOD level used. */
  readonly lod: LODLevel;
}

/* ------------------------------------------------------------------ */
/*  Thematic styling                                                  */
/* ------------------------------------------------------------------ */

/** Color ramp stop. */
export interface ColorStop {
  readonly value: number;
  readonly color: readonly [number, number, number];
}

/** Thematic color strategy. */
export interface ThematicStyle {
  /** Attribute key to colour by. */
  readonly attributeKey: string;
  /** Label for UI display. */
  readonly label: string;
  /** Linear colour ramp stops (at least 2). */
  readonly ramp: readonly ColorStop[];
}

/**
 * Default thematic ramp — non-amber sequential analytical palette.
 * Cool→warm (teal→blue→purple→red) keeps increasing-intensity semantic
 * without using amber as data chrome. Documented as data palette per the
 * VS Code workbench color system rules; not a UI accent.
 */
export const DEFAULT_THEMATIC_RAMP: readonly ColorStop[] = [
  { value: 0, color: [0.18, 0.55, 0.45] },    // teal-green
  { value: 0.33, color: [0.22, 0.58, 1.00] }, // workbench blue
  { value: 0.66, color: [0.55, 0.35, 0.85] }, // violet
  { value: 1, color: [0.84, 0.15, 0.16] },    // red
];

/* ------------------------------------------------------------------ */
/*  Progress callback                                                 */
/* ------------------------------------------------------------------ */

/** Progress callback for long-running extrusion. */
export type ExtrusionProgressCallback = (processed: number, total: number) => void;
