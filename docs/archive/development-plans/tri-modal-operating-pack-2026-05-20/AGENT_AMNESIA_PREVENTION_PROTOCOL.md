# Agent Amnesia Prevention Protocol

## Purpose

This protocol exists to make the SynapseIDE urban analytics workbench resilient across agents, models, sessions, context compaction, and partial implementations. It is a strict operating agreement for any agent that implements the Synapse IDE, Map Explorer, or Urban Analytics plans.

The goal is simple: no agent may rely on memory, implied context, or undocumented assumptions. Every implementation step must recover its context from durable files, inspect the live repository, update a ledger, and leave enough evidence for the next agent to continue without loss.

## Authority

This protocol is binding for all sequential implementation prompt files stored in `DEVELOPMENT_PLANS`.

The authority order is:

1. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
2. The relevant module plan:
   - `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`
   - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
   - `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`
3. The relevant sequential prompt file.
4. The relevant implementation ledger.
5. The live repository files.
6. The current user request.

For Synapse IDE, the agent operating pack also includes:

- `DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md`
- `DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json`
- `DEVELOPMENT_PLANS/SYNAPSE_IDE_AGENT_HANDOFF_TEMPLATE.md`
- `scripts/get-next-synapse-ide-prompt.ps1`

For Map Explorer, the agent operating pack also includes:

- `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
- `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
- `scripts/get-next-map-explorer-prompt.ps1`

For Urban Analytics, the agent operating pack also includes:

