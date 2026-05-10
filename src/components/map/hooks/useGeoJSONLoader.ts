import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GeoJSONLoaderResult {
  data: GeoJSON.FeatureCollection | null;
  isLoading: boolean;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  In-memory cache                                                    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, GeoJSON.FeatureCollection>();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Best-effort CSV → GeoJSON conversion when lat/lon columns are present */
function csvToGeoJSON(csv: string): GeoJSON.FeatureCollection {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { type: 'FeatureCollection', features: [] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const latIdx = headers.findIndex((h) =>
    ['lat', 'latitude', 'y'].includes(h),
  );
  const lonIdx = headers.findIndex((h) =>
    ['lon', 'lng', 'longitude', 'x', 'long'].includes(h),
  );

  if (latIdx === -1 || lonIdx === -1) {
    throw new Error('CSV does not contain recognisable lat/lon columns');
  }

  const features: GeoJSON.Feature[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const props: Record<string, string> = {};
    headers.forEach((h, j) => {
      if (j !== latIdx && j !== lonIdx) props[h] = cols[j];
    });
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: props,
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Minimal KML → GeoJSON (placemarks with Point/LineString/Polygon) */
function kmlToGeoJSON(kml: string): GeoJSON.FeatureCollection {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kml, 'application/xml');
  const placemarks = doc.getElementsByTagName('Placemark');
  const features: GeoJSON.Feature[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const name = pm.getElementsByTagName('name')[0]?.textContent ?? '';

    const pointEl = pm.getElementsByTagName('coordinates')[0];
    if (!pointEl?.textContent) continue;

    const coordStr = pointEl.textContent.trim();
    const coordParts = coordStr.split(/\s+/).map((c) => {
      const [lng, lat] = c.split(',').map(Number);
      return [lng, lat] as [number, number];
    });

    let geometry: GeoJSON.Geometry;
    if (coordParts.length === 1) {
      geometry = { type: 'Point', coordinates: coordParts[0] };
    } else if (pm.getElementsByTagName('Polygon').length > 0) {
      geometry = { type: 'Polygon', coordinates: [coordParts] };
    } else {
      geometry = { type: 'LineString', coordinates: coordParts };
    }

    features.push({
      type: 'Feature',
      geometry,
      properties: { name },
    });
  }
  return { type: 'FeatureCollection', features };
}

function detectFormat(nameOrUrl: string): 'geojson' | 'csv' | 'kml' {
  const lower = nameOrUrl.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.kml')) return 'kml';
  return 'geojson';
}

function parseText(raw: string, format: 'geojson' | 'csv' | 'kml'): GeoJSON.FeatureCollection {
  switch (format) {
    case 'csv':
      return csvToGeoJSON(raw);
    case 'kml':
      return kmlToGeoJSON(raw);
    default: {
      const parsed = JSON.parse(raw);
      if (parsed.type === 'FeatureCollection') return parsed;
      if (parsed.type === 'Feature')
        return { type: 'FeatureCollection', features: [parsed] };
      // Bare geometry
      return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: parsed, properties: {} }],
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Loads GeoJSON data from a URL string or a File object.
 * Supports .geojson, .json, .csv (with lat/lon), .kml.
 * Caches URL results in memory.
 */
export function useGeoJSONLoader(
  source: string | File | null,
): GeoJSONLoaderResult {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (src: string | File) => {
    setIsLoading(true);
    setError(null);

    try {
      let raw: string;
      let cacheKey: string;
      let format: 'geojson' | 'csv' | 'kml';

      if (typeof src === 'string') {
        cacheKey = src;
        if (cache.has(cacheKey)) {
          setData(cache.get(cacheKey)!);
          setIsLoading(false);
          return;
        }
        format = detectFormat(src);
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const res = await fetch(src, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.text();
      } else {
        cacheKey = `file://${src.name}`;
        format = detectFormat(src.name);
        if (cache.has(cacheKey)) {
          setData(cache.get(cacheKey)!);
          setIsLoading(false);
          return;
        }
        raw = await src.text();
      }

      const fc = parseText(raw, format);
      cache.set(cacheKey, fc);
      setData(fc);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Failed to load GeoJSON');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!source) {
      setData(null);
      setError(null);
      return;
    }
    load(source);
    return () => abortRef.current?.abort();
  }, [source, load]);

  return { data, isLoading, error };
}
