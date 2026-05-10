/**
 * SpatialWeights — Foundational spatial weights engine.
 *
 * Constructs sparse spatial weight matrices used by autocorrelation
 * (Moran's I, LISA, Gi*), spatial regression (OLS diagnostics, SAR, SEM,
 * GWR), and constrained clustering (SKATER, MaxP).
 *
 * Supports polygon-based contiguity (queen, rook) and point-based distance
 * methods (k-NN, distance-band, inverse-distance). All representations are
 * sparse (Map<number, Map<number, number>>) to scale to city-level datasets
 * (50k–200k features).
 *
 * References:
 *   Anselin, L. (1988) Spatial Econometrics: Methods and Models. Kluwer.
 *   Getis, A. (2009) "Spatial Weights Matrices." Geographical Analysis 41(4).
 */

import type {
  Coordinate,
  NeighborMap,
  SpatialFeature,
  SpatialWeightsMatrix,
  WeightsMethod,
  WeightsOptions,
} from '../types';

// ─── Internal geometry helpers ──────────────────────────────────────────────

/**
 * Euclidean distance between two 2-D points.
 * Suitable for projected coordinates. For geographic coordinates users
 * should reproject first; this tradeoff is documented.
 */
function euclidean(a: Coordinate, b: Coordinate): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Quantise a coordinate to an integer grid key for edge/vertex hashing.
 * Resolution 1e-8 (≈ 1 mm at equator) balances floating-point jitter
 * with memory footprint.
 */
const PRECISION = 1e8;
function coordKey(x: number, y: number): string {
  return `${Math.round(x * PRECISION)},${Math.round(y * PRECISION)}`;
}

/** A directed edge between two quantised vertices. */
function edgeKey(x1: number, y1: number, x2: number, y2: number): string {
  return `${coordKey(x1, y1)}|${coordKey(x2, y2)}`;
}

// ─── Matrix construction helpers ────────────────────────────────────────────

/** Build an empty sparse weights map for n observations. */
function emptyWeights(n: number): Map<number, NeighborMap> {
  const w = new Map<number, NeighborMap>();
  for (let i = 0; i < n; i++) w.set(i, new Map());
  return w;
}

/** Compute summary metadata for a weights map. */
function summarise(
  weights: Map<number, NeighborMap>,
  n: number,
  _symmetric: boolean,
): Pick<SpatialWeightsMatrix, 'islands' | 'totalWeight'> {
  const islands: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < n; i++) {
    const row = weights.get(i);
    if (!row || row.size === 0) {
      islands.push(i);
    } else {
      for (const v of row.values()) totalWeight += v;
    }
  }
  return { islands, totalWeight };
}

/** Pack a weights map into a SpatialWeightsMatrix with metadata. */
function pack(
  weights: Map<number, NeighborMap>,
  n: number,
  symmetric: boolean,
  rowStandardized: boolean,
): SpatialWeightsMatrix {
  const { islands, totalWeight } = summarise(weights, n, symmetric);
  return { n, weights, rowStandardized, islands, symmetric, totalWeight };
}

// ─── Contiguity methods ─────────────────────────────────────────────────────

/**
 * Shared contiguity builder. Builds adjacency from polygon rings using
 * shared edges (rook) or shared vertices (queen).
 *
 * Algorithm:
 *   1. For each polygon, extract all boundary edges (v1→v2).
 *   2. Index features by each vertex key (queen) or directed-edge key (rook).
 *   3. Features sharing an entry are neighbours.
 *
 * Queen: Two polygons are neighbours if they share ≥ 1 vertex.
 * Rook:  Two polygons are neighbours if they share ≥ 1 edge (two
 *        consecutive vertices in common).
 */
