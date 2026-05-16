// Template: Spatial Autocorrelation — Moran's I and LISA
// Exported as a string constant for embedding in the ScriptTemplates UI

export const SPATIAL_AUTOCORRELATION = `#!/usr/bin/env python3
"""
Spatial Autocorrelation Analysis — Moran's I and LISA
======================================================
Tests for spatial autocorrelation using Global Moran's I and maps Local
Indicators of Spatial Association (LISA) clusters using PySAL (libpysal + esda).

Identifies statistically significant hot spots (HH), cold spots (LL),
and spatial outliers (HL, LH) in a spatial dataset.

Dependencies: libpysal, esda, geopandas, matplotlib, numpy, pandas
Usage: Configure the PARAMS section below, then run the entire script.

Output: Moran scatterplot + LISA cluster map + significance map + statistics.

References:
  - Anselin, L. (1995). Local Indicators of Spatial Association — LISA.
    Geographical Analysis, 27(2), 93–115.
  - Moran, P. A. P. (1950). Notes on continuous stochastic phenomena.
    Biometrika, 37(1/2), 17–23.
"""

import warnings
warnings.filterwarnings("ignore")

# ── Configuration ──────────────────────────────────────────────────
PARAMS = {
    # Input GeoJSON or Shapefile with a numeric attribute to analyze
    "input_path": "./data/census_tracts.geojson",
    # Column name of the variable to test for spatial autocorrelation
    "variable": "median_income",
    # Spatial weights type: "queen", "rook", or "knn"
    "weights_type": "queen",
    # For KNN weights: number of neighbors
    "k_neighbors": 8,
    # Significance level for LISA clusters
    "alpha": 0.05,
    # Number of random permutations for significance testing
    "permutations": 999,
    # Output
    "output_dir": "./output",
    "dpi": 150,
}

# ── Imports ────────────────────────────────────────────────────────
import os
import numpy as np
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from libpysal.weights import Queen, Rook, KNN
from esda.moran import Moran, Moran_Local

# ── Step 1: Load data ─────────────────────────────────────────────
print("Step 1: Loading spatial data...")
gdf = gpd.read_file(PARAMS["input_path"])
var_col = PARAMS["variable"]

assert var_col in gdf.columns, f"Column '{var_col}' not found. Available: {list(gdf.columns)}"
print(f"  Features: {len(gdf)}")
print(f"  CRS: {gdf.crs}")
print(f"  Variable: {var_col}")
print(f"  Mean: {gdf[var_col].mean():.2f}, Std: {gdf[var_col].std():.2f}")

# Drop NAs in the target variable
gdf = gdf.dropna(subset=[var_col]).reset_index(drop=True)
y = gdf[var_col].values

# ── Step 2: Construct spatial weights ─────────────────────────────
print("Step 2: Constructing spatial weights...")
wt = PARAMS["weights_type"].lower()
if wt == "queen":
    w = Queen.from_dataframe(gdf)
elif wt == "rook":
    w = Rook.from_dataframe(gdf)
elif wt == "knn":
    w = KNN.from_dataframe(gdf, k=PARAMS["k_neighbors"])
else:
    raise ValueError(f"Unknown weights type: {wt}")

w.transform = "r"  # Row-standardize
print(f"  Weights type: {wt}")
print(f"  Mean neighbors: {w.mean_neighbors:.1f}")
print(f"  Min neighbors: {w.min_neighbors}, Max: {w.max_neighbors}")

# ── Step 3: Global Moran's I ─────────────────────────────────────
print("\\nStep 3: Computing Global Moran's I...")
moran = Moran(y, w, permutations=PARAMS["permutations"])

print(f"  Moran's I: {moran.I:.6f}")
print(f"  Expected I: {moran.EI:.6f}")
print(f"  Variance: {moran.VI_rand:.6f}")
print(f"  Z-score: {moran.z_rand:.4f}")
print(f"  p-value (rand): {moran.p_rand:.6f}")
print(f"  p-value (norm): {moran.p_norm:.6f}")

if moran.p_rand < PARAMS["alpha"]:
    if moran.I > moran.EI:
        interpretation = "Significant POSITIVE spatial autocorrelation (clustering)"
    else:
        interpretation = "Significant NEGATIVE spatial autocorrelation (dispersion)"
else:
    interpretation = "No significant spatial autocorrelation (random pattern)"
print(f"  Interpretation: {interpretation}")

# ── Step 4: Local Moran's I (LISA) ────────────────────────────────
print("\\nStep 4: Computing Local Moran's I (LISA)...")
lisa = Moran_Local(y, w, permutations=PARAMS["permutations"])

# LISA cluster labels
# q values: 1=HH, 2=LH, 3=LL, 4=HL
sig = lisa.p_sim < PARAMS["alpha"]
clusters = np.full(len(gdf), 0)  # 0 = Not Significant
clusters[sig & (lisa.q == 1)] = 1  # HH — Hot Spot
clusters[sig & (lisa.q == 2)] = 2  # LH — Spatial Outlier (Low-High)
clusters[sig & (lisa.q == 3)] = 3  # LL — Cold Spot
clusters[sig & (lisa.q == 4)] = 4  # HL — Spatial Outlier (High-Low)

gdf["lisa_cluster"] = clusters
gdf["lisa_I"] = lisa.Is
gdf["lisa_p"] = lisa.p_sim

cluster_labels = {
    0: "Not Significant",
    1: "High-High (Hot Spot)",
    2: "Low-High (Outlier)",
    3: "Low-Low (Cold Spot)",
    4: "High-Low (Outlier)",
}

print("  LISA Cluster Distribution:")
for cid, label in cluster_labels.items():
    count = np.sum(clusters == cid)
    print(f"    {label}: {count} ({count / len(gdf) * 100:.1f}%)")

# ── Step 5: Moran scatterplot ─────────────────────────────────────
print("\\nStep 5: Generating Moran scatterplot...")
os.makedirs(PARAMS["output_dir"], exist_ok=True)

fig, ax = plt.subplots(figsize=(8, 8))

# Standardize
z = (y - y.mean()) / y.std()
lag = np.array([np.sum(w.weights[i] * z[list(w.neighbors[i])]) for i in range(len(z))])

colors_scatter = ["#bdbdbd", "#d32f2f", "#64b5f6", "#1565c0", "#fb8072"]
c = [colors_scatter[int(clusters[i])] for i in range(len(z))]

ax.scatter(z, lag, c=c, s=20, alpha=0.7, edgecolors="none")
ax.axhline(0, color="#444", linewidth=0.5)
ax.axvline(0, color="#444", linewidth=0.5)

# Regression line
slope = moran.I
x_line = np.linspace(z.min(), z.max(), 100)
ax.plot(x_line, slope * x_line, color="#3794ff", linewidth=2,
        label=f"Moran's I = {moran.I:.4f}")
ax.set_xlabel(f"Standardized {var_col}")
ax.set_ylabel(f"Spatial Lag of {var_col}")
ax.set_title("Moran Scatterplot", fontsize=14, fontweight="bold")
ax.legend()
fig.tight_layout()
fig.savefig(os.path.join(PARAMS["output_dir"], "moran_scatterplot.png"), dpi=PARAMS["dpi"])
plt.close(fig)

# ── Step 6: LISA cluster map ──────────────────────────────────────
print("Step 6: Generating LISA cluster map...")
cluster_colors = {
    0: "#e0e0e0",
    1: "#d32f2f",  # HH — red
    2: "#64b5f6",  # LH — light blue
    3: "#1565c0",  # LL — dark blue
    4: "#fb8072",  # HL — light red (PySAL splot LISA convention; documented data palette, not UI chrome)
}

fig2, ax2 = plt.subplots(figsize=(12, 10))
for cid, color in cluster_colors.items():
    subset = gdf[gdf["lisa_cluster"] == cid]
    if len(subset) > 0:
        subset.plot(ax=ax2, color=color, edgecolor="#444", linewidth=0.3)

patches = [
    mpatches.Patch(color=cluster_colors[cid], label=cluster_labels[cid])
    for cid in sorted(cluster_colors.keys())
]
ax2.legend(handles=patches, loc="lower right", fontsize=9)
ax2.set_title(f"LISA Clusters — {var_col}", fontsize=14, fontweight="bold")
ax2.set_axis_off()
fig2.tight_layout()
fig2.savefig(os.path.join(PARAMS["output_dir"], "lisa_clusters.png"), dpi=PARAMS["dpi"])
plt.close(fig2)

# ── Step 7: Significance map ─────────────────────────────────────
print("Step 7: Generating significance map...")
fig3, ax3 = plt.subplots(figsize=(12, 10))
gdf.plot(column="lisa_p", cmap="YlOrRd_r", ax=ax3, edgecolor="#444",
         linewidth=0.3, legend=True,
         legend_kwds={"label": "p-value", "shrink": 0.6})
ax3.set_title(f"LISA Significance (p-value) — {var_col}", fontsize=14, fontweight="bold")
ax3.set_axis_off()
fig3.tight_layout()
fig3.savefig(os.path.join(PARAMS["output_dir"], "lisa_significance.png"), dpi=PARAMS["dpi"])
plt.close(fig3)

# ── Step 8: Export results ────────────────────────────────────────
print("Step 8: Exporting results...")
gdf_out = gdf[["geometry", "lisa_cluster", "lisa_I", "lisa_p", var_col]].copy()
gdf_out["cluster_label"] = gdf_out["lisa_cluster"].map(cluster_labels)
gdf_out.to_file(os.path.join(PARAMS["output_dir"], "lisa_clusters.geojson"), driver="GeoJSON")

bridge_result = {
    "analysis": "spatial_autocorrelation",
    "variable": var_col,
    "n_features": len(gdf),
    "weights_type": wt,
    "global_morans_I": round(float(moran.I), 6),
    "expected_I": round(float(moran.EI), 6),
    "z_score": round(float(moran.z_rand), 4),
    "p_value": round(float(moran.p_rand), 6),
    "interpretation": interpretation,
    "lisa_clusters": {
        cluster_labels[k]: int(np.sum(clusters == k)) for k in cluster_labels
    },
}

print("\\n✓ Analysis complete. Outputs saved to:", PARAMS["output_dir"])
`;
