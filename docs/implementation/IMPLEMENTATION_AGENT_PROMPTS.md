# Urban Analytics Workbench — Sequential Implementation Agent Prompts

> **Purpose**: World-class, scientifically rigorous urban analytics IDE built on SynapseIDE architecture  
> **Total Prompts**: 42 sequential agent prompts across 10 phases  
> **Principle**: Each prompt is self-contained, references exact files, produces verifiable output  
> **Execution Rule**: Execute prompts in strict order. Each prompt's output is a prerequisite for subsequent prompts.

---

## Phase 0 — Environment & Dependencies (Prompts 1–3)

> **Goal**: Install all dependencies, configure environment, prepare project scaffolding.  
> **Prerequisite**: Existing SynapseIDE codebase with psychiatry module intact.  
> **Outcome**: All npm packages installed, Python environment ready, project compiles.

---

### PROMPT 1 — Install NPM Dependencies & Configure TypeScript

```
You are transforming the SynapseIDE application from a psychiatry tool into a world-class urban analytics workbench. This is prompt 1 of 42.

TASK: Install all required NPM dependencies for GIS, mapping, 3D, data processing, and Google Maps.

STEP 1: Add the following to package.json "dependencies":
  "@vis.gl/react-google-maps": "^1.5.0",
  "@googlemaps/js-api-loader": "^1.16.8",
  "@googlemaps/markerclusterer": "^2.5.3",
  "@deck.gl/google-maps": "^9.1.0",
  "deck.gl": "^9.1.0",
  "@deck.gl/react": "^9.1.0",
  "@deck.gl/layers": "^9.1.0",
  "@deck.gl/geo-layers": "^9.1.0",
  "@deck.gl/mesh-layers": "^9.1.0",
  "@deck.gl/aggregation-layers": "^9.1.0",
  "@loaders.gl/core": "^4.3.0",
  "@loaders.gl/csv": "^4.3.0",
  "@loaders.gl/json": "^4.3.0",
  "@loaders.gl/shapefile": "^4.3.0",
  "@loaders.gl/geopackage": "^4.3.0",
  "@loaders.gl/las": "^4.3.0",
  "@loaders.gl/3d-tiles": "^4.3.0",
  "@loaders.gl/netcdf": "^4.3.0",
  "@loaders.gl/wms": "^4.3.0",
  "mapbox-gl": "^3.9.0",
  "react-map-gl": "^7.1.8",
  "@turf/turf": "^7.2.0",
  "proj4": "^2.15.0",
  "supercluster": "^8.0.1",
  "geotiff": "^2.1.3",
  "flatgeobuf": "^3.35.0",
  "pmtiles": "^4.2.0",
  "h3-js": "^4.2.1",
  "s2-geometry": "^1.2.0",
  "shpjs": "^6.1.0",
  "parquet-wasm": "^0.6.1",
  "geos-wasm": "^2.0.0",
  "gdal3.js": "^2.8.0",
  "@react-three/fiber": "^8.18.0",
  "@react-three/drei": "^9.121.0",
  "@react-three/postprocessing": "^2.16.0",
  "three-csg-ts": "^3.2.0",
  "potree-core": "^2.0.0",
  "arquero": "^5.4.1",
  "d3-scale-chromatic": "^3.1.0",
  "d3-scale": "^4.0.2",
  "d3-array": "^3.2.4",
  "d3-geo": "^3.1.0",
  "d3-geo-voronoi": "^2.0.2",
  "d3-delaunay": "^6.0.4",
  "d3-contour": "^4.0.2",
  "d3-hexbin": "^0.2.2",
  "papaparse": "^5.5.2",
  "simple-statistics": "^7.8.8",
  "ml-matrix": "^6.12.0",
  "rbush": "^4.0.1",
  "mqtt": "^5.10.0",
  "protobufjs": "^7.4.0",
  "plotly.js-dist-min": "^2.35.0",
  "react-plotly.js": "^2.6.0"

STEP 2: Add to "devDependencies":
  "@types/geojson": "^7946.0.14",
  "@types/google.maps": "^3.58.0",
  "@types/proj4": "^2.5.5",
  "@types/supercluster": "^7.1.3",
  "@types/d3-scale": "^4.0.8",
  "@types/d3-scale-chromatic": "^3.1.0",
  "@types/d3-array": "^3.2.1",
  "@types/d3-geo": "^3.1.0",
  "@types/d3-contour": "^3.0.6",
  "@types/d3-hexbin": "^0.2.5",
  "@types/d3-delaunay": "^6.0.4",
  "@types/papaparse": "^5.3.15",
  "@types/rbush": "^4.0.0"

STEP 3: Run `npm install`

STEP 4: Verify the project compiles with `npm run build` (or `npx tsc --noEmit`). Fix any type resolution issues.

STEP 5: In tsconfig.app.json, ensure compilerOptions includes:
  "resolveJsonModule": true,
  "allowSyntheticDefaultImports": true

Do NOT modify any source files yet. Only package.json and tsconfig.

VERIFY: `npm run dev` starts without errors.
```

---

### PROMPT 2 — Create Python Environment

```
You are building the Python backend environment for the Urban Analytics Workbench. Prompt 2 of 42.

TASK: Create the Python environment specification files at the project root.

STEP 1: Create `environment.yml` at project root with this exact content:

name: urban-analytics
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.11
  - geopandas>=1.0
  - shapely>=2.0
  - fiona>=1.10
  - pyproj>=3.7
  - rasterio>=1.4
  - rasterstats>=0.20
  - xarray>=2024.1
  - dask-geopandas>=0.4
  - osmnx>=2.0
  - networkx>=3.4
  - pandana>=0.7
  - momepy>=0.9
  - rioxarray>=0.17
  - earthengine-api>=1.4
  - scikit-image>=0.24
  - libpysal>=4.12
  - esda>=2.6
  - spreg>=1.7
  - splot>=1.1
  - pointpats>=2.4
  - tobler>=0.12
  - mapclassify>=2.8
  - scikit-learn>=1.5
  - xgboost>=2.1
  - statsmodels>=0.14
  - matplotlib>=3.9
  - folium>=0.18
  - plotly>=5.24
  - pydeck>=0.9
  - contextily>=1.6
  - datashader>=0.16
  - pandas>=2.2
  - polars>=1.9
  - duckdb>=1.1
  - h3-py>=4.1
  - geopy>=2.4
  - mesa>=3.1
  - jupyterlab>=4.3
  - ipykernel>=6.29
  - pip:
    - pystac-client>=0.8
    - urbanaccess>=0.3
    - voxcity>=0.2
    - gtfs-kit>=7.0
    - overpy>=0.7
    - cenpy>=1.0
    - wbgapi>=1.0
    - verde>=1.8
    - spectral>=0.23

STEP 2: Create `requirements.txt` at project root as a pip-only fallback with the same packages.

STEP 3: If .venv exists, activate it and install the core packages:
  pip install geopandas shapely pyproj rasterio osmnx networkx pandana momepy xarray folium plotly pydeck duckdb h3

Do NOT modify any TypeScript/React files.

VERIFY: `python -c "import geopandas; print(geopandas.__version__)"` succeeds.
```

---

### PROMPT 3 — Create Directory Scaffolding

```
You are creating the directory structure for the Urban Analytics Workbench. Prompt 3 of 42.

TASK: Create all empty directories and placeholder index files that will be populated in subsequent prompts.

Create these directories (each with an empty index.ts exporting {}):

src/features/urbanAnalytics/
src/features/urbanAnalytics/lib/
src/features/urbanAnalytics/rail/
src/features/urbanAnalytics/seeds/
src/features/urbanAnalytics/calculators/
src/features/urbanAnalytics/voxcity/
src/features/urbanAnalytics/python/
src/features/urbanAnalytics/python/templates/
src/components/map/
src/components/map/hooks/
src/components/map/layers/
src/components/map/utils/
src/components/map/google/
src/components/map/google/hooks/
src/components/map/google/layers/
src/components/map/google/utils/
src/engine/gpu/
src/engine/gpu/shaders/
src/engine/gpu/buffers/
src/engine/gpu/pipelines/
src/engine/wasm/
src/engine/wasm/workers/
src/engine/carto/
src/engine/streaming/
src/engine/streaming/hooks/
src/engine/streaming/connectors/
src/engine/geoai/
src/engine/geoai/models/
src/engine/geoai/cv/
src/engine/geoai/nlp/
src/engine/geoai/hooks/
src/engine/network/
src/engine/spatial-db/
src/locales/urban/
src/utils/geo/

Each directory should have an `index.ts` file with:
  // Urban Analytics Workbench — [directory purpose]
  export {};

VERIFY: Project still compiles. No existing files modified.
```

---

## Phase 1 — Core Type System & Domain Model (Prompts 4–6)

> **Goal**: Define all TypeScript types, interfaces, enums for the urban analytics domain.  
> **Prerequisite**: Phase 0 complete, all directories exist.  
> **Outcome**: Full type system that all subsequent code depends on.

---

### PROMPT 4 — Core Urban Analytics Types

