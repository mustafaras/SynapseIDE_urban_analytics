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

- Overall status: Dashboard, Education, and Publication Outputs landed. 22 of 30 prompts completed.
- Current prompt: Prompt 21 - Dashboard, Education, and Publication Outputs completed 2026-05-13.
- Next recommended prompt: Prompt 22 - Temporal Playback and Scenario Comparison.
- Operating pack status: Installed.
- Next-prompt helper: `scripts/get-next-map-explorer-prompt.ps1`
- Machine-readable manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
- Last validated repository state: 2026-05-13; Prompt 21 validation passed: focused publication binding/readiness + layer manager tests passed (64/64), `npm run typecheck` passed, `git diff --check` passed for Prompt 21 files with LF-to-CRLF warnings only, and the next-prompt helper resolves Prompt 22.
- Last known blocker: None for Prompt 20 scope; repo setup blocker remains for the missing centerpanel no-Tailwind script and repo-wide lint has the unrelated UA unused import noted above.

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
| 12 | Analysis Recommendation and Dispatch | completed | 11 | Completed 2026-05-11. Recommendations now carry explainable reasons/readiness, and dispatches carry lightweight context/layer references with explicit review/audit events while preserving existing dispatch keys. |
| 13 | Engine Adapter Evidence Outputs | completed | 12 | Completed 2026-05-11. Engine adapter outputs now carry evidence artifacts, lineage, QA summaries, caveats, output mode labels, handoff hints, completed-run metadata round-trip preservation, and map evidence registry upserts at publication boundaries. |
| 14 | Import and External Service Evidence | completed | 13 | Completed 2026-05-11. Local imports and external service layers now carry QA-aware source metadata, dependency/cache/stale fields, attribution/CRS summaries, evidence IDs, registry normalization, evidence registry upserts, and review timeline events. |
| 15 | CRS, Measurement, and Geometry Validation | completed | 14 | Completed 2026-05-12. Browser measurements now carry WGS84 geodesic assumptions, drawings carry validation metadata, QA honors normalized/import/registry CRS metadata, and publication readiness consumes CRS/geometry blockers and caveats. |
| 16 | Map to Urban Context Adapter | completed | 15 | Completed 2026-05-12. Map-owned lightweight context payload, explicit layer rail Urban action, event/receiver bridge, and focused coverage landed. |
| 17 | Urban to Map Method Request Adapter | completed | 16 | Completed 2026-05-12. Map-owned incoming Urban method request contract, preview/readiness adapter, CustomEvent subscription, workflow/report preview wiring, review timeline capture, and focused no-heavy-payload coverage landed. |
| 18 | Map to IDE Code and Manifest Artifact Requests | completed | 17 | Completed 2026-05-12. Map-owned IDE artifact request service, explicit layer/workflow/export IDE actions, SQL bridge language support, Map evidence registration, Synapse bus evidence events, and focused no-heavy-payload coverage landed. |
| 19 | IDE to Map File and Layer Artifact Recognition | completed | 18 | Completed 2026-05-12. Added Map-owned IDE artifact recognition service, reference-only typed payload/result, supported file classification, readiness labels, evidence candidate registration, Synapse bus receiver, App install wiring, and focused tests. |
| 20 | Report Handoff Structured Evidence | completed | 19 | Completed 2026-05-12. Added structured Map report evidence blocks, report insert structured metadata preservation, drawer evidence-registration action, report evidence artifact binding metadata, and focused report/reporting tests. |
| 21 | Dashboard, Education, and Publication Outputs | completed | 20 | Completed 2026-05-13. Map dashboard + education output bindings are wired as explicit static actions with truthful live-state labels; dashboard bindings carry data fields, visual encoding, source context, QA, and provenance; education references inherit publication-readiness QA metadata. |
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

### Prompt 12 - Analysis Recommendation and Dispatch

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - Development plan: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.3, 18.1, 18.2, and 20.1
- Files inspected:
  - `src/services/map/MapAnalysisRecommender.ts` — current recommendation ranking, layer profiling, QA gating, action types, and state signature.
  - `src/services/map/MapAnalysisDispatcher.ts` — existing AOI/isochrone/hotspot dispatch payloads, `MAP_ANALYSIS_DISPATCH_KEY`, view restriction key, and workflow navigation pattern.
  - `src/centerpanel/components/MapExplorerModal.tsx` — recommendation generation, Urban context availability, action handler, review-event recording, AOI dispatch hook wiring, and workflow navigation feedback.
  - `src/centerpanel/components/map/useMapAoiDispatch.ts` — command-hook dispatch payload creation, AOI/isochrone feedback, and review-event details.
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` and `.module.css` — recommendation strip UI surface and compact premium styling constraints.
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx` — workflow consumer context, inspected for Prompt 12 compatibility; no changes required.
  - `src/stores/useFlowStore.ts` — stepData sidecar queue pattern and workflow dispatch storage behavior.
  - `src/features/urbanAnalytics/useUrbanContextStore.ts` — active Urban context summary fields available to Map Explorer.
  - Focused recommender and dispatcher tests.
- Files changed:
  - `src/services/map/MapAnalysisRecommender.ts` — added recommendation reasons, readiness state/counts, temporal/field/manifest profiling, AOI/QA/Urban context reason builders, and context-aware ranking/signature fields.
  - `src/services/map/MapAnalysisDispatcher.ts` — added lightweight dispatch context summaries, layer references, audit summaries, `MAP_ANALYSIS_RECOMMENDATION_KEY`, and explicit recommendation dispatch while preserving `MAP_ANALYSIS_DISPATCH_KEY` for existing payloads.
  - `src/centerpanel/components/map/useMapAoiDispatch.ts` — enriched AOI/isochrone dispatches with map context summaries, visible layer references, and review details.
  - `src/centerpanel/components/MapExplorerModal.tsx` — passes map + Urban context into recommendations, routes open-flow recommendation actions through the enriched dispatcher, and records explicit analysis-dispatch review events.
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` — surfaces readiness labels and top recommendation reasons in the cockpit recommendation strip.
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` — added restrained readiness/reason styling without Tailwind or additional card chrome.
  - `src/services/map/__tests__/MapAnalysisRecommender.test.ts` — added coverage for reason kinds, AOI/QA readiness, blockers, and Urban context scoring/metadata.
  - `src/services/map/__tests__/MapAnalysisDispatcher.test.ts` — added coverage for enriched AOI dispatch and recommendation dispatch sidecar payloads while preserving the legacy dispatch key.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risks, and next pointer.
- Summary:
  - Map analysis recommendations now explain why they were suggested through layer type, geometry, fields, temporal signals, AOI, QA, manifest/provenance, selection, and active Urban context reasons.
  - Every recommendation now carries readiness with `ready`, `needs-review`, or `blocked` status plus blockers, warnings, required actions, QA blocker counts, and map/Urban context IDs where available.
  - Recommendation dispatch is explicit: open-flow actions queue a lightweight sidecar payload under `MAP_ANALYSIS_RECOMMENDATION_KEY`, navigate to the requested workflow, and record an `analysis-dispatch` review event.
  - Existing AOI/isochrone/hotspot dispatches still use `MAP_ANALYSIS_DISPATCH_KEY`, now with optional context summaries, layer references, and audit metadata.
- Spatial evidence/provenance changes:
  - Dispatch payloads and recommendation reasons store layer IDs, layer summaries, manifest IDs, QA/readiness metadata, and scalar context only.
  - No raw GeoJSON, sourceData, large geometry buffers, screenshots, or rendered artifacts were added to recommendation or dispatch payloads.
- CRS, geometry, or measurement changes:
  - No CRS transformation, geometry algorithm, distance, or area calculation was changed.
  - Geometry and CRS information is surfaced as metadata/readiness context only, preserving unknown states for downstream review.
- Scientific QA changes:
  - Recommendations now convert QA blockers/warnings/unchecked status into visible reason chips and readiness blockers/warnings.
  - Dispatch audit details preserve readiness status, QA blocker/warning details, and reason kinds for later review.
- Layer registry or persistence changes:
  - No persisted project snapshot schema change and no map layer persistence change.
  - Added lightweight `MapAnalysisLayerReference` summaries derived from existing layer registry summaries for dispatch handoffs.
- Workflow/export/report changes:
  - Workflow dispatch remains user-triggered and does not run workflows silently.
  - Recommendation dispatch now queues a sidecar workflow context payload and records an explicit review event before/while navigating to Workflows.
  - Export/report contracts were not changed.
- Contract changes:
  - Added additive `MapAnalysisRecommendationReason`, `MapAnalysisRecommendationReadiness`, and `MapAnalysisUrbanContextSummary` contracts to the recommender.
  - Added `MapAnalysisDispatchContextSummary`, `MapAnalysisLayerReference`, `MapAnalysisDispatchAuditSummary`, `MapAnalysisRecommendationDispatchPayload`, and `MAP_ANALYSIS_RECOMMENDATION_KEY` to the dispatcher.
  - Existing `MAP_ANALYSIS_DISPATCH_KEY` payload variants remain compatible.
- UX changes:
  - Cockpit recommendation rows now show readiness and the top reasons compactly, matching the dense premium map workspace style.
  - Recommendation action labels now include readiness for screen-reader context.
- Validation:
  - `npx vitest run src/services/map/__tests__/MapAnalysisRecommender.test.ts src/services/map/__tests__/MapAnalysisDispatcher.test.ts` passed (10/10).
  - `npm run typecheck` passed.
  - Focused `npx eslint --quiet` on touched Prompt 12 TS/TSX service/UI/test files passed.
  - `git diff --check` passed; only the existing line-ending warning for the ledger was reported.
  - `npm run lint:no-tailwind-centerpanel` remains blocked by repo setup: `package.json` references missing `scripts/check-no-tailwind-centerpanel.ps1`.
- Risks:
  - No Prompt 12 blocker remains.
  - `useUrbanContextSummary` does not currently expose a canonical Urban context ID, so Map Explorer uses `studyAreaId` as the optional Urban context ID when available; Prompt 16 should refine the full Map -> Urban adapter.
  - The no-Tailwind centerpanel guard script is still missing from `scripts/`; focused lint passed, and the changed CSS/TSX did not introduce Tailwind classes.
- Next recommended prompt: Prompt 13 - Engine Adapter Evidence Outputs.
- Ledger updated: yes

#### Prompt 12 UI Readability Polish - Map Command Center Modal

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` — cockpit structure, context signals, workflow sequence, quick actions, and recommendation strip.
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` — navigator cockpit layout, responsive behavior, typography, and recommendation styling.
  - `src/centerpanel/components/MapExplorerModal.tsx` — navigator-stage sizing and cockpit placement.
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` — enlarged the cockpit modal surface, header, context strip, state/sequence/recommendation rows, and quick actions; changed the body to a clearer two-column default with wide-screen three-column mode and readable mobile fallback.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — recorded this UI polish and validation.
- Summary:
  - The Map Command Center now fills the navigator stage like a larger modal instead of a compressed strip.
  - Context signals, readiness, workflow controls, analysis recommendations, and quick actions use larger type, spacing, and touch targets while preserving the restrained charcoal/amber Map Explorer language.
- UX changes:
  - Header/action area enlarged; readiness bar and recommended action are more legible.
  - Context signal strip now remains a single seven-column rail; details are clamped inside each cell and only genuinely narrow panes use horizontal rail overflow instead of wrapping to a second row.
  - Body uses clearer responsive layout: state + workflow/integration columns on normal widths, three columns on wide/tall desktops, single-column scroll on narrow widths.
  - Recommendation cards are more readable with larger rationale, readiness, metadata, and action controls.
- Validation:
  - `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts` passed (59/59).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/centerpanel/components/map/MapWorkspaceCockpit.tsx` passed.
  - Re-ran the same focused component tests, typecheck, and cockpit lint after the single-row context rail correction; all passed.
  - Dev server launched at `http://127.0.0.1:3000/`; Map Explorer opened through Command Palette and the navigator cockpit was visually inspected with Playwright screenshots.
- Risks:
  - On narrow embedded/browser panes the modal correctly falls back to a vertical scroll layout; wide desktop view opens the fuller multi-column layout.
  - No Prompt 12 blocker introduced.

### Prompt 13 - Engine Adapter Evidence Outputs

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 13
  - Development plan: `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` evidence/output bridge sections
