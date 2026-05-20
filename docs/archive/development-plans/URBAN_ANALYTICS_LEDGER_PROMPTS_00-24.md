# Urban Analytics — Archived Execution Logs (Prompts 00-24)

Detailed execution logs for completed Urban Analytics prompts 00 through 24.
Extracted from URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md on 2026-05-10 to keep the active ledger small.
The Prompt Status Register and per-prompt outcomes remain in the active ledger; this file contains the long-form per-prompt details.

---

### Prompt 24 - Scenario Comparison and Policy Interpretation

- Date: 2026-05-09 19:36 +03:00
- Agent: GPT-5.3-Codex (Copilot)
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 3, 7.2, 19.4, 23.5, Epic 12, 30)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 24 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `.github/instructions/urban-analytics.instructions.md`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/centerpanel/Flows/scenarioComparisonArtifacts.ts`
  - `src/features/urbanAnalytics/context/scenarioComparisonMetadata.ts`
  - `src/features/urbanAnalytics/context/reportArtifactBuilder.ts`
  - `src/features/urbanAnalytics/context/dashboardArtifactBuilder.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/centerpanel/Flows/__tests__/scenarioComparisonArtifacts.test.ts`
  - `src/features/urbanAnalytics/context/__tests__/scenarioComparisonMetadata.test.ts`
  - `src/features/urbanAnalytics/__tests__/dashboardArtifactBuilder.test.ts`
  - `src/features/urbanAnalytics/__tests__/reportArtifactBuilder.test.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added typed `UrbanScenarioComparison` policy-interpretation model in `lib/types.ts`, including baseline/candidate references, indicator deltas, uncertainty, limitations, evidence references, and guidance-only policy framing.
  - Added typed `scenarioComparison` metadata support to `MapOutput`/`ChartOutput`/`DataOutput` for eligible scenario-comparison outputs.
  - Updated `buildScenarioComparisonCompletedRun` to emit stable comparison identity (`<runId>-comparison`) and attach scenario metadata to map/chart/data outputs without embedding heavy payloads.
  - Added `context/scenarioComparisonMetadata.ts` helper utilities to extract scenario metadata from run outputs and generate compact report/dashboard handoff metadata.
  - Extended `UrbanEvidenceTray` inspector to surface explicit policy interpretation guidance, uncertainty notes, limitations, and guidance-only framing for scenario-comparison artifacts.
  - Extended report and dashboard artifact builders so handoff descriptors include scenario-comparison metadata and carry guidance-only interpretation context into downstream bindings and evidence metadata.
- Scientific integrity notes:
  - Policy interpretation is explicitly guidance-only; no certainty framing is emitted.
  - Scenario metadata is reference/scalar-only and does not duplicate large geometry or raw output payloads.
  - Uncertainty and limitation notes are propagated into report/dashboard handoff pathways.
- Validation commands:
  - `npm exec vitest run src/centerpanel/Flows/__tests__/scenarioComparisonArtifacts.test.ts src/features/urbanAnalytics/context/__tests__/scenarioComparisonMetadata.test.ts src/features/urbanAnalytics/__tests__/dashboardArtifactBuilder.test.ts src/features/urbanAnalytics/__tests__/reportArtifactBuilder.test.ts src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `npm run typecheck`
  - `npm run test:analytics`
- Validation results:
  - Focused Prompt 24 suites: passed (5 files, 19 tests).
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed (58 files, 1071 tests).
- Known risks:
  - Full repository `npm run test` was not re-run in this prompt pass.
- Blockers:
  - None.
- Next recommended prompt: Prompt 25 - Reproducible Package Export.
- Ledger updated: yes.

### Prompt 23 - VoxCity 2D/3D Scenario Coherence

- Date: 2026-05-09 18:46 +03:00
- Agent: GPT-5.3-Codex (Copilot)
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (Prompt 23-related sections)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 23 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/voxCityEvidenceBuilder.ts`
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`
  - `src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx`
  - `src/centerpanel/Flows/VoxCity3DFlow.tsx`
  - `src/centerpanel/Flows/SunlightSimFlow.tsx`
  - `src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx`
  - `src/features/urbanAnalytics/voxcity/__tests__/SunlightSimulatorPanel.test.tsx`
  - `src/features/urbanAnalytics/context/__tests__/voxCityEvidenceBuilder.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added typed Prompt 23 domain contract for VoxCity 3D scenario evidence metadata and output references.
  - Added `context/voxCityEvidenceBuilder.ts` to register paired scenario (`workflow-run`) and map reference (`map-layer`) artifacts with explicit bidirectional artifact linkage.
  - Wired evidence registration into both `BuildingViewer` and `SunlightSimulatorPanel` so completed VoxCity runs emit linked, scalarized evidence metadata without heavy payload duplication.
  - Enlarged VoxCity 2D/3D visual working area via increased minimum panel/container dimensions in viewers, comparison view, and flow host wrappers.
  - Extended VoxCity tests to assert linked artifact creation and added focused builder tests for sample-mode QA warning state + linkage guarantees.
- Scientific integrity notes:
  - Evidence artifacts remain lightweight references with scalar metadata only; no geometry/data payloads are copied into Urban context.
  - Sample-mode QA remains explicit (`warning`) via evidence builder policy and is validated in focused unit tests.
  - 2D map references are tied to 3D scenario artifacts by stable artifact IDs for traceable provenance.
- Validation commands:
  - `npm run typecheck`
  - `npx vitest run src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx src/features/urbanAnalytics/voxcity/__tests__/SunlightSimulatorPanel.test.tsx src/features/urbanAnalytics/context/__tests__/voxCityEvidenceBuilder.test.ts`
- Validation results:
  - `npm run typecheck`: passed.
  - Prompt 23 targeted tests: passed (3 files, 5 tests).
- Known risks:
  - Full-repository test suites were not re-run in this prompt pass.
- Blockers:
  - None.
- Next recommended prompt: Prompt 24 - Scenario Comparison and Policy Interpretation.
- Ledger updated: yes.

### Prompt 22 - Education Mode and Method Learning Path

- Date: 2026-05-09 18:27 +03:00
- Agent: GPT-5.4 (Copilot)
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` (education responsibilities and cross-module boundaries)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 20.8, 21.11, 24 Epic 11)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 22 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/education/types.ts`
  - `src/features/education/navigation.ts`
  - `src/features/education/learningPaths.ts`
  - `src/features/education/methodologyData.ts`
  - `src/features/education/EducationModule.tsx`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/seeds/spatialStats.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
  - `src/features/urbanAnalytics/seeds/spatialStats.ts`
  - `src/features/urbanAnalytics/context/educationArtifactBuilder.ts`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added typed education contract in Urban domain types:
    - `UrbanLearningPathReferenceInput`
    - `UrbanLearningPathReference`
    - `UrbanLearningPathStepReference`
    - `UrbanLearningPathIntermediateValueReference`
    - `Card.learningPath` metadata surface
  - Extended `FlowLibraryItem` with optional `learningPath` metadata and attached explicit representative learning-path definitions to major workflows (`accessibility`, `indicator_composite`, `vulnerability`, `system_dynamics`, `scenario_comparison`).
  - Added representative seed-level learning-path metadata for spatial statistics method cards (`ss-morans-i`, `ss-getis-ord`).
  - Implemented `context/educationArtifactBuilder.ts` as the Urban-to-Education adapter:
    - resolves learning-path metadata from card-first, flow-fallback strategy
    - derives conservative teaching steps from assumptions/limitations/interpretation warnings when needed
    - opens Education through existing stable `openEducationWorkspace` navigation contract
    - registers immutable `education-link` evidence artifacts with provenance, QA, and scalar metadata only
  - Extended right-panel dossier and action bar:
    - Added guarded `Open learning path` action in footer (disabled when no education metadata exists)
    - Added `Learning path handoff` section in Methodology tab showing path/explainer/workflow plus concepts/prerequisites/teaching steps/interpretation prompts
    - Preserved professional density and existing dossier layout; no tutorial takeover UI
  - Extended artifact detail formatting to include `educationLinkId` visibility in evidence summaries.
- Scientific integrity notes:
  - Education handoff is explicit and traceable; no hidden tutorial state.
  - Teaching steps are linked to assumptions, limitations, and interpretation boundaries rather than button-click instructions.
  - Education artifacts remain lightweight metadata references; no heavy geometry or raw datasets are copied.
- Validation commands:
  - `npm exec vitest run src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `npm run typecheck`
  - `npm run test:analytics`
  - `npm run dev:vite -- --host=127.0.0.1 --port=5199 --strictPort` plus `curl.exe -I http://127.0.0.1:3000/`
- Validation results:
  - Focused right-panel learning-path tests: passed (6/6).
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed (56 files, 1065 tests).
  - App-boot smoke: passed; Vite served `http://127.0.0.1:3000/` and HTTP HEAD returned 200.
- Known risks:
  - Learning-path fallback currently depends on explicit flow metadata for unmatched cards; additional cards can be enriched incrementally as needed.
  - Full repository `npm run test` was not re-run.
- Blockers:
  - None.
- Next recommended prompt: Prompt 23 - VoxCity 2D/3D Scenario Coherence.
- Ledger updated: yes.

### Hotfix - Study Area Mini-Map / Map Explorer / Center Panel Sync (Round 2)

- Date: 2026-05-09 17:46 +03:00
- Agent: Claude (Copilot)
- Status: completed
- Problem:
  - Even after the studyAreaSelection refactor, the mini map could blank out, fight Map Explorer's viewport, or skip the user's confirmed bounds when reopened. Root causes:
    1. `MapCanvas` click handlers always wrote into `useMapExplorerStore` (clearing selections, setting selected features) even when used as the controlled mini map, leaking mini-map clicks into the main Map Explorer state.
    2. The mini map's `moveend` listener used a fragile `programmaticFitInFlightRef` to disambiguate user pans from programmatic `fitBounds`. A second programmatic fit (e.g. confirmed-area restore) would not re-arm the flag, so its `moveend` echoed back into preview and overwrote the confirmed bounds.
    3. `fitMiniMapToBounds` could fire before the MapLibre style finished loading, producing a stale/world viewport on first open.
- Architecture changes:
  - `MapCanvas` gains a typed `viewportMode: 'shared' | 'controlled'` prop. In `'controlled'` mode (used by the Urban Analytics mini map) the canvas no longer mutates `useMapExplorerStore` selection / analysis-result-layer state on click. The main Map Explorer modal still uses the default `'shared'` mode and is unchanged.
  - `MapCanvas.onViewportChange` now passes a `{ userInitiated: boolean }` meta arg derived from MapLibre's `originalEvent`. Programmatic fits (`fitBounds`, `easeTo`) are reliably distinguishable from user gestures without ref-based heuristics.
  - `StudyAreaPicker` uses the meta arg to gate preview publication: only user-initiated `moveend` events update preview state and call `previewUrbanStudyAreaInWorkspace`. Programmatic fits never echo back into preview.
  - `fitMiniMapToBounds` now waits for `map.isStyleLoaded()` (or queues a one-shot `'load'` listener) before issuing `fitBounds`, eliminating the gray/world-extent first-open race.
- Sync contract reaffirmed:
  - Preview sync: scalar `currentMapBounds` + `applyImmediateViewport` only. No AOI, no evidence, no `requestFitBounds`.
  - Open Map Explorer: preview + `requestFitBounds` (durable, drained on `handleMapReady` and via subscribe) + `mapStore.open()`.
  - Commit: AOI feature, immediate viewport, Urban context (`studyAreaName`/`studyAreaId`/`studyAreaBounds`), `activeAoiId`, evidence artifact with provenance + QA limitations.
- Files touched:
  - `src/centerpanel/components/map/MapCanvas.tsx` (viewportMode prop, controlled-mode click guards, userInitiated meta on onViewportChange).
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx` (meta-driven preview gating, style-load-aware fit, `viewportMode="controlled"`).
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` (added preview no-evidence and Open Map Explorer reuse-preview-bounds cases).
- Validation:
  - `npm run typecheck` — passed.
  - `npm run lint:errors` — passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` — 9/9 passed.
  - `npm run test:analytics` — 56 files, 1059 tests passed.
- Acceptance:
  - Mini-map clicks no longer perturb Map Explorer selection state.
  - Programmatic fits do not echo into preview state.
  - First-open fit waits for style load — no gray/world-extent flash.
  - Confirm/Open/Preview contracts unchanged for callers; existing tests remain green.

### Prompt 21 - Dashboard Bindings and Scenario Outputs

- Date: 2026-05-09 16:11 +03:00
- Agent: GPT-5 Codex
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` (dashboard ownership, artifact state/action rules, and publication/review path)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 20.7, 21.11, 24 Epic 10)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 21 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/dashboard/types.ts`
  - `src/features/dashboard/dataBindings.ts`
  - `src/features/dashboard/storage.ts`
  - `src/features/dashboard/layout.ts`
  - `src/features/dashboard/DashboardBuilder.tsx`
  - `src/features/dashboard/DashboardWidgetContent.tsx`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/context/reportArtifactBuilder.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/stores/useFlowStore.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `src/features/dashboard/__tests__/computedIndicatorBindings.test.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/context/dashboardArtifactBuilder.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/__tests__/dashboardArtifactBuilder.test.ts`
  - `src/features/dashboard/types.ts`
  - `src/features/dashboard/dataBindings.ts`
  - `src/features/dashboard/DashboardWidgetContent.tsx`
  - `src/features/dashboard/dashboardWidgetContent.module.css`
  - `src/features/dashboard/__tests__/computedIndicatorBindings.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added `UrbanDashboardBinding`, `UrbanDashboardWidgetType`, `UrbanDashboardBindingKind`, `UrbanDashboardRefreshMode`, `UrbanDashboardBindingProvenance`, and `UrbanDashboardBindingQA` types.
  - Added `context/dashboardArtifactBuilder.ts` as the Urban-to-dashboard adapter. It builds static dashboard binding descriptors from indicator, workflow-run, map-layer, and explicit scenario-comparison chart output evidence.
  - Added dashboard-side registered binding storage via `registerDashboardBinding()` and `listRegisteredDashboardBindings()` in `dataBindings.ts`. Existing static and computed indicator bindings remain intact; registered Urban bindings are added to normal `getDashboardBinding`, widget-type, and template lookup paths.
  - Extended Dashboard binding types with optional traceability metadata: source artifact/run/indicator references, refresh mode, scale label, uncertainty label, QA state, warnings, and limitations.
  - Dashboard widget content now surfaces compact traceability chips for registered bindings without redesigning the dashboard builder.
  - Evidence tray `Dashboard` action now queues a static Urban dashboard binding for eligible evidence and navigates to Dashboard Builder through the existing `synapse:navigate` contract. Existing pre-registered dashboard bindings still queue through the existing pending-binding API.
  - Enqueueing a binding updates the source evidence artifact with `dashboardBindingId`, registers one linked `dashboard-binding` evidence artifact, and appends the binding ID to `UrbanWorkflowRunManifest.dashboardBindingIds` with de-duplication.
  - Scenario comparison runs with explicit two-column chart values become static `comparison` widgets labeled Baseline vs Scenario. If no explicit baseline/scenario values exist, the builder falls back to chart/table/map/text binding kinds based on available run outputs rather than claiming a comparison.
- Scientific integrity notes:
  - All Urban dashboard bindings are labeled `refreshMode: "static"`; no live/reactive claim is made.
  - Bindings carry reference IDs and scalar summaries only. Raw GeoJSON, map render state, editor buffers, and data-output preview rows are not embedded in dashboard binding payloads.
  - Demo, synthetic, and unknown runtime modes become dashboard QA limitations and are surfaced in tray status messages before completing the action.
  - Dashboard Builder remains the owner of widget layout and document state. Urban Analytics only registers a binding descriptor and queues a pending binding request through the existing dashboard API.
- Cross-module contract changes:
  - Existing dashboard contracts consumed: `registerDashboardBinding`, `getDashboardBinding`, `queuePendingDashboardBinding`, and Dashboard Builder's pending binding flow.
  - Existing navigation contract consumed: `synapse:navigate` with `{ tab: 'Dashboard', dashboardBindingId, dashboardWidgetType, dashboardRequestedAt }`.
  - No new `synapse:*` event was introduced.
- Validation commands:
  - `npm run typecheck`
  - `npx vitest run src/features/urbanAnalytics/__tests__/dashboardArtifactBuilder.test.ts --reporter=verbose`
  - `npx vitest run src/features/dashboard/__tests__/computedIndicatorBindings.test.ts --reporter=verbose`
  - `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx --reporter=verbose`
  - `npm run lint:errors`
  - `npm run test:analytics`
  - `npx vitest run src/features/dashboard/__tests__ --reporter=verbose`
  - `npm run build`
  - `npm run dev:vite -- --host 127.0.0.1 --port 5199 --strictPort` plus `curl.exe http://127.0.0.1:5199/`
- Validation results:
  - `npm run typecheck` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/dashboardArtifactBuilder.test.ts --reporter=verbose` - Passed, 3/3 tests.
  - `npx vitest run src/features/dashboard/__tests__/computedIndicatorBindings.test.ts --reporter=verbose` - Passed, 4/4 tests.
  - `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx --reporter=verbose` - Passed, 5/5 tests.
  - `npm run lint:errors` - Passed.
  - `npm run test:analytics` - Passed, 56/56 files and 1059/1059 tests.
  - `npx vitest run src/features/dashboard/__tests__ --reporter=verbose` - Passed, 5/5 files and 13/13 tests.
  - `npm run build` - Passed.
  - Dev-server smoke - Passed; `http://127.0.0.1:5199/` returned HTTP 200 and the server job was stopped after the probe.
