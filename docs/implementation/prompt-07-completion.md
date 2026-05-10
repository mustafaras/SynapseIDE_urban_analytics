# Prompt 07 — Geographically Weighted Regression: Completion Report

**Status**: COMPLETE  
**Date**: 2026-03-23  
**Validation Gate**: ALL PASS  

---

## Scope Completed

Full Geographically Weighted Regression (GWR) engine with local coefficient estimation, three kernel functions, golden-section bandwidth selection via AICc minimisation, local R² output, parameter surface generation for mapping, a Web Worker companion for background computation, and synchronous fallback for environments where workers are unavailable.

## Key Files Added or Updated

| File | Action | Purpose |
|------|--------|---------|
| `src/engine/spatial-stats/types.ts` | Modified | Added `GWRResult` interface |
| `src/engine/spatial-stats/regression/GWR.ts` | **Created** | GWR engine (~530 lines) |
| `src/workers/gwr.worker.ts` | **Created** | Web Worker companion (~60 lines) |
| `src/engine/spatial-stats/regression/index.ts` | Modified | Barrel-exports all GWR functions and types |
| `src/engine/spatial-stats/regression/__tests__/GWR.test.ts` | **Created** | 40 unit tests across 10 describe blocks |

## Analytical Methods Implemented

### Kernel Functions

| Kernel | Formula | Compact support |
|--------|---------|-----------------|
| Gaussian | $K(u) = \exp(-\tfrac{1}{2}u^2)$ | No (all observations contribute) |
| Bisquare | $K(u) = (1 - u^2)^2 \text{ if } u < 1, \text{ else } 0$ | Yes (observations beyond bandwidth have zero weight) |
| Exponential | $K(u) = \exp(-u)$ | No |

where $u = d_{ij} / h$ and $h$ is the bandwidth.

### Local Coefficient Estimation

At each observation location $i$, solve the weighted least squares problem:

$$\hat{\beta}_i = (X^T W_i X)^{-1} X^T W_i y$$

where $W_i = \text{diag}(w_{i1}, \ldots, w_{in})$ with $w_{ij} = K(d_{ij}/h)$.

### Bandwidth Selection

Golden-section search minimising the corrected Akaike Information Criterion (Hurvich et al., 1998):

$$\text{AICc} = n \ln(\hat{\sigma}^2) + n \ln(2\pi) + \frac{n(n + \text{tr}(S))}{n - 2 - \text{tr}(S)}$$

where $\hat{\sigma}^2 = \text{RSS}/n$ and $\text{tr}(S)$ is the trace of the hat matrix.

### Standard Errors

Global residual variance using the Fotheringham et al. (2002) corrected denominator:

$$\hat{\sigma}^2 = \frac{\text{RSS}}{\delta_1}, \quad \delta_1 = n - 2\,\text{tr}(S) + \text{tr}(S^TS)$$

Local standard errors: $\text{SE}(\hat{\beta}_{il}) = \hat{\sigma} \sqrt{C_{ii,l}}$ where $C_i = (X^T W_i X)^{-1}$.

### Local R²

$$R^2_i = 1 - \frac{\sum_j w_{ij}(y_j - x_j^T\hat{\beta}_i)^2}{\sum_j w_{ij}(y_j - \bar{y}_{w,i})^2}$$

where $\bar{y}_{w,i}$ is the kernel-weighted mean of $y$ at location $i$.

## Exported API

| Export | Type | Description |
|--------|------|-------------|
| `gwrFit(y, predictors, coords, options?)` | Async function | Main entry — tries worker, falls back to sync |
| `gwrFitSync(y, predictors, coords, options?)` | Function | Synchronous computation on main thread |
| `gwrParameterSurfaces(result, labels?)` | Function | Extract mappable parameter surfaces with summary statistics |
| `kernelWeight(distance, bandwidth, type)` | Function | Kernel weight evaluation |
| `gwrComputeCore(...)` | Function | Low-level core computation (used by worker) |
| `GWRResult` | Interface | Full result: local coefficients, SE, t-stats, R², residuals, etc. |
| `GWROptions` | Interface | `{ kernel?, bandwidth?, bwSearchTol?, useWorker? }` |
| `GWRParameterSurface` | Interface | Per-parameter surface for mapping |
| `GWRCoreResult` | Interface | Internal flat-array result for worker transfer |

