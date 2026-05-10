import { describe, expect, it } from "vitest";
import {
  calibrateCellularAutomata,
  type CellularAutomataCalibrationSummary,
  type CellularAutomataConstraints,
  type CellularAutomataState,
  type CellularAutomataSurface,
  runCellularAutomataScenario,
  simulateCellularAutomata,
  validateCellularAutomataPrediction,
} from "../CellularAutomata";
import { buildCellularAutomataDemoDataset } from "@/centerpanel/Flows/cellularAutomataDemo";

function makeSurface(values: number[], label: string): CellularAutomataSurface {
  return {
    width: 3,
    height: 3,
    label,
    values,
  };
}

function makeState(
  step: number,
  label: string,
  values: number[],
  width = 3,
  height = 3,
): CellularAutomataState {
  return {
    width,
    height,
    step,
    label,
    values,
  };
}

describe("CellularAutomata", () => {
  it("calibrates, simulates, and validates on the demo urban-growth dataset", () => {
    const dataset = buildCellularAutomataDemoDataset();

    const calibration = calibrateCellularAutomata({
      historicalStates: dataset.historicalStates,
      suitabilitySurface: dataset.suitabilitySurface,
      constraints: dataset.constraints,
      maxSlope: 0.68,
    });

    expect(calibration.transitionSampleSize).toBeGreaterThan(0);
    expect(calibration.stableSampleSize).toBeGreaterThan(0);
    expect(
      calibration.suitabilityWeight +
        calibration.neighborhoodWeight +
        calibration.structureWeight,
    ).toBeCloseTo(1, 3);

    const result = runCellularAutomataScenario({
      historicalStates: dataset.historicalStates,
      suitabilitySurface: dataset.suitabilitySurface,
      constraints: dataset.constraints,
      observedState: dataset.observedState,
      steps: 4,
      growthMultiplier: 1,
      stochasticPerturbation: 0.18,
      maxSlope: 0.68,
      seed: 20260412,
      scenarioName: "Demo scenario",
    });

    expect(result.frames).toHaveLength(5);
    expect(result.predictedStates).toHaveLength(5);
    expect(result.stepSummaries).toHaveLength(5);
    expect(result.valueField).toBe("urban_state");
    expect(result.validation).toBeDefined();
    expect(result.validation?.figureOfMerit).toBeGreaterThanOrEqual(0);
    expect(result.validation?.figureOfMerit).toBeLessThanOrEqual(1);
    expect(result.validation?.kappa).toBeGreaterThanOrEqual(-1);
    expect(result.validation?.kappa).toBeLessThanOrEqual(1);
    expect(result.constraintSummary.protectedCells).toBeGreaterThan(0);
    expect(result.constraintSummary.waterCells).toBeGreaterThan(0);
    expect(result.simplifications.length).toBeGreaterThan(0);

    const initialUrbanCells =
      result.stepSummaries[0]?.totalUrbanCells ?? 0;
    const finalUrbanCells =
      result.stepSummaries[result.stepSummaries.length - 1]?.totalUrbanCells ?? 0;
    expect(finalUrbanCells).toBeGreaterThan(initialUrbanCells);
  });

  it("keeps explicitly constrained cells non-urban during simulation", () => {
    const suitability = makeSurface(
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      "Suitability",
    );
    const constraints: CellularAutomataConstraints = {
      protectedAreas: makeSurface([1, 0, 0, 0, 0, 0, 0, 0, 0], "Protected"),
      water: makeSurface([0, 1, 0, 0, 0, 0, 0, 0, 0], "Water"),
      slope: makeSurface([0, 0, 0.95, 0, 0, 0, 0, 0, 0], "Slope"),
      existingUrbanStructure: makeSurface(
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        "Structure",
      ),
    };
    const calibration: CellularAutomataCalibrationSummary = {
      neighborhoodRadius: 1,
      urbanThreshold: 0.5,
      maxSlope: 0.7,
      growthRate: 0.7,
      meanNewUrbanCells: 6,
      spontaneousGrowthShare: 0,
      suitabilityWeight: 0.4,
      neighborhoodWeight: 0.4,
      structureWeight: 0.2,
      slopePenalty: 0.2,
      neighborhoodThreshold: 0,
      structureThreshold: 0,
      minTransitionScore: 0,
      transitionSampleSize: 4,
      stableSampleSize: 4,
    };

    const result = simulateCellularAutomata({
      calibration,
      suitabilitySurface: suitability,
      constraints,
      initialState: makeState(
        2020,
        "Initial",
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
      ),
      steps: 1,
      stochasticPerturbation: 0,
      growthMultiplier: 1,
      maxSlope: 0.7,
      seed: 7,
      scenarioName: "Constraint check",
    });

    const finalState = result.predictedStates[result.predictedStates.length - 1];
    expect(finalState?.values[0]).toBe(0);
    expect(finalState?.values[1]).toBe(0);
    expect(finalState?.values[2]).toBe(0);
    expect(result.constraintSummary.protectedCells).toBe(1);
    expect(result.constraintSummary.waterCells).toBe(1);
    expect(result.constraintSummary.steepSlopeCells).toBe(1);
  });

  it("computes figure-of-merit and kappa-style metrics from predicted and observed states", () => {
    const baseline = makeState(2008, "Baseline", [0, 0, 0, 0], 2, 2);
    const predicted = makeState(2014, "Predicted", [1, 1, 0, 0], 2, 2);
    const observed = makeState(2014, "Observed", [1, 0, 1, 0], 2, 2);

    const validation = validateCellularAutomataPrediction(
      baseline,
      predicted,
      observed,
      0.5,
    );

    expect(validation.figureOfMerit).toBeCloseTo(1 / 3, 4);
    expect(validation.overallAccuracy).toBe(0.5);
    expect(validation.kappa).toBe(0);
    expect(validation.kappaChange).toBe(0);
    expect(validation.fitQuality).toBe("weak");
    expect(validation.confusion.urban).toEqual({
      truePositive: 1,
      falsePositive: 1,
      falseNegative: 1,
      trueNegative: 1,
    });
    expect(validation.confusion.change).toEqual({
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 1,
    });
  });
});