- Files inspected:
  - `src/services/map/MapEngineAdapter.ts` — adapter result shape, completed-run map output bridge, rerun bridge, and all analysis output adapters.
  - `src/services/map/SpatialStatsExecutionService.ts` and `SpatialStatsExecutionQueue.ts` — spatial-stats execution metadata handoff into the adapter.
  - `src/centerpanel/components/map/mapTypes.ts` — analysis result metadata and map output/evidence contracts.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` — reference-only workflow result evidence artifact builder.
  - `src/stores/useMapExplorerStore.ts` — evidence registry actions and QA propagation behavior.
  - Publication boundaries in `MapExplorerModal.tsx`, `GeoAILab.tsx`, `ObjectDetectorPanel.tsx`, and adapter-backed analytical flows.
  - Focused adapter, spatial-stats, and object-detection publication tests.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added output mode, QA summary, caveat, evidence ID, source run/workflow, and handoff hint metadata contracts.
  - `src/services/map/MapEngineAdapter.ts` — now builds lightweight `MapEvidenceArtifact` outputs for every analysis adapter result; enriches layer metadata/registry metadata with source run/layer/workflow IDs, input parameters, QA summary, caveats, output mode, handoff hints, and evidence artifact ID; preserves the metadata through completed-run map outputs and bridge round-trips.
  - `src/services/map/__tests__/MapEngineAdapter.test.ts` — added coverage for lineage metadata, evidence artifact shape, demo/synthetic warnings, QA/caveats, and completed-run map output preservation.
  - `src/centerpanel/components/MapExplorerModal.tsx` — registers adapter evidence artifacts for analysis reruns, quick hot spot results, and map NL query outputs.
  - `src/centerpanel/Tools/components/GeoAILab.tsx` — registers land-cover and query adapter evidence artifacts when published to Map Explorer.
  - `src/centerpanel/components/ObjectDetectorPanel.tsx` — registers object-detection adapter evidence artifacts when published.
  - `src/centerpanel/Flows/CellularAutomataFlow.tsx`, `CompositeIndicatorFlow.tsx`, `FacilityOptimisationFlow.tsx`, and `UrbanMorphologyFlow.tsx` — register adapter evidence artifacts for simulation/indicator/morphology publication paths.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risks, and next pointer.
- Summary:
  - Adapter outputs now carry a first-class `evidenceArtifact` alongside the map layer and visualization spec.
  - Analysis layer metadata now includes source run ID, source layer IDs, algorithm/workflow ID, parameters, QA summary, caveats, output mode, evidence artifact ID, and report/dashboard/IDE handoff hints.
  - Completed-run map outputs now persist the lightweight metadata required to rebuild evidence-aware layers on round-trip import.
  - Map publication paths now upsert returned adapter evidence artifacts into the Map Explorer evidence registry when analysis layers are published.
- Spatial evidence/provenance changes:
  - Evidence artifacts store layer IDs, source layer IDs, source run/workflow IDs, CRS/geometry summaries, QA state, caveats, and scalar metadata only.
  - No raw GeoJSON, sourceData, rendered images, screenshots, or large geometry buffers were copied into evidence payloads.
- CRS, geometry, or measurement changes:
  - No CRS transformation, area, distance, spatial-statistics, GeoAI, or simulation algorithm changed.
  - Adapter fallback CRS remains explicitly caveated as display/source-reference metadata, not analytical readiness.
- Scientific QA changes:
  - Adapter outputs now surface QA status as metadata, layer `qaStatus`, registry evidence ID, and evidence artifact QA state.
  - Demo/synthetic/unknown output modes add explicit caveats so exploratory outputs cannot be mistaken for real analytical evidence.
- Layer registry or persistence changes:
  - Analysis layers now normalize with `metadata.evidenceArtifactId` and registry evidence artifact IDs.
  - Map evidence registry receives adapter evidence artifacts at Map Explorer publication boundaries.
  - Project snapshot persistence schema was not changed.
- Workflow/export/report changes:
  - Completed-run map outputs preserve evidence metadata, QA summaries, caveats, output mode, handoff hints, and reproducibility manifests where present.
  - Existing completed-run integration and rerun handlers remain compatible.
- Contract changes:
  - `AnalysisAdapterResult` now includes `evidenceArtifact: MapEvidenceArtifact`.
  - `AnalysisResultMetadata` gained additive fields for lineage, QA/caveats, output mode, evidence ID, and handoff hints.
  - `createAnalysisMapOutput` and `adaptAnalysisMapOutput` now preserve/rebuild evidence-aware metadata.
- UX changes:
  - No visible layout change in Prompt 13; changes improve downstream evidence, QA, report/dashboard/IDE readiness surfaces.
- Validation:
  - `npx vitest run src/services/map/__tests__/MapEngineAdapter.test.ts src/services/map/__tests__/SpatialStatsExecutionService.test.ts src/centerpanel/components/__tests__/objectDetectionPublish.test.ts` passed (26/26).
  - `npm run typecheck` passed.
  - Focused `npx eslint src/services/map/MapEngineAdapter.ts src/centerpanel/components/map/mapTypes.ts src/services/map/__tests__/MapEngineAdapter.test.ts src/centerpanel/Tools/components/GeoAILab.tsx src/centerpanel/components/ObjectDetectorPanel.tsx src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/Flows/CellularAutomataFlow.tsx src/centerpanel/Flows/CompositeIndicatorFlow.tsx src/centerpanel/Flows/FacilityOptimisationFlow.tsx src/centerpanel/Flows/UrbanMorphologyFlow.tsx --quiet` passed.
  - `git diff --check` passed; only LF-to-CRLF warnings were reported for touched Windows working-copy files.
  - `npm run lint:errors` still fails on unrelated `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`.
- Risks:
  - No Prompt 13 blocker remains.
  - Some Urban Analytics VoxCity publication paths use the same adapter but were not changed in this Map Explorer prompt to avoid widening into UA module scope; their completed-run outputs still preserve evidence metadata via `createAnalysisMapOutput`.
  - Adapter fallback CRS metadata is intentionally conservative and should be refined by Prompt 15 CRS/measurement validation.
- Next recommended prompt: Prompt 14 - Import and External Service Evidence.
- Ledger updated: yes

### Prompt 14 - Import and External Service Evidence

- Date: 2026-05-11
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 14
  - Development plan: sections 12 M9, 14.4, 14.8, 15.2, and 23
- Files inspected:
  - `src/services/map/MapDataImporter.ts` — local GeoJSON/CSV/KML/KMZ/GPX/Arrow/GeoParquet import layer construction, metadata summaries, and columnar worker session handoff.
  - `src/services/map/MapDataExporter.ts` — visible-layer export path compatibility; no edit required.
  - `src/services/map/ExternalServiceConnector.ts` — WMS/WMTS/WFS/XYZ/Overpass/CityJSON layer creation, fetch errors, cache, and refresh behavior.
  - `src/services/map/ExternalServiceQueue.ts` — Overpass background queue/cache behavior; no edit required.
  - `src/centerpanel/components/MapExplorerModal.tsx` — local import publication boundary, external service `onAddLayer` boundary, evidence registry action, and review event recording.
  - `src/centerpanel/components/MapServiceDialog.tsx` and `src/centerpanel/components/map/MapToolbar.tsx` — service/import UI call sites; no direct UI edit required.
  - `src/centerpanel/components/map/mapTypes.ts`, `mapLayerMetadata.ts`, and `mapEvidenceArtifacts.ts` — layer metadata/evidence contracts and registry normalization.
  - Focused import/export and external service tests.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added `ImportLayerSourceMetadata`, import-source metadata attachment, external service dependency/cache/stale/offline/caveat fields, and `import-source` metadata source.
  - `src/centerpanel/components/map/mapLayerMetadata.ts` — registry normalization now consumes import source metadata, external service license/dependency caveats, and offline/stale readiness state.
  - `src/services/map/MapDataImporter.ts` — local imports now create source identity, import timestamp, CRS unknown/declared summaries, license/attribution unknown state, scientific QA caveats, skipped-row diagnostics, worker readiness state, and stable evidence artifact IDs.
  - `src/services/map/ExternalServiceConnector.ts` — WMS/WMTS/WFS/XYZ/Overpass/CityJSON layers now normalize with external dependency metadata, CORS/credential caveats, attribution/license, CRS summaries, scientific QA, evidence IDs, cache/live states, and conservative CityJSON unknown CRS handling.
  - `src/centerpanel/components/MapExplorerModal.tsx` — local imports and external service layer additions register `createMapLayerEvidenceArtifact` outputs and emit `layer-change` review timeline events; columnar worker transfer updates import metadata before evidence registration.
  - `src/services/map/__tests__/MapDataIO.test.ts` — added coverage for CSV skipped rows, import evidence IDs, CRS unknown, QA caveats, registry readiness, and local GeoJSON provenance.
  - `src/services/map/__tests__/ExternalServiceConnector.test.ts` — added coverage for WMS/WMTS/WFS/XYZ/Overpass/CityJSON dependency metadata, attribution, cache state, evidence IDs, and unknown CityJSON CRS.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risks, and next pointer.
- Behavior implemented:
  - Local imports now become traceable evidence candidates with source kind, source file/name, import timestamp, schema/geometry summaries, CRS state, license/attribution state, QA caveats, skipped-row diagnostics, worker readiness, and evidence artifact ID.
  - External service layers now carry provider/service metadata, endpoint/template, dependency status, cache/stale timestamps, CORS/credential caveats, attribution/license, CRS summaries, QA caveats, and evidence artifact ID.
  - Map Explorer publication boundaries upsert imported/external layer evidence artifacts and create review timeline events without copying raw layer data.
- UX changes:
  - No visible layout redesign in Prompt 14. The user-visible effect is richer layer readiness/evidence state in existing layer registry, QA, review, export/report readiness, and evidence surfaces.
- Spatial evidence/provenance changes:
  - Imported and external service layers now register lightweight layer evidence artifacts at publication time.
  - Evidence metadata stores layer IDs, source/service summaries, scalar QA/dependency state, CRS/geometry summaries, and caveats only.
  - No raw GeoJSON, sourceData, screenshots, canvases, rendered rasters, or large geometry buffers were copied into evidence artifacts or dispatch payloads.
- CRS, geometry, or measurement changes:
  - No spatial calculation, CRS transformation, distance, or area algorithm changed.
  - Local GeoJSON/CSV/KML/KMZ/GPX imports remain CRS unknown unless explicit metadata is present.
  - GeoParquet/columnar CRS declarations are stored as declared metadata only and still require QA review before analytical measurement.
  - WFS preserves explicit `srsName=EPSG:4326`; XYZ uses Web Mercator display tile metadata; remote CityJSON does not fabricate CRS when `referenceSystem` is missing.
- Scientific QA changes:
  - Import and external service layer metadata now include `LayerScientificQAMetadata` category summaries for CRS, schema, missingness, source provenance, attribution/license, and service dependency state.
  - Missing CRS/license/attribution and external cache/stale/offline states degrade readiness truthfully instead of silently passing.
- Layer registry or persistence changes:
  - Layer registry metadata now normalizes import-source and external-service metadata into provenance, CRS, license, QA, evidence ID, and publication readiness summaries.
  - No project snapshot persistence schema change; existing layer metadata is additive.
- Workflow/export/report changes:
  - Existing export/report gates can now consume richer readiness and evidence metadata for imported and service layers.
  - No workflow dispatch or export algorithm behavior changed.
- Cross-module contract changes:
  - Additive `LayerMetadata.importSource: ImportLayerSourceMetadata` contract for local import provenance and QA summaries.
  - Additive `ExternalServiceLayerMetadata` dependency/cache/stale/offline/caveat fields for service layer evidence and readiness consumers.
  - Existing `MapEvidenceArtifact` layer contract reused through `createMapLayerEvidenceArtifact`; no new cross-module owner dependency added.
- Performance/data movement changes:
  - Evidence registration remains reference-only and scalar-only.
  - Columnar worker transfer status is recorded in metadata after publish, but Arrow/GeoParquet buffers remain in the worker/import pipeline and are not copied into evidence.
- Accessibility changes:
  - No direct UI/a11y interaction changes.
- Validation commands:
  - `npx vitest run src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/ExternalServiceConnector.test.ts`
  - `npm run typecheck`
  - `npx eslint --quiet src/services/map/MapDataImporter.ts src/services/map/ExternalServiceConnector.ts src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapLayerMetadata.ts src/centerpanel/components/MapExplorerModal.tsx src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/ExternalServiceConnector.test.ts`
  - `git diff --check`
  - VS Code Problems check for touched Prompt 14 files
- Validation results:
  - Focused vitest passed (35/35, 2 live smoke tests skipped by env guard).
  - `npm run typecheck` passed.
  - Focused eslint passed with no output.
  - `git diff --check` passed; only LF-to-CRLF working-copy warnings were reported.
  - VS Code Problems check reported no errors for touched Prompt 14 files.
- Known risks:
  - No Prompt 14 blocker remains.
  - Actual external service offline detection is still request-time behavior; unavailable services generally fail before a layer is created. Prompt 14 added offline/stale metadata semantics for layer readiness when such states are present.
  - CRS measurement semantics are still deferred to Prompt 15; Prompt 14 only preserves declared/unknown CRS states and caveats.
  - Repo-wide `npm run lint:errors` is still known to fail on unrelated `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import, and `npm run lint:no-tailwind-centerpanel` remains blocked by the missing script.
- Blockers: None for Prompt 14.
- Decisions made:
  - Local import CRS remains unknown unless explicitly declared by import metadata; display/source coordinates are not promoted to analytical readiness.
  - External service evidence stores dependency/service references and scalar state only; raw service payloads stay in layer/source data or service fetch paths.
  - Remote CityJSON without `referenceSystem` keeps CRS unknown instead of using a placeholder string.
- Next recommended prompt: Prompt 15 - CRS, Measurement, and Geometry Validation.
- Ledger updated: yes

### Prompt 15 - CRS, Measurement, and Geometry Validation

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Started from:
  - Launcher: `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`
  - Manifest: `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`
  - Ledger: `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
  - Sequential prompt: `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 15
  - Alignment/operating docs: `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`, `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`, and `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`
- Files inspected:
  - `src/centerpanel/components/map/mapTypes.ts` — measurement, drawing, CRS, geometry, QA, readiness, and layer metadata contracts.
  - `src/centerpanel/components/MapMeasurementTool.tsx` and `src/utils/geodesic.ts` — browser measurement math, UI labels, clipboard output, and stored measurement shape.
  - `src/centerpanel/components/MapDrawingManager.tsx` and `src/utils/drawingHelpers.ts` — drawing finalization, vertex edit paths, and GeoJSON helpers.
  - `src/services/map/MapScientificQA.ts` — CRS resolver, geometry validity checks, category summaries, issue badges, and QA gates.
  - `src/centerpanel/components/map/mapLayerMetadata.ts` — normalized registry readiness, publication readiness, CRS/geometry/schema/license summaries.
  - `src/services/map/MapExportService.ts` — formal publication readiness gates, CRS/measurement check, QA blockers, caveat generation.
  - `src/services/map/MapAnalysisBounds.ts` — AOI/map-view bounds derivation for analysis dispatch.
  - Focused tests for geodesic measurement, drawing tools, Scientific QA, and export readiness.
- Files changed:
  - `src/centerpanel/components/map/mapTypes.ts` — added optional `MeasurementAssumptions` and `DrawnGeometryValidation` contracts.
  - `src/centerpanel/components/MapMeasurementTool.tsx` — completed measurements now store/display/copy WGS84 geodesic assumptions, CRS basis, area/distance model, and caveats; zero-value completions are rejected.
  - `src/centerpanel/components/MapDrawingManager.tsx` — drawing finalization and vertex edits now run finite-coordinate, degeneracy, closure, area, self-intersection, and GeoJSON validity checks; blocked drawings are not stored and valid/warning drawings carry validation metadata.
  - `src/centerpanel/components/map/mapLayerMetadata.ts` — publication readiness merges explicit readiness with current CRS/geometry QA, marks unknown geometry validation, and blocks invalid geometry.
  - `src/services/map/MapScientificQA.ts` — CRS resolver now honors known `crsSummary`, import `declaredCrs`, dataset, columnar, EO, external-service, and registry CRS metadata, with those fields included in QA cache signatures.
  - `src/services/map/MapExportService.ts` — formal CRS/measurement readiness now includes geometry readiness and geometry-type spatial QA caveats/blockers.
  - `src/services/map/MapAnalysisBounds.ts` — AOI/map bounds now reject non-finite or degenerate extents.
  - `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`, `src/services/map/__tests__/MapScientificQA.test.ts`, and `src/services/map/__tests__/MapExportService.test.ts` — added coverage for measurement assumptions, normalized CRS metadata, invalid geometry export-readiness, and geometry readiness caveats.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risks, and next pointer.
