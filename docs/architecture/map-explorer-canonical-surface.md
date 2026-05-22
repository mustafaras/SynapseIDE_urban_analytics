# ADR — Map Explorer Canonical Component Surface

- **Status:** Accepted
- **Date:** 2026-05-22
- **Context pack:** Map Explorer Production GIS (`MAP_EXPLORER_PRODUCTION_GIS_PLAN_2026-05-22/`), Prompt 1
- **Supersedes:** nothing (first canonical-surface decision)
- **Related:** [`map-explorer-state-and-actions.md`](map-explorer-state-and-actions.md), [`adr-0001-browser-first-analytical-runtime.md`](adr-0001-browser-first-analytical-runtime.md)

## Context

Two map component families coexist in the repository, and both contain
map / layer / drawing / filter / export code:

1. **`src/centerpanel/components/map/`** — the production Map Explorer surface.
   MapLibre-based, wired to `useMapExplorerStore`, the Urban Analytics bridge,
   scientific QA, evidence, review, and report handoff. This is what users open
   from the workbench (`MapExplorerModal.tsx`, ~5,617 lines).
2. **`src/components/map/`** — a second family built around deck.gl overlay
   layers and a Google Maps provider, with its own `LayerManager`, hooks
   (`useLayerStack`, `useMapState`, `useMapExport`), drawing tools, scale bar,
   legend, spatial filter, and a `utils/projections.ts` helper.

Before the production GIS work (Prompts 2–64) starts refactoring, decomposing
the modal, adding the source registry, CRS preflight, processing toolbox, and 3D
scenes, the team needs **one committed, explicit decision** about which family is
canonical and what from the other family is reused vs. deprecated. Without it,
later prompts risk extending the wrong family or duplicating logic that already
exists.

This ADR records that decision and freezes a trusted baseline. It introduces
**no runtime change** — it is documentation plus smoke coverage only.

## Decision

1. **`src/centerpanel/components/map/` is the canonical Map Explorer surface.**
   All new Map Explorer features (Prompts 2–64) build here and in
   `src/services/map/`, `src/stores/` (slices), and the shared contracts
   (`src/services/map/contracts/gisContracts.ts`).
2. **`src/components/map/` is a non-canonical reuse library.** It is **not**
   extended for the production workbench. Specific, well-isolated modules are
   designated **reuse candidates** — their *logic* may be migrated into services
   or canonical components by later prompts, but the canonical UI does not import
   the deck.gl/Google React tree wholesale.
3. **The deck.gl overlay layers stay available for the 3D track.** Prompts 30–34
   (3D scene runtime, 2.5D extrusion, block/parcel model, massing,
   sunlight/shadow) may legitimately reuse the deck.gl layers
   (`BuildingLayer`, `VoxelLayer`, and friends) rather than re-implementing GPU
   extrusion. They are kept, not deleted.
4. **No code is moved, renamed, or modified in this ADR.** Migration happens in
   the prompts that own each concern (e.g. the source registry in Prompt 4, the
   query planner in Prompt 15, 3D in Prompts 30–34). This document only sets the
   direction and the target list.

### Disposition legend

| Disposition | Meaning |
| --- | --- |
| **keep** | Canonical; actively extended by later prompts. |
| **migrate-logic** | Non-canonical file whose *logic* should be lifted into a service / canonical component by a named later prompt. The original is not extended in place. |
| **deprecate** | Non-canonical; superseded by the canonical surface. Retire once its reuse candidates (if any) are migrated. No new dependencies. |
| **reuse-3d** | Kept specifically as a reuse candidate for the 3D track (Prompts 30–34). |

## Inventory — `src/centerpanel/components/map/` (CANONICAL — keep)

### Orchestrator, canvas, and shell

