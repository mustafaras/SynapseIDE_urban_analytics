# Color System Agent Protocol

## Purpose

This protocol makes the color-system plan executable by small, low-context agents. Each agent should take exactly one prompt from the sequential prompt file, read only the required context for that prompt, make narrowly scoped changes, validate, and update the ledger.

## Non-Negotiable Rules

1. Keep every prompt color-scoped. Do not redesign layout, workflow, data contracts, or analysis logic.
2. Do not introduce Tailwind or a new component library.
3. Do not use color alone to communicate status. Preserve labels, icons, aria text, tooltips, and disabled reasons.
4. Do not make demo, synthetic, stale, unknown, blocked, or degraded states look ready.
5. Keep UI chrome colors separate from analytical map/chart/data-visualization palettes.
6. Prefer existing CSS Modules, styled-components, and project token files over new abstractions.
7. Do not remove legacy tokens until all known consumers are migrated or a compatibility alias is documented.
8. Do not run broad formatting on unrelated files.
9. Do not move `DEVELOPMENT_PLANS/` during color work. Archive movement is governed by the archive readiness docs.

## Small Agent Work Pattern

Every implementation prompt should follow this cycle:

1. Read `START_HERE_COLOR_SYSTEM_AGENT.md`.
2. Read this protocol.
3. Read `COLOR_SYSTEM_UNIT_MATRIX.md` for the active unit.
4. Read the active prompt block only.
5. Inspect files named by the prompt.
6. Check `git status --short` before editing.
7. Make the smallest useful token or color migration.
8. Run only the validation required by the prompt.
9. Update `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` with exact files and results.
10. Stop. Do not continue to the next prompt unless explicitly asked.

## Output Requirements For Each Agent

The ledger entry must record:

- Prompt ID and title.
- Files inspected.
- Files changed.
- Tokens added, renamed, aliased, or consumed.
- Hard-coded colors removed or intentionally retained.
- Accessibility and contrast notes.
- Data visualization and scientific integrity notes.
- Validation commands and results.
- Known risks and next prompt.

## Token Naming Contract

Use three layers:

1. Primitive tokens: actual palette values, for example `--syn-vscode-bg-root`.
2. Semantic tokens: product meaning, for example `--syn-surface-workbench`.
3. Component aliases: temporary local compatibility, for example `--map-layer-row-bg`.

Do not bind product components directly to primitives unless the component is itself a token preview or palette documentation surface.

## Status Color Contract

Use explicit semantic statuses:

- `valid`
- `warning`
- `error`
- `info`
- `blocked`
- `stale`
- `unknown`
- `demo`
- `running`
- `pending`

Every status must have a text label or accessible name. Demo and unknown must never share success styling.

## Data Visualization Contract

Map and chart palettes are not UI chrome tokens. If a prompt touches `src/utils/colorRamps.ts`, `src/engine/carto/`, map layer renderers, or chart components, it must document:

- Palette purpose.
- Classification type.
- Legend behavior.
- Unknown/no-data treatment.
- Colorblind and contrast considerations.
- Whether colors overlap with UI warning/error colors and why that is acceptable or not.

## Stop Conditions

Stop and report instead of editing if:

- The prompt would require a branch merge or conflict resolution outside the active color scope.
- The required files differ substantially from the unit matrix and the correct owner is unclear.
- A contrast check fails and no local token can fix it without broader design changes.
- Color changes could misrepresent scientific readiness, evidence provenance, CRS status, or data fitness.
- The prompt requires modifying generated, coverage, dist, or large binary files.
