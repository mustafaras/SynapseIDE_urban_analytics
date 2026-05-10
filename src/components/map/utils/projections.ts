import proj4 from 'proj4';

/* ------------------------------------------------------------------ */
/*  Pre-register common CRS definitions                                */
/* ------------------------------------------------------------------ */

// EPSG:4326 and EPSG:3857 are built-in with proj4.
// Register all 60 UTM zones (north + south).
for (let zone = 1; zone <= 60; zone++) {
  const northCode = `EPSG:${32600 + zone}`;
  const southCode = `EPSG:${32700 + zone}`;
  proj4.defs(northCode, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`);
  proj4.defs(southCode, `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Transform a single [x, y] coordinate pair between CRS.
 * @param coords [x, y] in source CRS
 * @param fromCRS e.g. 'EPSG:4326'
 * @param toCRS   e.g. 'EPSG:32635'
 */
export function transformCoords(
  coords: [number, number],
  fromCRS: string,
  toCRS: string,
): [number, number] {
  return proj4(fromCRS, toCRS, coords) as [number, number];
}

/**
 * Transform all coordinates in a GeoJSON FeatureCollection from one CRS to another.
 * Returns a new object; the original is not mutated.
 */
export function transformGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  fromCRS: string,
  toCRS: string,
): GeoJSON.FeatureCollection {
  if (fromCRS === toCRS) return geojson;

  const transformer = proj4(fromCRS, toCRS);

  function transformPosition(pos: GeoJSON.Position): GeoJSON.Position {
    const [x, y] = transformer.forward([pos[0], pos[1]]);
    return pos.length > 2 ? [x, y, pos[2]] : [x, y];
  }

  function transformRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
    return ring.map(transformPosition);
  }

  function transformGeometry(geom: GeoJSON.Geometry): GeoJSON.Geometry {
    switch (geom.type) {
      case 'Point':
        return { ...geom, coordinates: transformPosition(geom.coordinates) };
      case 'MultiPoint':
      case 'LineString':
        return { ...geom, coordinates: geom.coordinates.map(transformPosition) };
      case 'MultiLineString':
      case 'Polygon':
        return { ...geom, coordinates: geom.coordinates.map(transformRing) };
      case 'MultiPolygon':
        return {
          ...geom,
          coordinates: geom.coordinates.map((poly) => poly.map(transformRing)),
        };
      case 'GeometryCollection':
        return {
          ...geom,
          geometries: geom.geometries.map(transformGeometry),
        };
      default:
        return geom;
    }
  }

  return {
    ...geojson,
    features: geojson.features.map((f) => ({
      ...f,
      geometry: transformGeometry(f.geometry),
    })),
  };
}

/**
 * Determine the best UTM zone EPSG code for a given WGS 84 longitude/latitude.
 */
export function utmZoneForLonLat(lon: number, lat: number): string {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const base = lat >= 0 ? 32600 : 32700;
  return `EPSG:${base + zone}`;
}
