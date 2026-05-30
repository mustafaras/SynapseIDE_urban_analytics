# Map Explorer Scientific Release Checklist

Date: May 30, 2026
Status: Prompt 63 documentation close-out checked; Prompt 64 RC gate controls release readiness

Use this checklist before claiming Map Explorer is ready for a scientific release.

## Correctness

- [x] Map state persists viewport, layers, selection, temporal status, panel widths, and project save/load state.
- [x] Layer registry shows source type, feature count, visibility, queryability, CRS, QA, and provenance.
- [x] GeoJSON, CSV, KML, GPX, Arrow, and GeoParquet import paths are covered.
- [x] Shapefile and GeoPackage commit paths are documented and tested with CRS caveats.
- [x] FlatGeobuf, PMTiles, GeoTIFF, CityJSON, and 3D Tiles have documented profile/streaming/scene-specific support limits.
- [x] GeoJSON and GeoParquet export paths are covered.
- [x] Offline package export preserves bounded source sidecars, styles, manifests, evidence references, and unavailable states for large/external sources.
- [x] Drawing and measurement tools remain reachable from toolbar and context menu.
- [x] Undo/redo covers reversible layer/style/AOI/workflow edits and excludes non-reversible side effects.
- [x] Spatial statistics, thematic, temporal, and GeoAI/simulation map adapters publish structured layer metadata.
- [x] Plugin-contributed source/render/tool/Urban bridge extensions register through typed metadata without bypassing QA gates.
- [x] VoxCity bridge prioritizes real project geometry and labels demo/sample modes.
- [x] Terrain, CityJSON, 3D Tiles metadata, view corridors, and section/cut-plane outputs carry CRS/vertical-datum assumptions.
- [x] Publication export exposes page, format, DPI, scale, north arrow, legend, graticule, title, and attribution controls.

## Scientific Truthfulness

- [x] CRS labels are visible in status, metadata, QA, and report handoff.
- [x] Missing CRS/projection metadata is labeled as a caveat rather than hidden.
- [x] Geometry validity and skipped-row diagnostics are visible during import.
- [x] Scale bar remains visible and exportable.
- [x] Thematic classification method and class count are visible.
- [x] Temporal playback layers expose frame count and metadata-dependent controls.
- [x] Provenance travels through layers, workflow outputs, VoxCity handoffs, review timeline, and report handoff.
- [x] Demo/sample modes are explicit.
- [x] NL query execution is scoped to visible queryable layers; non-queryable layers are not silently substituted.
- [x] AI-proposed map actions are allowlisted, redacted, human-confirmed, and audited before apply.
- [x] Collaboration sync labels connected/local-only/offline state and does not sync raw geometry.
- [x] Raster noData, sampled statistics, and missing CRS states are visible in QA and evidence surfaces.
- [x] Unavailable metadata is surfaced as unavailable.

## UX and Accessibility

- [x] Desktop integrated workspace shows map center, left layer/data panel, right QA/report panel, and bottom status/timeline.
- [x] Modal focus mode provides full-screen map shell, rails, command palette, and close behavior.
- [x] Split analysis and comparison modes are reachable.
- [x] Mobile/constrained widths keep the map first and move panels to bottom drawers.
- [x] Minimum usable map viewport height is preserved for 2D, temporal, comparison, and analytical surfaces.
- [x] Toolbar commands wrap/collapse into reachable overflow groups and command palette entries.
- [x] Side panels are resizable and remember width preferences.
- [x] Scroll is confined to panels/dialog bodies; map canvas is not squeezed by action bars.
- [x] Empty and disabled states name missing prerequisites.
- [x] Context menus render above floating panels.
- [x] Reduced-motion gates cover GIS motion classes and temporal playback.
- [x] Raster, temporal, and 3D evidence states expose text-bearing status chips.

## Performance

- [x] Large/columnar import paths show schema preview, memory estimate, progress, and worker transfer status.
- [x] Temporal playback is covered by Playwright.
- [x] CA/simulation map outputs are covered by smoke workflows and map adapter tests.
- [x] Detection/GeoAI map publication paths are covered by GeoAI bridge and smoke validation.
- [x] Heatmap/proportional/graduated point renderers are covered by Playwright.
- [x] Worker-backed queries and columnar transfers are covered by unit and Playwright tests.
- [x] Observability and panel-error recovery surfaces are covered by diagnostics tests.
- [ ] Browser memory ceilings are not removed; very large datasets remain bounded by user hardware.

## Documentation

- [x] Map Explorer prompt ledger exists.
- [x] User-facing workflow guide exists.
- [x] Developer architecture doc for state/action handling exists.
- [x] Known limitations include Map Explorer residual risks.
- [x] Release validation doc records Prompt 36 results.
- [x] Prompt 63 documentation close-out records current shipped GIS behavior and links every close-out gate.
- [x] Prompt 64 report records the current RC decision and concrete blockers.

## Prompt 36 Validation Commands

| Command or suite | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npm run test` | Pass; 107 files, 1497 passed, 2 skipped |
| `npm run lint:errors` | Pass |
| `npm run test:e2e:smoke` | Pass; 13 tests |
| `e2e/map-modal-layout.spec.ts` | Pass; 5 tests |
| `e2e/map-csv-kml-gpx-import.spec.ts` | Pass; 3 tests |
| `e2e/map-context-and-geojson.spec.ts` | Pass; 2 tests |
| `e2e/map-columnar-io.spec.ts` | Pass; 2 tests |
| `e2e/map-image-export.spec.ts` | Pass; 1 test |
| `e2e/map-choropleth.spec.ts` | Pass; 1 test |
| `e2e/map-point-symbology.spec.ts` | Pass; 1 test |
| `e2e/map-spatial-stats-renderers.spec.ts` | Pass; 1 test |
| `e2e/map-temporal-player.spec.ts` | Pass; 1 test |
| `e2e/voxcity-real-data.spec.ts` | Pass; 1 test |
| `e2e/map-report-handoff.spec.ts` | Pass; 1 test |
| `e2e/map-explorer-stability.spec.ts` | Pass; 1 test, plus 3-repeat run covering 18 additional open/close cycles |
| `npm run test -- src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx` | Pass; 2 tests |

## Residual Release Risks

- External basemap/service success can depend on provider uptime, credentials, CORS, and rate limits.
- Very large GeoJSON, Arrow, GeoParquet, temporal, CA, detection, or heatmap workloads remain browser-memory bounded.
- Sources without projection metadata default to visible caveats and `EPSG:4326` labeling where the app cannot infer a better CRS.
- Some model-backed GeoAI paths remain environment-dependent when runtime model URLs or credentials are absent.
- `MapExplorerModal` and other analytical lazy chunks remain large; the Prompt 64 RC report is the current source of truth for bundle-budget status.
