import type { Card } from '../lib/types';

/**
 * Data Engineering & ETL seed cards.
 * 8 cards covering data pipelines, quality standards, metadata,
 * and domain-specific data workflows for urban analytics.
 */
export function buildDataEngineeringCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'de-etl-pipeline',
      title: 'ETL Pipeline Design',
      sectionId: 'data_engineering',
      summary:
        'Design Extract-Transform-Load pipelines for urban geospatial data. ' +
        'Typical stages: ingest raw sources (OSM, census, GTFS, satellite), reproject to common CRS, ' +
        'clean geometries, harmonize schemas, validate, and load into a spatial database or GeoPackage.',
      tags: ['spatial_stats', 'land_use'],
      methodology:
        '1. Inventory all data sources with format, CRS, temporal extent, and update frequency.\n' +
        '2. Define target schema: column names, types, CRS (EPSG:4326 for storage, local UTM for analysis).\n' +
        '3. Extract: download via API, scrape, or file transfer. Use retry logic and checksums.\n' +
        '4. Transform: reproject, clean topology, standardize field names, apply unit conversions.\n' +
        '5. Validate: null checks, geometry validity, range checks, referential integrity.\n' +
        '6. Load: bulk insert into PostGIS / DuckDB / GeoPackage.\n' +
        '7. Schedule with cron or Airflow for recurring updates.\n' +
        '8. Log lineage: record source, transform steps, and load timestamp per record.',
      tools: ['geopandas', 'duckdb', 'PostGIS', 'Apache Airflow', 'Dagster', 'prefect'],
      datasets: [
        'OpenStreetMap planet file or regional extracts',
        'GTFS transit feeds from Transitland or agencies',
        'Sentinel-2 / Landsat COG archives on AWS/GCS',
        'National census microdata or summary tables',
      ],
      examples: [
        'Uber H3: global hexagonal ETL pipeline indexing billions of trip records into 15 resolution levels',
        'World Bank OpenTraffic: Dagster-based ETL processing 100M GPS points/day from ride-hail fleets across 10 cities',
        'Amsterdam City Data: automated ETL ingesting 200+ municipal datasets nightly into PostGIS via Airflow DAGs',
      ],
      prompts: [
        `import geopandas as gpd\nimport osmnx as ox\nfrom pathlib import Path\n\n# Simple ETL Pipeline for urban data\n# EXTRACT\nprint("[EXTRACT] Downloading OSM data...")\nplace = "Zurich, Switzerland"\nbuildings = ox.features_from_place(place, tags={"building": True})\nroads = ox.graph_from_place(place, network_type="drive")\nnodes, edges = ox.graph_to_gdfs(roads)\n\n# TRANSFORM\nprint("[TRANSFORM] Reprojecting and cleaning...")\nbuildings_proj = buildings[["geometry", "building", "name"]].to_crs(epsg=32632)\nbuildings_proj = buildings_proj[buildings_proj.geometry.is_valid]\nbuildings_proj["area_m2"] = buildings_proj.geometry.area\nbuildings_proj = buildings_proj[buildings_proj["area_m2"] > 10]  # remove slivers\n\nedges_proj = edges.to_crs(epsg=32632)\nedges_proj["length_m"] = edges_proj.geometry.length\n\n# VALIDATE\nprint("[VALIDATE] Checking data quality...")\nassert buildings_proj.geometry.is_valid.all(), "Invalid geometries found"\nassert len(buildings_proj) > 0, "No buildings extracted"\nprint(f"  Buildings: {len(buildings_proj):,} (mean area: {buildings_proj['area_m2'].mean():.0f} m\u00b2)")\nprint(f"  Road segments: {len(edges_proj):,} (total: {edges_proj['length_m'].sum()/1000:.0f} km)")\n\n# LOAD\noutdir = Path("output")\noutdir.mkdir(exist_ok=True)\nbuildings_proj.to_file(outdir / "buildings.gpkg", driver="GPKG")\nedges_proj.to_file(outdir / "roads.gpkg", driver="GPKG")\nprint("[LOAD] Exported to GeoPackage")`,
      ],
      evidence: [
        'Kimball, R. & Ross, M. (2013). The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling, 3rd ed. Wiley.',
        'Lovelace, R., Nowosad, J. & Muenchow, J. (2019). Geocomputation with R. CRC Press. Chapter 8: Transport.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Schema drift across data providers requires version-aware transforms. ' +
        'Large raster ETL (satellite imagery) needs cloud-native approaches (COG, Zarr). ' +
        'Error handling must account for partial failures without losing entire batch.',
    },
    {
      id: 'de-data-quality',
      title: 'Data Quality Assessment (ISO 19157)',
      sectionId: 'data_engineering',
      summary:
        'Evaluate spatial data quality across the six dimensions defined by ISO 19157: ' +
        'completeness, logical consistency, positional accuracy, thematic accuracy, temporal quality, and usability. ' +
        'Quality reports document fitness-for-purpose and support reproducibility.',
      tags: ['spatial_stats', 'governance'],
      methodology:
        '1. Completeness: % of expected features present (commission and omission errors).\n' +
        '2. Logical consistency: topology rules, domain constraints, format compliance.\n' +
        '3. Positional accuracy: RMSE against control points (target varies: <1 m urban survey, <10 m OSM).\n' +
        '4. Thematic accuracy: confusion matrix for classified data; attribute correctness sampling.\n' +
        '5. Temporal quality: date of last update, temporal consistency across layers.\n' +
        '6. Usability: does the dataset meet the specific requirement of the analysis?\n' +
        '7. Generate a machine-readable quality report (ISO 19157 XML or JSON).\n' +
        '8. Score overall fitness: traffic-light system (green/amber/red) per dimension.',
      tools: ['geopandas', 'pandera (schema validation)', 'great_expectations', 'QGIS Sketcher'],
      datasets: [
        'Target dataset under assessment',
        'Reference/control dataset for accuracy validation',
        'ISO 19157 quality element templates',
        'Existing quality reports from data providers',
      ],
      examples: [
        'Copernicus Urban Atlas: ISO 19157-compliant quality report for 800+ European cities with >85% thematic accuracy requirement',
        'OpenStreetMap quality assessment: Barrington-Leigh study evaluating road completeness in 224 countries',
        'Singapore OneMap: automated daily quality checks on 50+ munciipal datasets using pandera schema validation',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\n\n# ISO 19157 data quality assessment\ndef assess_quality(gdf: gpd.GeoDataFrame, name: str) -> dict:\n    """Assess spatial data quality across ISO 19157 dimensions."""\n    report = {"dataset": name, "n_features": len(gdf)}\n    \n    # 1. Completeness\n    null_pct = gdf.isnull().mean()\n    report["completeness"] = {col: f"{(1-v)*100:.1f}%" for col, v in null_pct.items() if v > 0}\n    \n    # 2. Logical consistency\n    invalid_geom = (~gdf.geometry.is_valid).sum()\n    report["invalid_geometries"] = int(invalid_geom)\n    report["empty_geometries"] = int(gdf.geometry.is_empty.sum())\n    \n    # 3. Positional accuracy (extent check)\n    bounds = gdf.total_bounds\n    report["bbox"] = [round(b, 4) for b in bounds]\n    \n    # 4. Temporal quality\n    date_cols = [c for c in gdf.columns if "date" in c.lower()]\n    if date_cols:\n        report["temporal_range"] = {c: f"{gdf[c].min()} to {gdf[c].max()}" for c in date_cols}\n    \n    # Overall fitness score\n    issues = invalid_geom + gdf.geometry.is_empty.sum()\n    fitness = "GREEN" if issues == 0 else "AMBER" if issues < len(gdf) * 0.05 else "RED"\n    report["fitness"] = fitness\n    \n    return report\n\n# Usage\ngdf = gpd.read_file("buildings.gpkg")\nquality = assess_quality(gdf, "Building footprints")\nimport json\nprint(json.dumps(quality, indent=2, default=str))`,
      ],
      evidence: [
        'ISO 19157:2013. Geographic Information — Data Quality. International Organization for Standardization.',
        'Senaratne, H. et al. (2017). A review of volunteered geographic information quality assessment methods. International Journal of Geographical Information Science, 31(1), 139–167.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Ground truth data for validation may be unavailable or outdated. ' +
        'Quality assessment is resource-intensive for large datasets. ' +
        'Fitness-for-purpose is subjective and varies by use case.',
    },
    {
      id: 'de-metadata-standards',
      title: 'Metadata Standards (ISO 19115)',
      sectionId: 'data_engineering',
      summary:
        'Document geospatial datasets with standardized metadata following ISO 19115 / 19139. ' +
        'Essential fields: title, abstract, spatial extent, temporal extent, CRS, lineage, access constraints, ' +
        'and responsible party. Metadata enables data discovery, sharing, and reuse.',
      tags: ['governance', 'spatial_stats'],
      methodology:
        '1. Populate core metadata elements: title, abstract, date, language, topic category.\n' +
        '2. Define spatial extent (bounding box) and temporal extent (start/end dates).\n' +
        '3. Document CRS, spatial resolution, and scale.\n' +
        '4. Record lineage: source data, processing steps, software used.\n' +
        '5. Specify access constraints: open data license, restricted, or embargo.\n' +
        '6. Publish as ISO 19139 XML or STAC-compliant JSON.\n' +
        '7. Register in institutional catalog (GeoNetwork, CKAN, or Planetary Computer).',
      tools: ['pycsw', 'OWSLib', 'GeoNetwork', 'CKAN', 'pystac'],
      datasets: [
        'ISO 19115 metadata profile templates',
        'STAC catalog specification for cloud-native EO data',
        'Dublin Core / DCAT-AP vocabulary for data portals',
        'Institutional data governance policies',
      ],
      examples: [
        'INSPIRE Directive: EU-wide metadata standard for 34 spatial data themes across 28 member states',
        'Microsoft Planetary Computer: STAC-based metadata catalog indexing 50+ petabytes of environmental data',
        'USGS metadata standard: 50+ years of geospatial metadata management across 200 000+ datasets',
      ],
      prompts: [
        `import json\nfrom datetime import date\n\n# Generate ISO 19115 simplified metadata record\ndef create_metadata(\n    title: str, abstract: str, bbox: list, crs: str,\n    temporal_start: str, temporal_end: str,\n    lineage: str, licence: str = "CC-BY-4.0"\n) -> dict:\n    return {\n        "fileIdentifier": f"MD-{hash(title) % 100000:05d}",\n        "language": "eng",\n        "characterSet": "UTF-8",\n        "dateStamp": date.today().isoformat(),\n        "identificationInfo": {\n            "title": title,\n            "abstract": abstract,\n            "topicCategory": "planningCadastre",\n            "extent": {\n                "geographicBoundingBox": {\n                    "westBoundLongitude": bbox[0],\n                    "southBoundLatitude": bbox[1],\n                    "eastBoundLongitude": bbox[2],\n                    "northBoundLatitude": bbox[3],\n                },\n                "temporalExtent": {"begin": temporal_start, "end": temporal_end},\n            },\n            "spatialReferenceSystem": crs,\n        },\n        "dataQualityInfo": {"lineage": lineage},\n        "resourceConstraints": {"useLimitation": licence},\n    }\n\nmetadata = create_metadata(\n    title="City Building Footprints 2024",\n    abstract="Building footprint polygons extracted from OSM with height attributes from LiDAR.",\n    bbox=[28.8, 40.9, 29.2, 41.2],\n    crs="EPSG:32636",\n    temporal_start="2024-01-01",\n    temporal_end="2024-06-30",\n    lineage="Extracted from OSM 2024-06-15; heights from 2023 LiDAR survey; cleaned with geopandas.",\n)\nwith open("metadata.json", "w") as f:\n    json.dump(metadata, f, indent=2)\nprint(f"Metadata record created: {metadata['fileIdentifier']}")`,
      ],
      evidence: [
        'ISO 19115-1:2014. Geographic Information — Metadata — Part 1: Fundamentals. ISO.',
        'Nogueras-Iso, J. et al. (2005). OGC Catalog Services: A Key Element for SDI. Computers & Geosciences, 31(2), 199–209.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Full ISO 19115 compliance is verbose (400+ elements); most projects use a minimal profile. ' +
        'Metadata maintenance is often neglected after initial creation. ' +
        'Schema differences between ISO 19115 and Dublin Core complicate cross-catalog search.',
    },
    {
      id: 'de-osm-extraction',
      title: 'OSM Data Extraction & Cleaning',
      sectionId: 'data_engineering',
      summary:
        'Extract and clean OpenStreetMap data for urban analytics using Overpass API, osmnx, or ohsome. ' +
        'OSM provides globally consistent building footprints, road networks, POIs, land use, and administrative boundaries. ' +
        'Quality varies by region—always assess completeness and recency.',
      tags: ['land_use', 'mobility', 'spatial_stats'],
      methodology:
        '1. Define study area bounding box or polygon.\n' +
        '2. Extract via osmnx: ox.features_from_place() for buildings, POIs; ox.graph_from_place() for networks.\n' +
        '3. Alternative: Overpass API with QL for fine-grained tag filtering.\n' +
        '4. Clean topology: simplify networks, resolve self-intersections in polygons.\n' +
        '5. Standardize tags: normalize building types, road classifications, amenity categories.\n' +
        '6. Assess completeness: compare building count with official cadastral data.\n' +
        '7. Export to GeoPackage or GeoJSON.\n' +
        '8. Record extraction date and Overpass query for reproducibility.',
      tools: ['osmnx', 'pyrosm', 'ohsome API', 'Overpass Turbo', 'osmium-tool'],
      datasets: [
        'OpenStreetMap planet file or Geofabrik regional extracts',
        'Overpass API for on-demand tag-filtered extraction',
        'ohsome API for historical OSM data analysis',
        'Official cadastral data for completeness validation',
      ],
      examples: [
        'HOT Tasking Manager: coordinated OSM extraction and validation for 100+ humanitarian mapping projects',
        'Boeing OSMnx: Python-based OSM extraction used in 5 000+ academic studies since 2017',
        'Facebook AI building detection: AI-generated building footprints imported to OSM for 20+ African countries',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\n\n# Comprehensive OSM extraction with quality assessment\nplace = "Istanbul, Turkey"\nprint(f"Extracting OSM data for {place}...")\n\n# Buildings\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings_gdf = gpd.GeoDataFrame(buildings, geometry="geometry")[["geometry", "building", "name", "height"]]\nbuildings_gdf = buildings_gdf[buildings_gdf.geometry.type.isin(["Polygon", "MultiPolygon"])]\nbuildings_gdf = buildings_gdf[buildings_gdf.geometry.is_valid]\nprint(f"Buildings: {len(buildings_gdf):,}")\n\n# POIs by category\ncategories = {\n    "education": {"amenity": ["school", "university", "kindergarten"]},\n    "healthcare": {"amenity": ["hospital", "clinic", "pharmacy"]},\n    "food": {"amenity": ["restaurant", "cafe"], "shop": ["supermarket", "convenience"]},\n}\nfor cat, tags in categories.items():\n    pois = ox.features_from_place(place, tags=tags)\n    print(f"{cat}: {len(pois)} features")\n\n# Road network\nG = ox.graph_from_place(place, network_type="drive")\nnodes, edges = ox.graph_to_gdfs(G)\nprint(f"Road network: {len(edges):,} segments, {edges.geometry.length.sum()/1000:.0f} km")\n\n# Quality check: building attribute completeness\nhas_height = buildings_gdf["height"].notna().mean() * 100\nhas_name = buildings_gdf["name"].notna().mean() * 100\nprint(f"\\nQuality: {has_height:.1f}% with height, {has_name:.1f}% with name")\n\n# Export\nbuildings_gdf.to_file("osm_buildings.gpkg", driver="GPKG")\nedges.to_file("osm_roads.gpkg", driver="GPKG")`,
      ],
      evidence: [
        'Barrington-Leigh, C. & Millard-Ball, A. (2017). The world\'s user-generated road map is more than 80% complete. PLOS ONE, 12(8), e0180698.',
        'Boeing, G. (2017). OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks. Computers, Environment and Urban Systems, 65, 126–139.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'OSM data quality varies dramatically between cities. ' +
        'Tag schemas evolve; old extractions may use deprecated keys. ' +
        'License (ODbL) requires attribution and share-alike.',
    },
    {
      id: 'de-census-harmonization',
      title: 'Census Data Harmonization',
      sectionId: 'data_engineering',
      summary:
        'Harmonize multi-source census and survey data across different geographic units, time periods, and classification schemes. ' +
        'Challenges include boundary changes between census years, variable name differences, and incompatible age/income brackets.',
      tags: ['equity', 'land_use', 'spatial_stats'],
      methodology:
        '1. Identify target variables across census vintages (e.g., population, income, education).\n' +
        '2. Map variable codes between classification systems (NAICS ↔ ISIC, SOC ↔ ISCO).\n' +
        '3. Detect boundary changes: overlay old and new tract boundaries.\n' +
        '4. Apply crosswalk tables (NHGIS, Longitudinal Tract Database) for temporal harmonization.\n' +
        '5. Use areal interpolation (tobler library) when crosswalks are unavailable.\n' +
        '6. Standardize income to constant dollars (CPI adjustment).\n' +
        '7. Compute derived indicators: density, ratios, per-capita values.\n' +
        '8. Document harmonization decisions and uncertainty estimates.',
      tools: ['cenpy', 'census (US Census API)', 'tobler', 'geopandas', 'pandas'],
      datasets: ['US ACS / Decennial Census', 'EU Eurostat GISCO', 'UN Population Division'],
      examples: [
        'NHGIS Time Series: standardized US census data from 1790–2020 harmonized across 230 years of tract boundary changes',
        'Longitudinal Tract Database (LTDB): crosswalk tables for 72 000 tracts across 4 decennial censuses enabling longitudinal neighbourhood analysis',
        'EU Urban Audit: Eurostat harmonization of 900+ cities across 37 countries with consistent indicator definitions',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\nfrom tobler.area_weighted import area_interpolate\n\n# Census harmonization via areal interpolation\n# When tract boundaries change between censuses, interpolate old data to new boundaries\n\n# Load two census vintages with different boundaries\nold_tracts = gpd.read_file("tracts_2010.gpkg")\nnew_tracts = gpd.read_file("tracts_2020.gpkg")\n\n# Old tracts have population data on 2010 boundaries\nassert old_tracts.crs == new_tracts.crs, "CRS must match"\n\n# Areal interpolation: redistribute extensive variables (population counts)\nextensive_vars = ["total_pop", "pop_under18", "pop_over65", "households"]\n# and intensive variables (median income, rates)\nintensive_vars = ["median_income", "pct_college"]\n\ninterpolated = area_interpolate(\n    source_df=old_tracts,\n    target_df=new_tracts,\n    extensive_variables=extensive_vars,\n    intensive_variables=intensive_vars,\n)\n\n# Validation: total population should be preserved (extensive)\nfor var in extensive_vars:\n    orig = old_tracts[var].sum()\n    interp = interpolated[var].sum()\n    pct_diff = abs(interp - orig) / orig * 100\n    print(f"{var}: original={orig:,.0f}, interpolated={interp:,.0f}, diff={pct_diff:.2f}%")\n\n# Merge with 2020 census data for temporal comparison\nmerged = new_tracts.merge(\n    interpolated[extensive_vars + intensive_vars],\n    left_index=True, right_index=True, suffixes=("_2020", "_2010")\n)\nmerged["pop_change_pct"] = (merged["total_pop_2020"] - merged["total_pop_2010"]) / merged["total_pop_2010"] * 100\nprint(f"\\nMedian pop change: {merged['pop_change_pct'].median():.1f}%")`,
      ],
      evidence: [
        'Logan, J. R., Xu, Z. & Stults, B. J. (2014). Interpolating US decennial census tract data from as early as 1970 to 2010. The Professional Geographer, 66(3), 412–420.',
        'Schroeder, J. P. (2007). Target-density weighting interpolation and uncertainty evaluation for temporal analysis of census data. Geographical Analysis, 39(3), 311–335.',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 10.2'],
      limitations:
        'Crosswalk tables introduce interpolation error, especially in rapidly changing areas. ' +
        'Margin of error in ACS estimates can exceed signal for small geographies. ' +
        'International comparisons face fundamental definitional differences.',
    },
    {
      id: 'de-gtfs-validation',
      title: 'GTFS Validation',
      sectionId: 'data_engineering',
      summary:
        'Validate General Transit Feed Specification (GTFS) data for completeness, consistency, and usability. ' +
        'Common issues: missing stop_times, orphan stops, impossible travel speeds, and calendar gaps. ' +
        'Clean GTFS is essential for transit accessibility analysis and isochrone generation.',
      tags: ['mobility', 'transit', 'spatial_stats'],
      methodology:
        '1. Download GTFS zip from transit agency or Transitland / Mobility Database.\n' +
        '2. Run canonical validator: MobilityData/gtfs-validator (Java) for spec compliance.\n' +
        '3. Check stop locations: flag stops >50 m from nearest road; detect coordinate swaps (lat/lon flip).\n' +
        '4. Validate stop_times: ensure monotonically increasing arrival/departure times per trip.\n' +
        '5. Check calendar coverage: ensure service dates span analysis period without gaps.\n' +
        '6. Compute headways: flag routes with <2 trips/day as potentially inactive.\n' +
        '7. Repair: interpolate missing stop_times, snap stops to road network, fill calendar gaps.\n' +
        '8. Export validated feed and quality report.',
      tools: ['gtfs-kit', 'partridge', 'MobilityData gtfs-validator', 'QGIS GTFS Sketcher'],
      datasets: ['Transitland (transit.land)', 'OpenMobilityData', 'Agency-published GTFS feeds'],
      examples: [
        'MobilityData canonical validator: open-source tool validating 1 500+ GTFS feeds globally against spec v2.0',
        'Transport for London: daily automated GTFS validation pipeline covering 11 000 bus stops and 700 routes',
        'Transitland Atlas: community-curated index of 2 500+ transit feeds with automated quality monitoring',
      ],
      prompts: [
        `import partridge as ptg\nimport pandas as pd\nimport numpy as np\n\n# GTFS Feed Validation & Quality Assessment\nfeed_path = "gtfs_feed.zip"\nservice_date = np.datetime64("2024-03-15")  # typical weekday\n\n# Parse feed for a specific service date\nfeed = ptg.load_feed(feed_path, view={"trips.txt": {"service_id": ptg.read_busiest_date(feed_path)[1]}})\n\nstops = feed.stops\ntrips = feed.trips\nstop_times = feed.stop_times\nroutes = feed.routes\n\nprint(f"Routes: {len(routes)}")\nprint(f"Trips: {len(trips)}")\nprint(f"Stops: {len(stops)}")\nprint(f"Stop times: {len(stop_times):,}")\n\n# Quality checks\n# 1. Orphan stops (stops not referenced in stop_times)\nused_stops = set(stop_times["stop_id"].unique())\nall_stops = set(stops["stop_id"].unique())\norphan_stops = all_stops - used_stops\nprint(f"\\nOrphan stops: {len(orphan_stops)}")\n\n# 2. Speed validation (flag impossible speeds)\nst = stop_times.merge(stops[["stop_id", "stop_lat", "stop_lon"]], on="stop_id")\nst = st.sort_values(["trip_id", "stop_sequence"])\nprint(f"Stop-time records sorted: {len(st):,}")\n\n# 3. Headway computation per route\nfirst_departures = stop_times.merge(trips[["trip_id", "route_id"]], on="trip_id")\nfirst_departures = first_departures[first_departures["stop_sequence"] == 1]\nfor _, grp in first_departures.groupby("route_id"):\n    n_trips = len(grp)\n    if n_trips < 2:\n        route_id = grp["route_id"].iloc[0]\n        print(f"  WARNING: route {route_id} has only {n_trips} trip(s)")\n\nprint("\\nValidation complete.")`,
      ],
      evidence: [
        'Google. GTFS Static Reference. https://gtfs.org/schedule/reference/',
        'Wong, J. (2013). Leveraging the General Transit Feed Specification for efficient transit analysis. Transportation Research Record, 2338(1), 11–19.',
      ],
      sdgAlignment: ['SDG 11.2', 'SDG 9.1'],
      limitations:
        'Many agencies publish incomplete or outdated GTFS. ' +
        'Real-time deviations (GTFS-RT) are not captured in static feeds. ' +
        'Informal transit (minibuses, jitney) is rarely represented in GTFS.',
    },
    {
      id: 'de-batch-geocoding',
      title: 'Batch Geocoding Workflow',
      sectionId: 'data_engineering',
      summary:
        'Geocode large address datasets (thousands to millions of records) efficiently while managing API quotas, ' +
        'rate limits, and match quality. Combines free services (Nominatim, Census Geocoder) with commercial APIs ' +
        'for unmatched residuals.',
      tags: ['spatial_stats', 'equity'],
      methodology:
        '1. Standardize addresses: parse into components, fix abbreviations, remove special characters.\n' +
        '2. Deduplicate: group identical addresses before geocoding to reduce API calls.\n' +
        '3. First pass: US Census Geocoder (free, no limit) or Nominatim (free, rate-limited).\n' +
        '4. Tag match quality: exact, interpolated, centroid, no match.\n' +
        '5. Second pass for no-match: try alternative service (Google, Mapbox) with API key.\n' +
        '6. Third pass: manual review for remaining unmatched (<5% target).\n' +
        '7. Cache all results to avoid re-geocoding on reruns.\n' +
        '8. Compute geocoding completeness rate and positional accuracy (RMSE vs. control points).',
      tools: ['geopy (Nominatim, GoogleV3, Bing)', 'census-geocoder', 'pelias', 'libpostal (address parsing)'],
      datasets: [
        'Nominatim (OpenStreetMap-based, free, rate-limited)',
        'US Census Geocoder (free, US addresses only)',
        'Pelias / OpenAddresses (open-source geocoder with 500M+ addresses)',
        'Commercial: Google Maps Platform, Mapbox, HERE',
      ],
      examples: [
        'NYC Department of Health: batch geocoded 8.4M birth/death records over 30 years using Geosupport achieving 97% match rate',
        'OpenAddresses project: aggregated 500M+ address points from 40+ countries for open geocoding',
        'Australian G-NAF: national geocoded address file with 15M addresses at parcel-level precision',
      ],
      prompts: [
        `import pandas as pd\nfrom geopy.geocoders import Nominatim\nfrom geopy.extra.rate_limiter import RateLimiter\nimport time\n\n# Batch Geocoding with rate limiting and caching\ngeolocator = Nominatim(user_agent="urban_analytics_demo")\ngeocode_rate_limited = RateLimiter(geolocator.geocode, min_delay_seconds=1.0)\n\n# Sample addresses\naddresses = pd.DataFrame({\n    "id": [1, 2, 3, 4, 5],\n    "address": [\n        "Istiklal Caddesi 1, Beyoglu, Istanbul",\n        "Bahnhofstrasse 1, 8001 Zurich",\n        "Champs-Elysees 101, 75008 Paris",\n        "Gran Via 1, 28013 Madrid",\n        "Kurfuerstendamm 11, 10719 Berlin",\n    ],\n})\n\n# Geocode with error handling\nresults = []\nfor _, row in addresses.iterrows():\n    try:\n        location = geocode_rate_limited(row["address"])\n        if location:\n            results.append({\n                "id": row["id"],\n                "address": row["address"],\n                "lat": location.latitude,\n                "lon": location.longitude,\n                "match_quality": "exact",\n                "display_name": location.address,\n            })\n        else:\n            results.append({"id": row["id"], "address": row["address"], "match_quality": "no_match"})\n    except Exception as e:\n        results.append({"id": row["id"], "address": row["address"], "match_quality": f"error: {e}"})\n\nresult_df = pd.DataFrame(results)\nmatch_rate = (result_df["match_quality"] == "exact").mean() * 100\nprint(f"Match rate: {match_rate:.1f}%")\nprint(result_df[["address", "lat", "lon", "match_quality"]])`,
      ],
      evidence: [
        'Goldberg, D. W., Wilson, J. P. & Knoblock, C. A. (2007). From text to geographic coordinates. International Journal of Geographical Information Science, 21(3), 219–243.',
        'Zandbergen, P. A. (2008). A comparison of address point, parcel and street geocoding techniques. Computers, Environment and Urban Systems, 32(3), 214–232.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Free services have strict rate limits (1 req/sec for Nominatim). ' +
        'Match rates drop significantly for non-US/EU addresses. ' +
        'Geocoding precision varies: rooftop > parcel centroid > street segment > city centroid.',
    },
    {
      id: 'de-automated-reporting',
      title: 'Automated Report Generation',
      sectionId: 'data_engineering',
      summary:
        'Generate reproducible urban analytics reports combining maps, charts, tables, and narrative text. ' +
        'Template-driven workflows produce consistent outputs across multiple study areas or time periods. ' +
        'Outputs: PDF, HTML, DOCX, or interactive dashboards.',
      tags: ['governance', 'sdg'],
      methodology:
        '1. Define report template: sections, maps, charts, tables, and narrative placeholders.\n' +
        '2. Compute all indicators and generate map/chart outputs programmatically.\n' +
        '3. Render maps to static images: matplotlib + contextily for basemaps, or folium .to_png().\n' +
        '4. Generate charts: plotly for interactive HTML, matplotlib for print-ready PDF.\n' +
        '5. Populate template: Jinja2 for HTML, python-docx for DOCX, WeasyPrint for PDF.\n' +
        '6. Include metadata: date, author, data sources, methodology, and caveats.\n' +
        '7. Version control reports alongside code (Git).\n' +
        '8. Automate with CI/CD pipeline for scheduled regeneration.',
      tools: ['Jinja2', 'WeasyPrint', 'python-docx', 'matplotlib', 'plotly', 'folium', 'Quarto'],
      datasets: [
        'All processed indicator datasets from the analysis pipeline',
        'Project metadata (study area, dates, team, version)',
        'Template library (organization branding, section structure)',
        'Basemap tiles for static map rendering (Stamen, CartoDB)',
      ],
      examples: [
        'UN-Habitat City Prosperity Initiative: automated generation of 400+ city profiles using Quarto templates',
        'World Bank UPRN: reproducible urban diagnostics generating 50-page PDF reports for 300+ cities',
        'London Datastore: automated weekly data digest with 200+ charts from pandas + matplotlib pipeline',
      ],
      prompts: [
        `import matplotlib.pyplot as plt\nimport matplotlib\nmatplotlib.use("Agg")  # non-interactive backend\nimport contextily as cx\nimport geopandas as gpd\nfrom jinja2 import Template\nfrom pathlib import Path\n\n# Automated Urban Analytics Report Generator\n\n# 1. Generate a static map\ndef render_map(gdf, column, title, output_path):\n    fig, ax = plt.subplots(1, 1, figsize=(10, 10))\n    gdf.to_crs(epsg=3857).plot(\n        column=column, ax=ax, legend=True,\n        cmap="YlOrRd", edgecolor="#333", linewidth=0.3,\n        legend_kwds={"label": column, "shrink": 0.6},\n    )\n    cx.add_basemap(ax, source=cx.providers.CartoDB.DarkMatter)\n    ax.set_title(title, fontsize=14, fontweight="bold")\n    ax.set_axis_off()\n    fig.savefig(output_path, dpi=150, bbox_inches="tight")\n    plt.close(fig)\n    return output_path\n\n# 2. HTML report template\nhtml_template = Template("""\n<!DOCTYPE html>\n<html><head><title>{{ title }}</title>\n<style>body{font-family:sans-serif;max-width:900px;margin:auto;padding:2rem}\n.metric{display:inline-block;background:#1a1a2e;color:#f59e0b;padding:1rem;\nmargin:0.5rem;border-radius:8px;text-align:center}\n.metric h3{margin:0;font-size:2rem}.metric p{margin:0.25rem 0 0;font-size:0.9rem;color:#999}</style>\n</head><body>\n<h1>{{ title }}</h1>\n<p>Study area: {{ study_area }} | Date: {{ date }}</p>\n<div>{% for m in metrics %}<div class="metric"><h3>{{ m.value }}</h3><p>{{ m.label }}</p></div>{% endfor %}</div>\n{% for map in maps %}<h2>{{ map.title }}</h2><img src="{{ map.path }}" width="100%">{% endfor %}\n<h2>Data Sources</h2><ul>{% for s in sources %}<li>{{ s }}</li>{% endfor %}</ul>\n</body></html>\n""")\n\n# 3. Generate report\nfrom datetime import date\nhtml = html_template.render(\n    title="Urban Density Report",\n    study_area="Istanbul Metropolitan Area",\n    date=date.today().isoformat(),\n    metrics=[\n        {"value": "15.4M", "label": "Population"},\n        {"value": "5,461 km\u00b2", "label": "Area"},\n        {"value": "2,822/km\u00b2", "label": "Density"},\n    ],\n    maps=[{"title": "Population Density by District", "path": "density_map.png"}],\n    sources=["TurkStat Census 2023", "OpenStreetMap buildings", "Copernicus Urban Atlas"],\n)\nPath("report.html").write_text(html, encoding="utf-8")\nprint("Report generated: report.html")`,
      ],
      evidence: [
        'Xie, Y., Allaire, J. J. & Grolemund, G. (2018). R Markdown: The Definitive Guide. CRC Press.',
        'Perkel, J. M. (2018). Why Jupyter is data scientists\' computational notebook of choice. Nature, 563(7729), 145–146.',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 16.6'],
      limitations:
        'Complex map layouts (multi-panel, insets) are difficult to automate without QGIS or manual adjustment. ' +
        'PDF generation from HTML can have pagination issues. ' +
        'Template maintenance adds overhead as report requirements evolve.',
    },
  ];
}
