# Color System Agent Handoff Template

## Purpose

Every agent implementing a color-system prompt must reflect this handoff in `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` before finishing.

## Handoff Block

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Manifest: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files inspected:
- Files changed:
- Tokens added:
- Tokens consumed:
- Tokens aliased or deprecated:
- Hard-coded colors removed:
- Hard-coded colors retained with reason:
- UX changes:
- Accessibility and contrast notes:
- Data visualization notes:
- Scientific integrity notes:
- Cross-module contract changes:
- Validation commands:
- Validation results:
- Screenshots or manual visual evidence:
- Known risks:
- Blockers:
- Decisions made:
- Next recommended prompt:
- Ledger updated:
```

## Required Precision

Use exact file paths. Do not write "various files." If many files changed, group them by unit and list the important paths.

## Scientific Integrity Default

If no scientific semantics changed, write:

`Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.`

## Contract Default

If no contracts changed, write:

`Cross-module contract changes: None.`
