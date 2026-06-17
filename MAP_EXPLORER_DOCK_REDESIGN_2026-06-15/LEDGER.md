# LEDGER — Progress Ledger (Anti-Amnesia)

> **Read this FIRST every session. Update it LAST before exiting.** A track is `done` only with evidence (a test-summary file in `evidence/` or a screenshot path). Never write `done` without an `evidence` link. This ledger is the single human-readable source of truth for "where are we"; [STATE.json](STATE.json) is its machine mirror — keep them in sync.

**Overall status:** `IN PROGRESS` — p00-p13 complete (badge/status-language phases + dock-state unification + draw first-click fix + premium drawing modal + rectangle-AOI bounds-clipped real fetch + AOI analysis/evidence dispatch + floating right-dock shell + right-panel single-column conversion + right-dock motion + left-dock single-column conversion closed; next action p14).

Status values: `pending` · `in_progress` · `done` · `blocked`

| Phase | Title | Track A (Functional) | A | Track B (Visual) | B | Phase closed |
|---|---|---|---|---|---|---|
| p00 | Discovery & baseline | Architecture map + test inventory | **done** | 5 baseline screenshots | **done** | ☑ |
| p01 | Token foundation | Badge policy test + status tokens | **done** | Status-language preview shots | **done** | ☑ |
| p02 | Badge cleanup: right dock | Remove routeStatus chip noise | **done** | Right-dock header shots | **done** | ☑ |
| p03 | Badge cleanup: global | De-round 11 offender files | **done** | Workspace/scene/table shots | **done** | ☑ |
| p04 | Dock-state unification | Converge on route model | **done** | Behavior-parity shots (4 surfaces) | **done** | ☑ |
| p05 | Draw first-click fix | Open on first click + wiring | **done** | First-click open shot | **done** | ☑ |
| p06 | Draw premium modal | a11y roles + disabled logic + tests | **done** | Premium drawing modal shots | **done** | ☑ |
| p07 | AOI → fetch data | Rectangle bounds → data fetch | **done** | Fetch-data flow shots | **done** | ☑ |
| p08 | AOI → analysis | Compatible flows → evidence | **done** | Analysis dispatch shots | **done** | ☑ |
| p09 | Right dock floating modal | Drag + resize + clamp + persist | **done** | Moved/resized modal shots | **done** | ☑ |
| p10 | Right dock single-click | One-click open + state cleanup | **done** | One-click open shot | **done** | ☑ |
| p11 | Right panel single-column | Remove dual-column | **done** | Single-column shots | **done** | ☑ |
| p12 | Right dock motion | Motion test + reduced-motion behavior | **done** | Animated open/close | **done** | ☑ |
| p13 | Left dock single-column | Workspace single-column | **done** | Data/Add Data shots | **done** | ☑ |
| p14 | Models recompose | Single-column builder | pending | (support shots) | pending | ☐ |
| p15 | Models premium visual | (support shots) | pending | Readable Models flow | pending | ☐ |
| p16 | Status overflow fix | Overflow measurement/popover | pending | (support shots) | pending | ☐ |
| p17 | Status premium | VS Code interactions | pending | Status bar + More shots | pending | ☐ |
| p18 | Consistency pass | Density/a11y/reduced-motion | pending | Cross-surface QA shots | pending | ☐ |
| p19 | Final RC gate | Full gate + archive | pending | Before/after sweep | pending | ☐ |

---

## Session log

### 2026-06-15 — Pack authored (no code changed)
- Deep architecture sweep completed; findings captured in `PLAN.md §1`.
- Verified facts: right-dock width MIN=260/MAX=520/collapsed=48 (`mapDocking.ts`); `MapRightDockHost` already resizes width but does NOT drag; Draw modal is a `MapDialogShell` gated by legacy `showDrawPanel` (`Core:750`, render `Core:~6130`); topbar Draw button → `onToggleDrawPanel` (`MapToolbar.tsx:1906`) → `handleToggleDrawPanel` (`Core:3884`); in-modal tool buttons → `handleSetDrawTool` (`Core:3856`); "Fetch data" → `handleOpenFlowDispatchDialog`; `GisStatusChip` already square; round badges come from 11 inline-radius files (PLAN §1.7); "ready/Primary" chips from `MapRightDockHost` `routeStatus` (~117-148).
- Identified latent smell: triple overlapping dock-visibility mechanisms (legacy booleans + `getMapDockLayout` derivation + `mapRightDockRoutes`). Folded into p04/p10.
- **Next action:** execute `prompts/p00-discovery.md` (capture baselines + confirm test inventory).

