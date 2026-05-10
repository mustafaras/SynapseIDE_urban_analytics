/**
 * Resilience Calculators
 *
 * Pure functions for computing vulnerability, exposure, and adaptive capacity indicators.
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
/*  Social Vulnerability Index (SoVI)                                  */
/* ------------------------------------------------------------------ */

export interface SoVIInput {
  /** Percentage of population over 65 (0–100). */
  elderlyPct: number;
  /** Percentage of population under 5 (0–100). */
  youngChildrenPct: number;
  /** Percentage of population below poverty line (0–100). */
  povertyPct: number;
  /** Percentage of population that is non-native language speakers (0–100). */
  linguisticIsolationPct: number;
  /** Percentage of renters (0–100). */
  renterPct: number;
  /** Percentage of population with disabilities (0–100). */
  disabilityPct: number;
  /** Percentage of population with no high-school diploma (0–100). */
  noHighSchoolPct: number;
}

/**
 * Social Vulnerability Index — composite measure of community susceptibility
 * to harm from external stresses (natural disasters, health crises).
 *
 * Simplified version of Cutter et al.'s SoVI method. Each dimension normalised
 * to 0–1 and equally weighted, producing a 0–100 composite.
 *
 * @reference Cutter, S.L., Boruff, B.J. & Shirley, W.L. (2003). Social Vulnerability
 * to Environmental Hazards. Social Science Quarterly 84(2).
 */
export function socialVulnerabilityIndex(input: SoVIInput): IndicatorResult {
  const norm = (v: number) => Math.max(0, Math.min(v / 100, 1));

  const factors = [
    norm(input.elderlyPct),
    norm(input.youngChildrenPct),
    norm(input.povertyPct),
    norm(input.linguisticIsolationPct),
    norm(input.renterPct),
    norm(input.disabilityPct),
    norm(input.noHighSchoolPct),
  ];

  const avg = factors.reduce((a, b) => a + b, 0) / factors.length;
  const score = Math.round(Math.max(0, Math.min(100, avg * 100)));

  const band = score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very_high';
  return result('social_vulnerability_index', score, 'index [0-100]', { band, dimensions: factors.length });
}

/* ------------------------------------------------------------------ */
/*  Flood Exposure                                                     */
/* ------------------------------------------------------------------ */

export interface FloodExposureInput {
  /** Total study area in km². */
  totalAreaKm2: number;
  /** Area within 100-year floodplain in km². */
  floodplainAreaKm2: number;
  /** Population residing in floodplain. */
  exposedPopulation: number;
  /** Total population of study area. */
  totalPopulation: number;
  /** Value of assets in floodplain (monetary units). */
  exposedAssetValue: number;
  /** Total asset value in study area (monetary units). */
  totalAssetValue: number;
}

/**
 * Flood Exposure — composite metric measuring land, population, and asset
 * exposure to 100-year floodplain.
 *
 * **Formula:** weighted average of area ratio (0.3), population ratio (0.4),
 * and asset ratio (0.3), scaled to 0–100.
 *
 * @reference UNDRR (2015). Sendai Framework for Disaster Risk Reduction.
 */
export function floodExposure(input: FloodExposureInput): IndicatorResult {
  const safe = (n: number, d: number) => (d > 0 ? Math.min(n / d, 1) : 0);

  const areaRatio = safe(input.floodplainAreaKm2, input.totalAreaKm2);
  const popRatio = safe(input.exposedPopulation, input.totalPopulation);
  const assetRatio = safe(input.exposedAssetValue, input.totalAssetValue);

  const composite = areaRatio * 0.3 + popRatio * 0.4 + assetRatio * 0.3;
  const score = Math.round(Math.max(0, Math.min(100, composite * 100)));

  const band = score < 20 ? 'low' : score < 40 ? 'moderate' : score < 60 ? 'high' : 'very_high';
  return result('flood_exposure', score, 'index [0-100]', {
    band,
    areaRatio: Math.round(areaRatio * 1000) / 1000,
    popRatio: Math.round(popRatio * 1000) / 1000,
    assetRatio: Math.round(assetRatio * 1000) / 1000,
  });
}