- Summary:
  - Prompt 15 hardened spatial truthfulness across browser measurements, drawn AOI geometry, Scientific QA CRS resolution, normalized layer readiness, analysis bounds, and formal publication gates.
- Spatial evidence/provenance changes:
  - No new evidence artifact kind or heavy payload movement.
  - Layer readiness/evidence consumers now receive stronger scalar CRS/geometry QA summaries through existing layer metadata and publication readiness contracts.
- CRS, geometry, or measurement changes:
  - Browser measurements explicitly record `geodesic-wgs84` assumptions using EPSG:4326 display coordinates, haversine distance, spherical polygon area, metres base units, and caveats.
  - Drawn geometries are conservatively validated before storage; invalid/self-intersecting/degenerate drawings are blocked, while stored drawings carry validation metadata.
  - QA CRS resolution now consumes Prompt 14 normalized/import/service/registry CRS metadata only when declared/known; missing CRS remains unknown/missing.
  - Analysis bounds no longer accepts degenerate or non-finite extents as AOI candidates.
- Scientific QA changes:
  - `MapScientificQA` no longer reports false missing CRS for layers whose CRS was declared through normalized `crsSummary`, import metadata, or registry metadata.
  - Invalid geometry already mapped into `geometry-validity`, `workflow-readiness`, and `export-readiness`; tests now lock export-readiness blocked severity for invalid geometry.
- Layer registry or persistence changes:
  - Additive metadata only; no persistence schema change.
  - Registry publication readiness now merges explicit readiness with current CRS/geometry QA instead of bypassing live QA signals.
- Workflow/export/report changes:
  - Formal publication/export readiness now warns or blocks on unknown/invalid geometry readiness in the same CRS/measurement gate that already handles spatial QA issues.
  - Report/export caveats now include layer geometry readiness gaps.
- Contract changes:
  - Additive optional `Measurement.assumptions` contract for map measurement consumers.
  - Additive optional `DrawnFeature.properties.validation` contract for AOI/drawing consumers.
  - No cross-module owner dependency added; contracts remain Map-owned and reference/scalar only.
- UX changes:
  - Measurement panel and clipboard now disclose the WGS84 geodesic CRS/method basis.
  - Drawing panel shows compact validation state per drawing.
  - Invalid drawings announce the blocking reason instead of silently entering map state.
- Validation:
  - `npm install` passed to restore missing `node_modules` for local validation; audit reported 10 vulnerabilities but did not block validation.
  - `npm run test -- src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts src/services/map/__tests__/MapScientificQA.test.ts src/services/map/__tests__/MapExportService.test.ts` passed (124/124).
  - `npm run typecheck` passed.
  - Focused `npx eslint --quiet` on touched Prompt 15 files passed with no output.
  - `git diff --check` passed; only LF-to-CRLF working-copy warnings were reported.
  - VS Code Problems check reported no errors for touched Prompt 15 files.
  - `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` returned Prompt 16 after ledger update.
- Known risks:
  - Browser measurement remains a display-coordinate geodesic tool, not a projected cadastral/engineering measurement engine. The UI/clipboard now labels that limitation explicitly.
  - Drawn geometry validation is structural/topological for browser-created GeoJSON and does not verify source CRS; it stores caveats accordingly.
- Blockers: None for Prompt 15.
- Decisions made:
  - Do not infer analytical CRS readiness from coordinates; only known/declarative CRS metadata is treated as CRS metadata.
  - Invalid drawn geometry should be blocked before entering store state, while warning/valid geometry can remain inspectable with validation metadata.
  - Explicit layer publication readiness is a baseline, not a bypass; current CRS/geometry QA still participates in readiness.
- Next recommended prompt: Prompt 16 - Map to Urban Context Adapter.
- Ledger updated: yes

### Prompt 16 - Map to Urban Context Adapter

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 16, `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`, `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`, and this ledger.
  - `src/centerpanel/components/map/mapContextSummary.ts` — existing Map context summary and layer summarizer.
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts` and `src/centerpanel/components/map/mapTypes.ts` — map evidence, QA, layer registry, CRS, schema, and workflow metadata contracts.
  - `src/features/urbanAnalytics/context/mapContextAdapter.ts`, `src/features/urbanAnalytics/lib/types.ts`, `src/features/urbanAnalytics/store.ts`, and `src/features/urbanAnalytics/useUrbanContextStore.ts` — existing Urban receiver, Urban summary shape, recommendation mode, and evidence/context actions.
  - `src/services/map/MapAnalysisDispatcher.ts` and `src/services/map/MapSyncService.ts` — reference-only dispatch and event/service patterns.
  - `src/stores/useMapExplorerStore.ts` and `src/centerpanel/components/MapExplorerModal.tsx` — Map state selectors, evidence registry, review events, active workflow data, and UI wiring surface.
  - `src/centerpanel/components/map/MapLayerManager.tsx` — existing layer rail Urban action and disabled reason surface.
- Files changed:
  - `src/services/map/MapToUrbanContextAdapter.ts` — new Map-owned adapter with `MapToUrbanContextPayload`, readiness assessment, lightweight payload builder, CustomEvent publication, and receiver hook.
  - `src/services/map/__tests__/MapToUrbanContextAdapter.test.ts` — focused coverage for payload content, blocked reasons, event dispatch, receiver simulation, and no-heavy-payload assertions.
  - `src/centerpanel/components/MapExplorerModal.tsx` — wired the existing layer rail Urban action to the new Map adapter and the existing Urban `applyMapContextToUrban` receiver with success/block feedback and review timeline events.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, contract registry, decisions, validation history, risk notes, and next pointer.
- Summary:
  - Prompt 16 now gives Map Explorer an explicit, Map-owned outbound Urban context handoff. The payload carries AOI, layer, selection, field, CRS, QA, workflow/result, and map evidence summaries while keeping raw GeoJSON/source buffers in Map state.
- Spatial evidence/provenance changes:
  - Map evidence artifacts are summarized by artifact IDs, layer/AOI/run references, provenance state, QA counts, and timestamps only.
  - The Urban receiver continues to own Urban evidence registration; Map only sends the handoff payload and invokes the receiver through an explicit action.
- CRS, geometry, or measurement changes:
  - No new spatial calculations or CRS inference were added.
  - Payload CRS summary uses existing normalized layer registry CRS status and flags missing/mixed CRS through scalar summary fields.
- Scientific QA changes:
  - Payload includes context-level QA status, issue counts, blocking/warning issue IDs, per-layer QA status, blockers, caveats, badges, and category summaries where present.
  - Blocking/no-context states produce explicit disabled reasons before Urban handoff.
- Layer registry or persistence changes:
  - No persistence schema change.
  - Layer summaries reuse `summarizeOverlayLayer`/normalized metadata and include queryability, visibility, readiness, CRS, schema-derived field summaries, selected feature counts, and analysis result references.
- Workflow/export/report changes:
  - Workflow/run/result IDs and reproducibility manifest IDs are carried as references in `workflowSummary` and per-layer workflow summaries.
  - No report/export behavior changed.
- Contract changes:
  - New `MapToUrbanContextPayload` contract in `src/services/map/MapToUrbanContextAdapter.ts` for Map -> Urban handoff.
  - New `MAP_TO_URBAN_CONTEXT_EVENT = "map:urban-sync:provided"` CustomEvent for optional observers.
  - No Urban internals were changed; existing `applyMapContextToUrban` remains the receiving adapter.
- UX changes:
  - The existing per-layer `Urban` action in the Map layer rail is now active when the layer is queryable and has declared CRS metadata.
  - The action sends context to Urban Analytics, enables the existing Urban recommendation path through the receiver, shows success/block feedback, announces accessibility status, and writes a Map review timeline event.
- Validation:
  - `npm run test -- src/services/map/__tests__/MapToUrbanContextAdapter.test.ts` passed (3/3).
  - `npm run test -- src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts` passed (6/6).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/services/map/MapToUrbanContextAdapter.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/centerpanel/components/MapExplorerModal.tsx` passed with no output.
  - `git diff --check` passed; only LF-to-CRLF working-copy warnings were reported.
  - VS Code Problems check reported no errors for touched Prompt 16 files.
- Known risks:
  - The explicit UI trigger is currently wired in the large `MapExplorerModal.tsx` orchestrator; future decomposition prompts should extract this into a smaller command hook when authorized.
  - The event is adjunct/observable; the current authoritative handoff remains the explicit receiver call into Urban's existing adapter.
- Blockers: None for Prompt 16.
- Decisions made:
  - Map owns the outbound payload and readiness reasons; Urban owns interpretation, Urban context mutation, evidence registration, and recommendation mode.
  - Use explicit layer rail action rather than automatic background sync, so Urban recommendations are user-triggered and auditable.
  - Keep payloads reference/scalar/summary-only and test that GeoJSON feature collections and coordinate arrays do not appear in serialized payloads.
- Next recommended prompt: Prompt 17 - Urban to Map Method Request Adapter.
- Ledger updated: yes

### Prompt 17 - Urban to Map Method Request Adapter

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 17, `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`, `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.4, 20.2, and 20.4, `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`, and this ledger.
  - `src/features/urbanAnalytics/store.ts` and `src/features/urbanAnalytics/useUrbanContextStore.ts` — Urban-side store surface inspected for ownership boundaries only; no Urban code changed.
  - `src/stores/useMapExplorerStore.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/useMapAoiDispatch.ts`, and `src/centerpanel/components/map/useMapPanelCommands.ts` — Map-owned state, UI choreography, review events, AOI/panel command patterns.
  - `src/services/map/MapWorkflowService.ts`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, `src/services/map/MapAnalysisRecommender.ts`, `src/services/map/MapReportHandoffService.ts`, and `src/services/map/MapReviewSessionService.ts` — compatibility/readiness, workflow preview/apply separation, report preview, and audit trail surfaces.
- Files changed:
  - `src/services/map/UrbanToMapMethodRequestAdapter.ts` — new Map-owned incoming Urban method request contract, compatibility/readiness preview builder, workflow/report preview summaries, and CustomEvent publish/subscribe helpers.
  - `src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts` — focused coverage for compatible layer matching, missing prerequisites, AOI/QA blockers, workflow draft preview, report snapshot readiness, event subscription, and no-heavy-payload serialization.
  - `src/centerpanel/components/MapExplorerModal.tsx` — subscribes to incoming Urban method request events, previews compatible layers/AOI/workflow/report actions, opens only preview panels, records review timeline events, and never applies derived layers or inserts reports automatically.
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx` — accepts a preview-only initial workflow draft request so incoming Urban workflow requests open the correct workflow without bypassing the existing explicit Apply action.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, contract registry, decisions, validation history, risk notes, and next pointer.
- Summary:
  - Prompt 17 now gives Map Explorer a typed incoming Urban method request adapter. Urban can request compatible layer focus, AOI validation, workflow preview, derived-layer preview, or report snapshot preparation; Map evaluates readiness and displays explicit blockers before any commit.
- Spatial evidence/provenance changes:
  - Incoming request previews record Map review timeline events with request IDs, method IDs, action types, compatible layer IDs, QA issue IDs, and readiness counts.
  - No new evidence artifact kind was added and no raw spatial payload crosses the Urban -> Map contract.
- CRS, geometry, or measurement changes:
  - No new spatial calculation was added.
  - Layer compatibility checks compare requested geometry family, required fields, temporal field metadata, queryability, feature count, and required CRS metadata using existing Map layer summaries.
- Scientific QA changes:
  - Preview output carries QA blockers from current Map Scientific QA and blocks derived-layer publication previews until blockers are resolved.
  - Missing AOI/fields/CRS/queryability are surfaced as explicit prerequisites rather than silent readiness.
- Layer registry or persistence changes:
  - No persistence schema change.
  - Incoming requests only open preview panels and summarize compatible layer IDs; they do not mutate layer visibility, source data, active result layers, or persisted map state.
- Workflow/export/report changes:
  - Urban workflow/derived-layer requests build a `MapWorkflowDraft` and preview summary through `generateMapWorkflowPreview`, then pass the draft into `MapWorkflowDrawer` for explicit user review and Apply.
  - Report snapshot requests open the existing Map report handoff preview when readiness is not blocked; report insertion remains explicit through the existing drawer action.
- Contract changes:
  - New `UrbanToMapMethodRequest` contract in `src/services/map/UrbanToMapMethodRequestAdapter.ts` for Urban Analytics -> Map Explorer method requests.
  - New `UrbanToMapMethodRequestPreview` readiness output for Map-owned compatibility, AOI, workflow, QA, and report snapshot previews.
  - New `URBAN_TO_MAP_METHOD_REQUEST_EVENT = "urban:map-method-request"` CustomEvent subscription helper for manual simulation and future Urban emitters.
  - Additive `MapWorkflowDrawer.initialDraftRequest` prop for preview-only external workflow draft selection.
- UX changes:
  - Incoming Urban requests produce command feedback, toast/announcement status, and review timeline entries.
  - Compatible-layer requests open the layer rail; AOI requests open the draw panel or Scientific QA panel; workflow/derived-layer requests open the workflow drawer with the requested draft; report requests open report preview only when not blocked.
- Validation:
  - `npm run test -- src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts` passed (4/4).
  - `npm run test -- src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts` passed (7/7).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/services/map/UrbanToMapMethodRequestAdapter.ts src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/components/map/MapWorkflowDrawer.tsx` passed with no output.
  - `git diff --check` passed; only LF-to-CRLF working-copy warnings were reported.
  - VS Code Problems check reported no errors for touched Prompt 17 files.
- Known risks:
  - The incoming event is now Map-ready, but no Urban UI emitter was added in this prompt; future Urban prompt work should dispatch the documented event instead of importing Map internals.
  - Preview choreography still sits in the large `MapExplorerModal.tsx` orchestrator; extract to a command hook when a decomposition prompt authorizes it.
- Blockers: None for Prompt 17.
- Decisions made:
  - Urban method requests are preview-first; derived layers, workflow apply, and report insertion stay explicit user actions.
  - Map Explorer owns map-side compatibility/readiness evaluation; Urban Analytics owns method semantics and data-fitness interpretation.
  - Urban -> Map payloads and previews remain reference/scalar/summary-only and exclude GeoJSON/sourceData/coordinates/map instances.
- Next recommended prompt: Prompt 18 - Map to IDE Code and Manifest Artifact Requests.
- Ledger updated: yes

### Prompt 18 - Map to IDE Code and Manifest Artifact Requests

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`, `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 18, `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`, `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.5 and 19, `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md` IDE handoff sections, and this ledger.
  - `src/services/editorBridge.ts`, `src/services/editor/bridge.ts`, `src/services/editor/bridgeAdapter.ts`, `src/services/synapseBus.ts`, and `src/types/synapse-bus.ts` — IDE tab bridge, legacy bridge, typed bus, and evidence registration contracts.
  - `src/services/map/mapToIdeHandoff.ts` and `src/services/map/__tests__/mapToIdeHandoff.test.ts` — existing IDE-side receiver inspected to avoid duplicating inbound logic.
  - `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/map/mapEvidenceArtifacts.ts`, and `src/stores/useMapExplorerStore.ts` — Map evidence artifact, reproducibility manifest, and evidence registry contracts.
  - `src/services/map/MapWorkflowService.ts` and `src/services/map/MapExportService.ts` — workflow preview manifests and publication readiness/composition contracts.
  - `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/MapLayerManager.tsx`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, and `src/centerpanel/components/MapExportDialog.tsx` — explicit UI action surfaces.
  - `src/features/urbanAnalytics/context/codeArtifactRequests.ts` and focused Urban code-artifact tests — local pattern for explicit IDE artifact generation and bridge dispatch.