### 2026-06-15 — p00 EXECUTED — both tracks done ✅
- Track A: all 8 guard specs present. Gates: no-Tailwind PASS, typecheck PASS, map suite **825/826** pass.
  - **Pre-existing failure (not ours):** `mapShellPrimitives.test.tsx > "keeps the stable GIS workflow order"` — asserts old 4-item `MAP_PRIMARY_ACTIVITY_ORDER`; working tree's nav model now has 7 (style/analyze/publish added). Treat as the known baseline; fix recommended in p04. Any OTHER failure in later phases = real regression.
  - **Plan correction:** round badges come from the `MAP_RADIUS.full` token (10 of 11 files), not literals → p01's `mapBadgePolicy.test.ts` MUST scan `MAP_RADIUS.full` too.
  - **Env quirk:** `npm run lint:no-tailwind-centerpanel` fails (`'powershell' not found`); run `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` instead.
- Track B: 5 baselines captured + inspected (`baseline/*.png`). **Draw-open bug REPRODUCED**: the "drawings" command dispatches but the modal never opens (`P00_DRAW_OPENED_VIA_COMMAND=false, dispatched=true`) → p04+p05. Right dock = docked rail w/ 3-col grid + round "Full" pills (p09/p11/p02-03). Models tab = cramped 2-col w/ overlapping text + colored badges (p14/p15). Status overflow count=12 but More popover not surfacing items (p16/p17).
  - Capture method: temp spec `e2e/p00-baseline-capture.spec.ts` (deleted at closeout). Gotcha for future agents: keep the shell cwd at repo root — a stray `cd` into a subfolder makes Playwright report "0 tests in 0 files".
- Evidence: `evidence/p00-trackA.md` (+ Track B section), `baseline/*.png`.
- **Next action:** `prompts/p01-token-foundation.md` (apply the `MAP_RADIUS.full` correction to the policy test).

### 2026-06-15 — p01 EXECUTED — both tracks done ✅
- Track A: retuned `MAP_STATUS_TOKENS` (no saturated green/red fills/borders — meaning via muted text tone), added `MAP_RADIUS.badge`, wired `GisStatusChip` to it, created `mapBadgePolicy.test.ts`, refreshed `mapTokenStatus` snapshot.
  - Gates: policy test PASS (5), token test PASS (18), typecheck PASS, color:guard PASS. Full map suite **830/831** (only the known pre-existing `mapShellPrimitives` failure remains — no new regressions).
  - **Correction for p03:** round badges = `MAP_RADIUS.full` in **16 files** + literal radii in **4** (incl. 3 CSS). The policy test's two allowlists (`ROUND_TOKEN_ALLOWLIST`, `ROUND_LITERAL_ALLOWLIST`) are now the authoritative de-round backlog. Many `MAP_RADIUS.full` uses are legit affordances → p03 de-rounds STATUS shapes only and keeps documented affordances.
- Track B: `evidence/p01-status-language.png` (Models tab). Chips now calm — muted clay for blocked, soft muted-green for ready, neutral hairline chips; saturated red/green fills gone. (Models text-overlap persists = p14/p15 dual-column bug, not p01.)
- Evidence: `evidence/p01-trackA.md`, `evidence/p01-status-language.png`.
- **Next action:** `prompts/p02-badge-right-dock.md` (remove unconditional "ready"/"Primary" routeStatus chip from the right-dock header).

### 2026-06-15 — p02 EXECUTED — both tracks done ✅
- Track A: removed unconditional right-dock status-chip stamping (`TIER_STATUS`, `PANEL_STATUS`, `getRouteStatus`) and replaced it with optional live `panelStatus`. `MapExplorerModalRuntimeView` now threads a real QA condition only for `problems` / `qa` / `scientificQA`; primary panels no longer show fabricated "ready" or "Primary" chips.
  - Gates: right-dock host/routes PASS (13), typecheck PASS, lint:errors PASS, no-Tailwind PASS.
- Track B: captured `evidence/p02-right-dock-clean.png` (Inspector header with no status chip) and `evidence/p02-right-dock-condition.png` (Problems header with exactly one calm `3 QA issues` chip).
- Evidence: `evidence/p02-trackA.md`, `evidence/p02-right-dock-clean.png`, `evidence/p02-right-dock-condition.png`.
- **Next action:** `prompts/p03-badge-global.md` (global de-roundification and policy enforcement).

### 2026-06-15 — p03 EXECUTED — both tracks done ✅
- Track A: de-rounded remaining status-like workspace/table/scene/problem/review affordances into calm square/hairline treatments. `mapBadgePolicy.test.ts` now has an empty literal round-radius allowlist; remaining `MAP_RADIUS.full` usages are documented non-status affordances only (cartographic circle glyphs, map pin, collaboration presence dot, swipe handle, circle symbol swatch).
  - Gates: policy/token tests PASS (23), typecheck PASS, lint:errors PASS, color:guard PASS, no-Tailwind PASS, build PASS, build:pages PASS, perf:budgets PASS.
  - Full map suite: **832/833** pass. Only the known p00 baseline failure remains: `mapShellPrimitives.test.tsx > keeps the stable GIS workflow order` expects the old 4-item `MAP_PRIMARY_ACTIVITY_ORDER`; current model has 7.
