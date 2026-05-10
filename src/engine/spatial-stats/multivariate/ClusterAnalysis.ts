/**
 * ClusterAnalysis — K-Means and Hierarchical Clustering for urban typology.
 *
 * Provides two core clustering methods plus diagnostic tools:
 *
 * | Method         | Use case                                        |
 * |----------------|-------------------------------------------------|
 * | K-Means++      | Fast partitioning for large neighbourhood sets  |
 * | Hierarchical   | Dendrogram-style merging for visual exploration |
 * | Silhouette     | Cluster quality per observation and overall      |
 * | Elbow          | Automatic k selection via WCSS analysis          |
 *
 * All outputs map directly to chart rendering as well as GeoJSON attribute
 * joins (label per observation → feature property).
 *
 * References:
 *   Arthur, D. & Vassilvitskii, S. (2007) "k-means++: The Advantages of
 *     Careful Seeding", Proc. SODA.
 *   Rousseeuw, P.J. (1987) "Silhouettes: A Graphical Aid to the
 *     Interpretation of Cluster Analysis", J. Computational & Applied Math.
 *   Ward, J.H. (1963) "Hierarchical Grouping to Optimize an Objective
 *     Function", J. American Statistical Association, 58(301), 236–244.
 */

import type { ClusterResult } from "../types";

// ─── Distance ───────────────────────────────────────────────────────────────

/** Squared Euclidean distance between two equal-length vectors. */
function sqDist(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += (a[i] - b[i]) ** 2;
  return d;
}

/** Euclidean distance. */
function dist(a: number[], b: number[]): number {
  return Math.sqrt(sqDist(a, b));
}

// ─── Seeded RNG (simple xoshiro128**) ───────────────────────────────────────

function splitmix32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x9e3779b9) | 0;
    let t = seed ^ (seed >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return (t >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  K-MEANS++
// ═══════════════════════════════════════════════════════════════════════════

export interface KMeansOptions {
  /** Number of clusters. */
  k: number;
  /** Maximum iterations (default 300). */
  maxIterations?: number;
  /** Convergence tolerance on centroid movement (default 1e-6). */
  tolerance?: number;
  /** Random seed for reproducibility. */
  seed?: number;
}

/**
 * Select initial centroids using the k-means++ algorithm.
 * Returns indices of the chosen data points.
 */
function kMeansPPInit(
  data: number[][],
  k: number,
  rng: () => number,
): number[][] {
  const n = data.length;
  const centroids: number[][] = [];

  // First centroid: random
  const firstIdx = Math.floor(rng() * n);
  centroids.push([...data[firstIdx]]);

  // Squared distances from each point to nearest centroid
  const dSq = new Float64Array(n).fill(Infinity);

  for (let c = 1; c < k; c++) {
    // Update distances to nearest centroid
    const last = centroids[c - 1];
    for (let i = 0; i < n; i++) {
      const d2 = sqDist(data[i], last);
      if (d2 < dSq[i]) dSq[i] = d2;
    }

    // Weighted random selection proportional to D²
    let totalWeight = 0;
    for (let i = 0; i < n; i++) totalWeight += dSq[i];

    let target = rng() * totalWeight;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      target -= dSq[i];
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...data[chosen]]);
  }

  return centroids;
}

/**
 * K-Means clustering with k-means++ initialisation.
 *
 * @param data  Array of n observations, each an array of p numeric features.
 * @param opts  Configuration including k, maxIterations, tolerance, seed.
 * @returns     A {@link ClusterResult} with labels, silhouettes, and WCSS.
 */
