# 15 - Agent Execution Prompts (v4, code-verified + Prompt 0 implemented)

Date: 2026-05-22
Purpose: a copy-paste prompt list that drives the entire Map Explorer Production GIS plan, one bounded slice per prompt, grounded in the real repository (verified 2026-05-22). Each prompt is a **standalone specification**: an agent should need nothing beyond the prompt + the docs it names.

Coverage: Prompt 0 (bootstrap, implemented) → 64, organised in 8 tracks (A Foundation, B Publication/Perf/Release, C Toolbox/Model, D Operator, E Layouts/3D, F Close-out, G Capability Depth, H Enterprise/Modern GIS). Heavy work is split into single-turn slices (24a/b/c, 25a/b, 32a/b). v4 adds Tracks G + H (20 prompts: formats, streaming, raster, temporal, labeling, advanced cartography, topology repair, join/relate, reprojection cache, vector tiles, command palette, undo/redo, plugin SDK, observability, offline package, AI guardrails, collaboration, terrain/CityJSON, view corridors/sections, raster/temporal/3D visual QA).

**Status of Prompt 0:** ✅ implemented and verified in this repo on 2026-05-22 — `src/services/map/contracts/gisContracts.ts` and `src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts` exist, `npm run typecheck` is clean, and the fixture self-test passes 8/8. The skeleton is proven in code, not just on paper. Prompts 1+ build on those files.

Run prompts in order. Paste one per agent turn. Verify Proof + Validate before the next.

---

## ⚠️ Cold-start protocol (anti-amnesia) — READ THIS

A fresh chat has **no memory** of this conversation. A single prompt below is **not self-sufficient on its own** — its standing context (Agent Contract, Repo Reality Notes, type contracts, fixtures, script matrix) lives once at the top of this file, and prompts use shorthand (`Read first: 00, 01`, `Contract: SourceHandle`, `fixture fcLarge`). So pasting only "Prompt N" into a new chat **will** cause amnesia problems.

**To run any prompt safely in a new chat, paste the BOOT BLOCK below first, then the prompt.** The boot block makes the agent re-derive all context from the repo before acting.

### BOOT BLOCK (copy verbatim, then paste the prompt under it)

```text
You are implementing ONE prompt from the Map Explorer Production GIS prompt ladder.
Before doing anything, READ these files in this repo and obey them (do not skip):

1. MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/15_AGENT_EXECUTION_PROMPTS.md
   — read its sections "Repo Reality Notes", "Script reality", "Shared Test
     Fixtures", "Canonical Type Contracts", and "Agent Contract v2" in full.
2. CLAUDE.md and AGENTS.md (repo conventions; these OVERRIDE defaults).
3. The docs my prompt names in "Read first" — they are files in
   MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/, e.g. `00` =
   00_TOKEN_FRIENDLY_CONTEXT.md, `01` = 01_CURRENT_STATE_AUDIT.md, `04` =
   04_IMPLEMENTATION_ROADMAP.md, etc.
4. If my prompt says "Contract: X", import X from
   src/services/map/contracts/gisContracts.ts (do not redefine it).
5. If my prompt names a fixture (fcPointsWGS84, fcMissingCrs, fcLarge, …), it is
   in src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts.

Then, BEFORE writing code:
- Check the "Sequencing Cheat Sheet" hard-dependencies for my prompt number.
  If a prerequisite artifact (service/file/type from an earlier prompt) does NOT
  exist in the repo yet, STOP and tell me which prerequisite is missing instead
  of guessing or stubbing it.
- Create a checkpoint branch `git switch -c gis/p<NN>-<slug>`.

Non-negotiables (full list in "Agent Contract v2"):
- Map Explorer owns rendering/layers/geometry; Urban Analytics owns evidence/
  method validity; never cross module boundaries.
- No Tailwind in src/centerpanel/ (CSS Modules / mapStyles tokens only); no
  hard-coded hex. State = Zustand + persist only; never persist heavy geometry.
- CRS: never planar area/distance in EPSG:4326 — project or block.
- exactOptionalPropertyTypes + verbatimModuleSyntax are ON (use `import type`,
  conditional spreads). Map tests run via `npx vitest run <path>` (NOT
  test:analytics, which excludes map). Touch ONLY files my prompt names; do NOT
  touch the dirty worktree (WelcomeModal.tsx, welcome-modal-redesign/).
- Deliver the prompt's stated "Visible effect + Proof"; finish with the prompt's
  "Validate" commands green. If you cannot make typecheck/tests pass within this
  slice, revert your changes and report the blocker — never weaken a test.

My prompt follows:
---
<PASTE PROMPT N HERE>
```

### Two ways to avoid amnesia
- **Token-light (recommended):** paste the BOOT BLOCK + the single prompt. The agent reads only what it needs.
- **Zero-effort:** paste this whole file once at the start of the chat, then say "do Prompt N". Heavier on tokens but fully self-contained.

### Why this works
Every prompt names its `Read first` docs, its `Contract:` types (now real files committed to the repo), its fixtures (committed), its `Depends on:`/dependency graph, its `Checkpoint`, and its `Validate` commands. The boot block forces the cold agent to load all of that from the repo — so it reconstructs the same context this conversation had. The contracts + fixtures being **committed code** (Prompt 0, verified) is itself an anti-amnesia measure: later prompts import stable shapes instead of re-inventing them per chat.

---

## Repo Reality Notes (read once — prevents false assumptions)

The code is **more mature than the plan docs imply**. Confirm before "creating" anything:

- **Canonical surface:** `src/centerpanel/components/map/` (production). `src/components/map/` is a second family (deck.gl layers `BuildingLayer.tsx`, `VoxelLayer.tsx`, `ChoroplethLayer.tsx`, Google Maps, `DrawingTools.tsx`, `ScaleBar.tsx`, `projections.ts`). Reuse from it; do not duplicate.
- **Orchestrator:** `src/centerpanel/components/MapExplorerModal.tsx` (~5,617 lines).
- **Store:** `src/stores/useMapExplorerStore.ts` (~1,432 lines, single file, `zustand` + `persist`). Slices not yet split.
- **Types already exist** in `src/centerpanel/components/map/mapTypes.ts`: `OverlayLayerConfig`, `LayerMetadata`, `LayerRegistryMetadata`, `LayerPersistenceMetadata` (`sourcePersistence`, `LayerRestoreState`), `LayerCrsSummary` (`status: known|missing|unknown`), `LayerPublicationReadiness`, `MapReproducibilityManifest`, `MapEvidenceArtifact` (full immutable evidence model with `state: stale|blocked|archived`), `MeasurementAssumptions` (`method:"geodesic-wgs84"`, `crsBasis:"EPSG:4326"`). **Extend these; do not reinvent.**
- **Metadata resolvers** live in `mapLayerMetadata.ts` (`normalizeLayerRegistryMetadata`, `withNormalizedLayerRegistryMetadata`, `resolveOverlayLayerCrsSummary`, …). New source/CRS logic must flow through these.
- **Design system already exists:** `mapTokens.ts` exports `MAP_COLORS` (incl. `caveat`, `error`, `success`, `focus`, `selectedSubtle`), `MAP_RADIUS/SPACING/TYPOGRAPHY/STROKES/Z_INDEX`, pre-composed `mapStyles` (inline `React.CSSProperties`), and `resolveMapPaintColor()` (resolves `var()`/`color-mix()` for MapLibre paint). `MapWorkspaceShell.tsx` is the existing shell. **Map UI uses inline style objects, not CSS Modules.** Consequence: `@media (prefers-reduced-motion)` cannot live in inline styles — motion must go through a CSS Module or a `usePrefersReducedMotion()` hook gating animation.
- **Services exist** in `src/services/map/`: `MapWorkflowService.ts` (~2,205), `MapScientificQA.ts` (~1,826) + `.worker.ts`, `MapEngineAdapter.ts` (~2,965), `MapDataImporter.ts`/`MapDataExporter.ts`/`MapExportService.ts`, `MapPersistenceService.ts`, `MapReportHandoffService.ts`, `MapReviewSessionService.ts`, `MapPublicationOutputBindingService.ts`, `MapToUrbanContextAdapter.ts`, `UrbanToMapMethodRequestAdapter.ts`, `ExternalServiceConnector.ts`/`ExternalServiceQueue.ts`, `SpatialStatsExecutionService.ts`, `MapCartographyAdvisor.ts`, `MapNLQueryBuilder.ts`, `MapCodeArtifactRequestService.ts`. **New** folders (do not exist yet): `sources/`, `crs/`, `actions/`, `bridge/`, `query/`, `processing/`, `model/`, `layout/`, `scene3d/`. `contracts/` now exists (Prompt 0).
- **Urban bridge files** in `src/features/urbanAnalytics/context/`: `mapContextAdapter.ts`, `mapEvidencePublisher.ts`, `dataFitness.ts`, `methodValidity.ts`, `studyAreaSelection.ts`, `evidenceArtifacts.ts`, `reproduciblePackageExport.ts`.
- **Deps available** (do not add new libs first): `proj4`, `geos-wasm`, `@duckdb/duckdb-wasm`, `flatgeobuf`, `pmtiles`, `geotiff`, `apache-arrow`, `parquet-wasm`, `@turf/turf`, `three` + `@react-three/fiber`/`drei`, `deck.gl`, `rbush`, `supercluster`, `h3-js`, `simple-statistics`, `gdal3.js`, `shpjs`, `@loaders.gl/*`.
- **TS config:** `verbatimModuleSyntax: true` (use `import type` / `export type`), `exactOptionalPropertyTypes: true` (use conditional spreads `...(x ? {k:x} : {})`), `noUnusedLocals/Parameters`. Tests use explicit `import { describe, it, expect } from "vitest"` though globals are on. `tsconfig.app.json` excludes `__tests__`, so fixtures are exercised by vitest (runtime), and runtime+ESLint catch their errors.

### Script reality (use exactly these)

| Need | Command |
| --- | --- |
| Types | `npm run typecheck` |
| Lint (errors only) | `npm run lint:errors` |
| No-Tailwind guard (centerpanel) | `npm run lint:no-tailwind-centerpanel` |
| Color regression (changed) | `npm run color:guard:changed` |
| **Map unit tests** (analytics script does NOT cover map) | `npx vitest run <path>` e.g. `npx vitest run src/services/map src/centerpanel/components/map src/stores` |
| Urban tests | `npm run test:analytics` |
| Full unit | `npm run test` |
| E2E (needs dev server) | `npm run test:e2e` · smoke `npm run test:e2e:smoke` · a11y `npm run test:e2e:a11y` |
| Bundle perf budgets | `npm run perf:budgets` |
| Release gate | `npm run validate:rc` (= typecheck + lint:errors + test + build + perf:budgets + test:e2e:ci) |

---

## Shared Test Fixtures — ✅ implemented in Prompt 0

`src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts` exports (verified loading, 8/8 self-test green):

| Export | Shape | Drives |
| --- | --- | --- |
| `fcPointsWGS84` (`FC_POINTS_WGS84_COUNT=25`) | 25 points, EPSG:4326, schema `id,name,value,date` | schema/table/selection/calculator |
| `fcPolygonsProjected` (`CrsTaggedCollection`, `declaredCrs:"EPSG:32635"`) | 10 polygons in UTM 35N | projected metric ops |
| `fcMissingCrs` (`declaredCrs:null`) | 10 polygons, no CRS | unknown-CRS gates |
| `fcInvalidGeometry` | bow-tie + null geometry | geometry QA |
| `fcLarge(n=100_000)` | deterministic point generator | perf/virtualization/worker |
| `csvPointsRaw` (`CSV_POINTS_MALFORMED_ROW_COUNT=3`) | CSV w/ lat/lon + 2 attrs + 3 malformed rows | import preflight |
| `externalServiceStub` | `ExternalServiceLayerMetadata`, offline WMS | external-service failure |
| `buildingFootprints` (6) | polygons w/ `height`+`floors` | extrusion/massing |

