import type { MicroGuide } from "./guideTypes";

export const MICRO_GUIDES: MicroGuide[] = [

  {
    id: "walk-score",
    title: "Walk Score & Pedestrian Accessibility",
    category: "Accessibility",
    updated: "2025-01-15",
    abstract:
`Methodology for computing pedestrian accessibility scores using network-based distance to amenities. Combines isochrone analysis, POI density, and population weighting to produce composite walkability indices comparable to the Walk Score approach.`,
    criteria:
`**Key inputs and parameters**
\u2022 Street network from OpenStreetMap (drive graph filtered to pedestrian-accessible edges).
\u2022 POI dataset: grocery, schools, parks, transit stops, healthcare, retail with category weights.
\u2022 Travel-time thresholds: typically 5, 10, 15, 20 min walk (400\u20131600 m network distance).
\u2022 Population raster or census polygons for demand-side weighting.
\u2022 Decay function: linear, negative-exponential, or stepped.`,
    differential:
`Compare results against published Walk Score values to validate. Consider differences from: network completeness in OSM, POI source coverage, impedance assumptions (flat terrain vs hilly), and whether informal paths are included.`,
    riskStrat:
`**Data quality factors**
Higher uncertainty with: incomplete OSM sidewalk data, outdated POI databases, areas with gated communities or elevation barriers not captured in 2-D networks. Lower uncertainty with: dense urban cores, recent OSM imports, validated POI layers.`,
    redFlags:
`Scores near boundaries of classification breaks may mislead if break selection is arbitrary. Large areas with no POI data produce artificially low scores \u2014 verify data coverage before interpreting. Network islands (disconnected subgraphs) distort isochrones.`,
    monitoring:
`**Validation checkpoints**
\u2022 Spot-check isochrone polygons against known walking routes.
\u2022 Compare histogram of scores with reference distribution.
\u2022 Sensitivity test: vary decay function and threshold; report coefficient of variation.
\u2022 Cross-tabulate with census income/race to flag equity implications.`,
    communication:
`Present Walk Score maps with explicit legend and break methodology. State data vintage and POI source. Clarify that scores reflect proximity to amenities, not perceived safety or comfort.`,
    followUp:
`Repeat analysis when OSM or POI data is updated. Layer with pedestrian crash data or shade/comfort indices for a more complete accessibility picture.`,
    docPhrases:
`"Pedestrian accessibility index computed using network-distance isochrones to weighted POI categories. Decay function: [type]. Data sources: OSM network [date], POI layer [source/date]. Results are comparative indices; field validation recommended."`,
    references:
`Walk Score methodology (walkscore.com); Vale & Pereira (2017) network-based accessibility; Boeing (2017) OSMnx; Higgins (2022) pedestrian accessibility equity.`,
    tags: ["Walkability", "Isochrone", "POI", "OSMnx"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Urban Transport Analyst, PhD"]
  },


  {
    id: "ndvi-vegetation",
    title: "NDVI & Vegetation Analysis",
    category: "RemoteSensing",
    updated: "2025-01-15",
    abstract:
`Normalized Difference Vegetation Index (NDVI) quantifies vegetation cover from multispectral satellite imagery. Computed as (NIR \u2212 Red) / (NIR + Red) using Sentinel-2 Band 8 (842 nm) and Band 4 (665 nm). Values range from \u22121 to +1; healthy vegetation typically > 0.3.`,
    criteria:
`**Data and processing**
\u2022 Sentinel-2 Level-2A (atmospherically corrected) or Landsat 8/9 Collection 2 Level-2.
\u2022 Cloud masking: SCL band (Sentinel-2) or QA_PIXEL (Landsat); target < 10% scene cloud.
\u2022 Temporal compositing: median composite over growing-season window reduces noise.
\u2022 Spatial resolution: 10 m (Sentinel-2 B4/B8), 30 m (Landsat).
\u2022 Index variants: EVI, SAVI for sparse-vegetation or high-soil-brightness contexts.`,
    differential:
`Distinguish NDVI artefacts from real change: atmospheric haze, shadow, snow, water bodies all depress NDVI. Bare soil and impervious surface yield low positive values (0.0\u20130.15). Compare with higher-order indices (EVI, NDMI) when NDVI alone is ambiguous.`,
    riskStrat:
`**Interpretation caution**
Urban NDVI is affected by mixed pixels (trees + rooftops in one 10 m cell), seasonality, and irrigation. Panchromatic sharpening can introduce spectral distortion. Report acquisition dates and compositing window.`,
    redFlags:
`Negative NDVI over known vegetated areas \u2192 check cloud mask. Unusually high NDVI in arid zones \u2192 possible irrigation artefact or misclassification. Sudden drops between dates \u2192 verify whether land-cover change or sensor/atmospheric issue.`,
    monitoring:
`**Quality assurance**
\u2022 Validate against ground-truth transects or high-resolution aerial photos.
\u2022 Report min/max/mean/std-dev of NDVI per land-use class.
\u2022 Time-series trend (Mann-Kendall or Theil-Sen slope) for multi-year analyses.
\u2022 Accuracy: confusion matrix if NDVI is used for binary green/non-green classification.`,
    communication:
`Map NDVI with a diverging green-brown palette. State satellite platform, date range, and compositing method. Clarify that NDVI measures photosynthetic activity, not tree count or species composition.`,
    followUp:
`Combine NDVI with LST for urban heat island studies. Use change detection between epochs for green-cover monitoring. Consider LiDAR canopy height model for 3-D vegetation structure.`,
    docPhrases:
`"NDVI computed from [Sentinel-2 / Landsat] imagery, [date range]. Cloud mask applied (SCL / QA_PIXEL). Median composite generated. Interpretation: values > 0.3 indicate moderate-to-dense vegetation. Results support planning-level assessment; field verification advised."`,
    references:
`Rouse et al. (1974) NDVI definition; Huete et al. (2002) EVI; Copernicus Sentinel-2 User Guide; USGS Landsat Collection 2.`,
    tags: ["NDVI", "Sentinel-2", "Landsat", "Vegetation", "Remote Sensing"],
    meta: {
      criteria:   { evidence: "A" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Remote Sensing Scientist, PhD"]
  },


  {
    id: "morans-i",
    title: "Spatial Autocorrelation (Moran's I)",
    category: "SpatialStats",
    updated: "2025-01-15",
    abstract:
`Global and local Moran's I measure the degree of spatial clustering in areal data. Global I summarizes overall pattern (clustered, dispersed, random); Local Indicators of Spatial Association (LISA) identify statistically significant hot spots, cold spots, and spatial outliers.`,
    criteria:
`**Setup**
\u2022 Input: polygon or point layer with a continuous numeric attribute.
\u2022 Spatial weights matrix: queen/rook contiguity, k-nearest neighbours, or distance band \u2014 choice must be justified.
\u2022 Permutation inference (999+ permutations) for pseudo p-values; FDR correction for LISA maps.
\u2022 Row-standardize weights (W) unless theoretical reasons dictate otherwise.
\u2022 Software: PySAL (esda module), GeoDa, R spdep.`,
    differential:
`A non-significant Global I does not rule out local clustering \u2014 always run LISA. Compare with Getis-Ord Gi* for hot-spot detection (unsigned). Consider Geary's C for finer-scale variation. Edge effects and the modifiable areal unit problem (MAUP) can alter results.`,
    riskStrat:
`**Sensitivity**
Results are sensitive to: spatial weights specification, scale of analysis, variable distribution (skew biases I). Always run sensitivity across at least two weights definitions and report how results change.`,
    redFlags:
`Extremely high I values with very low p \u2192 verify no duplicate geometries or data join errors. LISA clusters concentrated along study-area boundary \u2192 possible edge effect. Negative I in a context expecting clustering \u2192 check variable coding direction.`,
    monitoring:
`**Reporting checklist**
\u2022 State: variable, weights type, number of permutations, significance threshold.
\u2022 Map: LISA cluster map (HH, HL, LH, LL, not significant) with p-value filter.
\u2022 Table: Global I value, expected I, z-score, p-value.
\u2022 Sensitivity summary across alternative weights.`,
    communication:
`Present LISA maps with clear legend distinguishing cluster types. Explain that significance is based on permutation testing and subject to MAUP. Avoid causal language ("X causes clustering").`,
    followUp:
`Use LISA results to delineate spatial regimes for GWR or regime regression. Feed hot-spot boundaries into policy targeting. Re-run when data vintage updates.`,
    docPhrases:
`"Spatial autocorrelation assessed via Global Moran's I (weights: [type], permutations: [n]). I = [value], p = [value]. LISA clusters mapped with FDR-corrected significance at \u03b1 = 0.05. Interpretation follows PySAL conventions."`,
    references:
`Anselin (1995) Local Indicators of Spatial Association; Cliff & Ord (1981); Rey & Anselin (2010) PySAL; Getis & Ord (1992).`,
    tags: ["Moran's I", "LISA", "PySAL", "Spatial Weights", "Hot Spots"],
    meta: {
      criteria:   { evidence: "A" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Spatial Statistician, PhD"]
  },


  {
    id: "street-network",
    title: "Street Network Analysis",
    category: "Network",
    updated: "2025-01-15",
    abstract:
`Graph-theoretic analysis of urban street networks using centrality metrics, connectivity indices, and morphological descriptors. OSMnx provides automated download, construction, and analysis of primal and dual graph representations from OpenStreetMap.`,
    criteria:
`**Workflow**
\u2022 Download network via OSMnx (network_type: walk, drive, bike, all).
\u2022 Simplify and consolidate intersections (tolerance parameter).
\u2022 Compute: node degree distribution, intersection density, average block length.
\u2022 Centrality metrics: betweenness, closeness, straightness, PageRank.
\u2022 Connectivity: alpha, beta, gamma indices; average circuity.`,
    differential:
`Distinguish topological metrics (graph-based) from geometric metrics (length/angle-based). Compare primal graph (intersections as nodes) vs dual graph (streets as nodes) \u2014 they answer different questions. OSM completeness varies by region; cross-check with local road datasets.`,
    riskStrat:
`**Data considerations**
Urban network metrics are sensitive to: boundary definition (edge-cutting artificially lowers connectivity), OSM tag filtering, intersection consolidation tolerance, and one-way vs two-way edge treatment.`,
    redFlags:
`Disconnected graph components \u2192 check boundary clipping or missing bridge/tunnel links. Unusually low betweenness \u2192 verify that the network type includes the expected edge classes. Very high circuity (> 1.5) \u2192 possible topology errors.`,
    monitoring:
`**Validation**
\u2022 Visually inspect simplified network overlay on satellite imagery.
\u2022 Compare intersection count with official road network statistics.
\u2022 Report graph summary: nodes, edges, avg degree, total edge length.
\u2022 Benchmark centrality distributions against reference cities.`,
    communication:
`Map centrality values with sequential colour ramp; overlay on basemap for spatial context. State network type, OSM download date, and simplification parameters. Note that centrality does not equal traffic volume.`,
    followUp:
`Integrate with land-use data for accessibility analysis. Use betweenness to identify key corridors for pedestrianization studies. Track network evolution over time using historical OSM snapshots.`,
    docPhrases:
`"Street network downloaded via OSMnx (network_type: [type], date: [date]). Graph simplified (tolerance: [m]). Centrality metrics computed: betweenness, closeness. Connectivity indices reported. Results support morphological comparison; not a traffic model."`,
    references:
`Boeing (2017) OSMnx; Marshall et al. (2018) street network design; Porta et al. (2006) centrality and urban structure; Barthelemy (2011) spatial networks.`,
    tags: ["OSMnx", "Centrality", "Connectivity", "Graph Theory"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Urban Morphologist, PhD"]
  },


  {
    id: "gtfs-transit",
    title: "Transit Accessibility (GTFS)",
    category: "Accessibility",
    updated: "2025-01-15",
    abstract:
`Assessment of public transit service quality and accessibility using General Transit Feed Specification (GTFS) data. Metrics include headway, frequency, service-area coverage, and multi-modal isochrones for evaluating equitable transit provision.`,
    criteria:
`**Data and metrics**
\u2022 GTFS static feed: stops, routes, trips, stop_times, calendar/calendar_dates.
\u2022 Service window: define representative weekday, peak/off-peak periods.
\u2022 Headway = time between consecutive departures at a stop.
\u2022 Frequency: trips per hour per route at key stops.
\u2022 Isochrone: travel-time contours combining walk + transit + transfer using GTFS + pedestrian network.
\u2022 Tools: GTFS-Lite, r5py, OpenTripPlanner, peartree, Conveyal.`,
    differential:
`Distinguish scheduled service from actual service (GTFS-RT for real-time). Feed quality issues: missing shapes.txt, incorrect stop locations, expired calendar dates. Compare stop-level metrics with route-level metrics for different planning questions.`,
    riskStrat:
`**Data quality checks**
Validate feed with Google/MobilityData GTFS Validator. Expired feeds produce no trips for the analysis date. Ghost stops (stops with no trips) inflate stop counts. Transfer penalties heavily influence isochrone results.`,
    redFlags:
`Zero trips on the analysis date \u2192 check calendar_dates exceptions and feed validity range. Isochrones that ignore walking time to first stop \u2192 misleading accessibility claims. Feeds with > 5% location errors \u2192 geocoding audit needed.`,
    monitoring:
`**Reporting**
\u2022 State feed publisher, version, validity dates.
\u2022 Map: stop frequency (trips/hr) by mode and time period.
\u2022 Isochrone maps at 15, 30, 45, 60 min with mode breakdown.
\u2022 Equity overlay: cross-tabulate isochrone coverage with disadvantaged-population census tracts.`,
    communication:
`Present frequency maps alongside population density. Clarify that GTFS represents scheduled \u2014 not actual \u2014 service. Note transfer-walk assumptions in isochrone generation.`,
    followUp:
`Compare scenarios (new route, frequency increase) using modified GTFS feeds. Integrate with job-access metrics for commute-equity analyses.`,
    docPhrases:
`"Transit accessibility assessed using GTFS feed from [agency, version]. Service window: [day/period]. Headway and frequency computed per stop. Isochrones generated via [tool] with [walk speed] m/s walk access. Results are schedule-based; real-time variation not captured."`,
    references:
`Google GTFS Reference; Pereira et al. (2021) r5r/r5py; Stewart (2017) transit accessibility; Farber et al. (2014) transit equity.`,
    tags: ["GTFS", "Transit", "Isochrone", "Headway", "Equity"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Transport Planner, MSc"]
  },


  {
    id: "uhi-detection",
    title: "Urban Heat Island Detection",
    category: "Environment",
    updated: "2025-01-15",
    abstract:
`Detection and mapping of Urban Heat Islands (UHI) using Land Surface Temperature (LST) derived from thermal infrared satellite imagery. Combines LST with NDVI and NDBI to characterise thermal patterns and identify mitigation priorities.`,
    criteria:
`**Methodology**
\u2022 LST retrieval: Landsat 8/9 Band 10 (TIRS) or MODIS MOD11A1; single-channel or split-window algorithm.
\u2022 Emissivity correction: NDVI-based emissivity estimation or ASTER GED.
\u2022 NDBI = (SWIR \u2212 NIR) / (SWIR + NIR) for built-up density proxy.
\u2022 UHI intensity: LST difference between urban and surrounding rural reference areas.
\u2022 Temporal: daytime vs nighttime LST; seasonal composites (summer peak).
\u2022 Resolution trade-offs: Landsat (100 m thermal, 30 m resampled) vs MODIS (1 km, daily).`,
    differential:
`Surface UHI (satellite-derived LST) differs from atmospheric UHI (air temperature from weather stations). Rooftop materials, tree canopy, and soil moisture all influence LST independently of UHI. Compare satellite LST with in-situ logger transects when available.`,
    riskStrat:
`**Uncertainty sources**
Cloud contamination in thermal bands, time-of-day of satellite overpass (Landsat ~10:30 AM local), wind conditions affecting LST patterns, and mixed-pixel effects in heterogeneous neighbourhoods.`,
    redFlags:
`Extremely high LST (> 60 C) \u2192 likely cloud-edge artefact or emissivity error. UHI intensity varying > 10 C within one city \u2192 verify rural reference selection. Winter LST analysis conflating snow albedo with thermal patterns.`,
    monitoring:
`**Quality assurance**
\u2022 Compare satellite LST with weather-station air temperature (correlation, bias).
\u2022 Report acquisition date/time, sensor, atmospheric correction method.
\u2022 Map LST with continuous palette; overlay NDVI and NDBI for explanation.
\u2022 Zonal statistics by land-use class or census tract.`,
    communication:
`Present LST maps with kelvin-to-celsius conversion and colour bar. Distinguish surface temperature from air temperature. Emphasize that single-date LST captures a snapshot, not a climatological average.`,
    followUp:
`Layer with tree-canopy and impervious-surface data for mitigation targeting. Model cooling scenarios (added green cover, cool roofs). Track temporal trend with multi-year Landsat archive.`,
    docPhrases:
`"LST derived from [Landsat / MODIS] on [date]. Emissivity corrected using NDVI threshold method. UHI intensity: [X] C (urban mean \u2013 rural reference). NDBI correlation computed. Results support planning-level heat assessment; not a substitute for microclimate modelling."`,
    references:
`Oke (1982) UHI concept; Weng (2009) thermal remote sensing; Li et al. (2020) global UHI; USGS Landsat thermal processing guide.`,
    tags: ["UHI", "LST", "NDBI", "Thermal", "Landsat"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Environmental Remote Sensing Scientist, PhD"]
  },


  {
    id: "site-suitability",
    title: "Multi-Criteria Site Suitability",
    category: "SiteSuitability",
    updated: "2025-01-15",
    abstract:
`Weighted overlay analysis combining environmental, infrastructure, and socioeconomic raster layers to identify optimal locations for urban development, facility siting, or conservation. Supports AHP, rank-sum, and equal-weight schemes.`,
    criteria:
`**Workflow**
\u2022 Define objective and constraint criteria (e.g., slope < 15%, outside flood zone, within 500 m of road).
\u2022 Input layers: reclassified to common suitability scale (1\u20135 or 0\u20131).
\u2022 Weighting: Analytic Hierarchy Process (AHP) pairwise comparison, or rank-sum, or equal weights.
\u2022 Constraint masking: Boolean layers exclude infeasible areas before overlay.
\u2022 Sensitivity analysis: vary weights +/-10\u201320% and report stability of top-ranked sites.
\u2022 Tools: QGIS sketcher, ArcGIS Weighted Overlay, Python rasterio + NumPy.`,
    differential:
`Raster overlay vs vector multi-criteria evaluation \u2014 raster is simpler but loses polygon attribute detail. Compare AHP with ELECTRE or TOPSIS for outranking alternatives. Consider whether criteria are compensatory (a high score on one can offset a low score on another).`,
    riskStrat:
`**Key sensitivities**
Results are sensitive to: reclassification breakpoints, weight allocation, spatial resolution alignment, and constraint definitions. Two analysts with different reclassification choices can reach opposite conclusions on the same data.`,
    redFlags:
`All cells scoring very high or very low \u2192 reclassification range may be too narrow. Weights summing to \u2260 1.0 \u2192 normalisation error. AHP consistency ratio > 0.10 \u2192 pairwise comparison matrix is inconsistent.`,
    monitoring:
`**Reporting**
\u2022 State all criteria, data sources, reclassification rules, and weight assignments.
\u2022 Map: composite suitability surface with break scheme.
\u2022 Sensitivity: side-by-side maps for alternative weight scenarios.
\u2022 Constraint map: overlay showing excluded areas.`,
    communication:
`Present suitability maps with transparent methodology documentation. Emphasize that suitability scores rank relative preference, not absolute fitness. Stakeholder review of weights is essential.`,
    followUp:
`Ground-truth top-ranked sites. Incorporate community feedback to adjust weights. Update when new data layers (e.g., updated flood maps) become available.`,
    docPhrases:
`"Multi-criteria suitability analysis performed with [n] criteria, weighted via [AHP / rank-sum / equal]. Reclassified to 1\u20135 scale. Constraint mask applied. AHP CR = [value]. Sensitivity tested across [n] weight scenarios. Results support decision-making; not a site-selection mandate."`,
    references:
`Saaty (1980) AHP; Malczewski (2006) GIS-MCDA; Eastman (2012) IDRISI multi-criteria evaluation; Store & Kangas (2001) site selection.`,
    tags: ["AHP", "MCDA", "Weighted Overlay", "Rasterio"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["GIS Analyst, MSc"]
  },


  {
    id: "building-morphology",
    title: "Building Morphology Metrics",
    category: "Morphology",
    updated: "2025-01-15",
    abstract:
`Quantitative characterisation of urban built form using building footprints and heights. Key metrics include Floor Area Ratio (FAR), Ground Space Index (GSI), Open Space Ratio (OSR), and Spacematrix positioning for comparative morphological analysis across urban types.`,
    criteria:
`**Metrics**
\u2022 GSI = total building footprint area / plot area.
\u2022 FAR (FSI) = total gross floor area / plot area (requires building height or floor count).
\u2022 OSR = (1 \u2212 GSI) / FAR \u2014 captures open-space pressure.
\u2022 Building coverage ratio, average building height, height-to-width ratio of streets.
\u2022 Spacematrix diagram: plot FAR vs GSI with OSR isolines.
\u2022 Data: building footprints (cadastre, OSM, Microsoft Global ML Buildings), heights (LiDAR, Copernicus DSM, OSM tags).`,
    differential:
`FAR from planning regulations (theoretical max) vs FAR from actual footprints (measured). Distinguish residential FAR from total FAR when mixed-use zoning applies. 2-D footprint metrics can misrepresent areas with elevated structures or underground floors.`,
    riskStrat:
`**Data quality**
Building footprint completeness varies: OSM is excellent in European cities but patchy in the Global South. Height data from DSM includes vegetation; use nDSM (DSM \u2212 DTM) for accurate building heights. Missing heights \u2192 report GSI only.`,
    redFlags:
`FAR > 15 \u2192 likely data error or misaligned plot boundaries. GSI > 1.0 \u2192 overlapping footprints or incorrect plot delineation. Spacematrix clusters that defy known typology \u2192 inspect underlying data.`,
    monitoring:
`**Reporting**
\u2022 Tabulate metrics per tessellation unit (plot, block, neighbourhood).
\u2022 Spacematrix scatter plot with typology labels.
\u2022 Histogram of building heights; box-plot by neighbourhood.
\u2022 Source attribution for footprints and heights.`,
    communication:
`Present morphology maps at block or neighbourhood scale with clear unit labels. State data sources and assumptions about floor-to-floor height (typically 3 m). Clarify that metrics describe existing form, not zoning capacity.`,
    followUp:
`Compare morphology metrics across time periods for densification monitoring. Combine with energy modelling (solar potential, wind comfort). Feed into urban growth simulations.`,
    docPhrases:
`"Building morphology metrics computed from [footprint source] and [height source]. GSI, FAR, and OSR aggregated to [unit]. Spacematrix positions plotted. Floor-to-floor height assumption: [X] m. Results characterise built form; not zoning compliance assessments."`,
    references:
`Berghauser Pont & Haupt (2010) Spacematrix; Fleischmann et al. (2021) momepy; Boeing (2018) morphological analysis; Angel et al. (2021) Atlas of Urban Expansion.`,
    tags: ["FAR", "GSI", "Spacematrix", "momepy", "Morphology"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Urban Morphologist, PhD"]
  },


  {
    id: "flood-risk",
    title: "Flood Risk Assessment",
    category: "Environment",
    updated: "2025-01-15",
    abstract:
`GIS-based flood risk mapping combining Digital Elevation Model (DEM) analysis, flow accumulation, and exposure assessment. Integrates hazard layers with population and infrastructure data to evaluate flood risk and inform mitigation planning.`,
    criteria:
`**Workflow**
\u2022 DEM source: LiDAR (1\u20132 m), SRTM (30 m), Copernicus DEM (30 m), or ALOS (30 m).
\u2022 Hydrological conditioning: fill sinks, compute flow direction (D8 or D-infinity), flow accumulation.
\u2022 Flood-prone delineation: TPI-based lowland identification, Height Above Nearest Drainage (HAND), or 2-D hydraulic model output.
\u2022 Exposure mapping: overlay flood extent with building footprints, population grids, critical infrastructure.
\u2022 Return period context: 10-yr, 50-yr, 100-yr flood extents if available from national agencies.
\u2022 Tools: WhiteboxTools, SAGA GIS, HEC-RAS, QGIS.`,
    differential:
`Distinguish pluvial (surface-water) from fluvial (riverine) and coastal flood hazard. HAND is a good proxy but not a substitute for calibrated hydraulic models. DEM resolution critically affects delineation accuracy in flat urban terrain.`,
    riskStrat:
`**Uncertainty**
DEM vertical accuracy (SRTM +/-4 m in urban areas), culvert/bridge omissions in flow routing, and land-cover change since DEM capture all introduce uncertainty. Always report DEM source, resolution, and date.`,
    redFlags:
`Flow accumulation patterns that ignore known drainage infrastructure \u2192 DEM lacks culvert burn-in. Flood extent covering elevated areas \u2192 possible DEM artefact. Exposure counts that double-count multi-storey buildings \u2192 clarify building vs unit count.`,
    monitoring:
`**Reporting**
\u2022 Map: flood extent by return period with exposure symbols.
\u2022 Table: exposed population, buildings, and critical facilities per flood zone.
\u2022 DEM metadata: source, resolution, vertical accuracy, acquisition date.
\u2022 Validation against historical flood records or insurance claims.`,
    communication:
`Present flood maps with clear return-period labels. State that GIS-based delineation is indicative and does not replace certified flood insurance rate maps. Use hatching for uncertainty zones.`,
    followUp:
`Integrate with climate-change precipitation projections for future risk. Combine with damage curves for economic loss estimation. Update exposure layer as development permits are issued.`,
    docPhrases:
`"Flood hazard delineated using [HAND / 2-D model] with DEM from [source, resolution]. Exposure assessed for [population / buildings / infrastructure]. Return periods: [list]. Results support risk awareness; certified flood studies required for regulatory use."`,
    references:
`Nobre et al. (2011) HAND model; Bates et al. (2010) LISFLOOD-FP; FEMA flood mapping guidelines; Copernicus Emergency Management Service.`,
    tags: ["DEM", "HAND", "Flow Accumulation", "Flood Zone", "Exposure"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Hydrological Engineer, MSc"]
  },


  {
    id: "sovi",
    title: "Social Vulnerability Index (SoVI)",
    category: "SocialEquity",
    updated: "2025-01-15",
    abstract:
`Construction of a Social Vulnerability Index following the Cutter et al. (2003) SoVI framework. Uses principal component analysis (PCA) on census-derived socioeconomic indicators to produce a composite vulnerability score for hazard-planning applications.`,
    criteria:
`**Indicators (typical)**
\u2022 Demographic: age dependency ratio, disability prevalence, single-parent households, elderly living alone.
\u2022 Socioeconomic: median household income, poverty rate, unemployment, educational attainment, housing tenure (rent vs own), mobile homes.
\u2022 Access: vehicle availability, health insurance coverage, English-language proficiency.
\u2022 PCA: correlation matrix, Kaiser criterion (eigenvalue > 1), varimax rotation, component interpretation and sign adjustment (positive = more vulnerable).
\u2022 Data: ACS 5-year estimates (US) or equivalent national census.`,
    differential:
`Compare SoVI with CDC/ATSDR SVI (pre-built, theme-based approach). SoVI is data-driven (PCA) while SVI uses percentile ranking within fixed themes. Results can differ: PCA captures local variance structure whereas SVI is nationally normalized.`,
    riskStrat:
`**Limitations**
PCA component interpretation is subjective (sign assignment, labelling). Multicollinearity among indicators is expected and handled by PCA, but adding highly redundant variables inflates certain components. Temporal comparisons require caution \u2014 PCA axes may shift between census vintages.`,
    redFlags:
`First component explaining > 60% variance \u2192 data may be dominated by a single dimension (e.g., income). Negative vulnerability scores in known disadvantaged areas \u2192 check sign-adjustment step. Missing census tracts (suppressed data) \u2192 handle explicitly.`,
    monitoring:
`**Reporting**
\u2022 Table: selected indicators, PCA summary (eigenvalues, variance explained, loadings).
\u2022 Map: SoVI score by census tract with quintile classification.
\u2022 Sensitivity: compare results with and without controversial indicators.
\u2022 Cross-tabulate with hazard zones for risk-prioritisation matrix.`,
    communication:
`Present SoVI maps with quintile breaks and clear colour legend. Explain that vulnerability is relative within the study area. Acknowledge limitations of census-based proxies for lived experience.`,
    followUp:
`Overlay SoVI with hazard maps (flood, heat) for risk-priority targeting. Repeat with updated census data. Engage communities for participatory validation of vulnerability patterns.`,
    docPhrases:
`"SoVI constructed from [n] census indicators using PCA (varimax rotation). [n] components retained (Kaiser criterion), explaining [X]% variance. Scores mapped by census tract. Methodology follows Cutter et al. (2003). Results support planning prioritisation; not a welfare classification."`,
    references:
`Cutter et al. (2003) SoVI; Flanagan et al. (2011) CDC SVI; Cutter & Finch (2008) temporal SoVI; Spielman et al. (2020) SoVI critique.`,
    tags: ["SoVI", "PCA", "Census", "Equity", "Hazard Planning"],
    meta: {
      criteria:   { evidence: "B" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Hazard Geographer, PhD"]
  },


  {
    id: "lulc-classification",
    title: "Land Use / Land Cover Classification",
    category: "RemoteSensing",
    updated: "2025-01-15",
    abstract:
`Supervised classification of satellite imagery into land use / land cover (LULC) categories. Covers training-sample collection, classifier selection (Random Forest, SVM, neural network), accuracy assessment, and change-detection workflows for multi-temporal comparison.`,
    criteria:
`**Workflow**
\u2022 Imagery: Sentinel-2 multi-band (10\u201320 m) or Landsat (30 m); cloud-free composite.
\u2022 Classification scheme: CORINE, NLCD, or custom hierarchy (Level I\u2013III).
\u2022 Training data: stratified random samples, \u2265 50 per class; from field survey, VHR imagery, or existing maps.
\u2022 Features: spectral bands, indices (NDVI, NDBI, NDWI), texture (GLCM), temporal metrics.
\u2022 Classifier: Random Forest (scikit-learn, Google Earth Engine), SVM, or U-Net deep learning.
\u2022 Accuracy: confusion matrix, overall accuracy (OA), kappa, per-class F1-score; independent validation set.`,
    differential:
`Distinguish land cover (physical surface) from land use (socioeconomic function) \u2014 spectral classifiers detect cover, not use. Urban vs bare-soil confusion is common; add texture or SAR data. Shadow misclassification in dense urban cores \u2192 add DSM shadow model.`,
    riskStrat:
`**Quality factors**
Training-sample representativeness dominates accuracy. Spatial autocorrelation in train/test split inflates OA \u2014 use spatial blocking. Class imbalance (e.g., rare wetland) biases classifiers toward majority classes \u2014 use stratified sampling or class weights.`,
    redFlags:
`OA > 95% with few classes \u2192 may indicate train/test leakage or spatially non-independent split. Per-class F1 < 0.5 \u2192 class is unreliable; consider merging with similar class. Classified map showing salt-and-pepper noise \u2192 increase minimum mapping unit or apply majority filter.`,
    monitoring:
`**Reporting**
\u2022 Confusion matrix with producer's / user's accuracy per class.
\u2022 Map: LULC classified map with legend matching classification scheme.
\u2022 Feature importance plot (Random Forest) or band contribution.
\u2022 Change matrix if multi-temporal: from-to table between epochs.`,
    communication:
`Present LULC maps with clear colour legend tied to scheme. State classifier, OA, kappa, and training-data source. Clarify that classification reflects image-date conditions.`,
    followUp:
`Post-classification change detection between two or more epochs. Transition matrix and change maps for urbanisation monitoring. Validate with on-the-ground land-use surveys.`,
    docPhrases:
`"LULC classification performed on [imagery, date] using [classifier]. Training samples: [n] per class. OA = [X]%, kappa = [Y]. Accuracy assessed on spatially independent validation set. Results support monitoring-level assessment; field verification advised for regulatory use."`,
    references:
`Anderson et al. (1976) LULC classification system; Breiman (2001) Random Forests; Foody (2002) accuracy assessment; Pflugmacher et al. (2019) spatial cross-validation.`,
    tags: ["LULC", "Random Forest", "Accuracy", "Change Detection", "GEE"],
    meta: {
      criteria:   { evidence: "A" },
      monitoring: { evidence: "B" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Remote Sensing Scientist, PhD"]
  },


  {
    id: "gentrification-risk",
    title: "Gentrification Risk Mapping",
    category: "SocialEquity",
    updated: "2025-01-15",
    abstract:
`Identification of neighbourhoods at risk of gentrification-driven displacement using a composite indicator approach. Combines demographic change, housing-market signals, and built-environment investment data to flag areas where vulnerable residents face displacement pressure.`,
    criteria:
`**Indicators**
\u2022 Demographic change: in-migration of higher-income / higher-education residents; decline in minority population share; decrease in renter-occupied units.
\u2022 Housing market: median rent increase above metro average; home-value appreciation rate; condo conversion permits.
\u2022 Investment signals: new construction permits, transit infrastructure projects, rezoning activity, business-license growth in food/retail.
\u2022 Vulnerability baseline: proportion of low-income renters, rent-burdened households (> 30% income on rent), communities of colour, elderly on fixed income.
\u2022 Temporal: minimum two census periods (e.g., ACS 2010\u20132015 vs 2015\u20132020) for change detection.`,
    differential:
`Distinguish gentrification (neighbourhood upgrading with displacement) from revitalisation without displacement. Rent increases alone are insufficient \u2014 must be paired with demographic turnover evidence. New construction in vacant lots does not equal displacement of existing residents.`,
    riskStrat:
`**Uncertainty**
Census data granularity (tract-level) masks within-tract variation. Temporal lag: ACS 5-year estimates smooth rapid changes. Housing-market data availability varies by jurisdiction. Self-reported income data has known non-response bias.`,
    redFlags:
`Tracts flagged as gentrifying that are already high-income \u2192 eligibility filter for low-income baseline missing. Displacement indicator showing gains in vulnerability \u2192 likely data coding reversal. Very high risk scores adjacent to very low \u2192 check spatial join accuracy.`,
    monitoring:
`**Reporting**
\u2022 Map: gentrification risk typology (e.g., early, active, advanced, not susceptible) by census tract.
\u2022 Table: indicator values by tract; composite score components.
\u2022 Sensitivity: vary indicator weights and observe classification stability.
\u2022 Cross-reference with eviction data or moving-pattern data where available.`,
    communication:
`Present risk maps with caveat that gentrification is a contested concept. Explain indicator selection rationale. Emphasize that risk scores flag areas for further investigation, not definitive displacement counts.`,
    followUp:
`Engage community organisations for ground-truthing. Monitor with annual ACS updates. Connect with anti-displacement policy analysis (rent stabilisation, community land trusts, inclusionary zoning).`,
    docPhrases:
`"Gentrification risk assessed using [n] indicators across [census periods]. Vulnerability baseline: low-income renters > [X]%. Change metrics: rent increase, demographic shift, investment signals. Typology mapped by census tract. Results inform policy discussion; not causal displacement attribution."`,
    references:
`Zuk et al. (2018) gentrification typologies; Chapple & Loukaitou-Sideris (2019); Ding et al. (2016) housing displacement; Urban Displacement Project (UC Berkeley).`,
    tags: ["Gentrification", "Displacement", "Census", "Housing", "Equity"],
    meta: {
      criteria:   { evidence: "C" },
      monitoring: { evidence: "C" },
      docPhrases: { evidence: "D" },
    },
    version: "1.0",
    reviewedBy: ["Urban Equity Researcher, PhD"]
  },
];
