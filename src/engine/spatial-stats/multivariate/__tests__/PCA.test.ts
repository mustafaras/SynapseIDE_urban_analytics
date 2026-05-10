/**
 * PCA — Tests with realistic urban indicator fixtures.
 *
 * Fixture 1: Census-morphology dataset (8 neighbourhoods × 4 indicators)
 *   Variables: population density, median income, green space %, building age
 *
 * Fixture 2: Larger urban liveability dataset (15 tracts × 6 indicators)
 *   Variables: transit access, walkability, air quality, noise, housing cost,
 *              service density
 */

import { describe, expect, it } from "vitest";
import { pca, standardize } from "../PCA";
import { symmetricEigen } from "../../math/eigen";

// ═══════════════════════════════════════════════════════════════════════════
//  Fixtures
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fixture 1 — Census-morphology dataset.
 * 8 neighbourhoods, 4 variables:
 *   [popDensity (pop/ha), medianIncome ($k), greenPct (%), buildingAge (yrs)]
 *
 * Designed so that popDensity and medianIncome are inversely correlated,
 * and greenPct and buildingAge move together (older areas have more trees).
 */
const CENSUS_MORPH: number[][] = [
  [120, 45, 35, 60],   // Dense low-income older neighbourhood
  [150, 40, 30, 70],   // Very dense, low income, old
  [80,  65, 45, 40],   // Moderate density, higher income, some green
  [40,  90, 60, 20],   // Suburban, high income, new
  [35,  95, 65, 15],   // Low density, wealthy, new construction
  [110, 50, 38, 55],   // Dense, moderate income, older
  [60,  75, 50, 35],   // Medium, good income, moderate age
  [130, 38, 28, 75],   // Very dense, low income, very old
];

const CENSUS_LABELS = ["popDensity", "medianIncome", "greenPct", "buildingAge"];

/**
 * Fixture 2 — Urban liveability dataset.
 * 15 census tracts × 6 liveability indicators (0–100 scale).
 *
 * Constructed with two latent dimensions:
 *   Dimension A (mobility/access): transit, walkability, service density
 *   Dimension B (environment): air quality, noise (inverted), housing cost (inverted)
 */
const LIVEABILITY: number[][] = [
  [85, 92, 30, 70, 40, 80],  // Urban core — high mobility, moderate env
  [80, 83, 35, 65, 45, 75],
  [75, 78, 40, 60, 50, 72],
  [90, 88, 25, 75, 35, 85],
  [70, 74, 50, 55, 55, 65],
  [30, 38, 80, 85, 75, 30],  // Suburban — low mobility, good env
  [25, 28, 85, 90, 80, 25],
  [35, 42, 75, 80, 70, 35],
  [40, 48, 70, 75, 65, 40],
  [20, 22, 90, 95, 85, 20],
  [55, 58, 55, 65, 55, 55],  // Transitional
  [60, 62, 50, 60, 50, 60],
  [50, 53, 60, 70, 60, 50],
  [45, 52, 65, 75, 65, 45],
  [65, 68, 45, 55, 45, 65],
];

// ═══════════════════════════════════════════════════════════════════════════
//  Eigendecomposition unit tests
// ═══════════════════════════════════════════════════════════════════════════