Tagged collections expose `{ declaredCrs, featureCollection }` so CRS is explicit (a bare GeoJSON FeatureCollection has nowhere to carry CRS). Reuse these everywhere; never re-invent inline data.

---

## Canonical Type Contracts — ✅ implemented in Prompt 0

`src/services/map/contracts/gisContracts.ts` (type-only, compiles under `typecheck`) exports the shared shapes. Import by name so independent agents converge:

`SourceStorageMode`, `SourceRestoreStatus`, `SourceFormat`, `SourceHandle` · `CrsExecutionKind`, `CrsRemedy`, `CrsPreflightResult` · `MapCommandKind`, `MapCommandStatus`, `MapCommandPreflight`, `MapCommandResult` · `MapToUrbanContextPayload`, `UrbanToMapMethodRequestPayload` · `ToolExecutionMode`, `ToolParameterType`, `ToolParameterDescriptor`, `ProcessingToolDescriptor`.

Each composes existing `mapTypes.ts` types (`LayerSourceKind`, `LayerCrsSummary`, `MapReproducibilityManifest`, `MapLayerRegistryLayerSummary`, …) rather than redefining them. When a prompt says "Contract: X", import `X` from `@/services/map/contracts/gisContracts`.

---

## Agent Contract v2 (applies to every prompt — obey silently)

**Boundaries & rules**
1. Ownership: Map Explorer owns rendering/viewport/sources/layer registry/selection/geometry/export; Urban Analytics owns method validity/data fitness/evidence/manifests/interpretation; Synapse IDE owns editor/terminal/AI. Never cross.
2. `src/centerpanel/`: **no Tailwind** (`lint:no-tailwind-centerpanel`); style via `mapStyles`/`MAP_*` tokens/`DESIGN_TOKENS` (inline) or CSS Modules — never hard-coded hex (`color:guard:changed`).
3. State = Zustand + `persist` only. No direct `localStorage`. Never persist heavy geometry (`OverlaySourceData`) — persist metadata/handles only. Fine-grained selectors.
4. CRS: never planar area/distance in EPSG:4326. Project via `proj4` or block. Reuse `MeasurementAssumptions` + `LayerCrsSummary`.
5. `exactOptionalPropertyTypes: true` — `prop?: T` ≠ `prop: T | undefined`. Use conditional spreads, as existing code does.
6. Truthful states: demo/sample/synthetic/unknown/stale/blocked/external-offline stay visible in UI + evidence + reports + exports. No "coming soon". No fake data labelled real.
7. Bridge: typed summaries + stable IDs only; no raw heavy geometry through generic UI/window events. Reuse `mapContextSummary.ts`.
8. Heavy work → workers / `geos-wasm` / `duckdb-wasm` / `deck.gl` GPU / `rbush`. Main thread only for tiny previews.
9. Every command: reachable UI surface + disabled-state reason + QA effect + test path.
10. Evidence immutable: supersede or mark `stale`/`blocked` via QA; never mutate in place.
11. **Scope:** touch only files the prompt names + direct deps. Do **not** touch the dirty worktree (`WelcomeModal.tsx`, `welcome-modal-redesign/`). Preserve behavior unless told to change it. Extend existing types/services; do not fork parallel ones.

**Checkpoint & rollback (every prompt)**
12. First action: ensure `git status` has no unrelated staged changes; create a checkpoint branch `git switch -c gis/p<NN>-<slug>`. Work in focused commits.
13. If `typecheck` or the prompt's required tests can't be made green within the slice, **stop, revert this prompt's changes** to the checkpoint, and report the blocker with the exact error — never leave the tree broken or weaken assertions to pass.
14. Never `--no-verify`; never delete/loosen a failing test to make it pass.

**Proof of visible effect (every prompt)**
15. Each prompt states a Proof. Prefer, in order: (a) a Playwright assertion + screenshot using a stable `data-testid`; (b) a unit/component test asserting rendered output/state; (c) a short screen-capture description + exact manual repro steps. Not "done" until the Proof is demonstrable.

**Reporting (every prompt)**
16. End each turn with: (a) files created/changed, (b) the visible effect + how to reproduce the Proof, (c) commands run + pass/fail output, (d) contracts introduced/changed, (e) anything deferred.

---

# Prompt 0 — Bootstrap: Contracts, Fixtures, Conventions ✅ DONE
**Status:** implemented + verified 2026-05-22. `gisContracts.ts` compiles under `npm run typecheck`; `gisFixtures.ts` + `gisFixtures.test.ts` pass 8/8 (`npx vitest run src/centerpanel/components/map/__tests__/gisFixtures.test.ts`). Later prompts import from these two files. No behavior change. If re-running from scratch: recreate both files from the "Shared Test Fixtures" + "Canonical Type Contracts" sections above and add the self-test asserting each fixture's count/shape.

---

# Track A — Foundation (Prompts 1–21)

## Prompt 1 — Baseline Inventory + Canonical Surface ADR
Read first: `00`, `01`.
**Goal:** freeze a trusted baseline and a written canonical-surface decision; zero runtime change.
**Context:** two map component families coexist (`src/centerpanel/components/map/` = production; `src/components/map/` = deck.gl/Google family). Before any refactor, the team needs an explicit, committed decision about which is canonical and what gets reused vs deprecated, so later prompts don't accidentally extend the wrong family.
**Build:**
1. Produce an inventory table for both families: `file → role → keep | migrate-logic | deprecate`. For `src/components/map/` call out reuse candidates explicitly: `layers/BuildingLayer.tsx`, `layers/VoxelLayer.tsx`, `ScaleBar.tsx`, `MapLegend.tsx`, `utils/projections.ts`, `DrawingTools.tsx`.
2. Write `docs/architecture/map-explorer-canonical-surface.md`: declare `src/centerpanel/components/map/` canonical; list migrate/deprecate items + rationale; note that 3D prompts (30–34) may reuse the deck.gl layers.
3. Link the ADR from `docs/architecture/README.md`.
4. Add smoke tests **only where missing**: modal mount/unmount, store layer add→remove, Urban handoff entry point fires.
**Anti-patterns:** do not refactor or move code in this prompt; do not modify `src/components/map/`; no new runtime types.
**Visible effect + Proof:** ADR file committed + inventory table; smoke tests green. Proof = `npx vitest run src/centerpanel/components/map` shows the new smoke tests passing; the ADR renders in the docs tree.
**Tests:** smoke test mounts the modal and asserts a layer can be added and removed from `useMapExplorerStore`.
**Done when:** canonical decision is documented; no behavior changed; refactor target list for Prompt 2 is explicit.
**Checkpoint:** `gis/p01-baseline`. **Validate:** `npm run typecheck`, `npm run lint:errors`, `npx vitest run src/centerpanel/components/map`.

## Prompt 2 — Decompose `MapExplorerModal.tsx` into controller hooks
Read first: `01` §Monolith, `04` Phase 1.
**Goal:** turn the ~5,617-line orchestrator into a thin shell plus bounded, tested hooks — with byte-for-byte identical behavior.
**Context:** `MapExplorerModal.tsx` mixes lifecycle, layer runtime, command handling, the Urban bridge, panel layout, reporting, and workflow control. Its size is the top maintainability risk; every later prompt touches it indirectly.
**Build:**
1. Create `src/centerpanel/components/map/controllers/` and extract, one at a time (commit per hook): `useMapExplorerLifecycle` (open/close, focus trap handoff, viewport persistence), `useMapLayerRuntime` (add/remove/reorder/opacity/visibility against the store), `useMapCommandHandlers` (toolbar/command wiring), `useMapUrbanBridgeController` (listen/emit Urban events), `useMapPanelLayout` (dock widths, panel open state), `useMapReportController` (report handoff triggers), `useMapWorkflowController` (workflow drawer state).
2. Keep all service logic in `src/services/map/`; hooks orchestrate, they don't compute geometry.
3. Reduce `MapExplorerModal.tsx` to composition + JSX. Target < 1,200 lines; report before/after counts.
4. Preserve every prop, event name, and `data-testid` so existing Playwright/unit tests pass unchanged.
**Anti-patterns:** no behavior change; don't rename existing testids; don't move presentational JSX into hooks; don't introduce Context (CLAUDE.md: Zustand only).
**Visible effect + Proof:** UI identical; modal file materially smaller; each hook unit-tested. Proof = Playwright map smoke unchanged + new hook unit tests green; report the line-count delta.
**Tests:** lifecycle (open→close restores focus), layer runtime (add/remove/reorder mutate the store correctly), command routing dispatches the right action.
**Done when:** modal is a coordinator; all existing map tests pass; each non-trivial hook has a test.
**Checkpoint:** `gis/p02-decompose`. **Validate:** `npm run typecheck`, `npm run lint:errors`, `npx vitest run src/centerpanel/components/map src/stores`, Playwright map smoke.

## Prompt 3 — Store slice boundaries + selectors
Read first: `01` §Map State, `07` Prompt 03.
**Goal:** split the monolithic store into documented slices with a clear persisted-vs-transient policy, preserving the public store API.
**Context:** `useMapExplorerStore.ts` already owns viewport, layers, AOI, selection, drawings, QA, evidence, review, temporal, layout, copilot. Growth is risky without slice discipline and an explicit persistence contract (heavy geometry must never be persisted).
**Build:**
1. Create `src/stores/mapExplorer/` and split into slices: `viewport`, `layers`, `sources`, `selection`, `aoi`, `qa`, `evidence`, `review`, `temporal`, `layout`, `bridge`. Compose them in `useMapExplorerStore.ts` so the existing exported hook + action names are unchanged.
2. For each slice, document in a header comment + `docs/architecture/map-explorer-state-and-actions.md` whether it is persisted or transient and why. `layers[].sourceData` (`OverlaySourceData`) and any heavy geometry are **transient**.
3. Add fine-grained selectors (e.g. `selectVisibleLayerSummaries`, `selectActiveAoi`) and use them; avoid whole-store subscriptions.
**Anti-patterns:** don't break the public API; don't persist geometry; don't create selectors that allocate new objects every call without memoization where it causes re-renders.
**Visible effect + Proof:** a persistence-policy table; a test proving heavy geometry is excluded from persisted state. Proof = serialize persisted state with a layer carrying `fcLarge(1000)` and assert `sourceData` is absent.
**Tests:** persisted snapshot omits `OverlaySourceData`; selector identity stable across unrelated updates.
**Done when:** slices documented; persisted vs transient explicit; public API intact.
**Checkpoint:** `gis/p03-slices`. **Validate:** `npm run typecheck`, `npx vitest run src/stores`.

