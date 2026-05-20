# Map Explorer Sequential Implementation Prompts

## Document Role

This file converts the Map Explorer development plan into an ordered implementation prompt ladder for high-capability coding agents. It is written to prevent agent amnesia. Any agent, in any future session, must be able to resume Map Explorer implementation by reading this file plus the protocol, the alignment spec, the Map Explorer plan, the ledger, and the live repository.

This file is not a replacement for the product plan. It is an execution system.

## Canonical Source Chain

Every agent must read these files before acting:

1. `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
2. `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
3. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
4. `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
5. `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
6. `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
7. `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
8. This file.

The tri-modal alignment spec is the top-level product authority. The Map Explorer plan is the module authority. This prompt file is the ordered implementation authority. The ledger is the durable execution memory.

## Operating Pack

For automation-ready execution, start from:

`DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`

The machine-readable prompt catalog is:

`DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`

The next prompt helper is:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-map-explorer-prompt.ps1 -Json
```

The helper reads the ledger's Prompt Status Register. The ledger remains the execution source of truth.

## Amnesia-Proof Operating Rules

Use these rules in every prompt:

1. Do not rely on chat memory.
2. Do not assume prior prompt completion.
3. Read the ledger and verify the live repository.
4. Keep Map Explorer synchronized with Synapse IDE and Urban Analytics through contracts, not hidden coupling.
5. Preserve the existing Map Explorer shell and store architecture unless the prompt explicitly changes it.
6. Keep UI premium, map-first, dense, deterministic, and scientifically credible.
7. Make every map-derived evidence operation traceable.
8. Record every decision in the ledger.
9. Validate narrowly and honestly.
10. Stop when a dependency is missing or contradictory.

## Map Explorer Product Thesis

Map Explorer is the spatial operating surface of the tri-modal workbench. It owns live map state, viewport, layers, AOI, feature selection, drawing, measurement, spatial QA, layer provenance, map workflows, map-derived evidence, external geospatial services, publication maps, report handoffs, temporal playback, and 2D/3D spatial synchronization.

It must not become a generic map viewer, a methodology catalog, or an IDE. It must feel like a premium scientific GIS cockpit where every visual layer, spatial operation, QA caveat, workflow output, export, and report handoff is traceable, reversible where practical, and synchronized through explicit artifact contracts.

The module must support:

- Inspectable layer stack with provenance and QA.
- CRS, geometry, measurement, and scale discipline.
- AOI, feature selection, drawing, bookmarks, annotations, and measurements.
- Spatial workflow previews, reproducibility manifests, and derived layers.
- Urban Analytics handoffs for method context and evidence.
- Synapse IDE handoffs for map scripts, manifests, SQL, and file/layer references.
- Publication-grade map export with title, legend, scale, attribution, caveats, and reproducibility metadata.
- Report, dashboard, education, temporal, scenario, and VoxCity/3D outputs.
- Bounded memory and worker-aware performance.

## Core Module Boundaries

Map Explorer owns:

- Viewport, base map, layer registry, and visibility.
- Overlay layer data and derived map layers.
- AOI and feature selections.
- Drawing and measurement state.
- Map scientific QA.
- Map workflow previews and map workflow outputs.
- Map review timeline and audit state.
- Map export and report handoff metadata.

Urban Analytics owns:

- Method selection and interpretation.
- Indicator formulas and data fitness interpretation.
- Scenario reasoning and policy interpretation.
- Report/dashboard/education scientific meaning.

Synapse IDE owns:

- Editor state.
- Files and code buffers.
- Terminal execution.
- AI apply plans.
- Code artifact storage and editing.

Shared synchronization must use typed contracts, stores, services, bridge adapters, or artifact references. Do not pass bulky geometry, large datasets, map instances, or hidden analytical state through generic UI events.

## Global Context Block For Every Agent

Paste or preserve this context in every implementation session:

```md
You are implementing Map Explorer inside the SynapseIDE urban analytics workbench.

Mandatory reading before editing:
- DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md
- DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md
- DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md
- DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md
- DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md
- DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json
- DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md
- DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md

