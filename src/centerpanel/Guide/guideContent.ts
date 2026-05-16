/**
 * guideContent.ts — Urban methodology guide definitions and content.
 *
 * Each MethodologyGuide is a self-contained reference sheet with abstract,
 * step-by-step methodology, assumptions, limitations, data requirements,
 * a Python example, interpretation notes, references, related indicators,
 * and optional SDG alignment.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GuideCategory =
  | "Spatial Statistics"
  | "Network Analysis"
  | "Remote Sensing"
  | "Urban Morphology"
  | "Transport Planning"
  | "Environmental Analysis"
  | "Socioeconomic"
  | "3D & Simulation"
  | "Data Engineering";

export interface MethodologyGuide {
  id: string;
  title: string;
  category: GuideCategory;
  abstract: string;
  methodology: string[];
  assumptions: string[];
  limitations: string[];
  dataRequirements: string[];
  pythonExample: string;
  interpretation: string;
  references: string[];
  relatedIndicators: string[];
  sdgAlignment?: string[];
}

/* ------------------------------------------------------------------ */
/*  Category metadata (icon + description)                             */
/* ------------------------------------------------------------------ */

export const GUIDE_CATEGORIES: {
  key: GuideCategory;
  icon: string;
  description: string;
}[] = [
  { key: "Spatial Statistics",      icon: "\u{1F4CA}", description: "Moran\u2019s I, LISA, GWR, Kriging, point pattern analysis" },
  { key: "Network Analysis",       icon: "\u{1F310}", description: "Centrality, isochrone, Space Syntax, graph metrics" },
  { key: "Remote Sensing",         icon: "\u{1F6F0}\uFE0F", description: "Spectral indices, classification, change detection" },
  { key: "Urban Morphology",       icon: "\u{1F3D7}\uFE0F", description: "Spacematrix, momepy, tessellation, fabric metrics" },
  { key: "Transport Planning",     icon: "\u{1F68C}", description: "GTFS, 4-step model, LOS, Complete Streets" },
  { key: "Environmental Analysis", icon: "\u{1F333}", description: "UHI, green infrastructure, stormwater, noise mapping" },
  { key: "Socioeconomic",          icon: "\u{1F4B0}", description: "Gentrification, segregation, affordability, equity" },
  { key: "3D & Simulation",        icon: "\u{1F3AE}", description: "VoxCity, CityGML, solar, wind CFD, ABM" },
  { key: "Data Engineering",       icon: "\u{1F5C4}\uFE0F", description: "OSM, census, GTFS, data quality, CRS management" },
];

/* ------------------------------------------------------------------ */
/*  Guide 1 — Spatial Autocorrelation (Moran's I)                      */
/* ------------------------------------------------------------------ */

const moransI: MethodologyGuide = {
  id: "guide_morans_i",
  title: "Spatial Autocorrelation (Moran\u2019s I)",
  category: "Spatial Statistics",
  abstract:
    "Moran\u2019s I is the most widely used measure of global spatial autocorrelation. " +
    "It quantifies the degree to which a variable measured at spatially distributed locations " +
    "deviates from a random spatial pattern. A positive I indicates spatial clustering of " +
    "similar values, while a negative I suggests a dispersed (checker-board) pattern. " +
    "Statistical significance is evaluated against the null hypothesis of complete spatial " +
    "randomness (CSR) using either permutation-based inference or a normal approximation. " +
    "The Local Moran\u2019s I (LISA) variant decomposes the global statistic into per-feature " +
    "contributions, enabling identification of hot-spots (HH), cold-spots (LL), and spatial " +
    "outliers (HL, LH).",

  methodology: [
    "1. Prepare a spatially referenced dataset (GeoDataFrame with polygon or point geometry) and select the variable of interest (e.g., median income, NDVI, walk score).",
    "2. Construct a spatial weights matrix W. Common choices include Queen contiguity (shared edge or vertex), Rook contiguity (shared edge only), and distance-band (all neighbours within d meters). Standardise W row-wise so each row sums to 1.",
    "3. Compute the global Moran\u2019s I statistic: I = (N / S0) \u00D7 (\u03A3\u1D62 \u03A3\u2C7C w\u1D62\u2C7C (x\u1D62 \u2013 x\u0305)(x\u2C7C \u2013 x\u0305)) / (\u03A3\u1D62 (x\u1D62 \u2013 x\u0305)\u00B2), where N is the number of observations, S0 is the sum of all weights, and x\u0305 is the mean.",
    "4. Assess significance: run 999 (or 9 999) random permutations of the attribute values, recompute I for each permutation, and derive a pseudo p-value as the proportion of simulated I values exceeding the observed I.",
    "5. Compute Local Moran\u2019s I\u1D62 for each feature i to identify clusters and outliers (HH, LL, HL, LH). Apply a Bonferroni or FDR correction for multiple testing.",
    "6. Produce a Moran scatter plot (standardised variable vs. spatial lag) and a LISA cluster map with significance threshold (p < 0.05 or p < 0.01).",
    "7. Interpret results in context: high global I (> 0.3) with p < 0.01 indicates strong clustering; LISA maps pinpoint where clusters occur spatially.",
  ],

  assumptions: [
    "The spatial process is stationary (mean and variance constant across the study area).",
    "Features are not isolated; the weights matrix must be connected (no islands).",
    "Inference assumes exchangeability of values under the permutation null, or normality under the analytical approach.",
    "The choice of weights matrix (contiguity vs. distance-band) can materially alter results\u2014sensitivity analysis is recommended.",
  ],

  limitations: [
    "Sensitive to the definition of spatial neighbours (Modifiable Areal Unit Problem applies).",
    "Global I summarises the entire map with a single number, potentially masking local heterogeneity.",
    "LISA significance can be inflated with many tests; corrections (FDR) reduce power.",
    "Does not capture higher-order spatial dependence or directional anisotropy.",
  ],

  dataRequirements: [
    "Spatially referenced polygons or points with a numeric attribute (continuous or count).",
    "Common sources: census tracts with socioeconomic variables, grid cells with NDVI values, hexagonal bins with POI counts.",
    "CRS must support meaningful distance calculations (projected CRS recommended for distance-band weights).",
  ],

  pythonExample: `import geopandas as gpd
from pysal.lib import weights
from pysal.explore import esda
import matplotlib.pyplot as plt

# Load study area with attribute
gdf = gpd.read_file("census_tracts.geojson")
y = gdf["median_income"].values

# Queen contiguity weights, row-standardised
w = weights.Queen.from_dataframe(gdf)
w.transform = "r"

# Global Moran's I (999 permutations)
mi = esda.Moran(y, w, permutations=999)
print(f"I = {mi.I:.4f}, p = {mi.p_sim:.4f}")

# Local Moran's I (LISA)
lisa = esda.Moran_Local(y, w, permutations=999)
gdf["lisa_q"] = lisa.q          # quadrant labels
gdf["lisa_p"] = lisa.p_sim      # pseudo p-values
sig = gdf[gdf["lisa_p"] < 0.05]

fig, ax = plt.subplots(1, 1, figsize=(10, 8))
sig.plot(column="lisa_q", categorical=True, ax=ax,
         legend=True, edgecolor="black", linewidth=0.3)
ax.set_title("LISA Clusters (p < 0.05)")
plt.tight_layout()
plt.savefig("lisa_clusters.png", dpi=150)`,

  interpretation:
    "A global Moran\u2019s I close to +1 indicates strong positive spatial autocorrelation\u2014similar values " +
    "cluster together. Values near 0 indicate spatial randomness, while negative values indicate dispersion. " +
    "On the LISA cluster map, HH (high-high) regions are hot-spots where the variable is high and surrounded " +
    "by high neighbours; LL (low-low) regions are cold-spots. HL and LH are spatial outliers. Always report " +
    "the weights definition used, the number of permutations, and the p-value threshold applied. Moran\u2019s I " +
    "values are not directly comparable across datasets with different weights structures.",

  references: [
    "Moran, P.A.P. (1950) Notes on continuous stochastic phenomena. Biometrika, 37(1-2), 17\u201323.",
    "Anselin, L. (1995) Local Indicators of Spatial Association\u2014LISA. Geographical Analysis, 27(2), 93\u2013115.",
    "Rey, S.J. & Anselin, L. (2007) PySAL: A Python Library of Spatial Analytical Methods. Review of Regional Studies, 37(1), 5\u201327.",
  ],

  relatedIndicators: ["gini_coefficient", "shannon_diversity", "ndvi"],
  sdgAlignment: ["SDG 10 \u2014 Reduced Inequalities", "SDG 11 \u2014 Sustainable Cities"],
};

