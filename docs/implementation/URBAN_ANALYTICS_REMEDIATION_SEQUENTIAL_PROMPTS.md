# SynapseCore Urban Analytics - Remediation Sequential Prompts

## Prompt 01 - Remediation Program Bootstrap, Truthfulness Doctrine, and Execution Rules

### Objective

Establish the operating doctrine for the remediation program so every subsequent prompt is executed truthfully, in sequence, and at production-grade quality rather than demo-grade appearance.

### Permanent operating rules for all subsequent prompts

This file is the execution counterpart of `URBAN_ANALYTICS_PROMPT_AUDIT_AND_REMEDIATION.md`.

Read every prompt as an implementation milestone, not as a suggestion. Each prompt must be completed, validated, documented, and truthfully reported before the next prompt begins unless an explicit dependency note allows overlap.

#### Core remediation doctrine

- Do not describe a surface as complete if it is reachable but still demo-wired, sample-only, partially persisted, or missing provenance.
- Do not describe a surface as production-ready if it depends on synthetic fixtures unless the UI explicitly labels it as `Demo mode`.
- Do not hide residuals in prose. Every unresolved limitation must be stated in the completion report and any user-facing surface affected by it.
- Do not leave placeholder copy such as "not yet", "coming soon", "no details yet", or "no references listed" inside production UX unless the prompt explicitly requires a temporary scaffold and labels it as temporary.
- Prefer real project data paths over sample data paths. Sample data may remain as a guided quick-start, but never as the only meaningful runtime path for an implemented feature.
- Every visible analytical tool must expose enough metadata for interpretation, reproducibility, and reporting.
- Every prompt that changes UI must preserve professional presentation: loading states, empty states, error states, result inspection, and export/publication behavior.
- Every prompt that changes runtime behavior must update documentation so repository truth, UI truth, and release truth stay aligned.

#### Sequence discipline

- Execute prompts strictly in order.
- Do not begin a downstream prompt if an upstream dependency is incomplete.
- If a prompt uncovers an architectural blocker, resolve it within the same prompt if feasible; otherwise document the blocker and stop rather than layering over it.
- Preserve existing working behavior unless the prompt explicitly authorizes refactoring or redesign.

#### Truthfulness rules for demo and real modes

- Any feature that still supports a synthetic or sample-backed path must surface that state explicitly in UI and persisted metadata.
- Real-data mode and demo mode must not share ambiguous labels.
- Saved analytical runs must capture whether the run used:
  - real project data
  - imported local file data
  - remote connector data
  - synthetic demo data

#### Documentation rules

- Every prompt must update the current-state documentation affected by the change.
- Missing completion reports must be created as part of the relevant prompt, not deferred indefinitely.
- Release documentation must distinguish between:
  - launch verified
  - execution verified
  - demo-mode verified
  - external dependency gated

#### Global validation gate

Run these checks after every substantial prompt unless a script is genuinely unrelated to the changed scope:

1. `npm run typecheck`
2. `npm run build`
3. `npm run test`
4. Targeted Playwright coverage for every changed user-facing flow

Additional gates for release-facing or shell-level prompts:

5. `npm run lint:errors`
6. `npm run perf:budgets`
7. `npm run test:e2e:smoke`

#### Mandatory completion report format

After each prompt, produce a concise report in the following format and save a matching implementation note under `docs/implementation/` whenever the prompt changes repository truth:

```md
### Remediation Prompt XX - Completion Report
- Scope Completed:
- Key Files Added or Updated:
- User-Facing Surfaces Added or Corrected:
- Runtime Truthfulness Improvements:
- Validation Performed:
- Residual Risks:
- Follow-Up Required Before Next Prompt:
```

#### Prompt surface declaration rule

Every remediation prompt below is required to name the repository surfaces it governs. Those surface declarations are part of the acceptance contract, not optional author notes.

- `Primary code surfaces` identify the exact source files, tests, and entry points that must be inspected or changed.
- `Documentation surfaces` identify the exact current-state, implementation, or release docs that must be updated when the prompt changes repository truth.
- `Validation surfaces` identify the minimum automated checks or named Playwright specs that must be updated or executed for that prompt.
- If implementation uncovers a necessary additional file outside the declared surface list, the prompt completion note must name that file explicitly and explain why it became part of scope.

### Prompt

Before any feature-specific work begins:

- Read `URBAN_ANALYTICS_PROMPT_AUDIT_AND_REMEDIATION.md` in full.
- Convert its findings into an explicit delivery sequence using this document as the controlling instruction set.
- Treat the ten remediation themes in the audit as mandatory scope, not optional suggestions.
- Ensure every subsequent prompt references the exact code surfaces and docs it is expected to change.

