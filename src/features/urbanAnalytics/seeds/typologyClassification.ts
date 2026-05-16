import type { Card } from '../lib/types';

/**
 * Urban Form Classification & Typology seed cards.
 * Covers morphological typology, housing typology, street classification, and
 * cluster-based urban form profiling methods.
 */
export function buildTypologyCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'typo-urban-morphology-classification',
      title: 'Urban Morphological Typology',
      sectionId: 'typology',
      summary:
        'Classify urban form into morphological types based on building footprint geometry, ' +
        'block structure, street network pattern, and density metrics. Produces a citywide ' +
        'tessellation where each unit is assigned a morphotype label.',
      tags: ['morphology', 'land_use', 'density', 'indicators'],
      methodology:
        '1. Delineate morphological tessellation cells (Voronoi from building centroids or block polygons).\n' +
        '2. Compute per-cell metrics: GSI, FSI, OSR, building height, coverage ratio, orientation.\n' +
        '3. Standardise indicators (z-score or min-max).\n' +
        '4. Apply PCA for dimensionality reduction.\n' +
        '5. Cluster with k-means or hierarchical linkage; select k via silhouette.\n' +
        '6. Label clusters by expert review (e.g., historic core, tower blocks, suburban villas).\n' +
        '7. Map result as choropleth with class legend.',
      tools: ['momepy', 'scikit-learn', 'geopandas', 'PySAL'],
      datasets: [
        'OpenStreetMap building footprints (Overpass API or Geofabrik extracts)',
        'Municipal cadastre with building height and floor count',
        'Copernicus Urban Atlas 2018 — land-use polygons at 1:10 000',
        'Global Human Settlement Layer (GHSL) built-up grids',
      ],
      examples: [
        'Prague morphological tessellation: 120 000 cells classified into 9 morphotypes (Fleischmann et al. 2022)',
        'Barcelona superblock assessment: GSI/FSI profiling for Eixample vs. Gràcia districts',
        'Istanbul historic peninsula: pre/post earthquake retrofit typology mapping',
      ],
      prompts: [
        `import geopandas as gpd\nimport momepy\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\n\n# 1. Load building footprints\nbuildings = gpd.read_file("buildings.gpkg")\n\n# 2. Generate morphological tessellation\ntessellation = momepy.Tessellation(buildings, unique_id="uID", limit=gpd.GeoDataFrame(geometry=[buildings.unary_union.convex_hull])).tessellation\n\n# 3. Compute morphometric indicators\ntessellation["area"] = momepy.Area(tessellation).series\ntessellation["eri"] = momepy.EquivalentRectangularIndex(tessellation).series\nbuildings["gsi"] = momepy.AreaRatio(tessellation, buildings, "area", "area", "uID").series\nbuildings["car"] = momepy.CourtyardArea(buildings).series\n\n# 4. Standardise and cluster\nfeatures = buildings[["gsi", "car"]].dropna()\nX = StandardScaler().fit_transform(features)\nscores = {k: silhouette_score(X, KMeans(k, n_init=10, random_state=42).fit_predict(X)) for k in range(3, 10)}\nbest_k = max(scores, key=scores.get)\nbuildings["morphotype"] = KMeans(best_k, n_init=10, random_state=42).fit_predict(X)\n\n# 5. Visualise\nbuildings.plot(column="morphotype", categorical=True, legend=True, figsize=(12, 10))`,
        `# Quick morphotype summary statistics\nimport pandas as pd\n\nsummary = buildings.groupby("morphotype").agg(\n    count=("uID", "count"),\n    mean_gsi=("gsi", "mean"),\n    mean_fsi=("fsi", "mean"),\n    mean_height=("height", "mean"),\n).round(3)\nprint(summary.to_markdown())`,
      ],
      evidence: [
        'Fleischmann, M. et al. (2022). Methodological foundation of a numerical taxonomy of urban form. Environment and Planning B, 49(4), 1283–1299.',
        'Dibble, J. et al. (2019). On the origin of spaces: Morphometric foundations of urban form evolution. Environment and Planning B, 46(4), 707–730.',
        'Bobkova, E. et al. (2021). Towards a morphogenetic classification of urban tissues. Urban Morphology, 25(1), 5–24.',
      ],
      limitations:
        'Typology labels depend on the chosen metrics and clustering method. Results are context-specific ' +
        'and may not transfer between cities without recalibration.',
      sdgAlignment: ['SDG 11.3'],
    },
    {
      id: 'typo-housing-typology',
      title: 'Housing Typology Analysis',
      sectionId: 'typology',
      summary:
        'Classify residential buildings into housing types (detached, semi-detached, row house, ' +
        'apartment block, informal, etc.) using footprint geometry, floor count, and cadastral attributes.',
      tags: ['housing', 'morphology', 'land_use', 'density'],
      methodology:
        '1. Extract building footprints with height / floor-count attributes.\n' +
        '2. Compute shape descriptors: elongation, rectangularity, area, compactness.\n' +
        '3. Join cadastral use-class if available.\n' +
        '4. Train a classifier (Random Forest or rule-based) on labelled samples.\n' +
        '5. Apply to unlabelled buildings across study area.\n' +
        '6. Validate with stratified sample or field verification.\n' +
        '7. Map as point or polygon layer with housing-type symbology.',
      tools: ['scikit-learn', 'geopandas', 'momepy', 'shapely'],
      datasets: [
        'OpenStreetMap building footprints with floor-count tags',
        'Municipal cadastre — building use-class, construction year, floor count',
        'European Urban Atlas residential land-use polygons',
        'Local housing authority register (dwelling type, tenure)',
      ],
      examples: [
        'Amsterdam housing stock classification: 847 000 dwellings mapped to 7 types for energy retrofit prioritisation',
        'Nairobi informal settlement detection: footprint geometry + Sentinel-2 imagery for slum mapping',
        'Berlin Mietenkataster: housing typology linked with rent-level analysis per Stadtteil',
      ],
      prompts: [
        `import geopandas as gpd\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split, classification_report\nimport momepy\n\n# 1. Load buildings with labels\nbuildings = gpd.read_file("buildings_labelled.gpkg")\n\n# 2. Compute shape descriptors\nbuildings["elongation"] = momepy.Elongation(buildings).series\nbuildings["rectangularity"] = momepy.Rectangularity(buildings).series\nbuildings["compactness"] = momepy.CircularCompactness(buildings).series\nbuildings["area"] = buildings.geometry.area\n\n# 3. Train classifier\nfeature_cols = ["elongation", "rectangularity", "compactness", "area"]\nX = buildings[feature_cols].dropna()\ny = buildings.loc[X.index, "housing_type"]\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)\n\nrf = RandomForestClassifier(n_estimators=200, random_state=42)\nrf.fit(X_train, y_train)\nprint(classification_report(y_test, rf.predict(X_test)))\n\n# 4. Predict unlabelled buildings\nunlabelled = buildings[buildings["housing_type"].isna()]\nunlabelled["housing_type"] = rf.predict(unlabelled[feature_cols])\nbuildings.update(unlabelled)\nbuildings.to_file("buildings_classified.gpkg", driver="GPKG")`,
        `# Feature importance analysis\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\nimportances = pd.Series(rf.feature_importances_, index=feature_cols).sort_values()\nimportances.plot.barh(color="#3794ff")\nplt.title("Housing Type Classification — Feature Importance")\nplt.tight_layout()\nplt.savefig("feature_importance.png", dpi=150)`,
      ],
      evidence: [
        'Wurm, M. et al. (2019). Semantic segmentation of slums in satellite images using transfer learning on fully convolutional neural networks. ISPRS J. Photogrammetry, 150, 59–69.',
        'Hecht, R. et al. (2015). Automatic identification of building types based on topographic databases. International Journal of Geographical Information Science, 29(7), 1218–1237.',
      ],
      limitations:
        'Relies on quality footprint and attribute data. Informal housing types are harder to ' +
        'classify from geometry alone without imagery support.',
      sdgAlignment: ['SDG 11.1', 'SDG 11.3'],
    },
    {
      id: 'typo-street-typology',
      title: 'Street Typology & Cross-Section',
      sectionId: 'typology',
      summary:
        'Classify streets by function, width, enclosure ratio, and modal allocation (vehicle lanes, ' +
        'cycle tracks, footways, planting strips). Produces a street-type inventory for urban design ' +
        'and complete-streets planning.',
      tags: ['morphology', 'mobility', 'pedestrian', 'cycling', 'land_use'],
      methodology:
        '1. Extract street centrelines with width estimates (OSM or cadastre).\n' +
        '2. Compute enclosure ratio (building height ÷ street width) per segment.\n' +
        '3. Classify by hierarchy: arterial, collector, local, pedestrian, service.\n' +
        '4. Attach modal-split attributes where available (bike lane presence, sidewalk width).\n' +
        '5. Generate cross-section diagrams for representative types.\n' +
        '6. Map segments by type with proportional-width symbology.',
      tools: ['OSMnx', 'momepy', 'geopandas', 'matplotlib'],
      datasets: [
        'OpenStreetMap street network (highway tags, width, lanes, surface)',
        'Municipal street register with cross-section surveys',
        'Google Street View imagery (manual or ML-based width estimation)',
        'Cycling infrastructure GIS layers (national/municipal)',
      ],
      examples: [
        'Copenhagen complete-streets audit: 2 400 segments classified by modal allocation for cycling masterplan',
        'Medellín street typology: enclosure ratio mapping to identify pedestrian-hostile corridors',
        'Tokyo narrow-street inventory: identifying evacuation bottlenecks in residential areas',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport momepy\nimport numpy as np\n\n# 1. Download street network\nG = ox.graph_from_place("Copenhagen, Denmark", network_type="all")\nedges = ox.graph_to_gdfs(G, nodes=False)\n\n# 2. Extract and estimate widths\nedges["width_est"] = edges["width"].apply(\n    lambda w: float(str(w).split(";")[0]) if pd.notna(w) else np.nan\n)\nedges["lanes_n"] = edges["lanes"].apply(\n    lambda l: int(str(l).split(";")[0]) if pd.notna(l) else 1\n)\nedges["width_est"] = edges["width_est"].fillna(edges["lanes_n"] * 3.5)\n\n# 3. Join building heights for enclosure ratio\nbuildings = ox.features_from_place("Copenhagen, Denmark", tags={"building": True})\nbuildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])]\nbuildings["height"] = pd.to_numeric(buildings.get("height", 0), errors="coerce").fillna(10)\n\n# 4. Classify by hierarchy\ndef classify_street(row):\n    hw = str(row.get("highway", ""))\n    if hw in ("motorway", "trunk"): return "arterial"\n    if hw in ("primary", "secondary"): return "collector"\n    if hw in ("tertiary", "residential", "living_street"): return "local"\n    if hw in ("pedestrian", "footway", "path"): return "pedestrian"\n    return "service"\n\nedges["street_type"] = edges.apply(classify_street, axis=1)\nedges.to_file("street_typology.gpkg", driver="GPKG")`,
        `# Visualise street typology map\nimport matplotlib.pyplot as plt\n\nfig, ax = plt.subplots(figsize=(14, 14))\ncolors = {"arterial": "#E53E3E", "collector": "#ED8936", "local": "#48BB78", "pedestrian": "#4299E1", "service": "#A0AEC0"}\nfor stype, color in colors.items():\n    subset = edges[edges["street_type"] == stype]\n    subset.plot(ax=ax, color=color, linewidth=0.8 if stype != "arterial" else 1.5, label=stype)\nax.legend(loc="upper right")\nax.set_title("Street Typology — Copenhagen")\nplt.tight_layout()\nplt.savefig("street_typology_map.png", dpi=150)`,
      ],
      evidence: [
        'Marshall, S. (2005). Streets & Patterns. Spon Press.',
        'Ewing, R. & Cervero, R. (2010). Travel and the built environment. Journal of the American Planning Association, 76(3), 265–294.',
      ],
      limitations:
        'OSM street width is often missing; estimations from building setbacks introduce uncertainty.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7', 'SDG 3.6'],
    },
    {
      id: 'typo-block-pattern',
      title: 'Block Pattern Classification',
      sectionId: 'typology',
      summary:
        'Identify and classify urban block patterns (grid, organic, cul-de-sac, superblock) from ' +
        'street network topology and block polygon metrics. Supports urban design diagnostics and ' +
        'comparative morphology studies.',
      tags: ['morphology', 'land_use', 'density', 'network_analysis'],
      methodology:
        '1. Generate block polygons from street network (face polygons).\n' +
        '2. Compute block descriptors: area, perimeter, compactness, elongation, internal connectivity.\n' +
        '3. Analyse surrounding network: intersection density, dead-end ratio, circuity.\n' +
        '4. Cluster blocks by descriptor similarity.\n' +
        '5. Assign pattern labels reflecting planning tradition.\n' +
        '6. Map classified blocks with legend.',
      tools: ['momepy', 'OSMnx', 'geopandas', 'scikit-learn'],
      datasets: [
        'OpenStreetMap street network (for face polygon extraction)',
        'Municipal block boundary GIS layer',
        'GHSL built-up area grids for density context',
        'Historical cadastre overlays (georeferenced maps)',
      ],
      examples: [
        'Barcelona Eixample vs. Gothic Quarter: grid regularity and intersection density comparison',
        'Brasília pilot-plan analysis: superblock identification from internal connectivity metrics',
        'Addis Ababa informal neighbourhood detection: organic block-pattern clustering vs. planned areas',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport momepy\nfrom sklearn.cluster import AgglomerativeClustering\nfrom sklearn.preprocessing import StandardScaler\n\n# 1. Download street network and generate blocks\nG = ox.graph_from_place("Barcelona, Spain", network_type="drive")\nnodes, edges = ox.graph_to_gdfs(G)\n\n# Generate block (face) polygons from network\nfrom shapely.ops import polygonize\nblocks = gpd.GeoDataFrame(\n    geometry=list(polygonize(edges.geometry.unary_union)),\n    crs=edges.crs\n)\nblocks = blocks[blocks.geometry.area < 500000]  # Remove unbounded outer polygon\nblocks["block_id"] = range(len(blocks))\n\n# 2. Compute block descriptors\nblocks["area"] = blocks.geometry.area\nblocks["perimeter"] = blocks.geometry.length\nblocks["compactness"] = momepy.CircularCompactness(blocks).series\nblocks["elongation"] = momepy.Elongation(blocks).series\nblocks["corners"] = blocks.geometry.apply(lambda g: len(g.exterior.coords) - 1)\n\n# 3. Network context per block\nblocks["int_density"] = momepy.NodeDensity(blocks, nodes).series\n\n# 4. Cluster blocks\nfeats = ["compactness", "elongation", "area", "corners", "int_density"]\nX = StandardScaler().fit_transform(blocks[feats].fillna(0))\nblocks["pattern"] = AgglomerativeClustering(n_clusters=5).fit_predict(X)\nblocks.to_file("block_patterns.gpkg", driver="GPKG")`,
        `# Block pattern summary\nprint(blocks.groupby("pattern").agg(\n    n=("block_id", "count"),\n    avg_area=("area", "mean"),\n    avg_compact=("compactness", "mean"),\n    avg_elongation=("elongation", "mean"),\n).round(2).to_markdown())`,
      ],
      evidence: [
        'Boeing, G. (2019). Urban spatial order: street network orientation, configuration, and entropy. Applied Network Science, 4(1), 67.',
        'Louf, R. & Barthelemy, M. (2014). A typology of street patterns. Journal of the Royal Society Interface, 11(101), 20140924.',
      ],
      limitations:
        'Pattern labels are interpretive and context-dependent. Superblock identification ' +
        'requires internal street network data that may be incomplete in OSM.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
    },
    {
      id: 'typo-land-use-mix',
      title: 'Land-Use Mix & Diversity Index',
      sectionId: 'typology',
      summary:
        'Quantify functional diversity of urban areas using entropy-based or Herfindahl-style ' +
        'land-use mix indices. Higher mix scores indicate more diverse, walkable neighbourhoods.',
      tags: ['land_use', 'mixed_use', 'density', 'indicators'],
      methodology:
        '1. Obtain land-use or building-use classification for study area.\n' +
        '2. Define analysis zones (blocks, hexagonal grid, or census tracts).\n' +
        '3. Count area share of each use category per zone.\n' +
        '4. Compute Shannon entropy or MXI for each zone.\n' +
        '5. Normalise to 0–1 scale (evenness index).\n' +
        '6. Map as continuous surface or choropleth.',
      tools: ['geopandas', 'numpy', 'momepy'],
      datasets: [
        'Municipal land-use / zoning GIS layer',
        'OpenStreetMap building tags (amenity, shop, office, residential)',
        'Copernicus Urban Atlas — functional land-use at 1:10 000',
        'CORINE Land Cover for broader metropolitan context',
      ],
      examples: [
        'Portland land-use mix entropy mapping: quantifying sprawl vs. compact development (Song et al. 2013)',
        'Melbourne 20-minute neighbourhood audit: diversity index per 400 m walkable catchment',
        'Rotterdam mixed-use corridor identification for zoning reform',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\nimport pandas as pd\n\n# 1. Load land-use polygons\nlanduse = gpd.read_file("urban_atlas.gpkg")\n\n# 2. Define analysis zones (hex grid)\nfrom shapely.geometry import box\nfrom h3 import h3\n\n# Alternative: use a regular hex grid\nzones = gpd.read_file("hex_grid_500m.gpkg")\n\n# 3. Spatial join and compute Shannon entropy\ndef shannon_entropy(group):\n    """Compute normalised Shannon entropy for land-use mix."""\n    proportions = group["lu_class"].value_counts(normalize=True)\n    n_classes = len(proportions)\n    if n_classes <= 1:\n        return 0.0\n    entropy = -np.sum(proportions * np.log(proportions))\n    return entropy / np.log(n_classes)  # normalise to 0-1\n\njoined = gpd.sjoin(landuse, zones, how="inner", predicate="intersects")\nmix_index = joined.groupby("zone_id").apply(shannon_entropy).rename("land_use_mix")\n\n# 4. Map result\nzones = zones.merge(mix_index, left_on="zone_id", right_index=True)\nzones.plot(column="land_use_mix", cmap="RdYlGn", legend=True, figsize=(12, 10))\nimport matplotlib.pyplot as plt\nplt.title("Land-Use Mix Index (Shannon Entropy)")\nplt.savefig("landuse_mix.png", dpi=150)`,
        `# Compare land-use mix across districts\nsummary = zones.groupby("district").agg(\n    mean_mix=("land_use_mix", "mean"),\n    median_mix=("land_use_mix", "median"),\n    std_mix=("land_use_mix", "std"),\n    n_zones=("zone_id", "count"),\n).sort_values("mean_mix", ascending=False).round(3)\nprint(summary.to_markdown())`,
      ],
      evidence: [
        'Song, Y. et al. (2013). Measuring urban form: Is Portland winning the war on sprawl? Journal of the American Planning Association, 70(2), 210–225.',
        'Cervero, R. & Kockelman, K. (1997). Travel demand and the 3Ds: Density, diversity, and design. Transportation Research Part D, 2(3), 199–219.',
      ],
      limitations:
        'Results are sensitive to zone size (MAUP effect). Use-category granularity affects index values.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
    },
    {
      id: 'typo-period-built-env',
      title: 'Development Period Classification',
      sectionId: 'typology',
      summary:
        'Classify urban areas by construction period (pre-war, post-war, modernist, contemporary) ' +
        'using building age attributes, architectural pattern features, and morphological signatures.',
      tags: ['morphology', 'heritage', 'land_use', 'housing'],
      methodology:
        '1. Collect building age / construction year from cadastre or OSM.\n' +
        '2. Define period bands relevant to local planning history.\n' +
        '3. Aggregate buildings by zone; compute dominant period per zone.\n' +
        '4. Where age data is missing, infer from morphological proxies (plot size, building orientation, network pattern).\n' +
        '5. Cross-validate with historic map overlays.\n' +
        '6. Map as temporal choropleth with period legend.',
      tools: ['geopandas', 'momepy', 'QGIS temporal controller'],
      datasets: [
        'Municipal cadastre with construction year / building permit date',
        'OpenStreetMap start_date tag (partial coverage)',
        'Historical topographic maps (georeferenced) for cross-validation',
        'National heritage register with protected building records',
      ],
      examples: [
        'Vienna Gründerzeit mapping: identifying 1850–1914 building stock for seismic vulnerability assessment',
        'Detroit construction-era analysis: mapping waves of suburban expansion 1920–1970',
        'Tokyo morphological period inference: correlating plot size, setback, and FAR with planning regime eras',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# 1. Load buildings with construction year\nbuildings = gpd.read_file("cadastre_buildings.gpkg")\nbuildings["year"] = pd.to_numeric(buildings["construction_year"], errors="coerce")\n\n# 2. Define period bands\ndef classify_period(year):\n    if pd.isna(year): return "unknown"\n    if year < 1920: return "pre-war"\n    if year < 1945: return "inter-war"\n    if year < 1970: return "post-war modernist"\n    if year < 2000: return "late 20th century"\n    return "contemporary"\n\nbuildings["period"] = buildings["year"].apply(classify_period)\n\n# 3. Zone-level dominant period\nzones = gpd.read_file("census_tracts.gpkg")\njoined = gpd.sjoin(buildings, zones, how="inner", predicate="within")\ndominant = joined.groupby("zone_id")["period"].agg(lambda x: x.mode().iloc[0] if len(x) > 0 else "unknown")\nzones = zones.merge(dominant.rename("dominant_period"), left_on="zone_id", right_index=True)\n\n# 4. Map\nperiod_order = ["pre-war", "inter-war", "post-war modernist", "late 20th century", "contemporary", "unknown"]\ncolors = {"pre-war": "#8B4513", "inter-war": "#CD853F", "post-war modernist": "#A9A9A9",\n          "late 20th century": "#4682B4", "contemporary": "#2E8B57", "unknown": "#D3D3D3"}\nfig, ax = plt.subplots(figsize=(12, 10))\nfor period in period_order:\n    subset = zones[zones["dominant_period"] == period]\n    if not subset.empty:\n        subset.plot(ax=ax, color=colors[period], label=period, edgecolor="black", linewidth=0.3)\nax.legend(title="Dominant Construction Period")\nplt.title("Development Period Classification")\nplt.tight_layout()\nplt.savefig("period_classification.png", dpi=150)`,
        `# Temporal building count profile\nimport matplotlib.pyplot as plt\n\nknown = buildings[buildings["year"].notna()]\nfig, ax = plt.subplots(figsize=(10, 4))\nknown["year"].hist(bins=range(1800, 2030, 10), ax=ax, color="#3794ff", edgecolor="black")\nax.set_xlabel("Decade")\nax.set_ylabel("Building count")\nax.set_title("Building Construction Timeline")\nplt.tight_layout()\nplt.savefig("building_timeline.png", dpi=150)`,
      ],
      evidence: [
        'Conzen, M. R. G. (2004). Thinking about Urban Form. Peter Lang.',
        'Whitehand, J. W. R. (2001). British urban morphology: the Conzenian tradition. Urban Morphology, 5(2), 103–109.',
      ],
      limitations:
        'Building age data is incomplete in most cities. Inference from morphology adds uncertainty.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.4'],
    },
  ];
}
