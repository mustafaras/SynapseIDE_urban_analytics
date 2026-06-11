# MAP_PREMIUM — Detailed Agent Execution Prompts (single file)

Pack: MAP_PREMIUM
Plan source: `mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md`
Ledger: `LEDGER.md` · Anti-amnesia: `07_ANTI_AMNESIA_LEDGER.md`
Trigger file: `02_TRIGGER_PROMPTS.md` · Manifest: `prompts.json`

Rules that apply to every prompt below:

- Read `AGENTS.md`, the plan sections named in the prompt, and `LEDGER.md` before editing.
- Implement only the selected prompt. Every numbered item under "Visible changes" is a deliverable, not a suggestion.
- Each prompt must end with the user being able to SEE the change: no invisible refactor-only outcomes.
- Reuse existing handlers, store actions, routes, and services. No new business logic in UI shells. No new dependencies.
- Never violate: CRS truthfulness, QA/evidence semantics, `exactOptionalPropertyTypes`, no Tailwind in `centerpanel/`, no direct `localStorage`, no heavy geometry in persisted state.
- After implementation: run the prompt's validation commands, then update `LEDGER.md` (status + Done Log row + Current Pointer) in the same change.

---

## Prompt 01 — Premium shell foundation and token system

Plan binding: sections 0, 5, 6, 12, 14; Phase 1.

Goal: Establish the GeoLibre-inspired premium shell — grid, tokens, CSS module, safe insets, responsive helpers — so the modal immediately reads as a map-first desktop GIS workspace before any panel redesign.

Target files:
- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/mapLayoutTokens.ts`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/shell/MapPremiumShell.module.css` (new)
- `src/centerpanel/components/map/shell/mapShellResponsive.ts` (new)
- `src/centerpanel/components/map/shell/index.ts` (new)

Pre-work (do first, no behavior change): confirm which files own the visible shell, list the tests guarding them, and note the riskiest seams in the ledger.

Visible changes (all required):
1. The modal root uses a three-row CSS grid: menu row, workspace, status row (`--map-menu-h`, `--map-status-h`).
2. The workspace uses a four-column grid: activity rail, left panel, canvas, right dock with token-driven widths.
3. Shell background becomes near-black charcoal with visibly lighter panel surfaces.
4. Panel borders become low-contrast hairlines; the active panel boundary is visibly stronger.
5. One cool blue/teal accent color is reserved for active states; amber/decorative accents disappear from the shell chrome.
6. Panels use modest 6–10 px radii; controls use 4–6 px radii, consistently.
7. Glow/heavy shadows are removed; depth comes from layering and borders.
8. Typography tightens: compact professional sans for UI, monospaced micro-labels for coordinates/CRS readouts.
9. The top row becomes visibly slimmer than the current command surface.
10. The bottom row becomes a visibly compact status strip placeholder (full redesign in Prompt 06).
11. A shared safe-inset model (`MapShellSafeInsets`) visibly pads all floating canvas furniture away from panels.
12. Panel gutters and internal paddings are standardized to token values; ad hoc margins in the shell disappear.
13. The map canvas visibly dominates the default open state (panels no longer crowd it).
14. Left panel width is visibly clamped to `--map-left-min`/`--map-left-w` tokens.
15. Right dock width is visibly clamped to `--map-right-min`/`--map-right-w` tokens.
16. The bottom output area is collapsed by default; no idle placeholder strip remains.
17. Responsive breakpoints (1440 / 1200 / 900) visibly change shell composition per the plan's panel visibility table.
18. Scrollbars inside panels adopt a consistent slim style.
19. `:focus-visible` rings are consistent across all shell-level interactive elements.
20. Under `prefers-reduced-motion`, all shell transitions are visibly disabled.
21. Under forced-colors mode, shell boundaries remain visible and usable.
22. The modal frame (outer edge, header treatment) is visibly cleaner — desktop GIS, not dashboard.

Hard constraints:
- Preserve every existing export used by tests; do not delete tokens — only add premium aliases.
- Do not move business logic; this prompt is layout, tokens, and CSS only.

Validation: `npm run typecheck` · `npm run lint:errors` · `npm run lint:no-tailwind-centerpanel` · `npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx src/centerpanel/components/map/__tests__/mapVisualQA.test.ts src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx`

