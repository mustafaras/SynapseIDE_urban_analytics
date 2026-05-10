# Map Explorer Implementation Ledger

## Purpose

This ledger is the durable memory for Map Explorer implementation. Every agent must read it before starting and update it before finishing.

The ledger prevents amnesia between agents, models, sessions, and context resets. It records what was inspected, changed, validated, deferred, blocked, or scientifically constrained.

## Canonical Documents

Read these before implementing any Map Explorer prompt:

1. `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
2. `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
3. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
4. `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
5. `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
6. `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
7. `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
8. This ledger.

## Current Status

- Overall status: Not started.
- Current prompt: None completed.
- Next recommended prompt: Prompt 00 - Memory Bootstrapping and Repository Baseline.
- Operating pack status: Installed.
- Next-prompt helper: `scripts/get-next-map-explorer-prompt.ps1`
- Machine-readable manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
- Last validated repository state: Not recorded for product implementation.
- Last known blocker: None recorded.

## Agent Operating Pack

Use this pack for every future Map Explorer implementation session:

1. Start from `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`.
2. Run `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` when script execution is available.
3. Read the returned prompt block in `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`.
4. Implement only that prompt unless the user explicitly asks for a different prompt.
5. Finish with `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`.
6. Update this ledger before final response.

Valid prompt statuses:

- `pending`
- `in_progress`
- `completed`
- `blocked`
- `skipped_with_reason`

## Prompt Status Register

This table is the human-readable execution state. The helper script reads it when selecting the next prompt. Keep it synchronized with the Prompt Execution Log.

| ID | Prompt | Status | Depends On | Notes |
| --- | --- | --- | --- | --- |
| 00 | Memory Bootstrapping and Repository Baseline | pending | None | Start here. |
| 01 | Map Architecture Map and Spatial Ownership Boundaries | pending | 00 | Requires baseline audit. |
| 02 | Map Context Kernel and Selectors | pending | 01 | Requires architecture map. |
| 03 | Map Evidence Artifact Model Foundation | pending | 02 | Requires context kernel. |
| 04 | Store Persistence Boundaries and Project Snapshots | pending | 03 | Requires evidence model. |
| 05 | Modal Shell Decomposition and Command Hooks | pending | 04 | Requires persistence boundaries. |
| 06 | Premium Workspace Shell and Context Strip | pending | 05 | Requires shell command hooks. |
| 07 | Layer Registry Metadata Upgrade | pending | 06 | Requires workspace shell. |
| 08 | Layer Manager Premium UX and Safety | pending | 07 | Requires layer metadata. |
| 09 | Scientific QA Model and Panel | pending | 08 | Requires layer manager safety. |
| 10 | Publication Readiness Gates | pending | 09 | Requires scientific QA. |
| 11 | Map Workflow Manifest and Preview | pending | 10 | Requires publication gates. |
| 12 | Analysis Recommendation and Dispatch | pending | 11 | Requires workflow manifest. |
| 13 | Engine Adapter Evidence Outputs | pending | 12 | Requires recommendation/dispatch. |
| 14 | Import and External Service Evidence | pending | 13 | Requires engine evidence output model. |
| 15 | CRS, Measurement, and Geometry Validation | pending | 14 | Requires import evidence. |
| 16 | Map to Urban Context Adapter | pending | 15 | Requires CRS/QA foundation. |
| 17 | Urban to Map Method Request Adapter | pending | 16 | Requires map-to-urban adapter. |
| 18 | Map to IDE Code and Manifest Artifact Requests | pending | 17 | Requires urban request adapter. |
| 19 | IDE to Map File and Layer Artifact Recognition | pending | 18 | Requires map-to-IDE request model. |
| 20 | Report Handoff Structured Evidence | pending | 19 | Requires IDE recognition contracts. |
| 21 | Dashboard, Education, and Publication Outputs | pending | 20 | Requires report handoff. |
| 22 | Temporal Playback and Scenario Comparison | pending | 21 | Requires publication output contracts. |
| 23 | VoxCity 2D/3D Synchronization | pending | 22 | Requires temporal/scenario model. |
| 24 | Natural-Language Query Safety and Audit | pending | 23 | Requires evidence and QA models. |
| 25 | Review Timeline and Audit Trail | pending | 24 | Requires NL query audit. |
| 26 | Accessibility and Keyboard Premium | pending | 25 | Requires review timeline. |
| 27 | Performance, Workers, Memory, and Chunking | pending | 26 | Requires accessibility hardening. |
| 28 | QA Harness and E2E Validation | pending | 27 | Requires performance hardening. |
| 29 | Final Premium Polish and Handoff | pending | 28 | Final Map Explorer readiness pass. |

