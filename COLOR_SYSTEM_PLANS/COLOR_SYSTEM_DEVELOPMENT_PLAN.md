# Color System Development Plan

## Goal

Execute a strict two-part color and chrome cleanup:

1. First, remove amber from the complete Urban Analytics modal and restyle it with premium VS Code-like density.
2. Second, remove amber from the complete Map Explorer and restyle it with the same premium, quiet workbench discipline.

The plan must remain executable by small agents through narrow prompts.

## Strategy

1. Treat completed broad Prompts `00`-`17` as historical token/shared-shell baseline.
2. Inventory active-scope amber before editing.
3. Remove amber from Urban Analytics modal UI, content surfaces, generated HTML, evidence/status panels, VoxCity controls, and Python utility panels.
4. Run Urban Analytics final QA before starting Map Explorer.
5. Remove amber from Map Explorer central tokens before component-level migration.
6. Remove amber from Map Explorer shell, controls, layers, drawers, dialogs, default symbology, services, exports, and tests.
7. Run final map QA and close the two-part handoff.

## Current Architecture Facts

- `src/theme/GlobalSynapseStyles.ts` and `src/theme/synapse.ts` already expose VS Code-inspired primitive and semantic tokens from the historical baseline.
- Urban Analytics still contains large inline CSS blocks, embedded modal styling, generated HTML styles, and VoxCity controls with amber/gold literals.
- Map Explorer centralizes many styles in `src/centerpanel/components/map/mapTokens.ts`, but many components and services still consume `MAP_COLORS.amber*` or `#F59E0B` defaults.
- Both active scopes mix visual state with amber as neutral emphasis, active state, card border, button fill, link color, and default/demo visualization color.

## Phase Plan

| Phase | Prompts | Outcome |
| --- | --- | --- |
| Urban Analytics inventory | A01 | Exact modal amber map and migration order |
| Urban Analytics shell and controls | A02-A03 | Amber-free modal shell, welcome, rail, command bar, search, chips, bottom actions |
| Urban Analytics content and status | A04-A06 | Amber-free method catalog, indicators, dossier, generated HTML, evidence, data fitness, validity, workflow status |
| Urban Analytics 3D and utilities | A07-A08 | Amber-free VoxCity/simulation and Python utility panels |
| Urban Analytics QA and gate | A09-A10 | Final UA visual/scan QA and explicit gate to Map Explorer |
| Map Explorer inventory and token boundary | B01-B02 | Exact map amber map and non-amber central map tokens |
| Map Explorer shell and controls | B03-B05 | Amber-free shell, cockpit, canvas, toolbar, search, pins, layer management |
| Map Explorer high-risk surfaces | B06-B07 | Amber-free QA, NL query, review, report, import/export/service/dialog/tool surfaces |
| Map data defaults and final QA | B08-B10 | No amber default/demo/generated map colors, final visual QA, handoff |

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
| Map data palettes are confused with UI chrome | High | B08 separates default/demo/generated colors from documented analytical palettes. |
| Small agents over-edit | High | One prompt per agent, exact scopes, active ledger update, stop after prompt. |
| Premium restyle becomes decorative | Medium | Remove frames/fills/glow; prefer VS Code-like density, hairlines, neutral surfaces, and restrained blue-gray interaction. |

## Completion Criteria

- `A01`-`A10` and `B01`-`B10` statuses are completed or skipped with reason.
- Urban Analytics modal has no amber UI/default styling and no unnecessary card/button chrome.
- Map Explorer has no amber UI/default/demo/generated styling and no unnecessary card/button chrome.
- Retained color literals are documented as token-source, test-fixture, or data-palette/content exceptions.
- Ledger records exact files, validation, scans, risks, and screenshots/manual QA.
- Final handoff identifies no active blocker.