/* ------------------------------------------------------------------ */
/*  Guide 2 — Walk Score Calculation                                   */
/* ------------------------------------------------------------------ */

const walkScore: MethodologyGuide = {
  id: "guide_walk_score",
  title: "Walk Score Calculation",
  category: "Network Analysis",
  abstract:
    "Walk Score is a composite index that measures the walkability of a location based on " +
    "network-distance proximity to nine categories of nearby amenities: grocery stores, " +
    "restaurants, shopping, coffee shops, banks, parks, schools, books/culture, and entertainment. " +
    "Scores range from 0 (car-dependent) to 100 (walker\u2019s paradise). The methodology weights " +
    "each category equally and applies a distance-decay function so that amenities beyond a " +
    "threshold distance contribute zero. Unlike straight-line buffers, a true Walk Score uses " +
    "the pedestrian street network to compute actual walking distances, accounting for barriers " +
    "such as highways, rivers, and dead-ends. Walk Score has been validated against mode-choice " +
    "data and is correlated with decreased VMT (Vehicle Miles Traveled), higher physical activity, " +
    "and increased property values.",

  methodology: [
    "1. Geocode the origin point (residential address or block-group centroid) and define the nine POI categories.",
    "2. Download the pedestrian street network within a 2 km radius of the origin using OSMnx. Remove motorway-only edges to reflect walkable paths.",
    "3. For each of the nine categories, retrieve the nearest POIs from OpenStreetMap (Overpass API) or a local POI database.",
    "4. Compute the shortest network distance from the origin to each POI using Dijkstra\u2019s algorithm on the pedestrian network graph.",
    "5. Apply a distance-decay function. The original Walk Score uses a piecewise linear decay:\n   \u2022 0\u2013400 m: full score (1.0)\n   \u2022 400\u20131 600 m: linear decay from 1.0 to 0.0\n   \u2022 >1 600 m: 0",
    "6. For each category, take the maximum decayed score among the closest 3 POIs (diminishing returns from additional amenities).",
    "7. Sum the nine category scores (each max 1.0, total max 9.0), normalise to [0, 100], and round to the nearest integer.",
    "8. Classify: 90\u2013100 Walker\u2019s Paradise, 70\u201389 Very Walkable, 50\u201369 Somewhat Walkable, 25\u201349 Car-Dependent, 0\u201324 Almost All Errands Require a Car.",
  ],

  assumptions: [
    "Walkability is defined purely by proximity to amenities, not by safety, sidewalk quality, slope, or aesthetics.",
    "All nine categories are weighted equally (no user-preference weighting).",
    "POI data from OSM may have coverage gaps in some cities or countries.",
    "The pedestrian network from OSM is assumed to be complete and topologically correct.",
  ],

  limitations: [
    "Does not account for pedestrian infrastructure quality (sidewalks, crossings, lighting, shade).",
    "Does not model perceived safety, crime data, or traffic danger.",
    "Relies heavily on OSM POI completeness\u2014results degrade in areas with sparse tagging.",
    "Equal weighting of categories may not reflect local preferences (e.g., coffee shops vs. healthcare).",
    "Does not model slope/terrain (which significantly impacts walkability in hilly cities).",
  ],

  dataRequirements: [
    "Pedestrian street network (OSMnx download for study area).",
    "POI dataset for nine categories (OpenStreetMap via Overpass, Google Places, or local cadastre).",
    "Origin points (residential addresses, block-group centroids, or grid points).",
    "Projected CRS for accurate network distance computation.",
  ],

  pythonExample: `import osmnx as ox
import networkx as nx
import numpy as np

def walk_score(lat: float, lon: float, pois: dict[str, list[tuple[float, float]]]) -> int:
    """Compute Walk Score for a single origin point."""
    G = ox.graph_from_point((lat, lon), dist=2000, network_type="walk")
    origin_node = ox.nearest_nodes(G, lon, lat)

    def decay(dist_m: float) -> float:
        if dist_m <= 400:
            return 1.0
        if dist_m >= 1600:
            return 0.0
        return 1.0 - (dist_m - 400) / 1200

    category_scores: list[float] = []
    for cat, locations in pois.items():
        decayed: list[float] = []
        for plat, plon in locations[:10]:
            dest = ox.nearest_nodes(G, plon, plat)
            try:
                d = nx.shortest_path_length(G, origin_node, dest, weight="length")
            except nx.NetworkXNoPath:
                continue
            decayed.append(decay(d))
        decayed.sort(reverse=True)
        # Diminishing returns: top-3 average
        top3 = decayed[:3]
        category_scores.append(sum(top3) / max(len(top3), 1))

    raw = sum(category_scores)
    normalised = min(100, round(raw / 9 * 100))
    return normalised`,

  interpretation:
    "A Walk Score of 90\u2013100 indicates a \u201CWalker\u2019s Paradise\u201D where daily errands do not require " +
    "a car. Scores below 50 mark car-dependent locations. When comparing Walk Scores across cities, " +
    "account for OSM POI density differences\u2014lower coverage areas may produce artificially low scores. " +
    "Walk Score is best used for relative comparison within a single city rather than cross-country benchmarks. " +
    "Pair Walk Score with pedestrian-level metrics (slope, shade, safety) for a more holistic walkability assessment.",

  references: [
    "Walk Score (2023) Walk Score Methodology. https://www.walkscore.com/methodology.shtml",
    "Duncan, D.T. et al. (2011) Validation of Walk Score for estimating neighborhood walkability. Annals of Behavioral Medicine, 42(2), 174\u2013184.",
    "Carr, L.J., Dunsiger, S.I., & Marcus, B.H. (2010) Walk Score as a global estimate of neighborhood walkability. American Journal of Preventive Medicine, 39(5), 460\u2013463.",
    "Moreno, C. et al. (2021) Introducing the \u201C15-Minute City\u201D: Sustainability, Resilience and Place Identity. Smart Cities, 4(1), 93\u2013111.",
  ],

  relatedIndicators: ["walk_score", "fifteen_min_city", "cumulative_opportunities"],
  sdgAlignment: ["SDG 11.2 \u2014 Sustainable Transport", "SDG 3 \u2014 Good Health and Well-being"],
};

/* ------------------------------------------------------------------ */
/*  Guide 3 — NDVI from Sentinel-2                                    */
/* ------------------------------------------------------------------ */

