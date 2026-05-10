# Map Explorer Prompt Implementation Ledger

Date: May 2, 2026
Maintained by: Prompt 36 release-hardening pass

This ledger is the current-state source of truth for `MAP_EXPLORER_ENHANCEMENT_PLAN.md` prompts `01-36`.

Status vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`

## Release Validation Snapshot

Prompt 36 local validation completed on May 2, 2026:

| Gate | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run build` | Pass; `MapExplorerModal` remains a lazy chunk at about 1.81 MB raw |
| `npm run test` | Pass; 107 files, 1497 passed, 2 skipped |
| `npm run lint:errors` | Pass |
| `npm run test:e2e:smoke` | Pass; 13 tests |
| Modal layout | Pass; `e2e/map-modal-layout.spec.ts` |
| Layer workflows and import/export | Pass; CSV/KML/GPX, GeoJSON, Arrow, GeoParquet, image export suites |
| VoxCity bridge | Pass; `e2e/voxcity-real-data.spec.ts` |
| Report handoff | Pass; `e2e/map-report-handoff.spec.ts` |
| Analytical map renderers | Pass; choropleth, point symbology, LISA/Gi*, temporal player suites |
| Repeated stability | Pass; `e2e/map-explorer-stability.spec.ts` plus `--repeat-each=3` run |

## Prompt 01-12

| Prompt | Title | Status | Current truth | Evidence |
|---|---|---|---|---|
| 01 | Product Charter and Design Foundation | implemented | Map Explorer is treated as a scientific workspace with explicit status, provenance, QA, and report handoff surfaces. | `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/mapTokens.ts` |
| 02 | Store Architecture and State Persistence | implemented | Map viewport, layers, selections, panels, temporal state, and project persistence are centralized in the map store and persisted where appropriate. | `src/stores/useMapExplorerStore.ts`; `e2e/map-modal-layout.spec.ts` |
| 03 | Accessibility, Keyboard Navigation and Focus Management | implemented | Skip link, dialog semantics, keyboard context menu behavior, command palette, focus-visible controls, and disabled-state labels are in place. | `src/centerpanel/components/MapExplorerModal.tsx`; `e2e/accessibility-audit.spec.ts`; `e2e/map-context-and-geojson.spec.ts` |
| 04 | Layer Management System | implemented | Layer stack supports visibility, opacity, metadata, QA badges, delete, search, and empty states naming the missing prerequisite. | `src/centerpanel/components/map/MapLayerManager.tsx`; `e2e/map-modal-layout.spec.ts` |
| 05 | Drawing and Sketching Tools | implemented | Point, line, polygon, rectangle, circle, and annotation workflows are available with panel summaries and map-context launch. | `src/centerpanel/components/MapExplorerModal.tsx`; `e2e/map-context-and-geojson.spec.ts` |
| 06 | Geodesic Measurement Tools | implemented | Distance/area measurement tools, units, results panel, and context-menu launch are implemented. | `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`; `e2e/map-context-and-geojson.spec.ts` |
| 07 | Context Menu and Reverse Geocoding | implemented | Context menu supports coordinate copy, reverse geocoding, pin, measure, draw, and analysis actions. Prompt 36 raised the menu above floating panels to prevent pointer interception. | `src/centerpanel/components/MapContextMenu.tsx`; `e2e/map-context-and-geojson.spec.ts` |
| 08 | GeoJSON Import and Export | implemented | GeoJSON import/export roundtrip is visible and tested, including visible-layer export settings. | `src/services/map/MapDataImporter.ts`; `src/services/map/MapDataExporter.ts`; `e2e/map-context-and-geojson.spec.ts` |
| 09 | CSV Point Layer and KML/GPX Import | implemented | CSV coordinate mapping, skipped-row diagnostics, KML placemarks, and GPX waypoints/routes/tracks are implemented. | `e2e/map-csv-kml-gpx-import.spec.ts` |
| 10 | Spatial Database Persistence and Project Integration | implemented with residual gap | Imported queryable layers can be persisted and used by worker-backed/SpatialDB paths; arbitrary remote catalogs must first be imported or published. | `src/engine/spatial-db/SpatialDB.ts`; `e2e/map-columnar-io.spec.ts`; `docs/release/known-risks-and-limitations.md` |
| 11 | Screenshot and Map Image Export | implemented | Publication export dialog supports PDF/PNG/SVG composition controls, DPI, title block, scale bar, north arrow, legend, attribution, and preview. | `src/centerpanel/components/MapExportDialog.tsx`; `e2e/map-image-export.spec.ts` |
| 12 | Choropleth and Thematic Map Renderer | implemented | Polygon thematic configuration, classification, color ramp, legend, and no-data handling are implemented. | `src/centerpanel/components/MapChoroplethPanel.tsx`; `e2e/map-choropleth.spec.ts` |

