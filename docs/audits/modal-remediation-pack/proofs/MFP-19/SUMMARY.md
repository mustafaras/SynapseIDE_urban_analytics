# MFP-19 — Decompose MapExplorerModalRuntimeCore (STAGED)

Highest-risk refactor in the pack; staged A–E, **one PR per stage behind green tests**.

## STAGE A — collapse passthroughs ✅ (this PR)
Collapsed the 3 pure passthrough files into a single entry:
- `MapExplorerModal.tsx` now re-exports `MapExplorerModal` + `MapExplorerModalProps`
  **directly** from `map/controllers/MapExplorerModalRuntimeCore`.
- Deleted `map/controllers/MapExplorerModalRoot.tsx` (trivial FC wrapper) and
  `map/controllers/MapExplorerModalRuntime.tsx` (re-export). They were imported only by
  each other in the chain; the public entry path and `Core` are unchanged.
- No behavioural change.

**Gate (gis):** typecheck clean, lint:errors clean, `npx vitest run
src/centerpanel/components/map` + `MapExplorerModal.dispatch.test` = **99 files / 941
passed**. `lint:no-tailwind-centerpanel` PowerShell-only (env), manually n/a (no JSX
classes touched).

`e2e-a11y` / `perf-budgets`: env-blocked here (Playwright Chromium 1217 missing). STAGE A
is a re-export collapse with no runtime change, so the vitest gate + typecheck are
sufficient evidence; the e2e/perf proofs belong to the behavioural stages.

## STAGES B–E — pending (require browser-capable env)
- **B** group the 170-field View props into context objects (high-risk; needs `test:e2e`).
- **C** route the 51 error-path `toast*` calls through `reportError`.
- **D** add a top-level shell error boundary around the runtime root.
- **E** lazy-load `SAMPLE_BUILDINGS` + processing/plugin/model registries + `SpatialDB`
  off the open path (verify with `perf:budgets`).

These stages mutate behaviour and the spec mandates `npm run test:e2e` green **after every
stage**. That suite cannot run in this sandbox, so B–E are deferred to a browser-capable
environment. Also fold the `map-layer-inspector` single-mount fix (duplicate testid;
LayerInspector mounted in both MapRightDockBodyContent and MapInspectorHost) into STAGE B.
