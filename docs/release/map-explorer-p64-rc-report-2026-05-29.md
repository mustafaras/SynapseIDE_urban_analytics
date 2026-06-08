# Map Explorer Prompt 64 Release Candidate Report

Superseded for current release-candidate claims by [`map-explorer-p64-rc-report-2026-05-30.md`](map-explorer-p64-rc-report-2026-05-30.md). This file is retained as historical May 29 gate evidence.

Date: May 29, 2026
Branch: `gis/p64-rc`
Base commit: `8562cd8` (`feat(map): add command palette keyboard system`)
Gate result: **NO-GO / RC blocked**

## Decision

Map Explorer is not certified as a release candidate from this checkpoint. The Prompt 64 gate was executed and the blockers are documented with concrete limits, satisfying the gate-recording requirement without claiming production readiness.

The blocking reasons are:

- `npm run validate:rc` failed at `npm run perf:budgets` after typecheck, lint, full Vitest, and production build had completed.
- The focused P40 visual QA run has two current failures: missing `map-activity-rail` test hook/rail contract and a blank-canvas detector threshold failure.
- `npm run test:e2e:ci` did not run inside `validate:rc` because the aggregate command stopped at the bundle-budget failure.
- Prompt 63 documentation close-out was incomplete at this checkpoint, and the source support matrix was stale relative to later shipped raster, streaming, vector-tile, and 3D work.
- Prompts 54-62 were incomplete at this checkpoint; do not claim undo/redo, plugin registry, telemetry, offline package export, AI guardrails, collaboration, terrain/3D Tiles, view corridors/sections, or raster/temporal/3D evidence visual-state close-out as release-certified.

## Validation Evidence

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run validate:rc` | **Blocked** | Full Vitest passed: 226 files, 2602 passed, 2 skipped. Production build passed in 12.79s. `perf:budgets` failed with 11 lazy chunk budget overruns; command exited 1. |
| `npm run test:e2e:a11y` | Green | 5 Playwright accessibility tests passed in 1.6m. |
| `npm run lint:no-tailwind-centerpanel` | Green | No Tailwind-like utility classes found in `src/centerpanel`. |
| `npx playwright test e2e/map-motion-p39.spec.ts e2e/map-visual-qa-p40.spec.ts` | **Blocked** | 11 passed, 2 failed. P39 motion checks passed; P40 failed on `map-activity-rail` visibility and blank-canvas detector threshold. |

### `validate:rc` Output Excerpt

```text
Test Files  226 passed (226)
Tests       2602 passed | 2 skipped (2604)
Duration    149.15s

vite v8.0.8 building client environment for production...
4918 modules transformed.
built in 12.79s

Bundle budget summary
- Initial load: 2.38 MiB raw / 674.08 KiB gzip (budget 2.44 MiB raw)
- Lazy centerpanel/components/MapExplorerModal: 6.60 MiB raw / 1.85 MiB gzip (budget 4.20 MiB raw) [OVER BUDGET]
- Lazy features/urbanAnalytics/UrbanAnalyticsModal: 5.15 MiB raw / 1.50 MiB gzip (budget 2.83 MiB raw) [OVER BUDGET]
- Lazy features/urbanAnalytics/RightPanelFourBlock: 4.16 MiB raw / 1.25 MiB gzip (budget 1.86 MiB raw) [OVER BUDGET]

Bundle budgets failed:
- Lazy chunk exceeds budget for centerpanel/components/MapExplorerModal: 6.60 MiB > 4.20 MiB
- Lazy chunk exceeds budget for features/urbanAnalytics/UrbanAnalyticsModal: 5.15 MiB > 2.83 MiB
- Lazy chunk exceeds budget for features/urbanAnalytics/RightPanelFourBlock: 4.16 MiB > 1.86 MiB
- Lazy chunk exceeds budget for centerpanel/Flows/SunlightSimFlow: 1.34 MiB > 1.33 MiB
- Lazy chunk exceeds budget for features/education/EducationModule: 880.89 KiB > 875.00 KiB
- Lazy chunk exceeds budget for centerpanel/Tools/components/GeoAILab: 607.24 KiB > 600.00 KiB
- Lazy chunk exceeds budget for centerpanel/Flows/CompositeIndicatorFlow: 579.33 KiB > 570.00 KiB
- Lazy chunk exceeds budget for centerpanel/Flows/CellularAutomataFlow: 574.37 KiB > 565.00 KiB
- Lazy chunk exceeds budget for centerpanel/Flows/UrbanMorphologyFlow: 573.72 KiB > 565.00 KiB
- Lazy chunk exceeds budget for centerpanel/Flows/FacilityOptimisationFlow: 566.85 KiB > 560.00 KiB
- Lazy chunk exceeds budget for features/education/EducationLeftRail: 564.99 KiB > 560.00 KiB