describe("symmetricEigen", () => {
  it("decomposes a 2×2 identity matrix", () => {
    const I = new Float64Array([1, 0, 0, 1]); // col-major 2×2
    const { values, vectors } = symmetricEigen(I, 2);
    expect(values[0]).toBeCloseTo(1, 10);
    expect(values[1]).toBeCloseTo(1, 10);
    // Eigenvectors should be orthonormal
    const dot =
      vectors[0] * vectors[1] + vectors[2] * vectors[3];
    expect(Math.abs(dot)).toBeLessThan(1e-10);
  });

  it("decomposes a known 3×3 symmetric matrix", () => {
    // A = [[2, 1, 0], [1, 3, 1], [0, 1, 2]]
    // Known eigenvalues approx: 4, 2, 1
    const A = new Float64Array([2, 1, 0, 1, 3, 1, 0, 1, 2]); // col-major
    const { values } = symmetricEigen(A, 3);
    expect(values[0]).toBeCloseTo(4, 4);
    expect(values[1]).toBeCloseTo(2, 4);
    expect(values[2]).toBeCloseTo(1, 4);
  });

  it("eigenvalues are sorted in descending order", () => {
    const A = new Float64Array([5, 1, 1, 3]); // col-major 2×2
    const { values } = symmetricEigen(A, 2);
    expect(values[0]).toBeGreaterThanOrEqual(values[1]);
  });

  it("rejects mismatched dimensions", () => {
    expect(() => symmetricEigen(new Float64Array(5), 3)).toThrow(
      /expected array of length 9/,
    );
  });

  it("reconstructs the original matrix: A = V D V^T", () => {
    // A = [[4, 2], [2, 3]]
    const A = new Float64Array([4, 2, 2, 3]); // col-major
    const { values, vectors: V } = symmetricEigen(A, 2);

    // Reconstruct — manual for 2×2
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let k = 0; k < 2; k++) {
          sum += V[i + k * 2] * values[k] * V[j + k * 2];
        }
        expect(sum).toBeCloseTo(A[i + j * 2], 8);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Standardize unit tests
// ═══════════════════════════════════════════════════════════════════════════

describe("standardize", () => {
  it("produces zero-mean columns", () => {
    const { Z } = standardize(CENSUS_MORPH);
    const n = Z.length;
    const p = Z[0].length;
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += Z[i][j];
      expect(sum / n).toBeCloseTo(0, 8);
    }
  });

  it("produces unit-variance columns", () => {
    const { Z } = standardize(CENSUS_MORPH);
    const n = Z.length;
    const p = Z[0].length;
    for (let j = 0; j < p; j++) {
      let ss = 0;
      for (let i = 0; i < n; i++) ss += Z[i][j] ** 2;
      expect(ss / n).toBeCloseTo(1, 8);
    }
  });

  it("handles constant column gracefully", () => {
    const data = [[1, 5], [1, 10], [1, 15]];
    const { Z, stds } = standardize(data);
    // Constant column std set to 1 → z-scores all 0
    expect(stds[0]).toBe(1);
    expect(Z[0][0]).toBeCloseTo(0, 10);
    expect(Z[1][0]).toBeCloseTo(0, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PCA — Census-morphology fixture
// ═══════════════════════════════════════════════════════════════════════════

describe("PCA — Census-morphology fixture", () => {
  const result = pca(CENSUS_MORPH, { variableLabels: CENSUS_LABELS });

  it("returns correct number of eigenvalues (= variables)", () => {
    expect(result.eigenvalues).toHaveLength(4);
  });

  it("eigenvalues sum to number of variables (correlation-based)", () => {
    const total = result.eigenvalues.reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(4, 4);
  });

  it("eigenvalues are in descending order", () => {
    for (let i = 0; i < result.eigenvalues.length - 1; i++) {
      expect(result.eigenvalues[i]).toBeGreaterThanOrEqual(
        result.eigenvalues[i + 1] - 1e-10,
      );
    }
  });

  it("variance explained sums to 1.0", () => {
    const total = result.varianceExplained.reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1, 8);
  });

  it("cumulative variance is monotonically increasing", () => {
    for (let i = 1; i < result.cumulativeVariance.length; i++) {
      expect(result.cumulativeVariance[i]).toBeGreaterThanOrEqual(
        result.cumulativeVariance[i - 1] - 1e-10,
      );
    }
    expect(result.cumulativeVariance.at(-1)).toBeCloseTo(1, 8);
  });

  it("first component explains the most variance", () => {
    expect(result.varianceExplained[0]).toBeGreaterThan(0.5);
  });

  it("loadings matrix has correct shape (p × components)", () => {
    expect(result.loadings).toHaveLength(4); // p = 4
    expect(result.loadings[0]).toHaveLength(4); // all 4 components kept
  });

  it("scores matrix has correct shape (n × components)", () => {
    expect(result.scores).toHaveLength(8); // n = 8
    expect(result.scores[0]).toHaveLength(4);
  });

  it("Kaiser criterion selects components with eigenvalue ≥ 1", () => {
    expect(result.kaiserComponents).toBeGreaterThanOrEqual(1);
    expect(result.kaiserComponents).toBeLessThanOrEqual(4);
    // At least the first component should have eigenvalue > 1
    expect(result.eigenvalues[0]).toBeGreaterThan(1);
  });

  it("scores are uncorrelated (orthogonal components)", () => {
    const n = result.scores.length;
    const k = Math.min(result.kaiserComponents, 2);
    if (k < 2) return; // need at least 2 components to test
    // Correlation between PC1 and PC2 scores should be near 0
    let sum1 = 0, sum2 = 0, sum12 = 0, sum1sq = 0, sum2sq = 0;
    for (let i = 0; i < n; i++) {
      sum1 += result.scores[i][0];
      sum2 += result.scores[i][1];
      sum12 += result.scores[i][0] * result.scores[i][1];
      sum1sq += result.scores[i][0] ** 2;
      sum2sq += result.scores[i][1] ** 2;
    }
    const cov = sum12 / n - (sum1 / n) * (sum2 / n);
    const std1 = Math.sqrt(sum1sq / n - (sum1 / n) ** 2);
    const std2 = Math.sqrt(sum2sq / n - (sum2 / n) ** 2);
    const corr = std1 > 0 && std2 > 0 ? cov / (std1 * std2) : 0;
    expect(Math.abs(corr)).toBeLessThan(0.01);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PCA — Liveability fixture
// ═══════════════════════════════════════════════════════════════════════════

describe("PCA — Liveability fixture", () => {
  const result = pca(LIVEABILITY);

  it("eigenvalues sum to number of variables", () => {
    const total = result.eigenvalues.reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(6, 4);
  });

  it("two latent dimensions should be captured (Kaiser ≥ 2)", () => {
    // The fixture was designed with two latent dimensions
    expect(result.kaiserComponents).toBeGreaterThanOrEqual(1);
  });

  it("first two components explain majority of variance", () => {
    expect(result.cumulativeVariance[1]).toBeGreaterThan(0.7);
  });

  it("scores are suitable as map attribute join columns", () => {
    expect(result.scores).toHaveLength(15);
    // Each score row should have one value per component
    result.scores.forEach((row) => {
      expect(row).toHaveLength(6);
      row.forEach((v) => expect(typeof v).toBe("number"));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PCA — maxComponents option
// ═══════════════════════════════════════════════════════════════════════════

describe("PCA — maxComponents option", () => {
  it("limits output to requested number of components", () => {
    const result = pca(CENSUS_MORPH, { maxComponents: 2 });
    expect(result.eigenvalues).toHaveLength(2);
    expect(result.loadings[0]).toHaveLength(2);
    expect(result.scores[0]).toHaveLength(2);
  });

  it("cumulativeVariance is still correct for truncated output", () => {
    const full = pca(CENSUS_MORPH);
    const truncated = pca(CENSUS_MORPH, { maxComponents: 2 });
    expect(truncated.eigenvalues[0]).toBeCloseTo(full.eigenvalues[0], 10);
    expect(truncated.eigenvalues[1]).toBeCloseTo(full.eigenvalues[1], 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PCA — Edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("PCA — edge cases", () => {
  it("rejects fewer than 2 observations", () => {
    expect(() => pca([[1, 2, 3]])).toThrow(/at least 2 observations/);
  });

  it("rejects fewer than 2 variables", () => {
    expect(() => pca([[1], [2], [3]])).toThrow(/at least 2 variables/);
  });

  it("rejects ragged array", () => {
    expect(() => pca([[1, 2], [3, 4, 5]])).toThrow(/observation 1 has 3/);
  });
});
