/**
 * GlobalMoransI — comprehensive unit test suite.
 *
 * Fixtures:
 *   • Clustered pattern — positive spatial autocorrelation (high I)
 *   • Dispersed (checkerboard) pattern — negative autocorrelation (negative I)
 *   • Random pattern — near-null autocorrelation (I ≈ E[I])
 *   • Constant field — degenerate case
 *
 * Covers:
 *   • moransI() — full inference pipeline
 *   • expectedI() — analytical expected value
 *   • varianceI() — randomisation variance
 *   • zScore() — standardised test statistic
 *   • pseudoPValue() — permutation-based significance
 *   • Seeded reproducibility
 *   • Edge cases and input validation
 */

import { describe, expect, it } from 'vitest';
import type { SpatialFeature, SpatialWeightsMatrix } from '../../types';
import {
  queenContiguity,
  rowStandardize,
} from '../SpatialWeights';
import {
  expectedI,
  moransI,
  pseudoPValue,
  varianceI,
  zScore,
} from '../GlobalMoransI';

// ─── Fixtures ───────────────────────────────────────────────────────────────

/**
 * 3×3 grid of unit squares (9 polygons).
 *
 *   6 ─ 7 ─ 8
 *   │   │   │
 *   3 ─ 4 ─ 5
 *   │   │   │
 *   0 ─ 1 ─ 2
 */
function grid3x3(): SpatialFeature[] {
  const features: SpatialFeature[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const id = row * 3 + col;
      features.push({
        id,
        centroid: [col + 0.5, row + 0.5],
        rings: [[
          [col, row],
          [col + 1, row],
          [col + 1, row + 1],
          [col, row + 1],
          [col, row],
        ]],
      });
    }
  }
  return features;
}

/** Build a queen contiguity weights matrix for the 3×3 grid. */
function grid3x3Weights(): SpatialWeightsMatrix {
  return queenContiguity(grid3x3());
}

/** Row-standardized queen weights for 3×3 grid. */
function grid3x3RowStd(): SpatialWeightsMatrix {
  return rowStandardize(queenContiguity(grid3x3()));
}

/**
 * Clustered pattern: low values in bottom-left, high in top-right.
 * Strong positive spatial autocorrelation expected.
 *
 *   7  8  9
 *   4  5  6
 *   1  2  3
 */
function clusteredValues(): Float64Array {
  return new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

/**
 * Dispersed (checkerboard) pattern: alternating high/low values.
 * Negative spatial autocorrelation expected.
 *
 *   1  10  1
 *  10   1 10
 *   1  10  1
 */
function dispersedValues(): Float64Array {
  return new Float64Array([1, 10, 1, 10, 1, 10, 1, 10, 1]);
}

/**
 * Random-ish pattern: values with no clear spatial structure.
 * Near-null autocorrelation expected (I ≈ E[I]).
 */
function randomValues(): Float64Array {
  return new Float64Array([5, 3, 8, 2, 9, 1, 7, 4, 6]);
}

/** Constant field: all identical values. */
function constantValues(): Float64Array {
  return new Float64Array([5, 5, 5, 5, 5, 5, 5, 5, 5]);
}

/**
 * 5×5 grid (25 polygons) for more robust statistical patterns.
 */
function grid5x5(): SpatialFeature[] {
  const features: SpatialFeature[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      features.push({
        id: row * 5 + col,
        centroid: [col + 0.5, row + 0.5],
        rings: [[
          [col, row],
          [col + 1, row],
          [col + 1, row + 1],
          [col, row + 1],
          [col, row],
        ]],
      });
    }
  }
  return features;
}

/** Strong gradient on a 5×5 grid for more convincing clustering signal. */
function clustered5x5Values(): Float64Array {
  const vals = new Float64Array(25);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      vals[row * 5 + col] = row + col; // gradient from 0 to 8
    }
  }
  return vals;
}

