# Performance Report

## Prompt 41 outcome

- Initial application load now lands at `1.48 MiB raw / 435.74 KiB gzip`, down from the early Prompt 41 baseline of roughly `2.61 MiB raw`.
- The default lazy-entry ceiling remains `500 KiB raw`.
- Only seven intentionally heavyweight lazy surfaces require approved custom ceilings. All other lazy entries are held to the default `500 KiB` budget.
- CI now enforces the bundle policy through `npm run perf:budgets` in `.github/workflows/ci.yml`.

## What changed

- Added a manifest-driven bundle budget checker in `scripts/check-bundle-budgets.mjs` with human-readable and JSON output.
- Enabled manifest output in `vite.config.ts` and added `perf:budgets` plus `perf:budgets:json` scripts in `package.json`.
- Moved `UrbanAnalyticsModal` behind a top-level lazy boundary in `src/App.tsx` with a visible loading fallback.
- Removed `MapEngineAdapter` from cold start in `src/centerpanel/CenterPanelShell.tsx`; completed-run reconciliation now imports it only when needed.
- Replaced reporting-barrel imports in workflow and toolbox surfaces with direct module imports so the indicator catalog no longer leaks into unrelated lazy entries.
- Moved the indicator catalog behind its own lazy boundary inside `src/centerpanel/Tools/ToolsActionPanel.tsx`.
- Split workflow methodology notes from the heavy explainer card by introducing `src/features/education/MethodologyInfoButton.tsx` and lazy-loading the card content.
- Lazy-loaded the education dataset browser in `src/features/education/EducationModule.tsx` with a visible loading fallback.

## Final budget status

### Default budgets

- Initial load budget: `2.00 MiB raw`
- Standard lazy-entry budget: `500 KiB raw`

### Default-budget entries kept under `500 KiB`

- `centerpanel/Flows/CompositeIndicatorFlow`: `499.54 KiB raw / 132.75 KiB gzip`
- `centerpanel/Flows/CellularAutomataFlow`: `493.32 KiB raw / 132.94 KiB gzip`
- `centerpanel/Flows/FacilityOptimisationFlow`: `487.54 KiB raw / 129.94 KiB gzip`

### Approved exception budgets

| Lazy entry | Current raw | Ceiling | Main cost drivers | Rationale |
| --- | ---: | ---: | --- | --- |
| `centerpanel/components/MapExplorerModal` | `1.47 MiB` | `1.56 MiB` | `MapExplorerModal` (`1,108,243 B`), `MapDataImporter` (`250,628 B`), `MapEngineAdapter` (`45,598 B`) | The map explorer intentionally isolates importer, map engine, and dataset-library tooling behind one on-demand surface. |
| `centerpanel/Flows/SunlightSimFlow` | `972.61 KiB` | `1.00 MiB` | `OrbitControls` (`863,922 B`) | The 3D solar workflow keeps the Three.js orbit-control stack isolated to a specialist flow entry. |
| `centerpanel/Flows/CityJSONFlow` | `933.97 KiB` | `1.00 MiB` | `OrbitControls` (`863,922 B`) | CityJSON review uses the same isolated 3D viewer stack. |
| `centerpanel/Flows/VoxCity3DFlow` | `933.95 KiB` | `1.00 MiB` | `OrbitControls` (`863,922 B`) | VoxCity 3D uses the same isolated 3D viewer stack. |
| `node_modules/html2pdf.js/dist/html2pdf` | `914.04 KiB` | `1.00 MiB` | `html2pdf` (`935,976 B`) | Third-party PDF export is only loaded on demand and should be governed separately from routine UI chunks. |
| `features/urbanAnalytics/UrbanAnalyticsModal` | `872.01 KiB` | `950.00 KiB` | `UrbanAnalyticsModal` (`683,268 B`), `catalog` (`190,236 B`) | The full Urban Analytics workbench is now isolated from the shell and allowed a higher ceiling than normal panels. |
| `features/education/EducationModule` | `760.88 KiB` | `800.00 KiB` | `MethodologyExplainer` (`260,851 B`), `MapDataImporter` (`250,628 B`), `EducationModule` (`123,840 B`) | The education workspace packages teaching paths, methodology, and dataset routing into a single dedicated learning surface. |

## Largest budgeted assets

- `assets/MapExplorerModal-DNyy49-R.js`: `1.06 MiB raw / 280.93 KiB gzip`
- `assets/index-Cl8YUw-6.js`: `964.37 KiB raw / 268.75 KiB gzip`
- `assets/html2pdf-C89joLJW.js`: `914.04 KiB raw / 256.75 KiB gzip`
- `assets/OrbitControls-B7EXPK2X.js`: `843.67 KiB raw / 221.65 KiB gzip`
- `assets/UrbanAnalyticsModal-DPPsYgbf.js`: `667.25 KiB raw / 230.11 KiB gzip`
- `assets/es-D11LGVaC.js`: `410.25 KiB raw / 170.74 KiB gzip`
- `assets/MethodologyExplainer-CbMiaUKU.js`: `254.74 KiB raw / 74.99 KiB gzip`
- `assets/MapDataImporter-BzUXUu8X.js`: `244.75 KiB raw / 59.02 KiB gzip`

## Remaining reduction opportunities

- `MapExplorerModal`: split or virtualize the monolithic modal body if map-import tooling needs a tighter ceiling later.
- 3D workflows: replace or slim the `OrbitControls` dependency if Three.js viewer functionality becomes a larger platform focus.
- `UrbanAnalyticsModal`: reduce the eagerly seeded indicator/catalog surface if opening the full workbench becomes a frequent hot path.
- `EducationModule`: separate methodology and dataset-routing concerns if the education workspace needs to meet the default lazy threshold in the future.

## Validation

- `npm run build`
- `npm run perf:budgets`