Do not trust memory. Verify the current repository. Preserve the existing architecture and premium tri-modal alignment. Update the ledger before final response.
```

## Required Completion Report

Every prompt must end with this report, and the same facts must be written into the ledger:

```md
Completed Prompt:
Files inspected:
Files changed:
Behavior implemented:
Spatial evidence/provenance changed:
CRS, geometry, or measurement changed:
Scientific QA changed:
Layer registry or persistence changed:
Workflow/export/report changed:
Cross-module contracts changed:
Validation run:
Validation result:
Risks or blockers:
Next recommended prompt:
Ledger updated: yes/no
```

## Prompt Dependency Rule

Execute prompts in order unless the ledger explicitly marks the dependency chain complete or the user instructs a targeted deviation. When deviating, record the reason and the dependency risk in the ledger.

## Sequential Prompt Index

| Prompt | Title | Primary Outcome |
| --- | --- | --- |
| 00 | Memory Bootstrapping and Repository Baseline | Durable context, audit, and next-step confidence |
| 01 | Map Architecture Map and Spatial Ownership Boundaries | Live architecture map aligned to plan |
| 02 | Map Context Kernel and Selectors | Shared map context summary |
| 03 | Map Evidence Artifact Model Foundation | Provenance-ready map evidence objects |
| 04 | Store Persistence Boundaries and Project Snapshots | Safe persistence without heavy payload abuse |
| 05 | Modal Shell Decomposition and Command Hooks | Reduced super-component risk |
| 06 | Premium Workspace Shell and Context Strip | Map-first cockpit shell |
| 07 | Layer Registry Metadata Upgrade | Inspectable scientific layer stack |
| 08 | Layer Manager Premium UX and Safety | Professional layer operations |
| 09 | Scientific QA Model and Panel | First-class spatial QA |
| 10 | Publication Readiness Gates | Export/report readiness truthfulness |
| 11 | Map Workflow Manifest and Preview | Reproducible map workflow records |
| 12 | Analysis Recommendation and Dispatch | Explainable workflow routing |
| 13 | Engine Adapter Evidence Outputs | Analysis-to-layer evidence integrity |
| 14 | Import and External Service Evidence | Traceable ingestion and external layers |
| 15 | CRS, Measurement, and Geometry Validation | Spatial measurement discipline |
| 16 | Map to Urban Context Adapter | Map context to urban scientific reasoning |
| 17 | Urban to Map Method Request Adapter | Urban method needs to map actions |
| 18 | Map to IDE Code and Manifest Artifact Requests | Spatial code artifact handoff |
| 19 | IDE to Map File and Layer Artifact Recognition | Code/file evidence to map layer |
| 20 | Report Handoff Structured Evidence | Report-ready map evidence |
| 21 | Dashboard, Education, and Publication Outputs | Traceable map outputs outside map |
| 22 | Temporal Playback and Scenario Comparison | Temporal and scenario evidence |
| 23 | VoxCity 2D/3D Synchronization | Coherent 2D/3D spatial handoff |
| 24 | Natural-Language Query Safety and Audit | Safe NL map query operations |
| 25 | Review Timeline and Audit Trail | Durable map action memory |
| 26 | Accessibility and Keyboard Premium | Professional keyboard-first map UX |
| 27 | Performance, Workers, Memory, and Chunking | Fast, bounded spatial operations |
| 28 | QA Harness and E2E Validation | Repeatable spatial quality gates |
| 29 | Final Premium Polish and Handoff | Complete Map Explorer readiness package |

---

## Prompt 00 - Memory Bootstrapping and Repository Baseline

### Agent Instruction

Implement no feature yet. Establish durable context and verify the repository reality before any product changes.

### Required Reading

- `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
- `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- `package.json`
- Project root file tree.

### Files To Inspect

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/MapExplorerButton.tsx`
- `src/centerpanel/components/map/`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/`
- `src/features/urbanAnalytics/store.ts`
- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- `src/services/reporting/`
- Existing Map Explorer docs and tests.

### Scope

- Verify which planned files exist.
- Identify actual framework, build scripts, testing scripts, and map libraries.
- Record baseline Map Explorer architecture in the ledger.
- Create or update no product code except documentation if the ledger needs a baseline section.

### Implementation Tasks

1. Inspect repository scripts and dependencies.
2. Inspect current Map Explorer entry points, stores, services, and tests.
3. Identify existing Urban Analytics, IDE, reporting, dashboard, education, VoxCity, and workflow contracts.
4. Identify missing or renamed files from the plan.
5. Check whether the repository is under git and whether there are uncommitted changes.
6. Update the ledger with a baseline architecture entry.

### Scientific and UX Rationale

Map Explorer renders spatial evidence. Implementation from memory risks false CRS claims, geometry mishandling, broken map workflows, or visual states that imply unsupported precision.

### Acceptance Criteria

- The ledger contains a baseline entry.
- Existing file paths are confirmed or corrected.
- Existing spatial and cross-module contracts are listed.
- The next prompt can proceed without guessing.

### Validation

Run the narrowest available checks:

- `npm run typecheck` if available.
- `npm run lint` if available.
- Map service or component tests if available and reasonable.
- Otherwise record available scripts and why no validation ran.

### Stop Conditions

- Required plan documents are missing.
- The repository is too inconsistent with the plan to proceed safely.
- There are conflicting user edits in target files that need clarification.

---

## Prompt 01 - Map Architecture Map and Spatial Ownership Boundaries

### Agent Instruction

Create a live architecture map for Map Explorer based on current code, then align implementation boundaries with the tri-modal plan.

### Required Reading

Read the canonical source chain and the ledger. Confirm Prompt 00 is complete or perform its missing audit first.

### Files To Inspect

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapSyncService.ts`
- `src/services/map/MapAnalysisDispatcher.ts`

### Scope

- Document the real component hierarchy.
- Document store ownership.
- Document spatial data flow.
- Document layer, QA, workflow, report, and export pathways.
- Add lightweight code comments only if necessary to clarify ownership.
- Avoid UI behavior changes unless required to expose safe boundaries.

### Implementation Tasks

1. Trace the modal render tree.
2. Trace layer state from store to canvas, layer manager, QA, report handoff, and export.
3. Trace AOI, feature selection, drawing, and measurement state.
4. Trace map workflow preview/apply flow.
5. Trace engine adapter output into map layers and completed runs.
6. Trace existing Urban Analytics and IDE links.
7. Write an architecture ledger entry with actual paths and contracts.

### Cross-Module Alignment Checks

- Confirm Map Explorer does not own method interpretation.
- Confirm Map Explorer does not own editor file or tab state.
- Confirm reports/dashboards consume map evidence references or structured handoff objects.

### Acceptance Criteria

- The ledger has a "Map Architecture Map" entry.
- Contract registry is updated.
- Any mismatch with the plan is recorded as a risk.

### Validation

- Run typecheck or lint if code comments or small doc references are changed.
- If no code changes were made, record documentation validation only.

### Stop Conditions

- Existing imports create circular dependency risks that must be resolved before later prompts.
- Existing map layer or workflow types differ materially from the plan.

---

## Prompt 02 - Map Context Kernel and Selectors

### Agent Instruction

Introduce a lightweight Map Explorer context summary and selector layer without moving heavy data out of the map store.

### Required Reading

Read Map plan sections 7.3, 8.3, 9.1, 10, and tri-modal sync payload rules.

### Files To Inspect

- `src/stores/useMapExplorerStore.ts`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/services/map/MapAnalysisBounds.ts`
- `src/services/map/MapSyncService.ts`

### Scope

- Add context summary types and selectors.
- Do not persist heavy geometry in context summaries.
- Preserve existing store shape and map behavior.

### Implementation Tasks

1. Define `MapExplorerContextSummary` with:
   - context ID
   - viewport summary
   - active AOI reference
   - selected layer IDs
   - visible layer IDs
   - selected feature counts
   - current bounds
   - active analysis result layer IDs
   - QA status summary
   - updated timestamp
2. Add selectors for context summary and layer summaries.
3. Ensure selectors reference IDs and summaries, not raw bulky GeoJSON.
4. Connect context summary to status/cockpit surfaces only where safe.
5. Update ledger.

### Scientific Rationale

Map Explorer must publish spatial context to Urban Analytics and Synapse IDE without leaking map internals or moving heavy spatial data through event payloads.

### Acceptance Criteria

- Context summary type exists.
- Selectors produce map-safe summaries.
- Existing map store behavior remains unchanged.

### Validation

- Typecheck.
- Store/selector tests if feasible.

### Stop Conditions

- Existing store lacks stable layer/AOI identity. Record blocker and add type-only foundation.

---

## Prompt 03 - Map Evidence Artifact Model Foundation

### Agent Instruction

Define the Map Evidence Artifact model and minimal registry/adapters for layers, AOIs, workflow results, QA findings, exports, and report snapshots.

### Required Reading

Read Map plan sections 7.4, 9.2, 15.4, and tri-modal Shared Artifact Model.

### Files To Inspect

- `src/centerpanel/components/map/mapTypes.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/MapReviewSessionService.ts`
- `src/services/map/MapExportService.ts`

### Scope

- Add type foundation and minimal registration helpers.
- Do not migrate every current layer/output.
- Store references and provenance, not large raw data.

### Implementation Tasks

1. Define `MapEvidenceArtifact` with stable identity, kind, title, source module, linked layer/AOI/run/file IDs, provenance, QA, timestamps.
2. Define map-specific provenance fields:
   - source layer IDs
   - derived layer ID
   - CRS summary
   - geometry summary
   - workflow ID
   - export/report reference
3. Add registry helpers or adapters consistent with current store/service patterns.
4. Add selectors for artifacts by layer, AOI, workflow, and source.
5. Update ledger.

### Scientific Rationale

Map-derived outputs become evidence only when their source layer, geometry assumptions, CRS, workflow, and QA state are preserved.

### Acceptance Criteria

- Map evidence artifact model is typed and exported.
- Registry stores references safely.
- Existing layer and report workflows continue working.
- No heavy data is copied into artifact records.

### Validation

- Typecheck.
- Registry tests if feasible.
- Existing map service tests if touched.

### Stop Conditions

- A mature artifact model already exists and should be extended instead of replaced.

---

## Prompt 04 - Store Persistence Boundaries and Project Snapshots

### Agent Instruction

Clarify Map Explorer persistence boundaries and project snapshot behavior without persisting heavy layer payloads into lightweight state.

### Required Reading

Read Map plan section 10, tri-modal Persistence and Restore, and existing Map Persistence docs.

### Files To Inspect

- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapPersistenceService.ts`
- `src/services/map/__tests__/MapPersistenceService.test.ts`
- Map snapshot docs.
- `src/centerpanel/components/map/mapTypes.ts`

