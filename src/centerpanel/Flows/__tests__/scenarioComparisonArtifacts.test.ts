import {
  buildScenarioComparisonResult,
  DEFAULT_SCENARIO_COMPARISON_FORM,
} from "@/centerpanel/Flows/scenarioComparisonShared";
import {
  buildScenarioChartDataExport,
  buildScenarioComparisonCompletedRun,
  buildScenarioDeltaCsv,
  buildScenarioDeltaLayer,
  buildScenarioParallelSeries,
  buildScenarioRadarSeries,
  slugifyScenarioComparisonOutput,
} from "@/centerpanel/Flows/scenarioComparisonArtifacts";

describe("scenarioComparisonArtifacts", () => {
  const form = {
    ...DEFAULT_SCENARIO_COMPARISON_FORM,
    outputTitle: "Scenario Comparison Dashboard / April 2026",
  };
  const result = buildScenarioComparisonResult(form);
  const scenarioId = result.scenarios[0]!.scenarioId;
  const metricId = result.metricDefinitions[0]!.id;

  it("builds radar and parallel series with baseline plus every scenario", () => {
    const radarSeries = buildScenarioRadarSeries(result);
    const parallelSeries = buildScenarioParallelSeries(result);

    expect(radarSeries).toHaveLength(result.scenarios.length + 1);
    expect(parallelSeries).toHaveLength(result.scenarios.length + 1);
    expect(radarSeries[0]).toMatchObject({
      id: "baseline",
      label: result.baselineName,
    });
    expect(parallelSeries[1]?.values).toHaveLength(result.metricDefinitions.length);
  });

  it("builds delta exports and map layers for the selected scenario and metric", () => {
    const csv = buildScenarioDeltaCsv(result, scenarioId, metricId);
    const layer = buildScenarioDeltaLayer(result, scenarioId, metricId, "absolute", {
      updatedAt: "2026-04-12T00:00:00.000Z",
    });

    expect(csv).toContain("unit_id,unit_label,baseline_value,scenario_value,absolute_delta,percent_delta,improvement_delta");
    expect(layer.name).toContain(result.scenarios[0]!.name);
    expect(layer.metadata).toMatchObject({
      featureCount: result.scenarios[0]!.units.length,
      updatedAt: "2026-04-12T00:00:00.000Z",
    });
    expect((layer.sourceData as GeoJSON.FeatureCollection).features[0]?.properties).toMatchObject({
      metric_id: metricId,
      scenario_id: scenarioId,
    });
  });

  it("packages chart, map, and trade-off outputs for completed-run review", () => {
    const completedRun = buildScenarioComparisonCompletedRun(form, result, {
      runId: "scenario-comparison-run-1",
      insertedAt: "2026-04-12T00:00:00.000Z",
    });
    const chartData = buildScenarioChartDataExport(result);

    expect(completedRun.runId).toBe("scenario-comparison-run-1");
    expect(completedRun.flowId).toBe("scenario_comparison");
    expect(completedRun.mapOutputs).toHaveLength(1);
    expect(completedRun.chartOutputs).toHaveLength(2);
    expect(completedRun.dataOutputs[0]?.rows).toBe(result.tradeOffMatrix.length);
    expect(completedRun.chartOutputs[0]?.data).toEqual(chartData.radarSeries);
    expect(completedRun.paragraphPreview).toContain("Scenario Comparison Dashboard");
    expect(completedRun.mapOutputs[0]?.scenarioComparison?.comparison.comparisonId).toBe(
      "scenario-comparison-run-1-comparison",
    );
    expect(completedRun.mapOutputs[0]?.scenarioComparison?.outputRole).toBe("map_delta");
    expect(completedRun.chartOutputs[0]?.scenarioComparison?.outputRole).toBe("chart_radar");
    expect(completedRun.chartOutputs[1]?.scenarioComparison?.outputRole).toBe("chart_parallel");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.outputRole).toBe("data_tradeoff_matrix");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.comparison.policyInterpretation.mode).toBe("guidance");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.comparison.limitations.length).toBeGreaterThan(0);
  });

  it("slugifies output labels safely for exported files", () => {
    expect(slugifyScenarioComparisonOutput("Scenario Comparison Dashboard / April 2026")).toBe(
      "scenario-comparison-dashboard-april-2026",
    );
    expect(slugifyScenarioComparisonOutput("***")).toBe("scenario-comparison");
  });
});