## Prompt 4 — `MapSourceRegistry` V1 (source handles)
Read first: `04` Phase 2, `05` Data Sources. **Contract:** `SourceHandle`, `SourceStorageMode`, `SourceRestoreStatus`.
**Goal:** make every layer source-backed and restorable without persisting bytes in the UI store.
**Context:** today layer metadata is rich but source lifecycle is spread across importer/exporter/persistence. `LayerPersistenceMetadata` already has `sourcePersistence` + `LayerRestoreState` — the new registry must align with, not replace, those.
**Build:**
1. New `src/services/map/sources/MapSourceRegistry.ts`: CRUD over `SourceHandle`; map `storageMode`→`LayerPersistenceSource` and `restoreStatus`→`LayerRestoreState` so existing persistence stays consistent.
2. In `MapDataImporter.ts`, on import create a `SourceHandle` (id, kind, storageMode, crsSummary via `resolveOverlayLayerCrsSummary`, featureCount, sizeBytes, schemaSummary) **and** a layer record whose `metadata` references `sourceId`.
3. Store handles in the `sources` slice (Prompt 3), persisting handle metadata only — never `sourceData`.
4. On project restore, resolve handles → `restored | recoverable | unavailable` and surface that to the layer.
**Anti-patterns:** never store `OverlaySourceData` in a handle or persisted state; don't bypass `mapLayerMetadata` resolvers; don't invent a parallel restore enum.
**Visible effect + Proof:** the layer manager shows a **source badge** (kind + restore status). Proof = Playwright: import `fcPolygonsProjected`, reload the project, assert the badge reads `"restored"`; for an unavailable source assert `"unavailable"`.
**Tests (fixtures `fcPointsWGS84`, `fcLarge`, `externalServiceStub`):** handle created on import; `fcLarge` stored as `worker-table`/`metadata-only`, not `inline-small`; a missing handle yields `restoreStatus:"unavailable"`.
**Done when:** layers cite handles; large sources never persisted inline; unavailable state visible+tested.
**Checkpoint:** `gis/p04-source-registry`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/stores`.

## Prompt 5 — Import preflight + source profiling + support matrix
Read first: `05` Data Sources. **Contract:** `SourceHandle`, `SourceFormat`.
**Goal:** show source quality before commit, for every supported format.
**Context:** importers + metadata exist but there's no unified pre-commit preview. Analysts need to see CRS, counts, skipped rows, license, and worker readiness before adding a layer.
**Build:**
1. In `MapDataImporter.ts`, add a `profileSource(input): SourceHandle`-style profiler covering GeoJSON, CSV, Arrow/GeoParquet (`apache-arrow`/`parquet-wasm`), FlatGeobuf, PMTiles, WMS/WFS/XYZ, GeoTIFF (`geotiff`). Emit schema, CRS (`status: known|missing|unknown`), extent, feature count, size estimate, skipped-row count, license/attribution, and a `workerReady` flag.
2. Add an **import preview dialog** in `src/centerpanel/components/map/` rendering those fields with truthful caveats; commit only on confirm.
3. Write `docs/map-source-support-matrix.md` (format × supported/partial/unsupported × notes).
**Anti-patterns:** don't silently drop malformed rows; don't claim a CRS when none is declared; don't profile the whole of a huge file on the main thread (sample with a bound).
**Visible effect + Proof:** the preview dialog shows quality before commit. Proof = Playwright: load `csvPointsRaw`, assert the dialog shows `"3 skipped rows"` and a CRS-unknown caveat.
**Tests (fixtures `csvPointsRaw`, `fcMissingCrs`, empty FC, `fcLarge`):** skipped-row count = 3; `fcMissingCrs` → CRS status `missing`; size estimate present; `fcLarge` flagged worker-ready.
**Done when:** preflight covers the matrix; malformed/missing-CRS/empty/large cases tested.
**Checkpoint:** `gis/p05-profiling`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 6 — `MapProjectionService` + `ExecutionCrsPlanner`
Read first: `04` Phase 3, `06` CRS Gates. **Contract:** `CrsPreflightResult`, `CrsExecutionKind`.
**Goal:** a CRS execution contract backed by `proj4` that chooses a projected execution CRS for metric work.
**Context:** CRS metadata exists but operations don't yet declare an execution CRS. Metric correctness requires projecting before measuring.
**Build:**
1. New `src/services/map/crs/MapProjectionService.ts`: wrap `proj4`; provide `project(coords, from, to)`, `isProjected(crs)`, `localUtmFor(lng, lat)`, equal-area helpers.
2. New `src/services/map/crs/ExecutionCrsPlanner.ts`: given an AOI/extent, return `{ sourceCrs, displayCrs, executionCrs, executionKind }` — pick local UTM (or an equal-area CRS) for planar ops; `executionCrs:null` when source CRS is unknown.
3. Surface the chosen execution CRS in the workflow preview UI (a labeled chip).
**Anti-patterns:** don't hardcode a single UTM zone; don't fabricate an execution CRS when source CRS is unknown.
**Visible effect + Proof:** workflow preview shows the **execution CRS** label. Proof = unit test for the planner + a Playwright assertion on the chip text.
**Tests (fixtures `fcPolygonsProjected`, `fcMissingCrs`, `fcPointsWGS84`):** UTM zone correct for the Istanbul AOI (35N); `fcMissingCrs` → `executionCrs:null`; a planar op requires `isProjected(executionCrs)`.
**Done when:** every prospective op can name its execution CRS; planner covers known/unknown/geographic.
**Checkpoint:** `gis/p06-projection`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 7 — `CrsPreflight` gate (block false metrics)
Read first: `06` CRS Gates. **Contract:** `CrsPreflightResult`, `CrsRemedy`.
**Goal:** enforce CRS truth at every metric command boundary.
**Context:** the domain rule is non-negotiable: no planar area/distance in EPSG:4326 or unknown CRS. Geodesic display is allowed with a caveat (`MeasurementAssumptions` already models this).
**Build:**
1. New `src/services/map/crs/CrsPreflight.ts`: `preflight(op, layers, aoi): CrsPreflightResult` using `MapProjectionService` + `ExecutionCrsPlanner`.
2. Wire it into `MapWorkflowService.ts` (buffer/intersect/difference/union/area), measurement, and report scale. Honor Urban method `requiredCrs` (block on conflict).
3. Hard-block planar metric ops on geographic/unknown CRS with a `reason` + `remedy` (`declare-crs` | `reproject`); allow geodesic display with `caveats`.
**Anti-patterns:** don't allow a "best effort" planar computation in 4326; don't silently coerce; don't lose the remedy hint.
**Visible effect + Proof:** a metric op on geographic/unknown CRS shows a **blocked card** with reason + remedy button. Proof = Playwright: buffer on `fcMissingCrs` → assert blocked card text + a "Declare CRS"/"Reproject" action.
**Tests (fixtures `fcMissingCrs`, `fcPolygonsProjected`, `fcPointsWGS84`):** planar-on-4326 → `blocked:true`; projected → `ok:true, executionKind:"planar"`; geodesic distance on WGS84 → `ok:true, executionKind:"geodesic"` with a caveat.
**Done when:** invalid CRS ops are provably blocked; valid geodesic display allowed; Urban `requiredCrs` enforced.
**Checkpoint:** `gis/p07-crs-preflight`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 8 — CRS correction UI + local projection suggestion
Read first: `05` CRS, `04` Phase 3. **Contract:** `CrsPreflightResult`, `SourceHandle`.
**Goal:** let users resolve a missing CRS without ever faking certainty.
**Context:** unknown metadata must stay unknown; a user-declared CRS is a caveated assertion, not verified truth.
**Build:**
1. In the layer inspector CRS surface, add a **"Declare CRS"** control (searchable EPSG list + common UTM suggestions from `ExecutionCrsPlanner.localUtmFor`).
2. Declaring writes a CRS with provenance `source:"user-declared"` and a permanent caveat through the `mapLayerMetadata` resolvers; never set status to a "verified" state.
3. Suggest the local UTM/equal-area execution CRS for the layer's AOI.
**Anti-patterns:** don't upgrade a declared CRS to authoritative; don't remove the caveat downstream.
**Visible effect + Proof:** unknown-CRS layer shows **"Declare CRS"**; after declaring, the badge reads `"user-declared (caveat)"`. Proof = Playwright on `fcMissingCrs`: declare EPSG:32635, assert badge text + caveat persists.
**Tests (fixture `fcMissingCrs`):** declared CRS stays caveated; Urban `dataFitness` does not treat it as authoritative.
**Done when:** users can resolve CRS; declared CRS remains caveated end-to-end.
**Checkpoint:** `gis/p08-crs-ui`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/centerpanel/components/map`, `npm run test:analytics`.

## Prompt 9 — Map command lifecycle (`MapActionExecutor`)
Read first: `01` §QA gating. **Contract:** `MapCommandKind`, `MapCommandPreflight`, `MapCommandResult`.
**Goal:** one preview→apply→audit→revert lifecycle for high-impact actions.
**Context:** review timeline + proposal statuses exist but there's no general command object with consistent preflight/audit/revert.
**Build:**
1. New `src/services/map/actions/MapActionExecutor.ts` (`preview()`, `apply()`, `revert()`) and `MapActionHistoryService.ts` (history + revert tokens).
2. Route `layer.remove`, `layer.style`, `workflow.apply`, `report.handoff` through it. Each apply produces a `MapCommandResult` (with `MapReproducibilityManifest` where relevant) and logs a review-timeline entry via `MapReviewSessionService.ts`.
3. Surface a revert affordance where `revertable:true`; blocked commands surface `blockers`.
**Anti-patterns:** don't bypass the executor for routed commands; don't apply without preflight; don't claim revertable when it isn't.
**Visible effect + Proof:** high-impact actions create **review-timeline audit rows**; revert restores prior state. Proof = Playwright: remove a layer → audit row appears → revert restores the layer.
**Tests:** each routed command returns a `MapCommandResult` with manifest + review event; blocked path returns `blockers`; revert reverses store state.
**Done when:** routed actions are auditable; revert works where practical; blocked actions explain why.
**Checkpoint:** `gis/p09-command-lifecycle`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/stores`.

## Prompt 10 — Layer inspector workbench
Read first: `04` Phase 4.
**Goal:** make any layer fully inspectable without devtools, with unknown shown as unknown.
**Context:** `normalizeLayerRegistryMetadata` already computes provenance/CRS/schema/readiness; the inspector exposes it.
**Build:**
1. New `src/centerpanel/components/map/inspector/` styled with `mapStyles`/`MAP_*`. Tabs: Overview, Source/Provenance (incl. `SourceHandle`), Schema, CRS, QA, Style, Lineage, Report/Export.
2. Feed tabs from `normalizeLayerRegistryMetadata(layer)` + the source handle; render `unknown`/`missing` explicitly (no blanks).
3. Lineage tab links analysis layers to run/manifest/evidence IDs (`AnalysisResultMetadata`, `MapReproducibilityManifest`).
**Anti-patterns:** don't hide missing metadata; don't duplicate resolver logic in the component.
**Visible effect + Proof:** clicking a layer opens a **tabbed inspector**. Proof = Playwright: import `fcPointsWGS84`, open inspector, assert Schema lists `value` and CRS shows `EPSG:4326`; for `fcMissingCrs` assert CRS shows `missing`.
**Tests:** tab render for known + unknown metadata; lineage links present for an analysis layer.
**Done when:** analyst can judge readiness from the inspector alone.
**Checkpoint:** `gis/p10-inspector`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, `npx vitest run src/centerpanel/components/map`, inspector Playwright.

## Prompt 11 — Attribute table + selection sync
Read first: `04` Phase 4, `05` Selection.
**Goal:** queryable layers behave like GIS layers — virtualized table with two-way selection sync.
**Build:**
1. New `src/centerpanel/components/map/table/`: a virtualized table (sort, multi-column filter, row select, zoom/focus-to-selected) for `queryable` vector layers.
2. Sync selected feature IDs across table ↔ map popup ↔ Urban context summary (`mapContextSummary.ts`), via the `selection` slice.
3. Bound the DOM for large layers (windowed rows).
**Anti-patterns:** don't render all rows for `fcLarge`; don't store selection in component state (use the store).
**Visible effect + Proof:** selecting a row highlights + zooms the feature and updates the Urban summary. Proof = Playwright: load `fcPointsWGS84`, click a row, assert map selection count = 1 and the Urban summary reflects it.
**Tests (fixtures `fcPointsWGS84`, `fcLarge`):** sort/filter correctness; `fcLarge(100_000)` renders a bounded number of row nodes; selection round-trips table→map→Urban.
**Done when:** table+map+Urban selection stay synchronized; large layers virtualized.
**Checkpoint:** `gis/p11-table`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:analytics`.

