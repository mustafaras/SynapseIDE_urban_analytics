# 07 - Anti-Amnesia Ledger

Status: Archived  
Last updated: 2026-06-08  
Purpose: Keep redesign state resumable without rereading the full repo.

## Current Snapshot

Prompts 00 through 18 remain implemented in the repo and this pack has been archived out of the repository root. During the 2026-06-08 archive-prep revalidation pass, local Node tooling was available again: `npm run typecheck`, `npm run lint:errors`, `npm run test:analytics`, and `npm run build` all passed. Additional closeout fixes landed in `MapExplorerModalComposition.tsx`, `MapToolbar.tsx`, `mapNavigationModel.ts`, and the affected Playwright specs to restore the top-shell close control contract, dismiss the launch dialog on real workspace entry points, and realign several e2e flows with the redesigned command surface and docked panels.

Prompt 19 still remains blocked in this archive. Focused Playwright reruns now pass for Prompt 03 accessibility, Prompt 34 Scene 3D interaction, AI guardrails, catalog, choropleth, and the late-suite Map Explorer drift repaired during archive closeout: columnar I/O, contents, context/GeoJSON, CSV/KML/GPX import, stability, external service, figure composer, and image export. Because the full `npm run test:e2e` closeout was not rerun to completion after the last targeted fix, `UX-01` through `UX-06` remain `implemented` rather than promoted to `verified`.

There are no `pending` prompts in `05_IMPLEMENTATION_PROMPTS.json`. Prompt 19 is the only non-verified item and remains `blocked` as archived historical work.

Prompts 00 through 15 have been implemented. Prompt 15 removed the persistent floating draw/sketch sidebar from the Map Explorer and routed it into the right dock `draw` panel. Key changes: (1) `MapDrawingManager` gains a `presentation` prop — `"floating"` keeps the legacy draggable panel, `"embedded"` renders the feature list as a plain scrollable body for embedding in `MapRightDockHost`. (2) `MapExplorerModalComposition` now calls `openRightDockPanel("draw", ...)` when a draw tool is activated (replacing the old `setShowDrawPanel(true)` float show), and `handleToggleDrawPanel` uses `toggleRightDockPanel("draw", ...)`. The floating `MapDrawingManager` canvas-interaction instance is still rendered for map-layer interaction but its `sidebarVisible` is now `effectiveShowDrawPanel && !rightDrawDockActive`, so the floating panel never appears when the right dock is hosting the draw body. The initial `showDrawPanel` state changed from `true` to `false`. A `rightDrawDockActive` constant drives the right dock body content switch. `map-drawing-tools.test.ts` extended with embedded-presentation tests. `npm run typecheck`, `npm run lint:errors`, and `npm run test -- src/centerpanel/components/map` (765 tests) all pass. The draw/sketch portion of `UX-04` is resolved.

Prompts 00 through 14 (earlier history): Prompt 14 applied the left-panel content contracts to real embedded panel CSS by adding CSS container queries (`container-type: inline-size`) to `MapContentsTreePanel.module.css` and `MapCatalogPanel.module.css`. The embedded panels now respond to their container width (not viewport width) at 380/420/520 px breakpoints. `MapWorkbenchSidebar` exposes a `data-width-band` debug attribute on the expanded sidebar. A new test file `map-left-panel-responsive-fit.test.ts` (16 tests) validates width-band coverage, contract bounds, clamping precision, and overflow-strategy correctness at all spec widths. `npm run typecheck`, `npm run lint:errors`, and `npm run test -- src/centerpanel/components/map` (763 tests) all pass. `UX-02` is now fully resolved.

Prompts 00 through 13 (earlier history): Prompt 13 added `mapLeftPanelContracts.ts` — a compile-time-complete registry (`MAP_LEFT_PANEL_CONTRACTS`) of `MapLeftPanelContentContract` entries for every `MapSidebarTabId`. Each contract declares `minComfortWidth`, `preferredWidth`, `maxUsefulWidth`, and `overflowStrategy`. Width-clamping helpers (`clampLeftPanelWidth`, `getLeftPanelContentStrategy`, `getLeftPanelContract`) are provided. Tests in `map-left-panel-contracts.test.ts` (17 tests) enforce registry completeness, width-bounds ordering, `horizontal-disallowed` strategy invariants, and clamping correctness. `UX-02` width-contract precondition was satisfied; responsive fit rendering (Prompt 14) is now complete.

Prompts 00 through 12 (earlier history): The persistent bottom workspace host (`MapBottomPanel`) is now fully retired: it is no longer rendered in `MapExplorerModalComposition`, and the `MapPanelRailSide` type no longer includes `"bottom"`. The bottom edge of the Map Explorer now contains only `MapStatusBar` (via `MapBottomTimeline` → status bar slot). The `openLegacyBottomTabInRightDock` helper and associated state (`bottomPanelOpen`, `activeBottomPanelTab`, `closeBottomPanel`) have been removed. The right dock remains as the only destination for workspace panel surfaces. `MapBottomPanelScrollBody` and `MapBottomPanelTasksBody` remain as reusable primitives (used in the right dock Tasks body and selection body). The `bottomPanelReturnFocusRef` focus-tracking ref was retained and wired into `handleCloseRightDockHost` for proper focus restoration when the right dock closes. `UX-03` is fully resolved.The persistent bottom workspace host (`MapBottomPanel`) is now fully retired: it is no longer rendered in `MapExplorerModalComposition`, and the `MapPanelRailSide` type no longer includes `"bottom"`. The bottom edge of the Map Explorer now contains only `MapStatusBar` (via `MapBottomTimeline` → status bar slot). The `openLegacyBottomTabInRightDock` helper and associated state (`bottomPanelOpen`, `activeBottomPanelTab`, `closeBottomPanel`) have been removed. The right dock remains as the only destination for workspace panel surfaces. `MapBottomPanelScrollBody` and `MapBottomPanelTasksBody` remain as reusable primitives (used in the right dock Tasks body and selection body). The `bottomPanelReturnFocusRef` focus-tracking ref was retained and wired into `handleCloseRightDockHost` for proper focus restoration when the right dock closes. `UX-03` is fully resolved.

Prompts 00 through 11 (earlier history): The docking model can no longer return a bottom workspace placement: `MapLayerPanelPlacement` is now `"left" | "drawer"` (constrained widths collapse the layer panel into a left-side overlay drawer, never a bottom drawer), and `MapRightDockPanel` is expanded with the migration target IDs (`inspect`, `attributes`, `problems`, `timeline`, `tasks`, `diagnostics`, `selection`, `qa`, `performance`, `collaboration`). Prompt 06 added the typed right-dock route model and mapped every old bottom tab (`problems`, `attributes`, `timeline`, `tasks`, `diagnostics`, `console`, `measurements`) to an explicit right-dock destination. Prompt 07 added the premium `MapRightDockHost` shell, tab rail, header controls, overflow route details, side-drawer presentation, and layout reservation for active right-dock routes. Prompt 08 removed bottom-panel responsibilities from the navigation model and surface inventory. Prompt 09 extracted reusable bottom-panel body primitives. Prompt 10 migrated Problems, QA, Diagnostics, and Performance content/actions into the right dock. Prompt 11 migrated Attributes, Selection, Timeline, Tasks, Collaboration, and Measure content/actions into the right dock, leaving the transitional `MapBottomPanel` shell present but without migrated content bodies until Prompt 12 removes the host.

