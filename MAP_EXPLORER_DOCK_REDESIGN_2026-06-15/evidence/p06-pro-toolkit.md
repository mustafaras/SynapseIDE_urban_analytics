# p06+ — Pro multi-functional drawing toolkit (enhancement)

**Built on top of p06** · 2026-06-16 · merged to `master` + deployed to Pages.

The drawing modal was upgraded from "premium look" to a **pro, multi-functional
geospatial sketch workbench**. All four requested capability groups shipped.

## 1. Geometry measurements (CRS-correct)
- New pure helper `src/utils/drawFeatureMeasure.ts`:
  - `measureDrawnGeometry(geometry)` → kind, vertex count, **geodesic** area
    (m²), perimeter, line length, and centroid.
  - `summarizeDrawnGeometries(...)` → totals for the status line.
- Uses the existing geodesic WGS-84 helpers (`sphericalPolygonArea`,
  `polygonPerimeter`, `polylineLength`) — **never** planar area/length in
  EPSG:4326 degrees (CRS guardrail honoured).
- Surfaced as: live status-line totals ("Polygon tool · 2 features · 27.984 km²
  · 4.751 km"), per-row summary, and a full Inspector (Type, Vertices, Area,
  Perimeter/Length, Centroid lat/lng). Metric/imperial unit toggle.

## 2. Feature management
- Per-row: show/hide (eye toggle → `properties.hidden`, filtered out of the map
  source), zoom-to (geodesic bounds → `fitBounds`/`easeTo`), duplicate (offset
  clone), delete, and double-click rename.
- List-level: search/filter box, "All" select-all checkbox, bulk multi-select
  with a danger "Delete (n)" action, and Clear all.

## 3. Import / Export
- Export & Copy all drawings as a GeoJSON FeatureCollection (label + style
  preserved); Import via paste or file load. Parser accepts FeatureCollection /
  Feature / bare Geometry, keeps Point/Line/Polygon, reports skipped + errors.
- New pure helper `src/centerpanel/components/map/drawGeometryOps.ts`
  (`geometryBounds`, `featuresBounds`, `translateGeometry`,
  `duplicateDrawnFeature`, `drawnFeaturesToGeoJSON`,
  `parseDrawnFeaturesFromGeoJSON`).

## 4. Style editor
- Per-feature stroke/fill colour (restrained swatch palette + native colour
  picker), stroke width, and fill opacity — stored in `properties.style` and
  reflected on the map via **data-driven** MapLibre paint expressions
  (`["coalesce", ["get","_fillColor"], accent]`, etc.) with accent fallback.

## Architecture / safety
- All structure lives in `MapDrawingManager` (`DrawModalBody`) + the
  `MapDrawingManager.module.css` CSS Module (no Tailwind in centerpanel). Footer
  handlers unchanged (p07/p08 depend). `MapDialogShell` still owns focus/Escape.
- `DrawnFeature.properties` gained an optional `hidden?: boolean`.

## Verify (all green)
- `typecheck` PASS · `lint:errors` PASS (clean).
- `map-drawing-tools.test.ts` **85 passed** (added geodesic measurement,
  geometry-ops round-trip, and pro-modal render tests).
- Full `src/centerpanel/components/map` + `src/utils` suite **931 passed**.
- CI gate mirror: `test:analytics` **1131 passed**, `build` PASS,
  `perf:budgets` PASS.
- Screenshot: `evidence/p06-draw-pro.png` (rail + live totals + action bar +
  managed feature list + Inspector measurements + style editor).
