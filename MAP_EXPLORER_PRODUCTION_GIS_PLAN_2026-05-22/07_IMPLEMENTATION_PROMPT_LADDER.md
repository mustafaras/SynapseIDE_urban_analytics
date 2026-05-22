# 07 - Implementation Prompt Ladder

Date: 2026-05-22

This prompt ladder is a proposed execution sequence. Each prompt is intentionally bounded so future agents can implement one slice without destabilizing the whole GIS surface.

## Prompt 01 - Baseline Inventory And Canonical Surface Decision

Objective: establish a safe baseline.

Tasks:

- Inventory all Map Explorer entry points, services, stores, and duplicate map components.
- Confirm `src/centerpanel/components/map/` as the production Map Explorer surface.
- Identify which `src/components/map/` modules should be reused, migrated, or deprecated.
- Add or update an architecture note summarizing the decision.
- Add smoke tests only if current coverage is missing.

Acceptance:

- A canonical map surface decision exists.
- No behavior changes beyond documentation/tests.
- Current dirty unrelated worktree changes are not touched.

## Prompt 02 - MapExplorerModal Controller Extraction

Objective: reduce monolith risk.

Tasks:

- Extract lifecycle, panel layout, command handling, workflow, report, and Urban bridge logic into hooks/services.
- Keep `MapExplorerModal.tsx` as a shell and composition surface.
- Preserve existing UI behavior.
- Add targeted tests for extracted logic.

Acceptance:

- `MapExplorerModal.tsx` is materially smaller and easier to inspect.
- Existing Map Explorer tests pass.
- No feature behavior is lost.

## Prompt 03 - Store Slice Boundaries And Selectors

Objective: make state growth safe.

Tasks:

- Define store slices for viewport, layers, sources, selection, AOI, QA, evidence, review, temporal, layout, and bridge.
- Preserve public store API where possible.
- Add fine-grained selectors.
- Document persistence policy per slice.

Acceptance:

- Store invariants are tested.
- Persisted and transient state are explicit.
- Large geometry remains out of persisted Zustand.

## Prompt 04 - Source Registry V1

Objective: make layers source-backed.

Tasks:

- Add `MapSourceRegistry` service and typed source handle model.
- Update import path to create source handles.
- Add source ID reference to overlay layer metadata.
- Add source restore statuses.

Acceptance:

- Imported layers can cite source handles.
- Missing/unrestored source state is visible and testable.
- Urban context summary includes source references when available.

## Prompt 05 - Source Profiling And Format Support Matrix

Objective: professional data I/O preflight.

Tasks:

- Standardize profiling for GeoJSON, CSV, Arrow/GeoParquet, FlatGeobuf/PMTiles, external services, and raster formats currently supported.
- Emit schema, CRS, extent, feature count, size estimate, skipped rows, license/attribution, and worker readiness.
- Create docs source support matrix.

Acceptance:

- Import UI can preview source quality before commit.
- Tests cover malformed, missing CRS, empty, and large sample cases.

## Prompt 06 - CRS Preflight Service

Objective: enforce CRS truth.

Tasks:

- Add `MapProjectionService`, `ExecutionCrsPlanner`, and `CrsPreflight`.
- Wire CRS preflight into measurement, buffer, overlay, analysis, and report/export.
- Add blockers for planar metric operations in EPSG:4326 or unknown CRS.

Acceptance:

- Tests prove invalid CRS operations are blocked.
- UI states exact CRS issue and remedy.
- Urban method `requiredCrs` is honored.

## Prompt 07 - Map Command Lifecycle

Objective: unify preview/apply/audit/revert.

Tasks:

- Add typed command model.
- Add preflight and preview result types.
- Route at least layer remove, style apply, workflow apply, and report handoff through command lifecycle.
- Log review timeline entries.

Acceptance:

- High-impact actions produce audit records.
- Revert support is available where practical.
- Blocked actions explain why.

## Prompt 08 - Layer Inspector Workbench

Objective: make layers professionally inspectable.