Acceptance: opening the Map Explorer must look visibly different — cleaner frame, dominant map, clear panel boundaries — with zero features lost. Update `LEDGER.md`.

---

## Prompt 02 — GeoLibre-like top menu bar

Plan binding: sections 2, 7; Phase 2.

Goal: Replace the dense always-visible toolbar impression with a calm, menu-driven command surface of at most 12 menu groups plus a small quick-action cluster.

Target files:
- `src/centerpanel/components/map/MapTopCommandSurface.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/useMapPanelCommands.ts`
- `src/centerpanel/components/map/controllers/useMapCommandHandlers.ts`
- `src/centerpanel/components/map/shell/MapPremiumMenuBar.tsx` (new)
- `src/centerpanel/components/map/shell/mapMenuModel.tsx` (new)

Visible changes (all required):
1. A single-row premium menu bar replaces the dense toolbar as the first visual impression.
2. **Project** menu visible: new/open/save/import/export project, persistence status, reset layout, start dialog.
3. **Add Data** menu visible: local files, demo packs, catalog, services, raster, vector, temporal, scene sources.
4. **Layers** menu visible: new layer, visibility, lock, opacity, reorder, identify, CRS, metadata, schema, source health.
5. **Style** menu visible: renderer, symbols, labels, legend, cartography advisor, recommendations.
6. **Analyze** menu visible: data operations, statistics, spatial statistics, processing toolbox, model builder, NL query.
7. **Scene** menu visible: 3D, terrain, sun/shadow, zoning, massing, temporal scene, raster scene.
8. **Publish** menu visible: layout designer, figure composer, export, offline package, report handoff, publication marks.
9. **Review** menu visible: review timeline, comments, evidence, QA issues, collaboration.
10. **Controls** menu visible: search, bookmarks, pins, selection, drawing, measurement, keyboard controls, map furniture.
11. **Plugins** menu visible: plugin panel, extension registry, integrations.
12. **View** menu visible: left panel, right inspector, bottom drawer, map-only mode, density, panel widths, responsive reset.
13. **Help** menu visible: diagnostics, performance, accessibility, command palette, keyboard shortcuts.
14. 4–6 contextual quick actions appear right of the menus — current high-frequency workflow commands only.
15. Each menu opens a keyboard-navigable dropdown with visible focus, Escape close, and proper popup labeling.
16. Destructive actions are visibly placed behind menus or confirmations, never as bare top-row buttons.
17. View menu shows visible checked state for currently open panels/routes.
18. Below 1440 px, menu labels visibly compact; below 1200 px, icons + selected label; below 900 px, a single compact menu button.
19. The legacy dense toolbar no longer dominates: it is demoted to an internal provider or hidden-by-default surface.
20. Command palette remains reachable (shortcut + Help menu) and visibly lists the same commands.
21. Disabled menu items show a visible reason (`title`/described-by), never silently dead.
22. The whole first row reads calm and premium: at most 13 top-level buttons including quick actions.

Hard constraints:
- Every menu item calls an existing handler from `useMapCommandHandlers`, `useMapPanelCommands`, right-dock routing, or store actions. No duplicated business logic.
- Keep all toolbar command availability; nothing becomes unreachable.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts`

Acceptance: the top row looks like a professional GIS product; every old command is discoverable by category. Update `LEDGER.md`.

---

## Prompt 03 — Left Layers/Data workspace

Plan binding: section 8; Phase 3.

Goal: Redesign the left side into a GeoLibre-style Layers/Data workspace with tabs `Layers | Contents | Catalog | Sources | Bookmarks` inside one shared dock frame.

Target files:
- `src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx` + `.module.css`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx` + `.module.css`
- `src/centerpanel/components/map/mapLeftPanelContracts.ts`
- `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx` (new)