Prompts 00 through 04 (earlier history): Baseline surface inventory guards now freeze current bottom-panel, floating-panel, canvas-overlay, dialog, drawer, and bottom navigation routes before redesign behavior changes; a Playwright visual baseline harness now captures the current failing Map Explorer states; launch/readiness dialog state is now separated from workspace tab and left-panel state; the opening/readiness surface is now a dedicated premium `MapStartDialog` component rendered in place of the heavy `MapWorkspaceCockpit` whenever the launch dialog is open; and the left-panel `overview-readiness` tab now renders a compact width-aware `MapWorkspaceOverviewSummary` instead of the full launch/readiness cockpit body (the full `MapWorkspaceCockpit` is now reachable only as the navigator-stage overview overlay, never the left panel).

Known current UI problems from the user review:

- `UX-01`: Opening/readiness modal is not premium, has excess spacing, and contains avoidable internal scrolling.
- `UX-02`: Left panel tabs do not fit their resizable widths, and opening modal content must not live in the left panel.
- `UX-03`: Persistent bottom panel must be removed; details should move into a right panel.
- `UX-04`: Persistent floating sketch/tool panels must be consolidated into side panels.
- `UX-05`: Header and top bar must become one hierarchical premium command toolbar with slightly increased height.
- `UX-06`: Bottom edge must be only an advanced status bar.

## Issue Registry

| ID | Status | Owner prompt | Notes |
| --- | --- | --- | --- |
| `UX-01` | `implemented` | Prompt 02, Prompt 03 | Opening dialog state boundary (Prompt 02) plus premium `MapStartDialog` visual redesign (Prompt 03). Left-panel decoupling guard remains in Prompt 04. |
| `UX-02` | `implemented` | Prompt 04, Prompt 13, Prompt 14 | Launch-modal removal from left panel done in Prompt 04 (compact `MapWorkspaceOverviewSummary`). Left panel content contracts defined in Prompt 13 (`mapLeftPanelContracts.ts`). Width/content responsive rendering done in Prompt 14 (CSS container queries on embedded panels, `data-width-band` attribute, responsive-fit tests). `UX-02` fully resolved. |
| `UX-03` | `implemented` | Prompt 05 through Prompt 12 | Docking model forbids bottom placement (Prompt 05), old bottom tabs have typed right-dock targets (Prompt 06), the right-dock host is mounted (Prompt 07), navigation/surface inventory no longer define bottom-panel destinations (Prompt 08), reusable bottom bodies exist (Prompt 09), Prompt 10-11 migrated all content into the right dock, and Prompt 12 removed the persistent bottom workspace host and shell primitive. `UX-03` fully resolved. |
| `UX-04` | `implemented` | Prompt 15, Prompt 16 | Prompt 15 docked Draw and removed the persistent floating sketch sidebar. Prompt 16 moved measurement detail and selection statistics into the right dock, retired the floating measurement card/selection HUD, and kept geodesic caveats and selection routing intact. `UX-04` is fully resolved. |
| `UX-05` | `implemented` | Prompt 17 | `MapTopCommandSurface` now unifies project/search/context and grouped toolbar actions; `MapToolbar` exposes grouped command menus plus visible undo/redo and primary action while keeping palette/search reachability intact. |
| `UX-06` | `implemented` | Prompt 18 | `MapStatusBar` is now the only bottom surface and exposes fixed-width, overflow-safe status segments with click routing into inspect, left-panel, and right-dock destinations. |

## Prompt Status Ledger

| Prompt | Title | Status | Last evidence |
| --- | --- | --- | --- |
| 00 | Baseline Surface Inventory | `implemented` | Baseline inventory doc plus guard tests added; `npm run typecheck` passed. |
| 01 | Visual Baseline And Screenshot Harness | `implemented` | Playwright visual baseline harness added for `IMG-01` through `IMG-04`, plus `UX-05` and `UX-06`; `npm run typecheck` passed. |
| 02 | Launch Dialog State Boundary | `implemented` | Transient `MapStartDialogState` boundary added; launch dismissal and handoffs are deterministic; `npm run typecheck` passed. |
| 03 | Start Dialog Visual Redesign | `implemented` | Dedicated `MapStartDialog` + scoped CSS Module added and wired into `MapExplorerModalComposition`; `npm run typecheck` passed. |
| 04 | Left Panel Launch Decoupling | `implemented` | Left `overview-readiness` tab now renders compact `MapWorkspaceOverviewSummary`; full cockpit removed from left panel. `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` all pass (2 unrelated load-induced import timeouts pass in isolation). |
| 05 | Docking Type Contract Without Bottom Placement | `implemented` | `MapLayerPanelPlacement` is `"left" \| "drawer"`; `getMapDockLayout` never returns bottom; `MapRightDockPanel` expanded. `typecheck` + `map-docking.test.ts` (11 passed) green. |
| 06 | Right Dock State And Route Model | `implemented` | Typed `mapRightDockRoutes` model added; every old bottom tab maps to a right-dock panel; route state is wired through current bottom-tab callbacks. `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` passed. |
| 07 | Right Dock Host Visual Shell | `implemented` | Premium `MapRightDockHost` shell added and wired to active route state; `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` passed. |
| 08 | Navigation And Surface Inventory Migration | `implemented` | Navigation model no longer exposes bottom-panel defaults/priorities/bindings; surface inventory rejects `targetSlot: "bottom-panel"` and migrated IDs target right dock. `typecheck`, prompt targeted tests, `lint:errors`, and full map component tests passed. |
| 09 | Bottom Panel Body Extraction | `implemented` | Reusable bottom body primitives added and wired; `MapBottomPanel` usage remains. `typecheck`, `lint:errors`, and prompt targeted map tests passed. |
| 10 | Problems QA Diagnostics Right Dock Migration | `implemented` | Problems, QA, Diagnostics, and Performance render in right dock; `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` passed. |
| 11 | Attributes Selection Timeline Tasks Right Dock Migration | `implemented` | Attributes, Selection, Timeline, Tasks, Collaboration, and Measure render in right dock; `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` passed. |
| 12 | Remove Bottom Workspace Host And Shell Primitive | `implemented` | `<MapBottomPanel>` removed from composition; `MapPanelRailSide` narrowed to `"left" \| "right"`; `bottomPanelOpen`, `activeBottomPanelTab`, `closeBottomPanel`, `openLegacyBottomTabInRightDock` removed; null content vars removed; `handleCloseRightDockHost` now restores focus; reusable body primitives kept; `MapBottomPanel.test.tsx` rewritten as right-dock body + retirement tests; `map-right-dock-migration.test.ts` and `map-performance-budget.test.ts` source-marker updated. `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` (737 tests) passed. |
| 13 | Left Panel Content Contracts | `implemented` | `mapLeftPanelContracts.ts` added with `MAP_LEFT_PANEL_CONTRACTS` registry covering all 36 `MapSidebarTabId` entries; `clampLeftPanelWidth`, `getLeftPanelContentStrategy`, `getLeftPanelContract` helpers added; `map-left-panel-contracts.test.ts` (17 tests) all pass; `typecheck` and `lint:errors` pass. Full `test -- src/centerpanel/components/map` suite hangs on pre-existing load-induced timeouts (geodesic-measurement, drawing-tools) as noted for Prompt 04; targeted test files (contracts + docking + navigation + surfaceInventory = 50 tests) all pass. |
| 14 | Left Panel Responsive Fit Pass | `implemented` | CSS container queries added to `MapContentsTreePanel.module.css` and `MapCatalogPanel.module.css`; `data-width-band` on sidebar; `map-left-panel-responsive-fit.test.ts` (16 tests); `typecheck`, `lint:errors`, and `test -- src/centerpanel/components/map` (763 tests) passed. `UX-02` fully resolved. |
| 15 | Draw Sketch Annotation Dock Consolidation | `implemented` | `MapDrawingManager` gained `presentation` prop; draw tool activation now opens right dock via `openRightDockPanel("draw")`; floating sidebar suppressed when right dock is active; 765 tests pass. |
| 16 | Measure Selection Inspect Dock Consolidation | `implemented` | `MapMeasurementTool` gained `headless` presentation; context-menu measure opens right dock `Measure`; selection statistics moved from canvas HUD into right-dock `Selection`; `selectionStatsSummary` inventory retargeted to right inspector; `typecheck`, `lint:errors`, and prompt validation tests (83 files, 767 tests) passed. |
| 17 | Unified Top Command Surface | `implemented` | `MapTopCommandSurface` added; `MapToolbar` now exposes grouped top-surface command menus, visible undo/redo, and unified command-bar layout. `typecheck`, `lint:errors`, focused toolbar/top-surface/accessibility regressions, and `geodesic-measurement.test.ts` passed; full `test -- src/centerpanel/components/map` hangs under the current directory-target Vitest invocation. |
| 18 | Advanced Status Bar | `implemented` | `MapStatusBar` now exposes fixed-width operational segments, overflow menu behavior, reduced-motion-safe busy indicators, and status-click routing into inspect/data/layers/right-dock destinations. `typecheck`, `lint:errors`, `MapStatusBarRoutes.test.tsx`, and `map-components.test.ts` pass; the exact prompt command fails under full-suite load because `map-accessibility.test.ts` and `map-layer-management.test.ts` hit their existing 30s import smoke-test timeout, but both files pass when run directly. |
| 19 | Final Polish, Accessibility, Regression, And Ledger Closeout | `blocked` | Revalidated on 2026-06-08 with local dependencies restored. `typecheck`, `lint:errors`, `test:analytics`, `build`, and targeted Playwright repairs pass for the known late-suite drift through `e2e/map-image-export.spec.ts`; full `npm run test:e2e` was not rerun to completion after the last targeted fix. |

