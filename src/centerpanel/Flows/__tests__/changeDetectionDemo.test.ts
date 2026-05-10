import { describe, expect, it } from "vitest";
import { buildChangeDetectionScenario } from "../changeDetectionDemo";

describe("buildChangeDetectionScenario", () => {
  it("returns deterministic validation arrays for the same configuration", () => {
    const first = buildChangeDetectionScenario({
      t0Source: "Sentinel-2",
      t0Date: "2019-06",
      t1Source: "Sentinel-2",
      t1Date: "2024-06",
      method: "post_classification",
      changeThreshold: 12,
      classLabels: ["Built-up", "Vegetation", "Water", "Bare Soil"],
      validationSampleSize: 250,
    });

    const second = buildChangeDetectionScenario({
      t0Source: "Sentinel-2",
      t0Date: "2019-06",
      t1Source: "Sentinel-2",
      t1Date: "2024-06",
      method: "post_classification",
      changeThreshold: 12,
      classLabels: ["Built-up", "Vegetation", "Water", "Bare Soil"],
      validationSampleSize: 250,
    });

    expect(Array.from(first.validation.truth)).toEqual(Array.from(second.validation.truth));
    expect(Array.from(first.validation.prediction)).toEqual(Array.from(second.validation.prediction));
    expect(first.summary.transitionMatrix).toEqual(second.summary.transitionMatrix);
  });

  it("respects the requested validation sample size and creates off-diagonal change", () => {
    const scenario = buildChangeDetectionScenario({
      t0Source: "Landsat",
      t0Date: "2015",
      t1Source: "Landsat",
      t1Date: "2023",
      method: "cva",
      changeThreshold: 8,
      classLabels: ["Built-up", "Vegetation", "Water", "Bare Soil", "Road"],
      validationSampleSize: 400,
    });

    expect(scenario.validation.truth).toHaveLength(400);
    expect(scenario.validation.prediction).toHaveLength(400);
    expect(scenario.summary.changedCellCount).toBeGreaterThan(0);
    expect(scenario.summary.dominantTransitions.length).toBeGreaterThan(0);
  });
});