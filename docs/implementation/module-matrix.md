# SynapseCore Urban Analytics — Current-State Module Matrix

Date: April 24, 2026  
Maintained by: Remediation Correction Pass

## Purpose

This file is the operational module ledger for the current repository state. It replaces the earlier stub-era matrix as the document engineers and release reviewers should use for present-tense truth.

Status vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

Operational rules:

- This ledger records current verified implementation state, not the historical ambition of the original strengthening plan.
- When a historical completion note and this file disagree, this file and `docs/implementation/prompt-status-ledger.md` define current truth.
- A surface is only listed as `implemented` when the repository contains material code and validation evidence for it.
- Unlisted plan items from the original strengthening plan should be treated as `deferred` until a current-state note says otherwise.

Historical context:

- The original Prompt 01 matrix was useful as a pre-implementation baseline, but it no longer reflects the shipped repository.
- Prompt-specific completion notes preserve delivery history.
- This file is intentionally grouped by verified module clusters so it can be maintained without restaging the old stub inventory.

## Axis 1 — Spatial Statistics and Analytical Methods

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Spatial weights foundation and shared math/types | `src/engine/spatial-stats/types.ts`; `src/engine/spatial-stats/autocorrelation/SpatialWeights.ts`; `src/engine/spatial-stats/math/` | implemented | Sparse weights construction, row standardization, variance helpers, and supporting math utilities are present and tested. | `docs/implementation/prompt-02-completion.md`; `src/engine/spatial-stats/autocorrelation/__tests__/SpatialWeights.test.ts` |
| Global Moran's I | `src/engine/spatial-stats/autocorrelation/GlobalMoransI.ts` | implemented | Global Moran's I with permutation inference is implemented and covered by tests. | `docs/implementation/prompt-03-completion.md`; `src/engine/spatial-stats/autocorrelation/__tests__/GlobalMoransI.test.ts` |
| Local Moran's I and LISA mapping | `src/engine/spatial-stats/autocorrelation/LocalMoransI.ts`; `src/centerpanel/components/MapClusterViz.tsx` | implemented | Local Moran's I, LISA classification, and map publication/review surfaces are implemented. | `docs/implementation/prompt-04-completion.md`; `src/engine/spatial-stats/autocorrelation/__tests__/LocalMoransI.test.ts` |
| Getis-Ord Gi* | `src/engine/spatial-stats/autocorrelation/GetisOrdGi.ts`; `src/centerpanel/components/MapHotSpotViz.tsx` | implemented | Hot spot/cold spot statistics, panel execution, and publication hooks are present. | `docs/implementation/prompt-05-completion.md`; `src/engine/spatial-stats/autocorrelation/__tests__/GetisOrdGi.test.ts` |
| OLS with diagnostics | `src/engine/spatial-stats/regression/OLS.ts` | implemented | OLS regression, diagnostics, and supporting review artifacts are implemented. | `docs/implementation/prompt-06-completion.md`; `src/engine/spatial-stats/regression/__tests__/OLS.test.ts` |
| Geographically Weighted Regression | `src/engine/spatial-stats/regression/GWR.ts` | implemented | GWR engine and validation coverage are present. | `docs/implementation/prompt-07-completion.md`; `src/engine/spatial-stats/regression/__tests__/GWR.test.ts` |
| PCA and cluster analysis | `src/engine/spatial-stats/multivariate/PCA.ts`; `src/engine/spatial-stats/multivariate/ClusterAnalysis.ts`; `src/services/map/MapEngineAdapter.ts` | implemented | PCA and clustering engines are real code and feed map/review adapters. | `docs/implementation/prompt-11-completion.md`; `src/engine/spatial-stats/multivariate/__tests__/PCA.test.ts`; `src/engine/spatial-stats/multivariate/__tests__/ClusterAnalysis.test.ts` |
| Emerging hot spot analysis | `src/engine/spatial-stats/spatiotemporal/EmergingHotSpots.ts`; `src/centerpanel/components/MapEmergingHotSpotViz.tsx`; `src/centerpanel/Flows/EmergingHotSpotFlow.tsx` | implemented | Core computation, map-toolbar execution, workflow-library discovery, embedded workflow UX, map publication, and completed-run review wiring are all present and validated. | `docs/implementation/prompt-25-completion.md`; `src/engine/spatial-stats/spatiotemporal/__tests__/EmergingHotSpots.test.ts`; `src/centerpanel/components/__tests__/MapEmergingHotSpotViz.test.tsx`; `e2e/emerging-hot-spot.spec.ts` |

