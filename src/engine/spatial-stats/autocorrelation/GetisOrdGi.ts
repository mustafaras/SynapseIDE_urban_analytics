/**
 * GetisOrdGi — Getis-Ord Gi* Hot Spot Analysis.
 *
 * Implements the Gi* statistic (Getis & Ord, 1992; Ord & Getis, 1995)
 * for identifying statistically significant spatial clusters of high
 * values (hot spots) and low values (cold spots).
 *
 * For each observation i the Gi* statistic is:
 *
 *           Σ_j w_ij x_j − x̄ Σ_j w_ij
 *   Gi* = ──────────────────────────────────────────
 *          S √[ (n Σ_j w_ij² − (Σ_j w_ij)²) / (n−1) ]
 *
 * where:
 *   x̄ = (1/n) Σ_j x_j          (global mean, includes i)
 *   S = √[ (1/n) Σ_j x_j² − x̄² ]   (global std dev)
 *
 * The Gi* variant (star) includes the self-weight w_ii in the
 * summation, making it a proper hot-spot detector that accounts for
 * the observation itself.
 *
 * Under the null hypothesis of no spatial clustering, Gi* is
 * approximately standard normal for moderate-to-large n, so z-scores
 * map directly to two-tailed p-values via the normal CDF.
 *
 * Confidence categories follow standard thresholds:
 *   |z| ≥ 2.576  →  99% confidence
 *   |z| ≥ 1.960  →  95% confidence
 *   |z| ≥ 1.645  →  90% confidence
 *   else          →  not significant
 *
 * References:
 *   Getis, A. & Ord, J.K. (1992) "The analysis of spatial association
 *     by use of distance statistics." Geographical Analysis 24(3): 189–206.
 *   Ord, J.K. & Getis, A. (1995) "Local spatial autocorrelation
 *     statistics." Geographical Analysis 27(4): 286–306.
 */

import type {
  GiStarResult,
  HotSpotConfidence,
  SpatialWeightsMatrix,
} from '../types';

// ─── Constants ──────────────────────────────────────────────────────────────

/** z-score thresholds for confidence categories (two-tailed). */
const Z_99 = 2.5758293035489004; // invNorm(0.995)
const Z_95 = 1.959963984540054;  // invNorm(0.975)
const Z_90 = 1.6448536269514729; // invNorm(0.95)

// ─── Public types ───────────────────────────────────────────────────────────

/** Options for the Gi* computation. */
export interface GiStarOptions {
  /** Include self-weight w_ii = 1 (Gi* variant). Default true. */
  selfWeight?: boolean;
}

/** Legend entry for hot/cold spot thematic mapping. */
export interface HotSpotLegendEntry {
  /** Confidence classification code. */
  type: HotSpotConfidence;
  /** Human-readable label. */
  label: string;
  /** Suggested hex colour (red→hot, blue→cold). */
  color: string;
}

/** GeoJSON-ready feature properties for hot spot mapping. */
export interface HotSpotFeatureProperties {
  /** Observation index. */
  index: number;
  /** Original value. */
  value: number;
  /** Gi* statistic value. */
  giStar: number;
  /** z-score (identical to giStar for this statistic). */
  zScore: number;
  /** Two-tailed p-value from z-score. */
  pValue: number;
  /** Confidence classification. */
  confidence: HotSpotConfidence;
}

/** Full hot spot analysis result set. */
export interface HotSpotResult {
  /** Per-observation results conforming to GiStarResult. */
  results: GiStarResult[];
  /** Extended feature properties for GeoJSON mapping. */
  featureProperties: HotSpotFeatureProperties[];
  /** Legend metadata for rendering. */
  legend: HotSpotLegendEntry[];
  /** Summary counts by confidence class. */
  summary: Record<HotSpotConfidence, number>;
  /** Global mean of input values. */
  globalMean: number;
  /** Global standard deviation of input values. */
  globalStd: number;
  /** Number of observations. */
  n: number;
}

// ─── Legend metadata ────────────────────────────────────────────────────────

const HOT_SPOT_LEGEND: HotSpotLegendEntry[] = [
  { type: 'hot-99', label: 'Hot Spot — 99% Confidence', color: '#D7191C' },
  { type: 'hot-95', label: 'Hot Spot — 95% Confidence', color: '#FDAE61' },
  { type: 'hot-90', label: 'Hot Spot — 90% Confidence', color: '#FEE08B' },
  { type: 'not-significant', label: 'Not Significant', color: '#FFFFBF' },
  { type: 'cold-90', label: 'Cold Spot — 90% Confidence', color: '#D1E5F0' },
  { type: 'cold-95', label: 'Cold Spot — 95% Confidence', color: '#91BFDB' },
  { type: 'cold-99', label: 'Cold Spot — 99% Confidence', color: '#2C7BB6' },
];

// ─── Normal distribution utilities ──────────────────────────────────────────

/**
 * Approximate the standard normal CDF Φ(z) using the Abramowitz & Stegun
 * rational approximation (Handbook of Mathematical Functions, formula 26.2.17).
 *
 * Maximum absolute error: 7.5 × 10⁻⁸.
 */
function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Two-tailed p-value from a z-score under the standard normal.
 */