- Track B: captured `evidence/p03-problems-panel.png`, `evidence/p03-review-timeline.png`, `evidence/p03-attribute-table.png`, `evidence/p03-style-workspace.png`, and `evidence/p03-scene-strip.png`.
- Evidence: `evidence/p03-trackA.md` plus the screenshots above.
- **Next action:** `prompts/p04-dock-state-unification.md`.

### 2026-06-15 — p04 EXECUTED — both tracks done ✅
- Track A: **the right-dock route model is now the single source of truth for dock visibility.** Replaced the three independent Core `useState` booleans (`showSidebar`/`showDrawPanel`/`showMeasurePanel`) with pure route projections (`deriveContextualToolPanelVisibility`) + thin `Dispatch<SetStateAction<boolean>>` setter wrappers that dispatch route open/close (with an optimistic route ref so intra-event "open one, close others" sequences resolve against the intended route). Deleted the racing draw-route→boolean conversion effect (`Core:812`) and the route→boolean mirroring in the measure effect (`Core:2589`); removed the second `getActiveRightDockPanel(booleans)` derivation from `useMapPanelLayout` (route is authoritative, draw excluded as a floating modal that reserves no rail); dropped the three setter inputs/resets from `useMapRightDockRouting`; rewired `handleSetDrawTool`/`handleToggleDrawPanel`/`handleOpenDrawFromStatus`/`handleSetMeasureTool`/`handleSetSelectionDragTool` to open routes (killing the `setShowDrawPanel(true)+closeRightDockRoute()` contradiction). `MapRightDockHost` is now gated by `isHostRenderedRoutePanel` so pins/draw (dedicated surfaces) never paint an empty host shell.
  - New pure helpers in `mapRightDockRoutes.ts`: `deriveContextualToolPanelVisibility`, `MAP_FLOATING_MODAL_ROUTE_PANELS`/`isFloatingModalRoutePanel`, `MAP_EXTERNALLY_RENDERED_ROUTE_PANELS`/`isHostRenderedRoutePanel` — unit-tested for single-source + mutual exclusivity.
  - Gates: 4 dock specs **29/29**; full map suite **840/840 (92 files), 0 failures**; typecheck PASS; lint:errors PASS; no-Tailwind PASS.
  - **Fixed the long-standing p00 baseline failure** (`mapShellPrimitives > keeps the stable GIS workflow order`): updated the stale 4-item assertion to the documented 7-item `MAP_PRIMARY_ACTIVITY_ORDER` (source of truth `mapNavigationModel.ts:130`). The map suite is now fully green — the standing "832/833 known fail" caveat is retired.
- Track B: parity capture (temp `e2e/p04-parity-capture.spec.ts`, deleted at closeout) → **4/4 pass**. Captured `evidence/p04-parity-draw.png` (floating Draw modal), `p04-parity-measure.png` (host-rendered Measure dock), `p04-parity-pins.png` (floating pin sidebar — **no empty host shell behind it**, confirming the host-gate exclusion), `p04-parity-scientificqa.png` (host-rendered QA dock). All four contextual surfaces open correctly under one route with correct dedicated-vs-host render path. Parity-positive side effect: draw now opens cleanly via the toolbar command (the p00 "draw never opens via command" symptom no longer reproduces; p05 formally owns/hardens the open path).
- Evidence: `evidence/p04-trackA.md`, `evidence/p04-trackB.md`, `evidence/p04-parity-{draw,measure,pins,scientificqa}.png`.
- Verify result: typecheck ok; specs map-docking/mapRightDockRoutes/map-right-dock-migration/useMapPanelLayout all green; full map suite 840/840.
- **Next action:** `prompts/p05-draw-first-click.md`.

### 2026-06-15 — p05 EXECUTED — both tracks done ✅
- **Root cause (record for p06/p10):** post-p04 the topbar Draw command DID open the `draw` route on the first click — the modal just opened **empty**. `handleToggleDrawPanel` opened the route but seeded **no tool** (`activeDrawTool === null` → `Select` state), so "nothing drawable" read as "the Draw button doesn't work." This is candidate (b); causes (a)/(c)/(d) were not in play after p04 (route↔gate agree, `navigatorStageMode` not swallowing, command registered). The per-tool topbar buttons were already first-click-fine (`handleSetDrawTool` sets tool + opens route in one action).
- Track A: new pure helper `mapDrawToolPreferences.ts` (`DEFAULT_DRAW_TOOL='polygon'`, `resolveDrawToolOnOpen` keep-active→last-used→default, never null; `DRAW_TOOL_IDS`/`isDrawToolId`). Core `handleToggleDrawPanel` now opens **via `handleSetDrawTool`** seeding the resolved tool (reuses the single open path); `handleSetDrawTool` records last-used in a session ref (`lastUsedDrawToolRef`, seeded to default). No `showDrawPanel` boolean reintroduced, `MapDrawingManager` not forked, no `localStorage`/new store (session memory only; persistence stays optional per guardrail).
  - Tests: `map-drawing-tools.test.ts` §6 added — `resolveDrawToolOnOpen` (incl. never-null regression guard), single topbar activation opens `draw` route + seeds real tool, per-tool `it.each` activation. Gates: `map-drawing-tools`+`map-docking` **72/72**; draw-wiring (`MapExplorerModal.dispatch`+`MapToolbar.command-palette`+`mapRightDockRoutes`) **31/31**; `npm run typecheck` PASS.
