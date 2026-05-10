/**
 * Urban Analytics RAG Corpus — domain-specific reference material index.
 *
 * Provides both lightweight topic metadata for query expansion and a built-in
 * academic corpus used when workspace evidence is thin or a user asks for
 * methodological grounding.
 */

export interface CorpusTopic {
  id: string;
  title: string;
  category: CorpusCategory;
  keywords: readonly string[];
  description: string;
}

export type CorpusCategory =
  | 'urban_planning'
  | 'gis_methods'
  | 'remote_sensing'
  | 'spatial_statistics'
  | 'transport'
  | 'environment'
  | 'python_geospatial'
  | 'sdg_framework'
  | 'voxcity'
  | 'data_sources';

export interface BuiltInCorpusDocument {
  id: string;
  title: string;
  organization: string;
  year: number;
  category: CorpusCategory;
  url: string;
  citation: string;
  keywords: readonly string[];
  abstract: string;
  excerpt: string;
  relevance: readonly string[];
}

export const URBAN_CORPUS_TOPICS: readonly CorpusTopic[] = [
  {
    id: 'urban_planning_theory',
    title: 'Urban Planning Theory',
    category: 'urban_planning',
    keywords: ['TOD', 'transit-oriented development', 'new urbanism', 'smart growth', 'tactical urbanism', 'mixed-use', 'zoning', 'complete streets', 'walkability', '15-minute city', 'Moreno'],
    description: 'Core urban planning theories, design frameworks, and policy approaches.',
  },
  {
    id: 'site_suitability',
    title: 'Multi-Criteria Site Suitability',
    category: 'urban_planning',
    keywords: ['MCDA', 'AHP', 'weighted overlay', 'suitability analysis', 'constraint mapping', 'criteria weights', 'Saaty'],
    description: 'Multi-criteria decision analysis for site selection and suitability mapping.',
  },
  {
    id: 'urban_morphology',
    title: 'Urban Morphology & Spacematrix',
    category: 'urban_planning',
    keywords: ['FAR', 'GSI', 'OSR', 'floor area ratio', 'ground space index', 'spacematrix', 'Berghauser Pont', 'momepy', 'tessellation', 'building footprint'],
    description: 'Quantitative urban form analysis — density, compactness, morphometric indicators.',
  },
  {
    id: 'vector_operations',
    title: 'Vector GIS Operations',
    category: 'gis_methods',
    keywords: ['buffer', 'spatial join', 'overlay', 'intersection', 'union', 'clip', 'dissolve', 'geocoding', 'topology', 'geopandas', 'shapely'],
    description: 'Core vector GIS operations: spatial joins, overlay analysis, geocoding, topology.',
  },
  {
    id: 'crs_projections',
    title: 'Coordinate Reference Systems',
    category: 'gis_methods',
    keywords: ['CRS', 'EPSG', 'WGS84', 'UTM', 'projection', 'datum', 'transform', 'pyproj', 'proj4', 'equal-area', 'equidistant', 'MAUP'],
    description: 'CRS selection, projection transformations, and spatial reference considerations.',
  },
  {
    id: 'spatial_sql',
    title: 'Spatial SQL (DuckDB / PostGIS)',
    category: 'gis_methods',
    keywords: ['ST_Buffer', 'ST_Intersects', 'ST_Contains', 'ST_Area', 'ST_Distance', 'ST_Transform', 'DuckDB', 'PostGIS', 'spatial SQL', 'WASM'],
    description: 'Spatial SQL queries using DuckDB-WASM or PostGIS for in-browser analytics.',
  },
  {
    id: 'spectral_indices',
    title: 'Spectral Index Computation',
    category: 'remote_sensing',
    keywords: ['NDVI', 'NDBI', 'NDWI', 'SAVI', 'EVI', 'band math', 'Sentinel-2', 'Landsat', 'rasterio', 'NIR', 'RED'],
    description: 'Spectral vegetation / built-up / water indices from satellite imagery.',
  },
  {
    id: 'land_cover_classification',
    title: 'Land Cover Classification',
    category: 'remote_sensing',
    keywords: ['random forest', 'SVM', 'classification', 'confusion matrix', 'training data', 'ground truth', 'scikit-learn', 'change detection'],
    description: 'Supervised and unsupervised classification of multi-spectral satellite imagery.',
  },
  {
    id: 'stac_cog',
    title: 'STAC & Cloud-Optimized GeoTIFF',
    category: 'remote_sensing',
    keywords: ['STAC', 'COG', 'cloud-optimized', 'Planetary Computer', 'pystac', 'stackstac', 'xarray', 'rioxarray'],
    description: 'Discovering and loading satellite imagery via STAC API and COG workflows.',
  },
  {
    id: 'spatial_autocorrelation',
    title: "Moran's I & LISA",
    category: 'spatial_statistics',
    keywords: ['Moran', 'LISA', 'spatial autocorrelation', 'hot spot', 'cold spot', 'Getis-Ord', 'pysal', 'esda', 'libpysal', 'spatial weights', 'Queen', 'Rook', 'KNN'],
    description: "Global and local spatial autocorrelation — Moran's I, LISA clusters, Getis-Ord Gi*.",
  },
  {
    id: 'gwr',
    title: 'Geographically Weighted Regression',
    category: 'spatial_statistics',
    keywords: ['GWR', 'spatial regression', 'non-stationarity', 'bandwidth', 'mgwr', 'OLS', 'spatial lag', 'spatial error', 'Lagrange multiplier'],
    description: 'Spatially varying coefficient models — GWR, MGWR, spatial lag/error models.',
  },
  {
    id: 'interpolation',
    title: 'Spatial Interpolation & Kriging',
    category: 'spatial_statistics',
    keywords: ['kriging', 'IDW', 'variogram', 'interpolation', 'dasymetric', 'areal interpolation', 'Tobler', 'pycnophylactic'],
    description: 'Kriging, IDW, and areal interpolation methods for continuous surface estimation.',
  },
  {
    id: 'network_analysis',
    title: 'Street Network Analysis',
    category: 'transport',
    keywords: ['osmnx', 'networkx', 'betweenness', 'closeness', 'centrality', 'shortest path', 'Dijkstra', 'isochrone', 'Space Syntax', 'Hillier'],
    description: 'Graph-based street network analysis — centrality, routing, isochrones, Space Syntax.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility Analysis',
    category: 'transport',
    keywords: ['walk score', 'isochrone', '15-minute city', 'pandana', 'GTFS', 'transit accessibility', 'cumulative opportunities', 'gravity model', 'Hansen'],
    description: 'Accessibility measures — walk score, transit access, gravity models, isochrones.',
  },
  {
    id: 'gtfs',
    title: 'GTFS Transit Data',
    category: 'transport',
    keywords: ['GTFS', 'General Transit Feed', 'headway', 'frequency', 'stops', 'routes', 'trips', 'stop_times', 'gtfs-kit', 'r5py'],
    description: 'Parsing, validating, and analysing GTFS transit data for service characteristics.',
  },
  {
    id: 'urban_heat_island',
    title: 'Urban Heat Island Analysis',
    category: 'environment',
    keywords: ['UHI', 'heat island', 'LST', 'land surface temperature', 'thermal', 'Landsat Band 10', 'impervious', 'green infrastructure'],
    description: 'Urban Heat Island estimation from thermal satellite data and mitigation strategies.',
  },
  {
    id: 'green_infrastructure',
    title: 'Green Infrastructure & Ecosystem Services',
    category: 'environment',
    keywords: ['green space', 'tree canopy', 'stormwater', 'urban greening', 'ecosystem services', 'i-Tree', 'green roof', 'permeable pavement'],
    description: 'Green infrastructure assessment — canopy coverage, stormwater management, ecosystem services.',
  },
  {
    id: 'python_geo_stack',
    title: 'Python Geospatial Stack',
    category: 'python_geospatial',
    keywords: ['geopandas', 'shapely', 'fiona', 'rasterio', 'pyproj', 'folium', 'matplotlib', 'contextily', 'osmnx', 'networkx', 'pandana', 'pysal', 'momepy', 'xarray'],
    description: 'Core Python geospatial libraries — installation, usage patterns, and best practices.',
  },
  {
    id: 'sdg11',
    title: 'SDG 11 Indicators',
    category: 'sdg_framework',
    keywords: ['SDG 11', 'sustainable cities', '11.1.1', '11.2.1', '11.3.1', '11.7.1', 'public transport access', 'land consumption', 'open public space', 'UN-Habitat'],
    description: 'UN Sustainable Development Goal 11 — indicator definitions, computation methods, reporting.',
  },
  {
    id: 'voxcity',
    title: 'VoxCity Simulation',
    category: 'voxcity',
    keywords: ['VoxCity', 'voxel', 'solar radiation', 'wind comfort', 'sky view factor', 'daylight factor', 'shadow hours', 'UTCI', 'noise level', 'environmental simulation'],
    description: 'VoxCity voxel-based environmental simulations — setup, parameters, result interpretation.',
  },
  {
    id: 'osm_data',
    title: 'OpenStreetMap Data',
    category: 'data_sources',
    keywords: ['OSM', 'OpenStreetMap', 'Overpass', 'overpass-turbo', 'osmium', 'building footprint', 'road network', 'POI', 'amenity'],
    description: 'Extracting and using OpenStreetMap data via Overpass API, osmium, and osmnx.',
  },
  {
    id: 'census_data',
    title: 'Census & Demographic Data',
    category: 'data_sources',
    keywords: ['census', 'ACS', 'American Community Survey', 'Eurostat', 'demographics', 'population', 'income', 'tract', 'block group'],
    description: 'Accessing and harmonising census data from US ACS, Eurostat, and other national sources.',
  },
] as const;

