# LEDGER - GIS Modal Premium UI Redesign

Date started: 2026-05-31
Scope: Map Explorer / GIS modal only
Prompt file: `01_AGENT_EXECUTION_PROMPTS.md`
Design plan: `GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md`

This is the active execution ledger for the fresh GIS Modal Premium UI Redesign pack. It is not the archived Map Explorer Production GIS ladder.

Prompt count: 56. Prompts 01-21 define the architectural spine; prompts 22-56 are the detailed, preferred implementation ladder for the premium Map Explorer UI.

---

## Current Pointer

Integration branch:

```text
gis-modal-ui/premium-redesign
```

Next prompt:

```text
Prompt 11 - Analyze Workspace (of 56)
```

Last completed prompt:

```text
Prompt 10 - Bottom Panel
```

Last pushed integration commit:

```text
Prompt 10 pushed (implementation `3a924c8`; ledger closeout at integration branch tip)
```

Update this pointer after every completed prompt. It is the first anti-amnesia check for the next agent.

---

## Resume Protocol

1. Read:
   - `AGENTS.md`
   - `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md`
   - `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/01_AGENT_EXECUTION_PROMPTS.md`
   - this ledger
2. Run:
   - `git status --short`
   - `git branch --show-current`
   - `git log --oneline -5`
3. Choose the lowest-numbered prompt marked `[ ]`, unless the user names a different prompt.
4. Create or update the integration branch:
   - `gis-modal-ui/premium-redesign`
5. Create the prompt branch from integration:
   - `gis-modal-ui/pNN-<slug>`
6. Implement only that prompt.
7. Run the prompt validation commands.
8. Update this ledger in the same commit:
   - mark status `[x]` only if validation/proof is complete
   - append a Done Log row
   - record exact commands and outcomes
   - record residual risks
9. Commit and push:
   - prompt branch commit message: `feat(gis-modal-ui): pNN <short-title>`
   - push prompt branch
   - fast-forward integration branch
   - push integration branch
10. If commit, push, validation, or fast-forward fails, mark the prompt `[!]` and record the blocker.

---

## Anti-Amnesia Audit

Run this audit before implementation and before final response.

Before implementation:

- Confirm this is the fresh GIS Modal Premium UI Redesign pack.
- Confirm the archived Map Explorer Production GIS ladder is not being resumed.
- Confirm the active prompt number from the Status table.
- Confirm the branch name matches `gis-modal-ui/pNN-<slug>`.
- Confirm the prompt-specific source files exist.
- Confirm no unrelated user changes will be staged.

Before marking complete:

- Confirm prompt validation commands ran or the exact blocker is logged.
- Confirm `LEDGER.md` includes the prompt's proof.
- Confirm changed files match the prompt scope.
- Confirm prompt branch is pushed.
- Confirm integration branch is fast-forwarded and pushed.
- Confirm Current Pointer is updated.

If any item fails, do not mark `[x]`.

---

## Token Hygiene

This pack is intended to be resumed across many sessions without wasting context.

- Read the selected prompt fully.
- Read the Premium Prompt Matrix row for the selected prompt.
- Read only the plan sections referenced by that prompt.
- Use `rg` to locate symbols before opening large files.
- Prefer focused file slices for `MapExplorerModalComposition.tsx`.
- Put persistent progress in this ledger, not long chat summaries.
- Ledger entries should state outcome and evidence, not paste code.
- Do not restate old prompt content in future Done Log rows.

---

## Adaptation Notes

Use this section when the user changes the requested aesthetic, priority, sequencing, or scope. Keep notes short and actionable.

| Date | Request change | Affected prompts | Ledger action | Status |
| --- | --- | --- | --- | --- |

Rules:

- Do not mutate completed prompt evidence retroactively.
- If a pending prompt's scope changes, update the Status proof text or add a Done Log note when it lands.
- If a new requirement does not fit any pending prompt, add a new prompt row rather than hiding scope inside an unrelated prompt.
- Validation and commit/push closeout remain mandatory after adaptation.

---

## Branch and Commit Policy

Integration branch:

```text
gis-modal-ui/premium-redesign
```

Prompt branch pattern:

```text
gis-modal-ui/pNN-<slug>
```

Commit message pattern:

```text
feat(gis-modal-ui): pNN <short-title>
test(gis-modal-ui): pNN <short-title>
docs(gis-modal-ui): pNN <short-title>
```

Ledger rule:

- The prompt is not complete until the branch is pushed.
- The integration branch is not authoritative until it is fast-forwarded and pushed.
- Do not stage unrelated user changes.
- Do not rewrite history unless the user explicitly requests it.
- If remote push is unavailable, mark the prompt `[!]` blocked and record the exact command/error.

---

## Prompt Start Checklist

Copy into working notes for every prompt.

```text
Prompt:
Branch:
Start SHA:
Plan sections read:
Prompt-specific files read:
Expected changed files:
Validation commands planned:
```

---

## Prompt Close Checklist

All items must be true before marking `[x]`.

