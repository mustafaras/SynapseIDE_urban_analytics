/**
 * GoogleMapsConnector — Interact with Google Maps Platform APIs.
 *
 * Uses API key from the settings store. All responses are cached in IndexedDB
 * with configurable TTL. Quota tracking counts API calls per billing period.
 */

import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LatLng = { lat: number; lng: number };
export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export interface PlaceResult {
  placeId: string;
  name: string;
  location: LatLng;
  types: string[];
  rating?: number;
  address?: string;
}

export interface TravelTimeEntry {
  origin: LatLng;
  destination: LatLng;
  durationSec: number;
  distanceM: number;
  mode: TravelMode;
}

export interface ElevationSample {
  location: LatLng;
  elevation: number;
  resolution: number;
}

export interface GeocodingResult {
  address: string;
  location: LatLng;
  placeId: string;
  formattedAddress: string;
}

export interface StreetViewCoverage {
  location: LatLng;
  available: boolean;
  panoId?: string;
}

export interface QuotaInfo {
  totalCalls: number;
  periodStart: number;
  budgetLimit: number;
}

/* ------------------------------------------------------------------ */
/*  IndexedDB cache                                                    */
/* ------------------------------------------------------------------ */

const DB_NAME = 'google_maps_cache';
const STORE_NAME = 'responses';
const DB_VERSION = 1;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  key: string;
  data: unknown;
  expiresAt: number;
}

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (entry && entry.expiresAt > Date.now()) {
          resolve(entry.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cacheSet(key: string, data: unknown, ttl = DEFAULT_TTL_MS): Promise<void> {
  try {
    const db = await openCacheDB();
    const entry: CacheEntry = { key, data, expiresAt: Date.now() + ttl };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
  } catch {
    // Silently ignore cache write failures
  }
}

/* ------------------------------------------------------------------ */
/*  Quota tracker                                                      */
/* ------------------------------------------------------------------ */

const QUOTA_KEY = 'google_maps_quota';
const MONTHLY_BUDGET = 200; // default cap (USD-equivalent call units)

function loadQuota(): QuotaInfo {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (raw) {
      const q = JSON.parse(raw) as QuotaInfo;
      const now = Date.now();
      const monthMs = 30 * 24 * 60 * 60 * 1000;
      if (now - q.periodStart > monthMs) {
        return { totalCalls: 0, periodStart: now, budgetLimit: q.budgetLimit };
      }
      return q;
    }
  } catch { /* ignore */ }
  return { totalCalls: 0, periodStart: Date.now(), budgetLimit: MONTHLY_BUDGET };
}

function trackCall(): QuotaInfo {
  const q = loadQuota();
  q.totalCalls += 1;
  localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
  if (q.totalCalls >= q.budgetLimit * 0.8) {
    console.warn(`[GoogleMapsConnector] Approaching quota limit: ${q.totalCalls}/${q.budgetLimit}`);
  }
  return q;
}

export function getQuota(): QuotaInfo {
  return loadQuota();
}

/* ------------------------------------------------------------------ */
/*  API key                                                            */
/* ------------------------------------------------------------------ */

let _apiKey: string | null = null;

/** Set the Google Maps API key at runtime. */
export function setApiKey(key: string): void {
  _apiKey = key;
}

function requireKey(): string {
  if (!_apiKey) throw new Error('Google Maps API key not configured. Call setApiKey() first.');
  return _apiKey;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function gmapsFetch<T>(url: string, cacheKey: string): Promise<T> {
  const cached = await cacheGet<T>(cacheKey);
  if (cached) return cached;
  trackCall();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Maps API error ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as T;
  await cacheSet(cacheKey, json);
  return json;
}

/* ------------------------------------------------------------------ */
/*  Places nearby search                                               */
/* ------------------------------------------------------------------ */

interface NearbyResponse {
  results: {
    place_id: string; name: string; geometry: { location: { lat: number; lng: number } };
    types: string[]; rating?: number; vicinity?: string;
  }[];
}

export async function searchNearby(center: LatLng, radius: number, type: string): Promise<PlaceResult[]> {
  const key = requireKey();
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&type=${encodeURIComponent(type)}&key=${key}`;
  const cacheK = `nearby:${center.lat},${center.lng}:${radius}:${type}`;
  const data = await gmapsFetch<NearbyResponse>(url, cacheK);
  return data.results.map((r) => ({
    placeId: r.place_id,
    name: r.name,
    location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
    types: r.types,
    ...(typeof r.rating === 'number' ? { rating: r.rating } : {}),
    ...(r.vicinity ? { address: r.vicinity } : {}),
  }));
}

/* ------------------------------------------------------------------ */
/*  POI dataset builder                                                */
/* ------------------------------------------------------------------ */

/**
 * Build a POI FeatureCollection by gridding a study area polygon and
 * performing nearby searches at each grid point.
 */
export async function buildPOIDataset(
  studyArea: Polygon,
  type: string,
  gridSpacingDeg = 0.005,
): Promise<FeatureCollection> {
  const coords = studyArea.coordinates[0];
  const lats = coords.map(c => c[1]);
  const lngs = coords.map(c => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const seen = new Set<string>();
  const features: Feature<Point>[] = [];

  for (let lat = minLat; lat <= maxLat; lat += gridSpacingDeg) {
    for (let lng = minLng; lng <= maxLng; lng += gridSpacingDeg) {
      const results = await searchNearby({ lat, lng }, 500, type);
      for (const r of results) {
        if (seen.has(r.placeId)) continue;
        seen.add(r.placeId);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.location.lng, r.location.lat] },
          properties: { name: r.name, placeId: r.placeId, types: r.types, rating: r.rating, address: r.address },
        });
      }
    }
  }

  return { type: 'FeatureCollection', features };
}

/* ------------------------------------------------------------------ */
/*  Travel time matrix                                                 */
/* ------------------------------------------------------------------ */

interface DistanceMatrixResponse {
  rows: { elements: { status: string; duration: { value: number }; distance: { value: number } }[] }[];
}

export async function travelTimeMatrix(
  origins: LatLng[],
  destinations: LatLng[],
  mode: TravelMode = 'driving',
): Promise<TravelTimeEntry[]> {
  const key = requireKey();
  const oStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
  const dStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(oStr)}&destinations=${encodeURIComponent(dStr)}&mode=${mode}&key=${key}`;
  const cacheK = `matrix:${oStr}:${dStr}:${mode}`;
  const data = await gmapsFetch<DistanceMatrixResponse>(url, cacheK);

  const entries: TravelTimeEntry[] = [];
  data.rows.forEach((row, oi) => {
    row.elements.forEach((el, di) => {
      if (el.status === 'OK') {
        entries.push({ origin: origins[oi], destination: destinations[di], durationSec: el.duration.value, distanceM: el.distance.value, mode });
      }
    });
  });
  return entries;
}

/* ------------------------------------------------------------------ */
/*  Elevation profile                                                  */
/* ------------------------------------------------------------------ */

interface ElevationResponse {
  results: { location: { lat: number; lng: number }; elevation: number; resolution: number }[];
}

export async function elevationProfile(path: LatLng[], samples = 50): Promise<ElevationSample[]> {
  const key = requireKey();
  const pathStr = path.map(p => `${p.lat},${p.lng}`).join('|');
  const url = `https://maps.googleapis.com/maps/api/elevation/json?path=${encodeURIComponent(pathStr)}&samples=${samples}&key=${key}`;
  const cacheK = `elev:${pathStr}:${samples}`;
  const data = await gmapsFetch<ElevationResponse>(url, cacheK);
  return data.results.map(r => ({ location: { lat: r.location.lat, lng: r.location.lng }, elevation: r.elevation, resolution: r.resolution }));
}

/* ------------------------------------------------------------------ */
/*  Batch geocoding                                                    */
/* ------------------------------------------------------------------ */

interface GeocodeResponse {
  results: { place_id: string; formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
}

export async function batchGeocode(addresses: string[]): Promise<GeocodingResult[]> {
  const key = requireKey();
  const results: GeocodingResult[] = [];
  for (const addr of addresses) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${key}`;
    const cacheK = `geocode:${addr}`;
    const data = await gmapsFetch<GeocodeResponse>(url, cacheK);
    const top = data.results[0];
    if (top) {
      results.push({
        address: addr,
        location: { lat: top.geometry.location.lat, lng: top.geometry.location.lng },
        placeId: top.place_id,
        formattedAddress: top.formatted_address,
      });
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/*  Street View coverage                                               */
/* ------------------------------------------------------------------ */

interface StreetViewMetaResponse {
  status: string;
  pano_id?: string;
  location?: { lat: number; lng: number };
}

export async function checkStreetViewCoverage(location: LatLng): Promise<StreetViewCoverage> {
  const key = requireKey();
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&key=${key}`;
  const cacheK = `sv:${location.lat},${location.lng}`;
  const data = await gmapsFetch<StreetViewMetaResponse>(url, cacheK);
  return {
    location,
    available: data.status === 'OK',
    ...(data.pano_id ? { panoId: data.pano_id } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  Convenience: places → GeoJSON                                      */
/* ------------------------------------------------------------------ */

export function placesToGeoJSON(places: PlaceResult[]): FeatureCollection {
  const features: Feature<Point>[] = places.map(p => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.location.lng, p.location.lat] },
    properties: { name: p.name, placeId: p.placeId, types: p.types, rating: p.rating, address: p.address },
  }));
  return { type: 'FeatureCollection', features };
}
