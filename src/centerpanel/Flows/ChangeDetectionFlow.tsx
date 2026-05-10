import React, { useCallback, useEffect, useState } from "react";
import type { AccuracyReport } from "@/engine/geoai/cv/types";
import { executeRasterAccuracyReportAsync } from "@/services/analysis/BackgroundAnalyticsQueue";
import { useBackgroundTaskStore } from "@/stores/useBackgroundTaskStore";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import { toastError, toastInfo, toastSuccess } from "@/ui/toast/api";
import { isBackgroundTaskCancelledError } from "@/workers/pool";
import {
  buildChangeDetectionSummary,
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "./flowUtils";
import CrossPanelActions from "./rail/CrossPanelActions";
import {
  buildChangeDetectionScenario,
  type ChangeDetectionScenarioSummary,
} from "./changeDetectionDemo";

const FLOW_DEF = FLOW_DEFINITIONS.find((f) => f.id === "change_detection")!;
const STEPS = FLOW_DEF.steps;

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

const METHODS = [
  "post_classification",
  "image_differencing",
  "cva",
] as const;

interface ChangeDetectionForm {
  t0Source: string;
  t0Date: string;
  t0Description: string;
  t1Source: string;
  t1Date: string;
  t1Description: string;
  method: (typeof METHODS)[number];
  changeThreshold: number;
  classificationScheme: string[];
  validationSampleSize: number;
  outputTitle: string;
}

const FORM_KEY = "change_detection_form";

const DEFAULT_CLASSES = [
  "Built-up",
  "Vegetation",
  "Water",
  "Bare Soil",
  "Agriculture",
  "Road / Impervious",
];

const DEFAULT_FORM: ChangeDetectionForm = {
  t0Source: "",
  t0Date: "",
  t0Description: "",
  t1Source: "",
  t1Date: "",
  t1Description: "",
  method: "post_classification",
  changeThreshold: 10,
  classificationScheme: [...DEFAULT_CLASSES],
  validationSampleSize: 200,
  outputTitle: "Change Detection Report",
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatMetric = (value: number) => value.toFixed(3);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "change-detection";
}

function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildValidationCsv(report: AccuracyReport): string {
  const rows = report.perClass.map((entry) => [
    entry.className,
    entry.precision,
    entry.recall,
    entry.f1,
    entry.iou,
    entry.support,
  ]);

  return [
    "class,precision,recall,f1,iou,support",
    ...rows.map((row) => row.join(",")),
  ].join("\n");
}

function buildOutputNarrative(
  form: ChangeDetectionForm,
  changeSummary: ChangeDetectionScenarioSummary | null,
  validationReport: AccuracyReport | null,
): string {
  const dominantTransition = changeSummary?.dominantTransitions[0]
    ? `${changeSummary.dominantTransitions[0].from} -> ${changeSummary.dominantTransitions[0].to}`
    : "No dominant transition computed";
  const validationLine = validationReport
    ? `Validation achieved overall accuracy ${formatPercent(validationReport.overallAccuracy)}, mean F1 ${formatMetric(validationReport.meanF1)}, and mean IoU ${formatMetric(validationReport.meanIoU)}.`
    : "Validation has not been run yet.";

  return [
    `${form.outputTitle} compares ${form.t0Source || "T0"} (${form.t0Date || "unspecified"}) against ${form.t1Source || "T1"} (${form.t1Date || "unspecified"}) using ${form.method.replace(/_/g, " ")} with a ${form.changeThreshold}% threshold.`,
    changeSummary
      ? `Computed change share is ${formatPercent(changeSummary.changedShare)} across ${changeSummary.totalCells} demo cells. Dominant transition: ${dominantTransition}. ${changeSummary.spatialFocus}`
      : "Change map has not been computed yet.",
    validationLine,
  ].join(" ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ChangeDetectionFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const { setStepData, stepData } = useFlowStore();
  const [changeSummary, setChangeSummary] = useState<ChangeDetectionScenarioSummary | null>(null);
  const [validationReport, setValidationReport] = useState<AccuracyReport | null>(null);
  const [isComputingChange, setIsComputingChange] = useState(false);
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const openTaskPanel = useBackgroundTaskStore((state) => state.openPanel);

  const [form, setForm] = useState<ChangeDetectionForm>(() =>
    restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
  );

  useEffect(() => {
    setStepData(FORM_KEY, form);
  }, [form, setStepData]);

  const updateForm = useCallback(
    <K extends keyof ChangeDetectionForm>(
      key: K,
      value: ChangeDetectionForm[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addClass = useCallback(() => {
    updateForm("classificationScheme", [
      ...form.classificationScheme,
      "",
    ]);
  }, [form.classificationScheme, updateForm]);

  const removeClass = useCallback(
    (idx: number) => {
      updateForm(
        "classificationScheme",
        form.classificationScheme.filter((_, i) => i !== idx),
      );
    },
    [form.classificationScheme, updateForm],
  );

  const handleExportJSON = useCallback(() => {
    const payload = exportFlowJSON(
      "change_detection",
      form as unknown as Record<string, unknown>,
      {
        summary: buildChangeDetectionSummary(form),
        changeSummary,
        validationReport,
      },
    );
    downloadJSON(payload);
  }, [changeSummary, form, validationReport]);

  const buildScenario = useCallback(() => buildChangeDetectionScenario({
    t0Source: form.t0Source,
    t0Date: form.t0Date,
    t1Source: form.t1Source,
    t1Date: form.t1Date,
    method: form.method,
    changeThreshold: form.changeThreshold,
    classLabels: form.classificationScheme,
    validationSampleSize: form.validationSampleSize,
  }), [form]);

  const handleComputeChangeMap = useCallback(() => {
    setIsComputingChange(true);
    try {
      const scenario = buildScenario();
      setChangeSummary(scenario.summary);
      setValidationReport(null);
      setRunError(null);
      setStep(5);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unable to compute the change scenario.");
    } finally {
      setIsComputingChange(false);
    }
  }, [buildScenario]);

  const handleRunValidation = useCallback(async () => {
    setIsRunningValidation(true);

    try {
      const scenario = buildScenario();
      setChangeSummary(scenario.summary);

      const viewValidation = () => setStep(5);
      const validationHandle = executeRasterAccuracyReportAsync(scenario.validation, {
        timeoutMs: 120_000,
        viewAction: {
          label: "View validation",
          onClick: viewValidation,
        },
      });

      openTaskPanel();

      const report = await validationHandle.promise;
      setValidationReport(report);
      setRunError(null);
      setStep(5);

      toastSuccess("Raster accuracy assessment completed in the shared worker pool.", {
        action: {
          label: "View validation",
          onClick: viewValidation,
        },
      });
    } catch (error) {
      if (isBackgroundTaskCancelledError(error)) {
        setRunError(null);
        toastInfo("Raster accuracy assessment was cancelled.", {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
      } else {
        const message = error instanceof Error ? error.message : "Raster accuracy assessment failed.";
        setRunError(message);
        toastError(message, {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
      }
    } finally {
      setIsRunningValidation(false);
    }
  }, [buildScenario, openTaskPanel]);

  const handleDownloadChangeSummary = useCallback(() => {
    if (!changeSummary) {
      return;
    }

    downloadTextFile(
      `${slugify(form.outputTitle)}-change-summary.json`,
      JSON.stringify({
        outputTitle: form.outputTitle,
        method: form.method,
        threshold: form.changeThreshold,
        changeSummary,
      }, null, 2),
      "application/json",
    );
  }, [changeSummary, form.changeThreshold, form.method, form.outputTitle]);

  const handleDownloadValidationCsv = useCallback(() => {
    if (!validationReport) {
      return;
    }

    downloadTextFile(
      `${slugify(form.outputTitle)}-validation.csv`,
      buildValidationCsv(validationReport),
      "text/csv;charset=utf-8",
    );
  }, [form.outputTitle, validationReport]);

  const handleDownloadReportSection = useCallback(() => {
    downloadTextFile(
      `${slugify(form.outputTitle)}-report.md`,
      buildOutputNarrative(form, changeSummary, validationReport),
      "text/markdown;charset=utf-8",
    );
  }, [changeSummary, form, validationReport]);

  const MAX_STEP = STEPS.length - 1;
  const goNext = () => setStep((s) => clamp(s + 1, 0, MAX_STEP));
  const goBack = () => setStep((s) => clamp(s - 1, 0, MAX_STEP));

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
        steps={STEPS.map((s) => ({ key: s.key, label: s.label }))}
        currentIndex={step}
        onSelect={(i) => setStep(clamp(i, 0, MAX_STEP))}
      />

      <div className={styles.flowBodyArea}>
        {runError ? (
          <div className={styles.readonlyBlock} style={{ marginBottom: 12, borderColor: "var(--syn-danger-border)" }}>
            {runError}
          </div>
        ) : null}

        {/* Step 1 — Load T₀ Data */}
        {step === 0 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Load T₀ Data</div>
            <p className={styles.formHint}>
              Specify the baseline time-point dataset. This is the earlier
              snapshot used as the reference for change comparison.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Data source
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Sentinel-2, Landsat-8, vector land-use layer…"
                  value={form.t0Source}
                  onChange={(e) => updateForm("t0Source", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Date / period
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., 2018-06-01 or 2018 summer composite"
                  value={form.t0Date}
                  onChange={(e) => updateForm("t0Date", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Description</div>
              <textarea
                className={styles.textareaField}
                aria-label="T0 description"
                placeholder="Describe the T₀ dataset, preprocessing, and spatial extent…"
                value={form.t0Description}
                onChange={(e) => updateForm("t0Description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Load T₁ Data */}
        {step === 1 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Load T₁ Data</div>
            <p className={styles.formHint}>
              Specify the comparison time-point dataset. This is the later
              snapshot against which changes will be detected.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Data source
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Sentinel-2, Landsat-8, vector land-use layer…"
                  value={form.t1Source}
                  onChange={(e) => updateForm("t1Source", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Date / period
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., 2023-06-01 or 2023 summer composite"
                  value={form.t1Date}
                  onChange={(e) => updateForm("t1Date", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Description</div>
              <textarea
                className={styles.textareaField}
                aria-label="T1 description"
                placeholder="Describe the T₁ dataset, preprocessing, and spatial extent…"
                value={form.t1Description}
                onChange={(e) => updateForm("t1Description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Select Method */}
        {step === 2 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Select Detection Method</div>
            <p className={styles.formHint}>
              Choose the change detection method. Each method has different
              assumptions and requirements.
            </p>
            <div
              className={styles.formSection}
              role="group"
              aria-label="Change detection method"
            >
              {METHODS.map((m) => (
                <label
                  key={m}
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  <input
                    type="radio"
                    name="cdMethod"
                    checked={form.method === m}
                    onChange={() => updateForm("method", m)}
                  />{" "}
                  {m === "post_classification" &&
                    "Post-Classification Comparison — independent classification of T₀ and T₁, then transition matrix"}
                  {m === "image_differencing" &&
                    "Image Differencing — band-level subtraction with threshold"}
                  {m === "cva" &&
                    "Change Vector Analysis (CVA) — magnitude and direction in spectral space"}
                </label>
              ))}
            </div>
            {form.method === "post_classification" && (
              <div className={styles.formSection}>
                <div className={styles.formLabel}>
                  Classification Scheme
                </div>
                <p className={styles.formHint}>
                  Define the land-use / land-cover classes used in both T₀ and
                  T₁ classification.
                </p>
                {form.classificationScheme.map((cls, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Class name"
                      value={cls}
                      onChange={(e) => {
                        const next = [...form.classificationScheme];
                        next[idx] = e.target.value;
                        updateForm("classificationScheme", next);
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      onClick={() => removeClass(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={addClass}
                >
                  + Add Class
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Set Thresholds */}
        {step === 3 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Set Thresholds</div>
            <p className={styles.formHint}>
              Define the significance threshold for flagging a pixel or feature
              as changed. Values below this threshold will be treated as
              no-change.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Change threshold (%)
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.changeThreshold}
                  onChange={(e) =>
                    updateForm("changeThreshold", Number(e.target.value))
                  }
                  style={{ marginLeft: "0.5rem" }}
                />
                <span style={{ minWidth: "3rem", textAlign: "right" }}>
                  {" "}
                  {form.changeThreshold}%
                </span>
              </label>
              <p className={styles.formHint}>
                For image differencing: minimum spectral change magnitude. For
                post-classification: minimum area fraction per class.
              </p>
            </div>
          </div>
        )}

        {/* Step 5 — Compute Changes */}
        {step === 4 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Compute Changes</div>
            <p className={styles.formHint}>
              Generate the change map by applying the selected method and
              thresholds to the T₀ / T₁ dataset pair.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Configuration Summary</div>
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
                <li>
                  <strong>T₀:</strong> {form.t0Source || "(not set)"} —{" "}
                  {form.t0Date || "no date"}
                </li>
                <li>
                  <strong>T₁:</strong> {form.t1Source || "(not set)"} —{" "}
                  {form.t1Date || "no date"}
                </li>
                <li>
                  <strong>Method:</strong>{" "}
                  {form.method.replace(/_/g, " ")}
                </li>
                <li>
                  <strong>Threshold:</strong> {form.changeThreshold}%
                </li>
              </ul>
            </div>
            <button
              type="button"
              className={styles.outlineBtn}
              style={{ marginTop: "1rem" }}
              onClick={handleComputeChangeMap}
              disabled={isComputingChange}
            >
              {isComputingChange ? "Computing change scenario..." : "▶ Compute Change Map"}
            </button>

            {changeSummary ? (
              <div style={{ display: "grid", gap: 12, marginTop: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <div className={styles.readonlyBlock}>Changed share: {formatPercent(changeSummary.changedShare)}</div>
                  <div className={styles.readonlyBlock}>Changed cells: {changeSummary.changedCellCount}</div>
                  <div className={styles.readonlyBlock}>Stable cells: {changeSummary.unchangedCellCount}</div>
                </div>
                <div className={styles.readonlyBlock}>{changeSummary.spatialFocus}</div>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 6 — Accuracy Assessment */}
        {step === 5 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Accuracy Assessment</div>
            <p className={styles.formHint}>
              Validate detected changes against reference data using confusion
              matrix and stratified random sampling.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Validation sample size
                <input
                  type="number"
                  className={styles.textInput}
                  min={50}
                  max={2000}
                  step={50}
                  value={form.validationSampleSize}
                  onChange={(e) =>
                    updateForm(
                      "validationSampleSize",
                      Number(e.target.value),
                    )
                  }
                  style={{ marginLeft: "0.5rem", width: "6rem" }}
                />
              </label>
              <p className={styles.formHint}>
                Points will be drawn using stratified random sampling across
                change and no-change zones.
              </p>
            </div>
            <button
              type="button"
              className={styles.outlineBtn}
              style={{ marginTop: "1rem" }}
              onClick={() => { void handleRunValidation(); }}
              disabled={isRunningValidation}
            >
              {isRunningValidation ? "Running raster accuracy in background..." : "▶ Generate Validation Sample"}
            </button>

            {validationReport ? (
              <div style={{ display: "grid", gap: 14, marginTop: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <div className={styles.readonlyBlock}>Overall accuracy: {formatPercent(validationReport.overallAccuracy)}</div>
                  <div className={styles.readonlyBlock}>Mean F1: {formatMetric(validationReport.meanF1)}</div>
                  <div className={styles.readonlyBlock}>Mean IoU: {formatMetric(validationReport.meanIoU)}</div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Per-Class Metrics</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>Class</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>Precision</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>Recall</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>F1</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>IoU</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>Support</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationReport.perClass.map((entry) => (
                          <tr key={entry.className}>
                            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--syn-overlay-light)" }}>{entry.className}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>{formatMetric(entry.precision)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>{formatMetric(entry.recall)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>{formatMetric(entry.f1)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>{formatMetric(entry.iou)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>{entry.support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Confusion Matrix</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>Actual \ Predicted</th>
                          {validationReport.confusionMatrix.classLabels.map((label) => (
                            <th key={label} style={{ textAlign: "right", padding: "6px 8px" }}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validationReport.confusionMatrix.matrix.map((row, rowIndex) => (
                          <tr key={validationReport.confusionMatrix.classLabels[rowIndex] ?? rowIndex}>
                            <td style={{ padding: "6px 8px", borderTop: "1px solid var(--syn-overlay-light)" }}>
                              {validationReport.confusionMatrix.classLabels[rowIndex] ?? `Class ${rowIndex + 1}`}
                            </td>
                            {row.map((value, columnIndex) => (
                              <td key={`${rowIndex}-${columnIndex}`} style={{ padding: "6px 8px", textAlign: "right", borderTop: "1px solid var(--syn-overlay-light)" }}>
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 7 — Generate Output */}
        {step === 6 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Generate Output</div>
            <p className={styles.formHint}>
              Produce a change map, transition matrix, area-change statistics,
              and narrative report section.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Output title
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.outputTitle}
                  onChange={(e) => updateForm("outputTitle", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Result Summary</div>
              <div className={styles.readonlyBlock}>
                {buildOutputNarrative(form, changeSummary, validationReport)}
              </div>
            </div>

            {changeSummary ? (
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Dominant Transitions</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.5rem" }}>
                  {changeSummary.dominantTransitions.map((entry) => (
                    <div key={`${entry.from}-${entry.to}`} className={styles.readonlyBlock}>
                      <strong>{entry.from} → {entry.to}</strong>
                      <div className={styles.formHint}>{entry.count} cells · {formatPercent(entry.share)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginTop: "1rem",
              }}
            >
              <button type="button" className={styles.outlineBtn} onClick={handleDownloadChangeSummary} disabled={!changeSummary}>
                Export Change Summary
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleDownloadValidationCsv} disabled={!validationReport}>
                Download Validation CSV
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleDownloadReportSection}>
                Generate Report Section
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={handleExportJSON}
              >
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cross-panel actions */}
      <CrossPanelActions flowId="change_detection" stepLabel={STEPS[step].label} />

      {/* Navigation */}
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
          ← Previous
        </button>
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={step === MAX_STEP}
          onClick={goNext}
        >
          Next →
        </button>
      </footer>
    </section>
  );
};

export default ChangeDetectionFlow;
