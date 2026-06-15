# Evidence — p04 (Dock-visibility state unification)

**Run:** 2026-06-15. **Track A complete.**

## Mission recap
Collapse the three overlapping mechanisms that decided "what is open on the right / which
tool is active" into **one authoritative model — the right-dock route** (`mapRightDockRoutes`),
so the contextual tool panels (pins / draw / measure) stop racing booleans. Behavior parity
is the success bar.

## The three mechanisms that were colliding (before)
1. Independent `useState` booleans in Core: `showSidebar` (pins), `showDrawPanel`, `showMeasurePanel`.
2. `getMapDockLayout()` derived its own `showDrawPanel`/`showMeasurePanel`/`showPinSidebar` from a
   parallel `getActiveRightDockPanel(booleans)` call (a *second* derivation).
3. The route model `mapRightDockRoutes` (`activeRightDockRoute`).
   - Plus an effect (`Core:812`) that converted a `draw` **route** into the legacy boolean and
     **closed the route** — and an effect (`Core:2589`) that *mirrored* the route back into the
     booleans via `setState`. These are the "racing boolean" / "two clicks" / draw-never-opens bugs.

## What changed (single source of truth)
- **`mapRightDockRoutes.ts`** — added pure, tested projections:
  - `deriveContextualToolPanelVisibility(panel)` → `{ showPinSidebar, showDrawPanel, showMeasurePanel }`
    (the booleans are now pure projections of the active route — mutually exclusive by construction).
  - `MAP_FLOATING_MODAL_ROUTE_PANELS = ['draw']` + `isFloatingModalRoutePanel()` — the drawing modal
    floats over the map and reserves **no** rail width.
  - `MAP_EXTERNALLY_RENDERED_ROUTE_PANELS = ['pins','draw']` + `isHostRenderedRoutePanel()` — these
    render in dedicated surfaces (floating pin sidebar / draw modal), so the shared `MapRightDockHost`
    stays hidden for them (no empty "No routed content" shell behind the dedicated surface).
- **`useMapPanelLayout.ts`** — removed the second derivation (`getActiveRightDockPanel(booleans)`) and
  its three boolean inputs; the layout now resolves the right panel straight from the active route
  (`activeRightDockRoutePanel`), excluding the floating draw modal from rail reservation. Route still
  outranks the QA/workflow/urban/report layout fallbacks.
- **`useMapRightDockRouting.ts`** — dropped `setShowDrawPanel`/`setShowMeasurePanel`/`setShowSidebar`
  inputs and their per-open resets: switching the route now updates the derived booleans automatically.
- **`MapExplorerModalRuntimeCore.tsx`**
  - Replaced the three `useState` booleans with a route projection
    (`const { showDrawPanel } = deriveContextualToolPanelVisibility(activeRightDockRoute?.panel)`),
    keeping `showSidebar`/`showMeasurePanel` visibility flowing through `effectiveShow*`/route flags.
  - Added thin `Dispatch<SetStateAction<boolean>>` wrappers (`setShowSidebar/Draw/Measure`) that
    dispatch route open/close, with an **optimistic route ref** so intra-event "open one, close the
    others" sequences resolve against the intended next route (not the stale pre-event route).
  - Deleted the draw-route→boolean conversion effect; simplified the measure effect to keep only its
    real side effects (layer panel, clear measure tool + close draw modal when leaving Analyze).
  - Rewired `handleSetDrawTool`, `handleToggleDrawPanel`, `handleOpenDrawFromStatus`, `handleSetMeasureTool`,
    `handleSetSelectionDragTool` to open routes (removing the `setShowDrawPanel(true)+closeRightDockRoute()`
    contradiction) and removed the now-redundant boolean reset in `handleRightDockHostPanelChange`.
- **`MapExplorerModalRuntimeView.tsx`** — `MapRightDockHost` now renders only when
  `isHostRenderedRoutePanel(activeRightDockRoute.panel)`, preserving the pre-p04 behaviour where the
  host never appeared for pins/draw (they were never routes before).

## Parity reasoning (no observable UX change)
- pins / measure still reserve their rail straight from the route (`requestedRightDockPanel`), so
  `effectiveShowSidebar` / `effectiveShowMeasurePanel` are unchanged.
- draw still renders as the floating `MapDialogShell` and reserves no rail — exactly as before (the
  route was previously closed immediately, so the layout never saw `draw`; it still never reserves for it).
- The host-visibility gate reproduces the old behaviour exactly (pins/draw were never routes, so the
  host was never shown for them).
- Mutual exclusivity is now enforced once, by the route reducer (one `activeRoute`), instead of by
  scattered boolean resets.

## Verification
| Check | Command | Result |
|---|---|---|
| Dock layout spec | `npx vitest run …/__tests__/map-docking.test.ts` | PASS |
| Route model spec (+ new single-source/exclusivity cases) | `npx vitest run …/__tests__/mapRightDockRoutes.test.ts` | PASS |
| Right-dock migration spec | `npx vitest run …/__tests__/map-right-dock-migration.test.ts` | PASS |
| Panel layout hook spec (+ new draw-floats / route-single-source cases) | `npx vitest run …/controllers/__tests__/useMapPanelLayout.test.tsx` | PASS |
| Four specs together | (all of the above) | **29 / 29 pass** |
| Full map component suite | `npx vitest run src/centerpanel/components/map` | **840 / 840 pass (92 files), 0 failures** |
| Typecheck | `npm run typecheck` | PASS |
| Lint (errors) | `npm run lint:errors` | PASS |
| No Tailwind in centerpanel | `pwsh -NoLogo -NoProfile -File scripts/check-no-tailwind-centerpanel.ps1` | PASS |

### Note on the previously-known baseline failure (now fixed)
p00 recorded one pre-existing failure — `mapShellPrimitives.test.tsx > "keeps the stable GIS workflow
order"` — whose hard-coded 4-item `MAP_PRIMARY_ACTIVITY_ORDER` was stale (the live model has 7:
overview/data/layers/style/analyze/scene/publish). p00 recommended fixing it in p04. The assertion was
updated to the documented current order (source of truth: `mapNavigationModel.ts:130`). The full map
suite is now fully green (840/840), not 832/833.

## Done criteria
- Exactly one authority (the route model) decides right-dock/tool visibility; the legacy booleans are
  derived projections. ✅
- The three named specs are green; mutual exclusivity + single-source are asserted by new tests. ✅
- typecheck clean; parity preserved (no observable UX change). ✅