Tasks:

- Add inspector tabs for overview, source, schema, CRS, QA, style, lineage, and report/export.
- Surface source kind, runtime mode, feature count, CRS, license, attribution, and QA caveats.
- Link analysis layers to run/manifest/evidence IDs.

Acceptance:

- Analyst can understand layer readiness without developer tools.
- Unknown metadata remains visible as unknown.
- Component and Playwright tests cover key tabs.

## Prompt 09 - Attribute Table And Selection Sync

Objective: make queryable layers work like GIS layers.

Tasks:

- Add virtualized attribute table for queryable vector layers.
- Implement sort, filter, select rows, zoom/focus selected features.
- Sync selected feature IDs with map popup and Urban context summary.

Acceptance:

- Table selection updates map and Urban summary.
- Large layers remain bounded/virtualized.
- Tests cover sorting/filtering/selection.

## Prompt 10 - Style Editor And Legend Contract

Objective: professional cartography controls.

Tasks:

- Add style editor for choropleth, categorical, graduated/proportional symbols, labels, opacity, and no-data styling.
- Ensure style changes update legends, layer metadata, report handoff, and export.
- Add cartography warnings for poor classification or missing uncertainty.

Acceptance:

- Visual style and legend metadata remain synchronized.
- Reports use the same legend as the map.
- Tests cover style serialization.

## Prompt 11 - Workerized Geometry Operations

Objective: move GIS computation off the main thread.

Tasks:

- Route buffer/intersect/difference/union to worker/geos-wasm/SpatialDB for medium/large inputs.
- Keep tiny previews bounded.
- Add progress, cancellation, and failure state.

Acceptance:

- Main thread does not stall on large operations.
- Result layers carry CRS, provenance, parameters, QA, and manifest.
- Tests cover worker success/failure/cancel.

## Prompt 12 - AOI And Editing Upgrade

Objective: make study areas production-ready.

Tasks:

- Add AOI creation from viewport, selected features, drawn polygon, geocoded place, and Urban study area.
- Add vertex editing and validation.
- Add optional snapping if feasible.
- Add AOI QA caveats and audit entries.

Acceptance:

- AOI state is valid, reportable, and accepted by Urban method requests.
- Edits are previewed/audited.
- CRS and topology caveats are visible.

## Prompt 13 - MapUrbanBridgeService V1

Objective: unify bidirectional integration.

Tasks:

- Create canonical bridge service with Map-to-Urban and Urban-to-Map payload builders.
- Add compatibility adapters for existing event paths.
- Contract-test payloads and method request previews.

Acceptance:

- One service owns bridge semantics.
- No raw heavy geometry travels through bridge events.
- Existing Urban flows still work.

## Prompt 14 - Urban Method Compatibility Rail

Objective: make Urban requests visible in Map Explorer.

Tasks:

- Add Map right rail panel for active Urban method request.
- Show compatible layers, missing fields, CRS status, AOI requirements, QA blockers, and available actions.
- Let user focus compatible layers and preview workflows.

Acceptance:

- Urban method "Prepare in Map" has a complete map-side UI.
- Missing prerequisites are explicit.
- Tests cover ready, warning, and blocked requests.

## Prompt 15 - Map Context Driven Urban Recommendations

Objective: make map work guide Urban Analytics.

Tasks:

- Use map context payloads to update Urban recommendations and data fitness.
- Ensure unknown CRS/fields/fitness stay unknown.
- Show which map layers/AOI triggered recommendation hints.

Acceptance:

- Urban panel responds to map context changes.
- Data fitness never marks demo/unknown metadata as production-ready.
- `npm run test:analytics` passes.

## Prompt 16 - Evidence Publication Hardening

Objective: trustworthy map-derived evidence.

Tasks:

- Ensure map result publication creates immutable Urban evidence with layer/source/run/manifest references.
- Add stale/superseded behavior for changed layers.
- Add QA propagation from map layers to Urban evidence.

Acceptance:

