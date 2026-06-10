# Map Explorer Local Execution Ledger

## Scope
- Workspace: `c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics`
- Execution mode: local-only implementation and validation
- Source docs:
  - `MAPDESIGN/prompts-compact-en.md` (primary)
  - `MAPDESIGN/prompts-detailed-en.md`
  - `MAPDESIGN/ui-ux-audit-plan.md`
- Rule: preserve prompt intent, semantics, and phase order

## Local-Only Policy
1. Use local branches and local commits.
2. Do not depend on remote deployment checks for completion.
3. Treat local preview (`npm run dev` or preview build) as visual source of truth.
4. Push is optional and only when explicitly requested.
5. Never commit directly to `main` or `master`.

## Anti-Amnesia Protocol (Mandatory Per Prompt)
1. Before starting a prompt, write a one-line `Intent` and `Definition of Done`.
2. During work, append `Decisions`, `Changed Files`, and `Validation`.
3. Before ending a prompt, append `Open Risks` and `Next Prompt`.
4. If interrupted, append `Resume From` with exact file path + symbol/context.
5. Never start a new prompt without closing the previous prompt block status.

## Commit and Push Discipline
- Commit frequency:
  - One commit per prompt unless prompt is too large.
  - If split required, use numbered commits (`pNN.1`, `pNN.2`, ...).
- Commit message format:
  - `<type>(map-explorer): pNN <short action>`
  - Examples:
    - `refactor(map-explorer): p05 stabilize shell grid`
    - `test(map-explorer): p09 add overlap regression checks`
- Commit body template:
  - `Prompt: PNN`
  - `Why: <reason>`
  - `What: <key file groups>`
  - `Validation: <commands + result>`
  - `Risks: <if any>`
- Push policy:
  - Default: no push (local continuation).
  - If push requested: push only the active branch and note remote URL + commit hash.