### Deliverables

- A stable remediation doctrine for the rest of the sequence.
- A completion-report convention that makes residuals visible.
- Clear expectations for demo mode, real mode, provenance, and documentation truthfulness.

### Acceptance criteria

- The remediation sequence can be executed by implementation agents without ambiguity.
- No later prompt can legitimately claim completion while hiding demo-only behavior or stale docs.
- Validation and reporting requirements are explicit from the start.

### Prompt 01 repository surfaces

Primary code surfaces:
- `URBAN_ANALYTICS_PROMPT_AUDIT_AND_REMEDIATION.md`
- `URBAN_ANALYTICS_REMEDIATION_SEQUENTIAL_PROMPTS.md`

Documentation surfaces:
- `docs/implementation/prompt-01-completion.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run lint:errors`
- `npm run perf:budgets`
- `npm run test:e2e:smoke`
- Targeted Playwright coverage: not applicable unless Prompt 01 introduces user-facing UI changes alongside governance changes

### Audit theme traceability

The ten remediation themes from `URBAN_ANALYTICS_PROMPT_AUDIT_AND_REMEDIATION.md` are mandatory scope. The sequence below expands them for implementation, but it does not downgrade or waive any of them.

| Audit remediation theme | Sequence prompt ownership | Required closure output |
|---|---|---|
| Governance sync and truthful completion ledger | Prompt 02 | Current-state docs, ledger, missing completion notes, release-doc truth reset |
| EO connector operator surface | Prompts 03-04 | Shared EO source foundation plus visible STAC/COG/Sentinel Hub workflows |
| Real raster-backed land-cover classification | Prompt 05 | Real raster input selection, provenance, explicit demo mode |
| Live NL-to-SQL against project data | Prompt 06 | Real table/schema inspection, safe live execution, review artifacts |
| Real-model object detection with explicit demo mode | Prompt 07 | Real model-loading path, persisted run metadata, explicit fallback labeling |
| VoxCity real-data bridges | Prompt 08 | Building and sunlight workflows wired to project data, with sample mode demoted to optional quick-start |
| Emerging hot spot discoverability and validation | Prompt 09 | Workflow-level entry point, completed-run wiring, dedicated validation |
| Report history and right-panel substance closure | Prompts 10-11 | Real snapshots/change history plus placeholder-free right-panel content |
| Premium UI refactor and design-system hardening | Prompt 12 | Modularization, tokenized styling, maintainability improvement |
| Release-candidate hardening and truthful QA | Prompt 12 | Clean smoke teardown, expanded execution-grade validation, truthful release docs |

---

# Phase 1 - Governance and Data Foundations

## Prompt 02 - Governance Sync, Current-State Ledger, and Documentation Reconciliation

### Objective

Repair the documentation layer so it reflects current implementation reality and can govern the remediation program without misleading engineers or release reviewers.

### Prompt

Perform the following work:

- Rebuild `docs/implementation/module-matrix.md` so it reflects the actual current repository state rather than historical stub status.
- Add a new `docs/implementation/prompt-status-ledger.md` summarizing prompts `01-43` with a truthful status vocabulary:
  - `implemented`
  - `implemented with demo mode`
  - `implemented with residual gap`
  - `environment-dependent`
  - `deferred`
- Create missing completion reports for prompts that are already materially implemented but undocumented:
  - `08, 09, 10, 11, 12, 13, 25, 26, 27, 28, 29, 32, 33, 35, 36, 37, 38, 39, 40, 41, 43`
- Update `docs/release/visual-completeness-checklist.md` and `docs/release/release-candidate-validation.md` so every claim uses the truthful status vocabulary above.
- Add a short documentation note that explains how release visibility differs from execution depth.
- Ensure Prompt 42 completion documentation no longer over-claims debt closure where live placeholders still remain.

### Implementation requirements

- Preserve historical context where useful, but current-state docs must be clearly separated from historical baseline notes.
- If a surface is demo-only today, document it as demo-only rather than "complete".
- If a surface depends on external credentials or endpoints, document that dependency explicitly.
- The new ledger must be maintainable by future prompts without a full rewrite.

### Deliverables

- Corrected `module-matrix.md`
- New `prompt-status-ledger.md`
- Missing completion docs for already-implemented prompts
- Updated release docs using truthful terminology

### Expected repository surfaces