- Track B: temp spec `e2e/p05-draw-first-click-capture.spec.ts` (deleted at closeout) → **1 passed**. Opened via command palette (Ctrl+K → Drawings → one click = `onToggleDrawPanel`). Asserted modal visible, Polygon `aria-pressed=true`, Select `aria-pressed=false`, `store.activeDrawTool==='polygon'`, drawn feature listed. Captured `evidence/p05-draw-first-click.png` (modal open, polygon pre-selected, interactive tool rail) and `evidence/p05-draw-polygon.png` (polygon tool active + "Study area AOI" polygon drawing present).
- Evidence: `evidence/p05-trackA.md`, `evidence/p05-trackB.md`, `evidence/p05-draw-first-click.png`, `evidence/p05-draw-polygon.png`.
- **Next action:** `prompts/p06-draw-premium-modal.md` (premium visual redesign of the drawing modal — behaviour now correct, look unchanged here).

### 2026-06-16 — p06 EXECUTED — both tracks done ✅
- **Premium drawing modal.** Moved the tool rail + status + feature list out of `MapExplorerModalRuntimeCore` inline markup into `MapDrawingManager` (`presentation="modal"`) + a new CSS Module `MapDrawingManager.module.css`. The modal is still rendered by `MapDialogShell` (focus-on-open → tool rail, Escape close, focus-return all reused — no new focus-trap hook).
- Track A: new pure helpers in `mapDrawToolPreferences.ts` — `MODAL_DRAW_TOOL_RAIL` (`[null, ...DRAW_TOOL_IDS]`), `getNextDrawToolRailIndex` (roving-tabindex arrow nav: L/R + U/D wrap, Home/End, null for non-nav), `isDrawAoiActionDisabled` (footer rule). New `ModalDrawToolRail` exposes `role="toolbar"` + `aria-label="Draw tools"` + per-tool `aria-pressed` + roving tabindex + arrow nav. Footer `Fetch data`/`Add as layer` disabled via `isDrawAoiActionDisabled`; handlers unchanged (p07/p08 depend). Tests: `map-drawing-tools.test.ts` §6b added → **70 passed**; `map-docking`+`mapRightDockRoutes` **20 passed** (no open/route regression); `typecheck` PASS; `lint:errors` PASS (clean). No-Tailwind: changed files use `className={…}` CSS-Module expressions only (guard regex matches literal `className="…"` strings only → stays green; `pwsh` unavailable in container, same env note as p00/p04).
- Track B: tool rail = premium segmented control (icon+label, equal segments, hairline separators, no rounds, accent stripe + hover/focus via CSS module); raw "Tool/Features/Selected" row → single calm "Polygon tool · N feature(s)" status; footer hierarchy = Fetch data **primary** (filled accent) / Add as layer **secondary** (ghost) / 3D buildings **tertiary** (borderless), right-aligned meta; empty state via `GisEmptyState`; entrance via `motion.module.css` `panelIn` (reduced-motion respected). Captured `evidence/p06-draw-premium.png` (with feature) + `evidence/p06-draw-empty.png` (empty + disabled actions). a11y audit (`accessibility-audit.spec.ts`) does NOT cover the draw modal → **coverage gap noted**; modal a11y is covered by Track A unit tests instead.
  - **Env gotcha for future agents:** `cdn.playwright.dev` is blocked, and `npm install` upgraded `@playwright/test` to want chromium build 1217 while only **1194** is pre-provisioned. Capture spec pinned `launchOptions.executablePath` to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; first Vite mount needs a long warm-up before the IDE entry button renders.
- Evidence: `evidence/p06-trackA.md`, `evidence/p06-trackB.md`, `evidence/p06-draw-premium.png`, `evidence/p06-draw-empty.png`.
- **Next action:** `prompts/p07-aoi-fetch-data.md` (rectangle AOI → fetch real data in bounds).

