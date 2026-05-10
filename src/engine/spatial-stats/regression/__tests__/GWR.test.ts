/**
 * GWR — Geographically Weighted Regression test suite.
 *
 * Covers kernel functions, bandwidth selection, local coefficient
 * estimation, parameter surfaces, sync/async equivalence, input
 * validation, and a performance benchmark.
 */

import { describe, expect, it } from 'vitest';
import type { Coordinate } from '@/engine/spatial-stats/types';
import {
  gwrFit,
  gwrFitSync,
  gwrParameterSurfaces,
  kernelWeight,
} from '@/engine/spatial-stats/regression/GWR';

// ─── Test data generators ───────────────────────────────────────────────────

/**
 * Generate data on a rows×cols grid where the true relationship is
 * constant: y = 2 + 3x + ε.  GWR with a large bandwidth should
 * recover coefficients close to OLS.
 */
function constantRelationship(rows: number, cols: number) {
  const n = rows * cols;
  const coords: Coordinate[] = [];
  const x1 = new Float64Array(n);
  const y = new Float64Array(n);
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      coords.push([c, r]);
      x1[idx] = Math.sin(idx * 0.7) * 3 + idx * 0.1;
      const noise = 0.05 * Math.sin(idx * 1.3 + 0.5);
      y[idx] = 2 + 3 * x1[idx] + noise;
      idx++;
    }
  }
  return { coords, predictors: [x1], y, n };
}

/**
 * Generate data on a rows×cols grid with spatially varying coefficients:
 *   β₀(c,r) = 1 + 0.5c    (intercept increases with column)
 *   β₁(c,r) = 3 − 0.3r    (slope decreases with row)
 *
 * This is the key test for GWR's ability to detect spatial non-stationarity.
 */
function spatiallyVaryingData(rows: number, cols: number) {
  const n = rows * cols;
  const coords: Coordinate[] = [];
  const x1 = new Float64Array(n);
  const y = new Float64Array(n);
  const trueIntercept = new Float64Array(n);
  const trueSlope = new Float64Array(n);
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      coords.push([c, r]);
      x1[idx] = Math.sin(idx * 0.7) * 3 + idx * 0.1;
      trueIntercept[idx] = 1 + 0.5 * c;
      trueSlope[idx] = 3 - 0.3 * r;
      const noise = 0.05 * Math.sin(idx * 1.3 + 0.5);
      y[idx] = trueIntercept[idx] + trueSlope[idx] * x1[idx] + noise;
      idx++;
    }
  }
  return { coords, predictors: [x1], y, n, trueIntercept, trueSlope };
}

// ─── Kernel tests ───────────────────────────────────────────────────────────

describe('kernelWeight', () => {
  it('gaussian: weight = 1 at distance 0', () => {
    expect(kernelWeight(0, 10, 'gaussian')).toBeCloseTo(1, 10);
  });

  it('gaussian: decreases with distance', () => {
    const w1 = kernelWeight(1, 10, 'gaussian');
    const w5 = kernelWeight(5, 10, 'gaussian');
    expect(w1).toBeGreaterThan(w5);
    expect(w5).toBeGreaterThan(0);
  });

  it('bisquare: weight = 1 at distance 0', () => {
    expect(kernelWeight(0, 10, 'bisquare')).toBeCloseTo(1, 10);
  });

  it('bisquare: exactly 0 beyond bandwidth', () => {
    expect(kernelWeight(10, 10, 'bisquare')).toBe(0);
    expect(kernelWeight(11, 10, 'bisquare')).toBe(0);
  });

  it('bisquare: positive within bandwidth', () => {
    expect(kernelWeight(5, 10, 'bisquare')).toBeGreaterThan(0);
    expect(kernelWeight(9.99, 10, 'bisquare')).toBeGreaterThan(0);
  });

  it('exponential: weight = 1 at distance 0', () => {
    expect(kernelWeight(0, 10, 'exponential')).toBeCloseTo(1, 10);
  });

  it('exponential: decreases with distance', () => {
    const w1 = kernelWeight(1, 10, 'exponential');
    const w5 = kernelWeight(5, 10, 'exponential');
    expect(w1).toBeGreaterThan(w5);
    expect(w5).toBeGreaterThan(0);
  });

  it('returns 0 for non-positive bandwidth', () => {
    expect(kernelWeight(1, 0, 'gaussian')).toBe(0);
    expect(kernelWeight(1, -1, 'bisquare')).toBe(0);
  });
});

// ─── Constant relationship (GWR ≈ OLS) ─────────────────────────────────────