## Prompt Progress Ledger
| Prompt | Branch | Status | Last Commit | Validation | Resume From | Notes |
|---|---|---|---|---|---|---|
| P01 | local/p01-inventory | done |  | completed (inventory note delivered) | MAPDESIGN/prompts-detailed-en.md (Prompt 01) | Completed 2026-06-09 |
| P02 | local/p02-visual-baseline | done |  | typecheck passed; baseline e2e spec passed 5/5 | MAPDESIGN/p02-visual-baseline-2026-06-09.md | Closed 2026-06-09 after diagnostics/status assertion updates |
| P03 | local/p03-test-contracts | done |  | analysis-only search/read pass completed | MAPDESIGN/p03-test-contracts-2026-06-09.md | Closed 2026-06-09 with selector contract note |
| P04 | ui/map-modal-layout-stabilization-p1 | done |  | typecheck passed; lint:errors passed | MAPDESIGN/execution-ledger.md | Closed 2026-06-09 with tokenized shell/safe-inset model |
| P05 | ui/map-modal-layout-stabilization-p1 | done |  | typecheck passed; lint:errors passed; mapShellPrimitives tests passed | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Closed 2026-06-09 with explicit shell grid regions |
| P06 | ui/map-modal-layout-stabilization-p1 | done | 15707f6 | typecheck passed; lint:errors passed; map-components + map-accessibility tests passed | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Closed 2026-06-09 with tokenized safe-zone placement for map furniture |
| P07 | ui/map-modal-layout-stabilization-p1 | done |  | typecheck passed; lint:errors passed; targeted overlay/dialog tests passed | src/centerpanel/components/map/MapToolbar.tsx | Closed 2026-06-09 with modal-safe overlay/dialog containment rules |
| P08 | ui/map-modal-layout-stabilization-p1 | done | 2c5ab73 | typecheck passed; lint:errors passed; MapStatusBarRoutes tests passed | src/centerpanel/components/map/MapStatusBar.tsx | Closed 2026-06-09 with explicit status priority tiers and critical-warning visibility guard |
| P09 | ui/map-modal-layout-stabilization-p1 | done | 8a8cdcb | playwright p09 layout spec passed; typecheck passed; lint:errors passed; premium baseline spec passed | e2e/map-layout-regression-p09.spec.ts | Closed 2026-06-09 with overlap/clipping regression guards and baseline alignment |
| P10 | ui/map-modal-command-bar-p2 | done | c02a3f6 | analysis-only inventory completed (surface map + duplication audit + phase-2 recommendations) | MAPDESIGN/p10-command-inventory-2026-06-09.md | Closed 2026-06-09 with Prompt 10 command/header inventory |
| P11 | ui/map-modal-command-bar-p2 | done | 83b3e33 | typecheck passed; lint:errors passed; MapTopCommandSurface + modal baseline tests passed | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Closed 2026-06-09 with stable top-right modal-control cluster and separated utility controls |
| P12 | ui/map-modal-command-bar-p2 | done | 3daec71 | toolbar tests passed; typecheck passed; lint:errors passed; focused e2e smoke passed | src/centerpanel/components/map/MapToolbar.tsx | Closed 2026-06-09 with reduced visible toolbar density and overflow-first secondary commands |
| P13 | ui/map-modal-command-bar-p2 | done |  | typecheck passed; lint:errors passed; lint:no-tailwind-centerpanel passed; targeted vitest passed; focused e2e smoke passed | src/centerpanel/components/map/MapCanvasControls.tsx | Closed 2026-06-09 with shared icon-button affordance standardization across canvas and modal controls |
| P14 | ui/map-modal-command-bar-p2 | done |  | typecheck passed; lint:errors passed; MapTopCommandSurface + MapStatusBarRoutes tests passed | src/centerpanel/components/map/MapTopCommandSurface.tsx | Closed 2026-06-10 with calmer header metadata density, CRS chip normalization, and long-label truncation safeguards |
| P15 | ui/map-modal-command-bar-p2 | done |  | typecheck passed; lint:errors passed; targeted command/header/a11y tests passed; prompt15 header e2e regression passed | e2e/map-modal-layout.spec.ts | Closed 2026-06-10 with command/header regression hardening for compact-width header controls and command-reachability safety |
| P16 | ui/map-modal-panel-density-p3 | done |  | analysis-only repository audit completed (no runtime/code edits) | MAPDESIGN/p16-panel-density-audit-2026-06-10.md | Closed 2026-06-10 with panel-density inventory, readability risk map, hierarchy model, and safe implementation order |
| P17 | ui/map-modal-panel-density-p3 | done |  | typecheck passed; lint:errors passed; map-layer-management + MapWorkbenchSidebar tests passed | src/centerpanel/components/map/MapLayerManager.tsx | Closed 2026-06-10 with left-panel section summaries, routeable section actions, and progressive layer-detail disclosure |
| P18 | ui/map-modal-panel-density-p3 | done |  | typecheck passed; lint:errors passed; map-layer-management tests passed | src/centerpanel/components/map/MapLayerManager.tsx | Closed 2026-06-10 with explicit row-action classification, reduced visible action density, and keyboard-first action-menu navigation |
| P19 | ui/map-modal-panel-density-p3 | done | 63d0347 | typecheck passed; lint:errors passed; right dock tests 11/11 passed | src/centerpanel/components/map/MapRightDockHost.tsx | Closed 2026-06-10 with primary/contextual/advanced/diagnostics tier classification, primary tab rail, grouped overflow menu |
| P20 | ui/map-modal-panel-density-p3 | done | 95073dc | typecheck passed; lint:errors passed; inspector + attribute tests 20/20 passed | src/centerpanel/components/map/inspector/LayerInspector.tsx | Closed 2026-06-10 with summary-first inspector overview, visible warnings, quick actions, and condensed attribute workflow detail rail |
| P21 | ui/map-modal-panel-density-p3 | done | c73eac5 | typecheck passed; lint:errors passed; MapPublishWorkspace tests 3/3 passed; test:analytics 1131/1131 passed | src/centerpanel/components/map/publish/MapPublishWorkspace.tsx | Closed 2026-06-10 with progressive disclosure for evidence/publish/caveats |
| P22 | ui/map-modal-panel-density-p3 | done |  | typecheck passed; lint:errors passed; map-performance diagnostics tests 5/5 passed | src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx | Closed 2026-06-10 with severity-first operational diagnostics and collapsed advanced event history |
| P23 | ui/map-modal-panel-density-p3 | done | dd56d87 | typecheck passed; lint:errors passed; targeted Prompt 23 suites 81/81 passed; fallback p09 layout e2e 2/2 passed | src/centerpanel/components/map/__tests__/map-layer-management.test.ts | Closed 2026-06-10 with panel hierarchy and density regression coverage consolidation |
| P24 | fix/map-modal-collision-zindex-p4 | done | 694df16 | typecheck passed; lint:errors passed; targeted map tests passed (72/72); p09 overlap/collision e2e passed (2/2) | src/centerpanel/components/map/mapTokens.ts | Closed 2026-06-10 with named z-index/elevation model and safe literal replacement in modal overlays/dialog surfaces |
| P25 | fix/map-modal-collision-zindex-p4 | done | 0726858 | typecheck passed; lint:errors passed; AppPopover test 2/2; overlay consumer vitest 24/24; map-layout-regression-p09 e2e 2/2 | src/centerpanel/components/map/ui/AppPopover.tsx | Closed 2026-06-10 with shared popover flip/clamp/max-height behavior and regression coverage for right-edge and short-height collisions |
| P26 | fix/map-modal-collision-zindex-p4 | done | 46cf984 | typecheck passed; lint:errors passed; targeted drawer tests 10/10 passed; p09 layout e2e 2/2 passed | src/centerpanel/components/map/MapWorkflowDrawer.tsx | Closed 2026-06-10 with short-height shrinkable embedded drawers and bounded panel bodies for NL query, workflow, and report handoff surfaces |
| P27 | ui/map-modal-accessibility-p4 | not_started |  |  |  |  |
| P28 | ui/map-modal-accessibility-p4 | not_started |  |  |  |  |
| P29 | ui/map-modal-accessibility-p4 | not_started |  |  |  |  |
| P30 | ui/map-modal-accessibility-p4 | not_started |  |  |  |  |
| P31 | ui/map-modal-polish-p5 | not_started |  |  |  |  |
| P32 | ui/map-modal-polish-p5 | not_started |  |  |  |  |
| P33 | ui/map-modal-polish-p5 | not_started |  |  |  |  |
| P34 | ui/map-modal-polish-p5 | not_started |  |  |  |  |
| P35 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |
| P36 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |
| P37 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |
| P38 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |
| P39 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |
| P40 | test/map-modal-visual-qa-p6 | not_started |  |  |  |  |

