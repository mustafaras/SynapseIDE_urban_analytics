/**
 * GWR — Geographically Weighted Regression
 *
 * Local coefficient estimation allowing spatially varying relationships
 * between dependent and independent variables.  Each observation gets its
 * own regression surface, with geographic distance controlling the
 * influence of neighboring observations via a kernel function.
 *
 * Computational notes:
 * - Total complexity: O(n² × p²) per bandwidth candidate.
 *   Bandwidth selection adds a factor of ~30 golden-section iterations.
 * - Recommended limit: n ≤ 5 000 for interactive use.  Larger datasets
 *   should use the worker pathway (useWorker: true) to keep the UI
 *   responsive.
 * - Distances are Euclidean on projected coordinates.  For geographic
 *   coordinates, project to a local CRS first.
 *
 * References:
 *   Fotheringham, A.S., Brunsdon, C. & Charlton, M. (2002)
 *     Geographically Weighted Regression. Wiley.
 *   Hurvich, C.M., Simonoff, J.S. & Tsai, C.L. (1998)
 *     "Smoothing parameter selection in nonparametric regression using
 *      an improved Akaike information criterion."
 *     JRSS-B 60(2): 271–293.
 */

import type { Coordinate, GWRResult, KernelType } from '../types';
import { invert } from '../math';

// ─── Module-local types ─────────────────────────────────────────────────────

/** Options for GWR estimation. */
export interface GWROptions {
  /** Kernel function type (default: 'bisquare'). */
  kernel?: KernelType;
  /** Fixed bandwidth; if omitted, selected via AICc minimisation. */
  bandwidth?: number;
  /** Tolerance for golden-section bandwidth search (default: 0.1% of range). */
  bwSearchTol?: number;
  /** Attempt computation in a Web Worker (default: true). */
  useWorker?: boolean;
}

/** A single parameter surface for thematic mapping. */
export interface GWRParameterSurface {
  /** Human-readable parameter name. */
  name: string;
  /** Index into the coefficient vector (0 = intercept). */
  parameterIndex: number;
  /** Coefficient at each observation location. */
  coefficients: Float64Array;
  /** Standard error at each observation location. */
  standardErrors: Float64Array;
  /** t-statistic at each observation location. */
  tStatistics: Float64Array;
  /** Summary statistics for colour-ramp mapping. */
  summary: { min: number; max: number; mean: number; std: number };
}

/**
 * Internal flat-array result from core computation.
 * Exported for the companion worker — prefer `gwrFit` or `gwrFitSync`.
 * @internal
 */
export interface GWRCoreResult {
  betasFlat: Float64Array;      // n × p column-major
  seFlat: Float64Array;         // n × p column-major
  localR2: Float64Array;        // n
  hatDiag: Float64Array;        // n
  residuals: Float64Array;      // n
  fittedValues: Float64Array;   // n
  bandwidth: number;
  aicc: number;
  trS: number;
  trSTS: number;
  sigma2: number;
}

// ─── Kernel functions ───────────────────────────────────────────────────────

/**
 * Kernel weight for a given distance and bandwidth.
 *
 *   Gaussian:     K(u) = exp(−½ u²)
 *   Bisquare:     K(u) = (1 − u²)²   if u < 1, else 0
 *   Exponential:  K(u) = exp(−u)
 *
 * where u = distance / bandwidth.
 */
export function kernelWeight(
  distance: number,
  bandwidth: number,
  type: KernelType,
): number {
  if (bandwidth <= 0) return 0;
  const u = distance / bandwidth;
  switch (type) {
    case 'gaussian':
      return Math.exp(-0.5 * u * u);
    case 'bisquare':
      return u < 1 ? (1 - u * u) ** 2 : 0;
    case 'exponential':
      return Math.exp(-u);
    default:
      return 0;
  }
}

// ─── Distance helpers ───────────────────────────────────────────────────────

