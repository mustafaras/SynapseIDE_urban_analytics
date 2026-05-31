# 04 - Implementation Roadmap

Date: 2026-05-22

## Roadmap Strategy

The work should move from architecture cleanup to production GIS hardening, then to Urban Analytics deep integration and release readiness.

Avoid adding broad new features before these foundations are stable:

- Source registry.
- CRS preflight.
- Unified Map/Urban bridge.
- Command/action lifecycle.
- Monolith decomposition.
- Validation gates.

The upgraded roadmap has three product tracks:

- Foundation track: make the current Map Explorer reliable, typed, source-backed, CRS-safe, and Urban-integrated.
- Professional GIS track: add ArcGIS/QGIS-class workbench depth: catalog, contents tree, attribute table, editing, processing toolbox, model builder, layouts, 2D/3D scenes, block/zoning/massing scenarios, and administration diagnostics.
- Experience design track: apply the premium VS Code/Synapse IDE visual language to Map Explorer, harmonize Urban Analytics evidence states, and add a subtle accessible motion system for 2D/3D GIS workflows.

## Phase 0 - Baseline And Safety Rails

Goal: establish a trusted baseline before refactoring.

Deliverables:

- Record current Map Explorer entry points, services, and tests.
- Add an architecture decision note for canonical map surface ownership.
- Mark `src/centerpanel/components/map/` as the primary production surface.
- Inventory `src/components/map/` reusable/duplicate components.
- Add smoke tests around Map Explorer open/close, layer registry, and Urban handoff if gaps exist.
- Add documentation links from `docs/architecture/README.md` to this plan.

Acceptance:

- No code behavior changes except tests/docs.
- Existing unrelated dirty worktree changes are untouched.
- Clear list of files to refactor in Phase 1.

Validation:

- `npm run typecheck`
- `npm run lint:errors`
- targeted Map Explorer tests if changed

## Phase 1 - Decompose Map Explorer Orchestration

Goal: reduce `MapExplorerModal.tsx` risk.

Deliverables:

- Extract controller hooks:
  - `useMapExplorerLifecycle`
  - `useMapLayerRuntime`
  - `useMapCommandHandlers`
  - `useMapUrbanBridgeController`
  - `useMapPanelLayout`
  - `useMapReportController`
  - `useMapWorkflowController`
- Extract panel containers where they are currently inline.
- Keep presentational components under `src/centerpanel/components/map/`.
- Keep service logic out of React components.
- Preserve existing behavior and tests.

Acceptance:

- `MapExplorerModal.tsx` becomes a shell and coordinator rather than a 5000+ line control surface.
- No user-facing regression in Map Explorer modal.
- All extracted hooks have unit tests or integration coverage where logic is non-trivial.

Validation:

- `npm run typecheck`
- `npm run lint:errors`
- `npm run test -- src/centerpanel/components src/stores src/services/map`
- Map modal Playwright smoke

## Phase 2 - Source Registry And Data Persistence Foundation

Goal: make layers restorable and source-backed without persisting heavy geometry in the UI store.

Deliverables:

- `MapSourceRegistry` service with source handles.
- Source profiling for GeoJSON, CSV, Arrow/GeoParquet, FlatGeobuf, PMTiles, WMS/WFS/XYZ, raster/GeoTIFF where currently supported.
- Source restore policies:
  - inline-small
  - indexeddb-local
  - worker-table
  - duckdb-table
  - url-refetch
  - external-service
  - metadata-only
- Layer records reference `sourceId`.
- Import pipeline writes both source handle and layer registry entry.
- Project restore reports missing/unavailable source handles truthfully.

Acceptance:

- Reloaded projects can distinguish restored, recoverable, and unavailable layers.
- Large sources are not persisted inside Zustand.
- Urban context summaries can cite source handles and restore status.

Validation:

- Import/export unit tests.
- Project persistence tests.
- Browser memory tests for large imports.

## Phase 3 - CRS, Projection, And Geometry Execution Contract

Goal: ensure scientific GIS correctness.

Deliverables:

- `MapProjectionService` using existing proj4 support and projection definitions.
- `ExecutionCrsPlanner` that selects projected CRS for operations.
- CRS preflight for measurement, buffer, area, overlay, spatial stats, and report scale.
- Operation-level blockers when CRS is missing/incompatible.
- UI affordance for declaring/correcting CRS metadata without pretending certainty.
- Tests proving EPSG:4326 planar area/distance is blocked except geodesic calculations.

Acceptance:

- Every spatial operation declares `displayCrs`, `sourceCrs`, and `executionCrs` when relevant.
- Urban method `requiredCrs` is enforced before map execution.
- Unknown CRS remains unknown until user or metadata source resolves it.

Validation:

- Unit tests for CRS planner.
- Workflow tests for buffer/area/intersection gates.
- Data fitness tests for unknown/missing CRS.

## Phase 4 - Professional Layer UX And Attribute Workbench

Goal: turn layer management into a real GIS workbench.

Deliverables:

- Layer inspector with tabs:
  - Overview
  - Source/provenance
  - Schema
  - CRS
  - QA
  - Style
  - Analysis lineage
  - Report/export
