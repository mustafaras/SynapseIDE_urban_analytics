/**
 * Urban Morphology Calculators
 *
 * Pure functions for computing urban form and fabric indicators.
 * All functions return IndicatorResult with value, unit, and interpretation metadata.
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
/*  Floor Area Ratio (FAR / FSI)                                       */
/* ------------------------------------------------------------------ */

export interface FARInput {
  totalFloorArea_m2: number;
  lotArea_m2: number;
}

/**
 * Floor Area Ratio — total gross floor area divided by lot area.
 *
 * **Formula:** `FAR = Σ(floor_area) / lot_area`
 *
 * Bands: <0.5 low, 0.5–1.5 medium, 1.5–3.0 high, >3.0 very high.
 *
 * @reference Berghauser Pont, M. & Haupt, P. (2010). *Spacematrix*. NAi Publishers.
 */
export function floorAreaRatio(input: FARInput): IndicatorResult {
  if (input.lotArea_m2 <= 0) return result('FAR', 0, 'ratio', { error: 'lotArea must be > 0' });
  const far = input.totalFloorArea_m2 / input.lotArea_m2;
  const band =
    far < 0.5 ? 'low' : far < 1.5 ? 'medium' : far < 3.0 ? 'high' : 'very_high';
  return result('FAR', Math.round(far * 1000) / 1000, 'ratio', { band });
}

/* ------------------------------------------------------------------ */
/*  Ground Space Index (GSI / BCR)                                     */
/* ------------------------------------------------------------------ */

export interface GSIInput {
  footprintArea_m2: number;
  lotArea_m2: number;
}

/**
 * Ground Space Index — ratio of building footprint area to lot area.
 *
 * **Formula:** `GSI = footprint_area / lot_area`
 *
 * Range: 0–1. Higher values indicate greater ground coverage.
 *
 * @reference Berghauser Pont, M. & Haupt, P. (2010). *Spacematrix*. NAi Publishers.
 */
export function groundSpaceIndex(input: GSIInput): IndicatorResult {
  if (input.lotArea_m2 <= 0) return result('GSI', 0, 'ratio', { error: 'lotArea must be > 0' });
  const gsi = input.footprintArea_m2 / input.lotArea_m2;
  const clamped = Math.max(0, Math.min(1, gsi));
  return result('GSI', Math.round(clamped * 1000) / 1000, 'ratio', {
    band: clamped < 0.15 ? 'low' : clamped < 0.4 ? 'medium' : 'high',
  });
}

/* ------------------------------------------------------------------ */
/*  Open Space Ratio (OSR)                                             */
/* ------------------------------------------------------------------ */

export interface OSRInput {
  lotArea_m2: number;
  footprintArea_m2: number;
  totalFloorArea_m2: number;
}

/**
 * Open Space Ratio — non-built ground area per unit of floor area.
 *
 * **Formula:** `OSR = (lot_area - footprint_area) / total_floor_area`
 *
 * Higher values indicate more open space intensity relative to development.
 *
 * @reference Berghauser Pont, M. & Haupt, P. (2010). *Spacematrix*. NAi Publishers.
 */
export function openSpaceRatio(input: OSRInput): IndicatorResult {
  if (input.totalFloorArea_m2 <= 0)
    return result('OSR', 0, 'ratio', { error: 'totalFloorArea must be > 0' });
  const openGround = Math.max(0, input.lotArea_m2 - input.footprintArea_m2);
  const osr = openGround / input.totalFloorArea_m2;
  return result('OSR', Math.round(osr * 1000) / 1000, 'ratio', {
    band: osr < 0.5 ? 'compact' : osr < 2 ? 'moderate' : 'open',
  });
}

/* ------------------------------------------------------------------ */
/*  Mixed-Use Index (Shannon Entropy)                                  */
/* ------------------------------------------------------------------ */

export interface MixedUseInput {
  /** Array of land-use area proportions. Must sum to ~1.0. */
  proportions: number[];
}

