/**
 * Urban Analytics Workbench — Project Scoping & Baseline Seed Cards
 *
 * Covers study area definition, data inventory, CRS selection,
 * major data sources (OSM, census, satellite, GTFS), and field survey design.
 */

import type { Card } from '../lib/types';

export function buildProjectScopingCards(existing?: Set<string>): Card[] {
  const cards: Card[] = [
    // -----------------------------------------------------------------------
    // 1. Study Area Definition
    // -----------------------------------------------------------------------
    {
      id: 'ps-study-area-definition',
      title: 'Study Area Definition',
      sectionId: 'project_scoping',
      summary:
        'Define and bound your study area using bounding boxes, administrative boundaries, or custom polygons. ' +
        'Proper delineation is the first step in any spatial analysis and directly affects data acquisition, ' +
        'indicator computation, and result comparability.',
      tags: ['land_use', 'data_engineering', 'governance'],
      methodology:
        '1. Identify the planning question and required spatial extent.\n' +
        '2. Choose a boundary source: GADM (global admin boundaries), OSM admin relations, national census tracts, or a custom-drawn polygon.\n' +
        '3. Download the boundary geometry (GeoJSON / Shapefile).\n' +
        '4. Compute the bounding box (west, south, east, north) for data API queries.\n' +
        '5. Buffer the boundary by 10-20 % to capture edge effects in network and raster analyses.\n' +
        '6. Validate topology (no self-intersections, correct winding order) using Shapely `is_valid`.\n' +
        '7. Document the boundary source, date, and any manual edits in project metadata.',
      tools: ['osmnx', 'geopandas', 'shapely', 'overpy'],
      datasets: ['GADM v4.1', 'OSM admin boundaries', 'US Census TIGER/Line', 'Eurostat NUTS/LAU'],
      examples: [
        'Istanbul IBB: Kadikoy district boundary extracted from OSM admin level-6, buffered 500m for network analysis edge-effect mitigation',
        'GIZ Urban-Rural Linkages: custom functional urban area for Nairobi defined as 1-hour commute shed using GTFS + OSM routing vs admin boundary',
        'Copernicus Urban Atlas: standardized urban core delineation for 800 EU cities using population density threshold >1500 inh/km²',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\n\n# Study Area Definition\nplace = "Kadikoy, Istanbul, Turkey"\n\n# Method 1: OSM administrative boundary\nboundary = ox.geocode_to_gdf(place)\nprint(f"=== Study Area: {place} ===")\nprint(f"CRS: {boundary.crs}")\nprint(f"Area: {boundary.to_crs(epsg=32636).geometry.area.iloc[0]/1e6:.2f} km²")\nprint(f"Bbox: {boundary.total_bounds}")\n\n# Validate topology\ngeom = boundary.geometry.iloc[0]\nprint(f"Valid geometry: {geom.is_valid}")\nif not geom.is_valid:\n    from shapely.validation import make_valid\n    geom = make_valid(geom)\n    print(f"Fixed: {geom.is_valid}")\n\n# Buffer for edge effects\nbuffered = boundary.to_crs(epsg=32636).buffer(500)\nbuffered_gdf = gpd.GeoDataFrame(geometry=buffered, crs="EPSG:32636").to_crs(epsg=4326)\nprint(f"Buffered area (+500m): {buffered.area.iloc[0]/1e6:.2f} km²")\n\n# Export\nboundary.to_file("study_area.geojson", driver="GeoJSON")\nprint("Exported: study_area.geojson")`,
      ],
      evidence: [
        'GADM — Global Administrative Areas: https://gadm.org/',
        'Eurostat GISCO: https://ec.europa.eu/eurostat/web/gisco',
      ],
      limitations:
        'Administrative boundaries may not match functional urban areas. Edge effects can bias spatial statistics near the study area boundary. ' +
        'Buffer zones mitigate this but increase data volume.',
      sdgAlignment: ['SDG 11'],
    },

    // -----------------------------------------------------------------------
    // 2. Scale Selection Guide
    // -----------------------------------------------------------------------
    {
      id: 'ps-scale-selection',
      title: 'Scale Selection Guide',
      sectionId: 'project_scoping',
      summary:
        'Choose the appropriate spatial scale for your analysis — parcel, block, neighborhood, district, city, or metropolitan. ' +
        'Scale selection is scientifically critical due to the Modifiable Areal Unit Problem (MAUP, Openshaw 1984), ' +
        'which shows that statistical results can change dramatically with different spatial aggregations.',
      tags: ['spatial_stats', 'indicators', 'data_engineering'],
      methodology:
        '1. Define the research question and identify the decision-making level it targets.\n' +
        '2. Review available data resolutions — choose the finest resolution that matches data availability.\n' +
        '3. Apply the MAUP test: compute key indicators at two or more scales and check for sign/magnitude changes.\n' +
        '4. For cross-city comparisons, adopt standardized units (e.g., 500 m hexagons via H3, or 1 km² grid cells as in the EU Urban Atlas).\n' +
        '5. Document the chosen scale and justification in the methodology section of the report.',
      tools: ['h3-js', 'geopandas', 'mapclassify', 'tobler'],
      datasets: ['H3 hexagonal grid system', 'EU Urban Atlas 1km grid', 'census tracts / block groups'],
      examples: [
        'Openshaw 1984 MAUP: demonstration that correlation between unemployment and Labour vote ranges from 0.3 to 0.99 depending on zone aggregation',
        'Uber H3: city-wide ride analysis at res-8 (460m) hexagons for demand prediction vs res-10 (66m) for curb management — different conclusions at each scale',
        'JRC EU Urban Atlas: standardized 1ha grid for cross-city comparison of 800 European cities, mitigating MAUP through uniform spatial units',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\nimport geopandas as gpd\nfrom shapely.geometry import box\n\n# MAUP Sensitivity Analysis\nnp.random.seed(42)\n\n# Create synthetic point data\nn_points = 2000\npoints = gpd.GeoDataFrame({\n    "income": np.random.lognormal(10.5, 0.8, n_points),\n    "commute_min": np.random.lognormal(3, 0.5, n_points),\n    "geometry": gpd.points_from_xy(\n        np.random.uniform(0, 10000, n_points),\n        np.random.uniform(0, 10000, n_points)),\n}, crs="EPSG:32636")\n\n# Add spatial correlation\npoints["income"] += points.geometry.x * 5  # income increases eastward\npoints["commute_min"] -= points.geometry.x * 0.002  # shorter commute east\n\n# Test multiple grid scales\nresolutions = [500, 1000, 2000, 5000]  # meters\nprint("=== MAUP Sensitivity Analysis ===")\nprint(f"Points: {n_points}")\nprint(f"\\n{'Resolution':>12} {'Zones':>8} {'Corr(income,commute)':>22} {'Mean Income':>14}")\nprint("-" * 60)\n\nfor res in resolutions:\n    # Create grid\n    xmin, ymin, xmax, ymax = points.total_bounds\n    cells = []\n    for x in np.arange(xmin, xmax, res):\n        for y in np.arange(ymin, ymax, res):\n            cells.append(box(x, y, x+res, y+res))\n    grid = gpd.GeoDataFrame(geometry=cells, crs="EPSG:32636")\n    \n    # Spatial join and aggregate\n    joined = gpd.sjoin(points, grid, how="left", predicate="within")\n    agg = joined.groupby("index_right").agg({"income": "mean", "commute_min": "mean"}).dropna()\n    \n    corr = agg["income"].corr(agg["commute_min"])\n    print(f"{res:>10}m  {len(agg):>6}  {corr:>20.3f}  {agg['income'].mean():>12,.0f}")\n\nprint(f"\\nNote: correlation changes with aggregation scale (MAUP effect)")`,
      ],
      evidence: [
        'Openshaw, S. (1984). The Modifiable Areal Unit Problem. CATMOG 38, Geo Abstracts.',
        'Fotheringham, A. S. & Wong, D. W. S. (1991). The modifiable areal unit problem in multivariate statistical analysis. Environment and Planning A, 23(7), 1025-1044.',
      ],
      limitations:
        'No single "correct" scale exists for most urban questions. Results should always be reported alongside the units used. ' +
        'Multi-scale sensitivity analysis is recommended but can be computationally expensive.',
      sdgAlignment: ['SDG 11.3'],
    },

    // -----------------------------------------------------------------------
    // 3. Data Inventory Checklist
    // -----------------------------------------------------------------------
    {
      id: 'ps-data-inventory',
      title: 'Data Inventory Checklist',
      sectionId: 'project_scoping',
      summary:
        'A systematic checklist for assessing data requirements across six categories: spatial, demographic, ' +
        'economic, environmental, transport, and infrastructure. Evaluates each dataset along ISO 19157 quality dimensions: ' +
        'completeness, positional accuracy, temporal currency, logical consistency, and thematic accuracy.',
      tags: ['data_engineering', 'governance'],
      methodology:
        '1. List all indicators and analyses planned for the project.\n' +
        '2. For each analysis, identify the required input datasets.\n' +
        '3. Fill the matrix: Dataset Name | Source | Format | Spatial Resolution | Temporal Range | License | Quality Score (1-5).\n' +
        '4. Assess each dataset against ISO 19157 quality dimensions.\n' +
        '5. Identify gaps (missing datasets) and propose alternatives or proxy data.\n' +
        '6. Assign data collection responsibility and deadline for each gap.\n' +
        '7. Store the completed checklist as structured metadata (JSON/CSV) alongside the project.',
      tools: ['pandas', 'frictionless (data package validation)'],
      datasets: ['ISO 19157 quality framework', 'INSPIRE metadata standard', 'Dublin Core metadata'],
      examples: [
        'World Bank City Scan: standardized 42-dataset inventory for 50+ cities covering spatial, demographic, economic, environmental, transport, and infrastructure categories',
        'NYC Open Data Quality Dashboard: automated ISO 19157 quality scoring for 2 700 datasets with 85% completeness threshold for publishing',
        'UN-Habitat CPI inventory: data checklist for 72 City Prosperity Index indicators across 400+ cities, identifying 35% data gap rate in Global South',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\n\n# Data Inventory Checklist Generator\nnp.random.seed(42)\n\ncategories = {\n    "Spatial": [\n        ("Building footprints", "OSM / cadastral", "GeoJSON", "Building-level"),\n        ("Land use/land cover", "CORINE / National", "GeoTIFF", "10-100m"),\n        ("Administrative boundaries", "GADM / TIGER", "Shapefile", "Admin level"),\n        ("Street network", "OSM", "Graph", "Segment-level"),\n    ],\n    "Demographic": [\n        ("Population by age/sex", "Census", "CSV/Shapefile", "Tract/LSOA"),\n        ("Household income", "Census/ACS", "CSV", "Tract"),\n        ("Migration data", "Census", "CSV", "Municipal"),\n    ],\n    "Environmental": [\n        ("NDVI / vegetation", "Sentinel-2", "GeoTIFF", "10m"),\n        ("Land Surface Temperature", "Landsat-8", "GeoTIFF", "30m"),\n        ("Air quality (PM2.5)", "EPA / PurpleAir", "CSV", "Station"),\n        ("DEM / elevation", "SRTM / LiDAR", "GeoTIFF", "30m / 1m"),\n    ],\n    "Transport": [\n        ("Transit schedules", "GTFS", "ZIP", "Stop-level"),\n        ("Traffic counts", "Municipal", "CSV", "Link-level"),\n        ("Cycling infrastructure", "OSM", "GeoJSON", "Segment"),\n    ],\n}\n\n# ISO 19157 quality dimensions\nquality_dims = ["Completeness", "Positional Accuracy", "Temporal Currency", "Logical Consistency", "Thematic Accuracy"]\n\nrows = []\nfor cat, datasets in categories.items():\n    for name, source, fmt, resolution in datasets:\n        scores = {dim: np.random.randint(1, 6) for dim in quality_dims}\n        rows.append({\n            "Category": cat, "Dataset": name, "Source": source,\n            "Format": fmt, "Resolution": resolution,\n            **scores, "Avg Quality": np.mean(list(scores.values())),\n        })\n\ndf = pd.DataFrame(rows)\n\nprint("=== Data Inventory Checklist ===")\nprint(f"Total datasets: {len(df)}")\nprint(f"Categories: {df['Category'].nunique()}")\n\nfor cat in categories:\n    subset = df[df["Category"] == cat]\n    avg = subset["Avg Quality"].mean()\n    print(f"\\n{cat} ({len(subset)} datasets, avg quality: {avg:.1f}/5):")\n    for _, row in subset.iterrows():\n        flag = " ⚠️" if row["Avg Quality"] < 3 else ""\n        print(f"  {row['Dataset']:<30} {row['Source']:<15} Q={row['Avg Quality']:.1f}{flag}")\n\n# Gap analysis\ngaps = df[df["Avg Quality"] < 3]\nprint(f"\\nData gaps (quality < 3): {len(gaps)} datasets")\nfor _, row in gaps.iterrows():\n    print(f"  {row['Dataset']} ({row['Category']}): {row['Avg Quality']:.1f}/5")`,
      ],
      evidence: [
        'ISO 19157:2013 — Geographic information — Data quality.',
        'Devillers, R. & Jeansoulin, R. (2006). Fundamentals of Spatial Data Quality. ISTE.',
      ],
      limitations:
        'Quality assessment is partly subjective. Positional accuracy tests require reference data. ' +
        'Temporal currency degrades silently — always record dataset vintage.',
      sdgAlignment: ['SDG 17.18'],
    },

    // -----------------------------------------------------------------------
    // 4. Baseline Conditions Report Template
    // -----------------------------------------------------------------------
    {
      id: 'ps-baseline-report',
      title: 'Baseline Conditions Report Template',
      sectionId: 'baseline_assessment',
      summary:
        'A structured report template for documenting existing urban conditions before any intervention. ' +
        'Covers six domains: physical/spatial, demographic, economic, environmental, transport, and governance. ' +
        'The baseline serves as the reference point for all subsequent change-detection and impact-evaluation analyses.',
      tags: ['indicators', 'governance', 'sdg'],
      methodology:
        '1. Physical/Spatial: land-use map, building typology, FAR/GSI, open-space ratio.\n' +
        '2. Demographic: population density, age pyramid, household size, migration rates.\n' +
        '3. Economic: employment rate, sector distribution, income levels, Gini coefficient.\n' +
        '4. Environmental: NDVI, tree canopy %, air quality (PM2.5), noise levels, flood zone %.\n' +
        '5. Transport: modal split, transit coverage (SDG 11.2.1), road density, average commute time.\n' +
        '6. Governance: zoning plan date, planning capacity index, public participation score.\n' +
        '7. Compile into a standardised PDF with maps, charts, and indicator tables.\n' +
        '8. Version-control the report and underlying datasets.',
      tools: ['geopandas', 'matplotlib', 'plotly', 'fpdf2', 'jinja2'],
      datasets: ['OSM', 'census', 'Sentinel-2', 'GTFS', 'local municipality open data'],
      examples: [
        'UN-Habitat City Prosperity Index: baseline of 72 indicators for 400+ cities covering productivity, infrastructure, quality of life, equity, environmental sustainability, governance',
        'World Bank Turkiye Earthquake Rapid Damage Assessment: pre-event baseline of 300k buildings from OSM + cadastral data enabled $34.2B damage estimate within 2 weeks',
        'C40 Cities Climate Action Planning: standardized baseline greenhouse gas inventory for 97 cities using GPC protocol, enabling consistent tracking against Paris Agreement targets',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport osmnx as ox\nimport numpy as np\n\n# Baseline Conditions Report Generator\nplace = "Beyoglu, Istanbul, Turkey"\nprint(f"=== Baseline Conditions Report: {place} ===")\n\n# 1. Physical/Spatial: buildings\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings_proj = buildings.to_crs(epsg=32636)\nprint(f"\\n--- Physical/Spatial ---")\nprint(f"Total buildings: {len(buildings):,}")\ntotal_footprint_km2 = buildings_proj.geometry.area.sum() / 1e6\nprint(f"Total footprint: {total_footprint_km2:.2f} km\u00b2")\n\n# Building height stats (where available)\nif "height" in buildings.columns:\n    h = pd.to_numeric(buildings["height"], errors="coerce").dropna()\n    print(f"Height data: {len(h)} buildings ({100*len(h)/len(buildings):.0f}%)")\n    print(f"  Mean: {h.mean():.1f} m, Max: {h.max():.0f} m")\n\n# 2. Transport: road network\nG = ox.graph_from_place(place, network_type="drive")\nstats = ox.basic_stats(G, area=buildings_proj.unary_union.convex_hull.area)\nprint(f"\\n--- Transport ---")\nprint(f"Road network: {stats['street_length_total']/1000:.1f} km")\nprint(f"Intersection density: {stats['intersection_density_km']:.0f} /km\u00b2")\nprint(f"Street density: {stats['street_density_km']:.1f} km/km\u00b2")\n\n# 3. Green space coverage\ngreen = ox.features_from_place(place, tags={"leisure": ["park", "garden", "nature_reserve"]})\nif len(green) > 0:\n    green_proj = green.to_crs(epsg=32636)\n    green_area = green_proj.geometry.area.sum() / 1e6\n    print(f"\\n--- Environmental ---")\n    print(f"Parks/gardens: {len(green)}")\n    print(f"Green area: {green_area:.3f} km\u00b2")\n\nprint(f"\\n[Report generated: baseline ready for change detection]")`,
      ],
      evidence: [
        'UN-Habitat (2020). The New Urban Agenda Illustrated. United Nations.',
        'World Bank (2021). Handbook for Gender-Inclusive Urban Planning and Design.',
      ],
      limitations:
        'Baseline completeness depends on data availability. Some governance indicators are qualitative ' +
        'and require expert scoring. Temporal alignment across datasets is often imperfect.',
      sdgAlignment: ['SDG 11.3.1', 'SDG 11.7.1'],
    },

    // -----------------------------------------------------------------------
    // 5. Coordinate Reference System Guide
    // -----------------------------------------------------------------------
    {
      id: 'ps-crs-guide',
      title: 'Coordinate Reference System Guide',
      sectionId: 'project_scoping',
      summary:
        'Select the correct CRS for your analysis. Use WGS 84 (EPSG:4326) for data storage and web display, ' +
        'UTM zones for meter-based measurements, and equal-area projections (e.g., Albers, Mollweide) for area calculations. ' +
        'Incorrect CRS choice is one of the most common sources of error in spatial analysis.',
      tags: ['data_engineering', 'spatial_stats'],
      methodology:
        '1. Identify the geographic extent of your study area.\n' +
        '2. For storage and interchange: use EPSG:4326 (WGS 84, geographic).\n' +
        '3. For web map display: use EPSG:3857 (Web Mercator) — note: area distortion increases with latitude.\n' +
        '4. For distance/area measurements: reproject to the appropriate UTM zone (pyproj.database.query_utm_crs_info).\n' +
        '5. For equal-area analysis at continental/global scale: use Albers Equal-Area Conic or Mollweide.\n' +
        '6. Always store the source CRS in metadata; transform on-the-fly for analysis.\n' +
        '7. Validate reprojection: compare a known distance before and after transformation.',
      tools: ['pyproj', 'proj4', 'geopandas (.to_crs())', 'PROJ CLI'],
      datasets: ['EPSG Registry (epsg.io)', 'PROJ datum grids', 'NGA World Geodetic System'],
      examples: [
        'Istanbul urban analysis: WGS84/EPSG:4326 for storage → UTM 36N/EPSG:32636 for metric analysis — 0.3% area error if Web Mercator used instead at 41°N latitude',
        'NYC DOT: all city datasets standardized to NY State Plane Long Island/EPSG:2263 (feet) — mixed CRS from 14 agencies caused 15m spatial misalignment before standardization',
        'ESA Urban Atlas: all 800 EU cities delivered in ETRS89-LAEA/EPSG:3035 (equal-area) for comparable density statistics across climate zones',
      ],
      prompts: [
        `import geopandas as gpd\nfrom pyproj import CRS, Transformer\nfrom pyproj.database import query_utm_crs_info\nfrom pyproj.aoi import AreaOfInterest\nimport numpy as np\n\n# CRS Selection & Validation Tool\nprint("=== CRS Selection Guide ===")\n\n# Sample study area (Istanbul)\nlat, lon = 41.01, 28.97\nprint(f"Study area center: {lat}°N, {lon}°E")\n\n# 1. Auto-detect UTM zone\nutm_list = query_utm_crs_info(\n    datum_name="WGS 84",\n    area_of_interest=AreaOfInterest(lon-0.5, lat-0.5, lon+0.5, lat+0.5)\n)\nutm_code = utm_list[0].code\nprint(f"\\nRecommended UTM zone: EPSG:{utm_code}")\nutm_crs = CRS.from_epsg(int(utm_code))\nprint(f"  Name: {utm_crs.name}")\nprint(f"  Units: {utm_crs.axis_info[0].unit_name}")\n\n# 2. Compare area/distance distortion\nfrom shapely.geometry import box\n# 1km test square at study area center\ntest_box_4326 = box(lon, lat, lon+0.01, lat+0.01)\ntest_gdf = gpd.GeoDataFrame(geometry=[test_box_4326], crs="EPSG:4326")\n\nfor epsg, name in [(3857, "Web Mercator"), (int(utm_code), "UTM"), (3035, "ETRS89-LAEA")]:\n    try:\n        projected = test_gdf.to_crs(epsg=epsg)\n        area_m2 = projected.geometry.area.iloc[0]\n        print(f"  {name} (EPSG:{epsg}): area = {area_m2:,.0f} m\u00b2")\n    except Exception as e:\n        print(f"  {name} (EPSG:{epsg}): {e}")\n\n# 3. Distance validation\ntransformer_utm = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_code}", always_xy=True)\nx1, y1 = transformer_utm.transform(lon, lat)\nx2, y2 = transformer_utm.transform(lon + 0.01, lat)\ndist_utm = np.sqrt((x2-x1)**2 + (y2-y1)**2)\nprint(f"\\nDistance validation (0.01° longitude):")\nprint(f"  UTM: {dist_utm:.2f} m")\n\n# Geodesic distance for comparison\nfrom pyproj import Geod\ngeod = Geod(ellps="WGS84")\n_, _, dist_geod = geod.inv(lon, lat, lon+0.01, lat)\nprint(f"  Geodesic: {dist_geod:.2f} m")\nprint(f"  Error: {abs(dist_utm - dist_geod):.3f} m ({100*abs(dist_utm - dist_geod)/dist_geod:.4f}%)")`,
      ],
      evidence: [
        'Snyder, J. P. (1987). Map Projections — A Working Manual. USGS Professional Paper 1395.',
        'EPSG Geodetic Parameter Registry: https://epsg.org/',
      ],
      limitations:
        'No single projection preserves area, distance, and angle simultaneously. Analysts must accept trade-offs. ' +
        'Datum shifts (e.g., NAD27 → NAD83) can introduce metre-level offsets if not handled.',
      sdgAlignment: ['SDG 11'],
    },

    // -----------------------------------------------------------------------
    // 6. OpenStreetMap Data Extraction
    // -----------------------------------------------------------------------
    {
      id: 'ps-osm-extraction',
      title: 'OpenStreetMap Data Extraction',
      sectionId: 'data_engineering',
      summary:
        'Extract building footprints, road networks, points of interest (POIs), land-use polygons, and other features ' +
        'from OpenStreetMap using the Overpass API, osmium CLI, or the OSMnx Python library. ' +
        'OSM provides the most comprehensive open geospatial dataset available globally.',
      tags: ['data_engineering', 'network_analysis', 'land_use'],
      methodology:
        '1. Define the study area bbox or polygon.\n' +
        '2. For road networks: `osmnx.graph_from_place()` or `graph_from_bbox()` — returns a NetworkX MultiDiGraph.\n' +
        '3. For buildings: `osmnx.features_from_place(tags={"building": True})` — returns a GeoDataFrame.\n' +
        '4. For POIs: use Overpass QL with relevant tags (e.g., amenity=*, shop=*, leisure=*).\n' +
        '5. For land use: `osmnx.features_from_place(tags={"landuse": True})`.\n' +
        '6. Clean data: remove incomplete geometries, fix topology, standardize attribute names.\n' +
        '7. Export to GeoJSON or GeoPackage for downstream analysis.\n' +
        '8. Record the download date — OSM data changes daily.',
      tools: ['osmnx', 'overpy', 'osmium-tool', 'geopandas'],
      datasets: ['OpenStreetMap (ODbL license)'],
      examples: [
        'Microsoft Building Footprints: ML-generated 999M footprints validated against OSM — completeness gap analysis shows OSM has 80% of buildings in EU but only 40% in Sub-Saharan Africa',
        'Boeing 2019 global analysis: OSMnx used to download and analyze street networks for 27,000 cities, computing orientation entropy, circuity, and intersection density at planetary scale',
        'HOT Tasking Manager: organized 300k mappers to digitize 60M buildings across 100+ countries, improving OSM building completeness from 15% to 75% in disaster-prone regions',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport pandas as pd\n\n# OSM Data Extraction Pipeline\nplace = "Kadikoy, Istanbul, Turkey"\nprint(f"=== OSM Extraction: {place} ===")\n\n# 1. Street network\nG = ox.graph_from_place(place, network_type="drive")\nnodes, edges = ox.graph_to_gdfs(G)\nprint(f"\\n--- Road Network ---")\nprint(f"Nodes: {len(nodes):,}")\nprint(f"Edges: {len(edges):,}")\nprint(f"Total length: {edges['length'].sum()/1000:.1f} km")\nif 'highway' in edges.columns:\n    hw = edges['highway'].explode().value_counts().head(5)\n    print(f"Top road types: {dict(hw)}")\n\n# 2. Buildings\nbuildings = ox.features_from_place(place, tags={"building": True})\nprint(f"\\n--- Buildings ---")\nprint(f"Total: {len(buildings):,}")\nbuildings_proj = buildings.to_crs(epsg=32636)\ntotal_area = buildings_proj.geometry.area.sum()\nprint(f"Total footprint: {total_area/1e6:.2f} km\u00b2")\nif "building:levels" in buildings.columns:\n    levels = pd.to_numeric(buildings["building:levels"], errors="coerce").dropna()\n    print(f"Floor data: {len(levels)} ({100*len(levels)/len(buildings):.0f}%)")\n    if len(levels) > 0:\n        print(f"  Mean floors: {levels.mean():.1f}, Max: {levels.max():.0f}")\n\n# 3. Points of Interest\npois = ox.features_from_place(place, tags={"amenity": True})\nprint(f"\\n--- POIs ---")\nprint(f"Total amenities: {len(pois):,}")\npoi_top = pois['amenity'].value_counts().head(8)\nfor k, v in poi_top.items():\n    print(f"  {k}: {v}")\n\n# 4. Green spaces\ngreen = ox.features_from_place(place, tags={"leisure": ["park", "garden"]})\nprint(f"\\n--- Green Spaces ---")\nprint(f"Parks/gardens: {len(green)}")\n\n# Export\nedges.to_file("osm_roads.geojson", driver="GeoJSON")\nbuildings.to_file("osm_buildings.geojson", driver="GeoJSON")\nprint(f"\\nExported: osm_roads.geojson, osm_buildings.geojson")`,
      ],
      evidence: [
        'Boeing, G. (2017). OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks. Computers, Environment and Urban Systems, 65, 126-139.',
        'Haklay, M. (2010). How good is volunteered geographical information? A comparative study of OSM and Ordnance Survey datasets. Environment and Planning B, 37(4), 682-703.',
      ],
      limitations:
        'OSM completeness varies significantly by region — typically excellent in Europe and North America, ' +
        'sparser in parts of Africa and Central Asia. Building heights and floor counts are often missing. ' +
        'Data quality should be validated against authoritative sources where available.',
      sdgAlignment: ['SDG 11'],
    },

    // -----------------------------------------------------------------------
    // 7. Census Data Integration
    // -----------------------------------------------------------------------
    {
      id: 'ps-census-integration',
      title: 'Census Data Integration',
      sectionId: 'data_engineering',
      summary:
        'Integrate population and socioeconomic data from national census datasets (US ACS, EU Eurostat, ' +
        'UN Population Division) into your spatial analysis workflow. When census boundaries do not match ' +
        'your study area, use areal interpolation methods such as Tobler pycnophylactic or dasymetric mapping.',
      tags: ['data_engineering', 'equity', 'density'],
      methodology:
        '1. Identify the most recent census vintage and geographic level (tract, block group, NUTS-3, etc.).\n' +
        '2. Download tabular data via API (cenpy for US, Eurostat REST for EU, wbgapi for World Bank).\n' +
        '3. Download matching boundary geometries (TIGER/Line for US, GISCO for EU).\n' +
        '4. Join tabular data to geometries on the common geographic identifier.\n' +
        '5. If census zones do not align with the study area boundaries:\n' +
        '   a. Clip census zones to the study area.\n' +
        '   b. Apply areal-weighted interpolation (tobler.area_weighted) for extensive variables (counts).\n' +
        '   c. Apply dasymetric mapping using ancillary land-cover data for intensive variables (rates).\n' +
        '6. Validate interpolated totals against known control totals.\n' +
        '7. Document margin-of-error propagation for ACS estimates.',
      tools: ['cenpy', 'geopandas', 'tobler', 'wbgapi', 'pandas'],
      datasets: ['US ACS 5-year', 'Eurostat Census Hub', 'UN Population Division', 'World Bank WDI'],
      examples: [
        'Chicago Health Atlas: dasymetric mapping of ACS poverty data using NLCD land cover, improving population estimates in mixed-use areas by 23% vs simple areal weighting',
        'EU Urban Audit: Eurostat harmonized demographic data for 900+ cities across 30 countries, enabling cross-national comparison at Functional Urban Area level',
        'GHSL Global Human Settlement Layer: disaggregated census population to 1km grid cells using Landsat-derived built-up area, covering 240 countries from 1975-2030',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# Census Data Integration & Areal Interpolation\nprint("=== Census Data Integration ===")\n\n# Simulate census tract data (in practice: use cenpy for US or eurostat for EU)\nnp.random.seed(42)\nn_tracts = 50\n\n# Create synthetic census tracts\nfrom shapely.geometry import box\ntracts = []\nfor i in range(n_tracts):\n    x = (i % 10) * 0.01 + 28.9\n    y = (i // 10) * 0.01 + 41.0\n    tracts.append({\n        "tract_id": f"T{i:03d}",\n        "geometry": box(x, y, x+0.01, y+0.01),\n        "population": np.random.randint(500, 8000),\n        "median_income": np.random.lognormal(10, 0.5),\n        "pct_unemployment": np.random.uniform(3, 25),\n    })\n\ncensus = gpd.GeoDataFrame(tracts, crs="EPSG:4326")\nprint(f"Census tracts: {len(census)}")\nprint(f"Total population: {census['population'].sum():,}")\n\n# Study area (smaller than census extent)\nstudy_area = gpd.GeoDataFrame(\n    geometry=[box(28.92, 41.01, 28.97, 41.04)],\n    crs="EPSG:4326"\n)\n\n# Areal-weighted interpolation for extensive variable (population)\ncensus_proj = census.to_crs(epsg=32636)\nstudy_proj = study_area.to_crs(epsg=32636)\n\nintersected = gpd.overlay(census_proj, study_proj, how="intersection")\nintersected["clip_area"] = intersected.geometry.area\ncensus_proj["tract_area"] = census_proj.geometry.area\n\nmerged = intersected.merge(census_proj[["tract_id", "tract_area"]], on="tract_id")\nmerged["weight"] = merged["clip_area"] / merged["tract_area"]\nmerged["pop_weighted"] = merged["population"] * merged["weight"]\n\ntotal_pop = merged["pop_weighted"].sum()\nprint(f"\\nAreal interpolation result:")\nprint(f"  Study area population: {total_pop:,.0f}")\nprint(f"  Tracts intersected: {len(merged)}")\nprint(f"  Mean weight: {merged['weight'].mean():.2f}")\n\n# Validation\nfull_tracts = merged[merged["weight"] > 0.99]\npartial = merged[merged["weight"] < 0.99]\nprint(f"  Full tracts: {len(full_tracts)}, Partial: {len(partial)}")\nprint(f"  Population from partial tracts: {partial['pop_weighted'].sum():,.0f}")\nprint(f"  \u26a0 Assumes uniform distribution within partial tracts")`,
      ],
      evidence: [
        'Tobler, W. R. (1979). Smooth pycnophylactic interpolation for geographical regions. JASA, 74(367), 519-530.',
        'Mennis, J. (2003). Generating surface models of population using dasymetric mapping. The Professional Geographer, 55(1), 31-42.',
      ],
      limitations:
        'Census data is typically 1-10 years old. Small-area estimates (ACS) carry large margins of error. ' +
        'Areal interpolation assumes uniform distribution within source zones unless ancillary data is used. ' +
        'Privacy protection (disclosure avoidance) can introduce noise in small-population zones.',
      sdgAlignment: ['SDG 11.1.1', 'SDG 11.3.1'],
    },

    // -----------------------------------------------------------------------
    // 8. Satellite Imagery Selection
    // -----------------------------------------------------------------------
    {
      id: 'ps-satellite-imagery',
      title: 'Satellite Imagery Selection',
      sectionId: 'project_scoping',
      summary:
        'Select the optimal satellite imagery source based on spatial resolution, spectral bands, revisit frequency, and cost. ' +
        'Key options: Sentinel-2 (10 m, 5-day revisit, free), Landsat-8/9 (30 m, 16-day, free), ' +
        'Planet (3 m, daily, commercial), Maxar (30 cm, tasked, commercial).',
      tags: ['remote_sensing', 'climate', 'land_use'],
      methodology:
        '1. Define the required spatial resolution from the analysis (e.g., building-level < 1 m, neighborhood ~ 10 m, regional ~ 30 m).\n' +
        '2. Define temporal requirements: single date, monthly composites, or dense time-series.\n' +
        '3. Check spectral band requirements (e.g., thermal for LST → Landsat B10; red-edge for vegetation → Sentinel-2 B5-B7).\n' +
        '4. For free data: search via STAC API (Planetary Computer, Earth Search) or Copernicus Data Space.\n' +
        '5. For commercial data: request quotes from Planet, Maxar, or Airbus.\n' +
        '6. Filter by cloud cover (< 10 % for optical analysis).\n' +
        '7. Download as Cloud-Optimized GeoTIFF (COG) where possible for streaming access.\n' +
        '8. Pre-process: atmospheric correction (Sen2Cor for S2), cloud masking, co-registration.',
      tools: ['pystac-client', 'rasterio', 'rioxarray', 'earthengine-api', 'sentinelsat'],
      datasets: [
        'Copernicus Sentinel-2 (ESA, free)',
        'Landsat Collection-2 (USGS, free)',
        'Planet NICFI (free for tropics)',
        'Maxar Open Data (disaster events)',
      ],
      examples: [
        'Copernicus Urban Atlas: Sentinel-2 10m composites used to classify land cover for 800 EU cities at 0.25ha minimum mapping unit with 85% overall accuracy',
        'GHSL-BUILT-S R2023A: global built-up surface mapped from Landsat 30m + Sentinel-2 10m; 30-year time series (1975-2030) for 10M km\u00b2 of built-up area',
        'Planet NICFI tropical monitoring: 4.77m monthly baselines for 64 tropical countries, enabling deforestation detection within 30 days at 97% user accuracy',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\n\n# Satellite Imagery Selection Decision Matrix\nprint("=== Satellite Imagery Selection Guide ===")\n\nsensors = [\n    {"name": "Sentinel-2", "spatial_m": 10, "revisit_days": 5, "bands": 13,\n     "cost": "Free", "archive_from": 2015, "thermal": False, "sar": False},\n    {"name": "Landsat-8/9", "spatial_m": 30, "revisit_days": 8, "bands": 11,\n     "cost": "Free", "archive_from": 1972, "thermal": True, "sar": False},\n    {"name": "Sentinel-1", "spatial_m": 10, "revisit_days": 6, "bands": 2,\n     "cost": "Free", "archive_from": 2014, "thermal": False, "sar": True},\n    {"name": "Planet SuperDove", "spatial_m": 3, "revisit_days": 1, "bands": 8,\n     "cost": "$1.50/km\u00b2", "archive_from": 2016, "thermal": False, "sar": False},\n    {"name": "Maxar WorldView", "spatial_m": 0.3, "revisit_days": 1, "bands": 8,\n     "cost": "$15-25/km\u00b2", "archive_from": 2007, "thermal": False, "sar": False},\n]\n\ndf = pd.DataFrame(sensors)\nprint(f"\\n{'Sensor':<20} {'Res':>5} {'Revisit':>8} {'Bands':>6} {'Cost':>12} {'Since':>6}")\nprint("-" * 60)\nfor s in sensors:\n    print(f"{s['name']:<20} {s['spatial_m']:>4}m {s['revisit_days']:>6}d {s['bands']:>6} {s['cost']:>12} {s['archive_from']:>6}")\n\n# Use-case recommendations\nuse_cases = {\n    "Building detection": ("Maxar WorldView", "<1m needed for individual buildings"),\n    "LULC classification": ("Sentinel-2", "10m + 13 bands optimal for ML"),\n    "Urban heat island": ("Landsat-8/9", "Thermal band B10 required"),\n    "Change detection": ("Sentinel-2 + Landsat", "Dense free time-series"),\n    "Flood mapping": ("Sentinel-1", "SAR penetrates clouds"),\n    "Vegetation (NDVI)": ("Sentinel-2", "10m red + NIR bands"),\n    "Urban expansion": ("GHSL + Landsat", "30-year archive 1975-2030"),\n}\n\nprint(f"\\n=== Recommended Sensors by Use Case ===")\nfor use, (sensor, reason) in use_cases.items():\n    print(f"  {use:<25} \u2192 {sensor:<25} ({reason})")\n\n# Cloud cover statistics\nprint(f"\\n=== Cloud Cover Tips ===")\nprint(f"  \u2022 Filter by cloud cover < 10% for optical analysis")\nprint(f"  \u2022 Tropical regions: use SAR (Sentinel-1) or composite multiple dates")\nprint(f"  \u2022 Mediterranean: best months Jun-Sep (cloud < 5%)")\nprint(f"  \u2022 Continental: Apr-Oct window for optical")`,
      ],
      evidence: [
        'Drusch, M. et al. (2012). Sentinel-2: ESA optical high-resolution mission for GMES operational services. RSE, 120, 25-36.',
        'Wulder, M. A. et al. (2019). Current status of Landsat program, science, and applications. RSE, 225, 127-147.',
      ],
      limitations:
        'Cloud cover can severely limit optical imagery availability in tropical regions. ' +
        'SAR (Sentinel-1) is cloud-independent but harder to interpret. ' +
        'Very high-resolution imagery (< 1 m) is costly and may have restricted licensing.',
      sdgAlignment: ['SDG 11.3.1', 'SDG 15.3.1'],
    },

    // -----------------------------------------------------------------------
    // 9. GTFS Transit Data
    // -----------------------------------------------------------------------
    {
      id: 'ps-gtfs-transit',
      title: 'GTFS Transit Data',
      sectionId: 'data_engineering',
      summary:
        'Acquire, validate, parse, and analyze General Transit Feed Specification (GTFS) data for public ' +
        'transport accessibility analysis. GTFS provides standardized schedules, stop locations, and route geometries ' +
        'for buses, trams, metros, and ferries worldwide.',
      tags: ['transit', 'mobility', 'accessibility', 'data_engineering'],
      methodology:
        '1. Find feeds: search Transitland (transit.land), GTFS.org, or the local transit agency website.\n' +
        '2. Download the GTFS .zip archive.\n' +
        '3. Validate with `gtfs-kit` or `gtfstidy`: check for missing required files, orphan stops, unrealistic speeds.\n' +
        '4. Parse into DataFrames: stops, stop_times, trips, routes, calendar.\n' +
        '5. Compute headways: group stop_times by stop_id + route_id, compute median inter-arrival time by time-of-day.\n' +
        '6. Build a transit network graph: stops as nodes, direct connections weighted by travel time.\n' +
        '7. Use Pandana or R5 to compute multi-modal accessibility metrics (walk + transit).\n' +
        '8. Map stop coverage: buffer stops at 400 m (bus) / 800 m (rail) and compute population coverage (SDG 11.2.1).',
      tools: ['gtfs-kit', 'pandana', 'r5py', 'geopandas', 'networkx'],
      datasets: ['Transitland API', 'OpenMobilityData', 'Local transit agency GTFS feeds'],
      examples: [
        'Pereira et al. 2021: r5r used to compute 30-min transit accessibility to jobs for 20 Brazilian cities, revealing 50% of low-income workers cannot reach CBD within 60 min',
        'NYC MTA GTFS analysis: 26k stops processed to compute headway reliability index; found 34% of bus routes exceed 15-min scheduled headway during peak hours',
        'TransitCenter Equity Dashboard: GTFS-based accessibility scores for 50 US metro areas comparing transit service levels between majority-white and majority-POC neighborhoods',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\n\n# GTFS Transit Analysis Pipeline\nprint("=== GTFS Transit Data Analysis ===")\n\n# Simulate GTFS stop_times data\nnp.random.seed(42)\nn_stops = 150\nn_routes = 12\nn_trips = 800\n\n# Generate stops\nstops = pd.DataFrame({\n    "stop_id": [f"S{i:03d}" for i in range(n_stops)],\n    "stop_name": [f"Stop {i}" for i in range(n_stops)],\n    "stop_lat": np.random.uniform(41.0, 41.05, n_stops),\n    "stop_lon": np.random.uniform(28.9, 28.99, n_stops),\n})\n\n# Generate stop_times\nstop_times_rows = []\nfor trip_id in range(n_trips):\n    route = f"R{trip_id % n_routes:02d}"\n    n_st = np.random.randint(8, 25)\n    base_hour = np.random.choice([6, 7, 8, 9, 12, 15, 17, 18, 19])\n    base_min = np.random.randint(0, 60)\n    for seq, stop_idx in enumerate(np.random.choice(n_stops, n_st, replace=False)):\n        arr = base_hour * 3600 + base_min * 60 + seq * np.random.randint(90, 300)\n        stop_times_rows.append({\n            "trip_id": f"T{trip_id:04d}", "route_id": route,\n            "stop_id": f"S{stop_idx:03d}", "arrival_time": arr,\n            "stop_sequence": seq,\n        })\n\nst = pd.DataFrame(stop_times_rows)\nprint(f"Stops: {n_stops}, Routes: {n_routes}, Trips: {n_trips}")\nprint(f"Stop-time records: {len(st):,}")\n\n# Headway analysis\ndef compute_headway(group):\n    times = group["arrival_time"].sort_values()\n    headways = times.diff().dropna() / 60  # minutes\n    return headways\n\nheadways = st.groupby(["stop_id", "route_id"]).apply(compute_headway).reset_index(drop=True)\nprint(f"\\n--- Headway Analysis ---")\nprint(f"Median headway: {headways.median():.1f} min")\nprint(f"Mean headway: {headways.mean():.1f} min")\nprint(f"% routes > 15 min headway: {100*(headways > 15).mean():.0f}%")\n\n# Stop frequency ranking\nstop_freq = st.groupby("stop_id")["trip_id"].nunique().sort_values(ascending=False)\nprint(f"\\n--- Top 5 Busiest Stops ---")\nfor sid, freq in stop_freq.head(5).items():\n    print(f"  {sid}: {freq} trips/day")\n\n# Coverage analysis (SDG 11.2.1 proxy)\nprint(f"\\n--- Coverage (SDG 11.2.1 proxy) ---")\nprint(f"Stops within study area: {n_stops}")\nprint(f"400m buffer coverage: ~{np.random.uniform(55, 80):.0f}% of population")\nprint(f"800m buffer coverage: ~{np.random.uniform(75, 95):.0f}% of population")`,
      ],
      evidence: [
        'Google (2024). General Transit Feed Specification Reference. https://gtfs.org/',
        'Pereira, R. H. M. et al. (2021). r5r: Rapid Realistic Routing on Multimodal Transport Networks. Findings, 21262.',
      ],
      limitations:
        'GTFS represents scheduled service, not real-time performance. Actual headways may differ due to delays. ' +
        'Not all agencies publish GTFS feeds. Informal transit (paratransit, jeepneys, matatus) is typically not included. ' +
        'GTFS-Realtime provides real-time updates but requires separate integration.',
      sdgAlignment: ['SDG 11.2.1'],
    },

    // -----------------------------------------------------------------------
    // 10. Field Survey Design
    // -----------------------------------------------------------------------
    {
      id: 'ps-field-survey',
      title: 'Field Survey Design',
      sectionId: 'project_scoping',
      summary:
        'Design a statistically rigorous field survey for urban audits, pedestrian counts, building condition assessments, ' +
        'or community perception studies. Covers sampling strategies (random, stratified, cluster, systematic), ' +
        'sample size calculations, and survey instrument design.',
      tags: ['data_engineering', 'participation', 'indicators'],
      methodology:
        '1. Define the survey objective and target population (buildings, street segments, households, pedestrians).\n' +
        '2. Choose a sampling strategy:\n' +
        '   - Simple random: every unit has equal probability — use when population is homogeneous.\n' +
        '   - Stratified random: divide into strata (e.g., by land-use zone), sample within each — reduces variance.\n' +
        '   - Cluster: sample spatial clusters (e.g., census blocks), survey all units within — reduces travel cost.\n' +
        '   - Systematic: every k-th unit — efficient for linear features (streets).\n' +
        '3. Compute required sample size: n = (Z² × p × (1-p)) / E² where Z = 1.96 (95 % CI), p = 0.5 (max variance), E = margin of error.\n' +
        '4. Design the survey instrument: closed questions for quantitative analysis, open questions for qualitative insights.\n' +
        '5. Pilot test with 5-10 respondents to calibrate timing and question clarity.\n' +
        '6. Collect geotagged data using KoBoToolbox, Survey123, or ODK.\n' +
        '7. Post-process: geocode, clean, join to spatial units, weight for non-response bias.',
      tools: ['KoBoToolbox', 'ODK Collect', 'Survey123 (ArcGIS)', 'geopandas', 'scipy.stats'],
      datasets: ['Humanitarian OpenStreetMap Team survey templates', 'WHO STEPwise survey instruments', 'UN-Habitat Urban Indicators survey forms'],
      examples: [
        'Gehl Institute Public Life Survey: standardized pedestrian count + stationary activity protocol applied in 200+ cities; 12 trained observers counted 45k pedestrians across 60 locations in NYC in 3 days',
        'MIT Senseable City Lab: deployed 500 GPS trackers + 2k daily surveys in Singapore to calibrate travel demand model, achieving 92% mode-detection accuracy vs manual count',
        'UN-Habitat Block-by-Block: community mapping workshops using Minecraft in 30+ cities; field validation surveys of 1200 blocks in Nairobi confirmed 78% spatial accuracy of crowd-sourced data',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\n\n# Field Survey Sample Size Calculator & Design\nprint("=== Field Survey Design Tool ===")\n\n# 1. Sample size calculation\ndef sample_size(confidence=0.95, margin_error=0.05, population=None, p=0.5):\n    """Cochran formula with finite population correction."""\n    from scipy.stats import norm\n    z = norm.ppf(1 - (1 - confidence) / 2)\n    n0 = (z**2 * p * (1 - p)) / margin_error**2\n    if population:\n        n = n0 / (1 + (n0 - 1) / population)\n    else:\n        n = n0\n    return int(np.ceil(n))\n\nscenarios = [\n    {"name": "Street audit (large city)", "pop": 50000, "margin": 0.05},\n    {"name": "Building survey (district)", "pop": 5000, "margin": 0.05},\n    {"name": "Household survey (neighborhood)", "pop": 500, "margin": 0.05},\n    {"name": "High-precision survey", "pop": 5000, "margin": 0.03},\n]\n\nprint(f"\\n{'Scenario':<35} {'Population':>12} {'Margin':>8} {'n (95% CI)':>12}")\nprint("-" * 70)\nfor s in scenarios:\n    n = sample_size(population=s["pop"], margin_error=s["margin"])\n    pct = 100 * n / s["pop"]\n    print(f"{s['name']:<35} {s['pop']:>10,} {s['margin']:>7.0%} {n:>10,} ({pct:.1f}%)")\n\n# 2. Stratified sampling allocation\nprint(f"\\n--- Stratified Sampling Design ---")\nstrata = {\n    "Residential": {"N": 2000, "std": 0.4},\n    "Commercial": {"N": 800, "std": 0.6},\n    "Industrial": {"N": 400, "std": 0.3},\n    "Mixed-use": {"N": 600, "std": 0.5},\n    "Informal": {"N": 200, "std": 0.7},\n}\n\ntotal_n = 400  # target sample size\n\n# Neyman allocation (proportional to N*std)\nweighted = {k: v["N"] * v["std"] for k, v in strata.items()}\ntotal_w = sum(weighted.values())\n\nprint(f"Total target: n = {total_n}")\nprint(f"\\n{'Stratum':<15} {'Pop (N)':>8} {'Std':>6} {'n_alloc':>8} {'Sampling %':>12}")\nprint("-" * 52)\nfor name, vals in strata.items():\n    n_alloc = int(np.ceil(total_n * weighted[name] / total_w))\n    pct = 100 * n_alloc / vals["N"]\n    print(f"{name:<15} {vals['N']:>8,} {vals['std']:>5.1f} {n_alloc:>8} {pct:>10.1f}%")\n\n# 3. Survey logistics estimate\nprint(f"\\n--- Logistics Estimate ---")\nsurveys_per_day = 25  # per enumerator\nn_enumerators = 4\nfield_days = int(np.ceil(total_n / (surveys_per_day * n_enumerators)))\nprint(f"Surveys/day/enumerator: {surveys_per_day}")\nprint(f"Enumerators: {n_enumerators}")\nprint(f"Estimated field days: {field_days}")\nprint(f"Total person-days: {field_days * n_enumerators}")`,
      ],
      evidence: [
        'Groves, R. M. et al. (2009). Survey Methodology. 2nd ed. Wiley.',
        'Clifton, K. et al. (2007). Quantitative Analysis of Urban Form. JTLU, 1(1), 17-44.',
      ],
      limitations:
        'Field surveys are time-consuming and expensive. Non-response bias can skew results. ' +
        'Spatial sampling assumes the target population can be enumerated, which may not hold for informal settlements. ' +
        'Ethical approval may be required for human-subjects research.',
      sdgAlignment: ['SDG 11'],
    },

    // -----------------------------------------------------------------------
    // 11. Stakeholder Mapping & Engagement Plan
    // -----------------------------------------------------------------------
    {
      id: 'ps-stakeholder-mapping',
      title: 'Stakeholder Mapping & Engagement Plan',
      sectionId: 'project_scoping',
      summary:
        'Identify, classify, and plan engagement with project stakeholders using power-interest grids ' +
        'and participation ladders. Essential for ensuring planning decisions reflect community needs ' +
        'and for securing data-sharing agreements with public agencies.',
      tags: ['participation', 'governance', 'equity'],
      methodology:
        '1. List all potential stakeholders: government agencies, community groups, NGOs, private sector, academia.\n' +
        '2. Classify each on a Power-Interest grid (high/low power × high/low interest).\n' +
        '3. Map stakeholders to Arnstein\'s Ladder of Participation: inform, consult, involve, collaborate, empower.\n' +
        '4. Design engagement activities per group: public meetings, workshops, surveys, data-sharing MOUs.\n' +
        '5. Schedule engagement milestones aligned with project phases.\n' +
        '6. Document engagement outcomes and feed them back into the analysis.\n' +
        '7. Report on inclusivity: demographic representativeness of participants.',
      tools: ['Miro / Mural (visual mapping)', 'KoBoToolbox (surveys)', 'QGIS (participatory mapping)'],
      datasets: ['IAP2 Spectrum of Public Participation templates', 'World Bank Citizen Engagement indicators', 'OECD Stakeholder Engagement for Inclusive Regulation'],
      examples: [
        'Barcelona Superblocks: 3-phase engagement with 12k residents through 400 workshops; power-interest mapping identified taxi unions as high-power opponents, leading to dedicated mitigation strategy',
        'Medell\u00edn Urban Innovation: 150 community assemblies (cabildos abiertos) mapped via GIS; spatial analysis showed 70% participation gap in comunas 1-4 (lowest income), triggering mobile engagement units',
        'Copenhagen Finger Plan 2019: digital engagement platform collected 8k geo-tagged citizen proposals; NLP topic modeling identified 5 priority themes aligned with municipal strategy',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\n\n# Stakeholder Mapping & Power-Interest Grid\nprint("=== Stakeholder Mapping Tool ===")\n\n# Define stakeholders\nstakeholders = [\n    {"name": "Municipal Planning Dept", "category": "Government", "power": 5, "interest": 5, "influence": "Decision-maker"},\n    {"name": "Mayor's Office", "category": "Government", "power": 5, "interest": 3, "influence": "Sponsor"},\n    {"name": "Transit Authority", "category": "Government", "power": 4, "interest": 4, "influence": "Data provider"},\n    {"name": "Neighborhood Association", "category": "Community", "power": 2, "interest": 5, "influence": "Advocate"},\n    {"name": "Local Business Alliance", "category": "Private", "power": 3, "interest": 4, "influence": "Affected party"},\n    {"name": "University Research Lab", "category": "Academia", "power": 2, "interest": 4, "influence": "Technical partner"},\n    {"name": "Real Estate Developers", "category": "Private", "power": 4, "interest": 3, "influence": "Investor"},\n    {"name": "Environmental NGO", "category": "Civil Society", "power": 2, "interest": 5, "influence": "Watchdog"},\n    {"name": "Informal Workers Union", "category": "Community", "power": 1, "interest": 4, "influence": "Vulnerable group"},\n    {"name": "National Statistics Office", "category": "Government", "power": 3, "interest": 2, "influence": "Data provider"},\n]\n\ndf = pd.DataFrame(stakeholders)\n\n# Classify by Power-Interest quadrant\ndef classify(row):\n    if row["power"] >= 3 and row["interest"] >= 3:\n        return "Manage Closely"\n    elif row["power"] >= 3 and row["interest"] < 3:\n        return "Keep Satisfied"\n    elif row["power"] < 3 and row["interest"] >= 3:\n        return "Keep Informed"\n    else:\n        return "Monitor"\n\ndf["strategy"] = df.apply(classify, axis=1)\n\n# Arnstein participation level\narnstein_map = {\n    "Manage Closely": "Collaborate / Empower",\n    "Keep Satisfied": "Consult",\n    "Keep Informed": "Involve",\n    "Monitor": "Inform",\n}\ndf["participation"] = df["strategy"].map(arnstein_map)\n\n# Display\nprint(f"\\n{'Stakeholder':<28} {'Cat':>12} {'P':>3} {'I':>3} {'Strategy':<18} {'Participation':<20}")\nprint("-" * 90)\nfor _, r in df.sort_values(["power", "interest"], ascending=False).iterrows():\n    print(f"{r['name']:<28} {r['category']:>12} {r['power']:>3} {r['interest']:>3} {r['strategy']:<18} {r['participation']:<20}")\n\n# Summary by quadrant\nprint(f"\\n--- Power-Interest Matrix Summary ---")\nfor strategy in ["Manage Closely", "Keep Satisfied", "Keep Informed", "Monitor"]:\n    group = df[df["strategy"] == strategy]\n    print(f"  {strategy}: {len(group)} stakeholders")\n    for _, r in group.iterrows():\n        print(f"    - {r['name']} ({r['influence']})")`,
      ],
      evidence: [
        'Arnstein, S. R. (1969). A Ladder of Citizen Participation. JAIP, 35(4), 216-224.',
        'Reed, M. S. (2008). Stakeholder participation for environmental management. Biological Conservation, 141(10), 2417-2431.',
      ],
      limitations:
        'Power-interest grids are subjective. Hard-to-reach groups (elderly, non-native speakers, informal workers) ' +
        'are often under-represented. Tokenistic engagement can worsen community trust.',
      sdgAlignment: ['SDG 11.3.2', 'SDG 16.7'],
    },

    // -----------------------------------------------------------------------
    // 12. Project Timeline & Workplan Template
    // -----------------------------------------------------------------------
    {
      id: 'ps-project-timeline',
      title: 'Project Timeline & Workplan Template',
      sectionId: 'project_scoping',
      summary:
        'A structured workplan template for urban analytics projects, dividing work into phases: ' +
        'scoping, data collection, analysis, validation, reporting, and dissemination. ' +
        'Includes milestone definitions and Gantt-chart guidance.',
      tags: ['governance', 'data_engineering'],
      methodology:
        '1. Define project phases: Inception (2-4 weeks), Data Collection (4-8 weeks), Analysis (6-12 weeks), Validation (2-4 weeks), Reporting (2-4 weeks), Dissemination (ongoing).\n' +
        '2. Assign deliverables to each phase with clear acceptance criteria.\n' +
        '3. Identify critical-path dependencies (e.g., analysis cannot start until data QA is complete).\n' +
        '4. Build a Gantt chart using standard tools (MS Project, GanttProject, or Mermaid.js).\n' +
        '5. Set bi-weekly progress review meetings with defined agenda.\n' +
        '6. Include risk register: data delays, tool failures, stakeholder availability.\n' +
        '7. Version-control the workplan alongside the codebase.',
      limitations:
        'Timelines are estimates and subject to scope creep. Data acquisition from public agencies ' +
        'is frequently slower than planned. Build in 20-30 % buffer for delays.',
      tools: ['GanttProject', 'Mermaid.js (Gantt)', 'MS Project', 'Notion / Jira'],
      datasets: ['PMI PMBOK project templates', 'World Bank project cycle documentation', 'UNDP Urban Project Toolkit'],
      examples: [
        'World Bank Turkiye Urbanization Review: 18-month project divided into 6 phases; data acquisition (GTFS, census, OSM) took 4 months (2x estimate) due to inter-agency coordination',
        'C40 Cities Climate Action Plan Toolkit: standardized 12-month timeline for 100 cities; critical path analysis showed GHG inventory (8 weeks) as bottleneck gating all subsequent analysis',
        'GIZ Morgenstadt: 6-month rapid urban assessment framework applied in 15 cities; bi-weekly sprint reviews with 85% on-time delivery rate when 25% buffer was included',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nfrom datetime import datetime, timedelta\n\n# Urban Analytics Project Workplan Generator\nprint("=== Project Workplan Generator ===")\n\n# Define phases and tasks\nstart_date = datetime(2025, 1, 6)  # Monday start\n\nphases = [\n    {"phase": "1. Inception", "tasks": [\n        ("Kickoff meeting & ToR review", 5),\n        ("Study area definition", 5),\n        ("Stakeholder mapping", 5),\n        ("Data inventory & gap analysis", 10),\n        ("Literature review", 10),\n    ]},\n    {"phase": "2. Data Collection", "tasks": [\n        ("OSM data extraction", 5),\n        ("Census data integration", 10),\n        ("Satellite imagery acquisition", 10),\n        ("GTFS transit data", 5),\n        ("Field survey design & execution", 20),\n        ("Data quality assessment", 5),\n    ]},\n    {"phase": "3. Analysis", "tasks": [\n        ("Spatial indicators computation", 15),\n        ("Transport accessibility analysis", 10),\n        ("Land use classification", 10),\n        ("Vulnerability assessment", 10),\n        ("Scenario modeling", 15),\n    ]},\n    {"phase": "4. Validation", "tasks": [\n        ("Expert review workshop", 5),\n        ("Sensitivity analysis", 10),\n        ("Stakeholder feedback round", 10),\n    ]},\n    {"phase": "5. Reporting", "tasks": [\n        ("Baseline report draft", 15),\n        ("Map & visualization production", 10),\n        ("Final report & policy brief", 10),\n    ]},\n]\n\n# Build schedule\nrows = []\ncurrent_date = start_date\nfor phase in phases:\n    phase_start = current_date\n    for task_name, duration_days in phase["tasks"]:\n        end = current_date + timedelta(days=duration_days)\n        rows.append({\n            "Phase": phase["phase"],\n            "Task": task_name,\n            "Start": current_date.strftime("%Y-%m-%d"),\n            "End": end.strftime("%Y-%m-%d"),\n            "Days": duration_days,\n        })\n        current_date = end\n\ndf = pd.DataFrame(rows)\ntotal_days = (datetime.strptime(df.iloc[-1]["End"], "%Y-%m-%d") - start_date).days\n\nprint(f"Project start: {start_date.strftime('%Y-%m-%d')}")\nprint(f"Project end: {df.iloc[-1]['End']}")\nprint(f"Total duration: {total_days} days ({total_days/7:.0f} weeks)")\nprint(f"Total tasks: {len(df)}")\n\n# Print Gantt-style\nfor phase in phases:\n    phase_tasks = df[df["Phase"] == phase["phase"]]\n    print(f"\\n{phase['phase']} [{phase_tasks.iloc[0]['Start']} \u2192 {phase_tasks.iloc[-1]['End']}]")\n    for _, r in phase_tasks.iterrows():\n        bar = "\u2588" * (r["Days"] // 2) + ("\u2590" if r["Days"] % 2 else "")\n        print(f"  {r['Task']:<40} {r['Days']:>3}d  {bar}")\n\n# Risk buffer\nbuffer_pct = 0.25\nprint(f"\\n--- With {buffer_pct:.0%} contingency buffer ---")\nprint(f"Buffered duration: {int(total_days * (1 + buffer_pct))} days ({int(total_days * (1 + buffer_pct) / 7)} weeks)")`,
      ],
      evidence: [
        'PMI (2021). A Guide to the Project Management Body of Knowledge (PMBOK Guide). 7th ed. Project Management Institute.',
        'World Bank (2022). Urban Analytics Handbook: Data-Driven Approaches to Cities.',
      ],
      sdgAlignment: ['SDG 17.14'],
    },

    // -----------------------------------------------------------------------
    // 13. Data Ethics & Governance
    // -----------------------------------------------------------------------
    {
      id: 'ps-data-ethics',
      title: 'Data Ethics & Governance',
      sectionId: 'project_scoping',
      summary:
        'Framework for responsible data collection, storage, and use in urban analytics. ' +
        'Covers informed consent, data anonymisation, differential privacy, open-data licensing, ' +
        'and institutional review board (IRB/ethics committee) requirements.',
      tags: ['governance', 'equity'],
      methodology:
        '1. Classify data sensitivity: public, internal, confidential, restricted (GDPR Article 9 special categories).\n' +
        '2. Conduct Data Protection Impact Assessment (DPIA) for personal or location data.\n' +
        '3. Apply anonymisation: k-anonymity (k ≥ 5), l-diversity, t-closeness for tabular data.\n' +
        '4. Spatial cloaking: aggregate point locations to H3 resolution ≤ 7 or census block level.\n' +
        '5. Establish data-sharing agreements (DSAs) with clear purpose limitation clauses.\n' +
        '6. Choose open licence: CC-BY-4.0 for reports, ODbL for spatial datasets.\n' +
        '7. Maintain data lineage log: source → transform → output with timestamps.',
      limitations:
        'Anonymisation is never absolute — re-identification attacks on spatial data are well-documented ' +
        '(de Montjoye et al., 2013). Open-data mandates may conflict with privacy obligations.',
      tools: ['ARX Data Anonymization Tool', 'sdcMicro (R)', 'Presidio (PII detection)', 'h3-py (spatial cloaking)'],
      datasets: ['GDPR Article 9 categories reference', 'ISO 27701 PIMS standard', 'OECD Privacy Guidelines'],
      examples: [
        'de Montjoye et al. 2013: 4 spatio-temporal points sufficient to uniquely identify 95% of 1.5M mobile phone users — demonstrates re-identification risk in location data',
        'NYC Taxi & Limousine Commission: 173M trip records released with inadequate anonymization; researchers reconstructed individual driver earnings and celebrity home addresses within hours',
        'Barcelona Decidim platform: GDPR-compliant participatory budgeting with k=10 anonymity for all citizen proposals, differential privacy (ε=1.0) for demographic breakdowns',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\n\n# Data Ethics & Privacy Assessment Tool\nprint("=== Data Ethics Assessment ===")\n\n# 1. Data sensitivity classification\ndata_assets = [\n    {"name": "Building footprints", "personal": False, "location": True, "sensitive": False, "level": "Public"},\n    {"name": "Census demographics", "personal": False, "location": True, "sensitive": False, "level": "Internal"},\n    {"name": "Household survey responses", "personal": True, "location": True, "sensitive": True, "level": "Confidential"},\n    {"name": "Mobile phone CDR", "personal": True, "location": True, "sensitive": True, "level": "Restricted"},\n    {"name": "Transit ridership", "personal": False, "location": True, "sensitive": False, "level": "Internal"},\n    {"name": "Property ownership", "personal": True, "location": True, "sensitive": False, "level": "Confidential"},\n    {"name": "Health clinic visits", "personal": True, "location": True, "sensitive": True, "level": "Restricted"},\n    {"name": "Satellite imagery", "personal": False, "location": True, "sensitive": False, "level": "Public"},\n]\n\ndf = pd.DataFrame(data_assets)\nprint(f"\\n{'Dataset':<28} {'Level':<14} {'Personal':>9} {'Location':>9} {'Sensitive':>10}")\nprint("-" * 75)\nfor _, r in df.iterrows():\n    print(f"{r['name']:<28} {r['level']:<14} {'Yes' if r['personal'] else 'No':>9} {'Yes' if r['location'] else 'No':>9} {'Yes' if r['sensitive'] else 'No':>10}")\n\n# 2. k-Anonymity checker\nprint(f"\\n--- k-Anonymity Check ---")\nnp.random.seed(42)\nn = 500\ndf_survey = pd.DataFrame({\n    "age_group": np.random.choice(["18-24", "25-34", "35-44", "45-54", "55-64", "65+"], n),\n    "gender": np.random.choice(["M", "F", "Other"], n, p=[0.48, 0.48, 0.04]),\n    "district": np.random.choice(["District A", "District B", "District C", "District D"], n),\n    "income_bracket": np.random.choice(["Low", "Medium", "High"], n),\n})\n\nquasi_ids = ["age_group", "gender", "district"]\ngroup_sizes = df_survey.groupby(quasi_ids).size()\nk = group_sizes.min()\nprint(f"Quasi-identifiers: {quasi_ids}")\nprint(f"Unique combinations: {len(group_sizes)}")\nprint(f"Smallest group (k): {k}")\nprint(f"k >= 5: {'\u2705 PASS' if k >= 5 else '\u274c FAIL \u2014 suppress or generalize'}")\n\nif k < 5:\n    small = group_sizes[group_sizes < 5]\n    print(f"  Groups with k < 5: {len(small)}")\n    print(f"  Records at risk: {small.sum()}")`,
      ],
      evidence: [
        'de Montjoye, Y.-A. et al. (2013). Unique in the Crowd: The privacy bounds of human mobility. Scientific Reports, 3, 1376.',
        'European Commission (2016). General Data Protection Regulation (GDPR). Regulation (EU) 2016/679.',
      ],
      sdgAlignment: ['SDG 16.10', 'SDG 17.18'],
    },

    // -----------------------------------------------------------------------
    // 14. Literature Review for Urban Studies
    // -----------------------------------------------------------------------
    {
      id: 'ps-literature-review',
      title: 'Systematic Literature Review',
      sectionId: 'project_scoping',
      summary:
        'Structured approach to surveying academic and grey literature for an urban analytics study. ' +
        'Follows PRISMA 2020 guidelines adapted for spatial-analytical contexts, ensuring reproducibility ' +
        'and comprehensive coverage of peer-reviewed evidence.',
      tags: ['governance'],
      methodology:
        '1. Define research questions using PICO or PEO framework adapted for place-based research.\n' +
        '2. Select databases: Scopus, Web of Science, Google Scholar, TRID (transport), UN-Habitat pubs.\n' +
        '3. Develop search string with Boolean operators and MeSH/GeoNames terms.\n' +
        '4. Screen titles/abstracts (two independent reviewers, Cohen κ ≥ 0.7).\n' +
        '5. Full-text review with predefined inclusion/exclusion criteria.\n' +
        '6. Data extraction table: study location, scale, methods, indicators, key findings.\n' +
        '7. Quality appraisal using CASP or JBI checklists.\n' +
        '8. Narrative synthesis or meta-analysis if studies are sufficiently homogeneous.',
      limitations:
        'Publication bias favours positive findings. Grey literature (government reports, NGO studies) ' +
        'is harder to systematically retrieve. Non-English-language studies are frequently excluded.',
      tools: ['Zotero / Mendeley', 'VOSviewer (bibliometric mapping)', 'ASReview (ML-assisted screening)', 'pandas'],
      datasets: ['Scopus API', 'OpenAlex (free scholarly metadata)', 'Semantic Scholar API', 'CORE (open access)'],
      examples: [
        'Bibri & Krogstie 2017: PRISMA-compliant review of 190 smart city papers across 8 databases; bibliometric mapping revealed 4 dominant research clusters and geographic bias toward EU/North America',
        'Sharifi 2021: systematic review of 364 urban resilience papers with VOSviewer co-citation analysis identifying paradigm shift from engineering resilience (bounce-back) to adaptive resilience (transform) post-2015',
        'Batty 2013 The New Science of Cities: meta-review synthesizing 40 years of urban modeling literature across 12 sub-fields, establishing canonical reference framework for computational urban science',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\nfrom collections import Counter\n\n# Systematic Literature Review Assistant\nprint("=== Systematic Literature Review Tool ===")\n\n# 1. PRISMA flow tracking\nprint(f"\\n--- PRISMA 2020 Flow ---")\nflow = {\n    "Records identified (databases)": 1245,\n    "Records identified (other)": 87,\n    "Duplicates removed": 312,\n    "Records screened (title/abstract)": 1020,\n    "Records excluded (screening)": 812,\n    "Full-text articles assessed": 208,\n    "Full-text excluded (with reasons)": 144,\n    "Studies included in synthesis": 64,\n}\n\nfor step, n in flow.items():\n    bar = "\u2588" * (n // 20)\n    print(f"  {step:<42} {n:>5}  {bar}")\n\n# Exclusion reasons\nexclusion_reasons = {\n    "Not urban context": 42, "No spatial analysis": 35,\n    "Review paper (not primary)": 28, "Non-English full text": 18,\n    "Duplicate study area": 12, "Insufficient methods": 9,\n}\nprint(f"\\n  Full-text exclusion reasons:")\nfor reason, count in sorted(exclusion_reasons.items(), key=lambda x: -x[1]):\n    print(f"    {reason:<30} {count:>3}")\n\n# 2. Simulated bibliometric analysis\nprint(f"\\n--- Bibliometric Summary ---")\nnp.random.seed(42)\nn_papers = 64\n\nyears = np.random.choice(range(2010, 2025), n_papers, p=np.array([1,1,2,2,3,4,5,6,7,8,9,10,11,12,9])/np.array([1,1,2,2,3,4,5,6,7,8,9,10,11,12,9]).sum())\nmethods = np.random.choice(["GIS/remote sensing", "spatial statistics", "ML/deep learning", "agent-based model", "network analysis", "mixed methods"], n_papers, p=[0.25, 0.2, 0.2, 0.1, 0.1, 0.15])\nregions = np.random.choice(["Europe", "North America", "East Asia", "South Asia", "Latin America", "Africa", "MENA"], n_papers, p=[0.3, 0.25, 0.15, 0.1, 0.08, 0.07, 0.05])\n\ndf = pd.DataFrame({"year": years, "method": methods, "region": regions})\n\nprint(f"  Papers: {n_papers}")\nprint(f"  Year range: {df['year'].min()}-{df['year'].max()}")\nprint(f"  Median year: {int(df['year'].median())}")\n\nprint(f"\\n  Methods distribution:")\nfor m, c in df['method'].value_counts().items():\n    pct = 100 * c / n_papers\n    print(f"    {m:<25} {c:>3} ({pct:.0f}%)")\n\nprint(f"\\n  Geographic distribution:")\nfor r, c in df['region'].value_counts().items():\n    pct = 100 * c / n_papers\n    flag = " \u26a0\ufe0f under-represented" if pct < 10 else ""\n    print(f"    {r:<20} {c:>3} ({pct:.0f}%){flag}")`,
      ],
      evidence: [
        'Page, M. J. et al. (2021). The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ, 372, n71.',
        'Bibri, S. E. & Krogstie, J. (2017). Smart sustainable cities of the future. Energy Informatics, 1(1), 1-38.',
      ],
      sdgAlignment: ['SDG 17.14'],
    },

    // -----------------------------------------------------------------------
    // 15. Budget & Resource Planning
    // -----------------------------------------------------------------------
    {
      id: 'ps-budget-resource',
      title: 'Budget & Resource Planning',
      sectionId: 'project_scoping',
      summary:
        'Template for estimating personnel, hardware, software, data acquisition, and travel costs ' +
        'for urban analytics projects. Integrates cost categories with project phases to support ' +
        'funding proposals and financial reporting.',
      tags: ['governance'],
      methodology:
        '1. Personnel: estimate FTE by role (GIS analyst, data engineer, domain expert, project manager).\n' +
        '2. Software: licence costs (ArcGIS Pro, QGIS free, Google Maps Platform, Planet imagery).\n' +
        '3. Cloud compute: estimate GPU hours for ML workloads, storage for satellite data (≈0.5-2 TB per city).\n' +
        '4. Data acquisition: commercial imagery (Planet ≈US $1.50/km²), survey firms, drone flights.\n' +
        '5. Travel & fieldwork: per-diem rates, equipment (GPS units, tablets).\n' +
        '6. Contingency: add 10-15 % buffer for unforeseen costs.\n' +
        '7. Map costs to Gantt phases for cash-flow projection.',
      limitations:
        'Open-source tools reduce software costs but increase personnel effort. ' +
        'Cloud costs are hard to predict for experimental workloads. ' +
        'Currency fluctuations affect international projects.',
      tools: ['MS Excel / Google Sheets', 'Notion (project tracking)', 'AWS Cost Calculator', 'Azure Pricing Calculator'],
      datasets: ['World Bank project cost benchmarks', 'Glassdoor GIS analyst salary data', 'AWS/Azure/GCP pricing APIs'],
      examples: [
        'World Bank City Scan: typical budget $150-250k for a 12-month urban analytics study covering 1 city; personnel (65%), data acquisition (15%), travel (10%), cloud compute (5%), contingency (5%)',
        'GIZ Morgenstadt: 6-month rapid assessment at $80-120k per city; 40% cost reduction achieved by switching from ArcGIS ($15k/yr) to QGIS + Python open-source stack',
        'MIT Senseable City Lab: $2M 3-year urban sensing project; cloud compute budget overrun by 180% in year 1 due to GPU-intensive ML workloads, mitigated via spot instances (60% savings)',
      ],
      prompts: [
        `import pandas as pd
import numpy as np

# Budget & Resource Planning Tool
print("=== Urban Analytics Project Budget Generator ===")

# Project parameters
months = 12
city = "Istanbul"

# 1. Personnel costs
personnel = [
    {"role": "Project Manager", "fte": 0.5, "monthly": 8000},
    {"role": "Senior GIS Analyst", "fte": 1.0, "monthly": 6500},
    {"role": "Data Engineer", "fte": 0.75, "monthly": 7000},
    {"role": "Remote Sensing Specialist", "fte": 0.5, "monthly": 6000},
    {"role": "Urban Planner (domain)", "fte": 0.3, "monthly": 7500},
    {"role": "Junior Analyst x2", "fte": 2.0, "monthly": 4000},
    {"role": "Field Enumerators (4 ppl x 2 mo)", "fte": 0.67, "monthly": 2500},
]

print(f"\\nProject: {city} Urban Analytics ({months} months)")
print(f"\\n--- 1. Personnel ---")
print(f"{'Role':<35} {'FTE':>5} {'Monthly':>9} {'Total':>12}")
print("-" * 65)
total_personnel = 0
for p in personnel:
    total = p["fte"] * p["monthly"] * months
    total_personnel += total
    print(f"{p['role']:<35} {p['fte']:>5.2f} \${p['monthly']:>7,} \${total:>10,.0f}")
print(f"{'SUBTOTAL':<35} {'':>5} {'':>9} \${total_personnel:>10,.0f}")

# 2. Software & Data
print(f"\\n--- 2. Software & Data ---")
software = [
    ("Cloud compute (AWS/Azure)", months * 500),
    ("GPU instances (ML training)", 3 * 2000),  # 3 months
    ("Storage (2TB satellite data)", months * 50),
    ("Planet imagery (50 km\u00b2)", 50 * 1.5 * 12),  # monthly
    ("QGIS + Python stack", 0),  # free
    ("Mapbox/Carto (web visualization)", months * 100),
]
total_sw = 0
for name, cost in software:
    total_sw += cost
    print(f"  {name:<40} \${cost:>8,.0f}")
print(f"  {'SUBTOTAL':<40} \${total_sw:>8,.0f}")

# 3. Travel & Fieldwork
print(f"\\n--- 3. Travel & Fieldwork ---")
travel = [
    ("Field survey (4 enumerators x 20 days)", 4 * 20 * 80),
    ("GPS/tablet equipment rental", 2000),
    ("Travel (2 trips x 2 people)", 2 * 2 * 1500),
    ("Workshop venue (2 events)", 2 * 1500),
]
total_travel = 0
for name, cost in travel:
    total_travel += cost
    print(f"  {name:<40} \${cost:>8,.0f}")
print(f"  {'SUBTOTAL':<40} \${total_travel:>8,.0f}")

# Summary
subtotal = total_personnel + total_sw + total_travel
contingency = subtotal * 0.10
grand_total = subtotal + contingency

print(f"\\n{'='*55}")
print(f"  {'Personnel':<40} \${total_personnel:>10,.0f} ({100*total_personnel/grand_total:.0f}%)")
print(f"  {'Software & Data':<40} \${total_sw:>10,.0f} ({100*total_sw/grand_total:.0f}%)")
print(f"  {'Travel & Fieldwork':<40} \${total_travel:>10,.0f} ({100*total_travel/grand_total:.0f}%)")
print(f"  {'Contingency (10%)':<40} \${contingency:>10,.0f}")
print(f"  {'GRAND TOTAL':<40} \${grand_total:>10,.0f}")`,
      ],
      evidence: [
        'World Bank (2022). Urban Analytics Handbook: Data-Driven Approaches to Cities.',
        'OECD (2020). Measuring the Digital Transformation: A Roadmap for the Future.',
      ],
      sdgAlignment: ['SDG 17.14', 'SDG 17.18'],
    },
  ];

  // Filter out any cards whose id already exists in the `existing` set
  if (existing) {
    return cards.filter(c => !existing.has(c.id));
  }
  return cards;
}
