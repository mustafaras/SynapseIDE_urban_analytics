# Start Here - Map Explorer Agent

## Purpose

This is the single entry file for any agent that will implement Map Explorer work. If an agent receives only one Map Explorer file, give it this file.

The agent must not rely on chat memory. It must recover context from durable documents, identify the next incomplete Map Explorer prompt from the ledger or helper script, implement only that prompt, validate the work, update the ledger, and leave a handoff record.

## One-Line Agent Instruction

```text
Read this file, read the token-minimized startup files, run or manually follow the next-prompt discovery process, use targeted search for the active Map Explorer prompt, validate narrowly, update the ledger, and finish with the handoff template.
```

## Token-Minimized Reading Order

Read these files in this exact order before editing code:

1. `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
2. `DEVELOPMENT_PLANS/CURRENT_TASK.json`
3. `DEVELOPMENT_PLANS/MODULE_INDEX.json` only if ownership is unclear
4. The active prompt block from `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`, found by heading or prompt id
5. The active prompt status/log rows from `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`, found by prompt id

## Next Prompt Discovery

Preferred method:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-map-explorer-prompt.ps1 -Json
```

If script execution is unavailable, manually inspect:

1. `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
2. Section: `Prompt Status Register`
3. Select the first prompt whose status is not `completed` or `skipped_with_reason`.
4. If a prompt is `blocked`, do not skip it unless the user explicitly instructs you to continue with a later independent prompt.

## Valid Prompt Status Values

- `pending`
- `in_progress`
- `completed`
- `blocked`
- `skipped_with_reason`

No other status value is valid.

## Execution Rules

Before editing:

1. Confirm the next prompt ID and title.
2. Read only the active prompt block in `MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`.
3. Inspect every required file named by the prompt.
4. Check for existing user changes if version control metadata is available.
5. Update the ledger status to `in_progress` if you are allowed to edit docs during implementation.

During implementation:

1. Keep edits scoped to the active prompt.
2. Preserve the existing Map Explorer shell and store architecture unless the prompt explicitly changes it.
3. Preserve tri-modal alignment with Synapse IDE and Urban Analytics.
4. Use typed contracts, stores, services, or adapters for synchronization.
5. Do not invent fake CRS, fake QA, fake layer provenance, fake workflow success, fake export readiness, or fake map artifact state.
6. Do not silently mutate map layers, analysis outputs, report handoffs, dashboard bindings, education links, or IDE file state.

Before final response:

1. Validate using the command(s) required by the prompt or the narrowest available equivalent.
2. Update the `Prompt Execution Log`.
3. Update the `Prompt Status Register`.
4. Update files inspected, files changed, validation, risks, and next pointer.
5. Complete the handoff template.

## Required Final Output Shape

Use this concise structure in the final response:

```md
Completed:
- Prompt:
- Files changed:
- Validation:
- Ledger updated:
- Next prompt:

Risks:
- None, or list real risks.
```

## Automation Contract

This operating pack is semi-automated:

- The manifest makes the prompt ladder machine-readable.
- The ledger records real execution state.
- The helper script identifies the next prompt.
- The handoff template standardizes memory transfer.
- The token-minimized context files prevent full-plan reads during startup.

It does not execute product implementation by itself. An agent must still read, implement, validate, and update the ledger.

## Stop Conditions

Stop and report if:

- Required files are missing.
- The helper script and ledger disagree in a way that cannot be resolved.
- The next prompt depends on a blocked prompt.
- The live repository contradicts the plan in a way that could cause spatial evidence misrepresentation or data loss.
- You cannot safely update the ledger.

## Minimal User Prompt For Future Sessions

The user can start any future Map Explorer implementation session with:

```text
Use DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md and execute the next incomplete Map Explorer prompt. Update the ledger before finishing.
```

That is enough context when the operating pack is intact.