function buildContiguity(
  features: SpatialFeature[],
  mode: 'queen' | 'rook',
): SpatialWeightsMatrix {
  const n = features.length;
  const weights = emptyWeights(n);

  // Maps a geometric key → set of feature indices that touch it.
  const index = new Map<string, Set<number>>();

  const addToIndex = (key: string, featureIdx: number) => {
    let set = index.get(key);
    if (!set) {
      set = new Set();
      index.set(key, set);
    }
    set.add(featureIdx);
  };

  for (let fi = 0; fi < n; fi++) {
    const rings = features[fi].rings;
    if (!rings || rings.length === 0) continue; // Island — no geometry.

    for (const ring of rings) {
      const len = ring.length;
      for (let vi = 0; vi < len; vi++) {
        const [x1, y1] = ring[vi];

        if (mode === 'queen') {
          // Share any vertex → neighbours.
          addToIndex(coordKey(x1, y1), fi);
        }

        // For rook we also index edges. For queen we index edges too so
        // we don't accidentally miss adjacency when only an edge (not a
        // lone vertex) is shared — but shared vertex already covers it,
        // so for queen we only need the vertex. For rook, we need edges:
        if (mode === 'rook') {
          const [x2, y2] = ring[(vi + 1) % len];
          // Index both directions of the edge so reversed winding still matches.
          addToIndex(edgeKey(x1, y1, x2, y2), fi);
          addToIndex(edgeKey(x2, y2, x1, y1), fi);
        }
      }
    }
  }

  // Resolve adjacency from the index.
  for (const members of index.values()) {
    if (members.size < 2) continue;
    const arr = Array.from(members);
    for (let a = 0; a < arr.length; a++) {
      for (let b = a + 1; b < arr.length; b++) {
        const i = arr[a];
        const j = arr[b];
        // Binary weight 1 for contiguity.
        weights.get(i)!.set(j, 1);
        weights.get(j)!.set(i, 1);
      }
    }
  }

  return pack(weights, n, /* symmetric */ true, /* rowStandardized */ false);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Queen contiguity weights.
 * Two polygons are neighbours if they share at least one vertex.
 *
 * @param features - Array of SpatialFeature with rings.
 * @returns Binary sparse weight matrix (w_ij = 1 if contiguous).
 */
export function queenContiguity(features: SpatialFeature[]): SpatialWeightsMatrix {
  return buildContiguity(features, 'queen');
}

/**
 * Rook contiguity weights.
 * Two polygons are neighbours if they share at least one edge
 * (two consecutive boundary vertices in common).
 *
 * @param features - Array of SpatialFeature with rings.
 * @returns Binary sparse weight matrix.
 */
export function rookContiguity(features: SpatialFeature[]): SpatialWeightsMatrix {
  return buildContiguity(features, 'rook');
}

/**
 * K-nearest neighbours weights.
 *
 * For each observation, the k closest observations (by Euclidean
 * distance on centroids) receive weight 1; all others receive 0.
 *
 * Tie handling: when multiple candidates share the same distance at the
 * k-th boundary, all ties are included (slightly more than k neighbours).
 * This ensures deterministic results regardless of input order.
 *
 * Note: the resulting matrix is generally **asymmetric** — feature i
 * having j as a k-NN does not guarantee the reverse.
 *
 * @param features - Array of SpatialFeature with centroid.
 * @param k - Number of nearest neighbours (default 5).
 * @returns Binary sparse weight matrix.
 */
export function kNearestNeighbors(
  features: SpatialFeature[],
  k = 5,
): SpatialWeightsMatrix {
  const n = features.length;
  if (k >= n) {
    throw new RangeError(
      `k (${k}) must be less than the number of observations (${n}).`,
    );
  }
  if (k < 1) {
    throw new RangeError(`k must be at least 1, received ${k}.`);
  }

  const weights = emptyWeights(n);

  // Pre-compute all pairwise distances for each i.
  // For city-scale (n ≈ 50k) this is O(n²) which is tolerable;
  // a k-d tree optimisation can be introduced later for n > 100k.
  for (let i = 0; i < n; i++) {
    const ci = features[i].centroid;

    // Build distance pairs and sort.
    const dists: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      dists.push({ j, d: euclidean(ci, features[j].centroid) });
    }
    // Sort ascending by distance, then by index for determinism.
    dists.sort((a, b) => a.d - b.d || a.j - b.j);

    // Select k neighbours plus ties at the boundary.
    const cutoff = dists[k - 1].d;
    const row = weights.get(i)!;
    for (const { j, d } of dists) {
      if (d > cutoff) break;
      row.set(j, 1);
    }
  }

  return pack(weights, n, /* symmetric */ false, /* rowStandardized */ false);
}

