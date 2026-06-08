# 08 - Baseline Surface Inventory

Status: Prompt 00 implemented  
Date: 2026-06-05  
Purpose: Freeze the current Map Explorer surface inventory before redesign behavior changes.

This file records the known baseline only. It does not approve the current bottom-panel or floating-panel behavior as final design. Later prompts must migrate these entries to the right dock, left panel, dialog, status bar, or transient canvas overlay as specified in the operating pack.

## Canonical Runtime Surfaces

Primary runtime files:

- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`
- `src/centerpanel/components/map/navigation/mapNavigationModel.ts`

## Current Bottom Workspace State

Current bottom workspace state and helpers are local to `MapExplorerModalComposition.tsx`:

- `bottomPanelOpen`
- `activeBottomPanelTab`
- `openBottomPanelTab`
- `toggleBottomPanelTab`
- `closeBottomPanel`
- `bottomPanelTasks`
- `bottomPanelProblemsContent`
- `bottomPanelAttributesContent`
- `bottomPanelTimelineContent`
- `bottomPanelDiagnosticsContent`

Current bottom workspace host:

- `MapBottomPanel`
- `MapPanelRailSide = "left" | "right" | "bottom"`
- `MapLayerPanelPlacement = "left" | "bottom"`

## Current Bottom-Panel Inventory Targets

The current `targetSlot: "bottom-panel"` entries in `mapSurfaceInventory.ts` are:

- `toolbar.qa`
- `toolbar.review-timeline`
- `toolbar.performance-diagnostics`
- `toolbar.measure-results`
- `rail.diagnostics.activity`
- `rail.qa`
- `quick-action.review-problems`
- `state.showScientificQAPanel`
- `state.showReviewTimeline`
- `state.showPerformanceDiagnostics`
- `state.attributeTableLayerId`
- `state.activeTemporalLayer`
- `state.temporalStoreFrameCount`

These entries are frozen by `mapSurfaceInventory.test.ts`; adding a new one must be intentional and should normally wait for the right-dock migration prompts.

## Current Bottom Navigation Model

Current bottom tab IDs:

- `problems`
- `attributes`
- `timeline`
- `tasks`
- `diagnostics`
- `console`
- `measurements`

Current activity defaults that point to bottom tabs:

- `data` -> `tasks`
- `layers` -> `attributes`
- `analyze` -> `tasks`
- `scene` -> `timeline`
- `publish` -> `tasks`
- `qa` -> `problems`
- `review` -> `timeline`
- `diagnostics` -> `diagnostics`

Current task-lens bottom priorities:

- `analyst`: `problems`, `attributes`, `tasks`, `diagnostics`
- `planner`: `attributes`, `timeline`, `problems`, `tasks`
- `reviewer`: `problems`, `timeline`, `diagnostics`, `console`
- `publisher`: `timeline`, `problems`, `tasks`, `attributes`

These are frozen by `mapNavigationModel.test.ts` until Prompt 08 migrates navigation and surface inventory away from bottom-panel concepts.

## Current Floating And Canvas-Overlay Inventory

Current persistent floating surfaces named in inventory:

- `state.showChoroplethPanel` -> `MapChoroplethLayer floating panel`
- `state.showClusterViz` -> `MapClusterViz floating panel`
- `state.showHotSpotViz` -> `MapHotSpotViz floating panel`
- `state.showEmergingHotSpotViz` -> `MapEmergingHotSpotViz floating panel`
- `state.pointSymbologyLayerId` -> `Point symbology floating panel`

Current canvas-overlay target-home entries:

- `toolbar.focus-map-canvas`
- `toolbar.pin-mode`
- `toolbar.draw-point`
- `toolbar.draw-linestring`
- `toolbar.draw-polygon`
- `toolbar.draw-rectangle`
- `toolbar.draw-circle`
- `toolbar.drawings`
- `toolbar.measure-distance`
- `toolbar.measure-area`
- `quick-action.draw-aoi`
- `quick-action.measure`
- `state.showDrawPanel`
- `state.showMeasurePanel`
- `state.showCanvasKeyboardHelp`
- `surface.MapSelectionTools`
- `surface.MapCanvasControls`
- `surface.MapContextMenu`

The draw and measure panel states are currently mounted through:

- `showDrawPanel`
- `showMeasurePanel`
- `MapDrawingManager`
- `MapMeasurementTool`

Prompt 15 and Prompt 16 own the dock consolidation for these tool surfaces.

## Current Dialog And Drawer Inventory

Current dialog entries:

- `state.showExternalServiceDialog`
- `state.showImportHub`
- `state.showExportDialog`
- `state.showMapExportDialog`
- `state.isFlowDispatchDialogOpen`
- `state.pendingImportPreview`
- `state.pendingCsvImport`
- `state.pendingColumnarImport`

Current drawer entries:

- `state.showWorkflowDrawer`
- `state.reportHandoffDraft`

These are frozen by `mapSurfaceInventory.test.ts` so modal/drawer inventory changes stay explicit.

## Current Route Sources

Toolbar routes:

- `MapToolbar.tsx` defines command IDs and dynamic processing palette commands.
- Bottom-oriented toolbar commands currently include `toolbar.qa`, `toolbar.review-timeline`, `toolbar.performance-diagnostics`, and `toolbar.measure-results`.

Status bar routes:

- `MapStatusBar` exposes callbacks for problems, attributes, timeline, collaboration, and diagnostics.
- `MapExplorerModalComposition.tsx` currently maps these callbacks to `openBottomPanelTab(...)`.

Activity rail routes:

- Activity rail items are derived from `MAP_PRIMARY_ACTIVITY_DEFINITIONS` and `MAP_UTILITY_ACTIVITY_DEFINITIONS`.
- Current bottom-oriented rail targets include `rail.qa` and `rail.diagnostics.activity`.

Command palette routes:

- Command palette coverage is inherited from toolbar command IDs and the `processing:*` dynamic command pattern.
- Existing tests assert every toolbar and palette command has a surface inventory entry.

Cockpit and quick-action routes:

- Workspace views and quick actions are covered through `MAP_WORKSPACE_VIEWS` and `MAP_QUICK_ACTIONS`.
- Current bottom-oriented quick action: `quick-action.review-problems`.
- `MapWorkspaceCockpit` currently has a path that calls `openBottomPanelTab("problems", ...)`.

## High-Risk Files For Later Prompts

- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`
- `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- `src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts`
- `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`
- `src/centerpanel/components/map/__tests__/map-docking.test.ts`
- `src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx`
- `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`

## Validation Added By Prompt 00

- `mapSurfaceInventory.test.ts` now freezes current bottom target, floating surface, canvas-overlay, dialog, and drawer baselines.
- `mapNavigationModel.test.ts` now freezes current bottom tab IDs, activity bottom defaults, and task-lens bottom priorities.

