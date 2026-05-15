# Color System Development Plan

## Goal

Apply a coherent, accessible, VS Code-inspired color system across the complete application without changing product behavior. The plan must be executable by small agents through narrow prompts.

## Strategy

1. Inventory before editing.
2. Add a non-breaking primitive palette.
3. Add semantic aliases and compatibility mappings.
4. Migrate global and shared surfaces.
5. Migrate Synapse IDE units.
6. Migrate Map Explorer units.
7. Migrate Urban Analytics units.
8. Separate analytical palettes from UI chrome.
9. Sweep interaction/status truthfulness.
10. Run contrast and screenshot QA.
11. Close with final handoff.

## Current Architecture Facts

- `src/theme/GlobalSynapseStyles.ts` defines the current `--syn-*` variable layer and many legacy aliases.
- `src/theme/synapse.ts` mirrors the token model into styled-components theme objects.
- `src/styles/theme.ts` and `src/contexts/ThemeContext.tsx` provide a legacy theme path.
- `src/app/AppThemeProvider.tsx` installs `GlobalSynapseStyles` and `synapseTheme`.
- CSS Modules, styled-components, inline style objects, and renderer palettes all currently contain hard-coded colors.

## Phase Plan

| Phase | Prompts | Outcome |
| --- | --- | --- |
| Governance and inventory | 00-03 | Safe baseline, topology, hard-coded inventory, token contract |
| Token infrastructure | 04-07 | Primitive/semantic tokens, provider compatibility, guard plan |
| Shared shell | 08-11 | Root, utility, center panel, shared status surfaces |
| Synapse IDE | 12-16 | IDE shell, file explorer, editor, terminal, AI/palette surfaces |
| Map Explorer | 17-21 | Map shell, controls, layers, drawers, data palette boundary |
| Urban Analytics | 22-25 | Modal, methods, evidence, data fitness, VoxCity controls |
| Supporting surfaces | 26-27 | Dashboard, reporting, guide/tools, cartography palettes |
| Sweeps and QA | 28-37 | Interaction/status sweeps, contrast, screenshots, cleanup, handoff |

## Validation Policy

- Documentation-only prompts: validate by reviewing file changes and JSON parse when applicable.
- Shared TS/TSX prompts: run `npm run typecheck`.
- Urban Analytics prompts: run `npm run typecheck` and `npm run test:analytics`.
- Data palette helper prompts: run `npm run test -- src/utils/__tests__/colorRamps.test.ts` if helpers change.
- Visual prompts: run Playwright/screenshot smoke if stable, otherwise record manual review steps.

## Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Branch divergence confuses execution state | High | Do not move archive files during color prompts; read archive readiness docs. |
| Token migration breaks legacy consumers | High | Add aliases first; remove nothing until final cleanup. |
| Amber remains overused as neutral accent | Medium | Make blue the default interactive accent; amber is attention only. |
| Status colors imply false readiness | High | Status truthfulness sweep and text/icon requirements. |
| Data visualization colors collide with UI status colors | High | Dedicated palette prompts and data/chrome separation. |
| Small agents over-edit | High | One prompt per agent, exact file scopes, stop conditions. |

## Completion Criteria

- All prompt statuses resolved.
- Token reference documents primitives, semantics, aliases, statuses, data palettes, and examples.
- Ledger records exact files, validation, risks, and retained hard-coded colors.
- QA checklist has contrast and screenshot evidence.
- Final handoff identifies no active blocker.