function twoTailedP(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

// ─── Classification ─────────────────────────────────────────────────────────

/**
 * Classify a z-score into a HotSpotConfidence category.
 */
function classify(z: number): HotSpotConfidence {
  const absZ = Math.abs(z);
  if (absZ >= Z_99) return z > 0 ? 'hot-99' : 'cold-99';
  if (absZ >= Z_95) return z > 0 ? 'hot-95' : 'cold-95';
  if (absZ >= Z_90) return z > 0 ? 'hot-90' : 'cold-90';
  return 'not-significant';
}

// ─── Core Gi* computation ───────────────────────────────────────────────────

/**
 * Compute the Getis-Ord Gi* statistic for every observation.
 *
 * @param values - Observed attribute values (length W.n). Must not contain
 *                 NaN; NaN values should be filtered before calling.
 * @param W      - Spatial weights matrix (binary or row-standardized).
 * @param options - Configuration (self-weight inclusion).
 * @returns HotSpotResult with full inference output.
 */
export function giStar(
  values: ArrayLike<number>,
  W: SpatialWeightsMatrix,
  options: GiStarOptions = {},
): HotSpotResult {
  const n = W.n;

  if (values.length !== n) {
    throw new RangeError(
      `Values length (${values.length}) must equal the number of observations in W (${n}).`,
    );
  }
  if (n < 3) {
    throw new RangeError('At least 3 observations are required for Gi*.');
  }

  const includeSelf = options.selfWeight !== false; // default true

  const x = values instanceof Float64Array ? values : new Float64Array(values);

  // ── Step 1: Global statistics ─────────────────────────────────────

  let sumX = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumX2 += x[i] * x[i];
  }
  const mean = sumX / n;
  const S2 = sumX2 / n - mean * mean; // population variance
  const S = Math.sqrt(S2);

  // Degenerate: constant field → all z-scores are 0.
  if (S === 0) {
    return buildConstantResult(n, x, mean, S);
  }

  // ── Step 2: Per-observation Gi* ───────────────────────────────────

  const results: GiStarResult[] = [];
  const featureProperties: HotSpotFeatureProperties[] = [];
  const summary: Record<HotSpotConfidence, number> = {
    'hot-99': 0,
    'hot-95': 0,
    'hot-90': 0,
    'not-significant': 0,
    'cold-90': 0,
    'cold-95': 0,
    'cold-99': 0,
  };

  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);

    // Accumulate weighted sum and weight totals.
    let sumWX = 0;  // Σ_j w_ij x_j
    let sumW = 0;   // Σ_j w_ij
    let sumW2 = 0;  // Σ_j w_ij²

    if (row) {
      for (const [j, wij] of row) {
        sumWX += wij * x[j];
        sumW += wij;
        sumW2 += wij * wij;
      }
    }

    // Include self-weight for Gi* (w_ii = 1).
    if (includeSelf) {
      sumWX += x[i]; // w_ii=1 × x_i
      sumW += 1;
      sumW2 += 1;
    }

    // Gi* z-score:
    //            Σ_j w_ij x_j − x̄ Σ_j w_ij
    //   z_i = ─────────────────────────────────────
    //          S √[ (n Σ_j w_ij² − (Σ_j w_ij)²) / (n−1) ]

    const numerator = sumWX - mean * sumW;
    const denom = S * Math.sqrt((n * sumW2 - sumW * sumW) / (n - 1));

    let zVal: number;
    if (denom === 0) {
      // Island with no self-weight, or degenerate row.
      zVal = 0;
    } else {
      zVal = numerator / denom;
    }

    const pVal = twoTailedP(zVal);
    const conf = classify(zVal);
    summary[conf]++;

    results.push({
      index: i,
      giStar: zVal,
      zScore: zVal,
      pValue: pVal,
      confidence: conf,
    });

    featureProperties.push({
      index: i,
      value: x[i],
      giStar: zVal,
      zScore: zVal,
      pValue: pVal,
      confidence: conf,
    });
  }

  return {
    results,
    featureProperties,
    legend: [...HOT_SPOT_LEGEND],
    summary,
    globalMean: mean,
    globalStd: S,
    n,
  };
}

// ─── Convenience accessors ──────────────────────────────────────────────────

/**
 * Extract a z-score map from a HotSpotResult.
 *
 * Returns a Float64Array of z-scores indexed by observation, suitable
 * for numeric rendering (continuous colour ramp) or further analysis.
 */
export function zScoreMap(result: HotSpotResult): Float64Array {
  const n = result.results.length;
  const map = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    map[i] = result.results[i].zScore;
  }
  return map;
}

/**
 * Extract a confidence classification map from a HotSpotResult.
 *
 * Returns an array of HotSpotConfidence labels indexed by observation,
 * suitable for categorical thematic mapping.
 */
export function confidenceMap(result: HotSpotResult): HotSpotConfidence[] {
  return result.results.map((r) => r.confidence);
}

/**
 * Return the standard hot spot legend metadata.
 */
export function hotSpotLegend(): HotSpotLegendEntry[] {
  return [...HOT_SPOT_LEGEND];
}

// ─── Helper: constant-field result ──────────────────────────────────────────

function buildConstantResult(
  n: number,
  x: Float64Array,
  mean: number,
  S: number,
): HotSpotResult {
  const results: GiStarResult[] = [];
  const featureProperties: HotSpotFeatureProperties[] = [];
  const summary: Record<HotSpotConfidence, number> = {
    'hot-99': 0,
    'hot-95': 0,
    'hot-90': 0,
    'not-significant': n,
    'cold-90': 0,
    'cold-95': 0,
    'cold-99': 0,
  };

  for (let i = 0; i < n; i++) {
    results.push({
      index: i,
      giStar: 0,
      zScore: 0,
      pValue: 1,
      confidence: 'not-significant',
    });
    featureProperties.push({
      index: i,
      value: x[i],
      giStar: 0,
      zScore: 0,
      pValue: 1,
      confidence: 'not-significant',
    });
  }

  return {
    results,
    featureProperties,
    legend: [...HOT_SPOT_LEGEND],
    summary,
    globalMean: mean,
    globalStd: S,
    n,
  };
}