Visible changes (all required):
1. The entire left side is wrapped in one `MapDockPanelFrame` with title, subtitle, actions, and collapse affordance.
2. Visible tab strip: `Layers | Contents | Catalog | Sources | Bookmarks`.
3. A compact header shows: panel title, active workspace name, layer count, and CRS warning count.
4. Layer rows show a clear type icon, name, and a small geometry/type chip.
5. Every layer row has an inline visibility toggle.
6. Every layer row has an opacity mini-control (slider or stepper in row/overflow).
7. Advanced row actions (zoom-to, attribute table, inspect, duplicate, remove, repair, CRS) move into a row overflow menu.
8. Row heights are standardized: 32–38 px dense, 40–44 px comfortable, switchable from the View menu density setting.
9. Drag-to-reorder shows a visible drop indicator and preserves render-order semantics.
10. The active layer row carries a visible accent inset (left border), not a filled card.
11. QA/CRS badges per row are simplified to compact semantic chips with tooltips.
12. Source health (restored/recoverable/unavailable/external/demo) is a visible per-row indicator.
13. The Contents tree is visually distinct from the Layers list — hierarchy, groups, scale ranges readable.
14. Catalog entries render as consistent compact rows/cards matching the panel frame, not a separate visual world.
15. The empty state is useful and visible: "Drop files on the map or use Add Data" with a working Add Data action.
16. Dragging files over the panel/canvas shows a premium, explicit drop state.
17. At narrow widths the panel collapses to an icon-only activity rail plus a slide-over drawer.
18. A search/filter field at the top of the Layers tab visibly filters rows.
19. The Bookmarks tab lists bookmarks/pins with zoom-to actions.
20. A slim footer line shows selection count / visible-layer count.
21. Sources tab exposes source handles with restore state and repair/reconnect actions.
22. All five tabs respect the existing width contracts (`mapLeftPanelContracts.ts`) with no clipped content at contract widths.

Hard constraints:
- Layer visibility, opacity, reorder, select, identify, schema, metadata, CRS, and source behavior must call existing paths.
- Catalog insertion and contents-tree semantics unchanged. Keep `map-left-panel-contracts.test.ts` and layer-management tests meaningful.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx src/centerpanel/components/map/__tests__/MapContentsModel.test.ts src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts`

Acceptance: the left side reads as a premium professional GIS layer/data panel. Update `LEDGER.md`.

---

## Prompt 04 — Right premium Inspector dock

Plan binding: section 9; Phase 4.

Goal: Convert the right dock into one coherent premium inspector system hosting `Inspector | Style | QA | Workflow | Publish | Review | Diagnostics`.

Target files:
- `src/centerpanel/components/map/MapRightDockHost.tsx` + `.module.css`
- `src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx`
- `src/centerpanel/components/map/mapRightDockRoutes.ts`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/controllers/useMapRightDockRouting.ts`
- `src/centerpanel/components/map/inspector/MapInspectorHost.tsx`
- `src/centerpanel/components/map/inspector/LayerInspector.tsx`
- `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx`
- `src/centerpanel/components/map/style/MapStyleWorkspace.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`

Visible changes (all required):
1. The right dock uses the shared `MapDockPanelFrame` visual model — one panel language for all routes.
2. The dock header shows the route title and a semantic status badge.
3. Header actions visible: close, collapse, pin, and a "more" overflow menu.
4. Route tabs render as a compact segmented control at wide widths.
5. Route tabs switch to a vertical icon rail at narrow dock widths.
6. The Inspector route body adopts the premium frame: consistent sections, property grids, no cockpit clutter.
7. The Style route uses consistent form controls, section headers, and a live legend preview inside the same frame.
8. The QA route shows severity with consistent semantic chips (never color-only).
9. The Workflow route renders inside the same frame with the same header/body discipline.
10. The Publish route renders inside the same frame, including readiness chips.
11. The Review route renders inside the same frame with timeline rows restyled to the panel language.
12. The Diagnostics route is visually differentiated (calm, technical) but not alarming unless errors exist.
13. Panel bodies use one predictable padding and scroll strategy — no double scrollbars.
14. All state chips in the dock use the semantic status tokens from Prompt 01.
15. Every route has a designed empty state (no blank bodies).
16. Dock width visibly respects `mapDocking.ts` bounds with a working resize affordance.
17. On medium screens (1200–1439) the dock becomes a visible overlay drawer over the map.
18. Opening a route moves focus into the dock; closing returns focus to the invoking control — visibly correct.
19. Contextual routes (Inspector/Style) and diagnostic routes (QA/Diagnostics) are visibly grouped in the tab order.
20. The "more" menu exposes any route that does not fit the visible tab strip — nothing hidden.
21. Route open/close/switch announcements continue working (visible to screen readers, testable).
22. Close buttons name their panel ("Close Inspector", "Close QA"), visible in the accessibility tree.