## Decision Log

### D-001 - This Is A Redesign Plan, Not A Feature Expansion

Decision: Keep the scope to Map Explorer UI shell and interaction layout.  
Reason: The existing Map Explorer already has many implemented GIS capabilities. The user request is to fix design, hierarchy, modal, panel, toolbar, and status-bar problems without breaking functionality.

### D-002 - No Persistent Bottom Workspace

Decision: Problems, attributes, timeline, tasks, diagnostics, and similar content must move to right dock surfaces.  
Reason: The user explicitly stated there should be no bottom panel, only a rich status bar.

### D-003 - Launch Modal Is Not A Left Panel Body

Decision: The opening/readiness modal must be a dedicated dialog and must not be rendered inside left-panel tabs.  
Reason: Reusing modal content in the left panel caused hierarchy and width/content mismatches.

### D-004 - Floating Tool Panels Become Docked Tool Workspaces

Decision: Persistent drawing, measurement, sketch, diagnostics, or attribute surfaces should dock left/right.  
Reason: Scattered floating panels feel like a prototype and can cover the map.

### D-005 - Preserve Canonical Map Explorer Surface

Decision: Build only on the canonical surface documented by `docs/architecture/map-explorer-canonical-surface.md`.  
Reason: Avoid extending deprecated/non-canonical map component families.

### D-006 - Expand Implementation From 11 Prompts To 20 Prompts

Decision: Split the implementation list into 20 bounded prompts.  
Reason: Code inspection showed the original 11 prompts covered the reported UX issues but bundled high-risk seams together: docking type changes, right-dock routing, navigation/surface inventory migration, bottom-panel content extraction, bottom host removal, and status-bar route replacement. The expanded sequence keeps the same scope while making each migration independently testable.

## File Watchlist

These files are likely to change during implementation:

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/navigation/`
- `src/stores/useMapExplorerStore.ts`
- `src/stores/useMapToolbarPreferencesStore.ts`
- `e2e/` Map Explorer specs

## Do-Not-Break Watchlist

- Import and demo pack entry points.
- Layer stack actions.
- CRS/QA truthfulness.
- Draw and measure state.
- Status bar cursor updates.
- Report handoff payloads.
- Export dialogs and composer.
- Review timeline/audit events.
- Project save/load.
- Keyboard/focus behavior.
- `data-testid` selectors used by e2e tests.

## Completion Report Template

Copy this under the relevant prompt when implemented:

```md
### Prompt XX Completion

- Status:
- Date:
- Files changed:
- UX IDs addressed:
- Behavior preserved:
- Visual states checked:
- Commands run:
- Screenshots:
- Known risks:
- Next prompt:
```

### Prompt 00 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts`
  - `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/08_BASELINE_SURFACE_INVENTORY.md`
  - `map-explorer-premium-redesign-2026-06-05/README.md`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: baseline only; no UX issue marked resolved.
- Inventory summary:
  - Bottom workspace state: `bottomPanelOpen`, `activeBottomPanelTab`, `openBottomPanelTab`, `toggleBottomPanelTab`, `closeBottomPanel`, and `MapBottomPanel` usage in `MapExplorerModalComposition.tsx`.
  - Bottom shell primitives: `MapPanelRailSide` includes `"bottom"` and `MapLayerPanelPlacement` includes `"bottom"`.
  - Bottom inventory targets: `toolbar.qa`, `toolbar.review-timeline`, `toolbar.performance-diagnostics`, `toolbar.measure-results`, `rail.diagnostics.activity`, `rail.qa`, `quick-action.review-problems`, `state.showScientificQAPanel`, `state.showReviewTimeline`, `state.showPerformanceDiagnostics`, `state.attributeTableLayerId`, `state.activeTemporalLayer`, `state.temporalStoreFrameCount`.
  - Persistent floating surfaces: `state.showChoroplethPanel`, `state.showClusterViz`, `state.showHotSpotViz`, `state.showEmergingHotSpotViz`, `state.pointSymbologyLayerId`.
  - Dialog routes: `state.showExternalServiceDialog`, `state.showImportHub`, `state.showExportDialog`, `state.showMapExportDialog`, `state.isFlowDispatchDialogOpen`, `state.pendingImportPreview`, `state.pendingCsvImport`, `state.pendingColumnarImport`.
  - Drawer routes: `state.showWorkflowDrawer`, `state.reportHandoffDraft`.
- High-risk files:
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/mapDocking.ts`
  - `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`
  - `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- Behavior preserved: yes; only tests and operating-pack documentation were changed.
- Visual states checked: none; Prompt 01 owns screenshot harness and visual baselines.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - failed before lint because `eslint` was not found; `node_modules` is absent.
  - `npm run test -- src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts` - failed before tests because `vitest` was not found; `node_modules` is absent.
- Screenshots: none.
- Known risks:
  - Full validation still needs local npm dependencies installed, then `npm run lint:errors` and the targeted `npm run test -- ...` command should be rerun.
  - Prompt 00 intentionally freezes current problematic bottom/floating baselines; later prompts must migrate them instead of expanding them.
- Next prompt: Prompt 01 - Visual Baseline And Screenshot Harness.

### Prompt 01 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `e2e/map-premium-redesign-baseline.spec.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: baseline only; no UX issue marked resolved.
- Behavior preserved: yes; no production source files were changed.
- Visual states checked:
  - Added Playwright screenshot/assertion coverage for `IMG-01` / `UX-01` opening readiness cockpit across 1366x768, 1280x620, 1024x768, and 390x844.
  - Added baseline capture for `IMG-02` / `UX-02` left Data and Layers panels at desktop and narrow widths.
  - Added baseline capture for `IMG-03` / `UX-03` current bottom Diagnostics workspace at desktop and short desktop widths.
  - Added baseline capture for `IMG-04` / `UX-04` current floating Draw and Measure panels.
  - Added command/status baseline coverage for `UX-05` and `UX-06` across the viewport matrix.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - failed before lint because `eslint` was not found; local npm dependencies are absent or incomplete.
  - `npm run test -- src/centerpanel/components/map` - failed before tests because `vitest` was not found; local npm dependencies are absent or incomplete.
