# PLAN — Map Explorer Dock, Drawing & Status Premium Redesign

**Date:** 2026-06-15 · **Status:** PLAN ONLY · **Model target:** Claude Opus 4.8 · **Phases:** 20 (`p00`–`p19`) · **Mode:** dual track per phase (A = Functional, B = Visual)

This document is the architecture reference and phase index. The **executable artifacts** are the self-contained prompts in [prompts/](prompts/). Read this once to understand the system; then drive work from the prompts.

---

## Part 1 — Map Explorer architecture (ground truth, verified 2026-06-15)

### 1.1 Runtime composition

```
MapExplorerModalRoot
  └─ MapExplorerModalRuntime
       └─ MapExplorerModalRuntimeCore   ← ALL state + handlers live here (~6k lines)
            └─ MapExplorerModalRuntimeView   ← render tree, prop fan-out (~850 lines)
                 ├─ left activity rail (MapWorkspaceShell)
                 ├─ left workspace dock (MapExplorerLayerPanelRail → workspaces)
                 ├─ MapCanvas + overlay chrome
                 ├─ MapRightDockHost (right dock)
                 ├─ MapStatusBarWithCursor → MapStatusBar
                 └─ floating dialogs (Draw modal, workflow drawer, inspector host, …)
```

- **State owner:** `controllers/MapExplorerModalRuntimeCore.tsx`. Almost every `useState`, `useCallback` handler, and derived value is here. The `showDrawPanel` state is at **`Core:750`**; the drawing modal renders at **`Core:~6130`** as a `MapDialogShell`.
- **View:** `controllers/MapExplorerModalRuntimeView.tsx` is a near-pure render component that receives ~200 props. It imports `MapDrawingManager` (`../../MapDrawingManager`) and `MapRightDockHost`.

### 1.2 Left dock = activity rail + workspace host

- The **left activity rail** (primary: Overview, Data, Layers, Analyze, Style, Scene, Publish; utility: QA, Review, Diagnostics, Extensions, Save) sets `activeActivityId`. Source of truth: `navigation/mapNavigationModel.ts` (`MAP_ACTIVITY_DEFINITIONS`, `MAP_SIDEBAR_TAB_DEFINITIONS`, task lenses).
- `controllers/MapExplorerLayerPanelRail.tsx` switches on `activeActivityId` and renders one workspace into a resizable `MapPanelRail`:
  - `analyze` → `analyze/MapAnalyzeWorkspace.tsx` (tabs: Workflows, Tools, Query, **Models**, Statistics, Data Operations)
  - `style` → `style/MapStyleWorkspace.tsx`
  - `scene` → `scene/MapSceneWorkspace.tsx`
  - `publish` → `publish/MapPublishWorkspace.tsx`
  - everything else → `sidebar/MapWorkbenchSidebar.tsx` (Layers/Data workspace, with summary stat grid)
- **The Models tab lives inside the LEFT dock** (`MapAnalyzeWorkspace` → `analyze-models` → `modelBuilder/MapModelBuilderPanel.tsx`), not the right dock. (Third screenshot.)
- The "Add Data / registered sources" view (second screenshot) is the **Data** activity's Add Data tab in the LEFT workspace.

### 1.3 Right dock = inspector / analysis surface

- `MapRightDockHost.tsx` + `MapRightDockHost.module.css` render a tabbed dock. Tabs come from the route model in `mapRightDockRoutes.ts`.
- **Panels:** `inspect, style, attributes, problems, timeline, tasks, diagnostics, pins, draw, measure, selection, scientificQA, qa, workflow, report, performance, collaboration, urbanMethod` (`MapRightDockPanel` in `mapDocking.ts`).
- **Tiers:** primary / contextual / advanced / diagnostics (`getMapRightDockPanelTier`). Primary panels are always in the rail; contextual appear when active; advanced/diagnostics live in the overflow popover.
- **Width:** `MAP_RIGHT_PANEL_MIN_WIDTH = 260`, `MAX = 520`, collapsed `= 48` (`mapDocking.ts`). The host already supports **width resize** (`handleResizePointerDown`) but **not drag/move** and is **not a floating modal**.
- **Frame:** `shell/MapDockPanelFrame.tsx` provides title/subtitle/actions/body. The host passes a `GisStatusChip` (`routeStatus`) into the frame `actions` slot — this is the source of the "ready/Primary" badge noise.

### 1.4 The two latent architecture smells (fix these, don't paper over them)

