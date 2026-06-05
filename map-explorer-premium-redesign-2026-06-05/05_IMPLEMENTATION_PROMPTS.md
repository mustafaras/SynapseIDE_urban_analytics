# 05 - Sequential Implementation Prompts

Use these prompts in order. The original 11-prompt sequence covered the reported UX problems, but it grouped several risky migrations into oversized steps. This 20-prompt sequence keeps the same scope and splits the work along the actual code seams found in `mapDocking.ts`, `MapWorkspaceShell.tsx`, `MapExplorerModalComposition.tsx`, `mapNavigationModel.ts`, `mapSurfaceInventory.ts`, `MapToolbar.tsx`, and `MapStatusBar.tsx`.

Status vocabulary: `pending`, `in_progress`, `implemented`, `blocked`, `verified`, `deferred`.

## Prompt 00 - Baseline Surface Inventory

Status: `pending`

Objective:

Create a precise inventory of every Map Explorer surface affected by the redesign before behavior changes.

Read:

- `00_SCOPE_AND_GUARDRAILS.md`
- `06_QA_AND_REGRESSION_GATES.md`
- `docs/architecture/map-explorer-canonical-surface.md`

Tasks:

- Inventory modal, left panel, right dock, bottom panel, toolbar, status bar, floating tool, drawer, dialog, and canvas overlay entry points.
- Record all current `bottomPanelOpen`, `activeBottomPanelTab`, `MapBottomPanel`, `MapPanelRail side="bottom"`, `MapLayerPanelPlacement`, `MapBottomPanelTabId`, and `targetSlot: "bottom-panel"` usages.
- Identify current routes from toolbar, status bar, activity rail, command palette, and cockpit actions.
- Update or add a surface-inventory test that fails if a new bottom workspace route is introduced during the redesign.

Acceptance:

- No behavior changes.
- All current bottom-panel and floating-tool entry points are named.
- The ledger contains the inventory summary and known high-risk files.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts
```

## Prompt 01 - Visual Baseline And Screenshot Harness

Status: `pending`

Objective:

Capture the current failing visual states so the redesign can prove it fixed the actual screenshots.

Read:

- `06_QA_AND_REGRESSION_GATES.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Add or update Playwright checks for `IMG-01` through `IMG-04`.
- Capture opening modal, left Data/Layers panels, bottom Diagnostics, floating Draw/Measure, top toolbar, and status bar.
- Cover desktop, short desktop, tablet, and narrow compositions where feasible.
- Keep the test names tied to `UX-01` through `UX-06`.

Acceptance:

- Baseline screenshots or visual assertions exist before UI changes.
- The baseline identifies the current bottom panel and floating tool states.
- No production behavior changes.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 02 - Launch Dialog State Boundary

Status: `pending`

Objective:

Separate launch/readiness dialog state from left-panel state and workspace tab state.

Read:

- `01_OPENING_MODAL_SPEC.md`
- `02_PANEL_ARCHITECTURE_SPEC.md`

Tasks:

- Define `MapStartDialogReason` and launch dialog state.
- Ensure dismissal, close, `Esc`, continue, import, project load, and demo pack handoff are deterministic.
- Add migration/normalization for old cockpit or launch flags if any are persisted.
- Keep derived readiness metrics computed from selectors, not persisted.

Acceptance:

- Launch dialog state cannot be confused with left-panel tab state.
- Dismissal does not cause repeated reopen loops.
- Existing map open/close and keyboard launch paths still work.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 03 - Start Dialog Visual Redesign

Status: `pending`

Objective:

Build the premium opening dialog as a dedicated component.

Read:

