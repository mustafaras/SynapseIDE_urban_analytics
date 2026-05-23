/* ==================================================================== */
/*  Shared GIS test fixtures                                             */
/*                                                                        */
/*  Canonical, deterministic inputs reused across the Map Explorer       */
/*  Production GIS prompt ladder (15_AGENT_EXECUTION_PROMPTS.md).         */
/*  Every test prompt asserts against these stable shapes (specific      */
/*  counts / statuses / reasons), so behaviour is comparable across      */
/*  slices and agents.                                                    */
/* ==================================================================== */

import type { ExternalServiceLayerMetadata } from "../../mapTypes";

type PointFeature = GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>;
type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon, Record<string, unknown>>;
type FC<T extends GeoJSON.Feature> = GeoJSON.FeatureCollection & { features: T[] };

/** A CRS-tagged fixture: the FeatureCollection plus the CRS it represents. */
export interface CrsTaggedCollection<T extends GeoJSON.Feature> {
  /** Declared CRS, or null to model a source with no CRS metadata. */
  declaredCrs: string | null;
  featureCollection: FC<T>;
}

const ISTANBUL_LNG = 29.0;
const ISTANBUL_LAT = 41.0;

function point(lng: number, lat: number, properties: Record<string, unknown>): PointFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties,
  };
}

function square(originLng: number, originLat: number, size: number, properties: Record<string, unknown>): PolygonFeature {
  const ring: GeoJSON.Position[] = [
    [originLng, originLat],
    [originLng + size, originLat],
    [originLng + size, originLat + size],
    [originLng, originLat + size],
    [originLng, originLat],
  ];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties,
  };
}

function collection<T extends GeoJSON.Feature>(features: T[]): FC<T> {
  return { type: "FeatureCollection", features };
}

/* -------------------------------------------------------------------- */
/*  fcPointsWGS84 — 25 points, EPSG:4326, known schema                  */
/* -------------------------------------------------------------------- */

export const FC_POINTS_WGS84_COUNT = 25;

export const fcPointsWGS84: FC<PointFeature> = collection(
  Array.from({ length: FC_POINTS_WGS84_COUNT }, (_, index) => {
    const ring = Math.floor(index / 5);
    const slot = index % 5;
    return point(
      ISTANBUL_LNG + slot * 0.01,
      ISTANBUL_LAT + ring * 0.01,
      {
        id: index + 1,
        name: `site-${index + 1}`,
        value: (index + 1) * 4,
        date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
      },
    );
  }),
);

/* -------------------------------------------------------------------- */
/*  fcPolygonsProjected — 10 polygons declared in UTM 35N (EPSG:32635)  */
/* -------------------------------------------------------------------- */

export const FC_POLYGONS_PROJECTED_COUNT = 10;

export const fcPolygonsProjected: CrsTaggedCollection<PolygonFeature> = {
  declaredCrs: "EPSG:32635",
  featureCollection: collection(
    Array.from({ length: FC_POLYGONS_PROJECTED_COUNT }, (_, index) =>
      square(ISTANBUL_LNG + index * 0.02, ISTANBUL_LAT, 0.015, {
        id: index + 1,
        zone: index % 2 === 0 ? "residential" : "commercial",
        area_m2: 1_500 + index * 250,
      }),
    ),
  ),
};

/* -------------------------------------------------------------------- */
/*  fcMissingCrs — polygons with NO CRS metadata (drives unknown gates) */
/* -------------------------------------------------------------------- */

export const FC_MISSING_CRS_COUNT = 10;

export const fcMissingCrs: CrsTaggedCollection<PolygonFeature> = {
  declaredCrs: null,
  featureCollection: collection(
    Array.from({ length: FC_MISSING_CRS_COUNT }, (_, index) =>
      square(ISTANBUL_LNG + index * 0.02, ISTANBUL_LAT + 0.2, 0.015, {
        id: index + 1,
      }),
    ),
  ),
};

/* -------------------------------------------------------------------- */
/*  fcInvalidGeometry — self-intersecting + null geometry               */
/* -------------------------------------------------------------------- */