```
You are defining the core type system for the Urban Analytics Workbench. Prompt 4 of 42.

TASK: Create `src/features/urbanAnalytics/lib/types.ts` with the complete urban analytics type system.

This file must define ALL of the following types and interfaces:

1. StudyArea — id, name, description, bbox (BoundingBox = [west,south,east,north]), geometry (GeoJSON.Geometry optional), crs (CoordinateReferenceSystem), scale (UrbanScale), tags (UrbanTag[]), datasets (DatasetRef[]), sessions (AnalysisSession[]), indicators (IndicatorResult[] optional), tasks (UrbanTask[] optional), createdAt, updatedAt

2. UrbanScale — union type: 'parcel' | 'block' | 'neighborhood' | 'district' | 'city' | 'metropolitan' | 'regional' | 'national'

3. CoordinateReferenceSystem — 'EPSG:4326' | 'EPSG:3857' | string

4. AnalysisSession — id, when, type (SessionType), noteSlots (SessionNoteSlots), datasets, completedFlows, completedRuns, snapshots, sessionMsTotal

5. SessionType — 'baseline' | 'field_survey' | 'desk_study' | 'stakeholder' | 'scenario_modeling' | 'monitoring' | 'reporting'

6. SessionNoteSlots — objective, methodology, findings, recommendations, dataRefs, limitations (all string)

7. DatasetRef — id, name, source (DataSource), format (GeoDataFormat), layers, temporalExtent, spatialResolution, crs, license, url

8. DataSource — union of 'osm' | 'census' | 'sentinel' | 'landsat' | 'gtfs' | 'iot_sensor' | 'lidar' | 'cadastral' | 'field_survey' | 'model_output' | 'voxcity' | 'google_maps' | 'custom'

9. GeoDataFormat — union of all geo formats: 'geojson' | 'shapefile' | 'geopackage' | 'geotiff' | 'csv' | 'parquet' | 'netcdf' | 'las' | 'laz' | 'pbf' | 'mbtiles' | 'pmtiles' | 'cog' | 'gtfs' | 'osm_pbf' | 'cityjson' | 'ifc' | '3dtiles'

10. UrbanTag — union with ~60 tags across thematic domains (mobility, land_use, climate, equity, health...) and methods (network_analysis, spatial_stats, remote_sensing, machine_learning...)

11. IndicatorResult — id, kind (UrbanIndicatorKind), when, value, unit, geometry, metadata

12. UrbanIndicatorKind — union of ~50 indicator types across morphology (FAR, GSI, OSR, MXI, BCR...), accessibility (walk_score, transit_score, isochrone_area, gravity_accessibility...), environment (NDVI, NDBI, LST, UHI_intensity, tree_canopy_pct...), socioeconomic (pop_density, gini_coefficient, shannon_entropy...), resilience (flood_exposure, social_vulnerability_index...), SDG (sdg_11_1_1 through sdg_11_7_1)

13. SectionId — union of all section identifiers: 'all' | 'project_scoping' | 'baseline_assessment' | 'urban_indicators' | 'kpi_dashboard' | 'vulnerability' | 'rapid_assessment' | 'typology' | 'intervention_design' | 'policy_instruments' | 'implementation' | 'change_detection' | 'monitoring_eval' | 'reports_briefs' | 'neighborhood_analysis' | 'regional_analysis' | 'transport_networks' | 'gis_methods' | 'remote_sensing' | 'data_engineering' | 'stakeholder_engagement' | 'handouts'

14. Card — id, title, sectionId, summary, tags, examples, evidence, prompts, datasets, tools, methodology, limitations, sdgAlignment

15. CompletedAnalysisRun — runId, flowId (AnalyticalFlowId), label, insertedAt, paragraph, paragraphPreview, paragraphFull, mapOutputs (MapOutput[]), chartOutputs (ChartOutput[]), dataOutputs (DataOutput[])

16. MapOutput — id, type (choropleth|heatmap|isochrone|point_cluster|flow_map|3d_scene), geojson, style, title

17. ChartOutput — id, type (bar|line|scatter|radar|histogram|boxplot|treemap), data, title

18. DataOutput — id, format, rows, columns, preview

19. AnalyticalFlowId — union: 'site_suitability' | 'accessibility' | 'vulnerability' | 'indicator_composite' | 'scenario_comparison' | 'equity_audit' | 'change_detection' | 'walkability' | 'fifteen_min_city' | 'urban_morphology' | 'transit_gap' | 'heat_island' | 'green_deficit' | 'review'

20. SessionFlags — dataQualityAlert, crsInconsistency, temporalMismatch, coverageGap, stakeholderFeedbackPending, deadlineApproaching, indicatorOutOfRange, validationRequired, dataSensitivity, ethicsApprovalNeeded

21. BoundingBox = [number, number, number, number]  // [west, south, east, north]

22. UrbanTask — id, title, status ('todo'|'in_progress'|'done'|'blocked'), priority, dueDate, assignee, relatedFlowId, notes

Use proper JSDoc comments for each interface and type. Import GeoJSON types from the @types/geojson package.

VERIFY: File compiles with no errors. Run `npx tsc --noEmit`.
```

---

### PROMPT 5 — Section Hierarchy & Tag Groups

```
You are defining the navigation structure for the Urban Analytics Workbench. Prompt 5 of 42.

TASK: Create two files:

FILE 1: `src/features/urbanAnalytics/lib/sectionHierarchy.ts`

Export a SECTION_TREE array of SectionTreeNode objects with this hierarchy:

Group "Project Scoping & Data":
  - project_scoping: "Study Area Definition"
  - data_engineering: "Data Acquisition & ETL"  
  - baseline_assessment: "Baseline Conditions"

Group "Spatial Analysis & Metrics":
  - urban_indicators: "Urban Indicators & Indices"
  - gis_methods: "GIS & Spatial Operations"
  - spatial_stats: "Spatial Statistics"
  - remote_sensing: "Remote Sensing & EO"
  - transport_networks: "Network & Mobility Analysis"

Group "Vulnerability & Risk":
  - rapid_assessment: "Rapid Urban Assessment"
  - vulnerability: "Multi-Hazard Vulnerability"

Group "Classification & Typology":
  - typology: "Urban Form Classification"

Group "Intervention & Scenarios":
  - intervention_design: "Planning Interventions"
  - policy_instruments: "Policy & Regulatory Tools"
  - implementation: "Implementation Specs"

Group "Monitoring & Reporting":
  - change_detection: "Change Detection & Temporal"
  - kpi_dashboard: "KPI Dashboard & Benchmarking"
  - monitoring_eval: "M&E Frameworks"
  - reports_briefs: "Reports & Policy Briefs"

Group "Thematic Deep-Dives":
  - neighborhood_analysis: "Neighborhood Scale"
  - regional_analysis: "Metropolitan & Regional"
  - stakeholder_engagement: "Participation & Engagement"

Group "3D & Simulation":
  - voxcity: "VoxCity 3D Environment"
  - simulation: "ABM & Microsimulation"

Also export:
- A SECTION_INDEX Map<string, SectionTreeNode> for O(1) lookups
- A resolveSectionFilter(sectionId: string) function returning an array of matching section IDs (including children of a group)
- Types: SectionTreeNode { id: string; label: string; children?: SectionTreeNode[] }

FILE 2: `src/features/urbanAnalytics/lib/tagGroups.ts`

Export TAG_GROUPS organized by category:
- Mobility: mobility, transit, pedestrian, cycling
- Land Use: land_use, zoning, density, sprawl
- Green Infrastructure: green_infra, uli, canopy, biodiversity
- Climate: climate, heat_island, flood, air_quality
- Equity: equity, gentrification, displacement, segregation
- Housing: housing, affordability, vacancy
- Economic: economic, employment, retail, innovation
- Health: health, noise, safety, crime
- Infrastructure: water, energy, waste, circular
- Heritage: heritage, tourism, placemaking
- Governance: governance, participation, sdg
- Methods: network_analysis, spatial_stats, remote_sensing, agent_based, cellular_automata, machine_learning, voxcity, 3d_modeling, point_cloud

Export a flatTags() function returning all tags as a flat UrbanTag[].

Import UrbanTag from ./types.

VERIFY: Both files compile. Import them in a test and confirm SECTION_TREE has 8 groups with correct children.
```

---

### PROMPT 6 — Urban Analytics Icons

```
You are creating the icon set for the Urban Analytics Workbench. Prompt 6 of 42.

TASK: Create `src/features/urbanAnalytics/icons.tsx`

Create React SVG icon components matching the pattern in the existing `src/features/psychiatry/icons.tsx`. Use the same component signature (React.FC with className? and size? props).

Create these icons as clean SVG components:
- IconMap (map pin / folded map)
- IconLayers (stacked layers)
- IconBuilding (city building)
- IconTree (tree / park)
- IconRoute (route / path)
- IconChart (bar chart)
- IconSatellite (satellite / orbit)
- IconGrid (hex grid / voxel)
- IconCompass (compass rose)
- IconMeasure (ruler / measure tool)
- IconFlood (wave / water)
- IconSun (sun / solar)
- IconWind (wind lines)
- IconPeople (people / community)
- IconDataset (database / table)
- IconCalculator (calculator)
- IconReport (document)
- IconPython (snake / code)
- IconGlobe (globe / earth)
- IconAnalytics (trend line + magnifying glass)
- IconSend (reuse from existing)
- IconCode (reuse from existing)
- IconCopy (reuse from existing)
- IconPrint (reuse from existing)

Each icon should be 24×24 viewBox, stroke-based (currentColor), 1.5-2px stroke width, clean geometric style matching the charcoal-amber design system.

VERIFY: All icons render without error. Import and render each one in a test.
```

---

## Phase 2 — Store & State Management (Prompts 7–9)

> **Goal**: Create Zustand stores for urban analytics domain state.  
> **Prerequisite**: Phase 1 types complete.  
> **Outcome**: All state management ready, project data can be stored and retrieved.

---

### PROMPT 7 — Urban Analytics Zustand Store

```
You are creating the core Zustand store for the Urban Analytics Workbench. Prompt 7 of 42.

TASK: Create `src/features/urbanAnalytics/store.ts`

This store MUST follow the exact same pattern as `src/features/psychiatry/store.ts` which uses:
- `create` from 'zustand'
- A library of cards (NavCardLite[]) that can be set via __setUrbanLibrary()
- A parseQuery() function splitting search text into tokens
- A filterCards() function accepting FilterInput { library, section, tokens, tags, favOnly, favorites }
- A main store with state: { query, section, activeTags, favOnly, favorites, selectedCardId, isOpen, drawerWidth }
- Actions: setQuery, setSection, toggleTag, clearTags, toggleFav, toggleFavOnly, selectCard, clearSelection, open, close, setDrawerWidth

DIFFERENCES from psychiatry store:
- Import types from './lib/types' (Card, SectionId, UrbanTag)
- Import { resolveSectionFilter, SECTION_INDEX } from './lib/sectionHierarchy'
- The section type is SectionId (not the psychiatric section type)
- Tags are UrbanTag (not psychiatric tags)
- Export the store as useUrbanStore
- Export a __setUrbanLibrary function
- Export a useSelectedCardId selector
- Export a selectSelectedCard selector

Follow the same code structure, naming convention, and patterns. Study the existing psychiatry store carefully and mirror it.

VERIFY: Store compiles, can be imported, and useUrbanStore() returns expected state shape.
```

---

### PROMPT 8 — Project Registry State (replaces Patient Registry)

```
You are creating the project registry state for the Urban Analytics Workbench. Prompt 8 of 42.

TASK: Modify/create the following:

FILE 1: `src/stores/useNewProjectDraftStore.ts` (NEW, replaces useNewPatientDraftStore)

Study the existing `src/stores/useNewPatientDraftStore.ts` and replicate its Zustand pattern but for urban projects:

State:
  - name: string (project name)
  - description: string
  - scale: UrbanScale (default 'city')
  - bbox: BoundingBox | null
  - crs: string (default 'EPSG:4326')
  - tags: UrbanTag[]
  - geometry: GeoJSON.Geometry | null
  - isDirty: boolean

Actions:
  - setName, setDescription, setScale, setBbox, setCrs, addTag, removeTag, setGeometry
  - reset() — clear all fields
  - toDraft() — return a Partial<StudyArea> for creation

FILE 2: Update `src/centerpanel/registry/types.ts`

Study the existing registry types. Create equivalent types for urban projects:
- ProjectRecord (replaces PatientRecord) — id, name, description, scale, area_km2, bbox, crs, tags, priority (1-5), climateVulnerability, dataCompleteness, sessions count, lastSessionDate, indicators (IndicatorResult[])
- SessionRecord (replaces EncounterRecord) — id, type (SessionType), date, datasetsUsed, methodsApplied, indicator results
- ProjectListItem — summary view for the list

FILE 3: Update `src/centerpanel/registry/state.ts`

Study the existing registry state provider. Create the urban analytics equivalent:
- RegistryProvider context with projects list, selectedProject, CRUD operations
- ensureSeed() function that creates sample demo projects:
  - "Barcelona Superblocks Study" (neighborhood scale, mobility + equity + green_infra)
  - "Istanbul Seismic Vulnerability" (city scale, vulnerability + housing)
  - "Tokyo 15-Minute City" (metropolitan scale, accessibility + transit)

Import types from '@/features/urbanAnalytics/lib/types'.

VERIFY: Stores compile. Demo projects can be created via ensureSeed().
```

---

### PROMPT 9 — Additional Urban Stores