- `01_OPENING_MODAL_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Add `MapStartDialog` or equivalent with scoped CSS Module.
- Implement header band, primary decision row, readiness strip, context preview, and optional advanced disclosure.
- Keep one scroll root at most.
- Wire import, open project, demo pack, and continue actions to existing callbacks.
- Preserve focus trap, close, `Esc`, aria labels, and focus return.

Acceptance:

- `UX-01` is visually resolved.
- Primary actions are visible at desktop and short desktop viewports.
- Unknown/demo/sample/readiness state remains truthful.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 04 - Left Panel Launch Decoupling

Status: `pending`

Objective:

Remove full launch/readiness modal content from all left-panel render paths.

Read:

- `01_OPENING_MODAL_SPEC.md`
- `02_PANEL_ARCHITECTURE_SPEC.md`

Tasks:

- Split `MapWorkspaceCockpit` into modal-only content and compact in-workspace summary if needed.
- Ensure the left panel cannot render `MapStartDialog` or its full body.
- Keep a compact Overview/Readiness summary only if it fits the left-panel contract.
- Update tests for left-panel launch-content absence.

Acceptance:

- The launch-modal part of `UX-02` is resolved.
- Left-panel Overview/Readiness is compact and not a disguised modal.
- No import/demo/load/continue callback is lost.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 05 - Docking Type Contract Without Bottom Placement

Status: `pending`

Objective:

Make bottom workspace placement structurally impossible in the docking model.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Remove active `"bottom"` from `MapLayerPanelPlacement`.
- Ensure `getMapDockLayout` never returns a bottom workspace placement.
- Replace compact-width behavior with side drawer or collapsed side-panel rules.
- Expand `MapRightDockPanel` with the target right-dock IDs.
- Update `map-docking.test.ts` to assert no bottom placement at desktop, short desktop, tablet, and narrow widths.

Acceptance:

- `getMapDockLayout` cannot return a bottom workspace.
- Compact widths do not create bottom drawers.
- Existing right dock panels still open.

Validation:

```bash
npm run typecheck
npm run test -- src/centerpanel/components/map/__tests__/map-docking.test.ts
```

## Prompt 06 - Right Dock State And Route Model

Status: `pending`

Objective:

Create a single typed route model for right-dock panels and migrated bottom surfaces.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Add right-dock IDs for `inspect`, `attributes`, `problems`, `timeline`, `tasks`, `diagnostics`, `selection`, `qa`, `performance`, and `collaboration`.
- Define route helpers from old bottom tabs to new right dock panels.
- Add typed open/close/switch helpers, preserving focus return where current bottom-panel actions do.
- Keep local UI state serializable where persistence is useful.

Acceptance:

- Every old bottom tab has an explicit right-dock target.
- Toolbar/status/activity callbacks can use one right-dock route helper.
- No route uses stringly typed ad hoc panel IDs outside the helper.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 07 - Right Dock Host Visual Shell

Status: `pending`

Objective:

Add or evolve a premium right inspector dock host before migrating content into it.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Create a shared right dock host/header/tab pattern.
- Support active panel title, state label, close/collapse, overflow menu, and body scroll.
- Implement desktop dock and constrained-width side-drawer behavior.
- Keep only one primary right dock active at a time.

Acceptance:

- Right dock can host empty/placeholder-free shell states for all migrated panel IDs.
- Header/body scroll behavior is stable.
- No right dock content overlaps map controls.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 08 - Navigation And Surface Inventory Migration

Status: `pending`

Objective:

Move the navigation model and surface inventory away from bottom-panel concepts.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Replace `MapBottomPanelTabId` navigation responsibilities with right-dock destinations.
- Remove or deprecate `targetSlot: "bottom-panel"` in `mapSurfaceInventory.ts`.
- Update activity defaults and task-lens priorities to use right dock, left panel, status bar, dialog, or canvas.
- Update navigation tests so they reject bottom-panel routes.

Acceptance:

- Navigation and inventory no longer define bottom-panel destinations for normal workspace content.
- Activity rail, command palette, and status IDs still map to reachable surfaces.
- Tests guard against reintroducing `bottom-panel` target slots.

Validation:

```bash
npm run typecheck
npm run test -- src/centerpanel/components/map/__tests__/mapNavigationModel.test.ts src/centerpanel/components/map/__tests__/mapSurfaceInventory.test.ts
```

## Prompt 09 - Bottom Panel Body Extraction

Status: `pending`

Objective:

Extract reusable content bodies from `MapBottomPanel` without changing their data sources.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `06_QA_AND_REGRESSION_GATES.md`

Tasks:

- Extract Problems, Attributes, Timeline, Tasks, Diagnostics, Console, and Measurements content bodies where needed.
- Preserve lazy mounting for heavy attributes and diagnostics content.
- Keep data-testid selectors or add replacement selectors with updated tests.
- Do not remove `MapBottomPanel` usage yet.

Acceptance:

- No visual behavior change yet.
- Extracted bodies can render inside the right dock.
- Heavy tabs remain lazy where they are lazy today.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx src/centerpanel/components/map
```