## Non-Negotiable Operating Rules

- Do not assume a prompt is complete unless this ledger says it is complete and the repository supports that claim.
- Do not skip required reading.
- Do not overwrite user changes.
- Do not make unrelated refactors.
- Do not introduce a separate visual language for Map Explorer.
- Do not couple Map Explorer directly to Synapse IDE or Urban Analytics internals without a documented contract or adapter.
- Do not fake CRS, geometry validity, data readiness, map QA, workflow success, export readiness, or layer provenance.
- Do not persist large raw geometries in new lightweight context/evidence records.
- Do not finish without updating this ledger.

## Prompt Execution Log

No Map Explorer product implementation prompts have been executed yet.

Use this format for each entry:

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Files inspected:
- Files changed:
- Summary:
- Spatial evidence/provenance changes:
- CRS, geometry, or measurement changes:
- Scientific QA changes:
- Layer registry or persistence changes:
- Workflow/export/report changes:
- Contract changes:
- UX changes:
- Validation:
- Risks:
- Next recommended prompt:
```

### Operating Pack Installation - Automation Layer

- Date: 2026-05-02
- Agent: Codex
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/*`
  - `src/stores/useMapExplorerStore.ts`
  - `src/services/map/*`
- Files changed:
  - `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `scripts/get-next-map-explorer-prompt.ps1`
- Summary: Installed an automation-ready operating pack for future Map Explorer implementation agents. This did not execute Prompt 00 or any product implementation prompt.
- Spatial evidence/provenance changes: None in product code.
- CRS, geometry, or measurement changes: None in product code.
- Scientific QA changes: None in product code.
- Layer registry or persistence changes: None in product code.
- Workflow/export/report changes: None in product code.
- Contract changes: None.
- UX changes: None in product UI.
- Validation: Manifest parsed successfully with 30 prompts. Helper script returned Prompt 00 as the next pending prompt.
- Risks: None for product code; no product code changed.
- Next recommended prompt: Prompt 00 - Memory Bootstrapping and Repository Baseline.

## Files Inspected Registry

Append inspected files here as implementation progresses.

| Date | Prompt | Files inspected | Notes |
| --- | --- | --- | --- |
| 2026-05-02 | Operating Pack Installation | `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`, `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/*`, `src/stores/useMapExplorerStore.ts`, `src/services/map/*` | Planning and automation-pack inspection only. |
| Pending | Prompt 00 | Pending | No product implementation inspection has been recorded. |

## Files Changed Registry

Append changed files here as implementation progresses.

| Date | Prompt | Files changed | Reason |
| --- | --- | --- | --- |
| 2026-05-02 | Operating Pack Installation | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`, `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`, `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`, `scripts/get-next-map-explorer-prompt.ps1` | Added automation-ready prompt execution controls. |
| Pending | Prompt 00 | Pending | No product implementation changes have been recorded. |

## Cross-Module Contract Registry

Record every contract that connects Map Explorer with Synapse IDE, Urban Analytics, reporting, dashboard, or education.

| Date | Prompt | Contract | Direction | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Pending | Pending | `useMapExplorerStore` | Map Explorer state owner | Existing | Verify exact store API before changing. |
| Pending | Pending | `MAP_LAYER_REGISTRY_EVENT` | Map registry event | Existing | Verify event payload before adapting. |
| Pending | Pending | `MAP_ANALYSIS_DISPATCH_KEY` | Map Explorer to Urban/workflows | Existing | Verify payload before adapting. |
| Pending | Pending | `MapAnalysisDispatcher` | Map Explorer to workflows | Existing | Verify before adapting. |
| Pending | Pending | `MapWorkflowService` | Map workflow preview/apply | Existing | Verify before adapting. |
| Pending | Pending | `MapSyncService` | Map synchronization | Existing | Verify before adapting. |
| Pending | Pending | `MapReportHandoffService` | Map to report | Existing | Verify before adapting. |
| Pending | Pending | `MapScientificQA` | Map QA | Existing | Verify before adapting. |
| Pending | Pending | `src/services/editorBridge.ts` | Map Explorer to IDE | Existing/proposed | Verify bridge compatibility before changing. |
| Pending | Pending | `MapExplorerContextSummary` | Shared map context | Proposed | Implement only when prompted. |
| Pending | Pending | `MapEvidenceArtifact` | Shared map evidence reference | Proposed | Implement only when prompted. |
| Pending | Pending | `MapReproducibilityManifest` | Export/workflow reproducibility | Proposed | Implement only when prompted. |

## Scientific GIS Decision Registry

Record decisions that future agents must not re-litigate unless the repository proves they are wrong.

| Date | Prompt | Decision | Rationale | Status |
| --- | --- | --- | --- | --- |
| Pending | Pending | Map Explorer owns viewport, layers, AOI, selections, drawing, measurement, spatial QA, map review state, and map-derived evidence. | Required by tri-modal source-of-truth matrix. | Proposed |
| Pending | Pending | Urban Analytics owns method interpretation and method-specific data fitness; Map Explorer provides spatial QA summaries. | Prevents hidden scientific coupling. | Proposed |
| Pending | Pending | Synapse IDE owns code and file state; Map Explorer stores code/file references only. | Prevents Map Explorer from becoming an editor. | Proposed |
| Pending | Pending | Large geometries and raw datasets must remain in map state, services, or referenced external storage, not lightweight evidence payloads. | Protects performance and avoids event payload abuse. | Proposed |

## Validation History

Append validation runs here.

| Date | Prompt | Command | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-02 | Operating Pack Installation | `Get-Content DEVELOPMENT_PLANS\MAP_EXPLORER_PROMPT_MANIFEST.json -Raw \| ConvertFrom-Json` | Passed | Manifest parsed and reported 30 prompts. |
| 2026-05-02 | Operating Pack Installation | `powershell -ExecutionPolicy Bypass -File scripts\get-next-map-explorer-prompt.ps1` | Passed | Helper returned Prompt 00 as pending. |
| Pending | Prompt 00 | Pending | Pending | No product implementation validation has been recorded. |

## Known Risks

| Date | Prompt | Risk | Severity | Mitigation |
| --- | --- | --- | --- | --- |
| Pending | Pending | Existing implementation may differ from plan file paths. | Medium | Every prompt must inspect live imports before editing. |
| Pending | Pending | `MapExplorerModal.tsx` is large and can become a permanent super-component. | High | Extract selectors, hooks, services, and adapters incrementally. |
| Pending | Pending | CRS and measurement claims can become misleading if metadata is inferred too aggressively. | High | Require explicit unknown/warning states. |
| Pending | Pending | Cross-module bridges may be partially implemented. | Medium | Use adapters and ledger contract registry. |
| Pending | Pending | UI polish work may drift into broad redesign. | Medium | Preserve map-first workspace and follow tri-modal alignment spec. |

## Next Prompt Pointer

Start with:

`DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`

Prompt:

`Prompt 00 - Memory Bootstrapping and Repository Baseline`

Optional helper command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1
```

## Ledger Update Checklist

Before final response, every agent must confirm:

- The prompt ID is recorded.
- Prompt status is updated in the Prompt Status Register.
- Files inspected are recorded.
- Files changed are recorded.
- Validation is recorded.
- Spatial evidence/provenance changes are recorded or marked none.
- CRS, geometry, or measurement changes are recorded or marked none.
- Scientific QA changes are recorded or marked none.
- Layer registry or persistence changes are recorded or marked none.
- Workflow/export/report changes are recorded or marked none.
- Contract changes are recorded or marked none.
- Risks are recorded or marked none.
- The next prompt pointer is updated.