export function kMeans(data: number[][], opts: KMeansOptions): ClusterResult {
  const { k, maxIterations = 300, tolerance = 1e-6, seed = 42 } = opts;
  const n = data.length;
  const p = data[0].length;

  if (k < 1 || k > n) {
    throw new RangeError(`kMeans: k must be between 1 and n (${n}), got ${k}`);
  }
  if (n === 0) throw new RangeError("kMeans: data must have at least 1 observation");

  const rng = splitmix32(seed);

  // Initialise centroids via k-means++
  let centroids = kMeansPPInit(data, k, rng);

  // Assignment and iteration
  const labels = new Int32Array(n);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each point to nearest centroid
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestK = 0;
      for (let c = 0; c < k; c++) {
        const d2 = sqDist(data[i], centroids[c]);
        if (d2 < bestDist) {
          bestDist = d2;
          bestK = c;
        }
      }
      labels[i] = bestK;
    }

    // Recompute centroids
    const newCentroids: number[][] = Array.from({ length: k }, () =>
      new Array<number>(p).fill(0),
    );
    const counts = new Int32Array(k);

    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      for (let j = 0; j < p; j++) {
        newCentroids[c][j] += data[i][j];
      }
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < p; j++) {
          newCentroids[c][j] /= counts[c];
        }
      } else {
        // Empty cluster — keep old centroid
        newCentroids[c] = [...centroids[c]];
      }
    }

    // Check convergence
    let maxShift = 0;
    for (let c = 0; c < k; c++) {
      maxShift = Math.max(maxShift, sqDist(centroids[c], newCentroids[c]));
    }

    centroids = newCentroids;
    if (maxShift < tolerance * tolerance) break;
  }

  // Compute WCSS per cluster
  const wcss = new Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) {
    wcss[labels[i]] += sqDist(data[i], centroids[labels[i]]);
  }
  const totalWcss = wcss.reduce((s, v) => s + v, 0);

  // Silhouette scores
  const silhouetteScores = silhouette(data, Array.from(labels), k);
  const meanSilhouette =
    silhouetteScores.reduce((s, v) => s + v, 0) / n;

  return {
    labels: Array.from(labels),
    k,
    silhouetteScores,
    meanSilhouette,
    wcss,
    totalWcss,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  SILHOUETTE SCORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute silhouette scores for each observation.
 *
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 *
 * where a(i) is the mean intra-cluster distance and b(i) is the mean
 * nearest-cluster distance.
 */
export function silhouette(
  data: number[][],
  labels: number[],
  k: number,
): number[] {
  const n = data.length;
  const scores = new Array<number>(n).fill(0);

  if (k <= 1) return scores; // silhouette undefined for k=1

  for (let i = 0; i < n; i++) {
    const ci = labels[i];
    // Sum of distances to each cluster
    const clusterDist = new Float64Array(k);
    const clusterCount = new Int32Array(k);

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      clusterDist[labels[j]] += dist(data[i], data[j]);
      clusterCount[labels[j]]++;
    }

    // a(i) — mean distance to own cluster
    const a = clusterCount[ci] > 0 ? clusterDist[ci] / clusterCount[ci] : 0;

    // b(i) — min mean distance to any other cluster
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ci || clusterCount[c] === 0) continue;
      const avg = clusterDist[c] / clusterCount[c];
      if (avg < b) b = avg;
    }
    if (!isFinite(b)) b = 0;

    const denom = Math.max(a, b);
    scores[i] = denom > 0 ? (b - a) / denom : 0;
  }

  return scores;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ELBOW DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface ElbowResult {
  /** Array of k values tested. */
  kValues: number[];
  /** Total WCSS for each k. */
  wcssValues: number[];
  /** Suggested k based on maximum second-derivative (kneedle-style). */
  suggestedK: number;
}

/**
 * Run k-means for a range of k values and return WCSS for elbow analysis.
 *
 * @param data    Observation array.
 * @param kMin    Minimum k to test (default 2).
 * @param kMax    Maximum k to test (default 10 or n, whichever is smaller).
 * @param seed    Random seed passed to each k-means run.
 */
export function elbowAnalysis(
  data: number[][],
  kMin = 2,
  kMax = 10,
  seed = 42,
): ElbowResult {
  const n = data.length;
  kMax = Math.min(kMax, n);
  kMin = Math.max(kMin, 1);

  const kValues: number[] = [];
  const wcssValues: number[] = [];

  for (let k = kMin; k <= kMax; k++) {
    const result = kMeans(data, { k, seed });
    kValues.push(k);
    wcssValues.push(result.totalWcss);
  }

  // Suggest k via maximum second derivative (discrete kneedle)
  let suggestedK = kMin;
  if (kValues.length >= 3) {
    let maxCurve = -Infinity;
    for (let i = 1; i < kValues.length - 1; i++) {
      const curve =
        wcssValues[i - 1] - 2 * wcssValues[i] + wcssValues[i + 1];
      if (curve > maxCurve) {
        maxCurve = curve;
        suggestedK = kValues[i];
      }
    }
  }

  return { kValues, wcssValues, suggestedK };
}

// ═══════════════════════════════════════════════════════════════════════════
//  HIERARCHICAL (AGGLOMERATIVE) CLUSTERING
// ═══════════════════════════════════════════════════════════════════════════

export type LinkageMethod = "single" | "complete" | "average" | "ward";

export interface HierarchicalOptions {
  /** Number of final clusters to extract from the dendrogram. */
  k: number;
  /** Linkage strategy (default "ward"). */
  linkage?: LinkageMethod;
}

/** One merge step in the dendrogram. */
export interface DendrogramNode {
  /** Index of the merged cluster (or original observation). */
  left: number;
  right: number;
  /** Distance at which the merge occurred. */
  distance: number;
  /** Size of the merged cluster. */
  size: number;
}

export interface HierarchicalResult extends ClusterResult {
  /** Merge history for dendrogram rendering. */
  dendrogram: DendrogramNode[];
}

/**
 * Agglomerative hierarchical clustering.
 *
 * @param data  Array of n observations, each an array of p features.
 * @param opts  Configuration (k, linkage strategy).
 * @returns     Cluster assignments plus dendrogram and diagnostics.
 */
