/**
 * Environmental Calculators
 *
 * Pure functions for computing environmental and ecological indicators.
 * Includes spectral indices, urban heat, green infrastructure metrics.
 */

import type { IndicatorResult } from '../lib/types';

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function result(
  kind: IndicatorResult['kind'],
  value: number,
  unit: string,
  meta?: Record<string, unknown>,
): IndicatorResult {
  return {
    id: `${kind}_${Date.now()}`,
    kind,
    when: new Date().toISOString(),
    value,
    unit,
    ...(meta ? { metadata: meta } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  NDVI (Normalised Difference Vegetation Index)                      */
/* ------------------------------------------------------------------ */

export interface NDVIInput {
  /** Near-infrared band reflectance value (e.g. Sentinel-2 B8). */
  nir: number;
  /** Red band reflectance value (e.g. Sentinel-2 B4). */
  red: number;
}

/**
 * NDVI — Normalised Difference Vegetation Index.
 *
 * **Formula:** `NDVI = (NIR - RED) / (NIR + RED)`
 *
 * Range: −1 to +1. Typical urban: 0.1–0.3, dense vegetation: 0.6–0.9,
 * water/bare soil: <0.1.
 *
 * @reference Rouse, J.W. et al. (1973). Monitoring vegetation systems.
 */
export function ndvi(input: NDVIInput): IndicatorResult {
  const denom = input.nir + input.red;
  if (denom === 0) return result('NDVI', 0, 'index [-1,1]', { error: 'NIR + RED = 0' });
  const val = (input.nir - input.red) / denom;
  const clamped = Math.max(-1, Math.min(1, val));
  const rounded = Math.round(clamped * 10000) / 10000;
  const band =
    rounded < 0 ? 'water_or_cloud' : rounded < 0.1 ? 'bare_soil' : rounded < 0.3 ? 'sparse_vegetation' : rounded < 0.6 ? 'moderate_vegetation' : 'dense_vegetation';
  return result('NDVI', rounded, 'index [-1,1]', { band });
}

/* ------------------------------------------------------------------ */
/*  Urban Heat Island Intensity                                        */
/* ------------------------------------------------------------------ */

export interface UHIInput {
  /** Land surface temperature of the urban area (°C or K). */
  lstUrban: number;
  /** Land surface temperature of the surrounding rural reference area (°C or K). */
  lstRural: number;
}

/**
 * Urban Heat Island Intensity — difference between urban and rural LST.
 *
 * **Formula:** `UHI = LST_urban - LST_rural`
 *
 * Positive values indicate urban overheating.
 *
 * @reference Oke, T.R. (1982). The energetic basis of the urban heat island.
 */
export function urbanHeatIslandIntensity(input: UHIInput): IndicatorResult {
  const uhi = input.lstUrban - input.lstRural;
  const rounded = Math.round(uhi * 100) / 100;
  const band =
    rounded <= 0 ? 'cool_island' : rounded < 2 ? 'mild' : rounded < 4 ? 'moderate' : rounded < 6 ? 'strong' : 'extreme';
  return result('UHI_intensity', rounded, '°C (or K)', { band });
}

/* ------------------------------------------------------------------ */
/*  Green Space Per Capita                                             */
/* ------------------------------------------------------------------ */

export interface GreenSpacePerCapitaInput {
  /** Total green space area in square meters. */
  greenArea_m2: number;
  /** Population served by the green space. */
  population: number;
}

/**
 * Green Space Per Capita — area of green/open space per person.
 *
 * **Formula:** `GSPC = green_area / population`
 *
 * WHO recommends minimum 9 m²/person.
 *
 * @reference WHO (2016). Urban Green Spaces and Health — A Review of Evidence.
 */
export function greenSpacePerCapita(input: GreenSpacePerCapitaInput): IndicatorResult {
  if (input.population <= 0) return result('green_space_per_capita', 0, 'm²/person', { error: 'population must be > 0' });
  const gspc = input.greenArea_m2 / input.population;
  const rounded = Math.round(gspc * 100) / 100;
  const band =
    rounded < 5 ? 'critically_low' : rounded < 9 ? 'below_who' : rounded < 20 ? 'adequate' : 'generous';
  return result('green_space_per_capita', rounded, 'm²/person', { band, whoMinimum: 9 });
}

/* ------------------------------------------------------------------ */
/*  Tree Canopy Coverage                                               */
/* ------------------------------------------------------------------ */

export interface TreeCanopyInput {
  /** Total area under tree canopy in square meters. */
  canopyArea_m2: number;
  /** Total study area in square meters. */
  totalArea_m2: number;
}

/**
 * Tree Canopy Coverage — percentage of study area under tree canopy.
 *
 * **Formula:** `TCC = (canopy_area / total_area) × 100`
 *
 * Target: ≥30% (USDA Forest Service guideline).
 *
 * @reference Nowak, D.J. & Greenfield, E.J. (2018). US Urban Forest Statistics.
 */
export function treeCanopyCoverage(input: TreeCanopyInput): IndicatorResult {
  if (input.totalArea_m2 <= 0) return result('tree_canopy_pct', 0, '%', { error: 'totalArea must be > 0' });
  const pct = (input.canopyArea_m2 / input.totalArea_m2) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  const rounded = Math.round(clamped * 100) / 100;
  const band =
    rounded < 10 ? 'very_low' : rounded < 20 ? 'low' : rounded < 30 ? 'moderate' : rounded < 40 ? 'good' : 'excellent';
  return result('tree_canopy_pct', rounded, '%', { band, target: 30 });
}

/* ------------------------------------------------------------------ */
/*  Impervious Surface Percentage                                      */
/* ------------------------------------------------------------------ */

export interface ImperviousSurfaceInput {
  /** Total impervious area (roads, buildings, parking, etc.) in square meters. */
  imperviousArea_m2: number;
  /** Total study area in square meters. */
  totalArea_m2: number;
}

/**
 * Impervious Surface Percentage — fraction of study area covered by
 * non-permeable surfaces.
 *
 * **Formula:** `ISP = (impervious_area / total_area) × 100`
 *
 * >25% triggers stream degradation concerns (Arnold & Gibbons 1996).
 *
 * @reference Arnold, C.L. & Gibbons, C.J. (1996). Impervious surface coverage.
 */
export function imperviousSurface(input: ImperviousSurfaceInput): IndicatorResult {
  if (input.totalArea_m2 <= 0) return result('impervious_pct', 0, '%', { error: 'totalArea must be > 0' });
  const pct = (input.imperviousArea_m2 / input.totalArea_m2) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  const rounded = Math.round(clamped * 100) / 100;
  const band =
    rounded < 10 ? 'low' : rounded < 25 ? 'moderate' : rounded < 50 ? 'high' : 'very_high';
  return result('impervious_pct', rounded, '%', { band, degradationThreshold: 25 });
}