const ndviSentinel2: MethodologyGuide = {
  id: "guide_ndvi_sentinel2",
  title: "NDVI from Sentinel-2",
  category: "Remote Sensing",
  abstract:
    "The Normalized Difference Vegetation Index (NDVI) is the most widely used spectral index " +
    "for quantifying vegetation greenness and health. Computed as (NIR \u2013 RED) / (NIR + RED), " +
    "NDVI exploits the strong reflectance of healthy vegetation in the near-infrared (NIR) band " +
    "and its absorption of red light by chlorophyll. Values range from \u22121 to +1: bare soil and " +
    "water are typically below 0.2, sparse vegetation 0.2\u20130.4, moderate vegetation 0.4\u20130.6, " +
    "and dense healthy vegetation above 0.6. Sentinel-2 provides free, global, 10-metre " +
    "resolution multispectral imagery every 5 days, making it the standard data source for " +
    "urban NDVI studies. This guide covers the full workflow from image discovery through " +
    "cloud masking to per-pixel NDVI computation and zonal statistics.",

  methodology: [
    "1. Define the study area bounding box and time period. Use the Copernicus Data Space Ecosystem (CDSE) or Microsoft Planetary Computer STAC catalogue to search for Sentinel-2 Level-2A (surface-reflectance) products.",
    "2. Filter for cloud coverage < 20 % at the scene level. Download or stream the required bands: B4 (Red, 10 m) and B8 (NIR, 10 m). Optionally download the Scene Classification Layer (SCL) for per-pixel cloud masking.",
    "3. Apply cloud and shadow masking using the SCL band. Mask pixels classified as cloud (SCL = 8, 9), cloud shadow (SCL = 3), and snow (SCL = 11). This step is critical for accurate temporal composites.",
    "4. Compute NDVI per pixel: NDVI = (B8 \u2013 B4) / (B8 + B4). Handle division-by-zero edge cases by setting pixels where B8 + B4 = 0 to NDVI = 0.",
    "5. For temporal composites, compute the maximum (or median) NDVI over the time period to minimise residual cloud contamination and capture peak greenness.",
    "6. Clip the NDVI raster to the study area polygon. Reproject to a local projected CRS (e.g., UTM) for accurate area calculations.",
    "7. Compute zonal statistics (mean, median, standard deviation, percentiles) per administrative unit (census tract, neighbourhood, ward) using rasterstats or exactextract.",
    "8. Classify NDVI into interpretive bands: < 0.1 (water/bare), 0.1\u20130.2 (impervious), 0.2\u20130.4 (sparse vegetation), 0.4\u20130.6 (moderate), > 0.6 (dense vegetation). Produce a classified map and summary statistics table.",
  ],

  assumptions: [
    "Sentinel-2 Level-2A (BOA) surface reflectance has been atmospherically corrected by ESA\u2019s Sen2Cor processor.",
    "The SCL cloud mask is assumed to be accurate; in practice it may miss thin cirrus or bright surfaces.",
    "NDVI is a relative index\u2014absolute values may differ between sensors or seasons. Cross-sensor comparison requires harmonisation.",
    "Urban areas may have mixed pixels where a 10 m cell contains both vegetation and impervious surface.",
  ],

  limitations: [
    "NDVI saturates in dense tropical vegetation (values plateau above ~0.8).",
    "Shadows from tall buildings in urban canyons reduce NDVI values artificially.",
    "Seasonal variation is significant\u2014a single date may not represent annual greenness. Multi-temporal composites are recommended.",
    "10 m resolution may miss small street trees or private gardens; higher resolution (Planet, 3 m) or LiDAR-based canopy analysis may be needed.",
  ],

  dataRequirements: [
    "Sentinel-2 Level-2A imagery (B4, B8, SCL bands).",
    "Study area boundary polygon (GeoJSON or shapefile).",
    "Administrative boundaries for zonal statistics.",
    "Python packages: rasterio, rioxarray, pystac-client, planetary-computer, rasterstats.",
  ],

  pythonExample: `import pystac_client
import planetary_computer
import rioxarray
import numpy as np

# Connect to Planetary Computer STAC
catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=planetary_computer.sign_inplace,
)

# Search for Sentinel-2 L2A
search = catalog.search(
    collections=["sentinel-2-l2a"],
    bbox=[2.10, 41.35, 2.22, 41.42],  # Barcelona
    datetime="2024-06-01/2024-08-31",
    query={"eo:cloud_cover": {"lt": 20}},
)
items = list(search.items())
item = items[0]  # best scene

# Load bands
red = rioxarray.open_rasterio(item.assets["B04"].href).squeeze()
nir = rioxarray.open_rasterio(item.assets["B08"].href).squeeze()

# Compute NDVI
ndvi = (nir.astype(float) - red.astype(float)) / (nir + red).where(nir + red != 0, 1)
ndvi = ndvi.clip(-1, 1)
ndvi.rio.to_raster("ndvi_barcelona.tif")
print(f"Mean NDVI: {float(ndvi.mean()):.3f}")`,

  interpretation:
    "Mean NDVI above 0.3 for a city indicates reasonable green cover; below 0.2 signals a " +
    "predominantly impervious landscape. The WHO recommends at least 9 m\u00B2 of green space " +
    "per capita; NDVI zonal statistics by census tract can serve as a proxy when field survey " +
    "data is unavailable. Always report the acquisition date(s), cloud masking method, study " +
    "area CRS, and the sensor used. When comparing before/after NDVI for change detection, " +
    "use images from the same season and similar solar geometry.",

  references: [
    "Tucker, C.J. (1979) Red and photographic infrared linear combinations for monitoring vegetation. Remote Sensing of Environment, 8(2), 127\u2013150.",
    "Drusch, M. et al. (2012) Sentinel-2: ESA\u2019s Optical High-Resolution Mission for GMES Operational Services. Remote Sensing of Environment, 120, 25\u201336.",
    "Gorelick, N. et al. (2017) Google Earth Engine: planetary-scale geospatial analysis. Remote Sensing of Environment, 202, 18\u201327.",
  ],

  relatedIndicators: ["ndvi", "green_space_per_capita", "tree_canopy_coverage", "urban_heat_island"],
  sdgAlignment: ["SDG 11.7 \u2014 Public Open Space", "SDG 15 \u2014 Life on Land"],
};

/* ------------------------------------------------------------------ */
/*  Guide 4 — Street Network Analysis with OSMnx                      */
/* ------------------------------------------------------------------ */

