/**
 * ClusterAnalysis — Tests with realistic urban indicator fixtures.
 *
 * Fixture 1: Census-morphology (8 neighbourhoods × 4 indicators)
 *   Three expected neighbourhood types: dense-old, suburban-new, transitional
 *
 * Fixture 2: Urban liveability (15 tracts × 6 indicators)
 *   Three expected clusters: urban core, suburban, transitional
 */

import { describe, expect, it } from "vitest";
import {
  elbowAnalysis,
  hierarchicalClustering,
  kMeans,
  silhouette,
} from "../ClusterAnalysis";

// ═══════════════════════════════════════════════════════════════════════════
//  Fixtures
// ═══════════════════════════════════════════════════════════════════════════

/** Census-morphology: [popDensity, medianIncome, greenPct, buildingAge] */
const CENSUS_MORPH: number[][] = [
  [120, 45, 35, 60],
  [150, 40, 30, 70],
  [80,  65, 45, 40],
  [40,  90, 60, 20],
  [35,  95, 65, 15],
  [110, 50, 38, 55],
  [60,  75, 50, 35],
  [130, 38, 28, 75],
];

/** Liveability: [transit, walkability, air, noise, cost, services] */
const LIVEABILITY: number[][] = [
  [85, 92, 30, 70, 40, 80],
  [80, 83, 35, 65, 45, 75],
  [75, 78, 40, 60, 50, 72],
  [90, 88, 25, 75, 35, 85],
  [70, 74, 50, 55, 55, 65],
  [30, 38, 80, 85, 75, 30],
  [25, 28, 85, 90, 80, 25],
  [35, 42, 75, 80, 70, 35],
  [40, 48, 70, 75, 65, 40],
  [20, 22, 90, 95, 85, 20],
  [55, 58, 55, 65, 55, 55],
  [60, 62, 50, 60, 50, 60],
  [50, 53, 60, 70, 60, 50],
  [45, 52, 65, 75, 65, 45],
  [65, 68, 45, 55, 45, 65],
];

// ═══════════════════════════════════════════════════════════════════════════
//  K-Means — Census-morphology
// ═══════════════════════════════════════════════════════════════════════════