- Known risks:
  - Registered dashboard bindings are static snapshots stored in local dashboard binding storage. Users must regenerate a binding after upstream evidence changes; the UI labels this as static/manual rather than live.
  - Full `npm run test` was not re-run; Prompt 21 validation and the Urban Analytics/dashboard subsets passed.
- Blockers:
  - None.
- Next recommended prompt: Prompt 22 - Education Mode and Method Learning Path.
- Ledger updated: yes.

### Prompt 20 - Reporting Evidence Blocks

- Date: 2026-05-09 15:44 +03:00
- Agent: GPT-5 Codex
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` (section 8.5 Publication Export Path)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 10, 20.6, 21.11, 24 Epic 9)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 20 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/services/reporting/types.ts`
  - `src/services/reporting/storage.ts`
  - `src/services/reporting/ReportEngine.ts`
  - `src/services/reporting/ReportBuilderPanel.tsx`
  - `src/stores/useFlowStore.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/context/reportArtifactBuilder.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/__tests__/reportArtifactBuilder.test.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added `UrbanReportEvidenceBlock` and `UrbanReportMapFigureReference` types. Blocks carry artifact/run IDs, title, method summary, data summary, QA summary, assumptions, limitations, optional map figure reference, citation/reference notes, and scalar provenance.
  - Added `context/reportArtifactBuilder.ts` as the Urban-to-report adapter. It builds structured Urban evidence blocks, converts them to the existing reporting service `PendingReportInsert` shape, enqueues through `enqueuePendingInsert`, and dispatches the existing `reporting/pending-changed` notification for Report Builder.
  - Report blocks are split into an evidence section and a reproducibility/provenance section. The second section carries assumptions, limitations, reference notes, and a structured provenance table.
  - Enqueueing a block records `reportInsertId` on the source evidence artifact, registers one linked `report-insert` evidence artifact, and appends the ID to the sidecar `UrbanWorkflowRunManifest.reportInsertIds` when a run manifest exists.
  - The evidence tray `Report` action now queues structured report inserts instead of emitting unstructured note patches. Map, IDE, dashboard, and map-publication actions remain on their existing contracts.
  - The right-panel `To Report` action now queues a method-card evidence block with validity-envelope assumptions/limitations and citation notes, while preserving the existing panel bridge `recordInsertedCard()` behavior.
- Scientific integrity notes:
  - Report blocks carry references and scalar provenance only; they do not embed GeoJSON, raw data rows, screenshots, editor buffers, or map render state.
  - Demo/synthetic/unknown runtime modes become explicit limitations through the report-block builder.
  - Method-card report inserts do not claim analytical outputs; they preserve declared dataset/tool requirements, active layer references, validity assumptions, and limitations.
  - Existing Report Builder ownership is preserved. Urban Analytics queues a pending insert; it does not redesign the report builder or mutate report documents directly.
- Cross-module contract changes:
  - No new window event contract was introduced for reporting.
  - Existing reporting contracts consumed: `enqueuePendingInsert`, `drainPendingInserts`, `mergePendingInserts`, and `reporting/pending-changed`.
  - Existing navigation contract consumed: `synapse:navigate` with `{ tab: 'Report' }`.
- Validation commands:
  - `npx vitest run src/features/urbanAnalytics/__tests__/reportArtifactBuilder.test.ts --reporter=verbose`
  - `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx --reporter=verbose`
  - `npm run typecheck`
  - `npm run lint:errors`
  - `npx vitest run src/services/reporting/__tests__ --reporter=verbose`
  - `npm run test:analytics`
  - `npm run build`
  - `npm run dev:vite -- --host 127.0.0.1 --port 5201 --strictPort` plus `Invoke-WebRequest http://127.0.0.1:5201/`
- Validation results:
  - `npx vitest run src/features/urbanAnalytics/__tests__/reportArtifactBuilder.test.ts --reporter=verbose` - Passed, 3/3 tests.
  - `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx --reporter=verbose` - Passed, 9/9 tests.
  - `npm run typecheck` - Passed.
  - `npm run lint:errors` - Passed.
  - `npx vitest run src/services/reporting/__tests__ --reporter=verbose` - Passed, 17/17 tests.
  - `npm run test:analytics` - Passed, 55/55 files and 1056/1056 tests.
  - `npm run build` - Passed.
  - Dev-server smoke - Passed; `http://127.0.0.1:5201/` returned HTTP 200 and the server was stopped after the probe.
- Known risks:
  - Report Builder still owns final document merge/review; Urban queues pending inserts and records bindings, so user-visible final placement depends on the existing Report Builder pending-insert drain path.
  - Full `npm run test` was not re-run; Prompt 20 validation and the Urban Analytics/reporting subsets passed.
- Blockers:
  - None.
- Next recommended prompt: Prompt 21 - Dashboard Bindings and Scenario Outputs.
- Ledger updated: yes.

### Prompt 19 - IDE to Urban File and Artifact Recognition

- Date: 2026-05-09 15:24 +03:00
- Agent: GPT-5 Codex
- Status: completed
- Required reading completed:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` (section 8.2 IDE File to Map Layer to Urban Recommendation)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 8, 20.5, 21.10; Prompt 18 contracts from section 26 context)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 19 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`
  - `src/features/urbanAnalytics/context/codeArtifactRequests.ts`
  - `src/services/synapseBus.ts`
  - `src/types/synapse-bus.ts`
  - `src/services/analytics/ideUrbanHandoff.ts`
  - `src/services/analytics/urbanToIdeHandoff.ts`
  - `src/services/map/ideMapHandoff.ts`
  - `src/App.tsx`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/ideArtifactRecognition.ts`
  - `src/features/urbanAnalytics/__tests__/ideArtifactRecognition.test.ts`
  - `src/types/synapse-bus.ts`
  - `src/services/analytics/ideUrbanHandoff.ts`
  - `src/App.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added typed Prompt 19 contracts: `UrbanIdeArtifactLanguage`, `UrbanIdeArtifactKind`, `UrbanIdeArtifactManifestMetadata`, `UrbanIdeArtifactRecognitionPayload`, `UrbanIdeArtifactRecommendation`, and `UrbanIdeArtifactRecognitionResult`.
  - Added `context/ideArtifactRecognition.ts` as the Urban-side receiving adapter. It recognizes supported file references by path/kind/metadata only; it never reads Synapse IDE tab contents or mutates IDE/editor state.
  - Recognized supported files: `.urban.json`, `.geojson`, `.ipynb`, `.py`, `.sql`, and project manifests (`manifest.json`, `*.manifest.json`, YAML manifests).
  - Unsupported or invalid references return truthful `unsupported` / `invalid` results and do not register Urban evidence.
  - Supported references register lightweight Urban evidence with scalar-only metadata, file paths, layer IDs, run IDs, upstream artifact IDs, and provenance notes.
  - Workflow run manifests become `workflow-run` evidence when a run ID is supplied; GeoJSON references become `dataset` evidence; scripts/notebooks/SQL/manifests otherwise become `code-artifact` evidence.
  - Safe context updates are limited to scalar/reference fields: `activeLayerIds`, `activeRunId`, explicit manifest `activeFlowId`, `activeCodeArtifactId`, and study-area name/id when supplied by manifest metadata.
  - Added explainable method/workflow recommendations from explicit manifest `flowId`/`methodId`, conservative filename heuristics, and file-kind-specific review recommendations.
  - Added `installUrbanIdeArtifactReceiver()` and installed it from `App.tsx`; it consumes existing typed `evidence.artifact.register` events from `source: 'ide'` / `sourceModule: 'ide'`.
  - Extended existing typed `EvidenceArtifactRegisterPayload` with optional reference-only fields: `language`, `artifactKind`, `manifestMetadata`, `relatedRunIds`, `relatedArtifactIds`, `contentHash`, and `sizeBytes`.
  - Updated `ideUrbanHandoff` to emit only scalar/reference metadata (`language`, inferred artifact kind, size, related artifact IDs) alongside existing IDE evidence events.
- Scientific integrity notes:
  - No GeoJSON payloads, editor buffers, raw rows, or bulk file content are passed to Urban Analytics.
  - Manifest `demo`, `synthetic`, and `unknown` runtime modes surface as evidence QA warnings.
  - General `.json` files are not treated as Urban manifests unless the filename or supplied metadata identifies them as manifests; this avoids false readiness.
  - GeoJSON references are marked as needing Map Explorer CRS/geometry/feature-count validation before analytical use.
- Cross-module contract changes:
  - No new `synapse:*` window events were introduced.
  - The receiver uses the existing typed Synapse Bus event `evidence.artifact.register`.
  - The IDE remains owner of editor tabs and buffers. Urban Analytics receives references and scalar metadata only.
- Validation commands:
  - `npx vitest run src/features/urbanAnalytics/__tests__/ideArtifactRecognition.test.ts --reporter=verbose`
  - `npm run typecheck`
  - `npm run lint:errors`
  - `npm run test:analytics`
  - `npx vitest run src/services/analytics/__tests__/ideUrbanHandoff.test.ts src/services/analytics/__tests__/urbanToIdeHandoff.test.ts --reporter=verbose`
  - `npm run build`
- Validation results:
  - `npx vitest run src/features/urbanAnalytics/__tests__/ideArtifactRecognition.test.ts --reporter=verbose` - Passed, 5/5 tests.
  - `npm run typecheck` - Passed.
  - `npm run lint:errors` - Passed.
  - `npm run test:analytics` - Passed, 54/54 files and 1052/1052 tests.
  - `npx vitest run src/services/analytics/__tests__/ideUrbanHandoff.test.ts src/services/analytics/__tests__/urbanToIdeHandoff.test.ts --reporter=verbose` - Passed, 47/47 tests. Expected stderr appeared for the existing oversized-scaffold rejection test.
  - `npm run build` - Passed.
- Known risks:
  - Rich manifest metadata is consumed only when supplied by the IDE-side caller; Urban Analytics intentionally does not parse editor buffers to recover missing metadata.
  - Recommendations from filenames are conservative hints, not automatic method activation. The active flow is updated only from explicit manifest `flowId`.
  - Full `npm run test` was not re-run for Prompt 19; historical unrelated full-suite failures recorded in the Prompt 18 refinement entry remain out of scope.
- Blockers:
  - None.
- Next recommended prompt: Prompt 20 - Reporting Evidence Blocks.
- Ledger updated: yes.

### Prompt 18 Refinement - UI Consumer + Python Shebang + Live Bridge Smoke

