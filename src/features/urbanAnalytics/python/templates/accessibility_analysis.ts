// Template: 15-Minute City Walkability Analysis
// Exported as a string constant for embedding in the ScriptTemplates UI

export const ACCESSIBILITY_ANALYSIS = `#!/usr/bin/env python3
"""
15-Minute City Walkability Analysis
====================================
Analyzes walking accessibility to essential urban amenities using network-based
travel time computation. Implements the 15-minute city framework (Moreno et al. 2021).

Dependencies: osmnx, pandana, geopandas, matplotlib, numpy, pandas
Usage: Configure the PARAMS section below, then run the entire script.

Output: Accessibility score map + summary statistics + bar chart.
"""

import warnings
warnings.filterwarnings("ignore")

# ── Configuration ──────────────────────────────────────────────────
PARAMS = {
    # Study area: place name (geocoded) or bounding box
    "place": "Barcelona, Spain",
    # Walking speed in km/h (average pedestrian)
    "walk_speed_kmh": 4.5,
    # Maximum walk time in minutes (15-min city threshold)
    "max_walk_min": 15,
    # Network type for OSMnx
    "network_type": "walk",
    # Amenity categories and their OSM tags
    "amenity_categories": {
        "grocery": {"shop": ["supermarket", "convenience", "grocery"]},
        "education": {"amenity": ["school", "kindergarten"]},
        "healthcare": {"amenity": ["hospital", "clinic", "pharmacy"]},
        "parks": {"leisure": ["park", "garden", "playground"]},
        "transit": {"highway": "bus_stop", "railway": "station"},
        "culture": {"amenity": ["library", "community_centre", "theatre"]},
        "dining": {"amenity": ["restaurant", "cafe"]},
        "shopping": {"shop": ["mall", "department_store", "clothes"]},
        "finance": {"amenity": ["bank", "atm"]},
    },
    # CRS for distance calculations (UTM auto-detected)
    "crs_projected": None,  # Set to e.g. "EPSG:25831" or leave None for auto
    # Output
    "output_dir": "./output",
    "dpi": 150,
}

# ── Imports ────────────────────────────────────────────────────────
import os
import numpy as np
import pandas as pd
import geopandas as gpd
import osmnx as ox
import pandana
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

# ── Step 1: Download street network ───────────────────────────────
print("Step 1: Downloading street network...")
G = ox.graph_from_place(PARAMS["place"], network_type=PARAMS["network_type"])
nodes, edges = ox.graph_to_gdfs(G)
print(f"  Network: {len(nodes)} nodes, {len(edges)} edges")

# ── Step 2: Build Pandana network ─────────────────────────────────
print("Step 2: Building Pandana accessibility network...")
max_dist_m = PARAMS["walk_speed_kmh"] * 1000 / 60 * PARAMS["max_walk_min"]

edge_list = edges.reset_index()[["u", "v", "length"]]
net = pandana.Network(
    nodes["x"], nodes["y"],
    edge_list["u"], edge_list["v"], edge_list[["length"]],
    twoway=True,
)
net.precompute(max_dist_m)
print(f"  Max walk distance: {max_dist_m:.0f} m ({PARAMS['max_walk_min']} min)")

# ── Step 3: Fetch amenities per category ──────────────────────────
print("Step 3: Fetching amenities from OpenStreetMap...")
amenity_counts = {}
category_scores = {}

for cat_name, tags in PARAMS["amenity_categories"].items():
    try:
        pois = ox.features_from_place(PARAMS["place"], tags=tags)
        pts = pois.copy()
        pts["geometry"] = pts.geometry.centroid
        pts = pts[pts.geometry.geom_type == "Point"]
        x = pts.geometry.x.values
        y = pts.geometry.y.values

        if len(x) == 0:
            amenity_counts[cat_name] = 0
            category_scores[cat_name] = np.zeros(len(nodes))
            continue

        net.set_pois(cat_name, max_dist_m, 1, x, y)
        dist = net.nearest_pois(max_dist_m, cat_name, num_pois=1)[1]

        # Distance decay score: 1 at 0m, 0 at max_dist_m
        score = np.clip(1.0 - (dist / max_dist_m), 0, 1)
        category_scores[cat_name] = score.values
        amenity_counts[cat_name] = len(x)
        print(f"  {cat_name}: {len(x)} POIs found")

    except Exception as e:
        print(f"  {cat_name}: skipped ({e})")
        amenity_counts[cat_name] = 0
        category_scores[cat_name] = np.zeros(len(nodes))

# ── Step 4: Composite walkability score ───────────────────────────
print("Step 4: Computing composite walkability score...")
n_cats = len(category_scores)
if n_cats > 0:
    score_matrix = np.column_stack(list(category_scores.values()))
    walk_score = np.mean(score_matrix, axis=1) * 100  # Scale to 0–100
else:
    walk_score = np.zeros(len(nodes))

nodes["walk_score"] = walk_score

# Classification bands (Walk Score methodology)
def classify(score):
    if score >= 90: return "Walker's Paradise"
    if score >= 70: return "Very Walkable"
    if score >= 50: return "Somewhat Walkable"
    if score >= 25: return "Car-Dependent"
    return "Almost All Trips by Car"

nodes["classification"] = nodes["walk_score"].apply(classify)

# ── Step 5: Summary statistics ────────────────────────────────────
print("\\nStep 5: Summary Statistics")
print(f"  Mean Walk Score: {nodes['walk_score'].mean():.1f}")
print(f"  Median Walk Score: {nodes['walk_score'].median():.1f}")
print(f"  Std Dev: {nodes['walk_score'].std():.1f}")
print(f"  Min: {nodes['walk_score'].min():.1f}, Max: {nodes['walk_score'].max():.1f}")
print(f"\\n  Classification Distribution:")
print(nodes["classification"].value_counts().to_string())

# ── Step 6: Generate map ──────────────────────────────────────────
print("\\nStep 6: Generating walkability map...")
os.makedirs(PARAMS["output_dir"], exist_ok=True)

# Diverging walkability ramp: bad (red) → moderate (yellow/amber midpoints) → good (green).
# Documented as analytical data palette, not UI chrome. The amber/yellow stops are
# meaningful midpoints in the standard walkability rating scale (Walk Score 0-100).
cmap = LinearSegmentedColormap.from_list(
    "walkability", ["#d32f2f", "#ff9800", "#fdd835", "#66bb6a", "#1b5e20"]
)

fig, ax = plt.subplots(figsize=(14, 10))
nodes.plot(
    column="walk_score",
    cmap=cmap,
    vmin=0, vmax=100,
    markersize=2,
    alpha=0.7,
    ax=ax,
    legend=True,
    legend_kwds={"label": "Walk Score (0–100)", "shrink": 0.6},
)
ax.set_title(f"15-Minute City Walk Score — {PARAMS['place']}", fontsize=14, fontweight="bold")
ax.set_axis_off()
fig.tight_layout()
fig.savefig(os.path.join(PARAMS["output_dir"], "walkability_map.png"), dpi=PARAMS["dpi"])
plt.close(fig)

# ── Step 7: Amenity count bar chart ───────────────────────────────
print("Step 7: Generating amenity bar chart...")
fig2, ax2 = plt.subplots(figsize=(10, 5))
cats = list(amenity_counts.keys())
counts = list(amenity_counts.values())
colors = plt.cm.Set2(np.linspace(0, 1, len(cats)))
ax2.barh(cats, counts, color=colors)
ax2.set_xlabel("Number of POIs")
ax2.set_title(f"Amenity Availability — {PARAMS['place']}")
fig2.tight_layout()
fig2.savefig(os.path.join(PARAMS["output_dir"], "amenity_counts.png"), dpi=PARAMS["dpi"])
plt.close(fig2)

# ── Step 8: Export GeoJSON ────────────────────────────────────────
print("Step 8: Exporting results...")
out_gdf = nodes[["geometry", "walk_score", "classification"]].copy()
out_gdf.to_file(os.path.join(PARAMS["output_dir"], "walkability.geojson"), driver="GeoJSON")

# JSON result for bridge consumption
bridge_result = {
    "analysis": "15-minute city walkability",
    "place": PARAMS["place"],
    "mean_score": float(nodes["walk_score"].mean()),
    "median_score": float(nodes["walk_score"].median()),
    "node_count": len(nodes),
    "amenity_counts": amenity_counts,
    "classification_distribution": nodes["classification"].value_counts().to_dict(),
}

print("\\n✓ Analysis complete. Outputs saved to:", PARAMS["output_dir"])
`;
