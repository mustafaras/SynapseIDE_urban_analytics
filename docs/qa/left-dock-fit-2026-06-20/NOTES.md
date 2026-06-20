# Left dock height regression — fit fix (2026-06-20)

## Symptom
The Map Explorer **left dock** (layer/data side rail) rendered at ~half the
workspace height with a large empty gap below it, instead of fitting the full
container height.

## Root cause
`MapExplorerLayerPanelRail` has passed `height="min(24rem, 54%)"` to
`MapPanelRail` since PR #16 ("strict left/right dock separation"). At that time
`getPanelRailStyle` **ignored** the height (param was `_height`), so the rail
always rendered full-height via `top: 0; bottom: 0` — the prop was dead code.

MFP-18 (`ed9de0b`) changed `getPanelRailStyle(_height)` → `getPanelRailStyle(height)`
and started honoring it: `height != null` now drops `bottom: 0` and applies
`height/maxHeight`. That retroactively activated the stale `min(24rem, 54%)`
cap, collapsing the side rail to ~50% height with a gap below — the regression.

## Fix
Removed the stale `height="min(24rem, 54%)"` prop from `MapExplorerLayerPanelRail`
(`src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx`). With
`height == null`, `getPanelRailStyle` restores `top: 0; bottom: 0`, so the dock
fits the full workspace height again (the long-standing pre-MFP-18 behavior).
MFP-18's height-honoring capability is left intact (now dormant — no caller passes
a height), so a deliberate future height can still be supplied.

## Proof (real MapPanelRail component, chromium-1194 harness)
Rail height vs its workspace container (760px):
- **before.png** — railHeight 384px, **50.5%** of container, **375px** empty gap below.
- **after.png**  — railHeight 758px, **99.7%** of container, **1px** gap → fits.

typecheck clean; map vitest unaffected (71 passed in the shell/a11y subset;
`map-left-panel-responsive-fit` width contracts untouched).