## Prompt 13-24

| Prompt | Title | Status | Current truth | Evidence |
|---|---|---|---|---|
| 13 | Heatmap, Proportional Symbols and Graduated Symbols | implemented | Point symbology exposes heatmap, proportional, graduated symbols, classification, ramps, and legends. | `src/centerpanel/components/MapPointSymbologyPanel.tsx`; `e2e/map-point-symbology.spec.ts` |
| 14 | LISA Cluster and Hot Spot Visualization | implemented | Local Moran's I and Getis-Ord Gi* renderers show academic legends, p-value filters, and result-layer selectors. | `src/centerpanel/components/MapClusterViz.tsx`; `src/centerpanel/components/MapHotSpotViz.tsx`; `e2e/map-spatial-stats-renderers.spec.ts` |
| 15 | Temporal Animation and Time-Series Playback | implemented | Temporal layers expose a 50-frame timeline with scrub, play/pause, step, and speed controls. | `src/centerpanel/components/MapTemporalPlayer.tsx`; `e2e/map-temporal-player.spec.ts` |
| 16 | Spatial Statistics to Map Bridge | implemented | Spatial-statistics results can publish map layers with renderer metadata and review/run provenance. | `src/services/map/MapEngineAdapter.ts`; `e2e/map-spatial-stats-renderers.spec.ts` |
| 17 | GeoAI and Simulation to Map Bridge | implemented | GeoAI/simulation outputs can add map layers with metadata, caveats, and analysis provenance. | `src/services/map/MapEngineAdapter.ts`; `e2e/map-geoai-bridge.spec.ts`; smoke workflows |
| 18 | Map to Engine Dispatch | implemented | Visible layer context can launch workflow recommendations and action proposals with QA caveats. | `src/services/map/MapWorkflowService.ts`; `src/centerpanel/components/map/MapWorkflowDrawer.tsx` |
| 19 | VoxCity 2D to 3D Viewport Synchronization | implemented with demo mode | VoxCity workflows prioritize real project geometry and keep sample paths visibly labeled. | `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts`; `e2e/voxcity-real-data.spec.ts` |
| 20 | Building Footprint and CityJSON 2D Overlay | implemented with demo mode | Building footprint overlays support sample, real OSM/CityJSON-derived, and shared registry sources with provenance labels. | `src/centerpanel/components/MapVoxCityOverlay.tsx`; `src/centerpanel/components/MapServiceDialog.tsx` |
| 21 | Solar Shadow Overlay on 2D Map | implemented with demo mode | Sunlight workflow can hand off real building geometry to map outputs while retaining explicit sample quick-start mode. | `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`; `e2e/voxcity-real-data.spec.ts` |
| 22 | External Map Service Support | environment-dependent | WMS/WFS/XYZ/OSM service controls are visible; success depends on provider availability, CORS, and credentials where required. | `src/centerpanel/components/MapServiceDialog.tsx`; `docs/release/known-risks-and-limitations.md` |
| 23 | Bookmarks, Annotations and Saved Views | implemented | Saved views, annotations, pins, and project map-state persistence are wired into the workspace. | `src/centerpanel/components/MapExplorerModal.tsx`; smoke coverage |
| 24 | Print Composition and Publication PDF Export | implemented | Publication composition supports page size, DPI, title, legend, scale, north arrow, graticule, attribution, and PDF/PNG/SVG format selection. | `src/centerpanel/components/MapCompositionLayout.tsx`; `src/centerpanel/components/MapExportDialog.tsx` |

