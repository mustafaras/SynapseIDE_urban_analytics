/**
 * Accessibility measures on a network graph.
 *
 * - Cumulative opportunities
 * - Gravity-based (Hansen 1959)
 * - Two-Step Floating Catchment Area (2SFCA)
 */

import type { NetworkGraph, NodeId } from './NetworkGraph';
import { dijkstra, type WeightFn } from './Routing';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DemandPoint {
  nodeId: NodeId;
  demand: number;
}

export interface SupplyPoint {
  nodeId: NodeId;
  supply: number;
}

/* ------------------------------------------------------------------ */
/*  Cumulative Opportunities                                           */
/* ------------------------------------------------------------------ */

/**
 * Count the number of POIs reachable from each origin within `threshold` cost.
 *
 * @returns Array aligned with `origins` — count of reachable POIs per origin.
 */
export function cumulativeOpportunities(
  graph: NetworkGraph,
  origins: NodeId[],
  pois: NodeId[],
  threshold: number,
  weightFn?: WeightFn,
): number[] {
  const poiSet = new Set(pois);
  return origins.map((o) => {
    const { dist } = dijkstra(graph, o, weightFn, threshold);
    let count = 0;
    for (const [nid, cost] of dist) {
      if (cost <= threshold && poiSet.has(nid)) count++;
    }
    return count;
  });
}

/* ------------------------------------------------------------------ */
/*  Gravity Accessibility (Hansen 1959)                                */
/* ------------------------------------------------------------------ */

/**
 * A_i = Σ_j  (S_j × f(c_ij))
 *
 * where f(c) = exp(-β × c)  is a negative-exponential impedance function,
 * S_j = 1 for simple POI presence (or can be weighted).
 *
 * @param beta   Impedance parameter (default 0.001 for metre-cost).
 * @returns Array aligned with `origins`.
 */
export function gravityAccessibility(
  graph: NetworkGraph,
  origins: NodeId[],
  pois: NodeId[],
  beta = 0.001,
  weightFn?: WeightFn,
): number[] {
  const poiSet = new Set(pois);
  return origins.map((o) => {
    const { dist } = dijkstra(graph, o, weightFn);
    let score = 0;
    for (const [nid, cost] of dist) {
      if (poiSet.has(nid)) {
        score += Math.exp(-beta * cost);
      }
    }
    return score;
  });
}

/* ------------------------------------------------------------------ */
/*  Two-Step Floating Catchment Area (2SFCA)                           */
/* ------------------------------------------------------------------ */

/**
 * 2SFCA accessibility index (Luo & Wang 2003).
 *
 * Step 1: For each supply j, compute R_j = S_j / Σ_{k∈catchment} D_k
 * Step 2: For each demand i, A_i = Σ_{j∈catchment} R_j
 *
 * @param threshold   Catchment travel cost.
 * @returns Array aligned with `demand` — accessibility score per demand point.
 */
export function twoStepFloatingCatchment(
  graph: NetworkGraph,
  demand: DemandPoint[],
  supply: SupplyPoint[],
  threshold: number,
  weightFn?: WeightFn,
): number[] {
  /* Pre-compute Dijkstra from every supply point. */
  const supplyDists = supply.map((s) =>
    dijkstra(graph, s.nodeId, weightFn, threshold),
  );

  /* Step 1 — supply-to-population ratios. */
  const ratios: number[] = supply.map((s, si) => {
    const { dist } = supplyDists[si]!;
    let totalDemand = 0;
    for (const d of demand) {
      const cost = dist.get(d.nodeId);
      if (cost !== undefined && cost <= threshold) {
        totalDemand += d.demand;
      }
    }
    return totalDemand > 0 ? s.supply / totalDemand : 0;
  });

  /* Step 2 — aggregate ratios for each demand. */
  /* Pre-compute Dijkstra from each demand. */
  const demandDists = demand.map((d) =>
    dijkstra(graph, d.nodeId, weightFn, threshold),
  );

  return demand.map((_d, di) => {
    const { dist } = demandDists[di]!;
    let acc = 0;
    for (let si = 0; si < supply.length; si++) {
      const cost = dist.get(supply[si]!.nodeId);
      if (cost !== undefined && cost <= threshold) {
        acc += ratios[si]!;
      }
    }
    return acc;
  });
}
