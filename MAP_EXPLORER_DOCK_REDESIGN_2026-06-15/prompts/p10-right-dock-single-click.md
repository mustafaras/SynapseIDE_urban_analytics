# p10 — Right Dock Single-Click Open + State Model Cleanup

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p10 · **Depends on:** p09 · **Tracks:** A (one-click open + cleanup) + B (one-click shot)

## Mission
Make the right-dock floating modal open with a **single click** from the topbar, and finish converging the dock state model so there is one obvious, predictable open/close/toggle path.

## Why (problems #3, #9)
The owner wants a "single-click modal from the topbar." p04 unified visibility state; p09 built the floating shell; p10 connects a topbar control to open it in one click and removes any remaining ambiguity.

## Context primer (self-contained)
- The topbar is `MapToolbar.tsx` (command builder ~1906 adds entries) + `MapTopCommandSurface.tsx`. The right dock is opened today via routing helpers (`openRightDockPanel`/`toggleRightDockPanel` in Core, `useMapRightDockRouting.ts`).
- After p04 the route model is authoritative; after p09 `floating-modal` presentation exists.
- Goal: a single topbar affordance opens the right dock (in floating-modal presentation on comfortable widths) to a sensible default panel (e.g. Inspector) in ONE click; clicking again (or the close button) closes it.

## Files
- `edit` — `src/centerpanel/components/map/MapToolbar.tsx` — add/confirm a single "Inspector"/"Panel" topbar command that opens the right dock in one click.
- `reference` — `src/centerpanel/components/map/MapTopCommandSurface.tsx` — keep topbar surfaces consistent.
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — open/close/toggle wired through the route model; default panel + presentation selection.
- `reference` — `src/centerpanel/components/map/controllers/useMapRightDockRouting.ts` — extend, don't duplicate.
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx` — pass single-click handler + presentation.
- `edit` — `src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts` — assert single-click open/close.

## Do NOT touch / reuse
- Reuse the p04 route model and `useMapRightDockRouting`. Do not reintroduce parallel booleans.
- Do not regress p09 floating behavior or responsive fallback.

## Track A — Functional
### Steps
1. Add a single topbar command that calls a one-shot `openRightDock(defaultPanel, presentation)` (route open). One click opens; the same control toggles closed.
2. Choose presentation automatically: floating-modal on comfortable widths, side-drawer on constrained widths (reuse the p09 width check).
3. Audit and remove any remaining double-toggle or two-step open seams for right-dock panels (the dual-source legacy paths from p04 should already be projections — confirm none survive for the right dock).
4. Ensure focus moves into the dock on open and returns to the trigger on close (route `focusReturn`).
5. Test: single dispatch opens the dock to the default panel; second dispatch closes it; reduced-width uses side-drawer.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx`
- `npx vitest run src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts`
- `npm run typecheck`
- Save summary → `evidence/p10-trackA.md`.

### Done criteria
- One topbar click opens the right dock (floating-modal on wide, side-drawer on narrow); toggles closed; focus handled. Tests green; typecheck clean.

## Track B — Visual
### Steps
1. Screenshot: topbar → single click → floating modal appears. Save `evidence/p10-single-click-open.png`. Also capture the narrow-width side-drawer fallback `evidence/p10-narrow-fallback.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves single-click open and responsive presentation choice.

## Anti-amnesia exit checklist
- LEDGER: p10 A+B → `done`, phase closed; session-log notes the topbar command id + default panel.
- STATE: `phases[p10]` trackA/trackB `done` + evidence.
- Next action → `prompts/p11-right-panel-single-column.md`.

## Guardrails
- Reuse route model + routing hook + p09 shell. No parallel state. No Tailwind. No `localStorage`.
- Both tracks verified before closing.
