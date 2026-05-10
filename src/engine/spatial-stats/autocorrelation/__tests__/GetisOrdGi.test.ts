/**
 * GetisOrdGi — comprehensive unit test suite.
 *
 * Fixtures:
 *   • 3×3 grid with hot-spot cluster — high values in top-right
 *   • 3×3 grid with cold-spot cluster — low values concentrated
 *   • 3×3 grid uniform / null pattern — no clustering
 *   • 5×5 grid with strong gradient — validates confidence tiers
 *   • Constant field — degenerate case
 *   • Island observation (no neighbours, no self-weight)
 *
 * Covers:
 *   • giStar() — per-observation z-scores and classification
 *   • zScoreMap() — Float64Array extraction
 *   • confidenceMap() — label array extraction
 *   • hotSpotLegend() — legend metadata
 *   • Confidence categories (90%, 95%, 99%)
 *   • Hot spot / cold spot sign consistency
 *   • Serialization (no lossy conversion)
 *   • Constant field safety
 *   • Input validation
 *   • Performance benchmark for medium-sized urban datasets
 */

import { describe, expect, it } from 'vitest';
import type { SpatialFeature, SpatialWeightsMatrix } from '../../types';
import {
  queenContiguity,
  rowStandardize,
} from '../SpatialWeights';
import {
  confidenceMap,
  giStar,
  hotSpotLegend,
  type HotSpotLegendEntry,
  zScoreMap,
} from '../GetisOrdGi';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function gridNxN(size: number): SpatialFeature[] {
  const features: SpatialFeature[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = row * size + col;
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
  return rowStandardize(queenContiguity(gridNxN(3)));
}

function grid5x5RowStd(): SpatialWeightsMatrix {
  return rowStandardize(queenContiguity(gridNxN(5)));
}

function grid3x3Binary(): SpatialWeightsMatrix {
  return queenContiguity(gridNxN(3));
}

/**
 * Hot-spot pattern: high values in top-right, low elsewhere.
 *
 *   1  1  9       (6  7  8)
 *   1  1  9       (3  4  5)
 *   1  1  9       (0  1  2)
 */
const hotSpot3x3 = [1, 1, 9, 1, 1, 9, 1, 1, 9];

/**
 * Cold-spot pattern: low values in bottom-left, high elsewhere.
 *
 *   9  9  9       (6  7  8)
 *   9  9  9       (3  4  5)
 *   1  1  9       (0  1  2)
 */
const coldSpot3x3 = [1, 1, 9, 9, 9, 9, 9, 9, 9];

/**
 * Null / random-ish pattern: uniform values → no clustering.
 */
const uniform3x3 = [5, 5, 5, 5, 5, 5, 5, 5, 5];

/**
 * Strong gradient on 5×5: clear hot and cold extremes.
 * Bottom-left corner is very low; top-right is very high.
 */
const gradient5x5 = [
  1, 1, 1, 2, 2,
  1, 1, 2, 3, 3,
  2, 2, 5, 8, 8,
  3, 3, 8, 9, 9,
  3, 4, 9, 10, 10,
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GetisOrdGi', () => {
  describe('giStar()', () => {
    // ── Structural output ──────────────────────────────────────────

    it('returns n results matching the number of observations', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      expect(result.results).toHaveLength(9);
      expect(result.featureProperties).toHaveLength(9);
    });

    it('result indices are sequential 0..n-1', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      result.results.forEach((r, i) => {
        expect(r.index).toBe(i);
      });
    });

    it('includes all required GiStarResult fields', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      for (const r of result.results) {
        expect(r).toHaveProperty('index');
        expect(r).toHaveProperty('giStar');
        expect(r).toHaveProperty('zScore');
        expect(r).toHaveProperty('pValue');
        expect(r).toHaveProperty('confidence');
      }
    });

    it('featureProperties include all GeoJSON-ready fields', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      for (const fp of result.featureProperties) {
        expect(fp).toHaveProperty('index');
        expect(fp).toHaveProperty('value');
        expect(fp).toHaveProperty('giStar');
        expect(fp).toHaveProperty('zScore');
        expect(fp).toHaveProperty('pValue');
        expect(fp).toHaveProperty('confidence');
      }
    });

    it('preserves original values in featureProperties', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      result.featureProperties.forEach((fp, i) => {
        expect(fp.value).toBe(hotSpot3x3[i]);
      });
    });

    // ── Hot spot detection ─────────────────────────────────────────

    it('high-value cluster produces positive z-scores (hot spot)', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);

      // Right column (indices 2, 5, 8) has value 9 surrounded by other 9s.
      // They should have positive z-scores.
      for (const idx of [2, 5, 8]) {
        expect(result.results[idx].zScore).toBeGreaterThan(0);
      }
    });

    it('hot spot confidence is "hot-*" for positive z-scores', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);

      for (const r of result.results) {
        if (r.zScore > 0 && r.confidence !== 'not-significant') {
          expect(r.confidence).toMatch(/^hot-/);
        }
      }
    });

    // ── Cold spot detection ────────────────────────────────────────

    it('low-value cluster produces negative z-scores (cold spot)', () => {
      const W = grid3x3RowStd();
      const result = giStar(coldSpot3x3, W);

      // Bottom-left observations (indices 0, 1) have value 1 surrounded by
      // other low values; their z-scores should be negative.
      expect(result.results[0].zScore).toBeLessThan(0);
      expect(result.results[1].zScore).toBeLessThan(0);
    });

    it('cold spot confidence is "cold-*" for negative z-scores', () => {
      const W = grid3x3RowStd();
      const result = giStar(coldSpot3x3, W);

      for (const r of result.results) {
        if (r.zScore < 0 && r.confidence !== 'not-significant') {
          expect(r.confidence).toMatch(/^cold-/);
        }
      }
    });

    // ── Confidence categorization consistency ──────────────────────

    it('confidence categories are internally consistent with z-scores', () => {
      const W = grid5x5RowStd();
      const result = giStar(gradient5x5, W);

      for (const r of result.results) {
        const absZ = Math.abs(r.zScore);
        if (r.confidence === 'hot-99' || r.confidence === 'cold-99') {
          expect(absZ).toBeGreaterThanOrEqual(2.575);
        } else if (r.confidence === 'hot-95' || r.confidence === 'cold-95') {
          expect(absZ).toBeGreaterThanOrEqual(1.959);
          expect(absZ).toBeLessThan(2.576);
        } else if (r.confidence === 'hot-90' || r.confidence === 'cold-90') {
          expect(absZ).toBeGreaterThanOrEqual(1.644);
          expect(absZ).toBeLessThan(1.960);
        } else {
          expect(absZ).toBeLessThan(1.645);
        }
      }
    });

    // ── p-values ───────────────────────────────────────────────────

    it('p-values are in [0, 1]', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      for (const r of result.results) {
        expect(r.pValue).toBeGreaterThanOrEqual(0);
        expect(r.pValue).toBeLessThanOrEqual(1);
      }
    });

    it('larger |z| produces smaller p-values', () => {
      const W = grid5x5RowStd();
      const result = giStar(gradient5x5, W);

      // Find the observation with the largest |z| and smallest |z|.
      let maxAbsZ = 0;
      let maxAbsZP = 1;
      let minAbsZ = Infinity;
      let minAbsZP = 0;
      for (const r of result.results) {
        const absZ = Math.abs(r.zScore);
        if (absZ > maxAbsZ) {
          maxAbsZ = absZ;
          maxAbsZP = r.pValue;
        }
        if (absZ < minAbsZ) {
          minAbsZ = absZ;
          minAbsZP = r.pValue;
        }
      }
      expect(maxAbsZP).toBeLessThan(minAbsZP);
    });

    // ── Summary counts ─────────────────────────────────────────────

    it('summary counts sum to n', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      const total = Object.values(result.summary).reduce((a, b) => a + b, 0);
      expect(total).toBe(9);
    });

    it('summary counts sum to n for 5×5 grid', () => {
      const W = grid5x5RowStd();
      const result = giStar(gradient5x5, W);
      const total = Object.values(result.summary).reduce((a, b) => a + b, 0);
      expect(total).toBe(25);
    });

    // ── Null / constant pattern ────────────────────────────────────

    it('uniform field returns all not-significant with z=0', () => {
      const W = grid3x3RowStd();
      const result = giStar(uniform3x3, W);

      for (const r of result.results) {
        expect(r.zScore).toBe(0);
        expect(r.pValue).toBe(1);
        expect(r.confidence).toBe('not-significant');
      }
      expect(result.summary['not-significant']).toBe(9);
    });

    // ── Global statistics ──────────────────────────────────────────

    it('reports correct global mean and standard deviation', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);

      const expectedMean = hotSpot3x3.reduce((a, b) => a + b, 0) / 9;
      expect(result.globalMean).toBeCloseTo(expectedMean, 10);
      expect(result.globalStd).toBeGreaterThan(0);
      expect(result.n).toBe(9);
    });

    // ── Self-weight toggle ─────────────────────────────────────────

    it('disabling self-weight changes z-scores', () => {
      const W = grid3x3RowStd();
      const withSelf = giStar(hotSpot3x3, W, { selfWeight: true });
      const noSelf = giStar(hotSpot3x3, W, { selfWeight: false });

      // At least one z-score should differ.
      const anyDiff = withSelf.results.some(
        (r, i) => r.zScore !== noSelf.results[i].zScore,
      );
      expect(anyDiff).toBe(true);
    });

    // ── Binary vs row-standardized weights ─────────────────────────

    it('works with binary (non-row-standardized) weights', () => {
      const W = grid3x3Binary();
      const result = giStar(hotSpot3x3, W);
      expect(result.results).toHaveLength(9);

      // Right-column observations should still be hot spots.
      for (const idx of [2, 5, 8]) {
        expect(result.results[idx].zScore).toBeGreaterThan(0);
      }
    });

    // ── Island / sparse neighbour handling ──────────────────────────

    it('island observation with no self-weight gets z=0', () => {
      const W = grid3x3RowStd();
      // Remove all neighbours of observation 0.
      W.weights.get(0)?.clear();
      for (let i = 1; i < W.n; i++) {
        W.weights.get(i)?.delete(0);
      }

      const result = giStar(hotSpot3x3, W, { selfWeight: false });
      // With no neighbours and no self-weight, denominator = 0 → z = 0.
      expect(result.results[0].zScore).toBe(0);
      expect(result.results[0].confidence).toBe('not-significant');
    });

    // ── Serialization ──────────────────────────────────────────────

    it('results serialize to JSON without lossy conversion', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);

      const json = JSON.stringify(result.results);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(9);
      for (let i = 0; i < 9; i++) {
        expect(parsed[i].giStar).toBe(result.results[i].giStar);
        expect(parsed[i].zScore).toBe(result.results[i].zScore);
        expect(parsed[i].pValue).toBe(result.results[i].pValue);
        expect(parsed[i].confidence).toBe(result.results[i].confidence);
      }
    });

    it('featureProperties serialize to JSON without lossy conversion', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);

      const json = JSON.stringify(result.featureProperties);
      const parsed = JSON.parse(json);

      for (let i = 0; i < 9; i++) {
        expect(parsed[i].value).toBe(result.featureProperties[i].value);
        expect(parsed[i].confidence).toBe(result.featureProperties[i].confidence);
      }
    });

    // ── Input validation ───────────────────────────────────────────

    it('throws RangeError if values length ≠ W.n', () => {
      const W = grid3x3RowStd();
      expect(() => giStar([1, 2, 3], W)).toThrowError(RangeError);
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
      expect(() => giStar([1, 2], tinyW)).toThrowError(RangeError);
    });

    // ── 5×5 gradient: validates confidence tiers ───────────────────

    it('5×5 gradient has hot spots at high corner and cold spots at low corner', () => {
      const W = grid5x5RowStd();
      const result = giStar(gradient5x5, W);

      // Bottom-left corner (index 0, value=1) should be cold.
      expect(result.results[0].zScore).toBeLessThan(0);

      // Top-right corner (index 24, value=10) should be hot.
      expect(result.results[24].zScore).toBeGreaterThan(0);
    });

    it('5×5 gradient produces multiple confidence tiers', () => {
      const W = grid5x5RowStd();
      const result = giStar(gradient5x5, W);

      // There should be at least 2 distinct confidence categories.
      const uniqueConf = new Set(result.results.map((r) => r.confidence));
      expect(uniqueConf.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── zScoreMap ──────────────────────────────────────────────────────

  describe('zScoreMap()', () => {
    it('returns Float64Array of correct length', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      const map = zScoreMap(result);

      expect(map).toBeInstanceOf(Float64Array);
      expect(map).toHaveLength(9);
    });

    it('z-scores match result values', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      const map = zScoreMap(result);

      for (let i = 0; i < 9; i++) {
        expect(map[i]).toBe(result.results[i].zScore);
      }
    });
  });

  // ── confidenceMap ──────────────────────────────────────────────────

  describe('confidenceMap()', () => {
    it('returns array of correct length', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      const map = confidenceMap(result);

      expect(map).toHaveLength(9);
    });

    it('confidence labels match result values', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      const map = confidenceMap(result);

      for (let i = 0; i < 9; i++) {
        expect(map[i]).toBe(result.results[i].confidence);
      }
    });
  });

  // ── Legend ──────────────────────────────────────────────────────────

  describe('hotSpotLegend()', () => {
    it('returns 7 legend entries', () => {
      const legend = hotSpotLegend();
      expect(legend).toHaveLength(7);
    });

    it('includes all confidence categories', () => {
      const legend = hotSpotLegend();
      const types = legend.map((e: HotSpotLegendEntry) => e.type);
      expect(types).toContain('hot-99');
      expect(types).toContain('hot-95');
      expect(types).toContain('hot-90');
      expect(types).toContain('not-significant');
      expect(types).toContain('cold-90');
      expect(types).toContain('cold-95');
      expect(types).toContain('cold-99');
    });

    it('each entry has label and valid hex color', () => {
      const legend = hotSpotLegend();
      for (const entry of legend) {
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
        expect(entry.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('returns a new copy each time', () => {
      const a = hotSpotLegend();
      const b = hotSpotLegend();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // ── Result legend ──────────────────────────────────────────────────

  describe('result.legend', () => {
    it('matches hotSpotLegend() output', () => {
      const W = grid3x3RowStd();
      const result = giStar(hotSpot3x3, W);
      expect(result.legend).toEqual(hotSpotLegend());
    });
  });

  // ── Performance benchmark ──────────────────────────────────────────

  describe('performance', () => {
    it('computes Gi* for a 50×50 grid (2500 observations) in < 2000ms', () => {
      const size = 50;
      const features = gridNxN(size);
      const W = rowStandardize(queenContiguity(features));
      const n = size * size;

      // Generate a gradient pattern.
      const values = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        values[i] = row + col; // diagonal gradient
      }

      const start = performance.now();
      const result = giStar(values, W);
      const elapsed = performance.now() - start;

      expect(result.results).toHaveLength(n);
      expect(elapsed).toBeLessThan(2000);
    });
  });
});
