# SynapseCore Urban Analytics — Definition of Done

> **Scope**: All implementation prompts in the Urban Analytics Strengthening Program  
> **Authority**: URBAN_ANALYTICS_STRENGTHENING_PLAN.md + URBAN_ANALYTICS_STRENGTHENING_SEQUENTIAL_PROMPTS.md

---

## 1. Analytical Module Definition of Done

An analytical module (engine, calculator, statistical method) is **done** when:

### 1.1 Correctness
- [ ] Mathematical implementation matches the formulas, assumptions, and literature cited in the strengthening plan.
- [ ] Test fixtures cover expected, edge, and degenerate cases.
- [ ] Outputs include uncertainty, significance, diagnostics, or confidence information where the method requires it.
- [ ] Seeded randomisation yields reproducible results.

### 1.2 Typing & Contracts
- [ ] All public functions have explicit TypeScript parameter and return types.
- [ ] Shared types live in domain-level `types.ts`, not duplicated locally.
- [ ] The module is exported through its domain `index.ts`.

### 1.3 Fail Safety
- [ ] The module handles missing data, null values, and empty geometries without crashing.
- [ ] Degenerate inputs (single observation, all-zero matrix, no neighbors) produce documented fallback behavior or descriptive errors.

### 1.4 Testability
- [ ] Unit tests exist and pass for: normal cases, boundary conditions, known-answer synthetic datasets.
- [ ] If permutation or stochastic methods are used, at least one test verifies reproducibility with a fixed seed.

### 1.5 Documentation
- [ ] A literature reference is attached or documented in comments.
- [ ] Any approximation, heuristic, or shortcut is isolated and commented with justification.

---

## 2. Data Connector Definition of Done

A data connector (STAC, Sentinel, Census, etc.) is **done** when:

- [ ] It successfully fetches data for a valid query (bbox, time range, filters).
- [ ] Error handling covers: authentication failure, timeout, empty response, malformed response.
- [ ] Retry/backoff logic is present for network-dependent connectors.
- [ ] The response is normalized into a typed contract usable by downstream catalog or analytics.
- [ ] Integration tests exist using mock (and optionally live) responses.
- [ ] Credentials and configuration are isolated from business logic.

---

## 3. UI / Flow Definition of Done

An analytical flow or UI component is **done** when:

- [ ] All defined steps are navigable from start to finish.
- [ ] Each step validates its inputs before allowing progression.
- [ ] State is persisted and can be restored on page reload.
- [ ] Results include interpretable outputs (labels, legends, classifications — not raw numbers only).
- [ ] Parameters and outputs are exportable as JSON.
- [ ] The flow is registered in the flow library and appears in the flow rail.

---

## 4. Worker / Computation Module Definition of Done

A Web Worker, WASM module, or GPU compute module is **done** when:

- [ ] It produces identical results (within floating-point tolerance) to a reference CPU implementation.
- [ ] The main thread never blocks on the computation.
- [ ] Abort/cancel signals are respected.
- [ ] Memory cleanup occurs after completion or cancellation.
- [ ] A fallback pathway exists for environments that don't support the required API (WebGPU, SharedArrayBuffer, etc.).

---

## 5. Reproducibility Definition of Done

Any major analytical run is **reproducible** when:

- [ ] All input parameters, data references, and method choices are serialized.
- [ ] The serialized configuration can regenerate the same output given the same input data.
- [ ] Methodology metadata (references, version, assumptions) are attached to the result.

---

## 6. Global Validation Gate

After every substantial implementation prompt, run:

1. `npm run typecheck` — zero errors
2. `npm run build` — successful production build
3. `npm run lint` — no new violations
4. Targeted tests for the modified domain
5. End-to-end scenario if a user-facing flow changed
