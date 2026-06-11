# Prompt 03 — Introduce the GeoLibre-like top menu bar

## Goal
Replace the dense always-visible toolbar impression with a calm, discoverable, menu-driven command surface.

## Read first
- `AGENTS.md`
- `MAP_PREMIUM/mapexplorer_geolibre_premium_ui_ux_plan_full_audited.md` section 7
- `MAP_PREMIUM/LEDGER.md`
- `src/centerpanel/components/map/MapTopCommandSurface.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/useMapPanelCommands.ts`
- `src/centerpanel/components/map/controllers/useMapCommandHandlers.ts`

## Target files
- `src/centerpanel/components/map/MapTopCommandSurface.tsx`
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/useMapPanelCommands.ts`
- `src/centerpanel/components/map/controllers/useMapCommandHandlers.ts`
- `src/centerpanel/components/map/shell/MapPremiumMenuBar.tsx`
- `src/centerpanel/components/map/shell/mapMenuModel.tsx`

## Menu groups
Project, Add Data, Layers, Style, Analyze, Scene, Publish, Review, Controls, Plugins, View, Help.

## Task
1. Model the command surface as a menu system, not a dense button strip.
2. Reuse existing handlers and store actions only; do not invent duplicate business logic.
3. Preserve command palette reachability and existing keyboard entry points.
4. Keep 4–6 high-frequency quick actions visible, but make the top row visually calm.
5. Ensure destructive or risky actions stay behind menus or confirmations.

## Hard constraints
- Every menu item must call an existing handler, route, store action, or component prop.
- No new business logic in menu components.
- Keep legacy toolbar behavior available internally, but reduce visual dominance.
- Do not lose accessibility: keyboard and Escape behavior must remain predictable.

## Required visible changes
- The first row should read as a premium GIS application.
- Commands should be grouped by intent rather than exposed as a flat overload of buttons.
- The toolbar should stop competing with the map for attention.

## Validation
- Run `typecheck`.
- Run toolbar and command-palette tests.
- Run any narrow keyboard/accessibility regression that covers the new menu surface.
- Record results in the ledger.

## Output
- Updated menu model and command-surface files
- Ledger entry that names the live commands preserved and the visible change delivered
