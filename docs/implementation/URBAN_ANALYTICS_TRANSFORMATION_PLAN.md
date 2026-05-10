# SynapseIDE → Urban Analytics Workbench: Comprehensive Transformation Plan

> **Version**: 2.0  
> **Date**: 2026-03-07  
> **Scope**: Full domain pivot from psychiatry clinical decision-support to urban analytics & spatial intelligence platform  
> **Principle**: Preserve IDE shell, modal architecture, state patterns, AI infrastructure — replace all domain content  
> **v2.0 Changes**: Added advanced GIS engine, Google Maps Platform full integration, WebGPU compute pipeline, spatial database layer, real-time streaming geodata, advanced cartographic engine

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Preservation Map](#2-architecture-preservation-map)
3. [Domain Mapping: Psychiatry → Urban Analytics](#3-domain-mapping-psychiatry--urban-analytics)
4. [New Domain Model & Type System](#4-new-domain-model--type-system)
5. [GIS & Spatial Data Infrastructure](#5-gis--spatial-data-infrastructure)
6. [**Google Maps Platform Integration** ⭐ NEW](#6-google-maps-platform-integration)
7. [**Advanced GIS Engine & WebGPU Compute** ⭐ NEW](#7-advanced-gis-engine--webgpu-compute)
8. [VoxCity Integration](#8-voxcity-integration)
9. [Python Urban Data Analysis Environment](#9-python-urban-data-analysis-environment)
10. [Center Panel Redesign](#10-center-panel-redesign)
11. [Urban Analytics Modal (replaces PsychiatryModal)](#11-urban-analytics-modal-replaces-psychiatrymodal)
12. [Analytical Flows (replaces Clinical Flows)](#12-analytical-flows-replaces-clinical-flows)
13. [Urban Indicators & Calculators (replaces MBC)](#13-urban-indicators--calculators-replaces-mbc)
14. [Guide System (replaces Clinical Guides)](#14-guide-system-replaces-clinical-guides)
15. [Project Registry (replaces Patient Registry)](#15-project-registry-replaces-patient-registry)
16. [AI System Adaptation](#16-ai-system-adaptation)
17. [Data Sources & APIs](#17-data-sources--apis)
18. [Visualization Layer](#18-visualization-layer)
19. [**Advanced Cartographic Engine** ⭐ NEW](#19-advanced-cartographic-engine)
20. [**Real-Time Streaming Geodata Pipeline** ⭐ NEW](#20-real-time-streaming-geodata-pipeline)
21. [**Spatial Database & Query Engine** ⭐ NEW](#21-spatial-database--query-engine)
22. [**Geospatial AI/ML Pipeline** ⭐ NEW](#22-geospatial-aiml-pipeline)
23. [Scientific Recommendations & Additions](#23-scientific-recommendations--additions)
24. [Internationalization (i18n)](#24-internationalization-i18n)
25. [New Dependencies](#25-new-dependencies)
26. [Migration Phases & File Map](#26-migration-phases--file-map)
27. [Risk Register & Mitigations](#27-risk-register--mitigations)

---

## 1. Executive Summary

This plan transforms SynapseIDE from a **psychiatry clinical decision-support IDE** into an **Urban Analytics Workbench** — a comprehensive platform for urban scientists, planners, GIS analysts, and data engineers. The transformation preserves:

- **IDE Shell**: Monaco editor, file explorer, terminal, command palette, global search
- **Modal Architecture**: Same drawer/panel pattern, new urban analytics content
- **State Management**: Zustand stores, React Context, persistence patterns
- **AI Infrastructure**: Multi-provider streaming, guardrails, RAG, telemetry
- **Observability**: OpenTelemetry, structured logging, error boundaries
- **Theme System**: Charcoal-amber design tokens, dark/light modes

Everything **domain-specific** (psychiatry content, clinical flows, patient data, medical scales, medication databases, clinical guides) is replaced with urban analytics equivalents.

### What an Urban Scientist Needs

An urban analytics platform must support the full lifecycle of urban research and planning:

1. **Data Acquisition** — Census, OSM, remote sensing, IoT sensors, transit feeds
2. **Spatial Analysis** — Geometric operations, spatial statistics, network analysis
3. **Indicator Computation** — Walkability, accessibility, density, equity indices
4. **Simulation & Modeling** — Agent-based, cellular automata, land-use transport
5. **3D Visualization** — Voxel cities, point clouds, building models, terrain
6. **Reporting & Communication** — Maps, dashboards, policy briefs, PDF export
7. **Reproducibility** — Version-controlled notebooks, environment management
8. **Collaboration** — Shared projects, annotation, review workflows

---

## 2. Architecture Preservation Map

| Current Layer | Keeps | Changes |
|---|---|---|
| `src/App.tsx` | Layout, routing, theme wrapping | `PsychiatryModal` → `UrbanAnalyticsModal`, `WelcomeModal` content |
| `src/components/ide/` | **Entirely preserved** — EnhancedIDE, CommandPalette, GlobalSearch, Header | No changes |
| `src/components/editor/` | **Entirely preserved** — MonacoEditor, themes, toolbar | Add Python/GeoJSON language modes |
| `src/components/terminal/` | **Entirely preserved** | Python/conda environment integration |
| `src/components/file-explorer/` | **Entirely preserved** | GIS file icons (.shp, .gpkg, .tif, .geojson) |
| `src/services/ai/` | **Entirely preserved** — adapters, guardrails, router, streaming | System prompts change to urban analytics domain |
| `src/services/rag/` | **Entirely preserved** — HybridIndex, BM25+vector | Index urban docs instead of clinical |
| `src/observability/` | **Entirely preserved** | No changes |
| `src/ai/` | **Entirely preserved** — modelRegistry, samplingMapper | No changes |
| `src/hooks/` | **Entirely preserved** — useAiStreaming, useAsync, etc. | No changes |
| `src/stores/` | Pattern preserved, content changes | Rename psychiatric stores → urban equivalents |
| `src/features/psychiatry/` | **Modal architecture preserved** | Content completely replaced → `src/features/urbanAnalytics/` |
| `src/centerpanel/` | Shell, tabs, timer architecture preserved | Tabs renamed, registry → project registry, flows → analysis flows |
| `src/locales/psych/` | i18n infrastructure preserved | Content → urban analytics terminology |

---

## 3. Domain Mapping: Psychiatry → Urban Analytics

### Concept Translation Table

| Psychiatry Concept | Urban Analytics Equivalent |
|---|---|
| Patient | **Project / Study Area** |
| Encounter | **Analysis Session / Field Survey** |
| Diagnosis | **Urban Typology Classification** |
| Treatment Plan | **Intervention Strategy / Policy Recommendation** |
| Medication | **Urban Intervention** (traffic calming, green infrastructure, zoning) |
| Risk Assessment (suicide/violence) | **Vulnerability Assessment** (flood, heat, seismic, social) |
| Safety Planning | **Resilience Planning / Disaster Preparedness** |
| Clinical Scales (PHQ-9, GAD-7) | **Urban Indices** (Walk Score, NDVI, Gini, Shannon Entropy) |
| MBC (Measurement-Based Care) | **KPI Monitoring Dashboard** (SDG indicators, benchmarks) |
| Psychotherapy | **Planning Intervention** (TOD, complete streets, mixed-use) |
| Clinical Guides | **Methodology Guides** (spatial statistics, network analysis, LCA) |
| Structured Flows | **Analytical Workflows** (site suitability, accessibility, equity) |
| Progress Notes | **Analysis Reports / Technical Memos** |
| Intake & HPI | **Project Scoping & Baseline Assessment** |
| Follow-up | **Monitoring & Evaluation (M&E)** |
| Consent & Ethics | **Stakeholder Engagement & Impact Assessment** |
| CAMHS (Child & Adolescent) | **Neighborhood-Scale Analysis** |
| Referral Letters | **Policy Briefs & Planning Reports** |
| Prescription | **Design Specification / Zoning Recommendation** |

### Section Hierarchy Translation

| Psychiatry Section | Urban Analytics Section |
|---|---|
| Assessment & Initial Encounter | **Project Scoping & Baseline** |
| ├ Intake & HPI | ├ Study Area Definition & Context |
| ├ Scales & Measures | ├ Urban Indicators & Metrics |
| └ Measurement-Based Care | └ KPI Dashboard & Benchmarking |
| Risk, Safety & Acute Triage | **Vulnerability & Hazard Assessment** |
| ├ Acute Triage & Emergencies | ├ Rapid Urban Assessment (post-disaster) |
| └ Risk Assessment & Safety Planning | └ Multi-Hazard Vulnerability Mapping |
| Diagnosis & Formulation | **Urban Typology & Classification** |
| Treatment Planning | **Intervention Design & Scenario Modeling** |
| ├ Psychotherapies | ├ Planning Interventions (TOD, green infra) |
| ├ Medication Selection | ├ Policy Instrument Selection |
| └ Medication Orders | └ Implementation Specifications |
| Follow-up & Documentation | **Monitoring, Evaluation & Reporting** |
| ├ Follow-up & Monitoring | ├ Temporal Change Detection & M&E |
| └ Progress Notes & Letters | └ Technical Reports & Policy Briefs |
| Special Populations | **Thematic Deep-Dives** |
| ├ CAMHS | ├ Neighborhood-Scale Analysis |
| ├ Group Programs | ├ Regional / Metropolitan Analysis |
| └ Neuropsychiatry | └ Infrastructure & Transport Networks |
| Psychometrics | **Spatial Statistics & Indices** |

---

## 4. New Domain Model & Type System

### Core Types (`src/features/urbanAnalytics/lib/types.ts`)

```typescript
// ── Study Area ──────────────────────────────────────────────
type StudyAreaId = string  // UUID

interface StudyArea {
  id: StudyAreaId
  name: string
  description: string
  bbox: BoundingBox            // [west, south, east, north]
  geometry?: GeoJSON.Geometry  // Polygon/MultiPolygon boundary
  crs: CoordinateReferenceSystem
  scale: UrbanScale
  tags: UrbanTag[]
  datasets: DatasetRef[]
  sessions: AnalysisSession[]
  indicators?: IndicatorResult[]
  tasks?: UrbanTask[]
  createdAt: number
  updatedAt: number
}

type UrbanScale = 
  | 'parcel'        // Individual lot
  | 'block'         // City block
  | 'neighborhood'  // ~1km²
  | 'district'      // Borough/district
  | 'city'          // Municipality
  | 'metropolitan'  // MSA/FUA
  | 'regional'      // Multi-city
  | 'national'      // Country-level

type CoordinateReferenceSystem = 'EPSG:4326' | 'EPSG:3857' | 'EPSG:32601' | string

// ── Analysis Sessions ───────────────────────────────────────
interface AnalysisSession {
  id: string
  when: number
  type: SessionType
  noteSlots: SessionNoteSlots
  datasets: DatasetRef[]
  completedFlows?: string[]
  completedRuns?: CompletedAnalysisRun[]
  snapshots?: SessionSnapshot[]
  sessionMsTotal?: number
}

type SessionType = 
  | 'baseline'           // Initial assessment
  | 'field_survey'       // On-site data collection
  | 'desk_study'         // Remote analysis
  | 'stakeholder'        // Community engagement
  | 'scenario_modeling'  // What-if simulation
  | 'monitoring'         // Longitudinal M&E
  | 'reporting'          // Final deliverable

interface SessionNoteSlots {
  objective: string       // What we're analyzing
  methodology: string     // How we're doing it
  findings: string        // Key results
  recommendations: string // Policy/design recommendations
  dataRefs: string        // Dataset citations
  limitations: string     // Caveats & uncertainty
}

// ── Datasets ────────────────────────────────────────────────
interface DatasetRef {
  id: string
  name: string
  source: DataSource
  format: GeoDataFormat
  layers?: string[]
  temporalExtent?: [string, string]  // ISO dates [start, end]
  spatialResolution?: string          // e.g., '30m', '1km', 'parcel'
  crs?: string
  license?: string
  url?: string
}

type DataSource = 
  | 'osm'              // OpenStreetMap
  | 'census'           // National census
  | 'sentinel'         // Copernicus Sentinel satellites
  | 'landsat'          // USGS Landsat
  | 'gtfs'             // Transit feeds
  | 'iot_sensor'       // Real-time sensors
  | 'lidar'            // Point clouds
  | 'cadastral'        // Property boundaries
  | 'field_survey'     // Manual collection
  | 'model_output'     // Simulation results
  | 'voxcity'          // VoxCity platform
  | 'custom'           // User-provided

type GeoDataFormat = 
  | 'geojson' | 'shapefile' | 'geopackage' | 'geotiff'
  | 'csv' | 'parquet' | 'netcdf' | 'las' | 'laz'
  | 'pbf' | 'mbtiles' | 'pmtiles' | 'cog'
  | 'gtfs' | 'osm_pbf' | 'cityjson' | 'ifc' | '3dtiles'

// ── Urban Tags ──────────────────────────────────────────────
type UrbanTag = 
  // Thematic domains
  | 'mobility' | 'transit' | 'pedestrian' | 'cycling'
  | 'land_use' | 'zoning' | 'density' | 'sprawl'
  | 'green_infra' | 'uli' | 'canopy' | 'biodiversity'
  | 'climate' | 'heat_island' | 'flood' | 'air_quality'
  | 'equity' | 'gentrification' | 'displacement' | 'segregation'
  | 'housing' | 'affordability' | 'vacancy'
  | 'economic' | 'employment' | 'retail' | 'innovation'
  | 'health' | 'noise' | 'safety' | 'crime'
  | 'water' | 'energy' | 'waste' | 'circular'
  | 'heritage' | 'tourism' | 'placemaking'
  | 'governance' | 'participation' | 'sdg'
  // Methods
  | 'network_analysis' | 'spatial_stats' | 'remote_sensing'
  | 'agent_based' | 'cellular_automata' | 'machine_learning'
  | 'voxcity' | '3d_modeling' | 'point_cloud'

// ── Indicators ──────────────────────────────────────────────
interface IndicatorResult {
  id: string
  kind: UrbanIndicatorKind
  when: number
  value: number
  unit: string
  geometry?: GeoJSON.Feature  // Spatial extent of measurement
  metadata?: Record<string, unknown>
}

type UrbanIndicatorKind = 
  // Morphology
  | 'FAR'           // Floor Area Ratio
  | 'GSI'           // Ground Space Index
  | 'OSR'           // Open Space Ratio
  | 'MXI'           // Mixed-Use Index
  | 'BCR'           // Building Coverage Ratio
  | 'building_height_mean'
  | 'building_height_std'
  | 'block_perimeter'
  | 'block_area'
  | 'street_connectivity'  // Intersection density, alpha/beta/gamma
  // Accessibility
  | 'walk_score'
  | 'transit_score'
  | 'bike_score'
  | 'isochrone_area'       // Area reachable in N minutes
  | 'gravity_accessibility'
  | 'cumulative_opportunities'
  | 'betweenness_centrality'
  | 'closeness_centrality'
  // Environment
  | 'NDVI'          // Normalized Difference Vegetation Index
  | 'NDBI'          // Normalized Difference Built-up Index
  | 'NDWI'          // Normalized Difference Water Index
  | 'LST'           // Land Surface Temperature
  | 'UHI_intensity' // Urban Heat Island intensity
  | 'tree_canopy_pct'
  | 'impervious_pct'
  | 'green_per_capita'
  // Socioeconomic
  | 'pop_density'
  | 'gini_coefficient'
  | 'shannon_entropy' // Land-use diversity
  | 'simpson_diversity'
  | 'jobs_housing_ratio'
  | 'housing_affordability_index'
  | 'vacancy_rate'
  | 'displacement_risk'
  // Infrastructure
  | 'road_density'
  | 'transit_frequency'
  | 'bike_lane_km'
  | 'parking_ratio'
  | 'utility_coverage'
  // Resilience
  | 'flood_exposure'
  | 'seismic_risk'
  | 'social_vulnerability_index'
  | 'adaptive_capacity'
  // SDG-aligned
  | 'sdg_11_1_1'    // Slum population ratio
  | 'sdg_11_2_1'    // Public transport access
  | 'sdg_11_3_1'    // Land consumption rate / pop growth rate
  | 'sdg_11_6_2'    // PM2.5 annual mean
  | 'sdg_11_7_1'    // Public open space share

// ── Analysis Cards (replaces psychiatric Cards) ─────────────
type SectionId = 
  | 'all'
  | 'project_scoping'       // Study area definition
  | 'baseline_assessment'   // Existing conditions
  | 'urban_indicators'      // Metrics & indices
  | 'kpi_dashboard'         // Benchmarking
  | 'vulnerability'         // Hazard & risk
  | 'rapid_assessment'      // Post-disaster rapid eval
  | 'typology'              // Urban form classification
  | 'intervention_design'   // Planning interventions
  | 'policy_instruments'    // Regulatory tools
  | 'implementation'        // Design specifications
  | 'change_detection'      // Temporal analysis
  | 'monitoring_eval'       // M&E frameworks
  | 'reports_briefs'        // Documentation
  | 'neighborhood_analysis' // Fine-grained local
  | 'regional_analysis'     // Metro/regional scale
  | 'transport_networks'    // Mobility infrastructure
  | 'gis_methods'           // Spatial analysis techniques
  | 'remote_sensing'        // Satellite & aerial imagery
  | 'data_engineering'      // ETL, pipelines, quality
  | 'stakeholder_engagement'// Participatory methods
  | 'handouts'              // Educational materials

interface Card {
  id: string
  title?: string
  sectionId: SectionId
  summary?: string
  tags: UrbanTag[]
  examples?: Example[]
  evidence?: EvidenceItem[]
  prompts?: PromptSpec[]
  datasets?: DatasetRef[]        // Required data
  tools?: string[]               // Python packages needed
  methodology?: string           // Scientific approach
  limitations?: string           // Known constraints
  sdgAlignment?: string[]        // SDG targets addressed
}

// ── Completed Analysis Run ──────────────────────────────────
interface CompletedAnalysisRun {
  runId?: string
  flowId: AnalyticalFlowId
  label: string
  insertedAt: number
  paragraph: string
  paragraphPreview?: string
  paragraphFull?: string
  mapOutputs?: MapOutput[]
  chartOutputs?: ChartOutput[]
  dataOutputs?: DataOutput[]
}

interface MapOutput {
  id: string
  type: 'choropleth' | 'heatmap' | 'isochrone' | 'point_cluster' | 'flow_map' | '3d_scene'
  geojson?: GeoJSON.FeatureCollection
  style?: Record<string, unknown>
  title: string
}

interface ChartOutput {
  id: string
  type: 'bar' | 'line' | 'scatter' | 'radar' | 'histogram' | 'boxplot' | 'treemap'
  data: unknown
  title: string
}

interface DataOutput {
  id: string
  format: 'csv' | 'geojson' | 'parquet'
  rows: number
  columns: string[]
  preview: unknown[]  // First 10 rows
}
```

---

## 5. GIS & Spatial Data Infrastructure

### 5.1 Map Component Architecture

A new `src/components/map/` module providing:

```
src/components/map/
├── MapContainer.tsx           # Main map wrapper (deck.gl + Mapbox GL JS)
├── MapControls.tsx            # Zoom, rotate, layer toggle, basemap selector
├── LayerManager.tsx           # Dynamic layer add/remove/style
├── DrawingTools.tsx           # Study area polygon drawing, measurement
├── MapLegend.tsx              # Dynamic legend for active layers
├── SpatialFilter.tsx          # Spatial query tools (buffer, clip, intersect)
├── GeocoderSearch.tsx         # Address/place search with Nominatim/Mapbox
├── CoordinateDisplay.tsx      # Cursor position in multiple CRS
├── ScaleBar.tsx               # Dynamic scale bar
├── hooks/
│   ├── useMapState.ts         # Map viewport state (center, zoom, bearing, pitch)
│   ├── useLayerStack.ts       # Layer ordering & visibility
│   ├── useSpatialQuery.ts     # Spatial operations on features
│   ├── useGeoJSONLoader.ts    # Async GeoJSON fetch/parse
│   └── useMapExport.ts        # Export map as PNG/PDF
├── layers/
│   ├── ChoroplethLayer.tsx    # Thematic polygon fills
│   ├── HeatmapLayer.tsx       # Kernel density
│   ├── IsochroneLayer.tsx     # Travel-time contours
│   ├── PointClusterLayer.tsx  # Clustered markers
│   ├── FlowMapLayer.tsx       # OD flow lines (arc layer)
│   ├── BuildingLayer.tsx      # 3D extruded buildings
│   ├── RasterTileLayer.tsx    # WMS/WMTS/COG raster overlays
│   ├── VoxelLayer.tsx         # VoxCity voxel rendering
│   └── NetworkLayer.tsx       # Street network with edge weights
└── utils/
    ├── projections.ts         # CRS transformations (proj4)
    ├── turfHelpers.ts         # Turf.js spatial operations
    ├── tileUtils.ts           # Tile math, bbox ↔ tiles
    └── colorScales.ts         # d3-scale-chromatic integration
```

### 5.2 Supported GIS Formats

| Format | Read | Write | Library |
|---|---|---|---|
| GeoJSON | ✅ | ✅ | Native |
| Shapefile | ✅ | ✅ | shpjs / loam (WASM) |
| GeoPackage | ✅ | ✅ | sql.js + gpkg spec |
| GeoTIFF / COG | ✅ | — | geotiff.js |
| CSV (w/ lat/lon) | ✅ | ✅ | PapaParse + coord detection |
| GeoParquet | ✅ | — | parquet-wasm |
| PMTiles | ✅ | — | pmtiles |
| CityJSON | ✅ | — | cityjson-threejs-loader |
| 3D Tiles | ✅ | — | 3d-tiles-renderer |
| LAS/LAZ | ✅ | — | copc.js / potree |
| GTFS | ✅ | — | Custom parser |
| OSM PBF | ✅ | — | osm-pbf-parser-node (via Python) |
| NetCDF | ✅ | — | netcdfjs |

### 5.3 Spatial Operations (Client-Side)

| Operation | Library | Description |
|---|---|---|
| Buffer, Union, Intersect, Difference | **Turf.js** | Geometric operations |
| Point-in-polygon | **Turf.js** | Spatial join |
| Voronoi / Delaunay | **Turf.js / d3-delaunay** | Tessellation |
| Convex/Concave Hull | **Turf.js** | Boundary generation |
| Spatial Clustering | **Turf.js / supercluster** | DBSCAN, K-means on features |
| Network Routing | **OSRM (API) / Valhalla** | Shortest path, isochrones |
| Raster Algebra | **geotiff.js + custom** | Band math (NDVI, NDBI, etc.) |
| CRS Transformation | **proj4** | Reproject geometries |
| Geocoding | **Nominatim / Mapbox** | Address ↔ coordinates |
| Reverse Geocoding | **Nominatim / Mapbox** | Coordinate → place name |

### 5.4 Basemap Options

| Provider | Styles | Auth | Cost |
|---|---|---|---|
| **Google Maps** ⭐ | Roadmap, Satellite, Hybrid, Terrain, Cloud-styled | API Key | Free tier: 28,500 loads/mo + $200 credit |
| **Google Photorealistic 3D** ⭐ | Immersive 3D tiles | API Key | Map Tiles API pricing |
| **OpenStreetMap** | Standard, Humanitarian | None (free) | Free |
| **Mapbox** | Streets, Satellite, Dark, Light, Outdoors, Navigation | Access Token | Free tier: 50K loads/mo |
| **Stamen / Stadia** | Toner, Terrain, Watercolor | API Key | Free tier available |
| **ESRI** | World Imagery, World Topo, World Street | API Key | Limited free |
| **CartoDB / CARTO** | Positron, Dark Matter, Voyager | None / API Key | Free |
| **Thunderforest** | OpenCycleMap, Transport, Landscape | API Key | Free tier: 150K tiles/mo |
| **HERE** | Normal, Satellite, Terrain, Traffic | API Key | Free tier: 250K/mo |
| **Custom** | WMS / WMTS / TMS / XYZ endpoints | Variable | Variable |

### 5.5 Multi-Provider Map Architecture

```typescript
// Users can switch basemap provider at any time
// Analytical layers (deck.gl) remain independent of basemap choice

interface MapProviderConfig {
  activeProvider: 'google' | 'mapbox' | 'osm' | 'esri' | 'custom'
  google?: {
    apiKey: string
    mapId: string          // Cloud-based map styling
    version: 'weekly' | 'quarterly' | 'beta'
    language: string
    region: string
  }
  mapbox?: {
    accessToken: string
    styleUrl: string
  }
  custom?: {
    tileUrl: string        // {z}/{x}/{y} template
    attribution: string
    maxZoom: number
  }
}
```

### 5.6 Advanced Map Features

| Feature | Description |
|---|---|
| **Swipe Comparison** | Side-by-side map with draggable divider (before/after) |
| **Synchronized Dual View** | Two maps locked in sync (e.g., 2D + 3D, or basemap + analysis) |
| **Bookmarks / Viewpoints** | Save and recall specific map positions |
| **Map Annotations** | Draw, label, measure directly on the map |
| **Print Layout Composer** | QGIS-style print layout with north arrow, scale bar, legend, title |
| **Animated Playback** | Time-series data as animated map (temporal slider + play) |
| **Minimap / Inset Map** | Overview locator map in corner |
| **Screenshot Export** | High-DPI PNG/SVG export with all layers |
| **PDF Map Export** | Multi-page atlas generation |
| **Tile Caching** | IndexedDB offline tile cache for fieldwork |

---

## 6. Google Maps Platform Integration

> **NEW in v2.0** — Full Google Maps Platform integration providing Street View, Places, Directions, Elevation, Geocoding, and Photorealistic 3D Tiles.

### 6.1 Architecture Overview

Google Maps Platform is integrated as a **first-class map provider** alongside deck.gl/Mapbox, offering superior commercial data quality (real-time traffic, indoor maps, Street View panoramas) that open-source alternatives cannot match.

```
src/components/map/google/
├── GoogleMapsProvider.tsx          # @vis.gl/react-google-maps wrapper with API key management
├── GoogleMapView.tsx               # Primary Google Maps view with deck.gl overlay
├── StreetViewPanel.tsx             # Embedded Street View panorama (split-screen or overlay)
├── StreetViewTimeMachine.tsx       # Historical Street View imagery comparison
├── GooglePlacesSearch.tsx          # Places Autocomplete + Place Details
├── GoogleDirections.tsx            # Directions API with traffic-aware routing
├── GoogleElevationProfile.tsx      # Elevation API for terrain cross-sections
├── Google3DTiles.tsx               # Photorealistic 3D Tiles renderer (Map Tiles API)
├── GoogleTrafficLayer.tsx          # Real-time traffic overlay
├── GoogleTransitLayer.tsx          # Transit routes overlay
├── GoogleBicyclingLayer.tsx        # Cycling infrastructure overlay
├── GoogleAerialView.tsx            # Aerial View API (cinematic 3D flyover)
├── GoogleSolarAPI.tsx              # Solar API for rooftop solar potential
├── GoogleAirQuality.tsx            # Air Quality API heatmaps
├── GooglePollenAPI.tsx             # Environmental pollen data
├── hooks/
│   ├── useGoogleMapsAPI.ts         # API loader with key management & quota tracking
│   ├── useStreetView.ts            # Street View panorama state & navigation
│   ├── usePlacesAutocomplete.ts    # Debounced autocomplete with session tokens
│   ├── useDirectionsService.ts     # Multi-waypoint route computation
│   ├── useElevationService.ts      # Path/location elevation queries
│   ├── useGeocoder.ts              # Forward/reverse geocoding via Google
│   ├── useDistanceMatrix.ts        # N×M travel time/distance matrix
│   ├── useGoogleTraffic.ts         # Real-time & predictive traffic data
│   └── usePlaceDetails.ts          # Detailed POI metadata (hours, ratings, photos)
├── layers/
│   ├── GoogleDeckGLOverlay.tsx      # deck.gl GoogleMapsOverlay for hybrid rendering
│   ├── DataDrivenStyling.tsx        # Boundary/feature data-driven styling
│   └── GoogleHeatmapLayer.tsx       # Google Maps Visualization heatmap
└── utils/
    ├── apiKeyManager.ts             # Encrypted key storage, rotation, quota alerts
    ├── quotaTracker.ts              # Per-API usage tracking & budget limits
    └── googleToGeoJSON.ts           # Convert Google geometries ↔ GeoJSON
```

### 6.2 Google Maps APIs Utilized

| API | Purpose | Use Case in Urban Analytics |
|---|---|---|
| **Maps JavaScript API** | Base map rendering | Primary map view with custom styling |
| **Street View Static/Dynamic** | Street-level imagery | Urban audit, streetscape quality assessment, building facade analysis |
| **Street View Time Machine** | Historical imagery | Temporal change documentation, before/after intervention |
| **Places API (New)** | POI search & details | Amenity density analysis, Walk Score validation, service coverage |
| **Places Autocomplete** | Location search | Study area selection, address lookup |
| **Directions API** | Route computation | Commute analysis, route optimization, travel time matrices |
| **Distance Matrix API** | N×M travel times | Accessibility matrix computation, OD cost matrix |
| **Elevation API** | Terrain data | Slope analysis, flood risk, walkability adjustment |
| **Geocoding API** | Address ↔ coords | Batch geocoding of survey data, address normalization |
| **Map Tiles API** | Photorealistic 3D | Immersive urban visualization, stakeholder presentation |
| **Aerial View API** | Cinematic 3D flyover | Project area overview, context videos |
| **Solar API** | Rooftop solar potential | Building-level solar capacity, renewable energy planning |
| **Air Quality API** | Pollutant concentrations | Environmental health mapping, exposure assessment |
| **Pollen API** | Allergen levels | Green infrastructure health impact |
| **Routes API (Advanced)** | Traffic-aware routing | Real-time ETA, congestion analysis, detour modeling |
| **Roads API** | Road snapping & speed | GPS trace correction, speed limit data |

### 6.3 Google Maps + deck.gl Hybrid Architecture

```typescript
// Hybrid rendering: Google Maps as basemap + deck.gl analytical layers on top
// Uses @vis.gl/react-google-maps + @deck.gl/google-maps interop module

interface HybridMapConfig {
  provider: 'google' | 'mapbox' | 'osm'     // User-switchable basemap provider
  googleMapId: string                         // Cloud-based map styling
  deckGLLayers: DeckGLLayerConfig[]           // Analytical overlays
  interleaved: boolean                        // true = deck.gl interleaved with Google vector tiles
  tilt: number                                // 0-67.5° for Google, 0-60° for Mapbox
  heading: number                             // Camera bearing
}

// Google Maps Overlay allows deck.gl layers to render INSIDE Google Maps' WebGL context
// This means: correct occlusion with Google 3D buildings, shared lighting model
import { GoogleMapsOverlay } from '@deck.gl/google-maps'
```

### 6.4 Street View Integration for Urban Audit

Street View is integrated as a **first-class analytical tool**, not just visualization:

```typescript
interface StreetViewAuditConfig {
  mode: 'manual' | 'systematic' | 'random_sample'
  // Systematic: walk every N meters along street network
  systematicSpacing: number               // meters between audit points
  sampleSize?: number                     // for random_sample mode
  networkFilter?: {
    roadTypes: ('primary' | 'secondary' | 'tertiary' | 'residential')[]
    excludeHighway: boolean
    withinBoundary?: GeoJSON.Polygon
  }
  auditCriteria: StreetViewAuditCriterion[]
  exportFormat: 'csv' | 'geojson' | 'geopackage'
}

interface StreetViewAuditCriterion {
  id: string
  category: 'sidewalk' | 'crossing' | 'vegetation' | 'building' | 'street_furniture' | 'safety' | 'accessibility'
  label: string
  type: 'boolean' | 'likert_5' | 'count' | 'text'
  description: string
}

// Pre-built audit templates:
// - Walkability Audit (sidewalk width, condition, obstacles, crossings, shade)
// - Cycling Infrastructure Audit (lane type, width, separation, surface)
// - Streetscape Quality Audit (facades, signage, lighting, cleanliness)
// - Accessibility Audit (curb cuts, tactile paving, ramp availability)
// - Green Audit (tree count, canopy coverage, planting quality)
// - Safety Audit (lighting, visibility, sight lines, traffic calming)
```

### 6.5 Google Solar API for Renewable Energy Planning

```typescript
interface SolarAnalysisConfig {
  studyArea: GeoJSON.Polygon
  buildingFootprints?: GeoJSON.FeatureCollection  // If available, per-building
  analysisType: 'rooftop_potential' | 'community_solar_siting' | 'shading_analysis'
  parameters: {
    panelCapacityWatts: number       // Typical: 400W
    panelEfficiency: number           // Typical: 0.20-0.22
    systemLosses: number              // Typical: 0.14
    utilityRate: number               // $/kWh for payback calculation
    incentiveRate?: number            // $/kWh for feed-in tariff
  }
}

interface SolarResult {
  buildingId: string
  roofAreaM2: number
  usableAreaM2: number               // After excluding obstructions
  solarPanelCount: number
  yearlyEnergyKwh: number
  yearlyRevenueSavings: number
  paybackYears: number
  monthlyBreakdown: { month: number; kwhGenerated: number; sunshineHours: number }[]
  maxSunshineHoursPerYear: number
  carbonOffsetKgPerYear: number
  geometry: GeoJSON.Feature           // Building footprint with solar data
}
```

### 6.6 Google Maps Configuration & Security

```typescript
interface GoogleMapsConfig {
  apiKey: string                        // Encrypted in useAiConfigStore pattern
  mapId: string                         // Cloud-styled map ID
  quotaBudget: {
    dailyMapLoads: number               // Maps JavaScript API loads
    dailyGeocodingRequests: number
    dailyDirectionsRequests: number
    dailyPlacesRequests: number
    dailyStreetViewPanoramas: number
    monthlyBudgetUSD: number            // Hard spending cap
  }
  restrictions: {
    httpReferrers: string[]             // API key restriction
    allowedAPIs: string[]               // Only enable needed APIs
  }
  caching: {
    geocodingCacheTTL: number           // Cache geocoding results (seconds)
    directionsCacheTTL: number          // Cache route results
    placesCacheTTL: number              // Cache place details
    maxCacheEntries: number
  }
}
```

---

## 7. Advanced GIS Engine & WebGPU Compute

> **NEW in v2.0** — GPU-accelerated spatial computation, WASM-powered geoprocessing, and enterprise-grade GIS capabilities.

### 7.1 WebGPU Spatial Compute Pipeline

Leverage WebGPU (available in Chrome 113+, Firefox 128+, Edge) for massive parallel geospatial computation directly in the browser:

```
src/engine/gpu/
├── WebGPUContext.ts                # GPU device initialization & capability detection
├── SpatialComputeEngine.ts         # High-level API for GPU-accelerated ops
├── shaders/
│   ├── rasterOps.wgsl              # Raster algebra (NDVI, NDBI, band math)
│   ├── kernelDensity.wgsl          # KDE for heatmaps (millions of points)
│   ├── viewshed.wgsl               # Viewshed analysis from DEM
│   ├── flowAccumulation.wgsl       # Hydrological flow direction + accumulation
│   ├── hillshade.wgsl              # DEM hillshade rendering
│   ├── solarExposure.wgsl          # Per-pixel solar radiation from DSM
│   ├── costDistance.wgsl           # Least-cost path on raster
│   ├── spatialConvolution.wgsl     # Focal statistics (mean, max, median kernel)
│   ├── morphologicalOps.wgsl       # Erosion, dilation, opening, closing
│   └── pointInPolygon.wgsl         # Massively parallel point-in-polygon test
├── buffers/
│   ├── RasterBuffer.ts             # GPU-backed raster tile management
│   ├── FeatureBuffer.ts            # GPU vertex/attribute buffers for vectors
│   └── IndexBuffer.ts              # Spatial index (R-tree) on GPU
└── pipelines/
    ├── RasterAlgebraPipeline.ts     # Band math pipeline orchestrator
    ├── TerrainAnalysisPipeline.ts   # Slope, aspect, curvature, TPI, TRI
    ├── HydrologicalPipeline.ts      # Flow direction → accumulation → watershed
    ├── ViewshedPipeline.ts          # Multi-observer viewshed with earth curvature
    ├── InterpolationPipeline.ts     # IDW, kriging on GPU
    └── ClassificationPipeline.ts    # K-means, ISODATA pixel classification
```

### 7.2 WebGPU Performance Targets

| Operation | CPU (JS) | WebGPU | Speedup |
|---|---|---|---|
| NDVI on 10,980×10,980 Sentinel-2 tile | ~4.2s | ~45ms | **~93×** |
| KDE heatmap (1M points) | ~8.5s | ~120ms | **~71×** |
| Viewshed from DEM (4096×4096) | ~12s | ~200ms | **~60×** |
| Flow accumulation (4096×4096) | ~18s | ~350ms | **~51×** |
| Point-in-polygon (1M pts × 50K polys) | ~45s | ~600ms | **~75×** |
| Hillshade rendering (8192×8192) | ~6s | ~80ms | **~75×** |
| Slope + Aspect + Curvature composite | ~9s | ~150ms | **~60×** |

### 7.3 WASM Geoprocessing Engine

For operations that need exact geometry (topology-preserving, coordinate-precise), use WASM-compiled GEOS/JTS:

```
src/engine/wasm/
├── GEOSEngine.ts                   # GEOS compiled to WASM via Emscripten
├── PROJEngine.ts                   # PROJ library in WASM for accurate CRS transforms
├── GDALLite.ts                     # Minimal GDAL subset for format I/O
├── SpatialIndex.ts                 # R-tree & quad-tree in WASM
├── TopologyEngine.ts               # GEOS topology operations (snap, clean, validate)
└── workers/
    ├── geoprocessWorker.ts          # Web Worker for heavy vector operations
    ├── rasterWorker.ts              # Web Worker for raster I/O and transforms
    └── indexWorker.ts               # Web Worker for spatial index construction
```

**WASM-Powered Operations:**

| Operation | Description | Precision |
|---|---|---|
| **Topology-Preserving Simplification** | Douglas-Peucker with shared-edge handling | Exact (no gaps/overlaps) |
| **Polygon Overlay** | Union, intersection, difference, symmetric difference | Double-precision |
| **Snap Rounding** | Robustness for degenerate geometry | IEEE 754 compliant |
| **Buffer (variable-width)** | Offset curves with end-cap styles | Sub-mm accuracy |
| **Voronoi / Constrained Delaunay** | Triangulation with boundary constraints | Topologically correct |
| **Coordinate Transformation** | Full PROJ pipeline (datum shifts, grid corrections) | Survey-grade (mm) |
| **Raster Warp** | Reprojection with resampling (bilinear, cubic, lanczos) | Sub-pixel accuracy |

### 7.4 Advanced Vector Tile Engine

Real-time vector tile rendering for massive datasets without server infrastructure:

```typescript
interface VectorTileEngine {
  // Generate MVT tiles on-the-fly from local GeoJSON/GeoPackage
  createTileIndex(source: GeoJSON.FeatureCollection, options: {
    maxZoom: number           // 0-22
    tolerance: number          // Simplification tolerance
    extent: number             // Tile extent (4096 for high-res)
    buffer: number             // Tile buffer (64px default)
    indexMaxZoom: number       // Spatial index build zoom
    promoteId?: string         // Feature property to use as ID
    generateId?: boolean       // Auto-generate IDs
  }): TileIndex

  // Stream tiles as user pans/zooms
  getTile(z: number, x: number, y: number): Uint8Array  // MVT binary

  // Attribute queries on tiles
  queryRenderedFeatures(point: [number, number], layers: string[]): GeoJSON.Feature[]
  querySourceFeatures(filter: Expression): GeoJSON.Feature[]
}
```

### 7.5 Computational Geometry Toolkit

Advanced geometric algorithms available in-browser:

| Algorithm | Use Case | Implementation |
|---|---|---|
| **Weighted Voronoi** | Service area allocation, market areas | CGAL via WASM |
| **Minkowski Sum** | Buffer with complex structuring elements | GEOS WASM |
| **Straight Skeleton** | Roof generation, shrink polygons | Custom WASM |
| **Visibility Graph** | Pedestrian routing in open spaces | Custom JS |
| **Alpha Shape** | Concave hull from point cloud | Turf.js + custom |
| **Hausdorff Distance** | Shape comparison, change detection | GEOS WASM |
| **Fréchet Distance** | Trajectory similarity | Custom JS |
| **Line-of-Sight** | Inter-visibility between points | DEM + ray casting |
| **3D Boolean Ops** | CSG on building models | three-csg-ts |
| **Isovist (2D Viewshed)** | Space Syntax visibility analysis | Custom GPU shader |

### 7.6 Terrain Analysis Suite

```typescript
interface TerrainAnalysis {
  // Primary derivatives
  slope(dem: RasterBuffer, unit: 'degrees' | 'percent' | 'radians'): RasterBuffer
  aspect(dem: RasterBuffer, format: 'compass' | 'cartesian'): RasterBuffer
  curvature(dem: RasterBuffer, type: 'plan' | 'profile' | 'tangential' | 'mean'): RasterBuffer

  // Morphometric features
  topographicPositionIndex(dem: RasterBuffer, innerRadius: number, outerRadius: number): RasterBuffer
  terrainRuggednessIndex(dem: RasterBuffer): RasterBuffer
  topographicWetnessIndex(dem: RasterBuffer): RasterBuffer   // ln(a / tan(β))
  convergenceIndex(dem: RasterBuffer): RasterBuffer
  landformClassification(dem: RasterBuffer): RasterBuffer     // Iwahashi & Pike (2007)

  // Hydrology
  fillSinks(dem: RasterBuffer, method: 'planchon-darboux' | 'wang-liu'): RasterBuffer
  flowDirection(dem: RasterBuffer, algorithm: 'D8' | 'Dinf' | 'MFD'): RasterBuffer
  flowAccumulation(flowDir: RasterBuffer): RasterBuffer
  watershedDelineation(flowDir: RasterBuffer, pourPoints: GeoJSON.Point[]): RasterBuffer
  streamOrder(streams: RasterBuffer, method: 'strahler' | 'shreve'): RasterBuffer
  catchmentArea(dem: RasterBuffer, outlet: GeoJSON.Point): GeoJSON.Polygon

  // Visibility
  viewshed(dem: RasterBuffer, observer: ViewshedParams): RasterBuffer
  multiViewshed(dem: RasterBuffer, observers: ViewshedParams[]): RasterBuffer
  totalViewshed(dem: RasterBuffer, cellSamplePct: number): RasterBuffer  // Cumulative visibility

  // Solar
  solarRadiation(dem: RasterBuffer, params: SolarParams): RasterBuffer   // Insolation model
  hillshade(dem: RasterBuffer, azimuth: number, altitude: number): RasterBuffer
  multiDirectionalHillshade(dem: RasterBuffer): RasterBuffer             // 6-direction composite
}

interface ViewshedParams {
  location: [number, number]
  observerHeight: number       // meters above ground
  targetHeight: number          // meters above ground
  maxDistance: number           // meters
  refractivity?: number         // atmospheric refraction (0.13 default)
  earthCurvature: boolean       // account for earth curvature
}

interface SolarParams {
  startDate: string             // ISO date
  endDate: string
  timeStep: 'hourly' | 'daily' | 'monthly'
  latitude: number
  atmosphericTransmittance: number  // 0.5-0.8 typical
  diffuseProportion: number         // 0.2-0.4 typical
}
```

### 7.7 Network Analysis Engine (Client-Side)

Full graph-based network analysis without server dependency:

```typescript
interface NetworkEngine {
  // Graph construction
  buildFromOSM(bbox: BoundingBox, mode: NetworkMode): NetworkGraph
  buildFromGeoJSON(edges: GeoJSON.FeatureCollection, nodes?: GeoJSON.FeatureCollection): NetworkGraph
  buildFromGTFS(feed: GTFSFeed, date: string): TransitGraph

  // Routing
  shortestPath(origin: NodeId, destination: NodeId, weight: WeightFn): Route
  kShortestPaths(origin: NodeId, destination: NodeId, k: number): Route[]
  travelingSalesman(nodes: NodeId[], heuristic: 'nearest' | 'christofides'): Route

  // Service areas
  isochrone(origin: NodeId, thresholds: number[], mode: NetworkMode): GeoJSON.FeatureCollection
  isodistance(origin: NodeId, distances: number[]): GeoJSON.FeatureCollection

  // Accessibility
  gravityAccessibility(origins: NodeId[], destinations: POI[], beta: number): AccessResult[]
  cumulativeOpportunities(origins: NodeId[], pois: POI[], threshold: number): number[]
  twoStepFloatingCatchment(demand: DemandPoint[], supply: SupplyPoint[], threshold: number): number[]

  // Centrality
  betweennessCentrality(weight?: WeightFn): Map<EdgeId, number>
  closenessCentrality(): Map<NodeId, number>
  straightness(): Map<NodeId, number>
  reachCentrality(radius: number): Map<NodeId, number>

  // Space Syntax metrics
  integration(radius: number | 'global', type: 'metric' | 'angular' | 'topological'): Map<SegmentId, number>
  choice(radius: number | 'global', type: 'metric' | 'angular' | 'topological'): Map<SegmentId, number>
  totalDepth(radius: number): Map<SegmentId, number>
  NACH(radius: number): Map<SegmentId, number>  // Normalized Angular Choice
  NAIN(radius: number): Map<SegmentId, number>  // Normalized Angular Integration

  // Connectivity
  connectedComponents(): NodeId[][]
  bridgeEdges(): EdgeId[]
  articulationPoints(): NodeId[]
  meshedness(): number                           // α = (e - n + 1) / (2n - 5)
  circuitry(): number                            // e / n
}

type NetworkMode = 'walk' | 'cycle' | 'drive' | 'transit' | 'freight'

interface NetworkGraph {
  nodes: Map<NodeId, GraphNode>
  edges: Map<EdgeId, GraphEdge>
  spatialIndex: RBush<GraphNode>   // R-tree for nearest-node lookup
  crs: string
}

interface GraphNode {
  id: NodeId
  x: number; y: number; z?: number
  degree: number
  type?: 'intersection' | 'dead_end' | 'transit_stop' | 'poi'
}

interface GraphEdge {
  id: EdgeId
  source: NodeId
  target: NodeId
  weight: Record<NetworkMode, number>  // Travel time per mode
  length: number                        // meters
  geometry: GeoJSON.LineString
  osmTags?: Record<string, string>
  speedLimit?: number
  laneCount?: number
  bikeInfra?: 'lane' | 'track' | 'shared' | 'none'
  sidewalk?: 'both' | 'left' | 'right' | 'none'
  surface?: string
  gradient?: number                     // percent slope
}
```

---

## 8. VoxCity Integration

### 8.1 Overview

[VoxCity](https://www.voxcity.org/) is a voxel-based urban environment simulation platform. Integration enables:

- **3D Voxel Grid Loading**: Import VoxCity `.vox` / `.csv` voxel grids
- **Environmental Simulation Overlays**: Solar radiation, wind comfort, noise propagation, thermal comfort
- **Scenario Comparison**: Side-by-side before/after urban interventions
- **Real-Time Rendering**: three.js-based voxel visualization

### 8.2 VoxCity Module Structure

```
src/features/urbanAnalytics/voxcity/
├── VoxCityViewer.tsx          # 3D voxel scene (three.js / react-three-fiber)
├── VoxCityControls.tsx        # Camera orbit, slice planes, layer toggle
├── VoxGridLoader.ts           # Parse VoxCity grids (.vox, .csv, .json)
├── SimulationOverlay.tsx      # Color-mapped simulation results
├── ScenarioCompare.tsx        # Split-screen A/B comparison
├── VoxCityExport.tsx          # Export scenes as .glb, .png, video
├── types.ts                   # VoxCity data types
├── hooks/
│   ├── useVoxScene.ts         # Scene state management
│   ├── useSimResults.ts       # Load & map simulation outputs
│   └── useVoxSlicing.ts       # Horizontal/vertical slice planes
└── simulations/
    ├── solarRadiation.ts      # Annual/monthly solar exposure
    ├── windComfort.ts         # Pedestrian-level wind (Lawson criteria)
    ├── noiseMap.ts            # Traffic/rail noise propagation
    ├── thermalComfort.ts      # UTCI, PET, MRT
    ├── skyViewFactor.ts       # SVF computation from voxel geometry
    ├── daylightAnalysis.ts    # Indoor daylight factor
    └── shadowStudy.ts         # Shadow casting & duration
```

### 8.3 VoxCity Data Types

```typescript
interface VoxelGrid {
  origin: [number, number, number]     // World coordinates (x, y, z)
  resolution: number                    // Voxel size in meters
  dimensions: [number, number, number]  // Grid size (nx, ny, nz)
  voxels: Uint8Array                    // Material IDs (0=air, 1=ground, 2=building, ...)
  materials: VoxelMaterial[]
  metadata?: {
    crs?: string
    bbox?: BoundingBox
    buildingIds?: Map<number, string>   // Voxel ID → building ID
    source?: string
  }
}

interface VoxelMaterial {
  id: number
  label: string       // 'air', 'ground', 'building', 'vegetation', 'water', 'road'
  color: string        // Hex color
  opacity: number
  category: 'natural' | 'built' | 'infrastructure' | 'void'
}

interface SimulationResult {
  id: string
  type: SimulationType
  gridDimensions: [number, number, number]
  values: Float32Array  // Per-voxel scalar values  
  unit: string          // 'kWh/m²', 'm/s', 'dB', '°C', 'ratio'
  colorMap: string      // Viridis, Plasma, RdYlBu, etc.
  range: [number, number]
  timestamp?: string
}

type SimulationType = 
  | 'solar_radiation'
  | 'wind_speed'
  | 'wind_comfort'
  | 'noise_level'
  | 'thermal_comfort_utci'
  | 'thermal_comfort_pet'
  | 'sky_view_factor'
  | 'daylight_factor'
  | 'shadow_hours'
  | 'ventilation_potential'
```

### 8.4 VoxCity Workflow

1. **Import**: Load VoxCity project → voxel grid
2. **Visualize**: 3D scene with material coloring, camera controls
3. **Simulate**: Run environmental analysis (calls Python backend or pre-computed results)
4. **Overlay**: Map simulation scalars onto voxels with color ramp
5. **Slice**: Cut horizontal planes to inspect specific floors/heights
6. **Compare**: Side-by-side scenarios (existing vs. proposed)
7. **Export**: Screenshots, videos, glTF, summary statistics

---

## 9. Python Urban Data Analysis Environment

### 9.1 Architecture

The IDE terminal integrates with a local Python environment for heavy-duty spatial analysis:

```
src/features/urbanAnalytics/python/
├── PythonEnvironmentManager.tsx   # Conda/venv detection, activation
├── PackageManager.tsx             # pip install UI for urban packages
├── NotebookRunner.tsx             # Jupyter notebook execution bridge
├── ScriptTemplates.tsx            # Pre-built analysis scripts
├── PythonOutputViewer.tsx         # Display matplotlib/folium/plotly output
├── DataBridge.ts                  # JSON/GeoJSON exchange between IDE ↔ Python
├── hooks/
│   ├── usePythonExec.ts           # Execute Python scripts from terminal
│   ├── useCondaEnv.ts             # Manage conda environments
│   └── useJupyterKernel.ts        # IPykernel communication
└── templates/
    ├── accessibility_analysis.py
    ├── land_use_classification.py
    ├── network_analysis.py
    ├── remote_sensing_ndvi.py
    ├── spatial_autocorrelation.py
    ├── urban_morphology.py
    ├── voxcity_solar_analysis.py
    ├── gentrification_index.py
    ├── sdg_11_indicators.py
    └── transit_accessibility.py
```

### 9.2 Required Python Packages (Environment Definition)

The platform provides a curated `environment.yml` / `requirements.txt`:

#### Core Geospatial Stack

| Package | Purpose |
|---|---|
| **geopandas** | Spatial DataFrames (vector geometry + attributes) |
| **shapely** | Geometric operations (GEOS wrapper) |
| **fiona** | OGR-based vector I/O (Shapefile, GeoPackage, etc.) |
| **pyproj** | CRS transformations (PROJ wrapper) |
| **rasterio** | Raster I/O (GeoTIFF, COG, NetCDF) |
| **rasterstats** | Zonal statistics (raster × vector) |
| **xarray** | N-dimensional array analysis (NetCDF, Zarr) |
| **dask-geopandas** | Distributed spatial analysis |

#### Network & Mobility Analysis

| Package | Purpose |
|---|---|
| **osmnx** | Street network download & analysis from OSM |
| **networkx** | Graph theory & network metrics |
| **pandana** | Network accessibility analysis (POI gravity) |
| **urbanaccess** | Transit + walk network integration |
| **r5py** | Multi-modal routing (R5 engine via Java) |
| **gtfs-kit** | GTFS feed parsing & validation |
| **momepy** | Urban morphology measuring toolkit |

#### Remote Sensing & Earth Observation

| Package | Purpose |
|---|---|
| **rioxarray** | Rasterio + xarray integration |
| **sentinelsat** / **pystac-client** | Copernicus / STAC satellite data access |
| **earthengine-api** | Google Earth Engine Python API |
| **verde** | Spatial data interpolation & gridding |
| **scikit-image** | Image processing for classification |
| **spectral** | Hyperspectral image analysis |

#### Spatial Statistics & ML

| Package | Purpose |
|---|---|
| **pysal** (libpysal, esda, spreg, splot) | Spatial statistics suite |
| **pointpats** | Point pattern analysis |
| **tobler** | Areal interpolation |
| **mapclassify** | Choropleth classification schemes |
| **scikit-learn** | ML for urban classification |
| **xgboost / lightgbm** | Gradient boosting for prediction |
| **statsmodels** | Regression, time series |

#### Simulation & ABM

| Package | Purpose |
|---|---|
| **mesa** | Agent-based modeling framework |
| **voxcity** | VoxCity Python API for voxel simulations |
| **sumo** | Traffic microsimulation interface |
| **UrbanSim** | Land-use / real-estate simulation |

#### Visualization

| Package | Purpose |
|---|---|
| **matplotlib** | Static plots & maps |
| **folium** | Interactive Leaflet maps |
| **plotly** | Interactive charts & 3D |
| **pydeck** | deck.gl integration from Python |
| **contextily** | Basemap tiles for matplotlib |
| **datashader** | Big data rasterization |
| **keplergl** | Uber's geospatial analysis tool |

#### Data Engineering

| Package | Purpose |
|---|---|
| **pandas** | Tabular data manipulation |
| **polars** | Fast DataFrame library |
| **duckdb** | In-process analytical SQL |
| **h3-py** | Uber H3 hexagonal grid system |
| **s2geometry** | S2 spherical geometry |
| **geopy** | Geocoding services |
| **overpy** | Overpass API for OSM queries |
| **cenpy** | US Census data access |
| **wbgapi** | World Bank data API |

### 9.3 Script Templates

Each template is a self-contained, documented Python script with:
- Clear docstring explaining methodology and scientific background
- Configurable parameters (study area bbox, CRS, thresholds)
- Data acquisition step (OSM download, API query, file load)
- Analysis pipeline (processing, computation, validation)
- Output generation (maps, charts, GeoJSON, CSV)
- Literature references

Example template categories:

| Template | Description | Key Packages |
|---|---|---|
| **Walkability Index** | Multi-criteria walk score from street network, land use, slope | osmnx, pandana, geopandas |
| **15-Minute City Analysis** | Essential service accessibility within 15 min walk/cycle | osmnx, pandana, networkx |
| **Urban Heat Island Mapping** | LST from Landsat/Sentinel + NDVI correlation | rasterio, xarray, earthengine-api |
| **Gentrification Early Warning** | Composite index: rent change, demographic shift, investment | geopandas, pysal, scikit-learn |
| **Street Network Morphology** | Centrality, connectivity, dead-end ratio, block metrics | osmnx, momepy, networkx |
| **Land Use Change Detection** | Multi-temporal classification from satellite imagery | rasterio, scikit-learn, scikit-image |
| **Transit Equity Analysis** | GTFS-based service frequency × demographics | gtfs-kit, geopandas, pysal |
| **Solar Potential Assessment** | Building rooftop solar via VoxCity + radiation model | voxcity, pvlib, rasterio |
| **Flood Risk Mapping** | DEM-based flow accumulation + land cover permeability | rasterio, whitebox, geopandas |
| **Spatial Autocorrelation** | Moran's I, LISA clusters, Getis-Ord Gi* | pysal (esda, splot), geopandas |

---

## 10. Center Panel Redesign

### 10.1 Tab Renaming

| Current Tab | New Tab | Purpose |
|---|---|---|
| Registry | **Projects** | Study area / project management |
| New Patient | **New Project** | Create new analysis project |
| Guide | **Methods** | Methodology reference guides |
| Note | **Report** | Session documentation & technical memos |
| Flows | **Workflows** | Structured analytical workflows |
| Tools | **Toolbox** | Utility tools, calculators, converters |

### 10.2 Sections (replaces `src/centerpanel/sections.ts`)

```typescript
const SECTIONS: Section[] = [
  { id: "overview", title: "Study Area Overview" },
  { id: "data-inventory", title: "Data Inventory" },
  { id: "baseline", title: "Baseline Conditions", children: [
    { id: "demographics", title: "Demographics & Socioeconomics" },
    { id: "land-use", title: "Land Use & Zoning" },
    { id: "built-form", title: "Built Form & Morphology" },
    { id: "transport", title: "Transport & Mobility" },
    { id: "environment", title: "Environment & Green Space" }
  ]},
  { id: "analysis", title: "Analysis & Modeling", children: [
    { id: "spatial-stats", title: "Spatial Statistics" },
    { id: "network-analysis", title: "Network Analysis" },
    { id: "remote-sensing", title: "Remote Sensing" },
    { id: "simulations", title: "Simulations & Scenarios" }
  ]},
  { id: "indicators", title: "Indicators & KPIs", children: [
    { id: "morphology-metrics", title: "Morphological Metrics" },
    { id: "accessibility-metrics", title: "Accessibility Indices" },
    { id: "environmental-metrics", title: "Environmental Metrics" },
    { id: "equity-metrics", title: "Equity & Inclusion" }
  ]},
  { id: "interventions", title: "Interventions", children: [
    { id: "design-proposals", title: "Design Proposals" },
    { id: "policy-recs", title: "Policy Recommendations" },
    { id: "scenario-compare", title: "Scenario Comparison" }
  ]},
  { id: "references", title: "References & Data Sources" }
]
```

### 10.3 Clinical Snapshot Strip → Urban Context Strip

Replace the clinical snapshot (ED flags, risk levels) with an **Urban Context Strip** showing:

- **Study area**: Name, scale, bbox extent
- **Active CRS**: EPSG code
- **Dataset count**: N layers loaded
- **Indicator alerts**: Out-of-range KPIs highlighted
- **Session timer**: Preserved (useful for consulting billing)
- **Quick stats**: Area km², population, building count

---

## 11. Urban Analytics Modal (replaces PsychiatryModal)

### 11.1 Architecture (Same Pattern)

```
src/features/urbanAnalytics/
├── UrbanAnalyticsModal.tsx        # Main modal (preserves PsychiatryModal layout)
├── store.ts                       # Zustand store (same pattern as psych store)
├── icons.tsx                      # Urban-themed icons
├── lib/
│   ├── types.ts                   # All types defined in §4
│   ├── sectionHierarchy.ts        # Urban section tree
│   └── tagGroups.ts               # Tag categorization
├── rail/
│   └── RailContainer.tsx          # Left rail: section nav, search, tag filter
├── rightPanelRegistry.ts          # Hierarchical content registry
├── seeds/
│   ├── projectScoping.ts          # Study area definition templates
│   ├── baselineAssessment.ts      # Existing conditions cards
│   ├── urbanIndicators.ts         # Index computation cards
│   ├── vulnerability.ts           # Hazard & risk assessment cards
│   ├── urbanTypology.ts           # Form classification cards
│   ├── interventionDesign.ts      # Planning intervention cards
│   ├── policyInstruments.ts       # Regulatory tool cards
│   ├── transportNetworks.ts       # Mobility analysis cards
│   ├── remoteSensing.ts           # Earth observation cards
│   ├── spatialStats.ts            # Statistical method cards
│   ├── gisMethods.ts              # GIS technique cards
│   ├── dataEngineering.ts         # ETL & pipeline cards
│   ├── stakeholderEngagement.ts   # Participatory method cards
│   └── reportTemplates.ts         # Output template cards
├── mbc/                           # → renamed to 'calculators/'
│   └── calculators.ts             # Urban indicator calculators
└── voxcity/                       # VoxCity integration (see §6)
```

### 11.2 Section Hierarchy

```typescript
const SECTION_TREE: SectionTreeNode[] = [
  {
    id: 'grp-scoping',
    label: 'Project Scoping & Data',
    children: [
      { id: 'project_scoping', label: 'Study Area Definition' },
      { id: 'data_engineering', label: 'Data Acquisition & ETL' },
      { id: 'baseline_assessment', label: 'Baseline Conditions' }
    ]
  },
  {
    id: 'grp-analysis',
    label: 'Spatial Analysis & Metrics',
    children: [
      { id: 'urban_indicators', label: 'Urban Indicators & Indices' },
      { id: 'gis_methods', label: 'GIS & Spatial Operations' },
      { id: 'spatial_stats', label: 'Spatial Statistics' },
      { id: 'remote_sensing', label: 'Remote Sensing & EO' },
      { id: 'transport_networks', label: 'Network & Mobility Analysis' }
    ]
  },
  {
    id: 'grp-vulnerability',
    label: 'Vulnerability & Risk',
    children: [
      { id: 'rapid_assessment', label: 'Rapid Urban Assessment' },
      { id: 'vulnerability', label: 'Multi-Hazard Vulnerability' }
    ]
  },
  {
    id: 'grp-typology',
    label: 'Classification & Typology',
    children: [
      { id: 'typology', label: 'Urban Form Classification' }
    ]
  },
  {
    id: 'grp-intervention',
    label: 'Intervention & Scenarios',
    children: [
      { id: 'intervention_design', label: 'Planning Interventions' },
      { id: 'policy_instruments', label: 'Policy & Regulatory Tools' },
      { id: 'implementation', label: 'Implementation Specs' }
    ]
  },
  {
    id: 'grp-monitoring',
    label: 'Monitoring & Reporting',
    children: [
      { id: 'change_detection', label: 'Change Detection & Temporal' },
      { id: 'kpi_dashboard', label: 'KPI Dashboard & Benchmarking' },
      { id: 'monitoring_eval', label: 'M&E Frameworks' },
      { id: 'reports_briefs', label: 'Reports & Policy Briefs' }
    ]
  },
  {
    id: 'grp-thematic',
    label: 'Thematic Deep-Dives',
    children: [
      { id: 'neighborhood_analysis', label: 'Neighborhood Scale' },
      { id: 'regional_analysis', label: 'Metropolitan & Regional' },
      { id: 'stakeholder_engagement', label: 'Participation & Engagement' }
    ]
  },
  {
    id: 'grp-3d',
    label: '3D & Simulation',
    children: [
      { id: 'voxcity', label: 'VoxCity 3D Environment' },
      { id: 'simulation', label: 'ABM & Microsimulation' }
    ]
  }
]
```

### 11.3 Right Panel Registry

```typescript
const RIGHT_PANEL_REGISTRY = {
  "Project Scoping & Data": {
    "Study Area Definition": PROJECT_SCOPING_CARDS,
    "Data Acquisition & ETL": DATA_ENGINEERING_CARDS,
    "Baseline Conditions": BASELINE_CARDS
  },
  "Spatial Analysis & Metrics": {
    "Urban Indicators & Indices": URBAN_INDICATOR_CARDS,
    "GIS & Spatial Operations": GIS_METHOD_CARDS,
    "Spatial Statistics": SPATIAL_STATS_CARDS,
    "Remote Sensing & EO": REMOTE_SENSING_CARDS,
    "Network & Mobility": TRANSPORT_NETWORK_CARDS
  },
  "Vulnerability & Risk": {
    "Rapid Assessment": RAPID_ASSESSMENT_CARDS,
    "Multi-Hazard Vulnerability": VULNERABILITY_CARDS
  },
  "Classification & Typology": {
    "Urban Form Classification": TYPOLOGY_CARDS
  },
  "Intervention & Scenarios": {
    "Planning Interventions": INTERVENTION_CARDS,
    "Policy & Regulatory Tools": POLICY_CARDS,
    "Implementation Specifications": IMPLEMENTATION_CARDS
  },
  "Monitoring & Reporting": {
    "Change Detection": CHANGE_DETECTION_CARDS,
    "KPI Dashboard": KPI_CARDS,
    "M&E Frameworks": ME_CARDS,
    "Reports & Policy Briefs": REPORT_CARDS
  },
  "3D & Simulation": {
    "VoxCity Environment": VOXCITY_CARDS,
    "ABM & Microsimulation": SIMULATION_CARDS
  }
}
```

---

## 12. Analytical Flows (replaces Clinical Flows)

### 12.1 Flow ID Mapping

| Clinical Flow | Urban Flow | Description |
|---|---|---|
| `safety` (Suicide Risk) | **`site_suitability`** | Multi-criteria site suitability analysis |
| `agitation` (Acute Agitation) | **`accessibility`** | Accessibility analysis (walk/transit/cycle) |
| `catatonia` (Catatonia Eval) | **`vulnerability`** | Multi-hazard vulnerability assessment |
| `bfcrs` (Brief Rating Scale) | **`indicator_composite`** | Composite urban indicator calculation |
| `lorazepam` (Lorazepam Challenge) | **`scenario_comparison`** | Before/after scenario comparison |
| `capacity` (Decision Capacity) | **`equity_audit`** | Environmental justice & equity audit |
| `observation` (Containment) | **`change_detection`** | Temporal change monitoring workflow |
| `review` | **`review`** | Review completed analysis runs |

### 12.2 Flow Types

```typescript
type AnalyticalFlowId = 
  | 'site_suitability'      // Weighted overlay / AHP
  | 'accessibility'          // Isochrone + gravity model
  | 'vulnerability'          // Hazard × Exposure × Sensitivity
  | 'indicator_composite'    // Multi-criteria index builder
  | 'scenario_comparison'    // A/B intervention comparison
  | 'equity_audit'           // Demographic × access × quality
  | 'change_detection'       // Temporal satellite/vector diff
  | 'walkability'            // Walk Score methodology
  | 'fifteen_min_city'       // 15-minute city compliance
  | 'urban_morphology'       // Morphometric analysis
  | 'transit_gap'            // Transit supply vs demand
  | 'heat_island'            // UHI intensity mapping
  | 'green_deficit'          // Green space per capita audit
  | 'review'                 // Review completed runs
```

### 12.3 Flow Structure (Example: Site Suitability)

```
Step 1: Define Criteria
  □ Proximity to transit (weight: __)
  □ Land use compatibility (weight: __)
  □ Slope / terrain (weight: __)
  □ Flood zone exclusion (weight: __)
  □ Population density threshold (weight: __)
  □ Property value range (weight: __)
  □ Custom criterion: ___

Step 2: Data Layer Assignment
  For each criterion → assign GeoJSON/raster layer
  Normalize: min-max / z-score / rank

Step 3: Weighting Method
  ○ Equal weights
  ○ Rank-sum
  ○ Analytic Hierarchy Process (AHP)
  ○ Custom manual weights

Step 4: Constraint Mapping
  Hard constraints (binary mask): flood zone, protected area, slope > 30%

Step 5: Compute & Classify
  Weighted overlay → suitability score [0–1]
  Classification: unsuitable / marginal / moderate / suitable / optimal

Step 6: Sensitivity Analysis
  Monte Carlo weight perturbation → stability assessment

Step 7: Generate Output
  → Suitability map (choropleth)
  → Summary statistics (area per class)
  → Methodology paragraph for report
```

### 12.4 Flow Builders

Each flow produces structured prose for insertion into analysis reports:

```typescript
// Example: Accessibility flow output
buildAccessibilityOutcome(params: {
  mode: 'walk' | 'cycle' | 'transit' | 'drive'
  threshold_minutes: number
  poi_categories: string[]
  population_weighted: boolean
  equity_disaggregation?: string  // 'income' | 'race' | 'age'
}): string

// Produces:
// "Isochrone analysis reveals that 72.3% of residents can reach a grocery 
//  store within 15 minutes by walking. When disaggregated by income quintile,
//  the lowest quintile has only 48.1% coverage compared to 91.7% for the
//  highest quintile, indicating significant spatial inequity (Gini = 0.34).
//  Network analysis used OSM pedestrian graph with pandana gravity model
//  (beta = -0.5). Coverage excludes parcels with slope > 15%."
```

---

## 13. Urban Indicators & Calculators (replaces MBC)

### 13.1 Calculator Architecture

Same auto-scoring pattern as MBC calculators, but for urban indices:

```typescript
// src/features/urbanAnalytics/calculators/

// ── Morphology ──────────────────────────────────────────────
function floorAreaRatio(totalFloorArea: number, lotArea: number): IndicatorResult
  // FAR = total floor area / lot area
  // Bands: <0.5 (low-density), 0.5-1.5 (medium), 1.5-3 (high), >3 (very high)

function groundSpaceIndex(buildingFootprint: number, lotArea: number): IndicatorResult
  // GSI = building footprint / lot area
  // Range: 0-1, typical urban: 0.2-0.6

function openSpaceRatio(openSpace: number, totalFloorArea: number): IndicatorResult
  // OSR = (1 - GSI) / FAR
  // Higher = more open space per floor area

function mixedUseIndex(landUseAreas: Record<string, number>): IndicatorResult
  // Shannon entropy: H = -Σ(pi × ln(pi))
  // Normalized: H / ln(n) → [0, 1], 1 = perfectly mixed

function streetConnectivity(intersections: number, culsDesac: number, segments: number): IndicatorResult
  // Connected Node Ratio = 4-way intersections / total intersections
  // Alpha index = (e - n + 1) / (2n - 5)
  // Beta index = e / n
  // Gamma index = e / (3(n - 2))

// ── Accessibility ───────────────────────────────────────────
function walkScore(params: {
  groceryDist: number, restaurantDist: number, shoppingDist: number,
  coffeeDist: number, bankDist: number, parkDist: number,
  schoolDist: number, bookstoreDist: number, entertainmentDist: number
}): IndicatorResult
  // Walk Score methodology: distance decay weights per category
  // Bands: 0-24 (car-dependent), 25-49 (car-dependent), 50-69 (somewhat walkable),
  //        70-89 (very walkable), 90-100 (walker's paradise)

function transitAccessibility(params: {
  stopsWithin400m: number, frequencyPerHour: number, routeTypes: string[]
}): IndicatorResult
  // Combined frequency + proximity + route diversity
  // Bands: A (excellent) → F (no service)

function cumulativeOpportunities(params: {
  poisReachable: number, threshold: number, mode: string
}): IndicatorResult
  // Count of opportunities within threshold travel time

// ── Environment ─────────────────────────────────────────────
function ndvi(nirBand: number[], redBand: number[]): Float32Array
  // NDVI = (NIR - RED) / (NIR + RED)
  // Per-pixel: <0 (water), 0-0.2 (bare/built), 0.2-0.4 (sparse veg), 0.4-0.6 (moderate), >0.6 (dense)

function urbanHeatIslandIntensity(urbanLST: number, ruralLST: number): IndicatorResult
  // UHI = LST_urban - LST_rural (°C)
  // Bands: <1°C (negligible), 1-3 (moderate), 3-5 (significant), >5 (severe)

function greenSpacePerCapita(greenAreaM2: number, population: number): IndicatorResult
  // m² per capita
  // WHO recommendation: ≥9 m²/person
  // Bands: <5 (critical deficit), 5-9 (below standard), 9-15 (adequate), >15 (excellent)

function treeCanopyCoverage(canopyArea: number, totalArea: number): IndicatorResult
  // Percentage of area covered by tree canopy
  // Target: >30% (USDA Forest Service recommendation)

// ── Socioeconomic ───────────────────────────────────────────
function giniCoefficient(values: number[]): IndicatorResult
  // Standard Gini from sorted income/wealth distribution
  // 0 = perfect equality, 1 = perfect inequality

function shannonDiversity(categories: Record<string, number>): IndicatorResult
  // H = -Σ(pi × ln(pi)), normalized H' = H / ln(n)
  // For land use, ethnic, or economic diversity

function simpsonDiversity(categories: Record<string, number>): IndicatorResult
  // D = 1 - Σ(pi²)
  // 0 = no diversity, 1 = maximum diversity

function jobsHousingBalance(jobs: number, housingUnits: number): IndicatorResult
  // Ratio: jobs / housing units
  // Ideal: 0.8-1.2 (balanced), <0.8 (bedroom community), >1.2 (employment center)

function displacementRisk(params: {
  rentChangeRate: number, demographicShift: number,
  investmentPressure: number, transitProximity: boolean
}): IndicatorResult
  // Composite risk index
  // Based on Urban Displacement Project methodology (UC Berkeley)

// ── Resilience ──────────────────────────────────────────────
function socialVulnerabilityIndex(params: {
  povertyRate: number, elderlyPct: number, disabilityPct: number,
  linguisticIsolation: number, noVehiclePct: number, rentBurdenPct: number
}): IndicatorResult
  // SoVI methodology (Cutter et al., 2003)
  // PCA-based composite or additive index

function floodExposure(params: {
  floodZoneArea: number, totalArea: number,
  populationInFloodZone: number, totalPopulation: number
}): IndicatorResult
  // Area-based and population-based exposure ratios

function adaptiveCapacity(params: {
  greenInfrastructure: number, emergencyFacilities: number,
  communityOrgs: number, insuranceCoverage: number
}): IndicatorResult
  // Multi-criteria resilience capacity score
```

### 13.2 SDG 11 Indicator Suite

Dedicated calculators for UN SDG 11 (Sustainable Cities & Communities):

| SDG Target | Indicator | Calculator |
|---|---|---|
| 11.1.1 | Slum/informal population proportion | `sdg11_1_1(informalPop, totalPop)` |
| 11.2.1 | Public transport convenient access | `sdg11_2_1(popNearTransit, totalPop)` |
| 11.3.1 | Land consumption / pop growth ratio | `sdg11_3_1(landGrowthRate, popGrowthRate)` |
| 11.5.1 | Disaster deaths per 100k | `sdg11_5_1(deaths, population)` |
| 11.6.1 | Solid waste collection rate | `sdg11_6_1(wasteCollected, wasteGenerated)` |
| 11.6.2 | PM2.5 annual mean | `sdg11_6_2(pm25readings)` |
| 11.7.1 | Public open space share | `sdg11_7_1(openSpaceArea, builtUpArea)` |

---

## 14. Guide System (replaces Clinical Guides)

### 14.1 Guide Categories

| Category | Guides |
|---|---|
| **Spatial Statistics** | Spatial Autocorrelation (Moran's I, Geary's C), LISA Clusters, Getis-Ord Gi*, Kriging & Interpolation, Geographically Weighted Regression (GWR) |
| **Network Analysis** | Graph Metrics (centrality, connectivity), Shortest Path Algorithms, Service Area / Isochrone Methods, Space Syntax (integration, choice), Network-based Accessibility |
| **Remote Sensing** | Spectral Indices (NDVI, NDBI, NDWI, SAVI), Land Cover Classification (RF, SVM, DL), Change Detection (post-classification, image differencing), Urban Expansion Mapping, Data Fusion (optical + SAR) |
| **Urban Morphology** | Spacematrix (FSI, GSI, OSR), Street Network Analysis (momepy), Building Typology Classification, Urban Fabric Analysis (tessellation), Historical Morphogenesis |
| **Transport Planning** | GTFS Analysis & Validation, 4-Step Transport Model, Activity-Based Models, Level of Service (LOS), Complete Streets Assessment |
| **Environmental Analysis** | Urban Heat Island Mitigation, Green Infrastructure Planning, Stormwater Management, Air Quality Modeling, Noise Mapping (CNOSSOS-EU) |
| **Socioeconomic Analysis** | Gentrification Indicators, Segregation Indices (dissimilarity, isolation), Deprivation Indices, Housing Affordability Methods, Employment Accessibility |
| **3D & Simulation** | VoxCity Workflow, CityGML/CityJSON, Solar Radiation Modeling, Wind Comfort (Lawson Criteria), Agent-Based Modeling for Pedestrians |
| **Data Engineering** | OpenStreetMap Data Extraction, Census Data Integration, GTFS-to-Network Conversion, Spatial Data Quality Assurance, Coordinate Reference System Guide |

### 14.2 Guide Structure (same as `MicroGuide` pattern)

```typescript
interface MethodologyGuide {
  id: string
  title: string
  category: GuideCategory
  abstract: string               // Method overview (1 paragraph)
  methodology: string            // Step-by-step procedure
  assumptions: string            // Statistical / methodological assumptions
  limitations: string            // Known limitations & edge cases
  dataRequirements: string       // Required input data specification
  pythonExample: string          // Code snippet
  interpretation: string         // How to read results
  references: string             // Academic references (APA)
  relatedIndicators?: string[]   // Links to calculator IDs
  sdgAlignment?: string[]        // SDG targets
  meta?: Record<string, ReferenceBlock>  // Evidence grading
}
```

---

## 15. Project Registry (replaces Patient Registry)

### 15.1 Type Mapping

| Patient Registry | Project Registry |
|---|---|
| Patient | **StudyArea** (project) |
| Name / MRN | **Project Name / ID** |
| Age / Sex | **Scale / Area (km²)** |
| Tags (SUD, Bipolar, FEP) | **Tags** (mobility, equity, climate, voxcity) |
| Risk Level (1–5) | **Priority Level** (1–5) |
| Suicide Risk | **Climate Vulnerability Score** |
| Violence Risk | **Seismic/Flood Exposure** |
| Capacity | **Data Completeness Score** |
| Encounter | **AnalysisSession** |
| Location (ED/Inpatient/OPD) | **Session Type** (baseline, field, desk, stakeholder) |
| Assessment (PHQ-9 score) | **Indicator Result** (Walk Score, NDVI) |
| Task List | **Task List** (same pattern, urban content) |
| Encounter Flags | **Session Flags** (data quality alerts, deadline warnings) |

### 15.2 Registry UI Components

| Current Component | New Component |
|---|---|
| `DemographicsCard` | **ProjectSummaryCard** (name, scale, area, CRS, tags) |
| `SafetyRiskCard` | **VulnerabilityCard** (climate, flood, seismic, social vulnerability scores) |
| `AssessmentsCard` | **IndicatorsCard** (recorded indicator values over time) |
| `EncounterCard` | **SessionCard** (session type, datasets used, methods applied) |
| `TaskListEditor` | **TaskListEditor** (preserved, urban task categories) |
| `ConsultantAI` | **AnalystAI** (AI-assisted report generation from project data) |

### 15.3 Session Flags (replaces Encounter Flags)

```typescript
interface SessionFlags {
  dataQualityAlert: boolean             // Missing/corrupt datasets detected
  crsInconsistency: boolean             // Mixed CRS across layers
  temporalMismatch: boolean             // Datasets from different time periods
  coverageGap: boolean                  // Study area not fully covered by data
  stakeholderFeedbackPending: boolean   // Unresolved community input
  deadlineApproaching: boolean          // Project milestone deadline
  indicatorOutOfRange: boolean          // KPI exceeds acceptable threshold
  validationRequired: boolean           // Results need peer review
  dataSensitivity: boolean              // Contains sensitive demographic data
  ethicsApprovalNeeded: boolean         // Human subjects research flag
}
```

---

## 16. AI System Adaptation

### 16.1 System Prompts

Replace all psychiatric system prompts with urban analytics context:

```typescript
const URBAN_SYSTEM_PROMPT = `You are an expert urban analytics AI assistant integrated 
into a spatial analysis workbench. Your expertise spans:

- Urban planning theory (TOD, New Urbanism, Smart Growth, Tactical Urbanism)
- GIS and spatial analysis (vector operations, raster algebra, network analysis)
- Remote sensing and Earth observation (spectral indices, classification, change detection)
- Transport planning (4-step model, accessibility, LOS, GTFS analysis)
- Environmental science (UHI, stormwater, green infrastructure, noise mapping)
- Urban economics (land values, gentrification, housing affordability)
- Spatial statistics (Moran's I, LISA, GWR, kriging, point patterns)
- Urban morphology (Spacematrix, momepy, Space Syntax)
- SDG 11 indicators and monitoring frameworks
- Python geospatial stack (geopandas, osmnx, pysal, rasterio, folium)
- VoxCity voxel-based environmental simulation

When generating analysis:
- Cite methodological sources (peer-reviewed where possible)
- Specify data requirements and CRS considerations
- Include uncertainty qualifications
- Follow FAIR data principles
- Consider equity and environmental justice implications
- Provide reproducible Python code when applicable

Output Format Preferences:
- Structured technical prose suitable for planning reports
- GeoJSON for spatial outputs when applicable
- Metric units (SI) as default
- Statistical significance levels explicitly stated
`
```

### 16.2 AI-Assisted Features

| Feature | Description |
|---|---|
| **Report Generation** | Auto-generate technical memos from collected indicators and flow outputs |
| **Code Generation** | Generate Python analysis scripts from natural language descriptions |
| **Literature Review** | Find relevant urban planning/GIS literature for methodology justification |
| **Data Discovery** | Suggest available datasets (OSM, census, Sentinel) for a given study area |
| **Indicator Interpretation** | Explain indicator values in policy-relevant terms |
| **Scenario Narration** | Generate comparative narratives for scenario A vs B |
| **Policy Brief Drafting** | Convert technical findings into stakeholder-accessible language |
| **GeoJSON Generation** | Create spatial features from descriptions (e.g., "draw a 500m buffer around transit stops") |
| **Statistical Guidance** | Recommend appropriate spatial statistical methods for given data characteristics |

### 16.3 RAG Integration

Index the following corpus for retrieval-augmented generation:

- Urban planning textbooks excerpts (methodology sections)
- Python geospatial package documentation
- SDG 11 monitoring framework
- VoxCity API documentation
- OSM wiki (tags, data model)
- Spatial statistics reference sheets
- Transport planning guidelines

---

## 17. Data Sources & APIs

### 17.1 Built-in Data Connectors

| Source | API | Data Type |
|---|---|---|
| **Google Maps Platform** ⭐ | Maps JS, Places, Directions, Elevation, Street View, Solar, Air Quality | Full Google Maps ecosystem |
| **Google Earth Engine** | REST / Python | Satellite composites, climate, time series |
| **OpenStreetMap** | Overpass API | Buildings, roads, POIs, land use |
| **US Census / ACS** | Census API | Demographics, income, housing |
| **Copernicus Open Access** | OData API | Sentinel-2 (optical), Sentinel-1 (SAR) |
| **USGS Earth Explorer** | M2M API | Landsat, DEM, land cover |
| **Microsoft Planetary Computer** | STAC API | Global satellite imagery |
| **OpenTripPlanner** | GraphQL | Multi-modal routing, isochrones |
| **OSRM** | HTTP API | Driving/cycling/walking routes |
| **Google Directions** ⭐ | REST | Traffic-aware routing, ETA |
| **Google Distance Matrix** ⭐ | REST | N×M travel time/distance |
| **Google Geocoding** ⭐ | REST | Forward/reverse geocoding |
| **Google Places** ⭐ | REST | POI search, details, photos |
| **OpenRouteService** | REST | Isochrones, directions, geocoding |
| **Mapbox** | REST | Tiles, geocoding, directions |
| **Nominatim** | REST | Geocoding / reverse geocoding |
| **World Bank** | REST | Country-level indicators |
| **GTFS Feeds** | Static files | Transit schedules and geometry |
| **Transitland** | REST | Global transit data aggregator |
| **GBIF** | REST | Biodiversity occurrence data |
| **OpenWeatherMap** | REST | Weather, air quality |
| **PurpleAir** | REST | Citizen science air quality sensors |
| **VoxCity** | Python API | 3D voxel grids, simulation results |
| **Overture Maps** | Parquet/GeoJSON | Open map data (buildings, places, transport) |
| **Google Roads** ⭐ | REST | Speed limits, road snapping |

### 17.2 Google Maps Data Pipeline

```typescript
// Dedicated pipeline for Google Maps data acquisition
interface GoogleDataPipeline {
  // Places bulk query
  nearbySearch(params: {
    center: LatLng
    radius: number
    types: GooglePlaceType[]
    maxResults?: number
  }): Promise<PlaceResult[]>

  // Build accessibility dataset from Google
  buildPOIDataset(params: {
    studyArea: GeoJSON.Polygon
    categories: GooglePlaceType[]
    gridSpacing?: number          // Sample points every N meters
  }): Promise<GeoJSON.FeatureCollection>

  // Travel time matrix via Distance Matrix API
  computeTravelMatrix(params: {
    origins: LatLng[]
    destinations: LatLng[]
    mode: 'driving' | 'walking' | 'bicycling' | 'transit'
    departureTime?: Date          // For traffic-aware results
    trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic'
  }): Promise<TravelMatrix>

  // Elevation transect
  elevationProfile(path: LatLng[], samples: number): Promise<ElevationPoint[]>

  // Batch geocoding
  batchGeocode(addresses: string[]): Promise<GeocodeResult[]>

  // Street View coverage check
  streetViewCoverage(points: LatLng[]): Promise<{ point: LatLng; available: boolean; date?: string }[]>
}

type GooglePlaceType =
  | 'supermarket' | 'grocery_or_supermarket' | 'restaurant' | 'cafe'
  | 'school' | 'university' | 'hospital' | 'pharmacy' | 'doctor'
  | 'park' | 'gym' | 'library' | 'bank' | 'post_office'
  | 'bus_station' | 'subway_station' | 'train_station'
  | 'shopping_mall' | 'convenience_store' | 'gas_station'
  | 'place_of_worship' | 'police' | 'fire_station'
  | 'museum' | 'movie_theater' | 'stadium'
  // ... 100+ types supported
```

### 17.3 Local Data Support

- Drag-and-drop file import (GeoJSON, Shapefile, GeoTIFF, CSV, GTFS, KML/KMZ, GPX)
- PostGIS connection string for database-backed layers
- WMS/WMTS/WFS endpoints for OGC services
- OGC API Features (new standard, replacing WFS)
- COG (Cloud-Optimized GeoTIFF) direct URL loading
- STAC catalog browser for satellite imagery discovery
- ArcGIS Feature Service / Map Service endpoints
- Google My Maps import (KML)

---

## 18. Visualization Layer

### 18.1 Map Visualizations

| Visualization | Use Case | Library |
|---|---|---|
| **Choropleth** | Thematic mapping (income, density, NDVI by zone) | deck.gl / Mapbox GL |
| **Graduated Symbol** | Population, employment magnitudes | deck.gl ScatterplotLayer |
| **Heatmap** | Crime density, POI concentration | deck.gl HeatmapLayer |
| **Isochrone** | Accessibility contours | deck.gl PolygonLayer |
| **Flow Map** | Commuter OD, migration | deck.gl ArcLayer |
| **3D Extrusion** | Building heights, floor area | deck.gl ColumnLayer |
| **Hexbin** | H3 aggregation, density | deck.gl H3HexagonLayer |
| **Point Cloud** | LiDAR, 3D scans | deck.gl PointCloudLayer |
| **Voxel Scene** | VoxCity environment | react-three-fiber |
| **Raster Overlay** | Satellite imagery, DEM hillshade | deck.gl BitmapLayer / TileLayer |
| **Network Graph** | Street network, transit graph | deck.gl PathLayer + custom |

### 18.2 Chart Visualizations (existing chart.js + recharts preserved)

| Chart | Use Case |
|---|---|
| **Time Series** | Indicator trends, change detection |
| **Bar / Grouped Bar** | Cross-area comparison, category breakdown |
| **Radar / Spider** | Multi-dimensional indicator profiles |
| **Scatter + Regression** | Correlation analysis (density vs transit) |
| **Box Plot** | Distribution across zones |
| **Histogram** | Frequency distribution of indicator values |
| **Treemap** | Land use area breakdown |
| **Sankey** | Land use change flows (t1 → t2) |
| **Parallel Coordinates** | Multi-indicator comparison |
| **Small Multiples** | Spatial pattern comparison across time |

### 18.3 3D Visualizations (three.js preserved + extended)

| Visualization | Use Case |
|---|---|
| **Voxel Grid** | VoxCity environmental model |
| **Point Cloud** | LiDAR terrain / buildings |
| **CityJSON Mesh** | LOD2+ building models |
| **Terrain + Draping** | DEM with orthophoto or analysis overlay |
| **Shadow Study** | Solar exposure animation |
| **Wind Rose** | Wind direction/speed distribution |

---

## 19. Advanced Cartographic Engine

> **NEW in v2.0** — Professional map production with dynamic styling, symbology management, and publication-quality export.

### 19.1 Cartographic Style Engine

```
src/engine/carto/
├── StyleEngine.ts                  # Mapbox GL Style Spec + extensions
├── SymbologyManager.ts             # Thematic classification & symbol assignment
├── LabelEngine.ts                  # Collision-aware label placement
├── ColorBrewerIntegration.ts       # ColorBrewer + CARTOColors + scientific palettes
├── ClassificationSchemes.ts        # Natural breaks, quantile, equal interval, std dev, head/tail
├── ProportionalSymbols.ts          # Graduated/proportional symbol sizing
├── BivariateChoropleth.ts          # 3×3, 4×4 bivariate color matrices
├── DotDensity.ts                   # Dot density map generator
├── Cartogram.ts                    # Area cartogram (Dorling, contiguous)
├── PrintComposer.ts                # QGIS-style map layout for print/PDF
└── AtlasGenerator.ts               # Batch map generation across study areas
```

### 19.2 Classification Schemes

| Scheme | Algorithm | Best For |
|---|---|---|
| **Natural Breaks (Jenks)** | Fisher-Jenks optimization | Most thematic maps |
| **Quantile** | Equal-count bins | Rank-based comparison |
| **Equal Interval** | Uniform value range | Evenly distributed data |
| **Standard Deviation** | Mean ± σ | Showing deviation from average |
| **Head/Tail Breaks** | Recursive mean split | Heavy-tailed distributions (city sizes, wealth) |
| **Maximum Breaks** | Largest gaps in sorted data | Revealing natural groupings |
| **Pretty Breaks** | Round number boundaries | Human-readable legends |
| **Geometric Interval** | Geometric progression | Skewed distributions |
| **Manual** | User-defined breakpoints | Domain-specific thresholds |
| **K-Means** | Cluster-based | Multi-modal distributions |

### 19.3 Color Palettes

| Source | Palettes | Type |
|---|---|---|
| **ColorBrewer** | 35 schemes (sequential, diverging, qualitative) | Cartographic standard |
| **CARTOColors** | 36 schemes optimized for maps | Web-optimized |
| **Viridis Family** | viridis, magma, plasma, inferno, cividis | Perceptually uniform, colorblind-safe |
| **Scientific** | Batlow, Oslo, Tokyo, Berlin (Crameri) | Publication-quality, perceptually uniform |
| **Custom** | User-defined HSL/RGB stops | Any |

### 19.4 Print Layout Composer

```typescript
interface MapLayout {
  pageSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'letter' | 'tabloid' | [number, number]
  orientation: 'portrait' | 'landscape'
  dpi: 72 | 150 | 300 | 600
  elements: LayoutElement[]
}

type LayoutElement =
  | { type: 'map'; extent: BoundingBox; layers: string[]; scale?: number }
  | { type: 'legend'; position: [number, number]; maxWidth: number }
  | { type: 'scale_bar'; style: 'line' | 'bar' | 'double_bar'; units: 'metric' | 'imperial' }
  | { type: 'north_arrow'; style: 'simple' | 'compass' | 'ornate' }
  | { type: 'title'; text: string; fontSize: number; fontFamily: string }
  | { type: 'subtitle'; text: string }
  | { type: 'text_block'; text: string; position: [number, number] }
  | { type: 'image'; src: string; position: [number, number]; size: [number, number] }
  | { type: 'chart'; chartConfig: ChartConfig; position: [number, number]; size: [number, number] }
  | { type: 'table'; data: string[][]; position: [number, number] }
  | { type: 'inset_map'; extent: BoundingBox; position: [number, number]; size: [number, number] }
  | { type: 'grid_lines'; interval: number; labels: boolean }
  | { type: 'attribution'; text: string }

// Export formats: PDF (vector), PNG (raster), SVG (vector), TIFF (georeferenced)
```

---

## 20. Real-Time Streaming Geodata Pipeline

> **NEW in v2.0** — Live data ingestion, processing, and visualization for smart city applications.

### 20.1 Architecture

```
src/engine/streaming/
├── StreamManager.ts                # Central stream lifecycle manager
├── WebSocketGeoStream.ts           # WebSocket-based geo-event streaming
├── MQTTBridge.ts                   # MQTT ↔ browser bridge (for IoT sensors)
├── SSEGeoStream.ts                 # Server-Sent Events for unidirectional feeds
├── GeoEventProcessor.ts            # Filter, transform, aggregate events
├── TemporalBuffer.ts               # Ring buffer for time-windowed aggregation
├── AlertEngine.ts                  # Threshold-based geofence alerts
├── hooks/
│   ├── useLiveTraffic.ts           # Google Traffic API real-time feed
│   ├── useLiveTransit.ts           # GTFS-RT vehicle positions
│   ├── useLiveSensors.ts           # IoT sensor data (air quality, noise, traffic count)
│   ├── useLiveWeather.ts           # Weather station updates
│   └── useGeoFence.ts              # Enter/exit geofence detection
└── connectors/
    ├── GoogleTrafficConnector.ts    # Real-time traffic from Google Roads API
    ├── GTFSRealtimeConnector.ts     # GTFS-RT protobuf decoder
    ├── SenseBoxConnector.ts         # openSenseMap citizen science sensors
    ├── PurpleAirConnector.ts        # PurpleAir PM2.5 real-time
    ├── TelraamConnector.ts          # Telraam traffic counting sensors
    └── CustomAPIConnector.ts        # User-defined REST polling
```

### 20.2 Stream Processing

```typescript
interface GeoEvent {
  id: string
  timestamp: number
  location: GeoJSON.Point
  properties: Record<string, number | string | boolean>
  source: string
  ttl?: number                        // Time-to-live in seconds
}

interface StreamPipeline {
  // Ingest
  connect(config: StreamSourceConfig): StreamHandle
  
  // Transform
  filter(predicate: (event: GeoEvent) => boolean): StreamPipeline
  map(transform: (event: GeoEvent) => GeoEvent): StreamPipeline
  spatialFilter(boundary: GeoJSON.Polygon): StreamPipeline
  temporalWindow(seconds: number): StreamPipeline
  
  // Aggregate 
  aggregateByH3(resolution: number, agg: 'count' | 'mean' | 'max' | 'sum'): StreamPipeline
  aggregateByPolygon(zones: GeoJSON.FeatureCollection, agg: AggFunction): StreamPipeline
  movingAverage(windowSize: number): StreamPipeline
  
  // Alert
  onThreshold(field: string, operator: '>' | '<' | '==', value: number, callback: AlertCallback): void
  onGeofence(boundary: GeoJSON.Polygon, event: 'enter' | 'exit', callback: AlertCallback): void
  
  // Sink
  toMap(layerConfig: DeckGLLayerConfig): void
  toChart(chartConfig: TimeSeriesConfig): void
  toDB(table: string): void
  toCSV(path: string): void
}
```

### 20.3 Live Data Sources

| Source | Protocol | Data | Update Frequency |
|---|---|---|---|
| **Google Traffic** | REST polling | Traffic conditions, congestion | 2-5 min |
| **GTFS-Realtime** | Protobuf/HTTP | Bus/train positions, delays | 15-30 sec |
| **PurpleAir** | REST | PM2.5, PM10, temperature, humidity | 2 min |
| **openSenseMap** | REST | Multi-sensor (citizen science) | Variable |
| **Telraam** | REST | Traffic counts by mode | 15 min |
| **OpenWeatherMap** | REST | Temperature, wind, precipitation | 10 min |
| **USGS Earthquake** | GeoJSON feed | Seismic events | Real-time |
| **AIS (Marine)** | WebSocket | Ship positions | Real-time |
| **ADS-B (Aviation)** | WebSocket | Aircraft positions | 1 sec |
| **Custom MQTT** | MQTT 5.0 | IoT sensors, smart city | Configurable |
| **Custom WebSocket** | WS/WSS | Any JSON/GeoJSON stream | Real-time |

---

## 21. Spatial Database & Query Engine

> **NEW in v2.0** — In-browser spatial SQL database for complex analytical queries.

### 21.1 DuckDB-WASM Spatial Extension

Leverage DuckDB compiled to WebAssembly with spatial extension for SQL-based geospatial analysis directly in the browser:

```typescript
interface SpatialDB {
  // Initialize
  init(): Promise<void>               // Load DuckDB-WASM + spatial extension
  
  // Data loading
  loadGeoJSON(table: string, geojson: GeoJSON.FeatureCollection): Promise<void>
  loadParquet(table: string, url: string): Promise<void>
  loadCSV(table: string, data: string, latCol: string, lonCol: string): Promise<void>
  loadGeoPackage(table: string, buffer: ArrayBuffer): Promise<void>
  attachPostGIS(connectionString: string, schema?: string): Promise<void>  // Remote
  
  // Spatial SQL
  query(sql: string): Promise<QueryResult>
  explain(sql: string): Promise<string>
  
  // Convenience
  spatialJoin(leftTable: string, rightTable: string, predicate: SpatialPredicate): Promise<QueryResult>
  buffer(table: string, geometryCol: string, distance: number): Promise<QueryResult>
  aggregate(table: string, groupBy: string, aggFunctions: Record<string, string>): Promise<QueryResult>
  
  // Export
  toGeoJSON(query: string): Promise<GeoJSON.FeatureCollection>
  toArrow(query: string): Promise<ArrayBuffer>
  toCSV(query: string): Promise<string>
}

type SpatialPredicate = 'ST_Intersects' | 'ST_Contains' | 'ST_Within' | 'ST_Touches' 
  | 'ST_Crosses' | 'ST_Overlaps' | 'ST_DWithin'
```

### 21.2 Example Spatial SQL Queries

```sql
-- Walk Score: count amenities within 15-min walk distance per census tract
SELECT 
  t.tract_id,
  t.population,
  COUNT(DISTINCT CASE WHEN p.type = 'supermarket' THEN p.id END) as grocery_count,
  COUNT(DISTINCT CASE WHEN p.type = 'school' THEN p.id END) as school_count,
  COUNT(DISTINCT CASE WHEN p.type = 'park' THEN p.id END) as park_count,
  ST_Area(t.geometry) / 1e6 as area_km2
FROM census_tracts t
JOIN pois p ON ST_DWithin(t.geometry, p.geometry, 1200)  -- ~15min walk
GROUP BY t.tract_id, t.population, t.geometry;

-- Urban Heat Island: correlate NDVI with land surface temperature
SELECT 
  z.zone_name,
  AVG(r.lst_celsius) as mean_lst,
  AVG(r.ndvi) as mean_ndvi,
  CORR(r.lst_celsius, r.ndvi) as lst_ndvi_correlation,
  STDDEV(r.lst_celsius) as lst_variability
FROM raster_samples r
JOIN zones z ON ST_Contains(z.geometry, r.geometry)
GROUP BY z.zone_name
ORDER BY mean_lst DESC;

-- Gentrification pressure: identify neighborhoods with rapid change
SELECT 
  n.name,
  ((n2025.median_rent - n2020.median_rent) / n2020.median_rent * 100) as rent_change_pct,
  (n2025.college_pct - n2020.college_pct) as education_shift,
  (n2025.median_income - n2020.median_income) / n2020.median_income * 100 as income_change_pct,
  CASE 
    WHEN rent_change_pct > 30 AND education_shift > 10 THEN 'HIGH RISK'
    WHEN rent_change_pct > 15 OR education_shift > 5 THEN 'MODERATE RISK'
    ELSE 'LOW RISK'
  END as displacement_risk
FROM neighborhoods n
JOIN census_2020 n2020 ON n.id = n2020.neighborhood_id
JOIN census_2025 n2025 ON n.id = n2025.neighborhood_id
ORDER BY rent_change_pct DESC;
```

### 21.3 SQL Editor Integration

The Monaco editor gets a **spatial SQL mode** with:

- Auto-complete for spatial functions (`ST_Buffer`, `ST_Intersects`, `ST_Transform`, etc.)
- Table/column name auto-complete from loaded datasets
- Inline query result preview (first 100 rows + geometry preview)
- EXPLAIN ANALYZE visualization (query plan tree)
- One-click "Send to Map" for query results with geometry
- Query history with re-run capability
- Parameterized queries (bind study area, date range, etc.)

---

## 22. Geospatial AI/ML Pipeline

> **NEW in v2.0** — Integrated machine learning for urban pattern recognition, prediction, and computer vision.

### 22.1 Architecture

```
src/engine/geoai/
├── GeoMLPipeline.ts                # Pipeline orchestrator
├── FeatureEngineering.ts           # Spatial feature extraction
├── models/
│   ├── LandCoverClassifier.ts      # Pixel/object-based classification
│   ├── BuildingFootprintDetector.ts # Building segmentation from imagery
│   ├── UrbanTypologyClassifier.ts  # Neighborhood type classification
│   ├── ChangeDetector.ts           # Bi-temporal change detection
│   ├── GentrificationPredictor.ts  # Displacement risk ML model
│   ├── TrafficPredictor.ts         # Traffic volume estimation
│   ├── PropertyValueEstimator.ts   # Hedonic price model
│   ├── LandUsePredictor.ts         # Future land use projection
│   └── AnomalyDetector.ts          # Spatial/temporal anomaly detection
├── cv/
│   ├── StreetViewAnalyzer.ts       # Google Street View image analysis
│   ├── GreeneryDetector.ts         # Tree/vegetation detection from SV images
│   ├── FacadeClassifier.ts         # Building facade condition assessment
│   ├── SidewalkAnalyzer.ts         # Sidewalk quality from Street View
│   ├── SignDetector.ts             # Street sign and wayfinding detection
│   └── InfrastructureAssessor.ts   # Utility/infrastructure condition rating
├── nlp/
│   ├── PlaceReviewAnalyzer.ts      # Sentiment analysis on Google Reviews
│   ├── PolicyDocumentParser.ts     # Extract policies from planning docs
│   └── CommunityFeedbackAnalyzer.ts# Classify public comments by theme
└── hooks/
    ├── useGeoMLInference.ts        # Run model inference
    ├── useTrainingData.ts          # Prepare labeled datasets
    └── useModelEvaluation.ts       # Accuracy metrics & cross-validation
```

### 22.2 Street View Computer Vision

Leverage Google Street View + AI for automated urban audit at scale:

```typescript
interface StreetViewCVPipeline {
  // Capture
  sampleStreetView(params: {
    network: NetworkGraph
    spacing: number              // meters between captures
    headings: number[]           // camera angles per point (e.g., [0, 90, 180, 270])
    fov: number                  // field of view
    pitch: number                // camera tilt
    imageSize: [number, number]  // px
  }): Promise<StreetViewSample[]>

  // Analyze
  segmentScene(image: ImageData): Promise<SemanticSegmentation>
  detectGreenery(image: ImageData): Promise<{ greenViewIndex: number; treeCount: number }>
  assessWalkability(image: ImageData): Promise<WalkabilityScore>
  classifyFacade(image: ImageData): Promise<FacadeClassification>
  detectInfrastructure(image: ImageData): Promise<InfrastructureDetection>
  estimateEnclosure(image: ImageData): Promise<{ enclosureRatio: number; skyFraction: number }>

  // Batch
  batchAnalyze(samples: StreetViewSample[], analyses: CVAnalysisType[]): Promise<CVBatchResult>

  // Output
  toGeoJSON(results: CVBatchResult): GeoJSON.FeatureCollection
}

interface SemanticSegmentation {
  classes: {
    sky: number           // percentage of image
    building: number
    vegetation: number
    road: number
    sidewalk: number
    vehicle: number
    person: number
    pole: number
    sign: number
    fence: number
    water: number
  }
  mask: Uint8Array        // Per-pixel class labels
}

// Green View Index (GVI) — Li et al. (2015), MIT Senseable City Lab
// Percentage of green pixels in Street View panorama
// Strong predictor of perceived urban quality & walkability
```

### 22.3 Spatial Feature Engineering

Automatic extraction of ML-ready features from geospatial data:

| Feature Category | Features Generated |
|---|---|
| **Morphological** | FAR, GSI, building density, height stats, footprint shape complexity, orientation entropy |
| **Network** | Street connectivity, intersection density, cul-de-sac ratio, block size stats, circuity |
| **Accessibility** | Distance to nearest: transit, school, park, hospital, grocery — via network |
| **Land Use** | Shannon entropy, Simpson index, residential/commercial/industrial percentages |
| **Environmental** | Mean NDVI, canopy %, impervious %, LST delta from rural, distance to water |
| **Socioeconomic** | Population density, income stats, education level, housing age, rent stats |
| **Temporal** | 5/10/20-year change rates for building area, population, NDVI, night lights |
| **Contextual** | Distance to CBD, distance to highway, distance to coast, elevation, slope |

---

## 23. Scientific Recommendations & Additions

Based on current best practices in urban science, the following are **recommended additions** beyond what was originally requested:

### 23.1 Reproducibility & Open Science

| Feature | Justification |
|---|---|
| **Analysis Provenance Tracking** | Every indicator computation and flow run should log: input datasets (with checksums), parameters, code version, timestamp. This enables full reproducibility per FAIR principles. |
| **Environment Lock Files** | Generate `conda-lock.yml` or `pip freeze` snapshots alongside projects for exact environment reproduction. |
| **Metadata Standards** | Auto-generate ISO 19115 / Dublin Core metadata for exported datasets. |
| **DOI-Ready Export** | Package analysis outputs for Zenodo/Figshare deposit with proper citation metadata. |

### 23.2 Spatial Data Quality Framework

| Feature | Justification |
|---|---|
| **Topology Checker** | Detect gaps, overlaps, slivers in polygon datasets (common GIS data quality issue). |
| **Completeness Audit** | Compare OSM coverage against reference datasets to assess data fitness-for-use. |
| **Temporal Consistency Check** | Flag when combining datasets from significantly different time periods. |
| **Positional Accuracy Estimator** | RMSE calculation for georeferenced datasets against control points. |

### 23.3 Urban Justice & Equity Module

| Feature | Justification |
|---|---|
| **Environmental Justice Screening** | Composite EJ index (race × income × pollution × health) following EPA EJScreen methodology. |
| **Displacement Risk Model** | Early warning system for gentrification-driven displacement (UC Berkeley Urban Displacement Project). |
| **Participatory Mapping Interface** | Allow community members to annotate maps with local knowledge (qualitative spatial data). |
| **Accessibility Equity Disaggregation** | All accessibility metrics should be disaggregable by demographic group. |

### 23.4 Climate Resilience Module

| Feature | Justification |
|---|---|
| **Urban Heat Island Scenarios** | Project UHI changes under different tree canopy / albedo / green infrastructure scenarios. |
| **Flood Inundation Mapping** | Simplified flood modeling from DEM + precipitation scenarios (not full hydraulic model, but rapid screening). |
| **Sea Level Rise Exposure** | Batch analysis of assets at risk under various SLR projections (IPCC RCP/SSP scenarios). |
| **Climate Migration Pressure Index** | Composite indicator of climate-driven population movement risk. |

### 23.5 Digital Twin Foundations

| Feature | Justification |
|---|---|
| **Real-Time Data Ingestion** | WebSocket/MQTT interface for IoT sensor data (traffic counters, air quality, noise). |
| **Temporal Slider** | Scrub through time-stamped datasets to see change. |
| **Live Dashboard Mode** | Auto-refreshing indicator dashboard for operational monitoring. |
| **Scenario Forking** | Branch a project into alternative scenarios and compare outcomes. |

### 23.6 Collaboration Features

| Feature | Justification |
|---|---|
| **Spatial Annotation** | Drop pins/polygons with comments on the map (akin to Figma comments). |
| **Analysis Review Workflow** | Submit analysis for peer review with tracked comments and approval. |
| **Shared Project Templates** | Organization-level templates for standardized analyses. |
| **Export to Stakeholder Portal** | Generate simplified, interactive web maps from analysis results. |

### 23.7 Advanced Analytical Methods

| Method | Description | Justification |
|---|---|---|
| **Space Syntax Integration** | Angular segment analysis, visual graph analysis | Understanding movement patterns and spatial configuration (Hillier & Hanson) |
| **Cellular Automata for Land Use** | SLEUTH-style urban growth simulation | Projecting urban expansion under different policy scenarios |
| **Agent-Based Pedestrian Simulation** | Mesa-based pedestrian flow modeling | Evaluating public space design and walkability interventions |
| **Hedonic Price Modeling** | Spatially-explicit property value regression | Understanding how urban features affect land value |
| **Spatial Microsimulation** | Synthetic population generation | Creating detailed demographic micro-data for areas without census data |
| **Machine Learning for Urban Classification** | RF/XGBoost for urban typology | Data-driven identification of neighborhood types |

### 23.8 Regulatory & Standards Compliance

| Standard | Integration |
|---|---|
| **INSPIRE Directive** (EU) | Metadata and data model compliance for European spatial data |
| **ISO 37120/37122** | City indicators for sustainable development |
| **New Urban Agenda (UN-Habitat)** | Alignment with global urban monitoring frameworks |
| **Complete Streets Standards** | NACTO guidelines for street design assessment |
| **LEED-ND / BREEAM Communities** | Neighborhood sustainability rating system criteria |
| **TCFD / TNFD** | Climate and nature-related financial disclosure metrics |

---

## 24. Internationalization (i18n)

### 24.1 Locale Files

Replace `src/locales/psych/` with:

```
src/locales/urban/
├── en.json    # English (primary)
├── tr.json    # Turkish
├── es.json    # Spanish
├── fr.json    # French
├── de.json    # German
├── pt.json    # Portuguese
├── zh.json    # Chinese (Simplified)
└── ar.json    # Arabic
```

### 24.2 Terminology Domains

- Urban planning terms
- GIS operations
- Statistical methods
- Environmental indicators
- Transport terminology
- Building/construction terms
- Administrative geography
- Regulatory frameworks

---

## 25. New Dependencies

### 25.1 NPM Packages to Add

```json
{
  "dependencies": {
    // ── Google Maps Platform ── ⭐ NEW
    "@vis.gl/react-google-maps": "^1.5.0",    // Official React wrapper for Google Maps
    "@googlemaps/js-api-loader": "^1.16.8",   // Dynamic API loader
    "@googlemaps/markerclusterer": "^2.5.3",  // Marker clustering for Google Maps
    "@deck.gl/google-maps": "^9.1.0",         // deck.gl overlay on Google Maps

    // ── GIS & Mapping ──
    "deck.gl": "^9.1.0",                       // WebGL map layers
    "@deck.gl/react": "^9.1.0",                // React bindings
    "@deck.gl/layers": "^9.1.0",               // Standard layers
    "@deck.gl/geo-layers": "^9.1.0",           // GeoJSON, Tile, H3, MVT
    "@deck.gl/mesh-layers": "^9.1.0",          // 3D mesh rendering
    "@deck.gl/aggregation-layers": "^9.1.0",   // Heatmap, Hexagon, Contour
    "@loaders.gl/core": "^4.3.0",              // Universal loader framework
    "@loaders.gl/csv": "^4.3.0",               // CSV/TSV loader
    "@loaders.gl/json": "^4.3.0",              // GeoJSON loader
    "@loaders.gl/shapefile": "^4.3.0",         // Shapefile loader (SHP+DBF+PRJ)
    "@loaders.gl/geopackage": "^4.3.0",        // GeoPackage loader
    "@loaders.gl/las": "^4.3.0",               // LAS/LAZ point cloud loader
    "@loaders.gl/3d-tiles": "^4.3.0",          // 3D Tiles (Cesium)
    "@loaders.gl/netcdf": "^4.3.0",            // NetCDF loader
    "@loaders.gl/wms": "^4.3.0",               // WMS/WMTS client
    "mapbox-gl": "^3.9.0",                     // Mapbox basemap renderer
    "react-map-gl": "^7.1.8",                  // React wrapper for Mapbox
    "@turf/turf": "^7.2.0",                    // Spatial operations
    "proj4": "^2.15.0",                        // CRS transformations
    "supercluster": "^8.0.1",                  // Point clustering
    "geotiff": "^2.1.3",                       // GeoTIFF/COG reader
    "flatgeobuf": "^3.35.0",                   // FlatGeobuf reader (streaming)
    "pmtiles": "^4.2.0",                       // PMTiles reader
    "h3-js": "^4.2.1",                         // H3 hexagonal grid
    "s2-geometry": "^1.2.0",                   // S2 spherical geometry cells
    "shpjs": "^6.1.0",                         // Shapefile reader
    "parquet-wasm": "^0.6.1",                  // GeoParquet reader (WASM)

    // ── WASM Geo Engines ── ⭐ NEW
    "geos-wasm": "^2.0.0",                     // GEOS topology engine in WASM
    "gdal3.js": "^2.8.0",                      // GDAL in WASM (format conversion, reproject)
    "@aspect/duckdb-wasm": "^1.29.0",          // DuckDB spatial SQL in browser

    // ── 3D & VoxCity ──
    "@react-three/fiber": "^8.18.0",           // React three.js renderer
    "@react-three/drei": "^9.121.0",           // Three.js helpers
    "@react-three/postprocessing": "^2.16.0",  // Post-processing effects
    "three-csg-ts": "^3.2.0",                  // 3D boolean/CSG operations
    "potree-core": "^2.0.0",                   // Point cloud rendering

    // ── Data Processing ──
    "arquero": "^5.4.1",                       // Data wrangling (like pandas)
    "d3-scale-chromatic": "^3.1.0",            // Color scales for maps
    "d3-scale": "^4.0.2",                      // Scale functions
    "d3-array": "^3.2.4",                      // Statistical functions
    "d3-geo": "^3.1.0",                        // Geographic projections
    "d3-geo-voronoi": "^2.0.2",                // Spherical Voronoi
    "d3-delaunay": "^6.0.4",                   // Delaunay triangulation
    "d3-contour": "^4.0.2",                    // Contour generation
    "d3-hexbin": "^0.2.2",                     // Hexagonal binning
    "papaparse": "^5.5.2",                     // CSV parsing
    "simple-statistics": "^7.8.8",             // Statistical functions
    "ml-matrix": "^6.12.0",                    // Matrix operations (PCA, regression)
    "rbush": "^4.0.1",                         // R-tree spatial index

    // ── Streaming & Real-Time ── ⭐ NEW
    "mqtt": "^5.10.0",                          // MQTT client for IoT data
    "protobufjs": "^7.4.0",                    // GTFS-RT protobuf decoding

    // ── Charting ──
    "plotly.js-dist-min": "^2.35.0",           // Plotly for advanced charts
    "react-plotly.js": "^2.6.0"                // React wrapper
  },
  "devDependencies": {
    "@types/geojson": "^7946.0.14",
    "@types/google.maps": "^3.58.0",           // ⭐ Google Maps type definitions
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
  }
}
```

### 25.2 NPM Packages to Remove

```
- (No packages removed — chart.js, recharts, three, tensorflow all still useful)
```

### 25.3 Python Environment File (`environment.yml`)

```yaml
name: urban-analytics
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.11
  # Core
  - geopandas>=1.0
  - shapely>=2.0
  - fiona>=1.10
  - pyproj>=3.7
  - rasterio>=1.4
  - xarray>=2024.1
  # Network
  - osmnx>=2.0
  - networkx>=3.4
  - pandana>=0.7
  - momepy>=0.9
  # Remote Sensing
  - rioxarray>=0.17
  - earthengine-api>=1.4
  - scikit-image>=0.24
  # Statistics
  - libpysal>=4.12
  - esda>=2.6
  - spreg>=1.7
  - splot>=1.1
  - pointpats>=2.4
  - tobler>=0.12
  - mapclassify>=2.8
  # ML
  - scikit-learn>=1.5
  - xgboost>=2.1
  - statsmodels>=0.14
  # Visualization
  - matplotlib>=3.9
  - folium>=0.18
  - plotly>=5.24
  - pydeck>=0.9
  - contextily>=1.6
  - datashader>=0.16
  # Data
  - pandas>=2.2
  - polars>=1.9
  - duckdb>=1.1
  - h3-py>=4.1
  - geopy>=2.4
  # Simulation
  - mesa>=3.1
  - voxcity>=0.2
  # I/O
  - gtfs-kit>=7.0
  - overpy>=0.7
  - cenpy>=1.0
  - wbgapi>=1.0
  # Utils
  - jupyterlab>=4.3
  - ipykernel>=6.29
  - pip:
    - pystac-client>=0.8
    - urbanaccess>=0.3
```

---

## 26. Migration Phases & File Map

### Phase 1: Foundation (Core Types & Store)

| Action | Files |
|---|---|
| Create feature directory | `src/features/urbanAnalytics/` |
| Define type system | `src/features/urbanAnalytics/lib/types.ts` |
| Create section hierarchy | `src/features/urbanAnalytics/lib/sectionHierarchy.ts` |
| Create tag groups | `src/features/urbanAnalytics/lib/tagGroups.ts` |
| Create store | `src/features/urbanAnalytics/store.ts` |
| Create icons | `src/features/urbanAnalytics/icons.tsx` |

### Phase 2: Modal & Navigation

| Action | Files |
|---|---|
| Create UrbanAnalyticsModal | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` |
| Create RailContainer | `src/features/urbanAnalytics/rail/RailContainer.tsx` |
| Create rightPanelRegistry | `src/features/urbanAnalytics/rightPanelRegistry.ts` |
| Update App.tsx | Replace PsychiatryModal → UrbanAnalyticsModal |

### Phase 3: Seed Content (Cards)

| Action | Files |
|---|---|
| Project scoping cards | `src/features/urbanAnalytics/seeds/projectScoping.ts` |
| Baseline assessment cards | `src/features/urbanAnalytics/seeds/baselineAssessment.ts` |
| Urban indicators cards | `src/features/urbanAnalytics/seeds/urbanIndicators.ts` |
| Vulnerability cards | `src/features/urbanAnalytics/seeds/vulnerability.ts` |
| Urban typology cards | `src/features/urbanAnalytics/seeds/urbanTypology.ts` |
| Intervention design cards | `src/features/urbanAnalytics/seeds/interventionDesign.ts` |
| Policy instruments cards | `src/features/urbanAnalytics/seeds/policyInstruments.ts` |
| Transport networks cards | `src/features/urbanAnalytics/seeds/transportNetworks.ts` |
| Remote sensing cards | `src/features/urbanAnalytics/seeds/remoteSensing.ts` |
| Spatial statistics cards | `src/features/urbanAnalytics/seeds/spatialStats.ts` |
| GIS methods cards | `src/features/urbanAnalytics/seeds/gisMethods.ts` |
| Data engineering cards | `src/features/urbanAnalytics/seeds/dataEngineering.ts` |
| Report templates cards | `src/features/urbanAnalytics/seeds/reportTemplates.ts` |

### Phase 4: Calculators

| Action | Files |
|---|---|
| Morphology calculators | `src/features/urbanAnalytics/calculators/morphology.ts` |
| Accessibility calculators | `src/features/urbanAnalytics/calculators/accessibility.ts` |
| Environment calculators | `src/features/urbanAnalytics/calculators/environment.ts` |
| Socioeconomic calculators | `src/features/urbanAnalytics/calculators/socioeconomic.ts` |
| Resilience calculators | `src/features/urbanAnalytics/calculators/resilience.ts` |
| SDG 11 calculators | `src/features/urbanAnalytics/calculators/sdg11.ts` |

### Phase 5: Analytical Flows

| Action | Files |
|---|---|
| Flow type definitions | `src/centerpanel/Flows/flowTypes.ts` (update) |
| Flow host router | `src/centerpanel/Flows/FlowHost.tsx` (update) |
| Site suitability flow | `src/centerpanel/Flows/SiteSuitabilityFlow.tsx` |
| Accessibility flow | `src/centerpanel/Flows/AccessibilityFlow.tsx` |
| Vulnerability flow | `src/centerpanel/Flows/VulnerabilityFlow.tsx` |
| Indicator composite flow | `src/centerpanel/Flows/IndicatorCompositeFlow.tsx` |
| Scenario comparison flow | `src/centerpanel/Flows/ScenarioComparisonFlow.tsx` |
| Equity audit flow | `src/centerpanel/Flows/EquityAuditFlow.tsx` |
| Change detection flow | `src/centerpanel/Flows/ChangeDetectionFlow.tsx` |
| Flow builders | `src/centerpanel/Flows/builders/` (new builders) |

### Phase 6: Center Panel

| Action | Files |
|---|---|
| Update sections | `src/centerpanel/sections.ts` |
| Update CenterPanelShell tabs | `src/centerpanel/CenterPanelShell.tsx` |
| Replace ClinicalSnapshotStrip | `src/centerpanel/UrbanContextStrip.tsx` |
| Update registry types | `src/centerpanel/registry/types.ts` |
| Update registry state | `src/centerpanel/registry/state.ts` |
| Update registry UI | `src/centerpanel/registry-ui/*.tsx` |
| Update note tab | `src/centerpanel/tabs/Note.tsx` |
| Replace guides | `src/centerpanel/Guide/` (new guide content) |

### Phase 7: GIS Infrastructure

| Action | Files |
|---|---|
| Map component suite | `src/components/map/` (new directory) |
| VoxCity module | `src/features/urbanAnalytics/voxcity/` |
| GIS utilities | `src/utils/geo/` |

### Phase 8: Python Integration

| Action | Files |
|---|---|
| Environment manager | `src/features/urbanAnalytics/python/` |
| Script templates | `src/features/urbanAnalytics/python/templates/` |
| Environment spec | `environment.yml` (project root) |
| Requirements file | `requirements.txt` (project root) |

### Phase 9: AI & Locales

| Action | Files |
|---|---|
| Update system prompts | `src/services/ai/context/` |
| Add urban guardrails | `src/services/ai/guardrails/` |
| Update locale files | `src/locales/urban/` |
| Update i18n config | `src/i18n/index.ts` |

### Phase 10: Stores & Cleanup

| Action | Files |
|---|---|
| Update/rename stores | `src/stores/useNewProjectDraftStore.ts` (was useNewPatientDraftStore) |
| Update app store | `src/stores/appStore.ts` |
| Remove old psychiatry feature | `src/features/psychiatry/` → archive |
| Final integration testing | All entry points |

---

## 27. Risk Register & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **GIS library bundle size** | Medium | Tree-shake deck.gl layers; lazy-load map components; code-split VoxCity viewer |
| **WebGL context limits** | Medium | Single shared WebGL context for deck.gl + three.js; graceful fallback for low-end GPUs |
| **WebGPU browser support** | Medium | Feature-detect WebGPU; fallback to WebGL2 compute (slower); fallback to CPU for unsupported browsers |
| **Google Maps API costs** | High | Implement per-API quota tracking; client-side response caching (IndexedDB); hard monthly budget cap; alert at 80% budget; use free alternatives (OSM/Nominatim) for non-critical calls |
| **Google Maps API key security** | High | Restrict API key to HTTP referrers; enable only needed APIs; store encrypted (AES-256-GCM) in localForage; never expose in client bundle; rotate keys quarterly |
| **Google Maps rate limits** | Medium | Request queuing with exponential backoff; batch geocoding/distance requests; cache aggressively (TTL-based); degrade gracefully to OSM/OSRM |
| **Python environment complexity** | High | Provide pre-built conda environment; Docker container option; poetry lockfile for determinism |
| **Cross-origin tile loading** | Low | Configure CORS proxy; prefer CORS-enabled tile services |
| **Large dataset performance** | High | WebGPU compute for raster ops; Web Workers for vector ops; WASM geoprocessing; spatial indexing (R-tree); LOD for 3D; data pagination via FlatGeobuf/PMTiles streaming |
| **WASM memory limits** | Medium | Stream large files in chunks; use SharedArrayBuffer where possible; monitor WASM heap with growth callbacks |
| **CRS transformation errors** | Medium | Use PROJ WASM for survey-grade accuracy; always validate/transform to EPSG:4326 for display; warn on CRS mismatches |
| **DuckDB-WASM memory** | Medium | Limit table sizes in browser (suggest Python for >500MB); use memory-mapped Parquet; offload to server for massive datasets |
| **VoxCity format compatibility** | Medium | Abstract loader with fallback parsing; validate grid integrity on import |
| **Regulatory compliance (GDPR)** | Medium | Anonymize demographic data; no PII in stored projects; data processing agreements for APIs |
| **Satellite data volume** | High | COG for partial reads; STAC catalog for discovery; client-side tiling with PMTiles |
| **Real-time stream overload** | Medium | Ring buffer with configurable capacity; auto-downsample at high event rates; H3 spatial aggregation for dense streams |
| **Offline capability** | Low | Cache tiles in IndexedDB (PMTiles local); store projects in IndexedDB; queue API requests for replay |

---

## Appendix A: Example Card Content — Urban Indicators

```typescript
// src/features/urbanAnalytics/seeds/urbanIndicators.ts

export function buildUrbanIndicatorCards(): Card[] {
  return [
    {
      id: 'ind-walk-score',
      title: 'Walk Score Calculator',
      sectionId: 'urban_indicators',
      summary: 'Compute Walk Score for a location based on proximity to amenities via pedestrian network. Uses distance-decay functions across 9 amenity categories with network-based (not Euclidean) distances.',
      tags: ['pedestrian', 'mobility', 'accessibility'],
      evidence: [
        { title: 'Walk Score methodology', authors: 'Walk Score Inc.', year: 2024, doi: '' },
        { title: 'Validating Walk Score with empirical walking behavior', authors: 'Duncan et al.', year: 2011, journal: 'Am J Prev Med', doi: '10.1016/j.amepre.2011.06.029' }
      ],
      prompts: [
        {
          id: 'walk-score-compute',
          label: 'Compute Walk Score',
          template: 'Calculate the Walk Score for the location at {{latitude}}, {{longitude}} considering the following amenity categories: {{categories}}. Use a pedestrian network from OSM within {{radius_m}} meters.',
          variables: [
            { key: 'latitude', label: 'Latitude', type: 'number', required: true },
            { key: 'longitude', label: 'Longitude', type: 'number', required: true },
            { key: 'radius_m', label: 'Search Radius (m)', type: 'number', default: '1600' },
            { key: 'categories', label: 'Amenity Categories', type: 'tags', 
              options: ['grocery', 'restaurant', 'shopping', 'coffee', 'bank', 'park', 'school', 'entertainment', 'bookstore'] }
          ]
        }
      ],
      tools: ['osmnx', 'pandana', 'geopandas'],
      methodology: 'Network-based distance decay with category-weighted polynomial function',
      sdgAlignment: ['11.2', '11.7']
    },
    {
      id: 'ind-ndvi',
      title: 'NDVI Vegetation Index',
      sectionId: 'urban_indicators',
      summary: 'Compute Normalized Difference Vegetation Index from multispectral satellite imagery (Sentinel-2 or Landsat). NDVI = (NIR - RED) / (NIR + RED). Values range from -1 to +1, with >0.3 indicating healthy vegetation.',
      tags: ['green_infra', 'remote_sensing', 'canopy', 'climate'],
      evidence: [
        { title: 'Monitoring vegetation systems in the Great Plains with ERTS', authors: 'Rouse et al.', year: 1974, journal: 'NASA SP-351' },
        { title: 'Relationships between NDVI and urban green space metrics', authors: 'Gupta et al.', year: 2012, journal: 'Urban Forestry & Urban Greening' }
      ],
      prompts: [
        {
          id: 'ndvi-compute',
          label: 'Compute NDVI',
          template: 'Calculate NDVI for the study area bounded by {{bbox}} using {{satellite}} imagery from {{date_range}}. Mask clouds and water bodies. Compute zonal statistics per {{zone_type}}.',
          variables: [
            { key: 'bbox', label: 'Bounding Box (W,S,E,N)', type: 'text', required: true },
            { key: 'satellite', label: 'Satellite', type: 'select', options: ['Sentinel-2', 'Landsat-8', 'Landsat-9'] },
            { key: 'date_range', label: 'Date Range', type: 'text', placeholder: '2025-06-01 to 2025-08-31' },
            { key: 'zone_type', label: 'Aggregation Zone', type: 'select', options: ['census_tract', 'neighborhood', 'hexagon_h3_res8', 'grid_100m', 'custom_polygon'] }
          ]
        }
      ],
      tools: ['rasterio', 'rioxarray', 'earthengine-api', 'rasterstats'],
      methodology: 'Band ratio spectral index with cloud masking and zonal aggregation',
      sdgAlignment: ['11.7', '15.1']
    }
  ]
}
```

---

## Appendix B: Example Analytical Flow — 15-Minute City

```
┌─────────────────────────────────────────────┐
│          15-MINUTE CITY ANALYSIS             │
├─────────────────────────────────────────────┤
│                                             │
│  Step 1: Define Essential Services          │
│  ┌─────────────────────────────────┐        │
│  │ ☑ Grocery / Supermarket         │        │
│  │ ☑ Primary School                │        │
│  │ ☑ Healthcare (GP / Pharmacy)    │        │
│  │ ☑ Public Park / Green Space     │        │
│  │ ☑ Public Transit Stop           │        │
│  │ ☐ Library / Community Center    │        │
│  │ ☐ Post Office / Bank            │        │
│  │ ☐ Restaurant / Café             │        │
│  │ ☐ Gym / Sports Facility         │        │
│  │ ☑ Custom: _______________       │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Step 2: Travel Parameters                  │
│  ┌─────────────────────────────────┐        │
│  │ Mode: ○ Walk  ○ Cycle  ○ Both   │        │
│  │ Walk threshold: [15] minutes    │        │
│  │ Cycle threshold: [15] minutes   │        │
│  │ Walk speed: [4.5] km/h          │        │
│  │ Cycle speed: [15] km/h          │        │
│  │ Slope penalty: ☑ Enabled        │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Step 3: Data Sources                       │
│  ┌─────────────────────────────────┐        │
│  │ POIs: ○ OSM  ○ Custom GeoJSON   │        │
│  │ Network: ○ OSM  ○ Custom        │        │
│  │ Population: ○ Census  ○ Grid    │        │
│  │ DEM (for slope): ○ SRTM  ○ None │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Step 4: Compute & Results                  │
│  ┌─────────────────────────────────┐        │
│  │ ▶ Run Analysis                  │        │
│  │                                 │        │
│  │ Coverage by category:           │        │
│  │   Grocery:    87.3% ████████▓   │        │
│  │   School:     91.2% █████████▓  │        │
│  │   Healthcare: 72.1% ███████▒    │        │
│  │   Park:       65.8% ██████▓     │        │
│  │   Transit:    78.4% ███████▓    │        │
│  │                                 │        │
│  │ Overall 15-min score: 74.2%     │        │
│  │ Pop-weighted score:   69.8%     │        │
│  │                                 │        │
│  │ Equity gap (Q5-Q1):  28.3pp     │        │
│  │ Worst-served zones:  [map ↗]    │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Step 5: Generate Report                    │
│  ┌─────────────────────────────────┐        │
│  │ [Insert into Report]            │        │
│  │ [Export Map as PNG]             │        │
│  │ [Download GeoJSON Results]      │        │
│  │ [Generate Python Script]        │        │
│  └─────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Appendix C: File-Level Change Manifest

<details>
<summary>Click to expand complete file change list</summary>

### Files to CREATE (new)

```
src/features/urbanAnalytics/UrbanAnalyticsModal.tsx
src/features/urbanAnalytics/store.ts
src/features/urbanAnalytics/icons.tsx
src/features/urbanAnalytics/rightPanelRegistry.ts
src/features/urbanAnalytics/lib/types.ts
src/features/urbanAnalytics/lib/sectionHierarchy.ts
src/features/urbanAnalytics/lib/tagGroups.ts
src/features/urbanAnalytics/rail/RailContainer.tsx
src/features/urbanAnalytics/seeds/projectScoping.ts
src/features/urbanAnalytics/seeds/baselineAssessment.ts
src/features/urbanAnalytics/seeds/urbanIndicators.ts
src/features/urbanAnalytics/seeds/vulnerability.ts
src/features/urbanAnalytics/seeds/urbanTypology.ts
src/features/urbanAnalytics/seeds/interventionDesign.ts
src/features/urbanAnalytics/seeds/policyInstruments.ts
src/features/urbanAnalytics/seeds/transportNetworks.ts
src/features/urbanAnalytics/seeds/remoteSensing.ts
src/features/urbanAnalytics/seeds/spatialStats.ts
src/features/urbanAnalytics/seeds/gisMethods.ts
src/features/urbanAnalytics/seeds/dataEngineering.ts
src/features/urbanAnalytics/seeds/reportTemplates.ts
src/features/urbanAnalytics/seeds/stakeholderEngagement.ts
src/features/urbanAnalytics/calculators/morphology.ts
src/features/urbanAnalytics/calculators/accessibility.ts
src/features/urbanAnalytics/calculators/environment.ts
src/features/urbanAnalytics/calculators/socioeconomic.ts
src/features/urbanAnalytics/calculators/resilience.ts
src/features/urbanAnalytics/calculators/sdg11.ts
src/features/urbanAnalytics/voxcity/VoxCityViewer.tsx
src/features/urbanAnalytics/voxcity/VoxCityControls.tsx
src/features/urbanAnalytics/voxcity/VoxGridLoader.ts
src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx
src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx
src/features/urbanAnalytics/voxcity/types.ts
src/features/urbanAnalytics/voxcity/hooks/useVoxScene.ts
src/features/urbanAnalytics/voxcity/simulations/*.ts
src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx
src/features/urbanAnalytics/python/PackageManager.tsx
src/features/urbanAnalytics/python/ScriptTemplates.tsx
src/features/urbanAnalytics/python/DataBridge.ts
src/features/urbanAnalytics/python/templates/*.py
src/components/map/MapContainer.tsx
src/components/map/MapControls.tsx
src/components/map/LayerManager.tsx
src/components/map/DrawingTools.tsx
src/components/map/MapLegend.tsx
src/components/map/layers/*.tsx
src/components/map/hooks/*.ts
src/components/map/utils/*.ts
src/centerpanel/UrbanContextStrip.tsx
src/centerpanel/Flows/SiteSuitabilityFlow.tsx
src/centerpanel/Flows/AccessibilityFlow.tsx
src/centerpanel/Flows/VulnerabilityFlow.tsx
src/centerpanel/Flows/IndicatorCompositeFlow.tsx
src/centerpanel/Flows/ScenarioComparisonFlow.tsx
src/centerpanel/Flows/EquityAuditFlow.tsx
src/centerpanel/Flows/ChangeDetectionFlow.tsx
src/centerpanel/Flows/builders/suitabilityOutcome.ts
src/centerpanel/Flows/builders/accessibilityOutcome.ts
src/centerpanel/Flows/builders/vulnerabilityOutcome.ts
src/centerpanel/Flows/builders/equityOutcome.ts
src/locales/urban/en.json
src/locales/urban/tr.json
environment.yml
requirements.txt
```

### Files to MODIFY (update content)

```
src/App.tsx                           # PsychiatryModal → UrbanAnalyticsModal
src/main.tsx                          # Remove psych debug imports
src/centerpanel/CenterPanelShell.tsx  # Tab names
src/centerpanel/sections.ts           # Section definitions
src/centerpanel/Flows/flowTypes.ts    # Flow IDs
src/centerpanel/Flows/FlowHost.tsx    # Flow routing
src/centerpanel/registry/types.ts     # Patient → StudyArea
src/centerpanel/registry/state.ts     # Registry state
src/centerpanel/registry-ui/*.tsx     # All registry UI components
src/centerpanel/tabs/Note.tsx         # Note slot labels
src/centerpanel/Guide/*.tsx           # Guide content
src/centerpanel/Guide/guideTypes.ts   # Guide categories
src/stores/useNewPatientDraftStore.ts # → useNewProjectDraftStore.ts
src/stores/useCalcStore.ts            # Calculator types
src/stores/useFlowStore.ts            # Flow types
src/stores/useNoteStore.ts            # Note slot labels
src/stores/appStore.ts                # App name, metadata
src/i18n/index.ts                     # Locale path
src/constants/app.ts                  # App name, labels
src/config/env.ts                     # Service name
package.json                          # New dependencies
```

### Files to ARCHIVE (move to `_archive/psychiatry/`)

```
src/features/psychiatry/              # Entire directory
src/locales/psych/                    # Psychiatry locale files
```

</details>

---

## Appendix D: Glossary

| Term | Definition |
|---|---|
| **ABM** | Agent-Based Model — simulation of autonomous agents interacting in an environment |
| **AHP** | Analytic Hierarchy Process — multi-criteria decision method using pairwise comparisons |
| **COG** | Cloud-Optimized GeoTIFF — raster format enabling efficient partial reads via HTTP range requests |
| **CRS** | Coordinate Reference System — defines how spatial coordinates relate to Earth's surface |
| **DEM** | Digital Elevation Model — raster representation of terrain height |
| **FAIR** | Findable, Accessible, Interoperable, Reusable — data management principles |
| **FAR** | Floor Area Ratio — total building floor area divided by lot area |
| **GIS** | Geographic Information System — framework for managing spatial data |
| **GTFS** | General Transit Feed Specification — standard for public transit data |
| **GSI** | Ground Space Index — building footprint area divided by lot area |
| **H3** | Uber's hexagonal hierarchical spatial index |
| **INSPIRE** | EU directive for spatial data infrastructure interoperability |
| **KPI** | Key Performance Indicator |
| **LISA** | Local Indicators of Spatial Association — spatial cluster detection |
| **LOS** | Level of Service — qualitative measure (A-F) of transport facility performance |
| **LST** | Land Surface Temperature — surface thermal emission measured by satellite |
| **M&E** | Monitoring & Evaluation |
| **MXI** | Mixed-Use Index — measure of land use diversity |
| **NDBI** | Normalized Difference Built-up Index — spectral index for built areas |
| **NDVI** | Normalized Difference Vegetation Index — spectral index for vegetation |
| **NDWI** | Normalized Difference Water Index — spectral index for water bodies |
| **OD** | Origin-Destination — paired locations for trip analysis |
| **OSM** | OpenStreetMap — collaborative open geospatial database |
| **OSR** | Open Space Ratio — non-built area per unit of floor area |
| **PMTiles** | Single-file tile archive for efficient serverless deployment |
| **POI** | Point of Interest — geographic feature (shop, park, station) |
| **SDG** | Sustainable Development Goals (UN) |
| **STAC** | SpatioTemporal Asset Catalog — specification for geospatial data discovery |
| **SVF** | Sky View Factor — visible sky proportion from a point |
| **TOD** | Transit-Oriented Development — dense mixed-use near transit |
| **UHI** | Urban Heat Island — urban area warmer than surroundings |
| **UTCI** | Universal Thermal Climate Index — outdoor thermal comfort metric |

---

*End of Transformation Plan*
