# p13 Track A — Left-dock single-column conversion

## Scope
- Converted embedded Data/Catalog workspace body to a single-column flow in `MapCatalogPanel`.
- Added an explicit summary band above full-width workspace content for embedded presentation.
- Added contract and responsive-fit assertions to lock the single-column layout markers/CSS.

## Files changed
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.module.css`
- `src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts`
- `src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts`

## Verification
- `npx vitest run src/centerpanel/components/map/__tests__/map-left-panel-contracts.test.ts` → PASS (18 tests)
- `npx vitest run src/centerpanel/components/map/__tests__/map-left-panel-responsive-fit.test.ts` → PASS (11 tests)
- `npx vitest run src/centerpanel/components/map` → PASS (95 files, 908 tests)
- `npm run typecheck` → PASS
- `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` → PASS

## Result
- Left-dock embedded Data/Catalog flow is now single-column with compact top summary and full-width content body.
- Responsive contract coverage now explicitly asserts embedded single-column structure.