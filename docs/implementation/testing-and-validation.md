# SynapseCore Urban Analytics — Testing & Validation Standards

> **Scope**: All modules implemented under the Urban Analytics Strengthening Program

---

## 1. Testing Layers

### 1.1 Unit Tests
- **Scope**: Individual functions, algorithms, transformations.
- **Framework**: Vitest (aligned with Vite toolchain).
- **Location**: Co-located `__tests__/` directories or `*.test.ts` files alongside modules.
- **Requirements**:
  - Every analytical function must have at least one positive, one edge-case, and one degenerate-input test.
  - Statistical methods must include known-answer tests from published datasets or synthetic constructions.
  - Seeded stochastic methods must have a reproducibility test.

### 1.2 Integration Tests
- **Scope**: Multi-module pipelines (e.g., connector → profiler → calculator → renderer).
- **Requirements**:
  - Use mocked external dependencies (network, file I/O) by default.
  - Optional live integration tests gated behind environment flags (`LIVE_TESTS=true`).

### 1.3 End-to-End Tests
- **Scope**: Complete analytical flows (Site Suitability, Equity Audit, etc.).
- **Requirements**:
  - Each implemented flow must have a scenario that navigates all steps.
  - Result validation checks output structure, not pixel-perfect rendering.

---

## 2. Analytical Validation Standards

### 2.1 Known-Answer Testing
For spatial statistics and mathematical methods:
- Construct small, manually verifiable datasets (3–10 observations).
- Compare outputs against hand-calculated or published reference values.
- Acceptable floating-point tolerance: `1e-10` for deterministic methods, `0.05` for stochastic significance thresholds.

### 2.2 Synthetic Pattern Testing
- **Clustered pattern**: Must yield positive and significant autocorrelation (Moran's I > 0, p < 0.05).
- **Dispersed pattern**: Must yield negative autocorrelation.
- **Random pattern**: Must yield near-null autocorrelation (p > 0.05).
- **Known regression**: Synthetic data with known β must recover coefficients within tolerance.

### 2.3 Cross-Validation
For predictive models (GeoAI, GWR, kriging):
- Spatial k-fold or leave-one-out cross-validation.
- Report RMSE, MAE, R² on held-out folds.

---

## 3. Performance Validation

### 3.1 Benchmarks
- Analytical modules processing >1,000 features must include a timing benchmark.
- Worker-based modules must demonstrate main-thread non-blocking behavior.
- GPU compute modules must validate results against CPU reference.

### 3.2 Memory
- No single operation should consume more than 500 MB without explicit user consent.
- ONNX model sessions must enforce LRU eviction.

---

## 4. Regression Protection

- Any analytical fix or enhancement must include a regression test.
- Existing test suites must pass after every implementation prompt (Global Validation Gate).
- Breaking changes to type contracts must update all downstream consumers.

---

## 5. Test Naming Conventions

```
describe('GlobalMoransI', () => {
  it('returns positive I for spatially clustered data', () => { ... });
  it('returns near-zero I for random spatial data', () => { ... });
  it('produces reproducible p-value with seeded permutations', () => { ... });
  it('handles single-observation input without crashing', () => { ... });
  it('handles island observations (zero neighbors)', () => { ... });
});
```

---

## 6. Continuous Integration Expectations

When CI is configured, every pull request must:
1. Pass `npm run typecheck`
2. Pass `npm run build`
3. Pass `npm run lint`
4. Pass all unit and integration tests
5. Not introduce new `any` casts without justification

---

## 7. Release Candidate Validation Stack

For the April 23, 2026 release candidate, validation is split into explicit gates rather than one opaque test pass:

1. `npm run typecheck`
2. `npm run lint:errors`
3. `npm run test`
4. `npm run build`
5. `npm run perf:budgets`
6. `npm run test:e2e:smoke`
7. `npm run test:e2e:a11y`
8. `npm run test:e2e:functional`

For local end-to-end release verification, use:

```bash
npm run validate:rc
```

See also:

- `docs/release/release-candidate-validation.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/known-risks-and-limitations.md`
