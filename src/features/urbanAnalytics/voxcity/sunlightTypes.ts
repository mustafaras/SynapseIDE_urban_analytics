// Sunlight & Solar Exposure Simulation — Type definitions

/** Geographic location for sun position calculations. */
export interface GeoLocation {
  readonly latitude: number;   // degrees, [-90, 90]
  readonly longitude: number;  // degrees, [-180, 180]
}

/** Sun position in the sky dome (horizontal coordinate system). */
export interface SunPosition {
  /** Altitude above horizon in degrees, [-90, 90]. Negative = below horizon. */
  readonly altitude: number;
  /** Azimuth from north, clockwise, in degrees [0, 360). */
  readonly azimuth: number;
  /** UTC timestamp this position corresponds to. */
  readonly timestamp: number;
}

/** Configuration for a sunlight simulation run. */
export interface SunlightConfig {
  /** Geographic location of the study area. */
  readonly location: GeoLocation;
  /** Start date as ISO 8601 string (YYYY-MM-DD). */
  readonly startDate: string;
  /** End date as ISO 8601 string (YYYY-MM-DD). */
  readonly endDate: string;
  /** Start hour of day (0–23, local solar time). */
  readonly startHour: number;
  /** End hour of day (0–23, local solar time). */
  readonly endHour: number;
  /** Interval between samples in minutes. */
  readonly intervalMinutes: number;
  /** UTC offset in hours (e.g. +3 for Istanbul). */
  readonly utcOffset: number;
}

/** A simple 3D axis-aligned bounding box for a building footprint. */
export interface BuildingVolume {
  readonly id: string;
  readonly label: string;
  /** Ground-level bounding box: [minX, minY, maxX, maxY]. */
  readonly bbox: readonly [number, number, number, number];
  /** Building height in metres (above ground). */
  readonly height: number;
}

/** A single shadow sample at a point in time. */
export interface ShadowSample {
  /** Sun position for this sample. */
  readonly sun: SunPosition;
  /**
   * Per-ground-cell shadow count: how many buildings block the sun
   * at this timestamp. Row-major grid indexed by [row * cols + col].
   */
  readonly shadowGrid: Uint8Array;
}

/** Result of a full sunlight simulation run. */
export interface SunlightResult {
  /** Unique identifier for this run. */
  readonly id: string;
  /** Config used for this run. */
  readonly config: SunlightConfig;
  /** Buildings used for shadow casting. */
  readonly buildings: readonly BuildingVolume[];
  /** Analysis grid resolution in metres. */
  readonly gridResolution: number;
  /** Grid dimensions [cols, rows]. */
  readonly gridSize: readonly [number, number];
  /** Grid origin [x, y] in the same coordinate system as buildings. */
  readonly gridOrigin: readonly [number, number];
  /** All shadow samples computed during the simulation. */
  readonly samples: readonly ShadowSample[];
  /**
   * Cumulative shadow hours per ground cell.
   * Length = rows * cols.  Index by [row * cols + col].
   */
  readonly shadowHours: Float32Array;
  /**
   * Solar exposure hours per ground cell (total daylight minus shadow hours).
   * Length = rows * cols.
   */
  readonly exposureHours: Float32Array;
  /** Per-building summary: total shadow-hours the building casts. */
  readonly buildingCastHours: ReadonlyMap<string, number>;
  /** Total number of time samples evaluated. */
  readonly sampleCount: number;
  /** Hours of daylight per day across the simulation period. */
  readonly totalDaylightHours: number;
  /** Min / max / mean solar exposure across the grid. */
  readonly stats: {
    readonly minExposure: number;
    readonly maxExposure: number;
    readonly meanExposure: number;
  };
}

/** Per-building solar exposure summary. */
export interface BuildingExposureSummary {
  readonly buildingId: string;
  readonly label: string;
  /** Average sunlight hours the footprint area receives. */
  readonly avgExposureHours: number;
  /** Minimum sunlight hours within the footprint. */
  readonly minExposureHours: number;
  /** Maximum sunlight hours within the footprint. */
  readonly maxExposureHours: number;
  /** Fraction of footprint cells receiving > 0 sunlight. */
  readonly sunlitFraction: number;
}

/** Simulation status for the UI state machine. */
export type SimulationStatus =
  | "idle"
  | "configuring"
  | "running"
  | "paused"
  | "complete"
  | "error";