const streetNetworkOSMnx: MethodologyGuide = {
  id: "guide_street_network_osmnx",
  title: "Street Network Analysis with OSMnx",
  category: "Network Analysis",
  abstract:
    "OSMnx is an open-source Python package that downloads, models, analyses, and visualises " +
    "street networks from OpenStreetMap. It returns a NetworkX MultiDiGraph suitable for graph-" +
    "theoretic analysis as well as a GeoDataFrame for spatial operations. Key metrics include " +
    "intersection density, dead-end ratio, average circuity, average block length, and centrality " +
    "measures (betweenness, closeness, PageRank). OSMnx supports walking, cycling, and driving " +
    "network types and can automatically simplify the topology to true intersections, removing " +
    "degree-2 nodes. This guide covers the standard workflow from network download to metric " +
    "computation and visualisation.",

  methodology: [
    "1. Install OSMnx (\u2265 1.9) and its dependencies (NetworkX, Shapely, GeoPandas). Define the study area by place name, bbox, polygon, or point buffer.",
    "2. Download the network: G = ox.graph_from_place(place, network_type='walk'). Choose network_type from 'walk', 'bike', 'drive', 'all'.",
    "3. Simplify the graph: ox.simplify_graph() consolidates complex intersections and removes degree-2 nodes, producing a cleaner topology.",
    "4. Project to a local CRS for accurate distance metrics: G_proj = ox.project_graph(G).",
    "5. Compute basic statistics: stats = ox.basic_stats(G_proj). Key outputs: n (nodes), m (edges), k_avg (average node degree), edge_length_total, street_density_km, intersection_density_km, circuity_avg, dead_end_proportion.",
    "6. Compute centrality measures:\n   \u2022 Betweenness centrality (edge): identifies critical corridors\n   \u2022 Closeness centrality: how central a node is to all others\n   \u2022 PageRank: importance accounting for network flow\n   Merge centrality values back to GeoDataFrame edges for mapping.",
    "7. Compute alpha (\u03B1 = (m \u2013 n + 1) / (2n \u2013 5)), beta (\u03B2 = m / n), and gamma (\u03B3 = m / (3(n \u2013 2))) connectivity indices from the simplified, undirected graph.",
    "8. Produce maps: colour edges by betweenness centrality, highlight dead-ends, show intersection density heatmap. Export as GeoPackage for GIS use.",
  ],

  assumptions: [
    "OSM road data is complete and topologically correct for the study area. Always visually validate in areas with limited mapping.",
    "Network simplification preserves the true topology of intersections and accurately merges divided roads.",
    "Travel speed/impedance is uniform unless a custom weight attribute is added to edges.",
    "Walking network excludes motorways; cycling network includes cycle-designated paths; driving network follows one-way rules.",
  ],

  limitations: [
    "OSM quality varies by region\u2014developed countries typically have more complete networks.",
    "Turn restrictions and traffic signals are not modelled in standard OSMnx routing.",
    "Large study areas (\u22651 000 km\u00B2) may require chunked downloads and careful graph merging.",
    "Centrality computation can be slow for very large graphs (> 100 000 edges); approximate betweenness may be needed.",
  ],

  dataRequirements: [
    "OpenStreetMap data (downloaded automatically by OSMnx via Overpass API).",
    "Study area boundary (place name, GeoJSON polygon, or bounding box).",
    "Python packages: osmnx (\u2265 1.9), networkx, geopandas, matplotlib.",
  ],

  pythonExample: `import osmnx as ox
import networkx as nx
import geopandas as gpd

# Download walk network for Barcelona's Eixample
G = ox.graph_from_place("Eixample, Barcelona, Spain", network_type="walk")
G_proj = ox.project_graph(G)
G_simp = ox.simplify_graph(G_proj)

# Basic stats
stats = ox.basic_stats(G_simp)
print(f"Nodes: {stats['n']}, Edges: {stats['m']}")
print(f"Avg degree: {stats['k_avg']:.2f}")
print(f"Circuity: {stats['circuity_avg']:.3f}")
print(f"Dead-end %: {stats['dead_end_proportion']:.2%}")

# Edge betweenness centrality
bc = nx.edge_betweenness_centrality(G_simp, weight="length")
nx.set_edge_attributes(G_simp, bc, "betweenness")

# Convert to GeoDataFrame and map
edges = ox.graph_to_gdfs(G_simp, nodes=False)
edges.plot(column="betweenness", cmap="plasma", linewidth=0.8,
           legend=True, figsize=(12, 12))`,

  interpretation:
    "Higher intersection density and average node degree indicate a more connected, walkable grid. " +
    "Average circuity near 1.0 means routes are close to straight-line; values above 1.3 suggest " +
    "a winding or cul-de-sac-heavy network. Dead-end proportions above 30 % typically indicate " +
    "suburban patterns. Edge betweenness centrality highlights corridors that carry disproportionate " +
    "traffic\u2014candidates for Complete Streets interventions. Alpha, beta, and gamma indices " +
    "provide standardised comparisons across cities: gamma close to 1.0 indicates a maximally " +
    "connected planar graph (rare in practice; typical grids score 0.4\u20130.6).",

  references: [
    "Boeing, G. (2017) OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks. Computers, Environment and Urban Systems, 65, 126\u2013139.",
    "Freeman, L.C. (1977) A Set of Measures of Centrality Based on Betweenness. Sociometry, 40(1), 35\u201341.",
    "Hillier, B. & Hanson, J. (1984) The Social Logic of Space. Cambridge University Press.",
    "Marshall, S. (2004) Streets and Patterns. Spon Press.",
  ],

  relatedIndicators: ["street_connectivity_alpha", "street_connectivity_beta", "street_connectivity_gamma"],
  sdgAlignment: ["SDG 11.2 \u2014 Sustainable Transport", "SDG 9 \u2014 Industry, Innovation and Infrastructure"],
};

/* ------------------------------------------------------------------ */
/*  Guide 5 — Multi-Hazard Vulnerability Assessment                    */
/* ------------------------------------------------------------------ */

const multiHazardVulnerability: MethodologyGuide = {
  id: "guide_multi_hazard_vulnerability",
  title: "Multi-Hazard Vulnerability Assessment",
  category: "Environmental Analysis",
  abstract:
    "A multi-hazard vulnerability assessment combines exposure to multiple natural hazards with " +
    "the social, economic, and physical sensitivity of populations and the adaptive capacity of " +
    "communities. The framework follows the IPCC AR6 risk equation: Risk = Hazard \u00D7 Exposure " +
    "\u00D7 Vulnerability, where Vulnerability = Sensitivity \u2013 Adaptive Capacity. This methodology " +
    "produces a composite spatial index that identifies areas where multiple hazard exposures " +
    "coincide with high social vulnerability and low adaptive capacity. Common hazard layers " +
    "include flood zones, urban heat islands, seismic risk, and sea-level rise. Sensitivity " +
    "indicators draw from census data (poverty, elderly, disability, linguistic isolation, " +
    "housing quality). Adaptive capacity includes infrastructure resilience, emergency services " +
    "proximity, and social capital. The output is a choropleth map at the census-tract or " +
    "neighbourhood scale highlighting priority intervention zones.",

  methodology: [
    "1. Identify relevant hazards for the study area. Common urban hazards: fluvial/pluvial flooding (from FEMA, JBA, or DEM-derived TWI), heat (from Landsat LST or UHI modelling), seismic (USGS/GSHAP PGA values), sea-level rise (DEM-based bathtub or NOAA SLR viewer).",
    "2. For each hazard, produce a normalised [0, 1] raster or polygon layer indicating hazard intensity. Use min-max normalisation or percentile ranking.",
    "3. Define exposure indicators: population density, building footprint density, critical infrastructure locations (hospitals, schools). Overlay exposure layers with hazard layers to compute Hazard \u00D7 Exposure per unit area.",
    "4. Define sensitivity indicators from census data: % population in poverty, % elderly (\u2265 65), % children (< 5), % disability, % linguistically isolated, % renters, % no vehicle, median housing age. Normalise each indicator to [0, 1].",
    "5. Define adaptive capacity indicators: hospital bed density, fire station response time, park/open space ratio, road network connectivity (beta index), educational attainment, internet access. Normalise to [0, 1] and invert (higher capacity \u2192 lower vulnerability).",
    "6. Aggregate each dimension using weighted summation or PCA (Principal Component Analysis). Compute Vulnerability = Sensitivity \u2013 Adaptive Capacity, then Risk = Hazard-Exposure \u00D7 Vulnerability.",
    "7. Classify the composite risk index into quintiles (Very Low, Low, Moderate, High, Very High). Produce a choropleth map and summary statistics by administrative unit.",
    "8. Conduct sensitivity analysis: vary indicator weights by \u00B120 % and measure rank stability (Spearman rank correlation between original and perturbed rankings). Report confidence intervals.",
  ],

  assumptions: [
    "Hazard layers represent current (or projected) conditions; they may not capture low-probability extreme events.",
    "Census-based sensitivity indicators assume spatial homogeneity within each census unit.",
    "Equal weighting of indicators is a baseline; Delphi or AHP expert-elicitation can improve relevance.",
    "Additive composite indices assume compensability (high score in one dimension can offset low in another).",
  ],

  limitations: [
    "Data availability and resolution vary between hazard types; harmonising to a common spatial unit introduces uncertainty.",
    "The choice of normalisation method (min-max vs. z-score) affects results, especially with outliers.",
    "Composite indices mask which specific hazard-vulnerability pathways drive overall risk. Decomposed maps are recommended alongside the composite.",
    "Static assessment does not model cascading failures or dynamic recovery trajectories.",
    "MAUP applies: results change with the spatial unit of analysis (tract vs. neighbourhood vs. grid).",
  ],

  dataRequirements: [
    "Hazard layers: flood zones (FEMA/JBA), LST rasters (Landsat), seismic hazard maps (USGS), DEM for SLR.",
    "Census data: ACS 5-year or equivalent for socioeconomic variables.",
    "Infrastructure: hospital, fire station, school locations (OSM or government open data).",
    "Study area boundaries at the desired spatial unit (census tract, hex grid, neighbourhood).",
    "Python packages: geopandas, rasterio, rasterstats, scikit-learn (for PCA), matplotlib.",
  ],

  pythonExample: `import geopandas as gpd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# Load census tracts with indicators
gdf = gpd.read_file("tracts_with_indicators.geojson")

# --- Sensitivity indicators ---
sens_cols = ["pct_poverty", "pct_elderly", "pct_disability",
             "pct_no_vehicle", "pct_renter"]
scaler = MinMaxScaler()
gdf[sens_cols] = scaler.fit_transform(gdf[sens_cols])
gdf["sensitivity"] = gdf[sens_cols].mean(axis=1)

# --- Adaptive capacity (invert: higher = less vulnerable) ---
cap_cols = ["hospital_beds_per_1k", "park_ratio", "road_beta"]
gdf[cap_cols] = scaler.fit_transform(gdf[cap_cols])
gdf["adaptive_capacity"] = gdf[cap_cols].mean(axis=1)

# --- Hazard-exposure (pre-computed, normalised 0-1) ---
# e.g., flood_exposure, heat_exposure already in gdf
gdf["hazard_exposure"] = (gdf["flood_exposure"] + gdf["heat_exposure"]) / 2

# --- Composite risk ---
gdf["vulnerability"] = gdf["sensitivity"] - gdf["adaptive_capacity"]
gdf["risk"] = gdf["hazard_exposure"] * gdf["vulnerability"]
gdf["risk_quintile"] = pd.qcut(gdf["risk"], 5, labels=[
    "Very Low", "Low", "Moderate", "High", "Very High"])

gdf.plot(column="risk_quintile", categorical=True, legend=True,
         cmap="RdYlGn_r", figsize=(12, 10), edgecolor="black", linewidth=0.3)`,

  interpretation:
    "Tracts classified as \u201CVery High\u201D risk are priority intervention zones where multiple hazard " +
    "exposures overlap with high social vulnerability and low adaptive capacity. These areas may " +
    "warrant targeted investments in green infrastructure (to mitigate heat), improved drainage " +
    "(for flood), emergency services expansion, and social support programmes. Always present " +
    "decomposed maps alongside the composite to show which specific hazard-vulnerability pathway " +
    "drives risk in each neighbourhood. Report the sensitivity analysis results: if rankings are " +
    "unstable under \u00B120 % weight perturbation, note this as a caveat.",

  references: [
    "IPCC (2022) Climate Change 2022: Impacts, Adaptation and Vulnerability. AR6 Working Group II.",
    "Cutter, S.L., Boruff, B.J. & Shirley, W.L. (2003) Social Vulnerability to Environmental Hazards. Social Science Quarterly, 84(2), 242\u2013261.",
    "Fekete, A. (2009) Validation of a social vulnerability index in context to river-floods in Germany. Natural Hazards and Earth System Sciences, 9(2), 393\u2013403.",
    "Birkmann, J. et al. (2013) Framing vulnerability, risk and societal responses: the MOVE framework. Natural Hazards, 67, 193\u2013211.",
  ],

  relatedIndicators: ["social_vulnerability_index", "flood_exposure", "compound_risk_index", "urban_heat_island"],
  sdgAlignment: ["SDG 11.5 \u2014 Disaster Impact Reduction", "SDG 13 \u2014 Climate Action"],
};