/** Compute Euclidean distances from observation i to all observations. */
function distancesFrom(
  coords: Float64Array,
  i: number,
  n: number,
): Float64Array {
  const d = new Float64Array(n);
  const xi = coords[2 * i];
  const yi = coords[2 * i + 1];
  for (let j = 0; j < n; j++) {
    const dx = xi - coords[2 * j];
    const dy = yi - coords[2 * j + 1];
    d[j] = Math.sqrt(dx * dx + dy * dy);
  }
  return d;
}

// ─── Design matrix ──────────────────────────────────────────────────────────

/**
 * Build the n × p design matrix (column-major Float64Array) with
 * a leading intercept column of ones.
 */
function buildDesignMatrix(
  predictors: ArrayLike<number>[],
  n: number,
): Float64Array {
  const k = predictors.length;
  const p = k + 1;
  const X = new Float64Array(n * p);
  for (let i = 0; i < n; i++) X[i] = 1; // intercept col 0
  for (let j = 0; j < k; j++) {
    const col = predictors[j];
    for (let i = 0; i < n; i++) X[i + (j + 1) * n] = col[i];
  }
  return X;
}

// ─── Bandwidth bounds ───────────────────────────────────────────────────────

/**
 * Compute initial search bracket [bwMin, bwMax].
 * bwMin: max over observations of the p-th nearest-neighbor distance
 *        (ensures at least p neighbors for solvability at every location).
 * bwMax: maximum pairwise distance.
 */
function bandwidthBounds(
  coords: Float64Array,
  n: number,
  p: number,
): [number, number] {
  let bwMin = 0;
  let bwMax = 0;

  for (let i = 0; i < n; i++) {
    const dists = distancesFrom(coords, i, n);
    const sorted = Float64Array.from(dists).sort();
    // Need at least p non-self neighbours → look at sorted[p] (sorted[0]=0 self)
    const kth = Math.min(p, n - 1);
    if (sorted[kth] > bwMin) bwMin = sorted[kth];
    if (sorted[n - 1] > bwMax) bwMax = sorted[n - 1];
  }

  // Small buffer for numerical stability (bisquare needs d < h strictly)
  bwMin *= 1.01;

  return [bwMin, bwMax];
}

// ─── Golden-section search ──────────────────────────────────────────────────

function goldenSection(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number,
  maxIter = 50,
): number {
  const phi = (Math.sqrt(5) - 1) / 2;
  let x1 = b - phi * (b - a);
  let x2 = a + phi * (b - a);
  let f1 = f(x1);
  let f2 = f(x2);

  for (let iter = 0; iter < maxIter && b - a > tol; iter++) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = b - phi * (b - a);
      f1 = f(x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = a + phi * (b - a);
      f2 = f(x2);
    }
  }
  return (a + b) / 2;
}

// ─── AICc for a candidate bandwidth ────────────────────────────────────────

/**
 * Compute AICc for a given bandwidth value.
 *
 * AICc = n ln(σ̂²) + n ln(2π) + n(n + tr(S)) / (n − 2 − tr(S))
 * where σ̂² = RSS / n  (ML estimator).
 */
function computeAICc(
  coords: Float64Array,
  X: Float64Array,
  y: Float64Array,
  n: number,
  p: number,
  h: number,
  kernel: KernelType,
): number {
  let rss = 0;
  let trS = 0;

  // Reusable buffer for weighted normal equations
  const XtWX = new Float64Array(p * p);
  const XtWy = new Float64Array(p);

  for (let i = 0; i < n; i++) {
    XtWX.fill(0);
    XtWy.fill(0);

    const dists = distancesFrom(coords, i, n);

    // Accumulate X'WX and X'Wy
    for (let j = 0; j < n; j++) {
      const wj = kernelWeight(dists[j], h, kernel);
      if (wj === 0) continue;
      for (let l = 0; l < p; l++) {
        const xwj = X[j + l * n] * wj;
        XtWy[l] += xwj * y[j];
        for (let m = l; m < p; m++) {
          const v = xwj * X[j + m * n];
          XtWX[l + m * p] += v;
          if (m !== l) XtWX[m + l * p] += v;
        }
      }
    }

    // Invert (X'WX) — solve/invert don't mutate input
    let Cinv: Float64Array;
    try {
      Cinv = invert(XtWX, p);
    } catch {
      return Infinity; // Singular at this bandwidth
    }

    // β = Cinv × X'Wy → fitted value at i
    let yhat = 0;
    for (let l = 0; l < p; l++) {
      let bl = 0;
      for (let m = 0; m < p; m++) bl += Cinv[l + m * p] * XtWy[m];
      yhat += X[i + l * n] * bl;
    }
    rss += (y[i] - yhat) ** 2;

    // Hat diagonal: h_ii = x_i' Cinv x_i  (w_ii = 1 for all kernels)
    let xCx = 0;
    for (let l = 0; l < p; l++) {
      for (let m = 0; m < p; m++) {
        xCx += X[i + l * n] * Cinv[l + m * p] * X[i + m * n];
      }
    }
    trS += xCx;
  }

  const sigma2 = rss / n;
  if (sigma2 <= 0 || n - 2 - trS <= 0) return Infinity;
  return (
    n * Math.log(sigma2) +
    n * Math.log(2 * Math.PI) +
    (n * (n + trS)) / (n - 2 - trS)
  );
}

