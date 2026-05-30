# Known Risks and Limitations

Date: 2026-05-30
Audience: Internal release review
Status: Current release note; Prompt 64 RC gate is blocked

## Prompt 64 RC Blockers

These are current no-go conditions for a Map Explorer release-candidate claim.

| Blocker | Impact | Current mitigation | Concrete limit |
|---|---|---|---|
| Initial-load bundle budget fails. | `npm run validate:rc` stops at `npm run perf:budgets`, so the aggregate command cannot reach its built-in Playwright CI phase. | Heavy GIS surfaces remain mostly lazy-loaded and the previously over-budget Map Explorer lazy chunk is now inside its approved exception. | RC is blocked until initial load is reduced to the 2.44 MiB raw budget or the budget is intentionally revised with fresh evidence. Current measured initial load is 5.63 MiB raw / 1.62 MiB gzip. |
| P40 visual QA has two failures. | Premium design/visual QA cannot be claimed green. | P39 motion checks pass, no-Tailwind guard passes, accessibility audit passes, and 11 of 13 focused P39/P40 tests pass. | RC is blocked until `data-testid="map-activity-rail"` is present in the P40 desktop shell path and the blank-canvas detector threshold passes its bidirectional proof. |
| Full E2E CI did not run inside `validate:rc`. | Smoke/a11y/functional Playwright suites are not proven by the aggregate RC command because the command stops at bundle budgets. | `npm run test:e2e:a11y` was run separately and passed 5/5 on 2026-05-30. | After the bundle budget gate passes, run `npm run validate:rc` again and require `npm run test:e2e:ci` to run inside the aggregate command. |

## Documentation Close-out

Prompt 63 is complete for shipped behavior as of 2026-05-30. The current documentation references are:

- [`../map-explorer-workflow-guide.md`](../map-explorer-workflow-guide.md)
- [`../map-source-support-matrix.md`](../map-source-support-matrix.md)
- [`../architecture/map-crs-and-qa-method-note.md`](../architecture/map-crs-and-qa-method-note.md)
- [`../architecture/map-urban-bridge-contract.md`](../architecture/map-urban-bridge-contract.md)
- [`map-explorer-design-motion-visual-qa.md`](map-explorer-design-motion-visual-qa.md)
- [`map-explorer-p63-documentation-closeout-2026-05-30.md`](map-explorer-p63-documentation-closeout-2026-05-30.md)

Documentation completeness does not certify RC readiness; the Prompt 64 report remains authoritative for current blockers.

## Visibility vs Execution Depth

Release visibility and execution depth are not interchangeable.

- `launch verified` means a surface opens and renders expected UI during automated validation.
- `execution verified` means a representative user journey completed in automation.
- `demo-mode verified` means execution succeeded only on an explicit demo/synthetic path.
- `external dependency gated` means the success path depends on credentials, provider availability, or live endpoints.

Implementation status is tracked separately from verification depth through the following vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

## Operational Risks

| Risk | Impact | Current mitigation | Residual note |
|---|---|---|---|
| Live AI providers require valid credentials and upstream availability. | Provider-backed chat, inference, and external model routing can be unavailable in local or CI environments. | Provider configuration is optional and the workbench remains locally operable without live credentials. | Live upstream responses are environment-dependent, not assumed available. |
| WebSocket and MQTT streaming depend on reachable live endpoints. | Live streaming modes may fail despite the runtime surface being correct. | Deterministic replay mode is built into the Streaming Runtime and is the guaranteed release-verification path. | Live-feed verification remains conditional on broker and network health. |
| Map-provider features depend on external map credentials. | Google Maps and some commercial basemap capabilities may not render in a bare local environment. | Browser-local analytical surfaces and non-provider-specific map capabilities remain independently testable. | External provider failures should not be mistaken for app-shell regression. |
| Browser memory and CPU ceilings still bound large analytical runs. | Very large datasets or long-running simulations may degrade responsiveness on weaker hardware. | Workers, streaming, vector tiling, sampled raster reads, diagnostics, and package restore states make limits visible. | The platform is a browser-first analytical environment, not an unbounded server compute cluster. |
| Initial-load budget regression is active. | The app can still build, but RC performance governance blocks release. | `perf:budgets` keeps the regression explicit. | Current blocker: 5.63 MiB raw initial load vs 2.44 MiB budget. |

