/**
 * NetworkGraph — directed/undirected graph with spatial index.
 *
 * Nodes and edges stored in Maps for O(1) lookup.
 * RBush spatial index enables fast nearest-node queries.
 */

import RBush from 'rbush';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NodeId = string;
export type EdgeId = string;

export interface GraphNode {
  id: NodeId;
  x: number;       // longitude
  y: number;       // latitude
  z?: number;      // elevation (optional)
  degree: number;
  type?: string;    // e.g. "intersection", "dead_end"
}

export interface GraphEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  weight: number;     // cost (time in s, distance in m, etc.)
  length: number;     // metres
  geometry: GeoJSON.LineString;
  properties: Record<string, unknown>;
}

/** RBush item wrapping a graph node for spatial lookup. */
interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  nodeId: NodeId;
}

/* ------------------------------------------------------------------ */
/*  Haversine helper                                                   */
/* ------------------------------------------------------------------ */

const R_EARTH = 6_371_000; // metres

export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ------------------------------------------------------------------ */
/*  NetworkGraph class                                                 */
/* ------------------------------------------------------------------ */

export class NetworkGraph {
  readonly nodes = new Map<NodeId, GraphNode>();
  readonly edges = new Map<EdgeId, GraphEdge>();

  /** Adjacency list: nodeId → outgoing edge ids. */
  readonly adj = new Map<NodeId, EdgeId[]>();
  /** Reverse adjacency (incoming). */
  readonly radj = new Map<NodeId, EdgeId[]>();

  private _spatial: RBush<SpatialItem> | null = null;
  private _spatialDirty = true;

  /* ---------- mutation ------------------------------------------- */

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adj.has(node.id)) this.adj.set(node.id, []);
    if (!this.radj.has(node.id)) this.radj.set(node.id, []);
    this._spatialDirty = true;
  }

  addEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge);
    let outList = this.adj.get(edge.source);
    if (!outList) { outList = []; this.adj.set(edge.source, outList); }
    outList.push(edge.id);

    let inList = this.radj.get(edge.target);
    if (!inList) { inList = []; this.radj.set(edge.target, inList); }
    inList.push(edge.id);

    /* Update degree counts. */
    const src = this.nodes.get(edge.source);
    if (src) src.degree++;
    const tgt = this.nodes.get(edge.target);
    if (tgt) tgt.degree++;
  }

  removeNode(id: NodeId): void {
    /* Remove all connected edges first. */
    const out = this.adj.get(id) ?? [];
    const inc = this.radj.get(id) ?? [];
    for (const eid of [...out, ...inc]) this.removeEdge(eid);
    this.nodes.delete(id);
    this.adj.delete(id);
    this.radj.delete(id);
    this._spatialDirty = true;
  }

  removeEdge(id: EdgeId): void {
    const e = this.edges.get(id);
    if (!e) return;
    this.edges.delete(id);

    const outList = this.adj.get(e.source);
    if (outList) {
      const idx = outList.indexOf(id);
      if (idx !== -1) outList.splice(idx, 1);
    }
    const inList = this.radj.get(e.target);
    if (inList) {
      const idx = inList.indexOf(id);
      if (idx !== -1) inList.splice(idx, 1);
    }

    const src = this.nodes.get(e.source);
    if (src && src.degree > 0) src.degree--;
    const tgt = this.nodes.get(e.target);
    if (tgt && tgt.degree > 0) tgt.degree--;
  }

  /* ---------- spatial index -------------------------------------- */

  private _ensureSpatial(): RBush<SpatialItem> {
    if (!this._spatial || this._spatialDirty) {
      this._spatial = new RBush<SpatialItem>();
      const items: SpatialItem[] = [];
      for (const n of this.nodes.values()) {
        items.push({ minX: n.x, minY: n.y, maxX: n.x, maxY: n.y, nodeId: n.id });
      }
      this._spatial.load(items);
      this._spatialDirty = false;
    }
    return this._spatial;
  }

  /** Find the nearest node to the given (lon, lat). */
  nearestNode(lon: number, lat: number): GraphNode | undefined {
    const tree = this._ensureSpatial();
    /* Progressively enlarge search bbox. */
    let radius = 0.001; // ~100 m
    for (let attempt = 0; attempt < 8; attempt++) {
      const hits = tree.search({
        minX: lon - radius,
        minY: lat - radius,
        maxX: lon + radius,
        maxY: lat + radius,
      });
      if (hits.length > 0) {
        let best: GraphNode | undefined;
        let bestDist = Infinity;
        for (const h of hits) {
          const d = haversine(lat, lon, h.minY, h.minX);
          if (d < bestDist) {
            bestDist = d;
            best = this.nodes.get(h.nodeId);
          }
        }
        return best;
      }
      radius *= 2;
    }
    return undefined;
  }

  /** All nodes within `radiusMetres` of (lon, lat). */
  nodesWithin(lon: number, lat: number, radiusMetres: number): GraphNode[] {
    const tree = this._ensureSpatial();
    const degApprox = radiusMetres / 111_320;
    const hits = tree.search({
      minX: lon - degApprox,
      minY: lat - degApprox,
      maxX: lon + degApprox,
      maxY: lat + degApprox,
    });
    const result: GraphNode[] = [];
    for (const h of hits) {
      if (haversine(lat, lon, h.minY, h.minX) <= radiusMetres) {
        const n = this.nodes.get(h.nodeId);
        if (n) result.push(n);
      }
    }
    return result;
  }

  /* ---------- neighbours ----------------------------------------- */

  /** Outgoing edges from a node. */
  outEdges(nodeId: NodeId): GraphEdge[] {
    const ids = this.adj.get(nodeId) ?? [];
    const out: GraphEdge[] = [];
    for (const eid of ids) {
      const e = this.edges.get(eid);
      if (e) out.push(e);
    }
    return out;
  }

  /** Get all neighbor node ids reachable from `nodeId`. */
  neighbors(nodeId: NodeId): NodeId[] {
    return this.outEdges(nodeId).map((e) => e.target);
  }
}

