import type { Feature, LineString, Point, Polygon } from "geojson";
import type {
  DatasetPropertyType,
  TeachingDatasetDataType,
  TeachingDatasetFieldDefinition,
  TeachingDatasetId,
  TeachingDatasetLayerDefinition,
  TeachingDatasetPackage,
  TeachingDatasetTheme,
} from "./types";

interface CitySeed {
  id: TeachingDatasetId;
  city: string;
  title: string;
  region: string;
  center: [number, number];
  bounds: [number, number, number, number];
  summary: string;
  source: string;
  license: string;
  updateDate: string;
  spatialExtentLabel: string;
  searchTerms: string[];
  neighborhoodNames: string[];
  corridorNames: string[];
  mobilityModes: string[];
  urbanIntensity: number;
  transitIntensity: number;
  climateStress: number;
}

export const TEACHING_DATASET_THEME_LABELS: Record<TeachingDatasetTheme, string> = {
  mobility: "Mobility",
  climate: "Climate",
  housing: "Housing",
  public_realm: "Public Realm",
  urban_form: "Urban Form",
  green_infrastructure: "Green Infrastructure",
};

export const TEACHING_DATASET_DATA_TYPE_LABELS: Record<TeachingDatasetDataType, string> = {
  polygon: "Polygon",
  point: "Point",
  line: "Line",
};

const SHARED_SOURCE = "SynapseCore curated teaching fixture built for demonstration, benchmarking, and onboarding.";
const SHARED_LICENSE = "CC BY 4.0";
const SHARED_CRS = "EPSG:4326";