## Prompt 12 — Style editor + legend contract
Read first: `05` Cartography.
**Goal:** professional cartography with legends that stay identical across map, panel, report, and export.
**Build:**
1. New `src/centerpanel/components/map/inspector/style/`; reuse `symbologyUtils.ts`, `heatmapStyleUtils.ts`, `symbolStyleUtils.ts`, and `resolveMapPaintColor` for MapLibre-safe colors. Support choropleth, categorical, graduated/proportional symbols, labels, opacity, outlines, explicit no-data styling.
2. On style change, update the on-map legend, the layer-panel legend, the report handoff metadata, and the export legend from one serialized legend spec.
3. Emit cartography warnings via `MapCartographyAdvisor.ts` (poor classification, missing uncertainty).
**Anti-patterns:** don't feed `var()`/`color-mix()` to MapLibre paint without `resolveMapPaintColor`; don't let report legend drift from the map.
**Visible effect + Proof:** changing a style updates the on-map legend **and** report legend identically; no-data class visible. Proof = test asserting the serialized report legend deep-equals the map legend spec after a style change.
**Tests (fixture `fcPolygonsProjected`):** style serialization round-trip; classification warning on skewed data; no-data class present in the legend.
**Done when:** legend parity holds; styles serialize.
**Checkpoint:** `gis/p12-style`. **Validate:** `npm run typecheck`, `npm run color:guard:changed`, `npx vitest run src/services/map src/centerpanel/components/map`.

## Prompt 13 — Workerized geometry operations
Read first: `04` Phase 5, `01` §main-thread. **Contract:** `MapCommandResult`, `CrsPreflightResult`.
**Goal:** move buffer/intersect/difference/union off the main thread with progress/cancel/failure.
**Build:**
1. In `MapWorkflowService.ts`, route medium/large inputs to a worker (`src/workers/pool/`) using `geos-wasm`; keep tiny previews bounded on the main thread.
2. Add progress reporting, cancellation, and explicit failure states surfaced in the UI.
3. Result layers carry CRS (= execution CRS from `CrsPreflight`), provenance, parameters, QA, and a `MapReproducibilityManifest`.
**Anti-patterns:** don't run large `@turf` ops on the main thread; don't drop the manifest; don't swallow worker errors.
**Visible effect + Proof:** a large buffer/overlay shows a **progress bar + cancel** and the UI stays responsive. Proof = Playwright: buffer `fcLarge`, assert the progress UI appears and the canvas still pans during the run.
**Tests (fixtures `fcLarge`, `fcPolygonsProjected`):** worker success returns a manifest; cancel aborts cleanly; induced failure surfaces an error; output CRS = execution CRS.
**Done when:** no main-thread stall on large ops; results fully attributed.
**Checkpoint:** `gis/p13-workerize`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/workers`.

## Prompt 14 — AOI + vertex editing upgrade
Read first: `04` Phase 5, `05` Editing. **Contract:** `MapCommandKind` (`aoi.edit`).
**Goal:** production-ready study areas and feature editing with validation + audit.
**Build:**
1. AOI creation from: current viewport, selected features, drawn polygon, geocoded place, and Urban study area (`studyAreaSelection.ts`).
2. Vertex editing with validation writing `DrawnGeometryValidation` (`valid|warning|blocked`); optional snapping to visible/queryable layers within a perf bound; reuse `DrawingTools.tsx` interaction patterns.
3. Route edits through the command lifecycle (`aoi.edit`) → preview + audit; surface CRS/topology caveats.
**Anti-patterns:** don't accept invalid AOI silently; don't snap unboundedly on huge layers.
**Visible effect + Proof:** AOI buildable **5 ways**; vertex edits preview + audit; invalid geometry shows a topology caveat. Proof = Playwright: build AOI from viewport, drag a vertex, assert an audit row + validation status chip.
**Tests (fixture `fcInvalidGeometry`):** AOI validity rules; edit produces an audit entry; self-intersection/null geometry → `status:"warning"|"blocked"`.
**Done when:** AOI is valid, reportable, accepted by Urban method requests; edits previewed/audited.
**Checkpoint:** `gis/p14-aoi-edit`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map src/services/map`.

## Prompt 15 — Selection tools + spatial query planner
Read first: `01` §Querying, `05` Query.
**Goal:** rectangle/lasso/attribute/spatial selection with a bounded, provenance-carrying query path.
**Build:**
1. New `src/services/map/query/MapQueryPlanner.ts`: plan attribute + spatial queries with an explicit, bounded execution scope; attach result provenance. Reuse `MapNLQueryBuilder.ts` and `src/components/map/SpatialFilter.tsx`.
2. Add rectangle/lasso/filter select tools; show a selection **count chip**; selected-feature operations (export, focus, send-to-AOI).
**Anti-patterns:** don't run unbounded scans; don't return results without provenance.
**Visible effect + Proof:** dragging a rectangle/lasso selects features and shows a count chip. Proof = Playwright on `fcPointsWGS84`: drag a box over 10 points, assert the count chip reads the expected number.
**Tests (fixtures `fcPointsWGS84`, `fcLarge`):** box-select count correctness; query scope is bounded for `fcLarge`; provenance attached.
**Done when:** spatial/attribute selection works with bounded scope + provenance.
**Checkpoint:** `gis/p15-query`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 16 — `MapUrbanBridgeService` V1
Read first: `03`, `04` Phase 6. **Contract:** `MapToUrbanContextPayload`, `UrbanToMapMethodRequestPayload`.
**Goal:** consolidate Map↔Urban into one versioned typed service; no raw geometry across the bridge.
**Build:**
1. New `src/services/map/bridge/MapUrbanBridgeService.ts` with Map→Urban and Urban→Map payload builders (stable IDs, `version:1`), built from `mapContextSummary.ts` — IDs + summaries only.
2. Make `MapToUrbanContextAdapter.ts` and `UrbanToMapMethodRequestAdapter.ts` compatibility adapters that delegate to the new service, so existing flows keep working through a single seam.
**Anti-patterns:** don't put `OverlaySourceData` in a payload; don't keep two competing bridge paths.
**Visible effect + Proof:** existing Urban flows still work, now through one service. Proof = contract tests both directions + an integration test that an Urban method request reaches Map via `MapUrbanBridgeService`.
**Tests:** payload round-trip; assert no `sourceData` key in any payload; legacy adapter output equals new-service output for a sample context.
**Done when:** one service owns bridge semantics; payloads contract-tested; legacy flows intact.
**Checkpoint:** `gis/p16-bridge`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, `npm run test:analytics`.

## Prompt 17 — Urban method compatibility rail
Read first: `03`, `04` Phase 6. **Contract:** `UrbanToMapMethodRequestPayload`, `CrsPreflightResult`.
**Goal:** a complete map-side UI for an active Urban method request.
**Build:**
1. New right-rail panel in `src/centerpanel/components/map/` reading the active `UrbanToMapMethodRequestPayload`: list compatible layers, missing fields, CRS status (via `CrsPreflight`), AOI requirement, QA blockers, and actions (focus layer, preview workflow).
2. Add a "Prepare in Map" action on the Urban method card (`src/features/urbanAnalytics/`) that emits the request through `MapUrbanBridgeService`.
**Anti-patterns:** don't hide missing prerequisites; don't enable preview when blocked.
**Visible effect + Proof:** "Prepare in Map" opens a rail showing ready/missing/blocked with focus + preview. Proof = Playwright: a polygon-requiring method against a point layer → rail shows blocked reason `"requires polygon"`.
**Tests:** ready/warning/blocked states; missing-field + CRS + AOI requirements render.
**Done when:** the method "Prepare in Map" path has a complete map-side UI.
**Checkpoint:** `gis/p17-method-rail`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:analytics`, rail Playwright.

## Prompt 18 — Map context → Urban recommendations
Read first: `03`. **Contract:** `MapToUrbanContextPayload`.
**Goal:** let map work drive Urban recommendations + data fitness, keeping unknown unknown.
**Build:**
1. Feed `MapToUrbanContextPayload` into `context/dataFitness.ts` + `context/methodValidity.ts` to update recommendations and fitness.
2. Attribute each hint ("based on: <layer/AOI>"); never upgrade demo/synthetic/unknown to production-ready.
**Anti-patterns:** don't mark demo/unknown as ready; don't couple Urban components directly to map components.
**Visible effect + Proof:** changing the active layer/AOI updates Urban recommendations with attribution. Proof = `npm run test:analytics` asserting the recommendation set changes on context change and demo/unknown never reads production-ready.
**Tests (fixtures `fcMissingCrs`, a demo layer):** fitness never upgrades demo/unknown; attribution present on hints.
**Done when:** Urban panel responds to map context; truthfulness preserved.
**Checkpoint:** `gis/p18-recommendations`. **Validate:** `npm run typecheck`, `npm run test:analytics`.

## Prompt 19 — Evidence publication hardening
Read first: `06` Evidence Gates.
**Goal:** map-derived evidence is immutable, fully referenced, and goes stale (never mutates) when its source changes.
**Build:**
1. In `context/mapEvidencePublisher.ts` + `MapPublicationOutputBindingService.ts` + `mapEvidenceArtifacts.ts`, ensure publication creates an immutable `MapEvidenceArtifact` with layer/source/run/manifest references, runtime mode, CRS, QA, and demo/synthetic status.
2. When a source layer changes, create a **superseding** artifact and mark the prior `stale` (or `blocked` via QA) — never edit in place. Propagate layer QA → evidence QA.
**Anti-patterns:** don't mutate an existing artifact; don't drop demo/synthetic labels.
**Visible effect + Proof:** publishing adds an **evidence card** carrying all references; editing the source flips it to **"stale"**. Proof = Playwright: publish, edit the source layer, assert the card state reads `"stale"` and a new artifact exists.
**Tests (fixtures demo layer + `fcMissingCrs`):** demo/synthetic/unknown labelled; artifact immutable; stale path creates a superseding artifact.
**Done when:** evidence immutable; stale/blocked visible; references complete.
**Checkpoint:** `gis/p19-evidence`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:analytics`.

## Prompt 20 — Review timeline + action export
Read first: `04` Phase 7.
**Goal:** a session can be fully reconstructed from an exported audit.
**Build:**
1. Expand `MapReviewSessionService.ts` events to cover import, source-restore, style, CRS, analysis, report, export, and Urban handoff.
2. Add JSON + Markdown export (in `MapReviewTimelinePanel.tsx`) referencing source/layer/run/evidence IDs.
**Anti-patterns:** don't omit entity IDs; don't reorder events.
**Visible effect + Proof:** an **"Export Review"** button produces JSON + Markdown reconstructing the session. Proof = test asserting the exported JSON contains the expected ordered event sequence + IDs.
**Tests:** event ordering; export includes source/layer/run/evidence IDs; Markdown renders rows.
**Done when:** an analyst can reconstruct the session from the export.
**Checkpoint:** `gis/p20-review-export`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 21 — External service production path
Read first: `05` External services. **Contract:** `SourceHandle` (`external-service`).
**Goal:** environment-dependent services that fail visibly and never claim false readiness.
**Build:**
1. New `src/services/map/sources/MapConnectionRegistry.ts`; reuse `ExternalServiceConnector.ts`/`ExternalServiceQueue.ts`. Provider registry + health checks for WMS/WFS/XYZ/OSM/Overpass; store `dependencyStatus`/`credentialMode`/`corsMode` (reuse `ExternalServiceLayerMetadata`); cache/restore metadata. No secrets in layer metadata.
2. Render specific failure states in `MapCanvas.tsx` (CORS/auth/rate-limit/offline) instead of blank tiles; propagate the caveat to publication readiness, reports, and evidence.
**Anti-patterns:** don't store credentials in layer metadata; don't render a blank tile on failure.
**Visible effect + Proof:** a broken external URL shows a **specific actionable failure**. Proof = Playwright with `externalServiceStub` → assert the offline-reason text renders and a caveat appears on the layer.
**Tests (fixture `externalServiceStub`):** offline/stale/unknown statuses surface; caveat reaches `publicationReadiness`.
**Done when:** external failures visible+actionable; caveats propagate.
**Checkpoint:** `gis/p21-external`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

---

# Track B — Publication, Performance, Release (Prompts 22–25b)

