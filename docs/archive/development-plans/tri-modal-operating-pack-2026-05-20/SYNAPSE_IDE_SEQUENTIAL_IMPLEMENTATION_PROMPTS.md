# Synapse IDE Sequential Implementation Prompts

## Document Role

This file converts the Synapse IDE development plan into an ordered implementation prompt ladder for high-capability coding agents. It is written to prevent agent amnesia. Any agent, in any future session, must be able to resume Synapse IDE implementation by reading this file plus the protocol, the alignment spec, the Synapse IDE plan, the ledger, and the live repository.

This file is not a replacement for the product plan. It is an execution system.

## Canonical Source Chain

Every agent must read these files before acting:

1. `DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md`
2. `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
3. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
4. `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
5. `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`
6. `DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json`
7. `DEVELOPMENT_PLANS/SYNAPSE_IDE_AGENT_HANDOFF_TEMPLATE.md`
8. This file.

The tri-modal alignment spec is the top-level product authority. The Synapse IDE plan is the module authority. This prompt file is the ordered implementation authority. The ledger is the durable execution memory.

## Operating Pack

For automation-ready execution, start from:

`DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md`

The machine-readable prompt catalog is:

`DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json`

The next prompt helper is:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-synapse-ide-prompt.ps1 -Json
```

The helper reads the ledger's Prompt Status Register. The ledger remains the execution source of truth.

## Amnesia-Proof Operating Rules

Use these rules in every prompt:

1. Do not rely on chat memory.
2. Do not assume prior prompt completion.
3. Read the ledger and verify the live repository.
4. Keep Synapse IDE synchronized with Map Explorer and Urban Analytics through contracts, not hidden coupling.
5. Preserve existing architecture unless the prompt explicitly changes it.
6. Keep UI premium, dense, deterministic, and scientifically credible.
7. Make every operation reversible where practical.
8. Record every decision in the ledger.
9. Validate narrowly and honestly.
10. Stop when a dependency is missing or contradictory.

## Synapse IDE Product Thesis

Synapse IDE is the coding and scientific execution cockpit of the tri-modal workbench. It owns code, files, terminal execution, diagnostics, AI-assisted patching, project memory, analysis scripts, artifact provenance, and developer-facing evidence.

It must not become a generic editor. It must feel like a premium geospatial analytics development environment where code, spatial evidence, and urban analytics workflows can move between modules with disciplined contracts.

The IDE must support:

- High-density professional coding workflows.
- Scientific traceability.
- Geospatial and urban analytics artifact awareness.
- Reversible AI apply workflows.
- Cross-module handoffs to Map Explorer and Urban Analytics.
- Stable state restoration.
- Keyboard-first interaction.
- Observable diagnostics and task state.

## Core Module Boundaries

Synapse IDE owns:

- Editor tabs and open ranges.
- Code files and file explorer state.
- Terminal sessions and tasks.
- Search and navigation.
- Diagnostics and problems.
- AI patch plans and apply history.
- Code artifacts generated from map or analytics evidence.

Map Explorer owns:

- Map viewport.
- Layers.
- Spatial selections.
- Feature inspection.
- Spatial artifact visualization.

Urban Analytics owns:

- Scenarios.
- Indicators.
- Assumptions.
- Model parameters.
- Analytical narratives.
- Uncertainty and evidence interpretation.

Shared synchronization must use typed contracts or adapters. Do not pass bulky geometry or large datasets through UI events.

## Global Context Block For Every Agent

Paste or preserve this context in every implementation session:

```md
You are implementing Synapse IDE inside the SynapseIDE urban analytics workbench.

Mandatory reading before editing:
- DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md
- DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md
- DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md
- DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md
- DEVELOPMENT_PLANS/SYNAPSE_IDE_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md
- DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json
- DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md
- DEVELOPMENT_PLANS/SYNAPSE_IDE_AGENT_HANDOFF_TEMPLATE.md

Do not trust memory. Verify the current repository. Preserve the existing architecture and premium tri-modal alignment. Update the ledger before final response.
```

## Required Completion Report

Every prompt must end with this report, and the same facts must be written into the ledger:

```md
Completed Prompt:
Files inspected:
Files changed:
Behavior implemented:
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
| 01 | IDE Architecture Map and Ownership Boundaries | Live architecture map aligned to plan |
| 02 | Premium Token and Theme Groundwork | Shared visual substrate without redesign drift |
| 03 | IDE Shell Stabilization and Layout Contract | Stable shell, rails, panels, and density rules |
| 04 | Header, Command Surface, and Status Semantics | Premium operational header |
| 05 | Editor Tab Model and Session Restoration | Reliable editor state and tab ergonomics |
| 06 | Monaco Surface Enhancement | Editor metadata, breadcrumbs, minimap discipline |
| 07 | Diagnostics and Problems Framework | Truthful code health surface |
| 08 | Symbol Outline and Code Intelligence Foundation | Navigation intelligence without overreach |
| 09 | File Explorer Spatial Project Semantics | GIS-aware project navigation |
| 10 | File Explorer Actions and Safety | Professional file actions with safeguards |
| 11 | Search and Navigation Index | Fast global search and precise navigation |
| 12 | Command Palette Intelligence | Context-aware command execution |
| 13 | Terminal and Task Runner Upgrade | Deterministic execution cockpit |
| 14 | Bottom Panel System | Problems, terminal, output, and task panes |
| 15 | AI Panel Scientific Guardrails | AI assistance with evidence and constraints |
| 16 | Apply Plan Preview and Patch Safety | Reversible AI patch workflow |
| 17 | Apply History, Conflict Handling, and Revert | Durable patch memory |
| 18 | Project Memory and `.synapse` Workspace Files | Local workbench memory substrate |
| 19 | Typed Synapse Bus Foundation | Future-safe cross-module synchronization |
| 20 | Legacy Editor Bridge Adapter | Preserve existing event contracts |
| 21 | IDE to Map Explorer Workflows | Code-to-map artifact handoff |
| 22 | Map Explorer to IDE Workflows | Spatial evidence to code handoff |
| 23 | IDE to Urban Analytics Workflows | Code-to-scenario handoff |
| 24 | Urban Analytics to IDE Workflows | Analysis evidence to code handoff |
| 25 | Evidence Artifact Model | Shared provenance and artifact contracts |
| 26 | Accessibility and Keyboard System | Professional keyboard-first UX |
| 27 | Performance, Persistence, and Resilience | Fast, recoverable IDE behavior |
| 28 | QA Harness and Regression Checks | Repeatable quality gates |
| 29 | Final Premium Polish and Handoff | Complete Synapse IDE readiness package |