Hard constraints:
- `mapRightDockRoutes.ts` stays the source of truth; no route deleted. Migrated bottom-tab routing untouched.
- QA, diagnostics, workflow, and publish behavior unchanged — presentation only.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts src/centerpanel/components/map/__tests__/MapStyleWorkspace.test.tsx src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts`

Acceptance: the right dock reads as one cohesive premium Inspector system. Update `LEDGER.md`.

---

## Prompt 05 — Canvas furniture and safe-inset cleanup

Plan binding: sections 6.4, 10; Phase 5.

Goal: Make the map canvas visually dominant: collapse floating controls into control islands and route every overlay through the shared safe-inset model.

Target files:
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapCanvasControls.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapSelectionTools.tsx`
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx`
- `src/centerpanel/components/map/shell/MapCanvasControlDock.tsx` (new)

Visible changes (all required):
1. One `MapCanvasControlDock` island appears in a single predictable corner (top-right) holding primary controls.
2. Zoom in/out controls are consolidated into the dock.
3. Compass/north arrow lives in the dock with reset-bearing on click.
4. Search becomes a compact capsule that expands on focus — it no longer competes with the menu bar.
5. The legend becomes a collapsible card pinned to a predictable corner.
6. The scale bar sits in a fixed corner inside safe insets.
7. Attribution is compact and inset-aware.
8. Drawing tools appear as a contextual tool tray only while a draw tool is active.
9. Measurement readouts appear as a contextual tray near the dock, not a floating card mid-canvas.
10. Selection tools group into one visible cluster with active-state indication.
11. Bookmark/pin quick chips occupy one consistent slot.
12. The temporal player strip aligns to the bottom safe inset and never overlaps the status bar.
13. Scene/3D interaction strips align to the same safe-inset system.
14. Workflow preview overlays visibly avoid the control dock and panel edges.
15. The map context menu adopts the premium visual language (radii, hairlines, typography).
16. Drag-and-drop shows a premium full-canvas drop state with file-type hints.
17. The empty-map state visibly invites action: Add Data button + drag-drop hint, centered, calm.
18. Keyboard fallback controls remain visible/discoverable and adopt the shell styling.
19. A monospaced cursor coordinate readout has one fixed home (status bar or dock edge), not floating.
20. Overlay z-index discipline is visible: no overlay overlaps another at default and medium widths.
21. A map-only mode toggle is visible on the canvas (full behavior wired in Prompt 09 if not yet present).
22. All canvas furniture visibly shifts when panels open/close (insets recalculated live).

Hard constraints:
- Do not break drawing, measurement, selection, legend, search, bookmark, temporal, or 3D overlay behavior.
- Keyboard fallback controls must remain reachable.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`

Acceptance: the canvas immediately looks cleaner; controls form intentional islands; nothing overlaps. Update `LEDGER.md`.

---

## Prompt 06 — Compact status bar and output drawer

Plan binding: section 11; Phase 6.

Goal: Turn the bottom edge into a compact semantic status strip plus an on-demand expandable output drawer (`Attributes | Timeline | Problems | Logs | Evidence | Review | Reports`).

