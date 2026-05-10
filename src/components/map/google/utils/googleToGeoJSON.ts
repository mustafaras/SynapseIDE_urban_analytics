/**
 * Bidirectional converters between Google Maps geometry objects and GeoJSON.
 *
 * All functions accept the **`google.maps.*`** runtime types and return
 * standard GeoJSON (RFC 7946) — no external dependencies required.
 */
import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  Point,
  Polygon,
  Position,
} from 'geojson';

/* ================================================================== */
/*  Google → GeoJSON                                                   */
/* ================================================================== */

/** Convert a `google.maps.LatLng` (or literal) to a GeoJSON Position [lon, lat]. */
export function latLngToPosition(
  ll: google.maps.LatLng | google.maps.LatLngLiteral,
): Position {
  const lat = typeof (ll as google.maps.LatLng).lat === 'function'
    ? (ll as google.maps.LatLng).lat()
    : (ll as google.maps.LatLngLiteral).lat;
  const lng = typeof (ll as google.maps.LatLng).lng === 'function'
    ? (ll as google.maps.LatLng).lng()
    : (ll as google.maps.LatLngLiteral).lng;
  return [lng, lat];
}

/** Convert `google.maps.LatLng` to a GeoJSON Point. */
export function latLngToPoint(
  ll: google.maps.LatLng | google.maps.LatLngLiteral,
): Point {
  return { type: 'Point', coordinates: latLngToPosition(ll) };
}

/** Convert a Google Maps `Polyline` path to a GeoJSON LineString. */
export function polylineToLineString(
  path: google.maps.LatLng[] | google.maps.LatLngLiteral[],
): LineString {
  return {
    type: 'LineString',
    coordinates: path.map(latLngToPosition),
  };
}

/** Convert a Google Maps `Polygon` to a GeoJSON Polygon. */
export function polygonToGeoJSON(
  polygon: google.maps.Polygon,
): Polygon {
  const paths = polygon.getPaths();
  const rings: Position[][] = [];
  paths.forEach((path) => {
    const ring = path.getArray().map(latLngToPosition);
    // GeoJSON rings must be closed
    if (
      ring.length > 0 &&
      (ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1])
    ) {
      ring.push([...ring[0]]);
    }
    rings.push(ring);
  });
  return { type: 'Polygon', coordinates: rings };
}

/** Convert a `google.maps.LatLngBounds` to a GeoJSON Polygon (rectangle). */
export function boundsToPolygon(
  bounds: google.maps.LatLngBounds,
): Polygon {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const neLng = ne.lng();
  const neLat = ne.lat();
  const swLng = sw.lng();
  const swLat = sw.lat();
  return {
    type: 'Polygon',
    coordinates: [
      [
        [swLng, swLat],
        [neLng, swLat],
        [neLng, neLat],
        [swLng, neLat],
        [swLng, swLat],
      ],
    ],
  };
}

/** Convert a `DirectionsResult` route to a GeoJSON Feature (LineString). */
export function directionsRouteToFeature(
  route: google.maps.DirectionsRoute,
  index = 0,
): Feature<LineString> {
  const coords: Position[] = [];
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      for (const ll of step.path) {
        coords.push(latLngToPosition(ll));
      }
    }
  }
  return {
    type: 'Feature',
    properties: {
      routeIndex: index,
      summary: route.summary,
      distance: route.legs.reduce(
        (sum, l) => sum + (l.distance?.value ?? 0),
        0,
      ),
      duration: route.legs.reduce(
        (sum, l) => sum + (l.duration?.value ?? 0),
        0,
      ),
    },
    geometry: { type: 'LineString', coordinates: coords },
  };
}

/** Convert an entire `DirectionsResult` to a FeatureCollection. */
export function directionsToFeatureCollection(
  result: google.maps.DirectionsResult,
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: result.routes.map((r, i) => directionsRouteToFeature(r, i)),
  };
}

/* ================================================================== */
/*  GeoJSON → Google                                                   */
/* ================================================================== */

/** Convert a GeoJSON Position to a `google.maps.LatLngLiteral`. */
export function positionToLatLngLiteral(
  pos: Position,
): google.maps.LatLngLiteral {
  return { lat: pos[1], lng: pos[0] };
}

/** Convert a GeoJSON Point to a `google.maps.LatLngLiteral`. */
export function pointToLatLng(pt: Point): google.maps.LatLngLiteral {
  return positionToLatLngLiteral(pt.coordinates);
}

/** Convert a GeoJSON Polygon to an array of `google.maps.LatLngLiteral[]` paths. */
export function geoJSONPolygonToPaths(
  polygon: Polygon,
): google.maps.LatLngLiteral[][] {
  return polygon.coordinates.map((ring) => ring.map(positionToLatLngLiteral));
}

/** Convert a generic GeoJSON Geometry to `google.maps.LatLngLiteral` arrays. */
export function geometryToLatLngs(
  geo: Geometry,
): google.maps.LatLngLiteral[] {
  switch (geo.type) {
    case 'Point':
      return [positionToLatLngLiteral(geo.coordinates)];
    case 'LineString':
    case 'MultiPoint':
      return geo.coordinates.map(positionToLatLngLiteral);
    case 'Polygon':
      return geo.coordinates.flat().map(positionToLatLngLiteral);
    case 'MultiLineString':
      return geo.coordinates.flat().map(positionToLatLngLiteral);
    case 'MultiPolygon':
      return geo.coordinates.flat(2).map(positionToLatLngLiteral);
    case 'GeometryCollection':
      return geo.geometries.flatMap(geometryToLatLngs);
    default:
      return [];
  }
}
