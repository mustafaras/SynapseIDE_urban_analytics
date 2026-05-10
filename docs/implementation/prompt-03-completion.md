# Prompt 03 — Global Moran's I with Permutation Inference: Completion Report

**Status**: COMPLETE  
**Date**: 2026-03-23  
**Validation Gate**: ALL PASS  

---

## Scope Completed

Full Global Moran's I implementation with analytical moments (randomisation assumption) and permutation-based pseudo p-values. Seeded PRNG ensures exact reproducibility.

## Key Files Added or Updated

| File | Action | Purpose |
|------|--------|---------|
| `src/engine/spatial-stats/autocorrelation/GlobalMoransI.ts` | **Created** | Global Moran's I engine (~240 lines) |
| `src/engine/spatial-stats/autocorrelation/__tests__/GlobalMoransI.test.ts` | **Created** | 29 unit tests across 12 describe blocks |
| `src/engine/spatial-stats/autocorrelation/index.ts` | Modified | Barrel-exports all GlobalMoransI functions and types |

## Analytical Methods Implemented

| Export | Type | Description |
|--------|------|-------------|
| `moransI(values, W, options)` | Main entry | Full inference: observed I, E[I], Var[I], z-score, pseudo p-value |
| `expectedI(n)` | Analytical | E[I] = −1/(n−1) |
| `varianceI(W)` | Analytical | Randomisation-assumption variance using S0, S1, S2 (Cliff & Ord 1981) |
| `zScore(observedI, W)` | Analytical | (I − E[I]) / √Var[I] |
| `pseudoPValue(values, W, observedI, perms, seed)` | Permutation | Two-sided: p = (R+1)/(M+1) per Anselin (1995) |
| `MoransIOptions` | Type | `{ permutations?: number; seed?: number }` |

### Formula

$$I = \frac{n}{S_0} \cdot \frac{\sum_i \sum_j w_{ij} z_i z_j}{\sum_i z_i^2}$$

where $z_i = x_i - \bar{x}$, $S_0 = \sum_i \sum_j w_{ij}$.

### Key Design Decisions

1. **Typed arrays throughout**: `Float64Array` for deviations and permutation working buffers — avoids boxing overhead on city-scale datasets.
2. **Mulberry32 PRNG**: Fast 32-bit seeded generator for reproducible permutation sequences. Fisher–Yates in-place shuffle avoids allocation per permutation.
3. **Two-sided permutation test**: Uses |I_perm| ≥ |I_obs| to detect both clustering and dispersion.
4. **Constant-field safety**: Returns I = 0 when all z_i = 0, avoiding 0/0 division.
5. **Accepts both ArrayLike and Float64Array**: The `moransI()` entry point converts plain arrays transparently.
6. **Aliased z-score export**: Exported as `moransIZScore` in barrel to avoid collision with future Gi* z-score.

## Validation Performed

| Check | Result |
|-------|--------|
| `npm run typecheck` (tsc --noEmit) | PASS |
| `npx vite build` | PASS (33.4s) |
| `npx eslint` on changed files | PASS (0 errors, 0 warnings) |
| `npx vitest run` (all autocorrelation tests) | PASS (69/69 tests, 408ms) |

## Test Coverage (29 tests, 12 describe blocks)

| Suite | Tests | Scenarios |
|-------|-------|-----------|
| expectedI | 2 | Analytical formula, boundary validation |
| varianceI | 2 | Positive value, binary vs row-standardized |
| zScore | 2 | Positive for clustered, negative for dispersed |
| pseudoPValue | 3 | Seeded reproducibility, valid range (0,1] |
| Clustered pattern | 4 | Positive I (3×3, 5×5), significant p-value, positive z-score |
| Dispersed pattern | 3 | Negative I (3×3, 5×5 checkerboard), negative z-score |
| Random pattern | 2 | Near-null I, non-significant p-value |
| Constant field | 1 | Returns 0 |
| Row-standardized | 1 | Works with row-standardized weights |
| Result contract | 3 | All fields present, expected = −1/(n−1), variance > 0 |
| Seeded reproducibility | 2 | Identical seed → identical results; deterministic observed I |
| Input validation | 3 | Length mismatch, invalid permutations, plain array acceptance |
| Default permutations | 1 | Defaults to 999 |

## Known Limitations

- **Analytical variance uses randomisation assumption only** — normality-assumption variance not implemented (rarely needed in practice; permutation p-value is preferred).
- **Performance**: O(n × perms) for permutation loop. For n > 50k with 999 perms, a web worker wrapper will be needed (deferred to later prompt when worker infrastructure is in place).
- **No FDR or Bonferroni correction** at the global level — not applicable to a single-statistic test but will be needed for Local Moran's I (Prompt 04).

## Follow-Up Recommended

- **Prompt 04**: Local Moran's I / LISA will reuse `computeI` logic per-observation and the same seeded PRNG pattern.
- **Prompt 05**: Getis-Ord Gi* will need a similar permutation inference engine; the `mulberry32` PRNG and `shuffleInPlace` could be extracted to a shared utility if code duplication becomes excessive.
- **UI integration**: Result contract (`GlobalAutocorrelationResult`) is ready for report narrative rendering — the `statistic`, `observed`, `zScore`, `pValue` fields map directly to prose templates.
