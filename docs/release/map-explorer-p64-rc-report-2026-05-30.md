# Map Explorer Prompt 64 Release Candidate Report

Date: 2026-05-30
Branch: `gis/p64-rc`
Base commit: `29edd57` (`feat(map): add evidence visual state QA`)
Gate result: **NO-GO / RC blocked**

## Decision

Map Explorer is not certified as a release candidate from this checkpoint. The Prompt 64 gate was executed against the current Prompt 62 tree after Prompt 63 documentation close-out. The blockers are documented with concrete limits, satisfying the gate-recording requirement without claiming production readiness.

The blocking reasons are:

- `npm run validate:rc` failed at `npm run perf:budgets` after typecheck, lint, full Vitest, and production build passed.
- The active bundle-budget failure is initial load: 5.63 MiB raw / 1.62 MiB gzip against a 2.44 MiB raw budget.
- The focused P40 visual QA run still has two failures: missing `map-activity-rail` test hook/rail contract and blank-canvas detector threshold failure.
- `npm run test:e2e:ci` did not run inside `validate:rc` because the aggregate command stopped at the bundle-budget failure.

## Validation Evidence

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:rc` | **Blocked** | Typecheck passed, lint passed, full Vitest passed (235 files, 2646 passed, 2 skipped), and production build passed in 10.80s. `perf:budgets` failed because initial load is 5.63 MiB raw vs 2.44 MiB budget. |
| `npm run test:e2e:a11y` | Green | 5 Playwright accessibility tests passed in 1.7m. |
| `npm run lint:no-tailwind-centerpanel` | Green | No Tailwind-like utility classes found in `src/centerpanel`. |
| `npx playwright test e2e/map-motion-p39.spec.ts e2e/map-visual-qa-p40.spec.ts` | **Blocked** | 11 passed, 2 failed. P39 motion checks passed; P40 failed on `map-activity-rail` visibility and blank-canvas detector threshold. |

### `validate:rc` Output Excerpt

```text
Test Files  235 passed (235)
Tests       2646 passed | 2 skipped (2648)
Duration    129.26s

vite v8.0.8 building client environment for production...
4995 modules transformed.
built in 10.80s

Bundle budget summary
- Initial load: 5.63 MiB raw / 1.62 MiB gzip (budget 2.44 MiB raw)
- Lazy centerpanel/components/MapExplorerModal: 3.46 MiB raw / 946.86 KiB gzip (budget 4.20 MiB raw, approved exception)
- Lazy features/urbanAnalytics/UrbanAnalyticsModal: 2.08 MiB raw / 613.40 KiB gzip (budget 2.83 MiB raw, approved exception)
- Lazy features/urbanAnalytics/RightPanelFourBlock: 1.09 MiB raw / 351.50 KiB gzip (budget 1.86 MiB raw, approved exception)
- Lazy centerpanel/Flows/SunlightSimFlow: 1.01 MiB raw / 271.12 KiB gzip (budget 1.33 MiB raw, approved exception)
- Lazy centerpanel/Flows/VoxCity3DFlow: 991.92 KiB raw / 259.05 KiB gzip (budget 1.32 MiB raw, approved exception)
- Lazy centerpanel/Flows/CityJSONFlow: 958.19 KiB raw / 248.06 KiB gzip (budget 1.00 MiB raw, approved exception)

Largest budgeted assets:
  assets/useMapExplorerStore-5pNh72Ql.js: 2.80 MiB raw / 852.81 KiB gzip
  assets/index-CZ7_d39v.js: 1.58 MiB raw / 436.47 KiB gzip
  assets/MapExplorerModal-BwLU5JFd.js: 1.06 MiB raw / 285.45 KiB gzip
  assets/useCityJSONScene-tYx30ag8.js: 841.29 KiB raw / 220.79 KiB gzip
  assets/mapContextAdapter-DTlZM9TG.js: 838.46 KiB raw / 224.77 KiB gzip

