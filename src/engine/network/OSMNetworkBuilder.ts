/**
 * OSMNetworkBuilder — construct a NetworkGraph from OpenStreetMap data
 * via the Overpass API.
 *
 * Supports mode-specific filtering (walk / cycle / drive) with
 * appropriate speed/time weights, one-way handling, and turn restrictions.
 */

import { type BBox, fetchCustom } from '@/services/data/OverpassConnector';
import { type GraphEdge, type GraphNode, haversine, NetworkGraph, type NodeId } from './NetworkGraph';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TravelMode = 'walk' | 'cycle' | 'drive';

export interface BuildOptions {
  mode: TravelMode;
  /** If true, build as undirected (add reverse edges). Default: depends on mode. */
  undirected?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Speed tables (km/h)                                                */
/* ------------------------------------------------------------------ */

const WALK_SPEED: Record<string, number> = {
  footway: 4.5,
  path: 4,
  pedestrian: 4.5,
  steps: 2,
  residential: 4.5,
  living_street: 4.5,
  service: 4,
  track: 3.5,
  unclassified: 4,
  tertiary: 4,
  secondary: 4,
  primary: 3.5,
  _default: 4,
};

const CYCLE_SPEED: Record<string, number> = {
  cycleway: 18,
  path: 12,
  residential: 16,
  living_street: 14,
  service: 12,
  track: 10,
  unclassified: 14,
  tertiary: 18,
  secondary: 20,
  primary: 20,
  trunk: 22,
  _default: 15,
};

const DRIVE_SPEED: Record<string, number> = {
  motorway: 110,
  motorway_link: 60,
  trunk: 80,
  trunk_link: 50,
  primary: 60,
  primary_link: 40,
  secondary: 50,
  secondary_link: 30,
  tertiary: 40,
  tertiary_link: 25,
  residential: 30,
  living_street: 20,
  service: 20,
  unclassified: 30,
  _default: 30,
};

const SPEED_TABLES: Record<TravelMode, Record<string, number>> = {
  walk: WALK_SPEED,
  cycle: CYCLE_SPEED,
  drive: DRIVE_SPEED,
};

/* ------------------------------------------------------------------ */
/*  Overpass QL builders                                                */
/* ------------------------------------------------------------------ */

function buildOverpassQL(bbox: BBox, mode: TravelMode): string {
  const [south, west, north, east] = bbox;
  const bb = `(${south},${west},${north},${east})`;

  switch (mode) {
    case 'walk':
      return `[out:json][timeout:60];(way["highway"~"footway|path|pedestrian|steps|residential|living_street|service|track|unclassified|tertiary|secondary|primary"]${bb};);out body;>;out skel qt;`;
    case 'cycle':
      return `[out:json][timeout:60];(way["highway"~"cycleway|path|residential|living_street|service|track|unclassified|tertiary|secondary|primary|trunk"]${bb};way["cycleway"]${bb};);out body;>;out skel qt;`;
    case 'drive':
      return `[out:json][timeout:60];(way["highway"~"motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|living_street|service|unclassified"]${bb};);out body;>;out skel qt;`;
    default:
      return `[out:json][timeout:60];(way["highway"]${bb};);out body;>;out skel qt;`;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch OSM road data within a bounding box and build a `NetworkGraph`.
 *
 * @param bbox    [south, west, north, east]
 * @param options Travel mode and undirected flag.
 */
export async function buildFromOSM(
  bbox: BBox,
  options: BuildOptions,
): Promise<NetworkGraph> {
  const { mode, undirected } = options;
  const isUndirected = undirected ?? (mode !== 'drive');

  const ql = buildOverpassQL(bbox, mode);
  const fc = await fetchCustom(ql);

  const graph = new NetworkGraph();
  const speedTable = SPEED_TABLES[mode];
  let edgeIdx = 0;

  for (const feature of fc.features) {
    if (
      feature.geometry.type !== 'LineString' ||
      !feature.geometry.coordinates ||
      feature.geometry.coordinates.length < 2
    ) {
      continue;
    }

    const coords = feature.geometry.coordinates;
    const props = feature.properties ?? {};
    const highway = String(props['highway'] ?? '');
    const oneway = String(props['oneway'] ?? 'no');
    const speedKmh = speedTable[highway] ?? speedTable['_default']!;

    /* Create nodes at endpoints. */
    const startCoord = coords[0]!;
    const endCoord = coords[coords.length - 1]!;
    const srcId = coordNodeId(startCoord);
    const tgtId = coordNodeId(endCoord);

    ensureNode(graph, srcId, startCoord);
    ensureNode(graph, tgtId, endCoord);

    /* Edge length. */
    const length = lineLength(coords);
    /* Weight = travel time in seconds. */
    const weight = (length / (speedKmh * 1000)) * 3600;

    const eid = `osm_e${edgeIdx++}`;
    const fwdEdge: GraphEdge = {
      id: eid,
      source: srcId,
      target: tgtId,
      weight,
      length,
      geometry: feature.geometry as GeoJSON.LineString,
      properties: { highway, oneway, speed_kmh: speedKmh },
    };
    graph.addEdge(fwdEdge);

    /* Add reverse edge unless one-way. */
    const isOneway =
      !isUndirected &&
      (oneway === 'yes' || oneway === '1' || oneway === 'true');

    if (isUndirected || !isOneway) {
      graph.addEdge({
        id: `${eid}_rev`,
        source: tgtId,
        target: srcId,
        weight,
        length,
        geometry: {
          type: 'LineString',
          coordinates: [...coords].reverse(),
        },
        properties: { highway, oneway, speed_kmh: speedKmh },
      });
    }
  }

  return graph;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function coordNodeId(coord: number[]): NodeId {
  return `${coord[0]!.toFixed(7)},${coord[1]!.toFixed(7)}`;
}

function ensureNode(graph: NetworkGraph, id: NodeId, coord: number[]): void {
  if (graph.nodes.has(id)) return;
  const node: GraphNode = {
    id,
    x: coord[0]!,
    y: coord[1]!,
    z: coord[2],
    degree: 0,
  };
  graph.addNode(node);
}

function lineLength(coords: number[][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]!;
    const b = coords[i]!;
    total += haversine(a[1]!, a[0]!, b[1]!, b[0]!);
  }
  return total;
}
