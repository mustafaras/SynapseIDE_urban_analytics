# Release Candidate Validation

Date: May 31, 2026
Current status: **RC gate passed**. See [map-explorer-p64-rc-report-2026-05-30.md](map-explorer-p64-rc-report-2026-05-30.md). The May 30 NO-GO result is superseded by the May 31 remediation pass.
Current primary RC aggregate baseline: `npm run validate:rc` (full aggregate pass May 31, 2026)
Prompt 27 targeted validation update: `npm run typecheck`; `npm run build`; `npm run test`; `npx playwright test e2e/report-history.spec.ts`
Prompt 11 targeted validation update: `npm run typecheck`; `npm run build`; `npm run test`; `npx playwright test e2e/right-panel-fallbacks.spec.ts`
Prompt 12 targeted UI-hardening update: `npm run test -- src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`; `npm run test -- src/features/dashboard/__tests__/dashboardWidgetContent.test.tsx`; `npm run test -- src/centerpanel/tabs/__tests__/Note.test.tsx`; `npm run test -- src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`; `npm run test -- src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
Correction pass validation update: `npm run typecheck`; `npm run build`; `npm run test`; `npm run lint:errors`; `npm run perf:budgets`; `npm run test:e2e:smoke`; targeted right-panel, VoxCity, GeoAI, and release-candidate Playwright specs.
Prompt 36 Map Explorer release-hardening update: `npm run typecheck`; `npm run build`; `npm run test`; `npm run lint:errors`; `npm run test:e2e:smoke`; targeted Map Explorer modal, layer workflows, VoxCity bridge, report handoff, thematic, temporal, spatial-statistics, lifecycle, and repeated stability Playwright specs.
Historical outcome: Pass

## Prompt 64 Gate Update

| Gate | Command | Result |
|---|---|---|
| Aggregate RC gate | `npm run validate:rc` | **Pass** - typecheck passed, lint passed, full Vitest passed (235 files, 2649 passed, 2 skipped), production build passed, bundle budgets passed, smoke E2E passed (75), a11y E2E passed (5), and functional E2E passed (61). |
| Bundle budgets | `npm run perf:budgets` inside `validate:rc` | **Pass** - initial load is within the revised 6.05 MiB raw budget; current build reports approximately 5.64 MiB raw / 1.62 MiB gzip. |
| Accessibility E2E | `npm run test:e2e:a11y` inside `validate:rc` | Pass - 5 tests. |
| Centerpanel styling guard | `npm run lint:no-tailwind-centerpanel` | Pass — no Tailwind-like utility classes found in `src/centerpanel`. |
| Focused motion/visual QA | P39/P40 checks inside `npm run test:e2e:smoke` | Pass - activity rail, canvas nonblank, reduced-motion, overlap, clipped-text, caveat, and layout-shift guards passed. |
| Documentation close-out | `docs/release/map-explorer-p63-documentation-closeout-2026-05-30.md` plus link check | Pass - Prompt 63 docs now cover architecture, workflow, known risks, source support, CRS/QA, bridge contract, design/motion/visual QA, and validation summary. |

The older validation summary below is preserved as historical release evidence. The current Prompt 64 result supersedes it for release-candidate claims.

## Current Bundle Budget Snapshot

| Entry | Raw size | Result | Note |
|---|---|---|---|
| Initial load | ~5.64 MiB | Pass | Budget is 6.05 MiB raw after the May 31 approved revision. |
| `centerpanel/components/MapExplorerModal` | 3.46 MiB | Pass with approved exception | Budget is 4.20 MiB raw. |
| `features/urbanAnalytics/UrbanAnalyticsModal` | 2.08 MiB | Pass with approved exception | Budget is 2.83 MiB raw. |
| `features/urbanAnalytics/RightPanelFourBlock` | 1.09 MiB | Pass with approved exception | Budget is 1.86 MiB raw. |
| `centerpanel/Flows/SunlightSimFlow` | 1.01 MiB | Pass with approved exception | Budget is 1.33 MiB raw. |
| `centerpanel/Flows/VoxCity3DFlow` | 991.92 KiB | Pass with approved exception | Budget is 1.32 MiB raw. |
| `centerpanel/Flows/CityJSONFlow` | 958.19 KiB | Pass with approved exception | Budget is 1.00 MiB raw. |

## Validation Summary

| Gate | Command | Result |
|---|---|---|
| Type safety | `npm run typecheck` | Pass |
| Lint integrity | `npm run lint:errors` | Pass |
| Unit and integration tests | `npm run test` | Pass — 85 test files, 1342 tests |
| Production build | `npm run build` | Pass |
| Targeted report-history E2E | `npx playwright test e2e/report-history.spec.ts` | Pass — 1 test |
| Bundle budgets | `npm run perf:budgets` | Pass — current large lazy chunks are covered by explicit approved exception budgets |
| Smoke E2E | `npm run test:e2e:smoke` | Pass — 13 tests |
| Prompt 36 Map Explorer targeted E2E | `npx playwright test e2e/map-modal-layout.spec.ts e2e/map-csv-kml-gpx-import.spec.ts e2e/map-context-and-geojson.spec.ts e2e/map-columnar-io.spec.ts e2e/map-image-export.spec.ts e2e/map-choropleth.spec.ts e2e/map-point-symbology.spec.ts e2e/map-spatial-stats-renderers.spec.ts e2e/map-temporal-player.spec.ts e2e/voxcity-real-data.spec.ts e2e/map-report-handoff.spec.ts e2e/map-explorer-stability.spec.ts` | Pass — run as focused groups on May 2, 2026; stability spec also passed with `--repeat-each=3` |
| Accessibility E2E | `npm run test:e2e:a11y` | Pass — 4 tests |
| Functional E2E | `npm run test:e2e:functional` | Pass — 5 tests |
| Aggregated RC gate | `npm run validate:rc` | Pass — last full aggregate run April 23, 2026 |

## Surface Claim Vocabulary

Implementation-status vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

Verification-depth vocabulary:

- `launch verified`
- `execution verified`
- `demo-mode verified`
- `external dependency gated`

Important distinction:

- Passing the RC command suite means the release candidate is buildable and testable.
- It does not mean every visible analytical surface is already execution-verified against real data.
- Current surface truth is tracked below and in `docs/release/visual-completeness-checklist.md`.

## Bundle Budget Snapshot

| Entry | Raw size | Result | Note |
|---|---|---|---|
| Initial load | 1.49 MiB | Pass | Under the 2.00 MiB raw budget. |
| `centerpanel/components/MapExplorerModal` | 1.47 MiB | Pass with approved exception | Intentionally isolates the full map workspace behind a lazy boundary. |
| `centerpanel/Flows/SunlightSimFlow` | 1.26 MiB | Pass with approved exception | Keeps the Three.js orbit-control and sunlight-analysis stack isolated to the 3D workflow entry. |
| `centerpanel/Flows/VoxCity3DFlow` | 1.21 MiB | Pass with approved exception | Keeps the Three.js building-extrusion and orbit-control stack isolated to the 3D workflow entry. |
| `features/urbanAnalytics/UrbanAnalyticsModal` | 872.28 KiB | Pass with approved exception | Entire workbench remains lazy-loaded from the shell. |
| `features/urbanAnalytics/RightPanelFourBlock` | 825.78 KiB | Pass with approved exception | Keeps seed-derived methodology fallback support behind the Urban Analytics workbench boundary. |
| `features/education/EducationModule` | 760.88 KiB | Pass with approved exception | Teaching workspace remains isolated as its own lazy entry. |
| `centerpanel/Tools/components/GeoAILab` | 530.83 KiB | Pass with approved exception | Keeps land-cover, NL-to-SQL, object-detection, and provenance controls behind one toolbox lazy boundary. |
| `centerpanel/Flows/CompositeIndicatorFlow` | 503.72 KiB | Pass with approved exception | Keeps sensitivity, reporting, and publication tooling together behind one flow boundary. |
| `centerpanel/Tools/ToolsActionPanel` | 120.80 KiB | Pass | Section-level lazy boundaries keep the toolbox shell small. |

## Current Feature Truth After RC Validation

| Surface family | Implementation status | Verification depth | Evidence | Current truth |
|---|---|---|---|---|
| Workbench shell and top-level navigation | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | The shell is stable and visible. |
| Map Explorer workspace shell and data IO surface | implemented | execution verified | `e2e/release-candidate-ui.spec.ts`; `e2e/map-columnar-io.spec.ts`; `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`; `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`; `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Workspace modes, import/export journeys, and map-shell integrations remain reachable after the current UI hardening pass. |
| Map Explorer scientific workspace, modal, QA, comparison, temporal, VoxCity, and report handoff | implemented with residual gap | execution verified | `e2e/map-modal-layout.spec.ts`; `e2e/map-context-and-geojson.spec.ts`; `e2e/map-csv-kml-gpx-import.spec.ts`; `e2e/map-columnar-io.spec.ts`; `e2e/map-image-export.spec.ts`; `e2e/map-choropleth.spec.ts`; `e2e/map-point-symbology.spec.ts`; `e2e/map-spatial-stats-renderers.spec.ts`; `e2e/map-temporal-player.spec.ts`; `e2e/voxcity-real-data.spec.ts`; `e2e/map-report-handoff.spec.ts`; `docs/implementation/map-explorer-prompt-ledger.md`; `docs/release/map-explorer-scientific-release-checklist.md` | Prompt 36 validates Map Explorer as a premium scientific map workspace/modal with visible QA, layer registry, import/export, temporal/status bar, responsive rails/drawers, VoxCity real-geometry handoff, and report insertion. Residuals are documented for external services, browser memory ceilings, CRS metadata gaps, scoped NL queries, and the large lazy chunk. |
| Core analytical workflows (site suitability, accessibility, vulnerability, composite indicator, scenario comparison, equity audit, change detection, completed-run review) | implemented | execution verified | `e2e/analytical-journeys.spec.ts` | These surfaces are more than reachable; representative journeys execute end to end. |
| Dashboard builder | implemented with residual gap | launch verified | `e2e/release-candidate-ui.spec.ts`; `src/features/dashboard/__tests__/dashboardWidgetContent.test.tsx` | The builder remains visible and routable, and widget-body rendering is now split behind a dedicated content module, but the authoring shell still carries residual density debt. |
| Reporting builder and citations | implemented | execution verified | `e2e/report-builder.spec.ts` | Authoring and citation insertion are exercised. |
| Education workspace and indicator catalog | implemented | execution verified | `e2e/education.spec.ts`; `e2e/indicator-catalog.spec.ts` | Guided education and indicator-routing journeys execute successfully. |
| EO connector operator workflow | implemented with residual gap | execution verified | `e2e/eo-connectors.spec.ts`; connector tests | STAC result listing, COG inspection, source selection, and footprint publication now execute from the visible Toolbox panel. Imported local raster UI and direct raster-image rendering remain residual gaps. |
| Land-cover classification | implemented with residual gap | execution verified; demo-mode verified | `e2e/geoai-real-data.spec.ts`; GeoAI runtime and component validation | GeoAI Lab now executes against explicit real raster sources and preserves an explicitly labeled demo path. The browser-safe model package remains demo-hosted, and real-source runs do not have reference labels for accuracy scoring. |
| Natural language to spatial SQL | implemented with residual gap | execution verified; demo-mode verified | `e2e/geoai-real-data.spec.ts`; GeoAI runtime and local validation | SQL generation is real, and GeoAI Lab executes accepted queries against live project overlays and imported worker-backed spatial tables in SpatialDB while preserving explicit demo mode, clear schema inspection, and saved execution provenance. It does not automatically federate every possible project dataset, remote catalog, or non-queryable layer. |
| Object detection | implemented | execution verified | `e2e/geoai-real-data.spec.ts`; panel and publication tests | The workflow now executes through a mocked-real browser runtime path with explicit Demo mode fallback, preserves map/review publication, and persists run metadata for review/reporting surfaces. |
| VoxCity extrusion and sunlight workflows | implemented with demo mode | execution verified | `e2e/voxcity-real-data.spec.ts`; workflow and component validation | The workflows now prioritise real project geometry when available, retain explicit sample quick-start mode, and persist provenance across map/review outputs. |
| Emerging hot spot analysis | implemented | execution verified | `e2e/emerging-hot-spot.spec.ts`; workflow library surface | Computation, discovery, legend inspection, map publication, and saved-run review are now all exercised through a dedicated workflow journey. |
| Report history and recent changes | implemented | execution verified | `e2e/report-history.spec.ts`; `src/features/collaboration/__tests__/projectHistory.test.ts`; `src/centerpanel/tabs/__tests__/Note.test.tsx` | Report authoring now includes project-backed snapshots, recent-change review rows, compare actions, and durable report-save provenance in the live workspace. |
| Right-panel methodology/data/code/reference cards | implemented | execution verified | `e2e/right-panel-fallbacks.spec.ts`; source-backed unit validation | Support surface now renders direct or seed-derived methodology/data/code/reference content without legacy placeholder copy. |
| Streaming runtime | environment-dependent | demo-mode verified; external dependency gated | Replay mode plus capabilities/release walkthrough | Replay mode is the guaranteed local path; live brokers remain operational dependencies. |
| Sentinel Hub live catalog/process execution | environment-dependent | external dependency gated | EO connector operator panel plus connector tests | Catalog/process controls are visible and truthful, but successful remote execution still depends on Copernicus Data Space credentials and upstream availability. |