### Scope

- Preserve current store persistence behavior.
- Add snapshot/reference discipline where missing.
- Do not write large GeoJSON into new persisted contexts.

### Implementation Tasks

1. Audit what is currently persisted and not persisted.
2. Define snapshot schema for:
   - viewport
   - base layer
   - layout preferences
   - bookmarks
   - annotations
   - layer references and metadata
   - evidence artifacts
   - QA summaries
   - review timeline references
3. Add migration/version metadata if missing.
4. Add stale-reference handling for missing layers or external sources.
5. Update ledger.

### Scientific Rationale

Map sessions must restore enough context to be useful without pretending missing layers or external services still exist locally.

### Acceptance Criteria

- Persistence boundaries are documented in code/types or ledger.
- Project snapshots store references and metadata, not heavy raw data.
- Stale references are represented truthfully.

### Validation

- Typecheck.
- MapPersistenceService tests if touched.

### Stop Conditions

- Existing persistence service requires larger migration. Record a phased migration plan.

---

## Prompt 05 - Modal Shell Decomposition and Command Hooks

### Agent Instruction

Reduce `MapExplorerModal.tsx` super-component risk by extracting safe command hooks, selectors, or adapters without changing visible behavior.

### Required Reading

Read Map plan sections 3.3, 7, 11.1, 12 M2, and 13.1.

### Files To Inspect

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/`
- `src/stores/useMapExplorerStore.ts`
- Existing map hooks.

### Scope

- Extract only cohesive logic with low risk.
- Preserve modal behavior.
- Avoid broad redesign or large file churn.

### Implementation Tasks

1. Identify command clusters in `MapExplorerModal.tsx`:
   - layer actions
   - workflow actions
   - report handoff
   - export
   - map dispatch
   - review/audit
2. Extract one or more focused hooks or utility adapters if safe.
3. Keep component composition readable.
4. Ensure no behavior changes are introduced unintentionally.
5. Update ledger.

### Scientific Rationale

A large modal that owns too many decisions makes spatial QA and synchronization fragile. Focused hooks make evidence operations more testable.

### Acceptance Criteria

- Extracted logic has clear ownership.
- Visible map behavior is unchanged.
- Future prompts have stable command hooks to extend.

### Validation

- Typecheck.
- Map modal/component tests if available.
- Manual map modal smoke if UI can run.

### Stop Conditions

- Extraction would touch too many unrelated behaviors. Record a narrower extraction plan.

---

## Prompt 06 - Premium Workspace Shell and Context Strip

### Agent Instruction

Refine the Map Explorer workspace shell into a premium map-first cockpit while preserving the existing map interaction model.

### Required Reading

Read Map plan sections 6, 13.2, 16, and tri-modal Shared Wire/Layout and Premium UI.

### Files To Inspect

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/MapCanvas.tsx`
- Modal layout styles.

### Scope

- Preserve map-first layout.
- Add or refine context strip/cockpit state.
- Improve density, status semantics, and responsive constraints.
- Avoid decorative redesign.

### Implementation Tasks

1. Audit workspace regions: top cockpit, left layer rail, canvas, right dock, bottom status/timeline.
2. Add active map context summary:
   - visible layers
   - active AOI
   - selected features
   - QA status
   - workflow/export readiness
   - sync state
3. Add truthful disabled or stale states.
4. Improve layout constraints to prevent overlap with map controls.
5. Align status language with tri-modal spec.
6. Update ledger.

### Premium UX Requirements

- Map canvas remains primary.
- Controls are compact and instrument-like.
- No nested card-heavy decorative redesign.
- Text and controls must not overlap the map or each other.

### Acceptance Criteria

- Workspace remains structurally familiar.
- Context strip/cockpit displays real state or truthful empty state.
- Responsive behavior does not break map interactions.

### Validation

- Typecheck.
- Component tests if available.
- Manual UI smoke if dev server can run.

### Stop Conditions

- Existing map shell layout is too brittle and requires a separate layout refactor.

---

## Prompt 07 - Layer Registry Metadata Upgrade

### Agent Instruction

Upgrade the layer registry so each layer can carry scientific metadata, provenance, QA, source kind, and publication readiness.

### Required Reading

Read Map plan sections 9.4, 15, 17, and existing `mapTypes.ts`.

### Files To Inspect

- `src/centerpanel/components/map/mapTypes.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapDataImporter.ts`

### Scope

- Extend metadata types and adapters.
- Preserve existing layer operations.
- Do not require all existing layers to have full metadata immediately.

### Implementation Tasks

1. Audit current `OverlayLayerConfig` metadata.
2. Add or normalize fields for:
   - source kind
   - provenance
   - CRS summary
   - geometry summary
   - feature count
   - schema summary
   - license/attribution
   - QA status
   - queryability
   - publication readiness
   - evidence artifact ID
3. Add compatibility defaults for legacy layers.
4. Update layer registry event summaries if needed.
5. Update ledger.

### Scientific Rationale

Layer metadata is the foundation of spatial trust. Users must know what a layer is, where it came from, and whether it is fit for use.

