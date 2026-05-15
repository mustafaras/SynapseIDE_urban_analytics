# Color System Plans

## Purpose

This folder is the durable operating pack for the active two-part color-system workstream. The goal is no longer a broad app-wide sweep. The active goal is:

1. Make the complete Urban Analytics modal amber-free and premium VS Code-like.
2. Then make the complete Map Explorer amber-free and premium VS Code-like.

The work is color, chrome, and layout-density scoped. It must not change workflows, GIS calculations, persistence, evidence semantics, method validity, map layer behavior, or cross-module contracts.

## Current Status

- Pack status: reprioritized on 2026-05-15 for a two-part amber-removal workstream.
- Historical baseline: old broad Prompts `00` through `17` were completed on 2026-05-15 and remain token/shared-shell baseline.
- Active prompt count: 20 prompts, `A01` through `A10` and `B01` through `B10`.
- Active priority: Part 1 Urban Analytics modal first, Part 2 Map Explorer second.
- Current prompt: `A01 - Urban Analytics Amber Inventory And Scope Lock`.
- Visual anchor: premium VS Code dark workbench discipline: quiet charcoal surfaces, blue/gray-blue interaction, dense rows, thin separators, transparent controls.
- Archive context: `DEVELOPMENT_PLANS/` archive preparation is separate. The local branch is stale/diverged from `origin/master`; do not move tri-modal plan files during color work.

## Start Here

Future agents should start from:

```text
COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md
```

## Canonical Reading Order

1. `COLOR_SYSTEM_PLANS/README.md`
2. `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
4. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
5. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
6. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
7. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
8. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
9. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
10. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
11. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
12. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`

## Pack Files

| File | Role |
| --- | --- |
| `START_HERE_COLOR_SYSTEM_AGENT.md` | Single entry point for two-part color agents |
| `COLOR_SYSTEM_AGENT_PROTOCOL.md` | Small-agent execution rules and stop conditions |
| `COLOR_SYSTEM_UNIT_MATRIX.md` | Active Urban Analytics and Map Explorer unit map |
| `COLOR_SYSTEM_ALIGNMENT_SPEC.md` | Product, scientific, visual, and amber-removal rules |
| `COLOR_SYSTEM_DEVELOPMENT_PLAN.md` | Strategy, two-part phases, and completion criteria |
| `COLOR_SYSTEM_TOKEN_REFERENCE.md` | Token taxonomy, palette, aliases, status rules |
| `COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` | Active `A01`-`B10` implementation prompts |
| `COLOR_SYSTEM_PROMPT_MANIFEST.json` | Machine-readable prompt catalog |
| `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` | Execution source of truth |
| `COLOR_SYSTEM_QA_CHECKLIST.md` | Amber, contrast, screenshot, and status QA gate |
| `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md` | Required handoff structure |

## Active Color Direction

- Base: charcoal VS Code-like workbench surfaces.
- Interactive accent: blue/gray-blue for focus, active navigation, selected rows, and editor-like affordances.
- Amber: not allowed in Urban Analytics modal or Map Explorer UI/default/demo styling.
- Status colors: valid, error, info, blocked, stale, unknown, demo, running, pending. Warning/caveat states in active scopes must use explicit text/icon plus non-amber styling.
- Analytical palettes: separate from UI chrome. Amber-like palette stops require a documented data reason and must not be used as UI/default/demo accent.

## Active UI Direction

- Remove unnecessary card frames and card-in-card surfaces.
- Remove filled button plates where transparent/icon-row controls are sufficient.
- Prefer dense rows, group headers, split panes, thin separators, compact inputs, and stable toolbar dimensions.
- Avoid decorative gradients, glow, shimmer, animated strips, hero marketing layouts, and placeholder panels that compete with the work surface.

## Existing Style Reality

The repo currently has multiple color systems:

- `src/theme/GlobalSynapseStyles.ts` defines many `--syn-*` variables and legacy aliases.
- `src/theme/synapse.ts` exposes styled-components theme values and compatibility variables.
- `src/styles/theme.ts` defines older `Theme` objects and `createCSSVariables`.
- `src/contexts/ThemeContext.tsx` writes theme variables and persists theme mode.
- `src/app/AppThemeProvider.tsx` wraps the app in `GlobalSynapseStyles` and `synapseTheme`.
- Urban Analytics and Map Explorer still contain hard-coded amber/gold literals, amber aliases, and card-heavy inline styles.

## Execution Rule

Treat this folder as an operating pack:

1. Find the next active prompt in the ledger.
2. Execute only that prompt.
3. Validate narrowly.
4. Update the ledger.
5. Stop.

Do not start Part 2 until Part 1 is complete or explicitly skipped with reason.