| File | Role | Disposition |
| --- | --- | --- |
| `../MapExplorerModal.tsx` | Top-level orchestrator (~5,617 lines): lifecycle, layer runtime, command handling, Urban bridge, panel layout, report/workflow control. | keep → **decompose in Prompt 2** |
| `MapCanvas.tsx` | MapLibre lifecycle, markers, popup inspection, click handling, viewport updates, external-service render errors. | keep |
| `MapCanvasKeyboardFallbackControls.tsx` | Keyboard-accessible pan/zoom fallback for the canvas. | keep |
| `MapWorkspaceShell.tsx` | Modal/embedded layout primitives: focus handling, rails, canvas region, bottom timeline. | keep |
| `MapWorkspaceCockpit.tsx` | Summarizes visible stack, AOI, selection, QA, workflow, export readiness, recommendations, next actions. | keep |

### Panels and command surfaces

| File | Role | Disposition |
| --- | --- | --- |
| `MapToolbar.tsx` | Broad command surface with toolbar density + overflow. | keep |
| `MapLayerManager.tsx` | Layer stack + layer operations UI (source/QA/CRS badges, delete confirm, demo packs). | keep |
| `MapLayerPanel.tsx` | Layer panel container/dock. | keep |
| `MapStatusBar.tsx` | Status bar (cursor, zoom, CRS, scale). | keep |
| `MapSearchBar.tsx` | Geocode / place search entry. | keep |
| `MapPinSidebar.tsx` | Pins / bookmarks sidebar. | keep |
| `ScientificQAPanel.tsx` | Scientific QA surface. | keep |
| `MapNLQueryPanel.tsx` | Natural-language query panel. | keep |
| `MapWorkflowDrawer.tsx` | Workflow (buffer/intersect/…) preview/apply drawer. | keep |
| `MapReportHandoffDrawer.tsx` | Report handoff drawer. | keep |
| `MapReviewTimelinePanel.tsx` | Review session timeline + audit. | keep |
| `CartographyRecommendationList.tsx` | Cartography advisor recommendations. | keep |
| `MapIcons.tsx` | Shared inline SVG icon set. | keep |

### Layer / metadata / style logic

| File | Role | Disposition |
| --- | --- | --- |
| `mapTypes.ts` | Canonical type spine: `OverlayLayerConfig`, `LayerMetadata`, `LayerRegistryMetadata`, `LayerCrsSummary`, `MapEvidenceArtifact`, `MeasurementAssumptions`, … | keep → **extend, do not reinvent** |
| `mapLayerMetadata.ts` | Metadata resolvers (`normalizeLayerRegistryMetadata`, `resolveOverlayLayerCrsSummary`, …). | keep → all new source/CRS logic flows through here |
| `mapContextSummary.ts` | Map→Urban context summary builder (IDs + summaries, no heavy geometry). | keep → used by the bridge (Prompt 16) |
| `mapEvidenceArtifacts.ts` | Immutable evidence-artifact constructors. | keep |
| `symbologyUtils.ts` | Symbology helpers (geometry detection, numeric fields, FC resolution). | keep |
| `heatmapStyleUtils.ts` / `symbolStyleUtils.ts` | Heatmap / symbol styling helpers. | keep → reused by the style editor (Prompt 12) |
| `spatialStatsVizUtils.ts` | Spatial-stats visualization helpers. | keep |
| `mapDocking.ts` | Dock layout math (panel widths, active right dock). | keep |
| `mapExperience.ts` | Workspace view + quick-action vocabulary. | keep |
| `contextMenuUtils.ts` | Context-menu action assembly. | keep |
| `demoDataPacks.ts` | Deterministic demo layer packs (labelled synthetic). | keep |
| `index.ts` | Barrel exports for the canonical surface. | keep |

### Hooks

| File | Role | Disposition |
| --- | --- | --- |
| `useLayerSync.ts` | Reconciles `OverlayLayerConfig[]` → MapLibre sources/layers. | keep |
| `useMapAoiDispatch.ts` | AOI dispatch wiring. | keep → extended by AOI editing (Prompt 14) |
| `useMapKeyboardControls.ts` | Keyboard control map. | keep |
| `useMapPanelCommands.ts` | Panel command routing. | keep → feeds command lifecycle (Prompt 9) |
| `useFocusTrap.ts` | Modal focus trap. | keep |
| `useDraggableMapPanel.ts` | Draggable floating panels. | keep |
| `useAnnouncer.tsx` | ARIA live-region announcer. | keep |

