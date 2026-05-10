import React, { useCallback, useEffect, useState } from "react";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import styles from "../styles/flows.module.css";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { MAP_ANALYSIS_DISPATCH_KEY, clearQueuedMapDispatch, type MapAnalysisDispatchPayload } from "@/services/map/MapAnalysisDispatcher";
import { buildFeatureCollectionMetadata } from "@/services/map/MapDataImporter";
import CrossPanelActions from "./rail/CrossPanelActions";
import {
	type AccessibilityDemoResult,
	downloadTextFile,
	runAccessibilityDemo,
	slugifyWorkflowOutput,
} from "./workflowDemoRuntime";

const FLOW_DEF = FLOW_DEFINITIONS.find((f) => f.id === "accessibility")!;
const STEPS = FLOW_DEF.steps;

/* ------------------------------------------------------------------ */
/* Form state */
/* ------------------------------------------------------------------ */

type TravelMode = "walk" | "cycle" | "transit" | "drive";

const POI_CATEGORIES = [
 "grocery",
 "restaurant",
 "school",
 "healthcare",
 "park",
 "pharmacy",
 "bank",
 "library",
 "childcare",
 "transit_stop",
 "employment",
 "retail",
] as const;

type PoiCategory = (typeof POI_CATEGORIES)[number];

type EquityDimension = "income" | "race" | "age" | "disability" | "none";

