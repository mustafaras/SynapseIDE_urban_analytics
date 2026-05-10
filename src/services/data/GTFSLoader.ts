/**
 * GTFSLoader — Parse General Transit Feed Specification zip files.
 *
 * Extracts stops, routes, trips, stop_times, and shapes from a GTFS .zip,
 * returning GeoJSON and frequency/headway analytics.
 */

import JSZip from 'jszip';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type?: number;
  parent_station?: string;
}

export interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color?: string;
}

export interface GTFSTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  shape_id?: string;
  direction_id?: number;
  trip_headsign?: string;
}

export interface GTFSStopTime {
  trip_id: string;
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
}

export interface GTFSShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
}

export interface FrequencyAnalysis {
  routeId: string;
  routeName: string;
  serviceId: string;
  direction: number;
  /** Trips per time period. */
  tripsPerHour: Map<number, number>;
  /** Average headway in minutes by hour. */
  avgHeadwayMin: Map<number, number>;
  peakHeadwayMin: number;
  offPeakHeadwayMin: number;
}

export interface GTFSDataset {
  stops: GTFSStop[];
  routes: GTFSRoute[];
  trips: GTFSTrip[];
  stopTimes: GTFSStopTime[];
  shapes: Map<string, GTFSShape[]>;
  stopsGeoJSON: FeatureCollection;
  routesGeoJSON: FeatureCollection;
  frequencies: FrequencyAnalysis[];
}

/* ------------------------------------------------------------------ */
/*  CSV parser                                                         */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h.trim()] = (vals[i] ?? '').trim();
    });
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

/** Parse HH:MM:SS (allowing hours > 23 per GTFS spec) → seconds since midnight. */
function timeToSeconds(t: string): number {
  const parts = t.split(':');
  if (parts.length < 3) return 0;
  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}

function secondsToHour(s: number): number {
  return Math.floor(s / 3600);
}

/* ------------------------------------------------------------------ */
/*  Extract & parse                                                    */
/* ------------------------------------------------------------------ */

async function readText(zip: JSZip, name: string): Promise<string | null> {
  const file = zip.file(name);
  if (!file) return null;
  return file.async('string');
}

function parseStops(csv: string): GTFSStop[] {
  return parseCSV(csv).map((r) => ({
    stop_id: r['stop_id'] ?? '',
    stop_name: r['stop_name'] ?? '',
    stop_lat: parseFloat(r['stop_lat'] ?? '0'),
    stop_lon: parseFloat(r['stop_lon'] ?? '0'),
    ...(r['location_type'] ? { location_type: parseInt(r['location_type'], 10) } : {}),
    ...(r['parent_station'] ? { parent_station: r['parent_station'] } : {}),
  }));
}

function parseRoutes(csv: string): GTFSRoute[] {
  return parseCSV(csv).map((r) => ({
    route_id: r['route_id'] ?? '',
    route_short_name: r['route_short_name'] ?? '',
    route_long_name: r['route_long_name'] ?? '',
    route_type: parseInt(r['route_type'] ?? '3', 10),
    ...(r['route_color'] ? { route_color: r['route_color'] } : {}),
  }));
}

function parseTrips(csv: string): GTFSTrip[] {
  return parseCSV(csv).map((r) => ({
    trip_id: r['trip_id'] ?? '',
    route_id: r['route_id'] ?? '',
    service_id: r['service_id'] ?? '',
    ...(r['shape_id'] ? { shape_id: r['shape_id'] } : {}),
    ...(r['direction_id'] ? { direction_id: parseInt(r['direction_id'], 10) } : {}),
    ...(r['trip_headsign'] ? { trip_headsign: r['trip_headsign'] } : {}),
  }));
}

function parseStopTimes(csv: string): GTFSStopTime[] {
  return parseCSV(csv).map(r => ({
    trip_id: r['trip_id'] ?? '',
    stop_id: r['stop_id'] ?? '',
    arrival_time: r['arrival_time'] ?? '00:00:00',
    departure_time: r['departure_time'] ?? '00:00:00',
    stop_sequence: parseInt(r['stop_sequence'] ?? '0', 10),
  }));
}

function parseShapes(csv: string): Map<string, GTFSShape[]> {
  const rows = parseCSV(csv).map(r => ({
    shape_id: r['shape_id'] ?? '',
    shape_pt_lat: parseFloat(r['shape_pt_lat'] ?? '0'),
    shape_pt_lon: parseFloat(r['shape_pt_lon'] ?? '0'),
    shape_pt_sequence: parseInt(r['shape_pt_sequence'] ?? '0', 10),
  }));
  const map = new Map<string, GTFSShape[]>();
  for (const s of rows) {
    let arr = map.get(s.shape_id);
    if (!arr) { arr = []; map.set(s.shape_id, arr); }
    arr.push(s);
  }
  // Sort by sequence
  for (const arr of map.values()) arr.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
  return map;
}

/* ------------------------------------------------------------------ */
/*  GeoJSON builders                                                   */
/* ------------------------------------------------------------------ */

function stopsToGeoJSON(stops: GTFSStop[]): FeatureCollection {
  const features: Feature<Point>[] = stops
    .filter(s => !isNaN(s.stop_lat) && !isNaN(s.stop_lon))
    .map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.stop_lon, s.stop_lat] },
      properties: { stop_id: s.stop_id, stop_name: s.stop_name, location_type: s.location_type, parent_station: s.parent_station },
      id: s.stop_id,
    }));
  return { type: 'FeatureCollection', features };
}