/* ------------------------------------------------------------------ */
/*  Guide 6 - Urban Morphology: Spacematrix                           */
/* ------------------------------------------------------------------ */

const spacematrixMorphology: MethodologyGuide = {
  id: "guide_spacematrix_morphology",
  title: "Spacematrix Urban Morphology",
  category: "Urban Morphology",
  abstract:
    "Spacematrix is a quantitative urban morphology framework that classifies blocks, plots, " +
    "or neighbourhoods by combining density and built-form indicators. The core variables are " +
    "floor-space index (FSI/FAR), ground-space index (GSI), open-space ratio (OSR), network " +
    "density, building height, and land-use mix. Unlike a single density metric, Spacematrix " +
    "distinguishes compact perimeter blocks, towers-in-the-park, low-rise sprawl, and dense " +
    "historic fabrics that may share similar FAR values but produce very different street-level " +
    "conditions. It is useful for comparing urban fabric types, identifying infill capacity, " +
    "and evaluating whether proposed development matches the morphological logic of its context.",

  methodology: [
    "1. Select the analysis unit: urban block, cadastral parcel, neighbourhood polygon, or regular grid. Blocks are preferred when street-facing morphology matters.",
    "2. Prepare building footprints with height or floor-count attributes. If only floor count is available, convert to approximate height using local floor-to-floor assumptions and record the assumption explicitly.",
    "3. Project all geometries to a local projected CRS before calculating area, perimeter, compactness, or distance. Never compute morphology metrics in EPSG:4326.",
    "4. Compute built footprint area per unit and total unit area. GSI = built footprint area / unit area.",
    "5. Estimate gross floor area. If floor count is available, gross floor area = footprint area x floor count. If height is available, floors = height / assumed floor height. FSI/FAR = gross floor area / unit area.",
    "6. Compute OSR = (unit area - built footprint area) / gross floor area. OSR captures the amount of open space per unit of floor area.",
    "7. Add network-context variables: street length per hectare, intersection density, block perimeter, and frontage ratio. These distinguish fine-grained fabric from large superblocks.",
    "8. Classify morphology using rule-based thresholds or clustering (k-means/GMM) on standardised FSI, GSI, OSR, height, and network density. Review clusters visually before naming typologies.",
  ],

  assumptions: [
    "Building footprint and height data are complete enough to estimate built volume.",
    "The selected spatial unit is meaningful for urban form; parcel, block, and grid analyses answer different questions.",
    "Gross floor area estimates from height/floor-count are approximations unless verified against cadastral floor-area data.",
    "Morphological typologies are context-specific and should be calibrated to local planning practice.",
  ],

  limitations: [
    "OSM building heights and levels are incomplete in many cities; LiDAR or cadastral data is preferable.",
    "FSI and GSI do not directly measure facade quality, active frontage, shade, or public realm performance.",
    "Mixed-use intensity and population density may not correlate with built density where vacancy or under-occupancy is high.",
    "Cluster labels can look precise but remain interpretive; always inspect representative geometries.",
  ],

  dataRequirements: [
    "Building footprints with height, floor count, or gross floor area attributes.",
    "Analysis units: blocks, parcels, neighbourhoods, or a regular projected grid.",
    "Street centerlines for network density and block delineation.",
    "Projected CRS suitable for local area and length calculations.",
  ],

  pythonExample: `import geopandas as gpd
import pandas as pd

blocks = gpd.read_file("blocks.geojson").to_crs(32633)
buildings = gpd.read_file("buildings.geojson").to_crs(blocks.crs)

# Approximate floors from height when explicit floor count is missing.
buildings["floors"] = buildings["levels"].fillna(buildings["height_m"] / 3.2)
buildings["footprint_m2"] = buildings.geometry.area
buildings["gfa_m2"] = buildings["footprint_m2"] * buildings["floors"].clip(lower=1)

joined = gpd.overlay(buildings, blocks[["block_id", "geometry"]], how="intersection")
joined["intersect_footprint_m2"] = joined.geometry.area
joined["intersect_gfa_m2"] = joined["intersect_footprint_m2"] * joined["floors"].clip(lower=1)

agg = joined.groupby("block_id").agg(
    built_m2=("intersect_footprint_m2", "sum"),
    gfa_m2=("intersect_gfa_m2", "sum"),
    mean_height=("height_m", "mean"),
).reset_index()

out = blocks.merge(agg, on="block_id", how="left").fillna({"built_m2": 0, "gfa_m2": 0})
out["area_m2"] = out.geometry.area
out["gsi"] = out["built_m2"] / out["area_m2"]
out["fsi"] = out["gfa_m2"] / out["area_m2"]
out["osr"] = (out["area_m2"] - out["built_m2"]) / out["gfa_m2"].replace(0, pd.NA)
out.to_file("spacematrix_blocks.gpkg", layer="blocks", driver="GPKG")`,

  interpretation:
    "High FSI with moderate GSI often indicates compact mid-rise or perimeter-block fabric; high FSI with low GSI " +
    "indicates towers or slabs; low FSI with low GSI indicates low-density open development. Interpret OSR together " +
    "with GSI: a high open-space ratio may signal generous courtyards, but it can also indicate underbuilt land. " +
    "Always report the analysis unit, projected CRS, height/floor assumptions, and whether gross floor area is measured " +
    "or estimated.",

  references: [
    "Berghauser Pont, M. & Haupt, P. (2010) Spacematrix: Space, Density and Urban Form. NAi Publishers.",
    "Oliveira, V. (2016) Urban Morphology: An Introduction to the Study of the Physical Form of Cities. Springer.",
    "Fleischmann, M. et al. (2022) Methodological foundation of a numerical taxonomy of urban form. Environment and Planning B, 49(4), 1283-1299.",
  ],

  relatedIndicators: ["floor_space_index", "ground_space_index", "open_space_ratio", "intersection_density"],
  sdgAlignment: ["SDG 11.3 \u2014 Inclusive and Sustainable Urbanization"],
};