Target files:
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx`
- `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `src/centerpanel/components/map/problems/MapProblemsPanel.tsx`
- `src/centerpanel/components/map/problems/mapProblemsModel.ts`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/shell/MapBottomOutputDrawer.tsx` (new)

Visible changes (all required):
1. The status bar has a fixed compact height (token-driven), visibly lighter than today.
2. A CRS chip shows the active/display CRS; clicking routes to CRS/QA surfaces.
3. A scale readout is visible and updates with zoom.
4. Cursor coordinates render in monospaced micro-type and update live.
5. A selection count chip appears when features are selected; click opens the selection route.
6. A QA chip shows aggregate severity; click opens the QA route or Problems tab.
7. A sync/persistence indicator shows project save state.
8. A render/perf indicator is visible; click opens diagnostics.
9. A tasks chip shows running background jobs with count.
10. Every actionable chip visibly routes to a right-dock route or drawer tab; non-actionable text is static.
11. Long status text truncates with tooltip/title — no overflow breakage.
12. Low-priority chips collapse into a visible overflow menu at narrow widths.
13. A new bottom output drawer opens with tabs: `Attributes | Timeline | Problems | Logs | Evidence | Review | Reports`.
14. The drawer is collapsed by default — the map keeps its space.
15. The drawer has a visible resize handle with sane min/max.
16. The drawer remembers and restores its last active tab.
17. The attribute table renders inside the drawer only on demand, targeting the selected/active layer.
18. The Problems tab lists issues as consistent severity rows with click-through to the source surface.
19. Timeline and Review render inside the drawer using the premium panel language.
20. On medium viewports the drawer visibly overlays the map instead of shrinking it.
21. Status chips use the shared semantic tokens — consistent with dock and panels.
22. Opening/closing the drawer moves focus correctly and Escape closes it.

Hard constraints:
- Preserve attribute table, timeline, problems, evidence, review, diagnostics routing. Status chips must remain accurate — never decorative.
- Do not reintroduce a persistent heavy bottom workspace.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx src/centerpanel/components/map/__tests__/MapReviewTimelinePanel.test.tsx src/centerpanel/components/map/__tests__/mapProblemsPanel.test.tsx`

Acceptance: the bottom edge feels light and precise; output content is on demand. Update `LEDGER.md`.

---

## Prompt 07 — Start, import, export, publish polish

Plan binding: Phase 7; sections 12, 16.

Goal: Make first-run, import/export, and publish workflows visually match the premium shell while keeping every preflight, warning, and readiness rule truthful.

Target files:
- `src/centerpanel/components/map/MapStartDialog.tsx` + `.module.css`
- `src/centerpanel/components/map/MapImportPreviewDialog.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/publish/MapPublishWorkspace.tsx`
- `src/centerpanel/components/map/publish/MapPublishOutputInventory.tsx`
- `src/centerpanel/components/map/publish/MapPublicationMarksPanel.tsx`
- `src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx`
- `src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx`

Visible changes (all required):
1. The start dialog becomes a clean GIS launcher: compact hero-free layout, dense typography, clear hierarchy.
2. Recent workspaces render as a scannable list with timestamps.
3. Primary actions (new workspace / open / import data) are visibly dominant and consistent.
4. Demo data entries carry an explicit, visible DEMO/SYNTHETIC label.
5. The import preview shows clear file-type cards/rows per detected format.
6. CRS warnings in import preview are visible, named, and styled with semantic tokens.
7. Field/schema preview in import is readable: column names, types, sample values.
8. Import progress and skipped-row states are visible and truthful.
9. The export dialog adopts the same panel frame, buttons, and footer as the rest of the shell.
10. The publish workspace renders as visible stepper sections (content → readiness → output).
11. Publication readiness chips are visible per requirement, semantic-colored, never color-only.
12. Every publish blocker is named with a visible recommended fix.
13. The output inventory shows included/excluded layers and sources with truthful notes.
14. The report handoff drawer matches the premium drawer language (header, sections, chips).
15. The layout designer panel adopts the shared panel frame and section hierarchy.
16. The figure composer matches the same visual language, with visible blockers before export.
17. The publication marks panel matches the panel language.
18. The offline package flow shows visible embedded vs unavailable source counts.
19. All dialogs share one footer pattern: secondary left, primary right, consistent sizes.
20. First-run typography/spacing is visibly premium: no oversized empty regions, no internal double scroll.
21. Escape/close behavior is consistent and focus returns to the invoking control in every dialog.
22. Import/export/publish entry points from the new menu bar (Prompt 02) visibly open these polished surfaces.