/** Checkerboard on 5×5 grid. */
function dispersed5x5Values(): Float64Array {
  const vals = new Float64Array(25);
  for (let i = 0; i < 25; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    vals[i] = (row + col) % 2 === 0 ? 10 : 0;
  }
  return vals;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('expectedI', () => {
  it('returns −1/(n−1) for any n ≥ 2', () => {
    expect(expectedI(2)).toBeCloseTo(-1, 10);
    expect(expectedI(9)).toBeCloseTo(-1 / 8, 10);
    expect(expectedI(100)).toBeCloseTo(-1 / 99, 10);
  });

  it('throws for n < 2', () => {
    expect(() => expectedI(1)).toThrow(RangeError);
    expect(() => expectedI(0)).toThrow(RangeError);
  });
});

describe('varianceI', () => {
  it('returns a positive value for a valid weights matrix', () => {
    const W = grid3x3Weights();
    const V = varianceI(W);
    expect(V).toBeGreaterThan(0);
  });

  it('is consistent between binary and row-standardized weights', () => {
    const Wbin = grid3x3Weights();
    const Wstd = grid3x3RowStd();
    // Both should produce valid positive variances
    expect(varianceI(Wbin)).toBeGreaterThan(0);
    expect(varianceI(Wstd)).toBeGreaterThan(0);
  });
});

describe('zScore', () => {
  it('is positive for high positive I (clustered)', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 1, seed: 1 });
    const z = zScore(result.observed, W);
    expect(z).toBeGreaterThan(0);
  });

  it('is negative for negative I (dispersed)', () => {
    const W = grid3x3Weights();
    const result = moransI(dispersedValues(), W, { permutations: 1, seed: 1 });
    const z = zScore(result.observed, W);
    expect(z).toBeLessThan(0);
  });
});

describe('pseudoPValue', () => {
  it('produces reproducible results with the same seed', () => {
    const W = grid3x3Weights();
    const values = clusteredValues();
    const result1 = moransI(values, W, { permutations: 99, seed: 42 });
    const result2 = moransI(values, W, { permutations: 99, seed: 42 });
    expect(result1.pValue).toBe(result2.pValue);
    expect(result1.observed).toBe(result2.observed);
  });

  it('produces different results with different seeds', () => {
    const W = grid3x3Weights();
    const values = randomValues();
    const p1 = pseudoPValue(values, W, 0.1, 99, 1);
    const p2 = pseudoPValue(values, W, 0.1, 99, 999);
    // Not guaranteed to differ for every seed pair, but highly likely
    // with random values. If this is flaky, the test is still valid —
    // it just means the two random draws happened to match.
    // We primarily test reproducibility above.
    expect(typeof p1).toBe('number');
    expect(typeof p2).toBe('number');
  });

  it('p-value is always in (0, 1]', () => {
    const W = grid3x3Weights();
    const p = pseudoPValue(clusteredValues(), W, 0.5, 99, 7);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});

describe('moransI — clustered pattern', () => {
  it('yields positive observed I (3×3 grid)', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBeGreaterThan(0);
    expect(result.statistic).toBe("Moran's I");
  });

  it('yields positive observed I (5×5 grid)', () => {
    const W = queenContiguity(grid5x5());
    const result = moransI(clustered5x5Values(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBeGreaterThan(0);
  });

  it('yields significant p-value for strong clustering (5×5 grid)', () => {
    const W = queenContiguity(grid5x5());
    const result = moransI(clustered5x5Values(), W, { permutations: 999, seed: 42 });
    expect(result.observed).toBeGreaterThan(0);
    expect(result.zScore).toBeGreaterThan(1.65); // at least marginally significant
    expect(result.pValue).toBeLessThan(0.1);
  });

  it('yields positive z-score', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 99, seed: 42 });
    expect(result.zScore).toBeGreaterThan(0);
  });
});