### Acceptance Criteria

- Layer metadata model supports scientific evidence.
- Legacy layers degrade truthfully.
- Layer registry summaries remain lightweight.

### Validation

- Typecheck.
- Layer management tests if available.
- Map service tests if adapters touched.

### Stop Conditions

- Current layer type already contains overlapping fields and needs consolidation plan first.

---

## Prompt 08 - Layer Manager Premium UX and Safety

### Agent Instruction

Make layer operations professional, reversible where practical, and scientifically guarded.

### Required Reading

Read Map plan sections 13.4, 15, 16.3, and 17.

### Files To Inspect

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/stores/useMapExplorerStore.ts`
- Layer context menu utilities.
- Symbology utilities.

### Scope

- Improve layer actions, badges, disabled reasons, and safety.
- Preserve existing add/remove/toggle/reorder behavior.
- Do not hide layers because metadata is incomplete.

### Implementation Tasks

1. Add clear layer badges for source, derived status, QA, CRS, queryability, and publication readiness.
2. Add disabled reasons for actions:
   - export
   - send to Urban Analytics
   - open in IDE
   - report handoff
   - dashboard binding
3. Guard destructive actions with confirmation or undo where patterns exist.
4. Ensure layer reorder/toggle/opacity remain stable.
5. Update ledger.

### Scientific Rationale

Layer actions can create analysis outputs and reports. Users need to know when a layer is safe for those actions and why it may be blocked.

### Acceptance Criteria

- Layer manager shows useful metadata without clutter.
- Unsafe actions are guarded.
- Existing operations remain stable.

### Validation

- Typecheck.
- Layer manager tests.
- Manual layer action smoke.

### Stop Conditions

- Existing layer manager lacks enough metadata from Prompt 07.

---

## Prompt 09 - Scientific QA Model and Panel

### Agent Instruction

Make spatial QA a first-class model and panel that can inspect layers, AOIs, measurements, workflows, and exports.

### Required Reading

Read Map plan sections 5, 14.3, 17, and tri-modal Scientific QA.

### Files To Inspect

- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapScientificQA.worker.ts`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/stores/useMapExplorerStore.ts`
- Existing MapScientificQA tests.

### Scope

- Refine QA categories and severity.
- Do not fake QA where metadata is missing.
- Preserve existing QA service behavior.

### Implementation Tasks

1. Audit current QA state.
2. Define QA categories:
   - CRS
   - geometry validity
   - schema
   - scale
   - missingness
   - source/provenance
   - attribution/license
   - workflow readiness
   - export readiness
3. Add severity:
   - pass
   - warning
   - blocked
   - unknown
4. Ensure panel renders reasons, affected layers, and recommended fixes.
5. Propagate QA summaries to layer metadata and evidence artifacts.
6. Update ledger.

### Scientific Rationale

The map should never imply stronger precision than the data supports. QA makes uncertainty and blockers visible before analysis or publication.

### Acceptance Criteria

- QA model supports layer and workflow readiness.
- Missing metadata becomes unknown/warning, not pass.
- Panel shows actionable reasons.

### Validation

- MapScientificQA tests.
- Typecheck.
- Panel tests if available.

### Stop Conditions

- QA worker/API mismatch requires separate compatibility plan.

---

## Prompt 10 - Publication Readiness Gates

### Agent Instruction

Add or refine publication/export readiness gates for map exports, report snapshots, and public-facing map outputs.

### Required Reading

Read Map plan sections 9.5, 14.5, 14.6, 17.4, 21.4, and tri-modal Formal Output Gate.

### Files To Inspect

- `src/services/map/MapExportService.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/CartographyRecommendationList.tsx`
- `src/services/map/MapCartographyAdvisor.ts`
- QA model.

### Scope

- Add readiness evaluation for export/report handoff.
- Do not block internal exploration the same way formal publication is blocked.
- Make disabled states truthful.

### Implementation Tasks

1. Define publication readiness criteria:
   - visible layer exists
   - title available
   - legend available
   - scale/north arrow if required
   - attribution/license
   - CRS/measurement warnings addressed
   - QA blockers absent or explicitly acknowledged
   - caveats included
2. Add readiness helper.
3. Show blocked/warning reasons in export/report surfaces.
4. Record readiness in map evidence artifact or export manifest.
5. Update ledger.

### Scientific Rationale

Publication maps require cartographic and scientific accountability. An export should not silently omit source, scale, attribution, or caveats.

### Acceptance Criteria

- Export/report readiness is explicit.
- Blockers name missing conditions.
- Existing export behavior remains compatible.

### Validation

- MapExportService tests.
- MapReportHandoffService tests.
- Typecheck.

### Stop Conditions

- Existing export pipeline cannot accept readiness metadata. Add preview-only gate and record blocker.

---

## Prompt 11 - Map Workflow Manifest and Preview

### Agent Instruction

Add a reproducible manifest and preview discipline for map workflows before derived layers are committed.

### Required Reading

Read Map plan sections 12 M5, 14.2, 18.1, 18.3, and 9.3.

### Files To Inspect

- `src/services/map/MapWorkflowService.ts`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/stores/useFlowStore.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapEngineAdapter.ts`

### Scope

- Define workflow manifest.
- Preserve existing workflow preview/apply behavior.
- Do not commit derived layers without preview where current flow supports preview.

### Implementation Tasks

1. Define `MapReproducibilityManifest`:
   - manifest ID
   - workflow ID
   - source layer IDs
   - AOI reference
   - parameters
   - CRS summary
   - QA summary
   - output layer references
   - report/dashboard/IDE references
   - createdAt
2. Attach manifest to workflow previews and committed outputs.
3. Ensure preview records expected output and blockers.
4. Register derived output as map evidence artifact.
5. Update ledger.

### Scientific Rationale

Map workflows produce derived spatial evidence. The manifest preserves what ran, on which layers, under which assumptions, and what changed.

### Acceptance Criteria

- Workflow manifest type exists.
- Representative workflow preview or output carries manifest metadata.
- Existing workflows remain compatible.

### Validation

- MapWorkflowService tests.
- Typecheck.
- Manual workflow drawer smoke if practical.

### Stop Conditions

- Existing workflow service output shape is too central for direct changes. Use sidecar manifest registry.

---

## Prompt 12 - Analysis Recommendation and Dispatch

### Agent Instruction

Make map analysis recommendations and dispatch explainable, context-aware, and safe.

### Required Reading

Read Map plan sections 18.1, 18.2, 20.1, and Urban sync payload sections.

### Files To Inspect

- `src/services/map/MapAnalysisRecommender.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/stores/useFlowStore.ts`

