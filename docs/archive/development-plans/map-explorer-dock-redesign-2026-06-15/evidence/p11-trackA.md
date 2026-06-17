# p11 Track A — Right-panel single-column conversion

Status: done

## Scope delivered
- Converted right-dock style editor control grids from two-column to single-column in `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx`.
- Converted cartography before/after preview layout to stacked single-column in `src/centerpanel/components/map/CartographyRecommendationList.tsx`.
- Converted AOI analysis key/value rows to the sanctioned dense primitive (`GisPropertyGrid`) in `src/centerpanel/components/map/controllers/MapRightDockBodyContent.tsx`.
- Added explicit single-column markers for converted right-dock bodies:
  - `map-right-dock-style-body` → `data-right-dock-layout="single-column"`
  - `map-right-dock-publish-body` → `data-right-dock-layout="single-column"`
  - `map-right-dock-selection-body` now stays in one vertical flow (selection tools + stacked detail sections).
- Converted timeline filter strip to single-column for narrow right-dock readability in `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`.

## Tests and validation
- `npx vitest run src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts src/centerpanel/components/map/__tests__/map-right-dock-single-column-layout.test.ts` ✅
- `npx vitest run src/centerpanel/components/map` ✅
  - 95 files passed, 904 tests passed.
- `npm run typecheck` ✅
- `npm run lint:no-tailwind-centerpanel` ✅

## Regression guard added
- New contract test: `src/centerpanel/components/map/__tests__/map-right-dock-single-column-layout.test.ts`
  - Enforces single-column style editor grid contract.
  - Enforces single-column cartography preview contract.
  - Enforces right-dock single-column markers + AOI property-grid usage.