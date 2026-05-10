import type { Card } from '../lib/types';

/**
 * Thematic Deep-Dive seed cards.
 * Covers neighbourhood-scale analysis, metropolitan/regional methods,
 * and stakeholder engagement approaches.
 */
export function buildThematicDeepDiveCards(_existing?: Set<string>): Card[] {
  return [
    // ── Neighbourhood Scale ──────────────────────────────────
    {
      id: 'neigh-walkability-audit',
      title: 'Neighbourhood Walkability Audit',
      sectionId: 'neighborhood_analysis',
      summary:
        'Evaluate pedestrian environment quality at neighbourhood scale using composite walkability ' +
        'indices. Combines street connectivity, land-use mix, residential density, and sidewalk condition ' +
        'into a mappable score.',
      tags: ['pedestrian', 'mobility', 'accessibility', 'health', 'indicators'],
      methodology:
        '1. Delineate neighbourhood boundaries (census, planning, or buffered centroid).\n' +
        '2. Compute intersection density from street network.\n' +
        '3. Calculate land-use mix (entropy or MXI).\n' +
        '4. Measure net residential density.\n' +
        '5. Optionally add sidewalk width, shade, and safety ratings from audit.\n' +
        '6. Combine into Walk Score-style composite.\n' +
        '7. Map as continuous surface or block-level choropleth.',
      tools: ['OSMnx', 'geopandas', 'momepy', 'field audit apps'],
      datasets: [
        'OpenStreetMap street network and POI data',
        'Municipal land-use / zoning GIS layers',
        'Census population grid (100 m or block level)',
        'Sidewalk inventory or street-level imagery (Mapillary)',
      ],
      examples: [
        'Portland OR: Walk Score methodology applied to 12 000 neighbourhoods, correlated with 30% higher property values in top-score areas',
        'Melbourne: composite walkability index for 5 000 Statistical Areas linked to 20-min lower daily car use',
        'Bogotá: pedestrian environment audit of 1 500 street segments informing the ciclovía network expansion',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\nfrom scipy.stats import zscore\n\n# 1. Download street network & compute walkability components\nplace = "Barcelona, Spain"\nG = ox.graph_from_place(place, network_type="walk")\nnodes, edges = ox.graph_to_gdfs(G)\n\n# Intersection density per km\u00b2\nstats = ox.basic_stats(G, area=ox.geocode_to_gdf(place).to_crs(epsg=32631).area.iloc[0])\nprint(f"Intersection density: {stats['intersection_density_km']:.0f} per km\u00b2")\n\n# 2. Land-use mix (entropy) per grid cell\ngrid = gpd.read_file("analysis_grid_500m.gpkg")\npois = ox.features_from_place(place, tags={"amenity": True, "shop": True})\npois_gdf = gpd.GeoDataFrame(pois, geometry="geometry").to_crs(grid.crs)\n\nfor idx, cell in grid.iterrows():\n    cell_pois = pois_gdf[pois_gdf.within(cell.geometry)]\n    if len(cell_pois) > 0:\n        counts = cell_pois["amenity"].value_counts(normalize=True)\n        entropy = -np.sum(counts * np.log(counts + 1e-10))\n        grid.loc[idx, "lu_entropy"] = entropy\n    else:\n        grid.loc[idx, "lu_entropy"] = 0\n\n# 3. Composite walkability index (z-score normalisation)\ngrid["walkability"] = zscore(grid["lu_entropy"].fillna(0))\nprint(grid[["lu_entropy", "walkability"]].describe())\ngrid.to_file("walkability_index.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'Frank, L. D. et al. (2010). The development of a walkability index: application to the Neighborhood Quality of Life Study. Journal of Physical Activity and Health, 7(S1), S49–S58.',
        'Ewing, R. & Cervero, R. (2010). Travel and the Built Environment. Journal of the American Planning Association, 76(3), 265–294.',
      ],
      limitations:
        'Composite weights are subjective. Objective metrics miss perceptual factors (safety, aesthetics).',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
    },
    {
      id: 'neigh-15min-city',
      title: '15-Minute City Assessment',
      sectionId: 'neighborhood_analysis',
      summary:
        'Measure the proportion of residents who can reach key daily services (groceries, schools, ' +
        'healthcare, parks, transit) within a 15-minute walk or cycle. Identifies underserved areas ' +
        'for targeted intervention.',
      tags: ['accessibility', 'pedestrian', 'cycling', 'equity', 'indicators'],
      methodology:
        '1. Geolocate essential service points by category.\n' +
        '2. Generate 15-minute walk (1.2 km) and cycle (4 km) isochrones from each residential zone.\n' +
        '3. Count service types reachable per zone.\n' +
        '4. Classify: fully served (all services), partially served, underserved.\n' +
        '5. Overlay with demographic vulnerability data.\n' +
        '6. Map coverage as multi-layer accessibility dashboard.',
      tools: ['OSRM', 'Valhalla', 'OpenRouteService', 'geopandas'],
      datasets: [
        'OpenStreetMap POI data (amenity, healthcare, education, leisure)',
        'GTFS public transport schedules for transit isochrones',
        'Population grid at 100 m resolution (GHS-POP, census)',
        'Municipal service facility register (schools, clinics, parks)',
      ],
      examples: [
        'Paris: Carlos Moreno\'s 15-minute city framework drove removal of 60 000 parking spaces and creation of 52 km new bike lanes',
        'Melbourne: 20-minute neighbourhood assessment across 321 suburbs, identifying 38 priority areas for service investment',
        'Barcelona: superblock programme evaluated against chrono-urbanism, showing 25% improvement in daily service accessibility',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# 15-Minute City accessibility assessment\nplace = "Portland, Oregon, USA"\nservices = {\n    "grocery": {"shop": ["supermarket", "convenience"]},\n    "healthcare": {"amenity": ["hospital", "clinic", "pharmacy"]},\n    "education": {"amenity": ["school", "kindergarten"]},\n    "park": {"leisure": ["park", "garden"]},\n    "transit": {"highway": ["bus_stop"], "railway": ["station", "tram_stop"]},\n}\nG = ox.graph_from_place(place, network_type="walk")\n\nresults = []\nfor svc_name, tags in services.items():\n    pois = ox.features_from_place(place, tags=tags)\n    if len(pois) > 0:\n        pois_pts = pois.centroid\n        results.append({"service": svc_name, "count": len(pois_pts)})\n        print(f"{svc_name}: {len(pois_pts)} facilities found")\n\n# Walk isochrone (15 min = ~1200 m network distance)\ncenter = ox.geocode(place)\ncenter_node = ox.nearest_nodes(G, center[1], center[0])\nsubgraph = ox.truncate.truncate_by_edge(G, center_node, max_dist=1200)\nnodes_15min = ox.graph_to_gdfs(subgraph, edges=False)\nprint(f"15-min walk coverage: {len(nodes_15min)} network nodes")`,
      ],
      evidence: [
        'Moreno, C. et al. (2021). Introducing the "15-Minute City": Sustainability, Resilience and Place Identity. Smart Cities, 4(1), 93–111.',
        'Pozoukidou, G. & Chatziyiannaki, Z. (2021). 15-Minute City: Decomposition of the New Urban Planning Eutopia. Sustainability, 13(2), 928.',
      ],
      limitations:
        'Service quality is not captured by proximity alone. Isochrone models assume flat terrain ' +
        'and able-bodied walking speed.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
    },
    {
      id: 'neigh-crime-safety',
      title: 'Crime & Safety Spatial Analysis',
      sectionId: 'neighborhood_analysis',
      summary:
        'Analyse spatial patterns of crime incidents using kernel density estimation, space-time ' +
        'clustering, and environmental criminology principles (CPTED). Supports evidence-based ' +
        'safety interventions.',
      tags: ['crime', 'safety', 'spatial_stats', 'indicators'],
      methodology:
        '1. Geocode crime incidents by type and date.\n' +
        '2. Apply kernel density estimation for hotspot mapping.\n' +
        '3. Test for significant space-time clusters (Knox or Space-Time K).\n' +
        '4. Overlay with environmental factors: lighting, vacancy, land-use.\n' +
        '5. Analyse repeat victimisation patterns.\n' +
        '6. Recommend CPTED interventions for hotspot micro-locations.',
      tools: ['PySAL', 'CrimeStat', 'kepler.gl', 'geopandas'],
      datasets: [
        'Police-recorded crime incidents with geocoded locations',
        'OpenStreetMap building footprints and street lighting',
        'Municipal vacancy register or land-use survey',
        'Street-level imagery for CPTED environmental audit',
      ],
      examples: [
        'Chicago: predictive policing hotspot analysis across 77 community areas using 5 years of 300 000+ incident records',
        'Bogotá: CPTED-informed redesign of 12 high-crime public spaces reducing assault by 30% over 2 years',
        'Manchester UK: space-time analysis of 50 000 burglary events identifying repeat-victimisation corridors',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\nfrom sklearn.neighbors import KernelDensity\nimport matplotlib.pyplot as plt\n\n# Crime hotspot mapping with KDE\ncrimes = gpd.read_file("crime_incidents.gpkg")\ncrimes_proj = crimes.to_crs(epsg=32637)\ncoords = np.column_stack([crimes_proj.geometry.x, crimes_proj.geometry.y])\n\n# Fit KDE\nkde = KernelDensity(bandwidth=200, kernel="gaussian")\nkde.fit(coords)\n\n# Create prediction grid\nxmin, ymin, xmax, ymax = crimes_proj.total_bounds\nxx, yy = np.meshgrid(\n    np.linspace(xmin, xmax, 300),\n    np.linspace(ymin, ymax, 300)\n)\ngrid_coords = np.column_stack([xx.ravel(), yy.ravel()])\nlog_dens = kde.score_samples(grid_coords)\ndensity = np.exp(log_dens).reshape(xx.shape)\n\n# Plot hotspot map\nfig, ax = plt.subplots(figsize=(12, 10))\ncontour = ax.contourf(xx, yy, density, levels=20, cmap="YlOrRd")\ncrimes_proj.plot(ax=ax, markersize=1, color="black", alpha=0.3)\nplt.colorbar(contour, label="Incident density")\nax.set_title("Crime Hotspot Map (KDE, bandwidth=200m)")\nplt.savefig("crime_hotspot.png", dpi=150)\nprint(f"Peak density location: ({xx.ravel()[np.argmax(density)]:.0f}, {yy.ravel()[np.argmax(density)]:.0f})")`,
      ],
      evidence: [
        'Eck, J. E. et al. (2005). Mapping Crime: Understanding Hot Spots. NIJ Special Report.',
        'Cozens, P. M. et al. (2005). Crime Prevention Through Environmental Design (CPTED): A Review. Journal of Property Management, 23(5), 328–356.',
      ],
      limitations:
        'Crime data reflects reporting behaviour, not actual incidence. Under-reporting is higher ' +
        'in vulnerable communities.',
      sdgAlignment: ['SDG 11.7', 'SDG 16.1'],
    },
    {
      id: 'neigh-micro-climate',
      title: 'Street-Level Microclimate Analysis',
      sectionId: 'neighborhood_analysis',
      summary:
        'Assess thermal comfort at pedestrian level using sky view factor, shade coverage, surface ' +
        'albedo, and wind channelling. Identifies heat stress corridors for greening and shading interventions.',
      tags: ['climate', 'heat_island', 'health', 'green_infra', '3d_modeling'],
      methodology:
        '1. Compute sky view factor (SVF) from 3D building model.\n' +
        '2. Simulate shade coverage at peak summer hour.\n' +
        '3. Map surface albedo from satellite imagery.\n' +
        '4. Estimate wind speed reduction using building canyon ratios.\n' +
        '5. Combine into thermal comfort index (PET or UTCI).\n' +
        '6. Prioritise streets for tree planting or shade structures.',
      tools: ['SOLWEIG', 'ENVI-met', 'Three.js', 'rasterio'],
      datasets: [
        '3D city model (CityGML LoD2 or LiDAR-derived DSM/DTM)',
        'Landsat 8/9 or ECOSTRESS thermal imagery',
        'ERA5 reanalysis data for meteorological forcing',
        'Street tree inventory or canopy height model',
      ],
      examples: [
        'Singapore: ENVI-met simulation of 120 street canyons identifying optimal tree species for 2°C PET reduction',
        'Athens: SOLWEIG sky view factor mapping across historic centre guiding shade-sail installation in 15 public squares',
        'Phoenix AZ: cool-corridor programme using SVF + albedo analysis to prioritise 50 km of pedestrian shade routes',
      ],
      prompts: [
        `import numpy as np\nimport rasterio\nimport matplotlib.pyplot as plt\n\n# Sky View Factor computation from DSM\nwith rasterio.open("dsm_1m.tif") as src:\n    dsm = src.read(1)\n    transform = src.transform\n    res = src.res[0]\n\ndef compute_svf(dsm, row, col, max_dist=100, n_dirs=36):\n    """Compute sky view factor at a single point."""\n    elev_angles = []\n    for d in range(n_dirs):\n        angle = 2 * np.pi * d / n_dirs\n        max_elev = 0\n        for dist in range(1, int(max_dist / res)):\n            dr = int(round(dist * np.cos(angle)))\n            dc = int(round(dist * np.sin(angle)))\n            r, c = row + dr, col + dc\n            if 0 <= r < dsm.shape[0] and 0 <= c < dsm.shape[1]:\n                height_diff = dsm[r, c] - dsm[row, col]\n                elev = np.arctan2(height_diff, dist * res)\n                max_elev = max(max_elev, elev)\n        elev_angles.append(max_elev)\n    svf = 1 - np.mean(np.sin(np.array(elev_angles))**2)\n    return svf\n\n# Compute SVF for a sample grid\nsvf_map = np.full(dsm.shape, np.nan)\nstep = 10  # every 10th pixel for speed\nfor r in range(0, dsm.shape[0], step):\n    for c in range(0, dsm.shape[1], step):\n        svf_map[r, c] = compute_svf(dsm, r, c)\n\nplt.figure(figsize=(12, 10))\nplt.imshow(svf_map, cmap="RdYlBu", vmin=0, vmax=1)\nplt.colorbar(label="Sky View Factor")\nplt.title("Sky View Factor Map")\nplt.savefig("svf_map.png", dpi=150)\nprint(f"Mean SVF: {np.nanmean(svf_map):.2f}")`,
      ],
      evidence: [
        'Lindberg, F. et al. (2018). Urban Multi-scale Environmental Predictor (UMEP): An integrated tool for city-based climate services. Geoscientific Model Development, 11(10), 3713–3730.',
        'Oke, T. R. et al. (2017). Urban Climates. Cambridge University Press.',
      ],
      limitations:
        'Full microclimate simulation (ENVI-met) is computationally expensive. Simplified ' +
        'SVF approaches miss wind and humidity effects.',
      sdgAlignment: ['SDG 11.6', 'SDG 13.1'],
    },
    {
      id: 'neigh-age-friendly',
      title: 'Age-Friendly Neighbourhood Audit',
      sectionId: 'neighborhood_analysis',
      summary:
        'Evaluate how well neighbourhoods meet the needs of older adults using WHO Age-Friendly ' +
        'City domains: outdoor spaces, transport, housing, social participation, health services.',
      tags: ['accessibility', 'health', 'equity', 'pedestrian', 'housing'],
      methodology:
        '1. Select WHO Age-Friendly Neighbourhood indicators.\n' +
        '2. Collect spatial data: bench density, ramp availability, bus stop shelter, healthcare proximity.\n' +
        '3. Score each indicator per zone.\n' +
        '4. Compute composite age-friendliness index.\n' +
        '5. Cross-tabulate with elderly population density.\n' +
        '6. Map priority zones where high elderly density meets low scores.',
      tools: ['geopandas', 'field audit tools', 'isochrone services'],
      datasets: [
        'Census age-disaggregated population data',
        'OpenStreetMap data: benches, ramps, shelters, crossings',
        'Municipal healthcare and social service facility register',
        'GTFS public transport data for stop accessibility analysis',
      ],
      examples: [
        'Manchester UK Age-Friendly City: WHO pilot auditing 32 neighbourhoods, driving £8M investment in street improvements for elderly',
        'Taipei: age-friendly assessment of 456 neighbourhoods indexed against 12 WHO domains',
        'Akita, Japan: super-aged city audit (38% elderly) linking transit access within 300 m to health outcomes',
      ],
      prompts: [
        `import geopandas as gpd\nimport osmnx as ox\nimport pandas as pd\nimport numpy as np\n\n# Age-Friendly Neighbourhood scoring\nplace = "Vienna, Austria"\n\n# Fetch relevant amenities from OSM\nbenches = ox.features_from_place(place, tags={"amenity": "bench"})\npharmacy = ox.features_from_place(place, tags={"amenity": "pharmacy"})\nhealthcare = ox.features_from_place(place, tags={"amenity": ["hospital", "clinic", "doctors"]})\nbus_stops = ox.features_from_place(place, tags={"highway": "bus_stop"})\n\n# Load neighbourhood zones\nzones = gpd.read_file("neighbourhoods.gpkg").to_crs(epsg=32633)\n\ndef count_per_zone(features, zones):\n    features_proj = gpd.GeoDataFrame(features, geometry="geometry").to_crs(zones.crs)\n    joined = gpd.sjoin(features_proj, zones, how="inner", predicate="within")\n    return joined.groupby("index_right").size()\n\nzones["bench_count"] = count_per_zone(benches, zones).reindex(zones.index, fill_value=0)\nzones["pharmacy_count"] = count_per_zone(pharmacy, zones).reindex(zones.index, fill_value=0)\nzones["healthcare_count"] = count_per_zone(healthcare, zones).reindex(zones.index, fill_value=0)\nzones["bus_stop_count"] = count_per_zone(bus_stops, zones).reindex(zones.index, fill_value=0)\n\n# Normalise and compute composite score (equal weights)\nfor col in ["bench_count", "pharmacy_count", "healthcare_count", "bus_stop_count"]:\n    zones[f"{col}_norm"] = (zones[col] - zones[col].min()) / (zones[col].max() - zones[col].min() + 1e-10)\n\nnorm_cols = [c for c in zones.columns if c.endswith("_norm")]\nzones["age_friendly_score"] = zones[norm_cols].mean(axis=1)\nprint(zones[["age_friendly_score"]].describe())\nzones.to_file("age_friendly_scores.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'WHO (2007). Global Age-friendly Cities: A Guide. World Health Organization.',
        'Buffel, T., Phillipson, C. & Scharf, T. (2012). Ageing in urban environments: Developing age-friendly cities. Critical Social Policy, 32(4), 597–617.',
      ],
      limitations:
        'Many indicators require primary data collection. Perception-based indicators ' +
        'need household surveys.',
      sdgAlignment: ['SDG 3.8', 'SDG 11.2', 'SDG 11.7'],
    },

    // ── Metropolitan & Regional ──────────────────────────────
    {
      id: 'metro-functional-urban-area',
      title: 'Functional Urban Area Delineation',
      sectionId: 'regional_analysis',
      summary:
        'Define functional urban area (FUA) boundaries using commuting flow data, employment ' +
        'density, and connectivity thresholds. Follows OECD/EU methodology for consistent ' +
        'metropolitan comparison.',
      tags: ['indicators', 'mobility', 'economic', 'governance'],
      methodology:
        '1. Identify urban core municipalities by population density threshold (>1500 inh/km²).\n' +
        '2. Merge contiguous core municipalities.\n' +
        '3. Add surrounding municipalities with >15% commuting to core.\n' +
        '4. Iteratively add until no new municipality qualifies.\n' +
        '5. Validate against night-time light extent or built-up area.\n' +
        '6. Map FUA boundary vs. administrative boundary.',
      tools: ['geopandas', 'networkx', 'census flow data'],
      datasets: [
        'Census commuting origin-destination matrices',
        'GHSL urban centre boundaries (R2023A)',
        'OECD FUA boundary files for validation',
        'VIIRS night-time lights composite',
      ],
      examples: [
        'OECD: standardised FUA delineation for 1 197 cities across 34 countries enabling cross-national urban comparison',
        'EU-JRC GHSL Degree of Urbanisation: global classification grid at 1 km identifying 10 000+ urban centres',
        'US Census Bureau: Combined Statistical Areas delineation using 25% commuting threshold across 929 metro areas',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# Functional Urban Area delineation (OECD method)\n# Step 1: Identify urban core by density threshold\nmunicipalities = gpd.read_file("municipalities.gpkg")\nmunicipalities["density"] = municipalities["population"] / (municipalities.geometry.area / 1e6)\n\n# Core: density > 1500 inh/km\u00b2\ncores = municipalities[municipalities["density"] > 1500].copy()\ncore_ids = set(cores["mun_id"])\nprint(f"Core municipalities: {len(cores)}")\n\n# Step 2: Load commuting OD matrix\nod = pd.read_csv("commuting_od.csv")  # columns: origin, destination, commuters\n\n# Step 3: Iteratively add municipalities with >15% commuting to core\nhinterland = set()\nfor mun_id in municipalities["mun_id"]:\n    if mun_id in core_ids:\n        continue\n    flows = od[od["origin"] == mun_id]\n    total_commuters = flows["commuters"].sum()\n    if total_commuters == 0:\n        continue\n    core_flow = flows[flows["destination"].isin(core_ids)]["commuters"].sum()\n    share = core_flow / total_commuters\n    if share > 0.15:\n        hinterland.add(mun_id)\n\nfua_ids = core_ids | hinterland\nfua = municipalities[municipalities["mun_id"].isin(fua_ids)]\nprint(f"FUA municipalities: {len(fua)} (core: {len(cores)}, hinterland: {len(hinterland)})")\nprint(f"FUA population: {fua['population'].sum():,.0f}")\nfua.to_file("functional_urban_area.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'OECD (2012). Redefining "Urban": A New Way to Measure Metropolitan Areas. OECD Publishing.',
        'Dijkstra, L., Poelman, H. & Veneri, P. (2019). The EU-OECD definition of a functional urban area. OECD Regional Development Working Papers.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Commuting data may be outdated or unavailable. Night-light proxies overestimate FUA in arid regions.',
    },
    {
      id: 'metro-polycentricity',
      title: 'Polycentric Structure Analysis',
      sectionId: 'regional_analysis',
      summary:
        'Measure the degree of polycentricity in metropolitan regions by identifying employment centres, ' +
        'analysing commuting flows, and computing morphological and functional centrality metrics.',
      tags: ['economic', 'employment', 'density', 'indicators', 'network_analysis'],
      methodology:
        '1. Identify employment sub-centres using density peaks (cutoff method or local Moran).\n' +
        '2. Map centre hierarchy by total employment.\n' +
        '3. Compute functional polycentricity: flow-based centrality scores.\n' +
        '4. Compute morphological polycentricity: rank-size distribution of centres.\n' +
        '5. Combine into composite polycentricity index.\n' +
        '6. Compare with peer metropolitan regions.',
      tools: ['geopandas', 'PySAL', 'networkx', 'scipy'],
      datasets: [
        'Employment data by municipality or Traffic Analysis Zone',
        'Census commuting origin-destination flows',
        'Administrative boundary polygons (municipality level)',
        'Night-time lights or built-up area rasters for morphological analysis',
      ],
      examples: [
        'Randstad (Netherlands): morphological and functional polycentricity analysis of 4-city conurbation serving EU policy benchmarking',
        'Pearl River Delta: identification of 9 employment sub-centres using local Moran\'s I on 450 Traffic Analysis Zones',
        'Greater London: rank-size analysis of 34 metropolitan centres revealing increasing functional polycentricity 2001–2021',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\nfrom scipy.stats import rankdata\n\n# Polycentricity analysis\nzones = gpd.read_file("employment_zones.gpkg")\n\n# 1. Identify employment centres (top 10% density)\nzones["emp_density"] = zones["employment"] / (zones.geometry.area / 1e6)\nthreshold = zones["emp_density"].quantile(0.90)\ncentres = zones[zones["emp_density"] > threshold].copy()\nprint(f"Identified {len(centres)} employment centres (>{threshold:.0f} jobs/km\u00b2)")\n\n# 2. Morphological polycentricity (rank-size slope)\ncentres_sorted = centres.sort_values("employment", ascending=False)\nranks = np.arange(1, len(centres_sorted) + 1)\nlog_rank = np.log(ranks)\nlog_emp = np.log(centres_sorted["employment"].values)\nslope = np.polyfit(log_rank, log_emp, 1)[0]\nmorpho_poly = 1 - abs(slope)  # closer to 1 = more polycentric\nprint(f"Rank-size slope: {slope:.2f}")\nprint(f"Morphological polycentricity index: {morpho_poly:.2f}")\n\n# 3. Functional polycentricity (flow-based)\nod = pd.read_csv("commuting_od.csv")\ncentre_ids = set(centres["zone_id"])\ninter_centre_flows = od[\n    (od["origin"].isin(centre_ids)) & (od["destination"].isin(centre_ids))\n]\ntotal_flows = od["commuters"].sum()\nfunc_poly = inter_centre_flows["commuters"].sum() / total_flows\nprint(f"Functional polycentricity (inter-centre flow share): {func_poly:.3f}")`,
      ],
      evidence: [
        'Burger, M. & Meijers, E. (2012). Form follows function? Linking morphological and functional polycentricity. Urban Studies, 49(5), 1127–1149.',
        'Vasanen, A. (2012). Functional Polycentricity: Examining Metropolitan Spatial Structure through the Connectivity of Urban Sub-centres. Urban Studies, 49(16), 3627–3644.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Results are sensitive to definition of "centre" and flow data source.',
    },
    {
      id: 'metro-commuting-patterns',
      title: 'Commuting Flow Analysis',
      sectionId: 'regional_analysis',
      summary:
        'Analyse origin-destination commuting flows using flow maps, desire lines, and modal split ' +
        'statistics. Identifies major corridors, excess travel, and transit demand mismatches.',
      tags: ['mobility', 'transit', 'traffic', 'network_analysis', 'equity'],
      methodology:
        '1. Obtain OD matrix from census or mobile phone data.\n' +
        '2. Generate desire lines (straight) and route-assigned flows.\n' +
        '3. Map as flow arrows with width proportional to volume.\n' +
        '4. Compute average commute distance and time by zone.\n' +
        '5. Compare car vs. transit modal split per corridor.\n' +
        '6. Identify corridors where transit supply < commuting demand.',
      tools: ['geopandas', 'flowmap.gl', 'kepler.gl', 'OSRM'],
      datasets: [
        'Census journey-to-work origin-destination matrices',
        'Mobile phone CDR or GPS trace aggregated OD data',
        'GTFS transit schedules for modal split analysis',
        'Road network with speed attributes (OSM or national)',
      ],
      examples: [
        'São Paulo: OD survey of 31 million daily trips mapped as desire lines, revealing 45% public transit mode share',
        'London TfL: Oyster card analysis of 4 million daily commuting trips identifying 12 overloaded rail corridors',
        'Nairobi: mobile phone CDR-based OD matrix for 4 million users informing BRT route planning',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\nfrom shapely.geometry import LineString\n\n# Commuting flow visualisation as desire lines\nzones = gpd.read_file("zones.gpkg")\nod = pd.read_csv("commuting_od.csv")  # origin, destination, commuters, mode\n\n# Create centroid lookup\ncentroids = zones.set_index("zone_id").geometry.centroid\n\n# Build desire lines for top 200 flows\ntop_flows = od.nlargest(200, "commuters")\nlines = []\nfor _, row in top_flows.iterrows():\n    if row["origin"] in centroids.index and row["destination"] in centroids.index:\n        line = LineString([centroids[row["origin"]], centroids[row["destination"]]])\n        lines.append({"geometry": line, "flow": row["commuters"], "mode": row.get("mode", "all")})\n\nflow_gdf = gpd.GeoDataFrame(lines, crs=zones.crs)\n\n# Map\nfig, ax = plt.subplots(figsize=(14, 10))\nzones.boundary.plot(ax=ax, linewidth=0.3, color="gray")\nflow_gdf.plot(\n    ax=ax,\n    column="flow",\n    linewidth=flow_gdf["flow"] / flow_gdf["flow"].max() * 5,\n    cmap="YlOrRd",\n    legend=True,\n    alpha=0.6,\n)\nax.set_title(f"Top 200 Commuting Flows (max: {top_flows['commuters'].max():,})")\nplt.savefig("commuting_desire_lines.png", dpi=150)\n\n# Modal split summary\nmodal = od.groupby("mode")["commuters"].sum()\nprint("Modal split:")\nprint((modal / modal.sum() * 100).round(1))`,
      ],
      evidence: [
        'Rodrigue, J.-P. (2020). The Geography of Transport Systems, 5th ed. Routledge.',
        'Tobler, W. (1987). Experiments with Migration Mapping by Computer. The American Cartographer, 14(2), 155–163.',
      ],
      sdgAlignment: ['SDG 11.2', 'SDG 9.1'],
      limitations:
        'Census commuting data captures residence-workplace only, not trip chaining. ' +
        'Mobile phone data has sampling bias.',
    },
    {
      id: 'metro-urban-rural-gradient',
      title: 'Urban-Rural Gradient Analysis',
      sectionId: 'regional_analysis',
      summary:
        'Characterise the transition from urban core to rural hinterland along radial transects. ' +
        'Measures density, land-use composition, service access, and landscape metrics at ' +
        'increasing distances from the urban centre.',
      tags: ['sprawl', 'land_use', 'density', 'indicators', 'remote_sensing'],
      methodology:
        '1. Define urban centre point and concentric ring buffers (e.g., 2 km intervals).\n' +
        '2. Compute per-ring metrics: built-up %, population density, land-use entropy, NDVI.\n' +
        '3. Plot gradient curves for each metric.\n' +
        '4. Identify inflection points (urban fringe, peri-urban, rural).\n' +
        '5. Compare gradients across time periods for sprawl detection.\n' +
        '6. Map gradient zones as concentric classification.',
      tools: ['geopandas', 'GEE', 'rasterio', 'matplotlib'],
      datasets: [
        'GHSL built-up surface fraction (GHS-BUILT-S R2023A)',
        'GHS-POP population grid at 100 m or 1 km resolution',
        'Sentinel-2 NDVI composites for vegetation gradient',
        'CORINE Land Cover or national land-use dataset',
      ],
      examples: [
        'Beijing: 50-ring gradient analysis (2 km intervals) showing built-up fraction declining from 95% to 8% over 100 km',
        'Accra: radial transects revealing fragmented peri-urban zone between 15–30 km with unplanned settlement growth',
        'Vienna-Bratislava: cross-border gradient comparison showing divergent densification patterns at urban fringe',
      ],
      prompts: [
        `import geopandas as gpd\nimport rasterio\nimport rasterio.mask\nimport numpy as np\nimport matplotlib.pyplot as plt\nfrom shapely.geometry import Point\n\n# Urban-rural gradient analysis using concentric rings\ncenter = Point(32.85, 39.92)  # Ankara example\ncenter_gdf = gpd.GeoDataFrame(geometry=[center], crs="EPSG:4326").to_crs(epsg=32636)\ncenter_proj = center_gdf.geometry.iloc[0]\n\nring_width = 2000  # 2 km rings\nmax_dist = 50000  # 50 km\n\nresults = []\nwith rasterio.open("GHS_BUILT_S_100m.tif") as src:\n    for dist in range(ring_width, max_dist + 1, ring_width):\n        outer = center_proj.buffer(dist)\n        inner = center_proj.buffer(dist - ring_width)\n        ring = outer.difference(inner)\n        ring_gdf = gpd.GeoDataFrame(geometry=[ring], crs="EPSG:32636")\n        \n        try:\n            out_image, _ = rasterio.mask.mask(src, ring_gdf.geometry, crop=True)\n            valid = out_image[out_image > 0]\n            built_pct = (valid > 50).mean() * 100 if len(valid) > 0 else 0\n            mean_ndvi = np.nan  # placeholder for NDVI layer\n            results.append({"dist_km": dist / 1000, "built_pct": built_pct})\n        except Exception:\n            continue\n\nimport pandas as pd\ndf = pd.DataFrame(results)\nfig, ax = plt.subplots(figsize=(12, 5))\nax.plot(df["dist_km"], df["built_pct"], "o-", color="#F59E0B")\nax.set_xlabel("Distance from centre (km)")\nax.set_ylabel("Built-up fraction (%)")\nax.set_title("Urban-Rural Gradient: Built-up Surface")\nax.axhline(50, color="red", linestyle="--", label="Urban fringe threshold")\nax.legend()\nplt.savefig("urban_rural_gradient.png", dpi=150)`,
      ],
      evidence: [
        'Schneider, A. & Woodcock, C. E. (2008). Compact, dispersed, fragmented, extensive? A comparison of urban growth patterns. Urban Studies, 45(3), 659–692.',
        'Angel, S. et al. (2011). Making Room for a Planet of Cities. Lincoln Institute of Land Policy.',
      ],
      limitations:
        'Radial transects assume monocentric structure. Polycentric cities need multi-directional transects.',
      sdgAlignment: ['SDG 11.3'],
    },
    {
      id: 'metro-regional-connectivity',
      title: 'Regional Connectivity & Accessibility',
      sectionId: 'regional_analysis',
      summary:
        'Evaluate inter-city connectivity via road, rail, and air transport networks. Computes ' +
        'accessibility indices showing how well each settlement is connected to regional ' +
        'economic opportunities.',
      tags: ['mobility', 'transit', 'network_analysis', 'economic', 'equity'],
      methodology:
        '1. Build multi-modal transport network graph.\n' +
        '2. Compute travel time matrices between all settlements.\n' +
        '3. Calculate accessibility index (gravity or cumulative-opportunities model).\n' +
        '4. Weight by population or employment at destinations.\n' +
        '5. Map accessibility surface.\n' +
        '6. Identify under-connected settlements for infrastructure investment.',
      tools: ['OSRM', 'GTFS', 'networkx', 'geopandas'],
      datasets: [
        'OpenStreetMap road network with speed attributes',
        'GTFS transit feeds for rail, bus, and ferry',
        'Airport and port location data with flight/shipping frequencies',
        'Settlement population centroids for gravity model',
      ],
      examples: [
        'EU ESPON TRACC: accessibility analysis across 1 500 European regions revealing 3-hour travel time disparities',
        'World Bank Rural Access Index: road connectivity assessment for 170 countries measuring population within 2 km of all-weather road',
        'Japan: Shinkansen accessibility mapping showing 80% of 127M population within 1-hour of a high-speed rail station',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\nimport networkx as nx\nimport matplotlib.pyplot as plt\n\n# Gravity-based regional accessibility index\nsettlements = gpd.read_file("settlements.gpkg")  # fields: name, population, geometry\ntt_matrix = pd.read_csv("travel_time_matrix.csv")  # origin, destination, minutes\n\n# Build complete travel time lookup\ntt_lookup = {}\nfor _, row in tt_matrix.iterrows():\n    tt_lookup[(row["origin"], row["destination"])] = row["minutes"]\n\n# Compute gravity-based accessibility for each settlement\nbeta = 0.02  # distance decay parameter\nresults = []\nfor _, origin in settlements.iterrows():\n    accessibility = 0\n    for _, dest in settlements.iterrows():\n        if origin["name"] == dest["name"]:\n            continue\n        tt = tt_lookup.get((origin["name"], dest["name"]), 999)\n        accessibility += dest["population"] * np.exp(-beta * tt)\n    results.append({"name": origin["name"], "accessibility": accessibility, "population": origin["population"]})\n\nacc_df = pd.DataFrame(results)\nacc_df["acc_normalised"] = acc_df["accessibility"] / acc_df["accessibility"].max()\n\n# Merge back to spatial data\nsettlements = settlements.merge(acc_df[["name", "acc_normalised"]], on="name")\n\nfig, ax = plt.subplots(figsize=(12, 10))\nsettlements.plot(\n    column="acc_normalised", cmap="RdYlGn", legend=True,\n    markersize=settlements["population"] / 1000, ax=ax, alpha=0.7\n)\nax.set_title("Regional Accessibility Index (gravity model)")\nplt.savefig("regional_accessibility.png", dpi=150)\nprint(acc_df.nlargest(10, "acc_normalised")[["name", "acc_normalised"]])`,
      ],
      evidence: [
        'Levinson, D. & Wu, H. (2020). Towards a general theory of access. Journal of Transport and Land Use, 13(1), 129–158.',
        'Spiekermann, K. & Wegener, M. (2007). Update of Selected Potential Accessibility Indicators. ESPON project 1.2.1.',
      ],
      limitations:
        'Quality of accessibility indices depends on network completeness and cost calibration.',
      sdgAlignment: ['SDG 9.1', 'SDG 11.2'],
    },

    // ── Participation & Engagement ───────────────────────────
    {
      id: 'engage-participatory-mapping',
      title: 'Participatory GIS / Community Mapping',
      sectionId: 'stakeholder_engagement',
      summary:
        'Facilitate community-driven mapping of local assets, barriers, and priorities using ' +
        'paper maps, mobile apps, or web-based participatory GIS. Captures spatial knowledge ' +
        'that is invisible in official datasets.',
      tags: ['participation', 'equity', 'governance'],
      methodology:
        '1. Prepare base map at appropriate scale with familiar landmarks.\n' +
        '2. Conduct mapping session with community group.\n' +
        '3. Participants mark assets (safe spaces, markets, water points) and barriers (hazards, waste dumps).\n' +
        '4. Digitise results into GeoJSON.\n' +
        '5. Validate and categorise entries.\n' +
        '6. Merge with institutional spatial data.\n' +
        '7. Present back to community for feedback.',
      tools: ['Mapeo', 'KoboToolbox', 'OpenStreetMap', 'uMap'],
      datasets: [
        'OpenStreetMap base maps at community scale',
        'Mapillary street-level imagery for reference',
        'KoBoToolbox survey forms for structured data capture',
        'Municipal cadastral or utility maps as base layers',
      ],
      examples: [
        'Slum Dwellers International "Know Your City": community mapping in 400+ informal settlements across 33 countries',
        'Map Kibera: first open-source community map of Nairobi’s largest informal settlement, used by 80+ NGOs',
        'Missing Maps / HOT: volunteer mapping generating building footprints for 60+ humanitarian response areas',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport folium\n\n# Participatory mapping data integration and visualisation\ncommunity = gpd.read_file("community_mapping.geojson")  # fields: type, description, priority, geometry\nofficial = gpd.read_file("official_infrastructure.gpkg")\n\n# Categorise community-mapped features\ncategories = community.groupby("type").size().sort_values(ascending=False)\nprint("Community-mapped feature types:")\nprint(categories)\n\n# Identify gaps: community-reported assets not in official data\ncommunity_assets = community[community["type"].isin(["water_point", "market", "health_post"])]\n# Buffer join: features within 50m considered matching\nofficial_buffered = official.copy()\nofficial_buffered.geometry = official.geometry.buffer(50)\nmatched = gpd.sjoin(community_assets, official_buffered, how="left", predicate="within")\ngaps = matched[matched.index_right.isna()]\nprint(f"\\nCommunity assets NOT in official data: {len(gaps)} of {len(community_assets)}")\n\n# Interactive map\nm = folium.Map(location=[community.geometry.centroid.y.mean(), community.geometry.centroid.x.mean()], zoom_start=15)\nfor _, row in gaps.iterrows():\n    folium.CircleMarker(\n        location=[row.geometry.y, row.geometry.x],\n        radius=6, color="red", fill=True,\n        tooltip=f"{row['type']}: {row['description']}"\n    ).add_to(m)\nm.save("community_gaps_map.html")\nprint("Interactive map saved to community_gaps_map.html")`,
      ],
      evidence: [
        'Corbett, J. et al. (2006). Overview: Mapping for Change — The Emergence of a New Practice. Participatory Learning and Action, 54, 13–19.',
        'Chambers, R. (2006). Participatory Mapping and Geographic Information Systems: Whose Map? Who Is Empowered and Disempowered? Electronic Journal of Information Systems in Developing Countries, 25(1), 1–11.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Participation bias: vocal community members may dominate. Digital divides exclude some groups.',
    },
    {
      id: 'engage-design-charrette',
      title: 'Design Charrette & Co-design',
      sectionId: 'stakeholder_engagement',
      summary:
        'Organise intensive, time-limited design workshops (charrettes) that bring together ' +
        'residents, planners, and designers to co-create urban design proposals for a specific site.',
      tags: ['participation', 'placemaking', 'governance'],
      methodology:
        '1. Define site and design challenge.\n' +
        '2. Prepare base materials: site model, constraint maps, precedent images.\n' +
        '3. Form cross-disciplinary teams (6–8 people each).\n' +
        '4. Teams produce design proposals over 1–3 days.\n' +
        '5. Present and critique in plenary.\n' +
        '6. Synthesise common themes into preferred scenario.\n' +
        '7. Document outcomes as annotated site plans.',
      tools: ['SketchUp', 'Miro', 'physical models', 'markers + trace paper'],
      datasets: [
        'Site base map at 1:1000 or 1:2000 scale',
        'Planning constraint maps (zoning, heritage, flood zone)',
        'Precedent image library from comparable projects',
        'Demographic and traffic survey data for the site',
      ],
      examples: [
        'Vancouver CityPlan: 100+ neighbourhood charrettes engaging 20 000 residents in land-use planning over 2 years',
        'Chattanooga Waterfront: 3-day design charrette producing the Tennessee Riverpark master plan now 70% implemented',
        'Medellín PUI (Proyecto Urbano Integral): multi-day co-design workshops in 12 informal hillside settlements',
      ],
      prompts: [
        `# Charrette output documentation template\nimport json\nfrom datetime import datetime\n\ncharrette_output = {\n    "event": {\n        "title": "Community Design Charrette: Station Area Redevelopment",\n        "date": "2024-03-15 to 2024-03-17",\n        "location": "Community Centre, District 7",\n        "participants": 48,\n        "teams": 6,\n    },\n    "site_constraints": [\n        "Heritage building on NE corner (protected)",\n        "20m rail setback required",\n        "Flood zone C along southern edge",\n    ],\n    "design_proposals": [\n        {\n            "team": "Team A",\n            "concept": "Green spine: linear park connecting station to river",\n            "key_features": ["500m pedestrian promenade", "3 pocket parks", "150 mixed-use units"],\n            "community_votes": 12,\n        },\n        {\n            "team": "Team B",\n            "concept": "Market square: activated ground floors around central plaza",\n            "key_features": ["2000 m\u00b2 public square", "farmers market", "200 residential units"],\n            "community_votes": 18,\n        },\n    ],\n    "common_themes": [\n        "Prioritise pedestrian access to station",\n        "Preserve heritage building as community hub",\n        "Include affordable housing (min 30%)",\n        "Ground-floor retail activation",\n    ],\n    "next_steps": [\n        "Synthesise preferred scenario by 2024-04-01",\n        "Present to planning committee 2024-04-15",\n        "Public exhibition 2024-05-01 to 2024-05-15",\n    ],\n}\n\nwith open("charrette_output.json", "w") as f:\n    json.dump(charrette_output, f, indent=2)\nprint(f"Charrette documented: {len(charrette_output['design_proposals'])} proposals, "\n      f"{len(charrette_output['common_themes'])} common themes")`,
      ],
      evidence: [
        'Lennertz, B. & Lutzenhiser, A. (2006). The Charrette Handbook: The Essential Guide for Accelerated Collaborative Community Planning. APA Planners Press.',
        'Sanoff, H. (2000). Community Participation Methods in Design and Planning. Wiley.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Charrettes are resource-intensive. Results reflect the perspectives present; absent voices remain unheard.',
    },
    {
      id: 'engage-survey-spatial',
      title: 'Geo-Referenced Survey Design',
      sectionId: 'stakeholder_engagement',
      summary:
        'Design and deploy spatially referenced household or user surveys with GPS-tagged ' +
        'responses. Enables spatial analysis of perceptions, needs, and satisfaction alongside ' +
        'objective spatial indicators.',
      tags: ['participation', 'equity', 'indicators', 'governance'],
      methodology:
        '1. Design questionnaire with spatial questions (home location, daily routes, perceived safety zones).\n' +
        '2. Deploy on mobile platform with GPS capture.\n' +
        '3. Apply sampling strategy (random, systematic, or cluster).\n' +
        '4. Clean and geocode responses.\n' +
        '5. Analyse spatial distribution of responses.\n' +
        '6. Perform hot-spot analysis of satisfaction or need indicators.\n' +
        '7. Present results as interactive maps.',
      tools: ['KoboToolbox', 'ODK', 'Survey123', 'geopandas'],
      datasets: [
        'KoBoToolbox / ODK XLSForm survey templates',
        'Census enumeration area boundaries for sampling frame',
        'Administrative boundary polygons for spatial aggregation',
        'OpenStreetMap building footprints for household sampling',
      ],
      examples: [
        'UN-Habitat City Prosperity Initiative: geo-referenced survey in 400+ cities covering 72 indicators',
        'Dar es Salaam: Ramani Huria community survey of 3 500 households with GPS-tagged flood risk perceptions',
        'Cape Town: quality-of-life survey across 116 wards with spatial hot-spot analysis of satisfaction indicators',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\nfrom esda.moran import Moran\nimport libpysal as lps\n\n# Spatial survey analysis pipeline\nsurvey = gpd.read_file("household_survey.gpkg")\n# fields: satisfaction (1-5), safety_perception (1-5), service_quality (1-5), geometry\n\nprint(f"Survey responses: {len(survey)}")\nprint(survey[["satisfaction", "safety_perception", "service_quality"]].describe())\n\n# Aggregate to neighbourhood zones\nzones = gpd.read_file("neighbourhoods.gpkg")\njoined = gpd.sjoin(survey, zones, how="inner", predicate="within")\nzonal = joined.groupby("index_right").agg({\n    "satisfaction": "mean",\n    "safety_perception": "mean",\n    "service_quality": "mean",\n    "geometry": "count",\n}).rename(columns={"geometry": "n_responses"})\n\nzones = zones.join(zonal)\n\n# Spatial autocorrelation test (Moran's I)\nw = lps.weights.Queen.from_dataframe(zones)\nw.transform = "r"\nmoran = Moran(zones["satisfaction"].fillna(0), w)\nprint(f"\\nMoran's I (satisfaction): {moran.I:.3f}, p-value: {moran.p_sim:.4f}")\n\n# Map\nfig, axes = plt.subplots(1, 3, figsize=(18, 6))\nfor ax, col, title in zip(axes, ["satisfaction", "safety_perception", "service_quality"],\n                                 ["Life Satisfaction", "Safety Perception", "Service Quality"]):\n    zones.plot(column=col, cmap="RdYlGn", legend=True, ax=ax, missing_kwds={"color": "lightgrey"})\n    ax.set_title(title)\n    ax.axis("off")\nplt.tight_layout()\nplt.savefig("survey_spatial_analysis.png", dpi=150)`,
      ],
      evidence: [
        'Groves, R. M. et al. (2009). Survey Methodology, 2nd ed. Wiley.',
        'Anselin, L. (1995). Local Indicators of Spatial Association—LISA. Geographical Analysis, 27(2), 93–115.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Response rates vary by neighbourhood. GPS accuracy in dense urban areas can be ±10–20 m.',
    },
    {
      id: 'engage-digital-twin-engagement',
      title: '3D Visualisation for Public Engagement',
      sectionId: 'stakeholder_engagement',
      summary:
        'Use interactive 3D city models and digital twins as engagement tools for communicating ' +
        'proposed developments, infrastructure projects, or planning scenarios to the public.',
      tags: ['participation', '3d_modeling', 'voxcity', 'placemaking'],
      methodology:
        '1. Build 3D model of existing context.\n' +
        '2. Add proposed intervention as 3D objects.\n' +
        '3. Deploy as web-based interactive viewer.\n' +
        '4. Allow public to navigate, comment, and pin feedback on 3D model.\n' +
        '5. Collect sentiment and spatial preferences.\n' +
        '6. Summarise engagement feedback with heatmaps.',
      tools: ['Three.js', 'CesiumJS', 'Mapbox', 'engagement platforms'],
      datasets: [
        '3D city model (CityGML LoD2, CityJSON, or mesh)',
        'Proposed development 3D models (IFC, OBJ, glTF)',
        'Terrain DEM and orthophoto for context',
        'Public feedback database (comments, pins, sentiment)',
      ],
      examples: [
        'Helsinki 3D+ project: CesiumJS-based digital twin for 10+ public engagement consultations on harbour development',
        'Singapore Virtual Singapore: national digital twin used in 3 major public infrastructure consultations',
        'Zurich: CityGML-based web viewer for Stadtraum engagement receiving 12 000 citizen comments on building proposals',
      ],
      prompts: [
        `# CesiumJS engagement viewer setup (HTML template generation)\nimport json\n\ndef generate_3d_engagement_viewer(\n    tileset_url: str,\n    proposal_url: str,\n    center_lon: float,\n    center_lat: float,\n    title: str = "Public Engagement 3D Viewer",\n) -> str:\n    """Generate an HTML file for 3D public engagement."""\n    html = f"""<!DOCTYPE html>\n<html>\n<head>\n  <title>{title}</title>\n  <script src="https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Cesium.js"></script>\n  <link href="https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Widgets/widgets.css" rel="stylesheet">\n  <style>\n    #cesiumContainer {{ width: 100%; height: 80vh; }}\n    #feedback {{ padding: 20px; }}\n  </style>\n</head>\n<body>\n  <h1>{title}</h1>\n  <div id="cesiumContainer"></div>\n  <div id="feedback">\n    <h3>Share Your Feedback</h3>\n    <p>Click on the model to pin a comment.</p>\n    <textarea id="comment" rows="3" cols="50" placeholder="Your feedback..."></textarea>\n    <br><button onclick="submitFeedback()">Submit</button>\n  </div>\n  <script>\n    const viewer = new Cesium.Viewer('cesiumContainer');\n    // Load existing city model\n    const tileset = viewer.scene.primitives.add(\n      new Cesium.Cesium3DTileset({{ url: '{tileset_url}' }})\n    );\n    // Fly to site\n    viewer.camera.flyTo({{\n      destination: Cesium.Cartesian3.fromDegrees({center_lon}, {center_lat}, 500),\n    }});\n  </script>\n</body>\n</html>"""\n    return html\n\nviewer_html = generate_3d_engagement_viewer(\n    tileset_url="./tileset/tileset.json",\n    proposal_url="./proposal/model.glb",\n    center_lon=24.94,\n    center_lat=60.17,\n    title="Harbour Development Consultation"\n)\nwith open("engagement_viewer.html", "w") as f:\n    f.write(viewer_html)\nprint("3D engagement viewer generated: engagement_viewer.html")`,
      ],
      evidence: [
        'Batty, M. (2018). Digital twins. Environment and Planning B, 45(5), 817–820.',
        'Dembski, F. et al. (2020). Urban Digital Twins for Smart Cities and Citizens. Sustainability, 12(6), 2460.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Not all community members are comfortable navigating 3D environments. ' +
        'Bandwidth requirements may exclude some users.',
    },
    {
      id: 'engage-deliberative-polling',
      title: 'Deliberative Polling & Mini-Publics',
      sectionId: 'stakeholder_engagement',
      summary:
        'Conduct deliberative polling processes where randomly selected citizens are informed ' +
        'about urban issues and propose priorities after structured discussion. Produces ' +
        'representative community preferences for planning input.',
      tags: ['participation', 'governance', 'policy', 'equity'],
      methodology:
        '1. Draw stratified random sample of residents.\n' +
        '2. Administer baseline survey (attitudes, priorities).\n' +
        '3. Provide balanced briefing materials.\n' +
        '4. Facilitate small-group deliberation (1–2 days).\n' +
        '5. Administer post-deliberation survey.\n' +
        '6. Analyse opinion shifts and emerging consensus.\n' +
        '7. Report findings to planning authority.',
      tools: ['survey platforms', 'facilitation tools', 'statistical analysis'],
      datasets: [
        'Voter registry or census for stratified random sampling',
        'Pre/post-deliberation survey instruments',
        'Balanced briefing materials on urban planning issues',
        'Facilitator observation and session transcripts',
      ],
      examples: [
        'Fishkin Stanford: deliberative poll in Ulaanbaatar with 1 500 randomly selected citizens on city budget priorities',
        'Melbourne People’s Panel: 43-member mini-public producing 10-year financial plan recommendations adopted by city council',
        'Ireland Citizens\' Assembly: 99 randomly selected citizens deliberating on urban planning and housing policy',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nfrom scipy import stats\n\n# Deliberative polling: pre vs. post opinion shift analysis\npre = pd.DataFrame({\n    "respondent_id": range(1, 101),\n    "priority_green_space": np.random.normal(3.2, 0.8, 100),\n    "priority_affordable_housing": np.random.normal(3.8, 0.7, 100),\n    "priority_public_transit": np.random.normal(3.5, 0.9, 100),\n    "priority_cycling_infra": np.random.normal(2.9, 1.0, 100),\n})\n\n# Simulate post-deliberation shifts\npost = pre.copy()\npost["priority_green_space"] += np.random.normal(0.4, 0.3, 100)  # shifted up\npost["priority_cycling_infra"] += np.random.normal(0.6, 0.4, 100)  # larger shift\n\n# Paired t-tests for opinion shift\nprint("Deliberative Polling: Pre vs. Post Opinion Shifts")\nprint("=" * 60)\npriorities = [c for c in pre.columns if c.startswith("priority_")]\nresults = []\nfor col in priorities:\n    t_stat, p_val = stats.ttest_rel(pre[col], post[col])\n    shift = post[col].mean() - pre[col].mean()\n    results.append({"issue": col.replace("priority_", ""), "pre_mean": pre[col].mean(),\n                    "post_mean": post[col].mean(), "shift": shift, "p_value": p_val})\n    sig = "***" if p_val < 0.001 else "**" if p_val < 0.01 else "*" if p_val < 0.05 else "ns"\n    print(f"{col.replace('priority_', ''):25s} shift: {shift:+.2f}  p={p_val:.4f} {sig}")\n\n# Visualise shifts\nres_df = pd.DataFrame(results)\nfig, ax = plt.subplots(figsize=(10, 6))\nax.barh(res_df["issue"], res_df["shift"], color=["#48BB78" if s > 0 else "#E53E3E" for s in res_df["shift"]])\nax.axvline(0, color="gray", linewidth=0.5)\nax.set_xlabel("Opinion Shift (post - pre)")\nax.set_title("Deliberative Poll: Opinion Shifts After Deliberation")\nplt.tight_layout()\nplt.savefig("deliberative_poll_shifts.png", dpi=150)`,
      ],
      evidence: [
        'Fishkin, J. S. (2018). Democracy When the People Are Thinking: Revitalizing Our Politics Through Public Deliberation. Oxford University Press.',
        'Curato, N. et al. (2021). Deliberative Mini-Publics: Core Design Features. Bristol University Press.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Resource-intensive for large populations. Mini-public recommendations are advisory, not binding.',
    },
  ];
}
