# Map Explorer CRS and QA Method Note

Date: 2026-05-30
Status: Prompt 63 close-out reference

Map Explorer separates display coordinates from analytical execution coordinates. The map canvas can display web/geographic coordinates, but metric operations must pass an explicit CRS gate before they run.

## CRS Method

- `MapProjectionService` wraps projection lookup, dynamic local UTM selection, and projected/geographic checks.
- `ExecutionCrsPlanner` chooses display CRS and execution CRS for workflows. It does not fabricate a metric CRS when source metadata is missing.
- `CrsPreflight` blocks planar metric work when CRS metadata is missing, geographic-only, mixed, or incompatible with a method's `requiredCrs`.
- User-declared CRS can unblock workflows, but it remains caveated as `user-declared`; Urban data fitness downgrades that state instead of treating it as verified source metadata.
- Raster, terrain, CityJSON, 3D Tiles, view-corridor, and section outputs carry CRS or vertical-datum assumptions as evidence metadata.

## QA Surfaces

| Surface | What is checked | Where the result appears |
| --- | --- | --- |
| Source preflight | Format support, feature/row count, skipped rows, CRS presence, memory estimate, worker readiness, license/attribution | Import preview, layer metadata, source support matrix |
| Layer scientific QA | CRS status, geometry validity, schema, temporal metadata, provenance, queryability, render budget | Layer manager, layer inspector, QA panel, report handoff |
| Command preflight | CRS safety, missing inputs, QA blockers, execution backend, undo/revert eligibility | Workflow drawer, processing toolbox, command palette, review timeline |
| Raster QA | GeoTIFF CRS, noData, bbox, band count, sampled-vs-full statistics | Raster layer panel, raster legend, evidence visual state |
| 3D QA | source mode, runtime mode, vertical datum, terrain/city-model provenance, generated-vs-real state | Scene 3D panel, view-corridor/section evidence, report metadata |
| Publication QA | visible layers, CRS, scale, legend, attribution, evidence ids, reproducibility manifests | Figure composer, export output, report handoff, offline package |

## Method Limits

- EPSG:4326 is acceptable for display and geodesic measurement disclosure, not for planar area/distance workflows.
- Vector tiles, sampled rasters, generalized geometries, and metadata-only sources can render or support review, but precision-sensitive metrics must use full-resolution source geometry or carry a caveat.
- External services are environment-dependent; the QA state reports provider, CORS, credential, rate-limit, offline, and attribution issues instead of creating blank or implied-good layers.
- Evidence artifacts are immutable after creation. Stale or invalid states must be marked through QA/review state rather than silently edited or deleted.

## Validation References

- `src/services/map/crs/CrsPreflight.ts`
- `src/services/map/crs/ExecutionCrsPlanner.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/raster/RasterQAService.ts`
- `src/services/map/scene3d/ViewCorridorSectionService.ts`
- `src/centerpanel/components/map/__tests__/crs-declaration.test.ts`
- `src/services/map/__tests__/CrsPreflight.test.ts`
- `src/services/map/__tests__/RasterHistogramEngine.test.ts`
- `e2e/map-view-corridor-section-p61.spec.ts`