---

## Prompt 00 - Memory Bootstrapping and Repository Baseline

### Agent Instruction

Implement no feature yet. Establish durable context and verify the repository reality before any product changes.

### Required Reading

- `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
- `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
- `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`
- `package.json`
- Project root file tree.

### Files To Inspect

- `src/components/ide/`
- `src/components/editor/`
- `src/components/terminal/`
- `src/components/file-explorer/`
- `src/components/ai/`
- `src/stores/`
- `src/services/editor/`
- `src/ui/theme/`

### Scope

- Verify which planned files exist.
- Identify actual framework, build scripts, testing scripts, and UI libraries.
- Record baseline architecture in the ledger.
- Create or update no product code except documentation if the ledger needs a baseline section.

### Implementation Tasks

1. Inspect repository scripts and dependencies.
2. Inspect current IDE entry points and stores.
3. Identify existing cross-module contracts with Map Explorer and Urban Analytics.
4. Identify missing or renamed files from the plan.
5. Check whether the repository is under git and whether there are uncommitted changes.
6. Update the ledger with a baseline architecture entry.

### Scientific and UX Rationale

A scientific workbench cannot be improved from memory. The baseline audit prevents speculative implementation and protects architectural continuity.

### Acceptance Criteria

- The ledger contains a baseline entry.
- Existing file paths are confirmed or corrected.
- The next prompt can proceed without guessing.

### Validation

Run the narrowest available checks:

- `npm run typecheck` if available.
- `npm run lint` if available.
- Otherwise record available scripts and why no validation ran.

### Stop Conditions

- Required plan documents are missing.
- The repository is too inconsistent with the plan to proceed safely.
- There are conflicting user edits in target files that need clarification.

---

## Prompt 01 - IDE Architecture Map and Ownership Boundaries

### Agent Instruction

Create a live architecture map for Synapse IDE based on current code, then align implementation boundaries with the tri-modal plan.

### Required Reading

Read the canonical source chain and the ledger. Confirm Prompt 00 is complete or perform its missing audit first.

### Files To Inspect

- `src/components/ide/EnhancedIDE.tsx`
- `src/components/ide/Header.tsx`
- `src/components/ide/CommandPalette.tsx`
- `src/components/ide/GlobalSearch.tsx`
- `src/components/editor/MonacoEditor.tsx`
- `src/services/editor/bridge.ts`
- `src/stores/editorStore.ts`
- `src/stores/appStore.ts`
- `src/stores/fileExplorerStore.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/features/urbanAnalytics/store.ts`

### Scope

- Document the real component hierarchy.
- Document store ownership.
- Document existing event bridge behavior.
- Add lightweight code comments only if necessary to clarify ownership.
- Avoid UI behavior changes unless required to expose safe boundaries.

### Implementation Tasks

1. Trace the IDE shell render tree.
2. Trace editor state from store to UI.
3. Trace file explorer state and file operations.
4. Trace terminal invocation and task execution.
5. Trace AI panel integration and apply pipeline entry points.
6. Trace current Map Explorer and Urban Analytics links.
7. Write an architecture ledger entry with actual paths and contracts.

### Cross-Module Alignment Checks

- Confirm IDE does not own map viewport state.
- Confirm IDE does not own analytics scenario state.
- Confirm existing bridge events are documented before new contracts are added.

### Acceptance Criteria

- The ledger has an "Architecture Map" entry.
- Contract registry is updated.
- Any mismatch with the plan is recorded as a risk.

### Validation

- Run typecheck or lint if code comments or small doc references are changed.
- If no code changes were made, record documentation validation only.

### Stop Conditions

- Existing imports create circular dependency risks that must be resolved before later prompts.
- Cross-module store signatures differ materially from the plan.

---

## Prompt 02 - Premium Token and Theme Groundwork

### Agent Instruction

Prepare the visual substrate for a premium, coherent Synapse IDE without redesigning the application.

### Required Reading

Read the alignment spec sections on Premium Visual and Interaction Language, Shared Wire and Layout System, and UI Cross-Module Requirements. Read Synapse plan Track T1 and Track T7.

### Files To Inspect

- `src/ui/theme/synapseTheme.ts`
- `src/ui/theme/ideProScope.css`
- `src/ui/theme/semanticTokens.ts`
- IDE component CSS or styling files.
- Global CSS files.
- Existing component library or icon usage.

### Scope

- Normalize IDE design tokens.
- Ensure colors, density, borders, focus states, and typography are compatible with Map Explorer and Urban Analytics.
- Avoid a full visual rewrite.

### Implementation Tasks

1. Audit current IDE color, spacing, border, and typography tokens.
2. Identify hard-coded visual values that break tri-modal coherence.
3. Introduce missing semantic tokens only when needed.
4. Add or refine IDE-scoped CSS variables for panels, rails, active states, focus rings, and evidence states.
5. Ensure premium density: compact controls, clear hierarchy, no decorative bloat.
6. Update ledger with token decisions and any visual contract changes.

### Premium UX Requirements

- No oversized marketing sections.
- No unrelated gradients or decorative visual systems.
- No nested cards inside cards.
- Toolbars must be compact and task-oriented.
- Status colors must communicate real state.

### Acceptance Criteria

- IDE visuals can be upgraded using shared tokens.
- No module-specific one-off theme is introduced.
- Focus and active states are visible.

### Validation

- Run typecheck if token files are TypeScript.
- Run lint if CSS or TS linting exists.
- Capture a screenshot only if a local UI server workflow is already documented or available.

### Stop Conditions

- Theme files are shared by modules and changes could regress Map Explorer or Urban Analytics without inspection.

---

## Prompt 03 - IDE Shell Stabilization and Layout Contract

### Agent Instruction

Stabilize the IDE shell so it can support premium navigation, synchronized evidence panels, and future cross-module workflows.

### Required Reading

Read Synapse plan Track T1 and the alignment spec layout sections. Confirm Prompt 02 theme groundwork is complete or identify why it is safe to proceed.

### Files To Inspect

- `src/components/ide/EnhancedIDE.tsx`
- `src/components/ide/Header.tsx`
- IDE layout styles.
- Any resizable panel or splitter utilities.
- Stores used for panel state.

### Scope

- Preserve the existing shell.
- Improve layout contracts for activity rail, sidebar, editor region, bottom panel, and status areas.
- Avoid introducing unrelated navigation.

### Implementation Tasks