- Attribute table for queryable layers with sorting, filtering, selection sync, and row-to-map focus.
- Field statistics for numeric/categorical/temporal fields.
- Layer grouping and search.
- Explicit source kind and runtime mode badges.
- Style editor for choropleth, categorical, graduated symbols, labels, opacity, outlines, no-data handling.

Acceptance:

- An analyst can inspect whether a layer is scientifically usable without opening developer tools.
- Selection state syncs between table, layer, map, and Urban context summary.
- Style changes update legends and report/export metadata.

Validation:

- Component tests.
- Store/action tests.
- Playwright for layer inspection, field stats, and selection sync.

## Phase 5 - Editing, AOI, Measurement, And Spatial Workflows

Goal: make common GIS operations trustworthy and user-controlled.

Deliverables:

- Vertex editing for drawn features.
- Snapping and topology warnings where feasible.
- AOI creation from viewport, drawn polygon, selected features, geocoded place, and Urban study area.
- Buffer/intersect/difference/union/comparison workflows routed through command lifecycle.
- Workerized execution for medium/large operations.
- Review timeline events for every applied operation.
- Revert support where practical.

Acceptance:

- Derived layers carry source layer IDs, AOI references, CRS, parameters, QA state, and manifest.
- User can preview before applying high-impact operations.
- Urban Analytics can request and consume workflow outputs.

Validation:

- Workflow service tests.
- Worker execution tests.
- Map/Urban bridge tests.
- Playwright for preview/apply/revert.

## Phase 6 - Urban Analytics Deep Integration

Goal: make Map Explorer and Urban Analytics feel like one analytical surface.

Deliverables:

- Canonical `MapUrbanBridgeService`.
- Method card action: "Prepare in Map".
- Map right rail method compatibility preview.
- Map context updates drive Urban method recommendations.
- Urban data fitness uses map layer summaries, not raw geometry.
- Urban evidence tray can open/focus map layers and AOIs.
- Map-published outputs create immutable Urban evidence artifacts.
- Report and dashboard bindings reference map layer/source/run/manifest IDs.

Acceptance:

- Urban method requests can focus compatible map layers, validate AOI, preview workflow, and publish result.
- Map context can update Urban recommendations without tight component coupling.
- Evidence never claims real readiness for demo/synthetic/unknown metadata.

Validation:

- Contract tests for bridge payloads.
- Urban evidence tests.
- `npm run test:analytics`

## Phase 7 - Publication, Reporting, And Review

Goal: make professional outputs reproducible and reviewable.

Deliverables:

- Map composer for publication figures:
  - title
  - legend
  - scale bar
  - north arrow
  - attribution
  - CRS
  - QA caveats
  - timestamp
  - visible layer list
- Report handoff with structured references.
- Reproducible map package export.
- Review session export to JSON and Markdown.
- Reopen report item to restore or summarize map view.

Acceptance:

- A report figure can be traced back to source layers, viewport, style, CRS, QA, and analysis run.
- Demo/synthetic/sample labels appear in exported/report outputs.
- Review timeline is useful for audit.

Validation:

- Report/export service tests.
- Playwright report handoff.
- Manual PDF/PNG/SVG inspection.

## Phase 8 - Performance, Accessibility, And Production Hardening

Goal: release confidence.

Deliverables:

- Performance budgets for layer counts, feature counts, worker transfer, rendering, and export.
- Render diagnostics UI and logs.
- Error boundaries and recovery for external services and failed workers.
- Keyboard navigation audit.
- Screen reader labels for toolbar, map canvas, panels, drawers, tables, and command palette.
- Reduced motion support for temporal/animated layers.
- Large-data stress tests.
- Known limitations and environment-dependent features documentation.

Acceptance:

- Map Explorer is usable under realistic professional workflows.
- Failures are visible, specific, and recoverable.
- CI and manual gates define production readiness.

Validation:

- `npm run validate:rc` when release candidate is ready.
- Targeted Playwright suites for Map Explorer, Urban bridge, report, VoxCity, large data, and accessibility.

## Phase 9 - ArcGIS/QGIS-Class GIS Workbench

Goal: move from production map workspace to professional GIS application.

Deliverables:

- Catalog/source browser.
- Connection manager for local, project, worker, DuckDB, URL, and external service sources.
- Professional contents tree with grouping, scale ranges, filters, source repair, and layer duplication.
- Layer inspector tabs for overview, source, schema, CRS, symbology, labels, filters, editing, QA, lineage, report/export, and Urban bindings.
- Virtualized attribute table.
- Field statistics and field calculator.
- Join/relate preview.
- Processing toolbox registry with searchable tools and parameter forms.
- Processing run history.
- Model/workflow builder for chained GIS operations.
- Layout/print composer for publication figures.
- Plugin/extension registry for source connectors, renderers, processing tools, and Urban method bridges.

Acceptance:

- An analyst can complete a full professional GIS workflow inside Map Explorer: connect/import data, inspect metadata, edit/select features, run processing, style outputs, compose a map figure, and publish evidence to Urban Analytics.
- Tool execution history and map outputs are reproducible.
- Unknown metadata, missing CRS, external service failures, and demo/sample sources remain visibly labeled.

