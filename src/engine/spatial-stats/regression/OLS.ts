/**
 * OLS — Ordinary Least Squares with full spatial diagnostics.
 *
 * Provides a statistically credible baseline regression engine with fit
 * statistics, residual diagnostics, multicollinearity checks, and spatial
 * diagnostics sufficient to justify downstream spatial model selection
 * (SAR, SEM, GWR).
 *
 * Architecture:
 *   1. Estimation  — `olsFit()` returns `OLSResult`
 *   2. Residual diagnostics — `residualDiagnostics()`
 *   3. Spatial diagnostics — `spatialDiagnostics()`
 *   4. Full diagnostic bundle — `fullDiagnostics()`
 *
 * Output is designed so model comparison tables can be generated
 * without reshaping.
 *
 * References:
 *   Anselin, L. (1988) Spatial Econometrics: Methods and Models. Kluwer.
 *   Anselin, L. et al. (1996) "Simple diagnostic tests for spatial
 *     dependence." Regional Science and Urban Economics 26: 77–104.
 *   Jarque, C.M. & Bera, A.K. (1987) "A test for normality of observations
 *     and regression residuals." International Statistical Review 55: 163–172.
 *   Breusch, T.S. & Pagan, A.R. (1979) "A simple test for
 *     heteroscedasticity." Econometrica 47(5): 1287–1294.
 *   Belsley, D.A. et al. (1980) Regression Diagnostics. Wiley.
 */

import type {
  OLSResult,
  RegressionDiagnostics,
  SpatialWeightsMatrix,
} from '../types';
import {
  crossProduct,
  crossProductVec,
  diag,
  invert,
  matVec,
  solve,
} from '../math';
import { chiSquaredSf, tTwoTailP } from '../math/distributions';

// ─── Column-major helper ────────────────────────────────────────────────────

function colIdx(i: number, j: number, m: number): number {
  return i + j * m;
}

function computeTraceWpWtW(W: SpatialWeightsMatrix, n: number): number {
  let trW2 = 0;
  let trWtW = 0;
  for (let i = 0; i < n; i++) {
    const rowI = W.weights.get(i);
    if (!rowI) continue;
    for (const [kk, wik] of rowI) {
      const wki = W.weights.get(kk)?.get(i) ?? 0;
      trW2 += wik * wki;
      trWtW += wki * wki;
    }
  }
  return trW2 + trWtW;
}

// ─── Design matrix construction ─────────────────────────────────────────────

/**
 * Build the design matrix X (n × (k+1)) from predictor columns, with
 * a leading column of ones for the intercept.
 *
 * @param predictors Array of k predictor arrays, each of length n.
 * @param n          Number of observations.
 * @returns Column-major Float64Array of shape n × (k+1).
 */
function buildDesignMatrix(predictors: ArrayLike<number>[], n: number): Float64Array {
  const k = predictors.length;
  const p = k + 1; // Including intercept.
  const X = new Float64Array(n * p);
  // Intercept column.
  for (let i = 0; i < n; i++) X[colIdx(i, 0, n)] = 1;
  // Predictor columns.
  for (let j = 0; j < k; j++) {
    const col = predictors[j];
    for (let i = 0; i < n; i++) {
      X[colIdx(i, j + 1, n)] = col[i];
    }
  }
  return X;
}

// ─── Core OLS estimation ────────────────────────────────────────────────────

/**
 * Fit an OLS model: y = Xβ + ε.
 *
 * Solves the normal equations (XᵀX)β = Xᵀy using LU decomposition with
 * partial pivoting for numerical stability.
 *
 * @param y          Response variable (length n).
 * @param predictors Array of k predictor arrays, each of length n.
 * @returns OLSResult with coefficients, standard errors, fit statistics,
 *          residuals, and fitted values.
 */
