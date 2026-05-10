/**
 * GlobalMoransI — Global spatial autocorrelation with permutation inference.
 *
 * Implements Moran's I statistic (Moran, 1950) with analytical moments
 * under the randomisation assumption and pseudo p-values via conditional
 * permutation (Anselin, 1995).
 *
 * The statistic measures the degree of linear association between a
 * variable x and its spatial lag Wx. Values near +1 indicate positive
 * spatial autocorrelation (clustering), values near −1 indicate negative
 * autocorrelation (dispersion), and values near E[I] = −1/(n−1) indicate
 * spatial randomness.
 *
 * Formula:
 *   I = (n / S0) × (Σ_i Σ_j w_ij z_i z_j) / (Σ_i z_i²)
 *
 * where z_i = x_i − x̄, S0 = Σ_i Σ_j w_ij.
 *
 * References:
 *   Moran, P. (1950) "Notes on continuous stochastic phenomena."
 *     Biometrika 37(1-2): 17–23.
 *   Cliff, A. & Ord, J. (1981) Spatial Processes. Pion.
 *   Anselin, L. (1995) "Local indicators of spatial association — LISA."
 *     Geographical Analysis 27(2): 93–115.
 */

import type { GlobalAutocorrelationResult, SpatialWeightsMatrix } from '../types';
import { computeS1, computeS2 } from './SpatialWeights';

// ─── Seeded PRNG ────────────────────────────────────────────────────────────

/**
 * Mulberry32 — a fast 32-bit PRNG with a single seed state.
 * Produces uniform values in [0, 1). Deterministic for a given seed.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Fisher–Yates shuffle (in-place, seeded) ───────────────────────────────

function shuffleInPlace(arr: Float64Array, rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

// ─── Core computation ───────────────────────────────────────────────────────

/**
 * Expected value of Moran's I under the null hypothesis of spatial randomness.
 *
 *   E[I] = −1 / (n − 1)
 */
export function expectedI(n: number): number {
  if (n < 2) throw new RangeError('n must be at least 2.');
  return -1 / (n - 1);
}

/**
 * Variance of Moran's I under the randomisation assumption.
 *
 *   Var[I] = [n² S1 − n S2 + 3 S0²] / [S0² (n² − 1)]  − E[I]²
 *
 * where S0, S1, S2 are computed from the weights matrix.
 * This uses the randomisation (sample-based) variance, not the normality
 * assumption, following Cliff & Ord (1981, Ch. 2).
 */
export function varianceI(W: SpatialWeightsMatrix): number {
  const n = W.n;
  const S0 = W.totalWeight;
  const S1 = computeS1(W);
  const S2 = computeS2(W);
  const EI = expectedI(n);

  const n2 = n * n;
  const S0sq = S0 * S0;

  const numerator = n2 * S1 - n * S2 + 3 * S0sq;
  const denominator = S0sq * (n2 - 1);

  return numerator / denominator - EI * EI;
}

/**
 * Compute Moran's I statistic from deviations and a weights matrix.
 *
 *   I = (n / S0) × (Σ_i Σ_j w_ij z_i z_j) / (Σ_i z_i²)
 *
 * @param z  - Float64Array of deviations (x_i − x̄), length W.n.
 * @param W  - Spatial weights matrix.
 * @returns The observed Moran's I value.
 */
function computeI(z: Float64Array, W: SpatialWeightsMatrix): number {
  const n = W.n;
  const S0 = W.totalWeight;

  let sumZiZj = 0;
  let sumZ2 = 0;

  for (let i = 0; i < n; i++) {
    sumZ2 += z[i] * z[i];
    const row = W.weights.get(i);
    if (!row) continue;
    for (const [j, wij] of row) {
      sumZiZj += wij * z[i] * z[j];
    }
  }

  if (sumZ2 === 0) return 0; // Constant field → undefined, return 0 by convention.

  return (n / S0) * (sumZiZj / sumZ2);
}

/**
 * Compute the z-score for an observed Moran's I.
 *
 *   z = (I − E[I]) / √Var[I]
 */
