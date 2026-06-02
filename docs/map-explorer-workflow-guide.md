# Map Explorer Workflow Guide

Date: 2026-05-30
Audience: Urban analysts, planners, reviewers, and report authors

Map Explorer is the browser GIS workspace inside the Urban Analytics Workbench. It is designed for auditable spatial review: every source, CRS assumption, QA caveat, generated result, and report handoff should remain visible.

## Workspace Layout

- Center: interactive map canvas with 2D vector, raster-tile, temporal, analytical, comparison, and 3D handoff surfaces.
- Left rail: layer stack, source/catalog entries, visibility, opacity, contents grouping, labels, style, and import entry points.
- Right rail and floating panels: layer inspector, scientific QA, processing toolbox, model builder, diagnostics, plugin registry, review timeline, collaboration, report handoff, layout tools, raster, and 3D scene panels.
- Bottom timeline/status bar: zoom, CRS, layer counts, temporal playback, active mode, task state, sync state, and save/load state.
- Command palette: keyboard-first access to registered map commands and processing tools.
- Constrained/mobile widths: the map remains first; panels move into drawers and toolbar commands collapse into grouped controls.

## Import and Register Sources

Use the import command or catalog/connection surfaces to load or register data. See the full support matrix in [`map-source-support-matrix.md`](map-source-support-matrix.md).

Supported local commit paths include:

- GeoJSON / JSON feature collections.
- CSV point layers after latitude/longitude mapping and skipped-row review.
- Arrow, Feather, IPC, GeoParquet, and Parquet through schema preview and worker-transfer metadata.
- KML, KMZ, and GPX converted into GeoJSON features.
- Shapefile `.shp` / zipped Shapefile imports with `.prj` detection when available.
- GeoPackage imports with layer discovery.

Profile, streaming, or scene-specific paths include:

- FlatGeobuf extent streaming from HTTP range-capable URLs.
- PMTiles and on-the-fly vector tile rendering with a tiled/simplified caveat.
- GeoTIFF raster inspection, sampled histogram, QA, and terrain DEM metadata.
- WMS, WMTS, XYZ, WFS, OSM/Overpass, COG/STAC, CityJSON, and 3D Tiles through their external, EO, or 3D scene paths.

Every committed or registered layer should expose source type, feature count where known, queryability, CRS label, provenance, restore state, and QA caveats.

## Inspect and Prepare Layers

1. Confirm the layer is visible in the layer stack or contents tree.
2. Open the layer inspector to review Overview, Source, Schema, CRS, QA, Style, Lineage, and Report tabs.
3. Review QA badges. Missing CRS, invalid geometry, unknown temporal metadata, missing noData, missing provenance, external dependency, tiled/simplified display, sampled raster stats, and demo/generated state are not hidden.
4. Adjust style, labels, opacity, scale ranges, and legend settings before publication.
5. Use undo/redo for reversible map edits such as layer add/remove/style, AOI edits, joins, and workflow-derived layer adds. Non-reversible side effects such as exports and report insertion are audited but not placed on the undo stack.

If prerequisites are missing, disabled commands should name the missing input instead of showing generic placeholder text.

## Analyze

Analyze mode, the processing toolbox, command palette, and model builder cover:

- Choropleth, bivariate, dot-density, heatmap, graduated, proportional, and label renderers.
- Local Moran's I, Getis-Ord Gi*, topology validation/repair, joins/relates, field statistics, and safe field calculator previews.
- AOI, buffer, intersect, union, difference, selection, comparison, and model-builder chains.
- Raster QA and sampled histograms.
- Temporal playback and frame export.
- 3D terrain/city-model inspection, zoning envelopes, massing alternatives, sunlight/shadow, view corridors, and section/cut planes.
- Natural-language queries over visible queryable layers, gated by AI guardrails and human confirmation before apply.

Planar metric work is blocked unless `CrsPreflight` approves a projected execution CRS. EPSG:4326 display coordinates are not enough for planar area, distance, buffer, or nearest-distance joins.

## Collaborate, Audit, and Recover

- Review timeline entries record imports, command runs, QA state, workflow outputs, report handoffs, exports, AI-proposed actions, and package exports.
- Review > Collaboration and the bottom Timeline surface show collaboration sync state, reviewer presence, comments grouped by target ID, annotation links, and evidence IDs. The status bar separates viewport sync from collaboration sync with a `Collab` item.
- Collaboration sessions sync annotations, comments, target IDs, evidence IDs, and presence through Yjs. Offline or disconnected sessions show `local-only` or `offline` rather than claiming live sync, and collaboration payloads exclude raw source bytes and layer geometry.
- Diagnostics collect bounded, redacted operational events for command runs, worker failures, external-service errors, performance warnings, and panel errors.
- Map panel error boundaries keep scoped failures recoverable instead of blanking the modal.

## Export, Package, and Report

Use export surfaces for:

- GeoJSON and GeoParquet data export for exportable layers.
- Publication figures with title, page size, DPI, scale bar, north arrow, legend, graticule, inset, attribution, CRS, and QA metadata.
- Map books and layout composer pages.
- Offline reproducible packages containing project snapshots, source handles, styles, manifests, evidence references, review session records, README metadata, and small inline source sidecars only when bounded.
- Report handoff that inserts a map finding with title, CRS, visible layers, QA caveats, snapshot metadata, evidence IDs, and provenance.

Large, external, provider-backed, and metadata-only sources restore as unavailable or recoverable with a named reason instead of silently embedding data.

## Keyboard and Accessibility

- Use the skip link to move directly to the map canvas.
- Use arrow keys, plus/minus zoom, reset, command palette, toolbar buttons, and context-menu traversal for keyboard operation.
- `Ctrl+K` / `Cmd+K` opens the command palette.
- `Ctrl+Z` / `Cmd+Z` and redo shortcuts operate on reversible map edits without stealing native editable-field undo.
- Reduced-motion preference disables GIS motion classes and temporal auto-play.
- Dialogs and panels expose role labels and visible focus states.

## Scientific Caveats

Map Explorer labels:

- CRS defaults, user-declared CRS, and missing projection metadata.
- Geometry validity, topology repair state, and skipped import rows.
- Scale, classification, legend, vector-tile generalization, and raster sampling caveats.
- Missing temporal metadata and reduced-motion playback constraints.
- Demo, sample, generated, external, local-only, metadata-only, and unavailable restore states.
- NL query scope limits and AI proposal confirmation state.
- External service dependencies, credentials, CORS, provider availability, and attribution obligations.
- Unknown metadata rather than substituting hidden defaults.

Treat outputs as auditable analysis artifacts. For statutory decisions or publication, review CRS, source lineage, geometry validity, raster noData, vertical datum, classification method, scale, provider terms, and caveats before export.