- `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
- `DEVELOPMENT_PLANS/URBAN_ANALYTICS_AGENT_HANDOFF_TEMPLATE.md`
- `scripts/get-next-urban-analytics-prompt.ps1`

If documents conflict, the agent must stop and report the conflict unless the conflict can be resolved by preserving the tri-modal alignment spec and the existing product architecture.

## Core Rule

Do not trust memory. Trust only:

- Files read in the current session.
- Current repository state inspected in the current session.
- Explicit ledger entries.
- Current user instructions.

An agent must never assume that a previous prompt was completed just because it appears earlier in a prompt sequence. Completion is valid only when the ledger and the repository both support it.

## Mandatory Start Sequence

Every implementation agent must begin with this sequence before editing code:

1. Read the relevant `START_HERE` launcher when it exists.
2. Read `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`.
3. Read the relevant module plan.
4. Read the relevant sequential implementation prompt file.
5. Read the relevant implementation ledger.
6. Read the relevant prompt manifest when it exists.
7. Inspect the files named by the prompt.
8. Inspect related imports, stores, events, and tests.
9. Check repository status if version control metadata is available.
10. Write a short private working interpretation of the task before editing.

If any required document is missing, the agent must create a blocker note in the ledger or report the missing file before proceeding.

## Mandatory Completion Sequence

Every implementation agent must finish with this sequence:

1. Update the relevant implementation ledger.
2. Record files changed.
3. Record validation commands and results.
4. Record decisions made.
5. Record unresolved risks.
6. Record the recommended next prompt.
7. Provide a concise final report to the user.

The final report is not a substitute for the ledger. The ledger is the durable handoff.

## Ledger Rules

Each module must have its own ledger. For Synapse IDE, the ledger is:

`DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`

For Map Explorer, the ledger is:

`DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`

For Urban Analytics, the ledger is:

`DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`

The ledger must be updated on every implementation step, even if the task only changes documentation or discovers a blocker.

Each ledger update must include:

- Prompt ID.
- Date and local time if available.
- Agent or model name if known.
- Files inspected.
- Files changed.
- Behavioral result.
- Validation result.
- New or changed contracts.
- Open risks.
- Next recommended prompt.

Do not delete older ledger entries. Append new entries.

## Prompt Design Rules

Every sequential prompt must be self-contained enough to survive context loss. Each prompt must include:

- Purpose.
- Required reading list.
- Repository files to inspect.
- Files likely to edit.
- Non-goals.
- Implementation tasks.
- Scientific or UX rationale.
- Cross-module synchronization checks.
- Acceptance criteria.
- Validation commands.
- Ledger update instructions.
- Stop conditions.

Prompts must repeat critical context instead of saying "as above" for any requirement that can affect implementation correctness.

## Cross-Module Memory Rules

The three modules are synchronized but not allowed to become tightly coupled.

The durable memory model is:

- Synapse IDE owns code, files, editor state, task execution, diagnostics, apply plans, and coding evidence.
- Map Explorer owns spatial canvas state, layer state, viewport, spatial selections, map artifacts, and geospatial interaction.
- Urban Analytics owns scientific scenarios, indicators, model configuration, uncertainty, evidence interpretation, and analytical reports.

Shared state should move through typed contracts, stores, or a future `synapseBus` architecture. Large geometry, raw datasets, and bulky analysis outputs must be referenced by stable IDs, not pushed through event payloads.

## Premium Product Rules

Premium means:

- Dense but readable information architecture.
- Deterministic workflows.
- Reversible operations.
- Evidence-rich states.
- Clear ownership boundaries.
- Professional spatial analytics language.
- No decorative bloat.
- No fake progress.
- No "coming soon" placeholders.
- No one-off visual systems.

Every module must feel like a different room inside the same scientific workbench, not a separate product.

## Scientific Truthfulness Rules

Agents must preserve scientific credibility:

- Label assumptions.
- Label synthetic or derived outputs.
- Show confidence, uncertainty, or validation state when analysis is involved.
- Avoid unverifiable claims.
- Keep provenance visible for generated artifacts.
- Avoid hidden mutation of data, files, or scenarios.
- Prefer explicit evidence contracts over implicit UI magic.

## UI and UX Continuity Rules

All module updates must follow a shared premium interface language:

- Keep existing global structures unless the plan explicitly allows refinement.
- Use token-driven styling.
- Align density, spacing, panel behavior, keyboard patterns, focus states, and status semantics.
- Avoid redesigning one module in isolation.
- Prefer predictable tool surfaces over marketing-style composition.
- Keep technical workflows usable for repeated professional work.

## Drift Control Rules

An agent must stop or create a ledger risk entry if it detects:

- A plan requirement that conflicts with the live architecture.
- A missing store, component, or service named by the plan.
- A change that would break another module's ownership boundary.
- A UI change that creates a new visual system.
- A synchronization change that bypasses existing bridges without an adapter.
- A validation command that cannot run because of missing dependencies or broken setup.

The agent may proceed with a conservative adapter or compatibility layer when it preserves existing behavior and records the decision.

## File Ownership Discipline

Agents must keep edits scoped to the prompt. They must not perform broad refactors unless the prompt explicitly asks for them.

When multiple files need shared contracts, prefer:

- A small typed interface.
- A compatibility adapter.
- A store selector.
- A documented event contract.
- A test fixture.

Avoid:

- Copy-paste state logic.
- Hard-coded cross-module imports where an event or shared store contract is more appropriate.
- Broad CSS overrides.
- Hidden global variables.
- Silent persistence changes.

## Validation Discipline

Every implementation step must run the narrowest useful validation available. Examples:

- Type checking.
- Unit tests.
- Component tests.
- Linting.
- Targeted build.
- Playwright smoke checks for UI-visible changes.
- Manual inspection when automated validation is unavailable.

If validation cannot run, the ledger must record:

- Command attempted.
- Failure reason.
- Whether the failure is related to the current changes.
- What the next agent should do.

## Completion Report Template

Every agent final response should include:

- What changed.
- Where it changed.
- What was validated.
- What remains.

The ledger must contain the deeper details.

## Machine-Readable Prompt Control

When a module provides a prompt manifest, the manifest defines the ordered prompt catalog but does not replace the ledger.

For Synapse IDE:

- Manifest: `DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json`
- Ledger: `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`
- Helper: `scripts/get-next-synapse-ide-prompt.ps1`

For Map Explorer:

- Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
- Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Helper: `scripts/get-next-map-explorer-prompt.ps1`

For Urban Analytics:

- Manifest: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
- Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Helper: `scripts/get-next-urban-analytics-prompt.ps1`

The manifest describes available prompts. The ledger records actual execution state. If the manifest and ledger disagree, the agent must prefer the ledger for status and record the disagreement as a risk.

## Required Handoff Format

Append a ledger entry with this structure:

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Files inspected:
- Files changed:
- Summary:
- Contract changes:
- UX changes:
- Scientific integrity notes:
- Validation:
- Risks:
- Next recommended prompt:
```

## Stop Conditions

Stop and report before editing if:

- Required plan files are missing.
- The prompt depends on a previous prompt that is not complete in the ledger.
- The live repository contradicts the plan in a way that could cause data loss.
- The requested change would require deleting user work.
- The prompt requires product decisions not specified in any durable document.

## Recovery Procedure After Context Loss

If an agent begins with no conversation history, it must:

1. Read the module `START_HERE` launcher if available.
2. Read this protocol.
3. Read the tri-modal alignment spec.
4. Read the module plan.
5. Read the sequential prompt file.
6. Read the module manifest if available.
7. Read the module ledger.
8. Identify the next incomplete prompt.
9. Confirm the target prompt from the user if multiple prompts appear ready.

This allows implementation to continue without relying on prior chat memory.

## Closing Rule

No implementation is complete until the code, the validation result, and the ledger tell the same story.
