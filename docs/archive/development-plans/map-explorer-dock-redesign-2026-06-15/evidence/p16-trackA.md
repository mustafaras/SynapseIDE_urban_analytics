# p16 Track A — Status Overflow Correctness Fix

Status: done

## Scope
- Reworked status-bar overflow partitioning to use measured segment widths and measured More-trigger width.
- Ensured partition output is exhaustive and disjoint (no dropped or duplicated segments).
- Kept overflow trigger accounting conditional on overflow existence.
- Verified overflow popover renders the same segment bodies for all overflow items.

## Code changes
- Updated `src/centerpanel/components/map/MapStatusBar.tsx`:
  - Added measured segment width map + measured overflow trigger width handling.
  - Added robust `partitionStatusSegments(...)` path using measured widths and stable ranking.
  - Preserved `data-map-status-overflow*` hooks used by tests.
- Added `src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.tsx`:
  - Asserts exhaustive+disjoint partition across multiple widths.
  - Asserts overflow menu item count matches overflow segment count.
  - Asserts More-trigger visibility is consistent with overflow count.
  - Asserts QA segment remains accessible under tight widths (inline or overflow).

## Verification
- `npx vitest run src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.tsx` -> PASS (4/4)
- `npx vitest run src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` -> PASS (4/4)
- `npm run typecheck` -> PASS

## Result
- Overflow partition now behaves correctly under width changes and label variance.
- More popover shows the full overflow set without missing/duplicated items.
- Track A done criteria satisfied.