```
You are updating secondary stores for the Urban Analytics Workbench. Prompt 9 of 42.

TASK: Update these existing stores to support urban analytics context:

FILE 1: Update `src/stores/useCalcStore.ts`
- This store manages calculator state. Keep the same Zustand pattern.
- Replace any psychiatric calculator references with urban indicator references.
- State should track: activeCalculator (UrbanIndicatorKind | null), inputValues (Record<string, number>), results (IndicatorResult[]), history (IndicatorResult[])
- Actions: setCalculator, setInput, compute, clearResults, addToHistory

FILE 2: Update `src/stores/useFlowStore.ts`
- Keep the same Zustand pattern.
- Replace clinical flow IDs with AnalyticalFlowId from types.ts
- State: activeFlow (AnalyticalFlowId | null), currentStep, stepData, completedRuns
- Actions: startFlow, nextStep, prevStep, setStepData, completeFlow, cancelFlow

FILE 3: Update `src/stores/useNoteStore.ts`
- Keep the same Zustand pattern.
- Replace clinical note slots with SessionNoteSlots: objective, methodology, findings, recommendations, dataRefs, limitations
- State: activeNote, noteContent (SessionNoteSlots), autosaveEnabled, lastSaved
- Actions: setSlot, clearNote, save, loadNote

FILE 4: Update `src/stores/useAccessStore.ts`
- Keep the same Zustand pattern.
- Replace any psychiatric-specific access levels with urban analytics roles:
  - 'analyst' | 'planner' | 'researcher' | 'stakeholder' | 'admin'

Do NOT break the existing store patterns. Mirror the Zustand + immer + persist middleware patterns already used.

VERIFY: All stores compile. Import each and verify state shape.
```

---

## Phase 3 — Modal & Navigation Shell (Prompts 10–14)

> **Goal**: Replace PsychiatryModal with UrbanAnalyticsModal, update center panel tabs.  
> **Prerequisite**: Phases 0-2 complete (types, stores, icons all exist).  
> **Outcome**: The app opens with urban analytics UI instead of psychiatry.

---

### PROMPT 10 — Urban Analytics Modal (Main Container)

```
You are creating the main Urban Analytics Modal. Prompt 10 of 42.

TASK: Create `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`

This is the MOST CRITICAL file. Study `src/features/psychiatry/PsychiatryModal.tsx` thoroughly and replicate its exact architecture with urban analytics content.

The modal has 3 panels:
1. LEFT RAIL: Section navigation (RailContainer) — search, section tree, tag filter
2. CENTER: Card list — filtered by section/search/tags
3. RIGHT: Card detail view (RightPanelBoundary) — selected card's full content

KEY STEPS:
1. Import useUrbanStore, __setUrbanLibrary from './store'
2. Import SECTION_TREE from './lib/sectionHierarchy'
3. Import RailContainer from './rail/RailContainer'
4. Import all seed builders (these will be created in Phase 4, for now import them as stubs that return empty arrays)
5. Build MERGED_LIBRARY by calling each seed builder and merging results
6. Call __setUrbanLibrary(MERGED_LIBRARY) on mount
7. Use the same portal rendering pattern (createPortal to document.body)
8. Use the same keyboard handlers (Escape to close, etc.)
9. Use the same drawer pattern for the right panel
10. Replace the TopHeader with urban analytics title/icon
11. Replace CenterPanelShell with the same component (it will be updated in Prompt 13)

For the right panel, import RightPanelBoundary lazily (will be created in Prompt 12).

Maintain the EXACT same layout: header + 3-column flex + footer. Same CSS class patterns. Same open/close animation.

IMPORTANT: For NOW, create stub seed builders that return empty arrays:
  src/features/urbanAnalytics/seeds/index.ts — export all builders as named exports returning Card[]

VERIFY: Modal renders without crashing when opened. It shows an empty card list.
```

---

### PROMPT 11 — Rail Container (Left Sidebar Navigation)

```
You are creating the left rail navigation for the Urban Analytics Workbench. Prompt 11 of 42.

TASK: Create `src/features/urbanAnalytics/rail/RailContainer.tsx`

Study `src/features/psychiatry/rail/RailContainer.tsx` and replicate its pattern with urban analytics content.

The rail must have:
1. SEARCH BAR — text input that calls useUrbanStore.setQuery()
2. SECTION TREE — render SECTION_TREE as collapsible groups
   - Each group header is clickable (sets section filter)
   - Each child is clickable (sets section filter to that specific section)
   - Active section highlighted
3. TAG FILTER — grid of tag pills from TAG_GROUPS
   - Click to toggle tag filter
   - Active tags highlighted
   - "Clear all" button
4. FAVORITES TOGGLE — toggle favOnly filter

Import from:
- useUrbanStore from '../store'
- SECTION_TREE from '../lib/sectionHierarchy'
- TAG_GROUPS from '../lib/tagGroups'
- Icons from '../icons'

Use the same CSS module pattern. Create `src/features/urbanAnalytics/rail/rail.css` with styles matching the existing psychiatry rail CSS but with urban-themed colors (blue-green accent instead of purple).

VERIFY: Rail renders with all sections and tags. Clicking filters updates the store state.
```

---

### PROMPT 12 — Right Panel Registry & Content Display

```
You are creating the right panel content system for the Urban Analytics Workbench. Prompt 12 of 42.

TASK: Create these files:

FILE 1: `src/features/urbanAnalytics/rightPanelRegistry.ts`

Study `src/features/psychiatry/rightPanelRegistry.ts` and replicate the hierarchical registry pattern.

Export RIGHT_PANEL_REGISTRY as a nested object mapping:
  Group label → { Section label → Card[] }

Structure:
  "Project Scoping & Data" → { "Study Area Definition" → [], "Data Acquisition & ETL" → [], "Baseline Conditions" → [] }
  "Spatial Analysis & Metrics" → { "Urban Indicators & Indices" → [], ... }
  "Vulnerability & Risk" → { ... }
  "Classification & Typology" → { ... }
  "Intervention & Scenarios" → { ... }
  "Monitoring & Reporting" → { ... }
  "3D & Simulation" → { ... }

For now, card arrays are empty — they'll be populated by seed files in Phase 4.

FILE 2: `src/features/urbanAnalytics/RightPanelFourBlock.tsx`

Study `src/features/psychiatry/RightPanelFourBlock.tsx` and replicate its layout:
- Card header with title, tags, SDG alignment badges
- Card body with: summary, methodology, datasets, tools, evidence
- Action buttons: Add to Report, Run Calculator, Generate Code, Copy
- The four-block layout for structured content display

Replace clinical content slots with urban analytics slots:
- "Methodology" instead of "Clinical Approach"
- "Data Requirements" instead of "Assessment Tools"
- "Python Code" instead of "Treatment Protocol"
- "References" instead of "Evidence Base"

FILE 3: `src/features/urbanAnalytics/rightPanelTypes.ts`
FILE 4: `src/features/urbanAnalytics/rightPanelUtils.ts`

Mirror the psychiatry equivalents with urban analytics types.

VERIFY: Right panel renders when a card is selected. Shows structured content blocks.
```

---

### PROMPT 13 — Update Center Panel Shell

```
You are updating the Center Panel Shell for the Urban Analytics Workbench. Prompt 13 of 42.

TASK: Modify `src/centerpanel/CenterPanelShell.tsx`

CHANGES:

1. Rename tabs:
   OLD: "Registry" | "New Patient" | "Guide" | "Note" | "Flows" | "Tools"
   NEW: "Projects" | "New Project" | "Methods" | "Report" | "Workflows" | "Toolbox"

2. Update the TABS array and Tab type accordingly.

3. Replace imports:
   - useNewPatientDraftStore → useNewProjectDraftStore
   - NewPatientPage → NewProjectPage (create as stub component for now)
   - GuideView → MethodsView (create as stub component for now)

4. Keep all other infrastructure: SessionPersistence, TimerProvider, TimerModal, TopHeader, FlowHost, FlowsRail, Note, RegistryProvider.

5. The "Projects" tab renders RegistryLeft + RegistryMain (these will be updated in Phase 6).
6. The "New Project" tab renders NewProjectPage with DraftSnapshotCard.
7. The "Methods" tab renders MethodsView (urban methodology guides).
8. The "Report" tab renders Note (NoteRail).
9. The "Workflows" tab renders FlowHost + FlowsRail.
10. The "Toolbox" tab renders ToolsPatientList → rename to ToolsProjectList + ToolsActionPanel.

Create stub components for items that don't exist yet:
- src/centerpanel/registry-ui/NewProjectPage.tsx (placeholder with "New Project" text)
- src/centerpanel/Guide/MethodsView.tsx (placeholder with "Methods" text)

VERIFY: Center panel renders with all 6 tabs. Clicking each tab shows the correct content area.
```

---

### PROMPT 14 — Update App.tsx Entry Point

```
You are wiring everything together in the main App entry point. Prompt 14 of 42.

TASK: Modify `src/App.tsx`

CHANGES:

1. Replace import:
   OLD: import PsychiatryModal from '@/features/psychiatry/PsychiatryModal'
   NEW: import UrbanAnalyticsModal from '@/features/urbanAnalytics/UrbanAnalyticsModal'

2. Replace all PsychiatryModal usages with UrbanAnalyticsModal.

3. Update WelcomeModal content (if it has psychiatry-specific text):
   - Title: "Urban Analytics Workbench"
   - Subtitle: "Spatial Intelligence Platform for Urban Scientists & Planners"
   - Description: Reference GIS, mapping, VoxCity, Python analysis capabilities

4. Keep all other app structure EXACTLY the same:
   - ThemeProvider, AppThemeProvider, GlobalStyles
   - BrowserRouter
   - EnhancedIDE, FileExplorer, StatusBar
   - ErrorBoundary
   - AI Assistant sidebar
   - View state management (homepage, demo, ide, fileexplorer, clinician→analyst, test)

5. Rename the 'clinician' view to 'analyst' in the view state type.

6. Update document title to "Urban Analytics Workbench".

VERIFY: App loads. UrbanAnalyticsModal opens. Center panel shows correct tabs. No console errors.
```

---

## Phase 4 — Seed Content (Prompts 15–21)

> **Goal**: Populate the urban analytics card library with expert content.  
> **Prerequisite**: Phase 3 complete (modal, rail, stores all working).  
> **Outcome**: Rich library of 150+ cards across all urban analytics domains.

---

### PROMPT 15 — Project Scoping & Baseline Seeds

```
You are populating the project scoping seed cards. Prompt 15 of 42.

TASK: Create `src/features/urbanAnalytics/seeds/projectScoping.ts`

Export function buildProjectScopingCards(existing?: Set<string>): Card[]

Create 10-15 cards covering:

1. "Study Area Definition" — How to define and bound a study area. Discusses bounding box vs administrative boundary vs custom polygon. Mentions GADM, OSM admin boundaries, census tracts.

2. "Scale Selection Guide" — When to use parcel/block/neighborhood/city/metropolitan scale. Scientific justification for MAUP (Modifiable Areal Unit Problem, Openshaw 1984).

3. "Data Inventory Checklist" — Systematic data requirements assessment. Categories: spatial, demographic, economic, environmental, transport, infrastructure. Data quality dimensions: completeness, positional accuracy, temporal currency, logical consistency.

4. "Baseline Conditions Report Template" — Structured template for documenting existing urban conditions. Sections: physical, demographic, economic, environmental, transport, governance.

5. "Coordinate Reference System Guide" — When to use WGS84 vs UTM vs local projections. Area calculations require equal-area CRS. Distance calculations require equidistant CRS.

6. "OpenStreetMap Data Extraction" — How to use Overpass API, osmium, osmnx to extract building footprints, road networks, POIs, land use polygons.

7. "Census Data Integration" — US ACS, EU Eurostat, UN population data. Areal interpolation methods (Tobler, dasymetric) when census boundaries don't match study area.

8. "Satellite Imagery Selection" — Sentinel-2 (10m, 5-day revisit), Landsat-8/9 (30m, 16-day), Planet (3m, daily), Maxar (30cm). Selection based on resolution, spectral bands, temporal coverage, cost.

9. "GTFS Transit Data" — How to acquire, validate (gtfs-kit), parse, and network-build from General Transit Feed Specification data.

10. "Field Survey Design" — Sampling strategies (random, stratified, cluster, systematic), sample size calculations, survey instrument design for urban audit.

Each card MUST have: id, title, sectionId, summary (2-3 sentences), tags (UrbanTag[]), methodology (step-by-step), limitations, sdgAlignment where applicable.

VERIFY: Function returns array of well-formed Card objects. Each card has unique id.
```

