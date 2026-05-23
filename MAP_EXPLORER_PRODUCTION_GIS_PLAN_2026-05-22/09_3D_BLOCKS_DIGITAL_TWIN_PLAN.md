# 09 - 3D Blocks, Massing, And Urban Digital Twin Plan

Date: 2026-05-22
Status: detailed 3D urban capability plan

## Purpose

This document defines the 3D urban block capabilities that Map Explorer needs to feel like a professional GIS/urban analytics workbench rather than a 2D map with a few extrusions.

Target: a browser-native 3D urban design and spatial intelligence surface for blocks, parcels, zoning envelopes, building massing, CityJSON/3D Tiles, sunlight/shadow, scenario comparison, and Urban Analytics evidence publication.

## 3D Product North Star

The 3D system should answer urban planning questions:

- What is the existing urban form?
- What can be built under current zoning?
- What changes under alternative zoning or design scenarios?
- Which blocks are over/under capacity?
- What are the impacts on sunlight, shadow, open space, density, public realm, visibility, and accessibility?
- Which 3D outputs are evidence-grade, and which are exploratory/demo?

## Core 3D Data Model

### Spatial Entities

| Entity | Geometry | Required Attributes | Optional Attributes |
| --- | --- | --- | --- |
| Block | Polygon/MultiPolygon | `block_id`, area, CRS | district, neighborhood, land-use mix, public realm ratio |
| Parcel | Polygon/MultiPolygon | `parcel_id`, block_id, area, CRS | owner/type, zoning_id, frontage, constraints |
| Building Footprint | Polygon/MultiPolygon | `building_id`, height or floors | use, age, roof type, address, heritage status |
| Building 3D Object | Mesh/CityJSON/MultiPatch-like | object id, source, CRS | LoD, roof geometry, facade tags |
| Zoning Envelope | Extruded polygon/mesh | zoning_id, max height, setbacks, FAR | podium/tower rules, sky exposure plane |
| Massing Alternative | Extruded/mesh | scenario_id, rule set, generated volume | floor count, GFA, FAR, coverage |
| Terrain | Raster/mesh/TIN | source, vertical datum | resolution, no-data, vertical exaggeration |
| Public Realm | Polygon/line/point | type, area/length | tree canopy, sidewalk width, accessibility |
| Sun/Shadow Surface | Polygon/raster/temporal mesh | timestamp, scenario_id | irradiance, shadow duration |

### 3D Source Kinds

- `building-footprint-extrusion`
- `cityjson`
- `3d-tiles`
- `terrain`
- `zoning-envelope`
- `generated-massing`
- `voxel-grid`
- `sun-shadow-result`
- `sample-3d`

Each source must carry:

- source ID
- source kind
- CRS and vertical datum when available
- LoD/geometry detail
- feature/object count
- source provenance
- runtime mode
- QA state
- restore policy

## 3D Runtime Architecture

### Rendering Options

Use a layered strategy:

- MapLibre fill-extrusion for simple 2.5D building footprints.
- deck.gl `PolygonLayer`, `GeoJsonLayer`, `Tile3DLayer`, and custom layers where appropriate.
- React Three Fiber / Three.js for dedicated 3D scene tools, block massing editor, and VoxCity visualizations.
- CityJSON loader and VoxCity bridge already present in `src/features/urbanAnalytics/voxcity/`.

### Scene Types

| Scene Type | Purpose |
| --- | --- |
| 2.5D map | Quick building footprint extrusion in main Map Explorer. |
| 3D scene | Full block/building/massing exploration. |
| Split 2D/3D | Synchronized map and scene for precise spatial context. |
| Scenario compare | Side-by-side or swipe/blend between existing and proposed massing. |
| Analysis overlay scene | Shadow, sunlight, voxel, or simulation overlays on 3D context. |

### Scene State

State should include:

- scene mode
- camera target
- camera pitch/bearing/zoom/distance
- active 3D source IDs
- active scenario ID
- selected block/parcel/building IDs
- visible 3D layers
- terrain enabled
- sunlight timestamp/range
- shadow quality
- clipping/section settings
- vertical exaggeration
- sync with 2D viewport

Recommended store slice:

- `map3dSceneSlice`

## 3D Block Capability Areas

### Capability 1 - Existing Building Extrusion

Inputs:

- Building footprint polygons.
- Height field or floor count field.
- Optional roof/form tags.

Features:

- Pick height/floor field.
- Convert floors to height with user-defined floor height.
- Extrude footprints.
- Style by use, height, age, energy, vulnerability, or QA.
- Select building and inspect attributes.
- Send selected buildings to Urban Analytics or VoxCity.

