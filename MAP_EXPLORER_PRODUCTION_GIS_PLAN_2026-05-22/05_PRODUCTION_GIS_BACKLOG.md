# 05 - Production GIS Backlog

Date: 2026-05-22

Priority legend:

- P0: required for production-grade Map Explorer/Urban Analytics integration.
- P1: required for professional GIS depth.
- P2: advanced capability or scale improvement.

## Data Sources And I/O

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Source registry | Layer metadata exists; source lifecycle is spread across importer/exporter/persistence. | Add source handles, storage mode, restore policy, source QA, and layer-to-source references. |
| P0 | Import preflight | Importers and metadata exist. | Standardize schema, CRS, geometry, license, size, skipped rows, memory estimate, worker readiness. |
| P0 | Project restore | Store avoids heavy GeoJSON. | Restore layers from source handles or show precise unavailable states. |
| P1 | Attribute table | Selection and schema metadata exist. | Add table with sort/filter/select/focus/export. |
| P1 | Large vector streaming | Dependencies include FlatGeobuf/PMTiles. | Stream large sources and render/query by extent. |
| P1 | Raster/GeoTIFF | Dependencies exist. | Source profile, render, legend, histogram, raster QA, report metadata. |
| P1 | External service registry | WMS/WFS/XYZ support exists in services. | Add provider profiles, credentials, health, CORS/proxy guidance, rate-limit state. |
| P2 | Offline package | Export services exist. | Package source metadata, styles, manifests, and small sources for reproducible review. |

## CRS, Projection, And Measurement

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Central CRS preflight | CRS metadata exists. | Add operation-level CRS gate and execution CRS planner. |
| P0 | No false metric computation | Domain rule requires no EPSG:4326 planar area/distance. | Block planar metric ops on geographic CRS; allow labeled geodesic display. |
| P0 | Required CRS method matching | Urban method validity has `requiredCrs`. | Match Urban method requirements to map layers before execution. |
| P1 | CRS correction UI | Metadata can be missing. | Let users declare source CRS with explicit provenance/caveat. |
| P1 | Automatic local projection suggestion | proj4 and UTM helpers exist. | Suggest local UTM/equal-area execution CRS by AOI. |
| P2 | Reprojection cache | No clear cache contract. | Cache projected worker/SpatialDB results keyed by source and CRS. |

## Layer Rendering And Cartography

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Canonical layer model | Strong `OverlayLayerConfig`. | Add source references and stricter invariants. |
| P0 | Legend parity | Styles and legends exist. | Ensure every renderer updates map, layer panel, report, and export legend consistently. |
| P0 | No-data handling | Analysis adapter creates fields/classes. | Make no-data styling explicit and reportable. |
| P1 | Labeling | Some label style keys exist. | Add label editor, collision policy, scale ranges, and report export. |
| P1 | Bivariate/cartographic advanced styling | Carto engine files exist. | Wire advanced styles into production UI with QA caveats. |
| P1 | Temporal map layers | Temporal state exists. | Make frame metadata, playback, export frame, and Urban handoff complete. |
| P2 | Multi-scale vector tiles | PMTiles dependency exists. | Build tile pipeline for large local/remote data. |

## Selection, Editing, AOI

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Selection sync | Selected feature IDs in store. | Sync map, table, layer inspector, report, and Urban context. |
| P0 | AOI validity | Active AOI exists. | Add validation rules, warnings, caveats, and method requirement matching. |
| P1 | Vertex editing | Drawing exists. | Add edit handles, undo, topology warnings, and audit. |
| P1 | Snapping | Not obvious in current surface. | Add optional snapping to visible/queryable layers with performance bounds. |
| P1 | Selection tools | Feature popup exists. | Add rectangle/lasso/filter select and selected-feature operations. |
| P2 | Topology repair | QA can detect issues. | Add guided repair for simple invalid geometry cases. |

## Spatial Query And Analysis

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Queryable layer contract | Queryable metadata exists. | Centralize query planner for visible layers and source handles. |
| P0 | Workflow command lifecycle | Workflow preview exists. | Convert previews/applies into standard commands with audit/revert metadata. |
| P0 | Urban method request execution | Adapter exists. | Make method card actions route through Map compatibility preview. |
| P1 | Spatial SQL | DuckDB-WASM exists. | Surface SQL query builder/table outputs with safe execution scope. |
| P1 | Workerized overlay operations | Workflow service exists. | Route medium/large buffer/intersection/difference/union through workers/geos/SpatialDB. |
| P1 | Network analysis bridge | Network engine exists. | Publish network accessibility/routing outputs as map layers with Urban evidence. |
| P2 | Raster analytics | GeoAI/raster paths exist. | Zonal stats, raster classification summaries, uncertainty overlays. |