Primary code surfaces:
- `src/services/data/connectors/STACClient.ts`
- `src/services/data/connectors/COGReader.ts`
- `src/services/data/connectors/SentinelHubConnector.ts`
- `src/engine/geoai/hooks/useLandCoverClassification.ts`
- `src/centerpanel/Tools/components/GeoAILab.tsx`
- `src/centerpanel/components/ObjectDetectorPanel.tsx`
- `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
- `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`
- `src/centerpanel/components/MapEmergingHotSpotViz.tsx`
- `src/centerpanel/tabs/Note.tsx`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`

Documentation surfaces:
- `docs/implementation/module-matrix.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/prompt-08-completion.md`
- `docs/implementation/prompt-09-completion.md`
- `docs/implementation/prompt-10-completion.md`
- `docs/implementation/prompt-11-completion.md`
- `docs/implementation/prompt-12-completion.md`
- `docs/implementation/prompt-13-completion.md`
- `docs/implementation/prompt-25-completion.md`
- `docs/implementation/prompt-26-completion.md`
- `docs/implementation/prompt-27-completion.md`
- `docs/implementation/prompt-28-completion.md`
- `docs/implementation/prompt-29-completion.md`
- `docs/implementation/prompt-32-completion.md`
- `docs/implementation/prompt-33-completion.md`
- `docs/implementation/prompt-35-completion.md`
- `docs/implementation/prompt-36-completion.md`
- `docs/implementation/prompt-37-completion.md`
- `docs/implementation/prompt-38-completion.md`
- `docs/implementation/prompt-39-completion.md`
- `docs/implementation/prompt-40-completion.md`
- `docs/implementation/prompt-41-completion.md`
- `docs/implementation/prompt-42-completion.md`
- `docs/implementation/prompt-43-completion.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`
- `docs/release/known-risks-and-limitations.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run lint:errors`
- `npm run perf:budgets`
- `npm run test:e2e:smoke`
- Targeted Playwright coverage: not required unless documentation reconciliation is paired with user-facing truth corrections in the same change set

### Acceptance criteria

- No implemented module remains marked missing or stubbed in current-state documentation.
- Every prompt `02-43` has a current state entry.
- Release docs no longer imply production-grade depth where only launch reachability was tested.

### Dependency note

Prompt 03 and beyond must not begin until this prompt is complete, because the rest of the sequence depends on a trustworthy implementation ledger.

---

## Prompt 03 - Shared EO Source Registry, Provenance Contracts, and Operator Surface Foundation

### Objective

Create the shared data and UI foundation required to turn the EO connector stack into real operator-facing product surfaces and to support downstream GeoAI real-data workflows.

### Prompt

Implement a shared Earth Observation source foundation spanning UI, store contracts, publication metadata, and downstream analytical consumption.

Required work:

- Define a shared raster/EO source contract under a reusable location such as:
  - `src/services/data/eo/`
  - `src/services/data/types/`
  - or another coherent current architecture location
- The contract must support, at minimum:
  - STAC search result items
  - selected COG assets
  - Sentinel Hub process outputs
  - imported raster layers
  - demo raster sources
- Add provenance fields for:
  - source kind
  - provider
  - source URL or asset reference
  - bbox / spatial extent
  - time range or acquisition timestamp
  - CRS
  - resolution
  - band mapping
  - whether the source is demo or real
- Build the base operator-facing UI shell in Toolbox or Map Explorer for EO workflows, with clearly separated sections for:
  - STAC catalog search
  - COG inspection
  - Sentinel Hub process requests
  - selected source summary
- Add project-extent and current-map-bbox support for spatial query envelopes.
- Add publication hooks so selected EO sources can be promoted into map layers, dataset registry entries, or completed-run metadata.
- Make the shared EO source registry consumable by downstream prompts without duplicating source resolution logic.

### Implementation requirements

- Do not implement land-cover or object detection specific logic here beyond the shared source contracts and UI foundation.
- Design the source registry so later prompts can ask "what raster source is currently selected for analysis?" without scraping UI state.
- Every EO source shown in UI must expose truthful runtime state: ready, loading, failed, credential-missing, or demo.

### Deliverables

- Shared EO source types and registry/store layer
- Initial EO operator panel
- Publication/provenance integration points
- Tests covering source registration and UI state transitions

### Expected repository surfaces

