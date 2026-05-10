/**
 * Urban Analytics Workbench — Urban Indicators & Metrics Seed Cards
 *
 * Covers morphology, accessibility, environment, socioeconomic, and SDG 11
 * indicators with scientific formulas, interpretation guidance, and references.
 */

import type { Card } from '../lib/types';

export function buildUrbanIndicatorCards(existing?: Set<string>): Card[] {
  const cards: Card[] = [
    // ===================================================================
    // MORPHOLOGY GROUP
    // ===================================================================
    {
      id: 'ui-far',
      title: 'Floor Area Ratio (FAR)',
      sectionId: 'urban_indicators',
      summary:
        'FAR = total gross floor area / lot area. A fundamental density metric for zoning and urban form analysis. ' +
        'Bands: < 0.5 low-density suburban, 0.5–1.5 medium-density residential, 1.5–3.0 urban mixed-use, > 3.0 high-rise CBD. ' +
        'FAR is one of the four Spacematrix indicators (Berghauser Pont & Haupt 2010).',
      tags: ['density', 'land_use', 'morphology', 'indicators'],
      methodology:
        '1. Obtain building footprints with floor counts (OSM building:levels or LiDAR-derived).\n' +
        '2. Compute gross floor area per building: footprint_area × floor_count.\n' +
        '3. Define lot/block boundaries (cadastral parcels or Thiessen polygons around buildings).\n' +
        '4. Aggregate floor area per lot: FAR = Σ(floor_area_i) / lot_area.\n' +
        '5. Classify into bands and map as choropleth.\n' +
        '6. Compare against zoning code maximum FAR for compliance analysis.',
      tools: ['geopandas', 'osmnx', 'momepy', 'shapely'],
      datasets: ['OSM buildings', 'cadastral parcels', 'LiDAR point clouds'],
      examples: [
        'Hong Kong Planning Department: city-wide FAR mapping revealing CBD values of 12–15 vs New Territories at 0.3–0.8, informing density transfer programme',
        'Barcelona Superblocks: FAR analysis of Eixample grid (FAR 3.2 average) guiding car-free zone placement without reducing housing yield',
        'Tokyo National Land Use Survey: FAR computation for 23 wards showing Chiyoda at 6.8 vs Setagaya at 0.9, supporting transit-oriented density bonuses',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\nfrom shapely.ops import unary_union\n\n# Floor Area Ratio (FAR) Computation\nplace = "Kadikoy, Istanbul, Turkey"\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n\n# Extract floor counts\ndef get_floors(row):\n    levels = row.get("building:levels")\n    if levels is not None:\n        try: return max(1, int(float(str(levels))))\n        except: pass\n    return 3  # default assumption\n\nbuildings["floors"] = buildings.apply(get_floors, axis=1)\nbuildings["footprint_area"] = buildings.geometry.area\nbuildings["gross_floor_area"] = buildings["footprint_area"] * buildings["floors"]\n\n# Compute study area using convex hull\nstudy_area = buildings.unary_union.convex_hull.area\ntotal_gfa = buildings["gross_floor_area"].sum()\nfar = total_gfa / study_area\n\nprint(f"=== Floor Area Ratio (FAR) ===")\nprint(f"Buildings: {len(buildings):,}")\nprint(f"Study area: {study_area/1e6:.2f} km²")\nprint(f"Total GFA: {total_gfa/1e6:.2f} km²")\nprint(f"FAR: {far:.2f}")\n\n# Classify\nif far < 0.5: band = "Low-density suburban"\nelif far < 1.5: band = "Medium-density residential"\nelif far < 3.0: band = "Urban mixed-use"\nelse: band = "High-rise CBD"\nprint(f"Classification: {band}")\n\n# Distribution\nprint(f"\\nFloor count distribution:")\nfor fl in sorted(buildings["floors"].unique()):\n    n = (buildings["floors"] == fl).sum()\n    print(f"  {fl} floors: {n} buildings ({n/len(buildings)*100:.1f}%)")`,
      ],
      evidence: [
        'Berghauser Pont, M. & Haupt, P. (2010). Spacematrix: Space, Density and Urban Form. NAi Publishers.',
        'Angel, S. et al. (2021). Atlas of Urban Expansion. Lincoln Institute of Land Policy.',
      ],
      limitations:
        'Requires accurate floor counts, which are frequently missing in OSM. LiDAR-derived estimates have ±1 floor uncertainty. ' +
        'FAR alone does not capture building arrangement or open-space quality.',
      sdgAlignment: ['SDG 11.3.1'],
    },
    {
      id: 'ui-gsi',
      title: 'Ground Space Index (GSI)',
      sectionId: 'urban_indicators',
      summary:
        'GSI = building footprint area / lot area, also called site coverage ratio or building coverage ratio (BCR). ' +
        'GSI quantifies how much of the ground is covered by buildings. Values range from < 0.1 (rural) to > 0.7 (dense historic centers). ' +
        'Together with FAR, GSI characterises the three-dimensional urban fabric.',
      tags: ['density', 'land_use', 'morphology', 'indicators'],
      methodology:
        '1. Obtain building footprint polygons (OSM or cadastral).\n' +
        '2. Compute footprint area: shapely .area in projected CRS.\n' +
        '3. Define lot boundaries (same as FAR computation).\n' +
        '4. GSI = Σ(footprint_area_i) / lot_area.\n' +
        '5. Map and classify: < 0.2 open, 0.2–0.4 suburban, 0.4–0.6 urban, > 0.6 compact core.\n' +
        '6. Cross-tabulate with FAR to produce Spacematrix scatter plots.',
      tools: ['geopandas', 'momepy', 'osmnx', 'matplotlib'],
      datasets: ['OSM buildings', 'cadastral parcels', 'municipal building registry'],
      examples: [
        'Amsterdam Spacematrix: GSI mapping of 3 000 neighbourhoods showing canal-belt GSI of 0.65 vs vinex-wijken at 0.20, informing densification targets',
        'Singapore URA: GSI + FAR cross-plot for 55 planning areas guiding land-use intensity zoning with GSI cap of 0.60 in conservation zones',
        'Vienna MA 18: annual GSI monitoring across 23 districts tracking 2.1% increase in coverage ratio over 10 years',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Ground Space Index (GSI) Computation\nplace = "Beyoglu, Istanbul, Turkey"\nbuildings = ox.features_from_place(place, tags={"building": True})\nbuildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n\nbuildings["footprint_area"] = buildings.geometry.area\n\n# Study area\nstudy_hull = buildings.unary_union.convex_hull\nstudy_area = study_hull.area\ntotal_footprint = buildings["footprint_area"].sum()\ngsi = total_footprint / study_area\n\nprint(f"=== Ground Space Index (GSI) ===")\nprint(f"Buildings: {len(buildings):,}")\nprint(f"Total footprint: {total_footprint:,.0f} m²")\nprint(f"Study area: {study_area:,.0f} m²")\nprint(f"GSI: {gsi:.3f}")\n\n# Classification\nif gsi < 0.2: label = "Open / rural"\nelif gsi < 0.4: label = "Suburban"\nelif gsi < 0.6: label = "Urban"\nelse: label = "Compact core"\nprint(f"Classification: {label}")\n\n# Building size distribution\nprint(f"\\nBuilding footprint stats:")\nprint(f"  Mean: {buildings['footprint_area'].mean():.0f} m²")\nprint(f"  Median: {buildings['footprint_area'].median():.0f} m²")\nprint(f"  Max: {buildings['footprint_area'].max():.0f} m²")`,
      ],
      evidence: [
        'Berghauser Pont, M. & Haupt, P. (2010). Spacematrix: Space, Density and Urban Form. NAi Publishers.',
      ],
      limitations:
        'Sensitive to footprint geometry accuracy. Overhangs and arcades are not captured. ' +
        'Lot boundary definition significantly affects results.',
      sdgAlignment: ['SDG 11.3', 'SDG 15.1'],
    },
    {
      id: 'ui-mixed-use-index',
      title: 'Mixed-Use Index (Shannon Entropy)',
      sectionId: 'urban_indicators',
      summary:
        'H = −Σ(pᵢ × ln(pᵢ)) / ln(n), normalised to [0, 1], where pᵢ is the proportion of land-use category i and n is the number of categories. ' +
        'A value of 0 indicates a single land use (monoculture); 1 indicates perfectly even distribution across all categories. ' +
        'Shannon entropy is the standard measure for urban land-use diversity.',
      tags: ['land_use', 'mixed_use', 'indicators', 'morphology'],
      methodology:
        '1. Classify land-use polygons into categories (residential, commercial, industrial, institutional, open space, transport).\n' +
        '2. Define spatial units for aggregation (blocks, hexagons, or grid cells).\n' +
        '3. Compute area proportions pᵢ for each category within each unit.\n' +
        '4. Apply Shannon formula: H = −Σ(pᵢ × ln(pᵢ)) / ln(n).\n' +
        '5. Map and interpret: < 0.3 mono-functional, 0.3–0.6 moderate mix, > 0.6 highly diverse.',
      tools: ['geopandas', 'numpy', 'scipy.stats (entropy)', 'mapclassify'],
      datasets: ['OSM land-use polygons', 'CORINE Land Cover (Europe)', 'National Land Cover Database (US)'],
      examples: [
        'Portland Metro: Shannon entropy for 1 200 blocks showing TOD corridors (H=0.72) vs single-family zones (H=0.15), driving zoning reform',
        'Seoul KRIHS: land-use mix analysis of 25 gu revealing Jongno (H=0.81) as most diverse, guiding 15-minute city policy',
        'Copenhagen Finger Plan: entropy-based evaluation showing new development corridors at H=0.55 vs target of H≥0.65',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Shannon Mixed-Use Index\nplace = "Besiktas, Istanbul, Turkey"\n\n# Land use categories\ncategories = {\n    "residential": {"building": ["apartments", "residential", "house"]},\n    "commercial": {"building": ["commercial", "retail"]},\n    "office": {"building": ["office"]},\n    "industrial": {"landuse": ["industrial"]},\n    "institutional": {"building": ["school", "university", "hospital", "public"]},\n    "green": {"leisure": ["park", "garden"], "landuse": ["grass", "forest"]},\n}\n\nareas = {}\nfor cat, tags in categories.items():\n    try:\n        features = ox.features_from_place(place, tags=tags)\n        features = features[features.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n        areas[cat] = features.geometry.area.sum()\n    except:\n        areas[cat] = 0\n\ntotal = sum(areas.values())\nif total > 0:\n    proportions = {k: v/total for k, v in areas.items() if v > 0}\n    n = len(proportions)\n    \n    # Shannon entropy\n    H_raw = -sum(p * np.log(p) for p in proportions.values())\n    H_norm = H_raw / np.log(n) if n > 1 else 0\n    \n    print(f"=== Mixed-Use Index (Shannon Entropy) ===")\n    print(f"Categories found: {n}")\n    for cat, prop in sorted(proportions.items(), key=lambda x: -x[1]):\n        print(f"  {cat}: {prop:.1%} ({areas[cat]:,.0f} m²)")\n    print(f"\\nShannon H (normalised): {H_norm:.3f}")\n    if H_norm < 0.3: label = "Mono-functional"\n    elif H_norm < 0.6: label = "Moderate mix"\n    else: label = "Highly diverse"\n    print(f"Classification: {label}")\nelse:\n    print("No land-use data found")`,
      ],
      evidence: [
        'Shannon, C. E. (1948). A mathematical theory of communication. Bell System Technical Journal, 27(3), 379-423.',
        'Song, Y. et al. (2013). Measuring Urban Land-Use Mix. JAPA, 79(2), 92-105.',
      ],
      limitations:
        'Result depends on classification granularity — finer categories yield lower entropy. ' +
        'Does not capture vertical mixing (ground-floor retail + upper residential). ' +
        'MAUP applies: scale of aggregation affects values.',
      sdgAlignment: ['SDG 11.3', 'SDG 11.a'],
    },
    {
      id: 'ui-street-connectivity',
      title: 'Street Connectivity Metrics',
      sectionId: 'urban_indicators',
      summary:
        'A suite of graph-theoretic metrics quantifying street network structure: Alpha index (circuit ratio), ' +
        'Beta index (edge/node ratio), Gamma index (observed/maximum edges), intersection density (per km²), ' +
        'connected node ratio (4-way intersections / total nodes), and average circuity (route distance / Euclidean distance).',
      tags: ['network_analysis', 'mobility', 'morphology', 'indicators'],
      methodology:
        '1. Download the street network with OSMnx: G = ox.graph_from_place(place, network_type="drive").\n' +
        '2. Compute basic stats: ox.basic_stats(G) → node count, edge count, total length.\n' +
        '3. Alpha = (e − n + 1) / (2n − 5), where e = edges, n = nodes.\n' +
        '4. Beta = e / n.\n' +
        '5. Gamma = e / (3 × (n − 2)).\n' +
        '6. Intersection density = count(nodes with degree ≥ 3) / study_area_km².\n' +
        '7. Connected node ratio = count(degree ≥ 4) / count(degree ≥ 3).\n' +
        '8. Circuity: ox.stats.circuity_avg(G).',
      tools: ['osmnx', 'networkx', 'momepy'],
      datasets: ['OSM street network', 'municipal road centreline files', 'HERE/TomTom road data'],
      examples: [
        'Boeing 2019: connectivity analysis of 100+ cities showing grid cities (Chicago α=0.41) vs organic cities (Cairo α=0.18), quantifying walkability implications',
        'Ewing & Cervero meta-analysis: intersection density (mean=82/km²) as strongest built-environment predictor of walking trips (elasticity=0.39)',
        'Bogotá ciclovía study: connected node ratio of 0.62 along cycle routes vs 0.38 in peripheral barrios guiding network investment',
      ],
      prompts: [
        `import osmnx as ox\nimport networkx as nx\nimport numpy as np\n\n# Street Connectivity Metrics\nplace = "Uskudar, Istanbul, Turkey"\nG = ox.graph_from_place(place, network_type="drive")\nG_proj = ox.project_graph(G)\n\nstats = ox.basic_stats(G_proj)\nn = stats["n"]  # nodes\ne = stats["m"]  # edges\n\n# Graph indices\nalpha = (e - n + 1) / (2 * n - 5) if (2 * n - 5) > 0 else 0\nbeta = e / n if n > 0 else 0\ngamma = e / (3 * (n - 2)) if (n - 2) > 0 else 0\n\nprint(f"=== Street Connectivity: {place} ===")\nprint(f"Nodes: {n:,}  Edges: {e:,}")\nprint(f"Alpha index (circuit ratio): {alpha:.3f}")\nprint(f"Beta index (e/n): {beta:.3f}")\nprint(f"Gamma index: {gamma:.3f}")\n\n# Intersection metrics\nnodes_gdf, edges_gdf = ox.graph_to_gdfs(G_proj)\ndegrees = dict(G_proj.degree())\nnodes_gdf["degree"] = nodes_gdf.index.map(degrees)\n\nintersections = nodes_gdf[nodes_gdf["degree"] >= 3]\nfour_way = nodes_gdf[nodes_gdf["degree"] >= 4]\n\n# Area in km²\narea_km2 = nodes_gdf.unary_union.convex_hull.area / 1e6\nint_density = len(intersections) / area_km2\ncnr = len(four_way) / len(intersections) if len(intersections) > 0 else 0\n\nprint(f"\\nIntersection density: {int_density:.0f} per km²")\nprint(f"Connected node ratio (4-way/3+way): {cnr:.3f}")\nprint(f"Average circuity: {stats.get('circuity_avg', 'N/A')}")\n\n# Degree distribution\nprint(f"\\nNode degree distribution:")\nfor d in sorted(set(degrees.values())):\n    count = sum(1 for v in degrees.values() if v == d)\n    print(f"  degree {d}: {count} ({count/n*100:.1f}%)")`,
      ],
      evidence: [
        'Boeing, G. (2017). OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks. CEUS, 65, 126-139.',
        'Ewing, R. & Cervero, R. (2010). Travel and the Built Environment. JAPA, 76(3), 265-294.',
      ],
      limitations:
        'Metrics assume planar graph — overpasses and tunnels introduce errors. ' +
        'OSM network completeness varies by region. Dual-carriageways can inflate edge counts.',
      sdgAlignment: ['SDG 11.2'],
    },

    // ===================================================================
    // ACCESSIBILITY GROUP
    // ===================================================================
    {
      id: 'ui-walk-score',
      title: 'Walk Score Calculator',
      sectionId: 'urban_indicators',
      summary:
        'Walk Score measures pedestrian accessibility by computing network-distance decay to nine amenity categories ' +
        '(grocery, restaurants, shopping, coffee, banks, parks, schools, books, entertainment). ' +
        'Score bands: 0–24 car-dependent, 25–49 car-dependent (some errands on foot), 50–69 somewhat walkable, ' +
        '70–89 very walkable, 90–100 walker\'s paradise.',
      tags: ['accessibility', 'pedestrian', 'indicators'],
      methodology:
        '1. Geocode the point of interest (POI) or define a grid of evaluation points.\n' +
        '2. For each point, find the nearest amenity in each of 9 categories using network distance.\n' +
        '3. Apply distance decay: weight = max(0, 1 − d / d_max), where d_max varies by category (e.g., 2400 m for grocery).\n' +
        '4. Sum category weights and normalise to 0–100.\n' +
        '5. Apply population-weighted averaging for area-level scores.\n' +
        '6. Map as graduated-colour point layer or interpolated surface.',
      tools: ['osmnx', 'pandana', 'geopandas', 'scikit-learn (BallTree)'],
      datasets: ['OSM POIs', 'Google Places API'],
      examples: [
        'Walk Score Inc: national scoring of 30M+ US addresses showing NYC average 89 vs Houston 36, enabling real-estate premium quantification ($3 000/point)',
        'Carr et al. 2010 validation: Walk Score correlated r=0.74 with GIS-measured amenity access in St Louis, confirming utility as a proxy measure',
        'Melbourne Plan Melbourne: open-source Walk Score recreation for 10 000 mesh blocks showing inner-city (92) vs outer suburbs (28), targeting 20-minute neighbourhood policy',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\nfrom shapely.geometry import Point\n\n# Walk Score Implementation\nplace = "Cihangir, Beyoglu, Istanbul, Turkey"\nG = ox.graph_from_place(place, network_type="walk")\nG_proj = ox.project_graph(G)\n\n# Define amenity categories and max distances\ncategories = {\n    "grocery": ({"shop": ["supermarket", "convenience", "greengrocer"]}, 2400),\n    "restaurant": ({"amenity": "restaurant"}, 2400),\n    "shopping": ({"shop": True}, 2400),\n    "cafe": ({"amenity": "cafe"}, 2400),\n    "bank": ({"amenity": "bank"}, 2400),\n    "park": ({"leisure": "park"}, 2400),\n    "school": ({"amenity": "school"}, 2400),\n    "pharmacy": ({"amenity": "pharmacy"}, 2400),\n    "transit": ({"public_transport": "stop_position"}, 1600),\n}\n\n# Evaluation point (center of area)\nnodes_gdf = ox.graph_to_gdfs(G_proj, edges=False)\ncenter = nodes_gdf.unary_union.centroid\ncenter_node = ox.nearest_nodes(G_proj, center.x, center.y)\n\nscores = {}\nfor cat, (tags, max_dist) in categories.items():\n    try:\n        pois = ox.features_from_place(place, tags=tags).to_crs(epsg=32636)\n        if len(pois) == 0:\n            scores[cat] = 0\n            continue\n        poi_centroids = pois.geometry.centroid\n        nearest_node_ids = [ox.nearest_nodes(G_proj, p.x, p.y) for p in poi_centroids[:20]]\n        import networkx as nx\n        dists = []\n        for nn in nearest_node_ids:\n            try:\n                d = nx.shortest_path_length(G_proj, center_node, nn, weight="length")\n                dists.append(d)\n            except nx.NetworkXNoPath:\n                pass\n        if dists:\n            min_d = min(dists)\n            weight = max(0, 1 - min_d / max_dist)\n            scores[cat] = weight\n        else:\n            scores[cat] = 0\n    except:\n        scores[cat] = 0\n\n# Composite score\nwalk_score = int(sum(scores.values()) / len(scores) * 100)\nprint(f"=== Walk Score: {place} ===")\nfor cat, s in sorted(scores.items(), key=lambda x: -x[1]):\n    print(f"  {cat}: {s:.2f}")\nprint(f"\\nWalk Score: {walk_score}/100")\nif walk_score >= 90: label = "Walker's Paradise"\nelif walk_score >= 70: label = "Very Walkable"\nelif walk_score >= 50: label = "Somewhat Walkable"\nelse: label = "Car-Dependent"\nprint(f"Classification: {label}")`,
      ],
      evidence: [
        'Walk Score methodology: https://www.walkscore.com/methodology.shtml',
        'Carr, L. J. et al. (2010). Validation of Walk Score for Estimating Access to Walkable Amenities. BJSM, 45(14), 1144-1148.',
      ],
      limitations:
        'Original Walk Score is proprietary — open implementations approximate it. ' +
        'Does not account for pedestrian infrastructure quality (sidewalk width, crossings, shade). ' +
        'US-centric amenity categories may not apply globally.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
    },
    {
      id: 'ui-15min-city',
      title: '15-Minute City Analysis',
      sectionId: 'urban_indicators',
      summary:
        'Evaluates whether residents can reach essential services (grocery, healthcare, education, parks, transit, employment) ' +
        'within a 15-minute walk (1200 m network distance at 80 m/min) or cycle (3750 m at 250 m/min). ' +
        'Based on Moreno et al. (2021) chrono-urbanism concept. Output is a binary or graded pass/fail map per residential location.',
      tags: ['accessibility', 'pedestrian', 'cycling', 'indicators'],
      methodology:
        '1. Define the service categories and minimum thresholds (e.g., at least 1 grocery within 15 min walk).\n' +
        '2. Build the pedestrian/cycling network with OSMnx.\n' +
        '3. Compute network-based isochrones or distance matrices with Pandana.\n' +
        '4. For each residential point, count reachable services per category within the threshold.\n' +
        '5. Score: percentage of categories met. A location "passes" if all categories are satisfied.\n' +
        '6. Map pass/fail or composite score as hexagonal heatmap.',
      tools: ['osmnx', 'pandana', 'geopandas', 'h3-py'],
      datasets: ['OSM (amenities, transport, services)', 'GTFS feeds', 'WorldPop population grid'],
      examples: [
        'Paris en Commun: official 15-min city audit of 20 arrondissements showing 1st arr. (100% coverage) vs 19th arr. (62%), driving €300M investment',
        'Melbourne 20-Minute Neighbourhood: Pandana-based analysis for 5 000 SA1 areas identifying 35% of suburbs failing healthcare access threshold',
        'Bogotá POT 2022: 15-min city assessment showing 78% of stratums 1–2 lacking supermarket access within 1 200m network walk',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\nimport networkx as nx\n\n# 15-Minute City Analysis\nplace = "Kadikoy, Istanbul, Turkey"\nG = ox.graph_from_place(place, network_type="walk")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\n# Service categories and thresholds (walk = 1200m at 80m/min = 15 min)\nservice_categories = {\n    "grocery": {"shop": ["supermarket", "convenience"]},\n    "healthcare": {"amenity": ["hospital", "clinic", "pharmacy"]},\n    "education": {"amenity": ["school", "kindergarten"]},\n    "parks": {"leisure": ["park", "garden"]},\n    "transit": {"highway": "bus_stop"},\n}\nmax_walk = 1200  # meters\n\n# Sample evaluation points (every 10th node)\neval_nodes = list(nodes.index[::10])[:50]\nprint(f"Evaluating {len(eval_nodes)} points...")\n\nresults = []\nfor node_id in eval_nodes:\n    categories_met = 0\n    for cat, tags in service_categories.items():\n        try:\n            pois = ox.features_from_place(place, tags=tags).to_crs(epsg=32636)\n            if len(pois) == 0: continue\n            centroids = pois.geometry.centroid\n            node_point = nodes.loc[node_id, "geometry"]\n            # Quick Euclidean filter\n            dists = centroids.distance(node_point)\n            nearby = dists[dists < max_walk * 1.5]\n            if len(nearby) > 0:\n                categories_met += 1\n        except:\n            pass\n    score = categories_met / len(service_categories)\n    results.append({"node": node_id, "score": score, "categories": categories_met})\n\nimport pandas as pd\ndf = pd.DataFrame(results)\nprint(f"\\n=== 15-Minute City Analysis ===")\nprint(f"Mean coverage: {df['score'].mean():.1%}")\nprint(f"Full coverage (all categories): {(df['score'] == 1.0).mean():.1%}")\nprint(f"Below 60% threshold: {(df['score'] < 0.6).mean():.1%}")\nprint(f"\\nCategory reach: mean {df['categories'].mean():.1f} / {len(service_categories)}")`,
      ],
      evidence: [
        'Moreno, C. et al. (2021). Introducing the "15-Minute City": Sustainability, Resilience and Place Identity. Smart Cities, 4(1), 93-111.',
        'Pozoukidou, G. & Chatziyiannaki, Z. (2021). 15-Minute City: Decomposition of a Planning Concept. Sustainability, 13(2), 928.',
      ],
      limitations:
        'The 15-minute threshold is arbitrary — actual acceptable travel time varies by context and mode. ' +
        'Does not account for service capacity (an overcrowded clinic is technically "accessible"). ' +
        'Cycling infrastructure quality is not captured by network distance alone.',
      sdgAlignment: ['SDG 11.2', 'SDG 11.7'],
    },
    {
      id: 'ui-transit-accessibility',
      title: 'Transit Accessibility Score',
      sectionId: 'urban_indicators',
      summary:
        'A composite transit service quality score combining stop proximity (distance to nearest stop), ' +
        'service frequency (vehicles per hour from GTFS), and route diversity (number of unique routes). ' +
        'Graded A (excellent) through F (no service). Enables equity analysis by overlaying with demographic data.',
      tags: ['transit', 'accessibility', 'equity', 'indicators'],
      methodology:
        '1. Parse GTFS feed: extract stops, stop_times, trips, routes, calendar.\n' +
        '2. Compute headway per stop: median time between departures during AM peak (7–9 AM).\n' +
        '3. Count unique routes serving each stop.\n' +
        '4. Buffer stops at 400 m (bus) and 800 m (rail).\n' +
        '5. For each grid cell or census tract, compute: proximity score (inverse distance to stop), ' +
        'frequency score (vehicles/hour normalised), diversity score (route count normalised).\n' +
        '6. Weighted composite: 0.4 × frequency + 0.3 × proximity + 0.3 × diversity.\n' +
        '7. Grade: A ≥ 0.8, B ≥ 0.6, C ≥ 0.4, D ≥ 0.2, F < 0.2.',
      tools: ['gtfs-kit', 'geopandas', 'pandana', 'h3-py'],
      datasets: ['GTFS feeds (Transitland)', 'census tracts with demographics'],
      examples: [
        'TransitCenter equity report: composite transit score for NYC showing Bronx (Grade C) vs Manhattan (Grade A), exposing service inequity for 1.4M residents',
        'Mamun & Lownes 2011: composite index for 169 Connecticut towns revealing 85% of low-income residents in Grade D/F zones',
        'Nairobi matatu GTFS: first digital transit map enabling accessibility scoring for 4M residents, finding 45% lack 400m stop access',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\nfrom shapely.geometry import Point\n\n# Transit Accessibility Score (simulated GTFS analysis)\n# In production, use gtfs-kit to parse real GTFS feeds\nnp.random.seed(42)\n\n# Simulate transit stops with attributes\nn_stops = 200\nstops = gpd.GeoDataFrame({\n    "stop_id": range(n_stops),\n    "geometry": [Point(29.0 + np.random.uniform(-0.05, 0.05),\n                       41.0 + np.random.uniform(-0.05, 0.05)) for _ in range(n_stops)],\n    "mode": np.random.choice(["bus", "metro", "brt"], n_stops, p=[0.8, 0.1, 0.1]),\n    "headway_min": np.random.choice([5, 10, 15, 20, 30, 60], n_stops, p=[0.05, 0.15, 0.25, 0.25, 0.2, 0.1]),\n    "routes": np.random.randint(1, 8, n_stops),\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\n# Evaluation grid\nfrom shapely.geometry import box\nbounds = stops.total_bounds\nxs = np.arange(bounds[0], bounds[2], 200)\nys = np.arange(bounds[1], bounds[3], 200)\ngrid_points = [Point(x, y) for x in xs for y in ys]\ngrid = gpd.GeoDataFrame({"geometry": grid_points}, crs=stops.crs)\n\n# Score each grid cell\nbuffer_map = {"bus": 400, "metro": 800, "brt": 600}\nresults = []\nfor _, cell in grid.iterrows():\n    # Find stops within buffer\n    nearby = stops[stops.distance(cell.geometry) < 800]\n    if len(nearby) == 0:\n        results.append({"proximity": 0, "frequency": 0, "diversity": 0, "grade": "F"})\n        continue\n    \n    # Proximity score (inverse distance to nearest)\n    min_dist = stops.distance(cell.geometry).min()\n    prox = max(0, 1 - min_dist / 800)\n    \n    # Frequency score\n    freq = min(1, 60 / nearby["headway_min"].min() / 12)  # normalise: 12 veh/hr = 1.0\n    \n    # Diversity score\n    div = min(1, nearby["routes"].max() / 5)\n    \n    composite = 0.4 * freq + 0.3 * prox + 0.3 * div\n    grade = "A" if composite >= 0.8 else "B" if composite >= 0.6 else "C" if composite >= 0.4 else "D" if composite >= 0.2 else "F"\n    results.append({"proximity": prox, "frequency": freq, "diversity": div, "grade": grade})\n\ndf = pd.DataFrame(results)\nprint(f"=== Transit Accessibility Score ===")\nprint(f"Grid cells: {len(df)}")\nfor grade in ["A", "B", "C", "D", "F"]:\n    pct = (df["grade"] == grade).mean() * 100\n    print(f"  Grade {grade}: {pct:.1f}%")\nprint(f"\\nMean scores: proximity={df['proximity'].mean():.2f}, frequency={df['frequency'].mean():.2f}, diversity={df['diversity'].mean():.2f}")`,
      ],
      evidence: [
        'Mamun, S. A. & Lownes, N. E. (2011). A Composite Index of Public Transit Accessibility. JTPM, 7(3), 225-240.',
        'UN-Habitat SDG 11.2.1 metadata: https://unstats.un.org/sdgs/metadata/?Text=11.2.1',
      ],
      limitations:
        'GTFS reflects scheduled, not actual, service. Does not capture crowding, reliability, or comfort. ' +
        'Weighting is subjective — different weightings produce different rankings.',
      sdgAlignment: ['SDG 11.2.1'],
    },
    {
      id: 'ui-gravity-accessibility',
      title: 'Gravity-Based Accessibility',
      sectionId: 'urban_indicators',
      summary:
        'Aᵢ = Σⱼ(Oⱼ × f(cᵢⱼ)), where Oⱼ is the "attractiveness" of destination j (e.g., jobs, retail floor area) ' +
        'and f(cᵢⱼ) is a distance-decay function (negative exponential, power, or Gaussian). ' +
        'Hansen (1959) gravity model remains the standard for measuring potential accessibility in transport planning.',
      tags: ['accessibility', 'mobility', 'indicators', 'spatial_stats'],
      methodology:
        '1. Define origins (residential zone centroids) and destinations (employment centres, services).\n' +
        '2. Compute travel-time matrix (OD cost matrix) using network routing (OSRM, Google, or Pandana).\n' +
        '3. Choose a decay function: f(c) = exp(−β × c) is most common; calibrate β from observed trip-length distributions.\n' +
        '4. Compute Aᵢ for each origin by summing decay-weighted destination attractiveness.\n' +
        '5. Normalise Aᵢ for comparability (min-max or z-score).\n' +
        '6. Map as choropleth; identify low-accessibility zones for intervention.',
      tools: ['pandana', 'osmnx', 'networkx', 'scipy.optimize (for β calibration)'],
      datasets: ['OSM network', 'LODES/WAC employment data', 'census population', 'OSRM travel-time API'],
      examples: [
        'Hansen 1959 Washington DC: original gravity accessibility model showing land development correlates with accessibility (r²=0.84) — foundational study',
        'Geurs & van Wee 2004: Netherlands gravity model with calibrated β=0.08 for car, β=0.12 for transit, quantifying mode-specific accessibility gaps',
        'São Paulo METRO: gravity-based job accessibility showing Pinheiros (top decile) has 18× more accessible jobs than Cidade Tiradentes (bottom decile)',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\nimport geopandas as gpd\nfrom shapely.geometry import Point\n\n# Gravity-Based Accessibility Model\nnp.random.seed(42)\nn_origins = 30\nn_dests = 15\n\n# Simulated zones\norigins = gpd.GeoDataFrame({\n    "zone_id": [f"O{i}" for i in range(n_origins)],\n    "population": np.random.randint(5000, 50000, n_origins),\n    "geometry": [Point(29.0 + np.random.uniform(-0.1, 0.1),\n                       41.0 + np.random.uniform(-0.05, 0.05)) for _ in range(n_origins)],\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\ndestinations = gpd.GeoDataFrame({\n    "zone_id": [f"D{i}" for i in range(n_dests)],\n    "jobs": np.random.randint(2000, 30000, n_dests),\n    "geometry": [Point(29.0 + np.random.uniform(-0.1, 0.1),\n                       41.0 + np.random.uniform(-0.05, 0.05)) for _ in range(n_dests)],\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\n# Travel time matrix (Euclidean / 1000 as proxy for minutes)\ntt_matrix = np.zeros((n_origins, n_dests))\nfor i, (_, o) in enumerate(origins.iterrows()):\n    for j, (_, d) in enumerate(destinations.iterrows()):\n        tt_matrix[i, j] = o.geometry.distance(d.geometry) / 1000  # proxy minutes\n\n# Gravity model with negative exponential decay\nbeta = 0.1  # calibrated decay parameter\n\naccessibility = np.zeros(n_origins)\nfor i in range(n_origins):\n    decay = np.exp(-beta * tt_matrix[i])\n    accessibility[i] = np.sum(destinations["jobs"].values * decay)\n\n# Normalise to 0-100\nacc_norm = (accessibility - accessibility.min()) / (accessibility.max() - accessibility.min()) * 100\norigins["accessibility"] = acc_norm\norigins["access_raw"] = accessibility\n\nprint(f"=== Gravity-Based Accessibility (beta={beta}) ===")\nprint(f"Origins: {n_origins}, Destinations: {n_dests}, Total jobs: {destinations['jobs'].sum():,}")\nprint(f"\\nAccessibility distribution:")\nprint(f"  Mean: {acc_norm.mean():.1f}")\nprint(f"  Std: {acc_norm.std():.1f}")\nprint(f"  Min: {acc_norm.min():.1f} ({origins.iloc[acc_norm.argmin()]['zone_id']})")\nprint(f"  Max: {acc_norm.max():.1f} ({origins.iloc[acc_norm.argmax()]['zone_id']})")\nprint(f"  Ratio max/min (raw): {accessibility.max()/accessibility.min():.1f}x")\n\n# Population-weighted mean\npop_weighted = np.average(acc_norm, weights=origins["population"])\nprint(f"  Population-weighted mean: {pop_weighted:.1f}")`,
      ],
      evidence: [
        'Hansen, W. G. (1959). How Accessibility Shapes Land Use. JAIP, 25(2), 73-76.',
        'Geurs, K. T. & van Wee, B. (2004). Accessibility Evaluation of Land-Use and Transport Strategies. JTEP, 38(2/3), 127-146.',
      ],
      limitations:
        'Decay function choice strongly affects results. Self-potential (i = j) may dominate in large zones. ' +
        'Does not account for competition (multiple people seeking the same opportunities).',
      sdgAlignment: ['SDG 11.2', 'SDG 8.5'],
    },
    {
      id: 'ui-cumulative-opportunities',
      title: 'Cumulative Opportunities',
      sectionId: 'urban_indicators',
      summary:
        'COᵢ(t) = Σⱼ Oⱼ × I(cᵢⱼ ≤ t), where I is 1 if travel cost cᵢⱼ is within threshold t, else 0. ' +
        'Counts the number of opportunities (jobs, schools, hospitals, etc.) reachable within a travel-time threshold. ' +
        'The simplest and most interpretable accessibility metric.',
      tags: ['accessibility', 'indicators'],
      methodology:
        '1. Define opportunity type (e.g., jobs) and travel-time threshold (e.g., 30 min by transit).\n' +
        '2. Compute travel-time matrix from each origin to all possible destinations.\n' +
        '3. For each origin, count destinations where travel time ≤ threshold.\n' +
        '4. Optionally normalise by total opportunities in the region.\n' +
        '5. Map and compare across zones; identify underserved areas.',
      tools: ['pandana', 'r5py', 'geopandas', 'osmnx'],
      datasets: ['LODES/WAC employment data', 'GTFS feeds', 'OSM network', 'census population'],
      examples: [
        'Minneapolis Accessibility Observatory: 30-min auto access to jobs ranging from 1.2M (downtown) to 50K (rural fringe), tracking annual changes',
        'Transport for London: cumulative job access within 45 min transit showing East London 120K vs West London 450K, driving Crossrail investment case',
        'Pereira et al. 2019 Brazil: r5-based assessment showing top-income decile reaches 5× more jobs in 60 min than bottom decile across 20 cities',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\nimport geopandas as gpd\nfrom shapely.geometry import Point\n\n# Cumulative Opportunities Model\nnp.random.seed(42)\nn_origins = 40\nn_dests = 25\n\n# Simulated zones\norigins = gpd.GeoDataFrame({\n    "zone": [f"zone_{i}" for i in range(n_origins)],\n    "pop": np.random.randint(3000, 30000, n_origins),\n    "geometry": [Point(29.0 + np.random.uniform(-0.08, 0.08),\n                       41.0 + np.random.uniform(-0.04, 0.04)) for _ in range(n_origins)],\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\ndests = gpd.GeoDataFrame({\n    "zone": [f"dest_{i}" for i in range(n_dests)],\n    "jobs": np.random.randint(1000, 20000, n_dests),\n    "geometry": [Point(29.0 + np.random.uniform(-0.08, 0.08),\n                       41.0 + np.random.uniform(-0.04, 0.04)) for _ in range(n_dests)],\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\n# Travel time proxy (Euclidean / 500)\nthresholds = [15, 30, 45, 60]  # minutes\n\nprint("=== Cumulative Opportunities ===")\nprint(f"Total jobs in region: {dests['jobs'].sum():,}\\n")\n\nfor threshold in thresholds:\n    co = np.zeros(n_origins)\n    for i, (_, o) in enumerate(origins.iterrows()):\n        for j, (_, d) in enumerate(dests.iterrows()):\n            tt = o.geometry.distance(d.geometry) / 500  # proxy minutes\n            if tt <= threshold:\n                co[i] += d["jobs"]\n    \n    pop_weighted = np.average(co, weights=origins["pop"])\n    pct_total = co.mean() / dests["jobs"].sum() * 100\n    ratio = co.max() / max(co.min(), 1)\n    \n    print(f"{threshold}-min threshold:")\n    print(f"  Mean reachable jobs: {co.mean():,.0f} ({pct_total:.1f}%)")\n    print(f"  Pop-weighted mean: {pop_weighted:,.0f}")\n    print(f"  Min: {co.min():,.0f}  Max: {co.max():,.0f}  Ratio: {ratio:.1f}x")`,
      ],
      evidence: [
        'El-Geneidy, A. & Levinson, D. (2006). Access to Destinations: Development of Accessibility Measures. Report 2006-16, MnDOT.',
      ],
      limitations:
        'Binary threshold ignores the distinction between 5-minute and 29-minute accessibility. ' +
        'Does not consider opportunity quality or capacity.',
      sdgAlignment: ['SDG 11.2', 'SDG 8.5'],
    },

    // ===================================================================
    // ENVIRONMENT GROUP
    // ===================================================================
    {
      id: 'ui-ndvi',
      title: 'NDVI Computation',
      sectionId: 'urban_indicators',
      summary:
        'NDVI = (NIR − RED) / (NIR + RED). For Sentinel-2: (B8 − B4) / (B8 + B4); for Landsat-8: (B5 − B4) / (B5 + B4). ' +
        'Values range from −1 to +1. Interpretation: < 0 water/snow, 0–0.2 bare soil/impervious, 0.2–0.5 sparse vegetation, ' +
        '0.5–0.7 moderate vegetation, > 0.7 dense healthy vegetation.',
      tags: ['remote_sensing', 'green_infra', 'indicators', 'climate'],
      methodology:
        '1. Acquire cloud-free imagery (Sentinel-2 L2A via STAC or Copernicus Data Space).\n' +
        '2. Load NIR and RED bands as numpy arrays (rasterio / rioxarray).\n' +
        '3. Compute NDVI pixel-by-pixel: ndvi = (nir.astype(float) - red.astype(float)) / (nir + red + 1e-10).\n' +
        '4. Mask water and clouds using the SCL band.\n' +
        '5. Aggregate to spatial units (zonal statistics with rasterstats).\n' +
        '6. Compute temporal composites (monthly median) for seasonal analysis.',
      tools: ['rasterio', 'rioxarray', 'rasterstats', 'numpy', 'pystac-client'],
      datasets: ['Sentinel-2 L2A (ESA, free)', 'Landsat Collection-2 (USGS, free)'],
      examples: [
        'Zhu et al. 2019: global urban NDVI mapping for 841 cities showing mean NDVI decline of 0.03/decade in rapidly urbanising areas',
        'NYC Parks: seasonal NDVI monitoring of 30 000 acres revealing Bronx green deficit (NDVI 0.28 vs Manhattan 0.35) driving €MillionTreesNYC programme',
        'Singapore NParks: bi-monthly Sentinel-2 NDVI for 724 km² tracking canopy health and guiding 1M tree-planting target by 2030',
      ],
      prompts: [
        `import numpy as np\n\n# NDVI Computation (simulated — replace with real rasterio/STAC workflow)\n# In production: use pystac-client + rasterio to load Sentinel-2 L2A\nnp.random.seed(42)\n\n# Simulate Sentinel-2 bands (10m resolution, 500×500 tile)\nrows, cols = 500, 500\nnir = np.random.uniform(500, 4000, (rows, cols)).astype(float)  # B8\nred = np.random.uniform(200, 2500, (rows, cols)).astype(float)  # B4\n\n# Add realistic patterns: urban core (low veg), parks (high veg)\n# Urban core: center of image\ncenter = (rows//2, cols//2)\nfor i in range(rows):\n    for j in range(cols):\n        dist = np.sqrt((i-center[0])**2 + (j-center[1])**2)\n        if dist < 100:  # urban core\n            nir[i,j] *= 0.4\n        elif 150 < dist < 180:  # park ring\n            nir[i,j] *= 1.5\n            red[i,j] *= 0.6\n\n# Compute NDVI\nndvi = (nir - red) / (nir + red + 1e-10)\nndvi = np.clip(ndvi, -1, 1)\n\nprint("=== NDVI Analysis ===")\nprint(f"Tile size: {rows}×{cols} pixels (10m = {rows*10/1000:.1f}×{cols*10/1000:.1f} km)")\nprint(f"\\nNDVI Statistics:")\nprint(f"  Mean: {ndvi.mean():.3f}")\nprint(f"  Std: {ndvi.std():.3f}")\nprint(f"  Min: {ndvi.min():.3f}")\nprint(f"  Max: {ndvi.max():.3f}")\n\n# Classification\nclasses = {\n    "Water/snow (< 0)": (ndvi < 0).sum(),\n    "Bare soil/impervious (0–0.2)": ((ndvi >= 0) & (ndvi < 0.2)).sum(),\n    "Sparse vegetation (0.2–0.5)": ((ndvi >= 0.2) & (ndvi < 0.5)).sum(),\n    "Moderate vegetation (0.5–0.7)": ((ndvi >= 0.5) & (ndvi < 0.7)).sum(),\n    "Dense vegetation (> 0.7)": (ndvi >= 0.7).sum(),\n}\ntotal_px = rows * cols\nprint(f"\\nLand Cover Classification:")\nfor label, count in classes.items():\n    print(f"  {label}: {count:,} px ({count/total_px*100:.1f}%)")\n\n# Urban greenness ratio\ngreen_px = ((ndvi >= 0.2)).sum()\nprint(f"\\nUrban greenness ratio (NDVI≥0.2): {green_px/total_px*100:.1f}%")`,
      ],
      evidence: [
        'Tucker, C. J. (1979). Red and Photographic Infrared Linear Combinations for Monitoring Vegetation. RSE, 8(2), 127-150.',
      ],
      limitations:
        'NDVI saturates in dense canopy (use EVI instead). Atmospheric effects remain after L2A correction. ' +
        'Mixed pixels in urban areas blend vegetation with impervious surfaces.',
      sdgAlignment: ['SDG 11.7', 'SDG 15.1'],
    },
    {
      id: 'ui-uhi',
      title: 'Urban Heat Island Intensity',
      sectionId: 'urban_indicators',
      summary:
        'UHI intensity = LST_urban − LST_rural, where LST is land surface temperature derived from Landsat Band 10 (thermal IR). ' +
        'Typical daytime UHI: 1–3 °C in temperate cities, 5–12 °C in arid cities. ' +
        'UHI mapping identifies heat hotspots for targeted cooling interventions (tree planting, cool roofs, parks).',
      tags: ['climate', 'heat_island', 'remote_sensing', 'indicators'],
      methodology:
        '1. Acquire Landsat-8/9 thermal band (B10, 100 m resolution, resampled to 30 m).\n' +
        '2. Convert DN to at-sensor brightness temperature using calibration constants.\n' +
        '3. Apply emissivity correction: LST = BT / (1 + (λ × BT / ρ) × ln(ε)), where ε is estimated from NDVI.\n' +
        '4. Define urban and rural reference zones.\n' +
        '5. Compute UHI = mean(LST_urban) − mean(LST_rural).\n' +
        '6. For intra-urban analysis, map LST pixel values and overlay with land cover.',
      tools: ['rasterio', 'numpy', 'earthengine-api', 'rasterstats', 'geopandas'],
      datasets: ['Landsat-8/9 Collection-2 Level-2 (USGS)', 'MODIS LST (1 km daily)'],
      examples: [
        'Oke 1982: seminal study establishing urban–rural temperature difference framework, finding nocturnal UHI of 12°C in Montreal under calm, clear conditions',
        'Athens National Observatory: Landsat LST analysis showing Acropolis district 8°C cooler than Piraeus port area, validating green/blue infrastructure effects',
        'Phoenix ASU: ECOSTRESS night-time LST revealing 6–8°C UHI in low-income south Phoenix vs 2°C in affluent Scottsdale, driving equity-focused cooling policy',
      ],
      prompts: [
        `import numpy as np\n\n# Urban Heat Island Intensity Analysis\n# In production: use rasterio to load Landsat-8 Band 10 (thermal)\nnp.random.seed(42)\n\n# Simulate LST values (degrees Celsius)\nrows, cols = 300, 300\n\n# Base rural temperature\nlst = np.full((rows, cols), 32.0)\n\n# Add urban heat effect (radial pattern)\ncenter = (rows//2, cols//2)\nfor i in range(rows):\n    for j in range(cols):\n        dist = np.sqrt((i - center[0])**2 + (j - center[1])**2)\n        if dist < 80:  # CBD core\n            lst[i,j] += np.random.uniform(5, 10)\n        elif dist < 120:  # inner urban\n            lst[i,j] += np.random.uniform(2, 6)\n        elif dist < 160:  # suburban\n            lst[i,j] += np.random.uniform(0.5, 2)\n        # Add park cooling (patches)\n        if 60 < i < 80 and 60 < j < 80:  # park area\n            lst[i,j] -= np.random.uniform(2, 4)\n        if 200 < i < 220 and 200 < j < 220:  # water body\n            lst[i,j] -= np.random.uniform(3, 5)\n\nlst += np.random.normal(0, 0.5, (rows, cols))  # sensor noise\n\n# Define zones\nurban_mask = np.zeros((rows, cols), dtype=bool)\nrural_mask = np.zeros((rows, cols), dtype=bool)\nfor i in range(rows):\n    for j in range(cols):\n        dist = np.sqrt((i - center[0])**2 + (j - center[1])**2)\n        if dist < 80: urban_mask[i,j] = True\n        elif dist > 130: rural_mask[i,j] = True\n\nlst_urban = lst[urban_mask].mean()\nlst_rural = lst[rural_mask].mean()\nuhi_intensity = lst_urban - lst_rural\n\nprint("=== Urban Heat Island Analysis ===")\nprint(f"Grid: {rows}×{cols} pixels")\nprint(f"\\nMean LST (urban core): {lst_urban:.1f} °C")\nprint(f"Mean LST (rural reference): {lst_rural:.1f} °C")\nprint(f"UHI intensity: +{uhi_intensity:.1f} °C")\n\n# Percentile analysis\np90 = np.percentile(lst, 90)\np10 = np.percentile(lst, 10)\nprint(f"\\nLST range: {lst.min():.1f}–{lst.max():.1f} °C")\nprint(f"P10: {p10:.1f} °C, P90: {p90:.1f} °C")\nprint(f"Hotspot pixels (> P90): {(lst > p90).sum():,} ({(lst > p90).mean()*100:.1f}%)")\nprint(f"Cool refuge pixels (< P10): {(lst < p10).sum():,} ({(lst < p10).mean()*100:.1f}%)")`,
      ],
      evidence: [
        'Oke, T. R. (1982). The Energetic Basis of the Urban Heat Island. Quarterly J. Royal Met. Soc., 108(455), 1-24.',
        'Voogt, J. A. & Oke, T. R. (2003). Thermal Remote Sensing of Urban Climates. RSE, 86(3), 370-384.',
      ],
      limitations:
        'Landsat thermal resolution (100 m) is coarse for building-level analysis. Cloud-free daytime imagery required. ' +
        'LST ≠ air temperature; surface and canopy UHI may differ. Nighttime UHI (often more impactful) requires MODIS or ECOSTRESS.',
      sdgAlignment: ['SDG 11.6', 'SDG 13.1'],
    },
    {
      id: 'ui-green-space-per-capita',
      title: 'Green Space Per Capita',
      sectionId: 'urban_indicators',
      summary:
        'Green space per capita = total green area (m²) / population. WHO recommends a minimum of 9 m²/person; ' +
        'the EU green city standard targets 15–25 m²/person. Green space includes parks, gardens, urban forests, ' +
        'and protected natural areas within the urban boundary.',
      tags: ['green_infra', 'parks', 'indicators', 'health'],
      methodology:
        '1. Extract green space polygons from OSM (leisure=park, landuse=forest/grass, natural=wood).\n' +
        '2. Alternatively, derive from NDVI > 0.3 threshold (Sentinel-2) or land cover classification.\n' +
        '3. Compute total green area per spatial unit (district, neighbourhood, hex cell).\n' +
        '4. Obtain population data (census or WorldPop raster) for the same units.\n' +
        '5. Ratio = green_area_m2 / population.\n' +
        '6. Map and flag zones below WHO 9 m² threshold.',
      tools: ['osmnx', 'geopandas', 'rasterstats', 'h3-py'],
      datasets: ['OSM (parks, forests)', 'Sentinel-2 NDVI', 'WorldPop', 'census'],
      examples: [
        'WHO Europe 2016: review of 30 cities finding median green space 18 m²/capita, with Oslo (68 m²) and Istanbul (6.5 m²) as extremes',
        'SDG 11.7.1 Nairobi: analysis revealing 6.1 m²/capita (below WHO 9 m² threshold) with Kibera at 0.3 m²/capita driving park investment programme',
        'Singapore garden city: NParks accounting showing 66 m² green space per capita maintained through mandatory set-aside regulations since 1967',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Green Space Per Capita Analysis\nplace = "Besiktas, Istanbul, Turkey"\n\n# Extract green spaces from OSM\ngreen_tags = {\n    "leisure": ["park", "garden", "nature_reserve"],\n    "landuse": ["forest", "grass", "meadow", "recreation_ground"],\n    "natural": ["wood", "scrub"],\n}\n\ntotal_green_area = 0\ngreen_features = []\nfor tags in [green_tags]:\n    for key, values in tags.items():\n        try:\n            features = ox.features_from_place(place, tags={key: values})\n            features = features[features.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n            features["area_m2"] = features.geometry.area\n            green_features.append(features)\n        except:\n            pass\n\nif green_features:\n    all_green = gpd.GeoDataFrame(pd.concat(green_features, ignore_index=True))\n    # Dissolve overlaps\n    dissolved = all_green.unary_union\n    total_green_area = dissolved.area\nelse:\n    total_green_area = 0\n\nimport pandas as pd\n\n# Estimate population (use WorldPop in production)\nestimated_pop = 180000  # Besiktas approximate population\n\ngreen_per_capita = total_green_area / estimated_pop if estimated_pop > 0 else 0\n\nprint(f"=== Green Space Per Capita ===")\nprint(f"Location: {place}")\nprint(f"Total green area: {total_green_area:,.0f} m² ({total_green_area/10000:.1f} ha)")\nprint(f"Estimated population: {estimated_pop:,}")\nprint(f"Green space per capita: {green_per_capita:.1f} m²/person")\n\n# WHO benchmark\nwho_min = 9  # m²/person\neu_target = 20  # m²/person\nprint(f"\\nBenchmarks:")\nprint(f"  WHO minimum (9 m²): {'MEETS' if green_per_capita >= who_min else 'BELOW'}")\nprint(f"  EU target (20 m²): {'MEETS' if green_per_capita >= eu_target else 'BELOW'}")\n\nif green_per_capita < who_min:\n    deficit = (who_min - green_per_capita) * estimated_pop\n    print(f"  Deficit to WHO: {deficit:,.0f} m² ({deficit/10000:.1f} ha) additional green space needed")`,
      ],
      evidence: [
        'WHO (2016). Urban Green Spaces and Health: A Review of Evidence. WHO Regional Office for Europe.',
        'European Environment Agency (2021). Who Benefits from Nature in Cities?',
      ],
      limitations:
        'OSM green space completeness varies. NDVI-derived areas may include private gardens (not publicly accessible). ' +
        'Quality, safety, and accessibility of green space are not captured by area alone.',
      sdgAlignment: ['SDG 11.7.1', 'SDG 15.1'],
    },
    {
      id: 'ui-tree-canopy',
      title: 'Tree Canopy Coverage',
      sectionId: 'urban_indicators',
      summary:
        'Percentage of land area covered by tree canopy, typically measured from aerial/satellite imagery or LiDAR. ' +
        'USDA Forest Service recommends ≥ 30 % canopy cover in urban areas for adequate ecosystem services. ' +
        'Canopy cover reduces UHI, improves air quality, manages stormwater, and enhances mental health.',
      tags: ['green_infra', 'canopy', 'remote_sensing', 'indicators'],
      methodology:
        '1. Obtain high-resolution imagery (< 1 m) or LiDAR point cloud.\n' +
        '2. Option A (imagery): classify pixels as canopy/non-canopy using NDVI threshold or random forest classifier.\n' +
        '3. Option B (LiDAR): filter returns above 2 m height, create canopy height model, threshold > 2 m as tree.\n' +
        '4. Compute canopy area per spatial unit.\n' +
        '5. Canopy % = canopy_area / total_area × 100.\n' +
        '6. Target: flag areas below 30 % for planting priority.',
      tools: ['rasterio', 'scikit-learn', 'geopandas', 'laspy (LiDAR)', 'rasterstats'],
      datasets: ['Municipal tree inventories', 'LiDAR (USGS 3DEP)', 'Google TreeCanopy layer'],
      examples: [
        'American Forests: national tree canopy assessment finding US cities average 27% (below 30% target), with Atlanta at 47% and Phoenix at 9.4%',
        'London i-Tree Eco: LiDAR-based canopy mapping of 8.4M trees covering 21% of Greater London, valued at £6.1B in ecosystem services',
        'Melbourne Urban Forest Strategy: annual canopy tracking from 22% (2012) targeting 40% by 2040, monitoring 77 000 individual trees',
      ],
      prompts: [
        `import numpy as np\n\n# Tree Canopy Coverage Analysis\n# In production: use rasterio + scikit-learn for classification\n# or laspy for LiDAR point cloud processing\nnp.random.seed(42)\n\n# Simulate classified raster (0 = non-canopy, 1 = canopy)\nrows, cols = 400, 400\npixel_size = 1  # meter\n\n# Create simulated canopy map\ncanopy = np.zeros((rows, cols), dtype=int)\n\n# Add tree patches (parks, street trees)\n# Park 1\ncanopy[50:100, 50:120] = 1\n# Park 2\ncanopy[200:260, 300:370] = 1\n# Street trees (scattered)\nfor _ in range(2000):\n    r, c = np.random.randint(0, rows), np.random.randint(0, cols)\n    size = np.random.randint(2, 6)\n    canopy[max(0,r-size):min(rows,r+size), max(0,c-size):min(cols,c+size)] = 1\n# Remove some canopy in CBD area\ncanopy[150:250, 150:250] = np.random.choice([0, 1], (100, 100), p=[0.85, 0.15])\n\ntotal_pixels = rows * cols\ncanopy_pixels = canopy.sum()\ncanopy_pct = canopy_pixels / total_pixels * 100\n\nprint("=== Tree Canopy Coverage ===")\nprint(f"Analysis area: {rows}×{cols}m = {rows*cols/10000:.1f} ha")\nprint(f"Canopy pixels: {canopy_pixels:,} / {total_pixels:,}")\nprint(f"Canopy coverage: {canopy_pct:.1f}%")\n\n# USDA target assessment\ntarget = 30  # percent\nif canopy_pct >= target:\n    print(f"Status: MEETS USDA Forest Service target (≥{target}%)")\nelse:\n    deficit_ha = (target - canopy_pct) / 100 * (rows * cols) / 10000\n    print(f"Status: BELOW target by {target - canopy_pct:.1f}pp ({deficit_ha:.1f} ha deficit)")\n\n# Zonal analysis (quadrants)\nquadrants = {\n    "NW": canopy[:rows//2, :cols//2],\n    "NE": canopy[:rows//2, cols//2:],\n    "SW": canopy[rows//2:, :cols//2],\n    "SE": canopy[rows//2:, cols//2:],\n}\nprint(f"\\nZonal canopy coverage:")\nfor name, quad in quadrants.items():\n    pct = quad.mean() * 100\n    print(f"  {name}: {pct:.1f}%{'  ⚠️ below target' if pct < target else ''}")`,
      ],
      evidence: [
        'Nowak, D. J. & Greenfield, E. J. (2018). Declining urban and community tree cover in the US. Urban Forestry & Urban Greening, 32, 32-55.',
        'USDA Forest Service (2023). i-Tree Tools: https://www.itreetools.org/',
      ],
      limitations:
        'Imagery resolution limits accuracy in dense urban cores. Deciduous trees in leaf-off season are missed. ' +
        'Canopy cover ≠ tree health; stressed trees provide reduced ecosystem services.',
      sdgAlignment: ['SDG 11.7', 'SDG 15.2'],
    },

    // ===================================================================
    // SOCIOECONOMIC GROUP
    // ===================================================================
    {
      id: 'ui-gini',
      title: 'Gini Coefficient',
      sectionId: 'urban_indicators',
      summary:
        'The Gini coefficient measures income or wealth inequality on a scale of 0 (perfect equality) to 1 (perfect inequality). ' +
        'Computed as G = (2 × Σᵢ(i × xᵢ)) / (n × Σᵢ xᵢ) − (n + 1) / n, where x is the sorted income vector. ' +
        'Spatial Gini applied at neighbourhood level reveals intra-city inequality patterns.',
      tags: ['equity', 'economic', 'indicators'],
      methodology:
        '1. Obtain household income data at the finest available geography (census tract, block group).\n' +
        '2. Sort incomes in ascending order.\n' +
        '3. Apply the formula or use simple-statistics: ss.sampleCorrelation or custom implementation.\n' +
        '4. Compute Gini per spatial unit and for the entire city.\n' +
        '5. Map spatial Gini to identify homogeneous vs heterogeneous neighbourhoods.\n' +
        '6. Track temporal change to assess gentrification or policy impact.',
      tools: ['pandas', 'numpy', 'simple-statistics', 'geopandas'],
      datasets: ['US ACS (B19001)', 'Eurostat EU-SILC', 'World Bank WDI'],
      examples: [
        'Rey & Smith 2013: spatial Gini decomposition of US metro areas showing within-neighbourhood inequality accounts for 60–75% of total inequality',
        'São Paulo IBGE: tract-level Gini of 0.38–0.62, with Pinheiros (0.58) vs Cidade Tiradentes (0.31) revealing different inequality mechanisms',
        'London ONS: MSOA-level Gini tracking 2011–2021 showing Kensington (0.52) and Tower Hamlets (0.49) as most unequal, driving living wage policies',
      ],
      prompts: [
        `import numpy as np
import pandas as pd

# Gini Coefficient Computation
np.random.seed(42)

# Simulate household income data for neighbourhoods
n_zones = 50
zones = []
for i in range(n_zones):
    # Each zone has different income distribution
    base = np.random.uniform(20000, 80000)
    spread = np.random.uniform(0.3, 1.5)
    incomes = np.random.lognormal(np.log(base), spread, size=np.random.randint(100, 500))
    incomes = np.clip(incomes, 5000, 500000)
    zones.append({"zone_id": f"zone_{i}", "incomes": incomes})

def gini(x):
    """Compute Gini coefficient for array x."""
    x = np.sort(x)
    n = len(x)
    index = np.arange(1, n + 1)
    return (2 * np.sum(index * x) / (n * np.sum(x))) - (n + 1) / n

# City-wide Gini
all_incomes = np.concatenate([z["incomes"] for z in zones])
city_gini = gini(all_incomes)

print(f"=== Gini Coefficient Analysis ===")
print(f"Total households: {len(all_incomes):,}")
print(f"City-wide Gini: {city_gini:.3f}")
print(f"Median income: \${np.median(all_incomes):,.0f}")
print(f"Mean income: \${np.mean(all_incomes):,.0f}")

# Zone-level Gini
zone_ginis = []
for z in zones:
    g = gini(z["incomes"])
    zone_ginis.append({"zone": z["zone_id"], "gini": g,
                       "median_income": np.median(z["incomes"]),
                       "households": len(z["incomes"])})

df = pd.DataFrame(zone_ginis)
print(f"\\nZone-level Gini distribution:")
print(f"  Mean: {df['gini'].mean():.3f}")
print(f"  Min: {df['gini'].min():.3f} ({df.loc[df['gini'].idxmin(), 'zone']})")
print(f"  Max: {df['gini'].max():.3f} ({df.loc[df['gini'].idxmax(), 'zone']})")

# Identify most unequal zones
top5 = df.nlargest(5, "gini")
print(f"\\nMost unequal zones:")
for _, row in top5.iterrows():
    print(f"  {row['zone']}: Gini={row['gini']:.3f}, median=\${row['median_income']:,.0f}")`,
      ],
      evidence: [
        'Gini, C. (1912). Variabilità e mutabilità. Reprinted in Pizetti & Salvemini (1955).',
        'Rey, S. J. & Smith, R. J. (2013). A spatial decomposition of the Gini coefficient. Letters in Spatial and Resource Sciences, 6(2), 55-70.',
      ],
      limitations:
        'Census income data is grouped into brackets, requiring interpolation. Small-area estimates (ACS) have large margins of error. ' +
        'Gini does not capture the shape of the income distribution (two distributions can have the same Gini).',
      sdgAlignment: ['SDG 10.1', 'SDG 10.2'],
    },
    {
      id: 'ui-simpson-diversity',
      title: 'Simpson Diversity Index',
      sectionId: 'urban_indicators',
      summary:
        'D = 1 − Σ(pᵢ²), where pᵢ is the proportion of category i. Values range from 0 (no diversity) ' +
        'to approaching 1 (high diversity). Used for land-use diversity, ethnic/racial diversity, or economic sector diversity. ' +
        'Simpson index is more intuitive than Shannon entropy for stakeholder communication.',
      tags: ['equity', 'land_use', 'indicators'],
      methodology:
        '1. Define categories (e.g., land-use classes, ethnic groups, economic sectors).\n' +
        '2. Compute proportion pᵢ for each category within the spatial unit.\n' +
        '3. D = 1 − Σ(pᵢ²).\n' +
        '4. Map and compare across neighbourhoods.\n' +
        '5. Track temporal trends to detect homogenisation or diversification.',
      tools: ['pandas', 'numpy', 'geopandas', 'mapclassify'],
      datasets: ['Census ethnicity/race tables', 'business register by sector', 'OSM land-use polygons'],
      examples: [
        'Iceland et al. 2002: Simpson diversity for US metros showing Queens NY (D=0.73) as most ethnically diverse county vs rural counties (D<0.10)',
        'Rotterdam diversity monitor: annual Simpson index for 14 gebieden tracking ethnic diversity change from D=0.45 (2000) to D=0.62 (2020)',
        'Copenhagen economic diversity: sector-based Simpson index for 10 bydele showing Indre By (D=0.82) vs Amager Øst industrial zone (D=0.35)',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\n\n# Simpson Diversity Index\nnp.random.seed(42)\n\n# Simulate land-use or demographic data\nn_zones = 30\ncategories = ["residential", "commercial", "industrial", "institutional", "green", "transport"]\n\nzones = []\nfor i in range(n_zones):\n    # Random proportions (Dirichlet distribution)\n    alpha = np.random.uniform(0.5, 5, len(categories))\n    props = np.random.dirichlet(alpha)\n    zones.append({"zone": f"zone_{i}", **dict(zip(categories, props))})\n\ndf = pd.DataFrame(zones)\n\n# Compute Simpson Diversity\ndef simpson_diversity(row, cats):\n    props = [row[c] for c in cats]\n    return 1 - sum(p**2 for p in props)\n\ndf["simpson_D"] = df.apply(lambda r: simpson_diversity(r, categories), axis=1)\n\nprint("=== Simpson Diversity Index ===")\nprint(f"Zones: {len(df)}")\nprint(f"Categories: {len(categories)}")\nprint(f"Max possible D: {1 - 1/len(categories):.3f}")\nprint(f"\\nDiversity distribution:")\nprint(f"  Mean: {df['simpson_D'].mean():.3f}")\nprint(f"  Min: {df['simpson_D'].min():.3f} ({df.loc[df['simpson_D'].idxmin(), 'zone']})")\nprint(f"  Max: {df['simpson_D'].max():.3f} ({df.loc[df['simpson_D'].idxmax(), 'zone']})")\n\n# Show most and least diverse\nprint(f"\\nMost diverse zone ({df.loc[df['simpson_D'].idxmax(), 'zone']}):")\nrow = df.loc[df['simpson_D'].idxmax()]\nfor cat in categories:\n    print(f"  {cat}: {row[cat]:.1%}")\n\nprint(f"\\nLeast diverse zone ({df.loc[df['simpson_D'].idxmin(), 'zone']}):")\nrow = df.loc[df['simpson_D'].idxmin()]\ndominant = max(categories, key=lambda c: row[c])\nfor cat in categories:\n    marker = " ◀ dominant" if cat == dominant else ""\n    print(f"  {cat}: {row[cat]:.1%}{marker}")`,
      ],
      evidence: [
        'Simpson, E. H. (1949). Measurement of Diversity. Nature, 163, 688.',
      ],
      limitations:
        'Sensitive to the number of categories — more categories generally yield higher diversity scores. ' +
        'Does not account for category similarity (e.g., two types of commercial are "more similar" than commercial vs residential).',
      sdgAlignment: ['SDG 10.2', 'SDG 11.3'],
    },
    {
      id: 'ui-displacement-risk',
      title: 'Displacement Risk Index',
      sectionId: 'urban_indicators',
      summary:
        'A composite index identifying neighbourhoods at risk of gentrification-induced displacement. ' +
        'Components: median household income (below city median), rent burden (> 30 % of income), ' +
        'education level, housing tenure (% renters), demographic change rate, and investment pressure (permits, property sales). ' +
        'Based on UC Berkeley Urban Displacement Project methodology.',
      tags: ['equity', 'gentrification', 'displacement', 'housing', 'indicators'],
      methodology:
        '1. Classify census tracts as "vulnerable" if income < 80 % of city median AND renter % > 40 %.\n' +
        '2. Overlay demographic change indicators: population change, income change, education shift over 2+ census cycles.\n' +
        '3. Add market pressure indicators: building permits, property price appreciation, new development.\n' +
        '4. Composite score: normalise each indicator (z-score), weighted sum.\n' +
        '5. Classify: Not losing low-income, At risk, Undergoing displacement, Advanced gentrification.\n' +
        '6. Map and communicate to stakeholders for policy intervention targeting.',
      tools: ['cenpy', 'geopandas', 'pandas', 'scikit-learn (PCA for weighting)'],
      datasets: ['US ACS 5-year', 'Zillow/Redfin housing prices', 'building permit data'],
      examples: [
        'UC Berkeley UDP: displacement risk mapping for SF Bay Area identifying 38% of low-income tracts "at risk" or "undergoing displacement"',
        'Portland Anti-Displacement PDX: composite index for 441 tracts showing N/NE Portland as highest displacement risk, triggering $60M housing fund',
        'London Gentrification Atlas: 10-year change analysis for 983 LSOAs showing Hackney displacement score double the city average',
      ],
      prompts: [
        `import numpy as np
import pandas as pd

# Displacement Risk Index (UC Berkeley UDP methodology)
np.random.seed(42)
n_tracts = 100

# Simulate census tract data
df = pd.DataFrame({
    "tract_id": [f"tract_{i:03d}" for i in range(n_tracts)],
    "median_income": np.random.lognormal(10.8, 0.5, n_tracts),
    "pct_renter": np.random.beta(4, 3, n_tracts) * 100,
    "pct_college": np.random.beta(3, 4, n_tracts) * 100,
    "rent_burden_pct": np.random.beta(3, 5, n_tracts) * 100,  # % paying >30% of income
    "pop_change_5yr": np.random.normal(0.05, 0.15, n_tracts),
    "income_change_5yr": np.random.normal(0.10, 0.20, n_tracts),
    "permits_per_1000": np.random.exponential(5, n_tracts),
    "price_appreciation_5yr": np.random.normal(0.20, 0.25, n_tracts),
})

city_median_income = df["median_income"].median()

# Step 1: Flag vulnerable tracts
df["vulnerable"] = (df["median_income"] < 0.8 * city_median_income) & (df["pct_renter"] > 40)

# Step 2: Demographic change indicators (z-scores)
for col in ["pop_change_5yr", "income_change_5yr", "pct_college"]:
    df[f"{col}_z"] = (df[col] - df[col].mean()) / df[col].std()

# Step 3: Market pressure indicators
for col in ["permits_per_1000", "price_appreciation_5yr"]:
    df[f"{col}_z"] = (df[col] - df[col].mean()) / df[col].std()

# Composite risk score
df["change_score"] = (df["pop_change_5yr_z"] + df["income_change_5yr_z"] + df["pct_college_z"]) / 3
df["market_score"] = (df["permits_per_1000_z"] + df["price_appreciation_5yr_z"]) / 2
df["risk_score"] = df["change_score"] * 0.5 + df["market_score"] * 0.5

# Classify
def classify(row):
    if not row["vulnerable"]: return "Not losing low-income"
    if row["risk_score"] > 1.0: return "Advanced gentrification"
    if row["risk_score"] > 0.5: return "Undergoing displacement"
    if row["risk_score"] > 0: return "At risk"
    return "Not losing low-income"

df["classification"] = df.apply(classify, axis=1)

print("=== Displacement Risk Index ===")
print(f"Tracts: {n_tracts}")
print(f"City median income: \${city_median_income:,.0f}")
print(f"Vulnerable tracts: {df['vulnerable'].sum()} ({df['vulnerable'].mean()*100:.0f}%)")
print(f"\\nClassification:")
for cls in ["Not losing low-income", "At risk", "Undergoing displacement", "Advanced gentrification"]:
    n = (df["classification"] == cls).sum()
    print(f"  {cls}: {n} ({n/n_tracts*100:.0f}%)")`,
      ],
      evidence: [
        'Chapple, K. & Zuk, M. (2016). Forewarned: The Use of Neighborhood Early Warning Systems for Gentrification and Displacement. Environment and Planning A, 48(4), 654-674.',
        'UC Berkeley Urban Displacement Project: https://www.urbandisplacement.org/',
      ],
      limitations:
        'Displacement is difficult to measure directly — the index captures risk, not actual displacement. ' +
        'Data availability for market pressure indicators varies. Cultural displacement is not captured.',
      sdgAlignment: ['SDG 11.1.1', 'SDG 10.1'],
    },
    {
      id: 'ui-jobs-housing',
      title: 'Jobs-Housing Balance',
      sectionId: 'urban_indicators',
      summary:
        'JHB = total jobs / total housing units (or employed residents) within a defined area. ' +
        'An ideal balance of 0.8–1.2 suggests residents can work locally, reducing commute distances. ' +
        'Values < 0.8 indicate a bedroom community; > 1.5 indicates an employment centre generating inbound commutes.',
      tags: ['economic', 'employment', 'mobility', 'indicators'],
      methodology:
        '1. Obtain employment data by location (LODES/WAC in the US, business register in EU).\n' +
        '2. Obtain residential population or housing units from census.\n' +
        '3. Define spatial units (TAZ, census tract, municipality).\n' +
        '4. JHB = jobs / employed_residents per unit.\n' +
        '5. Map and classify: < 0.8 (residential-dominated), 0.8–1.2 (balanced), > 1.5 (employment-dominated).\n' +
        '6. Cross-tabulate with commute data to validate interpretation.',
      tools: ['geopandas', 'cenpy', 'pandas'],
      datasets: ['LEHD LODES (US)', 'EU Business Register', 'census journey-to-work'],
      examples: [
        'Cervero 1989: JHB analysis of Bay Area TAZs showing San Francisco (JHB=1.45) vs Pleasanton (0.35), with balanced areas having 23% shorter commutes',
        'Seoul KRIHS: JHB for 25 gu showing Gangnam (2.8, employment hub) vs Nowon (0.32, bedroom community), driving polycentric development plan',
        'Portland Metro: annual JHB tracking for 2040 growth concept showing mixed-use centres maintaining JHB 0.9–1.1 vs suburban areas at 0.3–0.5',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\n\n# Jobs-Housing Balance Analysis\nnp.random.seed(42)\nn_zones = 40\n\ndf = pd.DataFrame({\n    "zone": [f"zone_{i}" for i in range(n_zones)],\n    "jobs": np.random.lognormal(8, 1.2, n_zones).astype(int),\n    "employed_residents": np.random.lognormal(8, 0.8, n_zones).astype(int),\n    "housing_units": np.random.lognormal(7.5, 0.9, n_zones).astype(int),\n})\n\n# JHB = jobs / employed residents\ndf["jhb"] = df["jobs"] / df["employed_residents"].clip(lower=1)\n\n# Classify\ndef classify_jhb(jhb):\n    if jhb < 0.8: return "Residential-dominated"\n    elif jhb <= 1.2: return "Balanced"\n    elif jhb <= 1.5: return "Slightly employment-heavy"\n    else: return "Employment centre"\n\ndf["classification"] = df["jhb"].apply(classify_jhb)\n\nprint("=== Jobs-Housing Balance ===")\nprint(f"Zones: {n_zones}")\nprint(f"Total jobs: {df['jobs'].sum():,}")\nprint(f"Total employed residents: {df['employed_residents'].sum():,}")\nprint(f"City-wide JHB: {df['jobs'].sum() / df['employed_residents'].sum():.2f}")\n\nprint(f"\\nClassification distribution:")\nfor cls in ["Residential-dominated", "Balanced", "Slightly employment-heavy", "Employment centre"]:\n    n = (df["classification"] == cls).sum()\n    print(f"  {cls}: {n} zones ({n/n_zones*100:.0f}%)")\n\nprint(f"\\nJHB statistics:")\nprint(f"  Mean: {df['jhb'].mean():.2f}")\nprint(f"  Median: {df['jhb'].median():.2f}")\nprint(f"  Min: {df['jhb'].min():.2f} ({df.loc[df['jhb'].idxmin(), 'zone']})")\nprint(f"  Max: {df['jhb'].max():.2f} ({df.loc[df['jhb'].idxmax(), 'zone']})")\n\n# Self-containment proxy\ndf["excess_workers"] = (df["jobs"] - df["employed_residents"]).clip(lower=0)\ndf["excess_residents"] = (df["employed_residents"] - df["jobs"]).clip(lower=0)\nprint(f"\\nCommute implications:")\nprint(f"  Zones exporting workers: {(df['jhb'] < 0.8).sum()}")\nprint(f"  Zones importing workers: {(df['jhb'] > 1.2).sum()}")`,
      ],
      evidence: [
        'Cervero, R. (1989). Jobs-Housing Balancing and Regional Mobility. JAPA, 55(2), 136-150.',
        'Ewing, R. & Cervero, R. (2010). Travel and the Built Environment. JAPA, 76(3), 265-294.',
      ],
      limitations:
        'JHB does not account for job-skill mismatch — jobs may exist but not be suitable for local residents. ' +
        'Scale dependency (MAUP): a balanced city can have imbalanced neighbourhoods.',
      sdgAlignment: ['SDG 8.5', 'SDG 11.2'],
    },

    // ===================================================================
    // SDG 11 GROUP
    // ===================================================================
    {
      id: 'ui-sdg-11-2-1',
      title: 'SDG 11.2.1 Public Transport Access',
      sectionId: 'urban_indicators',
      summary:
        'SDG 11.2.1: proportion of population within 500 m walking distance of a public transit stop with service frequency ' +
        'of ≥ 4 departures per hour during peak times. The official UN-Habitat methodology uses a 500 m buffer for low-capacity ' +
        'modes (bus) and 1000 m for high-capacity modes (metro, BRT).',
      tags: ['transit', 'accessibility', 'sdg', 'indicators'],
      methodology:
        '1. Obtain stop locations from GTFS or OSM.\n' +
        '2. Classify stops by mode: bus (500 m buffer), metro/BRT/rail (1000 m buffer).\n' +
        '3. Filter stops that meet the frequency threshold (≥ 4 departures/hour during AM peak from GTFS stop_times).\n' +
        '4. Buffer qualifying stops by their respective distance.\n' +
        '5. Compute population within the buffered area using census data or WorldPop raster.\n' +
        '6. SDG 11.2.1 = pop_served / total_pop × 100.',
      tools: ['gtfs-kit', 'geopandas', 'rasterstats', 'h3-py'],
      datasets: ['GTFS feeds', 'WorldPop', 'census'],
      examples: [
        'UN-Habitat 2020 global assessment: SDG 11.2.1 across 227 cities showing Zurich (98%) vs Kinshasa (23%) access rate',
        'Nairobi EPFL: GTFS-based SDG 11.2.1 computation finding only 42% of population within 500m of qualifying stops (4+ veh/hr)',
        'Bogota SDG Voluntary Local Review: official 11.2.1 assessment at 74%, identifying 1.2M residents in southern localities without adequate access',
      ],
      prompts: [
        `import numpy as np\nimport pandas as pd\nimport geopandas as gpd\nfrom shapely.geometry import Point\n\n# SDG 11.2.1 Public Transport Access\nnp.random.seed(42)\n\n# Simulate transit stops with frequency\nn_stops = 150\nstops = gpd.GeoDataFrame({\n    "stop_id": range(n_stops),\n    "geometry": [Point(29.0 + np.random.uniform(-0.06, 0.06),\n                       41.0 + np.random.uniform(-0.04, 0.04)) for _ in range(n_stops)],\n    "mode": np.random.choice(["bus", "metro", "brt"], n_stops, p=[0.75, 0.15, 0.10]),\n    "departures_per_hour": np.random.choice([2, 3, 4, 6, 8, 12], n_stops, p=[0.15, 0.15, 0.25, 0.2, 0.15, 0.1]),\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\n# Filter qualifying stops (>= 4 departures/hour)\nqualifying = stops[stops["departures_per_hour"] >= 4].copy()\nprint(f"Total stops: {len(stops)}")\nprint(f"Qualifying stops (≥4 dep/hr): {len(qualifying)}")\n\n# Buffer by mode\nbuffer_dist = {"bus": 500, "metro": 1000, "brt": 1000}\nqualifying["buffer"] = qualifying.apply(\n    lambda r: r.geometry.buffer(buffer_dist[r["mode"]]), axis=1)\n\n# Service area\nfrom shapely.ops import unary_union\nservice_area = unary_union(qualifying["buffer"].values)\n\n# Simulate population grid\nn_pop = 500\npop_points = gpd.GeoDataFrame({\n    "pop": np.random.randint(50, 500, n_pop),\n    "geometry": [Point(29.0 + np.random.uniform(-0.06, 0.06),\n                       41.0 + np.random.uniform(-0.04, 0.04)) for _ in range(n_pop)],\n}, crs="EPSG:4326").to_crs(epsg=32636)\n\n# Check coverage\npop_points["served"] = pop_points.geometry.within(service_area)\ntotal_pop = pop_points["pop"].sum()\nserved_pop = pop_points.loc[pop_points["served"], "pop"].sum()\nsdg_1121 = served_pop / total_pop * 100\n\nprint(f"\\n=== SDG 11.2.1 ===")\nprint(f"Total population: {total_pop:,}")\nprint(f"Served population: {served_pop:,}")\nprint(f"SDG 11.2.1 score: {sdg_1121:.1f}%")\nprint(f"\\nBy mode buffer:")\nfor mode, dist in buffer_dist.items():\n    n_qual = (qualifying["mode"] == mode).sum()\n    print(f"  {mode}: {n_qual} qualifying stops, {dist}m buffer")`,
      ],
      evidence: [
        'UN-Habitat (2020). SDG 11.2.1 Metadata: https://unstats.un.org/sdgs/metadata/?Text=11.2.1',
        'ITF (2019). Benchmarking Accessibility in Cities. OECD/ITF.',
      ],
      limitations:
        'Walking distance buffers assume straight-line access; network distance is more accurate but harder to compute at scale. ' +
        'GTFS coverage is incomplete in many developing countries.',
      sdgAlignment: ['SDG 11.2.1'],
    },
    {
      id: 'ui-sdg-11-3-1',
      title: 'SDG 11.3.1 Land Consumption Rate',
      sectionId: 'urban_indicators',
      summary:
        'LCRPGR = LCR / PGR, where LCR = ln(Urb_t2 / Urb_t1) / (t2 − t1) and PGR = ln(Pop_t2 / Pop_t1) / (t2 − t1). ' +
        'LCRPGR > 1: land is consumed faster than population grows (sprawl). ' +
        'LCRPGR ≤ 1: compact/sustainable growth. The official UN-Habitat SDG 11.3.1 indicator.',
      tags: ['land_use', 'sprawl', 'sdg', 'remote_sensing', 'indicators'],
      methodology:
        '1. Obtain built-up area for two time periods (t1, t2) — e.g., Global Human Settlement Layer (GHSL) or classified Landsat.\n' +
        '2. Obtain population for the same time periods (census or WorldPop).\n' +
        '3. Compute LCR = ln(built_t2 / built_t1) / Δt.\n' +
        '4. Compute PGR = ln(pop_t2 / pop_t1) / Δt.\n' +
        '5. LCRPGR = LCR / PGR.\n' +
        '6. Interpret: < 0 means shrinking city, 0–1 compact growth, > 1 sprawling, PGR ≈ 0 needs special handling.',
      tools: ['rasterio', 'numpy', 'geopandas', 'earthengine-api'],
      datasets: ['GHSL Built-Up (JRC, free)', 'WorldPop', 'Landsat time-series'],
      examples: [
        'Angel et al. 2021 Atlas: LCRPGR for 200 cities showing Lagos (LCRPGR=3.2, extreme sprawl) vs Tokyo (0.4, compact infill)',
        'UN-Habitat 2020: global SDG 11.3.1 assessment finding 70% of African cities with LCRPGR > 1.5, consuming agricultural land 3× faster than population growth',
        'Istanbul IBB: GHSL-based 1990–2015 analysis showing LCRPGR=2.1, with northern forest areas consumed at 4.5% annual rate despite lower population growth',
      ],
      prompts: [
        `import numpy as np\n\n# SDG 11.3.1 Land Consumption Rate vs Population Growth Rate\n\n# Example city data (two time periods)\ncities = {\n    "Istanbul": {"built_t1": 520, "built_t2": 780, "pop_t1": 10.0e6, "pop_t2": 15.5e6, "t1": 2000, "t2": 2020},\n    "Tokyo": {"built_t1": 1800, "built_t2": 1900, "pop_t1": 33.0e6, "pop_t2": 37.4e6, "t1": 2000, "t2": 2020},\n    "Lagos": {"built_t1": 180, "built_t2": 620, "pop_t1": 7.2e6, "pop_t2": 15.4e6, "t1": 2000, "t2": 2020},\n    "Copenhagen": {"built_t1": 310, "built_t2": 325, "pop_t1": 1.15e6, "pop_t2": 1.35e6, "t1": 2000, "t2": 2020},\n    "Phoenix": {"built_t1": 1200, "built_t2": 1950, "pop_t1": 3.2e6, "pop_t2": 4.9e6, "t1": 2000, "t2": 2020},\n}\n\nprint("=== SDG 11.3.1 Land Consumption Rate ===")\nprint(f"{'City':<15} {'LCR':>7} {'PGR':>7} {'LCRPGR':>8} {'Assessment'}")\nprint("-" * 55)\n\nfor city, d in cities.items():\n    dt = d["t2"] - d["t1"]\n    lcr = np.log(d["built_t2"] / d["built_t1"]) / dt\n    pgr = np.log(d["pop_t2"] / d["pop_t1"]) / dt\n    \n    if pgr > 0:\n        lcrpgr = lcr / pgr\n    else:\n        lcrpgr = float("inf")\n    \n    if lcrpgr < 0:\n        assessment = "Shrinking city"\n    elif lcrpgr <= 1:\n        assessment = "Compact growth"\n    elif lcrpgr <= 2:\n        assessment = "Moderate sprawl"\n    else:\n        assessment = "Extreme sprawl"\n    \n    print(f"{city:<15} {lcr:>7.4f} {pgr:>7.4f} {lcrpgr:>8.2f} {assessment}")\n\nprint(f"\\nInterpretation:")\nprint(f"  LCRPGR < 0: shrinking city (caution: formula may mislead)")\nprint(f"  LCRPGR 0–1: compact/sustainable growth")\nprint(f"  LCRPGR > 1: land consumed faster than population grows (sprawl)")\nprint(f"  LCRPGR > 2: extreme sprawl, high agricultural/forest land loss")`,
      ],
      evidence: [
        'UN-Habitat (2020). SDG 11.3.1 Metadata.',
        'Angel, S. et al. (2021). Atlas of Urban Expansion — The 2020 Edition. Lincoln Institute.',
      ],
      limitations:
        'Built-up area definitions vary across datasets. Population intercensal estimates have uncertainty. ' +
        'LCRPGR is undefined when PGR = 0 and misleading when PGR < 0 (shrinking cities).',
      sdgAlignment: ['SDG 11.3.1'],
    },
    {
      id: 'ui-sdg-11-7-1',
      title: 'SDG 11.7.1 Public Open Space',
      sectionId: 'urban_indicators',
      summary:
        'SDG 11.7.1: average share of the built-up area of cities that is open public space. ' +
        'Open public space includes parks, plazas, greenways, waterfront promenades, and public sports facilities ' +
        'that are freely accessible. UN-Habitat target: ≥ 15–20 % of built-up area.',
      tags: ['parks', 'green_infra', 'sdg', 'indicators'],
      methodology:
        '1. Delineate built-up area boundary (GHSL or national statistics).\n' +
        '2. Map open public spaces: OSM (leisure=park, playground, sports_centre; landuse=recreation_ground), municipal inventories.\n' +
        '3. Exclude private open spaces (gated parks, golf courses unless public).\n' +
        '4. Compute: SDG 11.7.1 = Σ(public_open_space_area) / built_up_area × 100.\n' +
        '5. Disaggregate by sub-area (district, neighbourhood) for equity analysis.\n' +
        '6. Compare against UN-Habitat benchmark.',
      tools: ['osmnx', 'geopandas', 'shapely', 'h3-py'],
      datasets: ['OSM', 'GHSL built-up', 'municipal park inventories'],
      examples: [
        'UN-Habitat global assessment: SDG 11.7.1 for 911 cities showing median 16% open space, with European cities (22%) outperforming African cities (10%)',
        'Istanbul IBB Parks Directorate: 11.7.1 computation showing 7.2% public open space (below 15% target) with Sariyer (23%) vs Esenyurt (3.1%)',
        'Bogotá POT: official SDG 11.7.1 at 18.4% in built-up area including 5 200 parks, but only 4.1 m² effective public space per capita',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# SDG 11.7.1 Public Open Space Share\nplace = "Kadikoy, Istanbul, Turkey"\n\n# Get public open spaces\nopen_space_tags = {\n    "leisure": ["park", "playground", "sports_centre", "pitch"],\n    "landuse": ["recreation_ground"],\n}\n\nspaces = []\nfor key, values in open_space_tags.items():\n    try:\n        features = ox.features_from_place(place, tags={key: values})\n        features = features[features.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n        features["area_m2"] = features.geometry.area\n        spaces.append(features)\n    except:\n        pass\n\nimport pandas as pd\n\nif spaces:\n    all_spaces = pd.concat(spaces, ignore_index=True)\n    all_spaces = gpd.GeoDataFrame(all_spaces, geometry="geometry", crs="EPSG:32636")\n    \n    # Dissolve overlaps\n    from shapely.ops import unary_union\n    dissolved = unary_union(all_spaces.geometry)\n    total_open_space = dissolved.area\n    \n    # Estimate built-up area (convex hull of buildings)\n    buildings = ox.features_from_place(place, tags={"building": True})\n    buildings = buildings[buildings.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32636)\n    built_up_area = buildings.unary_union.convex_hull.area\n    \n    sdg_1171 = total_open_space / built_up_area * 100\n    \n    print(f"=== SDG 11.7.1 Public Open Space ===")\n    print(f"Location: {place}")\n    print(f"Public open spaces: {len(all_spaces)}")\n    print(f"Total open space: {total_open_space:,.0f} m² ({total_open_space/10000:.1f} ha)")\n    print(f"Built-up area: {built_up_area:,.0f} m² ({built_up_area/10000:.1f} ha)")\n    print(f"SDG 11.7.1: {sdg_1171:.1f}%")\n    \n    target = 15  # UN-Habitat benchmark\n    print(f"\\nUN-Habitat target (≥15%): {'MEETS' if sdg_1171 >= target else 'BELOW'}")\n    if sdg_1171 < target:\n        deficit = (target/100 * built_up_area - total_open_space) / 10000\n        print(f"Deficit: {deficit:.1f} ha additional public open space needed")\nelse:\n    print("No public open spaces found in OSM")`,
      ],
      evidence: [
        'UN-Habitat (2020). SDG 11.7.1 Metadata.',
        'Gehl, J. (2011). Life Between Buildings: Using Public Space. Island Press.',
      ],
      limitations:
        'Defining "public" is ambiguous in many contexts (semi-public malls, university campuses). ' +
        'OSM may under-report small urban spaces (pocket parks, widened sidewalks). Quality is not measured.',
      sdgAlignment: ['SDG 11.7.1'],
    },
  ];

  if (existing) {
    return cards.filter(c => !existing.has(c.id));
  }
  return cards;
}
