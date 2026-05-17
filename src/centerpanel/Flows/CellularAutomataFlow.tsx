import React, { useEffect, useState } from "react";
import {
  adaptCAResult,
  createAnalysisCompletedRun,
} from "@/services/map/MapEngineAdapter";
import { executeCellularAutomataScenarioAsync } from "@/services/analysis/BackgroundAnalyticsQueue";
import {
  type CellularAutomataResult,
  type CellularAutomataState,
} from "@/engine/simulation";
import { useBackgroundTaskStore } from "@/stores/useBackgroundTaskStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { toastError, toastInfo, toastSuccess } from "@/ui/toast/api";
import { isBackgroundTaskCancelledError } from "@/workers/pool";
import {
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "./flowUtils";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import styles from "../styles/flows.module.css";
import CrossPanelActions from "./rail/CrossPanelActions";
import { buildCellularAutomataDemoDataset } from "./cellularAutomataDemo";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildCellularAutomataNarrativeInput } from "./narrativeBuilders";

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === "urban_growth_ca")!;
const STEPS = FLOW_DEF.steps;
const FORM_KEY = "urban_growth_ca_form";
const DEMO_DATASET = buildCellularAutomataDemoDataset();

type ComparisonMode = "side_by_side" | "toggle";
type ToggleSurface = "predicted" | "observed";

interface UrbanGrowthFlowForm {
  scenarioName: string;
  calibrationSteps: number[];
  useProtectedAreas: boolean;
  useWater: boolean;
  useSlope: boolean;
  useUrbanStructure: boolean;
  maxSlope: number;
  perturbationFactor: number;
  growthMultiplier: number;
  predictionSteps: number;
  randomSeed: number;
  comparisonMode: ComparisonMode;
  toggleSurface: ToggleSurface;
}

