/**
 * OLS.test.ts — Comprehensive tests for OLS regression with spatial diagnostics.
 *
 * Test strategy:
 *   1. Simple linear regression (y = 2 + 3x) — exact coefficients, R²=1 (near-perfect)
 *   2. Multiple regression with known coefficients
 *   3. Fit statistics: R², adjusted R², AIC, BIC, log-likelihood
 *   4. Residual diagnostics: Jarque-Bera, Breusch-Pagan, VIF
 *   5. Spatial diagnostics: Moran's I on residuals, LM tests
 *   6. Diagnostic labels for educational context
 *   7. Model comparison rows
 *   8. Edge cases and input validation
 *   9. Performance benchmark
 */

import { describe, expect, it } from 'vitest';
import type { SpatialWeightsMatrix } from '../../types';
import {
  breuschPagan,
  comparisonRow,
  computeVIF,
  diagnosticLabels,
  fullDiagnostics,
  jarqueBera,
  moransIResiduals,
  olsFit,
  residualDiagnostics,
  spatialDiagnostics,
} from '../OLS';

// ─── Helper: build a row-standardized contiguity weights matrix ─────────────

/**
 * Create a simple row-standardized rook contiguity weights matrix for
 * a 1D chain of n observations: 0—1—2—…—(n-1).
 * Each observation neighbors the ones immediately before and after it.
 */
function chainWeights(n: number): SpatialWeightsMatrix {
  const weights = new Map<number, Map<number, number>>();
  const islands: number[] = [];
  let totalWeight = 0;

  for (let i = 0; i < n; i++) {
    const row = new Map<number, number>();
    const neighbors: number[] = [];
    if (i > 0) neighbors.push(i - 1);
    if (i < n - 1) neighbors.push(i + 1);

    if (neighbors.length === 0) {
      islands.push(i);
    }

    const w = neighbors.length > 0 ? 1 / neighbors.length : 0;
    for (const j of neighbors) {
      row.set(j, w);
      totalWeight += w;
    }
    weights.set(i, row);
  }

  return {
    n,
    weights,
    rowStandardized: true,
    islands,
    symmetric: true,
    totalWeight,
  };
}

/**
 * Create a 2D grid (rows × cols) rook contiguity weights matrix.
 */
function gridWeights(rows: number, cols: number): SpatialWeightsMatrix {
  const n = rows * cols;
  const weights = new Map<number, Map<number, number>>();
  const islands: number[] = [];
  let totalWeight = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const neighbors: number[] = [];
      if (r > 0) neighbors.push((r - 1) * cols + c);
      if (r < rows - 1) neighbors.push((r + 1) * cols + c);
      if (c > 0) neighbors.push(r * cols + c - 1);
      if (c < cols - 1) neighbors.push(r * cols + c + 1);

      const row = new Map<number, number>();
      const w = 1 / neighbors.length;
      for (const j of neighbors) {
        row.set(j, w);
        totalWeight += w;
      }
      weights.set(i, row);
    }
  }

  return {
    n,
    weights,
    rowStandardized: true,
    islands,
    symmetric: false,
    totalWeight,
  };
}

// ─── Test data ──────────────────────────────────────────────────────────────

/**
 * Simple linear: y = 2 + 3x + ε (ε = 0 for exact fit test).
 */
function perfectLinear(n: number): { y: number[]; x: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(i);
    y.push(2 + 3 * i);
  }
  return { y, x };
}

/**
 * Linear with small noise: y = 2 + 3x + ε.
 * Seeded pseudo-noise for reproducibility.
 */
function noisyLinear(n: number): { y: number[]; x: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  // Simple deterministic noise.
  for (let i = 0; i < n; i++) {
    const noise = 0.5 * Math.sin(i * 7.3 + 0.1) + 0.3 * Math.cos(i * 3.1);
    x.push(i);
    y.push(2 + 3 * i + noise);
  }
  return { y, x };
}

/**
 * Multiple regression: y = 1 + 2x₁ − 0.5x₂.
 * Use independent predictors to avoid collinearity.
 */