## Prompt 22 — Publication figure composer (V1)
Read first: `04` Phase 7.
**Goal:** reproducible, gate-checked publication figures.
**Build:**
1. New `src/services/map/layout/MapLayoutComposer.ts` + composer UI `src/centerpanel/components/map/layout/`; reuse `MapExportService.ts`, `ScaleBar.tsx`, `MapLegend.tsx`.
2. A figure includes title, legend, scale bar, north arrow, attribution, CRS, QA caveats, timestamp, visible-layer list — the same metadata used for report handoff + export.
3. Snapshot preflight blocks export when legend/CRS/attribution is missing, naming the gap.
**Anti-patterns:** don't export a figure missing required cartographic metadata; don't diverge report vs export metadata.
**Visible effect + Proof:** a **"Compose Figure"** flow renders an export-ready figure; missing attribution **blocks export with a named reason**. Proof = Playwright: compose with a missing-attribution layer → assert the blocked reason.
**Tests:** figure metadata complete when gates pass; blocked output names the gap.
**Done when:** figures are reproducible and gate-checked.
**Checkpoint:** `gis/p22-composer`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, manual PNG/SVG check.

## Prompt 23 — Performance budgets + render diagnostics
Read first: `06` Performance Budgets, `04` Phase 8.
**Goal:** truthful performance limits with live diagnostics and a bounded over-budget mode.
**Build:**
1. Add a diagnostics panel + perf instrumentation across map services; reuse `LayerRenderBudgetMetadata`. Track layer/feature counts, worker transfer size, render time, export time.
2. Define budgets (from `06`); over-budget imports show a truthful warning and switch to a bounded/preview mode (never silently drop data).
3. Add large-data stress tests.
**Anti-patterns:** don't silently downsample without telling the user; don't hide over-budget state.
**Visible effect + Proof:** a **diagnostics panel** shows live stats; over-budget import warns. Proof = Playwright: load `fcLarge`, assert diagnostics numbers + a bounded-mode banner.
**Tests (fixture `fcLarge`):** stress within documented budgets; over-budget path honest.
**Done when:** budgets enforced + visible; bounded mode honest.
**Checkpoint:** `gis/p23-perf`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run perf:budgets`.

## Prompt 24 — Processing toolbox (split 24a / 24b / 24c)
Read first: `08`, `04` Phase 9. **Contract:** `ProcessingToolDescriptor`, `ToolExecutionMode`.
This is intentionally three single-turn slices — do not attempt in one turn.

### Prompt 24a — Registry + searchable UI shell + 3 reference tools
**Build:** new `src/services/map/processing/MapProcessingRegistry.ts` (register/lookup/search `ProcessingToolDescriptor`); toolbox UI `src/centerpanel/components/map/processing/` with searchable list + a parameter-form renderer driven by `ToolParameterDescriptor`. Wire **3 reference tools** end-to-end through the command lifecycle (P9) + CRS preflight (P7): buffer, centroid, attribute-filter — each with preflight/preview/apply/logs/manifest.
**Anti-patterns:** don't ship a tool marked `implemented:true` that lacks a manifest; don't bypass the command lifecycle.
**Proof:** Playwright — search "buffer", run it on `fcPolygonsProjected`, assert an output layer + manifest appear. **Tests:** registry search returns the right descriptors; each reference tool yields a `MapCommandResult` with a manifest. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`. **Checkpoint:** `gis/p24a-toolbox-core`.

### Prompt 24b — Wrap existing services as tools (reach ≥12 implemented)
**Build:** wrap `MapWorkflowService` ops (intersect/difference/union/clip), `SpatialStatsExecutionService` outputs, plus dissolve, simplify, reproject, spatial-join as `ProcessingToolDescriptor`s. Each: real preflight + CRS gate + logs + manifest. Tools not yet wired stay `implemented:false` (shown but disabled with a reason).
**Anti-patterns:** don't fake outputs; don't mark unimplemented tools as implemented.
**Proof:** Playwright — toolbox lists ≥12 `implemented:true` tools; run spatial-join on `fcPointsWGS84`+`fcPolygonsProjected`, assert manifest. **Tests:** ≥12 implemented; spatial-join output provenance correct. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`. **Checkpoint:** `gis/p24b-toolbox-tools`.

### Prompt 24c — Toolbox premium styling + blocked/caveat states
**Build:** apply `mapStyles` + shared primitives (P36): parameter forms, runtime-mode chip, CRS-required chip, blocked reasons shown **before** run, progress bar, logs panel.
**Anti-patterns:** no hard-coded colors; don't hide blocked reasons until after a failed run.
**Proof:** Playwright screenshot of the toolbox + a blocked tool showing its reason pre-run. **Tests:** blocked-state visible pre-run. **Validate:** `npm run lint:no-tailwind-centerpanel`, toolbox Playwright. **Checkpoint:** `gis/p24c-toolbox-design`.

## Prompt 25 — Model builder + batch (split 25a / 25b)
Read first: `08`, `04` Phase 9.

### Prompt 25a — Model graph + deterministic run
**Build:** new `src/services/map/model/MapModelBuilder.ts` + UI `src/centerpanel/components/map/modelBuilder/`. Step model: source inputs → tool steps (via the P24 registry) → intermediate/final outputs, with parameter binding. Save/rerun.
**Proof:** Playwright — chain buffer→intersect, save, rerun, assert identical output. **Tests:** serialize/rerun determinism (same inputs → same manifest hash). **Validate:** `npm run typecheck`, `npx vitest run src/services/map`. **Checkpoint:** `gis/p25a-model-core`.

### Prompt 25b — Batch + IDE code artifact + Urban publish
**Build:** batch execution across AOIs/layers where safe; generate a Synapse IDE code artifact from the model manifest via `MapCodeArtifactRequestService.ts`; publish the model result to Urban as evidence.
**Proof:** Playwright — export model → assert an IDE artifact is created and an Urban evidence card appears. **Tests:** artifact generated; Urban evidence references the model manifest. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, `npm run test:analytics`. **Checkpoint:** `gis/p25b-model-batch`.

---

# Track C — Pro GIS Operator Surfaces (Prompts 26–28)

## Prompt 26 — Catalog + connection manager
Read first: `08`, `10`. **Contract:** `SourceHandle`; reuse `MapConnectionRegistry` (P21).
**Goal:** the project/catalog browser expected in desktop GIS.
**Build:**
1. New `src/centerpanel/components/map/catalog/`: a catalog of project sources, imported files, external services, worker/DuckDB sources, generated outputs, and demo packs (`demoDataPacks.ts`).
2. Connection records for URL/service sources (no secrets); source health + restore state; catalog item → layer creation.
**Anti-patterns:** don't store secrets; don't hide broken sources.
**Visible effect + Proof:** a **Catalog panel** with health badges; browse/reconnect/repair/add → layer. Proof = Playwright: add a demo pack from the catalog → a layer appears with a source badge.
**Tests:** broken/unavailable sources actionable; demo pack labelled.
**Done when:** users browse, reconnect, repair, and add sources from a catalog.
**Checkpoint:** `gis/p26-catalog`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, `npx vitest run src/centerpanel/components/map`.

## Prompt 27 — Professional contents tree
Read first: `08`, `04` Phase 9.
**Goal:** GIS contents-pane depth (groups, scale ranges, filters, repair).
**Build:**
1. New `src/centerpanel/components/map/contents/`; reuse `MapLayerManager.tsx` logic. Layer groups, scale ranges, definition filters, duplicate-layer, source-repair, properties; visibility/selectability/editability indicators; QA warnings; active-layer accent (`mapStyles.sidePanelRowActive`).
**Anti-patterns:** don't lose provenance on duplicate; don't drop QA warnings in the tree.
**Visible effect + Proof:** a **Contents tree** with groups + per-layer scale-range/filter + inline QA warnings; reorder/group persists. Proof = Playwright: group two layers, reload, assert grouping persisted.
**Tests:** scale-range gating hides/shows by zoom; definition filter narrows features; duplicate keeps provenance.
**Done when:** layer state inspectable + editable via the tree.
**Checkpoint:** `gis/p27-contents`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map src/stores`.

## Prompt 28 — Field statistics + safe field calculator
Read first: `04` Phase 9.
**Goal:** first-class attribute workflows with a **sandboxed** calculator.
**Build:**
1. Field profiles (numeric/categorical/temporal) in `src/centerpanel/components/map/table/`: distribution, null counts, min/max/mean.
2. A field calculator with an allowlisted expression evaluator (operators + a fixed function set; **no `eval`/`Function`/property-access escapes**) producing derived fields/layers with provenance + QA.
3. Feed field availability/missingness to `context/dataFitness.ts`.
**Anti-patterns:** never use `eval`/`new Function`; don't allow access to globals/prototypes; don't drop provenance on derived outputs.
**Visible effect + Proof:** a field-profile drawer + a calculator that creates a **derived field/layer** with a provenance badge. Proof = Playwright on `fcPointsWGS84`: compute `value * 2`, assert a new field appears with a provenance badge.
**Tests (fixture `fcPointsWGS84`):** profile stats correct; calculator rejects `eval(...)`, `require(...)`, and `constructor` escapes; derived output preserves provenance + QA.
**Done when:** profiles + safe calculator work; fitness updated.
**Checkpoint:** `gis/p28-fieldcalc`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:analytics`.

---

# Track D — Layouts + 3D / Digital Twin (Prompts 29–34)

## Prompt 29 — Layout composer V2 + map book
Read first: `08`, `04` Phase 9.
**Goal:** full cartographic layouts (extends P22) with restore + multi-page.
**Build:** extend `MapLayoutComposer.ts` + layout UI: map frame, legend, scale bar, north arrow, CRS, attribution, QA caveats, dynamic text, inset map, chart/table slots; export presets; figure restore metadata; multi-page map book.
**Anti-patterns:** don't lose layout restore metadata; don't bake non-restorable figures.
**Visible effect + Proof:** a **layout designer** producing print-ready figures + restorable state + multi-page book. Proof = Playwright: compose a 2-page book, export, assert both pages present.
**Tests:** layout serialize/restore; export preset honored.
**Done when:** published figures reproducible + provenance-complete.
**Checkpoint:** `gis/p29-layout-v2`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, manual PDF check.

## Prompt 30 — 3D scene runtime + 2.5D extrusion
Read first: `09`, `04` Phase 10.
**Goal:** the 3D foundation — extrude footprints, sync 2D/3D selection, inspect buildings.
**Build:**
1. New `src/services/map/scene3d/Map3DSceneController.ts` + a 3D store slice + scene UI `src/centerpanel/components/map/scene3d/`. Reuse `src/components/map/layers/BuildingLayer.tsx` (deck.gl) and/or `three`+`@react-three/fiber`.
2. 2.5D extrusion from footprint + height/floor field; 2D↔3D selection sync; building inspector; runtime mode + QA metadata (reuse `MapVoxCitySyncMetadata`).
**Anti-patterns:** don't present demo geometry as real; don't extrude without a height source (caveat instead).
**Visible effect + Proof:** a building layer **extrudes to 2.5D/3D** with synced selection. Proof = Playwright with `buildingFootprints`: extrude, assert a non-blank 3D canvas + selection sync between 2D and 3D.
**Tests (fixture `buildingFootprints`):** extrusion uses the `height` field; missing height → caveat; runtime mode recorded.
**Done when:** building layers explore in 2.5D/3D and publish with correct caveats.
**Checkpoint:** `gis/p30-3d-runtime`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/centerpanel/components/map`, canvas-nonblank Playwright.

## Prompt 31 — Block/parcel model + zoning rule engine
Read first: `09`, `04` Phase 10. **Contract:** `CrsPreflightResult`.
**Goal:** real urban block primitives with CRS-safe metrics.
**Build:** block/parcel data model in `Map3DSceneController.ts`; zoning rule table + editor; assign rules to parcels/blocks; compute existing FAR, coverage, block/parcel area, basic capacity — **projected CRS only** (via `CrsPreflight`).
**Anti-patterns:** never compute FAR/area in geographic CRS; don't hardcode rules.
**Visible effect + Proof:** a **zoning rules editor**; assigning a rule shows computed FAR/coverage/capacity + the execution CRS. Proof = Playwright: assign a rule to a parcel, assert metrics + a CRS label.
**Tests (fixtures `buildingFootprints`, `fcPolygonsProjected`):** FAR/coverage math correct; geographic CRS blocks metric compute.
**Done when:** blocks/parcels/zoning are first-class map + Urban entities.
**Checkpoint:** `gis/p31-zoning`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 32 — Zoning envelope + massing generator (split 32a / 32b)
Read first: `09`, `04` Phase 10.

