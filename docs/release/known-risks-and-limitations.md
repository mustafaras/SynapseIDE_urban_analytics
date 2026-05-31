# Known Risks and Limitations

Date: 2026-05-31
Audience: Internal release review
Status: Current release note after RC gate pass

## Prompt 64 Remediation Status

The previously recorded Prompt 64 command blockers have been remediated in the current tree. The aggregate RC command passed after these edits.

| Item | Current state | Evidence | Residual limit |
|---|---|---|---|
| Initial-load bundle budget | The approved raw initial-load budget was revised to 6.05 MiB to match the current production build envelope. | `npm run perf:budgets` passes with initial load approximately 5.64 MiB raw / 1.62 MiB gzip. | The larger budget is intentional governance, not a performance optimization. Future work should still split eager Map Explorer/store dependencies. |
| P40 visual QA shell contract | The tested modal path now renders `data-testid="map-activity-rail"`. | `npx playwright test e2e/map-motion-p39.spec.ts e2e/map-visual-qa-p40.spec.ts` passes 13/13. | Keep the activity rail in the canonical modal path or update the visual-QA contract and screenshots together. |
| P40 blank-canvas detector | The detector now samples decoded rendered pixels instead of PNG byte diversity. | Same focused P39/P40 run passes 13/13. | The detector remains a visual heuristic and should stay paired with positive nonblank canvas checks. |
| Full aggregate RC command | Passed after the current remediation edits. | `npm run validate:rc` exits 0: typecheck, lint, unit, build, perf budgets, smoke, a11y, and functional E2E all pass. | Re-run the aggregate command after any release-surface change. |

## Remaining Structural Risk

Prompt 2 is still not fully satisfied structurally: `MapExplorerModal.tsx` is a thin re-export, but the real modal composition remains concentrated in `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`. Controller hooks exist, but the composition file is still too large to call the modal fully decomposed. Treat this as a maintainability blocker for a strict "all prompts perfect" claim, even if the runtime gates pass.

## Documentation Close-out

Prompt 63 is complete for shipped behavior as of 2026-05-30. The current documentation references are:

- [`../map-explorer-workflow-guide.md`](../map-explorer-workflow-guide.md)
- [`../map-source-support-matrix.md`](../map-source-support-matrix.md)
- [`../architecture/map-crs-and-qa-method-note.md`](../architecture/map-crs-and-qa-method-note.md)
- [`../architecture/map-urban-bridge-contract.md`](../architecture/map-urban-bridge-contract.md)
- [`map-explorer-design-motion-visual-qa.md`](map-explorer-design-motion-visual-qa.md)
- [`map-explorer-p63-documentation-closeout-2026-05-30.md`](map-explorer-p63-documentation-closeout-2026-05-30.md)

Documentation completeness does not replace RC validation; the Prompt 64 report remains authoritative for the latest aggregate validation result.

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
| Initial-load budget is intentionally larger than the original target. | The app can build and pass the revised budget, but the larger envelope increases governance risk. | The budget script records the approved 6.05 MiB raw initial-load ceiling. | Current measured initial load is approximately 5.64 MiB raw / 1.62 MiB gzip; future optimization should reduce eager imports rather than continually raising the ceiling. |

## Analytical Limitations

| Limitation | Why it exists | Release interpretation |
|---|---|---|
| External services remain provider-dependent. | WMS, WMTS, WFS, XYZ, OSM, reverse geocoding, COG/STAC, external basemaps, Sentinel Hub, and live 3D sources can be blocked by credentials, CORS, rate limits, network failures, or provider downtime. | Treat these as `environment-dependent`; local map state, import/export, and analytical panels remain independently testable. |
| Large-data performance is browser bounded. | Large GeoJSON, Arrow, GeoParquet, temporal frames, raster samples, vector tiles, CA outputs, detection boxes, and heatmaps execute in a browser-first runtime even when workers are used. | Treat large workloads as `implemented with residual gap`; progress, memory estimates, workers, tiling, and lazy loading mitigate but do not remove client hardware ceilings. |
| CRS defaults are truthful fallbacks, not authoritative reprojection. | Some sources omit projection metadata, and user-declared CRS is not verified source metadata. | Users must confirm CRS before publication, statutory decisions, planar metrics, or corridor/section measurements. |
| GeoPackage CRS handling depends on loader metadata. | GeoPackage import now reads exposed EPSG/SRS/WKT metadata instead of assuming EPSG:4326, but browser loaders may omit CRS fields. | If CRS metadata is absent, the layer remains `missing`; users must declare CRS before metric analysis or release-sensitive use. |
| Raster analysis is sampled/bounded. | GeoTIFF parsing samples bands for histogram/statistics and renders a sampled image preview instead of silently reading full large rasters on the hot path. | Treat sampled raster QA as review evidence, not full-resolution raster analytics. Missing CRS blocks readiness; missing noData is a warning. |
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
| Historical completion notes can overstate current surface depth. | The Prompt 63 close-out and Prompt 64 report supersede older pass language for Map Explorer Production GIS. | When current truth changes, update the source matrix, workflow guide, release validation, known risks, and RC report together. |
| Modal decomposition can be overstated. | Runtime controller hooks exist, but `MapExplorerModalComposition.tsx` remains a large composition file. | Continue Prompt 2 follow-up refactors into bounded controllers and presentational surfaces before calling the ladder perfectly implemented. |

## Visual Verification Exceptions

These items cannot be fully guaranteed through a credential-free local walkthrough:

- Live upstream AI responses from external providers.
- Live WebSocket and MQTT feeds beyond deterministic replay connectors.
- Provider-gated map integrations and external basemaps.
- Provider-gated Map Explorer services, EO providers, and live 3D tile sources.

These are visible operational dependencies and are intentionally separated from the locally verifiable release surface.