- Files changed:
  - `src/services/map/MapCodeArtifactRequestService.ts` — new Map-owned IDE artifact request builder/dispatcher for workflow scripts, workflow notebooks, map manifests, SQL query scaffolds, and export package notes.
  - `src/services/map/__tests__/MapCodeArtifactRequestService.test.ts` — focused coverage for reference-only content, notebook/script/manifest/SQL generation, IDE bridge dispatch, lightweight `evidence.artifact.register` events, and evidence-only routing.
  - `src/services/editorBridge.ts` — added SQL language support and SQL inference so generated SQL opens with the correct editor mode.
  - `src/centerpanel/components/MapExplorerModal.tsx` — wired explicit layer, workflow, and export IDE actions; registers generated requests as Map `ide-code-reference` evidence; records review timeline events.
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx` — added an explicit `IDE script` action for current workflow previews while preserving the existing Apply action.
  - `src/centerpanel/components/MapExportDialog.tsx` — added compact explicit `IDE manifest` and `IDE note` actions beside export controls.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, contract registry, decisions, validation history, risk notes, and next pointer.
- Summary:
  - Prompt 18 now lets Map Explorer open reproducible IDE artifacts by explicit user action. Generated artifacts carry layer IDs, AOI references, CRS summaries, QA caveats, workflow/publication metadata, and file suggestions while excluding raw GeoJSON, source buffers, rendered images, and large tables.
- Spatial evidence/provenance changes:
  - Generated IDE requests are registered as Map evidence artifacts of kind `ide-code-reference` with linked layer IDs, linked AOI/workflow/file IDs, QA issue IDs, provenance notes, CRS summaries, and scalar metadata.
  - Dispatch also publishes lightweight `evidence.artifact.register` events through `synapseBus`; event payloads carry references/metadata only, never generated content.
- CRS, geometry, or measurement changes:
  - No new spatial calculations were added.
  - Generated scripts/manifests preserve CRS-by-layer references and state that analytical distance/area work must project before computation.
- Scientific QA changes:
  - Generated artifacts include current QA status, issue IDs, blocker/caveat counts, and caveat text where present.
  - Oversized generated content is rejected before IDE bridge dispatch.
- Layer registry or persistence changes:
  - No persistence schema change.
  - Existing Map evidence registry is used through `upsertMapEvidenceArtifact`; evidence artifact payloads remain scalar/reference-only.
- Workflow/export/report changes:
  - Workflow drawer can now open a Python reproducibility script from the current `MapWorkflowPreview.manifest` without applying a workflow.
  - Export dialog can open a JSON map context manifest or Markdown export package note before or after export readiness review.
  - Layer rail `IDE` action now opens a SQL query scaffold for the selected layer.
- Contract changes:
  - New `MapCodeArtifactRequest` contract in `src/services/map/MapCodeArtifactRequestService.ts` for Map Explorer -> Synapse IDE generated artifact requests.
  - New `dispatchMapCodeArtifactRequest` bridge dispatcher with size cap, `editorBridge.openNewTab` routing, and lightweight `evidence.artifact.register` event publication.
  - Extended `SupportedLang` in `src/services/editorBridge.ts` with `sql`.
- UX changes:
  - Existing layer rail `IDE` action is now active when eligible and opens a SQL scaffold in a new IDE tab.
  - Workflow drawer shows a compact `IDE script` action near the manifest summary.
  - Map export dialog shows compact `IDE manifest` and `IDE note` actions beside Cancel/Download.
  - All IDE artifact openings remain explicit user actions; no silent insert/replace of the active editor occurs.
- Validation:
  - `npm run test -- src/services/map/__tests__/MapCodeArtifactRequestService.test.ts` passed (4/4).
  - `npm run test -- src/services/map/__tests__/MapCodeArtifactRequestService.test.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts` passed (11/11).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/services/map/MapCodeArtifactRequestService.ts src/services/map/__tests__/MapCodeArtifactRequestService.test.ts src/services/editorBridge.ts src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/components/map/MapWorkflowDrawer.tsx src/centerpanel/components/MapExportDialog.tsx` passed with no output.
  - `git diff --check` passed; only LF-to-CRLF working-copy warnings were reported.
  - VS Code Problems check reported no errors for touched Prompt 18 files.
- Known risks:
  - Prompt 18 opens generated artifacts through the existing `editorBridge.openNewTab` because the typed bus `ide.file.open` is path-only and cannot carry new file content. Future IDE prompts may formalize a bus event for contentful generated tabs.
  - UI orchestration still lives in `MapExplorerModal.tsx`; extract into smaller command hooks when a decomposition prompt authorizes it.
- Blockers: None for Prompt 18.
- Decisions made:
  - Map Explorer owns outgoing IDE artifact request generation; Synapse IDE owns editor tabs/files.
  - Generated code/manifests are opened only after explicit user actions and never inserted into the active editor silently.
  - Prompt 18 uses Map evidence registration plus lightweight Synapse bus artifact events; it does not mutate Urban Analytics context or send heavy spatial payloads.
  - SQL is a first-class editor bridge language for Map-generated query scaffolds.
- Next recommended prompt: Prompt 19 - IDE to Map File and Layer Artifact Recognition.
- Ledger updated: yes

### Prompt 19 - IDE to Map File and Layer Artifact Recognition

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 19, `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.6, 19.1, and 19.2, `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 8.2, `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md` Prompt 21 note, and this ledger.
  - `src/services/map/ideMapHandoff.ts`, `src/services/map/__tests__/ideMapHandoff.test.ts`, `src/services/map/mapToIdeHandoff.ts`, `src/types/synapse-bus.ts`, `src/services/synapseBus.ts`, `src/types/synapse-workspace.ts`, `src/services/commandRegistry.ts`, `src/types/state.ts`, `src/services/map/MapDataImporter.ts`, `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/map/mapEvidenceArtifacts.ts`, `src/stores/useMapExplorerStore.ts`, `src/App.tsx`, and the Urban `ideArtifactRecognition` implementation/tests for alignment only.
- Files changed:
  - `src/services/map/IdeToMapArtifactRecognitionService.ts` — new Map-owned incoming IDE artifact recognition service, classifier, readiness assessor, evidence candidate registration, bounded inbox, and Synapse bus receiver.
  - `src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts` — focused tests for supported file recognition, invalid/unsupported truthfulness, evidence candidate registration, no layer materialization, existing-layer readiness, environment-dependent/code references, and event receiver filtering.
  - `src/App.tsx` — installs the IDE-to-Map receiver at application startup.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risk notes, and next pointer.
- Summary:
  - Prompt 19 now lets Map Explorer consume Synapse IDE `evidence.artifact.register` references from `sourceModule/source = ide` and convert them into map evidence candidates.
  - The service defines the incoming payload shape requested by the prompt: file path, language, artifact kind, data reference, CRS/schema metadata, related Urban context, source module, related layer/run/artifact IDs, manifest metadata, hashes, sizes, title, and summary.
  - Supported recognition covers `.map.json`, `.urban-map-manifest.json`, `.geojson`, `.csv`, `.parquet`/`.geoparquet`, `.gpkg`, `.py`, and `.sql`, plus explicit bus hints such as `map-manifest` and `sql-query`.
  - Readiness is truthfully labeled as `ready`, `needs-review`, `environment-dependent`, `unsupported`, or `blocked`; `canAddLayer` remains false because the receiver does not have a validated File/worker/import handle.
- Spatial evidence/provenance changes:
  - Incoming IDE references register `ide-code-reference` Map evidence artifacts with linked file paths, layer IDs, related artifacts, Urban context IDs when supplied, scalar CRS/schema metadata, and provenance notes.
  - Evidence artifacts store only references and metadata; no GeoJSON, source buffers, coordinates, rendered images, or large tables are copied from IDE events.
- CRS, geometry, or measurement changes:
  - CRS/schema fields from IDE metadata are copied as declarative scalar metadata only.
  - Missing CRS and missing geometry metadata remain warnings; no analytical readiness is claimed from an IDE file extension alone.
  - No measurement logic changed.
- Scientific QA changes:
  - Evidence QA state is derived from readiness: `passed` only for references to an existing Map Explorer layer, `warning` for review/environment-dependent references, and `blocked` for invalid/unsupported references.
  - GeoPackage is recognized but labeled environment-dependent because direct browser import is not exposed by the current `MapDataImporter` pipeline.
- Layer registry or persistence changes:
  - No layer is added or materialized by the receiver.
  - Existing layer references can be marked readiness `ready` and linked to evidence, but active layer state is not changed by the receiver.
- Workflow/export/report changes:
  - None directly. Prompt 20 can consume the new IDE-to-Map evidence candidates when building report handoff evidence.
- Contract changes:
  - New Map-owned contract: `MapIdeArtifactRecognitionPayload`, `MapIdeArtifactClassification`, `MapIdeArtifactReadiness`, `MapIdeArtifactRecognitionResult`, and install/inbox APIs in `IdeToMapArtifactRecognitionService`.
  - Existing typed bus event `evidence.artifact.register` is the incoming bridge; no new loose CustomEvent was added.
- UX changes:
  - No new visible chrome or layout change.
  - Behavior change: IDE-registered map-related file/artifact references can now appear in Map evidence state automatically as candidates, with review/readiness caveats preserved.
- Validation:
  - `npm run test -- src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts` passed (6/6).
  - `npm run test -- src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts src/services/map/__tests__/ideMapHandoff.test.ts src/services/map/__tests__/mapToIdeHandoff.test.ts` passed (33/33).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/services/map/IdeToMapArtifactRecognitionService.ts src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts src/App.tsx` passed with no output.
  - `git diff --check -- src/App.tsx src/services/map/IdeToMapArtifactRecognitionService.ts src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts` passed with no output.
  - VS Code Problems check reported no errors for touched Prompt 19 files.
  - `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` passed and returned Prompt 20.
- Risks:
  - Prompt 19 deliberately does not load browser-local file paths from IDE events; users still need explicit Map Explorer import/validation for new layers because browser file paths are references, not readable file handles.
  - Existing legacy `ideMapHandoff.ts` still contains IDE-command materialization behavior from Synapse IDE Prompt 21. Prompt 19 adds the Map-owned reference receiver rather than rewriting that IDE-side command surface.
- Next recommended prompt: Prompt 20 - Report Handoff Structured Evidence.
- Ledger updated: yes

### Prompt 20 - Report Handoff Structured Evidence

- Date: 2026-05-12
- Agent: GitHub Copilot
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 20, `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 14.6, 21.1, and 21.4, `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 8.5, and this ledger.
  - `src/services/map/MapReportHandoffService.ts`, `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`, `src/services/reporting/types.ts`, `src/services/reporting/storage.ts`, `src/services/reporting/ReportEngine.ts`, `src/services/map/MapExportService.ts`, `src/centerpanel/components/map/mapEvidenceArtifacts.ts`, `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/services/map/MapReviewSessionService.ts`, and focused report/reporting tests.
- Files changed:
  - `src/services/map/MapReportHandoffService.ts` — added `MapReportEvidenceBlock`, structured composition/QA/provenance/snapshot payloads, evidence IDs in reference tables, structured report insert metadata, and direct report document preservation.
  - `src/centerpanel/components/map/MapReportHandoffDrawer.tsx` — added explicit `Register evidence` action for saving structured map report evidence without inserting a report section.
  - `src/centerpanel/components/MapExplorerModal.tsx` — wires drawer evidence registration into Map evidence artifacts and records evidence block IDs/counts on report insertion artifacts.
  - `src/services/reporting/types.ts`, `src/services/reporting/storage.ts`, and `src/services/reporting/ReportEngine.ts` — added optional generic structured evidence block carriage, merge preservation, and compiled section ID pass-through.
  - `src/services/map/__tests__/MapReportHandoffService.test.ts` and `src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` — added focused coverage for structured evidence payloads, no embedded rendered payloads, report insert preservation, review event linkage, direct report documents, and drawer action dispatch.
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` — updated durable prompt state, registries, validation history, risk notes, and next pointer.
- Summary:
  - Prompt 20 makes every Map report handoff draft carry a structured `MapReportEvidenceBlock` with title, layer stack, visible extent, viewport, legend metadata, scale, attribution, CRS summary, QA, caveats, provenance, citations, existing map evidence IDs, reproducibility references, and export snapshot references.
  - Pending report inserts now preserve structured evidence blocks and link generated report sections to the evidence block ID while still rendering human-readable figure, narrative, caveats, reproducibility, and reference tables.
  - The report handoff drawer now exposes an explicit `Register evidence` action that records the structured block as a Map `report-snapshot` evidence artifact without forcing report insertion.
- Spatial evidence/provenance changes:
  - Report evidence blocks include only IDs, scalar metadata, layer summaries, legend entries, QA/caveat strings, and snapshot asset references.
  - No GeoJSON, source data, coordinates beyond viewport/bounds summaries, screenshots, data URLs, or raw rendered payloads are copied into structured evidence blocks or Map evidence artifacts.
  - Report insertion artifacts now record `reportEvidenceBlockId`, evidence block version, layer count, legend count, citation count, report insert ID, report draft ID, and snapshot asset ID.
- CRS, geometry, or measurement changes:
  - CRS is reported as source metadata per layer plus explicit EPSG:4326 display-coordinate summary; the block does not claim projected analytical distance/area readiness.
  - Missing or assumed CRS metadata remains caveated through publication readiness and structured QA notes.
  - No measurement computation changed.
