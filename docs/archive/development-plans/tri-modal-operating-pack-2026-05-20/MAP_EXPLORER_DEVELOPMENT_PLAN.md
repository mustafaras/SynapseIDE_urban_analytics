# Map Explorer - Premium Scientific Development Plan
## A Spatial Operating Surface Synchronized With Synapse IDE and Urban Analytics

> Document type: Strategic Engineering, Scientific GIS, and Premium UX Plan - Module 2 of a Three-Module Sequence  
> Module sequence: Synapse IDE -> Map Explorer -> Urban Analytics Modal  
> Status: Proposed implementation-grade development plan  
> Document version: 1.0  
> Date: 2026-05-02  
> Audience: senior front-end engineers, GIS platform engineers, urban analytics researchers, scientific UX designers, QA leads, product owners  
> Companion plans: `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`, `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`  
> Existing Map Explorer references: `docs/implementation/MAP_EXPLORER_ENHANCEMENT_PLAN.md`, `docs/map-explorer-workflow-guide.md`, `docs/architecture/map-explorer-state-and-actions.md`, `docs/release/map-explorer-scientific-release-checklist.md`

---

## 0. Reading Guide

This document is the dedicated Map Explorer plan for the Synapse Workbench. It is written after reviewing the existing Synapse IDE plan, the Urban Analytics plan, the Map Explorer source files, the Map Explorer services, the map architecture documentation, the workflow guide, the scientific release checklist, and the relevant test surface.

The plan treats Map Explorer as the spatial operating surface of the application. It is not a detached map viewer. It is the module that owns viewport, layers, AOI, selections, spatial QA, external geospatial data, map workflows, report snapshots, publication exports, temporal playback, drawing, measurement, and map-derived evidence.

The plan does not replace the existing Map Explorer prompt ledger or enhancement plan. Those documents are retained as implementation history and previous milestone guidance. This plan is the synchronized, forward-looking, premium development plan that must align with:

1. The Synapse IDE plan, where code, files, manifests, notebooks, generated analysis scripts, and AI editing live.
2. The Urban Analytics plan, where scientific methods, indicators, evidence artifacts, data fitness, report/dashboard bindings, and methodology guidance live.
3. The Map Explorer codebase, where spatial state, layers, QA, workflows, publication maps, and map report handoffs already exist.

How to read this document:

- Sections 1-4 define the product charter, repository-derived baseline, scientific target, and alignment with the other two plans.
- Sections 5-8 define the architecture, synchronization protocol, state ownership, and target domain model.
- Sections 9-15 provide the file-by-file implementation plan and track-by-track engineering roadmap.
- Sections 16-21 define premium UX, scientific QA, layer/data governance, workflows, 3D/VoxCity integration, and publication outputs.
- Sections 22-26 define performance, accessibility, testing, phased rollout, risks, and the definition of done.
- Section 27 provides implementation prompts to execute the plan in order.
- Appendices provide file ownership and validation indices.

Non-goals:

- Do not rebuild Synapse IDE inside Map Explorer.
- Do not rebuild the Urban Analytics methodology catalog inside Map Explorer.
- Do not duplicate report-builder, dashboard-builder, or education-module state.
- Do not replace the Map Explorer store with a new global state owner.
- Do not hide known residual risks such as browser memory ceilings, external-service dependency, CRS inference limits, or model runtime availability.

Primary goal:

Turn Map Explorer into a premium, research-grade, synchronized spatial cockpit where every visual layer, derived layer, map workflow, QA caveat, export, and report handoff is traceable, reversible, scientifically explicit, and ready to synchronize with Synapse IDE and Urban Analytics.

---

## 0.5. Table of Contents

| Section | Title |
|---|---|
| 0 | Reading Guide |
| 0.5 | Table of Contents |
| 1 | Product Charter |
| 2 | Repository-Derived Baseline |
| 3 | Current-State Audit |
| 4 | Alignment With Synapse IDE and Urban Analytics Plans |
| 5 | Scientific GIS Doctrine |
| 6 | Premium UX Doctrine |
| 7 | Target Architecture |
| 8 | Three-Module Synchronization Contract |
| 9 | Target Domain Model |
| 10 | State and Persistence Plan |
| 11 | File-by-File Implementation Blueprint |
| 12 | Track-by-Track Development Plan |
| 13 | Map Explorer Component Plan |
| 14 | Map Services Plan |
| 15 | Data, Layer, and Evidence Governance |
| 16 | Premium UX Specification |
| 17 | Scientific QA and Research Validity |
| 18 | Workflow, Analysis, and Engine Integration |
| 19 | Synapse IDE Synchronization |
| 20 | Urban Analytics Synchronization |
| 21 | Report, Dashboard, Education, and Publication Outputs |
| 22 | VoxCity, 3D, Temporal, and Simulation Integration |
| 23 | Performance, Workers, Memory, and Chunking |
| 24 | Accessibility and Keyboard Model |
| 25 | Test and Validation Matrix |
| 26 | Phased Roadmap and Risk Register |
| 27 | Developer Prompt Pack |
| 28 | Final Definition of Done |
| Appendix A | Files-to-Touch Master Index |
| Appendix B | Existing Test Surface |
| Appendix C | Shared Vocabulary |

---

## 1. Product Charter

### 1.1 The Map Explorer's Role

Map Explorer is the spatial operating surface of Synapse Workbench. It owns the live map, the visible spatial evidence stack, and the primary spatial context that the rest of the workbench uses.

The module must support professional users who:

- import local geospatial data;
- connect to external geospatial services;
- inspect layer metadata, CRS, feature counts, provenance, and QA caveats;
- draw AOIs and perform measurements;
- select features and dispatch them into analytical workflows;
- render spatial-statistics and GeoAI outputs;
- compare layers, scenarios, and temporal frames;
- bridge 2D map evidence into VoxCity/3D workflows;
- export publication-grade maps and data packages;
- queue scientifically defensible map evidence into reports;
- synchronize map context with Urban Analytics and Synapse IDE.

Map Explorer should be the place where an analyst answers:

- What spatial evidence is visible?
- Where did it come from?
- Is it scientifically fit for the intended action?
- What does the current map context imply for the active analysis?
- Which outputs can be published, exported, reported, or reproduced?

### 1.2 Product North Star

Map Explorer should feel like a premium GIS and spatial intelligence cockpit inside a browser-native urban analytics environment. It should be dense, calm, fast, trustworthy, and instrument-like.

Premium does not mean decorative. Premium means:

- every layer is inspectable;
- every action has a reason, prerequisite, and result;
- every disabled state explains the missing condition;
- every derived output carries provenance;
- every map export carries scientific cartographic components;
- every workflow handoff is typed and reversible where practical;
- every report insert includes QA caveats and source lineage;
- every connection to IDE and Urban Analytics preserves context.

### 1.3 Primary User Journeys

Journey A: Layer-to-analysis

1. Analyst opens Map Explorer from Urban Analytics or the center panel.
2. Imports GeoJSON, CSV, KML, GPX, Arrow, GeoParquet, or an external service layer.
3. Reviews layer metadata, CRS, feature count, queryability, provenance, and QA.
4. Draws or selects an AOI.
5. Uses analysis recommendations or map workflow drawer to prepare a spatial workflow.
6. Publishes a derived analysis layer.
7. Sends the output to Urban Analytics as an evidence artifact.
8. Opens reproducible script and manifest in Synapse IDE.
9. Inserts a map finding into the report builder.

Journey B: Urban method-to-map

1. User selects a methodology or indicator in Urban Analytics.
2. Urban Analytics requests compatible map context from Map Explorer.
3. Map Explorer surfaces compatible layers, selected AOI, QA blockers, and available workflows.
4. User previews the map action before applying it.
5. The output layer returns to Urban Analytics as evidence with map provenance.

Journey C: IDE code-to-map

1. User edits a script or manifest in Synapse IDE.
2. IDE emits a map artifact or layer-ready data reference.
3. Map Explorer validates geometry, CRS, schema, and source metadata.
4. The layer is added to the map stack with evidence lineage.
5. QA, report handoff, and Urban Analytics context update automatically.

Journey D: Publication map

1. User prepares a visible layer stack.
2. User reviews QA, legend, scale, north arrow, attribution, and title metadata.
3. User exports PDF/PNG/SVG or inserts a report handoff.
4. Export package includes map composition options, layer references, caveats, and reproducibility metadata.

### 1.4 Product Rules

- Map Explorer owns spatial viewport, selected features, active AOI, visible layers, map QA, drawing, measurements, temporal playback, active map result layers, and map review session state.
- Urban Analytics owns scientific method selection, indicator interpretation, data fitness, report/dashboard/education evidence artifacts, and methodology dossier.
- Synapse IDE owns code files, generated scripts, manifests, notebooks, file state, terminal state, and code execution/editing.
- Reporting owns report documents, report sections, citations, compiled exports, and pending report inserts.
- Dashboard owns dashboard widgets, chart binding, layouts, scenario dashboards, and dashboard persistence.

No module should take over another module's ownership boundary. Synchronization must happen through typed stores, selectors, events, and explicit artifact contracts.

---

## 2. Repository-Derived Baseline

### 2.1 Existing Map Explorer Core

The current codebase already contains a mature Map Explorer implementation.

