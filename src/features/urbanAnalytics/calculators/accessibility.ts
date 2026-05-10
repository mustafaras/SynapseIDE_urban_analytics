/**
 * Accessibility Calculators
 *
 * Pure functions for computing accessibility and walkability indicators.
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
/*  Walk Score (9-category distance-decay)                             */
/* ------------------------------------------------------------------ */

export interface WalkScoreInput {
  /** Network distance to nearest grocery store (meters). */
  groceryDist: number;
  /** Network distance to nearest restaurant/café (meters). */
  restaurantDist: number;
  /** Network distance to nearest retail/shopping (meters). */
  shoppingDist: number;
  /** Network distance to nearest coffee shop (meters). */
  coffeeDist: number;
  /** Network distance to nearest bank (meters). */
  bankDist: number;
  /** Network distance to nearest park (meters). */
  parkDist: number;
  /** Network distance to nearest school (meters). */
  schoolDist: number;
  /** Network distance to nearest bookstore/library (meters). */
  bookstoreDist: number;
  /** Network distance to nearest fitness/entertainment (meters). */
  entertainmentDist: number;
}

/**
 * Walk Score — composite walkability index (0–100) using 9 amenity categories
 * and a polynomial distance-decay function.
 *
 * Decay: full score within 400 m, linear decay from 400–1600 m, zero beyond 1600 m.
 *
 * **Bands:** 0–24 Car-Dependent, 25–49 Car-Dependent (some amenities),
 * 50–69 Somewhat Walkable, 70–89 Very Walkable, 90–100 Walker's Paradise.
 *
 * @reference Walk Score methodology, Carr et al. (2010).
 */
export function walkScore(input: WalkScoreInput): IndicatorResult {
  const WEIGHTS: Record<string, number> = {
    groceryDist: 3,
    restaurantDist: 0.75,
    shoppingDist: 1,
    coffeeDist: 1.25,
    bankDist: 1,
    parkDist: 1,
    schoolDist: 1,
    bookstoreDist: 0.5,
    entertainmentDist: 0.5,
  };

  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

  function decay(distM: number): number {
    if (distM <= 400) return 1;
    if (distM >= 1600) return 0;
    return 1 - (distM - 400) / 1200;
  }

  let weighted = 0;
  for (const [key, w] of Object.entries(WEIGHTS)) {
    const dist = (input as unknown as Record<string, number>)[key] ?? 9999;
    weighted += decay(dist) * w;
  }

  const raw = (weighted / totalWeight) * 100;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  const band =
    score < 25
      ? 'car_dependent'
      : score < 50
        ? 'car_dependent_some_amenities'
        : score < 70
          ? 'somewhat_walkable'
          : score < 90
            ? 'very_walkable'
            : 'walkers_paradise';

  return result('walk_score', score, 'score [0-100]', { band });
}

/* ------------------------------------------------------------------ */
/*  Transit Accessibility Score                                        */
/* ------------------------------------------------------------------ */

export interface TransitAccessibilityInput {
  /** Array of transit stops within buffer. Each has frequency (vehicles/hr) and distance (m). */
  stops: Array<{ frequency: number; distanceM: number }>;
  /** Buffer radius in meters (default 500). */
  bufferM?: number;
}

/**
 * Transit Accessibility Score — frequency × proximity aggregation.
 *
 * **Formula:** `TAS = Σ(frequencyᵢ × decay(dᵢ))`, graded A–F.
 *
 * Decay: linear from 1.0 at 0 m to 0.0 at bufferM.
 *
 * @reference Mavoa, S. et al. (2012). GIS-based transit accessibility.
 */
export function transitAccessibility(input: TransitAccessibilityInput): IndicatorResult {
  const buffer = input.bufferM ?? 500;
  if (input.stops.length === 0) return result('transit_score', 0, 'score', { band: 'F' });

  let score = 0;
  for (const s of input.stops) {
    if (s.distanceM >= buffer || s.distanceM < 0) continue;
    const proximityFactor = 1 - s.distanceM / buffer;
    score += s.frequency * proximityFactor;
  }

  const rounded = Math.round(score * 100) / 100;
  const band =
    rounded >= 40 ? 'A' : rounded >= 25 ? 'B' : rounded >= 15 ? 'C' : rounded >= 8 ? 'D' : rounded >= 3 ? 'E' : 'F';

  return result('transit_score', rounded, 'composite score', { band, numStops: input.stops.length });
}

/* ------------------------------------------------------------------ */
/*  Cumulative Opportunities                                           */
/* ------------------------------------------------------------------ */

export interface CumulativeOpportunitiesInput {
  /** Number of POIs within the travel-time threshold. */
  poiCount: number;
  /** Travel-time threshold in minutes. */
  thresholdMinutes: number;
  /** Travel mode description. */
  mode: string;
}

/**
 * Cumulative Opportunities — count of opportunities reachable within a
 * travel-time threshold.
 *
 * Simple but interpretable: more POIs = better accessibility.
 *
 * @reference Geurs, K.T. & van Wee, B. (2004). Accessibility evaluation.
 */
export function cumulativeOpportunities(input: CumulativeOpportunitiesInput): IndicatorResult {
  const count = Math.max(0, Math.round(input.poiCount));
  return result('cumulative_opportunities', count, 'count', {
    thresholdMinutes: input.thresholdMinutes,
    mode: input.mode,
    band: count < 5 ? 'very_low' : count < 20 ? 'low' : count < 50 ? 'moderate' : count < 100 ? 'high' : 'very_high',
  });
}

/* ------------------------------------------------------------------ */
/*  Gravity-Based Accessibility (Hansen 1959)                          */
/* ------------------------------------------------------------------ */

export interface GravityAccessibilityInput {
  /** Array of destinations with opportunity count and travel cost (minutes). */
  destinations: Array<{ opportunities: number; costMinutes: number }>;
  /** Impedance decay coefficient β (default 0.05). */
  beta?: number;
}

/**
 * Gravity-based accessibility — Hansen (1959) model.
 *
 * **Formula:** `Aᵢ = Σ(Oⱼ × exp(-β × cᵢⱼ))`
 *
 * where Oⱼ = opportunities at destination j, cᵢⱼ = travel cost, β = decay.
 *
 * @reference Hansen, W.G. (1959). How Accessibility Shapes Land Use. JAPA 25(2).
 */
export function gravityAccessibility(input: GravityAccessibilityInput): IndicatorResult {
  const beta = input.beta ?? 0.05;
  if (input.destinations.length === 0) return result('gravity_accessibility', 0, 'index', { error: 'no destinations' });

  let A = 0;
  for (const d of input.destinations) {
    A += d.opportunities * Math.exp(-beta * d.costMinutes);
  }

  const rounded = Math.round(A * 100) / 100;
  return result('gravity_accessibility', rounded, 'index', {
    beta,
    numDestinations: input.destinations.length,
  });
}
