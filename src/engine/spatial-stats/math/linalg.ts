/**
 * linalg — Numerically stable linear algebra routines for spatial statistics.
 *
 * All operations work on dense column-major Float64Array matrices.
 * Matrix dimensions are tracked explicitly via [rows, cols] tuples.
 *
 * Conventions:
 *   A matrix of shape (m × n) is stored as Float64Array of length m × n.
 *   Element (i, j) lives at index  i + j * m  (column-major / Fortran order).
 *
 * References:
 *   Golub, G.H. & Van Loan, C.F. (2013) Matrix Computations, 4th ed.
 *   Press, W.H. et al. (2007) Numerical Recipes, 3rd ed.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Column-major index: element (i, j) in an m-row matrix. */
function idx(i: number, j: number, m: number): number {
  return i + j * m;
}

// ─── Basic operations ───────────────────────────────────────────────────────

/**
 * Create an identity matrix of size n × n.
 */
export function eye(n: number): Float64Array {
  const I = new Float64Array(n * n);
  for (let i = 0; i < n; i++) I[idx(i, i, n)] = 1;
  return I;
}

/**
 * Transpose a matrix of shape (m × n) → (n × m).
 */
export function transpose(A: Float64Array, m: number, n: number): Float64Array {
  const T = new Float64Array(n * m);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      T[idx(j, i, n)] = A[idx(i, j, m)];
    }
  }
  return T;
}

/**
 * Matrix multiplication: C = A (m × p) × B (p × n) → C (m × n).
 */
export function matMul(
  A: Float64Array,
  m: number,
  p: number,
  B: Float64Array,
  n: number,
): Float64Array {
  const C = new Float64Array(m * n);
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < p; k++) {
      const bkj = B[idx(k, j, p)];
      for (let i = 0; i < m; i++) {
        C[idx(i, j, m)] += A[idx(i, k, m)] * bkj;
      }
    }
  }
  return C;
}

/**
 * Matrix-vector multiply: y = A (m × n) × x (n × 1) → y (m × 1).
 */
export function matVec(
  A: Float64Array,
  m: number,
  n: number,
  x: Float64Array,
): Float64Array {
  const y = new Float64Array(m);
  for (let j = 0; j < n; j++) {
    const xj = x[j];
    for (let i = 0; i < m; i++) {
      y[i] += A[idx(i, j, m)] * xj;
    }
  }
  return y;
}

// ─── LU decomposition with partial pivoting ─────────────────────────────────

/**
 * In-place LU decomposition with partial pivoting.
 * Returns { piv, swaps }. A is overwritten with L\U.
 */
function luDecompose(
  A: Float64Array,
  n: number,
): { piv: Int32Array; swaps: number } {
  const piv = new Int32Array(n);
  for (let i = 0; i < n; i++) piv[i] = i;
  let swaps = 0;

  for (let k = 0; k < n; k++) {
    // Find pivot.
    let maxVal = Math.abs(A[idx(k, k, n)]);
    let maxRow = k;
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(A[idx(i, k, n)]);
      if (v > maxVal) {
        maxVal = v;
        maxRow = i;
      }
    }
    if (maxVal === 0) throw new Error('Singular matrix in LU decomposition.');

    // Swap rows.
    if (maxRow !== k) {
      swaps++;
      const tmp = piv[k];
      piv[k] = piv[maxRow];
      piv[maxRow] = tmp;
      for (let j = 0; j < n; j++) {
        const t = A[idx(k, j, n)];
        A[idx(k, j, n)] = A[idx(maxRow, j, n)];
        A[idx(maxRow, j, n)] = t;
      }
    }

    // Eliminate below.
    const akk = A[idx(k, k, n)];
    for (let i = k + 1; i < n; i++) {
      const factor = A[idx(i, k, n)] / akk;
      A[idx(i, k, n)] = factor; // Store L factor.
      for (let j = k + 1; j < n; j++) {
        A[idx(i, j, n)] -= factor * A[idx(k, j, n)];
      }
    }
  }
  return { piv, swaps };
}

/**
 * Forward-backward solve given L\U in A with pivot vector piv.
 * Solves Ax = b. Does not modify A.
 */
function luSolveVec(
  A: Float64Array,
  n: number,
  piv: Int32Array,
  b: Float64Array,
): Float64Array {
  // Apply pivot to b.
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = b[piv[i]];

  // Forward substitution (L).
  for (let i = 1; i < n; i++) {
    let s = x[i];
    for (let j = 0; j < i; j++) {
      s -= A[idx(i, j, n)] * x[j];
    }
    x[i] = s;
  }

  // Backward substitution (U).
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i];
    for (let j = i + 1; j < n; j++) {
      s -= A[idx(i, j, n)] * x[j];
    }
    x[i] = s / A[idx(i, i, n)];
  }

  return x;
}