### 2026-06-16 — p06+ PRO TOOLKIT — multi-functional upgrade + merge/deploy ✅
- Owner asked to make the drawing tool "more pro / multi-functional", then commit + merge + deploy to Pages. Implemented **all four** capability groups (see `evidence/p06-pro-toolkit.md`):
  1. **Measurements (CRS-correct):** new `src/utils/drawFeatureMeasure.ts` (`measureDrawnGeometry`, `summarizeDrawnGeometries`) using existing geodesic WGS-84 helpers — never planar 4326. Live status-line totals + per-row summary + full Inspector (area/perimeter/length/vertices/centroid) + metric/imperial toggle.
  2. **Feature management:** show/hide (new optional `DrawnFeature.properties.hidden`, filtered from the map source), zoom-to (geodesic bounds → fitBounds/easeTo), duplicate, double-click rename, search/filter, select-all + bulk delete.
  3. **Import/Export:** new `src/centerpanel/components/map/drawGeometryOps.ts` (bounds/translate/duplicate + `drawnFeaturesToGeoJSON` + `parseDrawnFeaturesFromGeoJSON`); Export/Copy/Import (paste or file).
  4. **Style editor:** per-feature stroke/fill colour (swatches + picker), width, opacity → `properties.style`, reflected via data-driven MapLibre paint expressions (coalesce → accent fallback).
- All in `MapDrawingManager` (`DrawModalBody`) + `MapDrawingManager.module.css` (no Tailwind). Footer handlers unchanged. Modal panel enlarged to 40×42rem.
- Gates: typecheck PASS, lint:errors PASS, `map-drawing-tools` **85**, map+utils suite **931**, `test:analytics` **1131**, `build` PASS, `perf:budgets` PASS.
- Screenshot: `evidence/p06-draw-pro.png`. Merged feature branch → `master` (triggers `pages.yml` deploy).

### 2026-06-16 — p06+ STABILITY — non-blocking modal + clean inspector ✅
- Owner report: draw modal "closes by itself", map-click info looked "half-baked", needs to be consistent/flawless. Root cause: `MapDialogShell` rendered a full-screen blocking backdrop → clicking the map closed the modal AND blocked draw clicks.
- Fix: added `nonBlocking` prop to `MapDialogShell` (overlay `pointer-events:none` + transparent backdrop, no close-on-outside-click, no Tab trap, `aria-modal=false`); the draw modal opts in. Map stays interactive; modal stays put.
- Layout: moved the Inspector inside the feature-list scroll region so measurements + style editor are never clipped; panel min 24×22rem.
- Gates: typecheck PASS, lint PASS, `map-drawing-tools` **87** (added MapDialogShell nonBlocking unit tests), map+utils **933**, `test:analytics` **1131**, `build` PASS, `perf:budgets` PASS. E2E (temp, deleted): map clicks keep modal open + Inspector complete. Screenshot refreshed: `evidence/p06-draw-pro.png`.
- Merged → `master` (triggers `pages.yml` deploy).

### 2026-06-16 — p06+ FIX — rectangle/circle drawing (vanished on 2nd click) ✅
- Owner report: circle & rectangle "disappear on the second click". Two root causes (both surfaced once the non-blocking modal made map drawing actually reachable):
  1. **Doubled canvas handlers.** A `headless` `MapDrawingManager` (View) *and* the `modal`/`embedded` UI instances all ran the canvas event effect → every map click was processed by multiple instances → duplicate shapes (each instance had its own dedup ref). Fix: only the canvas owner attaches map/source/keyboard/cursor effects — new `managesCanvas = presentation === "headless" || "floating"`; `modal`/`embedded` are now pure UI.
  2. **Duplicate `click` events.** A single physical click fired the handler ~4×; rectangle/line/polygon/point survived via same-point guards, but the circle's "reset on tiny radius" branch cancelled its own centre. Fix: a same-point/time click debounce (`lastClickRef`, 350ms) collapses duplicates so every tool gets exactly one logical click; circle now mirrors the rectangle's same-point guard.
- Also reworked rectangle & circle to intuitive **two-click** tools (click start → click end / centre → radius), removed the old broken mousedown/mouseup drag path (its `onMouseUp` referenced an undefined `e`), added a duplicate-commit guard in `finishFeature`, and a tool-change reset so a half-drawn shape never leaks into the next tool.
- Verified by temp e2e (deleted): Rect → exactly 1 polygon, Circle → exactly 1 polygon, Point ×3 → 3, Polygon multi-click → 1; modal stays open throughout. Gates: typecheck PASS, lint PASS, `map-drawing-tools` **87**, map+utils **933**, `test:analytics` **1131**, `build` PASS, `perf:budgets` PASS.
- Merged → `master` (triggers `pages.yml` deploy).

