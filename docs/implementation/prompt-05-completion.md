# Prompt 05 — Getis-Ord Gi* Hot Spot Analysis: Completion Report

**Status**: COMPLETE  
**Date**: 2026-03-23  
**Validation Gate**: ALL PASS  

---

## Scope Completed

Full Getis-Ord Gi* hot spot / cold spot analysis engine providing formal spatial cluster detection suitable for policy targeting and spatial intervention design. Includes per-observation z-scores, two-tailed p-values via normal CDF approximation, confidence classification at 90/95/99% thresholds, GeoJSON-ready feature properties, legend metadata, and convenience accessors for z-score and confidence maps.

## Key Files Added or Updated

| File | Action | Purpose |
|------|--------|---------|
| `src/engine/spatial-stats/autocorrelation/GetisOrdGi.ts` | **Created** | Getis-Ord Gi* engine (~300 lines) |
| `src/engine/spatial-stats/autocorrelation/__tests__/GetisOrdGi.test.ts` | **Created** | 35 unit tests across 6 describe blocks + performance benchmark |
| `src/engine/spatial-stats/autocorrelation/index.ts` | Modified | Barrel-exports all GetisOrdGi functions and types |

## Analytical Methods Implemented

| Export | Type | Description |
|--------|------|-------------|
| `giStar(values, W, options)` | Main entry | Per-observation Gi* z-score, p-value, confidence class, GeoJSON properties |
| `zScoreMap(result)` | Accessor | Extract Float64Array of z-scores for continuous colour mapping |
| `confidenceMap(result)` | Accessor | Extract HotSpotConfidence[] for categorical thematic mapping |
| `hotSpotLegend()` | Utility | Returns 7-tier legend metadata (hot/cold at 90/95/99% + not-significant) |
| `GiStarOptions` | Type | `{ selfWeight?: boolean }` |
| `HotSpotResult` | Type | Full result: results[], featureProperties[], legend, summary, global stats |
| `HotSpotFeatureProperties` | Type | GeoJSON-ready properties per observation |
| `HotSpotLegendEntry` | Type | Legend entry: type, label, hex colour |

### Formula

$$G_i^* = \frac{\sum_j w_{ij} x_j - \bar{x} \sum_j w_{ij}}{S \sqrt{\frac{n \sum_j w_{ij}^2 - (\sum_j w_{ij})^2}{n - 1}}}$$

where $\bar{x} = \frac{1}{n}\sum_j x_j$ and $S = \sqrt{\frac{1}{n}\sum_j x_j^2 - \bar{x}^2}$.

### Confidence Categories

| Category | z-score threshold | Interpretation |
|----------|-------------------|----------------|
| **hot-99** | $z \geq 2.576$ | Hot spot at 99% confidence |
| **hot-95** | $1.960 \leq z < 2.576$ | Hot spot at 95% confidence |
| **hot-90** | $1.645 \leq z < 1.960$ | Hot spot at 90% confidence |
| **not-significant** | $\|z\| < 1.645$ | No significant clustering |
| **cold-90** | $-1.960 < z \leq -1.645$ | Cold spot at 90% confidence |
| **cold-95** | $-2.576 < z \leq -1.960$ | Cold spot at 95% confidence |
| **cold-99** | $z \leq -2.576$ | Cold spot at 99% confidence |

### Key Design Decisions

1. **Gi\* variant (self-weight)**: By default includes $w_{ii} = 1$ in the summation, making this the Gi* statistic (Ord & Getis 1995). Toggleable via `selfWeight: false` for the standard Gi.
2. **Analytical z-scores**: Uses exact normal-theory z-scores rather than permutation inference — the Gi* statistic is approximately standard normal for moderate n, so analytical p-values are appropriate and much faster.
3. **Abramowitz & Stegun CDF**: Normal CDF approximation with max error $7.5 \times 10^{-8}$, sufficient for all practical significance thresholds.
4. **Typed arrays**: `Float64Array` for input values; z-score map returns `Float64Array` for direct GPU/WebGL binding.
5. **Constant-field safety**: Returns all z=0, p=1, not-significant when variance = 0.
6. **Island handling**: When denominator = 0 (isolated observation without self-weight), z-score defaults to 0.
7. **Legend colours**: Red-yellow-blue diverging scheme consistent with GIS convention (ArcGIS-style hot/cold spot mapping).
8. **GeoJSON-ready output**: `featureProperties[]` includes index, value, giStar, zScore, pValue, confidence — directly injectable into GeoJSON Feature properties.

## Validation Performed

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS — no type errors |
| `npx vite build` | PASS — production bundle succeeds |
| `npx eslint` (changed files) | PASS — 0 errors, 0 warnings |
| `npx vitest run` | PASS — **134/134 tests** (40 SpatialWeights + 29 GlobalMoransI + 30 LocalMoransI + 35 GetisOrdGi) |

## Test Coverage Highlights

| Category | Tests | Notes |
|----------|-------|-------|
| Structural output | 5 | Result length, sequential indices, required fields, GeoJSON fields, original values |
| Hot spot detection | 2 | Positive z-scores for high-value clusters; "hot-*" labels |
| Cold spot detection | 2 | Negative z-scores for low-value clusters; "cold-*" labels |
| Confidence consistency | 1 | z-score thresholds match confidence categories exactly |
| p-value properties | 2 | Bounded [0,1]; larger |z| → smaller p |
| Summary counts | 2 | Sum to n for 3×3 and 5×5 grids |
| Null/constant pattern | 1 | Uniform field → all z=0, not-significant |
| Global statistics | 1 | Correct mean and std dev in result |
| Self-weight toggle | 1 | Disabling changes z-scores |
| Binary weights | 1 | Works with non-row-standardized weights |
| Island handling | 1 | No neighbours + no self-weight → z=0 |
| Serialization | 2 | Results and featureProperties survive JSON round-trip |
| Input validation | 2 | Wrong length, n < 3 |
| 5×5 gradient | 2 | Hot/cold corners; multiple confidence tiers present |
| zScoreMap | 2 | Float64Array type and value correctness |
| confidenceMap | 2 | Array length and value correctness |
| Legend | 4 | 7 entries, all categories, label/colour format, immutable copy |
| Result legend | 1 | Matches hotSpotLegend() |
| Performance benchmark | 1 | 50×50 grid (2500 obs) computes in < 2000ms |

## Acceptance Criteria Met

- ✅ Positive z-scores produce hot spot classes; negative z-scores produce cold spot classes
- ✅ Confidence categorization is internally consistent and documented
- ✅ Results can be serialized into feature properties without lossy conversion

## Next Steps (Prompt 06)

OLS with Full Spatial Diagnostics — baseline regression engine with R², AIC/BIC, Jarque-Bera, Breusch-Pagan, spatial diagnostics (Moran's I on residuals, LM-lag, LM-error), and VIF.