// ─── Public solver ──────────────────────────────────────────────────────────

/**
 * Solve a linear system A x = b for a square matrix A (n × n).
 * Uses LU decomposition with partial pivoting.
 * Returns x as Float64Array of length n.
 * Throws if A is singular.
 */
export function solve(A: Float64Array, n: number, b: Float64Array): Float64Array {
  // Work on a copy so caller's A is unchanged.
  const LU = new Float64Array(A);
  const { piv } = luDecompose(LU, n);
  return luSolveVec(LU, n, piv, b);
}

/**
 * Solve A X = B for multiple right-hand sides.
 * A is (n × n), B is (n × m). Returns X (n × m).
 */
export function solveMulti(
  A: Float64Array,
  n: number,
  B: Float64Array,
  m: number,
): Float64Array {
  const LU = new Float64Array(A);
  const { piv } = luDecompose(LU, n);
  const X = new Float64Array(n * m);
  const col = new Float64Array(n);
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) col[i] = B[idx(i, j, n)];
    const xj = luSolveVec(LU, n, piv, col);
    for (let i = 0; i < n; i++) X[idx(i, j, n)] = xj[i];
  }
  return X;
}

/**
 * Invert a square matrix A (n × n) via LU decomposition.
 * Returns A⁻¹ as Float64Array of length n × n.
 * Throws if A is singular.
 */
export function invert(A: Float64Array, n: number): Float64Array {
  return solveMulti(A, n, eye(n), n);
}

/**
 * Compute the determinant of a square matrix A (n × n) via LU decomposition.
 */
export function determinant(A: Float64Array, n: number): number {
  const LU = new Float64Array(A);
  const { swaps } = luDecompose(LU, n);

  // det = product of diagonal × sign of permutation.
  let det = 1;
  for (let i = 0; i < n; i++) {
    det *= LU[idx(i, i, n)];
  }
  return swaps % 2 === 0 ? det : -det;
}

// ─── Cholesky decomposition ─────────────────────────────────────────────────

/**
 * Cholesky decomposition of a symmetric positive-definite matrix A.
 * Returns lower-triangular L such that A = L Lᵀ.
 * Throws if A is not positive definite.
 */
export function cholesky(A: Float64Array, n: number): Float64Array {
  const L = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < j; k++) sum += L[idx(j, k, n)] * L[idx(j, k, n)];
    const diag = A[idx(j, j, n)] - sum;
    if (diag <= 0) throw new Error('Matrix is not positive definite.');
    L[idx(j, j, n)] = Math.sqrt(diag);

    for (let i = j + 1; i < n; i++) {
      let s = 0;
      for (let k = 0; k < j; k++) s += L[idx(i, k, n)] * L[idx(j, k, n)];
      L[idx(i, j, n)] = (A[idx(i, j, n)] - s) / L[idx(j, j, n)];
    }
  }
  return L;
}

// ─── Diagonal extraction ────────────────────────────────────────────────────

/**
 * Extract the diagonal of a square matrix (n × n).
 */
export function diag(A: Float64Array, n: number): Float64Array {
  const d = new Float64Array(n);
  for (let i = 0; i < n; i++) d[i] = A[idx(i, i, n)];
  return d;
}

/**
 * Compute (Xᵀ X) for X of shape (m × n). Returns an (n × n) matrix.
 */
export function crossProduct(X: Float64Array, m: number, n: number): Float64Array {
  const XtX = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = j; i < n; i++) {
      let s = 0;
      for (let r = 0; r < m; r++) {
        s += X[idx(r, i, m)] * X[idx(r, j, m)];
      }
      XtX[idx(i, j, n)] = s;
      XtX[idx(j, i, n)] = s; // Symmetric.
    }
  }
  return XtX;
}

/**
 * Compute Xᵀ y for X (m × n) and y (m × 1). Returns (n × 1).
 */
export function crossProductVec(
  X: Float64Array,
  m: number,
  n: number,
  y: Float64Array,
): Float64Array {
  const Xty = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let r = 0; r < m; r++) {
      s += X[idx(r, j, m)] * y[r];
    }
    Xty[j] = s;
  }
  return Xty;
}

/**
 * Compute the trace of a square matrix (n × n).
 */
export function trace(A: Float64Array, n: number): number {
  let s = 0;
  for (let i = 0; i < n; i++) s += A[idx(i, i, n)];
  return s;
}