- Scientific QA changes:
  - Evidence blocks preserve publication readiness ID/status/check time, blocker/warning counts, issue IDs, blockers, warnings, caveats, and QA caveat count.
  - Registered report evidence artifacts use existing `mapPublicationReadinessToEvidenceQA` mapping, so blocked report evidence remains blocked in Map evidence state.
- Layer registry or persistence changes:
  - No layer state is mutated and no heavy layer payload is persisted.
  - Reporting storage now preserves optional `structuredEvidenceBlocks` when pending inserts merge into report documents.
- Workflow/export/report changes:
  - Report inserts now carry `structuredEvidenceBlocks` and `structuredEvidenceBlockIds` while preserving current figure/paragraph/bullet/table output.
  - Direct map report document generation also preserves structured evidence blocks.
  - Drawer action registers structured evidence independently from report insertion; Insert to report remains readiness-gated.
- Contract changes:
  - New Map-owned contract: `MapReportEvidenceBlock`, `MapReportEvidenceBlockPayload`, and `MapReportLayerEvidenceItem` in `MapReportHandoffService`.
  - New reporting-compatible generic contract: optional `ReportStructuredEvidenceBlock`, `structuredEvidenceBlocks`, and `structuredEvidenceBlockIds` in reporting types.
- UX changes:
  - Report handoff drawer footer now includes `Register evidence` beside Refresh snapshot, Download A0 PDF, and Insert to report.
  - Existing drawer layout, readiness display, snapshot preview, narrative, citations, caveats, and Insert/PDF gating are preserved.
- Validation:
  - `npm run test -- src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` passed (8/8).
  - `npm run test -- src/services/reporting/__tests__/ReportEngine.test.ts src/services/reporting/__tests__/ReportBuilderPanel.test.tsx src/services/reporting/__tests__/indicatorInserts.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` passed (15/15).
  - `npm run typecheck` passed.
  - `npx eslint --quiet src/services/map/MapReportHandoffService.ts src/centerpanel/components/map/MapReportHandoffDrawer.tsx src/centerpanel/components/MapExplorerModal.tsx src/services/reporting/types.ts src/services/reporting/storage.ts src/services/reporting/ReportEngine.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` passed with no output.
  - `git diff --check -- src/services/map/MapReportHandoffService.ts src/centerpanel/components/map/MapReportHandoffDrawer.tsx src/centerpanel/components/MapExplorerModal.tsx src/services/reporting/types.ts src/services/reporting/storage.ts src/services/reporting/ReportEngine.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` passed with LF-to-CRLF working-copy warnings only.
  - VS Code Problems check reported no errors for touched Prompt 20 files.
  - `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` passed and returned Prompt 21.
- Risks:
  - Structured evidence block rendering in the report builder is currently represented by generated tables and preserved metadata; richer visual inspection of `structuredEvidenceBlocks` can be improved in Prompt 21 reporting/dashboard outputs.
  - The new drawer action remains wired in `MapExplorerModal.tsx`; a later decomposition prompt should extract report evidence commands into a smaller hook if the modal continues to grow.