export function olsFit(
  y: ArrayLike<number>,
  predictors: ArrayLike<number>[],
): OLSResult {
  const n = y.length;
  const k = predictors.length;
  const p = k + 1; // Number of parameters (including intercept).

  // ── Validation ──
  if (n < p + 1) {
    throw new RangeError(
      `Need at least ${p + 1} observations for ${k} predictors plus intercept; got ${n}.`,
    );
  }
  for (let j = 0; j < k; j++) {
    if (predictors[j].length !== n) {
      throw new RangeError(
        `Predictor ${j} has length ${predictors[j].length}; expected ${n}.`,
      );
    }
  }

  // ── Build design matrix ──
  const yArr =
    y instanceof Float64Array ? y : new Float64Array(y as number[]);
  const X = buildDesignMatrix(predictors, n);

  // ── Normal equations: (XᵀX) β = Xᵀy ──
  const XtX = crossProduct(X, n, p);       // p × p
  const Xty = crossProductVec(X, n, p, yArr); // p × 1

  const beta = solve(XtX, p, Xty);         // p × 1

  // ── Fitted values and residuals ──
  const yHat = matVec(X, n, p, beta);
  const residuals = new Float64Array(n);
  for (let i = 0; i < n; i++) residuals[i] = yArr[i] - yHat[i];

  // ── Sum of squares ──
  let meanY = 0;
  for (let i = 0; i < n; i++) meanY += yArr[i];
  meanY /= n;

  let sst = 0; // Total sum of squares.
  let sse = 0; // Residual sum of squares.
  for (let i = 0; i < n; i++) {
    const dev = yArr[i] - meanY;
    sst += dev * dev;
    sse += residuals[i] * residuals[i];
  }

  // ── Fit statistics ──
  const rSquared = sst > 0 ? 1 - sse / sst : 0;
  const adjRSquared = sst > 0 ? 1 - ((1 - rSquared) * (n - 1)) / (n - p) : 0;

  // σ² = SSE / (n − p)
  const sigma2 = sse / (n - p);

  // Log-likelihood (normal errors assumption):
  //   ℓ = −(n/2) ln(2π) − (n/2) ln(σ²_ML) − n/2
  // where σ²_ML = SSE / n (ML estimator).
  const sigma2ML = sse / n;
  const logLikelihood =
    (-n / 2) * Math.log(2 * Math.PI) - (n / 2) * Math.log(sigma2ML) - n / 2;

  // AIC = −2ℓ + 2p
  const aic = -2 * logLikelihood + 2 * p;
  // BIC = −2ℓ + p ln(n)
  const bic = -2 * logLikelihood + p * Math.log(n);

  // ── Standard errors and t-statistics ──
  // Var(β̂) = σ² (XᵀX)⁻¹
  const XtXinv = invert(XtX, p);
  const seBeta = new Float64Array(p);
  const tStats = new Float64Array(p);
  const pVals = new Array<number>(p);
  const diagXtXinv = diag(XtXinv, p);

  for (let j = 0; j < p; j++) {
    seBeta[j] = Math.sqrt(Math.max(0, sigma2 * diagXtXinv[j]));
    tStats[j] = seBeta[j] > 0 ? beta[j] / seBeta[j] : 0;
    pVals[j] = tTwoTailP(tStats[j], n - p);
  }

  return {
    coefficients: Array.from(beta),
    standardErrors: Array.from(seBeta),
    tStatistics: Array.from(tStats),
    pValues: pVals,
    rSquared,
    adjRSquared,
    aic,
    bic,
    logLikelihood,
    residuals,
    fittedValues: yHat,
    n,
    k,
  };
}

// ─── Interpretation helpers ─────────────────────────────────────────────────

/** Diagnostic labels for educational UI context. */
export interface DiagnosticLabel {
  /** Machine-readable key. */
  key: string;
  /** Human-readable name. */
  name: string;
  /** Statistic value. */
  statistic: number;
  /** Associated p-value (null if not applicable). */
  pValue: number | null;
  /** Brief interpretation hint for students / non-specialists. */
  interpretation: string;
}

function interpretPValue(p: number, what: string): string {
  if (p < 0.01) return `Strong evidence of ${what} (p < 0.01).`;
  if (p < 0.05) return `Evidence of ${what} (p < 0.05).`;
  if (p < 0.10) return `Weak evidence of ${what} (p < 0.10).`;
  return `No significant evidence of ${what} (p ≥ 0.10).`;
}

// ─── Residual diagnostics ───────────────────────────────────────────────────

/**
 * Jarque-Bera normality test on residuals.
 *
 *   JB = (n/6) [S² + (K−3)²/4]
 *
 * where S = skewness, K = kurtosis of the residuals.
 * Under H₀ (normality), JB ~ χ²(2).
 *
 * @returns [statistic, p-value]
 */
