# Prompt 15 — High-Performance Building Extrusion: Completion Report

## Scope

Polygon-to-2.5D building extrusion engine with deterministic height derivation,
LOD toggling (basic / enriched), ear-clip triangulation, winding auto-repair,
and a full 3D viewer panel with thematic styling.

## Files Created

| File | Purpose |
|---|---|
| `src/features/urbanAnalytics/voxcity/buildingTypes.ts` | Type definitions: Ring, BuildingFootprint, BuildingFeature, LODLevel, HeightStrategy, ExtrudedBuilding, ExtrusionResult, ThematicStyle, ColorStop |
| `src/features/urbanAnalytics/voxcity/BuildingExtruder.ts` | Core engine: geometry utilities (signedArea, polygonArea, centroid, winding), ear-clip triangulation, height resolution, extrude single/batch |
| `src/features/urbanAnalytics/voxcity/sampleBuildings.ts` | 50 sample buildings with varied heights, shapes (rect, L-shape), and attributes |
| `src/features/urbanAnalytics/voxcity/hooks/useBuildingScene.ts` | Zustand store: features, result, LOD, height strategy, thematic styling, selection |
| `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx` | Full 3D viewer panel with toolbar, R3F canvas, thematic sidebar, selection info |
| `src/centerpanel/Flows/VoxCity3DFlow.tsx` | Flow wrapper for BuildingViewer in Workflows tab |
| `src/features/urbanAnalytics/voxcity/__tests__/BuildingExtruder.test.ts` | 39 tests: geometry, height resolution, extrusion, LOD, batch, rendering validation |

## Files Modified

| File | Change |
|---|---|
| `src/features/urbanAnalytics/voxcity/index.ts` | Added barrel exports for all new modules |
| `src/features/urbanAnalytics/rightPanelRegistry.ts` | Added "Building Extrusion (2.5D)" card under VoxCity group |
| `src/features/urbanAnalytics/lib/types.ts` | Added `'voxcity_3d'` to AnalyticalFlowId |
| `src/centerpanel/Flows/flowTypes.ts` | Added VoxCity 3D flow definition (3 steps) |
| `src/centerpanel/Flows/flowLibraryMeta.ts` | Added SIMULATION_3D category + VoxCity flow item |
| `src/centerpanel/Flows/FlowLibraryCard.tsx` | Added SIMULATION_3D to GROUP_META + CATEGORY_ORDER |
| `src/centerpanel/Flows/FlowHost.tsx` | Added lazy import + switch case for voxcity_3d |

## Engine Methods

| Export | Signature | Description |
|---|---|---|
| `signedArea` | `(ring: Ring) → number` | Signed area (positive = CCW) |
| `polygonArea` | `(ring: Ring) → number` | Absolute area |
| `centroid` | `(ring: Ring) → [number, number]` | Polygon centroid |
| `resolveHeight` | `(attrs, strategy?) → { height, source }` | Deterministic height derivation |
| `extrudeBuilding` | `(feature, lod, strategy?) → ExtrudedBuilding \| { skipped }` | Single building to 3D mesh |
| `extrudeBuildings` | `(features, opts?) → Promise<ExtrusionResult>` | Async batch with progress callback |
| `extrudeBuildingsSync` | `(features, opts?) → ExtrusionResult` | Sync batch for testing/workers |

## Height Derivation Rules (deterministic)

1. Try each key in `HeightStrategy.attributeKeys` — first valid positive number wins → source: `"attribute"`
2. If `floorsKey` defined and yields a valid number → `floors × floorHeight` → source: `"floors"`
3. Fall back to `defaultHeight` → source: `"default"`

## UI Deliverables (Standing UI Enforcement Directive)

