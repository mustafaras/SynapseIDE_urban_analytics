# 07 - Anti-Amnesia Ledger

Status: Active  
Last updated: 2026-06-06  
Purpose: Keep redesign state resumable without rereading the full repo.

## Current Snapshot

Prompts 00 through 07 have been implemented. The docking model can no longer return a bottom workspace placement: `MapLayerPanelPlacement` is now `"left" | "drawer"` (constrained widths collapse the layer panel into a left-side overlay drawer, never a bottom drawer), and `MapRightDockPanel` is expanded with the migration target IDs (`inspect`, `attributes`, `problems`, `timeline`, `tasks`, `diagnostics`, `selection`, `qa`, `performance`, `collaboration`). Prompt 06 added the typed right-dock route model and mapped every old bottom tab (`problems`, `attributes`, `timeline`, `tasks`, `diagnostics`, `console`, `measurements`) to an explicit right-dock destination. Prompt 07 added the premium `MapRightDockHost` shell, tab rail, header controls, overflow route details, side-drawer presentation, and layout reservation for active right-dock routes while preserving the current bottom-panel content host until Prompt 09-12 migration work.

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
| `UX-02` | `in_progress` | Prompt 04, Prompt 13, Prompt 14 | Launch-modal removal from left panel done in Prompt 04 (compact `MapWorkspaceOverviewSummary`). Width/content contracts (Prompt 13) and responsive fit (Prompt 14) remain. |
| `UX-03` | `in_progress` | Prompt 05 through Prompt 12 | Docking model now forbids bottom placement (Prompt 05), old bottom tabs now have typed right-dock route targets (Prompt 06), and the premium right-dock host shell is mounted for active routes (Prompt 07). Navigation inventory migration, content migration, and bottom workspace removal remain (Prompts 08-12). |
| `UX-04` | `pending` | Prompt 15, Prompt 16 | Draw/sketch/annotation plus measure/selection consolidation. |
| `UX-05` | `pending` | Prompt 17 | Unified top command surface. |
| `UX-06` | `pending` | Prompt 18 | Advanced status bar. |

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
| 08 | Navigation And Surface Inventory Migration | `pending` | Not started. |
| 09 | Bottom Panel Body Extraction | `pending` | Not started. |
| 10 | Problems QA Diagnostics Right Dock Migration | `pending` | Not started. |
| 11 | Attributes Selection Timeline Tasks Right Dock Migration | `pending` | Not started. |
| 12 | Remove Bottom Workspace Host And Shell Primitive | `pending` | Not started. |
| 13 | Left Panel Content Contracts | `pending` | Not started. |
| 14 | Left Panel Responsive Fit Pass | `pending` | Not started. |
| 15 | Draw Sketch Annotation Dock Consolidation | `pending` | Not started. |
| 16 | Measure Selection Inspect Dock Consolidation | `pending` | Not started. |
| 17 | Unified Top Command Surface | `pending` | Not started. |
| 18 | Advanced Status Bar | `pending` | Not started. |
| 19 | Final Polish, Accessibility, Regression, And Ledger Closeout | `pending` | Not started. |

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
