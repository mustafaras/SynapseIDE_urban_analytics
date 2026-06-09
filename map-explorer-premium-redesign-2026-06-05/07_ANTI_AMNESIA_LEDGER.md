# 07 - Anti-Amnesia Ledger

Status: Active  
Last updated: 2026-06-05  
Purpose: Keep redesign state resumable without rereading the full repo.

## Current Snapshot

Prompts 00 and 01 have been implemented. Baseline surface inventory guards now freeze current bottom-panel, floating-panel, canvas-overlay, dialog, drawer, and bottom navigation routes before redesign behavior changes, and a Playwright visual baseline harness now captures the current failing Map Explorer states before redesign behavior changes.

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
| `UX-01` | `pending` | Prompt 02, Prompt 03 | Opening dialog state boundary plus visual redesign. |
| `UX-02` | `pending` | Prompt 04, Prompt 13, Prompt 14 | Launch modal removal from left panel plus width/content contracts and responsive fit. |
| `UX-03` | `pending` | Prompt 05 through Prompt 12 | Docking model, right dock, navigation migration, content migration, and bottom workspace removal. |
| `UX-04` | `pending` | Prompt 15, Prompt 16 | Draw/sketch/annotation plus measure/selection consolidation. |
| `UX-05` | `pending` | Prompt 17 | Unified top command surface. |
| `UX-06` | `pending` | Prompt 18 | Advanced status bar. |

## Prompt Status Ledger

| Prompt | Title | Status | Last evidence |
| --- | --- | --- | --- |
| 00 | Baseline Surface Inventory | `implemented` | Baseline inventory doc plus guard tests added; `npm run typecheck` passed. |
| 01 | Visual Baseline And Screenshot Harness | `implemented` | Playwright visual baseline harness added for `IMG-01` through `IMG-04`, plus `UX-05` and `UX-06`; `npm run typecheck` passed. |
| 02 | Launch Dialog State Boundary | `pending` | Not started. |
| 03 | Start Dialog Visual Redesign | `pending` | Not started. |
| 04 | Left Panel Launch Decoupling | `pending` | Not started. |
| 05 | Docking Type Contract Without Bottom Placement | `pending` | Not started. |
| 06 | Right Dock State And Route Model | `pending` | Not started. |
| 07 | Right Dock Host Visual Shell | `pending` | Not started. |
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
