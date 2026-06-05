# Map Explorer - Visual QA Release Checklist

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
- [ ] `e2e/map-evidence-visual-p62.spec.ts` — raster, temporal, and 3D evidence visual states render with visible state chips
- [ ] Canvas nonblank bidirectional proof: blank overlay → detected as blank; real canvas → detected as non-blank
- [ ] `mapVisualQA.test.ts` (vitest) — all 29+ unit tests green
- [ ] `mapMotionSystem.test.ts` (vitest) — all 19 tests green
- [ ] No `console.error` or `console.warn` in the browser during Map Explorer open/close cycle

---

## G — Prompt 15 Premium Shell Polish Delta

- [ ] Sidebar, inspector, and bottom panel headers use the same compact chrome and visible focus treatment
- [ ] Long layer, source, readiness, and task labels wrap or truncate without escaping their parent row
- [ ] Sidebar workspace sections use separators for shell structure; repeated rows remain scan-friendly without card-in-card chrome
- [ ] Demo and synthetic chips remain distinguishable without relying on color alone
- [ ] Panel scroll areas contain overflow without creating horizontal page or modal scrollbars
- [ ] Forced-colors mode keeps focus rings, status chips, panel borders, and progress bars readable
- [ ] Desktop (1440×900), tablet (768×1024), and short viewport (1280×600) smoke checks show no text overlap or panel/status-bar overlap

## H — Prompt 16 Regression and Visual QA Delta

- [ ] Map Explorer opens, closes, and reopens from the Urban Analytics workbench without a blank canvas or lost entry point
- [ ] Every activity rail item (Overview, Data, Layers, Analyze, Style, Scene, Publish, QA, Review, Diagnostics, Extensions) changes the active shell state and keeps the canvas visible
- [ ] Hidden commands remain reachable through the command palette, including catalog, contents, processing toolbox, figure composer, QA, and GeoJSON export
- [ ] Add Data, Layers Contents, layer inspector, QA Problems, and Attributes bottom tab are reachable without floating duplicate chrome
- [ ] Analyze tabs open Workflows, Tools, Query, and Models in the sidebar; Scene tabs open Raster, 3D, Zoning, Massing, and Sun/Shadow; Publish tabs open Figure, Data Export, Report, Offline Package, and Review Package
- [ ] Desktop (1440×900), tablet (768×1024), and short viewport (1280×600) automated checks show no horizontal overflow and no bottom-panel/status-bar overlap

---

## I — Prompt 56 Final Readiness Notes (2026-06-04)

Automated final gate status:

| Area | Evidence | Result |
| --- | --- | --- |
| Desktop 1440x900 | `npm run test:e2e -- e2e/map-modal-layout.spec.ts` viewport screenshot path | Pass: map, layer rail, bottom status, and canvas stayed visible with no critical overlap. |
| Tablet 768x1024 | `npm run test:e2e -- e2e/map-modal-layout.spec.ts` constrained viewport path | Pass: layer panel switches to the constrained layout and controls remain reachable. |
| Short viewport 1280x600 | `npm run test:e2e -- e2e/map-modal-layout.spec.ts` short viewport path | Pass: modal header, panel scroll regions, and bottom status remain usable without critical overlap. |
| Reduced motion | `npm run test:e2e -- e2e/accessibility-audit.spec.ts`; `npx vitest run src/centerpanel/components/map` includes motion system tests | Pass: reduced-motion accessibility route and component motion contracts stayed green. |
| High contrast | `npm run test:e2e -- e2e/accessibility-audit.spec.ts`; `npx vitest run src/centerpanel/components/map` includes visual QA/status tests | Pass: forced-colors focus, active, blocked, and demo/synthetic states remain non-color-only. |
| Command palette reachability | `npm run test:e2e -- e2e/map-modal-layout.spec.ts` and accessibility route | Pass: hidden routes, command palette, density/lens, QA Problems, and import-to-inspect route remained reachable. |
| Canvas nonblank | `npm run test:e2e -- e2e/map-modal-layout.spec.ts`; `npm run test:e2e -- e2e/map-evidence-visual-p62.spec.ts` | Pass: base map canvas remained visible; raster and 3D evidence canvases passed pixel-diversity checks. |
| No critical overlap | `npm run test:e2e -- e2e/map-modal-layout.spec.ts` | Pass: desktop/tablet/short checks passed and no blocking overlap was detected. |

Final validation commands run:

- `npm run typecheck`
- `npm run lint:errors`
- `npm run lint:no-tailwind-centerpanel`
- `npx vitest run src/centerpanel/components/map` (74 files, 699 tests)
- `npx vitest run src/services/map` (60 files, 503 passed, 2 skipped)
- `npm run test:e2e -- e2e/map-modal-layout.spec.ts` (31/31)
- `npm run test:e2e -- e2e/accessibility-audit.spec.ts` (6/6)
- `npm run test:e2e -- e2e/map-evidence-visual-p62.spec.ts` (1/1)
- `npm run build`

Residual risks:

- `e2e/map-modal-layout.spec.ts` passes but the Vite browser console still emits one React warning: `Cannot update a component (MapExplorerModal) while rendering a different component (MapExplorerModal)`. No user-visible failure was observed; this should be resolved before a strict console-clean release gate.
- `npm run build` passes with existing Vite/Rolldown warnings for `sql.js` browser externalization (`fs`/`crypto`), `new URL("./", import.meta.url)` runtime resolution, plugin timing, and chunks larger than 2000 kB.
- `src/services/map` retains 2 skipped tests in the service suite; the run otherwise passed.

Prompt 56 fixes made during final QA:

- `GisStatusChip` no longer mixes `border` shorthand with `borderStyle`, removing the repeated React style-property conflict warning from map-modal e2e.
- Raster evidence noData status chips now report `noData declared` while raw noData values remain visible in analytical chart/detail context.
- `e2e/map-evidence-visual-p62.spec.ts` now seeds temporal playback through an actual demo overlay layer and navigates to Scene > Temporal before asserting the player, matching the current product route.

## Reviewer sign-off

| Area | Reviewer | Date | Notes |
|---|---|---|---|
| Desktop shell | | | |
| Tablet layout | | | |
| Reduced motion | | | |
| High contrast | | | |
| CI suite green | | | |
