/**
 * VoxCity → Map Explorer geographic projection helpers.
 *
 * Sample buildings and CityJSON fixtures live in a local metric coordinate
 * system (metres) anchored near (0, 0). To overlay them on the 2D MapLibre
 * canvas they must be reprojected to EPSG:4326 (lon/lat).
 *
 * We use a simple equirectangular projection around a configurable anchor
 * point. This is accurate enough for the small block-scale extents of the
 * sample datasets (≤ 1 km); for production CityJSON datasets that already
 * carry an EPSG-coded reference, callers should bypass this transform and
 * pass coordinates through unchanged via `projectionMode: "passthrough"`.
 */

import type {
  BuildingFeature,
  Ring,
} from "@/features/urbanAnalytics/voxcity/buildingTypes";
import type {
  ParsedCityObject,
  SemanticSurfaceType,
} from "@/features/urbanAnalytics/voxcity/cityJsonTypes";

/* ================================================================== */
/*  §1  Anchor configuration                                          */
/* ================================================================== */

/** Geographic anchor point that the local origin (0, 0) maps to. */
export interface VoxCityGeoAnchor {
  /** Anchor longitude in degrees (EPSG:4326). */
  longitude: number;
  /** Anchor latitude in degrees (EPSG:4326). */
  latitude: number;
}

export type VoxCityProjectionMode = "anchored" | "passthrough";

/**
 * Default anchor — central Berlin (Brandenburger Tor area). Chosen because
 * it shows up clearly on the default basemap and is a recognisable urban
 * setting for the sample dataset.
 */
export const DEFAULT_VOXCITY_GEO_ANCHOR: VoxCityGeoAnchor = {
  longitude: 13.3777,
  latitude: 52.5163,
};

const EARTH_RADIUS_M = 6_378_137;

/** Convert metres → longitude degrees at the given latitude. */
function metresToLonDeg(metres: number, latitudeDeg: number): number {
  const cosLat = Math.cos((latitudeDeg * Math.PI) / 180);
  if (cosLat === 0) {
    return 0;
  }
  return (metres / (EARTH_RADIUS_M * cosLat)) * (180 / Math.PI);
}

/** Convert metres → latitude degrees. */
function metresToLatDeg(metres: number): number {
  return (metres / EARTH_RADIUS_M) * (180 / Math.PI);
}

/**
 * Project a single (x, y) point in local metres to (lon, lat) using the
 * supplied anchor.
 */
export function projectLocalPointToGeographic(
  x: number,
  y: number,
  anchor: VoxCityGeoAnchor = DEFAULT_VOXCITY_GEO_ANCHOR,
): [number, number] {
  return [
    anchor.longitude + metresToLonDeg(x, anchor.latitude),
    anchor.latitude + metresToLatDeg(y),
  ];
}

/* ================================================================== */
/*  §2  Building footprint projection                                 */
/* ================================================================== */

function projectRing(
  ring: Ring,
  anchor: VoxCityGeoAnchor,
  projectionMode: VoxCityProjectionMode = "anchored",
): GeoJSON.Position[] {
  return ring.map(([x, y]) => projectionMode === "passthrough" ? [x, y] : projectLocalPointToGeographic(x, y, anchor));
}

/** Convert a `BuildingFeature` into a GeoJSON polygon feature in EPSG:4326. */
export function buildingFeatureToGeoJSON(
  feature: BuildingFeature,
  anchor: VoxCityGeoAnchor = DEFAULT_VOXCITY_GEO_ANCHOR,
  options: { projectionMode?: VoxCityProjectionMode } = {},
): GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties> {
  const projectionMode = options.projectionMode ?? "anchored";
  const outer = projectRing(feature.footprint.outer, anchor, projectionMode);
  const holes = feature.footprint.holes?.map((hole) => projectRing(hole, anchor, projectionMode)) ?? [];

  return {
    type: "Feature",
    id: feature.id,
    geometry: {
      type: "Polygon",
      coordinates: [outer, ...holes],
    },
    properties: {
      ...(feature.attributes as GeoJSON.GeoJsonProperties),
      building_id: feature.id,
      __voxcity_kind: "building",
    },
  };
}

