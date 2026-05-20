# Urban Analytics Sequential Implementation Prompts

## Document Role

This file converts the Urban Analytics development plan into an ordered implementation prompt ladder for high-capability coding agents. It is written to prevent agent amnesia. Any agent, in any future session, must be able to resume Urban Analytics implementation by reading this file plus the protocol, the alignment spec, the Urban Analytics plan, the ledger, and the live repository.

This file is not a replacement for the product plan. It is an execution system.

## Anti-Amnesia and Rate-Limit Operating Layer

This section is an execution layer over the full prompt ladder below. It does not shorten, replace, or relax any prompt. It tells future agents how to recover prior work without re-reading unnecessary text, how to avoid losing previous decisions, and how to keep token/rate-limit use bounded while still doing the required reading.

### Durable Memory Hierarchy

Use this priority order whenever documents, code, or chat memory disagree:

1. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md` is the execution source of truth for what has actually been completed, inspected, changed, validated, blocked, skipped, or deferred.
2. The live repository is the implementation source of truth. Planned files and APIs must be verified against real imports before editing.
3. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json` is the machine-readable ordered catalog.
4. This file is the ordered implementation authority for prompt scope, acceptance, and stop conditions.
5. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md` is the module product authority.
6. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` is the cross-module product authority.
7. Chat history is non-authoritative. Use it only as a hint after durable documents and repository state are checked.

### Rate-Limit Reading Profiles

Use the smallest profile that safely fits the session. Do not skip the ledger or active prompt under any profile.

| Profile | When to use | Required reads |
| --- | --- | --- |
| Cold start | First session for an agent, unknown repository state, or contradictory memory | Start file, amnesia protocol, tri-modal spec headings plus relevant sections, Urban plan headings plus active required sections, full ledger Current Status/Prompt Status Register/latest completed entries, manifest, active prompt block, named source files |
| Normal next prompt | Helper and ledger agree on next prompt | Start file, ledger Current Status/Prompt Status Register/latest dependency entries, manifest entry for active prompt, active prompt block, required plan sections named by the prompt, files named by the prompt |
| Resume after interruption | Same prompt was in progress | Ledger Current Status, active prompt execution log draft if present, Files Changed/Inspected registries for active prompt, current source files touched by the prompt, validation history |
| Validation-only follow-up | Code was already changed and user asks to verify/fix | Ledger active prompt entry, changed files, relevant tests/scripts, validation history |
| Final polish or release prompt | Prompt 28 or 29 | Full ledger, all completed prompt entries, changed-file registry, contract registry, scientific decision registry, validation history, all canonical documents as needed |

Reading a long plan does not require pasting it into context. Prefer targeted heading lookup and section extraction:

```powershell
rg -n "^##|^###|Persistence|Evidence|Context|Prompt 04" DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md
Get-Content DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md | Select-Object -Skip <start> -First <count>
```

### Session Bootstrap Packet

Every future implementation session can begin from this compact instruction. It intentionally points to durable state rather than carrying chat memory:

```text
Use DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md. Run scripts/get-next-urban-analytics-prompt.ps1 or manually read the ledger Prompt Status Register. Recover prior work from DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md, especially Current Status, Prompt Execution Log, Files Changed, Cross-Module Contract Registry, Scientific Decision Registry, Validation History, Known Risks, and Next Prompt Pointer. Execute only the next incomplete Urban Analytics prompt from DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md. Read only the plan sections and files required by that active prompt unless the ledger or code contradicts them. Validate narrowly and update the ledger before final response.
```

### Prior-Work Recovery Checklist

Before editing source files for any prompt, complete this checklist in order:

1. Run `.\scripts\get-next-urban-analytics-prompt.ps1 -Json` after setting process execution policy when needed.
2. Confirm the helper result matches `URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md` Current Status and Next Prompt Pointer.
3. Read the Prompt Status Register and verify every dependency is `completed` or `skipped_with_reason`.
4. Read the latest completed prompt entries that directly affect the active prompt. For example, Prompt 04 must read Prompt 02 and Prompt 03 entries because evidence artifacts depend on the context store and persistence decisions.
5. Read the Files Changed Registry for dependency prompts before touching any source file they changed.
6. Read the Cross-Module Contract Registry and Scientific Decision Registry before introducing or changing any shared contract.
7. Read the Known Risks table and decide whether the active prompt resolves, preserves, or adds to any risk.
8. Inspect live imports and current tests for every file named by the active prompt.
9. If the ledger and source disagree, trust source for implementation details but record the drift in the ledger before finishing.

### Per-Prompt Execution Envelope

Every prompt block below is wrapped by this envelope, even when the block does not repeat these instructions.

Before implementation:

1. State the active prompt ID and title.
2. Read the active prompt block in full.
3. Read only the required Urban plan and tri-modal sections named by the active prompt, unless a contradiction requires broader reading.
4. Inspect every file named by the active prompt.
5. Inspect tests near the files being changed.
6. Check git status if a repository exists; if no git metadata exists, record that in the ledger when relevant.
7. Mark the active prompt `in_progress` in the ledger if editing docs during implementation is allowed.

During implementation:

1. Keep edits scoped to the active prompt.
2. Extend mature existing contracts instead of replacing them.
3. Preserve all existing prompt content, ledger records, public event names, and compatibility adapters unless the active prompt explicitly requires a migration.
4. Store references and provenance instead of heavy payloads.
5. Do not silently mutate Map Explorer state, Synapse IDE editor state, reporting outputs, dashboard bindings, education progress, or workflow results.
6. Do not claim data readiness, method validity, evidence provenance, CRS integrity, or workflow success without a real source.

After implementation:

1. Run the validation named by the prompt or the narrowest equivalent available.
2. Add focused tests when store logic, selectors, contracts, adapters, registry behavior, or data migration changes.
3. Update Prompt Status Register.
4. Add a Prompt Execution Log entry.
5. Update Files Inspected, Files Changed, Cross-Module Contract Registry, Scientific Decision Registry, Validation History, Known Risks, and Next Prompt Pointer as applicable.
6. Run the next-prompt helper again and confirm it advances as expected.
7. Final response must report completed prompt, files changed, validation, ledger status, next prompt, and real risks.

### Evidence of Memory Transfer

An agent has not completed a prompt unless durable memory was transferred to the next agent. Durable memory means:

- The ledger records what was inspected.
- The ledger records what changed.
- The ledger records validation commands and outcomes.
- New or changed contracts are named.
- Scientific constraints and unresolved risks are explicit.
- The next prompt pointer is correct.

Do not rely on generated summaries outside the repository. If a fact matters to the next prompt, it belongs in the ledger or source comments/types/tests, not only in chat.

## Canonical Source Chain

Every agent must read these files before acting:

1. `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
2. `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
3. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
4. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
5. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
6. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
7. `DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md`
8. This file.

The tri-modal alignment spec is the top-level product authority. The Urban Analytics plan is the module authority. This prompt file is the ordered implementation authority. The ledger is the durable execution memory.

## Operating Pack

For automation-ready execution, start from:

`DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`

The machine-readable prompt catalog is:

`DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`

The next prompt helper is:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-urban-analytics-prompt.ps1 -Json
```

The helper reads the ledger's Prompt Status Register. The ledger remains the execution source of truth.

## Amnesia-Proof Operating Rules

Use these rules in every prompt:

1. Do not rely on chat memory.
2. Do not assume prior prompt completion.
3. Read the ledger and verify the live repository.
4. Keep Urban Analytics synchronized with Synapse IDE and Map Explorer through contracts, not hidden coupling.
5. Preserve the existing Urban Analytics modal architecture unless the prompt explicitly changes it.
6. Keep UI premium, dense, deterministic, and scientifically credible.
7. Make every evidence-producing operation traceable.
8. Record every decision in the ledger.
9. Validate narrowly and honestly.
10. Stop when a dependency is missing or contradictory.

## Urban Analytics Product Thesis

Urban Analytics is the scientific command layer of the tri-modal workbench. It owns analytical methods, study context, scenario reasoning, indicators, data fitness, method validity, workflow interpretation, evidence provenance, report/dashboard bindings, and education-ready method explanations.

It must not become a generic card library or a decorative modal. It must feel like a premium urban science cockpit where spatial evidence, reproducible code, and planning interpretation are coordinated through explicit evidence contracts.

The module must support:

- Study area and analytical question context.
- Data fitness and method readiness.
- Method assumptions, limitations, and validity envelopes.
- Indicator formulas, units, scale, and provenance.
- Workflow run manifests and reproducible result packages.
- Map Explorer handoffs for spatial outputs and AOI/layer context.
- Synapse IDE handoffs for reproducible scripts, notebooks, and manifests.
- Report, dashboard, and education exports with traceability.
- Stable restore and keyboard-first interaction.

## Core Module Boundaries

Urban Analytics owns:

- Active urban analysis context.
- Method catalog and section ontology.
- Indicator definitions and interpretation.
- Data fitness scoring and QA summaries.
- Method validity envelopes.
- Workflow run interpretation.
- Evidence artifact reasoning.
- Report/dashboard/education binding metadata.

Map Explorer owns:

- Map viewport.
- Map rendering.
- Layer display and interaction.
- Feature selection.
- Spatial canvas tools.
- Heavy geometry state.

Synapse IDE owns:

- Editor state.
- Files and code buffers.
- Terminal execution.
- AI apply plans.
- Code artifact storage and editing.

Shared synchronization must use typed contracts, stores, bridge adapters, or artifact references. Do not pass bulky geometry, large datasets, or hidden analytical state through generic UI events.

## Global Context Block For Every Agent

Paste or preserve this context in every implementation session:

```md
You are implementing Urban Analytics inside the SynapseIDE urban analytics workbench.