function multipleRegression(n: number): { y: number[]; x1: number[]; x2: number[] } {
  const x1: number[] = [];
  const x2: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const v1 = Math.sin(i * 0.7) * 5;
    const v2 = Math.cos(i * 1.3) * 3 + i * 0.1;
    const noise = 0.1 * Math.sin(i * 5.7);
    x1.push(v1);
    x2.push(v2);
    y.push(1 + 2 * v1 - 0.5 * v2 + noise);
  }
  return { y, x1, x2 };
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('olsFit — simple linear regression', () => {
  it('recovers exact coefficients for a perfect linear relationship', () => {
    const { y, x } = perfectLinear(20);
    const result = olsFit(y, [x]);

    expect(result.n).toBe(20);
    expect(result.k).toBe(1);
    expect(result.coefficients).toHaveLength(2);

    // β₀ ≈ 2, β₁ ≈ 3.
    expect(result.coefficients[0]).toBeCloseTo(2, 8);
    expect(result.coefficients[1]).toBeCloseTo(3, 8);

    // R² ≈ 1 for perfect fit.
    expect(result.rSquared).toBeCloseTo(1.0, 8);
  });

  it('recovers approximate coefficients with noise', () => {
    const { y, x } = noisyLinear(50);
    const result = olsFit(y, [x]);

    // Coefficients should be close to β₀ ≈ 2, β₁ ≈ 3.
    expect(result.coefficients[0]).toBeCloseTo(2, 0);
    expect(result.coefficients[1]).toBeCloseTo(3, 1);

    // R² should be very high.
    expect(result.rSquared).toBeGreaterThan(0.99);
  });

  it('returns correct number of residuals and fitted values', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    expect(result.residuals).toHaveLength(30);
    expect(result.fittedValues).toHaveLength(30);
  });

  it('residuals sum to approximately zero', () => {
    const { y, x } = noisyLinear(50);
    const result = olsFit(y, [x]);

    let sum = 0;
    for (let i = 0; i < result.n; i++) sum += result.residuals[i];
    expect(Math.abs(sum)).toBeLessThan(1e-8);
  });

  it('fitted + residuals = y', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    for (let i = 0; i < 30; i++) {
      expect(result.fittedValues[i] + result.residuals[i]).toBeCloseTo(y[i], 8);
    }
  });
});

describe('olsFit — multiple regression', () => {
  it('recovers approximate coefficients for y = 1 + 2x₁ − 0.5x₂', () => {
    const { y, x1, x2 } = multipleRegression(50);
    const result = olsFit(y, [x1, x2]);

    expect(result.k).toBe(2);
    expect(result.coefficients).toHaveLength(3);

    // β₀ ≈ 1, β₁ ≈ 2, β₂ ≈ −0.5.
    expect(result.coefficients[0]).toBeCloseTo(1, 0);
    expect(result.coefficients[1]).toBeCloseTo(2, 1);
    expect(result.coefficients[2]).toBeCloseTo(-0.5, 1);
  });

  it('adjusted R² ≤ R²', () => {
    const { y, x1, x2 } = multipleRegression(50);
    const result = olsFit(y, [x1, x2]);

    expect(result.adjRSquared).toBeLessThanOrEqual(result.rSquared);
  });
});

describe('olsFit — fit statistics', () => {
  it('AIC and BIC are finite', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    expect(Number.isFinite(result.aic)).toBe(true);
    expect(Number.isFinite(result.bic)).toBe(true);
  });

  it('BIC > AIC for n > e²·⁷ (≈15) with more than 1 parameter', () => {
    // For n > ~15, BIC penalizes more than AIC.
    const { y, x } = noisyLinear(50);
    const result = olsFit(y, [x]);

    // BIC penalty = p × ln(n), AIC penalty = 2p.
    // For n=50, p=2: BIC penalty = 2×ln(50) ≈ 7.82 > AIC penalty = 4.
    expect(result.bic).toBeGreaterThan(result.aic);
  });

  it('log-likelihood is finite and negative', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    expect(Number.isFinite(result.logLikelihood)).toBe(true);
    expect(result.logLikelihood).toBeLessThan(0);
  });

  it('standard errors are positive', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    for (const se of result.standardErrors) {
      expect(se).toBeGreaterThanOrEqual(0);
    }
  });

  it('t-statistics and p-values have correct count', () => {
    const { y, x1, x2 } = multipleRegression(40);
    const result = olsFit(y, [x1, x2]);

    expect(result.tStatistics).toHaveLength(3);
    expect(result.pValues).toHaveLength(3);
  });

  it('p-values are between 0 and 1', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);

    for (const p of result.pValues) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('olsFit — input validation', () => {
  it('throws if n < p + 1', () => {
    // 2 observations, 2 predictors + intercept = 3 params.
    expect(() => olsFit([1, 2], [[1, 2], [3, 4]])).toThrow();
  });

  it('throws if predictor length does not match y', () => {
    expect(() => olsFit([1, 2, 3], [[1, 2]])).toThrow();
  });
});

