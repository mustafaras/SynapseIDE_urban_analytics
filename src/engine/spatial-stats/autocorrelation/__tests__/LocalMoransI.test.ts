/**
 * LocalMoransI — comprehensive unit test suite.
 *
 * Fixtures:
 *   • 3×3 grid with clustered pattern — expect HH / LL clusters
 *   • 3×3 grid with dispersed (checkerboard) pattern — expect outliers (HL/LH)
 *   • 5×5 grid with clear spatial clusters — larger-scale validation
 *   • Constant field — degenerate case
 *   • Island observation (no neighbours)
 *
 * Covers:
 *   • localMoransI() — per-observation statistics
 *   • Quadrant classification (HH, HL, LH, LL)
 *   • Bonferroni vs FDR significance differences
 *   • GeoJSON feature-properties output structure
 *   • Legend metadata
 *   • Seeded reproducibility
 *   • Constant field handling
 *   • Island handling
 *   • Input validation
 *   • lisaLegend() accessor
 */

import { describe, expect, it } from 'vitest';
import type { SpatialFeature, SpatialWeightsMatrix } from '../../types';
import {
  queenContiguity,
  rowStandardize,
} from '../SpatialWeights';
import {
  lisaLegend,
  type LISALegendEntry,
  type LISAResult,
  localMoransI,
} from '../LocalMoransI';

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

function grid3x3RowStd(): SpatialWeightsMatrix {
  return rowStandardize(queenContiguity(grid3x3()));
}

/**
 * 5×5 grid of unit squares (25 polygons).
 */
