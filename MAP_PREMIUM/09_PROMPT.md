# Prompt 09 — Normalize advanced panels

## Goal
Apply the same premium panel language to advanced tools so they feel like part of one product while keeping every algorithm, service, and route intact.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 8 and 16
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx`
- `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx`
- `src/centerpanel/components/map/processing/ToolParameterForm.tsx`
- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`
- `src/centerpanel/components/map/plugins/MapPluginPanel.tsx`
- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/scene3d/Scene3DPanel.tsx`
- `src/centerpanel/components/map/raster/RasterLayerPanel.tsx`
- `src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx`

## Task
1. Reuse shared panel primitives and section hierarchy across all advanced panels.
2. Reduce decorative density and replace ad hoc chrome with consistent frame/body/action patterns.
3. Keep tool execution, model building, plugin discovery, analysis, 3D, raster, zoning, and workflow behavior unchanged.
4. Ensure advanced capabilities remain discoverable from the menu/dock system.

## Hard constraints
- Do not change processing/model/plugin/service behavior.
- Do not hide any advanced route without another path to reach it.
- Do not introduce a new visual system only for one panel.
- Do not remove warning, blocked, or caveat states.

## Required visible changes
- Every advanced panel should feel like the same application family.
- Panels should be clearer, denser, and less noisy.
- Empty states, forms, tabs, and chips should match the rest of the shell.

## Validation
- Run `typecheck`.
- Run the targeted advanced-panel tests for the surfaces you touched.
- Run any route or visual QA checks needed to prove consistency.
- Record the proof in the ledger.

## Output
- Updated advanced-panel UI files
- Ledger entry with what was normalized and what remained unchanged
