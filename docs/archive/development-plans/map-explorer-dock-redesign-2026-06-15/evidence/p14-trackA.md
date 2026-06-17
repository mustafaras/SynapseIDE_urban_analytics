# p14 Track A — Models Tab Single-Column Recompose

**Date:** 2026-06-17  
**Status:** done

## Summary

Recomposed `MapModelBuilderPanel` from a cramped multi-column layout into a single vertical top-to-bottom flow readable in the narrow left dock (~300–440 px).

## Changes

### `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`
- `data-left-workspace-layout` is now unconditionally `"single-column"` (removed the `presentation === "embedded" ? "single-column" : "split"` conditional).
- Added `<GisSectionHeader title="Define" …/>` to the definition bar section.
- Added `<GisSectionHeader title="Steps" …/>` with step-count badge to the add-step section.
- Removed the `<div className={styles.inputGrid}>` wrapper around primary/overlay source selects — both fields are now direct children of the definition bar (full-width, stacked vertically).

### `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css`
- `.body`: changed `grid-template-columns` from `minmax(0, 1fr) 20rem` → `minmax(0, 1fr)` (1 column).
- `.workflowGrid`: changed `grid-template-columns` from the 2-col `minmax(15rem, 0.85fr) minmax(17rem, 1.15fr)` → `minmax(0, 1fr)` (step graph and step editor now stack vertically).
- `.configuration` / `.runRail`: split the combined rule; `.runRail` is now `display: contents` so it is a transparent wrapper (all run/preview/batch/output sections participate directly in the `configuration` grid).
- `.inputGrid`: removed (no longer used).
- `.addStepRow`: changed from 2-col `(field | button)` → single-column vertical stack.
- `.parameters`: kept single-column override (was previously under `.panelEmbedded`).
- Removed all `.panelEmbedded .body`, `.panelEmbedded .workflowGrid`, `.panelEmbedded .runRail`, `.panelEmbedded .inputGrid / .parameters / .addStepRow` scoped overrides — global defaults are now correct for all presentations.

### `src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts`
- Updated "embedded models panel layout" test: now asserts `.workflowGrid` is globally single-column and `.panelEmbedded .workflowGrid` override is absent.

### `src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts`
- Updated models builder contract test: asserts `data-left-workspace-layout="single-column"` (unconditional) and that the old conditional attribute is gone.

## Section order (DOM, top-to-bottom)
1. **Define** — model name, primary source, overlay source (`data-testid="model-section-define"`)
2. **Steps** — add processing step selector + Add button (`data-testid="model-section-steps"`)
3. **Workflow graph** — step list + step editor (`data-testid="model-section-workflow"`)
4. **Run preview** — inputs/chain/output/blockers + run actions (`data-model-flow-section="run-preview"`)
5. **Batch targets** — layer checkboxes + Run batch (`data-model-flow-section="batch-targets"`)
6. **Output & evidence** — result grid + Export button (`data-model-flow-section="output-evidence"`)

## Readiness status
- "Blocked" / "Needs input" / "All steps ready" pills use `GisStatusChip` with `status="blocked"` / `status="ready"` — calm styling (no saturated fills, no rounds; inherits p01 token policy).

## Gates

| Gate | Result |
|---|---|
| `npx vitest run …MapModelBuilderPanel.test.tsx` | 3/3 pass |
| `npx vitest run src/centerpanel/components/map` | **913/913** pass (96 files) |
| `npm run typecheck` | PASS |
| `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` | PASS |
