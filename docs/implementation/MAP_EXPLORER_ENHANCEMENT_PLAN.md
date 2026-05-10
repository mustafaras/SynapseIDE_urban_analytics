# Prompt 01 — Product Charter & Design Foundation

**Document**: MAP_EXPLORER_ENHANCEMENT_PLAN.md
**Status**: PROPOSED - PROFESSIONAL MAP EXPLORER SEQUENCE
**Date**: 2026-04-24
**Scope**: Transform the current standalone Map Explorer modal into a premium, scientifically grounded Map Explorer / Map Modal inside the SynapseCore Urban Analytics Workbench.
**Layer**: Foundation / Product Architecture / Premium UX
**Dependencies**: —
**Execution Position**: This is the first prompt in the implementation sequence. All following prompts inherit its product rules, integration contracts, validation gates, and truthfulness requirements.

---

### Objective
Define the product charter, integration architecture, scientific truthfulness doctrine, and first foundation implementation milestone for the Map Explorer.

### Prompt
Use this prompt as the mandatory foundation for the entire Map Explorer sequence. It must be completed before any downstream GIS, data, engine, VoxCity, reporting, or release-hardening prompt is executed.

This prompt has two responsibilities:
- Establish the professional product contract for a premium, world-class scientific Map Explorer that works as both embedded workspace and Map Modal.
- Begin implementation by decomposing the current monolithic map modal, migrating it to design tokens, and creating the first premium UI shell.

### Product North Star

The Map Explorer must become the spatial operating surface of SynapseCore: a dense, elegant, scientifically credible environment where the analyst can inspect layers, run spatial workflows, compare scenarios, and prepare next actions without losing map context.

The final product must support two equivalent entry modes:
- **Integrated Map Explorer workspace**: Embedded within the Urban Analytics Workbench, synchronized with the active flow, right panel, layer registry, and report builder.
- **Premium Map Modal**: A full-screen or large modal surface for focused spatial work, still synchronized with project context, selected layers, visible extent, and analysis outputs.

The map must never feel like a detached viewer. It must behave as a live scientific instrument connected to project data, urban analytics engines, simulation outputs, and 3D VoxCity workflows.

### Map Workspace Doctrine

The Map Explorer must keep its own state legible, reversible, and attributable. Any map operation that changes layers, viewport, styling, analysis, filters, or export state must be explicit, previewable where practical, and easy to undo.

Non-negotiable workspace rules:
- The map stores structured state for viewport, active layers, selected features, AOI, temporal frame, simulation result, and analysis result changes.
- Destructive or high-impact map operations must remain explicit and reversible.
- Layer details must cite layer IDs, dataset names, CRS, feature counts, temporal coverage, analysis parameters, and provenance where available.
- Demo/sample mode must be explicit and must not be described as project data.

### Scientific And Premium UX Standards

The Map Explorer is a professional analytical tool, not a marketing surface. It must be visually refined but operationally dense.

Scientific expectations:
- Always preserve CRS, projection, data lineage, timestamp, source, geometry validity, spatial resolution, scale, and uncertainty metadata where available.
- Surface methodological caveats for MAUP, edge effects, missing data, temporal mismatch, model confidence, classification uncertainty, and sample/demo data.
- Keep analytical outputs reproducible: every derived layer stores input parameters, engine version, timestamp, visible AOI, and source layer references.
- Support academic map composition: accurate legends, scale bars, north arrows, attribution, confidence notes, and exportable layer packages.

Premium UX expectations:
- Use compact, high-density panels with clear hierarchy; avoid decorative filler, oversized hero content, card-in-card layouts, and vague empty states.
- Every toolbar control must have an icon, tooltip, keyboard path, disabled-state reason, and visible feedback on execution.
- Map, layers, properties, methods, and report handoff must work as coordinated panes rather than disconnected dialogs.
- Mobile and constrained layouts must degrade to a focused Map Modal with drawer-based layer panels, not clipped or unusable content.

### Professional Integration Spine

Every prompt must advance at least one part of the shared integration spine below. This prevents isolated feature work and keeps the Map Explorer, project data, analytical engines, and report outputs aligned.

| Integration Track | Responsibility | Required Artifact |
|-------------------|----------------|-------------------|
| Workspace shell | Defines embedded workspace, modal focus mode, panel rails, and responsive layout | `MapWorkspaceShell`, layout tokens, Playwright viewport checks |
| Map runtime | Owns MapLibre lifecycle, viewport, sources, layers, interactions, and render performance | `MapCanvas`, layer registry, source registry, render diagnostics |
| Project data bridge | Connects imported layers, project overlays, spatial DB tables, and explicit demo/sample sources | typed data-source metadata, persistence contract, source truth labels |
| Engine bridge | Converts spatial statistics, GeoAI, simulation, VoxCity, and query outputs into map layers | pure adapter functions, provenance payloads, result-layer registry |
| Scientific QA | Validates CRS, geometry, scale, lineage, temporal consistency, uncertainty, and sample/demo usage | QA issue model, QA badges, QA panel, caveat payload |
| Report handoff | Converts map findings into reproducible report-ready assets with citations and caveats | screenshot bundle, legend/source/caveat payload |
| Publication export | Produces map outputs suitable for academic papers and professional reports | export service, composition layout, scale/legend/north-arrow verification |

Prompt execution must preserve these contracts:
- Any new visual layer must register with the layer registry and source registry.
- Any new analysis or simulation output must be reproducible from stored parameters and input source references.
- Any new UI panel must work in embedded workspace and modal focus mode.
- Any disabled, empty, loading, or error state must be truthful, specific, and action-oriented.

### End-To-End User Journey Target

The final workflow must support this professional analyst journey without context loss:
1. Analyst opens Map Explorer from the Urban Analytics Workbench or as a focused Map Modal.
2. Project layers, imported layers, or explicit demo layers appear with clear source labels.
3. Analyst searches, draws AOI, imports data, or selects visible features.
4. Analyst runs or opens relevant spatial workflows from explicit map controls.
5. Analyst previews high-impact changes, applies them, and can undo them.
6. Engine outputs render as map layers with provenance and QA caveats.
7. Analyst inspects layer and feature metadata from the layer stack and popovers.
8. Analyst compares scenarios, temporal frames, GeoAI outputs, VoxCity overlays, or statistical results.
9. Analyst sends a map finding to the report builder with screenshot, legend, source, method, and caveats.
10. The session timeline remains auditable and reproducible.

### First Implementation Workstream - Design Token Migration & Component Decomposition

Refactor `src/centerpanel/components/MapExplorerModal.tsx` into a modular, premium shell using `DESIGN_TOKENS` from `src/constants/design.ts`.

Required work:
- Replace every hardcoded color (`#0d0d0d`, `#F59E0B`, `rgba(245,158,11,...)`, `#FAFAF9`, `#D6D3D1`, `#A8A29E`), border radius (`8`), transition, and shadow with the corresponding `DESIGN_TOKENS` reference.
- Extract the following sub-components from the monolith:

```text
MapExplorerModal.tsx          -> Shell (portal, overlay, layout grid, modal/workspace mode)
├── MapCanvas.tsx             -> MapLibre GL instance lifecycle and event wiring
├── MapToolbar.tsx            -> Tool selection bar and map action entry point
├── MapLayerPanel.tsx         -> Base layer switcher and future overlay controls
├── MapSearchBar.tsx          -> Nominatim geocoding with results dropdown
├── MapStatusBar.tsx          -> Coordinates, zoom, scale, CRS, status
└── MapPinSidebar.tsx         -> Pin list, remove, clear actions
```

- Each sub-component receives props or store subscriptions; no prop drilling deeper than one level.
- `MapCanvas` must encapsulate the full MapLibre GL lifecycle: init, style load, event binding, resize handling, cleanup on unmount.
- The shell must support both embedded workspace and modal focus mode from the start, even if some later panels remain empty until their prompts execute.
- The shell must reserve structural regions for layer controls, QA, command palette, and report handoff so later prompts integrate cleanly instead of adding disconnected overlays.
- All sub-components must use `DESIGN_TOKENS` exclusively for styling.
- Add unit tests verifying that each sub-component renders without errors.

Professional integration requirements:
- The initial shell must expose stable extension points: `mapCanvasRef`, `layerPanelSlot`, `bottomTimelineSlot`, and `commandPaletteSlot`.
- Toolbar and panel layout must not assume fixed pixel heights that could clip VoxCity, sunlight, or temporal playback.
- Empty slots must render truthful disabled/empty states naming the missing prerequisite, never placeholder phrases.

### Prompt 01 Acceptance Criteria
- The file-level Map Explorer plan starts with this prompt and every downstream milestone follows sequentially as Prompt 02, Prompt 03, and onward.
- Product charter, scientific truthfulness rules, and validation gates are explicit.
- Zero hardcoded color, spacing, border-radius, or typography values remain in the first decomposed map components.
- The map modal functions identically to before while gaining a professional shell ready for QA, report, and modal/workspace integration.
- Components are individually importable and testable.

### Execution Rules
- Execute prompts strictly in sequence. Each prompt depends on the outputs of preceding prompts.
- Treat each prompt as a bounded milestone: inspect the current codebase state, implement the feature, add or update tests, validate the result, report completion, and identify dependency risks for the next prompt.
- Do not skip validation after any prompt that modifies map state, rendering behavior, or data contracts.
- Follow the **foundation-first, integration-second, intelligence-last** discipline standard in GIS platform architecture.

### Design System Compliance
- All map components must use `DESIGN_TOKENS` from `src/constants/design.ts` — never hardcoded values.
- Follow the Charcoal-Amber design system: `#0d0d0d` base, `#F59E0B` amber primary, glassmorphism panels.
- Typography: Inter for body, Poppins for headings, JetBrains Mono for coordinates and data.
- Apply `DESIGN_TOKENS.glassmorphism.dark` to all panels, sidebars, and overlays.

### Engineering Standards
- New modules must be strongly typed, modular, testable, and discoverable through clean export contracts.
- CPU-intensive tasks (spatial queries, geometry validation) should be routed to workers where justified.
- Modules must fail safely under missing data, malformed geometry, and partial computation.
- Any new map state contract must be serializable, versioned, and covered by unit tests.
- Every analytical output layer must expose enough metadata for inspection: source layer, method, parameters, timestamp, CRS, feature count, and caveats.

### UI Enforcement Rule
- Every capability must have a visible, functional UI surface within the Map Explorer modal.
- No headless or engine-only deliverables. Every prompt must ship its own complete UI.
- Loading states, error feedback, empty-state messaging, and tooltips are mandatory for all interactive surfaces.
- Every high-impact map action must have visible preview, apply, cancel, and undo affordances when the action changes map state.
- No production map surface may use placeholder language such as "coming soon", "not yet available", or vague unavailable filler. Disabled states must explain the missing prerequisite.

### Map State Rules
- Map Explorer is the source of truth for spatial viewport, selected features, active AOI, visible layers, temporal frame, and active map result layers.
- Shared state must flow through typed store slices, not through ad hoc component imports.
- Map operations must be deterministic data structures that can be inspected in tests.
- High-impact map actions must write an audit trail entry: timestamp, payload summary, affected layer IDs, and undo availability.
- Layer inspection must degrade truthfully when data is missing: state exactly which layer, source, CRS, confidence, or statistic is unavailable.