Mandatory reading before editing:
- DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md
- DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md
- DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md
- DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md
- DEVELOPMENT_PLANS/URBAN_ANALYTICS_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md
- DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json
- DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md
- DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md

Do not trust memory. Verify the current repository. Preserve the existing architecture and premium tri-modal alignment. Update the ledger before final response.
```

## Required Completion Report

Every prompt must end with this report, and the same facts must be written into the ledger:

```md
Completed Prompt:
Files inspected:
Files changed:
Behavior implemented:
Evidence/provenance changed:
Data fitness or QA changed:
Method validity changed:
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
| 01 | Urban Architecture Map and Scientific Ownership Boundaries | Live architecture map aligned to plan |
| 02 | Urban Analysis Context Kernel Types and Store | Shared scientific context substrate |
| 03 | Context Persistence and Restore | Recoverable analysis context |
| 04 | Evidence Artifact Model Foundation | Shared provenance-ready evidence objects |
| 05 | Data Fitness and QA Profile Foundation | Truthful readiness model |
| 06 | Method Validity Envelope and Capability Metadata | Defensible method constraints |
| 07 | Premium Modal Shell and Context Strip | Dense scientific cockpit shell |
| 08 | Left Rail Research Navigator Metadata | Method discovery with scientific metadata |
| 09 | Rail Search, Filters, and Recommendations | Project-aware method selection |
| 10 | Right Panel Scientific Dossier | Method/evidence dossier surface |
| 11 | Evidence Tray and Provenance Surface | Inspectable artifact evidence |
| 12 | Indicator Catalog V2 Metadata Traceability | Traceable formulas and units |
| 13 | Indicator Calculators QA and Unit Semantics | Honest indicator calculation state |
| 14 | Workflow Runtime Run Manifest | Reproducible workflow run records |
| 15 | Workflow Readiness Gates and Failure Modes | Guarded analytical execution |
| 16 | Map Explorer Incoming Context Adapter | Map-to-urban scientific context |
| 17 | Urban to Map Evidence Publication | Urban evidence to spatial layer handoff |
| 18 | Synapse IDE Code Artifact Generation | Reproducible code artifact requests |
| 19 | IDE to Urban File and Artifact Recognition | Code/file evidence to urban context |
| 20 | Reporting Evidence Blocks | Report-ready scientific inserts |
| 21 | Dashboard Bindings and Scenario Outputs | Traceable dashboard state |
| 22 | Education Mode and Method Learning Path | Teaching-ready method explanation |
| 23 | VoxCity 2D/3D Scenario Coherence | 3D scenario evidence coherence |
| 24 | Scenario Comparison and Policy Interpretation | Scenario reasoning and limitations |
| 25 | Reproducible Package Export | Exportable scientific package |
| 26 | Accessibility and Keyboard Premium | Professional keyboard-first UX |
| 27 | Performance, Data Movement, and Resilience | Fast, bounded, recoverable behavior |
| 28 | QA Harness and Release Validation | Repeatable scientific quality gates |
| 29 | Final Premium Polish and Handoff | Complete Urban Analytics readiness package |

## Dependency Carry-Forward Matrix

This matrix exists to prevent future agents from forgetting prior work while keeping each session bounded. It does not replace the full prompt blocks. It tells the active agent which durable records must be recovered before implementation and which durable records must be left for the next prompt.

| Prompt | Recover before editing | Leave for future prompts |
| --- | --- | --- |
| 00 | None beyond canonical documents and live repository | Baseline architecture, confirmed file paths, scripts, tests, risks, next pointer |
| 01 | Prompt 00 baseline, confirmed file paths, live imports | Architecture map, ownership boundaries, cross-module contracts, source-of-truth decisions |
| 02 | Prompt 01 architecture, store ownership table, type system shape | `UrbanAnalysisContext`, context store contract, selectors, tests, context-related risks |
| 03 | Prompt 02 context store contract, persistence conventions, storage helpers | Versioned context persistence, restore warnings, migration behavior, validation results |
| 04 | Prompts 02-03 context and persistence contracts, shared artifact model, run/report/map types | `UrbanEvidenceArtifact`, provenance/QA types, registry actions/selectors, completed-run compatibility notes |
| 05 | Prompt 04 evidence model, Prompt 03 stale warning pattern, indicator and map-layer contracts | Data fitness profile, QA scoring assumptions, missing-data behavior, test coverage |
| 06 | Prompt 05 data fitness profile, method metadata and card catalog shape | Method validity envelope, capability metadata, disabled reasons, migration caveats |
| 07 | Prompts 02-06 context/evidence/QA/validity contracts, current modal shell architecture | Premium shell/context strip wiring, visible restore/evidence/QA states, accessibility notes |
| 08 | Prompt 07 shell contracts, card metadata decisions, section hierarchy | Left rail metadata model, card annotation rules, migration gaps |
| 09 | Prompt 08 rail metadata, existing search/filter persistence, recommendation constraints | Search/filter/recommendation behavior, ranking logic, tests and disabled reasons |
| 10 | Prompt 09 rail context, Prompt 04 evidence model, Prompt 06 validity envelope | Right-panel dossier data shape, evidence visibility rules, scientific caveat rendering |
| 11 | Prompt 10 dossier, Prompt 04 registry, Prompt 05 QA, Prompt 06 validity | Evidence tray/provenance surface contracts, artifact interaction rules |
| 12 | Prompt 11 evidence surface, indicator catalog types and calculator tests | Indicator V2 metadata traceability, units/formulas/sources, migration notes |
| 13 | Prompt 12 indicator metadata, Prompt 05 QA model, calculator matrix | Indicator calculator QA, unit semantics, warning/failure rules |
| 14 | Prompt 13 calculator QA, `useFlowStore.completedRuns`, reproducibility plan section | Workflow run manifest contract, completed-run extension/sidecar decisions |
| 15 | Prompt 14 run manifest, Prompt 05 QA, Prompt 06 validity, workflow runtime | Readiness gates, failure modes, blocked-state reasons, run safety tests |
| 16 | Prompt 15 readiness gates, Prompt 03 restore warnings, Map Explorer contracts | Map-to-Urban adapter contract, AOI/layer/QA summary behavior |
| 17 | Prompt 16 incoming map context, Prompt 04 evidence artifacts, Map publication contracts | Urban-to-Map evidence publication, layer-reference safety, provenance mapping |
| 18 | Prompt 17 map publication, Prompt 04 evidence, Synapse IDE bus/handoff contracts | Code artifact request model, scaffold/manifest generation safety, IDE preview constraints |
| 19 | Prompt 18 code artifact model, IDE bridge contracts, Prompt 04 evidence model | IDE-to-Urban recognition adapter, file/artifact mapping rules, stale file behavior |
| 20 | Prompt 19 IDE recognition, Prompt 04 evidence, reporting service types | Report evidence block contract, citation/limitations/provenance behavior |
| 21 | Prompt 20 report blocks, dashboard deviation recorded in ledger, flow output contracts | Dashboard binding model using existing flow/report surfaces, scenario output traceability |
| 22 | Prompt 21 dashboard bindings, education module contracts, method metadata | Education learning path binding, teaching-safe context and caveat rules |
| 23 | Prompt 22 education context, VoxCity types, Prompt 04 evidence model | VoxCity/2D/3D evidence coherence, no-heavy-payload decisions |
| 24 | Prompt 23 scenario coherence, Prompt 06 validity, Prompt 14 run manifests | Scenario comparison interpretation, policy caveats, uncertainty behavior |
| 25 | Prompt 24 scenario interpretation, Prompt 18 code artifacts, Prompt 20 reports | Reproducible package manifest, export references, limitations and file bundle rules |
| 26 | Prompt 25 export model, Prompt 07 shell, existing keyboard/focus contracts | Keyboard/a11y improvements, focus rules, shortcut compatibility |
| 27 | Prompt 26 a11y, performance budgets, persistence and worker contracts | Performance/resilience hardening, data-movement decisions, memory bounds |
| 28 | Prompt 27 performance constraints, all tests touched by prompts 02-27 | QA harness, validation command map, regression checklist |
| 29 | Full ledger, all completed prompt entries, contract registry, validation history | Final readiness status, full handoff, residual risks, recommended cross-module next sequence |

