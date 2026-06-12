# Prompt 04 — Redesign left Layers/Data panel

## Goal
Turn the left side into a clean GIS layers/data workspace with clear tabs, readable rows, and a predictable hierarchy.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 8
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/map/mapLeftPanelContracts.ts`

## Target files
- `src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.module.css`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.module.css`
- `src/centerpanel/components/map/mapLeftPanelContracts.ts`
- `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx`

## Tabs
Layers, Contents, Catalog, Sources, Bookmarks.

## Task
1. Give the left rail a unified panel frame.
2. Keep layer rows compact and scannable.
3. Move advanced actions into row overflow menus.
4. Keep contents and catalog visually distinct from the layer list.
5. Preserve drag/reorder, visibility, opacity, identify, schema, CRS, source health, and QA behavior.
6. Add clear empty and drag-drop states that tell the user what to do next.
7. Respect the existing width contracts and responsive fit rules.

## Hard constraints
- Do not break layer visibility, reorder, or opacity behavior.
- Do not mutate catalog insertion or contents-tree semantics.
- Do not widen the panel in a way that breaks the width contracts.
- Do not collapse the panel into a debug cockpit.

## Required visible changes
- The left side must look like a premium GIS layer/data workspace.
- The user must be able to scan layers quickly.
- The user must be able to tell what belongs to Layers vs Contents vs Catalog.

## Validation
- Run `typecheck`.
- Run layer-management, catalog, contents, sidebar, and left-panel contract tests.
- Run the responsive-fit test if the edit touches widths or containers.
- Record proof in the ledger.

## Output
- Updated left-panel components and styles
- Ledger entry with visible result and preserved behaviors