1. Identify existing layout regions.
2. Define stable region names and CSS classes or component boundaries.
3. Ensure each region has responsive constraints and does not shift unexpectedly.
4. Add a durable panel state model if missing.
5. Prepare placeholders only for real panes that will be implemented in later prompts.
6. Ensure shell can host Problems, Terminal, Output, AI, and sync evidence surfaces.

### Cross-Module Alignment Checks

- Layout must leave room for Map Explorer and Urban Analytics handoff indicators.
- Shell must not import heavy map or analytics components directly.
- Handoff surfaces should be lightweight status/action affordances.

### Acceptance Criteria

- Shell regions are stable and named.
- Resizing or panel visibility does not destroy editor state.
- Ledger records the layout contract.

### Validation

- Typecheck.
- Lint.
- UI smoke check if available.

### Stop Conditions

- Existing shell uses brittle measurements that require larger layout refactor than this prompt allows.

---

## Prompt 04 - Header, Command Surface, and Status Semantics

### Agent Instruction

Refine the IDE header into a premium operational command surface.

### Required Reading

Read Synapse plan T1, T5, and T7. Read alignment spec sections on premium UI and shared journey contracts.

### Files To Inspect

- `src/components/ide/Header.tsx`
- `src/components/ide/CommandPalette.tsx`
- Status bar or header styles.
- Stores for project, file, terminal, AI, and sync status.

### Scope

- Improve command discoverability and status truthfulness.
- Do not add fake unavailable buttons.
- Do not add "coming soon" text.

### Implementation Tasks

1. Audit current header controls.
2. Group commands by operational purpose: project, run, search, AI, map handoff, analytics handoff, status.
3. Use existing icon system where available.
4. Make status badges truthful: idle, running, dirty, synced, conflict, offline, error.
5. Ensure commands have tooltips or accessible labels.
6. Add keyboard entry point for command palette if missing.
7. Update ledger with changed command semantics.

### Premium UX Requirements

- Header must be compact.
- Long text must not overflow controls.
- Icons must communicate known actions.
- Status must be readable at a glance.

### Acceptance Criteria

- Header feels like an operational IDE surface.
- Status labels correspond to real state.
- No cross-module action is exposed without a real handler or disabled truthful state.

### Validation

- Typecheck.
- Lint.
- Manual UI smoke if practical.

### Stop Conditions

- Existing command handlers are unclear and could trigger destructive actions.

---

## Prompt 05 - Editor Tab Model and Session Restoration

### Agent Instruction

Make editor tabs reliable, restorable, and suitable for evidence-driven geospatial coding workflows.

### Required Reading

Read Synapse plan T2 and T7. Read alignment spec sections on Persistence and Restore.

### Files To Inspect

- `src/stores/editorStore.ts`
- `src/components/editor/MonacoEditor.tsx`
- Editor tab components.
- Local storage or persistence utilities.
- `src/services/editor/bridge.ts`

### Scope

- Improve tab identity, dirty state, pinned state, active range, and restoration.
- Preserve existing editor behavior.
- Avoid changing file system semantics beyond what tabs require.

### Implementation Tasks

1. Audit current tab shape and active file logic.
2. Add or refine stable tab IDs based on file path plus artifact context when needed.
3. Track dirty, pinned, preview, language, and source artifact metadata if supported by the plan.
4. Restore open tabs and active tab on reload.
5. Preserve bridge commands: `editor:openTab`, `editor:insertAtCursor`, `editor:replaceActive`, `editor:openRange`.
6. Record persistence decisions in the ledger.

### Scientific Rationale

Analysis scripts and generated code must reopen with context so evidence trails remain reproducible across sessions.

### Acceptance Criteria

- Tabs restore deterministically.
- Dirty state is not lost silently.
- Bridge-opened files behave like normal tabs.

### Validation

- Unit tests for editor store if test framework exists.
- Typecheck.
- Manual reload check if UI can run.

### Stop Conditions

- Persistence could overwrite user edits or corrupt unsaved buffers.

---

## Prompt 06 - Monaco Surface Enhancement

### Agent Instruction

Enhance the Monaco editor surface with professional metadata, navigation, and code context while keeping it lightweight.

### Required Reading

Read Synapse plan T2. Read the architecture ledger entries for editor store and Monaco integration.

### Files To Inspect

- `src/components/editor/MonacoEditor.tsx`
- Editor wrapper components.
- Language registration utilities.
- Theme registration utilities.
- Editor store.

### Scope

- Improve editor metadata surfaces: breadcrumb, language mode, cursor, encoding if available, line endings if available.
- Do not build a full language server.
- Do not replace Monaco.

### Implementation Tasks

1. Audit Monaco options and theme registration.
2. Ensure options support professional coding: bracket pair colorization, minimap policy, semantic highlighting where available, font and line height coherence.
3. Add breadcrumb or path context surface if missing.
4. Add cursor and selection metadata.
5. Ensure large files have sensible performance defaults.
6. Update ledger with editor surface changes.

### Premium UX Requirements

- Metadata must help coding, not clutter.
- Editor must remain central and calm.
- Empty states must be truthful and actionable.

### Acceptance Criteria

- Editor exposes path and language context.
- Monaco theme aligns with shared tokens.
- No visible layout instability.

### Validation

- Typecheck.
- Lint.
- Manual edit/open smoke check if practical.

### Stop Conditions

- Monaco configuration is tightly coupled to another module or external package missing from the repo.

---

## Prompt 07 - Diagnostics and Problems Framework

### Agent Instruction

Introduce or refine a truthful Problems framework that can represent code diagnostics, task failures, lint output, and analysis-script errors.

### Required Reading

Read Synapse plan T2, T3, and T7. Read alignment spec sections on Scientific QA and Truthfulness.

### Files To Inspect

- Editor store.
- Terminal/task components.
- Output/log components.
- Any existing diagnostics or problems components.
- AI apply pipeline utilities.

### Scope

- Add a diagnostics model if missing.
- Add a Problems pane or prepare it within the bottom panel.
- Do not invent diagnostics that are not produced by real sources.

### Implementation Tasks

1. Define diagnostic shape: source, severity, file, range, message, code, timestamp, related artifact.
2. Connect existing real error sources if available.
3. Render diagnostics in a compact Problems list.
4. Support click-to-open file range through the editor bridge.
5. Track empty, loading, error, and stale states.
6. Update ledger with diagnostic contracts.

### Scientific Rationale

Urban analytics code often fails through data assumptions, spatial joins, projection mismatches, or invalid model parameters. Problems must preserve source and context so the failure can be reproduced.

### Acceptance Criteria

- Problems pane only shows real diagnostics.
- Clicking a problem opens the relevant code range when available.
- Severity and source are visible.

### Validation