---

## Prompt 00 - Memory Bootstrapping and Repository Baseline

### Agent Instruction

Implement no feature yet. Establish durable context and verify the repository reality before any product changes.

### Required Reading

- `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
- `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- `package.json`
- Project root file tree.

### Files To Inspect

- `src/features/urbanAnalytics/`
- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/store.ts`
- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/indicators/`
- `src/features/urbanAnalytics/calculators/`
- `src/centerpanel/Flows/`
- `src/stores/useFlowStore.ts`
- `src/stores/usePanelBridgeStore.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/`
- `src/services/reporting/`
- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`

### Scope

- Verify which planned files exist.
- Identify actual framework, build scripts, testing scripts, and UI libraries.
- Record baseline Urban Analytics architecture in the ledger.
- Create or update no product code except documentation if the ledger needs a baseline section.

### Implementation Tasks

1. Inspect repository scripts and dependencies.
2. Inspect current Urban Analytics entry points and stores.
3. Identify existing Map Explorer, IDE, reporting, dashboard, and education contracts.
4. Identify missing or renamed files from the plan.
5. Check whether the repository is under git and whether there are uncommitted changes.
6. Update the ledger with a baseline architecture entry.

### Scientific and UX Rationale

Urban analytics cannot be improved from memory. The baseline audit prevents speculative implementation, protects scientific claims, and preserves the existing three-panel modal architecture.

### Acceptance Criteria

- The ledger contains a baseline entry.
- Existing file paths are confirmed or corrected.
- Existing scientific and cross-module contracts are listed.
- The next prompt can proceed without guessing.

### Validation

Run the narrowest available checks:

- `npm run typecheck` if available.
- `npm run lint` if available.
- `npm run test -- src/features/urbanAnalytics` if available and reasonable.
- Otherwise record available scripts and why no validation ran.

### Stop Conditions

- Required plan documents are missing.
- The repository is too inconsistent with the plan to proceed safely.
- There are conflicting user edits in target files that need clarification.

---

## Prompt 01 - Urban Architecture Map and Scientific Ownership Boundaries

### Agent Instruction

Create a live architecture map for Urban Analytics based on current code, then align implementation boundaries with the tri-modal plan.

### Required Reading

Read the canonical source chain and the ledger. Confirm Prompt 00 is complete or perform its missing audit first.

### Files To Inspect

- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/store.ts`
- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/rightPanelRegistry.ts`
- `src/features/urbanAnalytics/rightPanelUtils.ts`
- `src/features/urbanAnalytics/indicators/catalog.ts`
- `src/centerpanel/Flows/flowTypes.ts`
- `src/centerpanel/Flows/flowLibraryMeta.ts`
- `src/stores/useFlowStore.ts`
- `src/stores/usePanelBridgeStore.ts`

### Scope

- Document the real component hierarchy.
- Document store ownership.
- Document analytical data flow.
- Document current evidence and workflow result shapes.
- Add lightweight code comments only if necessary to clarify ownership.
- Avoid UI behavior changes unless required to expose safe boundaries.

### Implementation Tasks

1. Trace the modal render tree.
2. Trace selection state from rail to right panel.
3. Trace workflow run state from flow surfaces into `useFlowStore`.
4. Trace indicator catalog and calculator output shapes.
5. Trace report/dashboard/education handoff routes.
6. Trace existing Map Explorer and IDE links.
7. Write an architecture ledger entry with actual paths and contracts.

### Cross-Module Alignment Checks

- Confirm Urban Analytics does not own map rendering state.
- Confirm Urban Analytics does not own editor tab or file state.
- Confirm reporting/dashboard/education integrations consume evidence references or run objects.

### Acceptance Criteria

- The ledger has an "Urban Architecture Map" entry.
- Contract registry is updated.
- Any mismatch with the plan is recorded as a risk.

### Validation

- Run typecheck or lint if code comments or small doc references are changed.
- If no code changes were made, record documentation validation only.

### Stop Conditions

- Existing imports create circular dependency risks that must be resolved before later prompts.
- Existing run or evidence types differ materially from the plan.

---

## Prompt 02 - Urban Analysis Context Kernel Types and Store

### Agent Instruction

Introduce the Urban Analysis Context Kernel as a typed scientific state contract without disrupting current UI behavior.

### Required Reading

Read Urban plan sections 5.1, 19.1, 20, 21.1, and 25. Read tri-modal source-of-truth and sync sections.

### Files To Inspect

- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/store.ts`
- `src/stores/useFlowStore.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/stores/usePanelBridgeStore.ts`
- `src/centerpanel/UrbanContextStrip.tsx`
- Existing persistence utilities.

### Scope

- Add a typed context model.
- Add store state or a dedicated store if consistent with the codebase.
- Preserve existing Urban Analytics store actions and UI.
- Avoid changing Map Explorer, IDE, reporting, dashboard, or education internals.

### Implementation Tasks

1. Define `UrbanAnalysisContext` with stable fields:
   - `contextId`
   - `studyAreaId`
   - `activeQuestion`
   - `activeScale`
   - `activeAoiId`
   - `activeLayerIds`
   - `selectedIndicatorKinds`
   - `activeFlowId`
   - `activeRunId`
   - `activeCodeArtifactId`
   - `updatedAt`
2. Define supporting enums or string unions only if not already present.
3. Add minimal store actions:
   - create context
   - update context patch
   - reset context
   - set active AOI/layers
   - set active flow/run/code artifact
4. Add selectors that avoid rerendering the whole modal.
5. Do not persist yet unless an existing safe persistence path already exists.
6. Update ledger with context contract.

### Scientific Rationale

Urban Analytics needs a scientific context independent of any one UI panel. This allows method recommendations, data readiness, workflow manifests, map handoffs, IDE code generation, and reports to refer to the same analytical state.

### Acceptance Criteria

- Context type is exported.
- Store can hold and update context without breaking existing selectors.
- Existing modal, rail, right panel, and indicators still compile.
- Ledger records ownership and planned consumers.

### Validation

- Typecheck.
- Store unit tests if existing pattern is available.
- No UI behavior change is required in this prompt.

### Stop Conditions

- Existing Urban store architecture makes context addition unsafe without a separate store design.

---

## Prompt 03 - Context Persistence and Restore

### Agent Instruction

Make the Urban Analysis Context recoverable across sessions without over-persisting heavy spatial data.

### Required Reading

Read tri-modal Persistence and Restore rules. Read Urban plan sections 10, 14, 19.5, 25 Phase 1, and 28 Migration Rules.

### Files To Inspect

- Urban Analytics store or context store.
- Existing persistence utilities.
- `src/centerpanel/SessionPersistence.tsx`
- `src/stores/useFlowStore.ts`
- Browser storage wrappers if present.

### Scope

- Persist lightweight context references only.
- Do not persist heavy GeoJSON, raw datasets, or map rendering state.
- Restore gracefully when referenced AOI, layer, run, or artifact is missing.

### Implementation Tasks

1. Identify current persistence conventions.
2. Define persisted context version and migration strategy.
3. Persist stable IDs and metadata only.
4. Add restore validation:
   - missing AOI
   - missing layer
   - missing run
   - missing code artifact
   - incompatible schema version
5. Surface stale state as a truthful warning, not silent deletion.
6. Update ledger.

### Scientific Rationale

