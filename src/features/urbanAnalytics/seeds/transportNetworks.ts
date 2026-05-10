/**
 * Urban Analytics Workbench — Transport & Network Analysis Seed Cards
 *
 * Covers street network analysis, centrality, space syntax, isochrones,
 * OD flows, transit frequency, complete streets, cycling, pedestrian quality,
 * parking, freight, and multi-modal trip chaining.
 */

import type { Card } from '../lib/types';

export function buildTransportCards(existing?: Set<string>): Card[] {
  const cards: Card[] = [
    {
      id: 'tn-street-network-osmnx',
      title: 'Street Network Analysis with OSMnx',
      sectionId: 'transport_networks',
      summary:
        'Download, model, and analyse street networks from OpenStreetMap using OSMnx. ' +
        'Core metrics: total network length (km), intersection density (per km²), dead-end ratio, ' +
        'average circuity (route distance / Euclidean distance), and k-connectivity. ' +
        'OSMnx converts OSM data to a NetworkX MultiDiGraph with full geometry and attributes.',
      tags: ['network_analysis', 'mobility', 'indicators'],
      methodology:
        '1. Download network: G = ox.graph_from_place(place, network_type="drive"|"walk"|"bike"|"all").\n' +
        '2. Simplify topology: G = ox.simplify_graph(G) to merge interstitial nodes.\n' +
        '3. Project to local UTM: G_proj = ox.project_graph(G).\n' +
        '4. Compute basic stats: stats = ox.basic_stats(G_proj) — node count, edge count, total length, ' +
        'circuity_avg, self_loop_proportion.\n' +
        '5. Intersection density = count(nodes with degree ≥ 3) / study_area_km².\n' +
        '6. Dead-end ratio = count(degree == 1) / total_nodes.\n' +
        '7. Compute extended stats: ox.extended_stats(G_proj, bc=True, cc=True) for centrality.\n' +
        '8. Export to GeoDataFrame: nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_proj).\n' +
        '9. Visualise with ox.plot_graph() or export to GeoPackage for QGIS.\n' +
        '10. Compare across cities or neighbourhoods using normalised metrics.',
      tools: ['osmnx', 'networkx', 'geopandas', 'matplotlib'],
      datasets: ['OpenStreetMap (via OSMnx)', 'HERE road network (commercial)'],
      examples: [
        'Boeing global study: OSMnx analysis of 25 000+ cities revealing street network orientation entropy varies 10x between grid cities (Chicago) and organic cities (Rome)',
        'Barcelona Superblocks: OSMnx network analysis quantifying 67% reduction in through-traffic streets after superblock implementation in Eixample',
        'Addis Ababa: OSMnx network completeness assessment showing 3.2 km/km\u00b2 intersection density vs 12.5 km/km\u00b2 in Manhattan',
      ],
      prompts: [
        `import osmnx as ox\nimport networkx as nx\nimport pandas as pd\n\n# Street Network Analysis with OSMnx\nplace = "Zurich, Switzerland"\nprint(f"Downloading network for {place}...")\n\n# Download and project\nG = ox.graph_from_place(place, network_type="drive")\nG_proj = ox.project_graph(G)\n\n# Basic stats\nstats = ox.basic_stats(G_proj)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\n# Key metrics\nprint(f"\\n=== Network Summary ===")\nprint(f"Nodes: {stats['n']:,}")\nprint(f"Edges: {stats['m']:,}")\nprint(f"Total length: {stats['edge_length_total']/1000:.0f} km")\nprint(f"Avg edge length: {stats['edge_length_avg']:.0f} m")\nprint(f"Circuity avg: {stats['circuity_avg']:.3f}")\n\n# Intersection analysis\ndegrees = dict(G_proj.degree())\nintersections = sum(1 for d in degrees.values() if d >= 3)\ndead_ends = sum(1 for d in degrees.values() if d == 1)\ntotal = len(degrees)\nprint(f"\\n=== Intersection Analysis ===")\nprint(f"Intersections (degree \u22653): {intersections} ({intersections/total*100:.1f}%)")\nprint(f"Dead-ends (degree 1): {dead_ends} ({dead_ends/total*100:.1f}%)")\n\n# Study area and density\nstudy_area = edges.unary_union.convex_hull.area / 1e6  # km\u00b2\nprint(f"\\n=== Density Metrics ===")\nprint(f"Study area: {study_area:.1f} km\u00b2")\nprint(f"Network density: {stats['edge_length_total']/1000/study_area:.1f} km/km\u00b2")\nprint(f"Intersection density: {intersections/study_area:.0f} per km\u00b2")`,
      ],
      evidence: [
        'Boeing, G. (2017). OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks. CEUS, 65, 126-139.',
        'Boeing, G. (2019). Urban Spatial Order: Street Network Orientation, Configuration, and Entropy. Applied Network Science, 4(67).',
      ],
      limitations:
        'OSM completeness varies by region — verify against authoritative road databases. ' +
        'Dual-carriageways create parallel edges that inflate edge counts. ' +
        'Turn restrictions and signal timing are not modelled.',
      sdgAlignment: ['SDG 11.2'],
    },
    {
      id: 'tn-betweenness-centrality',
      title: 'Betweenness Centrality',
      sectionId: 'transport_networks',
      summary:
        'Edge betweenness centrality Cₑ = Σ_{s≠t} (σ_{st}(e) / σ_{st}), where σ_{st} is the number of shortest paths ' +
        'between nodes s and t, and σ_{st}(e) is the number passing through edge e. ' +
        'Identifies critical corridors whose removal would maximally disrupt network flow. ' +
        'Freeman (1977) introduced the concept; it remains central to transport vulnerability analysis.',
      tags: ['network_analysis', 'mobility', 'indicators'],
      methodology:
        '1. Build street network graph with OSMnx (weight = travel_time or length).\n' +
        '2. Compute edge betweenness: nx.edge_betweenness_centrality(G, weight="travel_time").\n' +
        '3. Optionally compute node betweenness: nx.betweenness_centrality(G, weight="travel_time").\n' +
        '4. For large networks, use k-sampling approximation: nx.betweenness_centrality(G, k=500).\n' +
        '5. Normalise values to [0, 1] for comparability.\n' +
        '6. Join centrality values back to edge GeoDataFrame.\n' +
        '7. Map as graduated-width/colour line layer (thicker/redder = higher centrality).\n' +
        '8. Interpret: high-betweenness edges are critical corridors — prioritise for maintenance, ' +
        'capacity expansion, or congestion monitoring.\n' +
        '9. Vulnerability: simulate edge removal and measure network efficiency drop.',
      tools: ['osmnx', 'networkx', 'geopandas', 'matplotlib'],
      datasets: ['OpenStreetMap (via OSMnx)', 'HERE road network (commercial)', 'Municipal traffic count data'],
      examples: [
        'TfL London: betweenness centrality analysis of 250K road segments identifying 15 critical bottleneck corridors carrying 40% of citywide traffic',
        'San Francisco: bridge betweenness showing Bay Bridge as single highest-centrality edge with removal causing 340% increase in average journey time',
        'Tokyo: weighted betweenness analysis of 500K rail+road edges identifying 23 multi-modal interchange stations as network vulnerability points',
      ],
      prompts: [
        `import osmnx as ox\nimport networkx as nx\nimport pandas as pd\n\n# Betweenness Centrality Analysis\nplace = "Bern, Switzerland"\nG = ox.graph_from_place(place, network_type="drive")\nG_proj = ox.project_graph(G)\n\n# Add travel time as weight (length / free-flow speed)\nfor u, v, data in G_proj.edges(data=True):\n    speed = float(data.get("maxspeed", 50)) if isinstance(data.get("maxspeed"), (int, float, str)) else 50\n    if isinstance(speed, str):\n        try: speed = float(speed)\n        except: speed = 50\n    data["travel_time"] = data["length"] / (speed * 1000 / 3600)  # seconds\n\nprint(f"Network: {G_proj.number_of_nodes()} nodes, {G_proj.number_of_edges()} edges")\n\n# Compute edge betweenness (k-sampling for large networks)\nk = min(500, G_proj.number_of_nodes())\nprint(f"Computing betweenness centrality (k={k} sample)...")\nedge_bc = nx.edge_betweenness_centrality(G_proj, weight="travel_time", k=k)\n\n# Assign to edges\nnx.set_edge_attributes(G_proj, edge_bc, "betweenness")\n\n# Extract top corridors\nnodes, edges = ox.graph_to_gdfs(G_proj)\nedges_sorted = edges.sort_values("betweenness", ascending=False)\n\nprint(f"\\n=== Top 10 Critical Corridors ===")\nfor i, (_, row) in enumerate(edges_sorted.head(10).iterrows()):\n    name = row.get("name", "unnamed")\n    if isinstance(name, list): name = name[0]\n    print(f"  {i+1}. {name}: BC={row['betweenness']:.6f}, length={row['length']:.0f}m")\n\n# Summary statistics\nbc_values = edges["betweenness"]\nprint(f"\\nBetweenness distribution:")\nprint(f"  Mean: {bc_values.mean():.6f}")\nprint(f"  Median: {bc_values.median():.6f}")\nprint(f"  95th percentile: {bc_values.quantile(0.95):.6f}")\nprint(f"  Max: {bc_values.max():.6f}")`,
      ],
      evidence: [
        'Freeman, L. C. (1977). A Set of Measures of Centrality Based on Betweenness. Sociometry, 40(1), 35-41.',
        'Barthélemy, M. (2011). Spatial Networks. Physics Reports, 499(1-3), 1-101.',
      ],
      sdgAlignment: ['SDG 11.2', 'SDG 9.1'],
      limitations:
        'Computationally expensive: O(VE) for exact calculation on large networks (> 100 k nodes). ' +
        'Assumes shortest-path routing — actual traffic uses varied routes. ' +
        'Does not account for road capacity or congestion dynamics.',
    },
    {
      id: 'tn-space-syntax',
      title: 'Space Syntax: Integration & Choice',
      sectionId: 'transport_networks',
      summary:
        'Angular segment analysis based on Hillier & Hanson (1984). Key metrics: ' +
        'NAIN (Normalised Angular Integration) measures to-movement potential (how close a segment is to all others); ' +
        'NACH (Normalised Angular Choice) measures through-movement potential (how likely a segment is to be traversed). ' +
        'Space syntax links street configuration to pedestrian and vehicular flows.',
      tags: ['network_analysis', 'pedestrian', 'morphology', 'indicators'],
      methodology:
        '1. Extract street centre-lines from OSM (ox.graph_to_gdfs → edges).\n' +
        '2. Convert to segment map: break lines at intersections, remove stubs.\n' +
        '3. Build angular graph: weight = angular change between connected segments.\n' +
        '4. Compute metric/topological radii: local (400 m walk), district (1200 m), global (n).\n' +
        '5. Integration (Iₐ) = 1 / mean_angular_depth. NAIN = Iₐ × (n^(1.2)).\n' +
        '6. Choice (Cₐ) = Σ shortest angular paths through segment. NACH = log(Cₐ + 1) / log(total_depth + 3).\n' +
        '7. Map NAIN (red = high integration = likely destination) and NACH (blue = high choice = likely route).\n' +
        '8. Validate against pedestrian count data where available.',
      tools: ['momepy', 'networkx', 'geopandas', 'osmnx'],
      datasets: ['OSM centre-lines', 'pedestrian count surveys'],
      examples: [
        'London Space Syntax Lab: NACH analysis of 200K street segments correlating 0.78 with pedestrian counts on 1 200 observation points',
        'Jeddah Al-Balad: NAIN analysis of historic centre showing 85% of commercial activity on top 5% integration streets',
        'Copenhagen pedestrian study: space syntax integration maps predicting 72% of variation in Jan Gehl\'s public life survey counts',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport networkx as nx\nimport numpy as np\n\n# Simplified Space Syntax: Angular Integration & Choice\nplace = "Old Town, Bern, Switzerland"\nG = ox.graph_from_place(place, network_type="walk")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\nprint(f"Network: {len(nodes)} nodes, {len(edges)} segments")\n\n# Compute angular change between connected edges\nG_undirected = G_proj.to_undirected()\n\n# Simplified angular depth: use angle between edge bearings\n# In full space syntax this uses segment angular analysis\nbearings = ox.bearing.add_edge_bearings(G_proj)\n_, edges_b = ox.graph_to_gdfs(bearings)\n\n# Compute node-level metrics as proxy for integration\n# Closeness centrality ~ Integration (how close to all other nodes)\ncloseness = nx.closeness_centrality(G_undirected, distance="length")\n# Betweenness ~ Choice (how many shortest paths pass through)\nbetweenness = nx.betweenness_centrality(G_undirected, weight="length")\n\nnodes["integration"] = nodes.index.map(closeness)\nnodes["choice"] = nodes.index.map(betweenness)\n\n# Normalize\ndef normalize(s):\n    return (s - s.min()) / (s.max() - s.min() + 1e-10)\n\nnodes["NAIN"] = normalize(nodes["integration"])\nnodes["NACH"] = normalize(nodes["choice"])\n\nprint(f"\\n=== Space Syntax Metrics ===")\nprint(f"NAIN (Integration): mean={nodes['NAIN'].mean():.3f}, max node={nodes['NAIN'].idxmax()}")\nprint(f"NACH (Choice): mean={nodes['NACH'].mean():.3f}, max node={nodes['NACH'].idxmax()}")\n\n# Top integration streets (likely destinations)\ntop_int = nodes.nlargest(5, "NAIN")\nprint("\\nTop 5 Integration nodes:")\nfor idx, row in top_int.iterrows():\n    print(f"  Node {idx}: NAIN={row['NAIN']:.3f}, NACH={row['NACH']:.3f}")`,
      ],
      evidence: [
        'Hillier, B. & Hanson, J. (1984). The Social Logic of Space. Cambridge University Press.',
        'Hillier, B., Yang, T., & Turner, A. (2012). Normalising Least Angle Choice in Depthmap. J. Space Syntax, 3(2), 155-193.',
      ],
      limitations:
        'Angular analysis is sensitive to segment granularity — short segments inflate depth. ' +
        'Assumes pedestrians minimise angular deviation, which is debated. ' +
        'Calibration with observed flows is essential before policy application.',
    },
    {
      id: 'tn-isochrone-analysis',
      title: 'Isochrone Analysis',
      sectionId: 'transport_networks',
      summary:
        'Computes travel-time contours (isochrones) from one or more origins by mode: walk (5 km/h), ' +
        'cycle (15 km/h), transit (GTFS schedules), drive (speed limits). Isochrones delineate service areas, ' +
        'measure catchment populations, and identify accessibility gaps. Output: nested polygons at 5, 10, 15, 20, 30 min.',
      tags: ['accessibility', 'mobility', 'transit', 'indicators'],
      methodology:
        '1. Define origin point(s) and mode(s).\n' +
        '2. Build routable network:\n' +
        '   - Walk/cycle: OSMnx with edge speeds assigned.\n' +
        '   - Transit: GTFS-based multimodal network (r5py, OpenTripPlanner, or Pandana).\n' +
        '   - Drive: OSMnx with maxspeed attributes or OSRM.\n' +
        '3. Compute shortest-path tree from origin: travel_time to every reachable node.\n' +
        '4. Classify nodes by time band: 0–5 min, 5–10 min, etc.\n' +
        '5. Generate convex hull or alpha-shape polygon for each band.\n' +
        '6. Clip to study area boundary.\n' +
        '7. Compute catchment population: zonal stats of population raster within each isochrone.\n' +
        '8. Map as graduated-colour nested polygons (green = near, red = far).',
      tools: ['pandana', 'osmnx', 'r5py', 'geopandas', 'shapely (alpha_shape)', 'h3-py'],
      datasets: ['OSM network', 'GTFS feeds', 'WorldPop (population raster)'],
      examples: [
        'R5 accessibility analysis: 45-min transit isochrones for S\u00e3o Paulo showing 55% of jobs accessible to high-income vs 15% for poorest quintile',
        'OpenTripPlanner Portland: multi-modal isochrones from 500 origins revealing 200K residents beyond 30-min transit reach of downtown',
        'Nairobi: walking isochrones from 2 500 health facilities showing 41% of informal settlement residents >30 min walk from nearest clinic',
      ],
      prompts: [
        `import osmnx as ox\nimport networkx as nx\nimport geopandas as gpd\nimport numpy as np\nfrom shapely.geometry import Point\nfrom shapely.ops import unary_union\n\n# Walk Isochrone Analysis\nplace = "Zurich, Switzerland"\nG = ox.graph_from_place(place, network_type="walk")\nG_proj = ox.project_graph(G)\n\n# Set walk speed: 5 km/h = 83.3 m/min\nwalk_speed = 83.3  # m/min\nfor u, v, data in G_proj.edges(data=True):\n    data["walk_time"] = data["length"] / walk_speed\n\n# Origin point (e.g., main train station)\norigin = ox.nearest_nodes(G_proj, *ox.geocode("Zurich HB")[::-1])\n\n# Compute shortest path tree\ntravel_times = nx.single_source_dijkstra_path_length(G_proj, origin, weight="walk_time")\n\n# Classify into time bands\nnodes, edges = ox.graph_to_gdfs(G_proj)\nnodes["walk_min"] = nodes.index.map(travel_times)\n\nbands = [5, 10, 15, 20, 30]\nprint(f"=== Walk Isochrones from Zurich HB ===")\nfor t in bands:\n    reachable = nodes[nodes["walk_min"] <= t]\n    if len(reachable) > 2:\n        hull = reachable.unary_union.convex_hull\n        area_km2 = hull.area / 1e6\n        print(f"  {t:2d} min: {len(reachable):,} nodes, {area_km2:.2f} km\u00b2")\n\n# Population within isochrones (simulated)\n# In practice: use WorldPop raster + rasterstats.zonal_stats()\nprint(f"\\nTotal reachable nodes (30 min): {len(nodes[nodes['walk_min'] <= 30]):,}")\nprint(f"Unreachable nodes: {nodes['walk_min'].isna().sum():,}")`,
      ],
      evidence: [
        'O\'Sullivan, D., Morrison, A., & Shearer, J. (2000). Using Desktop GIS for the Investigation of Accessibility by Public Transport. International Journal of GIS, 14(1), 85-104.',
        'Conway, M. W. et al. (2017). Getting Charlie off the MTA: A Multiobjective Optimization Method. International Journal of GIS, 32(8), 1500-1519.',
      ],
      limitations:
        'Walk/cycle isochrones assume uniform terrain — hills reduce effective speed. ' +
        'Transit isochrones depend heavily on departure time (peak vs off-peak). ' +
        'Convex hull overestimates area; alpha-shape or network-distance polygons preferred.',
      sdgAlignment: ['SDG 11.2'],
    },
    {
      id: 'tn-od-flow-mapping',
      title: 'Origin-Destination Flow Mapping',
      sectionId: 'transport_networks',
      summary:
        'Visualises movement patterns between origins and destinations as desire lines (straight) or routed flows. ' +
        'Data sources: census journey-to-work (LEHD LODES in US, EU Census Hub), mobile phone CDR, GPS traces, ' +
        'or Google Distance Matrix API. Flow bundling reduces visual clutter for large OD matrices.',
      tags: ['mobility', 'network_analysis', 'indicators'],
      methodology:
        '1. Obtain OD matrix: origin zone → destination zone → trip count.\n' +
        '2. Geocode zone centroids (or use population-weighted centroids).\n' +
        '3. Generate desire lines: LineString from origin centroid to destination centroid.\n' +
        '4. Attribute each line with trip count, mode share, average distance/time.\n' +
        '5. Filter: remove flows below threshold (e.g., < 10 trips) to reduce clutter.\n' +
        '6. Optional: flow bundling using force-directed edge bundling (FDEB) for visual clarity.\n' +
        '7. Map as deck.gl ArcLayer (3D arcs) or LineLayer (2D lines).\n' +
        '8. Width/colour proportional to flow volume.\n' +
        '9. Aggregate net flows: inbound − outbound per zone for balance analysis.\n' +
        '10. Overlay with transit routes to identify served vs unserved corridors.',
      tools: ['geopandas', 'pandas', 'deck.gl (ArcLayer)', 'osmnx', 'matplotlib'],
      datasets: ['LEHD LODES (US)', 'EU Census Hub commuter data', 'Strava Metro', 'mobile phone CDR'],
      examples: [
        'US LEHD LODES: 140M origin-destination work trip records enabling commute flow mapping for every census block in the US',
        'London TfL Oyster: OD matrix of 31M daily transit trips reconstructed from tap-in/tap-out records across 270 Tube stations',
        'Bogot\u00e1 Encuesta de Movilidad: 55 000 household travel diary OD pairs revealing 3.2M daily trips across 19 localities',
      ],
      prompts: [
        `import geopandas as gpd\nimport pandas as pd\nimport numpy as np\nfrom shapely.geometry import LineString, Point\n\n# Origin-Destination Flow Mapping\nnp.random.seed(42)\n\n# Simulated OD data (zone centroids + trip counts)\nzones = gpd.GeoDataFrame({\n    "zone_id": ["A", "B", "C", "D", "E"],\n    "zone_name": ["Downtown", "North", "South", "East", "West"],\n    "geometry": [Point(0,0), Point(0,5000), Point(0,-5000), Point(5000,0), Point(-5000,0)],\n    "population": [50000, 30000, 25000, 20000, 15000],\n}, crs="EPSG:32632")\n\n# OD matrix (trips per day)\nod_data = []\nfor i, o in zones.iterrows():\n    for j, d in zones.iterrows():\n        if i != j:\n            dist = o.geometry.distance(d.geometry)\n            trips = int(np.random.exponential(500) * (o["population"] * d["population"]) / 1e9)\n            if trips > 10:\n                od_data.append({\n                    "origin": o["zone_id"], "destination": d["zone_id"],\n                    "trips": trips,\n                    "geometry": LineString([o.geometry, d.geometry]),\n                })\n\nflows = gpd.GeoDataFrame(od_data, crs="EPSG:32632")\nflows["length_km"] = flows.geometry.length / 1000\n\nprint("=== OD Flow Summary ===")\nprint(f"Total OD pairs: {len(flows)}")\nprint(f"Total trips: {flows['trips'].sum():,}")\nprint(f"\\nTop 5 flows:")\nfor _, row in flows.nlargest(5, "trips").iterrows():\n    print(f"  {row['origin']} \u2192 {row['destination']}: {row['trips']:,} trips ({row['length_km']:.1f} km)")\n\n# Net balance per zone\noutbound = flows.groupby("origin")["trips"].sum()\ninbound = flows.groupby("destination")["trips"].sum()\nbalance = inbound.subtract(outbound, fill_value=0)\nprint(f"\\nNet balance (inbound - outbound):")\nfor zone, net in balance.items():\n    print(f"  {zone}: {net:+,.0f} trips ({'attractor' if net > 0 else 'generator'})")`,
      ],
      sdgAlignment: ['SDG 11.2'],
      evidence: [
        'Tobler, W. R. (1987). Experiments in Migration Mapping by Computer. The American Cartographer, 14(2), 155-163.',
        'Guo, D. (2009). Flow Mapping and Multivariate Visualization of Large Spatial Interaction Data. IEEE TVCG, 15(6), 1041-1048.',
      ],
      limitations:
        'Census commuter data captures only home-to-work trips — misses shopping, leisure, education. ' +
        'Mobile phone data has spatial imprecision (cell tower level) and demographic bias. ' +
        'Desire lines do not follow actual routes; route-mapped flows require a routing engine.',
    },
    {
      id: 'tn-transit-frequency',
      title: 'Transit Service Frequency Analysis',
      sectionId: 'transport_networks',
      summary:
        'Analyses GTFS scheduled service to compute headway (minutes between vehicles) by stop, route, ' +
        'and time-of-day. Service classification: high-frequency (< 10 min), frequent (10–15 min), ' +
        'standard (15–30 min), infrequent (> 30 min). Enables equity analysis by overlaying frequency with demographics.',
      tags: ['transit', 'equity', 'indicators'],
      methodology:
        '1. Parse GTFS feed with gtfs-kit: feed = gk.read_feed(path, dist_units="km").\n' +
        '2. Merge stop_times + trips + routes + calendar to get departures per stop per service day.\n' +
        '3. Define time periods: AM peak (7–9), midday (10–15), PM peak (16–18), evening (19–22), night (22–6).\n' +
        '4. For each stop and period: count departures, compute median headway.\n' +
        '5. Classify: < 10 min (high-frequency), 10–15 (frequent), 15–30 (standard), > 30 (infrequent).\n' +
        '6. Compute span of service: first departure to last departure per route.\n' +
        '7. Map stops colour-coded by AM-peak frequency.\n' +
        '8. Equity overlay: intersect stop buffers (400 m) with census tracts; compare frequency by income/race.\n' +
        '9. Identify frequency deserts: census tracts with no high-frequency service within 400 m.\n' +
        '10. Track changes over GTFS feed versions to detect service cuts or improvements.',
      tools: ['gtfs-kit', 'geopandas', 'pandas', 'h3-py', 'matplotlib'],
      datasets: ['GTFS feeds (Transitland, agency sites)', 'Census demographics'],
      examples: [
        'TransitCenter: GTFS frequency analysis of 50 largest US transit agencies showing only 28% of routes qualify as "frequent" (<15 min headway)',
        'Melbourne PTV: headway analysis of 5 000 stops revealing 35% of outer-suburban stops have >30 min peak headways vs 8 min inner-city average',
        'Bogot\u00e1 TransMilenio: GTFS analysis showing 2.5 min peak headways on trunk BRT vs 45 min on feeder routes affecting 2M daily riders',
      ],
      prompts: [
        `import pandas as pd\nimport numpy as np\n\n# Transit Frequency Analysis from GTFS\n# Simulated GTFS-like data\nnp.random.seed(42)\n\n# Simulated stop departures (normally from stop_times.txt + trips.txt)\nroutes = {\n    "Route 1 (BRT Trunk)": {"trips_am": 36, "trips_mid": 24, "trips_pm": 36, "trips_eve": 12},\n    "Route 2 (Urban Bus)": {"trips_am": 18, "trips_mid": 12, "trips_pm": 18, "trips_eve": 6},\n    "Route 3 (Suburban)": {"trips_am": 8, "trips_mid": 4, "trips_pm": 8, "trips_eve": 2},\n    "Route 4 (Express)": {"trips_am": 12, "trips_mid": 0, "trips_pm": 12, "trips_eve": 0},\n    "Route 5 (Night)": {"trips_am": 0, "trips_mid": 0, "trips_pm": 4, "trips_eve": 8},\n}\n\nperiods = {"am": (7, 9, 120), "mid": (10, 15, 300), "pm": (16, 18, 120), "eve": (19, 22, 180)}\n\ndef classify_headway(headway):\n    if headway <= 10: return "High-Frequency"\n    elif headway <= 15: return "Frequent"\n    elif headway <= 30: return "Standard"\n    else: return "Infrequent"\n\nprint("=== Transit Frequency Analysis ===")\nprint(f"{'Route':<25} {'AM Peak':>10} {'Midday':>10} {'PM Peak':>10} {'Evening':>10}")\nprint("-" * 70)\n\nfor route, trips in routes.items():\n    row = f"{route:<25}"\n    for period, (start, end, minutes) in periods.items():\n        n_trips = trips[f"trips_{period}"]\n        if n_trips >= 2:\n            headway = minutes / n_trips\n            cls = classify_headway(headway)\n            row += f" {headway:5.0f}m ({cls[:4]}.)"\n        else:\n            row += f" {'No svc':>10}"\n    print(row)\n\n# Span of service\nprint(f"\\nSpan of Service:")\nfor route, trips in routes.items():\n    active = [p for p, t in trips.items() if t > 0]\n    print(f"  {route}: {len(active)} periods active")`,
      ],
      evidence: [
        'Walker, J. (2012). Human Transit: How Clearer Thinking about Public Transit Can Enrich Our Communities and Our Lives. Island Press.',
        'Welch, T. F. & Mishra, S. (2013). A Measure of Equity for Public Transit Connectivity. JTEP, 47(2), 164-184.',
      ],
      limitations:
        'GTFS is scheduled service, not actual service — delays, cancellations, and driver behaviour are not captured. ' +
        'Not all agencies publish GTFS (especially in developing countries). ' +
        'Does not account for vehicle capacity or crowding.',
      sdgAlignment: ['SDG 11.2.1'],
    },
    {
      id: 'tn-complete-streets',
      title: 'Complete Streets Assessment',
      sectionId: 'transport_networks',
      summary:
        'Evaluates street cross-sections against the NACTO Urban Street Design Guide framework. ' +
        'Scores each street segment on accommodation of: pedestrians (sidewalk width, crossings), ' +
        'cyclists (bike lane type, buffer), transit (stop amenity, bus lane), vehicles (travel lanes, speed), ' +
        'green infrastructure (street trees, bioswales). Composite score identifies priority reconstruction corridors.',
      tags: ['pedestrian', 'cycling', 'transit', 'green_infra', 'indicators'],
      methodology:
        '1. Segment streets into analysis units (block-to-block segments from OSM).\n' +
        '2. Collect cross-section attributes from OSM tags: sidewalk, cycleway, lanes, maxspeed, lit, surface.\n' +
        '3. Score each dimension (0–5 scale):\n' +
        '   - Pedestrian: sidewalk presence×2, width > 1.8m, ADA ramps, crossing count per km.\n' +
        '   - Cyclist: cycleway type (separated > lane > sharrow > none), buffer width.\n' +
        '   - Transit: stop amenity (shelter, bench, RTPI), bus/tram lane presence.\n' +
        '   - Green: street tree presence (from OSM natural=tree_row or Google Street View), bioswale.\n' +
        '   - Safety: speed limit ≤ 30 km/h, traffic calming presence.\n' +
        '4. Composite: weighted average (equal or stakeholder-defined weights).\n' +
        '5. Map as colour-coded street network (red = poor, green = complete).\n' +
        '6. Prioritise: lowest-scoring segments on highest-traffic corridors.',
      tools: ['osmnx', 'geopandas', 'pandas', 'momepy'],
      datasets: ['OSM (highway, cycleway, sidewalk tags)', 'Google Street View (manual audit)', 'municipal asset databases'],
      examples: [
        'NACTO survey: complete streets redesign on NYC 9th Avenue showing 50% decrease in injuries and 49% increase in retail sales in first year',
        'Indianapolis Cultural Trail: complete street scoring showing $1B in economic development along 8-mile cultural trail corridor',
        'Seattle SDOT: scoring of 4 800 street segments on 6 dimensions informing $930M Move Seattle levy prioritization',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport pandas as pd\nimport numpy as np\n\n# Complete Streets Assessment\nplace = "Bern, Switzerland"\nG = ox.graph_from_place(place, network_type="all")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\nprint(f"Network: {len(edges):,} segments")\n\n# Score each dimension from OSM tags\ndef score_pedestrian(row):\n    score = 0\n    if row.get("sidewalk") not in [None, "no", "none"]: score += 2\n    if row.get("lit") == "yes": score += 1\n    if row.get("crossing") is not None: score += 1\n    maxspeed = float(row.get("maxspeed", 50) or 50)\n    if maxspeed <= 30: score += 1\n    return min(score, 5)\n\ndef score_cycling(row):\n    cycleway = row.get("cycleway", None)\n    if cycleway in ["track", "separate"]: return 5\n    elif cycleway in ["lane"]: return 3\n    elif cycleway in ["shared_lane", "sharrow"]: return 1\n    return 0\n\ndef score_green(row):\n    score = 0\n    if row.get("tree_lined") == "yes" or "tree" in str(row.get("natural", "")): score += 3\n    if row.get("surface") in ["asphalt", "paved"]: score += 1\n    return min(score, 5)\n\n# Apply scoring\nedges["ped_score"] = edges.apply(score_pedestrian, axis=1)\nedges["bike_score"] = edges.apply(score_cycling, axis=1)\nedges["green_score"] = edges.apply(score_green, axis=1)\nedges["composite"] = (edges["ped_score"] + edges["bike_score"] + edges["green_score"]) / 3\n\nprint(f"\\n=== Complete Streets Scores ===")\nfor dim in ["ped_score", "bike_score", "green_score", "composite"]:\n    print(f"  {dim}: mean={edges[dim].mean():.1f}, min={edges[dim].min()}, max={edges[dim].max()}")\n\n# Priority corridors: lowest composite on longest segments\nedges["priority"] = (5 - edges["composite"]) * edges["length"]\ntop = edges.nlargest(5, "priority")\nprint(f"\\nTop 5 priority corridors for improvement:")\nfor _, row in top.iterrows():\n    name = row.get("name", "unnamed")\n    print(f"  {name}: composite={row['composite']:.1f}/5, length={row['length']:.0f}m")`,
      ],
      evidence: [
        'NACTO (2013). Urban Street Design Guide. National Association of City Transportation Officials.',
        'Smart Growth America (2022). The Best Complete Streets Policies. https://smartgrowthamerica.org/',
      ],
      limitations:
        'OSM cross-section attribute completeness varies enormously — many cities lack sidewalk/cycleway tags. ' +
        'Scoring weights are subjective — different stakeholders prioritise differently. ' +
        'Does not capture maintenance quality (pothole-free ≠ well-designed).',
    },
    {
      id: 'tn-cycling-connectivity',
      title: 'Cycling Network Connectivity',
      sectionId: 'transport_networks',
      summary:
        'Evaluates the cycling network using Level of Traffic Stress (LTS) classification (Mekuria et al. 2012). ' +
        'LTS 1: suitable for children (separated bike lanes, low-speed residential streets). ' +
        'LTS 2: comfortable for most adults. LTS 3: experienced cyclists. LTS 4: strong and fearless only. ' +
        'Connected low-stress network analysis identifies islands and gaps requiring infrastructure investment.',
      tags: ['cycling', 'network_analysis', 'mobility', 'indicators'],
      methodology:
        '1. Download street network with OSMnx (network_type="bike" or "all").\n' +
        '2. Classify each edge by LTS using OSM attributes:\n' +
        '   - LTS 1: cycleway=track/path, maxspeed ≤ 25 km/h residential.\n' +
        '   - LTS 2: cycleway=lane with buffer, maxspeed ≤ 40 km/h.\n' +
        '   - LTS 3: cycleway=lane no buffer, maxspeed ≤ 50 km/h, ≤ 2 lanes.\n' +
        '   - LTS 4: no facility, maxspeed > 50 km/h or > 2 lanes.\n' +
        '3. Build LTS-filtered subgraphs: G_lts1 (edges LTS ≤ 1), G_lts2 (≤ 2), etc.\n' +
        '4. Find connected components in each subgraph.\n' +
        '5. Identify the largest connected component — "bikeable island.".\n' +
        '6. Identify gap edges: LTS 3–4 edges connecting two LTS ≤ 2 components.\n' +
        '7. Rank gaps by betweenness centrality in the full graph.\n' +
        '8. Map: colour edges by LTS, highlight gaps as dashed red.\n' +
        '9. Compute % of population within 400 m of LTS ≤ 2 network.',
      tools: ['osmnx', 'networkx', 'geopandas', 'momepy'],
      datasets: ['OSM (highway, cycleway, maxspeed, lanes)', 'Strava Metro (revealed cycling routes)'],
      examples: [
        'Portland PBOT: LTS analysis of 5 600 km network showing only 35% at LTS \u22642, identifying 120 gap segments for $50M bike plan',
        'Copenhagen: cycling network connectivity analysis showing 94% of residents within 250m of LTS 1 infrastructure (separated cycle tracks)',
        'Bogot\u00e1 CicloRuta: 550 km bike network LTS audit revealing 78% at LTS \u22642 but 22% high-stress gaps fragmenting east-west connectivity',
      ],
      prompts: [
        `import osmnx as ox\nimport networkx as nx\nimport geopandas as gpd\nimport numpy as np\n\n# Level of Traffic Stress (LTS) Analysis\nplace = "Bern, Switzerland"\nG = ox.graph_from_place(place, network_type="bike")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\nprint(f"Cycling network: {len(edges):,} segments")\n\n# Classify each edge by LTS\ndef classify_lts(row):\n    cycleway = str(row.get("cycleway", ""))\n    highway = str(row.get("highway", ""))\n    maxspeed = row.get("maxspeed", None)\n    try: speed = float(maxspeed)\n    except: speed = 50\n    lanes = row.get("lanes", None)\n    try: n_lanes = int(lanes)\n    except: n_lanes = 2\n    \n    if cycleway in ["track", "separate", "path"] or highway in ["cycleway", "path"]:\n        return 1\n    elif speed <= 30 and highway in ["residential", "living_street"]:\n        return 1\n    elif cycleway == "lane" and speed <= 40:\n        return 2\n    elif speed <= 50 and n_lanes <= 2:\n        return 3\n    else:\n        return 4\n\nedges["lts"] = edges.apply(classify_lts, axis=1)\n\n# Distribution\nprint(f"\\n=== LTS Distribution ===")\nfor lts in [1, 2, 3, 4]:\n    labels = {1: "All ages (separated)", 2: "Most adults", 3: "Experienced", 4: "Strong & fearless"}\n    n = (edges["lts"] == lts).sum()\n    length = edges[edges["lts"] == lts]["length"].sum() / 1000\n    print(f"  LTS {lts} ({labels[lts]}): {n:,} segments, {length:.1f} km")\n\n# Connected component analysis for low-stress network\nG_low = G_proj.copy()\nhigh_stress_edges = [(u, v, k) for u, v, k, d in G_proj.edges(keys=True, data=True)\n                     if edges.loc[(u, v, k), "lts"] > 2] if hasattr(edges.index, 'names') else []\n\n# Simplified: filter edges\nlow_stress = edges[edges["lts"] <= 2]\npct_low = len(low_stress) / len(edges) * 100\nprint(f"\\nLow-stress (LTS \u22642): {pct_low:.1f}% of segments")\nprint(f"Low-stress length: {low_stress['length'].sum()/1000:.1f} km")`,
      ],
      evidence: [
        'Mekuria, M. C., Furth, P. G., & Nixon, H. (2012). Low-Stress Bicycling and Network Connectivity. MTI Report 11-19.',
        'Dill, J. & McNeil, N. (2016). Revisiting the Four Types of Cyclists. Transportation Research Record, 2587, 90-99.',
      ],
      limitations:
        'OSM cycleway tagging is inconsistent across cities — manual verification advisable. ' +
        'LTS thresholds were calibrated for North American conditions; adaptation needed elsewhere. ' +
        'Does not capture surface quality, lighting, or subjective safety perception.',
      sdgAlignment: ['SDG 11.2'],
    },
    {
      id: 'tn-pedestrian-quality',
      title: 'Pedestrian Route Quality',
      sectionId: 'transport_networks',
      summary:
        'Assesses walking environment quality beyond network connectivity. Dimensions: slope gradient, ' +
        'shade/canopy cover (GreenViewIndex from Google Street View imagery), building enclosure (street wall continuity), ' +
        'perceived safety (lighting, eyes on the street), surface quality, and crossing frequency. ' +
        'Produces a composite walkability quality score per street segment.',
      tags: ['pedestrian', 'health', 'green_infra', 'indicators'],
      methodology:
        '1. Segment pedestrian network (sidewalks from OSM, or all streets if sidewalk data unavailable).\n' +
        '2. Slope: derive from DEM. Classify: < 3 % flat, 3–5 % moderate, 5–8 % steep, > 8 % barrier.\n' +
        '3. GreenViewIndex (GVI): sample Google Street View images along route (every 50 m), ' +
        'classify green pixels using HSV colour thresholding. GVI = green_pixels / total_pixels.\n' +
        '4. Building enclosure: building frontage length / segment length. > 0.7 = good enclosure.\n' +
        '5. Lighting: OSM highway=street_lamp density per 100 m.\n' +
        '6. Surface: OSM surface tag (asphalt/paved = good, unpaved/gravel = poor).\n' +
        '7. Crossing frequency: count crossing nodes per km.\n' +
        '8. Normalise each dimension [0, 1]; composite = weighted average.\n' +
        '9. Map as segment-level walkability quality index.\n' +
        '10. Identify worst segments on high-pedestrian-demand routes (near schools, transit stops).',
      tools: ['osmnx', 'geopandas', 'rasterio (DEM)', 'google-streetview (API)', 'opencv-python (GVI)'],
      datasets: ['OSM pedestrian network', 'DEM (SRTM/LiDAR)', 'Google Street View Static API'],
      examples: [
        'Jan Gehl Copenhagen: pedestrian quality audit on 68 streets correlating enclosure ratio (r=0.71) and GVI (r=0.63) with pedestrian counts',
        'MIT Treepedia: GVI computation from Google Street View for 27 major cities showing Singapore (29.3%) vs Paris (8.8%) canopy differences',
        'Melbourne: walkability quality index across 15 000 segments informing $200M pedestrian improvement programme prioritization',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Pedestrian Route Quality Assessment\nplace = "Old Town, Zurich, Switzerland"\nG = ox.graph_from_place(place, network_type="walk")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\nprint(f"Pedestrian network: {len(edges):,} segments")\n\n# Score dimensions (simplified from OSM tags)\ndef score_walkability(row):\n    scores = {}\n    \n    # Surface quality\n    surface = str(row.get("surface", "unknown"))\n    scores["surface"] = 1.0 if surface in ["asphalt", "paved", "concrete"] else 0.5 if surface in ["cobblestone", "sett"] else 0.2\n    \n    # Lighting\n    scores["lighting"] = 1.0 if row.get("lit") == "yes" else 0.3\n    \n    # Width proxy (highway type)\n    highway = str(row.get("highway", ""))\n    scores["width"] = 1.0 if highway in ["pedestrian", "footway"] else 0.7 if highway in ["residential", "living_street"] else 0.4\n    \n    # Speed (lower = safer for pedestrians)\n    try: speed = float(row.get("maxspeed", 50))\n    except: speed = 50\n    scores["safety"] = 1.0 if speed <= 20 else 0.7 if speed <= 30 else 0.3\n    \n    return scores\n\nscores_list = edges.apply(score_walkability, axis=1).tolist()\nfor dim in ["surface", "lighting", "width", "safety"]:\n    edges[dim] = [s[dim] for s in scores_list]\n\nedges["quality_index"] = edges[["surface", "lighting", "width", "safety"]].mean(axis=1)\n\nprint(f"\\n=== Walkability Quality Index ===")\nfor dim in ["surface", "lighting", "width", "safety", "quality_index"]:\n    print(f"  {dim}: mean={edges[dim].mean():.2f}")\n\n# Priority: worst quality on longest segments\nedges["improvement_priority"] = (1 - edges["quality_index"]) * edges["length"]\ntop = edges.nlargest(5, "improvement_priority")\nprint(f"\\nTop 5 segments needing improvement:")\nfor _, row in top.iterrows():\n    name = row.get("name", "unnamed")\n    print(f"  {name}: quality={row['quality_index']:.2f}, length={row['length']:.0f}m")`,
      ],
      evidence: [
        'Ewing, R. & Handy, S. (2009). Measuring the Unmeasurable: Urban Design Qualities Related to Walkability. J. Urban Design, 14(1), 65-84.',
        'Li, X. et al. (2015). Assessing Street-Level Urban Greenery Using Google Street View and a Modified Green View Index. Urban Forestry & Urban Greening, 14, 675-685.',
      ],
      limitations:
        'Google Street View coverage is incomplete (missing alleys, informal paths, developing-country pedestrian ways). ' +
        'GVI varies by season (leaf-on vs leaf-off); temporal consistency needed. ' +
        'Perceived safety is subjective and not fully captured by physical attributes.',
      sdgAlignment: ['SDG 11.7'],
    },
    {
      id: 'tn-parking-supply',
      title: 'Parking Supply Analysis',
      sectionId: 'transport_networks',
      summary:
        'Inventories and maps parking supply by type (on-street, surface lot, structured garage) and regulation ' +
        '(metered, time-limited, permit, free). Computes parking ratio (spaces per dwelling unit or per 1000 sq ft commercial). ' +
        'Supports transition from minimum to maximum parking policies and parking demand management.',
      tags: ['mobility', 'land_use', 'indicators'],
      methodology:
        '1. Inventory on-street parking: OSM amenity=parking tags, or extract from kerb-line data.\n' +
        '2. Inventory off-street: OSM amenity=parking (surface) and parking=multi-storey. Add capacity from tags or estimation.\n' +
        '3. Estimate on-street capacity: segment length / (6 m per parallel space, 3.5 m per perpendicular).\n' +
        '4. Geocode and attribute: type, capacity, regulation, pricing, hours.\n' +
        '5. Compute parking ratio per block/TAZ: total_spaces / (dwelling_units or commercial_sqft).\n' +
        '6. Compare to policy thresholds: minimum (conventional zoning) vs maximum (progressive policy).\n' +
        '7. Occupancy analysis: if turnover data available, compute peak occupancy rate.\n' +
        '8. Map: point layer (lots/garages) + line layer (on-street segments), colour by occupancy or type.\n' +
        '9. Identify oversupply zones (candidates for lot repurposing) and undersupply zones.',
      tools: ['osmnx', 'geopandas', 'pandas', 'shapely'],
      datasets: ['OSM (amenity=parking)', 'municipal parking authority data', 'ParkAPI / SpotAngels'],
      examples: [
        'Shoup UCLA study: off-street parking inventory of downtown Los Angeles revealing 3.3 spaces per car — 60% oversupply contributing to sprawl',
        'Ghent parking plan: systematic inventory of 45 000 parking spaces leading to 30% reduction policy freeing 12 hectares for public space',
        'SFpark: sensor-based occupancy data for 8 200 metered spaces enabling demand-responsive pricing reducing cruising by 30%',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Parking Supply Analysis\nplace = "Bern, Switzerland"\n\n# Get parking facilities from OSM\nparking = ox.features_from_place(place, tags={"amenity": "parking"})\nif len(parking) > 0:\n    parking = parking[["geometry", "name", "parking", "capacity"]].copy()\n    parking = parking.to_crs(epsg=32632)\n    \n    print(f"=== Parking Inventory ===")\n    print(f"Total facilities: {len(parking)}")\n    \n    # Classify by type\n    for ptype in parking["parking"].dropna().unique():\n        n = (parking["parking"] == ptype).sum()\n        print(f"  {ptype}: {n}")\n    \n    # Capacity analysis\n    has_capacity = parking["capacity"].notna()\n    if has_capacity.any():\n        cap = parking.loc[has_capacity, "capacity"].astype(float)\n        print(f"\\nCapacity (where tagged):")\n        print(f"  Facilities with data: {has_capacity.sum()}/{len(parking)}")\n        print(f"  Total spaces: {cap.sum():,.0f}")\n        print(f"  Mean per facility: {cap.mean():.0f}")\n    \n    # Density\n    hull = parking.unary_union.convex_hull\n    area_km2 = hull.area / 1e6\n    print(f"\\nDensity: {len(parking)/area_km2:.1f} facilities per km\u00b2")\nelse:\n    print("No parking data in OSM for this area")\n\n# On-street estimation from road segments\nedges = ox.graph_to_gdfs(ox.project_graph(ox.graph_from_place(place, network_type="drive")))[1]\nresidential = edges[edges["highway"].isin(["residential", "living_street"])]\ntotal_length = residential["length"].sum()\nspaces_per_m = 1 / 6  # 1 parallel space per 6m\nest_spaces = int(total_length * spaces_per_m * 2)  # both sides\nprint(f"\\nEstimated on-street spaces: {est_spaces:,} ({total_length/1000:.0f} km residential road)")`,
      ],
      sdgAlignment: ['SDG 11.2', 'SDG 11.6'],
      evidence: [
        'Shoup, D. (2005). The High Cost of Free Parking. APA Planners Press.',
        'Willson, R. (2015). Parking Management for Smart Growth. Island Press.',
      ],
      limitations:
        'OSM parking data is highly incomplete in most cities. ' +
        'Capacity estimation from segment length is approximate — actual supply depends on kerb cuts, hydrants, driveways. ' +
        'Occupancy data requires field surveys or sensor data.',
    },
    {
      id: 'tn-freight-logistics',
      title: 'Freight & Logistics Network',
      sectionId: 'transport_networks',
      summary:
        'Analyses the urban freight network: designated truck routes, loading zone distribution, last-mile access corridors, ' +
        'and conflict points with pedestrian/cycling infrastructure. Supports freight traffic management, ' +
        'off-hour delivery policies, and micro-hub siting.',
      tags: ['mobility', 'economic', 'network_analysis'],
      methodology:
        '1. Extract truck-permitted roads from OSM: highway=* with hgv=yes or maxweight tags.\n' +
        '2. Identify industrial/commercial zones from land-use data (trip generators).\n' +
        '3. Map loading zones from OSM (amenity=loading_dock) or municipal data.\n' +
        '4. Compute truck route coverage: % of commercial zones within 500 m of designated truck route.\n' +
        '5. Identify conflict zones: truck routes overlapping school zones, pedestrian precincts, bike lanes.\n' +
        '6. Network analysis: shortest truck path from port/highway interchange to industrial zones.\n' +
        '7. Siting analysis for micro-hubs: candidate locations minimising last-mile distance to delivery addresses.\n' +
        '8. Map: truck route network, loading zone density, conflict hotspots.\n' +
        '9. Time-of-day analysis: identify peak truck movement hours from traffic count data.',
      tools: ['osmnx', 'networkx', 'geopandas', 'pandana'],
      datasets: ['OSM (hgv, maxweight, loading)', 'municipal truck route maps', 'freight traffic counts'],
      examples: [
        'NYC DOT: freight network analysis identifying 73 000 daily truck trips across 5 boroughs with 40% of deliveries on non-designated routes',
        'London Freight Consolidation: micro-hub siting analysis reducing last-mile van trips by 68% in central London pilot area',
        'Hamburg smartPORT: freight network optimization using real-time vessel and truck tracking across 7 200-hectare port area',
      ],
      prompts: [
        `import osmnx as ox\nimport geopandas as gpd\nimport numpy as np\n\n# Freight Network Analysis\nplace = "Zurich, Switzerland"\nG = ox.graph_from_place(place, network_type="drive")\nG_proj = ox.project_graph(G)\nnodes, edges = ox.graph_to_gdfs(G_proj)\n\n# Identify truck-accessible roads\ndef is_truck_route(row):\n    hgv = str(row.get("hgv", ""))\n    highway = str(row.get("highway", ""))\n    if hgv == "yes" or hgv == "designated":\n        return "designated"\n    elif highway in ["motorway", "trunk", "primary"]:\n        return "major_road"\n    elif hgv == "no" or highway in ["residential", "living_street"]:\n        return "restricted"\n    return "unknown"\n\nedges["truck_access"] = edges.apply(is_truck_route, axis=1)\n\nprint("=== Freight Network Analysis ===")\nfor cat in ["designated", "major_road", "restricted", "unknown"]:\n    n = (edges["truck_access"] == cat).sum()\n    length = edges[edges["truck_access"] == cat]["length"].sum() / 1000\n    print(f"  {cat}: {n:,} segments, {length:.1f} km")\n\n# Industrial/commercial POIs as trip generators\ntry:\n    industrial = ox.features_from_place(place, tags={"landuse": ["industrial", "commercial"]})\n    industrial = industrial[industrial.geometry.type.isin(["Polygon", "MultiPolygon"])].to_crs(epsg=32632)\n    print(f"\\nFreight generators: {len(industrial)} industrial/commercial zones")\n    print(f"Total area: {industrial.geometry.area.sum()/1e6:.1f} km\u00b2")\nexcept:\n    print("\\nNo industrial/commercial zones found in OSM")\n\n# Loading zones\ntry:\n    loading = ox.features_from_place(place, tags={"amenity": "loading_dock"})\n    print(f"Loading docks: {len(loading)}")\nexcept:\n    print("Loading docks: 0 (not tagged in OSM)")`,
      ],
      sdgAlignment: ['SDG 9.1', 'SDG 11.6'],
      evidence: [
        'Dablanc, L. (2007). Goods Transport in Large European Cities: Difficult to Organise, Difficult to Modernise. Transportation Research Part A, 41(3), 280-285.',
        'Holguín-Veras, J. et al. (2011). Overall Impacts of Off-Hour Delivery Programs in New York City. Transportation Research Record, 2238, 68-76.',
      ],
      limitations:
        'Truck route designation data is rarely in OSM — municipal GIS required. ' +
        'Last-mile logistics are changing rapidly (drones, cargo bikes) — static analysis has short shelf life. ' +
        'Freight volume data is proprietary and hard to obtain.',
    },
    {
      id: 'tn-multimodal-trip-chain',
      title: 'Multi-Modal Trip Chaining',
      sectionId: 'transport_networks',
      summary:
        'Builds a unified multimodal network combining walking, cycling, public transit (GTFS), and driving ' +
        'to compute realistic door-to-door travel times. Uses R5 (Rapid Realistic Routing on Real-world and ' +
        'Reimagined networks) or OpenTripPlanner for departure-time-dependent transit routing.',
      tags: ['transit', 'accessibility', 'mobility', 'network_analysis'],
      methodology:
        '1. Prepare inputs: OSM PBF (street network), GTFS zip (transit schedules).\n' +
        '2. Build multimodal network with r5py:\n' +
        '   transport_network = r5py.TransportNetwork(osm_pbf, [gtfs_zip]).\n' +
        '3. Define origins and destinations (e.g., residential centroids → employment centres).\n' +
        '4. Compute travel time matrix:\n' +
        '   ttm = r5py.TravelTimeMatrixComputer(transport_network, origins, destinations, ' +
        '   departure=datetime(2024,3,15,8,0), departure_time_window=timedelta(hours=1), ' +
        '   transport_modes=[r5py.TransportMode.TRANSIT, r5py.TransportMode.WALK]).\n' +
        '5. Result: median travel time per OD pair across departure-time window (accounts for schedule variability).\n' +
        '6. Compute accessibility: for each origin, count destinations reachable within 30/45/60 min.\n' +
        '7. Compare modes: transit vs car travel time to identify transit competitiveness.\n' +
        '8. Map accessibility surface as hexagonal grid (h3-py).',
      tools: ['r5py', 'geopandas', 'h3-py', 'pandas', 'osmnx'],
      datasets: ['OSM PBF', 'GTFS feeds', 'census data (origins)', 'employment data (destinations)'],
      examples: [
        'Access to Opportunities Project (IPEA Brazil): r5py multimodal accessibility for 20 Brazilian cities revealing transit reaches 10-50% of jobs in 60 min',
        'Minneapolis Met Council: R5-based accessibility showing 30-min transit access to jobs dropped 22% during COVID service cuts affecting 200K riders',
        'Helsinki Region Transport: multi-modal comparison showing transit competitive with car (<1.5x travel time) for only 35% of OD pairs despite high investment',
      ],
      prompts: [
        `# Multi-modal trip chaining with r5py\n# Requires: Java 11+, OSM PBF file, GTFS zip\n# pip install r5py\n\nimport geopandas as gpd\nimport pandas as pd\nimport numpy as np\nfrom shapely.geometry import Point\n# import r5py\n# from datetime import datetime, timedelta\n\n# Example setup (commented out - requires data files)\n# transport_network = r5py.TransportNetwork(\n#     "city.osm.pbf",\n#     ["gtfs_feed.zip"]\n# )\n\n# Simulated multi-modal accessibility analysis\nnp.random.seed(42)\nn_origins = 50\nn_destinations = 20\n\norigins = gpd.GeoDataFrame({\n    "id": range(n_origins),\n    "geometry": [Point(np.random.uniform(28.9, 29.1), np.random.uniform(41.0, 41.1)) for _ in range(n_origins)],\n    "population": np.random.randint(1000, 10000, n_origins),\n}, crs="EPSG:4326")\n\ndestinations = gpd.GeoDataFrame({\n    "id": range(n_destinations),\n    "geometry": [Point(np.random.uniform(28.9, 29.1), np.random.uniform(41.0, 41.1)) for _ in range(n_destinations)],\n    "jobs": np.random.randint(500, 5000, n_destinations),\n}, crs="EPSG:4326")\n\n# Simulated travel time matrix (normally from r5py)\ntt_transit = np.random.uniform(15, 90, (n_origins, n_destinations))\ntt_car = tt_transit * np.random.uniform(0.3, 0.8, (n_origins, n_destinations))\n\n# Accessibility: jobs reachable within 45 min\nthreshold = 45  # minutes\nfor mode, tt_matrix in [("Transit", tt_transit), ("Car", tt_car)]:\n    reachable_jobs = np.zeros(n_origins)\n    for i in range(n_origins):\n        mask = tt_matrix[i] <= threshold\n        reachable_jobs[i] = destinations.loc[mask, "jobs"].sum()\n    \n    print(f"\\n=== {mode} Accessibility (\u2264{threshold} min) ===")\n    print(f"Mean jobs reachable: {reachable_jobs.mean():,.0f}")\n    print(f"Min: {reachable_jobs.min():,.0f}")\n    print(f"Max: {reachable_jobs.max():,.0f}")\n    pop_weighted = np.average(reachable_jobs, weights=origins["population"])\n    print(f"Population-weighted mean: {pop_weighted:,.0f}")\n\n# Transit competitiveness ratio\nratio = tt_transit / (tt_car + 0.1)\ncompetitive = (ratio < 1.5).mean() * 100\nprint(f"\\nTransit competitive (<1.5x car): {competitive:.1f}% of OD pairs")`,
      ],
      evidence: [
        'Conway, M. W., Byrd, A., & van der Linden, M. (2017). Evidence-Based Transit and Land Use Sketch Planning Using Interactive Accessibility Methods on Combined Schedule and Headway-Based Networks. TRR, 2653, 45-53.',
        'Pereira, R. H. M. et al. (2021). r5r: Rapid Realistic Routing on Multimodal Transport Networks with R5 in R. Findings, March 2021.',
      ],
      limitations:
        'R5 requires Java runtime and significant memory for large networks. ' +
        'GTFS quality issues (invalid feeds) can crash the router. ' +
        'Does not account for real-time delays, crowding, or fare barriers. ' +
        'Cycling on transit (bike + transit chain) requires careful mode transfer configuration.',
      sdgAlignment: ['SDG 11.2'],
    },
  ];

  if (existing) {
    return cards.filter(c => !existing.has(c.id));
  }
  return cards;
}