### Scientific Truthfulness Rules
- The map must clearly distinguish project data, imported external data, engine-derived layers, and explicit demo/sample layers.
- Any derived visualization must preserve lineage back to input layers and analysis parameters.
- Any classified, predicted, simulated, or interpolated surface must expose uncertainty or confidence if available, and a clear caveat if it is not available.
- No map legend, tooltip, report handoff, or export may imply greater precision than the data supports.

### Global Validation Gate
Run after every prompt:
1. `npx tsc --noEmit` — Zero type errors
2. `npx vitest run` — All existing tests pass + new tests for the prompt
3. ESLint — Zero errors
4. Visual verification — UI is reachable, functional, and styled correctly
5. Workflow verification — map state updates, preview/apply behavior, and undo/audit behavior covered where applicable

### Mandatory Completion Report Format
```md
### Prompt XX — Completion Report
- Scope Completed:
- Key Files Added or Updated:
- UI Entry Points Added:
- Navigation Path (how user reaches the feature):
- Validation Performed:
- Known Limitations:
- Follow-Up Recommended:
```

---

### Current State Assessment

### What Exists Today

| Capability | Implementation | Quality |
|------------|---------------|---------|
| Base layer switching | 4 CartoDB vector tile styles (Streets, Dark Matter, Satellite, Terrain) | Functional |
| Geocoding search | Nominatim API with dropdown (max 5 results) | Functional |
| Pin placement | Click-to-add in Pin Mode with sidebar list | Basic |
| Map controls | Zoom, pan, rotate (MapLibre GL native) | Functional |
| Status bar | Cursor coordinates (6 decimal precision) + zoom level | Functional |
| Portal rendering | `createPortal` to `document.body` at z-index `2147483647` | Functional |
| Keyboard shortcut | Ctrl+Shift+M toggle from UrbanAnalyticsModal | Functional |

### Critical Gaps

| Gap | Severity |
|-----|----------|
| All styles hardcoded — ignores `DESIGN_TOKENS` | High |
| Zustand store tracks only open/close — no map state | High |
| Pins lost on modal close (no persistence) | High |
| No GeoJSON import/export | Critical |
| No overlay layer management | Critical |
| No drawing/sketching tools | High |
| No measurement tools | High |
| No thematic map visualization | Critical |
| No integration with spatial-stats, GeoAI, or simulation engines | Critical |
| No connection to spatial-db for persistence | Critical |
| No VoxCity 2D↔3D bridge | Medium |
| No WMS/WFS/STAC external service support | Medium |
| Monolithic ~450-line single-file component | High |
| No scientific QA surface for CRS, geometry validity, lineage, or uncertainty | High |
| No premium responsive Map Modal layout for dense map + layer workflows | High |

---

### Dependency Graph

```
Prompt 01 ── Prompt 02 ── Prompt 03 ──┐
                                       ├── Prompt 04 ── Prompt 05 ── Prompt 06
Prompt 07 ── Prompt 08 ──────────────┘
                                       ┌── Prompt 09 ── Prompt 10
Prompt 11 ── Prompt 12 ── Prompt 13 ──┤
                                       └── Prompt 14 ── Prompt 15
Prompt 16 ── Prompt 17 ── Prompt 18
Prompt 19 ── Prompt 20 ── Prompt 21
Prompt 22 ── Prompt 23 ── Prompt 24
                                       ┌── Prompt 25 ── Prompt 26 ── Prompt 27
Prompt 18 ── Prompt 24 ───────────────┤
Prompt 16 ── Prompt 17 ───────────────┤
                                       └── Prompt 28 ── Prompt 29 ── Prompt 30
Prompt 25 ── Prompt 31 ── Prompt 32 ── Prompt 33
Prompt 34 ── Prompt 35 ── Prompt 36
```

---

# Prompt 02 — Store Architecture & State Persistence

### Objective
Expand the Zustand store from visibility-only to full map state management with localStorage persistence so that viewport, pins, and preferences survive modal close/reopen cycles.

### Prompt
Refactor `src/stores/useMapExplorerStore.ts` into a comprehensive map state store.

Required state shape:
```typescript
interface MapExplorerState {
  // Visibility
  isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;

  // Viewport (persisted)
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  setViewport(v: Partial<ViewportState>): void;

  // Base layer (persisted)
  activeBaseLayer: BaseLayerId;
  setBaseLayer(id: BaseLayerId): void;

  // Pins (persisted)
  pins: MapPin[];
  addPin(pin: Omit<MapPin, 'id'>): void;
  removePin(id: string): void;
  clearPins(): void;
  updatePin(id: string, update: Partial<MapPin>): void;

  // Active tool
  activeTool: 'select' | 'pin' | 'draw' | 'measure' | null;
  setActiveTool(tool: string | null): void;

  // Overlay layers (persisted as metadata only, not full GeoJSON)
  overlayLayers: OverlayLayerConfig[];
  addOverlayLayer(layer: OverlayLayerConfig): void;
  removeOverlayLayer(id: string): void;
  toggleLayerVisibility(id: string): void;
  reorderLayers(fromIndex: number, toIndex: number): void;

  // Lightweight selection and analysis metadata
  lastContextSnapshotId?: string;
  selectedFeatureIds: Record<string, string[]>;
  activeAoiId?: string;
  activeAnalysisResultLayerIds: string[];
  setSelectedFeatures(layerId: string, featureIds: string[]): void;
  setActiveAoi(id: string | undefined): void;
  setActiveAnalysisResultLayers(ids: string[]): void;
}
```

Implementation requirements:
- Use Zustand `persist` middleware with `localStorage` backend.
- Persist: `center`, `zoom`, `bearing`, `pitch`, `activeBaseLayer`, `pins`.
- Persist only lightweight metadata where it is useful for restore, such as selected layer IDs and active result layer IDs. Do not persist large feature payloads or generated text.
- Do NOT persist: `isOpen`, `activeTool`, full GeoJSON layer data, full feature collections, or transient analysis progress.
- Debounce viewport writes (250ms) to avoid excessive storage writes during pan/zoom.
- Wire all map sub-components (from Prompt 01) to consume from this store instead of local state.
- Type all store slices with strict TypeScript interfaces.
- Separate persisted state and transient runtime state into store slices so later prompts can extend them without rewriting the store.
- Store actions must emit lightweight change events that later workflows can consume without inspecting MapLibre internals.
- Add unit tests for every store action: add/remove/update/clear pins, viewport set, layer toggle, persistence round-trip.

### Acceptance Criteria
- Closing and reopening the map modal restores the exact viewport position, zoom, base layer, and all pins.
- Pin add/remove/update actions are reflected immediately in the MapPinSidebar.
- Store persistence survives page refresh (verified via test or manual check).
- Zero local `useState` for map state that should be global — all map state lives in the store.
- Store state is shaped for future map workflows without storing large or unsafe payloads.
- Viewport, layer, selection, AOI, and result-layer changes expose enough metadata for downstream context snapshots.

---

# Prompt 03 — Accessibility, Keyboard Navigation & Focus Management

### Objective
Ensure the Map Explorer meets WCAG 2.1 AA standards for keyboard navigation, focus management, and screen reader compatibility.

### Prompt
Add accessibility infrastructure to all map sub-components created in Prompt 01.

Required capabilities:
- **Focus trap**: Tab cycling within the modal (toolbar → search → sidebar → close button → back to toolbar).
- **Keyboard map controls**: Arrow keys for pan, +/− for zoom, R for reset view.
- **ARIA labels**: Every button, input, toggle, and interactive element has `aria-label` with clear description and shortcut hint.
- **Screen reader announcements**: `aria-live` region for dynamic status changes (layer switched, pin added, search results count, zoom level changed).
- **Skip navigation**: A visually hidden "Skip to map canvas" link at the top of the modal for screen reader users.
- **High contrast**: Ensure all text meets 4.5:1 contrast ratio against its background using design tokens.
- **Reduced motion**: Respect `prefers-reduced-motion` media query — disable flyTo animations and transitions.

Implementation requirements:
- Use the existing `usePrefersReducedMotion` hook from `src/hooks/`.
- Focus trap must handle dynamic content (sidebar show/hide, search dropdown appearance).
- Escape key must close the modal (already exists, verify it works with focus trap).
- No `tabindex="-1"` on elements that should be focusable.

### Acceptance Criteria
- Full modal traversal possible using only keyboard (Tab, Shift+Tab, Enter, Escape, Arrow keys).
- Screen reader (NVDA/VoiceOver) announces map state changes via live region.
- `prefers-reduced-motion` disables all CSS transitions and map flyTo animations.
- Zero accessibility violations from axe-core or similar audit tool inspection.

---


# Prompt 04 — Layer Management System

### Objective
Implement a professional layer management panel enabling users to add, toggle, reorder, style, and remove overlay data layers on the map.

### Prompt
Create `src/centerpanel/components/MapLayerPanel.tsx` and supporting types.

Required capabilities:
- **Layer types supported**: GeoJSON (point, line, polygon), heatmap, raster tile (XYZ URL), vector tile.
- **Layer panel UI**:
  - Collapsible panel on the left side of the map.
  - Each layer row shows: visibility toggle (eye icon), layer name, geometry type icon, opacity slider, remove button.
  - Drag-and-drop layer reordering (changes MapLibre layer z-order).
  - Layer group headers: "Base Layers", "Data Layers", "Analysis Results" (empty initially).
  - "Add Layer" button at panel bottom.
- **Layer metadata popover**: click layer name → show feature count, bounding extent, geometry type, attribute field list.
- **Layer metadata**: every layer row exposes source type, provenance, queryability, CRS, feature count, QA status, and whether the layer is project/imported/external/derived/demo.
- **Layer action slot**: layer rows reserve actions for "Scientific QA" and "Add to report" even if later prompts activate them.
- **Store integration**: All layer operations go through `useMapExplorerStore` actions from Prompt 02.
- **MapLibre wiring**: Adding/removing/toggling a layer in the store must immediately update the MapLibre GL instance via `map.addLayer()`, `map.removeLayer()`, `map.setLayoutProperty()`, `map.setPaintProperty()`.

Implementation requirements:
- Define `OverlayLayerConfig` type in a shared types file:
  ```typescript
  interface OverlayLayerConfig {
    id: string;
    name: string;
    type: 'geojson' | 'heatmap' | 'raster-tile' | 'vector-tile';
    visible: boolean;
    opacity: number;
    sourceData?: GeoJSON.FeatureCollection | string; // GeoJSON object or URL
    style?: Record<string, unknown>; // paint/layout overrides
    metadata?: LayerMetadata;
    provenance?: LayerProvenance;
    qaStatus?: 'unchecked' | 'passed' | 'warning' | 'error';
    queryable?: boolean;
    sourceKind: 'project' | 'imported' | 'external' | 'derived' | 'demo';
  }
  ```
- Opacity slider must update MapLibre paint property in real time (no debounce needed).
- Layer remove must clean up both store state and MapLibre source/layer.
- Layer registry changes must publish lightweight metadata events so downstream workflows can react without inspecting MapLibre internals.

### Acceptance Criteria
- Users can add a GeoJSON layer, see it on the map, toggle visibility, adjust opacity, and remove it.
- Layer reordering visually changes which layers render on top.
- Layer metadata popover shows accurate feature count and extent.
- All layer operations work through the centralized store.
- Every layer added to the panel carries enough metadata for scientific QA and report handoff.

---

# Prompt 05 — Drawing & Sketching Tools