```text
Implementation complete:
No unrelated files staged:
Typecheck run:
Prompt-specific tests run:
Lint run:
E2E/build run when required:
Premium UI proof recorded:
Reduced-motion/high-contrast proof recorded when applicable:
Ledger status updated:
Done Log row added:
Commit created:
Prompt branch pushed:
Integration branch fast-forwarded:
Integration branch pushed:
Current Pointer updated:
```

---

## Status

Legend: `[ ]` TODO, `[~]` in progress, `[x]` done, `[!]` blocked.

| Status | Prompt | Branch | Commit | Push | Required proof |
| --- | --- | --- | --- | --- | --- |
| [x] | 01 - Command and Panel Inventory | `gis-modal-ui/p01-inventory` | `e34aebc` | pushed to `origin/gis-modal-ui/p01-inventory` | Inventory coverage test passed; no runtime shell imports or visible UI change |
| [x] | 02 - Navigation Model | `gis-modal-ui/p02-navigation-model` | `89e015b` | pushed to `origin/gis-modal-ui/p02-navigation-model` | Activity order, task-lens model, keyboard-safe metadata, and inventory binding tests passed |
| [x] | 03 - Activity Rail Refresh | `gis-modal-ui/p03-activity-rail` | `f069f41` | pushed to `origin/gis-modal-ui/p03-activity-rail` | Stable activity rail, old actions reachable |
| [x] | 04 - Command Center | `gis-modal-ui/p04-command-center` | `a5f6924` | pushed to `origin/gis-modal-ui/p04-command-center` | Palette complete, compact header |
| [x] | 05 - Sidebar Host | `gis-modal-ui/p05-sidebar-host` | `0c41b5d` | pushed | Overview/Data/Layers mounted in sidebar |
| [x] | 06 - Layers Consolidation | `gis-modal-ui/p06-layers-consolidation` | `2528f98` | pushed | Stack/Contents/Sources/Cartography tabs; Stack/Contents unified in one Layers activity |
| [x] | 07 - Data Consolidation | `gis-modal-ui/p07-data-consolidation` | `35468fe` | pushed to `origin/gis-modal-ui/p07-data-consolidation`; closeout integrated at `8a023d0` | Data activity owns Add Data, Connections, Catalog, Source Health, and Demo Data; import/service/source-health proofs passed |
| [x] | 08 - Inspector Host | `gis-modal-ui/p08-inspector-host` | `52b8e21` | pushed to `origin/gis-modal-ui/p08-inspector-host`; fast-forwarded into `origin/gis-modal-ui/premium-redesign` | LayerInspector hosted in the single right inspector host; old floating inspector panel removed from modal composition |
| [x] | 09 - QA Problems Panel | `gis-modal-ui/p09-qa-problems` | `3d69ca0` | pushed to `origin/gis-modal-ui/p09-qa-problems`; fast-forwarded into `origin/gis-modal-ui/premium-redesign` | Problems model/component groups QA blockers, warnings, caveats, and mode labels by severity with affected layer/source, reason, and action target |
| [x] | 10 - Bottom Panel | `gis-modal-ui/p10-bottom-panel` | `3a924c8` | pushed to `origin/gis-modal-ui/p10-bottom-panel`; fast-forwarded into `origin/gis-modal-ui/premium-redesign` | Problems/Attributes/Timeline/Tasks/Diagnostics tabs mounted above the status bar; status QA/Select/Review/Perf route to tabs |
| [ ] | 11 - Analyze Workspace | `gis-modal-ui/p11-analyze-workspace` |  |  | Workflows/tools/query/model/statistics unified |
| [ ] | 12 - Style Workspace | `gis-modal-ui/p12-style-workspace` |  |  | Renderer/symbols/labels/legend/advisor unified |
| [ ] | 13 - Scene Workspace | `gis-modal-ui/p13-scene-workspace` |  |  | Raster/temporal/3D/zoning/massing/sun/VoxCity unified |
| [ ] | 14 - Publish Workspace | `gis-modal-ui/p14-publish-workspace` |  |  | Figure/export/report/package readiness |
| [ ] | 15 - Visual System Polish | `gis-modal-ui/p15-visual-polish` |  |  | Premium visual QA pass |
| [ ] | 16 - Regression and Visual QA | `gis-modal-ui/p16-regression-visual-qa` |  |  | E2E/activity/command/no-overlap coverage |
| [ ] | 17 - Persona Lenses and Layout Reset | `gis-modal-ui/p17-lenses-layout-reset` |  |  | Lenses, reset, collapse, density controls |
| [ ] | 18 - Canvas Control Standard | `gis-modal-ui/p18-canvas-controls` |  |  | Fit/basemap/tool/map-furniture controls |
| [ ] | 19 - Collaboration Surface | `gis-modal-ui/p19-collaboration-surface` |  |  | Review collaboration status without heavy sync |
| [ ] | 20 - Accessibility Matrix | `gis-modal-ui/p20-accessibility-matrix` |  |  | Keyboard/focus/Escape/high-contrast proof |
| [ ] | 21 - Performance Budget | `gis-modal-ui/p21-performance-budget` |  |  | Lazy-mount and build proof |
| [ ] | 22 - GIS Token Audit and Premium Chrome | `gis-modal-ui/p22-token-chrome` |  |  | Token/density/motion contract |
| [ ] | 23 - Shared GIS Primitive Hardening | `gis-modal-ui/p23-gis-primitives` |  |  | Primitive accessibility and stable dimensions |
| [ ] | 24 - Command Taxonomy and Palette Search | `gis-modal-ui/p24-command-taxonomy` |  |  | GIS command search coverage |
| [ ] | 25 - Command Center Visual Hierarchy | `gis-modal-ui/p25-command-center-visual` |  |  | Compact header and contextual primary action |
| [ ] | 26 - Activity Rail Iconography and Microinteraction | `gis-modal-ui/p26-activity-rail-polish` |  |  | Premium rail labels, tooltips, active accent |
| [ ] | 27 - Overview Cockpit Readiness Surface | `gis-modal-ui/p27-overview-cockpit` |  |  | Readiness states and next action proof |
| [ ] | 28 - Local Import and Preflight UX | `gis-modal-ui/p28-import-preflight-ux` |  |  | Format caveats and import preflight proof |
| [ ] | 29 - External Services and Source Catalog UX | `gis-modal-ui/p29-source-catalog-ux` |  |  | Source health and provider caveat proof |
| [ ] | 30 - Layer Stack Row Redesign | `gis-modal-ui/p30-layer-row-redesign` |  |  | Dense layer readiness rows |
| [ ] | 31 - Contents Tree Premium Controls | `gis-modal-ui/p31-contents-tree` |  |  | Groups, scale ranges, filters |
| [ ] | 32 - Layer Action Command Menu | `gis-modal-ui/p32-layer-action-menu` |  |  | Per-layer action parity |
| [ ] | 33 - Inspector Metadata and Provenance Polish | `gis-modal-ui/p33-inspector-metadata` |  |  | Explicit unknown/missing metadata |
| [ ] | 34 - CRS and QA Fix Flow | `gis-modal-ui/p34-crs-qa-fixes` |  |  | User-declared CRS caveat and QA fix proof |
| [ ] | 35 - Attribute, Field, Join, and Table Workflow | `gis-modal-ui/p35-table-field-join` |  |  | Table selection and field/join preview |
| [ ] | 36 - Canvas Interaction Tool Strip | `gis-modal-ui/p36-canvas-tool-strip` |  |  | Active tool visibility and cancellation |
| [ ] | 37 - AOI and Workflow Launch Ergonomics | `gis-modal-ui/p37-aoi-workflow-launch` |  |  | AOI source and CRS readiness proof |
| [ ] | 38 - Processing Toolbox Premium Form | `gis-modal-ui/p38-processing-toolbox` |  |  | Runtime chips and blocked reasons |
| [ ] | 39 - Model Builder Premium Workflow Graph | `gis-modal-ui/p39-model-builder` |  |  | Chain/batch/export behavior |
| [ ] | 40 - NL Query and AI Guardrail UX | `gis-modal-ui/p40-nl-query-guardrails` |  |  | Human confirmation and AI audit |
| [ ] | 41 - Spatial Statistics and Advanced Analysis Panels | `gis-modal-ui/p41-spatial-statistics` |  |  | Statistics readiness and caveats |
| [ ] | 42 - Style Workspace Renderer and Symbology | `gis-modal-ui/p42-style-renderers` |  |  | Renderer eligibility and style contract |
| [ ] | 43 - Labels, Annotations, and Publication Marks | `gis-modal-ui/p43-labels-annotations` |  |  | Label/annotation export-aware controls |
| [ ] | 44 - Legend Contract Parity | `gis-modal-ui/p44-legend-parity` |  |  | Map/report/export legend equality |
| [ ] | 45 - Raster Evidence UI | `gis-modal-ui/p45-raster-evidence-ui` |  |  | noData/CRS/sample raster caveats |
| [ ] | 46 - Temporal Playback UI | `gis-modal-ui/p46-temporal-playback-ui` |  |  | Reduced-motion temporal proof |
| [ ] | 47 - 3D Scene, Terrain, CityJSON, and 3D Tiles UX | `gis-modal-ui/p47-3d-scene-ux` |  |  | Source/vertical/generated scene chips |
| [ ] | 48 - Urban Form Scene Controls | `gis-modal-ui/p48-urban-form-controls` |  |  | Zoning/massing/sun/corridor assumptions |
| [ ] | 49 - VoxCity Bridge Surface | `gis-modal-ui/p49-voxcity-bridge` |  |  | Real vs sample geometry proof |
| [ ] | 50 - Publish Figure and Map Book Workflow | `gis-modal-ui/p50-publish-figure` |  |  | Figure readiness checklist |
| [ ] | 51 - Data Export, Offline Package, and Report Handoff | `gis-modal-ui/p51-export-package-report` |  |  | Inclusion/exclusion and evidence proof |
| [ ] | 52 - Review Timeline and Collaboration Surface | `gis-modal-ui/p52-review-collaboration` |  |  | Timeline/collaboration truthfulness |
| [ ] | 53 - Diagnostics, Plugins, and Recovery UX | `gis-modal-ui/p53-diagnostics-plugins` |  |  | Redacted diagnostics and plugin mapping |
| [ ] | 54 - Preferences, Lenses, Layout Reset, and Density | `gis-modal-ui/p54-preferences-layout` |  |  | Reset/density without analytical mutation |
| [ ] | 55 - Full Accessibility and Keyboard Pass | `gis-modal-ui/p55-accessibility-keyboard` |  |  | Keyboard-only path and scoped Escape |
| [ ] | 56 - Final Performance, Visual QA, and Release Readiness | `gis-modal-ui/p56-final-readiness` |  |  | Build, visual QA, performance final gate |