Analytical sessions must be recoverable, but persistence must not create false evidence. Restored context should identify missing references rather than pretending the full prior state exists.

### Acceptance Criteria

- Context restores after reload where storage is available.
- Stale references are detected and labeled.
- No bulky spatial data is persisted by Urban Analytics.

### Validation

- Typecheck.
- Store/persistence tests if feasible.
- Manual reload check if UI can run.

### Stop Conditions

- The repository has no safe persistence abstraction and direct localStorage use would conflict with existing patterns.

---

## Prompt 04 - Evidence Artifact Model Foundation

### Agent Instruction

Define the Urban Evidence Artifact model and a minimal registry or adapter that can represent method cards, datasets, map layers, indicators, workflow runs, code, reports, and dashboard bindings.

### Required Reading

Read Urban plan sections 5.2, 19.2, 20, 21.1, and tri-modal Shared Artifact Model.

### Files To Inspect

- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/store.ts`
- `src/stores/useFlowStore.ts`
- `src/services/reporting/types.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapReportHandoffService.ts`
- Indicator result types.

### Scope

- Add type foundation and minimal registry operations.
- Do not migrate every current output.
- Store references and provenance, not large data.

### Implementation Tasks

1. Define `UrbanEvidenceArtifact` with stable identity, kind, title, source module, linked context/run/layer/file IDs, provenance, QA, timestamps.
2. Define `UrbanEvidenceProvenance` and `UrbanEvidenceQA`.
3. Add registry actions:
   - register artifact
   - update artifact state
   - link artifact to context
   - mark stale or invalid
4. Add selectors for artifacts by context, run, kind, and source module.
5. Add compatibility mapping from existing completed runs where safe.
6. Update ledger.

### Scientific Rationale

Evidence artifacts are the connective tissue between Urban Analytics, Map Explorer, Synapse IDE, reports, dashboards, and education. They make outputs auditable without duplicating data.

### Acceptance Criteria

- Evidence artifact model is typed and exported.
- Registry stores references safely.
- Existing completed runs continue working.
- No heavy data is copied into artifact records.

### Validation

- Typecheck.
- Registry tests if feasible.
- Existing flow store tests if touched.

### Stop Conditions

- A mature artifact model already exists and should be extended instead of replaced.

---

## Prompt 05 - Data Fitness and QA Profile Foundation

### Agent Instruction

Introduce a truthful data fitness and QA model for Urban Analytics methods and workflows.

### Required Reading

Read Urban plan sections 7.3, 10.3, 19.3, 23.1, 23.3, and tri-modal Scientific QA.

### Files To Inspect

- `src/features/urbanAnalytics/lib/types.ts`
- Indicator catalog types.
- Calculator inputs and outputs.
- Map QA services:
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/MapEngineAdapter.ts`
- Existing tests for map QA and indicators.

### Scope

- Define data fitness profile.
- Add helper functions for scoring where inputs are known.
- Avoid pretending QA is complete when inputs are missing.

### Implementation Tasks

1. Define `UrbanDataFitnessProfile` with:
   - geometry validity
   - CRS availability
   - temporal coverage
   - missingness
   - scale suitability
   - license/status
   - sample size or feature count
   - field availability
   - uncertainty notes
2. Define status levels:
   - ready
   - warning
   - blocked
   - unknown
3. Add helper to compute a conservative profile from available layer/run/input metadata.
4. Add blocked reasons and missing input lists.
5. Connect profile to evidence artifacts as optional metadata.
6. Update ledger.

### Scientific Rationale

Data fitness is not decoration. It determines whether a method can be responsibly used. Unknown inputs must be labeled unknown, not silently treated as valid.

### Acceptance Criteria

- Data fitness type and helpers exist.
- Missing metadata produces `unknown` or `blocked`, not false readiness.
- Existing workflows compile.

### Validation

- Typecheck.
- Unit tests for scoring helpers.
- Existing map QA tests if touched.

### Stop Conditions

- Required layer metadata is unavailable and a broader Map Explorer contract is needed first. Implement type-only foundation and record blocker.

---

## Prompt 06 - Method Validity Envelope and Capability Metadata

### Agent Instruction

Add a method validity envelope and capability metadata system for Urban Analytics method cards, indicators, and workflows.

### Required Reading

Read Urban plan sections 4.2, 4.5, 7.1, 19.4, 22, 23.2, and 23.5.

### Files To Inspect

- `src/features/urbanAnalytics/lib/types.ts`
- `src/features/urbanAnalytics/seeds/*`
- `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
- `src/features/urbanAnalytics/lib/tagGroups.ts`
- `src/features/urbanAnalytics/indicators/types.ts`
- `src/centerpanel/Flows/flowLibraryMeta.ts`
- `src/centerpanel/Flows/workflowExperience.ts`

### Scope

- Add metadata fields for method validity.
- Do not rewrite the full seed library in one pass.
- Provide validation helpers and fallback defaults.

### Implementation Tasks

1. Define `UrbanMethodValidityEnvelope`:
   - valid spatial scale
   - required data types
   - required fields
   - required CRS or projection assumptions
   - temporal assumptions
   - method family
   - maturity level
   - limitations
   - interpretation warnings
   - capability status
2. Define capability status values:
   - implemented
   - demo_mode
   - residual_gap
   - environment_dependent
   - deferred
3. Add validation helper for method metadata completeness.
4. Apply metadata to a small representative subset if safe.
5. Ensure existing cards without metadata degrade truthfully.
6. Update ledger.

### Scientific Rationale

Methods are only defensible within a validity envelope. The UI must communicate scale, data needs, assumptions, and limitations before users run or interpret analysis.

### Acceptance Criteria

- Validity envelope type exists.
- Capability status is explicit.
- Missing metadata is visible to developers and not misrepresented to users.

### Validation

- Typecheck.
- Metadata validation tests if feasible.
- Existing seed tests if present.

### Stop Conditions

- Current seed object shape is too inconsistent for safe metadata expansion. Add adapter and record migration plan.

---

## Prompt 07 - Premium Modal Shell and Context Strip

### Agent Instruction

Refine the Urban Analytics modal shell into a premium scientific cockpit while preserving the existing three-panel structure.

### Required Reading

Read Urban plan sections 6, 11, 22, and tri-modal Shared Wire/Layout and Premium UI rules.

### Files To Inspect

- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- Urban modal styles.
- `src/centerpanel/UrbanContextStrip.tsx`
- Context store.
- Theme/token files.

### Scope

- Preserve the three-panel modal.
- Add or refine context strip behavior.
- Improve density, hierarchy, status semantics, and responsive constraints.
- Avoid broad redesign.

### Implementation Tasks

1. Audit modal regions: top bar, left rail, center panel, right panel, evidence tray area.
2. Add active context summary:
   - study area
   - active method/workflow
   - selected layers
   - data fitness status
   - active run
   - sync state
3. Add truthful disabled or stale states.
4. Improve layout constraints to prevent overlap.
5. Align status language with tri-modal spec.
6. Update ledger.

### Premium UX Requirements

- Dense but readable.
- No marketing hero layout.
- No decorative cards inside cards.
- Context must be visible without overwhelming the work surface.

### Acceptance Criteria

- Modal remains structurally familiar.
- Context strip displays real state or truthful empty state.
- Responsive behavior does not break left/right panel duties.

### Validation

- Typecheck.
- Component tests if available.
- Manual UI smoke if dev server can run.

### Stop Conditions

- Existing modal layout is too brittle and requires a separate layout refactor prompt.

---

## Prompt 08 - Left Rail Research Navigator Metadata

### Agent Instruction

Upgrade the left rail from simple browsing into a research-grade method navigator with scientific metadata.

### Required Reading

Read Urban plan sections 6.2, 18.4, 21.3, 22.3, and 24 Epic 3.

### Files To Inspect

- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/rail/rail.css`
- `src/features/urbanAnalytics/lib/sectionHierarchy.ts`
- `src/features/urbanAnalytics/lib/tagGroups.ts`
- `src/features/urbanAnalytics/store.ts`
- Seed library files.

### Scope

- Add metadata display and filtering hooks.
- Preserve existing search, favorites, and selection behavior.
- Avoid migrating all method content at once.

### Implementation Tasks

1. Add method badges for scale, maturity, data requirement, validation status, and capability status where metadata exists.
2. Add fallback states for missing metadata.
3. Add rail item affordances for related workflows, indicators, datasets, and code artifacts where known.
4. Preserve keyboard and search behavior.
5. Ensure rail density remains professional.
6. Update ledger.