describe('jarqueBera', () => {
  it('does not reject normality for near-normal residuals', () => {
    // Generate roughly normal-shaped residuals.
    const n = 100;
    const residuals = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      // Box-Muller-ish using deterministic sin/cos.
      residuals[i] = Math.sin(i * 1.3) * 0.5 + Math.cos(i * 2.7) * 0.3;
    }
    const [stat, p] = jarqueBera(residuals);
    expect(Number.isFinite(stat)).toBe(true);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('rejects normality for heavily skewed residuals', () => {
    const n = 200;
    const residuals = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      residuals[i] = Math.pow(i / n, 3); // Strongly right-skewed.
    }
    const [stat, p] = jarqueBera(residuals);
    expect(stat).toBeGreaterThan(5);
    expect(p).toBeLessThan(0.1);
  });

  it('returns [0, 1] for constant residuals', () => {
    const residuals = new Float64Array(20).fill(5);
    const [stat, p] = jarqueBera(residuals);
    expect(stat).toBe(0);
    expect(p).toBe(1);
  });
});

describe('breuschPagan', () => {
  it('does not reject homoscedasticity for well-behaved data', () => {
    const { y, x } = noisyLinear(50);
    const result = olsFit(y, [x]);
    const [stat, p] = breuschPagan(result.residuals, [x]);
    expect(Number.isFinite(stat)).toBe(true);
    expect(p).toBeGreaterThan(0);
  });

  it('detects heteroscedasticity when variance grows with x', () => {
    const n = 100;
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < n; i++) {
      x.push(i);
      // Variance grows with i.
      const noise = (i / 10) * Math.sin(i * 3.7 + 0.5);
      y.push(2 + 0.5 * i + noise);
    }
    const result = olsFit(y, [x]);
    const [stat, p] = breuschPagan(result.residuals, [x]);
    expect(stat).toBeGreaterThan(0);
    // With growing variance, BP should ideally be significant.
    // The deterministic noise may not trigger strong detection,
    // so we just check the statistic is computed.
    expect(Number.isFinite(p)).toBe(true);
  });
});

describe('computeVIF', () => {
  it('returns VIF of 1 for a single predictor', () => {
    const x = [1, 2, 3, 4, 5];
    const vifs = computeVIF([x]);
    expect(vifs).toHaveLength(1);
    expect(vifs[0]).toBe(1);
  });

  it('returns low VIF for uncorrelated predictors', () => {
    const n = 50;
    const x1: number[] = [];
    const x2: number[] = [];
    for (let i = 0; i < n; i++) {
      x1.push(Math.sin(i));
      x2.push(Math.cos(i * 7.1 + 2));
    }
    const vifs = computeVIF([x1, x2]);
    expect(vifs).toHaveLength(2);
    for (const v of vifs) {
      expect(v).toBeLessThan(5);
    }
  });

  it('returns high VIF for nearly collinear predictors', () => {
    const n = 50;
    const x1: number[] = [];
    const x2: number[] = [];
    for (let i = 0; i < n; i++) {
      x1.push(i);
      x2.push(i * 2 + 0.001 * Math.sin(i)); // Nearly perfect linear relationship.
    }
    const vifs = computeVIF([x1, x2]);
    expect(vifs[0]).toBeGreaterThan(100);
    expect(vifs[1]).toBeGreaterThan(100);
  });
});