---

### PROMPT 16 — Urban Indicators & Metrics Seeds

```
You are populating urban indicator seed cards. Prompt 16 of 42.

TASK: Create `src/features/urbanAnalytics/seeds/urbanIndicators.ts`

Export function buildUrbanIndicatorCards(existing?: Set<string>): Card[]

Create 15-20 cards covering ALL major urban indicators:

MORPHOLOGY GROUP:
1. "Floor Area Ratio (FAR)" — FAR = total floor area / lot area. Bands: <0.5 low, 0.5-1.5 medium, >3 very high. References: Berghauser Pont & Haupt (2010) Spacematrix.
2. "Ground Space Index (GSI)" — GSI = building footprint / lot area. Urban fabric characterization.
3. "Mixed-Use Index (Shannon Entropy)" — H = -Σ(pi × ln(pi)), normalized to [0,1]. Measures land-use diversity.
4. "Street Connectivity Metrics" — Alpha (circuit), Beta (link/node), Gamma (max connectivity), Intersection density, Connected Node Ratio.

ACCESSIBILITY GROUP:
5. "Walk Score Calculator" — 9 amenity categories, network-based distance decay. Bands: 0-24 car-dependent to 90-100 walker's paradise.
6. "15-Minute City Analysis" — Essential services within 15 min walk/cycle. Based on Moreno et al. (2021).
7. "Transit Accessibility Score" — GTFS frequency × proximity × route diversity. Graded A-F.
8. "Gravity-Based Accessibility" — Ai = Σ(Oj × f(cij)). Hansen (1959) model. Decay function selection.
9. "Cumulative Opportunities" — Count of POIs within travel-time threshold.

ENVIRONMENT GROUP:
10. "NDVI Computation" — (NIR-RED)/(NIR+RED). Per-pixel from Sentinel-2 B8/B4. Bands explained.
11. "Urban Heat Island Intensity" — UHI = LST_urban - LST_rural. Landsat Band 10 thermal.
12. "Green Space Per Capita" — m²/person. WHO minimum 9 m². Aggregation methods.
13. "Tree Canopy Coverage" — % area under canopy. Target >30% (USDA Forest Service).

SOCIOECONOMIC GROUP:
14. "Gini Coefficient" — Income inequality measure. Standard computation from sorted distribution.
15. "Simpson Diversity Index" — D = 1 - Σ(pi²). For land use or ethnic diversity.
16. "Displacement Risk Index" — UC Berkeley Urban Displacement Project methodology.
17. "Jobs-Housing Balance" — Ratio. Ideal 0.8-1.2.

SDG 11 GROUP:
18. "SDG 11.2.1 Public Transport Access" — Pop within 500m of transit stop with adequate frequency.
19. "SDG 11.3.1 Land Consumption Rate" — LCRPGR = (LCR/PGR). Urbanization efficiency.
20. "SDG 11.7.1 Public Open Space" — Share of built-up area that is open public space.

Each card MUST have: scientific formula in summary, Python code reference (packages needed), interpretation guidance, peer-reviewed references.

VERIFY: 15-20 cards returned. Each has unique id and correct sectionId ('urban_indicators').
```

---

### PROMPT 17 — Vulnerability & Risk Seeds

```
You are populating vulnerability assessment seed cards. Prompt 17 of 42.

TASK: Create `src/features/urbanAnalytics/seeds/vulnerability.ts`

Export function buildVulnerabilityCards(existing?: Set<string>): Card[]

Create 10 cards:

1. "Multi-Hazard Vulnerability Framework" — Hazard × Exposure × Sensitivity - Adaptive Capacity. IPCC AR6 framework.
2. "Social Vulnerability Index (SoVI)" — Cutter et al. (2003). PCA-based composite: poverty, elderly, disability, linguistic isolation, no vehicle, rent burden.
3. "Flood Risk Screening" — DEM-based: sink filling, flow accumulation, TWI (Topographic Wetness Index). NOT full hydraulic model — rapid screening only.
4. "Urban Heat Vulnerability" — LST × impervious % × pop density × elderly % × low-income %. Compound risk.
5. "Seismic Exposure Assessment" — Building typology × soil class × proximity to fault lines. HAZUS-MH methodology simplified.
6. "Sea Level Rise Exposure" — Bathtub model inundation from DEM under IPCC RCP/SSP scenarios (0.3m, 0.5m, 1.0m, 2.0m).
7. "Air Quality Risk Mapping" — PM2.5/PM10/NO2 from sensor data + land use regression. WHO guidelines as thresholds.
8. "Climate Migration Pressure" — Composite: climate exposure + economic vulnerability + infrastructure fragility.
9. "Infrastructure Resilience Score" — Critical facility redundancy, utility network robustness, emergency response coverage.
10. "Post-Disaster Rapid Assessment" — Pre-built templates for earthquake, flood, wildfire, hurricane rapid damage assessment using before/after satellite imagery.

Each card: id, sectionId='vulnerability' or 'rapid_assessment', tags including 'climate' or 'flood' etc, methodology with scientific citations.

VERIFY: Cards compile with correct types.
```

---

### PROMPT 18 — Transport & Network Seeds

```
You are populating transport and network analysis seed cards. Prompt 18 of 42.

TASK: Create `src/features/urbanAnalytics/seeds/transportNetworks.ts`

Export function buildTransportCards(existing?: Set<string>): Card[]

Create 12 cards:

1. "Street Network Analysis with OSMnx" — Download, simplify, analyze. Basic metrics: total length, intersection density, dead-end ratio, circuity.
2. "Betweenness Centrality" — Edge betweenness for identifying critical corridors. Freeman (1977). Interpretation for traffic flow prediction.
3. "Space Syntax: Integration & Choice" — Angular segment analysis. Hillier & Hanson (1984). NACH, NAIN metrics.
4. "Isochrone Analysis" — Travel-time contours by mode (walk/cycle/transit/drive). Service area delineation. Pandana/OSRM/Google Directions.
5. "Origin-Destination Flow Mapping" — OD matrix visualization, desire lines, flow bundling. Census commuter data / Google Distance Matrix.
6. "Transit Service Frequency Analysis" — GTFS headway computation by time-of-day. Service hour classification. Equity analysis by demographics.
7. "Complete Streets Assessment" — NACTO framework. Score street cross-section for pedestrian, cyclist, transit, freight, green infrastructure.
8. "Cycling Network Connectivity" — Level of Traffic Stress (LTS). Connected low-stress network analysis. Gap identification.
9. "Pedestrian Route Quality" — Slope, shade, enclosure, safety, surface quality. GreenViewIndex from Street View.
10. "Parking Supply Analysis" — Lot/structure/on-street inventory. Parking ratio (spaces/unit). Minimum vs maximum parking policies.
11. "Freight & Logistics Network" — Truck route analysis, loading zone distribution, last-mile access.
12. "Multi-Modal Trip Chaining" — GTFS + walk + cycle combined network. R5/OpenTripPlanner-based.

Each card: sectionId='transport_networks', relevant tags, Python tool references (osmnx, networkx, pandana, r5py).

VERIFY: Cards compile.
```

---

### PROMPT 19 — Remote Sensing & GIS Methods Seeds

```
You are populating remote sensing and GIS methodology seed cards. Prompt 19 of 42.

TASK: Create TWO files:

FILE 1: `src/features/urbanAnalytics/seeds/remoteSensing.ts`
Export buildRemoteSensingCards(existing?: Set<string>): Card[]

8 cards:
1. "Spectral Index Computation" — NDVI, NDBI, NDWI, SAVI, EVI. Band formulas for Sentinel-2 and Landsat-8/9.
2. "Land Cover Classification" — Random Forest / SVM on multi-spectral imagery. Training data from ground truth. Confusion matrix validation.
3. "Change Detection" — Post-classification comparison, image differencing, CVA (Change Vector Analysis). Multi-temporal Sentinel-2.
4. "Urban Expansion Mapping" — Built-up area extraction from satellite time-series. Impervious surface mapping.
5. "Land Surface Temperature" — Landsat Band 10/11 thermal. Emissivity correction. Seasonal analysis.
6. "Data Fusion" — Pan-sharpening, multi-sensor fusion (optical + SAR Sentinel-1), temporal compositing.
7. "STAC Catalog & COG Workflow" — How to discover satellite imagery via STAC API (Planetary Computer), load Cloud-Optimized GeoTIFF without downloading entire files.
8. "Google Earth Engine Analysis" — Serverless computation on petabyte-scale satellite archives. Cloud/shadow masking, temporal reducers.

FILE 2: `src/features/urbanAnalytics/seeds/spatialStats.ts`
Export buildSpatialStatsCards(existing?: Set<string>): Card[]

8 cards:
1. "Spatial Autocorrelation (Moran's I)" — Global vs Local Moran's. Interpretation: clustered, dispersed, random. p-value significance.
2. "LISA Clusters (Local Indicators)" — HH, HL, LH, LL cluster types. Significance mapping. Uses: hot-spot detection.
3. "Getis-Ord Gi* (Hot/Cold Spots)" — Distance-band or k-nearest neighbors. Z-score interpretation.
4. "Geographically Weighted Regression" — Spatial non-stationarity. GWR vs OLS comparison. Bandwidth selection.
5. "Kriging & Spatial Interpolation" — Variogram fitting, ordinary kriging. IDW comparison. Cross-validation.
6. "Point Pattern Analysis" — K-function, Nearest Neighbor Index, Ripley's K. CSR vs clustered vs regular.
7. "Areal Interpolation" — Population-to-different-zones. Dasymetric mapping. Tobler (pycnophylactic) method.
8. "Spatial Regression Models" — Spatial lag (SAR) vs spatial error (SEM). Lagrange Multiplier test for model selection.

VERIFY: Both files compile. ~16 cards total.
```

---

### PROMPT 20 — GIS Methods, Data Engineering & Intervention Seeds

```
You are populating remaining domain seed cards. Prompt 20 of 42.

TASK: Create THREE files:

FILE 1: `src/features/urbanAnalytics/seeds/gisMethods.ts`
Export buildGISMethodCards(existing?: Set<string>): Card[]

8 cards covering: Buffer analysis, Spatial join, Overlay analysis (union/intersect/clip), Geocoding methods, Coordinate transformation, Topology validation, Raster-vector conversion, Spatial sampling design.

FILE 2: `src/features/urbanAnalytics/seeds/dataEngineering.ts`
Export buildDataEngineeringCards(existing?: Set<string>): Card[]

8 cards covering: ETL pipeline design, Data quality assessment (ISO 19157), Metadata standards (ISO 19115), OSM data extraction & cleaning, Census data harmonization, GTFS validation, Batch geocoding workflow, Automated report generation.

FILE 3: `src/features/urbanAnalytics/seeds/interventionDesign.ts`
Export buildInterventionCards(existing?: Set<string>): Card[]

10 cards covering: Transit-Oriented Development (TOD), Complete Streets, Green Infrastructure, Mixed-Use Zoning, Traffic Calming, Affordable Housing Policy, Urban Greening (tree planting), Tactical Urbanism, Brownfield Redevelopment, Climate Adaptation Strategies.

Each card must have: sectionId matching its seed category, scientific references, Python tools, methodology.

VERIFY: All three files compile. ~26 cards total.
```