## Axis 2 — Data Ecosystem, Connectors, and Ingestion

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Foundational remote-data connectors | `src/services/data/connectors/OverpassConnector.ts`; `CensusConnector.ts`; `GoogleMapsConnector.ts`; `NominatimConnector.ts`; `GTFSLoader.ts` | implemented | Established connector layer for common spatial and place datasets is present. | Existing connector code plus repository validation |
| STAC client | `src/services/data/connectors/STACClient.ts` | implemented with residual gap | Typed STAC search and normalization are implemented, test-backed, and now exposed through a cloud-filtered operator workflow with result selection and downstream publication. Residual gaps remain around imported-raster ingestion and full raster imagery rendering. | `docs/implementation/prompt-08-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `src/services/data/connectors/__tests__/STACClient.test.ts`; `e2e/eo-connectors.spec.ts` |
| Cloud Optimized GeoTIFF reader | `src/services/data/connectors/COGReader.ts` | implemented with residual gap | COG metadata, window reads, and bbox reads are implemented, tested, and surfaced through EO inspection workflows with metadata preview and sample-window reads for uncompressed tiled assets. Publication currently promotes truthful footprint/provenance layers rather than fully rendered raster imagery. | `docs/implementation/prompt-08-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `src/services/data/connectors/__tests__/COGReader.test.ts`; `e2e/eo-connectors.spec.ts` |
| EO source registry and operator panel | `src/services/data/eo/`; `src/centerpanel/Tools/components/EOConnectorPanel.tsx`; `src/centerpanel/Tools/ToolsActionPanel.tsx`; `e2e/eo-connectors.spec.ts` | implemented with residual gap | Shared EO source contracts, provenance, envelope selection, connector activity history, publication hooks, and visible STAC/COG/Sentinel operator workflows are present. Imported local raster UI and direct raster-image rendering remain follow-up work. | `docs/implementation/remediation-prompt-03-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `src/services/data/eo/__tests__/eoRegistry.test.ts`; `src/centerpanel/Tools/components/__tests__/EOConnectorPanel.test.tsx`; `e2e/eo-connectors.spec.ts` |
| Sentinel Hub connector | `src/services/data/connectors/SentinelHubConnector.ts` | environment-dependent | Connector logic and tests exist. The EO operator panel now exposes credential-aware catalog and process requests with explicit dependency messaging, but successful live execution still depends on external credentials and upstream availability. | `docs/implementation/prompt-09-completion.md`; `docs/implementation/remediation-prompt-04-completion.md`; `src/services/data/connectors/__tests__/SentinelHubConnector.test.ts`; `src/centerpanel/Tools/components/EOConnectorPanel.tsx` |
| Arrow and GeoParquet I/O | `src/services/data/pipeline/columnarIO.ts`; `src/centerpanel/components/MapDataImportHubDialog.tsx`; `src/services/map/MapDataIO.ts`; `e2e/map-columnar-io.spec.ts` | implemented | Columnar import/export is implemented, published to map/runtime surfaces, and covered by tests. | `docs/implementation/prompt-34-completion.md` |
| Dataset library and education import path | `src/features/education/DatasetLibraryBrowser.tsx`; `src/centerpanel/components/MapDataImportHubDialog.tsx` | implemented | The application ships a guided dataset library and local import flows. | `docs/implementation/prompt-30-completion.md`; `e2e/education.spec.ts` |

## Axis 3 — Geospatial Artificial Intelligence (GeoAI)

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| ONNX runtime manager and model registry | `src/engine/geoai/runtime/ONNXRuntimeManager.ts`; `src/engine/geoai/runtime/ModelRegistry.ts` | implemented | Browser-manageable runtime and registry infrastructure are present and tested. | `docs/implementation/prompt-12-completion.md`; `src/engine/geoai/runtime/__tests__/runtime.test.ts` |
| Land-cover classification stack | `src/engine/geoai/cv/LandCoverClassifier.ts`; `src/engine/geoai/hooks/useLandCoverClassification.ts`; `src/centerpanel/Tools/components/GeoAILab.tsx`; `src/services/data/eo/analysis.ts` | implemented with residual gap | The classifier pipeline now runs against explicit EO/imported real raster selections plus an explicitly labeled demo source, and map/review outputs persist the exact source provenance. Residual gaps remain because the browser-safe model package is still demo-hosted and real-source runs do not have reference labels for accuracy scoring. | `docs/implementation/prompt-13-completion.md`; `src/engine/geoai/cv/__tests__/LandCoverClassifier.test.ts`; `src/engine/geoai/hooks/__tests__/useLandCoverClassification.test.ts`; `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`; `e2e/geoai-real-data.spec.ts` |
| Natural language to spatial SQL | `src/engine/geoai/nlp/QueryToSQL.ts`; `src/engine/geoai/hooks/useQueryToSQLRunner.ts`; `src/centerpanel/Tools/components/GeoAILab.tsx`; `src/engine/spatial-db/SpatialDB.ts` | implemented with residual gap | Deterministic NL-to-SQL generation and safety checks are implemented. GeoAI Lab executes accepted queries against live project overlays and imported worker-backed spatial tables through SpatialDB while preserving an explicit demo mode. Residual gaps remain because it does not automatically federate every possible project dataset, remote catalog, or non-queryable layer. | `docs/implementation/prompt-14-completion.md`; `docs/implementation/remediation-prompt-06-completion.md`; `src/engine/geoai/nlp/__tests__/QueryToSQL.test.ts`; `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`; `e2e/geoai-real-data.spec.ts` |
| Object detection | `src/engine/geoai/cv/ObjectDetector.ts`; `src/engine/geoai/hooks/useObjectDetection.ts`; `src/engine/geoai/runtime/OnnxWebRuntimeAdapter.ts`; `src/centerpanel/components/ObjectDetectorPanel.tsx`; `src/centerpanel/components/objectDetectionPublish.ts` | implemented | Object detection now supports a real model-backed runtime path through the GeoAI runtime and model registry over shared EO/imported raster sources, while preserving an explicit Demo mode fallback and persisted run metadata for map/review surfaces. | `docs/implementation/prompt-18-completion.md`; `src/engine/geoai/cv/__tests__/ObjectDetector.test.ts`; `src/centerpanel/components/__tests__/ObjectDetectorPanel.test.tsx`; `e2e/geoai-real-data.spec.ts` |
| Narrative generation | `src/centerpanel/Flows/narrativeBuilders.ts`; `src/services/reporting/AutoNarrative.ts` | implemented | Narrative generation is available in completed-run, workflow, and reporting surfaces. | `docs/implementation/prompt-19-completion.md` |
| GeoAI status and model profile surfaces | `src/engine/geoai/hooks/useGeoAIStatus.ts`; `useGeoAIModelProfiles.ts`; `src/centerpanel/Tools/components/GeoAILab.tsx` | implemented | Runtime status and model-profile inspection surfaces are present in Toolbox. | `docs/implementation/prompt-42-completion.md` |

## Axis 4 — 3D Urban Modelling and VoxCity

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Building extrusion workflow | `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`; `src/features/urbanAnalytics/voxcity/BuildingExtruder.ts`; `src/centerpanel/Flows/VoxCity3DFlow.tsx`; `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts` | implemented with demo mode | The viewer prioritizes real Map Explorer polygon layers, imported project layers, and optional CityJSON-derived geometry when available, preserves explicit sample quick-start mode, and persists provenance into map/review outputs. | `docs/implementation/prompt-15-completion.md`; `docs/implementation/remediation-prompt-08-completion.md`; `src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx`; `e2e/voxcity-real-data.spec.ts` |
| CityJSON import and viewer | `src/features/urbanAnalytics/voxcity/CityJSONLoader.ts`; `CityJSONViewer.tsx`; `src/centerpanel/Flows/CityJSONFlow.tsx` | implemented | Real file import for CityJSON is present and visible in the workflow library. | `docs/implementation/prompt-16-completion.md` |
| Sunlight and solar exposure simulation | `src/features/urbanAnalytics/voxcity/SunlightSimulator.ts`; `SunlightSimulatorPanel.tsx`; `src/centerpanel/Flows/SunlightSimFlow.tsx`; `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts` | implemented with demo mode | The solar workflow prioritizes real building geometry from Map Explorer layers, explicit Building Viewer handoff, and CityJSON-derived volumes when available while keeping sample mode explicit and saving run provenance. | `docs/implementation/prompt-17-completion.md`; `docs/implementation/remediation-prompt-08-completion.md`; `src/features/urbanAnalytics/voxcity/__tests__/SunlightSimulatorPanel.test.tsx`; `e2e/voxcity-real-data.spec.ts` |

## Axis 5 — Scenario Planning, Simulation, and Review

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Foundational analytical flows | `src/centerpanel/Flows/SiteSuitabilityFlow.tsx`; `AccessibilityFlow.tsx`; `VulnerabilityFlow.tsx` | implemented | Guided analytical flows for core planning analysis are present and execution-tested. | `docs/implementation/prompt-20-completion.md`; `docs/implementation/prompt-21-completion.md`; `e2e/analytical-journeys.spec.ts` |
| Placeholder-flow remediation set | `src/centerpanel/Flows/CompositeIndicatorFlow.tsx`; `ScenarioComparisonFlow.tsx`; `EquityAuditFlow.tsx`; `ChangeDetectionFlow.tsx`; `AnalyticalRunReviewFlow.tsx` | implemented | The previously placeholder flows are now real workflow surfaces with publication, export, and review behavior. | `docs/implementation/prompt-10-completion.md`; `docs/implementation/prompt-22-completion.md`; `docs/implementation/prompt-23-completion.md`; `e2e/analytical-journeys.spec.ts` |
| Cellular automata urban growth | `src/centerpanel/Flows/CellularAutomataFlow.tsx`; `src/engine/simulation/ca/` | implemented | The CA growth workflow is real and publish-capable. | `docs/implementation/prompt-20-completion.md` |
| Facility siting and location-allocation | `src/centerpanel/Flows/FacilityOptimisationFlow.tsx`; `src/engine/simulation/siting/` | implemented | The location-allocation workflow is present with completed-run publication. | `docs/implementation/prompt-21-completion.md` |
| System dynamics module | `src/centerpanel/Flows/SystemDynamicsFlow.tsx`; `src/engine/simulation/systemdynamics/` | implemented | System dynamics workflow and review artifacts are present. | `docs/implementation/prompt-24-completion.md` |

## Axis 6 — Reporting, Education, Collaboration, and Scientific Support

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Dashboard builder | `src/features/dashboard/DashboardBuilder.tsx`; `src/features/dashboard/DashboardWidgetContent.tsx`; `ScenarioComparisonDashboard.tsx`; `advancedCharts.tsx`; `storage.ts` | implemented with residual gap | Dashboard authoring, exports, and charting are implemented, and widget-body rendering now sits behind a dedicated content module with focused coverage. The builder shell still carries residual density and file-size debt. | `docs/implementation/prompt-26-completion.md`; `docs/implementation/prompt-28-completion.md`; `src/features/dashboard/__tests__/dashboardWidgetContent.test.tsx` |
| Reporting engine and citations | `src/services/reporting/ReportEngine.ts`; `ReportBuilderPanel.tsx`; `CitationManager.ts`; `src/centerpanel/tabs/Note.tsx`; `src/centerpanel/tabs/NoteEditor.tsx`; `src/centerpanel/tabs/RecentChanges.tsx`; `src/features/collaboration/projectHistory.ts` | implemented | Reporting, inline citations, project-backed report snapshots, extracted editor/history surfaces, compare-ready review UI, and durable report-save provenance are all wired and validated. | `docs/implementation/prompt-27-completion.md`; `src/features/collaboration/__tests__/projectHistory.test.ts`; `src/centerpanel/tabs/__tests__/Note.test.tsx`; `e2e/report-history.spec.ts` |
| Learning paths and methodology explainers | `src/features/education/LearningPathEngine.ts`; `learningPaths.ts`; `MethodologyExplainer.tsx`; `EducationModule.tsx` | implemented | Learning paths and methodology explainers are present, routed, and tested. | `docs/implementation/prompt-29-completion.md`; `e2e/education.spec.ts` |
| Preloaded teaching datasets and exercises | `src/features/education/DatasetLibraryBrowser.tsx`; `src/features/education/exercises/` | implemented | Preloaded teaching datasets, exercise workspace, and auto-grading infrastructure are implemented. | `docs/implementation/prompt-30-completion.md`; `docs/implementation/prompt-31-completion.md` |
| Real-time collaboration with CRDTs | `src/features/collaboration/CollaborationProvider.tsx`; `engine.ts`; `CollaborationUI.tsx` | implemented | Collaboration state, presence, and persistence are present. | `docs/implementation/prompt-32-completion.md`; `src/features/collaboration/collaborationEngine.test.ts` |
| Right-panel seed and methodology support system | `src/features/urbanAnalytics/RightPanelFourBlock.tsx`; `src/features/urbanAnalytics/rightPanelUtils.ts`; `src/features/urbanAnalytics/seeds/index.ts` | implemented | The right panel resolves direct card content first and falls back to section-related seed guidance for methodology, data, code, and references without unavailable filler or legacy placeholder copy. | `docs/implementation/prompt-42-completion.md`; `docs/implementation/remediation-prompt-11-completion.md`; `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`; `e2e/right-panel-fallbacks.spec.ts` |

## Axis 7 — Performance, Computation, and Runtime Infrastructure

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| DuckDB-WASM spatial database | `src/engine/spatial-db/SpatialDB.ts`; `SQLEditor.tsx`; `hooks/useSpatialDB.ts` | implemented | In-browser spatial SQL runtime, editor, and execution hooks are present. | Repository code plus `docs/implementation/prompt-14-completion.md` |
| WASM spatial index and worker bridge | `src/engine/wasm/SpatialIndexWASM.ts`; `src/engine/wasm/workers/SpatialIndexWorkerClient.ts`; `src/centerpanel/Tools/components/SpatialIndexLab.tsx` | implemented with demo mode | The index/runtime are real and worker-backed. The lab uses deterministic synthetic records for reproducible diagnostics. | `docs/implementation/prompt-33-completion.md`; `docs/implementation/wasm-spatial-indexing.md`; `src/engine/wasm/__tests__/SpatialIndexWASM.test.ts` |
| Web worker pool and job orchestration | `src/workers/pool/BackgroundWorkerPool.ts`; `tasks.ts`; `workerHandlers.ts` | implemented | Worker-pool orchestration, queue state, and test coverage are present. | `docs/implementation/prompt-35-completion.md`; `src/workers/pool/__tests__/BackgroundWorkerPool.test.ts` |
| Streaming runtime | `src/engine/streaming/ReplayStreamConnector.ts`; `WebSocketStreamConnector.ts`; `MQTTStreamConnector.ts`; `useStreamingConnection.ts`; `src/centerpanel/Tools/components/StreamingLab.tsx` | environment-dependent | Replay mode is locally verifiable. Live WebSocket and MQTT success paths depend on external endpoints. | `docs/implementation/prompt-42-completion.md`; `docs/release/known-risks-and-limitations.md` |
| Bundle budgets and lazy-loading governance | `scripts/check-bundle-budgets.mjs`; `e2e/lazy-loading.spec.ts`; `docs/implementation/performance-report.md` | implemented | Budget enforcement and lazy-loading regression coverage are present. | `docs/implementation/prompt-41-completion.md`; `docs/implementation/performance-report.md` |

## Axis 8 — Quality, Accessibility, and Release Governance

| Module cluster | Primary repository surfaces | Status | Current truth | Evidence |
|---|---|---|---|---|
| Vitest unit/integration matrix | `vitest.config.ts`; repository test suites under `src/**/__tests__` | implemented | Broad unit and integration coverage exists across analytical engines, reporting, education, runtime, and infrastructure surfaces. | `docs/implementation/prompt-37-completion.md`; `npm run test` |
| Playwright end-to-end coverage | `e2e/analytical-journeys.spec.ts`; `education.spec.ts`; `indicator-catalog.spec.ts`; `map-columnar-io.spec.ts`; `report-builder.spec.ts`; `release-candidate-ui.spec.ts`; `geoai-real-data.spec.ts`; `eo-connectors.spec.ts`; `emerging-hot-spot.spec.ts`; `voxcity-real-data.spec.ts` | implemented with residual gap | The E2E stack is real and release-facing, and now includes execution-grade GeoAI, VoxCity real-data, EO connector, and emerging hot spot workflow journeys. Some advanced surfaces such as facility optimisation, urban growth, and system dynamics still remain launch-verified rather than fully execution-verified. | `docs/implementation/prompt-38-completion.md`; `docs/release/visual-completeness-checklist.md` |
| Accessibility hardening | `e2e/accessibility-audit.spec.ts`; `src/centerpanel/styles/a11y.module.css`; `docs/implementation/accessibility-backlog.md` | implemented | Accessibility audits and WCAG hardening are present. | `docs/implementation/prompt-39-completion.md` |
| Shell focus visibility hardening | `src/components/terminal/components/Terminal.tsx`; shell/accessibility styles | implemented | Focus visibility work is real and documented. | `docs/implementation/prompt-40-completion.md`; `docs/implementation/accessibility-backlog.md` |
| Release-candidate validation and documentation | `docs/release/visual-completeness-checklist.md`; `docs/release/release-candidate-validation.md`; `e2e/release-candidate-ui.spec.ts`; `src/centerpanel/components/map/MapCanvas.tsx`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/features/urbanAnalytics/RightPanelFourBlock.tsx` | implemented with residual gap | RC gates run, major surfaces are visible, documentation now separates launch from execution truth, and the previous MapLibre teardown abort residual has been hardened away. Some advanced surfaces still remain launch-verified and a few large UI shells retain maintainability debt. | `docs/implementation/prompt-43-completion.md`; `docs/release/release-candidate-validation.md`; `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx` |

## Explicit Deferred or Not-Yet-Verified Plan Areas

The following plan families remain deferred or not yet promoted to current-state implemented status:

- Advanced spatial econometrics and geostatistics beyond the shipped stack: SAR, SEM, MGWR, variogram/kriging families, spatial Markov, and related extensions.
- Digital-twin registry, sensor binding, real-time twin management, and broader digital-twin orchestration layers.
- GeoAI model families beyond the currently shipped land-cover, NL-to-SQL, object-detection, and narrative surfaces.
- EO raster productization beyond the new operator foundation: imported local raster UI, direct imagery rendering, and deeper source-registration coverage beyond the current GeoAI land-cover consumer path still remain remediation follow-up work.
- Premium UI modularization is materially advanced, but large shells such as the dashboard authoring canvas and full Map Explorer surface still retain residual maintainability debt.

## Maintenance Note

When a future prompt changes the state of one of the module clusters above:

1. Update this file.
2. Update `docs/implementation/prompt-status-ledger.md`.
3. Update the affected prompt completion note.
4. Update release docs if the user-facing verification claim changed.
