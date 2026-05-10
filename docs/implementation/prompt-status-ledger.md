# Urban Analytics Prompt Status Ledger

Date: April 24, 2026  
Maintained by: Remediation Correction Pass

## How to read this ledger

This is the current-state truth source for strengthening prompts `01-43`.

Map Explorer has a dedicated prompt ledger for prompts `01-36`: `docs/implementation/map-explorer-prompt-ledger.md`.

Status vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

Interpretation rules:

- Historical prompt completion notes capture delivery milestones at the time they were written.
- When a historical completion note overstates current reality, this ledger supersedes it for present-tense engineering and release decisions.
- Release visibility is tracked separately from implementation status in `docs/release/visual-completeness-checklist.md` and `docs/release/release-candidate-validation.md`.

## Prompt 01-14

| Prompt | Title | Current-state status | Current truth | Current-state evidence |
|---|---|---|---|---|
| 01 | Program Initiation, Architectural Mapping, and Delivery Doctrine | implemented | The strengthening program doctrine is now supplemented by remediation sequencing, current-state module tracking, and explicit completion reporting. | `URBAN_ANALYTICS_REMEDIATION_SEQUENTIAL_PROMPTS.md`; `docs/implementation/prompt-01-completion.md`; `docs/implementation/module-matrix.md` |
| 02 | Spatial Weights Infrastructure | implemented | Spatial weights, normalization helpers, and supporting test coverage are present. | `docs/implementation/prompt-02-completion.md` |
| 03 | Global Moran's I with Permutation Inference | implemented | Global Moran's I engine and tests are present. | `docs/implementation/prompt-03-completion.md` |
| 04 | Local Moran's I and LISA Cluster Mapping | implemented | Local Moran/LISA analytics, map publication, and review wiring are present. | `docs/implementation/prompt-04-completion.md` |
| 05 | Getis-Ord Gi* Hot Spot Analysis | implemented | Gi* computation, panel execution, and publication are present. | `docs/implementation/prompt-05-completion.md` |
| 06 | OLS with Full Spatial Diagnostics | implemented | OLS and diagnostics are present and tested. | `docs/implementation/prompt-06-completion.md` |
| 07 | Geographically Weighted Regression | implemented | GWR implementation and tests are present. | `docs/implementation/prompt-07-completion.md` |
| 08 | STAC Client and Cloud Optimized GeoTIFF Reader | implemented with residual gap | STAC and COG connector libraries now drive first-class Toolbox operator workflows including cloud-filtered STAC search, result selection, COG metadata preview, and sample-window reads for uncompressed tiled assets. Imported local raster handling and direct raster-image rendering remain incomplete. | `docs/implementation/prompt-08-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `e2e/eo-connectors.spec.ts` |
| 09 | Sentinel Hub Connector | environment-dependent | The connector library and tests exist, and Toolbox now exposes credential-aware Sentinel catalog and process workflows with explicit dependency messaging. Successful live catalog/process execution still depends on external credentials and upstream availability. | `docs/implementation/prompt-09-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `e2e/eo-connectors.spec.ts` |
| 10 | Completion of the Five Placeholder Analytical Flows | implemented | The formerly placeholder workflows are materially implemented and publish to review/report surfaces. | `docs/implementation/prompt-10-completion.md` |
| 11 | PCA and Cluster Analysis | implemented | PCA and clustering engines are implemented and map-adapted. | `docs/implementation/prompt-11-completion.md` |
| 12 | ONNX Runtime Web Infrastructure | implemented | Browser-side ONNX runtime and model registry infrastructure are present and tested. | `docs/implementation/prompt-12-completion.md` |
| 13 | Land Cover Classification Pipeline | implemented with residual gap | GeoAI Lab now runs land-cover classification against explicit real raster sources from the EO registry and an explicitly labeled demo source. Real-source provenance is persisted, but the browser-safe model package is still demo-hosted and real-source runs do not have reference labels for accuracy scoring. | `docs/implementation/prompt-13-completion.md`; `src/centerpanel/Tools/components/GeoAILab.tsx`; `e2e/geoai-real-data.spec.ts` |
| 14 | Natural Language to Spatial SQL | implemented with residual gap | Deterministic NL-to-SQL is implemented, and GeoAI Lab executes accepted queries against live project overlays and imported worker-backed spatial tables in SpatialDB while preserving explicit demo mode and saved execution provenance. It does not automatically federate every possible project dataset, remote catalog, or non-queryable layer. | `docs/implementation/prompt-14-completion.md`; `docs/implementation/remediation-prompt-06-completion.md`; `src/centerpanel/Tools/components/GeoAILab.tsx`; `src/engine/spatial-db/SpatialDB.ts`; `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`; `e2e/geoai-real-data.spec.ts` |