### Prompt 32a — Buildable area + envelope (deterministic, CRS-gated)
**Build:** compute setbacks in projected CRS → buildable area → zoning envelope geometry; deterministic output. **Proof:** test — a known parcel + setbacks yields the expected envelope area within an epsilon. **Tests:** deterministic geometry; geographic CRS blocked. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`. **Checkpoint:** `gis/p32a-envelope`.

### Prompt 32b — Massing alternatives + scenario manager
**Build:** generate massing under FAR/height/coverage constraints; scenario manager with baseline/proposed comparison (reuse `MapScenarioComparisonEvidenceMetadata`). **Proof:** Playwright — generate 2 scenarios, assert side-by-side metrics. **Tests:** ≥2 scenarios reproducible (same constraints → same metrics). **Validate:** `npm run typecheck`, `npx vitest run src/services/map`. **Checkpoint:** `gis/p32b-massing`.

## Prompt 33 — Sunlight/shadow + 3D scenario evidence
Read first: `09`, `04` Phase 10.
**Goal:** evidence-ready 3D scenario analysis. (Heavy — keep the simulation scope tight; reuse `three` shadow maps + a solar-position helper, don't build a physics engine.)
**Build:**
1. Integrate sunlight/shadow over generated/existing 3D geometry using `three` shadow maps + computed solar position; add a temporal timeline + scenario-comparison metrics.
2. 3D report/evidence publication carrying assumptions (solar model, date/time, latitude), CRS, vertical datum, runtime mode, QA. CityJSON refs where available (`@loaders.gl/3d-tiles`).
**Anti-patterns:** don't present demo geometry as real; don't omit solar/vertical assumptions from evidence.
**Visible effect + Proof:** a **sun/shadow timeline** animates shadows. Proof = Playwright: scrub the timeline, assert shadow geometry changes and an evidence card lists the assumptions.
**Tests:** solar-position assumptions recorded; evidence carries vertical datum + QA; demo geometry never marked real.
**Done when:** 3D scenarios analyze, report, and publish with assumptions + QA.
**Checkpoint:** `gis/p33-sunshadow`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, `npm run test:analytics`.

## Prompt 34 — 3D block + scenario interaction design
Read first: `12`, `09`. (Depends on P36 primitives.)
**Goal:** make 3D blocks/zoning/massing/sun-shadow feel like a professional planning tool.
**Build:** a 3D mode strip (inspect/select/measure/edit-height/compare/sun-shadow/section/camera-bookmark); building/block/parcel, zoning, massing, sun/shadow panels via shared primitives; scenario-comparison strip + timeline. Keep selected geometry visible; compact overlays.
**Anti-patterns:** controls must not occlude selected geometry; generated massing must be visually distinct from real geometry.
**Visible effect + Proof:** 3D workflows look like a planning tool. Proof = Playwright screenshots of each 3D mode; assert selected geometry is not occluded and reduced-motion is respected.
**Tests:** controls don't obscure selection; reduced-motion respected.
**Done when:** vertical assumptions/source/terrain/CRS/QA visible; generated vs real distinct.
**Checkpoint:** `gis/p34-3d-design`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, 3D Playwright + canvas-nonblank.

---

# Track E — Premium Design System + Motion + Visual QA (Prompts 35–40)

> Start 35–37 right after Prompt 2; apply the rest as each surface lands. Map UI uses **inline `mapStyles`** — see the motion caveat in Repo Reality Notes.

## Prompt 35 — Extend GIS token layer (status / density / motion)
Read first: `11`.
**Goal:** complete the alias layer — **extend `mapTokens.ts`, do not recreate.**
**Build:**
1. In `mapTokens.ts`, add explicit status tokens for ready/caveat/unknown/demo/synthetic/external-offline/stale/blocked/running, mapped to `MAP_COLORS` + `DESIGN_TOKENS`; add density presets (compact/default).
2. New `src/centerpanel/components/map/design/motion.module.css` (CSS Module — inline styles can't hold `@media`) + a `usePrefersReducedMotion()` hook gating animation.
**Anti-patterns:** don't hardcode hex; don't try to put media queries in inline styles.
**Visible effect + Proof:** a token/status demo renders every status chip; reduced-motion toggle disables motion. Proof = Playwright: assert each status chip color + that the reduced-motion class is applied when emulated.
**Tests:** status→token mapping snapshot; the hook returns `true` under emulated `prefers-reduced-motion`.
**Done when:** new UI can style via tokens; reduced-motion vars exist before animation work.
**Checkpoint:** `gis/p35-tokens`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, `npm run color:guard:changed`.

## Prompt 36 — Workbench shell hardening + shared primitives
Read first: `11`, `13`.
**Goal:** a pro workbench shell — **extend `MapWorkspaceShell.tsx`, do not replace.**
**Build:**
1. Extend the shell: activity rail, top command bar, left dock, center canvas, right inspector dock, bottom panel, resizers, status bar; thin active accent (reuse the `mapStyles.sidePanelRowActive` inset accent). Keep map/scene full-bleed and dominant.
2. New `src/centerpanel/components/map/ui/` primitives: icon button, status chip, tabs, section header, property grid, toolbar, empty state, progress bar, tooltip. Icon-only controls get accessible names; critical state never color/icon-only; add a disabled-state-reason pattern.
**Anti-patterns:** don't shrink the map; don't ship icon buttons without accessible names.
**Visible effect + Proof:** Map Explorer reads like VS Code beside Synapse IDE; ≥3 panels adopt primitives. Proof = Playwright screenshot of the shell; assert a disabled control shows its reason on hover.
**Tests:** primitive accessible-name present; shell keyboard reachability.
**Done when:** shell dense/resizable/keyboard-reachable; primitives adopted.
**Checkpoint:** `gis/p36-shell-primitives`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, shell Playwright.

## Prompt 37 — Catalog/contents/inspector visual pass
Read first: `11`, `13`.
**Goal:** apply primitives + status tokens to the main operator panels; robust to long strings.
**Build:** style `catalog/`, `contents/`, `inspector/` with primitives + status tokens; health/restore/demo/external/blocked rows; ellipsis-truncate long layer/CRS/field names (like `mapStyles.sidePanelMetricLabel`); harmonize Urban evidence states.
**Anti-patterns:** no overlap/clipping of critical labels; don't convey state by color alone.
**Visible effect + Proof:** readiness understandable without devtools; long strings robust. Proof = Playwright screenshots at desktop + short viewport; assert no overlap/clipping of critical labels.
**Tests:** long-string layout snapshot; status visibility.
**Done when:** operator panels share the visual language and survive long content.
**Checkpoint:** `gis/p37-operator-visual`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, Playwright screenshots.

## Prompt 38 — Table/toolbox/layout visual pass
Read first: `11`, `13`.
**Goal:** unify the heavy work surfaces.
**Build:** style `table/`, `processing/`, `layout/`: sticky headers, virtualized rows, selected-row sync, field-type chips, null/unknown states, field-profile drawer; toolbox parameter forms + runtime-mode/CRS chips + blocked reasons + progress + logs; layout cartographic elements + export preflight.
**Anti-patterns:** blocked/caveat states must be visible before execute/export.
**Visible effect + Proof:** surfaces look like production GIS; blocked/caveat visible pre-action. Proof = Playwright screenshots; assert a blocked tool shows its reason before run.
**Tests:** virtualization bounded DOM; blocked-state visible.
**Done when:** attribute/processing/layout surfaces production-grade.
**Checkpoint:** `gis/p38-worksurface-visual`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, Playwright screenshots.

## Prompt 39 — Motion system + reduced-motion gate
Read first: `12`. (Uses the P35 CSS Module + hook.)
**Goal:** subtle, purposeful motion that is fully reduced-motion safe and never shifts layout.
**Build:** in `design/motion.module.css`, define fade-in, panel-in, accent-grow, status-flash, feature-pulse, progress, layer-fade and apply via class names (not inline) to hover/focus/selection/tab/dock/progress/preview/feature-focus/Urban-handoff. **Every** animated class has a `@media (prefers-reduced-motion: reduce)` fallback. No shimmer/large-glow/infinite-pulse/icon-scaling/animated counters; no dimension change on hover/focus/selection.
**Anti-patterns:** no animation that implies false location/metric change; no layout shift.
**Visible effect + Proof:** fast, quiet, purposeful interactions; reduced-motion disables non-essential animation. Proof = Playwright reduced-motion pass: assert animations disabled + no dimension change on hover.
**Tests:** a lint/grep test asserts each animated class has a reduced-motion rule; no-layout-shift snapshot.
**Done when:** motion safe, quiet, purposeful; no layout shift.
**Checkpoint:** `gis/p39-motion`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, reduced-motion Playwright.

## Prompt 40 — Visual QA + design release gate
Read first: `06` Design Gates, `13`.
**Goal:** prevent professional-UI regressions in CI.
**Build:** Playwright screenshot coverage for shell, catalog, contents, inspector, table, toolbox, Urban rail, layout composer, 2.5D extrusion, 3D scenario comparison, reduced-motion. Canvas-nonblank checks for 2D + 3D. Small/short-viewport overlap + clipped-text checks. A manual review checklist (desktop/tablet/high-contrast/reduced-motion).
**Anti-patterns:** don't allow blank-canvas or hidden-caveat regressions to ship.
**Visible effect + Proof:** CI **catches** blank canvas, hidden caveats, overlap, clipped labels, reduced-motion regressions. Proof = the suite fails on a deliberately broken fixture and passes on the real UI.
**Tests:** the screenshot suite itself; canvas pixel-nonblank assertions.
**Done when:** design QA is part of the release gate.
**Checkpoint:** `gis/p40-visual-qa`. **Validate:** `npm run typecheck`, full Map Explorer Playwright suite.

---

# Track G — Capability Depth: Data, Cartography, Editing, Query (Prompts 43–52)

> These slot into the dependency graph after their foundation prerequisites (noted per prompt). They are real backlog items (`05`) absent from 1–42, not padding.

## Prompt 43 — GeoPackage / Shapefile / KML / GPX import hardening
Read first: `05` Data Sources. Depends on: 4, 5. **Contract:** `SourceHandle`, `SourceFormat`.
**Goal:** make the heavier file formats first-class through the same preflight + handle path.
**Context:** deps already include `@loaders.gl/geopackage`, `@loaders.gl/shapefile`, `shpjs`, and `gdal3.js`, but they are not uniformly wired into `MapDataImporter` with profiling + handles.
**Build:**
1. In `MapDataImporter.ts`, add loaders for GeoPackage (multi-layer → layer picker), Shapefile (`.shp`+`.dbf`+`.prj` set, or `.zip` via `shpjs`), KML/KMZ, GPX. Use `gdal3.js` as the fallback for formats loaders.gl can't handle.
2. Read the `.prj`/embedded CRS into `LayerCrsSummary` (status `known`); missing `.prj` → `missing` (caveat, not guessed).
3. Each import emits a `SourceHandle` + preview (Prompt 5 dialog) including per-layer feature counts for multi-layer GeoPackage.
**Anti-patterns:** don't guess CRS from coordinates; don't silently pick one GeoPackage layer; don't load a multi-hundred-MB shapefile on the main thread (chunk/worker).
**Visible effect + Proof:** importing a GeoPackage opens a **layer picker**; a shapefile with a `.prj` shows its CRS as `known`. Proof = Playwright with a small GeoPackage fixture: assert the picker lists ≥2 layers and importing one creates a layer + handle.
**Tests:** multi-layer GeoPackage → N handles; shapefile with `.prj` → CRS known; shapefile without `.prj` → CRS missing caveat.
**Done when:** all four formats import with profiling + handle + truthful CRS.
**Checkpoint:** `gis/p43-formats`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 44 — Large vector streaming + extent-based render/query
Read first: `05` Large vector streaming. Depends on: 4, 13. **Contract:** `SourceHandle` (`worker-table`/`duckdb-table`).
**Goal:** render and query very large vector sources by viewport extent instead of loading everything.
**Context:** `flatgeobuf` (spatial-indexed streaming) and `pmtiles` deps exist; `duckdb-wasm` + `rbush` are available for extent queries.
**Build:**
1. For FlatGeobuf, use its bbox streaming API to fetch only features intersecting the current viewport; for PMTiles, render tiles by zoom/extent.
2. Back extent queries with `rbush` (in-worker) or a `duckdb-table` source; debounce on pan/zoom.
3. Surface a "streaming by extent" badge + feature-in-view count; never claim a full in-memory feature count when streaming.
**Anti-patterns:** don't load the full FlatGeobuf into memory; don't block pan/zoom on fetch.
**Visible effect + Proof:** panning a large FlatGeobuf layer fetches only in-view features with a **"streaming"** badge. Proof = Playwright: load a streaming source, pan, assert the in-view count changes and the main thread stays responsive.
**Tests (fixture `fcLarge` adapted to a streaming stub):** extent query returns only intersecting features; count reflects viewport, not total.
**Done when:** large sources stream by extent with truthful counts.
**Checkpoint:** `gis/p44-streaming`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/workers`.