### Objective
Enable users to draw geometric shapes directly on the map for study area definition, AOI selection, and spatial annotation.

### Prompt
Create `src/centerpanel/components/MapDrawingManager.tsx` and `src/utils/drawingHelpers.ts`.

Required drawing tools:

| Tool | Geometry Output | Activation |
|------|----------------|------------|
| Point | `Point` | Single click |
| LineString | `LineString` | Click vertices, double-click to finish |
| Polygon | `Polygon` | Click vertices, double-click to close |
| Rectangle | `Polygon` | Click-drag diagonal corners |
| Circle | `Polygon` (64-segment approximation) | Click center, drag radius |

Required capabilities:
- **Drawing toolbar**: Tool buttons in `MapToolbar` with active state highlighting.
- **Visual feedback**: Ghost line/polygon following cursor during drawing. Vertex dots at each click. Snap indicator when near existing vertex (configurable 10px tolerance).
- **Feature storage**: Each drawn feature stored in Zustand store as:
  ```typescript
  interface DrawnFeature {
    id: string;
    geometry: GeoJSON.Geometry;
    properties: { label: string; createdAt: string; style?: FeatureStyle };
  }
  ```
- **Edit mode**: Click existing feature → show vertex handles. Drag vertex to modify. Delete key removes selected feature.
- **Feature sidebar**: List of drawn features with name, type icon, edit/delete actions.
- **AOI broadcast**: Drawn polygons/rectangles are available to other flows as Area of Interest selections via the store.

Implementation requirements:
- Use MapLibre GL event handlers (`map.on('click')`, `map.on('mousemove')`) — no external draw library dependency.
- Circle approximation must use geodesic arc calculation, not planar — correct at all latitudes.
- All drawn features are valid GeoJSON (rings closed, coordinates in [lng, lat] order).
- Escape key cancels active drawing operation without adding a feature.
- Undo (Ctrl+Z) removes the last placed vertex during active drawing.

### Acceptance Criteria
- All five drawing tools produce valid GeoJSON stored in the store.
- Vertex editing modifies geometry and re-renders on the map in real time.
- Circle at 60°N latitude is visually circular (geodesic, not planar).
- Drawn polygon is accessible as AOI from `useMapExplorerStore`.
- Ctrl+Z undoes the last vertex during drawing. Escape cancels the drawing.

---

# Prompt 06 — Geodesic Measurement Tools

### Objective
Implement scientifically accurate distance, area, perimeter, and bearing measurement tools using geodesic formulas suitable for urban-scale analysis.

### Prompt
Create `src/centerpanel/components/MapMeasurementTool.tsx` and `src/utils/geodesic.ts`.

Required measurement types:

| Measurement | Formula | Units |
|-------------|---------|-------|
| Distance | Haversine: $d = 2R \arcsin\!\left(\sqrt{\sin^2\!\tfrac{\Delta\phi}{2} + \cos\phi_1\cos\phi_2\sin^2\!\tfrac{\Delta\lambda}{2}}\right)$ | m, km, mi, ft |
| Area | Spherical excess via $E = \sum_{i} (\theta_{i+1} - \theta_i)$ | m², km², ha, acres |
| Perimeter | Sum of geodesic edge distances | m, km |
| Bearing | $\theta = \text{atan2}(\sin\Delta\lambda\cos\phi_2,\;\cos\phi_1\sin\phi_2 - \sin\phi_1\cos\phi_2\cos\Delta\lambda)$ | degrees (0–360) |

Required capabilities:
- **Measure distance tool**: Click points to create a segmented path. Live distance to cursor shown during measurement. Total accumulated distance displayed. Double-click to finish.
- **Measure area tool**: Click polygon vertices. Live area calculation updates as polygon grows. Double-click to close and finalize.
- **Unit selector**: Toggle between metric (m/km/m²/km²/ha) and imperial (ft/mi/acres) in the status bar or measurement panel.
- **Measurement results sidebar**: List of completed measurements with type, value, timestamp, and copy-to-clipboard action.
- **Visual rendering**: Measurement path/polygon shown as dashed amber line on map. Segment labels at midpoints. Total displayed at final point.

Implementation requirements:
- `geodesic.ts` must be a pure utility module with zero UI dependencies — independently testable.
- Earth radius: WGS-84 mean radius (6,371,008.8 m).
- Accuracy target: < 0.1% error at distances up to 100 km (urban regional scale).
- Unit tests with known geodesic benchmarks (e.g., London → Paris = ~343.5 km).

### Acceptance Criteria
- Distance measurement London (51.5074°N, 0.1278°W) → Paris (48.8566°N, 2.3522°E) yields ~343–344 km.
- Area measurement of a 1 km × 1 km square at the equator yields ~1,000,000 m² (± 0.1%).
- Measurement results persist in the sidebar across measurement sessions within the same modal open cycle.
- Unit toggle instantly converts all displayed values without re-measurement.

---

# Prompt 07 — Context Menu & Reverse Geocoding

### Objective
Add a right-click context menu providing quick spatial actions at any map location, including reverse geocoding, measurement initiation, drawing, and coordinate operations.

### Prompt
Create `src/centerpanel/components/MapContextMenu.tsx`.

Required context menu actions:

| Action | Behavior |
|--------|----------|
| **What's here?** | Reverse geocode via Nominatim → show address, administrative area, coordinates in a popup |
| **Add pin here** | Place a pin at the right-click location with auto-generated label |
| **Measure from here** | Activate distance measurement starting at the clicked point |
| **Draw polygon here** | Activate polygon drawing starting at the clicked point |
| **Copy coordinates** | Copy `lat, lng` (6 decimal places) to clipboard with toast confirmation |
| **Zoom to all features** | Fit map bounds to all visible pins, drawn features, and overlay layers |
| **Center map here** | Smooth flyTo the right-clicked point at current zoom |

Required capabilities:
- Context menu appears at cursor position on right-click.
- Menu disappears on: click outside, Escape key, or selecting an action.
- Menu styled with `DESIGN_TOKENS.glassmorphism.dark` and the standard Charcoal-Amber palette.
- Reverse geocode result shown as a styled popup bubble on the map at the queried point.
- Menu position auto-adjusts to stay within viewport bounds (no overflow off-screen).