- Evidence artifacts remain immutable.
- Stale/blocked states are visible.
- Tests cover demo/synthetic/unknown metadata.

## Prompt 17 - Publication Figure Composer

Objective: professional map outputs.

Tasks:

- Build figure composer with title, legend, scale, north arrow, attribution, CRS, QA caveats, timestamp, and visible layers.
- Use same metadata for report handoff and exports.
- Add snapshot preflight.

Acceptance:

- Export/report figure is reproducible and publication-ready when gates pass.
- Blocked outputs state missing legend/CRS/attribution/QA issue.

## Prompt 18 - Review Timeline And Action Export

Objective: auditability.

Tasks:

- Expand review events for imports, source restore, style changes, CRS changes, analyses, reports, exports, and Urban handoffs.
- Export review timeline as JSON and Markdown.

Acceptance:

- Analyst can reconstruct what happened in a map session.
- Timeline references source/layer/run/evidence IDs.

## Prompt 19 - External Service Production Path

Objective: environment-dependent services without false readiness.

Tasks:

- Add provider registry and health checks for WMS/WFS/XYZ/OSM/Overpass or current service set.
- Add credential/proxy/cors statuses.
- Add cache/restore metadata.

Acceptance:

- External failures are visible and actionable.
- Reports and Urban evidence carry environment-dependent caveats.

## Prompt 20 - Performance And Accessibility Release Pass

Objective: make the system shippable.

Tasks:

- Add render diagnostics, performance budgets, large-data tests, accessibility checks, and reduced-motion verification.
- Add known limitations doc.
- Run release validation commands.

Acceptance:

- Map Explorer meets release scorecard.
- Residual risks are documented with concrete limits.
- `npm run validate:rc` is run or blockers are documented.

## Prompt 21 - Professional GIS Catalog And Connection Manager

Objective: add the project/catalog surface expected in desktop GIS.

Tasks:

- Build catalog panel for project sources, imported files, external services, worker/DuckDB sources, generated outputs, and demo packs.
- Add connection records for URL/service sources without storing secrets in layer metadata.
- Add source health and restore state.
- Link catalog items to layer creation.

Acceptance:

- User can browse, reconnect, repair, and add sources from a catalog.
- Broken/unavailable sources are visible and actionable.

## Prompt 22 - Professional Contents Tree And Layer Inspector

Objective: upgrade layer management to GIS contents-pane depth.

Tasks:

- Add layer groups, scale ranges, definition filters, duplicate layer, source repair, and layer properties.
- Add inspector tabs: source, schema, CRS, style, labels, filters, editing, QA, lineage, report/export, Urban bindings.

Acceptance:

- Layer state is inspectable and editable through a professional properties surface.

## Prompt 23 - Attribute Table, Field Stats, And Field Calculator

Objective: make attribute workflows first-class.

Tasks:

- Build virtualized attribute table.
- Add sort/filter/search/select/zoom-to-selected.
- Add numeric/categorical/temporal field profiles.
- Add safe field calculator for derived output layers.
- Feed field availability and missingness to Urban data fitness.

Acceptance:

- Attribute table and map selections stay synchronized.
- Field-derived outputs preserve provenance and QA.

## Prompt 24 - Processing Toolbox Registry

Objective: build the Map Explorer equivalent of a processing/geoprocessing toolbox.

Tasks:

- Add processing tool registry with categories, parameter schemas, CRS requirements, execution mode, QA gates, and Urban method links.
- Implement searchable toolbox UI.
- Wrap existing workflow and analysis services as toolbox tools.

Acceptance:

- At least 15 production tools are available through a unified toolbox.
- Every tool has preflight, preview/apply, logs, and output manifest.

## Prompt 25 - Model Builder And Batch Processing

Objective: allow reproducible chained GIS workflows.

Tasks:

- Add step-based model builder.
- Support source inputs, tool steps, intermediate outputs, final outputs, and parameter binding.
- Add batch execution across AOIs/layers where safe.
- Generate Synapse IDE code artifact from model manifest.

