import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useFlowStore } from "@/stores/useFlowStore";
import {
 buildRunReviewSummary,
 downloadJSON,
 exportFlowJSON,
 restoreFormState,
} from "./flowUtils";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildCompletedRunNarrativeInput } from "./narrativeBuilders";

const FLOW_DEF = FLOW_DEFINITIONS.find((f) => f.id === "review")!;
const STEPS = FLOW_DEF.steps;

/* ------------------------------------------------------------------ */
/* Form state */
/* ------------------------------------------------------------------ */

const QUALITY_FLAGS = [
 "Data quality verified",
 "Methodology appropriate",
 "Results reviewed",
 "Uncertainties documented",
 "Reproducible",
 "Peer-reviewed",
] as const;

interface ReviewForm {
 selectedRunId: string;
 selectedRunLabel: string;
 annotations: string;
 qualityFlags: string[];
 exportFormat: "json" | "pdf" | "csv";
}

const FORM_KEY = "run_review_form";

const DEFAULT_FORM: ReviewForm = {
 selectedRunId: "",
 selectedRunLabel: "",
 annotations: "",
 qualityFlags: [],
 exportFormat: "json",
};

const clamp = (n: number, min: number, max: number) =>
 Math.max(min, Math.min(max, n));

function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
 const blob = new Blob([content], { type });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = filename;
 anchor.click();
 URL.revokeObjectURL(url);
}