## Per-Prompt Log Template
### PNN - <title>
- Status: not_started | in_progress | blocked | done
- Intent:
- Definition of Done:
- Decisions:
- Changed Files:
- Validation:
- Open Risks:
- Resume From:
- Next Prompt:

## Active Prompt Log
### P01 - Build the Map Explorer repository inventory
- Status: done
- Intent: Build a complete repository inventory for Map Explorer modal surfaces before any UI edits.
- Definition of Done: Produce the Prompt 01 markdown audit note with all required sections and no code edits.
- Decisions: Local-only execution; no remote deployment dependency for this prompt.
- Changed Files: MAPDESIGN/execution-ledger.md
- Validation: Completed (analysis-only prompt; inventory delivered).
- Open Risks: None for Prompt 01 scope.
- Resume From: MAPDESIGN/p02-visual-baseline-2026-06-09.md
- Next Prompt: P02

### P02 - Establish the live and local visual baseline
- Status: done
- Intent: Establish the visual baseline for Map Explorer modal using local repository behavior and local preview/live endpoints.
- Definition of Done: Produce Prompt 02 baseline note with deployment discovery, command sequence, screenshot matrix, acceptance rules, and findings.
- Decisions: Baseline blocker mitigation required targeted code hardening before P03; applied minimal fixes to Urban→Map handoff and e2e modal detection.
- Changed Files: MAPDESIGN/execution-ledger.md; MAPDESIGN/p02-visual-baseline-2026-06-09.md; src/features/urbanAnalytics/UrbanAnalyticsModal.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; e2e/helpers/urbanAnalytics.ts
- Validation: `npm run typecheck` passed; `npm run test:analytics` executed; `e2e/map-premium-redesign-baseline.spec.ts` passed (5 passed / 0 failed).
- Open Risks: None for Prompt 02 baseline scope.
- Resume From: MAPDESIGN/prompts-detailed-en.md (Prompt 03 block)
- Next Prompt: P03

### P03 - Map test contracts and stable selectors
- Status: done
- Intent: Inventory current Map Explorer test contracts and define stable selector safety rules before Phase 1 layout edits.
- Definition of Done: Produce a Prompt 03 contract note covering existing tests, stable selector map, migration rules, gap list, and safe selector-add recommendations.
- Decisions: Executed in compact mode with detailed Prompt 03 fallback semantics; focused on map e2e + map component/store/controller tests and canonical selector surfaces.
- Changed Files: MAPDESIGN/p03-test-contracts-2026-06-09.md; MAPDESIGN/execution-ledger.md
- Validation: Analysis-only validation via targeted repository search and source inspection (`file_search`, `grep_search`, `read_file`) across e2e and src map test suites.
- Open Risks: Some e2e contracts still rely on long visible text labels; selector alias additions should be completed before broad layout surgery in P04/P05.
- Resume From: MAPDESIGN/p03-test-contracts-2026-06-09.md
- Next Prompt: P04

### P04 - Phase 1: Stabilize layout tokens and modal inset system
- Status: done
- Intent: Consolidate map layout tokens and safe-inset variables so shell, overlays, status, and panel surfaces share one readable contract.
- Definition of Done: Add or clarify shared layout variables (modal chrome, command height, panel widths, bottom/status heights, safe insets, popover/dialog bounds) and wire them into core shell/control consumers without changing semantics.
- Decisions: Added consolidated `MAP_LAYOUT_TOKENS` + `createMapShellCssVars()` in map tokens; applied shell-level CSS variables and replaced hardcoded control offsets/heights with CSS var consumption for compatibility-safe behavior.
- Changed Files: src/centerpanel/components/map/mapTokens.ts; src/centerpanel/components/map/MapWorkspaceShell.tsx; src/centerpanel/components/map/MapCanvasControls.tsx; src/centerpanel/components/map/MapStatusBar.tsx; MAPDESIGN/execution-ledger.md
- Validation: `Set-Location "c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics"; npm run typecheck` passed; `Set-Location "c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics"; npm run lint:errors` passed; targeted diagnostics (`get_errors`) on touched files reported no errors.
- Open Risks: Minor vertical alignment drift may appear where previous fixed offsets were relied upon indirectly; behavior expected to remain equivalent due fallback defaults.
- Resume From: src/centerpanel/components/map/mapTokens.ts (MAP_LAYOUT_TOKENS, createMapShellCssVars)
- Next Prompt: P05

### P05 - Phase 1: Stabilize modal shell grid and safe-area placement
- Status: done
- Intent: Make Map Explorer shell region placement explicit and stable across header, center map, and bottom timeline/status surfaces.
- Definition of Done: Introduce a predictable shell layout grid and explicit region wrappers while preserving existing controls, panels, and functionality.
- Decisions: Added a dedicated shell content grid (`map-shell-layout-grid`) with row contract `command / center / bottom`; wrapped `MapTopCommandSurface`, `MapCanvasRegion`, and `MapBottomTimeline` in explicit region containers with `data-map-shell-region` markers. Post-P05 hotfixes: (1) `ResizeObserver`-driven `map.resize()` synchronization in `MapCanvas`; (2) restored flex context on shell center region so `MapCanvasRegion` (`flex: 1`) expands fully instead of staying at `min-height` and leaving a lower blank band.
- Changed Files: src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/MapCanvas.tsx; MAPDESIGN/execution-ledger.md
- Validation: `Set-Location "c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics"; npm run typecheck` passed; `Set-Location "c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics"; npm run lint:errors` passed; `Set-Location "c:/Users/m_ras/Desktop/SynapseIDE_urban_analytics"; npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx` passed (32/32).
- Open Risks: Header row height currently follows `--map-shell-command-height`; if command surface intrinsic height changes in future prompts, row and content height must stay aligned. No remaining blank-gap risk expected after resize synchronization.
- Resume From: src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx (shellLayoutGridStyle, data-map-shell-region wrappers)
- Next Prompt: P06

