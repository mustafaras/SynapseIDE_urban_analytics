/**
 * CityJSON Type Definitions
 *
 * Covers CityJSON v2.0 structures, parsed CityObjects, semantic surfaces,
 * renderable geometry output, and loader configuration.
 *
 * Reference: https://www.cityjson.org/specs/2.0.0/
 */

/* ================================================================== */
/*  CityJSON v2.0 raw schema types                                    */
/* ================================================================== */

/** Top-level CityJSON document. */
export interface CityJSONDocument {
  type: "CityJSON";
  version: string;
  transform?: CityJSONTransform;
  metadata?: CityJSONMetadata;
  CityObjects: Record<string, RawCityObject>;
  vertices: [number, number, number][];
  "extensions"?: Record<string, unknown>;
}

/** Affine transform for compressed integer vertices. */
export interface CityJSONTransform {
  scale: [number, number, number];
  translate: [number, number, number];
}

/** Optional metadata block. */
export interface CityJSONMetadata {
  identifier?: string;
  referenceSystem?: string;
  geographicalExtent?: [number, number, number, number, number, number];
  referenceDate?: string;
  title?: string;
  [key: string]: unknown;
}

/** CityObject types per CityJSON v2.0 spec. */
export type CityObjectType =
  | "Building"
  | "BuildingPart"
  | "BuildingInstallation"
  | "Bridge"
  | "BridgePart"
  | "BridgeInstallation"
  | "BridgeConstructiveElement"
  | "CityObjectGroup"
  | "CityFurniture"
  | "GenericCityObject"
  | "LandUse"
  | "PlantCover"
  | "Railway"
  | "Road"
  | "SolitaryVegetationObject"
  | "TINRelief"
  | "TransportSquare"
  | "Tunnel"
  | "TunnelPart"
  | "TunnelInstallation"
  | "WaterBody"
  | "ExtensionObject"
  | (string & {});

/** Semantic surface types. */
export type SemanticSurfaceType =
  | "RoofSurface"
  | "WallSurface"
  | "GroundSurface"
  | "OuterCeilingSurface"
  | "OuterFloorSurface"
  | "ClosureSurface"
  | "Window"
  | "Door"
  | "InteriorWallSurface"
  | "CeilingSurface"
  | "FloorSurface"
  | "WaterSurface"
  | "WaterGroundSurface"
  | "WaterClosureSurface"
  | (string & {});

/** Raw semantic surface definition in CityJSON. */
export interface RawSemanticSurface {
  type: SemanticSurfaceType;
  [key: string]: unknown;
}

/** Raw geometry object in CityJSON. */
export interface RawGeometry {
  type: "Solid" | "MultiSurface" | "CompositeSurface" | "MultiSolid" | (string & {});
  lod: string;
  boundaries: number[][][] | number[][][][];
  semantics?: {
    surfaces: RawSemanticSurface[];
    values: (number | null)[] | (number | null)[][];
  };
}

/** Raw CityObject entry in CityJSON. */
export interface RawCityObject {
  type: CityObjectType;
  attributes?: Record<string, unknown>;
  geometry?: RawGeometry[];
  children?: string[];
  parents?: string[];
  geographicalExtent?: [number, number, number, number, number, number];
}

/* ================================================================== */
/*  Parsed / renderable types                                         */
/* ================================================================== */

/** A single triangulated surface with semantic annotation. */
export interface ParsedSurface {
  /** Semantic type (null if not annotated). */
  semanticType: SemanticSurfaceType | null;
  /** Flat Float32 positions [x,y,z, x,y,z, ...]. */
  positions: Float32Array;
  /** Triangle indices. */
  indices: Uint32Array;
  /** Per-vertex normals. */
  normals: Float32Array;
}

/** A fully parsed CityObject ready for rendering. */
export interface ParsedCityObject {
  id: string;
  type: CityObjectType;
  attributes: Record<string, unknown>;
  surfaces: ParsedSurface[];
  /** Bounding box [minX, minY, minZ, maxX, maxY, maxZ]. */
  bbox: [number, number, number, number, number, number];
  children: string[];
  parents: string[];
  lod: string;
}

/** Aggregated metadata from a loaded CityJSON document. */
export interface CityJSONSummary {
  version: string;
  referenceSystem: string | null;
  objectCount: number;
  objectTypeCounts: Record<string, number>;
  semanticSurfaceCounts: Record<string, number>;
  attributeKeys: string[];
  vertexCount: number;
  bbox: [number, number, number, number, number, number] | null;
  parseTimeMs: number;
}

/** Result of loading a CityJSON document. */
export interface CityJSONLoadResult {
  objects: ParsedCityObject[];
  summary: CityJSONSummary;
}

/** Semantic surface color mapping. */
export type SemanticColorMap = Record<SemanticSurfaceType | string, [number, number, number]>;

/** Default colors for common semantic surface types. */
export const DEFAULT_SEMANTIC_COLORS: SemanticColorMap = {
  RoofSurface: [0.85, 0.25, 0.22],       // Red-terracotta
  WallSurface: [0.82, 0.78, 0.72],        // Warm stone
  GroundSurface: [0.55, 0.55, 0.50],      // Grey ground
  OuterCeilingSurface: [0.70, 0.60, 0.50],
  OuterFloorSurface: [0.60, 0.60, 0.55],
  ClosureSurface: [0.50, 0.50, 0.55],
  Window: [0.45, 0.65, 0.85],             // Glass blue
  Door: [0.55, 0.35, 0.20],               // Wood brown
  WaterSurface: [0.25, 0.55, 0.80],       // Water blue
  WaterGroundSurface: [0.35, 0.45, 0.55],
};

/** Progress callback for loading. */
export type CityJSONProgressCallback = (phase: string, done: number, total: number) => void;