const CITY_SEEDS: readonly CitySeed[] = [
  {
    id: "new_york_city",
    city: "New York City",
    title: "New York City Studio Pack",
    region: "United States",
    center: [-73.979, 40.728],
    bounds: [-74.035, 40.689, -73.929, 40.789],
    summary: "Compact teaching subset spanning Manhattan and western Brooklyn for mobility, heat, and housing demonstrations.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-18",
    spatialExtentLabel: "Lower Manhattan to western Brooklyn teaching window",
    searchTerms: ["nyc", "manhattan", "brooklyn", "transit", "density"],
    neighborhoodNames: ["Battery Park", "Civic Core", "Lower East Side", "Downtown Brooklyn"],
    corridorNames: ["Hudson Greenway", "Broadway Spine", "East River Edge"],
    mobilityModes: ["Subway", "Ferry", "Bus", "Bike Hub"],
    urbanIntensity: 1.32,
    transitIntensity: 1.38,
    climateStress: 0.88,
  },
  {
    id: "london",
    city: "London",
    title: "London Policy Lab Pack",
    region: "United Kingdom",
    center: [-0.11, 51.509],
    bounds: [-0.197, 51.476, -0.014, 51.543],
    summary: "Central Thames corridor subset tuned for accessibility, public realm, and urban heat teaching exercises.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-16",
    spatialExtentLabel: "Central London Thames corridor teaching window",
    searchTerms: ["thames", "westminster", "south bank", "accessibility", "public realm"],
    neighborhoodNames: ["Westminster", "South Bank", "Clerkenwell", "Canary Fringe"],
    corridorNames: ["Thames Walk", "Holborn Connector", "King's Cross Green Link"],
    mobilityModes: ["Tube", "Rail", "Bus", "Cycle Dock"],
    urbanIntensity: 1.18,
    transitIntensity: 1.31,
    climateStress: 0.74,
  },
  {
    id: "barcelona",
    city: "Barcelona",
    title: "Barcelona Urban Form Pack",
    region: "Spain",
    center: [2.17, 41.392],
    bounds: [2.116, 41.362, 2.223, 41.422],
    summary: "Eixample to waterfront subset emphasizing block morphology, public space, and climate adaptation trade-offs.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-20",
    spatialExtentLabel: "Eixample and waterfront teaching window",
    searchTerms: ["eixample", "superblock", "waterfront", "urban form", "public space"],
    neighborhoodNames: ["Eixample West", "Eixample East", "Ciutat Vella", "Poblenou Edge"],
    corridorNames: ["Gran Via Spine", "Diagonal Green Axis", "Waterfront Promenade"],
    mobilityModes: ["Metro", "Tram", "Bus", "Superblock Node"],
    urbanIntensity: 1.08,
    transitIntensity: 1.09,
    climateStress: 0.79,
  },
  {
    id: "istanbul",
    city: "Istanbul",
    title: "Istanbul Resilience Pack",
    region: "Turkey",
    center: [28.972, 41.017],
    bounds: [28.91, 40.982, 29.034, 41.053],
    summary: "Historic peninsula and Bosphorus gateway subset for resilience, ferry mobility, and urban redevelopment instruction.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-22",
    spatialExtentLabel: "Historic peninsula to Bosphorus gateway teaching window",
    searchTerms: ["fatih", "galata", "bosphorus", "ferry", "resilience"],
    neighborhoodNames: ["Historic Core", "Golden Horn", "Galata Ridge", "Bosphorus Gate"],
    corridorNames: ["Coastal Tramway", "Golden Horn Walk", "Bosphorus Connector"],
    mobilityModes: ["Metro", "Ferry", "Metrobus", "Bus Hub"],
    urbanIntensity: 1.16,
    transitIntensity: 1.12,
    climateStress: 0.91,
  },
  {
    id: "singapore",
    city: "Singapore",
    title: "Singapore Compact City Pack",
    region: "Singapore",
    center: [103.852, 1.294],
    bounds: [103.804, 1.264, 103.9, 1.324],
    summary: "Downtown Core to Kallang subset for compact city benchmarking, green infrastructure, and transit integration.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-24",
    spatialExtentLabel: "Downtown Core to Kallang teaching window",
    searchTerms: ["downtown core", "kallang", "compact city", "mrt", "green infrastructure"],
    neighborhoodNames: ["Downtown Core", "Bugis", "Kallang", "Marina Fringe"],
    corridorNames: ["Civic Green Spine", "Marina Loop", "Kallang Connector"],
    mobilityModes: ["MRT", "Bus Interchange", "Cycle Parking", "Water Taxi"],
    urbanIntensity: 1.22,
    transitIntensity: 1.29,
    climateStress: 0.66,
  },
  {
    id: "melbourne",
    city: "Melbourne",
    title: "Melbourne Liveability Pack",
    region: "Australia",
    center: [144.968, -37.813],
    bounds: [144.922, -37.844, 145.014, -37.782],
    summary: "CBD and inner Yarra corridor subset for liveability, street greenery, and housing pressure tutorials.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-03-19",
    spatialExtentLabel: "CBD to inner north and Yarra corridor teaching window",
    searchTerms: ["yarra", "cbd", "liveability", "tram", "housing pressure"],
    neighborhoodNames: ["CBD Grid", "Docklands Edge", "Carlton Link", "Southbank Yarra"],
    corridorNames: ["Yarra Promenade", "Tram Boulevard", "North Green Loop"],
    mobilityModes: ["Train", "Tram", "Bus", "Bike Share"],
    urbanIntensity: 0.98,
    transitIntensity: 1.04,
    climateStress: 0.71,
  },
  {
    id: "tokyo",
    city: "Tokyo",
    title: "Tokyo Polycentric Pack",
    region: "Japan",
    // Chiyoda / Chuo / Minato core (Imperial Palace to Tokyo Bay edge)
    center: [139.7593, 35.6762],
    bounds: [139.715, 35.645, 139.805, 35.71],
    summary: "Central wards from Imperial Palace to Tokyo Bay tuned for polycentric density, transit integration, and seismic-aware planning exercises.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-04-02",
    spatialExtentLabel: "Chiyoda · Chuo · Minato core teaching window",
    searchTerms: ["tokyo", "chiyoda", "shinbashi", "marunouchi", "polycentric", "rail"],
    neighborhoodNames: ["Marunouchi", "Ginza Core", "Shinbashi Edge", "Hamamatsucho"],
    corridorNames: ["Yamanote Edge", "Hibiya Spine", "Bay Loop"],
    mobilityModes: ["JR Rail", "Tokyo Metro", "Bus", "Bike Share"],
    urbanIntensity: 1.41,
    transitIntensity: 1.46,
    climateStress: 0.74,
  },
  {
    id: "amsterdam",
    city: "Amsterdam",
    title: "Amsterdam Canal Ring Pack",
    region: "Netherlands",
    // Centrum and Oud-West (Canal Ring UNESCO zone to Vondelpark)
    center: [4.8945, 52.3676],
    bounds: [4.855, 52.355, 4.935, 52.385],
    summary: "Canal Ring to Vondelpark subset for cycling-first mobility, heritage density, and adaptive water-management teaching modules.",
    source: SHARED_SOURCE,
    license: SHARED_LICENSE,
    updateDate: "2026-04-02",
    spatialExtentLabel: "Centrum · Canal Ring · Oud-West teaching window",
    searchTerms: ["amsterdam", "canal ring", "centrum", "cycling", "heritage", "water"],
    neighborhoodNames: ["Centrum Grachten", "Jordaan", "Oud-West", "Vondelpark Edge"],
    corridorNames: ["Prinsengracht", "Leidseplein Spine", "Vondelpark Loop"],
    mobilityModes: ["Tram", "Bike", "Metro", "Ferry"],
    urbanIntensity: 1.08,
    transitIntensity: 1.14,
    climateStress: 0.55,
  },
] as const;