### 2026-06-16 — p06+ FIX — feature popup + one-click AOI→3D buildings ✅
- Owner report: the map "Feature Details" popup is half/clipped and off-design; calling 3D buildings for the rectangle AOI is too complex / doesn't work.
- **Popup:** rebuilt `buildFeaturePopupHtml` (MapCanvas) into a fixed-width self-contained premium card — long values wrap (`overflow-wrap:anywhere; min-width:0`) so OSM/building ids no longer clip; themed maplibre chrome (`stylePremiumPopupContainer`: square, hairline, dropdown shadow, themed tip/close), mono dense rows, square accent "Add to report"; popup `maxWidth` raised. New `map-feature-popup.test.ts` (5).
- **AOI→3D:** new Core `handleOpen3DBuildingsForAoi` makes the drawing modal's "3D buildings" one click — resolves the drawn polygon/rectangle AOI, fits the map to it, opens the VoxCity scene, and bumps a new `voxCityAutoFetchToken` prop so `MapVoxCityOverlay` auto-runs `handleFetchOsmBuildings` for that AOI (VoxCity already targets the AOI via `resolveMapAnalysisBounds`). Button disabled until something is drawn. E2E: rectangle → "3D buildings" → VoxCity scene opens + Overpass request auto-queued for the AOI (`evidence/p06-aoi-3d-buildings.png`).
- Gates: typecheck PASS, lint PASS, map+popup unit **92**, map+utils **938**, `test:analytics` **1131**, `build` PASS, `perf:budgets` PASS. Evidence: `evidence/p06-popup-and-3d.md`, `evidence/p06-aoi-3d-buildings.png`.
- Merged → `master` (triggers `pages.yml` deploy).

### 2026-06-16 — p07 EXECUTED — both tracks done ✅
- **Rectangle AOI → real bounds-clipped fetch.** The footer "Fetch data" button previously only opened the Flow Dispatch dialog; it now runs a real, AOI-scoped fetch and publishes a derived layer (or an honest no-data outcome).
- Track A: new pure helpers in `controllers/mapExplorerSpatialHelpers.ts` —
  - `resolveAoiFetchBounds(drawnFeatures, selectedFeatureId)` derives AOI bounds+label from the selected polygon or merges all drawn polygon/rectangle envelopes via existing `getFeatureBounds`+`mergeBounds` (lon/lat extent only → **CRS-safe**, no metric in 4326).
  - `buildAoiFetchResult(sources, bounds, opts)` clips each queryable source with existing `filterFeatureCollectionToBounds`, merges survivors into one derived `OverlayLayerConfig` (`sourceKind:'derived'`, provenance `method:'AOI fetch (bounds clip)'`, `generatedAt`, `sourceLayerIds`, bounds metadata, per-feature source trace) → outcome `fetched`(`implemented`) / `empty`(`residual_gap`) / `no-source`(`environment_dependent`). **Never fabricates a layer.**
  - Core `handleFetchAoiData` resolves queryable `geojson` sources via `resolveFeatureCollection`, calls `setMapViewRestriction(bounds,true)` to AOI-scope subsequent loads, `addOverlayLayer`, `setActiveAnalysisResultLayers`, `fitToBounds`, records an `analysis-dispatch/applied` review event, and surfaces toast/feedback/announce. Footer button repointed (busy `Fetching…` state). The **Flow Dispatch dialog is untouched** — still the confirmation surface for analysis routing (map context menu / p08); AOI still feeds it; no silent auto-apply.
  - **Bug found & fixed mid-impl:** first handler placement referenced `fitToBounds` (defined later) in its dep array → `ReferenceError: Cannot access 'fitToBounds' before initialization` crashed `<MapExplorerModal>` on mount (caught in Track B capture). Relocated `handleFetchAoiData` to after `fitToBounds`.
  - Gates: new `map-drawing-aoi-data.test.ts` **9**, `map-drawing-tools` **87**, **full map suite 870/870 (84 files)**, `typecheck` PASS, `eslint --quiet` (3 changed files) PASS. No-Tailwind: `pwsh` unavailable (same env note); TS-only changes, no `className` literals → guard unaffected.
- Track B: temp `e2e/p07-aoi-fetch-capture.spec.ts` (deleted at closeout) → **1 passed** with in-test assertions (derived layer present, `sourceKind:'derived'`, **6 source features → 4 clipped inside AOI**, provenance method + sourceLayerIds). Seeded a queryable point source (4 inside / 2 outside the AOI) + a drawn rectangle via the store; opened Draw via command palette. Captured `evidence/p07-aoi-fetch.png` (Draw modal: Study area AOI rectangle, Inspector, Fetch data primary) and `evidence/p07-aoi-result-layer.png` (derived "AOI fetch · Study area AOI (4) · 4 features", "AOI DATA FETCHED" toast). Map basemap renders blank (no tile network in e2e — environment limitation, consistent with prior phases); the layer list + provenance + feature count are the proof.
- **Sources real vs environment-dependent:** the fetch clips whatever **queryable vector layers are currently loaded** (imported GeoJSON/CSV + derived analysis layers — all real). It does **not** invent a remote source: `environment_dependent` when none is loaded/resolvable, `residual_gap` when sources exist but none intersects the AOI.
- Evidence: `evidence/p07-trackA.md`, `evidence/p07-aoi-fetch.png`, `evidence/p07-aoi-result-layer.png`.
- Env gotcha (future agents): chromium pinned to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; first Vite mount ~1 min; the `drawings` command is in toolbar overflow → open via command palette (`map-commands-trigger` → `map-commands-open-palette` → search "drawings" → `map-command-palette-option-drawings`).
- **Next action:** `prompts/p08-aoi-analysis.md` (AOI → compatible scientific flows → evidence).