### Key Design Decisions

1. **Shared core computation**: `gwrComputeCore` is imported by both the main module and the Web Worker, guaranteeing identical results from both pathways.
2. **Non-destructive linear algebra**: The `invert()` function from `math/linalg.ts` copies its input internally, so the reusable XtWX buffer is safe across iterations.
3. **Column-major storage**: Design matrix uses the same convention as OLS — element $(i,j)$ in an $m$-row matrix at index $i + j \cdot m$.
4. **Bandwidth bounds**: Lower bound = max over observations of the $p$-th nearest-neighbor distance (× 1.01 buffer); upper bound = max pairwise distance. Ensures solvability of local WLS at every location.
5. **Worker protocol**: Typed arrays are transferred (zero-copy) via `postMessage` transferable objects. 5-minute timeout prevents runaway computation.
6. **Graceful fallback**: If `Worker` constructor is unavailable (Node/SSR/test), `gwrFit` silently falls through to synchronous execution.
7. **Singular location handling**: If a local WLS is singular (rare edge case), coefficients are set to NaN and the observation is skipped gracefully.

### Computational Limits

- **Complexity**: $O(n^2 \times p^2)$ per bandwidth candidate; $O(n^2 \times p^2 \times I)$ for bandwidth selection where $I \approx 30$ golden-section iterations.
- **Recommended limit**: $n \leq 5{,}000$ for interactive use.  Larger datasets should use the worker pathway.
- **Coordinate system**: Euclidean distances on projected coordinates.  Geographic coordinates should be projected to a local CRS first.

## Validation Performed

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS — no type errors |
| `npx vite build` | PASS — production bundle succeeds |
| `npx eslint` (changed files) | PASS — 0 errors, 0 warnings |
| `npx vitest run` | PASS — **248/248 tests** (208 previous + 40 GWR) |

## Test Coverage Highlights

| Category | Tests | Notes |
|----------|-------|-------|
| Kernel weights | 8 | All 3 kernels: distance=0, decay, bisquare cutoff, invalid bandwidth |
| Constant relationship | 3 | GWR ≈ OLS when relationship doesn't vary (all 3 kernels) |
| Spatially varying coefficients | 3 | Intercept ↑ with column, slope ↓ with row, variation magnitude |
| Bandwidth selection | 3 | Convergence, finite AICc, plausible range |
| Result structure | 7 | Dimensions, residuals + fitted = y, hat diagonal, effective params, sigma2 |
| Local R² | 2 | Range [0,1], high for linear data |
| Parameter surfaces | 6 | Count, default/custom labels, length, summary ordering, value match |
| Input validation | 3 | Coords mismatch, predictor mismatch, too few observations |
| Async/sync equivalence | 2 | Fallback produces identical results, useWorker: false |
| Serialization | 1 | JSON round-trip of key fields |
| Multiple predictors | 1 | 2-predictor model recovers true coefficients |
| Performance benchmark | 1 | 10×10 grid with bandwidth selection < 5 seconds |

## Acceptance Criteria Met

- ✅ Bandwidth selection converges reliably (golden-section search with AICc)
- ✅ Worker and fallback pathways yield equivalent results (guaranteed by shared `gwrComputeCore`)
- ✅ Result surfaces are mappable without additional transformation (`gwrParameterSurfaces` with summary statistics)
- ✅ Local coefficient variation detected in spatially non-stationary test data
- ✅ Three kernel functions implemented with correct mathematical behaviour

## Cumulative Test Count

| Module | Tests |
|--------|-------|
| SpatialWeights (Prompt 02) | 40 |
| GlobalMoransI (Prompt 03) | 29 |
| LocalMoransI (Prompt 04) | 30 |
| GetisOrdGi (Prompt 05) | 35 |
| linalg (Prompt 06) | 15 |
| distributions (Prompt 06) | 13 |
| OLS (Prompt 06) | 46 |
| GWR (Prompt 07) | 40 |
| **Total** | **248** |

## Next Steps (Prompt 08)

STAC Client and Cloud Optimized GeoTIFF Reader — Earth observation access layer for remote sensing, environmental analytics, and future GeoAI pipelines.
