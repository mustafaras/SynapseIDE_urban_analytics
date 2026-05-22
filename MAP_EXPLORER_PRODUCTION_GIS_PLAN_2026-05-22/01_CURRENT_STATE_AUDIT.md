# 01 - Current State Audit

Date: 2026-05-22
Basis: repository inspection of Map Explorer, Urban Analytics bridge, map services, engines, and docs.

## Scope Inspected

Key files and folders:

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/`
- `src/features/urbanAnalytics/`
- `src/features/urbanAnalytics/context/`
- `src/features/urbanAnalytics/lib/types.ts`
- `src/engine/`
- `src/workers/`
- `docs/architecture/map-explorer-state-and-actions.md`
- `docs/implementation/MAP_EXPLORER_ENHANCEMENT_PLAN.md`

Useful size signals from the current codebase:

| Surface | Approx. lines | Meaning |
| --- | ---: | --- |
| `MapExplorerModal.tsx` | 5617 | High orchestration density; most urgent maintainability risk. |
| `useMapExplorerStore.ts` | 1432 | Rich state kernel; needs slice/contract discipline as features grow. |
| `MapScientificQA.ts` | 1826 | Strong QA foundation; needs universal command gating. |
| `MapWorkflowService.ts` | 2205 | Mature workflow preview/apply service; needs worker/projection hardening. |
| `MapEngineAdapter.ts` | 2965 | Broad analysis adapter layer; needs clearer boundaries and contracts. |

## Existing Strengths

### Map Runtime And UI

The main production map surface is under `src/centerpanel/components/map/`:

- `MapCanvas.tsx` owns MapLibre lifecycle, markers, popup feature inspection, map click handling, viewport updates, and external-service render errors.
- `MapWorkspaceShell.tsx` provides modal/embedded layout primitives, focus handling, rails, canvas region, and bottom timeline surface.
- `MapWorkspaceCockpit.tsx` summarizes visible stack, AOI, selection, QA, workflow state, export readiness, sync state, recommendations, and next actions.
- `MapToolbar.tsx` exposes a broad command surface with toolbar density and overflow concepts.
- `MapLayerManager.tsx` is a large layer stack and layer operations UI.
- `ScientificQAPanel.tsx`, `MapNLQueryPanel.tsx`, `MapWorkflowDrawer.tsx`, `MapReportHandoffDrawer.tsx`, and `MapReviewTimelinePanel.tsx` cover advanced workflows.

This is already a multi-panel professional surface, not a blank map.

### Map State

`useMapExplorerStore.ts` already owns:

- Open/close state.
- Viewport and pending fit-bounds requests.
- Base layer.
- Pins, bookmarks, annotations.
- Layout preferences.
- Overlay layer registry.
- Scientific QA state.
- Current bounds.
- Map evidence artifact registry.
- Selected feature IDs.
- Active AOI.
- Active analysis result layers.
- Copilot/action proposal metadata.
- Review session timeline.
- Drawing state.
- Measurements.
- Temporal player state.
- Project restore/clear actions.

This is close to the correct ownership model. The problem is not absent state; it is the need for clearer slices, versioning, invariants, and action logs.

### Layer Registry And Metadata

`mapTypes.ts`, `mapLayerMetadata.ts`, and `mapContextSummary.ts` already model:

- Layer source kind: project, imported, external, derived, demo.
- CRS status and notes.
- Geometry summary.
- Schema summary.
- License and attribution summary.
- Publication readiness.
- Render budget metadata.
- QA status and scientific QA badges.
- Reproducibility manifests.
- Evidence artifacts.
- Temporal evidence metadata.
- Scenario comparison and VoxCity handoff metadata.
- Layer registry change events.

This gives the project a strong metadata spine for production GIS.

### Analysis And Workflows

`src/services/map/` contains mature service concepts:

- `MapWorkflowService.ts`: AOI, buffer, intersect, difference, union, comparison previews/applies.
- `MapAnalysisDispatcher.ts`, `MapAnalysisRecommender.ts`, `SpatialStatsExecutionService.ts`, and `SpatialStatsExecutionQueue.ts`: map-driven analysis dispatch and execution support.
- `MapEngineAdapter.ts`: adapts spatial stats, GeoAI, indicators, simulations, and VoxCity outputs to map layers and completed runs.
- `MapScientificQA.ts`: CRS, geometry, topology, scale, provenance, temporal, and publication QA concepts.
- `MapPersistenceService.ts`, `MapExportService.ts`, `MapDataImporter.ts`, `MapDataExporter.ts`: data and session movement.
- `MapReportHandoffService.ts`, `MapPublicationOutputBindingService.ts`, `MapReviewSessionService.ts`: report/publication/review pathways.
- `MapToUrbanContextAdapter.ts` and `UrbanToMapMethodRequestAdapter.ts`: bidirectional Map/Urban bridge.

The plan should consolidate and harden these services instead of rebuilding them.

### Urban Analytics Bridge

Urban Analytics already has:

- `useUrbanContextStore.ts` for analytical context, active AOI/layer/run/code IDs, evidence artifacts, and persistence.
- `context/mapContextAdapter.ts` for applying Map context to Urban context.
- `context/mapEvidencePublisher.ts` for publishing Urban run outputs to Map Explorer.
- `context/dataFitness.ts` and `context/methodValidity.ts` for domain readiness logic.
- `UrbanEvidenceTray.tsx` for map publication visibility and evidence workflows.
- `StudyAreaPicker.tsx` and `context/studyAreaSelection.ts` for opening Map Explorer with study area preview/focused bounds.

This is a real integration foundation. The missing step is to standardize one primary bridge protocol and make it product-complete.

### Engine Foundation

The repo already includes:

- DuckDB-WASM spatial DB under `src/engine/spatial-db/`.
- WASM spatial index under `src/engine/wasm/`.
- Worker pool under `src/workers/pool/`.
- Spatial stats, network, simulation, GPU, streaming, and GeoAI-related modules.
- Data libraries for Arrow, FlatGeobuf, GeoParquet/Parquet, PMTiles, GeoTIFF, shapefile, GeoPackage, LAS, NetCDF, WMS, CSV, and JSON dependencies.

The production GIS plan should route heavy operations through these foundations.

## Major Risks And Gaps

| Risk | Severity | Evidence | Required Direction |
| --- | --- | --- | --- |
| Monolithic orchestration | High | `MapExplorerModal.tsx` is about 5617 lines. | Extract controller hooks, panels, command routing, lifecycle, and bridge listeners into bounded modules. |
| Duplicate map component families | High | `src/centerpanel/components/map/` and `src/components/map/` both contain map/layer/drawing/filter/export code. | Decide canonical production surface; migrate reusable logic into services/hooks; deprecate duplicates. |
| Data source persistence is not production-complete | High | Store intentionally avoids persisting large GeoJSON; layer metadata is richer than source lifecycle. | Add source registry, source handles, durable local project references, worker table references, and restore policies. |
| CRS enforcement needs an execution contract | Critical | CRS metadata exists, but operations still need universal projection rules. | Add projection service, operation preflight, projected execution CRS, and hard blockers for invalid planar calculations. |
| Some geometry work can remain main-thread | High | Turf appears in UI components and workflow services. | Move large operations to workers/geos-wasm/SpatialDB; reserve main thread for small previews. |
| QA not uniformly command-gating | High | Strong QA engine exists, but every export/publish/analysis/edit command needs consistent gate behavior. | Centralize command preflight with QA blockers, acknowledgement policy, and evidence propagation. |
| Bridge protocol fragmentation | Medium | There are both service-level MapToUrban/UrbanToMap adapters and Urban context adapter event paths. | Create one versioned MapUrbanBridge contract and compatibility adapters for older paths. |
| External services are environment-dependent | Medium | Map canvas has CORS/render warnings; external service services exist. | Add provider registry, credentials/proxy configuration, health checks, cache metadata, and visible fallback states. |
| Action undo/review is partial | Medium | Review timeline and proposal statuses exist, but a general action history is not obvious. | Add map action command model with preview/apply/revert/audit where practical. |
| Report/export professional composition needs hard gates | Medium | Report handoff exists; production print/export should verify legend, scale, CRS, attribution, and QA. | Add composer gate and snapshot verification tests. |
| Accessibility and responsiveness need release-level testing | Medium | Shell has focus/ARIA support; large surface can regress. | Add Playwright suites for modal, rails, keyboard, constrained viewports, and reduced motion. |
| Browser-scale limits remain product risks | High | Browser-first ADR acknowledges constraints. | Add performance budgets, large-data modes, chunking, streaming, workers, and truthful user messaging. |

## Current-State Product Assessment

| Area | Current State | Production Target |
| --- | --- | --- |
| Layer management | Broad and feature-rich. | Canonical, inspectable, source-backed, reversible, and tested under large stacks. |
| Data import/export | Many paths exist. | Format support matrix, source handles, memory budgets, restore, and QA diagnostics. |
| Drawing/editing | Drawing and AOI exist. | Vertex editing, snapping, topology validation, projected/geodesic measurements, and undo. |
| Querying | NL query and visible layer querying exist. | Query planner, SQL/attribute/spatial table, safe execution scope, result provenance. |
| Analysis | Strong adapter/workflow base. | Unified command pipeline from Urban methods and Map UI, with workerized execution and QA gates. |
| Urban integration | Strong but distributed. | One versioned bridge with clear handoff state machine and contract tests. |
| Reporting | Handoff exists. | Publication composer, reproducible figures, export QA, report/dashboard bindings. |
| Production ops | Many tests exist. | Release gates, stress tests, visual checks, telemetry, and known-limitations register. |

## Immediate Recommendations

1. Freeze architectural boundaries before adding more UI.
2. Split `MapExplorerModal.tsx` into controller hooks and panel containers.
3. Establish `MapUrbanBridge` as the single typed versioned bridge.
4. Build a source registry and data handle model before broadening import/export.
5. Enforce CRS and operation preflight centrally.
6. Convert high-impact map actions into command objects with preview, apply, audit, and revert metadata.
7. Add release-level validation gates around large data, external services, report export, and Urban Analytics integration.

