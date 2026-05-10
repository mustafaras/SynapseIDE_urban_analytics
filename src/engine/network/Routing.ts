/**
 * Routing algorithms — Dijkstra, A*, isochrone, batch matrix.
 */

import { type EdgeId, type GraphEdge, haversine, NetworkGraph, type NodeId } from './NetworkGraph';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Route {
  nodes: NodeId[];
  edges: EdgeId[];
  totalCost: number;
  totalLength: number;
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
}

export type WeightFn = (edge: GraphEdge) => number;

/* ------------------------------------------------------------------ */
/*  Priority queue (min-heap)                                          */
/* ------------------------------------------------------------------ */

interface HeapItem {
  id: NodeId;
  cost: number;
}

class MinHeap {
  private _data: HeapItem[] = [];

  get size(): number {
    return this._data.length;
  }

  push(item: HeapItem): void {
    this._data.push(item);
    this._bubbleUp(this._data.length - 1);
  }

  pop(): HeapItem | undefined {
    const top = this._data[0];
    const last = this._data.pop();
    if (this._data.length > 0 && last) {
      this._data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._data[i]!.cost >= this._data[parent]!.cost) break;
      [this._data[i], this._data[parent]] = [this._data[parent]!, this._data[i]!];
      i = parent;
    }
  }

  private _sinkDown(i: number): void {
    const n = this._data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this._data[l]!.cost < this._data[smallest]!.cost) smallest = l;
      if (r < n && this._data[r]!.cost < this._data[smallest]!.cost) smallest = r;
      if (smallest === i) break;
      [this._data[i], this._data[smallest]] = [this._data[smallest]!, this._data[i]!];
      i = smallest;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Dijkstra                                                           */
/* ------------------------------------------------------------------ */

export interface DijkstraResult {
  dist: Map<NodeId, number>;
  prev: Map<NodeId, { node: NodeId; edge: EdgeId }>;
}

export function dijkstra(
  graph: NetworkGraph,
  origin: NodeId,
  weightFn: WeightFn = (e) => e.weight,
  maxCost = Infinity,
): DijkstraResult {
  const dist = new Map<NodeId, number>();
  const prev = new Map<NodeId, { node: NodeId; edge: EdgeId }>();
  const heap = new MinHeap();

  dist.set(origin, 0);
  heap.push({ id: origin, cost: 0 });

  while (heap.size > 0) {
    const cur = heap.pop()!;
    if (cur.cost > (dist.get(cur.id) ?? Infinity)) continue;
    if (cur.cost > maxCost) break;

    for (const edge of graph.outEdges(cur.id)) {
      const w = weightFn(edge);
      if (w < 0) continue; // skip negative
      const alt = cur.cost + w;
      if (alt < (dist.get(edge.target) ?? Infinity)) {
        dist.set(edge.target, alt);
        prev.set(edge.target, { node: cur.id, edge: edge.id });
        heap.push({ id: edge.target, cost: alt });
      }
    }
  }

  return { dist, prev };
}

/* ------------------------------------------------------------------ */
/*  Shortest path (Dijkstra)                                           */
/* ------------------------------------------------------------------ */

export function shortestPath(
  graph: NetworkGraph,
  origin: NodeId,
  destination: NodeId,
  weightFn: WeightFn = (e) => e.weight,
): Route | null {
  const { dist, prev } = dijkstra(graph, origin, weightFn);
  if (!dist.has(destination)) return null;

  const nodes: NodeId[] = [];
  const edges: EdgeId[] = [];
  let cur: NodeId | undefined = destination;

  while (cur !== undefined) {
    nodes.unshift(cur);
    const p = prev.get(cur);
    if (!p) break;
    edges.unshift(p.edge);
    cur = p.node;
  }

  const coords: number[][] = [];
  let totalLength = 0;
  for (const eid of edges) {
    const e = graph.edges.get(eid);
    if (e) {
      coords.push(...e.geometry.coordinates);
      totalLength += e.length;
    }
  }

  return {
    nodes,
    edges,
    totalCost: dist.get(destination) ?? 0,
    totalLength,
    geometry: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { cost: dist.get(destination), length: totalLength },
    },
  };
}

/* ------------------------------------------------------------------ */
/*  A* (haversine heuristic)                                           */
/* ------------------------------------------------------------------ */

