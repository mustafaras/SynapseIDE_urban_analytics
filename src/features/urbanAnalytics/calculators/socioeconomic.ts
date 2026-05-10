/**
 * Socioeconomic Calculators
 *
 * Pure functions for computing inequality, diversity, and displacement indicators.
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
/*  Gini Coefficient                                                   */
/* ------------------------------------------------------------------ */

export interface GiniInput {
  /** Sorted array of non-negative income or wealth values. Need not be pre-sorted. */
  values: number[];
}

/**
 * Gini Coefficient — measure of statistical dispersion for income inequality.
 *
 * **Formula:** `G = (2 × Σᵢ(i × yᵢ)) / (n × Σyᵢ) − (n+1)/n`
 * where yᵢ are sorted values and n is the count.
 *
 * Range: 0 (perfect equality) to 1 (perfect inequality).
 *
 * @reference Gini, C. (1912). Variabilità e mutabilità.
 */
export function giniCoefficient(input: GiniInput): IndicatorResult {
  const vals = [...input.values].sort((a, b) => a - b);
  const n = vals.length;
  if (n === 0) return result('gini_coefficient', 0, 'index [0-1]', { error: 'empty input' });

  const totalSum = vals.reduce((a, b) => a + b, 0);
  if (totalSum === 0) return result('gini_coefficient', 0, 'index [0-1]', { band: 'perfect_equality' });

  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (i + 1) * vals[i];
  }

  const gini = (2 * weightedSum) / (n * totalSum) - (n + 1) / n;
  const clamped = Math.max(0, Math.min(1, gini));
  const rounded = Math.round(clamped * 10000) / 10000;

  const band =
    rounded < 0.25 ? 'low_inequality' : rounded < 0.35 ? 'moderate' : rounded < 0.45 ? 'high' : 'very_high';
  return result('gini_coefficient', rounded, 'index [0-1]', { band, n });
}

/* ------------------------------------------------------------------ */
/*  Shannon Diversity (Entropy) Index                                  */
/* ------------------------------------------------------------------ */

export interface ShannonDiversityInput {
  /** Array of proportions (should sum to ~1). */
  proportions: number[];
}

/**
 * Shannon Diversity Index (entropy) — measures diversity of categorical distribution.
 *
 * **Formula:** `H = -Σ(pᵢ × ln(pᵢ))`, normalised by `ln(k)` to give H' ∈ [0, 1].
 *
 * Application: land-use mix, ethnic diversity, economic sector diversity.
 *
 * @reference Shannon, C.E. (1948). A Mathematical Theory of Communication.
 */
export function shannonDiversity(input: ShannonDiversityInput): IndicatorResult {
  const { proportions } = input;
  if (proportions.length === 0) return result('shannon_entropy', 0, 'index [0-1]', { error: 'empty proportions' });
  if (proportions.length === 1) return result('shannon_entropy', 0, 'index [0-1]', { band: 'zero_diversity' });

  let H = 0;
  for (const p of proportions) {
    if (p > 0) H -= p * Math.log(p);
  }
  const Hmax = Math.log(proportions.length);
  const Hnorm = Hmax > 0 ? H / Hmax : 0;
  const clamped = Math.max(0, Math.min(1, Hnorm));
  const rounded = Math.round(clamped * 10000) / 10000;

  return result('shannon_entropy', rounded, 'index [0-1]', {
    band: rounded < 0.3 ? 'low' : rounded < 0.6 ? 'moderate' : 'high',
    rawH: Math.round(H * 10000) / 10000,
    k: proportions.length,
  });
}

/* ------------------------------------------------------------------ */
/*  Simpson Diversity Index                                            */
/* ------------------------------------------------------------------ */

export interface SimpsonDiversityInput {
  /** Array of proportions (should sum to ~1). */
  proportions: number[];
}

/**
 * Simpson Diversity Index — probability that two randomly chosen individuals
 * belong to different categories.
 *
 * **Formula:** `D = 1 - Σ(pᵢ²)`
 *
 * Range: 0 (no diversity) to 1-(1/k) (maximum diversity with k categories).
 *
 * @reference Simpson, E.H. (1949). Measurement of diversity. Nature 163.
 */