### Scientific Rationale

Method discovery must help users choose defensible methods, not simply attractive cards. The rail should reveal whether a method fits the current question, data, and scale.

### Acceptance Criteria

- Rail shows useful metadata without clutter.
- Existing favorites and recents remain intact.
- Missing metadata does not create false claims.

### Validation

- Typecheck.
- Existing rail or right-panel tests.
- Manual selection/search smoke.

### Stop Conditions

- Current rail data shape cannot support metadata without the validity envelope prompt being incomplete.

---

## Prompt 09 - Rail Search, Filters, and Recommendations

### Agent Instruction

Make rail search and filtering project-aware using Urban Analysis Context, method metadata, and data fitness signals.

### Required Reading

Read Urban plan sections 6.2, 7.2, 20.3, 24 Epic 3, and tri-modal Shared Command Language.

### Files To Inspect

- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/store.ts`
- Fuse search configuration.
- Context store.
- Method validity helpers.
- Data fitness helpers.
- Map context adapter if present.

### Scope

- Improve ranking and filtering.
- Do not hide methods permanently because context is incomplete.
- Explain recommendations truthfully.

### Implementation Tasks

1. Add filter groups:
   - scale
   - data type
   - method maturity
   - readiness
   - capability status
   - related workflow
   - related indicator
2. Enrich search fields with assumptions, references, required datasets, and related flows.
3. Add project-aware ranking from active context.
4. Add recommendation reasons.
5. Add disabled or warning reasons for methods that lack required data.
6. Update ledger.

### Scientific Rationale

Recommendations must be explainable. A planning analyst should understand why a method is suggested and what data or assumptions are missing.

### Acceptance Criteria

- Search remains fast.
- Recommendation reasons are visible.
- Filters do not conceal unavailable-but-relevant methods without explanation.

### Validation

- Typecheck.
- Search/ranking tests if feasible.
- Manual query smoke.

### Stop Conditions

- Fuse or current search implementation cannot safely accept enriched metadata without performance work.

---

## Prompt 10 - Right Panel Scientific Dossier

### Agent Instruction

Transform the right panel into a scientific dossier for the selected method, indicator, workflow, or evidence artifact.

### Required Reading

Read Urban plan sections 6.4, 18.5, 21.4, 22.5, 23, and tri-modal Scientific QA.

### Files To Inspect

- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- `src/features/urbanAnalytics/rightPanelUtils.ts`
- `src/features/urbanAnalytics/rightPanelRegistry.ts`
- `src/features/urbanAnalytics/rightPanelTypes.ts`
- `src/features/urbanAnalytics/rightPanelFourBlock.css`
- Method metadata and evidence artifact types.

### Scope

- Preserve four-block structure if present.
- Improve evidence, method, data, and action blocks.
- Avoid adding fake citations or fake validation.

### Implementation Tasks

1. Define dossier block responsibilities:
   - method summary
   - required inputs
   - validity envelope
   - data fitness
   - assumptions and limitations
   - related workflows
   - references
   - export/actions
2. Render capability status and missing metadata truthfully.
3. Add artifact links where available.
4. Ensure actions are enabled only with real handlers.
5. Update ledger.

### Scientific Rationale

The right panel should be where a user verifies whether a method is scientifically defensible for the current question and data.

### Acceptance Criteria

- Right panel exposes method assumptions and limitations.
- Data and action states are truthful.
- Existing fallback tests remain valid or are updated appropriately.

### Validation

- Typecheck.
- `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx` if available.
- Manual selection smoke.

### Stop Conditions

- Right panel registry lacks enough structure for safe expansion. Add adapter and record risk.

---

## Prompt 11 - Evidence Tray and Provenance Surface

### Agent Instruction

Add or refine an evidence tray that lists active artifacts, provenance, QA, and cross-module actions for the current Urban Analysis Context.

### Required Reading

Read Urban plan sections 5.2, 10, 19.2, 22.6, and tri-modal Shared Evidence Tray.

### Files To Inspect

- Urban modal shell.
- Evidence artifact registry.
- Right panel.
- Context store.
- `src/stores/useFlowStore.ts`
- `src/services/reporting/`
- Map and IDE bridge services.

### Scope

- Implement a compact evidence tray surface.
- Show artifact references and QA summaries.
- Do not duplicate raw data or large geometry.

### Implementation Tasks

1. Design tray placement within existing modal layout.
2. List artifacts by active context.
3. Show artifact kind, source module, status, QA, and updated time.
4. Add actions:
   - inspect
   - open related map layer
   - open related code artifact
   - add to report
   - bind to dashboard
5. Disable actions truthfully when no contract exists.
6. Update ledger.

### Scientific Rationale

The evidence tray makes the lifecycle of analysis visible: context, data, method, run, map output, code, report, and dashboard are no longer disconnected outputs.

### Acceptance Criteria

- Tray shows active evidence without crowding the modal.
- Artifacts include provenance and QA status.
- Actions use existing or documented contracts.

### Validation

- Typecheck.
- Component tests if feasible.
- Manual artifact fixture check.

### Stop Conditions

- Evidence artifact registry is incomplete or missing from prior prompts.

---

## Prompt 12 - Indicator Catalog V2 Metadata Traceability

### Agent Instruction

Upgrade the indicator catalog so every indicator has traceable scientific metadata.

### Required Reading

Read Urban plan sections 7.1, 18.6, 21.6, 23, 24 Epic 5, and 27.1.

### Files To Inspect

- `src/features/urbanAnalytics/indicators/catalog.ts`
- `src/features/urbanAnalytics/indicators/types.ts`
- `src/features/urbanAnalytics/indicators/shared.ts`
- `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
- `src/features/urbanAnalytics/indicators/__tests__/catalog.test.ts`

### Scope

- Add metadata fields and validation helpers.
- Preserve current catalog behavior.
- Do not rewrite all formulas without tests.

### Implementation Tasks

1. Ensure each indicator can express:
   - formula
   - units
   - spatial scale
   - temporal scale
   - input fields
   - normalization method
   - interpretation
   - limitations
   - reference or source note
   - capability status
2. Add catalog validation for required metadata.
3. Add display support in catalog panel for key metadata.
4. Add fallback for legacy indicators.
5. Update ledger.

### Scientific Rationale

Indicators are not just numbers. Without formula, unit, scale, and interpretation, indicator outputs can mislead planning decisions.

### Acceptance Criteria

- Indicator metadata is typed.
- Catalog validation catches missing critical fields.
- UI shows formula/unit/scale where available.

### Validation

- `npm run test -- src/features/urbanAnalytics/indicators` if available.
- Typecheck.
- Catalog tests.

### Stop Conditions

- Existing indicator types are too fragmented and need a compatibility layer first.

---

## Prompt 13 - Indicator Calculators QA and Unit Semantics

### Agent Instruction

Harden indicator calculators so results carry units, input assumptions, QA status, and interpretation warnings.

### Required Reading

Read Urban plan sections 7.1, 7.3, 19.3, 23.1, and 27.1.

### Files To Inspect

- `src/features/urbanAnalytics/calculators/*`
- `src/features/urbanAnalytics/calculators/__tests__/*`
- `src/features/urbanAnalytics/indicators/types.ts`
- `src/stores/useCalcStore.ts`
- `src/centerpanel/registry/types.ts`

### Scope

- Improve calculator result metadata.
- Add QA wrappers where needed.
- Do not change mathematical formulas without evidence and tests.

### Implementation Tasks

1. Audit calculator output shapes.
2. Ensure `IndicatorResult` can include:
   - unit
   - input count
   - missingness
   - valid/invalid state
   - warnings
   - source calculator
   - timestamp
3. Add conservative QA wrappers for calculators.
4. Update tests for representative calculators.
5. Update ledger.

### Scientific Rationale

Indicator outputs must preserve how they were computed and whether inputs were sufficient. Silent calculation over missing or invalid data damages scientific trust.

### Acceptance Criteria

- Representative calculators return QA-aware results.
- Existing formulas are not changed without explicit reason.
- Invalid inputs produce warnings or blocked states.

### Validation

- Calculator tests.
- Typecheck.
- Existing flow tests if calculator output shape affects them.

### Stop Conditions

- Calculator output types are consumed broadly and require phased migration.

---

## Prompt 14 - Workflow Runtime Run Manifest

### Agent Instruction

Add a reproducible run manifest to analytical workflow execution.

### Required Reading

