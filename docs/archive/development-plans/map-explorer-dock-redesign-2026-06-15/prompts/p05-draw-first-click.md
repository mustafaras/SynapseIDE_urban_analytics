# p05 — Drawing First-Click Open Fix + Topbar/Command Wiring

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p05 · **Depends on:** p04 · **Tracks:** A (open fix + test) + B (open shot)

## Mission
Make the topbar **Draw** button open the drawing surface on the **first click**, with a tool ready to use, and make every draw tool (Select/Point/Line/Polygon/Rect/Circle) immediately operable.

## Why (problem #1 — blocker)
The owner: *"the Draw button doesn't open on first click; I can't use any drawing capability."* After p04 the dock-visibility model is unified, so this phase can fix the open path cleanly.

## Context primer (self-contained)
- Topbar Draw entry: `MapToolbar.tsx:1906-1913` adds a command `{ shortLabel: "Draw", onClick: args.onToggleDrawPanel }`. So the topbar button calls `onToggleDrawPanel` → Core `handleToggleDrawPanel` (`Core:3884`), which toggles the draw open-state.
- The in-modal tool buttons call `handleSetDrawTool(tool)` (`Core:3856`), which sets `activeDrawTool`, clears other tools, and (pre-p04) set `showDrawPanel(true)`.
- After p04, draw open-state = `activeRightDockRoute?.panel === 'draw'`. The modal renders at `Core:~6130` (`MapDialogShell`, gated by that derived value + `!navigatorStageMode`).
- Likely first-click failure causes to check: (a) `handleToggleDrawPanel` toggles open/closed but the route open path and the legacy modal gate disagreed (fixed conceptually in p04 — verify); (b) the toolbar passes `onToggleDrawPanel` but the modal needs an `activeDrawTool` to be useful, so first click opens an empty "Select" state that looks like "nothing happened"; (c) `navigatorStageMode` true suppresses the modal; (d) the command only registers `if (args.onToggleDrawPanel)` and the prop is sometimes undefined.

## Files
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — `handleToggleDrawPanel` (~3884), `handleSetDrawTool` (~3856), draw modal gate (~6130), draw open route wiring.
- `edit` — `src/centerpanel/components/map/MapToolbar.tsx` — Draw command (~1906) and the per-tool draw buttons (~401-405) wiring.
- `reference` — `src/centerpanel/components/map/MapTopCommandSurface.tsx` — confirm whether Draw is also surfaced here; wire consistently.
- `edit` — `src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts` — add first-click + per-tool activation tests.
- `reference` — `src/centerpanel/components/MapDrawingManager.tsx` — the canvas controller; confirm tools activate from `activeDrawTool`.

## Do NOT touch / reuse
- Do not redesign the modal visually (that is p06). Keep current look; only fix open behavior.
- Reuse the p04 route model; do not reintroduce an independent `showDrawPanel` boolean.

## Track A — Functional
### Steps
1. Reproduce: write a failing test in `map-drawing-tools.test.ts` that simulates a single topbar Draw activation and asserts the draw surface becomes open (route panel `draw` active and modal mounted) in one action.
2. Diagnose against the four candidate causes above. Fix the root cause, not the symptom. Most likely: ensure `handleToggleDrawPanel` opens the `draw` route (not merely flips a stale boolean) AND seeds a sensible default tool so the surface is immediately usable (e.g. open in `Select` but with the tool rail interactive, OR default to the last-used tool). Ensure `navigatorStageMode` does not silently swallow the open (if it does, exit stage mode or surface a clear reason).
3. Ensure each tool button (`Select/Point/Line/Polygon/Rectangle/Circle`) calls `handleSetDrawTool` and that `MapDrawingManager` activates the corresponding canvas interaction immediately (no second click).
4. Confirm closing works (toggle off, Escape, modal close button) via the same single source.
5. Make the failing test pass; add per-tool activation assertions.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/map-docking.test.ts` (no regression from p04)
- `npm run typecheck`
- Save summary → `evidence/p05-trackA.md`.

### Done criteria
- One topbar Draw activation opens a usable drawing surface. All five tools activate on first click. Close works. Tests green; typecheck clean.

## Track B — Visual
### Steps
1. Screenshot: click Draw once → modal open with an active/interactive tool rail. Save `evidence/p05-draw-first-click.png`.
2. Screenshot a polygon being drawn to prove tool activation. Save `evidence/p05-draw-polygon.png`. Compare against `baseline/draw-modal.png` and the p00 first-click note.

### Verify
- `screenshot-map-explorer` produced both shots.

### Done criteria
- Visual proves first-click open and live drawing.

## Anti-amnesia exit checklist
- LEDGER: p05 A+B → `done`, phase closed; session-log records the actual root cause found (important for p06/p10).
- STATE: `phases[p05]` trackA/trackB `done` + evidence.
- Next action → `prompts/p06-draw-premium-modal.md`.

## Guardrails
- No Tailwind. No `localStorage` (if you persist last-used tool, use Zustand persist `urban.config.map.draw.*`).
- Reuse p04 route model and `MapDrawingManager`; do not fork the drawing controller.
- Both tracks verified before closing.
