// Template: Urban Morphology — Building Morphometrics using momepy
// Exported as a string constant for embedding in the ScriptTemplates UI

export const URBAN_MORPHOLOGY = `#!/usr/bin/env python3
"""
Urban Morphology — Building Morphometrics
===========================================
Compute building morphometric indicators using Momepy: area, perimeter,
elongation, orientation, shared walls, courtyard index, and tessellation-
based spatial metrics.

Follows the Spacematrix / Momepy methodology for quantitative urban
morphology analysis.

Dependencies: momepy, geopandas, matplotlib, shapely, numpy, pandas
Usage: Configure the PARAMS section below, then run the entire script.

Output: Morphometric attribute map + summary statistics + radar chart.

References:
  - Fleischmann, M. et al. (2019). momepy: Urban Morphology Measuring Toolkit.
    Journal of Open Source Software, 4(43), 1807.
  - Berghauser Pont, M. & Haupt, P. (2010). Spacematrix: Space, Density
    and Urban Form. NAi Publishers.
"""

import warnings
warnings.filterwarnings("ignore")

# ── Configuration ──────────────────────────────────────────────────
PARAMS = {
    # Input: building footprints as GeoJSON or Shapefile
    "buildings_path": "./data/buildings.geojson",
    # Optional: street edges for block tessellation (GeoJSON LineString)
    "streets_path": None,
    # CRS for metric computation (projected CRS in meters)
    "crs_metric": "EPSG:32633",  # UTM Zone 33N — adjust to study area
    # Tessellation buffer distance (meters)
    "tessellation_buffer": 200,
    # Height column (building height in meters, or None)
    "height_column": None,
    # Levels column (number of floors, or None — estimated from height / 3)
    "levels_column": None,
    # Output
    "output_dir": "./output",
    "dpi": 150,
}

# ── Imports ────────────────────────────────────────────────────────
import os
import numpy as np
import pandas as pd
import geopandas as gpd
import momepy
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
import matplotlib.cm as cm

# ── Step 1: Load building footprints ──────────────────────────────
print("Step 1: Loading building footprints...")
buildings = gpd.read_file(PARAMS["buildings_path"])
buildings = buildings[buildings.geometry.notnull()].copy()
buildings = buildings[buildings.geometry.is_valid].copy()
buildings = buildings.to_crs(PARAMS["crs_metric"])

print(f"  Buildings loaded: {len(buildings)}")
print(f"  CRS: {buildings.crs}")
print(f"  Bounds: {buildings.total_bounds}")

# Ensure unique ID
buildings["uID"] = range(len(buildings))

# ── Step 2: Basic shape metrics ───────────────────────────────────
print("Step 2: Computing basic shape metrics...")
buildings["area"] = momepy.Area(buildings).series
buildings["perimeter"] = momepy.Perimeter(buildings).series
buildings["elongation"] = momepy.Elongation(buildings).series
buildings["corners"] = momepy.Corners(buildings).series
buildings["orientation"] = momepy.Orientation(buildings).series
buildings["circular_compactness"] = momepy.CircularCompactness(buildings).series
buildings["convexity"] = momepy.Convexity(buildings).series
buildings["courtyard_index"] = momepy.CourtyardIndex(buildings).series

print(f"  Mean area: {buildings['area'].mean():.1f} m²")
print(f"  Mean perimeter: {buildings['perimeter'].mean():.1f} m")
print(f"  Mean elongation: {buildings['elongation'].mean():.3f}")
print(f"  Mean circular compactness: {buildings['circular_compactness'].mean():.3f}")
print(f"  Mean convexity: {buildings['convexity'].mean():.3f}")

# ── Step 3: Shared walls ─────────────────────────────────────────
print("Step 3: Computing shared walls metric...")
try:
    buildings["shared_walls"] = momepy.SharedWallsRatio(buildings).series
    print(f"  Mean shared wall ratio: {buildings['shared_walls'].mean():.3f}")
except Exception as e:
    print(f"  Shared walls computation skipped: {e}")
    buildings["shared_walls"] = 0.0

# ── Step 4: Height / volume metrics ───────────────────────────────
print("Step 4: Computing height and volume metrics...")
if PARAMS["height_column"] and PARAMS["height_column"] in buildings.columns:
    buildings["height"] = buildings[PARAMS["height_column"]].fillna(3.0)
elif PARAMS["levels_column"] and PARAMS["levels_column"] in buildings.columns:
    buildings["height"] = buildings[PARAMS["levels_column"]].fillna(1) * 3.0
else:
    # Estimate: default 1 level = 3m
    buildings["height"] = 3.0
    print("  No height data available — using default 3m")

buildings["volume"] = buildings["area"] * buildings["height"]
buildings["floor_area"] = buildings["area"] * np.ceil(buildings["height"] / 3.0)
print(f"  Mean height: {buildings['height'].mean():.1f} m")
print(f"  Mean volume: {buildings['volume'].mean():.0f} m³")

# ── Step 5: Tessellation (morphological cells) ────────────────────
print("Step 5: Generating morphological tessellation...")
try:
    limit = momepy.buffered_limit(buildings, buffer=PARAMS["tessellation_buffer"])
    tessellation = momepy.Tessellation(
        buildings, unique_id="uID", limit=limit
    ).tessellation
    tessellation["tess_area"] = tessellation.area
    buildings = buildings.merge(
        tessellation[["uID", "tess_area"]], on="uID", how="left"
    )
    buildings["coverage_ratio"] = buildings["area"] / buildings["tess_area"]
    print(f"  Tessellation cells: {len(tessellation)}")
    print(f"  Mean coverage ratio: {buildings['coverage_ratio'].mean():.3f}")
except Exception as e:
    print(f"  Tessellation skipped: {e}")
    buildings["tess_area"] = buildings["area"] * 2
    buildings["coverage_ratio"] = 0.5

# ── Step 6: Summary statistics table ──────────────────────────────
print("\\nStep 6: Summary Statistics")
metrics = [
    "area", "perimeter", "elongation", "circular_compactness",
    "convexity", "courtyard_index", "shared_walls", "height",
    "volume", "coverage_ratio",
]
summary = buildings[metrics].describe().T
summary = summary[["mean", "std", "min", "25%", "50%", "75%", "max"]]
print(summary.round(3).to_string())

# ── Step 7: Generate morphometric map ─────────────────────────────
print("\\nStep 7: Generating morphometric maps...")
os.makedirs(PARAMS["output_dir"], exist_ok=True)

fig, axes = plt.subplots(2, 3, figsize=(18, 12))
map_metrics = [
    ("area", "Building Area (m²)", "YlOrRd"),
    ("elongation", "Elongation", "RdYlBu_r"),
    ("circular_compactness", "Circular Compactness", "RdYlGn"),
    ("orientation", "Orientation (°)", "twilight"),
    ("coverage_ratio", "Coverage Ratio", "YlOrBr"),
    ("height", "Height (m)", "plasma"),
]

for ax, (col, title, cmap_name) in zip(axes.flat, map_metrics):
    buildings.plot(column=col, cmap=cmap_name, ax=ax, edgecolor="#333",
                   linewidth=0.2, legend=True,
                   legend_kwds={"label": title, "shrink": 0.7})
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.set_axis_off()

fig.suptitle("Building Morphometrics", fontsize=16, fontweight="bold", y=1.01)
fig.tight_layout()
fig.savefig(os.path.join(PARAMS["output_dir"], "morphometrics_map.png"),
            dpi=PARAMS["dpi"], bbox_inches="tight")
plt.close(fig)

# ── Step 8: Radar chart (mean values, normalized) ─────────────────
print("Step 8: Generating radar chart...")
radar_metrics = [
    "elongation", "circular_compactness", "convexity",
    "courtyard_index", "shared_walls", "coverage_ratio",
]
radar_vals = []
for m in radar_metrics:
    v = buildings[m]
    mn, mx = v.min(), v.max()
    radar_vals.append((v.mean() - mn) / (mx - mn) if mx > mn else 0.5)

angles = np.linspace(0, 2 * np.pi, len(radar_metrics), endpoint=False).tolist()
radar_vals_closed = radar_vals + [radar_vals[0]]
angles_closed = angles + [angles[0]]

fig3, ax3 = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
ax3.fill(angles_closed, radar_vals_closed, alpha=0.25, color="#f5a623")
ax3.plot(angles_closed, radar_vals_closed, "o-", color="#f5a623", linewidth=2)
ax3.set_xticks(angles)
ax3.set_xticklabels(radar_metrics, fontsize=9)
ax3.set_ylim(0, 1)
ax3.set_title("Morphometric Profile (normalized means)", fontsize=12, fontweight="bold", pad=20)
fig3.tight_layout()
fig3.savefig(os.path.join(PARAMS["output_dir"], "morphometric_radar.png"), dpi=PARAMS["dpi"])
plt.close(fig3)

# ── Step 9: Export results ────────────────────────────────────────
print("Step 9: Exporting results...")
export_cols = ["geometry", "uID", "area", "perimeter", "elongation",
               "circular_compactness", "convexity", "courtyard_index",
               "shared_walls", "height", "volume", "coverage_ratio", "orientation"]
buildings_out = buildings[[c for c in export_cols if c in buildings.columns]].copy()
buildings_out.to_file(os.path.join(PARAMS["output_dir"], "morphometrics.geojson"), driver="GeoJSON")

bridge_result = {
    "analysis": "urban_morphology",
    "building_count": len(buildings),
    "crs": str(buildings.crs),
    "metrics": {
        m: {
            "mean": round(float(buildings[m].mean()), 4),
            "std": round(float(buildings[m].std()), 4),
            "min": round(float(buildings[m].min()), 4),
            "max": round(float(buildings[m].max()), 4),
        }
        for m in metrics
    },
}

print("\\n✓ Analysis complete. Outputs saved to:", PARAMS["output_dir"])
`;
