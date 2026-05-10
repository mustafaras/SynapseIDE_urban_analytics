/**
 * linalg.test.ts — Unit tests for the linear algebra utilities.
 */

import { describe, expect, it } from 'vitest';
import {
  cholesky,
  crossProduct,
  crossProductVec,
  determinant,
  diag,
  eye,
  invert,
  matMul,
  matVec,
  solve,
  solveMulti,
  trace,
  transpose,
} from '../linalg';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Column-major matrix from row-major 2D array. */
function fromRows(rows: number[][]): Float64Array {
  const m = rows.length;
  const n = rows[0].length;
  const A = new Float64Array(m * n);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      A[i + j * m] = rows[i][j];
    }
  }
  return A;
}

function approxEqual(a: number, b: number, tol = 1e-8): void {
  expect(Math.abs(a - b)).toBeLessThan(tol);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('eye', () => {
  it('creates a 3×3 identity matrix', () => {
    const I = eye(3);
    expect(I).toHaveLength(9);
    expect(I[0]).toBe(1);
    expect(I[4]).toBe(1);
    expect(I[8]).toBe(1);
    expect(I[1]).toBe(0);
  });
});

describe('transpose', () => {
  it('transposes a 2×3 matrix', () => {
    const A = fromRows([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const At = transpose(A, 2, 3);
    // At should be 3×2.
    expect(At[0 + 0 * 3]).toBe(1);
    expect(At[1 + 0 * 3]).toBe(2);
    expect(At[2 + 0 * 3]).toBe(3);
    expect(At[0 + 1 * 3]).toBe(4);
    expect(At[1 + 1 * 3]).toBe(5);
    expect(At[2 + 1 * 3]).toBe(6);
  });
});

describe('matMul', () => {
  it('multiplies 2×3 and 3×2 matrices', () => {
    const A = fromRows([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const B = fromRows([
      [7, 8],
      [9, 10],
      [11, 12],
    ]);
    const C = matMul(A, 2, 3, B, 2);
    // C = [[58, 64], [139, 154]]
    approxEqual(C[0 + 0 * 2], 58);
    approxEqual(C[1 + 0 * 2], 139);
    approxEqual(C[0 + 1 * 2], 64);
    approxEqual(C[1 + 1 * 2], 154);
  });
});

describe('matVec', () => {
  it('multiplies 2×3 matrix by 3-vector', () => {
    const A = fromRows([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const x = new Float64Array([1, 2, 3]);
    const y = matVec(A, 2, 3, x);
    expect(y).toHaveLength(2);
    approxEqual(y[0], 14);
    approxEqual(y[1], 32);
  });
});

describe('solve', () => {
  it('solves a 3×3 system', () => {
    // A = [[2,1,0],[1,3,1],[0,1,2]], b = [1,2,3]
    // Solution: x ≈ [-0.125, 0.25, 1.375]
    const A = fromRows([
      [2, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ]);
    const b = new Float64Array([1, 2, 3]);
    const x = solve(A, 3, b);
    // Verify Ax ≈ b.
    const Ax = matVec(A, 3, 3, x);
    for (let i = 0; i < 3; i++) approxEqual(Ax[i], b[i]);
  });

  it('throws for a singular matrix', () => {
    const A = fromRows([
      [1, 2],
      [2, 4],
    ]);
    const b = new Float64Array([1, 2]);
    expect(() => solve(A, 2, b)).toThrow('Singular');
  });
});

describe('solveMulti', () => {
  it('solves AX = I to get the inverse', () => {
    const A = fromRows([
      [4, 7],
      [2, 6],
    ]);
    const I = eye(2);
    const Ainv = solveMulti(A, 2, I, 2);
    const product = matMul(A, 2, 2, Ainv, 2);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        approxEqual(product[i + j * 2], i === j ? 1 : 0);
      }
    }
  });
});

describe('invert', () => {
  it('inverts a 2×2 matrix', () => {
    const A = fromRows([
      [4, 7],
      [2, 6],
    ]);
    const Ainv = invert(A, 2);
    const prod = matMul(A, 2, 2, Ainv, 2);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        approxEqual(prod[i + j * 2], i === j ? 1 : 0);
      }
    }
  });
});

describe('determinant', () => {
  it('computes determinant of a 3×3 matrix', () => {
    const A = fromRows([
      [6, 1, 1],
      [4, -2, 5],
      [2, 8, 7],
    ]);
    // det = 6(-2×7 - 5×8) - 1(4×7 - 5×2) + 1(4×8 - (-2)×2)
    // = 6(-14-40) - 1(28-10) + 1(32+4) = -324 - 18 + 36 = -306
    approxEqual(determinant(A, 3), -306);
  });
});

describe('cholesky', () => {
  it('decomposes a 2×2 positive definite matrix', () => {
    // A = [[4, 2], [2, 3]] → L = [[2, 0], [1, √2]]
    const A = fromRows([
      [4, 2],
      [2, 3],
    ]);
    const L = cholesky(A, 2);
    approxEqual(L[0], 2);
    approxEqual(L[1], 1);
    approxEqual(L[2], 0);
    approxEqual(L[3], Math.SQRT2);
  });

  it('throws for non-positive definite matrix', () => {
    const A = fromRows([
      [1, 5],
      [5, 1],
    ]);
    expect(() => cholesky(A, 2)).toThrow('not positive definite');
  });
});

describe('diag', () => {
  it('extracts diagonal of a 3×3 matrix', () => {
    const A = fromRows([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
    const d = diag(A, 3);
    expect(Array.from(d)).toEqual([1, 5, 9]);
  });
});

describe('crossProduct', () => {
  it('computes XᵀX for a 3×2 matrix', () => {
    const X = fromRows([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const XtX = crossProduct(X, 3, 2);
    // XᵀX = [[35, 44], [44, 56]]
    approxEqual(XtX[0 + 0 * 2], 35);
    approxEqual(XtX[1 + 0 * 2], 44);
    approxEqual(XtX[0 + 1 * 2], 44);
    approxEqual(XtX[1 + 1 * 2], 56);
  });
});

describe('crossProductVec', () => {
  it('computes Xᵀy', () => {
    const X = fromRows([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const y = new Float64Array([1, 1, 1]);
    const Xty = crossProductVec(X, 3, 2, y);
    // Xᵀy = [1+3+5, 2+4+6] = [9, 12]
    approxEqual(Xty[0], 9);
    approxEqual(Xty[1], 12);
  });
});

describe('trace', () => {
  it('sums diagonal elements', () => {
    const A = fromRows([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
    approxEqual(trace(A, 3), 15);
  });
});