- Screenshots:
  - Runtime screenshots were not generated in this run because the prompt validation commands do not run Playwright and the local dependency install is incomplete.
  - The new harness writes baseline screenshots to `e2e/__screens__/map-redesign-baseline-*.png` when `playwright test e2e/map-premium-redesign-baseline.spec.ts` is run.
- Known risks:
  - The new Playwright spec still needs to be executed after dependencies are installed to produce physical PNG baselines and catch selector drift.
  - `npm run lint:errors` and `npm run test -- src/centerpanel/components/map` should be rerun after `eslint` and `vitest` are available.
- Next prompt: Prompt 02 - Launch Dialog State Boundary.

### Prompt 02 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `src/centerpanel/components/map/mapStartDialogState.ts`
  - `src/centerpanel/components/map/__tests__/map-start-dialog-state.test.ts`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/controllers/useMapExplorerLifecycle.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: state boundary for `UX-01`; visual redesign remains Prompt 03.
- Behavior preserved:
  - `navigator` remains available as an overview workspace, but first-open launch state is no longer derived from `workspaceView` or left-panel tab state.
  - Existing import, project load, demo pack, quick action, close, and `Esc` paths still route through existing handlers after dismissing launch state.
  - Readiness numbers remain derived from existing selectors/component props and are not persisted.
- Visual states checked: none; Prompt 02 is state/control-flow only.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - failed before lint because `eslint` was not found; local npm dependencies are absent or incomplete.
  - `npm run test -- src/centerpanel/components/map` - failed before tests because `vitest` was not found; local npm dependencies are absent or incomplete.
- Screenshots: none.
- Known risks:
  - Full lint/test validation still needs dependencies installed, then `npm run lint:errors` and `npm run test -- src/centerpanel/components/map` should be rerun.
  - Prompt 03 must replace the current cockpit-based launch presentation with the dedicated premium `MapStartDialog` visual component.
- Next prompt: Prompt 03 - Start Dialog Visual Redesign.

### Prompt 03 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `src/centerpanel/components/map/MapStartDialog.tsx` (new)
  - `src/centerpanel/components/map/MapStartDialog.module.css` (new)
  - `src/centerpanel/components/map/__tests__/MapStartDialog.test.tsx` (new)
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-01` (premium opening dialog visual redesign).
- What changed:
  - Added a dedicated `MapStartDialog` component with a scoped CSS Module (no Tailwind, tokenized via `var(--syn-*)` and `mapTokens`).
  - Anatomy implemented per `01_OPENING_MODAL_SPEC.md`: 60px header band (brand + project + save-state chip + close), a 2x2 primary decision row (`Import Data` primary, `Open Project`, `Add Demo Pack`, `Continue Empty`), a 5-cell readiness strip (`Layers`, `AOI`, `QA`, `CRS`, `Mode`), a bounded context preview (recommended next action + readiness % + visible-layer count + save state), and a closed-by-default advanced `<details>` disclosure (source-support + CRS caveat + "Open data sources" deep link).
  - One scroll root: only the dialog `.body` scrolls; header, decision row, and footer stay fixed. The source-support content is a collapsed disclosure, not a nested scroll table.
  - Wired to existing callbacks in `MapExplorerModalComposition`: `handleImportRequest`, `handleProjectLoad`, `handleCatalogAddDemoPack(buildDemoPackCatalogInsertion())`, `closeMapStartDialog("continue")`, `handleMapExplorerCloseRequest`, and a new `handleStartDialogOpenSources` (dismiss + open import/data-source browser).
  - The navigator stage now renders `MapStartDialog` when `startDialogOpen` and keeps `MapWorkspaceCockpit` only for the non-launch `workspaceView === "navigator"` overview. The `data-map-start-dialog-state` / `-reason` attributes on the stage container are preserved.
- Behavior preserved:
  - Import, open-project, demo-pack, and continue paths route through the same handlers used elsewhere; each handler already dismisses the launch dialog with the correct deterministic `lastAction`.
  - `Esc` / modal close still flow through `handleMapExplorerEscapeRequest` / `handleMapExplorerCloseRequest` (parent modal owns the focus trap and focus return); the dialog autofocuses its primary action on mount.
  - Truthful state: unknown CRS reads "Unknown", unchecked QA reads "Unchecked", no-project reads "Local-only"; disabled `Open Project` shows "Select a project first".
- Visual states checked: none rendered (no Playwright run in this prompt); layout sizing follows the spec breakpoints (desktop `min(960px, 100vw-96px)`, short desktop `max-height: 720px` → `100vh-48px`, narrow `<=640px` → single-column tiles + 2-col readiness).
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - could not run; `eslint` is not installed in this environment (`'eslint' is not recognized`).
  - `npm run test -- src/centerpanel/components/map` - could not run; `vitest` is not installed (`Cannot find package 'vitest'`). A new `MapStartDialog.test.tsx` was added and must be run once dependencies are present.
- Screenshots: none.
- Known risks:
  - `npm run lint:errors` and `npm run test -- src/centerpanel/components/map` (including the new `MapStartDialog.test.tsx`) still need to be rerun after dev dependencies are installed.
  - Prompt 04 must remove the full launch/readiness modal body from left-panel render paths and confirm the left panel never renders `MapStartDialog` or the full cockpit body.
- Next prompt: Prompt 04 - Left Panel Launch Decoupling.

### Prompt 04 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceOverviewSummary.tsx` (new)
  - `src/centerpanel/components/map/MapWorkspaceOverviewSummary.module.css` (new)
  - `src/centerpanel/components/map/__tests__/MapWorkspaceOverviewSummary.test.tsx` (new)
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-02` (launch-modal removal from the left panel; width/content contracts and responsive fit remain Prompt 13/14).
- Root cause found: selecting the **Overview** activity in the activity rail (`handleSelectMapActivity` → case `"overview"`) sets `workspaceView = "explore"` + `showLayerPanel(true)` + `workbenchSidebarTab = "overview-readiness"`, so the left workbench sidebar's `overview-readiness` tab rendered the full `MapWorkspaceCockpit` (`overviewCockpitElement`, the launch/readiness modal body) inside the resizable left panel — the exact `UX-02`/`IMG-02` leak.
- What changed:
  - Added a compact, width-aware `MapWorkspaceOverviewSummary` with a scoped CSS Module (container-query aware, single `.body` scroll root, tokenized `var(--syn-*)`, no Tailwind). It shows: readiness score + tone badge + narrative, a primary "Next action" button, a compact Map-state signal list (Project, Layers, AOI, QA, CRS, Save state), a 3-way workspace mode rail, and a small quick-action grid.
  - Repointed `overviewCockpitElement` (the only left-panel `overview-readiness` render) from `MapWorkspaceCockpit` to `MapWorkspaceOverviewSummary`. The full `MapWorkspaceCockpit` is now used ONLY by the navigator-stage overview overlay (canvas-centered), never the left panel.
- Behavior preserved (no import/demo/load/continue callback lost):
  - The summary keeps `onQuickAction={handleMapQuickAction}` (so Import Data, Review Layers, Draw AOI, Measure, Save Project, Export remain reachable) and `onSelectView={handleSetWorkspaceView}` (Navigator/Explore/Analyze, including the path to the full navigator-stage cockpit).
  - Demo-pack and project-load entry points are unchanged — they live in the Data activity / toolbar and the launch `MapStartDialog`, not this overview tab, and were not present on the old left-panel cockpit either.
  - Analysis-recommendation actions, sync status, and workflow-ready counts remain on the navigator-stage full cockpit, so no callback is globally removed.
  - Truthful state: unknown CRS → "Unknown", unchecked QA → "Unchecked", no project → "Local-only".
- Tests:
  - New `MapWorkspaceOverviewSummary.test.tsx` asserts the compact summary renders the map-state signals, fires `onQuickAction("import-data")` for the empty-state primary action, fires `onSelectView("navigator")` for the mode rail, AND that the left panel never renders full-cockpit-only sections ("Delivery Sequence", "Integration Rail", "Workflow Control", "Readiness Cockpit", `map-workspace-context-strip`) — the launch-content-absence guard.
- Visual states checked: none rendered (no Playwright in this prompt); layout uses a container query at `<=360px` to collapse the quick/mode grids to one column for narrow left-panel widths.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed (exit 0). NOTE: dev dependencies are now installed in this environment, unlike Prompts 00-03 where `eslint`/`vitest` were absent.
  - `npm run test -- src/centerpanel/components/map` - 722/724 passed. The 2 failures are `await import("../../MapExplorerModal")` smoke tests in `map-accessibility.test.ts` and `map-layer-management.test.ts` that timed out at 30s under heavy parallel load (full-dir run: transform 127s / import 306s). Both pass in isolation (`map-accessibility.test.ts` → 34/34) and are unrelated to this change.
- Screenshots: none.
- Known risks:
  - The 2 import-smoke timeouts are load/flakiness related; rerun in isolation or with a higher `testTimeout` to confirm green in CI.
  - Prompt 13 (left-panel content contracts) and Prompt 14 (responsive fit) still own the full `UX-02` resolution for Data/Layers/Catalog/etc.; this prompt only removed the launch-modal body from the left panel.
- Next prompt: Prompt 05 - Docking Type Contract Without Bottom Placement.

### Prompt 05 Completion

- Status: `implemented`
- Date: 2026-06-05
- Files changed:
  - `src/centerpanel/components/map/mapDocking.ts`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/__tests__/map-docking.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` (docking-type contract; right dock host/routes/content migration remain Prompts 06-12).
