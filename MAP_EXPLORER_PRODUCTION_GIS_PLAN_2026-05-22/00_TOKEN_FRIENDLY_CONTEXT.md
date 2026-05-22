# 00 - Token-Friendly Context

Date: 2026-05-22
Status: compact operating context
Purpose: let future work understand the plan pack without reading every long markdown file first.

## Read This First

This folder defines how to turn Map Explorer into a professional browser-native GIS workbench that integrates with Urban Analytics and Synapse IDE.

The full folder is intentionally comprehensive, but it is too large for every implementation task. Use this file as the compact entry point.

## One-Screen Product Target

Map Explorer should become:

- A production GIS workbench, not a map viewer.
- A source-backed spatial runtime with restoreable data handles.
- A CRS-safe analysis surface that never computes false metric results in EPSG:4326.
- A professional layer, catalog, attribute, processing, layout, and 2D/3D scene workspace.
- A first-class Urban Analytics companion that exchanges typed summaries, IDs, manifests, and evidence references.
- A premium VS Code-style workbench using Synapse IDE and Urban Analytics visual language.
- A truthful scientific tool where demo, sample, synthetic, unknown, stale, blocked, and environment-dependent states stay visible.

## Non-Negotiables

1. Map Explorer owns rendering, viewport, sources, layer registry, selection, geometry buffers, map workflows, and export surfaces.
2. Urban Analytics owns analytical interpretation, method validity, data fitness, evidence artifacts, workflow manifests, and report semantics.
3. Synapse IDE owns editor buffers, generated code artifacts, terminal state, and script review.
4. Do not pass raw heavy geometry through generic UI events.
5. Use typed bridge payloads with stable IDs.
6. Do not compute planar area/distance in EPSG:4326.
7. Unknown metadata remains unknown.
8. Evidence artifacts are immutable after creation; mark stale/superseded through QA or create a new artifact.
9. Heavy GIS work goes to workers, WASM, DuckDB-WASM, GPU, or an explicit backend path.
10. Production UI must expose disabled reasons, QA state, CRS state, provenance, runtime mode, and test paths.

## Current Strengths

The repo already has:

- A rich Map Explorer modal and component set under `src/centerpanel/components/map/`.
- A large Zustand map store with viewport, layers, AOI, selection, drawing, measurements, QA, evidence, temporal, review, and action proposal state.
- Map services for workflows, scientific QA, import/export, persistence, report handoff, Urban bridge, analysis dispatch, and VoxCity handoff.
- Urban Analytics context, data fitness, method validity, evidence, study area, and report integration.
- Engine foundations: worker pool, DuckDB-WASM, WASM spatial index, GPU paths, streaming, network, simulation, GeoAI, and raster-related dependencies.
- Premium style language in Synapse IDE and Urban Analytics that can be reused for Map Explorer.

## Biggest Risks

| Risk | Severity | Compact Fix |
| --- | --- | --- |
| `MapExplorerModal.tsx` monolith | High | Extract lifecycle, command, bridge, report, workflow, layout controller hooks. |
| Source lifecycle spread across importer/exporter/persistence | High | Add `MapSourceRegistry` and source handles. |
| CRS not universally command-gated | Critical | Add projection service, execution CRS planner, CRS preflight. |
| Duplicate map component families | High | Declare canonical surface and migrate/reuse deliberately. |
| Heavy geometry can reach main thread | High | Route medium/large operations through workers/WASM/SpatialDB/GPU/backend. |
| Bridge protocol fragmentation | Medium | Create versioned `MapUrbanBridgeService`. |
| QA not universal | High | Gate publish/export/analysis/edit commands through one command lifecycle. |
| Professional GIS UI still conceptual | Medium | Add token bridge, workbench shell, shared GIS primitives, visual QA. |
| Browser-scale limits | High | Add performance budgets, stress fixtures, streaming, caching, and truthful limits. |

## Canonical Implementation Sequence

Use this sequence for most work:

1. Baseline inventory and canonical map surface decision.
2. Decompose `MapExplorerModal.tsx`.
3. Define store slices and selectors.
4. Add source registry and restore policies.
5. Add CRS/projection preflight.
6. Add command/action lifecycle.
7. Add layer inspector, catalog, contents tree, and attribute table.
8. Workerize geometry operations.
9. Build canonical Map/Urban bridge.
10. Harden evidence publication and report/layout composer.
11. Add processing toolbox and model builder.
12. Add premium GIS token/design system and visual QA.
13. Add 2.5D/3D building, block, zoning, massing, and sun/shadow workflows.
14. Add enterprise gaps from `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md`.

## Docs To Read By Task

