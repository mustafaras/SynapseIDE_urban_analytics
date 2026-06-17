# Evidence - p03 (Badge cleanup: global de-roundification)

**Run:** 2026-06-15. **Both tracks complete.**

## Functional changes
1. Status-like round pills/dots were squared or converted to the p01 calm token language across the edited Map Explorer surfaces:
   - `processing/MapProcessingToolboxPanel.tsx`
   - `problems/MapProblemsPanel.tsx`
   - `table/MapAttributeTable.tsx`
   - `scene3d/ScenarioComparisonStrip.tsx`
   - `scene3d/Scene3DInteractionStrip.tsx`
   - `scene3d/SunShadowPanel.tsx`
   - `ui/GisProgressBar.tsx`
   - `ui/GisToolbar.tsx`
   - `review/MapReviewSidebar.tsx`
   - `MapRightDockHost.module.css`
   - `MapWorkspaceOverviewSummary.module.css`
   - `shell/MapPremiumShell.module.css`
   - `style/MapStyleWorkspace.tsx`
2. `src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts`
   - Literal round radius allowlist is empty.
   - Remaining `MAP_RADIUS.full` entries are documented non-status affordances only: cartographic circle/dot-density glyphs, map pin marker, collaboration presence dot, swipe drag handle, and the circle symbol swatch.
   - New round status badge usages fail the policy test.
3. Saturated green/red fills are not reintroduced. Status meaning continues to come from muted p01 token text and hairline borders.

## Remaining round-shape scan
Command:

```text
rg -n 'MAP_RADIUS\.full|borderRadius:\s*999|borderRadius:\s*9999|border-radius:\s*999|border-radius:\s*50%' src/centerpanel/components/map
```

Result: only the documented non-status `MAP_RADIUS.full` affordances remain. No literal `999`, `9999`, or `50%` round radius remains in map source outside test comments.

## Verification
| Check | Command | Result |
|---|---|---|
| Badge policy + token test | `npx vitest run src/centerpanel/components/map/__tests__/mapBadgePolicy.test.ts src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts` | PASS - 2 files, 23 tests |
| Typecheck | `npm run typecheck` | PASS |
| Lint errors | `npm run lint:errors` | PASS |
| Color guard | `npm run color:guard` | PASS - report mode exit 0 |
| No Tailwind in centerpanel | `pwsh -NoLogo -NoProfile -File scripts/check-no-tailwind-centerpanel.ps1` | PASS |
| Visual evidence spec | `npx playwright test e2e/p02-p03-badge-evidence.spec.ts --reporter=line` | PASS - 4 tests; temporary spec deleted after capture |
| Full map component suite | `npx vitest run src/centerpanel/components/map` | 832 / 833 PASS. The only failure is the pre-existing p00 baseline drift in `mapShellPrimitives.test.tsx` (`MAP_PRIMARY_ACTIVITY_ORDER` expects the old 4-item order). |
| Production build | `npm run build` | PASS |
| Pages build | `npm run build:pages` | PASS |
| Bundle budgets | `npm run perf:budgets` | PASS |

## Track B - visual proof
- `evidence/p03-problems-panel.png`
- `evidence/p03-review-timeline.png`
- `evidence/p03-attribute-table.png`
- `evidence/p03-style-workspace.png`
- `evidence/p03-scene-strip.png`

Visual inspection confirms there are no round red/green status dots on captured surfaces. Remaining round elements are non-status affordances, with purpose enforced by the policy test.

## Scientific correctness notes
- The QA condition screenshot is driven by a real `MapScientificQA` evaluation of a fixture layer with missing CRS metadata; it is labeled as a Playwright evidence fixture and not represented as real analytical output.
- No area or distance computation was introduced.
- Demo/runtime labels such as `demo-mode`, `Projected CRS: not used`, and `Unknown CRS` remain visible where applicable.

## Verdict
p03 is complete. Badge policy is enforced with an empty literal round-radius allowlist and only documented non-status `MAP_RADIUS.full` affordances remain.