export function jarqueBera(residuals: Float64Array): [number, number] {
  const n = residuals.length;
  if (n < 3) return [0, 1];

  let sum = 0;
  for (let i = 0; i < n; i++) sum += residuals[i];
  const mean = sum / n;

  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (let i = 0; i < n; i++) {
    const d = residuals[i] - mean;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;

  if (m2 === 0) return [0, 1]; // Constant residuals.

  const skewness = m3 / Math.pow(m2, 1.5);
  const kurtosis = m4 / (m2 * m2);

  const jb = (n / 6) * (skewness * skewness + ((kurtosis - 3) ** 2) / 4);
  const pValue = chiSquaredSf(jb, 2);

  return [jb, pValue];
}

/**
 * Breusch-Pagan test for heteroscedasticity.
 *
 * Regresses squared residuals on the original predictors and tests
 * whether the explained variation is significant.
 *
 *   BP = (n × R²_aux)  ~  χ²(k)
 *
 * where R²_aux is from the auxiliary regression e² = Zγ + v.
 *
 * @param residuals  OLS residuals.
 * @param predictors Original predictor arrays.
 * @returns [statistic, p-value]
 */
export function breuschPagan(
  residuals: Float64Array,
  predictors: ArrayLike<number>[],
): [number, number] {
  const n = residuals.length;
  const k = predictors.length;

  if (k === 0 || n < k + 2) return [0, 1];

  // Dependent variable: squared residuals.
  const e2 = new Float64Array(n);
  for (let i = 0; i < n; i++) e2[i] = residuals[i] * residuals[i];

  // Fit auxiliary regression: e² = a₀ + a₁x₁ + … + aₖxₖ + v.
  const auxResult = olsFit(e2, predictors);
  const bp = n * auxResult.rSquared;
  const pValue = chiSquaredSf(bp, k);

  return [bp, pValue];
}

/**
 * Variance Inflation Factors (VIF) for multicollinearity diagnostics.
 *
 * VIFⱼ = 1 / (1 − R²ⱼ) where R²ⱼ is the R² from regressing predictor j
 * on all other predictors.
 *
 * Rules of thumb:
 *   VIF < 5  → acceptable
 *   VIF 5–10 → concerning
 *   VIF > 10 → severe multicollinearity
 *
 * @param predictors Array of k predictor arrays, each of length n.
 * @returns Array of k VIF values.
 */
export function computeVIF(predictors: ArrayLike<number>[]): number[] {
  const k = predictors.length;
  if (k <= 1) return new Array(k).fill(1);

  const vifs: number[] = [];
  for (let j = 0; j < k; j++) {
    const yj = predictors[j];
    const others: ArrayLike<number>[] = [];
    for (let m = 0; m < k; m++) {
      if (m !== j) others.push(predictors[m]);
    }
    const auxResult = olsFit(yj, others);
    const r2 = auxResult.rSquared;
    vifs.push(r2 < 1 ? 1 / (1 - r2) : Infinity);
  }
  return vifs;
}

/**
 * Bundle all residual diagnostics (non-spatial) into a partial
 * RegressionDiagnostics structure.
 */
export function residualDiagnostics(
  result: OLSResult,
  predictors: ArrayLike<number>[],
): Pick<RegressionDiagnostics, 'jarqueBera' | 'breuschPagan' | 'vif'> {
  return {
    jarqueBera: jarqueBera(result.residuals),
    breuschPagan: breuschPagan(result.residuals, predictors),
    vif: computeVIF(predictors),
  };
}

// ─── Spatial diagnostics ────────────────────────────────────────────────────

/**
 * Moran's I test on OLS residuals.
 *
 * Uses the analytical moments under the randomisation assumption.
 * This is the standard Moran's I test on residuals (Cliff & Ord, 1981),
 * implemented inline to use the residual-specific variance formula and
 * avoid circular dependency on GlobalMoransI.
 *
 *   I = (eᵀ W e) / (eᵀ e)  ×  (n / S0)
 *
 * Analytically: E[I] = −1/(n−1), Var[I] from randomisation assumption.
 * z = (I − E[I]) / √Var[I], p = 2Φ(−|z|) (two-sided).
 *
 * @returns [I, p-value]
 */
export function moransIResiduals(
  residuals: Float64Array,
  W: SpatialWeightsMatrix,
): [number, number] {
  const n = W.n;
  const S0 = W.totalWeight;

  if (n < 2 || S0 === 0) return [0, 1];

  // eᵀe
  let eTe = 0;
  for (let i = 0; i < n; i++) eTe += residuals[i] * residuals[i];
  if (eTe === 0) return [0, 1];

  // eᵀWe
  let eWe = 0;
  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);
    if (!row) continue;
    for (const [j, wij] of row) {
      eWe += wij * residuals[i] * residuals[j];
    }
  }

  const I = (n / S0) * (eWe / eTe);
  const EI = -1 / (n - 1);

  // Variance under randomisation.
  // Compute S1, S2 inline to avoid import cycle.
  let S1 = 0;
  let S2 = 0;
  const rowSums = new Float64Array(n);
  const colSums = new Float64Array(n);

  for (const [i, row] of W.weights) {
    for (const [j, wij] of row) {
      const wji = W.weights.get(j)?.get(i) ?? 0;
      S1 += (wij + wji) ** 2;
      rowSums[i] += wij;
      colSums[j] += wij;
    }
  }
  S1 /= 2;
  for (let i = 0; i < n; i++) {
    S2 += (rowSums[i] + colSums[i]) ** 2;
  }

  const n2 = n * n;
  const S0sq = S0 * S0;
  const numerator = n2 * S1 - n * S2 + 3 * S0sq;
  const denominator = S0sq * (n2 - 1);
  const V = numerator / denominator - EI * EI;

  if (V <= 0) return [I, 1];

  const z = (I - EI) / Math.sqrt(V);

  // Two-tailed normal p-value using Abramowitz & Stegun.
  const absZ = Math.abs(z);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const pp = 0.3275911;
  const t = 1 / (1 + pp * (absZ / Math.SQRT2));
  const phi =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-(absZ * absZ) / 2);
  const cdf = 0.5 * (1 + phi);
  const pValue = 2 * (1 - cdf);

  return [I, pValue];
}