---

### PROMPT 21 — Seed Index & Library Builder

```
You are assembling the complete seed library. Prompt 21 of 42.

TASK: Update `src/features/urbanAnalytics/seeds/index.ts`

This file imports ALL seed builders from Prompts 15-20 and exports them:

import { buildProjectScopingCards } from './projectScoping';
import { buildUrbanIndicatorCards } from './urbanIndicators';
import { buildVulnerabilityCards } from './vulnerability';
import { buildTransportCards } from './transportNetworks';
import { buildRemoteSensingCards } from './remoteSensing';
import { buildSpatialStatsCards } from './spatialStats';
import { buildGISMethodCards } from './gisMethods';
import { buildDataEngineeringCards } from './dataEngineering';
import { buildInterventionCards } from './interventionDesign';

export function buildFullLibrary(): Card[] {
  const existing = new Set<string>();
  const library: Card[] = [];
  
  const builders = [
    buildProjectScopingCards,
    buildUrbanIndicatorCards,
    buildVulnerabilityCards,
    buildTransportCards,
    buildRemoteSensingCards,
    buildSpatialStatsCards,
    buildGISMethodCards,
    buildDataEngineeringCards,
    buildInterventionCards,
  ];
  
  for (const build of builders) {
    const cards = build(existing);
    for (const card of cards) {
      if (!existing.has(card.id)) {
        library.push(card);
        existing.add(card.id);
      }
    }
  }
  
  return library;
}

export { buildProjectScopingCards, buildUrbanIndicatorCards, ... }; // re-export all

Then update `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` to use buildFullLibrary() instead of the empty stub.

VERIFY: UrbanAnalyticsModal opens with 100+ cards visible. Search and section filtering works correctly.
```

---

## Phase 5 — GIS Map Infrastructure (Prompts 22–26)

> **Goal**: Build the complete map component system with deck.gl, Mapbox GL, and Google Maps.  
> **Prerequisite**: Phase 4 complete (modal working with content).  
> **Outcome**: Interactive map with multiple basemaps, layer management, drawing tools.

---

### PROMPT 22 — Map Container & Core Hooks

```
You are building the core map component. Prompt 22 of 42.

TASK: Create the map container and core hooks.

FILE 1: `src/components/map/MapContainer.tsx`
- Renders a deck.gl DeckGL component with react-map-gl basemap
- Props: center, zoom, bearing, pitch, layers, basemapStyle, onViewStateChange, children
- Implements viewport state management via useMapState hook
- Supports both Mapbox GL and Google Maps basemap (switchable)
- WebGL context sharing between deck.gl and basemap
- Mouse position tracking (lat/lon display)
- Resize observer for responsive sizing
- Error boundary for WebGL context loss

FILE 2: `src/components/map/hooks/useMapState.ts`
- Zustand store for map viewport: center, zoom, bearing, pitch, bounds
- Actions: setViewState, flyTo, fitBounds, resetNorth

FILE 3: `src/components/map/hooks/useLayerStack.ts`
- Zustand store for layer management
- State: layers (LayerConfig[]), layerOrder, layerVisibility
- Actions: addLayer, removeLayer, toggleVisibility, setOpacity, moveLayer, setStyle

FILE 4: `src/components/map/hooks/useGeoJSONLoader.ts`
- Hook that loads GeoJSON from URL or File
- Supports: .geojson, .json, .csv (with lat/lon detection), .kml
- Returns: { data, isLoading, error }
- Caches loaded data in memory

FILE 5: `src/components/map/utils/projections.ts`
- Wrap proj4 for CRS transformations
- Export: transformCoords(coords, fromCRS, toCRS), transformGeoJSON(geojson, fromCRS, toCRS)
- Pre-register common CRS: EPSG:4326, EPSG:3857, all UTM zones

FILE 6: `src/components/map/utils/colorScales.ts`
- Integration with d3-scale-chromatic 
- Export: getSequentialScale(name, domain), getDivergingScale(name, domain), getQualitativeScale(name, count)
- Pre-built urban-specific palettes

VERIFY: MapContainer renders a blank map with Mapbox/OSM basemap. useMapState controls viewport.
```

---
d-drop)
- Each layer row: visibility toggle, name, opacity slider, style options, remove button
- Layer type icon (polygon, line, point, raster, hex)
- Legend generation for active layers

FILE 3: `src/components/map/DrawingTools.tsx`
- Toggle drawing mode: Point, Line, Polygon, Rectangle, Circle
- Measurement display (area in m²/km², length in m/km)
- Save drawn geometry as GeoJSON
- Edit mode: vertex editing, delete
- Use deck.gl EditableGeoJsonLayer or Mapbox Draw

FILE 4: `src/components/map/MapLegend.tsx`
- Dynamic legend based on active layers
- Supports: graduated color (choropleth), graduated size, categorical, heatmap ramp
- Collapsible, draggable position

FILE 5: `src/components/map/GeocoderSearch.tsx`
- Address/place search input
- Autocomplete dropdown (Nominatim free + Google Places if API key provided)
- On select: fly to location, optionally drop a pin
- Recent searches memory

FILE 6: `src/components/map/CoordinateDisplay.tsx`
- Shows cursor position in: DD (decimal degrees), DMS, UTM
- Switchable format
- Copy-to-clipboard

FILE 7: `src/components/map/ScaleBar.tsx`
- Dynamic scale bar (metric + imperial)
- Accurate at current latitude

### PROMPT 23 — Map Controls & UI Components

```
You are building map UI components. Prompt 23 of 42.

TASK: Create map control components.

FILE 1: `src/components/map/MapControls.tsx`
- Zoom in/out buttons
- Compass (reset bearing/pitch to 0/0)
- Basemap selector dropdown (Mapbox Streets, Satellite, Dark, Light, OSM, Google Roadmap, Google Satellite)
- Layer toggle panel
- 3D/2D toggle
- Fullscreen toggle
- Screenshot button

FILE 2: `src/components/map/LayerManager.tsx`
- Draggable layer list (reorder by drag-an
VERIFY: All controls render within MapContainer. Drawing creates geometry. Geocoder works.
```

---

### PROMPT 24 — Map Layers (deck.gl)

```
You are building analytical map layers. Prompt 24 of 42.

TASK: Create deck.gl layer components.

FILE 1: `src/components/map/layers/ChoroplethLayer.tsx`
- Accepts GeoJSON FeatureCollection + property name + color scale
- Classification: natural breaks (jenks), quantile, equal interval
- Legend generation
- Hover tooltip with property values
- Click to select feature

FILE 2: `src/components/map/layers/HeatmapLayer.tsx`
- deck.gl HeatmapLayer wrapper
- Props: data (GeoJSON Point), weight property, radius, intensity
- Color ramp control

FILE 3: `src/components/map/layers/IsochroneLayer.tsx`
- Renders travel-time contour polygons
- Color gradient from center (green) to edge (red)
- Time labels on contour boundaries
- Opacity control

FILE 4: `src/components/map/layers/PointClusterLayer.tsx`
- Supercluster integration for point clustering
- Smooth zoom transitions
- Cluster size as circle radius
- Click cluster to zoom in
- Click individual point for popup

FILE 5: `src/components/map/layers/FlowMapLayer.tsx`
- deck.gl ArcLayer for OD flows
- Width/color by flow volume
- Animation option (pulsing arcs)
- Bidirectional option

FILE 6: `src/components/map/layers/BuildingLayer.tsx`
- 3D extruded polygons from building footprints
- Height from property (building:levels × 3m)
- Color by attribute (height, age, use)
- Shadow casting

FILE 7: `src/components/map/layers/NetworkLayer.tsx`
- Street network edges as PathLayer
- Color by attribute (betweenness, speed, LTS)
- Width by attribute
- Hover shows edge properties

FILE 8: `src/components/map/layers/RasterTileLayer.tsx`
- WMS/WMTS/COG raster tile display
- Opacity control
- Band selection for multi-band rasters

VERIFY: Each layer renders with sample data. Hover/click interactions work.
```

---

### PROMPT 25 — Google Maps Integration

```
You are integrating Google Maps Platform. Prompt 25 of 42.

TASK: Create the Google Maps module.

FILE 1: `src/components/map/google/GoogleMapsProvider.tsx`
- Wraps @vis.gl/react-google-maps APIProvider
- Loads Google Maps JS API with key from settings store
- Configures mapId for cloud styling
- Error handling for invalid/missing API key
- Loading state with skeleton

FILE 2: `src/components/map/google/GoogleMapView.tsx`
- Google Maps base layer with deck.gl overlay
- Uses GoogleMapsOverlay from @deck.gl/google-maps
- Supports interleaved rendering (deck.gl layers between Google vector tiles)
- Same viewport state as Mapbox view (synchronized)

FILE 3: `src/components/map/google/StreetViewPanel.tsx`
- Embedded Street View panorama
- Can open from map click (split-screen mode or overlay)
- Navigation within Street View
- Position sync: clicking in Street View updates map marker

FILE 4: `src/components/map/google/GooglePlacesSearch.tsx`
- Places Autocomplete with session tokens (cost optimization)
- Place details on selection (name, address, rating, hours, photos)
- Integration with map geocoder

FILE 5: `src/components/map/google/GoogleDirections.tsx`
- Multi-waypoint route display
- Mode selection: driving, walking, bicycling, transit
- Traffic-aware (departure time)
- Alternatives display
- Route summary: distance, duration, steps

FILE 6: `src/components/map/google/hooks/useGoogleMapsAPI.ts`
- API loader hook
- Key management (read from settings store)
- Quota tracking (count API calls)
- Budget alerting (warn at 80% of monthly budget)

FILE 7: `src/components/map/google/utils/apiKeyManager.ts`
- Encrypted API key storage using AES-256-GCM
- Key validation (test API call)
- Quota reset tracking

FILE 8: `src/components/map/google/utils/googleToGeoJSON.ts`
- Convert Google Maps geometry objects to GeoJSON and vice versa
- google.maps.LatLng → GeoJSON Point
- google.maps.Polygon → GeoJSON Polygon
- DirectionsResult → GeoJSON LineString

VERIFY: Google Maps renders with valid API key. Street View opens. Places search works. Directions display.
```

---

### PROMPT 26 — Map Export & Advanced Features

```
You are building advanced map features. Prompt 26 of 42.

TASK: Create map export and advanced visualization tools.

FILE 1: `src/components/map/hooks/useMapExport.ts`
- Export current map view as PNG (high-DPI)
- Export as SVG (vector layers only)
- Export as GeoJSON (all visible vector layers merged)
- PDF export with title, legend, scale bar, north arrow, attribution

FILE 2: `src/components/map/SpatialFilter.tsx`
- UI for spatial queries:
  - Draw polygon → clip all layers to polygon
  - Buffer → create buffer around features
  - Intersect → find features that intersect a target
  - Point-in-polygon → identify which POIs fall in which zones
- Uses Turf.js for client-side operations
- Results displayed in a table below the map

FILE 3: `src/components/map/SwipeComparison.tsx`
- Split-screen map with draggable vertical divider
- Left side: before / basemap A
- Right side: after / basemap B
- Synchronized viewport

FILE 4: `src/components/map/TemporalSlider.tsx`
- Horizontal timeline slider for time-series data
- Play/pause/speed controls
- Date range display
- Filters visible features by timestamp property

FILE 5: `src/components/map/MinimapInset.tsx`
- Small overview map in bottom corner
- Shows study area extent and current viewport rectangle
- Click to navigate

VERIFY: Map export produces PNG/PDF. Swipe comparison works. Temporal slider filters features.
```

