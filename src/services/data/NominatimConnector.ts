/**
 * NominatimConnector — Forward/reverse geocoding via OpenStreetMap Nominatim.
 *
 * Strictly rate-limited to 1 request per second per Nominatim usage policy.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import type { Feature, FeatureCollection, Point } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NominatimResult {
  placeId: number;
  licence: string;
  osmType: string;
  osmId: number;
  lat: number;
  lon: number;
  displayName: string;
  type: string;
  importance: number;
  boundingbox: [south: string, north: string, west: string, east: string];
  address?: NominatimAddress;
}

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface StructuredSearchParams {
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postalcode?: string;
}

/* ------------------------------------------------------------------ */
/*  Rate limiter (1 req/sec)                                           */
/* ------------------------------------------------------------------ */

let lastRequestTime = 0;

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise<void>(r => setTimeout(r, 1000 - elapsed + 20));
  }
  lastRequestTime = Date.now();
}

/* ------------------------------------------------------------------ */
/*  Base fetch                                                         */
/* ------------------------------------------------------------------ */

const BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'UrbanAnalyticsWorkbench/1.0';

async function nominatimFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  await waitForSlot();
  const qs = new URLSearchParams({ ...params, format: 'jsonv2' }).toString();
  const url = `${BASE_URL}${path}?${qs}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}: ${res.statusText}`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/*  Raw response mapping                                               */
/* ------------------------------------------------------------------ */

interface RawResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  boundingbox: [string, string, string, string];
  address?: NominatimAddress;
}

function mapResult(raw: RawResult): NominatimResult {
  return {
    placeId: raw.place_id,
    licence: raw.licence,
    osmType: raw.osm_type,
    osmId: raw.osm_id,
    lat: parseFloat(raw.lat),
    lon: parseFloat(raw.lon),
    displayName: raw.display_name,
    type: raw.type,
    importance: raw.importance,
    boundingbox: raw.boundingbox,
    ...(raw.address ? { address: raw.address } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  Forward geocoding                                                  */
/* ------------------------------------------------------------------ */

/** Geocode a free-form address string → ranked coordinate results. */
export async function geocode(query: string, limit = 5): Promise<NominatimResult[]> {
  const raw = await nominatimFetch<RawResult[]>('/search', {
    q: query,
    limit: String(limit),
    addressdetails: '1',
  });
  return raw.map(mapResult);
}

/* ------------------------------------------------------------------ */
/*  Reverse geocoding                                                  */
/* ------------------------------------------------------------------ */

/** Reverse geocode coordinates → address. */
export async function reverseGeocode(lat: number, lon: number, zoom = 18): Promise<NominatimResult | null> {
  const raw = await nominatimFetch<RawResult>('/reverse', {
    lat: String(lat),
    lon: String(lon),
    zoom: String(zoom),
    addressdetails: '1',
  });
  if (!raw.place_id) return null;
  return mapResult(raw);
}

/* ------------------------------------------------------------------ */
/*  Structured search                                                  */
/* ------------------------------------------------------------------ */

/** Search with structured address components. */
export async function structuredSearch(params: StructuredSearchParams, limit = 5): Promise<NominatimResult[]> {
  const searchParams: Record<string, string> = { limit: String(limit), addressdetails: '1' };
  if (params.street) searchParams['street'] = params.street;
  if (params.city) searchParams['city'] = params.city;
  if (params.county) searchParams['county'] = params.county;
  if (params.state) searchParams['state'] = params.state;
  if (params.country) searchParams['country'] = params.country;
  if (params.postalcode) searchParams['postalcode'] = params.postalcode;

  const raw = await nominatimFetch<RawResult[]>('/search', searchParams);
  return raw.map(mapResult);
}

/* ------------------------------------------------------------------ */
/*  Convenience: results → GeoJSON                                     */
/* ------------------------------------------------------------------ */

export function resultsToGeoJSON(results: NominatimResult[]): FeatureCollection {
  const features: Feature<Point>[] = results.map(r => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
    properties: {
      placeId: r.placeId,
      displayName: r.displayName,
      type: r.type,
      importance: r.importance,
      ...(r.address ?? {}),
    },
    id: r.placeId,
  }));
  return { type: 'FeatureCollection', features };
}