/* ------------------------------------------------------------------ */
/*  Build from GeoJSON                                                 */
/* ------------------------------------------------------------------ */

/**
 * Construct a NetworkGraph from GeoJSON FeatureCollections.
 *
 * @param edgesFC  LineString features (one per edge).
 *                 Must have properties `source` and `target` as node IDs,
 *                 OR endpoints are auto-snapped to nearest nodes.
 * @param nodesFC  Optional Point features (one per node, `id` property).
 * @param options  `directed` (default true), `weightProp` (default 'weight').
 */
export function buildFromGeoJSON(
  edgesFC: GeoJSON.FeatureCollection<GeoJSON.LineString>,
  nodesFC?: GeoJSON.FeatureCollection<GeoJSON.Point>,
  options: { directed?: boolean; weightProp?: string } = {},
): NetworkGraph {
  const { directed = true, weightProp = 'weight' } = options;
  const graph = new NetworkGraph();

  /* Load explicit nodes. */
  if (nodesFC) {
    for (const f of nodesFC.features) {
      const id = String(f.properties?.['id'] ?? f.id ?? `n${graph.nodes.size}`);
      const [x, y, z] = f.geometry.coordinates;
      graph.addNode({ id, x: x!, y: y!, z, degree: 0 });
    }
  }

  /* Load edges. */
  let edgeCounter = 0;
  for (const f of edgesFC.features) {
    const coords = f.geometry.coordinates;
    if (coords.length < 2) continue;

    const startCoord = coords[0]!;
    const endCoord = coords[coords.length - 1]!;

    /* Resolve or create source/target nodes. */
    const srcId = resolveNode(graph, f.properties?.['source'], startCoord);
    const tgtId = resolveNode(graph, f.properties?.['target'], endCoord);

    const len = lineLength(coords);
    const rawWeight = f.properties?.[weightProp];
    const weight = typeof rawWeight === 'number' && Number.isFinite(rawWeight) ? rawWeight : len;

    const eid = String(f.properties?.['id'] ?? f.id ?? `e${edgeCounter++}`);
    graph.addEdge({
      id: eid,
      source: srcId,
      target: tgtId,
      weight,
      length: len,
      geometry: f.geometry,
      properties: f.properties ?? {},
    });

    if (!directed) {
      graph.addEdge({
        id: `${eid}_rev`,
        source: tgtId,
        target: srcId,
        weight,
        length: len,
        geometry: {
          type: 'LineString',
          coordinates: [...coords].reverse(),
        },
        properties: f.properties ?? {},
      });
    }
  }

  return graph;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function coordKey(c: number[]): string {
  return `${c[0]!.toFixed(7)},${c[1]!.toFixed(7)}`;
}

const _coordNodeMap = new Map<string, NodeId>();

function resolveNode(
  graph: NetworkGraph,
  explicitId: unknown,
  coord: number[],
): NodeId {
  if (typeof explicitId === 'string' && graph.nodes.has(explicitId))
    return explicitId;

  const key = coordKey(coord);
  const existing = _coordNodeMap.get(key);
  if (existing && graph.nodes.has(existing)) return existing;

  const id = typeof explicitId === 'string' ? explicitId : `n_${key}`;
  if (!graph.nodes.has(id)) {
    graph.addNode({ id, x: coord[0]!, y: coord[1]!, z: coord[2], degree: 0 });
  }
  _coordNodeMap.set(key, id);
  return id;
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
