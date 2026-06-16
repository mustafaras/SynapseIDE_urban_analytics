# p06 — Track A (Functional support for the premium redesign)

**Phase:** p06 · **Track:** A (a11y / disabled-state support) · **Status:** done · 2026-06-16

## What changed (functional)

The premium redesign moved the drawing modal's **tool rail + status + feature
list** out of `MapExplorerModalRuntimeCore` inline markup and into the
`MapDrawingManager` `"modal"` presentation. Track A guarantees the redesign
keeps the same a11y contract and disabled-state behaviour as before.

### Focus management (reused, not re-implemented)
- The modal is still rendered by `MapDialogShell`, which already:
  - focuses the first focusable element on open — now the **tool rail's first
    button** (the rail is the first thing in the dialog body), satisfying
    "opening the modal focuses the tool rail";
  - closes on **Escape** and **restores focus to the trigger** on unmount
    (`previouslyFocused.focus()`), satisfying focus-return;
  - traps Tab focus within the dialog.
- No new focus-trap hook was added — `MapDialogShell` is the single source of
  truth (per "reuse … drag affordances / shell").

### Tool rail a11y (`ModalDrawToolRail` in `MapDrawingManager.tsx`)
- `role="toolbar"` + `aria-label="Draw tools"` + `aria-orientation="horizontal"`.
- One button per tool with `aria-pressed` reflecting the active tool.
- **Roving tabindex**: the active tool (or Select) is the only `tabindex=0`
  stop; the rest are `tabindex=-1`.
- **Arrow-key navigation**: Left/Right (and Up/Down mirrors) wrap; Home/End jump
  to the ends — implemented via the new pure helper `getNextDrawToolRailIndex`.

### Footer disabled-state (`MapExplorerModalRuntimeCore.tsx`)
- New pure helper `isDrawAoiActionDisabled(count)` centralises the rule
  (`count <= 0`). `Fetch data` (primary) and `Add as layer` (secondary) are
  disabled when `drawnFeatures.length === 0`; `3D buildings` (tertiary) stays
  enabled. Handlers are unchanged (`handleOpenFlowDispatchDialog`,
  `handleAddDrawingsAsLayer`, scene tab) — p07/p08 depend on this wiring.

### New pure helpers (`mapDrawToolPreferences.ts`)
- `MODAL_DRAW_TOOL_RAIL` — `[null, ...DRAW_TOOL_IDS]` rail order.
- `getNextDrawToolRailIndex(currentIndex, key, length)` — roving-tabindex nav.
- `isDrawAoiActionDisabled(featureCount)` — footer disabled rule.

## Tests (extended `map-drawing-tools.test.ts` §6b — p06)
- `MODAL_DRAW_TOOL_RAIL` order (Select leads, 6 entries).
- `getNextDrawToolRailIndex` forward/back wrap + Home/End + null for non-nav keys.
- `isDrawAoiActionDisabled` 0 → true, ≥1 → false.
- Modal presentation renders `role="toolbar"`, `aria-label="Draw tools"`,
  `aria-pressed="true"`, `data-active="true"`, `tabindex="0"`/`"-1"`,
  all six tool labels.
- Empty state uses `GisEmptyState` (`data-gis-empty-state`, "No drawn features",
  "Drawn features" section header) — the raw "No drawn features." row is gone.
- With features: feature list + calm single-line status ("1 feature", "Polygon");
  asserts the old raw "Features 0 / Selected" row is gone.

## Verify (results)
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
  → **70 passed**.
- `npx vitest run map-docking + mapRightDockRoutes` → **20 passed** (no draw
  open/route regression).
- `npm run typecheck` → **PASS**.
- `npm run lint:errors` → **PASS** (clean).
- No-Tailwind: changed centerpanel files use `className={…}` CSS-Module
  expressions only (no literal Tailwind utility strings); the guard regex only
  matches literal `className="…"` strings, so it stays green. (`pwsh` is not
  available in this container to run the script directly — same env note as
  p00/p04.)

## Done criteria
- a11y roles + disabled-states verified; no open/tool regression; lint clean. ✅
