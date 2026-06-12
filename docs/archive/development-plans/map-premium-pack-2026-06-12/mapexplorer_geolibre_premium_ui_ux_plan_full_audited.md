# Map Explorer Modal — GeoLibre-Inspired Premium UI/UX Redesign Plan

**Repository source audited:** uploaded `src.zip`  
**Audit date:** 2026-06-11  
**Plan language:** English  
**Primary implementation target:** `src/centerpanel/components/map` and directly connected Map Explorer store/service files  
**Reference product:** GeoLibre by OpenGEOs — a lightweight cloud-native GIS workspace built with Tauri v2, React, TypeScript, MapLibre GL JS, DuckDB-WASM Spatial and deck.gl.

---

## 0. Non-negotiable objective

Transform the current Map Explorer modal into a **GeoLibre-like, map-first, premium GIS workspace** with radical, visible UI/UX changes while preserving every existing function, data contract, route, service, testable behavior, CRS workflow, QA workflow, evidence workflow, diagnostics workflow, import/export workflow, publishing workflow, 3D workflow, temporal workflow, layer workflow, drawing workflow, measurement workflow, and analytical workflow.

This is **not** a feature rewrite. It is a shell, layout, interaction hierarchy, command-surface, panel, and visual-system redesign.

The result should feel like a professional desktop GIS product:

```text
Project / Add Data / Layers / Style / Analyze / Scene / Publish / Controls / Plugins / View / Help
──────────────────────────────────────────────────────────────────────────────
│ Layer/Data rail │ Contents/Catalog/Layers │            Map Canvas           │ Inspector/Style/QA │
│                 │                         │  MapLibre-first work surface   │ Workflow/Publish   │
──────────────────────────────────────────────────────────────────────────────
│ compact status bar · CRS · scale · cursor · QA · diagnostics · tasks        │
│ expandable bottom output drawer: attributes / timeline / logs / problems    │
──────────────────────────────────────────────────────────────────────────────
```

---

## 1. Evidence that the uploaded source was audited

This plan is based on a file-level inspection of the uploaded `src.zip` rather than a generic UI suggestion.

### 1.1 Source inventory numbers

| Area | Count |
| --- | ---: |
| Total files under uploaded `src/` | 1438 |
| Files under `src/centerpanel/components/map` | 270 |
| Lines under `src/centerpanel/components/map` | 100536 |
| Files under `src/services/map` | 146 |
| Lines under `src/services/map` | 64892 |
| Files under `src/stores/mapExplorer` | 15 |
| Files under legacy/shared `src/components/map` | 43 |
| Map-related tests found across `src/` | 158 |

### 1.2 Map Explorer directory summary

| Map Explorer directory | Files | TSX | TS | CSS | Lines |
| --- | --- | --- | --- | --- | --- |
| (root) | 61 | 30 | 27 | 4 | 37120 |
| __tests__ | 77 | 45 | 32 | 0 | 19645 |
| __tests__/__snapshots__ | 1 | 0 | 0 | 0 | 66 |
| __tests__/fixtures | 1 | 0 | 1 | 0 | 217 |
| analyze | 2 | 1 | 1 | 0 | 561 |
| bottom | 3 | 2 | 1 | 0 | 519 |
| catalog | 4 | 1 | 2 | 1 | 1807 |
| contents | 4 | 1 | 2 | 1 | 1396 |
| controllers | 39 | 18 | 21 | 0 | 14243 |
| controllers/__tests__ | 7 | 7 | 0 | 0 | 564 |
| design | 3 | 1 | 1 | 1 | 273 |
| inspector | 3 | 2 | 1 | 0 | 987 |
| inspector/style | 3 | 2 | 1 | 0 | 1515 |
| layout | 2 | 2 | 0 | 0 | 1193 |
| modelBuilder | 3 | 1 | 1 | 1 | 1153 |
| navigation | 3 | 0 | 3 | 0 | 2538 |
| plugins | 2 | 1 | 1 | 0 | 297 |
| problems | 3 | 1 | 2 | 0 | 814 |
| processing | 3 | 2 | 1 | 0 | 1184 |
| publish | 4 | 3 | 1 | 0 | 1188 |
| raster | 3 | 3 | 0 | 0 | 1057 |
| review | 1 | 1 | 0 | 0 | 339 |
| review/__tests__ | 1 | 1 | 0 | 0 | 82 |
| scene | 2 | 1 | 1 | 0 | 189 |
| scene3d | 4 | 4 | 0 | 0 | 2649 |
| sidebar | 2 | 1 | 1 | 0 | 345 |
| streaming | 1 | 1 | 0 | 0 | 96 |
| style | 2 | 1 | 1 | 0 | 1441 |
| table | 4 | 2 | 2 | 0 | 2621 |
| temporal | 3 | 2 | 1 | 0 | 607 |
| ui | 16 | 13 | 2 | 1 | 2105 |
| ui/__tests__ | 1 | 1 | 0 | 0 | 190 |
| zoning | 2 | 2 | 0 | 0 | 1535 |

### 1.3 Largest Map Explorer files by line count

| Lines | File |
| --- | --- |
| 5210 | src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx |
| 3908 | src/centerpanel/components/map/MapLayerManager.tsx |
| 3435 | src/centerpanel/components/map/MapToolbar.tsx |
| 2158 | src/centerpanel/components/map/__tests__/map-layer-management.test.ts |
| 2046 | src/centerpanel/components/map/MapWorkflowDrawer.tsx |
| 1780 | src/centerpanel/components/map/controllers/useMapDataOutputController.ts |
| 1713 | src/centerpanel/components/map/mapEvidenceArtifacts.ts |
| 1641 | src/centerpanel/components/map/navigation/mapSurfaceInventory.ts |
| 1424 | src/centerpanel/components/map/style/MapStyleWorkspace.tsx |
| 1369 | src/centerpanel/components/map/scene3d/Scene3DPanel.tsx |
| 1362 | src/centerpanel/components/map/MapReviewTimelinePanel.tsx |
| 1309 | src/centerpanel/components/map/controllers/buildMapRuntimeRenderModel.tsx |
| 1292 | src/centerpanel/components/map/mapTokens.ts |
| 1249 | src/centerpanel/components/map/mapTypes.ts |
| 1243 | src/centerpanel/components/map/MapWorkspaceCockpit.module.css |
| 1121 | src/centerpanel/components/map/__tests__/map-components.test.ts |
| 1108 | src/centerpanel/components/map/MapStatusBar.tsx |
| 1031 | src/centerpanel/components/map/MapSelectionTools.tsx |
| 965 | src/centerpanel/components/map/MapNLQueryPanel.tsx |
| 924 | src/centerpanel/components/map/table/MapAttributeTable.tsx |
| 876 | src/centerpanel/components/map/ScientificQAPanel.tsx |
| 873 | src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx |
| 864 | src/centerpanel/components/map/navigation/mapNavigationModel.ts |
| 835 | src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx |
| 797 | src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx |
| 796 | src/centerpanel/components/map/MapWorkspaceCockpit.tsx |
| 790 | src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx |
| 786 | src/centerpanel/components/map/demoDataPacks.ts |
| 779 | src/centerpanel/components/map/__tests__/map-accessibility.test.ts |
| 776 | src/centerpanel/components/map/useLayerSync.ts |
| 757 | src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx |
| 748 | src/centerpanel/components/map/raster/RasterLayerPanel.tsx |
| 738 | src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx |
| 727 | src/centerpanel/components/map/inspector/style/legendContract.ts |
| 725 | src/centerpanel/components/map/table/MapAttributeWorkflowPanel.tsx |
| 721 | src/centerpanel/components/map/MapReportHandoffDrawer.tsx |
| 716 | src/centerpanel/components/map/MapWorkspaceShell.tsx |
| 707 | src/centerpanel/components/map/inspector/LayerInspector.tsx |
| 695 | src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx |
| 687 | src/centerpanel/components/map/catalog/MapCatalogPanel.tsx |
| 684 | src/centerpanel/components/map/catalog/MapCatalogPanel.module.css |
| 684 | src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx |
| 664 | src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx |
| 661 | src/centerpanel/components/map/table/fieldCalculator.ts |
| 639 | src/centerpanel/components/map/MapCanvasControls.tsx |
| 630 | src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts |
| 615 | src/centerpanel/components/map/MapCanvas.tsx |
| 602 | src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts |
| 595 | src/centerpanel/components/map/mapLayerMetadata.ts |
| 578 | src/centerpanel/components/map/publish/MapPublishWorkspace.tsx |
| 569 | src/centerpanel/components/map/contents/MapContentsTreePanel.module.css |
| 569 | src/centerpanel/components/map/contents/MapContentsTreePanel.tsx |
| 568 | src/centerpanel/components/map/MapTopCommandSurface.tsx |
| 552 | src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx |
| 546 | src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx |
| 545 | src/centerpanel/components/map/scene3d/SunShadowPanel.tsx |
| 526 | src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts |
| 524 | src/centerpanel/components/map/MapStartDialog.module.css |
| 521 | src/centerpanel/components/map/controllers/useMapProjectPersistenceController.ts |
| 504 | src/centerpanel/components/map/mapExperience.ts |
| 503 | src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx |
| 502 | src/centerpanel/components/map/problems/mapProblemsModel.ts |
| 482 | src/centerpanel/components/map/spatialStatsVizUtils.ts |
| 467 | src/centerpanel/components/map/scene3d/ScenarioComparisonStrip.tsx |
| 464 | src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css |
| 438 | src/centerpanel/components/map/mapLeftPanelContracts.ts |
| 438 | src/centerpanel/components/map/MapStartDialog.tsx |
| 436 | src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx |
| 433 | src/centerpanel/components/map/controllers/mapExplorerPublishHelpers.ts |
| 427 | src/centerpanel/components/map/MapWorkspaceOverviewSummary.module.css |
| 415 | src/centerpanel/components/map/catalog/catalogModel.ts |
| 408 | src/centerpanel/components/map/MapWorkspaceOverviewSummary.tsx |
| 406 | src/centerpanel/components/map/mapContextSummary.ts |
| 403 | src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx |
| 401 | src/centerpanel/components/map/useMapPanelCommands.ts |
| 395 | src/centerpanel/components/map/__tests__/MapStyleWorkspace.test.tsx |
| 383 | src/centerpanel/components/map/ui/AppDropdownMenu.tsx |
| 379 | src/centerpanel/components/map/CartographyRecommendationList.tsx |
| 379 | src/centerpanel/components/map/__tests__/mapContextSummary.test.ts |
| 373 | src/centerpanel/components/map/DeclareCrsControl.tsx |

### 1.4 Map services summary

| Service directory | Files | Lines |
| --- | --- | --- |
| (root) | 34 | 31763 |
| __tests__ | 60 | 15351 |
| actions | 2 | 752 |
| bridge | 1 | 1377 |
| cartography | 1 | 422 |
| collaboration | 1 | 852 |
| commands | 1 | 320 |
| contracts | 1 | 490 |
| crs | 4 | 611 |
| geometry | 4 | 1399 |
| join | 1 | 622 |
| labels | 1 | 230 |
| layout | 1 | 535 |
| model | 2 | 766 |
| observability | 2 | 237 |
| plugins | 3 | 432 |
| processing | 6 | 1706 |
| query | 1 | 718 |
| raster | 3 | 651 |
| scene3d | 5 | 1853 |
| sources | 2 | 1136 |
| streaming | 2 | 446 |
| temporal | 3 | 438 |
| tiling | 1 | 514 |
| topology | 1 | 365 |
| zoning | 3 | 906 |

---

## 2. GeoLibre reference model distilled into redesign requirements

The requested reference is `https://github.com/opengeos/GeoLibre`. The relevant product pattern is not superficial styling; it is the workspace architecture:

1. **Map-first layout.** GeoLibre is organized around a dominant MapLibre canvas with optional panels around it.
2. **Top menu bar rather than giant always-visible toolbar.** GeoLibre groups actions into Project, Add Data, Processing, Controls, Plugins, and Help-style command menus.
3. **Left layer panel.** Visibility, opacity, reorder, zoom-to-layer, identify, labels, remove, refresh and attribute-table actions are colocated with the layer list.
4. **Right style panel / inspector.** Styling is separated from the map and layer list, allowing the map to stay visually dominant.
5. **Bottom attribute table/status model.** Heavy tabular or output data is not allowed to steal default map area unless opened.
6. **Responsive panel visibility.** Toolbars, panels, status bar, attribute panel and layout settings can be hidden or shown.
7. **Drag-and-drop data ingestion.** Dropping vector/raster files onto the map is a primary interaction, not a hidden flow.
8. **Controls menu.** Navigation, fullscreen, geolocation, globe, terrain, scale, attribution, logo, search, legend, measure, bookmark and minimap live as toggleable controls rather than scattered chrome.
9. **Plugin-oriented command surface.** Plugin features are grouped under a controlled plugin menu with lifecycle awareness.
10. **Professional GIS simplicity.** Complex capabilities exist, but the first impression is clean: map, layers, style, attributes, processing, diagnostics.

### 2.1 Translation to this Map Explorer app

The current Map Explorer already has more advanced scientific, AI, urban analytics, review and publishing capabilities than GeoLibre. Therefore the redesign must **borrow GeoLibre's simple shell logic** without deleting this app's advanced features.

The correct translation is:

| GeoLibre pattern | Map Explorer equivalent |
| --- | --- |
| `DesktopShell` | `MapWorkspaceShell`, `MapExplorerModalRuntimeCore`, `MapExplorerModalRuntimeView` |
| `TopToolbar` menu groups | `MapTopCommandSurface`, `MapToolbar`, `useMapPanelCommands`, `useMapCommandHandlers` |
| `LayerPanel` | `MapExplorerLayerPanelRail`, `MapLayerManager`, `MapContentsTreePanel`, `MapCatalogPanel` |
| `StylePanel` | `MapInspectorHost`, `LayerInspector`, `LayerStyleEditor`, `MapStyleWorkspace` |
| `AttributeTable` | `MapAttributeTable`, `MapBottomPanel`, `MapBottomPanelBodies` |
| `StatusBar` | `MapStatusBar`, `MapStatusBarWithCursor` |
| Controls menu | `MapCanvasControls`, `MapToolbar`, `MapTopCommandSurface` |
| Plugin menu | `MapPluginPanel`, service plugin registry, extension registry |
| Processing menu | `MapProcessingToolboxPanel`, `MapAnalyzeWorkspace`, model builder, workflow drawer |
| Diagnostics panel | `MapPerformanceDiagnosticsPanel`, `ScientificQAPanel`, problems model, QA services |

