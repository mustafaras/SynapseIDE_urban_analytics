# Map Explorer Agent Handoff Template

## Purpose

Every agent implementing Map Explorer must use this template before finishing. The final chat response can be short, but this handoff content must be reflected in `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`.

## Handoff Block

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Files inspected:
- Files changed:
- Behavior implemented:
- UX changes:
- Spatial evidence/provenance changes:
- CRS, geometry, or measurement changes:
- Scientific QA changes:
- Layer registry or persistence changes:
- Workflow/export/report changes:
- Cross-module contract changes:
- Performance/data movement changes:
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

## Scientific GIS Integrity Rules

Record whether the prompt changed:

- Map context summary.
- Layer provenance.
- CRS or projection metadata.
- Geometry validity or measurement semantics.
- Layer QA.
- Map workflow manifests.
- Map evidence artifacts.
- Publication/export readiness.
- Report/dashboard/education handoff semantics.
- IDE or Urban Analytics synchronization contracts.

If none changed, write:

`Scientific GIS integrity notes: No spatial evidence semantics changed.`

## Cross-Module Contract Rules

If the prompt touched synchronization, record:

- Contract name.
- Direction.
- Payload shape or reference.
- Owner module.
- Consumer module.
- Compatibility with existing stores, services, or bridges.

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
- Scientific GIS decision registry updated if applicable.
- Risks updated if applicable.
- Next prompt pointer updated.