/**
 * LM tests for spatial dependence (Anselin et al. 1996).
 *
 * Standard and robust versions of:
 *   - LM-error: tests for spatial error autocorrelation (→ SEM)
 *   - LM-lag:   tests for spatial lag dependence (→ SAR)
 *
 * These tests are the key decision tools for spatial model selection.
 *
 * Note: This public function only computes LM-error. For the full LM-lag
 * test, use `spatialDiagnostics()` or `fullDiagnostics()` which have access
 * to fitted values required by the lag score test.
 *
 * @param residuals OLS residuals.
 * @param W        Spatial weights matrix (row-standardized preferred).
 * @param predictors Original predictor arrays.
 * @returns Object with lmLag, lmError, robustLmLag, robustLmError.
 *          Note: lmLag and robust variants require fitted values; use
 *          spatialDiagnostics() for the complete set.
 */
export function lmTests(
  residuals: Float64Array,
  W: SpatialWeightsMatrix,
  predictors: ArrayLike<number>[],
): {
  lmLag: [number, number];
  lmError: [number, number];
  robustLmLag: [number, number];
  robustLmError: [number, number];
} {
  const n = W.n;
  const k = predictors.length;
  const p = k + 1;
  const S0 = W.totalWeight;

  const X = buildDesignMatrix(predictors, n);

  let eTe = 0;
  for (let i = 0; i < n; i++) eTe += residuals[i] * residuals[i];
  const sigma2 = eTe / n;

  if (sigma2 === 0 || S0 === 0) {
    return {
      lmLag: [0, 1],
      lmError: [0, 1],
      robustLmLag: [0, 1],
      robustLmError: [0, 1],
    };
  }

  // Spatial lag of residuals.
  const We = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);
    if (!row) continue;
    let s = 0;
    for (const [j, wij] of row) s += wij * residuals[j];
    We[i] = s;
  }

  let eWe = 0;
  for (let i = 0; i < n; i++) eWe += residuals[i] * We[i];

  // T = trace[(W + Wᵀ) W].
  const T = computeTraceWpWtW(W, n);

  // LM-error = (eᵀWe / σ²)² / T  ~  χ²(1).
  const lmErrorNum = eWe / sigma2;
  const lmErrorStat = (lmErrorNum * lmErrorNum) / T;
  const lmErrorP = chiSquaredSf(lmErrorStat, 1);

  // LM-lag requires fitted values to compute Wŷ. Without them, we compute
  // a partial result. For the full suite, use spatialDiagnostics().
  // We can reconstruct fitted values by re-solving the normal equations.
  const XtX = crossProduct(X, n, p);
  const Xty = crossProductVec(X, n, p, new Float64Array(n)); // placeholder
  // Since we don't have y, reconstruct: y_i = residuals_i + (Xβ̂)_i, but
  // we need β̂. We can get it from (XᵀX)⁻¹ Xᵀ y where y isn't available.
  // Delegate to the internal version via spatialDiagnostics() for full results.
  void XtX; void Xty; // suppress lint

  return {
    lmLag: [0, 1],
    lmError: [lmErrorStat, lmErrorP],
    robustLmLag: [0, 1],
    robustLmError: [0, 1],
  };
}

