# p05 — Track A (Functional) — Drawing first-click open fix

**Status:** done · **Date:** 2026-06-15

## Root cause (the one that matters for p06/p10)

After p04 the dock-visibility model was already unified onto `mapRightDockRoutes`,
so the topbar **Draw** command *did* open the `draw` route on the first click —
the p00 "draw never opens via command" symptom no longer reproduced. The
**remaining** first-click failure was not "the modal doesn't open" but "the modal
opens **empty**":

- `handleToggleDrawPanel` (Core, topbar **Draw** command via `onToggleDrawPanel`)
  opened the `draw` route but seeded **no tool** → `activeDrawTool === null` →
  the modal mounted in the `Select` (null) state. With nothing drawable under the
  cursor, the owner read this as "the Draw button doesn't open / I can't draw."
- The per-tool topbar buttons (`onSetDrawTool` → `handleSetDrawTool`) already set
  the tool **and** opened the route in one action, so those were first-click-fine.
  The seam was specifically the generic **Draw** command opening to `Select`.

This is candidate **(b)** from the prompt's context primer. Causes (a)/(c)/(d)
were not in play post-p04: the route open path and the modal gate agree
(`showDrawPanel = route?.panel === 'draw'`); `navigatorStageMode` only suppresses
an already-staged surface and was not swallowing the toolbar open; and the
command registers whenever `onToggleDrawPanel` is wired (it is).

## Fix (root cause, not symptom)

1. New pure, UI-free helper module
   [`mapDrawToolPreferences.ts`](../../src/centerpanel/components/map/mapDrawToolPreferences.ts):
   - `DEFAULT_DRAW_TOOL = 'polygon'` (primary AOI workflow).
   - `resolveDrawToolOnOpen(currentTool, lastUsedTool)` — keep the active tool
     (re-open mid-edit) → else last-used (session memory) → else default. Never
     returns `null`, so the surface always opens usable.
   - `DRAW_TOOL_IDS`, `isDrawToolId` guards.
2. Core `handleToggleDrawPanel` now **opens via `handleSetDrawTool`**, seeding the
   resolved tool — so the single topbar Draw activation lands on a real,
   immediately operable tool and reuses the one open path (route + tool + clear
   others + `analyze` workspace) instead of a second, tool-less open path.
3. Core `handleSetDrawTool` records the last-used tool in a session ref
   (`lastUsedDrawToolRef`, seeded to `DEFAULT_DRAW_TOOL`). No `localStorage`, no
   new persisted store — session memory only (persistence remains optional per
   the prompt guardrail).
4. The p04 route model is reused as the single source of truth — no
   `showDrawPanel` boolean reintroduced, `MapDrawingManager` not forked. Closing
   still flows through the same source (toggle-off → `closeRightDockRoute`;
   modal close button → `setShowDrawPanel(false)` → route close; Escape via
   `MapDialogShell`). Each of the five tools activates from `activeDrawTool` in
   `MapDrawingManager` with no second click.

## Tests added (`map-drawing-tools.test.ts`, section 6)

- `resolveDrawToolOnOpen`: default = polygon; keeps active tool; falls back to
  last-used; **never resolves to null/Select** (the regression guard — this would
  have failed against the pre-p05 tool-less open path).
- Single topbar Draw activation: opens the `draw` route (modal gate
  `showDrawPanel === true`) **and** seeds a real tool in one action; re-open
  preserves the active tool; re-open after deselect falls back to last-used.
- Per-tool activation (`it.each` over all five tools): opening keeps the surface
  open and the chosen tool is preserved (no reset / no second click).

## Verify

- `npx vitest run map-drawing-tools.test.ts map-docking.test.ts` → **72/72 pass**
  (no p04 regression).
- `npx vitest run MapExplorerModal.dispatch + MapToolbar.command-palette +
  mapRightDockRoutes` → **31/31 pass** (draw wiring + route model intact).
- `npm run typecheck` → **PASS**.

## Done criteria

✅ One topbar Draw activation opens a usable drawing surface (polygon seeded).
✅ All five tools activate on first click. ✅ Close works via the single source.
✅ Tests green; typecheck clean.
