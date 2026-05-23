# Map Explorer Production GIS + Urban Analytics Operating Pack

Date: 2026-05-22
Status: planning baseline
Scope: turn Map Explorer into a professional, production-grade browser GIS surface that works as a first-class spatial instrument for Urban Analytics.

This folder is a new structured plan. It is not a continuation of the archived development prompt ladders. The plan is grounded in the current repository state inspected on 2026-05-22.

## File Index

| File | Purpose |
| --- | --- |
| `00_TOKEN_FRIENDLY_CONTEXT.md` | Compact entry point for future agents: product target, non-negotiables, risks, read-by-task map, minimum release slice, and token-friendly folder rules. |
| `01_CURRENT_STATE_AUDIT.md` | Evidence-based audit of the current Map Explorer, Map services, Urban Analytics bridge, test surface, and major risks. |
| `02_TARGET_ARCHITECTURE.md` | Desired production architecture for runtime, source registry, layer registry, actions, workers, CRS, QA, and UI. |
| `03_URBAN_ANALYTICS_INTEGRATION_CONTRACT.md` | Bidirectional Map Explorer <-> Urban Analytics contract, state choreography, payload boundaries, and evidence rules. |
| `04_IMPLEMENTATION_ROADMAP.md` | Sequenced multi-phase roadmap with concrete deliverables, acceptance criteria, and validation commands. |
| `05_PRODUCTION_GIS_BACKLOG.md` | Capability backlog across data I/O, CRS, cartography, editing, querying, analysis, reporting, performance, and security. |
| `06_VALIDATION_AND_RELEASE_GATES.md` | Definition of done, automated/manual gates, performance budgets, accessibility, and release readiness checklist. |
| `07_IMPLEMENTATION_PROMPT_LADDER.md` | Bounded implementation prompts that can be executed sequentially without losing product or scientific intent. |
| `08_ARCGIS_QGIS_GRADE_MASTERPLAN.md` | Full professional GIS product plan modeled around ArcGIS/QGIS-class capabilities: catalog, processing, editing, layouts, cartography, plugins, administration, and operator workflows. |
| `09_3D_BLOCKS_DIGITAL_TWIN_PLAN.md` | Detailed 3D urban block, massing, zoning, scenario, sunlight, shadow, parcel, terrain, CityJSON, and digital twin work plan. |
| `10_CAPABILITY_PARITY_MATRIX.md` | Capability-by-capability parity matrix comparing the target workbench to desktop GIS expectations and mapping each area to repo modules. |
| `11_PREMIUM_VSCODE_GIS_DESIGN_SYSTEM.md` | Premium VS Code-style GIS visual system plan using Synapse IDE, Urban Analytics, and existing Map Explorer design tokens. |
| `12_MOTION_AND_3D_INTERACTION_SPEC.md` | Motion, transition, feedback, accessibility, and 3D interaction specification for professional 2D/3D GIS workflows. |
| `13_DESIGN_IMPLEMENTATION_BLUEPRINT.md` | Concrete design implementation blueprint with proposed files, components, CSS module rules, visual QA, and execution sequence. |
| `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md` | Gap analysis for what is still missing or under-specified for a first-class modern premium GIS tool. |
| `LEDGER.md` | **Start here for execution.** Single source of execution state + resume point for any chat: per-prompt Status checkboxes (0 done, 1–64 TODO), a Done Log of branches/commits/proofs, the cold-start resume steps, an update protocol, and a drift-notes section. |
| `15_AGENT_EXECUTION_PROMPTS.md` | Code-verified (v4) copy-paste agent prompt list (Prompt 0 → 64 across 8 tracks; heavy ones split a/b/c). **Prompt 0 is implemented + verified in the repo** (`src/services/map/contracts/gisContracts.ts` compiles under typecheck; `src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts` + self-test pass 8/8). Each prompt is a standalone spec with Context, numbered Build steps, Anti-patterns, real repo paths (extend-vs-create), shared TypeScript contracts + named fixtures, an explicit visible-effect Proof, and a git checkpoint/rollback rule. v4 adds Track G (capability depth: formats, streaming, raster, temporal, labeling, cartography, topology, joins, reprojection cache, vector tiles) and Track H (enterprise: command palette, undo/redo, plugin SDK, observability, offline package, AI guardrails, collaboration, terrain/CityJSON, view corridors). Includes Repo Reality Notes, the script matrix, Agent Contract v2, and a dependency-aware sequencing cheat sheet. |

## Token-Friendly Entry Point

For most future implementation work, do not read the whole folder first. Start with:

1. `00_TOKEN_FRIENDLY_CONTEXT.md`
2. The one or two domain files relevant to the task
3. `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md` if the task concerns product completeness, enterprise GIS depth, cloud-native standards, collaboration, security, raster/EO, field/offline, plugin SDK, AI guardrails, or observability

This keeps planning context small while preserving access to the full operating pack.

## Executive Summary

Map Explorer is already far beyond a simple map viewer. The current codebase has:

- A large Map Explorer orchestration shell in `src/centerpanel/components/MapExplorerModal.tsx`.
- A rich Zustand store in `src/stores/useMapExplorerStore.ts` for viewport, layers, AOI, selection, drawings, annotations, measurements, temporal playback, QA, evidence artifacts, review sessions, and action proposals.
- Map UI primitives under `src/centerpanel/components/map/`, including shell, cockpit, toolbar, layer manager, QA panel, NL query panel, workflow drawer, report drawer, review timeline, and map canvas.
- Service-layer bridges in `src/services/map/`, including map workflow previews, scientific QA, data I/O, persistence, report handoff, analysis dispatch, external services, Urban-to-Map requests, and Map-to-Urban context summaries.
- Urban Analytics evidence and context stores that already understand map context, map publications, data fitness, method validity, report artifacts, dashboard bindings, and reproducible packages.

The first draft of this pack focused on hardening the existing system. The upgraded target is larger: a browser-native professional GIS workbench with ArcGIS/QGIS-class operator depth and Urban Analytics-native scientific evidence. The main challenge is therefore not only "add GIS features." It is to build a coherent GIS product system:

- Reduce monolithic orchestration risk.
- Unify duplicate/parallel map surfaces.
- Harden CRS and projection semantics.
- Make data source persistence and large-data handling robust.
- Ensure every high-impact map operation is previewable, reversible where practical, worker-aware, QA-gated, and auditable.
- Make Urban Analytics and Map Explorer interact through versioned typed contracts, not implicit coupling or heavy event payloads.
- Turn existing demo/sample/environment-dependent paths into explicit, trustworthy user states.
- Add professional desktop-GIS class affordances: project/catalog browser, contents tree, attribute table, field calculator, processing toolbox, model/workflow builder, topology-aware editing, map layouts, print composer, plugin/extension points, service connections, and administration diagnostics.
- Add 3D urban block capabilities: parcels, blocks, zoning envelopes, massing, FAR/coverage/height rules, terrain, extruded buildings, CityJSON/3D Tiles, sunlight/shadow, view corridors, scenario comparison, and urban-design metrics.
- Add a premium professional design layer: VS Code-style workbench shell, thin hairlines, compact rails, dense inspectors, bottom panels, status bars, restrained accents, Urban Analytics evidence states, and subtle reduced-motion-safe animation.
- Give 3D blocks and digital twin workflows a first-class interaction language: compact scene controls, building/block inspectors, zoning and massing panels, scenario compare, sun/shadow timeline, and 3D evidence/export states.

## Product North Star

Map Explorer should become the spatial operating surface of the Urban Analytics Workbench:

- Professional GIS canvas for inspection, selection, editing, layer management, styling, analysis, and report preparation.
- Scientific instrument that preserves CRS, source, lineage, uncertainty, QA status, and reproducibility metadata.
- Urban Analytics companion that can receive method requests, validate map prerequisites, publish derived layers, generate evidence artifacts, and feed data-fitness/method-readiness states back to the panel.
- 2D/3D urban design workbench that can reason about blocks, parcels, building envelopes, public realm, zoning controls, scenarios, and environmental performance.
- Browser-first platform that remains honest about browser memory, external service, credential, CORS, WebGPU/WASM, and live-provider limits.

## Non-Negotiable Rules

1. Map Explorer owns map rendering, viewport, layers, selections, geometry buffers, and source/runtime state.
2. Urban Analytics owns analysis context, method validity, evidence artifacts, workflow manifests, data fitness, and analytical interpretation.
3. The bridge sends typed summaries, IDs, and versioned references. It must not push raw large geometry through generic UI events.
4. CRS and units must be explicit. Do not compute planar area/distance in EPSG:4326.
5. Demo, sample, synthetic, unknown, environment-dependent, and residual-gap states must remain visible in UI, evidence, reports, and exports.
6. Every production command must have a reachable UI surface, disabled-state reason, QA effect, and test path.
7. Heavy spatial work must move to workers/WASM/GPU/SpatialDB where appropriate.

## Planning Assumptions

- The current browser-first architecture remains the default.
- Existing dependencies such as MapLibre, deck.gl, Turf, proj4, DuckDB-WASM, WASM spatial index, FlatGeobuf, GeoParquet/Arrow, PMTiles, loaders.gl, and geos-wasm should be used before adding new libraries.
- Map Explorer remains in the CenterPanel bounded module, with service contracts in `src/services/map/`.
- Any implementation should preserve the strict TypeScript configuration and repo testing commands from `AGENTS.md`.

## How To Use This Pack

1. Read `01_CURRENT_STATE_AUDIT.md` before implementation to understand what already exists and what is risky.
2. Use `02_TARGET_ARCHITECTURE.md` as the architectural north star.
3. Use `03_URBAN_ANALYTICS_INTEGRATION_CONTRACT.md` for any Map/Urban handoff work.
4. Execute phases from `04_IMPLEMENTATION_ROADMAP.md`, using backlog slices in `05_PRODUCTION_GIS_BACKLOG.md`.
5. Apply `06_VALIDATION_AND_RELEASE_GATES.md` before considering any milestone complete.
6. Convert the prompts in `07_IMPLEMENTATION_PROMPT_LADDER.md` into actual implementation tasks when ready.
7. Use `11_PREMIUM_VSCODE_GIS_DESIGN_SYSTEM.md`, `12_MOTION_AND_3D_INTERACTION_SPEC.md`, and `13_DESIGN_IMPLEMENTATION_BLUEPRINT.md` whenever changing Map Explorer chrome, panels, animation, 3D controls, visual QA, or Urban evidence styling.
8. Use `14_MODERN_PREMIUM_GIS_GAP_ANALYSIS.md` before claiming "first-class premium GIS" rather than only "browser production GIS."
