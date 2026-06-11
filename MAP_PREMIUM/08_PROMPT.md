# Prompt 08 — Polish start/import/publish workflows

## Goal
Make first-run, import, export, and publish surfaces feel like the same premium GIS product as the main shell.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 7, 12, 15, 16
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/MapStartDialog.tsx`
- `src/centerpanel/components/map/MapImportPreviewDialog.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/centerpanel/components/map/publish/MapPublishWorkspace.tsx`
- `src/centerpanel/components/map/publish/MapPublishOutputInventory.tsx`
- `src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx`
- `src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx`

## Task
1. Align the start dialog, import preview, export inventory, report handoff, layout designer, and publish workspace to the same visual system.
2. Keep the shell calm and premium even in first-run and output workflows.
3. Preserve CRS warnings, import preflight, publication readiness, output inventory, and report handoff truthfulness.
4. Make the user see clear steps, clear blockers, and clear next actions.

## Hard constraints
- Do not change import/export/publish service logic.
- Do not weaken CRS or QA warning truthfulness.
- Do not hide blocking reasons.
- Do not introduce decorative filler or marketing-style layout.

## Required visible changes
- First-run and publishing should feel like part of one cohesive desktop GIS app.
- Any blockers should be visible, named, and actionable.
- The dialogs should stay compact and readable.

## Validation
- Run `typecheck`.
- Run dialog, import-preflight, publish, and report-handoff tests.
- Update only selectors or expectations that genuinely changed because of the visual language.
- Record proof in the ledger.

## Output
- Updated workflow dialogs/panels
- Ledger entry with preserved output behavior and visible polish