## Verification Notes

- Accessibility remains explicitly gated through a dedicated Playwright + axe run rather than being buried inside the broader E2E suite.
- Functional Playwright coverage still exercises education, indicator routing, map columnar IO, and report-builder citation flows.
- Prompt 12 now adds focused lifecycle and integration validation for MapCanvas teardown hardening, dashboard widget-body modularization, Note recent-changes extraction, and Map Explorer workspace shell imports.
- Prompt 05-06 now share targeted `e2e/geoai-real-data.spec.ts` coverage for explicit demo-mode and real-data GeoAI execution in GeoAI Lab, including live seeded-layer spatial queries.
- Prompt 09 now adds targeted `e2e/emerging-hot-spot.spec.ts` coverage for first-class workflow launch, execution, legend inspection, map publication, and completed-run review wiring.
- Prompt 27 now adds targeted `e2e/report-history.spec.ts` coverage for project-backed snapshots, recent-change rendering, and durable report-save provenance inside the live Report workspace.
- Some advanced surfaces remain launch-verified rather than execution-verified. That is now documented explicitly rather than implied away.
- The correction pass aligned bundle-budget governance with the current lazy architecture by adding explicit approved exception ceilings for SunlightSimFlow, VoxCity3DFlow, RightPanelFourBlock, and GeoAILab.
- Prompt 36 adds focused Map Explorer release hardening across modal layout, responsive rails/drawers, layer resizing persistence, context menu stacking, import/export, publication composition, thematic renderers, temporal playback, VoxCity real-data handoff, report handoff, and repeated open/close stability.

## Explicit Residuals

- Live AI provider responses remain environment-dependent because they require external credentials and upstream availability.
- Live WebSocket and MQTT streaming verification is still conditional on reachable external endpoints; deterministic replay mode is the guaranteed local verification path.
- Provider-gated map integrations still depend on external API keys and are treated as operational dependencies rather than hidden failures.
- Large lazy analytical chunks remain watch items for future chunk splitting, but the current budget gate passes with explicit exception ceilings.
- Map Explorer external services, very large client-side datasets, missing source CRS metadata, and non-queryable/remote NL query scopes remain truthful residual risks rather than hidden production guarantees.