- Store tests if feasible.
- Typecheck.
- Manual diagnostic fixture check if available.

### Stop Conditions

- There is no safe bottom panel area yet and Prompt 14 is required first. Record dependency and stop.

---

## Prompt 08 - Symbol Outline and Code Intelligence Foundation

### Agent Instruction

Build a modest symbol outline and navigation foundation without pretending to have full language intelligence where it does not exist.

### Required Reading

Read Synapse plan T2 and T5. Read the Monaco integration code.

### Files To Inspect

- `src/components/editor/MonacoEditor.tsx`
- Editor services.
- Command palette.
- Global search.
- Any symbol extraction utilities.

### Scope

- Add symbol outline using Monaco APIs if available.
- Provide fallback behavior for unsupported languages.
- Avoid heavy language server integration unless already present.

### Implementation Tasks

1. Inspect Monaco symbol APIs available in the current package.
2. Create a symbol list surface or command palette source.
3. Support click-to-navigate within active file.
4. Label unsupported states truthfully.
5. Ensure symbol extraction is throttled or cached.
6. Update ledger.

### Premium UX Requirements

- Outline should be compact and scannable.
- It should not block editing.
- It should not show fake symbols.

### Acceptance Criteria

- Supported files show navigable symbols.
- Unsupported files show a truthful empty state.
- Performance remains acceptable for large files.

### Validation

- Typecheck.
- Manual file navigation check.

### Stop Conditions

- Monaco APIs are unavailable or version-incompatible.

---

## Prompt 09 - File Explorer Spatial Project Semantics

### Agent Instruction

Upgrade the file explorer so geospatial and urban analytics projects are recognizable without breaking normal file navigation.

### Required Reading

Read Synapse plan T4 and T7. Read alignment spec shared artifact sections.

### Files To Inspect

- `src/components/file-explorer/`
- `src/stores/fileExplorerStore.ts`
- File type icon utilities.
- Context menu utilities.
- Project file model.

### Scope

- Add GIS-aware and analytics-aware file semantics.
- Preserve existing file operations.
- Avoid hard-coded domain assumptions that mislabel files.

### Implementation Tasks

1. Audit current file tree model.
2. Add or refine file type detection for common geospatial and analysis files:
   - `.geojson`
   - `.json`
   - `.csv`
   - `.parquet`
   - `.gpkg`
   - `.shp` sidecar groups if supported
   - `.py`
   - `.ipynb`
   - `.sql`
   - `.r`
   - `.yaml`
   - `.toml`
3. Add status badges for generated, synced, dirty, analysis output, map layer candidate, and scenario artifact where real metadata exists.
4. Keep unsupported file types neutral.
5. Update ledger with file semantics.

### Scientific Rationale

Urban analytics workflows rely on knowing whether a file is a raw source, derived output, script, scenario definition, or spatial layer. The explorer should expose that evidence role without forcing a database schema.

### Acceptance Criteria

- File explorer remains usable as a normal tree.
- Geospatial and analytics files receive helpful visual semantics.
- No file is mislabeled as evidence without metadata or extension confidence.

### Validation

- Typecheck.
- Component tests if available.
- Manual tree smoke check.

### Stop Conditions

- File explorer uses remote or virtual filesystem semantics that require adapter design first.

---

## Prompt 10 - File Explorer Actions and Safety

### Agent Instruction

Make file explorer actions professional, reversible where practical, and safe for generated analysis artifacts.

### Required Reading

Read Synapse plan T4. Read the amnesia protocol file ownership discipline.

### Files To Inspect

- File explorer components.
- File operations service.
- Store actions for create, rename, delete, move, duplicate, reveal, open.
- Notification/toast system if present.

### Scope

- Improve action affordances and safety.
- Do not replace the file system layer.
- Do not implement destructive actions without confirmation or undo when feasible.

### Implementation Tasks

1. Audit available file actions.
2. Normalize action labels and icons.
3. Add confirmations for destructive operations.
4. Add generated artifact warnings when metadata supports it.
5. Ensure rename and move preserve open editor tabs.
6. Ensure file open uses the editor bridge consistently.
7. Update ledger.

### Cross-Module Alignment Checks

- Map layer files opened from explorer should be eligible for Map Explorer handoff.
- Analytics scenario files should be eligible for Urban Analytics handoff.
- Eligibility must be explicit, not automatic mutation.

### Acceptance Criteria

- File actions are predictable.
- Destructive actions are guarded.
- Open tabs remain coherent after rename or move.

### Validation

- Unit tests for store actions if available.
- Typecheck.
- Manual action smoke check with non-critical fixture files.

### Stop Conditions

- The current file system API cannot safely distinguish virtual files from persistent files.

---

## Prompt 11 - Search and Navigation Index

### Agent Instruction

Implement or refine global search so it supports large project navigation and geospatial analytics artifact discovery.

### Required Reading

Read Synapse plan T5. Read Prompt 09 file semantics if complete.

### Files To Inspect

- `src/components/ide/GlobalSearch.tsx`
- Search store or service.
- File explorer store.
- Worker utilities if present.
- Editor bridge.

### Scope

- Improve global search quality and performance.
- Do not index huge binary files.
- Do not block the UI thread on large projects.

### Implementation Tasks

1. Audit current search behavior.
2. Define searchable scopes: filenames, paths, open files, text files, symbols if available, artifact metadata if available.
3. Add exclusion rules for binaries, generated caches, dependency folders, and large files.
4. Add result grouping by file, symbol, artifact, and command if supported.
5. Add click-to-open range behavior.
6. Update ledger.

### Scientific Rationale

Analytical reproducibility depends on finding scripts, assumptions, datasets, and generated outputs quickly. Search must distinguish source evidence from derived artifacts where metadata exists.

### Acceptance Criteria

- Search returns relevant grouped results.
- Large files do not freeze the UI.
- Results open the correct file or range.

### Validation

- Typecheck.
- Search utility tests if available.
- Manual query smoke check.

### Stop Conditions

- No safe file content access API exists.

---

## Prompt 12 - Command Palette Intelligence

### Agent Instruction

Upgrade the command palette into a context-aware professional command router for IDE, map, and analytics workflows.

### Required Reading

Read Synapse plan T5 and T7. Read tri-modal cross-module journey contracts.

### Files To Inspect

- `src/components/ide/CommandPalette.tsx`
- Command registry if present.
- Header command handlers.
- Editor bridge.
- Map Explorer store.
- Urban Analytics store.

### Scope

- Add command categorization and scoring.
- Ensure cross-module commands are visible only when valid or truthfully disabled.
- Preserve existing keyboard shortcuts.