Read Urban plan sections 7.2, 10.2, 19.5, 21.7, 24 Epic 6, and 25 Phase 5.

### Files To Inspect

- `src/centerpanel/Flows/*`
- `src/centerpanel/Flows/flowTypes.ts`
- `src/centerpanel/Flows/flowLibraryMeta.ts`
- `src/stores/useFlowStore.ts`
- `src/features/urbanAnalytics/lib/types.ts`
- Completed analysis run producers.

### Scope

- Define and attach run manifest metadata.
- Preserve existing completed run consumers.
- Avoid blocking all workflows until migration is complete.

### Implementation Tasks

1. Define `UrbanWorkflowRunManifest`:
   - runId
   - flowId
   - contextId
   - inputs
   - parameters
   - method validity
   - data fitness
   - outputs
   - code artifact references
   - map artifact references
   - report/dashboard references
   - runtime mode
   - createdAt
2. Add manifest to completed runs or sidecar registry.
3. Add helper to build manifest from known flow context.
4. Add compatibility for legacy runs.
5. Update ledger.

### Scientific Rationale

Workflow outputs must be reproducible. A run manifest records what ran, with which data, under which assumptions, and what evidence it produced.

### Acceptance Criteria

- New run manifest type exists.
- Representative workflow can create manifest or sidecar record.
- Legacy completed runs remain readable.

### Validation

- Flow store tests.
- Typecheck.
- Representative workflow tests if available.

### Stop Conditions

- Completed run shape is too central for direct changes. Use sidecar manifest registry.

---

## Prompt 15 - Workflow Readiness Gates and Failure Modes

### Agent Instruction

Add truthful readiness gates and failure-mode handling before workflows run.

### Required Reading

Read Urban plan sections 7.2, 7.3, 23.3, 23.5, and tri-modal QA Blocker Propagation.

### Files To Inspect

- Workflow components.
- `src/centerpanel/Flows/workflowExperience.ts`
- Data fitness helpers.
- Method validity helpers.
- Map dispatch services.
- `src/stores/useFlowStore.ts`

### Scope

- Add readiness evaluation before workflows run.
- Do not block demo workflows without truthful mode labels.
- Do not silently fall back to synthetic data.

### Implementation Tasks

1. Define readiness result:
   - ready
   - warning
   - blocked
   - demo_only
   - unknown
2. Evaluate required inputs, active context, data fitness, method validity, and environment dependencies.
3. Show blocked reasons and remediation actions.
4. Record readiness result in run manifest.
5. Connect failures to evidence artifacts where appropriate.
6. Update ledger.

### Scientific Rationale

Users must know whether a workflow is scientifically ready before running it. Blocking invalid runs is better than producing polished but misleading results.

### Acceptance Criteria

- Workflows expose readiness before execution.
- Demo or environment-dependent modes are labeled.
- Failure modes are recorded and visible.

### Validation

- Typecheck.
- Readiness helper tests.
- Representative workflow smoke.

### Stop Conditions

- Workflow surfaces are too heterogeneous; implement a shared readiness helper and integrate one representative flow first.

---

## Prompt 16 - Map Explorer Incoming Context Adapter

### Agent Instruction

Implement Urban Analytics receiving behavior for Map Explorer AOI, layer, selection, and QA context.

### Required Reading

Read Urban plan sections 9, 20.3, 21.9, 24 Epic 7, and tri-modal Map Layer to Urban Evidence journey.

### Files To Inspect

- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapSyncService.ts`
- `src/features/urbanAnalytics/store.ts`
- Context store.
- Evidence artifact registry.

### Scope

- Add Urban-side adapter for map context.
- Do not implement Map Explorer UI or rendering.
- Do not move large geometry into Urban Analytics state.

### Implementation Tasks

1. Verify existing map dispatch payloads.
2. Define `MapToUrbanContextSummary`:
   - AOI reference
   - layer IDs
   - geometry type summary
   - field summary
   - CRS summary
   - feature count
   - temporal fields
   - QA summary
3. Update Urban Analysis Context from map summaries.
4. Register map-origin evidence artifacts by reference.
5. Trigger method recommendations where safe.
6. Update ledger contract registry.

### Scientific Rationale

Map Explorer provides spatial context, but Urban Analytics interprets it scientifically. The adapter must preserve references and QA without taking ownership of map rendering state.

### Acceptance Criteria

- Urban context can receive map AOI/layer summaries.
- No heavy geometry is persisted in Urban Analytics.
- Recommendations can explain why map context matters.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Existing map dispatcher tests if touched.

### Stop Conditions

- Map payloads lack stable layer or AOI identity.

---

## Prompt 17 - Urban to Map Evidence Publication

### Agent Instruction

Implement Urban Analytics publication of spatial evidence outputs to Map Explorer through documented contracts.

### Required Reading

Read Urban plan sections 9, 20.4, 21.9, 24 Epic 7, and tri-modal Urban Method to Map journey.

### Files To Inspect

- Evidence artifact registry.
- Workflow run manifest.
- `src/stores/useMapExplorerStore.ts`
- `src/services/map/MapEngineAdapter.ts`
- `src/services/map/MapReportHandoffService.ts`
- Map output types.

### Scope

- Publish spatial outputs by reference and metadata.
- Do not render map layers inside Urban Analytics.
- Do not push bulky geometry through generic UI events.

### Implementation Tasks

1. Define `UrbanToMapEvidencePublication`:
   - artifact ID
   - run ID
   - output layer reference
   - style/legend metadata
   - CRS summary
   - QA summary
   - uncertainty notes
   - report-ready figure metadata
2. Add publication action for eligible workflow outputs.
3. Use existing Map Explorer store/service APIs after verifying signatures.
4. Record publication in evidence artifact registry.
5. Update ledger.

### Scientific Rationale

A map output is an evidence object. It must carry method, parameter, QA, and uncertainty metadata so visual inspection does not disconnect from analytical meaning.

### Acceptance Criteria

- Eligible Urban outputs can publish to Map Explorer.
- Published metadata includes provenance and QA.
- Ineligible outputs are disabled with reasons.

### Validation

- Typecheck.
- Map service tests if touched.
- Manual publication smoke if UI can run.

### Stop Conditions

- Map Explorer publication API cannot accept metadata without a Map Explorer prompt dependency.

---

## Prompt 18 - Synapse IDE Code Artifact Generation

### Agent Instruction

Allow Urban Analytics to request reproducible code artifacts through Synapse IDE bridge contracts.

### Required Reading

Read Urban plan sections 8, 20.5, 21.10, 26, and tri-modal Urban Method to IDE journey.

### Files To Inspect

- `src/services/editorBridge.ts`
- `src/services/editor/bridge.ts`
- `src/features/urbanAnalytics/python/*`
- `src/features/urbanAnalytics/python/templates/*`
- Evidence artifact registry.
- Workflow run manifest.
- Synapse IDE plan for bridge awareness only.

### Scope

- Generate script/notebook/manifest text or request objects.
- Route edits through IDE bridge; do not own editor state.
- Do not silently insert code without explicit user action.

### Implementation Tasks

1. Verify editor bridge contracts.
2. Define `UrbanCodeArtifactRequest`:
   - artifact ID
   - context ID
   - run ID
   - method ID
   - language
   - target file suggestion
   - content
   - provenance
3. Add actions:
   - generate Python script
   - generate JSON manifest
   - generate Markdown method note
   - generate TypeScript adapter snippet
4. Register generated code request as evidence artifact.
5. Update ledger.

### Scientific Rationale

Reproducible code must be tied to the method, inputs, assumptions, and run. Urban Analytics requests code; Synapse IDE owns editing and application.

### Acceptance Criteria

- Urban Analytics can generate reproducible code artifact requests.
- IDE bridge calls are explicit and guarded.
- Generated code includes provenance comments or metadata.

### Validation

- Typecheck.
- Template generation tests if feasible.
- Manual bridge simulation if practical.

### Stop Conditions

- IDE bridge cannot safely accept generated content. Implement request preview only and record blocker.

---

## Prompt 19 - IDE to Urban File and Artifact Recognition

### Agent Instruction

Support incoming Synapse IDE references to urban analysis files, code artifacts, and manifests.

### Required Reading

Read Urban plan sections 8, 20.5, 21.10, and tri-modal IDE File to Map Layer to Urban Recommendation journey.

### Files To Inspect

- Urban Analytics store/context.
- Evidence artifact registry.
- IDE bridge files.
- File type detection if present.
- Code artifact types from Prompt 18.

### Scope

- Implement Urban-side receiving behavior.
- Do not inspect or mutate IDE buffers directly.
- Use file/artifact references, not editor state.

### Implementation Tasks

1. Define incoming artifact recognition payload:
   - file path
   - language
   - artifact kind
   - manifest metadata
   - related layer/run IDs
   - source module
2. Recognize supported files:
   - `.urban.json`
   - `.geojson`
   - `.ipynb`
   - `.py`
   - `.sql`
   - project manifests
3. Update Urban context where safe.
4. Recommend relevant methods or workflows.
5. Register evidence artifact references.
6. Update ledger.

### Scientific Rationale

Code and manifest files can be scientific evidence. Urban Analytics should interpret their metadata without taking ownership of editor state.

### Acceptance Criteria

- Incoming IDE references can become Urban evidence artifacts.
- Recommendations are explicit and explainable.
- Invalid or unsupported files are labeled truthfully.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual event simulation.

### Stop Conditions

- No stable IDE-to-Urban bridge exists yet. Define types and record dependency.

---

## Prompt 20 - Reporting Evidence Blocks

### Agent Instruction

Enable Urban Analytics to insert report-ready evidence blocks with method assumptions, provenance, QA, and limitations.

### Required Reading

Read Urban plan sections 10, 20.6, 21.11, 24 Epic 9, and tri-modal Publication Export Path.

### Files To Inspect

- `src/services/reporting/*`
- `src/services/reporting/types.ts`
- `src/services/reporting/ReportBuilderPanel.tsx`
- `src/stores/useFlowStore.ts`
- Evidence artifact registry.
- Right panel actions.

### Scope

- Add structured report insertion metadata.
- Do not redesign the report builder.
- Do not insert claims without provenance.

### Implementation Tasks

1. Define `UrbanReportEvidenceBlock`:
   - artifact ID
   - run ID
   - title
   - method summary
   - data summary
   - QA summary
   - assumptions
   - limitations
   - map figure reference
   - citations or reference notes
2. Add action from evidence tray or right panel.
3. Use existing reporting services after verifying API.
4. Record report binding on evidence artifact.
5. Update ledger.

### Scientific Rationale

Reports are where analysis becomes communication. Evidence blocks must preserve assumptions and limitations instead of producing polished but decontextualized prose.

### Acceptance Criteria

- Report insertion uses structured evidence.
- Blocks include QA and limitations.
- Existing reporting workflows remain compatible.

### Validation

- Typecheck.
- Reporting service tests if available.
- Manual report insertion smoke if UI can run.

### Stop Conditions

- Reporting service cannot accept structured metadata. Create adapter or request object only.

---

## Prompt 21 - Dashboard Bindings and Scenario Outputs

### Agent Instruction

Bind Urban Analytics evidence and scenario outputs to dashboard widgets with traceability.

### Required Reading

Read Urban plan sections 20.7, 21.11, 24 Epic 10, and tri-modal artifact state/action rules.

### Files To Inspect

- `src/features/dashboard/*`
- Dashboard stores/services.
- `src/services/reporting/types.ts`
- Evidence artifact registry.
- Workflow run manifest.
- Indicator result types.

### Scope

- Add Urban-side dashboard binding metadata.
- Do not redesign dashboards.
- Avoid live binding claims unless state is actually reactive.

### Implementation Tasks

1. Define `UrbanDashboardBinding`:
   - binding ID
   - artifact ID
   - indicator/run reference
   - widget type
   - refresh mode
   - provenance
   - QA state
2. Add action for eligible indicators and run outputs.
3. Use existing dashboard APIs after verifying signatures.
4. Label static vs live bindings truthfully.
5. Update ledger.

### Scientific Rationale

Dashboards can amplify misleading outputs if provenance disappears. Every widget should know which run, method, and data assumptions produced it.

### Acceptance Criteria

- Eligible Urban evidence can bind to dashboard.
- Binding metadata includes provenance and QA.
- Static/live state is truthful.

### Validation

- Typecheck.
- Dashboard tests if touched.
- Manual binding smoke if practical.

### Stop Conditions

- Dashboard API is unavailable or incompatible. Implement binding request model only.

---

## Prompt 22 - Education Mode and Method Learning Path

### Agent Instruction

Make Urban Analytics methods and workflows usable as education-ready learning paths without weakening professional density.

### Required Reading

Read Urban plan sections 20.8, 21.11, 24 Epic 11, and tri-modal education responsibilities.

### Files To Inspect

- `src/features/education/*`
- `src/centerpanel/Guide/*`
- Urban method metadata.
- Right panel dossier.
- Evidence artifact registry.

### Scope

- Add education handoff metadata and learning step references.
- Do not turn the Urban Analytics modal into a tutorial-only interface.

### Implementation Tasks

1. Define `UrbanLearningPathReference`:
   - method ID
   - workflow ID
   - concepts
   - prerequisites
   - intermediate values
   - evidence artifacts
   - interpretation prompts
2. Add "Open learning path" action where education content exists.
3. Link method assumptions and limitations to teaching steps.
4. Preserve professional UI density.
5. Update ledger.

### Scientific Rationale

Urban analytics education should show how evidence is produced, not only what buttons to click. Learning paths should reveal assumptions, intermediate values, and interpretation boundaries.

### Acceptance Criteria

- Education links are explicit and guarded.
- Learning paths preserve scientific context.
- Professional workflow remains primary.

### Validation

- Typecheck.
- Education link tests if available.
- Manual action smoke.

### Stop Conditions

- Education module has no stable handoff API. Add metadata-only contract.

---

## Prompt 23 - VoxCity 2D/3D Scenario Coherence

### Agent Instruction

Align VoxCity and 2D/3D urban scenario outputs with the Urban Evidence Artifact and context model.

### Required Reading

Read Urban plan sections 21.12, 24 Epic 12, 25 Phase 9, and tri-modal Performance/Data Movement rules.

### Files To Inspect

- `src/features/urbanAnalytics/voxcity/*`
- VoxCity tests.
- Scenario compare components.
- Evidence artifact registry.
- Context store.
- Map Explorer contracts if 2D/3D sync exists.

### Scope

- Add metadata and evidence references for VoxCity/3D outputs.
- Do not rebuild 3D rendering.
- Do not move heavy meshes or voxel data through Urban state.

### Implementation Tasks

1. Define 3D scenario evidence metadata:
   - model reference
   - spatial reference
   - scenario parameters
   - simulation type
   - assumptions
   - uncertainty
   - output references
2. Register VoxCity outputs as evidence artifacts.
3. Link 2D map references and 3D scenario references by artifact ID.
4. Add QA warnings for demo/sample data.
5. Update ledger.

### Scientific Rationale

3D urban simulations are compelling but can be misleading. Scenario parameters, source data, sample/demo status, and uncertainty must stay visible.

### Acceptance Criteria

- VoxCity outputs can be represented as evidence artifacts.
- Sample/demo data is clearly labeled.
- No heavy 3D payloads are duplicated in Urban context.

### Validation

- Typecheck.
- VoxCity tests if touched.
- Manual 3D smoke only if practical.

### Stop Conditions

- 3D components lack stable output identity.

---

## Prompt 24 - Scenario Comparison and Policy Interpretation

### Agent Instruction

Add scenario comparison and policy interpretation metadata that respects evidence, uncertainty, and limitations.

### Required Reading

Read Urban plan sections 3, 7.2, 19.4, 23.5, 24 Epic 12, and 30 Final Quality Bar.

### Files To Inspect

- Scenario compare components.
- Workflow run manifests.
- Indicator result types.
- Evidence artifact registry.
- Right panel dossier.
- Dashboard/report bindings.

### Scope

- Represent scenario comparisons and interpretations.
- Do not claim policy recommendations as facts.
- Label uncertainty and assumptions.

### Implementation Tasks

1. Define `UrbanScenarioComparison`:
   - baseline run
   - candidate runs
   - indicators compared
   - deltas
   - uncertainty notes
   - policy interpretation
   - limitations
   - evidence artifacts
2. Add scenario comparison metadata to eligible outputs.
3. Surface interpretation guidance in right panel or evidence tray.
4. Provide report/dashboard handoff metadata.
5. Update ledger.

### Scientific Rationale

Scenario comparison is central to planning, but interpretation must remain transparent about assumptions, uncertainty, and tradeoffs.

### Acceptance Criteria

- Scenario comparisons have stable identity and provenance.
- Policy interpretation is framed as guidance, not certainty.
- Limitations are visible.

### Validation

- Typecheck.
- Tests for comparison helpers if feasible.
- Manual comparison fixture check.

### Stop Conditions

- No stable scenario/run IDs exist. Add type foundation and record dependency.

---

## Prompt 25 - Reproducible Package Export

### Agent Instruction

Create a reproducible export package model for Urban Analytics contexts, runs, evidence artifacts, code references, map references, reports, dashboards, and limitations.

### Required Reading

Read Urban plan sections 10.2, 19.5, 26, 28, and tri-modal Publication Export Path.

### Files To Inspect

- Evidence artifact registry.
- Run manifest.
- Context store.
- Code artifact generator.
- Reporting services.
- Dashboard bindings.
- File/export utilities if present.

### Scope

- Define export package schema and builder.
- Do not implement heavy binary export unless existing infrastructure supports it.
- Export references and manifests first.

### Implementation Tasks

1. Define `UrbanReproduciblePackage`:
   - package ID
   - context
   - run manifests
   - evidence artifacts
   - data references
   - map layer references
   - code artifact references
   - report/dashboard bindings
   - environment notes
   - limitations
   - createdAt
2. Add builder from active context.
3. Add JSON export action if safe.
4. Add validation warnings for missing references.
5. Update ledger.

### Scientific Rationale

Reproducibility requires more than exporting a chart. It requires context, data references, method assumptions, run parameters, outputs, code, and limitations.

### Acceptance Criteria

- Export package schema exists.
- Active context can produce a manifest.
- Missing references are reported.

### Validation

- Typecheck.
- Export builder tests.
- Manual JSON fixture check.

### Stop Conditions

- Export would imply access to raw data not available in browser state. Export manifest only.

---

## Prompt 26 - Accessibility and Keyboard Premium

### Agent Instruction

Harden accessibility and keyboard behavior across Urban Analytics while preserving professional density.

### Required Reading

Read Urban plan sections 11.4, 22.8, 27.6, and tri-modal Accessibility and Keyboard Alignment.

### Files To Inspect

- `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
- `src/features/urbanAnalytics/rail/RailContainer.tsx`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- Evidence tray.
- Indicator catalog panel.
- Workflow readiness surfaces.
- Keyboard shortcut utilities.

### Scope

- Improve focus order, ARIA labels, keyboard traversal, and visible focus states.
- Do not create a separate shortcut system.

### Implementation Tasks

1. Audit keyboard navigation across top bar, left rail, center panel, right panel, and evidence tray.
2. Add missing accessible labels to icon controls.
3. Ensure rail search/filter and method selection are keyboard reachable.
4. Ensure right panel dossier actions are reachable and named.
5. Ensure readiness blockers and QA states are announced when needed.
6. Align focus rings with shared tokens.
7. Update ledger.

### Premium UX Requirements

- Keyboard operation should feel intentional.
- Focus must never disappear.
- Dense UI must remain readable and navigable.

### Acceptance Criteria

- Core Urban Analytics workflows are keyboard reachable.
- Icon-only controls have accessible names.
- QA and blocked states are accessible.

### Validation

- Typecheck.
- Lint.
- Accessibility checks if available.
- Manual keyboard smoke.

### Stop Conditions

- Component primitives lack accessibility support and require broader replacement.

---

## Prompt 27 - Performance, Data Movement, and Resilience

### Agent Instruction

Harden Urban Analytics performance and resilience for long-running, data-rich scientific workflows.

### Required Reading

Read Urban plan sections 11, 14, 27.5, 28, and tri-modal Performance and Data Movement.

### Files To Inspect

- Modal shell render paths.
- Rail search and filtering.
- Right panel dossier.
- Evidence tray.
- Indicator catalog.
- Workflow store.
- Map adapters.
- Persistence utilities.

### Scope

- Improve performance hot spots identified by inspection.
- Bound stored histories and registries.
- Avoid speculative micro-optimization.

### Implementation Tasks

1. Identify avoidable rerenders in modal, rail, right panel, evidence tray, and indicator catalog.
2. Add selectors or memoization where codebase patterns support it.
3. Ensure search and recommendation work does not block UI.
4. Bound evidence registry and run history where appropriate.
5. Add stale-state recovery for missing layers, runs, code artifacts, reports, and dashboards.
6. Update ledger.

### Scientific Rationale

Urban analytics sessions can involve large evidence graphs and long workflows. The module must remain responsive and must recover honestly from missing references.

### Acceptance Criteria

- No obvious unbounded new state growth remains.
- Missing references degrade gracefully.
- Large method catalogs remain searchable.

### Validation

- Typecheck.
- Build if available.
- Performance smoke if fixtures exist.

### Stop Conditions

- Performance issue requires architectural change outside Urban Analytics ownership.

---

## Prompt 28 - QA Harness and Release Validation

### Agent Instruction

Create repeatable QA checks for Urban Analytics scientific workflows, UI contracts, and synchronization behavior.

### Required Reading

Read the full ledger. Read Urban plan sections 27, 30, and tri-modal Cross-Plan Acceptance Criteria.

### Files To Inspect

- Test setup.
- Existing Urban Analytics tests.
- Indicator tests.
- Calculator tests.
- VoxCity tests.
- Map service tests.
- Reporting tests.
- Package scripts.

### Scope

- Add focused tests where implementation introduced meaningful logic.
- Do not add brittle snapshot tests for visual polish.

### Implementation Tasks

1. Identify untested high-risk logic:
   - context store
   - evidence artifact registry
   - data fitness helpers
   - method validity helpers
   - indicator metadata validation
   - run manifest builder
   - map adapter
   - IDE code artifact generator
   - report/dashboard binding builders
2. Add unit or integration tests using existing patterns.
3. Add a manual QA checklist for UI workflows if E2E is unavailable.
4. Ensure validation commands are documented in the ledger.
5. Update ledger.

### Acceptance Criteria

- Critical scientific logic has focused tests.
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

Perform final Urban Analytics polish and prepare a durable handoff for Map Explorer and Synapse IDE implementation prompts.

### Required Reading

Read all canonical documents. Read the full ledger. Read all completed prompt entries.

### Files To Inspect

- All files changed by prior prompts.
- Urban modal shell.
- Rail.
- Right panel.
- Evidence tray.
- Indicator catalog.
- Workflow runtime.
- Map and IDE adapters.
- Reporting/dashboard/education bindings.
- Theme files.
- Tests and docs.

### Scope

- Finish minor polish.
- Remove dead placeholders.
- Confirm cross-module readiness.
- Do not start Map Explorer or Synapse IDE implementation.

### Implementation Tasks

1. Audit all Urban Analytics surfaces for visual coherence.
2. Confirm no fake "coming soon" states remain.
3. Confirm data fitness, method validity, and QA states are truthful.
4. Confirm all cross-module actions are guarded by real contracts.
5. Confirm ledger contract registry is complete.
6. Confirm token usage aligns with tri-modal premium design.
7. Confirm validation commands pass or failures are recorded.
8. Create final handoff notes for Map Explorer and Synapse IDE prompt execution.
9. Update ledger with final Urban Analytics readiness status.

### Premium UX Acceptance

- Urban Analytics feels like a premium scientific command cockpit.
- It remains dense, calm, and professional.
- It coordinates with Map Explorer and Synapse IDE without becoming them.
- It exposes evidence, method validity, data fitness, and provenance wherever analysis intersects external modules.

### Final Validation

Run the strongest reasonable validation set:

- Typecheck.
- Lint.
- Unit tests.
- Build.
- UI smoke or Playwright if available.

If any command fails, record whether the failure is related to Urban Analytics changes.

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

## Future Prompt Authoring Notes

When creating Map Explorer sequential prompt files, reuse this structure:

1. Canonical source chain.
2. Amnesia-proof rules.
3. Product thesis.
4. Module boundaries.
5. Global context block.
6. Required completion report.
7. Sequential prompt index.
8. Self-contained prompt blocks.
9. Ledger update requirement.
10. Cross-module acceptance rules.

The three prompt files must share the same protocol and ledger discipline. They may differ in implementation scope, but they must not diverge in product language, synchronization architecture, scientific truthfulness, or premium UI philosophy.

## Closing Instruction

An agent implementing Urban Analytics must never end a prompt by saying only what it changed in chat. It must update `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md` so the next agent can continue without memory loss.