## Scientific QA And Provenance

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Universal QA gate | QA engine exists. | Every publish/export/analysis/report action checks QA blockers and caveats. |
| P0 | Evidence provenance | Map and Urban evidence models exist. | Ensure immutable Urban evidence references map layer/source/run IDs. |
| P0 | Demo/sample truthfulness | Demo labels exist. | Keep demo/synthetic/sample states through bridge, export, report, dashboard. |
| P1 | QA acknowledgement policy | Review timeline exists. | Add explicit acknowledgements for warnings and blockers where allowed. |
| P1 | Uncertainty metadata | Analysis adapter has QA summaries. | Expose confidence, model limitations, and uncertainty in inspector and reports. |
| P2 | QA diffing | Layer metadata normalized. | Show what changed between QA runs and why evidence became stale. |

## Urban Analytics Integration

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Canonical bridge service | Multiple adapters exist. | Create `MapUrbanBridgeService` with payload versions and compatibility shims. |
| P0 | Method compatibility rail | UrbanToMap preview exists. | Show method prerequisites, compatible layers, AOI, CRS, QA, and actions in Map UI. |
| P0 | Map context updates Urban recommendations | Context adapter exists. | Use summaries to filter/recommend methods and data fitness states. |
| P0 | Evidence tray map focus | Evidence tray can interact with Map store. | Add reliable open/focus layer/AOI/viewport behavior. |
| P1 | Dashboard/report bindings | Types exist. | Complete bindings from map figures/layers to Urban report/dashboard artifacts. |
| P1 | IDE artifact bridge | Code artifact services exist. | Generate reproducible scripts from map workflow manifests. |
| P2 | Collaborative review across modules | Review session exists. | Unified review timeline for Map, Urban, and IDE references. |

## Premium GIS Design, Motion, And 3D UX

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | GIS token bridge | Synapse IDE, Urban Analytics, and Map Explorer tokens exist separately. | Add `--gis-*` alias layer for surfaces, text, borders, accents, status, density, focus, and motion. |
| P0 | Professional workbench shell | Map cockpit and IDE shell patterns exist. | Build VS Code-style GIS shell with activity rail, top command bar, left dock, center canvas, right inspector, bottom panel, and status bar. |
| P0 | Shared GIS primitives | Buttons/chips/tabs/sections are spread across panels. | Add shared icon button, status chip, tabs, toolbar, section header, property grid, empty state, progress, and tooltip primitives. |
| P0 | Urban evidence visual harmonization | Urban Analytics status language exists. | Reuse ready/caveat/demo/unknown/stale/blocked/running states in layer rows, inspectors, bridge panels, reports, and exports. |
| P1 | Professional catalog/contents styling | Layer manager and cockpit are present. | Add dense catalog, contents tree, source health, layer group, active layer accent, filter/scale/editability indicators, and warning patterns. |
| P1 | Attribute/toolbox/layout styling | Table/toolbox/layout composer are target capabilities. | Apply professional compact table, processing toolbox, model builder, and layout composer UI language. |
| P1 | Motion system | Existing panels use subtle transitions. | Add reduced-motion-safe fade, panel, accent, status, feature focus, progress, and layer preview patterns. |
| P1 | 3D block interaction UI | 3D/digital twin plan exists. | Add compact 3D mode strip, building/block inspectors, zoning panels, massing scenario controls, comparison strip, and sun/shadow timeline. |
| P1 | Visual regression gate | Playwright exists. | Add screenshot and canvas checks for shell, catalog, contents, inspector, table, toolbox, Urban bridge, layout composer, and 3D states. |

## Performance, Reliability, Security

| Priority | Capability | Current Signal | Target Work |
| --- | --- | --- | --- |
| P0 | Performance budgets | ADR notes browser limits. | Define feature count, layer count, memory, worker transfer, export budgets. |
| P0 | Error recovery | Map canvas handles external errors. | Expand to worker failures, source restore failures, malformed data, and export failures. |
| P0 | Credential isolation | External services need keys/proxies. | Never store secrets in layer metadata; use explicit connector settings. |
| P1 | Telemetry/diagnostics | Error bus exists. | Add map diagnostics panel and structured error events. |
| P1 | Accessibility | Shell has focus management. | Complete keyboard, screen reader, reduced motion, high contrast checks. |
| P2 | Stress automation | Some targeted tests exist. | Add large-data, many-layer, temporal, and export stress suites. |