### Implementation Tasks

1. Audit existing commands.
2. Create a command shape: id, title, category, keywords, shortcut, enabled, reason, run.
3. Add scoring for active file, selected text, project state, map eligibility, analytics eligibility.
4. Add command categories: File, Edit, Run, Search, AI, Map, Analytics, Evidence.
5. Add disabled reasons for unavailable commands.
6. Update ledger with command contracts.

### Premium UX Requirements

- Fast keyboard access.
- Clear command categories.
- No fake commands.
- Disabled commands explain why.

### Acceptance Criteria

- Command palette supports contextual IDE actions.
- Cross-module commands are explicit and guarded.
- Existing commands still work.

### Validation

- Typecheck.
- Command registry tests if available.
- Manual keyboard smoke check.

### Stop Conditions

- Existing command execution is ad hoc and needs a registry foundation beyond this prompt. Record and implement minimal adapter only.

---

## Prompt 13 - Terminal and Task Runner Upgrade

### Agent Instruction

Turn the terminal and task area into a deterministic execution cockpit for coding and scientific workflows.

### Required Reading

Read Synapse plan T3. Read diagnostics plan from Prompt 07.

### Files To Inspect

- `src/components/terminal/components/Terminal.tsx`
- Terminal store or service.
- Task runner utilities.
- Output/log panel components.
- Package scripts and project task definitions.

### Scope

- Improve terminal/task state management.
- Avoid unsafe command execution changes.
- Keep user control visible.

### Implementation Tasks

1. Audit existing terminal implementation.
2. Define task states: idle, queued, running, succeeded, failed, cancelled.
3. Add task metadata: command, working directory, start time, duration, exit code, source.
4. Connect task failures to diagnostics where safe.
5. Add common task shortcuts based on package scripts.
6. Preserve terminal output integrity.
7. Update ledger.

### Scientific Rationale

Urban analytics often depends on reproducible execution of scripts, transformations, and model runs. The IDE must record task context and failure state, not just stream text.

### Acceptance Criteria

- Tasks have clear states.
- Failures are visible and traceable.
- Terminal remains interactive if currently supported.

### Validation

- Typecheck.
- Manual task run using a harmless script if available.

### Stop Conditions

- Terminal execution model is backend-dependent and not available in local frontend code.

---

## Prompt 14 - Bottom Panel System

### Agent Instruction

Create or refine a bottom panel system that can host Problems, Terminal, Output, Search, Apply Plan, and Evidence views with consistent behavior.

### Required Reading

Read Synapse plan T1, T2, T3, T6, and T7. Read tri-modal shared wire system.

### Files To Inspect

- IDE shell layout.
- Terminal components.
- Problems components if created.
- Output components.
- AI apply components.
- Stores for panel state.

### Scope

- Stabilize bottom panel tabs and resizing.
- Do not implement every panel deeply in this prompt.
- Ensure later prompts have a coherent host.

### Implementation Tasks

1. Identify current bottom panel behavior.
2. Add a panel registry or stable tab model.
3. Support panel open, close, focus, resize, and restore.
4. Provide truthful empty states for unconnected panels.
5. Wire existing terminal and problems panes into the host.
6. Update ledger with bottom panel contract.

### Premium UX Requirements

- Tabs must not resize unpredictably.
- Empty states must be compact.
- Panel focus must be keyboard reachable.
- The editor must remain the primary surface.

### Acceptance Criteria

- Bottom panel can host multiple views consistently.
- Panel state restores.
- Existing terminal and diagnostics behavior is preserved.

### Validation

- Typecheck.
- Manual panel open/close/resize smoke check.

### Stop Conditions

- Shell layout cannot support bottom panel without broad refactor.

---

## Prompt 15 - AI Panel Scientific Guardrails

### Agent Instruction

Refine the AI panel so coding assistance is constrained by context, provenance, and scientific honesty.

### Required Reading

Read Synapse plan T6. Read alignment spec Scientific QA and Truthfulness. Read the current AI panel and apply utilities.

### Files To Inspect

- `src/components/ai/panel/SynapseCoreAIPanel.tsx`
- `src/utils/ai/apply/`
- AI provider or request utilities.
- Editor store.
- File explorer store.
- Diagnostics store if present.

### Scope

- Improve prompt context controls and evidence visibility.
- Do not integrate a new AI provider unless already planned and configured.
- Do not send hidden large project context without user visibility.

### Implementation Tasks

1. Audit current AI panel states and request flow.
2. Add context summary display: active file, selection, diagnostics, project scope, selected artifacts.
3. Add clear controls for including files, diagnostics, and evidence artifacts.
4. Add disclaimers only as compact operational labels, not marketing text.
5. Ensure generated code routes through apply plan preview, not silent mutation.
6. Update ledger with AI context contracts.

### Scientific Rationale

AI coding assistance in an urban analytics workbench must know whether it is editing source code, generated analysis, scenario assumptions, or spatial evidence. Hidden context creates irreproducible outputs.

### Acceptance Criteria

- AI panel shows what context it will use.
- AI edits do not bypass apply safety.
- Empty/error/running states are truthful.

### Validation

- Typecheck.
- Mocked AI flow test if available.
- Manual panel state smoke check.

### Stop Conditions

- Existing AI provider code is incomplete or credentials are unavailable. Improve local UI state only and record limitation.

---

## Prompt 16 - Apply Plan Preview and Patch Safety

### Agent Instruction

Implement a premium apply plan preview for AI-generated edits with per-file review and safe application.

### Required Reading

Read Synapse plan T6. Read AI panel guardrails from Prompt 15. Read existing apply utilities.

### Files To Inspect

- `src/utils/ai/apply/`
- AI panel.
- Editor store.
- File store.
- Diff viewer components if present.
- Notification system.

### Scope

- Create or refine apply plan model.
- Add preview before mutation.
- Support per-file accept/reject where practical.
- Avoid silent overwrite.

### Implementation Tasks

1. Audit existing patch parsing and apply behavior.
2. Define apply plan shape: id, files, hunks, source prompt, confidence, createdAt, status, conflicts.
3. Render a diff preview for each affected file.
4. Allow accept/reject per file and apply all safe changes.
5. Detect dirty file conflicts before applying.
6. Preserve original content for revert where feasible.
7. Update ledger with apply plan contract.

### Premium UX Requirements

- The user must see what will change.
- Rejected files must stay unchanged.
- Conflict messages must name the file and reason.
- Apply progress must be real.

### Acceptance Criteria

- AI patches are previewed before applying.
- Dirty conflicts are not overwritten silently.
- Applied changes update editor state.

### Validation

