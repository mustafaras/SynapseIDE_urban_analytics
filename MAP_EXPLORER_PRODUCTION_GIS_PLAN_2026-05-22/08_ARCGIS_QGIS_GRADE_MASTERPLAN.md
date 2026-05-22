# 08 - ArcGIS/QGIS-Grade GIS Product Masterplan

Date: 2026-05-22
Status: expanded professional GIS target

## Purpose

This document upgrades the Map Explorer plan from "production hardening" to "professional GIS product design." The target is not to clone ArcGIS Pro or QGIS feature-for-feature. The target is to build a browser-native GIS workbench with the same seriousness:

- Cataloged data sources.
- Strong layer tree and symbology.
- Attribute table and field operations.
- Editing, snapping, topology, and geometry validation.
- Geoprocessing / processing toolbox.
- Model/workflow builder.
- 2D and 3D scenes.
- Layout/print composer.
- Plugin/extension architecture.
- Project/session persistence.
- Scientific QA, reproducibility, and Urban Analytics evidence integration.

## Benchmark Capabilities From Professional GIS

Professional GIS tools share a common operating model:

- A project/catalog browser for local, remote, database, and service data.
- A contents/layer tree where visibility, grouping, ordering, scale ranges, symbology, labels, joins, and source metadata are inspectable.
- Map and scene views that are separate but synchronized where needed.
- Editing tools with snapping, constraints, vertex-level operations, undo/redo, topology checks, and attribute editing.
- Geoprocessing or processing toolbox with parameterized tools, batch execution, model builders, history, and reproducible outputs.
- Attribute tables, selections, joins, relates, field calculators, statistics, and charts.
- Layout designer with legends, scale bars, north arrows, grids, dynamic text, attribution, and export settings.
- Extension/plugin model for advanced tools and domain-specific workflows.

Map Explorer should implement these patterns in the web idiom, using current repo strengths: MapLibre, deck.gl, Zustand, DuckDB-WASM, workers, WASM spatial index, Urban Analytics validity/evidence, and existing map services.

## Product Pillars

### Pillar 1 - GIS Project And Catalog

Goal: make data discoverable, restorable, and trustworthy.

Required surfaces:

- Catalog panel.
- Project contents browser.
- Source connection manager.
- Recent sources.
- Favorites.
- Service connections.
- Dataset health state.
- Source support matrix.

Required source types:

- Local file: GeoJSON, CSV, KML/GPX if supported, shapefile/GeoPackage via existing dependencies, FlatGeobuf, Arrow/GeoParquet, GeoTIFF.
- Browser-local persisted source: IndexedDB, project package, worker table, DuckDB table.
- Remote service: XYZ/WMTS/WMS/WFS, PMTiles, FlatGeobuf stream, GeoJSON URL, OSM/Overpass, STAC/EO where current tools support it.
- Generated/derived: geoprocessing output, Urban Analytics output, GeoAI/simulation output, 3D massing output.
- Demo/sample: explicit teaching/demo packs only.

Deliverables:

- `MapSourceRegistry`
- `MapConnectionRegistry`
- Source profile cards.
- Source restore policy.
- Source health diagnostics.
- Catalog tree UI.

Acceptance:

- A layer never appears as an anonymous blob unless explicitly temporary.
- Every layer can answer: where did I come from, what CRS, what schema, what geometry, what license, what restore state, what QA?

### Pillar 2 - Contents Tree And Layer Workbench

Goal: make the layer manager equivalent to a professional GIS contents pane.

Required features:

- Group layers.
- Reorder layers.
- Visibility and opacity.
- Scale ranges.
- Duplicate layer.
- Rename layer.
- Remove with undo.
- Source repair.
- Layer filters.
- Definition queries.
- Selection state per layer.
- Read-only vs editable flag.
- Publication readiness flag.
- QA badges.
- Runtime mode badges.
- Report/evidence bindings.

Layer inspector tabs:

- Overview.
- Source.
- Schema.
- CRS.
- Symbology.
- Labels.
- Filters/query.
- Editing/topology.
- Analysis lineage.
- QA and publication.
- Urban Analytics bindings.

Acceptance:

- A professional analyst can understand, style, filter, select, and audit a layer without needing developer tools.

### Pillar 3 - Attribute Table, Fields, Joins, And Statistics

Goal: bring attribute workflows into Map Explorer.

Required table features:

