# p04 — Dock-Visibility State Unification (Kill the Dual Source of Truth)

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p04 · **Depends on:** p00 · **Tracks:** A (state convergence) + B (parity shots)

## Mission
Collapse the three overlapping mechanisms that describe "what is open on the right / which tool is active" into one authoritative model, so the Draw first-click bug (p05) and the right-dock modal work (p09/p10) build on solid ground instead of racing booleans.

## Why (problems #1, #9 — latent)
Three mechanisms currently coexist:
1. Legacy booleans in Core: `showDrawPanel` (`Core:750`), `showMeasurePanel`, `showPinSidebar`, plus `showScientificQAPanel`, `showReportPanel`, etc.
2. `mapDocking.getMapDockLayout()` DERIVES `showDrawPanel/showMeasurePanel/showPinSidebar` from `activeRightPanel`.
3. The route model `mapRightDockRoutes.ts` (`activeRoute`/`lastRoute`, `openMapRightDockRouteState`, etc.).
These disagree, which is why toggles need two clicks and panels fight each other.

## Context primer (self-contained)
- `mapDocking.ts`: `getActiveRightDockPanel({showPinSidebar, showDrawPanel, showMeasurePanel})` maps booleans → panel; `getMapDockLayout()` returns derived `showDrawPanel` etc. from `activeRightPanel`.
- `mapRightDockRoutes.ts`: the richer, serializable model with `MapRightDockRoute { panel, source, ... }` and reducers `open/switch/close...RouteState`.
- Core holds `showDrawPanel` boolean AND consumes `dockLayout` AND has `activeRightDockRoute` (used by `MapRightDockHost`). The Draw modal (`Core:~6130`) reads the legacy boolean, NOT the route.
- IMPORTANT: This is a refactor with **behavior parity** as the success bar. Do not change UX yet; just make one model authoritative.

## Files
- `edit` — `src/centerpanel/components/map/mapDocking.ts` — reduce/retire derived `showXxxPanel` booleans OR clearly mark them as pure projections of the route.
- `edit` — `src/centerpanel/components/map/mapRightDockRoutes.ts` — ensure `draw`, `measure`, `pins`, `selection`, `scientificQA` are first-class routes (they already are panels).
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — make the route the single source; derive legacy booleans (if still referenced by children) from `activeRightDockRoute?.panel` via memo, not independent `useState`.
- `reference` — `src/centerpanel/components/map/controllers/useMapRightDockRouting.ts` — existing routing hook; prefer extending it.
- `reference` — `src/centerpanel/components/map/__tests__/map-docking.test.ts`, `__tests__/mapRightDockRoutes.test.ts`, `__tests__/map-right-dock-migration.test.ts`.

## Do NOT touch / reuse
- Do not change the Draw modal's visual yet (p06). Do not add drag yet (p09).
- Reuse `useMapRightDockRouting` rather than inventing a parallel hook.

## Track A — Functional
### Steps
1. Decide the single authority: `mapRightDockRoutes` `activeRoute` (it is serializable and already wired to `MapRightDockHost`). Make `draw`/`measure`/`pins`/`selection`/`scientificQA` open via routes.
2. In Core, replace independent `useState` booleans (`showDrawPanel`, `showMeasurePanel`, `showPinSidebar`, and the scientific/report/workflow show-flags where they duplicate routes) with `useMemo` derivations from `activeRightDockRoute?.panel`. Keep setters as thin wrappers that dispatch route open/close so existing call sites compile.
   - NOTE: The Draw modal is currently a `MapDialogShell`, not a right-dock panel. For p04, keep the modal rendering but drive its open state from the route: `const showDrawPanel = activeRightDockRoute?.panel === 'draw'`. p05 fixes the open path; p06 redesigns it.
3. Make `getMapDockLayout` consume the route (or the single boolean projection) — remove the second independent derivation so there is exactly one truth.
4. Verify behavior parity: opening/closing draw, measure, pins, scientific QA still works exactly as before (same panels, same exclusivity — opening draw closes measure, etc.). Encode this exclusivity once, in the route reducer or routing hook.
5. Update/extend `map-docking.test.ts` and `mapRightDockRoutes.test.ts` to assert single-source behavior and mutual exclusivity.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-docking.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts`
- `npm run typecheck`
- Save summary → `evidence/p04-trackA.md`.

### Done criteria
- Exactly one authority (route model) decides right-dock/tool visibility; legacy booleans are derived projections. All three specs green; parity preserved. typecheck clean.

## Track B — Visual (parity verification)
### Steps
1. Screenshot draw/measure/pins/scientificQA open states; confirm they look identical to `baseline/` (this is a refactor — no visual change expected, which is the proof).
2. Save `evidence/p04-parity-<panel>.png`.

### Verify
- `screenshot-map-explorer` shots match baseline behavior.

### Done criteria
- No visual regression; panels open/close with correct mutual exclusivity.

## Anti-amnesia exit checklist
- LEDGER: p04 A+B → `done`, phase closed; session-log notes "route model is now the single source of dock visibility".
- STATE: `phases[p04]` trackA/trackB `done` + evidence.
- Next action → `prompts/p05-draw-first-click.md`.

## Guardrails
- Behavior parity ONLY — no UX changes in p04.
- No Tailwind. `exactOptionalPropertyTypes`. No `localStorage`.
- Both tracks verified before closing.