- Unit tests for patch parsing and application if available.
- Typecheck.
- Manual apply fixture check.

### Stop Conditions

- Existing apply pipeline cannot guarantee safe patch application. Record blocker and implement preview-only mode.

---

## Prompt 17 - Apply History, Conflict Handling, and Revert

### Agent Instruction

Make AI apply workflows durable by adding history, conflict records, and revert capability.

### Required Reading

Read Synapse plan T6 and T7. Read Prompt 16 ledger entry.

### Files To Inspect

- Apply utilities.
- Editor store.
- Persistence utilities.
- Bottom panel.
- AI panel.

### Scope

- Persist apply plan history.
- Add revert where original content is known.
- Do not promise revert for changes that cannot be safely reversed.

### Implementation Tasks

1. Add apply history storage with bounded size.
2. Record plan status: proposed, partially applied, applied, failed, reverted.
3. Record conflicts and user decisions.
4. Add revert action for safely reversible plans.
5. Render history in AI panel or bottom panel.
6. Update ledger.

### Scientific Rationale

AI-assisted code changes must remain auditable. Future analysis outcomes may depend on code generated in a previous session, so the workbench needs provenance and reversibility.

### Acceptance Criteria

- Applied plans appear in history.
- Revert availability is truthful.
- Conflicts are recorded, not hidden.

### Validation

- Store tests if available.
- Typecheck.
- Manual apply/revert fixture check.

### Stop Conditions

- File content snapshots cannot be safely stored or restored.

---

## Prompt 18 - Project Memory and `.synapse` Workspace Files

### Agent Instruction

Introduce a lightweight project memory substrate for IDE state, artifacts, and cross-module evidence references.

### Required Reading

Read Synapse plan T4, T6, and T7. Read alignment spec Shared Artifact Model and Persistence sections.

### Files To Inspect

- File system utilities.
- Project root detection.
- Persistence utilities.
- Artifact or metadata utilities.
- Existing `.synapse` references if any.

### Scope

- Define `.synapse/` workspace structure if appropriate.
- Do not migrate user data.
- Do not write large artifacts unless explicitly required.

### Implementation Tasks

1. Audit existing project metadata storage.
2. Define minimal `.synapse/` files:
   - `workspace.json`
   - `artifacts.json`
   - `apply-history.json`
   - `sync-state.json`
3. Add schema types or interfaces.
4. Add safe read/write helpers if file system access exists.
5. Support in-memory fallback if project file write is unavailable.
6. Update ledger with persistence contract.

### Scientific Rationale

The tri-modal workbench needs durable memory for evidence artifacts and implementation history. A small workspace metadata layer enables reproducibility without forcing a database migration.

### Acceptance Criteria

- Workspace memory structure is documented and typed.
- Reads and writes are safe and bounded.
- No large raw dataset is duplicated into `.synapse`.

### Validation

- Typecheck.
- Persistence utility tests if available.

### Stop Conditions

- The app is browser-only with no safe project file write API. Implement schema and in-memory adapter only.

---

## Prompt 19 - Typed Synapse Bus Foundation

### Agent Instruction

Create the foundation for a typed synchronization bus that can coordinate Synapse IDE, Map Explorer, and Urban Analytics without tight coupling.

### Required Reading

Read alignment spec Synchronization Architecture, Cross-Module Journey Contracts, and Shared Artifact Model. Read Synapse plan T7.

### Files To Inspect

- Current event bridge.
- Stores for IDE, Map Explorer, and Urban Analytics.
- Any event bus or pub/sub utility.
- Type definitions.

### Scope

- Add a typed bus foundation if not already present.
- Preserve existing event contracts.
- Avoid migrating every caller in one step.

### Implementation Tasks

1. Audit current cross-module events.
2. Define bus event categories:
   - `ide.file.open`
   - `ide.range.open`
   - `ide.code.insert`
   - `map.layer.focus`
   - `map.selection.export`
   - `analytics.scenario.open`
   - `analytics.artifact.publish`
   - `evidence.artifact.register`
3. Define payload principles: IDs and references over bulky data.
4. Implement a small typed publish/subscribe utility or adapt existing one.
5. Add unit tests if feasible.
6. Update ledger contract registry.

### Premium Architecture Requirements

- No hidden globals.
- No large event payloads.
- No direct module internals across boundaries.
- Every event must have an owner and consumer.

### Acceptance Criteria

- Typed bus exists or current bridge is documented as temporary.
- Existing behavior is preserved.
- Bus contracts are recorded in the ledger.

### Validation

- Typecheck.
- Unit tests for bus if created.

### Stop Conditions

- Existing architecture already has a mature bus. Extend it instead of creating a second bus.

---

## Prompt 20 - Legacy Editor Bridge Adapter

### Agent Instruction

Bridge existing editor events into the typed synchronization architecture without breaking current integrations.

### Required Reading

Read Prompt 19 ledger entry. Read `src/services/editor/bridge.ts`. Read Synapse plan T7.

### Files To Inspect

- `src/services/editor/bridge.ts`
- Editor store.
- Command palette.
- Map Explorer integration points.
- Urban Analytics integration points.

### Scope

- Preserve existing events:
  - `editor:openTab`
  - `editor:insertAtCursor`
  - `editor:replaceActive`
  - `editor:openRange`
- Add adapter behavior to typed bus if available.
- Do not delete legacy event support.

### Implementation Tasks

1. Document current event payloads.
2. Add type guards or payload validation where feasible.
3. Forward legacy events into the new bus or wrap bus events with legacy compatibility.
4. Ensure invalid payloads fail safely.
5. Add tests for event adapter behavior if possible.
6. Update ledger contract registry.

### Cross-Module Alignment Checks

- Map Explorer and Urban Analytics callers must continue to work.
- New callers should prefer typed contracts.
- Legacy bridge must be marked as compatibility layer.

### Acceptance Criteria

- Existing editor bridge behavior still works.
- Typed pathway is available for future prompts.
- Invalid payloads do not crash the IDE.

### Validation

- Typecheck.
- Unit tests for bridge.
- Manual bridge event smoke if practical.

### Stop Conditions

- Legacy event payloads are inconsistent across callers and require a migration plan.

---

## Prompt 21 - IDE to Map Explorer Workflows

### Agent Instruction

Implement IDE-to-Map Explorer handoff workflows so code and files can intentionally open or focus map artifacts.

### Required Reading

Read alignment spec Cross-Module Journey Contracts. Read Synapse plan T7. Read Map Explorer development plan only for contract awareness, not for implementing Map Explorer internals.

### Files To Inspect

