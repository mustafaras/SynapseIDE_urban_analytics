import type { Card } from '../lib/types';

/**
 * Monitoring & Reporting seed cards.
 * Covers change detection, KPI dashboards, M&E frameworks, and policy reporting.
 */
export function buildMonitoringReportingCards(_existing?: Set<string>): Card[] {
  return [
    // ── Change Detection & Temporal ──────────────────────────
    {
      id: 'mon-land-cover-change',
      title: 'Land Cover Change Detection',
      sectionId: 'change_detection',
      summary:
        'Detect and quantify land cover transitions between two or more time periods using ' +
        'multi-temporal satellite imagery. Produces a change matrix, transition maps, and ' +
        'area statistics per change class.',
      tags: ['remote_sensing', 'land_use', 'sprawl', 'indicators'],
      methodology:
        '1. Acquire cloud-free imagery for t₁ and t₂ (Sentinel-2, Landsat).\n' +
        '2. Classify each date independently (supervised or ONNX-based).\n' +
        '3. Cross-tabulate class maps to produce change matrix.\n' +
        '4. Filter noise with minimum mapping unit (e.g., 0.5 ha).\n' +
        '5. Compute change area and annual rate per transition type.\n' +
        '6. Map "from-to" change as bi-variate choropleth.',
      tools: ['rasterio', 'scikit-learn', 'GEE', 'QGIS SCP'],
      datasets: [
        'Sentinel-2 Level-2A surface reflectance (10 m, 5-day revisit)',
        'Landsat Collection 2 Level-2 (30 m, since 1972)',
        'Copernicus CORINE Land Cover (100 m, 6-year updates)',
        'GHSL built-up area multitemporal grids (1975–2030)',
      ],
      examples: [
        'Jakarta 2000–2020: 18% agricultural land converted to built-up, quantified via Landsat time-series',
        'Amazon deforestation monitoring (PRODES): annual land cover change maps driving enforcement policy',
        'Istanbul peri-urban expansion: Sentinel-2 change detection identifying 4 200 ha new built-up area 2016–2022',
      ],
      prompts: [
        `import rasterio\nimport numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import confusion_matrix, classification_report\n\n# 1. Load classified images for two dates\nwith rasterio.open("landcover_2015.tif") as src:\n    lc_t1 = src.read(1)\n    profile = src.profile\nwith rasterio.open("landcover_2020.tif") as src:\n    lc_t2 = src.read(1)\n\n# 2. Generate change matrix\nclasses = [1, 2, 3, 4, 5]  # water, forest, agriculture, built-up, bare\nlabels = ["Water", "Forest", "Agriculture", "Built-up", "Bare"]\n\nchange_matrix = confusion_matrix(lc_t1.flatten(), lc_t2.flatten(), labels=classes)\nimport pandas as pd\ncm_df = pd.DataFrame(change_matrix, index=[f"From {l}" for l in labels], columns=[f"To {l}" for l in labels])\nprint("Change Matrix (pixels):")\nprint(cm_df.to_markdown())\n\n# 3. Map "from-to" change\nchange_map = lc_t1 * 10 + lc_t2  # encode transitions as 2-digit code\n# e.g., 34 = agriculture(3) to built-up(4)\nagri_to_urban = (change_map == 34).sum()\nprint(f"\\nAgricultural to Built-up: {agri_to_urban:,} pixels")`,
        `# Annual change rate computation\nimport numpy as np\n\n# Built-up area at two dates (ha)\nbuilt_t1 = 12500  # 2015\nbuilt_t2 = 15800  # 2020\ndt = 5  # years\n\nlcr = ((built_t2 - built_t1) / built_t1) / dt  # Land Consumption Rate\nprint(f"Built-up area: {built_t1:,} ha (2015) \u2192 {built_t2:,} ha (2020)")\nprint(f"Land Consumption Rate: {lcr:.4f} /yr ({lcr*100:.2f}% /yr)")`,
      ],
      evidence: [
        'Zhu, Z. (2017). Change detection using Landsat time series. ISPRS J. Photogrammetry, 130, 370–384.',
        'Copernicus Land Monitoring Service (2018). CORINE Land Cover Change Layer Technical Guide.',
      ],
      limitations:
        'Classification errors propagate into change detection. Cloud cover limits temporal revisit ' +
        'in tropical regions.',
      sdgAlignment: ['SDG 11.3', 'SDG 15.3'],
    },
    {
      id: 'mon-ndvi-temporal-trend',
      title: 'NDVI Temporal Trend Analysis',
      sectionId: 'change_detection',
      summary:
        'Analyse multi-year NDVI time series to detect greening or browning trends in urban vegetation. ' +
        'Uses harmonic regression or Mann-Kendall test per pixel to separate seasonal patterns from long-term trends.',
      tags: ['remote_sensing', 'green_infra', 'climate', 'indicators'],
      methodology:
        '1. Build dense NDVI time series from Sentinel-2 or Landsat.\n' +
        '2. Remove cloud-contaminated observations.\n' +
        '3. Fit harmonic model to capture phenological cycle.\n' +
        '4. Apply Mann-Kendall or Sen slope estimator for trend.\n' +
        '5. Classify pixels as significant greening, browning, or stable.\n' +
        '6. Aggregate to neighbourhood zones for policy reporting.',
      tools: ['GEE', 'xarray', 'scipy (stats)', 'rasterio'],
      datasets: [
        'Sentinel-2 NDVI composites (10 m, bi-weekly)',
        'Landsat NDVI archive (30 m, 1984–present)',
        'MODIS MOD13Q1 16-day NDVI (250 m, 2000–present)',
        'ERA5-Land precipitation data for correlation analysis',
      ],
      examples: [
        'Beijing greening trend 2000–2020: MODIS NDVI showing 0.008/yr increase in urban core from park expansion policy',
        'São Paulo urban heat forest dieback: browning trend detected in 12% of Cantareira watershed',
        'Melbourne drought impact 2018–2019: NDVI decline mapping used to prioritise emergency irrigation of street trees',
      ],
      prompts: [
        `import xarray as xr\nimport numpy as np\nfrom scipy import stats\n\n# 1. Load multi-year NDVI time series\nds = xr.open_dataset("ndvi_timeseries.nc")  # dims: time, y, x\nndvi = ds["ndvi"]\nprint(f"Time range: {ndvi.time.values[0]} to {ndvi.time.values[-1]}")\nprint(f"Shape: {ndvi.shape}")\n\n# 2. Mann-Kendall trend test per pixel\ndef mann_kendall_slope(series):\n    """Compute Sen's slope for a 1D array."""\n    series = series[~np.isnan(series)]\n    if len(series) < 10:\n        return np.nan, np.nan\n    result = stats.kendalltau(np.arange(len(series)), series)\n    # Sen's slope\n    n = len(series)\n    slopes = []\n    for i in range(n):\n        for j in range(i+1, n):\n            slopes.append((series[j] - series[i]) / (j - i))\n    return np.median(slopes), result.pvalue\n\n# 3. Apply to yearly NDVI composites\nyearly = ndvi.groupby("time.year").mean("time")\nslope_map = np.zeros(yearly.shape[1:])\npval_map = np.zeros_like(slope_map)\nfor i in range(yearly.shape[1]):\n    for j in range(yearly.shape[2]):\n        slope_map[i, j], pval_map[i, j] = mann_kendall_slope(yearly[:, i, j].values)\n\ngreening = (slope_map > 0) & (pval_map < 0.05)\nbrowning = (slope_map < 0) & (pval_map < 0.05)\nprint(f"Significant greening: {greening.sum():,} pixels")\nprint(f"Significant browning: {browning.sum():,} pixels")`,
        `# Seasonal decomposition of NDVI\nimport matplotlib.pyplot as plt\n\n# Average NDVI per month across all urban pixels\nmonthly = ndvi.mean(dim=["y", "x"]).groupby("time.month").mean()\nfig, ax = plt.subplots(figsize=(10, 4))\nmonthly.plot(ax=ax, marker="o", color="#228B22")\nax.set_xlabel("Month")\nax.set_ylabel("Mean NDVI")\nax.set_title("Urban Vegetation Phenological Cycle")\nplt.tight_layout()\nplt.savefig("ndvi_phenology.png", dpi=150)`,
      ],
      evidence: [
        'Yin, H. et al. (2017). Mapping urban expansion using multi-temporal Landsat. Remote Sensing of Environment, 195, 199–210.',
        'de Jong, R. et al. (2011). Analysis of monotonic greening and browning trends from global NDVI time-series. Remote Sensing of Environment, 115(2), 692–702.',
      ],
      sdgAlignment: ['SDG 11.7', 'SDG 15.3'],
      limitations:
        'Short time series (<10 yr) may not distinguish trend from interannual variability.',
    },
    {
      id: 'mon-urban-expansion-rate',
      title: 'Urban Expansion Rate Tracking',
      sectionId: 'change_detection',
      summary:
        'Measure annual urban expansion by comparing built-up area masks across time periods. ' +
        'Compute land consumption rate (LCR) and population growth rate (PGR) per SDG 11.3.1.',
      tags: ['sprawl', 'land_use', 'indicators', 'sdg', 'remote_sensing'],
      methodology:
        '1. Extract built-up area masks for two or more dates.\n' +
        '2. Compute LCR = (ΔBuilt-up / Built-up₁) / Δt.\n' +
        '3. Compute PGR from census or GPW data.\n' +
        '4. Calculate LCRPGR ratio (SDG 11.3.1 indicator).\n' +
        '5. Disaggregate by direction or zone (core vs. peri-urban).\n' +
        '6. Visualise as expansion ring map.',
      tools: ['GEE', 'GHSL', 'geopandas', 'rasterio'],
      datasets: [
        'GHSL built-up surface grid (GHS-BUILT-S R2023, 10 m)',
        'Global Human Settlement Layer epoch data (1975–2030)',
        'WorldPop / GPWv4 annual population grids',
        'Administrative boundary polygons (GADM, municipal)',
      ],
      examples: [
        'Lagos 2000–2020: LCRPGR ratio of 1.8 indicating land consumption far exceeds population growth',
        'Bengaluru expansion monitoring: radial buffer analysis showing 15 km urban radius increase in 20 years',
        'Cairo ring road corridor: tracking built-up creep into agricultural delta land at 3.2%/yr',
      ],
      prompts: [
        `import rasterio\nimport geopandas as gpd\nimport numpy as np\n\n# 1. Load GHSL built-up area for two epochs\nwith rasterio.open("GHS_BUILT_2000.tif") as src:\n    built_2000 = src.read(1)\nwith rasterio.open("GHS_BUILT_2020.tif") as src:\n    built_2020 = src.read(1)\n    pixel_area_km2 = abs(src.res[0] * src.res[1]) / 1e6\n\n# 2. Compute areas\narea_2000 = (built_2000 > 50).sum() * pixel_area_km2  # >50% built-up\narea_2020 = (built_2020 > 50).sum() * pixel_area_km2\n\n# 3. SDG 11.3.1 indicator\npop_2000 = 8_500_000  # from census\npop_2020 = 14_200_000\ndt = 20\n\nLCR = np.log(area_2020 / area_2000) / dt\nPGR = np.log(pop_2020 / pop_2000) / dt\nLCRPGR = LCR / PGR if PGR != 0 else float("inf")\n\nprint(f"Built-up area: {area_2000:.0f} km² (2000) \u2192 {area_2020:.0f} km² (2020)")\nprint(f"LCR: {LCR:.4f} /yr")\nprint(f"PGR: {PGR:.4f} /yr")\nprint(f"LCRPGR ratio: {LCRPGR:.2f}")\nprint(f"\u2192 {'Land consumption > population growth' if LCRPGR > 1 else 'Compact growth'}")`,
        `# Expansion direction analysis (radial sectors)\nimport numpy as np\nimport geopandas as gpd\nfrom shapely.geometry import Point\n\ncity_center = Point(lon, lat)\n# Create 8 directional sectors (N, NE, E, SE, S, SW, W, NW)\ndirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]\nfor i, d in enumerate(directions):\n    # Filter new built-up pixels in this sector\n    angle_start = i * 45 - 22.5\n    angle_end = angle_start + 45\n    # ... compute sector polygon and count new pixels\n    print(f"{d}: expansion area in this direction")`,
      ],
      evidence: [
        'Angel, S. et al. (2016). Atlas of Urban Expansion. Lincoln Institute of Land Policy.',
        'Schiavina, M. et al. (2023). GHS-BUILT-S R2023A. European Commission, JRC.',
      ],
      limitations:
        'Built-up definition varies across data products. Night-lights and optical methods may disagree.',
      sdgAlignment: ['SDG 11.3'],
    },
    {
      id: 'mon-building-permit-tracker',
      title: 'Building Permit Activity Tracker',
      sectionId: 'change_detection',
      summary:
        'Monitor construction activity by geocoding and mapping building permit data over time. ' +
        'Identifies hotspots of development, demolition, and renovation activity.',
      tags: ['land_use', 'density', 'housing', 'indicators'],
      methodology:
        '1. Obtain building permit records with address and date.\n' +
        '2. Geocode addresses to point locations.\n' +
        '3. Classify by type: new construction, demolition, renovation, change-of-use.\n' +
        '4. Aggregate to grid cells or neighbourhoods by time period.\n' +
        '5. Compute permit density and trend.\n' +
        '6. Map as animated heatmap or time series chart.',
      tools: ['geocoding API', 'geopandas', 'kepler.gl'],
      datasets: [
        'Municipal building permit database (new, demo, renovation)',
        'Geocoding service (Google, Nominatim, or municipal gazetteer)',
        'Administrative boundary polygons for aggregation',
        'Property value assessments for fiscal analysis',
      ],
      examples: [
        'NYC DOB permit tracker: 50 000+ annual permits mapped showing development hotspots in Brooklyn/Queens for housing policy',
        'Berlin Bauakte digital: construction permit data linked with housing production targets per Bezirk',
        'São Paulo CEPEÇ: permit data revealing 80% of new construction concentrated in 5 of 32 subprefeituras',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nfrom geopy.geocoders import Nominatim\n\n# 1. Load and geocode permits\npermits = pd.read_csv("building_permits.csv")\nprint(f"Total permits: {len(permits):,}")\n\n# Geocode (batch, with rate limiting)\ngeolocator = Nominatim(user_agent="urban_analytics")\n\ndef geocode_address(address):\n    try:\n        loc = geolocator.geocode(address, timeout=10)\n        return (loc.latitude, loc.longitude) if loc else (None, None)\n    except: return (None, None)\n\n# Apply (use cached results in production)\npermits[["lat", "lon"]] = permits["address"].apply(\n    lambda a: pd.Series(geocode_address(a))\n)\nsuccess_rate = permits["lat"].notna().mean() * 100\nprint(f"Geocoding success rate: {success_rate:.1f}%")\n\n# 2. Convert to GeoDataFrame\npermits_gdf = gpd.GeoDataFrame(\n    permits.dropna(subset=["lat"]),\n    geometry=gpd.points_from_xy(permits.dropna(subset=["lat"])["lon"], permits.dropna(subset=["lat"])["lat"]),\n    crs="EPSG:4326"\n)`,
        `# Permit density heatmap by neighbourhood and year\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\npermits_gdf["year"] = pd.to_datetime(permits_gdf["date"]).dt.year\npivot = permits_gdf.pivot_table(index="neighbourhood", columns="year", values="permit_id", aggfunc="count", fill_value=0)\n\nfig, ax = plt.subplots(figsize=(12, 8))\nimport seaborn as sns\nsns.heatmap(pivot, cmap="YlOrRd", annot=True, fmt="d", ax=ax)\nax.set_title("Building Permit Activity by Neighbourhood and Year")\nplt.tight_layout()\nplt.savefig("permit_heatmap.png", dpi=150)`,
      ],
      evidence: [
        'Glaeser, E. & Gyourko, J. (2005). Urban Decline and Durable Housing. Journal of Political Economy, 113(2), 345–375.',
        'Gyourko, J. et al. (2008). A New Measure of the Local Regulatory Environment for Housing Markets. Urban Studies, 45(3), 693–729.',
      ],
      sdgAlignment: ['SDG 11.1', 'SDG 11.3'],
      limitations:
        'Permit data is incomplete in many jurisdictions. Geocoding errors affect spatial accuracy.',
    },

    // ── KPI Dashboard & Benchmarking ─────────────────────────
    {
      id: 'kpi-sdg11-dashboard',
      title: 'SDG 11 Indicator Dashboard',
      sectionId: 'kpi_dashboard',
      summary:
        'Compute and visualise the core SDG 11 "Sustainable Cities" indicators: housing adequacy ' +
        '(11.1.1), transit access (11.2.1), urbanisation rate (11.3.1), disaster losses (11.5.1), ' +
        'air quality (11.6.1), and green space (11.7.1).',
      tags: ['sdg', 'indicators', 'equity', 'policy', 'governance'],
      methodology:
        '1. Source data for each indicator from national statistics, remote sensing, or local surveys.\n' +
        '2. Calculate indicator values at municipal and sub-municipal scales.\n' +
        '3. Benchmark against national targets and peer cities.\n' +
        '4. Present in dashboard with sparklines, gauges, and maps.\n' +
        '5. Add trend arrows (improving / stable / declining).\n' +
        '6. Export as structured JSON for reporting engine.',
      tools: ['dashboard frameworks', 'geopandas', 'chart libraries'],
      datasets: [
        'UN-Habitat Global Urban Indicators Database',
        'National census and household survey microdata',
        'WHO Global Health Observatory (air quality, mortality)',
        'GHSL population and built-up grids for SDG 11.3.1',
      ],
      examples: [
        'Bogotá SDG Local Dashboard: 11 SDG 11 indicators tracked quarterly, integrated with Observatorio Ambiental',
        'Berlin Sustainable Development Monitoring: 24 indicators mapped at Bezirk level with traffic-light system',
        'Accra SDG 11 Voluntary Local Review: first sub-Saharan VLR linking satellite data with household surveys',
      ],
      prompts: [
        `import pandas as pd\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# SDG 11 Indicator Computation\nsdg11 = {}\n\n# 11.1.1 - Proportion living in slums/inadequate housing\nsdg11["11.1.1"] = {"value": 12.5, "unit": "%", "target": 0, "trend": "declining"}\n\n# 11.2.1 - Access to public transport (within 500m of stop)\nsdg11["11.2.1"] = {"value": 78.3, "unit": "%", "target": 100, "trend": "improving"}\n\n# 11.3.1 - LCRPGR ratio\nsdg11["11.3.1"] = {"value": 1.45, "unit": "ratio", "target": 1.0, "trend": "worsening"}\n\n# 11.6.1 - Municipal solid waste collected\nsdg11["11.6.1"] = {"value": 89.0, "unit": "%", "target": 100, "trend": "stable"}\n\n# 11.7.1 - Public open space per capita\nsdg11["11.7.1"] = {"value": 6.8, "unit": "m²/person", "target": 15.0, "trend": "improving"}\n\n# Display dashboard table\ndf = pd.DataFrame(sdg11).T\ndf.index.name = "Indicator"\nprint(df.to_markdown())\n\n# Radar chart\nlabels = list(sdg11.keys())\nvalues = [min(1, v["value"] / max(v["target"], 1)) for v in sdg11.values()]\nangles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()\nvalues += values[:1]\nangles += angles[:1]\n\nfig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))\nax.fill(angles, values, alpha=0.25, color="#F59E0B")\nax.plot(angles, values, color="#F59E0B", linewidth=2)\nax.set_xticks(angles[:-1])\nax.set_xticklabels(labels)\nax.set_title("SDG 11 Dashboard")\nplt.tight_layout()\nplt.savefig("sdg11_radar.png", dpi=150)`,
      ],
      evidence: [
        'UN (2017). SDG Indicator Metadata — Goal 11. United Nations Statistics Division.',
        'Klopp, J. M. & Petretta, D. L. (2017). The urban sustainable development goal: Indicators, complexity and the politics of measuring cities. Cities, 63, 92–97.',
      ],
      limitations:
        'Not all SDG 11 indicators have established methodologies at sub-national level. ' +
        'Data availability is the primary constraint.',
      sdgAlignment: ['SDG 11.1', 'SDG 11.2', 'SDG 11.3', 'SDG 11.6', 'SDG 11.7'],
    },
    {
      id: 'kpi-city-benchmarking',
      title: 'City Performance Benchmarking',
      sectionId: 'kpi_dashboard',
      summary:
        'Compare urban performance across peer cities or neighbourhoods using composite indicators. ' +
        'Supports ISO 37120 City Indicators, WCCD, and custom benchmarking frameworks.',
      tags: ['indicators', 'governance', 'sdg', 'policy'],
      methodology:
        '1. Select indicator framework (ISO 37120, SDGs, or custom).\n' +
        '2. Collect data for study city and comparators.\n' +
        '3. Normalise indicators to common scale (z-score or min-max).\n' +
        '4. Compute spider/radar diagrams per city.\n' +
        '5. Rank cities by composite score or selected theme.\n' +
        '6. Identify strengths and weaknesses relative to peer group.',
      tools: ['radar charts', 'pandas', 'dashboard frameworks'],
      datasets: [
        'ISO 37120 certified city indicator datasets (WCCD)',
        'OECD Metropolitan Database',
        'Eurostat Urban Audit city statistics',
        'UN-Habitat City Prosperity Index data',
      ],
      examples: [
        'WCCD Toronto: ISO 37120 certified city benchmarked against 100+ cities on 46 core indicators',
        'OECD Metropolitan Benchmarking: Paris vs. London vs. Berlin on productivity, environment, and well-being',
        'C40 Cities dashboard: GHG emissions per capita comparison across 97 member cities',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# City benchmarking with radar chart\ncities = pd.DataFrame({\n    "city": ["City A", "City B", "City C", "Peer Average"],\n    "transit_access": [82, 65, 91, 72],       # % pop within 500m of transit\n    "green_space_pc": [12, 8, 18, 11],        # m² per capita\n    "air_quality": [75, 55, 88, 68],          # AQI score (inverse, higher=better)\n    "housing_afford": [45, 72, 38, 55],       # % income on housing (inverse)\n    "waste_recycling": [42, 28, 65, 38],      # % recycled\n    "safety_index": [78, 60, 85, 72],         # safety perception\n})\n\n# Normalise to 0-1\ncols = [c for c in cities.columns if c != "city"]\nnormed = cities.copy()\nfor c in cols:\n    normed[c] = (cities[c] - cities[c].min()) / (cities[c].max() - cities[c].min())\n\n# Radar chart\nangles = np.linspace(0, 2*np.pi, len(cols), endpoint=False).tolist()\nangles += angles[:1]\n\nfig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))\nfor _, row in normed.iterrows():\n    values = row[cols].tolist() + [row[cols[0]]]\n    ax.plot(angles, values, label=row["city"], linewidth=2)\n    ax.fill(angles, values, alpha=0.1)\nax.set_xticks(angles[:-1])\nax.set_xticklabels(cols, fontsize=9)\nax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))\nax.set_title("City Performance Benchmarking")\nplt.tight_layout()\nplt.savefig("city_benchmark.png", dpi=150)`,
      ],
      evidence: [
        'ISO 37120:2018. Sustainable development of communities — Indicators for city services and quality of life.',
        'Morais, P. & Camanho, A. S. (2011). Evaluation of performance of European cities with the aim to promote quality of life improvements. Omega, 39(4), 398–409.',
      ],
      sdgAlignment: ['SDG 11.a'],
      limitations:
        'Benchmarking across different national contexts requires careful normalisation. ' +
        'Data definitions may vary between cities.',
    },
    {
      id: 'kpi-realtime-monitor',
      title: 'Real-Time Urban Monitoring',
      sectionId: 'kpi_dashboard',
      summary:
        'Connect to IoT sensor feeds, transit APIs, and air quality stations to display live ' +
        'urban performance metrics. Supports threshold alerts and rolling-average dashboards.',
      tags: ['indicators', 'air_quality', 'traffic', 'energy', 'water'],
      methodology:
        '1. Identify data feeds: traffic loops, AQI sensors, energy meters, transit GTFS-RT.\n' +
        '2. Ingest via REST/WebSocket connectors.\n' +
        '3. Apply quality control and gap-filling.\n' +
        '4. Compute rolling aggregates (5-min, hourly, daily).\n' +
        '5. Display on live dashboard with map and time-series panels.\n' +
        '6. Trigger alerts when thresholds are exceeded.',
      tools: ['WebSocket', 'MQTT', 'time-series DB', 'dashboard frameworks'],
      datasets: [
        'Municipal air quality sensor network (PM2.5, NO₂, O₃)',
        'GTFS-Realtime transit feeds (vehicle positions, delays)',
        'Traffic loop detector data (volume, speed, occupancy)',
        'Smart meter energy consumption feeds',
      ],
      examples: [
        'Barcelona Sentilo: 19 000 IoT sensors feeding real-time dashboard for noise, air quality, and waste levels',
        'London Air Quality Network: 100+ stations with 15-min AQI updates and threshold alerts',
        'Helsinki Energy Weather Station: real-time building energy + outdoor temp correlation dashboard',
      ],
      prompts: [
        `import requests\nimport pandas as pd\nfrom datetime import datetime, timedelta\n\n# 1. Fetch air quality data from OpenAQ API\nurl = "https://api.openaq.org/v2/measurements"\nparams = {\n    "city": "Barcelona",\n    "parameter": "pm25",\n    "date_from": (datetime.now() - timedelta(hours=24)).isoformat(),\n    "limit": 1000,\n}\nresp = requests.get(url, params=params, timeout=30)\ndata = resp.json()["results"]\n\ndf = pd.DataFrame([{\n    "station": r["location"],\n    "time": r["date"]["utc"],\n    "pm25": r["value"],\n} for r in data])\n\nprint(f"Stations: {df['station'].nunique()}")\nprint(f"Readings: {len(df)}")\nprint(f"Current avg PM2.5: {df['pm25'].mean():.1f} µg/m³")\n\n# Alert check\nWHO_THRESHOLD = 15  # WHO 2021 annual guideline\nexceedances = df.groupby("station")["pm25"].max()\nalerts = exceedances[exceedances > WHO_THRESHOLD * 2]  # 2x daily\nif not alerts.empty:\n    print(f"\\n⚠ ALERT: {len(alerts)} stations exceeding threshold!")\n    print(alerts.to_markdown())`,
        `# Rolling average dashboard data\nimport pandas as pd\n\n# Simulate time-series data\ndf["time"] = pd.to_datetime(df["time"])\nhourly = df.set_index("time").resample("1H")["pm25"].mean()\nhourly_rolling = hourly.rolling(window=6, min_periods=1).mean()\nprint("Hourly rolling average (last 12h):")\nprint(hourly_rolling.tail(12).round(1).to_markdown())`,
      ],
      evidence: [
        'Kitchin, R. (2014). The real-time city? Big data and smart urbanism. GeoJournal, 79(1), 1–14.',
        'Zanella, A. et al. (2014). Internet of Things for Smart Cities. IEEE IoT Journal, 1(1), 22–32.',
      ],
      sdgAlignment: ['SDG 11.6', 'SDG 3.9'],
      limitations:
        'Sensor coverage is uneven. Data gaps require interpolation that introduces uncertainty.',
    },
    {
      id: 'kpi-equity-scorecard',
      title: 'Equity Scorecard & Gap Analysis',
      sectionId: 'kpi_dashboard',
      summary:
        'Measure distributional equity of urban services across income groups, gender, disability, ' +
        'and spatial zones. Produces gap scores and priority maps for targeted investment.',
      tags: ['equity', 'accessibility', 'indicators', 'governance', 'sdg'],
      methodology:
        '1. Define service dimensions: transit, green space, health, education, broadband.\n' +
        '2. Compute access indicator per population group and zone.\n' +
        '3. Calculate gap = benchmark − actual for each dimension.\n' +
        '4. Weight gaps by population and deprivation.\n' +
        '5. Produce composite equity score per zone.\n' +
        '6. Map priority areas as heat surface.\n' +
        '7. Present scorecard with gap visualisations.',
      tools: ['geopandas', 'isochrone APIs', 'chart libraries'],
      datasets: [
        'Census demographic data (income, race/ethnicity, age, disability)',
        'GTFS transit feeds for accessibility isochrones',
        'Municipal service locations (parks, schools, hospitals)',
        'Broadband coverage maps (FCC or national equivalent)',
      ],
      examples: [
        'Los Angeles equity scorecard: mapping transit access gap between South LA (65%) and Westside (95%) within 500m of bus/rail',
        'Nairobi health facility access: 45% of informal settlement residents >30 min walk from nearest clinic',
        'Toronto Strong Neighbourhoods Strategy: 31 priority areas identified through composite equity index',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# 1. Compute equity scorecard for urban services\nzones = gpd.read_file("census_zones.gpkg")\n\n# Access indicators (pre-computed)\nzones["transit_access_pct"] = zones["pop_within_500m_transit"] / zones["total_pop"] * 100\nzones["green_access_pct"] = zones["pop_within_300m_park"] / zones["total_pop"] * 100\nzones["health_access_pct"] = zones["pop_within_15min_hospital"] / zones["total_pop"] * 100\n\n# 2. Compute gap score (benchmark - actual)\nbenchmarks = {"transit_access_pct": 90, "green_access_pct": 80, "health_access_pct": 95}\nfor indicator, benchmark in benchmarks.items():\n    zones[f"{indicator}_gap"] = np.maximum(0, benchmark - zones[indicator])\n\n# 3. Composite equity score (weighted by deprivation)\nzones["deprivation_weight"] = zones["poverty_rate"] / zones["poverty_rate"].max()\nzones["equity_score"] = (\n    zones["transit_access_pct_gap"] * 0.35 +\n    zones["green_access_pct_gap"] * 0.35 +\n    zones["health_access_pct_gap"] * 0.30\n) * zones["deprivation_weight"]\n\nprint("Top 10 priority zones:")\nprint(zones.nlargest(10, "equity_score")[["zone_name", "equity_score", "poverty_rate"]].to_markdown())`,
        `# Gap visualisation: bar chart by income quintile\nimport matplotlib.pyplot as plt\n\nquintiles = zones.groupby("income_quintile").agg(\n    transit=(“transit_access_pct", "mean"),\n    green=(“green_access_pct”, "mean"),\n    health=(“health_access_pct”, "mean"),\n).round(1)\n\nfig, ax = plt.subplots(figsize=(10, 6))\nquintiles.plot(kind="bar", ax=ax, color=["#4299E1", "#48BB78", "#E53E3E"])\nax.set_xlabel("Income Quintile (1=lowest)")\nax.set_ylabel("Access rate (%)")\nax.set_title("Service Access by Income Quintile")\nax.axhline(y=80, color="gray", linestyle="--", label="Benchmark (80%)")\nax.legend()\nplt.tight_layout()\nplt.savefig("equity_gaps.png", dpi=150)`,
      ],
      evidence: [
        'Pereira, R. H. M. et al. (2021). Geographic access to COVID-19 healthcare in Brazil. PLOS ONE, 16(7).',
        'Karner, A. et al. (2020). From transportation equity to transportation justice. Journal of Planning Literature, 35(2), 190–205.',
      ],
      limitations:
        'Equity measurement depends on how "need" and "access" are defined. Intersectional analysis ' +
        'requires granular demographic data.',
      sdgAlignment: ['SDG 10.2', 'SDG 11.1'],
    },

    // ── M&E Frameworks ───────────────────────────────────────
    {
      id: 'me-logframe',
      title: 'Logical Framework (LogFrame)',
      sectionId: 'monitoring_eval',
      summary:
        'Design a results-based monitoring framework using the Logical Framework Approach (LFA). ' +
        'Links project inputs → activities → outputs → outcomes → impact with verifiable indicators ' +
        'and assumptions at each level.',
      tags: ['governance', 'policy', 'indicators', 'sdg'],
      methodology:
        '1. Define overall objective (impact) and specific objective (outcome).\n' +
        '2. List outputs and activities.\n' +
        '3. Assign objectively verifiable indicators (OVI) per level.\n' +
        '4. Specify means of verification (MoV) for each indicator.\n' +
        '5. State assumptions and risks per level.\n' +
        '6. Present as LogFrame matrix (4 × 4).',
      tools: ['matrix tables', 'project management tools'],
      datasets: [
        'Project document with objectives and activities',
        'National statistical indicators for baseline values',
        'Administrative monitoring data (attendance, outputs)',
        'Budget allocation spreadsheets',
      ],
      examples: [
        'World Bank GEF Urban Resilience: LogFrame linking $50 M investment to flood-risk reduction outcome via 12 output indicators',
        'UN-Habitat City Prosperity Initiative: LogFrame for 5-year urban upgrading programme in Nairobi',
        'EU URBACT network: standardised LogFrame template for 28 city-led urban innovation projects',
      ],
      prompts: [
        `import pandas as pd\n\n# Generate a Logical Framework Matrix\nlogframe = pd.DataFrame([\n    {"level": "Impact", "description": "Improved quality of life in target neighbourhood",\n     "indicator": "% residents reporting improved well-being (survey)",\n     "baseline": "45%", "target": "70% by 2028", "mov": "Household survey (biennial)",\n     "assumptions": "Political stability; continued funding"},\n    {"level": "Outcome", "description": "Increased access to quality public spaces",\n     "indicator": "m² of public space per capita within 300m walk",\n     "baseline": "3.2 m²", "target": "8.0 m² by 2027", "mov": "GIS analysis + field survey",\n     "assumptions": "Land acquisition completed; community support"},\n    {"level": "Output 1", "description": "3 new neighbourhood parks constructed",\n     "indicator": "Number of parks completed",\n     "baseline": "0", "target": "3 by 2026", "mov": "Completion certificates",\n     "assumptions": "Procurement on schedule"},\n    {"level": "Output 2", "description": "Street greening on 5 corridors",\n     "indicator": "km of streets with tree planting",\n     "baseline": "0 km", "target": "12 km by 2026", "mov": "GIS + site photos",\n     "assumptions": "Species availability; irrigation access"},\n    {"level": "Activity", "description": "Community design workshops",\n     "indicator": "Number of workshops; participants per workshop",\n     "baseline": "0", "target": "12 workshops, 30+ participants each", "mov": "Attendance registers",\n     "assumptions": "Active community engagement"},\n])\nprint(logframe.to_markdown(index=False))`,
      ],
      evidence: [
        'European Commission (2004). Project Cycle Management Guidelines — Logical Framework.',
        'NORAD (1999). The Logical Framework Approach. Norwegian Agency for Development Cooperation.',
      ],
      sdgAlignment: ['SDG 17.14'],
      limitations:
        'LogFrames are static; they do not easily accommodate emergent or adaptive programming.',
    },
    {
      id: 'me-theory-of-change',
      title: 'Theory of Change (ToC)',
      sectionId: 'monitoring_eval',
      summary:
        'Map the causal pathways from project activities to long-term urban outcomes using a ' +
        'Theory of Change diagram. Captures assumptions, preconditions, and intermediate outcomes ' +
        'necessary for impact.',
      tags: ['governance', 'policy', 'participation'],
      methodology:
        '1. Identify long-term goal.\n' +
        '2. Work backwards: what preconditions must hold?\n' +
        '3. Map intermediate outcomes along causal chains.\n' +
        '4. Identify interventions that trigger each outcome.\n' +
        '5. State assumptions at each link.\n' +
        '6. Visualise as a directed diagram (left-to-right or bottom-up).',
      tools: ['diagramming tools', 'Mermaid.js', 'workshop facilitation'],
      datasets: [
        'Stakeholder interview transcripts and workshop outputs',
        'Literature review on causal mechanisms in the domain',
        'Existing programme documents and strategic plans',
        'Baseline survey data for assumption validation',
      ],
      examples: [
        'UK DFID climate resilience programme: ToC mapping 5 causal pathways from early warning to reduced mortality',
        'Bloomberg Philanthropies What Works Cities: ToC linking data capacity building to improved urban governance',
        'C40 Cities Deadline 2020: ToC for 1.5°C-compatible urban actions across transport, buildings, waste sectors',
      ],
      prompts: [
        `# Generate Theory of Change as Mermaid diagram\ntoc_mermaid = """\ngraph LR\n    A[Intervention: Protected bike lanes] --> B[Output: 50 km new bike infrastructure]\n    B --> C[Outcome 1: 30% increase in cycling mode share]\n    B --> D[Outcome 2: 40% reduction in cyclist injuries]\n    C --> E[Impact: Reduced transport GHG emissions]\n    D --> F[Impact: Improved road safety]\n    E --> G[Long-term: Climate-resilient, liveable city]\n    F --> G\n    \n    style A fill:#F59E0B,color:#000\n    style G fill:#48BB78,color:#000\n    \n    %% Assumptions\n    B -.->|Assumption: Budget approved| C\n    C -.->|Assumption: Mode shift sustained| E\n    D -.->|Assumption: Driver compliance| F\n"""\n\nwith open("toc_diagram.mmd", "w") as f:\n    f.write(toc_mermaid)\nprint("Theory of Change diagram written to toc_diagram.mmd")\nprint("Render with: mmdc -i toc_diagram.mmd -o toc_diagram.png")`,
        `# Assumption validation tracker\nimport pandas as pd\n\nassumptions = pd.DataFrame([\n    {"id": "A1", "assumption": "Budget approved by council", "status": "Confirmed", "risk": "Low", "evidence": "Council vote passed 12/3"},\n    {"id": "A2", "assumption": "Community support for lane reallocation", "status": "Partial", "risk": "Medium", "evidence": "Survey: 62% support, 25% opposed"},\n    {"id": "A3", "assumption": "Driver compliance with new speed limits", "status": "Untested", "risk": "High", "evidence": "No baseline data yet"},\n    {"id": "A4", "assumption": "Mode shift sustained beyond pilot period", "status": "Untested", "risk": "Medium", "evidence": "Peer city data suggests 70% retention"},\n])\nprint(assumptions.to_markdown(index=False))`,
      ],
      evidence: [
        'Weiss, C. H. (1995). Nothing as Practical as Good Theory. In Connell et al. (Eds.), New Approaches to Evaluating Community Initiatives. Aspen.',
        'Taplin, D. H. & Clark, H. (2012). Theory of Change Basics. ActKnowledge.',
      ],
      sdgAlignment: ['SDG 17.14'],
      limitations:
        'ToC requires robust stakeholder input. Oversimplified diagrams risk hiding complexity.',
    },
    {
      id: 'me-spatial-me',
      title: 'Spatial M&E / Geo-Enabled Monitoring',
      sectionId: 'monitoring_eval',
      summary:
        'Integrate geospatial data into monitoring and evaluation workflows. Track where ' +
        'interventions are delivered, which areas benefit, and how spatial patterns of impact ' +
        'evolve over time.',
      tags: ['indicators', 'remote_sensing', 'governance', 'sdg'],
      methodology:
        '1. Geocode all project sites and beneficiary locations.\n' +
        '2. Define spatial indicators (coverage area, beneficiary density).\n' +
        '3. Collect baseline and endline spatial data.\n' +
        '4. Compare before/after satellite imagery or survey maps.\n' +
        '5. Produce spatial dashboards showing coverage gaps.\n' +
        '6. Integrate with results framework for reporting.',
      tools: ['geopandas', 'QGIS', 'GEE', 'dashboard frameworks'],
      datasets: [
        'Project site coordinates and intervention boundaries',
        'Satellite imagery for before/after comparison',
        'Beneficiary household survey with GPS coordinates',
        'Municipal administrative boundary polygons',
      ],
      examples: [
        'IFAD Kenya KCEP-CRAL: geospatial M&E tracking 200 000 beneficiary farms with Planet imagery change detection',
        'World Bank Sahel irrigation programme: Sentinel-2 NDVI monitoring of 85 intervention sites vs. control plots',
        'UN-Habitat Afghanistan WASH: GPS-tracked water point construction with 500 m coverage mapping',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# 1. Load project sites and beneficiary data\nsites = gpd.read_file("intervention_sites.gpkg")\nbeneficiaries = gpd.read_file("beneficiary_households.gpkg")\n\n# 2. Coverage analysis: buffer around sites\nsites["coverage_500m"] = sites.geometry.buffer(500)\ncoverage_union = sites.set_geometry("coverage_500m").unary_union\n\n# 3. Count served vs. unserved beneficiaries\nbeneficiaries["served"] = beneficiaries.geometry.within(coverage_union)\nserved_pct = beneficiaries["served"].mean() * 100\nprint(f"Beneficiaries within 500m of intervention: {served_pct:.1f}%")\nprint(f"Coverage gap: {100 - served_pct:.1f}% ({(~beneficiaries['served']).sum():,} households)")\n\n# 4. Map coverage\nfig, ax = plt.subplots(figsize=(12, 10))\nsites.set_geometry("coverage_500m").plot(ax=ax, alpha=0.2, color="green", label="Coverage area")\nsites.plot(ax=ax, color="red", markersize=20, label="Sites")\nbeneficiaries[~beneficiaries["served"]].plot(ax=ax, color="orange", markersize=2, label="Unserved")\nax.legend()\nax.set_title("Spatial Coverage Analysis")\nplt.savefig("spatial_coverage.png", dpi=150)`,
      ],
      evidence: [
        'IFAD (2019). How to Use Geospatial Data for Programme M&E. IFAD Technical Note.',
        'Jia, X. et al. (2019). Mapping the structure of social vulnerability via satellite imagery for disaster risk reduction. Computers, Environment and Urban Systems, 78, 101394.',
      ],
      sdgAlignment: ['SDG 11.a', 'SDG 17.18'],
      limitations:
        'Quality of geocoding determines spatial accuracy. Remote sensing cannot measure process indicators.',
    },
    {
      id: 'me-participatory-eval',
      title: 'Participatory Evaluation Methods',
      sectionId: 'monitoring_eval',
      summary:
        'Engage communities in evaluating urban projects through participatory mapping, ' +
        'community scorecards, and citizen report cards. Complements quantitative M&E with ' +
        'qualitative community perspectives.',
      tags: ['participation', 'governance', 'equity'],
      methodology:
        '1. Select participatory tool: community scorecard, citizen report card, or participatory mapping.\n' +
        '2. Train facilitators and prepare materials.\n' +
        '3. Conduct sessions with diverse stakeholder groups.\n' +
        '4. Compile findings into evaluation matrix.\n' +
        '5. Triangulate with quantitative indicators.\n' +
        '6. Feed back results to communities and decision-makers.',
      tools: ['survey tools', 'KoboToolbox', 'OSM', 'facilitation guides'],
      datasets: [
        'Community scorecard templates (sector-specific)',
        'KoBoToolbox / ODK household survey forms',
        'Participatory mapping outputs (OSM, paper maps)',
        'Focus group transcripts (anonymised)',
      ],
      examples: [
        'CARE Malawi: community score card used in 38 health facilities resulting in 35% improvement in service satisfaction',
        'Slum Dwellers International Know Your City: participatory settlement profiling in 230 cities across 38 countries',
        'Medellín Urban Improvement Programme: participatory evaluation of 12 PUI zones with 5 000+ community members',
      ],
      prompts: [
        `import pandas as pd\nimport matplotlib.pyplot as plt\n\n# Community scorecard analysis\nscorecard = pd.DataFrame({\n    "service_dimension": ["Water supply", "Road quality", "Waste collection", "Public safety", "Health clinic", "School access"],\n    "community_score": [2.8, 1.5, 3.2, 2.1, 3.8, 4.1],  # 1-5 scale\n    "provider_score": [3.5, 2.0, 3.0, 3.2, 3.5, 4.0],\n    "n_respondents": [85, 85, 85, 85, 60, 72],\n})\nscorecard["gap"] = (scorecard["provider_score"] - scorecard["community_score"]).round(1)\nprint("Community Scorecard Results:")\nprint(scorecard.to_markdown(index=False))\n\n# Comparison bar chart\nfig, ax = plt.subplots(figsize=(10, 6))\nx = range(len(scorecard))\nwidth = 0.35\nax.barh([i - width/2 for i in x], scorecard["community_score"], width, label="Community", color="#F59E0B")\nax.barh([i + width/2 for i in x], scorecard["provider_score"], width, label="Provider", color="#4299E1")\nax.set_yticks(list(x))\nax.set_yticklabels(scorecard["service_dimension"])\nax.set_xlabel("Score (1-5)")\nax.legend()\nax.set_title("Community vs. Provider Service Assessment")\nplt.tight_layout()\nplt.savefig("community_scorecard.png", dpi=150)`,
      ],
      evidence: [
        'Chambers, R. (2002). Participatory Workshops: A Sourcebook of 21 Sets of Ideas and Activities. Earthscan.',
        'Singh, R. & Mangioni, V. (2020). Community scorecards for improved urban service delivery. Environment and Urbanization, 32(1), 123–142.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 16.7'],
      limitations:
        'Selection bias in participant recruitment. Facilitation quality affects data reliability.',
    },

    // ── Reports & Policy Briefs ──────────────────────────────
    {
      id: 'rep-analytical-report',
      title: 'Analytical Report Structure',
      sectionId: 'reports_briefs',
      summary:
        'Generate a structured analytical report combining spatial analysis results, charts, maps, ' +
        'and narrative text. Follows an academic-professional format: executive summary, methodology, ' +
        'findings, recommendations, limitations.',
      tags: ['policy', 'governance', 'indicators'],
      methodology:
        '1. Assemble analysis outputs (maps, charts, tables, statistics).\n' +
        '2. Draft executive summary with key findings.\n' +
        '3. Document methodology with reproducibility notes.\n' +
        '4. Present findings with embedded figures and spatial references.\n' +
        '5. Formulate evidence-based recommendations.\n' +
        '6. State limitations and data quality caveats.\n' +
        '7. Export as PDF, DOCX, or HTML.',
      tools: ['report engine', 'Quarto', 'html2pdf', 'Markdown'],
      datasets: [
        'Analysis outputs (GeoPackage, CSV, raster results)',
        'Map figures exported as SVG/PNG from QGIS or Python',
        'Statistical tables and regression output summaries',
        'Metadata records (data sources, CRS, temporal extent)',
      ],
      examples: [
        'UN-Habitat Global Urban Monitoring Framework: 77-indicator report published across 200+ cities',
        'London Datastore Annual Infrastructure Report: Quarto-generated analytical report with 45 embedded maps',
        'World Bank Urbanization Review Kenya: 120-page analytical report combining 14 spatial analyses with policy recommendations',
      ],
      prompts: [
        `# Auto-generate analytical report skeleton with Quarto
report_qmd = """
---
title: "Urban Green Space Accessibility Analysis"
author: "Urban Analytics Unit"
date: today
format:
  pdf:
    toc: true
    number-sections: true
bibliography: references.bib
---

# Executive Summary

This report analyses pedestrian accessibility to green spaces (>0.5 ha)
across the metropolitan area using network-distance isochrone methods.
Key finding: **38% of residents lack access to green space within a
10-minute walk**, with the deficit concentrated in eastern districts.

# Methodology

~~~{python}
import geopandas as gpd, osmnx as ox, matplotlib.pyplot as plt

green = gpd.read_file("green_spaces.gpkg")
pop = gpd.read_file("population_grid_100m.gpkg")

G = ox.graph_from_place("City Name", network_type="walk")
# ... isochrone analysis code
~~~

# Results

![Green space accessibility map](figures/accessibility_map.png){#fig-access}

# Recommendations

1. Prioritise 5 candidate sites in eastern districts for new parks.
2. Upgrade 12 existing green corridors for pedestrian access.
3. Adopt SDG 11.7 monitoring in municipal planning cycle.

# Limitations

Analysis limited to public green spaces >0.5 ha.
Private gardens and vertical greening excluded.
"""
with open("report.qmd", "w") as f:
    f.write(report_qmd)
print("Quarto report template written. Render with: quarto render report.qmd")`,
      ],
      evidence: [
        'Day, R. A. & Gastel, B. (2016). How to Write and Publish a Scientific Paper, 8th ed. Cambridge University Press.',
        'Grolemund, G. & Wickham, H. (2023). Quarto: Technical Publishing System. Posit.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Automated reports require human review for nuance and political sensitivity.',
    },
    {
      id: 'rep-policy-brief',
      title: 'Policy Brief Generator',
      sectionId: 'reports_briefs',
      summary:
        'Produce concise 2–4 page policy briefs from analytical results, targeting decision-makers ' +
        'who need actionable recommendations without technical detail.',
      tags: ['policy', 'governance'],
      methodology:
        '1. Identify target audience and key decision.\n' +
        '2. Extract 3–5 headline findings from full analysis.\n' +
        '3. Draft clear problem statement.\n' +
        '4. Present options with pros/cons.\n' +
        '5. State recommended action.\n' +
        '6. Design layout with visual summary (1 key map, 1 key chart).\n' +
        '7. Export as branded PDF.',
      tools: ['html2pdf', 'templating engine', 'Markdown'],
      datasets: [
        'Headline findings extracted from full analytical report',
        'One key map image (publication quality, 300 dpi)',
        'One summary chart (bar, radar, or comparison)',
        'Policy context documents (local plans, national strategies)',
      ],
      examples: [
        'WHO Urban Health Equity Assessment: 4-page policy brief reaching 150+ national health ministries',
        'OECD National Urban Policy Reviews: standardised policy brief format used in 45 country reviews',
        'C40 Knowledge Hub: 2-page urban climate action briefs distributed to 97 member city mayors',
      ],
      prompts: [
        `# Policy brief auto-generator from analysis results\nfrom pathlib import Path\n\ndef generate_policy_brief(\n    title: str,\n    problem: str,\n    findings: list[str],\n    options: list[dict],\n    recommendation: str,\n    map_path: str,\n    chart_path: str,\n) -> str:\n    """Generate a 2-4 page policy brief in Markdown."""\n    findings_md = "\\n".join(f"- **Finding {i+1}:** {f}" for i, f in enumerate(findings))\n    options_md = "\\n".join(\n        f"### Option {i+1}: {o['name']}\\n"\n        f"- **Pros:** {o['pros']}\\n"\n        f"- **Cons:** {o['cons']}\\n"\n        f"- **Cost estimate:** {o['cost']}"\n        for i, o in enumerate(options)\n    )\n    brief = f"""---\ntitle: "{title}"\nformat: pdf\n---\n\n# Problem Statement\n\n{problem}\n\n# Key Findings\n\n{findings_md}\n\n![Key map]({map_path}){{width=80%}}\n\n![Summary chart]({chart_path}){{width=70%}}\n\n# Policy Options\n\n{options_md}\n\n# Recommended Action\n\n{recommendation}\n\n---\n*Prepared by Urban Analytics Unit. Data sources and full methodology\navailable in the companion analytical report.*\n"""\n    Path("policy_brief.md").write_text(brief)\n    print(f"Policy brief generated: {len(brief):,} chars")\n    return brief\n\n# Example usage\ngenerate_policy_brief(\n    title="Reducing Heat Vulnerability in Eastern Districts",\n    problem="Urban heat island intensity reaches 6\u00b0C in eastern industrial zones, affecting 120,000 residents.",\n    findings=[\n        "Surface temperatures 4-6\u00b0C higher than city median in 3 eastern districts",\n        "73% of affected residents are low-income households",\n        "Tree canopy cover below 8% vs. city average of 22%",\n    ],\n    options=[\n        {"name": "Street tree programme", "pros": "2-3\u00b0C cooling, co-benefits", "cons": "5-year maturation", "cost": "\u20ac2.1M"},\n        {"name": "Cool roof mandate", "pros": "Immediate effect", "cons": "Compliance burden", "cost": "\u20ac0.8M subsidy"},\n        {"name": "Combined approach", "pros": "Maximum impact", "cons": "Higher cost", "cost": "\u20ac2.7M"},\n    ],\n    recommendation="Adopt combined approach with phased implementation: cool roofs Year 1, tree planting Years 1-3.",\n    map_path="figures/heat_vulnerability_map.png",\n    chart_path="figures/temperature_comparison.png",\n)`,
      ],
      evidence: [
        'Young, E. & Quinn, L. (2002). Writing Effective Public Policy Papers: A Guide for Policy Advisers. OSI/LGI.',
        'Jones, N. & Walsh, C. (2008). Policy Briefs as a Communication Tool for Development Research. ODI Background Note.',
      ],
      sdgAlignment: ['SDG 11.a', 'SDG 16.6'],
      limitations:
        'Brevity requires omitting caveats. Political framing may differ from analytical conclusions.',
    },
    {
      id: 'rep-infographic',
      title: 'Infographic & Data Visualisation',
      sectionId: 'reports_briefs',
      summary:
        'Create visual summaries of urban analysis results for public communication, presentations ' +
        'and stakeholder workshops. Combines maps, charts, icons, and minimal text.',
      tags: ['policy', 'participation', 'indicators'],
      methodology:
        '1. Select 3–5 key metrics to communicate.\n' +
        '2. Choose visual encodings (map, bar, icon array, waffle chart).\n' +
        '3. Design layout with visual hierarchy.\n' +
        '4. Apply consistent colour palette and typography.\n' +
        '5. Add source citations and data date.\n' +
        '6. Export as SVG, PNG, or PDF.',
      tools: ['D3.js', 'Observable', 'Figma', 'chart libraries'],
      datasets: [
        'Cleaned summary statistics (3-5 key metrics)',
        'Map exports (publication quality SVG/PNG)',
        'Icon sets (Material Icons, Noun Project)',
        'Brand colour palette and typography spec',
      ],
      examples: [
        'UNICEF State of the World\'s Children: data visualisation featuring waffle charts and icon arrays reaching 10M+ readers',
        'Our World in Data urbanisation dashboard: interactive infographics with 200+ reusable chart components',
        'Bloomberg CityLab: urban mobility infographic series combining Mapbox maps with D3 chart components',
      ],
      prompts: [
        `import matplotlib.pyplot as plt\nimport matplotlib.patches as mpatches\nimport numpy as np\n\n# Urban indicators infographic - waffle chart\ndef waffle_chart(values: dict[str, float], title: str, n_cols: int = 10):\n    """Create a waffle chart from percentage values."""\n    colours = ["#F59E0B", "#4299E1", "#48BB78", "#E53E3E", "#9F7AEA"]\n    total_cells = n_cols * n_cols\n    fig, ax = plt.subplots(figsize=(8, 8))\n    \n    cell_idx = 0\n    patches = []\n    for i, (label, pct) in enumerate(values.items()):\n        n_cells = int(round(pct / 100 * total_cells))\n        for _ in range(n_cells):\n            if cell_idx >= total_cells:\n                break\n            row, col = divmod(cell_idx, n_cols)\n            rect = plt.Rectangle((col, row), 0.9, 0.9, color=colours[i % len(colours)])\n            ax.add_patch(rect)\n            cell_idx += 1\n        patches.append(mpatches.Patch(color=colours[i % len(colours)], label=f"{label}: {pct:.0f}%"))\n    \n    ax.set_xlim(-0.5, n_cols + 0.5)\n    ax.set_ylim(-0.5, n_cols + 0.5)\n    ax.set_aspect("equal")\n    ax.axis("off")\n    ax.set_title(title, fontsize=16, fontweight="bold", pad=20)\n    ax.legend(handles=patches, loc="upper right", fontsize=10)\n    plt.tight_layout()\n    plt.savefig("waffle_infographic.png", dpi=200, bbox_inches="tight")\n    print("Waffle chart saved")\n\nwaffle_chart(\n    {"Residential": 42, "Commercial": 18, "Industrial": 12, "Green space": 15, "Transport": 13},\n    "City Land Use Distribution"\n)`,
      ],
      evidence: [
        'Cairo, A. (2016). The Truthful Art: Data, Charts, and Maps for Communication. New Riders.',
        'Munzner, T. (2014). Visualization Analysis and Design. CRC Press.',
      ],
      sdgAlignment: ['SDG 11.a', 'SDG 17.18'],
      limitations:
        'Oversimplification for visual impact may mislead. Accessibility for colour-blind users requires testing.',
    },
    {
      id: 'rep-open-data-package',
      title: 'Open Data Package & Metadata',
      sectionId: 'reports_briefs',
      summary:
        'Package analytical outputs as FAIR-compliant open data with standardised metadata (ISO 19115, ' +
        'DCAT). Supports reproducibility, peer review, and institutional data sharing.',
      tags: ['data_engineering', 'governance', 'policy'],
      methodology:
        '1. Select datasets for publication.\n' +
        '2. Clean and anonymise sensitive attributes.\n' +
        '3. Write metadata: title, abstract, CRS, temporal extent, lineage.\n' +
        '4. Apply open licence (CC BY 4.0 or ODbL).\n' +
        '5. Package as GeoPackage + JSON metadata sidecar.\n' +
        '6. Publish to institutional repository or data portal.',
      tools: ['CKAN', 'GeoNode', 'pycsw', 'STAC'],
      datasets: [
        'Processed analytical outputs (GeoPackage, GeoTIFF, CSV)',
        'ISO 19115/19139 metadata template',
        'DCAT-AP or schema.org/Dataset metadata vocabulary',
        'Creative Commons licence text files',
      ],
      examples: [
        'Amsterdam Open Data Portal: 500+ urban datasets published with DCAT-AP metadata, 2M+ annual API calls',
        'OpenAfrica platform: CKAN-based open data portal hosting 4 000+ African urban and demographic datasets',
        'Copernicus Urban Atlas: FAIR-compliant pan-European land use dataset with ISO 19115 metadata for 800+ cities',
      ],
      prompts: [
        `import json\nfrom datetime import date\n\n# Generate Frictionless Data Package descriptor\ndef create_data_package(\n    name: str,\n    title: str,\n    description: str,\n    crs: str,\n    temporal_start: str,\n    temporal_end: str,\n    licence: str = "CC-BY-4.0",\n    resources: list[dict] = None,\n) -> dict:\n    """Create a FAIR-compliant data package descriptor."""\n    package = {\n        "name": name,\n        "title": title,\n        "description": description,\n        "licenses": [{"name": licence, "path": f"https://creativecommons.org/licenses/by/4.0/"}],\n        "spatial": {"crs": crs},\n        "temporal": {"start": temporal_start, "end": temporal_end},\n        "created": date.today().isoformat(),\n        "resources": resources or [],\n    }\n    return package\n\nresources = [\n    {\n        "name": "green_space_accessibility",\n        "path": "data/green_accessibility.gpkg",\n        "format": "GPKG",\n        "mediatype": "application/geopackage+sqlite3",\n        "description": "Isochrone-based accessibility to green spaces >0.5ha",\n        "schema": {\n            "fields": [\n                {"name": "grid_id", "type": "string"},\n                {"name": "pop_count", "type": "integer"},\n                {"name": "nearest_green_m", "type": "number"},\n                {"name": "within_400m", "type": "boolean"},\n            ]\n        },\n    },\n    {\n        "name": "heat_vulnerability_index",\n        "path": "data/heat_vulnerability.tif",\n        "format": "GeoTIFF",\n        "mediatype": "image/tiff",\n        "description": "Composite heat vulnerability index (0-1 scale, 100m resolution)",\n    },\n]\n\npkg = create_data_package(\n    name="city-urban-analytics-2024",\n    title="City Urban Analytics Outputs 2024",\n    description="Spatial analytical outputs from the 2024 urban analytics programme.",\n    crs="EPSG:32636",\n    temporal_start="2023-01-01",\n    temporal_end="2024-06-30",\n    resources=resources,\n)\n\nwith open("datapackage.json", "w") as f:\n    json.dump(pkg, f, indent=2)\nprint(f"Data package descriptor written with {len(resources)} resources")`,
      ],
      evidence: [
        'Wilkinson, M. D. et al. (2016). The FAIR Guiding Principles for Scientific Data Management and Stewardship. Scientific Data, 3, 160018.',
        'W3C (2020). Data Catalog Vocabulary (DCAT) — Version 2. W3C Recommendation.',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 17.6'],
      limitations:
        'Open publishing requires institutional approval. Anonymisation of spatial data is non-trivial.',
    },
  ];
}
