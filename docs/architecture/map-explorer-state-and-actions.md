# Map Explorer State and Action Architecture

Date: May 2, 2026
Audience: Developers maintaining Map Explorer

Close-out update: May 30, 2026. Prompt 63 adds explicit source-format, CRS/QA, Map/Urban bridge, design/motion, offline-package, collaboration, and RC documentation links. This document remains the state/action architecture baseline; see [`map-crs-and-qa-method-note.md`](map-crs-and-qa-method-note.md) and [`map-urban-bridge-contract.md`](map-urban-bridge-contract.md) for the close-out method notes.

## Core State Model

Map Explorer state is centered on the map store and the modal shell:

- `src/stores/useMapExplorerStore.ts` owns overlay layers, viewport, selection, temporal state, playback, comparison inputs, saved project state, completed runs, and review state.
- `src/centerpanel/components/MapExplorerModal.tsx` orchestrates workspace mode, panel visibility, import/export dialogs, command handlers, map lifecycle, and workflow handoffs.
- Map-specific UI primitives live under `src/centerpanel/components/map/`.

The architectural rule is that map operations must update structured state first, then render UI from that state. Ad hoc DOM-only state is avoided for anything that affects layers, analysis, report handoff, QA, or persistence.

## Store Slice Boundaries

Prompt 3 formalized the store contract under `src/stores/mapExplorer/`. The public hook remains `useMapExplorerStore`, but slice policy modules now define which fields belong to each domain and whether they are persisted or transient.

| Slice | Owns | Persistence policy | Rationale |
| --- | --- | --- | --- |
| Viewport | Modal open state, camera, fit-bounds handoff, base layer | Mixed: `center`, `zoom`, `bearing`, `pitch`, and `activeBaseLayer` persist; modal lifecycle and fit-bounds requests are transient | Restore the user's map view without reviving live UI handoffs. |
| Layers | Overlay layer registry and active analysis result IDs | Mixed: active analysis result IDs persist; `overlayLayers` is transient | Overlay layers may include `sourceData` and large GeoJSON; future source handles restore layer metadata. |
| Sources | `SourceHandle` metadata, restore status, and source registry actions | Persisted metadata only; raw source bytes, local file handles, worker payloads, and `sourceData` are never persisted in Zustand | Layers reference sources by `metadata.sourceId`; restore status is surfaced on the layer while source payloads stay in import/project/runtime services. |
| Selection | Selected feature IDs and focused feature | Mixed: `selectedFeatureIds` persists; focused feature ID is transient | Feature IDs are lightweight bridge metadata; focus is live interaction state. |
| AOI | Active AOI ID and drawn features/tools | Mixed: `activeAoiId` persists; drawn geometries and draw tools are transient | AOI identity is lightweight context; geometry belongs in project/source payloads. |
| QA | Scientific QA and current map bounds | Transient | QA and bounds can go stale and should be recomputed or restored from evidence. |
| Evidence | Map evidence artifact registry | Transient | Evidence is immutable analytical output, not mutable local UI persistence. |
| Review | Review timeline session | Transient | Review history is exported/audited explicitly rather than silently restored. |
| Temporal | Playback state and measurements | Transient | Playback cursors and measurement geometries are live workspace state. |
| Layout | Panel widths, pins, bookmarks, annotations, active tool | Mixed: bounded marks and layout preferences persist; active tool/annotation focus is transient | Lightweight restore UX is safe; interaction focus is session-only. |
| Bridge | Copilot/Urban bridge snapshots, proposals, audit counts | Transient | Bridge payloads must be rebuilt from current typed summaries, not stale localStorage. |

The canonical persisted key list is exported as `MAP_EXPLORER_PERSISTED_STATE_KEYS`; heavy geometry guardrails are exported as `MAP_EXPLORER_HEAVY_GEOMETRY_KEYS`. The persistence helper `partializeMapExplorerState` is the only localStorage boundary for the map store.

Source handles are the exception to the otherwise transient layer registry: `sourceHandles` persist as lightweight `SourceHandle` records only. The source registry service maps canonical storage modes such as `inline-small`, `worker-table`, and `metadata-only` onto the existing layer persistence vocabulary (`inline`, `url`, `metadata`) and maps canonical restore states (`restored`, `recoverable`, `unavailable`) onto the existing layer restore states for backward-compatible snapshots. Persisted handles are sanitized before storage, so a handle that has live geometry in memory is downgraded to `unavailable` unless it has a recoverable worker/cache/url reference.

Heavy geometry keys are explicitly transient:

- `overlayLayers`, because layers can carry `sourceData` with GeoJSON, raster references, or imported source payloads.
- `drawnFeatures`, because drawn AOIs can contain arbitrary geometries and should travel through project/source export paths.
- `measurements`, because measurement geometries are live analysis marks.
- `mapEvidenceArtifacts`, because evidence state is immutable publication output and should be restored through evidence services.

Selectors that return derived arrays are memoized on their owning slice reference. Prefer exported selectors such as `selectVisibleLayerSummaries`, `selectActiveAoi`, and `selectSelectedFeatureCount` over ad hoc whole-store subscriptions when building map panels.