interface AccessibilityForm {
 mode: TravelMode;
 thresholdMinutes: number;
 selectedPOIs: Set<PoiCategory>;
 populationWeighting: boolean;
 equityDimension: EquityDimension;
 outputTitle: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function createAccessibilityMapLayer(result: AccessibilityDemoResult, requestId: string): OverlayLayerConfig {
 const geojson = result.mapOutput.geojson as FeatureCollection<Geometry, GeoJsonProperties>;
 const metadata = buildFeatureCollectionMetadata(geojson);
 const geometryType = metadata.geometryType?.toLowerCase() ?? "";
 const style = geometryType.includes("line")
	? {
	 "line-color": "#f59e0b",
	 "line-width": 3,
	 "line-opacity": 0.9,
	}
	: geometryType.includes("point")
	 ? {
		"circle-color": "#f59e0b",
		"circle-radius": 6,
		"circle-opacity": 0.9,
		"circle-stroke-color": "#111827",
		"circle-stroke-width": 1.5,
	 }
	 : {
		"fill-color": "#f59e0b",
		"fill-opacity": 0.22,
		"fill-outline-color": "#fbbf24",
	 };

 return {
	id: `${result.mapOutput.id}-${requestId.slice(-8)}`,
	name: `${result.mapOutput.title} · Map Dispatch`,
	type: "geojson",
	visible: true,
	opacity: 0.95,
	sourceData: geojson,
	style,
	metadata: {
	 ...metadata,
	 updatedAt: new Date().toISOString(),
	 dataVersion: requestId,
	},
	provenance: {
	 label: "Accessibility workflow dispatch",
	 method: "Workflow demo runtime from map-origin request",
	 notes: [result.summaryText],
	},
	queryable: true,
	sourceKind: "derived",
	group: "analysis",
 };
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

const AccessibilityFlow: React.FC = () => {
 const [step, setStep] = useState(0);
 const { setStepData, upsertCompletedRun, stepData } = useFlowStore();
 const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
 const openMap = useMapExplorerStore((state) => state.open);
 const [result, setResult] = useState<AccessibilityDemoResult | null>(null);
 const [publishMessage, setPublishMessage] = useState<string | null>(null);
 const queuedDispatch = stepData[MAP_ANALYSIS_DISPATCH_KEY] as MapAnalysisDispatchPayload | null;

 const [form, setForm] = useState<AccessibilityForm>({
 mode: "walk",
 thresholdMinutes: 15,
 selectedPOIs: new Set(["grocery", "school", "healthcare", "park"]),
 populationWeighting: false,
 equityDimension: "none",
 outputTitle: "Accessibility Analysis",
 });

 useEffect(() => {
 setStepData("accessibility_form", {
 ...form,
 selectedPOIs: Array.from(form.selectedPOIs),
 });
 }, [form, setStepData]);

 useEffect(() => {
 if (!queuedDispatch || queuedDispatch.kind !== "isochrone") {
 return;
 }

 const nextForm: AccessibilityForm = {
 mode: "walk",
 thresholdMinutes: queuedDispatch.thresholdMinutes,
 selectedPOIs: new Set(["grocery", "school", "healthcare", "transit_stop"]),
 populationWeighting: false,
 equityDimension: "none",
 outputTitle: `Isochrone ${queuedDispatch.thresholdMinutes} min`,
 };
 const nextResult = runAccessibilityDemo({
 mode: nextForm.mode,
 thresholdMinutes: nextForm.thresholdMinutes,
 selectedPOIs: Array.from(nextForm.selectedPOIs),
 populationWeighting: nextForm.populationWeighting,
 equityDimension: nextForm.equityDimension,
 outputTitle: nextForm.outputTitle,
 });

 setForm(nextForm);
 setResult(nextResult);
 addOverlayLayer(createAccessibilityMapLayer(nextResult, queuedDispatch.requestId));
 upsertCompletedRun(nextResult.completedRun);
 setPublishMessage("Published map-dispatch isochrone to Map Explorer and saved the workflow run.");
 setStep(MAX_STEP);
 openMap();
 clearQueuedMapDispatch();
 }, [addOverlayLayer, openMap, queuedDispatch, upsertCompletedRun]);

 const updateForm = useCallback(<K extends keyof AccessibilityForm>(key: K, value: AccessibilityForm[K]) => {
 setForm((prev) => {
 return { ...prev, [key]: value };
 });
 setPublishMessage(null);
 }, []);

 const togglePOI = useCallback((cat: PoiCategory) => {
 setForm((prev) => {
 const next = new Set(prev.selectedPOIs);
 if (next.has(cat)) next.delete(cat);
 else next.add(cat);
 return { ...prev, selectedPOIs: next };
 });
 setPublishMessage(null);
 }, []);

 const handleComputeAccessibility = useCallback(() => {
 const nextResult = runAccessibilityDemo({
 mode: form.mode,
 thresholdMinutes: form.thresholdMinutes,
 selectedPOIs: Array.from(form.selectedPOIs),
 populationWeighting: form.populationWeighting,
 equityDimension: form.equityDimension,
 outputTitle: form.outputTitle.trim() || "Accessibility Analysis",
 });
 setResult(nextResult);
 setPublishMessage(null);
 }, [form]);

 const handleExportMap = useCallback(() => {
 if (!result) {
 return;
 }

 downloadTextFile(
 `${slugifyWorkflowOutput(form.outputTitle, "accessibility")}-isochrones.geojson`,
 JSON.stringify(result.mapOutput.geojson, null, 2),
 "application/geo+json",
 );
 }, [form.outputTitle, result]);

 const handleExportReportSection = useCallback(() => {
 if (!result) {
 return;
 }

 downloadTextFile(
 `${slugifyWorkflowOutput(form.outputTitle, "accessibility")}-report.txt`,
 result.reportDownloadText,
 );
 }, [form.outputTitle, result]);

 const handleSaveResults = useCallback(() => {
 if (!result) {
 return;
 }

 upsertCompletedRun(result.completedRun);
 setPublishMessage("Saved accessibility result to completed runs.");
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
 {/* Step 1: Select Mode */}
 {step === 0 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Select Travel Mode</div>
 <p className={styles.formHint}>
 Choose the primary travel mode for accessibility computation.
 Network impedance and speed assumptions differ by mode.
 </p>
 <div className={styles.formSection} role="group" aria-label="Travel mode">
 {(["walk", "cycle", "transit", "drive"] as const).map((m) => (
 <label key={m} style={{ display: "block", marginBottom: "0.5rem" }}>
 <input
 type="radio"
 name="travelMode"
 checked={form.mode === m}
 onChange={() => updateForm("mode", m)}
 />{" "}
 {m === "walk" && " Walk (avg 5 km/h, network-based)"}
 {m === "cycle" && " Cycle (avg 15 km/h, LTS-filtered network)"}
 {m === "transit" && " Transit (GTFS schedule, walk + ride)"}
 {m === "drive" && " Drive (road network, speed limits)"}
 </label>
 ))}
 </div>
 </div>
 )}

 {/* Step 2: Set Threshold */}
 {step === 1 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Set Travel-Time Threshold</div>
 <p className={styles.formHint}>
 Maximum travel time in minutes. The isochrone and cumulative-opportunity
 analysis will be bounded by this threshold.
 </p>
 <div className={styles.formSection}>
 <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
 Threshold (minutes):
 <input
 type="range"
 min={5}
 max={60}
 step={5}
 value={form.thresholdMinutes}
 onChange={(e) => updateForm("thresholdMinutes", Number(e.target.value))}
 />
 <span style={{ minWidth: "3rem", fontWeight: 600 }}>{form.thresholdMinutes} min</span>
 </label>
 <div className={styles.formHint} style={{ marginTop: "0.5rem" }}>
 Common thresholds: 15 min (15-minute city), 30 min (transit planning), 45 min (commute standard).
 </div>
 </div>
 </div>
 )}

 {/* Step 3: Select POI Categories */}
 {step === 2 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Select POI Categories</div>
 <p className={styles.formHint}>
 Choose which amenity categories to include in the accessibility analysis.
 Points of Interest are sourced from OpenStreetMap or custom datasets.
 </p>
 <div className={styles.formSection} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
 {POI_CATEGORIES.map((cat) => (
 <label
 key={cat}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.25rem",
 padding: "0.3rem 0.6rem",
 borderRadius: "4px",
 border: form.selectedPOIs.has(cat) ? "1px solid var(--accent, #4dabf7)" : "1px solid var(--border, #444)",
 background: form.selectedPOIs.has(cat) ? "rgba(77, 171, 247, 0.1)" : "transparent",
 cursor: "pointer",
 }}
 >
 <input
 type="checkbox"
 checked={form.selectedPOIs.has(cat)}
 onChange={() => togglePOI(cat)}
 style={{ marginRight: "0.25rem" }}
 />
 {cat.replace(/_/g, " ")}
 </label>
 ))}
 </div>
 </div>
 )}

 {/* Step 4: Population Weighting */}
 {step === 3 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Population Weighting</div>
 <p className={styles.formHint}>
 Optionally weight accessibility scores by population density.
 This produces demand-weighted metrics reflecting how many people are served.
 </p>
 <div className={styles.formSection} role="group">
 <label style={{ display: "block", marginBottom: "0.5rem" }}>
 <input
 type="radio"
 name="popWeight"
 checked={!form.populationWeighting}
 onChange={() => updateForm("populationWeighting", false)}
 />{" "}
 Unweighted — equal weight per spatial unit
 </label>
 <label style={{ display: "block", marginBottom: "0.5rem" }}>
 <input
 type="radio"
 name="popWeight"
 checked={form.populationWeighting}
 onChange={() => updateForm("populationWeighting", true)}
 />{" "}
 Population-weighted — scores scaled by residential population
 </label>
 </div>
 </div>
 )}

 {/* Step 5: Equity Disaggregation */}
 {step === 4 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Equity Disaggregation</div>
 <p className={styles.formHint}>
 Optionally disaggregate results by demographic dimension to identify
 accessibility inequities across population groups.
 </p>
 <div className={styles.formSection} role="group" aria-label="Equity disaggregation">
 {(["none", "income", "race", "age", "disability"] as const).map((dim) => (
 <label key={dim} style={{ display: "block", marginBottom: "0.5rem" }}>
 <input
 type="radio"
 name="equityDim"
 checked={form.equityDimension === dim}
 onChange={() => updateForm("equityDimension", dim)}
 />{" "}
 {dim === "none" && "No disaggregation"}
 {dim === "income" && "By income quintile"}
 {dim === "race" && "By race / ethnicity"}
 {dim === "age" && "By age group (youth / working-age / elderly)"}
 {dim === "disability" && "By disability status"}
 </label>
 ))}
 </div>
 </div>
 )}

 {/* Step 6: Compute Isochrones */}
 {step === 5 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Compute Isochrones</div>
 <p className={styles.formHint}>
 Generate travel-time contours and compute cumulative opportunity counts
 within the threshold.
 </p>
 <div className={styles.formSection}>
 <div className={styles.formLabel}>Configuration Summary</div>
 <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem" }}>
 <li><strong>Mode:</strong> {form.mode}</li>
 <li><strong>Threshold:</strong> {form.thresholdMinutes} minutes</li>
 <li><strong>POI categories:</strong> {Array.from(form.selectedPOIs).join(", ") || "none selected"}</li>
 <li><strong>Population weighting:</strong> {form.populationWeighting ? "yes" : "no"}</li>
 <li><strong>Equity dimension:</strong> {form.equityDimension}</li>
 </ul>
 </div>
 <button type="button" className={styles.outlineBtn} style={{ marginTop: "1rem" }} onClick={handleComputeAccessibility}>
 ▶ Compute Isochrones
 </button>
 {result ? (
 <div className={styles.readonlyBlock} data-testid="accessibility-summary" style={{ marginTop: "1rem" }}>
 {result.summaryText}
 </div>
 ) : null}
 </div>
 )}

 {/* Step 7: Generate Output */}
 {step === 6 && (
 <div className={styles.stepContentCard}>
 <div className={styles.stepCardTitle}>Generate Output</div>
 <p className={styles.formHint}>
 Produce an accessibility map, score distribution, and narrative paragraph for the report.
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
 <div className={styles.formLabel}>Computed accessibility package</div>
 <div className={styles.readonlyBlock}>
 {result ? result.reportText : "Compute isochrones first to populate opportunity counts, equity gaps, and report-ready narrative."}
 </div>
 </div>
 <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
 <button type="button" className={styles.outlineBtn} onClick={handleExportMap} disabled={!result}>Export Isochrone Map</button>
 <button type="button" className={styles.outlineBtn} onClick={handleExportReportSection} disabled={!result}>Generate Report Section</button>
 <button type="button" className={styles.outlineBtn} onClick={handleSaveResults} disabled={!result}>Save Results</button>
 </div>
 {publishMessage ? (
 <div className={styles.readonlyBlock} data-testid="accessibility-save-status" style={{ marginTop: "1rem" }}>
 {publishMessage}
 </div>
 ) : null}
 </div>
 )}
 </div>

 {/* Cross-panel actions */}
 <CrossPanelActions flowId="accessibility" stepLabel={STEPS[step].label} />

 {/* Navigation */}
 <footer className={styles.flowFooter} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem" }}>
 <button type="button" className={styles.outlineBtn} disabled={step === 0} onClick={goBack}>
 ← Previous
 </button>
 <button type="button" className={styles.outlineBtn} disabled={step === MAX_STEP} onClick={goNext}>
 Next →
 </button>
 </footer>
 </section>
 );
};

export default AccessibilityFlow;