Hard constraints:
- Preserve import preflight, CRS warnings, export inventory, offline package rules, publication readiness, report handoff behavior. Never weaken a blocker.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapStartDialog.test.tsx src/centerpanel/components/map/__tests__/map-start-dialog-state.test.ts src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx src/centerpanel/components/map/__tests__/MapPublishWorkspace.test.tsx src/centerpanel/components/map/__tests__/MapPublishOutputInventory.test.tsx src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx src/centerpanel/components/map/__tests__/MapLayoutDesignerPanel.test.tsx`

Acceptance: first-run and delivery flows look like the same premium product. Update `LEDGER.md`.

---

## Prompt 08 — Advanced panels visual normalization

Plan binding: Phase 8; section 16.

Goal: Apply the shared premium panel language to all advanced tool panels without changing any algorithm, service call, or route.

Target files:
- `src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx`
- `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx`
- `src/centerpanel/components/map/processing/ToolParameterForm.tsx`
- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`
- `src/centerpanel/components/map/plugins/MapPluginPanel.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/centerpanel/components/map/scene3d/Scene3DPanel.tsx`
- `src/centerpanel/components/map/scene3d/SunShadowPanel.tsx`
- `src/centerpanel/components/map/raster/RasterLayerPanel.tsx`
- `src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx`
- `src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx`

Visible changes (all required):
1. Analyze workspace adopts the shared panel frame and section hierarchy.
2. Processing toolbox adopts the frame; tool list rows match left-panel row language.
3. Tool parameter forms use the shared form controls, labels, and spacing.
4. Model builder panel adopts the frame; graph/steps area visually integrated.
5. Plugin panel adopts the frame; extension rows match the row language.
6. Workflow drawer adopts the premium drawer language with consistent header and progress.
7. NL query panel adopts the frame; confirmation/guardrail states visibly styled.
8. Scene3D panel adopts the frame; mode switcher and inspector consistent.
9. Sun/shadow panel adopts the frame; hour chips match the chip system.
10. Raster panel adopts the frame; histogram/legend visually consistent.
11. Zoning rules panel adopts the frame.
12. Massing scenario panel adopts the frame; comparison table consistent.
13. All section headers use one shared header primitive across these panels.
14. All run/execute buttons share one visual style and disabled-reason pattern.
15. All progress indicators share one progress primitive (reduced-motion safe).
16. All blocked/caveat states render as consistent semantic chips with named reasons, visible before run.
17. All empty states use the shared empty-state primitive.
18. All tabs/chips inside these panels match the dock tab/chip system.
19. Runtime-mode chips (main-preview / worker / geos-wasm / duckdb / demo) are visually consistent everywhere.
20. Decorative density visibly drops: no cards-in-cards, no redundant frames, thinner separators.
21. Every advanced panel remains reachable from the menu bar and/or dock routes — visibly listed.
22. Panel close buttons name their panel and return focus correctly.