describe('constant relationship', () => {
  const { coords, predictors, y, n } = constantRelationship(6, 6);

  it('gaussian: local coefficients are nearly constant', () => {
    const result = gwrFitSync(y, predictors, coords, {
      kernel: 'gaussian',
      bandwidth: 100, // very large → approaches OLS
    });
    for (let i = 0; i < n; i++) {
      expect(result.localCoefficients[i][0]).toBeCloseTo(2, 0); // intercept ≈ 2
      expect(result.localCoefficients[i][1]).toBeCloseTo(3, 0); // slope ≈ 3
    }
  });

  it('bisquare: local coefficients are nearly constant', () => {
    const result = gwrFitSync(y, predictors, coords, {
      kernel: 'bisquare',
      bandwidth: 100,
    });
    for (let i = 0; i < n; i++) {
      expect(result.localCoefficients[i][0]).toBeCloseTo(2, 0);
      expect(result.localCoefficients[i][1]).toBeCloseTo(3, 0);
    }
  });

  it('exponential: local coefficients are nearly constant', () => {
    const result = gwrFitSync(y, predictors, coords, {
      kernel: 'exponential',
      bandwidth: 100,
    });
    for (let i = 0; i < n; i++) {
      expect(result.localCoefficients[i][0]).toBeCloseTo(2, 0);
      expect(result.localCoefficients[i][1]).toBeCloseTo(3, 0);
    }
  });
});

// ─── Spatially varying coefficients ─────────────────────────────────────────

describe('spatially varying coefficients', () => {
  const data = spatiallyVaryingData(7, 7);
  // Use a moderate bandwidth so spatial variation is captured
  const result = gwrFitSync(data.y, data.predictors, data.coords, {
    kernel: 'bisquare',
    bandwidth: 4,
  });

  it('intercept increases with column (x-coordinate)', () => {
    // Compare average intercept in left (cols 0-2) vs right (cols 4-6) columns
    let leftSum = 0;
    let leftCount = 0;
    let rightSum = 0;
    let rightCount = 0;
    for (let i = 0; i < data.n; i++) {
      const col = data.coords[i][0];
      if (col <= 2) {
        leftSum += result.localCoefficients[i][0];
        leftCount++;
      } else if (col >= 4) {
        rightSum += result.localCoefficients[i][0];
        rightCount++;
      }
    }
    expect(rightSum / rightCount).toBeGreaterThan(leftSum / leftCount);
  });

  it('slope decreases with row (y-coordinate)', () => {
    let topSum = 0;
    let topCount = 0;
    let bottomSum = 0;
    let bottomCount = 0;
    for (let i = 0; i < data.n; i++) {
      const row = data.coords[i][1];
      if (row <= 2) {
        topSum += result.localCoefficients[i][1];
        topCount++;
      } else if (row >= 4) {
        bottomSum += result.localCoefficients[i][1];
        bottomCount++;
      }
    }
    // True slope = 3 - 0.3*row, so top (low row) has higher slope
    expect(topSum / topCount).toBeGreaterThan(bottomSum / bottomCount);
  });

  it('coefficient variation exceeds threshold', () => {
    // Intercept should vary meaningfully across locations
    const intercepts = result.localCoefficients.map((c) => c[0]);
    const min = Math.min(...intercepts);
    const max = Math.max(...intercepts);
    expect(max - min).toBeGreaterThan(0.5);

    // Slope should vary too
    const slopes = result.localCoefficients.map((c) => c[1]);
    const slopeMin = Math.min(...slopes);
    const slopeMax = Math.max(...slopes);
    expect(slopeMax - slopeMin).toBeGreaterThan(0.3);
  });
});

// ─── Bandwidth selection ────────────────────────────────────────────────────

describe('bandwidth selection', () => {
  const data = spatiallyVaryingData(6, 6);

  it('converges to a finite positive value', () => {
    const result = gwrFitSync(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
    });
    expect(result.bandwidth).toBeGreaterThan(0);
    expect(isFinite(result.bandwidth)).toBe(true);
  });

  it('produces finite AICc', () => {
    const result = gwrFitSync(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
    });
    expect(isFinite(result.aicc)).toBe(true);
  });

  it('selected bandwidth lies within plausible range', () => {
    const result = gwrFitSync(data.y, data.predictors, data.coords, {
      kernel: 'gaussian',
    });
    // Should be between min neighbor distance and max pairwise distance
    expect(result.bandwidth).toBeGreaterThan(0.5);
    const maxDist = Math.sqrt(5 * 5 + 5 * 5); // diagonal of 6×6 grid
    expect(result.bandwidth).toBeLessThanOrEqual(maxDist * 1.1);
  });
});

// ─── Result structure ───────────────────────────────────────────────────────

