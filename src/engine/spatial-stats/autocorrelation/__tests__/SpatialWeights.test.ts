/**
 * SpatialWeights — comprehensive unit test suite.
 *
 * Covers:
 *   • queenContiguity / rookContiguity — shared vertex vs edge detection
 *   • kNearestNeighbors — deterministic tie handling, edge cases
 *   • distanceBand — threshold logic, symmetry
 *   • inverseDistance — decay computation, coincident-point handling
 *   • rowStandardize — row sums, island preservation
 *   • buildWeights — convenience dispatcher
 *   • cloneWeights — deep-copy independence
 *   • computeS1 / computeS2 — variance helper accuracy
 */

import { describe, expect, it } from 'vitest';
import type { SpatialFeature, SpatialWeightsMatrix } from '../../types';
import {
  buildWeights,
  cloneWeights,
  computeS1,
  computeS2,
  distanceBand,
  inverseDistance,
  kNearestNeighbors,
  queenContiguity,
  rookContiguity,
  rowStandardize,
} from '../SpatialWeights';

// ─── Test fixtures ──────────────────────────────────────────────────────────

/**
 * 2×2 grid of unit squares:
 *
 *   B(0,1)──C(1,1)──F(2,1)
 *   │  [0]  │  [1]  │
 *   A(0,0)──D(1,0)──E(2,0)
 *
 * Feature 0: square ABCD → [[0,0],[1,0],[1,1],[0,1],[0,0]]
 * Feature 1: square DCEF → [[1,0],[2,0],[2,1],[1,1],[1,0]]
 *
 * They share edge D-C (rook & queen neighbour).
 */