- What changed:
  - `MapLayerPanelPlacement` changed from `"left" | "bottom"` to `"left" | "drawer"`. The `"bottom"` member is gone, so a persistent bottom workspace placement is now structurally impossible (compile-time guarantee).
  - `getMapDockLayout` compact-width branch now returns `"drawer"` (a left-side overlay drawer) instead of `"bottom"`. `leftInset`/`rightInset` are unchanged (drawer overlays the canvas at `overlayMargin`, it does not reserve a lane), so existing right panels still open exactly as before.
  - `MapRightDockPanel` expanded with the migration target IDs: `inspect`, `attributes`, `problems`, `timeline`, `tasks`, `diagnostics`, `selection`, `qa`, `performance`, `collaboration` (added alongside existing `pins`, `draw`, `measure`, `scientificQA`, `report`, `workflow`, `urbanMethod`).
  - `getRightPanelWidth` refactored to a `Record<MapRightDockPanel, number>` default-width table so any future panel ID is a compile error until a width is provided. All widths are clamped to `[300, 520]`.
  - `MapExplorerModalComposition` layer-panel `MapPanelRail` now uses `side="left"` directly (the old `layerPanelPlacement === "bottom"` ternary was a dead/no-overlap comparison after the type change). `resizable` still keys off `=== "left"` (the overlay drawer is not resizable).
- Behavior preserved:
  - `compactDock` is still computed and still drives the existing right-panel `presentation` and `useMapPanelCommands` logic — only the layer-panel placement changed from bottom to a left overlay drawer.
  - All legacy right panels (pins/draw/measure/scientificQA/report/workflow/urbanMethod) still open with identical widths and insets; existing docking tests for those still pass.
  - `MapPanelRail` still supports a `side="bottom"` prop in its own type — that primitive removal is Prompt 12; this prompt only stops the docking model from ever requesting it for the workspace.
- Tests:
  - `map-docking.test.ts`: the two former "bottom drawer" tests now assert `layerPanelPlacement === "drawer"`; added a matrix test asserting placement is `left`/`drawer` (never bottom) across desktop/short-desktop/tablet/narrow widths (1366, 1280, 1024, 768, 420, 320); added a test asserting all 10 new right-dock IDs are accepted and each reserves a clamped right lane.
- Visual states checked: none (logic/type-contract prompt; no Playwright run).
- Commands run (prompt `validation.commands`):
  - `npm run typecheck` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/map-docking.test.ts` - passed (11/11). Also reran `useMapPanelLayout.test.tsx` (3/3) as a consumer sanity check.
- Screenshots: none.
- Known risks / residuals (for later prompts, not regressions):
  - Several right inspectors still pass `presentation={compactDock ? "bottom-drawer" : "right-rail"}` in `MapExplorerModalComposition` (draw/measure/QA/etc.). That is a per-panel presentation prop, not a `MapDockLayout` placement, and belongs to the right-dock host + bottom-host-removal work (Prompts 07/09-12). It is intentionally untouched here so this prompt stays a pure docking-type contract change.
  - The new right-dock IDs (`inspect`, `attributes`, `problems`, `timeline`, `tasks`, `diagnostics`, `selection`, `qa`, `performance`, `collaboration`) are type-level only so far; they get a route model and host in Prompts 06-07 and real content in Prompts 09-11.
- Next prompt: Prompt 06 - Right Dock State And Route Model.

### Prompt 06 Completion

- Status: `implemented`
- Date: 2026-06-06
- Files changed:
  - `src/centerpanel/components/map/mapRightDockRoutes.ts` (new)
  - `src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts` (new)
  - `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
  - `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/index.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` route/state groundwork. The bottom workspace is not visually removed yet; Prompt 07 adds the host, Prompts 09-12 migrate/remove content.
- What changed:
  - Added a typed `mapRightDockRoutes` model with exhaustive right-dock panel definitions, serializable `MapRightDockRoute` / `MapRightDockRouteState`, and open/switch/close route-state helpers.
  - Added explicit old-bottom-tab mapping: `problems -> problems`, `attributes -> attributes`, `timeline -> timeline`, `tasks -> tasks`, `diagnostics -> diagnostics`, `console -> diagnostics`, `measurements -> measure`.
  - Extended navigation bindings with `defaultRightDockPanelId`, `rightDockPanelPriority`, and `rightDockPanelId` while preserving existing `bottomPanelTabId` fields for later migration prompts.
  - Wired `MapExplorerModalComposition` bottom-tab/status/activity callbacks through the route helper and exposed transitional `data-map-right-dock-route*` attributes on the bottom timeline shell. The route state does not reserve a right lane or render an empty host yet.
- Behavior preserved:
  - Existing bottom panel content remains mounted and functional until body extraction/right-dock migration prompts own it.
  - Current focus return behavior for bottom-panel open/close remains through `bottomPanelReturnFocusRef`.
  - Start-dialog dismissal and navigator-to-explore handoff remain intact when bottom-tab routes are opened.
- Visual states checked: none; this prompt is route/state only and intentionally does not introduce the right dock host.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map` - passed (79 files, 731 tests).
  - Extra targeted sanity: `npm run test -- src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts` - passed (2 files, 15 tests).
- Screenshots: none.
- Known risks / residuals:
  - The new route state is transitional until Prompt 07 provides the right-dock host and Prompts 09-12 move/remove bottom content.
  - Navigation surface inventory still contains `targetSlot: "bottom-panel"` entries by design; Prompt 08 owns replacing those inventory destinations.
- Next prompt: Prompt 07 - Right Dock Host Visual Shell.

### Prompt 07 Completion

- Status: `implemented`
- Date: 2026-06-06
- Files changed:
  - `src/centerpanel/components/map/MapRightDockHost.tsx` (new)
  - `src/centerpanel/components/map/MapRightDockHost.module.css` (new)
  - `src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` (new)
  - `src/centerpanel/components/map/controllers/useMapPanelLayout.ts`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/index.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` right-dock host shell groundwork. The persistent bottom content host remains until Prompts 09-12 migrate/remove it.