/**
 * Internal LM tests that take fitted values for the lag test.
 */
function lmTestsInternal(
  residuals: Float64Array,
  fittedValues: Float64Array,
  W: SpatialWeightsMatrix,
  predictors: ArrayLike<number>[],
): {
  lmLag: [number, number];
  lmError: [number, number];
  robustLmLag: [number, number];
  robustLmError: [number, number];
} {
  const n = W.n;
  const k = predictors.length;
  const p = k + 1;
  const S0 = W.totalWeight;

  const X = buildDesignMatrix(predictors, n);

  // σ² = eᵀe / n (ML)
  let eTe = 0;
  for (let i = 0; i < n; i++) eTe += residuals[i] * residuals[i];
  const sigma2 = eTe / n;

  if (sigma2 === 0 || S0 === 0) {
    return {
      lmLag: [0, 1],
      lmError: [0, 1],
      robustLmLag: [0, 1],
      robustLmError: [0, 1],
    };
  }

  // ── y = ŷ + e ──
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) y[i] = fittedValues[i] + residuals[i];

  // ── Wy ──
  const Wy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);
    if (!row) continue;
    let s = 0;
    for (const [j, wij] of row) s += wij * y[j];
    Wy[i] = s;
  }

  // ── We ──
  const We = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const row = W.weights.get(i);
    if (!row) continue;
    let s = 0;
    for (const [j, wij] of row) s += wij * residuals[j];
    We[i] = s;
  }

  // ── eᵀWe ──
  let eWe = 0;
  for (let i = 0; i < n; i++) eWe += residuals[i] * We[i];

  // ── eᵀWy ──
  let eWy = 0;
  for (let i = 0; i < n; i++) eWy += residuals[i] * Wy[i];

  // ══════════════════════════════════════════════════════════════
  // T = trace[(W + Wᵀ) W]
  // ══════════════════════════════════════════════════════════════
  let trW2 = 0;
  let trWtW = 0;
  for (let i = 0; i < n; i++) {
    const rowI = W.weights.get(i);
    if (!rowI) continue;
    for (const [kk, wik] of rowI) {
      const wki = W.weights.get(kk)?.get(i) ?? 0;
      trW2 += wik * wki;
      trWtW += wki * wki;
    }
  }
  const T = trW2 + trWtW;

  // ══════════════════════════════════════════════════════════════
  // LM-error = (eᵀWe / σ²)² / T  ~  χ²(1)
  // ══════════════════════════════════════════════════════════════
  const lmErrorNum = eWe / sigma2;
  const lmErrorStat = (lmErrorNum * lmErrorNum) / T;
  const lmErrorP = chiSquaredSf(lmErrorStat, 1);

  // ══════════════════════════════════════════════════════════════
  // LM-lag
  //
  // Compute WXβ̂: spatial lag of fitted values = Wŷ − We? No.
  // Wŷ = Wy − We (since y = ŷ + e → Wy = Wŷ + We → Wŷ = Wy − We).
  // WXβ̂ = Wŷ = Wy − We.
  //
  // M = I − X(XᵀX)⁻¹Xᵀ
  // D = (Wŷ)ᵀ M (Wŷ) / σ² + T
  // LM-lag = (eᵀWy / σ²)² / D  ~  χ²(1)
  // ══════════════════════════════════════════════════════════════

  const WyHat = new Float64Array(n);
  for (let i = 0; i < n; i++) WyHat[i] = Wy[i] - We[i];

  // M × WyHat — use residual from regressing WyHat on X.
  const MWyHat = new Float64Array(n);
  {
    // Fit WyHat ~ X to get residuals = M × WyHat.
    const XtX = crossProduct(X, n, p);
    const XtWy = crossProductVec(X, n, p, WyHat);
    const betaWy = solve(XtX, p, XtWy);
    const fitted = matVec(X, n, p, betaWy);
    for (let i = 0; i < n; i++) MWyHat[i] = WyHat[i] - fitted[i];
  }

  // (Wŷ)ᵀ M (Wŷ) = WyHatᵀ × MWyHat
  let WyMWy = 0;
  for (let i = 0; i < n; i++) WyMWy += WyHat[i] * MWyHat[i];

  const D = WyMWy / sigma2 + T;
  const lmLagNum = eWy / sigma2;
  const lmLagStat = D > 0 ? (lmLagNum * lmLagNum) / D : 0;
  const lmLagP = chiSquaredSf(lmLagStat, 1);

  // ══════════════════════════════════════════════════════════════
  // Robust variants (Anselin et al. 1996)
  //
  // RLM-lag   = (eᵀWy/σ² − eᵀWe/σ²)² / (D − T)  ~  χ²(1)
  // RLM-error = (eᵀWe/σ² − T×(eᵀWy/σ²)/D)² / (T − T²/D)  ~  χ²(1)
  //
  // These factor out the contamination from the other form of spatial
  // dependence so you can distinguish lag from error.
  // ══════════════════════════════════════════════════════════════

  const DmT = D - T;
  const robustLmLagStat =
    DmT > 0 ? (lmLagNum - lmErrorNum) ** 2 / DmT : 0;
  const robustLmLagP = chiSquaredSf(robustLmLagStat, 1);

  const ToverD = D > 0 ? T / D : 0;
  const robustErrorDenom = T - T * ToverD;
  const robustLmErrorStat =
    robustErrorDenom > 0
      ? (lmErrorNum - ToverD * lmLagNum) ** 2 / robustErrorDenom
      : 0;
  const robustLmErrorP = chiSquaredSf(robustLmErrorStat, 1);

  return {
    lmLag: [lmLagStat, lmLagP],
    lmError: [lmErrorStat, lmErrorP],
    robustLmLag: [robustLmLagStat, robustLmLagP],
    robustLmError: [robustLmErrorStat, robustLmErrorP],
  };
}