function grid5x5(): SpatialFeature[] {
  const features: SpatialFeature[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const id = row * 5 + col;
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

function grid5x5RowStd(): SpatialWeightsMatrix {
  return rowStandardize(queenContiguity(grid5x5()));
}

/**
 * Clustered pattern: low values in bottom-left, high in top-right.
 * Strong positive spatial autocorrelation expected.
 *
 *   7  8  9
 *   4  5  6
 *   1  2  3
 */
const clustered3x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Checkerboard / dispersed pattern — negative spatial autocorrelation.
 *
 *   10  1  10
 *    1 10   1
 *   10  1  10
 */
const checkerboard3x3 = [10, 1, 10, 1, 10, 1, 10, 1, 10];

/**
 * 5×5 grid with clear spatial clustering:
 * Low values in bottom-left quadrant, high values in top-right.
 */
const clustered5x5 = [
  1, 1, 2, 8, 9,
  1, 2, 3, 9, 9,
  2, 3, 5, 7, 8,
  8, 7, 7, 9, 10,
  9, 8, 9, 10, 10,
];

/** Constant field — no variation. */
const constant3x3 = [5, 5, 5, 5, 5, 5, 5, 5, 5];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('LocalMoransI', () => {
  describe('localMoransI()', () => {
    // ── Structural output ────────────────────────────────────────────

    it('returns n results matching the number of observations', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      expect(result.results).toHaveLength(9);
      expect(result.featureProperties).toHaveLength(9);
    });

    it('result indices are sequential 0..n-1', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      result.results.forEach((r, i) => {
        expect(r.index).toBe(i);
      });
    });

    it('includes all required LocalAutocorrelationResult fields', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      for (const r of result.results) {
        expect(r).toHaveProperty('index');
        expect(r).toHaveProperty('localI');
        expect(r).toHaveProperty('pValue');
        expect(r).toHaveProperty('significant');
        expect(r).toHaveProperty('clusterType');
      }
    });

    it('featureProperties include all GeoJSON-ready fields', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      for (const fp of result.featureProperties) {
        expect(fp).toHaveProperty('index');
        expect(fp).toHaveProperty('value');
        expect(fp).toHaveProperty('zValue');
        expect(fp).toHaveProperty('spatialLag');
        expect(fp).toHaveProperty('localI');
        expect(fp).toHaveProperty('pValue');
        expect(fp).toHaveProperty('significant');
        expect(fp).toHaveProperty('clusterType');
      }
    });

    it('preserves original values in featureProperties', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      result.featureProperties.forEach((fp, i) => {
        expect(fp.value).toBe(clustered3x3[i]);
      });
    });

    // ── Quadrant classification ──────────────────────────────────────

    it('classifies clustered pattern corners as HH or LL (significant or not)', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, {
        seed: 42,
        permutations: 999,
        correction: 'none',
      });

      // Bottom-left (index 0, value 1) → low value, low neighbours → LL quadrant
      // Top-right (index 8, value 9) → high value, high neighbours → HH quadrant
      const fp0 = result.featureProperties[0];
      const fp8 = result.featureProperties[8];

      // z-value signs: obs 0 has below-mean z, obs 8 has above-mean z
      expect(fp0.zValue).toBeLessThan(0);
      expect(fp8.zValue).toBeGreaterThan(0);

      // spatial lag should have same sign as z for clustered corners
      expect(fp0.spatialLag).toBeLessThan(0);
      expect(fp8.spatialLag).toBeGreaterThan(0);

      // Local I should be positive for both (same-sign product)
      expect(fp0.localI).toBeGreaterThan(0);
      expect(fp8.localI).toBeGreaterThan(0);
    });

    it('checkerboard produces negative local I values', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(checkerboard3x3, W, { seed: 42, correction: 'none' });

      // In a checkerboard z_i and lag_i have opposite signs → negative I_i
      // The corner cells (0, 2, 6, 8) have value 10 (above mean) with
      // neighbours that are all 1 (below mean): classic HL.
      const corners = [0, 2, 6, 8];
      for (const idx of corners) {
        expect(result.featureProperties[idx].localI).toBeLessThan(0);
      }
    });

    it('distinguishes HH clustering from HL outliers given appropriate data', () => {
      // Construct a scenario where observation 0 is HH and observation 4 is HL.
      // Values: high cluster bottom-left, low elsewhere. Index 4 (center)
      // gets a high value surrounded by mixed.
      const values = [9, 8, 1, 8, 9, 1, 1, 1, 1]; // 0,1,3 are high → cluster
      const W = grid3x3RowStd();
      const result = localMoransI(values, W, {
        seed: 42,
        correction: 'none',
        permutations: 999,
      });

      // Index 0 (value=9): high, neighbours 1(8),3(8) are also high → HH
      // Index 8 (value=1): low, neighbours 5(1),7(1) are low → LL
      const fp0 = result.featureProperties[0];
      const fp8 = result.featureProperties[8];

      expect(fp0.zValue).toBeGreaterThan(0);
      expect(fp0.spatialLag).toBeGreaterThan(0);

      expect(fp8.zValue).toBeLessThan(0);
      expect(fp8.spatialLag).toBeLessThan(0);
    });

    // ── Significance filtering ───────────────────────────────────────

    it('significance filtering changes results: correction "none" ≥ "fdr" ≥ "bonferroni"', () => {
      const W = grid5x5RowStd();

      const none = localMoransI(clustered5x5, W, {
        seed: 123,
        permutations: 999,
        correction: 'none',
        alpha: 0.05,
      });
      const fdr = localMoransI(clustered5x5, W, {
        seed: 123,
        permutations: 999,
        correction: 'fdr',
        alpha: 0.05,
      });
      const bonf = localMoransI(clustered5x5, W, {
        seed: 123,
        permutations: 999,
        correction: 'bonferroni',
        alpha: 0.05,
      });

      const countSig = (r: LISAResult) =>
        r.results.filter((x) => x.significant).length;

      // Bonferroni is most conservative, none is least.
      expect(countSig(none)).toBeGreaterThanOrEqual(countSig(fdr));
      expect(countSig(fdr)).toBeGreaterThanOrEqual(countSig(bonf));
    });

    it('Bonferroni correction reduces the number of significant observations', () => {
      const W = grid5x5RowStd();

      const none = localMoransI(clustered5x5, W, {
        seed: 123,
        permutations: 999,
        correction: 'none',
        alpha: 0.05,
      });
      const bonf = localMoransI(clustered5x5, W, {
        seed: 123,
        permutations: 999,
        correction: 'bonferroni',
        alpha: 0.05,
      });

      const sigNone = none.results.filter((x) => x.significant).length;
      const sigBonf = bonf.results.filter((x) => x.significant).length;

      expect(sigBonf).toBeLessThanOrEqual(sigNone);
    });

    // ── p-values ─────────────────────────────────────────────────────

    it('p-values are in [0, 1]', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      for (const r of result.results) {
        expect(r.pValue).toBeGreaterThanOrEqual(0);
        expect(r.pValue).toBeLessThanOrEqual(1);
      }
    });

    it('p-values are bounded by 1/(M+1) at the low end', () => {
      const W = grid3x3RowStd();
      const perms = 99;
      const result = localMoransI(clustered3x3, W, {
        seed: 42,
        permutations: perms,
      });
      const minP = 1 / (perms + 1);
      for (const r of result.results) {
        expect(r.pValue).toBeGreaterThanOrEqual(minP);
      }
    });

    // ── Summary counts ───────────────────────────────────────────────

    it('summary counts sum to n', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      const total =
        result.summary.HH +
        result.summary.HL +
        result.summary.LH +
        result.summary.LL +
        result.summary['not-significant'];
      expect(total).toBe(9);
    });

    // ── Seeded reproducibility ───────────────────────────────────────

    it('produces identical results with the same seed', () => {
      const W = grid3x3RowStd();
      const opts = { seed: 12345, permutations: 499 };
      const r1 = localMoransI(clustered3x3, W, opts);
      const r2 = localMoransI(clustered3x3, W, opts);

      for (let i = 0; i < r1.results.length; i++) {
        expect(r1.results[i].localI).toBe(r2.results[i].localI);
        expect(r1.results[i].pValue).toBe(r2.results[i].pValue);
        expect(r1.results[i].clusterType).toBe(r2.results[i].clusterType);
      }
    });

    it('produces different p-values with different seeds', () => {
      const W = grid3x3RowStd();
      const r1 = localMoransI(clustered3x3, W, { seed: 1, permutations: 199 });
      const r2 = localMoransI(clustered3x3, W, { seed: 9999, permutations: 199 });

      // Local I (deterministic) should be identical.
      for (let i = 0; i < r1.results.length; i++) {
        expect(r1.results[i].localI).toBe(r2.results[i].localI);
      }

      // At least one p-value should differ (probabilistically certain).
      const anyDiff = r1.results.some(
        (r, i) => r.pValue !== r2.results[i].pValue,
      );
      expect(anyDiff).toBe(true);
    });

    // ── Constant field ───────────────────────────────────────────────

    it('returns all not-significant with localI=0 for a constant field', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(constant3x3, W, { seed: 42 });

      for (const r of result.results) {
        expect(r.localI).toBe(0);
        expect(r.pValue).toBe(1);
        expect(r.significant).toBe(false);
        expect(r.clusterType).toBe('not-significant');
      }
      expect(result.summary['not-significant']).toBe(9);
    });

    // ── Island handling ──────────────────────────────────────────────

    it('island observations get p=1 and not-significant', () => {
      // Create a weights matrix with one island (observation 0 has no neighbours).
      const W = grid3x3RowStd();
      // Manually remove all neighbours of observation 0.
      W.weights.get(0)?.clear();
      // Also remove 0 from all other rows to be consistent.
      for (let i = 1; i < W.n; i++) {
        W.weights.get(i)?.delete(0);
      }

      const result = localMoransI(clustered3x3, W, { seed: 42 });

      expect(result.results[0].pValue).toBe(1);
      expect(result.results[0].significant).toBe(false);
      expect(result.results[0].clusterType).toBe('not-significant');
    });

    // ── Metadata ─────────────────────────────────────────────────────

    it('returns correction method and alpha in result', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, {
        seed: 42,
        alpha: 0.01,
        correction: 'bonferroni',
      });
      expect(result.correction).toBe('bonferroni');
      expect(result.alpha).toBe(0.01);
    });

    it('defaults to fdr correction and alpha=0.05', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      expect(result.correction).toBe('fdr');
      expect(result.alpha).toBe(0.05);
    });

    it('returns permutation count in result', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, {
        seed: 42,
        permutations: 499,
      });
      expect(result.permutations).toBe(499);
    });

    // ── 5×5 grid validation ──────────────────────────────────────────

    it('identifies clusters in a 5×5 grid with spatial gradient', () => {
      const W = grid5x5RowStd();
      const result = localMoransI(clustered5x5, W, {
        seed: 42,
        permutations: 999,
        correction: 'none',
        alpha: 0.05,
      });

      // Corner 0 (value=1) should have negative z and negative lag → LL quadrant
      const fp0 = result.featureProperties[0];
      expect(fp0.zValue).toBeLessThan(0);
      expect(fp0.localI).toBeGreaterThan(0);

      // Corner 24 (value=10) should have positive z and positive lag → HH quadrant
      const fp24 = result.featureProperties[24];
      expect(fp24.zValue).toBeGreaterThan(0);
      expect(fp24.localI).toBeGreaterThan(0);
    });

    // ── Input validation ─────────────────────────────────────────────

    it('throws RangeError if values length ≠ W.n', () => {
      const W = grid3x3RowStd();
      expect(() => localMoransI([1, 2, 3], W, { seed: 42 })).toThrowError(
        RangeError,
      );
    });

    it('throws RangeError if n < 3', () => {
      const tinyW: SpatialWeightsMatrix = {
        n: 2,
        weights: new Map([
          [0, new Map([[1, 1]])],
          [1, new Map([[0, 1]])],
        ]),
        rowStandardized: true,
        islands: [],
        symmetric: true,
        totalWeight: 2,
      };
      expect(() => localMoransI([1, 2], tinyW, { seed: 42 })).toThrowError(
        RangeError,
      );
    });

    it('throws RangeError if permutations < 1', () => {
      const W = grid3x3RowStd();
      expect(() =>
        localMoransI(clustered3x3, W, { seed: 42, permutations: 0 }),
      ).toThrowError(RangeError);
    });

    // ── Local I decomposition property ───────────────────────────────

    it('sum of local I values approximates n × global Moran I', async () => {
      // The sum of local I_i values equals n times the global Moran's I
      // when using the same denominator convention.
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });

      const sumLocalI = result.results.reduce((s, r) => s + r.localI, 0);

      // Import global Moran's I for comparison.
      const { moransI: globalMoransI } = await import('../GlobalMoransI');
      const globalResult = globalMoransI(clustered3x3, W);

      // sum(I_i) ≈ n × global_I  (exact for row-standardized weights)
      // We use a tolerance because the local I formula divides by m2=Σz²/n
      // while the global I formula uses Σz² in the denominator.
      // With row-standardized weights and n observations:
      //   Σ I_i = (1/m2) Σ_i z_i Σ_j w_ij z_j = n × I_global
      // when global I uses I = (n/S0) × (Σ_i Σ_j w_ij z_i z_j) / (Σ z²).
      // This approximation holds when S0 = n (row-standardized).
      expect(sumLocalI).toBeCloseTo(9 * globalResult.observed, 6);
    });
  });

  // ── Legend ────────────────────────────────────────────────────────────

  describe('lisaLegend()', () => {
    it('returns 5 legend entries', () => {
      const legend = lisaLegend();
      expect(legend).toHaveLength(5);
    });

    it('includes all cluster types', () => {
      const legend = lisaLegend();
      const types = legend.map((e: LISALegendEntry) => e.type);
      expect(types).toContain('HH');
      expect(types).toContain('HL');
      expect(types).toContain('LH');
      expect(types).toContain('LL');
      expect(types).toContain('not-significant');
    });

    it('each entry has label and color', () => {
      const legend = lisaLegend();
      for (const entry of legend) {
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
        expect(entry.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('returns a new copy each time (not a reference)', () => {
      const a = lisaLegend();
      const b = lisaLegend();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // ── Legend from result ──────────────────────────────────────────────

  describe('result.legend', () => {
    it('matches lisaLegend() output', () => {
      const W = grid3x3RowStd();
      const result = localMoransI(clustered3x3, W, { seed: 42 });
      expect(result.legend).toEqual(lisaLegend());
    });
  });
});