/* ------------------------------------------------------------------ */
/*  Guide 7 - Transport Planning: GTFS Accessibility                  */
/* ------------------------------------------------------------------ */

const gtfsAccessibility: MethodologyGuide = {
  id: "guide_gtfs_transit_accessibility",
  title: "GTFS Transit Accessibility",
  category: "Transport Planning",
  abstract:
    "GTFS-based accessibility analysis measures what people can reach by public transport within " +
    "a given time budget. Unlike static stop buffers, schedule-aware accessibility accounts for " +
    "departure time, waiting time, transfers, walking access, route frequency, and service calendars. " +
    "The most common outputs are cumulative-opportunity measures (jobs, schools, clinics, parks " +
    "reachable within 30/45/60 minutes), travel-time matrices, and isochrone maps. This method is " +
    "central to equity analysis because it connects transport supply to actual destinations and " +
    "population groups.",

  methodology: [
    "1. Acquire a valid GTFS feed, destination opportunities, population origins, and a walkable street network. Validate feed dates and service calendars before analysis.",
    "2. Choose origin units such as census block centroids, residential parcels, or a hex grid. Snap origins and stops to a walk network, not Euclidean distance.",
    "3. Select representative departure windows. Morning peak, midday, evening, and weekend analyses often produce different accessibility surfaces.",
    "4. Build a multimodal router or use a routing engine such as R5, OpenTripPlanner, r5py, or Conveyal. Include walking access/egress and transfer penalties.",
    "5. Compute travel-time matrices from every origin to every destination opportunity for each departure window.",
    "6. Calculate cumulative opportunities: count opportunities reachable within a threshold, such as jobs within 45 minutes or clinics within 30 minutes.",
    "7. Calculate gravity accessibility if destination attractiveness and time decay are known: A_i = sum_j O_j f(c_ij), where f(c) is a travel-time decay function.",
    "8. Map accessibility and compare by income, race/ethnicity, age, disability, or car ownership groups. Report both absolute accessibility and accessibility gaps.",
  ],

  assumptions: [
    "The GTFS feed accurately represents scheduled service on the analysed date.",
    "Walking access speed, transfer penalties, and maximum walking distance are realistic for the target population.",
    "Opportunity datasets represent real usable destinations, not just geocoded points.",
    "Census centroids are acceptable proxies for residential origins at the chosen spatial scale.",
  ],

  limitations: [
    "Static GTFS does not include real-time delays, crowding, cancelled trips, or vehicle capacity.",
    "Stop buffers overstate access when pedestrian barriers exist; network walking is required.",
    "Accessibility thresholds are policy choices and should be tested for sensitivity.",
    "Centroid-based origins can misrepresent large rural tracts or irregular urban parcels.",
  ],

  dataRequirements: [
    "GTFS schedule feed with valid calendar, routes, trips, stop_times, and stops files.",
    "Street network suitable for walking access and egress.",
    "Destination opportunity layer: jobs, schools, clinics, grocery stores, or parks.",
    "Population/equity attributes for origins when analysing distributional outcomes.",
    "Projected CRS for walking distances and origin/destination geometry QA.",
  ],

  pythonExample: `import geopandas as gpd
import pandas as pd

# This example assumes a travel-time matrix generated by r5py/OTP/R5.
# Columns: origin_id, destination_id, travel_time_min
ttm = pd.read_parquet("transit_travel_time_matrix.parquet")
dest = gpd.read_file("jobs_by_destination.geojson")[["destination_id", "jobs"]]
origins = gpd.read_file("origin_hexes.geojson")

reachable = (
    ttm[ttm["travel_time_min"] <= 45]
    .merge(dest, on="destination_id", how="left")
    .groupby("origin_id")["jobs"]
    .sum()
    .rename("jobs_45min_transit")
    .reset_index()
)

out = origins.merge(reachable, on="origin_id", how="left")
out["jobs_45min_transit"] = out["jobs_45min_transit"].fillna(0)
out.to_file("transit_accessibility_45min.gpkg", layer="origins", driver="GPKG")`,

  interpretation:
    "A high cumulative-opportunity score means an origin can reach many destinations within the chosen time budget. " +
    "Do not interpret it as service quality alone: high accessibility can result from dense destinations, frequent " +
    "service, or both. Compare peak and off-peak results to detect temporal inequity, and report accessibility gaps " +
    "between demographic groups rather than only citywide averages.",

  references: [
    "Hansen, W.G. (1959) How Accessibility Shapes Land Use. Journal of the American Institute of Planners, 25(2), 73-76.",
    "Owen, A. & Levinson, D. (2015) Modeling the commute mode share of transit using continuous accessibility to jobs. Transportation Research Part A, 74, 110-122.",
    "Conway, M.W., Byrd, A. & van Eggermond, M. (2018) Accounting for uncertainty and variation in accessibility metrics for public transport sketch planning. Journal of Transport and Land Use, 11(1), 541-558.",
  ],

  relatedIndicators: ["jobs_access_45min_transit", "transit_service_frequency", "accessibility_gap", "fifteen_min_city"],
  sdgAlignment: ["SDG 11.2 \u2014 Sustainable Transport", "SDG 10 \u2014 Reduced Inequalities"],
};

/* ------------------------------------------------------------------ */
/*  Guide 8 - Socioeconomic: Displacement Risk                        */
/* ------------------------------------------------------------------ */