---

## Dependency Notes

- Prompt 01 must land before Prompt 02.
- Prompt 02 must land before Prompts 03-05 and 17.
- Prompt 03 must land before Prompt 04.
- Prompt 05 must land before Prompts 06, 07, 11, 12, 13, 14.
- Prompt 08 must land before deep inspector routing in Prompts 09, 11, 14.
- Prompt 09 should land before Prompt 10 so Problems has a model to mount.
- Prompt 10 should land before Prompts 16 and 20.
- Prompts 11-14 can run after Prompt 05, but avoid parallel edits to `MapExplorerModalComposition.tsx`.
- Prompt 15 should run after Prompts 03-14.
- Prompt 16 should run after Prompt 15.
- Prompts 22-56 are the preferred detailed execution ladder for actual implementation when the broad 01-21 architecture prompts are too coarse.
- Prompts 22-27 establish the visual/navigation foundation before deep surface work.
- Prompts 28-35 cover data, layers, inspector, QA, and tabular workflows.
- Prompts 36-44 cover canvas, analysis, style, labels, and legend parity.
- Prompts 45-49 cover raster, temporal, 3D, urban form, and VoxCity.
- Prompts 50-53 cover publish, review, collaboration, diagnostics, plugins, and recovery.
- Prompts 54-56 close preferences, accessibility, performance, visual QA, and release readiness.
- Prompt 56 must run last.

