# Map Explorer Implementation Ledger

## Purpose

This ledger is the durable memory for Map Explorer implementation. Every agent must read it before starting and update it before finishing.

The ledger prevents amnesia between agents, models, sessions, and context resets. It records what was inspected, changed, validated, deferred, blocked, or scientifically constrained.

## Canonical Documents

Read these before implementing any Map Explorer prompt:

1. `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
2. `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
3. `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
4. `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
5. `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
6. `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
7. `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
8. This ledger.

## Current Status

- Overall status: Map Workflow Manifest and Preview landed. 12 of 30 prompts completed.
- Current prompt: Prompt 11 - Map Workflow Manifest and Preview completed 2026-05-11.
- Next recommended prompt: Prompt 12 - Analysis Recommendation and Dispatch.
- Operating pack status: Installed.
- Next-prompt helper: `scripts/get-next-map-explorer-prompt.ps1`
- Machine-readable manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
- Last validated repository state: 2026-05-11; Prompt 11 validation passed: `npx vitest run src/services/map/__tests__/MapWorkflowService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts` passed (24/24), `npm run typecheck` passed, and focused `npx eslint --quiet` on touched Prompt 11 files passed. Repo-wide `npm run lint:errors` still fails on unrelated `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import. `npm run lint:no-tailwind-centerpanel` is currently blocked by missing `scripts/check-no-tailwind-centerpanel.ps1` referenced from `package.json`.
- Last known blocker: None for Prompt 11 scope.

## Agent Operating Pack

Use this pack for every future Map Explorer implementation session:

1. Start from `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`.
2. Run `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` when script execution is available.
3. Read the returned prompt block in `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`.
4. Implement only that prompt unless the user explicitly asks for a different prompt.
5. Finish with `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`.
6. Update this ledger before final response.

Valid prompt statuses:

- `pending`
- `in_progress`
- `completed`
- `blocked`
- `skipped_with_reason`

## Prompt Status Register

This table is the human-readable execution state. The helper script reads it when selecting the next prompt. Keep it synchronized with the Prompt Execution Log.

| ID | Prompt | Status | Depends On | Notes |
| --- | --- | --- | --- | --- |
| 00 | Memory Bootstrapping and Repository Baseline | completed | None | Baseline audit complete 2026-05-10. All planned files confirmed present. Typecheck clean. |
| 01 | Map Architecture Map and Spatial Ownership Boundaries | completed | 00 | Architecture map complete 2026-05-10. Component tree, store slices, layer flow, contracts, and cross-module boundaries documented. No ownership violations found. |
| 02 | Map Context Kernel and Selectors | completed | 01 | Context kernel + memoised selectors landed 2026-05-10. `MapExplorerContextSummary` published; layer summarizer extracted into single source of truth. 53/53 tests pass. |
| 03 | Map Evidence Artifact Model Foundation | completed | 02 | Completed 2026-05-10. Lightweight map evidence model, registry helpers, adapters, selectors, and tests landed. |
| 04 | Store Persistence Boundaries and Project Snapshots | completed | 03 | Completed 2026-05-10. Snapshot v3, reference schema, stale restore metadata, and persistence tests landed. |
| 05 | Modal Shell Decomposition and Command Hooks | completed | 04 | Completed 2026-05-10. Extracted panel choreography and AOI dispatch command hooks without changing visible behavior. |
| 06 | Premium Workspace Shell and Context Strip | completed | 05 | Completed 2026-05-10. Navigator cockpit now surfaces truthful AOI, QA, workflow/export, and sync context with a denser premium status strip. |
| 07 | Layer Registry Metadata Upgrade | completed | 06 | Completed 2026-05-10. Layer registry now carries normalized scientific metadata, provenance, CRS/geometry/schema/license summaries, QA, queryability, evidence IDs, and publication readiness while legacy layers degrade truthfully. |
| 08 | Layer Manager Premium UX and Safety | completed | 07 | Completed 2026-05-10. Layer rows now expose registry-driven badges, disabled handoff reasons, and guarded delete confirmation. |
| 09 | Scientific QA Model and Panel | completed | 08 | Completed 2026-05-11. First-class QA domain summaries, panel domain rows, layer metadata propagation, QA-finding evidence artifacts, and focused tests landed. |
| 10 | Publication Readiness Gates | completed | 09 | Completed 2026-05-11. Formal export/report gates now consume scientific QA/export-readiness, carry reproducibility manifests, and register publication/report evidence artifacts. |
| 11 | Map Workflow Manifest and Preview | completed | 10 | Completed 2026-05-11. Workflow previews/apply results now carry lightweight reproducibility manifests, applied workflow outputs register evidence artifacts, and engine adapter map outputs can preserve manifest metadata. |
| 12 | Analysis Recommendation and Dispatch | pending | 11 | Requires workflow manifest. |
| 13 | Engine Adapter Evidence Outputs | pending | 12 | Requires recommendation/dispatch. |
| 14 | Import and External Service Evidence | pending | 13 | Requires engine evidence output model. |
| 15 | CRS, Measurement, and Geometry Validation | pending | 14 | Requires import evidence. |
| 16 | Map to Urban Context Adapter | pending | 15 | Requires CRS/QA foundation. |
| 17 | Urban to Map Method Request Adapter | pending | 16 | Requires map-to-urban adapter. |
| 18 | Map to IDE Code and Manifest Artifact Requests | pending | 17 | Requires urban request adapter. |
| 19 | IDE to Map File and Layer Artifact Recognition | pending | 18 | Requires map-to-IDE request model. |
| 20 | Report Handoff Structured Evidence | pending | 19 | Requires IDE recognition contracts. |
| 21 | Dashboard, Education, and Publication Outputs | pending | 20 | Requires report handoff. |
| 22 | Temporal Playback and Scenario Comparison | pending | 21 | Requires publication output contracts. |
| 23 | VoxCity 2D/3D Synchronization | pending | 22 | Requires temporal/scenario model. |
| 24 | Natural-Language Query Safety and Audit | pending | 23 | Requires evidence and QA models. |
| 25 | Review Timeline and Audit Trail | pending | 24 | Requires NL query audit. |
| 26 | Accessibility and Keyboard Premium | pending | 25 | Requires review timeline. |
| 27 | Performance, Workers, Memory, and Chunking | pending | 26 | Requires accessibility hardening. |
| 28 | QA Harness and E2E Validation | pending | 27 | Requires performance hardening. |
| 29 | Final Premium Polish and Handoff | pending | 28 | Final Map Explorer readiness pass. |

## Non-Negotiable Operating Rules

- Do not assume a prompt is complete unless this ledger says it is complete and the repository supports that claim.
- Do not skip required reading.
- Do not overwrite user changes.
- Do not make unrelated refactors.
- Do not introduce a separate visual language for Map Explorer.
- Do not couple Map Explorer directly to Synapse IDE or Urban Analytics internals without a documented contract or adapter.
- Do not fake CRS, geometry validity, data readiness, map QA, workflow success, export readiness, or layer provenance.
- Do not persist large raw geometries in new lightweight context/evidence records.
- Do not finish without updating this ledger.

## Prompt Execution Log

### Prompt 00 - Memory Bootstrapping and Repository Baseline

- Date: 2026-05-10
- Agent: Claude Opus 4.7 (Claude Code)
- Status: completed
- Files inspected:
  - `package.json` (React 19.1, Vite 8.0.8, TypeScript 5.8.3, Vitest 4.1.4, Playwright 1.59.1, deck.gl 9.1, maplibre-gl 4.7, mapbox-gl 3.9, @turf/turf 7.2, proj4 2.15, h3-js 4.2, geos-wasm 2.0, gdal3.js 2.8, supercluster 8, rbush 4, geotiff 2.1, flatgeobuf 3.35, parquet-wasm 0.6, shpjs 6.1, three 0.177, Zustand 5.0)
  - `src/centerpanel/components/MapExplorerModal.tsx` (198,518 bytes — confirmed super-component risk noted in Known Risks)
  - `src/centerpanel/components/MapExplorerButton.tsx`
  - `src/centerpanel/components/map/` — 17 components present: MapWorkspaceShell, MapWorkspaceCockpit, MapCanvas, MapToolbar, MapLayerManager, MapLayerPanel, MapStatusBar, MapSearchBar, MapPinSidebar, MapWorkflowDrawer, MapNLQueryPanel, MapReportHandoffDrawer, MapReviewTimelinePanel, ScientificQAPanel, CartographyRecommendationList, MapIcons, useAnnouncer
  - `src/stores/useMapExplorerStore.ts` (56,221 bytes; exports `useMapExplorerStore`, `MapExplorerState`, `MapExplorerLayoutPreferences`)
  - `src/services/map/` — 25 services present including: ExternalServiceConnector, ExternalServiceQueue, ExternalTileUrlTemplates, MapAnalysisBounds, MapAnalysisDispatcher, MapAnalysisRecommender, MapCartographyAdvisor, MapDataExporter, MapDataImporter, MapEngineAdapter, MapExportService, MapNLQueryBuilder, MapPersistenceService, MapReportHandoffService, MapReviewSessionService, MapScientificQA + worker, MapSyncService, MapWorkflowService, SpatialStatsExecutionQueue, SpatialStatsExecutionService, voxCityProjection, voxCitySelectionService, ideMapHandoff, mapToIdeHandoff
  - `src/services/map/__tests__/` — 18 service test files present
  - `src/features/urbanAnalytics/store.ts` (UA owner — present)
  - `src/services/editorBridge.ts` (top-level bridge — present)
  - `src/services/editor/bridge.ts` (`bridge.ts`, `bridgeAdapter.ts`, `aiEditorBridgeGlobal.ts` all present)
  - `src/services/reporting/` — 10 modules present: AutoNarrative, CitationManager, citationTokens, export, fixtures, index, ReportEngine, storage, types, indicatorInserts
  - Project root file tree, repository git status