/**
 * Mixed-Use Index via Shannon Entropy, normalised to [0, 1].
 *
 * **Formula:** `H = -Σ(pᵢ × ln(pᵢ)) / ln(k)` where k = number of classes.
 *
 * 0 = single use, 1 = perfectly mixed across all classes.
 *
 * @reference Shannon, C.E. (1948). A Mathematical Theory of Communication.
 */
export function mixedUseIndex(input: MixedUseInput): IndicatorResult {
  const { proportions } = input;
  if (proportions.length === 0) return result('MXI', 0, 'index [0-1]', { error: 'empty proportions' });
  if (proportions.length === 1) return result('MXI', 0, 'index [0-1]', { band: 'single_use' });

  const k = proportions.length;
  let H = 0;
  for (const p of proportions) {
    if (p > 0) H -= p * Math.log(p);
  }
  const Hmax = Math.log(k);
  const Hnorm = Hmax > 0 ? H / Hmax : 0;
  const clamped = Math.max(0, Math.min(1, Hnorm));
  return result('MXI', Math.round(clamped * 1000) / 1000, 'index [0-1]', {
    band: clamped < 0.3 ? 'low_diversity' : clamped < 0.6 ? 'moderate_diversity' : 'high_diversity',
    rawEntropy: Math.round(H * 1000) / 1000,
    numClasses: k,
  });
}

/* ------------------------------------------------------------------ */
/*  Street Connectivity (Alpha, Beta, Gamma)                           */
/* ------------------------------------------------------------------ */

export interface StreetConnectivityInput {
  /** Number of nodes (intersections + dead-ends). */
  nodes: number;
  /** Number of edges (street segments). */
  edges: number;
  /** Number of connected sub-graphs (typically 1 for a connected network). */
  components?: number;
}

/**
 * Street connectivity graph-theoretic indices.
 *
 * **Alpha** (circuitness): `α = (e - n + p) / (2n - 5p)` — fraction of maximum
 * possible circuits. Range 0–1.
 *
 * **Beta** (complexity): `β = e / n` — avg edges per node. >1 indicates circuits.
 *
 * **Gamma** (connectivity): `γ = e / (3(n - 2p))` — fraction of max possible
 * edges in a planar graph. Range 0–1.
 *
 * @reference Kansky, K.J. (1963). *Structure of Transportation Networks*. University of Chicago.
 */
export function streetConnectivity(input: StreetConnectivityInput): {
  alpha: IndicatorResult;
  beta: IndicatorResult;
  gamma: IndicatorResult;
} {
  const { nodes: n, edges: e, components: p = 1 } = input;

  // Alpha
  const alphaDenom = 2 * n - 5 * p;
  const alphaVal = alphaDenom > 0 ? (e - n + p) / alphaDenom : 0;
  const alpha = result(
    'street_connectivity_alpha',
    Math.round(Math.max(0, Math.min(1, alphaVal)) * 1000) / 1000,
    'ratio [0-1]',
    { band: alphaVal < 0.25 ? 'tree-like' : alphaVal < 0.5 ? 'moderate' : 'highly_connected' },
  );

  // Beta
  const betaVal = n > 0 ? e / n : 0;
  const beta = result(
    'street_connectivity_beta',
    Math.round(betaVal * 1000) / 1000,
    'ratio',
    { band: betaVal < 1 ? 'simple' : betaVal < 1.5 ? 'moderate' : 'complex' },
  );

  // Gamma
  const gammaDenom = 3 * (n - 2 * p);
  const gammaVal = gammaDenom > 0 ? e / gammaDenom : 0;
  const gamma = result(
    'street_connectivity_gamma',
    Math.round(Math.max(0, Math.min(1, gammaVal)) * 1000) / 1000,
    'ratio [0-1]',
    { band: gammaVal < 0.33 ? 'sparse' : gammaVal < 0.67 ? 'moderate' : 'dense' },
  );

  return { alpha, beta, gamma };
}
