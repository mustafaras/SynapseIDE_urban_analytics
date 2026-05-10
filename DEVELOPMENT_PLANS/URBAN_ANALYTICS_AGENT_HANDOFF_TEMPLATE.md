# Urban Analytics Agent Handoff Template

## Purpose

Every agent implementing Urban Analytics must use this template before finishing. The final chat response can be short, but this handoff content must be reflected in `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`.

## Handoff Block

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_URBAN_ANALYTICS_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/URBAN_ANALYTICS_IMPLEMENTATION_LEDGER.md`
- Files inspected:
- Files changed:
- Behavior implemented:
- UX changes:
- Scientific integrity notes:
- Evidence/provenance changes:
- Data fitness or QA changes:
- Method validity changes:
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

## Scientific Integrity Rules

Record whether the prompt changed:

- Study area context.
- Method assumptions.
- Indicator formulas.
- Units or scale metadata.
- CRS or spatial reference metadata.
- Data fitness scoring.
- Method validity envelopes.
- Workflow run manifests.
- Evidence provenance.
- Report/dashboard/education export semantics.

If none changed, write:

`Scientific integrity notes: No scientific evidence semantics changed.`

## Cross-Module Contract Rules

If the prompt touched synchronization, record:

- Contract name.
- Direction.
- Payload shape or reference.
- Owner module.
- Consumer module.
- Compatibility with existing stores or bridges.

If no contract changed, write:

`Cross-module contract changes: None.`

## Ledger Update Checklist

Before final response, confirm:

- Prompt status updated in `Prompt Status Register`.
- Prompt execution entry appended.
- Files inspected registry updated.
- Files changed registry updated.
- Validation history updated.
- Contract registry updated if applicable.
- Scientific decision registry updated if applicable.
- Risks updated if applicable.
- Next prompt pointer updated.