## Prompt 45 — Raster / GeoTIFF: render, legend, histogram, raster QA
Read first: `05` Raster/GeoTIFF. Depends on: 4, 10. **Contract:** `SourceHandle` (`geotiff`).
**Goal:** treat raster as a first-class, inspectable, QA-gated layer.
**Context:** `geotiff` dep exists and `EOLayerContextMetadata` is already referenced in `mapTypes.ts`.
**Build:**
1. Profile + render single/multi-band GeoTIFF (band selection, color ramp, no-data value); reuse `src/components/map/layers/RasterTileLayer.tsx`.
2. Compute a band histogram + min/max/mean; render a legend with the ramp + no-data swatch.
3. Add raster QA (CRS present, no-data declared, band count) feeding `LayerScientificQAMetadata`.
**Anti-patterns:** don't render without a declared no-data value (caveat); don't compute stats over the full raster on the main thread (sample/worker).
**Visible effect + Proof:** a GeoTIFF renders with a ramp legend + a **histogram** in the inspector. Proof = Playwright with a small GeoTIFF: assert the histogram renders and band selection re-colors the layer.
**Tests:** histogram bins sum to sampled pixel count; no-data excluded from stats; missing CRS → raster QA caveat.
**Done when:** raster layers render, legend, histogram, and pass raster QA truthfully.
**Checkpoint:** `gis/p45-raster`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/centerpanel/components/map`.

## Prompt 46 — Temporal layers: playback, frame export, Urban handoff
Read first: `05` Temporal map layers. Depends on: 3, 19. **Contract:** reuse `MapTemporalEvidenceMetadata`.
**Goal:** complete the temporal layer lifecycle (the metadata model already exists; the workflow is partial).
**Build:**
1. Drive playback from the `temporal` slice (snapshot + continuous modes); per-frame metadata; speed control; reduced-motion respects Prompt 39.
2. Export the current frame as a figure (reuse Prompt 22 composer) carrying frame index/key/label.
3. Publish a temporal state to Urban evidence via `MapTemporalEvidenceMetadata` with QA + caveats.
**Anti-patterns:** don't animate in a way that implies false metric change; don't lose the frame reference in exports.
**Visible effect + Proof:** a temporal layer plays through frames and a frame can be exported with its label. Proof = Playwright: play, pause at frame 3, export, assert the export carries `frameIndex:3`.
**Tests:** frame metadata correct; exported frame reference present; reduced-motion disables auto-play.
**Done when:** temporal playback + frame export + Urban handoff complete.
**Checkpoint:** `gis/p46-temporal`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, `npm run test:analytics`.

## Prompt 47 — Labeling engine: editor, collision, scale ranges
Read first: `05` Labeling. Depends on: 12.
**Goal:** professional labels with collision handling and report parity.
**Build:**
1. Label editor in the style surface: field, font/size, halo, placement, scale-range visibility.
2. Collision policy (hide-on-overlap / priority by field) using MapLibre symbol layout where possible.
3. Labels carry into the legend/report/export the same way styles do (Prompt 12 contract).
**Anti-patterns:** don't render overlapping unreadable labels; don't let report labels diverge from the map.
**Visible effect + Proof:** labels appear with collision handling + scale-range gating. Proof = Playwright on `fcPointsWGS84`: enable `name` labels, zoom out, assert overlapping labels are culled.
**Tests:** collision culls overlaps; scale-range hides labels outside range; label spec serializes into the report.
**Done when:** labeling is editable, collision-safe, and report-consistent.
**Checkpoint:** `gis/p47-labels`. **Validate:** `npm run typecheck`, `npm run color:guard:changed`, `npx vitest run src/centerpanel/components/map`.

## Prompt 48 — Advanced cartography (bivariate / dot-density) with QA caveats
Read first: `05` Bivariate/cartographic advanced styling. Depends on: 12.
**Goal:** wire advanced renderers into production UI with honest caveats.
**Build:** add bivariate choropleth, dot-density, and proportional-symbol renderers (reuse existing carto engine utils); each emits a cartography caveat when classification/normalization is questionable (`MapCartographyAdvisor`).
**Anti-patterns:** don't present a bivariate map without a 2D legend; don't dot-density without an area-normalization caveat.
**Visible effect + Proof:** a bivariate map renders with a 2×2 legend; dot-density shows a normalization caveat. Proof = Playwright on `fcPolygonsProjected`: apply bivariate, assert the 2D legend renders.
**Tests:** bivariate legend has the expected cells; dot-density emits a normalization caveat.
**Done when:** advanced styles are usable with truthful caveats + legends.
**Checkpoint:** `gis/p48-advanced-carto`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`.

## Prompt 49 — Topology validation + guided repair
Read first: `05` Topology repair. Depends on: 13, 14. **Contract:** `MapCommandResult`.
**Goal:** detect and (where safe) repair invalid geometry via the command lifecycle.
**Build:**
1. Use `geos-wasm` `makeValid`/`isValid` in a worker to detect self-intersections, null/empty geometry, ring-orientation errors.
2. Offer guided repair as an `aoi.edit`/`workflow.apply` command (preview → apply → audit), never silent.
3. Feed findings into `LayerScientificQAMetadata` (`invalid_geometry` badge).
**Anti-patterns:** don't auto-repair without preview; don't claim validity you didn't verify.
**Visible effect + Proof:** an invalid layer shows a **"repair geometry"** action that previews the fix. Proof = Playwright on `fcInvalidGeometry`: assert the invalid badge, run repair, assert the QA badge clears + an audit row.
**Tests (fixture `fcInvalidGeometry`):** self-intersection detected; repair produces valid output with provenance; null geometry flagged.
**Done when:** invalid geometry is detected and repairable with audit.
**Checkpoint:** `gis/p49-topology`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/workers`.

## Prompt 50 — Join / relate preview
Read first: `08` (attribute workflows). Depends on: 11, 15. **Contract:** `MapCommandResult`.
**Goal:** attribute + spatial joins with cardinality honesty.
**Build:**
1. Attribute join (key→key) and spatial join (intersects/within/nearest) producing a derived layer with provenance.
2. A preview showing match counts, unmatched rows, and a cardinality warning (1:N / N:M) before apply.
3. CRS-gate the spatial join (Prompt 7) and run large joins in a worker/DuckDB.
**Anti-patterns:** don't apply a join that silently drops unmatched rows; don't spatial-join in geographic CRS for distance-based predicates.
**Visible effect + Proof:** a join preview shows matched/unmatched counts before apply. Proof = Playwright joining `fcPointsWGS84`→`fcPolygonsProjected` (within): assert match/unmatched counts render.
**Tests:** attribute join match count correct; unmatched rows reported; N:M flagged.
**Done when:** joins are previewable, CRS-safe, and provenance-carrying.
**Checkpoint:** `gis/p50-join`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 51 — Reprojection cache
Read first: `05` Reprojection cache. Depends on: 6, 13.
**Goal:** avoid recomputing projections by caching projected geometry keyed by source + target CRS.
**Build:** a cache (in worker/DuckDB) keyed by `{sourceId, sourceCrs, targetCrs}` returning projected geometry; invalidate on source change (tie to `SourceHandle`); expose a cache-stats line in diagnostics.
**Anti-patterns:** don't serve a stale projection after a source edit; don't grow the cache unbounded (LRU).
**Visible effect + Proof:** repeated metric ops on the same layer/CRS reuse the cache (diagnostics shows a cache hit). Proof = test: two buffers on the same projected layer → second logs a cache hit.
**Tests:** cache hit on repeat; invalidation on source change; LRU eviction bound.
**Done when:** projections are cached + correctly invalidated.
**Checkpoint:** `gis/p51-reproj-cache`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 52 — Multi-scale vector tile pipeline
Read first: `05` Multi-scale vector tiles. Depends on: 44.
**Goal:** serve large local/remote vector data as scale-appropriate tiles.
**Build:** build a PMTiles-backed (or on-the-fly tiled) pipeline with simplification per zoom; render via MapLibre vector source; truthful "tiled/simplified" caveat so users know geometry is generalized at low zoom.
**Anti-patterns:** don't let simplified geometry be measured for metrics without a caveat; don't claim full precision at low zoom.
**Visible effect + Proof:** a large dataset renders smoothly across zooms with a **"tiled (simplified)"** caveat. Proof = Playwright: load a tiled source, zoom out/in, assert smooth render + caveat chip.
**Tests:** simplification reduces vertex count at low zoom; metric ops on tiled geometry carry a caveat.
**Done when:** large data renders multi-scale with honest generalization.
**Checkpoint:** `gis/p52-vector-tiles`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

---

# Track H — Enterprise / Modern GIS Depth (Prompts 53–62)

> Sourced from `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md`. These are what separate "browser production GIS" from "first-class premium GIS".

## Prompt 53 — Command palette + global keyboard system
Read first: `06` UX Gates. Depends on: 2, 9.
**Goal:** keyboard-first operation of every command.
**Build:** a command palette (fuzzy search via `fuse.js`) listing all registered map commands + processing tools (Prompt 24) with shortcut hints; a keybinding map; ensure each command exposes a label + disabled reason.
**Anti-patterns:** don't add palette entries for non-existent commands; don't trap keys that break the modal focus contract.
**Visible effect + Proof:** a palette opens (e.g. `Ctrl/Cmd+K`) and runs any command. Proof = Playwright: open palette, search "buffer", run it via keyboard, assert the command executes.
**Tests:** palette lists registered commands; running one dispatches the action; disabled commands show a reason.
**Done when:** every command is keyboard-reachable via the palette.
**Checkpoint:** `gis/p53-palette`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map`, a11y Playwright.