export function zScore(observedI: number, W: SpatialWeightsMatrix): number {
  const EI = expectedI(W.n);
  const V = varianceI(W);
  if (V <= 0) return 0; // Degenerate case.
  return (observedI - EI) / Math.sqrt(V);
}

// ─── Permutation inference ──────────────────────────────────────────────────

/**
 * Options for permutation-based Moran's I inference.
 */
export interface MoransIOptions {
  /** Number of random permutations (default 999). */
  permutations?: number;
  /** Seed for the PRNG. When provided, results are exactly reproducible. */
  seed?: number;
}

/**
 * Compute the pseudo p-value via conditional permutation inference.
 *
 * The observed I is compared against a reference distribution built by
 * randomly shuffling x values across spatial locations and recomputing I
 * each time. The pseudo p-value is:
 *
 *   p = (R + 1) / (M + 1)
 *
 * where R is the number of permuted I values ≥ observed I (two-sided:
 * |I_perm| ≥ |I_obs|) and M is the total number of permutations.
 *
 * Following Anselin (1995), the "+1" in numerator and denominator accounts
 * for the observed statistic itself.
 *
 * @param values       - Observed attribute values (length W.n).
 * @param W            - Spatial weights matrix.
 * @param observedI    - Observed Moran's I.
 * @param permutations - Number of permutations (default 999).
 * @param seed         - Optional PRNG seed for reproducibility.
 * @returns Pseudo p-value in (0, 1].
 */
export function pseudoPValue(
  values: Float64Array,
  W: SpatialWeightsMatrix,
  observedI: number,
  permutations = 999,
  seed?: number,
): number {
  const rng = mulberry32(seed ?? (Date.now() ^ 0xdeadbeef));
  const n = W.n;

  // Working copy for shuffling.
  const shuffled = new Float64Array(n);
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const absObs = Math.abs(observedI);

  let extremeCount = 0;

  for (let p = 0; p < permutations; p++) {
    // Copy original values and shuffle.
    shuffled.set(values);
    shuffleInPlace(shuffled, rng);

    // Compute deviations from mean.
    const zPerm = new Float64Array(n);
    for (let i = 0; i < n; i++) zPerm[i] = shuffled[i] - mean;

    const Iperm = computeI(zPerm, W);

    if (Math.abs(Iperm) >= absObs) {
      extremeCount++;
    }
  }

  return (extremeCount + 1) / (permutations + 1);
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Compute Global Moran's I with full inference output.
 *
 * Returns a structured result object suitable for UI report narratives,
 * serializable export, and downstream comparison tables.
 *
 * @param values - Observed attribute values as a number array or Float64Array.
 * @param W      - Row-standardized or binary spatial weights matrix.
 * @param options - Permutation count and optional PRNG seed.
 * @returns GlobalAutocorrelationResult with all inference fields.
 */
export function moransI(
  values: ArrayLike<number>,
  W: SpatialWeightsMatrix,
  options: MoransIOptions = {},
): GlobalAutocorrelationResult {
  const n = W.n;

  if (values.length !== n) {
    throw new RangeError(
      `Values length (${values.length}) must equal the number of observations in W (${n}).`,
    );
  }
  if (n < 2) {
    throw new RangeError('At least 2 observations are required for Moran\'s I.');
  }

  const perms = options.permutations ?? 999;
  if (perms < 1) {
    throw new RangeError(`Permutations must be at least 1, received ${perms}.`);
  }

  // Convert to typed array and compute deviations.
  const x = values instanceof Float64Array ? values : new Float64Array(values);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += x[i];
  const mean = sum / n;

  const z = new Float64Array(n);
  for (let i = 0; i < n; i++) z[i] = x[i] - mean;

  // Observed statistic.
  const observed = computeI(z, W);

  // Analytical moments.
  const EI = expectedI(n);
  const V = varianceI(W);
  const zSc = V > 0 ? (observed - EI) / Math.sqrt(V) : 0;

  // Permutation p-value.
  const pVal = pseudoPValue(x, W, observed, perms, options.seed);

  return {
    statistic: "Moran's I",
    observed,
    expected: EI,
    variance: V,
    zScore: zSc,
    pValue: pVal,
    permutations: perms,
  };
}
