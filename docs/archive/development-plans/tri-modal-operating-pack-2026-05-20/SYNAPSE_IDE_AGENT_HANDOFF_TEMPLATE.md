# Synapse IDE Agent Handoff Template

## Purpose

Every agent implementing Synapse IDE must use this template before finishing. The final chat response can be short, but this handoff content must be reflected in `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`.

## Handoff Block

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_SYNAPSE_IDE_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/SYNAPSE_IDE_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md`
- Files inspected:
- Files changed:
- Behavior implemented:
- UX changes:
- Scientific integrity notes:
- Cross-module contract changes:
- Persistence changes:
- Accessibility changes:
- Validation commands:
- Validation results:
- Known risks:
- Blockers:
- Decisions made:
- Next recommended prompt:
- Ledger updated:
```

## Required Precision

Use exact file paths. Do not say "various files" or "some components." If many files changed, group them by folder and list the important paths.

## Status Rules

Use only these values:

- `pending`
- `in_progress`
- `completed`
- `blocked`
- `skipped_with_reason`

## Validation Rules

If validation ran, include:

- Command.
- Result.
- Whether failures are related to current changes.

If validation did not run, include:

- Reason.
- What should be run next.

## Cross-Module Contract Rules

If the prompt touched synchronization, record:

- Contract name.
- Direction.
- Payload shape or reference.
- Owner module.
- Consumer module.
- Compatibility with legacy bridge.

If no contract changed, write:

`Cross-module contract changes: None.`

## Scientific Integrity Rules

Record whether the prompt changed:

- Evidence provenance.
- Artifact identity.
- AI-generated code behavior.
- Analysis reproducibility.
- Diagnostic truthfulness.
- Scenario or spatial metadata.

If none changed, write:

`Scientific integrity notes: No scientific evidence semantics changed.`

## Ledger Update Checklist

Before final response, confirm:

- Prompt status updated in `Prompt Status Register`.
- Prompt execution entry appended.
- Files inspected registry updated.
- Files changed registry updated.
- Validation history updated.
- Contract registry updated if applicable.
- Risks updated if applicable.
- Next prompt pointer updated.
