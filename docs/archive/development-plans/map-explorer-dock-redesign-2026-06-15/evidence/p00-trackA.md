# Evidence — p00 Track A (Discovery, test & invariant inventory)

**Run:** 2026-06-15 · **Code changed:** none (read-only phase)

## 1. Guard-spec inventory (all present)
| Spec | Present |
|---|---|
| `__tests__/map-drawing-tools.test.ts` | yes |
| `__tests__/map-docking.test.ts` | yes |
| `__tests__/MapRightDockHost.test.tsx` | yes |
| `__tests__/map-right-dock-migration.test.ts` | yes |
| `__tests__/mapRightDockRoutes.test.ts` | yes |
| `__tests__/MapModelBuilderPanel.test.tsx` | yes |
| `__tests__/MapStatusBarRoutes.test.tsx` | yes |
| `__tests__/mapTokenStatus.test.ts` | yes |

## 2. Gate results
| Gate | Command | Result |
|---|---|---|
| No-Tailwind | `pwsh -File scripts/check-no-tailwind-centerpanel.ps1` | **PASS** (exit 0) — "No Tailwind-like utility classes found in src/centerpanel." |
| Typecheck | `npm run typecheck` (`tsc -p tsconfig.json --noEmit`) | **PASS** (exit 0) |
| Map test suite | `npx vitest run src/centerpanel/components/map` | **825 / 826 tests pass**, 90 / 91 files. **1 pre-existing failure** (see §4). |

## 3. ENVIRONMENT QUIRK (important for every later phase)
`npm run lint:no-tailwind-centerpanel` (and any npm script that calls `powershell -File ...`) FAILS in this environment with `'powershell' is not recognized` — only PowerShell 7 (`pwsh`) is installed, not Windows PowerShell (`powershell.exe`). **Workaround:** run the script directly: `pwsh -ExecutionPolicy Bypass -File scripts/check-no-tailwind-centerpanel.ps1`. Use this in every phase that runs the no-Tailwind gate.

## 4. Pre-existing baseline failure (NOT caused by this pack)
- `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx > "keeps the stable GIS workflow order"`.
- Cause: the working tree's `navigation/mapNavigationModel.ts` defines `MAP_PRIMARY_ACTIVITY_ORDER = [overview, data, layers, style, analyze, scene, publish]` (7), but this spec still asserts the old `[overview, data, layers, scene]` (4). Drift from the uncommitted in-flight changes listed in git status (`mapNavigationModel.ts` is modified).
- Disposition: out of p00 scope (read-only; must not touch `__tests__`). **Recommended fix owner: p04** (dock/nav state work) or a quick standalone test update before p03/p11/p13/p14/p18/p19, which use `npx vitest run src/centerpanel/components/map` as a regression check and will otherwise see this 1 red. Until fixed, treat exactly this single failure as the known baseline; any OTHER failure in those phases is a real regression.

## 5. Round-badge offender inventory (CORRECTION to the plan)
Exact-literal scan (`borderRadius: 999/9999/"50%"`) found only **1** file. The broader scan (including the `MAP_RADIUS.full` token) found **11 files** — i.e. most round badges come from the **`MAP_RADIUS.full` token**, not inline literals.

**ACTION for p01:** the `mapBadgePolicy.test.ts` scan MUST match `MAP_RADIUS.full` (and `MAP_RADIUS.pill`/`MAP_RADIUS.round` if present) in addition to literal `999`/`9999`/`50%`. A literals-only test would miss 10 of 11 offenders.

