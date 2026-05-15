# Color System QA Checklist

## Required For Every Visual Prompt

- Record surfaces inspected.
- Record whether focus is visible.
- Record whether status still has text/icon/aria support.
- Record whether hard-coded colors were removed, retained, or deferred.
- Record validation commands and results.

## Contrast Checklist

- Primary text on workbench, navigation, editor, panel, elevated, and input surfaces.
- Secondary and muted text on panel and navigation surfaces.
- Disabled text in buttons, tabs, layer rows, file rows, and command palette.
- Focus ring on workbench, panel, input, and map overlay surfaces.
- Status badges for valid, warning, error, info, blocked, stale, unknown, demo, running, pending.

## Screenshot Checklist

- Root workbench shell.
- Synapse IDE with file explorer, editor, terminal, and problems panel.
- Command palette and global search.
- AI composer and apply/review state.
- Map Explorer with canvas, toolbar, layer rail, QA panel, NL query, review timeline, report drawer.
- Urban Analytics modal with method catalog, evidence, data fitness, and workflow status.
- Dashboard/reporting/guide surfaces if touched.
- Compact viewport for text overflow and focus visibility.

## Status Truthfulness Checklist

- Success is only used for valid/ready/complete.
- Demo uses demo styling and explicit label.
- Unknown uses unknown styling and explicit label.
- Stale uses stale styling and explicit label.
- Blocked uses blocked/error-adjacent styling and explicit reason.
- Warning is not a decorative accent.
- Data visualization colors do not silently imply UI status.

## Token Regression Guard (Prompt 07)

Run this lightweight report before and after color-focused prompts:

- Full source report: `npm run color:guard`
- Changed-files report: `npm run color:guard:changed`

Guard behavior:

- Scans only `src/**/*.{ts,tsx,css}`.
- Excludes allowlisted token-source files.
- Excludes allowlisted data-visualization palette files.
- Excludes test/fixture surfaces (`__tests__`, `__mocks__`, `.test.*`, `.spec.*`, fixtures).
- Reports findings only and exits `0` by default (non-blocking).

Allowed hard-coded color categories (do not treat as immediate migration failures):

1. `token-source`: canonical token-definition files.
2. `data-visualization`: analytical palettes, cartographic renderers, legends.
3. `test-fixture`: test and mock surfaces.
4. `fallback`: temporary `var(--token, fallback)` compatibility values while migrations are in progress.

Non-goal for Prompt 07:

- Do not wire this guard into CI failure gates until inventory and migration maturity are explicitly declared in later prompts.

## Ledger QA Entry Template

```md
### Color QA - <Date>

- Prompt:
- Surfaces checked:
- Viewports:
- Contrast notes:
- Focus notes:
- Status truthfulness notes:
- Data palette notes:
- Screenshots or manual evidence:
- Failures:
- Follow-up:
```
