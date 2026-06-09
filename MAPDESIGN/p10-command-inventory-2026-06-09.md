# Prompt 10 - Header and Command Surface Inventory

Date: 2026-06-09
Scope: Prompt 10 (inventory-only, no implementation edits)
Branch: ui/map-modal-command-bar-p2

## 1) Header + command surface inventory

| Surface | File | Visible role | Command types shown | Scope type |
|---|---|---|---|---|
| Top command shell (`MapTopCommandSurface`) | src/centerpanel/components/map/MapTopCommandSurface.tsx | Header identity + context chips + command/search slots | Project, mode, save-state, scope, CRS, active layer; search slot and command slot containers | Global shell |
| Command center (`MapToolbar`) | src/centerpanel/components/map/MapToolbar.tsx | Primary action, grouped commands, overflow, command palette | Data, layers, contents, QA, query, workflow, review, diagnostics, plugins, toolbox/model, draw/measure, save/load/export/report, layout/system commands | Global + contextual |
| Search entry (`MapSearchBar` in top surface slot) | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Place/feature lookup and fly-to | Search/fly-to/context handoff | Global (header-local) |
| Activity rail (`MapActivityRail`) | src/centerpanel/components/map/MapWorkspaceShell.tsx + src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Primary mode switching and quick-entry surfaces | Explore/Analyze/Style/Scene/Publish activity switches + utility actions | Global navigation |
| Modal trailing controls (current) | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Explicit modal exit action | Close map explorer (Escape) | Global modal-control |
| Canvas overlay controls (`MapCanvasControls`) | src/centerpanel/components/map/MapCanvasControls.tsx + usage in controller | Map camera/interaction/furniture quick tools | Zoom, reset, fit visible/selected, selection modes, draw/measure state clear, legend/scale/north-arrow toggles, keyboard help | Map-overlay |
| Selection dock (`MapSelectionTools`) | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx + src/centerpanel/components/map/MapSelectionTools.tsx | Selection workflow shortcuts near map surface | Rectangle/lasso select, selection clear/apply routes | Map-overlay contextual |
| Right dock host controls (`MapRightDockHost`) | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Panel-local close/collapse + panel switching | Dock collapse/close/panel route transitions | Panel-local |

## 2) Command duplication map (near-duplicate intent)

- Layers
  - `layers` (toolbar command)
  - `contents` (toolbar command with overlapping layer management semantics)
  - Activity/tab routes that also open layer-oriented sidebars
- Import
  - `import` (toolbar)
  - drag-drop on canvas region (direct import path)
  - catalog/service-driven source insertion paths
- Export / publish
  - `export-image`, `export-offline-package`, `export-geojson`, `add-map-to-report` (toolbar)
  - publish activity tabs expose related outcomes (overlapping destination, different context)
- QA / diagnostics
  - `qa` command and problems/scientific QA right-dock routes
  - `performance-diagnostics` command and performance right-dock route
- Reset/layout/system
  - `reset-layout`, `collapse-panels`, `restore-default-widths`, `focus-map-canvas` (all system-level and partially adjacent in effect)
- Search
  - Header `MapSearchBar`
  - Command palette search (`command-palette`) for command discovery
- Selection / draw / measure
  - Toolbar entries (`draw-*`, `measure-*`, `drawings`, `measure-results`)
  - Canvas overlay/dock controls (`MapCanvasControls`, `MapSelectionTools`)
- Report/publish handoff
  - `add-map-to-report` from toolbar
  - Publish workspace/report routes in activity/panel surfaces

## 3) Primary vs secondary command classification (current-state)

- Always visible
  - Task lens selector (except navigator mode)
  - Contextual primary action
  - Command palette trigger
  - Undo/redo when available
  - Top-surface group buttons (Data/Explore/Analyze/Publish/System, width-dependent)
  - Close map explorer button (header trailing slot)
- Visible only when relevant
  - Many contextual commands in groups (QA severity-driven, query when queryable layers exist, workflow when relevant, export enablement conditions, etc.)
  - Canvas overlay interaction states (active draw/measure/selection)
- Overflow menu
  - Remaining command registry not represented by direct/inline grouped surface at current width
  - Density switch and command center extras
- Command palette
  - Full registry search across toolbar commands + processing tools
- Panel-local actions
  - Right dock panel actions and close/collapse
  - Sidebar/tab-specific actions
- Advanced/developer-ish
  - Diagnostics/perf, plugin registry, processing toolbox/model builder, selected system layout/recovery actions

## 4) Modal control audit (Prompt 10)

- Close placement
  - Present in top command surface trailing slot as a distinct button (`Close map explorer (Escape)`).
  - Visually adjacent to bookmark menu, not mixed with map canvas overlay furniture.
- Dock placement
  - Docking controls are primarily panel-level (right dock host collapse/close), not represented as a canonical modal-level control cluster.
- Expand/minimize placement
  - No stable dedicated modal-level expand/minimize control cluster is currently exposed in the top-right header controls.
  - Similar behavior is distributed across layout/system commands (`reset-layout`, `collapse-panels`, width restore) and panel host controls.
- Separation from map tools
  - Broadly good: map tools are inside command groups/overlay controls; modal close is in trailing header slot.
  - Risk: users may still interpret some global layout commands as modal-control actions because labels overlap conceptually.
- Unsafe exit risks
  - Escape and close button exist; prompt-10 risk remains discoverability/predictability rather than missing exit.
  - Unsaved-work behavior appears guarded by existing persistence state surfaces (save-state chip + save/load commands), but modal control hierarchy is not yet fully explicit.

## 5) Phase 2 implementation recommendation

- Keep visible (high-frequency / orientation-critical)
  - Command palette trigger
  - Layers/data entry point
  - Primary analyze entry point
  - QA/evidence entry point
  - Export/report entry point
  - Modal close control
- Move/keep in overflow
  - Layout recovery commands (`reset-layout`, `collapse-panels`, `restore-default-widths`, density)
  - Lower-frequency advanced commands (plugins, some diagnostics sub-actions)
- Panel-local candidates
  - Draw/measure detail actions should remain primarily panel-local once activated
  - Diagnostics details and review timelines should prefer right-dock context after entry
- Label/tooltip clarity upgrades needed in P11/P12
  - Distinguish modal controls vs workspace/system commands explicitly
  - Clarify `contents` vs `layers` roles
  - Clarify publish-related actions (`report` vs `export package` vs `export data`)
  - Clarify selection tools entry points across toolbar vs map overlay

## Notes

- This prompt intentionally made no code changes.
- This inventory is intended to drive P11 (modal control hierarchy) and P12 (command regrouping).