function twoAdjacentSquares(): SpatialFeature[] {
  return [
    {
      id: 0,
      centroid: [0.5, 0.5],
      rings: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
    {
      id: 1,
      centroid: [1.5, 0.5],
      rings: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
    },
  ];
}

/**
 * 3 polygons arranged so 0 and 1 share an edge, but 0 and 2 share only
 * a single vertex (the corner).
 *
 *   (0,1)──(1,1)──(2,1)
 *   │  [0]  │  [1]  │
 *   (0,0)──(1,0)──(2,0)
 *          │  [2]  │
 *          (1,-1)─(2,-1)
 *
 * Feature 0 shares edge with 1, vertex with none exclusively.
 * Feature 1 shares edge with 0 and edge with 2.
 * Feature 2 shares edge with 1 only.
 * But 0 and 2 share vertex (1,0) → queen neighbour, not rook.
 */
function threeSquaresCornerTouch(): SpatialFeature[] {
  return [
    {
      id: 0,
      centroid: [0.5, 0.5],
      rings: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
    {
      id: 1,
      centroid: [1.5, 0.5],
      rings: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
    },
    {
      id: 2,
      centroid: [1.5, -0.5],
      rings: [[[1, 0], [2, 0], [2, -1], [1, -1], [1, 0]]],
    },
  ];
}

/** A feature with no geometry — should be classified as an island. */
function featuresWithIsland(): SpatialFeature[] {
  return [
    ...twoAdjacentSquares(),
    { id: 2, centroid: [10, 10] }, // no rings → island
  ];
}

/** 4 points in a known arrangement for distance-based tests. */
function fourPoints(): SpatialFeature[] {
  return [
    { id: 0, centroid: [0, 0] },
    { id: 1, centroid: [1, 0] },
    { id: 2, centroid: [0, 1] },
    { id: 3, centroid: [1, 1] },
  ];
}

/** 3 collinear points with duplicate coordinates at two positions. */
function duplicateCoordinatePoints(): SpatialFeature[] {
  return [
    { id: 0, centroid: [0, 0] },
    { id: 1, centroid: [0, 0] }, // coincident with 0
    { id: 2, centroid: [5, 0] },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Check a specific weight entry exists. */
function getWeight(W: SpatialWeightsMatrix, i: number, j: number): number | undefined {
  return W.weights.get(i)?.get(j);
}

/** Get all neighbours of i as sorted array. */
function neighbors(W: SpatialWeightsMatrix, i: number): number[] {
  const row = W.weights.get(i);
  return row ? Array.from(row.keys()).sort((a, b) => a - b) : [];
}

/** Sum of a single row. */
function rowSum(W: SpatialWeightsMatrix, i: number): number {
  const row = W.weights.get(i);
  if (!row) return 0;
  let s = 0;
  for (const v of row.values()) s += v;
  return s;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('queenContiguity', () => {
  it('detects shared-edge neighbours', () => {
    const W = queenContiguity(twoAdjacentSquares());
    expect(W.n).toBe(2);
    expect(getWeight(W, 0, 1)).toBe(1);
    expect(getWeight(W, 1, 0)).toBe(1);
    expect(W.symmetric).toBe(true);
    expect(W.islands).toEqual([]);
  });

  it('detects shared-vertex (corner-touch) as neighbour', () => {
    const W = queenContiguity(threeSquaresCornerTouch());
    // 0 and 2 share vertex (1,0) → queen neighbours
    expect(getWeight(W, 0, 2)).toBe(1);
    expect(getWeight(W, 2, 0)).toBe(1);
    // 0 and 1 share an edge → also queen neighbours
    expect(getWeight(W, 0, 1)).toBe(1);
    // 1 and 2 share an edge
    expect(getWeight(W, 1, 2)).toBe(1);
  });

  it('identifies islands (features without geometry)', () => {
    const W = queenContiguity(featuresWithIsland());
    expect(W.n).toBe(3);
    expect(W.islands).toContain(2);
    // The two adjacent squares are still neighbours
    expect(getWeight(W, 0, 1)).toBe(1);
    // Island has no neighbours
    expect(neighbors(W, 2)).toEqual([]);
  });
});

describe('rookContiguity', () => {
  it('detects shared-edge neighbours', () => {
    const W = rookContiguity(twoAdjacentSquares());
    expect(getWeight(W, 0, 1)).toBe(1);
    expect(getWeight(W, 1, 0)).toBe(1);
    expect(W.symmetric).toBe(true);
  });

  it('does NOT detect corner-touch as neighbour', () => {
    const W = rookContiguity(threeSquaresCornerTouch());
    // 0 and 2 only share vertex (1,0) → NOT rook neighbours
    expect(getWeight(W, 0, 2)).toBeUndefined();
    expect(getWeight(W, 2, 0)).toBeUndefined();
    // But 0-1 and 1-2 share edges → rook neighbours
    expect(getWeight(W, 0, 1)).toBe(1);
    expect(getWeight(W, 1, 2)).toBe(1);
  });

  it('identifies islands', () => {
    const W = rookContiguity(featuresWithIsland());
    expect(W.islands).toContain(2);
  });
});

describe('kNearestNeighbors', () => {
  it('returns k neighbours per observation', () => {
    const pts = fourPoints();
    const W = kNearestNeighbors(pts, 2);
    expect(W.n).toBe(4);
    // Each point should have at least 2 neighbours
    for (let i = 0; i < 4; i++) {
      expect(neighbors(W, i).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('handles ties deterministically — includes all tied candidates', () => {
    // 4 points on a unit square: from (0,0), both (1,0) and (0,1) are
    // distance 1 apart. With k=1, the tie at the boundary means both
    // should be included.
    const pts = fourPoints();
    const W = kNearestNeighbors(pts, 1);
    // Point 0 at (0,0): closest are (1,0) and (0,1) both at distance 1
    const n0 = neighbors(W, 0);
    expect(n0).toContain(1);
    expect(n0).toContain(2);
    expect(n0.length).toBe(2); // Both ties included
  });

  it('is generally asymmetric', () => {
    // Build a scenario where asymmetry shows up
    const pts: SpatialFeature[] = [
      { id: 0, centroid: [0, 0] },
      { id: 1, centroid: [1, 0] },
      { id: 2, centroid: [100, 0] },
    ];
    const W = kNearestNeighbors(pts, 1);
    // 0's nearest is 1, 1's nearest is 0, 2's nearest is 1
    expect(getWeight(W, 2, 1)).toBe(1);
    // But 1 doesn't have 2 as a nearest neighbor (0 is closer)
    expect(getWeight(W, 1, 2)).toBeUndefined();
    expect(W.symmetric).toBe(false);
  });

  it('throws if k >= n', () => {
    const pts = fourPoints();
    expect(() => kNearestNeighbors(pts, 4)).toThrow(RangeError);
  });

  it('throws if k < 1', () => {
    const pts = fourPoints();
    expect(() => kNearestNeighbors(pts, 0)).toThrow(RangeError);
  });

  it('produces binary weights (all weights = 1)', () => {
    const W = kNearestNeighbors(fourPoints(), 2);
    for (const [, row] of W.weights) {
      for (const v of row.values()) {
        expect(v).toBe(1);
      }
    }
  });
});

describe('distanceBand', () => {
  it('connects features within threshold', () => {
    const W = distanceBand(fourPoints(), 1.0);
    // Points at distance 1 apart (adjacent sides)
    expect(getWeight(W, 0, 1)).toBe(1);
    expect(getWeight(W, 0, 2)).toBe(1);
    // Diagonal distance is sqrt(2) ≈ 1.414 → not connected
    expect(getWeight(W, 0, 3)).toBeUndefined();
  });

  it('produces symmetric matrix', () => {
    const W = distanceBand(fourPoints(), 1.5);
    expect(W.symmetric).toBe(true);
    for (const [i, row] of W.weights) {
      for (const [j, w] of row) {
        expect(getWeight(W, j, i)).toBe(w);
      }
    }
  });

  it('creates islands when threshold is too small', () => {
    const W = distanceBand(fourPoints(), 0.1);
    // No pair is within 0.1 → all islands
    expect(W.islands.length).toBe(4);
  });

  it('throws on non-positive threshold', () => {
    expect(() => distanceBand(fourPoints(), 0)).toThrow(RangeError);
    expect(() => distanceBand(fourPoints(), -1)).toThrow(RangeError);
  });
});

describe('inverseDistance', () => {
  it('computes weights as d^{-alpha}', () => {
    const pts: SpatialFeature[] = [
      { id: 0, centroid: [0, 0] },
      { id: 1, centroid: [2, 0] },
    ];
    const W = inverseDistance(pts, { alpha: 2 });
    // d = 2, w = 2^{-2} = 0.25
    expect(getWeight(W, 0, 1)).toBeCloseTo(0.25, 10);
    expect(getWeight(W, 1, 0)).toBeCloseTo(0.25, 10);
  });

  it('respects threshold — only connects within range', () => {
    const W = inverseDistance(fourPoints(), { alpha: 1, threshold: 1.0 });
    // Adjacent: d=1 → w=1
    expect(getWeight(W, 0, 1)).toBeCloseTo(1.0, 10);
    // Diagonal: d=sqrt(2)≈1.414 → beyond threshold 1.0  
    expect(getWeight(W, 0, 3)).toBeUndefined();
  });

  it('skips coincident points (d=0) to avoid infinity', () => {
    const W = inverseDistance(duplicateCoordinatePoints());
    // Points 0 and 1 are coincident → should NOT have a weight
    expect(getWeight(W, 0, 1)).toBeUndefined();
    // Points 0/1 and 2 have d=5 → should have weight 1/5
    expect(getWeight(W, 0, 2)).toBeCloseTo(0.2, 10);
    expect(getWeight(W, 1, 2)).toBeCloseTo(0.2, 10);
  });

  it('produces symmetric matrix', () => {
    const W = inverseDistance(fourPoints());
    for (const [i, row] of W.weights) {
      for (const [j, w] of row) {
        expect(getWeight(W, j, i)).toBeCloseTo(w, 10);
      }
    }
  });

  it('throws on non-positive alpha', () => {
    expect(() => inverseDistance(fourPoints(), { alpha: 0 })).toThrow(RangeError);
    expect(() => inverseDistance(fourPoints(), { alpha: -1 })).toThrow(RangeError);
  });
});

describe('rowStandardize', () => {
  it('makes each row sum to 1', () => {
    const W = queenContiguity(threeSquaresCornerTouch());
    rowStandardize(W);
    expect(W.rowStandardized).toBe(true);
    for (let i = 0; i < W.n; i++) {
      if (W.islands.includes(i)) continue;
      expect(rowSum(W, i)).toBeCloseTo(1.0, 10);
    }
  });

  it('leaves island rows unchanged (empty)', () => {
    const W = queenContiguity(featuresWithIsland());
    rowStandardize(W);
    // Island (index 2) should still have no neighbours
    expect(neighbors(W, 2)).toEqual([]);
    expect(rowSum(W, 2)).toBe(0);
    expect(W.islands).toContain(2);
  });

  it('is idempotent', () => {
    const W = distanceBand(fourPoints(), 1.5);
    rowStandardize(W);
    const weights1 = Array.from(W.weights.get(0)!.values());
    rowStandardize(W); // second call should be no-op
    const weights2 = Array.from(W.weights.get(0)!.values());
    expect(weights2).toEqual(weights1);
  });

  it('correctly standardizes with unequal cardinality', () => {
    // Feature 0 has 2 neighbours (queen: 1 and 2)
    // Feature 1 has 2 neighbours (queen: 0 and 2)
    // Feature 2 has 2 neighbours (queen: 0 and 1)
    const W = queenContiguity(threeSquaresCornerTouch());
    // Feature 1 has neighbours 0 and 2
    rowStandardize(W);
    // Feature 1 with 2 queen neighbours → each gets 0.5
    expect(getWeight(W, 1, 0)).toBeCloseTo(0.5, 10);
    expect(getWeight(W, 1, 2)).toBeCloseTo(0.5, 10);
  });
});

describe('buildWeights', () => {
  it('dispatches queen method', () => {
    const W = buildWeights(twoAdjacentSquares(), 'queen');
    expect(getWeight(W, 0, 1)).toBe(1);
  });

  it('dispatches rook method', () => {
    const W = buildWeights(twoAdjacentSquares(), 'rook');
    expect(getWeight(W, 0, 1)).toBe(1);
  });

  it('dispatches knn method with k option', () => {
    const W = buildWeights(fourPoints(), 'knn', { k: 2 });
    for (let i = 0; i < 4; i++) {
      expect(neighbors(W, i).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('dispatches distance-band method', () => {
    const W = buildWeights(fourPoints(), 'distance-band', { threshold: 1.0 });
    expect(getWeight(W, 0, 1)).toBe(1);
  });

  it('throws when distance-band is missing threshold', () => {
    expect(() => buildWeights(fourPoints(), 'distance-band')).toThrow();
  });

  it('dispatches inverse-distance method', () => {
    const W = buildWeights(fourPoints(), 'inverse-distance', { alpha: 2 });
    expect(getWeight(W, 0, 1)).toBeDefined();
  });

  it('applies row standardization when requested', () => {
    const W = buildWeights(threeSquaresCornerTouch(), 'queen', { rowStandardize: true });
    expect(W.rowStandardized).toBe(true);
    for (let i = 0; i < W.n; i++) {
      if (W.islands.includes(i)) continue;
      expect(rowSum(W, i)).toBeCloseTo(1.0, 10);
    }
  });
});

describe('cloneWeights', () => {
  it('produces a deep copy independent of the original', () => {
    const original = queenContiguity(twoAdjacentSquares());
    const clone = cloneWeights(original);
    // Modify clone
    clone.weights.get(0)!.set(1, 99);
    // Original should be unchanged
    expect(getWeight(original, 0, 1)).toBe(1);
    expect(getWeight(clone, 0, 1)).toBe(99);
  });

  it('preserves metadata', () => {
    const original = queenContiguity(featuresWithIsland());
    const clone = cloneWeights(original);
    expect(clone.n).toBe(original.n);
    expect(clone.rowStandardized).toBe(original.rowStandardized);
    expect(clone.islands).toEqual(original.islands);
    expect(clone.symmetric).toBe(original.symmetric);
    expect(clone.totalWeight).toBe(original.totalWeight);
  });
});

describe('computeS1', () => {
  it('computes S1 = 0.5 * sum over i,j of (w_ij + w_ji)^2', () => {
    // Two adjacent squares: w_01 = 1, w_10 = 1, all others 0
    // S1 = 0.5 * [(w_01+w_10)^2 + (w_10+w_01)^2]
    //    = 0.5 * [(1+1)^2 + (1+1)^2]
    //    = 0.5 * [4 + 4] = 4
    const W = queenContiguity(twoAdjacentSquares());
    expect(computeS1(W)).toBeCloseTo(4, 10);
  });

  it('computes correctly for asymmetric matrix', () => {
    // k-NN can be asymmetric. Build a simple case.
    const pts: SpatialFeature[] = [
      { id: 0, centroid: [0, 0] },
      { id: 1, centroid: [1, 0] },
      { id: 2, centroid: [100, 0] },
    ];
    const W = kNearestNeighbors(pts, 1);
    // 0→1 (1), 1→0 (1), 2→1 (1)
    // w_01=1, w_10=1: (1+1)^2=4 twice → sum 8
    // w_12=0, w_21=1: (0+1)^2=1 for the j=2 entry from i=1... wait let's just check
    // Actually iterate: i=0, j=1: w_01=1, w_10=1 → (1+1)^2=4
    //                   i=1, j=0: w_10=1, w_01=1 → (1+1)^2=4
    //                   i=2, j=1: w_21=1, w_12=undef=0 → (1+0)^2=1
    // S1 = 0.5*(4+4+1) = 4.5
    expect(computeS1(W)).toBeCloseTo(4.5, 10);
  });
});

describe('computeS2', () => {
  it('computes S2 = sum over i of (row_sum_i + col_sum_i)^2', () => {
    // Two adjacent squares: row sums: [1, 1], col sums: [1, 1]
    // S2 = (1+1)^2 + (1+1)^2 = 4 + 4 = 8
    const W = queenContiguity(twoAdjacentSquares());
    expect(computeS2(W)).toBeCloseTo(8, 10);
  });

  it('includes zero rows/columns in computation', () => {
    // With island: feature 2 has row_sum=0, col_sum=0
    // S2 = (1+1)^2 + (1+1)^2 + (0+0)^2 = 8
    const W = queenContiguity(featuresWithIsland());
    expect(computeS2(W)).toBeCloseTo(8, 10);
  });
});

describe('totalWeight (S0)', () => {
  it('equals sum of all weights', () => {
    const W = queenContiguity(twoAdjacentSquares());
    // w_01 = 1, w_10 = 1 → totalWeight = 2
    expect(W.totalWeight).toBe(2);
  });

  it('updates after row standardization', () => {
    const W = queenContiguity(threeSquaresCornerTouch());
    rowStandardize(W);
    // 3 non-island features, each row sums to 1 → totalWeight = 3
    expect(W.totalWeight).toBeCloseTo(3, 10);
  });
});