/**
 * Distance-band weights (fixed threshold).
 *
 * Two features are neighbours if their centroid distance ≤ threshold.
 * Produces a symmetric binary matrix.
 *
 * @param features - Array of SpatialFeature with centroid.
 * @param threshold - Maximum distance for neighbourhood inclusion.
 * @returns Binary sparse weight matrix.
 */
export function distanceBand(
  features: SpatialFeature[],
  threshold: number,
): SpatialWeightsMatrix {
  if (threshold <= 0) {
    throw new RangeError(`Distance threshold must be positive, received ${threshold}.`);
  }

  const n = features.length;
  const weights = emptyWeights(n);

  for (let i = 0; i < n; i++) {
    const ci = features[i].centroid;
    for (let j = i + 1; j < n; j++) {
      const d = euclidean(ci, features[j].centroid);
      if (d <= threshold) {
        weights.get(i)!.set(j, 1);
        weights.get(j)!.set(i, 1);
      }
    }
  }

  return pack(weights, n, /* symmetric */ true, /* rowStandardized */ false);
}

/**
 * Inverse-distance weights.
 *
 * w_ij = d_ij^{-α} for all j within `threshold` distance of i.
 * If no threshold is provided, all pairwise connections are used
 * (complete graph, suitable only for small datasets).
 *
 * Produces a symmetric matrix (w_ij = w_ji because distance is symmetric).
 *
 * @param features - Array of SpatialFeature with centroid.
 * @param options  - `alpha` (power, default 1) and optional `threshold`.
 * @returns Continuous sparse weight matrix.
 */
export function inverseDistance(
  features: SpatialFeature[],
  options: Pick<WeightsOptions, 'alpha' | 'threshold'> = {},
): SpatialWeightsMatrix {
  const alpha = options.alpha ?? 1;
  const threshold = options.threshold ?? Infinity;

  if (alpha <= 0) {
    throw new RangeError(`Alpha must be positive, received ${alpha}.`);
  }

  const n = features.length;
  const weights = emptyWeights(n);

  for (let i = 0; i < n; i++) {
    const ci = features[i].centroid;
    for (let j = i + 1; j < n; j++) {
      const d = euclidean(ci, features[j].centroid);
      if (d > 0 && d <= threshold) {
        const w = Math.pow(d, -alpha);
        weights.get(i)!.set(j, w);
        weights.get(j)!.set(i, w);
      }
      // d === 0 (coincident points) → skip to avoid infinity weight.
    }
  }

  return pack(weights, n, /* symmetric */ true, /* rowStandardized */ false);
}

/**
 * Row-standardize a spatial weights matrix (in place).
 *
 * For each row i, every weight w_ij is divided by the sum of that row:
 *   w*_ij = w_ij / Σ_j w_ij
 *
 * Island observations (zero neighbours) are left unchanged — their
 * row sum is 0 and no division occurs. This is the standard convention
 * used by PySAL and GeoDa (Anselin, 2003). Downstream methods that
 * iterate over neighbours naturally skip islands because the neighbour
 * set is empty.
 *
 * This function **mutates** the input matrix and updates its metadata.
 * To obtain a row-standardized copy without mutating the original, clone
 * the weights Map first.
 *
 * @param matrix - The SpatialWeightsMatrix to row-standardize.
 * @returns The same matrix reference, now row-standardized.
 */
