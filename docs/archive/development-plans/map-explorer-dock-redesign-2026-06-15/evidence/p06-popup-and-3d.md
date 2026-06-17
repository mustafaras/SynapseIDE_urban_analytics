# p06+ — Feature popup redesign + one-click AOI → 3D buildings

2026-06-16 · merged to `master` + deployed.

## 1. Feature Details popup (map object click) — was clipped & off-design
`buildFeaturePopupHtml` (MapCanvas) rebuilt:
- **No clipping:** fixed-width self-contained card (17rem), each value wraps
  (`overflow-wrap:anywhere; word-break:break-word; min-width:0`) so long OSM ids
  / building ids / source names render in full.
- **On-design:** premium dark card themed via `stylePremiumPopupContainer`
  (square corners, hairline border, dropdown shadow, themed tip + close button),
  mono dense rows, uppercase muted labels, "Feature" eyebrow, and a square
  restrained-accent "Add to report" primary button — consistent with the drawing
  modal and the rest of the GIS UI. Popup `maxWidth` set so the card isn't capped.
- Verified by `map-feature-popup.test.ts` (5 tests): values rendered in full,
  wrapping styles present, square design, 12-row cap, null on empty.

## 2. Rectangle AOI → 3D buildings — was "too complex / didn't work"
Before: the drawing modal's "3D buildings" only opened the VoxCity scene anchored
to the map centre; the user then had to find and click "Fetch OSM buildings"
inside the panel.

Now it is **one click**: `handleOpen3DBuildingsForAoi` (Core)
- resolves the AOI (selected, else first drawn polygon/rectangle),
- fits the map to the AOI bounds,
- opens the VoxCity scene,
- bumps `voxCityAutoFetchToken` → `MapVoxCityOverlay` auto-runs
  `handleFetchOsmBuildings` for that AOI (it already resolves the drawn AOI via
  `resolveMapAnalysisBounds`).
The button is disabled until something is drawn; with no polygon it announces a
clear hint.

E2E proof (temp, deleted): draw rectangle → click "3D buildings" → VoxCity scene
opens and the **Overpass OSM-buildings request is auto-queued for the AOI**
(progress card "OSM buildings — Queued Overpass request"). Screenshot:
`evidence/p06-aoi-3d-buildings.png`.

## Verify (all green)
- `typecheck` PASS · `lint:errors` PASS.
- `map-drawing-tools` + `map-feature-popup` **92**, full map+utils **938**,
  `test:analytics` **1131**, `build` PASS, `perf:budgets` PASS.