## Analytical Limitations

| Limitation | Why it exists | Release interpretation |
|---|---|---|
| External services remain provider-dependent. | WMS, WMTS, WFS, XYZ, OSM, reverse geocoding, COG/STAC, external basemaps, Sentinel Hub, and live 3D sources can be blocked by credentials, CORS, rate limits, network failures, or provider downtime. | Treat these as `environment-dependent`; local map state, import/export, and analytical panels remain independently testable. |
| Large-data performance is browser bounded. | Large GeoJSON, Arrow, GeoParquet, temporal frames, raster samples, vector tiles, CA outputs, detection boxes, and heatmaps execute in a browser-first runtime even when workers are used. | Treat large workloads as `implemented with residual gap`; progress, memory estimates, workers, tiling, and lazy loading mitigate but do not remove client hardware ceilings. |
| CRS defaults are truthful fallbacks, not authoritative reprojection. | Some sources omit projection metadata, and user-declared CRS is not verified source metadata. | Users must confirm CRS before publication, statutory decisions, planar metrics, or corridor/section measurements. |
| GeoPackage CRS handling has a current caveat. | The current GeoPackage commit path labels committed data as EPSG:4326 and requires review. | Non-WGS84 GeoPackages must be verified before metric analysis or release-sensitive use. |
| Raster analysis is sampled/bounded. | GeoTIFF parsing samples bands for histogram/statistics and does not silently read full large rasters on the hot path. | Treat sampled raster QA as review evidence, not full-resolution raster analytics. Missing CRS blocks readiness; missing noData is a warning. |
| Vector-tile and FlatGeobuf workflows can be display/extent scoped. | Tiled/generalized geometry and extent streams are designed for responsiveness. | Low-zoom/tiled geometry must carry approximation caveats; precision-sensitive metrics need full-resolution source geometry. |
| NL query execution is scoped. | NL-to-SQL runs only against visible queryable layers and imported/worker-backed tables. | Treat as `implemented with residual gap`; remote catalogs and non-queryable layers are not silently substituted. |
| AI map actions require confirmation. | Guardrails intentionally prevent automatic apply of model-proposed map changes. | Treat AI assistance as auditable operator support, not autonomous GIS editing. |
| Collaboration is lightweight review sync. | Yjs sync carries annotations, comments, targets, evidence IDs, and presence, not raw source data or heavy geometry. | Treat as `implemented with residual gap`; live multi-user transport and offline/local-only state must remain explicit. |
| 3D Tiles and terrain/city-model paths are metadata/source-handle bounded. | Scene paths preserve vertical-datum and source caveats and do not claim full external tile-payload analysis. | Treat as `implemented with residual gap` for broad 3D Tiles parity. |
| Built-in RAG corpus is curated rather than exhaustive. | Prompt 42 expanded the baseline corpus with academically relevant official sources, but not a complete planning literature index. | Literature completeness still depends on future corpus expansion. |
| Some planning models are exploratory rather than policy-grade forecasting systems. | Many flows prioritize interpretability and reproducibility for urban analysis workflows. | Outputs support analytical review and scenario exploration; they do not replace field validation or statutory decision processes. |

## Governance Risks

| Risk | Current state | Planned action |
|---|---|---|
| Historical completion notes can overstate current surface depth. | The Prompt 63 close-out and Prompt 64 report supersede older pass language for Map Explorer Production GIS. | When current truth changes, update the ledger, source matrix, workflow guide, release validation, known risks, and RC report together. |
| Visual QA can drift from shell implementation. | P40 currently expects an activity-rail test hook that is absent in the tested path. | Restore the canonical hook or update the P40 spec only after confirming the current shell contract. |

## Visual Verification Exceptions

These items cannot be fully guaranteed through a credential-free local walkthrough:

- Live upstream AI responses from external providers.
- Live WebSocket and MQTT feeds beyond deterministic replay connectors.
- Provider-gated map integrations and external basemaps.
- Provider-gated Map Explorer services, EO providers, and live 3D tile sources.

These are visible operational dependencies and are intentionally separated from the locally verifiable release surface.