---

## Validation Baseline

Use prompt-specific commands first. These are the common fallback gates:

```bash
npm run typecheck
npm run lint:errors
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
npm run build
```

Map Explorer source/service changes should also run the relevant service tests:

```bash
npx vitest run src/services/map
```

Urban Analytics code should not be touched in this pack unless a typed bridge compatibility issue forces it. If `src/features/urbanAnalytics/` is touched, run:

```bash
npm run typecheck
npm run test:analytics
```

---

## Done Log

Append newest entries at the top.

| Date | Prompt | Branch | Start SHA | Commit | Push | Integration FF | Validation | Premium UI proof | Anti-amnesia proof | Residual risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-01 | 10 - Bottom Panel | `gis-modal-ui/p10-bottom-panel` | `4423465` | `3a924c8` | pushed to `origin/gis-modal-ui/p10-bottom-panel` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | Passed: `npm run typecheck`; `npm exec -- vitest run src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx` (4 files, 12/12); `npm exec -- vitest run src/centerpanel/components/map` (61 files, 570/570); `npm run lint:errors`; `npm run lint:no-tailwind-centerpanel`; `npm run test:e2e -- e2e/map-modal-layout.spec.ts` (16/16) | Added `MapBottomPanel` with keyboard-reachable Problems, Attributes, Timeline, Tasks, and Diagnostics tabs in the existing `MapBottomTimeline` flow so it sits above, not over, the status bar. Status bar QA opens Problems, Select opens Attributes, Review opens Timeline, and Perf opens Diagnostics. Existing attribute table, review timeline, and diagnostics surfaces now support embedded presentation while preserving row selection/focus, derived field creation, timeline status/revert/session actions, diagnostics retry, and redacted telemetry. Tasks tab reports only truthful current import, quick hot spot, map query, workflow preview, and render-budget state without moving heavy data into UI state. | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed. Branch created from integration start SHA `4423465`; changed files stayed within Map Explorer bottom panel/status/table/timeline/diagnostics composition and tests plus this ledger. No Urban Analytics, Synapse IDE, source-byte persistence, raw geometry movement, CRS preflight bypass, or scientific readiness softening. Unrelated dirty `.github` files left unstaged. | The Tasks tab is a truthful status aggregation, not a full worker queue inspector; deeper task controls can land with later diagnostics/recovery prompts. |
| 2026-06-01 | 09 - QA Problems Panel | `gis-modal-ui/p09-qa-problems` | `1e4dcb2` | `3d69ca0` | pushed to `origin/gis-modal-ui/p09-qa-problems` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | Passed: `npm run typecheck`; `npx vitest run src/services/map/__tests__/MapScientificQA.test.ts` (8/8); `npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts` (8/8); `npx vitest run src/centerpanel/components/map/__tests__/mapProblemsPanel.test.tsx` (3/3); `npx vitest run src/centerpanel/components/map` (59 files, 566/566); `npm run lint:errors`; `pwsh -ExecutionPolicy Bypass -File scripts/check-no-tailwind-centerpanel.ps1` passed (`npm` wrapper still calls missing `powershell`) | Added reusable Problems model/panel. Rows group CRS, geometry, noData/raster, vertical datum, temporal, source/provenance, external provider, demo/synthetic, and generated-mode caveats by severity with affected layer/source, reason, and action target. `ScientificQAPanel` now shows Problems first while preserving QA domains, badges, issue cards, expandable details, and `onShowDetails`; `MapStatusBar` QA opens the Problems-enhanced QA panel. | Fresh GIS Modal Premium UI Redesign pack confirmed; archived ladder not resumed. Branch created from `1e4dcb2`; scope stayed within Map Explorer QA Problems UI/model, status routing, navigation guardrails, and tests. No Urban Analytics, Synapse IDE, heavy geometry movement, source-byte persistence, or scientific readiness softening. Unrelated dirty `.github` files left unstaged. | Prompt 10 still needs the formal bottom Problems tab. Linked QA rows route to details now; supplemental metadata action targets can wire into CRS/source/fix flows in later prompts. |
| 2026-06-01 | 08 - Inspector Host | `gis-modal-ui/p08-inspector-host` | `22c12ac` | `52b8e21` | pushed to `origin/gis-modal-ui/p08-inspector-host` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | Passed: `npm run typecheck`; `npx vitest run src/centerpanel/components/map/__tests__/layer-inspector.test.tsx` (10/10); `npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx` (19/19); `npm run lint:errors`; `npm run test:e2e -- e2e/map-modal-layout.spec.ts` (16/16) | Added `MapInspectorHost` as the single inspector shell with `right-rail` and `bottom-drawer` presentations. `LayerInspector` now supports an embedded presentation so the modal composition no longer mounts a competing floating inspector panel. The host covers none/map, layer, feature-selection, QA issue, workflow-preview, publish, and scene contexts, with non-layer contexts intentionally rendered as route-ready placeholders. E2E proves the layer inspector opens inside `map-inspector-host` with `data-presentation="right-rail"` on desktop and the embedded layer inspector keeps Schema/CRS behavior, including explicit missing CRS. Component tests prove all existing LayerInspector tabs remain mounted, source handle restore details remain visible, and focus returns to the opener after close. Style apply continues through the existing `onApplyStyle` contract. | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed. Plan sections 6.5 and 10.5 plus Prompt 08 were read. Branch was created from integration start SHA `22c12ac`; remote integration tip was re-fetched before commit and still matched. Changed files stayed within map inspector/composition exports and focused tests/e2e. No Urban Analytics, Synapse IDE, raw geometry movement, credential persistence, or scientific readiness semantics changed. | Non-layer inspector contexts are placeholders by design; Prompt 09 and later inspector-routing prompts should wire QA issue, workflow preview, publish, and scene details into this host. Compact bottom-drawer behavior is component/API-covered and shares the same host path; the current e2e proof exercises the desktop right-rail layer route. |
| 2026-06-01 | 07 - Data Consolidation | `gis-modal-ui/p07-data-consolidation` | `2cae370` | `35468fe` implementation; `8a023d0` ledger/integration tip | pushed to `origin/gis-modal-ui/p07-data-consolidation` at `8a023d0` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` to `8a023d0` | Passed: `npm run typecheck`; `npx vitest run src/services/map/__tests__/MapDataIO.test.ts` (30/30); `npx vitest run src/services/map/__tests__/MapSourceRegistry.test.ts` (3/3); `npx vitest run src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx` (5/5); `npm run lint:errors` | Data activity now owns Add Data, Connections, Catalog, Source Health, and Demo Data in the sidebar. Catalog toolbar routing opens `data-catalog` instead of a competing floating panel. Add Data triggers the import hub while keeping the modal-owned hidden file input. Connections triggers the external services flow and keeps provider/CORS/rate-limit/no-credential caveats visible. Source Health shows restored/live, recoverable, unavailable, external, metadata-only, and demo/synthetic counts. Demo Data keeps `DEMO / SYNTHETIC` provenance visible. Format copy remains truthful for GeoJSON, CSV, Arrow, GeoParquet, KML/KMZ/GPX, Shapefile, GPKG, and sampled/profile-only formats. | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed. Prompt files and data/sidebar/navigation seams read. Scope stayed within Map Explorer data UI, catalog/source models, navigation metadata, and tests. No Urban Analytics, Synapse IDE, credential persistence, raw source-byte persistence, or heavy geometry movement introduced. | External service discovery remains modal-owned because `MapServiceDialog` owns provider-specific health flows. Source readiness counts are truthful state buckets, so a single unavailable metadata-only source may appear in both relevant counts. |
| 2026-06-01 | 06 - Layers Consolidation | `gis-modal-ui/p06-layers-consolidation` | `b9afdce` | `2528f98` | pushed to `origin/gis-modal-ui/p06-layers-consolidation` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts` pass (49/49); `npx vitest run src/centerpanel/components/map/__tests__/MapContentsModel.test.ts` pass (3/3); `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts` pass (59/59, including refreshed stale command-center assertions); `npm run lint:errors` pass | Layers activity now exposes Stack, Contents, Sources, and Cartography tabs in the existing sidebar; `MapLayerManager` and `MapContentsTreePanel` have embedded presentations that remove duplicate header/close chrome; the former floating Contents panel path is removed and the Contents toolbar command routes to `layers-contents`; dense Stack and Sources rows keep visibility, source kind, restore status, QA/publication readiness, geometry/feature count, action menus, demo/sample chips, CRS caveats, and cartography review entry points visible; cartography apply/dismiss/undo remains available in the Cartography tab and row review actions route there | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 06 branch created from pushed integration start SHA `b9afdce`; prompt-specific files read plus sidebar/composition seams; changed files: `MapLayerManager.tsx`, `contents/MapContentsTreePanel.tsx`, `contents/MapContentsTreePanel.module.css`, `controllers/MapExplorerModalComposition.tsx`, `index.ts`, `map-layer-management.test.ts`, `map-components.test.ts`; no Urban Analytics, Synapse IDE, raw geometry movement, or archived operating-pack edits | `MapCatalogPanel` still exists as the broader Data/Catalog source repair surface and may still open as a separate catalog panel from source repair actions; Prompt 07 should consolidate import/catalog/source-health chrome. The required `map-components.test.ts` gate needed stale Prompt 04/05 toolbar assertions updated to the command-center/palette contract before it could pass |
| 2026-06-01 | 05 - Sidebar Host | `gis-modal-ui/p05-sidebar-host` | `b30ed74` | `0c41b5d` | pushed to `origin/gis-modal-ui/p05-sidebar-host` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` (tip `9e58aec`) | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx` pass (8/8); broader `npx vitest run src/centerpanel/components/map` has 9 pre-existing unrelated failures isolated via `git stash` baseline run (same 9 fail in `map-components.test.ts`, `mapSurfaceInventory.test.ts`, `MapToolbar.external-services.test.tsx` without this change — command-center toolbar density measurement in jsdom, not sidebar); `npm run lint:errors` pass; `npm run test:e2e -- e2e/map-modal-layout.spec.ts` pass (16/16) after fixing an explore-entry regression (see note) | New `MapWorkbenchSidebar` hosts Overview (readiness cockpit), Data (Sources: import/catalog/contents), and Layers (Stack + Contents tabs) in one stable contextual sidebar mounted inside the existing layer rail; collapse/expand rail, scoped close, single tablist with `aria-selected`, and empty-state handling all proven by 8 unit tests; import, catalog, layer stack, and contents remain reachable across activities | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 05 branch created from pushed integration start SHA `b30ed74`; new files: `sidebar/MapWorkbenchSidebar.tsx`, `sidebar/index.ts`, `__tests__/MapWorkbenchSidebar.test.tsx`; modified `MapExplorerModalComposition.tsx` only (sidebar wiring, activity routing, extracted `layerStackElement`/cockpit/entry elements, `handleSetWorkspaceView` explore-entry guard); existing layer manager actions, catalog actions, hidden file input ownership, and import behavior preserved by reusing existing handlers | Regression fixed: entering the `explore` workspace while the activity was the navigator-centric `overview` left the rail showing the Overview cockpit instead of the layer stack, hiding `role=option` layer rows (broke 2 layer-rail e2e tests); `handleSetWorkspaceView` now lands on the `layers` activity/`layers-stack` tab when explore is entered from `overview`. Remaining residual: Layers activity stacks the sidebar header/tabs above `MapLayerManager`'s own chrome (double chrome) — cosmetic only; deferred to Prompt 06 - Layers Consolidation |
| 2026-06-01 | 04 - Command Center | `gis-modal-ui/p04-command-center` | `5ccad1b` | `a5f6924` | pushed to `origin/gis-modal-ui/p04-command-center` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx` pass (1 file, 5 tests); `npx vitest run src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts` pass (1 file, 9 tests); `npm run lint:errors` pass; `npm run test:e2e -- e2e/map-modal-layout.spec.ts` pass (16 tests) | Header now renders a compact command center with breadcrumb, place search, palette trigger, task lens selector, contextual primary action, grouped overflow, and close; e2e verifies command center controls are visible and registry count exceeds visible command count; command palette tests prove hidden `catalog` remains searchable and disabled save/load reasons are exposed | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 04 branch created from pushed integration; changed files: `MapToolbar.tsx`, `MapExplorerModalComposition.tsx`, `MapToolbar.command-palette.test.tsx`, `e2e/map-modal-layout.spec.ts`; full command registry remains wired through `buildToolbarCommands` while visible rendering is compact | Command center still lives inside `MapToolbar.tsx` for this prompt; deeper component extraction can land with later command-center/header prompts if desired |
| 2026-06-01 | 03 - Activity Rail Refresh | `gis-modal-ui/p03-activity-rail` | `190a417` | `f069f41` | pushed to `origin/gis-modal-ui/p03-activity-rail` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx` pass (1 file, 18 tests); `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx` pass (1 file, 4 tests); `npm run lint:errors` pass; `npm run test:e2e -- e2e/map-modal-layout.spec.ts` pass (16 tests) | Activity rail now renders primary and utility workbench activities from the Prompt 02 navigation model; e2e switches Data then Layers and verifies `data-map-active-activity`, `aria-pressed`, and visible map canvas; temporary export/save utility actions keep disabled reasons visible | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 03 branch created from `gis-modal-ui/premium-redesign`; changed files: `MapExplorerModalComposition.tsx`, `MapWorkspaceShell.tsx`, `MapToolbar.tsx`, `mapShellPrimitives.test.tsx`, `MapToolbar.command-palette.test.tsx`, `e2e/map-modal-layout.spec.ts`; command palette test keeps former rail commands reachable for layer panel, catalog, contents, processing, layout/figure, QA, export, and save | Activity switching opens representative legacy panels as temporary homes until Prompt 05 introduces the sidebar host; Scene opens the existing 3D panel rather than a full Scene sidebar until later prompts |
| 2026-06-01 | 02 - Navigation Model | `gis-modal-ui/p02-navigation-model` | `8ae31ee` | `89e015b` | pushed to `origin/gis-modal-ui/p02-navigation-model` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map/__tests__` pass (50 files, 530 tests); `npm run lint:errors` pass | Added pure navigation metadata only; tests assert `MapToolbar`, `MapExplorerModalComposition`, and `MapWorkspaceShell` do not import `mapNavigationModel`, so runtime rendering is unchanged | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 02 branch created from pushed integration; added files: `src/centerpanel/components/map/navigation/mapNavigationModel.ts`, `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`; updated `src/centerpanel/components/map/navigation/index.ts`; model links every Prompt 01 inventory item to an activity, sidebar tab, inspector context, or bottom tab where applicable | Navigation bindings are derived from inventory metadata and may be refined as later prompts replace temporary panel homes with concrete shell slots |
| 2026-06-01 | 01 - Command and Panel Inventory | `gis-modal-ui/p01-inventory` | `486b65a` | `e34aebc` | pushed to `origin/gis-modal-ui/p01-inventory` | fast-forwarded and pushed `origin/gis-modal-ui/premium-redesign` | `npm run typecheck` pass; `npx vitest run src/centerpanel/components/map` pass (56 files, 532 tests); `npm run lint:errors` pass | Added pure inventory module only; tests assert `MapToolbar`, `MapExplorerModalComposition`, and `MapWorkspaceShell` do not import the inventory, so runtime rendering is unchanged | Fresh GIS Modal Premium UI Redesign pack confirmed; archived production GIS ladder not resumed; Prompt 01 branch created from `gis-modal-ui/premium-redesign`; added files: `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`, `src/centerpanel/components/map/navigation/index.ts`, `src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts`; coverage maps toolbar commands, palette commands, `show*` flags, activity rail IDs, hidden scene toggles, workspace views, quick actions, dialogs, drawers, overlays, and status surfaces | Inventory is a static contract over current source markers; future Prompt 02 should convert this into the semantic navigation model |

---

## Blocker Log

Use this table only when a prompt cannot complete.

| Date | Prompt | Branch | Blocker | Attempts | Needed action |
| --- | --- | --- | --- | --- | --- |

---

## Files Expected To Change By Prompt

This is a planning guide, not a hard allowlist.

| Prompt | Expected files / areas |
| --- | --- |
| 01 | `src/centerpanel/components/map/navigation/*`, map navigation tests |
| 02 | `src/centerpanel/components/map/navigation/*`, map navigation tests |
| 03 | `MapWorkspaceShell.tsx`, `MapExplorerModalComposition.tsx`, shell tests |
| 04 | `MapToolbar.tsx`, command center component, command palette tests |
| 05 | `sidebar/MapWorkbenchSidebar.tsx`, composition wiring, sidebar tests |
| 06 | `MapLayerManager.tsx`, `contents/MapContentsTreePanel.tsx`, layer/content tests |
| 07 | `catalog/MapCatalogPanel.tsx`, import/service wiring, source tests |
| 08 | `inspector/MapInspectorHost.tsx`, `LayerInspector.tsx`, inspector tests |
| 09 | QA Problems model/component, `ScientificQAPanel.tsx`, QA tests |
| 10 | `bottom/MapBottomPanel.tsx`, status bar routing, attribute/timeline/diagnostics tests |
| 11 | Analyze sidebar tabs, workflow/toolbox/model/query wiring, processing tests |
| 12 | Style sidebar tabs, style/legend/cartography tests |
| 13 | Scene sidebar tabs, raster/temporal/3D/zoning panels, scene tests |
| 14 | Publish sidebar tabs, export/report/package tests |
| 15 | `mapTokens.ts`, `ui/*`, CSS modules, visual QA tests |
| 16 | e2e tests, `docs/map-visual-qa-checklist.md` if needed |
| 17 | navigation lenses, layout reset/density controls, store preference tests |
| 18 | canvas controls, basemap/fit/tool controls, layout e2e |
| 19 | collaboration UI, review/timeline integration, collaboration tests |
| 20 | accessibility tests, focus/Escape behavior, a11y e2e |
| 21 | lazy-mount checks, diagnostics/performance tests, build proof |
| 22 | `mapTokens.ts`, `design/motion.module.css`, token/status/motion tests |
| 23 | `ui/*`, shell primitive tests, visual QA primitive coverage |
| 24 | `MapToolbar.tsx`, `MapCommandPalette.ts`, navigation command metadata, palette tests |
| 25 | command center/header components, `MapSearchBar.tsx`, composition wiring, layout e2e |
| 26 | `MapWorkspaceShell.tsx`, activity rail wiring, navigation model, shell tests |
| 27 | `MapWorkspaceCockpit.tsx`, `mapExperience.ts`, cockpit CSS/tests |
| 28 | import dialogs, `MapDataImporter.ts`, import preflight tests, source support docs if needed |
| 29 | `catalog/MapCatalogPanel.tsx`, `MapServiceDialog.tsx`, source/connection services/tests |
| 30 | `MapLayerManager.tsx`, `mapLayerMetadata.ts`, layer-management/visual tests |
| 31 | `contents/MapContentsTreePanel.tsx`, `contentsModel.ts`, contents tests |
| 32 | layer action menu/context menu utilities, layer/context-menu tests |
| 33 | `inspector/LayerInspector.tsx`, `MapInspectorHost.tsx`, metadata/evidence tests |
| 34 | `DeclareCrsControl.tsx`, `ScientificQAPanel.tsx`, CRS/QA/topology tests |
| 35 | `table/MapAttributeTable.tsx`, `fieldProfiles.ts`, `fieldCalculator.ts`, join tests |
| 36 | `MapCanvas.tsx`, selection/drawing/measurement components, canvas keyboard tests |
| 37 | `MapWorkflowDrawer.tsx`, AOI dispatch, workflow service/tests |
| 38 | `processing/MapProcessingToolboxPanel.tsx`, `ToolParameterForm.tsx`, registry/toolbox tests |
| 39 | `modelBuilder/MapModelBuilderPanel.tsx`, model service/tests |
| 40 | `MapNLQueryPanel.tsx`, `MapNLQueryBuilder.ts`, `MapAIGuardrails.ts`, guardrail tests |
| 41 | cluster/hotspot/heatmap/emerging panels, spatial stats service/tests |
| 42 | style editor, symbology utils, advanced cartography engine/tests |
| 43 | label engine, annotation/bookmark/pin surfaces, label/annotation tests |
| 44 | legend contract, map legend overlay, export legend tests |
| 45 | raster panel, raster legend/chart, raster QA/histogram/parser tests |
| 46 | temporal player panel, temporal playback engine/store tests |
| 47 | scene3d panels, scene controller, terrain/city model service, scene store tests |
| 48 | zoning/massing/sun/corridor panels and services/tests |
| 49 | VoxCity overlay/projection/selection/Urban bridge tests |
| 50 | layout designer, figure composer, layout/export services/tests |
| 51 | data export dialogs, offline package, report handoff services/tests |
| 52 | review timeline, collaboration UI/service/session tests |
| 53 | diagnostics panel, plugin panel, observability/error-boundary/performance tests |
| 54 | preferences store, layout slice/persistence, lenses/reset/density tests |
| 55 | accessibility tests, focus/Escape behavior, a11y e2e |
| 56 | visual QA docs/tests, performance diagnostics, e2e, build proof |

---

## Premium Evidence Requirements

Each completed prompt must record the applicable evidence in the Done Log.

| Evidence type | Required when | Example proof |
| --- | --- | --- |
| Command coverage | prompts 01-04, 16, 18 | tests prove all commands remain mapped/searchable |
| Layout proof | prompts 03-10, 15-18 | e2e or component proof for no overlap/scroll clipping |
| Motion proof | prompts changing panel/row/status/progress motion | reduced-motion test or explicit unchanged note |
| Scientific truthfulness | prompts touching QA/source/layers/analyze/publish/scene | missing CRS/demo/external caveats remain visible |
| Accessibility proof | prompts adding controls/panels/tabs | keyboard/focus/aria/disabled reason proof |
| Performance proof | prompts 13, 15, 21, 47, 56 or lazy-loaded panels | inactive heavy panels are not eagerly mounted |
| Push proof | every prompt | prompt branch push + integration fast-forward push recorded |

---

## Non-Negotiables

- Keep the map canvas first.
- Keep every existing GIS capability reachable.
- Keep command palette complete.
- Keep scientific caveats visible.
- Keep demo/synthetic/generated labels explicit.
- Do not persist heavy geometry through layout preferences.
- Do not sync raw data through collaboration UI.
- Do not bypass CRS preflight.
- Do not add Tailwind to `centerpanel/`.
- Do not continue the archived GIS prompt ladder.
