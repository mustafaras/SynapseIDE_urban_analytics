import React, { useCallback, useEffect, useState } from "react";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import CrossPanelActions from "./rail/CrossPanelActions";
import {
  downloadTextFile,
  runSiteSuitabilityDemo,
  type SiteSuitabilityDemoResult,
  slugifyWorkflowOutput,
} from "./workflowDemoRuntime";

const FLOW_DEF = FLOW_DEFINITIONS.find((f) => f.id === "site_suitability")!;
const STEPS = FLOW_DEF.steps;
type StepIndex = number;

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

interface Criterion {
  id: string;
  name: string;
  weight: number;
  dataLayer: string;
}

interface SuitabilityForm {
  criteria: Criterion[];
  weightingMethod: "equal" | "rank_sum" | "ahp" | "manual";
  constraints: string[];
  monteCarloRuns: number;
  outputTitle: string;
}

const DEFAULT_CRITERIA: Criterion[] = [
  { id: "c1", name: "Proximity to Transit", weight: 0.25, dataLayer: "" },
  { id: "c2", name: "Land Use Compatibility", weight: 0.25, dataLayer: "" },
  { id: "c3", name: "Population Density", weight: 0.25, dataLayer: "" },
  { id: "c4", name: "Environmental Suitability", weight: 0.25, dataLayer: "" },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SiteSuitabilityFlow: React.FC = () => {
  const [step, setStep] = useState<StepIndex>(0);
  const { setStepData, upsertCompletedRun } = useFlowStore();
  const [result, setResult] = useState<SiteSuitabilityDemoResult | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const [form, setForm] = useState<SuitabilityForm>({
    criteria: DEFAULT_CRITERIA,
    weightingMethod: "equal",
    constraints: [],
    monteCarloRuns: 500,
    outputTitle: "Site Suitability Analysis",
  });

  useEffect(() => {
    setStepData("suitability_form", form);
  }, [form, setStepData]);

  const updateForm = useCallback(<K extends keyof SuitabilityForm>(key: K, value: SuitabilityForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setPublishMessage(null);
  }, []);

  const updateCriterion = useCallback((id: string, field: keyof Criterion, value: string | number) => {
    setForm((prev) => {
      const criteria = prev.criteria.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      );
      return { ...prev, criteria };
    });
    setPublishMessage(null);
  }, []);

  const addCriterion = useCallback(() => {
    const id = `c${Date.now()}`;
    updateForm("criteria", [...form.criteria, { id, name: "", weight: 0, dataLayer: "" }]);
  }, [form.criteria, updateForm]);

  const removeCriterion = useCallback((id: string) => {
    updateForm("criteria", form.criteria.filter((c) => c.id !== id));
  }, [form.criteria, updateForm]);

  const addConstraint = useCallback(() => {
    updateForm("constraints", [...form.constraints, ""]);
  }, [form.constraints, updateForm]);

  const handleComputeSuitability = useCallback(() => {
    const nextResult = runSiteSuitabilityDemo({
      criteria: form.criteria,
      weightingMethod: form.weightingMethod,
      constraints: form.constraints,
      monteCarloRuns: form.monteCarloRuns,
      outputTitle: form.outputTitle.trim() || "Site Suitability Analysis",
    });
    setResult(nextResult);
    setPublishMessage(null);
  }, [form]);

  const handleExportMap = useCallback(() => {
    if (!result) {
      return;
    }

    downloadTextFile(
      `${slugifyWorkflowOutput(form.outputTitle, "site-suitability")}-map.geojson`,
      JSON.stringify(result.mapOutput.geojson, null, 2),
      "application/geo+json",
    );
  }, [form.outputTitle, result]);

  const handleExportReportSection = useCallback(() => {
    if (!result) {
      return;
    }

    downloadTextFile(
      `${slugifyWorkflowOutput(form.outputTitle, "site-suitability")}-report.txt`,
      result.reportDownloadText,
    );
  }, [form.outputTitle, result]);

  const handleSaveResults = useCallback(() => {
    if (!result) {
      return;
    }

    upsertCompletedRun(result.completedRun);
    setPublishMessage("Saved suitability result to completed runs.");
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
        {/* Step 1: Define Criteria */}
        {step === 0 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Define Criteria</div>
            <p className={styles.formHint}>
              List the evaluation criteria and assign initial weights. Weights will be normalized to sum to 1.0.
            </p>
            {form.criteria.map((c) => (
              <div key={c.id} className={styles.formSection} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Criterion name"
                  value={c.name}
                  onChange={(e) => updateCriterion(c.id, "name", e.target.value)}
                  style={{ flex: 2 }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
                  Weight:
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(c.weight * 100)}
                    onChange={(e) => updateCriterion(c.id, "weight", Number(e.target.value) / 100)}
                  />
                  <span style={{ minWidth: "2.5rem", textAlign: "right" }}>{Math.round(c.weight * 100)}%</span>
                </label>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => removeCriterion(c.id)}
                  aria-label={`Remove ${c.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={styles.outlineBtn} onClick={addCriterion}>
              + Add Criterion
            </button>
          </div>
        )}

        {/* Step 2: Assign Data Layers */}
        {step === 1 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Assign Data Layers</div>
            <p className={styles.formHint}>
              Map each criterion to a dataset or layer from the project data inventory.
            </p>
            {form.criteria.map((c) => (
              <div key={c.id} className={styles.formSection}>
                <div className={styles.formLabel}>{c.name || "(unnamed criterion)"}</div>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Dataset name or layer path…"
                  value={c.dataLayer}
                  onChange={(e) => updateCriterion(c.id, "dataLayer", e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Weighting Method */}
        {step === 2 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Weighting Method</div>
            <p className={styles.formHint}>
              Select how criteria weights are determined.
            </p>
            <div className={styles.formSection} role="group" aria-label="Weighting method selection">
              {(["equal", "rank_sum", "ahp", "manual"] as const).map((method) => (
                <label key={method} style={{ display: "block", marginBottom: "0.5rem" }}>
                  <input
                    type="radio"
                    name="weightingMethod"
                    checked={form.weightingMethod === method}
                    onChange={() => updateForm("weightingMethod", method)}
                  />{" "}
                  {method === "equal" && "Equal Weights — all criteria weighted equally"}
                  {method === "rank_sum" && "Rank-Sum — weights derived from ordinal ranking"}
                  {method === "ahp" && "AHP (Analytic Hierarchy Process) — pairwise comparison matrix"}
                  {method === "manual" && "Manual — use slider values from Step 1"}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Constraint Mapping */}
        {step === 3 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Constraint Mapping</div>
            <p className={styles.formHint}>
              Define hard constraints (binary mask). Areas meeting any constraint will be excluded
              from the suitability surface regardless of score.
            </p>
            {form.constraints.map((constraint, idx) => (
              <div key={idx} className={styles.formSection} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., slope > 30°, protected area, floodplain…"
                  value={constraint}
                  onChange={(e) => {
                    const next = [...form.constraints];
                    next[idx] = e.target.value;
                    updateForm("constraints", next);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => updateForm("constraints", form.constraints.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={styles.outlineBtn} onClick={addConstraint}>
              + Add Constraint
            </button>
          </div>
        )}

        {/* Step 5: Compute */}
        {step === 4 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Compute Suitability</div>
            <p className={styles.formHint}>
              Perform weighted overlay to produce a suitability score for each cell/feature.
              The score is a normalized 0–1 composite of all weighted criteria, masked by constraints.
            </p>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Criteria Summary</div>
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
                {form.criteria.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name || "(unnamed)"}</strong> — weight: {Math.round(c.weight * 100)}%
                    {c.dataLayer ? ` → ${c.dataLayer}` : " (no layer assigned)"}
                  </li>
                ))}
              </ul>
              <div className={styles.formLabel} style={{ marginTop: "0.75rem" }}>
                Constraints: {form.constraints.length === 0 ? "None" : form.constraints.filter(Boolean).join(", ")}
              </div>
            </div>
            <button type="button" className={styles.outlineBtn} style={{ marginTop: "1rem" }} onClick={handleComputeSuitability}>
              ▶ Run Weighted Overlay
            </button>
            {result ? (
              <div className={styles.readonlyBlock} data-testid="site-suitability-summary" style={{ marginTop: "1rem" }}>
                {result.summaryText}
              </div>
            ) : null}
          </div>
        )}

        {/* Step 6: Sensitivity Analysis */}
        {step === 5 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Sensitivity Analysis</div>
            <p className={styles.formHint}>
              Perform Monte Carlo weight perturbation to test robustness of the suitability ranking.
              Each run randomly perturbs weights within ±10% and recomputes scores.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Number of Monte Carlo runs
                <input
                  type="number"
                  className={styles.textInput}
                  min={100}
                  max={10000}
                  step={100}
                  value={form.monteCarloRuns}
                  onChange={(e) => updateForm("monteCarloRuns", Number(e.target.value))}
                  style={{ marginLeft: "0.5rem", width: "6rem" }}
                />
              </label>
            </div>
            <button type="button" className={styles.outlineBtn} style={{ marginTop: "1rem" }} onClick={handleComputeSuitability}>
              ▶ Run Sensitivity Analysis ({form.monteCarloRuns} iterations)
            </button>
            {result ? (
              <div className={styles.readonlyBlock} style={{ marginTop: "1rem" }}>
                Top shortlist: {result.areaSummaries.slice(0, 3).map((entry) => `${entry.rank}. ${entry.label} (${entry.score.toFixed(1)})`).join(" | ")}
              </div>
            ) : null}
          </div>
        )}

        {/* Step 7: Generate Output */}
        {step === 6 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Generate Output</div>
            <p className={styles.formHint}>
              Produce a suitability map, summary statistics, and a narrative paragraph for the report.
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
              <div className={styles.formLabel}>Computed shortlist</div>
              <div className={styles.readonlyBlock}>
                {result ? result.reportText : "Run the weighted overlay first to populate the shortlist, sensitivity summary, and export package."}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <button type="button" className={styles.outlineBtn} onClick={handleExportMap} disabled={!result}>Export Map</button>
              <button type="button" className={styles.outlineBtn} onClick={handleExportReportSection} disabled={!result}>Generate Report Section</button>
              <button type="button" className={styles.outlineBtn} onClick={handleSaveResults} disabled={!result}>Save Results</button>
            </div>
            {publishMessage ? (
              <div className={styles.readonlyBlock} data-testid="site-suitability-save-status" style={{ marginTop: "1rem" }}>
                {publishMessage}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Cross-panel actions */}
      <CrossPanelActions flowId="site_suitability" stepLabel={STEPS[step].label} />

      {/* Navigation */}
      <footer className={styles.flowFooter} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem" }}>
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

export default SiteSuitabilityFlow;
