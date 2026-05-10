/**
 * SDG 11 — Sustainable Cities & Communities Calculators
 *
 * UN Sustainable Development Goal 11 tier-1 and tier-2 indicators.
 * All seven sub-indicators (11.1.1→11.7.1).
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
/*  SDG 11.1.1  Adequate Housing                                       */
/* ------------------------------------------------------------------ */

export interface SDG_11_1_1_Input {
  /** Population living in slums, informal settlements, or inadequate housing. */
  inadequateHousingPop: number;
  /** Total urban population. */
  totalUrbanPop: number;
}

/**
 * SDG 11.1.1 — Proportion of urban population living in slums,
 * informal settlements, or inadequate housing.
 *
 * **Formula:** `(inadequate_pop / total_urban_pop) × 100`
 *
 * @reference UN-Habitat SDG Indicator 11.1.1 Metadata (2023).
 */
export function sdg11_1_1(input: SDG_11_1_1_Input): IndicatorResult {
  if (input.totalUrbanPop <= 0) return result('sdg_11_1_1', 0, '%', { error: 'totalUrbanPop must be > 0' });
  const pct = (input.inadequateHousingPop / input.totalUrbanPop) * 100;
  const rounded = Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
  const band = rounded < 10 ? 'good' : rounded < 30 ? 'moderate' : rounded < 50 ? 'poor' : 'critical';
  return result('sdg_11_1_1', rounded, '%', { band });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.2.1  Convenient Public Transport Access                     */
/* ------------------------------------------------------------------ */

export interface SDG_11_2_1_Input {
  /** Population within 500m of a public-transport stop with ≥20-min frequency. */
  popWithAccess: number;
  /** Total urban population. */
  totalUrbanPop: number;
}

/**
 * SDG 11.2.1 — Proportion of population with convenient access to
 * public transport (within 500 m of a stop with ≥20 min peak service).
 *
 * **Formula:** `(pop_with_access / total_urban_pop) × 100`
 *
 * @reference UN-Habitat (2020). SDG Indicator 11.2.1 Metadata.
 */
export function sdg11_2_1(input: SDG_11_2_1_Input): IndicatorResult {
  if (input.totalUrbanPop <= 0) return result('sdg_11_2_1', 0, '%', { error: 'totalUrbanPop must be > 0' });
  const pct = (input.popWithAccess / input.totalUrbanPop) * 100;
  const rounded = Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
  const band = rounded >= 80 ? 'good' : rounded >= 50 ? 'moderate' : rounded >= 25 ? 'poor' : 'critical';
  return result('sdg_11_2_1', rounded, '%', { band });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.3.1  Land Consumption Rate vs. Population Growth Rate       */
/* ------------------------------------------------------------------ */

export interface SDG_11_3_1_Input {
  /** Urban built-up area at start of period (km²). */
  builtUpAreaT0: number;
  /** Urban built-up area at end of period (km²). */
  builtUpAreaT1: number;
  /** Population at start of period. */
  popT0: number;
  /** Population at end of period. */
  popT1: number;
  /** Period duration in years. */
  years: number;
}

/**
 * SDG 11.3.1 — Ratio of land-consumption rate to population-growth rate (LCRPGR).
 *
 * **Formula:**
 * - `LCR = ln(builtUpT1 / builtUpT0) / years`
 * - `PGR = ln(popT1 / popT0) / years`
 * - `LCRPGR = LCR / PGR`
 *
 * Ratio > 1 = sprawling growth. Ratio ≤ 1 = compact growth.
 *
 * @reference UN-Habitat (2020). SDG Indicator 11.3.1 Metadata.
 */
export function sdg11_3_1(input: SDG_11_3_1_Input): IndicatorResult {
  const { builtUpAreaT0, builtUpAreaT1, popT0, popT1, years } = input;
  if (builtUpAreaT0 <= 0 || popT0 <= 0 || years <= 0) {
    return result('sdg_11_3_1', 0, 'ratio', { error: 'invalid base values' });
  }

  const lcr = Math.log(builtUpAreaT1 / builtUpAreaT0) / years;
  const pgr = Math.log(popT1 / popT0) / years;

  if (Math.abs(pgr) < 1e-10) {
    return result('sdg_11_3_1', lcr === 0 ? 1 : Infinity, 'ratio', {
      band: 'population_stable',
      lcr: Math.round(lcr * 10000) / 10000,
      pgr: 0,
    });
  }

  const ratio = lcr / pgr;
  const rounded = Math.round(ratio * 1000) / 1000;

  const band = rounded <= 0 ? 'shrinking' : rounded <= 1 ? 'compact' : rounded <= 2 ? 'moderate_sprawl' : 'high_sprawl';
  return result('sdg_11_3_1', rounded, 'ratio', { band, lcr: Math.round(lcr * 10000) / 10000, pgr: Math.round(pgr * 10000) / 10000 });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.5.1  Disaster Deaths & Affected Persons                     */
/* ------------------------------------------------------------------ */

export interface SDG_11_5_1_Input {
  /** Number of deaths attributed to disasters in reporting period. */
  deaths: number;
  /** Number of persons directly affected (displaced, injured, ill). */
  affected: number;
  /** Total population. */
  totalPopulation: number;
}

/**
 * SDG 11.5.1 — Deaths and directly-affected persons per 100,000 population
 * attributed to disasters.
 *
 * **Formula:** `((deaths + affected) / total_pop) × 100,000`
 *
 * @reference UNDRR (2020). Sendai Framework Monitor, SDG Indicator 11.5.1.
 */
export function sdg11_5_1(input: SDG_11_5_1_Input): IndicatorResult {
  if (input.totalPopulation <= 0) return result('sdg_11_5_1', 0, 'per 100k', { error: 'totalPopulation must be > 0' });
  const rate = ((input.deaths + input.affected) / input.totalPopulation) * 100_000;
  const rounded = Math.round(rate * 100) / 100;

  const band = rounded < 1 ? 'good' : rounded < 10 ? 'moderate' : rounded < 100 ? 'poor' : 'critical';
  return result('sdg_11_5_1', rounded, 'per 100k', { band, deaths: input.deaths, affected: input.affected });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.6.1  Municipal Solid Waste Collection                       */
/* ------------------------------------------------------------------ */

export interface SDG_11_6_1_Input {
  /** Solid waste regularly collected (tonnes/year). */
  wasteCollected: number;
  /** Total solid waste generated (tonnes/year). */
  wasteGenerated: number;
}

/**
 * SDG 11.6.1 — Proportion of municipal solid waste regularly collected
 * and properly discharged.
 *
 * **Formula:** `(waste_collected / waste_generated) × 100`
 *
 * @reference UN Statistics Division (2021). SDG Indicator 11.6.1 Metadata.
 */
export function sdg11_6_1(input: SDG_11_6_1_Input): IndicatorResult {
  if (input.wasteGenerated <= 0) return result('sdg_11_6_1', 0, '%', { error: 'wasteGenerated must be > 0' });
  const pct = (input.wasteCollected / input.wasteGenerated) * 100;
  const rounded = Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
  const band = rounded >= 90 ? 'good' : rounded >= 70 ? 'moderate' : rounded >= 50 ? 'poor' : 'critical';
  return result('sdg_11_6_1', rounded, '%', { band });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.6.2  Annual Mean Fine Particulate Matter (PM₂.₅)            */
/* ------------------------------------------------------------------ */

export interface SDG_11_6_2_Input {
  /** Annual mean PM₂.₅ concentration in µg/m³. */
  pm25Annual: number;
}

/**
 * SDG 11.6.2 — Annual mean levels of fine particulate matter (PM₂.₅)
 * in cities (population-weighted).
 *
 * WHO guideline: ≤5 µg/m³ annual mean.
 *
 * @reference WHO (2021). WHO Global Air Quality Guidelines.
 */
export function sdg11_6_2(input: SDG_11_6_2_Input): IndicatorResult {
  const val = Math.max(0, input.pm25Annual);
  const rounded = Math.round(val * 10) / 10;
  const band =
    rounded <= 5 ? 'who_guideline' : rounded <= 10 ? 'interim_4' : rounded <= 15 ? 'interim_3' : rounded <= 25 ? 'interim_2' : rounded <= 35 ? 'interim_1' : 'hazardous';
  return result('sdg_11_6_2', rounded, 'µg/m³', { band, whoGuideline: 5 });
}

/* ------------------------------------------------------------------ */
/*  SDG 11.7.1  Public Open Space                                      */
/* ------------------------------------------------------------------ */

export interface SDG_11_7_1_Input {
  /** Total area of public open spaces in km². */
  openSpaceArea: number;
  /** Total built-up area of the city in km². */
  builtUpArea: number;
}

/**
 * SDG 11.7.1 — Average share of the built-up area of cities that is
 * open space for public use for all.
 *
 * **Formula:** `(open_space_area / built_up_area) × 100`
 *
 * @reference UN-Habitat (2020). SDG Indicator 11.7.1 Metadata.
 */
export function sdg11_7_1(input: SDG_11_7_1_Input): IndicatorResult {
  if (input.builtUpArea <= 0) return result('sdg_11_7_1', 0, '%', { error: 'builtUpArea must be > 0' });
  const pct = (input.openSpaceArea / input.builtUpArea) * 100;
  const rounded = Math.round(Math.max(0, Math.min(100, pct)) * 100) / 100;
  const band = rounded >= 40 ? 'excellent' : rounded >= 25 ? 'good' : rounded >= 15 ? 'moderate' : 'poor';
  return result('sdg_11_7_1', rounded, '%', { band });
}