- Command palette.
- File explorer.
- Editor bridge or bus.
- Map Explorer store.
- Artifact model if present.

### Scope

- Add commands from IDE to Map Explorer.
- Do not implement Map Explorer rendering.
- Do not directly mutate map internals.

### Implementation Tasks

1. Define eligibility rules for map handoff:
   - spatial file open in editor
   - layer artifact metadata
   - selected GeoJSON or feature reference
   - generated spatial output
2. Add commands:
   - Open in Map Explorer
   - Focus Related Layer
   - Send Selection to Map
   - Register as Spatial Artifact
3. Use typed bus or existing store adapter.
4. Add disabled reasons when no spatial artifact exists.
5. Record contract changes in ledger.

### Scientific Rationale

Spatial evidence must move from code to map through explicit artifact references so the map view remains reproducible and inspectable.

### Acceptance Criteria

- IDE exposes map handoff commands only when meaningful.
- Map handoff uses documented contracts.
- No bulky geometry is pushed through generic UI events.

### Validation

- Typecheck.
- Manual command smoke with a spatial fixture if available.

### Stop Conditions

- Map Explorer store contract is missing or unstable.

---

## Prompt 22 - Map Explorer to IDE Workflows

### Agent Instruction

Support incoming Map Explorer workflows that open code, create snippets, or register spatial evidence in the IDE.

### Required Reading

Read alignment spec Shared Artifact Model. Read Synapse plan T7. Read Map Explorer plan for handoff terms only.

### Files To Inspect

- Editor bridge.
- Typed bus.
- Editor store.
- AI panel context controls.
- File explorer artifact semantics.

### Scope

- Implement IDE-side receiving behavior.
- Do not implement Map Explorer UI.
- Preserve legacy bridge behavior.

### Implementation Tasks

1. Define incoming event shapes for spatial selection references.
2. Support open generated snippet or analysis script target.
3. Support inserting a spatial query scaffold at cursor when explicitly requested.
4. Register received map artifacts in project memory if available.
5. Surface provenance in editor or AI context.
6. Update ledger.

### Scientific Rationale

Map selections often become analysis code. The IDE must preserve the origin of that selection, including layer, filter, viewport, and timestamp references where available.

### Acceptance Criteria

- Incoming map events can open or insert code safely.
- Provenance is visible or stored.
- No direct dependency on map rendering internals.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual event simulation.

### Stop Conditions

- Incoming Map Explorer artifacts lack stable IDs or metadata.

---

## Prompt 23 - IDE to Urban Analytics Workflows

### Agent Instruction

Implement IDE-to-Urban Analytics handoffs for scripts, scenario files, indicators, and generated analysis outputs.

### Required Reading

Read alignment spec Cross-Module Journey Contracts and Scientific QA. Read Synapse plan T7. Read Urban Analytics plan for contract awareness only.

### Files To Inspect

- Command palette.
- File explorer.
- Editor store.
- Urban Analytics store.
- Artifact model.

### Scope

- Add IDE commands that open or update Urban Analytics context through documented contracts.
- Do not implement Urban Analytics modal internals.

### Implementation Tasks

1. Define analytics eligibility rules:
   - scenario configuration file
   - indicator definition
   - analysis script
   - result artifact reference
   - selected code block with explicit user action
2. Add commands:
   - Open Scenario in Urban Analytics
   - Attach Script to Scenario
   - Register Indicator Definition
   - Send Result Artifact to Urban Analytics
3. Use existing `useUrbanStore.getState().open()` only if signature is verified.
4. Prefer typed bus adapter if available.
5. Update ledger.

### Scientific Rationale

Scenario analysis must preserve assumptions, code source, parameters, and outputs. IDE handoff must make these relationships explicit.

### Acceptance Criteria

- Urban Analytics handoff commands are explicit and guarded.
- Scenario or artifact provenance is recorded.
- Existing Urban Analytics open behavior is preserved.

### Validation

- Typecheck.
- Manual command smoke if UI can run.

### Stop Conditions

- Urban Analytics store API cannot safely accept scenario or artifact references.

---

## Prompt 24 - Urban Analytics to IDE Workflows

### Agent Instruction

Support incoming Urban Analytics workflows that open scripts, generate reproducible code, and inspect analysis provenance inside Synapse IDE.

### Required Reading

Read alignment spec Scientific QA, Shared Artifact Model, and Persistence. Read Synapse plan T7.

### Files To Inspect

- Editor bridge.
- Typed bus.
- Urban Analytics store.
- AI panel.
- Apply plan utilities.
- Project memory.

### Scope

- Implement IDE-side receiving behavior for analytics artifacts.
- Do not implement Urban Analytics model calculations.
- Do not silently generate or apply code.

### Implementation Tasks

1. Define incoming analytics event shapes:
   - open source script
   - open generated report
   - insert reproducibility scaffold
   - inspect indicator definition
   - register scenario artifact
2. Route generated code through apply preview.
3. Store scenario provenance references.
4. Surface uncertainty or assumption metadata where available.
5. Update ledger.

### Scientific Rationale

Urban Analytics outputs are not just files. They are evidence objects with assumptions, uncertainty, and provenance. IDE receiving behavior must preserve that context.

### Acceptance Criteria

- Incoming analytics artifacts open or preview safely.
- Generated code is never silently applied.
- Provenance and uncertainty metadata are not discarded.

### Validation

- Typecheck.
- Adapter tests if feasible.
- Manual event simulation.

### Stop Conditions

- Analytics artifacts lack stable identity or provenance metadata.

---

## Prompt 25 - Evidence Artifact Model

### Agent Instruction

Define a shared evidence artifact model for IDE-side registration and consumption across code, map, and analytics workflows.

### Required Reading

Read alignment spec Shared Artifact Model. Read Synapse plan T6 and T7. Review Map and Urban plans for shared language only.

### Files To Inspect

- Type definitions.
- Project memory.
- Editor store.
- File explorer store.
- AI context utilities.
- Bus or bridge contracts.

### Scope

- Add IDE-side artifact interfaces and registry.
- Avoid taking ownership of Map Explorer or Urban Analytics internal data.
- Store references, metadata, and provenance, not large raw data.

### Implementation Tasks

1. Define artifact types:
   - code
   - spatial-layer
   - spatial-selection
   - scenario
   - indicator
   - analysis-result
   - report
   - generated-patch
2. Define required fields:
   - id
   - type
   - title
   - sourceModule
   - uri or reference
   - provenance
   - createdAt
   - status
3. Define optional fields:
   - confidence
   - uncertainty
   - CRS or spatial reference
   - scenario ID
   - file range
   - validation state
