# Prompt 06 — Clean canvas controls and overlay safe insets

## Goal
Make the map canvas visually dominant and reduce floating-control clutter by routing all overlay furniture through one safe-inset model.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 10, 6.4, 14
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapCanvasControls.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapSelectionTools.tsx`
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx`

## Target files
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapCanvasControls.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/controllers/MapCanvasOverlayChrome.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapSelectionTools.tsx`
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx`
- `src/centerpanel/components/map/shell/MapCanvasControlDock.tsx`

## Task
1. Collapse scattered overlays into a small number of control islands.
2. Apply the safe-inset contract so controls do not fight for the same pixels.
3. Keep search compact and map-centric.
4. Keep legend, drawing, measurement, selection, bookmarks, temporal, and 3D overlays contextual rather than dominant.
5. Keep keyboard fallback controls reachable and legible.

## Hard constraints
- Do not break drawing, measurement, selection, legend, search, bookmark, temporal, or 3D behavior.
- Do not remove keyboard fallback support.
- Do not create new floating chrome that overlaps the right dock or bottom drawer.
- Do not widen the canvas overlays beyond the reserved inset model.

## Required visible changes
- The canvas should become the strongest visual element in the modal.
- Controls should feel intentional and grouped.
- Drag-and-drop, empty state, and control overlays should look premium and explicit.

## Validation
- Run `typecheck`.
- Run canvas lifecycle and overlay-related tests.
- Run the narrow visual QA proof that checks for overlap/collision regressions.
- Record exact evidence in the ledger.

## Output
- Updated canvas and control-dock files
- Ledger entry with inset strategy and visible result
