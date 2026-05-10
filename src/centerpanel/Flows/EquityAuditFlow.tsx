import React, { useCallback, useEffect, useState } from "react";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import {
  buildEquityAuditSummary,
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "./flowUtils";
import CrossPanelActions from "./rail/CrossPanelActions";
import {
  downloadTextFile,
  type EquityAuditDemoResult,
  runEquityAuditDemo,
  slugifyWorkflowOutput,
} from "./workflowDemoRuntime";

const FLOW_DEF = FLOW_DEFINITIONS.find((f) => f.id === "equity_audit")!;
const STEPS = FLOW_DEF.steps;

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

const DEMOGRAPHIC_DIMS = [
  "Income",
  "Race / Ethnicity",
  "Age",
  "Gender",
  "Disability Status",
  "Household Composition",
  "Housing Tenure",
  "Education Level",
] as const;

const EQUITY_MEASURES = ["gini", "theil", "atkinson", "spatial"] as const;
const SPATIAL_UNITS = ["tract", "block", "neighborhood", "district"] as const;

interface EquityForm {
  demographicSource: string;
  demographicDimensions: string[];
  serviceLayer: string;
  serviceType: string;
  importedFacilityRunId: string;
  spatialUnit: (typeof SPATIAL_UNITS)[number];
  equityMeasure: (typeof EQUITY_MEASURES)[number];
  atkinsonEpsilon: number;
  gapThreshold: number;
  outputTitle: string;
}

const FORM_KEY = "equity_audit_form";

const DEFAULT_FORM: EquityForm = {
  demographicSource: "",
  demographicDimensions: [],
  serviceLayer: "",
  serviceType: "",
  importedFacilityRunId: "",
  spatialUnit: "neighborhood",
  equityMeasure: "gini",
  atkinsonEpsilon: 0.5,
  gapThreshold: 0.2,
  outputTitle: "Equity Audit Report",
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const EquityAuditFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const { setStepData, stepData, completedRuns, upsertCompletedRun } = useFlowStore();
  const [result, setResult] = useState<EquityAuditDemoResult | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const [form, setForm] = useState<EquityForm>(() =>
    restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
  );
  const facilityRuns = completedRuns.filter(
    (run) => run.flowId === "facility_optimisation",
  );
  const importedFacilityRun = facilityRuns.find(
    (run) => run.runId === form.importedFacilityRunId,
  );

  useEffect(() => {
    setStepData(FORM_KEY, form);
  }, [form, setStepData]);

  const updateForm = useCallback(
    <K extends keyof EquityForm>(key: K, value: EquityForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setPublishMessage(null);
    },
    [],
  );

  const toggleDemographic = useCallback(
    (dim: string) => {
      const next = form.demographicDimensions.includes(dim)
        ? form.demographicDimensions.filter((d) => d !== dim)
        : [...form.demographicDimensions, dim];
      updateForm("demographicDimensions", next);
    },
    [form.demographicDimensions, updateForm],
  );

  const handleExportJSON = useCallback(() => {
    const payload = exportFlowJSON(
      "equity_audit",
      form as unknown as Record<string, unknown>,
      result ? {
        summary: result.summaryText,
        measureValue: result.measureValue,
        equityRows: result.areaSummaries,
      } : { summary: buildEquityAuditSummary(form) },
    );
    downloadJSON(payload);
  }, [form, result]);

  const importFacilityRun = useCallback(
    (run: CompletedAnalysisRun) => {
      const next: EquityForm = {
        ...form,
        demographicSource: "Imported from facility optimisation assignments",
        serviceLayer: run.label,
        serviceType: "facility optimisation scenario",
        importedFacilityRunId: run.runId,
      };
      setForm(next);
      setPublishMessage(null);
    },
    [form],
  );

  const handleComputeEquity = useCallback(() => {
    const nextResult = runEquityAuditDemo({
      demographicSource: form.demographicSource,
      demographicDimensions: form.demographicDimensions,
      serviceLayer: form.serviceLayer,
      serviceType: form.serviceType,
      importedFacilityRunId: form.importedFacilityRunId,
      spatialUnit: form.spatialUnit,
      equityMeasure: form.equityMeasure,
      atkinsonEpsilon: form.atkinsonEpsilon,
      gapThreshold: form.gapThreshold,
      outputTitle: form.outputTitle.trim() || "Equity Audit Report",
    });
    setResult(nextResult);
    setPublishMessage(null);
  }, [form]);

  const handleExportMap = useCallback(() => {
    if (!result) {
      return;
    }

    downloadTextFile(
      `${slugifyWorkflowOutput(form.outputTitle, "equity-audit")}-map.geojson`,
      JSON.stringify(result.mapOutput.geojson, null, 2),
      "application/geo+json",
    );
  }, [form.outputTitle, result]);

  const handleExportReportSection = useCallback(() => {
    if (!result) {
      return;
    }

    downloadTextFile(
      `${slugifyWorkflowOutput(form.outputTitle, "equity-audit")}-report.txt`,
      result.reportDownloadText,
    );
  }, [form.outputTitle, result]);

  const handleSaveAuditRun = useCallback(() => {
    if (!result) {
      return;
    }

    upsertCompletedRun(result.completedRun);
    setPublishMessage("Saved equity audit result to completed runs.");
  }, [result, upsertCompletedRun]);

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
        {/* Step 1 — Load Demographics */}
        {step === 0 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Load Demographics</div>
            <p className={styles.formHint}>
              Specify the demographic data source and select the dimensions to
              disaggregate in the equity analysis.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Demographic data source
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Census 2021, ACS 5-year, survey…"
                  value={form.demographicSource}
                  onChange={(e) =>
                    updateForm("demographicSource", e.target.value)
                  }
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>
                Disaggregation dimensions
              </div>
              {DEMOGRAPHIC_DIMS.map((dim) => (
                <label
                  key={dim}
                  className={styles.checkboxRow}
                  style={{ marginBottom: "0.25rem" }}
                >
                  <input
                    type="checkbox"
                    checked={form.demographicDimensions.includes(dim)}
                    onChange={() => toggleDemographic(dim)}
                  />
                  {dim}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Define Service Layer */}
        {step === 1 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Define Service Layer</div>
            <p className={styles.formHint}>
              Identify the urban service or amenity being audited for equitable
              distribution.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>
                Import completed facility optimisation results
              </div>
              {facilityRuns.length === 0 ? (
                <div className={styles.readonlyBlock}>
                  No completed facility optimisation runs are available yet.
                  Run the Facility Optimisation workflow to import a service
                  configuration and equity-ready coverage records here.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {facilityRuns.map((run) => {
                    const bridgePreview = run.dataOutputs.find(
                      (output) => output.format === "equity-audit-bridge",
                    );
                    return (
                      <div
                        key={run.runId}
                        style={{
                          border: "1px solid var(--syn-overlay-light)",
                          borderRadius: "6px",
                          padding: "0.75rem",
                          background: "var(--syn-overlay-whisper)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--syn-text-primary)",
                              }}
                            >
                              {run.label}
                            </div>
                            <div className={styles.formHint}>{run.paragraphPreview}</div>
                          </div>
                          <button
                            type="button"
                            className={styles.outlineBtn}
                            onClick={() => importFacilityRun(run)}
                          >
                            Import run
                          </button>
                        </div>
                        {bridgePreview ? (
                          <div className={styles.formHint} style={{ marginTop: "0.5rem" }}>
                            Equity-ready rows: {bridgePreview.rows}. Preview fields: {bridgePreview.columns.join(", ")}.
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Service / amenity layer
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., Public parks, Health clinics, Schools…"
                  value={form.serviceLayer}
                  onChange={(e) => updateForm("serviceLayer", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Service type
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., amenity, hazard, infrastructure…"
                  value={form.serviceType}
                  onChange={(e) => updateForm("serviceType", e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>
            {importedFacilityRun ? (
              <div className={styles.formSection}>
                <div className={styles.readonlyBlock}>
                  Imported facility run: {importedFacilityRun.label}
                  {"\n"}Available outputs: {importedFacilityRun.dataOutputs.map((output) => output.format).join(", ")}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 3 — Spatial Units */}
        {step === 2 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Select Spatial Units</div>
            <p className={styles.formHint}>
              Choose the geographic unit at which equity will be measured.
            </p>
            <div
              className={styles.formSection}
              role="group"
              aria-label="Spatial unit selection"
            >
              {SPATIAL_UNITS.map((u) => (
                <label
                  key={u}
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  <input
                    type="radio"
                    name="spatialUnit"
                    checked={form.spatialUnit === u}
                    onChange={() => updateForm("spatialUnit", u)}
                  />{" "}
                  {u === "tract" && "Census Tract"}
                  {u === "block" && "Block Group"}
                  {u === "neighborhood" && "Neighborhood / Ward"}
                  {u === "district" && "District / Borough"}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Equity Measure */}
        {step === 3 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Select Equity Measure</div>
            <p className={styles.formHint}>
              Choose the inequality or disparity metric. Each metric captures
              different aspects of distributional fairness.
            </p>
            <div
              className={styles.formSection}
              role="group"
              aria-label="Equity measure"
            >
              {EQUITY_MEASURES.map((m) => (
                <label
                  key={m}
                  style={{ display: "block", marginBottom: "0.5rem" }}
                >
                  <input
                    type="radio"
                    name="equityMeasure"
                    checked={form.equityMeasure === m}
                    onChange={() => updateForm("equityMeasure", m)}
                  />{" "}
                  {m === "gini" && "Gini Coefficient — classic inequality index [0, 1]"}
                  {m === "theil" &&
                    "Theil Index — entropy-based, decomposable by subgroups"}
                  {m === "atkinson" &&
                    "Atkinson Index — inequality aversion parameter ε"}
                  {m === "spatial" &&
                    "Spatial Concentration — location quotient + Moran's I"}
                </label>
              ))}
            </div>
            {form.equityMeasure === "atkinson" && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  Inequality aversion (ε)
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={Math.round(form.atkinsonEpsilon * 100)}
                    onChange={(e) =>
                      updateForm(
                        "atkinsonEpsilon",
                        Number(e.target.value) / 100,
                      )
                    }
                    style={{ marginLeft: "0.5rem" }}
                  />
                  <span style={{ minWidth: "3rem", textAlign: "right" }}>
                    {" "}
                    {form.atkinsonEpsilon.toFixed(2)}
                  </span>
                </label>
                <p className={styles.formHint}>
                  Higher ε places more weight on inequality at the bottom of
                  the distribution.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5 — Compute */}
        {step === 4 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>
              Compute Equity Scores
            </div>
            <p className={styles.formHint}>
              Calculate disaggregated equity scores for each spatial unit across
              all selected demographic dimensions.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Configuration Summary</div>
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
                <li>
                  <strong>Service:</strong>{" "}
                  {form.serviceLayer || "(not specified)"}
                </li>
                <li>
                  <strong>Spatial unit:</strong> {form.spatialUnit}
                </li>
                <li>
                  <strong>Measure:</strong> {form.equityMeasure}
                  {form.equityMeasure === "atkinson"
                    ? ` (ε = ${form.atkinsonEpsilon})`
                    : ""}
                </li>
                <li>
                  <strong>Dimensions:</strong>{" "}
                  {form.demographicDimensions.join(", ") || "none"}
                </li>
              </ul>
            </div>
            <button
              type="button"
              className={styles.outlineBtn}
              style={{ marginTop: "1rem" }}
              onClick={handleComputeEquity}
            >
              ▶ Compute Equity Scores
            </button>
            {result ? (
              <div className={styles.readonlyBlock} data-testid="equity-audit-summary" style={{ marginTop: "1rem" }}>
                {result.summaryText}
              </div>
            ) : null}
          </div>
        )}

        {/* Step 6 — Gap Identification */}
        {step === 5 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Gap Identification</div>
            <p className={styles.formHint}>
              Identify under-served areas and populations based on equity scores.
              The gap threshold determines which units are flagged.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Gap threshold (0–1)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(form.gapThreshold * 100)}
                  onChange={(e) =>
                    updateForm("gapThreshold", Number(e.target.value) / 100)
                  }
                  style={{ marginLeft: "0.5rem" }}
                />
                <span style={{ minWidth: "3rem", textAlign: "right" }}>
                  {" "}
                  {form.gapThreshold.toFixed(2)}
                </span>
              </label>
              <p className={styles.formHint}>
                Spatial units with equity scores below this threshold will be
                classified as under-served.
              </p>
            </div>
            {result ? (
              <div className={styles.readonlyBlock} style={{ marginTop: "1rem" }}>
                Under-served units: {result.areaSummaries.filter((entry) => entry.flaggedGap).length} of {result.areaSummaries.length}. Strongest-performing unit: {result.areaSummaries[0]?.label ?? "n/a"}.
              </div>
            ) : null}
          </div>
        )}

        {/* Step 7 — Generate Output */}
        {step === 6 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Generate Output</div>
            <p className={styles.formHint}>
              Produce an equity map, disparity summary, and narrative report
              section.
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
                {result ? result.reportText : buildEquityAuditSummary(form)}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginTop: "1rem",
              }}
            >
              <button type="button" className={styles.outlineBtn} onClick={handleExportMap} disabled={!result}>
                Export Equity Map
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleExportReportSection} disabled={!result}>
                Generate Report Section
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={handleExportJSON}
                disabled={!result}
              >
                Export JSON
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleSaveAuditRun} disabled={!result}>
                Save Audit Run
              </button>
            </div>
            {publishMessage ? (
              <div className={styles.readonlyBlock} data-testid="equity-audit-save-status" style={{ marginTop: "1rem" }}>
                {publishMessage}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Cross-panel actions */}
      <CrossPanelActions flowId="equity_audit" stepLabel={STEPS[step].label} />

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

export default EquityAuditFlow;