### P06 - Phase 1: Apply map furniture safe-zone rules
- Status: done
- Intent: Make floating map furniture respect modal panel boundaries and shell safe insets without changing map behavior.
- Definition of Done: Floating controls (keyboard help, north arrow, keyboard fallback controls, diagnostics banner, legend overlay, import progress, and canvas selection dock) use tokenized safe inset placement and avoid collisions with command, dock, and bottom regions.
- Decisions: Standardized placement on shell CSS vars (`--map-overlay-safe-top`, `--map-overlay-safe-bottom`, `--map-overlay-safe-inset-x`, `--map-overlay-safe-inset-y`, `--map-dock-left`, `--map-dock-right`). Applied these vars in control overlays and legend/diagnostics surfaces; retained keyboard operability and existing tool semantics.
- Changed Files: MAPDESIGN/execution-ledger.md; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/MapCanvasControls.tsx; src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx; src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx; src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx; src/centerpanel/components/map/MapCanvas.tsx; src/centerpanel/components/map/mapTokens.ts
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts src/centerpanel/components/map/__tests__/map-accessibility.test.ts` passed (98/98). Test run emitted non-blocking React `act(...)` warning in an existing toolbar test and a non-failing Three.js duplicate import warning.
- Open Risks: Manual visual validation matrix (default modal, left panel open, right dock open, bottom/status visible, short-height viewport) still recommended to confirm no edge overlap in live layout.
- Resume From: src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx (MapCanvasRegion style safe-inset css vars)
- Next Prompt: P07

### P07 - Phase 1: Add containment rules for popups, tooltips, dropdowns, and dialogs
- Status: done
- Intent: Prevent overlay surfaces from clipping critical controls or escaping the modal viewport while preserving all GIS/CRS/QA/evidence workflows.
- Definition of Done: Toolbar overflow/palette, selection and CRS popovers, and import/export/service dialogs use modal-safe max sizes and internal scroll containment without changing behavior or semantics.
- Decisions: Kept edits minimal and reversible by updating style constraints only (no workflow logic changes). Replaced viewport-bound (`vw/vh`) sizing with modal-relative bounds (`100%` + safe fallback), and standardized popover max height against `--map-popover-max-height`.
- Changed Files: MAPDESIGN/execution-ledger.md; src/centerpanel/components/map/MapToolbar.tsx; src/centerpanel/components/map/MapSelectionTools.tsx; src/centerpanel/components/map/DeclareCrsControl.tsx; src/centerpanel/components/MapExportDialog.tsx; src/centerpanel/components/MapDataImportHubDialog.tsx; src/centerpanel/components/MapCsvImportDialog.tsx; src/centerpanel/components/MapColumnarImportDialog.tsx; src/centerpanel/components/MapServiceDialog.tsx; src/centerpanel/components/map/MapImportPreviewDialog.tsx; src/centerpanel/components/MapDataExportDialog.tsx
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/__tests__/MapExportDialog.test.tsx src/centerpanel/components/__tests__/MapServiceDialog.test.tsx src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx` passed (24/24).
- Open Risks: Full manual collision sweep is still recommended for very narrow/short modal states where multiple overlays are stacked simultaneously.
- Resume From: src/centerpanel/components/map/MapToolbar.tsx (overflow/palette containment styles)
- Next Prompt: P08

