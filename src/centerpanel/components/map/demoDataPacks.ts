import type { OverlayLayerConfig } from "./mapTypes";

/* ================================================================== */
/*  Map Explorer demo data pack v2                                     */
/*                                                                     */
/*  Generates a synthetic but realistic street / block / building      */
/*  dataset for three Istanbul neighbourhoods so that the calculation  */
/*  engines (LISA, Getis-Ord, regression, network, VoxCity) have a     */
/*  meaningful spatial substrate to operate on.                        */
/*                                                                     */
/*  All geometry is hand-crafted, deterministic, and explicitly marked */
/*  `sourceKind: "demo"` with QA caveats. Coordinates are EPSG:4326    */
/*  display coordinates; area/distance calculations must project       */
/*  first.                                                             */
/* ================================================================== */

export const DEMO_PACK_ID = "map-explorer-demo-pack-v2";
export const DEMO_PACK_TITLE = "Map Explorer Demo Pack - Streets, Blocks, Buildings";
export const DEMO_PACK_PROVENANCE =
  "Synthetic demo data generated in Map Explorer for UI and engine review. Not observational data.";

const DEMO_CAVEATS: readonly string[] = [
  "Synthetic demo data for interface and engine review only.",
  "Coordinates are WGS84 display coordinates; do not use for area or distance analysis without projection.",
  "Street, block, and building shapes approximate real urban grain but are not surveyed.",
];

type BuildingProfile = "historic-high-heat" | "mid-rise-moderate" | "grid-low-heat";

interface AoiSpec {
  id: string;
  name: string;
  district: string;
  origin: [number, number];
  verticalStreetNames: [string, string, string];
  horizontalStreetNames: [string, string, string];
  profile: BuildingProfile;
}

const AOI_SPECS: readonly AoiSpec[] = [
  {
    id: "uskudar",
    name: "Üsküdar — Selami Ali / Mimar Sinan",
    district: "Üsküdar",
    origin: [29.018, 41.027],
    verticalStreetNames: [
      "Selami Ali Caddesi (demo)",
      "Mimar Sinan Sokak (demo)",
      "Doğancılar Caddesi (demo)",
    ],
    horizontalStreetNames: [
      "Hakimiyet-i Milliye Caddesi (demo)",
      "Türbe Çıkmazı (demo)",
      "Halk Caddesi (demo)",
    ],
    profile: "mid-rise-moderate",
  },
  {
    id: "fatih",
    name: "Fatih — Sirkeci / Sultanahmet",
    district: "Fatih",
    origin: [28.978, 41.015],
    verticalStreetNames: [
      "Hocahanı Sokak (demo)",
      "Babıâli Caddesi (demo)",
      "Aşir Efendi Caddesi (demo)",
    ],
    horizontalStreetNames: [
      "Şehzadebaşı Caddesi (demo)",
      "Mimar Vedat Sokak (demo)",
      "İmam Aşır Sokak (demo)",
    ],
    profile: "historic-high-heat",
  },
  {
    id: "kadikoy",
    name: "Kadıköy — Moda / Bahariye",
    district: "Kadıköy",
    origin: [29.030, 40.996],
    verticalStreetNames: [
      "Bahariye Caddesi (demo)",
      "Şair Nedim Caddesi (demo)",
      "Mühürdar Caddesi (demo)",
    ],
    horizontalStreetNames: [
      "Moda Caddesi (demo)",
      "General Asım Gündüz Caddesi (demo)",
      "Caferağa Sokak (demo)",
    ],
    profile: "grid-low-heat",
  },
];

/* ------------------------------------------------------------------ */
/*  Grid geometry                                                      */
/* ------------------------------------------------------------------ */

const LNG_STEP = 0.003; // ~250 m at 41°N
const LAT_STEP = 0.0018; // ~200 m at 41°N
const STREET_COLS = 3;
const STREET_ROWS = 3;

function lngAt(origin: [number, number], col: number, jitter = 0): number {
  return Number((origin[0] + col * LNG_STEP + jitter).toFixed(6));
}

function latAt(origin: [number, number], row: number, jitter = 0): number {
  return Number((origin[1] - row * LAT_STEP + jitter).toFixed(6));
}

/* ------------------------------------------------------------------ */
/*  Profile-driven attribute generators                                */
/* ------------------------------------------------------------------ */

