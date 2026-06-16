# LEDGER — Progress Ledger (Anti-Amnesia)

> **Read this FIRST every session. Update it LAST before exiting.** A track is `done` only with evidence (a test-summary file in `evidence/` or a screenshot path). Never write `done` without an `evidence` link. This ledger is the single human-readable source of truth for "where are we"; [STATE.json](STATE.json) is its machine mirror — keep them in sync.

**Overall status:** `IN PROGRESS` — p00-p06 complete (badge/status-language phases + dock-state unification + draw first-click fix + premium drawing modal closed; next action p07).

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
| p07 | AOI → fetch data | Rectangle bounds → data fetch | pending | Fetch-data flow shots | pending | ☐ |
| p08 | AOI → analysis | Compatible flows → evidence | pending | Analysis dispatch shots | pending | ☐ |
| p09 | Right dock floating modal | Drag + resize + clamp + persist | pending | Moved/resized modal shots | pending | ☐ |
| p10 | Right dock single-click | One-click open + state cleanup | pending | One-click open shot | pending | ☐ |
| p11 | Right panel single-column | Remove dual-column | pending | Single-column shots | pending | ☐ |
| p12 | Right dock motion | (motion test/reduced-motion) | pending | Animated open/close | pending | ☐ |
| p13 | Left dock single-column | Workspace single-column | pending | Data/Add Data shots | pending | ☐ |
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

<!-- Append new sessions below. Template:
### YYYY-MM-DD — <phase/track> — <short title>
- Did: ...
- Evidence: evidence/pNN-trackX.md  |  evidence/<shot>.png
- Verify result: typecheck <ok/fail>, specs <names + pass/fail>
- Next action: <phase/track + prompt file>
-->
