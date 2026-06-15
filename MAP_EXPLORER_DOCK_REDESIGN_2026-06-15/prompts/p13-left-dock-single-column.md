# p13 — Left-Dock Workspace Single-Column Conversion

> **SESSION BOOTSTRAP:** Read `../ANTI_AMNESIA.md` → `../LEDGER.md` → `../STATE.json`, then this file.

**Phase:** p13 · **Depends on:** p01 · **Tracks:** A (content reflow) + B (Data/Add Data shots)

## Mission
Convert the cramped two-column layouts inside the LEFT-dock workspaces (especially Data → Add Data with its stat-grid + detail split) into single-column, fluid premium flows.

## Why (problem #5)
The owner flagged the Add Data view (second screenshot) as a confusing dual-column. The left dock is where Data/Layers/Analyze/Style/Scene/Publish workspaces live; the dense stat-grid + side panel reads as two crammed columns.

## Context primer (self-contained)
- Left dock = activity rail + workspace host. `controllers/MapExplorerLayerPanelRail.tsx` switches on `activeActivityId` and renders a workspace into a resizable `MapPanelRail` (width 300–640, `mapDocking.ts`).
- The non-(analyze/style/scene/publish) activities (Overview, Data, Layers, Extensions) render through `sidebar/MapWorkbenchSidebar.tsx` with `summaryItems` (the stat grid) + tab body.
- The Data activity's tabs (Add Data, Catalog, Connections, Source Health) are defined in `navigation/mapNavigationModel.ts` and rendered via the workbench sidebar + tab content (`catalog/MapCatalogPanel.tsx` and Add-Data content).
- Two-column offenders: the stat grid (`REGISTERED/LIVE`, `RECOVERABLE`, ...) beside a detail panel; scan workspace CSS for `1fr 1fr`/multi-column grids.

## Files
- `edit` — `src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx` (+ its `.module.css`) — summary stat grid + body layout.
- `edit` — `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx` (+ `.module.css`) — Add Data / catalog content if two-column.
- `reference` — `src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx` — how workspaces mount.
- `reference` — `src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx`, `style/MapStyleWorkspace.tsx`, `publish/MapPublishWorkspace.tsx` — if they use two-column sections, convert too (Models handled in p14/p15).
- `edit` — `src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts` / `map-left-panel-responsive-fit.test.ts` — assert single-column + responsive fit.

## Do NOT touch / reuse
- Use `GisPropertyGrid` for label/value density; the summary stat grid can stay a compact wrap row but must not become a competing column against a side panel.
- Reuse p01 tokens; no rounds.
- No Tailwind.

## Track A — Functional
### Steps
1. Enumerate left-workspace two-column layouts (start with Data → Add Data). Restructure each workspace body into a single vertical column: summary row (compact, wrapping) on top, then the active tab's content full-width below.
2. Convert any "stat grid beside detail" into: stat summary as a thin top band, detail content single-column beneath.
3. Ensure the existing responsive fit tests still pass (`map-left-panel-responsive-fit.test.ts`) and the panel reads well at min width (300px) and wide (640px).
4. Layout-only — keep all data/handlers/import flows.
5. Extend the contract test to assert single-column body structure.

### Verify
- `npx vitest run src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts`
- `npx vitest run src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts`
- `npx vitest run src/centerpanel/components/map`
- `npm run typecheck`
- `npm run lint:no-tailwind-centerpanel`
- Save summary → `evidence/p13-trackA.md`.

### Done criteria
- Left workspaces flow single-column; no stat-grid-vs-detail two-column split; responsive fit intact. Tests green; lint + typecheck clean.

## Track B — Visual
### Steps
1. Screenshot Data → Add Data (single-column), Catalog, and one other workspace at min and wide widths. Save `evidence/p13-add-data.png`, `evidence/p13-catalog.png`, etc. Compare to the owner's second screenshot / `baseline/`.

### Verify
- `screenshot-map-explorer` produced the shots.

### Done criteria
- Visual proves single-column, legible left workspaces.

## Anti-amnesia exit checklist
- LEDGER: p13 A+B → `done`, phase closed; session-log lists workspaces converted.
- STATE: `phases[p13]` trackA/trackB `done` + evidence.
- Next action → `prompts/p14-models-recompose.md`.

## Guardrails
- Single-column workspaces; `GisPropertyGrid` for density. No Tailwind. No `localStorage`. Reuse p01 tokens.
- Layout-only — preserve import/data flows.
- Both tracks verified before closing.
