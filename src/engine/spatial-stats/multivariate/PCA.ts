/**
 * PCA — Principal Component Analysis (correlation-based).
 *
 * Performs dimensionality reduction via eigendecomposition of the
 * correlation matrix.  All input variables are standardised (z-scored)
 * before extraction so that units and scales do not dominate.
 *
 * Designed for neighbourhood profiling, composite index construction,
 * and exploratory multivariate analysis on urban indicator datasets.
 *
 * ### Outputs (mapped to chart and map attribute joins)
 *
 * | Output             | Chart use              | Map join use            |
 * |--------------------|------------------------|-------------------------|
 * | `eigenvalues`      | Scree plot (bar/line)  | —                       |
 * | `varianceExplained`| Percent-of-variance bar| —                       |
 * | `cumulativeVariance`| Cumulative line        | —                       |
 * | `loadings`         | Loadings heatmap / biplot | —                    |
 * | `scores`           | Scatter (PC1 vs PC2)   | Join on observation index|
 * | `kaiserComponents` | Threshold line on scree | Component count label   |
 *
 * References:
 *   Jolliffe, I.T. (2002) Principal Component Analysis, 2nd ed., Springer.
 *   Kaiser, H.F. (1960) "The Application of Electronic Computers to Factor
 *     Analysis", Educational & Psychological Measurement 20, 141–151.
 */

import { symmetricEigen } from "../math/eigen";
import type { PCAResult } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function idx(i: number, j: number, m: number): number {
  return i + j * m;
}

/**
 * Standardise columns of an n × p data matrix to zero mean and unit std.
 * Returns the standardised matrix plus column means and standard deviations.
 */
export function standardize(
  data: number[][],
): { Z: number[][]; means: number[]; stds: number[] } {
  const n = data.length;
  if (n === 0) throw new RangeError("PCA: data must have at least 1 observation");
  const p = data[0].length;

  const means = new Array<number>(p).fill(0);
  const stds = new Array<number>(p).fill(0);

  // Column means
  for (let j = 0; j < p; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += data[i][j];
    means[j] = sum / n;
  }

  // Column stds (population std since we divide correlation matrix by n)
  for (let j = 0; j < p; j++) {
    let ss = 0;
    for (let i = 0; i < n; i++) ss += (data[i][j] - means[j]) ** 2;
    stds[j] = Math.sqrt(ss / n);
    if (stds[j] < 1e-15) stds[j] = 1; // avoid division by zero for constant columns
  }

  const Z: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(p);
    for (let j = 0; j < p; j++) {
      row[j] = (data[i][j] - means[j]) / stds[j];
    }
    Z.push(row);
  }

  return { Z, means, stds };
}

/**
 * Build the correlation matrix from a standardised data matrix.
 * Returns a column-major Float64Array of a p × p symmetric matrix.
 */
function correlationMatrix(Z: number[][], n: number, p: number): Float64Array {
  const R = new Float64Array(p * p);
  for (let a = 0; a < p; a++) {
    for (let b = a; b < p; b++) {
      let dot = 0;
      for (let i = 0; i < n; i++) dot += Z[i][a] * Z[i][b];
      const val = dot / n;
      R[idx(a, b, p)] = val;
      R[idx(b, a, p)] = val;
    }
  }
  return R;
}

// ─── Main API ───────────────────────────────────────────────────────────────

export interface PCAOptions {
  /** Maximum number of components to retain. Defaults to min(n, p). */
  maxComponents?: number;
  /** Variable (column) labels for loadings interpretation. */
  variableLabels?: string[];
}

/**
 * Run correlation-based PCA on a rectangular data matrix.
 *
 * @param data  Array of n observations, each an array of p numeric variables.
 *              Missing values are **not** supported; clean data before calling.
 * @param opts  Optional configuration.
 * @returns     A {@link PCAResult} with all diagnostic arrays sized to the
 *              number of retained components (min of maxComponents and p).
 *
 * @example
 * ```ts
 * import { pca } from "@/engine/spatial-stats/multivariate/PCA";
 * const result = pca(censusData, { variableLabels: ["popDens", "income", "green"] });
 * console.log(result.kaiserComponents); // e.g. 2
 * ```
 */
export function pca(data: number[][], opts: PCAOptions = {}): PCAResult {
  const n = data.length;
  if (n < 2) throw new RangeError("PCA requires at least 2 observations");
  const p = data[0].length;
  if (p < 2) throw new RangeError("PCA requires at least 2 variables");
  for (let i = 0; i < n; i++) {
    if (data[i].length !== p) {
      throw new RangeError(
        `PCA: observation ${i} has ${data[i].length} variables, expected ${p}`,
      );
    }
  }

  // 1. Standardise to z-scores
  const { Z } = standardize(data);

  // 2. Compute correlation matrix (p × p)
  const R = correlationMatrix(Z, n, p);

  // 3. Eigendecomposition (sorted descending by eigenvalue)
  const { values, vectors } = symmetricEigen(R, p);

  // 4. Number of components to keep
  const maxComp = Math.min(opts.maxComponents ?? p, p);

  // 5. Variance explained
  const totalVariance = Array.from(values).reduce((s, v) => s + Math.max(v, 0), 0);
  const eigenvalues: number[] = [];
  const varianceExplained: number[] = [];
  const cumulativeVariance: number[] = [];
  let cum = 0;

  for (let j = 0; j < maxComp; j++) {
    const ev = Math.max(values[j], 0); // clamp near-zero negatives
    eigenvalues.push(ev);
    const pct = totalVariance > 0 ? ev / totalVariance : 0;
    varianceExplained.push(pct);
    cum += pct;
    cumulativeVariance.push(cum);
  }

  // 6. Loadings (p × maxComp) — eigenvector columns
  const loadings: number[][] = [];
  for (let i = 0; i < p; i++) {
    const row: number[] = [];
    for (let j = 0; j < maxComp; j++) {
      row.push(vectors[idx(i, j, p)]);
    }
    loadings.push(row);
  }

  // 7. Scores (n × maxComp) — project standardised data onto components
  const scores: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < maxComp; j++) {
      let s = 0;
      for (let v = 0; v < p; v++) {
        s += Z[i][v] * vectors[idx(v, j, p)];
      }
      row.push(s);
    }
    scores.push(row);
  }

  // 8. Kaiser criterion: retain components with eigenvalue ≥ 1.0
  let kaiserComponents = 0;
  for (let j = 0; j < maxComp; j++) {
    if (eigenvalues[j] >= 1.0) kaiserComponents++;
  }

  return {
    eigenvalues,
    varianceExplained,
    cumulativeVariance,
    loadings,
    scores,
    kaiserComponents,
  };
}