// ─── Full fit at a given bandwidth ─────────────────────────────────────────

function fullFit(
  coords: Float64Array,
  X: Float64Array,
  y: Float64Array,
  n: number,
  p: number,
  h: number,
  kernel: KernelType,
): GWRCoreResult {
  const betasFlat = new Float64Array(n * p);
  const CinvDiagFlat = new Float64Array(n * p);
  const localR2 = new Float64Array(n);
  const hatDiag = new Float64Array(n);
  const residuals = new Float64Array(n);
  const fittedValues = new Float64Array(n);
  let trS = 0;
  let trSTS = 0;
  let rss = 0;

  // Reusable buffers
  const XtWX = new Float64Array(p * p);
  const XtWy = new Float64Array(p);
  const q = new Float64Array(p);

  for (let i = 0; i < n; i++) {
    XtWX.fill(0);
    XtWy.fill(0);

    const dists = distancesFrom(coords, i, n);

    // Precompute weights for this observation
    const w = new Float64Array(n);
    for (let j = 0; j < n; j++) w[j] = kernelWeight(dists[j], h, kernel);

    // Accumulate weighted normal equations
    for (let j = 0; j < n; j++) {
      if (w[j] === 0) continue;
      for (let l = 0; l < p; l++) {
        const xwj = X[j + l * n] * w[j];
        XtWy[l] += xwj * y[j];
        for (let m = l; m < p; m++) {
          const v = xwj * X[j + m * n];
          XtWX[l + m * p] += v;
          if (m !== l) XtWX[m + l * p] += v;
        }
      }
    }

    // Invert — returns new array, doesn't mutate XtWX
    let Cinv: Float64Array;
    try {
      Cinv = invert(XtWX, p);
    } catch {
      // Singular WLS at this location — mark as NaN
      for (let l = 0; l < p; l++) {
        betasFlat[i + l * n] = NaN;
        CinvDiagFlat[i + l * n] = NaN;
      }
      residuals[i] = y[i];
      fittedValues[i] = 0;
      rss += y[i] * y[i];
      continue;
    }

    // Local coefficients: β_i = Cinv × X'Wy
    for (let l = 0; l < p; l++) {
      let s = 0;
      for (let m = 0; m < p; m++) s += Cinv[l + m * p] * XtWy[m];
      betasFlat[i + l * n] = s;
    }

    // Fitted value at i
    let yhat = 0;
    for (let l = 0; l < p; l++) yhat += X[i + l * n] * betasFlat[i + l * n];
    fittedValues[i] = yhat;
    residuals[i] = y[i] - yhat;
    rss += residuals[i] * residuals[i];

    // Hat diagonal: x_i' Cinv x_i   (w_{ii} = 1 since d(i,i) = 0)
    let xCx = 0;
    for (let l = 0; l < p; l++) {
      for (let m = 0; m < p; m++) {
        xCx += X[i + l * n] * Cinv[l + m * p] * X[i + m * n];
      }
    }
    hatDiag[i] = xCx;
    trS += xCx;

    // Cinv diagonals for standard errors
    for (let l = 0; l < p; l++) {
      CinvDiagFlat[i + l * n] = Cinv[l + l * p];
    }

    // ── Local R² ──
    let sumW = 0;
    let sumWy = 0;
    for (let j = 0; j < n; j++) {
      sumW += w[j];
      sumWy += w[j] * y[j];
    }
    const ybarW = sumW > 0 ? sumWy / sumW : 0;
    let ssResW = 0;
    let ssTotW = 0;
    for (let j = 0; j < n; j++) {
      if (w[j] === 0) continue;
      let fitj = 0;
      for (let l = 0; l < p; l++) fitj += X[j + l * n] * betasFlat[i + l * n];
      ssResW += w[j] * (y[j] - fitj) ** 2;
      ssTotW += w[j] * (y[j] - ybarW) ** 2;
    }
    localR2[i] = ssTotW > 0 ? Math.max(0, 1 - ssResW / ssTotW) : 0;

    // ── tr(SᵀS) contribution ──
    // q = Cinv × x_i, then Σ_j (q·x_j × w_j)²
    for (let l = 0; l < p; l++) {
      let s = 0;
      for (let m = 0; m < p; m++) s += Cinv[l + m * p] * X[i + m * n];
      q[l] = s;
    }
    for (let j = 0; j < n; j++) {
      if (w[j] === 0) continue;
      let dot = 0;
      for (let l = 0; l < p; l++) dot += q[l] * X[j + l * n];
      trSTS += (dot * w[j]) ** 2;
    }
  }

  // Global σ²: RSS / δ₁  where δ₁ = n − 2 tr(S) + tr(SᵀS)
  const delta1 = n - 2 * trS + trSTS;
  const sigma2 = delta1 > 0 ? rss / delta1 : rss / Math.max(n - trS, 1);

  // Standard errors
  const seFlat = new Float64Array(n * p);
  for (let i = 0; i < n; i++) {
    for (let l = 0; l < p; l++) {
      const cii = CinvDiagFlat[i + l * n];
      seFlat[i + l * n] = cii > 0 ? Math.sqrt(sigma2 * cii) : NaN;
    }
  }

  // AICc (ML σ²)
  const sigma2ML = rss / n;
  let aicc = Infinity;
  if (sigma2ML > 0 && n - 2 - trS > 0) {
    aicc =
      n * Math.log(sigma2ML) +
      n * Math.log(2 * Math.PI) +
      (n * (n + trS)) / (n - 2 - trS);
  }

  return {
    betasFlat,
    seFlat,
    localR2,
    hatDiag,
    residuals,
    fittedValues,
    bandwidth: h,
    aicc,
    trS,
    trSTS,
    sigma2,
  };
}