Primary code surfaces:
- `src/services/data/connectors/STACClient.ts`
- `src/services/data/connectors/COGReader.ts`
- `src/services/data/connectors/SentinelHubConnector.ts`
- `src/services/data/eo/`
- `src/centerpanel/Tools/components/EOConnectorPanel.tsx`
- `src/centerpanel/Tools/ToolsActionPanel.tsx`
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-status-ledger.md`
- `docs/implementation/prompt-08-completion.md`
- `docs/implementation/prompt-09-completion.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/services/data/eo/__tests__/`
- `src/centerpanel/Tools/components/__tests__/EOConnectorPanel.test.tsx`
- `e2e/eo-connectors.spec.ts`

### Acceptance criteria

- The repository has a single coherent EO source contract rather than scattered ad hoc source objects.
- A user can select or inspect an EO source from a visible UI panel.
- Downstream prompts can consume EO sources without inventing their own source model.

### Dependency note

Prompts 04 and 06 depend on this source foundation.

---

## Prompt 04 - STAC, COG, and Sentinel Hub as First-Class Operator Tools

### Objective

Complete the productization of Prompts 08 and 09 by turning the existing connector libraries into fully visible, operator-usable remote-sensing tools.

### Prompt

Extend the EO surface from Prompt 03 into a production-facing operator workflow.

Required work:

- Wire `src/services/data/connectors/STACClient.ts` into a searchable STAC UI:
  - collection filters
  - bbox / extent controls
  - time filters
  - cloud cover or relevant query filters where available
  - result list with enough metadata for selection
- Wire `src/services/data/connectors/COGReader.ts` into a usable COG inspection flow:
  - metadata preview
  - CRS / dimensions / overview display
  - window preview or sample read capability
  - clear error handling for non-COG or unavailable assets
- Wire `src/services/data/connectors/SentinelHubConnector.ts` into a real operator surface:
  - credential state
  - process/catalog request controls
  - meaningful error feedback
  - explicit external dependency messaging
- Let users publish selected or generated EO outputs into Map Explorer or the shared source registry for downstream analytical use.
- Persist connector actions into provenance and, where appropriate, completed-run logs or import history.
- Add targeted Playwright coverage for:
  - STAC search result listing
  - COG metadata inspection
  - Sentinel Hub credential-missing state
  - successful EO source selection and publication

### Implementation requirements

- Do not leave the connectors discoverable only through capability lists or documentation.
- Do not fake successful Sentinel Hub execution when credentials are missing.
- Make demo/fallback paths explicit if any sandbox-safe mock provider is introduced for local validation.

### Deliverables

- Complete EO connector UI workflow
- Connector-to-map publication path
- Provenance persistence for EO sources
- Prompt 08 and 09 completion docs

### Expected repository surfaces

Primary code surfaces:
- `src/services/data/connectors/STACClient.ts`
- `src/services/data/connectors/COGReader.ts`
- `src/services/data/connectors/SentinelHubConnector.ts`
- `src/services/data/eo/`
- `src/centerpanel/Tools/components/EOConnectorPanel.tsx`
- `src/centerpanel/Tools/ToolsActionPanel.tsx`
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-08-completion.md`
- `docs/implementation/prompt-09-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/services/data/connectors/__tests__/STACClient.test.ts`
- `src/services/data/connectors/__tests__/COGReader.test.ts`
- `src/services/data/connectors/__tests__/SentinelHubConnector.test.ts`
- `src/centerpanel/Tools/components/__tests__/EOConnectorPanel.test.tsx`
- `e2e/eo-connectors.spec.ts`

### Acceptance criteria

- A user can search STAC, inspect a COG, and attempt or execute a Sentinel Hub request without touching code.
- Connector runtime state is visible and truthful.
- Prompts 08 and 09 become clearly discoverable in the main application surface.

---

# Phase 2 - GeoAI Real-Data Upgrade

## Prompt 05 - Real Raster-Backed Land Cover Classification with Explicit Demo Mode

### Objective

Upgrade the land-cover pipeline from a synthetic default to a real-data analytical workflow that still retains an explicitly labeled demo path for offline or controlled validation.

### Prompt

Refactor the current land-cover workflow so it can operate against the shared EO source foundation and imported raster sources.

Required work:

- Replace hardwired synthetic-default behavior in the land-cover UI path and supporting hook(s).
- Allow the user to choose among:
  - imported raster sources
  - STAC/COG-selected sources
  - Sentinel Hub outputs
  - explicitly labeled demo mode
- Show source metadata in the UI before execution:
  - source kind
  - provider
  - extent
  - CRS
  - band mapping
  - resolution
  - acquisition or time range if applicable
- Persist the exact input source and runtime mode inside the saved analytical run and any map publication metadata.
- Update UI language so the user always knows whether the classification is running on `real source` or `demo source`.
- Preserve the existing classifier, post-processing, and accuracy-report logic where it is already correct.
- Add tests and Playwright coverage for:
  - source selection
  - demo-mode labeling
  - real-source run
  - publication to map
  - completed-run persistence

