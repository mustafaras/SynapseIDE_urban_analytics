# p08 Track A — AOI to Compatible Scientific Flows to Evidence

## Scope Completed
- Wired AOI flow dispatch from map context and flow dialog into compatible analytical flow execution.
- Added AOI analysis result builder and IDs-only bus payload builder.
- Registered immutable evidence artifacts from AOI-dispatched analysis runs.
- Published both bridge events with reference-only payloads:
  - analytics.artifact.publish
  - evidence.artifact.register

## Implemented Files
- src/centerpanel/components/map/controllers/mapExplorerSpatialHelpers.ts
  - Added AOI analysis constants/helpers.
  - Added buildAoiAnalysisResult(...).
  - Added buildAoiAnalysisBusPayloads(...).
- src/centerpanel/components/map/useMapAoiDispatch.ts
  - Added onFlowSelectionDispatched callback hook.
- src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx
  - Added AOI flow selection dispatch handler.
  - Dispatches compatible flow, creates derived analysis layer, registers evidence, emits IDs-only bus events.
  - Fixed earlier TDZ/ordering regression around fit behavior.
- src/centerpanel/components/map/__tests__/map-drawing-aoi-data.test.ts
  - Added AOI analysis and IDs-only bus payload assertions.

## Targeted Validation
- map-drawing-aoi-data.test.ts: pass (targeted run from p08 implementation session).
- mapEvidenceArtifacts.test.ts: pass (targeted run from p08 implementation session).
- typecheck: pass.
- lint:errors: pass.

## Additional Stability Guards Added During Track B Capture Attempts
- src/services/map/MapAnalysisRecommender.ts
  - Guarded analysisResult.visualization access in temporal frame resolver.
- src/services/map/MapCartographyAdvisor.ts
  - Guarded analysisResult.visualization.legendEntries access in legend checks.
- src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx
  - Guarded temporal layer filtering for missing visualization metadata.
- src/centerpanel/components/MapClusterViz.tsx
  - Guarded LISA candidate detection for missing visualization metadata.

## Notes
- Broad map/services vitest suite invocations in this environment remain noisy/unstable due runner/config behavior; targeted p08 validations are reliable and passing.
- Track B completed: both required screenshots captured by deterministic Playwright spec (`e2e/p08-aoi-analysis-capture.spec.ts`, 1 passed). See `p08-trackB.md`.