export function aStarPath(
  graph: NetworkGraph,
  origin: NodeId,
  destination: NodeId,
  weightFn: WeightFn = (e) => e.weight,
): Route | null {
  const destNode = graph.nodes.get(destination);
  if (!destNode) return null;

  const gScore = new Map<NodeId, number>();
  const prev = new Map<NodeId, { node: NodeId; edge: EdgeId }>();
  const heap = new MinHeap();

  gScore.set(origin, 0);
  const originNode = graph.nodes.get(origin);
  const h0 = originNode ? haversine(originNode.y, originNode.x, destNode.y, destNode.x) : 0;
  heap.push({ id: origin, cost: h0 });

  const closed = new Set<NodeId>();

  while (heap.size > 0) {
    const cur = heap.pop()!;
    if (cur.id === destination) break;
    if (closed.has(cur.id)) continue;
    closed.add(cur.id);

    const curG = gScore.get(cur.id) ?? Infinity;

    for (const edge of graph.outEdges(cur.id)) {
      if (closed.has(edge.target)) continue;
      const w = weightFn(edge);
      if (w < 0) continue;
      const tentG = curG + w;
      if (tentG < (gScore.get(edge.target) ?? Infinity)) {
        gScore.set(edge.target, tentG);
        prev.set(edge.target, { node: cur.id, edge: edge.id });
        const tgtNode = graph.nodes.get(edge.target);
        const h = tgtNode
          ? haversine(tgtNode.y, tgtNode.x, destNode.y, destNode.x)
          : 0;
        heap.push({ id: edge.target, cost: tentG + h });
      }
    }
  }

  if (!gScore.has(destination)) return null;

  /* Reconstruct path */
  const nodes: NodeId[] = [];
  const edges: EdgeId[] = [];
  let c: NodeId | undefined = destination;
  while (c !== undefined) {
    nodes.unshift(c);
    const p = prev.get(c);
    if (!p) break;
    edges.unshift(p.edge);
    c = p.node;
  }

  const coords: number[][] = [];
  let totalLength = 0;
  for (const eid of edges) {
    const e = graph.edges.get(eid);
    if (e) {
      coords.push(...e.geometry.coordinates);
      totalLength += e.length;
    }
  }

  return {
    nodes,
    edges,
    totalCost: gScore.get(destination) ?? 0,
    totalLength,
    geometry: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { cost: gScore.get(destination), length: totalLength },
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Isochrone                                                          */
/* ------------------------------------------------------------------ */

/**
 * Compute the isochrone — all nodes reachable within `threshold` cost
 * from `origin`. Returns a GeoJSON Polygon (convex hull of reachable nodes).
 */
export function isochrone(
  graph: NetworkGraph,
  origin: NodeId,
  threshold: number,
  weightFn: WeightFn = (e) => e.weight,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const { dist } = dijkstra(graph, origin, weightFn, threshold);

  const points: [number, number][] = [];
  for (const [nid, cost] of dist) {
    if (cost <= threshold) {
      const n = graph.nodes.get(nid);
      if (n) points.push([n.x, n.y]);
    }
  }

  if (points.length < 3) {
    /* Degenerate — return bounding box. */
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs) - 0.0001;
    const maxX = Math.max(...xs) + 0.0001;
    const minY = Math.min(...ys) - 0.0001;
    const maxY = Math.max(...ys) + 0.0001;
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY],
        ]],
      },
      properties: { origin, threshold },
    };
  }

  const hull = convexHull(points);
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [hull] },
    properties: { origin, threshold },
  };
}

/* ------------------------------------------------------------------ */
/*  Batch: many-to-many shortest path matrix                           */
/* ------------------------------------------------------------------ */

/**
 * Compute an origin–destination cost matrix.
 * Returns a 2D array `matrix[i][j]` = cost from origins[i] to destinations[j].
 * Infinity if unreachable.
 */
export function batchMatrix(
  graph: NetworkGraph,
  origins: NodeId[],
  destinations: NodeId[],
  weightFn: WeightFn = (e) => e.weight,
): number[][] {
  const destSet = new Set(destinations);
  return origins.map((o) => {
    const { dist } = dijkstra(graph, o, weightFn);
    return destinations.map((d) => {
      if (destSet.has(d)) return dist.get(d) ?? Infinity;
      return Infinity;
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Convex hull (Graham scan)                                          */
/* ------------------------------------------------------------------ */

function convexHull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return [...pts, pts[0]!]; // closed ring

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }

  /* Remove last point of each half because it's repeated. */
  lower.pop();
  upper.pop();
  const ring = [...lower, ...upper];
  ring.push(ring[0]!); // close
  return ring;
}
