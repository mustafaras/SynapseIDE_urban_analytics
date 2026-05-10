import type { Card } from '../lib/types';

/**
 * Intervention Design & Planning seed cards.
 * 10 cards covering evidence-based urban planning interventions
 * from transit-oriented development to climate adaptation.
 */
export function buildInterventionCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'iv-tod',
      title: 'Transit-Oriented Development (TOD)',
      sectionId: 'intervention_design',
      summary:
        'Concentrate mixed-use, higher-density development within 400–800 m of high-frequency transit stations. ' +
        'TOD reduces car dependency, increases transit ridership, and revitalizes station areas. ' +
        'Key metrics: FAR ≥ 2.0, residential density ≥ 50 du/ha, mixed-use index ≥ 0.6.',
      tags: ['mobility', 'transit', 'density', 'housing', 'land_use'],
      methodology:
        '1. Identify high-frequency transit nodes (headway ≤ 10 min peak) from GTFS.\n' +
        '2. Delineate TOD zones: 400 m walk radius (primary) and 800 m (secondary).\n' +
        '3. Audit existing conditions: FAR, land use mix, pedestrian infrastructure, parking supply.\n' +
        '4. Benchmark against TOD typologies (Calthorpe 1993): urban center, neighborhood, transit town.\n' +
        '5. Model density scenarios: zoning changes needed to achieve target FAR.\n' +
        '6. Assess displacement risk: identify vulnerable populations within TOD zones.\n' +
        '7. Design intervention package: upzoning, inclusionary housing, streetscape improvements.\n' +
        '8. Estimate ridership uplift using elasticity models (Ewing & Cervero, 2010).',
      tools: ['osmnx', 'pandana', 'geopandas', 'gtfs-kit', 'momepy'],
      datasets: [
        'GTFS transit feeds (route, stop, frequency data)',
        'OpenStreetMap buildings and land-use polygons',
        'Census population and housing data by tract',
        'Municipal parcel data with zoning and FAR attributes',
      ],
      examples: [
        'Curitiba BRT-TOD corridor: 20 km structural axis achieving FAR 4.0 with 65% transit mode share',
        'Portland MAX light rail: 10 000 new housing units within 800 m of stations since 1998',
        'Tokyo Shibuya station redevelopment: 3.4 M m² mixed-use within 400 m generating 2.6 M daily trips',
      ],
      prompts: [
        `import geopandas as gpd\nimport gtfs_kit as gk\nimport pandana as pdna\nfrom shapely.geometry import Point\n\n# 1. Load GTFS and identify high-frequency stops\nfeed = gk.read_feed("gtfs.zip", dist_units="km")\nstop_times = feed.stop_times.merge(feed.trips[["trip_id", "route_id"]])\nfreq = stop_times.groupby("stop_id")["trip_id"].nunique().rename("trips_per_day")\nhigh_freq = freq[freq >= 100].index  # High-frequency stops\n\nstops = feed.stops[feed.stops["stop_id"].isin(high_freq)].copy()\nstops_gdf = gpd.GeoDataFrame(\n    stops, geometry=gpd.points_from_xy(stops.stop_lon, stops.stop_lat), crs="EPSG:4326"\n).to_crs(epsg=3857)\n\n# 2. Buffer TOD zones\nstops_gdf["tod_400m"] = stops_gdf.geometry.buffer(400)\nstops_gdf["tod_800m"] = stops_gdf.geometry.buffer(800)\nprint(f"High-frequency stops: {len(stops_gdf)}")\n\n# 3. Audit existing density within TOD zones\nbuildings = gpd.read_file("buildings.gpkg").to_crs(epsg=3857)\ntod_union = stops_gdf.set_geometry("tod_800m").unary_union\nbuildings_in_tod = buildings[buildings.intersects(tod_union)]\nprint(f"Buildings in TOD zones: {len(buildings_in_tod):,}")`,
        `# TOD readiness scoring\nimport pandas as pd\n\ndef tod_readiness_score(zone):\n    """Score TOD readiness 0-100 based on key indicators."""\n    score = 0\n    score += min(25, zone["far"] / 2.0 * 25)  # FAR target: 2.0\n    score += min(25, zone["land_use_mix"] * 25)  # MXI target: 1.0\n    score += min(25, zone["ped_connectivity"] / 100 * 25)  # Intersection density\n    score += min(25, (1 - zone["parking_ratio"]) * 25)  # Lower parking = better\n    return round(score, 1)\n\n# Apply to zones\nzones = pd.read_csv("tod_zones_audit.csv")\nzones["tod_score"] = zones.apply(tod_readiness_score, axis=1)\nprint(zones.sort_values("tod_score", ascending=False)[["station", "tod_score"]].to_markdown())`,
      ],
      evidence: [
        'Calthorpe, P. (1993). The Next American Metropolis: Ecology, Community, and the American Dream. Princeton Architectural Press.',
        'Ewing, R. & Cervero, R. (2010). Travel and the Built Environment. Journal of the American Planning Association, 76(3), 265–294.',
      ],
      limitations:
        'TOD without anti-displacement measures can accelerate gentrification. ' +
        'Success depends on transit service quality, not just proximity. ' +
        'Parking reduction must be phased to match mode shift.',
      sdgAlignment: ['11.2.1', '11.3.1'],
    },
    {
      id: 'iv-complete-streets',
      title: 'Complete Streets',
      sectionId: 'intervention_design',
      summary:
        'Redesign street cross-sections to safely accommodate all users: pedestrians, cyclists, transit riders, ' +
        'and vehicles. NACTO guidelines provide design templates for urban streets, boulevards, and shared spaces. ' +
        'Evaluation uses mode share, crash rates, and comfort metrics.',
      tags: ['mobility', 'pedestrian', 'cycling', 'safety'],
      methodology:
        '1. Select corridor based on crash data, mode share gaps, or transit investment.\n' +
        '2. Survey existing cross-section: lane widths, sidewalk widths, cycling infrastructure, parking.\n' +
        '3. Apply NACTO design guidance: 3.0 m travel lanes, 1.8 m min sidewalk, 2.4 m protected bike lane.\n' +
        '4. Model traffic impact: microsimulation (VISSIM) or HCM level-of-service analysis.\n' +
        '5. Score before/after with Complete Streets Index: pedestrian, cyclist, transit, green subscores.\n' +
        '6. Estimate crash reduction using CMFs (Crash Modification Factors) from FHWA CMF Clearinghouse.\n' +
        '7. Conduct public engagement: visual preference surveys, pop-up demonstrations.',
      tools: ['osmnx', 'geopandas', 'matplotlib (cross-section visualization)', 'QGIS'],
      datasets: [
        'OpenStreetMap street network with width and lane tags',
        'Municipal crash/accident database (geocoded)',
        'Pedestrian and cyclist count stations',
        'NACTO Urban Street Design Guide cross-section templates',
      ],
      examples: [
        'New York City DOT: Broadway Boulevard transformation — 35% reduction in pedestrian injuries, 17% increase in retail sales',
        'Medellín Carrera 70: road diet from 6 to 4 lanes with protected bike lane, 40% cyclist increase',
        "Melbourne's Swanston Street: car-free transit mall with 15% increase in pedestrian activity",
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport matplotlib.pyplot as plt\nimport matplotlib.patches as mpatches\n\n# 1. Download street network and identify candidate corridors\nG = ox.graph_from_place("Barcelona, Spain", network_type="drive")\nedges = ox.graph_to_gdfs(G, nodes=False)\n\n# 2. Filter high-crash corridors (join with crash data)\ncrashes = gpd.read_file("crashes_geocoded.gpkg")\nedges_proj = edges.to_crs(epsg=3857)\ncrashes_proj = crashes.to_crs(epsg=3857)\n\n# Buffer edges and count crashes within 15m\nedges_proj["crash_buffer"] = edges_proj.geometry.buffer(15)\nedges_buf = edges_proj.set_geometry("crash_buffer")\njoined = gpd.sjoin(crashes_proj, edges_buf, how="inner", predicate="within")\ncrash_count = joined.groupby("osmid").size().rename("crash_count")\nedges = edges.merge(crash_count, left_index=True, right_index=True, how="left")\nedges["crash_count"] = edges["crash_count"].fillna(0)\n\n# 3. Prioritise top 20 corridors\ntop_corridors = edges.nlargest(20, "crash_count")\nprint(top_corridors[["name", "crash_count", "highway"]].to_markdown())`,
        `# Cross-section comparison visualisation\nimport matplotlib.pyplot as plt\nimport matplotlib.patches as mpatches\n\ndef draw_cross_section(ax, title, elements):\n    """Draw a street cross-section diagram."""\n    x = 0\n    for name, width, color in elements:\n        rect = mpatches.FancyBboxPatch((x, 0), width, 1, boxstyle="square", fc=color, ec="black", lw=0.5)\n        ax.add_patch(rect)\n        ax.text(x + width/2, 0.5, f"{name}\\n{width}m", ha="center", va="center", fontsize=7)\n        x += width\n    ax.set_xlim(0, x)\n    ax.set_ylim(-0.2, 1.5)\n    ax.set_title(title, fontsize=10)\n    ax.set_aspect("equal")\n    ax.axis("off")\n\nfig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 5))\n\n# Before: 6-lane road\ndraw_cross_section(ax1, "BEFORE: 6-Lane Arterial (24m)", [\n    ("Sidewalk", 2.0, "#A9A9A9"), ("Parking", 2.5, "#D3D3D3"),\n    ("Lane", 3.3, "#4A4A4A"), ("Lane", 3.3, "#4A4A4A"), ("Lane", 3.3, "#4A4A4A"),\n    ("Lane", 3.3, "#4A4A4A"), ("Parking", 2.5, "#D3D3D3"), ("Sidewalk", 2.0, "#A9A9A9"),\n])\n\n# After: Complete street\ndraw_cross_section(ax2, "AFTER: Complete Street (24m)", [\n    ("Sidewalk", 3.0, "#A9A9A9"), ("Bike", 2.4, "#48BB78"),\n    ("Lane", 3.0, "#4A4A4A"), ("Median", 2.0, "#228B22"), ("Lane", 3.0, "#4A4A4A"),\n    ("Bus", 3.3, "#E53E3E"), ("Bike", 2.4, "#48BB78"), ("Sidewalk", 3.0, "#A9A9A9"),\n])\nplt.tight_layout()\nplt.savefig("cross_section_comparison.png", dpi=150)`,
      ],
      evidence: [
        'NACTO (2013). Urban Street Design Guide. National Association of City Transportation Officials.',
        'Smart Growth America (2022). Complete Streets Policy Atlas.',
      ],
      limitations:
        'Retrofitting existing rights-of-way is constrained by underground utilities and property lines. ' +
        'Political resistance from parking removal. ' +
        'Benefits accrue over years, making short-term evaluation difficult.',
      sdgAlignment: ['11.2.1', '3.6.1'],
    },
    {
      id: 'iv-green-infrastructure',
      title: 'Green Infrastructure',
      sectionId: 'intervention_design',
      summary:
        'Deploy nature-based solutions for stormwater management, urban heat mitigation, and biodiversity: ' +
        'bioswales, rain gardens, green roofs, permeable pavements, and urban wetlands. ' +
        'Co-benefits include air quality improvement, carbon sequestration, and property value uplift.',
      tags: ['green_infra', 'climate', 'flood', 'biodiversity'],
      methodology:
        '1. Map impervious surface coverage and stormwater drainage network.\n' +
        '2. Identify priority areas: flood-prone zones, UHI hot spots, low tree canopy neighborhoods.\n' +
        '3. Select interventions by site constraints: bioswale (linear space), rain garden (open area), green roof (flat roof).\n' +
        '4. Size installations using TR-55 or rational method for design storm (10-yr, 24-hr).\n' +
        '5. Estimate runoff volume reduction: CN (Curve Number) method before/after.\n' +
        '6. Model UHI mitigation: LST reduction of 1–3°C per 10% increase in green cover.\n' +
        '7. Cost-benefit analysis: installation + maintenance vs. grey infrastructure alternative.\n' +
        '8. Monitor performance: runoff volume, infiltration rate, vegetation health (NDVI).',
      tools: ['geopandas', 'rasterio', 'SWMM (EPA)', 'i-Tree Eco', 'QGIS'],
      datasets: [
        'Municipal stormwater infrastructure GIS layers',
        'NLCD impervious surface raster (30 m, USGS)',
        'LiDAR-derived canopy height model',
        'Local rainfall IDF curves (Intensity-Duration-Frequency)',
        'Building footprint polygons with roof type attributes',
      ],
      examples: [
        'Philadelphia Green City, Clean Waters: $2.4 B green infrastructure programme reducing CSO by 85% over 25 years',
        'Copenhagen Cloudburst Management Plan: 300 green retention projects after 2011 flood (€1 B damages)',
        'Singapore ABC Waters: 100+ bioswale/rain garden sites achieving 25% runoff reduction in pilot catchments',
      ],
      prompts: [
        `import geopandas as gpd\nimport rasterio\nimport numpy as np\n\n# 1. Map impervious surface and priority areas\nwith rasterio.open("impervious_surface.tif") as src:\n    imperv = src.read(1)\n    transform = src.transform\n\n# 2. Compute Curve Number (CN) reduction from green infrastructure\n# Before: CN = 98 (impervious), After: CN = 65 (rain garden), CN = 75 (green roof)\ndef runoff_depth_mm(P_mm, CN):\n    """SCS Curve Number method for runoff depth."""\n    S = (25400 / CN) - 254\n    if P_mm <= 0.2 * S:\n        return 0\n    return (P_mm - 0.2 * S) ** 2 / (P_mm + 0.8 * S)\n\n# 10-year, 24-hour design storm\nP_design = 75  # mm\nrunoff_before = runoff_depth_mm(P_design, CN=98)\nrunoff_after = runoff_depth_mm(P_design, CN=72)  # weighted average with GI\nreduction = (1 - runoff_after / runoff_before) * 100\nprint(f"Design storm: {P_design} mm")\nprint(f"Runoff before GI: {runoff_before:.1f} mm")\nprint(f"Runoff after GI:  {runoff_after:.1f} mm")\nprint(f"Reduction: {reduction:.0f}%")`,
        `# Green Infrastructure cost-benefit analysis\nimport pandas as pd\n\n# Costs per unit (USD, annualised over 30 years)\ngi_options = pd.DataFrame([\n    {"type": "Rain garden", "cost_per_m2": 180, "runoff_reduction_pct": 80, "co2_kg_per_m2": 2.1, "maintenance_per_m2": 12},\n    {"type": "Bioswale", "cost_per_m2": 120, "runoff_reduction_pct": 70, "co2_kg_per_m2": 1.8, "maintenance_per_m2": 8},\n    {"type": "Green roof", "cost_per_m2": 250, "runoff_reduction_pct": 60, "co2_kg_per_m2": 3.5, "maintenance_per_m2": 15},\n    {"type": "Permeable pave", "cost_per_m2": 90, "runoff_reduction_pct": 50, "co2_kg_per_m2": 0.5, "maintenance_per_m2": 5},\n])\n\n# Compare lifetime costs\ngi_options["total_30yr"] = gi_options["cost_per_m2"] + gi_options["maintenance_per_m2"] * 30\ngi_options["cost_per_pct_reduction"] = (gi_options["total_30yr"] / gi_options["runoff_reduction_pct"]).round(1)\nprint(gi_options.to_markdown(index=False))`,
      ],
      evidence: [
        'US EPA (2014). Green Infrastructure: Reducing Combined Sewer Overflows. EPA 832-F-14-001.',
        'Benedict, M. A. & McMahon, E. T. (2006). Green Infrastructure: Linking Landscapes and Communities. Island Press.',
      ],
      limitations:
        'Maintenance requirements are often underestimated in long-term budgets. ' +
        'Performance degrades in clay soils with low infiltration capacity. ' +
        'Green roofs add structural load requiring engineering assessment.',
      sdgAlignment: ['11.5.1', '11.7.1', '13.1.1'],
    },
    {
      id: 'iv-mixed-use-zoning',
      title: 'Mixed-Use Zoning',
      sectionId: 'intervention_design',
      summary:
        'Reform land use regulations to allow residential, commercial, and civic uses within the same zone or building. ' +
        'Mixed-use development reduces trip distances, increases walkability, and supports local economies. ' +
        'Measured by Shannon Entropy Index (MXI) where 0 = single use and 1 = perfectly mixed.',
      tags: ['land_use', 'zoning', 'density', 'economic'],
      methodology:
        '1. Audit existing zoning: map single-use vs. mixed-use zones.\n' +
        '2. Compute current MXI per block or census tract.\n' +
        '3. Identify underperforming areas: low MXI + high vehicle mode share.\n' +
        '4. Design zoning overlay or form-based code allowing mixed-use by-right.\n' +
        '5. Model land use scenarios: estimate housing units + commercial sqm under new FAR limits.\n' +
        '6. Assess fiscal impact: property tax revenue, infrastructure cost per capita.\n' +
        '7. Implement phased rollout with design review standards.\n' +
        '8. Monitor MXI change and trip generation rates over time.',
      tools: ['geopandas', 'momepy', 'osmnx', 'matplotlib', 'QGIS'],
      datasets: [
        'Municipal zoning maps (GIS polygons with zone codes)',
        'OpenStreetMap building tags (amenity, shop, office, residential)',
        'Census journey-to-work mode share by tract',
        'Commercial vacancy rates by neighbourhood',
      ],
      examples: [
        'Houston reformed zoning 1999: eliminated single-use residential zoning citywide, 25% increase in mid-rise mixed-use permits',
        'Minneapolis 2040 Plan: allowed triplex citywide + mixed-use along transit corridors, 12% MXI increase in 3 years',
        'Tokyo fine-grained zoning: 12 zone types enabling corner shops in residential areas, yielding world-leading land-use diversity',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\n\n# 1. Compute Mixed-Use Index (Shannon Entropy) per zone\nzones = gpd.read_file("zoning.gpkg")\nbuildings = gpd.read_file("buildings_with_use.gpkg")\n\n# Spatial join buildings to zones\njoined = gpd.sjoin(buildings, zones, how="inner", predicate="within")\n\ndef compute_mxi(group):\n    """Shannon Entropy-based land-use mix index (0=mono, 1=perfectly mixed)."""\n    counts = group["building_use"].value_counts(normalize=True)\n    n = len(counts)\n    if n <= 1: return 0.0\n    entropy = -np.sum(counts * np.log(counts))\n    return entropy / np.log(n)\n\nmxi = joined.groupby("zone_id").apply(compute_mxi).rename("mxi")\nzones = zones.merge(mxi, left_on="zone_id", right_index=True)\n\n# 2. Identify low-mix + high-car-dependency zones\nzones["priority"] = (zones["mxi"] < 0.3) & (zones["car_mode_share"] > 0.7)\nprint(f"Priority zones for mixed-use reform: {zones['priority'].sum()}")\nzones.plot(column="mxi", cmap="RdYlGn", legend=True, figsize=(12, 10))`,
        `# Before/after MXI scenario comparison\nimport pandas as pd\n\nscenarios = pd.DataFrame({\n    "zone": ["Downtown Core", "Inner Suburb", "Outer Ring"],\n    "mxi_before": [0.72, 0.35, 0.12],\n    "mxi_after": [0.82, 0.58, 0.34],\n    "new_units": [1200, 3500, 800],\n    "new_commercial_m2": [15000, 25000, 5000],\n})\nscenarios["mxi_change"] = (scenarios["mxi_after"] - scenarios["mxi_before"]).round(2)\nprint(scenarios.to_markdown(index=False))`,
      ],
      evidence: [
        'Grant, J. (2002). Mixed Use in Theory and Practice. Journal of the American Planning Association, 68(1), 71–84.',
        'Jacobs, J. (1961). The Death and Life of Great American Cities. Random House.',
      ],
      limitations:
        'Existing property owners may oppose densification. ' +
        'Parking requirements often undermine mixed-use feasibility. ' +
        'Market demand for ground-floor commercial varies by location.',
      sdgAlignment: ['11.3.1'],
    },
    {
      id: 'iv-traffic-calming',
      title: 'Traffic Calming',
      sectionId: 'intervention_design',
      summary:
        'Physical and regulatory measures to reduce vehicle speeds on local streets: speed bumps, chicanes, ' +
        'raised crosswalks, curb extensions, shared spaces, and 20 mph/30 km/h zones. ' +
        'Primary goal: reduce pedestrian fatalities (risk drops from 85% at 60 km/h to 10% at 30 km/h).',
      tags: ['mobility', 'pedestrian', 'safety'],
      methodology:
        '1. Identify high-risk corridors from crash data and speed surveys.\n' +
        '2. Classify street by function: arterial, collector, local, residential.\n' +
        '3. Select toolset by context: vertical deflection (speed humps), horizontal deflection (chicanes), pinch points.\n' +
        '4. Design according to NACTO or local standards.\n' +
        '5. Model 85th percentile speed reduction using empirical CMFs.\n' +
        '6. Estimate crash reduction: 20–30% for area-wide 30 km/h zones.\n' +
        '7. Engage residents: walking audits, community workshops.\n' +
        '8. Monitor: before/after speed surveys, crash data, pedestrian counts.',
      tools: ['osmnx', 'geopandas', 'QGIS', 'matplotlib'],
      datasets: [
        'Municipal road crash database (location, severity, mode)',
        'Speed survey data (radar gun or pneumatic tube)',
        'OpenStreetMap street network with speed limit tags',
        'Pedestrian count data from automated counters',
      ],
      examples: [
        'London 20 mph zones: 42% reduction in road casualties across 399 zones (Grundy et al. 2009)',
        'Vauban, Freiburg: car-free district with 30 km/h shared spaces achieving zero pedestrian fatalities since 2001',
        'Bogotá ciclovía: 128 km of weekly car-free streets reducing average speeds on adjacent roads by 18%',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport pandas as pd\n\n# 1. Identify high-speed residential streets\nG = ox.graph_from_place("Freiburg, Germany", network_type="drive")\nedges = ox.graph_to_gdfs(G, nodes=False)\n\n# Parse speed limits\nedges["maxspeed_num"] = pd.to_numeric(\n    edges["maxspeed"].apply(lambda x: str(x).split(";")[0] if pd.notna(x) else None),\n    errors="coerce"\n)\n\n# Flag residential streets with speed > 30 km/h\nresidential = edges[edges["highway"].isin(["residential", "living_street"])]\nhigh_speed = residential[residential["maxspeed_num"] > 30]\nprint(f"Residential streets > 30 km/h: {len(high_speed)} segments ({high_speed.geometry.length.sum()/1000:.1f} km)")`,
        `# Crash Modification Factor (CMF) estimation\nimport pandas as pd\n\n# CMF database (from FHWA CMF Clearinghouse)\ncmfs = pd.DataFrame([\n    {"measure": "Speed humps (series)", "cmf": 0.53, "std_error": 0.08, "crash_type": "all"},\n    {"measure": "Chicanes", "cmf": 0.72, "std_error": 0.12, "crash_type": "all"},\n    {"measure": "Raised crosswalk", "cmf": 0.55, "std_error": 0.10, "crash_type": "pedestrian"},\n    {"measure": "20 mph zone (area-wide)", "cmf": 0.58, "std_error": 0.06, "crash_type": "all"},\n    {"measure": "Curb extension", "cmf": 0.68, "std_error": 0.15, "crash_type": "pedestrian"},\n])\n\n# Estimate crash reduction for a corridor\nbaseline_crashes_yr = 45\nfor _, row in cmfs.iterrows():\n    reduced = baseline_crashes_yr * row["cmf"]\n    saved = baseline_crashes_yr - reduced\n    print(f"{row['measure']}: {saved:.0f} fewer crashes/yr (CMF={row['cmf']}, ±{row['std_error']})")`,
      ],
      evidence: [
        'Bunn, F. et al. (2003). Area-wide traffic calming for preventing traffic related injuries. Cochrane Database of Systematic Reviews, (1).',
        'World Health Organization (2017). Managing Speed. WHO Press.',
      ],
      limitations:
        'Emergency vehicle access must be maintained. ' +
        'Speed humps controversial with bus operators and cyclists. ' +
        'Enforcement needed to sustain speed reduction effects.',
      sdgAlignment: ['3.6.1', '11.2.1'],
    },
    {
      id: 'iv-affordable-housing',
      title: 'Affordable Housing Policy',
      sectionId: 'intervention_design',
      summary:
        'Policy instruments to increase housing affordability: inclusionary zoning (10–20% affordable units in new developments), ' +
        'community land trusts, rent stabilization, housing vouchers, and public housing construction. ' +
        'Affordability benchmark: housing cost ≤ 30% of household income (HUD standard).',
      tags: ['housing', 'affordability', 'equity', 'displacement'],
      methodology:
        '1. Compute housing cost burden: % of households paying > 30% income on housing.\n' +
        '2. Map spatial distribution of cost burden by census tract.\n' +
        '3. Identify displacement risk areas: cost burden + rising rents + demographic change.\n' +
        '4. Evaluate policy options: mandatory inclusionary zoning, density bonuses, LIHTC allocation.\n' +
        '5. Model housing production needed: gap between current supply and affordable demand.\n' +
        '6. Estimate revenue from linkage fees or in-lieu payments.\n' +
        '7. Draft policy framework with income targeting (30%, 50%, 80% AMI tiers).\n' +
        '8. Monitor: permit data, affordability metrics, displacement indicators.',
      tools: ['geopandas', 'cenpy (Census data)', 'pandas', 'plotly', 'QGIS'],
      datasets: [
        'Census/ACS housing cost and income data (tract-level)',
        'HUD CHAS (Comprehensive Housing Affordability Strategy) data',
        'Building permit and construction starts database',
        'Zillow / Idealista rent indices for market analysis',
      ],
      examples: [
        'Vienna social housing model: 60% of residents in subsidised housing, maintaining <25% cost burden citywide',
        'Singapore HDB programme: 80% of population in public housing with 90% homeownership rate',
        'Montréal inclusionary zoning: 20% affordable units required in projects >50 units since 2021',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# 1. Compute housing cost burden by census tract\ntracts = gpd.read_file("census_tracts.gpkg")\nhousing = pd.read_csv("acs_housing_costs.csv")  # median_rent, median_income per tract\n\ntracts = tracts.merge(housing, on="tract_id")\ntracts["cost_burden"] = tracts["median_rent"] * 12 / tracts["median_income"]\ntracts["severely_burdened"] = tracts["cost_burden"] > 0.5\n\nprint(f"Tracts with >30% cost burden: {(tracts['cost_burden'] > 0.3).sum()} / {len(tracts)}")\nprint(f"Tracts with >50% cost burden: {tracts['severely_burdened'].sum()}")\n\n# 2. Map housing affordability\nfig, ax = plt.subplots(figsize=(12, 10))\ntracts.plot(column="cost_burden", cmap="RdYlGn_r", legend=True, ax=ax,\n            legend_kwds={"label": "Housing Cost / Income Ratio"})\nax.set_title("Housing Cost Burden by Census Tract")\nplt.tight_layout()\nplt.savefig("housing_cost_burden.png", dpi=150)`,
        `# Displacement risk index\nimport pandas as pd\nimport numpy as np\n\ndef displacement_risk(tract):\n    """Composite displacement risk score (0-100)."""\n    score = 0\n    score += min(30, tract["cost_burden"] / 0.5 * 30)  # Cost burden\n    score += min(25, tract["rent_change_5yr_pct"] / 30 * 25)  # Rent increase\n    score += min(25, tract["pct_renter"] / 100 * 25)  # Renter share\n    score += min(20, tract["pct_minority"] / 100 * 20)  # Demographic vulnerability\n    return round(score, 1)\n\ntracts["displacement_risk"] = tracts.apply(displacement_risk, axis=1)\nhigh_risk = tracts[tracts["displacement_risk"] > 70]\nprint(f"High displacement risk tracts: {len(high_risk)}")\nprint(high_risk[["tract_id", "displacement_risk", "cost_burden"]].to_markdown())`,
      ],
      evidence: [
        'Schuetz, J., Meltzer, R. & Been, V. (2011). Silver Bullet or Trojan Horse? The Effects of Inclusionary Zoning on Local Housing Markets. Urban Studies, 48(2), 297–329.',
        'Aurand, A. et al. (2021). The Gap: A Shortage of Affordable Homes. National Low Income Housing Coalition.',
      ],
      limitations:
        'Inclusionary zoning can reduce overall housing production if requirements are too stringent. ' +
        'Land trust model requires upfront public investment. ' +
        'Rent control alone does not increase supply.',
      sdgAlignment: ['11.1.1'],
    },
    {
      id: 'iv-urban-greening',
      title: 'Urban Greening (Tree Planting)',
      sectionId: 'intervention_design',
      summary:
        'Strategic tree planting programs to increase urban canopy coverage. ' +
        'Target ≥ 30% canopy (USDA Forest Service). Benefits: 1–3°C cooling, stormwater absorption, ' +
        'air pollutant removal, property value increase (+3–15%), and mental health benefits.',
      tags: ['green_infra', 'climate', 'heat_island', 'health', 'canopy'],
      methodology:
        '1. Map existing canopy: remote sensing (LiDAR or high-res imagery classification).\n' +
        '2. Identify low-canopy priority areas: overlay with UHI hot spots and socioeconomic vulnerability.\n' +
        '3. Select species: native, drought-tolerant, appropriate mature size for context.\n' +
        '4. Design planting plan: street trees (8–12 m spacing), park trees, private lot programs.\n' +
        '5. Estimate ecosystem services: i-Tree Eco model for pollution removal and carbon sequestration.\n' +
        '6. Budget: $200–$500/tree planting + $50–$100/year maintenance for 5 years.\n' +
        '7. Engage community: neighborhood tree steward programs.\n' +
        '8. Monitor: canopy change detection every 2–3 years via satellite.',
      tools: ['rasterio', 'scikit-learn (classification)', 'i-Tree Eco', 'geopandas', 'Google Earth Engine'],
      datasets: [
        'LiDAR-derived canopy height model (CHM)',
        'High-resolution satellite imagery (Planet, Maxar) for canopy classification',
        'Municipal tree inventory database',
        'i-Tree Eco species benefit lookup tables',
        'Census socioeconomic data for equity overlay',
      ],
      examples: [
        'Melbourne Urban Forest Strategy: target 40% canopy by 2040 from current 22%, planting 3 000 trees/year since 2012',
        'New York MillionTreesNYC: planted 1 M trees in 8 years; NDVI increase of 0.04 citywide',
        'São Paulo Green Belt: restoration of 200 ha of Atlantic Forest fragments in peri-urban areas',
      ],
      prompts: [
        `import rasterio\nimport numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\nimport geopandas as gpd\n\n# 1. Canopy detection from multispectral imagery\nwith rasterio.open("sentinel2_10m_rgbnir.tif") as src:\n    red = src.read(3).astype(float)\n    nir = src.read(4).astype(float)\n    ndvi = (nir - red) / (nir + red + 1e-10)\n\n# Simple threshold for tree canopy\ncanopy_mask = ndvi > 0.4\ncanopy_pct = canopy_mask.mean() * 100\nprint(f"Current canopy coverage: {canopy_pct:.1f}%")\n\n# 2. Priority mapping: low canopy + high UHI + vulnerable population\nlst = rasterio.open("land_surface_temp.tif").read(1)\nvulnerability = rasterio.open("socioeconomic_vulnerability.tif").read(1)\n\n# Normalise each layer 0–1\ndef norm(arr):\n    return (arr - np.nanmin(arr)) / (np.nanmax(arr) - np.nanmin(arr) + 1e-10)\n\npriority = norm(1 - canopy_mask.astype(float)) * 0.4 + norm(lst) * 0.35 + norm(vulnerability) * 0.25\nprint(f"Priority pixels (top 10%): {(priority > np.nanpercentile(priority, 90)).sum():,}")`,
        `# Canopy change detection between two dates\nimport rasterio\nimport numpy as np\n\nwith rasterio.open("ndvi_2018.tif") as src:\n    ndvi_t1 = src.read(1)\nwith rasterio.open("ndvi_2023.tif") as src:\n    ndvi_t2 = src.read(1)\n\ncanopy_t1 = ndvi_t1 > 0.4\ncanopy_t2 = ndvi_t2 > 0.4\n\ngain = (~canopy_t1 & canopy_t2).sum()\nloss = (canopy_t1 & ~canopy_t2).sum()\nnet = gain - loss\nprint(f"Canopy gain: {gain:,} pixels")\nprint(f"Canopy loss: {loss:,} pixels")\nprint(f"Net change: {'+' if net > 0 else ''}{net:,} pixels")`,
      ],
      evidence: [
        'Nowak, D. J. & Greenfield, E. J. (2018). Declining urban and community tree cover in the United States. Urban Forestry & Urban Greening, 32, 32–55.',
        'Livesley, S. J. et al. (2016). The urban forest and ecosystem services: impacts on urban water, heat, and pollution cycles. Journal of Environmental Quality, 45(1), 119–124.',
      ],
      limitations:
        'New trees take 10–20 years to provide significant canopy. ' +
        'Underground utilities constrain planting locations. ' +
        'Maintenance funding often lapses after initial planting programs end.',
      sdgAlignment: ['11.7.1', '13.1.1'],
    },
    {
      id: 'iv-tactical-urbanism',
      title: 'Tactical Urbanism',
      sectionId: 'intervention_design',
      summary:
        'Low-cost, temporary interventions that test street redesign concepts before permanent investment. ' +
        'Examples: parklets, pop-up bike lanes, open streets events, intersection murals, and plaza pilots. ' +
        'Data collected during pilots informs permanent design decisions.',
      tags: ['mobility', 'pedestrian', 'participation', 'placemaking'],
      methodology:
        '1. Identify candidate sites through community input and crash/comfort data.\n' +
        '2. Design low-cost intervention: paint, planters, temporary bollards, movable furniture.\n' +
        '3. Obtain temporary permits and coordinate with emergency services.\n' +
        '4. Install over a weekend with community volunteers.\n' +
        '5. Collect before/after data: pedestrian counts, vehicle speeds, public surveys.\n' +
        '6. Iterate design based on feedback (adjust dimensions, add features).\n' +
        '7. Present data-driven case for permanent conversion.\n' +
        '8. Document process for replication at other sites.',
      tools: ['geopandas', 'matplotlib', 'QGIS', 'Google Street View (before/after)'],
      datasets: [
        'Municipal pedestrian count stations (before/after)',
        'Intercept survey data (user satisfaction)',
        'Speed radar measurements at intervention sites',
        'Social media geotagged posts for sentiment analysis',
      ],
      examples: [
        'Times Square NYC pedestrian plaza: tactical demo led to permanent 89% increase in pedestrian space',
        'Barcelona Superilles pilot: temporary bollards on Poblenou intersections, 25% pedestrian increase, adopted permanently in 24 blocks',
        'Bogotá Open Streets (Ciclovía): weekly car-free 128 km inspiring 400+ cities worldwide',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Before/After evaluation of tactical urbanism intervention\nbefore = pd.DataFrame({\n    "metric": ["Pedestrian count/hr", "Vehicle speed (85th %)", "Dwell time (min)", "User satisfaction"],\n    "value": [120, 45, 2.5, None],\n    "unit": ["persons", "km/h", "minutes", "1-5 scale"],\n})\n\nafter = pd.DataFrame({\n    "metric": ["Pedestrian count/hr", "Vehicle speed (85th %)", "Dwell time (min)", "User satisfaction"],\n    "value": [185, 28, 8.3, 4.2],\n    "unit": ["persons", "km/h", "minutes", "1-5 scale"],\n})\n\ncomparison = before.merge(after, on="metric", suffixes=("_before", "_after"))\ncomparison["change_pct"] = ((comparison["value_after"] - comparison["value_before"]) / comparison["value_before"] * 100).round(1)\nprint(comparison[["metric", "value_before", "value_after", "change_pct"]].to_markdown(index=False))`,
        `# Site selection scoring for tactical urbanism\nimport geopandas as gpd\nimport numpy as np\n\nsites = gpd.read_file("candidate_sites.gpkg")\n\ndef tactical_score(site):\n    score = 0\n    score += min(25, site.get("crash_density", 0) / 10 * 25)  # Safety need\n    score += min(25, site.get("ped_count", 0) / 500 * 25)  # Footfall potential\n    score += min(25, site.get("community_support", 0) / 5 * 25)  # Community buy-in\n    score += min(25, (1 - site.get("cost_index", 1)) * 25)  # Low cost\n    return round(score, 1)\n\nsites["score"] = sites.apply(tactical_score, axis=1)\nprint(sites.nlargest(10, "score")[["name", "score"]].to_markdown())`,
      ],
      evidence: [
        'Lydon, M. & Garcia, A. (2015). Tactical Urbanism: Short-Term Action for Long-Term Change. Island Press.',
        'Gehl, J. & Svarre, B. (2013). How to Study Public Life. Island Press.',
      ],
      limitations:
        'Temporary materials degrade quickly; maintenance required. ' +
        'Pilot results may not predict long-term behavior change. ' +
        'Political opposition can end pilots prematurely.',
      sdgAlignment: ['11.7.1'],
    },
    {
      id: 'iv-brownfield-redevelopment',
      title: 'Brownfield Redevelopment',
      sectionId: 'intervention_design',
      summary:
        'Revitalize contaminated or underused industrial land for productive urban use. ' +
        'Process: environmental site assessment (Phase I/II ESA), remediation, rezoning, and redevelopment. ' +
        'Brownfield conversion reduces greenfield sprawl and restores urban land to productive use.',
      tags: ['land_use', 'economic', 'health', 'climate'],
      methodology:
        '1. Inventory brownfield sites: EPA Brownfields database, local environmental agency records.\n' +
        '2. Phase I ESA: historical review, site reconnaissance, interviews (ASTM E1527-21).\n' +
        '3. Phase II ESA: soil and groundwater sampling for contaminants of concern.\n' +
        '4. Risk assessment: exposure pathways, receptor populations, cleanup levels.\n' +
        '5. Remediation strategy: excavation, capping, bioremediation, or monitored natural attenuation.\n' +
        '6. Financial analysis: cleanup cost vs. land value uplift, tax increment financing eligibility.\n' +
        '7. Community engagement: address environmental justice concerns.\n' +
        '8. Rezone and design redevelopment plan: mixed-use, affordable housing, public space.',
      tools: ['geopandas', 'PostGIS', 'QGIS', 'EPA Brownfields Assessment tools'],
      datasets: [
        'EPA Brownfields / CERCLIS database (US contaminated sites)',
        'European Environment Agency contaminated sites register (EEA)',
        'Municipal environmental permit records',
        'Historical land-use maps for site history assessment',
      ],
      examples: [
        'London Olympic Park: 220 ha industrial brownfield remediated for 2012 Games, now housing 10 000+ residents',
        'Pittsburgh South Side Works: steelmill-to-mixed-use conversion, 34 ha generating $500M investment',
        'Barcelona 22@ District: 198 ha industrial zone rezoned to innovation district, 4 500 new companies since 2000',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\n\n# 1. Load brownfield inventory\nbrownfields = gpd.read_file("brownfield_sites.gpkg")\nprint(f"Total brownfield sites: {len(brownfields)}")\nprint(f"Total area: {brownfields.geometry.area.sum() / 10000:.0f} ha")\n\n# 2. Prioritise by redevelopment potential\nbrownfields["transit_dist"] = brownfields.geometry.apply(\n    lambda g: transit_stops.distance(g).min()\n)\nbrownfields["center_dist"] = brownfields.geometry.centroid.distance(city_center)\n\ndef redevelopment_score(site):\n    score = 0\n    score += min(25, (1 - site["contamination_level"] / 5) * 25)  # Lower contamination = easier\n    score += min(25, (1 - site["transit_dist"] / 2000) * 25)  # Closer to transit\n    score += min(25, site.geometry.area / 50000 * 25)  # Larger site\n    score += min(25, (1 - site["center_dist"] / 10000) * 25)  # Closer to center\n    return round(score, 1)\n\nbrownfields["priority"] = brownfields.apply(redevelopment_score, axis=1)\nprint(brownfields.nlargest(10, "priority")[["name", "area_ha", "priority"]].to_markdown())`,
        `# Cost-benefit analysis for brownfield remediation\nimport pandas as pd\n\nsite = {\n    "area_ha": 12,\n    "contamination": "moderate",\n    "cleanup_cost_per_ha": 800000,  # EUR\n    "land_value_before": 50,  # EUR/m2\n    "land_value_after": 350,  # EUR/m2 (remediated + rezoned)\n}\n\ncleanup = site["area_ha"] * site["cleanup_cost_per_ha"]\nvalue_uplift = site["area_ha"] * 10000 * (site["land_value_after"] - site["land_value_before"])\nbcr = value_uplift / cleanup\nprint(f"Cleanup cost: €{cleanup:,.0f}")\nprint(f"Land value uplift: €{value_uplift:,.0f}")\nprint(f"Benefit-cost ratio: {bcr:.1f}x")`,
      ],
      evidence: [
        'De Sousa, C. A. (2003). Turning brownfields into green space in the City of Toronto. Landscape and Urban Planning, 62(4), 181–198.',
        'Thornton, G. et al. (2007). The challenge of sustainability: incentives for brownfield regeneration in Europe. Environmental Science & Policy, 10(2), 116–134.',
      ],
      limitations:
        'Remediation costs are highly variable and often exceed initial estimates. ' +
        'Long regulatory timelines (2–10 years) deter private investment. ' +
        'Community distrust of contaminated sites persists even after cleanup.',
      sdgAlignment: ['11.3.1', '11.6.1'],
    },
    {
      id: 'iv-climate-adaptation',
      title: 'Climate Adaptation Strategies',
      sectionId: 'intervention_design',
      summary:
        'Integrated strategies to increase urban resilience to climate change impacts: heat waves, flooding, ' +
        'sea-level rise, drought, and wildfire. Combines grey infrastructure (seawalls, drainage upgrades), ' +
        'green infrastructure (urban forests, wetlands), and social measures (early warning systems, cooling centers).',
      tags: ['climate', 'flood', 'heat_island', 'green_infra', 'governance'],
      methodology:
        '1. Climate risk assessment: project future hazards using IPCC scenarios (SSP2-4.5, SSP5-8.5).\n' +
        '2. Vulnerability mapping: overlay hazard exposure with socioeconomic sensitivity.\n' +
        '3. Identify adaptation options by hazard: heat (cool roofs, urban forests), flood (retention basins, elevated infrastructure).\n' +
        '4. Cost-benefit analysis: avoided damages vs. adaptation investment over 30-year horizon.\n' +
        '5. Prioritize interventions by cost-effectiveness, co-benefits, and equity.\n' +
        '6. Develop adaptation pathways: sequence interventions as thresholds are crossed.\n' +
        '7. Integrate into local climate action plan and capital improvement program.\n' +
        '8. Monitor Key Performance Indicators: flood frequency, heat-related mortality, insurance claims.',
      tools: ['geopandas', 'rasterio', 'xarray (climate projections)', 'QGIS', 'Google Earth Engine'],
      datasets: [
        'IPCC AR6 downscaled climate projections (CMIP6)',
        'ERA5-Land reanalysis for historical baseline (Copernicus)',
        'Municipal flood zone maps (FEMA FIRM or equivalent)',
        'Hospital and critical infrastructure locations',
        'WorldPop population density grids',
      ],
      examples: [
        'Rotterdam Climate Adaptation Strategy: €233 M investment in water squares, green roofs, and underground storage for 2025 climate-proof target',
        'Copenhagen Cloudburst Management Plan: 300 adaptation projects after 2011 flood (€800 M damage), 70% nature-based solutions',
        'Singapore Coastal Adaptation Study: integrated sea wall + mangrove restoration for 1.0 m sea-level rise scenario by 2100',
      ],
      prompts: [
        `import geopandas as gpd\nimport rasterio\nimport numpy as np\nimport xarray as xr\n\n# 1. Climate vulnerability mapping\n# Load hazard layer (projected flood depth under SSP5-8.5, 2050)\nwith rasterio.open("flood_depth_ssp585_2050.tif") as src:\n    flood = src.read(1)\n    transform = src.transform\n\n# Load exposure (population density)\nwith rasterio.open("population_density.tif") as src:\n    pop = src.read(1)\n\n# Load sensitivity (socioeconomic vulnerability index)\nwith rasterio.open("sevi_index.tif") as src:\n    sevi = src.read(1)\n\n# 2. Composite vulnerability index\ndef norm(arr):\n    return (arr - np.nanmin(arr)) / (np.nanmax(arr) - np.nanmin(arr) + 1e-10)\n\nvulnerability = norm(flood) * 0.4 + norm(pop) * 0.3 + norm(sevi) * 0.3\nprint(f"High vulnerability cells (>0.7): {(vulnerability > 0.7).sum():,}")\nprint(f"Mean vulnerability: {np.nanmean(vulnerability):.3f}")`,
        `# Adaptation cost-benefit analysis\nimport pandas as pd\n\nadaptation_options = pd.DataFrame([\n    {"measure": "Urban forest expansion", "cost_M_EUR": 45, "avoided_damage_M_EUR": 120, "co_benefits": "UHI, air quality, biodiversity"},\n    {"measure": "Retention basins", "cost_M_EUR": 80, "avoided_damage_M_EUR": 200, "co_benefits": "Recreation, groundwater recharge"},\n    {"measure": "Cool roofs mandate", "cost_M_EUR": 15, "avoided_damage_M_EUR": 35, "co_benefits": "Energy savings, comfort"},\n    {"measure": "Elevated infrastructure", "cost_M_EUR": 200, "avoided_damage_M_EUR": 450, "co_benefits": "Flood protection"},\n    {"measure": "Early warning system", "cost_M_EUR": 5, "avoided_damage_M_EUR": 60, "co_benefits": "Health, emergency response"},\n])\nadaptation_options["bcr"] = (adaptation_options["avoided_damage_M_EUR"] / adaptation_options["cost_M_EUR"]).round(1)\nprint(adaptation_options.sort_values("bcr", ascending=False).to_markdown(index=False))`,
      ],
      evidence: [
        'IPCC (2022). Climate Change 2022: Impacts, Adaptation and Vulnerability. Contribution of WG II to AR6.',
        'Hallegatte, S. et al. (2016). Shock Waves: Managing the Impacts of Climate Change on Poverty. World Bank.',
      ],
      limitations:
        'Climate projections carry substantial uncertainty at local scales. ' +
        'Adaptation measures may be maladaptive if poorly designed (e.g., hard flood defenses increasing downstream risk). ' +
        'Costs of transformative adaptation exceed most municipal budgets without national/international support.',
      sdgAlignment: ['11.5.1', '13.1.1', '13.2.1'],
    },

    // -----------------------------------------------------------------------
    // 11. Public Space Activation & Placemaking
    // -----------------------------------------------------------------------
    {
      id: 'iv-public-space-activation',
      title: 'Public Space Activation & Placemaking',
      sectionId: 'intervention_design',
      summary:
        'Strategies for transforming underused public spaces into vibrant community destinations. ' +
        'Draws on Project for Public Spaces (PPS) Power of 10+ framework and Jan Gehl\'s life-between-buildings ' +
        'methodology to design interventions that increase foot traffic, dwell time, and social interaction.',
      tags: ['land_use', 'equity', 'health', 'placemaking'],
      methodology:
        '1. Baseline audit: pedestrian counts, stationary activity mapping (Gehl protocol), intercept surveys.\n' +
        '2. Space-use analysis: time-lapse observation, desire line mapping.\n' +
        '3. Identify intervention types: seating, greening, lighting, programming, wayfinding, art.\n' +
        '4. Co-design with community: participatory workshops, online engagement platforms.\n' +
        '5. Rapid prototyping: temporary installations with 1-3 month evaluation cycles.\n' +
        '6. Post-intervention measurement: same metrics as baseline, plus social media sentiment.\n' +
        '7. Iterate and make permanent if metrics meet thresholds.',
      tools: ['QGIS (pedestrian mapping)', 'geopandas', 'Street View (before/after)'],
      datasets: [
        'Time-lapse pedestrian activity observations (Gehl protocol)',
        'Municipal public space inventory with condition ratings',
        'Social media check-in and review data (anonymised)',
        'Crime statistics by location for safety analysis',
      ],
      examples: [
        "Melbourne's laneways programme: micro-interventions on 30+ laneways transforming service alleys into cultural destinations",
        "Copenhagen Superkilen: 3 zones (red/black/green) designed with 60+ nationalities' input, 73% increase in park use",
        'Seoul Cheonggyecheon: elevated highway demolished, stream restored — 35% increase in adjacent property values',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# Gehl-style public life survey analysis\n# Count stationary + moving activities by time and zone\nsurvey = pd.read_csv("public_life_survey.csv")  # columns: zone, time, activity, count\n\n# Pivot: activity type by zone\npivot = survey.pivot_table(index="zone", columns="activity", values="count", aggfunc="sum", fill_value=0)\nprint(pivot.to_markdown())\n\n# Temporal pattern\nhourly = survey.groupby("time")["count"].sum()\nfig, ax = plt.subplots(figsize=(10, 4))\nhourly.plot(kind="bar", ax=ax, color="#F59E0B")\nax.set_xlabel("Hour")\nax.set_ylabel("Activity count")\nax.set_title("Public Space Activity — Hourly Pattern")\nplt.tight_layout()\nplt.savefig("public_life_hourly.png", dpi=150)`,
        `# Public space quality scoring (PPS Power of 10+ criteria)\nimport pandas as pd\n\ndef pps_score(space):\n    """"Score public space quality on PPS four-dimension framework."""\n    scores = {\n        "Access & Linkages": min(25, space.get("transit_proximity", 0) + space.get("ped_connectivity", 0)),\n        "Comfort & Image": min(25, space.get("seating", 0) + space.get("shade_pct", 0) + space.get("cleanliness", 0)),\n        "Uses & Activities": min(25, space.get("activity_count", 0) / 4),\n        "Sociability": min(25, space.get("dwell_time_avg", 0) * 3),\n    }\n    return scores, sum(scores.values())\n\nspaces = [\n    {"name": "Main Square", "transit_proximity": 15, "ped_connectivity": 8, "seating": 10, "shade_pct": 5, "cleanliness": 8, "activity_count": 45, "dwell_time_avg": 5.2},\n    {"name": "Park Street", "transit_proximity": 5, "ped_connectivity": 12, "seating": 3, "shade_pct": 8, "cleanliness": 6, "activity_count": 12, "dwell_time_avg": 2.1},\n]\nfor sp in spaces:\n    scores, total = pps_score(sp)\n    print(f"{sp['name']}: {total:.0f}/100 — {scores}")`,
      ],
      evidence: [
        'Gehl, J. (2011). Life Between Buildings: Using Public Space. Island Press.',
        'Project for Public Spaces (2016). How to Turn a Place Around: A Placemaking Handbook.',
      ],
      limitations:
        'Placemaking efforts risk accelerating gentrification if not paired with anti-displacement policies. ' +
        'Community engagement is resource-intensive and may not reach marginalised groups.',
      sdgAlignment: ['11.7.1'],
    },

    // -----------------------------------------------------------------------
    // 12. Parking Reform & Management
    // -----------------------------------------------------------------------
    {
      id: 'iv-parking-reform',
      title: 'Parking Reform & Management',
      sectionId: 'intervention_design',
      summary:
        'Policies for reducing over-supply of parking, shifting from minimum to maximum parking requirements, ' +
        'and implementing demand-responsive pricing. Informed by Donald Shoup\'s research on the hidden costs ' +
        'of free parking and emerging shared-mobility paradigms.',
      tags: ['mobility', 'land_use', 'economic', 'climate'],
      methodology:
        '1. Inventory current supply: on-street, off-street, private lot. GIS parcel-level mapping.\n' +
        '2. Measure occupancy rates by time-of-day using sensor data or manual surveys (target 85 %).\n' +
        '3. Calculate effective land cost: parking area × land value per m² + construction amortisation.\n' +
        '4. Model policy scenarios: eliminate minimums, set maximums, demand-responsive pricing.\n' +
        '5. Revenue-recapture analysis: meter revenue, parking benefit district allocation.\n' +
        '6. Equity screening: ensure low-income car-dependent households retain access or alternatives.\n' +
        '7. Transition roadmap: phased implementation with monitoring at 6-month intervals.',
      tools: ['geopandas', 'osmnx (parking inventory)', 'duckdb (survey tabulation)'],
      datasets: [
        'OpenStreetMap parking=* tags (surface, multi-storey, underground)',
        'Municipal parking occupancy sensor data',
        'On-street parking meter transaction records',
        'Parcel-level land-use data with parking area estimates',
      ],
      examples: [
        'San Francisco SFpark: demand-responsive pricing reduced cruising by 50% and parking search time by 43%',
        'Mexico City ecoParq: performance parking program recovering $15 M/yr for neighbourhood improvements',
        'Oslo city centre: removed 700 on-street parking spaces 2017–2019, replaced with bike lanes and plazas, no retail decline',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\n\n# 1. Map parking inventory from OSM\nplace = "Oslo, Norway"\nparking = ox.features_from_place(place, tags={"amenity": "parking"})\nparking = parking[parking.geometry.type.isin(["Polygon", "MultiPolygon"])]\nparking["area_m2"] = parking.to_crs(epsg=3857).geometry.area\n\nprint(f"Parking facilities: {len(parking)}")\nprint(f"Total parking area: {parking['area_m2'].sum() / 10000:.1f} ha")\nprint(f"Average facility size: {parking['area_m2'].mean():.0f} m²")\n\n# 2. Compute parking land cost\nland_value_per_m2 = 5000  # EUR/m2 (city centre estimate)\nparking["land_cost"] = parking["area_m2"] * land_value_per_m2\nprint(f"Total parking land value: €{parking['land_cost'].sum() / 1e6:.0f} M")`,
        `# Parking occupancy analysis (demand-responsive pricing model)\nimport pandas as pd\nimport numpy as np\n\n# Load sensor data\noccupancy = pd.read_csv("parking_occupancy.csv", parse_dates=["timestamp"])\noccupancy["hour"] = occupancy["timestamp"].dt.hour\noccupancy["day"] = occupancy["timestamp"].dt.day_name()\n\n# Target: 85% occupancy (Shoup optimal)\nhourly = occupancy.groupby(["zone", "hour"])["occupancy_pct"].mean().unstack("hour")\n\n# Price adjustment recommendation\ndef price_adjustment(occ_pct, current_rate):\n    if occ_pct > 90: return current_rate * 1.25  # Raise price\n    if occ_pct < 60: return current_rate * 0.75  # Lower price\n    return current_rate  # Keep\n\nfor zone in hourly.index:\n    peak_occ = hourly.loc[zone].max()\n    adj = price_adjustment(peak_occ, current_rate=3.0)\n    print(f"{zone}: peak occupancy {peak_occ:.0f}% → recommended rate: €{adj:.2f}/hr")`,
      ],
      evidence: [
        'Shoup, D. (2005). The High Cost of Free Parking. APA Planners Press.',
        'Willson, R. (2015). Parking Management for Smart Growth. Island Press.',
      ],
      limitations:
        'Parking reform faces strong political opposition from businesses and residents. ' +
        'Demand-responsive pricing requires sensor infrastructure investment. ' +
        'Removing minimums without transit alternatives can burden car-dependent communities.',
      sdgAlignment: ['11.2.1', '11.6.2'],
    },
  ];
}