### Scope

- Improve recommendation reasons and dispatch payloads.
- Do not run workflows silently.
- Preserve existing dispatch keys.

### Implementation Tasks

1. Audit recommendation inputs.
2. Add recommendation reasons based on layer type, geometry, fields, temporal data, AOI, QA, and active Urban context if available.
3. Add readiness state to recommendation.
4. Ensure dispatch payload includes context summary and layer references.
5. Record dispatch as review/audit event.
6. Update ledger.

### Scientific Rationale

Recommendations influence analytical choices. Users need to understand why a workflow is suggested and what assumptions or blockers apply.

### Acceptance Criteria

- Recommendations include reasons.
- Dispatch is explicit and reversible where practical.
- Existing dispatch tests remain compatible.

### Validation

- MapAnalysisRecommender tests.
- MapAnalysisDispatcher tests.
- Typecheck.

### Stop Conditions

- Existing dispatcher has undocumented payload variants. Document and adapt conservatively.

---

## Prompt 13 - Engine Adapter Evidence Outputs

### Agent Instruction

Ensure spatial-statistics, GeoAI, simulation, and analysis engine outputs become map layers with evidence metadata.

### Required Reading

Read Map plan sections 14.1, 18.3, 18.4, 18.5, and Urban evidence conversion sections.

### Files To Inspect

- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/SpatialStatsExecutionService.ts`
- `src/services/map/SpatialStatsExecutionQueue.ts`
- GeoAI panels/services.
- MapEngineAdapter tests.
- `src/stores/useFlowStore.ts`

### Scope

- Improve adapter metadata and evidence registration.
- Do not change scientific algorithms without evidence and tests.

### Implementation Tasks

1. Audit current adapter outputs.
2. Ensure adapted layers include:
   - source run ID
   - source layer IDs
   - algorithm/workflow ID
   - parameters
   - QA summary
   - uncertainty/caveats
   - evidence artifact ID
3. Add warnings for demo/synthetic outputs.
4. Preserve completed run integration.
5. Update ledger.

### Scientific Rationale

Engine outputs become visual authority on the map. Their algorithm, parameters, source data, and caveats must travel with the layer.

### Acceptance Criteria

- Representative engine outputs carry provenance and QA metadata.
- Existing adapter tests pass or are updated with explicit metadata expectations.
- Demo outputs are labeled.

### Validation

- MapEngineAdapter tests.
- SpatialStatsExecutionService tests if touched.
- Typecheck.

### Stop Conditions

- Output producers are too heterogeneous. Implement one representative adapter and record migration path.

---

## Prompt 14 - Import and External Service Evidence

### Agent Instruction

Make local imports and external service layers traceable, QA-aware, and eligible for evidence workflows.

### Required Reading

Read Map plan sections 12 M9, 14.4, 14.8, 15.2, and 23.

### Files To Inspect

- `src/services/map/MapDataImporter.ts`
- `src/services/map/MapDataExporter.ts`
- `src/services/map/ExternalServiceConnector.ts`
- `src/services/map/ExternalServiceQueue.ts`
- `src/centerpanel/components/map/MapToolbar.tsx`
- Import/export tests.

### Scope

- Add provenance and QA metadata to import/service layers.
- Do not implement new external providers unless already planned.
- Do not infer CRS as certain without evidence.

### Implementation Tasks

1. Audit import and external service metadata.
2. Add source kind, source URI/name, import timestamp, license/attribution, schema, geometry summary, CRS state.
3. Add QA summary generation for imported layers.
4. Label external-service dependency and offline/stale states.
5. Register imported/service layers as evidence candidates.
6. Update ledger.

### Scientific Rationale

Imported and external layers can become analytical evidence. Their origin, schema, CRS, license, and availability must be visible.

### Acceptance Criteria

- Imported layers carry provenance.
- External layers carry dependency/staleness metadata.
- CRS unknown remains unknown.

### Validation

- MapDataIO tests.
- ExternalServiceConnector tests.
- Typecheck.

### Stop Conditions

- Import pipeline lacks hooks for metadata propagation. Add adapter wrapper only.

---

## Prompt 15 - CRS, Measurement, and Geometry Validation

### Agent Instruction

Harden CRS, measurement, and geometry validation across drawing, measurement, layer metadata, QA, and publication gates.

### Required Reading

Read Map plan sections 5.2, 5.4, 14.3, 17.1, and 24.

### Files To Inspect

- `src/centerpanel/components/MapMeasurementTool.tsx`
- `src/centerpanel/components/MapDrawingManager.tsx`
- `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`
- `src/services/map/MapScientificQA.ts`
- `src/services/map/MapAnalysisBounds.ts`
- Geometry utilities.

### Scope

- Improve validation metadata and warning states.
- Do not replace all geometry operations.
- Do not present inferred CRS as verified.

### Implementation Tasks

1. Audit measurement and drawing semantics.
2. Ensure measurements label geodesic/projected assumptions.
3. Add geometry validity checks where feasible.
4. Connect CRS/geometry warnings to QA and publication readiness.
5. Add blocked states for impossible operations.
6. Update ledger.

### Scientific Rationale

Spatial measurements and geometry operations can be wrong even when visually plausible. The UI must communicate assumptions and blockers.

### Acceptance Criteria

- Measurements expose assumptions.
- Invalid geometry is detected or labeled unknown.
- QA and publication gates receive CRS/geometry warnings.

### Validation

- Geodesic measurement tests.
- MapScientificQA tests.
- Typecheck.

### Stop Conditions

- Geometry libraries are insufficient for robust validation. Add conservative unknown/warning states.

---

## Prompt 16 - Map to Urban Context Adapter

### Agent Instruction

Implement Map Explorer outgoing context for Urban Analytics: AOI, layers, selections, QA, and map evidence summaries.

### Required Reading

Read Map plan sections 8.3, 20.1, 20.3, and tri-modal Map Layer to Urban Evidence journey.

### Files To Inspect

- Context selectors.
- Evidence artifact model.
- `src/features/urbanAnalytics/store.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapSyncService.ts`
- `src/stores/useMapExplorerStore.ts`

### Scope

- Implement Map-side adapter.
- Do not implement Urban Analytics modal internals.
- Send references and summaries, not bulky geometry.

### Implementation Tasks

1. Define `MapToUrbanContextPayload`.
2. Include AOI reference, layer summaries, selected feature counts, field summaries, CRS, QA, and active workflow/result IDs.
3. Add explicit action to send context to Urban Analytics.
4. Add recommendation trigger where existing Urban store supports it.
5. Record contract changes in ledger.

### Scientific Rationale

Urban Analytics interprets map evidence scientifically. The map must provide accurate spatial context without handing over map internals.

### Acceptance Criteria

- Map context can be sent to Urban Analytics through documented contract.
- Payload uses IDs and summaries.
- Disabled reasons are shown when no usable context exists.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual event/store simulation.

### Stop Conditions

- Urban store API cannot safely receive map context. Define payload and record dependency.

---

## Prompt 17 - Urban to Map Method Request Adapter

### Agent Instruction

Support incoming Urban Analytics method requests that ask Map Explorer to focus compatible layers, AOIs, workflows, or map actions.

### Required Reading

Read Map plan sections 8.4, 20.2, 20.4, and Urban plan sync sections.

### Files To Inspect

- `src/features/urbanAnalytics/store.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapAnalysisRecommender.ts`
- Command hooks from Prompt 05.

### Scope

- Implement Map-side receiving behavior.
- Do not implement Urban method catalog internals.
- Do not run map actions without user preview.

### Implementation Tasks

1. Define `UrbanToMapMethodRequest`.
2. Support requests:
   - focus compatible layers
   - validate AOI
   - preview map workflow
   - publish derived layer
   - prepare report-ready snapshot
3. Show preview and readiness before applying.
4. Record requests in review timeline.
5. Update ledger.

### Scientific Rationale

Urban methods can require spatial evidence, but the map must validate whether the spatial layer/AOI is suitable before acting.

### Acceptance Criteria

- Urban requests can be previewed in Map Explorer.
- No request silently mutates layer state.
- QA blockers are visible.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual request simulation.

### Stop Conditions

- Urban request contract is missing. Define types and record dependency.

---

## Prompt 18 - Map to IDE Code and Manifest Artifact Requests

### Agent Instruction

Allow Map Explorer to request reproducible scripts, SQL, notebooks, and map publication manifests through Synapse IDE bridge contracts.

### Required Reading

Read Map plan sections 8.5, 19, and Synapse IDE handoff sections for contract awareness only.

### Files To Inspect

- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- Map evidence artifact model.
- Map workflow manifest.
- Map export service.
- Command hooks.

### Scope

- Generate request objects/content for IDE.
- Do not own editor state.
- Do not silently insert code without explicit user action.

### Implementation Tasks

1. Verify editor bridge contracts.
2. Define `MapCodeArtifactRequest`:
   - artifact ID
   - layer IDs
   - AOI reference
   - workflow ID
   - language
   - target file suggestion
   - content
   - provenance
3. Add actions:
   - open workflow script
   - open map manifest
   - open SQL query
   - open export package note
4. Register generated request as map evidence artifact.
5. Update ledger.

### Scientific Rationale

Code generated from map context must preserve layer IDs, CRS, AOI, workflow parameters, and QA caveats.

### Acceptance Criteria

- Map Explorer can request code/manifest artifacts from IDE.
- IDE bridge calls are explicit and guarded.
- Generated content includes provenance metadata.

### Validation

- Typecheck.
- Template/request tests if feasible.
- Manual bridge simulation.

### Stop Conditions

- IDE bridge cannot safely accept generated content. Implement preview/request-only mode.

---

## Prompt 19 - IDE to Map File and Layer Artifact Recognition

### Agent Instruction

Support incoming Synapse IDE references to map-ready files, manifests, scripts, and layer artifacts.

### Required Reading

Read Map plan sections 8.6, 19.1, 19.2, and tri-modal IDE File to Map Layer journey.

### Files To Inspect

- Editor bridge files.
- Map data importer.
- Layer registry.
- Evidence artifact model.
- `src/stores/useMapExplorerStore.ts`

### Scope

- Implement Map-side receiving behavior.
- Do not inspect or mutate IDE buffers directly.
- Use file/artifact references, not editor state.

### Implementation Tasks

1. Define incoming map artifact payload:
   - file path
   - language
   - artifact kind
   - data reference
   - CRS/schema metadata
   - related Urban context
   - source module
2. Recognize supported files:
   - `.map.json`
   - `.urban-map-manifest.json`
   - `.geojson`
   - `.csv`
   - `.parquet`
   - `.gpkg`
   - `.py`
   - `.sql`
3. Validate map readiness before adding layer.
4. Register evidence artifact references.
5. Update ledger.

### Scientific Rationale

IDE-produced data and manifests can become map layers only after map-side validation of geometry, CRS, schema, and provenance.

### Acceptance Criteria

- Incoming IDE references can become map evidence candidates.
- Invalid or unsupported files are labeled truthfully.
- Map layer state is not mutated without validation.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual event simulation.

### Stop Conditions

- No stable IDE-to-Map bridge exists yet. Define types and record dependency.

---

## Prompt 20 - Report Handoff Structured Evidence

### Agent Instruction

Enable Map Explorer to create structured report handoffs with map composition metadata, QA, provenance, and caveats.

### Required Reading

Read Map plan sections 14.6, 21.1, 21.4, and tri-modal Publication Export Path.

### Files To Inspect

- `src/services/map/MapReportHandoffService.ts`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/services/reporting/*`
- Map evidence artifact model.
- Publication readiness gates.

