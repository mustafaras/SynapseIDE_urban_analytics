import type { Card } from '../lib/types';

/**
 * VoxCity 3D Environment & Simulation seed cards.
 * Covers 3D modelling, CityJSON, solar analysis, and microsimulation methods.
 */
export function buildVoxCityCards(_existing?: Set<string>): Card[] {
  return [
    // ── VoxCity section ──────────────────────────────────────
    {
      id: 'voxcity-building-extrusion',
      title: 'Building Extrusion (3D)',
      sectionId: 'voxcity',
      summary:
        'Generate 3D building volumes from 2D GeoJSON footprints by extruding polygons to measured ' +
        'or estimated heights. Supports flat-roof and parametric-roof modes. Integrates with MapLibre ' +
        'GL fill-extrusion layers for real-time GPU rendering of large urban areas.',
      tags: ['3d_modeling', 'voxcity', 'land_use', 'density'],
      methodology:
        '1. Load building footprint polygons (GeoJSON / GeoPackage).\n' +
        '2. Join height attributes from LiDAR, cadastre, or OSM tags.\n' +
        '3. Estimate missing heights via floor-count heuristic (floor × 3.2 m).\n' +
        '4. Extrude polygons to height using fill-extrusion-height.\n' +
        '5. Apply colour ramp by height, use, or age.\n' +
        '6. Enable shadow and ambient-occlusion post-processing.\n' +
        '7. Export scene as glTF or 3D Tiles.',
      tools: ['MapLibre GL JS', 'Three.js', '@react-three/fiber', 'Turf.js'],
      datasets: [
        'OpenStreetMap building footprints (building:levels, height tags)',
        'Microsoft Building Footprints (125 M+ global polygons)',
        'Google Open Buildings — ML-derived footprints for Africa/South Asia',
        'Municipal cadastre with floor count and elevation data',
      ],
      examples: [
        'Amsterdam 3D city model: 190 000 building extrusions from BAG + AHN3 for solar analysis',
        'Singapore urban heat island study: extruded footprints for shadow-casting simulations',
        'Medellín informal settlement mapping: height estimation from drone photogrammetry + extrusion',
      ],
      prompts: [
        `import geopandas as gpd\nimport json\n\n# 1. Load building footprints\nbuildings = gpd.read_file("buildings.geojson")\n\n# 2. Estimate missing heights from floor count\nbuildings["height"] = buildings["height"].fillna(buildings["building:levels"].fillna(2) * 3.2)\n\n# 3. Generate MapLibre fill-extrusion source\ngeojson = json.loads(buildings[["geometry", "height", "building:levels"]].to_json())\n\n# MapLibre layer specification\nlayer_spec = {\n    "id": "3d-buildings",\n    "type": "fill-extrusion",\n    "source": {"type": "geojson", "data": geojson},\n    "paint": {\n        "fill-extrusion-color": [\n            "interpolate", ["linear"], ["get", "height"],\n            0, "#ffffcc", 20, "#fd8d3c", 60, "#800026"\n        ],\n        "fill-extrusion-height": ["get", "height"],\n        "fill-extrusion-base": 0,\n        "fill-extrusion-opacity": 0.85\n    }\n}\nprint(json.dumps(layer_spec, indent=2))`,
        `# Export 3D buildings as glTF for Three.js\nimport trimesh\nimport numpy as np\nfrom shapely.geometry import mapping\n\ndef extrude_building(geom, height):\n    """Extrude a 2D polygon to a 3D mesh."""\n    coords = np.array(geom.exterior.coords)[:, :2]\n    mesh = trimesh.creation.extrude_polygon(geom, height)\n    return mesh\n\nscene = trimesh.Scene()\nfor _, row in buildings.iterrows():\n    mesh = extrude_building(row.geometry, row["height"])\n    scene.add_geometry(mesh)\n\nscene.export("city_buildings.glb")\nprint(f"Exported {len(buildings)} buildings to glTF")`,
      ],
      evidence: [
        'Biljecki, F. et al. (2015). Applications of 3D City Models: State of the Art Review. ISPRS Int. J. Geo-Inf., 4(4), 2842–2889.',
        'Over, M. et al. (2010). Generating web-based 3D City Models from OpenStreetMap. International Journal of 3-D Information Modeling, 1(1), 1–15.',
      ],
      limitations:
        'Flat-roof assumption oversimplifies roof geometry. Extrusion from 2D footprints cannot ' +
        'represent overhangs, stepped buildings, or complex architectural forms. Large datasets ' +
        '(>100 k buildings) may require tile-based streaming.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.7'],
    },
    {
      id: 'voxcity-cityjson-loader',
      title: 'CityJSON / CityGML Loader',
      sectionId: 'voxcity',
      summary:
        'Parse and visualise CityJSON and CityGML datasets — the OGC standards for semantic 3D city ' +
        'models. Supports LoD 1–3 geometry, semantic surfaces, and attribute inspection. Converts ' +
        'to Three.js BufferGeometry for interactive 3D exploration.',
      tags: ['3d_modeling', 'voxcity', 'data_engineering'],
      methodology:
        '1. Load CityJSON file (v1.1 / v2.0) or convert CityGML via citygml-tools.\n' +
        '2. Parse CityObjects by type (Building, Road, LandUse, WaterBody, Vegetation).\n' +
        '3. Triangulate boundary surfaces per LoD.\n' +
        '4. Generate BufferGeometry with per-face semantic colouring.\n' +
        '5. Attach attribute table for click-to-inspect.\n' +
        '6. Apply geo-referencing transform (translate + rotate to map CRS).',
      tools: ['cjio', 'citygml-tools', 'Three.js', 'earcut (triangulation)'],
      datasets: [
        '3D BAG v2 (Netherlands) — 10 M buildings in CityJSON LoD 1.2/1.3/2.2',
        'Helsinki 3D City Model — CityGML LoD2 with textures',
        'NYC 3D Building Model — CityGML with 1 M+ buildings',
        'Berlin 3D Stadtmodell — CityGML LoD2 open data',
      ],
      examples: [
        'Rotterdam energy retrofit planning: CityJSON LoD2 models for rooftop solar potential + wall insulation area calculation',
        'Helsinki flood simulation: 3D BAG + terrain model for stormwater runoff visualisation',
        'Singapore digital twin: CityGML import pipeline for national urban planning platform',
      ],
      prompts: [
        `import cjio.cityjson as cj\nimport json\nimport numpy as np\n\n# 1. Load CityJSON file\ncm = cj.load("city_model.city.json")\nprint(f"CityObjects: {len(cm.j['CityObjects'])}  | LoDs: {cm.get_lod()}")\ n\n# 2. Filter buildings only\ncm_buildings = cm.get_cityobjects(type="Building")\nprint(f"Buildings: {len(cm_buildings)}")\ n\n# 3. Compute statistics\nareas = []\nfor obj_id, obj in cm.j["CityObjects"].items():\n    if obj["type"] == "Building":\n        for geom in obj.get("geometry", []):\n            if "semantics" in geom:\n                for surface in geom["semantics"].get("surfaces", []):\n                    if surface.get("type") == "RoofSurface":\n                        areas.append(surface.get("area", 0))\n\nprint(f"Roof surfaces: {len(areas)}, Mean area: {np.mean(areas):.1f} m²")`,
        `# Convert CityJSON to Three.js BufferGeometry JSON\nimport cjio.cityjson as cj\nimport json\nimport numpy as np\n\ncm = cj.load("city_model.city.json")\nvertices = np.array(cm.j["vertices"]) * np.array(cm.j["transform"]["scale"]) + np.array(cm.j["transform"]["translate"])\n\n# Triangulate each building and collect faces\nall_positions = []\nfor obj_id, obj in cm.j["CityObjects"].items():\n    for geom in obj.get("geometry", []):\n        for boundary in geom.get("boundaries", []):\n            for ring in boundary:\n                if len(ring) >= 3:\n                    for i in range(1, len(ring[0]) - 1):\n                        all_positions.extend(vertices[ring[0][0]].tolist())\n                        all_positions.extend(vertices[ring[0][i]].tolist())\n                        all_positions.extend(vertices[ring[0][i+1]].tolist())\n\nprint(f"Triangles: {len(all_positions) // 9}")\nwith open("city_mesh.json", "w") as f:\n    json.dump({"positions": all_positions}, f)`,
      ],
      evidence: [
        'Ledoux, H. et al. (2019). CityJSON: A compact and easy-to-use encoding of the CityGML data model. Open Geospatial Data, Software and Standards, 4(4).',
        'Biljecki, F. et al. (2021). Open government geospatial data on buildings for planning sustainable cities. arXiv:2107.04023.',
      ],
      limitations:
        'Large models (>500 MB) require streaming or tiling. LoD 3 interior geometry is rarely ' +
        'available. CityGML XML parsing is slower than CityJSON; prefer CityJSON for web apps.',
      sdgAlignment: ['SDG 11.3', 'SDG 9.1'],
    },
    {
      id: 'voxcity-sunlight-solar',
      title: 'Sunlight & Solar Exposure',
      sectionId: 'voxcity',
      summary:
        'Simulate direct and diffuse solar irradiance on building facades and ground surfaces across ' +
        'a full day or year. Computes shadow casting from 3D building volumes using astronomical sun ' +
        'position (solar declination + hour angle). Outputs exposure hours, shadow maps, and building-level ' +
        'solar potential summaries.',
      tags: ['3d_modeling', 'voxcity', 'climate', 'energy'],
      methodology:
        '1. Define study area, date range, and time step (e.g., 30 min).\n' +
        '2. Compute sun position (azimuth, elevation) for each timestamp.\n' +
        '3. For each building, project ground-plane shadows from volume + sun vector.\n' +
        '4. Rasterise shadow polygons to analysis grid.\n' +
        '5. Accumulate sunlit hours per grid cell.\n' +
        '6. Build exposure summary per building (min / max / mean hours).\n' +
        '7. Export grid as CSV, buildings as GeoJSON with solar attributes.',
      tools: ['SunlightSimulator engine', 'Three.js DataTexture', 'R3F Canvas', 'pvlib'],
      datasets: [
        'Local 3D building model (CityJSON / extruded footprints)',
        'ERA5 hourly solar radiation data (Copernicus Climate Data Store)',
        'Meteonorm TMY (Typical Meteorological Year) files',
        'PVGIS solar radiation database (European Commission JRC)',
      ],
      examples: [
        'Vienna solar cadastre: rooftop irradiance map for 250 000 buildings informing photovoltaic subsidy allocation',
        'Singapore HDB solar potential: façade + roof analysis for vertical solar farms on public housing',
        'Barcelona right-to-light study: shadow-hour maps identifying buildings losing >4 h sunlight from new development',
      ],
      prompts: [
        `import numpy as np\nimport pvlib\nfrom datetime import datetime\nimport geopandas as gpd\n\n# 1. Define study parameters\nlat, lon = 41.3874, 2.1686  # Barcelona\ndate = datetime(2024, 6, 21)  # Summer solstice\ntimes = pvlib.solarposition.get_solarposition(\n    pd.date_range(f"{date:%Y-%m-%d} 06:00", f"{date:%Y-%m-%d} 21:00", freq="30min"),\n    lat, lon\n)\ntimes = times[times["apparent_elevation"] > 0]\nprint(f"Sun positions: {len(times)} steps from sunrise to sunset")\n\n# 2. For each timestep, compute shadow polygons\nfrom shapely.affinity import translate\nfrom shapely.ops import unary_union\n\nbuildings = gpd.read_file("buildings_3d.gpkg")\n\ndef shadow_polygon(footprint, height, azimuth_deg, elevation_deg):\n    """Project building shadow on ground plane."""\n    az_rad = np.radians(azimuth_deg)\n    shadow_len = height / np.tan(np.radians(elevation_deg))\n    dx = -shadow_len * np.sin(az_rad)\n    dy = -shadow_len * np.cos(az_rad)\n    shadow = translate(footprint, xoff=dx, yoff=dy)\n    return footprint.union(shadow).convex_hull\n\n# 3. Accumulate shadow maps\nfor idx, row in times.iterrows():\n    shadows = buildings.apply(\n        lambda b: shadow_polygon(b.geometry, b["height"], row["azimuth"], row["apparent_elevation"]),\n        axis=1\n    )\n    shadow_union = unary_union(shadows)\n    # Rasterise and accumulate...\nprint("Shadow accumulation complete")`,
        `# Quick solar exposure summary per building\nimport pandas as pd\n\n# Assuming 'sunlit_hours' column already computed\nsummary = buildings.groupby("district").agg(\n    mean_hours=("sunlit_hours", "mean"),\n    min_hours=("sunlit_hours", "min"),\n    buildings_below_2h=("sunlit_hours", lambda x: (x < 2).sum()),\n).round(1)\nprint(summary.to_markdown())`,
      ],
      evidence: [
        'Freitas, S. et al. (2015). Modelling solar potential in the urban environment: State-of-the-art review. Renewable and Sustainable Energy Reviews, 41, 915–931.',
        'Redweik, P. et al. (2013). Solar energy potential on roofs and facades in an urban landscape. Solar Energy, 97, 332–341.',
      ],
      limitations:
        'Current implementation assumes flat roofs and does not account for diffuse radiation, ' +
        'reflections, or vegetation shading. Accuracy depends on building model completeness.',
      sdgAlignment: ['SDG 7.2', 'SDG 11.6'],
    },
    {
      id: 'voxcity-digital-twin',
      title: 'Digital Twin Overview',
      sectionId: 'voxcity',
      summary:
        'Create an integrated 3D digital twin of an urban area by combining building models, terrain, ' +
        'vegetation, infrastructure networks, and real-time sensor data. The twin serves as a shared ' +
        'analytical canvas for scenario planning, environmental simulation, and stakeholder engagement.',
      tags: ['3d_modeling', 'voxcity', 'land_use', 'indicators'],
      methodology:
        '1. Acquire base terrain (DEM / DSM) and drape imagery.\n' +
        '2. Load building layer (CityJSON or extruded footprints).\n' +
        '3. Overlay street network, transit lines, green spaces.\n' +
        '4. Integrate IoT / sensor feeds (air quality, traffic counts).\n' +
        '5. Register layers to common CRS and origin.\n' +
        '6. Enable time slider for temporal exploration.\n' +
        '7. Connect simulation engines (sunlight, noise, pedestrian flow).',
      tools: ['Three.js', 'MapLibre GL JS', 'deck.gl', 'CesiumJS'],
      datasets: [
        'OpenStreetMap (buildings, roads, amenities, green spaces)',
        'CityJSON / CityGML semantic 3D models',
        'GTFS transit feeds for real-time vehicle positions',
        'IoT sensor APIs (air quality, noise, traffic counters)',
        'Copernicus DEM for terrain base layer',
      ],
      examples: [
        'Helsinki Energy & Weather digital twin: real-time building energy consumption + weather overlay for district heating optimisation',
        'Zurich urban planning twin: interactive scenario comparison for zoning changes on Hardbrücke corridor',
        'Singapore Virtual Singapore: national-scale 3D twin integrating solar, wind, pedestrian simulations',
      ],
      prompts: [
        `import geopandas as gpd\nimport json\nfrom pathlib import Path\n\n# Digital Twin Layer Assembly Script\n# Combines multiple urban datasets into a unified scene definition\n\nlayers = {}\n\n# 1. Buildings layer\nbuildings = gpd.read_file("buildings_3d.gpkg")\nlayers["buildings"] = {\n    "type": "3d-extrusion",\n    "source": "buildings_3d.geojson",\n    "count": len(buildings),\n    "attributes": list(buildings.columns),\n}\n\n# 2. Street network\nstreets = gpd.read_file("street_network.gpkg")\nlayers["streets"] = {\n    "type": "line",\n    "source": "streets.geojson",\n    "count": len(streets),\n}\n\n# 3. Green spaces\ngreen = gpd.read_file("green_spaces.gpkg")\nlayers["green_spaces"] = {\n    "type": "polygon",\n    "source": "green.geojson",\n    "count": len(green),\n}\n\n# 4. Sensor locations\nsensors = gpd.read_file("iot_sensors.gpkg")\nlayers["sensors"] = {\n    "type": "point-realtime",\n    "source": "sensors.geojson",\n    "api_endpoint": "https://api.city.gov/sensors/latest",\n    "count": len(sensors),\n}\n\n# Write scene manifest\nscene = {"crs": "EPSG:3857", "center": [lon, lat], "layers": layers}\nPath("twin_scene.json").write_text(json.dumps(scene, indent=2))\nprint(f"Digital twin scene: {sum(l['count'] for l in layers.values())} features across {len(layers)} layers")`,
        `# Layer health check — validate all datasets before twin assembly\nimport geopandas as gpd\nfrom pathlib import Path\n\nrequired_layers = ["buildings_3d.gpkg", "street_network.gpkg", "green_spaces.gpkg", "iot_sensors.gpkg"]\nfor layer_path in required_layers:\n    p = Path(layer_path)\n    if p.exists():\n        gdf = gpd.read_file(p)\n        print(f"  ✓ {p.name}: {len(gdf)} features, CRS={gdf.crs}")\n    else:\n        print(f"  ✗ {p.name}: MISSING")`,
      ],
      evidence: [
        'Deng, T. et al. (2021). A systematic review of a digital twin city: A new pattern of urban governance toward smart cities. J. of Management Science and Engineering, 6(2), 125–134.',
        'Shahat, E. et al. (2021). City Digital Twin Potentials: A Review and Research Agenda. Sustainability, 13(6), 3386.',
      ],
      limitations:
        'Digital twins require sustained data integration and maintenance. Semantic interoperability ' +
        'across datasets remains challenging. Rendering very large scenes demands LoD streaming.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
    },
    {
      id: 'voxcity-terrain-3d',
      title: '3D Terrain & DSM Visualisation',
      sectionId: 'voxcity',
      summary:
        'Render Digital Elevation Models (DEM) and Digital Surface Models (DSM) as 3D terrain meshes. ' +
        'Supports hillshade, slope, aspect, and viewshed overlays. Combine with building extrusions ' +
        'for a topographically accurate city model.',
      tags: ['3d_modeling', 'voxcity', 'remote_sensing'],
      methodology:
        '1. Obtain DEM/DSM raster (GeoTIFF, SRTM, or LiDAR-derived).\n' +
        '2. Re-project to local metre-based CRS.\n' +
        '3. Downsample to target mesh resolution.\n' +
        '4. Generate PlaneBufferGeometry and displace vertices by elevation.\n' +
        '5. Apply satellite imagery or slope-coloured texture.\n' +
        '6. Clip to study area boundary polygon.\n' +
        '7. Merge with building layer at matching origin.',
      tools: ['Three.js', 'GDAL', 'rasterio', 'MapLibre Terrain'],
      datasets: [
        'Copernicus DEM GLO-30 — global 30 m elevation (ESA)',
        'SRTM 1-arc-second (~30 m) DEM — USGS Earth Explorer',
        'AHN4 (Netherlands) 0.5 m LiDAR-derived DSM',
        'Local municipal LiDAR surveys (1–5 m resolution)',
      ],
      examples: [
        'Hong Kong terrain model: 2 m LiDAR DSM draped with orthophoto for hillside development risk assessment',
        'Quito flood vulnerability: DEM slope analysis identifying runoff concentration zones',
        'Istanbul seismic microzonation: terrain + geological layers for site amplification mapping',
      ],
      prompts: [
        `import rasterio\nimport numpy as np\nfrom rasterio.warp import calculate_default_transform, reproject, Resampling\n\n# 1. Load DEM and reproject to local CRS\nwith rasterio.open("copernicus_dem.tif") as src:\n    dst_crs = "EPSG:32633"  # UTM zone 33N\n    transform, width, height = calculate_default_transform(\n        src.crs, dst_crs, src.width, src.height, *src.bounds\n    )\n    dem = np.empty((height, width), dtype=np.float32)\n    reproject(\n        source=rasterio.band(src, 1),\n        destination=dem,\n        dst_transform=transform,\n        dst_crs=dst_crs,\n        resampling=Resampling.bilinear\n    )\n\n# 2. Compute slope and aspect\ndy, dx = np.gradient(dem, 30.0)  # 30 m cell size\nslope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))\naspect = np.degrees(np.arctan2(-dx, dy)) % 360\nprint(f"Elevation range: {dem.min():.0f}–{dem.max():.0f} m")\nprint(f"Mean slope: {slope.mean():.1f}°")`,
        `# Generate Three.js displacement mesh from DEM\nimport json\nimport numpy as np\n\n# Downsample DEM for web rendering\nfrom scipy.ndimage import zoom\ngrid = zoom(dem, 0.25, order=1)  # 4x downsample\nrows, cols = grid.shape\n\n# Flatten to vertex array (x, y, z)\nvertices = []\nfor r in range(rows):\n    for c in range(cols):\n        vertices.extend([c * 30 * 4, grid[r, c], r * 30 * 4])\n\nprint(f"Mesh vertices: {rows * cols}, grid: {rows}×{cols}")\nwith open("terrain_mesh.json", "w") as f:\n    json.dump({"vertices": vertices, "rows": rows, "cols": cols}, f)`,
      ],
      evidence: [
        'Hirt, C. (2018). Artefact detection in global digital elevation models (DEMs). Earth and Space Science, 5(7), 308–323.',
        'Tadono, T. et al. (2014). Precise global DEM generation by ALOS PRISM. ISPRS Annals, II-4, 71–76.',
      ],
      limitations:
        'SRTM data has ~30 m resolution; fine-scale urban terrain requires LiDAR. ' +
        'Large raster tiles (>4096×4096) may exceed GPU texture limits.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.5'],
    },
    {
      id: 'voxcity-point-cloud',
      title: 'Point Cloud Processing',
      sectionId: 'voxcity',
      summary:
        'Load, filter, classify, and visualise LiDAR point clouds for urban 3D reconstruction. ' +
        'Supports LAS/LAZ formats, ground classification, building segmentation, and conversion ' +
        'to mesh or voxel representations.',
      tags: ['3d_modeling', 'voxcity', 'point_cloud', 'remote_sensing'],
      methodology:
        '1. Ingest LAS/LAZ point cloud.\n' +
        '2. Apply noise filtering (SOR / radius outlier removal).\n' +
        '3. Classify ground vs. non-ground (CSF or progressive morphological).\n' +
        '4. Segment buildings by planar region growing.\n' +
        '5. Extract roof planes and reconstruct LoD2 building models.\n' +
        '6. Visualise in 3D using Potree or Three.js Points material.\n' +
        '7. Export classified cloud or derived meshes.',
      tools: ['PDAL', 'CloudCompare', 'Potree', 'Open3D'],
      datasets: [
        'AHN4 (Netherlands) — national LiDAR, 8+ pts/m²',
        'USGS 3DEP — US national LiDAR (1–2 pts/m²)',
        'Aerial LiDAR from municipal surveying departments',
        'Terrestrial/mobile LiDAR for street-level detail',
      ],
      examples: [
        'Amsterdam tree canopy extraction: AHN point cloud classification for urban forest inventory (4 M trees)',
        'Tokyo post-earthquake damage assessment: pre/post LiDAR differencing for collapsed building detection',
        'Zurich noise barrier modelling: point cloud surface reconstruction for acoustic simulation input',
      ],
      prompts: [
        `import pdal\nimport json\n\n# 1. PDAL pipeline for ground classification + building segmentation\npipeline = {\n    "pipeline": [\n        {"type": "readers.las", "filename": "urban_lidar.laz"},\n        {"type": "filters.assign", "assignment": "Classification[:]=0"},\n        {"type": "filters.elm"},  # Extended Local Minimum (noise removal)\n        {"type": "filters.outlier", "method": "statistical", "mean_k": 12, "multiplier": 2.2},\n        {"type": "filters.smrf", "slope": 0.15, "window": 18, "threshold": 0.5},  # Ground classification\n        {"type": "filters.range", "limits": "Classification[2:2]"},  # Keep ground only\n        {"type": "writers.las", "filename": "ground.laz"}\n    ]\n}\n\np = pdal.Pipeline(json.dumps(pipeline))\np.execute()\nprint(f"Ground points: {p.arrays[0].shape[0]:,}")`,
        `# Building footprint extraction from classified point cloud\nimport open3d as o3d\nimport numpy as np\n\n# Load non-ground points (class 6 = buildings)\npcd = o3d.io.read_point_cloud("buildings_only.ply")\nprint(f"Building points: {len(pcd.points):,}")\n\n# Cluster buildings using DBSCAN\nlabels = np.array(pcd.cluster_dbscan(eps=2.0, min_points=50))\nmax_label = labels.max()\nprint(f"Detected {max_label + 1} building clusters")\n\n# Extract convex hull per cluster as footprint\nfor i in range(max_label + 1):\n    cluster = pcd.select_by_index(np.where(labels == i)[0])\n    hull, _ = cluster.compute_convex_hull()\n    height = np.asarray(cluster.points)[:, 2].max() - np.asarray(cluster.points)[:, 2].min()\n    print(f"  Building {i}: {len(cluster.points)} pts, height={height:.1f} m")`,
      ],
      evidence: [
        'Heidemann, H. K. (2018). LiDAR Base Specification, v1.3. USGS Techniques and Methods, Book 11, Chapter B4.',
        'Shan, J. & Toth, C. K. (Eds.) (2018). Topographic Laser Ranging and Scanning: Principles and Processing (2nd ed.). CRC Press.',
      ],
      limitations:
        'Point cloud processing is computationally intensive. Web-based viewers require octree ' +
        'indexing for scenes >50 M points. Classification accuracy depends on point density.',
      sdgAlignment: ['SDG 11.3', 'SDG 15.1'],
    },

    // ── Simulation section ───────────────────────────────────
    {
      id: 'sim-agent-based',
      title: 'Agent-Based Modelling (ABM)',
      sectionId: 'simulation',
      summary:
        'Model individual agents (pedestrians, vehicles, households) with heterogeneous behaviours ' +
        'and decision rules. Agents interact with each other and the built environment to produce ' +
        'emergent urban patterns such as segregation, congestion, or land-use change.',
      tags: ['agent_based', 'scenario', 'pedestrian', 'land_use'],
      methodology:
        '1. Define agent types, attributes, and decision rules.\n' +
        '2. Create environment grid or network graph.\n' +
        '3. Initialise agent population from census or survey data.\n' +
        '4. Run simulation loop: perceive → decide → act → update.\n' +
        '5. Collect aggregate outputs (density maps, flow counts).\n' +
        '6. Calibrate against observed data; sensitivity analysis.\n' +
        '7. Compare scenarios by varying parameters.',
      tools: ['Mesa (Python)', 'NetLogo', 'GAMA Platform', 'Three.js (viz)'],
      datasets: [
        'Census micro-data (age, income, household size) for agent initialisation',
        'OpenStreetMap road/building network as environment grid',
        'National household travel survey for mobility behaviour parameters',
        'Land-use / zoning maps for environmental constraints',
      ],
      examples: [
        'Schelling segregation model for Munich: simulating ethnic/income residential sorting under varying tolerance thresholds',
        'São Paulo informal housing emergence: ABM of land invasion dynamics near transit corridors',
        'Melbourne pandemic mobility: agent-based simulation of lockdown compliance by neighbourhood socioeconomic profile',
      ],
      prompts: [
        `import mesa\nimport numpy as np\n\n# Schelling Segregation ABM using Mesa\nclass SchellingAgent(mesa.Agent):\n    def __init__(self, unique_id, model, agent_type):\n        super().__init__(unique_id, model)\n        self.type = agent_type\n\n    def step(self):\n        similar = 0\n        total = 0\n        for neighbor in self.model.grid.get_neighbors(self.pos, moore=True, radius=1):\n            total += 1\n            if neighbor.type == self.type:\n                similar += 1\n        if total > 0 and similar / total < self.model.homophily:\n            self.model.grid.move_to_empty(self)\n\nclass SchellingModel(mesa.Model):\n    def __init__(self, width=50, height=50, density=0.8, minority_pct=0.4, homophily=0.4):\n        super().__init__()\n        self.homophily = homophily\n        self.grid = mesa.space.SingleGrid(width, height, torus=True)\n        self.schedule = mesa.time.RandomActivation(self)\n\n        for cell in self.grid.coord_iter():\n            _, pos = cell\n            if self.random.random() < density:\n                agent_type = 0 if self.random.random() < minority_pct else 1\n                agent = SchellingAgent(self.next_id(), self, agent_type)\n                self.grid.place_agent(agent, pos)\n                self.schedule.add(agent)\n\n    def step(self):\n        self.schedule.step()\n\n# Run simulation\nmodel = SchellingModel(width=50, height=50, homophily=0.5)\nfor i in range(100):\n    model.step()\nprint(f"Simulation complete: {model.schedule.get_agent_count()} agents")`,
        `# Batch run with parameter sweep\nimport mesa\nfrom mesa.batchrunner import batch_run\nimport pandas as pd\n\nresults = batch_run(\n    SchellingModel,\n    parameters={"homophily": [0.3, 0.4, 0.5, 0.6, 0.7], "density": [0.7, 0.8, 0.9]},\n    iterations=10,\n    max_steps=200,\n    data_collection_period=-1,\n)\ndf = pd.DataFrame(results)\nprint(df.groupby("homophily")["AgentID"].count().to_markdown())`,
      ],
      evidence: [
        'Crooks, A. T. et al. (2019). Agent-Based Modelling and Geographical Information Systems: A Practical Primer. SAGE Publications.',
        'Wilensky, U. & Rand, W. (2015). An Introduction to Agent-Based Modeling. MIT Press.',
      ],
      limitations:
        'ABMs are computationally expensive at large scales. Results are stochastic and require ' +
        'multiple runs. Validation against real-world data is often difficult.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.3'],
    },
    {
      id: 'sim-pedestrian-flow',
      title: 'Pedestrian Flow Simulation',
      sectionId: 'simulation',
      summary:
        'Simulate pedestrian movement in streets, plazas, transit stations, or evacuation scenarios ' +
        'using social force models or cellular automata. Identifies bottlenecks, level-of-service, ' +
        'and crowd density hotspots.',
      tags: ['agent_based', 'pedestrian', 'mobility', 'safety'],
      methodology:
        '1. Import walkable geometry (buildings, obstacles, exits).\n' +
        '2. Define origin-destination demand matrix.\n' +
        '3. Select model: social force (Helbing), velocity obstacles, or CA.\n' +
        '4. Parametrise: desired speed, personal space, reaction time.\n' +
        '5. Run simulation at sub-second time steps.\n' +
        '6. Compute density (ped/m²), speed, and flow per zone.\n' +
        '7. Classify level-of-service (Fruin A–F).',
      tools: ['SUMO (pedestrian module)', 'PedSim', 'MassMotion', 'Three.js'],
      datasets: [
        'Building floor plans and obstacle geometry (CAD / BIM)',
        'Pedestrian counting data (manual counts or video analytics)',
        'GTFS transit data for station pedestrian demand estimation',
        'Event venue capacity and exit layout plans',
      ],
      examples: [
        'Istanbul Grand Bazaar evacuation: social force simulation of 30 000 daily visitors identifying 3 critical bottlenecks',
        'London King\'s Cross station: pedestrian flow modelling for platform-widening scenario evaluation',
        'Mecca Hajj crowd simulation: density mapping for stampede prevention zone design',
      ],
      prompts: [
        `import numpy as np\nimport matplotlib.pyplot as plt\nfrom matplotlib.patches import Circle\n\n# Simplified Social Force Model (Helbing & Molnar 1995)\nclass Pedestrian:\n    def __init__(self, pos, target, desired_speed=1.34):\n        self.pos = np.array(pos, dtype=float)\n        self.vel = np.zeros(2)\n        self.target = np.array(target, dtype=float)\n        self.v0 = desired_speed\n        self.radius = 0.3  # m\n        self.tau = 0.5  # relaxation time\n\n    def desired_force(self):\n        direction = self.target - self.pos\n        dist = np.linalg.norm(direction)\n        if dist < 0.5: return np.zeros(2)\n        e = direction / dist\n        return (self.v0 * e - self.vel) / self.tau\n\n    def repulsive_force(self, other, A=2.1, B=0.3):\n        diff = self.pos - other.pos\n        dist = np.linalg.norm(diff)\n        if dist < 0.01: return np.zeros(2)\n        n = diff / dist\n        return A * np.exp((self.radius + other.radius - dist) / B) * n\n\n# Simulation\nnp.random.seed(42)\npeds = [Pedestrian(pos=[np.random.uniform(0, 10), 0], target=[5, 20]) for _ in range(50)]\ndt = 0.1\n\nfor step in range(500):\n    for p in peds:\n        force = p.desired_force()\n        for q in peds:\n            if q is not p:\n                force += p.repulsive_force(q)\n        p.vel += force * dt\n        p.pos += p.vel * dt\n\n# Density heatmap\npositions = np.array([p.pos for p in peds])\nplt.hexbin(positions[:, 0], positions[:, 1], gridsize=15, cmap="YlOrRd")\nplt.colorbar(label="Pedestrian density")\nplt.title("Pedestrian Flow — Social Force Model")\nplt.savefig("ped_flow.png", dpi=150)`,
        `# Level-of-Service (Fruin) classification\nimport numpy as np\n\ndef fruin_los(density_ped_per_m2):\n    """Classify Fruin Level of Service from pedestrian density."""\n    if density_ped_per_m2 <= 0.31: return "A (free flow)"\n    if density_ped_per_m2 <= 0.43: return "B (minor conflicts)"\n    if density_ped_per_m2 <= 0.72: return "C (restricted)"\n    if density_ped_per_m2 <= 1.08: return "D (severely restricted)"\n    if density_ped_per_m2 <= 2.17: return "E (shuffling)"\n    return "F (body contact, dangerous)"\n\n# Example: classify grid cells\nfor cell_id, density in {"gate_A": 0.5, "corridor_B": 1.2, "platform_C": 2.5}.items():\n    print(f"{cell_id}: {density:.2f} ped/m² → LoS {fruin_los(density)}")`,
      ],
      evidence: [
        'Helbing, D. & Molnár, P. (1995). Social force model for pedestrian dynamics. Physical Review E, 51(5), 4282.',
        'Fruin, J. J. (1971). Pedestrian Planning and Design. Metropolitan Association of Urban Designers.',
      ],
      limitations:
        'Social force model may produce unrealistic oscillations in narrow corridors. ' +
        'Calibration requires empirical pedestrian trajectory data.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
    },
    {
      id: 'sim-traffic-micro',
      title: 'Traffic Microsimulation',
      sectionId: 'simulation',
      summary:
        'Model individual vehicle movement on road networks using car-following and lane-changing ' +
        'models. Supports signalised intersections, transit priority, and multi-modal interactions. ' +
        'Outputs include travel time, queue length, emissions, and level-of-service.',
      tags: ['traffic', 'mobility', 'scenario', 'air_quality'],
      methodology:
        '1. Build network from OSM or traffic engineering plans.\n' +
        '2. Define traffic demand (OD matrix, traffic counts).\n' +
        '3. Configure signal plans and priority rules.\n' +
        '4. Select car-following model (Krauss, IDM, Wiedemann).\n' +
        '5. Run warm-up period then collect statistics.\n' +
        '6. Validate against loop-detector or GPS probe data.\n' +
        '7. Test scenarios: new signal timing, road diet, BRT lane.',
      tools: ['SUMO', 'Aimsun', 'VISSIM', 'MATSim'],
      datasets: [
        'OpenStreetMap road network with lane counts and speed limits',
        'Municipal traffic count data (loop detectors, pneumatic tubes)',
        'GPS probe data (e.g. Uber Movement, TomTom Traffic Stats)',
        'Signal timing plans from traffic management centre',
        'GTFS transit schedules for multimodal integration',
      ],
      examples: [
        'Munich ring road congestion study: SUMO simulation of 180 000 vehicles for BRT feasibility on Mittlerer Ring',
        'Bogotá TransMilenio extension: microsimulation of bus-priority intersections along Carrera Séptima',
        'Amsterdam cycling + car interaction: SUMO multimodal simulation for protected intersection design',
      ],
      prompts: [
        `import subprocess\nimport xml.etree.ElementTree as ET\nimport os\n\n# 1. Generate SUMO network from OSM\nsubprocess.run([\n    "netconvert",\n    "--osm-files", "map.osm",\n    "--output-file", "network.net.xml",\n    "--geometry.remove",\n    "--ramps.guess",\n    "--junctions.join",\n    "--tls.guess-signals",\n    "--tls.default-type", "actuated",\n], check=True)\n\n# 2. Generate random traffic demand\nsubprocess.run([\n    "python", os.path.join(os.environ["SUMO_HOME"], "tools", "randomTrips.py"),\n    "-n", "network.net.xml",\n    "-o", "trips.xml",\n    "-r", "routes.xml",\n    "--begin", "0",\n    "--end", "3600",\n    "--period", "1.5",\n    "--validate",\n], check=True)\n\n# 3. Run SUMO simulation\nsubprocess.run([\n    "sumo",\n    "-n", "network.net.xml",\n    "-r", "routes.xml",\n    "--tripinfo-output", "tripinfo.xml",\n    "--statistic-output", "stats.xml",\n    "--duration-log.statistics",\n    "--end", "3600",\n], check=True)\n\n# 4. Parse results\ntree = ET.parse("stats.xml")\nroot = tree.getroot()\nfor stat in root.iter("vehicleTripStatistics"):\n    print(f"Avg travel time: {float(stat.get('duration', 0)):.0f} s")\n    print(f"Avg waiting time: {float(stat.get('waitingTime', 0)):.0f} s")\n    print(f"Avg speed: {float(stat.get('speed', 0)) * 3.6:.1f} km/h")`,
        `# Compare scenarios: before vs. after BRT lane\nimport pandas as pd\nimport xml.etree.ElementTree as ET\n\ndef parse_tripinfo(path):\n    tree = ET.parse(path)\n    trips = []\n    for trip in tree.iter("tripinfo"):\n        trips.append({\n            "id": trip.get("id"),\n            "duration": float(trip.get("duration")),\n            "waitSteps": int(trip.get("waitingCount", 0)),\n            "timeLoss": float(trip.get("timeLoss", 0)),\n        })\n    return pd.DataFrame(trips)\n\nbase = parse_tripinfo("tripinfo_baseline.xml")\nbrt = parse_tripinfo("tripinfo_brt.xml")\nprint("=== Baseline ===")\nprint(base[["duration", "timeLoss"]].describe().round(1))\nprint("\\n=== With BRT Lane ===")\nprint(brt[["duration", "timeLoss"]].describe().round(1))`,
      ],
      evidence: [
        'Lopez, P. A. et al. (2018). Microscopic Traffic Simulation using SUMO. IEEE ITSC Conference Proceedings.',
        'Horni, A. et al. (Eds.) (2016). The Multi-Agent Transport Simulation MATSim. Ubiquity Press.',
      ],
      limitations:
        'Microsimulation requires detailed input data (signal plans, turning counts). ' +
        'Large networks (>10 k links) need significant computation time.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.6'],
    },
    {
      id: 'sim-urban-growth-ca',
      title: 'Urban Growth / CA Model',
      sectionId: 'simulation',
      summary:
        'Simulate land-use change and urban expansion using cellular automata (CA) coupled with ' +
        'logistic regression or machine-learning transition rules. Calibrate against historical ' +
        'land-cover maps to project future scenarios under different policy assumptions.',
      tags: ['cellular_automata', 'land_use', 'sprawl', 'scenario', 'remote_sensing'],
      methodology:
        '1. Prepare multi-temporal land-cover maps (t₁, t₂).\n' +
        '2. Derive driving factors: distance to roads, slope, population density, zoning.\n' +
        '3. Fit transition probability model (logistic regression, random forest, or ANN).\n' +
        '4. Define CA neighbourhood rule (Moore 3×3 or 5×5).\n' +
        '5. Calibrate using t₁→t₂ observed change.\n' +
        '6. Validate with holdout period.\n' +
        '7. Project to target year under BAU, compact, or sprawl scenarios.',
      tools: ['SLEUTH', 'FLUS', 'TerrSet', 'Python (scikit-learn + rasterio)'],
      datasets: [
        'Landsat / Sentinel-2 multi-temporal land-cover maps',
        'GHSL built-up area grids (1975–2030 epochs)',
        'OpenStreetMap road network for distance-to-road factor',
        'WorldPop / GPWv4 population density grids',
        'Local zoning / land-use master plan (constraint layer)',
      ],
      examples: [
        'Lagos urban expansion 2000–2030: FLUS model projecting 45% built-up increase under BAU scenario',
        'Chengdu compact-city policy evaluation: CA model comparing radial vs. polycentric growth scenarios',
        'Cairo desert encroachment: SLEUTH calibration on 1984–2020 Landsat to project 2040 urban boundary',
      ],
      prompts: [
        `import rasterio\nimport numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\n\n# 1. Load multi-temporal land cover\nwith rasterio.open("landcover_2010.tif") as src:\n    lc_t1 = src.read(1)\n    profile = src.profile\nwith rasterio.open("landcover_2020.tif") as src:\n    lc_t2 = src.read(1)\n\n# 2. Identify changed pixels (rural → urban)\nchange = ((lc_t1 != 1) & (lc_t2 == 1)).astype(np.int8)  # 1 = urban\nprint(f"Changed pixels: {change.sum():,} ({change.mean()*100:.2f}%)")\n\n# 3. Load driving factors\nfactors = {}\nfor name in ["dist_roads", "dist_center", "slope", "pop_density"]:\n    with rasterio.open(f"{name}.tif") as src:\n        factors[name] = src.read(1).flatten()\n\n# 4. Fit transition probability model\nX = np.column_stack([factors[k] for k in sorted(factors)])\ny = change.flatten()\nmask = ~np.isnan(X).any(axis=1)\nX_train, X_test, y_train, y_test = train_test_split(X[mask], y[mask], test_size=0.3, random_state=42)\n\nrf = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")\nrf.fit(X_train, y_train)\nprint(f"AUC: {roc_auc_score(y_test, rf.predict_proba(X_test)[:, 1]):.3f}")`,
        `# CA urban growth projection (simplified)\nimport numpy as np\nfrom scipy.ndimage import uniform_filter\n\ndef ca_step(urban_grid, prob_grid, threshold=0.5, neighborhood_size=3):\n    """One step of cellular automata urban growth."""\n    # Neighbourhood density (fraction of urban cells nearby)\n    nb_density = uniform_filter(urban_grid.astype(float), size=neighborhood_size)\n    # Combined probability: transition model * neighbourhood effect\n    combined = prob_grid * nb_density\n    # Stochastic element\n    random_factor = np.random.uniform(0.8, 1.2, size=urban_grid.shape)\n    new_urban = (combined * random_factor > threshold) & (urban_grid == 0)\n    return urban_grid | new_urban\n\n# Project 10 years\nprojected = lc_t2.copy()\nfor year in range(10):\n    projected = ca_step(projected, prob_grid, threshold=0.4)\nprint(f"Urban cells 2030: {projected.sum():,} (+{(projected.sum() - lc_t2.sum()):,})")`,
      ],
      evidence: [
        'Liu, X. et al. (2017). A future land use simulation model (FLUS) for simulating multiple land use scenarios. Landscape and Urban Planning, 168, 94–116.',
        'Clarke, K. C. et al. (1997). A self-modifying cellular automaton model of historical urbanization in the San Francisco Bay area. Environment and Planning B, 24, 247–261.',
      ],
      limitations:
        'CA models assume neighbourhood-driven change; they cannot represent policy decisions ' +
        'or market forces directly. Spatial resolution affects results significantly.',
      sdgAlignment: ['SDG 11.3', 'SDG 15.3'],
    },
    {
      id: 'sim-noise-propagation',
      title: 'Environmental Noise Modelling',
      sectionId: 'simulation',
      summary:
        'Compute noise propagation from traffic, rail, industry, or construction sources through ' +
        'the urban environment. Accounts for building reflections, ground absorption, and atmospheric ' +
        'attenuation. Outputs Lden and Lnight noise maps per EU END directive.',
      tags: ['noise', 'health', 'climate', '3d_modeling'],
      methodology:
        '1. Define noise sources (road segments, point sources) with emission levels.\n' +
        '2. Import 3D building geometry and terrain.\n' +
        '3. Select propagation model (CNOSSOS-EU, ISO 9613-2).\n' +
        '4. Compute direct, reflected, and diffracted paths.\n' +
        '5. Aggregate to receiver grid at 4 m height.\n' +
        '6. Classify exposure bands (55–60, 60–65, … dB).\n' +
        '7. Estimate affected population per band.',
      tools: ['NoiseModelling (CNRS)', 'CadnaA', 'SoundPLAN', 'PostGIS + H2GIS'],
      datasets: [
        'Road traffic volume data (AADT or hourly counts per segment)',
        'CityGML / CityJSON building models for sound reflection geometry',
        'EU Noise Directive strategic noise maps (existing baseline)',
        'Railway and industrial source inventories with emission spectra',
        'DEM for ground elevation and barrier modelling',
      ],
      examples: [
        'Paris Grand Paris Express: noise impact modelling for 68 new metro stations and surface infrastructure',
        'Barcelona superblock programme: before/after noise level comparison for traffic-calmed grid blocks',
        'Vienna noise action plan: identifying 85 000 residents exposed to Lden > 65 dB from ring road',
      ],
      prompts: [
        `# NoiseModelling (open-source) pipeline using H2GIS\nimport subprocess\nimport geopandas as gpd\n\n# 1. Prepare input layers\nbuildings = gpd.read_file("buildings.gpkg")\nroads = gpd.read_file("roads_with_traffic.gpkg")  # Must include AADT, speed, % heavy vehicles\n\n# Required road columns for CNOSSOS-EU:\n# LV_SPD_D (light vehicle speed day), HV_SPD_D, LV_D (light vehicle count day), HV_D\nprint("Road columns:", roads.columns.tolist())\nassert all(c in roads.columns for c in ["LV_D", "HV_D", "LV_SPD_D"])\n\n# 2. Export to H2GIS-compatible format\nbuildings[["geometry", "height"]].to_file("nm_buildings.shp")\nroads.to_file("nm_roads.shp")\n\n# 3. Run NoiseModelling via Groovy script\n# (Requires NoiseModelling installation)\nprint("Run: noisemodelling.sh -f road_noise.groovy")\nprint("Output: LDEN_GEOM.shp, LNIGHT_GEOM.shp (receiver grid with dB values)")`,
        `# Analyse noise exposure by population\nimport geopandas as gpd\nimport pandas as pd\n\n# Load noise contours and population grid\nnoise = gpd.read_file("LDEN_GEOM.shp")\npop = gpd.read_file("population_grid_100m.gpkg")\n\n# Spatial join\njoined = gpd.sjoin(pop, noise, how="inner", predicate="intersects")\n\n# Classify exposure bands (EU END directive thresholds)\nbands = [(55, 60), (60, 65), (65, 70), (70, 75), (75, float("inf"))]\nfor lo, hi in bands:\n    mask = (joined["LDEN"] >= lo) & (joined["LDEN"] < hi)\n    exposed = joined.loc[mask, "population"].sum()\n    print(f"Lden {lo}–{hi} dB: {exposed:,.0f} people exposed")`,
      ],
      evidence: [
        'European Commission (2015). Common Noise Assessment Methods in Europe (CNOSSOS-EU). JRC Reference Report EUR 25379 EN.',
        'Kephalopoulos, S. et al. (2012). Common Noise Assessment Methods in Europe (CNOSSOS-EU). EUR 25379 EN, Publications Office of the EU.',
      ],
      limitations:
        'Simplified models ignore atmospheric refraction and wind effects. Building geometry ' +
        'must be accurate for reflection calculations. Missing source data is the main error source.',
      sdgAlignment: ['SDG 3.9', 'SDG 11.6'],
    },
    {
      id: 'sim-evacuation',
      title: 'Evacuation & Emergency Simulation',
      sectionId: 'simulation',
      summary:
        'Model emergency evacuation for earthquakes, floods, or fires. Simulates population ' +
        'movement from origin zones to safe areas via the street / transit network, accounting ' +
        'for capacity constraints, bottlenecks, and time-dependent hazard zones.',
      tags: ['agent_based', 'safety', 'pedestrian', 'scenario'],
      methodology:
        '1. Define hazard footprint and timeline.\n' +
        '2. Distribute population across origin zones (residential, workplace).\n' +
        '3. Assign evacuation destinations (shelters, safe ground).\n' +
        '4. Route agents on network with capacity-constrained shortest paths.\n' +
        '5. Apply departure time distributions (immediate, phased, delayed).\n' +
        '6. Compute clearance time, queue lengths, and stranded population.\n' +
        '7. Compare scenarios: vertical vs. horizontal evacuation, new shelter sites.',
      tools: ['SUMO', 'MATSim', 'PTV Visum', 'GAMA Platform'],
      datasets: [
        'Census population grids (residential + workplace population by zone)',
        'OpenStreetMap road network with capacity / speed attributes',
        'Shelter / safe area locations with capacity limits',
        'Hazard maps (flood zones, seismic intensity, fire spread models)',
        'Hospital and emergency service locations',
      ],
      examples: [
        'Sendai tsunami evacuation: agent-based simulation reproducing 2011 evacuation patterns; identified 12 min clearance time improvement with new shelters',
        'Istanbul earthquake scenario: MATSim evacuation of 2 M Fatih residents to safe assembly areas via 4 bridge corridors',
        'Miami hurricane evacuation: SUMO-based contraflow simulation for I-95 northbound capacity evaluation',
      ],
      prompts: [
        `import networkx as nx\nimport geopandas as gpd\nimport numpy as np\nfrom heapq import heappush, heappop\n\n# 1. Build evacuation network\nroads = gpd.read_file("road_network.gpkg")\nG = nx.DiGraph()\nfor _, row in roads.iterrows():\n    length = row.geometry.length  # meters\n    capacity = row.get("lanes", 1) * 1800  # vehicles/hour/lane\n    G.add_edge(row["from_node"], row["to_node"], weight=length, capacity=capacity)\n\n# 2. Define population zones and shelters\npop_zones = gpd.read_file("population_zones.gpkg")\nshelters = gpd.read_file("shelters.gpkg")\n\nprint(f"Network: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")\nprint(f"Population zones: {len(pop_zones)}, total pop: {pop_zones['population'].sum():,}")\nprint(f"Shelters: {len(shelters)}, total capacity: {shelters['capacity'].sum():,}")\n\n# 3. Compute shortest paths to nearest shelter\nfor _, zone in pop_zones.iterrows():\n    origin = zone["nearest_node"]\n    min_dist = float("inf")\n    best_shelter = None\n    for _, shelter in shelters.iterrows():\n        try:\n            dist = nx.shortest_path_length(G, origin, shelter["node_id"], weight="weight")\n            if dist < min_dist:\n                min_dist = dist\n                best_shelter = shelter["name"]\n        except nx.NetworkXNoPath:\n            continue\n    print(f"  Zone {zone['zone_id']}: {zone['population']:,} people → {best_shelter} ({min_dist:.0f} m)")`,
        `# Clearance time estimation\nimport numpy as np\n\ndef estimate_clearance(population, road_capacity_veh_h, avg_occupancy=2.5, departure_curve="sigmoid"):\n    """Estimate evacuation clearance time in minutes."""\n    vehicles = population / avg_occupancy\n    if departure_curve == "sigmoid":\n        # 80% depart within first 60% of time window\n        effective_rate = road_capacity_veh_h * 0.7  # account for congestion\n    else:\n        effective_rate = road_capacity_veh_h * 0.5\n    hours = vehicles / effective_rate\n    return hours * 60  # minutes\n\n# Example zones\nfor zone, pop, cap in [("Zone A", 15000, 3600), ("Zone B", 8000, 1800), ("Zone C", 25000, 5400)]:\n    ct = estimate_clearance(pop, cap)\n    print(f"{zone}: {pop:,} people, clearance time = {ct:.0f} min")`,
      ],
      evidence: [
        'Mas, E. et al. (2012). Agent-based simulation of the 2011 Great East Japan earthquake/tsunami evacuation. Natural Hazards and Earth System Sciences, 12(10), 3409–3421.',
        'Chen, X. & Zhan, F. B. (2008). Agent-based modelling and simulation of urban evacuation. Computers, Environment and Urban Systems, 32(1), 25–38.',
      ],
      limitations:
        'Behavioural assumptions (compliance, departure time) strongly affect results. ' +
        'Real evacuations involve panic, misinformation, and non-compliance that are difficult to model.',
      sdgAlignment: ['SDG 11.5', 'SDG 13.1'],
    },
  ];
}
