import { describe, expect, it } from "vitest";
import { runCompositeIndicatorAnalysis } from "../CompositeIndicator";
import { buildCompositeIndicatorDemoDataset } from "@/centerpanel/Flows/compositeIndicatorDemo";

describe("CompositeIndicator", () => {
  it("runs the full seven-stage style workflow and returns scores, bands, and exports", () => {
    const dataset = buildCompositeIndicatorDemoDataset();
    const result = runCompositeIndicatorAnalysis(dataset, {
      scenarioName: "Teaching baseline",
      selectedIndicatorIds: [
        "transit_access",
        "green_space",
        "pm25",
        "housing_burden",
        "health_access",
      ],
      imputation: { method: "mean" },
      normalization: { method: "min_max" },
      weighting: { method: "equal" },
      aggregation: { method: "additive" },
      sensitivity: {
        runs: 120,
        weightPerturbation: 0.12,
        indicatorNoise: 0.03,
        confidenceLevel: 0.9,
        topK: 3,
        randomSeed: 20260412,
      },
    });

    expect(result.units).toHaveLength(dataset.units.length);
    expect(result.featureCollection.features).toHaveLength(dataset.units.length);
    expect(result.weights).toHaveLength(5);
    expect(
      result.weights.reduce((total, weight) => total + weight.weight, 0),
    ).toBeCloseTo(1, 6);
    expect(result.configurationPackage.selectedIndicatorIds).toHaveLength(5);
    expect(result.sensitivity.runs).toBe(120);
    expect(result.sensitivity.topKStability).toBeGreaterThanOrEqual(0);
    expect(result.sensitivity.topKStability).toBeLessThanOrEqual(1);
    expect(result.units[0]?.confidenceBand.lower).toBeLessThanOrEqual(
      result.units[0]?.confidenceBand.upper ?? 0,
    );
  });

  it("supports distance-to-reference normalisation with budget allocation and geometric aggregation", () => {
    const dataset = buildCompositeIndicatorDemoDataset();
    const result = runCompositeIndicatorAnalysis(dataset, {
      scenarioName: "Reference-weighted scenario",
      selectedIndicatorIds: [
        "transit_access",
        "pm25",
        "employment_access",
      ],
      imputation: { method: "median" },
      normalization: {
        method: "distance_to_reference",
        referenceValues: {
          transit_access: 82,
          pm25: 12,
          employment_access: 70000,
        },
      },
      weighting: {
        method: "budget_allocation",
        budgetAllocation: {
          transit_access: 45,
          pm25: 35,
          employment_access: 20,
        },
      },
      aggregation: {
        method: "geometric",
        geometricFloor: 0.001,
      },
      sensitivity: {
        runs: 80,
        weightPerturbation: 0.08,
        indicatorNoise: 0.02,
        confidenceLevel: 0.9,
        topK: 2,
        randomSeed: 7,
      },
    });

    expect(result.normalizationMethod).toBe("distance_to_reference");
    expect(result.aggregationMethod).toBe("geometric");
    expect(result.configurationPackage.normalization.referenceValues).toEqual({
      transit_access: 82,
      pm25: 12,
      employment_access: 70000,
    });
    expect(result.weights[0]?.weight).toBeGreaterThan(result.weights[2]?.weight ?? 0);
    expect(result.notes.join(" ")).toContain("Geometric aggregation");
  });

  it("derives method-based weights and diagnostics for PCA and AHP options", () => {
    const dataset = buildCompositeIndicatorDemoDataset();

    const pcaResult = runCompositeIndicatorAnalysis(dataset, {
      scenarioName: "PCA weighted",
      selectedIndicatorIds: [
        "transit_access",
        "green_space",
        "pm25",
        "health_access",
      ],
      imputation: { method: "mean" },
      normalization: { method: "z_score" },
      weighting: { method: "pca_derived" },
      aggregation: { method: "additive" },
      sensitivity: {
        runs: 60,
        weightPerturbation: 0.1,
        indicatorNoise: 0.03,
        confidenceLevel: 0.9,
        topK: 3,
      },
    });

    expect(pcaResult.pcaDiagnostics?.loadings).toHaveLength(4);
    expect(pcaResult.pcaDiagnostics?.explainedVariance ?? 0).toBeGreaterThan(0);

    const ahpResult = runCompositeIndicatorAnalysis(dataset, {
      scenarioName: "AHP weighted",
      selectedIndicatorIds: [
        "transit_access",
        "green_space",
        "pm25",
      ],
      imputation: { method: "mean" },
      normalization: { method: "percentile" },
      weighting: {
        method: "ahp",
        ahpMatrix: [
          [1, 3, 5],
          [1 / 3, 1, 2],
          [1 / 5, 1 / 2, 1],
        ],
      },
      aggregation: { method: "additive" },
      sensitivity: {
        runs: 60,
        weightPerturbation: 0.08,
        indicatorNoise: 0.02,
        confidenceLevel: 0.9,
        topK: 2,
      },
    });

    expect(ahpResult.ahpDiagnostics?.consistencyRatio ?? 1).toBeLessThan(0.2);
    expect(ahpResult.weights[0]?.weight).toBeGreaterThan(ahpResult.weights[2]?.weight ?? 0);
    expect(ahpResult.notes.join(" ")).toContain("AHP");
  });
});