// ─── Core computation ───────────────────────────────────────────────────────

/**
 * Core GWR computation operating on flat arrays.
 * Exported for the companion Web Worker — prefer `gwrFit` or `gwrFitSync`.
 * @internal
 */
export function gwrComputeCore(
  coordsFlat: Float64Array,
  X: Float64Array,
  y: Float64Array,
  n: number,
  p: number,
  kernel: KernelType,
  fixedBandwidth: number | null,
  bwSearchTol: number,
): GWRCoreResult {
  let bandwidth: number;
  if (fixedBandwidth != null && fixedBandwidth > 0) {
    bandwidth = fixedBandwidth;
  } else {
    const [bwMin, bwMax] = bandwidthBounds(coordsFlat, n, p);
    if (bwMax - bwMin < 1e-12) {
      throw new Error(
        'All observations have identical or near-identical coordinates; ' +
          'GWR requires spatial variation.',
      );
    }
    const tol = bwSearchTol > 0 ? bwSearchTol : (bwMax - bwMin) * 0.001;
    bandwidth = goldenSection(
      (h) => computeAICc(coordsFlat, X, y, n, p, h, kernel),
      bwMin,
      bwMax,
      tol,
    );
  }

  return fullFit(coordsFlat, X, y, n, p, bandwidth, kernel);
}

// ─── Flatten coordinates helper ─────────────────────────────────────────────