/** Convert a list of `BuildingFeature` to a GeoJSON FeatureCollection. */
export function buildingFeaturesToGeoJSON(
  features: readonly BuildingFeature[],
  anchor: VoxCityGeoAnchor = DEFAULT_VOXCITY_GEO_ANCHOR,
  options: { projectionMode?: VoxCityProjectionMode } = {},
): GeoJSON.FeatureCollection<GeoJSON.Polygon, GeoJSON.GeoJsonProperties> {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => buildingFeatureToGeoJSON(feature, anchor, options)),
  };
}

/* ================================================================== */
/*  §3  CityJSON ground-plane footprint extraction                    */
/* ================================================================== */

/**
 * Convert a CityJSON `ParsedSurface` into a 2D ring (lon/lat) by dropping
 * the Z coordinate. `semanticType` is preserved so callers can colour by
 * roof / wall / ground.
 */
export interface CityJSONFootprintRing {
  /** Originating CityObject id. */
  cityObjectId: string;
  /** Object type (e.g. "Building"). */
  cityObjectType: string;
  /** LOD label (e.g. "2.0"). */
  lod: string;
  /** Semantic surface type, if any. */
  semanticType: SemanticSurfaceType | null;
  /** Min Z of the surface vertices (used to detect ground plane). */
  minZ: number;
  /** Max Z. */
  maxZ: number;
  /** Coordinates (closed ring) in EPSG:4326. */
  coordinates: GeoJSON.Position[];
  /** Convenience: cityObject attribute bag (back-reference). */
  attributes: Record<string, unknown>;
}

function tracePerimeterFromTriangles(
  positions: Float32Array,
  indices: Uint32Array,
): number[] {
  if (indices.length === 0 || positions.length === 0) {
    return [];
  }

  // Each undirected edge that appears in exactly one triangle is a boundary edge.
  type EdgeKey = string;
  const edgeCounts = new Map<EdgeKey, { a: number; b: number; count: number }>();
  const key = (a: number, b: number): EdgeKey => (a < b ? `${a}_${b}` : `${b}_${a}`);

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const k = key(u, v);
      const entry = edgeCounts.get(k);
      if (entry) {
        entry.count += 1;
      } else {
        edgeCounts.set(k, { a: u, b: v, count: 1 });
      }
    }
  }

  const adjacency = new Map<number, number[]>();
  edgeCounts.forEach((entry) => {
    if (entry.count !== 1) return;
    if (!adjacency.has(entry.a)) adjacency.set(entry.a, []);
    if (!adjacency.has(entry.b)) adjacency.set(entry.b, []);
    adjacency.get(entry.a)!.push(entry.b);
    adjacency.get(entry.b)!.push(entry.a);
  });

  if (adjacency.size === 0) {
    return [];
  }

  const start = adjacency.keys().next().value as number;
  const path: number[] = [start];
  const visited = new Set<string>();
  let prev = -1;
  let curr = start;

  while (true) {
    const neighbours = adjacency.get(curr) ?? [];
    let next = -1;
    for (const cand of neighbours) {
      if (cand === prev) continue;
      const eKey = key(curr, cand);
      if (visited.has(eKey)) continue;
      next = cand;
      visited.add(eKey);
      break;
    }
    if (next === -1) break;
    if (next === start) {
      path.push(start);
      break;
    }
    path.push(next);
    prev = curr;
    curr = next;
    if (path.length > positions.length) break; // safety
  }

  return path;
}

/**
 * Extract a single 2D ring (in lon/lat) from a CityJSON parsed surface,
 * by tracing the boundary of the triangulated mesh and projecting it.
 */
function surfaceToRing(
  positions: Float32Array,
  indices: Uint32Array,
  anchor: VoxCityGeoAnchor,
  projectionMode: VoxCityProjectionMode,
): { ring: GeoJSON.Position[]; minZ: number; maxZ: number } {
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i];
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const perimeter = tracePerimeterFromTriangles(positions, indices);
  if (perimeter.length < 3) {
    return { ring: [], minZ, maxZ };
  }

  const ring: GeoJSON.Position[] = perimeter.map((idx) => {
    const x = positions[idx * 3];
    const y = positions[idx * 3 + 1];
    return projectionMode === "passthrough" ? [x, y] : projectLocalPointToGeographic(x, y, anchor);
  });

  if (ring.length < 4) {
    return { ring: [], minZ, maxZ };
  }

  // Ensure closure
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) {
    ring.push([fx, fy]);
  }

  return { ring, minZ, maxZ };
}

