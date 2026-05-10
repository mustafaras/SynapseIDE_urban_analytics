/**
 * Spatial Statistics — Math Utilities.
 *
 * Shared linear algebra, distribution functions, and numeric helpers
 * used across autocorrelation, regression, and multivariate modules.
 */

export {
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
} from './linalg';

export {
  chiSquaredCdf,
  chiSquaredSf,
  lnGamma,
  normalCdf,
  normalTwoTailP,
  regularizedBeta,
  regularizedGammaP,
  tCdf,
  tTwoTailP,
} from './distributions';

export { symmetricEigen } from './eigen';
export type { EigenDecomposition } from './eigen';