Acceptance:

- A multi-step GIS workflow can be saved, rerun, exported, and published to Urban Analytics.

## Prompt 26 - Layout Composer And Map Book

Objective: replace screenshot-only outputs with professional cartographic layouts.

Tasks:

- Add map layout composer with map frame, legend, scale bar, north arrow, CRS, attribution, QA caveats, dynamic text, inset map, and chart/table slots.
- Add export presets.
- Add figure restore metadata.

Acceptance:

- Published figures are reproducible and visually/provenance complete.

## Prompt 27 - 3D Scene Runtime And 2.5D Building Extrusion

Objective: establish 3D scene foundation.

Tasks:

- Add 3D scene store slice.
- Add 2.5D building extrusion from footprint + height/floor fields.
- Add 2D/3D selection sync.
- Add building inspector.
- Add runtime mode and QA metadata.

Acceptance:

- Existing building layers can be explored in 2.5D/3D and published with correct caveats.

## Prompt 28 - Block, Parcel, And Zoning Rule Engine

Objective: introduce real urban block planning primitives.

Tasks:

- Add block/parcel data model.
- Add zoning rule table and editor.
- Assign zoning rules to parcels/blocks.
- Calculate existing FAR, coverage, block area, parcel area, and basic capacity.

Acceptance:

- Blocks/parcels/zoning become first-class map/Urban Analytics entities.

## Prompt 29 - Zoning Envelope And Massing Generator

Objective: generate 3D development scenarios.

Tasks:

- Implement buildable area from setbacks in projected CRS.
- Generate zoning envelopes.
- Generate massing alternatives with FAR/height/coverage constraints.
- Add scenario manager and baseline/proposed comparison.

Acceptance:

- User can generate and compare at least two block massing scenarios with reproducible metrics.

## Prompt 30 - Sunlight, Shadow, And 3D Scenario Evidence

Objective: make 3D scenario outputs evidence-ready.

Tasks:

- Integrate sunlight/shadow simulation with generated/existing 3D geometry.
- Add temporal playback and scenario comparison metrics.
- Add 3D report/evidence publication.
- Add CityJSON/3D source references where available.

Acceptance:

- 3D scenarios can be analyzed, reported, and published to Urban Analytics with assumptions and QA.

## Prompt 31 - GIS Token Bridge And Design Foundations

Objective: create the design layer that lets Map Explorer use Synapse IDE and Urban Analytics premium styling without local one-off colors.

Tasks:

- Add GIS alias tokens for surfaces, text, borders, accents, status, radius, density, typography, focus, and motion.
- Map aliases to existing Synapse IDE, Urban Analytics, and Map Explorer design tokens.
- Document compact/default/relaxed density rules.
- Add status mapping for ready, caveat, unknown, demo, synthetic, environment-dependent, stale, blocked, and running states.

Acceptance:

- New Map Explorer UI can style itself through `--gis-*` aliases.
- No major GIS component needs hard-coded application colors.
- Reduced-motion variables are available before component animation work begins.

## Prompt 32 - Premium VS Code GIS Workbench Shell

Objective: make Map Explorer feel like a professional workbench shell.

Tasks:

- Add or refactor shell pieces for activity rail, top command bar, left dock, center canvas, right inspector dock, bottom panel, resizers, and status bar.
- Use VS Code-style flat icon rail with thin active accent.
- Preserve current Map Explorer behavior while slotting existing panels into the new shell.
- Keep map/scene full-bleed inside the center workspace.

Acceptance:

- Map Explorer visually belongs beside Synapse IDE.
- The shell is dense, stable, resizable, and keyboard reachable.
- The map remains the dominant surface.

## Prompt 33 - Shared GIS UI Primitives

Objective: stop duplicating visual treatment across Map Explorer panels.

Tasks:

- Add shared primitives for icon buttons, status chips, tabs, section headers, property grids, toolbars, empty states, progress bars, and tooltips.
- Ensure icon-only controls have accessible labels.
- Use compact professional dimensions and stable row/control heights.
- Add disabled-state reason patterns.