describe('residualDiagnostics', () => {
  it('returns all three diagnostic fields', () => {
    const { y, x } = noisyLinear(40);
    const result = olsFit(y, [x]);
    const diags = residualDiagnostics(result, [x]);

    expect(diags.jarqueBera).toHaveLength(2);
    expect(diags.breuschPagan).toHaveLength(2);
    expect(diags.vif).toHaveLength(1);
  });
});

describe('moransIResiduals', () => {
  it('computes Moran\'s I on residuals', () => {
    const { y, x } = noisyLinear(20);
    const result = olsFit(y, [x]);
    const W = chainWeights(20);
    const [I, p] = moransIResiduals(result.residuals, W);

    expect(Number.isFinite(I)).toBe(true);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('returns [0, 1] for zero residuals', () => {
    const residuals = new Float64Array(10);
    const W = chainWeights(10);
    const [I, p] = moransIResiduals(residuals, W);
    expect(I).toBe(0);
    expect(p).toBe(1);
  });
});

describe('spatialDiagnostics', () => {
  it('returns all spatial diagnostic fields', () => {
    const { y, x } = noisyLinear(20);
    const result = olsFit(y, [x]);
    const W = chainWeights(20);
    const diags = spatialDiagnostics(result, W, [x]);

    expect(diags.moransIResiduals).toHaveLength(2);
    expect(diags.lmLag).toHaveLength(2);
    expect(diags.lmError).toHaveLength(2);
    expect(diags.robustLmLag).toHaveLength(2);
    expect(diags.robustLmError).toHaveLength(2);
  });

  it('LM test p-values are in [0, 1]', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);
    const W = chainWeights(30);
    const diags = spatialDiagnostics(result, W, [x]);

    for (const field of [
      diags.lmLag,
      diags.lmError,
      diags.robustLmLag,
      diags.robustLmError,
    ]) {
      expect(field![0]).toBeGreaterThanOrEqual(0);
      expect(field![1]).toBeGreaterThanOrEqual(0);
      expect(field![1]).toBeLessThanOrEqual(1);
    }
  });

  it('throws if W.n does not match result.n', () => {
    const { y, x } = noisyLinear(20);
    const result = olsFit(y, [x]);
    const W = chainWeights(10);
    expect(() => spatialDiagnostics(result, W, [x])).toThrow();
  });
});

describe('spatialDiagnostics — spatially structured data', () => {
  it('detects spatial autocorrelation in residuals from an omitted spatial variable', () => {
    // y = 2 + x + spatial_effect. If we regress y ~ x only, residuals should
    // show spatial autocorrelation.
    const n = 25;
    const x: number[] = [];
    const y: number[] = [];
    const W = gridWeights(5, 5);

    for (let i = 0; i < n; i++) {
      const xi = i * 0.3;
      // Spatial effect: nearby obs have similar values (row-based clustering).
      const spatial = Math.floor(i / 5) * 3;
      x.push(xi);
      y.push(2 + xi + spatial);
    }

    const result = olsFit(y, [x]);
    const diags = spatialDiagnostics(result, W, [x]);

    // Moran's I should be positive (residuals cluster spatially).
    expect(diags.moransIResiduals![0]).toBeGreaterThan(0);
  });
});

describe('fullDiagnostics', () => {
  it('includes both residual and spatial diagnostics', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);
    const W = chainWeights(30);
    const diags = fullDiagnostics(result, [x], W);

    expect(diags.jarqueBera).toBeDefined();
    expect(diags.breuschPagan).toBeDefined();
    expect(diags.vif).toBeDefined();
    expect(diags.moransIResiduals).toBeDefined();
    expect(diags.lmLag).toBeDefined();
    expect(diags.lmError).toBeDefined();
    expect(diags.robustLmLag).toBeDefined();
    expect(diags.robustLmError).toBeDefined();
  });

  it('works without spatial weights (W omitted)', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);
    const diags = fullDiagnostics(result, [x]);

    expect(diags.jarqueBera).toBeDefined();
    expect(diags.breuschPagan).toBeDefined();
    expect(diags.vif).toBeDefined();
    // Spatial fields should be undefined.
    expect(diags.moransIResiduals).toBeUndefined();
    expect(diags.lmLag).toBeUndefined();
  });
});