Bundle budgets failed:
- Initial load exceeds budget: 5.63 MiB > 2.44 MiB
```

## Release Readiness Scorecard

| Area | Status | Evidence | Limit before RC |
| --- | --- | --- | --- |
| Monolith risk reduced | Green | Prompt 2 decomposed the modal into controller hooks; `MapExplorerModal` lazy chunk is now 3.46 MiB raw against a 4.20 MiB approved exception. Architecture docs: [`../architecture/map-explorer-canonical-surface.md`](../architecture/map-explorer-canonical-surface.md), [`../architecture/map-explorer-state-and-actions.md`](../architecture/map-explorer-state-and-actions.md). | No row-specific blocker. Initial-load budget remains a separate RC blocker. |
| Source registry | Green | Prompt 4 source handles, Prompt 5 profiling, Prompt 43 import hardening, Prompt 44 streaming, Prompt 52 vector tiles, Prompt 57 offline package, and Prompt 60 scene source metadata are documented in [`../map-source-support-matrix.md`](../map-source-support-matrix.md). Full Vitest passed. | Keep profile-only, metadata-only, streaming, and scene-specific states distinct. |
| CRS preflight | Green | `CrsPreflight`, `ExecutionCrsPlanner`, raster QA, and 3D corridor/section CRS rules are documented in [`../architecture/map-crs-and-qa-method-note.md`](../architecture/map-crs-and-qa-method-note.md). Full Vitest passed; P61 Playwright evidence exists in the ledger. | None for implemented CRS gate; source-specific metadata gaps remain caveated. |
| Unified Map/Urban bridge | Green | Reference-only bridge contract documented in [`../architecture/map-urban-bridge-contract.md`](../architecture/map-urban-bridge-contract.md). Full Vitest passed. | No raw geometry, source data, 3D tiles, raster cells, screenshots, or credential-bearing payloads across the bridge. |
| Layer inspector | Green | Prompt 10 inspector plus Prompt 12 style/legend, Prompt 47 labels, Prompt 48 advanced cartography, and Prompt 62 raster/temporal/3D state docs are covered by the workflow guide and visual notes. Full Vitest passed. | No row-specific blocker. |
| QA command gates | Green | Command lifecycle, CRS preflight, topology repair, joins, AI confirmation, undo/redo, and plugin processing still route through preflight/audit paths. Full Vitest passed. | Keep high-impact commands previewable/auditable and do not bypass CRS/QA through plugins or AI. |
| Report/export metadata | Green | Report handoff, figure composer, map book, export metadata, evidence references, and offline package docs are current. Full Vitest passed. | Large/external package sources must restore as unavailable/recoverable with concrete caveats. |
| Accessibility smoke | Green | Current `npm run test:e2e:a11y`: 5 passed. | Run again after any focus, modal, rail, command, or panel-shell change. |
| Premium design and motion gate | **Blocked** | `npm run lint:no-tailwind-centerpanel` passed. Focused P39/P40 run passed 11/13. Design docs: [`map-explorer-design-motion-visual-qa.md`](map-explorer-design-motion-visual-qa.md). | Restore/update the `map-activity-rail` visual QA contract and fix/recalibrate the blank-canvas detector so P40 passes. |
| Large-data truthful limits | Green | Source matrix and known risks document browser memory, worker, streaming, tiling, raster sampling, and package restore limits. Full Vitest passed. | Browser ceilings remain; do not claim unbounded local compute. |
| External-service limitations | Green | External service, EO, provider, and 3D-source limits are documented in [`known-risks-and-limitations.md`](known-risks-and-limitations.md) and the source matrix. | Credentials, CORS, rate limits, network failures, and upstream availability remain environment-dependent. |
| Known risks doc | Green | [`known-risks-and-limitations.md`](known-risks-and-limitations.md) updated for Prompt 63/64 current blockers. | Update again after budget, visual QA, or validation status changes. |

## Concrete Blockers

| Blocker | Current limit | Required to unblock RC |
| --- | --- | --- |
| Initial-load bundle budget | `npm run perf:budgets` exits 1. Initial load is 5.63 MiB raw / 1.62 MiB gzip against a 2.44 MiB raw budget. Largest budgeted initial assets include `useMapExplorerStore` at 2.80 MiB raw and `index` at 1.58 MiB raw. | Split or defer initial-load imports, remove accidental eager dependencies, or intentionally revise the approved budget with fresh evidence, then make `npm run perf:budgets` green. |
| Visual QA shell contract | P40 desktop shell test cannot find `data-testid="map-activity-rail"`. | Restore the canonical activity rail test hook in the tested shell path or update the P40 spec only after confirming the current canonical shell contract. |
| Visual QA blank-canvas proof | P40 blank overlay expected `<= 10` unique byte values but measured `82`. | Rework the detector sampling/overlay region or recalibrate threshold with a true blank/nonblank bidirectional proof. |
| Full E2E CI inside aggregate gate | `npm run test:e2e:ci` did not run inside `validate:rc` because the command failed earlier at perf budgets. | After the budget gate passes, rerun `npm run validate:rc` and require smoke, a11y, and functional Playwright suites to pass inside the aggregate command. |

## Sign-off

| Reviewer | Status | Notes |
| --- | --- | --- |
| Codex agent | **NO-GO** | Gate executed; blockers documented with concrete limits. This is not a production-readiness sign-off. |
| Human release owner | Pending | Required after blockers are resolved and `npm run validate:rc` passes. |
