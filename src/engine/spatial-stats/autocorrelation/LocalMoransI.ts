/**
 * LocalMoransI — Local Indicators of Spatial Association (LISA).
 *
 * Implements the local Moran statistic (Anselin, 1995) for each observation,
 * enabling the identification of spatial clusters (HH, LL) and spatial
 * outliers (HL, LH) at the neighbourhood scale.
 *
 * For each observation i:
 *
 *   I_i = z_i × Σ_j w_ij z_j / (Σ_k z_k² / n)
 *
 * where z_i = x_i − x̄ (deviation from the global mean).
 *
 * Significance is assessed via conditional permutation: for each location i
 * the values at all other locations are permuted while x_i is held fixed.
 * The pseudo p-value follows Anselin (1995):
 *
 *   p_i = (R_i + 1) / (M + 1)
 *
 * Multiple-testing corrections are available:
 *   • Bonferroni: α* = α / n
 *   • Benjamini–Hochberg FDR: rank p-values, reject where p_(k) ≤ k/n × α
 *
 * Quadrant classification uses the Moran scatterplot:
 *   • HH: z_i > 0, lag_i > 0 (cluster of high values)
 *   • LL: z_i < 0, lag_i < 0 (cluster of low values)
 *   • HL: z_i > 0, lag_i < 0 (high outlier in low surroundings)
 *   • LH: z_i < 0, lag_i > 0 (low outlier in high surroundings)
 *
 * References:
 *   Anselin, L. (1995) "Local indicators of spatial association — LISA."
 *     Geographical Analysis 27(2): 93–115.
 *   Benjamini, Y. & Hochberg, Y. (1995) "Controlling the false discovery
 *     rate." Journal of the Royal Statistical Society B 57(1): 289–300.
 */

import type {
  LISAClusterType,
  LocalAutocorrelationResult,
  SpatialWeightsMatrix,
} from '../types';

// ─── Seeded PRNG (same Mulberry32 as GlobalMoransI) ────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Public types ───────────────────────────────────────────────────────────

/** Method used for multiple-testing correction. */
export type CorrectionMethod = 'none' | 'bonferroni' | 'fdr';

/** Options for Local Moran's I computation. */
export interface LocalMoransIOptions {
  /** Number of conditional permutations per observation (default 999). */
  permutations?: number;
  /** PRNG seed for reproducibility. */
  seed?: number;
  /** Significance threshold α (default 0.05). */
  alpha?: number;
  /** Multiple-testing correction method (default 'fdr'). */
  correction?: CorrectionMethod;
}

/** Legend entry for thematic mapping. */
export interface LISALegendEntry {
  /** Cluster type code. */
  type: LISAClusterType;
  /** Human-readable label for map legend. */
  label: string;
  /** Suggested hex colour following GeoDa convention. */
  color: string;
}

/** GeoJSON-ready feature properties for LISA cluster mapping. */
export interface LISAFeatureProperties {
  /** Observation index. */
  index: number;
  /** Original value. */
  value: number;
  /** Standardised deviation z_i. */
  zValue: number;
  /** Spatial lag of z_i. */
  spatialLag: number;
  /** Local Moran statistic. */
  localI: number;
  /** Raw pseudo p-value. */
  pValue: number;
  /** Whether this observation is significant after correction. */
  significant: boolean;
  /** Quadrant classification. */
  clusterType: LISAClusterType;
}

/** Full LISA result set. */
export interface LISAResult {
  /** Per-observation results conforming to LocalAutocorrelationResult. */
  results: LocalAutocorrelationResult[];
  /** Extended feature properties for GeoJSON mapping. */
  featureProperties: LISAFeatureProperties[];
  /** Legend metadata for rendering. */
  legend: LISALegendEntry[];
  /** Summary counts by cluster type. */
  summary: Record<LISAClusterType, number>;
  /** Correction method applied. */
  correction: CorrectionMethod;
  /** Significance threshold used. */
  alpha: number;
  /** Number of permutations per observation. */
  permutations: number;
}

// ─── Legend metadata (GeoDa-standard colours) ───────────────────────────────

const LISA_LEGEND: LISALegendEntry[] = [
  { type: 'HH', label: 'High–High (Cluster)', color: '#FF0000' },
  { type: 'HL', label: 'High–Low (Outlier)', color: '#FF9999' },
  { type: 'LH', label: 'Low–High (Outlier)', color: '#9999FF' },
  { type: 'LL', label: 'Low–Low (Cluster)', color: '#0000FF' },
  { type: 'not-significant', label: 'Not Significant', color: '#CCCCCC' },
];

// ─── Internal computation ───────────────────────────────────────────────────

