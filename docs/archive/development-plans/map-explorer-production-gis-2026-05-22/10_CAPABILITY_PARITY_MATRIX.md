# 10 - Capability Parity Matrix

Date: 2026-05-22
Purpose: translate "ArcGIS/QGIS-grade" into explicit product capabilities and repo work areas.

## Parity Legend

- Target: what a professional GIS user expects.
- Current repo signal: evidence that some foundation already exists.
- Gap: what still needs to be designed/implemented.
- Target modules: likely code ownership.

## A. Project, Catalog, And Source Management

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Project catalog | Browse project layers, sources, services, outputs, scenarios. | Map store and layer manager exist. | Dedicated catalog/source browser missing. | `services/map/sources`, `centerpanel/components/map/CatalogPanel`. |
| Source connections | Manage local, remote, DB/worker, and service sources. | Importers/exporters, external connectors exist. | Unified connection registry missing. | `MapConnectionRegistry`. |
| Restore policy | Reopen project and know which layers are restored/unavailable. | Persistence service exists. | Source handles and restore states need standardization. | `MapSourcePersistence`. |
| Format support matrix | User sees supported/partial/environment-dependent formats. | Many dependencies exist. | Documentation and UI matrix needed. | docs + catalog UI. |

## B. Layer Tree And Inspector

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Contents tree | Group, reorder, toggle, scale-range, filter, duplicate, remove. | `MapLayerManager.tsx`. | More professional grouping/source repair/action history. | Layer manager + action lifecycle. |
| Layer inspector | Overview/source/schema/CRS/style/QA/lineage/report tabs. | Metadata types and QA panel exist. | Unified inspector needed. | `MapLayerInspector`. |
| Symbology | Categorical, graduated, choropleth, labels, no-data, opacity. | Symbology utils and renderers exist. | Style editor/legend parity needed. | Style editor + legend service. |
| Metadata QA | CRS, license, geometry, provenance, runtime mode visible. | `mapLayerMetadata.ts`, `MapScientificQA.ts`. | Command gating and inspector integration. | QA service + UI. |

## C. Attribute And Field Workbench

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Attribute table | Virtualized rows, sort/filter/select/focus. | Selected feature IDs and schema summaries exist. | Full table missing. | `MapAttributeTable`. |
| Field statistics | Numeric/categorical/temporal stats. | Field summaries exist. | Stats profiler and UI needed. | `MapFieldProfiler`. |
| Field calculator | Safe expressions, derived output. | Calculators exist in Urban domain. | Map-side safe field ops missing. | `MapFieldCalculatorService`. |
| Joins/relates | Preview key match, join attributes, caveats. | Source/schema metadata exists. | Join workflow missing. | Processing toolbox. |

## D. Editing, Drawing, And Topology

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Drawing | Create point/line/polygon/rectangle/circle. | Store drawing state exists. | Production edit UX needs expansion. | Drawing/editing panel. |
| Vertex editing | Move/add/delete vertices, reshape. | Not obvious as production feature. | Implement editor. | `MapGeometryEditor`. |
| Snapping | Vertex/edge/grid snapping by layer. | Not obvious. | Add snapping service/UI. | `MapSnappingService`. |
| Topology QA | Self-intersections, overlaps, gaps, duplicate vertices. | QA engine checks geometry/topology. | Editing-time feedback and repair. | QA + editor. |
| AOI management | Validated, named, locked, source-tracked AOIs. | Active AOI exists. | AOI workbench and reproducible AOI refs. | AOI slice + Urban bridge. |

## E. Processing Toolbox

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Tool registry | Searchable processing/geoprocessing tools. | Map workflow and analysis services exist. | Central toolbox registry missing. | `MapProcessingRegistry`. |
| Parameter forms | Tool-specific layer/field/number/date inputs. | Workflow drawer exists. | Generalized form model needed. | Processing UI. |
| Preview/apply | Preview output before commit. | Workflow preview exists. | Universal command lifecycle needed. | Action lifecycle. |
| Run history | Parameters, outputs, logs, rerun. | Review session and manifests exist. | Tool history UI needed. | Review + processing history. |
| Batch/model | Chain tools and rerun. | Workflow service exists for selected tools. | Model builder missing. | `MapModelBuilder`. |

## F. Spatial Analysis And Urban Analytics

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Spatial stats | Moran, LISA, Gi*, OLS/GWR, clustering mapped and evidenced. | `MapEngineAdapter`, spatial stats engines. | Unified processing/Urban method UX. | Analysis command factory. |
| Network/accessibility | Routing, catchments, accessibility. | Network engine exists. | Map toolbox integration and evidence. | Network processing tools. |
| GeoAI/raster | EO/GeoAI outputs with QA and uncertainty. | GeoAI lab and adapters exist. | Raster workbench maturity. | GeoAI/Map source registry. |
| Data fitness | Urban data fitness from map summaries. | `dataFitness.ts`, map context adapter. | Canonical bridge and method rail. | `MapUrbanBridgeService`. |
| Method compatibility | Urban method can request map validation/execution. | `UrbanToMapMethodRequestAdapter.ts`. | Product UI in Map right rail. | Method compatibility panel. |