const NEIGHBORHOOD_SCHEMA: readonly TeachingDatasetFieldDefinition[] = [
  { name: "zone_id", type: "string", description: "Stable neighborhood identifier.", required: true },
  { name: "zone_name", type: "string", description: "Readable neighborhood label.", required: true },
  { name: "population_density_km2", type: "integer", description: "Estimated residential density.", unit: "people/km2", required: true },
  { name: "transit_access_score", type: "number", description: "Normalized transit access score on a 0-100 scale.", unit: "score", required: true },
  { name: "heat_risk_index", type: "number", description: "Relative heat-stress index on a 0-1 scale.", unit: "ratio", required: true },
  { name: "green_cover_pct", type: "number", description: "Approximate green-cover share.", unit: "%", required: true },
  { name: "housing_pressure_index", type: "number", description: "Relative housing pressure score on a 0-1 scale.", unit: "ratio", required: true },
] as const;

const MOBILITY_SCHEMA: readonly TeachingDatasetFieldDefinition[] = [
  { name: "hub_id", type: "string", description: "Stable hub identifier.", required: true },
  { name: "hub_name", type: "string", description: "Readable mobility hub label.", required: true },
  { name: "mode", type: "string", description: "Primary transport mode.", required: true },
  { name: "daily_boardings", type: "integer", description: "Estimated daily boardings.", unit: "boardings/day", required: true },
  { name: "accessibility_tier", type: "string", description: "Tiered accessibility label.", required: true },
] as const;

const CORRIDOR_SCHEMA: readonly TeachingDatasetFieldDefinition[] = [
  { name: "corridor_id", type: "string", description: "Stable corridor identifier.", required: true },
  { name: "corridor_name", type: "string", description: "Readable corridor label.", required: true },
  { name: "corridor_type", type: "string", description: "Mobility or public-realm corridor type.", required: true },
  { name: "canopy_pct", type: "number", description: "Approximate canopy share along the corridor.", unit: "%", required: true },
  { name: "pedestrian_priority", type: "number", description: "Pedestrian-priority index on a 0-1 scale.", unit: "ratio", required: true },
] as const;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function createPolygonCoordinates(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): Polygon["coordinates"] {
  return [[
    [round(minLng, 6), round(minLat, 6)],
    [round(maxLng, 6), round(minLat, 6)],
    [round(maxLng, 6), round(maxLat, 6)],
    [round(minLng, 6), round(maxLat, 6)],
    [round(minLng, 6), round(minLat, 6)],
  ]];
}

