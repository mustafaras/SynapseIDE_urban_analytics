/**
 * Centrality measures — betweenness (Brandes), closeness, PageRank.
 */

import type { EdgeId, NetworkGraph, NodeId } from './NetworkGraph';

/* ------------------------------------------------------------------ */
/*  Betweenness Centrality — Brandes O(VE)                            */
/* ------------------------------------------------------------------ */

/**
 * Edge betweenness centrality via Brandes algorithm.
 * Returns a Map from EdgeId → betweenness score.
 */
export function betweennessCentrality(graph: NetworkGraph): Map<EdgeId, number> {
  const edgeBC = new Map<EdgeId, number>();
  for (const eid of graph.edges.keys()) edgeBC.set(eid, 0);

  for (const s of graph.nodes.keys()) {
    /* BFS / Dijkstra from s */
    const stack: NodeId[] = [];
    const pred = new Map<NodeId, { node: NodeId; edge: EdgeId }[]>();
    const sigma = new Map<NodeId, number>();
    const dist = new Map<NodeId, number>();
    const delta = new Map<NodeId, number>();

    for (const v of graph.nodes.keys()) {
      pred.set(v, []);
      sigma.set(v, 0);
      dist.set(v, -1);
      delta.set(v, 0);
    }
    sigma.set(s, 1);
    dist.set(s, 0);

    /* Dijkstra using a simple sorted queue (fine for moderate graphs). */
    const queue: { id: NodeId; cost: number }[] = [{ id: s, cost: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const cur = queue.shift()!;
      const v = cur.id;
      stack.push(v);

      for (const edge of graph.outEdges(v)) {
        const w = edge.target;
        const newDist = (dist.get(v) ?? 0) + edge.weight;

        /* First visit */
        if (dist.get(w) === -1) {
          dist.set(w, newDist);
          queue.push({ id: w, cost: newDist });
          sigma.set(w, 0);
        }

        /* Shortest path to w via v */
        if (Math.abs((dist.get(w) ?? 0) - newDist) < 1e-10) {
          sigma.set(w, (sigma.get(w) ?? 0) + (sigma.get(v) ?? 0));
          pred.get(w)!.push({ node: v, edge: edge.id });
        }
      }
    }

    /* Accumulation — back-propagation */
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const p of pred.get(w) ?? []) {
        const coeff =
          ((sigma.get(p.node) ?? 0) / (sigma.get(w) ?? 1)) *
          (1 + (delta.get(w) ?? 0));
        delta.set(p.node, (delta.get(p.node) ?? 0) + coeff);
        edgeBC.set(p.edge, (edgeBC.get(p.edge) ?? 0) + coeff);
      }
    }
  }

  /* For undirected graphs the scores are doubled; caller can normalise. */
  return edgeBC;
}

/* ------------------------------------------------------------------ */
/*  Closeness Centrality                                               */
/* ------------------------------------------------------------------ */

/**
 * Closeness centrality for each node.
 * C(v) = (n-1) / Σ d(v,u) for all reachable u.
 */
export function closenessCentrality(graph: NetworkGraph): Map<NodeId, number> {
  const result = new Map<NodeId, number>();
  const n = graph.nodes.size;

  for (const s of graph.nodes.keys()) {
    const dist = new Map<NodeId, number>();
    const queue: { id: NodeId; cost: number }[] = [{ id: s, cost: 0 }];
    dist.set(s, 0);

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const cur = queue.shift()!;
      if (cur.cost > (dist.get(cur.id) ?? Infinity)) continue;

      for (const edge of graph.outEdges(cur.id)) {
        const alt = cur.cost + edge.weight;
        if (alt < (dist.get(edge.target) ?? Infinity)) {
          dist.set(edge.target, alt);
          queue.push({ id: edge.target, cost: alt });
        }
      }
    }

    let totalDist = 0;
    let reachable = 0;
    for (const [nid, d] of dist) {
      if (nid !== s) {
        totalDist += d;
        reachable++;
      }
    }

    result.set(
      s,
      reachable > 0 && totalDist > 0 ? reachable / totalDist : 0,
    );
  }

  /* Optional: normalise to [0, n-1] convention. */
  if (n > 1) {
    for (const [k, v] of result) {
      result.set(k, v * (n - 1));
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  PageRank                                                           */
/* ------------------------------------------------------------------ */

/**
 * PageRank algorithm (power iteration).
 *
 * @param graph     The network graph.
 * @param damping   Damping factor (default 0.85).
 * @param maxIter   Maximum iterations (default 100).
 * @param tol       Convergence tolerance (default 1e-6).
 */
export function pageRank(
  graph: NetworkGraph,
  damping = 0.85,
  maxIter = 100,
  tol = 1e-6,
): Map<NodeId, number> {
  const n = graph.nodes.size;
  if (n === 0) return new Map();

  const ids = [...graph.nodes.keys()];
  let rank = new Map<NodeId, number>();
  for (const id of ids) rank.set(id, 1 / n);

  for (let iter = 0; iter < maxIter; iter++) {
    const next = new Map<NodeId, number>();
    for (const id of ids) next.set(id, (1 - damping) / n);

    /* Dangling node mass (nodes with no outgoing edges). */
    let danglingSum = 0;
    for (const id of ids) {
      if ((graph.adj.get(id)?.length ?? 0) === 0) {
        danglingSum += rank.get(id) ?? 0;
      }
    }
    const danglingContrib = (damping * danglingSum) / n;
    for (const id of ids) {
      next.set(id, next.get(id)! + danglingContrib);
    }

    /* Distribute rank along edges. */
    for (const id of ids) {
      const outEdges = graph.outEdges(id);
      if (outEdges.length === 0) continue;
      const share = (damping * (rank.get(id) ?? 0)) / outEdges.length;
      for (const e of outEdges) {
        next.set(e.target, (next.get(e.target) ?? 0) + share);
      }
    }

    /* Check convergence. */
    let diff = 0;
    for (const id of ids) {
      diff += Math.abs((next.get(id) ?? 0) - (rank.get(id) ?? 0));
    }
    rank = next;
    if (diff < tol) break;
  }

  return rank;
}
