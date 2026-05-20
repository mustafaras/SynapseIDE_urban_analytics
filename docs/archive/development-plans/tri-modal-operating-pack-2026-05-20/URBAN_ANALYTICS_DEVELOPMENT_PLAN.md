# SynapseCore Urban Analytics Development Plan

Date: May 2, 2026  
Scope: Urban Analytics Workbench module, with explicit synchronization contracts for Synapse IDE and Map Explorer  
Status: Planning document for the next premium development cycle

## 1. Executive Intent

The Urban Analytics Workbench is already a broad browser-first spatial intelligence platform. The next development cycle should not replace its architecture. It should elevate the existing module into a premium scientific cockpit where every method, dataset, map layer, code artifact, indicator, workflow run, dashboard, and report insertion behaves as part of one synchronized evidence system.

The target product standard is:

- Research-grade enough for urban analytics teaching, exploratory planning analysis, spatial diagnostics, and reproducible scenario review.
- Professional enough for planners, GIS analysts, researchers, and data engineers to trust the interface under repeated daily use.
- Modular enough to keep the existing IDE shell, Urban Analytics modal, Map Explorer modal, report builder, dashboard, education module, and worker engines independent but synchronized.
- Honest enough to separate implemented, demo-mode, environment-dependent, residual-gap, and deferred claims without hiding limitations.

This plan focuses only on Urban Analytics. It prepares the interface boundaries that the later Synapse IDE and Map Explorer enhancement passes can use.

## 2. Repository-Derived Baseline

The current codebase already contains a mature Urban Analytics surface:

- Main modal shell: `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- Urban navigation and knowledge store: `src/features/urbanAnalytics/store.ts`
- Domain type system: `src/features/urbanAnalytics/lib/types.ts`
- Section ontology: `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
- Left rail: `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Right evidence panel: `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- Seed library: `src/features/urbanAnalytics/seeds/*`
- Indicator catalog and calculators: `src/features/urbanAnalytics/indicators/*`, `src/features/urbanAnalytics/calculators/*`
- Analytical workflows: `src/centerpanel/Flows/*`
- Workflow metadata: `src/centerpanel/Flows/flowTypes.ts`, `flowLibraryMeta.ts`, `workflowExperience.ts`
- Map bridge surfaces: `src/stores/useMapExplorerStore.ts`, `src/services/map/MapEngineAdapter.ts`, `MapAnalysisDispatcher.ts`, `MapWorkflowService.ts`, `MapReportHandoffService.ts`, `MapSyncService.ts`
- Cross-panel coordination: `src/stores/usePanelBridgeStore.ts`, `src/stores/useFlowStore.ts`
- IDE insertion bridge: `src/services/editorBridge.ts`, `src/services/editor/bridge.ts`
- Reporting and dashboards: `src/services/reporting/*`, `src/features/dashboard/*`
- Education and methodology explainers: `src/features/education/*`
- Validation governance: `docs/implementation/module-matrix.md`, `docs/release/release-candidate-validation.md`, `docs/release/known-risks-and-limitations.md`

The current release-state documents should remain authoritative for truth claims. This plan is a forward-looking enhancement plan, not a replacement for `module-matrix.md`.

## 3. Product Thesis

Urban Analytics should become the "scientific command layer" between code, geospatial evidence, and planning interpretation.

The user should be able to:

1. Define a study area and analytical question.
2. Select or import relevant datasets.
3. Inspect data fitness, CRS, temporal coverage, and scale suitability.
4. Choose a defensible method or workflow.
5. Run an analysis with explicit assumptions and parameters.
6. Publish spatial outputs to Map Explorer.
7. Generate reproducible code into Synapse IDE.
8. Save the run as an auditable artifact.
9. Insert results into reports, dashboards, and teaching materials.
10. Reopen any result later and understand exactly how it was produced.

## 4. Scientific Design Principles

### 4.1 Evidence Before Visual Polish

Every premium UI improvement must expose better evidence, not only look refined. Beautiful maps, cards, and dashboards are valuable only when they preserve units, source lineage, CRS, scale, method assumptions, uncertainty, and limitations.

### 4.2 Method Transparency

Every analytical method should show:

- What it measures.
- Required inputs.
- Valid spatial scale.
- Formula or algorithm family.
- Key assumptions.
- Failure modes.
- Known limitations.
- Interpretation guidance.
- Literature or standards references.
- Exportable configuration.

### 4.3 Synchronization Without Coupling

Urban Analytics, Synapse IDE, and Map Explorer should synchronize through typed contracts and stores, not through fragile component reach-ins. The existing event surfaces and Zustand stores should be formalized rather than bypassed.

### 4.4 Professional Density

The interface should feel like an operational scientific workbench, not a marketing page. The layout should remain dense, scannable, keyboard-friendly, and restrained. Premium means precision, hierarchy, responsiveness, and reduced friction.

### 4.5 Honest Capability Claims

The UI and docs should continue to distinguish:

- Implemented
- Implemented with demo mode
- Implemented with residual gap
- Environment-dependent
- Deferred

This distinction should appear in user-facing capability metadata where relevant.

## 5. Target Architecture

### 5.1 Urban Analysis Context Kernel

Introduce a shared Urban Analysis Context contract that represents the current analytical state independent of any one panel.

Proposed contract:

```ts
export interface UrbanAnalysisContext {
  contextId: string;
  studyAreaId?: string;
  activeQuestion?: string;
  activeScale?: UrbanScale;
  activeAoiId?: string;
  activeLayerIds: string[];
  selectedIndicatorKinds: UrbanIndicatorKind[];
  activeFlowId?: AnalyticalFlowId;
  activeRunId?: string;
  activeCodeArtifactId?: string;
  updatedAt: string;
}
```

Primary location:

- Add to `src/features/urbanAnalytics/lib/types.ts`
- Store state in either `src/features/urbanAnalytics/store.ts` or a new dedicated `src/stores/useUrbanAnalysisContextStore.ts`

Purpose:

- Urban Analytics knows the current scientific context.
- Map Explorer can publish AOI, layer, and viewport signals into the context.
- Synapse IDE can generate, open, or update code artifacts tied to the current context.
- Reports and dashboards can insert results with provenance.

### 5.2 Evidence Artifact Model

Every meaningful output should become an evidence artifact.

Proposed contract:

```ts
export interface UrbanEvidenceArtifact {
  artifactId: string;
  kind: "method-card" | "dataset" | "map-layer" | "indicator" | "workflow-run" | "code" | "report" | "dashboard";
  title: string;
  sourceModule: "urban-analytics" | "map-explorer" | "ide" | "reporting" | "dashboard" | "education";
  linkedStudyAreaId?: string;
  linkedRunId?: string;
  linkedLayerIds?: string[];
  linkedFilePaths?: string[];
  provenance: UrbanEvidenceProvenance;
  qa: UrbanEvidenceQA;
  createdAt: string;
  updatedAt: string;
}
```

The current `CompletedAnalysisRun`, `MapOutput`, `DataOutput`, and `IndicatorResult` types can be extended gradually rather than replaced.

### 5.3 Synchronization Matrix

| Source | Target | Current mechanism | Planned premium behavior |
|---|---|---|---|
| Urban Analytics | Map Explorer | `useMapExplorerStore`, map output publication | Publish layers with method, parameters, CRS, QA, legend, uncertainty, and report-ready metadata. |
| Map Explorer | Urban Analytics | `MAP_ANALYSIS_DISPATCH_KEY`, selected AOI/layers | Recommend workflows based on selected layer type, AOI geometry, numeric fields, temporal fields, and QA state. |
| Urban Analytics | Synapse IDE | `synapse:editor:insert`, editor bridges | Generate reproducible scripts, notebooks, data manifests, and run configs tied to the selected method or run. |
| Synapse IDE | Urban Analytics | Future file metadata bridge | Detect `.urban.json`, `.geojson`, `.ipynb`, `.py`, and project manifests and surface matching methods. |
| Urban Analytics | Report | indicator insert queue, reporting services | Insert evidence blocks with citations, method assumptions, map figure metadata, and limitations. |
| Urban Analytics | Dashboard | computed indicator bindings | Bind computed indicators and scenario outputs as live dashboard widgets with source-run traceability. |
| Education | Urban Analytics | navigation events | Turn method cards and workflows into teaching steps with inspectable intermediate values. |

## 6. Premium UX Direction

### 6.1 Keep the Three-Panel Modal, Refine the Responsibilities

The current layout is valuable and should remain:

- Left rail: discovery, filtering, ontology, favorites, project-aware recommendations.
- Center panel: project cockpit, workflows, report, dashboard, education, toolbox.
- Right panel: evidence details, methodology, data, code, references.

Planned refinements:

- Replace pure card browsing behavior with a context-aware analytical cockpit.
- Add method maturity badges: Exploratory, Diagnostic, Predictive, Scenario, Policy Support.
- Add data-readiness badges: CRS verified, temporal coverage, geometry validity, missingness, license status.
- Add workflow-readiness checks before launching analysis.
- Add result provenance summaries after every run.
- Improve responsive behavior so the right panel and left rail collapse into drawers without losing keyboard flow.

### 6.2 Left Rail Enhancements

Target files:

- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/rail/rail.css`
- `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
- `src/features/urbanAnalytics/lib/tagGroups.ts`
- `src/features/urbanAnalytics/store.ts`

Planned work:

- Add a "Project Context" filter that ranks methods based on active AOI, active map layers, selected indicators, and active workflow.
- Add method badges for scale, data requirement, maturity, and validation status.
- Add saved method collections per project.
- Add keyboard command affordances for search, section traversal, and opening related workflows.
- Add empty-state guidance that explains what data or context is missing.
- Keep the existing Fuse-based search but enrich the searchable fields with method, assumptions, references, related flows, and required datasets.

Acceptance criteria:

- Search and filters remain fast with the full seed library.
- Favorites and recent views remain persisted.
- Selection does not break existing right-panel rendering.
- `e2e/right-panel-fallbacks.spec.ts` and `e2e/indicator-catalog.spec.ts` remain green.

### 6.3 Center Panel Enhancements

Target files:

- `src/centerpanel/CenterPanelShell.tsx`
- `src/centerpanel/UrbanContextStrip.tsx`
- `src/centerpanel/Flows/FlowHost.tsx`
- `src/centerpanel/Flows/WorkflowCockpit.tsx`
- `src/centerpanel/Tools/*`

Planned work:

- Add an Urban Evidence Overview view that summarizes active project, active AOI, active layers, recent runs, warnings, and next recommended workflows.
- Add context-aware "Run next" suggestions using `workflowExperience.ts`.
- Add a thin Evidence Timeline that lists recent imports, layer publications, indicator computations, workflow runs, code exports, report inserts, and dashboard bindings.
- Add a preflight panel before workflows run: data availability, geometry type, numeric fields, CRS, missingness, temporal coverage, and method suitability.
- Add a post-run review ribbon: result status, uncertainty, map publication, report insertion, dashboard binding, and code export actions.

Acceptance criteria:

- Existing tabs remain: Projects, New Project, Methods, Education, Report, Workflows, Dashboard, Toolbox.
- `synapse:navigate` remains the primary navigation event.
- Map Explorer keyboard shortcut behavior remains intact.
- Current lazy boundaries remain in place.

### 6.4 Right Panel Enhancements

Target files:

- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/rightPanelUtils.ts`
- `src/features/urbanAnalytics/rightPanelRegistry.ts`
- `src/features/urbanAnalytics/rightPanelFourBlock.css`

Current tabs:

- Methodology
- Data Requirements
- Python Code
- References

Planned premium tabs:

- Methodology
- Data Fitness
- Code and Reproducibility
- Evidence and References
- Assumptions and QA

Planned work:

- Add method validity envelope: spatial scale, geometry type, sample-size guidance, required fields, expected output.
- Add limitations and misuse warnings directly next to the workflow launch action.
- Add "Generate reproducible script" action through the IDE bridge.
- Add "Open related layers" and "Publish requirement checklist to Map Explorer" actions.
- Add references with citation export options where supported by the existing reporting citation system.

Acceptance criteria:

- Existing card assembly fallback still works.
- Seed-derived methodology, data, code, and references remain available.
- Empty cards never display placeholder filler.
- Right-panel lazy chunk budget is tracked.

## 7. Scientific Method Roadmap

### 7.1 Indicator System V2

Target files:

- `src/features/urbanAnalytics/indicators/catalog.ts`
- `src/features/urbanAnalytics/indicators/types.ts`
- `src/features/urbanAnalytics/calculators/*`
- `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`

Planned work:

- Add formula cards for every catalog indicator.
- Add units, valid range, scale, input field semantics, and interpretation thresholds.
- Add uncertainty support where indicators aggregate multiple fields.
- Add method references and "do not compare when..." warnings.
- Add computed indicator provenance to project registry, dashboard, and report insertions.
- Add batch compute for selected indicator groups.
- Add project-aware defaults from study area metadata and active map layer fields.

Acceptance criteria:

- All catalog definitions still pass existing schema validation.
- `computeCatalogIndicator` remains deterministic.
- Computed indicator records can be traced from dashboard/report back to inputs.
- `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts` remains the first guard.

### 7.2 Workflow Scientific Hardening

Target files:

- `src/centerpanel/Flows/*Flow.tsx`
- `src/centerpanel/Flows/flowTypes.ts`
- `src/centerpanel/Flows/flowLibraryMeta.ts`
- `src/centerpanel/Flows/workflowExperience.ts`
- `src/stores/useFlowStore.ts`

Planned work:

- Define a shared `WorkflowRunManifest` for all flows.
- Require every flow to serialize parameters, input data references, method config, runtime duration, warnings, and output artifacts.
- Standardize preflight, run, review, publish, export, and report steps.
- Upgrade launch-verified advanced flows to execution-verified where current release docs identify gaps.
- Add sensitivity, uncertainty, or validation panels where methodologically required.
- Add "rerun from manifest" behavior for deterministic workflows.

Proposed manifest:

```ts
export interface WorkflowRunManifest {
  runId: string;
  flowId: AnalyticalFlowId;
  studyAreaId?: string;
  parameters: Record<string, unknown>;
  inputRefs: UrbanDataReference[];
  methodConfig: UrbanMethodConfig;
  outputArtifactIds: string[];
  warnings: UrbanAnalysisWarning[];
  durationMs: number;
  softwareVersion: string;
  createdAt: string;
}
```

Acceptance criteria:

- `CompletedAnalysisRun` remains backward compatible.
- All new workflow outputs are publishable to Map Explorer and reviewable in Completed Run Review.
- Representative E2E journeys validate at least one full run per upgraded workflow family.

### 7.3 Data Fitness and QA Layer

Target files:

- `src/features/urbanAnalytics/lib/types.ts`
- `src/services/data/*`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`

Planned work:

- Define a shared data fitness model:
  - CRS known or missing
  - geometry type
  - geometry validity
  - feature count
  - missing values
  - temporal coverage
  - spatial coverage
  - license/source status
  - resolution and scale suitability
- Surface QA results in Urban Analytics before a workflow starts.
- Persist QA summaries into completed run artifacts.
- Let Map Explorer expose QA back to Urban Analytics when a layer is selected.

Acceptance criteria:

- Missing CRS remains truthfully labeled.
- Workflows do not silently substitute demo data when real data is expected.
- QA messages are plain-language plus technical detail.

## 8. IDE Synchronization Plan

This plan does not redesign Synapse IDE. It defines how Urban Analytics should talk to it.

Target files:

- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- `src/components/editor/MonacoEditor.tsx`
- `src/components/ide/CommandPalette.tsx`
- `src/features/urbanAnalytics/python/*`

Planned actions from Urban Analytics to IDE:

- Generate Python script from selected method card.
- Generate reproducible workflow script from completed run manifest.
- Open `.urban.json` run configuration in a new editor tab.
- Export method card code examples to a named project file.
- Generate data package descriptors for selected datasets.
- Open code at a relevant line when a method maps to a local calculator or engine.

Planned actions from IDE to Urban Analytics:

- Detect supported urban analysis files and offer "Open in Urban Analytics".
- Parse run manifests and restore corresponding workflow review.
- Parse GeoJSON/CSV/Parquet metadata and recommend method cards.
- Link editor files to evidence artifacts.

Acceptance criteria:

- IDE insertion remains non-destructive.
- Generated files use explicit filenames and language modes.
- Large generated code is guarded by existing size checks.
- Urban Analytics never assumes local disk access beyond existing browser-side stores unless the IDE module explicitly provides it.

## 9. Map Explorer Synchronization Plan

This plan does not redesign Map Explorer. It defines the Urban Analytics side of the contract.

Target files:

- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapSyncService.ts`
- `src/centerpanel/components/MapExplorerModal.tsx`

Planned Urban Analytics behaviors:

- Read selected AOI, selected feature IDs, active analysis layers, and current map bounds as workflow inputs.
- Recommend workflows based on active layer geometry and attributes.
- Publish all workflow outputs as map layers with provenance, legend, QA, CRS, and report handoff metadata.
- Bind right-panel method cards to active map layers where tags and fields match.
- Add "Send AOI to workflow" and "Use selected layer as input" actions.
- Add "Map evidence bundle" handoff for report figures.

Acceptance criteria:

- Existing Map Explorer state remains owned by `useMapExplorerStore`.
- Urban Analytics does not persist heavy GeoJSON in its own navigation store.
- Map layer registry events remain the foundation for layer awareness.
- `e2e/map-report-handoff.spec.ts`, `e2e/map-context-and-geojson.spec.ts`, and related Map Explorer tests remain valid.

## 10. Data, Provenance, and Reproducibility

### 10.1 Provenance Extensions

Planned fields for outputs:

- Source dataset IDs and names.
- Input content hash when available.
- CRS and fallback status.
- Geometry type and feature count.
- Method version.
- Parameter set.
- Random seed where relevant.
- Run duration.
- Warnings and exclusions.
- Publication targets.

### 10.2 Reproducible Package Export

Urban Analytics should export a reproducible package containing:

- `manifest.urban.json`
- `inputs.json`
- `parameters.json`
- `methodology.md`
- `outputs.geojson` or `outputs.json`
- `report-snippet.md`
- Optional `analysis.py`

This package can later be surfaced in Synapse IDE as a project folder or virtual file bundle.

### 10.3 Scientific QA Levels

Introduce a QA level vocabulary:

- `draft`: workflow configured but not run
- `computed`: result produced
- `reviewed`: user or reviewer confirmed assumptions
- `report_ready`: required metadata, citations, map figure metadata, and limitations are present
- `publication_blocked`: missing CRS, missing source, invalid geometry, unsupported scale, or unresolved data license

## 11. Premium Visual System Guidance

The existing charcoal and amber design direction should stay. The premium pass should reduce noise and strengthen hierarchy.

### 11.1 Layout

- Keep the three-column workbench on desktop.
- Use resizable rail and right panel widths with minimum constraints.
- Collapse left rail and right panel into drawers on smaller screens.
- Keep the center panel as the primary work surface.
- Do not place cards inside cards.
- Keep repeated items as compact cards with clear metadata rows.

### 11.2 Controls

- Use icon buttons for common tools.
- Use segmented controls for workflow state, method maturity, and QA level.
- Use checkboxes/toggles for binary filters.
- Use sliders or numeric steppers for weights and thresholds.
- Use menus for method variants and classification schemes.
- Use tabs only where content families are genuinely distinct.

### 11.3 Typography and Data Display

- Use compact headings inside panels.
- Use tables for comparable method requirements and dataset checks.
- Use badges sparingly for status, not decoration.
- Make units visible next to every numeric result.
- Preserve readable line lengths in methodology and references.

### 11.4 Motion and Accessibility

- Honor reduced motion.
- Preserve focus traps in the modal.
- Ensure every icon-only action has an accessible label and tooltip.
- Maintain visible focus states across rail, center, right panel, and bottom toolbar.
- Use live regions for workflow status and long-running analysis progress.

## 12. Implementation Phases

### Phase 0: Baseline Protection

Goal: Lock current behavior before enhancement.

Tasks:

- Review current release truth in `module-matrix.md`.
- Add a short Urban Analytics architecture note for the new context kernel.
- Identify large lazy chunks before touching the modal.
- Add targeted tests for current Urban Analytics modal open, selection, and right-panel rendering if coverage is missing.

Deliverables:

- `docs/architecture/urban-analytics-context-kernel.md`
- Test baseline for modal, rail selection, and context bridge.

Validation:

- `npm run typecheck`
- `npm run test -- src/features/urbanAnalytics`
- `npm run perf:budgets`

### Phase 1: Urban Analysis Context Kernel

Goal: Add typed synchronization state without changing visible workflows.

Tasks:

- Add `UrbanAnalysisContext`, `UrbanEvidenceArtifact`, and supporting types.
- Add a dedicated context store or extend the Urban store carefully.
- Bridge active Urban card, active flow, selected indicators, and selected run into context.
- Bridge Map Explorer active AOI/layers into context through selectors and events.
- Expose read-only debug output in development mode.

Deliverables:

- Typed context state.
- Unit tests for context updates.
- No visible UI regression.

Validation:

- Store tests.
- Existing E2E smoke.

### Phase 2: Premium Modal Shell

Goal: Refine the existing three-panel modal into a more polished cockpit.

Tasks:

- Extract inline modal CSS into scoped module or CSS file while preserving visual behavior.
- Add responsive drawer behavior for left and right panels.
- Add top-bar context summary: active study area, active AOI, active layer count, active run status.
- Replace ad hoc action density with a command strip.
- Keep the existing Map Explorer button and close behavior.

Deliverables:

- Cleaner `UrbanAnalyticsModal.tsx`.
- Modal shell style file.
- Responsive layout tests.

Validation:

- `e2e/release-candidate-ui.spec.ts`
- Accessibility E2E.

### Phase 3: Scientific Left Rail

Goal: Make method discovery project-aware and scientifically informative.

Tasks:

- Add method maturity and scale metadata to cards.
- Add data requirement badges.
- Add context-ranked recommendations.
- Add filter chips for method family, spatial scale, output type, and data requirement.
- Add "why recommended" explanations.

Deliverables:

- Updated card metadata model.
- Enhanced rail UI.
- Store selectors for ranked recommendations.

Validation:

- Right-panel fallback tests.
- New rail filter tests.

### Phase 4: Evidence Right Panel

Goal: Turn the right panel into a true scientific evidence surface.

Tasks:

- Add Assumptions and QA panel.
- Add Data Fitness panel.
- Add code generation actions.
- Add citation export or citation handoff where supported.
- Add related map layer and workflow links based on active context.

Deliverables:

- Updated right-panel assembler.
- UX for method validity envelope.
- IDE generation actions.

Validation:

- `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- `e2e/right-panel-fallbacks.spec.ts`

### Phase 5: Workflow Run Manifests

Goal: Standardize reproducible outputs across workflows.

Tasks:

- Add `WorkflowRunManifest`.
- Extend `CompletedAnalysisRun` through backward-compatible optional fields.
- Update priority workflows first: site suitability, accessibility, vulnerability, composite indicator, equity audit, change detection, emerging hot spot.
- Add manifest export and rerun hooks.
- Attach warnings and QA state.

Deliverables:

- Shared manifest builder.
- Updated workflow publication helpers.
- Completed-run review support.

Validation:

- `e2e/analytical-journeys.spec.ts`
- Flow-specific unit tests.

### Phase 6: Indicator Catalog V2

Goal: Make indicators feel like a scientific calculator library, not only a list.

Tasks:

- Add formula, units, valid range, scale, and warning metadata.
- Add batch compute support.
- Add project-aware default values.
- Add exportable indicator computation manifests.
- Add dashboard/report provenance links.

Deliverables:

- Expanded indicator definitions.
- Enhanced indicator catalog panel.
- Traceable computed indicator records.

Validation:

- `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`
- `e2e/indicator-catalog.spec.ts`
- Dashboard binding tests.

### Phase 7: Map-Aware Urban Workflows

Goal: Make Map Explorer selections a first-class workflow input.

Tasks:

- Add active layer suitability detection for each workflow.
- Add AOI prefill from Map Explorer.
- Add field picker suggestions from selected layers.
- Add QA blockers before runs.
- Publish outputs with richer layer metadata.

Deliverables:

- Map-to-workflow preflight.
- Workflow-to-map enriched publication.
- Layer evidence binding.

Validation:

- `e2e/map-context-and-geojson.spec.ts`
- `e2e/map-report-handoff.spec.ts`
- Workflow E2E for at least one AOI handoff.

### Phase 8: IDE Reproducibility Bridge

Goal: Let Urban Analytics generate and reopen reproducible code artifacts.

Tasks:

- Add script generation helpers for selected method cards.
- Add run-manifest to Python template generation.
- Add "Open in IDE" action for code and manifest artifacts.
- Add project file naming conventions.
- Add size guard messaging for generated code.

Deliverables:

- Urban Analytics code artifact service.
- IDE bridge integration.
- Python templates tied to real method metadata.

Validation:

- Editor bridge unit tests.
- Manual smoke in IDE surface.

### Phase 9: 3D, Simulation, and Scenario Coherence

Goal: Make VoxCity, sunlight, CityJSON, CA, facility optimisation, and system dynamics feel like one scenario family.

Tasks:

- Add scenario artifact model.
- Link 2D layer, 3D geometry, simulation output, and report narrative.
- Add scenario comparison handoff for selected workflow outputs.
- Add explicit demo, real-data, and environment-dependent labels.
- Add validation metadata for simulation outputs.

Deliverables:

- Scenario evidence bundle.
- Improved 3D/simulation workflow metadata.
- Scenario dashboard links.

Validation:

- `e2e/voxcity-real-data.spec.ts`
- Simulation engine tests.
- Scenario comparison tests.

### Phase 10: Reporting, Dashboard, and Education Integration

Goal: Make every scientific output reusable across interpretation surfaces.

Tasks:

- Add one-click report blocks from method cards and completed runs.
- Add dashboard widgets from computed indicators and workflow outputs.
- Add education explainers linked to actual workflows and intermediate values.
- Add limitations and citations to all exported narrative blocks.

Deliverables:

- Evidence-to-report handoff.
- Evidence-to-dashboard binding.
- Education traceability links.

Validation:

- `e2e/report-builder.spec.ts`
- `e2e/report-history.spec.ts`
- `e2e/education.spec.ts`
- Dashboard tests.

### Phase 11: Performance, Governance, and Release

Goal: Keep the premium upgrade fast, testable, and honest.

Tasks:

- Preserve lazy boundaries.
- Split large modal/right-panel chunks only where it reduces meaningful load.
- Add budget exceptions only with documented rationale.
- Update module matrix, release validation, and known risks after implementation.
- Keep demo/environment limitations visible.

Deliverables:

- Updated validation records.
- Updated performance report.
- Updated release truth docs.

Validation:

- `npm run validate:rc`
- Targeted E2E for modified workflows.

## 13. Suggested Work Order

Recommended sequence:

1. Context Kernel
2. Modal Shell Cleanup
3. Right Panel Evidence Upgrade
4. Workflow Run Manifest
5. Map-Aware Workflow Inputs
6. IDE Reproducibility Bridge
7. Indicator Catalog V2
8. Scenario/3D Coherence
9. Reporting/Dashboard/Education Integration
10. Release Governance Update

Reasoning:

- The context kernel is the synchronization foundation.
- The shell cleanup reduces friction before visible feature expansion.
- The right panel and manifest work define scientific quality.
- Map and IDE bridges should use the new context and manifest contracts, not invent parallel mechanisms.
- Indicator, scenario, reporting, and education improvements become easier once evidence artifacts exist.

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Urban modal becomes too large. | Extract shell, context, rail, right-panel, and artifact logic into focused modules while preserving lazy boundaries. |
| Synchronization becomes fragile. | Use typed stores, selectors, and events. Avoid component reach-ins. |
| UI becomes visually premium but scientifically shallow. | Require method assumptions, data fitness, provenance, and QA for every premium surface. |
| Map Explorer coupling grows. | Treat Map Explorer as the owner of map state. Urban Analytics consumes typed summaries and publishes enriched outputs. |
| IDE bridge writes unexpected content. | Keep generated code explicit, reversible, named, and size-guarded. |
| Demo data is confused with real analysis. | Label demo mode in method cards, workflows, run manifests, and reports. |
| Existing release tests become noisy. | Add focused tests per phase and keep broad RC validation for release checkpoints. |

## 15. Definition of Done for This Development Cycle

The Urban Analytics premium upgrade is done when:

- A shared Urban Analysis Context exists and is used by Urban Analytics, Map Explorer handoffs, and IDE code generation.
- Method cards expose scientific assumptions, data requirements, validity envelopes, and references.
- Workflows serialize reproducible run manifests.
- Map Explorer selections can seed Urban Analytics workflows.
- Urban Analytics outputs can publish enriched layers to Map Explorer.
- Urban Analytics can generate reproducible scripts/manifests into Synapse IDE.
- Indicators are traceable from computation to dashboard/report.
- Reports include methodology, limitations, citations, and provenance.
- Demo, residual-gap, and environment-dependent states remain visible.
- Typecheck, lint, unit tests, build, performance budgets, and targeted E2E gates pass.

## 16. Immediate Next Prompt Recommendation

The next implementation prompt should not start with UI styling. It should implement Phase 1: Urban Analysis Context Kernel.

Suggested prompt:

```text
Implement the Urban Analysis Context Kernel for the Urban Analytics Workbench.
Add typed context and evidence artifact contracts, create a focused Zustand store, bridge active card, active flow, selected indicator, selected run, Map Explorer active AOI/layers, and IDE code artifact metadata into that store without changing the visible UI. Add unit tests and update architecture docs.
```

## 17. Revision 2: Code-Driven Expansion Scope

This section expands the plan after a broader code-level review of the Urban Analytics module and the adjacent systems it must synchronize with: Synapse IDE, Map Explorer, reporting, dashboarding, education, workflow execution, and VoxCity/3D analytics. The goal is not to replace the current structure. The goal is to turn the existing Urban Analytics modal into a premium scientific workbench while preserving the current component boundaries, lazy loading strategy, store ownership, and event-driven integration style.

The reviewed code surface includes these primary areas:

| Area | Reviewed files and modules | Current role | Upgrade implication |
|---|---|---|---|
| Urban Analytics shell | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`, `store.ts`, `lib/types.ts` | Opens the modal, assembles rail, center panel, right panel, Map Explorer button, library search, favorites, and editor/report/chat actions. | Keep the three-zone structure, but add a context-aware scientific layer and stronger synchronization state. |
| Urban knowledge library | `src/features/urbanAnalytics/seeds/*.ts`, `seeds/index.ts`, `rightPanelUtils.ts` | Builds cards for methodology, indicators, workflows, datasets, VoxCity, vulnerability, monitoring, implementation, and references. | Add stricter metadata, validity envelopes, method readiness, data fitness, and reproducibility fields. |
| Rail and navigation | `src/features/urbanAnalytics/rail/RailContainer.tsx`, `WelcomeModal.tsx` | Provides search, sections, tags, groups, recents, favorites, collapsible navigation, welcome/onboarding. | Upgrade to a research navigator with method clusters, readiness filters, and evidence-aware search ranking. |
| Right panel | `src/features/urbanAnalytics/RightPanelFourBlock.tsx`, `rightPanelUtils.ts` | Shows methodology, data, code, references; can open related flows, send content to report, and record inserted cards. | Turn the four tabs into a scientific dossier with assumptions, prerequisites, reproducible code artifacts, citations, and handoff actions. |
| Indicator catalog | `src/features/urbanAnalytics/indicators/catalog.ts`, `IndicatorCatalogPanel.tsx`, calculators | Computes typed indicators and routes them to report, dashboard, education, and workflows. | Add uncertainty metadata, scale validity, computational lineage, map-layer compatibility, and dashboard/report manifests. |
| Workflow runtime | `src/centerpanel/CenterPanelShell.tsx`, `Flows/FlowHost.tsx`, `flowTypes.ts`, `flowLibraryMeta.ts`, `workflowExperience.ts`, individual flow components | Hosts analytical flows and completed run state; receives Map Explorer dispatches. | Make every flow produce a reproducible run manifest and a shared Urban evidence artifact. |
| Map Explorer bridge | `src/stores/useMapExplorerStore.ts`, `src/services/map/MapAnalysisDispatcher.ts`, `MapEngineAdapter.ts`, `MapWorkflowService.ts`, `MapScientificQA.ts`, `MapSyncService.ts` | Owns map state, analysis layer publishing, QA checks, viewport sync, AOI dispatch, and map workflow previews. | Urban Analytics should consume typed map context and publish typed analysis outputs without owning map state. |
| Map reporting and persistence | `MapReportHandoffService.ts`, `MapPersistenceService.ts`, `MapReviewSessionService.ts`, `MapDataImporter.ts`, `MapDataExporter.ts` | Provides map-to-report sections, project snapshots, review session events, import/export. | Urban evidence artifacts should inherit map provenance, QA, and snapshot references. |
| Reporting | `src/services/reporting/*.ts`, `ReportBuilderPanel.tsx` | Builds report documents, citations, pending inserts, auto narratives, export formats. | Urban Analytics outputs should enter reports as structured sections, not loose text snippets. |
| Dashboard | `src/features/dashboard/*.ts`, `DashboardBuilder.tsx`, `dataBindings.ts`, chart modules | Presents computed indicators, scenarios, comparison dashboards, chart bindings. | Indicators and workflow outputs need dashboard-ready binding descriptors and uncertainty labels. |
| Education | `src/features/education/*.tsx`, learning paths, methodology data, exercise workspace, dataset library | Provides explainers, teaching datasets, learning paths, exercises, instructor dashboard. | Scientific concepts in Urban Analytics should deep-link to methodology explainers and optional exercises. |
| Synapse IDE | `src/services/editorBridge.ts`, `src/services/editor/bridge.ts`, `src/services/editor/aiEditorBridgeGlobal.ts`, `src/components/ide/EnhancedIDE.tsx`, `MonacoEditor.tsx` | Opens tabs, inserts code, replaces selection, maintains file/editor state, handles bridge events. | Urban Analytics should generate named, reversible, provenance-rich code bundles for IDE execution and editing. |
| VoxCity and 3D | `src/features/urbanAnalytics/voxcity/*.tsx`, `voxCityDataBridge.ts`, `BuildingViewer.tsx`, `CityJSONViewer.tsx`, `SunlightSimulatorPanel.tsx` | Supports 3D city data, CityJSON, building visualization, sunlight simulation, and VoxCity data bridging. | Add 2D/3D synchronization contracts and scenario evidence links. |

## 18. Current Architecture Reading

### 18.1 Urban Analytics Modal

`UrbanAnalyticsModal.tsx` is the current command surface for the Urban Analytics experience. It uses `buildFullLibrary()` to inject the card library, `useUrbanStore` for state, lazy right-panel loading, `RailContainer` for navigation, and `CenterPanelShell` for analytical workspace content. It also dispatches global events such as `synapse:chat:insert`, `synapse:editor:insert`, and `synapse:navigate`.

Important observed behavior:

- The modal already has a premium-like shell with top bar, rail, center content, right panel, search, favorites, copy, insert, print, and Map Explorer controls.
- `Ctrl/Cmd + Shift + M` toggles Map Explorer from the modal.
- The modal does not yet maintain a unified research context. Search query, selected card, active section, active tags, and Map Explorer state are distributed across several stores.
- The Insert to Editor behavior currently sends card content as text. It should evolve into a typed code artifact action with filename, language, dependency notes, assumptions, and rollback semantics.
- The Send to Chat behavior is useful but should include active map context, selected method, data fitness, and intended study scale.

Planned improvement:

- Preserve the modal layout and its mental model.
- Add a context kernel that reads current card, active workflow, selected map layers, selected indicator, and editor artifact state.
- Add a premium "research state strip" that shows study area, evidence count, QA status, active method, and synchronization state.
- Upgrade bottom actions to context-aware commands: `Open in IDE`, `Publish to Map`, `Attach to Report`, `Bind to Dashboard`, `Teach Method`, and `Create Run Manifest`.

### 18.2 Urban Analytics Store

`src/features/urbanAnalytics/store.ts` currently manages modal open state, search, selected section, selected card, active tags, favorites, recents, recommendation mode, drawer width, and derived card lists. It also exposes `__setUrbanLibrary` and memoized selectors.

Current strength:

- The store is focused and fast.
- It avoids owning workflow or map state directly.
- It gives the modal stable selectors for visible cards and section counts.

Current limitation:

- It is a UI selection store, not a scientific session store.
- It cannot answer "what evidence is active?", "which map layers support this method?", "which code artifact was generated for this run?", or "is the current method valid for the selected spatial scale?".

Planned improvement:

- Keep `useUrbanStore` as the UI navigation store.
- Add a separate `useUrbanAnalysisContextStore` for scientific context and synchronization.
- Do not merge Map Explorer state into Urban Analytics. Instead, subscribe to selected map summaries and store only typed references.
- Use shallow selectors for performance and avoid modal-wide re-renders.

### 18.3 Type System

`src/features/urbanAnalytics/lib/types.ts` already defines the foundation: study areas, datasets, indicators, sessions, cards, analytical flow IDs, visualization specs, map outputs, chart outputs, data outputs, and completed analysis runs.

The file is the correct location for reusable Urban Analytics domain contracts. The current types should be extended conservatively with optional fields so existing seed data and flow outputs remain compatible.

New optional type families should include:

- `UrbanAnalysisContext`
- `UrbanEvidenceArtifact`
- `UrbanEvidenceArtifactKind`
- `UrbanDataFitnessProfile`
- `UrbanMethodValidityEnvelope`
- `UrbanReproducibilityManifest`
- `UrbanCodeArtifact`
- `UrbanMapBinding`
- `UrbanDashboardBinding`
- `UrbanReportBinding`
- `UrbanEducationBinding`
- `UrbanSyncHealth`
- `UrbanScientificQualityGate`

### 18.4 Rail Container

`RailContainer.tsx` already provides search, Fuse matching, section groups, tag filtering, favorites, recent items, collapsible groups, and local storage. It listens to `urban:section:set` and uses the store for section/card selection.

Premium upgrade should not make the rail decorative. It should become a professional research navigator:

- Method families: spatial statistics, remote sensing, mobility, vulnerability, morphology, simulation, policy evaluation, 3D/VoxCity.
- Scientific readiness filters: `needs AOI`, `needs polygon layer`, `needs temporal data`, `needs population denominator`, `supports dashboard`, `supports IDE code`, `supports map output`.
- Evidence filters: `map layer available`, `indicator available`, `workflow run exists`, `report insert ready`, `code artifact generated`.
- Research mode filters: `diagnosis`, `forecasting`, `scenario design`, `evaluation`, `monitoring`, `communication`.
- Study scale filters: parcel, block, neighborhood, district, corridor, city, metropolitan region.

### 18.5 Right Panel Four Block

`RightPanelFourBlock.tsx` is the strongest existing bridge between knowledge cards and action. It maps tags/cards to flows, opens related flows with `synapse:navigate`, applies card content to report slots, and records inserted cards in `usePanelBridgeStore`.

It currently has four tabs:

- Methodology
- Data
- Code
- References

Premium upgrade should keep this structure but raise each tab to research-grade:

- Methodology: hypothesis, assumptions, validity envelope, recommended scale, expected bias, failure modes, benchmark references.
- Data: required geometry, CRS, spatial unit, temporal coverage, missingness, licensing, denominator, sensitivity fields.
- Code: generated scripts with manifest headers, parameters, dependencies, output contracts, and reproducibility notes.
- References: citation records, standards, canonical methods, comparable empirical studies, and inline citation tokens for reporting.

### 18.6 Indicator Catalog

`catalog.ts` groups indicators across transport/mobility, energy/climate, urban form, social/liveability, water/infrastructure, governance/innovation, heritage/culture, and pandemic/resilience. `IndicatorCatalogPanel.tsx` exposes search, group selection, compute inputs, latest record history, report insertion, dashboard routing, education routing, and flow routing.

The catalog is a strong base for scientific UX because it already has indicator definitions and computation functions. The upgrade should make each computed record traceable:

- Input variables and units.
- Formula and transformation steps.
- Spatial scale and denominator.
- Data quality grade.
- Confidence/uncertainty class.
- Interpretation rules.
- Benchmark or threshold source.
- Map and dashboard binding descriptors.
- Report citation and limitation block.

### 18.7 Workflow Runtime

`CenterPanelShell.tsx`, `FlowHost.tsx`, `flowTypes.ts`, `flowLibraryMeta.ts`, and `workflowExperience.ts` already create a rich analytical workflow environment. `FlowHost` lazy-loads flows such as accessibility, vulnerability, morphology, object detection, composite indicators, scenario comparison, equity audit, change detection, hotspot analysis, VoxCity 3D, CityJSON, sunlight simulation, cellular automata, facility optimization, and system dynamics.

The upgrade should not centralize all workflow logic in Urban Analytics. Instead:

- Each flow should keep its local UI and method logic.
- Each flow should emit a standardized `CompletedAnalysisRun`.
- Each run should include an `UrbanReproducibilityManifest`.
- Each run should produce zero or more `UrbanEvidenceArtifact` records.
- `CenterPanelShell` should surface pending map layers and evidence artifacts consistently.
- `FlowHost` should accept map dispatch context and expose method readiness feedback before execution.

### 18.8 Map Explorer Integration

Map Explorer is already a mature state owner through `useMapExplorerStore.ts` and related services. The reviewed code shows a strong division of responsibilities:

- `useMapExplorerStore.ts` owns viewport, layers, selected features, AOI, pins, bookmarks, annotations, layout preferences, scientific QA, drawing, measurements, temporal playback, review session, and project state.
- `MapAnalysisDispatcher.ts` routes map AOI and selection context into compatible Urban flows.
- `MapEngineAdapter.ts` adapts analysis results into map layers, map outputs, and completed runs.
- `MapWorkflowService.ts` creates map workflow drafts, previews, derived layers, issues, guidance, and report items.
- `MapScientificQA.ts` evaluates CRS, geometry, topology, precision, metadata, scale, comparison, and temporal risks.
- `MapSyncService.ts` supports viewport synchronization for 2D/3D contexts.
- `MapReportHandoffService.ts` builds report-ready sections, citations, caveats, reproducibility blocks, and snapshot references.

Urban Analytics should integrate with these services through typed references:

- It should read selected AOI, selected layers, active analysis result layers, QA state, and viewport summaries.
- It should not duplicate map rendering or layer ownership.
- It should publish analysis outputs through `MapEngineAdapter`-style contracts.
- It should treat scientific QA as a gate for report/dashboard publication.
- It should pass map provenance into Urban evidence artifacts.

### 18.9 Reporting

Reporting services already include:

- `ReportEngine.ts` for compiling report documents.
- `AutoNarrative.ts` for completed-run sections.
- `indicatorInserts.ts` for indicator report inserts.
- `citationTokens.ts` and `CitationManager.ts` for inline citations and bibliography exports.
- `MapReportHandoffService.ts` for map-to-report inserts.

Urban Analytics should stop treating report handoff as simple text. It should generate structured pending inserts:

- Executive summary paragraph.
- Method block.
- Data block.
- Results block.
- Limitations block.
- Figure/table references.
- Citation tokens.
- Reproducibility checklist.
- QA caveats.
- Map snapshot references when relevant.

### 18.10 Dashboard

Dashboard services and components expose a separate presentation layer for indicators, scenarios, and advanced charting. `dataBindings.ts` already connects computed indicators to dashboard-ready bindings.

Urban Analytics should add:

- A `dashboardBinding` descriptor on computed indicators and workflow results.
- Clear uncertainty badges and scale labels in charts.
- Scenario comparison bindings for pre/post, baseline/intervention, and district/corridor comparisons.
- Dashboard readiness validation before route handoff.

### 18.11 Education

The education module provides learning paths, methodology explainers, dataset browser, exercise workspace, and instructor dashboard. Urban Analytics should deep-link into education when a method has known complexity or misuse risk.

Examples:

- Moran's I card links to spatial autocorrelation explainer.
- Hot spot workflows link to multiple testing and spatial weights concepts.
- Accessibility workflows link to impedance, catchment, and network assumptions.
- Remote sensing cards link to classification accuracy and confusion matrix concepts.
- Equity audit links to denominator choice, modifiable areal unit problem, and fairness metrics.

### 18.12 Synapse IDE

The IDE has two bridge layers:

- `src/services/editorBridge.ts`, a direct store-based helper for inserting into the active tab, opening new tabs, replacing selection, and inferring language.
- `src/services/editor/bridge.ts`, an event bus with `editor:openTab`, `editor:insertAtCursor`, `editor:replaceActive`, and `editor:openRange`.

`EnhancedIDE.tsx` subscribes to bridge events and owns the visible IDE layout. `MonacoEditor.tsx` handles editor mount, syntax, preview events, reveal events, markers, content stats, and editor state.

Urban Analytics should use IDE bridge actions more professionally:

- Generate a named folder or multi-file bundle when needed.
- Include manifest comments at the top of generated code.
- Use filenames that encode method and timestamp.
- Preserve active editor content unless the user chooses replace.
- Add code artifacts to the Urban context store.
- Generate code that can roundtrip back to map/report artifacts.

## 19. Target Scientific Domain Model

The following contracts should be introduced in `src/features/urbanAnalytics/lib/types.ts` as optional extensions. These examples are not implementation code for immediate copy-paste. They define the desired domain shape and should be refined during implementation.

### 19.1 Urban Analysis Context

```ts
export interface UrbanAnalysisContext {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  studyArea?: StudyArea;
  activeCardId?: string;
  activeSectionId?: SectionId;
  activeFlowId?: AnalyticalFlowId;
  activeIndicatorKind?: UrbanIndicatorKind;
  mapContext?: UrbanMapContextSummary;
  ideContext?: UrbanIdeContextSummary;
  reportContext?: UrbanReportContextSummary;
  dashboardContext?: UrbanDashboardContextSummary;
  evidenceArtifactIds: string[];
  syncHealth: UrbanSyncHealth;
  scientificQualityGate?: UrbanScientificQualityGate;
}
```

Purpose:

- Provide a single scientific session summary without forcing every component into one store.
- Let Urban Analytics show "what is active" across IDE, Map Explorer, reporting, dashboard, and workflows.
- Support reproducibility, auditability, and session restore.

### 19.2 Evidence Artifact

```ts
export type UrbanEvidenceArtifactKind =
  | "method-card"
  | "dataset"
  | "indicator"
  | "map-layer"
  | "workflow-run"
  | "code-artifact"
  | "report-insert"
  | "dashboard-binding"
  | "education-link"
  | "qa-finding";

export interface UrbanEvidenceArtifact {
  id: string;
  kind: UrbanEvidenceArtifactKind;
  title: string;
  summary: string;
  createdAt: string;
  sourceModule: "urban-analytics" | "map-explorer" | "synapse-ide" | "reporting" | "dashboard" | "education";
  sourceId?: string;
  cardId?: string;
  flowId?: AnalyticalFlowId;
  indicatorKind?: UrbanIndicatorKind;
  mapLayerId?: string;
  codeArtifactId?: string;
  reportInsertId?: string;
  dashboardBindingId?: string;
  tags: UrbanTag[];
  provenance: UrbanProvenanceRecord[];
  dataFitness?: UrbanDataFitnessProfile;
  validityEnvelope?: UrbanMethodValidityEnvelope;
  reproducibility?: UrbanReproducibilityManifest;
  qa?: UrbanScientificQualityGate;
}
```

Purpose:

- Every meaningful output becomes an evidence object.
- Evidence can flow to Map Explorer, IDE, report, dashboard, and education without losing context.
- The modal can display an "evidence tray" and timeline.

### 19.3 Data Fitness Profile

```ts
export interface UrbanDataFitnessProfile {
  grade: "A" | "B" | "C" | "D" | "E";
  score: number;
  geometryFit: "excellent" | "usable" | "limited" | "invalid";
  crsFit: "projected" | "geographic" | "unknown" | "mismatch";
  temporalFit: "current" | "historical" | "stale" | "mixed" | "unknown";
  completenessFit: "complete" | "minor-gaps" | "major-gaps" | "unknown";
  scaleFit: "native" | "aggregated" | "downscaled" | "mismatch";
  denominatorFit?: "available" | "estimated" | "missing" | "not-required";
  issues: UrbanDataFitnessIssue[];
}
```

Scientific role:

- Forces data suitability to be explicit before analysis.
- Helps prevent invalid use of indicators and flows.
- Gives the UI a clear premium quality signal without hiding complexity.

### 19.4 Method Validity Envelope

```ts
export interface UrbanMethodValidityEnvelope {
  recommendedScales: UrbanScale[];
  minimumFeatureCount?: number;
  requiredGeometryTypes?: Array<"Point" | "LineString" | "Polygon" | "MultiPolygon">;
  requiredAttributes?: string[];
  requiredTemporalStructure?: "single-snapshot" | "time-series" | "before-after" | "panel";
  assumptions: string[];
  failureModes: string[];
  interpretationLimits: string[];
  misuseWarnings: string[];
  peerReferenceIds: string[];
}
```

Scientific role:

- Method cards become actionable scientific objects.
- Workflows can warn users before execution.
- Reports can inherit assumptions and limitations automatically.

### 19.5 Reproducibility Manifest

```ts
export interface UrbanReproducibilityManifest {
  version: number;
  runId: string;
  methodId: string;
  flowId?: AnalyticalFlowId;
  cardId?: string;
  createdAt: string;
  inputs: UrbanRunInputReference[];
  parameters: Record<string, unknown>;
  outputs: UrbanRunOutputReference[];
  software: UrbanSoftwareEnvironment;
  randomSeed?: number;
  spatialReference?: CoordinateReferenceSystem;
  studyArea?: StudyArea;
  mapViewport?: {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
  };
  qaGate?: UrbanScientificQualityGate;
}
```

Scientific role:

- Enables transparent workflow reruns.
- Gives IDE generated scripts the same parameter base as UI runs.
- Makes report and dashboard outputs defensible.

### 19.6 Code Artifact

```ts
export interface UrbanCodeArtifact {
  id: string;
  title: string;
  filename: string;
  language: "python" | "javascript" | "typescript" | "json" | "markdown";
  createdAt: string;
  cardId?: string;
  flowId?: AnalyticalFlowId;
  indicatorKind?: UrbanIndicatorKind;
  manifestId?: string;
  sourceEvidenceIds: string[];
  dependencies: string[];
  parameters: Record<string, unknown>;
  outputContract: UrbanCodeOutputContract;
  safetyNotes: string[];
}
```

IDE role:

- The IDE receives code as a traceable artifact rather than anonymous text.
- Generated files can include headers, citations, and output expectations.
- Users can understand what the script needs and what it will produce.

## 20. Synchronization Protocol

Urban Analytics, Map Explorer, Synapse IDE, reporting, and dashboard should synchronize through typed stores and events. The system already uses this style, so the plan extends the existing pattern instead of introducing a new global framework.

### 20.1 Current Events and Stores to Preserve

| Existing mechanism | Owner | Current purpose | Preserve rule |
|---|---|---|---|
| `useUrbanStore` | Urban Analytics | Modal UI navigation and card filtering. | Keep as UI state only. |
| `usePanelBridgeStore` | Center panel bridge | Active tab, active flow, report slot, inserted cards. | Extend with evidence references if needed. |
| `useFlowStore` | Flow runtime | Active flow, step data, completed runs. | Keep workflow ownership here. |
| `useMapExplorerStore` | Map Explorer | Map state, AOI, layers, QA, selection, project state. | Urban reads summaries only. |
| `synapse:navigate` | App navigation bridge | Routes to flows, reports, dashboard, education. | Continue using for cross-module routing. |
| `synapse:editor:insert` | Urban modal to IDE | Inserts content into editor. | Replace loose payloads with typed artifact payloads where possible. |
| `reporting/pending-changed` | Reporting | Notifies pending insert changes. | Continue for report updates. |
| `MapAnalysisDispatcher` | Map services | Routes map AOI/selection to compatible flows. | Add Urban context metadata to dispatch payloads. |
| `MapEngineAdapter` | Map services | Converts analysis outputs to map layers and completed runs. | Use for Urban output publication. |

### 20.2 Proposed New Events

| Event | Direction | Payload | Use case |
|---|---|---|---|
| `urban:context:changed` | Urban to modules | `UrbanAnalysisContext` summary | Notify shell and modules of active research context. |
| `urban:evidence:created` | Any module to Urban | `UrbanEvidenceArtifact` | Register new map, indicator, code, report, or workflow evidence. |
| `urban:method:selected` | Urban rail/right panel to runtime | card id, method id, validity envelope | Prime related workflow and right-panel content. |
| `urban:map-context:request` | Urban to Map Explorer | requested summary fields | Ask Map Explorer for active AOI/layer/QA summary. |
| `urban:map-context:provided` | Map Explorer to Urban | `UrbanMapContextSummary` | Update research context without transferring layer ownership. |
| `urban:ide-artifact:open` | Urban to IDE | `UrbanCodeArtifact` plus code text | Open a named code artifact in Synapse IDE. |
| `urban:report-artifact:queue` | Urban to Reporting | structured pending insert | Queue report sections with citations and limitations. |
| `urban:dashboard-binding:queue` | Urban to Dashboard | binding descriptor | Register indicator or workflow output for dashboard. |
| `urban:education:focus` | Urban to Education | explainer id, method id, dataset id | Open relevant methodology education. |

### 20.3 Map to Urban Sync

Map Explorer should be the source of truth for:

- Active viewport.
- Selected AOI.
- Selected features.
- Visible overlay layers.
- Active analysis result layers.
- Scientific QA state.
- Drawing and measurement state.
- Temporal player state.
- Map review session event ids.

Urban Analytics should cache only a summary:

- AOI id and bounds.
- Layer ids and display names.
- Geometry types.
- feature counts when already available.
- CRS hints.
- QA status and blocking issues.
- active analysis result ids.
- viewport center/zoom.
- provenance summaries.

Implementation target:

- Add `UrbanMapContextSummary` type in `lib/types.ts`.
- Add selector helpers in a new file `src/features/urbanAnalytics/context/mapContextSelectors.ts`.
- Use `useMapExplorerStore.getState()` only inside selector/service functions, not inside presentation components except existing buttons.
- Add tests for AOI/layer summary conversion.

### 20.4 Urban to Map Sync

Urban Analytics should publish map outputs only through map service contracts:

- For analytical outputs, use or extend `MapEngineAdapter.ts`.
- For map workflow-derived layers, use `MapWorkflowService.ts`.
- For quality gates, use `MapScientificQA.ts`.
- For report snapshots, use `MapReportHandoffService.ts`.

Do not create a second map-layer model inside Urban Analytics. Urban evidence artifacts should reference map layer ids and adapter outputs.

### 20.5 Urban to IDE Sync

Urban Analytics currently sends content to editor-like actions. The premium version should generate artifact-backed IDE actions:

- `Open Script in IDE`: opens a new tab with a stable filename and method header.
- `Insert Function`: inserts a smaller function into the active tab.
- `Open Manifest`: opens a `.json` manifest in a new tab.
- `Open Notebook Outline`: opens a markdown or Python notebook-style scaffold.
- `Copy Environment`: inserts dependency notes.

Each code action should:

- Register `UrbanCodeArtifact` in the context store.
- Link to source card, flow, indicator, map layers, and report insert.
- Use `editorBridge.openNewTab` or `editor:openTab` event bus.
- Avoid replacing active content by default.

### 20.6 Urban to Report Sync

Report integration should use structured inserts:

- Method summary.
- Data requirements and actual data used.
- Indicator formula or workflow algorithm.
- Results.
- Limitations.
- QA findings.
- Reproducibility manifest.
- Citations.

Target files:

- `src/services/reporting/indicatorInserts.ts`
- `src/services/reporting/AutoNarrative.ts`
- `src/services/map/MapReportHandoffService.ts`
- new `src/features/urbanAnalytics/context/reportArtifactBuilder.ts`

### 20.7 Urban to Dashboard Sync

Dashboard integration should use binding descriptors, not ad hoc navigation:

- Indicator records should carry dashboard binding metadata.
- Workflow completed runs should expose chart/map/table binding candidates.
- Scenario outputs should expose baseline/intervention groups.
- Dashboard should surface uncertainty and scale labels.

Target files:

- `src/features/dashboard/dataBindings.ts`
- `src/features/dashboard/DashboardBuilder.tsx`
- `src/features/dashboard/ScenarioComparisonDashboard.tsx`
- new `src/features/urbanAnalytics/context/dashboardArtifactBuilder.ts`

### 20.8 Urban to Education Sync

Education routing should be explicit:

- Every advanced method card should include one or more methodology explainer ids.
- Right panel should show `Learn method` action.
- Workflow warning panels should link to explainers when a user tries a method with weak data fitness.
- Exercises can reuse active datasets or teaching dataset packages.

Target files:

- `src/features/urbanAnalytics/seeds/*.ts`
- `src/features/education/methodologyData.ts`
- `src/features/education/learningPaths.ts`
- `src/features/education/EducationModule.tsx`

## 21. File-by-File Implementation Blueprint

### 21.1 Urban Analytics Core

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/lib/types.ts` | Add optional context, evidence, validity, data fitness, reproducibility, code artifact, report/dashboard/map binding types. | Establish a shared scientific contract. | Typecheck and unit tests for type guards/builders. |
| `src/features/urbanAnalytics/store.ts` | Keep UI navigation state. Add selectors that expose active card summary without adding map/report ownership. | Avoid bloating the existing store. | Store selector tests. |
| `src/features/urbanAnalytics/context/useUrbanAnalysisContextStore.ts` | New Zustand store for context, evidence registry, sync health, active artifact, and quality gate summaries. | Provide the missing synchronization kernel. | Store action tests and persistence tests if local storage is used. |
| `src/features/urbanAnalytics/context/contextSelectors.ts` | New selector helpers for card, flow, indicator, map, IDE, report, dashboard context. | Keep components clean and avoid repeated conversion logic. | Unit tests for each selector. |
| `src/features/urbanAnalytics/context/evidenceArtifacts.ts` | New builders for method, indicator, map, workflow, code, report, dashboard evidence. | Normalize evidence creation. | Snapshot tests for generated artifacts. |
| `src/features/urbanAnalytics/context/scientificQuality.ts` | New data fitness and method validity scoring helpers. | Make scientific readiness visible and consistent. | Threshold tests and edge cases. |

### 21.2 Modal Shell and UX

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` | Add context strip, evidence tray trigger, premium command bar labels, and sync state chips. | Make the modal feel like a professional research cockpit. | Visual regression and keyboard navigation tests. |
| `src/features/urbanAnalytics/UrbanAnalyticsModal.module.css` or existing CSS location | Extract inline modal CSS if practical, preserving current styling tokens. | Improve maintainability and reduce file weight. | Build and visual check. |
| `src/features/urbanAnalytics/WelcomeModal.tsx` | Update onboarding to reflect context, evidence, map sync, IDE handoff, and report workflow. | Align first-run experience with the new model. | Component snapshot test. |
| `src/features/urbanAnalytics/icons.tsx` | Audit icon usage and add semantic icons for evidence, QA, sync, method readiness, code artifact. | Premium UI needs fast visual parsing. | Manual visual review. |

### 21.3 Rail and Discovery

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/rail/RailContainer.tsx` | Add scientific filters, evidence-aware ranking, map-context compatibility badges, and method readiness counters. | Search should guide professional analysis decisions. | Search/filter unit tests and interaction tests. |
| `src/features/urbanAnalytics/rail/railUtils.ts` | New helper file if extraction is needed for ranking and filters. | Keep rail component readable. | Unit tests for ranking and grouping. |
| `src/features/urbanAnalytics/seeds/index.ts` | Validate card metadata during build in development. | Catch missing method/data/reference fields early. | Dev-only validation tests. |

### 21.4 Right Panel Dossier

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/RightPanelFourBlock.tsx` | Add scientific dossier header, method readiness, data fitness panel, artifact actions, and related evidence list. | Turn card details into a decision surface. | Component tests for actions and routing. |
| `src/features/urbanAnalytics/rightPanelUtils.ts` | Add formatters for validity envelope, data fitness, reproducibility manifest, citation tokens, and code artifact metadata. | Keep content generation consistent. | Formatter snapshot tests. |
| `src/features/urbanAnalytics/context/codeArtifactBuilder.ts` | Generate method-specific code snippets and manifests. | Make IDE handoff professional and repeatable. | Snapshot tests for generated Python/JS/JSON/Markdown artifacts. |

### 21.5 Seed Library

| File group | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/seeds/projectScoping.ts` | Add scoping validity, required decisions, study scale guidance, and report templates. | Project scoping drives the research context. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/gisMethods.ts` | Add CRS, geometry, topology, spatial join, buffer, overlay, and MAUP warnings. | GIS methods are frequent failure points. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/spatialStats.ts` | Add assumptions, sample size, weights matrix guidance, multiple testing notes, and interpretation limits. | Spatial statistics require scientific guardrails. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/remoteSensing.ts` | Add accuracy assessment, classification caveats, temporal acquisition notes, and sensor/data resolution constraints. | Remote sensing cards need data fitness checks. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/transportNetworks.ts` | Add network impedance, mode, access/egress, service frequency, and equity denominator notes. | Mobility analysis depends on network assumptions. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/urbanIndicators.ts` | Add formula metadata, benchmark source, denominator, uncertainty, and dashboard binding hints. | Indicators must be traceable and dashboard-ready. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/vulnerability.ts` | Add composite index caveats, weighting sensitivity, normalization choices, and equity interpretation. | Vulnerability analysis has high policy impact. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/interventionDesign.ts` | Add scenario logic, causal assumptions, implementation feasibility, and monitoring linkage. | Intervention cards should connect analysis to policy action. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/monitoringReporting.ts` | Add audit trail, reporting standards, recurring indicators, and governance review notes. | Supports reproducible monitoring workflows. | Metadata validation. |
| `src/features/urbanAnalytics/seeds/voxcity.ts` | Add 3D data assumptions, CityJSON requirements, solar/sunlight caveats, and viewport sync. | VoxCity must integrate with 2D map context. | Metadata validation. |

### 21.6 Indicator Stack

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/indicators/catalog.ts` | Add optional fields for formula, units, denominator, uncertainty class, scale envelope, dashboard hints, map hints, education links. | Make indicator definitions scientific and actionable. | Catalog definition tests. |
| `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx` | Add data fitness display, input validation clarity, result lineage, uncertainty, map/report/dashboard action readiness. | Premium indicator UX. | Component tests and manual input flows. |
| `src/features/urbanAnalytics/calculators/index.ts` | Standardize return metadata from calculators. | Ensure every calculation has comparable lineage. | Calculator tests. |
| `src/features/urbanAnalytics/calculators/transportMobility.ts` | Add denominator and network caveats to result metadata. | Mobility indicators are sensitive to network and population assumptions. | Calculator tests. |
| `src/services/reporting/indicatorInserts.ts` | Include formula, assumptions, data quality, uncertainty, and citation tokens. | Report outputs should be academically defensible. | Report insert snapshot tests. |
| `src/features/dashboard/dataBindings.ts` | Include uncertainty labels and scale fields in computed indicator bindings. | Dashboard should not hide quality caveats. | Binding tests. |

### 21.7 Workflow Runtime

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/centerpanel/Flows/flowTypes.ts` | Add optional manifest/evidence fields to workflow metadata and run outputs. | Keep all flows compatible with evidence registry. | Typecheck and unit tests. |
| `src/centerpanel/Flows/flowLibraryMeta.ts` | Add method readiness, data requirements, education link ids, and map compatibility metadata. | Help rail/right panel guide users. | Metadata tests. |
| `src/centerpanel/Flows/workflowExperience.ts` | Add UX states for data readiness, QA blocking, and reproducibility completion. | Workflow UI should communicate scientific state. | Snapshot tests. |
| `src/centerpanel/Flows/FlowHost.tsx` | Register evidence artifacts when runs complete and consume map dispatch context with validity checks. | Centralize flow-to-evidence conversion. | Integration tests. |
| `src/centerpanel/CenterPanelShell.tsx` | Surface evidence and pending map layers through stable selectors. | Keep shell synchronized with Urban context. | Shell integration tests. |

### 21.8 Individual Analytical Flows

Each flow should be upgraded without changing its main purpose:

| Flow file | Scientific upgrade | Output upgrade |
|---|---|---|
| `AccessibilityFlow.tsx` | Add impedance assumptions, mode, catchment logic, network completeness, and equity denominator checks. | Accessibility evidence, map layer binding, report block, IDE script. |
| `VulnerabilityFlow.tsx` | Add normalization, weighting, sensitivity, missingness, and uncertainty. | Vulnerability index manifest and dashboard binding. |
| `UrbanMorphologyFlow.tsx` | Add scale, parcel/block aggregation, density/compactness assumptions, and morphology typology caveats. | Morphology evidence and map styling hints. |
| `CompositeIndicatorFlow.tsx` | Add weight audit, normalization method, sensitivity run, and ranking stability. | Composite indicator evidence, report table, dashboard radar/bar chart. |
| `ScenarioComparisonFlow.tsx` | Add baseline/intervention model, counterfactual notes, comparison uncertainty, and temporal assumptions. | Scenario dashboard binding and report comparison section. |
| `EquityAuditFlow.tsx` | Add fairness metric definitions, protected group limitations, denominator checks, and ethics notes. | Equity audit evidence and policy interpretation caveats. |
| `ChangeDetectionFlow.tsx` | Add temporal alignment, classification accuracy, false positive risk, and sensor/source consistency. | Change evidence and temporal map binding. |
| `EmergingHotSpotFlow.tsx` | Add temporal binning, spatial weights, multiple testing, and stationarity warnings. | Hotspot evidence and QA gate. |
| `FacilityOptimisationFlow.tsx` | Add objective function, constraints, service radius assumptions, and sensitivity. | Facility siting evidence and map catchment outputs. |
| `SystemDynamicsFlow.tsx` | Add stocks/flows validity, feedback loops, parameter uncertainty, and scenario trace. | Simulation manifest and dashboard time series binding. |
| `CellularAutomataFlow.tsx` | Add transition rules, calibration, validation, stochastic seed, and spatial resolution. | CA simulation manifest and map animation binding. |
| `VoxCity3DFlow.tsx` | Add 3D geometry requirements, building height source, CRS/vertical datum caveats. | 3D evidence and 2D/3D viewport link. |
| `CityJSONFlow.tsx` | Add CityJSON schema validation, LoD, geometry validity, semantic surfaces. | CityJSON evidence and validation report. |
| `SunlightSimulationFlow.tsx` | Add solar position, date/time, surface assumptions, obstruction model, and climate caveats. | Sunlight evidence, map/3D output, report figure. |
| `ObjectDetectionFlow.tsx` | Add model confidence, training domain, false positive/negative notes, and validation sample. | Detection evidence, map layer, QA warnings. |

### 21.9 Map Services

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/services/map/MapAnalysisDispatcher.ts` | Add Urban context metadata to dispatch payloads and compatible method hints. | Map selections should open Urban workflows with context intact. | Dispatcher tests. |
| `src/services/map/MapEngineAdapter.ts` | Add evidence artifact metadata on adapted completed runs and layer outputs. | Analysis outputs should be traceable through map/report/dashboard. | Adapter tests for representative methods. |
| `src/services/map/MapScientificQA.ts` | Expose a compact QA summary suitable for Urban context display. | Urban UI needs QA without duplicating full map QA. | QA summary tests. |
| `src/services/map/MapWorkflowService.ts` | Attach Urban evidence and report/dashboard hints to map workflow results. | Derived map workflows should feed Urban context. | Workflow preview/apply tests. |
| `src/services/map/MapSyncService.ts` | Extend docs and selectors for 2D/3D viewport sync in Urban/VoxCity surfaces. | Supports Map Explorer and VoxCity synchronization. | Viewport sync tests. |
| `src/services/map/MapReportHandoffService.ts` | Include Urban context id and evidence ids in pending report inserts. | Keep map report outputs linked to Urban sessions. | Report handoff snapshot tests. |
| `src/services/map/MapPersistenceService.ts` | Consider optional Urban context snapshot reference in map project snapshots. | Helps restore synchronized projects. | Persistence migration tests. |
| `src/services/map/MapReviewSessionService.ts` | Register review events as evidence artifacts when linked from Urban. | Review decisions become auditable. | Review event tests. |
| `src/services/map/MapDataImporter.ts` | Emit data fitness starter metadata for imported layers. | Imported data should immediately contribute to method readiness. | Import metadata tests. |
| `src/services/map/MapDataExporter.ts` | Include evidence/provenance properties when exporting Urban outputs. | Exported data remains traceable. | Export tests. |

### 21.10 IDE Bridge

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/services/editorBridge.ts` | Add helper for opening Urban code artifacts with filename/language metadata. | Keeps direct store bridge ergonomic. | Bridge unit tests. |
| `src/services/editor/bridge.ts` | Add optional metadata to `editor:openTab` payload, or add a new Urban-specific wrapper event. | Preserve event bus while enabling provenance. | Event tests. |
| `src/services/editor/aiEditorBridgeGlobal.ts` | Ensure generated Urban files can be found/read/written in AI assisted workflows. | IDE code artifacts should participate in AI editing. | Manual bridge smoke test. |
| `src/components/ide/EnhancedIDE.tsx` | Display artifact metadata in tab tooltip or side panel if metadata is available. | Users should know generated code origin. | Visual/manual test. |
| `src/components/editor/MonacoEditor.tsx` | Support reveal/open range from Urban artifacts if line metadata is generated. | Better artifact navigation. | Editor event test. |

### 21.11 Reporting, Dashboard, Education

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/services/reporting/AutoNarrative.ts` | Include evidence artifact references and scientific QA caveats for completed runs. | Reports become defensible. | Snapshot tests. |
| `src/services/reporting/ReportEngine.ts` | Ensure new blocks compile cleanly with citations/cross references. | Avoid report export regressions. | Report compile tests. |
| `src/services/reporting/citationTokens.ts` | Reuse citation token handling for Urban card citations. | Keep citation handling consistent. | Citation tests. |
| `src/features/dashboard/DashboardBuilder.tsx` | Accept Urban evidence-backed indicator/workflow bindings. | Dashboard can consume Urban outputs. | Dashboard binding tests. |
| `src/features/dashboard/advancedCharts.tsx` | Show uncertainty, scenario group, and scale labels. | Premium scientific dashboard UX. | Chart snapshot tests. |
| `src/features/education/EducationModule.tsx` | Accept `urban:education:focus` routing for method explainers and exercises. | Smooth education sync. | Navigation test. |
| `src/features/education/MethodologyExplainer.tsx` | Show links back to active Urban context when opened from Urban. | Bidirectional learning flow. | Component test. |
| `src/features/education/DatasetLibraryBrowser.tsx` | When teaching dataset loads to map, emit dataset evidence artifact if Urban context is active. | Teaching data can be analyzed and documented. | Dataset load test. |

### 21.12 VoxCity and 3D

| File | Planned change | Reason | Verification |
|---|---|---|---|
| `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts` | Add Urban evidence ids and map viewport sync references to VoxCity data bridge outputs. | 3D analysis needs traceability. | Bridge tests. |
| `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx` | Surface selected building context and evidence actions. | 3D exploration should connect to report/IDE/map. | Visual/manual test. |
| `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx` | Add schema/LoD QA summary and report action. | CityJSON users need scientific validation. | Component test. |
| `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx` | Add scenario manifest, assumptions, and date/time reproducibility. | Sunlight simulations must be repeatable. | Simulation snapshot test. |
| `src/features/urbanAnalytics/voxcity/SunlightSimulator.ts` | Return structured simulation metadata with random/temporal parameters where relevant. | Enables reports and IDE scripts. | Unit tests. |

## 22. Premium UX Specification

The Urban Analytics modal should feel like a premium scientific workstation, not a marketing page and not a decorative dashboard. The current general layout should remain: left rail, central analytical surface, right method/data/code/reference panel, top command area, and action footer.

### 22.1 Visual System Principles

- Dense but calm information hierarchy.
- Compact controls for repeated analytical work.
- Strong separation between navigation, analysis, evidence, and actions.
- Clear status chips for sync, QA, data fitness, and method readiness.
- Limited decorative styling. Use meaningful icons, tags, and micro-layouts.
- No large empty hero regions inside the modal.
- Keep cards at restrained radius and avoid nested card structures.
- Use typographic scale appropriate to tool surfaces, not landing pages.
- Prioritize scannability and repeat action speed.

### 22.2 Top Bar

Current top bar should be upgraded with:

- Context title: active project or "Urban Research Session".
- Study area chip: AOI name, bounds, or "No AOI selected".
- Sync chip: Map, IDE, Report, Dashboard status.
- QA chip: pass, warning, blocked, not evaluated.
- Search field retained, with method/data/workflow scoped search.
- Command buttons with icons and tooltips:
  - Open Map Explorer
  - Open IDE Artifact
  - Queue Report Insert
  - Bind Dashboard
  - Open Education
  - Export Manifest

### 22.3 Left Rail

Rail should become a scientific method library:

- Primary section tree remains.
- Add compact filter bar with icon toggles:
  - Map-ready
  - Code-ready
  - Report-ready
  - Dashboard-ready
  - Education-linked
  - Needs data
  - QA-sensitive
- Add method readiness badges:
  - Ready
  - Needs AOI
  - Needs layer
  - Needs fields
  - Needs time series
  - Not compatible
- Add evidence count badges where a card has generated outputs.
- Keep favorites and recents, but show them as research shortcuts rather than generic lists.

### 22.4 Center Panel

Center panel should stay the workspace. It should gain:

- A compact "active research context" strip above workflow content.
- A method readiness checklist before executing a flow.
- A run manifest preview after execution.
- Evidence artifacts after computation.
- Map publication status.
- Report/dashboard/code action status.

### 22.5 Right Panel

Right panel should stay four-block but become a dossier:

- Header: method title, scientific family, scale, readiness, evidence count.
- Methodology tab:
  - research question fit
  - assumptions
  - validity envelope
  - interpretation limits
  - failure modes
- Data tab:
  - required geometry
  - required attributes
  - CRS
  - temporal coverage
  - denominator
  - data fitness result
- Code tab:
  - artifact list
  - generated script preview
  - dependencies
  - manifest
  - output contract
- References tab:
  - peer references
  - standards
  - citation tokens
  - report-ready bibliography snippets

### 22.6 Evidence Tray

Add an evidence tray that can open from the bottom or right side:

- Timeline of created artifacts.
- Filter by kind: method, dataset, indicator, map layer, workflow run, code, report, dashboard, QA.
- Each artifact row shows title, source, time, linked modules, QA status.
- Actions:
  - Open source
  - Open in Map
  - Open in IDE
  - Add to Report
  - Bind to Dashboard
  - Export Manifest
- Evidence tray should use stable row heights and not shift layout.

### 22.7 Empty, Loading, Error, and Blocked States

Every premium state needs scientific meaning:

- Empty AOI: explain that map context is missing and offer "Select AOI in Map Explorer".
- Empty layer: show required geometry and field hints.
- QA blocked: list blocking issues and recommended fixes.
- Unsupported method: show why the active context is not compatible.
- Demo mode: label clearly and do not imply real analysis.
- Long computation: show method, input size, active step, and cancel option.
- Failed computation: preserve input manifest and show recovery actions.

### 22.8 Accessibility

- All command buttons require labels or tooltips.
- Keyboard navigation should support rail, search, tabs, and action bar.
- Focus return after modal close should be stable.
- Status chips should not rely on color alone.
- Contrast must remain acceptable in dark mode.
- Text must not overflow badges, chips, or buttons.

## 23. Scientific Quality Specification

The premium Urban Analytics workbench must feel scientifically serious. The core rule: every analytical action should answer four questions before and after execution.

Before execution:

- What research question does this method answer?
- What data does it require?
- Is the current data fit for that purpose?
- What assumptions and limitations apply?

After execution:

- What exactly was computed?
- Which inputs and parameters were used?
- How reliable is the result?
- How can this be reproduced or cited?

### 23.1 Data Fitness Scoring

Recommended score components:

| Component | Weight | Examples |
|---|---:|---|
| Geometry fit | 20 | Correct geometry type, valid topology, sufficient feature count. |
| CRS fit | 15 | Projected CRS for distance/area, known CRS, no mismatch. |
| Attribute fit | 20 | Required fields present, units known, denominator available. |
| Temporal fit | 15 | Current data, aligned time windows, valid panel/before-after structure. |
| Completeness fit | 15 | Missingness below threshold, no extreme coverage gaps. |
| Scale fit | 15 | Spatial unit matches method, aggregation risk understood. |

Grades:

- A: 90-100, high confidence for intended method.
- B: 75-89, usable with minor caveats.
- C: 60-74, usable only with explicit limitations.
- D: 40-59, exploratory only.
- E: 0-39, block formal output publication.

### 23.2 Method Readiness

Method readiness should be computed from:

- Required map context.
- Required data fields.
- Required geometry type.
- Required temporal structure.
- Minimum feature count.
- CRS and measurement requirements.
- Method-specific assumptions.
- Existing QA findings.

States:

- `ready`: analysis can run and publish.
- `ready-with-caveats`: analysis can run but report/dashboard should include limitations.
- `needs-context`: missing AOI, layer, indicator input, or parameter.
- `blocked`: result would be scientifically invalid or misleading.
- `demo-only`: current data is fixture/demo and must be labeled.

### 23.3 QA Gate

QA gate should integrate with `MapScientificQA.ts` instead of duplicating map checks. Urban-specific QA should add:

- method-data compatibility.
- denominator validity.
- sample size threshold.
- spatial scale appropriateness.
- temporal alignment.
- weights matrix suitability.
- composite indicator sensitivity.
- classification accuracy requirement.
- interpretation limits.

Publication rules:

- Map publication may proceed with warning if geometry is valid and caveats are attached.
- Report publication should be blocked for `blocked` QA unless user explicitly exports as exploratory note.
- Dashboard binding should show warning for uncertainty and blocked for invalid denominator.
- IDE artifact generation can proceed even when QA is blocked, but the generated manifest must include the blocking issues.

### 23.4 Reproducibility Requirements

Every completed workflow run should include:

- method id and version.
- flow id.
- card id if launched from a card.
- input layer ids and dataset references.
- AOI id and bounds.
- CRS.
- parameters.
- random seed if applicable.
- output ids.
- QA gate result.
- software/environment note.
- citations.
- timestamp.

### 23.5 Ethical and Policy Guardrails

High-impact urban analytics should show explicit warnings for:

- vulnerability ranking.
- equity audit.
- policing/surveillance-adjacent object detection.
- displacement or land-value inference.
- accessibility measures used for service allocation.
- demographic inference.
- climate risk prioritization.

The UI should not block legitimate professional work by default, but it must expose assumptions, limitations, and recommended review steps.

## 24. Implementation Epics

### Epic 1: Urban Analysis Context Kernel

Goal:

Create the context and evidence registry that all later premium features can use.

Tasks:

- Add context/evidence types in `lib/types.ts`.
- Add `useUrbanAnalysisContextStore.ts`.
- Add evidence builders.
- Add map context summary selector.
- Add IDE artifact registry action.
- Add report/dashboard binding registry actions.
- Add unit tests.

Definition of done:

- The modal can show a context summary without changing existing workflows.
- Evidence artifacts can be added, updated, selected, and cleared.
- No Map Explorer ownership is duplicated.

### Epic 2: Scientific Metadata Expansion

Goal:

Upgrade cards and indicator definitions with research-grade metadata.

Tasks:

- Add optional metadata fields to cards.
- Update all seed modules progressively.
- Add dev-time metadata validation.
- Add right-panel formatters.
- Add missing references and citation ids.

Definition of done:

- Every high-value card has method assumptions, data requirements, validity envelope, references, and action compatibility.
- Missing metadata is visible in development.

### Epic 3: Rail Research Navigator

Goal:

Make the rail guide analytical choices.

Tasks:

- Add method readiness filters.
- Add map compatibility badges.
- Add evidence counters.
- Add section-level readiness counts.
- Improve Fuse ranking with metadata and active context.

Definition of done:

- User can filter for methods that match current map/data context.
- Rail remains fast with full card library.

### Epic 4: Right Panel Scientific Dossier

Goal:

Turn the four-block right panel into a scientific decision surface.

Tasks:

- Add dossier header.
- Add data fitness and readiness widgets.
- Add evidence list.
- Add improved code artifact actions.
- Add report/dashboard/map/education command states.

Definition of done:

- Right panel explains what method is valid for, what data it needs, and what actions are available.

### Epic 5: Indicator Traceability

Goal:

Make each computed indicator traceable from formula to dashboard/report/map.

Tasks:

- Extend indicator definitions.
- Extend computed records with lineage.
- Add data fitness and uncertainty.
- Update report insert builder.
- Update dashboard binding builder.
- Add tests for representative indicators.

Definition of done:

- A computed indicator can be inspected, cited, reported, and charted with its assumptions.

### Epic 6: Workflow Run Manifests

Goal:

Make every workflow output reproducible.

Tasks:

- Extend completed run outputs with manifests.
- Add helper builders for common run metadata.
- Update high-impact flows first: accessibility, vulnerability, composite indicator, scenario comparison, equity audit.
- Add manifest preview UI.
- Add tests.

Definition of done:

- Completed runs produce standardized manifests and evidence artifacts.

### Epic 7: Map Explorer Synchronization

Goal:

Make Map Explorer and Urban Analytics feel synchronized without coupling ownership.

Tasks:

- Add map context summary.
- Add Urban context metadata to dispatch payloads.
- Add evidence metadata to map adapter outputs.
- Add QA summary display.
- Add map publication actions.
- Add tests around dispatch and adapter outputs.

Definition of done:

- Selecting AOI/layers in Map Explorer makes Urban methods context-aware.
- Urban outputs can publish to Map Explorer with provenance.

### Epic 8: IDE Code Artifact System

Goal:

Make generated code professional, named, reproducible, and reversible.

Tasks:

- Add code artifact builders.
- Add IDE open/insert actions.
- Add manifest headers.
- Add method-specific script templates for core flows.
- Add tests for artifact generation.

Definition of done:

- Urban Analytics can open a named script and manifest in Synapse IDE linked to active evidence.

### Epic 9: Reporting Integration

Goal:

Make report outputs structured and citation-ready.

Tasks:

- Add Urban report artifact builder.
- Include assumptions, limitations, QA, citations, and reproducibility.
- Extend indicator and completed-run report inserts.
- Add report pending insert tests.

Definition of done:

- Urban outputs arrive in reporting as professional report sections, not raw text.

### Epic 10: Dashboard Integration

Goal:

Make Urban outputs dashboard-ready with caveats.

Tasks:

- Add dashboard binding descriptors.
- Update dashboard builder to read uncertainty/scale labels.
- Add scenario comparison binding patterns.
- Add tests.

Definition of done:

- Indicators and workflow outputs can be bound to dashboard views with scientific labels.

### Epic 11: Education Integration

Goal:

Make scientific methods learnable in context.

Tasks:

- Add explainer ids to method cards and workflows.
- Add `urban:education:focus` event.
- Update education module focus handling.
- Add method warnings linking to explainers.

Definition of done:

- Users can move from method warning to explainer and back to Urban context.

### Epic 12: VoxCity and 2D/3D Synchronization

Goal:

Connect 3D city analytics to Urban evidence and Map Explorer sync.

Tasks:

- Add VoxCity evidence builders.
- Add viewport sync references.
- Add CityJSON QA summary.
- Add sunlight simulation manifest.
- Add report/IDE actions for 3D outputs.

Definition of done:

- 3D analyses produce evidence artifacts and can be documented/reproduced.

### Epic 13: Premium Visual Refinement

Goal:

Raise the UI polish while preserving structure.

Tasks:

- Refine spacing, density, focus states, icons, chips, badges, and panels.
- Extract inline CSS where helpful.
- Add responsive behavior checks.
- Add visual regression baselines.

Definition of done:

- UI feels premium, compact, scientific, and stable across modal sizes.

### Epic 14: Persistence and Restore

Goal:

Let users restore synchronized research sessions.

Tasks:

- Store context snapshot in local/project persistence when appropriate.
- Link map project snapshots to Urban context id.
- Restore evidence artifact summaries.
- Avoid persisting huge layer data in Urban context.

Definition of done:

- Reloading a project can restore research context, evidence list, and map references.

### Epic 15: Validation and Release Hardening

Goal:

Guarantee the upgrade does not break existing module behavior.

Tasks:

- Unit tests for stores, selectors, builders, adapters.
- Component tests for rail, right panel, indicator panel.
- Integration tests for Urban to Map, IDE, Report, Dashboard, Education.
- E2E smoke for modal open, search, flow launch, map handoff, IDE handoff.
- Performance check for card library search and modal open.

Definition of done:

- Typecheck, lint, unit tests, integration tests, build, and targeted E2E pass.

## 25. Detailed Phase Plan

### Phase 1: Context Kernel Without Visible UI Risk

Scope:

- Add types.
- Add context store.
- Add evidence builders.
- Add map summary selectors.
- Add tests.

Files:

- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/context/useUrbanAnalysisContextStore.ts`
- `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
- `src/features/urbanAnalytics/context/mapContextSelectors.ts`
- `src/features/urbanAnalytics/context/scientificQuality.ts`
- tests near the new files.

Acceptance:

- Existing modal behavior unchanged.
- Context store can register active card, active method, map summary, code artifact, and report/dashboard binding.
- Evidence registry operations are tested.

### Phase 2: Card Metadata and Validation

Scope:

- Extend card metadata.
- Add validation helper.
- Update high-value seed modules first.

Priority seed modules:

- `spatialStats.ts`
- `urbanIndicators.ts`
- `transportNetworks.ts`
- `vulnerability.ts`
- `remoteSensing.ts`
- `voxcity.ts`

Acceptance:

- Each priority module has assumptions, data requirements, validity envelope, references, and compatibility flags.

### Phase 3: Rail and Right Panel Upgrade

Scope:

- Add method readiness filters.
- Add dossier header.
- Add data fitness and evidence display.
- Add action state logic.

Acceptance:

- Active map context changes method readiness badges.
- Right panel shows method assumptions and action compatibility.

### Phase 4: Indicator Traceability

Scope:

- Extend indicator definitions.
- Add computed result lineage.
- Update report and dashboard handoffs.

Acceptance:

- Indicator result can be sent to report and dashboard with formula, units, scale, assumptions, and uncertainty.

### Phase 5: Workflow Manifests

Scope:

- Add manifest builder.
- Update representative flows.
- Register completed-run evidence.

Priority flows:

- Accessibility
- Vulnerability
- Composite Indicator
- Scenario Comparison
- Equity Audit
- Change Detection

Acceptance:

- Each priority flow emits manifest and evidence artifacts.

### Phase 6: Map Explorer Synchronization

Scope:

- Add map context summary.
- Extend dispatcher payload.
- Extend map adapter outputs.
- Add QA summary.

Acceptance:

- Map AOI/layer selection changes Urban context.
- Urban output can publish map layers with provenance.

### Phase 7: Synapse IDE Artifact Handoff

Scope:

- Add code artifact builder.
- Add IDE bridge helper.
- Generate script and manifest tabs.

Acceptance:

- A method card or completed run can open a named IDE script and JSON manifest.
- The artifact is registered in Urban context.

### Phase 8: Report, Dashboard, Education

Scope:

- Add report artifact builder.
- Add dashboard binding builder.
- Add education focus routing.

Acceptance:

- Same evidence artifact can be reported, charted, and linked to methodology education.

### Phase 9: VoxCity/3D and Persistence

Scope:

- Add 3D evidence.
- Add viewport sync links.
- Add context snapshot persistence.

Acceptance:

- CityJSON/sunlight/3D analysis outputs can be reproduced and documented.

### Phase 10: Premium Polish and Release Gates

Scope:

- UI refinement.
- Accessibility.
- E2E validation.
- Build/performance checks.

Acceptance:

- Modal is stable, fast, compact, premium, and scientifically explicit.

## 26. Code Artifact Templates for IDE Integration

Urban Analytics should generate several artifact types.

### 26.1 Python Analysis Script

Filename pattern:

```text
urban_<method_slug>_<yyyymmdd_hhmm>.py
```

Header requirements:

```python
"""
Synapse Urban Analytics Artifact
Method: <method title>
Flow: <flow id>
Card: <card id>
Study area: <aoi name or bounds>
Inputs: <layer ids or dataset refs>
Created: <timestamp>
Manifest: <manifest filename>

Scientific assumptions:
- ...

Limitations:
- ...
"""
```

Script sections:

- imports.
- parameter block.
- input loading placeholder.
- CRS and geometry validation.
- analysis function.
- output serialization.
- map/report handoff hints.

### 26.2 JSON Manifest

Filename pattern:

```text
urban_<method_slug>_<yyyymmdd_hhmm>.manifest.json
```

Required fields:

- context id.
- evidence ids.
- method id.
- flow id.
- card id.
- input refs.
- parameters.
- QA gate.
- output contract.
- citations.

### 26.3 Markdown Method Note

Filename pattern:

```text
urban_<method_slug>_method_note.md
```

Sections:

- Research question.
- Method.
- Data.
- Assumptions.
- Results placeholder.
- Limitations.
- Reproducibility.
- References.

### 26.4 TypeScript Adapter Snippet

Filename pattern:

```text
urban_<method_slug>_adapter.ts
```

Use only when relevant for app-internal customization:

- Transform result to map output.
- Transform result to dashboard binding.
- Transform result to report insert.
- Register evidence artifact.

## 27. Test and Validation Matrix

### 27.1 Unit Tests

| Area | Test focus |
|---|---|
| Context store | add/update/remove/select evidence, set map summary, set code artifact, reset context. |
| Scientific quality | data fitness scoring, method readiness, blocked states, caveat states. |
| Card metadata | validation for required high-value metadata. |
| Indicator catalog | formula metadata, result lineage, dashboard/report binding. |
| Code artifacts | generated filenames, headers, manifests, language inference. |
| Map selectors | AOI/layer/QA summary conversion from Map Explorer store state. |
| Report builders | structured sections, citations, limitations, QA caveats. |
| Dashboard builders | binding descriptors, uncertainty labels, scale fields. |

### 27.2 Component Tests

| Component | Test focus |
|---|---|
| `UrbanAnalyticsModal` | context strip, action states, Map Explorer toggle, editor/report actions. |
| `RailContainer` | scientific filters, evidence badges, search ranking, keyboard navigation. |
| `RightPanelFourBlock` | dossier tabs, readiness, data fitness, code artifact actions. |
| `IndicatorCatalogPanel` | compute, lineage display, report/dashboard/education routing. |
| `FlowHost` | map dispatch payload, completed run evidence registration. |

### 27.3 Integration Tests

| Flow | Expected result |
|---|---|
| Map AOI to Urban flow | Selected AOI appears in Urban context and compatible flows are highlighted. |
| Urban method to IDE | Named code artifact opens in IDE with manifest and source metadata. |
| Indicator to Report | Structured pending insert contains formula, assumptions, citation tokens. |
| Indicator to Dashboard | Dashboard binding includes value, unit, uncertainty, scale, and source id. |
| Workflow to Map | Completed run publishes layer through adapter with provenance and QA. |
| Urban to Education | Methodology explainer opens with correct focus request. |

### 27.4 E2E Smoke Tests

Minimum smoke path:

1. Open Urban Analytics modal.
2. Search for a spatial statistics method.
3. Select method card.
4. Open Map Explorer.
5. Select or simulate AOI/layer context.
6. Return to Urban Analytics.
7. Confirm method readiness changes.
8. Open related workflow.
9. Complete or simulate a run.
10. Publish to Map Explorer.
11. Open code artifact in IDE.
12. Queue report insert.
13. Bind indicator/dashboard output.

### 27.5 Performance Budgets

| Interaction | Target |
|---|---:|
| Open modal after initial app load | under 250 ms perceived after lazy chunks are cached. |
| Search/filter response | under 80 ms for full library. |
| Select card and update right panel | under 100 ms for cached content. |
| Register evidence artifact | under 20 ms. |
| Map context summary update | under 50 ms excluding map rendering. |
| Generate code artifact | under 150 ms for templates under 2000 lines. |

### 27.6 Accessibility Gates

- Modal focus trap works.
- Escape closes expected surface.
- Tab order is logical.
- Keyboard can reach rail filters, card list, tabs, and actions.
- Status colors have text labels.
- Tooltips are not the only way to understand critical status.
- Buttons do not overflow at narrow modal widths.

## 28. Migration Rules

The upgrade should follow these non-regression rules:

- Do not remove or rename existing public event names without compatibility wrappers.
- Do not merge Map Explorer store into Urban Analytics.
- Do not make `UrbanAnalyticsModal.tsx` significantly larger if extracting can keep it readable.
- Do not add a second reporting model.
- Do not duplicate dashboard binding logic if `dataBindings.ts` can be extended.
- Do not replace existing seed modules wholesale.
- Do not break lazy-loaded flow boundaries.
- Do not assume every card has complete metadata during the migration. Use optional fields and fallback rendering.
- Do not treat demo data as real analysis.
- Do not publish report/dashboard outputs without visible QA caveats when data fitness is weak.

## 29. Developer Prompt Pack

### Prompt 01: Context Kernel

```text
Implement the Urban Analysis Context Kernel. Add optional context/evidence/reproducibility/code artifact types in src/features/urbanAnalytics/lib/types.ts. Create src/features/urbanAnalytics/context/useUrbanAnalysisContextStore.ts with actions for active context, evidence artifacts, map summary, IDE artifact, report binding, dashboard binding, and sync health. Add builder helpers and unit tests. Do not change the visible UI yet.
```

### Prompt 02: Map Context Summary

```text
Implement Urban map context selectors. Read useMapExplorerStore state and produce a compact UrbanMapContextSummary with AOI, bounds, selected layers, selected features, visible analysis layers, QA summary, and viewport. Add tests for empty state, AOI state, selected layer state, and QA warning state. Do not duplicate map layer ownership.
```

### Prompt 03: Scientific Metadata Validation

```text
Extend Urban Analytics card metadata with data requirements, validity envelope, assumptions, failure modes, references, compatibility flags, and education links. Add a dev-only validation helper for high-value cards. Update spatialStats, urbanIndicators, transportNetworks, vulnerability, remoteSensing, and voxcity seeds first. Add tests for validation output.
```

### Prompt 04: Right Panel Dossier

```text
Upgrade RightPanelFourBlock into a scientific dossier while preserving its four tabs. Add method readiness, data fitness, evidence list, code artifact actions, report/dashboard/map/education action states, and formatted assumptions/limitations/references. Extract formatting helpers into rightPanelUtils or context helpers as needed. Add component tests.
```

### Prompt 05: Rail Research Navigator

```text
Upgrade RailContainer with scientific filters, method readiness badges, map compatibility indicators, evidence counters, and context-aware Fuse ranking. Preserve existing search, tags, favorites, recents, and collapsible groups. Add tests for filter combinations and ranking behavior.
```

### Prompt 06: Indicator Traceability

```text
Extend the indicator catalog and computed indicator records with formula metadata, units, denominator, scale envelope, uncertainty, data fitness, report binding, dashboard binding, and education links. Update IndicatorCatalogPanel, indicatorInserts, and dashboard dataBindings to display and propagate this metadata. Add unit and snapshot tests.
```

### Prompt 07: Workflow Manifests

```text
Add reproducibility manifest builders for completed analytical workflow runs. Update FlowHost and priority flows so completed runs register Urban evidence artifacts and include inputs, parameters, AOI, CRS, QA, outputs, citations, and software notes. Start with Accessibility, Vulnerability, CompositeIndicator, ScenarioComparison, EquityAudit, and ChangeDetection.
```

### Prompt 08: Map Adapter Evidence

```text
Extend MapEngineAdapter and MapAnalysisDispatcher so Urban Analytics context metadata can travel from map selections into flows and from completed runs back into map layers. Add evidence ids, context id, provenance, and QA summaries where compatible. Add adapter and dispatcher tests.
```

### Prompt 09: IDE Code Artifacts

```text
Create Urban code artifact builders for Python scripts, JSON manifests, Markdown method notes, and TypeScript adapter snippets. Add a safe IDE bridge helper that opens named artifacts in Synapse IDE without replacing active content by default. Register generated artifacts in the Urban context store. Add tests for filenames, headers, and manifest content.
```

### Prompt 10: Structured Reporting

```text
Create an Urban report artifact builder that produces structured pending report inserts with method, data, results, limitations, QA, reproducibility, and citations. Integrate with existing reporting services and map report handoff. Add snapshot tests for indicator, workflow, and map evidence report inserts.
```

### Prompt 11: Dashboard and Education Sync

```text
Add Urban dashboard binding descriptors and education focus routing. Update dashboard bindings and EducationModule focus handling so Urban evidence can open relevant charts and methodology explainers. Add tests for indicator dashboard binding and urban:education:focus routing.
```

### Prompt 12: Premium UI Polish and Release Validation

```text
Refine the Urban Analytics modal visual system after the data model is in place. Add context strip, evidence tray, compact status chips, improved action bar, responsive checks, and accessibility improvements. Run typecheck, lint, unit tests, build, and targeted E2E smoke tests for Urban Analytics, Map Explorer sync, IDE handoff, report queue, and dashboard binding.
```

## 30. Final Quality Bar

The Urban Analytics module should be considered premium only when it meets all of the following:

- The user can see the active study area, method, data, QA, and evidence state at a glance.
- Every advanced method exposes assumptions, data requirements, validity envelope, and references.
- Map Explorer selections change Urban method readiness in a typed and visible way.
- Urban workflow outputs publish to Map Explorer with provenance and QA metadata.
- Urban indicators move to report and dashboard with formula, uncertainty, and scale labels.
- Urban methods generate IDE code artifacts with filenames, manifests, dependencies, and limitations.
- Report inserts are structured, citation-ready, and reproducible.
- Education links explain difficult methods at the point of need.
- VoxCity/3D outputs are linked to evidence, map context, and reproducibility.
- Demo data, weak data, blocked QA, and exploratory outputs are clearly labeled.
- The modal remains fast, compact, accessible, and visually coherent.
- The general application structure remains intact.

## 31. Tri-Modal Alignment Charter

This section is the binding alignment layer between:

- `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`

It exists so the three plans evolve as one premium scientific workbench rather than three visually polished but disconnected modules. It does not generate the future sequential prompts. It only defines the operational, wire/layout, synchronization, and premium-design standard those prompts must follow later.

The standalone canonical version of this alignment layer is `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`. When future prompt sequences are generated, that file should be treated as the shared source of truth across the three module plans.

### 31.1 Shared Product Model

The workbench has three primary surfaces:

| Surface | Product role | State ownership | Primary output |
|---|---|---|---|
| Synapse IDE | Coder, file, terminal, script, manifest, and AI apply surface. | editor tabs, file tree, AI plans, tasks, terminal sessions, generated code artifacts. | code artifacts, manifests, notebooks, diffs, execution notes. |
| Map Explorer | Spatial operating surface. | viewport, layers, AOI, selections, QA, drawing, measurement, temporal state, map evidence, report snapshots. | map layers, map evidence, spatial QA, publication exports, map report handoffs. |
| Urban Analytics | Scientific reasoning and methodology surface. | method cards, indicators, data fitness, evidence tray, workflow interpretation, report/dashboard/education bindings. | urban evidence, method dossiers, indicator records, report sections, dashboard bindings. |

The IDE must not become a map store. Map Explorer must not become a methodology catalog. Urban Analytics must not become a code editor or map renderer. Premium synchronization means each surface keeps its ownership and publishes typed summaries to the others.

### 31.2 Shared Work Cycle

All three plans must support the same evidence lifecycle:

```text
Question -> Context -> Data -> QA -> Method -> Run -> Evidence -> Code -> Map -> Report -> Dashboard -> Review
```

Urban Analytics responsibility in this lifecycle:

- define the scientific method, assumptions, data requirements, validity envelope, and interpretation;
- translate map context into data fitness and method readiness;
- convert map/code/report/dashboard outputs into an evidence system;
- keep uncertainty, limitations, ethics, references, report bindings, dashboard bindings, and education links visible;
- request Map Explorer context without owning map state;
- request Synapse IDE code artifacts without owning editor state.

Map Explorer responsibility in this lifecycle:

- define spatial context through viewport, AOI, selected features, visible layers, QA, and temporal state;
- publish derived spatial layers and map evidence;
- create report/export-ready map snapshots and manifests.

Synapse IDE responsibility in this lifecycle:

- open or create scripts, manifests, notebooks, SQL, markdown notes, and adapter files;
- preserve provenance of generated artifacts;
- receive map and urban artifacts as named, reversible code/file outputs.

### 31.3 Shared Wire/Layout Contract

The three modules must look like coordinated zones in one professional workbench.

Canonical desktop wire:

```text
Global app shell
  Top command/status band
  Left navigation or asset rail
  Primary work surface
  Right context/dossier/inspection rail
  Bottom status, terminal, timeline, or output band
```

IDE wire:

```text
Top: header, tabs, run/build/sync status
Left: activity rail + file explorer/search/git-like future slots
Center: Monaco editor, diff/editor groups, preview when relevant
Right: AI assistant, bridge panes, artifact metadata
Bottom: terminal, problems, tasks, output, plan history
```

Map Explorer wire:

```text
Top: map cockpit, mode, sync, QA, save/readiness status
Left: layer/evidence rail, imports, cartography, source metadata
Center: map canvas and direct spatial interaction
Right: QA, workflow, report handoff, NL query, review timeline
Bottom: coordinates, scale, CRS, temporal player, active tool, memory/worker state
```

Urban Analytics wire:

```text
Top: research context, search, study area, sync, QA, evidence count
Left: method/indicator/library rail with filters and readiness badges
Center: analytical workflow and current research task
Right: four-block scientific dossier: methodology, data, code, references
Bottom/Tray: evidence timeline, report/dashboard/IDE/map actions
```

Urban-specific wire obligations:

- The center surface remains the analytical reasoning and workflow zone.
- The left rail is a method and indicator navigator, not a generic menu.
- The right four-block panel is the scientific dossier and must stay aligned with Map Explorer QA and IDE code artifacts.
- The evidence tray is the cross-module continuity surface.
- On constrained layouts, dossier and evidence tray collapse without hiding active method context.

### 31.4 Shared Premium Design Contract

The premium design language is:

- dark professional shell with restrained contrast;
- compact panels;
- precise icon buttons with labels/tooltips;
- visible status chips for sync, QA, readiness, provenance, and unsaved state;
- no large decorative hero sections inside tool surfaces;
- no vague cards that do not perform an action;
- no card-in-card UI for dense workbench areas;
- no hidden disabled states;
- no text overflow in buttons, chips, tabs, or row labels;
- stable dimensions for rails, toolbars, rows, tabs, and status bands;
- color used as a signal only when paired with text or icon meaning.

Shared status vocabulary:

| Status | Meaning | Visual treatment |
|---|---|---|
| Ready | Action can run with current context. | compact positive chip, no exaggerated success treatment. |
| Ready with caveats | Action can run but limitations must travel with output. | warning chip with caveat count. |
| Needs context | Missing AOI, layer, file, method, field, or destination. | neutral chip with specific missing item. |
| Blocked | Scientific, safety, or data issue prevents formal output. | error chip plus exact blocker. |
| Demo/sample | Output uses sample data or fixture mode. | persistent sample label. |
| Unsynced | Another module has not received current state. | sync chip and action. |

### 31.5 Shared Synchronization Contract

The three modules should share one typed integration spine.

Canonical event families:

| Family | Direction | Purpose |
|---|---|---|
| `ide:*` | IDE to workbench | Open, update, annotate, or publish code/file artifacts. |
| `map:*` | Map Explorer to workbench | Publish map context, layer evidence, QA, exports, and workflow outputs. |
| `urban:*` | Urban Analytics to workbench | Publish method context, evidence artifacts, report/dashboard bindings, and data fitness. |
| `synapse:navigate` | shared | Move between tabs, flows, report, dashboard, map, education, and IDE surfaces. |
| `reporting/*` | reporting | Queue or refresh structured report inserts. |

Canonical artifact references:

```text
artifactId
artifactKind
sourceModule
sourceId
createdAt
title
summary
provenance
qa
relatedLayerIds
relatedCardIds
relatedFlowIds
relatedFilePaths
manifestId
reportInsertId
dashboardBindingId
```

Rules:

- Large data is never copied through events.
- Events carry ids, summaries, manifests, and references.
- Every generated code artifact links back to map/urban evidence when applicable.
- Every map evidence artifact can be converted into an Urban evidence artifact.
- Every Urban method can request map context and IDE artifact generation.
- Every report/dashboard insert carries QA and provenance.

### 31.6 Urban-Specific Alignment Obligations

Urban Analytics must implement the alignment standard as follows:

- Method cards must declare the map context and IDE artifact requirements they need.
- Data fitness must consume Map Explorer QA and layer summaries rather than duplicating map ownership.
- The right-panel code tab must link to Synapse IDE artifacts with filenames, manifests, dependencies, and limitations.
- The methodology and data tabs must reuse the same QA caveats that appear in Map Explorer and report outputs.
- The evidence tray must show artifacts from all three modules with consistent artifact ids.
- Report/dashboard/education actions must carry provenance and scientific limitations.
- The Urban modal must visually match the density and status vocabulary of IDE and Map Explorer.

### 31.7 Cross-Plan Acceptance Gate

No future implementation prompt should be considered complete if it improves only one module visually while breaking cross-module coherence.

Shared acceptance criteria:

- The same artifact can be opened from its owning module and referenced from the other two.
- The same QA caveat appears consistently in IDE manifest, Map Explorer panel, Urban dossier, report insert, and dashboard binding where relevant.
- A user can move from Urban method -> Map context -> IDE script -> Map output -> Report insert without losing provenance.
- A user can move from IDE generated file -> Map layer -> Urban method recommendation without duplicate state ownership.
- A user can move from Map layer -> Urban evidence -> IDE reproducibility script without manual copy-paste.

### 31.8 Prompt-Readiness Note

Future sequential prompts must be generated later from the three aligned plans in this order:

```text
Foundation sync contracts -> IDE artifact handling -> Map context/evidence -> Urban context/evidence -> cross-module workflows -> premium UI polish -> validation
```

This section intentionally stops at alignment. It does not create the future prompt sequence.
