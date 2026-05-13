import {
  buildScenarioComparisonResult,
  DEFAULT_SCENARIO_COMPARISON_FORM,
} from "@/centerpanel/Flows/scenarioComparisonShared";
import {
  buildScenarioChartDataExport,
  buildScenarioComparisonCompletedRun,
  buildScenarioComparisonMapEvidenceArtifact,
  buildScenarioDeltaCsv,
  buildScenarioDeltaLayer,
  buildMapScenarioComparisonEvidenceMetadata,
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
    const scenarioComparison = buildMapScenarioComparisonEvidenceMetadata(form, result, {
      comparisonId: "scenario-comparison-layer-1",
      createdAt: "2026-04-12T00:00:00.000Z",
      activeScenarioId: scenarioId,
      activeMetricId: metricId,
      outputLayerIds: ["scenario-layer-1"],
    });
    const csv = buildScenarioDeltaCsv(result, scenarioId, metricId);
    const layer = buildScenarioDeltaLayer(result, scenarioId, metricId, "absolute", {
      layerId: "scenario-layer-1",
      updatedAt: "2026-04-12T00:00:00.000Z",
      evidenceArtifactId: "map-evidence-scenario-layer-1",
      scenarioComparison,
    });

    expect(csv).toContain("unit_id,unit_label,baseline_value,scenario_value,absolute_delta,percent_delta,improvement_delta");
    expect(layer.name).toContain(result.scenarios[0]!.name);
    expect(layer.metadata).toMatchObject({
      featureCount: result.scenarios[0]!.units.length,
      updatedAt: "2026-04-12T00:00:00.000Z",
      evidenceArtifactId: "map-evidence-scenario-layer-1",
    });
    expect(layer.metadata?.scenarioComparison).toMatchObject({
      comparisonId: "scenario-comparison-layer-1",
      activeScenarioId: scenarioId,
      outputLayerIds: ["scenario-layer-1"],
      policyInterpretationMode: "guidance",
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
    expect(completedRun.mapOutputs[0]?.metadata?.mapEvidenceArtifactId).toBe(
      "map-evidence-scenario-scenario-comparison-run-1-comparison",
    );
    expect(completedRun.mapOutputs[0]?.metadata?.reportHandoffId).toBe(
      "map-report-handoff-scenario-comparison-run-1-comparison",
    );
    expect(completedRun.chartOutputs[0]?.metadata?.dashboardBindingId).toBe(
      "map-dashboard-binding-scenario-comparison-run-1-comparison",
    );
    expect(completedRun.mapOutputs[0]?.scenarioComparison?.comparison.comparisonId).toBe(
      "scenario-comparison-run-1-comparison",
    );
    expect(completedRun.mapOutputs[0]?.scenarioComparison?.comparison.evidence.artifactIds).toContain(
      "map-evidence-scenario-scenario-comparison-run-1-comparison",
    );
    expect(completedRun.mapOutputs[0]?.scenarioComparison?.outputRole).toBe("map_delta");
    expect(completedRun.chartOutputs[0]?.scenarioComparison?.outputRole).toBe("chart_radar");
    expect(completedRun.chartOutputs[1]?.scenarioComparison?.outputRole).toBe("chart_parallel");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.outputRole).toBe("data_tradeoff_matrix");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.comparison.policyInterpretation.mode).toBe("guidance");
    expect(completedRun.dataOutputs[0]?.scenarioComparison?.comparison.limitations.length).toBeGreaterThan(0);
  });

  it("builds scenario comparison map evidence without copying GeoJSON payloads", () => {
    const artifact = buildScenarioComparisonMapEvidenceArtifact(form, result, {
      runId: "scenario-comparison-run-1",
      comparisonId: "scenario-comparison-run-1-comparison",
      createdAt: "2026-04-12T00:00:00.000Z",
      activeScenarioId: scenarioId,
      activeMetricId: metricId,
      outputLayerIds: ["scenario-comparison-run-1-delta-layer"],
      mapOutputIds: ["scenario-comparison-run-1-delta"],
      chartOutputIds: ["scenario-comparison-run-1-radar"],
      dataOutputIds: ["scenario-comparison-run-1-tradeoff-matrix"],
    });

    expect(artifact).toMatchObject({
      id: "map-evidence-scenario-scenario-comparison-run-1-comparison",
      kind: "scenario-comparison",
      linkedRunId: "scenario-comparison-run-1",
      linkedWorkflowId: "scenario_comparison",
      dashboardBindingId: "map-dashboard-binding-scenario-comparison-run-1-comparison",
    });
    expect(artifact.scenarioComparison).toMatchObject({
      comparisonId: "scenario-comparison-run-1-comparison",
      activeScenarioId: scenarioId,
      comparisonMetric: { indicatorId: metricId },
      handoff: {
        reportHandoffId: "map-report-handoff-scenario-comparison-run-1-comparison",
        dashboardBindingId: "map-dashboard-binding-scenario-comparison-run-1-comparison",
        refreshMode: "static",
      },
    });
    expect(artifact.metadata?.candidateCount).toBe(result.scenarios.length);
    expect(artifact.qa.state).toBe("warning");
    expect(JSON.stringify(artifact)).not.toContain("coordinates");
  });

  it("slugifies output labels safely for exported files", () => {
    expect(slugifyScenarioComparisonOutput("Scenario Comparison Dashboard / April 2026")).toBe(
      "scenario-comparison-dashboard-april-2026",
    );
    expect(slugifyScenarioComparisonOutput("***")).toBe("scenario-comparison");
  });
});