## Prompt 10 - Problems QA Diagnostics Right Dock Migration

Status: `pending`

Objective:

Move Problems, scientific QA detail, Diagnostics, and Performance detail to the right dock.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Add right `Problems`, `QA`, `Diagnostics`, and `Performance` surfaces.
- Route toolbar QA, status QA/CRS, diagnostics, performance, worker retry, and render-budget actions to the right dock.
- Preserve CRS, QA blockers, render warnings, source caveats, and recovery actions.
- Update tests that currently expect bottom diagnostics or bottom problems.

Acceptance:

- The diagnostics part of `UX-03` is resolved.
- QA and diagnostics no longer consume the bottom map area.
- No scientific caveat or recovery path is lost.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 11 - Attributes Selection Timeline Tasks Right Dock Migration

Status: `pending`

Objective:

Move Attributes, Selection, Timeline, Review/Collaboration, Tasks, and Measurements to the right dock.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Add right `Attributes`, `Selection`, `Timeline`, `Tasks`, `Collaboration`, and `Measure` destinations.
- Route attribute-table opens, selected-feature details, review timeline, collaboration, task progress, and measurement results to the right dock.
- Preserve attribute lazy mounting, selected feature context, review audit events, task status, and measurement CRS caveats.
- Update status route tests from bottom-panel language to right-dock language.

Acceptance:

- The remaining bottom-tab content has right-dock equivalents.
- Status bar and toolbar actions open the correct right dock panels.
- Attribute, review, and measurement behavior remains intact.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 12 - Remove Bottom Workspace Host And Shell Primitive

Status: `pending`

Objective:

Retire persistent bottom workspace rendering after all content has migrated.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `03_TOP_AND_STATUS_BAR_SPEC.md`

Tasks:

- Remove `MapBottomPanel` usage from `MapExplorerModalComposition`.
- Remove active `MapPanelRail side="bottom"` support or mark it unavailable for workspace content.
- Remove bottom workspace style/tokens that are no longer used, keeping `statusBarHeight`.
- Keep `MapStatusBar` as the only bottom edge.
- Delete or rewrite `MapBottomPanel` tests into right-dock tests after behavior parity is covered.

Acceptance:

- `UX-03` is fully resolved.
- No persistent bottom panel can appear in normal desktop, short desktop, tablet, or narrow view.
- Bottom edge contains only the status bar.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 13 - Left Panel Content Contracts

Status: `pending`

Objective:

Define width-aware contracts for left-panel tabs before changing their layout.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Define contracts for Data, Layers, Catalog, Connections, Source Health, Demo Data, and any retained Overview summary.
- Set min comfort width, preferred width, max useful width, and overflow strategy.
- Add tests for width clamping and content strategy selection.
- Keep one scroll root per tab as an explicit rule.

Acceptance:

- Every left tab has a documented content-fit contract.
- No tab is allowed to rely on horizontal scrolling at default width.
- Tests fail if a tab has no contract.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 14 - Left Panel Responsive Fit Pass

Status: `pending`

Objective:

Apply the left-panel contracts to real tab content.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Standardize panel headers, tab rows, search/filter rows, and empty states.
- Convert overflowing tables to stacked rows or property grids at narrow widths.
- Validate Data, Layers, Catalog, Connections, Source Health, and Demo Data at 320, 420, 520, and max widths.
- Preserve resize handle and width persistence behavior.

Acceptance:

- `UX-02` is resolved for Data and other left tabs.
- No horizontal overflow at min/default widths.
- Expanded widths use space intentionally.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 15 - Draw Sketch Annotation Dock Consolidation

Status: `pending`

Objective:

Remove persistent floating draw/sketch/annotation panels and move detail into the right dock.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Move drawings/sketch list, active draw settings, AOI summary, and annotation detail into right `Draw` or `Inspect`.
- Keep transient geometry labels, context menus, and short confirmation popovers anchored to map geometry.
- Ensure draw toolbar activation opens the correct right dock tab when detail is needed.
- Preserve draw tools: point, line, polygon, rectangle, circle, annotation, and AOI flows.

Acceptance:

- The draw/sketch portion of `UX-04` is resolved.
- No persistent floating sketch panel remains after activating draw tools.
- Draw and AOI behavior still works.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts
```

## Prompt 16 - Measure Selection Inspect Dock Consolidation

Status: `pending`

Objective:

Move measurement and selection detail into right dock surfaces.

Read:

- `02_PANEL_ARCHITECTURE_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Move measurement results/settings into right `Measure`.
- Move selected-feature details into right `Selection` or `Inspect`.
- Preserve geodesic measurement caveats, units, active tool state, and selected feature context.
- Keep map labels/context menus transient and anchored only.

Acceptance:

- The measure/selection portion of `UX-04` is resolved.
- Measurement results and CRS caveats remain visible.
- Selection and attributes routes are consistent.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts src/centerpanel/components/map
```

## Prompt 17 - Unified Top Command Surface

Status: `pending`

Objective:

Redesign header and toolbar into one professional command surface.

Read:

- `03_TOP_AND_STATUS_BAR_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Create or evolve `MapTopCommandSurface`.
- Arrange identity/scope, search/context, command groups, primary action, undo/redo, publish actions, and system actions.
- Keep command palette taxonomy, keyboard shortcuts, and processing-tool palette behavior.
- Ensure commands open left/right panels or transient menus, not persistent floating panels.
- Add grouped overflow behavior for short widths.

Acceptance:

- `UX-05` is resolved.
- Search, command groups, undo/redo, save/export/report, and panel toggles remain reachable.
- Disabled commands expose reasons.
- No text clipping in common viewports.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

## Prompt 18 - Advanced Status Bar

Status: `pending`

Objective:

Upgrade the bottom edge into the only bottom surface: a dense, clickable, non-overlapping status bar.

Read:

- `03_TOP_AND_STATUS_BAR_SPEC.md`
- `04_VISUAL_INTERACTION_SYSTEM.md`

Tasks:

- Add stable status segments for cursor, zoom/scale, project/save, mode/lens, layers, selection, AOI/draw/measure, units, CRS, QA, review, tasks, performance, sync/collaboration, and attribution.
- Map each clickable segment to left/right panel destinations.
- Add overflow behavior for narrow widths.
- Ensure long labels truncate with tooltips and busy/warning states do not shift layout.
- Respect reduced motion for busy indicators.

Acceptance:

- `UX-06` is resolved.
- Status bar is the only bottom edge.
- Segment clicks open correct right/left details.
- No bottom panel affordance remains.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx src/centerpanel/components/map
```

## Prompt 19 - Final Polish, Accessibility, Regression, And Ledger Closeout

Status: `pending`

Objective:

Prove the redesign is coherent, accessible, responsive, and non-breaking.

Read:

- `04_VISUAL_INTERACTION_SYSTEM.md`
- `06_QA_AND_REGRESSION_GATES.md`
- `07_ANTI_AMNESIA_LEDGER.md`

Tasks:

- Run tokenized visual polish across modal, left panel, right dock, top command surface, status bar, and transient overlays.
- Validate focus management, keyboard traversal, disabled reasons, screen-reader labels, and reduced-motion behavior.
- Run visual matrix checks for 1366x768, 1440x900, 1280x620, 1024x768, and 390x844.
- Verify import, layers, catalog, source health, draw, measure, selection, QA, analysis, workflow, export, report handoff, review timeline, diagnostics, project save/load, CRS preflight, and persistence.
- Update docs and close the anti-amnesia ledger.

Acceptance:

- All `UX-01` through `UX-06` issues are `verified` or residual risks are explicit.
- No known functional regression remains untriaged.
- Final screenshots are recorded for the four original problem states plus top/status bars.
- Ledger is current.

Validation:

```bash
npm run typecheck
npm run lint:errors
npm run test:analytics
npm run test:e2e
npm run build
```