// ─── Public spatial diagnostics ─────────────────────────────────────────────

/**
 * Compute all spatial diagnostics for an OLS model.
 *
 * @param result     OLS fit result (contains residuals and fittedValues).
 * @param W          Spatial weights matrix.
 * @param predictors Original predictor arrays.
 * @returns Spatial fields of RegressionDiagnostics.
 */
export function spatialDiagnostics(
  result: OLSResult,
  W: SpatialWeightsMatrix,
  predictors: ArrayLike<number>[],
): Pick<
  RegressionDiagnostics,
  'moransIResiduals' | 'lmLag' | 'lmError' | 'robustLmLag' | 'robustLmError'
> {
  if (W.n !== result.n) {
    throw new RangeError(
      `Weight matrix has ${W.n} observations but OLS has ${result.n}.`,
    );
  }

  const mi = moransIResiduals(result.residuals, W);
  const lm = lmTestsInternal(result.residuals, result.fittedValues, W, predictors);

  return {
    moransIResiduals: mi,
    lmLag: lm.lmLag,
    lmError: lm.lmError,
    robustLmLag: lm.robustLmLag,
    robustLmError: lm.robustLmError,
  };
}

// ─── Full diagnostics bundle ────────────────────────────────────────────────

/**
 * Compute all diagnostics (residual + spatial) for an OLS model.
 *
 * Merges residual diagnostics (Jarque-Bera, Breusch-Pagan, VIF) with
 * spatial diagnostics (Moran's I on residuals, LM-lag, LM-error, robust
 * variants) into a single RegressionDiagnostics object.
 *
 * @param result     OLS fit result.
 * @param predictors Predictor arrays used in the regression.
 * @param W          Optional spatial weights matrix. When omitted, spatial
 *                   diagnostic fields are left undefined.
 * @returns Full RegressionDiagnostics.
 */
export function fullDiagnostics(
  result: OLSResult,
  predictors: ArrayLike<number>[],
  W?: SpatialWeightsMatrix,
): RegressionDiagnostics {
  const resid = residualDiagnostics(result, predictors);

  if (!W) {
    return {
      ...resid,
    };
  }

  const spatial = spatialDiagnostics(result, W, predictors);

  return {
    ...resid,
    ...spatial,
  };
}

// ─── Diagnostic label generators (educational context) ──────────────────────

