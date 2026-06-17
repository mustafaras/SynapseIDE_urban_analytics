# p09 Track A — Right dock floating modal shell

Status: done

## Scope delivered
- Added floating-modal geometry contracts in `src/centerpanel/components/map/mapDocking.ts`:
  - `MAP_RIGHT_PANEL_MIN_HEIGHT`, `MAP_RIGHT_PANEL_MAX_HEIGHT`, `MAP_RIGHT_PANEL_FLOATING_MARGIN`
  - `MapRightDockFloatingRect`
  - `clampMapRightDockFloatingRect(...)`
  - `createDefaultMapRightDockFloatingRect(...)`
- Added persisted floating rect state via Zustand `persist` (`layoutPreferences.rightDockFloating`) in `src/stores/useMapExplorerStore.ts`.
- Extended `MapRightDockHost` to support `presentation="floating-modal"` with:
  - portal mount via `getMapOverlayPortalRoot`
  - header drag reusing `useDraggableMapPanel`
  - corner/edge resize handles (west/east/south/south-east)
  - viewport clamp on drag/resize and window-resize
- Extended `MapDockPanelFrame` to accept optional `headerProps` and `headerClassName` so header drag can be attached without custom drag math.
- Runtime plumbing:
  - `MapExplorerModalRuntimeCore.tsx` now persists floating rect and width changes together.
  - `MapExplorerModalRuntimeView.tsx` now passes `floatingRect` and `onFloatingRectChange` to `MapRightDockHost`.
  - Right-dock presentation now uses `floating-modal` on comfortable widths, `side-drawer` fallback on constrained widths.
- Added/updated tests:
  - `map-docking.test.ts` (floating clamp/default geometry)
  - `MapRightDockHost.test.tsx` (floating modal render + resize callback emission)
  - `map-right-dock-migration.test.ts` (draw remains floating route)

## Verification
- `npx vitest run src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts` ✅
- `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx` ✅
- `npx vitest run src/centerpanel/components/map/__tests__/map-docking.test.ts` ✅
- `npm run typecheck` ✅
