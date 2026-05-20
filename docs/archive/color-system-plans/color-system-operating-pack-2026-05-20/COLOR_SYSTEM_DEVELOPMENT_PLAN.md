# Color System Development Plan

## Goal

Execute a strict three-part color and chrome cleanup:

1. First, remove amber from the complete Urban Analytics modal and restyle it with premium VS Code-like density.
2. Second, remove amber from the complete Center Panel Workbench and restyle every non-map tab with the same premium, quiet workbench discipline while preserving existing ambient header animations.
3. Third, remove amber from the complete Map Explorer and restyle it to match the completed Center Panel workbench language.

The plan must remain executable by small agents through narrow prompts.

## Strategy

1. Treat completed broad Prompts `00`-`17` as historical token/shared-shell baseline.
2. Inventory active-scope amber before editing.
3. Remove amber from Urban Analytics modal UI, content surfaces, generated HTML, evidence/status panels, VoxCity controls, and Python utility panels.
4. Run Urban Analytics final QA before starting Center Panel.
5. Remove amber and heavy card chrome from Center Panel shell, tabs, cross-cutting surfaces, and preserved header animation color stops.
6. Run Center Panel final QA before starting Map Explorer.
7. Remove amber from Map Explorer central tokens before component-level migration.
8. Remove amber from Map Explorer shell, cockpit, controls, layers, QA/readiness, drawers, dialogs, interactive tools, default symbology, services, exports, and tests.
9. Run final map QA and close the three-part handoff.

## Current Architecture Facts

- `src/theme/GlobalSynapseStyles.ts` and `src/theme/synapse.ts` already expose VS Code-inspired primitive and semantic tokens from the historical baseline.
- Urban Analytics still contains large inline CSS blocks, embedded modal styling, generated HTML styles, and VoxCity controls with amber/gold literals.
- Map Explorer centralizes many styles in `src/centerpanel/components/map/mapTokens.ts`, but many components and services still consume `MAP_COLORS.amber*` or `#F59E0B` defaults.
- The active scopes historically mixed visual state with amber as neutral emphasis, active state, card border, button fill, link color, and default/demo visualization color. Use the ledger for completed and pending state.

## Phase Plan

| Phase | Prompts | Outcome |
| --- | --- | --- |
| Urban Analytics inventory | A01 | Exact modal amber map and migration order |
| Urban Analytics shell and controls | A02-A03 | Amber-free modal shell, welcome, rail, command bar, search, chips, bottom actions |
| Urban Analytics content and status | A04-A06 | Amber-free method catalog, indicators, dossier, generated HTML, evidence, data fitness, validity, workflow status |
| Urban Analytics 3D and utilities | A07-A08 | Amber-free VoxCity/simulation and Python utility panels |
| Urban Analytics QA and gate | A09-A10 | Final UA visual/scan QA and explicit gate to Center Panel |
| Center Panel inventory and shell | C01-C02 | Exact tab-scoped amber/heavy-chrome inventory, token/header/shell migration, preserved ambient motion |
| Center Panel tab interiors | C03-C08 | Projects, New Project, Methods/Guide, Report/Note, Workflows, and Toolbox as dense workbench inspectors |
| Center Panel cross-cutting and gate | C09-C10 | Cross-tab surfaces, final visual QA, and explicit gate to Map Explorer |
| Map Explorer inventory and token boundary | B01-B02 | Exact map amber/heavy-chrome map, Center Panel alignment lock, and non-amber central map tokens |
| Map Explorer shell, cockpit, controls, layers | B03-B06 | Amber-free shell, docking, cockpit, toolbar, search, pins, bookmarks, context menus, and layer management |
| Map Explorer high-risk semantics and dialogs | B07-B10 | Amber-free QA/readiness, workflow/query/review/report drawers, import/service dialogs, export/generated chrome |
| Map tools, data defaults, services, final QA | B11-B15 | No amber interactive defaults, renderer defaults, service-generated colors, final visual QA, and handoff |

## Validation Policy

- Documentation-only prompts: validate by reviewing file changes and JSON parse when applicable.
- Urban Analytics prompts: run `npm run typecheck` and `npm run test:analytics`.
- Map Explorer prompts: run `npm run typecheck` plus targeted map tests for changed behavior-adjacent files or color assertions.
- Visual prompts: run Playwright/screenshot smoke if stable, otherwise record manual review steps.
- Every implementation prompt must run the active-scope amber scan before and after edits and record residuals in the ledger.

## Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Branch divergence confuses execution state | High | Do not resolve branch divergence or move archive files during color prompts. |
| Amber removal weakens warning semantics | High | Use explicit labels/icons/disabled reasons plus non-amber status styling. |
| UI polish accidentally changes scientific meaning | High | Do not touch GIS calculations, evidence immutability, method validity, data fitness, readiness, or map layer contracts. |
| Map data palettes are confused with UI chrome | High | B12-B13 separate default/demo/generated colors from documented analytical palettes and service outputs. |
| Small agents over-edit | High | One prompt per agent, exact scopes, active ledger update, stop after prompt. |
| Premium restyle becomes decorative | Medium | Remove frames/fills/glow; prefer VS Code-like density, hairlines, neutral surfaces, and restrained blue-gray interaction. |

## Completion Criteria

- `A01`-`A10`, `C01`-`C10`, and `B01`-`B15` statuses are completed or skipped with reason.
- Urban Analytics modal has no amber UI/default styling and no unnecessary card/button chrome.
- Center Panel has no amber UI/default styling and no unnecessary card/button chrome, with existing ambient header motion preserved.
- Map Explorer has no amber UI/default/demo/generated styling and no unnecessary card/button chrome.
- Retained color literals are documented as token-source, test-fixture, or data-palette/content exceptions.
- Ledger records exact files, validation, scans, risks, and screenshots/manual QA.
- Final handoff identifies no active blocker.
