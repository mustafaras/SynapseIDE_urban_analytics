# Map Explorer — Visual QA Release Checklist

Pre-release manual review checklist for the Map Explorer Production GIS UI.
Complete before tagging a release candidate. Mark each item `[x]` when verified.

---

## A — Desktop (1440×900, Chrome/Edge)

### Shell & Chrome
- [ ] Map Explorer opens without flicker or blank frame
- [ ] Activity rail (left side) shows icons with aria-labels (no silent icon buttons)
- [ ] Command bar title reads "Map Explorer"
- [ ] Layer list shows group headers ("Data Layers", "Analysis Results")
- [ ] Bottom status bar shows layer count and CRS info
- [ ] No horizontal scrollbars in any panel at 1440×900

### Layer Management
- [ ] Adding a layer plays the `.layerFade` entrance animation (subtle, 200ms)
- [ ] Active layer in the activity rail shows the inset accent bar (`.accentGrow`)
- [ ] Status chips (ready/caveat/blocked/demo) are visually distinct from each other
- [ ] Status chip flash (`.statusFlash`) is visible when a layer's status changes
- [ ] Demo layers display a visible `Demo` or `Synthetic` chip — never hidden

### Floating Panels
- [ ] Catalog panel: slides in with `.panelIn` (180ms, no jank)
- [ ] Processing Toolbox: slides in with `.panelIn`
- [ ] Layout Designer: slides in with `.panelIn`
- [ ] Layer Inspector: slides in from right with `.panelIn`
- [ ] All panel close buttons have visible focus rings (keyboard accessible)
- [ ] Empty states show `.fadeIn` animation on first render

### Canvas & Map
- [ ] Map canvas renders polygon fill and border colors (not blank white/black)
- [ ] MapLibre base tiles load within 3 seconds on fast connection
- [ ] 2.5D extrusion panel: building heights visible with correct caveat chip
- [ ] 3D scenario comparison: generated badge (dashed border) is visually distinct from real data

### Progress & Process
- [ ] Processing toolbox progress bar animates with `.progressFill` (1s, linear)
- [ ] Blocked tools show reason before any run (not hidden until after run)
- [ ] Runtime mode chip (Background worker / GEOS / DuckDB) is visible

---

## B — Small Tablet (768×1024, portrait)

- [ ] Activity rail does not overlap the map canvas region
- [ ] Layer list panel does not overflow off-screen
- [ ] Floating panels (toolbox, inspector) remain within viewport bounds
- [ ] Close buttons are reachable without horizontal scroll
- [ ] Status chips do not wrap onto a second line within their containers

---

## C — Short Viewport (1280×600, landscape laptop)

- [ ] Map Explorer dialog header is fully visible (not clipped below viewport)
- [ ] Panel scroll areas activate for tall content (no content lost below fold)
- [ ] Bottom status bar does not overlap floating panel controls
- [ ] No critical action buttons hidden below the viewport

---

## D — High-Contrast Mode (Windows/macOS high-contrast, or forced-colors CSS)

- [ ] Status chips remain readable (text-contrast ≥ 4.5:1 in forced-colors mode)
- [ ] Close buttons have visible outlines (not just color-differentiated)
- [ ] Active state of activity rail items is visible without relying on color alone
- [ ] Progress bar fill is distinguishable from track in forced-colors mode
- [ ] GisEmptyState text is readable (no white-on-white)

---

## E — Reduced Motion (`prefers-reduced-motion: reduce`)

- [ ] `.panelIn` panels appear instantly (no slide animation)
- [ ] `.layerFade` layer rows appear instantly (no fade animation)
- [ ] `.accentGrow` accent bar appears at full width instantly
- [ ] `.statusFlash` chips do not pulse/flash
- [ ] `.progressFill` progress bar fill appears at static width (no animation)
- [ ] `.featurePulse` selected row outline does not pulse
- [ ] Temporal layer playback does not auto-play (if applicable per P46)
- [ ] `window.matchMedia("(prefers-reduced-motion: reduce)").matches === true` in DevTools
- [ ] `getComputedStyle(panelElement).animationDuration` returns `"0s"` for any panel

---

## F — Regression Guards (CI / Automated)

These are verified by `npm run test:e2e:smoke` — confirm green before release:

- [ ] `e2e/map-visual-qa-p40.spec.ts` — all tests pass
- [ ] `e2e/map-motion-p39.spec.ts` — reduced-motion gate passes
- [ ] Canvas nonblank bidirectional proof: blank overlay → detected as blank; real canvas → detected as non-blank
- [ ] `mapVisualQA.test.ts` (vitest) — all 29+ unit tests green
- [ ] `mapMotionSystem.test.ts` (vitest) — all 19 tests green
- [ ] No `console.error` or `console.warn` in the browser during Map Explorer open/close cycle

---

## Reviewer sign-off

| Area | Reviewer | Date | Notes |
|---|---|---|---|
| Desktop shell | | | |
| Tablet layout | | | |
| Reduced motion | | | |
| High contrast | | | |
| CI suite green | | | |