### Implementation requirements

- Do not silently fall back from real mode to demo mode.
- If a source is not analysis-ready, surface the reason and block execution rather than pretending to run.
- Accuracy and summary reporting must remain inspectable after the move to real data.

### Deliverables

- Real-data-capable land-cover UI and runtime path
- Explicit demo-mode labeling
- Updated GeoAI completion docs for Prompt 13
- Validation coverage for both real and demo paths

### Expected repository surfaces

Primary code surfaces:
- `src/engine/geoai/hooks/useLandCoverClassification.ts`
- `src/centerpanel/Tools/components/GeoAILab.tsx`
- `src/services/data/eo/`
- `src/services/map/MapEngineAdapter.ts`
- `src/centerpanel/components/MapExplorerModal.tsx`

Documentation surfaces:
- `docs/implementation/prompt-13-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/engine/geoai/hooks/__tests__/useLandCoverClassification.test.ts`
- `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`
- `e2e/geoai-real-data.spec.ts`

### Acceptance criteria

- Land-cover classification can run on user-selected real raster inputs.
- Demo mode remains available but is visibly distinguished from real analysis.
- Prompt 13 is no longer only a synthetic study-scene surface.

### Dependency note

Depends on Prompts 03 and 04.

---

## Prompt 06 - Live Natural Language to Spatial SQL Against Project Data

### Objective

Upgrade Prompt 14 from deterministic demo query generation over hardcoded collections to safe, inspectable, live SQL over project and imported data.

### Prompt

Refactor the NL-to-SQL surface and supporting data plumbing so it operates on the real project data context.

Required work:

- Remove the hard dependency on demo-only collections from the GeoAI Lab query surface.
- Expose live table and field metadata from the actual sandboxed spatial database or imported dataset registry.
- Let the user inspect:
  - available tables or layers
  - field names and basic types
  - geometry type
  - approximate row counts or sample records
  - intended spatial functions and filters
- Execute accepted SQL against the live sandboxed data engine, not against hardcoded demo fixtures.
- Preserve strict rejection of mutating or unsafe queries.
- Save enough execution metadata for reporting and review:
  - input prompt
  - interpretation summary
  - generated SQL
  - tables referenced
  - whether execution succeeded
  - result row count
- Publish accepted results to map and completed-run review surfaces.
- Add targeted tests and Playwright coverage for:
  - real imported layer query
  - safe rejection path
  - publication of accepted results

### Implementation requirements

- Do not remove deterministic interpretability. The user must still see how the prompt was interpreted.
- If a requested table or field does not exist, the UI must explain that clearly.
- If no suitable live datasets exist, offer an explicit demo path rather than silently swapping to demo data.

### Deliverables

- Live-data NL-to-SQL execution path
- Data schema inspection UI
- Query provenance and saved-run metadata
- Updated Prompt 14 completion documentation

### Expected repository surfaces

Primary code surfaces:
- `src/centerpanel/Tools/components/GeoAILab.tsx`
- `src/engine/geoai/hooks/useQueryToSQLRunner.ts`
- `src/engine/geoai/nlp/QueryToSQL.ts`
- `src/engine/spatial-db/SpatialDB.ts`
- `src/engine/spatial-db/hooks/useSpatialDB.ts`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-14-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/engine/geoai/nlp/__tests__/QueryToSQL.test.ts`
- `src/engine/spatial-db/__tests__/SpatialDB.test.ts`
- `src/centerpanel/Tools/components/__tests__/GeoAILab.test.tsx`
- `e2e/geoai-real-data.spec.ts`

### Acceptance criteria

- NL-to-SQL can run on real project data.
- The UI no longer implies live querying while actually executing against demo collections.
- Prompt 14 becomes a truthful analytical tool rather than a demo wrapper.

### Dependency note

Depends on Prompt 02 for truthful docs and on the project-data source context already present in the app.

---

## Prompt 07 - Real-Model Object Detection with Preserved Demo Fallback

### Objective

Upgrade Prompt 18 from synthetic orchestration to a real browser-manageable model path while keeping a clearly labeled demo path for local fallback.

### Prompt

Refactor the object detection workflow to support real model-backed execution.

Required work:

- Introduce a real model-loading path through the existing GeoAI runtime and model registry infrastructure.
- Support imagery input from:
  - imported raster layers
  - EO connector outputs
  - explicitly labeled demo imagery
- Preserve the current synthetic inferrer only as `Demo mode`.
- Expose run metadata in UI and persisted results:
  - model id
  - backend
  - tile size
  - overlap
  - confidence thresholds
  - NMS parameters
  - source raster identity
  - demo vs real mode
- Ensure map publication and completed-run review remain intact after the refactor.
- Add tests for:
  - real model path using a browser-safe fixture or mocked runtime adapter
  - demo mode path
  - cancel/error behavior
  - publish-to-map and saved-run behavior
- Add targeted Playwright coverage for launching a real or mocked-real run from the workflow surface.

### Implementation requirements

- Do not present the demo pipeline as if it were a real weight-backed detector.
- If a real model cannot load, surface a truthful error or allow the user to switch to Demo mode explicitly.
- Preserve current class filtering and review affordances where they already work.

### Deliverables

- Real-model-capable object detection surface
- Explicit demo fallback
- Updated Prompt 18 completion documentation
- Validation coverage for both execution modes

### Expected repository surfaces

Primary code surfaces:
- `src/centerpanel/components/ObjectDetectorPanel.tsx`
- `src/centerpanel/components/objectDetectionPublish.ts`
- `src/engine/geoai/models/catalog.ts`
- `src/services/data/eo/`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-18-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/centerpanel/components/__tests__/objectDetectionPublish.test.ts`
- `src/centerpanel/components/__tests__/ObjectDetectorPanel.test.tsx`
- `e2e/geoai-real-data.spec.ts`