- What changed:
  - Added a shared `MapRightDockHost` with premium header, active panel title, state label, close/collapse controls, overflow route-details popover, tab rail for all right-dock panel IDs, and a single body scroll region.
  - Added scoped CSS Module styling for desktop right dock and constrained-width `side-drawer` presentation; no bottom-drawer presentation is introduced by the new host.
  - Wired active right-dock routes into `useMapPanelLayout`, so routed panels reserve right-side canvas inset and do not overlap map controls.
  - Mounted `MapRightDockHost` inside `MapExplorerModalComposition` for active routes, with tab switching through typed `createMapRightDockRoute` / `switchMapRightDockRouteState`.
  - Exported the host and added focused tests covering shell landmarks, migrated panel tabs, tab switching, overflow details, collapse/close controls, and side-drawer mode.
- Behavior preserved:
  - Existing bottom-panel content remains mounted and functional; this prompt does not extract or migrate tab bodies.
  - Existing report, inspector, QA, workflow, draw, measure, and pin surfaces are not moved in this prompt.
  - Bottom-panel close still clears the transitional right-dock route state; route host close/collapse only affects the route shell.
- Visual states checked: no Playwright/screenshots in this prompt; component/layout behavior is covered by unit tests and CSS module constraints.
- Commands run:
  - `npm run typecheck` - passed (rerun after the lint fix).
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map` - passed (80 files, 735 tests). Existing stderr warnings remain unrelated: React act warnings in older toolbar/review tests and duplicate Three.js import warnings in existing map tests.
- Screenshots: none.
- Known risks / residuals:
  - The right dock shell is intentionally body-empty until Prompt 09-11 migrate Problems/QA/Diagnostics/Attributes/Timeline/Tasks/Selection/Measurements content.
  - Navigation surface inventory still contains `targetSlot: "bottom-panel"` entries by design; Prompt 08 owns replacing those inventory destinations.
  - Several legacy right-side panels still use their older `bottom-drawer` compact presentation prop; Prompt 12 owns final bottom workspace host/shell primitive removal.
- Next prompt: Prompt 08 - Navigation And Surface Inventory Migration.

### Prompt 08 Completion

- Status: `implemented`
- Date: 2026-06-06
- Files changed:
  - `src/centerpanel/components/map/mapLegacyBottomTabs.ts` (new)
  - `src/centerpanel/components/map/mapRightDockRoutes.ts`
  - `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
  - `src/centerpanel/components/map/navigation/index.ts`
  - `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
  - `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`
  - `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`
  - `src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts`
  - `src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` navigation/surface-inventory migration groundwork.
- What changed:
  - Removed `defaultBottomPanelTabId`, `bottomPanelTabPriority`, `bottomPanelTabId`, and `MAP_BOTTOM_PANEL_TAB_DEFINITIONS` from the navigation model/barrel.
  - Added `mapLegacyBottomTabs.ts` so the transitional `MapBottomPanel` and `mapRightDockRoutes` can keep old tab-name compatibility without making navigation depend on bottom-panel concepts.
  - Removed `"bottom-panel"` from `MapSurfaceTargetSlot` and moved the former bottom inventory targets (`toolbar.qa`, `toolbar.review-timeline`, `toolbar.performance-diagnostics`, `toolbar.measure-results`, `rail.diagnostics.activity`, `rail.qa`, `quick-action.review-problems`, `state.showScientificQAPanel`, `state.showReviewTimeline`, `state.showPerformanceDiagnostics`, `state.attributeTableLayerId`, `state.activeTemporalLayer`, `state.temporalStoreFrameCount`) to `right-inspector` targets.
  - Replaced old bottom-tab-derived binding logic with direct `rightDockPanelId` routing for problems, attributes, timeline, diagnostics, performance, measure, workflow, report, draw, pins, selection, collaboration, and urban method contexts.
- Behavior preserved:
  - Runtime bottom-panel rendering is intentionally still present for Prompt 09-12 migration work; only navigation/inventory responsibilities changed.
  - Legacy bottom-tab-to-right-dock mapping still exists in `mapRightDockRoutes` for transitional callbacks and focus-return paths.
  - No CRS, QA, provenance, import/export, layer, draw, measure, or map-state behavior was changed.
- Visual states checked: none; this prompt is navigation/inventory routing only.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts` - passed (2 files, 22 tests).
  - Extra: `npm run lint:errors` - passed.
  - Extra: `npm run test -- src/centerpanel/components/map` - passed (80 files, 734 tests).
- Screenshots: none.
- Known risks / residuals:
  - The persistent `MapBottomPanel` host and its content bodies remain by design; Prompt 09 owns body extraction and Prompts 10-12 own content migration/removal.
  - Existing unrelated worktree entries were left untouched (`package-lock.json` modified and an image deletion under the operating-pack image folder).
- Next prompt: Prompt 09 - Bottom Panel Body Extraction.

### Prompt 09 Completion

- Status: `implemented`
- Date: 2026-06-06
- Files changed:
  - `src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx` (new)
  - `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
  - `src/centerpanel/components/map/bottom/index.ts`
  - `src/centerpanel/components/map/index.ts`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` body-extraction groundwork only; bottom host removal remains Prompt 12.
- What changed:
  - Extracted `MapBottomPanelActiveBody`, `MapBottomPanelScrollBody`, and `MapBottomPanelTasksBody` from the bottom panel shell into `MapBottomPanelBodies.tsx`.
  - Kept `MapBottomPanel` mounted and focused on shell concerns: visibility, tab header, keyboard navigation, close handling, and active tab state.
  - Reused `MapBottomPanelScrollBody` for bottom problems and review-sidebar problems content in `MapExplorerModalComposition`.
  - Exported the new body primitives from `bottom/index.ts` and the map component barrel for later right-dock migration prompts.
- Behavior preserved:
  - `MapBottomPanel` still renders the same five visible tabs and preserves the existing `data-testid="map-bottom-panel"` and `map-bottom-panel-content-*` selectors.
  - Heavy `MapAttributeWorkflowPanel` and `MapPerformanceDiagnosticsPanel` remain guarded by `bottomAttributesTabActive` / `bottomDiagnosticsTabActive`.
  - No CRS, QA, provenance, task, diagnostics, attribute, timeline, or map-state data source changed.
- Visual states checked: none; extraction-only prompt with no intended visual behavior change.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx src/centerpanel/components/map` - passed (80 files, 735 tests).
  - Extra focused sanity: `npm run test -- src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx` - passed (1 file, 6 tests).
- Screenshots: none.
- Known risks / residuals:
  - `MapBottomPanel` still renders as a persistent bottom workspace by design; Prompt 10 and Prompt 11 migrate content to right dock, Prompt 12 removes the host.
  - Console and measurement legacy routes remain route-level compatibility concepts; there was no active `MapBottomPanel` console/measurements body to extract in this prompt.
  - Existing unrelated worktree entries were left untouched (`package-lock.json` modified and an image deletion under the operating-pack image folder).
- Next prompt: Prompt 10 - Problems QA Diagnostics Right Dock Migration.

### Prompt 10 Completion

- Status: `implemented`
- Date: 2026-06-06
- Files changed:
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/ScientificQAPanel.tsx`
  - `src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts` (new)
  - `src/centerpanel/components/map/__tests__/map-performance-budget.test.ts`
  - `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` diagnostics/problem bottom-area migration.