const DEFAULT_FORM: UrbanGrowthFlowForm = {
  scenarioName: "Transit Corridor Consolidation",
  calibrationSteps: [2008, 2014, 2020],
  useProtectedAreas: true,
  useWater: true,
  useSlope: true,
  useUrbanStructure: true,
  maxSlope: 0.68,
  perturbationFactor: 0.18,
  growthMultiplier: 1,
  predictionSteps: 4,
  randomSeed: 20260412,
  comparisonMode: "side_by_side",
  toggleSurface: "predicted",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "urban-growth";
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetric(value: number): string {
  return value.toFixed(3);
}

function countUrbanCells(state: CellularAutomataState): number {
  return state.values.filter((value) => value >= 0.5).length;
}

function listEnabledConstraints(form: UrbanGrowthFlowForm): string[] {
  return [
    form.useProtectedAreas ? "Protected areas" : null,
    form.useWater ? "Water" : null,
    form.useSlope ? `Slope <= ${form.maxSlope.toFixed(2)}` : null,
    form.useUrbanStructure ? "Existing urban structure" : null,
  ].filter((value): value is string => Boolean(value));
}

function downloadTextFile(filename: string, content: string, type = "application/json"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildValidationCsv(result: CellularAutomataResult): string {
  const validation = result.validation;
  if (!validation) {
    return "metric,value\nvalidation,not_available\n";
  }

  const rows = [
    ["figure_of_merit", validation.figureOfMerit],
    ["overall_accuracy", validation.overallAccuracy],
    ["kappa", validation.kappa],
    ["kappa_change", validation.kappaChange],
    ["fit_quality", validation.fitQuality],
    ["urban_true_positive", validation.confusion.urban.truePositive],
    ["urban_false_positive", validation.confusion.urban.falsePositive],
    ["urban_false_negative", validation.confusion.urban.falseNegative],
    ["urban_true_negative", validation.confusion.urban.trueNegative],
    ["change_hits", validation.confusion.change.hits],
    ["change_misses", validation.confusion.change.misses],
    ["change_false_alarms", validation.confusion.change.falseAlarms],
    ["change_correct_rejections", validation.confusion.change.correctRejections],
  ];

  return `metric,value\n${rows.map(([metric, value]) => `${metric},${value}`).join("\n")}\n`;
}

function buildRunNarrative(
  form: UrbanGrowthFlowForm,
  result: CellularAutomataResult,
  calibrationLabels: string[],
): string {
  const validation = result.validation;
  const lines = [
    `${form.scenarioName} cellular automata scenario calibrated from ${calibrationLabels.join(", ")}.`,
    `Enabled constraints: ${listEnabledConstraints(form).join(", ") || "none"}.`,
    `Perturbation ${form.perturbationFactor.toFixed(2)}, growth multiplier ${form.growthMultiplier.toFixed(2)}, ${form.predictionSteps} simulation step(s).`,
    `Final predicted urban cells: ${countUrbanCells(result.predictedStates[result.predictedStates.length - 1]!)}, observed urban cells: ${countUrbanCells(result.observedState ?? DEMO_DATASET.observedState)}.`,
  ];

  if (validation) {
    lines.push(
      `Validation — FoM ${formatMetric(validation.figureOfMerit)}, kappa ${formatMetric(validation.kappa)}, kappa-change ${formatMetric(validation.kappaChange)}, overall accuracy ${formatMetric(validation.overallAccuracy)}, fit ${validation.fitQuality}.`,
    );
  }

  lines.push(`Simplifications: ${result.simplifications.join(" ")}`);
  return lines.join("\n");
}

function buildDifferenceLegend(): Array<{ label: string; color: string }> {
  return [
    { label: "Persistent / matched urban", color: "#38BDF8" },
    { label: "False alarm", color: "#14b8a6" },
    { label: "Missed observed growth", color: "#ef4444" },
    { label: "Non-urban", color: "#1f2937" },
  ];
}

function getCellColor(state: CellularAutomataState, index: number): string {
  return (state.values[index] ?? 0) >= 0.5 ? "#38BDF8" : "#111827";
}

function getDifferenceColor(predicted: CellularAutomataState, observed: CellularAutomataState, index: number): string {
  const predictedUrban = (predicted.values[index] ?? 0) >= 0.5;
  const observedUrban = (observed.values[index] ?? 0) >= 0.5;

  if (predictedUrban && observedUrban) {
    return "#38BDF8";
  }
  if (predictedUrban && !observedUrban) {
    return "#14b8a6";
  }
  if (!predictedUrban && observedUrban) {
    return "#ef4444";
  }
  return "#1f2937";
}

const SurfaceGrid: React.FC<{
  state: CellularAutomataState;
  title: string;
  subtitle?: string;
}> = ({ state, title, subtitle }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--syn-text-primary)" }}>{title}</div>
        {subtitle ? <div className={styles.formHint}>{subtitle}</div> : null}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))`,
          gap: 1,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--syn-overlay-light)",
          borderRadius: 8,
          padding: 6,
        }}
      >
        {state.values.map((_, index) => (
          <div
            key={`${title}-${index}`}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 1,
              background: getCellColor(state, index),
            }}
            title={`Cell ${index + 1} — ${(state.values[index] ?? 0) >= 0.5 ? "Urban" : "Non-urban"}`}
          />
        ))}
      </div>
      <div className={styles.formHint}>Urban cells: {countUrbanCells(state)}</div>
    </div>
  );
};

const DifferenceGrid: React.FC<{
  predicted: CellularAutomataState;
  observed: CellularAutomataState;
}> = ({ predicted, observed }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--syn-text-primary)" }}>Difference Overlay</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${predicted.width}, minmax(0, 1fr))`,
          gap: 1,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--syn-overlay-light)",
          borderRadius: 8,
          padding: 6,
        }}
      >
        {predicted.values.map((_, index) => (
          <div
            key={`difference-${index}`}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 1,
              background: getDifferenceColor(predicted, observed, index),
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {buildDifferenceLegend().map((entry) => (
          <span
            key={entry.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              color: "var(--syn-text-muted)",
              border: "1px solid var(--syn-overlay-light)",
              borderRadius: 999,
              padding: "4px 8px",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: entry.color,
              }}
            />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const CellularAutomataFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<CellularAutomataResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { setStepData, stepData, upsertCompletedRun } = useFlowStore();
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMapExplorer = useMapExplorerStore((state) => state.open);
  const upsertMapEvidenceArtifact = useMapExplorerStore((state) => state.upsertMapEvidenceArtifact);
  const openTaskPanel = useBackgroundTaskStore((state) => state.openPanel);

  const [form, setForm] = useState<UrbanGrowthFlowForm>(() =>
    restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
  );

  const calibrationStates = DEMO_DATASET.historicalStates.filter((state) =>
    form.calibrationSteps.includes(Number(state.step)),
  );
  const enabledConstraints = listEnabledConstraints(form);
  const finalPredictedState = result?.predictedStates[result.predictedStates.length - 1] ?? null;

  useEffect(() => {
    if (!isPlaying || !result || result.predictedStates.length <= 1) {
      return undefined;
    }

    const handle = window.setInterval(() => {
      setCurrentFrameIndex((previous) => {
        const next = previous + 1;
        return next >= result.predictedStates.length ? 0 : next;
      });
    }, 850);

    return () => window.clearInterval(handle);
  }, [isPlaying, result]);

  useEffect(() => {
    if (!result) {
      setIsPlaying(false);
      setCurrentFrameIndex(0);
      return;
    }
    if (currentFrameIndex >= result.predictedStates.length) {
      setCurrentFrameIndex(result.predictedStates.length - 1);
    }
  }, [currentFrameIndex, result]);

  const updateForm = <K extends keyof UrbanGrowthFlowForm>(key: K, value: UrbanGrowthFlowForm[K]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      setStepData(FORM_KEY, next);
      return next;
    });
  };

  const toggleCalibrationStep = (year: number) => {
    const next = form.calibrationSteps.includes(year)
      ? form.calibrationSteps.filter((value) => value !== year)
      : [...form.calibrationSteps, year].sort((left, right) => left - right);
    updateForm("calibrationSteps", next);
  };

  const runSimulation = async () => {
    if (calibrationStates.length < 2) {
      setRunError("Select at least two temporal land-use states for calibration.");
      return;
    }

    setRunError(null);
    setIsRunning(true);
    setIsPlaying(false);

    try {
      const runId = `urban-growth-ca-${Date.now()}`;
      const constraints = {
        ...(form.useProtectedAreas ? { protectedAreas: DEMO_DATASET.constraints.protectedAreas } : {}),
        ...(form.useWater ? { water: DEMO_DATASET.constraints.water } : {}),
        ...(form.useSlope ? { slope: DEMO_DATASET.constraints.slope } : {}),
        ...(form.useUrbanStructure ? { existingUrbanStructure: DEMO_DATASET.constraints.existingUrbanStructure } : {}),
      };

      const viewResult = () => {
        openMapExplorer();
        setStep(4);
      };

      const simulationHandle = executeCellularAutomataScenarioAsync({
        options: {
          historicalStates: calibrationStates,
          initialState: calibrationStates[calibrationStates.length - 1],
          observedState: DEMO_DATASET.observedState,
          suitabilitySurface: DEMO_DATASET.suitabilitySurface,
          constraints,
          steps: form.predictionSteps,
          maxSlope: form.maxSlope,
          stochasticPerturbation: form.perturbationFactor,
          growthMultiplier: form.growthMultiplier,
          seed: form.randomSeed,
          scenarioName: form.scenarioName.trim() || "Urban growth scenario",
        },
      }, {
        timeoutMs: 240_000,
        viewAction: {
          label: "View result",
          onClick: viewResult,
        },
      });

      openTaskPanel();

      const nextResult = await simulationHandle.promise;

      const layerName = `${form.scenarioName.trim() || "Urban growth scenario"} CA`;
      const adapted = adaptCAResult({
        result: nextResult,
        layerId: `${slugify(form.scenarioName)}-${runId}`,
        layerName,
        runId,
        parameters: {
          calibrationStates: calibrationStates.map((state) => state.label ?? String(state.step)),
          enabledConstraints,
          maxSlope: form.maxSlope,
          perturbationFactor: form.perturbationFactor,
          growthMultiplier: form.growthMultiplier,
          predictionSteps: form.predictionSteps,
          randomSeed: form.randomSeed,
        },
      });

      addOverlayLayer(adapted.layer);
      upsertMapEvidenceArtifact(adapted.evidenceArtifact);
      const narrative = buildRunNarrative(form, nextResult, calibrationStates.map((state) => state.label ?? String(state.step)));
      upsertCompletedRun(createAnalysisCompletedRun(adapted, {
        flowId: "urban_growth_ca",
        runId,
        label: layerName,
        paragraph: narrative,
        paragraphPreview: narrative,
        paragraphFull: narrative,
        chartOutputs: [
          {
            id: `${runId}-growth-trace`,
            type: "line",
            title: `${layerName} Growth Trace`,
            data: nextResult.stepSummaries.map((summary) => ({
              step: summary.step,
              label: summary.label,
              totalUrbanCells: summary.totalUrbanCells,
              newUrbanCells: summary.newUrbanCells,
            })),
          },
        ],
        dataOutputs: [
          {
            id: `${runId}-validation`,
            format: "validation-summary",
            rows: nextResult.validation ? 4 : 0,
            columns: ["metric", "value"],
            preview: nextResult.validation
              ? [
                  { metric: "figureOfMerit", value: nextResult.validation.figureOfMerit },
                  { metric: "kappa", value: nextResult.validation.kappa },
                  { metric: "kappaChange", value: nextResult.validation.kappaChange },
                  { metric: "overallAccuracy", value: nextResult.validation.overallAccuracy },
                ]
              : [],
          },
          {
            id: `${runId}-predicted-states`,
            format: "predicted-surfaces",
            rows: nextResult.predictedStates.length,
            columns: ["step", "label", "urbanCells"],
            preview: nextResult.predictedStates.map((state) => ({
              step: state.step,
              label: state.label,
              urbanCells: countUrbanCells(state),
            })),
          },
        ],
      }));

      setResult(nextResult);
      setCurrentFrameIndex(0);
      setStep(4);
      toastSuccess(`${layerName} completed in the background worker pool.`, {
        action: {
          label: "View result",
          onClick: viewResult,
        },
      });
    } catch (error) {
      if (isBackgroundTaskCancelledError(error)) {
        setRunError(null);
        toastInfo("Urban growth simulation was cancelled.", {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
      } else {
        const message = error instanceof Error ? error.message : "Urban growth simulation failed.";
        setRunError(message);
        toastError(message, {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const exportPredictedSurfaces = () => {
    if (!result) {
      return;
    }
    downloadTextFile(
      `${slugify(form.scenarioName)}-predicted-surfaces.json`,
      JSON.stringify(result.predictedStates, null, 2),
    );
  };

  const exportValidationSummary = () => {
    if (!result) {
      return;
    }
    downloadTextFile(
      `${slugify(form.scenarioName)}-validation-summary.csv`,
      buildValidationCsv(result),
      "text/csv;charset=utf-8",
    );
  };

  const exportWorkflowJson = () => {
    if (!result) {
      return;
    }
    const payload = exportFlowJSON(
      "urban_growth_ca",
      form as unknown as Record<string, unknown>,
      {
        calibrationStates: calibrationStates.map((state) => state.label ?? String(state.step)),
        enabledConstraints,
        validation: result.validation ?? null,
        simplifications: result.simplifications,
        stepSummaries: result.stepSummaries,
      },
    );
    downloadJSON(payload);
  };

  const currentState = result?.predictedStates[currentFrameIndex] ?? calibrationStates[calibrationStates.length - 1] ?? DEMO_DATASET.historicalStates[0];
  const currentSummary = result?.stepSummaries[currentFrameIndex] ?? null;
  const MAX_STEP = STEPS.length - 1;
  const narrativeInput = result
    ? buildCellularAutomataNarrativeInput(
        {
          scenarioName: form.scenarioName,
          predictionSteps: form.predictionSteps,
          perturbationFactor: form.perturbationFactor,
          growthMultiplier: form.growthMultiplier,
        },
        result,
        calibrationStates.map((state) => state.label ?? String(state.step)),
      )
    : null;

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
        </div>
        <div className={styles.flowSubtitle}>{FLOW_DEF.description}</div>
      </header>

      <StepPills
        steps={STEPS.map((entry) => ({ key: entry.key, label: entry.label }))}
        currentIndex={step}
        onSelect={(index) => setStep(clamp(index, 0, MAX_STEP))}
      />

      <div className={styles.flowBodyArea}>
        {step === 0 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Calibration Inputs</div>
            <p className={styles.formHint}>
              Calibrate the growth rule from at least two observed land-use states. The last selected historical state becomes the simulation start condition; the 2026 surface is held back for validation.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Scenario name
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.scenarioName}
                  onChange={(event) => updateForm("scenarioName", event.target.value)}
                  style={{ marginTop: 6 }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Observed calibration states</div>
              {DEMO_DATASET.historicalStates.map((state) => (
                <label
                  key={String(state.step)}
                  className={styles.checkboxRow}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid var(--syn-overlay-light)",
                    borderRadius: 8,
                    background: form.calibrationSteps.includes(Number(state.step))
                      ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.calibrationSteps.includes(Number(state.step))}
                    onChange={() => toggleCalibrationStep(Number(state.step))}
                  />
                  <span>
                    <strong>{state.label}</strong>
                    <span className={styles.formHint} style={{ display: "block" }}>
                      Urban cells: {countUrbanCells(state)}. Included in empirical transition calibration.
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Validation holdout</div>
              <div className={styles.readonlyBlock}>
                {DEMO_DATASET.observedState.label} remains unseen during calibration and is used for figure-of-merit and Kappa-style validation after simulation.
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Constraint Surface Selection</div>
            <p className={styles.formHint}>
              Protected areas, water, slope, and existing urban structure are handled as explicit constraints. Disable any surface to explore looser scenario assumptions.
            </p>
            <div className={styles.formSection}>
              {[
                {
                  key: "useProtectedAreas" as const,
                  label: "Protected areas",
                  hint: `${DEMO_DATASET.constraints.protectedAreas.values.filter((value) => value >= 0.5).length} blocked cells`,
                },
                {
                  key: "useWater" as const,
                  label: "Water",
                  hint: `${DEMO_DATASET.constraints.water.values.filter((value) => value >= 0.5).length} blocked cells`,
                },
                {
                  key: "useSlope" as const,
                  label: "Slope",
                  hint: "Blocks cells above the selected threshold",
                },
                {
                  key: "useUrbanStructure" as const,
                  label: "Existing urban structure",
                  hint: "Restricts leapfrog growth away from the current urban fabric",
                },
              ].map((entry) => (
                <label
                  key={entry.key}
                  className={styles.checkboxRow}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid var(--syn-overlay-light)",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form[entry.key]}
                    onChange={(event) => updateForm(entry.key, event.target.checked)}
                  />
                  <span>
                    <strong>{entry.label}</strong>
                    <span className={styles.formHint} style={{ display: "block" }}>{entry.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Maximum developable slope</div>
              <label className={styles.formLabel}>
                <input
                  type="range"
                  min={0.2}
                  max={0.95}
                  step={0.01}
                  value={form.maxSlope}
                  onChange={(event) => updateForm("maxSlope", Number(event.target.value))}
                  style={{ width: "100%", marginTop: 8 }}
                />
                <span className={styles.formHint}>Current threshold: {form.maxSlope.toFixed(2)}</span>
              </label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Perturbation & Scenario Controls</div>
            <p className={styles.formHint}>
              Use the perturbation factor to inject stochastic variation into cell ranking. Growth multiplier scales demand, and the prediction-step count controls temporal playback detail.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Stochastic perturbation factor</div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={form.perturbationFactor}
                onChange={(event) => updateForm("perturbationFactor", Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <div className={styles.formHint}>{form.perturbationFactor.toFixed(2)} — higher values increase exploratory growth noise.</div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Growth multiplier</div>
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.05}
                value={form.growthMultiplier}
                onChange={(event) => updateForm("growthMultiplier", Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <div className={styles.formHint}>{form.growthMultiplier.toFixed(2)} — relative to the empirical demand inferred from historical change.</div>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Prediction steps
                <input
                  type="number"
                  className={styles.textInput}
                  min={1}
                  max={8}
                  value={form.predictionSteps}
                  onChange={(event) => updateForm("predictionSteps", clamp(Number(event.target.value), 1, 8))}
                  style={{ marginTop: 6, width: 120 }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Random seed
                <input
                  type="number"
                  className={styles.textInput}
                  value={form.randomSeed}
                  onChange={(event) => updateForm("randomSeed", Number(event.target.value))}
                  style={{ marginTop: 6, width: 180 }}
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Run Simulation</div>
            <p className={styles.formHint}>
              Launch calibration and forward simulation. The completed run is published into the map-analysis pipeline and becomes available for review or scenario comparison.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Configuration summary</div>
              <div className={styles.readonlyBlock}>
                Scenario: {form.scenarioName}
                {"\n"}Calibration states: {calibrationStates.map((state) => state.label).join(", ") || "none selected"}
                {"\n"}Constraints: {enabledConstraints.join(", ") || "none"}
                {"\n"}Perturbation: {form.perturbationFactor.toFixed(2)}
                {"\n"}Growth multiplier: {form.growthMultiplier.toFixed(2)}
                {"\n"}Prediction steps: {form.predictionSteps}
              </div>
            </div>
            {runError ? <div className={styles.warn}>{runError}</div> : null}
            {result ? (
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Last run summary</div>
                <div className={styles.readonlyBlock}>
                  {buildRunNarrative(form, result, calibrationStates.map((state) => state.label ?? String(state.step)))}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => { void runSimulation(); }}
              disabled={isRunning || calibrationStates.length < 2}
            >
              {isRunning ? "Running cellular automata..." : "Run calibration + simulation"}
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Animated Temporal Map & Comparison</div>
            {!result ? (
              <p className={styles.formHint}>Run the simulation first to inspect temporal growth frames and predicted-versus-observed comparison surfaces.</p>
            ) : (
              <>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Time-step scrubber</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      onClick={() => setIsPlaying((previous) => !previous)}
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={result.predictedStates.length - 1}
                      value={currentFrameIndex}
                      onChange={(event) => {
                        setCurrentFrameIndex(Number(event.target.value));
                        setIsPlaying(false);
                      }}
                      style={{ flex: 1, minWidth: 220 }}
                    />
                    <span className={styles.formHint}>
                      {currentState.label} ({currentFrameIndex + 1}/{result.predictedStates.length})
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <SurfaceGrid
                    state={currentState}
                    title="Predicted temporal frame"
                    subtitle={currentSummary
                      ? `${currentSummary.newUrbanCells} new urban cells; target ${currentSummary.targetNewUrbanCells}; mean score ${currentSummary.meanSelectedScore.toFixed(3)}.`
                      : "Initial calibration state."}
                  />
                  <div className={styles.readonlyBlock}>
                    Current frame: {currentState.label}
                    {"\n"}Total urban cells: {countUrbanCells(currentState)}
                    {"\n"}Eligible candidate cells: {currentSummary?.eligibleCandidateCells ?? 0}
                    {"\n"}Constraint summary: protected {result.constraintSummary.protectedCells}, water {result.constraintSummary.waterCells}, steep slope {result.constraintSummary.steepSlopeCells}, structure-limited {result.constraintSummary.structureLimitedCells}
                  </div>
                </div>
                <div className={styles.formSection} style={{ marginTop: 16 }}>
                  <div className={styles.formLabel}>Predicted vs observed comparison</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="radio"
                        checked={form.comparisonMode === "side_by_side"}
                        onChange={() => updateForm("comparisonMode", "side_by_side")}
                      />
                      Side by side
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="radio"
                        checked={form.comparisonMode === "toggle"}
                        onChange={() => updateForm("comparisonMode", "toggle")}
                      />
                      Toggle
                    </label>
                  </div>
                </div>
                {finalPredictedState ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {form.comparisonMode === "side_by_side" ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 16,
                        }}
                      >
                        <SurfaceGrid state={finalPredictedState} title="Predicted final state" />
                        <SurfaceGrid state={DEMO_DATASET.observedState} title="Observed 2026 state" />
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            className={styles.outlineBtn}
                            onClick={() => updateForm("toggleSurface", "predicted")}
                          >
                            Predicted
                          </button>
                          <button
                            type="button"
                            className={styles.outlineBtn}
                            onClick={() => updateForm("toggleSurface", "observed")}
                          >
                            Observed
                          </button>
                        </div>
                        <SurfaceGrid
                          state={form.toggleSurface === "predicted" ? finalPredictedState : DEMO_DATASET.observedState}
                          title={form.toggleSurface === "predicted" ? "Predicted final state" : "Observed 2026 state"}
                        />
                      </div>
                    )}
                    <DifferenceGrid predicted={finalPredictedState} observed={DEMO_DATASET.observedState} />
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Validation Results & Export</div>
            {!result || !result.validation ? (
              <p className={styles.formHint}>Run the simulation to compute figure-of-merit, Kappa-style metrics, and exportable summaries.</p>
            ) : (
              <>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Validation results panel</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {[
                      { label: "Figure of Merit", value: formatMetric(result.validation.figureOfMerit) },
                      { label: "Kappa", value: formatMetric(result.validation.kappa) },
                      { label: "Kappa Change", value: formatMetric(result.validation.kappaChange) },
                      { label: "Overall Accuracy", value: formatPercent(result.validation.overallAccuracy) },
                      { label: "Fit Quality", value: result.validation.fitQuality.toUpperCase() },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        style={{
                          border: "1px solid var(--syn-overlay-light)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          background: "var(--syn-overlay-whisper)",
                        }}
                      >
                        <div className={styles.formHint}>{metric.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--syn-text-primary)" }}>{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Confusion summary</div>
                  <div className={styles.readonlyBlock}>
                    Urban agreement — TP {result.validation.confusion.urban.truePositive}, FP {result.validation.confusion.urban.falsePositive}, FN {result.validation.confusion.urban.falseNegative}, TN {result.validation.confusion.urban.trueNegative}
                    {"\n"}Change agreement — hits {result.validation.confusion.change.hits}, misses {result.validation.confusion.change.misses}, false alarms {result.validation.confusion.change.falseAlarms}, correct rejections {result.validation.confusion.change.correctRejections}
                  </div>
                </div>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Model simplifications</div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    {result.simplifications.map((item) => (
                      <li key={item} className={styles.formHint}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.formSection}>
                  <div className={styles.readonlyBlock}>
                    This run is already available as a completed workflow output and can be imported into the Scenario Comparison flow as a scenario stub.
                  </div>
                </div>
                <NarrativeGenerationPanel input={narrativeInput ?? undefined} subject={form.scenarioName} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className={styles.outlineBtn} onClick={exportPredictedSurfaces}>
                    Export predicted surfaces
                  </button>
                  <button type="button" className={styles.outlineBtn} onClick={exportValidationSummary}>
                    Export validation summary
                  </button>
                  <button type="button" className={styles.outlineBtn} onClick={exportWorkflowJson}>
                    Export workflow JSON
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      <CrossPanelActions flowId="urban_growth_ca" stepLabel={STEPS[step]!.label} />

      <footer className={styles.flowFooter}>
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={step === 0}
          onClick={() => setStep((previous) => clamp(previous - 1, 0, MAX_STEP))}
        >
          ← Previous
        </button>
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={step === MAX_STEP}
          onClick={() => setStep((previous) => clamp(previous + 1, 0, MAX_STEP))}
        >
          Next →
        </button>
      </footer>
    </section>
  );
};

export default CellularAutomataFlow;