## Prompt 15-29

| Prompt | Title | Current-state status | Current truth | Current-state evidence |
|---|---|---|---|---|
| 15 | High-Performance Building Extrusion | implemented with demo mode | The viewer prioritizes real building sources from Map Explorer polygon layers, imported project layers, and optional CityJSON-derived geometry when available, while retaining an explicitly labeled sample quick-start path plus completed-run provenance and solar handoff support. | `docs/implementation/prompt-15-completion.md`; `docs/implementation/remediation-prompt-08-completion.md`; `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`; `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts`; `e2e/voxcity-real-data.spec.ts` |
| 16 | CityJSON Loader | implemented | Real CityJSON import is present and visible in the workflow library. | `docs/implementation/prompt-16-completion.md` |
| 17 | Sunlight and Solar Exposure Simulation | implemented with demo mode | The simulator prioritizes real building geometry from Map Explorer layers, CityJSON-derived volumes, and explicit Building Viewer handoffs when available, while preserving an explicitly labeled sample quick-start path and persisted run provenance. | `docs/implementation/prompt-17-completion.md`; `docs/implementation/remediation-prompt-08-completion.md`; `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`; `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts`; `e2e/voxcity-real-data.spec.ts` |
| 18 | YOLO-Nano Urban Object Detection | implemented | Object detection now supports a real model-backed execution path through the GeoAI runtime and model registry across imported rasters, EO connector outputs, and explicitly labeled demo imagery, while preserving an explicit Demo mode fallback and saved execution metadata. | `docs/implementation/prompt-18-completion.md`; `src/centerpanel/components/ObjectDetectorPanel.tsx`; `src/engine/geoai/hooks/useObjectDetection.ts`; `e2e/geoai-real-data.spec.ts` |
| 19 | Analytical Narrative Generation | implemented | Narrative generation is implemented across workflow, review, and reporting surfaces. | `docs/implementation/prompt-19-completion.md` |
| 20 | Cellular Automata Urban Growth Model | implemented | Urban growth simulation flow is implemented. | `docs/implementation/prompt-20-completion.md` |
| 21 | Facility Siting and Location-Allocation | implemented | Facility siting workflow is implemented. | `docs/implementation/prompt-21-completion.md` |
| 22 | Full Composite Indicator Builder | implemented | Composite indicator workflow is implemented with publication/export behavior. | `docs/implementation/prompt-22-completion.md` |
| 23 | Scenario Comparison and Trade-Off Dashboard | implemented | Scenario comparison workflow and dashboard publication are implemented. | `docs/implementation/prompt-23-completion.md` |
| 24 | System Dynamics Module | implemented | System dynamics workflow is implemented. | `docs/implementation/prompt-24-completion.md` |
| 25 | Emerging Hot Spot Analysis | implemented | Emerging hot spot analysis is now a first-class workflow-library surface with an embedded premium panel, preserved toolbar shortcut, saved-run provenance under its own workflow id, and dedicated Playwright validation. | `docs/implementation/prompt-25-completion.md`; `docs/implementation/remediation-prompt-09-completion.md`; `src/centerpanel/Flows/EmergingHotSpotFlow.tsx`; `src/centerpanel/components/MapEmergingHotSpotViz.tsx`; `src/centerpanel/components/__tests__/MapEmergingHotSpotViz.test.tsx`; `e2e/emerging-hot-spot.spec.ts` |
| 26 | Dashboard Builder | implemented with residual gap | Dashboard authoring exists, and widget-body rendering now sits behind a dedicated module with focused coverage, but the authoring shell still carries material density and file-size debt. | `docs/implementation/prompt-26-completion.md`; `src/features/dashboard/__tests__/dashboardWidgetContent.test.tsx` |
| 27 | Academic Report Engine and Citation Layer | implemented | Reporting, citations, project-backed review snapshots, recent-change history, and report-save provenance are now fully wired through the Report workspace and validated with targeted browser coverage. | `docs/implementation/prompt-27-completion.md`; `docs/implementation/remediation-prompt-10-completion.md`; `e2e/report-history.spec.ts`; `src/features/collaboration/__tests__/projectHistory.test.ts`; `src/centerpanel/tabs/__tests__/Note.test.tsx` |
| 28 | Advanced Chart Library Expansion | implemented | Advanced chart components and integrations are present. | `docs/implementation/prompt-28-completion.md` |
| 29 | Learning Path Engine and Methodology Explainers | implemented | Learning-path and methodology explainer systems are present and routed through education surfaces. | `docs/implementation/prompt-29-completion.md` |