/* ------------------------------------------------------------------ */
/*  Adaptive Capacity                                                  */
/* ------------------------------------------------------------------ */

export interface AdaptiveCapacityInput {
  /** Percentage of population with tertiary education (0–100). */
  tertiaryEduPct: number;
  /** Median household income in local currency. */
  medianIncome: number;
  /** Reference income for normalization. */
  referenceIncome: number;
  /** Hospital beds per 10,000 population. */
  hospitalBedsPer10k: number;
  /** Percentage of households with internet access (0–100). */
  internetPct: number;
  /** Social capital index (0–100, from survey data). */
  socialCapitalScore: number;
}

/**
 * Adaptive Capacity Index — measures a community's ability to cope with,
 * adapt to, and recover from hazards.
 *
 * Dimensions: education, economic capacity, healthcare access, connectivity,
 * social capital. Each normalised to 0–1 and equally weighted.
 *
 * @reference Adger, W.N. (2003). Social capital, collective action, and adaptation
 * to climate change. Economic Geography 79(4).
 */
export function adaptiveCapacity(input: AdaptiveCapacityInput): IndicatorResult {
  const norm = (v: number, max: number = 100) => Math.max(0, Math.min(v / max, 1));

  const education = norm(input.tertiaryEduPct);
  const income = input.referenceIncome > 0 ? Math.min(input.medianIncome / input.referenceIncome, 1) : 0;
  const healthcare = norm(input.hospitalBedsPer10k, 50); // 50 beds/10k as ceiling
  const connectivity = norm(input.internetPct);
  const socialCapital = norm(input.socialCapitalScore);

  const avg = (education + income + healthcare + connectivity + socialCapital) / 5;
  const score = Math.round(Math.max(0, Math.min(100, avg * 100)));

  const band = score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very_high';
  return result('adaptive_capacity' as IndicatorResult['kind'], score, 'index [0-100]', { band });
}

/* ------------------------------------------------------------------ */
/*  Compound Risk Index                                                */
/* ------------------------------------------------------------------ */

export interface CompoundRiskInput {
  /** Hazard exposure score (0–100). */
  hazardScore: number;
  /** Social vulnerability score (0–100), e.g. from socialVulnerabilityIndex. */
  vulnerabilityScore: number;
  /** Adaptive capacity score (0–100), e.g. from adaptiveCapacity. */
  adaptiveCapacityScore: number;
  /** Optional weights, default [0.40, 0.35, 0.25]. */
  weights?: [number, number, number];
}

/**
 * Compound Risk Index — combines hazard exposure, vulnerability, and
 * (inverse) adaptive capacity into a single metric.
 *
 * **Formula:** `Risk = w₁×Hazard + w₂×Vulnerability + w₃×(100 – AdaptiveCapacity)`
 *
 * @reference IPCC (2014). Climate Change 2014: Impacts, Adaptation, and
 * Vulnerability. Part A: Global and Sectoral Aspects.
 */
export function compoundRiskIndex(input: CompoundRiskInput): IndicatorResult {
  const [w1, w2, w3] = input.weights ?? [0.40, 0.35, 0.25];

  const hazard = Math.max(0, Math.min(100, input.hazardScore));
  const vuln = Math.max(0, Math.min(100, input.vulnerabilityScore));
  const lacCapacity = 100 - Math.max(0, Math.min(100, input.adaptiveCapacityScore)); // invert

  const composite = w1 * hazard + w2 * vuln + w3 * lacCapacity;
  const score = Math.round(Math.max(0, Math.min(100, composite)));

  const band = score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very_high';
  return result('compound_risk' as IndicatorResult['kind'], score, 'index [0-100]', {
    band,
    weights: { hazard: w1, vulnerability: w2, lacCapacity: w3 },
  });
}