describe('result structure', () => {
  const data = constantRelationship(5, 5);
  const result = gwrFitSync(data.y, data.predictors, data.coords, {
    kernel: 'bisquare',
    bandwidth: 10,
  });

  it('has correct dimension for local coefficients', () => {
    expect(result.localCoefficients.length).toBe(data.n);
    expect(result.localCoefficients[0].length).toBe(2); // intercept + 1 predictor
  });

  it('has correct dimension for local SE and t', () => {
    expect(result.localStandardErrors.length).toBe(data.n);
    expect(result.localTStatistics.length).toBe(data.n);
    expect(result.localStandardErrors[0].length).toBe(2);
    expect(result.localTStatistics[0].length).toBe(2);
  });

  it('residuals + fitted = y', () => {
    for (let i = 0; i < data.n; i++) {
      expect(result.residuals[i] + result.fittedValues[i]).toBeCloseTo(
        data.y[i],
        10,
      );
    }
  });

  it('hatDiag entries are positive', () => {
    for (let i = 0; i < data.n; i++) {
      expect(result.hatDiag[i]).toBeGreaterThan(0);
    }
  });

  it('effectiveParams > k+1', () => {
    // GWR should use more effective parameters than OLS (p = k+1 = 2)
    expect(result.effectiveParams).toBeGreaterThan(2);
  });

  it('sigma2 is positive', () => {
    expect(result.sigma2).toBeGreaterThan(0);
  });

  it('n and k are correct', () => {
    expect(result.n).toBe(data.n);
    expect(result.k).toBe(1);
  });
});

// ─── Local R² ───────────────────────────────────────────────────────────────

describe('local R²', () => {
  const data = constantRelationship(6, 6);
  const result = gwrFitSync(data.y, data.predictors, data.coords, {
    kernel: 'bisquare',
    bandwidth: 10,
  });

  it('values are in [0, 1]', () => {
    for (let i = 0; i < data.n; i++) {
      expect(result.localRSquared[i]).toBeGreaterThanOrEqual(0);
      expect(result.localRSquared[i]).toBeLessThanOrEqual(1);
    }
  });

  it('high R² for strongly linear data', () => {
    const mean =
      result.localRSquared.reduce((a, b) => a + b, 0) / data.n;
    expect(mean).toBeGreaterThan(0.9);
  });
});

// ─── Parameter surfaces ─────────────────────────────────────────────────────

describe('gwrParameterSurfaces', () => {
  const data = spatiallyVaryingData(6, 6);
  const result = gwrFitSync(data.y, data.predictors, data.coords, {
    kernel: 'bisquare',
    bandwidth: 4,
  });

  it('returns one surface per parameter', () => {
    const surfaces = gwrParameterSurfaces(result);
    expect(surfaces.length).toBe(2); // intercept + 1 predictor
  });

  it('default labels: Intercept, β1', () => {
    const surfaces = gwrParameterSurfaces(result);
    expect(surfaces[0].name).toBe('Intercept');
    expect(surfaces[1].name).toBe('β1');
  });

  it('custom labels', () => {
    const surfaces = gwrParameterSurfaces(result, ['Const', 'Income']);
    expect(surfaces[0].name).toBe('Const');
    expect(surfaces[1].name).toBe('Income');
  });

  it('surfaces have correct length', () => {
    const surfaces = gwrParameterSurfaces(result);
    for (const s of surfaces) {
      expect(s.coefficients.length).toBe(data.n);
      expect(s.standardErrors.length).toBe(data.n);
      expect(s.tStatistics.length).toBe(data.n);
    }
  });

  it('summary min ≤ mean ≤ max', () => {
    const surfaces = gwrParameterSurfaces(result);
    for (const s of surfaces) {
      expect(s.summary.min).toBeLessThanOrEqual(s.summary.mean);
      expect(s.summary.mean).toBeLessThanOrEqual(s.summary.max);
      expect(s.summary.std).toBeGreaterThanOrEqual(0);
    }
  });

  it('coefficients match GWRResult values', () => {
    const surfaces = gwrParameterSurfaces(result);
    for (let i = 0; i < data.n; i++) {
      expect(surfaces[0].coefficients[i]).toBe(
        result.localCoefficients[i][0],
      );
      expect(surfaces[1].coefficients[i]).toBe(
        result.localCoefficients[i][1],
      );
    }
  });
});

// ─── Input validation ───────────────────────────────────────────────────────

