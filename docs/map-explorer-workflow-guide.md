# Map Explorer Workflow Guide

Date: May 2, 2026
Audience: Urban analysts, planners, reviewers, and report authors

Map Explorer is a scientific spatial workspace. It can be opened as a modal from the Urban Analytics Workbench or used as an embedded analysis companion from workflow handoffs.

## Workspace Layout

- Center: interactive map canvas with 2D, temporal, analytical, and comparison surfaces.
- Left rail: layer stack, metadata, symbology review, visibility, opacity, and import entry points.
- Right rail: scientific QA, workflow actions, review timeline, report handoff, and analysis panels.
- Bottom timeline/status bar: zoom, CRS, project, active mode, layer counts, temporal playback, sync state, and save status.
- Constrained/mobile widths: the map remains first; panels move into bottom drawers and toolbar commands collapse into grouped icon controls.

## Import Data

Use the `Import` command to load local spatial data:

- GeoJSON for feature collections.
- CSV for point layers with latitude/longitude mapping and skipped-row diagnostics.
- KML, KMZ, and GPX for field traces, placemarks, routes, and tracks.
- Arrow and GeoParquet for columnar spatial data with schema preview, quality notes, worker-transfer readiness, and memory estimates.

Every imported layer appears in the layer stack with source type, feature count, queryable status, CRS label, and QA caveats where available.

## Inspect and Prepare Layers

1. Confirm the layer is visible in the layer stack.
2. Open metadata to inspect CRS, source, geometry type, feature count, provenance, and queryability.
3. Review QA badges. Missing CRS, invalid geometry, unknown temporal metadata, or missing provenance are not hidden.
4. Adjust opacity and symbology before publishing or analysis.

If the layer list is empty, Map Explorer states the missing prerequisite: import or add a dataset before layer controls, QA, comparison, and report handoff can run.

## Analyze

Use Analyze mode or the command palette for:

- Choropleth classification for polygon layers.
- Heatmap, proportional, and graduated point renderers.
- Local Moran's I and Getis-Ord Gi* result renderers.
- Temporal playback for time-series layers.
- AOI, buffer, intersect, union, difference, and comparison workflows.
- Natural-language queries over visible queryable layers.

Analysis proposals are previewable. QA caveats travel with action proposals and report handoff.

## Compare

Comparison mode displays split/swipe map review with synchronized legends. It is available when comparable visible layers or workflow outputs exist. If prerequisites are missing, the disabled or empty state names them.

## VoxCity and 3D Handoff

VoxCity and sunlight workflows prefer real project geometry when available. Sample/demo footprints remain explicitly labeled as sample mode. Real OSM, CityJSON, and project geometry carry provenance labels into 2D overlays, 3D workflows, map outputs, and reports.

## Export and Report

Use Export for:

- GeoJSON/GeoParquet data exports where layers are visible and exportable.
- Publication map export with PDF, PNG, or SVG, DPI, page size, title block, scale bar, north arrow, legend, graticule, inset, and attribution controls.
- Report handoff that inserts a map finding with title, CRS, layers, QA caveats, snapshot metadata, and provenance.

Report handoff is disabled until a map state has enough context to produce a truthful finding.

## Keyboard and Accessibility

- Use the skip link to move directly to the map canvas.
- Use arrow keys, plus/minus zoom, reset, command palette, and visible toolbar buttons for keyboard operation.
- Context menu actions support keyboard traversal.
- Dialogs and panels expose role labels for screen-reader navigation.

## Scientific Caveats

Map Explorer labels:

- CRS defaults and missing projection metadata.
- Geometry validity and skipped import rows.
- Scale and thematic classification caveats.
- Missing temporal metadata.
- Demo/sample layers.
- NL query scope limits.
- External service dependencies.
- Unavailable metadata rather than substituting hidden defaults.

Treat Map Explorer outputs as auditable analysis artifacts. For statutory decisions or publication, review CRS, source lineage, geometry validity, classification method, scale, and caveats before export.
