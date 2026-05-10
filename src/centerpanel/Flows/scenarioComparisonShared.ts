import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import {
  buildScenarioComparisonNarrative,
  runScenarioComparison,
  type ScenarioAlternativeDefinition,
  type ScenarioComparisonResult,
  type ScenarioMetricId,
  type ScenarioParameters,
} from "@/engine/simulation";
import {
  buildScenarioParametersFromSeed,
  SCENARIO_DEMO_BASELINE_DESCRIPTION,
  SCENARIO_DEMO_BASELINE_NAME,
  SCENARIO_DEMO_BASELINE_UNITS,
  SCENARIO_DEMO_SCENARIOS,
  SCENARIO_DEMO_SELECTED_METRICS,
} from "./scenarioComparisonDemo";

export interface ScenarioFormScenario extends ScenarioAlternativeDefinition {
  sourceRunId?: string;
  sourceFlowId?: string;
}

export interface ScenarioComparisonForm {
  baselineName: string;
  baselineDescription: string;
  scenarios: ScenarioFormScenario[];
  selectedMetricIds: ScenarioMetricId[];
  activeScenarioId: string;
  activeMetricId: ScenarioMetricId;
  deltaMode: "absolute" | "percent";
  tradeoffNotes: string;
  outputTitle: string;
}

export const SCENARIO_COMPARISON_FORM_KEY = "scenario_comparison_form";
export const SCENARIO_COMPARISON_RESULT_KEY = "scenario_comparison_result";

export const DEFAULT_SCENARIO_COMPARISON_FORM: ScenarioComparisonForm = {
  baselineName: SCENARIO_DEMO_BASELINE_NAME,
  baselineDescription: SCENARIO_DEMO_BASELINE_DESCRIPTION,
  scenarios: SCENARIO_DEMO_SCENARIOS.map((scenario) => ({ ...scenario })),
  selectedMetricIds: [...SCENARIO_DEMO_SELECTED_METRICS],
  activeScenarioId: SCENARIO_DEMO_SCENARIOS[0]!.id,
  activeMetricId: SCENARIO_DEMO_SELECTED_METRICS[0]!,
  deltaMode: "absolute",
  tradeoffNotes: "",
  outputTitle: "Scenario Comparison Dashboard",
};

export function buildImportedScenarioFromRun(run: CompletedAnalysisRun): ScenarioFormScenario {
  return {
    id: `imported-${run.runId}`,
    name: run.label,
    description: run.paragraphPreview || run.paragraph,
    assumptions: "Imported from a completed urban growth cellular automata run and seeded with scenario parameters for dashboard comparison.",
    parameters: buildScenarioParametersFromSeed(run.runId),
    sourceRunId: run.runId,
    sourceFlowId: run.flowId,
  };
}

export function createEmptyScenario(id: string): ScenarioFormScenario {
  return {
    id,
    name: "New Scenario",
    description: "",
    assumptions: "",
    parameters: buildScenarioParametersFromSeed(id),
  };
}

export function buildScenarioComparisonResult(
  form: ScenarioComparisonForm,
): ScenarioComparisonResult {
  return runScenarioComparison({
    baselineName: form.baselineName,
    units: SCENARIO_DEMO_BASELINE_UNITS,
    scenarios: form.scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      assumptions: scenario.assumptions,
      parameters: scenario.parameters,
    })),
    selectedMetricIds: form.selectedMetricIds,
  });
}

export function buildScenarioComparisonSummaryText(
  form: ScenarioComparisonForm,
  result?: ScenarioComparisonResult | null,
): string {
  const baselineLine = `Baseline: ${form.baselineName}`;
  const scenarioLine = `Alternatives: ${form.scenarios.length} (${form.scenarios.map((scenario) => scenario.name).join(", ")})`;
  const metricsLine = `Metrics: ${form.selectedMetricIds.length}`;
  const outputLine = `Output: ${form.outputTitle || "Untitled"}`;

  if (!result) {
    return ["Scenario Comparison Dashboard", baselineLine, scenarioLine, metricsLine, outputLine].join("\n");
  }

  const leader = [...result.scenarios].sort((left, right) => right.compositeScore - left.compositeScore)[0];
  const pareto = result.scenarios.filter((scenario) => scenario.paretoCandidate).map((scenario) => scenario.name);

  return [
    "Scenario Comparison Dashboard",
    baselineLine,
    scenarioLine,
    metricsLine,
    outputLine,
    leader ? `Lead scenario: ${leader.name} (${leader.compositeScore.toFixed(1)}/100)` : "Lead scenario: n/a",
    pareto.length > 0 ? `Pareto candidates: ${pareto.join(", ")}` : "Pareto candidates: none",
  ].join("\n");
}

export function buildScenarioComparisonNarrativeText(
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
): string {
  const notes = form.tradeoffNotes.trim();
  const baseNarrative = buildScenarioComparisonNarrative(result);
  return notes.length > 0 ? `${baseNarrative} Analyst note: ${notes}` : baseNarrative;
}

export type { ScenarioComparisonResult, ScenarioMetricId, ScenarioParameters };