Primary shell and modal:

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/MapExplorerButton.tsx`
- `src/centerpanel/CenterPanelShell.tsx`

Map component surface:

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapPinSidebar.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/CartographyRecommendationList.tsx`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/mapTokens.ts`

Legacy or adjacent map components:

- `src/centerpanel/components/MapDrawingManager.tsx`
- `src/centerpanel/components/MapMeasurementTool.tsx`
- `src/centerpanel/components/MapContextMenu.tsx`
- `src/centerpanel/components/MapChoroplethLayer.tsx`
- `src/centerpanel/components/MapClusterViz.tsx`
- `src/centerpanel/components/MapHeatmapLayer.tsx`
- `src/centerpanel/components/MapHotSpotViz.tsx`
- `src/centerpanel/components/MapEmergingHotSpotViz.tsx`
- `src/centerpanel/components/MapTemporalPlayer.tsx`
- `src/centerpanel/components/MapVoxCityOverlay.tsx`
- `src/centerpanel/components/MapSymbolLayer.tsx`
- `src/centerpanel/components/MapDataImportHubDialog.tsx`
- `src/centerpanel/components/MapCsvImportDialog.tsx`
- `src/centerpanel/components/MapColumnarImportDialog.tsx`
- `src/centerpanel/components/MapDataExportDialog.tsx`
- `src/centerpanel/components/MapExportDialog.tsx`
- `src/centerpanel/components/MapServiceDialog.tsx`
- `src/centerpanel/components/MapBookmarkBar.tsx`
- `src/centerpanel/components/MapAnnotationLayer.tsx`

State owner:

- `src/stores/useMapExplorerStore.ts`

Key map services:

- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapExportService.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapDataImporter.ts`
- `src/services/map/MapDataExporter.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapReviewSessionService.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapAnalysisRecommender.ts`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/services/map/MapNLQueryBuilder.ts`
- `src/services/map/MapSyncService.ts`
- `src/services/map/ExternalServiceConnector.ts`
- `src/services/map/ExternalServiceQueue.ts`
- `src/services/map/SpatialStatsExecutionService.ts`
- `src/services/map/SpatialStatsExecutionQueue.ts`
- `src/services/map/MapAnalysisBounds.ts`
- `src/services/map/voxCitySelectionService.ts`
- `src/services/map/voxCityProjection.ts`

Spatial engines:

- `src/engine/spatial-stats/*`
- `src/engine/spatial-db/*`
- `src/engine/geoai/*`
- `src/engine/wasm/*`

Adjacent consumers:

- Urban Analytics: `src/features/urbanAnalytics/*`
- Synapse IDE bridge: `src/services/editorBridge.ts`, `src/services/editor/bridge.ts`
- Reporting: `src/services/reporting/*`
- Dashboard: `src/features/dashboard/*`
- Education: `src/features/education/*`
- Center workflows: `src/centerpanel/Flows/*`

### 2.2 Existing Documentation

The codebase already has Map Explorer-specific documentation:

- `docs/implementation/MAP_EXPLORER_ENHANCEMENT_PLAN.md`
- `docs/map-explorer-workflow-guide.md`
- `docs/architecture/map-explorer-state-and-actions.md`
- `docs/release/map-explorer-scientific-release-checklist.md`
- `docs/implementation/map-explorer-prompt-ledger.md`
- prompt completion documents under `docs/implementation/map-explorer-prompt-*.md`

Important baseline from existing documentation:

- Map Explorer is already treated as a scientific spatial workspace.
- The architecture rule is structured state first, UI rendered from state.
- Map Explorer state is centered on `useMapExplorerStore.ts` and `MapExplorerModal.tsx`.
- Layout primitives already exist: `MapWorkspaceShell`, `MapPanelRail`, `MapCanvasRegion`, `MapBottomTimeline`.
- The layer registry must carry source type, feature count, visibility, queryability, CRS, QA, and provenance.
- Scientific QA covers CRS, geometry validity, scale, temporal metadata, source lineage, queryability, and worker readiness.
- Report handoff packages viewport, snapshot metadata, layer context, CRS, QA caveats, and provenance.
- Validation duties already include typecheck, build, tests, lint, smoke, and targeted Playwright suites.

### 2.3 Existing Test Surface

Map Explorer has substantial unit and E2E coverage. Existing tests include:

- `e2e/map-modal-layout.spec.ts`
- `e2e/map-context-and-geojson.spec.ts`
- `e2e/map-csv-kml-gpx-import.spec.ts`
- `e2e/map-columnar-io.spec.ts`
- `e2e/map-image-export.spec.ts`
- `e2e/map-choropleth.spec.ts`
- `e2e/map-point-symbology.spec.ts`
- `e2e/map-spatial-stats-renderers.spec.ts`
- `e2e/map-temporal-player.spec.ts`
- `e2e/map-report-handoff.spec.ts`
- `e2e/map-geoai-bridge.spec.ts`
- `e2e/map-explorer-stability.spec.ts`
- service tests under `src/services/map/__tests__`
- map component tests under `src/centerpanel/components/map/__tests__`
- modal dispatch tests under `src/centerpanel/components/__tests__`

This plan must preserve those tests and extend them. The existing coverage is a strength, not a reason to avoid deeper refactoring.

---

## 3. Current-State Audit

### 3.1 Strengths

Map Explorer already has the following strengths:

- Mature Zustand store with viewport, base layer, pins, bookmarks, annotations, layer stack, selected features, active AOI, active analysis results, review session, drawing, measurement, temporal player, and project restore/clear actions.
- Rich overlay layer metadata in `mapTypes.ts`, including data version, analysis result metadata, dataset context, columnar metadata, external service metadata, EO metadata, scientific QA metadata, cartography review metadata, provenance, source kind, QA status, and queryability.
- Robust import paths for GeoJSON, CSV, KML, KMZ, GPX, Arrow, and GeoParquet.
- Export paths for visible layers, GeoJSON, GeoParquet, and publication map composition.
- Scientific QA service with geometry, CRS, topology, metadata, scale, temporal, comparison, and analysis gate checks.
- Workflow service for AOI, buffer, intersect, union, difference, and comparison workflows.
- Engine adapter that converts spatial-statistics, GeoAI, simulation, and analysis outputs into map layers and completed runs.
- Report handoff service that builds structured report inserts with citations, caveats, reproducibility, references, and map snapshots.
- Review timeline service for auditable map events.
- Analysis recommender and cartography advisor.
- Natural-language query builder for visible queryable layers.
- External service connector for WMS, WMTS, WFS, XYZ, Overpass, and CityJSON.
- Map sync service for viewport synchronization.
- Strong Playwright and Vitest surface.

### 3.2 Primary Weaknesses

The main risk is not missing capability. The main risk is complexity concentration.

Current pressure points:

- `MapExplorerModal.tsx` is still very large and orchestrates many concerns in one place.
- Some state coordination is split between modal-local state, `useMapExplorerStore`, `useFlowStore`, report handoff state, and panel docking state.
- The store is mature but could benefit from more formal selectors and event contracts for external modules.
- Map outputs and Urban evidence artifacts are not yet part of one shared artifact protocol.
- IDE code artifacts are not yet deeply connected to map layers, map workflow manifests, and map export packages.
- Publication outputs are strong, but the plan should standardize them as map evidence artifacts.
- Scientific QA exists, but its summaries need to become first-class sync payloads for Urban Analytics and report/dashboard workflows.
- Map Explorer has a strong previous enhancement plan, but the new three-module development sequence needs a single authoritative Map Explorer plan in `DEVELOPMENT_PLANS`.

### 3.3 Architectural Risk

The largest architectural risk is turning `MapExplorerModal.tsx` into a permanent super-component. The next development cycle should extract orchestration into focused hooks, selectors, and service adapters.

Target extraction pattern:

- Keep `MapExplorerModal.tsx` as shell and composition layer.
- Move command derivation to hooks.
- Move map context summary to selectors.
- Move report/export workflow state to focused hooks.
- Move workflow preview/apply state to focused hooks.
- Move analysis recommendation handling to a command adapter.
- Move Urban/IDE sync payload generation to dedicated builders.

### 3.4 Scientific Risk

Map Explorer renders evidence. That makes it high-risk when:

- CRS is unknown or unsuitable for distance/area.
- geometries are invalid or self-intersecting;
- imported rows are skipped;
- temporal layers have mixed or missing timestamps;
- classification methods imply false precision;
- external layers lack clear provenance;
- demo/sample layers are visually similar to real project layers;
- NL query outputs omit scope limitations;
- heatmaps, hot spots, regression, GeoAI, and simulations are interpreted without caveats;
- report snapshots do not preserve layer lineage and QA.

The plan must strengthen scientific truthfulness at every action boundary.

---

## 4. Alignment With Synapse IDE and Urban Analytics Plans

### 4.1 Alignment With Synapse IDE Plan

The Synapse IDE plan defines the IDE as the coder, file, terminal, AI plan, and artifact editing surface. Map Explorer should integrate with the IDE by creating and consuming map code artifacts.

Map Explorer -> IDE handoffs:

- open a map workflow script;
- open a data import manifest;
- open a map publication manifest;
- open a QA audit markdown note;
- open a layer transformation script;
- open a reproducibility bundle;
- open a SQL query generated from map-visible layers;
- open a Python or TypeScript analysis adapter.

IDE -> Map Explorer handoffs:

- register GeoJSON or GeoParquet generated by code;
- register a `.map.json` or `.urban-map-manifest.json`;
- open a map view for a file with coordinate data;
- reveal a map layer linked to an IDE artifact;
- update a workflow parameter set from a manifest;
- show code provenance in map layer metadata.

The IDE remains the owner of file state. Map Explorer only stores references and map-safe summaries.

### 4.2 Alignment With Urban Analytics Plan

The Urban Analytics plan defines the scientific command layer: method selection, evidence artifacts, indicator interpretation, data fitness, report/dashboard/education bindings, and scientific dossier content.

Map Explorer -> Urban Analytics handoffs:

- active AOI summary;
- visible layer summaries;
- selected feature summaries;
- active map analysis result layer ids;
- QA gate summary;
- map evidence artifact;
- workflow run manifest;
- map report handoff artifact;
- dashboard-ready map output binding;
- VoxCity/3D context.

Urban Analytics -> Map Explorer handoffs:

- selected method requirements;
- recommended map action;
- required geometry type;
- required fields;
- data fitness threshold;
- selected indicator layer binding;
- study area request;
- workflow dispatch request;
- report/dashboard publication request.

Urban Analytics remains the owner of method interpretation. Map Explorer remains the owner of spatial state.

### 4.3 Shared Evidence System

All three plans should converge on a shared artifact idea:

- IDE artifact: code, file, notebook, manifest, diff, execution log.
- Map artifact: layer, AOI, map workflow result, QA finding, export, map report snapshot.
- Urban artifact: method card, indicator, workflow run, report insert, dashboard binding, education link.

The Map Explorer plan should introduce `MapEvidenceArtifact` and adapter functions that can be wrapped by the Urban `UrbanEvidenceArtifact` model and opened by the IDE artifact model.

### 4.4 Shared Synchronization Principles

The three plans must obey these principles:

- state ownership is explicit;
- cross-module payloads are typed;
- event names are stable;
- large data is referenced, not copied;
- provenance is mandatory;
- QA caveats travel with outputs;
- generated code includes a manifest;
- report and dashboard outputs are structured;
- demo/sample data is labeled;
- disabled states explain prerequisites;
- every sync path has tests.

---

## 5. Scientific GIS Doctrine

### 5.1 Scientific Truthfulness

Every map surface must preserve or expose:

- source name;
- source type;
- source URL or import origin when available;
- license and attribution;
- CRS or visible caveat when CRS is unknown;
- geometry type;
- feature count;
- bounds;
- temporal coverage;
- queryability;
- data version or generated timestamp;
- analysis parameters for derived outputs;
- QA status;
- caveats;
- uncertainty or confidence where relevant.

The map should never imply stronger precision than the data supports.

### 5.2 CRS and Measurement Discipline

Map Explorer must distinguish between:

- display CRS;
- source CRS;
- analytical CRS;
- unknown CRS;
- fallback CRS label.

Distance, area, buffer, accessibility, and catchment workflows must expose whether calculations use:

- geodesic math;
- projected units;
- source coordinates;
- approximate display units;
- worker or service-side geometry execution.

### 5.3 Layer Lineage

Every derived layer should answer:

- Which layer or layers created it?
- Which method or engine created it?
- Which parameters were used?
- Which AOI or viewport constrained it?
- Which QA gate applied?
- Which timestamp and version identify it?
- Which report/dashboard/IDE artifacts reference it?

### 5.4 Data Fitness

Map Explorer should provide the spatial part of data fitness:

- geometry validity;
- CRS clarity;
- scale suitability;
- spatial completeness;
- temporal completeness;
- field availability;
- query readiness;
- worker readiness;
- memory size warnings;
- source/provenance clarity.

Urban Analytics should compute the method-specific scientific fitness. Map Explorer should expose the spatial evidence required for that computation.

### 5.5 Cartographic Responsibility

Cartographic output should be scientifically interpretable:

- legends must match visible styling;
- classification method must be named;
- class count and break values should be visible;
- color schemes should avoid misleading or inaccessible palettes;
- scale bar and north arrow should be included for publication exports;
- insets and graticules should be optional but exportable;
- attribution and source labels must travel to reports.

---

## 6. Premium UX Doctrine

### 6.1 Interaction Character

Map Explorer should feel like a serious geospatial instrument:

- map first, controls second;
- compact panels;
- no decorative filler;
- no oversized marketing hero content;
- no vague empty states;
- no hidden prerequisites;
- no card-in-card panel structures;
- stable panel widths and responsive drawers;
- visible keyboard and command paths;
- meaningful icons with accessible labels.

### 6.2 UI Hierarchy

The UI should separate:

- map canvas and interaction state;
- layer stack and data controls;
- workflow/QA/report panels;
- toolbar and command palette;
- bottom status and temporal context;
- dialogs for import/export/service connection.

### 6.3 Premium State Design

Every state must be specific:

- Empty layer stack: "Import or add a dataset before layer controls, QA, comparison, and report handoff can run."
- No AOI: "Draw or select an AOI before AOI-based workflows can run."
- No queryable layers: "Only visible queryable layers can be used for NL queries."
- QA blocked: list blocking issues, layer ids, and recommended fix.
- Export disabled: name the missing layer, map, attribution, or snapshot condition.
- Report disabled: name missing title, visible layer, QA, or provenance condition.

### 6.4 Motion and Focus

- Respect reduced motion.
- Do not animate map panels in ways that shift the canvas unexpectedly.
- Dialog focus traps must restore focus.
- Context menus must render above floating panels.
- Esc behavior must close the most local surface first.

---

## 7. Target Architecture

### 7.1 Architecture Goal

Move Map Explorer from a capable but highly centralized modal toward a modular spatial workspace with explicit state, command, artifact, and synchronization layers.

Target structure:

```text
MapExplorerModal.tsx
  -> shell composition, portal, high-level layout, modal lifecycle

map/
  MapWorkspaceShell.tsx
  MapWorkspaceCockpit.tsx
  MapCanvas.tsx
  MapToolbar.tsx
  MapLayerPanel.tsx
  MapLayerManager.tsx
  MapWorkflowDrawer.tsx
  ScientificQAPanel.tsx
  MapReportHandoffDrawer.tsx
  MapReviewTimelinePanel.tsx
  MapNLQueryPanel.tsx
  context/
    mapContextSelectors.ts
    mapEvidenceArtifacts.ts
    mapCommandRegistry.ts
    mapSyncBridge.ts
  hooks/
    useMapLayerCommands.ts
    useMapWorkflowCommands.ts
    useMapReportHandoff.ts
    useMapPublicationExport.ts
    useMapAnalysisRecommendations.ts
    useMapUrbanSync.ts
    useMapIdeSync.ts
```

Services remain under `src/services/map/*`.

### 7.2 Ownership Boundaries

Store ownership:

- `useMapExplorerStore.ts` owns map state.
- `useFlowStore.ts` owns workflow runtime and queued flow dispatch data.
- `usePanelBridgeStore.ts` owns center-panel active tab/flow/report slot bridge state.
- `useUrbanStore.ts` owns Urban Analytics UI navigation state.
- future Urban context store owns Urban evidence context.
- editor stores own IDE files and editor tabs.

Service ownership:

- `MapEngineAdapter.ts` owns analysis-result-to-map-layer adaptation.
- `MapWorkflowService.ts` owns map workflow drafts/previews/apply outputs.
- `MapScientificQA.ts` owns map scientific QA checks.
- `MapReportHandoffService.ts` owns map-to-report structured handoff.
- `MapExportService.ts` owns publication export composition.
- `MapDataImporter.ts` owns import parsing and layer construction.
- `MapDataExporter.ts` owns data export.
- `MapPersistenceService.ts` owns map project snapshot save/load.
- `MapAnalysisDispatcher.ts` owns map-to-workflow dispatch.
- `MapSyncService.ts` owns viewport synchronization.

### 7.3 New Map Context Layer

Add a lightweight context layer that produces summaries from the store:

- `MapExplorerContextSummary`
- `MapLayerEvidenceSummary`
- `MapAoiSummary`
- `MapSelectionSummary`
- `MapQASummary`
- `MapWorkflowReadiness`
- `MapPublicationReadiness`
- `MapUrbanSyncPayload`
- `MapIdeSyncPayload`

These should be derived from existing state and service results. They should not create a second source of truth.

### 7.4 New Map Evidence Layer

Map evidence should be explicit:

- layer evidence;
- AOI evidence;
- map workflow evidence;
- QA finding evidence;
- report snapshot evidence;
- publication export evidence;
- NL query evidence;
- VoxCity/3D handoff evidence;
- IDE code artifact reference.

Map evidence can be converted into Urban evidence, report inserts, dashboard bindings, and IDE artifacts.

---

## 8. Three-Module Synchronization Contract

### 8.1 Existing Contract Surface

Existing surfaces that must be preserved:

| Mechanism | Owner | Current role |
|---|---|---|
| `useMapExplorerStore` | Map Explorer | viewport, layers, pins, bookmarks, annotations, selections, AOI, QA, review, drawing, measurement, temporal state |
| `MAP_LAYER_REGISTRY_EVENT` / `synapse-map-layer-registry-change` | Map Explorer | layer registry change notification |
| `MapAnalysisDispatcher` | Map services | map selection/AOI to analytical flow dispatch |
| `MapEngineAdapter` | Map services | analysis outputs to map layers and completed runs |
| `MapReportHandoffService` | Map services/reporting | map evidence to structured report inserts |
| `MapSyncService` | Map services | viewport sync |
| `synapse:navigate` | app bridge | cross-panel navigation |
| `editorBridge` / `editor:openTab` | IDE | code/file artifact opening |
| `useFlowStore` | flows | queued map dispatch and completed runs |
| `usePanelBridgeStore` | center panel | active tab/flow/report slot |

### 8.2 Proposed Map Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `map:context:changed` | Map Explorer to modules | `MapExplorerContextSummary` | Notify Urban Analytics and IDE bridges that map context changed. |
| `map:evidence:created` | Map Explorer to modules | `MapEvidenceArtifact` | Register new layer, workflow, QA, export, or report evidence. |
| `map:urban-sync:provided` | Map Explorer to Urban | `MapUrbanSyncPayload` | Provide AOI/layers/QA/readiness for selected Urban method. |
| `map:ide-artifact:request` | Map Explorer to IDE | `MapIdeArtifactRequest` | Ask IDE to open script, manifest, SQL, or markdown artifact. |
| `map:layer:focus` | Urban or IDE to Map | layer id and optional feature id | Focus a layer or feature in Map Explorer. |
| `map:aoi:request` | Urban to Map | method requirement summary | Ask user to select/draw AOI for an Urban method. |
| `map:workflow:dispatch` | Urban to Map | workflow id, method id, AOI/layer requirements | Prime map workflow drawer. |
| `map:publication:created` | Map Explorer to Report/Dashboard/Urban | publication artifact | Record exported or report-ready map composition. |

### 8.3 Map -> Urban Sync Payload

Map Explorer should provide:

- map context id;
- current viewport;
- active AOI id, geometry type, bounds, and area estimate when available;
- selected feature layer ids and feature counts;
- visible layer summaries;
- queryable layer summaries;
- active analysis result layer ids;
- scientific QA status and blocking issues;
- layer provenance summary;
- temporal frame summary;
- workflow readiness summary;
- publication readiness summary.

### 8.4 Urban -> Map Sync Payload

Urban Analytics should provide:

- active method id;
- active card id;
- required geometry types;
- required fields;
- required temporal structure;
- recommended spatial scale;
- data fitness threshold;
- requested workflow id;
- selected indicator kind;
- requested output type;
- report/dashboard intent.

Map Explorer should respond by:

- highlighting compatible layers;
- showing missing prerequisites;
- opening AOI drawing if needed;
- opening workflow drawer if ready;
- showing QA blockers;
- returning selected map context summary.

### 8.5 Map -> IDE Sync Payload

Map Explorer should produce:

- map script artifacts;
- map workflow manifest files;
- publication export manifest files;
- QA audit markdown;
- layer transformation scripts;
- NL query SQL/JSON files;
- Python/TypeScript adapters for reproduced map analysis;
- small sample data snippets only when safe and explicit.

Large data should not be copied into IDE tabs. Store references, layer ids, worker table names, file names, and manifest entries.

### 8.6 IDE -> Map Sync Payload

Synapse IDE should be able to open Map Explorer with:

- generated GeoJSON layer reference;
- generated GeoParquet/Arrow table reference;
- `.map.json` manifest;
- selected coordinate file;
- SQL query result reference;
- analysis script output reference;
- map layer style specification;
- report snapshot manifest.

### 8.7 Report and Dashboard Sync

Map Explorer should not own report or dashboard state. It should create:

- structured report pending inserts;
- publication map artifacts;
- dashboard map widget binding descriptors;
- scenario comparison binding descriptors;
- chart-ready spatial summary outputs.

---

## 9. Target Domain Model

### 9.1 Map Explorer Context Summary

```ts
export interface MapExplorerContextSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  viewport: ViewportState;
  activeBaseLayer: BaseLayerId;
  activeAoi?: MapAoiSummary;
  selectedFeatures: MapSelectionSummary[];
  visibleLayers: MapLayerEvidenceSummary[];
  queryableLayers: MapLayerEvidenceSummary[];
  activeAnalysisResultLayerIds: string[];
  temporal?: MapTemporalContextSummary;
  qa?: MapQASummary;
  readiness: MapWorkspaceReadinessSummary;
  publicationReadiness: MapPublicationReadiness;
}
```

Purpose:

- Provide a compact sync payload.
- Avoid passing full layer data to other modules.
- Keep Map Explorer as the source of truth.

### 9.2 Map Evidence Artifact

```ts
export type MapEvidenceArtifactKind =
  | "layer"
  | "aoi"
  | "selection"
  | "workflow-result"
  | "qa-finding"
  | "publication-export"
  | "report-handoff"
  | "nl-query"
  | "cartography-review"
  | "external-service"
  | "voxcity-handoff"
  | "temporal-state";

export interface MapEvidenceArtifact {
  id: string;
  kind: MapEvidenceArtifactKind;
  title: string;
  summary: string;
  createdAt: string;
  layerIds: string[];
  sourceLayerIds: string[];
  aoiId?: string;
  workflowId?: string;
  runId?: string;
  qaIssueIds: string[];
  provenance: LayerProvenance[];
  manifest?: MapReproducibilityManifest;
  reportInsertId?: string;
  dashboardBindingId?: string;
  ideArtifactId?: string;
  urbanEvidenceId?: string;
}
```

Purpose:

- Make map outputs auditable.
- Bridge map outputs into Urban Analytics evidence artifacts.
- Bridge map outputs into IDE code artifacts.
- Provide a stable reference for reports and dashboards.

### 9.3 Map Reproducibility Manifest

```ts
export interface MapReproducibilityManifest {
  version: number;
  createdAt: string;
  mapContextId: string;
  operation: string;
  inputLayerIds: string[];
  outputLayerIds: string[];
  aoiId?: string;
  viewport: ViewportState;
  parameters: Record<string, unknown>;
  engine?: string;
  engineVersion?: string;
  qaStatus?: LayerQaStatus;
  qaIssueIds: string[];
  sourceDataVersions: Record<string, string | undefined>;
  publication?: MapPublicationManifest;
}
```

### 9.4 Layer Readiness Summary

```ts
export interface MapLayerReadinessSummary {
  layerId: string;
  status: "ready" | "ready-with-caveats" | "needs-review" | "blocked";
  geometryReady: boolean;
  crsReady: boolean;
  metadataReady: boolean;
  queryReady: boolean;
  temporalReady: boolean;
  workerReady: boolean;
  missingFields: string[];
  blockingIssueIds: string[];
  caveats: string[];
}
```

### 9.5 Publication Readiness

```ts
export interface MapPublicationReadiness {
  status: "ready" | "ready-with-caveats" | "blocked";
  visibleLayerCount: number;
  hasTitle: boolean;
  hasLegend: boolean;
  hasScaleBar: boolean;
  hasNorthArrow: boolean;
  hasAttribution: boolean;
  qaBlockingIssueCount: number;
  caveats: string[];
}
```

---

## 10. State and Persistence Plan

### 10.1 Store Scope

Keep `useMapExplorerStore.ts` as the source of truth for map state.

Preserve:

- viewport and base layer;
- pins;
- bookmarks;
- annotations;
- annotation settings;
- active tool;
- layout preferences;
- overlay layers;
- scientific QA;
- current map bounds;
- selected feature ids;
- active AOI id;
- active analysis result layer ids;
- copilot action proposals;
- review session;
- drawing state;
- measurement state;
- temporal player state;
- restore/clear project content actions.

Add or formalize:

- context summary selectors;
- evidence artifact registry or evidence event emitters;
- map publication artifact references;
- IDE artifact references;
- Urban sync metadata;
- layer readiness summaries;
- project snapshot metadata hooks.

### 10.2 Persisted vs Non-Persisted

Persist:

- viewport;
- active base layer;
- pins;
- bookmarks;
- annotations;
- annotation settings;
- layout preferences;
- selected active AOI id where safe;
- active analysis result layer ids where restorable;
- lightweight layer metadata in project snapshots;
- measurements where project snapshot supports them.

Do not persist in local storage:

- full large GeoJSON/Arrow/GeoParquet layer data;
- external service fetched payloads beyond cache policy;
- volatile selected features;
- transient dialog state;
- local file handles unless explicitly supported;
- large map screenshots;
- worker table payloads.

### 10.3 Project Snapshot Strategy

`MapPersistenceService.ts` should remain the owner of map project snapshots. Extend it carefully with optional artifact references:

- context summary id;
- evidence artifact ids;
- publication manifest ids;
- report handoff ids;
- external service references;
- layer metadata and restore hints.

### 10.4 Audit Timeline Strategy

`MapReviewSessionService.ts` should record:

- imports;
- layer add/remove/update/reorder;
- QA evaluations;
- workflow previews and applications;
- analysis recommendations applied or dismissed;
- cartography recommendations applied or undone;
- map report handoff insertion;
- publication export;
- external service fetch;
- Urban/IDE sync actions.

---

## 11. File-by-File Implementation Blueprint

### 11.1 Core Shell

| File | Planned change | Why | Validation |
|---|---|---|---|
| `src/centerpanel/components/MapExplorerModal.tsx` | Reduce orchestration size by extracting hooks and context builders. Keep shell composition and portal behavior. | Main complexity risk is concentrated here. | Existing modal E2E and component tests. |
| `src/centerpanel/components/map/MapWorkspaceShell.tsx` | Preserve layout primitives; add extension slots and stronger responsive diagnostics if needed. | Shell should support embedded, modal, and presentation modes. | `map-modal-layout.spec.ts`, component tests. |
| `src/centerpanel/components/map/mapDocking.ts` | Ensure new sync/evidence/report panels dock predictably. | Avoid overlapping right-dock panels and floating surfaces. | Docking unit tests. |
| `src/centerpanel/components/map/mapTokens.ts` | Audit all map surfaces for token consistency. | Premium visual consistency and maintainability. | map token tests and visual checks. |

### 11.2 Store and Selectors

| File | Planned change | Why | Validation |
|---|---|---|---|
| `src/stores/useMapExplorerStore.ts` | Add selector helpers outside the store rather than bloating actions. Add evidence/reference fields only if needed. | Preserve store stability. | store tests. |
| `src/centerpanel/components/map/context/mapContextSelectors.ts` | New selectors for context, AOI, layers, QA, selections, temporal, publication readiness. | Required for sync with Urban/IDE. | unit tests. |
| `src/centerpanel/components/map/context/mapEvidenceArtifacts.ts` | New artifact builders for layer/workflow/QA/export/report/NL query. | Normalize map evidence. | snapshot tests. |
| `src/centerpanel/components/map/context/mapSyncBridge.ts` | New typed bridge for map events and cross-module payloads. | Avoid ad hoc component reach-ins. | event tests. |

### 11.3 Map Components

| File | Planned change | Why | Validation |
|---|---|---|---|
| `MapCanvas.tsx` | Add render diagnostics hooks and layer focus support. | Needed for map:layer:focus and performance inspection. | lifecycle tests. |
| `MapToolbar.tsx` | Add sync-aware command states: send to Urban, open IDE artifact, publish evidence, review QA. | Toolbar becomes professional command surface. | toolbar tests and E2E. |
| `MapLayerManager.tsx` | Add layer readiness, evidence badges, Urban compatibility hints, IDE/report artifact links. | Layer stack becomes evidence registry surface. | component tests. |
| `MapWorkflowDrawer.tsx` | Add Urban method context, QA gate, manifest preview, and IDE/report actions. | Map workflows become reproducible. | workflow service and component tests. |
| `ScientificQAPanel.tsx` | Add compact exportable QA summary and Urban sync action. | QA must travel to other modules. | QA panel tests. |
| `MapReportHandoffDrawer.tsx` | Add evidence ids, publication readiness, and IDE manifest action. | Report handoff becomes auditable artifact. | report handoff tests. |
| `MapReviewTimelinePanel.tsx` | Add filters by evidence kind and sync action. | Timeline must support audit review. | component tests. |
| `MapNLQueryPanel.tsx` | Add query manifest, SQL artifact, layer scope caveats, and IDE action. | NL query must be reproducible. | NL query tests. |
| `MapWorkspaceCockpit.tsx` | Add three-module sync strip and readiness summary. | Premium overview surface. | component tests. |

### 11.4 Map Services

| File | Planned change | Why | Validation |
|---|---|---|---|
| `MapEngineAdapter.ts` | Add map evidence and IDE/Urban sync metadata to adapted outputs. | Analysis layers need cross-module lineage. | adapter tests. |
| `MapWorkflowService.ts` | Add reproducibility manifest and Urban method context support. | Workflows need scientific traceability. | workflow service tests. |
| `MapScientificQA.ts` | Add compact summary builder and method-aware gate references. | Urban/Report need a stable QA payload. | QA tests. |
| `MapDataImporter.ts` | Add initial layer readiness and evidence metadata. | Imported layers should immediately support scientific review. | data IO tests. |
| `MapDataExporter.ts` | Include evidence/provenance options in export metadata. | Exports must remain traceable. | export tests. |
| `MapExportService.ts` | Add publication manifest builder and artifact id support. | Publication maps should be reproducible. | export service tests. |
| `MapReportHandoffService.ts` | Add map evidence ids, Urban context id, and IDE manifest hooks. | Report inserts must link back to map context. | handoff snapshot tests. |
| `MapPersistenceService.ts` | Extend snapshots with optional context/evidence references. | Project restore should keep sync state. | persistence tests. |
| `MapReviewSessionService.ts` | Add sync and artifact event builders. | Audit trail must include cross-module handoffs. | review tests. |
| `MapAnalysisDispatcher.ts` | Carry Urban method context and selected evidence ids. | Map-to-flow handoff must be typed. | dispatcher tests. |
| `MapAnalysisRecommender.ts` | Add Urban-method compatibility and QA-aware readiness. | Recommendations become context-aware. | recommender tests. |
| `MapCartographyAdvisor.ts` | Add publication readiness and dashboard/report implications. | Cartography quality affects exports and reports. | advisor tests. |
| `MapSyncService.ts` | Formalize map/3D viewport sync and external subscriptions. | Needed for VoxCity and Urban context strip. | sync tests. |

### 11.5 Adjacent Modules

| File | Planned change | Why | Validation |
|---|---|---|---|
| `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md` | Keep as companion plan; do not edit unless shared contract changes. | Avoid drift. | document review. |
| `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` | Keep as companion plan; map sync should align with section 20. | Avoid drift. | document review. |
| `src/services/editorBridge.ts` | Use existing IDE bridge for map artifacts. | Avoid duplicate IDE routing. | bridge tests. |
| `src/services/editor/bridge.ts` | Add optional metadata only if needed. | Map artifacts should open as IDE tabs. | bridge tests. |
| `src/features/urbanAnalytics/lib/types.ts` | Urban types may wrap map evidence references. | Shared evidence system. | typecheck. |
| `src/services/reporting/*` | Consume map report handoff artifacts. | Structured reporting. | reporting tests. |
| `src/features/dashboard/*` | Consume map widget or layer summary bindings. | Dashboard sync. | dashboard tests. |

---

## 12. Track-by-Track Development Plan

### Track M1: Context and Evidence Kernel

Objective:

Create a lightweight Map Explorer context and evidence kernel without changing visible behavior first.

Tasks:

- Add context summary types.
- Add selector builders.
- Add evidence artifact builders.
- Add event emitter and subscriber helpers.
- Add tests for empty state, imported layer state, selected AOI state, QA blocked state, and workflow result state.

Files:

- `src/centerpanel/components/map/context/mapContextSelectors.ts`
- `src/centerpanel/components/map/context/mapEvidenceArtifacts.ts`
- `src/centerpanel/components/map/context/mapSyncBridge.ts`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/stores/useMapExplorerStore.ts`

Acceptance:

- Context summary can be generated from the current store.
- Evidence artifacts can be built from layers, QA, workflows, report handoff, and exports.
- No visible UI regression.

### Track M2: Modal Decomposition and Command Hooks

Objective:

Reduce the modal's complexity without changing the product behavior.

Tasks:

- Extract layer command handlers.
- Extract workflow command handlers.
- Extract report handoff state and handlers.
- Extract publication export state and handlers.
- Extract recommendation action handlers.
- Extract Urban/IDE sync handlers.
- Keep `MapExplorerModal.tsx` as shell composition.

Files:

- `MapExplorerModal.tsx`
- `map/hooks/useMapLayerCommands.ts`
- `map/hooks/useMapWorkflowCommands.ts`
- `map/hooks/useMapReportHandoff.ts`
- `map/hooks/useMapPublicationExport.ts`
- `map/hooks/useMapAnalysisRecommendations.ts`
- `map/hooks/useMapUrbanSync.ts`
- `map/hooks/useMapIdeSync.ts`

Acceptance:

- Modal line count drops materially over time.
- Existing tests pass.
- Commands remain reachable from toolbar, panels, and keyboard paths.

### Track M3: Premium Layer Registry

Objective:

Make the layer stack the main spatial evidence registry.

Tasks:

- Add readiness badges.
- Add source kind chips.
- Add QA blockers and caveats summary.
- Add provenance popover.
- Add "open in Urban", "open IDE manifest", "add to report", and "export layer" action states.
- Show stale analysis result status and rerun action.
- Show worker/queryability status.

Files:

- `MapLayerManager.tsx`
- `MapLayerPanel.tsx`
- `mapTypes.ts`
- `useMapExplorerStore.ts`
- `MapCartographyAdvisor.ts`
- `MapScientificQA.ts`

Acceptance:

- A professional user can understand layer readiness without opening multiple dialogs.
- Layer actions are disabled with explicit prerequisites.

### Track M4: Scientific QA as a First-Class Gate

Objective:

Make scientific QA visible, actionable, and transferable to Urban Analytics, reports, and IDE manifests.

Tasks:

- Add compact QA summary builder.
- Add QA issue grouping by layer, severity, category, and publication impact.
- Add QA action recommendations.
- Add report/dashboard/Urban publication gates.
- Add generated QA audit markdown for IDE.

Files:

- `MapScientificQA.ts`
- `ScientificQAPanel.tsx`
- `MapReportHandoffService.ts`
- `mapEvidenceArtifacts.ts`
- `useMapIdeSync.ts`

Acceptance:

- QA summary travels with every map output.
- Report/export/Urban handoff shows caveats and blockers.

### Track M5: Workflow and Analysis Reproducibility

Objective:

Make every map workflow and analysis output reproducible.

Tasks:

- Add map reproducibility manifest.
- Attach manifest to workflow preview/apply result.
- Attach manifest to MapEngineAdapter outputs.
- Register map evidence artifact on apply/publish.
- Provide IDE script and JSON manifest actions.
- Include QA gate and source layer ids.

Files:

- `MapWorkflowService.ts`
- `MapEngineAdapter.ts`
- `MapWorkflowDrawer.tsx`
- `MapAnalysisDispatcher.ts`
- `MapAnalysisRecommender.ts`
- `MapReviewSessionService.ts`

Acceptance:

- Every derived analysis layer has input layers, parameters, method, timestamp, QA, and provenance.

### Track M6: Urban Analytics Sync

Objective:

Make Map Explorer context usable by Urban Analytics without coupling state ownership.

Tasks:

- Add `MapUrbanSyncPayload`.
- Add event helper for Urban context requests.
- Add compatible method and required field matching.
- Add workflow dispatch payload enriched with Urban method/card ids.
- Add evidence artifact conversion hints.
- Add tests for selected AOI and layer sync.

Files:

- `mapSyncBridge.ts`
- `mapContextSelectors.ts`
- `MapAnalysisDispatcher.ts`
- `MapAnalysisRecommender.ts`
- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/context/*` after Urban context implementation exists.

Acceptance:

- Urban Analytics can ask Map Explorer for map context.
- Map Explorer can respond with typed summaries and readiness.

### Track M7: Synapse IDE Sync

Objective:

Make Map Explorer able to open map code artifacts, manifests, and query files in Synapse IDE.

Tasks:

- Add map IDE artifact builder.
- Add actions for open script, manifest, QA note, NL query SQL, publication manifest.
- Add metadata to IDE bridge payloads where supported.
- Avoid opening huge data payloads in editor tabs.
- Add tests for generated artifact names and contents.

Files:

- `map/context/mapIdeArtifacts.ts`
- `map/hooks/useMapIdeSync.ts`
- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- `MapWorkflowDrawer.tsx`
- `MapNLQueryPanel.tsx`
- `MapReportHandoffDrawer.tsx`

Acceptance:

- Map Explorer can open a named IDE artifact with provenance and manifest data.

### Track M8: Publication Export and Report Handoff

Objective:

Make exports and report inserts publication-ready and evidence-linked.

Tasks:

- Add publication manifest builder.
- Add export readiness display.
- Add source/citation/caveat checks before export.
- Add evidence ids to report handoff.
- Add map snapshot and composition metadata to report inserts.
- Add dashboard map widget binding descriptor.

Files:

- `MapExportService.ts`
- `MapExportDialog.tsx`
- `MapReportHandoffService.ts`
- `MapReportHandoffDrawer.tsx`
- `src/services/reporting/*`
- `src/features/dashboard/*`

Acceptance:

- A map export can be traced to layers, viewport, composition options, QA, and source lineage.

### Track M9: External Services and Data Ingestion

Objective:

Improve external and imported data as scientifically labeled evidence.

Tasks:

- Add source confidence and provider caveat metadata.
- Add credential/CORS/rate-limit display.
- Add import readiness from file previews.
- Add layer evidence creation on import.
- Add worker memory and transfer status to layer metadata.
- Add external service review events.

Files:

- `ExternalServiceConnector.ts`
- `ExternalServiceQueue.ts`
- `MapServiceDialog.tsx`
- `MapDataImporter.ts`
- `MapDataImportHubDialog.tsx`
- `MapColumnarImportDialog.tsx`
- `MapCsvImportDialog.tsx`

Acceptance:

- Imported and external layers are explicitly labeled and auditable.

### Track M10: Temporal, Scenario, and Comparison Workflows

Objective:

Make time, comparison, and scenario layers first-class map evidence.

Tasks:

- Add temporal context summary.
- Add frame metadata validation.
- Add comparison manifest.
- Add synchronized legends and report snapshot metadata.
- Add Urban scenario binding.
- Add IDE manifest export.

Files:

- `MapTemporalPlayer.tsx`
- `MapWorkflowService.ts`
- `MapWorkflowDrawer.tsx`
- `MapExportService.ts`
- `MapReportHandoffService.ts`
- `ScenarioComparisonFlow.tsx`

Acceptance:

- Temporal and comparison outputs can be reported and reproduced.

### Track M11: VoxCity and 2D/3D Sync

Objective:

Make VoxCity and 3D map handoffs evidence-backed and synchronized.

Tasks:

- Use map layers as preferred building/project geometry source.
- Mark demo/sample geometry clearly.
- Add 2D/3D viewport sync references.
- Add CityJSON, Overpass, and building layer provenance.
- Add sunlight simulation map evidence.
- Add report and IDE actions for 3D outputs.

Files:

- `MapVoxCityOverlay.tsx`
- `voxCitySelectionService.ts`
- `voxCityProjection.ts`
- `MapSyncService.ts`
- `src/features/urbanAnalytics/voxcity/*`
- `ExternalServiceConnector.ts`

Acceptance:

- 3D outputs are linked to real map context when available and label sample mode when not.

### Track M12: Performance, Memory, and Chunking

Objective:

Keep Map Explorer fast and bounded as features deepen.

Tasks:

- Split heavy modal orchestration and optional panels.
- Lazy-load heavyweight import/export/service panels.
- Keep worker-backed computations off the main thread where practical.
- Add render diagnostics for map canvas and large layer counts.
- Add browser memory warnings for large datasets.
- Keep source/layer cleanup deterministic.

Files:

- `MapExplorerModal.tsx`
- `MapCanvas.tsx`
- `MapDataImporter.ts`
- `SpatialStatsExecutionQueue.ts`
- `engine/wasm/*`
- `engine/spatial-db/*`

Acceptance:

- Existing stability tests pass.
- Modal chunk risk is reduced over time.
- Large data paths remain honest about memory ceilings.

---

## 13. Map Explorer Component Plan

### 13.1 MapExplorerModal

Role:

- shell composition;
- portal and modal lifecycle;
- high-level layout;
- local surface state only when extraction is not yet done;
- bridge points to store, services, and focused hooks.

Future target:

- under 1500-2000 lines after progressive extraction;
- no long business-logic blocks embedded in render body;
- no duplicated sync payload logic;
- no direct report/IDE/Urban artifact assembly in modal body.

### 13.2 MapWorkspaceShell

Role:

- stable workspace frame for embedded, modal, and presentation modes;
- left/right/bottom rails;
- canvas region;
- responsive behavior;
- focus and modal semantics.

Upgrade:

- add clearer slot contracts;
- expose diagnostics for constrained layouts;
- support evidence tray and sync strip without squeezing map canvas.

### 13.3 MapToolbar

Role:

- command discovery and mode switching.

Upgrade:

- formal command registry;
- grouped commands by navigate/explore/analyze/publish/sync;
- icon-first buttons with accessible labels;
- disabled reason on every disabled command;
- command palette mirror;
- evidence-aware commands.

### 13.4 MapLayerManager

Role:

- layer stack, metadata, visibility, styling, opacity, cartography review.

Upgrade:

- turn into the layer evidence registry;
- show readiness badges;
- show source/QA/provenance;
- expose layer actions to Urban, IDE, Report, Dashboard;
- show stale derived layer links and rerun affordances.

### 13.5 MapCanvas

Role:

- MapLibre lifecycle, render canvas, interactions.

Upgrade:

- layer focus events;
- render diagnostics;
- screenshot capture hooks;
- safer source/layer cleanup;
- reduced-motion handling;
- source registry introspection for testing.

### 13.6 ScientificQAPanel

Role:

- QA summary and issue display.

Upgrade:

- publication gate;
- Urban data-fitness bridge summary;
- IDE QA note action;
- issue grouping by layer and workflow impact;
- suggested fixes.

### 13.7 MapWorkflowDrawer

Role:

- AOI, buffer, overlay, and comparison workflow preview/apply.

Upgrade:

- manifest preview;
- method requirements from Urban;
- source layer compatibility;
- QA gate before apply;
- evidence artifact after apply;
- IDE script/report actions.

### 13.8 MapReportHandoffDrawer

Role:

- preview map report insert.

Upgrade:

- publication readiness score;
- linked evidence ids;
- export manifest;
- report/dashboard destinations;
- review timeline event preview.

### 13.9 MapReviewTimelinePanel

Role:

- audit trail.

Upgrade:

- evidence filters;
- sync actions;
- replay/open source action;
- report-review mode;
- exportable audit log.

### 13.10 MapNLQueryPanel

Role:

- natural-language query over visible queryable layers.

Upgrade:

- show SQL/query plan;
- show layer scope;
- show non-queryable exclusions;
- generate IDE SQL/JSON artifact;
- create evidence artifact for query result.

---

## 14. Map Services Plan

### 14.1 MapEngineAdapter

Current role:

- Adapts LISA, hot spot, emerging hot spot, Moran, OLS, GWR, PCA, cluster, land cover, object detection, facility, composite indicator, CA, ABM, and query outputs into map outputs/layers/completed runs.

Upgrade:

- attach `MapEvidenceArtifact` references;
- attach reproducibility manifests;
- attach Urban method/card context when available;
- attach IDE artifact hint when code generation is available;
- expose dashboard/report binding hints;
- keep adapter functions pure and testable.

### 14.2 MapWorkflowService

Current role:

- Builds map workflow context, default drafts, previews, derived layers, QA metadata, provenance notes, report items, and geometry operations for AOI/buffer/intersect/difference/union/comparison.

Upgrade:

- return manifest from preview/apply;
- include method requirements;
- include QA gate result;
- include report/dashboard/IDE handoff hints;
- expose preview cost and data size estimates.

### 14.3 MapScientificQA

Current role:

- Evaluates CRS, geometry, topology, precision, metadata, scale, temporal, comparison, and analysis QA.

Upgrade:

- add `buildMapQASummary`;
- add publication-impact classification;
- add Urban method-readiness mapping;
- add IDE audit note generator data;
- add dashboard/report gate helper.

### 14.4 MapDataImporter

Current role:

- Parses local spatial files and builds imported layers.

Upgrade:

- produce initial layer readiness;
- surface source confidence;
- add worker-readiness status;
- add evidence artifact builder input;
- preserve skipped-row and geometry diagnostics.

### 14.5 MapExportService

Current role:

- Builds publication map composition, export preview, scale bar, legend, north arrow, PDF/PNG/SVG-type outputs.

Upgrade:

- add publication manifest;
- add export evidence artifact;
- add report/dashboard compatibility metadata;
- add source/citation completeness checks.

### 14.6 MapReportHandoffService

Current role:

- Builds report-ready map handoff drafts, structured references, reproducibility items, narrative, citations, and pending report inserts.

Upgrade:

- include map evidence ids;
- include Urban context id when present;
- include publication manifest id;
- include IDE manifest id;
- preserve map review event ids.

### 14.7 MapPersistenceService

Current role:

- Saves and loads map project snapshots with viewport, layers, pins, drawings, annotations, bookmarks, and measurements.

Upgrade:

- include optional context/evidence references;
- add migration safety for new fields;
- avoid persisting large payloads;
- keep quota warning behavior.

### 14.8 ExternalServiceConnector

Current role:

- Validates and creates layer configs for WMS, WMTS, WFS, XYZ, Overpass, and CityJSON.

Upgrade:

- strengthen provider caveat fields;
- add service health/cache metadata;
- attach evidence artifact input;
- preserve OSM/ODbL attribution clearly;
- surface CORS and credential limitations.

---

## 15. Data, Layer, and Evidence Governance

### 15.1 Layer Classes

Map Explorer should consistently distinguish:

- base layers;
- imported local layers;
- project dataset layers;
- external service layers;
- derived analysis layers;
- GeoAI/model layers;
- VoxCity/3D layers;
- demo/sample layers;
- temporal layers;
- publication-only artifacts.

### 15.2 Minimum Layer Metadata

Every layer should provide:

- id;
- name;
- type;
- group;
- source kind;
- visible;
- opacity;
- feature count when known;
- geometry type when known;
- bounds when known;
- CRS when known;
- queryable flag;
- provenance label;
- QA status;
- caveats;
- updated/generated timestamp.

### 15.3 Derived Layer Metadata

Every derived layer should also include:

- source layer ids;
- method/engine id;
- run id;
- parameter summary;
- input parameters;
- statistical summary when relevant;
- visualization specification;
- rerun token where supported;
- stale flag;
- QA gate result;
- reproducibility manifest id.

### 15.4 Evidence Registration Rules

Create map evidence when:

- a layer is imported;
- an external layer is added;
- a map workflow is applied;
- an analysis layer is published;
- QA evaluation creates blockers or caveats;
- a report handoff is inserted;
- a publication map is exported;
- an NL query preview or result is used;
- a cartography recommendation is applied;
- a VoxCity handoff occurs;
- an IDE artifact is generated from map context.

---

## 16. Premium UX Specification

### 16.1 Workspace Layout

Desktop:

- top command/cockpit band;
- left rail for layer/data/evidence stack;
- center map canvas;
- right dock for QA/workflow/report/NL/review;
- bottom status and temporal timeline.

Constrained width:

- map remains primary;
- left and right rails collapse into bottom drawers;
- toolbar groups commands into accessible overflow;
- bottom timeline remains visible without clipping map.

Presentation mode:

- minimal controls;
- publication-ready map;
- visible title/legend/scale/attribution;
- no editing controls unless explicitly toggled.

### 16.2 Top Cockpit

Cockpit should show:

- current view mode;
- layer count;
- visible layer count;
- active AOI state;
- QA status;
- sync status with Urban and IDE;
- last saved state;
- recommended next action.

### 16.3 Left Layer Rail

Layer rail should include:

- layer stack;
- source kind;
- QA badge;
- queryable badge;
- CRS label;
- feature count;
- opacity;
- visibility;
- evidence action menu;
- import and service actions;
- cartography recommendations.

### 16.4 Right Dock

Right dock should host mutually exclusive panels:

- Scientific QA;
- Workflow Drawer;
- Report Handoff;
- Review Timeline;
- Natural Language Query;
- Analysis Recommendations;
- Cartography Advisor;
- Sync Detail.

Panel rules:

- only one primary right dock panel open at a time;
- floating panels should not block map-critical controls;
- each panel must have clear close behavior and focus handling.

### 16.5 Bottom Status and Timeline

Bottom status should show:

- coordinates;
- zoom;
- scale;
- CRS;
- active tool;
- measurement summary;
- temporal frame;
- save status;
- sync status;
- QA status;
- memory/worker status where relevant.

### 16.6 Command Palette

Commands should be searchable by:

- tool name;
- layer action;
- workflow name;
- import/export type;
- report/dashboard/IDE action;
- QA action;
- Urban method compatibility.

Every command should include:

- label;
- icon;
- category;
- shortcut if any;
- disabled reason if disabled;
- effect summary.

---

## 17. Scientific QA and Research Validity

### 17.1 QA Categories

QA should cover:

- CRS and projection;
- geometry validity;
- topology;
- precision;
- feature count;
- source/provenance;
- temporal metadata;
- scale;
- comparison compatibility;
- queryability;
- worker readiness;
- external-service caveats;
- model/demo/sample caveats;
- publication readiness.

### 17.2 QA Severity

Severity should drive actions:

- info: surface caveat but allow actions.
- warning: allow actions with caveat propagation.
- error: block formal report/dashboard publication unless exploratory override.
- blocker: block action until fixed.

### 17.3 QA Propagation

QA must propagate into:

- layer badges;
- workflow drawer;
- analysis recommendations;
- report handoff;
- publication export;
- dashboard binding;
- Urban evidence;
- IDE manifests.

### 17.4 Scientific Review Workflow

Recommended review sequence:

1. Import or connect data.
2. Inspect layer metadata.
3. Run QA.
4. Resolve or acknowledge caveats.
5. Run map workflow or analysis.
6. Review output layer QA.
7. Create report/export/IDE artifacts.
8. Record timeline event.

---

## 18. Workflow, Analysis, and Engine Integration

### 18.1 Map Workflow Readiness

A map workflow should show:

- required layer type;
- required geometry;
- required AOI;
- required fields;
- expected output;
- QA prerequisites;
- output layer group;
- report/dashboard/IDE compatibility.

### 18.2 Analysis Recommendations

`MapAnalysisRecommender.ts` should rank actions by:

- visible layers;
- geometry type;
- numeric fields;
- temporal fields;
- QA blockers;
- active AOI;
- Urban method context;
- selected features;
- user view mode;
- previous completed runs.

### 18.3 Engine Adapter Outputs

MapEngineAdapter outputs should include:

- map layer config;
- completed analysis run;
- map evidence artifact;
- reproducibility manifest;
- report insertion hints;
- dashboard binding hints;
- IDE artifact hints.

### 18.4 Spatial Statistics

Spatial-statistics outputs should expose:

- method;
- spatial weights;
- p-value or confidence fields;
- multiple testing caveats;
- input feature count;
- parameter summary;
- result interpretation limits.

### 18.5 GeoAI

GeoAI outputs should expose:

- model id;
- model version;
- runtime;
- confidence field;
- class labels;
- input imagery/source;
- false-positive/false-negative caveats;
- demo/runtime caveats.

### 18.6 Natural-Language Query

NL query outputs should expose:

- visible queryable layer scope;
- excluded layers and reasons;
- generated query plan;
- preview rows;
- limitations;
- IDE SQL/JSON artifact.

---

## 19. Synapse IDE Synchronization

### 19.1 IDE Artifact Types

Map Explorer should generate:

- `map_context.manifest.json`;
- `map_workflow_<slug>.manifest.json`;
- `map_workflow_<slug>.py`;
- `map_publication_<timestamp>.manifest.json`;
- `map_qa_audit_<timestamp>.md`;
- `map_nl_query_<timestamp>.sql`;
- `map_layer_transform_<slug>.ts`;
- `map_report_handoff_<timestamp>.md`.

### 19.2 Artifact Header Requirements

Generated code or notes should include:

- Map Explorer context id;
- layer ids;
- AOI id;
- method/workflow id;
- timestamp;
- source/provenance;
- QA status;
- caveats;
- output contract;
- report/dashboard/Urban references when present.

### 19.3 IDE Safety Rules

- Never overwrite active editor content by default.
- Open named new tabs for generated artifacts.
- Use replace only through explicit command.
- Do not paste huge datasets.
- Use manifests and references for large data.
- Preserve user edits in IDE stores.

---

## 20. Urban Analytics Synchronization

### 20.1 Map Context for Urban

Urban Analytics needs:

- AOI summary;
- layer summaries;
- selected feature summary;
- QA summary;
- method compatibility;
- data fitness signals;
- workflow readiness;
- report/dashboard output availability.

### 20.2 Urban Method Requirements for Map

Map Explorer should accept:

- required geometry;
- required attributes;
- required temporal structure;
- recommended scale;
- method id;
- card id;
- indicator kind;
- output intent.

### 20.3 Urban Evidence Conversion

Map evidence should be convertible to Urban evidence:

- layer -> dataset/map evidence;
- workflow result -> completed analysis run evidence;
- QA finding -> scientific caveat evidence;
- publication export -> report evidence;
- NL query -> data interrogation evidence;
- VoxCity handoff -> 3D scenario evidence.

### 20.4 Urban UI Triggers

Map Explorer should be able to:

- open Urban Analytics focused on compatible methods;
- open selected card/method if Urban exposes event;
- send active map context to Urban evidence tray;
- show Urban method readiness in map layer rail.

---

## 21. Report, Dashboard, Education, and Publication Outputs

### 21.1 Report Handoff

Report handoff should include:

- title;
- map snapshot;
- viewport;
- scale;
- layer list;
- CRS;
- legend;
- QA caveats;
- provenance;
- references/citations;
- reproducibility;
- review event ids;
- evidence ids.

### 21.2 Dashboard Binding

Map Explorer should produce dashboard bindings for:

- map widget;
- choropleth layer summary;
- hot spot result;
- scenario comparison;
- temporal playback summary;
- facility catchment result;
- GeoAI classification summary;
- composite indicator map output.

Dashboard binding should include:

- layer ids;
- data fields;
- visual encoding;
- QA caveats;
- update timestamp;
- source context.

### 21.3 Education Links

Map Explorer should link complex workflows to methodology education:

- CRS and projection;
- spatial weights;
- choropleth classification;
- hot spot analysis;
- regression and GWR;
- temporal change detection;
- remote sensing classification;
- GeoAI confidence;
- 3D/CityJSON LoD;
- cartographic ethics.

### 21.4 Publication Export

Publication export should require:

- title;
- visible layers;
- legend;
- scale bar;
- north arrow option;
- attribution;
- page size;
- DPI;
- map fit;
- QA caveats.

Publication output should produce:

- image/PDF/SVG file;
- manifest;
- evidence artifact;
- review timeline entry.

---

## 22. VoxCity, 3D, Temporal, and Simulation Integration

### 22.1 VoxCity Source Priority

Use this source priority:

1. real project building/footprint layer;
2. imported CityJSON or external CityJSON layer;
3. OSM buildings fetched for AOI/current extent;
4. explicit demo/sample geometry.

### 22.2 3D Sync

2D/3D synchronization should include:

- viewport center;
- AOI;
- selected building;
- layer ids;
- source provenance;
- temporal/sunlight parameters;
- report/IDE artifact references.

### 22.3 Temporal Playback

Temporal state should include:

- active layer id;
- frame count;
- current timestep;
- time range;
- playback speed;
- metadata caveats;
- report/export frame reference.

### 22.4 Simulation Outputs

Simulation outputs should include:

- engine;
- parameters;
- time step;
- random seed if applicable;
- input layers;
- output layers;
- QA caveats;
- reproducibility manifest.

---

## 23. Performance, Workers, Memory, and Chunking

### 23.1 Performance Budgets

| Interaction | Target |
|---|---:|
| Open Map Explorer after lazy chunk cached | under 300 ms perceived |
| Toggle visible layer | under 80 ms excluding map render |
| Generate context summary | under 30 ms |
| Run QA summary over moderate layer stack | under 150 ms excluding worker geometry checks |
| Open report handoff drawer | under 150 ms excluding snapshot capture |
| Generate IDE artifact | under 150 ms |
| Search command palette | under 80 ms |

### 23.2 Chunking

Candidate lazy boundaries:

- import dialogs;
- external service dialog;
- export dialog;
- report handoff drawer;
- NL query panel;
- workflow drawer;
- GeoAI/simulation panels;
- VoxCity overlay;
- heavy spatial statistics renderers.

### 23.3 Worker Strategy

Use workers for:

- geometry QA on large layers;
- spatial-index operations;
- columnar import and transfer;
- spatial statistics execution;
- large query previews;
- GeoAI/model inference where applicable.

### 23.4 Memory Strategy

Rules:

- Keep large data out of local storage.
- Show memory estimates before heavy imports.
- Preserve file size ceilings.
- Prefer worker table references over copying arrays.
- Show residual browser-memory caveats in release docs.

---

## 24. Accessibility and Keyboard Model

### 24.1 Required Keyboard Paths

Users must be able to:

- open/close Map Explorer;
- focus map canvas;
- pan and zoom;
- open command palette;
- switch workspace views;
- open layer rail;
- open QA panel;
- open report handoff;
- start draw/measure tools;
- navigate context menu;
- close dialogs/drawers.

### 24.2 Focus Rules

- Modal focus trap restores opener.
- Drawer focus returns to invoking command.
- Context menu traps only while open.
- Esc closes topmost surface first.
- Map keyboard movement only occurs when map canvas has focus.

### 24.3 Screen Reader Rules

- Map canvas has role/label explaining interaction.
- Toolbar buttons have labels.
- Status chips include text.
- QA issues are grouped semantically.
- Disabled buttons expose disabled reason.
- Dynamic changes use polite announcements.

---

## 25. Test and Validation Matrix

### 25.1 Unit Tests

| Area | Tests |
|---|---|
| context selectors | empty, imported layer, AOI, selected feature, QA, temporal, publication readiness |
| evidence builders | layer, workflow, QA, report, export, NL query, VoxCity |
| sync bridge | event emission, subscription, payload validation |
| map store | layer registry, active AOI, restore/clear, QA metadata application |
| workflow service | manifest, QA gate, report item, derived layer |
| engine adapter | evidence metadata and manifest attachment |
| export service | publication manifest and composition metadata |
| report handoff | evidence ids, caveats, references |
| IDE artifacts | file names, headers, manifest content |

### 25.2 Component Tests

| Component | Tests |
|---|---|
| MapWorkspaceShell | modal/embedded/presentation semantics, rails, drawers |
| MapToolbar | command groups, disabled reasons, sync actions |
| MapLayerManager | readiness badges, evidence actions, QA/provenance display |
| ScientificQAPanel | issue groups, publication gate, IDE QA note action |
| MapWorkflowDrawer | method requirements, manifest preview, apply flow |
| MapReportHandoffDrawer | readiness, snapshot, insert, manifest action |
| MapNLQueryPanel | query scope, SQL artifact, excluded layer caveats |
| MapReviewTimelinePanel | evidence filters and sync events |

### 25.3 E2E Tests

Required paths:

1. Open Map Explorer, import GeoJSON, inspect layer evidence, send to report.
2. Import CSV, show skipped rows, create point layer, run point symbology.
3. Import Arrow/GeoParquet, show schema/memory/worker state, export GeoParquet.
4. Draw AOI, dispatch to Urban-compatible workflow, publish analysis layer.
5. Run QA, block report for blocker issue, allow report after caveat state.
6. Generate map workflow IDE artifact and verify IDE tab opens.
7. Generate map report handoff and verify report builder receives structured insert.
8. Open Urban Analytics and verify map context summary updates method readiness.
9. Run temporal playback and export/report selected frame context.
10. Run VoxCity handoff with real layer and with explicit sample mode.

### 25.4 Validation Commands

Use relevant subset during development:

```text
npm run typecheck
npm run lint:errors
npm run test
npm run build
npm run test:e2e:smoke
npx playwright test e2e/map-modal-layout.spec.ts
npx playwright test e2e/map-context-and-geojson.spec.ts
npx playwright test e2e/map-csv-kml-gpx-import.spec.ts
npx playwright test e2e/map-columnar-io.spec.ts
npx playwright test e2e/map-choropleth.spec.ts
npx playwright test e2e/map-point-symbology.spec.ts
npx playwright test e2e/map-spatial-stats-renderers.spec.ts
npx playwright test e2e/map-temporal-player.spec.ts
npx playwright test e2e/map-report-handoff.spec.ts
npx playwright test e2e/map-explorer-stability.spec.ts
```

Release gate:

```text
npm run validate:rc
```

---

## 26. Phased Roadmap and Risk Register

### Phase 1: Map Context and Evidence Kernel

Deliver:

- context selectors;
- evidence builders;
- sync bridge;
- tests.

Risk:

- payloads become too large.

Mitigation:

- summaries only, no full layer data.

### Phase 2: Modal Decomposition

Deliver:

- command hooks;
- report/export/workflow extraction;
- no UI behavior change.

Risk:

- regressions in modal interactions.

Mitigation:

- run existing E2E suite after each extraction.

### Phase 3: Layer Registry Upgrade

Deliver:

- evidence-ready layer rail;
- readiness badges;
- cross-module actions.

Risk:

- layer rail becomes visually dense.

Mitigation:

- compact rows, progressive disclosure, tooltips, stable row height.

### Phase 4: QA and Publication Gates

Deliver:

- compact QA summary;
- publication readiness;
- report/export gating.

Risk:

- users feel blocked.

Mitigation:

- allow exploratory output with explicit caveat where scientifically acceptable.

### Phase 5: Workflow Manifest and IDE Artifacts

Deliver:

- map reproducibility manifest;
- IDE script/manifest/QA note actions.

Risk:

- generated artifacts become generic.

Mitigation:

- include method, layer, AOI, QA, parameters, and output contract.

### Phase 6: Urban Analytics Sync

Deliver:

- map context request/provide flow;
- method compatibility highlights;
- evidence conversion.

Risk:

- cyclic dependencies.

Mitigation:

- use events and selectors, not direct component imports.

### Phase 7: Report, Dashboard, and Publication Outputs

Deliver:

- report evidence ids;
- dashboard map bindings;
- publication manifest.

Risk:

- report/dashboard models diverge.

Mitigation:

- reuse existing services and add thin map artifact builders.

### Phase 8: VoxCity, Temporal, and Simulation Hardening

Deliver:

- 2D/3D sync;
- temporal manifest;
- simulation evidence.

Risk:

- demo geometry confused with real data.

Mitigation:

- source priority and explicit sample labels.

### Phase 9: Performance and Release Hardening

Deliver:

- chunk splitting;
- worker diagnostics;
- memory warnings;
- release validation.

Risk:

- large modal remains heavy.

Mitigation:

- lazy optional panels and extract command hooks.

---

## 27. Developer Prompt Pack

### Prompt 01: Map Context and Evidence Kernel

```text
Implement the Map Explorer context and evidence kernel. Add map context summary selectors, map evidence artifact builders, and a typed sync bridge under src/centerpanel/components/map/context. The selectors must summarize viewport, AOI, selected features, visible layers, queryable layers, QA state, temporal state, and publication readiness from useMapExplorerStore without copying large layer data. Add unit tests for empty, imported-layer, AOI, selected-feature, QA-warning, and temporal states.
```

### Prompt 02: Modal Command Hook Extraction

```text
Extract focused command hooks from MapExplorerModal without changing visible behavior. Start with report handoff, publication export, workflow preview/apply, analysis recommendations, and IDE/Urban sync placeholders. Keep MapExplorerModal as shell composition. Preserve existing tests and add tests for extracted hook outputs where practical.
```

### Prompt 03: Premium Layer Evidence Registry

```text
Upgrade MapLayerManager and MapLayerPanel into a premium layer evidence registry. Add readiness badges, source kind labels, QA/provenance summaries, stale analysis status, queryability/worker status, and action states for Urban Analytics, Synapse IDE, report handoff, dashboard binding, and export. Disabled actions must explain missing prerequisites. Add component tests.
```

### Prompt 04: Scientific QA Transfer and Publication Gate

```text
Extend MapScientificQA with a compact summary builder and publication-impact classification. Update ScientificQAPanel, report handoff, export readiness, Urban sync payloads, and IDE QA note generation to use the summary. Add tests for blocker, warning, unknown CRS, invalid geometry, sample data, and temporal caveat scenarios.
```

### Prompt 05: Workflow Reproducibility Manifest

```text
Add MapReproducibilityManifest generation to MapWorkflowService and MapEngineAdapter. Attach manifest references to derived layers, completed runs, report handoff drafts, map evidence artifacts, and IDE artifact generation. Update MapWorkflowDrawer to preview the manifest before apply. Add tests for AOI, buffer, comparison, and spatial-statistics outputs.
```

### Prompt 06: Synapse IDE Map Artifact Handoff

```text
Create Map Explorer IDE artifact builders for workflow scripts, JSON manifests, QA markdown notes, NL query SQL files, and publication manifests. Use existing editorBridge or editor event bridge to open named tabs without replacing active content by default. Avoid embedding large data. Register the generated artifact as map evidence. Add tests for filenames, headers, and bridge payloads.
```

### Prompt 07: Urban Analytics Map Sync

```text
Implement Map Explorer to Urban Analytics synchronization. Add map context request/provide events, Urban method compatibility matching, selected AOI/layer/QA payloads, and workflow dispatch metadata carrying Urban card/method ids. Add tests that Urban method requirements highlight compatible map layers and identify missing AOI/fields.
```

### Prompt 08: Report and Dashboard Map Outputs

```text
Extend MapReportHandoffService and MapExportService with evidence ids, publication manifests, dashboard map widget binding hints, and Urban context references. Update drawers to display publication readiness and evidence links. Add snapshot tests for report inserts and dashboard binding descriptors.
```

### Prompt 09: External Service and Import Evidence

```text
Strengthen imported and external layer evidence. Add source confidence, provider caveats, memory/worker-readiness metadata, skipped-row summaries, service health/caching metadata, and review timeline events for imports and external services. Cover GeoJSON, CSV, KML, GPX, Arrow, GeoParquet, WMS/WFS/XYZ/Overpass/CityJSON paths.
```

### Prompt 10: Temporal, Comparison, and VoxCity Evidence

```text
Create first-class evidence and manifest support for temporal playback, comparison workflows, and VoxCity/3D handoffs. Ensure real project geometry is preferred, demo/sample geometry is explicitly labeled, viewport sync metadata is recorded, and report/IDE artifacts include temporal or 3D parameters. Add targeted tests.
```

### Prompt 11: Performance and Chunk Hardening

```text
Reduce Map Explorer bundle and runtime pressure. Lazy-load heavyweight optional panels, keep worker-backed tasks off the main thread, add render diagnostics, preserve memory ceilings, and update stability tests. Do not remove scientific caveats or validation paths.
```

### Prompt 12: Premium UX and Release Validation

```text
Polish the Map Explorer UI after the model and sync contracts exist. Refine cockpit, toolbar, layer rail, right dock, evidence states, command palette, disabled reasons, focus behavior, and responsive drawers. Run typecheck, lint:errors, unit tests, build, targeted Playwright, smoke, and validate:rc. Update docs and release checklist with actual results.
```

---

## 28. Final Definition of Done

Map Explorer is complete for this premium development cycle when:

- Map Explorer owns spatial state cleanly and exposes typed summaries to other modules.
- Map Explorer has a first-class map evidence artifact model.
- Layer registry shows source, CRS, feature count, queryability, QA, provenance, readiness, and evidence links.
- Every derived map output has a reproducibility manifest.
- Scientific QA propagates into map UI, Urban Analytics, IDE artifacts, reports, dashboards, and exports.
- Urban Analytics can request map context and receive AOI/layer/QA/readiness summaries.
- Synapse IDE can open named map scripts, manifests, QA notes, and query artifacts.
- Report handoff includes evidence ids, snapshot metadata, citations, caveats, and reproducibility.
- Publication export produces map composition plus manifest and evidence record.
- External and imported layers are explicitly labeled with source and caveats.
- VoxCity/3D handoffs prefer real project geometry and label sample mode.
- Temporal and comparison outputs are reproducible and reportable.
- MapExplorerModal is progressively decomposed into focused hooks and components.
- Existing tests pass and new sync/evidence tests are added.
- Performance remains bounded for browser memory and lazy chunk constraints.
- Accessibility and keyboard paths remain intact.
- The plan remains aligned with `SYNAPSE_IDE_DEVELOPMENT_PLAN.md` and `URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`.

---

## Appendix A: Files-to-Touch Master Index

High priority:

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/stores/useMapExplorerStore.ts`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`

High priority services:

- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapExportService.ts`
- `src/services/map/MapDataImporter.ts`
- `src/services/map/MapDataExporter.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/MapReviewSessionService.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapAnalysisRecommender.ts`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/services/map/MapNLQueryBuilder.ts`
- `src/services/map/MapSyncService.ts`
- `src/services/map/ExternalServiceConnector.ts`

New planned files:

- `src/centerpanel/components/map/context/mapContextSelectors.ts`
- `src/centerpanel/components/map/context/mapEvidenceArtifacts.ts`
- `src/centerpanel/components/map/context/mapSyncBridge.ts`
- `src/centerpanel/components/map/context/mapIdeArtifacts.ts`
- `src/centerpanel/components/map/hooks/useMapLayerCommands.ts`
- `src/centerpanel/components/map/hooks/useMapWorkflowCommands.ts`
- `src/centerpanel/components/map/hooks/useMapReportHandoff.ts`
- `src/centerpanel/components/map/hooks/useMapPublicationExport.ts`
- `src/centerpanel/components/map/hooks/useMapAnalysisRecommendations.ts`
- `src/centerpanel/components/map/hooks/useMapUrbanSync.ts`
- `src/centerpanel/components/map/hooks/useMapIdeSync.ts`

Adjacent integration files:

- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- `src/features/urbanAnalytics/lib/types.ts`
- `src/services/reporting/*`
- `src/features/dashboard/*`
- `src/features/education/*`
- `src/centerpanel/Flows/*`

---

## Appendix B: Existing Test Surface

Keep and extend:

- `src/stores/__tests__/useMapExplorerStore.test.ts`
- `src/services/map/__tests__/MapWorkflowService.test.ts`
- `src/services/map/__tests__/MapSyncService.test.ts`
- `src/services/map/__tests__/MapScientificQA.test.ts`
- `src/services/map/__tests__/MapReviewSessionService.test.ts`
- `src/services/map/__tests__/MapReportHandoffService.test.ts`
- `src/services/map/__tests__/MapPersistenceService.test.ts`
- `src/services/map/__tests__/MapNLQueryBuilder.test.ts`
- `src/services/map/__tests__/MapExportService.test.ts`
- `src/services/map/__tests__/MapEngineAdapter.test.ts`
- `src/services/map/__tests__/MapDataIO.test.ts`
- `src/services/map/__tests__/MapCartographyAdvisor.test.ts`
- `src/services/map/__tests__/MapAnalysisRecommender.test.ts`
- `src/services/map/__tests__/MapAnalysisDispatcher.test.ts`
- `src/services/map/__tests__/ExternalServiceConnector.test.ts`
- `src/centerpanel/components/map/__tests__/map-components.test.ts`
- `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`
- `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`
- `src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx`
- `e2e/map-modal-layout.spec.ts`
- `e2e/map-context-and-geojson.spec.ts`
- `e2e/map-csv-kml-gpx-import.spec.ts`
- `e2e/map-columnar-io.spec.ts`
- `e2e/map-image-export.spec.ts`
- `e2e/map-choropleth.spec.ts`
- `e2e/map-point-symbology.spec.ts`
- `e2e/map-spatial-stats-renderers.spec.ts`
- `e2e/map-temporal-player.spec.ts`
- `e2e/map-report-handoff.spec.ts`
- `e2e/map-geoai-bridge.spec.ts`
- `e2e/map-explorer-stability.spec.ts`

New test areas:

- map context selectors;
- map evidence artifacts;
- map sync bridge;
- map IDE artifacts;
- Urban sync payload;
- publication manifest;
- workflow manifest preview;
- layer readiness badges;
- report/dashboard binding hints.

---

## Appendix C: Shared Vocabulary

- Spatial operating surface: Map Explorer as the module that owns live map context and spatial evidence.
- Map evidence artifact: a typed record representing a map layer, workflow output, QA finding, export, or handoff.
- Reproducibility manifest: structured record of inputs, parameters, outputs, QA, source versions, and context.
- Publication readiness: whether a map can be exported or reported with sufficient title, legend, attribution, scale, and QA.
- Urban sync payload: map summary sent to Urban Analytics for method/data fitness and evidence reasoning.
- IDE artifact: script, manifest, SQL, markdown note, or adapter opened in Synapse IDE.
- Layer readiness: layer-level state describing whether geometry, CRS, metadata, temporal, query, and worker conditions are fit for action.
- Scientific QA gate: rule-based gate that allows, warns, or blocks actions based on map data quality and publication risk.

---

## Appendix D: Tri-Modal Alignment Charter

This appendix is the binding alignment layer between:

- `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`

It exists so the three plans evolve as one premium scientific workbench rather than three visually polished but disconnected modules. It does not generate the future sequential prompts. It only defines the operational, wire/layout, synchronization, and premium-design standard those prompts must follow later.

The standalone canonical version of this alignment layer is `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`. When future prompt sequences are generated, that file should be treated as the shared source of truth across the three module plans.

### D.1 Shared Product Model

The workbench has three primary surfaces:

| Surface | Product role | State ownership | Primary output |
|---|---|---|---|
| Synapse IDE | Coder, file, terminal, script, manifest, and AI apply surface. | editor tabs, file tree, AI plans, tasks, terminal sessions, generated code artifacts. | code artifacts, manifests, notebooks, diffs, execution notes. |
| Map Explorer | Spatial operating surface. | viewport, layers, AOI, selections, QA, drawing, measurement, temporal state, map evidence, report snapshots. | map layers, map evidence, spatial QA, publication exports, map report handoffs. |
| Urban Analytics | Scientific reasoning and methodology surface. | method cards, indicators, data fitness, evidence tray, workflow interpretation, report/dashboard/education bindings. | urban evidence, method dossiers, indicator records, report sections, dashboard bindings. |

The IDE must not become a map store. Map Explorer must not become a methodology catalog. Urban Analytics must not become a code editor or map renderer. Premium synchronization means each surface keeps its ownership and publishes typed summaries to the others.

### D.2 Shared Work Cycle

All three plans must support the same evidence lifecycle:

```text
Question -> Context -> Data -> QA -> Method -> Run -> Evidence -> Code -> Map -> Report -> Dashboard -> Review
```

Map Explorer responsibility in this lifecycle:

- define spatial context through viewport, AOI, selected features, visible layers, and temporal state;
- validate spatial evidence through CRS, geometry, topology, provenance, queryability, worker readiness, and publication QA;
- publish derived spatial layers and map evidence artifacts;
- create report/export-ready map snapshots and publication manifests;
- provide Urban Analytics with map context summaries and method-readiness signals;
- provide Synapse IDE with reproducible map scripts, manifests, query files, and QA notes.

Synapse IDE responsibility in this lifecycle:

- open, edit, and preserve generated map scripts and manifests;
- expose file-level provenance and execution notes;
- publish generated outputs back to Map Explorer through typed references rather than raw large payloads.

Urban Analytics responsibility in this lifecycle:

- interpret map context against method requirements;
- convert map evidence into urban evidence;
- keep scientific assumptions, data fitness, uncertainty, report/dashboard/education links, and references visible.

### D.3 Shared Wire/Layout Contract

The three modules must look like coordinated zones in one professional workbench.

Canonical desktop wire:

```text
Global app shell
  Top command/status band
  Left navigation or asset rail
  Primary work surface
  Right context/dossier/inspection rail
  Bottom status, terminal, timeline, or output band
```

IDE wire:

```text
Top: header, tabs, run/build/sync status
Left: activity rail + file explorer/search/git-like future slots
Center: Monaco editor, diff/editor groups, preview when relevant
Right: AI assistant, bridge panes, artifact metadata
Bottom: terminal, problems, tasks, output, plan history
```

Map Explorer wire:

```text
Top: map cockpit, mode, sync, QA, save/readiness status
Left: layer/evidence rail, imports, cartography, source metadata
Center: map canvas and direct spatial interaction
Right: QA, workflow, report handoff, NL query, review timeline
Bottom: coordinates, scale, CRS, temporal player, active tool, memory/worker state
```

Urban Analytics wire:

```text
Top: research context, search, study area, sync, QA, evidence count
Left: method/indicator/library rail with filters and readiness badges
Center: analytical workflow and current research task
Right: four-block scientific dossier: methodology, data, code, references
Bottom/Tray: evidence timeline, report/dashboard/IDE/map actions
```

Map-specific wire obligations:

- The map canvas remains visually and functionally dominant.
- Left rail is the spatial evidence registry.
- Right dock is a task-specific inspection and decision surface.
- Bottom status is scientific instrumentation, not decoration.
- On constrained layouts, panels collapse into drawers while the map remains first.

### D.4 Shared Premium Design Contract

The premium design language is:

- dark professional shell with restrained contrast;
- compact panels;
- precise icon buttons with labels/tooltips;
- visible status chips for sync, QA, readiness, provenance, and unsaved state;
- no large decorative hero sections inside tool surfaces;
- no vague cards that do not perform an action;
- no card-in-card UI for dense workbench areas;
- no hidden disabled states;
- no text overflow in buttons, chips, tabs, or row labels;
- stable dimensions for rails, toolbars, rows, tabs, and status bands;
- color used as a signal only when paired with text or icon meaning.

Shared status vocabulary:

| Status | Meaning | Visual treatment |
|---|---|---|
| Ready | Action can run with current context. | compact positive chip, no exaggerated success treatment. |
| Ready with caveats | Action can run but limitations must travel with output. | warning chip with caveat count. |
| Needs context | Missing AOI, layer, file, method, field, or destination. | neutral chip with specific missing item. |
| Blocked | Scientific, safety, or data issue prevents formal output. | error chip plus exact blocker. |
| Demo/sample | Output uses sample data or fixture mode. | persistent sample label. |
| Unsynced | Another module has not received current state. | sync chip and action. |

### D.5 Shared Synchronization Contract

The three modules should share one typed integration spine.

Canonical event families:

| Family | Direction | Purpose |
|---|---|---|
| `ide:*` | IDE to workbench | Open, update, annotate, or publish code/file artifacts. |
| `map:*` | Map Explorer to workbench | Publish map context, layer evidence, QA, exports, and workflow outputs. |
| `urban:*` | Urban Analytics to workbench | Publish method context, evidence artifacts, report/dashboard bindings, and data fitness. |
| `synapse:navigate` | shared | Move between tabs, flows, report, dashboard, map, education, and IDE surfaces. |
| `reporting/*` | reporting | Queue or refresh structured report inserts. |

Canonical artifact references:

```text
artifactId
artifactKind
sourceModule
sourceId
createdAt
title
summary
provenance
qa
relatedLayerIds
relatedCardIds
relatedFlowIds
relatedFilePaths
manifestId
reportInsertId
dashboardBindingId
```

Rules:

- Large data is never copied through events.
- Events carry ids, summaries, manifests, and references.
- Every generated code artifact links back to map/urban evidence when applicable.
- Every map evidence artifact can be converted into an Urban evidence artifact.
- Every Urban method can request map context and IDE artifact generation.
- Every report/dashboard insert carries QA and provenance.

### D.6 Map-Specific Alignment Obligations

Map Explorer must implement the alignment standard as follows:

- Map context summaries must be derivable from `useMapExplorerStore` without duplicating ownership.
- Every layer row should eventually expose source, QA, provenance, readiness, and cross-module references.
- Map workflow outputs must include reproducibility manifests that IDE can open and Urban Analytics can interpret.
- Map report handoff must carry evidence ids and QA caveats.
- Map publication exports must create a manifest, not only an image/PDF.
- Urban method requirements should highlight compatible layers and missing prerequisites.
- IDE artifact actions should open named scripts/manifests without replacing active editor content by default.
- VoxCity and 3D handoffs must prefer real project geometry and label sample mode visibly.

### D.7 Cross-Plan Acceptance Gate

No future implementation prompt should be considered complete if it improves only one module visually while breaking cross-module coherence.

Shared acceptance criteria:

- The same artifact can be opened from its owning module and referenced from the other two.
- The same QA caveat appears consistently in IDE manifest, Map Explorer panel, Urban dossier, report insert, and dashboard binding where relevant.
- A user can move from Urban method -> Map context -> IDE script -> Map output -> Report insert without losing provenance.
- A user can move from IDE generated file -> Map layer -> Urban method recommendation without duplicate state ownership.
- A user can move from Map layer -> Urban evidence -> IDE reproducibility script without manual copy-paste.

### D.8 Prompt-Readiness Note

Future sequential prompts must be generated later from the three aligned plans in this order:

```text
Foundation sync contracts -> IDE artifact handling -> Map context/evidence -> Urban context/evidence -> cross-module workflows -> premium UI polish -> validation
```

This appendix intentionally stops at alignment. It does not create the future prompt sequence.
