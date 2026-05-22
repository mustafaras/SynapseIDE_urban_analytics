# Map Source Support Matrix

Date: 2026-05-22

This matrix records what the browser import preflight can truthfully profile and what can be committed as a map layer in the current Map Explorer slice. Source profiling never treats missing CRS, license, attribution, worker readiness, or skipped-row information as known unless the importer can actually derive it.

| Format | Preflight status | Commit status | Profiled fields | Notes |
| --- | --- | --- | --- | --- |
| GeoJSON / JSON | Supported | Supported | CRS status, feature count, geometry summary, schema, extent, size estimate, render budget, license/attribution caveat, worker readiness | CRS is `unknown` unless declared metadata is provided by a trusted source path. Large GeoJSON gets a worker-readiness caveat rather than silently downsampling the source. |
| CSV | Supported | Supported after coordinate confirmation | Header schema, suggested coordinate columns, valid feature count, skipped rows, size estimate, CRS unknown caveat, license/attribution caveat | Coordinate columns create point geometry but do not prove CRS; malformed or missing coordinates are counted before commit. |
| Arrow / Feather / IPC | Supported | Supported | Schema, row count, skipped rows, memory estimate, worker table, worker readiness, quality score | Worker transfer is staged and confirmed after commit. CRS remains unknown unless columnar metadata declares it. |
| GeoParquet / Parquet | Supported | Supported | GeoParquet metadata, CRS when declared, schema, row count, skipped rows, memory estimate, worker readiness, quality score | GeoParquet CRS is copied as declared metadata and still requires CRS suitability review before metric analysis. |
| KML / KMZ | Supported | Supported | Feature count, geometry summary, schema, extent, size estimate, CRS unknown caveat, license/attribution caveat | Browser KML/KMZ import extracts supported placemark geometry. CRS is not inferred from coordinates. |
| GPX | Supported | Supported | Feature count, geometry summary, schema, extent, size estimate, CRS unknown caveat, license/attribution caveat | Waypoints, routes, and tracks are converted into GeoJSON features. Device coordinate semantics remain a review caveat. |
| FlatGeobuf | Partial | Not committed in this slice | File size, format, metadata-only CRS caveat, worker/streaming readiness | Full bbox streaming and extent queries are planned for the large-vector streaming slice. |
| PMTiles | Partial | Not committed in this slice | File size, format, metadata-only CRS caveat, worker/tiling readiness | Full multi-scale vector tile rendering is planned for the vector tile pipeline slice. |
| WMS / WFS / XYZ | Partial | External-service path only | Endpoint, dependency status, CRS when declared, attribution/license when provider metadata supplies it, caveats | External services are environment-dependent; failures must show CORS/auth/offline/rate-limit reasons rather than blank layers. |
| GeoTIFF | Partial | Not committed in this slice | File size, format, metadata-only CRS caveat, worker/raster readiness | Raster render, band histogram, no-data handling, and raster QA are planned for the raster slice. |

## Preflight Rules

- Missing CRS stays `missing` when source metadata explicitly says no CRS is present; otherwise absent CRS is `unknown`.
- CSV skipped rows are counted from the selected latitude and longitude columns before commit.
- Large sources are flagged worker-ready when they exceed inline source-handle or interactive render budgets.
- License and attribution remain unknown unless the source profile provides them.
- Partial formats can be profiled without pretending they can be committed as full map layers in this slice.