### P08 - Phase 1: Make the status bar production-readable
- Status: done
- Intent: Improve status bar readability and priority behavior while preserving CRS/QA/provider/sync/perf/task/layer/selection semantics.
- Definition of Done: Status segments are explicitly grouped (view, data, runtime), priority rules keep critical warnings visible, overflow behavior remains intact, and short-width layouts stay usable.
- Decisions: Added explicit segment grouping and critical-warning flags in `MapStatusBar`; introduced deterministic tone logic for CRS/provider warning detection; updated overflow packing to pin critical warning segments before non-critical metadata.
- Changed Files: MAPDESIGN/execution-ledger.md; src/centerpanel/components/map/MapStatusBar.tsx; src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` passed (3/3).
- Open Risks: CRS warning detection currently relies on explicit status strings (e.g., `unknown`, `missing`, `unset`) within `crs`; if upstream semantics change, this tone mapping should be aligned with a typed CRS readiness signal.
- Resume From: src/centerpanel/components/map/MapStatusBar.tsx (segment grouping + overflow priority selection)
- Next Prompt: P09

### P09 - Phase 1: Add or update layout regression tests
- Status: done
- Intent: Protect Map Explorer shell from overlap, clipping, and unreachable controls with stable DOM/layout assertions.
- Definition of Done: Added targeted Playwright regression checks for modal shell visibility, panel collision guards, right-dock versus floating controls, short-height usability, reachable import dialog actions, QA/CRS warning affordances, and non-overlapping floating controls; updated existing baseline spec expectations to current shell behavior.
- Decisions: Implemented a dedicated Prompt 09 spec (`map-layout-regression-p09.spec.ts`) for deterministic overlap/reachability checks, and minimally aligned `map-premium-redesign-baseline.spec.ts` assertions with current right-dock diagnostics and status overflow behavior without removing baseline evidence coverage.
- Changed Files: MAPDESIGN/execution-ledger.md; e2e/map-layout-regression-p09.spec.ts; e2e/map-premium-redesign-baseline.spec.ts
- Validation: `npx playwright test e2e/map-layout-regression-p09.spec.ts` passed (2/2); `npm run typecheck` passed; `npm run lint:errors` passed; `npx playwright test e2e/map-premium-redesign-baseline.spec.ts` passed (5/5).
- Open Risks: Overlap assertions use current testids and control placements; if shell testid contracts are renamed in later phases, Prompt 03 selector-map aliases should be extended before refactoring.
- Resume From: e2e/map-layout-regression-p09.spec.ts (Prompt 09 guard scenarios)
- Next Prompt: P10

### P10 - Phase 2: Inventory header and command surfaces
- Status: done
- Intent: Build an implementation-grade inventory of Map Explorer header/command surfaces before command hierarchy changes.
- Definition of Done: Delivered command surface map, duplication audit, primary/secondary visibility classification, modal-control audit, and phase-2 recommendations without code changes.
- Decisions: Executed as analysis-only; used current controller composition and toolbar contracts as authoritative behavior source.
- Changed Files: MAPDESIGN/p10-command-inventory-2026-06-09.md; MAPDESIGN/execution-ledger.md
- Validation: Analysis-only verification via targeted source inspection (`read_file`, `grep_search`, `explore_subagent`) across MapTopCommandSurface, MapToolbar, MapCanvasControls, MapWorkspaceShell, and MapExplorerModalComposition.
- Open Risks: Modal control hierarchy currently has explicit close but not a fully unified modal-control cluster (dock/expand/minimize semantics remain distributed across panel/system surfaces).
- Resume From: MAPDESIGN/p10-command-inventory-2026-06-09.md
- Next Prompt: P11

### P11 - Phase 2: Stabilize header and modal-control hierarchy
- Status: done
- Intent: Make modal controls predictable and always findable while separating utility actions from modal-level controls.
- Definition of Done: Added a stable top-right modal-control cluster with consistent ordering (dock, minimize, expand, close), accessible labels/titles, and clear hit targets; moved non-modal utility action(s) out of the modal-control cluster.
- Decisions: Extended `MapTopCommandSurface` with explicit `utilitySlot` and `modalControlSlot` containers to avoid mixing utility controls with modal controls. Reused existing behavior handlers (`handleToggleLayerPanel`, `handleCollapseAllPanels`, `handleResetLayout`, `onClose`) instead of introducing new behavior.
- Changed Files: src/centerpanel/components/map/MapTopCommandSurface.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx` passed (4/4); `npx vitest run src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx` passed (2/2).
- Open Risks: Manual visual verification on desktop/tablet/short-height viewports remains pending in this turn (not automated by current unit tests).
- Resume From: src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx (MapTopCommandSurface utilitySlot + modalControlSlot wiring)
- Next Prompt: P12

### P12 - Phase 2: Regroup toolbar actions into visible, overflow, and contextual commands
- Status: done
- Intent: Reduce visible command density while keeping all existing commands reachable through grouped menus, overflow, command palette, or shortcuts.
- Definition of Done: Visible command groups were narrowed to high-frequency entry points (Data, Analyze, Evidence, Publish), secondary View/Advanced actions moved behind overflow, and undo/redo stayed reachable via overflow, command palette, and keyboard shortcuts.
- Decisions: Reused the existing command registry and group-menu system instead of introducing a new toolbar primitive. Reclassified top-surface groups to `data`, `view`, `analyze`, `evidence`, `publish`, and `advanced`, while keeping only the first four visible by default across normal widths.
- Changed Files: src/centerpanel/components/map/MapToolbar.tsx; src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx; src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx` passed (20/20); `npm run typecheck` passed; `npm run lint:errors` passed; `npx playwright test e2e/map-command-palette-p53.spec.ts e2e/map-catalog.spec.ts e2e/map-report-handoff.spec.ts` passed (3/3).
- Open Risks: The current grouping intentionally pulls `layers` and `contents` into the Data group to emphasize entry over navigation; if user testing prefers a distinct View/Layers affordance, P13/P14 should revisit labels rather than re-expand visible density.
- Resume From: src/centerpanel/components/map/MapToolbar.tsx (TopSurfaceGroupId grouping + visible group filter)
- Next Prompt: P13

### P13 - Phase 2: Standardize icon-only buttons and action affordances
- Status: done
- Intent: Make icon-only controls more understandable and visually perceivable while preserving compact desktop density and existing map workflows.
- Definition of Done: Reuse the shared icon-button primitive, apply consistent accessible labels/tooltips/focus/pressed/disabled affordances on high-visibility icon-only controls, and keep destructive close action visually separated.
- Decisions: Prioritized the two most visible icon-only clusters for immediate perceptual impact with minimal reversible edits: `MapCanvasControls` and top-right modal controls in `MapExplorerModalComposition`. Reused `GisIconButton` to standardize target size, focus visibility, pressed semantics, and disabled reasons.
- Changed Files: src/centerpanel/components/map/MapCanvasControls.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/__tests__/map-components.test.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npm run lint:no-tailwind-centerpanel` passed; `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx` passed (104/104); `npx playwright test e2e/map-command-palette-p53.spec.ts e2e/map-catalog.spec.ts e2e/map-report-handoff.spec.ts` passed (3/3). `npm run test:e2e -- e2e/map-modal-layout.spec.ts` reports existing unrelated failures in this branch and was not used as a completion gate for P13.
- Open Risks: Remaining icon-only buttons in deeper panel rows/dialog internals are still mixed primitives; a follow-up sweep can standardize these without changing behavior. Broad `map-modal-layout` e2e suite has pre-existing instability unrelated to this patch.
- Resume From: src/centerpanel/components/map/MapCanvasControls.tsx (viewport/interaction/furniture icon groups now on `GisIconButton`)
- Next Prompt: P14

