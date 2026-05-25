/* ================================================================== */
/*  geosGeometryBackend                                                */
/*                                                                    */
/*  Real geos-wasm backend for the geometry workflow engine. Operates */
/*  on GeoJSON geometries already in a projected execution CRS         */
/*  (planar metres) — the engine reprojects display(4326) → execution */
/*  once before the op and back after, so geos does rigorous planar    */
/*  topology/buffer math while the rest of the app stays in lng/lat.   */
/*                                                                    */
/*  Initialisation is lazy + memoised and never throws to the caller: */
/*  if the wasm cannot load (or `WebAssembly` is unavailable) the      */
/*  engine falls back to the turf backend. Every geos pointer created  */
/*  here is destroyed to avoid wasm heap leaks.                        */
/* ================================================================== */

import type { Geometry } from "geojson";
import initGeosJs from "geos-wasm";
import { geojsonToGeosGeom, geosGeomToGeojson } from "geos-wasm/helpers";
import { project } from "../crs/MapProjectionService";
import type { GeometryOps } from "./GeometryWorkflowEngine";

// geos-wasm has no shipped types; model only the members we call.
interface GeosModule {
  GEOSBuffer(geom: number, width: number, quadsegs: number): number;
  GEOSIntersection(a: number, b: number): number;
  GEOSDifference(a: number, b: number): number;
  GEOSUnion(a: number, b: number): number;
  GEOSUnaryUnion(geom: number): number;
  GEOSisEmpty(geom: number): number;
  GEOSGeom_destroy(geom: number): void;
}

let geosInitPromise: Promise<GeosModule | null> | null = null;

/** Lazily initialise geos-wasm once; resolves null if the runtime can't load it. */
export async function getGeosModule(): Promise<GeosModule | null> {
  if (geosInitPromise) return geosInitPromise;
  geosInitPromise = (async () => {
    if (typeof WebAssembly === "undefined") return null;
    try {
      const geos = (await initGeosJs()) as unknown as GeosModule;
      return geos ?? null;
    } catch {
      return null;
    }
  })();
  return geosInitPromise;
}

/** True when the geos-wasm backend initialises in this runtime. */
export async function isGeosBackendAvailable(): Promise<boolean> {
  return (await getGeosModule()) !== null;
}

/** Test hook: drop the memoised init so a fresh resolution can be exercised. */
export function __resetGeosBackendForTests(): void {
  geosInitPromise = null;
}

/* ------------------------------------------------------------------ */
/*  Coordinate reprojection (display CRS <-> execution CRS)            */
/* ------------------------------------------------------------------ */

type Position = number[];

function projectPosition(position: Position, from: string, to: string): Position {
  const [x, y] = project([position[0] ?? 0, position[1] ?? 0], from, to);
  return position.length > 2 ? [x, y, ...position.slice(2)] : [x, y];
}

function projectRing(ring: Position[], from: string, to: string): Position[] {
  return ring.map((position) => projectPosition(position, from, to));
}

/** Reproject a GeoJSON geometry's coordinates from one CRS to another (properties untouched). */
export function reprojectGeometry(geometry: Geometry, from: string, to: string): Geometry {
  if (from === to) return geometry;
  switch (geometry.type) {
    case "Point":
      return { type: "Point", coordinates: projectPosition(geometry.coordinates, from, to) };
    case "MultiPoint":
      return { type: "MultiPoint", coordinates: projectRing(geometry.coordinates, from, to) };
    case "LineString":
      return { type: "LineString", coordinates: projectRing(geometry.coordinates, from, to) };
    case "MultiLineString":
      return { type: "MultiLineString", coordinates: geometry.coordinates.map((line) => projectRing(line, from, to)) };
    case "Polygon":
      return { type: "Polygon", coordinates: geometry.coordinates.map((ring) => projectRing(ring, from, to)) };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => projectRing(ring, from, to))),
      };
    case "GeometryCollection":
      return {
        type: "GeometryCollection",
        geometries: geometry.geometries.map((entry) => reprojectGeometry(entry, from, to)),
      };
    default:
      return geometry;
  }
}

/* ------------------------------------------------------------------ */
/*  geos GeometryOps — operate in the execution CRS (no reprojection)  */
/* ------------------------------------------------------------------ */

/**
 * Build GeometryOps backed by geos-wasm. The geometries handed to these ops
 * are expected to already be in a projected (metre-based) CRS, so `buffer`
 * widths are in metres and overlay topology is rigorous.
 */
export function createGeosGeometryOps(geos: GeosModule): GeometryOps {
  const toGeos = (geometry: Geometry): number => geojsonToGeosGeom(geometry as never, geos as never) as unknown as number;

  const fromGeos = (ptr: number): Geometry | null => {
    if (!ptr) return null;
    if (geos.GEOSisEmpty(ptr)) return null;
    const geojson = geosGeomToGeojson(ptr as never, geos as never) as unknown as Geometry | null;
    if (!geojson) return null;
    // Empty collections/polygons come back with no coordinates — treat as null.
    if ("coordinates" in geojson && Array.isArray(geojson.coordinates) && geojson.coordinates.length === 0) {
      return null;
    }
    return geojson;
  };

  const binary = (
    a: Geometry,
    b: Geometry,
    run: (pa: number, pb: number) => number,
  ): Geometry | null => {
    const pa = toGeos(a);
    const pb = toGeos(b);
    let out = 0;
    try {
      out = run(pa, pb);
      return fromGeos(out);
    } catch {
      return null;
    } finally {
      geos.GEOSGeom_destroy(pa);
      geos.GEOSGeom_destroy(pb);
      if (out) geos.GEOSGeom_destroy(out);
    }
  };

  return {
    name: "geos-wasm",
    buffer(geometry, meters, segments) {
      const ptr = toGeos(geometry);
      let out = 0;
      try {
        out = geos.GEOSBuffer(ptr, meters, Math.max(1, Math.round(segments)));
        return fromGeos(out);
      } catch {
        return null;
      } finally {
        geos.GEOSGeom_destroy(ptr);
        if (out) geos.GEOSGeom_destroy(out);
      }
    },
    intersection(a, b) {
      return binary(a, b, (pa, pb) => geos.GEOSIntersection(pa, pb));
    },
    difference(a, b) {
      return binary(a, b, (pa, pb) => geos.GEOSDifference(pa, pb));
    },
    union(a, b) {
      return binary(a, b, (pa, pb) => geos.GEOSUnion(pa, pb));
    },
    unaryUnion(geometries) {
      if (geometries.length === 0) return null;
      const collection: Geometry = { type: "GeometryCollection", geometries: [...geometries] };
      const ptr = toGeos(collection);
      let out = 0;
      try {
        out = geos.GEOSUnaryUnion(ptr);
        return fromGeos(out);
      } catch {
        return null;
      } finally {
        geos.GEOSGeom_destroy(ptr);
        if (out) geos.GEOSGeom_destroy(out);
      }
    },
  };
}
