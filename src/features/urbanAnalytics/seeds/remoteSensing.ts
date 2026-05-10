import type { Card } from '../lib/types';

/**
 * Remote Sensing & Earth Observation seed cards.
 * 8 cards covering spectral indices, classification, change detection,
 * thermal analysis, data fusion, cloud-native workflows, and GEE.
 */
export function buildRemoteSensingCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'rs-spectral-index',
      title: 'Spectral Index Computation',
      sectionId: 'remote_sensing',
      summary:
        'Compute vegetation, built-up, water, and soil indices from multi-spectral satellite imagery. ' +
        'Core formulas: NDVI = (NIR−Red)/(NIR+Red), NDBI = (SWIR−NIR)/(SWIR+NIR), NDWI = (Green−NIR)/(Green+NIR), ' +
        'SAVI = ((NIR−Red)/(NIR+Red+L))×(1+L), EVI = 2.5×(NIR−Red)/(NIR+6×Red−7.5×Blue+1). ' +
        'Band mapping differs between Sentinel-2 (B2-B12) and Landsat-8/9 (B1-B7).',
      tags: ['remote_sensing', 'climate', 'green_infra'],
      methodology:
        '1. Acquire cloud-free composite (Sentinel-2 L2A or Landsat-8/9 C2 L2).\n' +
        '2. Apply per-pixel band math for desired index.\n' +
        '3. Mask clouds & cloud shadows via SCL band (Sentinel-2) or QA_PIXEL (Landsat).\n' +
        '4. Threshold classification: e.g., NDVI > 0.4 = dense vegetation.\n' +
        '5. Validate with ground-truth points or high-res reference data.\n' +
        '6. Export raster or zonal statistics per administrative unit.',
      tools: ['rasterio', 'xarray', 'rioxarray', 'Google Earth Engine', 'QGIS'],
      datasets: ['Sentinel-2 L2A (Copernicus Open Access Hub)', 'Landsat-8/9 Collection 2 (USGS EarthExplorer)'],
      examples: [
        'Copernicus Global Land Service: NDVI 300m product monitoring vegetation phenology globally every 10 days since 1998',
        'GHSL-BUILT: NDBI-based extraction of built-up area from Landsat archive for 10 000+ urban areas 1975–2030',
        'Istanbul green space: NDVI time-series from Sentinel-2 showing 12% vegetation loss in peri-urban areas 2017–2023',
      ],
      prompts: [
        `import rasterio\nimport numpy as np\nfrom pathlib import Path\n\n# Spectral Index Computation from Sentinel-2\n# Band mapping: B2=Blue, B3=Green, B4=Red, B8=NIR, B11=SWIR1\n\ndef compute_indices(bands: dict) -> dict:\n    """Compute standard spectral indices from Sentinel-2 bands."""\n    nir = bands["B8"].astype(float)\n    red = bands["B4"].astype(float)\n    green = bands["B3"].astype(float)\n    blue = bands["B2"].astype(float)\n    swir = bands["B11"].astype(float)\n    \n    # Avoid division by zero\n    eps = 1e-10\n    \n    ndvi = (nir - red) / (nir + red + eps)\n    ndbi = (swir - nir) / (swir + nir + eps)\n    ndwi = (green - nir) / (green + nir + eps)\n    evi = 2.5 * (nir - red) / (nir + 6*red - 7.5*blue + 1 + eps)\n    savi_L = 0.5\n    savi = ((nir - red) / (nir + red + savi_L)) * (1 + savi_L)\n    \n    return {"NDVI": ndvi, "NDBI": ndbi, "NDWI": ndwi, "EVI": evi, "SAVI": savi}\n\n# Example usage with rasterio\n# with rasterio.open("sentinel2_B04.tif") as src:\n#     red = src.read(1)\n#     profile = src.profile\n\n# Demo with synthetic data\nnp.random.seed(42)\nsize = (100, 100)\nbands = {\n    "B2": np.random.uniform(500, 2000, size),   # Blue\n    "B3": np.random.uniform(600, 2500, size),   # Green\n    "B4": np.random.uniform(400, 2000, size),   # Red\n    "B8": np.random.uniform(1000, 4000, size),  # NIR\n    "B11": np.random.uniform(500, 3000, size),  # SWIR\n}\n\nindices = compute_indices(bands)\nfor name, arr in indices.items():\n    print(f"{name}: min={arr.min():.3f}, mean={arr.mean():.3f}, max={arr.max():.3f}")\n\n# Classification thresholds\nvegetation = indices["NDVI"] > 0.4\nbuilt_up = indices["NDBI"] > 0.0\nwater = indices["NDWI"] > 0.3\nprint(f"\\nVegetation pixels: {vegetation.sum():,} ({vegetation.mean()*100:.1f}%)")\nprint(f"Built-up pixels: {built_up.sum():,} ({built_up.mean()*100:.1f}%)")\nprint(f"Water pixels: {water.sum():,} ({water.mean()*100:.1f}%)")`,
      ],
      evidence: [
        'Huete, A. R. (1988). A Soil-Adjusted Vegetation Index (SAVI). Remote Sensing of Environment, 25(3), 295–309.',
        'Tucker, C. J. (1979). Red and photographic infrared linear combinations for monitoring vegetation. Remote Sensing of Environment, 8(2), 127–150.',
      ],
      limitations:
        'Cloud cover limits optical imagery availability. Atmospheric correction quality affects index accuracy. ' +
        'Thresholds are scene- and region-dependent—always calibrate locally.',
      sdgAlignment: ['11.7.1', '15.1.1'],
    },
    {
      id: 'rs-land-cover-classification',
      title: 'Land Cover Classification',
      sectionId: 'remote_sensing',
      summary:
        'Supervised pixel-based or object-based classification of multi-spectral imagery into land cover classes ' +
        '(built-up, vegetation, water, bare soil, agriculture). Random Forest and SVM are the most widely used classifiers. ' +
        'Accuracy is evaluated via confusion matrix metrics: overall accuracy, kappa, producer\'s & user\'s accuracy.',
      tags: ['remote_sensing', 'land_use', 'machine_learning'],
      methodology:
        '1. Collect training samples: ground truth points or digitized polygons per class.\n' +
        '2. Extract spectral bands + derived indices as feature stack.\n' +
        '3. Split data into training (70%) and validation (30%).\n' +
        '4. Train classifier (Random Forest n_estimators ≥ 200, or RBF-kernel SVM).\n' +
        '5. Predict full extent → classified raster.\n' +
        '6. Generate confusion matrix; target OA ≥ 85%, kappa ≥ 0.80.\n' +
        '7. Post-processing: majority filter to remove salt-and-pepper noise.',
      tools: ['scikit-learn', 'rasterio', 'geopandas', 'eo-learn', 'Google Earth Engine'],
      datasets: ['Sentinel-2 L2A', 'Landsat-8/9', 'ESA WorldCover 10 m', 'CORINE Land Cover'],
      examples: [
        'ESA WorldCover: global 10m land cover map from Sentinel-1/2 achieving 74.4% overall accuracy across 11 classes for 2020/2021',
        'Dynamic World (Google): near-real-time 10m land cover from Sentinel-2 updated every 5 days using deep learning achieving 73% OA',
        'Urban Atlas: Copernicus 2.5m resolution land use classification for 800+ European cities with 17 urban classes >85% accuracy',
      ],
      prompts: [
        `import numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import confusion_matrix, classification_report\n\n# Land Cover Classification with Random Forest\nnp.random.seed(42)\n\n# Simulated training data (spectral bands + indices as features)\n# In practice: extract from Sentinel-2 bands at training point locations\nn_samples = 1000\nn_features = 8  # B2, B3, B4, B8, B11, NDVI, NDBI, NDWI\nclass_names = {0: "Built-up", 1: "Vegetation", 2: "Water", 3: "Bare Soil", 4: "Agriculture"}\n\n# Generate synthetic training data per class\nX_list, y_list = [], []\nclass_profiles = {\n    0: [800, 700, 650, 1200, 1800, -0.1, 0.2, -0.3],  # Built-up\n    1: [400, 550, 350, 3500, 800, 0.7, -0.5, -0.6],    # Vegetation\n    2: [600, 800, 400, 200, 100, -0.3, -0.5, 0.6],      # Water\n    3: [1200, 1100, 1000, 1500, 2200, 0.1, 0.15, -0.2], # Bare soil\n    4: [500, 650, 500, 2800, 1200, 0.5, -0.3, -0.4],    # Agriculture\n}\nfor cls, profile in class_profiles.items():\n    samples = np.random.normal(profile, [p*0.2 for p in profile], (200, 8))\n    X_list.append(samples)\n    y_list.extend([cls] * 200)\n\nX = np.vstack(X_list)\ny = np.array(y_list)\n\n# Train/test split\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)\n\n# Train Random Forest\nrf = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)\nrf.fit(X_train, y_train)\ny_pred = rf.predict(X_test)\n\n# Evaluation\nprint("Classification Report:")\nprint(classification_report(y_test, y_pred, target_names=list(class_names.values())))\n\ncm = confusion_matrix(y_test, y_pred)\nOA = np.diag(cm).sum() / cm.sum()\nprint(f"\\nOverall Accuracy: {OA*100:.1f}%")\n\n# Feature importance\nimportances = rf.feature_importances_\nfeature_names = ["B2", "B3", "B4", "B8", "B11", "NDVI", "NDBI", "NDWI"]\nfor name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):\n    print(f"  {name}: {imp:.3f}")`,
      ],
      evidence: [
        'Belgiu, M. & Dr\u0103gu\u0163, L. (2016). Random forest in remote sensing: A review. ISPRS Journal of Photogrammetry and Remote Sensing, 114, 24–31.',
        'Zanaga, D. et al. (2022). ESA WorldCover 10 m 2021 v200. doi:10.5281/zenodo.7254221.',
      ],
      limitations:
        'Class imbalance biases accuracy. Training data quality is the primary bottleneck. ' +
        'Temporal mismatch between imagery and ground truth degrades results.',
      sdgAlignment: ['11.3.1', '15.3.1'],
    },
    {
      id: 'rs-change-detection',
      title: 'Change Detection',
      sectionId: 'remote_sensing',
      summary:
        'Identify land cover transitions between two or more dates using post-classification comparison, ' +
        'image differencing, or Change Vector Analysis (CVA). Multi-temporal Sentinel-2 provides 5-day revisit, ' +
        'enabling annual or sub-annual change monitoring for urbanization, deforestation, and disaster impact.',
      tags: ['remote_sensing', 'land_use', 'climate'],
      methodology:
        '1. Select radiometrically consistent image pairs (same season, similar sun angle).\n' +
        '2. Co-register images to sub-pixel accuracy.\n' +
        '3. Method A — Post-classification: classify each date independently, compute transition matrix.\n' +
        '4. Method B — Image differencing: subtract NDVI_t2 − NDVI_t1, threshold change pixels.\n' +
        '5. Method C — CVA: compute magnitude & direction of spectral change vector in feature space.\n' +
        '6. Validate change map against reference data (field survey, VHR imagery).\n' +
        '7. Report change areas (km²) and transition probabilities.',
      tools: ['rasterio', 'xarray', 'scikit-image', 'eo-learn', 'Google Earth Engine'],
      datasets: ['Sentinel-2 time-series', 'Landsat archive (1984–present)', 'MODIS 250 m'],
      examples: [
        'Global Forest Watch: near-real-time deforestation alerts from Landsat achieving 85% user accuracy across 50+ tropical countries',
        'Copernicus Land Monitoring: bi-annual land cover change detection for 39 European countries at 5m resolution 2006–2018',
        'Planet Labs monthly basemaps: 5m resolution change detection tracking illegal mining and urban encroachment in Amazon buffer zones',
      ],
      prompts: [
        `import numpy as np\nimport matplotlib.pyplot as plt\n\n# Change Detection: NDVI differencing + Change Vector Analysis\nnp.random.seed(42)\nsize = (200, 200)\n\n# Simulated NDVI at two dates\nndvi_t1 = np.random.normal(0.5, 0.15, size).clip(-1, 1)\nndvi_t2 = ndvi_t1.copy()\n# Simulate urban expansion (vegetation loss) in a region\nndvi_t2[50:100, 50:100] -= 0.4  # Built-up conversion\nndvi_t2[150:180, 20:60] += 0.3  # Revegetation\nndvi_t2 = ndvi_t2.clip(-1, 1)\n\n# 1. NDVI differencing\ndiff = ndvi_t2 - ndvi_t1\nthreshold = 0.15\nloss = diff < -threshold\ngain = diff > threshold\nno_change = ~loss & ~gain\n\nprint("NDVI Differencing Change Detection:")\nprint(f"  Vegetation loss: {loss.sum():,} pixels ({loss.mean()*100:.1f}%)")\nprint(f"  Vegetation gain: {gain.sum():,} pixels ({gain.mean()*100:.1f}%)")\nprint(f"  No change: {no_change.sum():,} pixels ({no_change.mean()*100:.1f}%)")\n\n# 2. Change Vector Analysis (CVA) with two bands\n# Simulated Red and NIR bands\nred_t1 = np.random.normal(800, 200, size)\nred_t2 = red_t1.copy()\nnir_t1 = np.random.normal(2500, 500, size)\nnir_t2 = nir_t1.copy()\nnir_t2[50:100, 50:100] -= 1000  # Built-up: NIR drops\nred_t2[50:100, 50:100] += 400   # Built-up: Red increases\n\n# Magnitude and direction\ndelta_red = red_t2 - red_t1\ndelta_nir = nir_t2 - nir_t1\nmagnitude = np.sqrt(delta_red**2 + delta_nir**2)\ndirection = np.arctan2(delta_nir, delta_red)  # radians\n\nmag_threshold = np.percentile(magnitude, 95)\nchange_pixels = magnitude > mag_threshold\nprint(f"\\nCVA Results:")\nprint(f"  Magnitude threshold (95th pct): {mag_threshold:.0f}")\nprint(f"  Changed pixels: {change_pixels.sum():,} ({change_pixels.mean()*100:.1f}%)")`,
      ],
      evidence: [
        'Hussain, M. et al. (2013). Change detection from remotely sensed images: From pixel-based to object-based approaches. ISPRS Journal of Photogrammetry and Remote Sensing, 80, 91–106.',
        'Zhu, Z. (2017). Change detection using Landsat time series: A review of frequencies, preprocessing, algorithms, and applications. ISPRS Journal of Photogrammetry and Remote Sensing, 130, 370–384.',
      ],
      limitations:
        'Atmospheric and phenological variations introduce false changes. ' +
        'Post-classification comparison propagates individual classification errors.',
      sdgAlignment: ['11.3.1'],
    },
    {
      id: 'rs-urban-expansion',
      title: 'Urban Expansion Mapping',
      sectionId: 'remote_sensing',
      summary:
        'Extract built-up area change from satellite time-series to quantify urban sprawl. ' +
        'Impervious surface mapping uses NDBI, spectral mixture analysis, or deep learning on VHR imagery. ' +
        'Time-series analysis reveals expansion rate, direction, and fragmentation patterns.',
      tags: ['remote_sensing', 'land_use', 'sprawl', 'density'],
      methodology:
        '1. Acquire multi-decadal imagery (Landsat 1984–present or Sentinel-2 2015–present).\n' +
        '2. Generate built-up masks per epoch using NDBI, thresholding, or ML classification.\n' +
        '3. Stack binary masks → urban expansion map with dates of urbanization.\n' +
        '4. Compute expansion metrics: rate (km²/yr), compactness index, Shannon entropy.\n' +
        '5. Overlay with administrative boundaries for per-district statistics.\n' +
        '6. Calculate Land Consumption Rate / Population Growth Rate (SDG 11.3.1).',
      tools: ['Google Earth Engine', 'rasterio', 'geopandas', 'momepy', 'matplotlib'],
      datasets: ['Global Human Settlement Layer (GHSL)', 'World Settlement Footprint (WSF)', 'Landsat archive'],
      examples: [
        'GHSL: global built-up area mapped at 30m resolution from Landsat 1975–2030 revealing 7.6% annual urban expansion rate for African cities',
        'Atlas of Urban Expansion (NYU): 200 cities worldwide monitored with Landsat showing average density decline of 2.1%/year',
        'World Settlement Footprint (DLR): global 10m binary settlement mask from Sentinel-1/2 fusion covering 2015–2019 with 86% accuracy',
      ],
      prompts: [
        `import numpy as np\nimport geopandas as gpd\nfrom shapely.geometry import box\n\n# Urban Expansion Analysis: multi-epoch comparison\nnp.random.seed(42)\n\n# Simulated built-up area masks for 4 epochs (binary arrays)\nsize = (300, 300)\npixel_size = 30  # meters\n\ndef simulate_urban(size, center, radius):\n    y, x = np.ogrid[:size[0], :size[1]]\n    dist = np.sqrt((x - center[0])**2 + (y - center[1])**2)\n    return (dist < radius) | (np.random.random(size) < 0.02)  # core + scattered\n\nepochs = {\n    1990: simulate_urban(size, (150, 150), 30),\n    2000: simulate_urban(size, (150, 150), 50),\n    2010: simulate_urban(size, (150, 150), 75),\n    2020: simulate_urban(size, (150, 150), 100),\n}\n\nprint("Urban Expansion Analysis:")\nprint(f"{'Epoch':<8} {'Built-up (km\u00b2)':>15} {'Growth (km\u00b2)':>13} {'Rate (%/yr)':>12}")\nprint("-" * 52)\n\nprev_area = None\nfor year, mask in epochs.items():\n    area_km2 = mask.sum() * pixel_size**2 / 1e6\n    if prev_area is not None:\n        growth = area_km2 - prev_area\n        rate = (area_km2 / prev_area - 1) * 100 / 10  # per year\n        print(f"{year:<8} {area_km2:>13.2f} {growth:>+13.2f} {rate:>10.1f}%")\n    else:\n        print(f"{year:<8} {area_km2:>13.2f} {'--':>13} {'--':>12}")\n    prev_area = area_km2\n\n# SDG 11.3.1: Land Consumption Rate / Population Growth Rate\n# LCR = ln(urban_t2 / urban_t1) / (t2 - t1)\n# PGR = ln(pop_t2 / pop_t1) / (t2 - t1)\nurban_2010 = epochs[2010].sum() * pixel_size**2 / 1e6\nurban_2020 = epochs[2020].sum() * pixel_size**2 / 1e6\npop_2010, pop_2020 = 1_500_000, 1_800_000  # hypothetical\nLCR = np.log(urban_2020 / urban_2010) / 10\nPGR = np.log(pop_2020 / pop_2010) / 10\nLCRPGR = LCR / PGR if PGR != 0 else float("inf")\nprint(f"\\nSDG 11.3.1:")\nprint(f"  LCR: {LCR:.4f}, PGR: {PGR:.4f}")\nprint(f"  LCR/PGR: {LCRPGR:.2f} ({'Sprawling' if LCRPGR > 1 else 'Compact growth'})")`,
      ],
      evidence: [
        'Angel, S. et al. (2011). Making Room for a Planet of Cities. Lincoln Institute of Land Policy.',
        'Pesaresi, M. et al. (2016). Operating procedure for the production of the Global Human Settlement Layer from Landsat data of the epochs 1975, 1990, 2000, and 2014. JRC Technical Report.',
      ],
      limitations:
        'Mixed pixels at urban fringes cause overestimation. Cloud-free composites are harder to create for tropical regions. ' +
        'Definition of "built-up" varies across studies.',
      sdgAlignment: ['11.3.1'],
    },
    {
      id: 'rs-land-surface-temperature',
      title: 'Land Surface Temperature',
      sectionId: 'remote_sensing',
      summary:
        'Derive Land Surface Temperature (LST) from Landsat Band 10/11 thermal infrared or MODIS. ' +
        'Emissivity correction using NDVI-based methods (Sobrino et al., 2004). ' +
        'Seasonal analysis reveals summertime Urban Heat Island intensity.',
      tags: ['remote_sensing', 'climate', 'heat_island'],
      methodology:
        '1. Convert Landsat Band 10 DN to Top-of-Atmosphere spectral radiance.\n' +
        '2. Convert radiance to brightness temperature using Planck inverse function.\n' +
        '3. Estimate land surface emissivity (ε) from NDVI: ε = 0.004 × Pv + 0.986.\n' +
        '4. Apply emissivity correction: LST = BT / (1 + (λ × BT / ρ) × ln(ε)).\n' +
        '5. Compute UHI intensity: ΔT = LST_urban − LST_rural.\n' +
        '6. Zonal statistics: mean LST per census tract or land cover class.\n' +
        '7. Repeat for multiple dates for seasonal/trend analysis.',
      tools: ['rasterio', 'xarray', 'numpy', 'QGIS', 'Google Earth Engine'],
      datasets: ['Landsat-8/9 Band 10 (100 m resampled to 30 m)', 'MODIS LST (MOD11A1, 1 km daily)'],
      examples: [
        'Phoenix urban heat: Landsat LST analysis showing 8\u00b0C day/night UHI differential driven by impervious surface fraction across 4 200 km\u00b2',
        'Athens heatwave: MODIS time-series documenting 12\u00b0C surface temperature anomaly during July 2023 heatwave affecting 3.7M residents',
        'Singapore cooling study: Sentinel-3 SLSTR LST mapped 3-5\u00b0C cooling effect of rooftop gardens in Bishan-Ang Mo Kio HDB estates',
      ],
      prompts: [
        `import numpy as np\n\n# Land Surface Temperature from Landsat 8/9 Thermal Band\n# Constants for Landsat 8 Band 10\nK1 = 774.8853  # calibration constant 1\nK2 = 1321.0789  # calibration constant 2\nML = 3.342e-4  # radiance multiplicative scaling\nAL = 0.1       # radiance additive scaling\n\ndef lst_from_landsat(dn_band10: np.ndarray, ndvi: np.ndarray) -> np.ndarray:\n    """Compute LST from Landsat 8 Band 10 using mono-window algorithm."""\n    # Step 1: DN to Top-of-Atmosphere spectral radiance\n    radiance = ML * dn_band10 + AL\n    \n    # Step 2: Radiance to Brightness Temperature (Kelvin)\n    bt = K2 / np.log(K1 / radiance + 1)\n    \n    # Step 3: NDVI-based emissivity estimation (Sobrino 2004)\n    pv = ((ndvi - 0.2) / (0.5 - 0.2)) ** 2  # vegetation proportion\n    pv = np.clip(pv, 0, 1)\n    emissivity = 0.004 * pv + 0.986\n    \n    # Step 4: Emissivity-corrected LST\n    wavelength = 10.9e-6  # Band 10 central wavelength (m)\n    rho = 1.438e-2  # h*c/sigma = 0.01438 m\u00b7K\n    lst = bt / (1 + (wavelength * bt / rho) * np.log(emissivity))\n    \n    return lst - 273.15  # Convert to Celsius\n\n# Demo with synthetic data\nnp.random.seed(42)\nsize = (100, 100)\n\n# Simulated DN values and NDVI\ndn = np.random.uniform(25000, 35000, size)  # typical Landsat 8 B10 DN range\nndvi = np.random.uniform(-0.1, 0.8, size)\n\n# Urban area: lower NDVI, higher temperature\nndvi[30:70, 30:70] = np.random.uniform(-0.1, 0.2, (40, 40))\ndn[30:70, 30:70] += 3000  # warmer urban core\n\nlst = lst_from_landsat(dn, ndvi)\nprint(f"LST range: {lst.min():.1f}\u00b0C to {lst.max():.1f}\u00b0C")\nprint(f"Mean LST: {lst.mean():.1f}\u00b0C")\n\n# UHI calculation\nurban_mask = ndvi < 0.2\nrural_mask = ndvi > 0.5\nuhi = lst[urban_mask].mean() - lst[rural_mask].mean()\nprint(f"\\nUrban mean LST: {lst[urban_mask].mean():.1f}\u00b0C")\nprint(f"Rural mean LST: {lst[rural_mask].mean():.1f}\u00b0C")\nprint(f"UHI intensity: {uhi:+.1f}\u00b0C")`,
      ],
      evidence: [
        'Sobrino, J. A. et al. (2004). Land surface temperature retrieval from LANDSAT TM 5. Remote Sensing of Environment, 90(4), 434–440.',
        'Voogt, J. A. & Oke, T. R. (2003). Thermal remote sensing of urban climates. Remote Sensing of Environment, 86(3), 370–384.',
      ],
      limitations:
        'Thermal bands have coarser spatial resolution than optical (100 m vs 10–30 m). ' +
        'Cloud cover prevents LST retrieval. Emissivity estimation introduces ±1–2 K uncertainty.',
      sdgAlignment: ['11.6.2', '13.1.1'],
    },
    {
      id: 'rs-data-fusion',
      title: 'Data Fusion',
      sectionId: 'remote_sensing',
      summary:
        'Combine data from multiple sensors to improve spatial, spectral, or temporal resolution. ' +
        'Pan-sharpening merges high-resolution panchromatic with multi-spectral bands. ' +
        'Optical + SAR (Sentinel-1) fusion overcomes cloud limitations. Temporal compositing fills gaps.',
      tags: ['remote_sensing', 'machine_learning'],
      methodology:
        '1. Pan-sharpening: Brovey, IHS, or Gram-Schmidt transform to fuse 15 m pan with 30 m MS (Landsat).\n' +
        '2. Optical-SAR fusion: stack Sentinel-2 bands with Sentinel-1 VV/VH for cloud-invariant classification.\n' +
        '3. Temporal compositing: pixel-wise median or best-available-pixel from multi-date stack.\n' +
        '4. Super-resolution: deep-learning upsample (e.g., SRCNN, ESRGAN) from 10 m to 2.5 m.\n' +
        '5. Validate fused product against reference imagery.\n' +
        '6. Assess spectral distortion (SAM, ERGAS metrics).',
      tools: ['rasterio', 'eo-learn', 'SNAP (ESA)', 'OTB (Orfeo ToolBox)', 'Google Earth Engine'],
      datasets: ['Sentinel-1 GRD/SLC', 'Sentinel-2 L2A', 'Landsat-8/9'],
      examples: [
        'Sentinel-Hub: operational pan-sharpening service producing 5m Sentinel-2 products from 10m + 20m bands for agricultural monitoring',
        'CropMonitor: optical-SAR fusion of Sentinel-1/2 maintaining crop classification accuracy at 89% even with 80% cloud cover periods',
        'Norway Satellite Data: temporal compositing of 150+ Sentinel-2 scenes/year to produce cloud-free annual mosaics for Arctic regions',
      ],
      prompts: [
        `import numpy as np\n\n# Data Fusion: Brovey Pan-sharpening\ndef brovey_pansharpen(pan: np.ndarray, r: np.ndarray, g: np.ndarray, b: np.ndarray) -> tuple:\n    """Brovey transform pan-sharpening.\n    Pan: high-res panchromatic, R/G/B: low-res multispectral.\n    All arrays must be same shape (upsample MS to pan resolution first)."""\n    total = r.astype(float) + g.astype(float) + b.astype(float) + 1e-10\n    r_sharp = (r / total * pan).astype(r.dtype)\n    g_sharp = (g / total * pan).astype(g.dtype)\n    b_sharp = (b / total * pan).astype(b.dtype)\n    return r_sharp, g_sharp, b_sharp\n\n# Demo\nnp.random.seed(42)\n# Simulated 15m panchromatic and 30m MS (upsampled to 15m)\nsize = (200, 200)\npan = np.random.uniform(100, 3000, size).astype(np.float32)\nred = np.random.uniform(200, 2000, size).astype(np.float32)\ngreen = np.random.uniform(300, 2500, size).astype(np.float32)\nblue = np.random.uniform(150, 1800, size).astype(np.float32)\n\nr_s, g_s, b_s = brovey_pansharpen(pan, red, green, blue)\nprint(f"Input Pan shape: {pan.shape}, MS shape: {red.shape}")\nprint(f"Output shape: {r_s.shape}")\n\n# Quality assessment: Spectral Angle Mapper (SAM)\ndef spectral_angle(original, fused):\n    dot = np.sum(original * fused)\n    norm_o = np.sqrt(np.sum(original**2))\n    norm_f = np.sqrt(np.sum(fused**2))\n    cos_angle = dot / (norm_o * norm_f + 1e-10)\n    return np.degrees(np.arccos(np.clip(cos_angle, -1, 1)))\n\norig_stack = np.stack([red, green, blue])\nfused_stack = np.stack([r_s, g_s, b_s])\nsam = spectral_angle(orig_stack.flatten(), fused_stack.flatten())\nprint(f"Spectral Angle (SAM): {sam:.2f}\u00b0 (lower = better spectral fidelity)")`,
      ],
      evidence: [
        'Ghamisi, P. et al. (2019). Multisource and multitemporal data fusion in remote sensing. IEEE Geoscience and Remote Sensing Magazine, 7(1), 6–39.',
        'Pohl, C. & Van Genderen, J. L. (2016). Remote Sensing Image Fusion: A Practical Guide. CRC Press.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 15.1'],
      limitations:
        'Fusion can introduce spectral artifacts. SAR speckle noise requires pre-filtering. ' +
        'Deep-learning methods need large training sets and may hallucinate detail.',
    },
    {
      id: 'rs-stac-cog-workflow',
      title: 'STAC Catalog & COG Workflow',
      sectionId: 'remote_sensing',
      summary:
        'Discover satellite imagery via SpatioTemporal Asset Catalog (STAC) APIs such as Microsoft Planetary Computer ' +
        'or Element 84 Earth Search. Load Cloud-Optimized GeoTIFF (COG) directly via HTTP range requests without ' +
        'downloading entire files—enabling efficient analysis at scale.',
      tags: ['remote_sensing', 'data_engineering'],
      methodology:
        '1. Query STAC API: filter by bbox, datetime, cloud cover %, collection (e.g., sentinel-2-l2a).\n' +
        '2. Browse returned items: inspect asset links (visual, SCL, individual bands).\n' +
        '3. Load COG bands lazily with rioxarray / stackstac (only requested pixels are fetched).\n' +
        '4. Build an xarray DataArray stack for multi-temporal analysis.\n' +
        '5. Apply index computation or classification on the lazy stack.\n' +
        '6. Export results to local GeoTIFF or cloud storage.\n' +
        '7. Pin reproducible environments with pystac-client + planetary-computer packages.',
      tools: ['pystac-client', 'stackstac', 'rioxarray', 'planetary-computer', 'odc-stac'],
      datasets: ['Microsoft Planetary Computer STAC', 'Element 84 Earth Search', 'Google Cloud Public Datasets'],
      examples: [
        'Microsoft Planetary Computer: hosting 30+ PB of COGs accessible via STAC API including Sentinel-2, Landsat, NAIP, and Aster',
        'Element 84 Earth Search v1: STAC API indexing 10+ years of Sentinel-2 and Landsat COGs on AWS S3 for free cloud-native processing',
        'Digital Earth Africa: STAC-based data cube serving Sentinel-2/Landsat COGs for entire African continent since 2017',
      ],
      prompts: [
        `# STAC + COG cloud-native workflow\nfrom pystac_client import Client\nimport planetary_computer\nimport stackstac\nimport numpy as np\n\n# 1. Connect to STAC API\ncatalog = Client.open(\n    "https://planetarycomputer.microsoft.com/api/stac/v1",\n    modifier=planetary_computer.sign_inplace,\n)\n\n# 2. Search for Sentinel-2 scenes\nsearch = catalog.search(\n    collections=["sentinel-2-l2a"],\n    bbox=[28.8, 40.9, 29.2, 41.2],  # Istanbul bbox\n    datetime="2024-06-01/2024-08-31",\n    query={"eo:cloud_cover": {"lt": 20}},\n)\nitems = search.item_collection()\nprint(f"Found {len(items)} scenes")\n\n# 3. Lazy-load as xarray (only metadata fetched, pixels on-demand)\nstack = stackstac.stack(\n    items,\n    assets=["B04", "B08"],  # Red + NIR for NDVI\n    resolution=10,\n    epsg=32636,\n)\nprint(f"Stack shape: {stack.shape}  (time, band, y, x)")\nprint(f"Resolution: 10m, CRS: EPSG:32636")\n\n# 4. Compute NDVI (lazy - no download yet)\nred = stack.sel(band="B04").astype(float)\nnir = stack.sel(band="B08").astype(float)\nndvi = (nir - red) / (nir + red)\n\n# 5. Temporal median composite (triggers download of only needed pixels)\nndvi_median = ndvi.median(dim="time")\nprint(f"\\nNDVI composite shape: {ndvi_median.shape}")\n\n# 6. Compute statistics (triggers actual data fetch)\n# ndvi_np = ndvi_median.compute().values\n# print(f"NDVI range: {np.nanmin(ndvi_np):.3f} to {np.nanmax(ndvi_np):.3f}")\nprint("Ready to .compute() - will fetch only required pixels via HTTP range requests")`,
      ],
      evidence: [
        'Holmes, C. (2022). Cloud-Optimized GeoTIFF specification. https://www.cogeo.org/',
        'Stern, A. et al. (2022). STAC specification v1.0. https://stacspec.org/',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 11.3'],
      limitations:
        'Network bandwidth limits throughput for large-area analyses. ' +
        'Not all data providers serve COGs—some still offer non-optimized GeoTIFFs. ' +
        'STAC metadata completeness varies across catalogs.',
    },
    {
      id: 'rs-google-earth-engine',
      title: 'Google Earth Engine Analysis',
      sectionId: 'remote_sensing',
      summary:
        'Perform serverless geospatial computation on petabyte-scale satellite archives using Google Earth Engine (GEE). ' +
        'Cloud/shadow masking, temporal reducers (median composite), and spatial reducers (zonal statistics) run on ' +
        'Google infrastructure—no local download required.',
      tags: ['remote_sensing', 'machine_learning', 'climate'],
      methodology:
        '1. Authenticate via ee.Authenticate() and ee.Initialize().\n' +
        '2. Load ImageCollection: ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").\n' +
        '3. Filter by date, bounds, cloud cover metadata.\n' +
        '4. Apply cloud/shadow mask using s2cloudless or QA60 band.\n' +
        '5. Compute per-pixel index (e.g., NDVI) with .normalizedDifference().\n' +
        '6. Temporal reduce: .median() composite for clean base layer.\n' +
        '7. Spatial reduce: .reduceRegions() for statistics per administrative zone.\n' +
        '8. Export results: ee.batch.Export.table.toDrive() or .toAsset().',
      tools: ['earthengine-api (Python)', 'geemap', 'GEE Code Editor (JavaScript)', 'rgee (R)'],
      datasets: ['Landsat 1–9 (1972–present)', 'Sentinel-1/2 (2014–present)', 'MODIS (2000–present)', 'SRTM DEM'],
      examples: [
        'Hansen Global Forest: GEE-powered annual deforestation map from Landsat covering entire globe 2000–2023 used by 100+ governments',
        'Pekel Global Surface Water: 32 years of Landsat processed on GEE mapping water occurrence at 30m for every pixel on Earth',
        'GHSL: GEE-based classification of Landsat archive extracting built-up area change for all 10 000+ urban areas globally 1975–2030',
      ],
      prompts: [
        `# Google Earth Engine - Python API\n# NOTE: Requires ee.Authenticate() and ee.Initialize() first\nimport ee\n\n# ee.Authenticate()\n# ee.Initialize(project='your-project')\n\n# 1. Define study area\nistanbul = ee.Geometry.Rectangle([28.5, 40.8, 29.4, 41.3])\n\n# 2. Load Sentinel-2 surface reflectance\ndef mask_clouds(image):\n    scl = image.select('SCL')\n    mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))\n    return image.updateMask(mask)\n\ns2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')\n    .filterBounds(istanbul)\n    .filterDate('2024-06-01', '2024-08-31')\n    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))\n    .map(mask_clouds))\n\nprint(f"Scenes found: {s2.size().getInfo()}")\n\n# 3. Compute NDVI\ndef add_ndvi(image):\n    ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')\n    return image.addBands(ndvi)\n\ns2_ndvi = s2.map(add_ndvi)\n\n# 4. Temporal composite\ncomposite = s2_ndvi.median().clip(istanbul)\n\n# 5. Zonal statistics per district\ndistricts = ee.FeatureCollection('FAO/GAUL/2015/level2').filterBounds(istanbul)\nstats = composite.select('NDVI').reduceRegions(\n    collection=districts,\n    reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), sharedInputs=True),\n    scale=10,\n)\nprint("Zonal NDVI stats computed for", districts.size().getInfo(), "districts")\n\n# 6. Export\n# task = ee.batch.Export.table.toDrive(\n#     collection=stats, description='istanbul_ndvi_stats',\n#     fileFormat='GeoJSON'\n# )\n# task.start()\nprint("Ready for export to Drive/Asset")`,
      ],
      evidence: [
        'Gorelick, N. et al. (2017). Google Earth Engine: Planetary-scale geospatial analysis for everyone. Remote Sensing of Environment, 202, 18–27.',
        'Tamiminia, H. et al. (2020). Google Earth Engine for geo-big data applications: A meta-analysis and systematic review. ISPRS Journal, 164, 152–170.',
      ],
      limitations:
        'Requires Google account and GEE access approval. Computation quotas apply for large exports. ' +
        'Results cannot be directly integrated into non-Google workflows without export step.',
      sdgAlignment: ['11.3.1', '15.1.1'],
    },
  ];
}