interface ProfileRanges {
  heatBase: number;
  heatVariance: number;
  floorsBase: number;
  floorsVariance: number;
  accessBase: number;
  accessVariance: number;
  dwellingsBase: number;
  dwellingsVariance: number;
  yearBase: number;
  yearVariance: number;
  mixedUseRatio: number;
}

const PROFILE_RANGES: Record<BuildingProfile, ProfileRanges> = {
  "historic-high-heat": {
    heatBase: 78,
    heatVariance: 14,
    floorsBase: 4,
    floorsVariance: 2,
    accessBase: 72,
    accessVariance: 18,
    dwellingsBase: 130,
    dwellingsVariance: 40,
    yearBase: 1955,
    yearVariance: 35,
    mixedUseRatio: 0.62,
  },
  "mid-rise-moderate": {
    heatBase: 64,
    heatVariance: 16,
    floorsBase: 5,
    floorsVariance: 3,
    accessBase: 78,
    accessVariance: 14,
    dwellingsBase: 160,
    dwellingsVariance: 50,
    yearBase: 1985,
    yearVariance: 25,
    mixedUseRatio: 0.41,
  },
  "grid-low-heat": {
    heatBase: 55,
    heatVariance: 12,
    floorsBase: 6,
    floorsVariance: 2,
    accessBase: 85,
    accessVariance: 10,
    dwellingsBase: 195,
    dwellingsVariance: 35,
    yearBase: 1995,
    yearVariance: 20,
    mixedUseRatio: 0.36,
  },
};

function classifyHeat(heat: number): string {
  if (heat >= 85) return "Very high";
  if (heat >= 70) return "High";
  if (heat >= 55) return "Moderate";
  return "Low";
}

function classifyAccess(score: number): string {
  if (score >= 80) return "High";
  if (score >= 65) return "Moderate";
  return "Low";
}

const USE_TYPES = ["mixed_use", "residential", "civic", "education", "retail", "office"] as const;
type RoadClass = "primary" | "secondary" | "residential";
const ROAD_LANES: Record<RoadClass, number> = {
  primary: 3,
  secondary: 2,
  residential: 1,
};

/* ------------------------------------------------------------------ */
/*  Bounds helpers                                                     */
/* ------------------------------------------------------------------ */

interface MutableBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

function emptyBounds(): MutableBounds {
  return {
    minLng: Number.POSITIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
  };
}

function expandBounds(bounds: MutableBounds, lng: number, lat: number): void {
  if (lng < bounds.minLng) bounds.minLng = lng;
  if (lat < bounds.minLat) bounds.minLat = lat;
  if (lng > bounds.maxLng) bounds.maxLng = lng;
  if (lat > bounds.maxLat) bounds.maxLat = lat;
}

function freezeBounds(bounds: MutableBounds): [number, number, number, number] {
  return [
    Number(bounds.minLng.toFixed(6)),
    Number(bounds.minLat.toFixed(6)),
    Number(bounds.maxLng.toFixed(6)),
    Number(bounds.maxLat.toFixed(6)),
  ];
}

function collectFeatureCollectionBounds(
  collection: GeoJSON.FeatureCollection,
): [number, number, number, number] {
  const bounds = emptyBounds();
  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    const [lng, lat] = value;
    if (typeof lng === "number" && typeof lat === "number") {
      expandBounds(bounds, lng, lat);
      return;
    }
    for (const entry of value) visit(entry);
  };
  for (const feature of collection.features) {
    if (feature.geometry && "coordinates" in feature.geometry) {
      visit(feature.geometry.coordinates);
    }
  }
  return freezeBounds(bounds);
}

/* ------------------------------------------------------------------ */
/*  Geometry haversine length (approximate, for road length labels)    */
/* ------------------------------------------------------------------ */

const EARTH_RADIUS_M = 6_371_008.8;

function haversineMeters(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
}

/* ------------------------------------------------------------------ */
/*  Street features                                                    */
/* ------------------------------------------------------------------ */