export const BUILT_IN_CORPUS_DOCUMENTS: readonly BuiltInCorpusDocument[] = [
  {
    id: 'ipcc-ar6-wg2-cities-2022',
    title: 'Climate Change 2022: Impacts, Adaptation and Vulnerability',
    organization: 'IPCC',
    year: 2022,
    category: 'environment',
    url: 'https://www.ipcc.ch/report/ar6/wg2/',
    citation: 'IPCC. 2022. Climate Change 2022: Impacts, Adaptation and Vulnerability.',
    keywords: ['IPCC', 'adaptation', 'cities', 'settlements', 'infrastructure', 'heat', 'flood', 'climate risk'],
    abstract: 'Assessment report covering climate impacts, adaptation limits, and risk management, including a dedicated cities, settlements, and key infrastructure chapter.',
    excerpt: 'Urban analytics teams can use the report to ground heat, flood, resilience, and adaptation workflows in internationally recognised evidence and vocabulary.',
    relevance: [
      'Supports climate resilience framing for heat-island, flood, and infrastructure-risk analyses.',
      'Provides policy-grade adaptation language for report generation and scenario interpretation.',
    ],
  },
  {
    id: 'unhabitat-world-cities-2024',
    title: 'World Cities Report 2024',
    organization: 'UN-Habitat',
    year: 2024,
    category: 'urban_planning',
    url: 'https://unhabitat.org/wcr/',
    citation: 'UN-Habitat. 2024. World Cities Report 2024.',
    keywords: ['UN-Habitat', 'urbanization', 'housing', 'equity', 'informality', 'cities report', 'governance'],
    abstract: 'Global synthesis on urban transitions, inequality, housing, infrastructure, and the governance conditions shaping sustainable urban futures.',
    excerpt: 'Useful for benchmark narratives, comparative city context, and framing distributional or governance diagnostics in policy reports.',
    relevance: [
      'Strengthens baseline urban context and comparative benchmarking narratives.',
      'Adds official framing for affordability, informality, and institutional capacity discussions.',
    ],
  },
  {
    id: 'who-air-quality-guidelines-2021',
    title: 'WHO global air quality guidelines',
    organization: 'World Health Organization',
    year: 2021,
    category: 'environment',
    url: 'https://www.who.int/publications/i/item/9789240034228',
    citation: 'World Health Organization. 2021. WHO global air quality guidelines.',
    keywords: ['WHO', 'air quality', 'PM2.5', 'NO2', 'ozone', 'exposure', 'health'],
    abstract: 'Health-based guideline values for major air pollutants, intended to inform monitoring thresholds, exposure assessment, and public-health policy.',
    excerpt: 'Provides defensible threshold values and language for environmental-health dashboards and monitoring reports.',
    relevance: [
      'Grounds air-quality indicators and thresholds used in sensor or monitoring workflows.',
      'Useful for combining environmental and health narratives in urban observability reports.',
    ],
  },
  {
    id: 'who-age-friendly-environments-2017',
    title: 'Towards age-friendly environments in Europe',
    organization: 'World Health Organization',
    year: 2017,
    category: 'urban_planning',
    url: 'https://www.who.int/europe/publications/i/item/9789289055888',
    citation: 'World Health Organization. 2017. Towards age-friendly environments in Europe.',
    keywords: ['WHO', 'age-friendly', 'accessibility', 'public space', 'mobility', 'older adults'],
    abstract: 'Guidance on designing built environments, mobility systems, and public services that better support ageing populations.',
    excerpt: 'Relevant for accessibility, public-space quality, and service-proximity analyses aimed at inclusive city planning.',
    relevance: [
      'Adds social-inclusion context for accessibility and service-area assessments.',
      'Improves reporting language around universal design and age-sensitive mobility planning.',
    ],
  },
  {
    id: 'oecd-composite-indicators-2008',
    title: 'Handbook on Constructing Composite Indicators',
    organization: 'OECD / JRC',
    year: 2008,
    category: 'spatial_statistics',
    url: 'https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html',
    citation: 'OECD and JRC. 2008. Handbook on Constructing Composite Indicators: Methodology and User Guide.',
    keywords: ['OECD', 'composite indicators', 'normalization', 'weighting', 'aggregation', 'sensitivity'],
    abstract: 'Methodological guidance for indicator normalization, weighting, aggregation, robustness checks, and transparent composite-index design.',
    excerpt: 'Core reference for composite-indicator construction, sensitivity analysis, and defensible reporting of weighting choices.',
    relevance: [
      'Directly supports indicator-composite workflows and robustness narratives.',
      'Provides accepted terminology for methodological notes and audit trails.',
    ],
  },
  {
    id: 'oecd-metropolitan-database',
    title: 'OECD Metropolitan Database',
    organization: 'OECD',
    year: 2024,
    category: 'data_sources',
    url: 'https://www.oecd.org/en/data/datasets/oecd-metropolitan-database.html',
    citation: 'OECD. OECD Metropolitan Database.',
    keywords: ['OECD', 'metropolitan database', 'benchmarking', 'metro regions', 'housing', 'labor', 'transport'],
    abstract: 'Cross-metropolitan statistical dataset for comparing economic, demographic, housing, and environmental conditions across urban regions.',
    excerpt: 'Useful for external benchmarking and contextualising local indicator outputs against peer metros.',
    relevance: [
      'Strengthens comparative dashboards and metropolitan-scale benchmarking workflows.',
      'Provides a reference point for governance, labor, and housing comparisons.',
    ],
  },
  {
    id: 'unhabitat-sdg-cities-framework',
    title: 'SDG Cities Global Monitoring Framework',
    organization: 'UN-Habitat',
    year: 2024,
    category: 'sdg_framework',
    url: 'https://unhabitat.org/programme/sdg-cities-global-monitoring-framework',
    citation: 'UN-Habitat. SDG Cities Global Monitoring Framework.',
    keywords: ['UN-Habitat', 'SDG 11', 'monitoring framework', 'indicators', 'voluntary local review', 'cities'],
    abstract: 'Monitoring framework connecting city indicators and implementation pathways to the SDG Cities programme and local reporting practice.',
    excerpt: 'Useful for structuring SDG-aligned indicator collections and report sections when teams move from analysis into monitoring or VLR outputs.',
    relevance: [
      'Supports SDG 11 and broader VLR-oriented reporting structures.',
      'Helps align indicator catalogs with official monitoring language.',
    ],
  },
] as const;