Confirmed offenders (with anchors) for p03:
| File | Line(s) | Form |
|---|---|---|
| `MapReviewTimelinePanel.tsx` | 897 | `MAP_RADIUS.full` |
| `MapSwipeCompareOverlay.tsx` | 82 | `MAP_RADIUS.full` |
| `processing/MapProcessingToolboxPanel.tsx` | 318 | `MAP_RADIUS.full` |
| `problems/MapProblemsPanel.tsx` | 190, 207 | literal `999` |
| `style/MapStyleWorkspace.tsx` | 266, 271 | `MAP_RADIUS.full` |
| `review/MapReviewSidebar.tsx` | 130 | `MAP_RADIUS.full` |
| `table/MapAttributeTable.tsx` | 263, 403 | `MAP_RADIUS.full` |
| `scene3d/ScenarioComparisonStrip.tsx` | 93 | `MAP_RADIUS.full` |
| `scene3d/Scene3DInteractionStrip.tsx` | 71 | `MAP_RADIUS.full` |
| `scene3d/SunShadowPanel.tsx` | 160, 460 | `MAP_RADIUS.full` |
| `ui/GisProgressBar.tsx` | 47, 57 | `MAP_RADIUS.full` |

Note: several `MAP_RADIUS.full` uses are legitimate affordances (progress-bar caps in `GisProgressBar`, presence dots) — p03 must distinguish STATUS shapes (de-round) from true affordances (keep, document exemption), per the p03 prompt.

## 6. Track B — baseline screenshots (captured via temporary Playwright spec, now deleted)
Saved to `baseline/`: `draw-modal.png`, `right-dock.png`, `models-tab.png`, `status-bar-more.png`, `badges.png`. All inspected (not blank). Capture method: temp spec `e2e/p00-baseline-capture.spec.ts` using the reference helpers (`openUrbanAnalyticsWorkbench`, `resetWorkbenchState`, `triggerDomClick`, `waitForMapExplorerDialog`); spec deleted at closeout per the screenshot skill.

### Reproduced defects (strong evidence for later phases)
- **DRAW BUG REPRODUCED (p05/p04):** `P00_DRAW_DIRECT_TOOLBAR_PRESENT=false` — there is no direct `map-toolbar-command-drawings` topbar button. After dispatching the "drawings" command through the command palette (`dispatched=true`), `P00_DRAW_OPENED_VIA_COMMAND=false` — **the Drawing tools modal does not open even when the command fires.** This is the user's "Draw doesn't open" bug, captured automatically. Root cause is almost certainly the dual source of truth (`handleToggleDrawPanel` flips legacy `showDrawPanel` but the render gate / `workspaceView` / route disagree) → fix in p04 then p05. `baseline/draw-modal.png` shows the app with NO modal = the broken state.
- **MODELS TAB (p14/p15 + p02/p03):** `baseline/models-tab.png` shows the cramped two-column builder with **overlapping, unreadable text** (the green "All steps ready" pill overlaps "Add at least one processing step") plus round/colored badges ("Blocked" red, "0 steps" blue, "Needs input" red, "0 selected" red). Exactly the reported problem.
- **RIGHT DOCK (p09/p11 + p02/p03):** `baseline/right-dock.png` (Performance panel) is a docked rail (not floating) with a **three-column grid** body and round green **"Full render" / "Full" pills**. Confirms p09 (make floating), p11 (single-column), p02/p03 (de-round).
- **STATUS BAR (p16/p17):** at 900px, `P00_STATUS_OVERFLOW_COUNT=12` — 12 segments overflow; `baseline/status-bar-more.png` shows the "More" affordance present but the popover does not visibly surface the 12 hidden items. Confirms the reported overflow defect.

### Additional finding (reachability)
Neither `map-toolbar-command-drawings` nor `map-toolbar-command-performance-diagnostics` is present as a direct topbar testid in the current tree; both are only reachable via the command-center overflow / Ctrl+K palette. p05/p10 should restore predictable one-click topbar affordances.

## 7. Verdict
Baseline established and 5 before-shots captured + inspected. Tree is green except the single documented pre-existing `mapShellPrimitives` failure. Plan corrected re: `MAP_RADIUS.full`. The Draw-open bug and the Models/right-dock/status defects are reproduced and evidenced. Ready for p01.
