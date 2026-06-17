# p17 Track A — Status Bar Premium VS Code Interactions

Status: done

## Scope
- Upgraded `MapStatusBar` interaction affordance model to align with premium VS Code status-bar behavior.
- Preserved p16 overflow correctness while adding explicit interaction honesty and grouping markers.
- Expanded route tests to cover keyboard operation and inert-vs-interactive signaling.

## Code changes
- Updated `src/centerpanel/components/map/MapStatusBar.tsx`:
  - Added explicit left/right cluster render split for status segments (`data-map-status-cluster="left|right"`) and divider.
  - Added interactive state tracking for actionable segments (hover/focus active treatment).
  - Added honest interactivity markers on both inline and overflow entries: `data-map-status-interactive="true|false"`.
  - Added side markers for traceability: `data-map-status-side="left|right"`.
  - Kept `data-map-status-overflow*` hooks and existing routing handlers intact.
- Updated `src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx`:
  - Added assertions for premium grouping markers and honest interactivity markers.
  - Added keyboard-operability coverage for interactive segments.

## Verification
- `npm exec vitest run src/centerpanel/components/map/__tests__/mapStatusBarOverflow.test.tsx src/centerpanel/components/map/__tests__/MapStatusBarRoutes.test.tsx` -> PASS (10/10)
- `npm run typecheck` -> PASS
- `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` -> PASS
- `npm run test:e2e:a11y` -> PARTIAL (5 passed / 1 failed)
  - Existing failure remains in `e2e/accessibility-audit.spec.ts` Prompt 55 keyboard path expecting focus on `map-inspector-host`.
  - This failure is outside the status-bar overflow/interaction routing surface touched by p16/p17.

## Result
- Status-bar interactions now present premium actionable/inert affordances and clear grouping with preserved overflow correctness.
- Targeted p16/p17 tests and typecheck are green.
- a11y suite executed with one pre-existing failing scenario recorded above.
