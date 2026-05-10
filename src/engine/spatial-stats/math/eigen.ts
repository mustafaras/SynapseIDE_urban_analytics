/**
 * eigen — Symmetric eigenvalue decomposition for real symmetric matrices.
 *
 * Uses the **Jacobi eigenvalue algorithm** which is ideal for small-to-medium
 * dense symmetric matrices (correlation and covariance matrices in PCA,
 * distance/similarity matrices in clustering).
 *
 * Column-major storage convention consistent with linalg.ts:
 *   Element (i, j) of m-row matrix stored at index  i + j * m.
 *
 * References:
 *   Golub, G.H. & Van Loan, C.F. (2013) Matrix Computations, 4th ed., §8.4.
 *   Press, W.H. et al. (2007) Numerical Recipes, 3rd ed., §11.1.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function idx(i: number, j: number, n: number): number {
  return i + j * n;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EigenDecomposition {
  /** Eigenvalues sorted in descending order. */
  values: Float64Array;
  /** Eigenvectors as columns of an n × n column-major matrix, matching the
   *  sorted eigenvalue order. Column j is the eigenvector for values[j]. */
  vectors: Float64Array;
}

// ─── Jacobi rotation ────────────────────────────────────────────────────────

/**
 * Apply a single Jacobi rotation to zero out A[p][q] in a symmetric matrix.
 * Modifies A and V (eigenvector accumulator) in place.
 */
function jacobiRotate(
  A: Float64Array,
  V: Float64Array,
  n: number,
  p: number,
  q: number,
): void {
  const app = A[idx(p, p, n)];
  const aqq = A[idx(q, q, n)];
  const apq = A[idx(p, q, n)];

  if (Math.abs(apq) < 1e-15) return;

  const tau = (aqq - app) / (2 * apq);
  const t =
    Math.abs(tau) > 1e15
      ? 1 / (2 * tau) // avoid overflow for very large tau
      : Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
  const c = 1 / Math.sqrt(1 + t * t);
  const s = t * c;

  // Update diagonal
  A[idx(p, p, n)] = app - t * apq;
  A[idx(q, q, n)] = aqq + t * apq;
  A[idx(p, q, n)] = 0;
  A[idx(q, p, n)] = 0;

  // Update off-diagonal rows/columns
  for (let r = 0; r < n; r++) {
    if (r === p || r === q) continue;
    const arp = A[idx(r, p, n)];
    const arq = A[idx(r, q, n)];
    A[idx(r, p, n)] = c * arp - s * arq;
    A[idx(p, r, n)] = c * arp - s * arq;
    A[idx(r, q, n)] = s * arp + c * arq;
    A[idx(q, r, n)] = s * arp + c * arq;
  }

  // Accumulate eigenvectors
  for (let r = 0; r < n; r++) {
    const vrp = V[idx(r, p, n)];
    const vrq = V[idx(r, q, n)];
    V[idx(r, p, n)] = c * vrp - s * vrq;
    V[idx(r, q, n)] = s * vrp + c * vrq;
  }
}

// ─── Main decomposition ─────────────────────────────────────────────────────

/**
 * Compute eigenvalues and eigenvectors of a real symmetric matrix using the
 * classical Jacobi iterative method.
 *
 * @param sym  Column-major Float64Array of an n × n **symmetric** matrix.
 *             The input is copied internally; the original is not mutated.
 * @param n    Matrix dimension.
 * @param maxSweeps  Maximum number of full sweeps (default 100).
 * @returns Eigenvalues (descending) and corresponding eigenvectors (columns).
 *
 * Complexity: O(n³) per sweep, typically converges in 5–10 sweeps for n < 100.
 */
export function symmetricEigen(
  sym: Float64Array,
  n: number,
  maxSweeps = 100,
): EigenDecomposition {
  if (sym.length !== n * n) {
    throw new RangeError(
      `symmetricEigen: expected array of length ${n * n}, got ${sym.length}`,
    );
  }

  // Work on a copy
  const A = new Float64Array(sym);
  // Start with identity for eigenvector accumulator
  const V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[idx(i, i, n)] = 1;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    // Compute off-diagonal Frobenius norm
    let offNorm = 0;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        offNorm += A[idx(p, q, n)] ** 2;
      }
    }
    // Convergence check
    if (Math.sqrt(2 * offNorm) < 1e-12 * n) break;

    // Sweep: rotate over all upper-triangular pairs
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        jacobiRotate(A, V, n, p, q);
      }
    }
  }

  // Extract eigenvalues from diagonal
  const values = new Float64Array(n);
  for (let i = 0; i < n; i++) values[i] = A[idx(i, i, n)];

  // Sort eigenvalues descending and reorder eigenvectors to match
  const order = Array.from({ length: n }, (_, i) => i);
  order.sort((a, b) => values[b] - values[a]);

  const sortedValues = new Float64Array(n);
  const sortedVectors = new Float64Array(n * n);
  for (let j = 0; j < n; j++) {
    sortedValues[j] = values[order[j]];
    for (let i = 0; i < n; i++) {
      sortedVectors[idx(i, j, n)] = V[idx(i, order[j], n)];
    }
  }

  return { values: sortedValues, vectors: sortedVectors };
}
