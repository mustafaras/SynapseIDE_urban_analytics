# p19 Before/After — Problem-by-Problem Proof Index

The owner reported 8 problems (+ 1 latent architectural smell). Each is paired below with its
baseline "before" and the redesigned "after" evidence, with a one-line verdict. Baselines were
captured at p00 (`baseline/`); after-shots live in `evidence/`.

> Baseline note: p00 captured 5 representative surfaces (`badges`, `draw-modal`, `models-tab`,
> `right-dock`, `status-bar-more`). Problems #2 and #5 had no *separate* p00 baseline shot because
> the behavior was unreachable/multi-column at baseline; their "before" is described from the p00
> findings and the closest baseline frame.

---

## 1. Draw opens on first click; all draw tools usable  · (p04, p05, p06)
- **Before:** `baseline/draw-modal.png` — p00 reproduced the bug: the "drawings" command dispatched
  but the modal never opened (or opened empty with no tool seeded).
- **After:** `evidence/p05-draw-first-click.png`, `evidence/p05-draw-polygon.png`,
  `evidence/p06-draw-premium.png`, `evidence/p06-draw-empty.png`.
- **Verdict:** ✅ First click opens the modal with a real tool pre-seeded (polygon); premium
  segmented tool rail, all tools usable.

## 2. Rectangle AOI fetches real data + runs scientific analysis end-to-end · (p07, p08)
- **Before:** No dedicated p00 baseline — AOI work was unreachable because draw never opened
  (problem #1); the footer "Fetch data" only opened a dialog.
- **After:** `evidence/p07-aoi-fetch.png`, `evidence/p07-aoi-result-layer.png`,
  `evidence/p08-aoi-analysis.png`, `evidence/p08-evidence-registered.png`.
- **Verdict:** ✅ Rectangle AOI now runs a real bounds-clipped fetch (derived layer with provenance,
  6 source → 4 clipped) and dispatches compatible scientific flows that register immutable evidence.

## 3. Right dock = single-click, draggable, resizable, animated floating modal · (p09, p10, p12)
- **Before:** `baseline/right-dock.png` — docked rail, 3-column grid, round "Full" pills, no drag.
- **After:** `evidence/p09-float-default.png`, `evidence/p09-float-moved.png`,
  `evidence/p09-float-resized.png`, `evidence/p10-single-click-open.png`,
  `evidence/p18-right-dock-default.png` (single-column floating inspector).
- **Verdict:** ✅ One-click open, header-drag, edge/corner resize, viewport clamp + persistence,
  restrained reduced-motion-gated entrance.

## 4. Right panel single-column premium flow · (p11)
- **Before:** `baseline/right-dock.png` — dual/three-column layout.
- **After:** `evidence/p11-style-wide.png` / `p11-style-narrow.png`,
  `evidence/p11-selection-wide.png` / `p11-selection-narrow.png`,
  `evidence/p11-report-wide.png` / `p11-report-narrow.png`.
- **Verdict:** ✅ Style/selection/report panels are single-column and readable at narrow + wide.

## 5. Left workspaces single-column premium flow · (p13)
- **Before:** No dedicated p00 baseline — the embedded left workspace was a competing two-column
  split at baseline.
- **After:** `evidence/p13-add-data.png`, `evidence/p13-add-data-wide.png`,
  `evidence/p13-catalog.png`, `evidence/p13-layers.png`,
  `evidence/p18-left-workspace-default.png` (Analyze workspace single-column).
- **Verdict:** ✅ Left Data/Catalog/Analyze workspaces are single-column with a compact summary band.

## 6. Models tab readable single-column · (p14, p15)
- **Before:** `baseline/models-tab.png` — cramped 2-column with overlapping text + colored badges.
- **After:** `evidence/p14-models-flow.png`, `evidence/p14-models-blocked.png`,
  `evidence/p15-models-premium.png`, `evidence/p15-models-run.png`,
  `evidence/p18-models-default.png`.
- **Verdict:** ✅ Single-column builder (Define → Steps → Workflow graph → Editor → Run preview →
  Run controls) with shared `GisSectionHeader` rhythm and calm chips.

## 7. Status bar "More" shows all overflow; premium VS Code interactions · (p16, p17)
- **Before:** `baseline/status-bar-more.png` — overflow count present but the More popover surfaced
  no items.
- **After:** `evidence/p16-status-more.png`, `evidence/p17-status-bar.png`,
  `evidence/p17-status-hover.png`, `evidence/p17-status-more.png`,
  `evidence/p18-overview-default.png` (grouped clusters + More⋯5 in context).
- **Verdict:** ✅ Overflow partition is exhaustive; segments are grouped left/right with hairline
  dividers, honest interactivity, keyboard-operable, and route correctly.

## 8. No round red/green badges, no meaningless "ready" chips · (p01, p02, p03)
- **Before:** `baseline/badges.png` — saturated round red/green badges + fabricated "ready"/"Primary".
- **After:** `evidence/p01-status-language.png`, `evidence/p02-right-dock-clean.png`,
  `evidence/p02-right-dock-condition.png`, `evidence/p03-problems-panel.png`,
  `evidence/p03-attribute-table.png`, `evidence/p03-style-workspace.png`,
  `evidence/p03-review-timeline.png`, `evidence/p03-scene-strip.png`.
- **Verdict:** ✅ Calm square/hairline status chips; meaning via muted tone + text, never saturated
  fills; fabricated tier chips removed (chips now require a live condition).

## 9. (Latent) One dock-visibility model, not three · (p04, p10)
- **Before:** p00 found three overlapping dock-visibility mechanisms (legacy booleans +
  `getMapDockLayout` derivation + `mapRightDockRoutes`).
- **After:** `evidence/p04-parity-draw.png`, `evidence/p04-parity-measure.png`,
  `evidence/p04-parity-pins.png`, `evidence/p04-parity-scientificqa.png`.
- **Verdict:** ✅ The `mapRightDockRoutes` route model is the single source of truth; all four
  contextual surfaces open under one route with the correct dedicated-vs-host render path.

## Cross-cutting consistency (p18)
- `evidence/p18-overview-default.png` / `p18-overview-reduced-motion.png` /
  `p18-overview-high-contrast.png` — the redesigned surfaces read as one premium system across
  default, reduced-motion, and high-contrast (forced-colors) variants.

---

**Summary:** all 8 reported problems (+ the latent dock-model smell) have paired before/after proof
and a ✅ verdict. The pack is ready to archive.