Implementation requirements:
- Nominatim reverse geocoding: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}`.
- Debounce/rate-limit reverse geocode requests (max 1 per second per Nominatim usage policy).
- Context menu must not conflict with MapLibre's native right-click drag (pitch adjustment).
- Use `map.on('contextmenu', ...)` and `event.preventDefault()`.

### Acceptance Criteria
- Right-click on any map point shows the context menu within 50ms.
- "What's here?" returns a readable address for urban locations.
- "Copy coordinates" places correct lat/lng on the system clipboard.
- "Measure from here" transitions directly into the distance measurement workflow.
- Menu is fully keyboard-navigable (Arrow keys + Enter to select).

---


# Prompt 08 — GeoJSON Import & Export

### Objective
Enable bidirectional GeoJSON data flow so that analysts can load external spatial datasets onto the map and export map-created features for use in external GIS tools.

### Prompt
Create `src/services/map/MapDataImporter.ts`, `src/services/map/MapDataExporter.ts`, and update `MapToolbar.tsx` with import/export actions.

Required import capabilities:
- **File picker**: Button in MapToolbar → opens file dialog for `.geojson`, `.json` files.
- **Drag-and-drop**: Drop a GeoJSON file anywhere on the map surface → import it.
- **Parsing & validation**:
  - Validate GeoJSON structure (FeatureCollection, Feature, or bare Geometry).
  - Wrap bare Geometry or Feature in a FeatureCollection automatically.
  - Detect and report invalid geometries (self-intersection, unclosed rings) with specific error messages.
  - Reject files > 50 MB with a clear file-size error message.
- **Auto-viewport**: Fit map bounds to the imported layer's extent after successful import.
- **Layer registration**: Imported data appears as a named overlay layer in the Layer Panel (Prompt 04) with the filename as the layer name.
- **Progress indicator**: Show import progress bar for files > 1 MB.

Required export capabilities:
- **Export pins**: All current pins as a GeoJSON FeatureCollection (Point features with label as property).
- **Export drawings**: All drawn features (Prompt 05) as a GeoJSON FeatureCollection.
- **Export visible layers**: Merge all visible overlay layers into a single GeoJSON FeatureCollection.
- **Export options dialog**: Coordinate precision (default 6 decimals), pretty-print toggle, include/exclude properties.
- **Download trigger**: Browser file download dialog with `.geojson` extension.

Implementation requirements:
- Use `FileReader` API for import — no server dependency.
- Validate with structural checks (not just `JSON.parse`) — verify `type`, `features` array, geometry `coordinates`.
- Export uses `JSON.stringify` with optional `space` parameter for pretty-print.
- All I/O operations are asynchronous with proper loading/error states in the UI.

### Acceptance Criteria
- GeoJSON round-trip: import a file → display on map → modify a feature → export → re-import → identical result.
- Drag-and-drop import works on the map surface.
- Invalid GeoJSON shows a user-readable error toast, not a console error.
- Export with 6-decimal precision produces files compatible with QGIS, Mapbox, and Leaflet.

---

# Prompt 09 — CSV Point Layer & KML/GPX Import

### Objective
Extend the data import pipeline to support CSV files with coordinate columns and common geospatial exchange formats (KML, GPX).

### Prompt
Extend `src/services/map/MapDataImporter.ts` with CSV, KML, and GPX parsers. Create `src/centerpanel/components/MapCsvImportDialog.tsx`.

Required CSV capabilities:
- **File detection**: Automatically detect `.csv` files in the import pipeline.
- **Column mapping dialog**:
  - Auto-detect latitude columns: `latitude`, `lat`, `y`, `Latitude`, `LAT`.
  - Auto-detect longitude columns: `longitude`, `lng`, `lon`, `x`, `Longitude`, `LON`.
  - Dropdown selectors if auto-detection fails or multiple candidates exist.
  - Preview table showing first 5 rows of parsed CSV.
  - "Import" button to confirm column mapping.
- **Point generation**: Convert each CSV row to a GeoJSON Point feature. All non-coordinate columns become feature properties.
- **Error handling**: Skip rows with missing/non-numeric coordinates. Show toast: "Imported 4,892 of 5,000 points (108 rows skipped due to invalid coordinates)."

Required KML capabilities:
- Parse KML Placemarks → GeoJSON features (Point, LineString, Polygon).
- Preserve `<name>` and `<description>` as feature properties.
- Handle KML namespaces correctly.
- Support KMZ (ZIP-compressed KML) files.

Required GPX capabilities:
- Parse GPX waypoints → GeoJSON Points.
- Parse GPX tracks → GeoJSON LineStrings.
- Parse GPX routes → GeoJSON LineStrings.
- Preserve `<name>`, `<desc>`, `<ele>` (elevation), `<time>` as feature properties.

Implementation requirements:
- CSV parsing: use a lightweight CSV parser (e.g., PapaParse-like logic or manual split) — no large dependency.
- KML/GPX parsing: use DOM parser (`DOMParser`) to parse XML — no external dependency.
- All parsers ultimately produce GeoJSON and feed into the existing import pipeline from Prompt 08.
- File type detection by extension and/or MIME type.

### Acceptance Criteria
- A CSV with 10,000 rows and `lat`/`lng` columns imports as a point layer in under 2 seconds.
- Column mapping dialog correctly identifies coordinate columns in common CSV formats.
- KML files exported from Google Earth / Google My Maps import correctly.
- GPX files from GPS devices or Strava import as track LineStrings with elevation data.

---

# Prompt 10 — Spatial Database Persistence & Project Integration

### Objective
Connect the Map Explorer to the platform's spatial database engine so that map features (pins, drawings, imported layers) can be saved to and loaded from project-scoped storage, surviving application restarts.

### Prompt
Create `src/services/map/MapPersistenceService.ts` and integrate with `src/engine/spatial-db/`.

Required capabilities:
- **Save to Project**: Toolbar action that persists all current map features to the spatial database:
  - Pins (point features with labels).
  - Drawn features (all geometry types with properties).
  - Imported layer metadata (not the raw file — just layer config and small datasets).
  - Current viewport state (center, zoom, bearing, pitch).
- **Load from Project**: Toolbar action that restores previously saved map state:
  - Restore pins, drawings, layers, and viewport.
  - Show count of restored features in a toast notification.
- **Auto-save (optional)**: Debounced auto-save (5-second debounce) after any map state change — configurable in settings.
- **Spatial queries**: Bounding box search against stored features using the spatial-db `ST_Intersects` / `ST_Within` equivalent.
- **Project scoping**: Saved map data is associated with the current project ID. Switching projects loads different map states.

Implementation requirements:
- Use the existing `src/engine/spatial-db/` API for storage operations.
- Serialize GeoJSON data as blobs or structured entries in the spatial database.
- Handle storage quota gracefully — show warning at 80% capacity, block saves at 100%.
- Save/load must be resilient to schema version changes (basic versioned migration strategy).
- Add save/load status indicators (saving spinner, "last saved" timestamp in the status bar).

### Acceptance Criteria
- Pin and drawing data survives full page refresh via spatial-db persistence.
- Loading a saved project restores the exact map state including viewport and all features.
- Spatial bounding box query returns correct features within a given rectangle.
- Storage quota warning appears before the database is full.

---

# Prompt 11 — Screenshot & Map Image Export

### Objective
Enable high-quality map image export for use in reports, presentations, and publications.

### Prompt
Create `src/services/map/MapExportService.ts` and `src/centerpanel/components/MapExportDialog.tsx`.

Required capabilities:
- **PNG export**: Capture the current map canvas as a PNG image.
  - Resolution options: Screen (1x), Print (2x / 150 DPI), High (4x / 300 DPI).
  - Achieved via `map.getCanvas().toDataURL('image/png')` with `devicePixelRatio` scaling.
- **Export dialog UI**:
  - Resolution selector (dropdown: Screen, Print, High).
  - Include/exclude UI overlays toggle (toolbar, status bar, legend).
  - Optional title text input (rendered above the map in the export).
  - Optional scale bar inclusion.
  - Optional north arrow inclusion.
  - Preview thumbnail before download.
- **Filename generation**: Default filename: `map-export-{YYYY-MM-DD-HHmmss}.png`.
- **Browser download**: Trigger native download dialog.

Implementation requirements:
- For high DPI export, temporarily resize the MapLibre canvas using `map.resize()` with scaled `devicePixelRatio`, capture, then restore.
- Title, scale bar, and north arrow rendered onto a `<canvas>` compositing layer — not as HTML overlays.
- Scale bar calculation: use geodesic distance for a reference bar length (e.g., 100m, 1km, 10km depending on zoom).
- North arrow: simple SVG arrow rendered to canvas, rotated by current map bearing.

### Acceptance Criteria
- PNG export at 300 DPI produces a crisp image suitable for A4 print at map viewport size.
- Scale bar distance is geodesically accurate (± 1%).
- North arrow rotates correctly when map bearing is non-zero.
- Export with title renders clean typographic text above the map image.

---


# Prompt 12 — Choropleth & Thematic Map Renderer

### Objective
Transform the map into an analytical display surface by implementing classification-based choropleth rendering for any GeoJSON polygon layer with numeric attributes.

### Prompt
Create `src/centerpanel/components/MapChoroplethLayer.tsx`, `src/utils/classification.ts`, and `src/utils/colorRamps.ts`.

Required classification methods in `classification.ts`:
- **Equal Interval**: Divide value range into N equal-width bins.
- **Quantile**: Each class contains approximately the same number of observations.
- **Natural Breaks (Jenks-Fisher)**: Minimize within-class variance using the Fisher-Jenks algorithm.
- **Standard Deviation**: Class breaks at ± 0.5, 1.0, 1.5, 2.0 standard deviations from the mean.
- **Manual**: User-defined break values.

Required color ramps in `colorRamps.ts`:
- **Sequential**: YlOrRd, Blues, Greens, Purples, Oranges (5–9 classes each).
- **Diverging**: RdBu, PuOr, RdYlGn, BrBG (5–9 classes each).
- **Qualitative**: Set1, Paired, Dark2 (8–12 classes each).
- All ramps must be colorblind-safe (verified against ColorBrewer 2.0 standards).

Required UI:
- **Choropleth configuration panel**: Attribute field dropdown, classification method dropdown, number of classes (3–9), color ramp selector with visual previews.
- **Interactive legend**: Class labels with color swatches, feature count per class, click to isolate/highlight a single class.
- **Hover tooltip**: Feature ID + attribute value + class label on polygon hover.
- **Click popup**: Full attribute table for the clicked feature.

Implementation requirements:
- Choropleth rendering via MapLibre `fill` layer with `match` or `interpolate` expressions.
- Classification computed client-side from the GeoJSON FeatureCollection properties.
- Jenks-Fisher implementation must handle up to 10,000 observations without freezing (use optimized O(k·n) algorithm).
- Color ramps stored as arrays of hex strings — no external dependency.
- Update classification and re-render in real time when the user changes method, classes, or ramp.

### Acceptance Criteria
- 5,000-polygon choropleth renders with interactive hover at ≥ 30 FPS.
- Jenks-Fisher produces class breaks matching reference implementations (e.g., GeoPandas `mapclassify`).
- All color ramps are perceptually distinguishable for 5+ classes.
- Changing classification method instantly re-renders the map without full reload.

---

# Prompt 13 — Heatmap, Proportional Symbols & Graduated Symbols

### Objective
Add point-data visualization techniques for density estimation (heatmap), magnitude comparison (proportional symbols), and classified magnitude display (graduated symbols).

### Prompt
Create `src/centerpanel/components/MapHeatmapLayer.tsx`, `src/centerpanel/components/MapSymbolLayer.tsx`.

Required heatmap capabilities:
- Kernel density estimation visualization using MapLibre's native `heatmap` layer type.
- Configuration panel:
  - Radius slider (5–50 px).
  - Weight field dropdown (from feature properties or uniform weight).
  - Intensity slider (0.1–5.0).
  - Color gradient selector (hot, cool, viridis, plasma).
  - Opacity slider.
- Dynamic radius scaling with zoom level (optional toggle).
- Heatmap fades to circle layer at high zoom (configurable transition zoom).

Required proportional symbol capabilities:
- Circle markers at point locations with radius proportional to an attribute value.
- Size range controls: minimum radius (2px) and maximum radius (40px).
- Color by: single color, or secondary attribute using a sequential ramp.
- Overlap handling: semi-transparent fill + optional point clustering at low zoom using MapLibre `cluster` source option.

Required graduated symbol capabilities:
- Circle markers classified into discrete size bins (e.g., small/medium/large) by an attribute.
- Classification methods: equal interval, quantile, natural breaks (reuse from Prompt 12).
- Legend showing each bin's size, color, and value range.

Implementation requirements:
- All three visualization types are selectable from a "Symbology" panel accessible when a point layer is selected in the Layer Panel.
- Heatmap and symbol layers are MapLibre-native — no external rendering.
- Proportional symbol scaling formula: `radius = minR + (value - minVal) / (maxVal - minVal) * (maxR - minR)`.

### Acceptance Criteria
- Heatmap renders 10,000 points smoothly with adjustable radius and intensity.
- Proportional symbols correctly scale between min and max radius for the value domain.
- Graduated symbols produce distinct size classes matching the selected classification method.
- Switching between visualization types for the same layer is instant (no map re-initialization).

---

# Prompt 14 — LISA Cluster & Hot Spot Visualization

### Objective
Implement specialized map renderers for spatial statistics outputs: LISA cluster maps (Local Moran's I) and Getis-Ord Gi* hot/cold spot maps, using academically standard color schemes.

### Prompt
Create `src/centerpanel/components/MapClusterViz.tsx` and `src/centerpanel/components/MapHotSpotViz.tsx`.

Required LISA cluster map capabilities:
- Accept GeoJSON with statistical fields: `local_i`, `p_value`, `cluster_type` (HH, HL, LH, LL, NS).
- Standard LISA color scheme (Anselin 1995):
  - HH (High-High): Red (`#FF0000`)
  - HL (High-Low): Pink/Light Red (`#FF9999`)
  - LH (Low-High): Light Blue (`#9999FF`)
  - LL (Low-Low): Blue (`#0000FF`)
  - Not Significant: Gray (`#CCCCCC`)
- Interactive significance filter: p-value threshold slider (0.001 → 0.1). Features above threshold rendered as "Not Significant."
- Legend with cluster type labels, colors, and count per type.
- Hover shows: feature ID, local I statistic, p-value, cluster type.

Required Gi* hot/cold spot map capabilities:
- Accept GeoJSON with fields: `gi_star`, `z_score`, `p_value`, `confidence_level`.
- Graduated diverging color scheme:
  - Hot spot 99%: Dark Red
  - Hot spot 95%: Red
  - Hot spot 90%: Light Red
  - Not Significant: Yellow/Neutral
  - Cold spot 90%: Light Blue
  - Cold spot 95%: Blue
  - Cold spot 99%: Dark Blue
- Confidence level filter similar to LISA significance filter.
- Legend with confidence categories, colors, and feature counts.
- Hover shows: feature ID, Gi* statistic, z-score, p-value, confidence category.

Implementation requirements:
- Both renderers must work with GeoJSON output contracts from `src/engine/spatial-stats/autocorrelation/LocalMoransI.ts` and `src/engine/spatial-stats/autocorrelation/GetisOrdGi.ts`.
- Color schemes must be exact — these are academic standards recognizable by any spatial analyst.
- Optional Moran scatterplot inset: small embedded chart (200×200 px) in corner of map showing the Moran scatterplot with highlighted quadrant on feature hover.

### Acceptance Criteria
- LISA cluster map with sample data shows the standard 5-color scheme instantly recognizable to spatial statistics practitioners.
- Adjusting the significance threshold immediately reclassifies and recolors features.
- Gi* hot spot map gradient is visually smooth and confidence categories are correctly mapped.
- Moran scatterplot inset (if included) highlights the correct quadrant on polygon hover.

---

# Prompt 15 — Temporal Animation & Time-Series Playback

### Objective
Enable time-series data visualization through animated map layers with playback controls, suitable for simulation results, change detection, and temporal urban analysis.

### Prompt
Create `src/centerpanel/components/MapTemporalPlayer.tsx`.

Required capabilities:
- **Timeline scrubber**: Horizontal slider at the map bottom showing the temporal extent with labeled timesteps.
- **Playback controls**: Play, Pause, Step Forward, Step Backward, Speed selector (0.5x, 1x, 2x, 4x).
- **Temporal filter**: Only features whose timestamp falls within the current time window are rendered.
- **Frame interpolation**: Smooth transition between timesteps using MapLibre's `setData()` on the GeoJSON source.
- **Time label**: Current timestamp displayed prominently on the map overlay.

