# Color System Plans

## Purpose

This folder is the durable operating pack for applying a VS Code-inspired color system across the Urban Analytics Workbench. It is built for small agents: one prompt, one unit, exact files, narrow validation, ledger update, then stop.

The work is color-scoped. It must not redesign layouts, alter workflows, change GIS calculations, mutate evidence semantics, or move archived planning files.

## Current Status

- Pack status: revised for small-agent execution on 2026-05-14.
- Implementation status: not started.
- Prompt count: 38 prompts, `00` through `37`.
- Visual anchor: VS Code dark workbench screenshot supplied by the user.
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
| `START_HERE_COLOR_SYSTEM_AGENT.md` | Single entry point for color agents |
| `COLOR_SYSTEM_AGENT_PROTOCOL.md` | Small-agent execution rules and stop conditions |
| `COLOR_SYSTEM_UNIT_MATRIX.md` | Application unit map with primary files |
| `COLOR_SYSTEM_ALIGNMENT_SPEC.md` | Product and scientific color rules |
| `COLOR_SYSTEM_DEVELOPMENT_PLAN.md` | Strategy, phases, and completion criteria |
| `COLOR_SYSTEM_TOKEN_REFERENCE.md` | Token taxonomy, palette, aliases, status rules |
| `COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` | 38 detailed implementation prompts |
| `COLOR_SYSTEM_PROMPT_MANIFEST.json` | Machine-readable prompt catalog |
| `COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` | Execution source of truth |
| `COLOR_SYSTEM_QA_CHECKLIST.md` | Contrast, screenshot, and status QA gate |
| `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md` | Required handoff structure |

## Color Direction

- Base: charcoal workbench surfaces inspired by VS Code dark mode.
- Interactive accent: blue for focus, active navigation, selected rows, and editor-like affordances.
- Attention accent: amber only for meaningful attention, provenance, warning, or premium emphasis.
- Status colors: success, warning, error, info, blocked, stale, unknown, demo, running, pending.
- Analytical palettes: separate from UI chrome and status colors.

## Existing Style Reality

The repo currently has multiple color systems:

- `src/theme/GlobalSynapseStyles.ts` defines many `--syn-*` variables and legacy `--color-*` aliases.
- `src/theme/synapse.ts` exposes styled-components theme values and compatibility variables.
- `src/styles/theme.ts` defines older `Theme` objects and `createCSSVariables`.
- `src/contexts/ThemeContext.tsx` writes theme variables and persists theme mode.
- `src/app/AppThemeProvider.tsx` wraps the app in `GlobalSynapseStyles` and `synapseTheme`.
- Many CSS Modules and inline style objects still contain hard-coded colors.

The plan therefore starts with inventory and token compatibility before migrating component units.

## Execution Rule

Do not treat this folder as a suggestion list. Treat it as an operating pack:

1. Find the next prompt in the ledger.
2. Execute only that prompt.
3. Validate narrowly.
4. Update the ledger.
5. Stop.
