# LEDGER — Map Explorer Production GIS prompt ladder

Single source of execution state + the resume point for any chat (especially a fresh one with no memory). Date started: 2026-05-22.

> **This ledger does not auto-run anything.** It is *discovered* via the `CLAUDE.md` "Active operating pack" pointer (auto-loaded every session) and via `README.md`. Once an agent opens this pack, this is the first file to read: it tells the agent how to boot safely and which prompt is next. Treat it as the "where are we / what next" record.

---

## ▶ Resume in a new chat (do this first)

0. Start from the latest completed GIS prompt branch, not the older prompt-pack
   base. For Prompt 3+, use `gis/p02-decompose` (or the active
   `gis/map-explorer-production-prompts` branch once advanced to the same head).
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
- [ ] 3 — Store slices + selectors
- [ ] 4 — `MapSourceRegistry` V1
- [ ] 5 — Import preflight + profiling + support matrix
- [ ] 6 — `MapProjectionService` + `ExecutionCrsPlanner`
- [ ] 7 — `CrsPreflight` gate
- [ ] 8 — CRS correction UI + projection suggestion
- [ ] 9 — Map command lifecycle (`MapActionExecutor`)
- [ ] 10 — Layer inspector workbench
- [ ] 11 — Attribute table + selection sync
- [ ] 12 — Style editor + legend contract
- [ ] 13 — Workerized geometry operations
- [ ] 14 — AOI + vertex editing
- [ ] 15 — Selection tools + query planner
- [ ] 16 — `MapUrbanBridgeService` V1
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

---

## Update protocol (every agent, after finishing a prompt)

1. Flip the prompt's Status checkbox to `[x]` (or `[!]` with a note if blocked).
2. Prepend a row to the Done Log: date, prompt, branch, commit hash(es), one-line proof.
3. List any new shared artifacts under "Artifacts created so far".
4. Commit the ledger update **with** the prompt's slice (same branch), so state never drifts from code.
5. If you discovered a repo fact that contradicts the prompt (path moved, type renamed), note it under "Drift notes" so the next chat doesn't repeat the surprise.

## Drift notes

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

---

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