Required data contracts:
- Accept GeoJSON FeatureCollection where each Feature has a `timestamp` or `time_step` property.
- Support both:
  - **Snapshot mode**: Different FeatureCollections for each timestep (e.g., cellular automata output).
  - **Continuous mode**: Features with temporal attributes filtered by time range.
- Time format support: ISO 8601 strings, Unix timestamps, or integer step indices.

Implementation requirements:
- Player state managed in `useMapExplorerStore`: `currentTimestep`, `isPlaying`, `playbackSpeed`, `timeRange`.
- Animation loop using `requestAnimationFrame` with frame rate controlled by playback speed.
- Memory-efficient: only keep current + next frame in memory for large temporal datasets.
- Player bar styled with glassmorphism matching the rest of the map UI.
- Keyboard shortcuts: Space (play/pause), Left/Right arrows (step), Shift+Left/Right (speed change).

### Acceptance Criteria
- 50-timestep urban growth simulation plays back smoothly at ≥ 15 FPS.
- Scrubber dragging shows immediate visual update on the map.
- Play/pause transitions are seamless with no frame skipping.
- Speed change mid-playback adjusts immediately without restart.

---


# Prompt 16 — Spatial Statistics → Map Bridge

### Objective
Connect the spatial statistics engine outputs to the map visualization layer so that running an analytical flow automatically renders its results on the map.

### Prompt
Create `src/services/map/MapEngineAdapter.ts` with adapter functions for each spatial statistics module.

Required adapters:

| Engine Module | Adapter Function | Map Visualization |
|--------------|-----------------|-------------------|
| `LocalMoransI` | `adaptLISAResult()` | LISA cluster map (Prompt 14) |
| `GetisOrdGi` | `adaptHotSpotResult()` | Hot/cold spot map (Prompt 14) |
| `GlobalMoransI` | `adaptGlobalMoranResult()` | Summary panel overlay on map |
| `OLS` | `adaptOLSResult()` | Residual choropleth (Prompt 12) |
| `GWR` | `adaptGWRResult()` | Local R² surface choropleth |
| `PCA` | `adaptPCAResult()` | Component score choropleth |
| `ClusterAnalysis` | `adaptClusterResult()` | Typology choropleth with cluster labels |

Required capabilities:
- Each adapter converts the engine's typed output into `OverlayLayerConfig` + appropriate visualization config.
- **Auto-render**: When an analytical flow completes, the adapter is called and the result layer is automatically added to the map.
- **Result Layer Registry**: Result layers appear in the Layer Panel under an "Analysis Results" group header.
- **Provenance metadata**: Each result layer stores: engine name, run timestamp, input parameters, statistical summary.
- **Re-run action**: Click a result layer → popover shows parameters → "Re-run" button re-executes with same parameters.
- **Stale indicator**: If input data changes after a result was computed, show a warning icon on the result layer.

Implementation requirements:
- Adapters are pure functions (engine result → layer config) — easy to test.
- Adapter output types must match the visualization components from Prompts 12–14.
- The bridge must not create tight coupling — the map module imports adapter interfaces, not engine internals.
- Add unit tests for each adapter with mock engine outputs.

### Acceptance Criteria
- Running Local Moran's I from any analytics flow automatically adds a LISA cluster layer to the map.
- Running Gi* hot spot analysis adds a hot/cold spot layer to the map.
- Result layer in the Layer Panel shows engine name, timestamp, and parameter summary.
- Re-running from the result layer produces a fresh result that replaces the stale one.

---

# Prompt 17 — GeoAI & Simulation → Map Bridge

### Objective
Extend the engine-to-map bridge to cover GeoAI inference outputs (land cover, object detection, NL→SQL) and simulation results (cellular automata, future ABM).

### Prompt
Extend `src/services/map/MapEngineAdapter.ts` with GeoAI and simulation adapters.

Required GeoAI adapters:

| GeoAI Module | Adapter Function | Map Visualization |
|-------------|-----------------|-------------------|
| `LandCoverClassifier` | `adaptLandCoverResult()` | Classified choropleth with class-specific colors (built-up, vegetation, water, bare soil, road, agriculture) |
| `ObjectDetector` | `adaptDetectionResult()` | Bounding box GeoJSON layer with class-colored rectangles + confidence labels |
| `QueryToSQL` | `adaptQueryResult()` | Highlighted features matching the spatial SQL query result |

Required simulation adapters:

| Simulation Module | Adapter Function | Map Visualization |
|------------------|-----------------|-------------------|
| `CellularAutomata` | `adaptCAResult()` | Temporal layer (Prompt 15) with growth surface animation |
| Future ABM | `adaptABMResult()` | Agent point layer + density heatmap (Prompt 13) |