| Task | Read |
| --- | --- |
| Understand current repo state | `01_CURRENT_STATE_AUDIT.md` |
| Architecture or module boundaries | `02_TARGET_ARCHITECTURE.md` |
| Map/Urban handoff | `03_URBAN_ANALYTICS_INTEGRATION_CONTRACT.md` |
| Roadmap and phase order | `04_IMPLEMENTATION_ROADMAP.md` |
| Capability backlog | `05_PRODUCTION_GIS_BACKLOG.md` |
| Release gates | `06_VALIDATION_AND_RELEASE_GATES.md` |
| Implementation prompts | `07_IMPLEMENTATION_PROMPT_LADDER.md` |
| ArcGIS/QGIS product parity | `08_ARCGIS_QGIS_GRADE_MASTERPLAN.md` and `10_CAPABILITY_PARITY_MATRIX.md` |
| 3D blocks/digital twin | `09_3D_BLOCKS_DIGITAL_TWIN_PLAN.md` |
| Premium visual design | `11_PREMIUM_VSCODE_GIS_DESIGN_SYSTEM.md` |
| Motion and 3D interaction | `12_MOTION_AND_3D_INTERACTION_SPEC.md` |
| Design implementation files | `13_DESIGN_IMPLEMENTATION_BLUEPRINT.md` |
| Missing first-class GIS product gaps | `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md` |

## Core Target Modules

Planned services:

- `src/services/map/runtime/MapRuntimeController.ts`
- `src/services/map/sources/MapSourceRegistry.ts`
- `src/services/map/sources/MapConnectionRegistry.ts`
- `src/services/map/crs/MapProjectionService.ts`
- `src/services/map/crs/ExecutionCrsPlanner.ts`
- `src/services/map/crs/CrsPreflight.ts`
- `src/services/map/actions/MapActionExecutor.ts`
- `src/services/map/actions/MapActionHistoryService.ts`
- `src/services/map/bridge/MapUrbanBridgeService.ts`
- `src/services/map/query/MapQueryPlanner.ts`
- `src/services/map/processing/MapProcessingRegistry.ts`
- `src/services/map/model/MapModelBuilder.ts`
- `src/services/map/layout/MapLayoutComposer.ts`
- `src/services/map/scene3d/Map3DSceneController.ts`

Planned UI roots:

- `src/centerpanel/components/map/workbench/`
- `src/centerpanel/components/map/design/`
- `src/centerpanel/components/map/ui/`
- `src/centerpanel/components/map/catalog/`
- `src/centerpanel/components/map/contents/`
- `src/centerpanel/components/map/inspector/`
- `src/centerpanel/components/map/table/`
- `src/centerpanel/components/map/processing/`
- `src/centerpanel/components/map/modelBuilder/`
- `src/centerpanel/components/map/layout/`
- `src/centerpanel/components/map/scene3d/`

## Minimal Premium GIS Release Slice

A release can honestly say "professional GIS workbench" only after these exist:

1. Source registry and catalog.
2. Contents tree and layer inspector.
3. Attribute table and selection sync.
4. CRS preflight and execution CRS planner.
5. Command/action lifecycle with preview/apply/audit/revert where practical.
6. Processing toolbox with real preflight, logs, manifests, and at least 15 useful tools.
7. Editing/AOI/topology basics.
8. Layout composer with CRS, legend, scale, attribution, QA, and source metadata.
9. Canonical Map/Urban bridge and method compatibility panel.
10. Evidence publication that preserves source, CRS, QA, runtime mode, and manifest IDs.
11. Premium VS Code-style workbench shell, shared primitives, reduced-motion-safe motion, and visual QA.
12. 2.5D building extrusion and first 3D block/zoning/massing scenario flow.
13. Known limitations, performance budgets, stress fixtures, and accessibility gates.

## What The Existing Pack Covers Well

- Core architecture.
- Source registry need.
- CRS safety.
- Urban Analytics integration.
- Evidence truthfulness.
- Professional GIS parity at a high level.
- 3D blocks, zoning, massing, sunlight/shadow.
- Premium workbench design and motion.
- Release gates and prompt ladder.

## What Was Still Missing Before This Compact Pass

The pack needed a token-friendly entry point and a sharper modern premium GIS gap analysis. This file solves the first need. `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md` solves the second.

## How To Keep This Folder Token-Friendly

- Do not duplicate long explanations across new files.
- Put task-specific details in the relevant numbered document.
- Keep `00_TOKEN_FRIENDLY_CONTEXT.md` under a compact summary size.
- Add new enterprise or product gaps to `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md`, not to every existing file.
- In implementation prompts, reference detailed docs instead of repeating them.
- Prefer tables with stable decisions over prose repetition.
- Keep final agent handoffs pointing to one or two docs, not the full pack.

