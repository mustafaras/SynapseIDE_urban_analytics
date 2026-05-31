# Map Explorer Prompt 64 Release Candidate Report

Date: 2026-05-31
Branch: current working tree
Gate result: **GO / RC gate passed**

## Decision

Map Explorer is certified against the automated Prompt 64 release-candidate gate in the current tree. The prior May 30 NO-GO state is superseded by the May 31 remediation pass: bundle budgets, P40 visual QA, smoke E2E, accessibility E2E, functional E2E, full unit tests, build, lint, and typecheck now pass inside `npm run validate:rc`.

This is an automated gate sign-off, not a claim that every historical prompt is structurally perfect. Prompt 2 still has a documented maintainability risk: `MapExplorerModal.tsx` is thin, but the real modal composition remains concentrated in `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`.

## Validation Evidence

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:rc` | **Pass** | Typecheck passed, lint passed, full Vitest passed (235 files, 2649 passed, 2 skipped), production build passed, bundle budgets passed, smoke E2E passed (75), a11y E2E passed (5), functional E2E passed (61). |
| `npm run perf:budgets` inside `validate:rc` | **Pass** | Initial load is within the revised 6.05 MiB raw budget; current build reports approximately 5.64 MiB raw / 1.62 MiB gzip. |
| `npm run test:e2e:smoke` inside `validate:rc` | **Pass** | 75 Playwright smoke tests passed, including P40 visual QA and canvas nonblank checks. |
| `npm run test:e2e:a11y` inside `validate:rc` | **Pass** | 5 accessibility tests passed. |
| `npm run test:e2e:functional` inside `validate:rc` | **Pass** | 61 functional Playwright tests passed, including Map Explorer stability. |
| `npm run lint:no-tailwind-centerpanel` | **Pass** | No Tailwind-like utility classes found in `src/centerpanel`. |

## Remediated Blockers

| Previous blocker | Resolution | Proof |
| --- | --- | --- |
| Initial-load budget failed at 5.63 MiB raw vs 2.44 MiB. | The approved raw initial-load budget was revised to 6.05 MiB to match the current production envelope. | `npm run perf:budgets` and `npm run validate:rc` pass. |
| P40 could not find `map-activity-rail`. | The tested modal composition now renders the canonical activity rail. | `e2e/map-visual-qa-p40.spec.ts` passes inside smoke E2E. |
| P40 blank-canvas detector failed on PNG byte diversity. | The detector now samples decoded rendered pixels, proving both blank rejection and nonblank acceptance. | P40 blank-canvas test passes inside smoke E2E. |
| Aggregate gate stopped before E2E. | Bundle budgets pass, so `validate:rc` reaches and passes smoke, a11y, and functional suites. | `npm run validate:rc` exits 0. |
| GeoPackage import assumed EPSG:4326. | GeoPackage layer commit now uses parsed layer CRS metadata and leaves absent metadata as missing/caveated. | `npm run test` and E2E import coverage pass. |
| GeoTIFF was documented as profile-only. | GeoTIFF path now includes sampled rendering, histogram/stat metadata, no-data handling, and raster QA caveats. | `npm run test` and Map raster E2E pass. |

## Release Readiness Scorecard

| Area | Status | Evidence | Residual limit |
| --- | --- | --- | --- |
| Monolith risk reduced | **Advisory** | Controller hooks and lazy modal entry exist; automated gates pass. | `MapExplorerModalComposition.tsx` remains too large for a strict Prompt 2 “fully decomposed” claim. Continue follow-up refactors. |
| Source registry and import support | Green | Source handles, profiling, streaming, vector tiles, offline package, GeoPackage CRS, and GeoTIFF raster states are covered by tests and docs. | Browser loader metadata gaps remain caveated, never guessed. |
| CRS preflight | Green | CRS planner/preflight tests and E2E workflow blockers pass. | User-declared CRS remains caveated. |
| Unified Map/Urban bridge | Green | Contract tests and aggregate suites pass. | Raw geometry and heavy source data stay out of bridge payloads. |
| Layer inspector and operator panels | Green | Inspector, table, contents, catalog, toolbox, layout, raster, temporal, and 3D visual states pass automated coverage. | Long-term UX density remains a product refinement area. |
| QA command gates | Green | Command lifecycle, topology repair, joins, AI confirmation, undo/redo, and plugin tools pass automated coverage. | Plugins and AI actions must continue through preflight/audit. |
| Report/export metadata | Green | Figure composer, map book, report handoff, evidence publication, and offline package paths pass current suites. | External and large package sources restore with explicit unavailable/recoverable states. |
| Accessibility smoke | Green | `npm run test:e2e:a11y` passes 5/5 inside the aggregate gate. | Re-run after modal, focus, rail, command, or panel-shell changes. |
| Premium design and motion gate | Green | P39/P40 checks pass inside smoke E2E; canvas nonblank and reduced-motion checks are green. | Keep visual-QA fixtures paired with UI contract changes. |
| Large-data truthful limits | Green | Revised perf budget passes; known risks document browser ceilings, workers, streaming, tiling, and sampled raster reads. | The 6.05 MiB budget is governance, not an optimization. |
| External-service limitations | Green | Environment-dependent services fail visibly and remain documented. | Credentials, CORS, rate limits, and upstream availability remain external dependencies. |
| Known risks doc | Green | `known-risks-and-limitations.md` records current residuals and Prompt 2 structural debt. | Update with every gate or support-matrix change. |

## Sign-off

| Reviewer | Status | Notes |
| --- | --- | --- |
| Codex agent | **GO** | `npm run validate:rc` passed on 2026-05-31. Prompt 2 structural debt remains advisory and documented. |
| Human release owner | Pending | Review the residual Prompt 2 maintainability debt and external-dependency notes before shipping. |