## G. Layout, Reporting, And Publication

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Layout composer | Map frame, legend, scale, north arrow, attribution, dynamic text. | Report handoff/export services exist. | Full composer needed. | `MapLayoutComposer`. |
| Reproducible figure | Figure knows layers, styles, viewport, CRS, QA, source. | Handoff metadata exists. | Hard preflight and export parity. | Report/export services. |
| Report binding | Map finding becomes Urban report block. | `MapReportHandoffService`, Urban report builders. | More complete figure restore/edit path. | Map report + Urban context. |
| Review timeline | Audit session and export logs. | Review timeline exists. | Expand action coverage. | `MapReviewSessionService`. |

## H. 3D, Blocks, And Digital Twin

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| 2.5D buildings | Extrude footprints by height/floors. | VoxCity/building services exist. | Map-side 3D inspector and source contracts. | 3D scene slice + building workbench. |
| 3D scene | Synchronized 2D/3D scene. | React Three/VoxCity components. | Unified scene runtime. | `Map3DSceneController`. |
| Blocks/parcels | First-class urban design units. | Urban types and map polygons. | Block/parcel data model. | `UrbanBlockModelService`. |
| Zoning envelopes | Generate buildable envelopes from rules. | No complete product path. | Zoning rule engine and envelope generator. | `ZoningEnvelopeService`. |
| Massing scenarios | Generate/compare urban massing alternatives. | Simulation/scenario foundations exist. | Massing generator and scenario manager. | `MassingScenarioService`. |
| Sun/shadow | Simulate and compare sunlight/shadow. | Sunlight simulator exists. | Map/3D production integration. | VoxCity + 3D processing. |
| CityJSON/3D Tiles | Load, inspect, sync, publish. | CityJSON loader exists. | Source registry integration and scene inspector. | 3D source registry. |

## I. Administration, Extensions, And Reliability

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Plugin/tool registry | New tools/renderers/connectors can be added cleanly. | Service modules exist. | Formal extension registry needed. | `MapExtensionRegistry`. |
| Diagnostics | Worker/WASM/GPU/source/service health visible. | Error bus and worker pool exist. | Diagnostics panel needed. | `MapDiagnosticsPanel`. |
| External services | CORS/credential/rate/provider health. | External service connector exists. | Provider management UI. | Service registry. |
| Performance budgets | Large data/render/export budgets. | ADR acknowledges limits. | Measured budgets and stress tests. | Performance docs/tests. |
| Accessibility | Keyboard/screen reader/reduced motion. | Shell focus support exists. | Full release audit. | Playwright a11y. |

## J. Premium Workbench Design And Motion

| Capability | Target | Current Repo Signal | Gap | Target Modules |
| --- | --- | --- | --- | --- |
| Professional shell | VS Code-style GIS workbench with rail, docks, canvas, bottom panel, and status bar. | Synapse IDE shell and Map cockpit styles exist. | Map Explorer needs unified professional shell. | `centerpanel/components/map/workbench`. |
| Design tokens | GIS aliases mapped to Synapse IDE and Urban Analytics tokens. | IDE, Urban, CenterPanel, and Map tokens exist. | GIS token bridge missing. | `centerpanel/components/map/design`. |
| Shared primitives | One visual system for buttons, chips, tabs, property grids, tables, toolbars, progress, and empty states. | Similar patterns exist in multiple places. | Duplicated visual treatments need consolidation. | `centerpanel/components/map/ui`. |
| Evidence styling | Ready/caveat/demo/unknown/stale/blocked/running states visible everywhere. | Urban Analytics evidence states exist. | Map rows/inspectors/reports need harmonized state language. | UI primitives + Urban bridge panel. |
| Motion system | Subtle reduced-motion-safe feedback for rows, panels, tabs, progress, layer previews, handoffs, and 3D camera. | Existing transitions exist in IDE/Urban styles. | Central GIS motion contract missing. | `gisMotion.css` + component CSS Modules. |
| 3D controls | Compact scene mode strip, building/block inspectors, scenario compare, and sun/shadow timeline. | VoxCity/3D foundations exist. | Professional 3D interaction UI missing. | `centerpanel/components/map/scene3d`. |
| Visual QA | Screenshot and canvas checks for shell, panels, bridge, layout, and 3D. | Playwright exists. | Design-specific regression suite missing. | `e2e/map-explorer-design.spec.ts`. |

## Minimum ArcGIS/QGIS-Grade Release Slice

The smallest release that deserves "professional GIS workbench" language should include:

1. Catalog/source registry.
2. Contents tree and layer inspector.
3. Attribute table and selection sync.
4. CRS preflight and projection execution contract.
5. Processing toolbox with at least 15 vector/analysis tools.
6. Editing/AOI/topology basics.
7. Layout composer with reproducible figure metadata.
8. Urban Analytics bridge v1 and method compatibility panel.
9. 2.5D building extrusion and 3D block scenario foundation.
10. Premium VS Code-style workbench design and reduced-motion-safe interaction layer.
11. Release gates for performance, QA, accessibility, visual design, and evidence truthfulness.

## Full Professional Target

The full target adds:

- Model builder.
- Batch processing.
- Advanced labels and cartography.
- Raster workbench.
- Network analysis workbench.
- Zoning/massing/sun-shadow 3D digital twin.
- External provider administration.
- Plugin/extension registry.
- Reproducible GIS package export.