4. Connect registry to AI context and command palette eligibility.
5. Update ledger.

### Scientific Rationale

Shared artifacts are the evidence spine of the tri-modal workbench. They allow code, maps, and analytics narratives to refer to the same object without duplicating data or losing provenance.

### Acceptance Criteria

- Artifact model is typed.
- Registry stores references safely.
- IDE can consume artifacts without owning other modules.

### Validation

- Typecheck.
- Unit tests for registry if feasible.

### Stop Conditions

- Existing artifact model already exists and should be extended instead of replaced.

---

## Prompt 26 - Accessibility and Keyboard System

### Agent Instruction

Harden accessibility and keyboard behavior across Synapse IDE without changing the product structure.

### Required Reading

Read alignment spec Accessibility and Keyboard Alignment. Read Synapse plan T1, T2, T5, and T7.

### Files To Inspect

- IDE shell.
- Header.
- Command palette.
- File explorer.
- Bottom panel.
- AI panel.
- Editor wrapper.
- Keyboard shortcut utilities.

### Scope

- Improve focus order, keyboard shortcuts, ARIA labels, and visible focus states.
- Do not create conflicting shortcut systems.

### Implementation Tasks

1. Audit keyboard navigation from shell to editor, explorer, panel, palette, and AI panel.
2. Add missing accessible labels to icon buttons.
3. Ensure command palette is reachable and dismissible.
4. Ensure bottom panel tabs are keyboard accessible.
5. Ensure file tree supports expected keyboard behavior where feasible.
6. Ensure focus rings are visible and token-aligned.
7. Update ledger.

### Premium UX Requirements

- Keyboard operation should feel intentional.
- Focus must never disappear.
- Shortcuts must be discoverable through command labels or tooltips.

### Acceptance Criteria

- Core IDE workflows are keyboard reachable.
- Icon-only controls have accessible names.
- Focus states are visually coherent.

### Validation

- Typecheck.
- Lint.
- Accessibility checks if available.
- Manual keyboard smoke check.

### Stop Conditions

- Component primitives lack accessibility support and require broader replacement.

---

## Prompt 27 - Performance, Persistence, and Resilience

### Agent Instruction

Harden performance and resilience for the IDE as a long-running professional workbench.

### Required Reading

Read alignment spec Performance and Data Movement, Persistence and Restore. Read Synapse plan T1 through T7.

### Files To Inspect

- Large component render paths.
- Stores and selectors.
- Search/index utilities.
- File explorer tree rendering.
- Editor integrations.
- Persistence utilities.
- Bus or bridge.

### Scope

- Improve performance hot spots identified by inspection.
- Add persistence guards.
- Avoid speculative micro-optimization.

### Implementation Tasks

1. Identify avoidable rerenders in shell, file tree, editor, AI panel, and bottom panel.
2. Add selectors or memoization where codebase patterns support it.
3. Ensure search and symbol extraction do not block the UI.
4. Bound stored history sizes.
5. Add stale-state recovery for restored tabs, missing files, and invalid artifacts.
6. Update ledger.

### Scientific Rationale

Urban analytics sessions can involve large datasets, long scripts, and extended analysis periods. The IDE must stay responsive and recoverable.

### Acceptance Criteria

- No obvious unbounded state growth remains in new features.
- Restored missing files fail gracefully.
- Long-running panels avoid unnecessary rerenders.

### Validation

- Typecheck.
- Build if available.
- Manual large-tree or search smoke if fixtures exist.

### Stop Conditions

- Performance issue requires architectural change outside Synapse IDE ownership.

---

## Prompt 28 - QA Harness and Regression Checks

### Agent Instruction

Create repeatable QA checks for the upgraded Synapse IDE workflows.

### Required Reading

Read the full ledger. Read Synapse plan acceptance criteria. Read alignment spec Cross-Plan Acceptance Criteria.

### Files To Inspect

- Test setup.
- Existing unit tests.
- Existing component tests.
- Playwright or E2E setup.
- Package scripts.
- Key IDE components and stores.

### Scope

- Add focused tests where the implementation introduced meaningful logic.
- Do not add brittle snapshot tests for visual polish.

### Implementation Tasks

1. Identify untested high-risk logic:
   - editor bridge
   - bus adapter
   - apply plan
   - artifact registry
   - file explorer actions
   - command registry
   - diagnostics store
2. Add unit or integration tests using existing test patterns.
3. Add a manual QA checklist for UI workflows if E2E is unavailable.
4. Ensure validation commands are documented in the ledger.
5. Update ledger with QA coverage.

### Acceptance Criteria

- Critical state logic has focused tests.
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

Perform final Synapse IDE polish and prepare a durable handoff for future Map Explorer and Urban Analytics implementation prompts.

### Required Reading

Read all canonical documents. Read the full ledger. Read all completed prompt entries.

### Files To Inspect

- All files changed by prior prompts.
- IDE shell.
- Editor.
- File explorer.
- Terminal.
- Command palette.
- AI panel.
- Bus and bridge contracts.
- Artifact model.
- Theme files.
- Tests and docs.

### Scope

- Finish minor polish.
- Remove dead placeholders.
- Confirm cross-module readiness.
- Do not start Map Explorer or Urban Analytics implementation.

### Implementation Tasks

1. Audit all Synapse IDE surfaces for visual coherence.
2. Confirm no fake "coming soon" states remain.
3. Confirm all cross-module actions are guarded by real contracts.
4. Confirm ledger contract registry is complete.
5. Confirm token usage aligns with tri-modal premium design.
6. Confirm validation commands pass or failures are recorded.
7. Create final handoff notes for Map Explorer and Urban Analytics prompt creation.
8. Update ledger with final Synapse IDE readiness status.

### Premium UX Acceptance

- Synapse IDE feels like a premium scientific coding cockpit.
- It remains dense, calm, and professional.
- It coordinates with Map Explorer and Urban Analytics without becoming them.
- It exposes evidence and provenance where code intersects analysis.

### Final Validation

Run the strongest reasonable validation set:

- Typecheck.
- Lint.
- Unit tests.
- Build.
- UI smoke or Playwright if available.

If any command fails, record whether the failure is related to Synapse IDE changes.

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

When creating Map Explorer and Urban Analytics sequential prompt files, reuse this structure:

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

The three prompt files must share the same protocol and ledger discipline. They may differ in implementation scope, but they must not diverge in product language, synchronization architecture, or premium UI philosophy.

## Closing Instruction

An agent implementing Synapse IDE must never end a prompt by saying only what it changed in chat. It must update `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md` so the next agent can continue without memory loss.