describe('input validation', () => {
  it('throws on coords length mismatch', () => {
    expect(() =>
      gwrFitSync(new Float64Array(5), [new Float64Array(5)], [
        [0, 0],
        [1, 1],
      ]),
    ).toThrow(/coords length/);
  });

  it('throws on predictor length mismatch', () => {
    const coords: Coordinate[] = Array.from({ length: 10 }, (_, i) => [
      i,
      0,
    ]);
    expect(() =>
      gwrFitSync(new Float64Array(10), [new Float64Array(8)], coords),
    ).toThrow(/predictor\[0\] length/);
  });

  it('throws on too few observations', () => {
    const coords: Coordinate[] = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    expect(() =>
      gwrFitSync(new Float64Array(3), [new Float64Array(3)], coords),
    ).toThrow(/observations/);
  });
});

// ─── Async / sync equivalence ───────────────────────────────────────────────

describe('gwrFit async', () => {
  const data = constantRelationship(5, 5);

  it('returns results equivalent to gwrFitSync', async () => {
    const syncResult = gwrFitSync(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
      bandwidth: 10,
    });
    // In test env, Worker is unavailable → falls back to sync
    const asyncResult = await gwrFit(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
      bandwidth: 10,
    });

    expect(asyncResult.bandwidth).toBe(syncResult.bandwidth);
    expect(asyncResult.aicc).toBeCloseTo(syncResult.aicc, 8);
    expect(asyncResult.n).toBe(syncResult.n);

    for (let i = 0; i < data.n; i++) {
      expect(asyncResult.localCoefficients[i][0]).toBeCloseTo(
        syncResult.localCoefficients[i][0],
        10,
      );
      expect(asyncResult.residuals[i]).toBeCloseTo(
        syncResult.residuals[i],
        10,
      );
    }
  });

  it('works with useWorker: false', async () => {
    const result = await gwrFit(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
      bandwidth: 10,
      useWorker: false,
    });
    expect(result.n).toBe(data.n);
    expect(result.localCoefficients.length).toBe(data.n);
  });
});

// ─── Serialization ──────────────────────────────────────────────────────────

describe('serialization', () => {
  it('localCoefficients and key fields survive JSON round-trip', () => {
    const data = constantRelationship(5, 5);
    const result = gwrFitSync(data.y, data.predictors, data.coords, {
      kernel: 'bisquare',
      bandwidth: 10,
    });

    const json = JSON.stringify({
      localCoefficients: result.localCoefficients,
      bandwidth: result.bandwidth,
      kernel: result.kernel,
      aicc: result.aicc,
      n: result.n,
      k: result.k,
    });
    const parsed = JSON.parse(json);

    expect(parsed.localCoefficients.length).toBe(result.n);
    expect(parsed.bandwidth).toBe(result.bandwidth);
    expect(parsed.kernel).toBe(result.kernel);
  });
});

// ─── Multiple predictors ───────────────────────────────────────────────────

describe('multiple predictors', () => {
  it('handles two predictors correctly', () => {
    const n = 36;
    const coords: Coordinate[] = [];
    const x1 = new Float64Array(n);
    const x2 = new Float64Array(n);
    const y = new Float64Array(n);
    let idx = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        coords.push([c, r]);
        x1[idx] = Math.sin(idx * 0.5) * 2;
        x2[idx] = Math.cos(idx * 0.8) * 3;
        y[idx] = 1 + 2 * x1[idx] - 0.5 * x2[idx] + 0.05 * Math.sin(idx);
        idx++;
      }
    }

    const result = gwrFitSync(y, [x1, x2], coords, {
      kernel: 'bisquare',
      bandwidth: 10,
    });

    expect(result.localCoefficients[0].length).toBe(3); // intercept + 2
    expect(result.k).toBe(2);
    // With large bandwidth, should be close to true values
    for (let i = 0; i < n; i++) {
      expect(result.localCoefficients[i][0]).toBeCloseTo(1, 0);
      expect(result.localCoefficients[i][1]).toBeCloseTo(2, 0);
      expect(result.localCoefficients[i][2]).toBeCloseTo(-0.5, 0);
    }
  });
});

// ─── Performance benchmark ──────────────────────────────────────────────────

describe('performance', () => {
  it('10×10 grid (100 obs) with bandwidth selection < 5000ms', () => {
    const n = 100;
    const coords: Coordinate[] = [];
    const x1 = new Float64Array(n);
    const y = new Float64Array(n);
    let idx = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        coords.push([c, r]);
        x1[idx] = idx * 0.1;
        y[idx] = 2 + 3 * x1[idx] + 0.1 * Math.sin(idx);
        idx++;
      }
    }

    const t0 = performance.now();
    const result = gwrFitSync(y, [x1], coords, { kernel: 'bisquare' });
    const elapsed = performance.now() - t0;

    expect(elapsed).toBeLessThan(5000);
    expect(result.n).toBe(n);
    expect(isFinite(result.bandwidth)).toBe(true);
    expect(isFinite(result.aicc)).toBe(true);
  });
});
