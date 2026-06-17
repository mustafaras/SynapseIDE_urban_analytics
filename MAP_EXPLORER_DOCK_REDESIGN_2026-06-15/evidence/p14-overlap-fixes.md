# p14 Follow-up — Dock Motion, Resize, and Catalog Overlap Hardening

Date: 2026-06-17
Status: done

## Scope

Targeted fixes were applied only to the components directly related to the reported issues:

- Panel movement barriers (first two panels)
- Missing panel resizing in floating mode
- Add Data tab-family overlap and broken scroll behavior

## Code Changes

### Plugin Registry panel

File:
- src/centerpanel/components/map/plugins/MapPluginPanel.tsx

What changed:
- Enabled drag behavior for floating presentation.
- Enabled resize behavior for floating presentation.
- Kept embedded behavior unchanged.

### Layout Designer panel

File:
- src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx

What changed:
- Added resize support for floating presentation.
- Preserved existing embedded mode behavior.

### Add Data tab-family visual/scroll hardening

File:
- src/centerpanel/components/map/catalog/MapCatalogPanel.module.css

What changed:
- Hardened embedded layout wrappers to prevent text collision in narrow widths.
- Improved overflow and scroll-container boundaries to keep tabs scrollable and readable.
- Added/adjusted wrapping constraints to prevent label/content overlap.

## Regression Tests Updated

Files:
- src/centerpanel/components/map/__tests__/MapPluginPanel.test.tsx
- src/centerpanel/components/map/__tests__/MapLayoutDesignerPanel.test.tsx
- src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts

What changed:
- Added assertions for drag/resize support in affected floating panels.
- Added CSS contract assertions for catalog overlap/scroll safety.

## Validation Results

1) Focused tests:
- npx vitest run src/centerpanel/components/map/__tests__/MapPluginPanel.test.tsx src/centerpanel/components/map/__tests__/MapLayoutDesignerPanel.test.tsx src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx
- Result: 4 files passed, 24 tests passed.

2) Type check:
- npm run typecheck
- Result: PASS.

3) Full map component suite:
- npx vitest run src/centerpanel/components/map
- Result: 96 files passed, 916 tests passed.
