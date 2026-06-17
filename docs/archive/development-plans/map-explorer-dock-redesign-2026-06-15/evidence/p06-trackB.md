# p06 — Track B (Premium drawing modal — visual)

**Phase:** p06 · **Track:** B (premium redesign) · **Status:** done · 2026-06-16

## What changed (visual)

The drawing modal is now a premium, legible drawing surface. Structure was moved
into `MapDrawingManager` (`presentation="modal"`) + a new CSS Module
(`MapDrawingManager.module.css`); the footer hierarchy lives in
`MapExplorerModalRuntimeCore`.

1. **Tool rail — premium segmented control.** Icon + label per tool, equal-width
   segments, hairline separators, no rounds. Active tool gets the calm selection
   tint + a 2px inset accent stripe (`--syn-interaction-active`). Hover/focus
   states added via the CSS module (focus-visible outline, subtle hover tint).
2. **Status line — one calm summary.** The raw "Tool Select / Features 0 /
   Selected None" row is replaced by a single dense hairline line, e.g.
   **"Polygon tool · 1 feature"** (with "· selected Polygon" when a feature is
   selected).
3. **Footer hierarchy.** `Fetch data` is the **primary** action (filled
   restrained accent), `Add as layer` is **secondary** (bordered ghost),
   `3D buildings` is **tertiary** (borderless ghost). The `N drawings / tool`
   meta is right-aligned. All three keep their original handlers
   (`handleOpenFlowDispatchDialog`, `handleAddDrawingsAsLayer`, scene tab).
4. **Empty state.** Uses `GisEmptyState` — pencil glyph, "No drawn features",
   "Pick a tool above to start sketching on the map." Plus a `GisSectionHeader`
   ("Drawn features") for the list region.
5. **Motion.** Modal body uses `motion.module.css` `panelIn` (fade + slight
   slide) on entrance; the rail transitions and `panelIn` both have
   `prefers-reduced-motion: reduce` counterparts (static when reduced).

## Screenshots (proof)
- `evidence/p06-draw-premium.png` — modal **with** a drawn feature: premium tool
  rail (Polygon active), calm status "Polygon tool · 1 feature", "DRAWN FEATURES"
  section + Clear all, feature row, and the primary/secondary/tertiary footer
  with right-aligned "1 drawing / polygon" meta.
- `evidence/p06-draw-empty.png` — modal **empty**: same rail + status
  ("Polygon tool · 0 features"), `GisEmptyState` ("No drawn features…"), and the
  AOI footer actions correctly **disabled** (Fetch data / Add as layer dimmed).
- Baseline reference: `baseline/draw-modal.png` (pre-redesign map shell).

## Capture method
- Temp spec `e2e/p06-draw-capture.spec.ts` (deleted at closeout). Opened via the
  command palette (Ctrl+K → type "drawings" → option `…-drawings`), seeded a
  polygon AOI through `useMapExplorerStore`, screenshotted the
  `Drawing tools modal` dialog, then cleared features for the empty shot.
- **Env note:** the container's network policy blocks `cdn.playwright.dev`, so
  the installed Playwright (wants chromium build 1217) can't fetch a browser.
  The capture spec pinned `launchOptions.executablePath` to the pre-provisioned
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. First Vite mount needs a
  long warm-up (~1–3 min) before the IDE entry button renders.

## a11y audit coverage
- `npm run test:e2e:a11y` (`e2e/accessibility-audit.spec.ts`) does **not**
  exercise the drawing modal (no draw references) — **coverage gap noted**, not a
  regression. The drawing modal's a11y contract (toolbar role, `aria-pressed`,
  roving tabindex, disabled-state) is covered by the Track A unit tests in
  `map-drawing-tools.test.ts` §6b instead.

## Done criteria
- Premium rail, calm status, real action hierarchy, smooth (reduced-motion-aware)
  motion, GisEmptyState — all verified in the two screenshots. ✅
