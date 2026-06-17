# p07 — Track A (Functional) — Rectangle AOI → fetch real data in bounds

**Status:** done · **Date:** 2026-06-16

## What changed

The footer **"Fetch data"** button in the drawing modal previously only opened the
Flow Dispatch dialog (a routing surface, not a fetch). It now drives a real,
bounds-restricted fetch of the active queryable layer data clipped to the drawn /
selected rectangle AOI, publishing a derived layer with provenance — or an explicit
honest "no data" outcome when nothing real is available.

### New pure helpers — `controllers/mapExplorerSpatialHelpers.ts`
- `resolveAoiFetchBounds(drawnFeatures, selectedFeatureId)` — derives AOI bounds +
  label from the selected polygon, or merges every drawn polygon/rectangle envelope
  via the existing `getFeatureBounds` + `mergeBounds` (no new bounds math). Bounds are
  lon/lat extents only — **no metric is computed**, so the EPSG:4326 CRS rule holds.
- `buildAoiFetchResult(sources, bounds, options)` — clips each queryable source with
  the existing `filterFeatureCollectionToBounds`, merges survivors into one derived
  `FeatureCollection`, stamps each feature with its source-layer trace, and returns a
  discriminated outcome:
  - `fetched` → derived `OverlayLayerConfig` (`sourceKind: 'derived'`, provenance
    `method: 'AOI fetch (bounds clip)'`, `generatedAt`, `sourceLayerIds`, bounds
    metadata), capability status **`implemented`**.
  - `empty` → queryable sources exist but none intersect the AOI → capability status
    **`residual_gap`**, **no layer fabricated**.
  - `no-source` → no queryable vector source loaded / resolvable → capability status
    **`environment_dependent`**, **no layer fabricated**.
- Exported constants `AOI_FETCH_METHOD`, `AOI_FETCH_SOURCE_LAYER_ID_FIELD`,
  `AOI_FETCH_SOURCE_LAYER_NAME_FIELD`, and types `AoiFetchSource` / `AoiFetchOutcome` /
  `AoiFetchCapabilityStatus` / `AoiFetchProvenanceSummary`.

### Core wiring — `controllers/MapExplorerModalRuntimeCore.tsx`
- New `handleFetchAoiData` (async): resolves AOI bounds → `setMapViewRestriction(bounds,
  true)` so subsequent source loads are AOI-scoped → resolves every visible queryable
  `geojson` layer's FeatureCollection via the existing `resolveFeatureCollection` →
  `buildAoiFetchResult` →
  - `fetched`: `addOverlayLayer(derived)`, `setActiveAnalysisResultLayers`,
    `fitToBounds`, records a `recordMapReviewEvent` (`analysis-dispatch`/`applied` with
    capability status + bounds), success toast/feedback/announce.
  - `empty` / `no-source`: explicit info/error feedback + toast + announce; **never
    publishes a fake layer**.
- The "Fetch data" button now calls `handleFetchAoiData` (with a `Fetching…` busy
  label + disabled-while-busy guard); the existing `isDrawAoiActionDisabled` gate is
  preserved.
- The **Flow Dispatch dialog is untouched** and remains the user confirmation surface
  for routing the AOI into a scientific workflow — `handleOpenFlowDispatchDialog` is
  still wired to the map context-menu "Analyze this area" path and the AOI still feeds
  it (p08 owns analysis dispatch). No silent auto-apply.

### Reuse / guardrails honored
- Reused `MapAnalysisDispatcher.setMapViewRestriction`, spatial helpers
  (`getFeatureBounds`/`mergeBounds`/`filterFeatureCollectionToBounds`), and
  `resolveFeatureCollection` — no bounds math redefined.
- No synthetic-as-real data: empty/unavailable sources surface explicit capability
  status, never a fabricated layer.
- CRS: only bounds (lon/lat extent) filtering — no area/distance computed in 4326.
- No `localStorage`, no Tailwind (TS-only changes, inline styles), Zustand untouched.

## New test — `__tests__/map-drawing-aoi-data.test.ts`
Covers the full pipeline at the pure-helper layer: draw rectangle → resolve bounds →
clip sources → derived layer / honest no-data:
- `resolveAoiFetchBounds`: single rectangle, selected-over-others, multi-merge, null
  cases.
- `buildAoiFetchResult`: real clipped derived layer (only in-bounds features survive,
  provenance + source trace asserted), multi-source merge, `residual_gap` empty case,
  `environment_dependent` no-source case (incl. empty FeatureCollection).
- End-to-end: rectangle → bounds → clipped derived layer with provenance.

## Verify (results)
- `npx vitest run …/map-drawing-aoi-data.test.ts` → **9 passed**.
- `npx vitest run …/map-drawing-tools.test.ts` → **87 passed** (no regression).
- `npm run typecheck` → **PASS** (clean).
- `npx eslint --quiet` on the 3 changed files → **PASS** (exit 0).
- No-Tailwind guard: `pwsh` unavailable in container (same env note as p00/p04/p06);
  changes are TS-only with no `className` literals, so the guard regex is unaffected.

## Done criteria
A drawn rectangle AOI yields a real bounds-clipped fetch published as a derived layer
with provenance, **or** an explicit honest `residual_gap` / `environment_dependent`
outcome — never fake data. Tests green; typecheck clean.

## Source reality note (real vs environment-dependent)
The fetch clips **whatever queryable vector layers are currently loaded** in Map
Explorer (imported GeoJSON/CSV/etc. and derived analysis layers — all real). It does
**not** invent a remote data source: if no queryable source is loaded, or a source's
data can't be resolved in this environment, the outcome is `environment_dependent`
(honest), and if sources exist but none intersect the AOI it is `residual_gap`.
