# Map Explorer Premium UI — polish round (branch `claude/map-explorer-premium-ui-kb1i8l`)

Fresh user-directed polish round on top of `6060bf0` (master premium redesign).
The archived `map-premium-pack-2026-06-12` (geolibre) and the GIS modal pack are
**complete** — this is NOT a resumption of those ladders.

## Scope (user-approved, single pass)

1. **Design-debt cleanup** — remove stacked/duplicate frames & borders, flatten
   right-dock body nesting, make the left-dock summary context-aware.
2. **Left & right dock identity + fluidity** — distinct functions, real
   collapse-to-rail, discoverable resize, premium interior typography/rhythm.
3. **Premium interactive status bar** — clickable segments, live micro-indicators,
   richer tone/motion.
4. **Bottom-centre on-map scale cluster** — premium, dock-aware, collision-free
   (scale bar only; coords/zoom stay in the status bar).
5. **Unified draggable modal system** — one `DialogShell` (drag + resize +
   focus-trap + ESC + consistent chrome), migrate all map dialogs, polish content.
6. **MapLibre / "geolibre" features** — Geolocate, Fullscreen + Go-to-coordinate,
   Saved views (reuse existing `MapBookmark` store), Swipe compare.

Validation per chunk: `npm run typecheck` + targeted `npx vitest run` + `check-gis-modal`.

## Progress

Legend: `[x]` done · `[~]` in progress · `[ ]` todo

- `[x]` **4 — Bottom-centre scale cluster.** New `MapScaleIndicator.tsx`
  (store-driven, dock-aware, metric+imperial ticked bars + 1:N ratio chip,
  `pointer-events:none`, sits above status bar via `--map-status-h`). Native
  MapLibre bottom-left `ScaleControl` switched off on the main canvas
  (`showScaleBar={false}` in `MapExplorerModalRuntimeCore`); `MapCanvas` + its
  lifecycle test untouched. `npm run typecheck` passes.
- `[ ]` 6 — MapLibre features (Geolocate, Fullscreen, Go-to-coordinate, Saved views, Swipe compare)
- `[ ]` 1 — Design-debt cleanup
- `[ ]` 2 — Dock identity + fluidity
- `[ ]` 3 — Status bar interactivity
- `[ ]` 5 — Unified draggable modal system

## Key anchors

- Overlay composition root: `controllers/MapExplorerModalRuntimeCore.tsx` (MapCanvasRegion, ~L5690+)
- Canvas furniture buttons: `MapCanvasControls.tsx` (furniture group ~L580+, dock render ~L806/842)
- Status bar: `MapStatusBar.tsx` (segments ~L640-831); segment hover/active CSS in `MapWorkspaceShell.tsx` ~L427
- Docks: `sidebar/MapWorkbenchSidebar.tsx`, `MapRightDockHost.tsx`, shared `shell/MapDockPanelFrame.tsx`
- Draggable hook: `useDraggableMapPanel.ts`; modals under `centerpanel/components/(map/)`
- Viewport bookmark store API: `useMapExplorerStore.ts` (`addMapBookmark`/`restoreMapBookmark`/`MapBookmark`)
- Tokens: `mapTokens.ts` (`--map-status-h`, `--map-dock-left/right`, `--map-overlay-safe-*`)