Command exited with code 1
```

## Release Readiness Scorecard

| Area | Status | Evidence | Limit before RC |
| --- | --- | --- | --- |
| Monolith risk reduced | Green | Prompt 2 decomposed the modal into `src/centerpanel/components/map/controllers/`; architecture decision in `docs/architecture/map-explorer-canonical-surface.md`; state/action architecture in `docs/architecture/map-explorer-state-and-actions.md`. | Keep future Map Explorer work in canonical services/controllers; no release blocker found here. |
| Source registry | Green | Prompt 4 source registry ledger proof; `MapSourceRegistry.test.ts` passed in the full Vitest run; source-handle persistence documented in `docs/architecture/map-explorer-state-and-actions.md`. | Source format documentation still needs Prompt 63 refresh; do not use the matrix as complete release truth yet. |
| CRS preflight | Green | Prompt 7 ledger proof; `CrsPreflight.test.ts` and `ExecutionCrsPlanner.test.ts` passed in the full Vitest run; CRS caveats documented in `docs/map-explorer-workflow-guide.md`. | None for the implemented CRS gate; source-specific metadata gaps remain caveated. |
| Unified Map/Urban bridge | Green | Prompt 16 ledger proof; `MapUrbanBridgeService.test.ts`, `MapToUrbanContextAdapter.test.ts`, and Urban data-fitness tests passed in the full Vitest run. | No raw geometry or false readiness claims allowed across the bridge. |
| Layer inspector | Green | Prompt 10 ledger proof; `layer-inspector.test.tsx` passed in the full Vitest run; inspector behavior documented in the workflow guide. | No release blocker found here. |
| QA command gates | Green | Prompt 7 CRS gate, Prompt 9 command lifecycle, Prompt 14 drawn geometry validation, Prompt 49 topology repair, and QA/service tests all passed in the full Vitest run. | Keep high-impact commands previewable/auditable; no RC blocker in the current checks. |
| Report/export metadata | Green | Prompts 20, 22, and 29 ledger proofs; `MapExportService.test.ts`, `MapReportHandoffService.test.ts`, and layout composer tests passed in the full Vitest run. | Large exported packages remain browser/runtime bounded and must keep progress/failure states. |
| Accessibility smoke | Green | Current `npm run test:e2e:a11y`: 5 passed. | Run again after any UI fix that changes focus order, modal shell, panels, or command surfaces. |
| Premium design and motion gate | **Blocked** | `npm run lint:no-tailwind-centerpanel` passed. Current P39/P40 focused run: 11 passed, 2 failed. | Restore/update the `map-activity-rail` visual QA contract and fix/recalibrate the blank-canvas detector so P40 passes. |
| Large-data truthful limits | Green | Prompts 23, 44, 51, and 52 ledger proofs; full Vitest passed; workflow guide and known risks document browser-memory and streaming limits. | This does not remove browser ceilings; keep large-data claims bounded and visible. |
| External-service limitations | Green | Prompt 21 ledger proof; `MapConnectionRegistry.test.ts` and `ExternalServiceConnector.test.ts` passed; limitations documented in known risks and workflow guide. | Provider availability, credentials, CORS, rate limits, and network failures remain environment-dependent. |
| Known-risks doc | Green | `docs/release/known-risks-and-limitations.md` updated for Prompt 64 blockers. | Update again after budget, visual QA, Prompt 63, or Prompt 54-62 status changes. |

## Concrete Blockers

| Blocker | Current limit | Required to unblock RC |
| --- | --- | --- |
| Bundle budgets | `npm run perf:budgets` exits 1. Largest overages: MapExplorerModal 6.60 MiB vs 4.20 MiB; UrbanAnalyticsModal 5.15 MiB vs 2.83 MiB; RightPanelFourBlock 4.16 MiB vs 1.86 MiB. | Split heavy lazy chunks, remove accidental shared imports, or intentionally revise approved budgets with fresh justification, then make `npm run perf:budgets` green. |
| Visual QA shell contract | P40 desktop shell test cannot find `data-testid="map-activity-rail"`. | Restore the canonical activity rail/test hook or update the P40 spec to the current canonical shell contract, then rerun P40. |
| Visual QA blank-canvas proof | P40 blank overlay expected `<= 10` unique byte values but measured `82`. | Rework the detector sampling/overlay region or recalibrate threshold with a true blank/nonblank bidirectional proof. |
| Full E2E CI | `npm run test:e2e:ci` did not run inside `validate:rc` because the command failed earlier at perf budgets. | After budget gate passes, run the full `validate:rc` command and require smoke, a11y, and functional Playwright suites to pass in the aggregate. |
| Documentation close-out | Prompt 63 was incomplete at this checkpoint; the source support matrix described several later-shipped capabilities as partial/not committed. | Complete Prompt 63: architecture/user docs, source matrix, CRS/QA note, bridge note, design/motion/visual QA notes, validation summary, and link/cross-reference check. |
| Enterprise prompt ladder scope | Prompts 54-62 are not implemented in the ledger. | Implement and verify those prompts before claiming their capabilities or excluding them formally from an RC scope document. |

## Sign-off

| Reviewer | Status | Notes |
| --- | --- | --- |
| GitHub Copilot agent | **NO-GO** | Gate executed; blockers documented with concrete limits. This is not a production-readiness sign-off. |
| Human release owner | Pending | Required after blockers are resolved and `npm run validate:rc` passes. |
