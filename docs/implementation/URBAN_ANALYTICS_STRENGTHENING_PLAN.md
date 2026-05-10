# SynapseCore Urban Analytics Workbench: A Comprehensive Enhancement Strategy for World-Class Spatial Intelligence in Planning Education and Research

> **Document Classification**: Strategic Development Plan — Q1 Reference-Grade  
> **Version**: 2.0 | **Date**: 21 March 2026  
> **Scope**: Platform architecture, analytical capability expansion, pedagogical integration  
> **Audience**: Urban informatics researchers, planning educators, spatial data scientists, platform engineers

---

## Abstract

SynapseCore Urban Analytics Workbench is a browser-native spatial intelligence platform built on React 19, TypeScript 5, Vite 6, deck.gl 9, and DuckDB-WASM. In its current state, the platform provides 27 peer-reviewed urban indicator calculators, three multi-step analytical workflows (site suitability, accessibility, vulnerability), a full network analysis engine (Dijkstra, A\*, space syntax, centrality), six cartographic classification schemes, GPU-accelerated raster computation, and multi-provider AI integration (OpenAI, Anthropic, Gemini, Ollama). Five real-time data connectors service OSM Overpass, US Census, Google Places, Nominatim geocoding, and GTFS transit feeds.

This document presents a systematic enhancement strategy across seven strategic axes designed to elevate SynapseCore from a capable analytical tool to a **research-grade, curriculum-ready urban analytics platform** suitable for graduate planning education and publishable spatial research. The strategy addresses critical gaps in spatial statistics, Earth observation integration, geospatial AI, 3D urban modelling, scenario simulation, collaborative decision support, and computational scalability — while embedding pedagogical scaffolding throughout the platform architecture.

**Keywords**: urban analytics, spatial statistics, GeoAI, digital twin, planning education, browser-native GIS, spatial decision support, SDG 11

---

## Table of Contents

