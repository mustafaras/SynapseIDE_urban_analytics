import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import {
  SCENARIO_LEVERS,
  SCENARIO_METRICS,
  type ScenarioComparisonResult,
  type ScenarioMetricId,
  type ScenarioParameters,
} from "@/engine/simulation";
import {
  buildImportedScenarioFromRun,
  buildScenarioComparisonNarrativeText,
  buildScenarioComparisonResult,
  buildScenarioComparisonSummaryText,
  createEmptyScenario,
  DEFAULT_SCENARIO_COMPARISON_FORM,
  SCENARIO_COMPARISON_FORM_KEY,
  SCENARIO_COMPARISON_RESULT_KEY,
  type ScenarioComparisonForm,
  type ScenarioFormScenario,
} from "./scenarioComparisonShared";
import { SCENARIO_DEMO_BASELINE_UNITS } from "./scenarioComparisonDemo";
import {
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "./flowUtils";
import CrossPanelActions from "./rail/CrossPanelActions";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildScenarioComparisonNarrativeInput } from "./narrativeBuilders";
import {
  buildScenarioChartDataExport,
  buildScenarioComparisonCompletedRun,
  buildScenarioDeltaCsv,
  buildScenarioDeltaLayer,
  slugifyScenarioComparisonOutput,
} from "./scenarioComparisonArtifacts";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";
import { MethodologyInfoButton } from "@/features/education/MethodologyInfoButton";

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === "scenario_comparison")!;
const STEPS = FLOW_DEF.steps;
const ScenarioComparisonDashboard = lazyWithRetry(async () => {
  const module = await import("@/features/dashboard/ScenarioComparisonDashboard");
  return { default: module.ScenarioComparisonDashboard };
});

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

const ScenarioComparisonFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const {
    completedRuns,
    setStepData,
    stepData,
    upsertCompletedRun,
  } = useFlowStore();
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMap = useMapExplorerStore((state) => state.open);

  const [form, setForm] = useState<ScenarioComparisonForm>(() =>
    restoreFormState(stepData, SCENARIO_COMPARISON_FORM_KEY, DEFAULT_SCENARIO_COMPARISON_FORM),
  );
  const [result, setResult] = useState<ScenarioComparisonResult | null>(() => {
    const stored = stepData[SCENARIO_COMPARISON_RESULT_KEY];
    if (stored && typeof stored === "object") {
      return stored as ScenarioComparisonResult;
    }
    return buildScenarioComparisonResult(DEFAULT_SCENARIO_COMPARISON_FORM);
  });
  const [dirtyScenarioIds, setDirtyScenarioIds] = useState<string[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastComputedAt, setLastComputedAt] = useState<string | null>(() => new Date().toISOString());
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  useEffect(() => {
    setStepData(SCENARIO_COMPARISON_FORM_KEY, form);
  }, [form, setStepData]);

  const availableSimulationRuns = useMemo(
    () => completedRuns.filter((run) => run.flowId === "urban_growth_ca"),
    [completedRuns],
  );

  const baselineMetricPreview = useMemo(
    () => SCENARIO_METRICS.map((metric) => ({
      ...metric,
      average: mean(SCENARIO_DEMO_BASELINE_UNITS.map((unit) => unit.baselineMetrics[metric.id])),
    })),
    [],
  );

  const commitForm = useCallback((updater: (previous: ScenarioComparisonForm) => ScenarioComparisonForm) => {
    setForm((previous) => updater(previous));
  }, []);

  const markScenarioDirty = useCallback((scenarioId: string) => {
    setDirtyScenarioIds((previous) => (previous.includes(scenarioId) ? previous : [...previous, scenarioId]));
  }, []);

  const updateForm = useCallback(<K extends keyof ScenarioComparisonForm>(key: K, value: ScenarioComparisonForm[K]) => {
    commitForm((previous) => ({ ...previous, [key]: value }));
  }, [commitForm]);

  const updateScenarioField = useCallback((scenarioId: string, field: keyof Omit<ScenarioFormScenario, "parameters">, value: string) => {
    commitForm((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) =>
        scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario,
      ),
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, markScenarioDirty]);

  const updateScenarioParameter = useCallback((scenarioId: string, parameter: keyof ScenarioParameters, value: number) => {
    commitForm((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) =>
        scenario.id === scenarioId
          ? {
              ...scenario,
              parameters: {
                ...scenario.parameters,
                [parameter]: value,
              },
            }
          : scenario,
      ),
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, markScenarioDirty]);

  const addScenario = useCallback(() => {
    if (form.scenarios.length >= 4) {
      return;
    }
    const scenarioId = `scenario-${Date.now()}`;
    commitForm((previous) => ({
      ...previous,
      scenarios: [...previous.scenarios, createEmptyScenario(scenarioId)],
      activeScenarioId: scenarioId,
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, form.scenarios.length, markScenarioDirty]);

  const removeScenario = useCallback((scenarioId: string) => {
    if (form.scenarios.length <= 2) {
      return;
    }
    commitForm((previous) => {
      const scenarios = previous.scenarios.filter((scenario) => scenario.id !== scenarioId);
      return {
        ...previous,
        scenarios,
        activeScenarioId: previous.activeScenarioId === scenarioId ? scenarios[0]!.id : previous.activeScenarioId,
      };
    });
    setDirtyScenarioIds((previous) => previous.filter((id) => id !== scenarioId));
  }, [commitForm, form.scenarios.length]);

  const toggleMetric = useCallback((metricId: ScenarioMetricId) => {
    commitForm((previous) => {
      const selectedMetricIds = previous.selectedMetricIds.includes(metricId)
        ? previous.selectedMetricIds.filter((id) => id !== metricId)
        : [...previous.selectedMetricIds, metricId];

      return {
        ...previous,
        selectedMetricIds,
        activeMetricId: selectedMetricIds.includes(previous.activeMetricId)
          ? previous.activeMetricId
          : selectedMetricIds[0] ?? previous.activeMetricId,
      };
    });
  }, [commitForm]);

  const importScenarioFromRun = useCallback((runId: string) => {
    const run = availableSimulationRuns.find((candidate) => candidate.runId === runId);
    if (!run) {
      return;
    }

    const importedScenario = buildImportedScenarioFromRun(run);
    commitForm((previous) => {
      const existingIndex = previous.scenarios.findIndex((scenario) => scenario.sourceRunId === run.runId);
      if (existingIndex >= 0) {
        const scenarios = [...previous.scenarios];
        scenarios[existingIndex] = importedScenario;
        return {
          ...previous,
          scenarios,
          activeScenarioId: importedScenario.id,
        };
      }
      if (previous.scenarios.length >= 4) {
        return previous;
      }
      return {
        ...previous,
        scenarios: [...previous.scenarios, importedScenario],
        activeScenarioId: importedScenario.id,
      };
    });
    markScenarioDirty(importedScenario.id);
  }, [availableSimulationRuns, commitForm, markScenarioDirty]);

  useEffect(() => {
    if (!form.scenarios.some((scenario) => scenario.id === form.activeScenarioId)) {
      updateForm("activeScenarioId", form.scenarios[0]?.id ?? DEFAULT_SCENARIO_COMPARISON_FORM.activeScenarioId);
    }
  }, [form.activeScenarioId, form.scenarios, updateForm]);

  useEffect(() => {
    if (!form.selectedMetricIds.includes(form.activeMetricId) && form.selectedMetricIds.length > 0) {
      updateForm("activeMetricId", form.selectedMetricIds[0]!);
    }
  }, [form.activeMetricId, form.selectedMetricIds, updateForm]);

  const recalculateComparison = useCallback(async (options?: { scenarioId?: string; advanceToVisualize?: boolean }) => {
    setRunError(null);
    setPublishMessage(null);
    setIsComputing(true);
    setLoadingScenarioId(options?.scenarioId ?? null);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 80);
    });

    try {
      const nextResult = buildScenarioComparisonResult(form);
      setResult(nextResult);
      setStepData(SCENARIO_COMPARISON_RESULT_KEY, nextResult);
      setDirtyScenarioIds([]);
      setLastComputedAt(new Date().toISOString());
      if (options?.advanceToVisualize) {
        setStep(4);
      }
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Scenario comparison failed.");
    } finally {
      setIsComputing(false);
      setLoadingScenarioId(null);
    }
  }, [form, setStepData]);

  const handleAddDeltaLayer = useCallback(() => {
    if (!result) {
      return;
    }

    const activeScenario = result.scenarios.find((scenario) => scenario.scenarioId === form.activeScenarioId) ?? result.scenarios[0];
    const activeMetric = result.metricDefinitions.find((metric) => metric.id === form.activeMetricId) ?? result.metricDefinitions[0];
    if (!activeScenario || !activeMetric) {
      return;
    }

    addOverlayLayer(buildScenarioDeltaLayer(result, activeScenario.scenarioId, activeMetric.id, form.deltaMode));
    openMap();
  }, [addOverlayLayer, form.activeMetricId, form.activeScenarioId, form.deltaMode, openMap, result]);

  const handleExportSummary = useCallback(() => {
    if (!result) {
      return;
    }

    downloadJSON(exportFlowJSON(
      "scenario_comparison",
      form as unknown as Record<string, unknown>,
      {
        summary: buildScenarioComparisonSummaryText(form, result),
        narrative: buildScenarioComparisonNarrativeText(form, result),
        paretoScenarioIds: result.paretoScenarioIds,
        compositeScores: result.scenarios.map((scenario) => ({
          scenarioId: scenario.scenarioId,
          name: scenario.name,
          compositeScore: scenario.compositeScore,
          meanImprovement: scenario.meanImprovement,
        })),
      },
    ));
  }, [form, result]);

  const handleExportDeltaData = useCallback(() => {
    if (!result) {
      return;
    }

    const blob = new Blob([
      buildScenarioDeltaCsv(result, form.activeScenarioId, form.activeMetricId),
    ], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyScenarioComparisonOutput(form.outputTitle)}-${form.activeMetricId}-delta.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [form.activeMetricId, form.activeScenarioId, form.outputTitle, result]);

  const handleExportCharts = useCallback(() => {
    if (!result) {
      return;
    }

    const blob = new Blob([
      JSON.stringify(buildScenarioChartDataExport(result), null, 2),
    ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyScenarioComparisonOutput(form.outputTitle)}-chart-data.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [form.outputTitle, result]);

  const handlePublishCompletedRun = useCallback(() => {
    if (!result) {
      return;
    }

    upsertCompletedRun(buildScenarioComparisonCompletedRun(form, result));
    setPublishMessage("Published scenario comparison to completed runs.");
  }, [form, result, upsertCompletedRun]);

  const openDashboardModule = useCallback(() => {
    window.dispatchEvent(new CustomEvent("synapse:workflow-workspace", {
      detail: {
        view: "dashboard",
        flowId: "scenario_comparison",
      },
    }));
  }, []);

  const orderedScenarios = useMemo(
    () => result ? [...result.scenarios].sort((left, right) => right.compositeScore - left.compositeScore) : [],
    [result],
  );
  const narrativeInput = useMemo(
    () => result ? buildScenarioComparisonNarrativeInput(form, result) : null,
    [form, result],
  );
  const importedRunIds = new Set(form.scenarios.map((scenario) => scenario.sourceRunId).filter((value): value is string => Boolean(value)));

  const MAX_STEP = STEPS.length - 1;
  const goNext = () => setStep((current) => clamp(current + 1, 0, MAX_STEP));
  const goBack = () => setStep((current) => clamp(current - 1, 0, MAX_STEP));

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>
            {FLOW_DEF.icon} {FLOW_DEF.label}
          </div>
          <div className={styles.flowTitleMeta}>
            Step {step + 1} of {STEPS.length}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <MethodologyInfoButton explainerId="scenario_tradeoffs" pathId="scenario_planning_decision_support" label="Methodology note" />
          </div>
        </div>
        <div className={styles.flowSubtitle}>{FLOW_DEF.description}</div>
      </header>

      <StepPills
        steps={STEPS.map((stage) => ({ key: stage.key, label: stage.label }))}
        currentIndex={step}
        onSelect={(index) => setStep(clamp(index, 0, MAX_STEP))}
      />

      <div className={styles.flowBodyArea}>
        {runError ? (
          <div className={styles.warnBlock}>{runError}</div>
        ) : null}

        {step === 0 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Baseline and aligned indicator frame</div>
            <div className={styles.formHint}>
              This workflow ships with a district-scale embedded baseline so users can understand the scenario dashboard before wiring in project-specific evidence.
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Baseline name
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.baselineName}
                  onChange={(event) => updateForm("baselineName", event.target.value)}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Baseline description</div>
              <textarea
                className={styles.textareaField}
                aria-label="Baseline description"
                rows={5}
                value={form.baselineDescription}
                onChange={(event) => updateForm("baselineDescription", event.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {baselineMetricPreview.map((metric) => (
                <div key={metric.id} className={styles.readonlyBlock}>
                  <strong>{metric.label}</strong>
                  {`\nAverage baseline value: ${metric.average.toFixed(1)} ${metric.unit}`}
                  {`\nDirection: ${metric.direction === "maximize" ? "higher is better" : "lower is better"}`}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Alternative scenarios and parameter controls</div>
            <div className={styles.formHint}>
              Configure two to four policy packages side by side. Each scenario exposes the same lever set so the resulting comparison remains aligned and analytically defensible.
            </div>

            <div className={styles.formSection}>
              <div className={styles.formLabel}>Import completed urban-growth scenarios</div>
              {availableSimulationRuns.length === 0 ? (
                <div className={styles.readonlyBlock}>
                  No completed urban growth runs are available yet. Run the Urban Growth Cellular Automata workflow to import scenario stubs here.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availableSimulationRuns.map((run) => {
                    const alreadyImported = importedRunIds.has(run.runId);
                    return (
                      <button
                        key={run.runId}
                        type="button"
                        className={styles.outlineBtn}
                        disabled={!alreadyImported && form.scenarios.length >= 4}
                        onClick={() => importScenarioFromRun(run.runId)}
                      >
                        {alreadyImported ? `Refresh ${run.label}` : `Import ${run.label}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {form.scenarios.map((scenario) => {
                const scenarioResult = result?.scenarios.find((entry) => entry.scenarioId === scenario.id) ?? null;
                const isDirty = dirtyScenarioIds.includes(scenario.id);
                const isLoading = loadingScenarioId === scenario.id && isComputing;

                return (
                  <div
                    key={scenario.id}
                    style={{
                      border: "1px solid var(--syn-overlay-light)",
                      borderRadius: 8,
                      padding: 12,
                      background: scenario.id === form.activeScenarioId ? "var(--syn-accent-bg)" : "var(--syn-overlay-whisper)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className={styles.outlineBtn}
                        onClick={() => updateForm("activeScenarioId", scenario.id)}
                      >
                        Focus scenario
                      </button>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {scenario.sourceRunId ? (
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid var(--syn-accent-border)",
                            background: "var(--syn-depth-subtle)",
                            fontSize: 10,
                            fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
                          }}>
                            Imported
                          </span>
                        ) : null}
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          border: "1px solid var(--syn-overlay-medium)",
                          background: "var(--syn-depth-subtle)",
                          fontSize: 10,
                          fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
                        }}>
                          {isDirty ? "Needs recalc" : "Computed"}
                        </span>
                      </div>
                    </div>

                    <label className={styles.formLabel}>
                      Scenario name
                      <input
                        type="text"
                        className={styles.textInput}
                        value={scenario.name}
                        onChange={(event) => updateScenarioField(scenario.id, "name", event.target.value)}
                      />
                    </label>

                    <div className={styles.formSection}>
                      <div className={styles.formLabel}>Description</div>
                      <textarea
                        className={styles.textareaField}
                        aria-label={`${scenario.name || "Scenario"} description`}
                        rows={3}
                        value={scenario.description}
                        onChange={(event) => updateScenarioField(scenario.id, "description", event.target.value)}
                      />
                    </div>

                    <div className={styles.formSection}>
                      <div className={styles.formLabel}>Assumptions</div>
                      <textarea
                        className={styles.textareaField}
                        aria-label={`${scenario.name || "Scenario"} assumptions`}
                        rows={3}
                        value={scenario.assumptions}
                        onChange={(event) => updateScenarioField(scenario.id, "assumptions", event.target.value)}
                      />
                    </div>

                    {SCENARIO_LEVERS.map((lever) => (
                      <div key={`${scenario.id}-${lever.id}`} className={styles.formSection}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <div className={styles.formLabel}>{lever.label}</div>
                          <span style={{ fontSize: 11, color: "var(--syn-text-muted)", fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)" }}>
                            {scenario.parameters[lever.id]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          aria-label={lever.label}
                          value={scenario.parameters[lever.id]}
                          onChange={(event) => updateScenarioParameter(scenario.id, lever.id, Number(event.target.value))}
                        />
                        <div className={styles.formHint}>{lever.description}</div>
                      </div>
                    ))}

                    <div className={styles.readonlyBlock}>
                      {scenarioResult
                        ? `Composite score: ${scenarioResult.compositeScore.toFixed(1)}\nMean improvement: ${scenarioResult.meanImprovement >= 0 ? "+" : ""}${scenarioResult.meanImprovement.toFixed(1)}\nBased on the latest computed comparison snapshot.`
                        : "No computed snapshot yet for this scenario."}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className={styles.outlineBtn}
                        onClick={() => void recalculateComparison({ scenarioId: scenario.id })}
                        disabled={isComputing}
                      >
                        {isLoading ? "Recalculating..." : "Recalculate scenario"}
                      </button>
                      <button
                        type="button"
                        className={styles.outlineBtn}
                        onClick={() => removeScenario(scenario.id)}
                        disabled={form.scenarios.length <= 2}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {form.scenarios.length < 4 ? (
              <button type="button" className={styles.outlineBtn} onClick={addScenario}>
                Add scenario ({form.scenarios.length}/4)
              </button>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Aligned metrics and scale control</div>
            <div className={styles.formHint}>
              Choose the indicators that will remain aligned across all scenarios. The dashboard normalizes them to a common 0-100 frame while preserving whether higher or lower is desirable.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {SCENARIO_METRICS.map((metric) => (
                <label
                  key={metric.id}
                  style={{
                    border: `1px solid ${form.selectedMetricIds.includes(metric.id) ? "var(--syn-accent-primary)" : "var(--syn-overlay-light)"}`,
                    borderRadius: 8,
                    padding: 12,
                    background: form.selectedMetricIds.includes(metric.id) ? "var(--syn-accent-bg)" : "var(--syn-overlay-whisper)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.selectedMetricIds.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                    />
                    <strong>{metric.label}</strong>
                  </div>
                  <div className={styles.formHint}>{metric.description}</div>
                  <div className={styles.formHint}>{metric.direction === "maximize" ? "Higher is better" : "Lower is better"}</div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Recalculation gate</div>
            <div className={styles.formHint}>
              Use the recalculation gate whenever scenario levers or selected metrics change. The workflow stores the last computed dashboard state so exports and reporting remain reproducible.
            </div>
            <div className={styles.readonlyBlock}>
              {buildScenarioComparisonSummaryText(form, result)}
              {lastComputedAt ? `\nLast computed: ${new Date(lastComputedAt).toLocaleString()}` : ""}
              {dirtyScenarioIds.length > 0 ? `\nDirty scenarios: ${dirtyScenarioIds.join(", ")}` : "\nNo pending scenario edits."}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => void recalculateComparison({ advanceToVisualize: true })}
                disabled={isComputing}
              >
                {isComputing ? "Computing comparison..." : "Recalculate full comparison"}
              </button>
              <button type="button" className={styles.outlineBtn} onClick={openDashboardModule}>
                Open dashboard module
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <>
            {dirtyScenarioIds.length > 0 ? (
              <div className={styles.warnBlock}>
                One or more scenarios changed after the last computation. The dashboard below is showing the last reproducible snapshot. Recalculate before exporting or briefing.
              </div>
            ) : null}
            <ChunkLoadBoundary
              compact
              title="Scenario dashboard unavailable"
              message="The comparison dashboard chunk did not load. Retry after the dev server reconnects, or reload the app if needed."
            >
              <React.Suspense fallback={<div className={styles.stepContentCard}>Loading scenario dashboard...</div>}>
                <ScenarioComparisonDashboard
                  result={result}
                  activeScenarioId={form.activeScenarioId}
                  onActiveScenarioChange={(scenarioId) => updateForm("activeScenarioId", scenarioId)}
                  activeMetricId={form.activeMetricId}
                  onActiveMetricChange={(metricId) => updateForm("activeMetricId", metricId)}
                  deltaMode={form.deltaMode}
                  onDeltaModeChange={(mode) => updateForm("deltaMode", mode)}
                  onExportSummary={handleExportSummary}
                  onExportDeltaData={handleExportDeltaData}
                  onExportCharts={handleExportCharts}
                  onAddLayerToMap={handleAddDeltaLayer}
                  footerNote={(
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className={styles.outlineBtn} onClick={openDashboardModule}>
                        Open as dashboard module
                      </button>
                      <button type="button" className={styles.outlineBtn} onClick={() => void recalculateComparison()} disabled={isComputing}>
                        {isComputing ? "Refreshing..." : "Refresh snapshot"}
                      </button>
                    </div>
                  )}
                />
              </React.Suspense>
            </ChunkLoadBoundary>
          </>
        ) : null}

        {step === 5 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Trade-off reasoning and policy notes</div>
            <div className={styles.formHint}>
              Use this step to turn dashboard evidence into planning language: which scenarios are efficient, which metrics worsen, and what the acceptable compromise looks like.
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Analyst trade-off notes</div>
              <textarea
                className={styles.textareaField}
                aria-label="Analyst trade-off notes"
                rows={6}
                value={form.tradeoffNotes}
                onChange={(event) => updateForm("tradeoffNotes", event.target.value)}
                placeholder="Record which scenario leads, which indicators remain weak, and why a particular trade-off is or is not acceptable."
              />
            </div>
            <div className={styles.readonlyBlock}>
              {orderedScenarios.length === 0
                ? "No computed comparison yet."
                : orderedScenarios.map((scenario, index) => {
                    const strongestGain = [...scenario.metrics].sort((left, right) => right.improvementDelta - left.improvementDelta)[0]!;
                    const strongestTradeOff = [...scenario.metrics].sort((left, right) => left.improvementDelta - right.improvementDelta)[0]!;
                    return `${index + 1}. ${scenario.name} | score ${scenario.compositeScore.toFixed(1)} | best ${strongestGain.label} (${strongestGain.improvementDelta >= 0 ? "+" : ""}${strongestGain.improvementDelta.toFixed(1)}) | tension ${strongestTradeOff.label} (${strongestTradeOff.improvementDelta >= 0 ? "+" : ""}${strongestTradeOff.improvementDelta.toFixed(1)})${scenario.paretoCandidate ? " | Pareto candidate" : ""}`;
                  }).join("\n")}
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Export and reporting package</div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Output title
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.outputTitle}
                  onChange={(event) => updateForm("outputTitle", event.target.value)}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Summary</div>
              <div className={styles.readonlyBlock}>{buildScenarioComparisonSummaryText(form, result)}</div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Narrative</div>
              <div className={styles.readonlyBlock}>{result ? buildScenarioComparisonNarrativeText(form, result) : "No computed narrative yet."}</div>
            </div>
            <NarrativeGenerationPanel input={narrativeInput ?? undefined} subject={form.outputTitle} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className={styles.outlineBtn} onClick={handleExportSummary} disabled={!result}>
                Export summary JSON
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleExportDeltaData} disabled={!result}>
                Export delta CSV
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleExportCharts} disabled={!result}>
                Export chart data
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handlePublishCompletedRun} disabled={!result}>
                Publish to review
              </button>
              <button type="button" className={styles.outlineBtn} onClick={openDashboardModule}>
                Open dashboard module
              </button>
            </div>
            {publishMessage ? (
              <div className={styles.readonlyBlock} data-testid="scenario-comparison-publish-status" style={{ marginTop: 12 }}>
                {publishMessage}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <CrossPanelActions flowId="scenario_comparison" stepLabel={STEPS[step]!.label} />

      <footer
        className={styles.flowFooter}
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
        }}
      >
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={step === 0}
          onClick={goBack}
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={step === MAX_STEP}
          onClick={goNext}
        >
          Next
        </button>
      </footer>
    </section>
  );
};

export default ScenarioComparisonFlow;