/**
 * For a `ParsedCityObject`, return its ground-level footprint ring(s)
 * — one per semantic surface, with annotations.
 *
 * The "ground" surface is identified as the surface with the lowest Z and
 * a `GroundSurface` semantic tag when available, otherwise we emit one
 * ring per surface so that CSS-level filtering (roof/wall/ground) can
 * happen downstream.
 */
export function extractCityObjectFootprintRings(
  object: ParsedCityObject,
  anchor: VoxCityGeoAnchor = DEFAULT_VOXCITY_GEO_ANCHOR,
  options: { projectionMode?: VoxCityProjectionMode } = {},
): CityJSONFootprintRing[] {
  const out: CityJSONFootprintRing[] = [];
  const projectionMode = options.projectionMode ?? "anchored";
  for (const surface of object.surfaces) {
    const { ring, minZ, maxZ } = surfaceToRing(surface.positions, surface.indices, anchor, projectionMode);
    if (ring.length === 0) continue;
    out.push({
      cityObjectId: object.id,
      cityObjectType: object.type,
      lod: object.lod,
      semanticType: surface.semanticType,
      minZ,
      maxZ,
      coordinates: ring,
      attributes: object.attributes,
    });
  }
  return out;
}

/**
 * Build a GeoJSON FeatureCollection of CityJSON footprints, classified by
 * semantic surface type. Suitable for direct binding to MapLibre.
 */
export function cityJSONObjectsToFootprintCollection(
  objects: readonly ParsedCityObject[],
  anchor: VoxCityGeoAnchor = DEFAULT_VOXCITY_GEO_ANCHOR,
  options: { lodFilter?: string | null; projectionMode?: VoxCityProjectionMode } = {},
): GeoJSON.FeatureCollection<GeoJSON.Polygon, GeoJSON.GeoJsonProperties> {
  const features: GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>[] = [];
  for (const object of objects) {
    if (options.lodFilter && object.lod !== options.lodFilter) {
      continue;
    }
    const rings = extractCityObjectFootprintRings(
      object,
      anchor,
      options.projectionMode ? { projectionMode: options.projectionMode } : {},
    );
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      features.push({
        type: "Feature",
        id: `${r.cityObjectId}::surface::${i}`,
        geometry: {
          type: "Polygon",
          coordinates: [r.coordinates],
        },
        properties: {
          city_object_id: r.cityObjectId,
          city_object_type: r.cityObjectType,
          lod: r.lod,
          semantic_type: r.semanticType ?? "Unknown",
          surface_min_z: r.minZ,
          surface_max_z: r.maxZ,
          building_id: r.cityObjectId,
          __voxcity_kind: "cityjson",
          ...r.attributes,
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

/**
 * Discover the unique LOD strings present across a CityJSON object set.
 * Sorted ascending by numeric value of the LOD label.
 */
export function listCityJSONLodLevels(
  objects: readonly ParsedCityObject[],
): string[] {
  const set = new Set<string>();
  for (const o of objects) {
    if (o.lod) set.add(o.lod);
  }
  return [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
}

/**
 * Compute geographic bounds of a feature collection [minLon, minLat, maxLon, maxLat].
 * Returns null when the collection is empty.
 */
export function geoBoundsOfCollection(
  collection: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
): [number, number, number, number] | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let any = false;

  const visit = (rings: GeoJSON.Position[][]) => {
    for (const r of rings) {
      for (const [x, y] of r) {
        any = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  };

  for (const f of collection.features) {
    if (f.geometry.type === "Polygon") {
      visit(f.geometry.coordinates);
    } else if (f.geometry.type === "MultiPolygon") {
      for (const poly of f.geometry.coordinates) {
        visit(poly);
      }
    }
  }

  return any ? [minX, minY, maxX, maxY] : null;
}
