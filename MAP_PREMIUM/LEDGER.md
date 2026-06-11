# LEDGER — MAP_PREMIUM prompt pack

Date started: 2026-06-11
Scope: Map Explorer / GIS modal premium redesign prompt ladder
Plan source: `mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md`
Detailed prompts: `01_DETAILED_PROMPTS.md` (single file, Prompt 01–10, each with ≥20 visible changes)
Trigger prompts: `02_TRIGGER_PROMPTS.md` (one short trigger per prompt)
Manifest: `prompts.json` (validated by `prompts.schema.json`)

This is the anti-amnesia ledger for the MAP_PREMIUM pack. It tracks prompt order, current state, and evidence without repeating the full plan.

## Current Pointer

```text
Next prompt: Prompt 05 — Canvas furniture and safe-inset cleanup
Trigger: 02_TRIGGER_PROMPTS.md → Trigger 05
```

## Resume Protocol

1. Read `AGENTS.md`, the plan file, this ledger, and the selected prompt in `01_DETAILED_PROMPTS.md` (or paste its trigger from `02_TRIGGER_PROMPTS.md`).
2. Confirm the pack is MAP_PREMIUM, not an archived prompt ladder.
3. Run the narrowest read-only checks needed to understand the current state.
4. Implement only the selected prompt.
5. Update this ledger in the same change with the exact evidence and outcome.
6. Do not mark a prompt complete unless the prompt-specific validation is actually done.
7. Keep each prompt focused on visible UI/UX change plus preserved behavior.

## Anti-Amnesia Checklist

Before implementation:
- Confirm the selected prompt number.
- Confirm the target files exist.
- Confirm no unrelated workspace change is being pulled into the prompt.
- Confirm the prompt’s validation set is understood before editing.

Before closeout:
- Confirm the changed files match the prompt scope.
- Confirm the validation commands ran or the blocker is recorded.
- Confirm the ledger entry includes the proof text.
- Confirm the next prompt pointer is updated.

## Status

Legend: `[x]` done · `[~]` in progress · `[ ]` TODO · `[!]` blocked

| Prompt | Title | Status | Evidence |
| --- | --- | --- | --- |
| 01 | Premium shell foundation and token system | `[~]` in progress | Shell tokens and premium shell frame added; typecheck passes; vitest blocked by missing `vitest/config` resolution in this environment |
| 02 | GeoLibre-like top menu bar | `[~]` in progress | Premium menu bar wired through existing toolbar command registry; `npm run typecheck` passes; prompt vitest command blocked by missing `vitest/config` resolution in this environment |
| 03 | Left Layers/Data workspace | `[~]` in progress | Shared dock frame, five-tab Layers/Data workspace, dense layer rows, bookmarks tab, contents/catalog fit pass, and left-panel contracts updated; `npm run typecheck` passes; prompt vitest command blocked by missing local `node_modules/vitest` / `vitest/config` resolution |
| 04 | Right premium Inspector dock | `[x]` done | Right dock now uses shared premium frame, Inspector/Style/QA/Workflow/Publish/Review/Diagnostics route model, semantic status chips, overflow routing, resize affordance, medium overlay placement, and designed route empty states; `npm run typecheck` and prompt vitest suite pass |
| 05 | Canvas furniture and safe-inset cleanup | `[ ]` TODO | not started |
| 06 | Compact status bar and output drawer | `[ ]` TODO | not started |
| 07 | Start, import, export, publish polish | `[ ]` TODO | not started |
| 08 | Advanced panels visual normalization | `[ ]` TODO | not started |
| 09 | Responsive behavior, accessibility, map-only mode | `[ ]` TODO | not started |
| 10 | Full regression, visual QA, ledger closeout | `[ ]` TODO | not started |

## Done Log

- Prompt 01 started: added premium shell aliases, responsive shell helpers, and premium shell frame styling in `src/centerpanel/components/map/`; `npm run typecheck` passes.
- Validation note: `npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx src/centerpanel/components/map/__tests__/mapVisualQA.test.ts src/centerpanel/components/map/__tests__/map-accessibility.test.ts src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx` is blocked in this environment because `vitest/config` cannot be resolved.
- Prompt 02 started: replaced the dominant grouped toolbar row with a premium menu bar backed by the existing `MapToolbar` command registry, added `MapPremiumMenuBar.tsx` and `mapMenuModel.tsx`, and slimmed the top command surface so the menu row becomes the first visual impression.
- Validation note: `npm run typecheck` passes after Prompt 02 changes. `npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts` is blocked in this environment because `vitest/config` cannot be resolved.
- Prompt 03 started: wrapped the left workspace in `MapDockPanelFrame`, replaced the Layers workspace tabs with `Layers | Contents | Catalog | Sources | Bookmarks`, tightened layer rows around type icons, geometry chips, visibility, opacity, overflow actions, source/CRS/QA chips, density, drag targets, file-drop and empty states, added a bookmarks/pins panel, and updated embedded Contents/Catalog styling plus left-panel width contracts.
- Validation note: `npm run typecheck` passes after Prompt 03 changes. `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx src/centerpanel/components/map/__tests__/MapContentsModel.test.ts src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts` is blocked before test execution because `vitest.config.ts` cannot resolve `vitest/config`; `vitest` is declared in `devDependencies`, but `node_modules/vitest` is absent in this workspace.
- Prompt 04 completed: converted the right dock host to the shared `MapDockPanelFrame` language, added the `style` route without deleting any existing route, grouped primary/contextual/review/diagnostics panels, added route status chips, pin/more/collapse/close actions, compact/rail tab behavior, routed Inspector/Style/Workflow/Publish bodies, semantic QA severity chips, right-dock resize, and medium-width overlay placement.
- Validation note: `npm run typecheck` passes after Prompt 04 changes. `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts src/centerpanel/components/map/__tests__/map-right-dock-migration.test.ts src/centerpanel/components/map/__tests__/MapStyleWorkspace.test.tsx src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts` passes: 5 files, 28 tests.

## Notes

- All 10 detailed prompts live in one file (`01_DETAILED_PROMPTS.md`); each requires at least 20 explicitly numbered visible UI/UX changes.
- Each prompt is triggered by pasting its short trigger from `02_TRIGGER_PROMPTS.md` into a fresh agent session.
- `prompts.json` is the machine-readable index (triggers, dependencies, validation commands); `prompts.schema.json` validates it.
- Keep later updates concise: state what changed, what proof ran, and what the next prompt is.