- What changed:
  - Added right-dock body rendering for `Problems`, `scientificQA`/`QA`, `Diagnostics`, and `Performance` routes inside `MapRightDockHost`.
  - Routed toolbar QA, activity rail QA/diagnostics, quick-action review problems, task lens QA/diagnostics, status QA/CRS, status performance, worker retry, and render-budget details into right-dock routes.
  - Added embedded `ScientificQAPanel` presentation so full scientific QA blockers, CRS caveats, layer badges, issue details, and recovery actions can live inside the dock body.
  - Added a render-budget banner details action that opens the Performance right dock.
  - Stopped mounting diagnostics content in the bottom panel; bottom problems content is now null, and bottom tab clicks for Problems/Diagnostics redirect to the right dock.
  - Updated source/route tests for the new right-dock routing contract.
- Behavior preserved:
  - CRS declaration, layer inspection, geometry repair, export-readiness, worker retry, render warnings, source caveats, and QA blocker paths still call the same underlying handlers.
  - Attributes, timeline, collaboration, tasks, selection, and measurements remain transitional bottom/review surfaces for Prompt 11.
  - The `MapBottomPanel` shell remains mounted only for remaining migration work; Prompt 12 owns final removal.
- Visual states checked: no screenshots in this prompt; behavior is covered by source-contract, component, type, lint, and map test validation.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed after removing the now-unused `toggleBottomPanelTab` helper.
  - `npm run test -- src/centerpanel/components/map` - passed (81 files, 736 tests).
- Screenshots: none.
- Known risks / residuals:
  - The right dock now has migrated QA/diagnostics bodies, but Attributes/Selection/Timeline/Tasks/Measurements still need Prompt 11 migration.
  - `MapBottomPanel` still exists as a transitional shell until Prompt 12.
  - Existing unrelated worktree entries were left untouched (`package-lock.json` modified and an image deletion under the operating-pack image folder).
- Next prompt: Prompt 11 - Attributes Selection Timeline Tasks Right Dock Migration.

### Prompt 11 Completion

- Status: `implemented`
- Date: 2026-06-07
- Files changed:
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/MapMeasurementTool.tsx`
  - `src/centerpanel/components/map/MapSelectionTools.tsx`
  - `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts`
  - `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`
  - `src/centerpanel/components/map/__tests__/map-performance-budget.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-03` remaining bottom-tab content migration.
- What changed:
  - Added right-dock bodies for `Attributes`, `Selection`, `Timeline`, `Tasks`, `Collaboration`, and `Measure` inside `MapRightDockHost`.
  - Routed attribute-table opens, derived attribute tables, selected-feature status, review timeline, collaboration status, task tab clicks, measurement status, and measure tool activation into right-dock routes.
  - Added embedded presentations for `MapMeasurementTool` and `MapSelectionTools`; added `initialTab` support to `MapReviewTimelinePanel` so the Collaboration route opens the collaboration sub-surface.
  - Changed the transitional bottom-tab helper so it maps legacy tab clicks to right-dock routes and no longer opens the bottom panel for migrated content.
- Behavior preserved:
  - Attribute workflow lazy mounting is preserved by `rightAttributesDockActive`.
  - Selection tools still use the existing query planner, rectangle/lasso drag state, AOI handoff, export, focus, and clear handlers.
  - Review timeline still uses the existing audit session, event status updates, revert command path, and local-only collaboration snapshot.
  - Measurement map-layer synchronization, geodesic assumptions, unit switching, copy/remove/clear actions, and CRS caveats are preserved.
- Visual states checked: no screenshots in this prompt; right-dock body routing is covered by source-contract, status-route, type, lint, and map component tests.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map` - initially failed on an overly literal source-contract assertion, then passed after the assertion was corrected (81 files, 737 tests).
- Screenshots: none.
- Known risks / residuals:
  - `MapBottomPanel` is still mounted as a transitional shell with migrated content bodies set to right-dock routes; Prompt 12 owns removing the persistent bottom workspace host and shell primitive.
  - Draw/sketch floating-panel consolidation remains Prompt 15; measure/selection final floating-detail cleanup remains Prompt 16.
  - Existing unrelated worktree entries were left untouched (`package-lock.json` modified and an image deletion under the operating-pack image folder).
- Next prompt: Prompt 12 - Remove Bottom Workspace Host And Shell Primitive.

## Handoff Template

Use this when handing work to another agent:

```md
### Handoff

- Current prompt:
- Last completed prompt:
- Active branch:
- Files touched in last step:
- Tests passed:
- Tests not run:
- Visual states still failing:
- Blocking question:
```

## Update Rules

- Update this ledger after every prompt.
- Keep old completion entries; append new notes.
- Use absolute dates.
- Do not claim `verified` without naming commands or visual checks.
- If functionality was intentionally changed, document the previous behavior, new behavior, and why it is safe.

### Prompt 16 Completion

- Status: `implemented`
- Date: 2026-06-07
- Files changed:
  - `src/centerpanel/components/MapMeasurementTool.tsx`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/useMapAoiDispatch.ts`
  - `src/centerpanel/components/map/navigation/mapSurfaceInventory.ts`
  - `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`
  - `src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts`
  - `src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts`
  - `src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-04` measure/selection dock consolidation.
- What changed:
  - Added `presentation="headless"` to `MapMeasurementTool` so geodesic overlays and measurement state stay alive without showing a floating card when the right dock is closed.
  - Routed context-menu measurement startup into right-dock `Measure` and removed the remaining visible floating measurement panel from `MapExplorerModalComposition`.
  - Moved selection quick statistics out of the canvas HUD and into the right-dock `Selection` body; running statistics now opens the dock automatically.
  - Cleared stale `selectionStatsSummary` state when selections change or clear, and added per-layer attribute handoff buttons so Selection and Attributes stay aligned.
  - Retargeted `selectionStatsSummary` in `mapSurfaceInventory.ts` from a canvas overlay to a right-inspector panel flag.
- Behavior preserved:
  - Geodesic distance/area caveats, units, active tool state, clipboard export, and completed measurement labels still come from the existing `MapMeasurementTool` logic.
  - Selection rectangle/lasso/filter behavior, AOI export/focus actions, and attribute workflow routing still use the existing query planner and store actions.
  - No new persistent floating panel was introduced; only transient labels/context menus remain anchored to map geometry.
- Visual states checked: no screenshots in this prompt; the scope is covered by source-contract, inventory, navigation, geodesic, and full map-component validation.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts src/centerpanel/components/map` - passed (83 files, 767 tests).
- Screenshots: none.
- Known risks / residuals:
  - The separate `LazyMapInspectorHost` layer inspector still exists alongside the right-dock host; Prompt 17 remains focused on the top command surface rather than inspector unification.
  - Existing unrelated worktree entries were left untouched.
- Next prompt: Prompt 17 - Unified Top Command Surface.

### Prompt 17 Completion

- Status: `implemented`
- Date: 2026-06-07
- Files changed:
  - `src/centerpanel/components/map/MapTopCommandSurface.tsx`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/index.ts`
  - `src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx`
  - `src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx`
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-05`.
- What changed:
  - Added `MapTopCommandSurface` so the Map Explorer header now presents one unified command surface with project name, workspace/lens context, save-state chip, place search, scope chip, CRS caveat chip, active-layer chip, bookmarks, and close control.
  - Reworked `MapToolbar` to expose grouped Data / Explore / Analyze / Publish / System command menus, keep the contextual primary action, keep the command palette searchable, and show undo/redo directly when they are available.
  - Preserved command-palette taxonomy, disabled reasons, processing-tool palette behavior, and grouped overflow while keeping toolbar actions routed to left/right dock surfaces instead of reintroducing persistent floating panels.