function routesToGeoJSON(
  routes: GTFSRoute[],
  trips: GTFSTrip[],
  shapes: Map<string, GTFSShape[]>,
): FeatureCollection {
  const routeShapes = new Map<string, string>();
  for (const t of trips) {
    if (t.shape_id && !routeShapes.has(t.route_id)) {
      routeShapes.set(t.route_id, t.shape_id);
    }
  }

  const features: Feature<LineString>[] = [];
  for (const route of routes) {
    const shapeId = routeShapes.get(route.route_id);
    if (!shapeId) continue;
    const pts = shapes.get(shapeId);
    if (!pts || pts.length < 2) continue;
    const coords = pts.map(p => [p.shape_pt_lon, p.shape_pt_lat]);

    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        route_id: route.route_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_type: route.route_type,
        route_color: route.route_color ? `#${route.route_color}` : undefined,
      },
      id: route.route_id,
    });
  }

  return { type: 'FeatureCollection', features };
}

/* ------------------------------------------------------------------ */
/*  Frequency & headway analysis                                       */
/* ------------------------------------------------------------------ */

function computeFrequencies(
  routes: GTFSRoute[],
  trips: GTFSTrip[],
  stopTimes: GTFSStopTime[],
): FrequencyAnalysis[] {
  // Group trips by route + service + direction
  type GroupKey = string;
  const tripGroups = new Map<GroupKey, GTFSTrip[]>();
  for (const t of trips) {
    const key = `${t.route_id}|${t.service_id}|${t.direction_id ?? 0}`;
    let arr = tripGroups.get(key);
    if (!arr) { arr = []; tripGroups.set(key, arr); }
    arr.push(t);
  }

  // Find first departure per trip
  const tripFirstDeparture = new Map<string, number>();
  for (const st of stopTimes) {
    if (st.stop_sequence === 1 || !tripFirstDeparture.has(st.trip_id)) {
      const secs = timeToSeconds(st.departure_time);
      const existing = tripFirstDeparture.get(st.trip_id);
      if (existing === undefined || secs < existing) {
        tripFirstDeparture.set(st.trip_id, secs);
      }
    }
  }

  const routeMap = new Map(routes.map(r => [r.route_id, r]));
  const results: FrequencyAnalysis[] = [];

  for (const [key, groupTrips] of tripGroups) {
    const [routeId, serviceId, dirStr] = key.split('|');
    const route = routeMap.get(routeId);
    if (!route) continue;

    // Collect departure seconds
    const departures = groupTrips
      .map(t => tripFirstDeparture.get(t.trip_id))
      .filter((s): s is number => s !== undefined)
      .sort((a, b) => a - b);

    if (departures.length === 0) continue;

    // Trips per hour
    const tripsPerHour = new Map<number, number>();
    for (const d of departures) {
      const h = secondsToHour(d);
      tripsPerHour.set(h, (tripsPerHour.get(h) ?? 0) + 1);
    }

    // Headways per hour
    const headwaysByHour = new Map<number, number[]>();
    for (let i = 1; i < departures.length; i++) {
      const gap = (departures[i] - departures[i - 1]) / 60;
      const h = secondsToHour(departures[i]);
      let arr = headwaysByHour.get(h);
      if (!arr) { arr = []; headwaysByHour.set(h, arr); }
      arr.push(gap);
    }

    const avgHeadwayMin = new Map<number, number>();
    for (const [h, gaps] of headwaysByHour) {
      avgHeadwayMin.set(h, gaps.reduce((a, b) => a + b, 0) / gaps.length);
    }

    // Peak (7-9, 17-19) vs off-peak
    const peakHours = [7, 8, 17, 18];
    const peakHeadways = peakHours.flatMap(h => headwaysByHour.get(h) ?? []);
    const offPeakHeadways = [...headwaysByHour.entries()]
      .filter(([h]) => !peakHours.includes(h))
      .flatMap(([, g]) => g);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : Infinity;

    results.push({
      routeId,
      routeName: route.route_short_name || route.route_long_name,
      serviceId,
      direction: parseInt(dirStr, 10),
      tripsPerHour,
      avgHeadwayMin,
      peakHeadwayMin: Math.round(avg(peakHeadways) * 10) / 10,
      offPeakHeadwayMin: Math.round(avg(offPeakHeadways) * 10) / 10,
    });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parse a GTFS zip file and return the full dataset with GeoJSON and analytics.
 *
 * @param data - ArrayBuffer of the .zip file (e.g. from File.arrayBuffer()).
 */
export async function parseGTFS(data: ArrayBuffer): Promise<GTFSDataset> {
  const zip = await JSZip.loadAsync(data);

  const [stopsTxt, routesTxt, tripsTxt, stopTimesTxt, shapesTxt] = await Promise.all([
    readText(zip, 'stops.txt'),
    readText(zip, 'routes.txt'),
    readText(zip, 'trips.txt'),
    readText(zip, 'stop_times.txt'),
    readText(zip, 'shapes.txt'),
  ]);

  if (!stopsTxt) throw new Error('GTFS archive missing stops.txt');
  if (!routesTxt) throw new Error('GTFS archive missing routes.txt');
  if (!tripsTxt) throw new Error('GTFS archive missing trips.txt');

  const stops = parseStops(stopsTxt);
  const routes = parseRoutes(routesTxt);
  const trips = parseTrips(tripsTxt);
  const stopTimes = stopTimesTxt ? parseStopTimes(stopTimesTxt) : [];
  const shapes = shapesTxt ? parseShapes(shapesTxt) : new Map<string, GTFSShape[]>();

  const stopsGeoJSON = stopsToGeoJSON(stops);
  const routesGeoJSON = routesToGeoJSON(routes, trips, shapes);
  const frequencies = computeFrequencies(routes, trips, stopTimes);

  return { stops, routes, trips, stopTimes, shapes, stopsGeoJSON, routesGeoJSON, frequencies };
}