function buildStreetFeatures(aoi: AoiSpec): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];

  // Horizontal streets (constant lat, varying lng) — 3 per AOI.
  for (let row = 0; row < STREET_ROWS; row += 1) {
    const lat = latAt(aoi.origin, row);
    const start: [number, number] = [lngAt(aoi.origin, 0, -0.0004), lat];
    const mid: [number, number] = [lngAt(aoi.origin, 1), latAt(aoi.origin, row, 0.00005)];
    const end: [number, number] = [lngAt(aoi.origin, STREET_COLS - 1, 0.0004), lat];
    const roadClass = row === 0 ? "primary" : row === 1 ? "secondary" : "residential";
    const length = haversineMeters(start, mid) + haversineMeters(mid, end);
    features.push({
      type: "Feature",
      id: `street-${aoi.id}-h${row + 1}`,
      properties: {
        street_id: `STR-${aoi.id.toUpperCase()}-H${row + 1}`,
        name: aoi.horizontalStreetNames[row]!,
        road_class: roadClass,
        lanes: ROAD_LANES[roadClass],
        length_m: length,
        oneway: row === 1,
        aoi_id: aoi.id,
        demo_note: "synthetic",
      },
      geometry: { type: "LineString", coordinates: [start, mid, end] },
    });
  }

  // Vertical streets (constant lng, varying lat).
  for (let col = 0; col < STREET_COLS; col += 1) {
    const lng = lngAt(aoi.origin, col);
    const start: [number, number] = [lng, latAt(aoi.origin, 0, 0.0003)];
    const mid: [number, number] = [lngAt(aoi.origin, col, 0.00006), latAt(aoi.origin, 1)];
    const end: [number, number] = [lng, latAt(aoi.origin, STREET_ROWS - 1, -0.0003)];
    const roadClass = col === 1 ? "primary" : col === 0 ? "secondary" : "residential";
    const length = haversineMeters(start, mid) + haversineMeters(mid, end);
    features.push({
      type: "Feature",
      id: `street-${aoi.id}-v${col + 1}`,
      properties: {
        street_id: `STR-${aoi.id.toUpperCase()}-V${col + 1}`,
        name: aoi.verticalStreetNames[col]!,
        road_class: roadClass,
        lanes: ROAD_LANES[roadClass],
        length_m: length,
        oneway: false,
        aoi_id: aoi.id,
        demo_note: "synthetic",
      },
      geometry: { type: "LineString", coordinates: [start, mid, end] },
    });
  }

  return features;
}

/* ------------------------------------------------------------------ */
/*  Block (ada) features                                               */
/* ------------------------------------------------------------------ */

function buildBlockFeatures(aoi: AoiSpec): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];
  const ranges = PROFILE_RANGES[aoi.profile];

  let blockIndex = 0;
  for (let row = 0; row < STREET_ROWS - 1; row += 1) {
    for (let col = 0; col < STREET_COLS - 1; col += 1) {
      blockIndex += 1;
      const inset = 0.00012;
      const nw: [number, number] = [
        lngAt(aoi.origin, col, inset),
        latAt(aoi.origin, row, -inset),
      ];
      const ne: [number, number] = [
        lngAt(aoi.origin, col + 1, -inset),
        latAt(aoi.origin, row, -inset - 0.00002),
      ];
      const se: [number, number] = [
        lngAt(aoi.origin, col + 1, -inset),
        latAt(aoi.origin, row + 1, inset),
      ];
      const sw: [number, number] = [
        lngAt(aoi.origin, col, inset),
        latAt(aoi.origin, row + 1, inset + 0.00002),
      ];

      const accessScore = Math.max(
        20,
        Math.min(
          100,
          Math.round(
            ranges.accessBase +
              (col - 1) * (ranges.accessVariance / 2) -
              (row - 0.5) * (ranges.accessVariance / 3),
          ),
        ),
      );
      const dwellings = Math.max(
        30,
        Math.round(ranges.dwellingsBase + ((blockIndex % 3) - 1) * (ranges.dwellingsVariance / 2)),
      );
      const mixedUseRatio = Number(
        Math.max(
          0.1,
          Math.min(
            0.95,
            ranges.mixedUseRatio + ((blockIndex % 2 === 0 ? 1 : -1) * 0.08),
          ),
        ).toFixed(2),
      );

      features.push({
        type: "Feature",
        id: `block-${aoi.id}-${blockIndex}`,
        properties: {
          block_id: `BLK-${aoi.id.toUpperCase()}-${String(blockIndex).padStart(2, "0")}`,
          name: `${aoi.district} Block ${blockIndex}`,
          aoi_id: aoi.id,
          access_class: classifyAccess(accessScore),
          access_score: accessScore,
          dwellings,
          mixed_use_ratio: mixedUseRatio,
          built_year_avg: ranges.yearBase + ((blockIndex % 4) * (ranges.yearVariance / 6)),
          area_m2: Math.round(LNG_STEP * 84_000 * LAT_STEP * 111_000 * 0.001),
          demo_note: "synthetic",
        },
        geometry: { type: "Polygon", coordinates: [[nw, ne, se, sw, nw]] },
      });
    }
  }

  return features;
}