function buildReviewCsv(form: ReviewForm, selectedRunLabel: string | null): string {
 const rows = [
 ["selectedRunId", form.selectedRunId],
 ["selectedRunLabel", selectedRunLabel ?? form.selectedRunLabel],
 ["annotations", form.annotations],
 ["qualityFlags", form.qualityFlags.join(" | ")],
 ["exportFormat", form.exportFormat],
 ];

 return [
 "field,value",
 ...rows.map(([field, value]) => `"${field}","${String(value).replace(/"/g, '""')}"`),
 ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

const AnalyticalRunReviewFlow: React.FC = () => {
 const [step, setStep] = useState(0);
 const { setStepData, stepData, completedRuns } = useFlowStore();

 const [form, setForm] = useState<ReviewForm>(() =>
 restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
 );

 useEffect(() => {
 setStepData(FORM_KEY, form);
 }, [form, setStepData]);

 const updateForm = useCallback(
 <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => {
 setForm((prev) => {
 return { ...prev, [key]: value };
 });
 },
 [],
 );

 const toggleQualityFlag = useCallback(
 (flag: string) => {
 const next = form.qualityFlags.includes(flag)
 ? form.qualityFlags.filter((f) => f !== flag)
 : [...form.qualityFlags, flag];
 updateForm("qualityFlags", next);
 },
 [form.qualityFlags, updateForm],
 );

 const selectedRun = useMemo(
 () => completedRuns.find((r) => r.runId === form.selectedRunId),
 [completedRuns, form.selectedRunId],
 );
 const selectedRunNarrativeInput = useMemo(
 () => (selectedRun ? buildCompletedRunNarrativeInput(selectedRun) : null),
 [selectedRun],
 );

 const handleExport = useCallback(() => {
 const payload = exportFlowJSON(
 "review",
 form as unknown as Record<string, unknown>,
 {
 summary: buildRunReviewSummary(form),
 ...(selectedRun
 ? {
 originalRun: {
 flowId: selectedRun.flowId,
 label: selectedRun.label,
 insertedAt: selectedRun.insertedAt,
 paragraph: selectedRun.paragraph,
 },
 }
 : {}),
 },
 );

 if (form.exportFormat === "csv") {
 downloadTextFile(
 `${(form.selectedRunLabel || selectedRun?.label || "review").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-review.csv`,
 buildReviewCsv(form, selectedRun?.label ?? null),
 "text/csv;charset=utf-8",
 );
 return;
 }

 if (form.exportFormat === "pdf") {
 window.print();
 return;
 }

 downloadJSON(payload);
 }, [form, selectedRun]);

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
 {/* Step 1 — Select Run */}
 {step === 0 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Select Run</div>
 <p className={styles.formHint}>
 Choose a completed analytical run from this session to review.
 </p>
 {completedRuns.length === 0 ? (
 <p style={{ opacity: 0.7, padding: "0.5rem 0" }}>
 No completed runs in this session yet. Complete an analytical
 flow first.
 </p>
 ) : (
 <div className={styles.formSection}>
 {completedRuns.map((run) => (
 <label
 key={run.runId}
 style={{
 display: "flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "0.5rem",
 padding: "0.5rem",
 border: "1px solid var(--syn-overlay-light)",
 borderRadius: "6px",
 cursor: "pointer",
 background:
 form.selectedRunId === run.runId
 ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)"
 : undefined,
 }}
 >
 <input
 type="radio"
 name="selectedRun"
 checked={form.selectedRunId === run.runId}
 onChange={() => {
 updateForm("selectedRunId", run.runId);
 updateForm("selectedRunLabel", run.label);
 }}
 />
 <div>
 <div style={{ fontWeight: 600, fontSize: "12px" }}>
 {run.label}
 </div>
 <div
 style={{
 fontSize: "10px",
 color: "var(--syn-text-muted)",
 }}
 >
 {run.flowId} — {run.insertedAt}
 </div>
 </div>
 </label>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Step 2 — Inspect Outputs */}
 {step === 1 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Inspect Outputs</div>
 <p className={styles.formHint}>
 Review the outputs produced by the selected run including maps,
 charts, and data tables.
 </p>
 {selectedRun ? (
 <div className={styles.formSection}>
 <div className={styles.formLabel}>
 {selectedRun.label}
 </div>
 <div className={styles.readonlyBlock}>
 {selectedRun.paragraphFull ||
 selectedRun.paragraph ||
 "(no narrative generated)"}
 </div>
 {selectedRun.mapOutputs.length > 0 && (
 <div style={{ marginTop: "0.5rem" }}>
 <div className={styles.formLabel}>
 Map Outputs ({selectedRun.mapOutputs.length})
 </div>
 <ul
 style={{
 paddingLeft: "1.25rem",
 margin: "0.25rem 0",
 }}
 >
 {selectedRun.mapOutputs.map((m) => (
 <li key={m.id}>
 {m.layerName} — {m.type}
 </li>
 ))}
 </ul>
 </div>
 )}
 {selectedRun.chartOutputs.length > 0 && (
 <div style={{ marginTop: "0.5rem" }}>
 <div className={styles.formLabel}>
 Chart Outputs ({selectedRun.chartOutputs.length})
 </div>
 <ul
 style={{
 paddingLeft: "1.25rem",
 margin: "0.25rem 0",
 }}
 >
 {selectedRun.chartOutputs.map((c) => (
 <li key={c.id}>
 {c.title} ({c.type})
 </li>
 ))}
 </ul>
 </div>
 )}
 {selectedRun.dataOutputs.length > 0 && (
 <div style={{ marginTop: "0.5rem" }}>
 <div className={styles.formLabel}>
 Data Outputs ({selectedRun.dataOutputs.length})
 </div>
 <ul
 style={{
 paddingLeft: "1.25rem",
 margin: "0.25rem 0",
 }}
 >
 {selectedRun.dataOutputs.map((d) => (
 <li key={d.id}>
 {d.format} — {d.rows} rows, {d.columns.length}{" "}
 columns
 </li>
 ))}
 </ul>
 </div>
 )}
 <div style={{ marginTop: "1rem" }}>
 <NarrativeGenerationPanel input={selectedRunNarrativeInput ?? undefined} subject={selectedRun.label} />
 </div>
 </div>
 ) : (
 <p style={{ opacity: 0.7, padding: "0.5rem 0" }}>
 No run selected. Go back to Step 1 to select a completed run.
 </p>
 )}
 </div>
 )}

 {/* Step 3 — Annotate */}
 {step === 2 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Annotate</div>
 <p className={styles.formHint}>
 Add notes, observations, and quality flags to the selected run.
 These annotations will be included in exports.
 </p>
 <div className={styles.formSection}>
 <div className={styles.formLabel}>Reviewer Notes</div>
 <textarea
 className={styles.textareaField}
 aria-label="Reviewer Notes"
 placeholder="Document observations, methodology concerns, data quality notes, or recommendations…"
 value={form.annotations}
 onChange={(e) => updateForm("annotations", e.target.value)}
 rows={5}
 />
 </div>
 <div className={styles.formSection}>
 <div className={styles.formLabel}>Quality Flags</div>
 {QUALITY_FLAGS.map((flag) => (
 <label
 key={flag}
 className={styles.checkboxRow}
 style={{ marginBottom: "0.25rem" }}
 >
 <input
 type="checkbox"
 checked={form.qualityFlags.includes(flag)}
 onChange={() => toggleQualityFlag(flag)}
 />
 {flag}
 </label>
 ))}
 </div>
 </div>
 )}

 {/* Step 4 — Export */}
 {step === 3 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Export</div>
 <p className={styles.formHint}>
 Export the reviewed run with annotations and quality assessments.
 </p>
 <div
 className={styles.formSection}
 role="group"
 aria-label="Export format"
 >
 {(["json", "pdf", "csv"] as const).map((fmt) => (
 <label
 key={fmt}
 style={{ display: "block", marginBottom: "0.5rem" }}
 >
 <input
 type="radio"
 name="exportFormat"
 checked={form.exportFormat === fmt}
 onChange={() => updateForm("exportFormat", fmt)}
 />{" "}
 {fmt === "json" && "JSON — full structured export with metadata"}
 {fmt === "pdf" && "PDF — formatted report document"}
 {fmt === "csv" && "CSV — tabular data export"}
 </label>
 ))}
 </div>
 <div className={styles.formSection}>
 <div className={styles.formLabel}>Export Preview</div>
 <div className={styles.readonlyBlock}>
 {buildRunReviewSummary(form)}
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
 <button
 type="button"
 className={styles.outlineBtn}
 onClick={handleExport}
 >
 Export {form.exportFormat.toUpperCase()}
 </button>
 </div>
 </div>
 )}
 </div>

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

export default AnalyticalRunReviewFlow;