### Scope

- Improve structured report handoff metadata.
- Do not redesign the report builder.
- Do not insert report claims without provenance.

### Implementation Tasks

1. Define or refine `MapReportEvidenceBlock`.
2. Include title, layer stack, visible extent, legend metadata, scale, attribution, CRS summary, QA, caveats, export snapshot reference.
3. Add action from report handoff drawer.
4. Record report binding on map evidence artifact.
5. Update ledger.

### Scientific Rationale

Map report inserts must preserve the spatial evidence and caveats behind the visual figure.

### Acceptance Criteria

- Report handoff includes structured map evidence.
- QA and caveats are included.
- Existing reporting workflows remain compatible.

### Validation

- MapReportHandoffService tests.
- Typecheck.
- Manual report handoff smoke if practical.

### Stop Conditions

- Reporting service cannot accept structured metadata. Create adapter/request object only.

---

## Prompt 21 - Dashboard, Education, and Publication Outputs

### Agent Instruction

Bind Map Explorer outputs to dashboard, education, and publication flows with traceability.

### Required Reading

Read Map plan sections 21.2, 21.3, 21.4, and tri-modal artifact action rules.

### Files To Inspect

- Dashboard features/services.
- Education features/services.
- Map export services.
- Evidence artifact model.
- Publication readiness gates.

### Scope

- Add Map-side binding metadata.
- Do not redesign dashboards or education module.
- Avoid live binding claims unless state is actually reactive.

### Implementation Tasks

