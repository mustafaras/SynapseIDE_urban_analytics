# Evidence - p02 (Badge cleanup: right dock and dock frame)

**Run:** 2026-06-15. **Both tracks complete.**

## Functional changes
1. `src/centerpanel/components/map/MapRightDockHost.tsx`
   - Removed the tier-derived `TIER_STATUS`, `PANEL_STATUS`, and `getRouteStatus` path that stamped every panel with a decorative status chip.
   - Added optional `panelStatus?: MapRightDockPanelStatus | null`.
   - The frame action slot now renders `GisStatusChip` only when `panelStatus` is provided.
   - Pin, collapse, close, and overflow controls are unchanged.
2. `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx`
   - Threads a real condition into the right dock only for `problems`, `qa`, and `scientificQA`.
   - The condition is based on live `scientificQA` issue counts: blocker/error counts render `blocked`; non-blocking issues render `caveat`.
   - No primary panel receives a fabricated "ready" or "Primary" chip.
3. `src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx`
   - Added coverage for quiet primary panels.
   - Added coverage for exactly one chip when a real panel condition is supplied.

## Verification
| Check | Command | Result |
|---|---|---|
| Right dock host/routes | `npx vitest run src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx src/centerpanel/components/map/__tests__/mapRightDockRoutes.test.ts` | PASS - 2 files, 13 tests |
| Typecheck | `npm run typecheck` | PASS |
| Lint errors | `npm run lint:errors` | PASS |
| No Tailwind in centerpanel | `pwsh -NoLogo -NoProfile -File scripts/check-no-tailwind-centerpanel.ps1` | PASS |
| Visual evidence spec | `npx playwright test e2e/p02-p03-badge-evidence.spec.ts --reporter=line` | PASS - 4 tests; temporary spec deleted after capture |
| Full map component suite | `npx vitest run src/centerpanel/components/map` | 832 / 833 PASS. The only failure is the pre-existing p00 baseline drift in `mapShellPrimitives.test.tsx` (`MAP_PRIMARY_ACTIVITY_ORDER` expects the old 4-item order). |

## Track B - visual proof
- `evidence/p02-right-dock-clean.png`: Inspector/right dock primary panel. Header has title, pin, overflow, close controls, and no status chip.
- `evidence/p02-right-dock-condition.png`: Problems panel with real QA issues. Header has exactly one calm `3 QA issues` chip.

## Verdict
p02 is complete. Right dock headers are quiet by default and status chips now require a real live condition.
