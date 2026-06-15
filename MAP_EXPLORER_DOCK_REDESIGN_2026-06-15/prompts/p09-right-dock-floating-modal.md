# p09 — Right Dock → Draggable / Resizable Floating Modal Shell

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p09 · **Depends on:** p04 · **Tracks:** A (drag+resize+clamp+persist) + B (moved/resized shots)

## Mission
Give the right dock a **floating-modal** presentation: a movable (drag by header), resizable (already partly there), viewport-clamped panel whose position and size persist — the foundation for the single-click modal the owner wants.

## Why (problem #3)
The owner: *"I want the right dock to become a movable, draggable, resizable modal... a single-click modal from the topbar... a premium, animated design."* p09 builds the shell; p10 wires the single-click open; p12 adds motion polish.

## Context primer (self-contained)
- `MapRightDockHost.tsx` already supports WIDTH resize via `handleResizePointerDown` (~229) and renders inside `MapDockPanelFrame`. It does NOT move and is NOT floating.
- A drag hook already exists and is used by `MapDrawingManager`/`MapWorkflowDrawer`: `useDraggableMapPanel.ts` (`useDraggableMapPanel`, `createOpaqueFloatingPanelStyle`). REUSE IT — do not write new drag math.
- Width constants: `mapDocking.ts` `MAP_RIGHT_PANEL_MIN_WIDTH=260`, `MAX=520`. You will add height min/max + viewport clamp.
- Portal: `ui/mapOverlayPortal.ts` for rendering above the map. The host currently has presentations `right-dock | side-drawer`; add `floating-modal`.
- Persistence: Zustand `persist`, namespace `urban.config.map.rightDock.*` (NO `localStorage`).

## Files
- `edit` — `src/centerpanel/components/map/MapRightDockHost.tsx` — add `presentation="floating-modal"`; header drag via `useDraggableMapPanel`; corner/edge resize; viewport clamp.
- `edit` — `src/centerpanel/components/map/MapRightDockHost.module.css` — floating shell chrome (shadow, hairline, rounded? keep square per design), resize handles.
- `reference` — `src/centerpanel/components/map/useDraggableMapPanel.ts` — the hook to reuse.
- `reference` — `src/centerpanel/components/map/ui/mapOverlayPortal.ts` — portal target.
- `edit` — `src/centerpanel/components/map/mapDocking.ts` — add height bounds + a clamp helper for floating position/size.
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx` — mount the host in floating-modal mode (prop plumbing).
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — floating position/size state via Zustand persist; pass to View.
- `edit` — `src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts` — assert floating-modal behavior + clamp.

## Do NOT touch / reuse
- REUSE `useDraggableMapPanel`; never reimplement pointer drag.
- Do not break the existing `right-dock` / `side-drawer` presentations (responsive fallback must still work on narrow widths — floating-modal is for comfortable widths).
- No `localStorage` — Zustand persist only.

## Track A — Functional
### Steps
1. Add a `floating-modal` presentation to `MapRightDockHost`. In that mode, render via the overlay portal with `position: fixed`, draggable by the `MapDockPanelFrame` header using `useDraggableMapPanel`.
2. Add resize from corners/edges (extend the existing width-resize to width+height). Clamp width to [260,520] (or relax max for floating), height to a sensible [min, viewportHeight−margin], and clamp the whole panel inside the viewport on drag and on window resize.
3. Persist `{ x, y, width, height }` per session in Zustand (`urban.config.map.rightDock.floating`). Restore on open; clamp restored values to the current viewport.
4. Keep responsive behavior: on constrained widths, fall back to `side-drawer` (don't force a floating modal that won't fit).
5. Test: open floating modal → drag → resize → window-resize clamps it back inside → persisted values restored.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx`
- `npx vitest run src/centerpanel/components/map/__tests__/map-docking.test.ts`
- `npm run typecheck`
- Save summary → `evidence/p09-trackA.md`.

### Done criteria
- Right dock can float, drag, resize (w+h), clamps to viewport, and persists position/size. Responsive fallback intact. Tests green; typecheck clean.

## Track B — Visual
### Steps
1. Screenshot the floating modal: default position, after dragging to another corner, after resizing larger and smaller. Save `evidence/p09-float-default.png`, `evidence/p09-float-moved.png`, `evidence/p09-float-resized.png`. Compare to `baseline/right-dock.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves a draggable, resizable, well-chromed floating panel (shadow + hairline, square per design).

## Anti-amnesia exit checklist
- LEDGER: p09 A+B → `done`, phase closed; session-log notes the persistence key used.
- STATE: `phases[p09]` trackA/trackB `done` + evidence.
- Next action → `prompts/p10-right-dock-single-click.md`.

## Guardrails
- REUSE `useDraggableMapPanel`. No `localStorage`. No Tailwind.
- Keep `right-dock`/`side-drawer` presentations working (responsive).
- Both tracks verified before closing.