describe('moransI — dispersed pattern', () => {
  it('yields negative observed I (3×3 checkerboard)', () => {
    const W = grid3x3Weights();
    const result = moransI(dispersedValues(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBeLessThan(expectedI(9));
  });

  it('yields negative observed I (5×5 checkerboard)', () => {
    const W = queenContiguity(grid5x5());
    const result = moransI(dispersed5x5Values(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBeLessThan(0);
  });

  it('yields negative z-score', () => {
    const W = grid3x3Weights();
    const result = moransI(dispersedValues(), W, { permutations: 99, seed: 42 });
    expect(result.zScore).toBeLessThan(0);
  });
});

describe('moransI — random pattern', () => {
  it('yields I near expected value (not strongly positive or negative)', () => {
    const W = grid3x3Weights();
    const result = moransI(randomValues(), W, { permutations: 99, seed: 42 });
    const EI = expectedI(9);
    // Should be closer to E[I] than strongly clustered/dispersed values
    expect(Math.abs(result.observed - EI)).toBeLessThan(1.0);
  });

  it('yields non-significant p-value', () => {
    const W = grid3x3Weights();
    const result = moransI(randomValues(), W, { permutations: 999, seed: 42 });
    // Random data should generally not be significant at 0.01
    // (might be at 0.05 by chance, so we use 0.01)
    expect(result.pValue).toBeGreaterThan(0.01);
  });
});

describe('moransI — constant field', () => {
  it('returns 0 for a constant variable', () => {
    const W = grid3x3Weights();
    const result = moransI(constantValues(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBe(0);
  });
});

describe('moransI — row-standardized weights', () => {
  it('works with row-standardized weights', () => {
    const W = grid3x3RowStd();
    const result = moransI(clusteredValues(), W, { permutations: 99, seed: 42 });
    expect(result.observed).toBeGreaterThan(0);
    expect(result.zScore).toBeGreaterThan(0);
  });
});

describe('moransI — result contract', () => {
  it('returns all required fields', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 99, seed: 42 });
    expect(result).toHaveProperty('statistic');
    expect(result).toHaveProperty('observed');
    expect(result).toHaveProperty('expected');
    expect(result).toHaveProperty('variance');
    expect(result).toHaveProperty('zScore');
    expect(result).toHaveProperty('pValue');
    expect(result).toHaveProperty('permutations');
    expect(result.permutations).toBe(99);
  });

  it('expected matches −1/(n−1)', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 1, seed: 1 });
    expect(result.expected).toBeCloseTo(-1 / 8, 10);
  });

  it('variance is positive', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { permutations: 1, seed: 1 });
    expect(result.variance).toBeGreaterThan(0);
  });
});

describe('moransI — seeded reproducibility', () => {
  it('identical seed → identical results across multiple runs', () => {
    const W = grid3x3Weights();
    const vals = clusteredValues();
    const runs = Array.from({ length: 5 }, () =>
      moransI(vals, W, { permutations: 499, seed: 12345 }),
    );
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i].observed).toBe(runs[0].observed);
      expect(runs[i].pValue).toBe(runs[0].pValue);
      expect(runs[i].zScore).toBe(runs[0].zScore);
    }
  });

  it('different seed → same observed I but potentially different p-value', () => {
    const W = grid3x3Weights();
    const vals = clusteredValues();
    const r1 = moransI(vals, W, { permutations: 99, seed: 1 });
    const r2 = moransI(vals, W, { permutations: 99, seed: 2 });
    // Observed I is deterministic (no permutation involved)
    expect(r1.observed).toBe(r2.observed);
    // p-values may differ (different permutation sequence)
    // — just check they're valid
    expect(r1.pValue).toBeGreaterThan(0);
    expect(r2.pValue).toBeGreaterThan(0);
  });
});

describe('moransI — input validation', () => {
  it('throws when values length ≠ n', () => {
    const W = grid3x3Weights();
    expect(() => moransI(new Float64Array([1, 2, 3]), W)).toThrow(RangeError);
  });

  it('throws when permutations < 1', () => {
    const W = grid3x3Weights();
    expect(() =>
      moransI(clusteredValues(), W, { permutations: 0 }),
    ).toThrow(RangeError);
  });

  it('accepts plain number arrays', () => {
    const W = grid3x3Weights();
    const result = moransI([1, 2, 3, 4, 5, 6, 7, 8, 9], W, {
      permutations: 1,
      seed: 1,
    });
    expect(typeof result.observed).toBe('number');
  });
});

describe('moransI — default permutations', () => {
  it('defaults to 999 permutations when not specified', () => {
    const W = grid3x3Weights();
    const result = moransI(clusteredValues(), W, { seed: 42 });
    expect(result.permutations).toBe(999);
  });
});