Validation:

- Attribute table tests.
- Processing toolbox registry tests.
- Field calculator safety tests.
- Layout composer tests.
- Playwright for catalog -> layer inspector -> table -> processing -> layout.

See `08_ARCGIS_QGIS_GRADE_MASTERPLAN.md` and `10_CAPABILITY_PARITY_MATRIX.md`.

## Phase 10 - 3D Blocks, Zoning, Massing, And Digital Twin

Goal: make Map Explorer a 2D/3D urban design and analysis workbench.

Deliverables:

- 3D scene state slice.
- 2.5D building footprint extrusion.
- Building height/floor field picker.
- 2D/3D synchronized selection.
- Block and parcel model.
- Zoning rule engine.
- Setback/buildable-area/envelope generation.
- Massing generator for block and parcel alternatives.
- Scenario manager for baseline/proposed comparisons.
- Sunlight and shadow analysis integration.
- Terrain/elevation support where data exists.
- CityJSON source registry integration.
- 3D report/export/evidence package.

Acceptance:

- User can load or derive blocks/parcels/buildings, generate zoning envelopes and massing alternatives, compare scenario metrics, run sunlight/shadow analysis, and publish a 3D scenario as Urban Analytics evidence.
- 3D outputs include source, CRS, vertical assumptions, runtime mode, QA, rules, parameters, and reproducibility manifest.
- Demo/sample 3D geometry is never presented as real evidence.

Validation:

- 3D source metadata tests.
- Zoning envelope CRS/preflight tests.
- Massing generator deterministic tests.
- Sun/shadow assumption tests.
- Playwright/visual tests for 2.5D and 3D scene nonblank rendering.

See `09_3D_BLOCKS_DIGITAL_TWIN_PLAN.md`.

## Phase 11 - Premium VS Code GIS Design System And Motion

Goal: make Map Explorer look and feel like a polished professional GIS product, not a generic map modal.

This phase is cross-cutting. It should begin early with token and shell work, then mature through every professional GIS and 3D milestone.

Deliverables:

- GIS-specific design token alias layer mapped to Synapse IDE and Urban Analytics variables.
- VS Code-style workbench shell with activity rail, top command bar, left dock, right inspector, center canvas, bottom panel, and status bar.
- Shared GIS UI primitives for icon buttons, status chips, section headers, tabs, property grids, toolbars, empty states, progress bars, and tooltips.
- Professional catalog, contents tree, layer inspector, attribute table, processing toolbox, model builder, layout composer, and Urban bridge visual standards.
- Motion layer for hover/focus, row accents, tab transitions, panel open/close, processing progress, feature focus, layer preview, Urban handoff, and 2D/3D scene transitions.
- Reduced-motion fallbacks for every animation.
- 3D scene UI patterns for building/block inspectors, zoning rules, massing scenarios, scenario comparison, sun/shadow timeline, section/cut plane, and 3D evidence export.
- Visual QA screenshots and canvas checks for 2D, Urban bridge, layout composer, and 3D states.

Acceptance:

- Map Explorer visually belongs beside Synapse IDE and Urban Analytics.
- The interface uses compact professional GIS density: thin separators, restrained accents, stable dimensions, and no decorative card nesting.
- CRS, source health, QA, demo/sample/synthetic, environment-dependent, stale, blocked, and ready states are visible in rows, inspectors, reports, and evidence surfaces.
- 3D controls do not obscure selected block/building geometry.
- Animations are subtle, purposeful, interruptible where needed, and disabled or simplified under reduced motion.
- Visual regression gates catch overlap, clipping, blank canvases, hidden caveats, and poor small-viewport behavior.

Validation:

- Token/component tests where logic is present.
- Playwright screenshots for major workbench states.
- Reduced-motion screenshot pass.
- Canvas-pixel checks for 2D/3D nonblank rendering.
- Manual review at desktop, tablet-ish, and short viewport sizes.

See `11_PREMIUM_VSCODE_GIS_DESIGN_SYSTEM.md`, `12_MOTION_AND_3D_INTERACTION_SPEC.md`, and `13_DESIGN_IMPLEMENTATION_BLUEPRINT.md`.

## Phase Dependencies

```text
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3
                         |          |
                         v          v
                    Phase 4 -> Phase 5 -> Phase 6
                                           |
                                           v
                                      Phase 7 -> Phase 8
                                                   |
                                                   v
                                      Phase 9 -> Phase 10

Experience Design Track:
Phase 11 overlays Phase 0 through Phase 10 and becomes a release gate before production.
```

## Suggested Milestone Names

- M0: Baseline and boundaries.
- M1: Decomposed Map Explorer shell.
- M2: Source-backed layer registry.
- M3: CRS-safe spatial operations.
- M4: Professional layer workbench.
- M5: Workerized GIS workflows.
- M6: Urban Analytics bridge v1.
- M7: Publication and review workflow.
- M8: Production release hardening.
- M9: Professional GIS workbench parity.
- M10: 3D blocks and urban digital twin.
- M11: Premium GIS design system and motion gate.
