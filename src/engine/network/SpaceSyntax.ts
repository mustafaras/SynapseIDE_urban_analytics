/**
 * Space Syntax — angular segment analysis.
 *
 * Integration, Choice, NACH (Normalised Angular Choice),
 * and NAIN (Normalised Angular Integration).
 *
 * Reference: Hillier & Hanson (1984), Al-Sayed et al. (2014).
 */

import type { EdgeId, NetworkGraph, NodeId } from './NetworkGraph';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** SegmentId is an alias for EdgeId in the segment map. */
export type SegmentId = EdgeId;

/* ------------------------------------------------------------------ */
/*  Angular cost helper                                                */
/* ------------------------------------------------------------------ */

/**
 * Compute the angular change (in degrees) between two consecutive segments.
 * Uses the bearing at the shared endpoint.
 */
function angularCost(
  edgeA: { geometry: GeoJSON.LineString },
  edgeB: { geometry: GeoJSON.LineString },
): number {
  const cA = edgeA.geometry.coordinates;
  const cB = edgeB.geometry.coordinates;
  if (cA.length < 2 || cB.length < 2) return 0;

  /* Bearing at end of A. */
  const a1 = cA[cA.length - 2]!;
  const a2 = cA[cA.length - 1]!;
  const bearingA = Math.atan2(a2[0]! - a1[0]!, a2[1]! - a1[1]!);

  /* Bearing at start of B. */
  const b1 = cB[0]!;
  const b2 = cB[1]!;
  const bearingB = Math.atan2(b2[0]! - b1[0]!, b2[1]! - b1[1]!);

  let diff = Math.abs(bearingA - bearingB) * (180 / Math.PI);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/* ------------------------------------------------------------------ */
/*  Angular shortest-path (Dijkstra on angular cost)                   */
/* ------------------------------------------------------------------ */

interface AngularSPResult {
  angleDist: Map<NodeId, number>;
  topoDepth: Map<NodeId, number>;
  pathCount: Map<NodeId, number>;
  pred: Map<NodeId, { node: NodeId; edge: EdgeId }[]>;
}

function angularDijkstra(
  graph: NetworkGraph,
  origin: NodeId,
  radius: number,
): AngularSPResult {
  const angleDist = new Map<NodeId, number>();
  const topoDepth = new Map<NodeId, number>();
  const pathCount = new Map<NodeId, number>();
  const pred = new Map<NodeId, { node: NodeId; edge: EdgeId }[]>();

  for (const id of graph.nodes.keys()) {
    angleDist.set(id, Infinity);
    topoDepth.set(id, 0);
    pathCount.set(id, 0);
    pred.set(id, []);
  }

  angleDist.set(origin, 0);
  pathCount.set(origin, 1);

  const queue: { id: NodeId; cost: number; lastEdge: EdgeId | null }[] = [
    { id: origin, cost: 0, lastEdge: null },
  ];

  const visited = new Set<NodeId>();

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift()!;
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);

    for (const edge of graph.outEdges(cur.id)) {
      /* Compute angular cost. */
      let angle = 0;
      if (cur.lastEdge) {
        const prevEdge = graph.edges.get(cur.lastEdge);
        if (prevEdge) angle = angularCost(prevEdge, edge);
      }

      /* Normalise: 0-180° → 0-2 turn units (1 turn = 90°). */
      const turnCost = angle / 90;
      const newCost = cur.cost + turnCost;

      if (newCost > radius) continue;

      if (newCost < (angleDist.get(edge.target) ?? Infinity)) {
        angleDist.set(edge.target, newCost);
        topoDepth.set(edge.target, (topoDepth.get(cur.id) ?? 0) + 1);
        pathCount.set(edge.target, pathCount.get(cur.id) ?? 1);
        pred.set(edge.target, [{ node: cur.id, edge: edge.id }]);
        queue.push({ id: edge.target, cost: newCost, lastEdge: edge.id });
      } else if (Math.abs(newCost - (angleDist.get(edge.target) ?? Infinity)) < 1e-10) {
        pathCount.set(
          edge.target,
          (pathCount.get(edge.target) ?? 0) + (pathCount.get(cur.id) ?? 0),
        );
        pred.get(edge.target)!.push({ node: cur.id, edge: edge.id });
      }
    }
  }

  return { angleDist, topoDepth, pathCount, pred };
}

/* ------------------------------------------------------------------ */
/*  Integration (normalised Angular Total Depth)                       */
/* ------------------------------------------------------------------ */

/**
 * Angular integration at a given radius.
 *
 * Integration_i = (n - 1) / Total_Angular_Depth_i
 *
 * @param radius  Maximum angular cost (in 90° turn units). Use Infinity for global.
 * @returns Map<SegmentId, number> — integration per segment endpoint node.
 */
