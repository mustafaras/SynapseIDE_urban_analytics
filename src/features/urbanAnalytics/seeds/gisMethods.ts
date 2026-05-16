import type { Card } from '../lib/types';

/**
 * GIS Methods & Spatial Operations seed cards.
 * 8 cards covering core GIS operations used across all urban analytics workflows.
 */
export function buildGISMethodCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'gis-buffer-analysis',
      title: 'Buffer Analysis',
      sectionId: 'gis_methods',
      summary:
        'Generate proximity zones around point, line, or polygon features at specified distances. ' +
        'Euclidean buffers use straight-line distance; geodesic buffers account for Earth curvature. ' +
        'Common urban applications: transit stop catchment areas (400 m walk), noise contours, setback zones.',
      tags: ['spatial_stats', 'land_use', 'mobility'],
      methodology:
        '1. Select input features and buffer distance(s) (single or multi-ring).\n' +
        '2. Choose buffer type: Euclidean (projected CRS required) or geodesic (WGS 84).\n' +
        '3. Set end cap style: round, flat, or square (for lines).\n' +
        '4. Dissolve overlapping buffers if union is needed (e.g., combined service area).\n' +
        '5. Clip buffers to study area boundary.\n' +
        '6. Compute area and overlay with target features (e.g., population within 500 m of park).\n' +
        '7. Export result as GeoJSON or GeoPackage.',
      tools: ['geopandas (.buffer)', 'shapely', 'PostGIS ST_Buffer', 'QGIS'],
      datasets: [
        'Transit stop locations (GTFS stops.txt)',
        'Park / green space polygons (OSM or municipal data)',
        'Industrial facility point locations (EPA / environmental agency)',
        'Road network centerlines for noise buffer analysis',
      ],
      examples: [
        'Transport for London: 400m walk buffers around 19 000 bus stops to identify areas with poor transit access',
        'Barcelona Superblocks: multi-ring buffers (200m/400m/800m) to measure impact zones of traffic calming interventions',
        'EPA Toxic Release Inventory: 1-mile buffers around 21 000 facilities to assess population exposure in environmental justice analysis',
      ],
      prompts: [
        `import geopandas as gpd\nimport matplotlib.pyplot as plt\nimport contextily as cx\nimport osmnx as ox\n\n# Multi-ring buffer analysis: transit stop catchment\nplace = "Zurich, Switzerland"\n# Get transit stops from OSM\nstops = ox.features_from_place(place, tags={"public_transport": "stop_position"})\nstops_pts = stops[stops.geometry.type == "Point"].to_crs(epsg=32632)\nprint(f"Transit stops: {len(stops_pts)}")\n\n# Multi-ring buffers: 400m walk, 800m comfortable walk, 1200m max walk\nrings = [400, 800, 1200]\nbuffers = {}\nfor dist in rings:\n    buf = stops_pts.geometry.buffer(dist).unary_union\n    buffers[dist] = gpd.GeoDataFrame(geometry=[buf], crs=stops_pts.crs)\n    area_km2 = buf.area / 1e6\n    print(f"  {dist}m buffer: {area_km2:.1f} km\u00b2")\n\n# Plot\nfig, ax = plt.subplots(1, 1, figsize=(10, 10))\ncolors = ["#3794ff33", "#3794ff22", "#3794ff11"]\nfor (dist, gdf), color in zip(reversed(list(buffers.items())), colors):\n    gdf.to_crs(epsg=3857).plot(ax=ax, color=color, edgecolor="#3794ff", linewidth=0.5, label=f"{dist}m")\nstops_pts.to_crs(epsg=3857).plot(ax=ax, color="#3794ff", markersize=2)\ncx.add_basemap(ax, source=cx.providers.CartoDB.DarkMatter)\nax.set_axis_off()\nax.legend()\nplt.title("Transit Stop Catchment Buffers")\nplt.tight_layout()\nplt.savefig("buffer_analysis.png", dpi=150)\nprint("Saved buffer_analysis.png")`,
      ],
      evidence: [
        'de Smith, M. J., Goodchild, M. F. & Longley, P. A. (2018). Geospatial Analysis: A Comprehensive Guide, 6th ed.',
        'O\'Sullivan, D. & Unwin, D. J. (2010). Geographic Information Analysis, 2nd ed. Wiley. Chapter 4: Point Pattern Analysis.',
      ],
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
      limitations:
        'Euclidean buffers on geographic CRS (lat/lon) produce distorted results. ' +
        'Always project to a local metre-based CRS before buffering. ' +
        'Multi-ring buffers can create sliver polygons requiring topology cleaning.',
    },
    {
      id: 'gis-spatial-join',
      title: 'Spatial Join',
      sectionId: 'gis_methods',
      summary:
        'Transfer attributes between two layers based on spatial relationship (intersects, contains, within, nearest). ' +
        'Point-in-polygon join is the most common: assign census tract attributes to geocoded addresses. ' +
        'Nearest-neighbor join links features by minimum distance.',
      tags: ['spatial_stats', 'land_use', 'equity'],
      methodology:
        '1. Ensure both layers share the same CRS (reproject if needed).\n' +
        '2. Select join type: one-to-one (first match) or one-to-many (all matches).\n' +
        '3. Select predicate: intersects, within, contains, touches, crosses, nearest.\n' +
        '4. Execute join: geopandas.sjoin() or geopandas.sjoin_nearest().\n' +
        '5. Handle unmatched features: left join retains all from left layer.\n' +
        '6. Aggregate if one-to-many: sum, mean, count, or concatenate.\n' +
        '7. Validate with spot checks on known overlaps.',
      tools: ['geopandas (sjoin, sjoin_nearest)', 'PostGIS ST_Intersects', 'QGIS Join Attributes by Location'],
      datasets: [
        'Census tract polygons with demographic attributes',
        'Geocoded address points (buildings, businesses, events)',
        'Administrative boundary layers (wards, districts, neighborhoods)',
        'Service facility point layers (schools, hospitals, parks)',
      ],
      examples: [
        'NYC OpenData: spatial join of 311 complaint points to census tracts revealing neighbourhood-level service request patterns across 8.3M residents',
        'Chicago Health Atlas: point-in-polygon join linking 600K health records to 801 census tracts for neighbourhood health profiles',
        'Melbourne Urban Forest: nearest-neighbor join linking 70 000 trees to closest buildings for canopy benefit analysis',
      ],
      prompts: [
        `import geopandas as gpd\nimport osmnx as ox\n\n# Spatial join: assign census attributes to building footprints\nplace = "Bern, Switzerland"\n\n# Get buildings and administrative boundaries\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])]\nbuildings = gpd.GeoDataFrame(buildings[["geometry", "building"]]).to_crs(epsg=32632)\nbuildings["area_m2"] = buildings.geometry.area\nprint(f"Buildings: {len(buildings):,}")\n\n# Get admin boundaries as zones\nboundaries = ox.features_from_place(place, tags={"admin_level": "9"})\nboundaries = boundaries[boundaries.geometry.type.isin(["Polygon", "MultiPolygon"])]\nboundaries = gpd.GeoDataFrame(boundaries[["geometry", "name"]]).to_crs(epsg=32632)\nprint(f"Admin zones: {len(boundaries)}")\n\n# Point-in-polygon join (building centroids to zones)\nbuildings["centroid"] = buildings.geometry.centroid\ncentroids = buildings.set_geometry("centroid")\njoined = gpd.sjoin(centroids, boundaries, how="left", predicate="within")\n\n# Aggregate: building stats per zone\nstats = joined.groupby("name").agg(\n    n_buildings=("area_m2", "count"),\n    total_footprint_m2=("area_m2", "sum"),\n    mean_building_m2=("area_m2", "mean"),\n).round(0)\nprint("\\nBuilding statistics by zone:")\nprint(stats.sort_values("n_buildings", ascending=False).head(10))`,
      ],
      evidence: [
        'Longley, P. A. et al. (2015). Geographic Information Science and Systems, 4th ed. Wiley.',
        'de Smith, M. J., Goodchild, M. F. & Longley, P. A. (2018). Geospatial Analysis: A Comprehensive Guide, 6th ed. Chapter 4.2: Spatial Overlay.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 17.18'],
      limitations:
        'Large datasets (>1M features) may require spatial indexing (R-tree) for performance. ' +
        'Slivers and edge cases at polygon boundaries can cause incorrect matches. ' +
        'CRS mismatch is the most common source of empty joins.',
    },
    {
      id: 'gis-overlay-analysis',
      title: 'Overlay Analysis (Union / Intersect / Clip)',
      sectionId: 'gis_methods',
      summary:
        'Combine two polygon layers to produce new geometries and merged attributes. ' +
        'Union retains all areas from both layers. Intersect keeps only overlapping areas. ' +
        'Clip (cookie-cutter) trims one layer to the boundary of another.',
      tags: ['spatial_stats', 'land_use'],
      methodology:
        '1. Validate topology of both input layers (no self-intersections).\n' +
        '2. Ensure same CRS; reproject if different.\n' +
        '3. Select operation: union, intersection, difference, symmetric_difference, or identity.\n' +
        '4. Execute: geopandas.overlay(df1, df2, how="intersection").\n' +
        '5. Inspect output for sliver polygons (area < threshold); remove or dissolve.\n' +
        '6. Recalculate area fields after overlay (original areas are no longer valid).\n' +
        '7. Dissolve by attribute if aggregation is needed.',
      tools: ['geopandas (.overlay)', 'shapely (set operations)', 'PostGIS ST_Union / ST_Intersection', 'QGIS'],
      datasets: [
        'Land use / zoning polygons (municipal planning department)',
        'Flood zone or hazard polygons (FEMA, national agencies)',
        'Protected area boundaries (WDPA database)',
        'Development proposal or site plan polygons',
      ],
      examples: [
        'FEMA flood risk: intersection overlay of FEMA 100-year floodplains with residential parcels affecting 13M US properties',
        'London Green Belt: union overlay of Metropolitan Green Belt with borough boundaries for development constraint mapping',
        'Singapore Master Plan: intersection of zoning layers with land ownership to compute developable area across 720 km\u00b2',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\n\n# Overlay analysis: land use vs flood zone intersection\n# Create sample data\nfrom shapely.geometry import box\n\n# Simulated land use zones\nland_use = gpd.GeoDataFrame({\n    "land_use": ["residential", "commercial", "industrial", "park"],\n    "geometry": [box(0,0,100,100), box(100,0,200,100), box(0,100,100,200), box(100,100,200,200)],\n}, crs="EPSG:32632")\nland_use["lu_area"] = land_use.geometry.area\n\n# Simulated flood zone (circular buffer)\nfrom shapely.geometry import Point\nflood_zone = gpd.GeoDataFrame({\n    "flood_risk": ["high"],\n    "geometry": [Point(100, 100).buffer(80)],\n}, crs="EPSG:32632")\n\n# Intersection overlay\nresult = gpd.overlay(land_use, flood_zone, how="intersection")\nresult["affected_area"] = result.geometry.area\nresult["pct_of_zone"] = (result["affected_area"] / result["lu_area"] * 100).round(1)\n\nprint("Flood-affected areas by land use:")\nfor _, row in result.iterrows():\n    print(f"  {row['land_use']}: {row['affected_area']:,.0f} m\u00b2 ({row['pct_of_zone']}% of zone)")\n\n# Difference: areas NOT in flood zone\nsafe = gpd.overlay(land_use, flood_zone, how="difference")\nsafe["safe_area"] = safe.geometry.area\nprint(f"\\nTotal safe area: {safe['safe_area'].sum():,.0f} m\u00b2")`,
      ],
      evidence: [
        'Tomlin, C. D. (1990). Geographic Information Systems and Cartographic Modeling. Prentice Hall.',
        'Bolstad, P. (2019). GIS Fundamentals: A First Text on Geographic Information Systems, 6th ed. XanEdu.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 11.5'],
      limitations:
        'Floating-point precision errors create sliver polygons. ' +
        'Complex polygon overlays on large datasets are computationally expensive. ' +
        'Attribute disambiguation needed when both layers have same column names.',
    },
    {
      id: 'gis-geocoding',
      title: 'Geocoding Methods',
      sectionId: 'gis_methods',
      summary:
        'Convert street addresses or place names to geographic coordinates (forward geocoding) and vice versa (reverse geocoding). ' +
        'Services include Nominatim (free, OSM-based), Google Geocoding API, Mapbox, and US Census Bureau geocoder. ' +
        'Match quality varies with address completeness and country coverage.',
      tags: ['spatial_stats', 'land_use', 'equity'],
      methodology:
        '1. Standardize input addresses: parse to components (street, city, state, postal code).\n' +
        '2. Select geocoding service based on coverage, cost, and accuracy requirements.\n' +
        '3. Batch geocode using geopy or census-geocoder library.\n' +
        '4. Assess match quality: exact match, interpolated, centroid, or no match.\n' +
        '5. Flag low-confidence results (match score < 80%) for manual review.\n' +
        '6. Apply rate limiting and caching to respect service quotas.\n' +
        '7. Validate sample against known coordinates (RMSE < 50 m for urban areas).',
      tools: ['geopy', 'census-geocoder', 'Nominatim API', 'Google Geocoding API', 'pelias'],
      datasets: [
        'OpenAddresses (500M+ open address points globally)',
        'US Census Geocoder (free, bulk processing endpoint)',
        'Nominatim / OpenStreetMap gazetteer',
        'National postal address files (Royal Mail PAF, Australia G-NAF)',
      ],
      examples: [
        'US Census Bureau Geocoder: free service processing up to 10 000 addresses per batch with rooftop-level accuracy for 90%+ of US addresses',
        'OpenCage Geocoder: commercial API providing worldwide coverage with 15 000 req/day free tier for research use',
        'NYC GOAT: city-maintained geocoder achieving 99.7% match rate for 1M+ property addresses using Geosupport engine',
      ],
      prompts: [
        `from geopy.geocoders import Nominatim\nfrom geopy.extra.rate_limiter import RateLimiter\nimport pandas as pd\n\n# Batch geocoding with quality assessment\ngeolocator = Nominatim(user_agent="urban_analytics", timeout=10)\ngeocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)\n\naddresses = [\n    "Hagia Sophia, Istanbul, Turkey",\n    "Galata Tower, Beyoglu, Istanbul",\n    "Dolmabahce Palace, Besiktas, Istanbul",\n    "Grand Bazaar, Fatih, Istanbul",\n]\n\nresults = []\nfor addr in addresses:\n    loc = geocode(addr)\n    if loc:\n        results.append({\n            "address": addr,\n            "lat": round(loc.latitude, 6),\n            "lon": round(loc.longitude, 6),\n            "quality": "matched",\n            "display": loc.address[:60],\n        })\n    else:\n        results.append({"address": addr, "quality": "unmatched"})\n\ndf = pd.DataFrame(results)\nmatch_rate = (df["quality"] == "matched").mean() * 100\nprint(f"Match rate: {match_rate:.0f}%")\nprint(df.to_string(index=False))`,
      ],
      evidence: [
        'Goldberg, D. W. (2008). A Geocoding Best Practices Guide. North American Association of Central Cancer Registries.',
        'Zandbergen, P. A. (2008). A comparison of address point, parcel and street geocoding techniques. Computers, Environment and Urban Systems, 32(3), 214–232.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Free services (Nominatim) have rate limits and lower accuracy in developing countries. ' +
        'Rural and informal settlement addresses have poor geocoding coverage. ' +
        'Privacy considerations apply when geocoding sensitive personal addresses.',
    },
    {
      id: 'gis-coordinate-transformation',
      title: 'Coordinate Transformation',
      sectionId: 'gis_methods',
      summary:
        'Reproject spatial data between coordinate reference systems (CRS). ' +
        'WGS 84 (EPSG:4326) for data exchange, UTM zones for local metre-based analysis, ' +
        'equal-area projections (Mollweide, Albers) for area calculations, equidistant for distance measurement.',
      tags: ['spatial_stats'],
      methodology:
        '1. Identify source CRS from metadata, .prj file, or EPSG code.\n' +
        '2. Select target CRS based on analysis needs: area → equal-area; distance → equidistant; shape → conformal.\n' +
        '3. For UTM zone selection: zone = floor((longitude + 180) / 6) + 1.\n' +
        '4. Reproject with geopandas: gdf.to_crs(epsg=32633) or pyproj.Transformer.\n' +
        '5. Validate: check that coordinates fall within expected bounds.\n' +
        '6. Never compute area or distance in geographic CRS (EPSG:4326).\n' +
        '7. Store original CRS in metadata for provenance.',
      tools: ['pyproj', 'geopandas (.to_crs)', 'proj4', 'QGIS', 'PostGIS ST_Transform'],
      datasets: [
        'EPSG Registry (epsg.io) for CRS definitions',
        'PROJ transformation grids for high-accuracy datum shifts',
        'National geodetic datum definitions (e.g., ETRS89, GDA2020)',
        'Study area data in its native CRS',
      ],
      examples: [
        'European INSPIRE: mandated ETRS89 (EPSG:4258) for all EU spatial data exchange, requiring transformation from 28 national datums',
        'Australia GDA2020: nationwide datum shift from GDA94, requiring 7-parameter transformation for all government datasets',
        'OpenStreetMap: global data in WGS84 requiring local UTM projection for every city-level area/distance calculation',
      ],
      prompts: [
        `import geopandas as gpd\nimport pyproj\nimport numpy as np\n\n# CRS transformation workflow with validation\n\n# Auto-detect UTM zone for a given point\ndef get_utm_epsg(lon: float, lat: float) -> int:\n    zone = int((lon + 180) / 6) + 1\n    hemisphere = 326 if lat >= 0 else 327  # 326xx N, 327xx S\n    return hemisphere * 100 + zone\n\n# Example: Istanbul coordinates\nlon, lat = 29.0, 41.0\nutm_epsg = get_utm_epsg(lon, lat)\nprint(f"Istanbul UTM zone: EPSG:{utm_epsg}")\n\n# Load a sample GeoDataFrame in WGS84\nimport osmnx as ox\nbldg = ox.features_from_place("Kadikoy, Istanbul", tags={"building": True})\nbldg = bldg[bldg.geometry.type.isin(["Polygon", "MultiPolygon"])]\nbldg = gpd.GeoDataFrame(bldg[["geometry"]])\nprint(f"Original CRS: {bldg.crs}")\nprint(f"Sample coords (WGS84): {bldg.geometry.iloc[0].centroid.coords[0]}")\n\n# Transform to local UTM\nbldg_utm = bldg.to_crs(epsg=utm_epsg)\nprint(f"Projected CRS: {bldg_utm.crs}")\nprint(f"Sample coords (UTM): {bldg_utm.geometry.iloc[0].centroid.coords[0]}")\n\n# Now area calculation is valid\nbldg_utm["area_m2"] = bldg_utm.geometry.area\nprint(f"\\nBuilding count: {len(bldg_utm):,}")\nprint(f"Mean area: {bldg_utm['area_m2'].mean():.0f} m\u00b2")\nprint(f"Total footprint: {bldg_utm['area_m2'].sum()/1e6:.2f} km\u00b2")`,
      ],
      evidence: [
        'Snyder, J. P. (1987). Map Projections: A Working Manual. U.S. Geological Survey Professional Paper 1395.',
        'Iliffe, J. & Lott, R. (2008). Datums and Map Projections for Remote Sensing, GIS and Surveying, 2nd ed. Whittles Publishing.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Datum transformations (e.g., NAD27 → WGS84) can introduce metre-level shifts without proper parameters. ' +
        'No single CRS is appropriate for all analysis types. ' +
        'Very large study areas may span multiple UTM zones.',
    },
    {
      id: 'gis-topology-validation',
      title: 'Topology Validation',
      sectionId: 'gis_methods',
      summary:
        'Verify spatial data integrity by detecting topological errors: self-intersections, gaps, overlaps, dangles, ' +
        'and duplicate vertices. Clean topology is a prerequisite for overlay analysis, network routing, and area calculations.',
      tags: ['spatial_stats', 'land_use'],
      methodology:
        '1. Check geometry validity: shapely .is_valid, PostGIS ST_IsValid.\n' +
        '2. Identify specific errors: ST_IsValidReason or shapely explain_validity().\n' +
        '3. Auto-repair with buffer(0) trick or shapely make_valid().\n' +
        '4. Check for overlaps between adjacent polygons (e.g., parcels should tile without overlap).\n' +
        '5. Check for gaps: noding and polygonization to find missing areas.\n' +
        '6. Remove duplicate/near-duplicate vertices (snap tolerance).\n' +
        '7. Validate network topology: connected graph, no dangles, correct directionality.',
      tools: ['shapely (is_valid, make_valid)', 'PostGIS ST_IsValid / ST_MakeValid', 'QGIS Sketcher', 'momepy'],
      datasets: [
        'Input spatial datasets requiring validation',
        'Cadastral/parcel data (strict tiling topology required)',
        'Road network centerlines (connected graph topology)',
        'Building footprint polygons from OSM or AI extraction',
      ],
      examples: [
        'Ordnance Survey MasterMap: UK national topographic dataset with enforced non-overlapping polygon topology across 500M+ features',
        'OpenStreetMap building imports: mass validation of 300M+ building footprints detecting 2-5% self-intersection rate globally',
        'Swiss cadastral survey: sub-centimetre topology enforcement for 5M+ land parcels with zero-overlap, zero-gap rules',
      ],
      prompts: [
        `import geopandas as gpd\nfrom shapely.validation import explain_validity, make_valid\nimport osmnx as ox\n\n# Topology validation workflow\nplace = "Bern, Switzerland"\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])]\ngdf = gpd.GeoDataFrame(buildings[["geometry"]]).to_crs(epsg=32632)\nprint(f"Total features: {len(gdf):,}")\n\n# 1. Check validity\ninvalid_mask = ~gdf.geometry.is_valid\nn_invalid = invalid_mask.sum()\nprint(f"Invalid geometries: {n_invalid} ({n_invalid/len(gdf)*100:.2f}%)")\n\n# 2. Diagnose errors\nif n_invalid > 0:\n    for idx in gdf[invalid_mask].index[:5]:\n        reason = explain_validity(gdf.loc[idx, "geometry"])\n        print(f"  Feature {idx}: {reason}")\n\n# 3. Auto-repair\ngdf["geometry"] = gdf.geometry.apply(lambda g: make_valid(g) if not g.is_valid else g)\nassert gdf.geometry.is_valid.all(), "Repair failed"\nprint(f"After repair: {(~gdf.geometry.is_valid).sum()} invalid")\n\n# 4. Check for overlaps between adjacent buildings\nfrom shapely.ops import unary_union\nmerged = unary_union(gdf.geometry)\ntotal_area = gdf.geometry.area.sum()\nmerged_area = merged.area\noverlap_pct = (total_area - merged_area) / total_area * 100\nprint(f"\\nOverlap: {overlap_pct:.3f}% of total footprint area")\n\n# 5. Check for empty geometries\nn_empty = gdf.geometry.is_empty.sum()\nprint(f"Empty geometries: {n_empty}")\nprint("\\nTopology validation complete.")`,
      ],
      evidence: [
        'ISO 19107:2019 Geographic information — Spatial schema.',
        'van Oosterom, P. (2006). Constraints in Spatial Data Models: with a Focus on the Vector Domain. GeoInformatica, 10(3), 269–294.',
      ],
      sdgAlignment: ['SDG 17.18'],
      limitations:
        'Automatic repair (buffer(0)) can alter geometry in unexpected ways. ' +
        'Large polygons with millions of vertices are slow to validate. ' +
        'Some topology rules are domain-specific (parcels must tile; buildings can overlap parcels).',
    },
    {
      id: 'gis-raster-vector-conversion',
      title: 'Raster–Vector Conversion',
      sectionId: 'gis_methods',
      summary:
        'Convert between raster (grid) and vector (feature) representations. ' +
        'Rasterize (vector → raster) for zonal statistics or raster overlay. ' +
        'Vectorize (raster → vector) to extract polygons from classified imagery or contour lines from DEMs.',
      tags: ['spatial_stats', 'remote_sensing', 'land_use'],
      methodology:
        '1. Rasterize: select attribute field, set pixel size, define extent and CRS.\n' +
        '2. Use rasterio.features.rasterize() with fill=0 and all_touched parameter.\n' +
        '3. Vectorize (polygonize): rasterio.features.shapes() to extract connected regions.\n' +
        '4. Simplify vectorized polygons to reduce vertex count (Douglas–Peucker).\n' +
        '5. Contour generation: use rasterio + matplotlib contour functions or GDAL gdal_contour.\n' +
        '6. Zonal statistics: rasterstats.zonal_stats() to compute stats per polygon zone.\n' +
        '7. Validate: check area totals and pixel counts for consistency.',
      tools: ['rasterio', 'rasterstats', 'geopandas', 'GDAL (gdal_rasterize, gdal_polygonize)', 'xarray'],
      datasets: [
        'Classified land use/land cover rasters (e.g., ESA WorldCover 10m)',
        'DEM/DSM rasters for contour generation (SRTM, ALOS)',
        'Building footprint vectors for rasterization',
        'Census or admin boundary polygons for zonal statistics',
      ],
      examples: [
        'ESA WorldCover: vectorization of 10m global land cover raster to produce urban extent polygons for 10 000+ cities',
        'USGS 3DEP: contour generation from 1m LiDAR DEMs covering 80% of US territory for flood and terrain analysis',
        'EU Copernicus Urban Atlas: rasterization of vector land use classes into consistent 10m grid for change detection',
      ],
      prompts: [
        `import rasterio\nimport geopandas as gpd\nimport numpy as np\nfrom rasterstats import zonal_stats\n\n# Zonal statistics: compute land cover composition per district\n# This example uses a classified raster and admin boundary polygons\n\n# Simulated example with synthetic data\nfrom rasterio.transform import from_bounds\nfrom shapely.geometry import box\n\n# Create a sample raster (10 classes)\nwidth, height = 500, 500\ntransform = from_bounds(28.8, 40.9, 29.2, 41.2, width, height)\nnp.random.seed(42)\ndata = np.random.choice([1, 2, 3, 4, 5], size=(height, width), p=[0.3, 0.25, 0.2, 0.15, 0.1]).astype(np.uint8)\n\n# Write raster\nwith rasterio.open("landcover.tif", "w", driver="GTiff", height=height, width=width,\n                   count=1, dtype="uint8", crs="EPSG:4326", transform=transform) as dst:\n    dst.write(data, 1)\n\n# Create sample zones\nzones = gpd.GeoDataFrame({\n    "district": ["North", "South", "East", "West"],\n    "geometry": [box(28.8,41.05,29.0,41.2), box(28.8,40.9,29.0,41.05),\n                 box(29.0,41.05,29.2,41.2), box(29.0,40.9,29.2,41.05)],\n}, crs="EPSG:4326")\n\n# Compute zonal statistics\nclass_names = {1: "built-up", 2: "vegetation", 3: "water", 4: "bare", 5: "agriculture"}\nfor _, zone in zones.iterrows():\n    stats = zonal_stats(zone.geometry, "landcover.tif", categorical=True)[0]\n    total = sum(stats.values())\n    print(f"\\n{zone['district']}:")\n    for cls, count in sorted(stats.items()):\n        pct = count / total * 100\n        print(f"  {class_names.get(cls, cls)}: {pct:.1f}%")`,
      ],
      evidence: [
        'Burrough, P. A., McDonnell, R. A. & Lloyd, C. D. (2015). Principles of Geographical Information Systems, 3rd ed. Oxford University Press.',
        'Pebesma, E. (2018). Simple features for R: standardized support for spatial vector data. The R Journal, 10(1), 439–446.',
      ],
      sdgAlignment: ['SDG 15.1', 'SDG 11.3'],
      limitations:
        'Rasterization introduces discretization error proportional to cell size. ' +
        'Vectorization of noisy rasters produces excessively complex polygons. ' +
        'Zonal statistics with small polygons and coarse rasters yield unreliable results.',
    },
    {
      id: 'gis-spatial-sampling',
      title: 'Spatial Sampling Design',
      sectionId: 'gis_methods',
      summary:
        'Design statistically valid sampling schemes for spatial data collection. ' +
        'Random sampling ensures unbiased estimation; stratified sampling improves precision for heterogeneous areas; ' +
        'systematic (grid) sampling provides uniform coverage; cluster sampling reduces travel cost.',
      tags: ['spatial_stats', 'land_use', 'health'],
      methodology:
        '1. Define target population and variable of interest.\n' +
        '2. Determine sample size: n = (z² × σ² × DEFF) / E² (design effect accounts for spatial clustering).\n' +
        '3. Select scheme: simple random, stratified (by land use or district), systematic grid, or cluster.\n' +
        '4. Generate sample points: geopandas + shapely random_points_in_polygon or regular grid.\n' +
        '5. Ensure minimum distance between points to reduce spatial autocorrelation.\n' +
        '6. Stratify by auxiliary variable (e.g., population density) for proportional allocation.\n' +
        '7. Export sample locations as GeoJSON with unique IDs for field collection.\n' +
        '8. Assess spatial coverage: nearest-neighbor distance histogram, Voronoi diagram.',
      tools: ['geopandas', 'shapely', 'scikit-learn (stratified splits)', 'numpy.random', 'QGIS'],
      datasets: [
        'Study area administrative boundary polygon',
        'Stratification layers (land use, population density, elevation)',
        'Accessible roads/paths for field navigation',
        'Existing sampling frames (address lists, building inventory)',
      ],
      examples: [
        'WHO STEPS Survey: multi-stage cluster sampling in 100+ countries for NCD risk factor surveillance with spatial stratification',
        'US Forest Inventory and Analysis: systematic hexagonal grid of 125 000+ permanent sample plots covering 310M hectares',
        'Slum Dwellers International: participatory spatial sampling in 30+ countries adapting stratified designs to informal settlement morphology',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\nfrom shapely.geometry import Point, box\nimport matplotlib.pyplot as plt\n\n# Spatial sampling design: stratified random within zones\nnp.random.seed(42)\n\n# Create study area with strata (4 land use zones)\nstrata = gpd.GeoDataFrame({\n    "stratum": ["dense_urban", "suburban", "peri_urban", "rural"],\n    "target_density": [10, 5, 3, 2],  # samples per km\u00b2\n    "geometry": [box(0,0,1000,1000), box(1000,0,2000,1000),\n                 box(0,1000,1000,2000), box(1000,1000,2000,2000)],\n}, crs="EPSG:32632")\nstrata["area_km2"] = strata.geometry.area / 1e6\n\n# Generate stratified random sample\ndef random_points_in_polygon(polygon, n):\n    points = []\n    minx, miny, maxx, maxy = polygon.bounds\n    while len(points) < n:\n        x = np.random.uniform(minx, maxx)\n        y = np.random.uniform(miny, maxy)\n        p = Point(x, y)\n        if polygon.contains(p):\n            points.append(p)\n    return points\n\nall_samples = []\nfor _, row in strata.iterrows():\n    n = int(row["target_density"] * row["area_km2"])\n    pts = random_points_in_polygon(row.geometry, n)\n    for i, pt in enumerate(pts):\n        all_samples.append({"sample_id": f"{row['stratum']}_{i+1}", "stratum": row["stratum"], "geometry": pt})\n\nsamples = gpd.GeoDataFrame(all_samples, crs="EPSG:32632")\nprint(f"Total samples: {len(samples)}")\nprint(samples.groupby("stratum").size())\n\n# Minimum distance check\nfrom scipy.spatial import distance_matrix\ncoords = np.array([[p.x, p.y] for p in samples.geometry])\ndists = distance_matrix(coords, coords)\nnp.fill_diagonal(dists, np.inf)\nmin_dist = dists.min(axis=1)\nprint(f"\\nMin nearest-neighbor distance: {min_dist.min():.0f} m")\nprint(f"Mean nearest-neighbor distance: {min_dist.mean():.0f} m")`,
      ],
      evidence: [
        'Wang, J.-F. et al. (2012). A measure of spatial stratified heterogeneity. Ecological Indicators, 67, 250–256.',
        'Diggle, P. J. (2003). Statistical Analysis of Spatial Point Patterns, 2nd ed. Hodder Arnold. Chapter 2: Sampling and Data Collection.',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 11.3'],
      limitations:
        'Simple random sampling may under-represent rare land cover types. ' +
        'Grid sampling does not account for spatial heterogeneity. ' +
        'Practical access constraints (private property, hazardous areas) modify ideal designs.',
    },
  ];
}