- Next recommended prompt: Prompt 21 - Dashboard, Education, and Publication Outputs.
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
| 2026-05-12 | Prompt 20 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 20; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 14.6, 21.1, and 21.4; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 8.5; `src/services/map/MapReportHandoffService.ts`; `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`; `src/services/reporting/types.ts`; `src/services/reporting/storage.ts`; `src/services/reporting/ReportEngine.ts`; `src/services/map/MapExportService.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/services/map/MapReviewSessionService.ts`; focused report/reporting tests | Prompt 20 narrowed to structured map report evidence metadata, report insert compatibility, drawer evidence registration, and evidence artifact binding without redesigning the report builder or moving heavy map/render payloads. |
| 2026-05-12 | Prompt 19 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 19; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.6, 19.1, and 19.2; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md` section 8.2; `DEVELOPMENT_PLANS/SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md` Prompt 21 note; `src/services/map/ideMapHandoff.ts`; `src/services/map/__tests__/ideMapHandoff.test.ts`; `src/services/map/mapToIdeHandoff.ts`; `src/types/synapse-bus.ts`; `src/services/synapseBus.ts`; `src/types/synapse-workspace.ts`; `src/services/commandRegistry.ts`; `src/types/state.ts`; `src/services/map/MapDataImporter.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/stores/useMapExplorerStore.ts`; `src/App.tsx`; Urban IDE artifact recognition implementation/tests for alignment only | Prompt 19 narrowed to a Map-owned incoming IDE artifact receiver that consumes existing typed bus evidence events, classifies file/artifact references, registers map evidence candidates, and refuses layer materialization without Map validation. |
| 2026-05-12 | Prompt 18 | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 18; `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.5 and 19; `DEVELOPMENT_PLANS/SYNAPSE_IDE_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/services/editorBridge.ts`; `src/services/editor/bridge.ts`; `src/services/editor/bridgeAdapter.ts`; `src/services/synapseBus.ts`; `src/types/synapse-bus.ts`; `src/services/map/mapToIdeHandoff.ts`; `src/services/map/__tests__/mapToIdeHandoff.test.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/stores/useMapExplorerStore.ts`; `src/services/map/MapWorkflowService.ts`; `src/services/map/MapExportService.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/MapLayerManager.tsx`; `src/centerpanel/components/map/MapWorkflowDrawer.tsx`; `src/centerpanel/components/MapExportDialog.tsx`; `src/features/urbanAnalytics/context/codeArtifactRequests.ts`; focused Urban and Map adapter tests | Prompt 18 narrowed to a Map-owned outgoing IDE artifact request service with explicit UI actions, new generated artifact evidence, and reference-only bridge/bus payloads. |
| 2026-05-12 | Prompt 17 | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 17; `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.4, 20.2, and 20.4; `DEVELOPMENT_PLANS/URBAN_ANALYTICS_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/features/urbanAnalytics/store.ts`; `src/features/urbanAnalytics/useUrbanContextStore.ts`; `src/stores/useMapExplorerStore.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/useMapAoiDispatch.ts`; `src/centerpanel/components/map/useMapPanelCommands.ts`; `src/services/map/MapWorkflowService.ts`; `src/centerpanel/components/map/MapWorkflowDrawer.tsx`; `src/services/map/MapAnalysisRecommender.ts`; `src/services/map/MapReportHandoffService.ts`; `src/services/map/MapReviewSessionService.ts`; focused Map/Urban adapter tests | Prompt 17 narrowed to a Map-owned incoming Urban method request adapter with preview/readiness behavior only; no Urban internals changed and no map mutation occurs before explicit user action. |
| 2026-05-12 | Prompt 16 | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 16; `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/centerpanel/components/map/mapContextSummary.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/features/urbanAnalytics/context/mapContextAdapter.ts`; `src/features/urbanAnalytics/lib/types.ts`; `src/features/urbanAnalytics/store.ts`; `src/features/urbanAnalytics/useUrbanContextStore.ts`; `src/services/map/MapAnalysisDispatcher.ts`; `src/services/map/MapSyncService.ts`; `src/stores/useMapExplorerStore.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/MapLayerManager.tsx`; focused Map/Urban adapter tests | Prompt 16 narrowed to a Map-owned outbound Urban context payload and explicit layer rail action wired to the existing Urban receiver; payloads carry references/summaries only and do not move raw spatial data. |
| 2026-05-12 | Prompt 15 | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`; `DEVELOPMENT_PLANS/AGENT_AMNESIA_PREVENTION_PROTOCOL.md`; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 15; `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`; `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/MapMeasurementTool.tsx`; `src/utils/geodesic.ts`; `src/centerpanel/components/MapDrawingManager.tsx`; `src/utils/drawingHelpers.ts`; `src/services/map/MapScientificQA.ts`; `src/centerpanel/components/map/mapLayerMetadata.ts`; `src/services/map/MapExportService.ts`; `src/services/map/MapAnalysisBounds.ts`; `src/stores/useMapExplorerStore.ts`; focused measurement/drawing/QA/export tests | Prompt 15 narrowed to measurement assumptions, conservative drawn geometry validation, normalized CRS metadata resolution, geometry-aware publication readiness, and degenerate-bounds rejection without changing external owners or moving heavy spatial payloads. |
| 2026-05-11 | Prompt 14 | `DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`; `DEVELOPMENT_PLANS/TRI_MODAL_WORKBENCH_ALIGNMENT_SPEC.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 12 M9, 14.4, 14.8, 15.2, 23; `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 14; `DEVELOPMENT_PLANS/MAP_EXPLORER_PROMPT_MANIFEST.json`; `DEVELOPMENT_PLANS/MAP_EXPLORER_AGENT_HANDOFF_TEMPLATE.md`; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/services/map/MapDataImporter.ts`; `src/services/map/MapDataExporter.ts`; `src/services/map/ExternalServiceConnector.ts`; `src/services/map/ExternalServiceQueue.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/MapServiceDialog.tsx`; `src/centerpanel/components/map/MapToolbar.tsx`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapLayerMetadata.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; focused import/export and external service tests | Prompt 14 narrowed to QA-aware import/external-service source metadata, evidence candidate registration, dependency/caveat fields, and conservative CRS state preservation without changing spatial calculations or adding providers. |
| 2026-05-11 | Prompt 13 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 13; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/services/map/MapEngineAdapter.ts`; `src/services/map/SpatialStatsExecutionService.ts`; `src/services/map/SpatialStatsExecutionQueue.ts`; `src/centerpanel/components/map/mapTypes.ts`; `src/centerpanel/components/map/mapEvidenceArtifacts.ts`; `src/stores/useMapExplorerStore.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/Tools/components/GeoAILab.tsx`; `src/centerpanel/components/ObjectDetectorPanel.tsx`; adapter-backed centerpanel flows; focused adapter/spatial-stats/object-detection tests | Prompt 13 narrowed to engine adapter evidence outputs, evidence-aware completed-run map output round-trips, and Map Explorer publication-boundary evidence registry upserts without changing algorithms or copying heavy payloads. |
| 2026-05-11 | Prompt 12 UI polish | `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`; `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`; `src/centerpanel/components/MapExplorerModal.tsx`; browser snapshot via dev server | User-requested readability pass for the Map Command Center modal after Prompt 12; scope limited to cockpit layout/CSS and visual inspection. |
| 2026-05-11 | Prompt 12 | `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt 12; `DEVELOPMENT_PLANS/MAP_EXPLORER_DEVELOPMENT_PLAN.md` sections 8.3, 18.1, 18.2, 20.1; `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`; `src/services/map/MapAnalysisRecommender.ts`; `src/services/map/MapAnalysisDispatcher.ts`; `src/centerpanel/components/MapExplorerModal.tsx`; `src/centerpanel/components/map/useMapAoiDispatch.ts`; `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`; `src/centerpanel/components/map/MapWorkflowDrawer.tsx`; `src/stores/useFlowStore.ts`; `src/features/urbanAnalytics/useUrbanContextStore.ts`; focused recommender/dispatcher tests | Prompt 12 narrowed to explainable recommendation reasons/readiness, lightweight dispatch context/layer references, explicit workflow dispatch audit, and cockpit recommendation surfacing. |
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
| 2026-05-12 | Prompt 20 | `src/services/map/MapReportHandoffService.ts`, `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/services/reporting/types.ts`, `src/services/reporting/storage.ts`, `src/services/reporting/ReportEngine.ts`, `src/services/map/__tests__/MapReportHandoffService.test.ts`, `src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added structured Map report evidence blocks, optional reporting structured evidence preservation, drawer evidence-registration action, Map evidence artifact binding metadata, and focused report/reporting coverage. |
| 2026-05-12 | Prompt 19 | `src/services/map/IdeToMapArtifactRecognitionService.ts`, `src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts`, `src/App.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added Map-owned IDE artifact recognition payload/result/readiness contract, supported extension classification, evidence candidate registration, typed bus receiver, App install wiring, and focused validation for no layer materialization without validation. |
| 2026-05-12 | Prompt 18 | `src/services/map/MapCodeArtifactRequestService.ts`, `src/services/map/__tests__/MapCodeArtifactRequestService.test.ts`, `src/services/editorBridge.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, `src/centerpanel/components/MapExportDialog.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added Map-owned IDE artifact request generation/dispatch, SQL language support, explicit layer/workflow/export IDE actions, Map `ide-code-reference` evidence registration, lightweight Synapse bus artifact events, and focused no-heavy-payload coverage. |
| 2026-05-12 | Prompt 17 | `src/services/map/UrbanToMapMethodRequestAdapter.ts`, `src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added Map-owned Urban method request contract, preview/readiness builder, event subscribe/publish helpers, workflow/report preview-only modal wiring, drawer initial draft support, review timeline capture, and focused no-heavy-payload coverage. |
| 2026-05-12 | Prompt 16 | `src/services/map/MapToUrbanContextAdapter.ts`, `src/services/map/__tests__/MapToUrbanContextAdapter.test.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added Map-owned Urban context payload/readiness/event/receiver adapter, focused no-heavy-payload coverage, explicit layer rail Urban handoff wiring, feedback/review events, and durable ledger updates. |
| 2026-05-12 | Prompt 15 | `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/MapMeasurementTool.tsx`, `src/centerpanel/components/MapDrawingManager.tsx`, `src/centerpanel/components/map/mapLayerMetadata.ts`, `src/services/map/MapScientificQA.ts`, `src/services/map/MapExportService.ts`, `src/services/map/MapAnalysisBounds.ts`, `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`, `src/services/map/__tests__/MapScientificQA.test.ts`, `src/services/map/__tests__/MapExportService.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added WGS84 geodesic measurement assumptions, stored drawn geometry validation metadata, invalid drawing blocking, normalized/import/registry CRS resolution in QA, geometry-aware publication readiness/caveats, degenerate bounds rejection, and focused coverage. |
| 2026-05-11 | Prompt 14 | `src/centerpanel/components/map/mapTypes.ts`, `src/centerpanel/components/map/mapLayerMetadata.ts`, `src/services/map/MapDataImporter.ts`, `src/services/map/ExternalServiceConnector.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/services/map/__tests__/MapDataIO.test.ts`, `src/services/map/__tests__/ExternalServiceConnector.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added import-source metadata, external service dependency/cache/caveat metadata, conservative CRS/attribution QA summaries, layer registry evidence IDs/readiness normalization, evidence registry upserts at import/service publication boundaries, review events, and focused coverage. |
| 2026-05-11 | Prompt 13 | `src/centerpanel/components/map/mapTypes.ts`, `src/services/map/MapEngineAdapter.ts`, `src/services/map/__tests__/MapEngineAdapter.test.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/Tools/components/GeoAILab.tsx`, `src/centerpanel/components/ObjectDetectorPanel.tsx`, `src/centerpanel/Flows/CellularAutomataFlow.tsx`, `src/centerpanel/Flows/CompositeIndicatorFlow.tsx`, `src/centerpanel/Flows/FacilityOptimisationFlow.tsx`, `src/centerpanel/Flows/UrbanMorphologyFlow.tsx`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added adapter-produced map evidence artifacts, evidence-aware analysis metadata, completed-run map output metadata preservation, focused coverage, and registry upserts where Map Explorer publishes adapter-backed analysis layers. |
| 2026-05-11 | Prompt 12 UI polish | `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Enlarged and clarified the Map Command Center modal presentation after user visual review; corrected the context signal strip to remain a single-row rail; recorded validation and visual inspection. |
| 2026-05-11 | Prompt 12 | `src/services/map/MapAnalysisRecommender.ts`, `src/services/map/MapAnalysisDispatcher.ts`, `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/useMapAoiDispatch.ts`, `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`, `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`, `src/services/map/__tests__/MapAnalysisRecommender.test.ts`, `src/services/map/__tests__/MapAnalysisDispatcher.test.ts`, `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` | Added explainable recommendation reasons/readiness, lightweight context/layer/audit dispatch payloads, explicit recommendation dispatch review events, cockpit readiness/reason UI, and focused coverage. |
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
| 2026-05-12 | Prompt 20 | `MapReportEvidenceBlock` + `MapReportEvidenceBlockPayload` | Map Explorer report handoff → reporting / Map evidence registry | Implemented Additive Contract | Drafts now carry structured composition, viewport/bounds, layer stack, legend metadata, scale/north/attribution, CRS summary, QA, caveats, provenance, citations, evidence IDs, reproducibility references, and snapshot asset references. No rendered image data or raw spatial payloads are embedded. |
| 2026-05-12 | Prompt 20 | `ReportStructuredEvidenceBlock` + `structuredEvidenceBlocks` / `structuredEvidenceBlockIds` | Map report inserts → reporting service | Implemented Additive Contract | Reporting types/storage/engine preserve optional structured evidence metadata while existing report section blocks remain compatible. |
| 2026-05-12 | Prompt 20 | Report handoff drawer `onRegisterEvidence` action | Map report drawer → Map evidence registry | Implemented Additive UI Contract | Drawer can explicitly register a structured map evidence artifact without inserting report sections; Insert to report remains readiness-gated. |
| 2026-05-12 | Prompt 19 | `MapIdeArtifactRecognitionPayload` + `MapIdeArtifactRecognitionResult` | Synapse IDE → Map Explorer | Implemented Additive Contract | `src/services/map/IdeToMapArtifactRecognitionService.ts` defines incoming IDE file/artifact references with file path, language, artifact kind, data reference, CRS/schema metadata, related Urban context, source module, and related IDs. Results carry recognition status, artifact kind, language, readiness, evidence ID, warnings, and reason. |
| 2026-05-12 | Prompt 19 | `installIdeToMapArtifactReceiver` on `evidence.artifact.register` | Synapse IDE typed bus → Map evidence registry | Implemented Existing Contract Use | The Map-owned receiver accepts only IDE-originated evidence events, maps them into Prompt 19 recognition payloads, keeps a bounded inbox, and registers map evidence candidates without reading IDE buffers or adding layers. |
| 2026-05-12 | Prompt 19 | IDE reference readiness model | IDE artifact reference → Map layer/evidence safety gate | Implemented Additive Contract | Readiness is labeled `ready`, `needs-review`, `environment-dependent`, `unsupported`, or `blocked`; `canAddLayer` remains false unless a future explicit importer supplies a validated file/worker handle. Existing Map layer references can be linked as ready evidence without materializing duplicates. |
| 2026-05-12 | Prompt 18 | `MapCodeArtifactRequest` + request builders | Map Explorer → Synapse IDE | Implemented Additive Contract | `src/services/map/MapCodeArtifactRequestService.ts` builds workflow scripts, workflow notebooks, map manifests, SQL query scaffolds, and export package notes with artifact IDs, target file suggestions, layer/AOI/workflow references, CRS summaries, QA caveats, and no raw spatial payloads. |
| 2026-05-12 | Prompt 18 | `dispatchMapCodeArtifactRequest` | Map Explorer → IDE bridge / Synapse bus | Implemented Additive Contract | Routes generated content to `editorBridge.openNewTab`, enforces a 32 KB size cap, returns dispatch status, and emits lightweight `evidence.artifact.register` events without content. |
| 2026-05-12 | Prompt 18 | Map evidence kind `ide-code-reference` registration | Map Explorer generated artifact → Map evidence registry | Implemented Existing Contract Use | Generated IDE requests upsert Map evidence artifacts with linked layer/file/AOI/workflow IDs, QA issue IDs, provenance notes, CRS summaries, and scalar metadata. |
| 2026-05-12 | Prompt 18 | `SupportedLang` includes `sql` | Map IDE artifacts → editor bridge | Implemented Additive Contract | SQL scaffolds can open in the IDE bridge with `language: "sql"`; SQL fence/content inference was added to `src/services/editorBridge.ts`. |
| 2026-05-12 | Prompt 17 | `UrbanToMapMethodRequest` + `buildUrbanToMapMethodRequestPreview` | Urban Analytics → Map Explorer | Implemented Additive Contract | `src/services/map/UrbanToMapMethodRequestAdapter.ts` accepts method/action requirements for compatible layers, AOI validation, workflow preview, derived-layer preview, and report snapshot preview. Map returns readiness summaries, compatible layer IDs, missing prerequisites, QA blockers, workflow draft summary, and report snapshot readiness only. |
| 2026-05-12 | Prompt 17 | `URBAN_TO_MAP_METHOD_REQUEST_EVENT = "urban:map-method-request"` + subscription helpers | Urban Analytics / manual simulator → Map Explorer | Implemented Additive Contract | Map Explorer subscribes while the modal is open and records previewed review timeline events. Future Urban emitters should dispatch this event rather than import Map store internals. |
| 2026-05-12 | Prompt 17 | `MapWorkflowDrawer.initialDraftRequest` | Map request adapter → workflow drawer UI | Implemented Additive UI Contract | Allows incoming Urban workflow requests to open the correct preview draft while preserving the existing explicit Apply action. No workflow output is applied by this prop. |
| 2026-05-12 | Prompt 16 | `MapToUrbanContextPayload` + `sendMapContextToUrban` | Map Explorer → Urban Analytics | Implemented Additive Contract | `src/services/map/MapToUrbanContextAdapter.ts` builds a versioned handoff payload with AOI reference, layer summaries, selected counts, field summaries, CRS/QA summaries, evidence summaries, workflow/result IDs, and disabled reasons. Contract is reference/scalar-only; tests assert serialized payloads do not include GeoJSON feature collections or coordinate arrays. |
| 2026-05-12 | Prompt 16 | `MAP_TO_URBAN_CONTEXT_EVENT = "map:urban-sync:provided"` | Map Explorer → optional observers / Urban integration diagnostics | Implemented Additive Contract | The explicit send action publishes a CustomEvent after receiver execution unless disabled. Existing Urban `applyMapContextToUrban` remains the authoritative receiver for Urban context/evidence/recommendation updates. |
| 2026-05-12 | Prompt 15 | `Measurement.assumptions: MeasurementAssumptions` | Map measurement tool → store / clipboard / future evidence-report consumers | Implemented Additive Contract | Completed measurements can now disclose WGS84 geodesic method, EPSG:4326 display-coordinate basis, distance/area model, base units, and caveats. Existing measurements without the optional field remain valid. |
| 2026-05-12 | Prompt 15 | `DrawnFeature.properties.validation: DrawnGeometryValidation` | Map drawing manager → AOI/readiness/workflow consumers | Implemented Additive Contract | Drawn features can now carry valid/warning/blocked/unknown validation state, issue codes, caveats, and check timestamp. Invalid browser-created drawings are blocked before storage. |
| 2026-05-11 | Prompt 14 | `LayerMetadata.importSource: ImportLayerSourceMetadata` | Map import pipeline → layer registry / evidence / export-report readiness | Implemented Additive Contract | Local imports now carry format, file/source name, import timestamp, feature/skipped counts, source confidence, declared CRS when present, worker transfer status, and caveats. Raw imported features remain on the map layer only. |
| 2026-05-11 | Prompt 14 | `ExternalServiceLayerMetadata` dependency/cache/stale/offline fields | External service connector → layer registry / evidence / review timeline | Implemented Additive Contract | Service layers now carry dependency status, last request, cache hit/TTL/stale timestamp, CORS/credential mode, license/attribution, and caveats without adding new providers or storing service payloads in evidence. |
| 2026-05-11 | Prompt 14 | `createMapLayerEvidenceArtifact` publication-boundary registration | Import/service layer publication → Map evidence registry | Implemented Existing Contract Use | `MapExplorerModal` now upserts layer evidence artifacts when local imports and external service layers are added, using scalar metadata and layer IDs only. |
| 2026-05-11 | Prompt 13 | `AnalysisAdapterResult.evidenceArtifact` | Engine adapters → Map evidence registry / completed-run producers | Implemented Additive Contract | Every adapter result now returns a lightweight `MapEvidenceArtifact` paired with the layer. Publication boundaries can upsert it directly without reading layer source data. |
| 2026-05-11 | Prompt 13 | `AnalysisResultMetadata` lineage/QA/evidence fields | Engine adapters → layer registry / reports / dashboards / IDE future consumers | Implemented Additive Contract | Analysis metadata now carries source run/layer IDs, algorithm/workflow ID, output mode, QA summary, caveats, evidence artifact ID, handoff hints, parameters, and scalar summaries. |
| 2026-05-11 | Prompt 13 | `createAnalysisMapOutput` metadata preservation | Map completed runs → map layer bridge round-trip | Implemented Additive Contract | Completed-run map outputs preserve evidence ID, source run/workflow, output mode, QA summary, caveats, handoff hints, and reproducibility manifests for `adaptAnalysisMapOutput`. |
| 2026-05-11 | Prompt 12 | `MapAnalysisRecommendationReason` + `MapAnalysisRecommendationReadiness` | Map recommender → cockpit / dispatch / future workflow consumers | Implemented Additive Contract | Recommendations now carry reason kind/tone/detail and readiness status/blockers/warnings/required actions. Built from visible layer type, geometry, fields, temporal data, AOI, QA, manifest/provenance, selection, and Urban context signals. |
| 2026-05-11 | Prompt 12 | `MapAnalysisDispatchContextSummary` + `MapAnalysisLayerReference` + `MapAnalysisDispatchAuditSummary` | Map Explorer dispatch → workflows / future Urban adapter | Implemented Additive Contract | Existing AOI/isochrone/hotspot dispatches can carry lightweight map context, visible/recommendation layer references, Urban context summary, and explicit/reversible audit metadata. No raw layer source data or geometry buffers are copied. |
| 2026-05-11 | Prompt 12 | `MAP_ANALYSIS_RECOMMENDATION_KEY` + `MapAnalysisRecommendationDispatchPayload` | Map recommendation action → workflow stepData sidecar | Implemented Additive Contract | Open-flow recommendation actions queue a sidecar recommendation payload while preserving `MAP_ANALYSIS_DISPATCH_KEY` for existing dispatch variants. Navigation remains explicit and user-triggered. |
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
| 2026-05-12 | Prompt 20 | Structured report evidence blocks preserve map composition metadata and references, but not rendered image data or raw spatial data. | Report/dashboard consumers need auditable evidence context without duplicating map canvas captures, GeoJSON, source buffers, or large tables. | Accepted |
| 2026-05-12 | Prompt 20 | Report insertion remains gated by publication readiness; registering evidence is allowed as an explicit Map evidence action with QA state preserved. | Evidence registration can document blocked/caveated context, while formal report insertion should not proceed through blockers. | Accepted |
| 2026-05-12 | Prompt 19 | IDE-originated file paths are evidence references until Map Explorer obtains and validates an importable File/worker/layer handle. | Browser-local paths in IDE events are not readable data handles; treating them as map-ready layers would overstate readiness and violate prompt safety. | Accepted |
| 2026-05-12 | Prompt 19 | GeoPackage references are recognized but environment-dependent rather than directly import-ready. | `MapDataImporter` does not expose direct `.gpkg` import in the current live repository; truthful recognition is safer than pretending support exists. | Accepted |
| 2026-05-12 | Prompt 19 | Code artifacts (`.py`, `.sql`) register as map evidence/reproducibility references, not layers. | Scripts and queries can describe how data was produced, but they do not provide validated geometry/CRS/schema output by themselves. | Accepted |
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
| 2026-05-11 | Prompt 12 | Recommendation readiness is advisory and pre-dispatch; it must explain blockers/warnings but must not silently execute workflows. | Recommendations influence analytical choices, so the user must explicitly dispatch and review assumptions before workflow execution. | Accepted |
| 2026-05-11 | Prompt 12 | Dispatch handoffs may include context summaries and layer references only, not raw layer data or large geometries. | Keeps Map -> workflow/Urban payloads bounded and preserves Map Explorer ownership of render/source buffers. | Accepted |
| 2026-05-11 | Prompt 13 | Engine adapter evidence artifacts must store references, scalar summaries, QA/caveats, and CRS/geometry summaries only. | Preserves auditable engine outputs without duplicating map layer sourceData, raw GeoJSON, rendered images, or large geometry buffers. | Accepted |
| 2026-05-11 | Prompt 13 | Demo, synthetic, and unknown adapter outputs must remain explicitly labelled in metadata and evidence QA caveats. | Prevents exploratory outputs from being represented as real analytical evidence or publication-ready results. | Accepted |
| 2026-05-11 | Prompt 14 | Local imports must not infer CRS certainty from coordinates or file extension alone. | Prevents GeoJSON/CSV/KML/GPX display coordinates from being treated as analytical CRS readiness before Prompt 15 validation. | Accepted |
| 2026-05-11 | Prompt 14 | External service evidence stores endpoint/dependency metadata and scalar QA state only, never raw service payloads or tiles. | Keeps external service layers auditable without duplicating remote data, images, or large feature payloads in evidence artifacts. | Accepted |
| 2026-05-11 | Prompt 14 | Remote CityJSON without a declared `referenceSystem` keeps CRS unknown. | Avoids placeholder CRS strings that could be misread as verified analytical CRS metadata. | Accepted |
| 2026-05-12 | Prompt 15 | Browser measurements must identify themselves as WGS84 geodesic display-coordinate measurements. | Haversine distance and spherical polygon area are useful map tools but are not projected engineering/cadastral measurement claims. | Accepted |
| 2026-05-12 | Prompt 15 | QA may honor normalized/import/registry CRS metadata only when the metadata is declared and known. | Prevents Prompt 14 metadata enrichment from becoming a hidden CRS inference step. | Accepted |
| 2026-05-12 | Prompt 15 | Explicit publication readiness must be merged with current CRS/geometry QA rather than bypassing it. | Publication/report outputs must receive fresh CRS/geometry blockers even when a layer carries older readiness metadata. | Accepted |
| 2026-05-12 | Prompt 16 | Map Explorer owns outbound Urban context payloads; Urban Analytics owns interpretation and Urban evidence mutation. | Preserves tri-modal ownership while letting Map provide spatial context through typed summaries and the existing Urban receiver. | Accepted |
| 2026-05-12 | Prompt 16 | Map to Urban handoff is explicit and user-triggered from the layer rail, not automatic background synchronization. | Urban recommendations should be auditable and based on a deliberate action, with review timeline evidence of the handoff. | Accepted |
| 2026-05-12 | Prompt 16 | Map to Urban payloads must be reference/scalar/summary-only and exclude raw GeoJSON, coordinates, map objects, and source buffers. | Keeps cross-module payloads bounded and prevents duplicating large spatial data outside Map ownership. | Accepted |
| 2026-05-12 | Prompt 17 | Urban to Map method requests are preview-first and must not apply workflows, derived layers, layer visibility, or report inserts automatically. | Urban recommendations can request Map-side preparation, but Map mutations remain explicit user actions with visible readiness and audit state. | Accepted |
| 2026-05-12 | Prompt 17 | Map Explorer owns map-side compatibility/readiness evaluation; Urban Analytics owns method semantics and data-fitness interpretation. | Prevents hidden Urban method logic from leaking into Map while still allowing Map to validate fields, geometry, CRS, AOI, QA, and workflow prerequisites. | Accepted |
| 2026-05-12 | Prompt 17 | Urban to Map request previews must stay reference/scalar/summary-only and exclude raw GeoJSON, sourceData, coordinates, map objects, and heavy buffers. | Keeps the inbound bridge bounded and compatible with tri-modal ownership/performance constraints. | Accepted |
| 2026-05-12 | Prompt 18 | Map Explorer owns outgoing IDE artifact request generation; Synapse IDE owns generated tabs/files. | Keeps Map responsible for spatial provenance/QA references while respecting IDE ownership of editor state. | Accepted |
| 2026-05-12 | Prompt 18 | Generated Map IDE artifacts open only after explicit user action and never silently insert into the active editor. | Prevents accidental mutation of user code while keeping generated scripts/manifests auditable. | Accepted |
| 2026-05-12 | Prompt 18 | Map-to-IDE generated artifact payloads must stay reference/scalar/summary-only and exclude raw GeoJSON, source buffers, rendered images, and large tables. | Preserves tri-modal ownership and prevents large spatial payloads from crossing the editor bridge. | Accepted |
| 2026-05-12 | Prompt 18 | SQL is a first-class bridge language for Map-generated query scaffolds. | Layer-level IDE actions naturally generate SQL; editor bridge highlighting should match the artifact language. | Accepted |

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
| 2026-05-11 | Prompt 12 | `npx vitest run src/services/map/__tests__/MapAnalysisRecommender.test.ts src/services/map/__tests__/MapAnalysisDispatcher.test.ts` | Passed (10/10) | Covers reason/readiness generation, QA blocker readiness, Urban context ranking/metadata, enriched AOI dispatch payloads, recommendation sidecar dispatch, and legacy dispatch key preservation. |
| 2026-05-11 | Prompt 12 | `npm run typecheck` | Passed | Full TypeScript project typechecks after recommendation readiness contracts, dispatch context/layer/audit payloads, modal wiring, cockpit UI, and tests. |
| 2026-05-11 | Prompt 12 | `npx eslint --quiet src/services/map/MapAnalysisRecommender.ts src/services/map/MapAnalysisDispatcher.ts src/services/map/__tests__/MapAnalysisRecommender.test.ts src/services/map/__tests__/MapAnalysisDispatcher.test.ts src/centerpanel/components/map/useMapAoiDispatch.ts src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/components/map/MapWorkspaceCockpit.tsx` | Passed | Focused error-only lint pass on touched Prompt 12 TS/TSX files produced no errors after modal dispatch wiring repair. |
| 2026-05-11 | Prompt 12 | `git diff --check` | Passed | No whitespace errors; only the existing ledger LF-to-CRLF warning was reported. |
| 2026-05-11 | Prompt 12 | `npm run lint:no-tailwind-centerpanel` | Blocked (repo setup) | `package.json` references `scripts/check-no-tailwind-centerpanel.ps1`, but no `scripts/*tailwind*` file exists in this checkout. |
| 2026-05-11 | Prompt 12 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 13 - Engine Adapter Evidence Outputs`. |
| 2026-05-11 | Prompt 12 UI polish | `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts` | Passed (59/59) | Covers MapWorkspaceCockpit import/render regression after modal readability CSS changes. |
| 2026-05-11 | Prompt 12 UI polish | `npm run typecheck` | Passed | Full TypeScript project typechecks after cockpit modal CSS/layout polish. |
| 2026-05-11 | Prompt 12 UI polish | `npx eslint --quiet src/centerpanel/components/map/MapWorkspaceCockpit.tsx` | Passed | Focused lint on the related component produced no output. |
| 2026-05-11 | Prompt 12 UI polish | `npm run dev` + browser inspection | Passed | Dev server opened at `http://127.0.0.1:3000/`; Map Explorer opened through Command Palette and the navigator cockpit was inspected with Playwright screenshots. |
| 2026-05-11 | Prompt 12 UI polish | `npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts` | Passed (59/59) | Re-run after correcting the context strip to a single-row signal rail. |
| 2026-05-11 | Prompt 12 UI polish | `npm run typecheck` | Passed | Re-run after the single-row context strip correction. |
| 2026-05-11 | Prompt 12 UI polish | `npx eslint --quiet src/centerpanel/components/map/MapWorkspaceCockpit.tsx` | Passed | Re-run after the single-row context strip correction. |
| 2026-05-11 | Prompt 13 | `npx vitest run src/services/map/__tests__/MapEngineAdapter.test.ts src/services/map/__tests__/SpatialStatsExecutionService.test.ts src/centerpanel/components/__tests__/objectDetectionPublish.test.ts` | Passed (26/26) | Covers adapter evidence metadata, completed-run map output round-trips, spatial-stats execution compatibility, and object-detection publication compatibility. |
| 2026-05-11 | Prompt 13 | `npm run typecheck` | Passed | Full TypeScript project typechecks after adapter evidence metadata, output bridge, tests, and publication-boundary evidence upserts. |
| 2026-05-11 | Prompt 13 | `npx eslint src/services/map/MapEngineAdapter.ts src/centerpanel/components/map/mapTypes.ts src/services/map/__tests__/MapEngineAdapter.test.ts src/centerpanel/Tools/components/GeoAILab.tsx src/centerpanel/components/ObjectDetectorPanel.tsx src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/Flows/CellularAutomataFlow.tsx src/centerpanel/Flows/CompositeIndicatorFlow.tsx src/centerpanel/Flows/FacilityOptimisationFlow.tsx src/centerpanel/Flows/UrbanMorphologyFlow.tsx --quiet` | Passed | Focused lint on touched Prompt 13 adapter, test, and publication-boundary files produced no output. |
| 2026-05-11 | Prompt 13 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for the ledger and several touched TSX files. |
| 2026-05-11 | Prompt 13 | `npm run lint:errors` | 1 error (out of scope) | Known unrelated UA error remains: `src/features/urbanAnalytics/lib/workflowReadiness.ts:20` unused import `UrbanMethodValidityEnvelope`. |
| 2026-05-11 | Prompt 14 | `npx vitest run src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/ExternalServiceConnector.test.ts` | Passed (35/35, 2 skipped) | Covers import evidence metadata, skipped rows, CRS unknown, evidence IDs, external dependency/cache state, attribution, WFS CRS request, and CityJSON unknown CRS. |
| 2026-05-11 | Prompt 14 | `npm run typecheck` | Passed | Full TypeScript project typechecks after import/external metadata contracts, registry normalization, modal evidence registration, and tests. |
| 2026-05-11 | Prompt 14 | `npx eslint --quiet src/services/map/MapDataImporter.ts src/services/map/ExternalServiceConnector.ts src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapLayerMetadata.ts src/centerpanel/components/MapExplorerModal.tsx src/services/map/__tests__/MapDataIO.test.ts src/services/map/__tests__/ExternalServiceConnector.test.ts` | Passed | Focused error-only lint on touched Prompt 14 files produced no output. |
| 2026-05-11 | Prompt 14 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for touched Windows files only. |
| 2026-05-11 | Prompt 14 | VS Code Problems check for touched Prompt 14 files | Passed | `get_errors` reported no errors in `MapDataImporter.ts`, `ExternalServiceConnector.ts`, `MapExplorerModal.tsx`, `mapTypes.ts`, `mapLayerMetadata.ts`, and focused tests. |
| 2026-05-11 | Prompt 14 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 15 - CRS, Measurement, and Geometry Validation`. |
| 2026-05-12 | Prompt 15 | `npm install` | Passed | Restored missing `node_modules` so local validation scripts could run. Audit reported 10 vulnerabilities but no install failure and no package-lock change in git status. |
| 2026-05-12 | Prompt 15 | `npm run test -- src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts src/services/map/__tests__/MapScientificQA.test.ts src/services/map/__tests__/MapExportService.test.ts` | Passed (124/124) | Covers measurement assumptions, existing drawing regressions, normalized CRS metadata, invalid geometry export-readiness, and geometry readiness publication caveats. |
| 2026-05-12 | Prompt 15 | `npm run typecheck` | Passed | Full TypeScript project typechecks after Prompt 15 contracts, services, components, and tests. |
| 2026-05-12 | Prompt 15 | `npx eslint --quiet src/centerpanel/components/MapMeasurementTool.tsx src/centerpanel/components/MapDrawingManager.tsx src/centerpanel/components/map/mapTypes.ts src/centerpanel/components/map/mapLayerMetadata.ts src/services/map/MapScientificQA.ts src/services/map/MapExportService.ts src/services/map/MapAnalysisBounds.ts src/services/map/__tests__/MapScientificQA.test.ts src/services/map/__tests__/MapExportService.test.ts src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts` | Passed | Focused error-only lint on touched Prompt 15 files produced no output. |
| 2026-05-12 | Prompt 15 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for touched Windows files only. |
| 2026-05-12 | Prompt 15 | VS Code Problems check for touched Prompt 15 files | Passed | `get_errors` reported no errors in touched Prompt 15 files and focused tests. |
| 2026-05-12 | Prompt 15 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 16 - Map to Urban Context Adapter`. |
| 2026-05-12 | Prompt 16 | `npm run test -- src/services/map/__tests__/MapToUrbanContextAdapter.test.ts` | Passed (3/3) | Covers lightweight payload construction, disabled reasons, CustomEvent publication, receiver hook, and no-heavy-payload serialization assertions. |
| 2026-05-12 | Prompt 16 | `npm run test -- src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/features/urbanAnalytics/__tests__/mapContextAdapter.test.ts` | Passed (6/6) | Verifies the new Map outbound adapter and existing Urban receiver adapter boundary together. |
| 2026-05-12 | Prompt 16 | `npm run typecheck` | Passed | Full TypeScript project typechecks after Map adapter, modal wiring, and tests. |
| 2026-05-12 | Prompt 16 | `npx eslint --quiet src/services/map/MapToUrbanContextAdapter.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/centerpanel/components/MapExplorerModal.tsx` | Passed | Focused error-only lint on touched Prompt 16 files produced no output. |
| 2026-05-12 | Prompt 16 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for touched Windows files only. |
| 2026-05-12 | Prompt 16 | VS Code Problems check for touched Prompt 16 files | Passed | `get_errors` reported no errors in `MapToUrbanContextAdapter.ts`, its focused test, and `MapExplorerModal.tsx`. |
| 2026-05-12 | Prompt 16 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 17 - Urban to Map Method Request Adapter`. |
| 2026-05-12 | Prompt 17 | `npm run test -- src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts` | Passed (4/4) | Covers compatible layer detection, missing fields/AOI/QA blockers, workflow draft preview, report snapshot readiness, event publish/subscribe, and no-heavy-payload serialization. |
| 2026-05-12 | Prompt 17 | `npm run test -- src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts` | Passed (7/7) | Verifies the new incoming Urban request adapter and existing outbound Map context adapter together. |
| 2026-05-12 | Prompt 17 | `npm run typecheck` | Passed | Full TypeScript project typechecks after incoming request adapter, modal subscription wiring, drawer prop, and tests. |
| 2026-05-12 | Prompt 17 | `npx eslint --quiet src/services/map/UrbanToMapMethodRequestAdapter.ts src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/components/map/MapWorkflowDrawer.tsx` | Passed | Focused error-only lint on touched Prompt 17 files produced no output. |
| 2026-05-12 | Prompt 17 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for touched Windows files only. |
| 2026-05-12 | Prompt 17 | VS Code Problems check for touched Prompt 17 files | Passed | `get_errors` reported no errors in `UrbanToMapMethodRequestAdapter.ts`, its focused test, `MapExplorerModal.tsx`, and `MapWorkflowDrawer.tsx`. |
| 2026-05-12 | Prompt 17 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 18 - Map to IDE Code and Manifest Artifact Requests`. |
| 2026-05-12 | Prompt 18 | `npm run test -- src/services/map/__tests__/MapCodeArtifactRequestService.test.ts` | Passed (4/4) | Covers reference-only manifest content, workflow script/notebook generation, SQL bridge dispatch, Synapse bus evidence event publication, and evidence-only route behavior. |
| 2026-05-12 | Prompt 18 | `npm run test -- src/services/map/__tests__/MapCodeArtifactRequestService.test.ts src/services/map/__tests__/MapToUrbanContextAdapter.test.ts src/services/map/__tests__/UrbanToMapMethodRequestAdapter.test.ts` | Passed (11/11) | Verifies Prompt 16, 17, and 18 Map bridge adapters together. |
| 2026-05-12 | Prompt 18 | `npm run typecheck` | Passed | Full TypeScript project typechecks after Map IDE artifact service, SQL bridge support, modal wiring, drawer/export dialog props, and tests. |
| 2026-05-12 | Prompt 18 | `npx eslint --quiet src/services/map/MapCodeArtifactRequestService.ts src/services/map/__tests__/MapCodeArtifactRequestService.test.ts src/services/editorBridge.ts src/centerpanel/components/MapExplorerModal.tsx src/centerpanel/components/map/MapWorkflowDrawer.tsx src/centerpanel/components/MapExportDialog.tsx` | Passed | Focused error-only lint on touched Prompt 18 files produced no output. |
| 2026-05-12 | Prompt 18 | `git diff --check` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for touched Windows files only. |
| 2026-05-12 | Prompt 18 | VS Code Problems check for touched Prompt 18 files | Passed | `get_errors` reported no errors in `MapCodeArtifactRequestService.ts`, its focused test, `editorBridge.ts`, `MapExplorerModal.tsx`, `MapWorkflowDrawer.tsx`, and `MapExportDialog.tsx`. |
| 2026-05-12 | Prompt 19 | `npm run test -- src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts` | Passed (6/6) | Covers supported file classification, invalid/unsupported truthfulness, GeoJSON evidence candidate registration, no layer materialization, existing layer readiness, environment-dependent/code references, and IDE bus receiver filtering. |
| 2026-05-12 | Prompt 19 | `npm run test -- src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts src/services/map/__tests__/ideMapHandoff.test.ts src/services/map/__tests__/mapToIdeHandoff.test.ts` | Passed (33/33) | Verifies the new incoming IDE artifact receiver alongside existing IDE→Map command and Map→IDE receiver suites. |
| 2026-05-12 | Prompt 19 | `npm run typecheck` | Passed | Full TypeScript project typechecks after the Map-owned IDE artifact recognition service, App install wiring, and focused tests. |
| 2026-05-12 | Prompt 19 | `npx eslint --quiet src/services/map/IdeToMapArtifactRecognitionService.ts src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts src/App.tsx` | Passed | Focused error-only lint on touched Prompt 19 files produced no output. |
| 2026-05-12 | Prompt 19 | `git diff --check -- src/App.tsx src/services/map/IdeToMapArtifactRecognitionService.ts src/services/map/__tests__/IdeToMapArtifactRecognitionService.test.ts` | Passed | No whitespace errors in touched Prompt 19 files. |
| 2026-05-12 | Prompt 19 | VS Code Problems check for touched Prompt 19 files | Passed | `get_errors` reported no errors in `IdeToMapArtifactRecognitionService.ts`, its focused test, and `App.tsx`. |
| 2026-05-12 | Prompt 19 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 20 - Report Handoff Structured Evidence`. |
| 2026-05-12 | Prompt 20 | `npm run test -- src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` | Passed (8/8) | Covers structured evidence block payloads, no embedded image payloads in structured metadata, pending insert preservation, review event linkage, direct report documents, and drawer evidence action dispatch. |
| 2026-05-12 | Prompt 20 | `npm run test -- src/services/reporting/__tests__/ReportEngine.test.ts src/services/reporting/__tests__/ReportBuilderPanel.test.tsx src/services/reporting/__tests__/indicatorInserts.test.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` | Passed (15/15) | Verifies reporting compatibility after adding optional structured evidence metadata. |
| 2026-05-12 | Prompt 20 | `npm run typecheck` | Passed | Full TypeScript project typechecks after structured report evidence contracts, drawer action, modal wiring, and reporting type/storage updates. |
| 2026-05-12 | Prompt 20 | `npx eslint --quiet src/services/map/MapReportHandoffService.ts src/centerpanel/components/map/MapReportHandoffDrawer.tsx src/centerpanel/components/MapExplorerModal.tsx src/services/reporting/types.ts src/services/reporting/storage.ts src/services/reporting/ReportEngine.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` | Passed | Focused error-only lint on touched Prompt 20 files produced no output. |
| 2026-05-12 | Prompt 20 | `git diff --check -- src/services/map/MapReportHandoffService.ts src/centerpanel/components/map/MapReportHandoffDrawer.tsx src/centerpanel/components/MapExplorerModal.tsx src/services/reporting/types.ts src/services/reporting/storage.ts src/services/reporting/ReportEngine.ts src/services/map/__tests__/MapReportHandoffService.test.ts src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx` | Passed | No whitespace errors; Git reported LF-to-CRLF working-copy warnings for reporting files only. |
| 2026-05-12 | Prompt 20 | VS Code Problems check for touched Prompt 20 files | Passed | `get_errors` reported no errors in touched Prompt 20 service, modal, drawer, reporting, and test files. |
| 2026-05-12 | Prompt 20 | `powershell -ExecutionPolicy Bypass -File scripts/get-next-map-explorer-prompt.ps1` | Passed | Helper returned `Prompt 21 - Dashboard, Education, and Publication Outputs`. |

### Prompt 21 - Dashboard, Education, and Publication Outputs

- Date: 2026-05-13
- Agent: GitHub Copilot (GPT-5.3-Codex)
- Status: completed
- Files inspected:
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` (Prompt 21 scope)
  - `src/services/map/MapPublicationOutputBindingService.ts`
  - `src/services/map/__tests__/MapPublicationOutputBindingService.test.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/services/map/MapExportService.ts`