const displacementRiskIndex: MethodologyGuide = {
  id: "guide_displacement_risk_index",
  title: "Displacement Risk Index",
  category: "Socioeconomic",
  abstract:
    "A displacement risk index identifies neighbourhoods where vulnerable households are exposed " +
    "to rising housing-market pressure and have limited capacity to remain in place. It combines " +
    "sensitivity indicators such as renter share, poverty, rent burden, low income, linguistic " +
    "isolation, and historic marginalisation with pressure indicators such as rent growth, sale " +
    "price appreciation, building permits, transit investment, and demographic turnover. The result " +
    "is not a causal proof of displacement; it is a screening tool for prioritising anti-displacement " +
    "policy, tenant protection, affordable housing acquisition, and community benefit agreements.",

  methodology: [
    "1. Define the spatial unit, usually census tracts, block groups, or neighbourhoods. Keep the unit stable across time when analysing trends.",
    "2. Compile sensitivity indicators: renter share, rent burden, low-income households, poverty, disability, elderly residents, households without vehicles, and linguistic isolation.",
    "3. Compile market-pressure indicators: rent growth, assessed value growth, sale price growth, permit intensity, new-build share, and proximity to new transit or major public investment.",
    "4. Compile demographic-change indicators: change in educational attainment, income, race/ethnicity composition, household size, and tenure.",
    "5. Normalise each indicator to [0, 1] using percentile ranks or robust min-max scaling. Invert indicators where lower values imply higher risk.",
    "6. Compute component scores: vulnerability, market pressure, and demographic change. Use transparent weights or principal component analysis; document the choice.",
    "7. Combine the components into a risk index and classify into quantiles. Report decomposed component maps next to the composite score.",
    "8. Validate qualitatively with local knowledge, eviction filings, tenant hotline data, or community organisation feedback when available.",
  ],

  assumptions: [
    "Census and housing market indicators are timely enough to represent current risk.",
    "The selected indicators reflect local displacement mechanisms; no universal indicator set fits every city.",
    "Composite scoring is a screening method, not a causal model of household moves.",
    "Data suppression, margins of error, and boundary changes are handled explicitly.",
  ],

  limitations: [
    "Displacement is often hidden; households may move before appearing in administrative data.",
    "ACS margins of error can be large for small areas and should be propagated or flagged.",
    "Market datasets may omit informal rental markets or non-arms-length transactions.",
    "Composite risk categories can stigmatise areas if communicated without policy context.",
  ],

  dataRequirements: [
    "Census or survey socioeconomic indicators with margins of error where available.",
    "Rent, sale price, assessed value, permit, eviction, or complaint datasets.",
    "Stable boundaries or crosswalks for time-series comparison.",
    "Local projected CRS for spatial joins to transit stations, permits, and investment areas.",
  ],

  pythonExample: `import geopandas as gpd
import pandas as pd
from sklearn.preprocessing import RobustScaler

tracts = gpd.read_file("tracts_displacement_inputs.geojson")

vulnerability_cols = ["pct_renter", "pct_rent_burdened", "pct_low_income", "pct_limited_english"]
pressure_cols = ["rent_growth_5yr", "permit_units_per_acre", "sale_price_growth_5yr"]
change_cols = ["income_growth_5yr", "bachelor_degree_growth_5yr"]

def robust_01(frame, cols):
    scaled = RobustScaler().fit_transform(frame[cols].fillna(frame[cols].median()))
    out = pd.DataFrame(scaled, columns=cols, index=frame.index)
    return out.rank(pct=True)

tracts["vulnerability"] = robust_01(tracts, vulnerability_cols).mean(axis=1)
tracts["market_pressure"] = robust_01(tracts, pressure_cols).mean(axis=1)
tracts["demographic_change"] = robust_01(tracts, change_cols).mean(axis=1)

tracts["displacement_risk"] = (
    0.45 * tracts["vulnerability"] +
    0.40 * tracts["market_pressure"] +
    0.15 * tracts["demographic_change"]
)
tracts["risk_class"] = pd.qcut(tracts["displacement_risk"], 5, labels=[
    "Very Low", "Low", "Moderate", "High", "Very High"])
tracts.to_file("displacement_risk.gpkg", layer="tracts", driver="GPKG")`,

  interpretation:
    "High-risk areas are places where vulnerable households and market pressure overlap. A high market-pressure " +
    "score with low vulnerability may indicate reinvestment without immediate displacement risk; high vulnerability " +
    "with low pressure may indicate chronic housing stress rather than imminent displacement. Always show component " +
    "scores and uncertainty, and avoid presenting the index as a prediction of individual household outcomes.",

  references: [
    "Bates, L.K. (2013) Gentrification and Displacement Study: Implementing an Equitable Inclusive Development Strategy in the Context of Gentrification. City of Portland.",
    "Zuk, M. et al. (2018) Gentrification, Displacement, and the Role of Public Investment. Journal of Planning Literature, 33(1), 31-44.",
    "Chapple, K. & Zuk, M. (2016) Forewarned: The Use of Neighborhood Early Warning Systems for Gentrification and Displacement. Cityscape, 18(3), 109-130.",
  ],

  relatedIndicators: ["displacement_risk", "rent_burden", "housing_affordability", "eviction_rate"],
  sdgAlignment: ["SDG 11.1 \u2014 Adequate, Safe and Affordable Housing", "SDG 10 \u2014 Reduced Inequalities"],
};

/* ------------------------------------------------------------------ */
/*  Guide 9 - 3D & Simulation: Solar Access                           */
/* ------------------------------------------------------------------ */

const solarAccess3D: MethodologyGuide = {
  id: "guide_3d_solar_access",
  title: "3D Solar Access and Shadow Simulation",
  category: "3D & Simulation",
  abstract:
    "3D solar access analysis estimates how building massing, terrain, and street geometry affect " +
    "direct sun exposure, shadow duration, and photovoltaic potential. It is used for daylight " +
    "ordinances, public-space comfort, winter solar access protection, rooftop PV screening, and " +
    "massing-option comparison. The method requires georeferenced 3D geometry and time-aware solar " +
    "position calculations. For planning use, outputs are usually sun-hours maps, shadow-frequency " +
    "rasters, facade exposure summaries, and rooftop irradiance rankings.",

  methodology: [
    "1. Prepare 3D geometry: buildings as LoD1/LoD2 solids, roof surfaces, terrain, and public-space polygons. Ensure all geometry is valid and in a projected CRS.",
    "2. Select analysis dates and times. Common choices are solstices/equinoxes, local ordinance dates, or hourly annual simulations.",
    "3. Compute solar position for each timestamp using latitude, longitude, timezone, and atmospheric assumptions.",
    "4. For shadow analysis, cast rays from sun direction against the 3D scene and record whether each ground or facade sample point is occluded.",
    "5. For rooftop PV screening, compute incident irradiance per roof plane using slope, aspect, horizon obstruction, and weather/clear-sky assumptions.",
    "6. Aggregate results: annual sun-hours, winter sun-hours, percent time shaded, or kWh/m2/year by surface.",
    "7. Compare scenarios: existing condition, proposed massing, and mitigation alternatives. Report deltas, not only absolute maps.",
    "8. Validate visually at a few timestamps with rendered shadow scenes before trusting aggregate outputs.",
  ],

  assumptions: [
    "Building heights and roof geometries are accurate enough for shadow casting.",
    "Solar position calculations use the correct local timezone and coordinate reference.",
    "Vegetation, temporary structures, and facade articulation may be omitted unless explicitly modelled.",
    "Weather assumptions determine whether results represent geometric sun access or actual irradiance.",
  ],

  limitations: [
    "LoD1 block models over-simplify roof forms and can misestimate rooftop solar potential.",
    "Annual ray tracing can be computationally expensive for large districts; sampling strategy matters.",
    "Shadow results are sensitive to small height errors near dense urban canyons.",
    "Comfort outcomes also depend on wind, air temperature, humidity, and material albedo, not sun exposure alone.",
  ],

  dataRequirements: [
    "3D building geometry: CityGML, 3D Tiles, OBJ, glTF, multipatch, or extruded footprints with height.",
    "Terrain model when slope or horizon obstruction is material.",
    "Study-area location, timezone, analysis timestamps, and weather/irradiance data if estimating PV potential.",
    "Projected CRS for geometry processing; WGS84 latitude/longitude only for solar-position input.",
  ],

  pythonExample: `import geopandas as gpd
import pandas as pd
import pvlib

# Simplified rooftop-screening example using roof plane metadata.
roofs = gpd.read_file("roof_planes.geojson").to_crs(32633)
lat, lon = 41.387, 2.168
times = pd.date_range("2024-01-01", "2024-12-31 23:00", freq="1h", tz="Europe/Madrid")

solar_position = pvlib.solarposition.get_solarposition(times, lat, lon)
clearsky = pvlib.location.Location(lat, lon, tz="Europe/Madrid").get_clearsky(times)

def plane_irradiance(row):
    poa = pvlib.irradiance.get_total_irradiance(
        surface_tilt=row["tilt_deg"],
        surface_azimuth=row["azimuth_deg"],
        solar_zenith=solar_position["apparent_zenith"],
        solar_azimuth=solar_position["azimuth"],
        dni=clearsky["dni"],
        ghi=clearsky["ghi"],
        dhi=clearsky["dhi"],
    )
    return float(poa["poa_global"].sum() / 1000)  # kWh/m2/year, no shading

roofs["clear_sky_kwh_m2"] = roofs.apply(plane_irradiance, axis=1)
roofs.to_file("roof_solar_screening.gpkg", layer="roofs", driver="GPKG")`,

  interpretation:
    "A rooftop or public-space area with high geometric sun-hours is a candidate for PV, daylight access, or winter " +
    "comfort, but it is not automatically suitable: structural constraints, ownership, glare, heat stress, and heritage " +
    "rules may dominate. For planning review, compare proposed and baseline scenarios and report the affected area, " +
    "duration, and time of year. Clearly separate geometric sun access from weather-adjusted irradiance.",

  references: [
    "Reda, I. & Andreas, A. (2004) Solar position algorithm for solar radiation applications. Solar Energy, 76(5), 577-589.",
    "Reinhart, C.F. & Wienold, J. (2011) The daylighting dashboard: A simulation-based design analysis for daylit spaces. Building and Environment, 46(2), 386-396.",
    "Jakubiec, J.A. & Reinhart, C.F. (2013) A method for predicting city-wide electricity gains from photovoltaic panels. Solar Energy, 93, 127-143.",
  ],

  relatedIndicators: ["solar_access_hours", "shadow_duration", "pv_potential", "outdoor_thermal_comfort"],
  sdgAlignment: ["SDG 7 \u2014 Affordable and Clean Energy", "SDG 11.7 \u2014 Public Open Space"],
};