/** A bow-tie (self-intersecting) polygon ring. */
const bowTie: PolygonFeature = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[
      [ISTANBUL_LNG, ISTANBUL_LAT],
      [ISTANBUL_LNG + 0.02, ISTANBUL_LAT + 0.02],
      [ISTANBUL_LNG + 0.02, ISTANBUL_LAT],
      [ISTANBUL_LNG, ISTANBUL_LAT + 0.02],
      [ISTANBUL_LNG, ISTANBUL_LAT],
    ]],
  },
  properties: { id: 1, issue: "self-intersection" },
};

/** A feature whose geometry is null (drives null-geometry QA paths). */
const nullGeometryFeature: GeoJSON.Feature<GeoJSON.Geometry | null, Record<string, unknown>> = {
  type: "Feature",
  geometry: null,
  properties: { id: 2, issue: "null-geometry" },
};

export const fcInvalidGeometry: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [bowTie, nullGeometryFeature as GeoJSON.Feature],
};

/* -------------------------------------------------------------------- */
/*  fcLarge — generator for perf / virtualization / worker tests        */
/* -------------------------------------------------------------------- */

export const FC_LARGE_DEFAULT_COUNT = 100_000;

/**
 * Deterministic large point collection. Default is 100k features; tests
 * that only need to prove virtualization/bounded-DOM can pass a smaller n.
 */
export function fcLarge(count: number = FC_LARGE_DEFAULT_COUNT): FC<PointFeature> {
  const features: PointFeature[] = new Array(count);
  for (let index = 0; index < count; index += 1) {
    const lng = ISTANBUL_LNG + ((index * 7) % 1000) * 0.0005;
    const lat = ISTANBUL_LAT + ((index * 13) % 1000) * 0.0005;
    features[index] = point(lng, lat, { id: index + 1, value: index % 97 });
  }
  return collection(features);
}

/* -------------------------------------------------------------------- */
/*  csvPointsRaw — CSV with lat/lon + 2 attributes + 3 malformed rows   */
/* -------------------------------------------------------------------- */

export const CSV_POINTS_MALFORMED_ROW_COUNT = 3;

export const csvPointsRaw = [
  "id,name,lat,lon,value",
  "1,alpha,41.01,29.01,10",
  "2,beta,41.02,29.02,20",
  "3,gamma,41.03,29.03,30",
  "4,delta,41.04,29.04,40",
  "5,epsilon,41.05,29.05,50",
  // --- malformed rows below (missing/invalid coordinates) ---
  "6,zeta,,29.06,60",          // missing lat
  "7,eta,41.07,,70",            // missing lon
  "8,theta,not-a-number,29.08,80", // non-numeric lat
].join("\n");

/* -------------------------------------------------------------------- */
/*  externalServiceStub — offline WMS metadata                          */
/* -------------------------------------------------------------------- */

export const externalServiceStub: ExternalServiceLayerMetadata = {
  kind: "wms",
  endpoint: "https://example.invalid/wms",
  title: "Offline WMS",
  layerName: "demo:offline",
  crs: "EPSG:3857",
  dependencyStatus: "offline",
  offlineReason: "External service is unreachable in this browser session (DNS failure).",
  credentialMode: "not-required",
  corsMode: "unknown",
  license: "Unknown",
  attribution: "Example Service",
  caveats: ["External service availability has not been verified in this browser session."],
};

/* -------------------------------------------------------------------- */
/*  buildingFootprints — polygons with height + floors for extrusion    */
/* -------------------------------------------------------------------- */

export const BUILDING_FOOTPRINT_COUNT = 6;

export const buildingFootprints: FC<PolygonFeature> = collection(
  Array.from({ length: BUILDING_FOOTPRINT_COUNT }, (_, index) =>
    square(ISTANBUL_LNG + index * 0.004, ISTANBUL_LAT - 0.1, 0.003, {
      id: index + 1,
      height: 9 + index * 3,
      floors: 3 + index,
    }),
  ),
);