export function hierarchicalClustering(
  data: number[][],
  opts: HierarchicalOptions,
): HierarchicalResult {
  const { k, linkage = "ward" } = opts;
  const n = data.length;
  const p = data[0].length;

  if (k < 1 || k > n) {
    throw new RangeError(
      `hierarchicalClustering: k must be between 1 and n (${n}), got ${k}`,
    );
  }

  // Pairwise distance matrix (condensed upper-triangle)
  // For Ward's method we track centroids and sizes
  const centroids: number[][] = data.map((d) => [...d]);
  const sizes = new Array<number>(n).fill(1);

  // Active cluster IDs
  const active = new Set<number>();
  for (let i = 0; i < n; i++) active.add(i);

  // Distance cache (symmetric)
  const distCache = new Map<string, number>();
  const dKey = (a: number, b: number) =>
    a < b ? `${a}:${b}` : `${b}:${a}`;

  // Initial pairwise distances
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      distCache.set(dKey(i, j), computeLinkageDist(i, j));
    }
  }

  function computeLinkageDist(a: number, b: number): number {
    switch (linkage) {
      case "single":
      case "complete":
      case "average":
        return dist(centroids[a], centroids[b]);
      case "ward": {
        const d2 = sqDist(centroids[a], centroids[b]);
        const sa = sizes[a];
        const sb = sizes[b];
        return (sa * sb * d2) / (sa + sb);
      }
      default:
        return dist(centroids[a], centroids[b]);
    }
  }

  const dendrogram: DendrogramNode[] = [];
  let nextId = n;

  // Parent tracking for final cluster extraction
  const parent = new Int32Array(2 * n).fill(-1);

  // Merge until k clusters remain
  while (active.size > k) {
    // Find closest pair
    let bestDist = Infinity;
    let bestA = -1;
    let bestB = -1;

    for (const a of active) {
      for (const b of active) {
        if (b <= a) continue;
        const key = dKey(a, b);
        const d = distCache.get(key) ?? Infinity;
        if (d < bestDist) {
          bestDist = d;
          bestA = a;
          bestB = b;
        }
      }
    }

    // Merge bestA and bestB → nextId
    const mergedSize = sizes[bestA] + sizes[bestB];

    // Update centroid for the new cluster
    const newCentroid = new Array<number>(p);
    for (let j = 0; j < p; j++) {
      newCentroid[j] =
        (centroids[bestA][j] * sizes[bestA] +
          centroids[bestB][j] * sizes[bestB]) /
        mergedSize;
    }

    dendrogram.push({
      left: bestA,
      right: bestB,
      distance: bestDist,
      size: mergedSize,
    });

    parent[bestA] = nextId;
    parent[bestB] = nextId;

    // Register new cluster
    centroids[nextId] = newCentroid;
    sizes[nextId] = mergedSize;

    // Compute distances from new cluster to all remaining
    active.delete(bestA);
    active.delete(bestB);

    for (const c of active) {
      // Lance-Williams update or recompute
      let d: number;
      if (linkage === "single") {
        const dA = distCache.get(dKey(bestA, c)) ?? Infinity;
        const dB = distCache.get(dKey(bestB, c)) ?? Infinity;
        d = Math.min(dA, dB);
      } else if (linkage === "complete") {
        const dA = distCache.get(dKey(bestA, c)) ?? Infinity;
        const dB = distCache.get(dKey(bestB, c)) ?? Infinity;
        d = Math.max(dA, dB);
      } else {
        d = computeLinkageDist(nextId, c);
      }
      distCache.set(dKey(nextId, c), d);
    }

    active.add(nextId);
    nextId++;
  }

  // Extract labels by traversing parent links
  const clusterRoots = Array.from(active);
  const rootMap = new Map<number, number>();
  clusterRoots.forEach((root, idx) => rootMap.set(root, idx));

  const labels = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let node = i;
    while (parent[node] !== -1) {
      node = parent[node];
    }
    labels[i] = rootMap.get(node) ?? 0;
  }

  // Compute WCSS
  const clusterCentroids: number[][] = Array.from({ length: k }, () =>
    new Array<number>(p).fill(0),
  );
  const counts = new Int32Array(k);

  for (let i = 0; i < n; i++) {
    counts[labels[i]]++;
    for (let j = 0; j < p; j++) {
      clusterCentroids[labels[i]][j] += data[i][j];
    }
  }
  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) {
      for (let j = 0; j < p; j++) {
        clusterCentroids[c][j] /= counts[c];
      }
    }
  }

  const wcss = new Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) {
    wcss[labels[i]] += sqDist(data[i], clusterCentroids[labels[i]]);
  }
  const totalWcss = wcss.reduce((s, v) => s + v, 0);

  // Silhouette
  const silhouetteScores = silhouette(data, labels, k);
  const meanSilhouette =
    silhouetteScores.reduce((s, v) => s + v, 0) / n;

  return {
    labels,
    k,
    silhouetteScores,
    meanSilhouette,
    wcss,
    totalWcss,
    dendrogram,
  };
}