- Files changed:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` (this ledger only — no product code touched)
- Behavior implemented: None. Documentation-only baseline audit.
- Spatial evidence/provenance changes: None.
- CRS, geometry, or measurement changes: None.
- Scientific QA changes: None.
- Layer registry or persistence changes: None.
- Workflow/export/report changes: None.
- Cross-module contracts changed: None. Existing contracts confirmed present in repo (see Cross-Module Contract Registry update below).
- Validation run:
  - `npm run typecheck` → passed (silent, exit 0).
  - `npm run lint:errors` → 1 error in `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` (unused import `UrbanMethodValidityEnvelope`). Pre-existing in uncommitted UA work; NOT introduced by Prompt 00 and outside Map Explorer scope.
  - `git status` → branch `master`, untracked: `src/features/urbanAnalytics/__tests__/workflowReadiness.test.ts`, `src/features/urbanAnalytics/lib/workflowReadiness.ts`; modified: `.claude/settings.local.json`. None in Map Explorer scope.
- Validation result: Passed for Map Explorer surface. Pre-existing UA lint error recorded as out-of-scope.
- Risks or blockers:
  - `MapExplorerModal.tsx` confirmed at 198 KB — super-component risk for Prompts 05/06.
  - Uncommitted UA work-in-progress in workspace; do not touch from Map Explorer prompts unless asked.
  - `src/services/editorBridge.ts` AND `src/services/editor/bridge.ts` BOTH exist — must verify which is canonical for Map↔IDE handoff before Prompts 18/19.
- Next recommended prompt: Prompt 01 - Map Architecture Map and Spatial Ownership Boundaries.
- Ledger updated: yes

### Prompt 01 - Map Architecture Map and Spatial Ownership Boundaries

- Date: 2026-05-10
- Agent: Claude Opus 4.7 (Claude Code) — tracing delegated to Explore subagent
- Status: completed
- Files inspected:
  - `src/centerpanel/components/MapExplorerModal.tsx` (orchestrator; lines 29-67 imports; line 4047 render tree; lines 172-178 report handoff; lines 710-805 AOI/draw/measure/analysis-result wiring; line 886 workflow context)
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
  - `src/centerpanel/components/map/ScientificQAPanel.tsx`
  - `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
  - `src/centerpanel/components/map/mapTypes.ts` (lines 180-188: `MapLayerRegistryChangeDetail` + `MAP_LAYER_REGISTRY_EVENT`)
  - `src/stores/useMapExplorerStore.ts` (lines 131-325: full `MapExplorerState` interface)
  - `src/services/map/MapEngineAdapter.ts` (line 34 type imports from urbanAnalytics; createAnalysisMapOutput / createSpatialStatsCompletedRun / hasAnalysisRerun / rerunAnalysisResult / attachSpatialStatsRerun)
  - `src/services/map/MapWorkflowService.ts` (generateMapWorkflowPreview / applyMapWorkflowPreview / createDefaultDraft / buildMapWorkflowContext)
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/MapReportHandoffService.ts` (lines 52-63 `MapReportHandoffInput`)
  - `src/services/map/MapSyncService.ts`
  - `src/services/map/MapAnalysisDispatcher.ts` (line 2 `AnalyticalFlowId` type-only import)
  - `src/services/map/MapAnalysisRecommender.ts` (line 2 `AnalyticalFlowId` type-only import)
  - `src/services/map/ExternalServiceConnector.ts` (lines 9-10 voxcity loader imports)
  - `src/features/urbanAnalytics/lib/mapContextAdapter.ts` (UA→Map controlled `getState()` read)
  - `src/features/urbanAnalytics/lib/mapEvidencePublisher.ts` (UA→Map controlled `getState()` read)
  - `src/features/urbanAnalytics/lib/studyAreaSelection.ts`
  - `src/services/reporting/storage.ts` (`enqueuePendingReportInsert` / `PENDING_INSERTS_KEY`)
  - `src/services/reporting/*` (audit: zero imports from `useMapExplorerStore` or `services/map/`)
- Files changed:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` (architecture map appended; no product code touched)
- Behavior implemented: None. Documentation-only architecture trace.

#### Architecture Map

**1. Modal render tree (top-down):**

```text
MapExplorerModal (super-component, 198 KB orchestrator)
└── MapWorkspaceShell (mode, children)
    ├── MapLayerPanel               (base layer selector — left)
    ├── MapPanelRail side="left"
    │   └── MapLayerManager         (toggle, reorder, opacity, delete, QA review)
    ├── MapCanvasRegion
    │   ├── MapWorkspaceCockpit     (workspace stats, quick actions, recommendations)
    │   ├── MapCanvas               (maplibre-gl instance)
    │   ├── MapReportHandoffDrawer  (generate → report insert)
    │   ├── MapReviewTimelinePanel  (collaborative review timeline)
    │   ├── WorkflowPreviewOverlay  (split/swipe/blend preview viz)
    │   ├── ScientificQAPanel       (geometry / CRS / stale / uncertain badges)
    │   ├── MapNLQueryPanel         (NL → spatial query builder)
    │   └── MapWorkflowDrawer       (AOI / buffer / intersect / diff / union / comparison)
    ├── MapPanelRail side="bottom"
    │   └── MapBottomTimeline       (temporal step / speed / range)
    └── MapSearchBar, MapStatusBar, MapPinSidebar, MapToolbar, MapDrawingManager,
        MapMeasurementTool, MapContextMenu, MapBookmarkBar, MapAnnotationLayer,
        MapChoroplethLayer, MapHeatmapLayer, MapHotSpotViz, MapEmergingHotSpotViz,
        MapClusterViz, MapSymbolLayer, MapVoxCityOverlay, MapTemporalPlayer,
        MapDataExportDialog, MapExportDialog, MapCsvImportDialog,
        MapColumnarImportDialog, MapDataImportHubDialog, MapServiceDialog,
        CartographyRecommendationList
```

**2. Store ownership (`MapExplorerState` slices grouped by domain):**

| Domain | Slices | Persisted? |
| --- | --- | --- |
| Modal lifecycle | isOpen, open, close, toggle | no |
| Viewport | viewport, setViewport, applyImmediateViewport, pendingFitBounds, requestFitBounds | yes (viewport) |
| Base layer / pins / bookmarks / annotations | activeBaseLayer, pins, bookmarks, annotations, annotationToolSettings | yes |
| Tools | activeTool, activeDrawTool, activeMeasureTool | partial |
| Layout | layoutPreferences | yes |
| Overlay layers | overlayLayers + add/remove/toggleVisibility/setOpacity/updateMetadata/reorder/replace | no |
| Scientific QA | scientificQA, setScientificQA | no |
| Spatial selection | currentMapBounds, selectedFeatureIds, activeAoiId, activeAnalysisResultLayerIds | no |
| AOI / drawing | drawnFeatures, addDrawnFeature, removeDrawnFeature, updateDrawnFeature, clearDrawnFeatures, replaceDrawnFeatures | no |
| Measurement | measurements, addMeasurement, removeMeasurement, clearMeasurements | no |
| Temporal | currentTimestep, isPlaying, playbackSpeed, timeRange | no |
| Review session | reviewSession, addMapReviewEvent, updateMapReviewEventStatus | no |
| Copilot | copilotActionProposals, copilotAuditTrail, copilotContextSnapshot | no |
| Persistence hooks | restoreProjectState, clearProjectContent | n/a |

**3. Layer state flow (store → render → manager → QA → report → export):**

```text
overlayLayers (store)
 ├─→ MapCanvas               selector(overlayLayers) → maplibre render
 ├─→ MapLayerManager         selectors + actions: toggleLayerVisibility, setLayerOpacity,
 │                            removeOverlayLayer, reorderLayers, updateLayerMetadata
 ├─→ ScientificQAPanel       selectors(scientificQA, overlayLayers); writes setScientificQA
 ├─→ MapReportHandoffDrawer  consumes draft built by buildMapReportHandoffDraft(overlayLayers,
 │                            viewport, currentMapBounds, selectedFeatureIds, scientificQA)
 │                            → buildPendingReportInsertFromMapHandoff
 │                            → enqueuePendingReportInsert (services/reporting/storage.ts)
 │                            → localStorage[PENDING_INSERTS_KEY]
 └─→ MapExportService        consumes layer metadata + MapCompositionOptions (no raw store)

Pub/sub: every layer mutation also dispatches CustomEvent
  MAP_LAYER_REGISTRY_EVENT = "synapse-map-layer-registry-change"
  payload MapLayerRegistryChangeDetail { operation, layerId?, layers, previousLayers, timestamp }
  defined in src/centerpanel/components/map/mapTypes.ts:180-188
  test: src/centerpanel/components/map/__tests__/map-layer-management.test.ts:350
```

**4. AOI / selection / drawing / measurement:**

- `selectedFeatureIds: Map<layerId, featureIds[]>` — written by MapCanvas onSelect; consumed by MapNLQueryPanel, MapWorkflowDrawer, report handoff builder.
- `activeAoiId` — written by MapWorkflowDrawer/cockpit AOI picker.
- `drawnFeatures` — owned by drawing manager; helper `getAoi()` returns first polygon/multipolygon for analysis dispatch.
- `measurements` — owned by MapMeasurementTool; surfaced in MapStatusBar.
- `activeAnalysisResultLayerIds` — written when an analysis run produces overlay layers, used to highlight result layers in the manager.

**5. Workflow preview/apply:**

```text
MapWorkflowService exports:
  buildMapWorkflowContext(overlayLayers, {viewport, selectedAoi, ...}) → MapWorkflowContext
  createDefaultDraft(kind, context) → MapWorkflowDraft
  generateMapWorkflowPreview(context, draft) → MapWorkflowPreview | null    (pure)
  applyMapWorkflowPreview(preview) → MapWorkflowApplyResult                   (pure)

MapExplorerModal:
  workflowContext = useMemo(() => buildMapWorkflowContext(...), [overlayLayers, ...])
  → MapWorkflowDrawer({ visible, context, onApply })
     ├── internally: setDraft → generateMapWorkflowPreview on each change
     └── onApply(MapWorkflowApplyResult)
          → MapExplorerModal.handleApplyWorkflowResult()
             → addOverlayLayer(resultLayer)   (store write — only mutation point)
```

**6. Engine adapter → map layer (LISA path traced end-to-end):**

```text
Urban Analytics LISA run completes
  → CompletedAnalysisRun (urbanAnalytics/lib/types)
  → MapEngineAdapter.createAnalysisMapOutput(run, engineBridge)
     → MapOutput { sourceData (GeoJSON + __analysisValue/__analysisClassIndex/__analysisClassLabel),
                   style (maplibre paint/layout),
                   metadata (analysisResult: {engine, parameterSummary, runTimestamp,
                                              sourceLayerIds}) }
  → composed into OverlayLayerConfig { id, name, type, visible, opacity, sourceData,
                                       style, metadata, group: "analysis" }
  → addOverlayLayer(layerConfig)
  → overlayLayers state
  → MapCanvas re-renders via maplibre
  → MAP_LAYER_REGISTRY_EVENT dispatched

Re-run path: hasAnalysisRerun(layer) → rerunAnalysisResult(layer, params) →
attachSpatialStatsRerun(layer, run) preserves provenance.
```

**7. Cross-module imports (audited):**

| Direction | Status | Notes |
| --- | --- | --- |
| Map components/services → urbanAnalytics | TYPE-ONLY (legal) | `MapEngineAdapter`, `MapAnalysisDispatcher`, `MapAnalysisRecommender` import `AnalyticalFlowId`, `CompletedAnalysisRun`, `MapOutput` from `@/features/urbanAnalytics/lib/types`; `MapExplorerModal`/`ExternalServiceConnector` import `voxcity` data + `loadCityJSON`. No component imports, no store imports. |
| urbanAnalytics → Map | CONTROLLED `getState()` reads (legal) | `mapContextAdapter.ts`, `mapEvidencePublisher.ts`, `studyAreaSelection.ts` use `useMapExplorerStore.getState()` for point reads; type imports of `OverlayLayerConfig`, `MapExplorerState` from `mapTypes.ts`. Unidirectional, structured. |
| Map → IDE (`appStore`/`editorStore`/`services/editor/`) | NONE in `src/centerpanel/components/map/` or `src/services/map/` | `MapExplorerModal` imports `appStore` (line 76) and `useFlowStore` (line 77) only for modal lifecycle / project ID, not for editor file/tab state. Clean boundary. |
| Map → `usePanelBridgeStore` | NONE | Map Explorer does not consume the panel bridge store. |
| Reporting → Map | NONE direct | `services/reporting/*` has zero imports from `useMapExplorerStore` or `services/map/`. Reports consume only structured `PendingReportInsert` + `MapReportHandoffDraft` via localStorage queue. |

**8. Cross-module alignment checks (Prompt 01 requirements):**

- Map Explorer does not own method interpretation — confirmed. UA owns `AnalyticalFlowId`, method dossier, indicator interpretation; Map only consumes type IDs.
- Map Explorer does not own editor file or tab state — confirmed. No imports from `editorStore`/`services/editor/` in map tree.
- Reports/dashboards consume map evidence references or structured handoff objects — confirmed. Pattern: `buildMapReportHandoffDraft` → `buildPendingReportInsertFromMapHandoff` → `enqueuePendingReportInsert` → localStorage. Zero direct map-state reads from reporting code.

- Spatial evidence/provenance changes: None.
- CRS, geometry, or measurement changes: None.
- Scientific QA changes: None.
- Layer registry or persistence changes: None.
- Workflow/export/report changes: None.
- Cross-module contracts changed: None mutated. Several confirmed and resolved (see Contract Registry update — `MAP_LAYER_REGISTRY_EVENT` resolved to `synapse-map-layer-registry-change`).
- Validation run: No code changed; per prompt guidance, recorded documentation validation only. Architecture report cross-checked against actual file paths, line numbers, and exported names from Explore subagent trace.
- Validation result: Documentation accurate; all cited file paths and line numbers exist in current repo.
- Risks or blockers:
  - `MapExplorerModal.tsx` orchestrator at 198 KB with 60+ direct child component imports — confirmed super-component. Prompts 05 (Modal Shell Decomposition) and 06 (Premium Workspace Shell) must extract handlers/selectors before further wiring is added.
  - `MapExplorerModal` imports `appStore` and `useFlowStore` for modal-lifecycle context only — acceptable, but Prompt 05 should encapsulate behind a hook (e.g. `useMapModalLifecycle`) so the boundary stays reviewable.
  - UA's `mapContextAdapter` and `mapEvidencePublisher` use `useMapExplorerStore.getState()` directly — acceptable point reads, but Prompt 02 (Map Context Kernel and Selectors) should expose a stable `MapContextSummary` selector so UA does not depend on the full `MapExplorerState` shape.
  - No circular dependencies detected. No ownership violations detected.
- Next recommended prompt: Prompt 02 - Map Context Kernel and Selectors.
- Ledger updated: yes

### Prompt 02 - Map Context Kernel and Selectors

- Date: 2026-05-10
- Agent: Claude Opus 4.7 (Claude Code)
- Status: completed
- Files inspected:
  - `src/centerpanel/components/map/mapTypes.ts` (BaseLayerId, OverlayLayerConfig, MapLayerRegistryLayerSummary, DrawnFeature, ViewportState)
  - `src/centerpanel/components/map/mapExperience.ts` (pure-logic module pattern reference)
  - `src/centerpanel/components/map/MapStatusBar.tsx`, `MapWorkspaceCockpit.tsx` (no direct store reads — receive props from `MapExplorerModal`)
  - `src/centerpanel/components/map/index.ts` (barrel exports)
  - `src/centerpanel/components/map/__tests__/map-layer-management.test.ts:347-377` (registry event payload regression test)
  - `src/stores/useMapExplorerStore.ts` (full state shape; private helpers `resolveLayerRegistryCrs`, `summarizeLayerForRegistry`, `resolveOverlayLayerQueryable`; partialize/persist config at lines 1462-1481)
  - `src/services/map/MapScientificQA.ts` (lines 17-86: severity / category / `MapScientificQAState`)
  - `src/services/map/MapSyncService.ts` (viewport sync prior art for typed cross-module payloads)
  - `src/services/map/MapAnalysisBounds.ts`
- Files changed:
  - `src/centerpanel/components/map/mapContextSummary.ts` (NEW — context kernel module: types, builder, memoised selectors, layer summarizer single source of truth)
  - `src/centerpanel/components/map/index.ts` (barrel re-export of new types/selectors)
  - `src/stores/useMapExplorerStore.ts` (deleted local `summarizeLayerForRegistry` + `resolveLayerRegistryCrs` + `resolveOverlayLayerQueryable` helpers; imports them from `mapContextSummary`; dropped now-unused `MapLayerRegistryLayerSummary` type import)
  - `src/centerpanel/components/map/__tests__/mapContextSummary.test.ts` (NEW — 12 tests)
- Behavior implemented:
  - **`MapExplorerContextSummary`** type publishes a lightweight, ID-only spatial context: viewport summary (center/zoom/bearing/pitch/baseLayerId), `currentBounds` + timestamp, `activeAoi` reference (id + geometry family + optional bbox derived from coordinates), `visibleLayerIds`, `selectedLayerIds` (= all layer IDs in stack order), `activeAnalysisResultLayerIds`, `selection` summary (per-layer counts + total), `qa` summary (status / checkedAt / layerCount / blockedLayerCount / severity-bucket issueCounts), plus deterministic `contextId` (FNV-1a 32-bit hex) and `updatedAt` derived from the latest available timestamp in source state.
  - **Pure builder** `buildMapExplorerContextSummary(input)` with explicit `MapExplorerContextSummaryInput` shape — testable without constructing the full Zustand store.
  - **Selectors** `selectMapExplorerContextSummary` (memoised by `contextId` so unchanged content returns the same instance — Zustand-friendly), `selectMapExplorerLayerSummaries`, `selectMapExplorerVisibleLayerSummaries`.
  - **Layer summarizer single source of truth**: `summarizeOverlayLayer`, `resolveOverlayLayerCrs`, `resolveOverlayLayerQueryable` extracted to `mapContextSummary.ts`. The store's `MAP_LAYER_REGISTRY_EVENT` subscriber now imports `summarizeOverlayLayer` from there, so the context summary and the registry event payload cannot drift apart.
  - **No UI changes.** `MapStatusBar` and `MapWorkspaceCockpit` consume props (not the store directly), so "connect to status/cockpit only where safe" is satisfied by exposing the new selectors via the `index.ts` barrel for future migration without touching the modal in this prompt.
- Spatial evidence/provenance changes: None (context summary references existing layer/AOI IDs only — no new evidence objects).
- CRS, geometry, or measurement changes: AOI bbox is now computed from the active drawn polygon's coordinates and surfaced in the context summary. No new geometry mutation.
- Scientific QA changes: QA is exposed in the context summary via aggregate counts only (status, checkedAt, layerCount, blockedLayerCount, severity buckets). No QA computation changed.
- Layer registry or persistence changes: Persistence shape unchanged (`partialize` untouched). Registry event payload unchanged — the store now uses the extracted `summarizeOverlayLayer` for identical output. Validated by the existing registry-event regression test.
- Workflow/export/report changes: None.
- Cross-module contracts changed: New stable contract `MapExplorerContextSummary` published from the map module, ready for Prompt 16 to migrate UA's `mapContextAdapter`/`mapEvidencePublisher` `getState()` calls onto the selector.
- Validation run:
  - `npm run typecheck` → passed (silent exit 0).
  - `npx vitest run src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts` → 53 tests passed (12 new + 41 existing including the registry-event payload regression).
  - `npx eslint` on the four touched files → clean.
- Validation result: All targeted gates green. The 1 pre-existing UA lint error in `workflowReadiness.ts` is unchanged and out of Map Explorer scope.
- Risks or blockers:
  - Memoization cache in `selectMapExplorerContextSummary` is module-local (single-instance assumption — fine for the singleton Zustand store, but tests must reset via `_resetMapContextSummaryCacheForTests()`). Not a hazard for production.
  - `selectedLayerIds` currently equals all layer IDs; if a future prompt introduces an explicit "selected" concept distinct from "all layers", this field's semantics need to evolve.
  - AOI bbox computation walks all coordinates each summary build; cheap for AOI polygons but worth memoizing per-feature if AOIs grow large in later prompts.
- Next recommended prompt: Prompt 03 - Map Evidence Artifact Model Foundation.
- Ledger updated: yes

### Prompt 03 - Map Evidence Artifact Model Foundation

- Date: 2026-05-10
- Agent: Codex
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 7.4, 9.2, 15.4
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` Shared Artifact Model and canonical provenance/QA snippets
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 03 block
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json` Prompt 03 entry
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/centerpanel/components/map/mapContextSummary.ts`
  - `src/centerpanel/components/map/index.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/stores/__tests__/useMapExplorerStore.test.ts`
  - `src/services/map/MapEngineAdapter.ts`
  - `src/services/map/MapReportHandoffService.ts`
  - `src/services/map/MapReviewSessionService.ts`
  - `src/services/map/MapExportService.ts`
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/__tests__/MapEngineAdapter.test.ts`
  - `src/services/map/__tests__/MapReportHandoffService.test.ts`
  - `src/features/urbanAnalytics/context/evidenceArtifacts.ts`
  - `src/features/urbanAnalytics/lib/types.ts`
  - `src/features/urbanAnalytics/useUrbanContextStore.ts`
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added exported `MapEvidenceArtifact` model, kind/source/state/QA/provenance/CRS/geometry/export/report reference types.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` — added pure creation, normalization, upsert, patch, selector, and adapter helpers for layer, AOI, workflow result, QA finding, export, and report snapshot artifacts.
  - `src/stores/useMapExplorerStore.ts` — added non-persisted `mapEvidenceArtifacts` registry, register/upsert/update/clear actions, and selectors/hooks by layer, AOI, workflow, and source.
  - `src/centerpanel/components/map/index.ts` — re-exported artifact model and helper APIs.
  - `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts` — added focused registry/helper tests.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable execution state.
- Behavior implemented:
  - First-class `MapEvidenceArtifact` foundation with stable `id`/`artifactId`, kind, title, source module, linked layer/AOI/run/workflow/file/artifact IDs, provenance, QA, metadata, timestamps, and lifecycle state.
  - Map-specific provenance records source layer IDs, derived layer ID, CRS summary, geometry summary, workflow/run IDs, export reference, report reference, layer provenance, parent/input artifact IDs, and notes.
  - Pure adapters create artifacts for layers, AOIs, workflow results, QA findings, publication exports, and report snapshots without copying heavy payloads.
  - Registry actions are in-memory only and store reference records; Prompt 04 owns persistence boundaries.
  - Selectors filter artifacts by layer, AOI, workflow, and source module.
- UX changes: None.
- Spatial evidence/provenance changes: New map evidence artifact reference model. Artifacts preserve source/derived layer IDs, AOI IDs, workflow/run IDs, CRS summaries, geometry summaries, QA issue IDs, and export/report references.
- CRS, geometry, or measurement changes: No spatial calculations changed. AOI and layer adapters record declared/display CRS and geometry summaries only; missing CRS remains explicit and unknown rather than inferred.
- Scientific QA changes: No QA computation changed. QA artifacts and artifact QA summaries record existing issue IDs, caveats, checkedAt values, and blocker counts by reference.
- Layer registry or persistence changes: Added separate non-persisted evidence registry slice to `useMapExplorerStore`. Existing layer registry event payloads and persistence partialize shape are unchanged.
- Workflow/export/report changes: No existing workflow/export/report behavior changed. New adapters can represent workflow results, exports, and report snapshots as map evidence artifacts.
- Cross-module contract changes: New exported Map Explorer contract `MapEvidenceArtifact` and helper APIs from `src/centerpanel/components/map/index.ts`; no consumer migration yet.
- Performance/data movement changes: Evidence artifacts intentionally exclude `sourceData`, GeoJSON, raw tables, screenshots, canvases, and large render state. Store cap is `MAX_MAP_EVIDENCE_ARTIFACTS = 200`.
- Accessibility changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/stores/__tests__/useMapExplorerStore.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts --reporter=verbose`
  - `npm run lint:errors`
  - `npx eslint src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapEvidenceArtifacts.ts src/centerpanel/components/map/index.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/stores/useMapExplorerStore.ts --quiet`
- Validation results:
  - Typecheck passed.
  - Targeted vitest passed: 4 files, 78/78 tests.
  - Global lint still reports the known unrelated UA error in `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` (`UrbanMethodValidityEnvelope` unused).
  - Touched Map Explorer files lint clean.
- Known risks:
  - Prompt 03 intentionally does not migrate existing layer/report/export workflows to automatically register every artifact; later prompts own that integration.
  - Map evidence registry is non-persisted until Prompt 04 defines persistence boundaries and project snapshot shape.
- Blockers: None.
- Decisions made:
  - Map evidence records store IDs and scalar summaries only; raw geometries, render images, sourceData, and table payloads remain in the owning map/service/report stores.
  - Missing CRS is recorded as missing/unknown with caveats; no analytical CRS readiness is inferred from display coordinates.
- Next recommended prompt: Prompt 04 - Store Persistence Boundaries and Project Snapshots.
- Ledger updated: yes

### Prompt 04 - Store Persistence Boundaries and Project Snapshots

- Date: 2026-05-10
- Agent: Codex
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` section 10 and section 14.7
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 12 Persistence and Restore
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 04 block
  - `src/stores/useMapExplorerStore.ts`
  - `src/services/map/MapPersistenceService.ts`
  - `src/services/map/__tests__/MapPersistenceService.test.ts`
  - `src/centerpanel/components/map/mapTypes.ts`
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added layer persistence/restore metadata types and optional `LayerMetadata.persistence`.
  - `src/services/map/MapPersistenceService.ts` — upgraded snapshots to version 3; added persistence boundary metadata, layout/measurement fields, layer references, evidence references, QA summary, review timeline references, external/stale reference lists, and truthful restore metadata.
  - `src/services/map/__tests__/MapPersistenceService.test.ts` — added coverage for reference snapshots, oversized metadata-only layers, and external URL restore references.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable execution state.
- Behavior implemented:
  - Current Zustand local-storage behavior preserved: viewport, base layer, pins, bookmarks, annotations/settings, selected feature IDs, active AOI ID, active analysis result layer IDs, and layout preferences remain the store partialize surface.
  - `MapProjectSnapshot` v3 now records a code-level persistence boundary, optional layout preferences, measurements, lightweight `layerReferences`, `evidenceArtifacts` references, `qaSummary`, `reviewTimeline`, and `references` (`contextSummaryId`, evidence artifact IDs, publication manifests, report handoffs, external source refs, stale layer IDs).
  - `PersistedOverlayLayer` now preserves source kind, queryability, QA status, provenance, source reference, restore state, and restore warnings.
  - Restored layers receive `metadata.persistence` so UI/bridges can truthfully distinguish `restored`, `external-reference`, `metadata-only`, and `stale-reference` layers.
  - Oversized layer payloads are not persisted; they are restored as stale metadata references with warnings. External URL layers restore as external references that require reload.
- UX changes: None.
- Spatial evidence/provenance changes: Project snapshots now persist map evidence artifact references and layer provenance metadata only. No raw evidence payloads were added.
- CRS, geometry, or measurement changes: No calculations changed. Snapshot layer references preserve declared CRS/geometry/bounds metadata when available; missing or stale source data remains explicit.
- Scientific QA changes: No QA computation changed. Snapshots now store QA summaries and issue IDs for restore context.
- Layer registry or persistence changes: Snapshot schema upgraded from version 2 to version 3 with migration from older snapshots. Large layer payload policy remains bounded; metadata-only/stale states are now explicit.
- Workflow/export/report changes: Snapshot references can carry publication manifest IDs and report handoff IDs. Existing report/export behavior unchanged.
- Cross-module contract changes: `MapProjectSnapshot` v3 is the durable map project snapshot contract for later Urban/IDE/report/dashboard bridge work.
- Performance/data movement changes: Large GeoJSON remains excluded when it exceeds the inline limit. `persistedFeatureCount` now counts actually persisted inline/restorable layer features, not metadata-only layer feature counts.
- Accessibility changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npx vitest run src/services/map/__tests__/MapPersistenceService.test.ts --reporter=verbose`
  - `npm run lint:errors`
  - `npx eslint src/services/map/MapPersistenceService.ts src/services/map/__tests__/MapPersistenceService.test.ts src/centerpanel/components/map/mapTypes.ts --quiet`
- Validation results:
  - Typecheck passed.
  - `MapPersistenceService` tests passed: 11/11.
  - Global lint still reports the known unrelated UA error in `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` (`UrbanMethodValidityEnvelope` unused).
  - Touched Map persistence files lint clean.
- Known risks:
  - Snapshot v3 is backward compatible through migration, but older UI surfaces do not yet display the new restore warnings. Prompt 05+ should expose these where relevant.
  - Local store still persists `selectedFeatureIds` because this prompt preserved current store behavior; future cleanup should be explicit if product wants that treated as volatile only.
- Blockers: None.
- Decisions made:
  - Keep existing small-inline layer restore behavior, but make oversized/external/metadata-only source states explicit.
  - Store evidence artifacts in snapshots as lightweight references, not full module-owned payloads.
  - Count only actually persisted/restorable inline layer features in restored feature counts.
- Next recommended prompt: Prompt 05 - Modal Shell Decomposition and Command Hooks.
- Ledger updated: yes

### Prompt 05 - Modal Shell Decomposition and Command Hooks

- Date: 2026-05-10
- Agent: GPT-5.4 (GitHub Copilot)
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Plan authority: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/useLayerSync.ts`
  - `src/centerpanel/components/map/useMapKeyboardControls.ts`
  - `src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx`
  - `src/services/map/MapAnalysisDispatcher.ts`
  - `src/services/map/MapReviewSessionService.ts`
- Files changed:
  - `src/centerpanel/components/map/useMapPanelCommands.ts` — new hook for right-panel and dock choreography, panel toggles, and scientific QA open command.
  - `src/centerpanel/components/map/useMapAoiDispatch.ts` — new hook for AOI dispatch, selection statistics, and map-extent restriction commands.
  - `src/centerpanel/components/MapExplorerModal.tsx` — removed inline command blocks and wired the modal to the new hooks while preserving local state ownership.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable execution state.
- Behavior implemented:
  - Extracted panel command choreography from `MapExplorerModal` into `useMapPanelCommands`, including dock closing helpers, QA/NL/workflow/review toggles, sidebar toggle, and analytic side-panel exclusivity rules.
  - Extracted AOI dispatch commands into `useMapAoiDispatch`, including extent restriction feedback, workflow dispatch dialog gating, selection statistics dispatch, AOI workflow dispatch, and isochrone dispatch.
  - Kept modal state, review-event recording, toasts, and announcer behavior in the same control flow, but moved command logic behind injected setters and callbacks.
  - Intentionally deferred `handleAnalysisRecommendationAction` and workflow apply/report handlers from this prompt because they remain more coupled and belong to later decomposition prompts.
- UX changes: None intended. This prompt preserves visible behavior and interaction wording while reducing `MapExplorerModal` command density.
- Spatial evidence/provenance changes: None.
- CRS, geometry, or measurement changes: None.
- Scientific QA changes: No QA computation changes. QA panel opening/closing logic is now encapsulated in a dedicated hook.
- Layer registry or persistence changes: None.
- Workflow/export/report changes: No workflow/report behavior changes. Only workflow drawer and AOI dispatch command wiring moved behind hooks.
- Cross-module contract changes: None. This is an internal Map Explorer shell boundary refactor only.
- Performance/data movement changes: None material. No new stores or cross-module payload movement introduced.
- Accessibility changes: Existing announcer messages were preserved; command extraction did not change keyboard or screen-reader semantics.
- Validation commands:
  - VS Code file diagnostics via `get_errors` on `src/centerpanel/components/MapExplorerModal.tsx`
  - VS Code file diagnostics via `get_errors` on `src/centerpanel/components/map/useMapPanelCommands.ts`
  - VS Code file diagnostics via `get_errors` on `src/centerpanel/components/map/useMapAoiDispatch.ts`
  - `npm install`
  - `npm run typecheck`
  - `npx vitest run src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx src/services/map/__tests__/MapAnalysisDispatcher.test.ts`
- Validation results:
  - No errors found in the three touched implementation files.
  - Dependencies were restored with `npm install`.
  - `npm run typecheck` passed.
  - Focused Vitest validation passed: 2 files, 3/3 tests.
- Known risks:
  - `MapExplorerModal` still owns the underlying transient state and several coupled command clusters; this prompt only extracts the safest command slices.
  - Recommendation routing and workflow apply/report actions remain inline and should be handled by later prompts instead of being force-extracted here.
- Blockers:
  - None for Prompt 05 scope.
- Decisions made:
  - Preserve modal state ownership and use dependency-injected hooks instead of introducing another store or widening contracts.
  - Limit Prompt 05 extraction to command slices with clear input/output boundaries and no visible behavior change.
- Next recommended prompt: Prompt 06 - Premium Workspace Shell and Context Strip.
- Ledger updated: yes

### Prompt 06 - Premium Workspace Shell and Context Strip

- Date: 2026-05-10
- Agent: GPT-5.4 (GitHub Copilot)
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Plan authority: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/mapContextSummary.ts`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` — added a truthful context strip driven by real layer, AOI, selection, QA, workflow, export, and sync state.
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` — added compact responsive styling for the context strip and tightened navigator cockpit layout density.
  - `src/centerpanel/components/map/MapStatusBar.tsx` — added AOI, selection, and QA semantics to the bottom status line.
  - `src/centerpanel/components/MapExplorerModal.tsx` — wired the cockpit/status strip to `selectMapExplorerContextSummary`, existing QA/workflow/sync signals, and slightly tightened navigator-stage sizing.
  - `src/centerpanel/components/map/__tests__/map-components.test.ts` — added focused render coverage for the new cockpit context strip and enriched status bar.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable execution state.
- Behavior implemented:
  - Added a compact premium context strip to the navigator cockpit that surfaces the actual visible stack, active AOI, feature selection, QA state, workflow readiness, export surface, and sync state.
  - Reused `MapExplorerContextSummary` plus existing modal-derived QA/workflow/sync signals instead of inventing a second state path, keeping the shell truthful and aligned with Prompt 02.
  - Tightened navigator-stage width/max-height constraints so the cockpit remains map-first and leaves more breathing room around persistent map controls.
  - Extended the bottom status bar with selection count, AOI state, and QA summary so the workspace retains context even outside navigator mode.
- UX changes:
  - Navigator mode now has a visible premium context strip and a denser, more truthful bottom status line.
  - The workspace remains structurally familiar: no new card stacks, no placeholder chrome, and no change to the underlying map interaction model.
- Spatial evidence/provenance changes: None. The shell reads existing summary/state only and does not create or mutate map evidence artifacts.
- CRS, geometry, or measurement changes: No computation changes. AOI messaging is derived from existing `MapExplorerContextSummary` AOI references and current bounds only.
- Scientific QA changes: No QA computation changes. QA status, issue count, and blocker count are now surfaced more clearly in the navigator cockpit and status bar.
- Layer registry or persistence changes: None.
- Workflow/export/report changes: No workflow or export mechanics changed. The shell now truthfully communicates workflow and export readiness using existing derived state.
- Cross-module contract changes: None. Prompt 06 consumes the existing `MapExplorerContextSummary` contract rather than widening bridge APIs.
- Performance/data movement changes: None material. No heavy geometry or raw datasets were introduced into shell props.
- Accessibility changes:
  - Context strip items carry readable `aria-label` summaries.
  - Existing status bar role semantics remain intact.
- Validation commands:
  - `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts`
  - `npm run typecheck`
  - `npm run dev`
- Validation results:
  - Focused component render validation passed: 59/59.
  - The first focused Vitest run exposed a local `featureCount` initialization-order bug in `MapWorkspaceCockpit.tsx`; it was repaired immediately and the same focused test reran cleanly.
  - Full TypeScript project typecheck passed.
  - Dev server launched successfully and the default shell loaded in-browser. Automated smoke reached the IDE shell and Map Bridge surface, but the default landing path did not expose a direct Map Explorer entrypoint for deeper browser-driven map inspection.
- Known risks:
  - Prompt 07 will need to keep the new context strip aligned with richer layer registry metadata so readiness wording stays truthful as metadata becomes more granular.
  - Manual browser smoke for the actual navigator map surface remains partially unverified because the current landing shell does not directly surface a Map Explorer entrypoint in the automated flow.
- Blockers:
  - None for Prompt 06 scope.
- Decisions made:
  - Reuse `selectMapExplorerContextSummary` as the shell truth source instead of adding new summary state to `MapExplorerModal`.
  - Keep the context strip flat and instrument-like rather than introducing additional boxed cards or a broader shell redesign.
- Next recommended prompt: Prompt 07 - Layer Registry Metadata Upgrade.
- Ledger updated: yes

### Prompt 07 - Layer Registry Metadata Upgrade

- Date: 2026-05-10
- Agent: GPT-5.4 (GitHub Copilot)
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Plan authority: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/centerpanel/components/map/mapContextSummary.ts`
  - `src/stores/useMapExplorerStore.ts`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/index.ts`
  - `src/services/map/MapDataImporter.ts`
  - `src/services/map/MapEngineAdapter.ts`
  - Focused map and service test files for layer registry, context summaries, import metadata, and analysis adapters.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added normalized registry metadata, CRS/geometry/schema/license summaries, publication readiness, readiness summary, evidence artifact ID support, and lightweight registry-summary fields.
  - `src/centerpanel/components/map/mapLayerMetadata.ts` — added shared compatibility normalization helpers for source kind, provenance, QA, queryability, CRS, geometry, schema, license/attribution, readiness, and top-level layer normalization.
  - `src/centerpanel/components/map/mapContextSummary.ts` — moved registry-event/context layer summaries onto the shared normalizer and widened payloads with scalar readiness metadata only.
  - `src/stores/useMapExplorerStore.ts` — normalized layers on add/replace/update plus QA/staleness transitions so registry readiness does not drift.
  - `src/services/map/MapDataImporter.ts` — added schema and geometry summaries to feature collection metadata and normalized imported layers at creation.
  - `src/services/map/MapEngineAdapter.ts` — normalized analysis output layers before publication.
  - `src/centerpanel/components/map/MapLayerManager.tsx` — reused shared metadata normalization for inspector/source/QA/queryability/CRS/provenance display and surfaced publication readiness in the existing popover.
  - `src/centerpanel/components/map/index.ts` — exported new types and helper functions.
  - Focused tests updated for expanded summaries, truthful legacy degradation, store normalization, import metadata, and adapter compatibility.
- Behavior implemented:
  - Layers now carry a normalized `metadata.registry` sidecar with source kind, provenance, QA, queryability, CRS, geometry, schema, license/attribution, evidence artifact ID, publication readiness, and readiness booleans.
  - Legacy layers degrade truthfully: missing CRS/schema/license/provenance produce `needs-review` rather than implied readiness.
  - Registry event and context summary payloads remain lightweight and scalar: no raw GeoJSON, features, large schemas, or geometry buffers are emitted.
- Spatial evidence/provenance changes:
  - Provenance is normalized from explicit layer provenance, analysis metadata, dataset context, external service metadata, EO metadata, or safe compatibility defaults.
  - Evidence artifact IDs can be carried through layer metadata and emitted in lightweight registry summaries when present.
- CRS, geometry, or measurement changes:
  - Added CRS summary status without performing new spatial measurements.
  - Added geometry and feature-count summaries from existing metadata/import artifacts only; no new area/distance computation was introduced.
- Scientific QA changes:
  - QA status now feeds publication readiness and stale analysis outputs normalize to warning readiness.
  - Scientific QA computation itself was not changed.
- Layer registry or persistence changes:
  - Store normalization now applies on layer add, replace, metadata update, QA state transitions, and stale analysis marking.
  - Persisted layer schema remains additive and backward compatible.
- Workflow/export/report changes:
  - No workflow, export, or report mechanics changed. Publication readiness is now available for later gates.
- Cross-module contract changes:
  - `MapLayerRegistryLayerSummary` widened with scalar metadata/readiness fields only.
  - No Urban Analytics or Synapse IDE ownership boundary changed.
- UX changes:
  - Existing Layer Manager metadata popover now shows the normalized publication readiness state and uses truthful unknown CRS wording.
  - No broader layer-manager redesign was attempted; Prompt 08 owns premium UX and safety polish.
- Validation commands:
  - `npx vitest run src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts`
  - `npm run typecheck`
  - `npx eslint src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapLayerMetadata.ts src/centerpanel/components/map/mapContextSummary.ts src/stores/useMapExplorerStore.ts src/services/map/MapDataImporter.ts src/services/map/MapEngineAdapter.ts src/centerpanel/components/map/MapLayerManager.tsx src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/services/map/__tests__/MapDataIO.test.ts --quiet`
- Validation results:
  - Focused Vitest validation passed: 94/94.
  - Full TypeScript project typecheck passed.
  - Focused ESLint quiet pass produced no errors.
  - `runTests` tool could not discover the focused Vitest files, so the project Vitest CLI was used.
- Known risks:
  - Prompt 08 should decide how much of the new readiness state becomes visible badges/actions in the premium layer manager without overloading the layer stack.
  - Deeper evidence-producing engine outputs still belong to Prompt 13; Prompt 07 only added the registry fields and compatibility plumbing.
- Blockers:
  - None for Prompt 07 scope.
- Decisions made:
  - Use an additive `metadata.registry` sidecar instead of replacing existing metadata fields.
  - Centralize compatibility defaults in `mapLayerMetadata.ts` so store, context summaries, adapters, and layer inspector do not drift.
  - Treat missing CRS/license/schema/provenance as `needs-review`, not ready.
- Next recommended prompt: Prompt 08 - Layer Manager Premium UX and Safety.
- Ledger updated: yes

### Prompt 08 - Layer Manager Premium UX and Safety

- Date: 2026-05-10
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — confirmed Prompt 07 complete and Prompt 08 pending before work.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 13.4, 15.1-15.4, 16.3, and 17.1-17.4 — layer evidence registry, metadata, left rail, and scientific QA requirements.
  - `src/centerpanel/components/map/MapLayerManager.tsx` — layer row, metadata popover, existing symbology/cartography actions, delete behavior, search, and grouping.
  - `src/centerpanel/components/map/MapLayerPanel.tsx` — base layer selector audit; no Prompt 08 change needed.
  - `src/centerpanel/components/MapExplorerModal.tsx` — existing `MapLayerManager` wiring and report/symbology handlers.
  - `src/centerpanel/components/map/mapTypes.ts` and `src/centerpanel/components/map/mapLayerMetadata.ts` — Prompt 07 registry/readiness contract reused as the badge/action source of truth.
  - `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` — focused layer manager regression surface.
- Files changed:
  - `src/centerpanel/components/map/MapLayerManager.tsx` — added compact registry-driven badge rail, evidence action menu, disabled action reasons, optional future layer action callbacks, metadata-popover report gating, readiness-aware search, and two-step delete confirmation.
  - `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` — added Prompt 08 render/disabled-reason coverage and updated delete regression to require confirmation.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, and validation history.
- Summary:
  - Layer rows now show source kind, derived/source state, scientific QA, CRS, queryability, and publication readiness as compact premium badges sourced from `normalizeLayerRegistryMetadata(layer)`.
  - Row action menu now exposes Export, Urban, IDE, Report, and Dashboard actions with explicit disabled reasons when metadata/readiness blocks the action or the owning bridge is not attached.
  - Delete now arms an inline confirmation state before calling `onRemoveLayer`, with Cancel/Escape support and screen-reader announcements.
  - Existing toggle, opacity, reorder, symbology, cartography review, and add-layer flows remain in place.
- Spatial evidence/provenance changes:
  - No new evidence artifacts are created in Prompt 08.
  - Provenance remains read from normalized layer registry metadata and is surfaced in badge titles/action safety reasons only.
- CRS, geometry, or measurement changes:
  - No spatial calculations changed.
  - Missing CRS is shown as a blocking/needs-review badge and handoff reason; it is not inferred.
- Scientific QA changes:
  - No QA computation changed.
  - Existing QA status and scientific QA badges now propagate into layer-row badges and publication action gates.
- Layer registry or persistence changes:
  - No persistence schema changed.
  - Layer manager consumes the Prompt 07 registry normalizer for UI state, search text, and action gating so row display and metadata popover do not drift from registry readiness.
- Workflow/export/report changes:
  - Report handoff from the metadata popover and row action menu now respects publication readiness before calling `onAddLayerToReport`.
  - Export, Urban, IDE, and Dashboard actions are surfaced as optional callback contracts with disabled reasons; no cross-module handler is wired in this prompt.
- Contract changes:
  - Added optional `MapLayerManager` props for future `onExportLayer`, `onSendLayerToUrban`, `onOpenLayerInIde`, and `onBindLayerToDashboard` handlers.
  - No direct imports from Urban Analytics, Synapse IDE, dashboard, or export services were added.
- UX changes:
  - Layer stack reads as a denser evidence registry: badges are visible in-row without hiding incomplete metadata layers.
  - Action safety is discoverable through button titles, ARIA labels, and `data-disabled-reason` attributes.
  - Destructive removal is guarded by explicit confirmation rather than a single accidental click.
- Validation:
  - `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts` → passed (42/42).
  - `npm run typecheck` → passed.
  - `npx eslint src/centerpanel/components/map/MapLayerManager.tsx src/centerpanel/components/map/__tests__/map-layer-management.test.ts --quiet` → passed with no output.
  - VS Code diagnostics for the touched files reported no errors.
- Risks:
  - Export, Urban, IDE, and Dashboard callbacks are intentionally optional and not wired to owning modules yet; later prompts must connect them through typed adapters rather than direct store/service coupling.
  - The row action menu adds visible safety surface; future accessibility/premium polish prompts can refine keyboard/menu semantics further.
- Next recommended prompt: Prompt 09 - Scientific QA Model and Panel.
- Ledger updated: yes

### Prompt 09 - Scientific QA Model and Panel

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` — Prompt 09 scope and acceptance criteria.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 5, 14.3, and 17 — scientific truthfulness, QA service upgrade, and QA propagation requirements.
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` QA summary, QA blocker propagation, shared artifact model, and scientific truthfulness sections.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — confirmed Prompt 08 complete and Prompt 09 pending before work.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md` — handoff/ledger requirements.
  - `src/services/map/MapScientificQA.ts` and `src/services/map/MapScientificQA.worker.ts` — current QA model, worker API, metadata checks, geometry checks, gates, and sync evaluation.
  - `src/centerpanel/components/map/ScientificQAPanel.tsx` — current panel summary, issue rendering, and resize behavior.
  - `src/stores/useMapExplorerStore.ts` — current QA layer metadata propagation and map evidence artifact registry actions.
  - `src/centerpanel/components/map/mapTypes.ts`, `mapEvidenceArtifacts.ts`, `mapLayerMetadata.ts`, and `mapContextSummary.ts` — layer QA metadata, evidence QA shape, registry readiness, and cross-module QA summaries.
  - `src/centerpanel/components/MapExplorerModal.tsx` — QA evaluation/wiring and review event behavior.
  - `src/services/map/__tests__/MapScientificQA.test.ts`, `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`, and related QA fixtures in Map/report/context tests.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added canonical QA domain/severity summary types and optional category summaries on layer/evidence QA metadata.
  - `src/services/map/MapScientificQA.ts` — added Prompt 09 QA domains (`crs`, `geometry-validity`, `schema`, `scale`, `missingness`, `source-provenance`, `attribution-license`, `workflow-readiness`, `export-readiness`), domain severities (`pass`, `warning`, `blocked`, `unknown`), category summaries/counts, missing schema/license/provenance warnings, and layer/stack summary propagation while preserving legacy issue severity/API behavior.
  - `src/centerpanel/components/map/ScientificQAPanel.tsx` — added QA domain rows showing severity, reason, affected layers, and recommended fixes; converted the resize handle to a keyboard-capable button.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` — preserved QA category summaries in evidence QA and QA-finding artifacts.
  - `src/stores/useMapExplorerStore.ts` — upserts a QA-finding evidence artifact when scientific QA runs and refreshes existing linked map evidence artifacts with current QA issue IDs, caveats, checked time, and category summaries.
  - `src/services/map/__tests__/MapScientificQA.test.ts` — added category-summary assertions and missing-schema non-pass coverage.
  - `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts` — added category-summary artifact coverage and store-level QA-finding propagation coverage.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, and next pointer.
- Behavior implemented:
  - Scientific QA now exposes a first-class domain summary layer alongside existing deterministic issues, so workflows and panels can distinguish unknown metadata, warnings, and blockers without pretending missing metadata passed.
  - Missing queryable schema metadata and missing license/attribution now become explicit QA warnings.
  - Stack-level QA metadata carries domain counts and summaries while legacy `info/warning/error/blocker` issue severity remains compatible with existing consumers.
- UX changes:
  - The QA panel now includes a compact premium "QA domains" section before issue details, with severity chips, the leading reason, affected layer labels, and a recommended fix where available.
  - The right-rail resize affordance is now an accessible button with arrow-key resizing support.
- Spatial evidence/provenance changes:
  - QA-finding map evidence artifacts are now created/updated from `MapScientificQAState` via the store.
  - Existing linked map evidence artifacts receive refreshed QA issue IDs, caveats, checked time, and category summaries when QA runs; no heavy geometry, source data, or rendered payloads are copied.
- CRS, geometry, or measurement changes:
  - No CRS transformation, geometry operation, distance calculation, or measurement semantics changed.
  - CRS/geometry readiness is summarized more explicitly as pass/warning/blocked/unknown for QA propagation.
- Scientific QA changes:
  - Added canonical QA categories and domain severity summaries.
  - Missing metadata is represented as warning/unknown domain state rather than silent pass.
  - Worker API remained compatible; no worker payload mismatch encountered.
- Layer registry or persistence changes:
  - Layer `metadata.scientificQA` now receives optional `categorySummaries` from QA evaluation.
  - No persistence schema migration required; new fields are additive/optional for restored snapshots and test fixtures.
- Workflow/export/report changes:
  - Workflow and export readiness are represented in QA domain summaries for Prompt 10 to consume.
  - No export/report service behavior changed in Prompt 09.
- Cross-module contract changes:
  - `MapScientificQAState.metadata.categorySummaries` and layer/evidence `qa.categorySummaries` are additive Map-owned contract fields for future Urban Analytics, IDE manifest, report, dashboard, and publication gates.
  - No direct imports from Urban Analytics, Synapse IDE, reporting, dashboard, or education modules were added.
- Performance/data movement changes:
  - Category summaries store short IDs/reasons/fixes only; no GeoJSON/sourceData/canvas/raw table payloads are copied.
  - Existing worker threshold and fallback behavior were preserved.
- Accessibility changes:
  - Scientific QA panel resize control is keyboard reachable and responds to ArrowLeft/ArrowRight, with Shift for larger increments.
- Validation commands:
  - `npx vitest run src/services/map/__tests__/MapScientificQA.test.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`
  - `npm run typecheck`
  - `npx eslint src/services/map/MapScientificQA.ts src/centerpanel/components/map/ScientificQAPanel.tsx src/centerpanel/components/map/mapEvidenceArtifacts.ts src/stores/useMapExplorerStore.ts src/services/map/__tests__/MapScientificQA.test.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/centerpanel/components/map/mapTypes.ts`
- Validation results:
  - Focused Vitest validation passed: 10/10.
  - Full TypeScript project typecheck passed.
  - Focused ESLint validation passed with no errors and no warnings.
  - VS Code diagnostics for touched files reported no errors.
- Known risks:
  - Prompt 10 must connect the new `export-readiness` QA domain to formal publication/export gates; Prompt 09 only models and surfaces the readiness summary.
  - New QA category fields are optional for backward compatibility with persisted/restored snapshots and legacy fixtures.
- Blockers:
  - None.
- Decisions made:
  - Preserve legacy issue severity values (`info`, `warning`, `error`, `blocker`) for existing Map/Urban/report consumers and add Prompt 09 `pass`, `warning`, `blocked`, `unknown` as a category-summary severity layer.
  - Keep QA evidence propagation in the Map store so artifacts receive QA references without cross-module coupling or heavy payload copies.
- Next recommended prompt: Prompt 10 - Publication Readiness Gates.
- Ledger updated: yes

### Prompt 10 - Publication Readiness Gates

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Development plan: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 9.5, 14.5, 14.6, 17.4, and 21.4
  - Alignment spec: `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` Formal Output Gate and publication/report alignment sections
- Files inspected:
  - `src/services/map/MapExportService.ts` — publication composition/export pipeline, legend, scale bar, north arrow, preview, and A0 PDF path.
  - `src/services/map/MapReportHandoffService.ts` — report handoff draft, citations, caveats, reproducibility, pending inserts, and report document conversion.
  - `src/centerpanel/components/MapExportDialog.tsx` — publication export modal controls and download action.
  - `src/centerpanel/components/map/MapReportHandoffDrawer.tsx` — report handoff preview, snapshot controls, and insert/download actions.
  - `src/centerpanel/components/MapExplorerModal.tsx` — export/report orchestration, visible publication layers, snapshot capture, review events, and evidence store actions.
  - `src/centerpanel/components/map/mapLayerMetadata.ts` — normalized layer publication readiness, CRS/schema/license/provenance summaries.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` and `mapTypes.ts` — publication export/report evidence artifact references and QA metadata.
  - `src/services/map/MapScientificQA.ts` — Prompt 09 category summaries, especially `export-readiness`.
  - Focused export/report/dialog tests.
- Files changed:
  - `src/services/map/MapExportService.ts` — added `MapPublicationReadiness`, readiness checks, manifest builder, evidence QA adapter, export result metadata, and A0/export manifest attachment.
  - `src/services/map/MapReportHandoffService.ts` — added `publicationReadiness` to report drafts and threaded readiness status/blockers/warnings through caveats and reproducibility.
  - `src/services/map/MapReviewSessionService.ts` — records report handoff readiness status/counts in review event details.
  - `src/centerpanel/components/MapExplorerModal.tsx` — computes current map publication readiness, blocks formal export/report actions when blocked, and upserts export/report evidence artifacts after successful formal output.
  - `src/centerpanel/components/MapExportDialog.tsx` — displays readiness status, blockers/warnings/caveat counts, and disables formal download on blockers.
  - `src/centerpanel/components/map/MapReportHandoffDrawer.tsx` — displays readiness status in the drawer and disables insert/A0 download on blockers.
  - `src/services/map/__tests__/MapExportService.test.ts` — added readiness/manifest/evidence-QA unit coverage.
  - `src/services/map/__tests__/MapReportHandoffService.test.ts` — added draft readiness and pending insert reproducibility coverage.
  - `src/centerpanel/components/__tests__/MapExportDialog.test.tsx` — added blocked readiness UI coverage.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated prompt state, registries, validation, risk, and next pointer.
- Summary:
  - Formal map exports and report handoffs now pass through a truthful publication readiness gate covering visible layers, title, legend, scale bar, north arrow, attribution/license, CRS/measurement caveats, QA blockers, and caveat capture.
  - Internal exploration, preview rendering, and normal map use remain available; only formal output actions are blocked when readiness is blocked.
  - Successful formal exports/report inserts now register lightweight map evidence artifacts with QA state, readiness status/counts, manifest IDs, file/report references, and linked layer IDs.
- Spatial evidence/provenance changes:
  - Publication export and report snapshot artifacts are created at formal output boundaries using existing map evidence builders.
  - Artifacts store references, readiness QA summaries, scalar metadata, and layer IDs only; no rendered payloads, raw datasets, or heavy geometry are copied.
- CRS, geometry, or measurement changes:
  - No CRS transformation, geometry calculation, or measurement implementation changed.
  - Readiness gates surface unknown CRS/measurement state as blockers or caveats before formal output.
- Scientific QA changes:
  - Prompt 10 consumes Prompt 09 `export-readiness` category summaries and unacknowledged QA blockers in publication readiness.
  - QA warning caveats remain controllable in report handoff options while blockers still gate formal output.
- Layer registry or persistence changes:
  - Reuses `normalizeLayerRegistryMetadata(layer).publicationReadiness` and layer license/CRS/schema/provenance summaries.
  - No persisted map snapshot schema change; new readiness fields are additive on runtime export/report results and drafts.
- Workflow/export/report changes:
  - `MapPublicationExportResult` can carry `readiness` and a `MapPublicationManifest`.
  - `MapReportHandoffDraft` now carries `publicationReadiness`; pending report inserts include readiness status, checked time, blockers, and warnings in reproducibility items.
  - Export/report buttons now block formal output with the leading blocker message instead of silently producing incomplete publication artifacts.
- Contract changes:
  - Added additive Map-owned `MapPublicationReadiness` and `MapPublicationManifest` contracts in `MapExportService.ts`.
  - Added additive `MapReportHandoffDraft.publicationReadiness` for the reporting handoff pipeline.
- UX changes:
  - Publication export modal now shows a compact readiness panel with status chip, blocker/warning/caveat counts, and leading findings.
  - Report handoff drawer now shows readiness status before snapshot details and disables Insert/A0 PDF when formal prerequisites are blocked.
- Validation:
  - `npx vitest run src/services/map/__tests__/MapExportService.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/__tests__/MapExportDialog.test.tsx` passed (26/26).
  - `npm run typecheck` passed.
  - Focused `npx eslint` on touched Prompt 10 map/export/report/dialog/test files passed with `--max-warnings=0`.
  - `npm run lint:errors` remains blocked by unrelated `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused `UrbanMethodValidityEnvelope` import, already present outside Prompt 10 scope.
- Risks:
  - No Prompt 10 blocker remains. Future Prompt 11 should reuse readiness/manifest outputs rather than creating a parallel workflow-readiness contract.
- Next recommended prompt: Prompt 11 - Map Workflow Manifest and Preview.
- Ledger updated: yes

### Prompt 11 - Map Workflow Manifest and Preview

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Development plan: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 9.3, Track M5, 14.2, 18.1, and 18.3
- Files inspected:
  - `src/services/map/MapWorkflowService.ts` — workflow draft/context/preview/apply contracts, derived layer construction, QA metadata, source layer ID collection, and report item construction.
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx` — guided workflow UI, preview metrics, validation, suggestions, apply/report actions, and right-rail/bottom-drawer presentation.
  - `src/centerpanel/components/MapExplorerModal.tsx` — workflow context construction, preview overlay, apply handler, review events, active result layer state, and map evidence store action.
  - `src/centerpanel/components/map/mapTypes.ts` — shared map layer/evidence/metadata contracts.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` — existing workflow-result evidence artifact builder and lightweight metadata rules.
  - `src/services/map/MapAnalysisDispatcher.ts` — map-to-workflow dispatch payloads and AOI/isochrone/hotspot queue patterns.
  - `src/services/map/MapEngineAdapter.ts` — adapter result/output contracts, completed run/map output creation, and bridge round-trip behavior.
  - `src/stores/useFlowStore.ts` — sidecar manifest registry pattern for completed analysis runs.
  - Focused workflow and engine adapter tests.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added shared additive `MapReproducibilityManifest` and nested lightweight reference/QA/CRS/expected-output summary types; layer and analysis metadata can reference a manifest.
  - `src/services/map/MapWorkflowService.ts` — previews now include manifest + expected output summaries; applied results/report items/layers carry applied manifests with output layer and report item references.
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx` — added compact manifest summary panel showing manifest ID, status, source count, CRS state, QA gate counts, and expected output.
  - `src/centerpanel/components/MapExplorerModal.tsx` — preview HUD shows manifest IDs; applied workflow outputs register `workflow-result` map evidence artifacts and review events record manifest/workflow IDs.
  - `src/services/map/MapEngineAdapter.ts` — adapter inputs, analysis metadata, layer metadata, and `MapOutput.metadata` can preserve reproducibility manifests across output round-trips.
  - `src/services/map/__tests__/MapWorkflowService.test.ts` — added preview/apply manifest assertions and blocked-preview QA manifest checks.
  - `src/services/map/__tests__/MapEngineAdapter.test.ts` — added adapter output manifest persistence/round-trip coverage.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risk, and next pointer.
- Summary:
  - Map workflows now produce a reproducibility manifest before commit, with workflow ID, manifest ID, source layer IDs, AOI reference, parameters, CRS summary, QA summary, expected output, source data versions, handoff references, and output layer references.
  - Preview manifests are blocked when workflow blockers exist and record the blocker messages/counts; applied manifests reuse the preview workflow ID and add derived output/report references.
  - Applied workflow outputs now create lightweight map evidence artifacts that link source/derived layers, CRS/geometry summaries, manifest IDs, QA issue counts, and scalar metadata only.
  - Map engine adapter outputs can carry a manifest in analysis/layer/output metadata without mutating Urban Analytics `MapOutput` shape beyond its existing `metadata` field.
- Spatial evidence/provenance changes:
  - Applied workflow outputs register `workflow-result` evidence artifacts at the apply boundary.
  - Evidence artifacts store layer IDs, workflow IDs, manifest IDs, CRS/geometry summaries, QA counts/caveats, and scalar metadata only; no GeoJSON/sourceData/screenshots/raw tables are copied.
- CRS, geometry, or measurement changes:
  - No CRS transformation, geometry algorithm, or measurement calculation was changed.
  - Manifests summarize declared source CRS state and mark missing/mixed CRS metadata explicitly for downstream review.
- Scientific QA changes:
  - Workflow preview/apply manifests include blocker/warning/info counts, QA issue IDs, blocker/warning messages, caveats, and worker-size caveats.
  - Existing layer scientific QA metadata remains intact; derived layers also carry the applied reproducibility manifest in metadata.
- Layer registry or persistence changes:
  - No persisted project snapshot schema change.
  - Layer metadata gained an additive optional `reproducibilityManifest` field; legacy layers remain valid.
- Workflow/export/report changes:
  - `MapWorkflowPreview`, `MapWorkflowApplyResult`, and `MapWorkflowReportItem` now carry `MapReproducibilityManifest`.
  - Workflow drawer preview UI surfaces manifest readiness before apply, while apply still remains disabled by existing blockers.
  - Engine adapter `MapOutput.metadata.reproducibilityManifest` preserves manifests for map-output round-trips.
- Contract changes:
  - Added additive Map-owned `MapReproducibilityManifest` contract in `mapTypes.ts` for workflow/engine output reproducibility.
  - Added optional manifest fields to `LayerMetadata` and `AnalysisResultMetadata`; no cross-module store coupling was introduced.
- UX changes:
  - Workflow drawer now has a compact reproducibility manifest panel below preview metrics.
  - Workflow preview HUD now shows the manifest ID for both workflow layers and comparison previews.
- Validation:
  - `npx vitest run src/services/map/__tests__/MapWorkflowService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts` passed (24/24).
  - `npm run typecheck` passed.
  - Focused `npx eslint --quiet` on touched Prompt 11 service/UI/test files passed.
  - `npm run lint:errors` remains blocked by unrelated `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused `UrbanMethodValidityEnvelope` import.
  - `npm run lint:no-tailwind-centerpanel` is blocked by repo setup: `package.json` references missing `scripts/check-no-tailwind-centerpanel.ps1`, and `powershell` was unavailable in the execution context.
- Risks:
  - No Prompt 11 blocker remains. Prompt 12 should consume the manifest/QA/source-layer summary rather than adding a parallel recommendation readiness payload.
- Next recommended prompt: Prompt 12 - Analysis Recommendation and Dispatch.
- Ledger updated: yes

Use this format for each entry:

```md
### Prompt <ID> - <Title>

- Date:
- Agent:
- Status:
- Files inspected:
- Files changed:
- Summary:
- Spatial evidence/provenance changes:
- CRS, geometry, or measurement changes:
- Scientific QA changes:
- Layer registry or persistence changes:
- Workflow/export/report changes:
- Contract changes:
- UX changes:
- Validation:
- Risks:
- Next recommended prompt:
```

### Operating Pack Installation - Automation Layer

- Date: 2026-05-02
- Agent: Codex
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`
  - `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/*`
  - `src/stores/useMapExplorerStore.ts`
  - `src/services/map/*`
- Files changed:
  - `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`
  - `scripts/get-next-map-explorer-prompt.ps1`
- Summary: Installed an automation-ready operating pack for future Map Explorer implementation agents. This did not execute Prompt 00 or any product implementation prompt.
- Spatial evidence/provenance changes: None in product code.
- CRS, geometry, or measurement changes: None in product code.
- Scientific QA changes: None in product code.
- Layer registry or persistence changes: None in product code.
- Workflow/export/report changes: None in product code.
- Contract changes: None.
- UX changes: None in product UI.
- Validation: Manifest parsed successfully with 30 prompts. Helper script returned Prompt 00 as the next pending prompt.
- Risks: None for product code; no product code changed.
- Next recommended prompt: Prompt 00 - Memory Bootstrapping and Repository Baseline.

## Files Inspected Registry

Append inspected files here as implementation progresses.

| Date | Prompt | Files inspected | Notes |
| --- | --- | --- | --- |
| 2026-05-11 | Prompt 11 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 9.3, Track M5, 14.2, 18.1, 18.3; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/services/map/MapWorkflowService.ts`; `src/centerpanel/components/map/MapWorkflowDrawer.tsx`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/services/map/MapAnalysisDispatcher.ts`; `src/services/map/MapEngineAdapter.ts`; `src/stores/useFlowStore.ts`; focused workflow/adapter tests | Prompt 11 narrowed to workflow preview/apply reproducibility manifests, evidence artifact registration on apply, adapter output manifest preservation, and a compact premium manifest preview panel. |
| 2026-05-11 | Prompt 10 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`; `src/services/map/MapExportService.ts`; `src/services/map/MapReportHandoffService.ts`; `src/services/map/MapReviewSessionService.ts`; `src/centerpanel/components/MapExportDialog.tsx`; `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/mapLayerMetadata.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/services/map/MapScientificQA.ts`; focused export/report/dialog tests | Prompt 10 narrowed to formal publication readiness gates, manifest metadata, report/export evidence registration, and premium UI blocker/warning display without changing spatial calculations. |
| 2026-05-11 | Prompt 09 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`; `src/services/map/MapScientificQA.ts`; `src/services/map/MapScientificQA.worker.ts`; `src/centerpanel/components/map/ScientificQAPanel.tsx`; `src/stores/useMapExplorerStore.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/centerpanel/components/map/mapLayerMetadata.ts`; `src/centerpanel/components/map/mapContextSummary.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; focused QA/evidence tests | Prompt 09 narrowed to first-class QA domain summaries, truthful missing metadata warnings, panel rendering, and QA evidence propagation without changing worker payloads or spatial calculations. |
| 2026-05-10 | Prompt 08 | `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/centerpanel/components/map/MapLayerManager.tsx`; `src/centerpanel/components/map/MapLayerPanel.tsx`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapLayerMetadata.ts`; `src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Prompt 08 narrowed to layer manager premium UX/safety: registry badges, disabled handoff reasons, and guarded removal without rewiring cross-module owners. |
| 2026-05-10 | 07 | `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapContextSummary.ts`; `src/stores/useMapExplorerStore.ts`; `src/centerpanel/components/map/MapLayerManager.tsx`; `src/centerpanel/components/map/index.ts`; `src/services/map/MapDataImporter.ts`; `src/services/map/MapEngineAdapter.ts`; focused registry/import/adapter tests | Prompt 07 narrowed to additive layer metadata normalization, lightweight registry summaries, adapter/importer metadata enrichment, and legacy readiness degradation. |
| 2026-05-10 | 06 | `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`; `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`; `src/centerpanel/components/map/MapStatusBar.tsx`; `src/centerpanel/components/map/mapContextSummary.ts`; `src/centerpanel/components/map/MapCanvas.tsx`; `src/centerpanel/components/map/__tests__/map-components.test.ts` | Prompt 06 narrowed to navigator cockpit/status surfaces and existing context-summary wiring, with shell-level browser smoke limited by the landing flow. |
| 2026-05-10 | 05 | `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/useLayerSync.ts`; `src/centerpanel/components/map/useMapKeyboardControls.ts`; `src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx`; `src/services/map/MapAnalysisDispatcher.ts`; `src/services/map/MapReviewSessionService.ts` | Prompt 05 narrowed to safe extraction only: panel choreography and AOI dispatch command hooks. |
| 2026-05-02 | Operating Pack Installation | `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`, `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/*`, `src/stores/useMapExplorerStore.ts`, `src/services/map/*` | Planning and automation-pack inspection only. |
| 2026-05-10 | Prompt 00 | `package.json`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/MapExplorerButton.tsx`, `src/centerpanel/components/map/*` (17 files), `src/stores/useMapExplorerStore.ts`, `src/services/map/*` (25 files + 18 tests), `src/features/urbanAnalytics/store.ts`, `src/services/editorBridge.ts`, `src/services/editor/bridge.ts` + bridgeAdapter + aiEditorBridgeGlobal, `src/services/reporting/*` (10 files) | All planned Prompt 00 inspection targets present and confirmed. |
| 2026-05-10 | Prompt 01 | `MapExplorerModal.tsx` (lines 29-67, 76-77, 172-178, 710-805, 886, 4047, 4526, 4620-4621), `MapWorkspaceShell.tsx`, `MapWorkspaceCockpit.tsx`, `MapCanvas.tsx`, `MapLayerManager.tsx`, `MapWorkflowDrawer.tsx`, `ScientificQAPanel.tsx`, `MapReportHandoffDrawer.tsx`, `mapTypes.ts` (lines 180-188), `useMapExplorerStore.ts` (lines 131-325), `MapEngineAdapter.ts`, `MapWorkflowService.ts`, `MapScientificQA.ts`, `MapReportHandoffService.ts` (lines 52-63), `MapSyncService.ts`, `MapAnalysisDispatcher.ts`, `MapAnalysisRecommender.ts`, `ExternalServiceConnector.ts` (lines 9-10), `mapContextAdapter.ts`, `mapEvidencePublisher.ts`, `studyAreaSelection.ts`, `services/reporting/storage.ts`, `services/reporting/*` (audit) | Live architecture trace for Prompt 01. No code changed. |
| 2026-05-10 | Prompt 02 | `mapTypes.ts`, `mapExperience.ts`, `MapStatusBar.tsx`, `MapWorkspaceCockpit.tsx`, `index.ts`, `useMapExplorerStore.ts` (lines 1-340, 522-705, 1450-1488), `MapScientificQA.ts` (lines 17-86), `MapSyncService.ts`, `MapAnalysisBounds.ts`, `__tests__/map-layer-management.test.ts` (lines 347-377) | Inspected for context kernel design + regression-safety check. |
| 2026-05-10 | Prompt 03 | `MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 7.4/9.2/15.4, `TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` Shared Artifact Model + provenance/QA snippets, `MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 03, `MAP_EXPLORER_PROMPT_MANIFEST.json`, `MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`, `AGENT_AMNESIA_PREVENTION_PROTOCOL.md`, `mapTypes.ts`, `mapContextSummary.ts`, `index.ts`, `useMapExplorerStore.ts`, `useMapExplorerStore.test.ts`, `MapEngineAdapter.ts`, `MapReportHandoffService.ts`, `MapReviewSessionService.ts`, `MapExportService.ts`, `MapScientificQA.ts`, `MapEngineAdapter.test.ts`, `MapReportHandoffService.test.ts`, Urban evidence artifact types/helpers for alignment only | Inspected for map evidence model placement, registry pattern, service adapter compatibility, and no-heavy-payload constraints. |
| 2026-05-10 | Prompt 04 | `MAP_EXPLORER_DEVELOPMENT_PLAN.md` section 10 and 14.7, `TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 12, `MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 04, `useMapExplorerStore.ts`, `MapPersistenceService.ts`, `MapPersistenceService.test.ts`, `mapTypes.ts` | Audited current store partialize behavior, project snapshot schema, layer source persistence, quota behavior, and stale restore gaps. |

## Files Changed Registry

Append changed files here as implementation progresses.

| Date | Prompt | Files changed | Reason |
| --- | --- | --- | --- |
| 2026-05-11 | Prompt 11 | `src/centerpanel/components/map/mapTypes.ts`, `src/services/map/MapWorkflowService.ts`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/services/map/MapEngineAdapter.ts`, `src/services/map/__tests__/MapWorkflowService.test.ts`, `src/services/map/__tests__/MapEngineAdapter.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added lightweight workflow reproducibility manifests to preview/apply outputs, manifest UI summary, applied workflow evidence artifact registration, engine adapter manifest preservation, and focused coverage. |
| 2026-05-11 | Prompt 10 | `src/services/map/MapExportService.ts`, `src/services/map/MapReportHandoffService.ts`, `src/services/map/MapReviewSessionService.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/MapExportDialog.tsx`, `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`, `src/services/map/__tests__/MapExportService.test.ts`, `src/services/map/__tests__/MapReportHandoffService.test.ts`, `src/centerpanel/components/__tests__/MapExportDialog.test.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added formal publication readiness gates, export/report readiness manifests, blocked-action UI, evidence artifact registration on formal output, review event readiness details, and focused coverage. |
| 2026-05-11 | Prompt 09 | `src/centerpanel/components/map/mapTypes.ts`, `src/services/map/MapScientificQA.ts`, `src/centerpanel/components/map/ScientificQAPanel.tsx`, `src/centerpanel/components/map/mapEvidenceArtifacts.ts`, `src/stores/useMapExplorerStore.ts`, `src/services/map/__tests__/MapScientificQA.test.ts`, `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added first-class QA category/severity summaries, explicit missing schema/license warnings, premium QA domain panel rows, QA-finding artifact upsert, linked evidence QA refresh, and focused coverage. |
| 2026-05-10 | Prompt 08 | `src/centerpanel/components/map/MapLayerManager.tsx`, `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added registry-driven layer badges, disabled layer handoff reasons, guarded report action, two-step delete confirmation, and focused regression coverage. |
| 2026-05-10 | Prompt 07 | `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/map/mapLayerMetadata.ts`, `src/centerpanel/components/map/mapContextSummary.ts`, `src/stores/useMapExplorerStore.ts`, `src/services/map/MapDataImporter.ts`, `src/services/map/MapEngineAdapter.ts`, `src/centerpanel/components/map/MapLayerManager.tsx`, `src/centerpanel/components/map/index.ts`, focused tests, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added normalized scientific layer registry metadata/readiness, compatibility defaults, lightweight summaries, importer/adapter enrichment, and validation coverage. |
| 2026-05-10 | Prompt 06 | `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`, `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`, `src/centerpanel/components/map/MapStatusBar.tsx`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/__tests__/map-components.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Premium workspace shell/context strip landed using existing context summary, QA/workflow/sync signals, responsive cockpit refinements, and focused render coverage. |
| 2026-05-02 | Operating Pack Installation | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`, `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`, `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`, `scripts/get-next-map-explorer-prompt.ps1` | Added automation-ready prompt execution controls. |
| 2026-05-10 | Prompt 00 | `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Documentation-only baseline audit. No product code changed. |
| 2026-05-10 | Prompt 01 | `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Architecture map appended. No product code changed. |
| 2026-05-10 | Prompt 02 | `src/centerpanel/components/map/mapContextSummary.ts` (NEW), `src/centerpanel/components/map/index.ts`, `src/stores/useMapExplorerStore.ts`, `src/centerpanel/components/map/__tests__/mapContextSummary.test.ts` (NEW), `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Context kernel module + memoised selectors; layer summarizer extracted for single source of truth. |
| 2026-05-10 | Prompt 03 | `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/map/mapEvidenceArtifacts.ts`, `src/centerpanel/components/map/index.ts`, `src/stores/useMapExplorerStore.ts`, `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Map evidence artifact type foundation, pure registration/adapters/selectors, non-persisted store registry actions, and focused tests. |
| 2026-05-10 | Prompt 04 | `src/centerpanel/components/map/mapTypes.ts`, `src/services/map/MapPersistenceService.ts`, `src/services/map/__tests__/MapPersistenceService.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Snapshot v3 reference schema, persistence boundary metadata, stale/external restore state, and tests. |

## Cross-Module Contract Registry

Record every contract that connects Map Explorer with Synapse IDE, Urban Analytics, reporting, dashboard, or education.

| Date | Prompt | Contract | Direction | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-05-10 | Prompt 00 | `useMapExplorerStore` | Map Explorer state owner | Confirmed Existing | Located at `src/stores/useMapExplorerStore.ts`; exports `useMapExplorerStore`, `MapExplorerState`, `MapExplorerLayoutPreferences`. 56 KB. |
| 2026-05-10 | Prompt 00 | `MAP_ANALYSIS_DISPATCH_KEY`, `MAP_ANALYSIS_VIEW_RESTRICTION_KEY` | Map Explorer to Urban/workflows | Confirmed Existing | Defined in `src/services/map/MapAnalysisDispatcher.ts`. Payload union: `MapFlowAoiDispatchPayload`, `MapIsochroneDispatchPayload`, `MapHotSpotDispatchPayload`. |
| 2026-05-10 | Prompt 00 | `MapAnalysisDispatcher` (queueMapDispatch / readQueuedMapDispatch / dispatchFlowSelection / dispatchIsochroneNavigation / dispatchHotSpotNavigation) | Map Explorer to workflows | Confirmed Existing | `src/services/map/MapAnalysisDispatcher.ts`. |
| 2026-05-10 | Prompt 00 | `MapWorkflowService` | Map workflow preview/apply | Confirmed Existing | `src/services/map/MapWorkflowService.ts`. |
| 2026-05-10 | Prompt 00 | `MapSyncService` | Map synchronization | Confirmed Existing | `src/services/map/MapSyncService.ts`. |
| 2026-05-10 | Prompt 00 | `MapReportHandoffService` | Map to report | Confirmed Existing | `src/services/map/MapReportHandoffService.ts`. |
| 2026-05-10 | Prompt 00 | `MapScientificQA` (+ worker) | Map QA | Confirmed Existing | `src/services/map/MapScientificQA.ts` and `MapScientificQA.worker.ts`. |
| 2026-05-10 | Prompt 00 | `MapEngineAdapter` (AnalysisAdapterResult and adapter inputs for LISA, HotSpot, Moran, OLS, GWR, PCA, Cluster, LandCover, Detection, Query, CA, CompositeIndicator, ABM, FacilityOptimisation) | Engine result → map layer | Confirmed Existing | `src/services/map/MapEngineAdapter.ts`. |
| 2026-05-10 | Prompt 00 | `ExternalServiceConnector` (WMS/WMTS/WFS/XYZ/Overpass/CityJSON) | External geospatial services | Confirmed Existing | `src/services/map/ExternalServiceConnector.ts`. |
| 2026-05-10 | Prompt 00 | `ideMapHandoff.ts` + `mapToIdeHandoff.ts` | IDE↔Map artifacts | Confirmed Existing (both directions) | Located in `src/services/map/`. Verify canonical bridge before Prompts 18/19. |
| 2026-05-10 | Prompt 00 | `src/services/editorBridge.ts` AND `src/services/editor/bridge.ts` (+ bridgeAdapter, aiEditorBridgeGlobal) | Map Explorer to IDE | Confirmed Existing — duplication risk | Two bridge entry points present; Prompt 18 must clarify canonical owner. |
| 2026-05-10 | Prompt 00 | `voxCityProjection`, `voxCitySelectionService` | 2D↔3D synchronization | Confirmed Existing | `src/services/map/`. |
| 2026-05-10 | Prompt 00 | `MapReviewSessionService` | Review timeline / audit | Confirmed Existing | `src/services/map/MapReviewSessionService.ts`. |
| 2026-05-10 | Prompt 00 | `MapNLQueryBuilder` | NL→spatial query | Confirmed Existing | `src/services/map/MapNLQueryBuilder.ts`. |
| 2026-05-10 | Prompt 00 | `MapPersistenceService` | Map state persistence | Confirmed Existing | `src/services/map/MapPersistenceService.ts`. |
| 2026-05-10 | Prompt 00 | `MapDataImporter`, `MapDataExporter`, `MapExportService` | Import / export | Confirmed Existing | `src/services/map/`. |
| 2026-05-10 | Prompt 01 | `MAP_LAYER_REGISTRY_EVENT = "synapse-map-layer-registry-change"` | Map registry CustomEvent (lightweight pub/sub adjunct to Zustand) | Confirmed Existing | Defined in `src/centerpanel/components/map/mapTypes.ts:188`; payload `MapLayerRegistryChangeDetail` (mapTypes.ts:180-186) = `{operation, layerId?, layers, previousLayers, timestamp}`. Fired on add/remove/toggleVisibility/setOpacity/updateMetadata/reorder/replace. Test coverage at `__tests__/map-layer-management.test.ts:350`. |
| 2026-05-10 | Prompt 01 | `MapContextSummary` selector | Shared map context for UA reads | Proposed (Prompt 02) | UA currently uses `useMapExplorerStore.getState()` directly in `mapContextAdapter.ts` and `mapEvidencePublisher.ts`. Prompt 02 must publish a stable summary selector so UA does not depend on the full `MapExplorerState` shape. |
| 2026-05-10 | Prompt 02 | `MapExplorerContextSummary` + `selectMapExplorerContextSummary` (memoised by `contextId`) | Map → Urban / IDE / future bus | Implemented | `src/centerpanel/components/map/mapContextSummary.ts`. Carries IDs, counts, viewport floats, AOI reference (id + family + optional bbox), and QA aggregates only — never GeoJSON. Re-exported from `src/centerpanel/components/map/index.ts`. UA `mapContextAdapter`/`mapEvidencePublisher` migration deferred to Prompt 16. |
| 2026-05-10 | Prompt 02 | `summarizeOverlayLayer` / `resolveOverlayLayerCrs` / `resolveOverlayLayerQueryable` | Single source of truth for layer registry summaries | Refactored | Extracted from `useMapExplorerStore.ts` into `mapContextSummary.ts`. Store imports the same function for `MAP_LAYER_REGISTRY_EVENT` payload construction, so the registry event and the new context summary cannot drift. Verified by existing payload regression test. |
| 2026-05-10 | Prompt 01 | UA → Map: `useMapExplorerStore.getState()` point reads | UA reading map state | Confirmed Existing (controlled) | `src/features/urbanAnalytics/lib/{mapContextAdapter, mapEvidencePublisher, studyAreaSelection}.ts`. Unidirectional, type-safe via `MapExplorerState` import from `mapTypes.ts`. Acceptable until `MapContextSummary` lands. |
| 2026-05-10 | Prompt 01 | Reporting → Map handoff: `buildMapReportHandoffDraft` → `buildPendingReportInsertFromMapHandoff` → `enqueuePendingReportInsert` → `localStorage[PENDING_INSERTS_KEY]` | Map → Report (one-way structured) | Confirmed Existing | `services/reporting/*` has zero direct imports from `useMapExplorerStore` or `services/map/`. Reports consume only `PendingReportInsert` + `MapReportHandoffDraft` references. Clean boundary. |
| 2026-05-10 | Prompt 01 | Map → IDE: NO imports from `editorStore`/`appStore` (for IDE state)/`services/editor/` in `src/centerpanel/components/map/` or `src/services/map/` | Map ownership boundary | Confirmed Clean | `MapExplorerModal` imports `appStore` (line 76) and `useFlowStore` (line 77) for modal lifecycle / project ID only — not for editor file/tab state. |
| Pending | Pending | `MapExplorerContextSummary` | Shared map context | Proposed | Implement only when prompted. |
| 2026-05-10 | Prompt 03 | `MapEvidenceArtifact` + `mapEvidenceArtifacts.ts` helpers | Map → Urban / Report / Dashboard / IDE future consumers | Implemented | Exported from `src/centerpanel/components/map/index.ts`. Stores stable IDs, linked layer/AOI/run/workflow/file/artifact IDs, map provenance, CRS/geometry summaries, QA, and export/report refs only — no GeoJSON/sourceData/screenshots/raw tables. Store registry is non-persisted until Prompt 04. |
| 2026-05-10 | Prompt 04 | `MapProjectSnapshot` v3 + `MAP_PROJECT_PERSISTENCE_BOUNDARY` | Map project snapshot restore contract | Implemented | `src/services/map/MapPersistenceService.ts`. Persists viewport/base/layout/bookmarks/annotations/drawings/measurements, lightweight layer references, evidence references, QA summary, review timeline references, and stale/external refs. Oversized layer source payloads restore as stale metadata references. |
| 2026-05-10 | Prompt 08 | Optional `MapLayerManager` action callbacks (`onExportLayer`, `onSendLayerToUrban`, `onOpenLayerInIde`, `onAddLayerToReport`, `onBindLayerToDashboard`) | Layer rail UI → future export / Urban / IDE / report / dashboard adapters | UI Surface Implemented; handlers mostly deferred | Row action menu exposes commands with disabled reasons from registry readiness or missing handlers. Only existing report handler can be called, and it is now publication-readiness gated. No direct imports from external owners were added. |
| 2026-05-11 | Prompt 09 | `MapScientificQAState.metadata.categorySummaries` + layer/evidence `qa.categorySummaries` | Map QA → layer metadata / map evidence / future Urban, IDE, report, dashboard consumers | Implemented Additive Contract | Carries nine canonical QA domains with `pass`, `warning`, `blocked`, or `unknown` severity plus issue IDs, affected layer IDs, reasons, and recommended fixes. Optional for backward compatibility; no heavy spatial payloads. |
| 2026-05-11 | Prompt 10 | `MapPublicationReadiness` + `MapPublicationManifest` + `MapReportHandoffDraft.publicationReadiness` | Map formal output → export/report/evidence/review consumers | Implemented Additive Contract | Formal map outputs now carry checked readiness status, blocker/warning/caveat details, visible layer IDs/names, composition metadata, manifest ID/version, and QA signature when present. No heavy spatial/rendered payloads are stored in evidence artifacts. |
| 2026-05-11 | Prompt 11 | `MapReproducibilityManifest` + `LayerMetadata.reproducibilityManifest` + `AnalysisResultMetadata.reproducibilityManifest` | Map workflow/engine output → evidence/report/dashboard/IDE future consumers | Implemented Additive Contract | Workflow previews/apply results now carry manifest IDs, workflow IDs, source/output layer references, AOI reference, parameters, CRS summary, QA summary, expected output, source data versions, and handoff reference arrays. Stored as lightweight metadata only; no raw spatial/rendered payloads. |

## Scientific GIS Decision Registry

Record decisions that future agents must not re-litigate unless the repository proves they are wrong.

| Date | Prompt | Decision | Rationale | Status |
| --- | --- | --- | --- | --- |
| Pending | Pending | Map Explorer owns viewport, layers, AOI, selections, drawing, measurement, spatial QA, map review state, and map-derived evidence. | Required by tri-modal source-of-truth matrix. | Proposed |
| Pending | Pending | Urban Analytics owns method interpretation and method-specific data fitness; Map Explorer provides spatial QA summaries. | Prevents hidden scientific coupling. | Proposed |
| Pending | Pending | Synapse IDE owns code and file state; Map Explorer stores code/file references only. | Prevents Map Explorer from becoming an editor. | Proposed |
| Pending | Pending | Large geometries and raw datasets must remain in map state, services, or referenced external storage, not lightweight evidence payloads. | Protects performance and avoids event payload abuse. | Proposed |
| 2026-05-10 | Prompt 03 | Map evidence artifacts store references, provenance, CRS/geometry summaries, QA issue IDs, and scalar metadata only. | Map-derived outputs become auditable without duplicating GeoJSON, raw datasets, canvases, screenshots, or report assets in Zustand/event payloads. | Accepted |
| 2026-05-10 | Prompt 03 | Missing CRS remains explicit in artifact CRS summaries; display CRS is not treated as analytical readiness. | Prevents false scientific readiness and preserves the rule that analytical distance/area calculations require an explicit projected CRS. | Accepted |
| 2026-05-10 | Prompt 04 | Project snapshots may keep small inline GeoJSON for current restore compatibility, but oversized layer payloads are never forced into lightweight snapshots. | Preserves current behavior while making large/missing source states truthful and bounded by `INLINE_LAYER_DATA_LIMIT_BYTES`. | Accepted |
| 2026-05-10 | Prompt 04 | Metadata-only and external source layers must carry restore warnings and stale/external reference IDs. | Restored map sessions must not imply missing layers or external services are locally available. | Accepted |
| 2026-05-10 | Prompt 08 | Incomplete layer metadata stays visible in the layer rail and disables formal handoff actions with explicit reasons. | Prevents false publication/readiness claims while keeping exploratory layer work available. | Accepted |
| 2026-05-10 | Prompt 08 | Layer removal requires an explicit confirmation step until a full undo stack exists. | Destructive map state edits should not happen on a single accidental click. | Accepted |
| 2026-05-11 | Prompt 09 | Keep legacy QA issue severity (`info`/`warning`/`error`/`blocker`) and add canonical domain severity (`pass`/`warning`/`blocked`/`unknown`) as a summary layer. | Preserves existing Map, Urban, report, persistence, and recommender consumers while satisfying Prompt 09 readiness vocabulary. | Accepted |
| 2026-05-11 | Prompt 09 | Missing schema/license/provenance metadata must create explicit QA caveats instead of allowing a silent pass. | The map must not imply stronger evidence fitness than metadata supports. | Accepted |
| 2026-05-11 | Prompt 10 | Formal export/report actions must be blocked by publication readiness blockers, while internal exploration and previews remain available. | Prevents incomplete or misleading publication artifacts without interrupting analytical map work. | Accepted |
| 2026-05-11 | Prompt 10 | Readiness manifests must store source/context/QA/caveat summaries and artifact references, not rendered screenshots or raw datasets. | Keeps formal outputs reproducible and auditable without violating lightweight evidence and performance boundaries. | Accepted |
| 2026-05-11 | Prompt 11 | Workflow manifests are created at preview time and promoted at apply time; blocked previews still receive a manifest with blocker counts and messages. | Keeps derived outputs auditable before mutation and prevents blocked workflow states from disappearing from review context. | Accepted |
| 2026-05-11 | Prompt 11 | Workflow/engine manifests store layer IDs, source versions, CRS/QA summaries, parameters, and handoff references only. | Preserves reproducibility without duplicating GeoJSON/sourceData or heavy render artifacts in lightweight records. | Accepted |

## Validation History

Append validation runs here.

| Date | Prompt | Command | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-02 | Operating Pack Installation | `Get-Content DEVELOPMENT_PLANS\MAP_EXPLORER_PROMPT_MANIFEST.json -Raw \| ConvertFrom-Json` | Passed | Manifest parsed and reported 30 prompts. |
| 2026-05-02 | Operating Pack Installation | `powershell -ExecutionPolicy Bypass -File scripts\get-next-map-explorer-prompt.ps1` | Passed | Helper returned Prompt 00 as pending. |
| 2026-05-10 | Prompt 00 | `npm run typecheck` | Passed | Silent exit 0; full TS project typechecks cleanly with current Map Explorer surface. |
| 2026-05-10 | Prompt 00 | `npm run lint:errors` | 1 error (out of scope) | `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. Pre-existing in uncommitted UA file; not introduced by Prompt 00. Map Explorer surface lint-clean. |
| 2026-05-10 | Prompt 00 | `git status --short` | Captured | Modified: `.claude/settings.local.json`. Untracked: `src/features/urbanAnalytics/__tests__/workflowReadiness.test.ts`, `src/features/urbanAnalytics/lib/workflowReadiness.ts`. None in Map Explorer scope. |
| 2026-05-10 | Prompt 01 | Documentation validation only | Passed | No code changed (per prompt guidance: "If no code changes were made, record documentation validation only"). All file paths, line numbers, exported names, and event constants in the architecture map cross-checked against repo via Explore subagent trace. |
| 2026-05-10 | Prompt 02 | `npm run typecheck` | Passed | Silent exit 0 after store refactor + new module. |
| 2026-05-10 | Prompt 02 | `npx vitest run src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Passed (53/53) | 12 new tests for context summary + 41 existing layer management tests including the `MAP_LAYER_REGISTRY_EVENT` payload regression. |
| 2026-05-10 | Prompt 02 | `npx eslint` on `mapContextSummary.ts`, `mapContextSummary.test.ts`, `useMapExplorerStore.ts`, `index.ts` | Clean | No lint issues introduced. |
| 2026-05-10 | Prompt 03 | `npm run typecheck` | Passed | Full TypeScript project typechecks after map evidence model and registry additions. |
| 2026-05-10 | Prompt 03 | `npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/stores/__tests__/useMapExplorerStore.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts --reporter=verbose` | Passed (78/78) | Covers new artifact builders/selectors and existing store/report/engine workflows touched or inspected for compatibility. |
| 2026-05-10 | Prompt 03 | `npm run lint:errors` | 1 error (out of scope) | Known unrelated UA error remains: `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. No Map Explorer lint errors surfaced. |
| 2026-05-10 | Prompt 03 | `npx eslint src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapEvidenceArtifacts.ts src/centerpanel/components/map/index.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/stores/useMapExplorerStore.ts --quiet` | Clean | Touched Map Explorer files lint clean. |
| 2026-05-10 | Prompt 04 | `npm run typecheck` | Passed | Full TypeScript project typechecks after snapshot v3 additions. |
| 2026-05-10 | Prompt 04 | `npx vitest run src/services/map/__tests__/MapPersistenceService.test.ts --reporter=verbose` | Passed (11/11) | Covers existing save/load/query/quota behavior plus snapshot references, stale oversized layers, and external URL restore references. |
| 2026-05-10 | Prompt 04 | `npm run lint:errors` | 1 error (out of scope) | Known unrelated UA error remains: `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. |
| 2026-05-10 | Prompt 04 | `npx eslint src/services/map/MapPersistenceService.ts src/services/map/__tests__/MapPersistenceService.test.ts src/centerpanel/components/map/mapTypes.ts --quiet` | Clean | Touched Map persistence files lint clean. |
| 2026-05-10 | Prompt 05 | `npm install` | Passed | Restored dependencies after workspace cleanup so follow-up validation could run. Audit reported 10 vulnerabilities, but no install failure. |
| 2026-05-10 | Prompt 05 | `npm run typecheck` | Passed | Full TypeScript project typechecks with Prompt 05 hook extraction in place. |
| 2026-05-10 | Prompt 05 | `npx vitest run src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx src/services/map/__tests__/MapAnalysisDispatcher.test.ts` | Passed (3/3) | Covers modal dispatch integration and underlying map dispatch service after command-hook extraction. |
| 2026-05-10 | Prompt 06 | `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts` | Passed (59/59) | First focused run caught a local initialization-order bug in `MapWorkspaceCockpit.tsx`; rerun passed immediately after the fix. |
| 2026-05-10 | Prompt 06 | `npm run typecheck` | Passed | Full TypeScript project typechecks after cockpit/status bar wiring and navigator-stage sizing changes. |
| 2026-05-10 | Prompt 06 | `npm run dev` | Passed (shell smoke) | Dev server launched at `http://127.0.0.1:3000`; default shell loaded and remained reachable for browser smoke, though no direct Map Explorer entrypoint surfaced from the landing flow. |
| 2026-05-10 | Prompt 07 | `npx vitest run src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts` | Passed (94/94) | Covers expanded lightweight layer summaries, truthful legacy degradation, store normalization, import metadata, and analysis adapter compatibility. |
| 2026-05-10 | Prompt 07 | `npm run typecheck` | Passed | Full TypeScript project typechecks after normalized registry metadata, store, adapter, importer, and layer inspector changes. |
| 2026-05-10 | Prompt 07 | `npx eslint src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapLayerMetadata.ts src/centerpanel/components/map/mapContextSummary.ts src/stores/useMapExplorerStore.ts src/services/map/MapDataImporter.ts src/services/map/MapEngineAdapter.ts src/centerpanel/components/map/MapLayerManager.tsx src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts src/services/map/__tests__/MapDataIO.test.ts --quiet` | Passed | Focused lint pass on touched Prompt 07 files produced no errors. |
| 2026-05-10 | Prompt 08 | `npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Passed (42/42) | Covers registry badges, disabled action reasons, guarded remove confirmation, and existing layer sync/store regressions. |
| 2026-05-10 | Prompt 08 | `npm run typecheck` | Passed | Full TypeScript project typechecks after layer action callback props and guarded row UI changes. |
| 2026-05-10 | Prompt 08 | `npx eslint src/centerpanel/components/map/MapLayerManager.tsx src/centerpanel/components/map/__tests__/map-layer-management.test.ts --quiet` | Passed | Focused lint pass on touched Prompt 08 files produced no output. |
| 2026-05-11 | Prompt 09 | `npx vitest run src/services/map/__tests__/MapScientificQA.test.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts` | Passed (10/10) | Covers QA category summaries, missing-schema warning behavior, evidence category summaries, and store-level QA-finding artifact propagation. |
| 2026-05-11 | Prompt 09 | `npm run typecheck` | Passed | Full TypeScript project typechecks after QA model, panel, evidence, store, and tests. |
| 2026-05-11 | Prompt 09 | `npx eslint src/services/map/MapScientificQA.ts src/centerpanel/components/map/ScientificQAPanel.tsx src/centerpanel/components/map/mapEvidenceArtifacts.ts src/stores/useMapExplorerStore.ts src/services/map/__tests__/MapScientificQA.test.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts src/centerpanel/components/map/mapTypes.ts` | Passed | Focused lint pass on touched Prompt 09 files produced no errors or warnings. |
| 2026-05-11 | Prompt 10 | `npx vitest run src/services/map/__tests__/MapExportService.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/__tests__/MapExportDialog.test.tsx` | Passed (26/26) | Covers readiness blockers, attribution warnings, export-readiness QA blockers, manifest/evidence QA conversion, report draft readiness, pending insert reproducibility, and export dialog blocked UI. |
| 2026-05-11 | Prompt 10 | `npm run typecheck` | Passed | Full TypeScript project typechecks after publication readiness gates, report/export contracts, UI wiring, and tests. |
| 2026-05-11 | Prompt 10 | `npm run lint:errors` | 1 error (out of scope) | Known unrelated UA error remains: `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. |
| 2026-05-11 | Prompt 10 | `npx eslint src/services/map/MapExportService.ts src/services/map/MapReportHandoffService.ts src/services/map/MapReviewSessionService.ts src/centerpanel/components/MapExportDialog.tsx src/centerpanel/components/map/MapReportHandoffDrawer.tsx src/services/map/__tests__/MapExportService.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/__tests__/MapExportDialog.test.tsx --max-warnings=0` | Passed | Focused lint pass on touched Prompt 10 service/UI/test files produced no errors or warnings. |
| 2026-05-11 | Prompt 11 | `npx vitest run src/services/map/__tests__/MapWorkflowService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts` | Passed (24/24) | Covers workflow preview/apply manifests, blocked preview QA manifest state, no-heavy-payload preview manifest assertion, and adapter output manifest persistence/round-trip. |
| 2026-05-11 | Prompt 11 | `npm run typecheck` | Passed | Full TypeScript project typechecks after manifest contracts, workflow/apply/evidence/UI wiring, adapter output metadata, and tests. |
| 2026-05-11 | Prompt 11 | `npx eslint --quiet src/services/map/MapWorkflowService.ts src/centerpanel/components/map/MapWorkflowDrawer.tsx src/centerpanel/components/MapExplorerModal.tsx src/services/map/MapEngineAdapter.ts src/centerpanel/components/map/mapTypes.ts src/services/map/__tests__/MapWorkflowService.test.ts src/services/map/__tests__/MapEngineAdapter.test.ts` | Passed | Focused error-only lint pass on touched Prompt 11 files produced no errors. Existing warnings in unrelated `MapExplorerModal` prompt/no-leaked-render lines were not part of Prompt 11 changes. |
| 2026-05-11 | Prompt 11 | `npm run lint:errors` | 1 error (out of scope) | Known unrelated UA error remains: `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. |
| 2026-05-11 | Prompt 11 | `npm run lint:no-tailwind-centerpanel` | Blocked (repo setup) | `package.json` references `scripts/check-no-tailwind-centerpanel.ps1`, but that script is missing from `scripts/`; `powershell` was unavailable in the execution context. |
| 2026-05-11 | Prompt 11 | `pwsh -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 12 - Analysis Recommendation and Dispatch`. |

## Known Risks

| Date | Prompt | Risk | Severity | Mitigation |
| --- | --- | --- | --- | --- |
| Pending | Pending | Existing implementation may differ from plan file paths. | Medium | Every prompt must inspect live imports before editing. |
| Pending | Pending | `MapExplorerModal.tsx` is large and can become a permanent super-component. | High | Extract selectors, hooks, services, and adapters incrementally. |
| Pending | Pending | CRS and measurement claims can become misleading if metadata is inferred too aggressively. | High | Require explicit unknown/warning states. |
| Pending | Pending | Cross-module bridges may be partially implemented. | Medium | Use adapters and ledger contract registry. |
| Pending | Pending | UI polish work may drift into broad redesign. | Medium | Preserve map-first workspace and follow tri-modal alignment spec. |
| 2026-05-10 | Prompt 03 | Existing map/report/export workflows do not yet auto-register every possible map evidence artifact. | Low | Prompt 03 only added model/foundation. Later prompts should call the builders at apply/publish/export/report boundaries. |
| 2026-05-10 | Prompt 03 | Map evidence registry is currently in-memory only. | Medium | Prompt 04 owns persistence boundaries and project snapshot shape; do not persist heavy payloads. |
| 2026-05-10 | Prompt 04 | Snapshot v3 restore warnings are available in metadata but not yet surfaced in UI. | Medium | Prompt 05/06 should expose missing/stale layer states in decomposed shell/context strips. |
| 2026-05-10 | Prompt 04 | Local store still persists `selectedFeatureIds` as pre-existing behavior. | Low | Preserved by scope; only change in a future explicit cleanup prompt. |
| 2026-05-11 | Prompt 09 | Publication/export services do not yet consume the new `export-readiness` QA domain. | Resolved | Prompt 10 now consumes export-readiness and QA blockers in formal publication readiness gates. |
| 2026-05-11 | Prompt 10 | Workflow preview/run manifests do not yet reuse publication readiness metadata. | Resolved | Prompt 11 added Map-owned workflow/engine reproducibility manifests and kept the contract lightweight/reference-only. |
| 2026-05-11 | Prompt 11 | `npm run lint:no-tailwind-centerpanel` cannot currently execute from `package.json` because the referenced PowerShell script is absent. | Low | Do not treat this as a Prompt 11 UI failure; restore or replace the missing script in a repo setup/CI maintenance pass before relying on the command. |

## Next Prompt Pointer

Start with:

`DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`

Prompt:

`Prompt 12 - Analysis Recommendation and Dispatch`

Optional helper command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1
```

## Ledger Update Checklist

Before final response, every agent must confirm:

- The prompt ID is recorded.
- Prompt status is updated in the Prompt Status Register.
- Files inspected are recorded.
- Files changed are recorded.
- Validation is recorded.
- Spatial evidence/provenance changes are recorded or marked none.
- CRS, geometry, or measurement changes are recorded or marked none.
- Scientific QA changes are recorded or marked none.
- Layer registry or persistence changes are recorded or marked none.
- Workflow/export/report changes are recorded or marked none.
- Contract changes are recorded or marked none.
- Risks are recorded or marked none.
- The next prompt pointer is updated.
