# Color System Agent Protocol

## Purpose

This protocol makes the active three-part color-system plan executable by small, low-context agents. Each agent should take exactly one active prompt from the sequential prompt file, read only the required context for that prompt, make narrowly scoped changes, validate, update the ledger, and stop.

## Active Workstream

1. Part 1: `A01`-`A10`, complete Urban Analytics modal amber removal and premium VS Code-like restyle.
2. Part 2: `C01`-`C10`, complete Center Panel Workbench amber removal and premium VS Code-like restyle, excluding Map Explorer files.
3. Part 3: `B01`-`B15`, complete Map Explorer amber removal and premium VS Code-like restyle aligned to the completed Center Panel design language.

Do not start Part 2 until Part 1 is completed or explicitly skipped with reason. Do not start Part 3 until Part 2 is completed or explicitly skipped with reason.

## Non-Negotiable Rules

1. Keep every prompt color, chrome, density, and layout-polish scoped. Do not redesign workflows, data contracts, or analysis logic.
2. Do not introduce Tailwind or a new component library.
3. Do not use color alone to communicate status. Preserve labels, icons, aria text, tooltips, and disabled reasons.
4. Do not make demo, synthetic, stale, unknown, blocked, degraded, residual-gap, environment-dependent, or deferred states look ready.
5. Keep UI chrome colors separate from analytical map/chart/data-visualization palettes.
6. Prefer existing CSS Modules, styled-components, inline-style cleanup, and project token files over new abstractions.
7. Do not remove legacy global tokens unless all known consumers are migrated or a compatibility alias is documented.
8. Do not run broad formatting on unrelated files.
9. Do not move `DEVELOPMENT_PLANS/` during color work.
10. In Urban Analytics modal, Center Panel, and Map Explorer, remove amber/gold/yellow/orange UI chrome, amber active states, amber button fills, amber card borders, amber glows, and amber default/demo/generated colors.

## Premium VS Code Chrome Rules

- Default buttons: transparent or neutral, with icon/text color and subtle hover.
- Active controls: use a thin rail, underline, icon/text color, or compact selected row. Avoid filled rounded plates.
- Panels: use neutral surfaces and 1px separators. Avoid card-in-card frames.
- Inputs: compact height, 2-4px radius, neutral border, visible focus ring.
- Badges/chips: text-backed, compact, no amber as generic emphasis.
- Drawers/inspectors: dense group headers and rows, not stacked decorative cards.
- Gradients/glows/shimmer/animated strips: remove unless a prompt explicitly documents a data visualization need.

## Small Agent Work Pattern

Every implementation prompt should follow this cycle:

1. Read `START_HERE_COLOR_SYSTEM_AGENT.md`.
2. Read this protocol.
3. Read `COLOR_SYSTEM_UNIT_MATRIX.md` for the active unit.
4. Read `COLOR_SYSTEM_TOKEN_REFERENCE.md`.
5. Read the active prompt block only.
6. Inspect files named by the prompt.
7. Check `git status --short` before editing.
8. Run the prompt's pre-edit amber scan.
9. Make the smallest useful color/chrome/layout-density migration.
10. Run only the validation required by the prompt.
11. Re-run the prompt's amber scan.
12. Update `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` with exact files and results.
13. Stop. Do not continue to the next prompt unless explicitly asked.

## Output Requirements For Each Agent

The ledger entry must record:

- Prompt ID and title.
- Files inspected.
- Files changed.
- Tokens added, renamed, aliased, consumed, or deprecated.
- Hard-coded colors removed.
- Hard-coded colors retained with exact reason.
- Card frames and filled buttons removed or intentionally retained.
- Accessibility and contrast notes.
- Data visualization notes.
- Scientific integrity notes.
- Cross-module contract changes.
- Validation commands and results.
- Known risks and next prompt.

## Token Naming Contract

Use five layers:

1. Primitive tokens: actual palette values, for example `--syn-vscode-bg-root`.
2. Semantic tokens: product meaning, for example `--syn-surface-workbench`.
3. Component aliases: temporary local compatibility, for example `--map-layer-row-bg`.
4. Status semantic tokens: explicit status meaning, for example `--syn-status-error`.
5. Data palettes: map/chart/legend colors only.

Do not bind product components directly to primitives unless the component is itself a token preview or palette documentation surface.

## Active Status Color Contract

Allowed status meanings:

- `valid`
- `error`
- `info`
- `blocked`
- `stale`
- `unknown`
- `demo`
- `running`
- `pending`

Warning/caveat semantics remain allowed as product meaning, but active scopes must not render them with amber if `--syn-status-warning` resolves amber. Use labels, icons, aria text, disabled reasons, and non-amber info/error/stale/unknown styling according to severity.

## Data Visualization Contract

Map and chart palettes are not UI chrome tokens. If a prompt touches `src/utils/colorRamps.ts`, `src/engine/carto/`, map layer renderers, map services, chart components, or demo data packs, it must document:

- Palette purpose.
- Classification type.
- Legend behavior.
- Unknown/no-data treatment.
- Colorblind and contrast considerations.
- Whether any yellow/orange stop remains as a data-palette exception.
- Why the retained color cannot be confused with UI warning/error/status styling.

## Stop Conditions

Stop and report instead of editing if:

- The prompt would require a branch merge or conflict resolution outside the active color scope.
- The required files differ substantially from the unit matrix and the correct owner is unclear.
- A contrast check fails and no local token can fix it without broader design changes.
- Color changes could misrepresent scientific readiness, evidence provenance, CRS status, method validity, or data fitness.
- The prompt requires modifying generated, coverage, dist, or large binary files.