- Virtualized table.
- Sort.
- Filter.
- Search.
- Select rows.
- Zoom to selected.
- Show selected only.
- Field visibility.
- Field type inference.
- Numeric/categorical/temporal statistics.
- Histograms and value counts.
- Export selected rows.
- Copy selected features.

Field tools:

- Add calculated field for derived non-destructive output layer.
- Field calculator expressions with safe expression engine.
- Normalize fields.
- Reclassify fields.
- Convert temporal fields.
- Join/relate preview by key.

Urban Analytics integration:

- Field availability feeds method compatibility.
- Numeric fields feed recommended choropleth, regression, clustering, and indicators.
- Temporal fields feed monitoring/trend methods.
- Missing fields feed data fitness gaps.

Acceptance:

- Selected table rows highlight on map and update Urban context.
- Field stats and missingness become data-fitness signals.

### Pillar 4 - Editing, Snapping, Topology, And AOI

Goal: make geometry creation safe enough for analytical use.

Required editing modes:

- Create point, line, polygon, rectangle, circle.
- Edit vertices.
- Move feature.
- Delete feature.
- Split polygon/line.
- Merge selected polygons.
- Reshape boundary.
- Copy/paste features.
- Attribute edit form.
- Undo/redo stack.

Snapping:

- Snap to vertex.
- Snap to segment.
- Snap to grid.
- Snap tolerance setting.
- Layer-specific snapping enablement.

Topology checks:

- Self-intersection.
- Ring closure.
- Duplicate vertices.
- Empty geometry.
- Invalid polygon winding if relevant.
- Overlap/gap checks for selected topology groups.
- CRS suitability for measurement.

AOI features:

- AOI from drawn polygon.
- AOI from selected features.
- AOI from visible viewport.
- AOI from geocoded place.
- AOI from Urban study area.
- AOI validation and caveats.
- AOI lock/freeze for reproducible runs.

Acceptance:

- AOIs used by Urban Analytics are validated, named, source-tracked, and reproducible.

### Pillar 5 - Processing Toolbox / Geoprocessing

Goal: create a professional GIS processing toolbox, not scattered buttons.

Toolbox structure:

- Data management.
- CRS/projection.
- Geometry.
- Overlay.
- Proximity.
- Selection/extraction.
- Raster/remote sensing.
- Network/accessibility.
- Spatial statistics.
- Urban indicators.
- 3D/block/digital twin.
- Report/export.

Tool object contract:

```ts
interface MapProcessingToolDefinition {
  toolId: string;
  label: string;
  category: string;
  description: string;
  inputParameters: ProcessingParameter[];
  outputDefinitions: ProcessingOutputDefinition[];
  requiredCrs?: string;
  executionMode: "main-thread-preview" | "worker" | "spatial-db" | "wasm" | "gpu" | "external";
  runtimeMode: "live" | "demo" | "synthetic" | "environment-dependent";
  qaGates: ProcessingQAGate[];
  urbanMethodLinks: string[];
}
```

Minimum processing tools:

- Reproject.
- Define CRS.
- Clip.
- Buffer.
- Dissolve.
- Intersect.
- Union.
- Difference.
- Spatial join.
- Point in polygon.
- Nearest features.
- Aggregate points to polygons.
- Calculate geometry.
- Feature centroids.
- Convex/concave hull.
- Voronoi/Thiessen.
- Grid/hex/H3 binning.
- Choropleth classification.
- Hot spot/LISA dispatch.
- Network accessibility dispatch.
- Zonal statistics when raster path is ready.
- 3D block envelope generation.
- Sun/shadow analysis dispatch.

Toolbox UI:

- Search tools.
- Tool detail page.
- Parameter form.
- Input layer pickers with compatibility warnings.
- CRS preflight panel.
- Estimate cost/time.
- Preview output.
- Run.
- Cancel.
- View logs.
- Add output to map.
- Add output to Urban evidence/report.
- Run history.

Acceptance:

- Every processing run has parameters, source references, execution environment, QA, and output manifest.

### Pillar 6 - Model Builder / Workflow Designer

Goal: let users chain operations like professional GIS model builders.

Required features:

- Node graph or ordered step list.
- Inputs, tools, outputs.
- Parameter binding.
- Intermediate outputs.
- Validation before run.
- Batch run over layers/AOIs.
- Save workflow template.
- Export workflow manifest.
- Generate script/code artifact for Synapse IDE.
- Publish result to Urban Analytics.