export const CORPUS_CATEGORIES: Record<CorpusCategory, { label: string; icon: string }> = {
  urban_planning: { label: 'Urban Planning', icon: '' },
  gis_methods: { label: 'GIS Methods', icon: '' },
  remote_sensing: { label: 'Remote Sensing', icon: '' },
  spatial_statistics: { label: 'Spatial Statistics', icon: '' },
  transport: { label: 'Transport', icon: '' },
  environment: { label: 'Environment', icon: '' },
  python_geospatial: { label: 'Python Geospatial', icon: '' },
  sdg_framework: { label: 'SDG Framework', icon: '' },
  voxcity: { label: 'VoxCity', icon: '' },
  data_sources: { label: 'Data Sources', icon: '' },
};

export function renderBuiltInCorpusDocument(document: BuiltInCorpusDocument): string {
  return [
    `# ${document.title}`,
    `Organization: ${document.organization}`,
    `Year: ${document.year}`,
    `Citation: ${document.citation}`,
    `URL: ${document.url}`,
    `Abstract: ${document.abstract}`,
    `Excerpt: ${document.excerpt}`,
    `Urban analytics relevance: ${document.relevance.join(' ')}`,
  ].join('\n');
}

export function listBuiltInCorpusDocuments(): BuiltInCorpusDocument[] {
  return BUILT_IN_CORPUS_DOCUMENTS.map((document) => ({ ...document }));
}