---

## Phase 6 — Calculators, Flows & Center Panel Content (Prompts 27–31)

> **Goal**: Build urban indicator calculators, analytical workflow flows, and center panel content.  
> **Prerequisite**: Phase 5 complete (map infrastructure working).  
> **Outcome**: Interactive calculators, step-by-step analytical workflows, methodology guides.

---

### PROMPT 27 — Urban Indicator Calculators

```
You are building the urban indicator calculator system. Prompt 27 of 42.

TASK: Create calculator files in `src/features/urbanAnalytics/calculators/`

FILE 1: `calculators/morphology.ts` — floorAreaRatio, groundSpaceIndex, openSpaceRatio, mixedUseIndex (Shannon entropy), streetConnectivity (alpha, beta, gamma)

FILE 2: `calculators/accessibility.ts` — walkScore (9-category distance-decay), transitAccessibility (frequency×proximity), cumulativeOpportunities, gravityAccessibility (Hansen 1959)

FILE 3: `calculators/environment.ts` — ndvi (band math), urbanHeatIslandIntensity, greenSpacePerCapita, treeCanopyCoverage, imperviousSurface

FILE 4: `calculators/socioeconomic.ts` — giniCoefficient, shannonDiversity, simpsonDiversity, jobsHousingBalance, displacementRisk (UC Berkeley method)

FILE 5: `calculators/resilience.ts` — socialVulnerabilityIndex (Cutter SoVI), floodExposure, adaptiveCapacity, compoundRiskIndex

FILE 6: `calculators/sdg11.ts` — sdg11_1_1 through sdg11_7_1, all 7 official UN SDG 11 tier-1/tier-2 indicators

Each function:
- Accepts typed parameters
- Returns IndicatorResult with value, unit, and interpretation bands
- Includes JSDoc with formula and reference
- Pure function (no side effects)
- Handles edge cases (division by zero, empty arrays)

FILE 7: `calculators/index.ts` — barrel export + CALCULATOR_REGISTRY mapping UrbanIndicatorKind → calculator function

VERIFY: All calculators compile. Test: walkScore({groceryDist: 200, ...}) returns value in 0-100 range.
```

---

### PROMPT 28 — Analytical Workflow Flows

```
You are building the analytical workflow system. Prompt 28 of 42.

TASK: Update flow system files.

FILE 1: Update `src/centerpanel/Flows/flowTypes.ts`
Replace clinical flow types with:
  type FlowId = AnalyticalFlowId (from types.ts)
  
  Each flow has: id, label, description, icon, steps (StepConfig[])
  
  Define 8 flows: site_suitability, accessibility, vulnerability, indicator_composite, scenario_comparison, equity_audit, change_detection, review

FILE 2: Update `src/centerpanel/Flows/FlowHost.tsx`
Keep the same shell architecture. Map new FlowIds to new flow components.

FILE 3: Create `src/centerpanel/Flows/SiteSuitabilityFlow.tsx`
Implement the multi-criteria site suitability analysis flow:
  Step 1: Define Criteria (list of criteria with weight sliders)
  Step 2: Assign Data Layers (map each criterion to a dataset)
  Step 3: Weighting Method (equal/rank-sum/AHP/manual)
  Step 4: Constraint Mapping (hard constraints as binary mask)
  Step 5: Compute (weighted overlay → suitability score)
  Step 6: Sensitivity Analysis (Monte Carlo weight perturbation)
  Step 7: Generate Output (map + stats + paragraph for report)

FILE 4: Create `src/centerpanel/Flows/AccessibilityFlow.tsx`
  Step 1: Select Mode (walk/cycle/transit/drive)
  Step 2: Set Threshold (minutes)
  Step 3: Select POI Categories
  Step 4: Population Weighting (optional)
  Step 5: Equity Disaggregation (optional: by income/race/age)
  Step 6: Compute Isochrones
  Step 7: Generate Output

FILE 5: Create `src/centerpanel/Flows/VulnerabilityFlow.tsx`
  Step 1: Select Hazard Type (flood/heat/seismic/compound)
  Step 2: Load Hazard Data
  Step 3: Define Exposure Indicators
  Step 4: Define Sensitivity Indicators
  Step 5: Define Adaptive Capacity
  Step 6: Compute Composite Score
  Step 7: Generate Risk Map

FILE 6: Update `src/centerpanel/Flows/FlowsRail.tsx`
Replace clinical flow list with urban analytical flows.

FILE 7: Update `src/centerpanel/Flows/flowLibraryMeta.ts`
Urban flow metadata: titles, descriptions, icons, tags.

VERIFY: FlowsRail shows urban flows. Clicking a flow opens the step-by-step wizard. Each step renders correctly.
```

---

### PROMPT 29 — Methodology Guide System

```
You are building the methodology guide system. Prompt 29 of 42.

TASK: Create the Methods tab content.

FILE 1: Create `src/centerpanel/Guide/MethodsView.tsx` (replace the stub from Prompt 13)

This is the full methodology guide viewer. Structure:
- Left sidebar: guide categories (collapsible tree)
- Main area: selected guide content (markdown rendered)
- Categories from Plan §14:
  - Spatial Statistics (Moran's I, LISA, GWR, Kriging, etc.)
  - Network Analysis (centrality, isochrone, Space Syntax, etc.)
  - Remote Sensing (spectral indices, classification, change detection, etc.)
  - Urban Morphology (Spacematrix, momepy, tessellation, etc.)
  - Transport Planning (GTFS, 4-step model, LOS, Complete Streets, etc.)
  - Environmental Analysis (UHI, green infra, stormwater, noise, etc.)
  - Socioeconomic (gentrification, segregation, affordability, etc.)
  - 3D & Simulation (VoxCity, CityGML, solar, wind, ABM, etc.)
  - Data Engineering (OSM, census, GTFS, quality, CRS, etc.)

Each guide is a MethodologyGuide object with: id, title, category, abstract, methodology (step-by-step), assumptions, limitations, dataRequirements, pythonExample, interpretation, references, relatedIndicators, sdgAlignment.

FILE 2: Create `src/centerpanel/Guide/guideContent.ts`
Build 5 complete example guides with full content (5+ paragraphs each):
1. Spatial Autocorrelation (Moran's I) — complete methodology
2. Walk Score Calculation — complete methodology  
3. NDVI from Sentinel-2 — complete methodology
4. Street Network Analysis with OSMnx — complete methodology
5. Multi-Hazard Vulnerability Assessment — complete methodology

FILE 3: Update `src/centerpanel/Guide/OutlineRail.tsx` (or OutlineRailV2)
Replace clinical guide outline with urban methodology categories.

VERIFY: Methods tab renders guide list. Clicking a guide shows full content.
```

---

### PROMPT 30 — Registry UI (Project Management)

```
You are building the project registry UI. Prompt 30 of 42.

TASK: Update registry UI components.

These files are in `src/centerpanel/registry-ui/`:

FILE 1: Update `Registry.tsx` — RegistryLeft and RegistryMain
- RegistryLeft: Project list with cards showing: name, scale badge, area, tag pills, last session date, indicator sparkline
- RegistryMain: Selected project detail with tabs (Overview, Sessions, Indicators, Maps, Data)
- Search/filter by name, tags, scale

FILE 2: Create/Update `NewProjectPage.tsx` (replace stub from Prompt 13)
Full project creation form:
- Project name (text input)
- Description (textarea)
- Scale selector (dropdown: parcel through national)
- CRS selector (dropdown with common EPSG codes)
- Study area definition:
  Option A: Draw polygon on map
  Option B: Enter bounding box coordinates
  Option C: Upload GeoJSON/Shapefile boundary
  Option D: Search by administrative boundary name
- Initial tags (multi-select from TAG_GROUPS)
- Create button → creates StudyArea in registry state

FILE 3: Update ProjectSummaryCard (was DemographicsCard)
- Project name, description, scale, area (km²), CRS, tags
- Map thumbnail showing study area

FILE 4: Create IndicatorsCard (was AssessmentsCard)
- Table of computed indicators with values, units, interpretation bands
- Sparkline chart showing indicator trends over sessions
- Add indicator button → opens calculator

FILE 5: Create SessionCard (was EncounterCard)
- Session type badge, date, duration
- Datasets used, methods applied
- Key findings summary
- Link to session report

VERIFY: Projects tab shows demo projects. New Project form creates a project. Project detail shows tabs.
```

---

### PROMPT 31 — Urban Context Strip & Note System

```
You are updating the context strip and note system. Prompt 31 of 42.

TASK: Replace clinical-specific components.

FILE 1: Create `src/centerpanel/UrbanContextStrip.tsx` (replaces ClinicalSnapshotStrip)

Reuse the same KvPill pattern but with urban context:
- Info modes: "overview" | "data" | "indicators" | "flags" | "session"
- Overview pills: Study area name, scale, area (km²), population
- Data pills: dataset count, format breakdown, total file size
- Indicator pills: key indicator values with severity colors (green=good, amber=warning, red=critical)
- Flag pills: data quality alerts (CRS mismatch, temporal mismatch, coverage gap)
- Session pills: active session info, timer, workflow status

FILE 2: Update `src/centerpanel/tabs/Note.tsx` (Report tab)
Replace clinical note slots with SessionNoteSlots:
- Objective (what we're analyzing)
- Methodology (how we're doing it)
- Findings (key results)
- Recommendations (policy/design recommendations)
- Data References (datasets used with citations)
- Limitations (caveats & uncertainty)

Keep the same editor pattern (textarea/rich text), auto-save, export.

FILE 3: Update `src/centerpanel/sections.ts`
Replace clinical sections with urban analytics sections (as defined in Plan §10.2):
  overview, data-inventory, baseline (demographics, land-use, built-form, transport, environment), analysis (spatial-stats, network-analysis, remote-sensing, simulations), indicators (morphology-metrics, accessibility-metrics, environmental-metrics, equity-metrics), interventions (design-proposals, policy-recs, scenario-compare), references

VERIFY: Context strip shows urban indicators. Report tab has correct note sections. Sections match urban analytics taxonomy.
```

---

## Phase 7 — VoxCity, 3D & Python Integration (Prompts 32–34)

> **Goal**: Build VoxCity 3D viewer and Python environment bridge.  
> **Prerequisite**: Phase 6 complete.  
> **Outcome**: 3D voxel rendering, environmental simulations, Python script execution.

---

### PROMPT 32 — VoxCity 3D Viewer

