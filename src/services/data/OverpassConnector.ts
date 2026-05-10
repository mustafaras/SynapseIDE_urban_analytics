/**
 * OverpassConnector — Query OpenStreetMap via the Overpass API.
 *
 * Rate-limited to max 2 requests per 10 seconds per Overpass fair-use policy.
 */

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BBox = [south: number, west: number, north: number, east: number];

export type OSMTag = { key: string; value?: string };

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
  members?: { type: string; ref: number; role: string; geometry?: { lat: number; lon: number }[] }[];
};

/* ------------------------------------------------------------------ */
/*  Rate limiter                                                       */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 10_000;
const MAX_IN_WINDOW = 2;
const requestTimes: number[] = [];

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  // Purge old entries
  while (requestTimes.length > 0 && requestTimes[0] < now - WINDOW_MS) {
    requestTimes.shift();
  }
  if (requestTimes.length >= MAX_IN_WINDOW) {
    const wait = requestTimes[0] + WINDOW_MS - now + 50;
    await new Promise<void>(r => setTimeout(r, wait));
    return waitForSlot();
  }
  requestTimes.push(Date.now());
}

/* ------------------------------------------------------------------ */
/*  Overpass QL builder                                                */
/* ------------------------------------------------------------------ */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export function buildQuery(bbox: BBox, tags: OSMTag[], elementTypes: ('node' | 'way' | 'relation')[] = ['way', 'relation']): string {
  const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  const tagFilters = tags.map(t => (t.value ? `["${t.key}"="${t.value}"]` : `["${t.key}"]`)).join('');
  const statements = elementTypes.map(et => `${et}${tagFilters}(${bboxStr});`).join('\n  ');
  return `[out:json][timeout:30];\n(\n  ${statements}\n);\nout body geom;`;
}

/* ------------------------------------------------------------------ */
/*  Raw fetch                                                          */
/* ------------------------------------------------------------------ */

async function runQuery(ql: string): Promise<OverpassElement[]> {
  await waitForSlot();
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(ql)}`,
  });
  if (!res.ok) throw new Error(`Overpass API error ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as { elements: OverpassElement[] };
  return json.elements ?? [];
}

/* ------------------------------------------------------------------ */
/*  Element → GeoJSON converters                                       */
/* ------------------------------------------------------------------ */

function wayToGeometry(el: OverpassElement): Geometry | null {
  const coords = el.geometry?.map(g => [g.lon, g.lat]);
  if (!coords || coords.length < 2) return null;
  const closed = coords.length >= 4 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];
  return closed ? { type: 'Polygon', coordinates: [coords] } : { type: 'LineString', coordinates: coords };
}

function relationToGeometry(el: OverpassElement): Geometry | null {
  const outers = (el.members ?? []).filter(m => m.role === 'outer' && m.geometry);
  if (outers.length === 0) return null;
  const rings = outers.map(m => m.geometry!.map(g => [g.lon, g.lat]));
  if (rings.length === 1) return { type: 'Polygon', coordinates: rings };
  return { type: 'MultiPolygon', coordinates: rings.map(r => [r]) };
}

function elementToFeature(el: OverpassElement): Feature<Geometry, GeoJsonProperties> | null {
  let geom: Geometry | null = null;
  if (el.type === 'node') {
    geom = el.lat != null && el.lon != null ? { type: 'Point', coordinates: [el.lon, el.lat] } : null;
  } else if (el.type === 'way') {
    geom = wayToGeometry(el);
  } else if (el.type === 'relation') {
    geom = relationToGeometry(el);
  }
  if (!geom) return null;
  return { type: 'Feature', geometry: geom, properties: el.tags ?? {}, id: el.id };
}

function toFeatureCollection(elements: OverpassElement[]): FeatureCollection {
  const features = elements.map(elementToFeature).filter((f): f is Feature => f !== null);
  return { type: 'FeatureCollection', features };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Fetch building footprints within bounding box. */
export async function fetchBuildings(bbox: BBox): Promise<FeatureCollection> {
  const ql = buildQuery(bbox, [{ key: 'building' }], ['way', 'relation']);
  const elements = await runQuery(ql);
  return toFeatureCollection(elements);
}

/** Fetch road network within bounding box. */
export async function fetchRoads(bbox: BBox): Promise<FeatureCollection> {
  const ql = buildQuery(bbox, [{ key: 'highway' }], ['way']);
  const elements = await runQuery(ql);
  return toFeatureCollection(elements);
}

/** Fetch Points of Interest by OSM tag values (e.g. amenity=restaurant). */
export async function fetchPOIs(bbox: BBox, types: OSMTag[]): Promise<FeatureCollection> {
  const ql = buildQuery(bbox, types, ['node', 'way']);
  const elements = await runQuery(ql);
  return toFeatureCollection(elements);
}

/** Fetch land-use polygons within bounding box. */
export async function fetchLandUse(bbox: BBox): Promise<FeatureCollection> {
  const ql = buildQuery(bbox, [{ key: 'landuse' }], ['way', 'relation']);
  const elements = await runQuery(ql);
  return toFeatureCollection(elements);
}

/** Run an arbitrary Overpass QL query and return GeoJSON. */
export async function fetchCustom(ql: string): Promise<FeatureCollection> {
  const elements = await runQuery(ql);
  return toFeatureCollection(elements);
}