---

## 3. Current Map Explorer diagnosis

### 3.1 Strengths to preserve

The uploaded source shows a sophisticated GIS/urban analytics workspace. The redesign must preserve:

- MapLibre rendering through `MapCanvas.tsx` and associated layer sync logic.
- Layer management, sources, cartography, contents tree and catalog flows.
- CRS declaration, CRS validation and CRS evidence.
- Scientific QA badges, QA panels and map problems routing.
- Drawing, measurement, annotation, pins and bookmarks.
- Choropleth, clustering, hot spot, emerging hot spot, raster, temporal and 3D visualization.
- Workflow execution, model builder, processing toolbox and natural-language query tooling.
- Publish workspace, report handoff, evidence artifacts and review timeline.
- Performance diagnostics, visual QA and accessibility coverage.
- Store persistence through `useMapExplorerStore.ts` and `src/stores/mapExplorer/*`.
- Service contracts under `src/services/map/*`.
- Existing test coverage, especially the canonical baseline and route migration tests.

### 3.2 Main UI/UX problems

The problem is not lack of features. The problem is **feature density without a clean information architecture**.

Observed issues from the source structure:

1. `MapExplorerModalRuntimeCore.tsx` is 5,210 lines and still imports/coordinates many visible surfaces directly. This makes the modal hard to reason about visually.
2. `MapToolbar.tsx` is 3,435 lines and acts as an overloaded command surface. It should become a menu-driven command hub, not a dense visual toolbar.
3. `MapLayerManager.tsx` is 3,908 lines and likely contains multiple responsibilities that should be visually redistributed into Layers, Contents, Sources and Cartography sections.
4. `MapStatusBar.tsx` is 1,108 lines and likely does too much for a status bar. It should become a compact status strip plus an expandable output drawer.
5. `MapCanvasControls.tsx` is 639 lines and should become a clean, predictable map-control dock aligned to a safe inset system.
6. Right dock routing exists and is valuable, but the presentation should be simplified into a premium inspector with persistent tabs and clear state.
7. There are many visible advanced panels. They should remain available, but hidden behind deliberate route/menu/tab systems unless contextually needed.
8. CSS is fragmented between token files, module CSS, inline style objects and primitive modules. The redesign needs a coherent shell CSS module while preserving token aliases.
9. Multiple map-related component trees exist: `src/centerpanel/components/map`, shared `src/centerpanel/components/Map*.tsx`, legacy/shared `src/components/map`, and services. The plan must prevent accidental edits in the wrong tree.

### 3.3 Required product direction

The redesigned modal should present itself as:

- **Less like an internal debug cockpit.**
- **More like a polished desktop GIS workspace.**
- **Map-first, with panels visible only when useful.**
- **Clear top menu groups.**
- **Layer list and catalog on the left.**
- **Inspector/style/QA/workflow on the right.**
- **Status and outputs at the bottom.**
- **Advanced functions retained but grouped.**

---

## 4. Target file map

These are the files that should be treated as the actual implementation map. The plan intentionally separates **primary UI files**, **state/service files that should mostly be protected**, and **tests that must be extended or preserved**.

### Runtime shell and modal orchestration

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/controllers/MapExplorerModalRoot.tsx | yes | 12 | primary refactor target |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntime.tsx | yes | 4 | primary refactor target |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx | yes | 5210 | primary refactor target |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx | yes | 790 | primary refactor target |
| src/centerpanel/components/map/controllers/buildMapRuntimeRenderModel.tsx | yes | 1309 | primary refactor target |
| src/centerpanel/components/map/MapWorkspaceShell.tsx | yes | 716 | primary refactor target |
| src/centerpanel/components/map/mapExperience.ts | yes | 504 | primary refactor target |
| src/centerpanel/components/map/mapLayoutTokens.ts | yes | 34 | primary refactor target |
| src/centerpanel/components/map/mapTokens.ts | yes | 1292 | primary refactor target |

### Top command, toolbar, and menu model

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/MapTopCommandSurface.tsx | yes | 568 | primary refactor target |
| src/centerpanel/components/map/MapToolbar.tsx | yes | 3435 | primary refactor target |
| src/centerpanel/components/map/useMapPanelCommands.ts | yes | 401 | primary refactor target |
| src/centerpanel/components/map/controllers/useMapCommandHandlers.ts | yes | 58 | primary refactor target |
| src/stores/useMapToolbarPreferencesStore.ts | yes | 49 | primary refactor target |

### Left GIS navigation, layers, contents, catalog

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/controllers/MapActivityRailPresenter.tsx | yes | 25 | primary refactor target |
| src/centerpanel/components/map/controllers/useMapActivityRailItems.tsx | yes | 71 | primary refactor target |
| src/centerpanel/components/map/controllers/useMapActivityRailSelection.ts | yes | 120 | primary refactor target |
| src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx | yes | 235 | primary refactor target |
| src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx | yes | 340 | primary refactor target |
| src/centerpanel/components/map/contents/MapContentsTreePanel.tsx | yes | 569 | primary refactor target |
| src/centerpanel/components/map/contents/MapContentsTreePanel.module.css | yes | 569 | primary refactor target |
| src/centerpanel/components/map/contents/contentsModel.ts | yes | 238 | primary refactor target |
| src/centerpanel/components/map/catalog/MapCatalogPanel.tsx | yes | 687 | primary refactor target |
| src/centerpanel/components/map/catalog/MapCatalogPanel.module.css | yes | 684 | primary refactor target |
| src/centerpanel/components/map/catalog/catalogModel.ts | yes | 415 | primary refactor target |
| src/centerpanel/components/map/MapLayerManager.tsx | yes | 3908 | primary refactor target |
| src/centerpanel/components/map/MapLayerPanel.tsx | yes | 168 | primary refactor target |

### Right inspector, style, QA, workflow, publish dock

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/MapRightDockHost.tsx | yes | 282 | primary refactor target |
| src/centerpanel/components/map/MapRightDockHost.module.css | yes | 355 | primary refactor target |
| src/centerpanel/components/map/MapPanelErrorBoundary.tsx | yes | 162 | primary refactor target |
| src/centerpanel/components/map/mapDocking.ts | yes | 164 | primary refactor target |
| src/centerpanel/components/map/mapRightDockRoutes.ts | yes | 305 | primary refactor target |
| src/centerpanel/components/map/controllers/useMapRightDockRouting.ts | yes | 177 | primary refactor target |
| src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx | yes | 503 | primary refactor target |
| src/centerpanel/components/map/inspector/MapInspectorHost.tsx | yes | 270 | primary refactor target |
| src/centerpanel/components/map/inspector/LayerInspector.tsx | yes | 707 | primary refactor target |
| src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx | yes | 664 | primary refactor target |
| src/centerpanel/components/map/style/MapStyleWorkspace.tsx | yes | 1424 | primary refactor target |
| src/centerpanel/components/map/ScientificQAPanel.tsx | yes | 876 | primary refactor target |
| src/centerpanel/components/map/MapWorkflowDrawer.tsx | yes | 2046 | primary refactor target |
| src/centerpanel/components/map/publish/MapPublishWorkspace.tsx | yes | 578 | primary refactor target |

### Canvas, overlay, selection, drawing, measurement

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/MapCanvas.tsx | yes | 615 | primary refactor target |
| src/centerpanel/components/map/MapCanvasControls.tsx | yes | 639 | primary refactor target |
| src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx | yes | 277 | primary refactor target |
| src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx | yes | 134 | primary refactor target |
| src/centerpanel/components/map/MapSearchBar.tsx | yes | 232 | primary refactor target |
| src/centerpanel/components/map/MapSelectionTools.tsx | yes | 1031 | primary refactor target |
| src/centerpanel/components/MapDrawingManager.tsx | yes | 1209 | primary refactor target |
| src/centerpanel/components/MapMeasurementTool.tsx | yes | 1135 | primary refactor target |
| src/centerpanel/components/MapContextMenu.tsx | yes | 700 | primary refactor target |
| src/centerpanel/components/MapAnnotationLayer.tsx | yes | 696 | primary refactor target |
| src/centerpanel/components/MapTemporalPlayer.tsx | yes | 1034 | primary refactor target |
| src/centerpanel/components/MapVoxCityOverlay.tsx | yes | 2197 | primary refactor target |

### Bottom status, timeline, attributes, problems, output

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/MapStatusBar.tsx | yes | 1108 | primary refactor target |
| src/centerpanel/components/map/bottom/MapBottomPanel.tsx | yes | 257 | primary refactor target |
| src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx | yes | 247 | primary refactor target |
| src/centerpanel/components/map/table/MapAttributeTable.tsx | yes | 924 | primary refactor target |
| src/centerpanel/components/map/table/MapAttributeWorkflowPanel.tsx | yes | 725 | primary refactor target |
| src/centerpanel/components/map/problems/MapProblemsPanel.tsx | yes | 298 | primary refactor target |
| src/centerpanel/components/map/problems/mapProblemsModel.ts | yes | 502 | primary refactor target |
| src/centerpanel/components/map/MapReviewTimelinePanel.tsx | yes | 1362 | primary refactor target |
| src/centerpanel/components/map/review/MapReviewSidebar.tsx | yes | 339 | primary refactor target |
| src/centerpanel/components/map/MapReportHandoffDrawer.tsx | yes | 721 | primary refactor target |

### Analyze, processing, model builder, plugins

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx | yes | 552 | primary refactor target |
| src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx | yes | 873 | primary refactor target |
| src/centerpanel/components/map/processing/ToolParameterForm.tsx | yes | 301 | primary refactor target |
| src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx | yes | 684 | primary refactor target |
| src/centerpanel/components/map/plugins/MapPluginPanel.tsx | yes | 295 | primary refactor target |
| src/services/map/MapProcessingRegistry.ts | new/proposed | - | new shell helper only if needed |
| src/services/map/MapWorkflowService.ts | yes | 2796 | primary refactor target |
| src/services/map/MapAnalysisDispatcher.ts | yes | 660 | primary refactor target |
| src/services/map/MapAnalysisRecommender.ts | yes | 1245 | primary refactor target |
| src/services/map/model/MapModelBuilder.ts | yes | 740 | primary refactor target |

### 3D, temporal, raster, zoning, layout designer

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/centerpanel/components/map/scene3d/Scene3DPanel.tsx | yes | 1369 | primary refactor target |
| src/centerpanel/components/map/scene3d/SunShadowPanel.tsx | yes | 545 | primary refactor target |
| src/centerpanel/components/map/scene3d/Scene3DInteractionStrip.tsx | yes | 268 | primary refactor target |
| src/centerpanel/components/map/scene3d/ScenarioComparisonStrip.tsx | yes | 467 | primary refactor target |
| src/centerpanel/components/map/temporal/TemporalScenePanel.tsx | yes | 305 | primary refactor target |
| src/centerpanel/components/map/temporal/TemporalPlayerPanel.tsx | yes | 295 | primary refactor target |
| src/centerpanel/components/map/raster/RasterLayerPanel.tsx | yes | 748 | primary refactor target |
| src/centerpanel/components/map/raster/RasterLegend.tsx | yes | 163 | primary refactor target |
| src/centerpanel/components/map/raster/RasterHistogramChart.tsx | yes | 146 | primary refactor target |
| src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx | yes | 738 | primary refactor target |
| src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx | yes | 797 | primary refactor target |
| src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx | yes | 757 | primary refactor target |
| src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx | yes | 436 | primary refactor target |

### State, persistence, service contracts

| File | Exists | Lines | Role in redesign |
| --- | --- | --- | --- |
| src/stores/useMapExplorerStore.ts | yes | 1797 | primary refactor target |
| src/stores/mapExplorer/persistence.ts | yes | 46 | primary refactor target |
| src/stores/mapExplorer/selectors.ts | yes | 153 | primary refactor target |
| src/stores/mapExplorer/slicePolicy.ts | yes | 67 | primary refactor target |
| src/stores/mapExplorer/slices/layout.ts | yes | 50 | primary refactor target |
| src/stores/mapExplorer/slices/layers.ts | yes | 27 | primary refactor target |
| src/stores/mapExplorer/slices/qa.ts | yes | 18 | primary refactor target |
| src/stores/mapExplorer/slices/review.ts | yes | 18 | primary refactor target |
| src/stores/mapExplorer/slices/temporal.ts | yes | 44 | primary refactor target |
| src/services/map/MapPersistenceService.ts | yes | 1771 | primary refactor target |
| src/services/map/MapDataImporter.ts | yes | 3284 | primary refactor target |
| src/services/map/MapExportService.ts | yes | 2662 | primary refactor target |
| src/services/map/MapEngineAdapter.ts | yes | 3233 | primary refactor target |
| src/services/map/MapScientificQA.ts | yes | 1988 | primary refactor target |

---

## 5. New files to add

The redesign should add a small set of shell files rather than bloating existing runtime files further.

| New file | Purpose |
| --- | --- |
| `src/centerpanel/components/map/shell/MapPremiumShell.module.css` | Central premium shell CSS: modal frame, menu bar, panel grid, safe insets, canvas control dock, responsive behavior. |
| `src/centerpanel/components/map/shell/MapPremiumMenuBar.tsx` | GeoLibre-like top menu bar wrapper that consumes existing command handlers. |
| `src/centerpanel/components/map/shell/mapMenuModel.tsx` | Declarative menu group model: Project, Add Data, Layers, Style, Analyze, Scene, Publish, Controls, Plugins, View, Help. |
| `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx` | Reusable premium panel frame for left/right/bottom panels with title, subtitle, actions, tabs and close/collapse affordances. |
| `src/centerpanel/components/map/shell/MapBottomOutputDrawer.tsx` | Controlled bottom drawer for attributes, timeline, problems, logs, tasks and review. |
| `src/centerpanel/components/map/shell/MapCanvasControlDock.tsx` | Thin control-dock shell around existing map controls, search, legend, scale and orientation controls. |
| `src/centerpanel/components/map/shell/mapShellResponsive.ts` | Width breakpoints, panel visibility rules and safe-inset calculation helpers. |
| `src/centerpanel/components/map/shell/index.ts` | Barrel export for shell components. |

Do **not** add dependencies. Use React, CSS modules, existing tokens, existing icons and existing primitives.

---

## 6. New shell architecture