### 2026-06-16 — p08 EXECUTED (Track A done, Track B blocked) ⚠
- Track A: AOI dispatch now routes through compatible scientific workflows and produces immutable evidence artifacts with IDs-only bus publication (`analytics.artifact.publish`, `evidence.artifact.register`).
- Added/updated tests for AOI analysis shaping and IDs-only payload behavior; targeted p08 validations passed earlier in-session (`map-drawing-aoi-data`, `mapEvidenceArtifacts`, typecheck, lint:errors).
- During Track B capture runs, multiple runtime null-safety crashes surfaced and were fixed:
  - `MapAnalysisRecommender.ts`: guard missing `analysisResult.visualization` in temporal frame resolver.
  - `MapCartographyAdvisor.ts`: guard missing `analysisResult.visualization` in legend reads.
  - `MapExplorerModalRuntimeCore.tsx`: guard temporal layer filter for missing visualization.
  - `MapClusterViz.tsx`: guard LISA candidate check for missing visualization.
- Track B remains blocked by unstable Playwright startup/runtime behavior in this environment:
  - intermittent `ERR_CONNECTION_REFUSED` to `http://127.0.0.1:4173/?e2e=1&view=ide`
  - prior long-running capture attempts timing out while modal shell was unavailable after runtime errors.
- Evidence: `evidence/p08-trackA.md`.
- **Next action:** clear Playwright webServer stability and recapture `evidence/p08-aoi-analysis.png` + `evidence/p08-evidence-registered.png`.

### 2026-06-16 — p08 Track B partial capture update
- Confirmed `evidence/p08-aoi-analysis.png` exists and is valid (AOI dispatch modal with compatible workflow list visible).
- Added blocker note file `evidence/p08-trackB.md`; `STATE.json` now points p08 Track B evidence to that file while status remains `blocked`.
- Remaining requirement for Track B completion is still `evidence/p08-evidence-registered.png`.

### 2026-06-16 — p08 EXECUTED — Track B unblocked and done ✅
- Rebuilt a deterministic p08 capture spec at `e2e/p08-aoi-analysis-capture.spec.ts` and stabilized the flow: seeded AOI/queryable layer, opened context-menu Analyze Area on map canvas, dispatched a compatible flow, then captured registration confirmation.
- Captured missing screenshot `evidence/p08-evidence-registered.png` (toast confirms analysis registration), while preserving `evidence/p08-aoi-analysis.png`.
- Fixed one runtime blocker discovered during capture: `MapHotSpotViz.tsx` now guards `analysisResult.visualization` access with optional chaining (`analysis?.visualization?.kind`) to prevent modal crashes from sparse metadata.
- Verify result: `playwright test e2e/p08-aoi-analysis-capture.spec.ts --workers=1 --retries=0 --timeout=180000` => **1 passed**.
- Evidence: `evidence/p08-trackA.md`, `evidence/p08-aoi-analysis.png`, `evidence/p08-evidence-registered.png`.
- Next action: `prompts/p09-right-dock-floating-modal.md`.

### 2026-06-16 — p09 EXECUTED — both tracks done ✅
- Track A: implemented `floating-modal` right-dock host mode with portal rendering, header drag (reused `useDraggableMapPanel`), edge/corner resize, viewport clamping, and persistent `{x,y,width,height}` via Zustand layout preferences (`layoutPreferences.rightDockFloating`) in `synapse-map-explorer` persisted state. Added shared clamp/default helpers in `mapDocking.ts`, plumbed floating rect through runtime core/view, and kept constrained-width fallback to `side-drawer`.
- Track A tests/gates: `map-right-dock-migration.test.ts` **4/4**, `MapRightDockHost.test.tsx` **10/10**, `map-docking.test.ts` **14/14**, `npm run typecheck` PASS.
- Track B: captured floating modal visuals `evidence/p09-float-default.png`, `evidence/p09-float-moved.png`, `evidence/p09-float-resized.png` (default, dragged, resized larger/smaller states).
- Evidence: `evidence/p09-trackA.md`, `evidence/p09-trackB.md`, `evidence/p09-float-default.png`, `evidence/p09-float-moved.png`, `evidence/p09-float-resized.png`.
- Next action: `prompts/p10-right-dock-single-click.md`.

