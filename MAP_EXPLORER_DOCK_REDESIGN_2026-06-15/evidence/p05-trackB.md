# p05 — Track B (Visual) — Drawing first-click open

**Status:** done · **Date:** 2026-06-15

## What was captured

Temporary spec `e2e/p05-draw-first-click-capture.spec.ts` (deleted at closeout)
exercised the **real** open path: open Map Explorer → seed an overlay layer →
open the command palette (Ctrl+K) → filter to **Drawings** → click it **once**
(`onToggleDrawPanel` → `handleToggleDrawPanel`, the fixed handler).

- **`evidence/p05-draw-first-click.png`** — after the single Draw activation the
  drawing modal ("Draw — Sketch / AOI / edit") is open with an interactive tool
  rail (Select · Point · Line · Polygon · Rect · Circle). **Polygon is
  pre-selected** (`aria-pressed=true`), Select is `aria-pressed=false`, and the
  footer reads `polygon` — i.e. the surface opens on a real, usable tool, not the
  empty Select state. The spec also asserted `store.activeDrawTool === 'polygon'`
  after the one click.
- **`evidence/p05-draw-polygon.png`** — with the polygon tool still active, a real
  polygon drawing ("Study area AOI") is present in the modal's feature list
  (Features: 1, footer `1 drawing / polygon`), proving the polygon tool activates
  and produces a polygon.

## Verify

- `npx playwright test e2e/p05-draw-first-click-capture.spec.ts` → **1 passed**.
  Assertions encoded in the run: modal visible, Polygon `aria-pressed=true`,
  Select `aria-pressed=false`, `activeDrawTool === 'polygon'`, drawn feature
  visible in the modal.
- Both PNGs inspected: tool rail interactive, polygon highlighted, feature listed.

## Done criteria

✅ Visual proves first-click open onto a usable (polygon) tool.
✅ Visual proves live polygon drawing / tool activation.

## Notes for later phases

The drawing modal keeps its current (non-premium) look — p06 owns the visual
redesign. Behaviour only was changed here.