### Design tokens, tests, fixtures

| File | Role | Disposition |
| --- | --- | --- |
| `mapTokens.ts` | `MAP_COLORS`, `MAP_RADIUS/SPACING/TYPOGRAPHY/…`, `mapStyles`, `resolveMapPaintColor()`. | keep → **the only sanctioned styling source** for `src/centerpanel/` |
| `__tests__/*.test.ts(x)` | Existing map unit/component tests. | keep |
| `__tests__/fixtures/gisFixtures.ts` | Shared GIS fixtures (Prompt 0). | keep → **import, never re-invent** |
| `contracts/` (`src/services/map/contracts/gisContracts.ts`) | Shared canonical type contracts (Prompt 0). | keep → import by name |

## Inventory — `src/components/map/` (NON-CANONICAL)

### Reuse candidates (explicitly called out by the plan)

| File | Role | Disposition |
| --- | --- | --- |
| `layers/BuildingLayer.tsx` | deck.gl 2.5D building extrusion layer. | **reuse-3d** (Prompts 30, 32a/b) |
| `layers/VoxelLayer.tsx` | deck.gl voxel/volumetric layer. | **reuse-3d** (Prompts 30, 33) |
| `ScaleBar.tsx` | Cartographic scale bar. | **migrate-logic** → publication figure composer (Prompt 22) |
| `MapLegend.tsx` | Legend renderer. | **migrate-logic** → legend contract (Prompt 12) + composer (Prompt 22) |
| `utils/projections.ts` | Projection helper utilities. | **migrate-logic** → `MapProjectionService` (Prompt 6); do not extend in place |
| `DrawingTools.tsx` | Drawing interaction patterns. | **migrate-logic** → AOI/vertex editing reuse (Prompt 14) |
| `SpatialFilter.tsx` | Spatial filter UI. | **migrate-logic** → query planner reuse (Prompt 15) |

### Other deck.gl layers (kept for the 3D / advanced-cartography tracks)

| File | Role | Disposition |
| --- | --- | --- |
| `layers/ChoroplethLayer.tsx` | deck.gl choropleth. | reuse-3d / advanced cartography (Prompts 30–34, 48) |
| `layers/HeatmapLayer.tsx` | deck.gl heatmap. | reuse candidate (Prompt 48); canonical heatmap stays MapLibre |
| `layers/FlowMapLayer.tsx` | deck.gl flow/OD layer. | reuse candidate |
| `layers/IsochroneLayer.tsx` | deck.gl isochrone layer. | reuse candidate |
| `layers/NetworkLayer.tsx` | deck.gl network layer. | reuse candidate |
| `layers/PointClusterLayer.tsx` | deck.gl clustered points. | reuse candidate |
| `layers/RasterTileLayer.tsx` | deck.gl raster tiles. | reuse candidate (Prompt 45) |
| `layers/index.ts` | deck.gl layer barrel. | follows its layers |

### Google Maps subtree and shell (deprecate for the canonical surface)