- Files changed:
  - `src/services/map/MapPublicationOutputBindingService.ts`
  - `src/features/dashboard/types.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/services/map/__tests__/MapPublicationOutputBindingService.test.ts`
  - `DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`
- Behavior implemented:
  - Added publication-readiness-aware education reference contract input (`publicationReadiness?: MapPublicationReadiness | null`) so education bindings inherit the same truthful QA/readiness state used by publication outputs.
  - Updated `buildMapEducationReference` to compute QA using publication-readiness when provided and include `publicationReadinessStatus` in output metadata.
  - Added explicit dashboard binding traceability for source layer IDs, data fields, visual encoding summary, source context label, and publication-readiness status without making the dashboard module own map state.
  - Added Map-side dashboard descriptor fields for `dataFields`, `visualEncodingSummary`, and `sourceContext` so layer-derived dashboard requests remain inspectable after handoff.
  - Updated Map layer-rail education action wiring in `MapExplorerModal` to build per-layer public-map readiness, pass it into education reference generation, persist readiness ID in the resulting evidence artifact metadata, and record readiness status in the review timeline event details.
  - Preserved explicit static labeling (`bindingMode`, `refreshMode`, `isLive`, `liveStateLabel`) for dashboard and education outputs; no live-binding claims were added.
- Spatial evidence/provenance changed:
  - Education reference artifacts now carry readiness-derived QA state in addition to existing provenance notes and linked evidence IDs.
  - Publication output traceability remains lightweight/reference-only (no heavy geometry or rendered payloads in binding metadata).
