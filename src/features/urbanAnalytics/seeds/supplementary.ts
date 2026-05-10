import type { Card } from '../lib/types';

/**
 * Supplementary seed cards for thin sections.
 * Bolsters baseline_assessment and rapid_assessment with additional cards.
 */
export function buildSupplementaryCards(_existing?: Set<string>): Card[] {
  return [
    // ── Baseline Assessment ──────────────────────────────────
    {
      id: 'base-demographic-profile',
      title: 'Demographic Profile & Projections',
      sectionId: 'baseline_assessment',
      summary:
        'Compile a spatially disaggregated demographic profile: population density, age structure, ' +
        'household composition, migration flows, and growth projections. Forms the foundation for ' +
        'demand analysis of housing, services, and infrastructure.',
      tags: ['indicators', 'equity', 'housing', 'governance'],
      methodology:
        '1. Obtain census data at finest available spatial unit.\n' +
        '2. Map population density and age pyramids by zone.\n' +
        '3. Calculate dependency ratio and median age.\n' +
        '4. Model projections using cohort-component or trend extrapolation.\n' +
        '5. Disaggregate projections spatially based on development capacity.\n' +
        '6. Produce summary dashboard with maps and charts.',
      tools: ['geopandas', 'pandas', 'census APIs', 'chart libraries'],
      datasets: [
        'National census microdata or summary tables at smallest geography',
        'WorldPop gridded population estimates (100 m)',
        'UN WPP medium-variant national population projections',
        'Administrative boundary polygons for spatial disaggregation',
      ],
      examples: [
        'Greater London Authority: ward-level population projections to 2050 using housing-led model for 4 700 zones',
        'US Census Bureau ACS: annual demographic estimates for 73 000+ census tracts with 5-year rolling average',
        'Rwanda NISR: gridded population model at 100 m for 30 districts using census + building footprint data',
      ],
      prompts: [
        `import pandas as pd\nimport geopandas as gpd\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Demographic profile and cohort projection\ncensus = gpd.read_file("census_zones.gpkg")\n# fields: zone_id, pop_total, pop_0_14, pop_15_64, pop_65plus, households, area_km2\n\n# Density and ratios\ncensus["density"] = census["pop_total"] / census["area_km2"]\ncensus["dependency_ratio"] = (census["pop_0_14"] + census["pop_65plus"]) / census["pop_15_64"] * 100\ncensus["ageing_index"] = census["pop_65plus"] / census["pop_0_14"] * 100\ncensus["avg_hh_size"] = census["pop_total"] / census["households"]\n\nprint("Demographic Summary:")\nprint(f"Total population: {census['pop_total'].sum():,.0f}")\nprint(f"Mean density: {census['density'].mean():.0f} per km\u00b2")\nprint(f"Mean dependency ratio: {census['dependency_ratio'].mean():.1f}%")\nprint(f"Mean ageing index: {census['ageing_index'].mean():.1f}")\n\n# Simple projection (geometric growth)\ngrowth_rate = 0.012  # 1.2% per year\nyears_ahead = [5, 10, 20]\nfor y in years_ahead:\n    projected = census["pop_total"].sum() * (1 + growth_rate) ** y\n    print(f"Projected population in {y} years: {projected:,.0f}")\n\n# Map density\nfig, axes = plt.subplots(1, 2, figsize=(16, 6))\ncensus.plot(column="density", cmap="YlOrRd", legend=True, ax=axes[0])\naxes[0].set_title("Population Density (per km\u00b2)")\ncensus.plot(column="dependency_ratio", cmap="RdYlGn_r", legend=True, ax=axes[1])\naxes[1].set_title("Dependency Ratio (%)")\nfor ax in axes:\n    ax.axis("off")\nplt.tight_layout()\nplt.savefig("demographic_profile.png", dpi=150)`,
      ],
      evidence: [
        'Rees, P. et al. (2012). European Regional Populations: Current Trends, Future Pathways, and Policy Options. Springer.',
        'Tatem, A. J. (2017). WorldPop, open data for spatial demography. Scientific Data, 4, 170004.',
      ],
      limitations:
        'Census data ages quickly. Small-area projections carry high uncertainty.',
      sdgAlignment: ['SDG 11.1'],
    },
    {
      id: 'base-land-use-inventory',
      title: 'Current Land-Use Inventory',
      sectionId: 'baseline_assessment',
      summary:
        'Produce a comprehensive existing land-use map from zoning records, satellite classification, ' +
        'and field validation. Categorises all parcels by use (residential, commercial, industrial, ' +
        'institutional, green, vacant, transport).',
      tags: ['land_use', 'indicators', 'remote_sensing'],
      methodology:
        '1. Obtain parcels layer with existing use attributes.\n' +
        '2. Fill gaps using satellite land-cover classification.\n' +
        '3. Cross-check with OSM building-use tags.\n' +
        '4. Conduct field validation for ambiguous parcels.\n' +
        '5. Compute area statistics per use class.\n' +
        '6. Map as parcel-level choropleth.',
      tools: ['geopandas', 'QGIS', 'Sentinel-2', 'OSM'],
      datasets: [
        'Municipal parcel cadastre with existing use attributes',
        'Sentinel-2 multispectral imagery for land-cover classification',
        'OpenStreetMap building and land-use tags',
        'CORINE Land Cover or national equivalent dataset',
      ],
      examples: [
        'EU Urban Atlas: 17-class land-use map at 2.5 m resolution for 800+ European cities',
        'Singapore Master Plan: parcel-level zoning and use inventory for entire 730 km\u00b2 city-state updated every 5 years',
        'Nairobi: hybrid OSM + Sentinel-2 land-use classification for 700 km\u00b2 metro area achieving 87% accuracy',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Land-use inventory analysis\nparcels = gpd.read_file("parcels.gpkg")  # fields: parcel_id, use_class, area_m2\n\n# Area statistics by use class\nlu_stats = parcels.groupby("use_class").agg(\n    count=("parcel_id", "count"),\n    area_ha=("area_m2", lambda x: x.sum() / 10000)\n).sort_values("area_ha", ascending=False)\nlu_stats["pct"] = lu_stats["area_ha"] / lu_stats["area_ha"].sum() * 100\n\nprint("Land-Use Inventory:")\nprint(lu_stats.to_markdown())\n\n# Map\ncolour_map = {\n    "Residential": "#FFD700", "Commercial": "#FF6347", "Industrial": "#8B4513",\n    "Green space": "#228B22", "Transport": "#808080", "Institutional": "#4169E1",\n    "Vacant": "#FFFFFF", "Mixed use": "#DDA0DD",\n}\nfig, ax = plt.subplots(figsize=(14, 10))\nfor use_class, colour in colour_map.items():\n    subset = parcels[parcels["use_class"] == use_class]\n    if len(subset) > 0:\n        subset.plot(ax=ax, color=colour, label=use_class, edgecolor="gray", linewidth=0.1)\nax.legend(loc="upper right")\nax.set_title("Current Land-Use Inventory")\nax.axis("off")\nplt.savefig("land_use_inventory.png", dpi=150)`,
      ],
      evidence: [
        'Anderson, J. R. et al. (1976). A Land Use and Land Cover Classification System for Use with Remote Sensor Data. USGS Professional Paper 964.',
        'European Environment Agency (2020). Urban Atlas 2018 — Copernicus Land Monitoring Service.',
      ],
      sdgAlignment: ['SDG 11.3'],
      limitations:
        'Mixed-use parcels are difficult to assign to a single class. Informal land uses may be unrecorded.',
    },
    {
      id: 'base-infrastructure-audit',
      title: 'Infrastructure Condition Assessment',
      sectionId: 'baseline_assessment',
      summary:
        'Assess the condition and capacity of existing infrastructure: water supply, sewerage, ' +
        'stormwater drainage, power grid, and telecommunications. Identifies capacity gaps and assets ' +
        'requiring maintenance or replacement.',
      tags: ['water', 'energy', 'indicators', 'governance'],
      methodology:
        '1. Inventory infrastructure assets by type and age.\n' +
        '2. Rate condition using standard scales (1-5 or A-F).\n' +
        '3. Map asset locations and condition spatially.\n' +
        '4. Calculate remaining useful life estimates.\n' +
        '5. Identify capacity constraints against projected demand.\n' +
        '6. Prioritise maintenance/replacement by risk and cost.',
      tools: ['GIS asset management', 'geopandas', 'field surveys'],
      datasets: [
        'Municipal asset management database (pipes, roads, power lines)',
        'Pavement condition index (PCI) survey data',
        'Water/sewer CCTV inspection records',
        'Utility capacity models and customer complaint logs',
      ],
      examples: [
        'ASCE US Infrastructure Report Card: nation-wide assessment grading 17 infrastructure categories across 50 states',
        'UK Ofwat: annual infrastructure condition reporting for 32 water and sewerage companies covering 350 000 km of mains',
        'Singapore PUB: real-time water network monitoring of 5 500 km pipe network with 0.5% unaccounted-for-water rate',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Infrastructure condition assessment\nassets = gpd.read_file("infrastructure_assets.gpkg")\n# fields: asset_id, asset_type, install_year, condition (1-5), capacity_pct, geometry\n\nassets["age_years"] = 2024 - assets["install_year"]\n\n# Summary by type\nsummary = assets.groupby("asset_type").agg(\n    count=("asset_id", "count"),\n    mean_age=("age_years", "mean"),\n    mean_condition=("condition", "mean"),\n    pct_poor=("condition", lambda x: (x <= 2).mean() * 100),\n    mean_utilisation=("capacity_pct", "mean"),\n).round(1)\n\nprint("Infrastructure Condition Summary:")\nprint(summary.to_markdown())\n\n# Assets needing replacement (condition <= 2 and age > 30)\ncritical = assets[(assets["condition"] <= 2) & (assets["age_years"] > 30)]\nprint(f"\\nCritical assets needing replacement: {len(critical)} ({len(critical)/len(assets)*100:.1f}%)")\n\n# Map condition\nfig, ax = plt.subplots(figsize=(14, 10))\nassets.plot(column="condition", cmap="RdYlGn", legend=True, ax=ax, markersize=5)\ncritical.plot(ax=ax, color="red", markersize=15, marker="x", label="Critical")\nax.legend()\nax.set_title("Infrastructure Condition Map")\nplt.savefig("infrastructure_condition.png", dpi=150)`,
      ],
      evidence: [
        'ASCE (2021). Report Card for America\'s Infrastructure. American Society of Civil Engineers.',
        'Grigg, N. S. (2012). Water, Wastewater, and Stormwater Infrastructure Management, 2nd ed. CRC Press.',
      ],
      sdgAlignment: ['SDG 6.1', 'SDG 9.1'],
      limitations:
        'Condition data requires field inspection. Underground infrastructure is difficult to assess ' +
        'without excavation or sensor surveys.',
    },
    {
      id: 'base-environmental-baseline',
      title: 'Environmental Baseline Survey',
      sectionId: 'baseline_assessment',
      summary:
        'Document existing environmental conditions: air quality (PM2.5, NO₂), noise levels, ' +
        'tree canopy coverage, water quality, flood zones, and contaminated sites. Establishes ' +
        'the environmental reference for impact assessment.',
      tags: ['air_quality', 'noise', 'green_infra', 'flood', 'climate'],
      methodology:
        '1. Compile air quality data from monitoring stations and satellite (Sentinel-5P).\n' +
        '2. Map noise contours from existing noise models or measurements.\n' +
        '3. Calculate NDVI and tree canopy % from satellite imagery.\n' +
        '4. Delineate flood zones from hydrological models or FEMA-equivalent maps.\n' +
        '5. Inventory contaminated sites from environmental registers.\n' +
        '6. Produce multi-layer environmental baseline map.',
      tools: ['GEE', 'rasterio', 'geopandas', 'QGIS'],
      datasets: [
        'Sentinel-5P TROPOMI for NO\u2082, SO\u2082, PM2.5 column density',
        'OpenAQ ground station measurements for air quality validation',
        'Sentinel-2 NDVI composites for vegetation assessment',
        'FEMA flood zone or national equivalent hazard maps',
      ],
      examples: [
        'London: multi-layer environmental baseline combining LAEI air quality model with LIDAR canopy height and EA flood zones',
        'Delhi NCR: Sentinel-5P air quality baseline tracking PM2.5 across 11 districts for National Clean Air Programme',
        'Rotterdam: climate resilience baseline integrating heat stress, pluvial flood, and subsidence into multi-hazard map',
      ],
      prompts: [
        `import geopandas as gpd\nimport rasterio\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Environmental baseline multi-layer assessment\n# Layer 1: NDVI (vegetation health)\nwith rasterio.open("ndvi_composite.tif") as src:\n    ndvi = src.read(1)\n    ndvi_mean = np.nanmean(ndvi[ndvi > 0])\n    canopy_pct = (ndvi > 0.4).sum() / (ndvi > -1).sum() * 100\n    print(f"Mean NDVI: {ndvi_mean:.3f}")\n    print(f"Tree canopy coverage (NDVI>0.4): {canopy_pct:.1f}%")\n\n# Layer 2: Air quality zones\naq_stations = gpd.read_file("air_quality_stations.gpkg")  # fields: station_id, pm25_annual, no2_annual\nprint(f"\\nAir quality ({len(aq_stations)} stations):")\nprint(f"  Mean PM2.5: {aq_stations['pm25_annual'].mean():.1f} \u00b5g/m\u00b3 (WHO guideline: 5)")\nprint(f"  Mean NO\u2082: {aq_stations['no2_annual'].mean():.1f} \u00b5g/m\u00b3 (WHO guideline: 10)")\n\n# Layer 3: Flood zones\nflood = gpd.read_file("flood_zones.gpkg")  # fields: zone_class (100yr, 500yr)\npop_grid = gpd.read_file("population_grid.gpkg")\npop_in_flood = gpd.sjoin(pop_grid, flood[flood["zone_class"] == "100yr"], how="inner")["population"].sum()\ntotal_pop = pop_grid["population"].sum()\nprint(f"\\nPopulation in 100-yr flood zone: {pop_in_flood:,.0f} ({pop_in_flood/total_pop*100:.1f}%)")\n\n# Summary map\nfig, axes = plt.subplots(1, 3, figsize=(18, 6))\naxes[0].imshow(ndvi, cmap="YlGn", vmin=0, vmax=0.8)\naxes[0].set_title(f"NDVI (canopy: {canopy_pct:.0f}%)")\naq_stations.plot(column="pm25_annual", cmap="RdYlGn_r", legend=True, ax=axes[1], markersize=50)\naxes[1].set_title("PM2.5 Annual Mean")\nflood.plot(column="zone_class", legend=True, ax=axes[2], alpha=0.5)\naxes[2].set_title("Flood Zones")\nfor ax in axes:\n    ax.axis("off")\nplt.tight_layout()\nplt.savefig("environmental_baseline.png", dpi=150)`,
      ],
      evidence: [
        'EEA (2020). The European Environment — State and Outlook 2020. European Environment Agency.',
        'WHO (2021). WHO Global Air Quality Guidelines. World Health Organization.',
      ],
      limitations:
        'Monitoring station coverage is sparse in many cities. Satellite-derived air quality has coarse resolution.',
      sdgAlignment: ['SDG 11.6'],
    },

    // ── Rapid Assessment ─────────────────────────────────────
    {
      id: 'rapid-urban-profile',
      title: 'Rapid Urban Profile (City Scan)',
      sectionId: 'rapid_assessment',
      summary:
        'Produce a rapid city-wide situational analysis in 3–5 days using publicly available data. ' +
        'Covers spatial structure, demographics, economy, environment, and governance. Designed for ' +
        'emergency response, donor briefings, or early-stage project scoping.',
      tags: ['indicators', 'governance', 'sdg', 'remote_sensing'],
      methodology:
        '1. Gather open data: OSM, WorldPop, GHSL, VIIRS, Sentinel-2.\n' +
        '2. Delineate built-up extent and population estimate.\n' +
        '3. Map key infrastructure: roads, hospitals, schools, water.\n' +
        '4. Compute basic indicators: sprawl ratio, access to transit, green space %.\n' +
        '5. Produce 10-page city profile with standardised template.\n' +
        '6. Identify critical data gaps and follow-up priorities.',
      tools: ['GEE', 'OSM', 'WorldPop', 'geopandas', 'html2pdf'],
      datasets: [
        'GHSL built-up surface and population grids',
        'OpenStreetMap building footprints and amenity data',
        'WorldPop gridded population at 100 m',
        'VIIRS night-time lights composites',
      ],
      examples: [
        'UN-Habitat RUSPS: rapid profiling methodology applied to 50+ cities in East Africa and Asia',
        'World Bank City Scan: open-data rapid profile template used for 30+ cities in Sub-Saharan Africa',
        'REACH Initiative: rapid multi-sector city profiles in 25 humanitarian contexts (Syria, Yemen, Libya)',
      ],
      prompts: [
        `import geopandas as gpd\nimport osmnx as ox\nimport pandas as pd\n\n# Rapid urban profile from open data\ncity = "Kigali, Rwanda"\n\n# 1. Built-up extent and population\nprint(f"=== Rapid Urban Profile: {city} ===")\nbuildings = ox.features_from_place(city, tags={"building": True})\nprint(f"Buildings mapped (OSM): {len(buildings):,}")\ntotal_building_area = buildings.to_crs(epsg=32736).area.sum()\nprint(f"Total building footprint: {total_building_area/1e6:.2f} km\u00b2")\n\n# 2. Key services\nfor service, tags in [\n    ("Hospitals", {"amenity": "hospital"}),\n    ("Schools", {"amenity": "school"}),\n    ("Markets", {"amenity": "marketplace"}),\n]:\n    try:\n        pois = ox.features_from_place(city, tags=tags)\n        print(f"{service}: {len(pois)}")\n    except Exception:\n        print(f"{service}: data unavailable")\n\n# 3. Road network basic stats\nG = ox.graph_from_place(city, network_type="drive")\nstats = ox.basic_stats(G)\nprint(f"\\nRoad network: {stats['edge_length_total']/1000:.0f} km")\nprint(f"Intersection density: {stats['intersection_count']} intersections")\n\n# 4. Green space\ntry:\n    green = ox.features_from_place(city, tags={"leisure": ["park", "garden"]})\n    green_area = green.to_crs(epsg=32736).area.sum() / 1e6\n    print(f"Green space (parks): {green_area:.2f} km\u00b2")\nexcept Exception:\n    print("Green space: data unavailable")\n\nprint("\\n=== Profile complete. Detailed assessment recommended for identified gaps. ===")`,
      ],
      evidence: [
        'UN-Habitat (2010). Rapid Urban Sector Profiling for Sustainability (RUSPS).',
        'Pesaresi, M. et al. (2023). GHS-BUILT-S R2023A — GHS Built-Up Surface Grid. JRC.',
      ],
      sdgAlignment: ['SDG 11.a', 'SDG 17.18'],
      limitations:
        'Open data quality varies. Rapid profiles are broad but shallow; they cannot replace detailed assessments.',
    },
    {
      id: 'rapid-disaster-needs',
      title: 'Post-Disaster Rapid Needs Assessment',
      sectionId: 'rapid_assessment',
      summary:
        'Conduct rapid spatial damage and needs assessment within 72 hours of a disaster event. ' +
        'Combines satellite damage detection, field reports, and population exposure estimates ' +
        'to guide humanitarian response.',
      tags: ['safety', 'flood', 'indicators', 'remote_sensing', 'equity'],
      methodology:
        '1. Obtain pre/post-disaster satellite imagery.\n' +
        '2. Perform change detection for collapsed structures and flooded areas.\n' +
        '3. Estimate affected population using WorldPop or census grids.\n' +
        '4. Map access routes and identify blocked roads.\n' +
        '5. Prioritise areas by severity and vulnerability.\n' +
        '6. Produce crisis map for operations coordination.',
      tools: ['Copernicus EMS', 'UNOSAT', 'GEE', 'geopandas'],
      datasets: [
        'Pre-event VHR satellite imagery (Maxar, Planet)',
        'Post-event satellite imagery (acquired within 24-72 hrs)',
        'WorldPop population grid for exposure estimation',
        'OpenStreetMap road network for accessibility analysis',
      ],
      examples: [
        'Copernicus EMS: rapid mapping activation for 2023 Türkiye-Syria earthquake assessing 45 000 km² in 72 hours',
        'UNOSAT Beirut explosion 2020: satellite damage assessment identifying 6 200 damaged structures within 48 hours',
        'Humanitarian OpenStreetMap Team: post-typhoon Haiyan mapping of 1 million buildings in Philippines within 2 weeks',
      ],
      prompts: [
        `import geopandas as gpd\nimport rasterio\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Post-disaster rapid damage assessment\n# Change detection from pre/post imagery\nwith rasterio.open("pre_event.tif") as src:\n    pre = src.read()  # RGB bands\nwith rasterio.open("post_event.tif") as src:\n    post = src.read()\n    transform = src.transform\n\n# Simple change magnitude\ndiff = np.sqrt(np.sum((post.astype(float) - pre.astype(float))**2, axis=0))\nthreshold = np.percentile(diff[diff > 0], 95)  # top 5% change\ndamage_mask = diff > threshold\n\n# Estimate affected area\npixel_area = abs(transform.a * transform.e)  # m\u00b2\ndamaged_area_km2 = damage_mask.sum() * pixel_area / 1e6\nprint(f"Estimated damaged area: {damaged_area_km2:.2f} km\u00b2")\n\n# Population exposure\npop = gpd.read_file("worldpop_grid.gpkg")  # fields: population, geometry\ndamage_zones = gpd.GeoDataFrame(geometry=[...])  # vectorised damage polygons\naffected_pop = gpd.sjoin(pop, damage_zones, how="inner")["population"].sum()\nprint(f"Estimated affected population: {affected_pop:,.0f}")\n\n# Severity classification\nfig, ax = plt.subplots(figsize=(12, 10))\nax.imshow(diff, cmap="hot_r", vmin=0, vmax=threshold * 1.5)\nax.set_title("Post-Disaster Change Detection Map")\nplt.colorbar(ax.images[0], label="Change magnitude", ax=ax)\nplt.savefig("damage_assessment.png", dpi=150)`,
      ],
      evidence: [
        'UNDP/World Bank/EU (2019). Post-Disaster Needs Assessment Guidelines, Volume A.',
        'Voigt, S. et al. (2016). Satellite Image Analysis for Disaster and Crisis-Management Support. IEEE Transactions on Geoscience and Remote Sensing, 54(3), 1209–1223.',
      ],
      limitations:
        'Cloud cover may prevent optical imagery acquisition. Ground truth is essential but ' +
        'access may be restricted.',
      sdgAlignment: ['SDG 11.5', 'SDG 13.1'],
    },
    {
      id: 'rapid-housing-sector',
      title: 'Rapid Housing Sector Assessment',
      sectionId: 'rapid_assessment',
      summary:
        'Quickly assess housing demand-supply balance, affordability stress, and informal settlement ' +
        'extent using census summaries, remote sensing, and market data.',
      tags: ['housing', 'affordability', 'informal', 'equity', 'indicators'],
      methodology:
        '1. Estimate housing stock from building footprint count and floor area.\n' +
        '2. Estimate demand from projected household formation.\n' +
        '3. Compute affordability ratio: median house price vs. median income.\n' +
        '4. Map informal settlement extent from satellite imagery.\n' +
        '5. Identify housing deficit zones.\n' +
        '6. Produce housing sector snapshot report.',
      tools: ['geopandas', 'satellite imagery', 'census data', 'market reports'],
      datasets: [
        'Building footprint dataset with estimated floor count',
        'Census household and dwelling data',
        'Real estate listing data or property valuation records',
        'Satellite-derived informal settlement boundary maps',
      ],
      examples: [
        'UN-Habitat City Prosperity Index: housing component assessment across 400+ cities measuring adequacy, affordability, informality',
        'Lagos: rapid housing assessment estimating 3 million unit deficit using building footprints + census data',
        'Mumbai: SPARC/SDI settlement profiling of 2 000 informal settlements covering 6 million residents',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# Rapid housing sector assessment\nbuildings = gpd.read_file("buildings.gpkg")  # fields: floors, footprint_area, use_type\ncensus = gpd.read_file("census_zones.gpkg")  # fields: households, median_income\n\n# Housing stock estimate\nresidential = buildings[buildings["use_type"] == "residential"]\nresidential["gfa"] = residential["footprint_area"] * residential["floors"]\navg_unit_size = 75  # m\u00b2 assumed average\nresidential["est_units"] = (residential["gfa"] / avg_unit_size).astype(int).clip(lower=1)\ntotal_stock = residential["est_units"].sum()\n\n# Demand estimate\ntotal_households = census["households"].sum()\ndeficit = total_households - total_stock\n\nprint("Rapid Housing Sector Assessment")\nprint("=" * 40)\nprint(f"Estimated housing stock: {total_stock:,} units")\nprint(f"Total households: {total_households:,}")\nprint(f"Housing deficit: {deficit:,} units ({deficit/total_households*100:.1f}%)")\n\n# Affordability\nmedian_income = census["median_income"].median()\nassumed_house_price = 180000  # local currency\nratio = assumed_house_price / (median_income * 12)\nprint(f"\\nMedian price-to-income ratio: {ratio:.1f}x annual income")\nif ratio > 5:\n    print("WARNING: Severely unaffordable (>5x income)")\n\n# Informal settlement extent\ninformal = gpd.read_file("informal_settlements.gpkg")\ninformal_area = informal.to_crs(epsg=32637).area.sum() / 1e6\nprint(f"\\nInformal settlement area: {informal_area:.2f} km\u00b2")`,
      ],
      evidence: [
        'UN-Habitat (2016). Urbanization and Development: Emerging Futures. World Cities Report 2016.',
        'Angel, S. (2000). Housing Policy Matters: A Global Analysis. Oxford University Press.',
      ],
      limitations:
        'Housing market data is often proprietary. Informal housing counts depend on classification method.',
      sdgAlignment: ['SDG 11.1'],
    },
    {
      id: 'rapid-transport-gap',
      title: 'Rapid Transport Gap Analysis',
      sectionId: 'rapid_assessment',
      summary:
        'Identify critical transport gaps in 1–2 days using GTFS feeds, OSM network data, ' +
        'and population distribution. Maps transit deserts and areas with poor road connectivity.',
      tags: ['mobility', 'transit', 'accessibility', 'equity', 'indicators'],
      methodology:
        '1. Compute transit coverage area from GTFS stop locations (400 m buffer).\n' +
        '2. Identify population outside transit coverage (transit desert).\n' +
        '3. Compute road network connectivity per zone.\n' +
        '4. Calculate average travel time to nearest hospital, school.\n' +
        '5. Map gaps as priority zones for investment.\n' +
        '6. Produce rapid transport assessment brief.',
      tools: ['GTFS', 'OSRM', 'geopandas', 'isochrone services'],
      datasets: [
        'GTFS transit feeds (stop locations, routes, schedules)',
        'OpenStreetMap road network for routing',
        'WorldPop or census population grid',
        'Service facility locations (hospitals, schools) for isochrone analysis',
      ],
      examples: [
        'AllTransit US: nationwide transit gap analysis scoring 800+ metro areas on transit coverage and frequency',
        'Nairobi Digital Matatus: GTFS mapping of informal transit network covering 3 000 matatu routes',
        'Bogotá: TransMilenio gap analysis identifying 2.1 million residents in transit deserts prompting 3 new BRT lines',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# Rapid transit gap analysis from GTFS\nstops = gpd.read_file("gtfs_stops.gpkg")  # GTFS stops with geometry\npop_grid = gpd.read_file("population_grid.gpkg")  # fields: population, geometry\n\n# Buffer stops at 400m (5-min walk)\nstops_proj = stops.to_crs(epsg=32637)\ntransit_coverage = stops_proj.buffer(400).unary_union\n\n# Identify transit desert population\npop_grid_proj = pop_grid.to_crs(epsg=32637)\npop_grid_proj["served"] = pop_grid_proj.geometry.centroid.within(transit_coverage)\n\nserved_pop = pop_grid_proj.loc[pop_grid_proj["served"], "population"].sum()\ntotal_pop = pop_grid_proj["population"].sum()\ndesert_pop = total_pop - served_pop\n\nprint("Rapid Transport Gap Analysis")\nprint("=" * 40)\nprint(f"Transit stops: {len(stops):,}")\nprint(f"Coverage area (400m buffer): {transit_coverage.area/1e6:.1f} km\u00b2")\nprint(f"Population within 400m of transit: {served_pop:,.0f} ({served_pop/total_pop*100:.1f}%)")\nprint(f"Transit desert population: {desert_pop:,.0f} ({desert_pop/total_pop*100:.1f}%)")\n\n# Priority zones (high population, no transit)\ndesert_zones = pop_grid_proj[~pop_grid_proj["served"]].nlargest(20, "population")\nprint(f"\\nTop 20 priority zones (highest unserved population):")\nprint(desert_zones[["population"]].to_markdown())\npop_grid_proj.to_file("transit_gap_analysis.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'Pereira, R. H. M. (2019). Future accessibility impacts of transport policy scenarios: Equity and efficiency concerns. Journal of Transport Geography, 79, 102461.',
        'Welch, T. F. & Mishra, S. (2013). A measure of equity for public transit connectivity. Journal of Transport Geography, 33, 29–41.',
      ],
      limitations:
        'GTFS data may not reflect actual service reliability. Informal transit modes are usually absent.',
      sdgAlignment: ['SDG 11.2'],
    },
  ];
}