Initial implementation can be a step-based builder before a node graph.

Acceptance:

- A buffer -> intersect -> aggregate -> choropleth -> report workflow can be saved and rerun.

### Pillar 7 - Map Layout And Print Composer

Goal: produce professional figures, not screenshots.

Required layout elements:

- Map frame.
- Legend.
- Scale bar.
- North arrow.
- Title/subtitle.
- Dynamic text.
- CRS label.
- Attribution/source note.
- QA caveats.
- Runtime mode label.
- Date/time.
- Grid/graticule.
- Inset map.
- Overview map.
- Chart/table panel.

Output formats:

- PNG.
- SVG.
- PDF.
- GeoJSON/data package where relevant.
- Reproducible map package JSON.

Acceptance:

- Published map figures include enough metadata to stand in an academic/professional report.

### Pillar 8 - 2D/3D Scene System

Goal: support both map and scene views.

Required scene types:

- 2D map.
- 2.5D extruded map.
- 3D urban scene.
- Split 2D/3D synchronized view.
- Scenario comparison scene.

Required 3D layer types:

- Terrain/elevation.
- Extruded building footprints.
- 3D blocks/massing.
- Parcel/block/zoning envelopes.
- CityJSON buildings.
- Voxel/solar/raster overlays.
- 3D Tiles where feasible.
- Point clouds if/when runtime supports it.

See `09_3D_BLOCKS_DIGITAL_TWIN_PLAN.md` for detailed 3D block plan.

### Pillar 9 - Administration, Plugins, And Extensions

Goal: make the GIS workbench maintainable and extensible.

Required admin/dev features:

- Plugin/tool registry.
- Capability flags.
- Environment diagnostics.
- External service credentials/proxy settings.
- Worker/WASM/GPU availability panel.
- Bundle/performance diagnostics.
- Error bus integration.
- Tool execution logs.
- Data privacy and PII redaction warnings for exported artifacts.

Extension points:

- New processing tool.
- New layer renderer.
- New source connector.
- New Urban method bridge.
- New report exporter.
- New 3D analysis panel.

Acceptance:

- Advanced capabilities can be added without editing the central modal shell.

## Professional GIS User Journeys

### Journey 1 - Planner Imports Parcels And Runs Suitability

1. Open Catalog.
2. Import parcel polygons.
3. Define/confirm CRS.
4. Inspect schema and missing fields.
5. Join zoning table.
6. Calculate FAR/coverage fields.
7. Style parcels by development potential.
8. Send context to Urban Analytics.
9. Urban method recommends suitability/scenario workflow.
10. Generate report figure with caveats.

### Journey 2 - GIS Analyst Builds A Reusable Processing Model

1. Open Processing Toolbox.
2. Add buffer tool for transit stops.
3. Add intersect tool with residential blocks.
4. Add aggregate statistics by district.
5. Add choropleth renderer.
6. Save model as "Transit access coverage."
7. Run model against another AOI.
8. Publish outputs to Urban evidence.

### Journey 3 - Urban Designer Tests 3D Block Massing

1. Load blocks/parcels/buildings.
2. Confirm local projected CRS.
3. Set zoning controls: max height, setbacks, FAR, coverage.
4. Generate massing alternatives.
5. Compare sunlight/shadow impact.
6. Evaluate public realm and density metrics.
7. Publish selected scenario to Urban Analytics.
8. Export 3D scene snapshot and scenario table.

### Journey 4 - Reviewer Audits Evidence

1. Open Urban Evidence Tray.
2. Focus map output layer.
3. Inspect source, CRS, QA, lineage, and method parameters.
4. Open review timeline.
5. Export reproducible package.
6. Verify report figure matches map state.

## Implementation Order

1. Catalog/source registry.
2. Layer workbench and inspector.
3. CRS preflight.
4. Attribute table and field stats.
5. Processing toolbox foundation.
6. Editing/AOI/topology.
7. Model builder.
8. Layout/print composer.
9. 3D scene and block tools.
10. Plugin/admin/diagnostics.
11. Release hardening.

## Benchmark References

The plan is informed by public professional GIS documentation, including:

- QGIS User Guide and Processing documentation.
- QGIS 3D map view documentation.
- ArcGIS Pro editing and geoprocessing documentation.
- ArcGIS Pro 3D scene / 3D Analyst documentation.
- ArcGIS Urban documentation for plan/scenario/urban development concepts.