### Acceptance criteria

- Object detection is capable of a real model-backed run path.
- Demo mode is clearly labeled and never mistaken for the default production path.
- Prompt 18 becomes truthfully documented and wired.

### Dependency note

Depends on Prompts 03 and 04 for real raster source selection.

---

# Phase 3 - 3D and Spatiotemporal Workflow Elevation

## Prompt 08 - VoxCity Real-Data Bridges for Extrusion and Solar Analysis

### Objective

Lift the VoxCity extrusion and solar tools from sample-first utilities into project-data-aware analytical workflows.

### Prompt

Implement real project-data bridges for the relevant VoxCity tools.

Required work:

- Add real input paths into `BuildingViewer.tsx` from:
  - imported building footprint layers
  - project layers already present in Map Explorer
  - optional CityJSON-derived geometry where appropriate
- Remove auto-assumption that sample buildings are the default operational path.
- Keep sample data as a quick-start action, but not as the silently loaded truth unless no user-selected source is present and the UI clearly states that sample mode is active.
- Expose active input source metadata inside the viewer.
- Add a real-data handoff from selected building geometry into `SunlightSimulatorPanel.tsx`.
- Preserve export, map publication, and narrative-generation affordances.
- Persist provenance for extrusion and solar runs:
  - source layer or file
  - whether sample mode was used
  - input feature count
  - key geometry assumptions
- Add targeted Playwright coverage for:
  - loading a real building source into the extrusion viewer
  - launching a solar run from real geometry

### Implementation requirements

- Do not remove quick-start sample data; keep it as onboarding support.
- Do not leave the user guessing which source is currently powering the 3D scene.
- Avoid duplicating geometry ingestion logic across tools if a shared adapter can be created.

### Deliverables

- Real-data-capable building extrusion path
- Real-data-capable sunlight simulation input path
- Updated Prompt 15 and 17 current-state documentation

### Expected repository surfaces

Primary code surfaces:
- `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
- `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`
- `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`
- `src/centerpanel/Flows/VoxCity3DFlow.tsx`
- `src/centerpanel/Flows/SunlightSimFlow.tsx`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-15-completion.md`
- `docs/implementation/prompt-17-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx`
- `src/features/urbanAnalytics/voxcity/__tests__/SunlightSimulatorPanel.test.tsx`
- `e2e/voxcity-real-data.spec.ts`

### Acceptance criteria

- Users can run extrusion and solar analysis on project data without touching code.
- Sample mode remains available but explicitly labeled.
- VoxCity tools align better with the platform's overall data lifecycle.

---

## Prompt 09 - Emerging Hot Spot Analysis as a First-Class Workflow

### Objective

Promote the existing emerging hot spot capability into a discoverable, validated, reviewable workflow rather than a hidden toolbar-dependent advanced panel.

### Prompt

Perform the following work:

- Add a workflow-library entry and/or Toolbox entry for emerging hot spot analysis.
- Preserve the toolbar shortcut, but do not rely on it as the primary discovery path.
- Ensure the feature can be launched from a clearly named surface alongside other analytical workflows.
- Verify that outputs can be:
  - inspected in-panel
  - published to the map
  - saved into completed-run review
  - understood through legend and category metadata
- Add dedicated Playwright coverage for:
  - opening from the new product-level entry point
  - running the analysis
  - inspecting category counts and legend output
  - publication or saved-run review