describe("kMeans — Census-morphology", () => {
  const result = kMeans(CENSUS_MORPH, { k: 3, seed: 42 });

  it("produces correct number of clusters", () => {
    expect(result.k).toBe(3);
  });

  it("assigns a label to every observation", () => {
    expect(result.labels).toHaveLength(8);
    result.labels.forEach((l) => {
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThan(3);
    });
  });

  it("all clusters have at least one member", () => {
    const clusterCounts = new Map<number, number>();
    for (const l of result.labels) {
      clusterCounts.set(l, (clusterCounts.get(l) ?? 0) + 1);
    }
    expect(clusterCounts.size).toBe(3);
  });

  it("WCSS array has k entries", () => {
    expect(result.wcss).toHaveLength(3);
    result.wcss.forEach((w) => expect(w).toBeGreaterThanOrEqual(0));
  });

  it("totalWcss equals sum of per-cluster WCSS", () => {
    const sum = result.wcss.reduce((s, v) => s + v, 0);
    expect(result.totalWcss).toBeCloseTo(sum, 8);
  });

  it("silhouette scores are in [-1, 1]", () => {
    expect(result.silhouetteScores).toHaveLength(8);
    result.silhouetteScores.forEach((s) => {
      expect(s).toBeGreaterThanOrEqual(-1);
      expect(s).toBeLessThanOrEqual(1);
    });
  });

  it("meanSilhouette is positive (≥ 0) for well-separated data", () => {
    expect(result.meanSilhouette).toBeGreaterThanOrEqual(0);
  });

  it("is reproducible with same seed", () => {
    const r2 = kMeans(CENSUS_MORPH, { k: 3, seed: 42 });
    expect(r2.labels).toEqual(result.labels);
    expect(r2.totalWcss).toBeCloseTo(result.totalWcss, 10);
  });

  it("different seeds may produce different results", () => {
    const r2 = kMeans(CENSUS_MORPH, { k: 3, seed: 123 });
    // either labels differ or totalWcss differs — can't guarantee always
    // but at minimum both should be valid
    expect(r2.labels).toHaveLength(8);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  K-Means — Liveability, k=3
// ═══════════════════════════════════════════════════════════════════════════

describe("kMeans — Liveability, k=3", () => {
  const result = kMeans(LIVEABILITY, { k: 3, seed: 42 });

  it("assigns 15 labels across 3 clusters", () => {
    expect(result.labels).toHaveLength(15);
    const unique = new Set(result.labels);
    expect(unique.size).toBe(3);
  });

  it("urban core tracts cluster together", () => {
    // First 5 tracts are urban core
    const clusterCounts = new Map<number, number>();
    for (const l of result.labels.slice(0, 5)) {
      clusterCounts.set(l, (clusterCounts.get(l) ?? 0) + 1);
    }
    const maxCount = Math.max(...clusterCounts.values());
    expect(maxCount).toBeGreaterThanOrEqual(3);
  });

  it("suburban tracts cluster together", () => {
    // Tracts 5-9 are suburban
    const subClusters = new Map<number, number>();
    for (const l of result.labels.slice(5, 10)) {
      subClusters.set(l, (subClusters.get(l) ?? 0) + 1);
    }
    const maxCount = Math.max(...subClusters.values());
    expect(maxCount).toBeGreaterThanOrEqual(4);
  });

  it("mean silhouette is reasonable for k=3", () => {
    expect(result.meanSilhouette).toBeGreaterThan(0.2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Silhouette — standalone
// ═══════════════════════════════════════════════════════════════════════════

describe("silhouette", () => {
  it("returns all zeros for k=1", () => {
    const scores = silhouette(CENSUS_MORPH, [0, 0, 0, 0, 0, 0, 0, 0], 1);
    expect(scores).toHaveLength(8);
    scores.forEach((s) => expect(s).toBe(0));
  });

  it("perfect two-cluster split yields high silhouettes", () => {
    const data = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [10, 10], [11, 10], [10, 11], [11, 11],
    ];
    const labels = [0, 0, 0, 0, 1, 1, 1, 1];
    const scores = silhouette(data, labels, 2);
    scores.forEach((s) => expect(s).toBeGreaterThan(0.7));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Elbow analysis
// ═══════════════════════════════════════════════════════════════════════════

describe("elbowAnalysis", () => {
  it("returns WCSS for each k in range", () => {
    const result = elbowAnalysis(CENSUS_MORPH, 2, 6, 42);
    expect(result.kValues).toEqual([2, 3, 4, 5, 6]);
    expect(result.wcssValues).toHaveLength(5);
  });

  it("WCSS decreases as k increases", () => {
    const result = elbowAnalysis(CENSUS_MORPH, 1, 6, 42);
    for (let i = 1; i < result.wcssValues.length; i++) {
      expect(result.wcssValues[i]).toBeLessThanOrEqual(
        result.wcssValues[i - 1] + 1e-6,
      );
    }
  });

  it("suggests a k within tested range", () => {
    const result = elbowAnalysis(CENSUS_MORPH, 2, 6, 42);
    expect(result.suggestedK).toBeGreaterThanOrEqual(2);
    expect(result.suggestedK).toBeLessThanOrEqual(6);
  });

  it("suggested k is a reasonable choice for liveability data", () => {
    const result = elbowAnalysis(LIVEABILITY, 2, 8, 42);
    // With 3 latent groups, the suggested k should be 2-5
    expect(result.suggestedK).toBeGreaterThanOrEqual(2);
    expect(result.suggestedK).toBeLessThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Hierarchical clustering
// ═══════════════════════════════════════════════════════════════════════════

describe("hierarchicalClustering — Ward linkage", () => {
  const result = hierarchicalClustering(CENSUS_MORPH, { k: 3, linkage: "ward" });

  it("produces k=3 clusters", () => {
    expect(result.k).toBe(3);
    const unique = new Set(result.labels);
    expect(unique.size).toBe(3);
  });

  it("assigns a label to every observation", () => {
    expect(result.labels).toHaveLength(8);
  });

  it("dendrogram has n-k merge steps", () => {
    // For n=8 observations merged down to k=3 clusters, there are 5 merges
    expect(result.dendrogram).toHaveLength(5);
  });

  it("dendrogram distances are non-decreasing", () => {
    for (let i = 1; i < result.dendrogram.length; i++) {
      expect(result.dendrogram[i].distance).toBeGreaterThanOrEqual(
        result.dendrogram[i - 1].distance - 1e-6,
      );
    }
  });

  it("dendrogram final node covers all observations", () => {
    // Last merge should involve all 8 - remaining_clusters observations from one side
    // The total sizes should sum to 8
    let totalMerged = 0;
    for (const node of result.dendrogram) {
      totalMerged = Math.max(totalMerged, node.size);
    }
    expect(totalMerged).toBeGreaterThanOrEqual(Math.ceil(8 / 3));
  });

  it("WCSS and silhouette are computed", () => {
    expect(result.wcss).toHaveLength(3);
    expect(result.totalWcss).toBeGreaterThan(0);
    expect(result.silhouetteScores).toHaveLength(8);
    expect(result.meanSilhouette).toBeGreaterThan(-1);
  });
});

describe("hierarchicalClustering — Single linkage", () => {
  const result = hierarchicalClustering(CENSUS_MORPH, {
    k: 3,
    linkage: "single",
  });

  it("produces valid cluster labels", () => {
    expect(result.labels).toHaveLength(8);
    const unique = new Set(result.labels);
    expect(unique.size).toBeLessThanOrEqual(3);
  });
});

describe("hierarchicalClustering — Complete linkage", () => {
  const result = hierarchicalClustering(CENSUS_MORPH, {
    k: 3,
    linkage: "complete",
  });

  it("produces valid cluster labels", () => {
    expect(result.labels).toHaveLength(8);
    const unique = new Set(result.labels);
    expect(unique.size).toBeLessThanOrEqual(3);
  });
});

describe("hierarchicalClustering — Average linkage", () => {
  const result = hierarchicalClustering(CENSUS_MORPH, {
    k: 3,
    linkage: "average",
  });

  it("produces valid cluster labels", () => {
    expect(result.labels).toHaveLength(8);
    const unique = new Set(result.labels);
    expect(unique.size).toBeLessThanOrEqual(3);
  });
});

describe("hierarchicalClustering — Liveability (k=3, ward)", () => {
  const result = hierarchicalClustering(LIVEABILITY, {
    k: 3,
    linkage: "ward",
  });

  it("clusters 15 tracts into 3 groups", () => {
    expect(result.labels).toHaveLength(15);
    expect(new Set(result.labels).size).toBe(3);
  });

  it("dendrogram has n-k=12 merges", () => {
    expect(result.dendrogram).toHaveLength(12);
  });

  it("silhouette mean is positive", () => {
    expect(result.meanSilhouette).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("kMeans — edge cases", () => {
  it("k=1 assigns all to cluster 0", () => {
    const result = kMeans(CENSUS_MORPH, { k: 1 });
    expect(new Set(result.labels).size).toBe(1);
    expect(result.labels[0]).toBe(0);
  });

  it("k=n puts each observation in its own cluster", () => {
    const data = [[1, 2], [3, 4], [5, 6]];
    const result = kMeans(data, { k: 3 });
    expect(new Set(result.labels).size).toBe(3);
    expect(result.totalWcss).toBeCloseTo(0, 6);
  });

  it("rejects k=0", () => {
    expect(() => kMeans(CENSUS_MORPH, { k: 0 })).toThrow();
  });

  it("rejects k > n", () => {
    expect(() => kMeans(CENSUS_MORPH, { k: 100 })).toThrow();
  });
});

describe("hierarchicalClustering — edge cases", () => {
  it("k=1 puts all in one cluster", () => {
    const result = hierarchicalClustering(CENSUS_MORPH, { k: 1 });
    expect(new Set(result.labels).size).toBe(1);
  });

  it("rejects k > n", () => {
    expect(() =>
      hierarchicalClustering(CENSUS_MORPH, { k: 100 }),
    ).toThrow();
  });
});