### 6.1 Desired DOM composition

```tsx
<MapWorkspaceShell className="premium shell root">
  <MapPremiumMenuBar />

  <div className="premium-workspace-grid">
    <MapActivityRail />

    <MapDockPanelFrame slot="left" activeTab="layers|contents|catalog|bookmarks">
      <MapExplorerLayerPanelRail />
      <MapContentsTreePanel />
      <MapCatalogPanel />
      <MapLayerManager compactMode />
    </MapDockPanelFrame>

    <MapCanvasRegion>
      <MapCanvas />
      <MapCanvasControlDock>
        <MapSearchBar />
        <MapCanvasControls compact />
        <MapLegendOverlay />
      </MapCanvasControlDock>
      <MapCanvasOverlayChrome />
      <WorkflowPreviewOverlay />
    </MapCanvasRegion>

    <MapRightDockHost presentation="premium-inspector" />
  </div>

  <MapStatusBar compact />
  <MapBottomOutputDrawer />
</MapWorkspaceShell>
```

### 6.2 Layout contract

The shell should be CSS-grid driven:

```css
.mapPremiumShell {
  display: grid;
  grid-template-rows: var(--map-menu-h) minmax(0, 1fr) var(--map-status-h);
  background: var(--map-shell-bg);
}

.mapPremiumWorkspace {
  display: grid;
  grid-template-columns:
    var(--map-activity-rail-w)
    minmax(var(--map-left-min), var(--map-left-w))
    minmax(0, 1fr)
    minmax(var(--map-right-min), var(--map-right-w));
  min-height: 0;
}
```

### 6.3 Panel visibility rules

| Width | Left panel | Right panel | Bottom output | Top menu labels |
| --- | --- | --- | --- | --- |
| `>= 1440px` | visible | visible when route active | collapsed by default | full labels |
| `1200–1439px` | visible | overlay drawer when route active | collapsed | compact labels |
| `900–1199px` | collapsible | overlay drawer | drawer only | icons + selected label |
| `< 900px` | modal drawer | modal drawer | hidden unless requested | compact menu button |

### 6.4 Safe inset model

All floating map furniture must consume a shared safe-inset model:

```ts
export interface MapShellSafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
  activityRail: number;
  leftPanel: number;
  rightPanel: number;
  statusBar: number;
  bottomDrawer: number;
}
```

This prevents search, zoom controls, bookmarks, north arrow, measurement readouts, legend, workflow preview, context menus and status overlays from fighting for the same map pixels.

---

## 7. Menu model

The current `MapToolbar.tsx` must not remain the dominant first-impression UI. It should become a command-provider and optional legacy/debug surface. The visible premium command surface should be menu-driven.

### 7.1 Top menu groups

| Menu | Must include existing capabilities |
| --- | --- |
| Project | New workspace, open/save/import/export project, persistence status, reset layout, start dialog. |
| Add Data | Local files, demo packs, catalog insertions, services, raster, vector, overlays, temporal, scene sources. |
| Layers | New layer, visibility, lock, opacity, reorder, select, identify, CRS, metadata, schema, source health. |
| Style | Renderer, symbols, labels, legend, cartography advisor, recommendations. |
| Analyze | Data operations, statistics, spatial statistics, processing toolbox, model builder, NL query. |
| Scene | 3D, terrain, sun/shadow, zoning, massing, temporal scene, raster scene. |
| Publish | Layout designer, figure composer, export, offline package, report handoff, publication marks. |
| Review | Review timeline, comments, evidence, QA issues, collaboration, approvals. |
| Controls | Search, bookmarks, pins, selection, drawing, measurement, keyboard controls, map furniture. |
| Plugins | Plugin panel, extension registry, external integrations. |
| View | Left panel, right inspector, bottom drawer, map-only mode, density, panel widths, responsive reset. |
| Help | Diagnostics, performance, accessibility, command palette, keyboard shortcuts. |

### 7.2 Command surface behavior

- The first visual row should be calm, with at most 11 menu buttons.
- Command palette remains available but no longer substitutes for discoverable menus.
- Frequently used commands can appear as 4–6 contextual quick actions to the right of the menu bar.
- Destructive actions must remain behind menus or confirmations.
- Every menu item must call existing handlers from `useMapCommandHandlers.ts`, `useMapPanelCommands.ts`, right-dock routing, store actions or existing component props.
- No new business logic in the menu components.

---

## 8. Left panel redesign

### 8.1 Desired left panel tabs

```text
Layers | Contents | Catalog | Sources | Bookmarks
```

### 8.2 Files to coordinate

- `MapExplorerLayerPanelRail.tsx`
- `MapLayerManager.tsx`
- `MapLayerPanel.tsx`
- `MapContentsTreePanel.tsx`
- `contentsModel.ts`
- `MapCatalogPanel.tsx`
- `catalogModel.ts`
- `MapWorkbenchSidebar.tsx`
- `MapActivityRailPresenter.tsx`
- `useMapActivityRailItems.tsx`
- `useMapActivityRailSelection.ts`
- `mapLeftPanelContracts.ts`

### 8.3 Required visible changes

1. Replace dense cockpit-like left UI with a clean GIS panel frame.
2. Use a compact header: title, active workspace, layer count, CRS warning count.
3. Show active layer rows with clear icon, name, type, visibility, opacity mini-control and overflow menu.
4. Move advanced actions into row overflow menus.
5. Use consistent row heights: 32–38 px for dense mode, 40–44 px for comfortable mode.
6. Keep contents tree and catalog visually separate from layer list.
7. Provide empty states that are useful: “Drop files on the map or use Add Data”.
8. Preserve drag-and-drop ordering and layer management semantics.
9. Preserve all QA, metadata, source and evidence markers, but simplify their visible treatment.
10. Add responsive collapse behavior: icon-only activity rail plus drawer panel.

### 8.4 No-regression requirements

- Layer visibility must still call the existing visibility update path.
- Reordering must still preserve render order and contents model logic.
- CRS warnings must still route to CRS/QA panels.
- Catalog insertions must still call existing demo/catalog insertion helpers.
- Attribute table opening must still target the selected/active layer.
- Existing `map-left-panel-contracts.test.ts` and layer-management tests must remain meaningful.

---

## 9. Right inspector redesign

### 9.1 Desired right dock model

```text
Inspector | Style | QA | Workflow | Publish | Review | Diagnostics
```

### 9.2 Files to coordinate

- `MapRightDockHost.tsx`
- `MapRightDockHost.module.css`
- `MapRightDockBodyContent.tsx`
- `mapRightDockRoutes.ts`
- `mapDocking.ts`
- `useMapRightDockRouting.ts`
- `MapInspectorHost.tsx`
- `LayerInspector.tsx`
- `LayerStyleEditor.tsx`
- `MapStyleWorkspace.tsx`
- `ScientificQAPanel.tsx`
- `MapWorkflowDrawer.tsx`
- `MapPublishWorkspace.tsx`
- `MapReviewTimelinePanel.tsx`
- `MapPerformanceDiagnosticsPanel.tsx`

### 9.3 Required visible changes

1. Right dock becomes a premium inspector with one visual language.
2. Top header includes route title, status badge, close/collapse, pin, and more menu.
3. Route tabs appear as compact segmented controls or vertical rail depending on width.
4. Advanced/diagnostic panels are grouped but never removed.
5. QA/severity badges use consistent semantic tokens.
6. Publish and workflow panels use the same panel frame as Inspector and Style.
7. Diagnostics panel is visually differentiated but not visually alarming unless errors exist.
8. Panel body uses predictable padding and scroll strategy.
9. Panel width respects `mapDocking.ts` boundaries and layout preferences.
10. Right dock may become overlay drawer on medium/small screens.

### 9.4 No-regression requirements

- `mapRightDockRoutes.ts` route definitions remain the source of truth.
- Bottom-tab-to-right-dock migrations remain valid.
- Right dock close/switch/open announcements continue to work.
- Scientific QA, performance and diagnostics retain current route targets.
- Existing `MapRightDockHost.test.tsx`, `map-right-dock-migration.test.ts`, `mapRightDockRoutes.test.ts` must be updated only if visual structure changes require new selectors.

---

## 10. Canvas redesign

### 10.1 Goal

The map canvas must dominate the modal. The user should feel that they are using a GIS map, not a dashboard containing a map.

### 10.2 Files to coordinate

- `MapCanvas.tsx`
- `MapCanvasControls.tsx`
- `MapCanvasKeyboardFallbackControls.tsx`
- `MapCanvasOverlayChrome.tsx`
- `MapSearchBar.tsx`
- `MapBookmarkBar.tsx`
- `MapSelectionTools.tsx`
- `MapLegendOverlay.tsx`
- `MapDrawingManager.tsx`
- `MapMeasurementTool.tsx`
- `MapContextMenu.tsx`
- `MapAnnotationLayer.tsx`
- `MapTemporalPlayer.tsx`
- `WorkflowPreviewOverlay.tsx`
- `Scene3DInteractionStrip.tsx`
- `ScenarioComparisonStrip.tsx`

### 10.3 Required visible changes

1. Collapse scattered floating controls into a small number of control islands.
2. Primary map controls should appear in a single top-right or left-center dock.
3. Search becomes a focused map search capsule, not a large bar competing with the menu.
4. Legend becomes collapsible and pinned to a predictable corner.
5. Drawing/measurement panels become contextual tool trays.
6. Workflow preview overlays must not cover primary map controls.
7. Scene/3D strips must use the same safe-inset system.
8. Drag-and-drop overlay must be visually premium and explicit.
9. Empty map state should invite data loading via Add Data or drag/drop.
10. Keyboard fallback controls remain accessible but visually integrated.

---

## 11. Bottom status and output redesign

### 11.1 Current issue

`MapStatusBar.tsx` is large and feature-rich. It should not carry too much visual weight in the normal state.

### 11.2 Desired model

```text
Status bar:   CRS · scale · cursor · selection · QA · sync · render · diagnostics · tasks
Output drawer: Attributes | Timeline | Problems | Logs | Evidence | Review | Reports
```

### 11.3 Files to coordinate

- `MapStatusBar.tsx`
- `MapStatusBarWithCursor.tsx`
- `MapBottomPanel.tsx`
- `MapBottomPanelBodies.tsx`
- `MapAttributeTable.tsx`
- `MapAttributeWorkflowPanel.tsx`
- `MapReviewTimelinePanel.tsx`
- `MapReportHandoffDrawer.tsx`
- `MapProblemsPanel.tsx`
- `mapProblemsModel.ts`

### 11.4 Required visible changes

1. Status bar height fixed and compact.
2. It should use semantic chips rather than bulky cards.
3. Clicking a status chip should open the relevant right-dock route or bottom drawer tab.
4. Attribute table is hidden unless requested.
5. Timeline and review move to a drawer tab.
6. Problems panel is accessible from QA/diagnostics chip.
7. Long status text truncates with tooltip/title.
8. Drawer remembers last active tab but does not consume map space by default.

---

## 12. Token and visual system redesign

### 12.1 Current token base

The existing token structure is valuable and should remain the source of truth:

- `mapTokens.ts` already defines `MAP_COLORS`, chrome slot tokens, shell dimensions, z-index, spacing, radii and map styles.
- `mapLayoutTokens.ts` aliases command bar, status bar, left/right panel, bottom panel and safe overlay insets.
- `GisPrimitive.module.css` already handles focus-visible, motion, status-chip transitions and forced-colors support.

### 12.2 Premium visual target

Use a restrained, professional dark GIS shell:

```text
Background: near-black charcoal with slightly lighter panel surfaces
Borders: low-contrast hairlines, stronger only on active panel boundaries
Accent: one cool blue/teal interaction color, reserved for active states
Status: semantic colors only for QA, blocked, warning, valid, running
Radius: modest 6–10 px panels, 4–6 px controls
Shadow: minimal; use layering and borders rather than glow
Typography: compact professional sans + monospaced micro labels
Motion: short, reduced-motion compliant, no flashy transitions
```

### 12.3 Files to change

- `mapTokens.ts`: add premium shell aliases; do not delete existing tokens.
- `mapLayoutTokens.ts`: add menu bar height, drawer height, safe-inset tokens, responsive breakpoints.
- `GisPrimitive.module.css`: extend primitives only if reusable.
- `MapPremiumShell.module.css`: centralize new shell styling.
- `MapRightDockHost.module.css`, `MapCatalogPanel.module.css`, `MapContentsTreePanel.module.css`, `MapStartDialog.module.css`, `MapWorkspaceCockpit.module.css`: update only where component-local styles remain necessary.

---

## 13. Accessibility requirements

The existing source already has many ARIA references. The redesign must improve, not weaken, accessibility.

Required:

- Menu bar uses `role="menubar"` where appropriate, or accessible buttons with proper popup labels.
- Menus have keyboard navigation and escape handling through existing primitives where possible.
- Dock tabs use `aria-selected`, `aria-controls` and clear labels.
- Collapsible panels expose `aria-expanded`.
- Close buttons name the panel they close.
- Status chips are buttons only when actionable; otherwise static text.
- Map canvas keeps keyboard fallback controls.
- Focus order: menu → left rail → canvas → right inspector → status/output.
- All hover-only actions must also be keyboard reachable.
- Forced-colors and reduced-motion support from `GisPrimitive.module.css` must remain.

---

## 14. Responsive behavior

### 14.1 Desktop wide

- Menu labels visible.
- Left panel visible by default.
- Right inspector visible only when route active.
- Bottom drawer collapsed.
- Map has maximum surface.

### 14.2 Desktop medium

- Menu labels may shorten.
- Right inspector overlays map as drawer.
- Canvas controls shift using safe inset.
- Bottom drawer opens over the map rather than shrinking it.

### 14.3 Tablet / narrow

- Left panel becomes slide-over drawer.
- Right inspector becomes slide-over drawer.
- Top menu becomes compact command button plus critical quick actions.
- Status bar hides low-priority chips behind overflow.

### 14.4 Map-only mode

- Hide menu bar, left panel, right dock and bottom drawer.
- Preserve essential map controls, scale, attribution, search toggle and exit-map-only button.
- Must be reversible without losing UI state.

---

## 15. Implementation phases

Each phase must create visible UI/UX changes. Do not create invisible refactor-only PRs unless needed for safety.

### Phase 1 — Full shell foundation and premium tokens

**Goal:** Establish the new shell layout, tokens and CSS system without moving business logic.

**Primary files:**

