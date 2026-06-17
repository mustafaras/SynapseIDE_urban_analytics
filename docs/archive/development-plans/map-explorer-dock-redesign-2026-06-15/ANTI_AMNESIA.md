# ANTI-AMNESIA — Cold-Start Recovery Card

> If you are an agent picking up this pack in a fresh session, read THIS file first, then [LEDGER.md](LEDGER.md), then [STATE.json](STATE.json). In 60 seconds you will know what the pack is, where work stopped, and what you must not break. Then open the specific `prompts/pNN-*.md` that `STATE.json` marks as the next `pending` track.

## 1. What this pack is
A 20-phase (`p00`–`p19`) premium redesign of the **Map Explorer** modal's docks, drawing module, and status bar. Each phase has two tracks: **A = Functional** (code + tests) and **B = Visual** (design + screenshots). A phase is `done` only when BOTH are verified with evidence.

## 2. The problems (target end state)
1. Topbar **Draw** opens on first click; all draw tools usable. (p04, p05)
2. Rectangle **AOI fetches real data** and runs scientific analysis end-to-end. (p07, p08)
3. **Right dock** = single-click, draggable, resizable, animated floating modal. (p09, p10, p12)
4. Right panel + 5. left workspaces are **single-column** premium flows. (p11, p13)
6. **Models tab** readable single-column. (p14, p15)
7. **Status bar "More"** shows all overflow items; premium VS Code interactions. (p16, p17)
8. **No round red/green badges, no meaningless "ready" chips.** (p01–p03)
9. **One** dock-visibility model (route system), not three. (p04, p10)

## 3. Where work stopped
→ [LEDGER.md](LEDGER.md) table + last session-log entry. → [STATE.json](STATE.json) `phases[].trackA/trackB.status`. Take the lowest-`pNN` `pending` track whose `dependsOn` are all `done`.

## 4. File map (the 14 that matter most)
| What | File | Anchor |
|---|---|---|
| State + handlers (everything) | `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` | `showDrawPanel` @750; draw modal @~6130; `handleSetDrawTool` @3856; `handleToggleDrawPanel` @3884 |
| Render tree / prop fan-out | `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeView.tsx` | imports `MapDrawingManager`, `MapRightDockHost` |
| Drawing module | `src/centerpanel/components/MapDrawingManager.tsx` | modes: floating/embedded/modal/headless |
| Drawing geometry helpers | `src/utils/drawingHelpers.ts` | — |
| AOI → data/analysis bridge | `src/services/map/MapAnalysisDispatcher.ts` | `getCompatibleAoiFlows`, `dispatchRecommendationFlow`, `setMapViewRestriction` |
| Spatial helpers | `src/centerpanel/components/map/controllers/mapExplorerSpatialHelpers.ts` | `filterFeatureCollectionToBounds`, `resolveFlowDispatchAoiCandidate` |
| Right dock host | `src/centerpanel/components/map/MapRightDockHost.tsx` | resize @229; `routeStatus`/`TIER_STATUS` @117-148 |
| Right dock CSS | `src/centerpanel/components/map/MapRightDockHost.module.css` | — |
| Dock frame | `src/centerpanel/components/map/shell/MapDockPanelFrame.tsx` | actions slot hosts status chip |
| Dock constants + layout | `src/centerpanel/components/map/mapDocking.ts` | MIN=260/MAX=520/collapsed=48; `getMapDockLayout` |
| Right dock routes | `src/centerpanel/components/map/mapRightDockRoutes.ts` | tiers, overflow groups |
| Drag hook (REUSE, never reimplement) | `src/centerpanel/components/map/useDraggableMapPanel.ts` | `useDraggableMapPanel` |
| Status bar | `src/centerpanel/components/map/MapStatusBar.tsx` | overflow @~998-1199 |
| Models builder | `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx` | 2-col form+preview |
| Badge primitive | `src/centerpanel/components/map/ui/GisStatusChip.tsx` | already `borderRadius:0` |
| Status tokens | `src/centerpanel/components/map/mapTokens.ts` | `GisStatusKey` @~1228, `MAP_STATUS_TOKENS` |
| Left dock workspace switch | `src/centerpanel/components/map/controllers/MapExplorerLayerPanelRail.tsx` | switches on `activeActivityId` |
| Analyze workspace (hosts Models) | `src/centerpanel/components/map/analyze/MapAnalyzeWorkspace.tsx` | `analyze-models` tab |
| Navigation model | `src/centerpanel/components/map/navigation/mapNavigationModel.ts` | activities, sidebar tabs, lenses |

## 5. Round-badge offenders (p03 targets)
`style/MapStyleWorkspace.tsx`, `ui/GisProgressBar.tsx`, `table/MapAttributeTable.tsx`, `scene3d/SunShadowPanel.tsx`, `scene3d/Scene3DInteractionStrip.tsx`, `scene3d/ScenarioComparisonStrip.tsx`, `review/MapReviewSidebar.tsx`, `processing/MapProcessingToolboxPanel.tsx`, `problems/MapProblemsPanel.tsx`, `MapSwipeCompareOverlay.tsx`, `MapReviewTimelinePanel.tsx`. (Re-scan with: `borderRadius:\s*(999|9999|"50%"|'50%')`.)

## 6. Verify
```bash
npm run typecheck
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map/__tests__/<spec>.test.ts
npm run color:guard          # badge work
```
Visual proof → `screenshot-map-explorer` skill. GIS gate → `check-gis-modal` skill. UA bridge gate → `check-analytics` (only if you touch `src/features/urbanAnalytics/`).

## 7. NEVER do
- No Tailwind under `src/centerpanel/` (`lint:no-tailwind-centerpanel` fails CI).
- Never re-implement dragging — reuse `useDraggableMapPanel.ts`.
- Never redefine shared contracts (`services/map/contracts/gisContracts.ts`) or fixtures (`__tests__/fixtures/gisFixtures.ts`) — import them.
- Never call `localStorage` directly — Zustand `persist`, namespace `urban.config.map.*`.
- `prop?: T` ≠ `prop: T | undefined` (`exactOptionalPropertyTypes`).
- Never label synthetic/sample data as real; capability status must be explicit.
- Never mark a track `done` without an `evidence/` artifact. Never close a phase with only one track verified.

## 8. Verified ground truth (2026-06-15)
- Right dock already resizes WIDTH; it does NOT drag and is NOT a floating modal yet (p09 adds this).
- `GisStatusChip` is already square — round badges are inline-radius in §5 files (p03).
- "ready/Primary" chips come from `MapRightDockHost` `routeStatus` (p02).
- Draw modal is a separate `MapDialogShell` gated by legacy `showDrawPanel`; topbar Draw → `onToggleDrawPanel` toggles only that boolean (p04/p05).
- Three overlapping dock-visibility mechanisms exist; p04 converges them onto `mapRightDockRoutes`.
- Models tab is in the LEFT dock (Analyze workspace), not the right dock.

## 9. When the pack is complete
Move this folder to `docs/archive/development-plans/` (CLAUDE.md convention) and note the archival in LEDGER.
