# Start Here - Synapse IDE Agent

## Purpose

This is the single entry file for any agent that will implement Synapse IDE work. If an agent receives only one file, give it this file.

The agent must not rely on chat memory. It must recover context from the durable documents listed here, identify the next incomplete prompt from the ledger or helper script, implement only that prompt, validate the work, update the ledger, and leave a handoff record.

## One-Line Agent Instruction

```text
Read this file, read the token-minimized startup files, run or manually follow the next-prompt discovery process, use targeted search for the active Synapse IDE prompt, validate narrowly, update the ledger, and finish with the handoff template.
```

## Token-Minimized Reading Order

Read these files in this exact order before editing code:

1. `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
2. `DEVELOPMENT_PLANS/CURRENT_TASK.json`
3. `DEVELOPMENT_PLANS/MODULE_INDEX.json` only if ownership is unclear
4. The active prompt block from `DEVELOPMENT_PLANS/SYNAPSE_IDE_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`, found by heading or prompt id
5. The active prompt status/log rows from `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`, found by prompt id

## Next Prompt Discovery

Preferred method:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\get-next-synapse-ide-prompt.ps1 -Json
```

If script execution is unavailable, manually inspect:

1. `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`
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
2. Read only the active prompt block in `SYNAPSE_IDE_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`.
3. Inspect every required file named by the prompt.
4. Check for existing user changes if version control metadata is available.
5. Update the ledger status to `in_progress` if you are allowed to edit docs during implementation.

During implementation:

1. Keep edits scoped to the active prompt.
2. Preserve the existing app structure unless the prompt explicitly changes it.
3. Preserve tri-modal alignment with Map Explorer and Urban Analytics.
4. Use adapters for synchronization.
5. Do not invent fake progress, fake diagnostics, fake map state, or fake analytics state.
6. Do not silently mutate user code or analysis artifacts.

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
- The live repository contradicts the plan in a way that could cause data loss.
- You cannot safely update the ledger.

## Minimal User Prompt For Future Sessions

The user can start any future Synapse IDE implementation session with:

```text
Use DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md and execute the next incomplete Synapse IDE prompt. Update the ledger before finishing.
```

That is enough context when the operating pack is intact.