- CRS, geometry, or measurement changed:
  - None.
- Scientific QA changed:
  - No QA engine changes. Prompt 21 now propagates existing publication-readiness QA into education-reference output metadata and review events.
- Layer registry or persistence changed:
  - None.
- Workflow/export/report changed:
  - Publication export/report behavior unchanged; Prompt 21 reinforced downstream QA/provenance metadata parity for dashboard/education outputs.
- Cross-module contracts changed:
  - Additive contract extension: `BuildMapEducationReferenceInput.publicationReadiness` in `MapPublicationOutputBindingService`.
  - Additive optional dashboard traceability fields: `DashboardBindingTraceability.sourceLayerIds`, `dataFields`, `visualEncodingSummary`, `sourceContextLabel`, and `publicationReadinessStatus`.
  - No direct ownership violations: dashboard and education modules are invoked through existing binding/navigation contracts.
- Validation run:
  - `npm run typecheck` → Passed.
  - `npx vitest run src/services/map/__tests__/MapPublicationOutputBindingService.test.ts src/services/map/__tests__/MapExportService.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts` → Passed (64/64).
  - `git diff --check -- src/features/dashboard/types.ts src/services/map/MapPublicationOutputBindingService.ts src/centerpanel/components/MapExplorerModal.tsx src/services/map/__tests__/MapPublicationOutputBindingService.test.ts DEVELOPMENT_PLANS/MAP_EXPLORER_IMPLEMENTATION_LEDGER.md` → Passed with LF-to-CRLF warnings only.
- Validation result:
  - Prompt 21 delta validated and compatible with existing publication/readiness and layer-action flows.
- Risks or blockers:
  - Low: Prompt 21 action orchestration remains inside `MapExplorerModal.tsx`; future decomposition prompts can extract these handlers into dedicated hooks/services.
- Next recommended prompt:
  - Prompt 22 - Temporal Playback and Scenario Comparison.
- Ledger updated: yes

| 2026-05-13 | Prompt 21 | `npm run typecheck` | Passed | Full TypeScript project typechecks after Prompt 21 education-readiness propagation and modal action metadata updates. |
| 2026-05-13 | Prompt 21 | `npx vitest run src/services/map/__tests__/MapPublicationOutputBindingService.test.ts src/services/map/__tests__/MapExportService.test.ts src/centerpanel/components/map/__tests__/map-layer-management.test.ts` | Passed (64/64) | Covers static dashboard/education bindings, publication-readiness traceability semantics, and layer-rail eligibility behavior. |

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
| 2026-05-11 | Prompt 12 | `useUrbanContextSummary` does not expose a canonical Urban context ID. | Low | Current Map recommendation/dispatch context uses `studyAreaId` as the optional Urban context ID when available. Prompt 16 should replace this with the formal Map -> Urban context adapter. |
| 2026-05-11 | Prompt 12 | `npm run lint:no-tailwind-centerpanel` still cannot execute because the referenced PowerShell script is absent. | Low | Focused TS/TSX lint passed and Prompt 12 CSS/TSX did not introduce Tailwind classes. Restore or replace `scripts/check-no-tailwind-centerpanel.ps1` in a repo setup/CI maintenance pass. |
| 2026-05-11 | Prompt 13 | Urban Analytics VoxCity panels still publish adapter-backed map outputs without direct Map Explorer evidence registry upserts. | Low | Kept Prompt 13 Map Explorer scoped; their completed-run map outputs preserve evidence metadata via `createAnalysisMapOutput`. Revisit only when the UA/VoxCity prompt scope authorizes touching those files. |
| 2026-05-11 | Prompt 13 | Adapter fallback CRS summaries may be too generic until CRS validation work lands. | Low | Prompt 15 owns CRS/measurement validation; current fallback explicitly caveats unknown source CRS and does not claim analytical readiness. |
| 2026-05-11 | Prompt 14 | External service offline state is usually represented by failed fetches before a layer exists. | Low | Prompt 14 added offline/stale/dependency metadata semantics for layer readiness when present; service-request failure UX remains in `MapServiceDialog`/connector errors. |
| 2026-05-11 | Prompt 14 | Import and service CRS metadata is now more truthful but not yet a measurement gate. | Resolved | Prompt 15 added geodesic measurement disclosure and connected declared/unknown CRS and geometry readiness to QA/publication gates. |
| 2026-05-12 | Prompt 15 | Browser measurement is still not a projected cadastral/engineering measurement engine. | Low | Measurements now carry WGS84 geodesic assumptions and caveats; future analytical engines should still use projected/source-aware methods when exact legal/engineering measurements are required. |
| 2026-05-12 | Prompt 16 | Explicit Urban handoff wiring still lives inside the large `MapExplorerModal.tsx` orchestrator. | Low | Keep current scope minimal; future decomposition prompts should extract the action into a smaller command hook when authorized. |
| 2026-05-12 | Prompt 16 | The new Map-to-Urban CustomEvent is observational; the receiver call remains authoritative. | Low | Continue using `applyMapContextToUrban` for Urban state/evidence/recommendation updates; treat the event as optional integration telemetry unless a later prompt formalizes a bus subscriber. |
| 2026-05-12 | Prompt 17 | The Urban-to-Map event receiver is Map-ready, but no Urban UI emitter was added in this Map prompt. | Low | Future Urban Analytics work should dispatch `URBAN_TO_MAP_METHOD_REQUEST_EVENT` with the documented request contract rather than importing Map internals. |
| 2026-05-12 | Prompt 17 | Incoming request preview orchestration lives in `MapExplorerModal.tsx`. | Low | Keep current behavior minimal and audited; extract into a dedicated command hook when a decomposition prompt authorizes it. |
| 2026-05-12 | Prompt 18 | Generated contentful IDE tabs use `editorBridge.openNewTab` because typed bus `ide.file.open` is path-only. | Low | Keep the bridge use explicit and audited; future IDE prompts may add a contentful generated-tab bus event if needed. |
| 2026-05-12 | Prompt 18 | Prompt 18 UI orchestration lives in `MapExplorerModal.tsx`. | Low | Current scope keeps behavior minimal; future decomposition prompts should extract Map IDE artifact commands into a dedicated hook/service facade. |
| 2026-05-12 | Prompt 19 | The Prompt 19 receiver does not import local IDE file paths directly. | Low | This is intentional browser safety: layer creation still requires explicit Map Explorer import/validation or an existing Map layer/worker reference. |
| 2026-05-12 | Prompt 19 | Legacy `ideMapHandoff.ts` still contains IDE-command materialization behavior from Synapse IDE Prompt 21. | Low | Prompt 19 added a Map-owned reference receiver without rewriting that IDE command surface; revisit only when a cross-module consolidation prompt authorizes it. |
| 2026-05-12 | Prompt 20 | Structured evidence blocks are preserved as metadata and generated tables; the report builder does not yet expose a dedicated structured evidence inspector. | Low | Prompt 21 can enrich dashboard/report publication outputs using the preserved `structuredEvidenceBlocks` contract. |
| 2026-05-12 | Prompt 20 | Report evidence registration action is still orchestrated inside `MapExplorerModal.tsx`. | Low | Keep scope minimal now; extract report commands into a focused hook when a future decomposition prompt authorizes it. |
| 2026-05-13 | Prompt 21 | Dashboard/education binding orchestration still lives in `MapExplorerModal.tsx`. | Low | Keep current contract-safe behavior; extract prompt-21 handlers into a dedicated command hook during future modal decomposition prompts. |

## Next Prompt Pointer

Start with:

`DEVELOPMENT_PLANS/START_HERE_MAP_EXPLORER_AGENT.md`

Prompt:

`Prompt 22 - Temporal Playback and Scenario Comparison`

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
