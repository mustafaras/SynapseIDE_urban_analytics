# Color System QA Checklist

## Required For Every Visual Prompt

- Record surfaces inspected.
- Record whether amber/gold/yellow/orange UI chrome remains.
- Record whether unnecessary card frames or filled button plates remain.
- Record whether focus is visible.
- Record whether status still has text/icon/aria support.
- Record whether hard-coded colors were removed, retained, or deferred.
- Record validation commands and results.

## Active Amber Checklist

Run the prompt-specific amber scan before and after edits.

Fail the prompt if any active-scope UI/default hit remains for:

- `#F59E0B`
- `#FBBF24`
- `#FDE68A`
- `#D97706`
- `#B45309`
- `#92400E`
- `rgba(245,158,11,...)`, `rgb(245 158 11 / ...)`, or equivalent spaced variants
- `amber`, `gold`, `yellow`, `orange`, `gradient-amber`
- `MAP_COLORS.amber*`
- `--syn-status-warning` where it renders amber in Urban Analytics modal, Center Panel, or Map Explorer

Allowed residual categories must be documented:

1. `token-source`: canonical token-definition files outside active UI scope.
2. `data-palette`: analytical map/chart palette with documented purpose.
3. `test-fixture`: tests or mocks that intentionally verify legacy import/export compatibility.
4. `content-example`: code example where the color is user-visible but intentionally preserved with a documented analytical reason.

## Chrome Checklist

- Default buttons are transparent or neutral.
- Active buttons do not render as large filled rounded plates.
- Focus-visible state is present and non-amber.
- No card-in-card composition.
- Repeated rows use separators or neutral panels before decorative cards.
- Border radius stays compact, generally 2-4px for controls and <= 8px for true repeated cards.
- No decorative radial gradients, glow, shimmer, animated strips, or marketing hero treatments.
- Text fits inside toolbar buttons, badges, chips, tabs, and compact panels.

## Contrast Checklist

- Primary text on workbench, navigation, editor, panel, elevated, input, drawer, and map overlay surfaces.
- Secondary and muted text on panel, navigation, modal, drawer, and map overlay surfaces.
- Disabled text in buttons, tabs, layer rows, method rows, file rows, and command/search surfaces.
- Focus ring on workbench, panel, input, modal, drawer, and map overlay surfaces.
- Status badges for valid, error, info, blocked, stale, unknown, demo, running, pending, and caveat/warning semantics.

## Screenshot Checklist

Part 1 - Urban Analytics modal:

- Main modal shell with rail, command/search, middle content, right panel, and bottom action bar.
- Welcome/onboarding modal.
- Method catalog and indicator catalog.
- Right panel dossier and generated report/print preview if practical.
- Evidence tray, data fitness, method validity, workflow status.
- VoxCity/3D controls, simulation panel, scenario comparison.
- Compact viewport for text overflow and focus visibility.

Part 2 - Center Panel Workbench:

- Center Panel shell, top tab bar, status rail, and preserved header animations.
- Projects tab registry, project detail, session/indicator/AI surfaces.
- New Project tab intake form, field stacks, tag pills, and submit bar.
- Methods/Guide tab outline rail, guide content, command bars, and preserved tab rhythm.
- Report/Note tab editor, project header, library insert, preview, and footer.
- Workflows tab rail, tiles, step pills, cockpit, and per-flow surfaces.
- Toolbox tab project list, action panels, capability/lab/consulton/export surfaces.
- Cross-cutting urban context strip, outline nav, background tasks, engine capabilities, narrative, and object detector surfaces.
- Compact viewport for tab overflow, row density, focus visibility, and text clipping.

Part 3 - Map Explorer:

- Map Explorer shell with canvas, cockpit, status bar, and overlays.
- Toolbar, search, pin sidebar, context menu, keyboard controls.
- Layer manager and layer panel.
- Scientific QA, NL query, workflow drawer, review timeline, report handoff.
- Import/export/service/drawing/measurement/temporal dialogs and tools.
- Data/default symbology examples if colors changed.
- Compact viewport for map-control overlap and focus visibility.

## Status Truthfulness Checklist

- Success is only used for valid/ready/complete.
- Demo uses demo styling and explicit label.
- Unknown uses unknown styling and explicit label.
- Stale uses stale styling and explicit label.
- Blocked uses blocked/error-adjacent styling and explicit reason.
- Warning/caveat semantics are not decorative and are not amber in active scopes.
- Data visualization colors do not silently imply UI status.
- `score: null` remains unknown.
- CRS and publication readiness warnings remain explicit.

## Token Regression Guard

Run this lightweight report when available:

- Full source report: `npm run color:guard`
- Changed-files report: `npm run color:guard:changed`

Guard behavior:

- Scans only `src/**/*.{ts,tsx,css}`.
- Excludes allowlisted token-source files.
- Excludes allowlisted data-visualization palette files.
- Excludes test/fixture surfaces (`__tests__`, `__mocks__`, `.test.*`, `.spec.*`, fixtures).
- Reports findings only and exits `0` by default unless the project changes the guard behavior.

## Ledger QA Entry Template

```md
### Color QA - <Date>

- Prompt:
- Surfaces checked:
- Viewports:
- Amber scan:
- Card/frame cleanup notes:
- Button/control cleanup notes:
- Contrast notes:
- Focus notes:
- Status truthfulness notes:
- Data palette notes:
- Screenshots or manual evidence:
- Failures:
- Follow-up:
```
