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

Environment note: this container restores full deps via `npm ci` (registry
reachable). Validation gates that run: `npm run typecheck`, `npx eslint`,
`npx vitest run`. Playwright browser CDN is NOT reachable, so screenshots can't
be captured here — rely on tests + CSS reasoning.

- `[x]` **4 — Bottom-centre scale cluster.** New `MapScaleIndicator.tsx`
  (store-driven, dock-aware, metric+imperial ticked bars + 1:N ratio chip,
  `pointer-events:none`, sits above status bar via `--map-status-h`). Native
  MapLibre bottom-left `ScaleControl` switched off on the main canvas
  (`showScaleBar={false}` in `MapExplorerModalRuntimeCore`); `MapCanvas` + its
  lifecycle test untouched. Commit `2023ad2`.
- `[x]` **6 — MapLibre / geolibre features.** `MapNavExtras.tsx` covers
  Locate-me, Go-to-coordinate, and Full-screen (right-edge, dock-offset,
  collision-free). Saved views continue to ship through `MapBookmarkBar`.
  Swipe compare is now implemented via `MapSwipeCompareOverlay.tsx`: a second
  controlled `MapCanvas` instance mirrors the main viewport through
  `syncViewport`, keeps overlay layers in sync through `useLayerSync`, exposes a
  draggable divider, and lets the user choose a non-active comparison basemap
  from the on-map furniture toggle.
- `[x]` **5 — Unified draggable modals.** `MapDialogShell.tsx` now provides the
  shared draggable chrome, native resize, focus trap, Escape/overlay dismiss, and
  consistent title/action treatment. `MapExportDialog`, `MapDataExportDialog`,
  `MapCsvImportDialog`, and `MapFlowDispatchDialog` all use the shared shell.
- `[x]` **2 — Dock identity + fluidity.** Right dock has the earlier
  discoverable resize grip and now a real collapse-to-rail state that preserves
  the active route, exposes compact panel buttons, and uses a dock-aware
  collapsed width in `mapDocking.ts`. Left rail keeps its mirrored grip
  affordance.
- `[x]` **3 — Status bar premium polish.** Live tone/motion remains
  reduced-motion safe, and each inline segment now exposes a richer hover/focus
  detail popover with compact signal bars instead of only a flat underline.
- `[x]` **1 — Design-debt cleanup.** Right-dock body spacing/borders were
  flattened to reduce stacked-card nesting, and the left dock summary now adapts
  to Publish/Scene/Analyze/Style context instead of always repeating a generic
  workspace line.

- `[x]` **1 (remnant) — Canvas furniture z-index bug fixed.** Discovered via
  Playwright proof: `mapFurniture` resolved to **−5** (`sidebarZIndex−10`), below
  the MapLibre map element (z-index:auto), so ALL on-canvas furniture (scale, nav
  extras, control dock, legend, dispatch feedback, perf, keyboard fallback) painted
  BEHIND the basemap — invisible and non-clickable. Lifted the `mapFurniture`/
  `commandBar` tiers to small positive values (2 / 3) so furniture sits above the
  map yet below the panels (5). Verified: control dock + nav pill + scale now
  render above the map and the go-to-coordinate popover is clickable.

### Visual proof (this session)
Playwright can run here via the baked browser at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`test.use({ launchOptions:
{ executablePath } })`). Basemap tiles need network (unavailable), so proof specs
inject a light backdrop on `.maplibregl-map` for contrast (screenshot aid only).
Proven: bottom-centre scale cluster ("10 km / 5 mi / 1:440,000"), right-edge nav
pill, top-right control dock, go-to-coordinate popover, and **no native
bottom-left scale remnant** (`.maplibregl-ctrl-scale` count = 0). Temp specs +
`e2e/__screens__` are deleted (never committed).

Validation snapshot (latest): `src/centerpanel/components/map` + dispatch =
**92 files / 827 tests green**; typecheck clean; eslint 0 errors. This pass
adds focused coverage for controlled `MapCanvas.syncViewport` and right-dock
collapse-to-rail. JSDOM still prints the existing canvas `getContext` warning in
headless tests, but the suite exits successfully.

## Key anchors

- Overlay composition root: `controllers/MapExplorerModalRuntimeCore.tsx` (MapCanvasRegion, ~L5690+)
- Canvas furniture buttons: `MapCanvasControls.tsx` (furniture group ~L580+, dock render ~L806/842)
- Status bar: `MapStatusBar.tsx` (segments ~L640-831); segment hover/active CSS in `MapWorkspaceShell.tsx` ~L427
- Docks: `sidebar/MapWorkbenchSidebar.tsx`, `MapRightDockHost.tsx`, shared `shell/MapDockPanelFrame.tsx`
- Draggable hook: `useDraggableMapPanel.ts`; modals under `centerpanel/components/(map/)`
- Viewport bookmark store API: `useMapExplorerStore.ts` (`addMapBookmark`/`restoreMapBookmark`/`MapBookmark`)
- Tokens: `mapTokens.ts` (`--map-status-h`, `--map-dock-left/right`, `--map-overlay-safe-*`)
