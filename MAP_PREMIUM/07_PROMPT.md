# Prompt 07 — Compact status bar and output drawer

## Goal
Turn the bottom area into a compact status bar plus an expandable output drawer, with the status row acting as a precise operational surface instead of a heavy panel.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 11
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx`
- `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `src/centerpanel/components/map/problems/MapProblemsPanel.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`

## Target files
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/controllers/MapStatusBarWithCursor.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`
- `src/centerpanel/components/map/bottom/MapBottomPanelBodies.tsx`
- `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `src/centerpanel/components/map/problems/MapProblemsPanel.tsx`
- `src/centerpanel/components/map/problems/mapProblemsModel.ts`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/shell/MapBottomOutputDrawer.tsx`

## Task
1. Reduce the status bar to compact, fixed-height operational chips and short readouts.
2. Route actionable chips into the right dock or the bottom drawer.
3. Put attributes, timeline, problems, logs, evidence, review, and reports into the drawer model.
4. Preserve selected-layer and selected-feature semantics.
5. Keep the drawer responsive so it does not steal map space by default.

## Hard constraints
- Do not hide attribute table, timeline, problems, or diagnostics behind dead ends.
- Do not break status-chip routing, cursor updates, or reduced-motion behavior.
- Do not reintroduce a persistent bottom workspace panel.
- Do not let the drawer become the default visible chrome.

## Required visible changes
- The bottom edge should feel light and precise.
- The output drawer should be available on demand, not constantly open.
- The status bar should look like a premium operational strip, not a dense panel.

## Validation
- Run `typecheck`.
- Run status-bar and bottom-panel tests.
- Run any route tests that prove the chips open the right destination.
- Record the proof in the ledger.

## Output
- Updated status and drawer files
- Ledger entry describing the compact bar and drawer behavior