export function rowStandardize(matrix: SpatialWeightsMatrix): SpatialWeightsMatrix {
  if (matrix.rowStandardized) return matrix;

  let newTotalWeight = 0;

  for (let i = 0; i < matrix.n; i++) {
    const row = matrix.weights.get(i);
    if (!row || row.size === 0) continue; // Island — skip.

    let rowSum = 0;
    for (const v of row.values()) rowSum += v;

    if (rowSum === 0) continue; // Degenerate row — safety guard.

    for (const [j, v] of row) {
      const sw = v / rowSum;
      row.set(j, sw);
      newTotalWeight += sw;
    }
  }

  matrix.rowStandardized = true;
  matrix.totalWeight = newTotalWeight;
  // Note: row-standardization of a symmetric binary matrix produces a
  // symmetric matrix only when all rows have equal cardinality. In general,
  // the result is asymmetric.
  matrix.symmetric = false;

  return matrix;
}

// ─── Convenience builder ────────────────────────────────────────────────────

/**
 * Build a SpatialWeightsMatrix from features using a named method.
 * Optionally row-standardize.
 */
export function buildWeights(
  features: SpatialFeature[],
  method: WeightsMethod,
  options: WeightsOptions = {},
): SpatialWeightsMatrix {
  let W: SpatialWeightsMatrix;

  switch (method) {
    case 'queen':
      W = queenContiguity(features);
      break;
    case 'rook':
      W = rookContiguity(features);
      break;
    case 'knn':
      W = kNearestNeighbors(features, options.k ?? 5);
      break;
    case 'distance-band':
      if (options.threshold == null) {
        throw new Error('distance-band method requires a threshold option.');
      }
      W = distanceBand(features, options.threshold);
      break;
    case 'inverse-distance':
      W = inverseDistance(features, {
        ...(options.alpha != null ? { alpha: options.alpha } : {}),
        ...(options.threshold != null ? { threshold: options.threshold } : {}),
      });
      break;
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unknown weights method: ${_exhaustive}`);
    }
  }

  if (options.rowStandardize) {
    rowStandardize(W);
  }

  return W;
}

// ─── Utility helpers (exported for downstream use) ──────────────────────────

/** Clone a SpatialWeightsMatrix (deep copy of the weights Map). */
export function cloneWeights(matrix: SpatialWeightsMatrix): SpatialWeightsMatrix {
  const cloned = new Map<number, NeighborMap>();
  for (const [i, row] of matrix.weights) {
    cloned.set(i, new Map(row));
  }
  return {
    ...matrix,
    weights: cloned,
    islands: [...matrix.islands],
  };
}

/**
 * Compute S1 = 0.5 * Σ_ij (w_ij + w_ji)².
 * Required for variance calculations in Moran's I and Gi*.
 */
export function computeS1(matrix: SpatialWeightsMatrix): number {
  let s1 = 0;
  for (let i = 0; i < matrix.n; i++) {
    const row = matrix.weights.get(i);
    if (!row) continue;
    for (const [j, wij] of row) {
      const wji = matrix.weights.get(j)?.get(i) ?? 0;
      s1 += (wij + wji) * (wij + wji);
    }
  }
  return 0.5 * s1;
}

/**
 * Compute S2 = Σ_i (Σ_j w_ij + Σ_j w_ji)².
 * Required for variance calculations in Moran's I (randomisation assumption).
 */
export function computeS2(matrix: SpatialWeightsMatrix): number {
  const rowSums = new Float64Array(matrix.n);
  const colSums = new Float64Array(matrix.n);

  for (let i = 0; i < matrix.n; i++) {
    const row = matrix.weights.get(i);
    if (!row) continue;
    for (const [j, w] of row) {
      rowSums[i] += w;
      colSums[j] += w;
    }
  }

  let s2 = 0;
  for (let i = 0; i < matrix.n; i++) {
    const t = rowSums[i] + colSums[i];
    s2 += t * t;
  }
  return s2;
}