- Create a proper Prompt 25 completion note that distinguishes between visibility and full workflow integration.

### Implementation requirements

- Preserve existing analytical logic if it is already correct.
- Focus remediation effort on discovery, persistence, reviewability, and validation.
- Ensure advanced users can still use the fast toolbar entry without losing the new primary navigation path.

### Deliverables

- First-class navigation entry for emerging hot spots
- Saved-run/review wiring if missing
- Prompt 25 completion documentation

### Expected repository surfaces

Primary code surfaces:
- `src/centerpanel/components/MapEmergingHotSpotViz.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/Flows/flowTypes.ts`
- `src/centerpanel/CenterPanelShell.tsx`
- `src/services/map/MapEngineAdapter.ts`

Documentation surfaces:
- `docs/implementation/prompt-25-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/centerpanel/components/map/__tests__/spatial-stats-viz.test.ts`
- `src/centerpanel/components/__tests__/MapEmergingHotSpotViz.test.tsx`
- `e2e/emerging-hot-spot.spec.ts`

### Acceptance criteria

- Emerging hot spot analysis is discoverable without requiring toolbar exploration.
- The feature is explicitly validated in automated testing.
- Prompt 25 becomes a fully integrated workflow surface.

---

# Phase 4 - Reporting, Substance, and Premium UX Closure

## Prompt 10 - Report Snapshots, Recent Changes, and Review Provenance

### Objective

Close the current report-workspace and review-history gaps so reporting and analytical review support reproducibility rather than only authored output.

### Prompt

Implement the missing project-history and review features in the Report workspace and supporting model layer.

Required work:

- Add snapshot support where the urban project model currently lacks it.
- Replace any `RecentChanges` placeholder or `null` return path with real data and a real UI surface.
- Ensure completed analytical runs, report edits, or other relevant review events can surface meaningful change history.
- Expose enough metadata for a reviewer to understand:
  - what changed
  - when it changed
  - what artifact or run was affected
  - whether the underlying source was real data or demo data
- Update any persistence or migration code required to support the new history model.
- Add tests for:
  - snapshot creation or retrieval
  - recent changes rendering
  - persistence compatibility
- Add targeted Playwright coverage for the report review/history path.

### Implementation requirements

- Preserve compatibility with existing saved sessions where feasible.
- If old sessions cannot fully populate the new history model, surface a truthful fallback rather than crashing or silently inventing history.
- Do not fake review history from static text.

### Deliverables

- Snapshot support for the relevant urban project/report model
- Working `RecentChanges` or equivalent review UI
- Updated Prompt 27 current-state documentation

### Expected repository surfaces

Primary code surfaces:
- `src/centerpanel/tabs/Note.tsx`
- `src/centerpanel/registry/types.ts`
- `src/features/collaboration/engine.ts`
- `src/features/collaboration/CollaborationProvider.tsx`
- `src/services/reporting/ReportBuilderPanel.tsx`

Documentation surfaces:
- `docs/implementation/prompt-27-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/centerpanel/tabs/__tests__/Note.test.tsx`
- `src/features/collaboration/__tests__/projectHistory.test.ts`
- `e2e/report-history.spec.ts`

### Acceptance criteria

- The Report workspace no longer contains dead placeholder review-history surfaces.
- Users can inspect meaningful recent changes and snapshots where the product claims reviewability.
- Prompt 27 becomes materially closer to research-grade reproducibility.

---

## Prompt 11 - Right-Panel Substance Closure and Methodology Fallback System

### Objective

Eliminate visible placeholder content from the right panel and replace it with substantive, research-facing fallback material aligned with the seed library and methodology framework.

### Prompt

Refactor the right-panel content pipeline so that empty cards become substantive fallback content rather than empty placeholder statements.

Required work:

- Remove production placeholder strings such as:
  - `No methodology details yet.`
  - `No data requirements specified.`
  - `No code snippets available.`
  - `No references listed.`
- Replace them with a derived-content system that can source from:
  - methodology seeds
  - section registry or hierarchy
  - canonical references
  - code examples associated with the selected topic
  - curated fallback summaries where no direct authored content exists
- Ensure the right panel always prefers specific content when available, but gracefully falls back to curated substantive content when it is not.
- Add a validation layer or test that prevents the four known placeholder strings from returning to production UX.
- Update Prompt 42 documentation so the debt-closure claim aligns with the corrected UI reality.

### Implementation requirements

- Fallback content must be concise, informative, and academically useful.
- Do not replace the old placeholders with new vague placeholders.
- Preserve the right panel's role as a scientific support surface, not merely decorative content.