Required capabilities:
- Land cover visualization uses a fixed, semantically meaningful color scheme:
  - Built-up: Red (#E74C3C)
  - Vegetation: Green (#27AE60)
  - Water: Blue (#3498DB)
  - Bare Soil: Brown (#D4A574)
  - Road: Gray (#95A5A6)
  - Agriculture: Yellow (#F1C40F)
- Object detection results show class-colored bounding boxes with confidence > threshold.
  - Click a detection box → show class, confidence, and geographic extent.
- Cellular automata results feed into the temporal player with one frame per simulation step.
- Query result highlighting: matched features rendered with amber outline + fill highlight.
- Each GeoAI and simulation layer exposes an inspectable summary: layer ID, model name, input source, feature count, confidence threshold, class distribution, time-step count, and known caveats.
- Selecting a GeoAI result on the map shows the selected layer metadata needed to answer "what am I seeing?", "why was this classified?", and "what should I compare next?".
- NL→SQL result layers must mark whether they came from live queryable project data, imported worker-backed spatial tables, or explicit demo data.
- Simulation outputs must expose time-step metadata so the UI can summarize change between frames and propose temporal comparison views.

Required layer metadata:
- `adaptLandCoverResult()` must emit analysis metadata for class counts, class area totals, input imagery/source, model confidence, and classification caveats.
- `adaptDetectionResult()` must emit analysis metadata for every retained detection group, including class name, threshold, count, average confidence, and selected bounding-box feature IDs.
- `adaptQueryResult()` must emit the natural-language query, generated SQL, execution scope, source table/layer IDs, matched feature count, and whether the query ran against project data or explicit demo data.
- `adaptCAResult()` must emit start/end frame summaries, changed-cell counts, growth/decline metrics, and temporal range.
- The layer popover must include "Compare with visible layers" and "Add to report" actions.

Implementation requirements:
- Maintain the same adapter pattern from Prompt 16 — pure functions, typed outputs, testable.
- Land cover and detection color schemes defined as constants, not hardcoded in rendering logic.
- CA adapter must handle large temporal datasets (100+ timesteps × 1000+ cells) efficiently.
- Adapter output must include `OverlayLayerConfig` with compact analysis metadata.
- Large feature collections stay in map/store memory and are referenced by IDs.
- Add tests for adapter output validity, metadata completeness, and explicit demo/live-source labeling.

### Acceptance Criteria
- Land cover classification result renders as a clearly color-coded map matching the semantic scheme.
- Object detection bounding boxes are clickable and show class + confidence details.
- CA simulation result plays back in the temporal player with smooth frame transitions.
- All adapters produce valid `OverlayLayerConfig` entries registered in the Layer Panel.
- Selecting a GeoAI or simulation layer exposes layer metadata without relying on screenshots or unstructured text.
- NL→SQL map layers truthfully distinguish live project/imported execution from explicit demo mode.

---

# Prompt 18 — Map → Engine Dispatch (Bidirectional Analysis)

### Objective
Enable the reverse direction: map interactions trigger analytical operations, allowing users to select areas or features on the map and dispatch them to the platform's analytical engines.

### Prompt
Create `src/services/map/MapAnalysisDispatcher.ts` and extend `MapContextMenu.tsx`.

Required dispatch actions:

| Map Interaction | Dispatched Analysis |
|----------------|-------------------|
| Draw polygon → "Analyze this area" | Open flow selector dialog scoped to the selected AOI |
| Right-click point → "Isochrone from here" | Dispatch to network accessibility engine with the clicked point |
| Right-click point → "Hot spot analysis around here" | Dispatch Gi* analysis with auto-generated bounding box |
| Select features → "Run statistics on selection" | Open statistics summary panel for selected feature properties |
| Bounding box tool → "Restrict analysis to view" | Set the current map extent as the computation boundary for the active flow |

Required capabilities:
- **Flow selector dialog**: When "Analyze this area" is chosen, show a modal listing compatible analytical flows (from the flow registry) that accept spatial input. User picks a flow → the AOI geometry is passed as the flow's spatial input parameter.
- **Quick statistics panel**: For selected features, show: count, min, max, mean, median, standard deviation for each numeric attribute. Table format with export to CSV.
- **Extent restriction**: A "Restrict to Map View" toggle in the toolbar that, when active, passes the current map extent as a spatial filter to any running analytical flow.
- **Dispatch feedback**: After dispatching an analysis, show a progress indicator on the map. When complete, auto-render the result via the engine adapter (Prompt 16/17).

Implementation requirements:
- Dispatcher must work through a clean interface — the map module dispatches events, the flow registry catches and routes them.
- The map never directly imports engine modules — only through the dispatcher/adapter abstraction.
- AOI geometry passed as standard GeoJSON — compatible with all engine input contracts.
- Add integration tests verifying that dispatch → engine → adapter → map layer pipeline works end-to-end with mock engine.

### Acceptance Criteria
- Drawing a polygon and clicking "Analyze this area" opens a flow picker with relevant options.
- The selected flow receives the drawn polygon geometry as its spatial input.
- Quick statistics for a selected feature set shows correct descriptive statistics.
- The full pipeline (map → dispatch → engine → result → map layer) works without manual intervention.

---


# Prompt 19 — VoxCity 2D↔3D Viewport Synchronization

### Objective
Unify the 2D Map Explorer and the VoxCity 3D viewer into a coherent spatial workspace with synchronized camera positions.

### Prompt
Create `src/services/map/MapSyncService.ts` and update both map and VoxCity viewer components.

Required capabilities:
- **2D → 3D sync**: Panning/zooming the 2D map updates the VoxCity 3D camera to look at the same geographic location.
- **3D → 2D sync**: Orbiting/panning in the 3D viewer updates the 2D map center and zoom.
- **Sync toggle**: A toolbar button to enable/disable synchronization. Default: disabled.
- **Camera math**: Convert between MapLibre viewport state `{center, zoom, bearing, pitch}` and Three.js camera parameters `{position, target, fov}`.

Conversion formulas:
- Map zoom → 3D camera altitude: $h = \frac{C \cdot \cos(\phi)}{2^{z}}$ where $C$ is Earth circumference and $z$ is zoom level.
- Map bearing → 3D camera azimuth rotation.
- Map center → 3D camera lookAt target (projected from EPSG:4326 to local scene coordinates).

Required UI:
- Sync toggle button (🔗 icon) in the map toolbar.
- Visual indicator when sync is active (amber glow on the button).
- Status bar shows "Synced with 3D" when active.

Implementation requirements:
- Use a shared event bus or Zustand store for viewport state communication — no direct cross-component imports.
- Debounce sync updates (100ms) to prevent infinite ping-pong loops.
- Handle edge cases: one view closed while sync is active, extreme zoom differences, 3D view under other modal.

### Acceptance Criteria
- With sync enabled, panning the 2D map visibly moves the 3D camera to the equivalent position.
- With sync enabled, orbiting in 3D updates the 2D map center and bearing.
- Disabling sync stops all cross-view updates immediately.
- No infinite loop or flickering when both views are active.

---

# Prompt 20 — Building Footprint & CityJSON 2D Overlay

### Objective
Project VoxCity building footprints and CityJSON geometry onto the 2D map as interactive GeoJSON polygon layers.

### Prompt
Extend the Map Explorer to display building data from the VoxCity stack on the 2D map.

Required capabilities:
- **Building footprint layer**: Load `sampleBuildings.ts` data as a GeoJSON polygon layer on the 2D map.
  - Thematic styling by attribute: height, building type, construction year (reuse choropleth from Prompt 12).
  - Click building polygon → popup showing all attributes (matching VoxCity attribute panel content).
  - Toggle to show/hide building labels (address or ID).
- **CityJSON footprint projection**: Project CityJSON geometry from `CityJSONLoader` as 2D footprint outlines.
  - Semantic surface coloring in 2D: roof boundaries (red), wall outlines (gray), ground surfaces (brown).
  - LOD selector matching the 3D viewer's LOD toggle.
- **Linked selection**: Clicking a building on the 2D map highlights the same building in the 3D view (if sync is enabled from Prompt 19).

Implementation requirements:
- Building data projected from local coordinates to EPSG:4326 for map display.
- CityJSON footprint extraction: project each CityObject's ground-level geometry ring to 2D (drop Z coordinates, transform to geographic).
- Building layer automatically appears in the Layer Panel under "VoxCity" group.
- Handle large building datasets (5,000+ buildings) using MapLibre's vector rendering.

### Acceptance Criteria
- Sample buildings appear as styled polygons on the 2D map.
- CityJSON semantic surfaces are distinguishable by color on the 2D map.
- Clicking a building shows the same attributes visible in the 3D viewer.
- Linked selection between 2D and 3D works when sync is enabled.

---

# Prompt 21 — Solar Shadow Overlay on 2D Map

### Objective
Render the SunlightSimulator's shadow output as a time-animated overlay on the 2D map, enabling solar analysis in the map context.

### Prompt
Extend the Map Explorer to display solar simulation results from the VoxCity `SunlightSimulator`.

Required capabilities:
- **Shadow polygon overlay**: Render shadow projections as semi-transparent dark polygons on the map.
- **Temporal integration**: Shadow data feeds into the temporal player (Prompt 15) with one frame per simulation timestep.
- **Shadow opacity mapping**: Areas with accumulated shadow hours rendered with proportional darkness (more shadow hours = darker overlay).
- **Building solar summary**: Click a building footprint → popup showing total solar exposure hours for the selected date range.
- **Solar exposure choropleth**: Optional choropleth mode coloring buildings by solar exposure hours (gradient: amber for high exposure → dark blue for low).

Implementation requirements:
- Shadow polygons computed by projecting each building's shadow geometry to the ground plane at each sun position.
- Use the `SunlightSimulator` output contract — adapter pattern from Prompt 16/17.
- Temporal player integration: each timestep updates the shadow layer data via `map.getSource('shadows').setData(...)`.
- Performance target: smooth animation for 500+ buildings × 24 timesteps at ≥ 15 FPS.

### Acceptance Criteria
- Shadow overlay visually shows how shadows move across the urban area over the course of a day.
- Temporal player scrubbing updates shadows in real time.
- Building solar exposure choropleth correctly ranks buildings by accumulated sunlight.
- Click a building to see its specific solar exposure summary.

---


# Prompt 22 — External Map Service Support (WMS/WFS/XYZ)

### Objective
Enable consumption of external geospatial web services so that analysts can overlay authoritative data sources from national mapping agencies, OpenStreetMap, and domain-specific providers.

### Prompt
Create `src/services/map/ExternalServiceConnector.ts` and `src/centerpanel/components/MapServiceDialog.tsx`.

Required capabilities:
- **WMS/WMTS support**:
  - URL input → capabilities document fetch and parse (XML `GetCapabilities`).
  - Layer list display with name, title, abstract, and available CRS.
  - User selects layer(s) → added as raster overlay on the map.
  - Automatic reprojection handling (request in EPSG:3857 or EPSG:4326).
- **WFS support**:
  - URL input → capabilities fetch → feature type list.
  - User selects feature type → fetched as GeoJSON and added as vector overlay.
  - Spatial bounding box filter to avoid loading the entire dataset.
- **Custom XYZ tile source**:
  - URL template input: `https://example.com/{z}/{x}/{y}.png`.
  - Add as raster tile overlay.
  - Common presets: OpenTopoMap, Stamen Watercolor, ESRI World Imagery.
- **Service manager panel**: List of connected services with status indicators, refresh, and remove actions.

Implementation requirements:
- WMS capabilities parsed with `DOMParser` — no external dependency.
- WFS responses in GeoJSON format (request `outputFormat=application/json`).
- Service URLs validated before fetch attempt (URL format, HTTPS preferred).
- Response timeout: 10 seconds with user-facing error message on failure.
- CORS handling: inform user if a service is blocked by CORS with instructions to use a proxy.

### Acceptance Criteria
- A WMS endpoint (e.g., national mapping agency) can be added and layers rendered on the map.
- A WFS endpoint delivers features that appear as interactive vector layers.
- Custom XYZ tiles render correctly over the base map.
- Service connection failures show clear, helpful error messages.

---

# Prompt 23 — Bookmarks, Annotations & Saved Views

### Objective
Enable analysts to save, name, and recall map view states, and to place persistent text annotations on the map for communication and presentation purposes.

### Prompt
Create `src/centerpanel/components/MapBookmarkBar.tsx` and `src/centerpanel/components/MapAnnotationLayer.tsx`.

Required bookmark capabilities:
- **Save view**: Capture current viewport (center, zoom, bearing, pitch) + visible layers + active visualization as a named bookmark.
- **Bookmark bar**: Horizontal bar below the toolbar showing saved bookmarks as clickable chips.
- **Restore view**: Click bookmark → flyTo the saved viewport and restore layer visibility state.
- **Edit/delete bookmarks**: Right-click bookmark chip → rename or delete.
- **Bookmark persistence**: Saved to the Zustand store → persisted to localStorage.
- **Share view**: "Copy Link" action serializes the bookmark as a URL-safe JSON parameter string (for future deep-linking support).

Required annotation capabilities:
- **Text annotation tool**: Place text labels at specific coordinates on the map.
- **Annotation settings**: Font size (12–36px), color (from palette), bold/italic toggle, rotation angle, background has/no-bg toggle.
- **Leader lines**: Optional line connecting the annotation label to a specific feature or point.
- **Annotation layer**: All annotations rendered as a dedicated MapLibre symbol layer.
- **Edit/delete**: Click annotation to select → drag to move, double-click to edit text, Delete key to remove.
- **Annotation persistence**: Stored in the map store, included in project save/load (Prompt 10).

Implementation requirements:
- Bookmarks serialized as JSON: `{ name, center, zoom, bearing, pitch, layers: string[], timestamp }`.
- Annotations stored as GeoJSON Points with text/style properties — rendered via MapLibre's `symbol` layer with `text-field` and `text-font`.
- Maximum 50 bookmarks and 200 annotations per project (to avoid storage bloat).

### Acceptance Criteria
- Saving a bookmark captures the exact map state including visible layers.
- Restoring a bookmark animates to the saved position and restores layer visibility.
- Text annotations are editable, movable, and styled according to user settings.
- Bookmarks and annotations survive modal close/reopen and page refresh.

---

# Prompt 24 — Print Composition & Publication-Quality PDF Export

### Objective
Deliver print-ready map composition tools producing publication-quality output for academic papers, policy reports, and professional presentations.

### Prompt
Create `src/centerpanel/components/MapCompositionLayout.tsx` and extend `src/services/map/MapExportService.ts`.

Required composition elements:
- **Title block**: Configurable title text, subtitle, font size, position (top-left, top-center, top-right).
- **Scale bar**: Geodesically accurate, metric/imperial, positioning at any corner.
- **North arrow**: Multiple styles (simple arrow, compass rose), rotates with map bearing.
- **Legend**: Auto-generated from all visible layers with correct symbology (choropleth classes, symbol sizes, heatmap gradient).
- **Inset/locator map**: Small overview map (200×200 px) showing the main map extent within a wider area context.
- **Attribution/source**: Customizable text block for data source credits and methodology notes.
- **Graticule**: Optional lat/lng grid lines with labeled coordinate ticks.

Required export formats:
- **PNG**: 72, 150, 300 DPI options.
- **SVG**: Vector output for scalable publication graphics.
- **PDF**: A4, A3, Letter, Custom dimensions. Generated via HTML canvas → `jsPDF` library.
- **Export dialog**: Format selector, DPI, page size, margin controls, element toggle checkboxes.

Implementation requirements:
- Composition elements rendered onto a `<canvas>` overlay during export — not as permanent HTML elements.
- Print preview mode: show the composition frame with dashed borders indicating element positions.
- Legend generation must introspect active visualization configs (choropleth, heatmap, cluster) to produce accurate legend entries.
- PDF generation: map canvas rasterized at target DPI → embedded in PDF with vector text overlays for title/legend.

### Acceptance Criteria
- PDF export at 300 DPI on A4 produces a crisp, professional map ready for journal submission.
- Legend accurately reflects all visible map layers and their symbology.
- Scale bar distance is geodesically correct at the center of the current viewport.
- All composition elements (title, legend, scale bar, north arrow, attribution) are independently togglable and positionable.

---


# Prompt 25 — Map State Snapshot Protocol

### Objective
Keep viewport, layer registry, selection, temporal, 3D, and project state structured enough for reliable map workflows.

### Prompt
Maintain typed map state inside the store and expose small selectors for downstream map features. Do not create a separate assistant bus or map-scoped proposal queue.

### Acceptance Criteria
- Moving the map updates current bounds and zoom in store state.
- Toggling a layer updates the visible layer list.
- Selecting features exposes feature IDs and summary metadata, not full unbounded feature payloads.

---

# Prompt 26 — Map Command Palette & Reversible Action Controls

### Objective
Support explicit map operations while preserving analyst control, previewability, undo, and auditability.

### Prompt
Keep map commands deterministic and analyst-operated from the Map Explorer UI. High-risk operations must support preview, apply, cancel, and undo controls.

### Acceptance Criteria
- Analyst can preview an operation and see visual feedback before applying it.
- Applied actions are reversible where technically possible.
- The audit trail records affected layers and timestamps for high-impact map operations.

---

# Prompt 27 — Layer Metadata Inspection

### Objective
Make every map layer inspectable from the layer stack and feature popups using structured metadata.

### Prompt
Layer popovers and feature popups should expose source, geometry type, feature count, CRS, visible extent, styling method, provenance, analysis parameters, statistical summary, caveats, and reproducibility metadata where available.

### Acceptance Criteria
- Every visible overlay layer exposes structured metadata.
- Report handoff includes source/provenance/caveat text, not just a screenshot.
- Missing metadata is surfaced truthfully instead of being hidden or invented.

---

# Prompt 28 — Scientific QA Assistant For CRS, Geometry, Scale & Lineage

### Objective
Add a scientific quality-control layer that detects common GIS validity issues and exposes them to the map UI.

### Prompt
Create `src/services/map/MapScientificQA.ts` and `src/centerpanel/components/map/ScientificQAPanel.tsx`.

Required QA checks:
- CRS mismatch between visible layers and active analysis inputs.
- Unknown CRS or missing projection metadata.
- Invalid geometries: self-intersections, empty geometries, non-closed rings, duplicate vertices.
- Geometry type mismatch for selected analysis workflows.
- Excessive coordinate precision or suspicious coordinate ranges.
- Scale mismatch between raster resolution, vector geometry detail, and viewport zoom.
- Temporal mismatch between layers used in comparison.
- Missing source, timestamp, license, or provenance metadata.
- Demo/sample layer used alongside project data without explicit warning.

Required UI:
- QA status indicator in the map toolbar.
- Scientific QA side panel with issue severity, affected layer, explanation, and suggested fix.
- Feature/layer badges for invalid geometry, missing CRS, sample data, stale result, or uncertain output.
- "Show details" action for any QA issue.

Implementation requirements:
- QA checks must be deterministic and run incrementally when layers change.
- Expensive geometry validation should use a worker when dataset size exceeds a threshold.
- QA results must be included in the map state metadata.
- Add unit tests with valid and invalid GeoJSON fixtures.

### Acceptance Criteria
- Loading a layer with missing CRS shows a QA warning and caveat.
- Invalid geometry is identified at layer and feature level where possible.
- Analysis dispatch can block or warn when inputs fail required QA rules.

---

# Prompt 29 — Natural-Language Map Query Builder Over Visible Layers

### Objective
Let analysts ask spatial questions about visible map layers while keeping execution scope explicit and reproducible.

### Prompt
Create a map-scoped NL query workflow that bridges QueryToSQL, visible layer metadata, and selected AOI.

Required capabilities:
- The query builder reads visible queryable layers from map state.
- User can ask questions such as:
  - "Show parcels within 500 meters of transit stops."
  - "Highlight high-density blocks that also have low tree cover."
  - "Filter detections above 80% confidence inside this district."
  - "Compare hot spots with the current zoning layer."
- Query builder shows generated SQL or spatial predicate before execution.
- Query scope is explicit: visible layers, selected AOI, current map extent, or full project dataset.
- Demo mode is explicit and never silently substituted.

Required UI:
- Query preview panel with natural-language request, selected source layers, generated SQL/predicate, expected output type, and run button.
- Query result layer added to the map with amber highlight and execution metadata.
- Follow-up suggestions based on result count and geometry type.

Implementation requirements:
- Use the NL-to-SQL residual truthfulness standard: live execution is limited to queryable project overlays and imported worker-backed spatial tables.
- Non-queryable layers must be listed as unavailable for execution with a clear reason.
- Generated queries must be inspectable and copyable.
- Add tests for scope selection, demo/live labeling, query result layer creation, and non-queryable layer handling.

### Acceptance Criteria
- The query builder can generate a map-scoped spatial query using visible queryable layers.
- The analyst can review and run the generated query before map state changes.
- Result layers clearly identify source tables/layers and execution scope.
- Non-queryable layers are handled truthfully without silent fallback.

---

# Prompt 30 — Cartography & Symbology Review

### Objective
Improve map readability while preserving deterministic, analyst-approved styling changes.

### Prompt
Create `src/services/map/MapCartographyAdvisor.ts` and integrate recommendations into the Layer Panel and style editor.

Required recommendation types:
- Choropleth classification method suggestion based on distribution shape.
- Color scheme warning for perceptual ordering, accessibility, or semantic mismatch.
- Symbol size and opacity suggestions for dense point layers.
- Heatmap radius/intensity suggestions based on zoom and point density.
- Label collision or readability warnings.
- Legend completeness warnings.
- Contrast and color-blind accessibility checks.

Required UI:
- "Review symbology" action per layer and for the full visible map.
- Recommendation list with severity, rationale, preview, apply, and dismiss controls.
- Before/after legend preview for style changes.
- Detail link for each cartographic recommendation.

Implementation requirements:
- Recommendations must be generated from layer statistics, geometry type, current styling, and viewport.
- Applying a recommendation must go through the reversible controls from Prompt 26.
- Style changes must be undoable and persisted only after user approval.
- Add tests for numeric distribution detection, color-scheme warnings, and proposal generation.

### Acceptance Criteria
- The advisor can recommend a better classification or color scheme for a thematic layer.
- Analyst sees a preview before applying cartographic changes.
- Accessibility warnings are visible and actionable.
- Applied styling changes update legends and report/export outputs.

---

# Prompt 31 — AOI, Selection, Buffer & Comparison Workflows

### Objective
Turn common spatial reasoning tasks into guided workflows where the map exposes each step transparently.

### Prompt
Create guided workflows for AOI creation, selection refinement, buffers, intersections, and side-by-side comparisons.

Required workflows:
- Create AOI from current viewport, selected features, drawn polygon, or geocoded place.
- Buffer selected points/lines/polygons with geodesic distance and unit selection.
- Intersect two visible layers and produce a derived result layer.
- Difference and union operations for policy scenario comparison.
- Compare two layers using synchronized split view, swipe view, or opacity blend.
- Save a comparison as a report item.

Required UI:
- Workflow drawer with stepper: source → operation → parameters → preview → apply → report.
- Map preview layer rendered before operation is committed.
- Guidance panel explaining why each input is required.
- Clear disabled states when no compatible layers or selections exist.

Implementation requirements:
- Geometry operations should use reliable spatial libraries or workers for large datasets.
- AOI and derived layers must carry provenance and QA status.
- Workflow suggestions must be generated as explicit actions, not direct mutations.
- Add tests for AOI creation, buffer parameter validation, intersection result metadata, and comparison view state.

### Acceptance Criteria
- Analyst can create an AOI from map context.
- Buffer/intersection/comparison workflows preview results before committing.
- Derived layers are registered, inspectable, and reportable.
- The workflow state clearly shows the next required input.

---

# Prompt 32 — Contextual Analysis Recommendation Engine

### Objective
Let the Map Explorer recommend scientifically appropriate next analyses based on visible layers, selected features, QA status, and user intent.

### Prompt
Create `src/services/map/MapAnalysisRecommender.ts` and a recommendation surface inside Map Explorer.

Required recommendation logic:
- If a polygon layer with numeric attributes is visible, recommend choropleth, Moran's I, OLS/GWR, or clustering depending on attributes and feature count.
- If point events are visible, recommend KDE/heatmap, hot spot analysis, nearest-neighbor statistics, or network accessibility workflows.
- If temporal frames exist, recommend trend comparison, time slider, or simulation playback.
- If building footprints are visible, recommend VoxCity extrusion, sunlight simulation, or CityJSON export.
- If raster/GeoAI outputs exist, recommend class distribution summary, overlay comparison, or uncertainty review.
- If QA warnings exist, recommend resolving CRS/geometry/lineage issues before analysis.

Required UI:
- "Recommended next steps" strip in the Map Explorer.
- Each recommendation shows required inputs, expected output, scientific caveat, and action button.
- Recommendations can open the relevant flow, prepare parameters, or create an explicit map action.

Implementation requirements:
- Recommendations must be rule-based and explainable before any AI-generated narrative is layered on top.
- Ranking must account for visible layers, selection state, data quality, workflow availability, and current user intent.
- Add tests for recommendation ranking across point, polygon, temporal, VoxCity, and QA-warning scenarios.

### Acceptance Criteria
- The map recommends relevant analyses based on current layer context.
- The recommender can explain why an analysis is recommended and what data it will use.
- QA-blocked recommendations show the blocking issue instead of offering a broken action.
- Recommendation actions route into existing flow registry and map adapter pathways.

---

# Prompt 33 — Map Narrative & Citation Handoff

### Objective
Make map findings exportable as report-ready narrative sections without losing provenance or scientific caveats.

### Prompt
Create `src/services/map/MapReportHandoffService.ts` and integrate it with publication export.

Required handoff items:
- Static map snapshot with title, visible layer list, legend, scale bar, north arrow, and attribution.
- Structured map references: layer IDs, feature IDs, analysis run IDs, source names, timestamps, CRS, parameters.
- Narrative draft with citations to map references.
- Caveats section: QA warnings, uncertainty, sample/demo labels, model confidence limitations, temporal mismatch.
- Reproducibility block: viewport bounds, layer visibility, styling config, analysis parameters.

Required UI:
- "Add to report" action on map toolbar, layer popover, and feature popup.
- Report preview drawer showing screenshot, legend, narrative draft, citations, and caveats before insertion.
- Toggle options for including methods, data lineage, and QA warnings.

Implementation requirements:
- Narrative and citations must come from structured map metadata.
- Report handoff must work for manual map views, engine result layers, GeoAI outputs, simulation frames, and VoxCity overlays.
- Add tests for map reference serialization and report insertion payloads.

### Acceptance Criteria
- A map finding can be added to the report with screenshot, legend, references, and caveats.
- Narrative cites real map references.
- Sample/demo layers are clearly marked in report handoff.
- Reopening a report item can restore the map view or at least list the exact viewport and layers used.

---

# Prompt 34 — Collaborative Review Mode For Map Sessions

### Objective
Support professional review workflows where an analyst can preserve map state and action history as an auditable session.

### Prompt
Create a review session model for Map Explorer work.

Required session content:
- Map context snapshots at important milestones.
- Accepted/rejected/applied action status and undo outcomes.
- Report items created from the map.
- QA warnings acknowledged or resolved.
- Analysis recommendations shown and actions taken.
- Notes/annotations tied to map locations or layers.

Required UI:
- "Review timeline" panel in the Map Explorer.
- Timeline entries for viewport bookmarks, layer changes, query runs, analysis dispatches, report handoffs, and QA events.
- Filter timeline by event type, layer, date/time, and status.
- Export session log as JSON and human-readable Markdown.

Implementation requirements:
- Session logs must avoid storing large raw datasets.
- Timeline entries must reference layer IDs and report item IDs.
- Session export must be deterministic enough for reproducibility review.
- Add tests for timeline event creation, filtering, and export serialization.

### Acceptance Criteria
- Analyst can inspect what changed during a map session.
- Proposed actions are auditable after they are applied or rejected.
- Review timeline can export a reproducible session summary.
- Report items link back to session events where available.

---

# Prompt 35 — Premium Map Modal Layout, Responsive Density & Multi-Panel Workspace

### Objective
Deliver the final premium Map Explorer / Map Modal shell where map, layer controls, QA, and report handoff coexist without clipping, cramped heights, or disconnected popups.

### Prompt
Redesign the Map Explorer shell as a responsive multi-panel workspace.

Required layouts:
- **Desktop integrated workspace**: map center, left layer/data panel, right QA/report panel, bottom temporal/status bar.
- **Desktop modal focus mode**: full-screen map modal with collapsible side rails and command palette.
- **Split analysis mode**: map + active analytical flow side-by-side when launched from a workflow.
- **Comparison mode**: split/swipe map and synchronized legends.
- **Mobile/constrained mode**: map first, bottom drawer for layers, no clipped critical controls.

Required UI rules:
- Minimum usable map viewport height must be enforced for 2D, 3D, simulation, and temporal playback surfaces.
- Toolbars must wrap or collapse into icon groups without hiding required controls.
- Side panels must be resizable and remember width preferences.
- Modal content must scroll only where appropriate; the map canvas must not be squeezed by action bars.
- Every empty or disabled state names the missing prerequisite.
- No production "coming soon" or placeholder workflow text.

Implementation requirements:
- Use existing design tokens and established panel components.
- Define explicit CSS layout primitives for `MapWorkspaceShell`, `MapPanelRail`, `MapCanvasRegion`, and `MapBottomTimeline`.
- Verify desktop, laptop, tablet, and narrow viewport screenshots.
- Add Playwright coverage for modal open, layer panel resize, comparison mode, and constrained viewport behavior.

### Acceptance Criteria
- Map Explorer works as both embedded workspace and premium modal.
- 2D/3D/simulation surfaces have adequate height and are not clipped by headers or bottom action bars.
- Responsive layouts preserve tool access, layer visibility, and report handoff.

---

# Prompt 36 — Final World-Class Map Explorer Release Hardening

### Objective
Validate the complete Map Explorer as a production-grade scientific spatial analysis environment.

### Prompt
Create a final release-hardening pass covering correctness, performance, accessibility, truthfulness, visual quality, and documentation.

Required validation areas:
- Map state persistence, layer registry, import/export, drawing, measurement, analytics adapters, VoxCity bridge, external services, print export.
- Map workflow state: layer registry, action proposals, QA caveats, report handoff, review timeline.
- Scientific correctness: CRS labeling, geometry validity, scale bar accuracy, thematic classification, temporal metadata, provenance.
- UX quality: responsive modal layout, keyboard navigation, focus management, tooltip coverage, disabled-state clarity.
- Performance: large GeoJSON layers, temporal animation, CA frames, detection boxes, heatmaps, worker-backed queries.
- Truthfulness: demo/sample labels, NL-to-SQL execution scope, model confidence caveats, unavailable metadata handling.

Required documentation:
- Update implementation ledger for all Map Explorer prompts.
- Add user-facing Map Explorer workflow guide.
- Add developer architecture doc for map state and action handling.
- Add QA checklist for scientific map release validation.
- Add known limitations with truthful residual risks.

Required test commands:
1. `npm run typecheck`
2. `npm run build`
3. `npm run test`
4. `npm run lint:errors`
5. `npm run test:e2e:smoke`
6. Targeted Playwright suites for Map Explorer modal, layer workflows, VoxCity bridge, and report handoff.

### Acceptance Criteria
- The Map Explorer is usable as a premium, scientific map workspace or modal.
- Map Explorer state stays consistent across viewport, layers, selection, analysis, QA, and report workflows.
- All core map operations are previewable, reversible where practical, and auditable.
- Documentation truthfully describes implemented behavior, explicit demo modes, known residual risks, and validation status.

---

## Summary — Prompt Sequence Overview

| Prompt | Title | Layer | Dependencies |
|--------|-------|-------|-------------|
| **01** | Product Charter & Design Foundation | Foundation | — |
| **02** | Store Architecture & State Persistence | Foundation | 01 |
| **03** | Accessibility & Keyboard Navigation | Foundation | 01 |
| **04** | Layer Management System | GIS Primitives | 01, 02 |
| **05** | Drawing & Sketching Tools | GIS Primitives | 01, 02, 04 |
| **06** | Geodesic Measurement Tools | GIS Primitives | 01, 02 |
| **07** | Context Menu & Reverse Geocoding | GIS Primitives | 01, 05, 06 |
| **08** | GeoJSON Import & Export | Data I/O | 01, 02, 04 |
| **09** | CSV Point Layer & KML/GPX Import | Data I/O | 08 |
| **10** | Spatial Database Persistence & Project Integration | Data I/O | 02, 04, 08 |
| **11** | Screenshot & Map Image Export | Data I/O | 01 |
| **12** | Choropleth & Thematic Map Renderer | Analytical Viz | 04 |
| **13** | Heatmap, Proportional & Graduated Symbols | Analytical Viz | 04, 12 |
| **14** | LISA Cluster & Hot Spot Visualization | Analytical Viz | 04, 12 |
| **15** | Temporal Animation & Time-Series Playback | Analytical Viz | 04 |
| **16** | Spatial Statistics → Map Bridge | Engine Integration | 12, 14 |
| **17** | GeoAI & Simulation → Map Bridge | Engine Integration | 12, 13, 15, 16 |
| **18** | Map → Engine Dispatch (Bidirectional Analysis) | Engine Integration | 05, 07, 16, 17 |
| **19** | VoxCity 2D↔3D Viewport Synchronization | VoxCity Integration | 01, 02 |
| **20** | Building Footprint & CityJSON 2D Overlay | VoxCity Integration | 04, 12, 19 |
| **21** | Solar Shadow Overlay on 2D Map | VoxCity Integration | 15, 17, 20 |
| **22** | External Map Service Support (WMS/WFS/XYZ) | Adv. Cartography | 04 |
| **23** | Bookmarks, Annotations & Saved Views | Adv. Cartography | 01, 02, 10 |
| **24** | Print Composition & Publication-Quality PDF Export | Adv. Cartography | 11, 12 |
| **25** | Map State Snapshot Protocol | Workflow State | 02, 04, 16, 17, 18, 24 |
| **26** | Map Command Palette & Reversible Action Controls | Workflow State | 25 |
| **27** | Layer Metadata Inspection | Layer Metadata | 16, 17, 25 |
| **28** | Scientific QA Assistant For CRS, Geometry, Scale & Lineage | Scientific QA | 04, 08, 10, 25 |
| **29** | Natural-Language Map Query Builder Over Visible Layers | Spatial Query | 17, 18, 25, 28 |
| **30** | Cartography & Symbology Review | Premium Cartography | 12, 13, 14, 25, 26 |
| **31** | AOI, Selection, Buffer & Comparison Workflows | Spatial Workflows | 05, 06, 18, 25, 26 |
| **32** | Contextual Analysis Recommendation Engine | Recommendation | 16, 17, 18, 28, 31 |
| **33** | Map Narrative & Citation Handoff | Report Integration | 24, 25, 27, 32 |
| **34** | Collaborative Review Mode For Map Sessions | Auditability | 25, 26, 27, 33 |
| **35** | Premium Map Modal Layout, Responsive Density & Multi-Panel Workspace | Premium UX | 01, 03, 24, 25, 34 |
| **36** | Final World-Class Map Explorer Release Hardening | Release Hardening | 01-35 |

---

## Final Acceptance Definition

The Map Explorer enhancement sequence is complete only when the following product-level outcomes are true:
- The map can run as an embedded workspace or premium modal without losing map state.
- Map Explorer keeps structured state for viewport, layers, selected features, AOI, active analyses, QA warnings, and report handoff.
- Map operations are previewable, analyst-approved, reversible where practical, and auditable.
- Every analytical result layer is inspectable, reproducible, and reportable from structured metadata.
- GeoAI, simulation, spatial statistics, VoxCity, temporal, and external service layers share the same layer registry and metadata model.
- Scientific QA warnings for CRS, geometry, scale, lineage, sample/demo data, and uncertainty are visible in the map UI.
- The visual design is dense, premium, accessible, keyboard-reachable, responsive, and free of placeholder workflow text.
- Exported maps and report handoffs include legends, scale, source attribution, caveats, and reproducibility metadata.
- Documentation and ledgers truthfully describe implemented behavior, residual limitations, demo modes, and validation results.

## Final Map Explorer Completion Report Template

```md
### Map Explorer Enhancement Sequence — Completion Report
- Scope Completed:
- Prompt Range Completed:
- Key Files Added or Updated:
- Workflow State Surfaces Added:
- Map Explorer / Modal UX Surfaces Added:
- Scientific QA And Truthfulness Improvements:
- Engine / GeoAI / Simulation / VoxCity Bridges Added:
- Report And Export Handoff Added:
- Validation Performed:
- Known Residual Risks:
- Follow-Up Required:
```

### Map Explorer Enhancement Sequence — Completion Report
- Scope Completed: Map Explorer has been checked as a premium scientific map workspace covering state persistence, layer registry, import/export, drawing, measurement, analytical renderers, temporal playback, QA, VoxCity handoff, comparison mode, publication export, review timeline, and report handoff.
- Prompt Range Completed: Prompts 01-36 are implemented and documented in `docs/implementation/map-explorer-prompt-ledger.md`. Prompts 10, 22, 29, and 36 retain truthful residual or environment-dependent caveats rather than hidden guarantees.
- Key Files Added or Updated: `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/MapContextMenu.tsx`, `src/centerpanel/components/map/MapWorkspaceShell.tsx`, `src/centerpanel/components/map/MapToolbar.tsx`, targeted Map Explorer Playwright suites, `docs/implementation/map-explorer-prompt-ledger.md`, `docs/map-explorer-workflow-guide.md`, `docs/architecture/map-explorer-state-and-actions.md`, `docs/release/map-explorer-scientific-release-checklist.md`, `docs/release/release-candidate-validation.md`, and `docs/release/known-risks-and-limitations.md`.
- Workflow State Surfaces Added: Structured map state now covers viewport, layers, visibility, opacity, panel widths, selection/AOI, temporal playback, comparison mode, analysis outputs, QA caveats, project save/load state, review timeline, and report handoff.
- Map Explorer / Modal UX Surfaces Added: Desktop multi-panel workspace, full modal focus shell, resizable left/right rails, bottom timeline/status bar, constrained viewport bottom drawer, command palette, toolbar overflow groups, split analysis mode, and comparison mode.
- Scientific QA And Truthfulness Improvements: CRS labels, missing CRS caveats, geometry/skipped-row diagnostics, scale and thematic classification caveats, temporal metadata, provenance, demo/sample labels, scoped NL query execution, and unavailable metadata handling are visible and documented.
- Engine / GeoAI / Simulation / VoxCity Bridges Added: Spatial statistics, GeoAI/simulation outputs, temporal layers, VoxCity building footprints, CityJSON/OSM sources, and sunlight/VoxCity real-geometry handoffs publish through the shared layer registry with structured metadata where available.
- Report And Export Handoff Added: GeoJSON/GeoParquet data export, publication PDF/PNG/SVG composition, report handoff with CRS/layers/QA/provenance/snapshot metadata, and review timeline audit context are implemented.
- Validation Performed: `npm run typecheck`, `npm run build`, `npm run test`, `npm run lint:errors`, `npm run test:e2e:smoke`, plus targeted suites for modal layout, CSV/KML/GPX import, GeoJSON I/O, columnar I/O, publication export, choropleth, point symbology, LISA/Gi*, temporal playback, VoxCity real-data handoff, report handoff, MapCanvas lifecycle, and repeated Map Explorer open/close/panel/viewport stability.
- Known Residual Risks: External services depend on provider availability, credentials, CORS, rate limits, and network health. Very large browser-side datasets remain hardware bounded. Missing projection metadata is labeled as a QA caveat and may fall back to visible `EPSG:4326` labeling. NL queries are intentionally limited to visible queryable layers. Sample/demo VoxCity and model-backed paths remain explicit. `MapExplorerModal` is still a large lazy chunk.
- Follow-Up Required: No release-blocking Map Explorer prompt gap was found in the local check. A repeated open/close stability test now covers the intermittent crash concern. Future work should split the large map chunk, add more real-provider contract tests where credentials are available, and expand stress testing for very large GeoJSON/Arrow/temporal workloads.