function flattenCoords(coords: Coordinate[], n: number): Float64Array {
  const flat = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) {
    flat[2 * i] = coords[i][0];
    flat[2 * i + 1] = coords[i][1];
  }
  return flat;
}

// ─── Convert core result to GWRResult ───────────────────────────────────────

function coreToResult(
  core: GWRCoreResult,
  coords: Coordinate[],
  n: number,
  p: number,
  k: number,
  kernel: KernelType,
): GWRResult {
  const localCoefficients: number[][] = [];
  const localStandardErrors: number[][] = [];
  const localTStatistics: number[][] = [];

  for (let i = 0; i < n; i++) {
    const coefs: number[] = [];
    const ses: number[] = [];
    const ts: number[] = [];
    for (let l = 0; l < p; l++) {
      const b = core.betasFlat[i + l * n];
      const se = core.seFlat[i + l * n];
      coefs.push(b);
      ses.push(se);
      ts.push(se > 0 && isFinite(se) ? b / se : 0);
    }
    localCoefficients.push(coefs);
    localStandardErrors.push(ses);
    localTStatistics.push(ts);
  }

  return {
    localCoefficients,
    localStandardErrors,
    localTStatistics,
    localRSquared: core.localR2,
    residuals: core.residuals,
    fittedValues: core.fittedValues,
    bandwidth: core.bandwidth,
    kernel,
    aicc: core.aicc,
    effectiveParams: core.trS,
    sigma2: core.sigma2,
    n,
    k,
    hatDiag: core.hatDiag,
    coords,
  };
}

// ─── Input validation ───────────────────────────────────────────────────────

function validate(
  y: ArrayLike<number>,
  predictors: ArrayLike<number>[],
  coords: Coordinate[],
): void {
  const n = y.length;
  const k = predictors.length;
  const p = k + 1;

  if (coords.length !== n) {
    throw new Error(
      `coords length (${coords.length}) must equal y length (${n})`,
    );
  }
  for (let j = 0; j < k; j++) {
    if (predictors[j].length !== n) {
      throw new Error(
        `predictor[${j}] length (${predictors[j].length}) must equal y length (${n})`,
      );
    }
  }
  if (n <= p + 1) {
    throw new Error(
      `Need at least p + 2 = ${p + 2} observations for GWR; got ${n}`,
    );
  }
}

// ─── Synchronous API ────────────────────────────────────────────────────────

/**
 * Run Geographically Weighted Regression synchronously on the main thread.
 *
 * @param y          Dependent variable (n observations).
 * @param predictors Array of k predictor arrays, each of length n.
 * @param coords     Observation coordinates (projected CRS recommended).
 * @param options    Kernel, bandwidth, tolerance, etc.
 */
export function gwrFitSync(
  y: ArrayLike<number>,
  predictors: ArrayLike<number>[],
  coords: Coordinate[],
  options?: GWROptions,
): GWRResult {
  validate(y, predictors, coords);

  const n = y.length;
  const k = predictors.length;
  const p = k + 1;
  const kernel = options?.kernel ?? 'bisquare';

  const coordsFlat = flattenCoords(coords, n);
  const X = buildDesignMatrix(predictors, n);
  const yArr = Float64Array.from(y as ArrayLike<number>);

  const core = gwrComputeCore(
    coordsFlat,
    X,
    yArr,
    n,
    p,
    kernel,
    options?.bandwidth ?? null,
    options?.bwSearchTol ?? 0,
  );
  return coreToResult(core, coords, n, p, k, kernel);
}

// ─── Worker helper ──────────────────────────────────────────────────────────