1. **Dual source of truth for dock visibility.** `mapDocking.getMapDockLayout()` derives `showDrawPanel`/`showMeasurePanel`/`showPinSidebar` from `activeRightPanel`, AND `Core` keeps independent `showDrawPanel` (`Core:750`), `showMeasurePanel`, `showPinSidebar` booleans, AND there is a richer route system (`mapRightDockRoutes.ts` with `activeRoute`/`lastRoute`). Three overlapping mechanisms describe "what is open on the right." The Draw first-click bug and right-dock confusion both stem from this. **p04 and p10 converge these onto the route model.**
2. **The Draw modal is a separate `MapDialogShell`** gated by the legacy `showDrawPanel` boolean, while a `draw` right-dock panel ALSO exists in the route model. The topbar Draw button (`MapToolbar.tsx:1906` → `onToggleDrawPanel` → `handleToggleDrawPanel` at `Core:3884`) toggles only the legacy boolean. Tool buttons inside the modal call `handleSetDrawTool` (`Core:3856`). First-click failure lives in this seam.

### 1.5 Drawing pipeline (capabilities exist; wiring is incomplete)

- `MapDrawingManager.tsx` supports four presentations: `floating | embedded | modal | headless`. Geometry helpers: `src/utils/drawingHelpers.ts`. Validation: `src/services/map/DrawnGeometryValidation.ts`.
- Footer actions in the Draw modal (`Core:~6142`): **Add as layer** → `handleAddDrawingsAsLayer` (works), **Fetch data** → `handleOpenFlowDispatchDialog`, **3D buildings** → scene tab.
- Real-data + analysis bridge already exists in `src/services/map/MapAnalysisDispatcher.ts`: `getCompatibleAoiFlows`, `dispatchRecommendationFlow`, `setMapViewRestriction`, plus `buildBufferedPointBounds`. Spatial helpers: `controllers/mapExplorerSpatialHelpers.ts` (`filterFeatureCollectionToBounds`, `buildDrawnAoiFromWorkflowResult`, `resolveFlowDispatchAoiCandidate`). **The gap is a coherent rectangle-AOI → fetch-data-in-bounds → compatible-flow → evidence flow, not the absence of services.**

### 1.6 Status bar

- `MapStatusBar.tsx` computes `visibleSegments`/`overflowSegments` (~`998`–`1045`) using a fixed `overflowTriggerWidth = 92` and an available-width budget, then renders a `MoreHorizontal` overflow popover (~`1139`–`1199`). Host: `controllers/MapStatusBarWithCursor.tsx`. The overflow miscount/clipping is here.

### 1.7 Badge / status-chip system

- Primitive: `ui/GisStatusChip.tsx` (already `borderRadius: 0` — square). Tokens: `mapTokens.ts` (`GisStatusKey` ~`1228`, `MAP_STATUS_TOKENS`, `GIS_STATUS_KEYS` ~`1335`).
- The **round** badges the owner dislikes are NOT from `GisStatusChip`; they are inline `borderRadius: 999 / 50%` dots/pills in workspace files. Confirmed offenders (2026-06-15 scan): `style/MapStyleWorkspace.tsx`, `ui/GisProgressBar.tsx`, `table/MapAttributeTable.tsx`, `scene3d/SunShadowPanel.tsx`, `scene3d/Scene3DInteractionStrip.tsx`, `scene3d/ScenarioComparisonStrip.tsx`, `review/MapReviewSidebar.tsx`, `processing/MapProcessingToolboxPanel.tsx`, `problems/MapProblemsPanel.tsx`, `MapSwipeCompareOverlay.tsx`, `MapReviewTimelinePanel.tsx`.
- The **meaningless "ready"/"Primary"** chips come from `MapRightDockHost.tsx` `TIER_STATUS`/`PANEL_STATUS`/`routeStatus` (~`117`–`148`) which renders a chip for every panel regardless of whether there is anything to report.

### 1.8 Design language & hard rules (from CLAUDE.md / AGENTS.md)

- **No Tailwind** anywhere under `src/centerpanel/` (`lint:no-tailwind-centerpanel`).
- CSS Modules for centerpanel; design tokens from `mapTokens.ts`; "minimal premium" (dense type, thin separators, restrained amber accent, no cards-in-cards).
- `exactOptionalPropertyTypes: true`. No `localStorage` (Zustand `persist`, namespace `urban.config.map.*`). Reuse shared contracts (`services/map/contracts/gisContracts.ts`) and fixtures (`__tests__/fixtures/gisFixtures.ts`) — never redefine. Reuse `useDraggableMapPanel.ts` — never re-implement dragging.
- Capability status must be explicit (`implemented | demo_mode | residual_gap | environment_dependent | deferred`); never label synthetic data as real.

---

## Part 2 — Phase index (20 phases)

Each phase has a prompt pair file in `prompts/` (`pNN-trackA-*.md`, `pNN-trackB-*.md`) or a single combined file where the tracks are tightly coupled. Track A = code/behavior + tests. Track B = design/CSS + screenshots.