function createNeighborhoodLayer(seed: CitySeed): TeachingDatasetLayerDefinition {
  const [minLng, minLat, maxLng, maxLat] = seed.bounds;
  const midLng = (minLng + maxLng) / 2;
  const midLat = (minLat + maxLat) / 2;
  const polygonWindows = [
    [minLng, minLat, midLng, midLat],
    [midLng, minLat, maxLng, midLat],
    [minLng, midLat, midLng, maxLat],
    [midLng, midLat, maxLng, maxLat],
  ] as const;
  const densityPattern = [1.24, 0.96, 0.82, 1.08];
  const transitPattern = [1.08, 1.19, 0.88, 1.02];
  const heatPattern = [0.88, 0.73, 0.62, 0.79];
  const greenPattern = [0.74, 0.52, 0.68, 0.59];
  const housingPattern = [0.92, 0.78, 0.58, 0.83];

  const features: Feature<Polygon>[] = polygonWindows.map((windowBounds, index) => ({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: createPolygonCoordinates(...windowBounds),
    },
    properties: {
      zone_id: `${seed.id}_zone_${index + 1}`,
      zone_name: seed.neighborhoodNames[index] ?? `${seed.city} Zone ${index + 1}`,
      population_density_km2: Math.round(6200 + seed.urbanIntensity * densityPattern[index] * 6500),
      transit_access_score: round(44 + seed.transitIntensity * transitPattern[index] * 28, 1),
      heat_risk_index: round(Math.min(0.98, seed.climateStress * heatPattern[index]), 2),
      green_cover_pct: round(Math.max(9, 18 + (1.2 - seed.climateStress) * greenPattern[index] * 26), 1),
      housing_pressure_index: round(Math.min(0.99, seed.urbanIntensity * housingPattern[index] * 0.62), 2),
    },
  }));

  return {
    id: "neighborhood_atlas",
    title: "Neighborhood Atlas",
    summary: "Polygon layer for density, transit access, heat exposure, green cover, and housing pressure lessons.",
    dataType: "polygon",
    geometryType: "Polygon",
    crs: SHARED_CRS,
    source: seed.source,
    license: seed.license,
    updateDate: seed.updateDate,
    thematicCoverage: ["housing", "urban_form", "climate", "mobility", "green_infrastructure"],
    schemaSummary: [...NEIGHBORHOOD_SCHEMA],
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
  };
}

function createPointFeature(
  lng: number,
  lat: number,
  properties: Record<string, unknown>,
): Feature<Point> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [round(lng, 6), round(lat, 6)],
    },
    properties,
  };
}

function createMobilityLayer(seed: CitySeed): TeachingDatasetLayerDefinition {
  const [centerLng, centerLat] = seed.center;
  const offsets = [
    [-0.018, 0.011],
    [0.014, 0.017],
    [-0.009, -0.013],
    [0.022, -0.007],
  ] as const;
  const features = offsets.map(([lngOffset, latOffset], index) => {
    const boardings = Math.round(4200 + seed.transitIntensity * (index + 1) * 3600 + seed.urbanIntensity * 1200);
    return createPointFeature(centerLng + lngOffset, centerLat + latOffset, {
      hub_id: `${seed.id}_hub_${index + 1}`,
      hub_name: `${seed.city} ${seed.mobilityModes[index] ?? "Mobility"} Node ${index + 1}`,
      mode: seed.mobilityModes[index] ?? "Transit",
      daily_boardings: boardings,
      accessibility_tier: boardings > 12000 ? "regional" : boardings > 8500 ? "metro" : "local",
    });
  });

  return {
    id: "mobility_hubs",
    title: "Mobility Hubs",
    summary: "Point layer of high-access transit and interchange nodes for accessibility and service-coverage exercises.",
    dataType: "point",
    geometryType: "Point",
    crs: SHARED_CRS,
    source: seed.source,
    license: seed.license,
    updateDate: seed.updateDate,
    thematicCoverage: ["mobility", "public_realm"],
    schemaSummary: [...MOBILITY_SCHEMA],
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
  };
}

function createLineFeature(
  coordinates: LineString["coordinates"],
  properties: Record<string, unknown>,
): Feature<LineString> {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coordinates.map(([lng, lat]) => [round(lng, 6), round(lat, 6)]),
    },
    properties,
  };
}