Acceptance:

- Catalog, contents tree, inspector, toolbox, table, layout composer, and 3D panels share one visual language.
- Critical states are never conveyed by color or icon alone.

## Prompt 34 - Catalog, Contents Tree, And Inspector Redesign

Objective: apply professional GIS styling to the main operator panels.

Tasks:

- Redesign catalog/source browser rows with health, restore, demo/sample, external-service, and blocked states.
- Redesign contents tree with groups, active layer accent, visibility/selectability/editability indicators, scale range, filters, and QA warnings.
- Redesign layer inspector tabs and property groups for overview, source, schema, CRS, style, labels, filters, editing, QA, lineage, Urban bindings, and export.

Acceptance:

- Users can understand source/layer readiness without developer tools.
- Long layer names, source names, CRS labels, and field names do not break layout.
- Urban Analytics compatibility and evidence states are visually harmonized.

## Prompt 35 - Attribute Table, Toolbox, And Layout Composer Design

Objective: give professional GIS work surfaces a unified premium interaction style.

Tasks:

- Apply compact table styling with sticky headers, virtualized rows, selected row sync, field type chips, null/unknown value states, and field profile drawer.
- Apply processing toolbox styling with searchable tools, parameter forms, implementation status, runtime mode, CRS requirements, blocked reasons, progress, and logs.
- Apply layout composer styling for map frame, legend, scale bar, north arrow, attribution, CRS, QA caveats, inset maps, and export preflight.

Acceptance:

- Attribute, processing, and layout workflows look like production GIS tools.
- Blocked and caveat states are visible before execution/export.
- Scientific metadata travels into export preview.

## Prompt 36 - Motion System And Reduced Motion Gate

Objective: add subtle premium animation without harming accessibility or spatial trust.

Tasks:

- Implement shared motion classes or CSS variables for fade-in, panel-in, accent-grow, status-flash, feature-pulse, progress, and layer-fade patterns.
- Apply motion to hover/focus, row selection, tab transitions, dock open/close, processing progress, layer previews, feature focus, and Urban handoff.
- Add `prefers-reduced-motion` fallbacks to every animated CSS Module.
- Avoid shimmer, large glow, infinite warning pulse, icon scaling, and animated scientific counters.

Acceptance:

- Motion is fast, quiet, purposeful, and reduced-motion safe.
- UI dimensions do not shift on hover/focus/selection.
- Spatial features never animate in a way that implies false location or metric change.

## Prompt 37 - 3D Block And Scenario Interaction Design

Objective: make 3D blocks, zoning, massing, and sun/shadow workflows feel first-class.

Tasks:

- Add 3D mode strip styling for inspect, select, measure, edit height, compare scenarios, sun/shadow, section, and camera bookmark modes.
- Add building, block/parcel, zoning, massing scenario, and sun/shadow panels using the shared GIS primitives.
- Add scenario comparison strip and timeline styling.
- Ensure selected 3D geometry remains visible and overlays stay compact.

Acceptance:

- 3D block workflows look like professional planning tools.
- Generated scenario/massing outputs are clearly distinguished from existing real geometry.
- Vertical assumptions, source mode, terrain, CRS, and QA states are visible.

## Prompt 38 - Visual QA And Design Release Gate

Objective: prevent professional UI regressions.

Tasks:

- Add Playwright screenshot coverage for shell, catalog, contents, inspector, table, toolbox, Urban bridge, layout composer, 2.5D extrusion, 3D scenario comparison, and reduced-motion states.
- Add canvas nonblank checks for 2D and 3D views.
- Add checks for small/short viewport overlap and clipped text.
- Add manual design review checklist for desktop, tablet-ish, high contrast, and reduced motion.

Acceptance:

- Blank canvas, hidden caveats, overlapping UI, clipped critical labels, and reduced-motion regressions are caught before release.
- Design QA becomes part of the production GIS release gate.