## Layout Primitives

Prompt 35 introduced explicit layout primitives:

- `MapWorkspaceShell`: top-level embedded/modal workspace with rails, center canvas, bottom timeline/status, and constrained viewport behavior.
- `MapPanelRail`: resizable left/right rail with persisted width preferences.
- `MapCanvasRegion`: center surface that preserves minimum usable map height.
- `MapBottomTimeline`: bottom temporal/status band that must not squeeze or clip the map canvas.

Panel docking logic decides whether a panel is a rail, floating panel, or bottom drawer. Narrow viewports prioritize the map canvas and move layer controls into drawers.

## Layer Registry

Layer records must carry enough metadata for scientific review:

- stable `id` and display `name`
- source type and provenance label
- geometry type and feature count
- visible/queryable flags
- CRS label, defaulting truthfully when source metadata is missing
- analysis result metadata where applicable
- temporal metadata for playback layers
- QA status and caveats

Layer operations should be previewable and reversible where practical. Remove, visibility, opacity, symbology, and workflow actions should be visible in the layer panel or review timeline.

## Action Flow

The main action families are:

- import actions through `MapDataImportHubDialog`, `MapDataImporter`, CSV mapping, and columnar preview dialogs
- export actions through `MapDataExportDialog`, `MapExportDialog`, and map composition services
- analysis actions through `MapWorkflowService`, `MapEngineAdapter`, spatial-statistics renderers, and workflow drawers
- report actions through `MapReportHandoffService` and `MapReportHandoffDrawer`
- review actions through `MapReviewTimelinePanel`

Command surfaces are generated by `MapToolbar`. Toolbar buttons can move between priority rail, overflow groups, and command palette, but required commands must remain reachable by accessible names.

## Scientific QA

QA checks should be attached to layers and propagated to actions. The QA surface covers:

- CRS labeling and unknown projection metadata
- geometry validity and skipped import rows
- scale and thematic classification suitability
- temporal metadata completeness
- provenance/source lineage
- queryability and worker-backed execution readiness

Disabled states must name the missing prerequisite. Do not use production `coming soon` or placeholder workflow text.

## Import and Worker Handling

Local imports use a hidden file input owned by `MapExplorerModal`. The visible import hub calls the file input before closing the hub, preserving reliable browser file chooser behavior. Columnar imports preview schema and memory footprint before commit, and successful Arrow/GeoParquet imports prime the analytics worker when possible.

Large files remain browser-memory bounded. Import progress, estimated memory, and skipped-row diagnostics must remain visible.

## External Services and VoxCity

External map services are environment-dependent. WMS/WFS/XYZ/OSM/CityJSON paths must show provider, credential, CORS, and provenance caveats clearly.

VoxCity bridges should prefer real project geometry:

1. Map Explorer polygon/building layers.
2. Imported CityJSON-derived geometry.
3. OSM building footprints fetched for AOI/current extent.
4. Explicit demo/sample geometry only when selected or when no real source is available.

Sample mode must be labeled; it must not masquerade as real project geometry.

## Close-out Additions

Prompt 54-62 features extend the same state/action boundary:

- Undo/redo state is bounded and transient in `MapActionHistoryService`; non-reversible side effects remain review-only.
- Plugin contributions register typed source, renderer, processing-tool, and Urban bridge descriptors, but apply still flows through command preflight and QA gates.
- Observability stores redacted bounded diagnostics, not raw payloads or credentials.
- Offline packages serialize snapshots, source handles, styles, manifests, evidence references, and small inline source sidecars only when bounded.
- AI proposals are allowlisted, redacted, human-confirmed, and audited as `AI-proposed`.
- Collaboration sync carries annotations, comments, target IDs, evidence IDs, and presence only. Raw geometry and source bytes are not synced.
- Raster, temporal, and 3D evidence visual state is transient UI state backed by source handles and evidence references, not persisted heavy scene or raster buffers.

## Report and Audit Trail

Report handoff packages:

- title and narrative summary
- viewport and snapshot metadata
- visible layers and selected layer context
- CRS label
- QA caveats and provenance
- report insertion action

Review timeline entries should make state changes auditable, especially imports, analysis publications, QA changes, exports, and report inserts.

## Validation Responsibilities

When changing Map Explorer behavior, run the relevant subset:

- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run lint:errors`
- `npm run test:e2e:smoke`
- targeted Playwright for the touched surface, usually one or more of:
  - `e2e/map-modal-layout.spec.ts`
  - `e2e/map-context-and-geojson.spec.ts`
  - `e2e/map-csv-kml-gpx-import.spec.ts`
  - `e2e/map-columnar-io.spec.ts`
  - `e2e/map-choropleth.spec.ts`
  - `e2e/map-point-symbology.spec.ts`
  - `e2e/map-spatial-stats-renderers.spec.ts`
  - `e2e/map-temporal-player.spec.ts`
  - `e2e/voxcity-real-data.spec.ts`
  - `e2e/map-report-handoff.spec.ts`