function workerCompute(
  coordsFlat: Float64Array,
  X: Float64Array,
  yArr: Float64Array,
  n: number,
  p: number,
  kernel: KernelType,
  bandwidth: number | null,
  bwSearchTol: number,
): Promise<GWRCoreResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('../../../workers/gwr.worker.ts', import.meta.url),
        { type: 'module' },
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('GWR worker timeout'));
      }, 300_000); // 5-minute timeout

      worker.onmessage = (e: MessageEvent) => {
        clearTimeout(timeout);
        worker.terminate();
        if (e.data?.ok) {
          resolve(e.data.result as GWRCoreResult);
        } else {
          reject(new Error(e.data?.error ?? 'GWR worker error'));
        }
      };

      worker.onerror = (err) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(err);
      };

      // Copy arrays for transfer (originals remain with caller)
      const cf = Float64Array.from(coordsFlat);
      const xf = Float64Array.from(X);
      const yf = Float64Array.from(yArr);

      worker.postMessage(
        {
          kind: 'gwr',
          coordsFlat: cf,
          xFlat: xf,
          yArr: yf,
          n,
          p,
          kernel,
          bandwidth,
          bwSearchTol,
        },
        [cf.buffer, xf.buffer, yf.buffer],
      );
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

// ─── Async API (worker with synchronous fallback) ───────────────────────────

/**
 * Run Geographically Weighted Regression.
 *
 * Attempts to use a Web Worker for heavy computation; falls back to
 * synchronous execution if workers are unavailable (e.g. test
 * environment, SSR).
 *
 * @param y          Dependent variable (n observations).
 * @param predictors Array of k predictor arrays, each of length n.
 * @param coords     Observation coordinates (projected CRS recommended).
 * @param options    Kernel, bandwidth, tolerance, worker preference.
 */
export async function gwrFit(
  y: ArrayLike<number>,
  predictors: ArrayLike<number>[],
  coords: Coordinate[],
  options?: GWROptions,
): Promise<GWRResult> {
  validate(y, predictors, coords);

  const n = y.length;
  const k = predictors.length;
  const p = k + 1;
  const kernel = options?.kernel ?? 'bisquare';

  const coordsFlat = flattenCoords(coords, n);
  const X = buildDesignMatrix(predictors, n);
  const yArr = Float64Array.from(y as ArrayLike<number>);

  // Try the worker pathway
  if (options?.useWorker !== false) {
    try {
      const core = await workerCompute(
        coordsFlat,
        X,
        yArr,
        n,
        p,
        kernel,
        options?.bandwidth ?? null,
        options?.bwSearchTol ?? 0,
      );
      return coreToResult(core, coords, n, p, k, kernel);
    } catch {
      // Worker unavailable or failed — fall through to sync
    }
  }

  // Synchronous fallback
  const core = gwrComputeCore(
    coordsFlat,
    X,
    yArr,
    n,
    p,
    kernel,
    options?.bandwidth ?? null,
    options?.bwSearchTol ?? 0,
  );
  return coreToResult(core, coords, n, p, k, kernel);
}

// ─── Parameter surface generation ───────────────────────────────────────────

/**
 * Extract per-parameter surfaces from a GWR result for map styling
 * and report figures.
 *
 * @param result  GWR result from `gwrFit` or `gwrFitSync`.
 * @param labels  Optional parameter names (default: 'Intercept', 'β1', …).
 */
export function gwrParameterSurfaces(
  result: GWRResult,
  labels?: string[],
): GWRParameterSurface[] {
  const { localCoefficients, localStandardErrors, localTStatistics, n, k } =
    result;
  const p = k + 1;
  const surfaces: GWRParameterSurface[] = [];

  for (let l = 0; l < p; l++) {
    const name = labels?.[l] ?? (l === 0 ? 'Intercept' : `β${l}`);
    const coefficients = new Float64Array(n);
    const standardErrors = new Float64Array(n);
    const tStatistics = new Float64Array(n);

    let sum = 0;
    let sumSq = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < n; i++) {
      const c = localCoefficients[i][l];
      coefficients[i] = c;
      standardErrors[i] = localStandardErrors[i][l];
      tStatistics[i] = localTStatistics[i][l];
      sum += c;
      sumSq += c * c;
      if (c < min) min = c;
      if (c > max) max = c;
    }

    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const std = Math.sqrt(Math.max(0, variance));

    surfaces.push({
      name,
      parameterIndex: l,
      coefficients,
      standardErrors,
      tStatistics,
      summary: { min, max, mean, std },
    });
  }

  return surfaces;
}

// Re-export GWRResult from types for consumer convenience.
export type { GWRResult } from '../types';
