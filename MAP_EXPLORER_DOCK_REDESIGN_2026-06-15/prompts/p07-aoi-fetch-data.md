# p07 — Rectangle AOI → Fetch Real Data In Bounds

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p07 · **Depends on:** p06 · **Tracks:** A (bounded fetch pipeline) + B (flow shots)

## Mission
Make a drawn/selected **rectangle AOI** drive a real, bounds-restricted data fetch — so "Fetch data" pulls actual layer/source data clipped to the AOI, not a placeholder.

## Why (problem #2 — blocker)
The owner: *"selected rectangle areas must be able to fetch real data; the drawn/selected areas must run scientific analysis."* The services exist; the rectangle-AOI → fetch-in-bounds path is not coherently wired.

## Context primer (self-contained)
- Footer "Fetch data" currently calls `handleOpenFlowDispatchDialog` (`Core:~6160`). There IS a Flow Dispatch dialog (`controllers/MapFlowDispatchDialog.tsx`).
- AOI/bounds services in `src/services/map/MapAnalysisDispatcher.ts`: `getCompatibleAoiFlows`, `dispatchRecommendationFlow`, `setMapViewRestriction`, `buildBufferedPointBounds`, `SelectionStatisticsSummary`.
- Spatial helpers in `controllers/mapExplorerSpatialHelpers.ts`: `filterFeatureCollectionToBounds`, `getFeatureBounds`, `buildDrawnAoiFromWorkflowResult`, `resolveFlowDispatchAoiCandidate`, `mergeBounds`.
- Drawn features live in Core (`drawnFeatures`); selection in `workflowSelectedFeatures`/`selectedFeatureId`.
- CRS RULE (hard): never compute area/distance in EPSG:4326 — project first. Bounds filtering by lon/lat extent is fine; any metric must declare `requiredCrs`.

## Files
- `edit` — `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` — "Fetch data" handler path; rectangle AOI → bounds → fetch.
- `reference` — `src/services/map/MapAnalysisDispatcher.ts` — `setMapViewRestriction`, `getCompatibleAoiFlows`.
- `edit` — `src/centerpanel/components/map/controllers/mapExplorerSpatialHelpers.ts` — extend `filterFeatureCollectionToBounds` / AOI candidate resolution if needed.
- `reference` — `src/centerpanel/components/map/controllers/MapFlowDispatchDialog.tsx` — the dispatch UI.
- `reference` — `src/services/map/MapEngineAdapter.ts` — layer publication API for any fetched result.
- `create` — `src/centerpanel/components/map/__tests__/map-drawing-aoi-data.test.ts` — the pipeline test.

## Do NOT touch / reuse
- Reuse `MapAnalysisDispatcher` + spatial helpers — do not redefine bounds math.
- Reuse shared GIS contracts (`services/map/contracts/gisContracts.ts`).
- No synthetic data labelled as real — if a source can't be fetched, surface an explicit status (`environment_dependent`/`residual_gap`), never a fake layer.

## Track A — Functional
### Steps
1. From a drawn/selected rectangle, derive AOI bounds via `getFeatureBounds`/`resolveFlowDispatchAoiCandidate`. If multiple features, `mergeBounds`.
2. Wire "Fetch data" so that, for the active queryable layers/sources, it produces a bounds-clipped result using `filterFeatureCollectionToBounds`, and/or restricts the fetch scope via `setMapViewRestriction` so subsequent source loads are AOI-scoped.
3. Publish the clipped result as a derived layer through `MapEngineAdapter`/`addOverlayLayer` with correct provenance (`sourceKind: 'derived'`, method "AOI fetch", generatedAt). Mark capability status explicitly if the underlying source is `environment_dependent`.
4. Keep the Flow Dispatch dialog as the user confirmation surface (no silent auto-apply) — AOI feeds it.
5. Write `map-drawing-aoi-data.test.ts`: draw a rectangle → resolve bounds → fetch → assert a bounds-clipped derived layer (or an explicit "no data / environment-dependent" outcome) with provenance.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-aoi-data.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
- `npm run typecheck`
- Save summary → `evidence/p07-trackA.md`.

### Done criteria
- A rectangle AOI yields a real bounds-clipped fetch with provenance, or an explicit honest "no data available" outcome. Tests green; typecheck clean. No fake data.

## Track B — Visual
### Steps
1. Screenshot the flow: draw rectangle → Fetch data → dispatch dialog showing AOI bounds → resulting clipped layer on the map. Save `evidence/p07-aoi-fetch.png` and `evidence/p07-aoi-result-layer.png`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves AOI-scoped fetch end to end.

## Anti-amnesia exit checklist
- LEDGER: p07 A+B → `done`, phase closed; session-log records which sources are real vs environment-dependent.
- STATE: `phases[p07]` trackA/trackB `done` + evidence.
- Next action → `prompts/p08-aoi-analysis.md`.

## Guardrails
- CRS: never compute metrics in EPSG:4326; project first; declare `requiredCrs`.
- No synthetic-as-real data; capability status explicit.
- Reuse dispatcher/helpers/contracts. No `localStorage`. No Tailwind.
- Both tracks verified before closing.