export function allCorpusKeywords(): ReadonlySet<string> {
  const keywords = new Set<string>();
  for (const topic of URBAN_CORPUS_TOPICS) {
    for (const keyword of topic.keywords) {
      keywords.add(keyword.toLowerCase());
    }
  }
  for (const document of BUILT_IN_CORPUS_DOCUMENTS) {
    for (const keyword of document.keywords) {
      keywords.add(keyword.toLowerCase());
    }
  }
  return keywords;
}

export function matchTopics(query: string, maxTopics = 5): CorpusTopic[] {
  const normalizedQuery = query.toLowerCase();
  const scored = URBAN_CORPUS_TOPICS.map((topic) => {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    if (normalizedQuery.includes(topic.title.toLowerCase())) {
      score += 3;
    }
    return { topic, score };
  });

  scored.sort((left, right) => right.score - left.score);
  return scored.filter((entry) => entry.score > 0).slice(0, maxTopics).map((entry) => entry.topic);
}

export function searchBuiltInCorpus(
  query: string,
  maxDocuments = 4,
): Array<{ document: BuiltInCorpusDocument; score: number }> {
  const normalizedQuery = query.toLowerCase();
  const topicMatches = matchTopics(query, 3);
  const matchedCategories = new Set(topicMatches.map((topic) => topic.category));

  const scored = BUILT_IN_CORPUS_DOCUMENTS.map((document) => {
    let score = 0;
    if (matchedCategories.has(document.category)) {
      score += 2.5;
    }
    if (normalizedQuery.includes(document.title.toLowerCase())) {
      score += 4;
    }
    for (const keyword of document.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    if (normalizedQuery.includes(document.organization.toLowerCase())) {
      score += 1.5;
    }
    if (normalizedQuery.includes(String(document.year))) {
      score += 1;
    }
    if (document.abstract.toLowerCase().includes(normalizedQuery)) {
      score += 2;
    }
    return { document, score };
  });

  scored.sort((left, right) => right.score - left.score);
  return scored
    .filter((entry) => entry.score > 0)
    .slice(0, maxDocuments)
    .map((entry) => ({
      document: entry.document,
      score: Number((0.35 + Math.min(entry.score, 10) / 12).toFixed(3)),
    }));
}
