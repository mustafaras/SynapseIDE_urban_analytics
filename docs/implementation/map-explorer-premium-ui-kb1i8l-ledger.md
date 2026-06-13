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
- `[~]` **6 — MapLibre / geolibre features.** New `MapNavExtras.tsx` adds
  Locate-me, Go-to-coordinate, Full-screen (right-edge, dock-offset, collision-free).
  Saved views already ship via `MapBookmarkBar` (not duplicated). Commit `cda4c77`.
  **Remaining: Swipe compare** — needs an architecture decision (dual synced map
  vs per-layer clip); deferred pending user input, NOT rushed.
- `[~]` **5 — Draggable modals.** `MapFlowDispatchDialog`, `MapDataExportDialog`,
  `MapCsvImportDialog` now use `useDraggableMapPanel` (header drag handle,
  double-click recenters, Escape closes, viewport-clamped, raised shadow). Also
  fixed a pre-existing broken test (`MapExplorerModal.dispatch` — missing
  `MapLayerBookmarksPanel` mock export). Commits `7c64fea`, (this).
  **Remaining:** `MapExportDialog` needs a header/title bar added before it can
  be a clean drag surface; a shared `DialogShell` would DRY all dialogs.
- `[~]` **2 — Dock identity + fluidity.** Right dock: discoverable resize grip
  (hover/focus dotted grip + accent edge) and smooth, drag-safe width transition
  (`data-resizing` gates the animation; reduced-motion respected). Left rail:
  mirrored grip affordance. Commits `739df81`, `1674ab6`.
  **Remaining:** real collapse-to-rail for the right dock; premium interior rhythm.
- `[~]` **3 — Status bar premium polish.** Live "breathing" underline pulse on
  running-tone segments, pending-tone signal, smooth hover micro-interaction with
  accent underline; all reduced-motion safe. (CSS-only in the shell block.) This commit.
  **Remaining:** richer per-segment hover detail popovers / sparklines (needs TSX).
- `[ ]` 1 — Design-debt cleanup (stacked frames/borders, right-dock body nesting, context-aware left summary)
- `[ ]` 6 (swipe) — **Approved approach: two synced MapLibre maps (full swipe).**
  Next: add a second `MapCanvas` instance behind a draggable vertical divider with
  viewport sync; gate behind a furniture toggle.

Validation snapshot (latest): `src/centerpanel/components/map` + dispatch =
**92 files / 825 tests green**; typecheck clean; eslint 0 errors.

## Key anchors

- Overlay composition root: `controllers/MapExplorerModalRuntimeCore.tsx` (MapCanvasRegion, ~L5690+)
- Canvas furniture buttons: `MapCanvasControls.tsx` (furniture group ~L580+, dock render ~L806/842)
- Status bar: `MapStatusBar.tsx` (segments ~L640-831); segment hover/active CSS in `MapWorkspaceShell.tsx` ~L427
- Docks: `sidebar/MapWorkbenchSidebar.tsx`, `MapRightDockHost.tsx`, shared `shell/MapDockPanelFrame.tsx`
- Draggable hook: `useDraggableMapPanel.ts`; modals under `centerpanel/components/(map/)`
- Viewport bookmark store API: `useMapExplorerStore.ts` (`addMapBookmark`/`restoreMapBookmark`/`MapBookmark`)
- Tokens: `mapTokens.ts` (`--map-status-h`, `--map-dock-left/right`, `--map-overlay-safe-*`)