## Prompt 25-36

| Prompt | Title | Status | Current truth | Evidence |
|---|---|---|---|---|
| 25 | Map State Snapshot Protocol | implemented | Map state snapshots include viewport, layers, QA, review/report context, and project save/load behavior. | `src/stores/useMapExplorerStore.ts`; `src/services/map/MapReportHandoffService.ts` |
| 26 | Map Command Palette and Reversible Actions | implemented | Command palette exposes import, tools, exports, report handoff, and action entries; workflow actions are previewable and auditable. | `src/centerpanel/components/map/MapToolbar.tsx`; `e2e/map-report-handoff.spec.ts` |
| 27 | Layer Metadata Inspection | implemented | Layer metadata, CRS, feature count, queryable status, source type, and QA warnings are visible in the layer panel. | `src/centerpanel/components/map/MapLayerManager.tsx` |
| 28 | Scientific QA Assistant | implemented | QA panel names CRS, geometry, scale, temporal, lineage, and symbology issues; disabled/empty states state prerequisites. | `src/centerpanel/components/map/ScientificQAPanel.tsx`; `src/services/map/MapScientificQA.ts` |
| 29 | Natural-Language Map Query Builder | implemented with residual gap | NL query builder scopes execution to queryable visible layers and does not silently substitute demo/non-queryable data. | `src/centerpanel/components/map/MapNLQueryPanel.tsx`; `src/services/map/MapNLQueryBuilder.ts` |
| 30 | Cartography and Symbology Review | implemented | Cartography recommendations surface legend, color, classification, opacity, and thematic caveats. | `src/centerpanel/components/map/MapLayerManager.tsx`; `src/services/map/MapCartographyReview.ts` |
| 31 | AOI, Selection, Buffer and Comparison Workflows | implemented | AOI workflow drawer supports buffer/intersect/union/difference/compare proposals and comparison mode rendering. | `src/centerpanel/components/map/MapWorkflowDrawer.tsx`; `e2e/map-modal-layout.spec.ts` |
| 32 | Contextual Analysis Recommendation Engine | implemented | Recommendations respond to visible layers, geometry, QA state, and workflow readiness. | `src/services/map/MapWorkflowService.ts`; `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` |
| 33 | Map Narrative and Citation Handoff | implemented | Report handoff creates a map finding with CRS, layers, QA caveats, snapshot metadata, and insert action. | `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`; `e2e/map-report-handoff.spec.ts` |
| 34 | Collaborative Review Mode | implemented | Review timeline records map events, filters, and reproducible session export metadata. | `src/centerpanel/components/map/MapReviewTimelinePanel.tsx` |
| 35 | Premium Map Modal Layout | implemented | Desktop rails, modal focus shell, split analysis, comparison, bottom timeline, responsive drawer, min map height, resizable panels, and toolbar overflow behavior are implemented. | `src/centerpanel/components/map/MapWorkspaceShell.tsx`; `e2e/map-modal-layout.spec.ts` |
| 36 | Final Release Hardening | implemented with residual gap | Required local gates and targeted suites pass. Residual risks are explicitly documented for external services, browser memory ceilings, large lazy chunk size, CRS defaults, and demo/sample modes. | `docs/release/map-explorer-scientific-release-checklist.md`; `docs/release/known-risks-and-limitations.md` |

## Maintenance Rule

Any future Map Explorer prompt or bug fix that changes behavior must update this ledger, the user guide, the architecture doc, release validation notes, and known limitations when the verification claim changes.