/* ------------------------------------------------------------------ */
/*  Building (bina) features                                           */
/* ------------------------------------------------------------------ */

interface BuildingSlot {
  lngOffset: number;
  latOffset: number;
  width: number;
  height: number;
}

const BUILDING_SLOTS: readonly BuildingSlot[] = [
  { lngOffset: 0.00035, latOffset: -0.00028, width: 0.0009, height: 0.0005 },
  { lngOffset: 0.0016, latOffset: -0.00028, width: 0.0009, height: 0.0005 },
  { lngOffset: 0.00085, latOffset: -0.00115, width: 0.0014, height: 0.0005 },
];

function buildBuildingFeatures(aoi: AoiSpec): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];
  const ranges = PROFILE_RANGES[aoi.profile];

  let blockIndex = 0;
  let buildingIndex = 0;
  for (let row = 0; row < STREET_ROWS - 1; row += 1) {
    for (let col = 0; col < STREET_COLS - 1; col += 1) {
      blockIndex += 1;
      const blockId = `BLK-${aoi.id.toUpperCase()}-${String(blockIndex).padStart(2, "0")}`;

      BUILDING_SLOTS.forEach((slot, slotIndex) => {
        buildingIndex += 1;
        const cornerLng = lngAt(aoi.origin, col, slot.lngOffset);
        const cornerLat = latAt(aoi.origin, row, slot.latOffset);
        const east = Number((cornerLng + slot.width).toFixed(6));
        const south = Number((cornerLat - slot.height).toFixed(6));

        const useType = USE_TYPES[(buildingIndex + slotIndex) % USE_TYPES.length]!;
        const floors = Math.max(
          1,
          Math.min(
            14,
            ranges.floorsBase + ((slotIndex - 1) % 3) + ((blockIndex % 2 === 0) ? 1 : -1),
          ),
        );
        const heightM = floors * 3.2;
        const heatExposure = Math.max(
          25,
          Math.min(
            100,
            Math.round(
              ranges.heatBase +
                (slotIndex - 1) * (ranges.heatVariance / 3) +
                ((blockIndex % 3) - 1) * 4,
            ),
          ),
        );
        const yearBuilt = ranges.yearBase + ((buildingIndex * 7) % ranges.yearVariance);
        const footprintArea = Math.round(slot.width * 84_000 * slot.height * 111_000);

        features.push({
          type: "Feature",
          id: `building-${aoi.id}-${buildingIndex}`,
          properties: {
            building_id: `BLD-${aoi.id.toUpperCase()}-${String(buildingIndex).padStart(3, "0")}`,
            name: `${aoi.district} ${useType} ${buildingIndex}`,
            aoi_id: aoi.id,
            block_id: blockId,
            use_type: useType,
            floors,
            height_m: Number(heightM.toFixed(1)),
            heat_exposure: heatExposure,
            risk_class: classifyHeat(heatExposure),
            year_built: yearBuilt,
            footprint_area_m2: footprintArea,
            demo_note: "synthetic",
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cornerLng, cornerLat],
              [east, cornerLat],
              [east, south],
              [cornerLng, south],
              [cornerLng, cornerLat],
            ]],
          },
        });
      });
    }
  }

  return features;
}

/* ------------------------------------------------------------------ */
/*  Schema descriptors                                                 */
/* ------------------------------------------------------------------ */

type SchemaField = { name: string; role: "identifier" | "attribute"; type: "string" | "number" | "boolean" };

const STREET_SCHEMA: SchemaField[] = [
  { name: "street_id", role: "identifier", type: "string" },
  { name: "name", role: "attribute", type: "string" },
  { name: "road_class", role: "attribute", type: "string" },
  { name: "lanes", role: "attribute", type: "number" },
  { name: "length_m", role: "attribute", type: "number" },
  { name: "oneway", role: "attribute", type: "boolean" },
  { name: "aoi_id", role: "attribute", type: "string" },
];

const BLOCK_SCHEMA: SchemaField[] = [
  { name: "block_id", role: "identifier", type: "string" },
  { name: "name", role: "attribute", type: "string" },
  { name: "aoi_id", role: "attribute", type: "string" },
  { name: "access_class", role: "attribute", type: "string" },
  { name: "access_score", role: "attribute", type: "number" },
  { name: "dwellings", role: "attribute", type: "number" },
  { name: "mixed_use_ratio", role: "attribute", type: "number" },
  { name: "built_year_avg", role: "attribute", type: "number" },
  { name: "area_m2", role: "attribute", type: "number" },
];