```
You are building the VoxCity 3D integration. Prompt 32 of 42.

TASK: Create VoxCity module files.

FILE 1: `src/features/urbanAnalytics/voxcity/types.ts`
Define: VoxelGrid, VoxelMaterial, SimulationResult, SimulationType (solar_radiation, wind_speed, wind_comfort, noise_level, thermal_comfort_utci, sky_view_factor, daylight_factor, shadow_hours)

FILE 2: `src/features/urbanAnalytics/voxcity/VoxGridLoader.ts`
- Parse VoxCity .csv voxel grids (x,y,z,material_id columns)
- Parse VoxCity .json format
- Validate grid integrity (no gaps, consistent resolution)
- Return VoxelGrid object

FILE 3: `src/features/urbanAnalytics/voxcity/VoxCityViewer.tsx`
- React component using @react-three/fiber
- Render VoxelGrid as instanced meshes (InstancedMesh for performance)
- Material coloring per voxel type
- Camera orbit controls (OrbitControls from drei)
- Performance: handle 500K+ voxels via instancing + LOD

FILE 4: `src/features/urbanAnalytics/voxcity/VoxCityControls.tsx`
- Layer toggle per material type (buildings, ground, vegetation, water)
- Opacity sliders
- Slice plane controls (horizontal at height Y, vertical at X/Z)
- Camera presets (top-down, perspective, street-level)

FILE 5: `src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx`
- Map SimulationResult scalar values onto voxel colors
- Color ramp selection (viridis, plasma, RdYlBu, etc.)
- Value range slider for filtering
- Legend display

FILE 6: `src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx`
- Side-by-side 3D viewer (split screen)
- Synchronized camera (rotate one → both rotate)
- Scenario A vs Scenario B labels

FILE 7: `src/features/urbanAnalytics/voxcity/hooks/useVoxScene.ts`
- Zustand store for VoxCity state: grid, simulation, slicePlane, visibility, camera

VERIFY: VoxCity viewer renders a sample voxel grid. Controls toggle layers. Simulation overlay colors voxels.
```

---

### PROMPT 33 — Python Environment Bridge

```
You are building the Python integration bridge. Prompt 33 of 42.

TASK: Create Python environment management UI.

FILE 1: `src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx`
- Detect available Python environments (venv, conda)
- Display environment name, Python version, package count
- Activate/switch environment
- Status indicator (active/inactive)

FILE 2: `src/features/urbanAnalytics/python/PackageManager.tsx`
- List installed packages (pip list --format=json)
- Install package via pip (with progress indicator)
- "Install Urban Stack" one-click button that installs all required packages
- Package status: installed, outdated, missing

FILE 3: `src/features/urbanAnalytics/python/DataBridge.ts`
- Serialize JavaScript objects to JSON for Python consumption
- GeoJSON → temp file → Python reads
- Python output → parse JSON/GeoJSON → JavaScript objects
- Communication via filesystem (temp files) or stdout/stdin

FILE 4: `src/features/urbanAnalytics/python/ScriptTemplates.tsx`
- UI to browse and insert pre-built Python analysis scripts into the Monaco editor
- Categories: accessibility, morphology, remote_sensing, network, statistics, visualization
- Each template is a complete, runnable .py file
- Insert button opens the script in the IDE editor

FILE 5: Create 5 Python template files in `src/features/urbanAnalytics/python/templates/`:
- accessibility_analysis.py — 15-min city walkability analysis using osmnx + pandana
- network_analysis.py — Street network centrality analysis using osmnx + networkx
- remote_sensing_ndvi.py — NDVI from Sentinel-2 using rasterio
- spatial_autocorrelation.py — Moran's I and LISA using pysal
- urban_morphology.py — Building morphometrics using momepy

Each template: 100-200 lines, fully documented, configurable parameters, produces map + chart output.

VERIFY: Environment manager detects Python. Templates display in UI. Inserting a template opens it in Monaco.
```

---

### PROMPT 34 — 3D Visualization Extensions

```
You are extending 3D visualization capabilities. Prompt 34 of 42.

TASK: Create advanced 3D components.

FILE 1: `src/components/map/layers/VoxelLayer.tsx`
- Bridge VoxCity voxel data to deck.gl PointCloudLayer or custom layer
- 2D map view of voxel data (top-down projection)
- Click to open 3D VoxCity viewer in side panel

FILE 2: Create `src/engine/gpu/WebGPUContext.ts`
- WebGPU device initialization
- Feature detection (navigator.gpu availability)
- Graceful fallback: WebGPU → WebGL2 → CPU
- Export capability flags

FILE 3: Create `src/engine/gpu/SpatialComputeEngine.ts`
- High-level API for GPU-accelerated operations
- Methods: computeNDVI(nirBand, redBand), computeHillshade(dem, azimuth, altitude), computeKDE(points, bandwidth)
- Each method: create compute pipeline, dispatch, read results
- WebGPU fallback to CPU implementation

FILE 4: Create `src/engine/gpu/shaders/rasterOps.wgsl`
- WGSL shader for band math operations
- NDVI = (NIR - RED) / (NIR + RED)
- Generic band math: A op B where op is +, -, *, /, normalized_difference

FILE 5: Create `src/engine/gpu/shaders/hillshade.wgsl`
- WGSL shader for DEM hillshade rendering
- Input: elevation grid, azimuth, altitude
- Output: illumination value per pixel

VERIFY: WebGPU context initializes (or falls back). NDVI computation produces correct output.
```

---

## Phase 8 — AI Adaptation & Data Connectors (Prompts 35–37)

> **Goal**: Update AI system prompts, build data connectors for external APIs.  
> **Prerequisite**: Phase 7 complete.  
> **Outcome**: AI assistant speaks urban analytics, data can be loaded from major sources.

---

### PROMPT 35 — AI System Prompt & RAG Update

```
You are adapting the AI system for urban analytics. Prompt 35 of 42.

TASK: Update AI configuration.

FILE 1: Update system prompts in `src/services/ai/context/`

Replace all psychiatric system prompts with the urban analytics system prompt:

"You are an expert urban analytics AI assistant integrated into a spatial analysis workbench. Your expertise spans:
- Urban planning theory (TOD, New Urbanism, Smart Growth, Tactical Urbanism)
- GIS and spatial analysis (vector operations, raster algebra, network analysis)
- Remote sensing (spectral indices, classification, change detection)
- Transport planning (4-step model, accessibility, LOS, GTFS)
- Environmental science (UHI, stormwater, green infrastructure, noise)
- Spatial statistics (Moran's I, LISA, GWR, kriging)
- SDG 11 indicators
- Python geospatial stack (geopandas, osmnx, pysal, rasterio, folium)
- VoxCity voxel-based simulation

When generating analysis:
- Cite methodological sources
- Specify CRS considerations
- Include uncertainty qualifications
- Follow FAIR data principles
- Consider equity and environmental justice
- Provide reproducible Python code"

FILE 2: Update `src/services/ai/guardrails/`
- Replace clinical safety guardrails with urban analytics guardrails:
  - Data privacy checks (no PII in prompts)
  - CRS validation reminders
  - Statistical significance warnings
  - Reproducibility requirements
  - Equity impact considerations

FILE 3: Update RAG corpus references in `src/services/rag/`
- Index urban planning documentation instead of clinical
- Add: urban planning methodology, Python geospatial docs, SDG 11 framework, VoxCity API, OSM wiki

VERIFY: AI assistant responds with urban analytics context. Typing "analyze walkability" generates relevant urban content.
```

---

### PROMPT 36 — Data Connectors (External APIs)

```
You are building external data connectors. Prompt 36 of 42.

TASK: Create data connector services.

FILE 1: `src/services/data/OverpassConnector.ts`
- Query OpenStreetMap via Overpass API
- buildQuery(bbox, tags) — construct Overpass QL
- fetchBuildings(bbox) — returns GeoJSON FeatureCollection of building footprints
- fetchRoads(bbox) — returns road network
- fetchPOIs(bbox, types) — returns POIs by OSM tags
- fetchLandUse(bbox) — returns land use polygons
- Rate limiting (max 2 requests/10 seconds)

FILE 2: `src/services/data/GoogleMapsConnector.ts`
- Places nearby search (type, radius, center)
- POI dataset builder (study area polygon → grid → nearest search → FC)
- Travel time matrix (origins × destinations × mode)
- Elevation profile (path → elevation samples)
- Batch geocoding (addresses → coordinates)
- Street View coverage check
- API key from settings store
- Request caching (IndexedDB, TTL-based)
- Quota tracking

FILE 3: `src/services/data/CensusConnector.ts`
- US Census ACS 5-year data
- Fetch demographics by tract/block group for bbox
- Variables: population, income, housing, education, age
- Returns GeoJSON with census geometry + attributes

FILE 4: `src/services/data/NominatimConnector.ts`
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Structured search (city, country, postal code)
- Rate limiting (1 req/sec per Nominatim policy)

FILE 5: `src/services/data/GTFSLoader.ts`
- Parse GTFS zip file (stops.txt, routes.txt, trips.txt, stop_times.txt, shapes.txt)
- Returns: stops as GeoJSON Points, routes as GeoJSON LineStrings, frequency analysis, headway computation

FILE 6: `src/services/data/index.ts` — barrel export all connectors

VERIFY: Overpass connector fetches buildings for a given bbox. Google connector returns places. GTFS parser extracts stops.
```

---

### PROMPT 37 — Localization (i18n) Update

```
You are updating the internationalization system. Prompt 37 of 42.

TASK: Create urban analytics locale files.

FILE 1: `src/locales/urban/en.json`
Complete English translation file covering:
- Tab names: Projects, New Project, Methods, Report, Workflows, Toolbox
- Section names: all 22 section labels from SECTION_TREE
- Indicator names: all UrbanIndicatorKind values with human-readable labels
- Flow names: all AnalyticalFlowId values with human-readable labels
- Calculator labels, button text, error messages
- Map controls: Zoom in/out, Basemap, Layers, Draw, Measure, Export
- Common urban terms: study area, bounding box, CRS, basemap, layer, feature, attribute

FILE 2: `src/locales/urban/tr.json`
Turkish translation of all keys.

FILE 3: Update `src/i18n/index.ts`
- Replace psych locale imports with urban locale imports
- Maintain same i18n infrastructure (i18next or custom)

VERIFY: Interface labels appear in English by default. Switching to Turkish shows Turkish labels.
```

---

## Phase 9 — Advanced Engines & Scientific Tools (Prompts 38–40)

> **Goal**: Build advanced analytical engines for professional-grade analysis.  
> **Prerequisite**: Phases 1-8 complete.  
> **Outcome**: Spatial SQL database, cartographic engine, network analysis engine.

---

### PROMPT 38 — Spatial Database (DuckDB-WASM)

```
You are building the in-browser spatial database. Prompt 38 of 42.

TASK: Create the spatial SQL query engine.

FILE 1: `src/engine/spatial-db/SpatialDB.ts`
- Initialize DuckDB-WASM with spatial extension
- loadGeoJSON(table, geojson) — create table from GeoJSON FC
- loadCSV(table, data, latCol, lonCol) — create table with point geometry
- query(sql) — execute SQL query, return results
- toGeoJSON(query) — execute query, return results as GeoJSON FC
- Spatial functions available: ST_Buffer, ST_Intersects, ST_Contains, ST_Within, ST_Area, ST_Distance, ST_Transform, ST_Centroid, ST_Union, ST_Envelope

FILE 2: `src/engine/spatial-db/SQLEditor.tsx`
- Monaco editor instance configured for SQL language
- Auto-complete for spatial functions (ST_* prefix)
- Auto-complete for table and column names (from loaded datasets)
- Run button → execute query
- Results table below editor (first 100 rows)
- "Send to Map" button for results with geometry
- Query history panel

FILE 3: `src/engine/spatial-db/hooks/useSpatialDB.ts`
- Hook that initializes DuckDB-WASM singleton
- Provides query, loadData, getTables methods
- Tracks loaded tables and their columns/types

VERIFY: DuckDB-WASM loads. Can create table from GeoJSON, run spatial SQL, display results. "SELECT ST_Area(geometry) FROM zones" returns values.
```