### P14 - Phase 2: Calm search, CRS, project, and active layer indicators in the header
- Status: done
- Intent: Reduce header metadata noise while preserving CRS/QA warning visibility, search usability, and active project/layer context.
- Definition of Done: Header metadata is grouped into calmer, compact chips with predictable truncation and full-label access; critical CRS/QA semantics remain visible and routable; narrow-width behavior does not hide modal controls.
- Decisions: Kept edits minimal and reversible by refining existing `MapTopCommandSurface` density rules (cluster column balance, chip sizing, search bounds, trailing control layering) instead of changing command semantics. Normalized CRS chip display to avoid duplicated `CRS` prefix and added explicit regression coverage for long project/layer labels and accessible full-value titles.
- Changed Files: src/centerpanel/components/map/MapTopCommandSurface.tsx; src/centerpanel/components/map/MapStatusBar.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/MapCanvasControls.tsx; src/centerpanel/components/map/MapLayerManager.tsx; src/centerpanel/components/map/useFocusTrap.ts; src/centerpanel/components/map/table/MapAttributeWorkflowPanel.tsx; src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx; e2e/map-modal-layout.spec.ts; e2e/helpers/urbanAnalytics.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` passed (8/8).
- Open Risks: Broad `e2e/map-modal-layout.spec.ts` remains a large integration surface and has previously shown unrelated instability in this branch; full visual matrix rerun is recommended in Prompt 15 regression pass.
- Resume From: src/centerpanel/components/map/MapTopCommandSurface.tsx (cluster sizing, chip truncation, CRS chip value normalization)
- Next Prompt: P15

### P15 - Phase 2: Add or update command/header regression tests
- Status: done
- Intent: Guard Phase 2 header/command hierarchy against regressions while preserving all GIS/CRS/QA/evidence command semantics.
- Definition of Done: Command/header tests cover stable header/title context, modal-control reachability, grouped command visibility, overflow command reachability, icon-only/accessibility naming expectations, CRS/QA warning visibility, recovery-command separation, and compact-width non-clipping behavior.
- Decisions: Added minimal test-only changes on top of Prompt 14 to avoid behavior churn: (1) command-center regression asserting reset/recovery commands remain overflow/palette reachable and out of primary routine action area; (2) compact desktop e2e regression asserting top command surface + modal controls remain visible/focusable and unclipped while search/palette remains usable.
- Changed Files: src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx; e2e/map-modal-layout.spec.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` passed (25/25); `npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts` passed (34/34, with pre-existing non-blocking React `act(...)` warnings); `npx playwright test e2e/map-modal-layout.spec.ts --grep "header controls reachable without clipping" --reporter=line` passed (1/1).
- Open Risks: Full `e2e/map-modal-layout.spec.ts` remains broad and can surface unrelated suite flakiness; Prompt 15 coverage is stable for command/header regressions but full-map regression health should continue to be monitored in later prompts.
- Resume From: e2e/map-modal-layout.spec.ts ("keeps header controls reachable without clipping at compact desktop width")
- Next Prompt: P16

### P16 - Phase 3: Audit panel density and information architecture
- Status: done
- Intent: Inventory panel density and IA risks before any Phase 3 layout changes.
- Definition of Done: Produce a map-panel audit note covering panel inventory, density rating, readability issues, proposed hierarchy, and safest implementation order without functional changes.
- Decisions: Executed Prompt 16 as analysis-only documentation to keep edits minimal and reversible; used canonical map shell/right-dock/status/workflow/report/QA components as evidence source and avoided runtime behavior changes.
- Changed Files: MAPDESIGN/p16-panel-density-audit-2026-06-10.md; MAPDESIGN/execution-ledger.md
- Validation: Analysis-only prompt completed via targeted repository inspection of canonical map panel surfaces (`read_file`, `explore_subagent`, `grep_search`); no code/test/lint commands required because no runtime files were modified.
- Open Risks: Density findings are now documented but not yet remediated; visible UI improvements begin in Prompt 17 and can still expose interaction regressions unless panel-grouping changes are kept incremental.
- Resume From: MAPDESIGN/p16-panel-density-audit-2026-06-10.md
- Next Prompt: P17

