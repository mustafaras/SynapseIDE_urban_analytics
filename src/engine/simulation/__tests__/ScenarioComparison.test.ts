import {
  buildScenarioDeltaFeatureCollection,
  runScenarioComparison,
} from "@/engine/simulation/ScenarioComparison";
import {
  SCENARIO_DEMO_BASELINE_NAME,
  SCENARIO_DEMO_BASELINE_UNITS,
  SCENARIO_DEMO_SCENARIOS,
  SCENARIO_DEMO_SELECTED_METRICS,
} from "@/centerpanel/Flows/scenarioComparisonDemo";

describe("ScenarioComparison", () => {
  it("computes aligned scenario results and at least one Pareto candidate", () => {
    const result = runScenarioComparison({
      baselineName: SCENARIO_DEMO_BASELINE_NAME,
      units: SCENARIO_DEMO_BASELINE_UNITS,
      scenarios: SCENARIO_DEMO_SCENARIOS,
      selectedMetricIds: SCENARIO_DEMO_SELECTED_METRICS,
    });

    expect(result.scenarios).toHaveLength(2);
    expect(result.metricDefinitions).toHaveLength(SCENARIO_DEMO_SELECTED_METRICS.length);
    expect(result.paretoScenarioIds.length).toBeGreaterThanOrEqual(1);
    expect(result.scenarios.every((scenario) => scenario.metrics.every((metric) => metric.normalizedScenario >= 0 && metric.normalizedScenario <= 100))).toBe(true);
  });

  it("shows that the green resilience scenario improves green network and flood risk", () => {
    const result = runScenarioComparison({
      baselineName: SCENARIO_DEMO_BASELINE_NAME,
      units: SCENARIO_DEMO_BASELINE_UNITS,
      scenarios: SCENARIO_DEMO_SCENARIOS,
      selectedMetricIds: SCENARIO_DEMO_SELECTED_METRICS,
    });

    const greenScenario = result.scenarios.find((scenario) => scenario.name === "Green Resilience Retrofit");
    expect(greenScenario).toBeDefined();
    expect(greenScenario?.metrics.find((metric) => metric.metricId === "green_network")?.improvementDelta).toBeGreaterThan(0);
    expect(greenScenario?.metrics.find((metric) => metric.metricId === "flood_risk")?.improvementDelta).toBeGreaterThan(0);
  });

  it("builds a delta feature collection with display-ready fields", () => {
    const result = runScenarioComparison({
      baselineName: SCENARIO_DEMO_BASELINE_NAME,
      units: SCENARIO_DEMO_BASELINE_UNITS,
      scenarios: SCENARIO_DEMO_SCENARIOS,
      selectedMetricIds: SCENARIO_DEMO_SELECTED_METRICS,
    });

    const collection = buildScenarioDeltaFeatureCollection(
      result,
      result.scenarios[0]!.scenarioId,
      result.metricDefinitions[0]!.id,
      "absolute",
    );

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(SCENARIO_DEMO_BASELINE_UNITS.length);
    expect(collection.features[0]?.properties).toMatchObject({
      metric_id: result.metricDefinitions[0]!.id,
      scenario_id: result.scenarios[0]!.scenarioId,
    });
  });
});