/**
 * Classify the Moran scatterplot quadrant for observation i.
 *
 * z_i is the standardised deviation of the observation; lag_i is the
 * spatial lag (weighted average of neighbour deviations). The quadrant
 * encodes the sign pair (z_i, lag_i).
 */
function classifyQuadrant(zi: number, lagI: number): Exclude<LISAClusterType, 'not-significant'> {
  if (zi > 0 && lagI > 0) return 'HH';
  if (zi > 0 && lagI < 0) return 'HL';
  if (zi < 0 && lagI > 0) return 'LH';
  return 'LL';
}

/**
 * Compute the spatial lag for observation i:
 *   lag_i = Σ_j w_ij z_j
 */
function spatialLag(
  i: number,
  z: Float64Array,
  W: SpatialWeightsMatrix,
): number {
  const row = W.weights.get(i);
  if (!row) return 0;
  let lag = 0;
  for (const [j, wij] of row) {
    lag += wij * z[j];
  }
  return lag;
}

/**
 * Fisher–Yates partial shuffle: shuffle all indices except `hold`.
 * Instead of allocating a reduced array each time, we swap the held
 * index to the end, shuffle the prefix, then restore.
 */
function conditionalShuffle(
  arr: Float64Array,
  hold: number,
  rng: () => number,
): void {
  const last = arr.length - 1;
  // Swap held to end.
  const tmp = arr[hold];
  arr[hold] = arr[last];
  arr[last] = tmp;
  // Shuffle indices [0..last-1].
  for (let i = last - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  // Restore held value to its original position.
  arr[last] = arr[hold];
  arr[hold] = tmp;
}

// ─── Multiple-testing corrections ───────────────────────────────────────────

/**
 * Apply Bonferroni correction: a p-value is significant if p_i < α/n.
 */
function bonferroniCorrect(
  pValues: Float64Array,
  alpha: number,
): Uint8Array {
  const n = pValues.length;
  const sig = new Uint8Array(n);
  const threshold = alpha / n;
  for (let i = 0; i < n; i++) {
    sig[i] = pValues[i] < threshold ? 1 : 0;
  }
  return sig;
}

/**
 * Apply Benjamini–Hochberg FDR correction.
 *
 * 1. Rank p-values p_(1) ≤ p_(2) ≤ ... ≤ p_(n).
 * 2. Find the largest k such that p_(k) ≤ (k/n) × α.
 * 3. Reject all hypotheses with rank ≤ k.
 */
function fdrCorrect(
  pValues: Float64Array,
  alpha: number,
): Uint8Array {
  const n = pValues.length;
  const sig = new Uint8Array(n);

  // Build (index, pValue) and sort by p-value ascending.
  const ranked = Array.from({ length: n }, (_, i) => ({
    idx: i,
    p: pValues[i],
  }));
  ranked.sort((a, b) => a.p - b.p);

  // Find the largest k where p_(k) ≤ (k/n) × α.
  let maxK = -1;
  for (let k = 0; k < n; k++) {
    const rank = k + 1; // 1-indexed rank
    if (ranked[k].p <= (rank / n) * alpha) {
      maxK = k;
    }
  }

  // All observations with rank ≤ maxK+1 are significant.
  if (maxK >= 0) {
    for (let k = 0; k <= maxK; k++) {
      sig[ranked[k].idx] = 1;
    }
  }

  return sig;
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Compute Local Moran's I (LISA) for every observation.
 *
 * Returns per-observation statistics, GeoJSON-ready feature properties,
 * legend metadata, and summary counts — everything needed for cluster
 * mapping and report generation.
 *
 * @param values  - Observed attribute values (number[] or Float64Array, length W.n).
 * @param W       - Spatial weights matrix (row-standardized or binary).
 * @param options - Permutation count, seed, α, correction method.
 * @returns LISAResult with full inference output.
 */
export function localMoransI(
  values: ArrayLike<number>,
  W: SpatialWeightsMatrix,
  options: LocalMoransIOptions = {},
): LISAResult {
  const n = W.n;

  if (values.length !== n) {
    throw new RangeError(
      `Values length (${values.length}) must equal the number of observations in W (${n}).`,
    );
  }
  if (n < 3) {
    throw new RangeError('At least 3 observations are required for local Moran\'s I.');
  }

  const perms = options.permutations ?? 999;
  if (perms < 1) {
    throw new RangeError(`Permutations must be at least 1, received ${perms}.`);
  }

  const alpha = options.alpha ?? 0.05;
  const correction = options.correction ?? 'fdr';

  // ── Step 1: Standardise ───────────────────────────────────────────────

  const x = values instanceof Float64Array ? values : new Float64Array(values);

  let sum = 0;
  for (let i = 0; i < n; i++) sum += x[i];
  const mean = sum / n;

  const z = new Float64Array(n);
  for (let i = 0; i < n; i++) z[i] = x[i] - mean;

  // Variance denominator: m2 = Σ_i z_i² / n
  let sumZ2 = 0;
  for (let i = 0; i < n; i++) sumZ2 += z[i] * z[i];
  const m2 = sumZ2 / n;

  // Guard against constant field.
  if (m2 === 0) {
    return buildConstantResult(n, x, correction, alpha, perms);
  }

  // ── Step 2: Compute observed local statistics ─────────────────────────

  const localIValues = new Float64Array(n);
  const lagValues = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const lag = spatialLag(i, z, W);
    lagValues[i] = lag;
    localIValues[i] = (z[i] * lag) / m2;
  }

  // ── Step 3: Conditional permutation inference ─────────────────────────

  const pValues = new Float64Array(n);
  const rng = mulberry32(options.seed ?? (Date.now() ^ 0xdeadbeef));

  // Working buffer for shuffled z-values.
  const zPerm = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);
    if (!row || row.size === 0) {
      // Island: no neighbours → p = 1 by convention.
      pValues[i] = 1;
      continue;
    }

    const obsIi = Math.abs(localIValues[i]);
    let extremeCount = 0;

    for (let p = 0; p < perms; p++) {
      // Conditional permutation: hold z_i fixed, shuffle the rest.
      zPerm.set(z);
      conditionalShuffle(zPerm, i, rng);

      // Recompute spatial lag for i under permuted z.
      let lagPerm = 0;
      for (const [j, wij] of row) {
        lagPerm += wij * zPerm[j];
      }
      const IiPerm = Math.abs((z[i] * lagPerm) / m2);

      if (IiPerm >= obsIi) {
        extremeCount++;
      }
    }

    pValues[i] = (extremeCount + 1) / (perms + 1);
  }

  // ── Step 4: Multiple-testing correction ───────────────────────────────

  let significance: Uint8Array;
  switch (correction) {
    case 'bonferroni':
      significance = bonferroniCorrect(pValues, alpha);
      break;
    case 'fdr':
      significance = fdrCorrect(pValues, alpha);
      break;
    default:
      significance = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        significance[i] = pValues[i] < alpha ? 1 : 0;
      }
      break;
  }

  // ── Step 5: Classify and assemble results ─────────────────────────────

  const results: LocalAutocorrelationResult[] = [];
  const featureProperties: LISAFeatureProperties[] = [];
  const summary: Record<LISAClusterType, number> = {
    HH: 0,
    HL: 0,
    LH: 0,
    LL: 0,
    'not-significant': 0,
  };

  for (let i = 0; i < n; i++) {
    const sig = significance[i] === 1;
    const quadrant = classifyQuadrant(z[i], lagValues[i]);
    const clusterType: LISAClusterType = sig ? quadrant : 'not-significant';

    summary[clusterType]++;

    results.push({
      index: i,
      localI: localIValues[i],
      pValue: pValues[i],
      significant: sig,
      clusterType,
    });

    featureProperties.push({
      index: i,
      value: x[i],
      zValue: z[i],
      spatialLag: lagValues[i],
      localI: localIValues[i],
      pValue: pValues[i],
      significant: sig,
      clusterType,
    });
  }

  return {
    results,
    featureProperties,
    legend: [...LISA_LEGEND],
    summary,
    correction,
    alpha,
    permutations: perms,
  };
}

