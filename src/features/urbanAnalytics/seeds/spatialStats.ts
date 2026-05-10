import type { Card } from '../lib/types';

/**
 * Spatial Statistics seed cards.
 * 8 cards covering autocorrelation, clustering, regression,
 * interpolation, point patterns, and areal methods.
 */
export function buildSpatialStatsCards(_existing?: Set<string>): Card[] {
  return [
    {
      id: 'ss-morans-i',
      title: "Spatial Autocorrelation (Moran's I)",
      sectionId: 'spatial_stats',
      summary:
        "Moran's I quantifies spatial autocorrelation — the degree to which nearby observations are similar. " +
        'Global Moran\'s I yields a single statistic (−1 dispersed, 0 random, +1 clustered) with a pseudo p-value ' +
        'from permutation testing. Local Moran\'s I (Anselin, 1995) identifies specific clusters and spatial outliers.',
      tags: ['spatial_stats', 'equity'],
      methodology:
        '1. Define spatial weights matrix W (queen contiguity, k-nearest neighbors, or distance band).\n' +
        '2. Standardize variable of interest (z-scores).\n' +
        '3. Compute Global Moran\'s I = (N / ΣΣw_ij) × (Σ_i Σ_j w_ij z_i z_j / Σ_i z_i²).\n' +
        '4. Assess significance via 999 random permutations → pseudo p-value.\n' +
        '5. Interpret: I > E[I] = positive autocorrelation (clustering); I < E[I] = dispersion.\n' +
        '6. Map Local Moran\'s I (LISA) to reveal which specific areas drive the global pattern.\n' +
        '7. Report z-score, p-value, and Moran scatter plot (lag vs. value).',
      tools: ['PySAL (esda)', 'libpysal', 'geopandas', 'splot', 'GeoDa'],
      datasets: ['Census tracts with socioeconomic attributes', 'Grid cells with indicator values'],
      examples: [
        'Chicago crime: Global Moran\'s I = 0.68 (p<0.001) for assault rates across 801 census tracts revealing strong spatial clustering',
        'London house prices: Moran\'s I = 0.72 showing extreme price clustering; LISA maps identifying Kensington HH and East London LL clusters',
        'São Paulo: Moran\'s I analysis of COVID-19 death rates across 96 districts identifying socioeconomic clustering (I=0.45, p<0.001)',
      ],
      prompts: [
        `import geopandas as gpd\nimport libpysal\nfrom esda.moran import Moran, Moran_Local\nimport splot.esda as sp_esda\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Spatial Autocorrelation Analysis\n# Load census data (example: use any polygon dataset with numeric column)\n# gdf = gpd.read_file("census_tracts.gpkg")\n\n# Demo with random clustered data\nfrom libpysal.weights import lat2W\nnp.random.seed(42)\nn = 100\nw = lat2W(10, 10)  # 10x10 grid\nw.transform = "R"\n\n# Generate spatially clustered data\ny = np.random.normal(50, 10, n)\n# Add cluster\ny[44:47] += 30; y[54:57] += 30; y[64:67] += 30\n\n# Global Moran's I\nmi = Moran(y, w, permutations=999)\nprint(f"Global Moran's I: {mi.I:.4f}")\nprint(f"Expected I:       {mi.EI:.4f}")\nprint(f"Z-score:          {mi.z_sim:.4f}")\nprint(f"P-value (perm):   {mi.p_sim:.4f}")\nprint(f"Interpretation:   {'Clustered' if mi.I > mi.EI and mi.p_sim < 0.05 else 'Random'}")\n\n# Local Moran's I (LISA)\nlisa = Moran_Local(y, w, permutations=999)\nprint(f"\\nLISA cluster types:")\nlabels = ['Not Significant', 'HH', 'LH', 'LL', 'HL']\nfor q in range(5):\n    n_q = (lisa.q == q).sum()\n    sig = ((lisa.q == q) & (lisa.p_sim < 0.05)).sum()\n    print(f"  {labels[q]}: {n_q} total, {sig} significant (p<0.05)")`,
      ],
      evidence: [
        'Anselin, L. (1995). Local Indicators of Spatial Association — LISA. Geographical Analysis, 27(2), 93–115.',
        'Moran, P. A. P. (1950). Notes on continuous stochastic phenomena. Biometrika, 37(1-2), 17–23.',
      ],
      learningPath: {
        methodId: 'ss-morans-i',
        pathId: 'spatial_statistics_planners',
        explainerId: 'morans_i',
        concepts: ['spatial weights matrix', 'global autocorrelation', 'local cluster interpretation'],
        prerequisites: [
          'Polygon observations measured on a comparable analytical unit',
          'A defensible neighborhood definition and permutation strategy',
        ],
        intermediateValues: [
          {
            label: 'Spatially lagged values',
            description: 'Compare each observation against its weighted neighborhood before interpreting the final Moran statistic.',
            source: 'methodology',
          },
          {
            label: 'Permutation reference distribution',
            description: 'Inspect the simulated null distribution used to justify the pseudo p-value.',
            source: 'methodology',
          },
        ],
        interpretationPrompts: [
          'What part of the observed pattern is global clustering versus a small set of local clusters?',
          'How would the conclusion change under a different weights specification?',
        ],
      },
      sdgAlignment: ['SDG 10.2', 'SDG 11.1'],
      limitations:
        'Results are sensitive to choice of spatial weights (MAUP). ' +
        'Permutation p-values vary across runs; use ≥ 999 permutations. ' +
        'Assumes stationarity of the spatial process.',
    },
    {
      id: 'ss-lisa-clusters',
      title: 'LISA Clusters (Local Indicators)',
      sectionId: 'spatial_stats',
      summary:
        'Local Indicators of Spatial Association decompose global autocorrelation into per-location contributions. ' +
        'Each observation is classified into one of four cluster types: HH (high-high), HL (high-low), LH (low-high), ' +
        'LL (low-low), plus non-significant. Widely used for hot-spot detection and spatial inequality analysis.',
      tags: ['spatial_stats', 'equity', 'health'],
      methodology:
        '1. Compute spatial weights W (typically queen or k=8 nearest neighbors).\n' +
        '2. Standardize variable x to z-scores.\n' +
        "3. Calculate Local Moran's I_i = z_i × Σ_j w_ij z_j for each observation.\n" +
        '4. Determine significance via conditional permutation (999 draws).\n' +
        '5. Classify significant locations: HH (value & neighbors high), HL (high surrounded by low), etc.\n' +
        '6. Map clusters with standard four-color scheme (red HH, blue LL, pink HL, light-blue LH).\n' +
        '7. Apply Bonferroni or FDR correction for multiple testing.',
      tools: ['PySAL (esda)', 'splot', 'geopandas', 'GeoDa', 'R spdep'],
      datasets: ['Any polygon dataset with continuous numeric attribute'],
      examples: [
        'Chicago: LISA analysis of median income identifying persistent HH clusters on North Shore and LL clusters on South/West sides since 1970',
        'Rio de Janeiro: LISA mapping of homicide rates revealing 15 significant HH clusters concentrated in favela peripheries',
        'Barcelona: LISA clusters of Airbnb density showing HH hot spots in Gothic Quarter displacing 12% of long-term residents 2015-2019',
      ],
      prompts: [
        `import geopandas as gpd\nimport libpysal\nfrom esda.moran import Moran_Local\nimport matplotlib.pyplot as plt\nimport matplotlib.colors as mcolors\nimport numpy as np\n\n# LISA Cluster Map with significance filtering\nnp.random.seed(42)\nn = 400\nw = libpysal.weights.lat2W(20, 20)\nw.transform = "R"\n\n# Simulated spatially structured data\ny = np.random.normal(50, 10, n)\n# Inject clusters\ny[0:40] += 25  # HH cluster top-left\ny[360:400] -= 25  # LL cluster bottom-right\n\nlisa = Moran_Local(y, w, permutations=999)\n\n# Classification\nsig = lisa.p_sim < 0.05\ncluster_labels = np.full(n, 0)  # 0 = not significant\ncluster_labels[(lisa.q == 1) & sig] = 1  # HH\ncluster_labels[(lisa.q == 2) & sig] = 2  # LH\ncluster_labels[(lisa.q == 3) & sig] = 3  # LL\ncluster_labels[(lisa.q == 4) & sig] = 4  # HL\n\n# Summary\nlabels = {0: 'Not Significant', 1: 'HH (Hot Spot)', 2: 'LH (Spatial Outlier)',\n          3: 'LL (Cold Spot)', 4: 'HL (Spatial Outlier)'}\nfor k, v in labels.items():\n    count = (cluster_labels == k).sum()\n    print(f"{v}: {count} ({count/n*100:.1f}%)")\n\n# Significance summary\nprint(f"\\nBonferroni threshold (alpha=0.05, n={n}): {0.05/n:.6f}")\nprint(f"Significant at Bonferroni: {(lisa.p_sim < 0.05/n).sum()}")\nprint(f"Significant at p<0.05: {sig.sum()}")\nprint(f"Significant at p<0.01: {(lisa.p_sim < 0.01).sum()}")`,
      ],
      evidence: [
        'Anselin, L. (1995). Local Indicators of Spatial Association — LISA. Geographical Analysis, 27(2), 93–115.',
        'Anselin, L. & Rey, S. J. (2014). Modern Spatial Econometrics in Practice: A Guide to GeoDa, GeoDaSpace and PySAL. GeoDa Press.',
      ],
      sdgAlignment: ['SDG 10.2', 'SDG 11.1', 'SDG 3.9'],
      limitations:
        'Multiple testing inflates false positives without correction. ' +
        'Small sample sizes reduce statistical power. ' +
        'Edge effects can distort results near study area boundaries.',
    },
    {
      id: 'ss-getis-ord',
      title: 'Getis-Ord Gi* (Hot/Cold Spots)',
      sectionId: 'spatial_stats',
      summary:
        'The Getis-Ord Gi* statistic identifies statistically significant spatial clusters of high values (hot spots) ' +
        'and low values (cold spots). Unlike LISA, Gi* focuses on concentration of values rather than spatial outliers. ' +
        'Results are expressed as z-scores with associated p-values.',
      tags: ['spatial_stats', 'health', 'climate'],
      methodology:
        '1. Define distance band d or k-nearest neighbors for neighborhood definition.\n' +
        '2. For each location i, compute Gi*(d) = (Σ_j w_ij x_j − X̄ Σ_j w_ij) / (S √((n Σ_j w²_ij − (Σ_j w_ij)²) / (n−1))).\n' +
        '3. Gi* includes the self-value (diagonal of W); Gi excludes it.\n' +
        '4. Interpret z-scores: z > 1.96 → hot spot (95% confidence); z < −1.96 → cold spot.\n' +
        '5. Map results with diverging color ramp (blue cold → white neutral → red hot).\n' +
        '6. Sensitivity analysis: test multiple distance bands to assess stability.\n' +
        '7. Report confidence levels: 90%, 95%, 99%.',
      tools: ['PySAL (esda)', 'ArcGIS Pro (Hot Spot Analysis)', 'geopandas', 'GeoDa'],
      datasets: ['Crime incident points', 'Property values per parcel', 'Disease rates per census tract'],
      examples: [
        'NYPD CompStat: Gi* hot spot analysis of 500K+ crime incidents/year identifying 15 persistent hot spots driving 40% of all crime',
        'COVID-19 US counties: Gi* hot spots tracking pandemic spread revealing persistent mortality clusters in rural South (z>3.0)',
        'Phoenix urban heat island: Gi* analysis of 5 000 temperature sensors identifying extreme heat corridors along I-10/I-17 freeways',
      ],
      prompts: [
        `import numpy as np\nimport libpysal\nfrom esda.getisord import G_Local\n\n# Getis-Ord Gi* Hot Spot Analysis\nnp.random.seed(42)\nn = 400\nw = libpysal.weights.lat2W(20, 20)\nw.transform = "B"  # Binary weights for Gi*\n\n# Simulated data with hot and cold spots\ny = np.random.normal(100, 15, n)\ny[0:30] += 40   # Hot spot (top-left)\ny[370:400] -= 40  # Cold spot (bottom-right)\n\n# Compute Gi*\ngi = G_Local(y, w, transform="B", star=True, permutations=999)\n\n# Classify by confidence level\ndef classify_hotspot(z):\n    if z > 2.576: return "Hot Spot (99%)"\n    elif z > 1.960: return "Hot Spot (95%)"\n    elif z > 1.645: return "Hot Spot (90%)"\n    elif z < -2.576: return "Cold Spot (99%)"\n    elif z < -1.960: return "Cold Spot (95%)"\n    elif z < -1.645: return "Cold Spot (90%)"\n    else: return "Not Significant"\n\nclasses = [classify_hotspot(z) for z in gi.Zs]\nfrom collections import Counter\nfor cls, count in sorted(Counter(classes).items()):\n    print(f"{cls}: {count} ({count/n*100:.1f}%)")\n\nprint(f"\\nMax z-score: {gi.Zs.max():.2f} (strongest hot spot)")\nprint(f"Min z-score: {gi.Zs.min():.2f} (strongest cold spot)")\nprint(f"Mean z-score: {gi.Zs.mean():.2f}")`,
      ],
      evidence: [
        'Getis, A. & Ord, J. K. (1992). The analysis of spatial association by use of distance statistics. Geographical Analysis, 24(3), 189–206.',
        'Ord, J. K. & Getis, A. (1995). Local spatial autocorrelation statistics: distributional issues and an application. Geographical Analysis, 27(4), 286–306.',
      ],
      learningPath: {
        methodId: 'ss-getis-ord',
        pathId: 'spatial_statistics_planners',
        explainerId: 'getis_ord_gi',
        concepts: ['local hot-spot detection', 'confidence classes', 'distance-band sensitivity'],
        prerequisites: [
          'A declared distance band or neighborhood rule',
          'A variable whose local concentration is meaningful for intervention design',
        ],
        intermediateValues: [
          {
            label: 'Gi* z-score surface',
            description: 'Inspect the local z-score field before collapsing it into hot-spot classes.',
            source: 'methodology',
          },
        ],
        interpretationPrompts: [
          'Which hot spots remain stable when the neighborhood definition changes?',
          'Where do confidence classes overstate certainty for policy prioritization?',
        ],
      },
      sdgAlignment: ['SDG 11.7', 'SDG 3.9', 'SDG 16.1'],
      limitations:
        'Sensitive to distance band selection. Assumes underlying data are normally distributed for z-score interpretation. ' +
        'Does not distinguish between spatial outlier types (HH vs HL).',
    },
    {
      id: 'ss-gwr',
      title: 'Geographically Weighted Regression',
      sectionId: 'spatial_stats',
      summary:
        'GWR extends ordinary least squares (OLS) regression by allowing coefficients to vary spatially, ' +
        'capturing spatial non-stationarity. Each location gets its own set of regression coefficients weighted ' +
        'by a spatial kernel. Comparison of local R² values reveals where the model fits well or poorly.',
      tags: ['spatial_stats', 'machine_learning'],
      methodology:
        '1. Fit global OLS model first as baseline: check R², residual normality, VIF for multicollinearity.\n' +
        '2. Test for spatial non-stationarity using Koenker (BP) test on OLS residuals.\n' +
        '3. Select kernel type: Gaussian or bi-square; fixed or adaptive bandwidth.\n' +
        '4. Optimize bandwidth using AICc (corrected Akaike Information Criterion) or cross-validation.\n' +
        '5. Fit GWR: β_i = (X^T W_i X)^{-1} X^T W_i y, where W_i is spatial weight matrix centered at location i.\n' +
        '6. Map local coefficients, local R², and local residuals.\n' +
        '7. Compare global OLS AICc vs GWR AICc; lower = better fit.\n' +
        '8. Consider MGWR (Multi-scale GWR) for variable-specific bandwidths.',
      tools: ['mgwr (Python)', 'PySAL', 'GWR4 (standalone)', 'R GWmodel', 'ArcGIS Pro'],
      datasets: ['Census tracts with dependent + explanatory variables', 'Grid cells with continuous indicators'],
      examples: [
        'Fotheringham Beijing study: GWR of housing prices showing education access coefficient varying 5x between urban core and periphery',
        'US obesity rates: MGWR analysis across 3 100 counties revealing fast food density coefficient significant only in rural South',
        'London air quality: GWR of NO2 concentrations with local R² ranging from 0.3 (outer boroughs) to 0.85 (central congestion zone)',
      ],
      prompts: [
        `import numpy as np\nimport libpysal\nfrom mgwr.gwr import GWR\nfrom mgwr.sel_bw import Sel_BW\n\n# Geographically Weighted Regression\nnp.random.seed(42)\nn = 200\n\n# Simulated coordinates (random locations in study area)\ncoords = np.column_stack([np.random.uniform(0, 100, n), np.random.uniform(0, 100, n)])\n\n# Simulated data: y = b0 + b1*x1 + b2*x2 + e\n# Coefficients vary spatially\nb0 = 10 + coords[:, 0] * 0.2  # intercept increases east\nb1 = 3.0 - coords[:, 1] * 0.04  # x1 effect decreases north\nb2 = np.full(n, 1.5)  # x2 effect is constant (global)\n\nx1 = np.random.normal(50, 10, n)\nx2 = np.random.normal(30, 5, n)\nerror = np.random.normal(0, 5, n)\ny = b0 + b1 * x1 + b2 * x2 + error\n\n# Prepare for mgwr\nX = np.column_stack([x1, x2])\n\n# Select optimal bandwidth using AICc\nselector = Sel_BW(coords, y.reshape(-1, 1), X)\nbw = selector.search()\nprint(f"Optimal bandwidth: {bw:.0f}")\n\n# Fit GWR\nmodel = GWR(coords, y.reshape(-1, 1), X, bw=bw)\nresults = model.fit()\n\nprint(f"\\nGWR Results:")\nprint(f"AICc: {results.aicc:.1f}")\nprint(f"R²: {results.R2:.4f}")\nprint(f"Adj R²: {results.adj_R2:.4f}")\nprint(f"\\nLocal coefficient ranges:")\nfor i, name in enumerate(["Intercept", "x1", "x2"]):\n    coefs = results.params[:, i]\n    print(f"  {name}: min={coefs.min():.3f}, mean={coefs.mean():.3f}, max={coefs.max():.3f}")`,
      ],
      evidence: [
        'Fotheringham, A. S., Brunsdon, C. & Charlton, M. (2002). Geographically Weighted Regression: The Analysis of Spatially Varying Relationships. Wiley.',
        'Fotheringham, A. S., Yang, W. & Kang, W. (2017). Multiscale Geographically Weighted Regression (MGWR). Annals of the AAG, 107(6), 1247–1265.',
      ],
      sdgAlignment: ['SDG 11.3', 'SDG 10.2'],
      limitations:
        'Multicollinearity inflated at local scale. Computationally expensive for large datasets (O(n²)). ' +
        'Boundary effects distort coefficients near study area edges. Not suitable for discrete outcomes without extensions.',
    },
    {
      id: 'ss-kriging',
      title: 'Kriging & Spatial Interpolation',
      sectionId: 'spatial_stats',
      summary:
        'Kriging is a geostatistical interpolation method that provides Best Linear Unbiased Predictions (BLUP) ' +
        'along with prediction uncertainty (kriging variance). It uses a fitted variogram model to characterize ' +
        'spatial dependence. Compared to IDW, kriging accounts for spatial structure and provides error estimates.',
      tags: ['spatial_stats', 'climate', 'health'],
      methodology:
        '1. Exploratory analysis: histogram, trend surface, spatial distribution of sample points.\n' +
        '2. Compute experimental (semi)variogram: γ(h) = (1/2N(h)) Σ (z(s_i) − z(s_i + h))².\n' +
        '3. Fit theoretical variogram model: spherical, exponential, Gaussian, or Matérn.\n' +
        '4. Extract parameters: nugget (micro-scale variance), sill (total variance), range (correlation distance).\n' +
        '5. Perform ordinary kriging on prediction grid.\n' +
        '6. Map predicted surface and kriging standard error.\n' +
        '7. Validate with leave-one-out cross-validation: RMSE, MAE, mean error (bias).\n' +
        '8. Compare with IDW (p=1,2,3) to justify kriging selection.',
      tools: ['pykrige', 'scikit-gstat', 'gstat (R)', 'QGIS (Interpolation plugin)', 'ArcGIS Geostatistical Analyst'],
      datasets: ['Air quality monitoring stations', 'Soil contaminant samples', 'Rainfall gauge measurements'],
      examples: [
        'Swiss rainfall: ordinary kriging of 467 rain gauges producing 100m resolution precipitation maps with \u00b115% RMSE for Alpine hydrology',
        'California groundwater: kriging of 2 800 well measurements mapping nitrate contamination plumes across Central Valley aquifer',
        'Beijing PM2.5: universal kriging of 35 monitoring stations with elevation drift producing hourly air quality surfaces for 21M residents',
      ],
      prompts: [
        `import numpy as np\nfrom pykrige.ok import OrdinaryKriging\nimport matplotlib.pyplot as plt\n\n# Ordinary Kriging interpolation\nnp.random.seed(42)\n\n# Sample points (e.g., air quality monitoring stations)\nn_stations = 30\nx = np.random.uniform(0, 100, n_stations)\ny_coord = np.random.uniform(0, 100, n_stations)\n# Simulated spatially correlated values (PM2.5 \u00b5g/m\u00b3)\nz = 35 + 15 * np.sin(x/30) + 10 * np.cos(y_coord/25) + np.random.normal(0, 3, n_stations)\n\nprint(f"Sample stations: {n_stations}")\nprint(f"Value range: {z.min():.1f} - {z.max():.1f} \u00b5g/m\u00b3")\n\n# Fit variogram and krige\nOK = OrdinaryKriging(\n    x, y_coord, z,\n    variogram_model="spherical",\n    verbose=False,\n    enable_plotting=False,\n)\n\nprint(f"\\nVariogram parameters:")\nprint(f"  Nugget: {OK.variogram_model_parameters[2]:.2f}")\nprint(f"  Sill: {OK.variogram_model_parameters[0]:.2f}")\nprint(f"  Range: {OK.variogram_model_parameters[1]:.2f}")\n\n# Predict on regular grid\ngrid_x = np.arange(0, 101, 2)\ngrid_y = np.arange(0, 101, 2)\nz_pred, z_var = OK.execute("grid", grid_x, grid_y)\n\nprint(f"\\nPrediction grid: {z_pred.shape}")\nprint(f"Predicted range: {z_pred.min():.1f} - {z_pred.max():.1f} \u00b5g/m\u00b3")\nprint(f"Mean kriging std: {np.sqrt(z_var).mean():.2f} \u00b5g/m\u00b3")\n\n# Cross-validation (leave-one-out)\nerrors = []\nfor i in range(n_stations):\n    mask = np.ones(n_stations, bool); mask[i] = False\n    ok_cv = OrdinaryKriging(x[mask], y_coord[mask], z[mask], variogram_model="spherical", verbose=False, enable_plotting=False)\n    pred, _ = ok_cv.execute("points", [x[i]], [y_coord[i]])\n    errors.append(pred[0] - z[i])\nerrors = np.array(errors)\nprint(f"\\nLOO-CV: RMSE={np.sqrt((errors**2).mean()):.2f}, Mean Error={errors.mean():.3f}")`,
      ],
      evidence: [
        'Cressie, N. (1993). Statistics for Spatial Data (rev. ed.). Wiley.',
        'Webster, R. & Oliver, M. A. (2007). Geostatistics for Environmental Scientists, 2nd ed. Wiley.',
      ],
      sdgAlignment: ['SDG 3.9', 'SDG 11.6', 'SDG 13.1'],
      limitations:
        'Assumes second-order stationarity (constant mean and variance). ' +
        'Sensitive to variogram model choice. Computational cost grows cubically with sample size (O(n³) for kriging system). ' +
        'Poor extrapolation beyond sampled domain.',
    },
    {
      id: 'ss-point-pattern',
      title: 'Point Pattern Analysis',
      sectionId: 'spatial_stats',
      summary:
        'Analyze whether a point distribution (e.g., crime incidents, tree locations, retail stores) is clustered, ' +
        'dispersed, or random compared to Complete Spatial Randomness (CSR). Key functions: Ripley\'s K, ' +
        'Nearest Neighbor Index (NNI), and the L-function for easier interpretation.',
      tags: ['spatial_stats', 'health', 'economic'],
      methodology:
        '1. Define study window (bounding polygon) and point pattern.\n' +
        '2. Compute Nearest Neighbor Index: NNI = d̄_observed / d̄_expected. NNI < 1 = clustered; > 1 = dispersed.\n' +
        '3. Compute Ripley\'s K(r) = (A/n²) Σ_i Σ_{j≠i} I(d_ij ≤ r) × edge_correction.\n' +
        '4. Transform to L(r) = √(K(r)/π) − r for easier interpretation (L > 0 = clustering at distance r).\n' +
        '5. Generate CSR simulation envelope (99 or 999 Monte Carlo runs).\n' +
        '6. Plot observed L(r) vs. simulation envelope to identify significant clustering distances.\n' +
        '7. For marked patterns, use cross-K or mark correlation functions.',
      tools: ['PySAL (pointpats)', 'spatstat (R)', 'scikit-learn (DBSCAN for cluster extraction)'],
      datasets: ['Crime incident logs (geocoded)', 'POI datasets (OSM)', 'Tree inventory data'],
      examples: [
        'London Metropolitan Police: Ripley\'s K analysis of 800K knife crime incidents revealing significant clustering within 200m (L(200)=+45, p<0.001)',
        'NYC street tree census: point pattern analysis of 680K trees showing species-specific clustering linked to historic planting programmes',
        'Melbourne coffee shops: L-function analysis of 3 500 cafes showing significant clustering at 50-500m scales reflecting pedestrian-oriented commercial strips',
      ],
      prompts: [
        `import numpy as np\nfrom scipy.spatial import distance_matrix\n\n# Point Pattern Analysis: Nearest Neighbor Index + simplified K-function\nnp.random.seed(42)\n\n# Simulated point pattern (clustered crime incidents)\nn_points = 200\n# 3 clusters + background\ncenters = [(20, 20), (70, 80), (80, 30)]\npoints = []\nfor cx, cy in centers:\n    cluster = np.column_stack([\n        np.random.normal(cx, 8, 50),\n        np.random.normal(cy, 8, 50),\n    ])\n    points.append(cluster)\n# Background random points\npoints.append(np.random.uniform(0, 100, (50, 2)))\npoints = np.vstack(points)\nn = len(points)\n\n# Study area\narea = 100 * 100  # 100x100 units\ndensity = n / area\n\n# 1. Nearest Neighbor Index\ndists = distance_matrix(points, points)\nnp.fill_diagonal(dists, np.inf)\nnn_dists = dists.min(axis=1)\nmean_nn = nn_dists.mean()\nexpected_nn = 0.5 / np.sqrt(density)\nNNI = mean_nn / expected_nn\nse = 0.26136 / np.sqrt(n * density)\nz_nni = (mean_nn - expected_nn) / se\n\nprint(f"Points: {n}, Area: {area}, Density: {density:.4f}")\nprint(f"Mean NN distance: {mean_nn:.2f}")\nprint(f"Expected (CSR):   {expected_nn:.2f}")\nprint(f"NNI: {NNI:.4f} ({'Clustered' if NNI < 1 else 'Dispersed' if NNI > 1 else 'Random'})")\nprint(f"Z-score: {z_nni:.2f}, p < {'0.001' if abs(z_nni) > 3.29 else '0.01' if abs(z_nni) > 2.58 else '0.05' if abs(z_nni) > 1.96 else 'NS'}")\n\n# 2. Simplified K-function estimation\nprint(f"\\nK-function estimates:")\nfor r in [5, 10, 20, 30, 50]:\n    count = (dists < r).sum() / n\n    K_r = area * count / n\n    L_r = np.sqrt(K_r / np.pi) - r\n    print(f"  r={r:3d}: K(r)={K_r:8.1f}, L(r)-r={L_r:+6.2f} {'** clustered' if L_r > 0 else '   dispersed'}")`,
      ],
      evidence: [
        'Ripley, B. D. (1976). The second-order analysis of stationary point processes. Journal of Applied Probability, 13(2), 255–266.',
        'Diggle, P. J. (2003). Statistical Analysis of Spatial Point Patterns, 2nd ed. Hodder Arnold.',
      ],
      sdgAlignment: ['SDG 16.1', 'SDG 11.7'],
      limitations:
        'Sensitive to study window definition (edge effects). ' +
        'Assumes homogeneous intensity; use inhomogeneous K for varying density. ' +
        'Large point datasets (>100k) require computational optimization.',
    },
    {
      id: 'ss-areal-interpolation',
      title: 'Areal Interpolation',
      sectionId: 'spatial_stats',
      summary:
        'Transfer attribute data (e.g., population) from one set of spatial zones to another when boundaries don\'t align. ' +
        'Dasymetric mapping uses ancillary data (land cover, building footprints) to improve population distribution. ' +
        'Tobler\'s pycnophylactic method preserves volume (total population) while creating smooth surfaces.',
      tags: ['spatial_stats', 'equity', 'land_use'],
      methodology:
        '1. Area-weighted interpolation (simplest): apportion source value by geometric intersection area ratio.\n' +
        '2. Dasymetric refinement: mask uninhabitable areas (water, parks, industrial) before area weighting.\n' +
        '3. Binary dasymetric: inhabited vs. uninhabited mask from land cover data.\n' +
        '4. Multi-class dasymetric: weight by residential density class (high/medium/low from building footprints).\n' +
        '5. Tobler pycnophylactic: iterative smoothing that preserves zone totals.\n' +
        '6. Validate: compare interpolated values against known target-zone data where available.\n' +
        '7. Report RMSE and mean absolute percentage error (MAPE).',
      tools: ['tobler (PySAL)', 'geopandas', 'rasterstats', 'R areal package'],
      datasets: ['Census block groups → grid cells', 'Administrative districts → hexagonal bins'],
      examples: [
        'US Census LTDB: areal interpolation of 72 000 census tracts from 1970 to 2010 boundaries enabling 40-year longitudinal neighborhood analysis',
        'WorldPop: dasymetric population mapping for 200+ countries using building footprints and land cover at 100m resolution',
        'EU GEOSTAT: population disaggregation from NUTS-3 regions to 1km grid using Corine land cover ancillary data',
      ],
      prompts: [
        `import geopandas as gpd\nimport numpy as np\nfrom shapely.geometry import box\n\n# Areal interpolation: area-weighted vs dasymetric\n\n# Create source zones with population\nsource = gpd.GeoDataFrame({\n    "zone_id": ["A", "B", "C", "D"],\n    "population": [10000, 25000, 5000, 15000],\n    "geometry": [box(0,0,50,50), box(50,0,100,50), box(0,50,50,100), box(50,50,100,100)],\n}, crs="EPSG:32632")\nsource["src_area"] = source.geometry.area\n\n# Create target zones (shifted grid)\ntarget = gpd.GeoDataFrame({\n    "target_id": ["T1", "T2", "T3", "T4", "T5", "T6"],\n    "geometry": [box(0,0,33,50), box(33,0,66,50), box(66,0,100,50),\n                 box(0,50,33,100), box(33,50,66,100), box(66,50,100,100)],\n}, crs="EPSG:32632")\n\n# Simple area-weighted interpolation\nintersections = gpd.overlay(source, target, how="intersection")\nintersections["int_area"] = intersections.geometry.area\nintersections["weight"] = intersections["int_area"] / intersections["src_area"]\nintersections["pop_allocated"] = intersections["population"] * intersections["weight"]\n\nresult = intersections.groupby("target_id")["pop_allocated"].sum().reset_index()\nresult.columns = ["target_id", "estimated_pop"]\n\nprint("Area-Weighted Areal Interpolation:")\nprint(f"Source total: {source['population'].sum():,}")\nfor _, row in result.iterrows():\n    print(f"  {row['target_id']}: {row['estimated_pop']:,.0f}")\nprint(f"Target total: {result['estimated_pop'].sum():,.0f} (should equal source total)")\n\n# Volume preservation check\nassert abs(result["estimated_pop"].sum() - source["population"].sum()) < 1, "Volume not preserved!"\nprint("\\nVolume preservation: PASS")`,
      ],
      evidence: [
        'Tobler, W. (1979). Smooth Pycnophylactic Interpolation for Geographical Regions. Journal of the American Statistical Association, 74(367), 519–530.',
        'Mennis, J. (2003). Generating surface models of population using dasymetric mapping. The Professional Geographer, 55(1), 31–42.',
      ],
      sdgAlignment: ['SDG 17.18', 'SDG 11.1'],
      limitations:
        'Area-weighted method assumes uniform distribution within source zones. ' +
        'Dasymetric quality depends on ancillary data resolution. ' +
        'Ecological fallacy risk when disaggregating to very small target zones.',
    },
    {
      id: 'ss-spatial-regression',
      title: 'Spatial Regression Models',
      sectionId: 'spatial_stats',
      summary:
        'When OLS residuals exhibit spatial autocorrelation, spatial regression models account for dependence structure. ' +
        'Spatial Lag Model (SAR) adds a spatially lagged dependent variable (Wy); Spatial Error Model (SEM) models ' +
        'autocorrelation in the error term. Model selection uses Lagrange Multiplier (LM) tests.',
      tags: ['spatial_stats', 'machine_learning'],
      methodology:
        '1. Fit OLS model; test residuals for spatial autocorrelation (Moran\'s I on residuals).\n' +
        '2. If significant autocorrelation, compute LM diagnostics: LM-Lag, LM-Error, Robust LM-Lag, Robust LM-Error.\n' +
        '3. Decision rule: if only LM-Lag significant → SAR; if only LM-Error → SEM; if both → compare robust versions.\n' +
        '4. SAR model: y = ρWy + Xβ + ε. Coefficient ρ captures spatial spillover.\n' +
        '5. SEM model: y = Xβ + u, where u = λWu + ε. Coefficient λ captures spatially correlated omitted variables.\n' +
        '6. Estimate via Maximum Likelihood or GMM.\n' +
        '7. Compare models using AIC, BIC, and log-likelihood ratio test.\n' +
        '8. Report direct, indirect, and total effects for SAR (LeSage & Pace, 2009).',
      tools: ['PySAL (spreg)', 'R spatialreg/spdep', 'GeoDa', 'StataMP (spatial module)'],
      datasets: ['Census tracts with hedonic housing variables', 'Grid cells with environmental-health data'],
      examples: [
        'Anselin Boston housing: SAR model of 506 census tracts showing \u03c1=0.36 (p<0.001) for spatial lag of median house values',
        'Berlin rent prices: SEM controlling for spatially correlated neighborhood amenities reducing AIC by 340 vs OLS across 12 000 parcels',
        'Manila flood damage: SAR model capturing \u20b15.3B spatial spillover effects where neighboring barangay flooding increases local damage by 18%',
      ],
      prompts: [
        `import numpy as np\nimport libpysal\nfrom spreg import OLS, ML_Lag, ML_Error\nfrom esda.moran import Moran\n\n# Spatial Regression: OLS vs SAR vs SEM comparison\nnp.random.seed(42)\nn = 200\nw = libpysal.weights.lat2W(10, 20)\nw.transform = "R"\n\n# Generate spatially autocorrelated dependent variable\nx1 = np.random.normal(50, 10, n)\nx2 = np.random.normal(30, 5, n)\nX = np.column_stack([x1, x2])\n\n# True model: spatial lag process (rho=0.4)\nfrom scipy.sparse import eye\nfrom scipy.sparse.linalg import spsolve\nW_sparse = w.sparse\nrho_true = 0.4\nbeta = np.array([10, 0.5, 1.2])\nerror = np.random.normal(0, 5, n)\nXb = np.column_stack([np.ones(n), X]) @ beta + error\ny = spsolve(eye(n) - rho_true * W_sparse, Xb)\n\n# 1. OLS\nols = OLS(y.reshape(-1,1), X, w=w, name_y="house_price", name_x=["income", "school_dist"], spat_diag=True)\nprint("=== OLS ===")\nprint(f"R\u00b2: {ols.r2:.4f}, AIC: {ols.aic:.1f}")\n\n# 2. Test residuals for spatial autocorrelation\nresid = ols.u.flatten()\nmi_resid = Moran(resid, w, permutations=999)\nprint(f"Moran's I on OLS residuals: {mi_resid.I:.4f} (p={mi_resid.p_sim:.4f})")\n\n# 3. Spatial Lag Model (SAR)\nsar = ML_Lag(y.reshape(-1,1), X, w=w, name_y="house_price", name_x=["income", "school_dist"])\nprint(f"\\n=== SAR (Spatial Lag) ===")\nprint(f"Rho: {sar.rho:.4f} (true: {rho_true})")\nprint(f"AIC: {sar.aic:.1f}")\n\n# 4. Spatial Error Model (SEM)\nsem = ML_Error(y.reshape(-1,1), X, w=w, name_y="house_price", name_x=["income", "school_dist"])\nprint(f"\\n=== SEM (Spatial Error) ===")\nprint(f"Lambda: {sem.lam:.4f}")\nprint(f"AIC: {sem.aic:.1f}")\n\n# Model comparison\nprint(f"\\n=== Model Comparison ===")\nprint(f"OLS AIC: {ols.aic:.1f}")\nprint(f"SAR AIC: {sar.aic:.1f}")\nprint(f"SEM AIC: {sem.aic:.1f}")\nbest = min([("OLS", ols.aic), ("SAR", sar.aic), ("SEM", sem.aic)], key=lambda x: x[1])\nprint(f"Best model: {best[0]} (lowest AIC)")`,
      ],
      evidence: [
        'Anselin, L. (1988). Spatial Econometrics: Methods and Models. Kluwer Academic Publishers.',
        'LeSage, J. & Pace, R. K. (2009). Introduction to Spatial Econometrics. CRC Press.',
      ],
      sdgAlignment: ['SDG 11.1', 'SDG 10.2'],
      limitations:
        'Spatial weights matrix choice affects results (same MAUP concern). ' +
        'ML estimation assumes normality of errors. ' +
        'Large datasets (>50k observations) may require approximation methods (e.g., sparse matrix techniques).',
    },
  ];
}
