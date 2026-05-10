// Template: NDVI from Sentinel-2 using Rasterio
// Exported as a string constant for embedding in the ScriptTemplates UI

export const REMOTE_SENSING_NDVI = `#!/usr/bin/env python3
"""
NDVI Computation from Sentinel-2 Imagery
==========================================
Computes the Normalized Difference Vegetation Index (NDVI) from Sentinel-2
satellite imagery using Rasterio. Classifies vegetation density and produces
a color-mapped output raster + histogram.

NDVI = (NIR - RED) / (NIR + RED)
  Sentinel-2 Band 8 (NIR, 842nm, 10m) and Band 4 (RED, 665nm, 10m)

Dependencies: rasterio, numpy, matplotlib, shapely
Usage: Set the input file paths in PARAMS, then run the entire script.

Output: NDVI GeoTIFF raster + classification map + histogram.

References:
  - Tucker, C.J. (1979). Red and photographic infrared linear combinations
    for monitoring vegetation. Remote Sensing of Environment.
  - Sentinel-2 User Handbook, ESA (2015).
"""

import warnings
warnings.filterwarnings("ignore")

# ── Configuration ──────────────────────────────────────────────────
PARAMS = {
    # Input Sentinel-2 band files (GeoTIFF)
    "nir_band_path": "./data/sentinel2_B08.tif",   # Band 8 (NIR, 842nm)
    "red_band_path": "./data/sentinel2_B04.tif",    # Band 4 (RED, 665nm)
    # Optional: clip to study area (GeoJSON polygon path, or None)
    "clip_boundary": None,
    # NDVI classification thresholds
    "thresholds": {
        "water_or_bare": -0.1,
        "sparse_vegetation": 0.2,
        "moderate_vegetation": 0.4,
        "dense_vegetation": 0.6,
    },
    # Output
    "output_dir": "./output",
    "dpi": 150,
}

# ── Imports ────────────────────────────────────────────────────────
import os
import numpy as np
import rasterio
from rasterio.plot import show
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, BoundaryNorm
import matplotlib.patches as mpatches

# ── Step 1: Load Sentinel-2 bands ─────────────────────────────────
print("Step 1: Loading Sentinel-2 bands...")
with rasterio.open(PARAMS["nir_band_path"]) as nir_src:
    nir = nir_src.read(1).astype(np.float32)
    profile = nir_src.profile.copy()
    transform = nir_src.transform
    crs = nir_src.crs
    print(f"  NIR band shape: {nir.shape}")
    print(f"  CRS: {crs}")
    print(f"  Resolution: {transform[0]:.1f}m")

with rasterio.open(PARAMS["red_band_path"]) as red_src:
    red = red_src.read(1).astype(np.float32)
    print(f"  RED band shape: {red.shape}")

assert nir.shape == red.shape, "NIR and RED bands must have the same dimensions"

# ── Step 2: Compute NDVI ──────────────────────────────────────────
print("Step 2: Computing NDVI...")
# Prevent division by zero
denominator = nir + red
denominator[denominator == 0] = np.nan

ndvi = (nir - red) / denominator

# Clip to valid range [-1, 1]
ndvi = np.clip(ndvi, -1.0, 1.0)

# Statistics (excluding NaN)
valid = ndvi[~np.isnan(ndvi)]
print(f"  NDVI range: [{valid.min():.4f}, {valid.max():.4f}]")
print(f"  Mean NDVI: {valid.mean():.4f}")
print(f"  Median NDVI: {np.median(valid):.4f}")
print(f"  Std Dev: {valid.std():.4f}")
print(f"  Valid pixels: {len(valid):,} / {ndvi.size:,}")

# ── Step 3: Classify vegetation ───────────────────────────────────
print("Step 3: Classifying vegetation density...")
t = PARAMS["thresholds"]
classes = np.full(ndvi.shape, 0, dtype=np.int8)
classes[ndvi >= t["water_or_bare"]] = 1        # Bare soil / built-up
classes[ndvi >= t["sparse_vegetation"]] = 2    # Sparse vegetation
classes[ndvi >= t["moderate_vegetation"]] = 3  # Moderate vegetation
classes[ndvi >= t["dense_vegetation"]] = 4     # Dense vegetation
classes[np.isnan(ndvi)] = 0                    # No data

class_labels = {
    0: "No Data / Water",
    1: "Bare Soil / Built-up",
    2: "Sparse Vegetation",
    3: "Moderate Vegetation",
    4: "Dense Vegetation",
}

# Count pixels per class
for cls_id, label in class_labels.items():
    count = np.sum(classes == cls_id)
    pct = count / classes.size * 100
    print(f"  {label}: {count:,} pixels ({pct:.1f}%)")

# ── Step 4: Save NDVI raster ─────────────────────────────────────
print("\\nStep 4: Saving NDVI raster...")
os.makedirs(PARAMS["output_dir"], exist_ok=True)

profile.update(dtype=rasterio.float32, count=1, nodata=np.nan)
ndvi_path = os.path.join(PARAMS["output_dir"], "ndvi.tif")
with rasterio.open(ndvi_path, "w", **profile) as dst:
    dst.write(ndvi, 1)
print(f"  Saved: {ndvi_path}")

# ── Step 5: Generate NDVI map ─────────────────────────────────────
print("Step 5: Generating NDVI map...")
cmap_ndvi = LinearSegmentedColormap.from_list(
    "ndvi",
    [
        "#d73027",  # -1.0 — water/bare
        "#fc8d59",  # -0.1 — bare soil
        "#fee08b",  #  0.2 — sparse
        "#d9ef8b",  #  0.4 — moderate
        "#1a9850",  #  0.6 — dense
        "#006837",  #  1.0 — very dense
    ],
)

fig, ax = plt.subplots(figsize=(12, 10))
im = ax.imshow(ndvi, cmap=cmap_ndvi, vmin=-0.2, vmax=0.8)
ax.set_title("NDVI — Sentinel-2", fontsize=14, fontweight="bold")
ax.set_axis_off()
plt.colorbar(im, ax=ax, label="NDVI", shrink=0.6)
fig.tight_layout()
fig.savefig(os.path.join(PARAMS["output_dir"], "ndvi_map.png"), dpi=PARAMS["dpi"])
plt.close(fig)

# ── Step 6: Classification map ────────────────────────────────────
print("Step 6: Generating classification map...")
class_colors = ["#2196f3", "#ff9800", "#cddc39", "#4caf50", "#1b5e20"]
class_cmap = LinearSegmentedColormap.from_list("veg_class", class_colors, N=5)
bounds = [-0.5, 0.5, 1.5, 2.5, 3.5, 4.5]
norm = BoundaryNorm(bounds, class_cmap.N)

fig2, ax2 = plt.subplots(figsize=(12, 10))
ax2.imshow(classes, cmap=class_cmap, norm=norm)
ax2.set_title("Vegetation Classification", fontsize=14, fontweight="bold")
ax2.set_axis_off()

patches = [
    mpatches.Patch(color=class_colors[i], label=class_labels[i])
    for i in range(5)
]
ax2.legend(handles=patches, loc="lower right", fontsize=9)
fig2.tight_layout()
fig2.savefig(os.path.join(PARAMS["output_dir"], "vegetation_classes.png"), dpi=PARAMS["dpi"])
plt.close(fig2)

# ── Step 7: Histogram ─────────────────────────────────────────────
print("Step 7: Generating NDVI histogram...")
fig3, ax3 = plt.subplots(figsize=(10, 5))
ax3.hist(valid, bins=100, color="#4caf50", alpha=0.8, edgecolor="none")
ax3.axvline(valid.mean(), color="#d32f2f", linestyle="--", label=f"Mean: {valid.mean():.3f}")
ax3.set_xlabel("NDVI")
ax3.set_ylabel("Pixel Count")
ax3.set_title("NDVI Distribution")
ax3.legend()
fig3.tight_layout()
fig3.savefig(os.path.join(PARAMS["output_dir"], "ndvi_histogram.png"), dpi=PARAMS["dpi"])
plt.close(fig3)

# ── Step 8: Bridge result ─────────────────────────────────────────
bridge_result = {
    "analysis": "ndvi_sentinel2",
    "crs": str(crs),
    "resolution_m": abs(transform[0]),
    "shape": list(ndvi.shape),
    "ndvi_mean": round(float(valid.mean()), 4),
    "ndvi_median": round(float(np.median(valid)), 4),
    "ndvi_std": round(float(valid.std()), 4),
    "ndvi_min": round(float(valid.min()), 4),
    "ndvi_max": round(float(valid.max()), 4),
    "valid_pixel_count": int(len(valid)),
    "class_distribution": {
        class_labels[k]: int(np.sum(classes == k)) for k in class_labels
    },
}

print("\\n✓ Analysis complete. Outputs saved to:", PARAMS["output_dir"])
`;