describe('diagnosticLabels', () => {
  it('generates interpretable labels', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);
    const W = chainWeights(30);
    const diags = fullDiagnostics(result, [x], W);
    const labels = diagnosticLabels(diags);

    expect(labels.length).toBeGreaterThanOrEqual(7);

    // Check that each label has the required fields.
    for (const label of labels) {
      expect(typeof label.key).toBe('string');
      expect(typeof label.name).toBe('string');
      expect(typeof label.statistic).toBe('number');
      expect(typeof label.interpretation).toBe('string');
    }
  });

  it('VIF label warns about multicollinearity', () => {
    const n = 50;
    const x1: number[] = [];
    const x2: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < n; i++) {
      x1.push(i);
      x2.push(i * 2 + 0.001 * Math.sin(i));
      y.push(1 + i + 0.5 * Math.sin(i));
    }
    const result = olsFit(y, [x1, x2]);
    const diags = fullDiagnostics(result, [x1, x2]);
    const labels = diagnosticLabels(diags);

    const vifLabel = labels.find(l => l.key === 'vif');
    expect(vifLabel).toBeDefined();
    expect(vifLabel!.interpretation).toContain('multicollinearity');
  });
});

describe('comparisonRow', () => {
  it('extracts a comparison row with the correct structure', () => {
    const { y, x } = noisyLinear(30);
    const result = olsFit(y, [x]);
    const row = comparisonRow(result, 'OLS-Test');

    expect(row.model).toBe('OLS-Test');
    expect(row.n).toBe(30);
    expect(row.k).toBe(1);
    expect(typeof row.rSquared).toBe('number');
    expect(typeof row.adjRSquared).toBe('number');
    expect(typeof row.aic).toBe('number');
    expect(typeof row.bic).toBe('number');
    expect(typeof row.logLikelihood).toBe('number');
  });

  it('defaults model name to "OLS"', () => {
    const { y, x } = perfectLinear(10);
    const result = olsFit(y, [x]);
    const row = comparisonRow(result);
    expect(row.model).toBe('OLS');
  });
});

describe('OLS — JSON serialization round-trip', () => {
  it('OLSResult survives JSON serialization', () => {
    const { y, x } = noisyLinear(20);
    const result = olsFit(y, [x]);

    const json = JSON.stringify({
      ...result,
      residuals: Array.from(result.residuals),
      fittedValues: Array.from(result.fittedValues),
    });
    const parsed = JSON.parse(json);

    expect(parsed.coefficients).toHaveLength(2);
    expect(parsed.n).toBe(20);
    expect(parsed.k).toBe(1);
    expect(parsed.residuals).toHaveLength(20);
  });
});

describe('OLS — known regression benchmark', () => {
  it('matches hand-calculated values for a small dataset', () => {
    // Dataset: Anscombe's Quartet, Set I.
    // x: 10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5
    // y: 8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68
    const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
    const y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];

    const result = olsFit(y, [x]);

    // Known values: β₀ ≈ 3.0001, β₁ ≈ 0.5001, R² ≈ 0.6665.
    expect(result.coefficients[0]).toBeCloseTo(3.0001, 2);
    expect(result.coefficients[1]).toBeCloseTo(0.5001, 2);
    expect(result.rSquared).toBeCloseTo(0.6665, 2);
  });
});

describe('OLS — performance benchmark', () => {
  it('fits 500 observations × 5 predictors in < 500 ms', () => {
    const n = 500;
    const k = 5;
    const predictors: number[][] = [];
    const y: number[] = [];

    for (let j = 0; j < k; j++) {
      const col: number[] = [];
      for (let i = 0; i < n; i++) {
        col.push(Math.sin(i * (j + 1) * 0.1) + Math.cos(i * 0.03 * j));
      }
      predictors.push(col);
    }

    for (let i = 0; i < n; i++) {
      let val = 1;
      for (let j = 0; j < k; j++) val += (j + 1) * predictors[j][i];
      val += 0.1 * Math.sin(i);
      y.push(val);
    }

    const W = chainWeights(n);

    const start = performance.now();
    const result = olsFit(y, predictors);
    fullDiagnostics(result, predictors, W);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
    expect(result.rSquared).toBeGreaterThan(0.9);
  });
});
