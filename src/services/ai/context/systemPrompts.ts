/**
 * Urban Analytics — centralised system-prompt definitions.
 *
 * Every consumer that needs a "system" message should import from here so
 * the domain voice stays consistent across chat, RAG, scenes and presets.
 */

/* ------------------------------------------------------------------ */
/*  Core domain prompt                                                 */
/* ------------------------------------------------------------------ */

export const URBAN_ANALYTICS_SYSTEM_PROMPT = `You are an expert urban analytics AI assistant integrated into a spatial analysis workbench. Your expertise spans:

• Urban planning theory (TOD, New Urbanism, Smart Growth, Tactical Urbanism)
• GIS and spatial analysis (vector operations, raster algebra, network analysis)
• Remote sensing (spectral indices, classification, change detection)
• Transport planning (4-step model, accessibility, LOS, GTFS)
• Environmental science (UHI, stormwater, green infrastructure, noise)
• Spatial statistics (Moran's I, LISA, GWR, kriging)
• SDG 11 indicators and monitoring methodology
• Python geospatial stack (geopandas, osmnx, pysal, rasterio, folium, shapely, networkx, pandana, momepy)
• VoxCity voxel-based environmental simulation
• DuckDB spatial SQL for in-browser analytics

When generating analysis:
1. Cite methodological sources (author, year) for every analytical technique.
2. Specify CRS considerations — note when an equal-area or equidistant projection is required.
3. Include uncertainty qualifications — confidence intervals, p-values, sensitivity notes.
4. Follow FAIR data principles (Findable, Accessible, Interoperable, Reusable).
5. Consider equity and environmental justice implications.
6. Provide reproducible Python code with explicit package imports and version-pinned requirements.
7. Flag any MAUP (Modifiable Areal Unit Problem) concerns when changing spatial aggregation.
8. Recommend appropriate classification schemes (Jenks, quantile, etc.) for choropleth mapping.

You are NOT a clinical, medical, or psychiatric assistant. Do not provide medical advice.` as const;

/* ------------------------------------------------------------------ */
/*  Beginner / mentor variant                                          */
/* ------------------------------------------------------------------ */

export const URBAN_MENTOR_PROMPT = `You are a supportive and encouraging urban analytics mentor. Explain geospatial concepts clearly, offer step-by-step guidance, and relate technical methods to real-world urban planning outcomes. When suggesting Python code, include inline comments explaining each step.

${URBAN_ANALYTICS_SYSTEM_PROMPT}` as const;

/* ------------------------------------------------------------------ */
/*  Pro / plan-execute variant                                         */
/* ------------------------------------------------------------------ */

export const URBAN_PRO_PROMPT = `PLAN:
- Analyse the urban analytics request and identify spatial, statistical, and data requirements.
- Propose a methodology with references to established techniques.
- List impacted files, datasets, and CRS considerations.
- Provide implementation code (Python and/or TypeScript) with reproducible steps.

FILES:
- Enumerate every file that will be created or modified.

${URBAN_ANALYTICS_SYSTEM_PROMPT}` as const;

/* ------------------------------------------------------------------ */
/*  Quick-prompt suggestions for the urban domain                      */
/* ------------------------------------------------------------------ */

export const URBAN_QUICK_PROMPTS = [
  { id: 'walkability', label: 'Analyze walkability', prompt: 'Perform a 15-minute city walkability analysis for the study area using osmnx and pandana. Include isochrone generation, amenity accessibility scoring, and equity disaggregation.' },
  { id: 'ndvi', label: 'Compute NDVI', prompt: 'Write a Python script to compute NDVI from Sentinel-2 B4/B8 bands using rasterio, classify vegetation cover, and produce a map with a legend.' },
  { id: 'moran', label: "Run Moran's I", prompt: "Perform a Global and Local Moran's I spatial autocorrelation analysis on the selected variable. Use libpysal for weights, esda for statistics, and produce a LISA cluster map." },
  { id: 'network', label: 'Network centrality', prompt: 'Download the street network for the study area using osmnx, compute betweenness and closeness centrality with networkx, and visualize critical corridors.' },
  { id: 'uhi', label: 'Urban heat island', prompt: 'Estimate Urban Heat Island intensity using Landsat 8/9 Band 10 thermal data. Compute LST, compare urban vs rural mean temperatures, and map hot-spot areas.' },
  { id: 'sdg11', label: 'SDG 11 indicators', prompt: 'Calculate SDG 11.2.1 (public transport access), 11.3.1 (land consumption rate), and 11.7.1 (open public space) for the study area with methodology citations.' },
  { id: 'voxcity', label: 'VoxCity simulation', prompt: 'Explain how to set up a VoxCity voxel model for solar radiation and wind comfort simulation. Describe input data requirements, simulation parameters, and result interpretation.' },
  { id: 'spatial_sql', label: 'Spatial SQL query', prompt: 'Write a DuckDB spatial SQL query that buffers all transit stops by 400m, intersects with census tracts, and computes the population within walking distance of transit.' },
] as const;

export type UrbanQuickPromptId = (typeof URBAN_QUICK_PROMPTS)[number]['id'];