1. Define `MapDashboardBinding` and `MapEducationReference`.
2. Add actions for eligible map artifacts and outputs.
3. Label static vs live bindings truthfully.
4. Include QA and provenance in publication outputs.
5. Update ledger.

### Scientific Rationale

Map outputs should remain traceable when reused in dashboards, teaching materials, or publication packages.

### Acceptance Criteria

- Eligible map evidence can create dashboard/education/publication requests.
- Binding metadata includes provenance and QA.
- Static/live state is truthful.

### Validation

- Typecheck.
- Dashboard/education tests if touched.
- Manual action smoke if practical.

### Stop Conditions

- Adjacent module APIs are unavailable. Implement request model only.

---

## Prompt 22 - Temporal Playback and Scenario Comparison

### Agent Instruction

Represent temporal playback and scenario comparison outputs as map evidence with reproducible parameters.

### Required Reading

Read Map plan sections 12 M10, 22.3, 22.4, and tri-modal shared artifact rules.

### Files To Inspect

- Temporal playback components.
- Scenario comparison components.
- `src/centerpanel/components/map/mapTypes.ts`
- Map workflow manifest.
- Evidence artifact model.

### Scope

- Add metadata and evidence references for temporal/scenario outputs.
- Do not rewrite playback engine.

### Implementation Tasks

1. Define temporal evidence metadata:
   - time range
   - step
   - source fields
   - playback parameters
   - layer references
   - QA and caveats
2. Define scenario comparison metadata:
   - baseline layer/run
   - candidate layers/runs
   - comparison metric
   - uncertainty notes
3. Register temporal/scenario outputs as evidence artifacts.
4. Add report/dashboard handoff metadata.
5. Update ledger.

### Scientific Rationale

Temporal and scenario maps can imply change and causality. Metadata must preserve time fields, parameters, and uncertainty.

### Acceptance Criteria

- Temporal/scenario outputs have stable identity and provenance.
- Uncertainty and limitations are visible.
- Existing playback remains compatible.

### Validation

- Typecheck.
- Temporal player tests if available.
- Manual playback smoke if practical.

### Stop Conditions

- Temporal components lack stable output identity. Add type foundation only.

---

## Prompt 23 - VoxCity 2D/3D Synchronization

### Agent Instruction

Align Map Explorer 2D evidence with VoxCity/3D selections and scenario outputs.

### Required Reading

Read Map plan sections 12 M11, 22.1, 22.2, and Urban VoxCity plan sections.

### Files To Inspect

- `src/services/map/voxCitySelectionService.ts`
- `src/services/map/voxCityProjection.ts`
- `src/features/urbanAnalytics/voxcity/*`
- Map evidence artifact model.
- Layer registry.

### Scope

- Add map-side 2D/3D sync metadata.
- Do not rebuild 3D rendering.
- Do not move heavy meshes or voxel data through map evidence payloads.

### Implementation Tasks

1. Define 2D/3D sync reference:
   - map layer ID
   - selected feature IDs
   - building/voxel references
   - projection assumptions
   - scenario ID
   - QA and caveats
2. Register 2D/3D handoffs as evidence artifacts.
3. Label sample/demo data clearly.
4. Update ledger.

### Scientific Rationale

2D-to-3D handoffs are visually powerful and scientifically risky. Projection assumptions, feature identity, and sample/demo status must remain explicit.

### Acceptance Criteria

- Map-to-VoxCity references are typed.
- Sample/demo data is labeled.
- Heavy 3D payloads are not duplicated.

### Validation

- Typecheck.
- VoxCity selection/projection tests if touched.
- Manual 2D/3D smoke if practical.

### Stop Conditions

- VoxCity components lack stable feature/scenario identity.

---

## Prompt 24 - Natural-Language Query Safety and Audit

### Agent Instruction

Make natural-language map query behavior safe, explainable, auditable, and bounded.

### Required Reading

Read Map plan sections 13.10, 14.7, 18.6, and scientific truthfulness rules.

### Files To Inspect

- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/services/map/MapNLQueryBuilder.ts`
- Review timeline service.
- Layer registry.
- QA model.

### Scope

- Improve query interpretation and audit.
- Do not run destructive or broad map actions without preview.
- Do not claim semantic certainty.

### Implementation Tasks

1. Audit current NL query parser/builder.
2. Add interpreted intent preview.
3. Add affected layers and required fields.
4. Add confidence or ambiguity state where feasible.
5. Route resulting actions through preview/apply pattern.
6. Record accepted/rejected query actions in review timeline.
7. Update ledger.

### Scientific Rationale

Natural-language GIS actions can hide assumptions. The user must see how text was interpreted before spatial state changes.

### Acceptance Criteria

- NL query shows interpretation before action.
- Ambiguous queries do not silently mutate map state.
- Accepted/rejected actions are auditable.

### Validation

- MapNLQueryBuilder tests.
- Typecheck.
- Manual query smoke.

### Stop Conditions

- Current NL query implementation is purely UI-local and needs service extraction first.

---

## Prompt 25 - Review Timeline and Audit Trail

### Agent Instruction

Create or refine a durable review timeline that records meaningful map evidence operations.

### Required Reading

Read Map plan sections 10.4, 13.9, 14.7, 17.4, and tri-modal audit/provenance sections.

### Files To Inspect

- `src/services/map/MapReviewSessionService.ts`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/stores/useMapExplorerStore.ts`
- Evidence artifact registry.
- Workflow/export/report services.

### Scope

- Improve audit event model and display.
- Do not log noisy UI-only interactions.
- Do not store heavy payloads in audit entries.

### Implementation Tasks

1. Define audit-worthy event categories:
   - layer import
   - layer derived
   - QA run
   - workflow preview/apply
   - export/report handoff
   - Urban/IDE sync
   - NL query accepted/rejected
   - 2D/3D handoff
2. Ensure events store IDs, references, summary, status, and timestamp.
3. Add filters in timeline if feasible.
4. Link audit events to evidence artifacts.
5. Update ledger.

### Scientific Rationale

Spatial evidence work needs memory. The review timeline makes map actions reproducible and reviewable.

### Acceptance Criteria

- Meaningful map actions are auditable.
- Audit entries avoid bulky payloads.
- Timeline is readable and useful.

### Validation

- MapReviewSessionService tests.
- Typecheck.
- Manual timeline smoke.

### Stop Conditions

- Existing review session service cannot support new event categories without migration.

---

## Prompt 26 - Accessibility and Keyboard Premium

### Agent Instruction

Harden accessibility and keyboard behavior across Map Explorer while preserving map-first professional density.

### Required Reading

Read Map plan section 24 and tri-modal Accessibility and Keyboard Alignment.

### Files To Inspect