| Deliverable | Status | Location |
|---|---|---|
| 3D viewer panel | ✅ | BuildingViewer.tsx — R3F Canvas with OrbitControls |
| LOD toggle (Basic / Enriched) | ✅ | Toolbar button pair |
| Height attribute selector | ✅ | Toolbar dropdown (auto-detects numeric attributes) |
| Loading spinner / progress bar | ✅ | Overlay with animated progress bar |
| Thematic styling sidebar | ✅ | Collapsible sidebar with attribute picker + color ramp preview |
| Building selection info | ✅ | Bottom-left info box with height, area, attributes |
| Flow Library integration | ✅ | Workflows → "3D & Simulation" → "VoxCity 3D Building Viewer" |
| Right-panel registry card | ✅ | "Building Extrusion (2.5D)" under VoxCity 3D Environment |
| Charcoal-Amber styling | ✅ | #0d0d0d bg, #F59E0B amber accent, #FAFAF9 text |

## Validation

| Check | Result |
|---|---|
| `vitest run` (BuildingExtruder) | **39/39 passed** |
| `tsc --noEmit` | **0 errors** |
| `eslint` (all prompt-15 files) | **0 errors**, 25 warnings (R3F JSX props + sort-imports) |

## Test Coverage Summary

- **Geometry utilities**: signedArea (CCW/CW), polygonArea (square/triangle), centroid
- **Height resolution**: attribute, floors, default, NaN/Infinity guards, custom strategy
- **Single extrusion**: square, triangle, L-shape, CW auto-repair, degenerate/collinear skip, no-height default, attribute preservation
- **LOD variations**: enriched produces more geometry; short buildings skip floor lines
- **Batch extrusion**: sync valid batch, skip tracking, empty input, async with progress callback, enriched LOD
- **Rendering validation**: all positions finite, normals unit-length, indices in bounds, triangle-count divisibility, position/normal parity, roof vertex height
- **Sample data**: 50 buildings, unique IDs, valid footprints, zero-skip batch, deterministic across runs

## Known Limitations

- Ear-clip triangulation does not handle self-intersecting polygons or complex holes
- Individual `<mesh>` per building (not InstancedMesh) — suitable for demo scale (~50–500 buildings); very large datasets would benefit from geometry merging or instancing
- No geospatial projection (CRS → screen); footprints assumed in a local coordinate system

## Remediation Update — Prompt 08 (2026-04-23)

Standalone traceability note: see `docs/implementation/remediation-prompt-08-completion.md` for the independently readable current remediation report.

### Remediation Prompt 08 - Completion Report
- Scope Completed: `BuildingViewer.tsx` now resolves building inputs from Map Explorer polygon layers, imported project layers already present in the workspace map, optional CityJSON-derived geometry, and an explicitly labeled sample quick-start path. The viewer publishes provenance-rich completed runs, real footprint map layers, and a handoff payload for the sunlight workflow.
- Key Files Added or Updated: `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`; `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts`; `src/services/map/MapEngineAdapter.ts`; `src/features/urbanAnalytics/lib/types.ts`; `src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx`; `e2e/voxcity-real-data.spec.ts`
- User-Facing Surfaces Added or Corrected: Source selection is now explicit in the toolbar, active-source metadata is always visible in-panel, sample mode is clearly labeled instead of silently assumed, published map geometry uses the real source footprints rather than centroid placeholders, and the viewer can hand the active or selected buildings into the sunlight workflow.
- Runtime Truthfulness Improvements: Extrusion runs now persist the source layer or file reference, sample-vs-real mode, feature count, LOD, height-strategy inputs, and geometry assumptions into Completed Run Review and analysis-layer metadata.
- Validation Performed: `npm test -- src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx src/features/urbanAnalytics/voxcity/__tests__/SunlightSimulatorPanel.test.tsx`; `npx playwright test e2e/voxcity-real-data.spec.ts`
- Residual Risks: CityJSON bridging currently derives footprint rectangles from object bounding boxes because the loaded CityJSON scene store does not yet expose ground-surface rings for exact extrusion.
- Follow-Up Required Before Next Prompt: None for Prompt 15 scope beyond any future enhancement to exact CityJSON footprint extraction.