export function simpsonDiversity(input: SimpsonDiversityInput): IndicatorResult {
  const { proportions } = input;
  if (proportions.length === 0) return result('simpson_diversity', 0, 'index [0-1]', { error: 'empty proportions' });

  let sumSq = 0;
  for (const p of proportions) {
    sumSq += p * p;
  }
  const D = 1 - sumSq;
  const clamped = Math.max(0, Math.min(1, D));
  const rounded = Math.round(clamped * 10000) / 10000;

  return result('simpson_diversity', rounded, 'index [0-1]', {
    band: rounded < 0.3 ? 'low' : rounded < 0.6 ? 'moderate' : 'high',
    k: proportions.length,
  });
}

/* ------------------------------------------------------------------ */
/*  Jobs–Housing Balance                                               */
/* ------------------------------------------------------------------ */

export interface JobsHousingInput {
  /** Number of jobs within the study area. */
  jobs: number;
  /** Number of housing units within the study area. */
  housingUnits: number;
}

/**
 * Jobs–Housing Balance — ratio of employment to residential capacity.
 *
 * **Formula:** `JHB = jobs / housing_units`
 *
 * Ideal range: 0.8–1.2. <0.8 = bedroom community, >1.2 = employment center.
 *
 * @reference Cervero, R. (1989). Jobs-housing balancing and regional mobility.
 */
export function jobsHousingBalance(input: JobsHousingInput): IndicatorResult {
  if (input.housingUnits <= 0) return result('jobs_housing_balance', 0, 'ratio', { error: 'housingUnits must be > 0' });
  const ratio = input.jobs / input.housingUnits;
  const rounded = Math.round(ratio * 1000) / 1000;
  const band =
    rounded < 0.5 ? 'bedroom_community' : rounded < 0.8 ? 'residential_dominant' : rounded <= 1.2 ? 'balanced' : rounded <= 2.0 ? 'employment_dominant' : 'employment_center';
  return result('jobs_housing_balance', rounded, 'ratio', { band, idealRange: '0.8–1.2' });
}

/* ------------------------------------------------------------------ */
/*  Displacement Risk Index (UC Berkeley method)                       */
/* ------------------------------------------------------------------ */

export interface DisplacementRiskInput {
  /** Percentage of renters in neighbourhood (0–100). */
  renterPct: number;
  /** Percentage of low-income households (0–100). */
  lowIncomePct: number;
  /** Recent rent change (%, positive = increase). */
  rentChangePct: number;
  /** Percentage of non-white population (0–100). */
  nonWhitePct: number;
  /** Proximity to transit in meters (lower → higher risk of gentrification). */
  transitProximityM: number;
  /** Recent development intensity (permits per km² per year). */
  devIntensity: number;
}

/**
 * Displacement Risk Index — simplified version of UC Berkeley Urban
 * Displacement Project methodology.
 *
 * Composite weighted score capturing gentrification and displacement pressures.
 * Higher score (0–100) = higher displacement risk.
 *
 * @reference Chapple, K. & Zuk, M. (2016). Forewarned: The Use of Neighborhood
 * Early Warning Systems for Gentrification and Displacement.
 */
export function displacementRisk(input: DisplacementRiskInput): IndicatorResult {
  // Normalize each factor to 0–1 then weight
  const renterScore = Math.min(input.renterPct / 100, 1);
  const incomeScore = Math.min(input.lowIncomePct / 100, 1);
  const rentPressure = Math.min(Math.max(input.rentChangePct, 0) / 30, 1); // 30% cap
  const diversityScore = Math.min(input.nonWhitePct / 100, 1);
  const transitScore = input.transitProximityM <= 0 ? 1 : Math.max(0, 1 - input.transitProximityM / 1500);
  const devScore = Math.min(input.devIntensity / 50, 1); // 50 permits/km²/yr cap

  const weighted =
    renterScore * 0.20 +
    incomeScore * 0.25 +
    rentPressure * 0.20 +
    diversityScore * 0.10 +
    transitScore * 0.10 +
    devScore * 0.15;

  const score = Math.round(Math.max(0, Math.min(100, weighted * 100)));

  const band =
    score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very_high';
  return result('displacement_risk', score, 'index [0-100]', { band });
}