const BUILDING_SCHEMA: SchemaField[] = [
  { name: "building_id", role: "identifier", type: "string" },
  { name: "name", role: "attribute", type: "string" },
  { name: "aoi_id", role: "attribute", type: "string" },
  { name: "block_id", role: "attribute", type: "string" },
  { name: "use_type", role: "attribute", type: "string" },
  { name: "floors", role: "attribute", type: "number" },
  { name: "height_m", role: "attribute", type: "number" },
  { name: "heat_exposure", role: "attribute", type: "number" },
  { name: "risk_class", role: "attribute", type: "string" },
  { name: "year_built", role: "attribute", type: "number" },
  { name: "footprint_area_m2", role: "attribute", type: "number" },
];

/* ------------------------------------------------------------------ */
/*  Style presets                                                      */
/* ------------------------------------------------------------------ */

const STREET_STYLE = {
  "line-color": [
    "match",
    ["get", "road_class"],
    "primary",
    "#F59E0B",
    "secondary",
    "#FACC15",
    "residential",
    "#94A3B8",
    "#94A3B8",
  ],
  "line-width": [
    "match",
    ["get", "road_class"],
    "primary",
    3,
    "secondary",
    2,
    1.2,
  ],
  legendEntries: [
    { label: "Primary (demo)", color: "#F59E0B" },
    { label: "Secondary (demo)", color: "#FACC15" },
    { label: "Residential (demo)", color: "#94A3B8" },
  ],
} as const;

const BLOCK_STYLE = {
  "fill-color": [
    "match",
    ["get", "access_class"],
    "High",
    "#16A34A",
    "Moderate",
    "#F59E0B",
    "Low",
    "#EF4444",
    "#94A3B8",
  ],
  "fill-opacity": 0.55,
  "fill-outline-color": "rgba(15, 23, 42, 0.85)",
  legendEntries: [
    { label: "High access (demo)", color: "#16A34A" },
    { label: "Moderate access (demo)", color: "#F59E0B" },
    { label: "Low access (demo)", color: "#EF4444" },
  ],
} as const;