| Phase | Title | Primary files | Closes problems |
|---|---|---|---|
| **p00** | Discovery, baseline capture & anti-amnesia spine | this pack, screenshots | sets up all |
| **p01** | Status-language & de-roundification token foundation | `mapTokens.ts`, `ui/GisStatusChip.tsx`, new `__tests__/mapBadgePolicy.test.ts` | 8 |
| **p02** | Badge cleanup — right dock & dock frame | `MapRightDockHost.tsx`, `shell/MapDockPanelFrame.tsx` | 8 |
| **p03** | Badge cleanup — workspaces, scene strips, tables (global) | 11 offender files (§1.7) | 8 |
| **p04** | Dock-visibility state unification (kill dual source of truth) | `mapDocking.ts`, `mapRightDockRoutes.ts`, `Core` | 1, 9 |
| **p05** | Drawing first-click open fix + topbar/command wiring | `Core`, `MapToolbar.tsx`, `MapTopCommandSurface.tsx` | 1 |
| **p06** | Drawing premium modal redesign (visual) | `MapDrawingManager.tsx`, `MapDialogShell.tsx`, Core draw block | 1 |
| **p07** | Rectangle AOI → fetch real data in bounds | `Core`, `MapAnalysisDispatcher.ts`, `mapExplorerSpatialHelpers.ts` | 2 |
| **p08** | AOI → compatible scientific flows → evidence | `Core`, `MapAnalysisDispatcher.ts`, `mapEvidenceArtifacts.ts` | 2 |
| **p09** | Right dock → draggable/resizable floating modal shell | `MapRightDockHost.tsx`, `useDraggableMapPanel.ts`, `ui/mapOverlayPortal.ts`, `mapDocking.ts` | 3 |
| **p10** | Right dock single-click open + state model cleanup | `Core`, `View`, `MapToolbar.tsx`, `mapRightDockRoutes.ts` | 3, 9 |
| **p11** | Right-panel single-column conversion | `controllers/MapRightDockBodyContent.tsx`, right-dock CSS | 4 |
| **p12** | Right dock premium motion & chrome | `MapRightDockHost.module.css`, `design/motion.module.css`, `MapDockPanelFrame` | 3 |
| **p13** | Left-dock workspace single-column conversion | `sidebar/MapWorkbenchSidebar.tsx`, Data/Add Data, `catalog/`, `MapAnalyzeWorkspace.tsx` | 5 |
| **p14** | Models tab single-column recompose (functional) | `modelBuilder/MapModelBuilderPanel.tsx` | 6 |
| **p15** | Models tab premium visual flow | `modelBuilder/MapModelBuilderPanel.module.css` | 6 |
| **p16** | Status bar overflow correctness fix | `MapStatusBar.tsx`, new `__tests__/mapStatusBarOverflow.test.ts` | 7 |
| **p17** | Status bar premium VS Code interactions | `MapStatusBar.tsx`, `MapStatusBarWithCursor.tsx` | 7 |
| **p18** | Cross-cutting consistency pass (density, empty states, a11y, reduced motion) | shared `ui/`, `design/` | 10 |
| **p19** | Final RC gate + visual QA sweep + archive | whole pack | all |

### Dependency graph

```
p00
 ├─ p01 ─ p02 ─ p03                         (badges)
 ├─ p04 ─ p05 ─ p06 ─ p07 ─ p08             (drawing: state → open → visual → data → analysis)
 ├─ p04 ─ p09 ─ p10 ─ p11 ─ p12             (right dock: state → modal → open → single-col → motion)
 ├─ p13                                     (left dock single-col; independent after p01)
 ├─ p14 ─ p15                               (models; p14 after p13 layout tokens settle)
 └─ p16 ─ p17                               (status bar)
p18  depends on p02,p03,p11,p12,p13,p15,p17
p19  depends on ALL
```

Recommended serial execution order for a single agent stream:
`p00 → p01 → p02 → p03 → p04 → p05 → p06 → p07 → p08 → p09 → p10 → p11 → p12 → p13 → p14 → p15 → p16 → p17 → p18 → p19`.

### Phase-closure invariant (applies to every phase)

A phase is `done` only when **all** hold:
1. Track A: `npm run typecheck` clean **and** the phase's named specs pass; result summary saved in `evidence/pNN-trackA.md`.
2. Track A: `npm run lint:no-tailwind-centerpanel` clean (any phase touching centerpanel).
3. Track B: `screenshot-map-explorer` after-shots saved in `evidence/`, visibly demonstrating the change vs. the `baseline/` shot.
4. [LEDGER.md](LEDGER.md) row + session log updated; [STATE.json](STATE.json) track `status` flipped to `done` with `evidence` path.

> Full per-phase detail (intent, file anchors, steps, verification, done criteria, guardrails) lives in the matching prompt file under [prompts/](prompts/). The prompt — not this index — is the contract the agent executes.