/* ------------------------------------------------------------------ */
/*  Guide 10 - Data Engineering: Spatial ETL QA                       */
/* ------------------------------------------------------------------ */

const spatialDataEngineeringQA: MethodologyGuide = {
  id: "guide_spatial_data_engineering_qa",
  title: "Reproducible Spatial ETL and QA",
  category: "Data Engineering",
  abstract:
    "Reproducible spatial ETL converts raw urban datasets into analysis-ready layers while preserving " +
    "provenance, CRS integrity, geometry validity, and quality diagnostics. A professional pipeline does " +
    "not simply load a shapefile and proceed; it records source URLs, acquisition dates, licenses, field " +
    "mappings, CRS transformations, geometry repairs, null handling, duplicate detection, and QA outcomes. " +
    "This guide defines a minimum scientific data-engineering workflow for urban analytics so downstream " +
    "indicators can be audited and regenerated.",

  methodology: [
    "1. Register the source: name, publisher, URL, acquisition date, license, spatial/temporal coverage, update cadence, and known limitations.",
    "2. Read raw data into a staging layer without destructive edits. Store original files or immutable checksums.",
    "3. Validate CRS. If CRS is missing, do not guess silently; infer only with documented evidence or mark the dataset as blocked.",
    "4. Reproject to an analysis CRS appropriate for area/distance operations. Keep WGS84 copies only for web display and interchange.",
    "5. Validate geometry: empty geometries, invalid rings, self-intersections, mixed geometry types, duplicate IDs, and impossible extents.",
    "6. Standardise fields using a typed schema: names, units, categorical domains, nullability, and numeric ranges.",
    "7. Compute QA metrics: feature count, null rates, geometry validity rate, duplicate rate, spatial coverage ratio, date freshness, and schema conformance.",
    "8. Emit an analysis-ready layer plus a manifest that records source metadata, transformations, QA scores, warnings, and blocking issues.",
  ],

  assumptions: [
    "Raw data can be retained or re-fetched so the pipeline is reproducible.",
    "CRS, license, and acquisition metadata are considered first-class data, not optional documentation.",
    "QA warnings are propagated to analytical methods instead of being hidden in preprocessing.",
    "Geometry repair is conservative and logged; it is not treated as a silent clean-up step.",
  ],

  limitations: [
    "Automated geometry repair can change topology; critical datasets require manual spot checks.",
    "Schema validation cannot prove semantic correctness, only structural consistency.",
    "Open-data portals may change files without versioned URLs; checksums help detect drift.",
    "A high QA score does not mean the dataset is analytically fit for every method.",
  ],

  dataRequirements: [
    "Raw source files or API endpoints plus license and acquisition metadata.",
    "Declared schema for required fields, units, domains, and nullability.",
    "Target projected CRS for analytical calculations and WGS84 export profile for web maps.",
    "Persistent manifest storage for checksums, transformations, and QA outcomes.",
  ],

  pythonExample: `import hashlib
import json
import geopandas as gpd

raw_path = "raw/parcels.geojson"
target_crs = 26918

with open(raw_path, "rb") as f:
    checksum = hashlib.sha256(f.read()).hexdigest()

gdf = gpd.read_file(raw_path)
qa = {
    "source": "City parcel open data",
    "checksum_sha256": checksum,
    "feature_count_raw": int(len(gdf)),
    "declared_crs": str(gdf.crs),
    "warnings": [],
}

if gdf.crs is None:
    qa["warnings"].append("Missing CRS: pipeline blocked until CRS is verified.")
else:
    gdf = gdf.to_crs(target_crs)
    gdf["geometry_valid"] = gdf.geometry.is_valid
    qa["geometry_valid_rate"] = float(gdf["geometry_valid"].mean())
    qa["null_rate_parcel_id"] = float(gdf["parcel_id"].isna().mean())
    qa["duplicate_parcel_id"] = int(gdf["parcel_id"].duplicated().sum())
    gdf.to_file("processed/parcels_analysis.gpkg", layer="parcels", driver="GPKG")

with open("processed/parcels_manifest.json", "w", encoding="utf-8") as f:
    json.dump(qa, f, indent=2)`,

  interpretation:
    "A spatial ETL layer is analysis-ready only when its CRS, schema, geometry validity, and provenance are explicit. " +
    "If CRS metadata is unknown, area and distance methods should be blocked. If source freshness or spatial coverage " +
    "is weak, downstream indicators should carry a data-fitness warning instead of being presented as authoritative. " +
    "The manifest is part of the scientific output because it makes the analytical chain reproducible.",

  references: [
    "Wilson, G. et al. (2017) Good enough practices in scientific computing. PLOS Computational Biology, 13(6), e1005510.",
    "Pebesma, E. (2018) Simple Features for R: Standardized Support for Spatial Vector Data. The R Journal, 10(1), 439-446.",
    "Open Geospatial Consortium (2011) OpenGIS Implementation Standard for Geographic information - Simple feature access.",
  ],

  relatedIndicators: ["data_fitness_score", "crs_validity", "geometry_validity_rate", "provenance_completeness"],
  sdgAlignment: ["SDG 11.3 \u2014 Inclusive and Sustainable Urbanization", "SDG 17.18 \u2014 Data Availability"],
};

/* ------------------------------------------------------------------ */
/*  Exported collection                                                */
/* ------------------------------------------------------------------ */

export const METHODOLOGY_GUIDES: MethodologyGuide[] = [
  moransI,
  walkScore,
  streetNetworkOSMnx,
  ndviSentinel2,
  spacematrixMorphology,
  gtfsAccessibility,
  multiHazardVulnerability,
  displacementRiskIndex,
  solarAccess3D,
  spatialDataEngineeringQA,
];