const BUILDING_STYLE = {
  "fill-color": [
    "match",
    ["get", "risk_class"],
    "Very high",
    "#DC2626",
    "High",
    "#F97316",
    "Moderate",
    "#A855F7",
    "Low",
    "#22C55E",
    "#94A3B8",
  ],
  "fill-opacity": 0.78,
  "fill-outline-color": "rgba(15, 23, 42, 0.92)",
  __labelField: "building_id",
  __labelSize: 9,
  legendEntries: [
    { label: "Very high heat (demo)", color: "#DC2626" },
    { label: "High heat (demo)", color: "#F97316" },
    { label: "Moderate heat (demo)", color: "#A855F7" },
    { label: "Low heat (demo)", color: "#22C55E" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Layer config builders                                              */
/* ------------------------------------------------------------------ */

type LayerKind = "streets" | "blocks" | "buildings";

interface BuildLayerOptions {
  aoi: AoiSpec;
  kind: LayerKind;
  features: GeoJSON.Feature[];
  createdAt: string;
}

function buildLayerConfig(options: BuildLayerOptions): OverlayLayerConfig {
  const { aoi, kind, features, createdAt } = options;
  const collection: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
  const bounds = collectFeatureCollectionBounds(collection);
  const geometryType = kind === "streets" ? "LineString" : "Polygon";
  const schema = kind === "streets" ? STREET_SCHEMA : kind === "blocks" ? BLOCK_SCHEMA : BUILDING_SCHEMA;
  const style = kind === "streets" ? STREET_STYLE : kind === "blocks" ? BLOCK_STYLE : BUILDING_STYLE;
  const kindLabel = kind === "streets" ? "Streets" : kind === "blocks" ? "Blocks" : "Buildings";
  const layerId = `demo-${aoi.id}-${kind}`;
  const layerName = `${aoi.district} Demo ${kindLabel}`;
  const signature = `${DEMO_PACK_ID}/${aoi.id}/${kind}`;

  return {
    id: layerId,
    name: layerName,
    type: "geojson",
    visible: true,
    opacity: kind === "streets" ? 0.92 : kind === "blocks" ? 0.6 : 0.85,
    group: "data",
    sourceKind: "demo",
    qaStatus: "warning",
    queryable: true,
    sourceData: collection,
    style,
    provenance: {
      label: DEMO_PACK_PROVENANCE,
      sourceName: DEMO_PACK_TITLE,
      license: "Demo only",
      attribution: "Synthetic demo data - Map Explorer",
      generatedAt: createdAt,
      notes: [...DEMO_CAVEATS],
    },
    metadata: {
      featureCount: features.length,
      geometryType,
      bounds,
      fields: schema.map((field) => field.name),
      dataVersion: signature,
      datasetContext: {
        datasetId: DEMO_PACK_ID,
        datasetTitle: DEMO_PACK_TITLE,
        datasetCity: `Istanbul demo - ${aoi.district}`,
        source: DEMO_PACK_PROVENANCE,
        license: "Demo only",
        crs: "EPSG:4326",
        updateDate: createdAt,
        packageLayerCount: 9,
        packageFeatureCount: 22 * AOI_SPECS.length,
        layerId,
        layerTitle: layerName,
        thematicCoverage:
          kind === "streets"
            ? ["mobility", "network"]
            : kind === "blocks"
              ? ["urban-form", "accessibility"]
              : ["climate-adaptation", "built-environment"],
        spatialExtent: aoi.name,
        schemaSummary: schema.map((field) => field.name),
      },
      crsSummary: {
        crs: "EPSG:4326",
        status: "known",
        source: "explicit",
        notes: [DEMO_CAVEATS[1]!],
      },
      geometrySummary: {
        geometryType,
        geometryTypes: [geometryType],
        featureCount: features.length,
        source: "explicit",
        notes: [`Synthetic ${kindLabel.toLowerCase()} for ${aoi.district}.`],
        bounds,
      },
      schemaSummary: {
        fieldCount: schema.length,
        fields: schema,
        source: "explicit",
        notes: ["Demo schema for UI and engine review."],
      },
      licenseAttribution: {
        license: "Demo only",
        attribution: "Synthetic demo data - Map Explorer",
        sourceName: DEMO_PACK_TITLE,
        requiresAttribution: true,
        source: "explicit",
        notes: [...DEMO_CAVEATS],
      },
      publicationReadiness: {
        status: "ready-with-caveats",
        missingFields: [],
        blockingIssueIds: [],
        caveats: [...DEMO_CAVEATS],
        checkedAt: createdAt,
      },
      scientificQA: {
        status: "warning",
        issueIds: ["demo-sample-data"],
        badges: ["sample_data"],
        checkedAt: createdAt,
        featureIssueCount: 0,
        usedWorker: false,
        caveats: [...DEMO_CAVEATS],
        signature,
      },
    },
  } satisfies OverlayLayerConfig;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface DemoAoiBounds {
  id: string;
  name: string;
  district: string;
  bounds: [number, number, number, number];
}

/**
 * Returns 9 demo layers (3 AOIs × {streets, blocks, buildings}). Layer order:
 * streets first, then blocks, then buildings so that buildings render on top
 * inside their parent block. AOI order: Üsküdar → Fatih → Kadıköy.
 */
export function createMapExplorerDemoLayerPack(
  createdAt: string = new Date().toISOString(),
): OverlayLayerConfig[] {
  const layers: OverlayLayerConfig[] = [];
  for (const aoi of AOI_SPECS) {
    const streets = buildStreetFeatures(aoi);
    const blocks = buildBlockFeatures(aoi);
    const buildings = buildBuildingFeatures(aoi);
    layers.push(buildLayerConfig({ aoi, kind: "streets", features: streets, createdAt }));
    layers.push(buildLayerConfig({ aoi, kind: "blocks", features: blocks, createdAt }));
    layers.push(buildLayerConfig({ aoi, kind: "buildings", features: buildings, createdAt }));
  }
  return layers;
}

/**
 * Returns the bounding box of each demo AOI so callers can target external
 * service queries (Overpass, WMS) at the same area.
 */
export function getDemoAoiBoundsList(): DemoAoiBounds[] {
  return AOI_SPECS.map((aoi) => {
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [...buildStreetFeatures(aoi), ...buildBlockFeatures(aoi), ...buildBuildingFeatures(aoi)],
    };
    return {
      id: aoi.id,
      name: aoi.name,
      district: aoi.district,
      bounds: collectFeatureCollectionBounds(collection),
    };
  });
}
