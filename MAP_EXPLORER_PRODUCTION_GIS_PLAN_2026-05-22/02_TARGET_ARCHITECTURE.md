# 02 - Target Architecture

Date: 2026-05-22

## Architecture Goal

Map Explorer should become a production GIS workbench inside the browser:

- A deterministic spatial runtime with explicit data source ownership.
- A typed layer registry that carries render, schema, CRS, lineage, QA, and publication metadata.
- A workflow/action model where high-impact operations are previewed, validated, applied, audited, and reversible where practical.
- A bidirectional bridge to Urban Analytics that exchanges summaries, requirements, IDs, manifests, and evidence artifacts without moving heavy geometry through generic UI events.

## Bounded Module Ownership

| Module | Owns | Must Not Own |
| --- | --- | --- |
| Map Explorer | Map runtime, viewport, source handles, layer registry, feature selection, geometry buffers, spatial editing, visual styling, map-side workflows, render/export surfaces. | Analytical interpretation, method catalog semantics, indicator formulas, evidence interpretation. |
| Urban Analytics | Analysis context, method validity, data fitness, evidence artifacts, workflow manifests, analytical narratives, report/dashboard semantics. | MapLibre/deck runtime, raw geometry buffers, layer rendering internals. |
| Synapse IDE | Code artifacts, editor buffers, terminal, generated scripts, artifact recognition. | Spatial runtime state or analytical context ownership. |

## Production Layers

### 1. Map Runtime Layer

Responsible for:

- MapLibre lifecycle.
- Source and style registration.
- Render diagnostics.
- Feature hit testing.
- Viewport synchronization.
- Canvas export capture.
- Basemap/provider health.

Recommended modules:

- `src/services/map/runtime/MapRuntimeController.ts`
- `src/services/map/runtime/MapSourceRuntime.ts`
- `src/services/map/runtime/MapRenderDiagnostics.ts`
- `src/services/map/runtime/MapViewportSyncService.ts`

The React canvas should become a thin adapter around these services.

### 2. Source Registry Layer

The source registry is the missing production-grade data spine. It should store source handles, not necessarily full datasets.

Source handle examples:

- Inline small GeoJSON.
- Browser file reference/session blob.
- IndexedDB/local project reference.
- DuckDB-WASM table.
- Worker table.
- PMTiles URL.
- FlatGeobuf stream URL.
- WMS/WMTS/WFS/XYZ endpoint.
- GeoTIFF/raster tile source.
- CityJSON/3D Tiles source.
- Derived layer manifest reference.

Required fields:

- `sourceId`
- `sourceKind`
- `format`
- `storageMode`
- `crs`
- `schema`
- `geometrySummary`
- `featureCount`
- `extent`
- `license`
- `attribution`
- `lineage`
- `qaState`
- `sizeEstimate`
- `restorePolicy`
- `createdAt`
- `updatedAt`

Recommended modules:

- `src/services/map/sources/MapSourceRegistry.ts`
- `src/services/map/sources/MapSourceProfiler.ts`
- `src/services/map/sources/MapSourcePersistence.ts`
- `src/services/map/sources/MapSourceRestoreService.ts`

### 3. Layer Registry Layer

The existing `OverlayLayerConfig` and normalized metadata should remain the UI/render layer contract, but it should reference source handles for production datasets.

Production layer records should answer:

- What source does this render?
- What CRS is declared and what CRS is used for computation?
- Is the layer queryable?
- Is it visible?
- What feature/raster/voxel/temporal domain does it represent?
- What schema fields are available?
- What analysis run or workflow created it?
- What QA blockers or caveats apply?
- Can it be published, reported, or used as evidence?

### 4. Command And Action Layer

Every high-impact map operation should be represented as a command:

- Import data.
- Remove layer.
- Reproject source.
- Apply style.
- Draw/edit AOI.
- Run spatial query.
- Buffer/intersect/union/difference.
- Publish Urban run output to map.
- Send map context to Urban Analytics.
- Add map figure to report.
- Export data or figure.

Command lifecycle:

```text
draft -> preflight -> preview -> apply -> audit -> optional revert
```

Command object requirements:

- Stable command ID.
- User-facing label.
- Affected layer/source/AOI/run IDs.
- Required inputs.
- QA gates.
- CRS gates.
- Runtime mode: live, demo, synthetic, environment-dependent.
- Preview summary.
- Apply result.
- Revert capability and limitations.
- Review timeline entry.

Recommended modules:

- `src/services/map/actions/MapActionTypes.ts`
- `src/services/map/actions/MapActionPreflight.ts`
- `src/services/map/actions/MapActionHistoryService.ts`
- `src/services/map/actions/MapActionExecutor.ts`

### 5. CRS And Geometry Layer

CRS work must be explicit and centralized.

Rules:

- Map display may use EPSG:4326/3857 as appropriate.
- Computation must declare an execution CRS.
- Planar area/distance operations require a projected CRS unless explicitly geodesic.
- If CRS is unknown, computations that need metric correctness are blocked or require explicit user confirmation with limitations.
- Urban methods with `requiredCrs` must be matched before execution.

Recommended modules:

- `src/services/map/crs/MapProjectionService.ts`
- `src/services/map/crs/ExecutionCrsPlanner.ts`
- `src/services/map/crs/CrsPreflight.ts`
- `src/services/map/geometry/GeometryOperationDispatcher.ts`

Execution routing:

| Operation Size | Preferred Runtime |
| --- | --- |
| Tiny preview geometry | Main thread allowed with strict limits. |
| Medium vector operation | Worker + Turf/geos-wasm. |
| Large vector operation | DuckDB-WASM, geos-wasm, spatial index, chunked worker. |
| Repeated spatial joins | SpatialDB table + spatial index. |
| GPU-suitable raster/vector aggregation | WebGPU when available, CPU fallback. |

### 6. Query And Analysis Layer

Map-side analysis should use a planner:

1. Identify source handles and visible/queryable layers.
2. Validate CRS, schema, geometry, QA state, feature counts, and runtime availability.
3. Choose execution path: worker, spatial DB, engine service, external connector, or blocked state.
4. Produce result layer with provenance, QA, and reproducibility manifest.
5. Optionally register Urban workflow run or evidence publication.

Recommended modules:

- `src/services/map/query/MapQueryPlanner.ts`
- `src/services/map/query/MapSpatialQueryExecutor.ts`
- `src/services/map/analysis/MapAnalysisCommandFactory.ts`

### 7. Urban Analytics Bridge Layer

The bridge is a service-level contract, not a component shortcut.

Recommended module:

- `src/services/map/bridge/MapUrbanBridgeService.ts`

Bridge responsibilities:

- Build Map-to-Urban context payloads from store selectors.
- Receive Urban-to-Map method requests.
- Preview map compatibility.
- Open/focus Map Explorer with compatible layers and AOI state.
- Execute approved map workflows.
- Publish map outputs to Urban evidence only through immutable evidence creation or QA state changes.
- Emit review timeline entries for every handoff.

### 8. UI Layer

The UI should be dense, professional, and operational:

- Map center remains the primary work surface.
- Left rail: source/layer stack, filters, attribute table, imports.
- Right rail: inspector, QA, method compatibility, report handoff.
- Bottom rail: temporal playback, selection summary, processing queue.
- Command palette: searchable commands with disabled-state reasons.
- Cockpit: state and readiness summary, not decorative marketing.

UI components should subscribe with fine-grained Zustand selectors or receive data from controller hooks. Avoid passing large layer/source payloads through deep props.

## Canonical Data Flow

### Import Or Source Connect

```text
User chooses source
-> Source profiler reads metadata and sample
-> CRS/schema/geometry/license QA
-> Source registry handle created
-> Layer registry entry created
-> Map render source registered
-> Review event logged
-> Urban context summary updated by bridge
```

### Urban Method To Map Workflow

```text
Urban method card emits method request
-> MapUrbanBridge validates layer/AOI requirements
-> Map Explorer focuses compatible layers
-> User previews workflow or report snapshot
-> Command preflight checks CRS, QA, runtime, source handles
-> Result layer created with reproducibility manifest
-> Evidence artifact or run output registered
-> Urban panel updates readiness/evidence state
```

### Map Context To Urban Analytics

```text
Map state changes or user sends context
-> Bridge builds summarized payload
-> Payload includes AOI, layer summaries, field/CRS/QA summaries, selected counts, evidence references
-> Urban context store receives summary and references
-> Data fitness and method recommendations update
-> No heavy geometry is moved through the event
```

## State Slicing Target

The current `useMapExplorerStore.ts` can remain the public store, but internals should be sliced:

- `visibilitySlice`
- `viewportSlice`
- `sourceRegistrySlice`
- `layerRegistrySlice`
- `selectionSlice`
- `aoiDrawingSlice`
- `measurementSlice`
- `temporalSlice`
- `qaSlice`
- `evidenceSlice`
- `reviewSlice`
- `actionHistorySlice`
- `layoutPreferencesSlice`
- `bridgeSlice`

Each slice should define:

- State fields.
- Actions.
- Persistence policy.
- Reset/restore behavior.
- Selectors.
- Invariant tests.

## Production Invariants

- A visible layer must have a valid layer ID and source/reference metadata.
- An analysis layer must have provenance and a reproducibility manifest or explicit residual gap.
- A published figure must include visible layers, viewport, CRS, scale, attribution, QA state, and timestamp.
- A map-derived Urban evidence artifact must be immutable after creation.
- A command that produces evidence must record runtime mode and caveats.
- Unknown metadata must remain unknown; it must not be upgraded to ready by default.

