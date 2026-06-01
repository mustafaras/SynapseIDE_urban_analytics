---
name: urban-analytics-next-prompt
description: >
  DEPRECATED: the Urban Analytics implementation prompt ladder is complete and
  archived. Use for historical audits only. For maintenance in
  src/features/urbanAnalytics/, follow .github/instructions/urban-analytics.instructions.md
  and validate with npm run typecheck plus npm run test:analytics.
---

# Urban Analytics — Complete Prompt Ladder

Urban Analytics implementation is complete. The former implementation ledger and sequential prompts are archived here:

- [`docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/`](../../docs/archive/development-plans/tri-modal-operating-pack-2026-05-20/)

Do not try to discover or run a new Urban Analytics prompt from the archived ladder unless the user explicitly asks for historical audit work.

## Maintenance Flow

For bug fixes, maintenance, or new Urban Analytics cards:

1. Follow the domain rules in [`urban-analytics.instructions.md`](../instructions/urban-analytics.instructions.md).
2. Preserve module ownership: Urban Analytics owns interpretation, indicators, evidence, data fitness, and method validity; Map Explorer owns rendering, viewport, layers, and geometry.
3. Do not label demo, synthetic, sample, generated, or metadata-only output as real analytical evidence.
4. Validate with:

```bash
npm run typecheck
npm run test:analytics
```

For active multi-prompt feature work, use the GIS Modal Premium UI pack in [`GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/`](../../GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/).