- Map workspace shell.
- Map toolbar.
- Layer manager.
- QA panel.
- Workflow drawer.
- Report handoff drawer.
- Timeline panel.
- `src/centerpanel/components/map/useMapKeyboardControls.ts`
- `src/centerpanel/components/map/useFocusTrap.ts`

### Scope

- Improve focus order, ARIA labels, keyboard traversal, and visible focus states.
- Do not create a separate shortcut system.

### Implementation Tasks

1. Audit keyboard navigation across cockpit, layer rail, canvas controls, right dock, drawers, and timeline.
2. Add missing accessible labels to icon controls.
3. Ensure map canvas controls have keyboard alternatives where feasible.
4. Ensure QA blockers and export readiness states are accessible.
5. Align focus rings with shared tokens.
6. Update ledger.

### Premium UX Requirements

- Keyboard operation should feel intentional.
- Focus must never disappear.
- Map interactions must remain discoverable.

### Acceptance Criteria

- Core Map Explorer workflows are keyboard reachable.
- Icon-only controls have accessible names.
- QA and blocked states are accessible.

### Validation

- Typecheck.
- Map accessibility tests.
- Manual keyboard smoke.

### Stop Conditions

- Map library primitives prevent full accessibility. Add documented fallback controls.

---

## Prompt 27 - Performance, Workers, Memory, and Chunking

### Agent Instruction

Harden Map Explorer performance and memory behavior for large spatial layers, workers, temporal playback, and long-running sessions.

### Required Reading

Read Map plan sections 12 M12, 23, and tri-modal Performance and Data Movement.

### Files To Inspect

- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapScientificQA.worker.ts`
- `src/services/map/SpatialStatsExecutionQueue.ts`
- `src/services/map/ExternalServiceQueue.ts`
- Layer rendering utilities.
- Map canvas.
- Import/export services.

### Scope

- Improve performance hot spots identified by inspection.
- Bound stored histories and registries.
- Avoid speculative micro-optimization.

### Implementation Tasks

1. Identify avoidable rerenders in workspace, layer manager, QA panel, and drawers.
2. Ensure heavy operations use workers or queues where existing patterns support it.
3. Bound evidence registry, audit timeline, import previews, and copilot/audit state.
4. Ensure large layer summaries avoid copying features.
5. Add stale-state recovery for missing layers, external services, and failed workers.
6. Update ledger.

### Scientific Rationale

Map Explorer can handle large geometries and service layers. Performance decisions must preserve scientific state without moving heavy data through light contracts.

### Acceptance Criteria

- No obvious unbounded new state growth remains.
- Heavy payloads stay out of event/summary payloads.
- Worker/service failures degrade truthfully.

### Validation

- Typecheck.
- Build if available.
- Performance or large-layer smoke if fixtures exist.

### Stop Conditions

- Performance issue requires architectural change outside Map Explorer ownership.

---

## Prompt 28 - QA Harness and E2E Validation

### Agent Instruction

Create repeatable QA checks for Map Explorer scientific workflows, UI contracts, and synchronization behavior.

### Required Reading

Read the full ledger. Read Map plan section 25 and tri-modal Cross-Plan Acceptance Criteria.

### Files To Inspect

- Test setup.
- Existing Map Explorer E2E specs.
- `src/services/map/__tests__`
- `src/centerpanel/components/map/__tests__`
- Package scripts.

### Scope

- Add focused tests where implementation introduced meaningful logic.
- Do not add brittle snapshot tests for visual polish.

### Implementation Tasks

1. Identify untested high-risk logic:
   - context selectors
   - evidence artifact registry
   - layer metadata adapters
   - QA model
   - publication readiness
   - workflow manifest
   - Urban/IDE adapters
   - import/external metadata
   - review timeline
2. Add unit or integration tests using existing patterns.
3. Add E2E smoke coverage only where stable.
4. Add a manual QA checklist for map workflows if E2E is unavailable.
5. Update ledger.

### Acceptance Criteria

- Critical spatial logic has focused tests.
- Manual QA checklist exists for visual workflows.
- Validation commands are known for future agents.

### Validation

- Run targeted tests.
- Run typecheck.
- Run build if available and reasonable.

### Stop Conditions

- Test framework is absent or broken before current changes. Record exact state and add manual checklist instead.

---

## Prompt 29 - Final Premium Polish and Handoff

### Agent Instruction

Perform final Map Explorer polish and prepare a durable handoff for Synapse IDE and Urban Analytics implementation prompts.

### Required Reading

Read all canonical documents. Read the full ledger. Read all completed prompt entries.

### Files To Inspect

- All files changed by prior prompts.
- Map Explorer modal.
- Map workspace shell.
- Map canvas.
- Layer manager.
- QA panel.
- Workflow drawer.
- Report handoff drawer.
- Timeline panel.
- Map services.
- Urban/IDE adapters.
- Theme files.
- Tests and docs.

### Scope

- Finish minor polish.
- Remove dead placeholders.
- Confirm cross-module readiness.
- Do not start Synapse IDE or Urban Analytics implementation.

### Implementation Tasks

1. Audit all Map Explorer surfaces for visual coherence.
2. Confirm no fake "coming soon" states remain.
3. Confirm CRS, geometry, QA, and publication states are truthful.
4. Confirm all cross-module actions are guarded by real contracts.
5. Confirm ledger contract registry is complete.
6. Confirm token usage aligns with tri-modal premium design.
7. Confirm validation commands pass or failures are recorded.
8. Create final handoff notes for Synapse IDE and Urban Analytics prompt execution.
9. Update ledger with final Map Explorer readiness status.

### Premium UX Acceptance

- Map Explorer feels like a premium scientific GIS cockpit.
- It remains map-first, dense, calm, and professional.
- It coordinates with Synapse IDE and Urban Analytics without becoming them.
- It exposes CRS, geometry, layer provenance, QA, workflow manifest, and publication readiness wherever map evidence leaves the map.

### Final Validation

Run the strongest reasonable validation set:

- Typecheck.
- Lint.
- Unit tests.
- Build.
- Map E2E smoke or Playwright if available.

If any command fails, record whether the failure is related to Map Explorer changes.

### Final Handoff Requirements

Update the ledger with:

- Final completed prompt.
- Complete file list.
- Complete contract list.
- Validation summary.
- Known risks.
- Recommended next module prompt sequence.

### Stop Conditions

- Major implementation prompt is incomplete.
- Cross-module contracts are missing or undocumented.
- Validation reveals a serious regression.

---

## Closing Instruction

An agent implementing Map Explorer must never end a prompt by saying only what it changed in chat. It must update `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` so the next agent can continue without memory loss.
