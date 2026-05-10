// Template: Street Network Centrality Analysis
// Exported as a string constant for embedding in the ScriptTemplates UI

export const NETWORK_ANALYSIS = `#!/usr/bin/env python3
"""
Street Network Centrality Analysis
====================================
Compute betweenness and closeness centrality on the urban street network
using OSMnx and NetworkX. Identifies critical corridors and connectivity
bottlenecks.

Dependencies: osmnx, networkx, geopandas, matplotlib, numpy, pandas
Usage: Configure the PARAMS section below, then run the entire script.

Output: Centrality maps (betweenness & closeness) + network statistics.

References:
  - Freeman, L. (1977). A set of measures of centrality based on betweenness.
  - Boeing, G. (2017). OSMnx: New methods for acquiring, constructing, analyzing,
    and visualizing complex street networks. Computers, Environment and Urban Systems.
"""

import warnings
warnings.filterwarnings("ignore")

# ── Configuration ──────────────────────────────────────────────────
PARAMS = {
    # Study area
    "place": "Manhattan, New York, USA",
    # Network type: drive, walk, bike, all
    "network_type": "drive",
    # Weight attribute for shortest paths: "length" (meters) or "travel_time"
    "weight": "length",
    # Number of top-N edges to highlight
    "top_n_edges": 50,
    # Betweenness: use k-sample approximation for large networks (None = exact)
    "betweenness_k": 500,
    # Output
    "output_dir": "./output",
    "dpi": 150,
}

# ── Imports ────────────────────────────────────────────────────────
import os
import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
import osmnx as ox
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
import matplotlib.cm as cm

# ── Step 1: Download street network ───────────────────────────────
print("Step 1: Downloading street network...")
G = ox.graph_from_place(PARAMS["place"], network_type=PARAMS["network_type"])
G = ox.add_edge_speeds(G)
G = ox.add_edge_travel_times(G)
print(f"  Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")

# ── Step 2: Basic network metrics ─────────────────────────────────
print("Step 2: Computing basic network metrics...")
stats = ox.basic_stats(G)
print(f"  Total edge length: {stats['edge_length_total'] / 1000:.1f} km")
print(f"  Average edge length: {stats['edge_length_avg']:.1f} m")
print(f"  Intersection count: {stats['intersection_count']}")
print(f"  Street density: {stats['edge_density_km']:.2f} km/km²")
print(f"  Node density: {stats['node_density_km']:.1f} nodes/km²")
print(f"  Average circuity: {stats.get('circuity_avg', 'N/A')}")

# ── Step 3: Betweenness centrality ────────────────────────────────
print("Step 3: Computing edge betweenness centrality...")
G_undirected = ox.convert.to_undirected(G)

bc = nx.edge_betweenness_centrality(
    G_undirected,
    weight=PARAMS["weight"],
    k=PARAMS["betweenness_k"],
)

# Assign to edges
nx.set_edge_attributes(G, 0.0, "betweenness")
for (u, v), val in bc.items():
    if G.has_edge(u, v):
        for key in G[u][v]:
            G[u][v][key]["betweenness"] = val
    if G.has_edge(v, u):
        for key in G[v][u]:
            G[v][u][key]["betweenness"] = val

bc_values = [d.get("betweenness", 0) for _, _, d in G.edges(data=True)]
print(f"  Max betweenness: {max(bc_values):.6f}")
print(f"  Mean betweenness: {np.mean(bc_values):.6f}")
print(f"  Std: {np.std(bc_values):.6f}")

# ── Step 4: Closeness centrality (node-level) ─────────────────────
print("Step 4: Computing node closeness centrality...")
cc = nx.closeness_centrality(G_undirected, distance=PARAMS["weight"])
nx.set_node_attributes(G, cc, "closeness")

cc_values = list(cc.values())
print(f"  Max closeness: {max(cc_values):.6f}")
print(f"  Mean closeness: {np.mean(cc_values):.6f}")

# ── Step 5: Connectivity metrics ──────────────────────────────────
print("Step 5: Computing connectivity metrics...")
nodes_gdf, edges_gdf = ox.graph_to_gdfs(G)

n = G_undirected.number_of_nodes()
m = G_undirected.number_of_edges()

alpha = (m - n + 1) / (2 * n - 5) if n > 2 else 0  # Circuit ratio
beta_val = m / n if n > 0 else 0                       # Link-node ratio
gamma = m / (3 * (n - 2)) if n > 2 else 0              # Max connectivity

print(f"  Alpha (circuit): {alpha:.4f}")
print(f"  Beta (link/node): {beta_val:.4f}")
print(f"  Gamma (max connectivity): {gamma:.4f}")

dead_ends = sum(1 for _, d in G.degree() if d == 1)
print(f"  Dead-end nodes: {dead_ends} ({dead_ends / n * 100:.1f}%)")

# ── Step 6: Generate betweenness centrality map ───────────────────
print("\\nStep 6: Generating betweenness centrality map...")
os.makedirs(PARAMS["output_dir"], exist_ok=True)

fig, ax = plt.subplots(figsize=(14, 14))
edges_gdf["betweenness"] = [
    G[u][v][k].get("betweenness", 0)
    for u, v, k in G.edges(keys=True)
]

norm = Normalize(vmin=0, vmax=edges_gdf["betweenness"].quantile(0.95))
cmap_bc = cm.hot_r

edges_gdf.plot(
    column="betweenness",
    cmap=cmap_bc,
    norm=norm,
    linewidth=edges_gdf["betweenness"].apply(lambda x: 0.3 + x * 500).clip(0.3, 5),
    ax=ax,
    alpha=0.8,
)
ax.set_title(f"Edge Betweenness Centrality — {PARAMS['place']}", fontsize=14, fontweight="bold")
ax.set_axis_off()
fig.tight_layout()
fig.savefig(os.path.join(PARAMS["output_dir"], "betweenness_map.png"), dpi=PARAMS["dpi"])
plt.close(fig)

# ── Step 7: Generate closeness centrality map ─────────────────────
print("Step 7: Generating closeness centrality map...")
fig2, ax2 = plt.subplots(figsize=(14, 14))
nodes_gdf["closeness"] = nodes_gdf.index.map(cc)

nodes_gdf.plot(
    column="closeness",
    cmap="YlOrRd",
    markersize=2,
    alpha=0.7,
    ax=ax2,
    legend=True,
    legend_kwds={"label": "Closeness Centrality", "shrink": 0.6},
)
ax2.set_title(f"Node Closeness Centrality — {PARAMS['place']}", fontsize=14, fontweight="bold")
ax2.set_axis_off()
fig2.tight_layout()
fig2.savefig(os.path.join(PARAMS["output_dir"], "closeness_map.png"), dpi=PARAMS["dpi"])
plt.close(fig2)

# ── Step 8: Export results ────────────────────────────────────────
print("Step 8: Exporting results...")
edges_out = edges_gdf[["geometry", "betweenness"]].copy()
edges_out.to_file(os.path.join(PARAMS["output_dir"], "betweenness.geojson"), driver="GeoJSON")

nodes_out = nodes_gdf[["geometry", "closeness"]].copy()
nodes_out.to_file(os.path.join(PARAMS["output_dir"], "closeness.geojson"), driver="GeoJSON")

bridge_result = {
    "analysis": "street_network_centrality",
    "place": PARAMS["place"],
    "nodes": n,
    "edges": m,
    "total_length_km": round(stats["edge_length_total"] / 1000, 1),
    "alpha": round(alpha, 4),
    "beta": round(beta_val, 4),
    "gamma": round(gamma, 4),
    "dead_end_ratio": round(dead_ends / n, 4) if n > 0 else 0,
    "max_betweenness": round(float(max(bc_values)), 6),
    "mean_betweenness": round(float(np.mean(bc_values)), 6),
    "max_closeness": round(float(max(cc_values)), 6),
    "mean_closeness": round(float(np.mean(cc_values)), 6),
}

print("\\n✓ Analysis complete. Outputs saved to:", PARAMS["output_dir"])
`;