- `mapTokens.ts`
- `mapLayoutTokens.ts`
- `MapWorkspaceShell.tsx`
- `MapPremiumShell.module.css` new
- `mapShellResponsive.ts` new
- `MapWorkspaceShell` tests and visual QA tests

**Required changes:**

1. Add premium shell CSS variables.
2. Add menu bar, workspace grid, panel and output drawer sizing tokens.
3. Add safe-inset helpers.
4. Wrap existing layout in a premium shell class.
5. Preserve existing slots.
6. Make the modal immediately look more like a desktop GIS shell.

**Visible acceptance:**

- Modal chrome becomes cleaner and more premium.
- Map area has stronger visual priority.
- Panel boundaries are clearer.
- No feature disappears.

**Validation:**

- `mapShellPrimitives.test.tsx`
- `mapWorkSurfaceVisualPass.test.tsx`
- `mapVisualQA.test.ts`
- `map-accessibility.test.ts`
- `map-explorer-canonical-baseline.test.tsx`

---

### Phase 2 — GeoLibre-like top menu bar

**Goal:** Replace dense always-visible toolbar impression with a clear menu bar.

**Primary files:**

- `MapTopCommandSurface.tsx`
- `MapToolbar.tsx`
- `useMapPanelCommands.ts`
- `useMapCommandHandlers.ts`
- `MapPremiumMenuBar.tsx` new
- `mapMenuModel.tsx` new

**Required changes:**

1. Add menu model with Project, Add Data, Layers, Style, Analyze, Scene, Publish, Review, Controls, Plugins, View, Help.
2. Reuse existing command handlers only.
3. Keep legacy toolbar command availability but hide visual density behind menus.
4. Add contextual quick actions for 4–6 current workflow commands.
5. Preserve command palette and existing tests.

**Visible acceptance:**

- Top row looks simple and premium.
- The user can discover GIS actions by category.
- Toolbar no longer dominates the map.

**Validation:**

- `MapToolbar.command-palette.test.tsx`
- `MapToolbar.external-services.test.tsx`
- `MapTopCommandSurface.test.tsx`
- `MapCommandPaletteSearch.test.ts`
- `useMapCommandHandlers.test.tsx`

---

### Phase 3 — Left panel as GeoLibre-style Layers/Data workspace

**Goal:** Redesign left side around Layers, Contents, Catalog, Sources and Bookmarks.

**Primary files:**

- `MapExplorerLayerPanelRail.tsx`
- `MapLayerManager.tsx`
- `MapContentsTreePanel.tsx`
- `MapCatalogPanel.tsx`
- `MapWorkbenchSidebar.tsx`
- `MapActivityRailPresenter.tsx`
- `MapDockPanelFrame.tsx` new

**Required changes:**

1. Add a unified left panel frame.
2. Move dense layer actions to row overflow.
3. Standardize panel row treatment.
4. Make layer visibility, opacity and identify highly discoverable.
5. Keep advanced cartography/sources available but subordinate.
6. Add clear empty and drag/drop states.

**Visible acceptance:**

- Left panel resembles a professional GIS layer panel.
- Layers are easier to scan.
- Catalog and contents are still present but no longer visually chaotic.

**Validation:**

- `map-layer-management.test.ts`
- `MapCatalogPanel.test.tsx`
- `MapContentsModel.test.ts`
- `MapWorkbenchSidebar.test.tsx`
- `map-left-panel-contracts.test.ts`
- `map-left-panel-responsive-fit.test.ts`

---

### Phase 4 — Right premium inspector dock

**Goal:** Convert right dock into a single premium inspector system.

**Primary files:**

- `MapRightDockHost.tsx`
- `MapRightDockHost.module.css`
- `MapRightDockBodyContent.tsx`
- `mapRightDockRoutes.ts`
- `useMapRightDockRouting.ts`
- `MapInspectorHost.tsx`
- `LayerInspector.tsx`
- `LayerStyleEditor.tsx`
- `MapStyleWorkspace.tsx`
- `ScientificQAPanel.tsx`

**Required changes:**

1. Add inspector header, route tabs, state chips and close/collapse actions.
2. Use a shared `MapDockPanelFrame` visual model.
3. Group contextual and diagnostic routes.
4. Preserve route definitions and announcements.
5. Improve scroll and focus handling.

**Visible acceptance:**

- Right dock feels like a cohesive Inspector/Style/QA system.
- Advanced panels remain accessible without overwhelming the map.

**Validation:**

- `MapRightDockHost.test.tsx`
- `mapRightDockRoutes.test.ts`
- `map-right-dock-migration.test.ts`
- `MapStyleWorkspace.test.tsx`
- `style-editor-legend-contract.test.ts`

---

### Phase 5 — Canvas furniture and safe-inset cleanup

**Goal:** Make the map canvas visually dominant and reduce floating-control clutter.

**Primary files:**

- `MapCanvas.tsx`
- `MapCanvasControls.tsx`
- `MapCanvasOverlayChrome.tsx`
- `MapSearchBar.tsx`
- `MapSelectionTools.tsx`
- `MapLegendOverlay.tsx`
- `MapCanvasControlDock.tsx` new

**Required changes:**

1. Introduce one coherent map control dock.
2. Apply safe-inset tokens to all overlay controls.
3. Make search, legend, measure and selection contextual.
4. Improve drag-and-drop overlay.
5. Preserve keyboard fallback controls.

**Visible acceptance:**

- Canvas looks cleaner immediately.
- Controls no longer overlap with panels/status/drawers.
- Drop state is premium and obvious.

**Validation:**

- `MapCanvas.lifecycle.test.tsx`
- `map-drawing-tools.test.tsx`
- `geodesic-measurement.test.ts`
- `map-bookmarks-annotations.test.tsx`
- `MapVoxCityOverlay.test.tsx`
- `TemporalScenePanel.test.tsx`

---

### Phase 6 — Bottom status bar and output drawer

**Goal:** Turn bottom UI into compact status + expandable output drawer.

**Primary files:**

- `MapStatusBar.tsx`
- `MapStatusBarWithCursor.tsx`
- `MapBottomPanel.tsx`
- `MapBottomPanelBodies.tsx`
- `MapAttributeTable.tsx`
- `MapReviewTimelinePanel.tsx`
- `MapProblemsPanel.tsx`
- `MapBottomOutputDrawer.tsx` new

**Required changes:**

1. Compact status bar.
2. Actionable chips route to drawer or right dock.
3. Bottom drawer hosts Attributes, Timeline, Problems, Logs, Evidence, Review, Reports.
4. Drawer overlays or resizes based on viewport.
5. Preserve selected feature, attribute workflow and timeline state.

**Visible acceptance:**

- Bottom area no longer feels heavy.
- Attribute table is accessible but not dominant by default.

**Validation:**

- `MapBottomPanel.test.tsx`
- `MapAttributeTable.test.tsx`
- `MapStatusBarRoutes.test.tsx`
- `MapReviewTimelinePanel.test.tsx`
- `mapProblemsPanel.test.tsx`

---

### Phase 7 — Start/import/export/publish visual polish

**Goal:** Make first-run, import/export and publish workflows match the premium shell.

**Primary files:**

- `MapStartDialog.tsx`
- `MapStartDialog.module.css`
- `MapImportPreviewDialog.tsx`
- `MapReportHandoffDrawer.tsx`
- `MapPublishWorkspace.tsx`
- `MapPublishOutputInventory.tsx`
- `MapPublicationMarksPanel.tsx`
- `MapLayoutDesignerPanel.tsx`
- `MapFigureComposerPanel.tsx`

**Required changes:**

1. Start dialog becomes a clean GIS launcher.
2. Import preview uses clear file-type cards and CRS warnings.
3. Publish uses stepper sections and readiness chips.
4. Export/offline/report handoff actions remain unchanged.

**Visible acceptance:**

- First impression is premium.
- Import/export/publish flows look part of the same app.

**Validation:**

- `MapStartDialog.test.tsx`
- `map-start-dialog-state.test.ts`
- `map-import-preflight.test.tsx`
- `MapPublishWorkspace.test.tsx`
- `MapPublishOutputInventory.test.tsx`
- `MapReportHandoffDrawer.test.tsx`
- `MapLayoutDesignerPanel.test.tsx`

---

### Phase 8 — Advanced panels visual normalization

**Goal:** Make advanced capabilities visually consistent without reducing their capability.

**Primary files:**

- `MapAnalyzeWorkspace.tsx`
- `MapProcessingToolboxPanel.tsx`
- `ToolParameterForm.tsx`
- `MapModelBuilderPanel.tsx`
- `MapPluginPanel.tsx`
- `MapWorkflowDrawer.tsx`
- `MapNLQueryPanel.tsx`
- `Scene3DPanel.tsx`
- `SunShadowPanel.tsx`
- `RasterLayerPanel.tsx`
- `ZoningRulesPanel.tsx`
- `MassingScenarioPanel.tsx`

**Required changes:**

1. Apply shared panel frame and section hierarchy.
2. Reduce decorative density.
3. Use consistent buttons, chips, tabs, forms and empty states.
4. Preserve all algorithm/model/plugin/service calls.
5. Preserve all state and route semantics.

**Visible acceptance:**

- Advanced tools still exist but feel integrated and professional.

**Validation:**

- `MapAnalyzeWorkspace.test.tsx`
- `MapProcessingToolbox.test.tsx`
- `MapProcessingToolboxDesign.test.tsx`
- `MapProcessingToolboxServiceTools.test.tsx`
- `MapModelBuilderPanel.test.tsx`
- `MapPluginPanel.test.tsx`
- `Scene3DPanel.test.tsx`
- `RasterLayerPanel.test.tsx`

---

### Phase 9 — Responsive, accessibility and visual QA pass

**Goal:** Confirm production readiness.

**Primary files:**

- All shell files
- `mapAccessibilityMatrix.ts`
- `mapExperience.ts`
- visual QA tests
- accessibility tests

**Required changes:**

1. Validate keyboard flow.
2. Validate reduced motion.
3. Validate forced colors.
4. Validate panel collapse/expand.
5. Validate map-only mode.
6. Validate no overlay collisions.
7. Validate no hidden critical function.

**Validation:**

- Full map test subset.
- Store tests.
- Service tests where affected by props/exports.

---

## 16. Preservation matrix

| Existing capability | Must remain controlled by | UI location after redesign |
| --- | --- | --- |
| Layer visibility/reorder/opacity | `MapLayerManager`, store layer actions, contents model | Left Layers panel |
| CRS declaration and warnings | `DeclareCrsControl`, CRS services, QA panels | Layer row badges + Inspector/QA |
| Scientific QA | `ScientificQAPanel`, `MapScientificQA`, problems model | Right QA route + status chip |
| Import preview | `MapImportPreviewDialog`, data services | Add Data menu + drag/drop overlay |
| Export/offline package | `MapExportService`, publish helpers | Publish menu + output drawer |
| Report handoff/evidence | `MapReportHandoffDrawer`, `mapEvidenceArtifacts` | Publish/Review route + output drawer |
| Drawing/annotations | `MapDrawingManager`, store layout slice | Controls menu + contextual canvas tray |
| Measurement | `MapMeasurementTool` | Controls menu + contextual canvas tray |
| Search | `MapSearchBar` | Canvas control dock + Controls menu |
| Bookmarks/pins | `MapBookmarkBar`, pins/bookmarks store | Left Bookmarks tab + canvas chip |
| Attribute table | `MapAttributeTable` | Bottom output drawer |
| Temporal player | `MapTemporalPlayer`, temporal store | Bottom drawer / canvas contextual strip |
| 3D scene | `Scene3DPanel`, scene stores/services | Scene menu + right route |
| Raster tools | raster panels/services | Add Data / Analyze / Scene routes |
| Model builder | `MapModelBuilderPanel`, model services | Analyze menu + right route |
| Plugins | extension registry, `MapPluginPanel` | Plugins menu + right route |
| Diagnostics/performance | `MapPerformanceDiagnosticsPanel`, observability | Help menu + right diagnostics + status chip |
| Workflow execution | `MapWorkflowDrawer`, workflow service | Analyze/Workflow route + bottom tasks |

---

## 17. Risk register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Hidden feature regression | Map Explorer has many advanced flows; hiding a panel may break discoverability. | Every old panel gets a menu route, dock route or drawer tab. Add command-presence tests. |
| Runtime file becomes even larger | `MapExplorerModalRuntimeCore.tsx` is already 5,210 lines. | Add shell files; move presentation only, not business logic, into small components. |
| Toolbar command loss | `MapToolbar.tsx` is huge and probably encodes command logic. | Convert to provider/model gradually; do not delete commands. |
| Overlay collisions | Map controls, right dock, bottom drawer and workflow overlay can overlap. | Central safe-inset helper and visual QA tests. |
| Route migration breakage | Bottom tabs migrated to right dock. | Preserve `mapRightDockRoutes.ts` and tests. |
| Accessibility regression | Menus and drawers can hurt focus order. | ARIA tests, keyboard pass, forced-colors pass. |
| CSS fragmentation | Existing inline styles and modules are mixed. | Add one shell module; keep component CSS scoped. |
| Service accidental modification | Services are large and test-covered. | Treat `src/services/map` as protected unless props/types require a change. |
| Responsive collapse hides workflows | Narrow view could make tools inaccessible. | Provide View menu and drawer routes for every panel. |
| Visual ambition exceeds safe change size | Request asks radical change, but source is complex. | Deliver in phases with visible changes each phase and reversible commits. |

---

## 18. Agent implementation prompts

Use these as focused English prompts for a GitHub/Codex agent. They are intentionally strict.

### Prompt 01 — Audit and lock the baseline

```text
You are working in the repository containing the uploaded src tree.

Task:
Create a Map Explorer UI baseline inventory before redesigning the modal.

Inspect these areas:
- src/centerpanel/components/map
- src/centerpanel/components/Map*.tsx used by Map Explorer
- src/components/map only for shared/legacy map utilities
- src/stores/useMapExplorerStore.ts
- src/stores/mapExplorer
- src/services/map

Hard constraints:
- Do not change behavior.
- Do not delete features.
- Do not edit services unless only adding non-behavioral comments is required.
- Produce a short implementation note in English.

Output:
- Files inspected
- Critical UI surfaces
- Test files covering those surfaces
- Risk areas before UI changes
```

### Prompt 02 — Add premium shell tokens and CSS module

