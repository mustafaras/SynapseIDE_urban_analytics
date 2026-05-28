/**
 * Prompt 44 — rbush-backed spatial index for in-worker extent queries.
 * Pure functions — no side effects, safe to run in a web worker.
 */
import RBush from "rbush";
import type { Feature, FeatureCollection, Geometry, BBox } from "geojson";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

/** Axis-aligned bounding box in WGS-84 degrees (EPSG:4326). */
export interface ViewportExtent {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface RbushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  featureIndex: number;
}

export interface ExtentIndex {
  tree: RBush<RbushItem>;
  features: Feature[];
  totalCount: number;
}

export interface ExtentQueryResult {
  features: Feature[];
  /** Number of features intersecting the current viewport. */
  inViewCount: number;
  /** Total features in the source — null when streaming (unknown). */
  totalCount: number | null;
  /** When true the source is streaming; totalCount must not be presented as a full count. */
  isStreaming: boolean;
  /** Diagnostic: how the query was resolved. */
  queryMode: "rbush-index" | "flatgeobuf-stream" | "full-scan";
}

/* ------------------------------------------------------------------ */
/*  Geometry BBox helpers                                               */
/* ------------------------------------------------------------------ */

/** Extract a WGS-84 bounding box from a single GeoJSON geometry. */
export function geomBbox(geom: Geometry): BBox | null {
  if (!geom) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function visitCoord(coord: number[]): void {
    if (coord[0] < minX) minX = coord[0];
    if (coord[0] > maxX) maxX = coord[0];
    if (coord[1] < minY) minY = coord[1];
    if (coord[1] > maxY) maxY = coord[1];
  }

  function visitCoords(coords: unknown): void {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number") {
      visitCoord(coords as number[]);
    } else {
      for (const c of coords) visitCoords(c);
    }
  }

  if (geom.type === "Point") {
    visitCoord(geom.coordinates);
  } else if (
    geom.type === "MultiPoint" ||
    geom.type === "LineString" ||
    geom.type === "MultiLineString" ||
    geom.type === "Polygon" ||
    geom.type === "MultiPolygon" ||
    geom.type === "GeometryCollection"
  ) {
    if ("coordinates" in geom) {
      visitCoords(geom.coordinates);
    } else if ("geometries" in geom) {
      for (const g of geom.geometries) {
        const bb = geomBbox(g);
        if (bb) {
          if (bb[0] < minX) minX = bb[0];
          if (bb[1] < minY) minY = bb[1];
          if (bb[2] > maxX) maxX = bb[2];
          if (bb[3] > maxY) maxY = bb[3];
        }
      }
    }
  }

  if (!isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

/* ------------------------------------------------------------------ */
/*  Index construction                                                  */
/* ------------------------------------------------------------------ */

/**
 * Build an rbush spatial index from a GeoJSON FeatureCollection.
 * Safe to call from a worker with the features array.
 */
export function buildRbushIndex(fc: FeatureCollection): ExtentIndex {
  const tree = new RBush<RbushItem>();
  const features = fc.features;
  const items: RbushItem[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (!f.geometry) continue;
    const bb = geomBbox(f.geometry);
    if (!bb) continue;
    items.push({
      minX: bb[0],
      minY: bb[1],
      maxX: bb[2],
      maxY: bb[3],
      featureIndex: i,
    });
  }

  tree.load(items);
  return { tree, features, totalCount: features.length };
}

/* ------------------------------------------------------------------ */
/*  Extent query                                                        */
/* ------------------------------------------------------------------ */

/**
 * Query an rbush index by viewport extent and return only intersecting features.
 * Reports truthful inViewCount / totalCount — never conflates them.
 */
export function queryExtent(
  index: ExtentIndex,
  extent: ViewportExtent,
): ExtentQueryResult {
  const { west, south, east, north } = extent;
  const hits = index.tree.search({ minX: west, minY: south, maxX: east, maxY: north });

  const features = hits.map((item) => index.features[item.featureIndex]);

  return {
    features,
    inViewCount: features.length,
    totalCount: index.totalCount,
    isStreaming: false,
    queryMode: "rbush-index",
  };
}

/* ------------------------------------------------------------------ */
/*  Viewport extent helpers                                             */
/* ------------------------------------------------------------------ */

/** Convert a MapLibre-style bounds array [west,south,east,north] to ViewportExtent. */
export function boundsToExtent(bounds: [number, number, number, number]): ViewportExtent {
  return { west: bounds[0], south: bounds[1], east: bounds[2], north: bounds[3] };
}

/** Check whether two extents are meaningfully different (>0.0001° threshold). */
export function extentChanged(a: ViewportExtent, b: ViewportExtent): boolean {
  const EPS = 0.0001;
  return (
    Math.abs(a.west - b.west) > EPS ||
    Math.abs(a.south - b.south) > EPS ||
    Math.abs(a.east - b.east) > EPS ||
    Math.abs(a.north - b.north) > EPS
  );
}