### 2026-06-16 — p10 EXECUTED — both tracks done ✅
- Track A: implemented single-click inspector command wiring through the right-dock route model without reintroducing legacy booleans. `MapToolbar` now exposes an `inspector` command entry; `MapExplorerModalRuntimeCore` routes command clicks to `handleToggleInspectorPanel`, opening `inspect` on first click and closing on second click via `toggleRightDockPanel`. Focus behavior was tightened by restoring trigger focus on route-toggle close in `useMapRightDockRouting`, and dock open-focus behavior now includes `inspect` in `MapRightDockHost`.
- Track A tests/gates: `mapRightDockRoutes.test.ts`, `MapRightDockHost.test.tsx`, `map-right-dock-migration.test.ts` passed (23 tests total); `npm run typecheck` PASS.
- Track B: captured `evidence/p10-single-click-open.png` (floating-modal at wide viewport) and `evidence/p10-narrow-fallback.png` (side-drawer fallback at constrained viewport). Capture used a temporary e2e spec, then removed it after artifacts were saved.
- Environment stabilization during capture: installed missing local deps (`vitest`, `@duckdb/duckdb-wasm`, `onnxruntime-web`) and excluded `pdf-lib` from Vite optimizeDeps to avoid pre-bundle failure from broken package shape in this environment.
- Evidence: `evidence/p10-trackA.md`, `evidence/p10-trackB.md`, `evidence/p10-single-click-open.png`, `evidence/p10-narrow-fallback.png`.
- Next action: `prompts/p11-right-panel-single-column.md`.

### 2026-06-16 — p11 EXECUTED — both tracks done ✅
- Track A: converted right-dock dual-column layouts to single-column vertical flow across style/report/selection context. `LayerStyleEditor` control grid now stacks in one column; `CartographyRecommendationList` preview now stacks before/after vertically; AOI label/value rows in right-dock selection now use `GisPropertyGrid` (sanctioned dense primitive). Added right-dock single-column markers (`data-right-dock-layout="single-column"`) on style and publish bodies and converted timeline filter strip to single-column for narrow readability.
- Track A tests/gates: `mapRightDockRoutes.test.ts` + new `map-right-dock-single-column-layout.test.ts` PASS (12 tests), full map suite PASS (**95 files / 904 tests**), `npm run typecheck` PASS, `npm run lint:no-tailwind-centerpanel` PASS.
- Track B: captured narrow/wide proof set for converted right-dock panels:
  - `evidence/p11-style-wide.png`, `evidence/p11-style-narrow.png`
  - `evidence/p11-selection-wide.png`, `evidence/p11-selection-narrow.png`
  - `evidence/p11-report-wide.png`, `evidence/p11-report-narrow.png`
- Evidence: `evidence/p11-trackA.md`, `evidence/p11-trackB.md`.
- Next action: `prompts/p12-right-dock-motion.md`.

### 2026-06-16 — p12 EXECUTED — both tracks done ✅
- Track A: added restrained right-dock motion and reduced-motion gating across the host/runtime path. `MapExplorerModalRuntimeView` now retains the closing route briefly for the exit animation, passes `reducedMotion`/`closing` into `MapRightDockHost`, and restores the final state immediately when reduced-motion is enabled. `MapRightDockHost` and `MapRightDockHost.module.css` now own the visual enter/exit state and keep the body content wrapper stable while the dock animates.
- Track A tests/gates: `npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` PASS, `npm run typecheck` PASS, `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` PASS.
- Track B: captured `evidence/p12-open.png`, `evidence/p12-close.png`, and `evidence/p12-reduced-motion.png`.
- Evidence: `evidence/p12-trackA.md`, `evidence/p12-trackB.md`, and the screenshots above.
- Next action: `prompts/p13-left-dock-single-column.md`.

### 2026-06-16 — p13 EXECUTED — both tracks done ✅
- Track A: completed left-dock embedded single-column conversion for Data/Catalog workspace content. Embedded `MapCatalogPanel` now renders a compact top summary band and a full-width body (`data-layout="single-column"` marker in embedded mode), removing the competing two-column split in the left workspace surface.
- Track A tests/gates: `map-left-panel-contracts.test.ts` PASS (18), `map-left-panel-responsive-fit.test.ts` PASS (11), full map suite PASS (**95 files / 908 tests**), `npm run typecheck` PASS, no-tailwind guard PASS via `pwsh -File scripts/check-no-tailwind-centerpanel.ps1`.
- Track B: captured required left-dock visuals at min/wide and related workspace states: `evidence/p13-add-data.png`, `evidence/p13-add-data-wide.png`, `evidence/p13-catalog.png`, `evidence/p13-layers.png`.
- Evidence: `evidence/p13-trackA.md` and screenshots above.
- Next action: `prompts/p14-models-recompose.md`.

<!-- Append new sessions below. Template:
### YYYY-MM-DD — <phase/track> — <short title>
- Did: ...
- Evidence: evidence/pNN-trackX.md  |  evidence/<shot>.png
- Verify result: typecheck <ok/fail>, specs <names + pass/fail>
- Next action: <phase/track + prompt file>
-->