### Deliverables

- Placeholder-free right-panel content system
- Test coverage blocking regression to empty placeholder language
- Updated Prompt 42 documentation

### Expected repository surfaces

Primary code surfaces:
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/seeds/index.ts`
- `src/features/urbanAnalytics/seeds/`

Documentation surfaces:
- `docs/implementation/prompt-42-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/known-risks-and-limitations.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- `e2e/right-panel-fallbacks.spec.ts`

### Acceptance criteria

- The right panel never shows empty filler text in production UX.
- Methodology, data requirements, code snippets, and references always resolve to useful content or curated fallback material.
- Prompt 42 can now be truthfully described as closed for this scope.

---

## Prompt 12 - Premium UI Architecture Refactor, Design-System Hardening, and Release Truthfulness

### Objective

Reduce maintainability risk, remove premium-UX inconsistencies, and finish release hardening with a truthful validation and documentation pass.

### Prompt

Perform a targeted UI architecture and release-hardening pass across the largest and most visible product surfaces.

Required work:

- Refactor the largest UI monoliths into smaller container and presentational modules where appropriate:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/features/dashboard/DashboardBuilder.tsx`
  - `src/centerpanel/tabs/Note.tsx`
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- Replace repeated hardcoded styling with semantic tokens or shared theme/module styles where possible.
- Reduce inline-style density in the critical shell, map, dashboard, report, and right-panel surfaces.
- Preserve current behavior while improving maintainability and consistency.
- Audit compact-width and constrained-height behavior so key analytical panels remain readable and unclipped.
- Resolve the map cleanup noise noted in `src/centerpanel/components/map/MapCanvas.tsx` so release-facing smoke runs do not emit avoidable teardown errors.
- Expand or update release-facing tests to cover the remediated surfaces introduced in this sequence:
  - EO connector workflow
  - real-data land cover
  - live NL-to-SQL
  - real or explicitly labeled demo object detection
  - emerging hot spot workflow
  - report history
  - right-panel substantive fallback
- Update release docs and Prompt 43 documentation so they truthfully distinguish:
  - launch visibility
  - executed user journey
  - demo-mode validation
  - externally gated validation

### Implementation requirements

- Do not treat this prompt as a visual-only pass. It must improve maintainability, truthfulness, and release confidence.
- Do not regress existing behavior while modularizing.
- If a full refactor is too risky for a file, extract the highest-risk sections and document the remaining debt explicitly.

### Deliverables

- Modularized or partially modularized premium UI surfaces
- Reduced styling inconsistency in critical panels
- Cleaned-up release validation behavior
- Final Prompt 43 completion documentation
- Updated release docs reflecting actual post-remediation truth

### Expected repository surfaces

Primary code surfaces:
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/features/dashboard/DashboardBuilder.tsx`
- `src/centerpanel/tabs/Note.tsx`
- `src/centerpanel/CenterPanelShell.tsx`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/styles/`
- `src/features/dashboard/`

Documentation surfaces:
- `docs/implementation/prompt-43-completion.md`
- `docs/implementation/prompt-status-ledger.md`
- `docs/release/visual-completeness-checklist.md`
- `docs/release/release-candidate-validation.md`
- `docs/release/known-risks-and-limitations.md`

Validation surfaces:
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run lint:errors`
- `npm run perf:budgets`
- `npm run test:e2e:smoke`
- `e2e/eo-connectors.spec.ts`
- `e2e/geoai-real-data.spec.ts`
- `e2e/voxcity-real-data.spec.ts`
- `e2e/emerging-hot-spot.spec.ts`
- `e2e/report-history.spec.ts`
- `e2e/right-panel-fallbacks.spec.ts`
- `e2e/release-candidate-ui.spec.ts`

### Acceptance criteria

- The most critical UI surfaces are easier to maintain and more consistent with the design system.
- Release tests cover the newly remediated flows at the correct truthfulness level.
- Smoke teardown no longer emits avoidable map cleanup abort noise.
- Prompt 43 becomes a truthful release-hardening milestone rather than a visibility-only signoff.

---

## Final execution expectation

By the end of this sequence:

- EO connectors must be visible and operator-usable.
- GeoAI surfaces must distinguish real-data and demo modes truthfully.
- VoxCity tools must accept project data, not only samples.
- Emerging hot spots must be first-class and validated.
- Report history and right-panel placeholders must be closed.
- Premium UI debt must be materially reduced.
- Documentation, implementation state, and release claims must match.

Any agent executing this sequence should assume that "works in the UI" is not enough. The bar for completion is: truthful, inspectable, reproducible, visible, and maintainable.