---

### PROMPT 39 — Cartographic Engine

```
You are building the cartographic style engine. Prompt 39 of 42.

TASK: Create professional cartography tools.

FILE 1: `src/engine/carto/ClassificationSchemes.ts`
Implement classification algorithms:
- naturalBreaks(values, numClasses) — Fisher-Jenks optimization
- quantile(values, numClasses) — equal-count bins
- equalInterval(values, numClasses) — uniform value range
- standardDeviation(values, numClasses) — mean ± σ
- headTailBreaks(values) — recursive mean split (Jiang 2013)
- prettyBreaks(values, numClasses) — round number boundaries
Each returns: breaks (number[]), classRanges ({ min, max }[])

FILE 2: `src/engine/carto/ColorBrewerIntegration.ts`
- Integration with d3-scale-chromatic
- Export getSequentialPalette, getDivergingPalette, getQualitativePalette
- Built-in urban palettes: "urban_heat" (blue→red), "green_deficit" (red→green), "accessibility" (red→blue→green)

FILE 3: `src/engine/carto/SymbologyManager.ts`
- applyClassification(geojson, property, scheme, numClasses, palette) → styled GeoJSON + legend
- Choropleth, graduated symbol, dot density symbology types
- Returns deck.gl-compatible style properties

FILE 4: `src/engine/carto/PrintComposer.ts`
- Build map layout with: map frame, title, subtitle, legend, scale bar, north arrow, attribution, data source
- Export to PDF (using pdf-lib) at 72/150/300 DPI
- Page sizes: A4, A3, Letter
- Orientation: portrait, landscape

FILE 5: `src/engine/carto/BivariateChoropleth.ts`
- 3×3 and 4×4 bivariate color matrices
- Two variables → composite color map
- Uses: income × education, density × NDVI, rent_change × income

VERIFY: Classification produces correct break values. Print composer generates PDF with title/legend. Bivariate choropleth renders.
```

---

### PROMPT 40 — Network Analysis Engine

```
You are building the client-side network analysis engine. Prompt 40 of 42.

TASK: Create the graph-based network engine.

FILE 1: `src/engine/network/NetworkGraph.ts`
- Graph data structure: nodes (Map<NodeId, GraphNode>), edges (Map<EdgeId, GraphEdge>)
- buildFromGeoJSON(edges, nodes) — construct graph from linestring FC
- addNode, addEdge, removeNode, removeEdge
- Spatial index using RBush for nearest-node lookup
- GraphNode: id, x, y, z?, degree, type
- GraphEdge: id, source, target, weight, length, geometry, properties

FILE 2: `src/engine/network/Routing.ts`
- Dijkstra's algorithm: shortestPath(graph, origin, destination, weightFn) → Route
- A* algorithm with haversine heuristic for geo-networks
- Isochrone: nodes reachable within threshold → convex hull polygon → GeoJSON
- Batch: many-to-many shortest path matrix

FILE 3: `src/engine/network/Centrality.ts`
- betweennessCentrality(graph) → Map<EdgeId, number>
- closenessCentrality(graph) → Map<NodeId, number>
- Brandes algorithm for O(VE) betweenness
- PageRank for node importance

FILE 4: `src/engine/network/Accessibility.ts`
- cumulativeOpportunities(graph, origins, pois, threshold) → number[]
- gravityAccessibility(graph, origins, pois, beta) → number[]
- twoStepFloatingCatchment(graph, demand, supply, threshold) → number[]

FILE 5: `src/engine/network/SpaceSyntax.ts`
- Angular segment analysis
- integration(graph, radius) → Map<SegmentId, number>
- choice(graph, radius) → Map<SegmentId, number>
- NACH and NAIN normalization

FILE 6: `src/engine/network/OSMNetworkBuilder.ts`
- Build network from OSM data (via Overpass)
- Mode-specific: walk (sidewalks, footpaths), cycle (bike lanes, bike paths), drive (roads)
- Speed/time weights per mode
- Handle one-way streets, turn restrictions

VERIFY: Build network from sample GeoJSON. Compute shortest path. Compute betweenness centrality. Generate isochrone polygon.
```

---

## Phase 10 — Integration, Polish & Testing (Prompts 41–42)

> **Goal**: Final integration, cleanup, smoke tests.  
> **Prerequisite**: All previous phases complete.  
> **Outcome**: Complete, working Urban Analytics Workbench.

---

### PROMPT 41 — Integration & Wiring

```
You are performing final integration of all modules. Prompt 41 of 42.

TASK: Wire everything together and ensure all features are accessible from the UI.

STEP 1: Verify UrbanAnalyticsModal → seed library → right panel → all 100+ cards render
STEP 2: Verify CenterPanelShell → all 6 tabs work:
  - Projects: list demo projects, create new project
  - New Project: form with map-based study area definition
  - Methods: guide list with full content
  - Report: note editor with 6 urban slots
  - Workflows: flow list, click to start step-by-step
  - Toolbox: calculator list, click to compute indicators

STEP 3: Verify MapContainer renders in appropriate places:
  - New Project (study area drawing)
  - Workflows (spatial analysis steps)
  - Calculator results (indicator maps)
  - Standalone map view (if applicable)

STEP 4: Verify Google Maps integration:
  - Basemap switching includes Google Maps option
  - Street View opens from map context menu
  - Places search works
  - Directions display

STEP 5: Verify VoxCity:
  - Load sample voxel grid
  - 3D viewer renders
  - Simulation overlay works
  - Scenario comparison works

STEP 6: Verify Python templates:
  - Templates display in IDE
  - Can insert template into editor
  - Terminal can execute Python (if env available)

STEP 7: Verify AI assistant:
  - System prompt is urban analytics
  - Ask "What is Walk Score?" → gets relevant answer
  - Ask "Write NDVI analysis in Python" → generates correct code

STEP 8: Verify spatial SQL:
  - DuckDB-WASM loads
  - Can import GeoJSON as table
  - Run ST_Area query
  - Send results to map

STEP 9: Remove/archive ALL remaining psychiatry references:
  - Rename src/features/psychiatry/ → src/features/_archived_psychiatry/
  - Remove psychiatry imports from any remaining file
  - Remove clinical terminology from any remaining string literals

VERIFY: Full app runs with zero console errors. All major features accessible. No psychiatry references remain.
```

---

### PROMPT 42 — Final Quality Assurance & Documentation

```
You are performing final QA and documentation. Prompt 42 of 42.

TASK: Quality assurance, performance checks, and documentation.

STEP 1: Run full TypeScript compilation:
  npx tsc --noEmit
  Fix any remaining type errors.

STEP 2: Run ESLint:
  npx eslint src/ --ext .ts,.tsx
  Fix critical issues (unused imports, missing dependencies in hooks, etc.)

STEP 3: Bundle size analysis:
  npx vite build
  Verify bundle splits correctly:
  - Map components lazy-loaded
  - VoxCity lazy-loaded
  - deck.gl tree-shaken to used layers only
  - Google Maps loaded only when API key present

STEP 4: Create `README.md` update:
  - Project name: Urban Analytics Workbench
  - Description: Spatial intelligence platform for urban scientists & planners
  - Features: Map system (Mapbox + Google Maps + deck.gl), VoxCity 3D, Python integration, 150+ analytical cards, 8 workflow flows, 40+ urban indicators, Spatial SQL, AI assistant
  - Quick start: npm install, npm run dev, open http://localhost:5173
  - Python setup: conda env create -f environment.yml
  - Google Maps: Add API key in Settings
  - Tech stack: React 19, TypeScript 5, Vite 6, Zustand 5, deck.gl 9, three.js, DuckDB-WASM

STEP 5: Update `package.json`:
  - name: "urban-analytics-workbench"
  - description: "World-class spatial intelligence platform for urban scientists & planners"
  - version: "1.0.0"

STEP 6: Create `.env.example`:
  VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
  VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
  VITE_OPENAI_API_KEY=your_openai_key

STEP 7: Final smoke test:
  npm run dev
  - Open app → UrbanAnalyticsModal opens
  - Search "walkability" → cards appear
  - Open Projects tab → demo projects visible
  - Open Workflows → flows listed
  - Open map → renders with basemap
  - Run calculator → returns result
  - AI chat → responds with urban knowledge

VERIFY: Build succeeds. Dev server starts. All features work. Zero psychiatry references. README accurate.
```

---

## Appendix — Dependency Graph

```
Phase 0 (Environment)     ─── no dependencies ───
    │
Phase 1 (Types)          ─── depends on Phase 0 (packages installed) ───
    │
Phase 2 (Stores)         ─── depends on Phase 1 (types defined) ───
    │
Phase 3 (Modal/Nav)      ─── depends on Phase 2 (stores ready) ───
    │
Phase 4 (Seeds)          ─── depends on Phase 3 (modal renders) ───
    │
Phase 5 (Map/GIS)        ─── depends on Phase 1 (types) + Phase 0 (packages) ───
    │                         CAN run parallel to Phases 3-4
Phase 6 (Calcs/Flows)    ─── depends on Phase 4 (seeds) + Phase 5 (map) ───
    │
Phase 7 (VoxCity/Python)  ─── depends on Phase 5 (3D libs) ───
    │
Phase 8 (AI/Data/i18n)   ─── depends on Phase 6 (content ready) ───
    │
Phase 9 (Engines)        ─── depends on Phase 5 (map) + Phase 8 (data) ───
    │
Phase 10 (Integration)   ─── depends on ALL previous phases ───
```

## Appendix — Critical Path (minimum sequential chain)

```
P0.1 (npm install) → P1.4 (types) → P1.5 (sections) → P2.7 (store) → P3.10 (modal) → P3.14 (App.tsx) → P4.21 (seed index) → P6.28 (flows) → P10.41 (integrate)
```

Total: **9 prompts on critical path** — remaining 33 can be parallelized around this chain.

## Appendix — Parallel Execution Groups

If using multiple agents simultaneously:

| Time Slot | Agent A (Critical Path) | Agent B (Map/GIS) | Agent C (Content) |
|---|---|---|---|
| T1 | P1 (npm install) | — | — |
| T2 | P4 (types) | P3 (scaffolding) | P2 (Python env) |
| T3 | P5 (sections) | P22 (map container) | P6 (icons) |
| T4 | P7 (store) | P23 (map controls) | P15 (scoping seeds) |
| T5 | P8 (registry state) | P24 (map layers) | P16 (indicator seeds) |
| T6 | P10 (modal) | P25 (Google Maps) | P17-19 (more seeds) |
| T7 | P13 (center panel) | P26 (map export) | P20 (remaining seeds) |
| T8 | P14 (App.tsx) | P32 (VoxCity) | P21 (seed index) |
| T9 | P28 (flows) | P34 (3D/GPU) | P27 (calculators) |
| T10 | P30 (registry UI) | P38 (spatial DB) | P29 (guides) |
| T11 | P35 (AI update) | P39 (cartography) | P37 (i18n) |
| T12 | P41 (integration) | P40 (network engine) | P33 (Python) |
| T13 | P42 (QA) | — | — |

---

> **End of Implementation Agent Prompts**  
> **Version**: 1.0 | **Date**: 2026-03-07  
> **Total Prompts**: 42 | **Phases**: 10 | **Critical Path**: 9 prompts  
> **Target**: World-class scientific urban analytics platform
