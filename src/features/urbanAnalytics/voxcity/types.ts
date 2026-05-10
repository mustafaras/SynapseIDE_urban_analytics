// VoxCity 3D — Type definitions

/** Environmental simulation types supported by VoxCity. */
export type SimulationType =
  | "solar_radiation"
  | "wind_speed"
  | "wind_comfort"
  | "noise_level"
  | "thermal_comfort_utci"
  | "sky_view_factor"
  | "daylight_factor"
  | "shadow_hours";

/** Material classification for voxels. */
export interface VoxelMaterial {
  readonly id: number;
  readonly name: string;
  readonly category: "building" | "ground" | "vegetation" | "water" | "air" | "custom";
  /** Hex color string e.g. "#B0B0B0". */
  readonly color: string;
  /** Default opacity 0–1. */
  readonly opacity: number;
}

/** A single voxel in a grid. */
export interface Voxel {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly materialId: number;
}

/** Resolved bounding-box of a grid. */
export interface GridBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/** A complete voxel grid loaded from VoxCity data. */
export interface VoxelGrid {
  /** Unique identifier for this grid. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Resolution along each axis in metres. */
  readonly resolution: number;
  /** Flat array of voxels (sorted x→y→z). */
  readonly voxels: readonly Voxel[];
  /** Material palette used by this grid. */
  readonly materials: readonly VoxelMaterial[];
  /** Axis-aligned bounding box. */
  readonly bounds: GridBounds;
  /** Total voxel count. */
  readonly count: number;
}

/** Scalar simulation result mapped onto a voxel grid. */
export interface SimulationResult {
  readonly id: string;
  readonly gridId: string;
  readonly type: SimulationType;
  readonly label: string;
  readonly unit: string;
  /** Per-voxel scalar values, same length as the source grid. */
  readonly values: Float32Array;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
}

/** Slice plane for clipping voxels. */
export interface SlicePlane {
  readonly axis: "x" | "y" | "z";
  readonly position: number;
  readonly enabled: boolean;
}

/** Camera preset for the 3D scene. */
export interface CameraPreset {
  readonly name: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

/** Per-material visibility & opacity state. */
export interface MaterialVisibility {
  readonly visible: boolean;
  readonly opacity: number;
}

/** Color ramp name for simulation overlays. */
export type ColorRampName =
  | "viridis"
  | "plasma"
  | "inferno"
  | "magma"
  | "RdYlBu"
  | "RdYlGn"
  | "Spectral"
  | "coolwarm";