1. [Situational Assessment: Current Capability Inventory](#1-situational-assessment)
2. [Strategic Gap Analysis: Seven Enhancement Axes](#2-strategic-gap-analysis)
3. [Axis 1 — Spatial Statistical Depth](#3-axis-1-spatial-statistical-depth)
4. [Axis 2 — Data Ecosystem Expansion](#4-axis-2-data-ecosystem-expansion)
5. [Axis 3 — Geospatial Artificial Intelligence (GeoAI)](#5-axis-3-geospatial-ai)
6. [Axis 4 — 3D Urban Modelling & Digital Twin](#6-axis-4-3d-urban-modelling)
7. [Axis 5 — Scenario Planning & Simulation](#7-axis-5-scenario-planning)
8. [Axis 6 — Visualisation, Reporting & Decision Support](#8-axis-6-visualisation-reporting)
9. [Axis 7 — Performance, Scalability & Computation](#9-axis-7-performance-scalability)
10. [Planning Education & Curriculum Integration](#10-planning-education-curriculum)
11. [New Indicator Groups: 53 Additional Metrics](#11-new-indicator-groups)
12. [Competitive Positioning & Differentiation](#12-competitive-positioning)
13. [Implementation Roadmap & Phasing](#13-implementation-roadmap)
14. [Technical Debt Remediation](#14-technical-debt)
15. [References](#15-references)

---

## 1. Situational Assessment: Current Capability Inventory <a name="1-situational-assessment"></a>

### 1.1 Analytical Calculators (27 Operational)

The platform currently implements 27 urban indicator calculators across six thematic domains. All employ peer-reviewed methodologies with explicit scientific references, classification thresholds grounded in published literature, and normalised output ranges.

| Domain | Count | Key Methods | Primary References |
|--------|-------|------------|-------------------|
| **Urban Morphology** | 5 | FAR/FSI, GSI/BCR, OSR, Shannon mixed-use entropy, graph-theoretic street connectivity (α, β, γ indices) | Berghauser Pont & Haupt (2010); Kansky (1963); Shannon (1948) |
| **Accessibility** | 4 | 9-category distance-decay walk score, transit frequency scoring, Hansen gravity model, cumulative opportunities | Carr et al. (2010); Hansen (1959); Mavoa et al. (2012); Geurs & van Wee (2004) |
| **Environment** | 5 | NDVI, UHI intensity (ΔT), green space per capita, tree canopy coverage, impervious surface ratio | Rouse et al. (1973); Oke (1982); WHO (2016); Arnold & Gibbons (1996) |
| **Socioeconomic** | 5 | Gini coefficient, Shannon/Simpson diversity, jobs–housing balance, displacement risk composite | Gini (1912); Simpson (1949); Cervero (1989); Chapple & Zuk (2016) |
| **Resilience** | 4 | SoVI (7-factor composite), flood exposure (weighted area/population/asset), adaptive capacity index, IPCC compound risk | Cutter et al. (2003); UNDRR (2015); Adger (2003); IPCC (2014) |
| **SDG 11** | 7 | All seven UN-Habitat monitoring indicators (11.1.1–11.7.1) including LCRPGR land consumption ratio | UN-Habitat (2020, 2023); WHO (2021); UNDRR (2020) |

### 1.2 Analytical Workflows (3 Implemented, 5 Placeholder)

| Flow | Status | Steps | Framework |
|------|--------|-------|-----------|
| **Site Suitability Analysis** | ✅ Complete | 7 | Multi-criteria weighted overlay; AHP/rank-sum weighting; Monte Carlo sensitivity (100–10,000 runs) |
| **Accessibility Analysis** | ✅ Complete | 7 | Multi-modal isochrone generation; 12 POI categories; equity disaggregation by income/race/age/disability |
| **Vulnerability Assessment** | ✅ Complete | 7 | IPCC AR6 framework: Vulnerability = Hazard × Exposure × Sensitivity − Adaptive Capacity |
| Composite Indicator Builder | ⬜ Placeholder | — | Normalization + weighting + aggregation pipeline |
| Scenario Comparison | ⬜ Placeholder | — | Side-by-side delta analysis (2–4 scenarios) |
| Equity Audit | ⬜ Placeholder | — | Disaggregated service distribution; Gini, Theil, Atkinson measures |
| Change Detection | ⬜ Placeholder | — | Bi-temporal change quantification; post-classification, differencing, CVA |
| Run Review | ⬜ Placeholder | — | Completed analysis output inspection and revision |

### 1.3 Computational Engines

| Engine | Module | Status | Capabilities |
|--------|--------|--------|-------------|
| **Network** | `src/engine/network/` | ✅ Full | Dijkstra, A\*, isochrone, batch OD matrix, betweenness/closeness/PageRank centrality, space syntax (integration, choice, NACH, NAIN), OSM network builder |
| **Cartography** | `src/engine/carto/` | ✅ Full | Natural breaks (Fisher-Jenks), quantile, equal interval, standard deviation, head/tail breaks, pretty breaks; bivariate choropleth (3×3, 4×4 Stevens matrices); 15+ ColorBrewer palettes; print composer |
| **GPU Compute** | `src/engine/gpu/` | ⚠️ Partial | WebGPU context management; NDVI, band math, hillshade (Horn 1981), KDE (Gaussian kernel); 16×16 workgroups |
| **Spatial DB** | `src/engine/spatial-db/` | ⚠️ Partial | DuckDB-WASM with spatial functions (ST_Distance, ST_Contains, ST_Intersects); SQL editor with live preview |
| **GeoAI** | `src/engine/geoai/` | ❌ Stub | Directory structure only (cv/, nlp/, models/, hooks/); no implementation |
| **Streaming** | `src/engine/streaming/` | ❌ Stub | Empty index export |
| **WASM** | `src/engine/wasm/` | ❌ Stub | Empty index export |

### 1.4 Map System & Data Connectors

**Mapping**: deck.gl canvas with 8+ layer types (GeoJSON, choropleth, heatmap, point, arc, hex, raster, path); drawing tools (point, line, polygon, circle, rectangle, freehand); geocoder search (Nominatim); temporal slider; spatial filter; swipe comparison; minimap inset; coordinate display (DD, DMS, MGRS); scale bar; map legend with auto-generation.

**Data Connectors** (5 operational):

| Connector | Source | Data Domain |
|-----------|--------|-------------|
| `OverpassConnector` | OpenStreetMap | Buildings, roads, POIs, land use |
| `CensusConnector` | US Census Bureau | Demographics, economics, housing |
| `GoogleMapsConnector` | Google Places API | POI search, details, photos |
| `NominatimConnector` | OSM Nominatim | Forward/reverse geocoding |
| `GTFSLoader` | General Transit Feed | Stops, routes, schedules |

### 1.5 AI Integration

Five provider backends (OpenAI, Anthropic, Gemini, Ollama, Custom) with 25+ models, streaming support, sampling parameter mapping, API key management, and RAG infrastructure (corpus, embeddings, chunkers, retriever, citations). Agent framework exists (orchestrator, policy, roles, rubrics) but autonomous capability is minimal.

---

## 2. Strategic Gap Analysis: Seven Enhancement Axes <a name="2-strategic-gap-analysis"></a>

Cross-referencing the current capability inventory against the requirements of a Q1-grade urban analytics platform suitable for planning education reveals seven critical enhancement axes:

| Axis | Current State | Target State | Gap Severity |
|------|--------------|-------------|-------------|
| **1. Spatial Statistical Depth** | Formula-level descriptive indicators; no inferential statistics | Spatial autocorrelation, regression diagnostics, geostatistics, point pattern analysis | 🔴 Critical |
| **2. Data Ecosystem** | 5 connectors (OSM, Census, Places, Nominatim, GTFS) | Earth observation (Sentinel, Landsat), open data portals (SODA, Eurostat, World Bank), COG/STAC, IoT streams | 🔴 Critical |
| **3. Geospatial AI** | Empty scaffolding | Computer vision (land cover, object detection), NLP (query-to-SQL, report generation), predictive modelling | 🔴 Critical |
| **4. 3D & Digital Twin** | VoxCity skeleton only | CityJSON/3D Tiles/IFC ingestion, sunlight simulation, viewshed, walkthrough, thematic styling | 🟡 High |
| **5. Scenario Planning** | 5 placeholder flows; no simulation engine | What-if simulation (CA, ABM, system dynamics), facility optimisation, trade-off analysis | 🟡 High |
| **6. Visualisation & Reporting** | Basic charts; PDF export only | Dashboard builder, 12+ chart types, academic report templates, auto-narrative, citation management | 🟡 High |
| **7. Performance & Scale** | WebGPU partial; no WASM; no Arrow | WASM spatial indexing, Arrow/Parquet I/O, Web Worker pool, progressive loading, offline support | 🟢 Medium |

---

## 3. Axis 1 — Spatial Statistical Depth <a name="3-axis-1-spatial-statistical-depth"></a>

### 3.1 Rationale

The current 27 calculators produce descriptive metrics (ratios, indices, scores). For research-grade analysis, users require **inferential spatial statistics** — the ability to test hypotheses about spatial patterns, model spatially varying relationships, and quantify uncertainty. No Q1 urban analytics publication omits spatial autocorrelation testing (Anselin, 1995) or spatial regression diagnostics (LeSage & Pace, 2009).

### 3.2 Spatial Autocorrelation Module

```
src/engine/spatial-stats/autocorrelation/
├── SpatialWeights.ts        ─ Weight matrix construction
│   ├── queenContiguity()       — Shared edge OR vertex adjacency
│   ├── rookContiguity()        — Shared edge only
│   ├── kNearestNeighbors()     — k-NN distance-based (default k=5)
│   ├── distanceBand()          — Binary weights within threshold d
│   ├── inverseDistance()       — w_ij = d_ij^{-α}, α ∈ {1, 2}
│   └── rowStandardize()       — W → row-stochastic form
│
├── GlobalMoransI.ts         ─ Global spatial autocorrelation
│   ├── moransI(x, W)          — I = (n / S₀) × (x'Wx / x'x)
│   ├── expectedI()            — E[I] = -1/(n-1)
│   ├── varianceI()            — Under randomisation & normality assumptions
│   ├── zScore()               — z = (I - E[I]) / √Var[I]
│   └── pseudoPValue()         — Conditional permutation inference (999 permutations)
│   Reference: Moran (1950); Cliff & Ord (1973)
│
├── LocalMoransI.ts          ─ LISA (Local Indicators of Spatial Association)
│   ├── localI(x, W)           — Iᵢ = zᵢ × Σⱼ wᵢⱼzⱼ
│   ├── classify()             — HH, HL, LH, LL quadrant assignment
│   ├── significanceFilter()   — Bonferroni / FDR correction for multiple testing
│   └── clusterMap()           — GeoJSON FeatureCollection with p-value and cluster type
│   Reference: Anselin (1995) Local Indicators of Spatial Association.
│              Geographical Analysis 27(2), 93–115
│
└── GetisOrdGi.ts            ─ Hot-spot analysis
    ├── giStar(x, W)           — G*ᵢ = (Σⱼ wᵢⱼxⱼ - X̄Σⱼwᵢⱼ) /
    │                                   (S × √((nΣⱼw²ᵢⱼ - (Σⱼwᵢⱼ)²) / (n-1)))
    ├── zScoreMap()             — z-score per observation
    └── confidenceMap()         — 90%, 95%, 99% confidence classification
    Reference: Getis & Ord (1992) Geographical Analysis 24(3), 189–206
```

### 3.3 Spatial Regression Module

```
src/engine/spatial-stats/regression/
├── OLS.ts                   ─ Baseline with full diagnostics
│   ├── fit(y, X)               — β̂ = (X'X)⁻¹X'y
│   ├── diagnostics()           — R², adjusted R², AIC, BIC, log-likelihood
│   ├── residualTests()         — Jarque-Bera normality, Breusch-Pagan heteroskedasticity
│   ├── spatialDiagnostics()    — Moran's I on residuals, LM-lag, LM-error, robust LM tests
│   └── vif()                   — Variance Inflation Factor for multicollinearity
│   Decision rule: If LM-lag significant → spatial lag model;
│                  if LM-error → spatial error model
│   Reference: Anselin (1988) Spatial Econometrics: Methods and Models
│
├── SpatialLagModel.ts       ─ Spatial autoregressive model (SAR)
│   ├── fit(y, X, W)            — y = ρWy + Xβ + ε
│   ├── mlEstimation()          — Maximum likelihood via concentrated log-likelihood
│   └── impacts()               — Direct, indirect, and total spatial effects
│   Reference: Anselin (1988); LeSage & Pace (2009)
│
├── SpatialErrorModel.ts     ─ Spatial error model (SEM)
│   ├── fit(y, X, W)            — y = Xβ + u; u = λWu + ε
│   └── mlEstimation()          — ML estimation via Ord's eigenvalue decomposition
│   Reference: Anselin (1988)
│
├── GWR.ts                   ─ Geographically Weighted Regression
│   ├── fit(y, X, coords)       — Local β̂ᵢ = (X'WᵢX)⁻¹X'Wᵢy
│   ├── bandwidthSelection()    — Golden-section search minimising AICc
│   ├── kernelFunction()        — Gaussian, bisquare, exponential
│   ├── localR2()               — R² per observation
│   └── parameterSurfaces()     — Maps of local coefficient estimates
│   Reference: Fotheringham, Brunsdon & Charlton (2002) Geographically
│              Weighted Regression. Wiley
│
└── MGWR.ts                  ─ Multiscale Geographically Weighted Regression
    ├── fit(y, X, coords)       — Variable-specific bandwidth optimisation
    ├── backfitting()           — Iterative bandwidth refinement per covariate
    └── scaleSurfaces()         — Bandwidth maps revealing spatial scale of each process
    Reference: Fotheringham, Yang & Kang (2017) Annals of AAG 107(6), 1247–1265
```

### 3.4 Geostatistics Module

```
src/engine/spatial-stats/geostatistics/
├── Variogram.ts             ─ Experimental and theoretical semivariograms
│   ├── experimental()          — Binned semivariance: γ̂(h) = (1/2|N(h)|) × Σ(z(sᵢ)-z(sⱼ))²
│   ├── fitModel()              — Spherical, exponential, Gaussian, Matérn model fitting
│   ├── parameters()            — Nugget (c₀), sill (c₀+c₁), range (a)
│   └── crossValidation()       — Leave-one-out prediction error assessment
│   Reference: Cressie (1993) Statistics for Spatial Data
│
├── OrdinaryKriging.ts       ─ Best Linear Unbiased Prediction (BLUP)
│   ├── predict(locations)      — ẑ(s₀) = Σᵢ λᵢz(sᵢ) subject to Σλᵢ = 1
│   ├── krigingVariance()       — Prediction uncertainty at each location
│   └── predictionSurface()     — Interpolated raster with uncertainty bands
│   Reference: Cressie (1993); Goovaerts (1997) Geostatistics for
│              Natural Resources Evaluation
│
├── UniversalKriging.ts      ─ Kriging with trend surface
│   ├── predict(locations, trend) — Trend removal → ordinary kriging on residuals
│   └── trendOrder()             — Linear, quadratic trend functions
│
└── IDW.ts                   ─ Inverse Distance Weighting (deterministic baseline)
    ├── interpolate()            — ẑ(s₀) = Σ(wᵢzᵢ) / Σwᵢ; wᵢ = dᵢ⁻ᵖ
    └── powerParameter()         — Default p=2; cross-validation optimisation available
```

### 3.5 Multivariate Analysis Module

```
src/engine/spatial-stats/multivariate/
├── PCA.ts                   ─ Principal Component Analysis
│   ├── fit(X)                   — Eigendecomposition of correlation matrix
│   ├── scree()                  — Eigenvalue plot for component selection
│   ├── loadings()               — Variable-component correlations
│   ├── scores()                 — Observation projections onto component space
│   └── kaiserCriterion()        — Retain components with eigenvalue > 1
│   Reference: Jolliffe (2002) Principal Component Analysis. Springer
│
├── ClusterAnalysis.ts       ─ Spatial and aspatial clustering
│   ├── kMeans(X, k)             — Lloyd's algorithm with kmeans++ initialisation
│   ├── hierarchical(X, method)  — Ward's, complete, average, single linkage
│   ├── silhouette()             — s(i) = (b(i) - a(i)) / max(a(i), b(i))
│   ├── elbowMethod()            — Within-cluster sum of squares vs. k
│   └── classifyMap()            — Cluster membership as GeoJSON output
│   Reference: Kaufman & Rousseeuw (1990) Finding Groups in Data. Wiley
│
├── CompositeIndexBuilder.ts ─ Full composite indicator construction pipeline
│   ├── normalise()              — Min-Max, Z-score, Rank, Percentile, Distance-to-reference
│   ├── weight()                 — Equal, Expert, PCA-derived, AHP, Budget Allocation, DEA
│   ├── aggregate()              — Additive, geometric, Copeland rank aggregation
│   ├── sensitivity()            — Monte Carlo weight perturbation + Sobol' indices
│   └── uncertaintyBands()       — 5th–95th percentile confidence intervals per area
│   Reference: OECD/JRC (2008) Handbook on Constructing Composite Indicators
│
└── SpatialClustering.ts     ─ Spatially constrained clustering
    ├── SKATER(X, W, k)          — Minimum spanning tree partitioning
    ├── MaxP(X, W, threshold)    — Maximum-p regions (population/area constraint)
    └── REDCAP(X, W, k)          — Spatially constrained agglomerative clustering
    Reference: Assunção et al. (2006); Duque et al. (2012)
```

### 3.6 Point Pattern Analysis Module

```
src/engine/spatial-stats/point-pattern/
├── RipleysK.ts              ─ Second-order analysis
│   ├── kFunction(points, d)     — K̂(d) = |A|/n² × Σᵢ Σⱼ I(dᵢⱼ ≤ d) with Ripley edge
│   │                              correction
│   ├── lFunction()              — L(d) = √(K(d)/π) − d (centred form)
│   ├── envelope()               — Monte Carlo CSR simulation envelopes (99 simulations)
│   └── interpretation()         — L(d) > 0 → clustering; L(d) < 0 → dispersion
│   Reference: Ripley (1976) JRSS-B 39(2); Diggle (2003) Statistical Analysis of
│              Spatial Point Patterns
│
├── ClarkEvans.ts            ─ Nearest-neighbour analysis
│   ├── rStatistic(points)       — R = d̄_obs / d̄_exp; d̄_exp = 0.5 / √(n/A)
│   ├── zTest()                  — z = (d̄_obs − d̄_exp) / SE
│   └── classification()         — R < 1 clustered; R = 1 random; R > 1 dispersed
│   Reference: Clark & Evans (1954) Ecology 35(4), 445–453
│
├── QuadratAnalysis.ts       ─ First-order analysis
│   ├── quadratCounts(points, rows, cols) — Cell frequency counts
│   ├── chiSquared()             — χ² test vs. Poisson expectation
│   └── varianceMeanRatio()      — VMR = σ²/μ; >1 clustered, =1 random, <1 regular
│
└── AdaptiveKDE.ts           ─ Kernel density with variable bandwidth
    ├── estimate(points)         — Abramson square-root adaptive bandwidth
    ├── bandwidthSelection()     — Silverman's rule-of-thumb; LSCV
    └── densitySurface()         — Raster output normalised to sum to 1
    Reference: Silverman (1986) Density Estimation for Statistics and Data Analysis
```

### 3.7 Spatiotemporal Analysis Module

```
src/engine/spatial-stats/spatiotemporal/
├── EmergingHotSpots.ts      ─ Space-time pattern mining
│   ├── analyse(x, W, timeSteps) — Mann-Kendall trend per location + Gi* per time step
│   ├── classify()               — 8 categories: new, consecutive, intensifying, persistent,
│   │                               diminishing, sporadic, oscillating, historical
│   └── trendMap()               — GeoJSON with trend category and p-value
│   Reference: Mann (1945); Kendall (1975)
│
├── SpatialMarkov.ts         ─ Spatially conditioned Markov chains
│   ├── transitionMatrix(y, W, k)  — k×k×k conditional transition probabilities
│   ├── spatialDependenceTest()    — χ² test for spatial conditioning effect
│   └── projections(steps)         — Multi-step probability forecasting
│   Reference: Rey (2001) Spatial empirics for economic growth and convergence.
│              Geographical Analysis 33(3), 195–214
│
├── SpaceTimeKDE.ts          ─ 3D (x, y, t) density estimation
│   ├── estimate(events, bw_s, bw_t) — Product kernel: K(s,t) = Ks(s) × Kt(t)
│   └── animatedSurface()             — Time-sliced density rasters for animation
│   Reference: Nakaya & Yano (2010) IJGIS 24(5)
│
└── ChangeDetection.ts       ─ Land cover change analysis
    ├── postClassification(t1, t2)   — Cross-tabulation → transition matrix
    ├── imageDifferencing(t1, t2)    — ΔX = X_t2 − X_t1 with threshold
    ├── CVA(bands_t1, bands_t2)      — Change Vector Analysis: magnitude + direction
    └── accuracyAssessment()         — Kappa, overall accuracy, user's/producer's accuracy
    Reference: Lu et al. (2004) IJRS 25(12), 2365–2401
```

---

## 4. Axis 2 — Data Ecosystem Expansion <a name="4-axis-2-data-ecosystem-expansion"></a>

### 4.1 Earth Observation Connectors

| Connector | Source | Data Products | Protocol | Priority |
|-----------|--------|--------------|----------|----------|
| `SentinelHubConnector` | Copernicus / ESA | Sentinel-2 MSI (10 m), Sentinel-1 SAR, Sentinel-5P atmospheric | OGC WMS/WMTS + Process API | 🔴 Critical |
| `PlanetaryComputerConnector` | Microsoft | Landsat Collection 2, NAIP (60 cm), Copernicus DEM (30 m), ERA5 climate | STAC API + SAS token auth | 🔴 Critical |
| `STACClient` | Any STAC server | Spatiotemporal asset discovery and access | STAC 1.0 specification | 🔴 Critical |
| `COGReader` | Cloud Optimized GeoTIFF | Tile-level HTTP range reads; no full download required | HTTP Range requests | 🔴 Critical |
| `GoogleEarthEngineConnector` | GEE | Pre-processed imagery composites, computed products | Earth Engine REST API | 🟡 High |

### 4.2 Statistical & Open Data Connectors

| Connector | Source | Coverage | Protocol |
|-----------|--------|----------|----------|
| `WorldBankConnector` | World Bank Open Data | 217 countries; 16,000+ indicators (GDP, Gini, urbanisation rate) | REST JSON |
| `EurostatConnector` | EU Statistical Office | EU-27 + candidate countries; NUTS-level regional statistics | SDMX 2.1 |
| `SODAConnector` | Socrata (US city portals) | 300+ US cities' open data (crime, permits, 311, transport) | SODA 2.1 |
| `OpenDataSoftConnector` | ODS Platform | EU/global city open data portals | REST/OData |
| `OpenWeatherConnector` | OpenWeatherMap | Current conditions + 5-day forecast + air quality | REST JSON |
| `WFSConnector` | OGC Web Feature Service | Enterprise institutional spatial data | WFS 2.0 |
| `GBIFConnector` | Global Biodiversity Information Facility | Biodiversity occurrence records (2B+ records) | REST JSON |

### 4.3 Data Management Layer

```
src/services/data/
├── DataCatalog.ts              ─ Unified catalogue across all connectors
│   ├── search(query, bbox, temporal)  — Faceted discovery (keyword, spatial, date range)
│   ├── register(source)               — Connector registration with health check
│   └── metadata()                     — ISO 19115/DCAT-AP compliant metadata records
│
├── DataProfiler.ts             ─ Automated exploratory data analysis
│   ├── profile(dataset)               — Completeness, uniqueness, distribution, outliers
│   ├── spatialProfile()               — Extent, CRS, geometry types, topology validity
│   └── qualityReport()                — DQ_Element ISO 19157 conformance levels
│
├── DataLineage.ts              ─ Provenance tracking
│   ├── record(operation, inputs, output) — Immutable lineage graph
│   ├── visualise()                       — DAG rendering of transformation history
│   └── reproduce()                       — Re-execute pipeline from recorded lineage
│
├── SchemaInference.ts          ─ Automatic typing
│   ├── infer(geojson)                   — Property type detection (numeric, categorical,
│   │                                       temporal, geometry)
│   ├── suggestJoins()                   — Candidate join keys across loaded datasets
│   └── detectAnomalies()                — Spatial outliers, null clusters, data breaks
│
└── CacheManager.ts             ─ Intelligent spatial caching
    ├── tileCache()                      — Spatial-indexed tile cache (R-tree lookup)
    ├── queryCache()                     — LRU cache with TTL for API responses
    └── offlineStore()                   — IndexedDB persistence for offline operation
```

### 4.4 Geospatial ETL Pipeline

```
src/services/data/pipeline/
├── TransformPipeline.ts       ─ Declarative step-based ETL chains
│   ├── addStep(transform)       — Append transform operation
│   ├── execute()                — Run pipeline with progress callbacks
│   ├── validate()               — Pre-flight type/CRS compatibility checks
│   └── serialise()              — Export pipeline definition as reproducible JSON
│
├── transforms/
│   ├── Reproject.ts             — CRS transformation (EPSG via proj4js; 6,000+ CRS)
│   ├── SpatialJoin.ts           — Point-in-polygon, nearest neighbour, distance-within
│   ├── Buffer.ts                — Geodesic/planar buffer generation
│   ├── Clip.ts                  — Spatial intersection clipping
│   ├── Dissolve.ts              — Feature aggregation by attribute
│   ├── ArealInterpolation.ts    — Dasymetric mapping (areal weighting, binary mask,
│   │                               intelligent dasymetric method)
│   ├── ZonalStatistics.ts       — Raster-to-vector summary (mean, sum, std, min, max)
│   ├── Geocode.ts               — Batch address resolution (Nominatim/Google)
│   ├── Normalise.ts             — Population/area normalisation for rate calculation
│   └── Reclassify.ts            — Value remapping (continuous → categorical)
│
└── PipelineEditor.tsx          ─ Visual drag-and-drop pipeline designer
    — Node-based graph UI for composing transform chains
    — Real-time data preview at each pipeline node
    — Export to reproducible JSON or Python script
```

---

## 5. Axis 3 — Geospatial Artificial Intelligence (GeoAI) <a name="5-axis-3-geospatial-ai"></a>

### 5.1 Rationale

The GeoAI module (`src/engine/geoai/`) currently contains only empty directory scaffolding. This represents the most critical capability gap for a platform aspiring to Q1-grade research support. Modern urban analytics increasingly relies on deep learning for land cover classification (Zhu et al., 2017), object detection from VHR imagery (Ma et al., 2019), and predictive urban modelling (Batty, 2013).

### 5.2 Computer Vision Module

```
src/engine/geoai/cv/
├── LandCoverClassifier.ts     ─ Pixel/patch-level classification
│   ├── models: U-Net, DeepLabV3+, SegFormer (ONNX format)
│   ├── classes: Built-up, Vegetation, Water, Bare soil, Road, Agriculture
│   ├── inference: ONNX Runtime Web (WebAssembly backend)
│   ├── accuracy: Confusion matrix, Kappa, F1 per class, IoU
│   └── postProcess: CRF refinement, connected component filtering
│   Reference: Ronneberger et al. (2015); Zhu et al. (2017) ISPRS JPRS 128
│
├── BuildingFootprintExtractor.ts ─ Instance segmentation
│   ├── models: Segment Anything Model (SAM) nano variant
│   ├── workflow: Automatic prompt generation → segment → vectorise
│   ├── output: GeoJSON polygon per building with confidence score
│   └── postProcess: Douglas-Peucker simplification; minimum area threshold
│   Reference: Kirillov et al. (2023) ICCV — Segment Anything
│
├── ObjectDetector.ts          ─ Multi-class urban object detection
│   ├── models: YOLOv8-nano (ONNX, ~6.5 MB)
│   ├── targetClasses: Vehicle, Tree, Swimming pool, Solar panel, Construction site
│   ├── inference: Tile-based (256×256) with NMS merge across tiles
│   └── output: Point centroid per detection with class and confidence score
│
├── StreetViewAnalyser.ts      ─ Street-level image assessment
│   ├── greeneryScore()          — Green pixel ratio using HSV segmentation
│   ├── enclosureScore()         — Sky view factor from panoramic imagery
│   ├── walkabilitySignals()     — Sidewalk presence, crossing count, street furniture
│   └── facadeQuality()          — Building condition classification (good/fair/poor)
│   Reference: Li et al. (2015) Landscape & Urban Planning 144
│
└── ChangeDetector.ts          ─ Bi-temporal urban change detection
    ├── models: Siamese encoder with attention fusion
    ├── input: T₁ and T₂ image patches (aligned, co-registered)
    ├── output: Binary change mask + change probability surface
    └── categories: New construction, Demolition, Vegetation loss, Water body change
    Reference: Daudt et al. (2018) IEEE ICIP
```

### 5.3 Natural Language Processing Module

```
src/engine/geoai/nlp/
├── QueryToSQL.ts              ─ Natural language → spatial SQL translation
│   ├── parse(query)             — "Show areas with walkability above 80 near transit"
│   │                              → SELECT * FROM zones WHERE walk_score > 80
│   │                                AND ST_DWithin(geom, transit_stops.geom, 400)
│   ├── intentClassification()   — Filter, aggregate, join, buffer, spatial query
│   ├── entityExtraction()       — Metric names, thresholds, distances, spatial relations
│   └── safeguards()             — Query sandboxing; read-only enforcement; DuckDB dialect
│   Reference: Katsogiannis-Meimarakis & Koutrika (2023) VLDB Journal
│
├── ReportNarrativeGenerator.ts ─ Automated analytical writing
│   ├── generateSection(data, template) — Statistical summary → academic prose
│   ├── templates: Finding, Comparison, Trend, Recommendation, Methodological note
│   ├── citations: Auto-insert inline references from calculator methodology metadata
│   └── toneControl: academic, policy_brief, executive_summary, public_communication
│
├── PlaceNameResolver.ts       ─ Geoparsing and toponym resolution
│   ├── extractPlaces(text)      — Named entity recognition for geographic entities
│   ├── disambiguate()           — Context-aware toponym resolution
│   └── link()                   — Entity → GeoNames/OSM node linkage
│
└── CitizenTextAnalyser.ts     ─ Public participation text mining
    ├── categorise(comments)     — Topic modelling (LDA/BERTopic on citizen feedback)
    ├── sentiment()              — Sentiment polarity per comment
    ├── spatialAssign()          — Geolocate comments to parcels/blocks
    └── prioritise()             — Urgency × frequency ranking matrix
```

### 5.4 Predictive Urban Models

```
src/engine/geoai/models/
├── UrbanGrowthPredictor.ts    ─ Cellular automata–Markov hybrid
│   ├── calibrate(t1, t2)       — Transition probability + suitability surface
│   ├── simulate(steps)          — CA iteration with stochastic perturbation
│   └── validate(reference)      — Kappa, figure of merit (Pontius et al., 2008)
│
├── PropertyValueEstimator.ts  ─ Hedonic + ML spatial price model
│   ├── features: Structural (m², rooms, age), Locational (CBD, transit, parks),
│   │   Neighbourhood (income, crime, school quality)
│   ├── models: OLS hedonic baseline → Random Forest → Spatial GWR
│   └── explain: SHAP feature importance values
│   Reference: Rosen (1974) JPE; Bourassa et al. (2010) JREFE
│
├── GentrificationRiskModel.ts ─ Early warning system
│   ├── indicators: Rent change, new permits, demographic shift, transit investment
│   ├── model: Logistic regression with spatial lag term
│   ├── output: Probability surface (0–1) with 3-year horizon
│   └── thresholds: Low (<0.3), Moderate (0.3–0.6), High (>0.6), Very high (>0.8)
│   Reference: Chapple & Zuk (2016); Reades et al. (2019) EPB: Urban Analytics
│
├── FloodRiskModeller.ts       ─ DEM-based inundation
│   ├── input: DEM raster, rainfall scenarios, land cover permeability
│   ├── method: Fill-and-spill hydrological routing
│   ├── output: Inundation depth raster + affected population count
│   └── scenarios: 10-year, 50-year, 100-year return period
│
└── AirQualityPredictor.ts     ─ Land use regression (LUR) model
    ├── features: Traffic volume, distance to road, NDVI, building density, wind
    ├── model: LUR baseline → Gradient Boosting spatial model
    ├── output: PM₂.₅ / NO₂ concentration surface
    └── validate: LOOCV R² and RMSE
    Reference: Hoek et al. (2008) Atmospheric Environment 42(33)
```

### 5.5 GeoAI Runtime Infrastructure

```
src/engine/geoai/runtime/
├── ONNXRuntimeManager.ts      ─ Model lifecycle management
│   ├── loadModel(url, options)    — Fetch ONNX model → InferenceSession
│   ├── runInference(input)        — Execute with progress callback
│   ├── warmup()                   — Pre-load frequently used models
│   └── memoryManagement()         — LRU eviction, max 500 MB GPU allocation
│
├── ModelRegistry.ts            ─ Model catalogue
│   ├── builtIn: Land cover U-Net (23 MB), YOLO-nano (6.5 MB), SAM-nano (38 MB)
│   └── custom: User-uploaded ONNX models via drag-and-drop
│
├── SpatialFeatureEngineering.ts ─ Automated feature generation
│   ├── bufferDistances()          — Distance to nearest road, transit, park, school
│   ├── densityFeatures()          — Population, building, POI density within radius
│   ├── neighbourhoodStats()       — Spatial lag, local mean, local variance
│   └── morphometrics()            — FAR, GSI, OSR, connectivity from geometry alone
│
├── SpatialCrossValidation.ts  ─ Autocorrelation-aware validation
│   ├── spatialKFold(data, k)          — Block-based spatial partitioning
│   ├── bufferKFold(data, k, buffer)   — With exclusion buffer between folds
│   └── leaveOneGroupOut(data, groups) — Spatial unit leave-out
│   Reference: Roberts et al. (2017) Ecography 40(8), 913–929
│
└── ModelExplainer.ts           ─ Interpretability
    ├── shap(model, X)                 — SHAP values per prediction
    ├── permutationImportance()        — Feature shuffling importance
    └── partialDependence()            — PDP and ICE curves
    Reference: Lundberg & Lee (2017) NeurIPS
```

---

## 6. Axis 4 — 3D Urban Modelling & Digital Twin <a name="6-axis-4-3d-urban-modelling"></a>

### 6.1 VoxCity Full Implementation

```
src/features/urbanAnalytics/voxcity/
├── CityScene.tsx              ─ three.js scene orchestrator
│   ├── sceneGraph: Terrain + Buildings + Vegetation + Infrastructure layers
│   ├── lighting: Directional (sun), ambient, hemisphere
│   ├── camera: Orbital (overview) + first-person (walkthrough)
│   └── postProcessing: SSAO, anti-aliasing, tone mapping
│
├── BuildingExtruder.ts        ─ 2.5D building generation
│   ├── extrudeFromGeoJSON(fc, heightField) — Polygon → 3D mesh
│   ├── LOD: Level 0 (box), Level 1 (roof shape), Level 2 (facade detail)
│   └── instancing: GPU-instanced rendering for 100K+ buildings
│
├── CityJSONLoader.ts          ─ CityJSON v2.0 ingestion
│   ├── parse(json)              — CityObjects → three.js BufferGeometry
│   ├── semanticSurfaces()       — Roof, wall, ground surface classification
│   └── lodSwitch()              — Dynamic LOD based on camera distance
│   Reference: Ledoux et al. (2019) Open Geospatial Data, Software and Standards
│
├── Tiles3DLoader.ts           ─ 3D Tiles 1.1 streaming
│   ├── tilesetUrl(url)         — Hierarchical tile loading (root → children)
│   ├── geometricError()        — LOD refinement based on screen-space error
│   └── batchTable()            — Attribute query per tile feature
│
├── IFCViewer.ts               ─ BIM model integration
│   ├── loadIFC(buffer)          — IFC 2x3/4 parsing via web-ifc
│   ├── spatialTree()            — IfcProject → IfcSite → IfcBuilding hierarchy
│   └── propertyQuery()          — Material, area, volume extraction per element
│
├── SunlightSimulator.ts       ─ Solar access analysis
│   ├── simulate(date, lat, lon, interval) — Sun position every N minutes
│   ├── shadowMap()              — Accumulated shadow duration per ground pixel
│   ├── solarExposure()          — kWh/m²/year facade irradiance
│   └── daylightHours()          — Hours of direct sunlight per location
│   Reference: Freitas et al. (2015) Renewable Energy 77
│
├── ViewshedAnalyser.ts        ─ 3D visibility analysis
│   ├── compute(observerPoint, radius, height) — Ray-casting against 3D mesh
│   ├── visibleArea()            — Percentage of visible ground area
│   └── viewCorridor()           — Protected sight lines (landmark preservation)
│
├── ThematicStyling.ts         ─ Attribute-driven 3D colourisation
│   ├── apply(buildings, attribute, scheme) — Any indicator → building colour
│   ├── presets: Energy class, construction year, rent/m², floor count, risk score
│   └── legend3D()               — In-scene floating legend
│
└── WalkThrough.ts             ─ First-person navigation
    ├── enable()                 — WASD + mouse-look movement
    ├── humanScale()             — Eye-height 1.7 m, collision detection
    └── captureRoute()           — Record path → export as video or GIF
```

### 6.2 Digital Twin Framework

```
src/engine/digital-twin/
├── TwinRegistry.ts            ─ Asset catalogue (building, infrastructure, green space)
├── SensorBinding.ts           ─ IoT data → 3D object live binding
├── RealTimeUpdater.ts         ─ WebSocket → visual update pipeline
├── ScenarioOverlay.ts         ─ Design alternative projection onto existing city
├── TemporalNavigation.ts      ─ Past ↔ present ↔ future time-scrubbing
└── TwinDashboard.tsx          ─ Aggregated KPI panel for twin state
```

---

## 7. Axis 5 — Scenario Planning & Simulation <a name="7-axis-5-scenario-planning"></a>

### 7.1 Five Incomplete Workflow Implementations

#### 7.1.1 Composite Indicator Builder Flow (7 Steps)

| Step | Operation | Method |
|------|-----------|--------|
| 1 | Indicator Selection | Select from 27+ calculators or upload custom data |
| 2 | Data Imputation | Mean, median, regression, k-NN, multiple imputation |
| 3 | Normalisation | Min-Max, Z-score, Rank, Percentile, Distance-to-reference |
| 4 | Weighting | Equal, Expert panel, PCA-derived, AHP pairwise, Budget Allocation, DEA |
| 5 | Aggregation | Additive (linear), Geometric (penalises imbalance), Copeland rank |
| 6 | Sensitivity & Uncertainty | Monte Carlo perturbation (10,000 runs); Sobol' first-order and total-order indices; 5th–95th percentile confidence bands |
| 7 | Result | Composite index map + rank table + robustness report |

**Reference**: OECD/JRC (2008) *Handbook on Constructing Composite Indicators*

#### 7.1.2 Scenario Comparison Flow (6 Steps)

| Step | Operation |
|------|-----------|
| 1 | Baseline Definition — Current-state indicator profile |
| 2 | Alternative Scenarios — Define 2–4 intervention packages (e.g., transit expansion, densification, green infrastructure) |
| 3 | Parameter Adjustment — Population growth rate, density targets, transit investment, green space |
| 4 | Indicator Recalculation — Re-run selected calculators under each scenario |
| 5 | Delta Analysis — Absolute and percentage change maps; radar charts; parallel coordinate comparison |
| 6 | Trade-Off Matrix — Environmental / Social / Economic impact scoring; Pareto front identification |

#### 7.1.3 Equity Audit Flow (7 Steps)

| Step | Operation | Method |
|------|-----------|--------|
| 1 | Service Selection | Education, healthcare, parks, transit, food retail, cultural facilities |
| 2 | Population Disaggregation | Income quintile, race/ethnicity, age group, disability status |
| 3 | Access Calculation | Group-specific isochrone or gravity-based accessibility scores |
| 4 | Inequality Measurement | Gini on accessibility; Theil-L decomposition; Atkinson index (ε = 0.5, 1.0, 2.0); Palma ratio (top 10% / bottom 40%) |
| 5 | Spatial Disaggregation | Neighbourhood-level inequality maps; LISA on access gaps |
| 6 | Facility Siting Optimisation | "If we add *n* new facilities, where?" → P-median / MCLP with equity constraint |
| 7 | Impact Assessment | Re-compute inequality metrics post-intervention; before/after comparison |

**Reference**: Talen (1998) *Urban Studies* 35(3); Neutens et al. (2010) *Applied Geography* 30(4)

#### 7.1.4 Change Detection Flow (6 Steps)

| Step | Operation |
|------|-----------|
| 1 | Temporal Data Selection — T₁ and T₂ datasets (satellite imagery, statistics, or vector maps) |
| 2 | Method Selection — Post-classification, image differencing, CVA, object-based change |
| 3 | Threshold Determination — Automatic (Otsu), adaptive, or user-defined |
| 4 | Change Classification — Gain, Loss, Swap, Net change per category |
| 5 | Transition Matrix — n×n cross-tabulation; row-normalised transition probabilities |
| 6 | Trend Analysis — Mann-Kendall test + Sen's slope estimator (multi-temporal data) |

#### 7.1.5 Analytical Run Review Flow

- Catalogue of all completed analysis runs (timestamp, user, parameters, duration)
- Side-by-side comparison of two runs with identical flow type
- Parameter diff highlighting
- Result overlay on shared map
- One-click re-run with modified parameters
- Export to reproducible notebook (Jupyter / Observable)

### 7.2 Simulation Engine

```
src/engine/simulation/
├── CellularAutomata.ts        ─ Grid-based urban growth simulation
│   ├── calibrate(t1, t2, suitability, constraints)
│   │     — Logistic regression for transition rules
│   ├── simulate(steps, stochFactor) — CA iteration with random perturbation
│   ├── constraints: Protected areas, water, slope > 15°, existing urban
│   ├── suitability: Distance to roads, transit, CBD, slope, soil, zoning
│   └── validate: Figure of merit, Kappa, allocation/quantity disagreement
│   Reference: Clarke et al. (1997) — SLEUTH model lineage;
│              Pontius et al. (2008)
│
├── FacilityOptimisation.ts    ─ Location-allocation models
│   ├── pMedian(demand, candidates, p) — Minimise weighted distance to p facilities
│   ├── LSCP(demand, candidates, S)    — Set covering: all demand within S distance
│   ├── MCLP(demand, candidates, p, S) — Max coverage within S for p facilities
│   ├── equityConstraint()              — Maximin: maximise minimum access across groups
│   └── solver: Greedy heuristic + local search swap improvement
│   Reference: Church & ReVelle (1974); Daskin (1995) Network and Discrete Location
│
├── SystemDynamics.ts          ─ Stock-and-flow urban system models
│   ├── stocks: Population, Housing, Employment, Transport capacity, Green space
│   ├── flows: Birth/death, construction/demolition, job creation/loss, network expansion
│   ├── simulate(params, years)   — Euler integration over annual time steps
│   └── causalLoop()              — Feedback loop visualisation as directed graph
│   Reference: Forrester (1969) Urban Dynamics; Sterman (2000) Business Dynamics
│
├── AgentBasedModel.ts         ─ Micro-simulation
│   ├── agentTypes: Pedestrian, Household, Developer, Government
│   ├── behaviours: Route choice, residential location, investment decision
│   ├── environment: Street network + parcels + zoning + amenity layer
│   ├── simulate(agents, steps)   — Tick-based iteration with spatial interaction
│   └── emergentMetrics()         — Segregation index, sprawl measure, land price
│   Reference: Batty (2005) Cities and Complexity; Crooks et al. (2019)
│
└── ScenarioManager.ts         ─ Scenario orchestration
    ├── create(name, assumptions)   — Versioned assumption set
    ├── fork(baseScenario)          — Branch from existing scenario
    ├── compare(scenarios[])        — Multi-scenario delta computation
    └── timeline()                  — Temporal evolution visualisation
```

---

## 8. Axis 6 — Visualisation, Reporting & Decision Support <a name="8-axis-6-visualisation-reporting"></a>

### 8.1 Advanced Chart Library (14 New Types)

| Chart Type | Use Case | Implementation |
|------------|----------|----------------|
| Parallel Coordinates | Multi-dimensional neighbourhood profiling | D3.js brushable axes |
| Radar / Spider | Indicator comparison across areas | SVG with configurable axes |
| Sankey Diagram | Land use transitions, budget allocation flows | D3-sankey |
| Treemap | Hierarchical area distribution | D3-hierarchy |
| Violin Plot | Distribution comparison across groups | D3 + KDE |
| Beeswarm Plot | Dense scatter with jitter for overlapping values | Force-directed D3 |
| Small Multiples | Comparative spatial patterns (4–16 panels) | Grid layout + deck.gl |
| Cartogram | Value-proportional deformed geography | Dorling / non-contiguous |
| Dot Density Map | Within-polygon population distribution by category | Random point-in-polygon |
| Sparkline Grid | Matrix of temporal mini-charts per zone | SVG inline |
| Waffle Chart | Proportional part-to-whole composition | Gridded squares |
| Slope Chart | Before/after comparison between two time points | Paired dot-line |
| Lollipop Chart | Ranked indicator values across units | Horizontal dot-stem |
| Box-and-Whisker Map | Distribution per geographic unit overlaid on map | In-map statistical overlay |

### 8.2 Dashboard Builder

```
src/features/dashboard/
├── DashboardCanvas.tsx        ─ React-grid-layout drag-and-drop canvas
│   ├── addWidget(type, dataBinding)   — Place widget with default size
│   ├── resize(widgetId, dimensions)   — User-adjustable sizing
│   └── layouts: Responsive breakpoints (desktop, tablet, mobile)
│
├── WidgetLibrary.tsx          ─ Widget catalogue
│   ├── KPICard.tsx              — Single metric with trend arrow, sparkline, target line
│   ├── MapWidget.tsx            — Embedded deck.gl map with bound layer
│   ├── ChartWidget.tsx          — Any chart type from library above
│   ├── TableWidget.tsx          — Sortable/filterable data table
│   ├── TextWidget.tsx           — Rich-text annotation block
│   ├── ComparisonWidget.tsx     — Side-by-side radar or bar comparison
│   └── IndicatorWidget.tsx      — Live calculator output with parameter sliders
│
├── templates/
│   ├── CityProfileDashboard.json          — Comprehensive city snapshot (12 widgets)
│   ├── SDG11MonitoringDashboard.json      — All 7 SDG 11 indicators with targets
│   ├── RiskAssessmentDashboard.json       — Hazard, vulnerability, capacity, compound risk
│   ├── AccessibilityEquityDashboard.json  — Modal access + equity disaggregation
│   └── NeighbourhoodComparison.json       — Multi-neighbourhood indicator comparison
│
└── DashboardExporter.ts       ─ Output formats
    ├── toPDF()                  — High-fidelity paginated PDF
    ├── toPNG()                  — Rasterised image capture
    └── toEmbed()                — iframe-embeddable self-contained HTML
```

### 8.3 Academic Report Engine

```
src/services/reporting/
├── ReportEngine.ts            ─ Structured report generation
│   ├── build(template, data, options) — Assemble sections from analysis results
│   ├── insertFigure(chart, caption)   — Auto-numbered figures with cross-references
│   ├── insertTable(data, caption)     — Formatted tables with notes and sources
│   └── compile()                       — Final PDF or Markdown output
│
├── templates/
│   ├── TechnicalReport.ts      — Full research-style report
│   │   Sections: Abstract, Introduction, Study Area, Data & Methods,
│   │   Results, Discussion, Conclusions, References, Appendices
│   ├── PolicyBrief.ts          — 2-page executive format
│   │   Sections: Key Findings, Context, Evidence, Recommendations, Sources
│   ├── EnvironmentalImpactAssessment.ts — EIA-compliant structure
│   │   Sections: Screening, Scoping, Baseline, Impact Prediction, Mitigation
│   └── SDGProgressReport.ts    — Voluntary Local Review (VLR) format
│       Sections: SDG 11 status, trend, gap analysis, action items
│
├── AutoNarrative.ts           ─ AI-generated analytical writing
│   ├── describeFinding(result)
│   │   — "{indicator} in {area} is {value} ({band}), which is {comparison}
│   │      the {reference} of {threshold}."
│   ├── compareScenarios(s1, s2)
│   │   — "Scenario B improves transit accessibility by {Δ}% relative to
│   │      baseline, with the largest gains in {areas}."
│   ├── citeMethods()            — Auto-insert methodology references per calculator
│   └── tonePresets: academic, professional, public_communication, executive
│
└── CitationManager.ts         ─ Reference management
    ├── database: All calculator method references pre-loaded
    ├── format(style)            — APA 7th, Chicago, BibTeX, RIS
    ├── inlineCite(refId)        — Insert "(Author, Year)" at cursor position
    └── bibliography()           — Generate formatted reference list
```

---

## 9. Axis 7 — Performance, Scalability & Computation <a name="9-axis-7-performance-scalability"></a>

### 9.1 WebGPU Expansion

Current GPU compute covers NDVI, band math, hillshade, and KDE. Expanded operations:

| Operation | Expected Speedup vs. CPU | Primary Use Case |
|-----------|-------------------------|-----------------|
| Spatial Join (point-in-polygon) | 50–100× | Millions of points against polygon boundaries |
| Buffer Generation | 20–50× | Batch buffering for accessibility analysis |
| Raster Classification | 30–70× | Multi-class pixel assignment at scale |
| Viewshed Computation | 40–80× | Ray-casting from observer point in DEM |
| Kriging Interpolation | 20–40× | Matrix operations for BLUP estimation |
| Heat Diffusion Simulation | 100×+ | UHI temporal modelling |

### 9.2 WASM Performance Modules

```
src/engine/wasm/
├── SpatialIndexWASM.ts     ─ R-tree / k-d tree (Rust → WASM via wasm-bindgen)
│   — 10× faster spatial queries for 100K+ features
├── ProjectionWASM.ts       ─ PROJ-like CRS engine (C → WASM via Emscripten)
│   — Accurate transformations (datum shifts, grid corrections)
├── GeometryOpsWASM.ts      ─ GEOS geometry operations (C++ → WASM)
│   — Union, intersection, difference, simplify: 10–100× over turf.js
├── RasterOpsWASM.ts        ─ Raster algebra with COG direct access
│   — Streaming tile decode, band math, reclassification
└── NetworkWASM.ts          ─ Boost.Graph algorithms (C++ → WASM)
    — Batch shortest-path for 10K+ OD pairs
```

### 9.3 Data Format & I/O Optimisation

| Technology | Benefit | Implementation |
|-----------|---------|---------------|
| **Apache Arrow JS** | Columnar in-memory; zero-copy to workers | Replace JSON parsing for large tabular data |
| **GeoParquet** | 10–100× smaller than GeoJSON; columnar | Primary spatial data exchange format |
| **Cloud Optimized GeoTIFF** | Tile-level HTTP range reads | Satellite imagery from cloud storage |
| **PMTiles** | Serverless vector tiles from single file | Basemap and thematic layers |
| **Web Worker Pool** | Parallel CPU-intensive computation | Statistics, clustering, network analysis |
| **IndexedDB Caching** | Persistent local cache for offline use | Disconnected fieldwork, classroom demos |
| **Virtual Scrolling** | Render only visible rows | Data explorer, result tables |
| **Progressive Loading** | LOD-based feature simplification | Smooth interaction at city-scale |

---

## 10. Planning Education & Curriculum Integration <a name="10-planning-education-curriculum"></a>

### 10.1 Pedagogical Design Principles

SynapseCore is uniquely positioned as a **planning education platform** because it combines professional-grade analytical tools with a browser-native architecture requiring zero installation. The following features transform it from a research tool into a curriculum-ready learning environment.

#### 10.1.1 Guided Learning Paths

```
src/features/education/
├── LearningPathEngine.ts      ─ Structured curriculum delivery
│   ├── paths:
│   │   ├── "Foundations of Urban Analytics"          — 8 modules, 24 exercises
│   │   │   Modules: Data types & formats, Coordinate reference systems, Spatial
│   │   │   queries, Thematic mapping, Classification schemes, Descriptive spatial
│   │   │   statistics, Indicator calculation, Report writing
│   │   │
│   │   ├── "Spatial Statistics for Planners"         — 6 modules, 18 exercises
│   │   │   Modules: Spatial autocorrelation (Moran's I, LISA), Hot-spot analysis
│   │   │   (Gi*), Spatial regression (OLS → GWR), Point pattern analysis (Ripley's
│   │   │   K), Geostatistics (variogram, kriging), Multivariate methods (PCA,
│   │   │   clustering)
│   │   │
│   │   ├── "Accessibility & Equity Analysis"         — 5 modules, 15 exercises
│   │   │   Modules: Network analysis fundamentals, Isochrone generation, Gravity
│   │   │   models (Hansen), Equity metrics (Gini, Theil, Atkinson on access),
│   │   │   Facility siting optimisation (P-median, MCLP)
│   │   │
│   │   ├── "Environmental Assessment & Resilience"   — 5 modules, 15 exercises
│   │   │   Modules: Remote sensing indices (NDVI, UHI, NDBI), Green infrastructure
│   │   │   metrics, Vulnerability frameworks (IPCC AR6), Risk mapping (compound
│   │   │   risk), Climate adaptation scenarios
│   │   │
│   │   ├── "Urban Morphology & Form"                 — 4 modules, 12 exercises
│   │   │   Modules: Density metrics (FAR, GSI, OSR — Spacematrix framework),
│   │   │   Street connectivity (α, β, γ), Space syntax (integration, choice,
│   │   │   NACH, NAIN), Mixed-use analysis (Shannon entropy)
│   │   │
│   │   ├── "SDG 11 Monitoring & Reporting"           — 4 modules, 12 exercises
│   │   │   Modules: Indicator definitions (11.1.1–11.7.1), Data source mapping,
│   │   │   Calculation & visualisation, Dashboard creation, Voluntary Local Review
│   │   │
│   │   ├── "3D Urban Modelling"                      — 4 modules, 12 exercises
│   │   │   Modules: Building extrusion from GeoJSON, CityJSON & 3D Tiles,
│   │   │   Sunlight analysis, Viewshed & view corridors
│   │   │
│   │   └── "Scenario Planning & Decision Support"    — 5 modules, 15 exercises
│   │       Modules: Composite indicators (OECD Handbook), CA urban growth
│   │       simulation, Facility siting with equity, Equity audit, Scenario
│   │       comparison & trade-offs
│   │
│   ├── progressTracker()         — Per-student completion status
│   ├── prerequisiteEngine()      — Enforce module ordering
│   └── adaptiveDifficulty()      — Adjust exercise complexity based on performance
```

#### 10.1.2 Interactive Exercise Framework

```
├── ExerciseRunner.tsx          ─ Hands-on analytical exercises
│   ├── exerciseTypes:
│   │   ├── CalculatorExercise
│   │   │   "Calculate the Gini coefficient for these 12 census tracts.
│   │   │    Interpret the result in the context of income inequality."
│   │   │
│   │   ├── FlowExercise
│   │   │   "Run a site suitability analysis for a new school location using
│   │   │    AHP weighting. Justify your criteria weights with literature."
│   │   │
│   │   ├── InterpretationExercise
│   │   │   "This LISA map shows four HH clusters in the southeast. What urban
│   │   │    processes might produce this spatial pattern of high poverty?"
│   │   │
│   │   ├── ComparisonExercise
│   │   │   "Compare vulnerability indices under current conditions and the
│   │   │    2050 climate scenario. Which neighbourhoods experience the
│   │   │    largest increase? What drives the change?"
│   │   │
│   │   ├── CriticalThinkingExercise
│   │   │   "The Walk Score for this suburban area is 23. What methodological
│   │   │    limitations might affect this result? Consider the distance-decay
│   │   │    function and amenity category weighting."
│   │   │
│   │   └── DataEthicsExercise
│   │       "This gentrification risk model uses race as a predictor variable.
│   │        Discuss the ethical implications of including vs. excluding this
│   │        variable, citing relevant fairness literature."
│   │
│   ├── autoGrading()              — Input → expected output comparison (± tolerance)
│   ├── rubric()                   — Multi-criteria assessment (accuracy, interpretation,
│   │                                rigour, communication)
│   └── feedback()                 — Targeted hints without revealing answers
```

#### 10.1.3 Methodology Explainers

```
├── MethodologyExplainer.tsx    ─ Contextual learning pop-ups
│   ├── onHover(indicator)        — Concise definition + formula + classification bands
│   ├── deepDive()                — Full methodology page including:
│   │   ├── Mathematical formulation (LaTeX rendered via KaTeX)
│   │   ├── Assumptions and limitations
│   │   ├── Appropriate use cases and misuse warnings
│   │   ├── Relationship to other indicators
│   │   └── Key references (linked to bibliography)
│   ├── workedExample()           — Step-by-step calculation with sample data
│   └── interactiveDemo()         — Parameter slider exploration
│       Example: "Adjust the distance-decay parameter (β) in the Hansen
│                 gravity model and observe the accessibility surface change."
```

#### 10.1.4 Pre-Loaded Teaching Datasets

```
├── DatasetLibrary.ts           ─ Curated educational datasets
│   ├── "New York City"
│   │   ├── Census tracts (demographics, income, housing)
│   │   ├── Subway stations + GTFS schedule
│   │   ├── Building footprints + heights (PLUTO)
│   │   ├── Street network (OSM extract)
│   │   ├── 311 service complaints (geocoded)
│   │   └── Air quality monitoring stations
│   │
│   ├── "London"
│   │   ├── LSOA boundaries (IMD, demographics, ethnicity)
│   │   ├── TfL station locations + Oyster ridership
│   │   ├── Greenspace polygons (OS Open)
│   │   └── Historical land use maps (1850–2020)
│   │
│   ├── "Barcelona"
│   │   ├── Superblocks boundary + street network
│   │   ├── Noise monitoring data
│   │   ├── Building energy performance certificates
│   │   └── Urban morphology metrics per block (Cerda grid)
│   │
│   ├── "Istanbul"
│   │   ├── Mahalle boundaries (demographics, income)
│   │   ├── Transit network (metro, metrobus, ferry, BRT)
│   │   ├── Earthquake risk zones (AFAD)
│   │   ├── Urban transformation project areas
│   │   └── Historical peninsula heritage zones (UNESCO buffer)
│   │
│   ├── "Singapore"
│   │   ├── Planning area boundaries (URA Master Plan)
│   │   ├── HDB public housing locations + ages
│   │   ├── Park connector network
│   │   └── UHI measurement transects
│   │
│   └── "Melbourne"
│       ├── SA2 boundaries (ABS census)
│       ├── GTFS (tram, bus, train — PTV)
│       ├── Tree canopy coverage (LiDAR-derived, 2018)
│       └── 20-minute neighbourhood indicator suite
```

### 10.2 Curriculum Mapping: Master of Urban Planning (MUP)

| Course | Relevant Platform Modules | Exercises |
|--------|--------------------------|-----------|
| **Introduction to GIS** | Map system, layer management, CRS, spatial queries, thematic mapping, classification | Data loading, choropleth creation, geocoding, spatial filter |
| **Urban Form & Design** | FAR, GSI, OSR, MXI, street connectivity, space syntax, 3D extrusion | Spacematrix analysis, connectivity audit, 3D walk-through |
| **Transportation Planning** | Network engine (Dijkstra, isochrone), accessibility calculators, GTFS, mode split | Walk Score, transit accessibility, facility siting |
| **Environmental Planning** | NDVI, UHI, green space, tree canopy, impervious surface, air quality, flood risk | Environmental baseline, UHI mapping, vulnerability assessment |
| **Housing Policy** | Jobs-housing balance, displacement risk, gentrification model, property valuation | Affordability mapping, early warning system, equity audit |
| **Quantitative Methods** | Full spatial statistics (Moran's I, LISA, GWR, kriging, PCA, clustering) | Autocorrelation testing, hot-spot analysis, regression modelling |
| **Planning Studio** | All flows + dashboard builder + report engine | Full neighbourhood assessment → policy brief |
| **Sustainability & SDGs** | SDG 11 indicators, climate adaptation, energy metrics | SDG 11 dashboard, Voluntary Local Review |
| **Planning Ethics & Equity** | Equity audit, disaggregation, Gini/Theil/Atkinson, facility siting with equity | Service equity analysis, participatory mapping, bias discussion |
| **Urban Simulation** | CA growth model, ABM, system dynamics, scenario manager | Growth simulation, pedestrian ABM, what-if scenarios |
| **Research Methods** | Report engine, citation manager, reproducible analysis, Jupyter export | Full research paper workflow: data → analysis → publication |

### 10.3 Research Reproducibility Features

| Feature | Implementation |
|---------|---------------|
| **Deterministic Logging** | Every calculator run logged with exact inputs, parameters, outputs, timestamps |
| **Reproducible Notebooks** | Export any analysis as Jupyter (.ipynb) or Observable (.ojs) notebook |
| **Version-Controlled Projects** | Git-like change tracking for project state with diff and rollback |
| **Citation-Ready Output** | All results include methodology references in APA 7th / BibTeX |
| **Data Lineage** | Full provenance chain from source to result (ISO 19115 compliant) |
| **Statistical Reporting** | p-values, confidence intervals, effect sizes, sample sizes automatic |
| **FAIR Compliance** | Findable (catalogue), Accessible (API), Interoperable (standards), Reusable (metadata) |
| **Peer Review Mode** | Anonymised project sharing for blind review workflows |

---

## 11. New Indicator Groups: 53 Additional Metrics <a name="11-new-indicator-groups"></a>

### 11.1 Transport & Mobility (8)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `vehicleKmTravelled` | $VKT = \sum_i (AADT_i \times L_i)$ | veh-km/day | FHWA (2019) |
| `modeSplit` | Proportion vector: walk, cycle, transit, car | % per mode | Census journey-to-work |
| `transitServiceFrequency` | $\bar{f} = \frac{1}{n}\sum_i f_i$ (peak headway) | veh/hour | GTFS computed |
| `cycleLaneConnectivity` | Network connectivity index (alpha, beta) for cycle infra | dimensionless | Dill (2004) |
| `parkingUtilisation` | occupied / total spaces | ratio 0–1 | Shoup (2005) |
| `averageCommuteTime` | Population-weighted mean commute duration | minutes | Census/survey |
| `roadSafetyIndex` | $RSI = \frac{crashes \times severity}{L \times AADT}$ | index | WHO (2018) |
| `lastMileAccess` | % population within 400 m of transit stop | % | Cervero (2013) |

### 11.2 Energy & Climate (7)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `buildingEnergyIntensity` | $EUI = E_{annual} / A_{floor}$ | kWh/m²/yr | ASHRAE 90.1 |
| `renewableEnergyShare` | $E_{renewable} / E_{total} \times 100$ | % | IRENA (2023) |
| `carbonFootprintPerCapita` | $\sum sector\_emissions / P$ | tCO₂e/cap/yr | WRI GHG Protocol |
| `urbanAlbedo` | Surface reflectivity from satellite (0–1) | dimensionless | Akbari et al. (2009) |
| `coolingDegreeDays` | $CDD = \sum \max(T_{mean} - T_{base}, 0)$ | degree-days | ASHRAE |
| `evapotranspiration` | Penman-Monteith reference ET₀ | mm/day | FAO-56 (Allen et al., 1998) |
| `embodiedCarbon` | $\sum (mass_i \times EF_i)$ per material | kgCO₂e/m² | ICE Database v3.0 |

### 11.3 Urban Form & Landscape Ecology (8)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `spacematrixPosition` | $(FSI, GSI)$ coordinate in Spacematrix diagram | dimensionless | Berghauser Pont & Haupt (2010) |
| `blockDensityProfile` | Typological classification (A–F) from FSI × GSI | category | Meta Berghauser Pont et al. (2019) |
| `edgeDensity` | $ED = (\sum e_k / A) \times 10{,}000$ | m/ha | McGarigal et al. (2012) FRAGSTATS |
| `patchRichness` | Count of distinct patch types per landscape | count | McGarigal et al. (2012) |
| `fractalDimension` | $D = 2\ln(0.25P) / \ln(A)$ (area-perimeter) | 1.0–2.0 | Batty & Longley (1994) |
| `skyViewFactor` | Hemisphere-weighted visible sky ratio | 0–1 | Oke et al. (2017) |
| `streetWallContinuity` | % frontage with facade ≤ 3 m from lot line | % | Gehl (2010) |
| `buildingHeightVariance` | $CV = \sigma_h / \bar{h}$ | dimensionless | Yoshida & Omae (2005) |

### 11.4 Social Infrastructure & Liveability (7)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `socialCohesionIndex` | Composite: civic participation, trust, volunteering | 0–100 | Putnam (2000) |
| `culturalFacilityAccess` | Gravity-based access to museums, libraries, theatres | score | Bianchini & Parkinson (1993) |
| `childFriendlyScore` | 15 sub-indicators (play space, school proximity, safety, air quality) | 0–100 | UNICEF (2018) |
| `ageFriendlyScore` | WHO 8-domain framework (transport, housing, civic, health) | 0–100 | WHO (2007) |
| `foodDesertIndex` | % population > 500 m from fresh food retail | % | USDA ERS (2012) |
| `publicSpaceQuality` | Expert-scored audit (cleanliness, amenity, safety, comfort) | 0–100 | Gehl & Svarre (2013) |
| `nighttimeEconomy` | Commercial establishments open after 22:00 per km² | density | Roberts & Eldridge (2009) |

### 11.5 Water & Infrastructure (6)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `waterConsumptionPerCapita` | $Q_{supply} / P$ | litres/cap/day | WHO / IWA |
| `stormwaterRunoffCoeff` | $C = \sum(c_i \times A_i) / A_{total}$ | 0–1 | Rational Method (Kuichling, 1889) |
| `sewerCapacityRatio` | Peak flow / design capacity | ratio | Local engineering standards |
| `roadPavementCondition` | PCI network mean | 0–100 | ASTM D6433 |
| `utilityReliability` | $1 - (outage\_hours / total\_hours)$ per year | 0–1 | IEEE 1366 |
| `greenInfrastructureRatio` | Permeable + green surface / total area | ratio | EPA (2021) |

### 11.6 Governance & Innovation (5)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `planningPermitEfficiency` | Mean processing days for building permits | days | World Bank Doing Business |
| `openDataMaturity` | Datasets published, API availability, update frequency | 0–100 | OECD OURdata Index |
| `smartCityReadiness` | ICT infrastructure + digital services + open data + engagement | 0–100 | ITU (2023) |
| `publicParticipationRate` | Attendance/submissions per planning action | per 1,000 pop | Arnstein (1969) |
| `intermodalIntegration` | Transfer seamlessness (time, fare, information) | 0–100 | Grotenhuis et al. (2007) |

### 11.7 Heritage & Culture (4)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `heritageDensity` | Listed buildings + monuments per km² | count/km² | UNESCO WHC |
| `facadeIntactness` | % original facade elements preserved on heritage streets | % | ICOMOS (2011) |
| `culturalLandscapeDiversity` | Shannon entropy of landscape character types | 0–1 | ELC (2000) |
| `intangibleHeritageVitality` | Practitioner count + event frequency + transmission | composite | UNESCO ICH (2003) |

### 11.8 Pandemic Resilience (4)

| Indicator | Formula / Method | Unit | Reference |
|-----------|-----------------|------|-----------|
| `publicSpacePerCapita_adj` | Usable outdoor space with distancing (2 m²/person) | m²/cap | Honey-Rosés et al. (2020) |
| `essentialServiceProximity` | % pop within 15-min walk of pharmacy + grocery + clinic | % | Moreno et al. (2021) |
| `housingDensityRisk` | Overcrowding × building age × ventilation proxy | composite | Ahmad et al. (2020) |
| `digitalAccessEquity` | Broadband subscription Gini by income decile | Gini | Beaunoyer et al. (2020) |

---

## 12. Competitive Positioning & Differentiation <a name="12-competitive-positioning"></a>

### 12.1 Platform Comparison Matrix

| Capability | SynapseCore (Enhanced) | ArcGIS Urban | QGIS + PySAL | UrbanSim | CityEngine |
|-----------|----------------------|-------------|-------------|----------|------------|
| Browser-native (zero install) | ✅ | ❌ (cloud SaaS) | ❌ (desktop) | ❌ | ❌ |
| Spatial statistics suite | ✅ | ✅ | ✅✅ | ⚠️ | ❌ |
| Multi-provider AI (5 backends) | ✅✅ | ⚠️ | ❌ | ❌ | ❌ |
| Natural language → spatial SQL | ✅ | ❌ | ❌ | ❌ | ❌ |
| SDG 11 native monitoring | ✅✅ | ⚠️ | ❌ | ❌ | ❌ |
| 3D digital twin | ✅ | ✅✅ | ⚠️ | ❌ | ✅✅ |
| Urban growth simulation | ✅ | ⚠️ | ⚠️ | ✅✅ | ⚠️ |
| Facility siting optimisation | ✅ | ❌ | ⚠️ | ❌ | ❌ |
| Integrated report generator | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Python-in-browser (Pyodide) | ✅ | ❌ | ✅ (native) | ✅ | ⚠️ |
| Real-time collaboration | ✅ | ✅ | ❌ | ❌ | ❌ |
| Planning education modules | ✅✅ | ⚠️ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ✅ | ✅ | ❌ |
| Peer-reviewed calculators | ✅✅ (80+) | ⚠️ | ✅ | ⚠️ | ❌ |

### 12.2 Unique Value Proposition

> **SynapseCore is the first browser-native urban analytics platform that combines research-grade spatial statistics, multi-provider AI assistance, SDG 11 monitoring, 3D urban modelling, and structured learning paths in a single open-source application — purpose-built for planning education and publishable urban research.**

### 12.3 Target User Segments

| Segment | Primary Value | Key Features |
|---------|---------------|-------------|
| **Graduate planning students** | Learn-by-doing with research tools | 8 learning paths, 120+ exercises, methodology explainers, 6 pre-loaded city datasets |
| **Planning faculty** | Curriculum delivery platform | Assignment creation, auto-grading, student progress tracking, course dashboard |
| **Urban researchers** | Publication-ready spatial analysis | Statistical rigour (p-values, CI), reproducible workflows, citation management, Jupyter export |
| **Municipal planners** | Evidence-based decision support | SDG monitoring, scenario comparison, equity audit, dashboard builder, VLR report generation |
| **NGOs & development agencies** | Rapid urban diagnostics | Zero-install deployment, city profile dashboards, multi-language support |
| **Citizen groups** | Participatory planning input | Public survey maps, sentiment heatmaps, accessible dashboards |

---

## 13. Implementation Roadmap & Phasing <a name="13-implementation-roadmap"></a>

### Phase 1: Scientific Foundation

**Objective**: Establish research-grade analytical credibility.

| # | Task | Components | Dependencies |
|---|------|-----------|-------------|
| 1.1 | Spatial weight matrices | Queen, Rook, KNN, Distance-band, row-standardise | None |
| 1.2 | Global & Local Moran's I | Permutation inference (999 perm), LISA cluster maps | 1.1 |
| 1.3 | Getis-Ord Gi\* hot-spot analysis | z-score map, confidence classification (90/95/99%) | 1.1 |
| 1.4 | OLS with spatial diagnostics | R², AIC, BIC, Moran's I on residuals, LM-lag, LM-error, VIF | 1.1 |
| 1.5 | Geographically Weighted Regression | AICc bandwidth, local R², coefficient surfaces | 1.4 |
| 1.6 | STAC Client + COG Reader | Earth observation data access pipeline | None |
| 1.7 | Sentinel Hub connector | Sentinel-2 multispectral imagery access | 1.6 |
| 1.8 | Five incomplete flow implementations | Composite, Scenario, Equity, Change Detection, Review | None |
| 1.9 | PCA + Cluster analysis | K-means with silhouette, hierarchical with dendrogram | None |

### Phase 2: GeoAI & 3D

**Objective**: Machine learning and 3D visual intelligence capabilities.

| # | Task | Components | Dependencies |
|---|------|-----------|-------------|
| 2.1 | ONNX Runtime Web integration | Model loading, inference, memory management | None |
| 2.2 | Land cover classification | U-Net on Sentinel-2 → 6-class map + accuracy assessment | 1.7, 2.1 |
| 2.3 | Natural language → spatial SQL | Intent + entity extraction → DuckDB SQL generation | None |
| 2.4 | Building extrusion (GeoJSON → 3D) | LOD 0–1, instanced rendering for 100K+ buildings | None |
| 2.5 | CityJSON v2.0 loader | Parse → three.js BufferGeometry with semantic surfaces | 2.4 |
| 2.6 | Sunlight simulation | Solar position → shadow accumulation → exposure analysis | 2.4 |
| 2.7 | Object detection (YOLOv8-nano) | Urban object detection from VHR imagery | 2.1 |
| 2.8 | Report narrative generator | AI-written analytical text with auto-citations | None |

### Phase 3: Scenario & Simulation

**Objective**: Future-state modelling and optimisation.

| # | Task | Components | Dependencies |
|---|------|-----------|-------------|
| 3.1 | Cellular Automata growth model | Calibration, simulation, validation (FoM, Kappa) | Phase 1 |
| 3.2 | Facility siting optimisation | P-median, MCLP with equity constraints | Phase 1 |
| 3.3 | Composite Indicator Builder UI | Full 7-step flow with Sobol' sensitivity analysis | 1.9 |
| 3.4 | Scenario comparison dashboard | Multi-scenario delta maps, radar, parallel coordinates | Phase 1 |
| 3.5 | System dynamics model | Stock-flow for population, housing, transport, green space | None |
| 3.6 | Emerging Hot Spot analysis | Mann-Kendall + Gi\* per time step, 8-category classification | 1.3 |

### Phase 4: Visualisation, Reporting & Education

**Objective**: Communication layer and pedagogical scaffolding.

| # | Task | Components | Dependencies |
|---|------|-----------|-------------|
| 4.1 | Dashboard builder | Drag-and-drop canvas, widget library, 5 templates, PDF/PNG/embed export | None |
| 4.2 | Academic report engine | 4 templates, auto-narrative, citation manager (APA/BibTeX) | 2.8 |
| 4.3 | 14 new chart types | Parallel coordinates, radar, Sankey, violin, small multiples, etc. | None |
| 4.4 | Learning path engine | 8 paths, 120+ exercises, methodology explainers | All calculators |
| 4.5 | Pre-loaded teaching datasets | 6 cities (NYC, London, Barcelona, Istanbul, Singapore, Melbourne) | None |
| 4.6 | Exercise framework | 6 exercise types, auto-grading, rubrics, targeted feedback | 4.4 |

### Phase 5: Collaboration, Scale & Quality Assurance

**Objective**: Production-readiness, multi-user, performance.

| # | Task | Components | Dependencies |
|---|------|-----------|-------------|
| 5.1 | CRDT real-time collaboration | Yjs integration, presence indicators, comment system | None |
| 5.2 | WASM spatial indexing | Rust R-tree compiled to WASM (10× query speedup) | None |
| 5.3 | Arrow / GeoParquet I/O | Columnar format for datasets > 100K features | None |
| 5.4 | Web Worker pool | 4–8 worker dispatch for parallel computation | None |
| 5.5 | 53 new indicator implementations | All indicators from Section 11 | Phase 1 |
| 5.6 | Vitest unit test suite | All 80+ calculators × 3+ test cases minimum | All indicators |
| 5.7 | Playwright E2E tests | All 8+ flows end-to-end coverage | All flows |
| 5.8 | Accessibility audit | WCAG 2.1 AA compliance via axe-core | All UI |
| 5.9 | Bundle size budgets | < 2 MB initial load; < 500 KB per lazy chunk | All modules |

---

## 14. Technical Debt Remediation <a name="14-technical-debt"></a>

| Item | Current State | Resolution | Phase |
|------|--------------|------------|-------|
| GeoAI module | Empty directory scaffolding | Full CV + NLP + Models implementation | 2 |
| Streaming engine | Empty index export | IoT WebSocket + MQTT connector | 5 |
| WASM engine | Empty index export | Rust-compiled spatial indexing & geometry ops | 5 |
| Right panel card seeds | 42 card sections defined, none populated | Content seeding with methodology descriptions | 1 |
| RAG system corpus | Infrastructure exists; minimal content | Academic corpus loading (IPCC, UN-Habitat, WHO, OECD) | 2 |
| Agent autonomy | Framework only; no tool-calling capability | Interactive agents with calculator/flow dispatch | 3 |
| Legacy compatibility | SessionPersistence reads deprecated fields | Migration with deprecation warnings; remove after 2 releases | 1 |
| Test coverage | Zero unit tests; zero E2E tests | Vitest + Playwright comprehensive suite | 5 |
| Bundle budget | No size limits enforced | Webpack bundle analyser + size-limit CI check | 5 |
| Documentation | README only | Generated API docs (TypeDoc) + architecture decision records | 5 |

---

## 15. References <a name="15-references"></a>

Adger, W.N. (2003). Social capital, collective action, and adaptation to climate change. *Economic Geography*, 79(4), 387–404.

Allen, R.G., Pereira, L.S., Raes, D. & Smith, M. (1998). Crop evapotranspiration: Guidelines for computing crop water requirements. *FAO Irrigation and Drainage Paper* 56.

Anselin, L. (1988). *Spatial Econometrics: Methods and Models*. Kluwer Academic.

Anselin, L. (1995). Local indicators of spatial association — LISA. *Geographical Analysis*, 27(2), 93–115.

Arnold, C.L. & Gibbons, C.J. (1996). Impervious surface coverage: The emergence of a key environmental indicator. *Journal of the American Planning Association*, 62(2), 243–258.

Batty, M. (2005). *Cities and Complexity: Understanding Cities with Cellular Automata, Agent-Based Models, and Fractals*. MIT Press.

Batty, M. (2013). *The New Science of Cities*. MIT Press.

Batty, M. & Longley, P. (1994). *Fractal Cities*. Academic Press.

Berghauser Pont, M. & Haupt, P. (2010). *Spacematrix: Space, Density and Urban Form*. NAi Publishers.

Brandes, U. (2001). A faster algorithm for betweenness centrality. *Journal of Mathematical Sociology*, 25(2), 163–177.

Carr, L.J., Dunsiger, S.I. & Marcus, B.H. (2010). Walk Score as a global estimate of neighborhood walkability. *American Journal of Preventive Medicine*, 39(5), 460–463.

Cervero, R. (1989). Jobs-housing balancing and regional mobility. *Journal of the American Planning Association*, 55(2), 136–150.

Chapple, K. & Zuk, M. (2016). Forewarned: The use of neighborhood early warning systems for gentrification and displacement. *Environment and Planning A*, 48(4), 654–674.

Church, R.L. & ReVelle, C.S. (1974). The maximal covering location problem. *Papers of the Regional Science Association*, 32(1), 101–118.

Clark, P.J. & Evans, F.C. (1954). Distance to nearest neighbor as a measure of spatial relationships in populations. *Ecology*, 35(4), 445–453.

Clarke, K.C., Hoppen, S. & Gaydos, L. (1997). A self-modifying cellular automaton model of historical urbanization in the San Francisco Bay area. *Environment and Planning B*, 24(2), 247–261.

Cliff, A.D. & Ord, J.K. (1973). *Spatial Autocorrelation*. Pion.

Cressie, N.A.C. (1993). *Statistics for Spatial Data* (Revised ed.). Wiley.

Cutter, S.L., Boruff, B.J. & Shirley, W.L. (2003). Social vulnerability to environmental hazards. *Social Science Quarterly*, 84(2), 242–261.

Daskin, M.S. (1995). *Network and Discrete Location: Models, Algorithms, and Applications*. Wiley.

Diggle, P.J. (2003). *Statistical Analysis of Spatial Point Patterns* (2nd ed.). Arnold.

Forrester, J.W. (1969). *Urban Dynamics*. MIT Press.

Fotheringham, A.S., Brunsdon, C. & Charlton, M. (2002). *Geographically Weighted Regression: The Analysis of Spatially Varying Relationships*. Wiley.

Fotheringham, A.S., Yang, W. & Kang, W. (2017). Multiscale geographically weighted regression (MGWR). *Annals of the American Association of Geographers*, 107(6), 1247–1265.

Gehl, J. (2010). *Cities for People*. Island Press.

Getis, A. & Ord, J.K. (1992). The analysis of spatial association by use of distance statistics. *Geographical Analysis*, 24(3), 189–206.

Geurs, K.T. & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies: Review and research directions. *Journal of Transport Geography*, 12(2), 127–140.

Gini, C. (1912). *Variabilità e mutabilità*. Tipografia di P. Cuppini.

Goovaerts, P. (1997). *Geostatistics for Natural Resources Evaluation*. Oxford University Press.

Hansen, W.G. (1959). How accessibility shapes land use. *Journal of the American Institute of Planners*, 25(2), 73–76.

Hillier, B. & Hanson, J. (1984). *The Social Logic of Space*. Cambridge University Press.

Hoek, G., et al. (2008). A review of land-use regression models to assess spatial variation of outdoor air pollution. *Atmospheric Environment*, 42(33), 7561–7578.

Honey-Rosés, J., et al. (2020). The impact of COVID-19 on public space: An early review. *Cities & Health*, 5(sup1), S263–S279.

IPCC (2014). *Climate Change 2014: Impacts, Adaptation, and Vulnerability. Part A: Global and Sectoral Aspects*. Cambridge University Press.

Jolliffe, I.T. (2002). *Principal Component Analysis* (2nd ed.). Springer.

Kansky, K.J. (1963). *Structure of Transportation Networks: Relationships Between Network Geometry and Regional Characteristics*. University of Chicago.

Kaufman, L. & Rousseeuw, P.J. (1990). *Finding Groups in Data: An Introduction to Cluster Analysis*. Wiley.

Ledoux, H., et al. (2019). CityJSON: A compact and easy-to-use encoding of the CityGML data model. *Open Geospatial Data, Software and Standards*, 4(1), 4.

LeSage, J.P. & Pace, R.K. (2009). *Introduction to Spatial Econometrics*. CRC Press.

Lu, D., Mausel, P., Brondizio, E. & Moran, E. (2004). Change detection techniques. *International Journal of Remote Sensing*, 25(12), 2365–2401.

Lundberg, S.M. & Lee, S.I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30, 4765–4774.

Ma, L., et al. (2019). Deep learning in remote sensing applications: A meta-analysis and review. *ISPRS Journal of Photogrammetry and Remote Sensing*, 152, 166–177.

McGarigal, K., Cushman, S.A. & Ene, E. (2012). *FRAGSTATS v4: Spatial Pattern Analysis Program for Categorical and Continuous Maps*. University of Massachusetts, Amherst.

Moran, P.A.P. (1950). Notes on continuous stochastic phenomena. *Biometrika*, 37(1–2), 17–23.

Moreno, C., et al. (2021). Introducing the "15-minute city": Sustainability, resilience and place identity. *Smart Cities*, 4(1), 93–111.

Neutens, T., et al. (2010). Equity of urban service delivery: A comparison of different accessibility measures. *Applied Geography*, 30(4), 561–571.

OECD/JRC (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide*. OECD Publishing.

Oke, T.R. (1982). The energetic basis of the urban heat island. *Quarterly Journal of the Royal Meteorological Society*, 108(455), 1–24.

Oke, T.R., Mills, G., Christen, A. & Voogt, J.A. (2017). *Urban Climates*. Cambridge University Press.

Pontius, R.G., et al. (2008). Comparing the input, output, and validation maps for several models of land change. *Annals of Regional Science*, 42(1), 11–37.

Putnam, R.D. (2000). *Bowling Alone: The Collapse and Revival of American Community*. Simon & Schuster.

Rey, S.J. (2001). Spatial empirics for economic growth and convergence. *Geographical Analysis*, 33(3), 195–214.

Ripley, B.D. (1976). The second-order analysis of stationary point processes. *Journal of the Royal Statistical Society: Series B*, 39(2), 172–212.

Roberts, D.R., et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913–929.

Ronneberger, O., Fischer, P. & Brox, T. (2015). U-Net: Convolutional networks for biomedical image segmentation. In *MICCAI 2015* (pp. 234–241). Springer.

Rosen, S. (1974). Hedonic prices and implicit markets: Product differentiation in pure competition. *Journal of Political Economy*, 82(1), 34–55.

Rouse, J.W., Haas, R.H., Schell, J.A. & Deering, D.W. (1973). Monitoring vegetation systems in the Great Plains with ERTS. *Third Earth Resources Technology Satellite-1 Symposium*, 1, 309–317.

Shannon, C.E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423.

Silverman, B.W. (1986). *Density Estimation for Statistics and Data Analysis*. Chapman & Hall.

Simpson, E.H. (1949). Measurement of diversity. *Nature*, 163, 688.

Sterman, J.D. (2000). *Business Dynamics: Systems Thinking and Modeling for a Complex World*. McGraw-Hill.

Talen, E. (1998). Visualizing fairness: Equity maps for planners. *Journal of the American Planning Association*, 64(1), 22–38.

UNDRR (2015). *Sendai Framework for Disaster Risk Reduction 2015–2030*. United Nations.

UN-Habitat (2020). *SDG 11 Monitoring Framework: A Guide to Assist National and Local Governments*. UN-Habitat.

WHO (2007). *Global Age-Friendly Cities: A Guide*. World Health Organization.

WHO (2016). *Urban Green Spaces and Health: A Review of Evidence*. World Health Organization.

WHO (2021). *WHO Global Air Quality Guidelines: Particulate Matter (PM₂.₅ and PM₁₀), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide*. World Health Organization.

Zhu, X.X., et al. (2017). Deep learning in remote sensing: A comprehensive review and list of resources. *IEEE Geoscience and Remote Sensing Magazine*, 5(4), 8–36.

---

*This document constitutes a living strategic plan and should be revised as implementation phases complete and new requirements emerge.*

*Version 2.0 | 21 March 2026 | SynapseCore Urban Analytics Workbench*
*Total Proposed Indicators: 80 (27 existing + 53 new) | Flows: 13 (3 existing + 5 completing + 5 new)*
*Learning Paths: 8 | Exercises: 120+ | Teaching Datasets: 6 cities*