QA:

- Missing height field.
- Suspect heights.
- Unknown CRS.
- Demo/source caveats.
- Footprints with invalid geometry.

Acceptance:

- Existing building layer can be rendered as 2.5D and referenced by Urban evidence/report.

### Capability 2 - Block And Parcel Model

Inputs:

- Block polygons.
- Parcel polygons.
- Optional street/public realm layers.

Features:

- Block/parcel hierarchy.
- Assign parcels to blocks.
- Compute block area, parcel area, frontage proxies, coverage, open space ratio.
- Block inspector with metrics.
- Select block -> focus Urban method recommendations.
- Export block model as reproducible input.

Metrics:

- block area
- parcel count
- built footprint area
- coverage ratio
- estimated GFA
- existing FAR
- public realm share
- open space share
- population/jobs per hectare if attributes available

Acceptance:

- Blocks become first-class analytical units, not just polygons.

### Capability 3 - Zoning Rule Engine

Inputs:

- Zoning district polygons or parcel zoning attributes.
- Rule table.

Rule fields:

- max height
- max floors
- max FAR
- max lot coverage
- front setback
- side setback
- rear setback
- podium height
- tower floorplate max
- minimum open space
- land use permissions
- parking/loading rules if needed

Features:

- Zoning rule editor.
- Rule assignment to parcels/blocks.
- Rule validation.
- Envelope generation preview.
- Conflict warnings.
- Urban method linkage for policy implementation and intervention design.

Acceptance:

- User can generate zoning envelopes from parcels/blocks and explain which rules produced them.

### Capability 4 - Building Envelope Generation

Inputs:

- Parcel/block geometry.
- Zoning rules.
- CRS execution plan.

Outputs:

- Setback polygon.
- Buildable footprint.
- Extruded envelope.
- Max GFA estimate.
- Coverage/FAR compliance.

Algorithm phases:

1. Validate geometry and CRS.
2. Project to local metric CRS.
3. Apply setbacks/buffers inward.
4. Resolve invalid/empty buildable footprints.
5. Compute allowed area and volume.
6. Extrude to max height/floors.
7. Attach rule provenance.
8. Publish as 3D layer.

QA:

- Operation blocked if no projected CRS.
- Empty buildable area flagged.
- FAR/height conflicts flagged.
- Assumptions recorded.

Acceptance:

- Envelope layer is reproducible and reportable.

### Capability 5 - Massing Generator

Inputs:

- Buildable footprint or block.
- Target FAR/GFA.
- Max height/floor constraints.
- Typology rules.

Typologies:

- perimeter block
- slab
- tower on podium
- courtyard
- row/block infill
- mixed-use podium

Features:

- Generate multiple massing alternatives.
- Parameter sliders:
  - target FAR
  - floor height
  - coverage
  - setbacks
  - tower count
  - podium height
  - open space target
- Real-time preview for small blocks.
- Workerized generation for many parcels.
- Save scenario.

Outputs:

- 3D massing layer.
- Scenario metrics.
- QA/assumption record.
- Urban evidence/report package.

Acceptance:

- User can compare at least two block massing scenarios with metrics and caveats.

### Capability 6 - Sunlight And Shadow Analysis

Existing repo has sunlight/VoxCity components. Production target:

Inputs:

- Existing/proposed 3D building geometry.
- Terrain if available.
- Date/time/time range.
- Location.

Features:

- Time-of-day shadow.
- Seasonal presets.
- Shadow duration per public space/block/building facade.
- Sunlight access score.
- Compare existing vs scenario.
- Export shadow maps and evidence.

Outputs:

- Shadow polygons or raster/texture.
- Building/public-space sunlight metrics.
- Temporal playback.
- Scenario comparison table.

QA:

- Geometry LoD caveat.
- Terrain availability.
- Timezone/location.
- Simulation resolution.
- Sample/demo source.

Acceptance:

- Sun/shadow outputs are explicitly labeled as simulation outputs with assumptions.

### Capability 7 - Scenario Planning

Scenario model:

```ts
interface Urban3DScenario {
  scenarioId: string;
  label: string;
  baselineScenarioId?: string;
  sourceLayerIds: string[];
  blockIds: string[];
  parcelIds: string[];
  zoningRuleSetId: string;
  massingLayerIds: string[];
  analysisLayerIds: string[];
  metrics: Urban3DScenarioMetric[];
  runtimeMode: "live" | "demo" | "synthetic" | "unknown";
  qaState: string;
  manifestId: string;
}
```

Required scenario features:

- Baseline vs proposed.
- Duplicate scenario.
- Change zoning rules.
- Regenerate envelopes/massing.
- Compare metrics.
- Side-by-side 3D view.
- Publish chosen scenario to Urban Analytics.

Metrics:

- total GFA
- FAR
- coverage
- height distribution
- dwelling/job capacity estimate
- open space ratio
- sunlight hours
- shadow impact area
- public realm affected
- accessibility score if linked to network methods
- embodied carbon placeholder only if data exists; otherwise unknown

Acceptance:

- Scenarios are reproducible and can drive Urban Analytics evidence.

### Capability 8 - CityJSON / 3D Tiles / VoxCity Bridge

Existing files:

- `src/features/urbanAnalytics/voxcity/CityJSONLoader.ts`
- `CityJSONViewer.tsx`
- `BuildingViewer.tsx`
- `SunlightSimulatorPanel.tsx`
- `voxCityDataBridge.ts`
- `src/services/map/voxCitySelectionService.ts`

Target work:

- Treat CityJSON as source registry source.
- Link CityJSON objects to 2D footprints where possible.
- Allow selecting 2D building -> focus 3D object.
- Allow selecting 3D object -> focus map feature.
- Publish VoxCity sync evidence with source/runtime/QA.
- Support sample mode only with explicit labels.

Acceptance:

- 2D and 3D selection is synchronized without pretending sample geometry is real.

### Capability 9 - 3D Editing And Measurement

Required tools:

- 3D object select.
- Height edit for generated massing.
- Floor count edit.
- Move/rotate generated object where allowed.
- Section/clipping plane.
- Measure height.
- Measure distance.
- Measure area/volume.
- Inspect envelope violations.

Acceptance:

- Generated 3D geometry can be adjusted while keeping rule/provenance records.

### Capability 10 - 3D Reporting And Export

Outputs:

- 3D scene snapshot.
- Scenario metric table.
- CityJSON export for generated massing where feasible.
- GeoJSON footprints with height attributes.
- GLTF/3D Tiles export only if implementation is feasible and documented.
- PDF report figure with viewpoint, timestamp, CRS, source, runtime mode, QA, and assumptions.

Acceptance:

- A 3D scenario can become an Urban Analytics evidence artifact and report section.

## 3D UI Layout

### Main 3D Scene Workbench

Left rail:

- 3D source tree.
- Scenario list.
- Blocks/parcels/buildings.
- Zoning rule sets.

Center:

- 3D scene.
- 2D/3D split toggle.
- Camera controls.
- Selection overlays.

Right rail:

- Selected object inspector.
- Zoning/massing parameters.
- QA and assumptions.
- Scenario metrics.
- Urban evidence/report actions.

Bottom rail:

- Time slider for sunlight/shadow.
- Scenario compare controls.
- Processing queue.

## 3D Processing Toolbox

Tools:

- Extrude footprints.
- Generate zoning envelope.
- Generate buildable area from setbacks.
- Generate block massing alternatives.
- Calculate FAR/coverage/GFA.
- Compare scenarios.
- Sunlight simulation.
- Shadow duration.
- View corridor/viewshed.
- Export CityJSON-like model.
- Sync 2D/3D selection.

## 3D Implementation Phases

### 3D Phase A - 3D Data Contracts

- Add 3D source/layer metadata.
- Define block/parcel/building/scenario types.
- Add source registry support for 3D sources.
- Add tests for metadata and runtime mode.

### 3D Phase B - Existing Building Extrusion Workbench

- Height/floor field picker.
- 2.5D extrusion.
- Building inspector.
- Selection sync.
- Report/evidence references.

### 3D Phase C - Blocks, Parcels, And Zoning

- Block/parcel model.
- Zoning rule table.
- Envelope generation.
- CRS preflight.
- Metrics.

### 3D Phase D - Massing And Scenarios

- Massing generator.
- Scenario manager.
- Metrics comparison.
- Side-by-side view.

### 3D Phase E - Environmental Simulation

- Sun/shadow simulation integration.
- Temporal playback.
- Public realm impact metrics.
- QA/assumption reporting.

### 3D Phase F - Digital Twin Publication

- 3D report composer.
- Urban evidence publication.
- Reproducible scenario package.
- Export formats.

## 3D Acceptance Definition

The 3D block system is production-grade only when:

- Every 3D object has a source, runtime mode, CRS/vertical assumptions, and QA.
- Zoning/massing outputs are reproducible from rules and input geometry.
- Metric calculations use suitable projected CRS.
- Sun/shadow outputs expose simulation assumptions.
- Scenario outputs can be compared, reported, and published to Urban Analytics.
- Demo/sample geometry remains visibly labeled.

