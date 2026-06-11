# Prompt 05 — Redesign right dock as premium Inspector

## Goal
Convert the right side into one coherent Inspector / Style / QA / Workflow / Publish / Review / Diagnostics system.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 9
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/MapRightDockHost.tsx`
- `src/centerpanel/components/map/MapRightDockHost.module.css`
- `src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx`
- `src/centerpanel/components/map/mapRightDockRoutes.ts`
- `src/centerpanel/components/map/controllers/useMapRightDockRouting.ts`
- `src/centerpanel/components/map/inspector/MapInspectorHost.tsx`
- `src/centerpanel/components/map/inspector/LayerInspector.tsx`
- `src/centerpanel/components/map/style/MapStyleWorkspace.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`

## Task
1. Apply a single premium panel language to the right dock.
2. Preserve route definitions and migrated tab destinations.
3. Add a calm header with route title, state badge, and close/collapse actions.
4. Use compact tabs or a vertical rail depending on width.
5. Keep QA, workflow, publish, review, and diagnostics reachable without clutter.
6. Make the dock visually cohesive across routes.

## Hard constraints
- Do not remove route definitions.
- Do not remove migrated right-dock destinations.
- Do not break announcements, focus return, or close/switch behavior.
- Do not hide diagnostics or QA behind ambiguous labels.

## Required visible changes
- The right dock should read as one product family, not separate tool panes.
- Advanced panels should remain accessible but not visually noisy.
- The panel body should use predictable padding, scroll, and tab behavior.

## Validation
- Run `typecheck`.
- Run right-dock route, host, migration, style-workspace, and QA panel tests.
- If selectors changed, update only the minimum needed tests.
- Record the proof in the ledger.

## Output
- Updated right dock shell and related route/panel files
- Ledger entry with preserved routing and visible improvement