- Date: 2026-05-09 13:58 +03:00
- Agent: GPT-5 Codex
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 8, 19.6, 20.5, 21.10, 22.2, 26)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 18 block)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md`
  - `src/features/urbanAnalytics/context/codeArtifactRequests.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/python/ScriptTemplates.tsx`
  - `src/features/urbanAnalytics/python/templates/*`
  - `src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/lib/runManifest.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/stores/useFlowStore.ts`
  - `src/stores/editorStore.ts`
  - `src/stores/fileExplorerStore.ts`
  - `src/services/editorBridge.ts`
  - `src/centerpanel/Flows/flowTypes.ts`
  - `package.json`
- Files changed:
  - `src/features/urbanAnalytics/context/codeArtifactRequests.ts`
  - `src/features/urbanAnalytics/context/codeArtifactRequestActions.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts`
  - `src/features/urbanAnalytics/__tests__/codeArtifactRequests.integration.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added `codeArtifactRequestActions.ts` as the typed UI helper layer over the Prompt 18 builders/dispatcher.
  - Added `buildAndDispatchPythonScript`, `buildAndDispatchJsonManifest`, `buildAndDispatchMarkdownMethodNote`, and `buildAndDispatchTypeScriptAdapter`; each returns `{ request, result }` and lets dispatch failures surface to callers.
  - Added `buildSeedFromCompletedRun(run, manifest)` using the active Urban context plus the completed run and sidecar manifest. It references run IDs, flow IDs, output IDs, layer IDs, and scalarized parameters only; no GeoJSON or bulk payloads are copied.
  - The completed-run seed pulls a matching existing script template body from `SCRIPT_TEMPLATES` for known flow families (accessibility, spatial autocorrelation, remote sensing, morphology); otherwise it falls back to the Prompt 18 scaffold.
  - Added `buildSeedFromMethodCard(card)` for method-card-origin right-panel dispatch without requiring a completed run.
  - Updated `UrbanEvidenceTray` workflow-run rows with four explicit actions: `Open Python Script in IDE`, `Open JSON Manifest`, `Open Method Note`, and `Open Adapter Snippet`.
  - Updated `RightPanelFourBlock` code/reproducibility sub-block with `Open code artifact in IDE`, dispatching a method-card-origin Python script for the active method/context.
  - Python script composition now keeps a caller-provided shebang on line 1, moves the Synapse Urban Analytics provenance docstring immediately after it, and prepends `#!/usr/bin/env python3` for caller bodies/scaffolds without a shebang.
- UX changes:
  - Evidence tray workflow-run actions are explicit labeled buttons and disabled when the row has no associated completed run in `useFlowStore`.
  - Tray status messages distinguish success, `bridge-not-routed`, and `size-rejected`; runtime-mode safety notes for `demo`, `synthetic`, and `unknown` manifests appear before completion text.
  - Right-panel code block shows an inline status message after method-card code artifact dispatch.
  - Optional top-bar `Open IDE Artifact` button was not added in this refinement; the accepted tray/right-panel action surfaces are implemented and the command-bar pass remains deferred to the Section 22.2 top-bar work.
- Scientific integrity notes:
  - No method formulas, indicator units, CRS rules, data-fitness scoring, or method-validity envelopes changed.
  - Generated artifacts continue to preserve `NotImplementedError` scaffolds rather than pretending analytical code is complete.
  - Demo/synthetic/unknown runtime modes are surfaced through generated request safety notes and UI status messages.
  - Seed derivation keeps evidence scalar-only: IDs, layer references, output references, and scalarized parameter summaries only.
- Evidence/provenance changes:
  - UI does not register evidence directly. All code-artifact evidence registration still happens exactly once through `dispatchUrbanCodeArtifactRequest`.
  - The integration test verifies `metadata.bridgeTabId` on the registered `code-artifact` evidence matches the live editor tab ID.
- Data fitness or QA changes:
  - No scoring changes. Data-fitness blocker/missing-input/uncertainty strings from run manifests are copied into generated artifact limitations.
- Method validity changes:
  - No validity-envelope changes. Existing assumptions, limitations, failure modes, and peer reference IDs are carried into seeds when a manifest exposes them.
- Cross-module contract changes:
  - No new global events were introduced.
  - Urban Analytics still requests IDE artifacts only through `editorBridge.openNewTab` via `dispatchUrbanCodeArtifactRequest`; Synapse IDE remains owner of tab/file state.
  - `codeArtifactRequestActions.ts` is a UI-facing adapter layer, not a new editor-state owner.
- Persistence changes:
  - None.
- Accessibility changes:
  - New actions are real buttons with labels/titles and disabled reasons inherited through `EvidenceActionButton`.
  - Status messages use the existing tray `role="status"` live region and right-panel inline `role="status"`.
- Validation commands:
  - `npm run typecheck`
  - `npm run lint:errors`
  - `npx vitest run src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts --reporter=verbose`
  - `npx vitest run src/features/urbanAnalytics/__tests__/codeArtifactRequests.integration.test.ts --reporter=verbose`
  - `npm run test:analytics`
  - `npm run build`
  - `npm run dev:vite -- --host 127.0.0.1 --port 55838 --strictPort` plus `Invoke-WebRequest http://127.0.0.1:55838/`
  - Additional check: `npm run test`
  - Additional isolation check: `npx vitest run src/stores/__tests__/editorStore.test.ts --reporter=verbose`
  - Additional isolation check: `npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts --reporter=verbose`
- Validation results:
  - `npm run typecheck` - Passed.
  - `npm run lint:errors` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts --reporter=verbose` - Passed, 19/19 tests.
  - `npx vitest run src/features/urbanAnalytics/__tests__/codeArtifactRequests.integration.test.ts --reporter=verbose` - Passed, 2/2 tests.
  - `npm run test:analytics` - Passed, 53/53 files and 1047/1047 tests.
  - `npm run build` - Passed.
  - Dev-server smoke - Passed, HTTP 200 from `http://127.0.0.1:55838/`; server process was stopped after the check.
  - Additional `npm run test` - Failed outside Prompt 18 scope: `src/stores/__tests__/editorStore.test.ts` expects `isMissingFile === false` for a restored present tab but receives `undefined`; `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` and `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` timed out importing `MapExplorerModal` at the default 15s under full-suite load.
  - Additional editor-store isolation check - Failed with the same pre-existing `isMissingFile` assertion.
  - Additional map-test isolation check - Passed, 68/68 tests; the full-suite map failures appear load/timing related rather than caused by this Prompt 18 refinement.
- Known risks:
  - `playwright-core` is not a direct `devDependency` in `package.json`, so the optional `scripts/smoke-urban-code-artifact-bridge.mjs` browser automation script was deferred as required by the prompt. `@playwright/test` is present, but no new heavy dependency was added.
  - The helper imports existing Python template bodies so matching workflow-run code artifacts can be large but remain guarded by the existing 32 KB dispatch cap.
  - Full `npm run test` is not clean due unrelated editor-store and full-suite MapExplorerModal import-timing failures described above; the required Prompt 18 validation gates all passed.
- Blockers:
  - None.
- Decisions made:
  - Did not add a new `synapse:*` event or any direct editor-store mutation from Urban UI. The UI calls the typed helper, and the helper delegates to the existing service.
  - Kept the top-bar command deferred to avoid widening this refinement beyond the required evidence tray and right-panel consumer paths.
- Next recommended prompt: Prompt 19 - IDE to Urban File and Artifact Recognition.
- Ledger updated: yes.

### Prompt 18 - Synapse IDE Code Artifact Generation

- Date: 2026-05-09
- Agent: Claude Opus 4.7
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 8, 19.6, 20.5, 21.10, 26)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 18 block)
  - `src/services/editorBridge.ts` (`openNewTab`, `insertIntoActive`, `replaceSelection`, `inferLanguageFromFence`)
  - `src/services/editor/bridge.ts` (legacy `editor:openTab` / `editor:insertAtCursor` event bus)
  - `src/services/editor/bridgeAdapter.ts` (typed Synapse Bus forwarding, 32 KB MAX_CODE_BYTES guard)
  - `src/types/synapse-bus.ts` (`IdeCodeInsertPayload`, `IdeFileOpenPayload`, `IdeRangeOpenPayload`)
  - `src/features/urbanAnalytics/python/templates/*` (existing reusable Python bodies)
  - `src/features/urbanAnalytics/python/ScriptTemplates.tsx` (existing `openNewTab` integration pattern)
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts` (`UrbanEvidenceArtifactDraft`, registry helpers)
  - `src/features/urbanAnalytics/useUrbanContextStore.ts` (`registerEvidenceArtifact`)
  - `src/features/urbanAnalytics/lib/types.ts` (`UrbanEvidenceArtifactKind`, `UrbanWorkflowRunManifest`, `UrbanIndicatorKind`, `AnalyticalFlowId`)
  - `src/features/urbanAnalytics/lib/runManifest.ts` (`buildRunManifest`, sidecar `codeArtifactIds`)
  - `src/stores/useFlowStore.ts` (`registerManifest`, `lookupManifest`)
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts` (added `UrbanCodeArtifactLanguage`, `UrbanCodeArtifactKind`, `UrbanCodeArtifactOrigin`, `UrbanCodeArtifactProvenance`, `UrbanCodeArtifactOutputContract`, `UrbanCodeArtifactRequest`, `MAX_URBAN_CODE_ARTIFACT_BYTES`)
  - `src/features/urbanAnalytics/context/codeArtifactRequests.ts` (new file — generators + dispatch + evidence registration + sidecar manifest update)
  - `src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts` (new file, 17 tests)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Implemented Prompt 18 Synapse IDE Code Artifact Generation.

  Added the typed `UrbanCodeArtifactRequest` contract in `lib/types.ts` covering four reproducible artifact kinds:
  - `analysis-script` (Python)
  - `reproducibility-manifest` (JSON)
  - `method-note` (Markdown)
  - `adapter-snippet` (TypeScript)

  Each request carries:
  - artifact ID, optional `contextId` / `runId` / `methodId`
  - `language` and `kind` enums
  - `origin` (`'method-card' | 'workflow-run' | 'manual'`)
  - target filename suggestion (canonical `urban_<method_slug>_<yyyymmdd_hhmm>.<ext>` pattern from Section 26)
  - bounded `content` (≤ `MAX_URBAN_CODE_ARTIFACT_BYTES` / 32 KB)
  - `title`, `summary`
  - `provenance` (source module, generated-at, source summary, contextId, studyAreaId, studyAreaName, methodId, methodName, flowId, indicatorKind, runId, runManifestId, sourceEvidenceIds, layerIds)
  - `outputContract` (suggested output paths, published layer IDs, indicator IDs, summary)
  - `safetyNotes` (Python isolated-env hint, CRS validation, runtime-mode caveats for demo/synthetic/unknown manifests)

  Created `src/features/urbanAnalytics/context/codeArtifactRequests.ts`:
  - `buildPythonScriptRequest(seed)` — emits Section 26.1 header (`Synapse Urban Analytics Artifact / Method / Flow / Card / Study area / Inputs / Created / Manifest / Scientific assumptions / Limitations / References`) plus a parameter block and a 4-step scaffold (`load_inputs`, `validate_inputs`, `run_analysis`, `write_outputs`). Reuses caller-provided `pythonBody` (e.g. existing `SCRIPT_TEMPLATES`) when present so the generator is composable with the existing template registry.
  - `buildJsonManifestRequest(seed)` — emits a structured Section 26.2 manifest with `schemaVersion`, `artifactKind`, `generatedAt`, `contextId`, `studyArea`, `method`, `run` (including `manifestSnapshot`), `inputs`, `parameters`, `qaGate`, `outputContract`, `citations`. Output is canonical 2-space JSON with trailing newline.
  - `buildMarkdownMethodNoteRequest(seed)` — emits Section 26.3 sections: Research question, Method, Data inputs, Parameters (rendered as JSON code block), Assumptions, Results placeholder, Limitations, Reproducibility (with cross-references to the matching manifest + script filenames), References.
  - `buildTypeScriptAdapterRequest(seed)` — emits Section 26.4 adapter snippet with `UrbanAdapterInput`/`UrbanAdapterOutput` interfaces and one function per `UrbanAdapterIntent`: `transform-result-to-map-output`, `transform-result-to-dashboard-binding`, `transform-result-to-report-insert`, `register-evidence-artifact`. Defaults to map-output + register-evidence intents when callers do not specify.
  - `dispatchUrbanCodeArtifactRequest(request, options?)` — main bridge dispatcher:
    1. Validates payload size; throws on > 32 KB.
    2. Routes through `editorBridge.openNewTab` (always new tab — never silent insert into active editor). Bridge failures are non-fatal and surfaced via `bridgeRouted: false`.
    3. Registers a `code-artifact` evidence entry (`useUrbanContextStore.registerEvidenceArtifact`) with sourceModule `'urban-analytics'`, `codeArtifactId` matching the request's artifact ID, `linkedFilePaths` containing the target filename, `qa.state: 'unvalidated'` plus generator + safety-note caveats.
    4. When `request.runId` is present and the run has a sidecar manifest in `useFlowStore`, appends the artifact ID (de-duplicated) to `codeArtifactIds` via `registerManifest`.
    5. Supports `routeThroughBridge: false` for preview-only mode (still registers evidence — useful for AI-panel preview surfaces).
  - `assessUrbanCodeArtifactRequestSize(request)` — public helper for upstream UI gates so callers can disable Apply buttons or show a warning before calling dispatch.

  Scientific contract enforced in code:
  - Every generator wraps body content with a header carrying method / context / run / study-area / assumptions / limitations / references — bare body text cannot reach the IDE.
  - Bridge actions always open a NEW tab (no silent insert; user retains explicit editor control).
  - Content hard-capped at 32 KB matching the editor bridge's existing size guard.
  - Evidence artifacts store scalar metadata + IDs only; no GeoJSON, no raw payloads.
  - Run-manifest runtime modes (`demo` / `synthetic` / `unknown`) emit safety notes copied into the evidence QA limitations.
- Evidence/provenance changes:
  - New `code-artifact` evidence artifacts registered with stable IDs `urban-code-artifact-urban-code-<lang>-<slug>-<yyyymmdd_hhmm>` and `sourceModule: 'urban-analytics'`.
  - Linked file paths include the target filename so the right-panel dossier and evidence tray surfaces can render the link.
  - QA state is `unvalidated` with explicit limitations covering scaffold review, parameter inspection, CRS, and runtime-mode caveats.
- Data fitness or QA changes:
  - None to fitness scoring. Generated artifacts inherit the run manifest's `runtimeMode` truthfully via safety notes (no fabricated readiness).
- Method validity changes:
  - None.
- Contract changes:
  - New shared types: `UrbanCodeArtifactLanguage`, `UrbanCodeArtifactKind`, `UrbanCodeArtifactOrigin`, `UrbanCodeArtifactProvenance`, `UrbanCodeArtifactOutputContract`, `UrbanCodeArtifactRequest`, plus the constant `MAX_URBAN_CODE_ARTIFACT_BYTES`.
  - New service exports: `buildPythonScriptRequest`, `buildJsonManifestRequest`, `buildMarkdownMethodNoteRequest`, `buildTypeScriptAdapterRequest`, `dispatchUrbanCodeArtifactRequest`, `assessUrbanCodeArtifactRequestSize`, `UrbanCodeArtifactSeed`, `UrbanAdapterIntent`, `DispatchUrbanCodeArtifactResult`, `UrbanCodeArtifactSizeAssessment`, `DispatchUrbanCodeArtifactOptions`.
- UX changes:
  - No modal redesign. The new service is consumable by any Urban Analytics surface (right panel, evidence tray, AI panel) that wants to expose "Open Script in IDE", "Open Manifest", "Open Notebook Outline", or "Insert Adapter" actions, exactly as called for in Section 20.5.
- Validation:
  - `npm run typecheck` - Passed.
  - `npm run lint:errors` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/codeArtifactRequests.test.ts --reporter=verbose` - Passed, 17/17 tests covering filename pattern, language metadata, Python header / parameter block / template-body composition / safety notes, JSON manifest schema, Markdown section coverage + reproducibility cross-references, TypeScript adapter intent set, size guard, bridge dispatch (new tab + evidence registration), sidecar manifest deduplicated upsert, preview-only mode.
  - `npm run test:analytics` - Passed, 52/52 files and 1043/1043 tests.
  - `npm run build` - Passed.
  - `npm run dev:vite -- --host 127.0.0.1 --port 5181 --strictPort` then `curl http://127.0.0.1:5181/` - HTTP 200 (5173/5174/5180 occupied).
- Risks:
  - Generator scaffolds intentionally include `NotImplementedError` placeholders for analysis bodies. This is a feature (forces explicit user implementation) but downstream surfaces should label scaffolds clearly and not treat them as runnable evidence.
  - Bridge failures (e.g. SSR, IDE not yet mounted) are non-fatal: evidence is still registered. Callers that need strict bridge delivery must check `result.bridgeRouted`.
  - The sidecar manifest update path requires `useFlowStore.lookupManifest(runId)` to find the run; legacy runs without registered manifests will not have `codeArtifactIds` updated (this matches the established Prompt 17 contract).
- Next recommended prompt: Prompt 19 - IDE to Urban File and Artifact Recognition.

### User-Requested Refinement - Study Area Synchronization Architecture (Mini Map / Map Explorer / Center Panel)

- Date: 2026-05-09
- Agent: Claude Opus 4.7
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/stores/usePanelBridgeStore.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/centerpanel/Flows/FlowHost.tsx`
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Replaced the brittle, multi-source-of-truth study-area sync with a single, typed contract that distinguishes preview, open-explorer, and commit flows.

  Root causes identified in the live contracts:
  1. `MapCanvas` always read its initial viewport from the global Map Explorer store, so the mini map could not have an independent viewport — it inherited whatever Map Explorer last had.
  2. `syncUrbanStudyAreaViewportToMapExplorer` mutated the same global store the mini map's `MapCanvas` reads at init, causing race conditions between sync writes, MapCanvas constructor reads, and `fitBounds` calls.
  3. "Open Map Explorer" dispatched `synapse:map:fitBounds` BEFORE the modal mounted/listener attached. The fragile RAF + `setTimeout` triple-fire was still racing the `useEffect`-based listener registration.
  4. Preview-sync also dispatched `synapse:map:fitBounds`, which re-fired `fitBounds` on an already-open Map Explorer modal, producing `moveend` echoes that drove ping-pong updates with the picker's local `suppressNextViewportSyncRef`.
  5. Heavy use of `useMapExplorerStore.setState({...})` in UI helper code bypassed typed store actions, making the cross-module contract implicit and fragile.

  Architectural changes:
  - Added typed cross-module sync contract in `mapTypes.ts`: `PendingFitBoundsRequest` and `PendingFitBoundsRequestInput`.
  - `useMapExplorerStore` gained three new typed actions:
    - `applyImmediateViewport(v)` — bypasses the debounced setter, cancels the pending timer, applies viewport synchronously. Replaces ad-hoc `setState({ center, zoom, ... })` in UI helpers.
    - `requestFitBounds(input)` — queues a typed pending fit-bounds request; last-write-wins; returns the queued request with a stable `requestId`.
    - `consumePendingFitBounds()` — atomically reads and clears the pending request, returning the consumed value.
    - New state: `pendingFitBounds: PendingFitBoundsRequest | null` (NOT persisted).
  - `MapCanvas` gained an `initialViewport?: Partial<ViewportState>` prop. When provided (mini map), `MapCanvas` constructs against the explicit viewport and does NOT read the global Map Explorer store. Existing callers omit the prop and keep legacy behaviour.
  - `studyAreaSelection.ts` is now the single service contract with three explicit modes:
    - `previewUrbanStudyAreaInWorkspace({ bounds, source })` — scalar updates only (`setCurrentMapBounds`, `applyImmediateViewport`). No AOI, no evidence, no fit-bounds animation request.
    - `openMapExplorerWithStudyAreaPreview({ bounds, source, aoiId? })` — preview + `requestFitBounds` (durable through the store) + legacy event dispatch + `mapStore.open()`. Deterministic regardless of mount ordering.
    - `applyUrbanStudyAreaSelection(input)` — commit: AOI feature upsert, immediate viewport, current bounds, AOI activation, typed fit-bounds request, Urban context (`studyAreaName`, `studyAreaId`, `studyAreaBounds`, `activeAoiId`), evidence artifact (lightweight scalar metadata + provenance + QA limitations). Returns `{ studyAreaId, aoiId, bounds, viewport, evidenceArtifactId, fitRequestId }`.
  - `StudyAreaPicker.tsx` rewritten:
    - Mini map operates in `controlled` mode via `initialViewport` so it never inherits Map Explorer's global viewport.
    - Preview / Open Map Explorer / Confirm flows each route through the corresponding service function — no more ad-hoc `useMapExplorerStore.setState` from UI code.
    - Mini-map `moveend` updates `currentMapBounds` + viewport scalar state but does NOT request a fit, eliminating ping-pong with an open Map Explorer.
    - Programmatic-fit suppression handled via a single `programmaticFitInFlightRef` token absorbing the very next `moveend` after a fit dispatch.
  - `MapExplorerModal.tsx` now consumes pending fit-bounds via the typed store contract:
    - On `open === true`, subscribes to `useMapExplorerStore.pendingFitBounds` and applies + consumes the latest request whenever it changes (and once immediately on open in case the request was queued before mount).
    - On `handleMapReady`, drains pending fit-bounds in case the modal was already open when the canvas finally became ready.
    - Legacy `synapse:map:fitBounds` window listener retained for backwards compatibility with `UrbanEvidenceTray` Publish flow.
- Evidence/provenance changes:
  - Final study-area evidence behavior unchanged (scalar metadata, no bulk geometry, `unvalidated` QA with explicit administrative-boundary and projected-CRS limitations).
  - Preview sync explicitly does not register any evidence artifact.
- Data fitness or QA changes:
  - None.
- Method validity changes:
  - None.
- Contract changes:
  - New shared types in `mapTypes.ts`: `PendingFitBoundsRequest`, `PendingFitBoundsRequestInput`.
  - New `MapExplorerState` API surface: `applyImmediateViewport`, `pendingFitBounds`, `requestFitBounds`, `consumePendingFitBounds`.
  - New `MapCanvasProps.initialViewport?: Partial<ViewportState>` (optional, additive).
  - New `studyAreaSelection.ts` exports: `previewUrbanStudyAreaInWorkspace`, `openMapExplorerWithStudyAreaPreview`, `URBAN_STUDY_AREA_FIT_BOUNDS_EVENT`, plus typed inputs/results (`UrbanStudyAreaPreviewInput`, `UrbanStudyAreaPreviewResult`, `UrbanStudyAreaOpenMapInput`, `UrbanStudyAreaOpenMapResult`). `UrbanStudyAreaSelectionResult` now includes `fitRequestId`.
  - Removed `syncUrbanStudyAreaViewportToMapExplorer` (replaced by `previewUrbanStudyAreaInWorkspace` + `openMapExplorerWithStudyAreaPreview`).
- UX changes:
  - Mini map opens at the confirmed Urban context viewport (or a wide search-overview when none is confirmed) — never at a stale global Map Explorer viewport.
  - "Open Map Explorer" deterministically opens to exactly the bounds shown in the mini map, regardless of whether Map Explorer was previously open.
  - Confirm area updates the workflow `StudyAreaBanner` and Map Explorer active AOI without reload.
  - Preview-only mini-map pan/zoom no longer drags an open Map Explorer modal around (no re-fit on every viewport change).
- Validation:
  - `npm run typecheck` - Passed.
  - `npm run lint:errors` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts --reporter=verbose` - Passed, 7/7 tests (geocoder bounds parsing, viewport derivation, scalar geocoder candidates, preview scalar sync without evidence/AOI, open-explorer pending fit-bounds queueing + viewport, atomic consume, full commit binding).
  - `npm run test:analytics` - Passed, 51/51 files and 1026/1026 tests.
  - `npm run build` - Passed.
  - `npm run dev:vite -- --host 127.0.0.1 --port 5180 --strictPort` then `curl http://127.0.0.1:5180/` - HTTP 200 (5173/5174 were occupied).
- Risks:
  - The legacy `synapse:map:fitBounds` window event listener is retained in `MapExplorerModal` for `UrbanEvidenceTray` Publish flow compatibility. Future cleanup can route that path through the typed store contract.
  - `pendingFitBounds` is intentionally NOT persisted; a request queued before a hard reload is dropped, which is correct behaviour for transient UI sync state.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### User-Requested Refinement - Study Area Mini Map / Map Explorer / Center Panel Sync

- Date: 2026-05-08
- Agent: Codex (GPT-5)
- Status: completed
- Files inspected:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/Flows/FlowHost.tsx`
  - `src/stores/useMapExplorerStore.ts`
  - `src/stores/usePanelBridgeStore.ts`
- Files changed:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Fixed the remaining synchronization gap between the study-area mini map, Map Explorer, and Center Panel workflow context.

  Changes made:
  - Added `syncUrbanStudyAreaViewportToMapExplorer()` as a single helper for Map Explorer viewport/bounds synchronization.
  - Programmatic study-area sync now writes Map Explorer viewport synchronously instead of relying only on the debounced `setViewport()`.
  - Fit-bounds events are dispatched immediately and again on the next frame/tick so an opening Map Explorer modal receives the target bounds.
  - Mini-map viewport changes now update Map Explorer `currentMapBounds` and viewport during preview without registering evidence or final AOI.
  - `Confirm area` still performs the durable binding: AOI feature, active AOI, Urban context study-area fields, evidence artifact, and Map Explorer fit.
  - `Open Map Explorer` now opens against the same preview bounds rather than a stale global viewport snapshot.
- Evidence/provenance changes:
  - Final study-area evidence behavior is unchanged; preview sync does not create evidence artifacts.
- Data fitness or QA changes:
  - None.
- Method validity changes:
  - None.
- Contract changes:
  - New exported helper contract: `UrbanStudyAreaViewportSyncInput`, `UrbanStudyAreaViewportSyncResult`, and `syncUrbanStudyAreaViewportToMapExplorer()`.
- Validation:
  - `npm run typecheck` - Passed.
  - `npx eslint src/features/urbanAnalytics/StudyAreaPicker.tsx src/features/urbanAnalytics/context/studyAreaSelection.ts src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts --reporter=verbose` - Passed, 5/5 tests.
  - `npm run lint:errors` - Passed.
  - `npm run test:analytics` - Passed, 51/51 files and 1024/1024 tests.
  - `npm run build` - Passed.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - Passed, HTTP 200.
- Risks:
  - Live preview sync updates Map Explorer viewport/bounds before final confirmation, but does not create evidence or overwrite Urban study-area context until confirm.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### User-Requested Refinement - Study Area Mini Map Readability and Search UX

- Date: 2026-05-08
- Agent: Codex (GPT-5)
- Status: completed
- Files inspected:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/stores/useMapExplorerStore.ts`
- Files changed:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Improved the study-area picker when no confirmed area exists and prevented the mini map from opening as a dark, empty ocean viewport.

  Changes made:
  - Mini map now uses the readable `streets` base layer instead of inheriting Map Explorer's dark base layer.
  - Empty/default Map Explorer viewport is ignored when there is no useful current map extent.
  - Added a neutral search overview extent for the initial mini-map view.
  - Added debounced place search while typing, so entering a place name automatically resolves and zooms the mini map without requiring an extra click.
  - Resizes the MapLibre instance before fitting bounds to reduce blank/gray first-render states.
- Evidence/provenance changes:
  - None.
- Data fitness or QA changes:
  - None.
- Method validity changes:
  - None.
- Contract changes:
  - None.
- Validation:
  - `npm run typecheck` - Passed.
  - `npx eslint src/features/urbanAnalytics/StudyAreaPicker.tsx src/features/urbanAnalytics/context/studyAreaSelection.ts src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts --reporter=verbose` - Passed, 4/4 tests.
  - `npm run lint:errors` - Passed.
  - `npm run test:analytics` - Passed, 51/51 files and 1023/1023 tests.
  - `npm run build` - Passed.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - Passed, HTTP 200.
- Risks:
  - Auto search still depends on runtime network access to Nominatim.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### User-Requested Refinement - Study Area Mini Map Stability and Layout

- Date: 2026-05-08
- Agent: Codex (GPT-5)
- Status: completed
- Files inspected:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/stores/useMapExplorerStore.ts`
- Files changed:
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Fixed the mini-map zoom-out loop and tightened the picker layout.

  Changes made:
  - Removed the feedback loop where every mini-map `moveend` updated preview bounds and then re-triggered `fitBounds`.
  - Kept mini-map movement local until `Confirm area`; Map Explorer store updates now happen through the publication/binding action rather than on every mini-map pan/zoom.
  - Ignored global/world-like stored bounds when initializing the picker so stale `[-180, -90, 180, 90]` extents do not appear as a useful study area.
  - Stopped the header trigger from showing unconfirmed live preview bounds; it only shows confirmed Urban context bounds.
  - Made the panel wider and shorter with a narrower control rail and larger rectangular map surface.
  - Removed the empty result-list block when there are no search results and moved the mini-map HUD away from MapLibre controls.
- Evidence/provenance changes:
  - None.
- Data fitness or QA changes:
  - None.
- Method validity changes:
  - None.
- Contract changes:
  - None.
- Validation:
  - `npm run typecheck` - Passed.
  - `npx eslint src/features/urbanAnalytics/StudyAreaPicker.tsx src/features/urbanAnalytics/context/studyAreaSelection.ts src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts --reporter=verbose` - Passed, 4/4 tests.
  - `npm run lint:errors` - Passed.
  - `npm run test:analytics` - Passed, 51/51 files and 1023/1023 tests.
  - `npm run build` - Passed.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - Passed, HTTP 200.
- Risks:
  - None beyond the existing runtime dependency on map tile/geocoder network availability.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### User-Requested Refinement - Header Set Area Map Explorer Binding

- Date: 2026-05-08
- Agent: Codex (GPT-5)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/mapTypes.ts`
  - Existing Urban Analytics and Map Explorer tests.
- Files changed:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/components/terminal/hooks/__tests__/useTerminalHistory.test.ts`
  - `src/services/__tests__/commandRegistry.test.ts`
  - `src/stores/__tests__/problemsStoreBounds.test.ts`
  - `src/stores/__tests__/runManifest.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Replaced the header `Set area` control with a real Urban Analytics study-area picker integrated with Map Explorer.

  Changes made:
  - Added a compact mini-map picker in the Urban Analytics header using the existing Map Explorer `MapCanvas`.
  - Added place-name lookup through Nominatim, converting gazetteer bounding boxes into the Map Explorer `[west, south, east, north]` contract.
  - Added current-viewport selection so users can pan/zoom the mini map or use the existing Map Explorer viewport as the shared study area.
  - On confirm, writes the selected extent to Map Explorer viewport/bounds, a Map Explorer AOI drawn feature, Urban Analytics `studyArea*` context fields, and the active AOI reference.
  - Dispatches `synapse:map:fitBounds` so an open Map Explorer can zoom to the selected area.
  - Registers a lightweight Urban evidence artifact for the study-area selection with scalar metadata only; no bulky geometry or raw dataset payload is pushed through generic UI events.
  - Converted local JSX conditional renderings in `UrbanAnalyticsModal.tsx` away from `&&` form to avoid the repository ESLint `react/jsx-no-leaked-render` crash.
  - Cleaned pre-existing unused-symbol lint blockers so `npm run lint:errors` is clean.
- Evidence/provenance changes:
  - New study-area evidence artifacts use stable IDs: `urban-study-area-artifact-{sourceOrManualId}`.
  - Metadata records source, sourceId, source class/type, importance, bounds, center, zoom, and CRS as scalar evidence metadata.
  - Provenance records Map Explorer source module and the AOI layer reference; no spatial payload is stored in Urban Analytics evidence.
- Data fitness or QA changes:
  - Study-area evidence is intentionally registered as `unvalidated`.
  - QA limitations explicitly state that a geocoded viewport/bounding box is not an official administrative boundary and that area/distance calculations still require an appropriate projected CRS.
- Method validity changes:
  - None.
- Contract changes:
  - Added `UrbanStudyAreaBounds`, `UrbanStudyAreaCandidate`, `UrbanStudyAreaSelectionInput`, and `UrbanStudyAreaSelectionResult` in `context/studyAreaSelection.ts`.
  - Study-area binding now uses existing Map Explorer store contracts: `setViewport`, `setCurrentMapBounds`, `addDrawnFeature` / `updateDrawnFeature`, and `setActiveAoi`.
- UX changes:
  - Header `Set area` opens a premium compact panel with search, results, mini map, viewport status, `Use viewport`, `Open Map Explorer`, and `Confirm area`.
  - Confirmed area name and bounds summary are reflected directly in the header trigger.
- Validation:
  - `npm run typecheck` - Passed (exit 0).
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts --reporter=verbose` - Passed, 4/4 tests.
  - `npx eslint src/features/urbanAnalytics/UrbanAnalyticsModal.tsx src/features/urbanAnalytics/StudyAreaPicker.tsx src/features/urbanAnalytics/context/studyAreaSelection.ts src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts` - Passed, 0 errors and 0 warnings.
  - `npm run lint:errors` - Passed.
  - `npx vitest run src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts src/components/terminal/hooks/__tests__/useTerminalHistory.test.ts src/services/__tests__/commandRegistry.test.ts src/stores/__tests__/problemsStoreBounds.test.ts src/stores/__tests__/runManifest.test.ts --reporter=verbose` - Passed, 57/57 tests.
  - `npm run test:analytics` - Passed, 51/51 files and 1023/1023 tests.
  - `npm run build` - Passed.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - Passed, HTTP 200.
- Risks:
  - Place search depends on network access to Nominatim at runtime; the UI preserves current viewport fallback when search fails.
  - Geocoded bounding boxes are shared spatial context extents, not authoritative cadastral or administrative boundaries.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### Prompt 17 Refinement - Urban to Map Evidence Publication Hardening

- Date: 2026-05-08
- Agent: Codex (GPT-5)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/features/urbanAnalytics/context/mapEvidencePublisher.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `src/stores/useMapExplorerStore.ts`
  - `src/stores/useFlowStore.ts`
  - `src/centerpanel/components/map/mapTypes.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/mapEvidencePublisher.ts`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Reviewed Prompt 17 against its original acceptance criteria and hardened the implementation.

  Changes made:
  - Added explicit `UrbanToMapPublicationStyleLegendMetadata` and `UrbanToMapPublicationCrsSummary` contracts to `UrbanToMapEvidencePublication`.
  - Added publication eligibility blockers for non-renderable outputs: invalid/non-FeatureCollection payloads, empty FeatureCollections, and `3d_scene` outputs that do not yet have a 2D Map Explorer publication contract.
  - Added deterministic map evidence artifact IDs per run/output so repeated Publish actions upsert the existing artifact instead of creating duplicates.
  - Added CRS provenance summaries from source layer metadata plus explicit EPSG:4326 display-coordinate notes without claiming analytical CRS validation.
  - Added style/legend metadata extraction from analysis visualization metadata first, then layer style fallback.
  - Updated evidence artifact metadata with scalar publication ID, layer type, legend count/source, CRS, QA, and uncertainty fields.
  - Updated the evidence tray so Publish is disabled with a concrete reason when a workflow run has no eligible map output, synthetic runtime mode, invalid output payloads, or a missing run registration.
  - Updated tray publication focus to keep all newly published layers active instead of collapsing focus to only the first layer.
- Evidence/provenance changes:
  - Publication artifacts now use stable IDs: `urban-map-artifact-{runId}-{outputId}` after safe normalization.
  - Evidence artifact metadata records publication metadata as scalar fields only; no GeoJSON payloads are stored in Urban Analytics evidence.
- Data fitness or QA changes:
  - Publication QA summary now marks demo outputs as warning, blocked data-fitness outputs as blocked, and legacy/unknown runs as unvalidated with caveats.
  - No data-fitness scoring algorithm changed.
- Method validity changes:
  - None.
- Contract changes:
  - `UrbanToMapEvidencePublication` now includes `styleLegendMetadata` and `crsSummary`.
  - New supporting contracts: `UrbanToMapPublicationStyleLegendMetadata`, `UrbanToMapPublicationCrsSummary`.
- UX changes:
  - Publish button disabled states now reflect run/output eligibility rather than only artifact kind.
  - Multi-output publication keeps all published layer IDs active in Map Explorer.
- Validation:
  - `npm run typecheck` - Passed (exit 0).
  - `npx vitest run src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx --reporter=verbose` - Passed, 26/26 tests.
  - `npx eslint src/features/urbanAnalytics/lib/types.ts src/features/urbanAnalytics/context/mapEvidencePublisher.ts src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx` - Passed, 0 errors.
  - `npm run test:analytics` - Passed, 50/50 files and 1019/1019 tests.
  - `Invoke-WebRequest http://127.0.0.1:5173/` - Passed, HTTP 200 after starting `npm run dev:vite -- --host 127.0.0.1 --port 5173`.
  - `npm run lint:errors` - Failed with 7 pre-existing unused-symbol errors outside the changed Prompt 17 files.
- Risks:
  - CRS summaries are provenance/metadata summaries only. They do not validate analytical CRS or reproject geometry.
  - `3d_scene` outputs are intentionally blocked until a VoxCity/Map Explorer 3D publication contract exists.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

### Prompt 17 - Urban to Map Evidence Publication

- Date: 2026-05-09
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/features/urbanAnalytics/lib/types.ts` (MapOutput, CompletedAnalysisRun, UrbanWorkflowRunManifest, evidence artifact types)
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts` (UrbanEvidenceArtifactDraft, upsert pattern)
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts` (Prompt 16 pattern reference)
  - `src/features/urbanAnalytics/useUrbanContextStore.ts` (registerEvidenceArtifact return type)
  - `src/stores/useMapExplorerStore.ts` (addOverlayLayer, setActiveAnalysisResultLayers API)
  - `src/stores/useFlowStore.ts` (registerManifest, lookupManifest, completedRuns)
  - `src/centerpanel/components/map/mapTypes.ts` (OverlayLayerConfig, LayerProvenance, LayerMetadata)
  - `src/services/map/MapEngineAdapter.ts` (layer-building pattern reference)
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx` (existing action/row pattern)
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts` (added `UrbanToMapEvidencePublication` and 4 supporting interfaces)
  - `src/features/urbanAnalytics/context/mapEvidencePublisher.ts` (new file)
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx` (Publish to Map button wired)
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts` (new file, 17 tests)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Implemented Prompt 17 Urban to Map Evidence Publication.

  Added new domain types in `lib/types.ts`:
  - `UrbanToMapPublicationEligibility` — eligibility gate result with `eligible` boolean and `reasons[]`.
  - `UrbanToMapPublicationQaSummary` — QA status, warnings, blockers, caveats for the publication event.
  - `UrbanToMapPublicationUncertaintyNotes` — notes, runtimeMode, isDemo flag for transparency.
  - `UrbanToMapPublicationFigureMetadata` — title, caption, CRS, featureCount, geometryType, sourceSummary for report-ready figure attribution.
  - `UrbanToMapEvidencePublication` — immutable publication record with publicationId, artifactId, runId, outputLayerReference (mapLayerId, mapOutputId, layerName, sourceLayerIds), QA summary, uncertainty notes, figure metadata, and publishedAt timestamp.

  Created `src/features/urbanAnalytics/context/mapEvidencePublisher.ts`:
  - `assessPublicationEligibility(run, outputId, manifest)` — checks for empty mapOutputs, missing output ID, and synthetic runtimeMode block. Exported for action gating.
  - `publishUrbanRunOutputsToMap(run)` — main service function:
    1. Loads manifest from `useFlowStore.getState().lookupManifest(runId)`.
    2. Assesses eligibility for each `MapOutput`; skips ineligible outputs with console.warn.
    3. Builds `OverlayLayerConfig` with id `urban-pub-{runId}-{outputId}`, correct type (geojson/heatmap), sourceData from `mapOutput.geojson`, provenance (generatedAt from `run.insertedAt`, method/engine bridge context), metadata (analysisResult if bridge present, featureCount, geometryType), sourceKind (`demo` for demo manifest, else `derived`), group `analysis`, opacity 0.85.
    4. Calls `useMapExplorerStore.getState().addOverlayLayer(layer)` — upserts by ID.
    5. Calls `setActiveAnalysisResultLayers` with deduped IDs including all new layers.
    6. Calls `useUrbanContextStore.getState().registerEvidenceArtifact(draft)` — registers `map-layer` artifact (state `published`, sourceModule `urban-analytics`, linkedRunId, mapLayerId, QA warnings for demo mode).
    7. Updates sidecar manifest `mapArtifactIds` via `registerManifest` with upsert.
    8. Returns `PublishUrbanRunOutputResult` with `eligible`, `reasons`, and `publications` array.

  Updated `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`:
  - Added `Upload` icon import.
  - Added `useFlowStore` and `publishUrbanRunOutputsToMap` imports.
  - Added `publishDisabledReason()` helper (enabled only for `workflow-run` artifacts with `linkedRunId`).
  - Added `onPublishToMap` to `ArtifactRowProps` interface.
  - Added `EvidenceActionButton` for Publish in `ArtifactRow`.
  - Added `handlePublishToMap` callback in `UrbanEvidenceTray` that looks up the run from `useFlowStore.getState().completedRuns`, calls `publishUrbanRunOutputsToMap`, and emits a status message.

  Scientific contract enforced:
  - Synthetic runtimeMode is publication-ineligible (can never appear as map layers without explicit audit controls).
  - Demo mode is permitted but labeled: layer gets `sourceKind: 'demo'`, artifact QA state is `warning` with explicit warning string.
  - Evidence artifacts store only IDs and scalar metadata — no GeoJSON payloads.
  - `mapLayerId` on artifact must match the actual layer ID in Map Explorer.
- Evidence/provenance changes:
  - New `map-layer` evidence artifacts registered with `sourceModule: 'urban-analytics'` and `linkedRunId` cross-reference.
  - Publication record embedded in artifact `metadata` field as scalar fields.
  - Sidecar manifest `mapArtifactIds` updated to track published artifact IDs.
- Data fitness or QA changes:
  - No fitness scoring changes. Evidence artifact QA inherits runtime mode truthfully.
- Method validity changes:
  - None.
- Contract changes:
  - New Prompt 17 shared contracts: `UrbanToMapEvidencePublication` and 4 supporting interfaces in `lib/types.ts`.
  - New publication service exports: `assessPublicationEligibility`, `publishUrbanRunOutputsToMap`, `PublishUrbanRunOutputResult`.
- UX changes:
  - `UrbanEvidenceTray` gains a "Publish" action button on every row.
  - Button enabled only for `workflow-run` artifacts with a `linkedRunId`; all others show a disabled tooltip.
  - Status bar shows publication count or ineligibility reason on action.
- Validation:
  - `npm run typecheck` — No new errors from Prompt 17 files (pre-existing errors in other files unrelated to this scope).
  - `npx vitest run src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts` — Passed, 17/17 tests.
  - `npm run test:analytics` — Passed, 50/50 files and 1013/1013 tests.
- Risks:
  - The evidence tray Publish handler requires the run to be in `useFlowStore.completedRuns`. Legacy runs loaded only from persist without a store registration will not be found; this is correct behavior (unknown provenance).
  - Publication does not validate CRS; urban outputs inherit EPSG:4326 assumption from `CompletedAnalysisRun`. CRS enrichment is a future prompt concern.
- Next recommended prompt: Prompt 18 - Synapse IDE Code Artifact Generation.

- Date: 2026-05-08
- Agent: GitHub Copilot (GPT-5.3-Codex)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` (sections 9, 20.3, 21.9, Epic 7)
  - `src/stores/useMapExplorerStore.ts`
  - `src/services/map/MapAnalysisDispatcher.ts`
  - `src/services/map/MapWorkflowService.ts`
  - `src/services/map/MapSyncService.ts`
  - `src/services/map/MapScientificQA.ts`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts`
  - `src/stores/__tests__/useMapExplorerStore.test.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts` (new file)
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts` (new file)
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Implemented Prompt 16 Map Explorer incoming adapter on the Urban Analytics side.

  Added new typed summary contract in `lib/types.ts`:
  - `MapToUrbanContextSummary`
  - AOI reference summary (`aoiId`, `bounds`)
  - layer IDs, active analysis result layer IDs
  - geometry type summary
  - field and temporal field summaries
  - feature-count and CRS summaries
  - QA summary (`passed`/`warning`/`blocked`/`unknown`)
  - selection summary and recommendation hints.

  Added `src/features/urbanAnalytics/context/mapContextAdapter.ts`:
  - `buildMapToUrbanContextSummary()` converts live Map Explorer state into a lightweight reference package.
  - `applyMapContextToUrban()` updates Urban context (`activeAoiId`, `activeLayerIds`), creates context if missing, and registers/upserts a map-origin evidence artifact by reference.
  - `subscribeMapContextToUrban()` debounces map-store changes and continuously syncs incoming context.

  Adapter guarantees:
  - No heavy geometry copied into Urban context or persistence.
  - Context/evidence updates use IDs, counts, CRS/QA summaries, and bounded field scans only.
  - Recommendation trigger is safe and explicit (`recMode` set true only when map layers are present and currently disabled).

  Wired adapter into `UrbanAnalyticsModal` active lifecycle so map context sync starts when modal is active and unsubscribes on close.
- Evidence/provenance changes:
  - Map-origin evidence artifact registration is now automated via adapter (`kind: map-layer`, `sourceModule: map-explorer`) with linked layer references and QA/CRS caveat metadata.
- Data fitness or QA changes:
  - No new data-fitness scoring logic added. Adapter consumes Map QA summary and propagates blocked/warning semantics truthfully into evidence QA state.
- Method validity changes:
  - None.
- Contract changes:
  - New Prompt 16 shared contract: `MapToUrbanContextSummary` and supporting summary interfaces.
  - New Urban store action: `setRecMode(enabled)` for deterministic recommendation-mode activation.
- UX changes:
  - No map rendering/UI redesign.
  - Urban recommendation mode can auto-enable when map context is available.
  - Context strip layer count reflects synchronized map layer references.
- Validation:
  - `npm run typecheck` — Passed (exit 0).
  - `npx vitest run src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts --reporter=verbose` — Passed, 3/3 tests.
  - `npm run test:analytics` — Passed, 49/49 files and 996/996 tests.
- Risks:
  - Recommendation triggering currently uses `recMode` activation and event emission; richer explanation surfaces in rail cards are a future enhancement.
  - Field/temporal inference scans up to 160 features per layer by design; very sparse schema anomalies can still require manual inspection in downstream prompts.
- Next recommended prompt: Prompt 17 - Urban to Map Evidence Publication.

### Prompt 15 - Workflow Readiness Gates and Failure Modes

- Date: 2026-05-08
- Agent: GitHub Copilot (GPT-5.3-Codex)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/centerpanel/Flows/workflowExperience.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
  - `src/centerpanel/Flows/UrbanMorphologyFlow.tsx`
  - `src/features/urbanAnalytics/context/dataFitness.ts`
  - `src/features/urbanAnalytics/context/methodValidity.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/lib/runManifest.ts`
  - `src/stores/useFlowStore.ts`
  - `src/stores/__tests__/runManifest.test.ts`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/lib/runManifest.ts`
  - `src/centerpanel/Flows/workflowReadiness.ts` (new file)
  - `src/centerpanel/Flows/UrbanMorphologyFlow.tsx`
  - `src/centerpanel/Flows/__tests__/workflowReadiness.test.ts` (new file)
  - `src/stores/__tests__/runManifest.test.ts`
- Summary: |
  Implemented shared workflow readiness preflight with explicit statuses: `ready`, `warning`, `blocked`, `demo_only`, `unknown`.

  Added readiness contracts to domain types:
  - `UrbanWorkflowReadinessStatus`
  - `UrbanWorkflowReadinessIssue`
  - `UrbanWorkflowReadinessResult`
  - `UrbanWorkflowRunManifest.readiness`

  Extended run-manifest helpers:
  - `BuildRunManifestOptions.readiness`
  - `buildRunManifest()` now records readiness snapshots
  - `resolveLegacyRunManifest()` sets `readiness: null`

  Added `src/centerpanel/Flows/workflowReadiness.ts` with `evaluateWorkflowReadiness()`.
  The evaluator checks required inputs, context availability, environment dependencies, method validity capability status, data-fitness status, and runtime mode labeling.

  Integrated one representative workflow per stop condition:
  - `UrbanMorphologyFlow` now computes readiness before execution.
  - Blocked readiness prevents execution and surfaces remediation text in the UI.
  - Demo mode is labeled as `demo_only` (not silently treated as live readiness).
  - Blocked runs register a failure evidence artifact (kind `workflow-run`, state `invalid`) with blocker reasons and remediation actions.
  - Successful runs store the readiness snapshot in the run manifest sidecar.

  This keeps scope bounded while delivering a reusable readiness helper plus one production integration path.
- Evidence/provenance changes:
  - On blocked execution attempts in `UrbanMorphologyFlow`, a failure evidence artifact is now registered with readiness blockers and remediation guidance.
  - No heavy payloads were added; references/metadata only.
- Data fitness or QA changes:
  - No scoring algorithm changes. Readiness consumes data-fitness status conservatively (`null` -> unknown, never coerced to ready).
- Method validity changes:
  - No envelope schema changes. Readiness consumes capability status from existing validity envelopes and enforces truthful state handling (`deferred` blocked, `demo_mode` demo_only labeling).
- Contract changes:
  - New shared readiness contracts in `lib/types.ts`.
  - `UrbanWorkflowRunManifest` now includes optional snapshot field `readiness`.
- UX changes:
  - `UrbanMorphologyFlow` run step now shows readiness status, reasons, and remediation actions before execution.
  - Run button is disabled for blocked readiness.
- Validation:
  - `npm run typecheck` — Passed (exit 0).
  - `npm run test:analytics` — Passed.
  - `npx vitest run src/centerpanel/Flows/__tests__/workflowReadiness.test.ts src/stores/__tests__/runManifest.test.ts --reporter=verbose` — Passed, 24/24 tests.
- Risks:
  - Readiness integration is currently representative (Urban Morphology flow only). Other flow surfaces still need migration to the shared helper in future prompts.
  - Data-fitness for Urban Morphology remains unevaluated (`null`) in this prompt; readiness labels this truthfully but does not yet compute fitness from per-flow layer metadata.
- Next recommended prompt: Prompt 16 - Map Explorer Incoming Context Adapter.

### Prompt 14 - Workflow Runtime Run Manifest

- Date: 2026-05-08
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/centerpanel/Flows/flowTypes.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
  - `src/stores/useFlowStore.ts`
  - `src/stores/__tests__/useFlowStore.test.ts`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/lib/runManifest.ts` (new file)
  - `src/stores/useFlowStore.ts`
  - `src/stores/__tests__/runManifest.test.ts` (new file)
  - `src/centerpanel/Flows/UrbanMorphologyFlow.tsx`
- Summary: |
  Added `UrbanWorkflowRuntimeMode` union (`'live' | 'demo' | 'synthetic' | 'unknown'`) to `lib/types.ts`.

  Added `UrbanWorkflowRunManifest` interface to `lib/types.ts`. Fields: `runId`, `flowId`, `contextId` (null for legacy runs), `inputs`, `parameters`, `methodValidity` (null when unavailable), `dataFitness` (null when not evaluated), `mapArtifactIds`, `codeArtifactIds`, `reportInsertIds`, `dashboardBindingIds`, `indicatorResultIds`, `runtimeMode`, `createdAt`. Scientific contract is JSDoc-documented directly on the interface.

  Created `src/features/urbanAnalytics/lib/runManifest.ts` with:
  - `buildRunManifest(run, options)` — creates a fully-typed manifest from a CompletedAnalysisRun and execution context. Caller supplies contextId, inputs, parameters, validity envelope snapshot, fitness profile, artifact IDs, and runtime mode. Defaults to empty arrays and `runtimeMode: 'live'` when omitted.
  - `resolveLegacyRunManifest(run)` — creates a conservative compatibility manifest for legacy CompletedAnalysisRuns that predate the manifest system. Sets `contextId: null`, `methodValidity: null`, `dataFitness: null`, `runtimeMode: 'unknown'`, empty artifact arrays, and uses `run.insertedAt` as `createdAt`.
  - `assertManifestForFlow(manifest, flowId)` — narrow assertion that throws a typed error when flowId mismatches.

  Updated `src/stores/useFlowStore.ts` to add:
  - `manifests: Record<string, UrbanWorkflowRunManifest>` sidecar registry field (initialized as `{}`).
  - `registerManifest(manifest)` action — stores/overwrites manifest keyed by `runId`.
  - `lookupManifest(runId)` action — returns the registered manifest if present; falls back to `resolveLegacyRunManifest` for any `completedRuns` entry without a manifest; returns `null` for unknown runIds.
  - `reset()` already clears the whole initial state including `manifests: {}`.

  Cross-check addendum: `src/centerpanel/Flows/UrbanMorphologyFlow.tsx` now builds and registers a run manifest when clustering completes successfully. The manifest records `contextId` via `useUrbanContextId`, truthful `runtimeMode: 'demo'`, selected indicator IDs / skipped-unit counts as inputs, run parameters, and map publication reference (`mapArtifactIds`) for the generated overlay layer.

  `CompletedAnalysisRun` shape is **unchanged** — sidecar approach preserves all existing consumers (SessionPersistence, narrativeBuilders, evidenceArtifacts, collaboration projectHistory, MapAnalysisDispatcher).

  Created `src/stores/__tests__/runManifest.test.ts` with 18 tests covering: `buildRunManifest` field population, option defaults, runtimeMode defaulting; `resolveLegacyRunManifest` conservative defaults, createdAt propagation; `assertManifestForFlow` match and mismatch; store `registerManifest`, overwrite semantics, `lookupManifest` hit/miss/legacy-fallback/prefer-registered, reset clears registry, side-effect isolation.
- Evidence/provenance changes: No evidence artifact registry changes. Manifests are a separate sidecar from evidence artifacts — they can be linked via `linkedRunId` in a future prompt.
- Data fitness or QA changes: `UrbanDataFitnessProfile` is accepted as an optional snapshot field on the manifest (null when not evaluated). No scoring helper changes.
- Method validity changes: `UrbanMethodValidityEnvelope` is accepted as an optional snapshot field on the manifest (null when unavailable). No validity envelope changes.
- Contract changes: `useFlowStore` gains `manifests`, `registerManifest`, `lookupManifest`. Existing actions and `CompletedAnalysisRun` shape are unchanged. Legacy consumers are unaffected.
- UX changes: None in Prompt 14. Manifests are available for Prompt 15 readiness gates to read and surface.
- Scientific integrity notes:
  - `runtimeMode: 'unknown'` for legacy runs — consumers must treat as analytically unverified, never as confirmed real-data results.
  - `contextId: null` for legacy runs — absence is truthful, not a fabricated context.
  - Empty `indicatorResultIds` means no indicators were recorded, not that computation succeeded silently.
  - `methodValidity: null` and `dataFitness: null` mean not evaluated — never fabricated.
- Validation:
  - `npm run typecheck` — Passed (exit 0, 0 errors).
  - `npx vitest run src/stores/__tests__/runManifest.test.ts src/stores/__tests__/useFlowStore.test.ts --reporter=verbose` — Passed, 20/20 tests.
- Risks:
  - `manifests` is in-memory only (no persist middleware on `useFlowStore`). If persistence is added in a future session, manifests must be included in the persistence key set.
  - `lookupManifest` legacy fallback only covers runs currently in `completedRuns`. Runs removed from the store (if that ever happens) would return null from lookupManifest even if they had a manifest registered.
  - `'degraded'` runtimeMode is not in the union (only `live/demo/synthetic/unknown`). If partial-data degraded runs are needed, extend the union in a targeted prompt.
- Next recommended prompt: Prompt 15 - Workflow Readiness Gates and Failure Modes.

### Prompt 13 - Indicator Calculators QA and Unit Semantics

- Date: 2026-05-08
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/indicators/shared.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/calculators/transportMobility.ts`
  - `src/features/urbanAnalytics/calculators/energyClimate.ts`
  - `src/features/urbanAnalytics/calculators/__tests__/legacyCalculators.test.ts`
  - `src/features/urbanAnalytics/calculators/__tests__/catalogIndicatorMatrix.test.ts`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/indicators/shared.ts`
  - `src/features/urbanAnalytics/calculators/transportMobility.ts`
  - `src/features/urbanAnalytics/calculators/energyClimate.ts`
  - `src/features/urbanAnalytics/calculators/__tests__/calculatorQA.test.ts` (new file)
- Summary: |
  Added `IndicatorQAStatus` union type (`'valid' | 'warning' | 'blocked' | 'degraded'`) and `IndicatorResultQA` interface to `lib/types.ts`. Extended `IndicatorResult` with optional `qa?: IndicatorResultQA` field.

  Added `buildIndicatorQA(sourceCalculator, options)` helper to `indicators/shared.ts`. It computes QA status conservatively: `blocked` when all required-positive inputs fail or no inputs are provided; `warning` when any required-positive input fails or caller passes explicit warning strings; `valid` otherwise. `missingnessRate` is computed as `failingRequired.length / totalInputCount` (rounded to 4 dp). Added `wrapWithQA(result, qa)` non-mutating helper that spreads the QA record onto an existing result.

  Updated `createOutputSchema()` in `indicators/shared.ts` to include `qa` as an optional Zod object in the output schema — this prevents Zod's default "strip" mode from silently dropping the `qa` field during the `computeCatalogIndicator()` parse step.

  QA-hardened three representative calculators: `modeSplit` (caller-supplied warning on zero total trips; QA inputCount = 4 for all four mode fields), `buildingEnergyIntensity` (requiredPositive: `floorAreaM2`), `carbonFootprintPerCapita` (requiredPositive: `population` only — zero emissions is a valid net-zero scenario).

  Created `calculators/__tests__/calculatorQA.test.ts` with 17 tests covering: `buildIndicatorQA` helper unit tests (valid/warning/blocked/empty-inputs/caller-warnings paths, `wrapWithQA` non-mutation), `modeSplit` QA semantics (valid path, zero-trips warning, mixed-zero valid), `buildingEnergyIntensity` QA semantics (valid, zero area, negative area), `carbonFootprintPerCapita` QA semantics (valid, zero population, negative population, zero-emissions valid).
- Evidence/provenance changes: None. QA metadata is attached to computed results only, never written to evidence artifact registry.
- Data fitness or QA changes: New `IndicatorResultQA` schema extends the per-result QA record with conservative truthful status, missingness rate, and source calculator identity. No data fitness scoring helpers changed.
- Method validity changes: None. Calculator mathematical formulas unchanged. QA wrapping is additive only.
- Contract changes: `IndicatorResult.qa` is optional — all downstream consumers that do not inspect `qa` are unaffected. `createOutputSchema` Zod schema updated to pass `qa` through; no breaking change.
- UX changes: None in Prompt 13. QA metadata is available for Prompt 14+ to surface in workflow run manifests and result surfaces.
- Scientific integrity notes:
  - Zero emissions inputs in `carbonFootprintPerCapita` are a valid net-zero analytical scenario — they do not trigger a warning.
  - Individual zero-count mode-split inputs (e.g. zero cycling trips) are analytically valid; only total = 0 triggers a warning.
  - `buildingEnergyIntensity` and `carbonFootprintPerCapita` guard against zero/negative denominators via `requiredPositive`.
  - Remaining 46 catalog calculators were intentionally NOT modified in Prompt 13 (phased migration — broad simultaneous change carries refactor risk).
  - `missingnessRate` is an honest conservative measure: failing inputs / total inputs, not failing inputs / required-positive count.
- Validation:
  - `npm run typecheck` — Passed (exit 0, 0 errors).
  - `npx vitest run src/features/urbanAnalytics/calculators/__tests__/calculatorQA.test.ts` — Passed, 17/17 tests.
  - `npx vitest run src/features/urbanAnalytics/calculators/__tests__/legacyCalculators.test.ts` — Passed, 37/37 tests.
  - `npx vitest run src/features/urbanAnalytics/calculators/__tests__/catalogIndicatorMatrix.test.ts` — Passed, all tests.
  - `npx vitest run src/features/urbanAnalytics/indicators` — Passed, 8/8 tests.
- Risks:
  - Remaining 46 calculators do not yet have QA wrapping. Prompt 14 workflow manifest should handle absent `qa` gracefully (treat undefined `qa` as unknown, not as valid).
  - `'degraded'` QA status is defined in the type union but not produced by `buildIndicatorQA`; it is reserved for external/runtime degradation signals (e.g. stale or partial data).
- Next recommended prompt: Prompt 14 - Workflow Runtime Run Manifest.

### Prompt 12 - Indicator Catalog V2 Metadata Traceability

- Date: 2026-05-08
- Agent: Codex GPT-5
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/indicators/shared.ts`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`
  - `src/features/urbanAnalytics/indicators/storage.ts`
  - `src/services/reporting/indicatorInserts.ts`
  - `src/features/dashboard/dataBindings.ts`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/indicators/shared.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`
  - `src/services/reporting/indicatorInserts.ts`
  - `src/features/dashboard/dataBindings.ts`
- Summary: |
  Added a typed `IndicatorTraceabilityMetadata` contract that can represent formula, units, spatial scale, temporal scale, input field semantics, normalization method, interpretation guidance, limitations, reference/source note, capability status, and metadata provenance. Existing definitions remain backward compatible through `resolveIndicatorTraceabilityMetadata()`, which derives truthful metadata from existing formula/unit/input/reference fields and validity envelopes where available.

  Added `validateIndicatorTraceabilityMetadata()` and `validateIndicatorCatalogTraceability()` so missing critical formula/unit/input/interpretation/reference/scale metadata is caught by tests. The real 49-indicator catalog validates with zero critical gaps while intentionally sparse legacy fixtures fail validation.

  Computed indicator records now carry resolved traceability, and computed `IndicatorResult.metadata.indicatorTraceability` preserves the same reference data for downstream consumers. Report pending inserts and dashboard computed bindings now use the traceability metadata for units, formula, scale, temporal scale, normalization, limitations, and references instead of silently dropping those fields.

  Indicator Catalog UI now shows a compact scientific metadata strip in the detail hero for formula, unit, spatial scale, temporal scale, and capability/metadata status. Formula/reference panels also expose normalization, input semantics, limitations, and source note without adding another heavy card layer.
- Evidence/provenance changes: Computed indicator records and result metadata now carry traceability references. No raw datasets, geometry, map state, or report bodies are copied into indicator metadata.
- Data fitness or QA changes: No scoring helper changes. Indicator validation now catches missing critical traceability metadata and provides warnings for missing limitations/unspecified normalization where applicable.
- Method validity changes: Indicator traceability resolution consumes existing `validityEnvelope` and capability status when available; no method validity presets were rewritten.
- Contract changes: No new cross-module event contract. `ComputedIndicatorRecord` gained optional `traceability`; report/dashboard consumers read it with fallback to the resolver for legacy records.
- UX changes:
  - Indicator detail hero now surfaces formula/unit/scale/temporal/capability metadata in a dense strip.
  - Formula panel shows normalization, input field semantics, and limitations.
  - Reference panel shows source note and whether metadata is authored, validity-envelope-derived, or legacy-derived.
- Scientific integrity notes:
  - Missing explicit spatial scale is represented with a truthful study-area scale note, not a false scale claim.
  - Legacy-derived limitations are generic denominator/unit/temporal-alignment caveats, not invented method-specific validation.
  - Catalog validation catches truly missing critical fields.
- Validation:
  - `npm run typecheck` — Passed (exit 0, 0 errors).
  - `npx vitest run src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts` — Passed, 7/7 tests.
  - `npm run test -- src/features/urbanAnalytics/indicators` — Passed, 2/2 files and 8/8 tests.
  - `npx eslint src/features/dashboard/dataBindings.ts src/features/urbanAnalytics/indicators/types.ts src/features/urbanAnalytics/indicators/shared.ts src/features/urbanAnalytics/indicators/catalog.ts src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts src/services/reporting/indicatorInserts.ts` — Passed (0 errors, 0 warnings).
  - `npm run test:analytics` — Passed, 47/47 files and 976/976 tests.
  - Dev server smoke: `http://127.0.0.1:5173/` returned HTTP 200.
  - `Get-Content -Raw DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json | ConvertFrom-Json | Out-Null` — Passed.
  - `scripts/get-next-urban-analytics-prompt.ps1` — Passed; returns Prompt 13 - Indicator Calculators QA and Unit Semantics.
- Risks:
  - Spatial/temporal scale remains legacy-derived for definitions that do not yet author explicit V2 metadata. Prompt 13 should attach calculator QA/unit semantics to real inputs, and later catalog migration can replace generic fallback notes with authored per-indicator envelopes.
  - Existing stored computed indicator records from older sessions may not have `traceability`; report/dashboard consumers now resolve fallback metadata at use time.
- Next recommended prompt: Prompt 13 - Indicator Calculators QA and Unit Semantics.

### Prompt 11 - Evidence Tray and Provenance Surface

- Date: 2026-05-08
- Agent: Codex GPT-5
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/stores/useFlowStore.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/services/reporting/`
  - `src/services/synapseBus.ts`
  - `src/services/analytics/urbanToIdeHandoff.ts`
  - `src/services/map/ideMapHandoff.ts`
  - `src/types/synapse-bus.ts`
  - `src/features/dashboard/types.ts`
  - `src/features/dashboard/dataBindings.ts`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`
  - `src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`
- Summary: |
  Added a compact bottom-docked Urban Evidence Tray inside the existing modal shell. The tray lists only artifacts linked to the active Urban Analysis Context, never global orphan artifacts, and keeps the lifecycle visible with artifact kind, source module, QA state, lifecycle state, data fitness status, reference chips, and updated time.

  Added a provenance inspector for the selected artifact with source IDs, method/run/workflow references, QA warnings/limitations, confidence, data fitness summary, layer/file/input-artifact references, and copyable reference-only manifest JSON. The manifest intentionally stores IDs, scalar metadata, provenance, and QA only; no raw geometry, datasets, map snapshots, or file contents are copied.

  Implemented truthful cross-module actions. Inspect is always local. Map opens Map Explorer, marks the referenced layer as active, and emits `map.layer.focus` only when a layer ID exists. IDE emits `analytics.script.open` only when a file path exists. Report uses the existing `note/applyPatch` plus `synapse:navigate` contract. Dashboard navigation is enabled only when `dashboardBindingId` resolves through the dashboard binding catalog and maps to a real widget type.
- Evidence/provenance changes: Evidence registry contracts unchanged. Tray consumes `UrbanEvidenceArtifact` references by active context and does not mutate, delete, copy heavy payloads, or fabricate provenance.
- Data fitness or QA changes: No scoring helper changes. UI now exposes artifact QA states and attached data fitness summaries truthfully, including unknown/no-note states.
- Method validity changes: None.
- Contract changes: No new cross-module event contracts introduced. Existing contracts consumed: `map.layer.focus`, `analytics.script.open`, `note/applyPatch`, and `synapse:navigate` dashboard/report navigation.
- UX changes:
  - New minimal Evidence dock in the bottom of the Urban Analytics right rail.
  - Follow-up refinement moved the tray out of the global modal bottom area, made it collapsed by default in the modal, and adapted expanded rows to the right-rail width.
  - Second visual refinement removed the card-like right-rail chrome, shortened header labels, removed the redundant right-rail close button, hid empty filters, and changed chips/actions/detail groups to lightweight inline/list styling to prevent clipping and stacked frames.
  - Expanded tray shows filters by artifact kind, stable rows, provenance inspector, and explicit disabled action reasons.
  - Desktop/tablet actions keep icon + text labels visible; very narrow screens collapse to icon buttons with titles/ARIA labels.
- Scientific integrity notes:
  - Orphan/global artifacts are hidden when no active context exists to avoid false provenance.
  - Missing layer/file/dashboard contracts disable actions with visible reasons.
  - Report insertion labels registry QA as registry metadata and avoids external validation claims.
- Validation:
  - `npm run typecheck` — Passed (exit 0, 0 errors).
  - `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx` — Passed, 3/3 tests.
  - `npm run test:analytics` — Passed, 47/47 files and 974/974 tests.
  - `npx eslint src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx` — Passed (0 errors).
  - `npx eslint --rule "react/jsx-no-leaked-render: off" src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` — Passed with 0 errors; existing warnings remain in pre-existing context bar code.
  - `npm run lint:errors` — Failed on pre-existing unrelated errors in `src/centerpanel/components/TopHeader.tsx`, `src/components/terminal/hooks/__tests__/useTerminalHistory.test.ts`, `src/services/__tests__/commandRegistry.test.ts`, and `src/stores/__tests__/problemsStoreBounds.test.ts`.
  - Dev server smoke: `http://127.0.0.1:5173/` returned HTTP 200.
  - Follow-up right-rail refinement: `npm run typecheck`, `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`, `npx eslint src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`, and `npm run test:analytics` all passed; dev server route still returned HTTP 200.
  - Second visual refinement: `npm run typecheck`, `npx vitest run src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`, `npx eslint src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx src/features/urbanAnalytics/__tests__/UrbanEvidenceTray.test.tsx`, and `npm run test:analytics` all passed; dev server route returned HTTP 200.
- Risks:
  - Map action focuses layer IDs by reference; if Map Explorer no longer has the layer loaded, the tray still preserves the reference but cannot reconstruct the layer payload. Prompt 17 should handle publication/validation of Urban evidence to map layers.
  - Dashboard action depends on an existing binding ID resolving in `src/features/dashboard/dataBindings.ts`; Prompt 21 should formalize dashboard binding artifacts and scenario outputs.
- Next recommended prompt: Prompt 12 - Indicator Catalog V2 Metadata Traceability.

### Prompt 10 - Right Panel Scientific Dossier

- Date: 2026-05-08
- Agent: Codex GPT-5
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/rightPanelRegistry.ts`
  - `src/features/urbanAnalytics/rightPanelTypes.ts`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/methodValidity.ts`
  - `src/features/urbanAnalytics/context/dataFitness.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `src/stores/usePanelBridgeStore.ts`
  - `package.json`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- Summary: |
  Added a Prompt 10 scientific dossier adapter and upgraded the right panel while preserving the four-tab structure. The panel now derives method capability/readiness/metadata status from `validateUrbanMethodMetadata()`, renders validity envelope rows, required inputs, assumptions, limitations, failure modes, interpretation warnings, misuse warnings, and ethical guardrails. Missing validity metadata is shown as unknown/needs-context, never as ready.

  Data tab now separates formal required inputs from authored/section-derived data guidance and surfaces the most recent card-linked `UrbanDataFitnessProfile` when an artifact provides one. If no card-linked fitness exists, the panel says data fitness is not evaluated and keeps score/grade unknown.

  Code tab now shows a lightweight reproducibility preview containing method id, capability, readiness, evidence artifact ids, and linked code artifact count, plus existing authored/fallback snippets. No IDE generation action was added because Prompt 18 owns code artifact generation; only copy/navigation/report actions with real handlers are enabled.

  Evidence and References tab now lists direct card-linked evidence artifacts from `useUrbanEvidenceArtifacts()` with QA state, lifecycle state, source module, layer/file refs, and Open Flow when an artifact carries a flow id. References distinguish card-specific citations from general fallback references.
- Evidence/provenance changes: Right panel reads existing `UrbanEvidenceArtifact` references only; no artifact mutation, persistence, or heavy payload copying added.
- Data fitness or QA changes: Data fitness scoring helpers unchanged. UI now renders card-linked `UrbanDataFitnessProfile` status/grade/score/issues and unknown state when absent.
- Method validity changes: Method validity contracts unchanged. UI now resolves validity through existing `validateUrbanMethodMetadata()` and exposes missing metadata truthfully.
- Contract changes: None. Existing `synapse:navigate`, `note/applyPatch`, `usePanelBridgeStore.recordInsertedCard()`, and `useUrbanContextStore.evidenceArtifacts` are consumed; no new cross-module event or store contract introduced.
- UX changes:
  - Four tabs relabeled to `Methodology`, `Data Fitness`, `Code & Repro`, and `Evidence & Refs`.
  - Header status strip now shows capability, readiness, metadata, card-linked evidence count, data fitness state, active scale, and total registry count where available.
  - Footer actions are disabled when their underlying copy/report/print/code content is unavailable; related workflow actions render only when a real flow mapping exists.
- Scientific integrity notes:
  - Missing metadata remains unknown and visible.
  - General fallback references are labeled separately from card-specific citations.
  - No fake citations, fake QA, fake readiness, fake workflow success, or fake IDE code generation state was introduced.
- Validation:
  - `npm run typecheck` — Passed (exit 0, 0 errors).
  - `npx vitest run src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx` — Passed, 3/3 tests.
  - `npm run test:analytics` — Passed, 46/46 files and 971/971 tests.
  - `npx eslint src/features/urbanAnalytics/RightPanelFourBlock.tsx src/features/urbanAnalytics/rightPanelUtils.ts src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx` — Passed (0 errors).
  - Dev server smoke: `http://127.0.0.1:5173/` returned HTTP 200.
- Risks:
  - Evidence links are intentionally limited to direct card/artifact matches (`cardId`, `sourceId`, `provenance.methodId`, `linkedArtifactIds`). Prompt 11 should provide a broader tray/filtering surface rather than overloading the dossier.
  - Only the representative metadata subset from Prompt 06 has full validity envelopes; cards without envelopes show unknown metadata.
- Next recommended prompt: Prompt 11 - Evidence Tray and Provenance Surface.

### Prompt 09 - Rail Search, Filters, and Recommendations

- Date: 2026-05-10
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Files inspected:
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/lib/tagGroups.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
- Files changed:
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
- Summary: |
  **Fuse search enrichment**: Added `summary` (0.1), `methodology` (0.08), `tools` (0.06), `datasets` (0.06) as Fuse.js search keys alongside the existing `title` (0.8) and `tags` (0.2). Threshold unchanged (0.38). Now searches across method text and linked resources.

  **Metadata filter panel**: Added collapsible "Method Filters" panel (collapsed by default) with three filter groups:
  - **Scale** — chip per `UrbanScale` value present in current card set. Active project scale (from `useUrbanContextSummary`) is highlighted with `●` suffix and `meta-ctx` CSS class.
  - **Maturity** — chip per `UrbanMethodMaturityLevel` (excludes `unknown`). Chips use abbreviated labels from `MATURITY_SHORT`.
  - **Capability status** — chip per `UrbanMethodCapabilityStatus` present in cards. On-state chips use the cap status color from `CAP_STATUS_CONFIG` as border/text.
  Filters are additive AND within pipeline. Cards without `validityEnvelope` pass all metadata filters (truthful fallback — metadata unknown ≠ excluded).

  **Context-aware ranking**: When `useUrbanContextSummary().scale` returns an active scale, `finalCards` is sorted to put cards whose `validityEnvelope.validSpatialScales` includes the active scale first. Fallback alphabetical sort. Not a hard filter — all cards remain visible.

  **Boost indicator**: `RailItemMeta` now accepts `boosted?: boolean` and `activeScale?: UrbanScale`. When boosted, renders a compact `↑ {scale}` amber badge (`.rail-item-boost`) after the affordance counts.

  **Warning/dim styling**: Cards with `capabilityStatus === 'residual_gap'` get `is-warning` class (title tinted red-mix). Cards with `capabilityStatus === 'deferred'` get `is-dim` class (opacity 0.45, restored on hover). Item `title` attribute provides plain-text explanation.

  **Constants moved**: `CAP_STATUS_CONFIG`, `MATURITY_SHORT`, `SCALE_SHORT` relocated from after `RailItemMeta` to before `RailContainer` so they can be referenced in filter panel render.

  **Reset button**: Now also triggered by `hasMetaFilters`. `handleResetSearch` calls `clearMetaFilters()`.

- UX changes:
  - New "Method Filters" toggle button in header filter bar
  - Collapsible metadata filter panel with Scale / Maturity / Status chip groups
  - Active project scale highlighted in scale filter with `●` indicator
  - Context hint strip at bottom of metadata filter panel when active scale exists
  - Boost badge `.rail-item-boost` on RailItemMeta for context-matched cards
  - `is-warning` title tint for residual_gap cards
  - `is-dim` opacity reduction for deferred cards
- Scientific integrity notes:
  - Cards without validity envelope are NOT excluded by metadata filters — unknown metadata is never treated as blocked.
  - Context ranking is a sort boost, not a hard filter — deferred/blocked methods remain visible with explanation.
  - No synthetic readiness claims introduced.
- Validation: typecheck clean (exit 0, 0 errors); 970/970 vitest tests passing.
- Risks: None identified. Only 1 card currently has a validity envelope (`ss-morans-i`) so metadata filters/boost will be largely no-ops until more envelopes are added in later prompts.
- Next recommended prompt: Prompt 10 - Right Panel Scientific Dossier.

Use this format for each entry:

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Files inspected:
- Files changed:
- Summary:
- Evidence/provenance changes:
- Data fitness or QA changes:
- Method validity changes:
- Contract changes:
- UX changes:
- Scientific integrity notes:
- Validation:
- Risks:
- Next recommended prompt:
```

### Prompt 08 - Left Rail Research Navigator Metadata

- Date: 2026-05-09
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Started from:
  - Active prompt: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 08
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/methodValidity.ts`
  - `src/features/urbanAnalytics/seeds/index.ts`
  - `src/features/urbanAnalytics/seeds/spatialStats.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
- Summary: |
  Added `RailItemMeta` sub-component to `RailContainer.tsx` that renders a compact scientific metadata row beneath each rail card title when a `validityEnvelope` is present on the card.

  The metadata row contains three slots:
  1. **Capability status** — a 5px colored dot (green=implemented, amber=demo, red=gap, sky=env-dep, muted=deferred) followed by a short label, set via CSS custom property `--rim-cap-color`.
  2. **Text descriptor** — method family (hyphen-separated words), maturity level (abbreviated: ref/est/emrg/exp/teach), and top 2 recommended/valid spatial scales, joined with `·` separators.
  3. **Affordance counts** — inline `Nd Nt Nc` notation for datasets, tools, and evidence citations where count > 0, tinted amber.

  Truthful fallback: when `card.validityEnvelope` is `undefined`, `RailItemMeta` returns `null` — no placeholder strip, no false metadata. Currently only `ss-morans-i` carries a full validity envelope (from the Prompt 06 preset in `methodValidity.ts`), so only that card shows the metadata row.

  Updated `.urban-rail__itemBtn` CSS from single-axis `align-items: center` to `flex-direction: column; align-items: flex-start` to stack title and meta row. Added `.urban-rail__itemTitle` for title overflow ellipsis. Changed `.urban-rail__item` from `align-items: center` to `align-items: flex-start` so the favorite star tracks the top of multi-line items.

  Added CSS section `.rail-item-meta`, `.rail-item-cap` (with `::before` dot), `.rail-item-text`, `.rail-item-afford`.

  Imported `UrbanMethodCapabilityStatus`, `UrbanMethodMaturityLevel`, `UrbanScale` from `../lib/types`. All three typed maps (`CAP_STATUS_CONFIG`, `MATURITY_SHORT`, `SCALE_SHORT`) are fully exhaustive records — TypeScript will error if future union members are added without updating them.
- Evidence/provenance changes: None.
- Data fitness or QA changes: None.
- Method validity changes: None. Validity envelopes already created in Prompt 06; this prompt only reads them for display.
- Contract changes: None. `RailItemMeta` is a rail-local sub-component; no cross-module contract added.
- UX changes:
  - Rail items with a validity envelope show a compact single-line metadata row under the title.
  - Rail items without a validity envelope are visually unchanged (truthful fallback = no row).
  - Favorite star re-aligns to `flex-start` on items with metadata rows, which looks correct for both single-line and two-line items.
  - All existing keyboard navigation, search, favorites, section filter, and tag filter behavior is unchanged.
- Scientific integrity notes:
  - Missing metadata does not produce a false readiness signal. `RailItemMeta` returns null when no envelope is present.
  - Capability status is always sourced from `env.capabilityStatus` — the same authoritative field used by `validateUrbanMethodMetadata()`.
  - `demo_mode` renders with an amber dot; it is not styled identically to `implemented`.
- Validation:
  - `npm run typecheck` — passed, exit 0, 0 errors.
  - `npm run test:analytics` — passed, 46 test files, 970/970 tests.
- Risks:
  - Only `ss-morans-i` has a validity envelope today. As future prompts add envelopes to more seeds, the metadata row will appear automatically with no further changes to `RailContainer`.
  - `SCALE_SHORT` and `MATURITY_SHORT` are fully-exhaustive typed records; any new union values added to `UrbanScale` or `UrbanMethodMaturityLevel` in `types.ts` will cause a TypeScript compile error that forces an update here.
- Next recommended prompt: Prompt 09 - Rail Search, Filters, and Recommendations.

---

### Prompt 07 - Premium Modal Shell and Context Strip

- Date: 2026-05-09
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Started from:
  - Active prompt: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 07
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/centerpanel/UrbanContextStrip.tsx`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Added `UrbanModalContextBar` — a compact, context-store-connected pill row rendered between the modal header and the three-panel shell. The bar shows Study Area, Scale, Flow, Layers count, Run, Evidence count, Data Fitness status (ok/warning/blocked), Sync state, and stale-reference warnings.

  Added `useUrbanContextSummary()` hook to `useUrbanContextStore.ts` as the official structured context summary contract for this and future surfaces (Notes tab, reporting, dashboard). The hook derives `fitnessStatus` from evidence artifacts that carry a `dataFitness` profile, computes `syncState` (`synced` | `stale` | `none`), and returns a stable plain-data shape — not UI pill types — to avoid centerpanel/urbanAnalytics coupling.

  Updated `UrbanAnalyticsModal` grid from `'auto 1fr 68px'` to `'auto auto 1fr 68px'` to add the context bar row without affecting header or bottom bar layout. The context bar returns `null` when no context, evidence, or restore warnings are present, so the extra grid row collapses and no idle placeholder strip is ever shown.

  `CtxPill` is an inline sub-component with three severity levels (ok = green, med = amber, high = red) using CSS custom property-compatible inline style. Not exported; modal-local only.
- Evidence/provenance changes: None. No evidence artifacts are created or mutated by the context bar.
- Data fitness or QA changes: None. Fitness status is derived from existing `UrbanEvidenceArtifact.dataFitness` profiles via read-only selector.
- Method validity changes: None.
- Contract changes:
  - NEW: `useUrbanContextSummary()` hook in `useUrbanContextStore.ts` — stable structured summary; contract for all future context strip surfaces.
  - NEW: `UrbanContextSummary` interface and `UrbanContextFitnessStatus` type exported from `useUrbanContextStore.ts`.
- UX changes:
  - Modal context bar visible only when active analytical session exists (non-null context, warnings, or evidence).
  - Premium dense pill display: amber/green/red severity encoding; thin separator from shell below.
  - No decorative chrome or idle placeholder rendered when no analytical state is loaded.
- Scientific integrity notes:
  - `fitnessStatus` is derived only from artifacts that carry a `dataFitness` profile. Returns `null` when no fitness data is available — never claims readiness from absence of evidence.
  - Stale restore warnings are displayed truthfully as "N refs missing" with full message detail in the title attribute.
  - `syncState: 'stale'` is set when restore warnings exist; no false `synced` label is shown for sessions with missing references.
- Validation:
  - `npm run typecheck` — passed, exit 0, 0 errors.
  - `npm run test:analytics` — passed, 46 test files, 970/970 tests.
- Risks:
  - Only Study Area / Scale / Flow / Layers / Run / Evidence / Fitness / Sync / Stale are shown. Additional context fields (AOI, selected indicators, code artifact) can be added as future prompts require them.
  - `UrbanContextStrip` in `centerpanel/tabs/Note.tsx` still builds pills from local prop data; wiring it to `useUrbanContextSummary()` is deferred to the prompt that owns the Notes panel.
- Next recommended prompt: Prompt 08 - Left Rail Research Navigator Metadata.

---

### Prompt 06 - Method Validity Envelope and Capability Metadata

- Date: 2026-05-07
- Agent: Codex
- Status: completed
- Started from:
  - Active prompt: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 06
  - Helper: `scripts/get-next-urban-analytics-prompt.ps1`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` sections 4.2, 4.5, 7.1, 19.4, 22, 23.2, 23.5
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 06
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/seeds/index.ts`
  - `src/features/urbanAnalytics/seeds/spatialStats.ts`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`
  - `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
  - `src/features/urbanAnalytics/lib/tagGroups.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
  - `src/centerpanel/Flows/workflowExperience.ts`
  - `src/centerpanel/Flows/__tests__/flows.test.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/methodValidity.ts`
  - `src/features/urbanAnalytics/seeds/index.ts`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/centerpanel/Flows/flowLibraryMeta.ts`
  - `src/centerpanel/Flows/workflowExperience.ts`
  - `src/features/urbanAnalytics/__tests__/urbanMethodValidity.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Added the Prompt 06 method validity contract: `UrbanMethodValidityEnvelope`, `UrbanMethodCapabilityStatus`, readiness/maturity/family/data-type/geometry/temporal supporting types, and optional metadata fields for method cards, indicator definitions, and workflow metadata.

  Added `src/features/urbanAnalytics/context/methodValidity.ts` with:
  - representative envelope presets for `card:ss-morans-i`, `indicator:modeSplit`, and `flow:accessibility`
  - `applyUrbanMethodValidityPreset()`
  - `getUrbanMethodValidityEnvelopePreset()`
  - `requireUrbanMethodValidityEnvelopePreset()`
  - `createUnknownUrbanMethodValidityEnvelope()`
  - `resolveUrbanMethodValidityEnvelope()`
  - `validateUrbanMethodMetadata()`
  - `validateUrbanMethodValidityEnvelope()`

  Existing cards without metadata are not mutated into false readiness. They validate as `missing`, receive a conservative fallback envelope with `capabilityStatus: "residual_gap"`, and return `readinessStatus: "needs-context"`.
- Evidence/provenance changes: None. Prompt 06 stores method metadata only; no evidence payload, GeoJSON, raw rows, or render state is duplicated.
- Data fitness or QA changes: None. Prompt 05 data fitness contracts remain unchanged.
- Method validity changes:
  - NEW: method validity envelope and capability metadata types.
  - NEW: capability statuses: `implemented`, `demo_mode`, `residual_gap`, `environment_dependent`, `deferred`.
  - NEW: validation helpers for complete, partial, and missing method metadata.
  - NEW: truthful fallback defaults for unannotated methods.
  - NEW: representative metadata applied to one method card, one indicator, and one workflow.
- Contract changes:
  - `Card` can carry `validityEnvelope` and `capabilityStatus`.
  - `IndicatorCatalogDefinition` can carry `validityEnvelope` and `capabilityStatus`.
  - `FlowLibraryItem` and `WorkflowExperienceMeta` can carry `validityEnvelope` and `capabilityStatus`.
- UX changes: None. No visible interface changed in Prompt 06.
- Scientific integrity notes: Missing validity metadata is not treated as ready. Capability status is explicit, and demo/deferred/residual/environment-dependent methods cannot be silently presented as fully implemented by downstream surfaces.
- Validation:
  - `npx vitest run src/features/urbanAnalytics/__tests__/urbanMethodValidity.test.ts src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts src/centerpanel/Flows/__tests__/flows.test.ts` — passed, 3 files, 49/49 tests.
  - `npm run typecheck` — passed, exit 0, 0 errors.
  - `npx eslint src/features/urbanAnalytics/lib/types.ts src/features/urbanAnalytics/context/methodValidity.ts src/features/urbanAnalytics/seeds/index.ts src/features/urbanAnalytics/indicators/types.ts src/features/urbanAnalytics/indicators/catalog.ts src/centerpanel/Flows/flowLibraryMeta.ts src/centerpanel/Flows/workflowExperience.ts src/features/urbanAnalytics/__tests__/urbanMethodValidity.test.ts` — passed, 0 errors, 0 warnings.
- Risks:
  - Only a small representative subset is annotated by design. Prompt 07+ UI should render missing metadata truthfully, and a later migration can expand presets across the full library.
  - Readiness currently reflects metadata completeness and capability status only; Prompt 15 should combine it with live context/data fitness before gating workflow execution.
- Next recommended prompt: Prompt 07 - Premium Modal Shell and Context Strip.

---

### Prompt 05 - Data Fitness and QA Profile Foundation

- Date: 2026-05-07
- Agent: Codex
- Status: completed
- Started from:
  - Active prompt: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 05
  - Helper: `scripts/get-next-urban-analytics-prompt.ps1`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 10 Scientific QA and Truthfulness
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` sections 7.3, 10.3, 19.3, 23.1, 23.3
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 05
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/indicators/types.ts`
  - `src/features/urbanAnalytics/indicators/shared.ts`
  - `src/features/urbanAnalytics/indicators/catalog.ts`
  - `src/features/urbanAnalytics/calculators/morphology.ts`
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/MapEngineAdapter.ts`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/services/map/__tests__/MapScientificQA.test.ts`
  - `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/dataFitness.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/__tests__/urbanDataFitness.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented: |
  Added `UrbanDataFitnessProfile` and supporting status/grade/issue/dimension types. The profile covers geometry validity, CRS availability, temporal coverage, missingness, scale suitability, license/source status, sample size/feature count, field availability, uncertainty notes, blocked reasons, and missing input lists.

  Added `src/features/urbanAnalytics/context/dataFitness.ts` with conservative, store-agnostic helpers:
  - `computeUrbanDataFitnessProfile()`
  - `extractUrbanDataFitnessLayerFromMapLayer()`
  - `extractUrbanDataFitnessLayerFromMapOutput()`

  The helper consumes lightweight layer/run metadata and optional `MapScientificQAState`. Missing metadata produces `unknown` with `score: null`; invalid geometry, CRS mismatch, scale mismatch, empty/insufficient sample, or missing required fields produce `blocked`. Known warning conditions remain warnings rather than being hidden.

  Connected Prompt 05 to Prompt 04 by adding optional `dataFitness?: UrbanDataFitnessProfile` to `UrbanEvidenceArtifact`, and to evidence artifact draft/update helpers.
- UX changes: None. No visible UI changed.
- Scientific integrity notes: Unknown metadata is never treated as ready. No helper creates fake CRS, fake feature counts, fake field lists, fake temporal coverage, fake license clearance, or fake missingness rates. Helper output stores only summaries/references/notes; it does not persist source GeoJSON, map rendering state, raw rows, or table previews.
- Evidence/provenance changes:
  - `UrbanEvidenceArtifact` can now carry optional `dataFitness`.
  - Evidence helper registration/update preserves or removes data fitness profiles explicitly.
- Data fitness or QA changes:
  - NEW: `UrbanDataFitnessStatus = "ready" | "warning" | "blocked" | "unknown"`
  - NEW: `UrbanDataFitnessProfile`
  - NEW: conservative scoring and profile helpers.
  - NEW: unit tests proving missing metadata is `unknown`, invalid geometry and missing fields are `blocked`, complete metadata can be `ready`, and Map Explorer layer extraction does not copy source data.
- Method validity changes: None. Prompt 06 owns method validity envelopes and capability metadata.
- Contract changes:
  - NEW: Urban Analytics data fitness profile contract in `src/features/urbanAnalytics/lib/types.ts`.
  - NEW: Map Explorer layer metadata adapter `extractUrbanDataFitnessLayerFromMapLayer()` consumes existing `OverlayLayerConfig` and `MapScientificQAState` by reference only.
  - NEW: Completed-run/map-output metadata adapter `extractUrbanDataFitnessLayerFromMapOutput()` derives feature count/field names from available output payloads for scoring only; the profile stores IDs/counts/fields, not GeoJSON.
- Validation:
  - `npx vitest run src/features/urbanAnalytics/__tests__/urbanDataFitness.test.ts src/features/urbanAnalytics/__tests__/urbanEvidenceArtifacts.test.ts src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts src/services/map/__tests__/MapScientificQA.test.ts src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts` — passed, 5 files, 49/49 tests.
  - `npm run typecheck` — passed, exit 0, 0 errors.
  - `npx eslint src/features/urbanAnalytics/lib/types.ts src/features/urbanAnalytics/context/dataFitness.ts src/features/urbanAnalytics/context/evidenceArtifacts.ts src/features/urbanAnalytics/__tests__/urbanDataFitness.test.ts src/features/urbanAnalytics/__tests__/urbanEvidenceArtifacts.test.ts src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts` — passed, 0 errors, 0 warnings.
- Risks:
  - Scale suitability is only `ready` when callers provide `analysisScale` and source/layer scale metadata; otherwise it is `unknown`. Prompt 06/15 should pass method-specific scale requirements instead of relaxing this.
  - Missingness is only scored when missing/total counts are supplied; otherwise it stays `unknown`.
- Next recommended prompt: Prompt 06 - Method Validity Envelope and Capability Metadata.

---

### Prompt 04 - Evidence Artifact Model Foundation

- Date: 2026-05-07
- Agent: Codex
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - Helper: `scripts/get-next-urban-analytics-prompt.ps1`
  - Manifest: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 9 Shared Artifact Model
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` sections 5.2, 19.2, 20, 21.1
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 04 block
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts`
  - `src/stores/useFlowStore.ts`
  - `src/stores/useCalcStore.ts`
  - `src/services/reporting/types.ts`
  - `src/services/map/MapEngineAdapter.ts`
  - `src/services/map/MapReportHandoffService.ts`
  - `src/types/synapse-workspace.ts`
  - `src/stores/useSynapseWorkspaceStore.ts`
  - `src/utils/synapseEvidence.ts`
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts`
  - `src/features/urbanAnalytics/__tests__/urbanEvidenceArtifacts.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Behavior implemented: |
  Added the Urban Evidence Artifact foundation without migrating every current output. `UrbanEvidenceArtifact`, `UrbanEvidenceProvenance`, `UrbanEvidenceQA`, lifecycle state, source-module vocabulary, and artifact-kind vocabulary are now exported from `src/features/urbanAnalytics/lib/types.ts`.

  Added pure helper/adapter functions in `src/features/urbanAnalytics/context/evidenceArtifacts.ts`: artifact normalization, bounded upsert, lifecycle/QA patching, stale/invalid marking, selectors by context/run/kind/source module, recent sorting, and `createUrbanEvidenceArtifactFromCompletedRun()` for safe compatibility mapping from existing `CompletedAnalysisRun` records.

  Extended `useUrbanContextStore` with an in-memory `evidenceArtifacts` registry and actions: `registerEvidenceArtifact()`, `updateEvidenceArtifactState()`, `linkEvidenceArtifactToContext()`, `markEvidenceArtifactStale()`, and `markEvidenceArtifactInvalid()`. Added selector hooks for evidence by context, run, kind, and source module.
- UX changes: No visible UI changed. Prompt 11 owns evidence tray/provenance UI.
- Scientific integrity notes: Evidence records store stable IDs, references, scalar metadata, provenance, and QA state only. They do not store GeoJSON, raw datasets, preview rows, map render state, snapshots, or generated file bodies. Completed-run compatibility artifacts summarize output counts and link run/layer IDs only; QA defaults to `unvalidated` and does not claim publication readiness.
- Evidence/provenance changes:
  - NEW: `UrbanEvidenceArtifact`
  - NEW: `UrbanEvidenceProvenance`
  - NEW: `UrbanEvidenceQA`
  - NEW: `createUrbanEvidenceArtifactFromCompletedRun()` compatibility adapter
  - NEW: Store-level evidence registry actions and selectors
- Data fitness or QA changes: Added artifact-level QA metadata shape and stale/invalid state handling only. No data fitness scoring was implemented; Prompt 05 owns data fitness profiles.
- Method validity changes: None. Prompt 06 owns validity envelopes.
- Cross-module contract changes:
  - NEW: `UrbanEvidenceArtifact` reference contract can represent method cards, datasets, map layers, indicators, workflow runs, code artifacts, report inserts, dashboard bindings, education links, and QA findings.
  - Compatibility preserved with existing Synapse workspace artifact registry; Urban model is a dedicated Urban Analytics evidence contract and does not replace `.synapse/artifacts.json`.
  - Compatibility preserved with existing `CompletedAnalysisRun`; adapter reads run IDs/output IDs/source layer IDs and does not modify `useFlowStore`.
- Persistence changes: None for evidence artifacts. Prompt 03 context persistence remains unchanged and still stores only `urban.ctx.active`; Prompt 04 registry is in-memory to avoid over-persisting unresolved evidence payloads.
- Accessibility changes: None.
- Validation commands:
  - `npx vitest run src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts src/features/urbanAnalytics/__tests__/urbanEvidenceArtifacts.test.ts`
  - `npm run typecheck`
  - `npx eslint src/features/urbanAnalytics/lib/types.ts src/features/urbanAnalytics/context/evidenceArtifacts.ts src/features/urbanAnalytics/useUrbanContextStore.ts src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts src/features/urbanAnalytics/__tests__/urbanEvidenceArtifacts.test.ts`
- Validation results:
  - Vitest passed: 2 files, 33/33 tests.
  - Typecheck passed: exit 0, 0 errors.
  - ESLint passed: 0 errors, 0 warnings.
- Known risks:
  - Evidence registry has no visible tray yet; Prompt 11 should surface it.
  - Evidence artifacts are intentionally not persisted yet. Future export/session prompts must decide persistence boundaries without copying heavy spatial data.
- Blockers: None.
- Decisions made:
  - `id` is the canonical artifact identity; `artifactId` mirrors the same value to preserve compatibility with earlier plan wording.
  - Completed-run compatibility records are `workflow-run` artifacts with `qa.state = "unvalidated"` and output counts only.
  - The existing mature Synapse artifact model was inspected and preserved; Urban Analytics now has a lightweight domain-specific evidence model rather than replacing the Synapse registry.
- Next recommended prompt: Prompt 05 - Data Fitness and QA Profile Foundation.
- Ledger updated: yes.

---

### Operating Pack Maintenance - Anti-Amnesia Prompt Ladder Layer

- Date: 2026-05-07
- Agent: Codex
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
- Files changed:
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: Added an anti-amnesia and rate-limit operating layer to the Urban Analytics sequential prompt file without removing or shortening existing prompt blocks. The new layer defines durable memory hierarchy, rate-limit reading profiles, compact session bootstrap packet, prior-work recovery checklist, per-prompt execution envelope, durable memory transfer requirements, and a dependency carry-forward matrix for Prompts 00-29.
- Evidence/provenance changes: None in product code.
- Data fitness or QA changes: None in product code.
- Method validity changes: None in product code.
- Contract changes: Documentation-only operating-pack guidance; no runtime contracts changed.
- UX changes: None.
- Scientific integrity notes: The new guidance explicitly keeps ledger and live source as durable truth, requires stale/blocked decisions to be recorded, and prevents chat-only memory transfer.
- Validation:
  - `powershell -ExecutionPolicy Bypass -File scripts\get-next-urban-analytics-prompt.ps1` — passed; helper still returns Prompt 04.
  - `Get-Content DEVELOPMENT_PLANS\URBAN_ANALYTICS_PROMPT_MANIFEST.json -Raw | ConvertFrom-Json` — passed; manifest still contains 30 prompts.
  - `rg -n "^## Prompt [0-9]{2} -" DEVELOPMENT_PLANS\URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` — passed; all 30 prompt headings remain present.
- Risks: None for product code. Future prompt authors should keep this operating layer synchronized if the manifest or ledger protocol changes.
- Next recommended prompt: Prompt 04 - Evidence Artifact Model Foundation.

---

### Prompt 03 - Context Persistence and Restore

- Date: 2026-05-07
- Agent: Codex
- Status: completed
- Started from:
  - Launcher/helper: `scripts/get-next-urban-analytics-prompt.ps1`
  - Active prompt: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 03
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` sections 12 Persistence and Restore, 14 Performance and Data Movement
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` sections 10, 14, 19.5, 25 Phase 1, 28 Migration Rules
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - `package.json`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/centerpanel/SessionPersistence.tsx`
  - `src/stores/useFlowStore.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/stores/useSynapseWorkspaceStore.ts`
  - `src/utils/storage.ts`
  - `src/services/storage.ts`
  - `src/lib/settings/storage.adapter.ts`
  - `src/utils/synapseMemory.ts`
  - `src/App.tsx` persistence and workspace hydration section
- Files changed:
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts`
  - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Summary: |
  Added Prompt 03 persistence directly to the dedicated Urban context store. The store now reads/writes a schema-versioned, lightweight `urban.ctx.active` payload, auto-hydrates from storage when the module loads, exposes explicit `persistContext()`, `restoreContext()`, `validateRestoredContext()`, and `clearRestoreWarnings()` actions, and tracks `restoreWarnings`, `lastPersistedAt`, `lastRestoredAt`, and `storageStatus`.

  The persisted schema is `URBAN_CONTEXT_PERSISTENCE_VERSION = 1` and stores only stable IDs/small metadata: `contextId`, `studyAreaId`, `activeQuestion`, `activeScale`, `activeAoiId`, `activeLayerIds` as IDs only, `selectedIndicatorKinds`, `activeFlowId`, `activeRunId`, `activeCodeArtifactId`, `updatedAt`, and envelope `savedAt`. No GeoJSON, raw datasets, map outputs, map rendering state, screenshots, or analysis payloads are persisted by Urban Analytics.

  Restore now validates known registries when provided and preserves stale references while labeling them with truthful warnings: missing study area, AOI, layer, run, and code artifact. Incompatible future schemas and invalid JSON are reported as errors without deleting the stored payload. Legacy unversioned context payloads are migrated into the current lightweight schema with a warning.
- Evidence/provenance changes: None. Prompt 04 owns evidence artifact model.
- Data fitness or QA changes: None. Prompt 05 owns data fitness and QA profile.
- Method validity changes: None. Prompt 06 owns validity envelopes. Restore validates reference existence only; it does not claim method readiness.
- Contract changes:
  - NEW: `URBAN_CONTEXT_STORAGE_KEY = "urban.ctx.active"`
  - NEW: `URBAN_CONTEXT_PERSISTENCE_VERSION = 1`
  - NEW: `UrbanPersistedContextV1`
  - NEW: `UrbanContextRestoreWarning`, `UrbanContextRestoreWarningCode`, `UrbanContextReferenceRegistry`, `UrbanContextRestoreOptions`, `UrbanContextRestoreResult`, `UrbanContextPersistenceResult`
  - NEW: Pure helpers `buildUrbanContextPersistencePayload()`, `loadPersistedUrbanContext()`, `validateUrbanContextReferences()`
  - EXTENDED: `UrbanContextState` with `restoreWarnings`, `lastPersistedAt`, `lastRestoredAt`, `storageStatus`, `persistContext()`, `restoreContext()`, `validateRestoredContext()`, `clearRestoreWarnings()`
  - NEW selector: `useUrbanContextRestoreWarnings()`
- UX changes: No visible UI changed. Stale restore state is now surfaced through store warnings for Prompt 07+ UI wiring.
- Scientific integrity notes: |
  Restored missing references are not silently deleted or replaced with demo data. They remain in context and receive explicit warning codes. Persistence stores IDs and metadata only; large spatial data remains owned by Map Explorer, workflow engines, or external artifacts.
- Validation:
  - `npx vitest run src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts` — passed, 29/29 tests.
  - `npm run typecheck` — passed, exit 0, 0 errors.
  - `npx eslint src/features/urbanAnalytics/useUrbanContextStore.ts src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts` — passed, 0 errors, 0 warnings.
  - Manual browser reload smoke was not run; reload behavior is covered by the dynamic module re-import test that seeds `localStorage` before importing the store.
- Risks:
  - `restoreWarnings` are store-level only until Prompt 07 wires the premium modal/context strip. This is intentional for Prompt 03 and prevents premature UI churn.
  - Reference validation depends on callers passing known registries. When no registry is supplied, restore hydrates context without guessing whether an ID still exists.
- Next recommended prompt: Prompt 04 - Evidence Artifact Model Foundation.

---

### Prompt 02 - Urban Analysis Context Kernel Types and Store

- Date: 2026-05-07
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
  - Architecture map: Prompt 01 entry (above)
- Files inspected:
  - `src/features/urbanAnalytics/lib/types.ts` (full — confirmed UrbanScale, UrbanIndicatorKind, AnalyticalFlowId all present; Card shape, CompletedAnalysisRun tail)
  - `src/features/urbanAnalytics/store.ts` (full — UrbanStoreState, all actions; confirmed clean separation from context)
  - `src/centerpanel/UrbanContextStrip.tsx` (full — KvPill, UrbanInfoMode, UrbanContextStripProps; context strip consumes pills not raw store state)
  - `src/stores/__tests__/useFlowStore.test.ts` (full — learned test pattern: getState(), getInitialState(), beforeEach reset)
  - `src/stores/useFlowStore.ts` (top — confirmed create() pattern, getInitialState export)
- Files changed:
  - `src/features/urbanAnalytics/lib/types.ts` — Added `UrbanAnalysisContext` interface after `CompletedAnalysisRun` with full JSDoc, planned-consumers list, and all 11 required fields.
  - `src/features/urbanAnalytics/useUrbanContextStore.ts` — Created new dedicated Zustand store with: `UrbanContextState` interface, `makeEmptyContext()` factory, all 8 store actions, 12 fine-grained per-field selector hooks.
  - `src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts` — Created 20 unit tests across 8 describe groups covering all actions, guard conditions, and immutability.
- Summary: |
  Urban Analysis Context Kernel is now a typed, testable, and well-documented scientific state contract. The context lives in a dedicated Zustand store separate from the navigation/selection store (`useUrbanStore`) to preserve clean separation of concerns. All fields specified in the prompt are present. No UI behavior was changed. 20/20 tests pass, typecheck clean.
- Evidence/provenance changes: None — foundation type only.
- Data fitness or QA changes: None — foundation type only.
- Method validity changes: None — foundation type only.
- Contract changes:
  - NEW: `UrbanAnalysisContext` type exported from `src/features/urbanAnalytics/lib/types.ts`
  - NEW: `useUrbanContextStore` exported from `src/features/urbanAnalytics/useUrbanContextStore.ts` — primary contract for all future context consumers.
  - NEW: Per-field selector hooks exported from `useUrbanContextStore.ts`: `useUrbanContext`, `useHasUrbanContext`, `useUrbanContextId`, `useUrbanStudyAreaId`, `useUrbanActiveQuestion`, `useUrbanActiveScale`, `useUrbanActiveAoiId`, `useUrbanActiveLayerIds`, `useUrbanSelectedIndicatorKinds`, `useUrbanActiveFlowId`, `useUrbanActiveRunId`, `useUrbanActiveCodeArtifactId`, `useUrbanContextUpdatedAt`.
- UX changes: None. No UI components modified.
- Scientific integrity notes: Context starts as `null` — no analytical context is implied until explicitly created. All fields that reference external resources (AOI, layers, run, code artifact) default to null or empty array, not fake defaults. `updatedAt` is always set to the real wall-clock ISO timestamp at mutation time.
- Validation:
  - `npm run typecheck` — exit 0, 0 errors.
  - `npx vitest run src/features/urbanAnalytics/__tests__/useUrbanContextStore.test.ts` — 20/20 tests passed.
- Risks:
  - Resolved by Prompt 03: Context persistence uses the `urban.ctx.` namespace and persists bounded lightweight IDs/metadata only. Prompt 03 persisted `activeLayerIds` as IDs to support required missing-layer restore warnings; no layer payloads, GeoJSON, raw datasets, or map rendering state are persisted.
  - `useUrbanContextStore` does not call `getInitialState()` because Zustand's `create()` with in-memory state does not expose it by default; tests use `setState({ context: null })` instead. If a hard reset is needed in future, add a `_getInitialState` helper.
  - `UrbanContextStrip` currently receives pill data as props — Prompt 07 will need to wire the context store to it. The KvPill interface is already there; wiring is scoped to Prompt 07.
- Next recommended prompt: Prompt 03 - Context Persistence and Restore.

---

### Prompt 01 - Urban Architecture Map and Scientific Ownership Boundaries

- Date: 2026-05-07
- Agent: GitHub Copilot (Claude Sonnet 4.6)
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` (full — all render sections, state, keyboard, events, Map Explorer integration)
  - `src/features/urbanAnalytics/store.ts` (full — UrbanStoreState interface, all actions, visibleCards, persistence)
  - `src/features/urbanAnalytics/rail/RailContainer.tsx` (full — Fuse.js search, persistence, section/tag filters)
  - `src/features/urbanAnalytics/rightPanelRegistry.ts` (full — RIGHT_PANEL_REGISTRY builder)
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx` (top section — 4-tab structure, TAG_FLOW_MAP, assembleFourBlock import)
  - `src/features/urbanAnalytics/rightPanelUtils.ts` (full — LS_KEYS, sanitizeHtml, assembleFourBlock, APA, page-doc)
  - `src/features/urbanAnalytics/lib/types.ts` (full — all primitives, Card, UrbanTag, UrbanIndicatorKind, AnalyticalFlowId, SectionId, IndicatorResult, AnalysisSession, StudyArea, AnalysisMapOutputBridge, SpatialStatsMapOutputBridge, visualization specs)
  - `src/features/urbanAnalytics/lib/sectionHierarchy.ts` (full — 8-group SECTION_TREE, SECTION_INDEX, resolveSectionFilter)
  - `src/features/urbanAnalytics/indicators/catalog.ts` (full — INDICATOR_CATALOG_GROUPS, INDICATOR_CATALOG, all query/compute helpers)
  - `src/features/urbanAnalytics/indicators/types.ts` (IndicatorCatalogDefinition, ComputedIndicatorRecord, IndicatorCatalogFocusRequest)
  - `src/centerpanel/Flows/flowLibraryMeta.ts` (full — FLOW_LIBRARY_ITEMS with category, analysisFocus, whatYouDocument, boundary for all 22 flows)
  - `src/centerpanel/Flows/workflowExperience.ts` (full — WorkflowJourneyId, WORKFLOW_JOURNEYS, WORKFLOW_EXPERIENCE per-flow metadata)
  - `src/stores/useFlowStore.ts` (full — FlowState, FlowActions, startFlow, nextStep, completeFlow, upsertCompletedRun, legacy compat)
  - `src/stores/usePanelBridgeStore.ts` (full — FLOW_TAG_MAP, SLOT_TAG_MAP, all actions)
  - `src/stores/useMapExplorerStore.ts` (top section — store type, DEFAULT_VIEWPORT, layout preferences)
  - `src/services/reporting/types.ts` (full — ReportTemplateId, ReportSectionKind, all block types)
  - `src/services/analytics/urbanToIdeHandoff.ts` (top section — 8 subscribed bus events, staged-scaffold contract)
- Files changed: None. Prompt 01 is architecture-inspection only.
- Summary: |
  Complete urban architecture map constructed from live source files. All component ownership boundaries, state shapes, data-flow paths, and cross-module contracts are now documented below. No product code was changed.

---

