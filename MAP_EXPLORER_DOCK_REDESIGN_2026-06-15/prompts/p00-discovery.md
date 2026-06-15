# p00 — Discovery, Baseline Capture & Anti-Amnesia Spine

> **SESSION BOOTSTRAP (do this first, every time):** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`. Then read this file. This is the entry phase; it changes no production code.

**Phase:** p00 · **Depends on:** none · **Tracks:** A (inventory) + B (baseline screenshots)

## Mission
Establish the immovable reference points the other 19 phases depend on: a confirmed test inventory, and a set of "before" screenshots that every later Track B compares against. Prove the pack's anti-amnesia loop works by updating the ledger and state at the end.

## Why
The owner reported the Map Explorer docks/drawing/status bar feel chaotic and unfinished. Before changing anything we must (a) lock a visual baseline so "premium" is provable as a diff, and (b) confirm which test specs guard the surfaces we will touch, so later phases can extend rather than rediscover them.

## Context primer (self-contained)
Map Explorer renders from `MapExplorerModalRuntimeCore.tsx` (state) → `MapExplorerModalRuntimeView.tsx` (render). The left activity rail hosts workspaces (Overview/Data/Layers/Analyze/Style/Scene/Publish + QA/Review/Diagnostics/Extensions). The right dock (`MapRightDockHost.tsx`) is a tabbed inspector. The Draw modal is a `MapDialogShell` in Core (~6130). Status bar is `MapStatusBar.tsx`. See `../PLAN.md §1` for the full map.

## Files
- `reference` — `../PLAN.md`, `../ANTI_AMNESIA.md` (the maps you are validating).
- `reference` — `src/centerpanel/components/map/__tests__/` (test inventory source).
- `create` — `evidence/p00-trackA.md` (inventory + verification summary).
- `create` — `baseline/*.png` (screenshots).

## Do NOT touch / reuse
- Do not modify any `src/` file in p00. This phase is read-only + capture only.

## Track A — Functional (test & invariant inventory)
### Steps
1. List the specs that currently guard the surfaces this pack touches. At minimum confirm these exist and note pass/fail today:
   - `__tests__/map-drawing-tools.test.ts`
   - `__tests__/map-docking.test.ts`
   - `__tests__/MapRightDockHost.test.tsx`
   - `__tests__/map-right-dock-migration.test.ts`
   - `__tests__/mapRightDockRoutes.test.ts`
   - `__tests__/MapModelBuilderPanel.test.tsx`
   - `__tests__/MapStatusBarRoutes.test.tsx`
   - `__tests__/mapTokenStatus.test.ts`
2. Run the current map test suite to get a green baseline: `npx vitest run src/centerpanel/components/map`.
3. Run `npm run typecheck` and `npm run lint:no-tailwind-centerpanel` to confirm a clean starting tree.
4. Re-scan the round-badge offenders to confirm the p03 list is still accurate: search `borderRadius:\s*(999|9999|"50%"|'50%')` under `src/centerpanel/components/map`.
5. Write `evidence/p00-trackA.md`: the spec list with today's status, the typecheck/lint result, and the confirmed offender list.

### Verify
- `npx vitest run src/centerpanel/components/map`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`

### Done criteria
- `evidence/p00-trackA.md` exists with: current spec pass/fail, clean typecheck/lint confirmation, and the verified offender list.

## Track B — Visual (baseline capture)
### Steps
1. Use the `screenshot-map-explorer` skill to capture the current state of each target surface:
   - `baseline/draw-modal.png` — Draw modal opened (note if it needs >1 click — record that observation).
   - `baseline/right-dock.png` — right dock open on a primary panel (e.g. Inspector or Style).
   - `baseline/models-tab.png` — Analyze workspace → Models tab.
   - `baseline/status-bar-more.png` — status bar with the "More" overflow open (narrow the viewport so overflow triggers).
   - `baseline/badges.png` — a surface showing round/“ready” badges (e.g. Models or a scene strip).
2. Record in `evidence/p00-trackA.md` whether the Draw button opened on first click (the reported bug — this is the p05 acceptance reference).

### Verify
- `screenshot-map-explorer` skill produced all 5 files in `baseline/`.

### Done criteria
- All 5 baseline screenshots saved; first-click Draw behavior recorded.

## Anti-amnesia exit checklist (MANDATORY before exiting)
- Update `../LEDGER.md`: set p00 Track A and Track B to `done`, mark the phase closed, add a session-log entry naming the evidence files.
- Update `../STATE.json`: `phases[p00].trackA.status="done"` + `evidence="evidence/p00-trackA.md"`; `trackB.status="done"` + `evidence="baseline/"`.
- Session-log "Next action" should point to `prompts/p01-token-foundation.md`.

## Guardrails
- No production code edits in p00.
- Do not delete or overwrite existing `__tests__` files.
- Keep all evidence inside this pack folder.