| File / folder | Role | Disposition |
| --- | --- | --- |
| `google/**` (all 8 files: `GoogleMapsProvider.tsx`, `GoogleMapView.tsx`, `GooglePlacesSearch.tsx`, `GoogleDirections.tsx`, `StreetViewPanel.tsx`, `hooks/useGoogleMapsAPI.ts`, `utils/apiKeyManager.ts`, `utils/googleToGeoJSON.ts`, plus the `google/`, `google/hooks/`, `google/layers/`, `google/utils/` barrels) | Google Maps integration family. | deprecate (canonical surface is MapLibre; no new deps) |
| `MapContainer.tsx` | Alternate map container. | deprecate (superseded by `MapCanvas` + `MapWorkspaceShell`) |
| `MapControls.tsx` | Alternate map controls. | deprecate (superseded by `MapToolbar`) |
| `LayerManager.tsx` | Alternate layer manager. | deprecate (superseded by `MapLayerManager`) |
| `hooks/useLayerStack.ts` | Alternate layer stack hook. | deprecate (superseded by store + `useLayerSync`) |
| `hooks/useMapState.ts` | Alternate map state hook. | deprecate (superseded by `useMapExplorerStore`) |
| `hooks/useMapExport.ts` | Alternate export hook. | migrate-logic → `MapExportService` / composer (Prompts 20, 22) |
| `hooks/useGeoJSONLoader.ts` | Alternate GeoJSON loader. | migrate-logic → `MapDataImporter` profiling (Prompt 5) |
| `hooks/index.ts` | Hook barrel. | follows its hooks |
| `CoordinateDisplay.tsx` | Cursor coordinate readout. | deprecate (superseded by `MapStatusBar`) |
| `GeocoderSearch.tsx` | Alternate geocoder. | deprecate (superseded by `MapSearchBar`) |
| `MinimapInset.tsx` | Minimap inset. | reuse candidate (optional; no current canonical consumer) |
| `SwipeComparison.tsx` | Swipe/compare control. | reuse candidate (temporal/compare, Prompt 46) |
| `TemporalSlider.tsx` | Temporal slider. | migrate-logic → temporal playback (Prompt 46) |
| `utils/colorScales.ts` | Color scale helpers. | migrate-logic → cartography (Prompts 12, 48) |
| `utils/index.ts` | Utils barrel. | follows its utils |
| `index.ts` | Family barrel. | deprecate (do not import from canonical surface) |

> **Rule for later prompts:** when a `migrate-logic` item is needed, lift the
> pure logic into the named service/contract and cover it with a test there.
> Do not import the non-canonical React component tree into
> `src/centerpanel/components/map/`. `reuse-3d` items may be imported by the
> `scene3d/` work (Prompts 30–34) since that is GPU/deck.gl territory by design.

## Refactor target list for Prompt 2 (explicit hand-off)

Prompt 2 decomposes `MapExplorerModal.tsx` into controller hooks under
`src/centerpanel/components/map/controllers/`. The baseline this ADR freezes
identifies these concerns to extract (one hook per commit, behavior unchanged):

1. `useMapExplorerLifecycle` — open/close, focus-trap handoff, viewport persistence.
2. `useMapLayerRuntime` — add/remove/reorder/opacity/visibility against the store.
3. `useMapCommandHandlers` — toolbar/command wiring.
4. `useMapUrbanBridgeController` — listen/emit Urban events.
5. `useMapPanelLayout` — dock widths, panel open state (`mapDocking.ts`).
6. `useMapReportController` — report handoff triggers.
7. `useMapWorkflowController` — workflow drawer state.

Constraints carried into Prompt 2: preserve every prop, event name, and
`data-testid`; keep service logic in `src/services/map/`; no React Context
(Zustand only); target `MapExplorerModal.tsx` < 1,200 lines.

## Consequences

- **Positive:** one unambiguous place to build; no accidental extension of the
  deck.gl/Google family; 3D work has a sanctioned reuse path; the baseline is
  smoke-covered so regressions in mount or layer add/remove are caught early.
- **Cost:** the non-canonical family lingers until its `migrate-logic` items are
  lifted by later prompts; this is intentional (no big-bang move).
- **Guardrail:** reviewers should reject new imports from
  `src/components/map/` into `src/centerpanel/components/map/` except the
  `reuse-3d` items inside `scene3d/` work.

## Proof / verification

- Smoke coverage (added with this ADR, only where missing):
  `src/centerpanel/components/map/__tests__/map-explorer-canonical-baseline.test.tsx`
  mounts and unmounts `MapExplorerModal` cleanly and asserts a layer can be
  added to and removed from `useMapExplorerStore`.
- Pre-existing coverage relied on (not duplicated):
  - Store layer add→remove unit coverage: `__tests__/map-layer-management.test.ts`.
  - Urban handoff entry point fires: `src/features/urbanAnalytics/__tests__/studyAreaSelection.test.ts`
    (`openMapExplorerWithStudyAreaPreview` opens the modal and queues a typed
    fit-bounds request; `applyUrbanStudyAreaSelection` binds context/AOI/evidence).
- Validate: `npm run typecheck`, `npm run lint:errors`,
  `npx vitest run src/centerpanel/components/map`.