```text
Task:
Add a premium GeoLibre-inspired shell token layer and CSS module for Map Explorer.

Target files:
- src/centerpanel/components/map/mapTokens.ts
- src/centerpanel/components/map/mapLayoutTokens.ts
- src/centerpanel/components/map/MapWorkspaceShell.tsx
- src/centerpanel/components/map/shell/MapPremiumShell.module.css (new)
- src/centerpanel/components/map/shell/mapShellResponsive.ts (new)
- src/centerpanel/components/map/shell/index.ts (new)

Design target:
A professional desktop GIS shell with a map-first workspace, clear panel boundaries, compact top menu row, compact status row and safe overlay insets.

Hard constraints:
- Preserve all exports used by existing tests.
- Do not remove current tokens.
- Do not introduce dependencies.
- Do not change map, CRS, QA, evidence, import/export, publish, analysis or service logic.

Visible acceptance:
The modal frame must visibly look cleaner, more premium and more map-first even before command/panel redesign.

Validation:
Run or update map shell, visual QA and accessibility tests if available.
```

### Prompt 03 — Introduce the GeoLibre-like top menu bar

```text
Task:
Introduce a GeoLibre-like top menu bar for Map Explorer.

Target files:
- src/centerpanel/components/map/MapTopCommandSurface.tsx
- src/centerpanel/components/map/MapToolbar.tsx
- src/centerpanel/components/map/useMapPanelCommands.ts
- src/centerpanel/components/map/controllers/useMapCommandHandlers.ts
- src/centerpanel/components/map/shell/MapPremiumMenuBar.tsx (new)
- src/centerpanel/components/map/shell/mapMenuModel.tsx (new)

Menu groups:
Project, Add Data, Layers, Style, Analyze, Scene, Publish, Review, Controls, Plugins, View, Help.

Hard constraints:
- Every menu action must call an existing handler/store action/route; no duplicate business logic.
- Keep command palette behavior.
- Preserve tests for toolbar commands and external services.
- The old toolbar can remain internally but should no longer dominate the visible UI.

Visible acceptance:
The first row must look like a calm professional GIS product rather than a dense internal toolbar.
```

### Prompt 04 — Redesign left Layers/Data panel

```text
Task:
Redesign the left Map Explorer panel into a GeoLibre-like Layers/Data workspace.

Target files:
- src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx
- src/centerpanel/components/map/MapLayerManager.tsx
- src/centerpanel/components/map/MapLayerPanel.tsx
- src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx
- src/centerpanel/components/map/contents/MapContentsTreePanel.tsx
- src/centerpanel/components/map/contents/MapContentsTreePanel.module.css
- src/centerpanel/components/map/catalog/MapCatalogPanel.tsx
- src/centerpanel/components/map/catalog/MapCatalogPanel.module.css
- src/centerpanel/components/map/mapLeftPanelContracts.ts
- src/centerpanel/components/map/shell/MapDockPanelFrame.tsx (new)

Tabs:
Layers, Contents, Catalog, Sources, Bookmarks.

Hard constraints:
- Preserve layer visibility, opacity, reorder, select, identify, schema, metadata, CRS and source behavior.
- Preserve catalog insertion and contents-tree semantics.
- Keep all existing layer tests meaningful.

Visible acceptance:
The left side must clearly become a premium GIS layer/data panel.
```

### Prompt 05 — Redesign right dock as premium Inspector

```text
Task:
Convert the right dock into a premium Inspector/Style/QA/Workflow/Publish/Review/Diagnostics system.

Target files:
- src/centerpanel/components/map/MapRightDockHost.tsx
- src/centerpanel/components/map/MapRightDockHost.module.css
- src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx
- src/centerpanel/components/map/mapRightDockRoutes.ts
- src/centerpanel/components/map/mapDocking.ts
- src/centerpanel/components/map/controllers/useMapRightDockRouting.ts
- src/centerpanel/components/map/inspector/MapInspectorHost.tsx
- src/centerpanel/components/map/inspector/LayerInspector.tsx
- src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx
- src/centerpanel/components/map/style/MapStyleWorkspace.tsx
- src/centerpanel/components/map/ScientificQAPanel.tsx

Hard constraints:
- Do not remove route definitions.
- Do not remove migrated bottom-tab routing.
- Preserve announcements and close/switch behavior.
- Preserve QA, diagnostics, workflow and publish behavior.

Visible acceptance:
The right dock must visually read as one coherent premium inspector system.
```

### Prompt 06 — Clean canvas controls and overlay safe insets

```text
Task:
Clean the map canvas chrome and apply a shared safe-inset system.

Target files:
- src/centerpanel/components/map/MapCanvas.tsx
- src/centerpanel/components/map/MapCanvasControls.tsx
- src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx
- src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx
- src/centerpanel/components/map/MapSearchBar.tsx
- src/centerpanel/components/map/MapSelectionTools.tsx
- src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx
- src/centerpanel/components/map/shell/MapCanvasControlDock.tsx (new)

Hard constraints:
- Do not break drawing, measurement, selection, legend, search, bookmark, temporal or 3D overlays.
- Keyboard fallback controls must remain reachable.

Visible acceptance:
The map canvas must become the dominant visual element and floating controls must stop competing for space.
```

### Prompt 07 — Compact status bar and output drawer

```text
Task:
Redesign the bottom area as a compact status bar plus expandable output drawer.

Target files:
- src/centerpanel/components/map/MapStatusBar.tsx
- src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx
- src/centerpanel/components/map/bottom/MapBottomPanel.tsx
- src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx
- src/centerpanel/components/map/table/MapAttributeTable.tsx
- src/centerpanel/components/map/problems/MapProblemsPanel.tsx
- src/centerpanel/components/map/problems/mapProblemsModel.ts
- src/centerpanel/components/map/MapReviewTimelinePanel.tsx
- src/centerpanel/components/map/shell/MapBottomOutputDrawer.tsx (new)

Hard constraints:
- Preserve attribute table, timeline, problems, evidence, review and diagnostics routes.
- Status chips must remain accurate.

Visible acceptance:
The bottom chrome must be compact by default, with output content available on demand.
```

### Prompt 08 — Polish start/import/publish workflows

```text
Task:
Make start, import, export and publish flows visually consistent with the premium shell.

Target files:
- src/centerpanel/components/map/MapStartDialog.tsx
- src/centerpanel/components/map/MapStartDialog.module.css
- src/centerpanel/components/map/MapImportPreviewDialog.tsx
- src/centerpanel/components/map/MapReportHandoffDrawer.tsx
- src/centerpanel/components/map/publish/MapPublishWorkspace.tsx
- src/centerpanel/components/map/publish/MapPublishOutputInventory.tsx
- src/centerpanel/components/map/publish/MapPublicationMarksPanel.tsx
- src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx
- src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx

Hard constraints:
- Preserve import preflight, CRS warnings, export inventory, offline package, publication readiness and report handoff behavior.

Visible acceptance:
The first-run and publishing experience must feel premium and GIS-specific.
```

### Prompt 09 — Normalize advanced panels

```text
Task:
Normalize advanced tools visually using the same premium panel primitives.

Target files:
- src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx
- src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx
- src/centerpanel/components/map/processing/ToolParameterForm.tsx
- src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx
- src/centerpanel/components/map/plugins/MapPluginPanel.tsx
- src/centerpanel/components/map/MapWorkflowDrawer.tsx
- src/centerpanel/components/map/MapNLQueryPanel.tsx
- src/centerpanel/components/map/scene3d/Scene3DPanel.tsx
- src/centerpanel/components/map/scene3d/SunShadowPanel.tsx
- src/centerpanel/components/map/raster/RasterLayerPanel.tsx
- src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx
- src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx

Hard constraints:
- Do not change processing/model/plugin/service behavior.
- Do not hide advanced tools without a route/menu path.

Visible acceptance:
All advanced tool panels should look like part of one product.
```

### Prompt 10 — Full regression and visual QA pass

```text
Task:
Run a final Map Explorer regression and visual QA pass.

Focus tests:
- map-explorer-canonical-baseline.test.tsx
- mapShellPrimitives.test.tsx
- mapWorkSurfaceVisualPass.test.tsx
- mapOperatorVisualPass.test.tsx
- mapVisualQA.test.ts
- map-accessibility.test.ts
- MapRightDockHost.test.tsx
- mapRightDockRoutes.test.ts
- MapToolbar.command-palette.test.tsx
- map-layer-management.test.ts
- MapBottomPanel.test.tsx
- MapStatusBarRoutes.test.tsx
- useMapExplorerStore.test.ts
- all touched service tests under src/services/map/__tests__

Hard constraints:
- Do not accept visual-only success if any function is unreachable.
- Do not accept passing tests if obvious panel overlap or hidden critical action remains.

Output:
- What changed
- Files changed
- Tests run
- Known risks
- Remaining follow-up items
```

---

## 19. Suggested branch sequence

```text
ui/map-premium-shell-foundation
ui/map-premium-menu-bar
ui/map-left-layer-data-panel
ui/map-right-premium-inspector
ui/map-canvas-control-dock
ui/map-bottom-output-drawer
ui/map-start-import-publish-polish
ui/map-advanced-panel-normalization
ui/map-premium-regression-pass
```

Each branch should be small enough to review but large enough to create visible UI/UX change.

---

## 20. Validation checklist

### 20.1 Functional reachability

- [ ] Every old toolbar command still has a menu, quick action, palette command or panel route.
- [ ] Every old right dock panel still has a right dock route.
- [ ] Every old bottom tab still has a drawer tab or migrated route.
- [ ] Drawing and measurement still work.
- [ ] Layer visibility, opacity and reorder still work.
- [ ] Attribute table opens for the selected layer.
- [ ] CRS warning flow remains visible.
- [ ] Scientific QA panel remains reachable.
- [ ] Publish workflow remains reachable.
- [ ] Report handoff remains reachable.
- [ ] Processing toolbox remains reachable.
- [ ] Model builder remains reachable.
- [ ] Plugin panel remains reachable.
- [ ] 3D, temporal, raster, zoning and massing panels remain reachable.

### 20.2 Visual QA

- [ ] Map is visually dominant on default open.
- [ ] Top menu is simple and premium.
- [ ] Left layer panel is readable and not overcrowded.
- [ ] Right inspector has consistent header/tabs/body.
- [ ] Bottom status bar is compact.
- [ ] Output drawer does not steal map space by default.
- [ ] Canvas controls do not overlap panels.
- [ ] Drag/drop overlay is visible and polished.
- [ ] Empty states are useful.
- [ ] Loading, disabled, error and warning states are visually consistent.

### 20.3 Accessibility QA

- [ ] Keyboard can reach menu bar, panels, canvas controls, drawer and dock.
- [ ] Escape closes menus/drawers without losing state.
- [ ] Focus returns to invoking control after close.
- [ ] Active tabs expose selected state.
- [ ] Icon buttons have accessible names.
- [ ] Reduced motion disables nonessential transitions.
- [ ] Forced-colors remains usable.

---

## 21. Do-not-touch list unless strictly necessary

These areas are implementation-critical and should not be changed for visual redesign unless a type/prop contract requires it:

- `src/services/map/MapDataImporter.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapExportService.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/bridge/MapUrbanBridgeService.ts`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/services/map/MapNLQueryBuilder.ts`
- `src/services/map/MapAnalysisRecommender.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/stores/mapExplorer/*`

Reason: these files encode state, persistence, GIS behavior, QA behavior, evidence behavior, export behavior and analysis behavior. UI work should consume them, not rewrite them.

---

## 22. Appendix A — Full Map Explorer component file inventory

| File | Lines |
| --- | --- |
| src/centerpanel/components/map/CartographyRecommendationList.tsx | 379 |
| src/centerpanel/components/map/ContextToolbar.tsx | 113 |
| src/centerpanel/components/map/DeclareCrsControl.tsx | 373 |
| src/centerpanel/components/map/MapCanvas.tsx | 615 |
| src/centerpanel/components/map/MapCanvasControls.tsx | 639 |
| src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx | 277 |
| src/centerpanel/components/map/MapIcons.tsx | 199 |
| src/centerpanel/components/map/MapImportPreviewDialog.tsx | 362 |
| src/centerpanel/components/map/MapLayerManager.tsx | 3908 |
| src/centerpanel/components/map/MapLayerPanel.tsx | 168 |
| src/centerpanel/components/map/MapNLQueryPanel.tsx | 965 |
| src/centerpanel/components/map/MapPanelErrorBoundary.tsx | 162 |
| src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx | 835 |
| src/centerpanel/components/map/MapPinSidebar.tsx | 227 |
| src/centerpanel/components/map/MapReportHandoffDrawer.tsx | 721 |
| src/centerpanel/components/map/MapReviewTimelinePanel.tsx | 1362 |
| src/centerpanel/components/map/MapRightDockHost.module.css | 355 |
| src/centerpanel/components/map/MapRightDockHost.tsx | 282 |
| src/centerpanel/components/map/MapSearchBar.tsx | 232 |
| src/centerpanel/components/map/MapSelectionTools.tsx | 1031 |
| src/centerpanel/components/map/MapStartDialog.module.css | 524 |
| src/centerpanel/components/map/MapStartDialog.tsx | 438 |
| src/centerpanel/components/map/MapStatusBar.tsx | 1108 |
| src/centerpanel/components/map/MapToolbar.tsx | 3435 |
| src/centerpanel/components/map/MapTopCommandSurface.tsx | 568 |
| src/centerpanel/components/map/MapUrbanMethodCompatibilityRail.tsx | 332 |
| src/centerpanel/components/map/MapWorkflowDrawer.tsx | 2046 |
| src/centerpanel/components/map/MapWorkspaceCockpit.module.css | 1243 |
| src/centerpanel/components/map/MapWorkspaceCockpit.tsx | 796 |
| src/centerpanel/components/map/MapWorkspaceOverviewSummary.module.css | 427 |
| src/centerpanel/components/map/MapWorkspaceOverviewSummary.tsx | 408 |
| src/centerpanel/components/map/MapWorkspaceShell.tsx | 716 |
| src/centerpanel/components/map/ScientificQAPanel.tsx | 876 |
| src/centerpanel/components/map/__tests__/MapAnalyzeWorkspace.test.tsx | 216 |
| src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx | 358 |
| src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx | 78 |
| src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx | 318 |
| src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx | 337 |
| src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts | 239 |
| src/centerpanel/components/map/__tests__/MapContentsModel.test.ts | 179 |
| src/centerpanel/components/map/__tests__/MapLayoutDesignerPanel.test.tsx | 81 |
| src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx | 167 |
| src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx | 248 |
| src/centerpanel/components/map/__tests__/MapPanelErrorBoundary.test.tsx | 54 |
| src/centerpanel/components/map/__tests__/MapPluginPanel.test.tsx | 63 |
| src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx | 196 |
| src/centerpanel/components/map/__tests__/MapProcessingToolboxDesign.test.tsx | 123 |
| src/centerpanel/components/map/__tests__/MapProcessingToolboxServiceTools.test.tsx | 182 |
| src/centerpanel/components/map/__tests__/MapPublishOutputInventory.test.tsx | 61 |
| src/centerpanel/components/map/__tests__/MapPublishWorkspace.test.tsx | 235 |
| src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx | 155 |
| src/centerpanel/components/map/__tests__/MapReviewTimelinePanel.test.tsx | 280 |
| src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx | 154 |
| src/centerpanel/components/map/__tests__/MapSceneWorkspace.test.tsx | 98 |
| src/centerpanel/components/map/__tests__/MapStartDialog.test.tsx | 158 |
| src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx | 206 |
| src/centerpanel/components/map/__tests__/MapStyleWorkspace.test.tsx | 395 |
| src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx | 695 |
| src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx | 165 |
| src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx | 155 |
| src/centerpanel/components/map/__tests__/MapUrbanMethodCompatibilityRail.test.tsx | 179 |
| src/centerpanel/components/map/__tests__/MapVoxCityOverlay.test.tsx | 232 |
| src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx | 287 |
| src/centerpanel/components/map/__tests__/MapWorkspaceOverviewSummary.test.tsx | 123 |
| src/centerpanel/components/map/__tests__/RasterLayerPanel.test.tsx | 180 |
| src/centerpanel/components/map/__tests__/Scene3DPanel.test.tsx | 312 |
| src/centerpanel/components/map/__tests__/TemporalScenePanel.test.tsx | 103 |
| src/centerpanel/components/map/__tests__/UrbanFormSceneControls.test.tsx | 214 |
| src/centerpanel/components/map/__tests__/__snapshots__/mapTokenStatus.test.ts.snap | 66 |
| src/centerpanel/components/map/__tests__/crs-declaration.test.ts | 70 |
| src/centerpanel/components/map/__tests__/fieldCalculator.test.ts | 32 |
| src/centerpanel/components/map/__tests__/fieldProfiles.test.ts | 37 |
| src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts | 217 |
| src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts | 630 |
| src/centerpanel/components/map/__tests__/gisFixtures.test.ts | 77 |
| src/centerpanel/components/map/__tests__/layer-inspector.test.tsx | 213 |
| src/centerpanel/components/map/__tests__/map-accessibility.test.ts | 779 |
| src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx | 403 |
| src/centerpanel/components/map/__tests__/map-components.test.ts | 1121 |
| src/centerpanel/components/map/__tests__/map-context-menu.test.ts | 110 |
| src/centerpanel/components/map/__tests__/map-docking.test.ts | 195 |
| src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts | 602 |
| src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx | 86 |
| src/centerpanel/components/map/__tests__/map-figure-composer.test.tsx | 105 |
| src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx | 134 |
| src/centerpanel/components/map/__tests__/map-layer-management.test.ts | 2158 |
| src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts | 232 |
| src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts | 132 |
| src/centerpanel/components/map/__tests__/map-performance-budget.test.ts | 35 |
| src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx | 232 |
| src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts | 51 |
| src/centerpanel/components/map/__tests__/map-start-dialog-state.test.ts | 112 |
| src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx | 236 |
| src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts | 217 |
| src/centerpanel/components/map/__tests__/mapContextSummary.test.ts | 379 |
| src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts | 331 |
| src/centerpanel/components/map/__tests__/mapFormats.test.ts | 152 |
| src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts | 111 |
| src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts | 260 |
| src/centerpanel/components/map/__tests__/mapOperatorVisualPass.test.tsx | 242 |
| src/centerpanel/components/map/__tests__/mapProblemsPanel.test.tsx | 137 |
| src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts | 101 |
| src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx | 546 |
| src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts | 200 |
| src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts | 258 |
| src/centerpanel/components/map/__tests__/mapVisualQA.test.ts | 359 |
| src/centerpanel/components/map/__tests__/mapWorkSurfaceVisualPass.test.tsx | 213 |
| src/centerpanel/components/map/__tests__/spatial-stats-viz.test.ts | 219 |
| src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts | 526 |
| src/centerpanel/components/map/__tests__/symbology-utils.test.ts | 101 |
| src/centerpanel/components/map/__tests__/temporalPlayback.test.ts | 191 |
| src/centerpanel/components/map/__tests__/unified-command-bar.test.tsx | 94 |
| src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx | 552 |
| src/centerpanel/components/map/analyze/index.ts | 9 |
| src/centerpanel/components/map/bottom/MapBottomPanel.tsx | 257 |
| src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx | 247 |
| src/centerpanel/components/map/bottom/index.ts | 15 |
| src/centerpanel/components/map/catalog/MapCatalogPanel.module.css | 684 |
| src/centerpanel/components/map/catalog/MapCatalogPanel.tsx | 687 |
| src/centerpanel/components/map/catalog/catalogModel.ts | 415 |
| src/centerpanel/components/map/catalog/index.ts | 21 |
| src/centerpanel/components/map/contents/MapContentsTreePanel.module.css | 569 |
| src/centerpanel/components/map/contents/MapContentsTreePanel.tsx | 569 |
| src/centerpanel/components/map/contents/contentsModel.ts | 238 |
| src/centerpanel/components/map/contents/index.ts | 20 |
| src/centerpanel/components/map/contextMenuUtils.ts | 160 |
| src/centerpanel/components/map/controllers/MapActivityRailPresenter.tsx | 25 |
| src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx | 134 |
| src/centerpanel/components/map/controllers/MapExplorerDialogStack.tsx | 35 |
| src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx | 235 |
| src/centerpanel/components/map/controllers/MapExplorerModalRoot.tsx | 12 |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntime.tsx | 4 |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx | 5210 |
| src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx | 790 |
| src/centerpanel/components/map/controllers/MapFlowDispatchDialog.tsx | 172 |
| src/centerpanel/components/map/controllers/MapNavigatorStageView.tsx | 148 |
| src/centerpanel/components/map/controllers/MapPointSymbologyFloatingPanel.tsx | 87 |
| src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx | 503 |
| src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx | 25 |
| src/centerpanel/components/map/controllers/MapWorkflowPreviewOverlay.tsx | 180 |
| src/centerpanel/components/map/controllers/__tests__/useMapCommandHandlers.test.tsx | 75 |
| src/centerpanel/components/map/controllers/__tests__/useMapExplorerLifecycle.test.tsx | 89 |
| src/centerpanel/components/map/controllers/__tests__/useMapLayerRuntime.test.tsx | 84 |
| src/centerpanel/components/map/controllers/__tests__/useMapPanelLayout.test.tsx | 106 |
| src/centerpanel/components/map/controllers/__tests__/useMapReportController.test.tsx | 60 |
| src/centerpanel/components/map/controllers/__tests__/useMapUrbanBridgeController.test.tsx | 92 |
| src/centerpanel/components/map/controllers/__tests__/useMapWorkflowController.test.tsx | 58 |
| src/centerpanel/components/map/controllers/buildMapRuntimeRenderModel.tsx | 1309 |
| src/centerpanel/components/map/controllers/mapExplorerControllerHelpers.ts | 97 |
| src/centerpanel/components/map/controllers/mapExplorerPublishHelpers.ts | 433 |
| src/centerpanel/components/map/controllers/mapExplorerRuntimeShellUi.tsx | 115 |
| src/centerpanel/components/map/controllers/mapExplorerSceneHelpers.ts | 201 |
| src/centerpanel/components/map/controllers/mapExplorerSpatialHelpers.ts | 303 |
| src/centerpanel/components/map/controllers/mapPublishWorkspaceElements.tsx | 370 |
| src/centerpanel/components/map/controllers/useMapActivityRailItems.tsx | 71 |
| src/centerpanel/components/map/controllers/useMapActivityRailSelection.ts | 120 |
| src/centerpanel/components/map/controllers/useMapCommandHandlers.ts | 58 |
| src/centerpanel/components/map/controllers/useMapDataOutputController.ts | 1780 |
| src/centerpanel/components/map/controllers/useMapExplorerLifecycle.ts | 45 |
| src/centerpanel/components/map/controllers/useMapExplorerRuntimeStores.ts | 243 |
| src/centerpanel/components/map/controllers/useMapImportExportState.ts | 105 |
| src/centerpanel/components/map/controllers/useMapLayerRuntime.ts | 21 |
| src/centerpanel/components/map/controllers/useMapPanelLayout.ts | 94 |
| src/centerpanel/components/map/controllers/useMapPerformanceRuntime.ts | 45 |
| src/centerpanel/components/map/controllers/useMapProjectPersistenceController.ts | 521 |
| src/centerpanel/components/map/controllers/useMapProjectPersistenceState.ts | 22 |
| src/centerpanel/components/map/controllers/useMapReportController.ts | 31 |
| src/centerpanel/components/map/controllers/useMapReportEvidenceActions.ts | 238 |
| src/centerpanel/components/map/controllers/useMapReportHandoffActions.ts | 152 |
| src/centerpanel/components/map/controllers/useMapRightDockRouting.ts | 177 |
| src/centerpanel/components/map/controllers/useMapUrbanBridgeController.ts | 103 |
| src/centerpanel/components/map/controllers/useMapWorkflowController.ts | 29 |
| src/centerpanel/components/map/demoDataPacks.ts | 786 |
| src/centerpanel/components/map/design/GisTokenStatusDemo.tsx | 146 |
| src/centerpanel/components/map/design/index.ts | 11 |
| src/centerpanel/components/map/design/motion.module.css | 116 |
| src/centerpanel/components/map/heatmapStyleUtils.ts | 29 |
| src/centerpanel/components/map/index.ts | 329 |
| src/centerpanel/components/map/inspector/LayerInspector.tsx | 707 |
| src/centerpanel/components/map/inspector/MapInspectorHost.tsx | 270 |
| src/centerpanel/components/map/inspector/index.ts | 10 |
| src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx | 664 |
| src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx | 124 |
| src/centerpanel/components/map/inspector/style/legendContract.ts | 727 |
| src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx | 436 |
| src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx | 757 |
| src/centerpanel/components/map/mapAccessibilityMatrix.ts | 116 |
| src/centerpanel/components/map/mapActivityRuntime.ts | 31 |
| src/centerpanel/components/map/mapContextSummary.ts | 406 |
| src/centerpanel/components/map/mapDocking.ts | 164 |
| src/centerpanel/components/map/mapEvidenceArtifacts.ts | 1713 |
| src/centerpanel/components/map/mapExperience.ts | 504 |
| src/centerpanel/components/map/mapLayerMetadata.ts | 595 |
| src/centerpanel/components/map/mapLayoutTokens.ts | 34 |
| src/centerpanel/components/map/mapLeftPanelContracts.ts | 438 |
| src/centerpanel/components/map/mapLegacyBottomTabs.ts | 60 |
| src/centerpanel/components/map/mapRightDockRoutes.ts | 305 |
| src/centerpanel/components/map/mapStartDialogState.ts | 179 |
| src/centerpanel/components/map/mapTokens.ts | 1292 |
| src/centerpanel/components/map/mapTypes.ts | 1249 |
| src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css | 464 |
| src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx | 684 |
| src/centerpanel/components/map/modelBuilder/index.ts | 5 |
| src/centerpanel/components/map/navigation/index.ts | 33 |
| src/centerpanel/components/map/navigation/mapNavigationModel.ts | 864 |
| src/centerpanel/components/map/navigation/mapSurfaceInventory.ts | 1641 |
| src/centerpanel/components/map/plugins/MapPluginPanel.tsx | 295 |
| src/centerpanel/components/map/plugins/index.ts | 2 |
| src/centerpanel/components/map/problems/MapProblemsPanel.tsx | 298 |
| src/centerpanel/components/map/problems/index.ts | 14 |
| src/centerpanel/components/map/problems/mapProblemsModel.ts | 502 |
| src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx | 873 |
| src/centerpanel/components/map/processing/ToolParameterForm.tsx | 301 |
| src/centerpanel/components/map/processing/index.ts | 10 |
| src/centerpanel/components/map/publish/MapPublicationMarksPanel.tsx | 308 |
| src/centerpanel/components/map/publish/MapPublishOutputInventory.tsx | 281 |
| src/centerpanel/components/map/publish/MapPublishWorkspace.tsx | 578 |
| src/centerpanel/components/map/publish/index.ts | 21 |
| src/centerpanel/components/map/raster/RasterHistogramChart.tsx | 146 |
| src/centerpanel/components/map/raster/RasterLayerPanel.tsx | 748 |
| src/centerpanel/components/map/raster/RasterLegend.tsx | 163 |
| src/centerpanel/components/map/review/MapReviewSidebar.tsx | 339 |
| src/centerpanel/components/map/review/__tests__/MapReviewSidebar.test.tsx | 82 |
| src/centerpanel/components/map/scene/MapSceneWorkspace.tsx | 182 |
| src/centerpanel/components/map/scene/index.ts | 7 |
| src/centerpanel/components/map/scene3d/ScenarioComparisonStrip.tsx | 467 |
| src/centerpanel/components/map/scene3d/Scene3DInteractionStrip.tsx | 268 |
| src/centerpanel/components/map/scene3d/Scene3DPanel.tsx | 1369 |
| src/centerpanel/components/map/scene3d/SunShadowPanel.tsx | 545 |
| src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx | 340 |
| src/centerpanel/components/map/sidebar/index.ts | 5 |
| src/centerpanel/components/map/spatialStatsVizUtils.ts | 482 |
| src/centerpanel/components/map/streaming/StreamingBadge.tsx | 96 |
| src/centerpanel/components/map/style/MapStyleWorkspace.tsx | 1424 |
| src/centerpanel/components/map/style/index.ts | 17 |
| src/centerpanel/components/map/symbolStyleUtils.ts | 163 |
| src/centerpanel/components/map/symbologyUtils.ts | 99 |
| src/centerpanel/components/map/table/MapAttributeTable.tsx | 924 |
| src/centerpanel/components/map/table/MapAttributeWorkflowPanel.tsx | 725 |
| src/centerpanel/components/map/table/fieldCalculator.ts | 661 |
| src/centerpanel/components/map/table/fieldProfiles.ts | 311 |
| src/centerpanel/components/map/temporal/TemporalPlayerPanel.tsx | 295 |
| src/centerpanel/components/map/temporal/TemporalScenePanel.tsx | 305 |
| src/centerpanel/components/map/temporal/index.ts | 7 |
| src/centerpanel/components/map/ui/AppDropdownMenu.tsx | 383 |
| src/centerpanel/components/map/ui/AppMenu.tsx | 15 |
| src/centerpanel/components/map/ui/AppPopover.tsx | 215 |
| src/centerpanel/components/map/ui/GisDisclosureRow.tsx | 150 |
| src/centerpanel/components/map/ui/GisEmptyState.tsx | 85 |
| src/centerpanel/components/map/ui/GisIconButton.tsx | 162 |
| src/centerpanel/components/map/ui/GisPrimitive.module.css | 88 |
| src/centerpanel/components/map/ui/GisProgressBar.tsx | 82 |
| src/centerpanel/components/map/ui/GisPropertyGrid.tsx | 190 |
| src/centerpanel/components/map/ui/GisSectionHeader.tsx | 85 |
| src/centerpanel/components/map/ui/GisStatusChip.tsx | 174 |
| src/centerpanel/components/map/ui/GisTabs.tsx | 205 |
| src/centerpanel/components/map/ui/GisToolbar.tsx | 113 |
| src/centerpanel/components/map/ui/GisTooltip.tsx | 80 |
| src/centerpanel/components/map/ui/__tests__/AppPopover.test.tsx | 190 |
| src/centerpanel/components/map/ui/index.ts | 52 |
| src/centerpanel/components/map/ui/mapOverlayPortal.ts | 26 |
| src/centerpanel/components/map/useAnnouncer.tsx | 52 |
| src/centerpanel/components/map/useDraggableMapPanel.ts | 135 |
| src/centerpanel/components/map/useFocusTrap.ts | 122 |
| src/centerpanel/components/map/useLayerSync.ts | 776 |
| src/centerpanel/components/map/useMapAoiDispatch.ts | 240 |
| src/centerpanel/components/map/useMapKeyboardControls.ts | 138 |
| src/centerpanel/components/map/useMapPanelCommands.ts | 401 |
| src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx | 797 |
| src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx | 738 |

---

## 23. Appendix B — Map service file inventory

| File | Lines |
| --- | --- |
| src/services/map/DrawnGeometryValidation.ts | 194 |
| src/services/map/ExternalServiceConnector.ts | 1825 |
| src/services/map/ExternalServiceQueue.ts | 60 |
| src/services/map/ExternalTileUrlTemplates.ts | 13 |
| src/services/map/IdeToMapArtifactRecognitionService.ts | 911 |
| src/services/map/MapAIGuardrails.ts | 369 |
| src/services/map/MapAnalysisBounds.ts | 99 |
| src/services/map/MapAnalysisDispatcher.ts | 660 |
| src/services/map/MapAnalysisRecommender.ts | 1245 |
| src/services/map/MapCartographyAdvisor.ts | 1354 |
| src/services/map/MapCodeArtifactRequestService.ts | 788 |
| src/services/map/MapDataExporter.ts | 303 |
| src/services/map/MapDataImporter.ts | 3284 |
| src/services/map/MapEngineAdapter.ts | 3233 |
| src/services/map/MapExportService.ts | 2662 |
| src/services/map/MapNLQueryBuilder.ts | 1342 |
| src/services/map/MapOfflinePackageService.ts | 632 |
| src/services/map/MapPerformanceDiagnostics.ts | 378 |
| src/services/map/MapPersistenceService.ts | 1771 |
| src/services/map/MapPublicationOutputBindingService.ts | 635 |
| src/services/map/MapReportHandoffService.ts | 1002 |
| src/services/map/MapReviewSessionService.ts | 1179 |
| src/services/map/MapScientificQA.ts | 1988 |
| src/services/map/MapScientificQA.worker.ts | 12 |
| src/services/map/MapSyncService.ts | 165 |
| src/services/map/MapToUrbanContextAdapter.ts | 52 |
| src/services/map/MapWorkflowService.ts | 2796 |
| src/services/map/SpatialStatsExecutionQueue.ts | 68 |
| src/services/map/SpatialStatsExecutionService.ts | 498 |
| src/services/map/UrbanToMapMethodRequestAdapter.ts | 60 |
| src/services/map/__tests__/CrsPreflight.test.ts | 108 |
| src/services/map/__tests__/DrawnGeometryValidation.test.ts | 27 |
| src/services/map/__tests__/ExecutionCrsPlanner.test.ts | 73 |
| src/services/map/__tests__/ExternalServiceConnector.test.ts | 503 |
| src/services/map/__tests__/GeometryWorkflowEngine.test.ts | 197 |
| src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts | 193 |
| src/services/map/__tests__/Map3DSceneController.test.ts | 186 |
| src/services/map/__tests__/MapAIGuardrails.test.ts | 88 |
| src/services/map/__tests__/MapActionExecutor.test.ts | 507 |
| src/services/map/__tests__/MapAnalysisBounds.test.ts | 50 |
| src/services/map/__tests__/MapAnalysisDispatcher.test.ts | 249 |
| src/services/map/__tests__/MapAnalysisRecommender.test.ts | 292 |
| src/services/map/__tests__/MapCartographyAdvisor.test.ts | 132 |
| src/services/map/__tests__/MapCodeArtifactRequestService.test.ts | 290 |
| src/services/map/__tests__/MapConnectionRegistry.test.ts | 205 |
| src/services/map/__tests__/MapDataIO.test.ts | 916 |
| src/services/map/__tests__/MapEngineAdapter.test.ts | 1145 |
| src/services/map/__tests__/MapExportService.test.ts | 587 |
| src/services/map/__tests__/MapExtensionRegistry.test.ts | 211 |
| src/services/map/__tests__/MapJoinPreviewService.test.ts | 168 |
| src/services/map/__tests__/MapLayoutComposer.test.ts | 216 |
| src/services/map/__tests__/MapLayoutComposerV2.test.ts | 182 |
| src/services/map/__tests__/MapModelBuilder.test.ts | 203 |
| src/services/map/__tests__/MapNLQueryBuilder.test.ts | 252 |
| src/services/map/__tests__/MapObservabilityService.test.ts | 82 |
| src/services/map/__tests__/MapOfflinePackageService.test.ts | 357 |
| src/services/map/__tests__/MapPerformanceDiagnostics.test.ts | 73 |
| src/services/map/__tests__/MapPersistenceService.test.ts | 855 |
| src/services/map/__tests__/MapProcessingRegistry.test.ts | 72 |
| src/services/map/__tests__/MapProcessingServiceTools.test.ts | 202 |
| src/services/map/__tests__/MapProcessingTools.test.ts | 164 |
| src/services/map/__tests__/MapPublicationOutputBindingService.test.ts | 222 |
| src/services/map/__tests__/MapQueryPlanner.test.ts | 135 |
| src/services/map/__tests__/MapReportHandoffService.test.ts | 334 |
| src/services/map/__tests__/MapReviewCollaborationService.test.ts | 164 |
| src/services/map/__tests__/MapReviewSessionService.test.ts | 467 |
| src/services/map/__tests__/MapScientificQA.test.ts | 287 |
| src/services/map/__tests__/MapSourceRegistry.test.ts | 106 |
| src/services/map/__tests__/MapSyncService.test.ts | 78 |
| src/services/map/__tests__/MapTerrainCityModelService.test.ts | 160 |
| src/services/map/__tests__/MapToUrbanContextAdapter.test.ts | 231 |
| src/services/map/__tests__/MapUrbanBridgeService.test.ts | 352 |
| src/services/map/__tests__/MapWorkflowService.test.ts | 414 |
| src/services/map/__tests__/MapWorkflowWorkerExecution.test.ts | 186 |
| src/services/map/__tests__/MassingEngine.test.ts | 293 |
| src/services/map/__tests__/RasterHistogramEngine.test.ts | 219 |
| src/services/map/__tests__/SolarPositionService.test.ts | 140 |
| src/services/map/__tests__/SpatialStatsExecutionService.test.ts | 155 |
| src/services/map/__tests__/SunShadowEngine.test.ts | 194 |
| src/services/map/__tests__/TopologyRepairService.test.ts | 124 |
| src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts | 276 |
| src/services/map/__tests__/VectorStreamingService.test.ts | 326 |
| src/services/map/__tests__/VectorTilePipelineService.test.ts | 131 |
| src/services/map/__tests__/ViewCorridorSectionService.test.ts | 112 |
| src/services/map/__tests__/ZoningEnvelopeEngine.test.ts | 225 |
| src/services/map/__tests__/ZoningRuleEngine.test.ts | 304 |
| src/services/map/__tests__/crsCatalog.test.ts | 49 |
| src/services/map/__tests__/ideMapHandoff.test.ts | 336 |
| src/services/map/__tests__/mapToIdeHandoff.test.ts | 453 |
| src/services/map/__tests__/voxCitySyncEvidence.test.ts | 93 |
| src/services/map/actions/MapActionExecutor.ts | 554 |
| src/services/map/actions/MapActionHistoryService.ts | 198 |
| src/services/map/bridge/MapUrbanBridgeService.ts | 1377 |
| src/services/map/cartography/AdvancedCartographyEngine.ts | 422 |
| src/services/map/collaboration/MapReviewCollaborationService.ts | 852 |
| src/services/map/commands/MapCommandPalette.ts | 320 |
| src/services/map/contracts/gisContracts.ts | 490 |
| src/services/map/crs/CrsPreflight.ts | 180 |
| src/services/map/crs/ExecutionCrsPlanner.ts | 153 |
| src/services/map/crs/MapProjectionService.ts | 144 |
| src/services/map/crs/crsCatalog.ts | 134 |
| src/services/map/geometry/GeometryWorkflowEngine.ts | 755 |
| src/services/map/geometry/ReprojectionCache.ts | 385 |
| src/services/map/geometry/geosGeometryBackend.ts | 188 |
| src/services/map/geometry/mapWorkflowWorkerExecutor.ts | 71 |
| src/services/map/ideMapHandoff.ts | 712 |
| src/services/map/join/MapJoinPreviewService.ts | 622 |
| src/services/map/labels/MapLabelEngine.ts | 230 |
| src/services/map/layout/MapLayoutComposer.ts | 535 |
| src/services/map/mapToIdeHandoff.ts | 633 |
| src/services/map/model/MapModelBuilder.ts | 740 |
| src/services/map/model/index.ts | 26 |
| src/services/map/observability/MapObservabilityService.ts | 236 |
| src/services/map/observability/index.ts | 1 |
| src/services/map/plugins/MapExtensionRegistry.ts | 284 |
| src/services/map/plugins/index.ts | 33 |
| src/services/map/plugins/referencePlugins.ts | 115 |
| src/services/map/processing/MapProcessingExecutor.ts | 311 |
| src/services/map/processing/MapProcessingRegistry.ts | 102 |
| src/services/map/processing/index.ts | 52 |
| src/services/map/processing/pluginTools.ts | 104 |
| src/services/map/processing/referenceTools.ts | 522 |
| src/services/map/processing/serviceTools.ts | 615 |
| src/services/map/query/MapQueryPlanner.ts | 718 |
| src/services/map/raster/GeoTiffParser.ts | 304 |
| src/services/map/raster/RasterHistogramEngine.ts | 207 |
| src/services/map/raster/RasterQAService.ts | 140 |
| src/services/map/scene3d/Map3DSceneController.ts | 358 |
| src/services/map/scene3d/MapTerrainCityModelService.ts | 568 |
| src/services/map/scene3d/SolarPositionService.ts | 102 |
| src/services/map/scene3d/SunShadowEngine.ts | 262 |
| src/services/map/scene3d/ViewCorridorSectionService.ts | 563 |
| src/services/map/sources/MapConnectionRegistry.ts | 687 |
| src/services/map/sources/MapSourceRegistry.ts | 449 |
| src/services/map/streaming/ExtentQueryEngine.ts | 179 |
| src/services/map/streaming/VectorStreamingService.ts | 267 |
| src/services/map/temporal/TemporalPlaybackEngine.ts | 383 |
| src/services/map/temporal/index.ts | 28 |
| src/services/map/temporal/temporalLayerHandoff.ts | 27 |
| src/services/map/tiling/VectorTilePipelineService.ts | 514 |
| src/services/map/topology/TopologyRepairService.ts | 365 |
| src/services/map/voxCityProjection.ts | 403 |
| src/services/map/voxCitySelectionService.ts | 437 |
| src/services/map/zoning/MassingEngine.ts | 315 |
| src/services/map/zoning/ZoningEnvelopeEngine.ts | 294 |
| src/services/map/zoning/ZoningRuleEngine.ts | 297 |

---

## 24. Appendix C — Map Explorer store file inventory

| File | Lines |
| --- | --- |
| src/stores/mapExplorer/persistence.ts | 46 |
| src/stores/mapExplorer/selectors.ts | 153 |
| src/stores/mapExplorer/slicePolicy.ts | 67 |
| src/stores/mapExplorer/slices/aoi.ts | 27 |
| src/stores/mapExplorer/slices/bridge.ts | 36 |
| src/stores/mapExplorer/slices/evidence.ts | 23 |
| src/stores/mapExplorer/slices/layers.ts | 27 |
| src/stores/mapExplorer/slices/layout.ts | 50 |
| src/stores/mapExplorer/slices/qa.ts | 18 |
| src/stores/mapExplorer/slices/review.ts | 18 |
| src/stores/mapExplorer/slices/selection.ts | 18 |
| src/stores/mapExplorer/slices/sources.ts | 18 |
| src/stores/mapExplorer/slices/temporal.ts | 44 |
| src/stores/mapExplorer/slices/types.ts | 32 |
| src/stores/mapExplorer/slices/viewport.ts | 39 |

---

## 25. Appendix D — Shared/legacy `src/components/map` inventory

These are not the primary modal files, but they may provide reusable map utilities or legacy patterns. Do not edit them unless a Map Explorer import path proves they are directly used.

| File | Lines |
| --- | --- |
| src/components/map/CoordinateDisplay.tsx | 149 |
| src/components/map/DrawingTools.tsx | 314 |
| src/components/map/GeocoderSearch.tsx | 284 |
| src/components/map/LayerManager.tsx | 216 |
| src/components/map/MapContainer.tsx | 274 |
| src/components/map/MapControls.tsx | 203 |
| src/components/map/MapLegend.tsx | 218 |
| src/components/map/MinimapInset.tsx | 296 |
| src/components/map/ScaleBar.tsx | 129 |
| src/components/map/SpatialFilter.tsx | 470 |
| src/components/map/SwipeComparison.tsx | 249 |
| src/components/map/TemporalSlider.tsx | 319 |
| src/components/map/google/GoogleDirections.tsx | 221 |
| src/components/map/google/GoogleMapView.tsx | 96 |
| src/components/map/google/GoogleMapsProvider.tsx | 116 |
| src/components/map/google/GooglePlacesSearch.tsx | 263 |
| src/components/map/google/StreetViewPanel.tsx | 162 |
| src/components/map/google/hooks/index.ts | 8 |
| src/components/map/google/hooks/useGoogleMapsAPI.ts | 136 |
| src/components/map/google/index.ts | 24 |
| src/components/map/google/layers/index.ts | 2 |
| src/components/map/google/utils/apiKeyManager.ts | 117 |
| src/components/map/google/utils/googleToGeoJSON.ts | 181 |
| src/components/map/google/utils/index.ts | 24 |
| src/components/map/hooks/index.ts | 9 |
| src/components/map/hooks/useGeoJSONLoader.ts | 199 |
| src/components/map/hooks/useLayerStack.ts | 100 |
| src/components/map/hooks/useMapExport.ts | 324 |
| src/components/map/hooks/useMapState.ts | 94 |
| src/components/map/index.ts | 24 |
| src/components/map/layers/BuildingLayer.tsx | 131 |
| src/components/map/layers/ChoroplethLayer.tsx | 216 |
| src/components/map/layers/FlowMapLayer.tsx | 90 |
| src/components/map/layers/HeatmapLayer.tsx | 69 |
| src/components/map/layers/IsochroneLayer.tsx | 69 |
| src/components/map/layers/NetworkLayer.tsx | 119 |
| src/components/map/layers/PointClusterLayer.tsx | 155 |
| src/components/map/layers/RasterTileLayer.tsx | 151 |
| src/components/map/layers/VoxelLayer.tsx | 181 |
| src/components/map/layers/index.ts | 55 |
| src/components/map/utils/colorScales.ts | 149 |
| src/components/map/utils/index.ts | 9 |
| src/components/map/utils/projections.ts | 97 |

---

## 26. Appendix E — Map-related test inventory

| Test file | Lines |
| --- | --- |
| src/centerpanel/Flows/__tests__/AccessibilityFlow.map-dispatch.test.tsx | 90 |
| src/centerpanel/components/__tests__/MapEmergingHotSpotViz.test.tsx | 192 |
| src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx | 547 |
| src/centerpanel/components/__tests__/MapExportDialog.test.tsx | 109 |
| src/centerpanel/components/__tests__/MapServiceDialog.test.tsx | 29 |
| src/centerpanel/components/__tests__/MapTemporalPlayer.test.tsx | 245 |
| src/centerpanel/components/map/__tests__/MapAnalyzeWorkspace.test.tsx | 216 |
| src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx | 358 |
| src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx | 78 |
| src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx | 318 |
| src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx | 337 |
| src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts | 239 |
| src/centerpanel/components/map/__tests__/MapContentsModel.test.ts | 179 |
| src/centerpanel/components/map/__tests__/MapLayoutDesignerPanel.test.tsx | 81 |
| src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx | 167 |
| src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx | 248 |
| src/centerpanel/components/map/__tests__/MapPanelErrorBoundary.test.tsx | 54 |
| src/centerpanel/components/map/__tests__/MapPluginPanel.test.tsx | 63 |
| src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx | 196 |
| src/centerpanel/components/map/__tests__/MapProcessingToolboxDesign.test.tsx | 123 |
| src/centerpanel/components/map/__tests__/MapProcessingToolboxServiceTools.test.tsx | 182 |
| src/centerpanel/components/map/__tests__/MapPublishOutputInventory.test.tsx | 61 |
| src/centerpanel/components/map/__tests__/MapPublishWorkspace.test.tsx | 235 |
| src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx | 155 |
| src/centerpanel/components/map/__tests__/MapReviewTimelinePanel.test.tsx | 280 |
| src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx | 154 |
| src/centerpanel/components/map/__tests__/MapSceneWorkspace.test.tsx | 98 |
| src/centerpanel/components/map/__tests__/MapStartDialog.test.tsx | 158 |
| src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx | 206 |
| src/centerpanel/components/map/__tests__/MapStyleWorkspace.test.tsx | 395 |
| src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx | 695 |
| src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx | 165 |
| src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx | 155 |
| src/centerpanel/components/map/__tests__/MapUrbanMethodCompatibilityRail.test.tsx | 179 |
| src/centerpanel/components/map/__tests__/MapVoxCityOverlay.test.tsx | 232 |
| src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx | 287 |
| src/centerpanel/components/map/__tests__/MapWorkspaceOverviewSummary.test.tsx | 123 |
| src/centerpanel/components/map/__tests__/RasterLayerPanel.test.tsx | 180 |
| src/centerpanel/components/map/__tests__/Scene3DPanel.test.tsx | 312 |
| src/centerpanel/components/map/__tests__/TemporalScenePanel.test.tsx | 103 |
| src/centerpanel/components/map/__tests__/UrbanFormSceneControls.test.tsx | 214 |
| src/centerpanel/components/map/__tests__/__snapshots__/mapTokenStatus.test.ts.snap | 66 |
| src/centerpanel/components/map/__tests__/crs-declaration.test.ts | 70 |
| src/centerpanel/components/map/__tests__/fieldCalculator.test.ts | 32 |
| src/centerpanel/components/map/__tests__/fieldProfiles.test.ts | 37 |
| src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts | 217 |
| src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts | 630 |
| src/centerpanel/components/map/__tests__/gisFixtures.test.ts | 77 |
| src/centerpanel/components/map/__tests__/layer-inspector.test.tsx | 213 |
| src/centerpanel/components/map/__tests__/map-accessibility.test.ts | 779 |
| src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx | 403 |
| src/centerpanel/components/map/__tests__/map-components.test.ts | 1121 |
| src/centerpanel/components/map/__tests__/map-context-menu.test.ts | 110 |
| src/centerpanel/components/map/__tests__/map-docking.test.ts | 195 |
| src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts | 602 |
| src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx | 86 |
| src/centerpanel/components/map/__tests__/map-figure-composer.test.tsx | 105 |
| src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx | 134 |
| src/centerpanel/components/map/__tests__/map-layer-management.test.ts | 2158 |
| src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts | 232 |
| src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts | 132 |
| src/centerpanel/components/map/__tests__/map-performance-budget.test.ts | 35 |
| src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx | 232 |
| src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts | 51 |
| src/centerpanel/components/map/__tests__/map-start-dialog-state.test.ts | 112 |
| src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx | 236 |
| src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts | 217 |
| src/centerpanel/components/map/__tests__/mapContextSummary.test.ts | 379 |
| src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts | 331 |
| src/centerpanel/components/map/__tests__/mapFormats.test.ts | 152 |
| src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts | 111 |
| src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts | 260 |
| src/centerpanel/components/map/__tests__/mapOperatorVisualPass.test.tsx | 242 |
| src/centerpanel/components/map/__tests__/mapProblemsPanel.test.tsx | 137 |
| src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts | 101 |
| src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx | 546 |
| src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts | 200 |
| src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts | 258 |
| src/centerpanel/components/map/__tests__/mapVisualQA.test.ts | 359 |
| src/centerpanel/components/map/__tests__/mapWorkSurfaceVisualPass.test.tsx | 213 |
| src/centerpanel/components/map/__tests__/spatial-stats-viz.test.ts | 219 |
| src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts | 526 |
| src/centerpanel/components/map/__tests__/symbology-utils.test.ts | 101 |
| src/centerpanel/components/map/__tests__/temporalPlayback.test.ts | 191 |
| src/centerpanel/components/map/__tests__/unified-command-bar.test.tsx | 94 |
| src/centerpanel/components/map/controllers/__tests__/useMapCommandHandlers.test.tsx | 75 |
| src/centerpanel/components/map/controllers/__tests__/useMapExplorerLifecycle.test.tsx | 89 |
| src/centerpanel/components/map/controllers/__tests__/useMapLayerRuntime.test.tsx | 84 |
| src/centerpanel/components/map/controllers/__tests__/useMapPanelLayout.test.tsx | 106 |
| src/centerpanel/components/map/controllers/__tests__/useMapReportController.test.tsx | 60 |
| src/centerpanel/components/map/controllers/__tests__/useMapUrbanBridgeController.test.tsx | 92 |
| src/centerpanel/components/map/controllers/__tests__/useMapWorkflowController.test.tsx | 58 |
| src/centerpanel/components/map/review/__tests__/MapReviewSidebar.test.tsx | 82 |
| src/centerpanel/components/map/ui/__tests__/AppPopover.test.tsx | 190 |
| src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts | 318 |
| src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts | 534 |
| src/services/map/__tests__/CrsPreflight.test.ts | 108 |
| src/services/map/__tests__/DrawnGeometryValidation.test.ts | 27 |
| src/services/map/__tests__/ExecutionCrsPlanner.test.ts | 73 |
| src/services/map/__tests__/ExternalServiceConnector.test.ts | 503 |
| src/services/map/__tests__/GeometryWorkflowEngine.test.ts | 197 |
| src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts | 193 |
| src/services/map/__tests__/Map3DSceneController.test.ts | 186 |
| src/services/map/__tests__/MapAIGuardrails.test.ts | 88 |
| src/services/map/__tests__/MapActionExecutor.test.ts | 507 |
| src/services/map/__tests__/MapAnalysisBounds.test.ts | 50 |
| src/services/map/__tests__/MapAnalysisDispatcher.test.ts | 249 |
| src/services/map/__tests__/MapAnalysisRecommender.test.ts | 292 |
| src/services/map/__tests__/MapCartographyAdvisor.test.ts | 132 |
| src/services/map/__tests__/MapCodeArtifactRequestService.test.ts | 290 |
| src/services/map/__tests__/MapConnectionRegistry.test.ts | 205 |
| src/services/map/__tests__/MapDataIO.test.ts | 916 |
| src/services/map/__tests__/MapEngineAdapter.test.ts | 1145 |
| src/services/map/__tests__/MapExportService.test.ts | 587 |
| src/services/map/__tests__/MapExtensionRegistry.test.ts | 211 |
| src/services/map/__tests__/MapJoinPreviewService.test.ts | 168 |
| src/services/map/__tests__/MapLayoutComposer.test.ts | 216 |
| src/services/map/__tests__/MapLayoutComposerV2.test.ts | 182 |
| src/services/map/__tests__/MapModelBuilder.test.ts | 203 |
| src/services/map/__tests__/MapNLQueryBuilder.test.ts | 252 |
| src/services/map/__tests__/MapObservabilityService.test.ts | 82 |
| src/services/map/__tests__/MapOfflinePackageService.test.ts | 357 |
| src/services/map/__tests__/MapPerformanceDiagnostics.test.ts | 73 |
| src/services/map/__tests__/MapPersistenceService.test.ts | 855 |
| src/services/map/__tests__/MapProcessingRegistry.test.ts | 72 |
| src/services/map/__tests__/MapProcessingServiceTools.test.ts | 202 |
| src/services/map/__tests__/MapProcessingTools.test.ts | 164 |
| src/services/map/__tests__/MapPublicationOutputBindingService.test.ts | 222 |
| src/services/map/__tests__/MapQueryPlanner.test.ts | 135 |
| src/services/map/__tests__/MapReportHandoffService.test.ts | 334 |
| src/services/map/__tests__/MapReviewCollaborationService.test.ts | 164 |
| src/services/map/__tests__/MapReviewSessionService.test.ts | 467 |
| src/services/map/__tests__/MapScientificQA.test.ts | 287 |
| src/services/map/__tests__/MapSourceRegistry.test.ts | 106 |
| src/services/map/__tests__/MapSyncService.test.ts | 78 |
| src/services/map/__tests__/MapTerrainCityModelService.test.ts | 160 |
| src/services/map/__tests__/MapToUrbanContextAdapter.test.ts | 231 |
| src/services/map/__tests__/MapUrbanBridgeService.test.ts | 352 |
| src/services/map/__tests__/MapWorkflowService.test.ts | 414 |
| src/services/map/__tests__/MapWorkflowWorkerExecution.test.ts | 186 |
| src/services/map/__tests__/MassingEngine.test.ts | 293 |
| src/services/map/__tests__/RasterHistogramEngine.test.ts | 219 |
| src/services/map/__tests__/SolarPositionService.test.ts | 140 |
| src/services/map/__tests__/SpatialStatsExecutionService.test.ts | 155 |
| src/services/map/__tests__/SunShadowEngine.test.ts | 194 |
| src/services/map/__tests__/TopologyRepairService.test.ts | 124 |
| src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts | 276 |
| src/services/map/__tests__/VectorStreamingService.test.ts | 326 |
| src/services/map/__tests__/VectorTilePipelineService.test.ts | 131 |
| src/services/map/__tests__/ViewCorridorSectionService.test.ts | 112 |
| src/services/map/__tests__/ZoningEnvelopeEngine.test.ts | 225 |
| src/services/map/__tests__/ZoningRuleEngine.test.ts | 304 |
| src/services/map/__tests__/crsCatalog.test.ts | 49 |
| src/services/map/__tests__/ideMapHandoff.test.ts | 336 |
| src/services/map/__tests__/mapToIdeHandoff.test.ts | 453 |
| src/services/map/__tests__/voxCitySyncEvidence.test.ts | 93 |
| src/stores/__tests__/useMapExplorerStore.test.ts | 1040 |
| src/stores/__tests__/useMapToolbarPreferencesStore.test.ts | 83 |

---

## 27. Final implementation principle

The redesigned Map Explorer must look radically cleaner and more premium, but its internal promise must remain unchanged:

```text
Every GIS, CRS, QA, evidence, diagnostics, import/export, publish,
workflow, analysis, scene, temporal, raster, drawing, measurement,
review, layer and map behavior that existed before must remain reachable,
testable and semantically intact after the UI redesign.
```