export function integration(
  graph: NetworkGraph,
  radius = Infinity,
): Map<SegmentId, number> {
  const result = new Map<SegmentId, number>();
  const nodeIds = [...graph.nodes.keys()];
  const n = nodeIds.length;

  for (const s of nodeIds) {
    const { angleDist } = angularDijkstra(graph, s, radius);
    let totalDepth = 0;
    let reachable = 0;
    for (const [nid, d] of angleDist) {
      if (nid !== s && d < Infinity) {
        totalDepth += d;
        reachable++;
      }
    }
    result.set(s, reachable > 0 ? reachable / totalDepth : 0);
  }

  /* Map onto edges: average of source & target. */
  const edgeResult = new Map<SegmentId, number>();
  for (const [eid, edge] of graph.edges) {
    const srcVal = result.get(edge.source) ?? 0;
    const tgtVal = result.get(edge.target) ?? 0;
    edgeResult.set(eid, (srcVal + tgtVal) / 2);
  }

  /* Normalise so max = 1 if there are values. */
  const maxVal = Math.max(...edgeResult.values(), 1e-15);
  if (n > 1) {
    for (const [k, v] of edgeResult) edgeResult.set(k, v / maxVal);
  }

  return edgeResult;
}

/* ------------------------------------------------------------------ */
/*  Choice (angular betweenness)                                       */
/* ------------------------------------------------------------------ */

/**
 * Angular choice at a given radius (angular betweenness centrality).
 *
 * @param radius  Maximum angular cost. Use Infinity for global.
 */
export function choice(
  graph: NetworkGraph,
  radius = Infinity,
): Map<SegmentId, number> {
  const edgeScore = new Map<SegmentId, number>();
  for (const eid of graph.edges.keys()) edgeScore.set(eid, 0);

  for (const s of graph.nodes.keys()) {
    const { angleDist, pathCount, pred } = angularDijkstra(graph, s, radius);

    /* Build stack in order of decreasing distance. */
    const ordered = [...angleDist.entries()]
      .filter(([id, d]) => id !== s && d < Infinity)
      .sort((a, b) => b[1] - a[1]);

    const delta = new Map<NodeId, number>();
    for (const id of graph.nodes.keys()) delta.set(id, 0);

    for (const [w] of ordered) {
      for (const p of pred.get(w) ?? []) {
        const coeff =
          ((pathCount.get(p.node) ?? 0) / Math.max(pathCount.get(w) ?? 1, 1)) *
          (1 + (delta.get(w) ?? 0));
        delta.set(p.node, (delta.get(p.node) ?? 0) + coeff);
        edgeScore.set(p.edge, (edgeScore.get(p.edge) ?? 0) + coeff);
      }
    }
  }

  return edgeScore;
}

/* ------------------------------------------------------------------ */
/*  NACH & NAIN (Turner 2007)                                          */
/* ------------------------------------------------------------------ */

/**
 * NACH — Normalised Angular Choice.
 * NACH = log(Choice + 1) / log(Total_Depth + 3)
 */
export function nach(
  graph: NetworkGraph,
  radius = Infinity,
): Map<SegmentId, number> {
  const ch = choice(graph, radius);
  const result = new Map<SegmentId, number>();

  /* Compute node-level total angular depth. */
  const totalDepth = new Map<NodeId, number>();
  for (const s of graph.nodes.keys()) {
    const { angleDist } = angularDijkstra(graph, s, radius);
    let td = 0;
    for (const [nid, d] of angleDist) {
      if (nid !== s && d < Infinity) td += d;
    }
    totalDepth.set(s, td);
  }

  for (const [eid, edge] of graph.edges) {
    const td =
      ((totalDepth.get(edge.source) ?? 0) + (totalDepth.get(edge.target) ?? 0)) / 2;
    const c = ch.get(eid) ?? 0;
    result.set(eid, Math.log(c + 1) / Math.log(td + 3));
  }
  return result;
}

/**
 * NAIN — Normalised Angular Integration.
 * NAIN = n^1.2 / Total_Depth
 */
export function nain(
  graph: NetworkGraph,
  radius = Infinity,
): Map<SegmentId, number> {
  const result = new Map<SegmentId, number>();

  for (const s of graph.nodes.keys()) {
    const { angleDist } = angularDijkstra(graph, s, radius);
    let td = 0;
    let reachable = 0;
    for (const [nid, d] of angleDist) {
      if (nid !== s && d < Infinity) {
        td += d;
        reachable++;
      }
    }
    const nainValue = td > 0 ? Math.pow(reachable, 1.2) / td : 0;
    result.set(s, nainValue);
  }

  /* Map onto edges: average of source & target. */
  const edgeResult = new Map<SegmentId, number>();
  for (const [eid, edge] of graph.edges) {
    const srcVal = result.get(edge.source) ?? 0;
    const tgtVal = result.get(edge.target) ?? 0;
    edgeResult.set(eid, (srcVal + tgtVal) / 2);
  }

  return edgeResult;
}