Hard constraints:
- Zero behavior change in processing/model/plugin/NL/3D/raster/zoning services. Never hide a tool without a menu/route path. Preserve all state and route semantics.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/MapAnalyzeWorkspace.test.tsx src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx src/centerpanel/components/map/__tests__/MapProcessingToolboxDesign.test.tsx src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx src/centerpanel/components/map/__tests__/MapPluginPanel.test.tsx src/centerpanel/components/map/__tests__/Scene3DPanel.test.tsx src/centerpanel/components/map/__tests__/RasterLayerPanel.test.tsx src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx`

Acceptance: every advanced tool looks like part of one product. Update `LEDGER.md`.

---

## Prompt 09 — Responsive behavior, accessibility, and map-only mode

Plan binding: sections 13, 14; Phase 9 (first half).

Goal: Deliver the full responsive matrix, the accessibility contract, and a complete reversible map-only mode.

Target files: all `shell/` files, `mapShellResponsive.ts`, `MapWorkspaceShell.tsx`, `mapExperience.ts`, menu bar, dock hosts, drawer, plus accessibility-related test files.

Visible changes (all required):
1. ≥1440 px: menu labels full, left panel visible, right dock visible when routed, drawer collapsed — visibly correct.
2. 1200–1439 px: menu labels compact, right dock becomes overlay drawer — visibly correct.
3. 900–1199 px: left panel collapsible to icon rail, drawer-only bottom output — visibly correct.
4. <900 px: left and right become modal drawers; top menu becomes compact menu button + critical quick actions.
5. Map-only mode hides menu bar, left panel, right dock, and drawer in one visible action.
6. Map-only mode keeps essential controls: scale, attribution, search toggle, and a visible exit button.
7. Exiting map-only restores the exact previous panel/route state — visibly lossless.
8. Keyboard focus order is visibly: menu → left rail → canvas → right inspector → status/output.
9. Escape closes menus and drawers without losing panel state.
10. After any close, focus visibly returns to the invoking control.
11. All dock/panel tabs expose `aria-selected` and `aria-controls` correctly.
12. All collapsible panels expose `aria-expanded`.
13. Every close button names its panel in the accessibility tree.
14. Status chips are buttons only when actionable; static text otherwise — visibly distinguishable.
15. Every hover-only action has a keyboard path (focus reveals the same affordance).
16. Reduced-motion: all nonessential transitions visibly disabled across menu, dock, drawer, canvas furniture.
17. Forced-colors: panels, tabs, chips, and active states remain distinguishable without color.
18. Menu bar uses correct menubar/menu semantics or accessible button+popup labeling.
19. Drawer and dock resizing is keyboard-operable (arrow keys or equivalent) with visible feedback.
20. No overlay collisions at any breakpoint: dock, drawer, control dock, temporal strip, 3D strips all respect insets.
21. The View menu exposes visible toggles for every panel so nothing is unreachable at any width.
22. Density switch (compact/comfortable) visibly affects rows across left panel, dock, and drawer simultaneously.

Hard constraints:
- Improve accessibility, never weaken it. Preserve `GisPrimitive.module.css` forced-colors and reduced-motion support.

Validation: `npm run typecheck` · `npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts` · if dev server available: `npx playwright test e2e/accessibility-audit.spec.ts`

Acceptance: the shell works at every width, fully keyboard-operable, with a flawless reversible map-only mode. Update `LEDGER.md`.

---

## Prompt 10 — Full regression, visual QA, and ledger closeout

Plan binding: sections 17, 18 (Prompt 10), 20, 21; Phase 9 (gate).

Goal: Prove the redesign is visible, accessible, and behavior-safe; close the pack honestly.

Verification targets (all must be visibly checked, not assumed):
1. Every old toolbar command has a menu, quick action, palette entry, or panel route — spot-check at least the 12 menu groups.
2. Every old right-dock panel has a working dock route.
3. Every old bottom tab has a drawer tab or migrated route.
4. Drawing tools work end-to-end.
5. Measurement works end-to-end with geodesic caveats intact.
6. Layer visibility, opacity, and reorder work from the new left panel.
7. The attribute table opens for the selected layer from drawer/status chip.
8. CRS warning flow is visible from layer row → QA route.
9. Scientific QA panel reachable and truthful.
10. Publish workflow reachable with readiness chips correct.
11. Report handoff reachable and unchanged in payload.
12. Processing toolbox reachable; one reference tool runs with manifest.
13. Model builder reachable.
14. Plugin panel reachable.
15. 3D, temporal, raster, zoning, massing panels reachable and consistent.
16. Map is visually dominant on default open (screenshot proof if Playwright available).
17. Top menu is simple and premium (screenshot proof).
18. No canvas control overlaps panels/status/drawer at 1440, 1200, 1024 widths.
19. Drag/drop overlay visible and polished.
20. Empty, loading, disabled, error, and warning states visually consistent across panels.
21. Keyboard pass: menu → panels → canvas → dock → drawer reachable; Escape behavior correct.
22. Reduced-motion and forced-colors passes confirmed.

Required commands (run all; record outcomes truthfully):
- `npm run typecheck`
- `npm run lint:errors`
- `npm run lint:no-tailwind-centerpanel`
- `npx vitest run src/centerpanel/components/map`
- `npx vitest run src/services/map` (only if any service props/types were touched)
- `npm run build`
- If dev server available: targeted Playwright specs for modal layout, accessibility, and any new visual QA spec.

Hard constraints:
- Do not accept visual-only success if any function is unreachable. Do not claim a pass for a command that did not run — record blockers explicitly.

Output: a closeout note in `LEDGER.md` with what changed, files changed, tests run with real outcomes, known risks, and remaining follow-ups. Mark Prompt 10 done only if every gate above passed or every failure is explicitly logged as a blocker.