// ─── Helper: constant-field result ──────────────────────────────────────────

function buildConstantResult(
  n: number,
  x: Float64Array,
  correction: CorrectionMethod,
  alpha: number,
  perms: number,
): LISAResult {
  const results: LocalAutocorrelationResult[] = [];
  const featureProperties: LISAFeatureProperties[] = [];
  const summary: Record<LISAClusterType, number> = {
    HH: 0,
    HL: 0,
    LH: 0,
    LL: 0,
    'not-significant': n,
  };

  for (let i = 0; i < n; i++) {
    results.push({
      index: i,
      localI: 0,
      pValue: 1,
      significant: false,
      clusterType: 'not-significant',
    });
    featureProperties.push({
      index: i,
      value: x[i],
      zValue: 0,
      spatialLag: 0,
      localI: 0,
      pValue: 1,
      significant: false,
      clusterType: 'not-significant',
    });
  }

  return {
    results,
    featureProperties,
    legend: [...LISA_LEGEND],
    summary,
    correction,
    alpha,
    permutations: perms,
  };
}

// ─── Exported utility: legend accessor ──────────────────────────────────────

/**
 * Return the standard LISA legend metadata.
 * Useful for map styling and report legend generation.
 */
export function lisaLegend(): LISALegendEntry[] {
  return [...LISA_LEGEND];
}