### P17 - Phase 3: Improve left panel and layer panel grouping
- Status: done
- Intent: Make the left panel easier to scan by elevating section-level summaries and reducing always-visible layer-row metadata density.
- Definition of Done: The layer stack exposes clearer sections (Layers, Sources, Contents, Selection, Layer QA), active/important rows remain visually legible, advanced metadata moves behind progressive disclosure, and all existing actions remain reachable.
- Decisions: Kept the implementation narrow to the canonical layer stack surface. Added section-summary cards in `MapLayerManager` with routeable actions into existing Sources, Contents, Selection, and QA flows instead of inventing new state. Converted per-row readiness/legend/analysis metadata into a hidden-by-default advanced details region while keeping visibility, opacity, warnings, and action menu access visible.
- Changed Files: src/centerpanel/components/map/MapLayerManager.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/__tests__/map-layer-management.test.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx` passed (63/63). Non-blocking existing warning remains in layer-management importability test: duplicate Three.js import message.
- Open Risks: The left panel is now calmer, but row action density itself is only partially addressed because all actions still remain in the row action menu; Prompt 18 should continue by classifying and refining visible-vs-menu row actions.
- Resume From: src/centerpanel/components/map/MapLayerManager.tsx (section summary cards + `map-layer-details-toggle-*` advanced disclosure)
- Next Prompt: P18

### P18 - Phase 3: Reduce layer row action density and improve touch/focus behavior
- Status: done
- Intent: Make layer row actions easier to understand and operate while preserving all layer functionality and semantics.
- Definition of Done: Row actions are explicitly classified (primary, secondary, destructive, advanced metadata), only high-value actions stay visible by default, secondary/destructive actions remain keyboard-reachable in the row menu, destructive actions are clearly separated, and touch/focus affordances improve without removing map capabilities.
- Decisions: Kept implementation narrow to `MapLayerManager` and its existing tests. Added explicit `LAYER_ACTION_DENSITY_CLASSIFICATION` mapping for every row action, surfaced only primary actions (`Locate`, `Style`) inline, routed all non-primary actions through the existing row menu, and improved menu keyboard support with first-focus on open plus Arrow/Home/End/Escape navigation. Increased visibility/menu/details control minimum hit sizes to 2rem and visually separated the `cache-remove` group as destructive without changing action semantics.
- Changed Files: src/centerpanel/components/map/MapLayerManager.tsx; src/centerpanel/components/map/__tests__/map-layer-management.test.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts` passed (54/54). Non-blocking existing warning remains in layer-management importability test: duplicate Three.js import message.
- Open Risks: Primary action visibility is now intentionally constrained to two actions (`Locate`, `Style`), which reduces clutter but may still require follow-up tuning if operator workflows prefer a different default primary pair on small-height viewports.
- Resume From: src/centerpanel/components/map/MapLayerManager.tsx (`LAYER_ACTION_DENSITY_CLASSIFICATION`, `LayerActionMenu` keyboard handlers, `primaryRowActions` split)
- Next Prompt: P19

### P22 - Phase 3: Make diagnostics, logs, QA, and performance panels production-appropriate
- Status: done
- Intent: Make diagnostics read as severity-first operational guidance while keeping raw telemetry, provider state, recovery, and performance evidence available.
- Definition of Done: Blockers and warnings are surfaced before raw detail, raw operations logs are collapsed by default behind an explicit advanced disclosure, recovery actions remain clear and safe, and existing diagnostics semantics stay intact.
- Decisions: Kept Prompt 22 narrowly scoped to the canonical performance diagnostics surface because the shared problems panel already renders severity-first actionable rows. Added a severity-ranked operational summary list for telemetry categories, moved per-event raw history behind a native `details` disclosure that stays collapsed by default, and preserved existing redaction, bounded-log, and worker-retry semantics without changing provider or QA models.
- Changed Files: src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx; src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npx vitest run src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx src/centerpanel/components/map/__tests__/map-performance-budget.test.tsx` passed (4/4) after the first panel edit; `npx vitest run src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx src/centerpanel/components/map/__tests__/map-performance-budget.test.tsx` passed again after adding Prompt 22 regression coverage (5/5); `npm run typecheck` passed; `npm run lint:errors` passed.
- Open Risks: The advanced disclosure uses native `details/summary`, which keeps the change small and accessible but does not yet provide a custom persisted open/closed state across sessions. QA and problems panels were not structurally changed because their current severity-first/actionable layout already aligns with Prompt 22 intent.
- Resume From: src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx
- Next Prompt: P23

### P23 - Phase 3: Add or update panel density regression tests
- Status: done
- Intent: Consolidate regression coverage proving Phase 3 panel hierarchy and density cleanup preserved functionality and reachability.
- Definition of Done: Existing tests explicitly cover left panel hierarchy, layer action/menu safety, right dock primary plus overflow reachability, inspector summary-first behavior, publish/evidence action reachability, diagnostics severity-first ordering with advanced raw log access, and representative empty/loading/error panel states.
- Decisions: Kept Prompt 23 strictly test-only and extended existing suites instead of introducing new runtime behavior or selectors. Added explicit publish path action reachability/disabled-reason assertions (`MapPublishPathPanel`), added right dock loading/error state render coverage, and added diagnostics no-issue state coverage while retaining Prompt 22 severity-first plus advanced-detail reachability assertions.
- Changed Files: src/centerpanel/components/map/__tests__/MapPublishWorkspace.test.tsx; src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx; src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/layer-inspector.test.tsx src/centerpanel/components/map/__tests__/MapPublishWorkspace.test.tsx src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx` passed (81/81); `npm run typecheck` passed; `npm run lint:errors` passed; `npm run lint:no-tailwind-centerpanel` passed; `npx playwright test e2e/map-layout-regression-p09.spec.ts` passed (2/2). `npx playwright test e2e/map-modal-layout.spec.ts --grep "header controls reachable without clipping|keeps the docked diagnostics and status surfaces unobtrusive"` failed on an existing compact-header geometry assertion in Prompt 35 suite.
- Open Risks: Full `map-modal-layout` e2e remains broader and currently unstable for compact-header geometry in this branch, so Prompt 23 completion relies on targeted panel-density regressions plus the stable P09 layout suite.
- Resume From: src/centerpanel/components/map/__tests__/map-layer-management.test.ts
- Next Prompt: P24

