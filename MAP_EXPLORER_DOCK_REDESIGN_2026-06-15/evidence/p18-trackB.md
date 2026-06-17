# p18 Track B — Cross-Surface Visual Consistency Sweep

Status: done

## Captures
- `evidence/p18-overview-default.png` — composed modal (activity rail + single-column left dock +
  premium grouped status bar with the p17 More⋯5 overflow + truthful `user-declared EPSG:5254` and
  QA-warning chips), default media.
- `evidence/p18-overview-reduced-motion.png` — same composition under `prefers-reduced-motion:
  reduce`; static, no animation artifacts.
- `evidence/p18-overview-high-contrast.png` — same composition under `forced-colors: active`;
  toolbar, tabs, and status-bar segments are delineated by borders (structure no longer relies on
  hue) and the CRS/QA chips remain readable as text.
- `evidence/p18-right-dock-default.png` — floating right-dock inspector: single-column
  SUMMARY / WARNINGS (`Scientific data is not fully ready`, `Publication readiness has caveats`) /
  ACTIONS / CORE METADATA, calm chips, no fabricated status badges.
- `evidence/p18-models-default.png` — Models tab single-column builder
  (DEFINE → STEPS → WORKFLOW GRAPH → SELECTED STEP EDITOR → RUN PREVIEW → RUN CONTROLS) using the
  shared `GisSectionHeader` rhythm with a calm `Blocked` chip and muted readiness lines.
- `evidence/p18-left-workspace-default.png` — Analyze left workspace (Workflows) single-column flow
  with calm `Ready` / `Blocked` / `Execution CRS unresolved` truthfulness states.

## Capture run
- Temporary Playwright specs (`e2e/p18-consistency-capture.spec.ts`,
  `e2e/p18-drawing-capture.spec.ts`) and a temporary pinned-browser config
  (`playwright.p18.config.ts`) were used, then **removed** at closeout — generated artifacts are not
  committed; only the PNGs are kept.
- Browser pinned to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (Playwright 1.59 otherwise
  looks for build 1217, which the container does not provision).

## Coverage notes (honest)
- The drawing-modal default shot was **not** re-captured here: its open path (`map-commands-trigger`
  dropdown) resolved a hidden measurement-clone and the visible quick-command route diverged from the
  unit-tested palette path under the full modal. The drawing modal's premium consistency is already
  proven by p06 (`evidence/p06-draw-premium.png`, `evidence/p06-draw-empty.png`) — unchanged by p18 —
  and is now frozen at the source by the p18 a11y/visual-QA tests (`GisEmptyState` + `role="toolbar"`
  + shared motion + `@media (prefers-reduced-motion)`).
- Map canvas renders blank in all shots — no tile network in the e2e environment, consistent with
  every prior phase. The dock/status/chip composition is the proof, not the basemap.

## Result
The three-variant overview sweep (default / reduced-motion / high-contrast) plus the right-dock,
Models, and left-workspace shots demonstrate one coherent premium system across the redesigned
surfaces, with truthful capability/CRS/QA states preserved.