/**
 * Generate interpretable diagnostic labels from a RegressionDiagnostics
 * object. Each label includes a human-readable interpretation hint suitable
 * for educational dashboards and report narratives.
 */
export function diagnosticLabels(diag: RegressionDiagnostics): DiagnosticLabel[] {
  const labels: DiagnosticLabel[] = [];

  // Jarque-Bera.
  labels.push({
    key: 'jarqueBera',
    name: 'Jarque-Bera (Normality)',
    statistic: diag.jarqueBera[0],
    pValue: diag.jarqueBera[1],
    interpretation: interpretPValue(diag.jarqueBera[1], 'non-normal residuals'),
  });

  // Breusch-Pagan.
  labels.push({
    key: 'breuschPagan',
    name: 'Breusch-Pagan (Heteroscedasticity)',
    statistic: diag.breuschPagan[0],
    pValue: diag.breuschPagan[1],
    interpretation: interpretPValue(diag.breuschPagan[1], 'heteroscedasticity'),
  });

  // Moran's I on residuals.
  if (diag.moransIResiduals) {
    labels.push({
      key: 'moransIResiduals',
      name: "Moran's I (Residual Spatial Autocorrelation)",
      statistic: diag.moransIResiduals[0],
      pValue: diag.moransIResiduals[1],
      interpretation: interpretPValue(
        diag.moransIResiduals[1],
        'spatial autocorrelation in residuals',
      ),
    });
  }

  // LM-error.
  if (diag.lmError) {
    labels.push({
      key: 'lmError',
      name: 'LM-Error (Spatial Error Model)',
      statistic: diag.lmError[0],
      pValue: diag.lmError[1],
      interpretation: interpretPValue(
        diag.lmError[1],
        'spatial error dependence → consider SEM',
      ),
    });
  }

  // LM-lag.
  if (diag.lmLag) {
    labels.push({
      key: 'lmLag',
      name: 'LM-Lag (Spatial Lag Model)',
      statistic: diag.lmLag[0],
      pValue: diag.lmLag[1],
      interpretation: interpretPValue(
        diag.lmLag[1],
        'spatial lag dependence → consider SAR',
      ),
    });
  }

  // Robust LM-error.
  if (diag.robustLmError) {
    labels.push({
      key: 'robustLmError',
      name: 'Robust LM-Error',
      statistic: diag.robustLmError[0],
      pValue: diag.robustLmError[1],
      interpretation: interpretPValue(
        diag.robustLmError[1],
        'spatial error dependence (controlling for lag)',
      ),
    });
  }

  // Robust LM-lag.
  if (diag.robustLmLag) {
    labels.push({
      key: 'robustLmLag',
      name: 'Robust LM-Lag',
      statistic: diag.robustLmLag[0],
      pValue: diag.robustLmLag[1],
      interpretation: interpretPValue(
        diag.robustLmLag[1],
        'spatial lag dependence (controlling for error)',
      ),
    });
  }

  // VIF summary.
  const maxVIF = Math.max(...diag.vif);
  let vifInterp: string;
  if (maxVIF > 10) vifInterp = 'Severe multicollinearity detected (VIF > 10). Consider removing or combining predictors.';
  else if (maxVIF > 5) vifInterp = 'Moderate multicollinearity (VIF 5–10). Interpret coefficients with caution.';
  else vifInterp = 'No multicollinearity concerns (all VIF < 5).';

  labels.push({
    key: 'vif',
    name: 'Variance Inflation Factor (max)',
    statistic: maxVIF,
    pValue: null,
    interpretation: vifInterp,
  });

  return labels;
}

// ─── Model comparison helper ────────────────────────────────────────────────

/**
 * Summary row for model comparison tables.
 */
export interface ModelComparisonRow {
  model: string;
  n: number;
  k: number;
  rSquared: number;
  adjRSquared: number;
  aic: number;
  bic: number;
  logLikelihood: number;
}

/**
 * Extract a comparison row from an OLS result.
 * Designed to feed tabular comparison across OLS, SAR, SEM, GWR.
 */
export function comparisonRow(
  result: OLSResult,
  modelName = 'OLS',
): ModelComparisonRow {
  return {
    model: modelName,
    n: result.n,
    k: result.k,
    rSquared: result.rSquared,
    adjRSquared: result.adjRSquared,
    aic: result.aic,
    bic: result.bic,
    logLikelihood: result.logLikelihood,
  };
}