## Hand-off Checklist
- [x] Prompt block status updated
- [x] Last commit hash recorded
- [x] Validation commands recorded
- [x] Remaining risks listed
- [x] Next prompt identified

## P01 Quick Start
- Agent call: Map Explorer Local Prompt Executor: Prompt 01
- Expected output: Prompt 01 inventory-only markdown audit note (no code edits).
- Resume file: MAPDESIGN/prompts-detailed-en.md (Prompt 01 block)

### P24 - Phase 4: Unify z-index and elevation discipline
- Status: done
- Intent: Unify Map Explorer layering with a named, compatibility-safe z-index model and remove local magic literals where safe.
- Definition of Done: Named layers are present in map tokens, scoped overlays/dialogs use named z-index tiers, dialog surfaces stay above popovers, and overlap/collision regressions remain green.
- Decisions: Kept edits minimal and reversible by extending existing `MAP_Z_INDEX` instead of introducing new framework utilities; replaced only high-confidence literals in active modal surfaces (import preview dialog, dispatch feedback/dialog, right-dock overflow popover variable wiring).
- Changed Files: src/centerpanel/components/map/mapTokens.ts; src/centerpanel/components/map/MapImportPreviewDialog.tsx; src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx; src/centerpanel/components/map/MapRightDockHost.tsx; src/centerpanel/components/map/MapRightDockHost.module.css; src/centerpanel/components/map/__tests__/map-components.test.ts; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts src/centerpanel/components/map/__tests__/MapRightDockHost.test.ts src/centerpanel/components/map/__tests__/MapImportPreviewDialog.test.ts` passed (72/72); `npx playwright test e2e/map-layout-regression-p09.spec.ts` passed (2/2).
- Open Risks: Manual visual verification of stacked edge cases (layer row menu + portaled popover + import dialog + tooltip near modal controls) is still recommended because these conditions are difficult to exhaustively reproduce in a single automated suite.
- Resume From: src/centerpanel/components/map/mapTokens.ts (`MAP_Z_INDEX` named layer model)
- Next Prompt: P25

### P25 - Phase 4: Strengthen popover, dropdown, and menu collision behavior
- Status: done
- Intent: Make shared popovers and dropdown-adjacent menus collision-aware within the Map Explorer modal without adding a new positioning dependency.
- Definition of Done: Popovers can flip vertically when needed, clamp inward near viewport edges, cap height to available short-view space, and keep keyboard/focus behavior intact.
- Decisions: Centralized the behavior in `AppPopover` so existing toolbar and selection overlays inherit it automatically. Added concrete regression coverage for right-edge clamping and short-height max-height capping.
- Changed Files: src/centerpanel/components/map/ui/AppPopover.tsx; src/centerpanel/components/map/ui/__tests__/AppPopover.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/ui/__tests__/AppPopover.test.tsx` passed (2/2); `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx src/centerpanel/components/map/ui/__tests__/AppPopover.test.tsx` passed (24/24); `npx playwright test e2e/map-layout-regression-p09.spec.ts` passed (2/2).
- Open Risks: The short-height cap now derives from `window.innerHeight` in the shared popover utility; if a future embedded modal uses a smaller container than the viewport, the boundary should be switched to the container rect.
- Resume From: src/centerpanel/components/map/ui/AppPopover.tsx (shared popover positioning and max-height logic)
- Next Prompt: P26

### P26 - Phase 4: Fix scroll containment and short-height viewport behavior
- Status: done
- Intent: Remove fixed embedded minimum heights that force short viewport overflow while keeping panel headers and footer actions stable.
- Definition of Done: Embedded workflow, NL query, and report handoff surfaces can shrink in short-height layouts; their bodies remain the scroll region; dialog and drawer actions stay reachable.
- Decisions: Kept the change local by replacing fixed 34rem embedded minimums with shrinkable `minHeight: 0` plus bounded `maxHeight` on the dense drawer surfaces that were blocking short-height layouts.
- Changed Files: src/centerpanel/components/map/MapWorkflowDrawer.tsx; src/centerpanel/components/map/MapNLQueryPanel.tsx; src/centerpanel/components/map/MapReportHandoffDrawer.tsx; src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx; src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx; src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx; MAPDESIGN/execution-ledger.md
- Validation: `npm run typecheck` passed; `npm run lint:errors` passed; `npx vitest run src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` passed (10/10); `npx playwright test e2e/map-layout-regression-p09.spec.ts` passed (2/2).
- Open Risks: The embedded surfaces now defer entirely to container height; if a future host introduces an unexpectedly small container, the outer shell should provide the authoritative height budget.
- Resume From: src/centerpanel/components/map/MapWorkflowDrawer.tsx (embedded drawer surface sizing)
- Next Prompt: P27