- Behavior preserved:
  - Existing task-lens switching, command-palette keyboard shortcut, import/export/report/save flows, and right-dock routing still use the existing handlers in `MapExplorerModalComposition`.
  - Place search still uses the existing `MapSearchBar` behavior and continues to update workflow geocoding context from the top surface.
- Visual states checked:
  - Source-level coverage now exercises the unified top command surface, grouped toolbar menus, barrel exports, and command accessibility wiring.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map` - could not be completed; the directory-target Vitest invocation consistently hangs in this environment before advancing beyond the initial queued file state.
  - `npm run test -- src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/map-components.test.ts` - passed (81 tests).
  - `npm run test -- src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/map-components.test.ts` - passed (115 tests).
- Screenshots: none.
- Known risks / residuals:
  - The exact prompt validation directory run still needs follow-up if the Vitest directory-target hang is expected to be eliminated rather than documented.
  - Prompt 18 still owns the bottom-edge status-bar redesign and overflow behavior for `UX-06`.
- Next prompt: Prompt 18 - Advanced Status Bar.

### Prompt 18 Completion

- Status: `implemented`
- Date: 2026-06-07
- Files changed:
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`
  - `map-explorer-premium-redesign-2026-06-05/05_IMPLEMENTATION_PROMPTS.json`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
- UX IDs addressed: `UX-06`.
- What changed:
  - Rebuilt `MapStatusBar` into a dense segmented bottom status surface with fixed-width truncation, semantic tones, reduced-motion-safe busy indicators, and overflow routing so the lowest edge stays operational instead of expanding into a panel host.
  - Added status segments for cursor, zoom/scale, project/save, mode/lens, layers, selection, sketch/AOI, measure, units, CRS, QA, review, tasks, performance, sync/collaboration, and basemap attribution.
  - Wired segment clicks to existing inspector, data, layers, draw, measure, selection, tasks, timeline, collaboration, diagnostics, and CRS/QA handlers in `MapExplorerModalComposition`.
- Behavior preserved:
  - The bottom edge remains status-only; no legacy bottom workspace affordance was reintroduced.
  - Existing right-dock, inspector, project, and QA handlers remain the source of truth; the status bar only routes into those surfaces.
- Visual states checked:
  - Inline and overflow segment rendering, reduced-motion persistence feedback, and status-route regression coverage all execute without clipping or layout-host mutation in prompt-targeted tests.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test -- src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx src/centerpanel/components/map/__tests__/map-components.test.ts` - passed (66 tests).
  - `npm run test -- src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx src/centerpanel/components/map` - failed under the full 84-file suite load because `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` and `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` hit their 30s `MapExplorerModal` import smoke-test timeout.
  - `npm run test -- src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts` - passed (85 tests), indicating the exact prompt-command failure is tied to full-suite load rather than the prompt-18 status-bar changes.
- Screenshots: none.
- Known risks / residuals:
  - The exact prompt validation command still needs follow-up if the full map-suite import smoke-test timeout is expected to be eliminated rather than documented.
  - Prompt 19 still owns final polish, responsive visual matrix, and repo-level regression closeout.
- Next prompt: Prompt 19 - Final Polish, Accessibility, Regression, And Ledger Closeout.

### Prompt 19 Completion

- Status: `blocked`
- Date: 2026-06-08
- Files changed:
  - `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
  - `e2e/accessibility-audit.spec.ts`
  - `e2e/map-catalog.spec.ts`
  - `e2e/map-ai-guardrails-p58.spec.ts`
  - `e2e/map-choropleth.spec.ts`
  - `e2e/map-columnar-io.spec.ts`
  - `e2e/map-contents.spec.ts`
  - `e2e/map-context-and-geojson.spec.ts`
  - `e2e/map-csv-kml-gpx-import.spec.ts`
  - `e2e/map-explorer-stability.spec.ts`
  - `e2e/map-external-service.spec.ts`
  - `e2e/map-figure-composer.spec.ts`
  - `e2e/map-image-export.spec.ts`
  - `map-explorer-premium-redesign-2026-06-05/README.md`
  - `map-explorer-premium-redesign-2026-06-05/AGENT_NEXT_PROMPT.md`
  - `map-explorer-premium-redesign-2026-06-05/ARCHIVE_INDEX.md`
  - `map-explorer-premium-redesign-2026-06-05/07_ANTI_AMNESIA_LEDGER.md`
  - `docs/archive/development-plans/README.md`
- UX IDs addressed: closeout/verification only; no issue was promoted to `verified`.
- What changed:
  - The top command-surface close button now always closes the Map Explorer modal, while the launch dialog keeps its own dedicated close control.
  - Workspace entry routes now dismiss the launch dialog when the user commits into real work surfaces (activity rail, style/analyze/data/layers helpers, and related command paths), which fixed the stuck launch-overlay behavior seen in multiple Playwright flows.
  - Backward-compatible accessible aliases were added for the redesigned activity rail and command surface so legacy Playwright locators for explore/analyze/import/export/advanced-command surfaces still resolve while the premium UI stays visually unchanged.
  - Prompt 19 closeout specs that had drifted away from the redesigned shell were updated to target stable activity buttons, docked panels, and current store-level outcomes instead of retired toolbar labels or removed layer-row contracts.
- Behavior preserved:
  - No bottom workspace host or floating tool panel was reintroduced during closeout.
  - Existing Map Explorer shell, right-dock routing, and status-bar interaction surfaces remain the canonical redesign endpoints.
- Visual states checked:
  - Prompt-targeted accessibility, Scene 3D, catalog, AI guardrails, and choropleth Playwright diagnostics were rerun after the closeout fixes and now pass.
- Commands run:
  - `npm run typecheck` - passed.
  - `npm run lint:errors` - passed.
  - `npm run test:analytics` - passed.
  - `npm run build` - passed (large chunk warnings remain, but the build completed successfully).
  - `npm run test:e2e` - rerun progressed through the first 50 tests after closeout fixes, then exposed additional late-suite drift. Those known failures were repaired with targeted reruns instead of repeatedly rerunning passing specs.
  - `npx playwright test e2e/accessibility-audit.spec.ts --grep "map modal exposes skip navigation, keyboard map focus, close control, and no serious axe issues"` - passed.
  - `npx playwright test e2e/map-3d-design.spec.ts` - passed.
  - `npx playwright test e2e/map-ai-guardrails-p58.spec.ts` - passed.
  - `npx playwright test e2e/map-catalog.spec.ts` - passed.
  - `npx playwright test e2e/map-choropleth.spec.ts` - passed.
  - `npx playwright test e2e/map-columnar-io.spec.ts` - passed.
  - `npx playwright test e2e/map-contents.spec.ts` - passed.
  - `npx playwright test e2e/map-context-and-geojson.spec.ts` - passed.
  - `npx playwright test e2e/map-csv-kml-gpx-import.spec.ts` - passed.
  - `npx playwright test e2e/map-explorer-stability.spec.ts` - passed.
  - `npx playwright test e2e/map-external-service.spec.ts e2e/map-figure-composer.spec.ts e2e/map-image-export.spec.ts` - external service and figure composer passed; image export exposed one final retired toolbar route.
  - `npx playwright test e2e/map-image-export.spec.ts` - passed after rerouting the test to Publish Figure and the current `Map image export` action.
- Screenshots:
  - Playwright failure artifacts are transient local outputs under `test-results/` and were superseded by targeted reruns for the known failed specs.
- Known risks / residuals:
  - Full redesign closeout remains blocked until the full `npm run test:e2e` gate completes green after the targeted fixes.
  - Because the closeout gate is still blocked, `UX-01` through `UX-06` remain `implemented` rather than `verified` in this archive.
- Next prompt: none; this pack is archived as historical material with Prompt 19 blocked.
