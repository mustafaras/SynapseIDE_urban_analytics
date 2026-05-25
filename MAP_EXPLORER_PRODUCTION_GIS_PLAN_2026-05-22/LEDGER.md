# LEDGER — Map Explorer Production GIS prompt ladder

Single source of execution state + the resume point for any chat (especially a fresh one with no memory). Date started: 2026-05-22.

> **This ledger does not auto-run anything.** It is *discovered* via the `CLAUDE.md` "Active operating pack" pointer (auto-loaded every session) and via `README.md`. Once an agent opens this pack, this is the first file to read: it tells the agent how to boot safely and which prompt is next. Treat it as the "where are we / what next" record.

---

## ▶ Resume in a new chat (do this first)

0. Start from the latest completed GIS prompt branch, not the older prompt-pack
  base. For Prompt 6+, use `gis/p05-profiling` (Prompts 3–5 committed as `105e417`)
   (or the active `gis/map-explorer-production-prompts` branch once advanced to the same head).
   The WelcomeModal orbital redesign commit (`aa0be7d`) must remain in ancestry;
   do not resume from the older `4d47df5` base unless you first merge/cherry-pick
   the WelcomeModal redesign and the completed Prompt 1–2 baseline.
1. Open [15_AGENT_EXECUTION_PROMPTS.md](15_AGENT_EXECUTION_PROMPTS.md) → read the **"⚠️ Cold-start protocol (anti-amnesia)"** section and copy its **BOOT BLOCK**.
2. Read the **Status** table below; pick the lowest-numbered prompt that is `TODO` (respecting the dependency graph in the prompt file's "Sequencing Cheat Sheet").
3. Paste the BOOT BLOCK, then paste that prompt, into the new chat.
4. The agent must: read the named docs/contracts/fixtures, create a checkpoint branch `gis/p<NN>-<slug>`, deliver the prompt's **Proof**, run its **Validate** commands, then **append a row to the Done Log below and flip the Status checkbox** in the same commit.

If you only have this ledger in front of you and nothing else: the standing rules are summarised under "Non-negotiables (mirror)" near the bottom — but still open the prompt file's Agent Contract v2 for the full list.

---

## Status (0 → 64)

Legend: `[x]` done · `[~]` in progress · `[ ]` TODO · `[!]` blocked (see Done Log).

**Track A — Foundation**
- [x] 0 — Bootstrap: contracts + fixtures + conventions ✅ verified
- [x] 1 — Baseline inventory + canonical-surface ADR ✅ verified
- [x] 2 — Decompose `MapExplorerModal.tsx` ✅ verified
- [x] 3 — Store slices + selectors ✅ verified
- [x] 4 — `MapSourceRegistry` V1 ✅ verified
- [x] 5 — Import preflight + profiling + support matrix ✅ verified (profiling/preflight green; e2e 3/3 green after fixing a real QA re-eval freeze on import — see Done Log + Drift notes)
- [x] 6 — `MapProjectionService` + `ExecutionCrsPlanner`
- [x] 7 — `CrsPreflight` gate ✅ verified
- [x] 8 — CRS correction UI + projection suggestion ✅ verified
- [x] 9 — Map command lifecycle (`MapActionExecutor`) ✅ verified
- [x] 10 — Layer inspector workbench ✅ verified
- [x] 11 — Attribute table + selection sync ✅ verified (map/type/lint/e2e green; `test:analytics` runner hang noted under Drift notes)
- [x] 12 — Style editor + legend contract ✅ verified
- [x] 13 — Workerized geometry operations ✅ verified
- [x] 14 — AOI + vertex editing ✅ verified
- [x] 15 — Selection tools + query planner ✅ verified
- [x] 16 — `MapUrbanBridgeService` V1 ✅ verified
- [ ] 17 — Urban method compatibility rail
- [ ] 18 — Map context → Urban recommendations
- [ ] 19 — Evidence publication hardening
- [ ] 20 — Review timeline + action export
- [ ] 21 — External service production path

**Track B — Publication / Perf / Release**
- [ ] 22 — Publication figure composer V1
- [ ] 23 — Performance budgets + render diagnostics
- [ ] 24a — Processing toolbox: registry + UI + 3 reference tools
- [ ] 24b — Processing toolbox: wrap services (≥12)
- [ ] 24c — Processing toolbox: premium styling + blocked states
- [ ] 25a — Model builder: graph + deterministic run
- [ ] 25b — Model builder: batch + IDE artifact + Urban publish

**Track C — Operator surfaces**
- [ ] 26 — Catalog + connection manager
- [ ] 27 — Professional contents tree
- [ ] 28 — Field statistics + safe field calculator

**Track D — Layouts + 3D**
- [ ] 29 — Layout composer V2 + map book
- [ ] 30 — 3D scene runtime + 2.5D extrusion
- [ ] 31 — Block/parcel model + zoning rule engine
- [ ] 32a — Zoning envelope (deterministic, CRS-gated)
- [ ] 32b — Massing alternatives + scenario manager
- [ ] 33 — Sunlight/shadow + 3D scenario evidence
- [ ] 34 — 3D block + scenario interaction design

**Track E — Premium design + motion + visual QA**
- [ ] 35 — Extend GIS token layer (status/density/motion)
- [ ] 36 — Workbench shell hardening + shared primitives
- [ ] 37 — Catalog/contents/inspector visual pass
- [ ] 38 — Table/toolbox/layout visual pass
- [ ] 39 — Motion system + reduced-motion gate
- [ ] 40 — Visual QA + design release gate

**Track G — Capability depth**
- [ ] 43 — GeoPackage/Shapefile/KML/GPX import
- [ ] 44 — Large vector streaming + extent query
- [ ] 45 — Raster/GeoTIFF render + histogram + QA
- [ ] 46 — Temporal layers: playback + frame export
- [ ] 47 — Labeling engine
- [ ] 48 — Advanced cartography (bivariate/dot-density)
- [ ] 49 — Topology validation + guided repair
- [ ] 50 — Join/relate preview
- [ ] 51 — Reprojection cache
- [ ] 52 — Multi-scale vector tile pipeline

**Track H — Enterprise / modern GIS depth**
- [ ] 53 — Command palette + keyboard system
- [ ] 54 — Undo/redo stack
- [ ] 55 — Plugin/extension registry
- [ ] 56 — Telemetry/observability + error recovery
- [ ] 57 — Offline reproducible package export
- [ ] 58 — AI guardrails for NL query + copilot
- [ ] 59 — Collaboration: shared review sessions
- [ ] 60 — Terrain/elevation + CityJSON/3D Tiles
- [ ] 61 — View corridors + section/cut planes
- [ ] 62 — Raster/temporal/3D evidence visual states

**Track F — Close-out**
- [ ] 63 — Documentation + support matrices
- [ ] 64 — Release candidate gate

---

## Done Log (newest first)

| Date | Prompt | Branch | Commit(s) | Proof |
| --- | --- | --- | --- | --- |
| 2026-05-25 | 16 — `MapUrbanBridgeService` V1 | `gis/p16-bridge` | `fe18642` | Canonical `bridge/MapUrbanBridgeService.ts` now owns Map→Urban summary payload construction and Urban→Map request/preview transport; the two legacy adapters delegate to it. `UrbanToMapMethodRequestPayload` is normalized at the bridge boundary to `version: 1` with destination/timestamp while legacy request inputs remain accepted. Contract coverage proves both adapter-equivalence directions, versioned Urban request delivery, and absence of `sourceData` from bridge payloads. `npm run typecheck`, `npx vitest run src/services/map` (265 passed / 2 skipped), `npm run test:analytics` (1115 passed), and `npm run lint:errors` clean. |
| 2026-05-25 | 15 — Selection tools + query planner | `gis/p15-query` | `b27fd1a` | Existing Prompt 15 implementation was found committed but absent from this ledger: bounded `MapQueryPlanner`, rectangle/lasso/filter selection tools, selection-count UI, and the associated map integration/tests are present. Re-verified from descendant `gis/p16-bridge`: `npm run typecheck` clean; `npx vitest run src/services/map` includes `MapQueryPlanner` and is green (265 passed / 2 skipped); Playwright proof `npx playwright test e2e/map-modal-layout.spec.ts -g "selects fcPointsWGS84 points with a rectangle"` passes 1/1. |
| 2026-05-24 | 14 — AOI + vertex editing | `gis/p14-aoi-edit` | `ed05797` | Shared `DrawnGeometryValidation` service now validates drawn/AOI geometry across drawing, workflow, command lifecycle, and Urban study-area sync; self-intersection/null geometry are explicit `blocked` states with topology caveats, while warnings stay visible instead of being treated as readiness. AOI workflow now supports **five sources**: viewport, selected features, drawn polygon, geocoded place, and Urban study area; applying an AOI workflow also registers an editable drawn AOI with validation. `MapDrawingManager` keeps vertex-edit previews live, snaps to drawn + visible/queryable layer vertices under a bounded scan (`4_000` vertices; first 8 queryable layers / 1 000 features each), then commits through `MapActionExecutor` as `aoi.edit`; blocked edits revert to the prior geometry and write a failed audit event, valid/warning edits write review-timeline audit + revert token. `MapActionHistoryService` can revert AOI edits. `npm run typecheck` clean; `npx vitest run src/centerpanel/components/map src/services/map` 590 passed / 2 skipped (64 files); `npm run test:analytics` 1115 passed (63 files). **Proof (Playwright):** `npx playwright test e2e/map-modal-layout.spec.ts -g "builds a viewport AOI"` 1/1 — build viewport AOI from workflow, open editable drawings panel, drag a vertex, assert validation status remains visible and review timeline contains `Edited AOI`. |
| 2026-05-24 | 13 — Workerized geometry operations | `gis/p13-workerize` | `060c90e` | New `geometry/GeometryWorkflowEngine.ts` is the single canonical home for buffer/intersect/difference/union (the four turf compute fns + `mergePolygons`/`mergeAllPolygons`/`isPolygonGeometry` moved out of `MapWorkflowService` and imported back — no fork); `computeGeometryWorkflow(request, report)` validates inputs (throws `GeometryWorkflowError`), reports progress, and returns a fully attributed computation (FC, metrics, bounds, geometry class, `backend`, echoed `executionCrs`). **geos-wasm is the real compute backend** via a `GeometryOps` seam (`geosGeometryBackend.ts`): the engine reprojects display(4326)→execution CRS once (proj4/`MapProjectionService`), runs rigorous planar geos buffer/overlay in metres, then reprojects back — turf is the resilient fallback (geographic/no execution CRS or a failed wasm load). Backend is recorded truthfully. Registered `geometry/workflow` in the existing `BackgroundWorkerPool` (`taskDefinitions` + `workerHandlers` + `geometry` domain); `mapWorkflowWorkerExecutor` bridges the pool (progress + cancel) to the new injectable `MapWorkflowWorkerExecutor`. `MapWorkflowService` now bounds the main-thread preview to `MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT=1500` (large input ⇒ `previewSampled`+`executionDeferred`, and `applyMapWorkflowPreview` refuses a deferred preview); `executeMapWorkflow` routes large inputs to the worker and commits a derived layer whose manifest `crsSummary.executionCrs` = the execution CRS. `MapWorkflowDrawer` renders a `map-workflow-progress` bar + `map-workflow-cancel` + `map-workflow-error`, and the Apply button becomes "Run in worker"; composition wires `handleExecuteMapWorkflow`/`handleCancelMapWorkflow`. `npm run typecheck` clean; `npx vitest run src/services/map src/workers` 255 passed/2 skipped (33 files) incl. new `GeometryWorkflowEngine.test.ts` (geos-wasm backend on projected CRS, turf fallback when none, reproject round-trip, dissolve→1 feature, induced-failure throws, op correctness), `MapWorkflowWorkerExecution.test.ts` (worker apply → manifest, output CRS = execution CRS, clean cancel = `BackgroundTaskCancelledError`, induced failure rejects, deferred-apply refused), `geometryWorkflowTask.test.ts` (runs in pool + clean cancel); `npx vitest run src/centerpanel/components/map` 333 passed incl. `map-workflow-worker-ui.test.tsx` (progress/cancel/failure UI); `lint:errors`, `lint:no-tailwind-centerpanel`, `color:guard:changed` (exit 0), `npm run build` clean. **Proof (Playwright):** `npx playwright test e2e/map-modal-layout.spec.ts -g "runs a large buffer in a worker"` 1/1 — an 8 000-point buffer runs through the real worker pool on the **geos-wasm** backend (verified `backend === "geos-wasm"` in the browser worker), reports progress, returns a `derived:buffer` layer with `executionCrs EPSG:32635`, and a rAF counter advances (25 frames) during the run proving the main thread stays responsive. |
| 2026-05-24 | 12 — Style editor + legend contract | `gis/p12-style` | `6861aa0` | New `inspector/style/` package: `legendContract.ts` serializes one `SerializedMapLegendSpec` (choropleth/categorical/graduated+proportional symbol/heatmap/single + explicit no-data class, opacity, outlines, MapLibre-safe colors via `resolveMapPaintColor`); `LayerStyleEditor.tsx` (in the inspector Style tab) builds the update + live legend preview; `MapLegendOverlay.tsx` renders the on-map legend. The same spec drives the on-map overlay, the layer-rail legend preview, the report handoff snapshot/evidence, and the publication export — `MapExportService.legendItemsFromLayerStyle` now reads the serialized spec first so all four surfaces stay identical. `MapCartographyAdvisor` emits `classification-method` (now `warning`) + new `uncertainty-metadata` warnings. `npm run typecheck` clean; `npm run color:guard:changed` exit 0 (legendContract literals are intentional MapLibre paint values); `npx vitest run src/services/map src/centerpanel/components/map` 566 passed / 2 skipped (60 files) incl. `style-editor-legend-contract.test.ts` (report legend deep-equals map legend after a style change; no-data class present; skewed-data + missing-uncertainty warnings); `lint:no-tailwind-centerpanel`, `lint:errors`, and `npm run build` clean. |
| 2026-05-23 | 11 — Attribute table + selection sync | `gis/p11-table` | `ff1a9bc` | `MapAttributeTable` (table/) added for queryable vector layers with sort, multi-column filters, bounded/windowed rows, row select, clear/focus-selected controls, and feature-id resolution aligned with `MapCanvas`; `MapLayerManager` exposes a per-layer `Table` affordance and `MapExplorerModalComposition` routes row selection through the existing selection slice so map highlight/status and `mapContextSummary` update from the same IDs. `npm run typecheck` clean; `npx vitest run src/centerpanel/components/map` clean; targeted `MapAttributeTable` + context tests 16 passed; `lint:no-tailwind-centerpanel`, `lint:errors`, and `color:guard:changed` clean; Playwright `npx playwright test e2e/map-modal-layout.spec.ts -g "opens an attribute table"` 1/1 passed (open table → click row → selected count/context summary = 1). |
| 2026-05-23 | 10 — Layer inspector workbench | `gis/p10-inspector` | `1b83d8e` | `LayerInspector` (inspector/) added — tabbed Overview / Source(+`SourceHandle`) / Schema / CRS / QA / Style / Lineage / Report fed only from `normalizeLayerRegistryMetadata` + the resolved source handle, rendering `unknown`/`missing` explicitly (no blanks) and never duplicating resolver logic; the Lineage tab links analysis layers to run/manifest/evidence ids; an inline per-row Inspect affordance opens it. `npm run typecheck` clean; `npm run build` clean; `lint:no-tailwind-centerpanel` + `lint:errors` clean; `npx vitest run src/centerpanel/components/map` 326 passed (29 files) incl. 6 inspector tests; Playwright `npx playwright test e2e/map-modal-layout.spec.ts -g "opens a tabbed layer inspector"` 1/1 (known layer Schema lists `value` + CRS `EPSG:4326`; `fcMissingCrs` CRS shows `missing`). |
| 2026-05-23 | 9 — Map command lifecycle (`MapActionExecutor`) | `gis/p09-command-lifecycle` | `a8b1c21` | `MapActionExecutor` (preview/apply/revert) + `MapActionHistoryService` (history + revert tokens) added; `layer.remove`/`layer.style`/`workflow.apply`/`report.handoff` preflight → `MapCommandResult` (+ `MapReproducibilityManifest` for workflow.apply) + one review-timeline audit event, and blocked commands return `blockers`; layer removal (both panels) and workflow.apply (derived-layer commit) route through the executor and the review timeline shows a `map-review-timeline-revert` affordance that restores prior store state and marks the event undone. `npm run typecheck` clean; `npx vitest run src/services/map src/stores src/centerpanel/components/map` 694 passed / 2 skipped (66 files); `lint:errors` + `lint:no-tailwind-centerpanel` clean; Playwright `npx playwright test e2e/map-modal-layout.spec.ts -g "routes layer removal"` 1/1 passed (remove layer → audit row → revert restores the layer). |
| 2026-05-23 | 8 — CRS correction UI + local projection suggestion | `gis/p08-crs-ui` | `8030bf8` | `DeclareCrsControl` (searchable EPSG catalog + local UTM/equal-area suggestion from `localUtmFor`) added to the layer rail for missing/unknown/user-declared CRS; declaring writes provenance `source:"user-declared"` with a permanent caveat through `buildUserDeclaredCrsSummary` + `resolveOverlayLayerCrsSummary` (status stays a known value so projected work proceeds, but it is never marked verified and the caveat survives every read); badge reads `user-declared (caveat)`; `LayerMetadataSource` gains `"user-declared"`; Urban `dataFitness` now reads the declared CRS but downgrades a user-declared CRS to a caveated `warning` (capped score + `user_declared_crs` issue) so it is never authoritative. `npm run typecheck` clean; `npx vitest run src/services/map src/centerpanel/components/map` 541 passed / 2 skipped (56 files); `npm run test:analytics` 1113 passed (62 files); `lint:errors` + `lint:no-tailwind-centerpanel` clean; Playwright `npx playwright test e2e/map-modal-layout.spec.ts -g "declares a user CRS"` 1/1 passed (declare EPSG:32635 on `fcMissingCrs` → badge `user-declared (caveat)`, caveat persists). |
| 2026-05-22 | 7 — `CrsPreflight` gate | `gis/p07-crs-preflight` | `fb0e30f` (Prompts 6–7 committed together) | `CrsPreflight` service added for planar/geodesic CRS gates with `declare-crs` / `reproject` remedies and Urban `requiredCrs` conflicts; workflow buffer/intersect/difference/union previews now block planar metric work before geometry computation when CRS is missing, geographic, mixed, or incompatible; measurement and report scale use geodesic preflight caveats; drawer renders `map-workflow-crs-blocked-card` with a remedy button; `npm run typecheck` clean; `npx vitest run src/services/map` 215 passed / 2 skipped (27 files); `npx vitest run src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts` 54 passed; Playwright proof `npx playwright test e2e/map-modal-layout.spec.ts -g "blocks buffer workflows when source CRS is missing"` 1/1 passed with missing CRS buffer blocked and `Declare CRS` visible. |
| 2026-05-22 | 6 — `MapProjectionService` + `ExecutionCrsPlanner` | `gis/p07-crs-preflight` | `fb0e30f` (Prompts 6–7 committed together) | `MapProjectionService` wraps `proj4` with projected checks, dynamic local UTM, and equal-area helpers; `ExecutionCrsPlanner` returns `sourceCrs/displayCrs/executionCrs/executionKind` and refuses to fabricate execution CRS for missing source metadata; workflow preview manifests now carry execution CRS and the HUD shows an `Execution CRS` chip; `npm run typecheck` clean; `npx vitest run src/services/map` 206 passed / 2 skipped (26 files); Playwright proof `npx playwright test e2e/map-modal-layout.spec.ts -g "shows the execution CRS chip"` 1/1 passed with `Execution CRS EPSG:32635`. |
| 2026-05-22 | 5 — Import preflight + profiling + support matrix | `gis/p05-profiling` | `105e417` (Prompts 3–5 committed together) | `SourceProfile` profiling added for ready imports, CSV row quality, large/empty/missing-CRS cases, external services, and profile-only partial formats; new preflight dialog gates ready imports before commit; CSV/columnar dialogs now show preflight facts; support matrix documented; `npm run typecheck` clean; `npm run lint:errors` clean; `npx vitest run src/services/map` 202 passed / 2 skipped (25 files); `npx vitest run src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx` 2/2 passed; Playwright re-verified 2026-05-22: **all 3/3 import tests pass green** (CSV mandated proof `3 skipped rows` + `CRS unknown`; KML placemarks; GPX) after fixing a real product defect found during re-verification (see Drift notes — Scientific QA re-evaluation storm on import froze the main thread; fixed by debouncing the QA effect). Profiling unit coverage (skipped=3, missing/empty/large/external) all green; `npx vitest run src/services/map src/centerpanel/components/map` 517 passed / 2 skipped (52 files). |
| 2026-05-22 | 4 — `MapSourceRegistry` V1 | `gis/p05-profiling` | `105e417` (Prompts 3–5 committed together) | `MapSourceRegistry` service added with `SourceHandle` CRUD + storage/restore mapping; imports now create source handles and `metadata.sourceId`; source handles persist as sanitized metadata in Zustand and project snapshots; restore resolves unavailable/recoverable/restored into layer metadata; layer manager shows `kind / restore status`; `npm run typecheck` clean; `npm run lint:errors` clean; `npx vitest run src/services/map src/stores` 338 passed / 2 skipped (34 files); `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts` 46/46 passed |
| 2026-05-22 | 3 — Store slices + selectors | `gis/p05-profiling` | `105e417` (Prompts 3–5 committed together) | Store slice policy modules added under `src/stores/mapExplorer/`; persistence boundary extracted and documented; fine-grained selectors added and used by the modal composition; `npm run typecheck` clean; `npm run lint:errors` clean; `npx vitest run src/stores` 137/137 (9 files) incl. heavy `fcLarge(1000)` `sourceData` persistence guard + selector stability tests |
| 2026-05-22 | 2 — Decompose `MapExplorerModal.tsx` into controller hooks | `gis/p02-decompose` | `633d1ad..04d7b62` | Public `MapExplorerModal.tsx` reduced 6006 → 2 lines; implementation moved to `map/controllers/MapExplorerModalComposition.tsx`; controller hooks added for lifecycle, layer runtime, command routing, panel layout, Urban bridge, report state, workflow state; `npm run typecheck` clean; `npm run lint:errors` clean; `npx vitest run src/centerpanel/components/map src/stores` 443/443 (35 files); Playwright map layout smoke `npx playwright test e2e/map-modal-layout.spec.ts -g "keeps map, layer rail, and bottom status visible on desktop"` passed |
| 2026-05-22 | 1 — Baseline inventory + canonical-surface ADR | `gis/p01-baseline` | `b37e239` | ADR `docs/architecture/map-explorer-canonical-surface.md` committed (both-family inventory + Prompt 2 target list); linked from `docs/architecture/README.md`; `npm run typecheck` clean; `npm run lint:errors` clean; `npx vitest run src/centerpanel/components/map` 302/302 (19 files) incl. new `map-explorer-canonical-baseline.test.tsx` (modal mount/unmount + store layer add→remove) |
| 2026-05-22 | 0 — Bootstrap | `gis/map-explorer-production-prompts` | `4ae627d` | `npm run typecheck` clean; `gisFixtures.test.ts` 8/8 pass |
| 2026-05-22 | (pack) plan + prompt ladder v4 | `gis/map-explorer-production-prompts` | `f620aae`, `93dce2c` | 16-doc pack + v4 prompts + cold-start protocol committed |

Artifacts created so far:
- `src/services/map/contracts/gisContracts.ts` (shared type contracts)
- `src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts` (+ `gisFixtures.test.ts`)
- `docs/architecture/map-explorer-canonical-surface.md` (canonical-surface ADR + both-family inventory; Prompt 1)
- `src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx` (baseline smoke; Prompt 1)
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` (moved modal composition; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapExplorerLifecycle.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapLayerRuntime.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapCommandHandlers.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapPanelLayout.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapUrbanBridgeController.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapReportController.ts` (+ test; Prompt 2)
- `src/centerpanel/components/map/controllers/useMapWorkflowController.ts` (+ test; Prompt 2)
- `src/stores/mapExplorer/slices/` (slice persistence policies for viewport, layers, sources, selection, AOI, QA, evidence, review, temporal, layout, bridge; Prompt 3)
- `src/stores/mapExplorer/slicePolicy.ts` (canonical slice order + persisted/transient/heavy-geometry key exports; Prompt 3)
- `src/stores/mapExplorer/persistence.ts` (`partializeMapExplorerState` persisted boundary; Prompt 3)
- `src/stores/mapExplorer/selectors.ts` (fine-grained memoized Map Explorer selectors; Prompt 3)
- `src/stores/__tests__/useMapExplorerStore.test.ts` (Prompt 3 persistence + selector invariants)
- `src/services/map/sources/MapSourceRegistry.ts` (`SourceHandle` CRUD, persistence mapping, restore resolution; Prompt 4)
- `src/services/map/__tests__/MapSourceRegistry.test.ts` (source registry CRUD/mapping/sanitization proof; Prompt 4)
- `src/services/map/MapDataImporter.ts` now emits imported layer `sourceHandle`s and source metadata references; Prompt 4
- `src/services/map/MapPersistenceService.ts` now snapshots sanitized `sourceHandles` and resolves layer restore status from handles; Prompt 4
- `docs/map-source-support-matrix.md` (format support matrix + truthfulness rules; Prompt 5)
- `src/centerpanel/components/map/MapImportPreviewDialog.tsx` (source preflight dialog for ready/profile-only imports; Prompt 5)
- `src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx` (component proof for CSV and ready-source preflight facts; Prompt 5)
- `src/services/map/MapDataImporter.ts` now exposes `SourceProfile`, `profileSource`, `profileCsvImportSession`, and profile-only results for partial formats; Prompt 5
- `src/centerpanel/components/MapCsvImportDialog.tsx` and `src/centerpanel/components/MapColumnarImportDialog.tsx` now render source preflight facts before commit; Prompt 5
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` now pauses ready local imports on source preflight confirmation; Prompt 5
- `e2e/map-csv-kml-gpx-import.spec.ts` asserts CSV skipped-row/CRS preflight and ready-import confirmation flow; Prompt 5
- `src/services/map/crs/MapProjectionService.ts` (`proj4` projection wrapper, projected CRS detection, local UTM, equal-area helpers; Prompt 6)
- `src/services/map/crs/ExecutionCrsPlanner.ts` (execution CRS planner returning `sourceCrs/displayCrs/executionCrs/executionKind`; Prompt 6)
- `src/services/map/__tests__/ExecutionCrsPlanner.test.ts` (known/geographic/projected/missing CRS planner proof; Prompt 6)
- `src/services/map/MapWorkflowService.ts` now writes execution CRS planning into workflow preview manifests; Prompt 6
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` now renders the workflow preview execution CRS chip; Prompt 6
- `e2e/map-modal-layout.spec.ts` asserts the workflow preview chip text for Istanbul WGS84 buffer previews; Prompt 6
- `src/services/map/crs/CrsPreflight.ts` (planar/geodesic CRS gate with remedies and Urban `requiredCrs` conflict blocking; Prompt 7)
- `src/services/map/__tests__/CrsPreflight.test.ts` (planar WGS84 blocked, projected OK, missing CRS blocked, geodesic caveated, required CRS conflict; Prompt 7)
- `src/services/map/MapWorkflowService.ts` now preflights buffer/intersect/difference/union before metric geometry computation and carries CRS preflight into manifests/report caveats; Prompt 7
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx` renders a CRS blocked card and remedy button for workflow blockers; Prompt 7
- `src/centerpanel/components/MapMeasurementTool.tsx` now surfaces geodesic measurement as a CRS-preflighted display caveat; Prompt 7
- `src/services/map/MapExportService.ts` now carries geodesic report-scale preflight caveats into scale specs and publication readiness; Prompt 7
- `src/services/map/UrbanToMapMethodRequestAdapter.ts` now propagates Urban `requiredCrs` into workflow previews; Prompt 7
- `e2e/map-modal-layout.spec.ts` asserts missing-CRS buffer workflows show the blocked card and `Declare CRS` action; Prompt 7
- `src/services/map/crs/crsCatalog.ts` (curated EPSG catalog + full WGS 84 UTM grid + search + typed-code parse + extent-based local UTM/equal-area suggestion; Prompt 8)
- `src/services/map/__tests__/crsCatalog.test.ts` (catalog search/suggestion/parse proof; Prompt 8)
- `src/centerpanel/components/map/DeclareCrsControl.tsx` (searchable "Declare CRS" control + local suggestion, `mapStyles`/`MAP_*` tokens; Prompt 8)
- `src/centerpanel/components/map/__tests__/crs-declaration.test.ts` (user-declared resolver/caveat proof on `fcMissingCrs`; Prompt 8)
- `src/centerpanel/components/map/mapTypes.ts` `LayerMetadataSource` adds `"user-declared"`; Prompt 8
- `src/centerpanel/components/map/mapLayerMetadata.ts` now exports `USER_DECLARED_CRS_CAVEAT` + `buildUserDeclaredCrsSummary` and preserves user-declared provenance/caveat in `resolveOverlayLayerCrsSummary`; Prompt 8
- `src/centerpanel/components/map/MapLayerManager.tsx` renders the Declare CRS control + `user-declared (caveat)` badge; Prompt 8
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` wires `handleDeclareLayerCrs` → `updateLayerMetadata`; Prompt 8
- `src/features/urbanAnalytics/context/dataFitness.ts` is CRS-provenance aware: reads the declared CRS, flags `crsUserDeclared`, downgrades a user-declared CRS to caveated (`user_declared_crs` issue); Prompt 8
- `src/services/map/actions/MapActionExecutor.ts` (preview/apply/revert lifecycle for layer.remove/style/workflow.apply/report.handoff; injected `MapActionEffects` boundary; builds the audit review event; Prompt 9)
- `src/services/map/actions/MapActionHistoryService.ts` (transient, bounded command history + revert tokens; Prompt 9)
- `src/services/map/__tests__/MapActionExecutor.test.ts` (preview/apply/blocked/revert + history + store-revert proof; Prompt 9)
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx` renders a `map-review-timeline-revert` affordance on revertable applied commands via `onRevertCommand`; Prompt 9
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` routes both layer-remove paths through `applyMapCommand`, holds a transient action history ref, and wires timeline revert; Prompt 9
- `e2e/map-modal-layout.spec.ts` asserts remove layer → review-timeline audit row → revert restores the layer; Prompt 9
- `src/centerpanel/components/map/inspector/LayerInspector.tsx` (tabbed layer inspector fed from `normalizeLayerRegistryMetadata` + `SourceHandle`; explicit unknown/missing; `initialTab` testability hook; Prompt 10)
- `src/centerpanel/components/map/__tests__/layer-inspector.test.tsx` (per-tab render proof: schema/CRS known + missing, lineage links present; Prompt 10)
- `src/centerpanel/components/map/MapLayerManager.tsx` adds an inline per-row `Inspect` affordance (`onInspectLayer`); Prompt 10
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` holds inspector state, resolves the `SourceHandle` by `metadata.sourceId`, and renders `LayerInspector`; Prompt 10
- `e2e/map-modal-layout.spec.ts` asserts the inspector shows Schema `value` + CRS `EPSG:4326` (known) and CRS `missing` (no-CRS layer); Prompt 10
- `src/centerpanel/components/map/table/MapAttributeTable.tsx` (virtualized attribute table helpers + UI: sort, filters, row select, focus selected; Prompt 11)
- `src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx` (sort/filter, `fcLarge(100_000)` bounded DOM, table → selection slice → `mapContextSummary` proof; Prompt 11)
- `src/centerpanel/components/map/MapLayerManager.tsx` adds a queryable-layer `Table` affordance (`onOpenAttributeTable`); Prompt 11
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` renders `MapAttributeTable`, focuses selected feature bounds, and writes selected IDs through the store selection slice; Prompt 11
- `e2e/map-modal-layout.spec.ts` asserts table row selection updates selected count and the map context summary; Prompt 11
- `src/centerpanel/components/map/inspector/style/legendContract.ts` (`SerializedMapLegendSpec` + `buildLayerStyleUpdate`/`getSerializedLegendSpecFromStyle`/`serializedLegendSpecToCompositionItems`; one serialized legend spec for map/panel/report/export, MapLibre-safe colors, explicit no-data class; Prompt 12)
- `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx` (Style-tab editor: mode/field/classification/ramp/classes/opacity/outline/labels/no-data + live legend preview, `mapStyles`/`MAP_*` tokens; Prompt 12)
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx` (on-map legend overlay fed from `buildMapCompositionLegendItems`; Prompt 12)
- `src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts` (report legend deep-equals map legend after style change; no-data class; classification + uncertainty warnings; Prompt 12)
- `src/services/map/MapExportService.ts` `legendItemsFromLayerStyle` now reads the serialized legend spec first so map/report/export legends stay identical; Prompt 12
- `src/services/map/MapCartographyAdvisor.ts` upgrades `classification-method` to `warning` and adds an `uncertainty-metadata` warning for thematic layers without confidence/MoE/QA caveats; Prompt 12
- `src/centerpanel/components/map/inspector/LayerInspector.tsx` Style tab now embeds `LayerStyleEditor` (`onApplyStyle`); `MapLayerManager.tsx` renders a per-row legend preview; `MapExplorerModalComposition.tsx` wires `handleApplyLayerStyle` (style+legend apply → store + review event) and renders `MapLegendOverlay`; Prompt 12
- `src/services/map/geometry/GeometryWorkflowEngine.ts` (canonical buffer/intersect/difference/union compute behind a `GeometryOps` seam + `turfGeometryOps`; `computeGeometryWorkflow` worker entry with progress, `GeometryWorkflowError`, reproject-once pipeline, real backend resolution, echoed execution CRS; Prompt 13)
- `src/services/map/geometry/geosGeometryBackend.ts` (lazy-memoised geos-wasm init, `reprojectGeometry` via proj4, `createGeosGeometryOps` — rigorous planar buffer/intersect/difference/union/unary-union with wasm-pointer cleanup; Prompt 13)
- `src/services/map/geometry/mapWorkflowWorkerExecutor.ts` (`MapWorkflowWorkerExecutor` backed by `analyticsWorkerPool`, per-job progress subscription + cancel; Prompt 13)
- `src/workers/pool/taskDefinitions.ts` + `workerHandlers.ts` register the `geometry/workflow` task (`geometry` domain) running `computeGeometryWorkflow`; Prompt 13
- `src/services/map/MapWorkflowService.ts` now imports the canonical compute fns from the engine, bounds the main-thread preview (`MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT`, `previewSampled`/`executionDeferred`), refuses deferred direct apply, and adds `buildGeometryWorkflowRequest`/`finalizeWorkerWorkflowResult`/`executeMapWorkflow` + `MapWorkflowWorkerExecutor`/`MapWorkflowExecutionUpdate`/`MapWorkflowExecutionHandle`; Prompt 13
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx` renders worker progress/cancel/failure and a "Run in worker" Apply path; `MapExplorerModalComposition.tsx` wires `handleExecuteMapWorkflow`/`handleCancelMapWorkflow` + `workflowExecution` state; Prompt 13
- `src/services/map/__tests__/GeometryWorkflowEngine.test.ts`, `src/services/map/__tests__/MapWorkflowWorkerExecution.test.ts`, `src/workers/pool/__tests__/geometryWorkflowTask.test.ts`, `src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx` (Prompt 13 tests)
- `e2e/map-modal-layout.spec.ts` asserts a large buffer runs off-thread in the worker with progress + a responsive main thread; Prompt 13
- `src/services/map/query/MapQueryPlanner.ts` (bounded attribute/spatial query planning with selection provenance; Prompt 15)
- `src/services/map/__tests__/MapQueryPlanner.test.ts`, `src/centerpanel/components/map/MapSelectionTools.tsx`, and `e2e/map-modal-layout.spec.ts` (selection-query UI and proof coverage; Prompt 15)
- `src/services/map/bridge/MapUrbanBridgeService.ts` (single versioned Map↔Urban bridge implementation and transport boundary; Prompt 16)
- `src/services/map/__tests__/MapUrbanBridgeService.test.ts` (adapter equivalence, normalized request delivery, and no-raw-payload contract proof; Prompt 16)
- `src/services/map/contracts/gisContracts.ts` now contains the canonical summary-only Map→Urban and versioned Urban→Map payload contracts; Prompt 16
- `src/services/map/MapToUrbanContextAdapter.ts` and `src/services/map/UrbanToMapMethodRequestAdapter.ts` now remain compatibility adapters delegating to `MapUrbanBridgeService`; Prompt 16

---

## Update protocol (every agent, after finishing a prompt)

1. Flip the prompt's Status checkbox to `[x]` (or `[!]` with a note if blocked).
2. Prepend a row to the Done Log: date, prompt, branch, commit hash(es), one-line proof.
3. List any new shared artifacts under "Artifacts created so far".
4. Commit the ledger update **with** the prompt's slice (same branch), so state never drifts from code.
5. If you discovered a repo fact that contradicts the prompt (path moved, type renamed), note it under "Drift notes" so the next chat doesn't repeat the surprise.

## Drift notes

- Prompt 15 / 16 resume correction (2026-05-25): `b27fd1a` already implemented Prompt 15 on `gis/p15-query`, but its status and Done Log row were not recorded before Prompt 16 work began. Prompt 15 was re-verified from its descendant Prompt 16 branch and recorded here. The partial Prompt 16 worktree was initially checked out on `gis/p17-method-rail`; because both `gis/p16-bridge` and `gis/p17-method-rail` pointed at `b27fd1a`, it was carried unchanged onto the required `gis/p16-bridge` checkpoint before completion.

- Prompt 3: `docs/architecture/map-explorer-state-and-actions.md` already existed, so it was extended with the slice/persistence table rather than created from scratch. No source-handle state was added yet; the `sources` slice is an explicit reserved boundary for Prompt 4 so the public store API remains unchanged. Existing `partialize` already omitted `overlayLayers`; Prompt 3 moved the persistence boundary into `mapExplorer/persistence.ts` and added an `fcLarge(1000)` `sourceData` guard test.

- Prompt 4: Prompt 3 was still uncommitted when Prompt 4 started, so `gis/p04-source-registry` was created carrying the validated Prompt 3 working tree forward. No commit was made because the user did not explicitly request one. Existing `LayerRestoreState` lacks `recoverable`/`unavailable`, so Prompt 4 stores canonical `SourceRestoreStatus` in layer metadata while mapping to existing `metadata-only` / `stale-reference` persistence states for backward-compatible snapshots.

- Prompt 5: Prompt 3/4 were still uncommitted when Prompt 5 started, so `gis/p05-profiling` carries the validated Prompt 3/4 working tree forward. Existing CSV and columnar import dialogs were already pre-commit review surfaces; Prompt 5 extends them with source profiles instead of routing them through the new generic preview dialog. FlatGeobuf, PMTiles, GeoTIFF, and external services are profiled truthfully as partial/profile-only until later capability-depth prompts implement full commit/render paths.

- Prompt 5 follow-up (2026-05-22 re-verification → **RESOLVED**): re-running the e2e suite did not reproduce the previously-recorded "3/3" — the KML-placemark test reproducibly timed out at the `Import Source` commit click (headless **and** headed). Instrumented root-cause: importing the KML layer put the page's main thread into a runaway re-render loop — `runMapScientificQAGeometryChecks` was being re-invoked indefinitely (host-side responsiveness poll: 16/16 samples blocked; page-side `setTimeout`/`rAF` starved; ~1 Hz QA re-eval cadence). The Scientific QA effect in `MapExplorerModalComposition` lists `zoom` as a dependency **and** `buildLayerSignature` folds `viewportZoom` into the per-layer QA cache key, so the post-import `fitToBounds` camera animation re-ran a full QA pass on every zoom tick; for the polygon layer the result never settled, and the QA work starved the animation so it never completed → self-sustaining freeze. (Not a profiling defect, not the dialog, not geometry parsing, not GL/fill rasterisation — hardware-GPU `--use-angle=d3d11` reproduced it identically.) **Fix:** debounce the QA effect (250 ms) so rapid zoom/layer changes coalesce into a single evaluation after the view settles; QA logic is unchanged (unit tests call the engine directly). Secondary correctness fix: `buildPaint` in `useLayerSync.ts` now runs `resolveMapPaintColor` over color paint keys so MapLibre never receives unparseable `var()`/`color-mix()` token strings. After the fix `npx playwright test e2e/map-csv-kml-gpx-import.spec.ts` is **3/3 green** (KML now 13 s, was a 120 s timeout) with the test left unchanged, `npm run typecheck`/`lint:errors` clean, and `vitest run src/services/map src/centerpanel/components/map` 517/2-skipped green. Also relabelled `profileCsvImportSession` `profileStrategy` `"sampled"` → `"full-parse"` to match actual behaviour.

- Branch safety: Prompt 1 was merged into the WelcomeModal redesign branch after
  the branch switch exposed that the older GIS prompt base did not contain
  `src/features/urbanAnalytics/WelcomeModal.tsx` commit `aa0be7d`. Local
  branches `fix/welcome-modal-orbital-cockpit`, `gis/p01-baseline`, and
  `gis/map-explorer-production-prompts` were aligned to the merged head so
  switching among them no longer restores the older WelcomeModal.
- Prompt 2: public import surface is unchanged (`src/centerpanel/components/MapExplorerModal.tsx`
  still exports `MapExplorerModal` and `MapExplorerModalProps`), but the heavy
  composition now lives in `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`.
  The narrower Playwright map layout smoke passed; the broader
  `e2e/map-explorer-stability.spec.ts` timed out at the helper click before a
  Map Explorer assertion and was not used as the acceptance smoke for this slice.
- Prompt 1: no drift. The two map families and the named reuse candidates
  (`BuildingLayer`, `VoxelLayer`, `ScaleBar`, `MapLegend`, `utils/projections.ts`,
  `DrawingTools`) all exist as the prompt describes. Smoke for "store layer
  add→remove" and "Urban handoff entry point fires" already existed
  (`map-layer-management.test.ts`, `studyAreaSelection.test.ts`), so only the
  missing "modal mount/unmount" smoke was added (combined with the add→remove
  Proof) — per the prompt's "only where missing" instruction. The canonical
  `MapExplorerModal` lives at `src/centerpanel/components/MapExplorerModal.tsx`
  (one level above the `map/` folder) and returns `null` when `open={false}`.

- Prompt 8: the full layer *inspector* workbench is Prompt 10, so the "layer
  inspector CRS surface" used for declaring is the existing layer rail
  (`MapLayerManager` row), where the Declare CRS control + the
  `user-declared (caveat)` badge live. `dataFitness.resolveLayerCrs` previously
  ignored `metadata.crsSummary`; Prompt 8 makes it read the declared CRS and
  sets `crsUserDeclared` so a declared CRS is scored as caveated, never
  authoritative (no module boundary crossed — `dataFitness` already read map
  layer metadata). The declared CRS keeps `status:"known"` (a known *value*,
  which unblocks projected metric work in `CrsPreflight`) while provenance
  `source:"user-declared"` + a permanent caveat carry the "not verified" truth.
  Note: `localUtmFor` for the Istanbul `fcMissingCrs`/e2e seed centroid is
  EPSG:32635, so the suggested local UTM equals the prompt's declare target.

- Prompt 9: `MapActionExecutor` performs no I/O — it drives an injected
  `MapActionEffects` boundary (store-backed in the composition, faked in tests),
  so the store stays the single source of truth and the lifecycle is unit
  testable. In-app routing wired in this slice: **`layer.remove` through both the
  `MapLayerPanel` and `MapLayerManager` rails, with full review-timeline revert**
  (the Proof), plus **`workflow.apply`**: the derived-layer commit in
  `handleApplyMapWorkflow` now routes through the executor, so the timeline
  "Remove derived layer" undo it always advertised actually reverts the layer.
  The executor fully supports + unit-tests all four kinds; `layer.style` keeps its
  existing cartography undo stack (Prompt 12 owns the style editor) and
  `report.handoff` is a queue + evidence flow with no clean dequeue, so both stay
  executor-ready + audited by their existing paths and adopt in-app revert in
  their own prompts (`removeReportItem` is a no-op until report routing lands).
  Repo realities: layer-action buttons render as `role="menuitem"` inside a
  `<details>` menu (not `button`); review-event correlation uses the command id
  as the review event `id` (`createMapReviewEvent` honors `input.id`).

- Prompt 10: the inspector opens from an inline per-row `Inspect` button in
  `MapLayerManager` (the layer-name click keeps its existing metadata popover,
  untouched). It calls `normalizeLayerRegistryMetadata(layer)` and reads raw
  `metadata.analysisResult`/`scientificQA`/`importFormat` for display only — no
  resolver logic is duplicated. The `SourceHandle` is resolved in the composition
  from the store's existing `sourceHandles` by `metadata.sourceId`. Two process
  lessons worth keeping: (1) an accidental duplicate `const sourceHandles`
  selector was caught by `npm run build` (rolldown `PARSE_ERROR`) even though
  `npm run typecheck` did **not** flag the redeclaration — so `build` is now part
  of the validation gate for composition edits; (2) a stale, separately-started
  `npm run dev` vite with broken HMR (left over from the pre-fix parse error) was
  reused by Playwright's `reuseExistingServer` and had to be killed so a clean
  dev server started.

- Prompt 11: `MapCanvas` resolves clicked feature ids as `feature.id ??
  properties.id ?? properties.feature_id ?? properties.detection_id ??
  properties.cell_id ?? properties.agent_id ?? properties.name ??
  <layer>-feature`; the attribute table mirrors that order so map-click and
  row-click selection use the same ids. Full `npm run test:analytics` could not
  complete in this Windows session: multiple runs stalled in Vitest worker
  scheduling with no failure output and were stopped; the isolated queued
  `src/services/data/pipeline/__tests__/columnarIO.test.ts` file passed 9/9
  when run separately, and Prompt 11 touched no Urban Analytics files. Required
  map/type/lint/e2e validation for this slice is green.

---

- Prompt 12: legend parity is enforced by making `MapExportService.legendItemsFromLayerStyle`
  read the serialized `SerializedMapLegendSpec` (`style.legendSpec`) **first**, before the
  legacy `style.legendEntries`/`legend`/`classes` paths — so the on-map overlay, the layer-rail
  preview, the report handoff snapshot, and the publication export all derive from the same spec
  with no duplicated mapping (`MapReportHandoffService` already builds its legend via
  `buildMapCompositionLegendItems`, so it picked up the spec for free — that file was not touched).
  The Style editor lives in the **inspector Style tab** (Prompt 10's `LayerInspector`), not a new
  modal. `legendContract.ts` literal colors (`rgb(153,153,153)` no-data, `rgba(17,24,39,…)` outline/halo,
  `rgba(0,0,0,0)` heatmap zero-density) are intentional MapLibre paint values — MapLibre cannot parse the
  `var()`/`color-mix()` `MAP_COLORS` tokens, so they stay literal and `color:guard:changed` (report mode)
  exits 0. Full-suite vitest timed out **once** on the heavy `map-explorer-canonical-baseline` mount under
  load (transform ~109s); it passes in 8.5s isolated and the re-run was 566/2-skipped green — same
  environmental Windows runner flake noted for Prompt 11, not a product defect.

- Prompt 13: the worker pool already existed (`src/workers/pool/BackgroundWorkerPool.ts`
  with progress/cancel/timeout + `useBackgroundTaskStore`), so the geometry op is a new
  `geometry/workflow` task kind on that pool rather than a new pool. **Backend reality
  (updated — geos-wasm now actually runs):** an initial pass shipped turf-in-worker with a
  geos seam because geos-wasm had never been initialised in the repo; a follow-up wired the
  **real geos-wasm backend** and verified it end to end. geos-wasm initialises in *both* node
  (vitest) and the Vite browser **module worker** (`P13 WORKER BACKEND geos-wasm`), so the
  engine now resolves geos for projected execution CRSs via a `GeometryOps` seam: reproject
  display(EPSG:4326)→execution CRS once with proj4 (`MapProjectionService.project`), run
  rigorous planar GEOSBuffer/GEOSIntersection/GEOSDifference/GEOSUnion(+unary) in metres
  (every wasm pointer destroyed), then reproject the result back to 4326. **turf is the
  resilient fallback**, used (and reported truthfully via `backend`) only when there is no
  projected execution CRS or the wasm fails to load — never silently. The main-thread preview
  stays turf (synchronous; geos init is async), so `computeBuffer/...` take a `GeometryOps`
  param defaulting to `turfGeometryOps` and the four ops are shared by both backends. geos
  correctness is proven by a dissolve test collapsing two identical overlapping squares to a
  single feature and a reproject round-trip back into lng/lat range. **Preview bounding:** the real main-thread stall was that
  `previewBuffer/Intersect/Difference/Union` computed the *full* geometry on every drawer
  change even for large inputs — now bounded to `MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT=1500`
  (sampled preview), with the full result produced only via `executeMapWorkflow` in the
  worker; `applyMapWorkflowPreview` refuses a `executionDeferred` preview so a sampled
  preview can never be committed as if complete. **CRS gate reality (e2e):** a planar buffer
  on EPSG:4326 is correctly `reproject`-blocked by `CrsPreflight` (Prompt 7), so it never
  routes to the worker; the e2e proof therefore declares the large fixture layer as projected
  `EPSG:32635` so the buffer is CRS-safe, routes to the worker, and the manifest execution CRS
  is deterministic. The in-app progress/cancel/failure surface is proved deterministically by
  `map-workflow-worker-ui.test.tsx`; the Playwright proof drives the *real* worker pool via the
  page module context (robust against the drawer's custom Select dropdown) and measures rAF
  responsiveness — the substantive "off-thread + responsive + attributed" Done-when criteria.

## Non-negotiables (mirror — full list in 15_…/"Agent Contract v2")

- Module ownership: Map Explorer owns rendering/layers/geometry/selection/export; Urban Analytics owns method validity/evidence/data fitness; Synapse IDE owns editor/terminal/AI. Never cross.
- No Tailwind in `src/centerpanel/`; style via `mapStyles`/`MAP_*` tokens (inline) or CSS Modules; no hard-coded hex.
- State = Zustand + `persist`; never persist heavy geometry; fine-grained selectors.
- CRS: never planar area/distance in EPSG:4326 — project (`proj4`) or block.
- `exactOptionalPropertyTypes` + `verbatimModuleSyntax` are ON (`import type`, conditional spreads).
- Map tests: `npx vitest run <path>` (NOT `test:analytics`, which excludes map). Urban: `npm run test:analytics`.
- Evidence is immutable (supersede/mark stale, never mutate). Demo/synthetic/unknown/blocked stay visible.
- Touch only files the prompt names; do not touch unrelated dirty worktree changes.
- Checkpoint branch per prompt; if typecheck/tests can't go green, revert + report — never weaken a test.