function createCorridorLayer(seed: CitySeed): TeachingDatasetLayerDefinition {
  const [minLng, minLat, maxLng, maxLat] = seed.bounds;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const features = [
    createLineFeature(
      [
        [minLng + 0.01, centerLat - 0.01],
        [centerLng - 0.005, centerLat],
        [maxLng - 0.008, centerLat + 0.012],
      ],
      {
        corridor_id: `${seed.id}_corridor_1`,
        corridor_name: seed.corridorNames[0] ?? `${seed.city} Corridor 1`,
        corridor_type: "greenway",
        canopy_pct: round(26 + (1.1 - seed.climateStress) * 28, 1),
        pedestrian_priority: round(0.68 + (1.15 - seed.climateStress) * 0.18, 2),
      },
    ),
    createLineFeature(
      [
        [minLng + 0.016, minLat + 0.014],
        [centerLng, centerLat + 0.006],
        [maxLng - 0.02, maxLat - 0.01],
      ],
      {
        corridor_id: `${seed.id}_corridor_2`,
        corridor_name: seed.corridorNames[1] ?? `${seed.city} Corridor 2`,
        corridor_type: "transit_spine",
        canopy_pct: round(18 + (1 - seed.climateStress) * 18, 1),
        pedestrian_priority: round(0.58 + seed.transitIntensity * 0.16, 2),
      },
    ),
    createLineFeature(
      [
        [centerLng - 0.02, maxLat - 0.015],
        [centerLng + 0.004, centerLat - 0.003],
        [centerLng + 0.03, minLat + 0.016],
      ],
      {
        corridor_id: `${seed.id}_corridor_3`,
        corridor_name: seed.corridorNames[2] ?? `${seed.city} Corridor 3`,
        corridor_type: "public_realm_connector",
        canopy_pct: round(21 + (1.08 - seed.climateStress) * 20, 1),
        pedestrian_priority: round(0.63 + seed.urbanIntensity * 0.12, 2),
      },
    ),
  ];

  return {
    id: "public_realm_corridors",
    title: "Public Realm Corridors",
    summary: "Line layer for corridor canopy, walkability, and public-realm prioritization exercises.",
    dataType: "line",
    geometryType: "LineString",
    crs: SHARED_CRS,
    source: seed.source,
    license: seed.license,
    updateDate: seed.updateDate,
    thematicCoverage: ["public_realm", "green_infrastructure", "mobility"],
    schemaSummary: [...CORRIDOR_SCHEMA],
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
  };
}

function buildDatasetPackage(seed: CitySeed): TeachingDatasetPackage {
  const layers = [
    createNeighborhoodLayer(seed),
    createMobilityLayer(seed),
    createCorridorLayer(seed),
  ];
  const thematicCoverage = Array.from(new Set(layers.flatMap((layer) => layer.thematicCoverage)));

  return {
    id: seed.id,
    city: seed.city,
    title: seed.title,
    summary: seed.summary,
    region: seed.region,
    source: seed.source,
    license: seed.license,
    updateDate: seed.updateDate,
    crs: SHARED_CRS,
    spatialExtent: {
      label: seed.spatialExtentLabel,
      bounds: seed.bounds,
    },
    thematicCoverage,
    searchTerms: [...seed.searchTerms, ...layers.map((layer) => layer.title.toLowerCase())],
    layers,
  };
}

export const TEACHING_DATASET_PACKAGES: readonly TeachingDatasetPackage[] = CITY_SEEDS.map(buildDatasetPackage);

export function getTeachingDatasetById(datasetId: TeachingDatasetId): TeachingDatasetPackage | undefined {
  return TEACHING_DATASET_PACKAGES.find((entry) => entry.id === datasetId);
}

export function getDatasetPackageDataTypes(dataset: TeachingDatasetPackage): TeachingDatasetDataType[] {
  return Array.from(new Set(dataset.layers.map((layer) => layer.dataType)));
}

export function getDatasetPackageFieldNames(dataset: TeachingDatasetPackage): string[] {
  return Array.from(
    new Set(dataset.layers.flatMap((layer) => layer.schemaSummary.map((field) => field.name))),
  ).sort((left, right) => left.localeCompare(right));
}

export function getThemeLabel(theme: TeachingDatasetTheme): string {
  return TEACHING_DATASET_THEME_LABELS[theme];
}

export function getDataTypeLabel(dataType: TeachingDatasetDataType): string {
  return TEACHING_DATASET_DATA_TYPE_LABELS[dataType];
}

export function describeFieldType(type: DatasetPropertyType): string {
  if (type === "integer") {
    return "Integer";
  }
  if (type === "number") {
    return "Number";
  }
  return "Text";
}