## Prompt 54 — Undo/redo stack
Read first: `01` §action history. Depends on: 9.
**Goal:** a general undo/redo across map edits, beyond per-command revert.
**Build:** an undo/redo stack in the `review`/history service capturing reversible state transitions (layer add/remove/style, AOI edits, joins); coalesce rapid edits; expose undo/redo buttons + shortcuts.
**Anti-patterns:** don't put non-reversible side effects (exports, external publishes) on the undo stack; don't grow the stack unbounded.
**Visible effect + Proof:** undo/redo reverses a sequence of edits. Proof = Playwright: add layer → style → AOI edit, undo×3 restores the original state, redo×3 reapplies.
**Tests:** stack ordering; coalescing; non-reversible ops excluded.
**Done when:** multi-step edits are undoable/redoable.
**Checkpoint:** `gis/p54-undo`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map src/stores`.

## Prompt 55 — Plugin / extension registry
Read first: `08` (plugin/extension points). Depends on: 4, 16, 24a.
**Goal:** extension points so new connectors/renderers/tools/bridges can register without forking core.
**Build:** a typed registry for four extension kinds — source connectors (→ `MapConnectionRegistry`), renderers (style families), processing tools (→ `MapProcessingRegistry`), and Urban method bridges (→ `MapUrbanBridgeService`). Each declares an id, capability, and capability/availability status. Ship one reference plugin per kind.
**Anti-patterns:** don't allow a plugin to bypass CRS/QA gates; don't execute untrusted plugin code without scope limits.
**Visible effect + Proof:** a plugin panel lists registered extensions; a reference processing-tool plugin appears in the toolbox. Proof = Playwright: register the reference tool plugin, assert it shows in the toolbox and runs through the lifecycle.
**Tests:** each extension kind registers + is discoverable; a plugin tool still passes preflight/QA gates.
**Done when:** the four extension points work with reference plugins.
**Checkpoint:** `gis/p55-plugins`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 56 — Telemetry / observability + error recovery
Read first: `06` (production ops). Depends on: 9, 23.
**Goal:** structured diagnostics + graceful recovery for failures.
**Build:** structured event logging (command runs, worker failures, external-service errors, perf budget breaches) to an in-app diagnostics log (no PII, redaction via existing guardrails); React error boundaries around map panels + worker supervisors that recover or surface a specific failure with a retry.
**Anti-patterns:** don't log PII/credentials; don't let one panel crash take down the modal; don't swallow errors silently.
**Visible effect + Proof:** a forced worker failure shows a **specific, recoverable** error (not a blank modal). Proof = Playwright: induce a worker failure, assert an error boundary renders a retry + the rest of the UI survives.
**Tests:** error boundary catches a thrown render; worker failure surfaces a typed error; logs redact secrets.
**Done when:** failures are visible, scoped, and recoverable.
**Checkpoint:** `gis/p56-observability`. **Validate:** `npm run typecheck`, `npx vitest run src/centerpanel/components/map src/services/map`.

## Prompt 57 — Offline reproducible package export
Read first: `05` Offline package. Depends on: 4, 19, 22. **Contract:** `SourceHandle`, `MapReproducibilityManifest`.
**Goal:** export a self-contained package for reproducible review.
**Build:** bundle (via `jszip`) source metadata + small inline sources + styles + manifests + review timeline + evidence references into a `.zip`; re-import restores layers/styles or shows precise unavailable states for large/external sources.
**Anti-patterns:** don't embed huge sources silently (bound + caveat); don't drop demo/synthetic labels in the package.
**Visible effect + Proof:** **"Export package"** produces a `.zip` that re-imports into a restored session. Proof = test: export a small project, re-import, assert layers + styles + manifest restored and an external source shows `unavailable`.
**Tests:** round-trip restore; large/external sources flagged unavailable; labels preserved.
**Done when:** packages export + re-import with truthful restore states.
**Checkpoint:** `gis/p57-offline-package`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 58 — AI guardrails for NL query + copilot actions
Read first: `14` (AI guardrails). Depends on: 9, 15.
**Goal:** make NL query + copilot map actions safe and auditable.
**Build:** route NL query (`MapNLQueryBuilder`) + copilot proposals through an allowlist (only registered commands/tools), redact prompts/outputs via the existing guardrails (`dompurify` + redact), require human confirmation for any apply, and log every AI-proposed action to the review timeline.
**Anti-patterns:** never auto-apply an AI action without confirmation; never let NL query execute arbitrary code or unbounded scans.
**Visible effect + Proof:** an AI-proposed action requires confirmation and is audited. Proof = Playwright: issue an NL query that proposes a buffer, assert a confirm step + a review-timeline entry tagged AI-proposed.
**Tests:** disallowed action rejected; apply requires confirmation; proposal logged.
**Done when:** AI actions are allowlisted, confirmed, redacted, and audited.
**Checkpoint:** `gis/p58-ai-guardrails`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 59 — Collaboration: shared review sessions + annotations
Read first: `14` (collaboration). Depends on: 20.
**Goal:** lightweight multi-user review with honesty about sync limits.
**Build:** use `yjs` (already a dep) for shared annotations + review comments on layers/AOIs/evidence with presence; a truthful connection-state badge (connected/local-only/offline). Persist via the review service; no heavy geometry over the sync channel.
**Anti-patterns:** don't claim real-time sync when offline/local-only; don't sync raw geometry through yjs.
**Visible effect + Proof:** two clients see each other's annotations + presence; offline shows **"local-only"**. Proof = test with two yjs docs: an annotation on doc A appears on doc B; disconnect → badge `local-only`.
**Tests:** annotation syncs across docs; presence updates; offline state truthful.
**Done when:** collaborative annotations work with honest sync state.
**Checkpoint:** `gis/p59-collab`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`.

## Prompt 60 — Terrain / elevation + CityJSON / 3D Tiles import
Read first: `09` (terrain, CityJSON). Depends on: 30. **Contract:** `SourceHandle`.
**Goal:** ground the 3D scene on real terrain and import standard 3D city data.
**Build:** terrain from a DEM GeoTIFF (`geotiff`) or MapLibre terrain; CityJSON + 3D Tiles import via `@loaders.gl/3d-tiles`, mapped into the scene with `SourceHandle` + runtime mode; vertical datum recorded.
**Anti-patterns:** don't extrude over flat ground when terrain exists without saying so; don't assume a vertical datum.
**Visible effect + Proof:** buildings sit on terrain; a CityJSON file imports into the 3D scene. Proof = Playwright with a small CityJSON: assert non-blank 3D render + a source handle with vertical-datum metadata.
**Tests:** terrain sampled at building base; CityJSON import creates a handle; vertical datum recorded or caveated.
**Done when:** terrain + CityJSON/3D Tiles integrate with truthful metadata.
**Checkpoint:** `gis/p60-terrain-cityjson`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, canvas-nonblank Playwright.

## Prompt 61 — View corridors + section / cut planes (3D)
Read first: `09`, `12`. Depends on: 30, 34.
**Goal:** urban-design analysis tools — protected view corridors and section cuts.
**Build:** a view-corridor tool (define an origin + target, test which massing intrudes) and a section/cut-plane tool (`three` clipping planes) with a measurement readout; results carry CRS + assumptions and can publish to evidence.
**Anti-patterns:** don't report corridor intrusion without the execution CRS; don't let the cut plane hide the analyzed geometry.
**Visible effect + Proof:** a view corridor highlights intruding massing; a section plane cuts the scene. Proof = Playwright: define a corridor, assert intruding buildings highlight; drag a section plane, assert the cut updates.
**Tests:** corridor intrusion detection correct; section plane updates render; results carry CRS.
**Done when:** corridors + sections work with truthful metrics.
**Checkpoint:** `gis/p61-corridors-section`. **Validate:** `npm run typecheck`, `npx vitest run src/services/map`, 3D Playwright.

## Prompt 62 — Raster / temporal / 3D evidence visual states + visual QA
Read first: `11`, `12`, `06` Design Gates. Depends on: 35, 40, 45, 46, 30.
**Goal:** extend the premium visual language + visual-QA coverage to raster, temporal, and 3D evidence states.
**Build:** status/legend treatments for raster (ramp + no-data), temporal (frame + playback state), and 3D (runtime mode, vertical assumptions, generated-vs-real) using the shared primitives + tokens; add Playwright screenshot + canvas-nonblank coverage for these states (extends Prompt 40).
**Anti-patterns:** don't leave raster/temporal/3D states unstyled or color-only; don't ship without nonblank checks.
**Visible effect + Proof:** raster/temporal/3D surfaces share the visual language with visible state chips. Proof = Playwright screenshots of each + canvas-nonblank for raster + 3D.
**Tests:** state chips render; canvas nonblank for raster + 3D evidence views.
**Done when:** these surfaces match the premium language and are gated by visual QA.
**Checkpoint:** `gis/p62-evidence-visual`. **Validate:** `npm run typecheck`, `npm run lint:no-tailwind-centerpanel`, Playwright screenshots.

---

# Track F — Close-out (Prompts 63–64)

## Prompt 63 — Documentation + support matrices
Read first: `06` Documentation Gates.
**Goal:** truthful production documentation matching shipped behavior.
**Build:** update architecture + user workflow guide; known risks/limitations; source format support matrix (from P5); CRS/QA method note; Map/Urban bridge contract note (from P16); GIS design/motion/visual-QA notes; a validation summary (commands + dates).
**Anti-patterns:** don't document capabilities that didn't ship; don't bury limitations.
**Visible effect + Proof:** a complete docs set; limitations explicit. Proof = link-check passes; each shipped feature has a doc entry.
**Done when:** all `06` documentation gates satisfied.
**Checkpoint:** `gis/p63-docs`. **Validate:** link-check; cross-reference vs shipped prompts.

## Prompt 64 — Release candidate gate
Read first: `06` Release Readiness Scorecard.
**Goal:** certify production readiness with evidence.
**Build:** run the scorecard (monolith reduced, source registry, CRS preflight, unified bridge, layer inspector, QA command gates, report/export metadata, a11y smoke, design+motion gate, large-data truthful limits, external-service limitations, known-risks doc). Map each row to evidence (test/screenshot/doc); document each blocker with a concrete limit.
**Anti-patterns:** don't claim RC with undocumented blockers.
**Visible effect + Proof:** a **signed-off RC report** mapping each scorecard row to evidence with green/blocked status. Proof = attach `npm run validate:rc` output.
**Done when:** `validate:rc` passes or every blocker is documented with a limit.
**Checkpoint:** `gis/p64-rc`. **Validate:** `npm run validate:rc`.

---

## Sequencing Cheat Sheet

```
Bootstrap:    0 ✅ (done)
Foundation:   1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21
Publication:  22 → 23 → 24a → 24b → 24c → 25a → 25b
Operator:     26 → 27 → 28
Layouts/3D:   29 → 30 → 31 → 32a → 32b → 33 → 34
Design (overlay, start after 2): 35 → 36 → 37 → 38 → 39 → 40
Capability depth (Track G): 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51 → 52
Enterprise depth (Track H): 53 → 54 → 55 → 56 → 57 → 58 → 59 → 60 → 61 → 62
Close-out:    63 → 64
```

Tracks G and H are mostly parallelizable once their listed prerequisites land; interleave them with Tracks B–E rather than waiting for all of A–F. Suggested practical order: finish Foundation (1–21) → 43,45,46,49 (data/QA depth) → 22–28 → 53,54,56 (palette/undo/observability) → 29–34 → 44,50,51,52,55,57,58 → 59–62 → 63–64.

Hard dependencies: 0→all · 2→35,36 · 4→(5,10,11,16,26,43,44,55,57) · 6→7→(8,13,31,32a,51) · 9→(13,14,24a,53,54,56,58) · 11→50 · 13→(44,49,51) · 16→55 · 19→57 · 20→59 · 24a→24b→24c→25a→25b · 24a→(53,55) · 30→(31,32,33,34,60,61) · 34→61 · 35→(36–39,62) · 36→34 · 40→62 · 45,46→62 · everything→(63,64).

## Provenance / why this is production-deterministic

- **Code-verified (2026-05-22):** paths, extend-vs-create, and type names confirmed against the repo (tokens/shell/evidence model already exist; `test:analytics` excludes map → use `npx vitest run <path>`; `verbatimModuleSyntax`/`exactOptionalPropertyTypes` honored).
- **Prompt 0 implemented + proven:** `gisContracts.ts` compiles under `typecheck`; `gisFixtures.ts` + self-test pass 8/8. The skeleton holds in code.
- **Heavy work split:** toolbox (24a/b/c), model builder (25a/b), massing (32a/b) are single-turn slices, each with its own visible effect.
- **Shared contracts + fixtures:** every prompt references named contracts/fixtures so independent agents converge and tests assert specific counts/statuses/reasons.
- **Proof + checkpoint:** every prompt has a concrete Proof and a git checkpoint/rollback rule (never weaken tests to pass).