## Prompt 30-43

| Prompt | Title | Current-state status | Current truth | Current-state evidence |
|---|---|---|---|---|
| 30 | Pre-Loaded Teaching Dataset Library | implemented | Pre-loaded teaching datasets and dataset browser are implemented. | `docs/implementation/prompt-30-completion.md` |
| 31 | Interactive Exercise Framework and Auto-Grading | implemented | Exercise workspace and auto-grading are implemented. | `docs/implementation/prompt-31-completion.md` |
| 32 | Real-Time Collaboration with CRDTs | implemented | Collaboration provider, engine, and UI are present. | `docs/implementation/prompt-32-completion.md` |
| 33 | WASM Spatial Indexing | implemented with demo mode | WASM spatial index and worker bridge are implemented. The diagnostics lab intentionally uses deterministic synthetic records. | `docs/implementation/prompt-33-completion.md`; `docs/implementation/wasm-spatial-indexing.md` |
| 34 | Arrow and GeoParquet I/O Pipeline | implemented | Columnar IO pipeline is implemented and E2E-tested. | `docs/implementation/prompt-34-completion.md` |
| 35 | Web Worker Pool and Job Orchestration | implemented | Worker-pool orchestration and background analytics queue are present. | `docs/implementation/prompt-35-completion.md` |
| 36 | Implementation of the 53 Additional Indicators | implemented | Expanded indicator catalog, cards, and routing are implemented. | `docs/implementation/prompt-36-completion.md` |
| 37 | Comprehensive Vitest Unit Test Matrix | implemented | Broad Vitest coverage exists across analytical and infrastructure surfaces. | `docs/implementation/prompt-37-completion.md` |
| 38 | End-to-End Flow Coverage with Playwright | implemented with residual gap | Playwright coverage is real, but some advanced surfaces remain launch-verified rather than fully execution-verified. | `docs/implementation/prompt-38-completion.md`; `docs/release/visual-completeness-checklist.md` |
| 39 | Accessibility Audit and WCAG Hardening | implemented | Accessibility audit suites and hardening work are present. | `docs/implementation/prompt-39-completion.md` |
| 40 | Shell Focus Visibility and Legacy Visual Layer Accessibility Hardening | implemented | Focus-visible and shell-accessibility hardening are present. | `docs/implementation/prompt-40-completion.md` |
| 41 | Bundle Budgets and Performance Governance | implemented | Bundle budgets, lazy-loading governance, and performance reporting are present. | `docs/implementation/prompt-41-completion.md` |
| 42 | Technical Debt Closure Program | implemented | Prompt 42 stub-era cleanup is now fully closed for the current scope, including production right-panel branches that render substantive methodology, data, code, and reference fallbacks instead of unavailable filler. | `docs/implementation/prompt-42-completion.md`; `docs/implementation/remediation-prompt-11-completion.md`; `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`; `e2e/right-panel-fallbacks.spec.ts` |
| 43 | Final Integration Hardening and Release Candidate | implemented with residual gap | Release validation is real, documentation now separates launch from execution truth, and the previous MapLibre teardown abort residual has been hardened away. Some advanced surfaces still remain launch-verified and a few large UI shells retain maintainability debt. | `docs/implementation/prompt-43-completion.md`; `docs/implementation/remediation-prompt-12-completion.md`; `docs/release/release-candidate-validation.md`; `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx` |

## Maintenance Rule

Any future prompt that changes a row above must update:

1. This ledger.
2. `docs/implementation/module-matrix.md`.
3. The matching prompt completion note.
4. Release docs if the verification claim changed.
