# Visual Completeness Checklist

Date: April 24, 2026  
Status: Current release-surface visibility ledger

## Interpretation note

This checklist records visible release surfaces, not blanket proof that every surface is fully production-wired.

Implementation-status vocabulary:

- `implemented`
- `implemented with demo mode`
- `implemented with residual gap`
- `environment-dependent`
- `deferred`

Verification-depth vocabulary:

- `launch verified`
- `execution verified`
- `demo-mode verified`
- `external dependency gated`

`launch verified` means the surface opens and presents expected UI.  
`execution verified` means a representative user journey completed in automation.  
`demo-mode verified` means the validated execution used an explicit demo/synthetic path.  
`external dependency gated` means the success path depends on credentials, live endpoints, or provider availability.

## Shell and Navigation

| Surface | Implementation status | Verification depth | Verification source | Notes |
|---|---|---|---|---|
| Center-panel top tabs (Projects, New Project, Methods, Education, Report, Workflows, Dashboard, Toolbox) | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Smoke suite confirms the shell remains reachable and populated. |
| In-app capabilities overview | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Acts as a release index for major surfaces. |
| Map Explorer | implemented | execution verified | `e2e/release-candidate-ui.spec.ts`; `e2e/map-columnar-io.spec.ts`; `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`; `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`; `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Reachability, workspace shell integrity, teardown hardening, and a real import/export journey are all covered. |
| Status bar runtime chips (GeoAI, Spatial Index, Stream) | implemented | launch verified | Release smoke plus toolbox labs | Runtime state is visible; individual subsystems can still carry their own residual gaps. |

## Execution-Verified Workflows

| Workflow surface | Implementation status | Verification depth | Verification source | Notes |
|---|---|---|---|---|
| Site suitability | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Full compute/export/publish journey is exercised. |
| Accessibility | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/accessibility-audit.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Execution, accessibility, and launch coverage all exist. |
| Vulnerability | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Execution and launch are both verified. |
| Composite indicator builder | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/accessibility-audit.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Execution-grade coverage exists. |
| Scenario comparison | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/accessibility-audit.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Execution, review publication, and launch are verified. |
| Equity audit | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Full journey is exercised. |
| Change detection | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/accessibility-audit.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Execution-grade coverage exists. |
| Completed run review | implemented | execution verified | `e2e/analytical-journeys.spec.ts`; `e2e/accessibility-audit.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Review/export path is exercised. |
| Indicator Catalog | implemented | execution verified | `e2e/indicator-catalog.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Compute-and-route flow is exercised, not just opened. |
| Education workspace | implemented | execution verified | `e2e/education.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Learning-path, dataset, and exercise routing are exercised. |
| Report builder and inline citations | implemented | execution verified | `e2e/report-builder.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Authoring and citation insertion are exercised. |

## Launch-Verified or Residual-Gap Surfaces

| Surface | Implementation status | Verification depth | Verification source | Notes |
|---|---|---|---|---|
| GeoAI Lab | implemented with residual gap | execution verified; demo-mode verified | `e2e/geoai-real-data.spec.ts`; `e2e/release-candidate-ui.spec.ts` | Land cover executes against explicit real raster sources and explicit demo mode. NL-to-SQL executes against live project overlays and imported worker-backed spatial tables in SpatialDB, with explicit demo mode and saved execution provenance; broader federation across every dataset surface remains residual. |
| Object detection | implemented | execution verified | `e2e/geoai-real-data.spec.ts`; `e2e/release-candidate-ui.spec.ts` | The workflow now executes a mocked-real browser runtime path from the workflow surface, preserves explicit Demo mode, and publishes to map/review outputs with saved run metadata. |
| CityJSON loader | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Workflow entry is visible; current release suite does not yet execute a file-import journey here. |
| VoxCity 3D | implemented with demo mode | execution verified | `e2e/voxcity-real-data.spec.ts`; `e2e/release-candidate-ui.spec.ts` | The workflow now auto-prioritizes real project geometry from Map Explorer polygon layers when available, exposes active-source metadata, persists extrusion provenance, and keeps sample mode as an explicit quick-start only. |
| Sunlight simulation | implemented with demo mode | execution verified | `e2e/voxcity-real-data.spec.ts`; `e2e/release-candidate-ui.spec.ts` | The workflow now consumes real building geometry from Map Explorer or Building Viewer handoff, persists solar-run provenance, and keeps sample mode explicit rather than implicit. |
| Facility optimisation | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Current evidence is launch-only verification; no dedicated execution-grade Playwright spec exists yet. |
| Urban growth cellular automata | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Current evidence is launch-only verification; no dedicated execution-grade Playwright spec exists yet. |
| System dynamics | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Current evidence is launch-only verification; no dedicated execution-grade Playwright spec exists yet. |
| Urban morphology | implemented | launch verified | `e2e/release-candidate-ui.spec.ts` | Visible from the workflow library. |
| Dashboard builder | implemented with residual gap | launch verified | `e2e/release-candidate-ui.spec.ts`; `e2e/indicator-catalog.spec.ts`; `src/features/dashboard/__tests__/dashboardWidgetContent.test.tsx` | Builder is visible and routable, and widget-body rendering is now modularized, but the authoring shell still carries residual density debt. |
| Report history and recent changes | implemented | execution verified | `e2e/report-history.spec.ts`; `e2e/report-builder.spec.ts`; `e2e/release-candidate-ui.spec.ts`; `src/centerpanel/tabs/__tests__/Note.test.tsx` | Report authoring, project-backed snapshots, recent-change review rows, extracted editor/history modules, and report-save provenance are now exercised through the live Report workspace. |
| Right-panel scientific support cards | implemented | execution verified | `e2e/right-panel-fallbacks.spec.ts`; `e2e/release-candidate-ui.spec.ts`; `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx` | The support surface now renders direct or seed-derived methodology/data/code/reference content without legacy placeholder copy, and the panel styling has been moved out of the embedded runtime string surface. |
| EO connector stack | implemented with residual gap | execution verified | `e2e/eo-connectors.spec.ts`; connector tests | STAC result listing, COG metadata inspection, EO source selection, and map publication are exercised from the visible Toolbox operator panel. Imported local raster UI and direct raster-image rendering remain residual gaps. |
| Emerging hot spot analysis | implemented | execution verified | `e2e/emerging-hot-spot.spec.ts`; `e2e/release-candidate-ui.spec.ts` | The workflow library now exposes a first-class entry point, the embedded workflow panel runs the analysis without toolbar discovery, and the result is inspected through in-panel legend counts plus saved-run review wiring. |

## Demo-Mode, Hybrid, or Dependency-Gated Surfaces

| Surface | Implementation status | Verification depth | Verification source | Notes |
|---|---|---|---|---|
| Land-cover classification | implemented with residual gap | execution verified; demo-mode verified | `e2e/geoai-real-data.spec.ts`; GeoAI runtime tests | GeoAI Lab now supports real raster-backed execution plus explicit demo mode. The browser-safe model package remains demo-hosted, and real-source runs do not have reference labels for accuracy scoring. |
| Natural language to spatial SQL | implemented with residual gap | execution verified; demo-mode verified | `e2e/geoai-real-data.spec.ts`; GeoAI Lab runtime and local validation | Deterministic SQL generation is real, and GeoAI Lab executes accepted queries against live project overlays and imported worker-backed spatial tables via SpatialDB while preserving explicit demo mode. It does not automatically federate every possible project dataset, remote catalog, or non-queryable layer. |
| WASM spatial index lab dataset | implemented with demo mode | demo-mode verified | `src/centerpanel/Tools/components/SpatialIndexLab.tsx`; runtime tests | The index engine is real, but the lab uses deterministic synthetic records for reproducibility. |
| Streaming Runtime | environment-dependent | demo-mode verified; external dependency gated | `e2e/release-candidate-ui.spec.ts` plus replay mode | Replay mode is the guaranteed local path. Live MQTT/WebSocket success depends on external brokers/endpoints. |
| Live AI-provider responses | environment-dependent | external dependency gated | Provider configuration and manual ops validation | Valid credentials and upstream health are required. |
| Provider-gated map integrations | environment-dependent | external dependency gated | Local shell validation | Some basemap/provider paths require external API keys. |
| Sentinel Hub live catalog/process execution | environment-dependent | external dependency gated | `src/centerpanel/Tools/components/EOConnectorPanel.tsx`; `src/services/data/connectors/__tests__/SentinelHubConnector.test.ts` | Operator UI is visible and credential-aware, but successful remote execution still depends on Copernicus Data Space credentials and upstream service availability. |
