import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
  adaptCompositeIndicatorResult,
  createAnalysisCompletedRun,
  createAnalysisMapOutput,
} from "@/services/map/MapEngineAdapter";
import {
  type CompositeAggregationMethod,
  type CompositeImputationMethod,
  type CompositeIndicatorDefinition,
  type CompositeIndicatorResult,
  type CompositeNormalizationMethod,
  type CompositeWeightingMethod,
  runCompositeIndicatorAnalysis,
} from "@/engine/simulation";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import {
  buildCompositeIndicatorSummary,
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "./flowUtils";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import styles from "../styles/flows.module.css";
import CrossPanelActions from "./rail/CrossPanelActions";
import { buildCompositeIndicatorDemoDataset } from "./compositeIndicatorDemo";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildCompositeIndicatorNarrativeInput } from "./narrativeBuilders";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === "indicator_composite")!;
const STEPS = FLOW_DEF.steps;
const FORM_KEY = "indicator_composite_form";
const DEMO_DATASET = buildCompositeIndicatorDemoDataset();
const SCORE_COLORS = ["#DCFCE7", "#A7F3D0", "#4ADE80", "#16A34A", "#14532D"] as const;
const MethodologyInfoButton = lazyWithRetry(
  () => import("@/features/education/MethodologyInfoButton").then((module) => ({ default: module.MethodologyInfoButton })),
  { recoveryPath: "/" },
);

function MethodologyButtonFallback(): React.ReactElement {
  return (
    <div className={styles.flowTitleMeta} role="status" aria-live="polite">
      Loading methodology note...
    </div>
  );
}

interface CompositeIndicatorForm {
  scenarioName: string;
  outputTitle: string;
  selectedIndicatorIds: string[];
  imputationMethod: CompositeImputationMethod;
  normalizationMethod: CompositeNormalizationMethod;
  referenceValues: Record<string, number>;
  weightingMethod: CompositeWeightingMethod;
  expertWeights: Record<string, number>;
  budgetAllocation: Record<string, number>;
  ahpPreferences: Record<string, number>;
  aggregationMethod: CompositeAggregationMethod;
  geometricFloor: number;
  sensitivityRuns: number;
  weightPerturbation: number;
  indicatorNoise: number;
  confidenceLevel: number;
  topK: number;
  randomSeed: number;
}

interface StageValidation {
  label: string;
  valid: boolean;
  detail: string;
}

const DEFAULT_FORM: CompositeIndicatorForm = {
  scenarioName: DEMO_DATASET.defaultScenarioName,
  outputTitle: "Urban Wellbeing Composite Index",
  selectedIndicatorIds: ["transit_access", "green_space", "pm25", "housing_burden", "health_access"],
  imputationMethod: "mean",
  normalizationMethod: "min_max",
  referenceValues: Object.fromEntries(DEMO_DATASET.indicators.map((indicator) => [indicator.id, indicator.referenceValue ?? 0])),
  weightingMethod: "equal",
  expertWeights: Object.fromEntries(DEMO_DATASET.indicators.map((indicator) => [indicator.id, 1])),
  budgetAllocation: Object.fromEntries(DEMO_DATASET.indicators.map((indicator) => [indicator.id, 100])),
  ahpPreferences: {},
  aggregationMethod: "additive",
  geometricFloor: 0.001,
  sensitivityRuns: 320,
  weightPerturbation: 0.14,
  indicatorNoise: 0.04,
  confidenceLevel: 0.9,
  topK: 3,
  randomSeed: 20260412,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "composite-indicator";
}

function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
}

function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${(value * 100).toFixed(digits)}%`;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function pairKey(leftId: string, rightId: string): string {
  return `${leftId}__${rightId}`;
}

function buildIndicatorPairs(indicators: CompositeIndicatorDefinition[]): Array<[CompositeIndicatorDefinition, CompositeIndicatorDefinition]> {
  const pairs: Array<[CompositeIndicatorDefinition, CompositeIndicatorDefinition]> = [];
  for (let leftIndex = 0; leftIndex < indicators.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < indicators.length; rightIndex += 1) {
      pairs.push([indicators[leftIndex]!, indicators[rightIndex]!]);
    }
  }
  return pairs;
}

function buildAhpMatrix(indicators: CompositeIndicatorDefinition[], preferences: Record<string, number>): number[][] {
  return indicators.map((leftIndicator, leftIndex) =>
    indicators.map((rightIndicator, rightIndex) => {
      if (leftIndex === rightIndex) return 1;
      if (leftIndex < rightIndex) {
        return preferences[pairKey(leftIndicator.id, rightIndicator.id)] ?? 1;
      }
      const reciprocal = preferences[pairKey(rightIndicator.id, leftIndicator.id)] ?? 1;
      return reciprocal === 0 ? 1 : 1 / reciprocal;
    }),
  );
}

function normaliseWeights(definitions: CompositeIndicatorDefinition[], values: Record<string, number>) {
  const cleaned = definitions.map((definition) => Math.max(0, Number(values[definition.id] ?? 0)));
  const total = sum(cleaned);
  const fallback = definitions.length > 0 ? 1 / definitions.length : 0;
  return definitions.map((definition, index) => ({
    indicatorId: definition.id,
    label: definition.label,
    weight: total > 0 ? cleaned[index]! / total : fallback,
  }));
}

function projectPoint(lng: number, lat: number, bounds: [number, number, number, number], width: number, height: number) {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  return { x, y };
}

function geometryToSvgPath(geometry: GeoJSON.Geometry, bounds: [number, number, number, number], width: number, height: number): string {
  const ringToPath = (ring: number[][]): string => `${ring.map(([lng, lat], index) => {
    const point = projectPoint(lng, lat, bounds, width, height);
    return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
  }).join(" ")} Z`;

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(ring)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map((ring) => ringToPath(ring)).join(" ")).join(" ");
  }
  return "";
}

function geometryCenter(geometry: GeoJSON.Geometry) {
  const coords = geometry.type === "Polygon" ? geometry.coordinates.flat() : geometry.type === "MultiPolygon" ? geometry.coordinates.flat(2) : [];
  if (coords.length === 0) return { lng: 0, lat: 0 };
  const lngs = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);
  return { lng: (Math.min(...lngs) + Math.max(...lngs)) / 2, lat: (Math.min(...lats) + Math.max(...lats)) / 2 };
}

function getScoreColor(scorePercent: number, minScore: number, maxScore: number): string {
  if (maxScore <= minScore) return SCORE_COLORS[2]!;
  const ratio = (scorePercent - minScore) / (maxScore - minScore);
  const index = clamp(Math.floor(ratio * SCORE_COLORS.length), 0, SCORE_COLORS.length - 1);
  return SCORE_COLORS[index]!;
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

function buildScoresCsv(result: CompositeIndicatorResult): string {
  const headers = [
    "unit_id",
    "unit_label",
    "rank",
    "score_percent",
    "confidence_lower",
    "confidence_upper",
    "mean_rank",
    "top_k_inclusion_frequency",
  ];
  const rows = result.units.map((unit) => [
    unit.unitId,
    unit.label,
    formatMetric(unit.rank, 4),
    formatMetric(unit.scorePercent, 4),
    formatMetric(unit.confidenceBand.lower, 4),
    formatMetric(unit.confidenceBand.upper, 4),
    formatMetric(unit.meanRank, 4),
    formatMetric(unit.topKInclusionFrequency, 4),
  ]);

  return [headers.join(","), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))].join("\n");
}

function buildUncertaintyCsv(result: CompositeIndicatorResult): string {
  const headers = [
    "indicator_id",
    "indicator_label",
    "sobol_first_order",
    "sobol_total_effect_proxy",
    "robustness_tier",
    "mean_kendall_tau",
    "mean_absolute_rank_shift",
    "top_k_stability",
  ];
  const rows = result.sensitivity.sobolStyle.map((entry) => [
    entry.indicatorId,
    entry.label,
    formatMetric(entry.firstOrderIndex, 4),
    formatMetric(entry.totalEffectProxy, 4),
    result.sensitivity.robustnessTier,
    formatMetric(result.sensitivity.meanKendallTauToBaseline, 4),
    formatMetric(result.sensitivity.meanAbsoluteRankShift, 4),
    formatMetric(result.sensitivity.topKStability, 4),
  ]);

  return [headers.join(","), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","))].join("\n");
}

const StageValidationStrip: React.FC<{ validations: StageValidation[]; currentStep: number; onSelect: (index: number) => void; }> = ({ validations, currentStep, onSelect }) => (
  <div className={styles.formSection} style={{ marginTop: 12 }}>
    <div className={styles.formLabel}>Stage validation</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
      {validations.map((validation, index) => {
        const active = index === currentStep;
        return (
          <button
            key={validation.label}
            type="button"
            className={styles.outlineBtn}
            onClick={() => onSelect(index)}
            style={{
              padding: "10px 12px",
              textAlign: "left",
              borderColor: active
                ? "var(--syn-status-info)"
                : validation.valid
                ? "color-mix(in srgb, var(--syn-status-valid, var(--syn-success)) 40%, transparent)"
                : "var(--syn-border-subtle, rgba(255,255,255,0.12))",
              background: active ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--syn-text-primary)" }}>{validation.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: validation.valid ? "var(--syn-status-valid, var(--syn-success))" : "var(--syn-text-muted, rgba(255,255,255,0.55))", textTransform: "uppercase" }}>{validation.valid ? "Ready" : "Needs input"}</span>
            </div>
            <div className={styles.formHint}>{validation.detail}</div>
          </button>
        );
      })}
    </div>
  </div>
);

const MapPreview: React.FC<{ result: CompositeIndicatorResult | null; error: string | null; selectedUnitId: string | null; onSelectUnit: (unitId: string) => void; }> = ({ result, error, selectedUnitId, onSelectUnit }) => {
  const width = 520;
  const height = 320;
  const selectedUnit = result?.units.find((unit) => unit.unitId === selectedUnitId) ?? result?.units[0] ?? null;
  const minScore = result ? Math.min(...result.units.map((unit) => unit.scorePercent)) : 0;
  const maxScore = result ? Math.max(...result.units.map((unit) => unit.scorePercent)) : 100;

  return (
    <div className={styles.stepContentCard} style={{ height: "100%" }}>
      <div className={styles.stepCardTitle}>Live Composite Map</div>
      <p className={styles.formHint}>The map updates automatically from the active indicator, weighting, aggregation, and uncertainty configuration.</p>
      {error ? <div className={styles.warn}>{error}</div> : null}
      <div style={{ border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: "linear-gradient(180deg, #09121F, #0F172A)", padding: 10 }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
          <rect x={0} y={0} width={width} height={height} rx={12} fill="#0B1220" />
          {result?.units.map((unit) => {
            const fill = getScoreColor(unit.scorePercent, minScore, maxScore);
            const path = geometryToSvgPath(unit.geometry, DEMO_DATASET.bounds, width, height);
            const center = geometryCenter(unit.geometry);
            const projected = projectPoint(center.lng, center.lat, DEMO_DATASET.bounds, width, height);
            const selected = unit.unitId === selectedUnit?.unitId;
            return (
              <g key={unit.unitId}>
                <path d={path} fill={fill} stroke={selected ? "#F8FAFC" : "rgba(15,23,42,0.9)"} strokeWidth={selected ? 2.4 : 1.2} onClick={() => onSelectUnit(unit.unitId)} style={{ cursor: "pointer" }} />
                <text x={projected.x} y={projected.y} textAnchor="middle" dominantBaseline="middle" fill="#E2E8F0" fontSize={10} fontWeight={700}>{unit.rank}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {selectedUnit ? <div className={styles.readonlyBlock} style={{ marginTop: 12 }}>{selectedUnit.label}{"\n"}Rank {selectedUnit.rank} | Score {formatMetric(selectedUnit.scorePercent)}{"\n"}Band {formatMetric(selectedUnit.confidenceBand.lower)}-{formatMetric(selectedUnit.confidenceBand.upper)} | Top-K inclusion {formatPercent(selectedUnit.topKInclusionFrequency, 1)}</div> : <div className={styles.formHint} style={{ marginTop: 12 }}>Select at least two indicators to generate the preview.</div>}
    </div>
  );
};

const ConfidenceBands: React.FC<{ result: CompositeIndicatorResult }> = ({ result }) => {
  const units = result.units.slice(0, 8);
  const minValue = Math.min(...units.map((unit) => unit.confidenceBand.lower));
  const maxValue = Math.max(...units.map((unit) => unit.confidenceBand.upper));
  const range = maxValue - minValue || 1;
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{units.map((unit) => {
    const left = ((unit.confidenceBand.lower - minValue) / range) * 100;
    const width = ((unit.confidenceBand.upper - unit.confidenceBand.lower) / range) * 100;
    const score = ((unit.scorePercent - minValue) / range) * 100;
    return <div key={unit.unitId}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 700, color: "var(--syn-text-primary)" }}>{unit.rank}. {unit.label}</span><span className={styles.formHint}>{formatMetric(unit.confidenceBand.lower)}-{formatMetric(unit.confidenceBand.upper)}</span></div><div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", left: `${left}%`, width: `${Math.max(width, 2)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, rgba(59,130,246,0.55), rgba(34,197,94,0.75))" }} /><div style={{ position: "absolute", left: `calc(${score}% - 5px)`, top: -2, width: 10, height: 14, borderRadius: 4, background: "#F8FAFC", border: "1px solid #0F172A" }} /></div></div>;
  })}</div>;
};

const SobolBars: React.FC<{ result: CompositeIndicatorResult }> = ({ result }) => <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{result.sensitivity.sobolStyle.slice(0, 6).map((entry) => <div key={entry.indicatorId}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 12, color: "var(--syn-text-primary)" }}>{entry.label}</span><span className={styles.formHint}>{formatMetric(entry.firstOrderIndex, 3)} / {formatMetric(entry.totalEffectProxy, 3)}</span></div><div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${entry.totalEffectProxy * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #F59E0B, #EF4444)" }} /></div></div>)}</div>;

const CompositeIndicatorFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishedRunId, setPublishedRunId] = useState<string | null>(null);
  const { stepData, setStepData, upsertCompletedRun } = useFlowStore();
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const upsertMapEvidenceArtifact = useMapExplorerStore((state) => state.upsertMapEvidenceArtifact);

  const [form, setForm] = useState<CompositeIndicatorForm>(() => restoreFormState(stepData, FORM_KEY, DEFAULT_FORM));

  useEffect(() => {
    setStepData(FORM_KEY, form);
  }, [form, setStepData]);

  const selectedIndicators = useMemo(() => DEMO_DATASET.indicators.filter((indicator) => form.selectedIndicatorIds.includes(indicator.id)), [form.selectedIndicatorIds]);
  const indicatorPairs = useMemo(() => buildIndicatorPairs(selectedIndicators), [selectedIndicators]);
  const indicatorMissingCounts = useMemo(() => Object.fromEntries(DEMO_DATASET.indicators.map((indicator) => [indicator.id, DEMO_DATASET.units.filter((unit) => unit.values[indicator.id] == null).length])), []);

  const preview = useMemo(() => {
    try {
      return {
        result: runCompositeIndicatorAnalysis(DEMO_DATASET, {
          scenarioName: form.scenarioName.trim() || DEMO_DATASET.defaultScenarioName,
          selectedIndicatorIds: form.selectedIndicatorIds,
          imputation: { method: form.imputationMethod },
          normalization: {
            method: form.normalizationMethod,
            ...(form.normalizationMethod === "distance_to_reference" ? { referenceValues: Object.fromEntries(selectedIndicators.map((indicator) => [indicator.id, form.referenceValues[indicator.id] ?? indicator.referenceValue ?? 0])) } : {}),
          },
          weighting: {
            method: form.weightingMethod,
            ...(form.weightingMethod === "expert" ? { manualWeights: form.expertWeights } : {}),
            ...(form.weightingMethod === "budget_allocation" ? { budgetAllocation: form.budgetAllocation } : {}),
            ...(form.weightingMethod === "ahp" ? { ahpMatrix: buildAhpMatrix(selectedIndicators, form.ahpPreferences) } : {}),
          },
          aggregation: { method: form.aggregationMethod, ...(form.aggregationMethod === "geometric" ? { geometricFloor: form.geometricFloor } : {}) },
          sensitivity: {
            runs: form.sensitivityRuns,
            weightPerturbation: form.weightPerturbation,
            indicatorNoise: form.indicatorNoise,
            confidenceLevel: form.confidenceLevel,
            topK: form.topK,
            randomSeed: form.randomSeed,
          },
        }),
        error: null as string | null,
      };
    } catch (error) {
      return { result: null as CompositeIndicatorResult | null, error: error instanceof Error ? error.message : "Composite preview failed." };
    }
  }, [form, selectedIndicators]);

  const previewResult = preview.result;
  const previewError = preview.error;
  const displayedWeights = previewResult?.weights.map((entry) => ({ indicatorId: entry.indicatorId, label: entry.label, weight: entry.weight })) ?? normaliseWeights(selectedIndicators, form.weightingMethod === "budget_allocation" ? form.budgetAllocation : form.expertWeights);

  const reportPreview = previewResult
    ? [`${form.outputTitle} combines ${previewResult.selectedIndicators.length} indicators across ${previewResult.datasetSummary.unitCount} units.`, buildCompositeIndicatorSummary({ indicators: selectedIndicators.map((indicator) => ({ name: indicator.label })), normMethod: form.normalizationMethod, weightMethod: form.weightingMethod, aggregation: form.aggregationMethod, outputTitle: form.outputTitle, imputationMethod: form.imputationMethod, sensitivityRuns: form.sensitivityRuns, robustnessTier: previewResult.sensitivity.robustnessTier, topKStability: previewResult.sensitivity.topKStability })].join("\n\n")
    : "Complete the earlier stages to generate the report preview.";
  const narrativeInput = previewResult
    ? buildCompositeIndicatorNarrativeInput(
        {
          outputTitle: form.outputTitle,
          scenarioName: form.scenarioName,
          normalizationMethod: form.normalizationMethod,
          weightingMethod: form.weightingMethod,
          aggregationMethod: form.aggregationMethod,
        },
        previewResult,
      )
    : null;

  const stageValidations = useMemo<StageValidation[]>(() => {
    const expertTotal = sum(selectedIndicators.map((indicator) => Math.max(0, form.expertWeights[indicator.id] ?? 0)));
    const budgetTotal = sum(selectedIndicators.map((indicator) => Math.max(0, form.budgetAllocation[indicator.id] ?? 0)));
    const hasReferenceValues = selectedIndicators.every((indicator) => Number.isFinite(form.referenceValues[indicator.id] ?? indicator.referenceValue ?? 0));
    return [
      { label: "Indicator Selection", valid: form.selectedIndicatorIds.length >= 2, detail: form.selectedIndicatorIds.length >= 2 ? `${form.selectedIndicatorIds.length} indicators selected.` : "Select at least two indicators." },
      { label: "Missing Data", valid: true, detail: previewResult ? `${previewResult.datasetSummary.imputedCellCount} cells imputed; ${previewResult.datasetSummary.removedUnitCount} units removed.` : "Choose an imputation or deletion rule." },
      { label: "Normalization", valid: form.normalizationMethod !== "distance_to_reference" || hasReferenceValues, detail: form.normalizationMethod === "distance_to_reference" ? (hasReferenceValues ? "Reference values ready." : "Reference values missing.") : `${form.normalizationMethod.replace(/_/g, " ")} configured.` },
      { label: "Weighting", valid: form.weightingMethod === "equal" || form.weightingMethod === "pca_derived" || form.weightingMethod === "ahp" || (form.weightingMethod === "expert" && expertTotal > 0) || (form.weightingMethod === "budget_allocation" && budgetTotal > 0), detail: form.weightingMethod === "expert" ? `Expert total ${formatMetric(expertTotal, 1)}.` : form.weightingMethod === "budget_allocation" ? `Budget total ${formatMetric(budgetTotal, 1)}.` : form.weightingMethod === "ahp" ? `${indicatorPairs.length} pairwise comparisons.` : `${form.weightingMethod.replace(/_/g, " ")} configured.` },
      { label: "Aggregation", valid: form.aggregationMethod !== "geometric" || form.geometricFloor > 0, detail: form.aggregationMethod === "geometric" ? `Floor ${form.geometricFloor.toExponential(1)}.` : "Additive aggregation ready." },
      { label: "Sensitivity", valid: form.sensitivityRuns >= 50 && form.confidenceLevel >= 0.5 && form.confidenceLevel <= 0.99, detail: previewResult ? `Robustness ${previewResult.sensitivity.robustnessTier}; tau ${formatMetric(previewResult.sensitivity.meanKendallTauToBaseline, 3)}.` : "Configure Monte Carlo controls." },
      { label: "Reporting", valid: Boolean(previewResult), detail: previewResult ? `Export package ready for ${previewResult.units.length} units.` : previewError ?? "Resolve earlier configuration issues." },
    ];
  }, [form, indicatorPairs.length, previewError, previewResult, selectedIndicators]);

  const updateForm = <K extends keyof CompositeIndicatorForm>(key: K, value: CompositeIndicatorForm[K]) => {
    setForm((previous) => {
      return { ...previous, [key]: value };
    });
    setPublishMessage(null);
  };

  const updateRecordField = (key: "referenceValues" | "expertWeights" | "budgetAllocation" | "ahpPreferences", recordKey: string, value: number) => {
    setForm((previous) => {
      return { ...previous, [key]: { ...previous[key], [recordKey]: value } };
    });
    setPublishMessage(null);
  };

  const toggleIndicator = (indicatorId: string) => {
    const next = form.selectedIndicatorIds.includes(indicatorId)
      ? form.selectedIndicatorIds.filter((value) => value !== indicatorId)
      : [...form.selectedIndicatorIds, indicatorId];
    updateForm("selectedIndicatorIds", next);
  };

  const publishPreview = () => {
    if (!previewResult) {
      setPublishMessage("Resolve the preview configuration before publishing the analysis run.");
      return;
    }
    const runId = publishedRunId ?? `composite-indicator-${Date.now()}`;
    const layerName = form.outputTitle.trim() || form.scenarioName.trim() || "Composite Indicator";
    const adapted = adaptCompositeIndicatorResult({
      result: previewResult,
      runId,
      layerId: `${slugify(layerName)}-${runId}`,
      layerName,
      parameters: {
        scenarioName: form.scenarioName,
        selectedIndicators: selectedIndicators.map((indicator) => indicator.label),
        imputationMethod: form.imputationMethod,
        normalizationMethod: form.normalizationMethod,
        weightingMethod: form.weightingMethod,
        aggregationMethod: form.aggregationMethod,
        sensitivityRuns: form.sensitivityRuns,
      },
    });
    addOverlayLayer(adapted.layer);
    upsertMapEvidenceArtifact(adapted.evidenceArtifact);
    upsertCompletedRun(createAnalysisCompletedRun(adapted, {
      flowId: "indicator_composite",
      runId,
      label: layerName,
      paragraph: reportPreview,
      paragraphPreview: reportPreview,
      paragraphFull: reportPreview,
      mapOutputs: [createAnalysisMapOutput(adapted)],
      chartOutputs: [
        { id: `${runId}-ranking`, type: "bar", title: `${layerName} Rankings`, data: previewResult.units.map((unit) => ({ label: unit.label, rank: unit.rank, scorePercent: unit.scorePercent })) },
        { id: `${runId}-weights`, type: "bar", title: `${layerName} Weights`, data: previewResult.weights.map((weight) => ({ indicator: weight.label, weight: weight.weight })) },
      ],
      dataOutputs: [
        { id: `${runId}-scores`, format: "composite-scores", rows: previewResult.units.length, columns: ["label", "rank", "scorePercent"], preview: previewResult.units.slice(0, 8).map((unit) => ({ label: unit.label, rank: unit.rank, scorePercent: unit.scorePercent })) },
        { id: `${runId}-configuration`, format: "configuration-package", rows: 1, columns: ["generatedAt", "selectedIndicatorIds", "weightingMethod", "aggregationMethod"], preview: [previewResult.configurationPackage] },
      ],
    }));
    if (!publishedRunId) setPublishedRunId(runId);
    setPublishMessage("Preview published to the map explorer and completed-run review.");
  };

  const exportConfigurationPackage = () => previewResult && downloadTextFile(`${slugify(form.outputTitle || form.scenarioName)}-configuration.json`, JSON.stringify(previewResult.configurationPackage, null, 2));
  const exportResultJson = () => previewResult && downloadTextFile(`${slugify(form.outputTitle || form.scenarioName)}-result.json`, JSON.stringify(previewResult, null, 2));
  const exportScoresCsv = () => previewResult && downloadTextFile(`${slugify(form.outputTitle || form.scenarioName)}-scores.csv`, buildScoresCsv(previewResult), "text/csv;charset=utf-8");
  const exportUncertaintyCsv = () => previewResult && downloadTextFile(`${slugify(form.outputTitle || form.scenarioName)}-uncertainty.csv`, buildUncertaintyCsv(previewResult), "text/csv;charset=utf-8");
  const exportReportPreview = () => downloadTextFile(`${slugify(form.outputTitle || form.scenarioName)}-report-preview.txt`, reportPreview, "text/plain;charset=utf-8");
  const exportWorkflowJson = () => downloadJSON(exportFlowJSON("indicator_composite", form as unknown as Record<string, unknown>, previewResult ? { summary: reportPreview, datasetSummary: previewResult.datasetSummary, weights: previewResult.weights, sensitivity: previewResult.sensitivity } : { error: previewError }));

  const MAX_STEP = STEPS.length - 1;
  const currentValidation = stageValidations[step]!;

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>{FLOW_DEF.icon} {FLOW_DEF.label}</div>
          <div className={styles.flowTitleMeta}>Step {step + 1} of {STEPS.length}</div>
          <div style={{ marginLeft: "auto" }}>
            <ChunkLoadBoundary compact title="Methodology note unavailable" message="Open the Education workspace if the methodology note cannot be loaded here.">
              <Suspense fallback={<MethodologyButtonFallback />}>
                <MethodologyInfoButton explainerId="composite_index" pathId="sdg11_monitoring_reporting" label="Methodology note" />
              </Suspense>
            </ChunkLoadBoundary>
          </div>
        </div>
        <div className={styles.flowSubtitle}>{FLOW_DEF.description}</div>
      </header>

      <StepPills steps={STEPS.map((entry) => ({ key: entry.key, label: entry.label }))} currentIndex={step} onSelect={(index) => setStep(clamp(index, 0, MAX_STEP))} />
      <StageValidationStrip validations={stageValidations} currentStep={step} onSelect={(index) => setStep(clamp(index, 0, MAX_STEP))} />

      <div className={styles.flowBodyArea}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>{STEPS[step]!.label}</div>
            <p className={styles.formHint}>{STEPS[step]!.description}</p>
            {!currentValidation.valid ? <div className={styles.warn}>{currentValidation.detail}</div> : null}

            {step === 0 ? <>
              <div className={styles.formSection}>
                <label className={styles.formLabel}>Scenario label<input type="text" className={styles.textInput} value={form.scenarioName} onChange={(event) => updateForm("scenarioName", event.target.value)} style={{ marginTop: 6 }} /></label>
              </div>
              <div className={styles.formSection}>
                <label className={styles.formLabel}>Report / layer title<input type="text" className={styles.textInput} value={form.outputTitle} onChange={(event) => updateForm("outputTitle", event.target.value)} style={{ marginTop: 6 }} /></label>
              </div>
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Indicator selection checklist</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {DEMO_DATASET.indicators.map((indicator) => {
                    const selected = form.selectedIndicatorIds.includes(indicator.id);
                    return <label key={indicator.id} className={styles.checkboxRow} style={{ alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: selected ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent" }}><input type="checkbox" checked={selected} onChange={() => toggleIndicator(indicator.id)} /><span><strong>{indicator.label}</strong><span className={styles.formHint} style={{ display: "block" }}>{indicator.group ?? "Ungrouped"} | {indicator.direction === "positive" ? "Higher is better" : "Lower is better"}</span><span className={styles.formHint} style={{ display: "block" }}>Missing units: {indicatorMissingCounts[indicator.id] ?? 0}</span></span></label>;
                  })}
                </div>
              </div>
            </> : null}

            {step === 1 ? <>
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Missing-data handling</div>
                {(["mean", "median", "listwise_delete"] as CompositeImputationMethod[]).map((method) => <label key={method} className={styles.checkboxRow} style={{ padding: "10px 12px", border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: form.imputationMethod === method ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent", marginBottom: 8 }}><input type="radio" checked={form.imputationMethod === method} onChange={() => updateForm("imputationMethod", method)} /><span><strong>{method.replace(/_/g, " ")}</strong></span></label>)}
              </div>
              <div className={styles.readonlyBlock}>Selected indicators: {selectedIndicators.map((indicator) => `${indicator.label} (${indicatorMissingCounts[indicator.id] ?? 0} missing)`).join(", ") || "none"}</div>
              {previewResult ? <div className={styles.readonlyBlock} style={{ marginTop: 12 }}>Usable units {previewResult.datasetSummary.unitCount} of {previewResult.datasetSummary.originalUnitCount}; imputed cells {previewResult.datasetSummary.imputedCellCount}; removed units {previewResult.datasetSummary.removedUnitCount}.</div> : null}
            </> : null}

            {step === 2 ? <>
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Normalization method</div>
                {(["min_max", "z_score", "rank", "percentile", "distance_to_reference"] as CompositeNormalizationMethod[]).map((method) => <label key={method} className={styles.checkboxRow} style={{ padding: "10px 12px", border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: form.normalizationMethod === method ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent", marginBottom: 8 }}><input type="radio" checked={form.normalizationMethod === method} onChange={() => updateForm("normalizationMethod", method)} /><span><strong>{method.replace(/_/g, " ")}</strong></span></label>)}
              </div>
              {form.normalizationMethod === "distance_to_reference" ? <div className={styles.formSection}><div className={styles.formLabel}>Reference values</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>{selectedIndicators.map((indicator) => <label key={indicator.id} className={styles.formLabel}>{indicator.label}<input type="number" className={styles.textInput} value={form.referenceValues[indicator.id] ?? indicator.referenceValue ?? 0} onChange={(event) => updateRecordField("referenceValues", indicator.id, Number(event.target.value))} style={{ marginTop: 6 }} /></label>)}</div></div> : null}
              {previewResult ? <div className={styles.readonlyBlock}>Normalisation diagnostics ready for {previewResult.diagnostics.length} indicators.</div> : null}
            </> : null}

            {step === 3 ? <>
              <div className={styles.formSection}>
                <div className={styles.formLabel}>Weighting interface</div>
                {(["equal", "expert", "pca_derived", "ahp", "budget_allocation"] as CompositeWeightingMethod[]).map((method) => <label key={method} className={styles.checkboxRow} style={{ padding: "10px 12px", border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: form.weightingMethod === method ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent", marginBottom: 8 }}><input type="radio" checked={form.weightingMethod === method} onChange={() => updateForm("weightingMethod", method)} /><span><strong>{method.replace(/_/g, " ")}</strong></span></label>)}
              </div>
              {form.weightingMethod === "expert" ? <div className={styles.formSection}><div className={styles.formLabel}>Manual slider weights</div>{selectedIndicators.map((indicator) => <label key={indicator.id} className={styles.formLabel}>{indicator.label}<div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}><input type="range" min={0} max={100} step={1} value={form.expertWeights[indicator.id] ?? 0} onChange={(event) => updateRecordField("expertWeights", indicator.id, Number(event.target.value))} style={{ flex: 1 }} /><span style={{ minWidth: 40, textAlign: "right" }}>{Math.round(form.expertWeights[indicator.id] ?? 0)}</span></div></label>)}</div> : null}
              {form.weightingMethod === "budget_allocation" ? <div className={styles.formSection}><div className={styles.formLabel}>Budget tokens</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>{selectedIndicators.map((indicator) => <label key={indicator.id} className={styles.formLabel}>{indicator.label}<input type="number" className={styles.textInput} min={0} step={5} value={form.budgetAllocation[indicator.id] ?? 0} onChange={(event) => updateRecordField("budgetAllocation", indicator.id, Number(event.target.value))} style={{ marginTop: 6 }} /></label>)}</div></div> : null}
              {form.weightingMethod === "ahp" ? <div className={styles.formSection}><div className={styles.formLabel}>AHP pairwise comparisons</div>{indicatorPairs.map(([leftIndicator, rightIndicator]) => <label key={pairKey(leftIndicator.id, rightIndicator.id)} className={styles.formLabel}>{leftIndicator.label} vs {rightIndicator.label}<select className={styles.textInput} value={String(form.ahpPreferences[pairKey(leftIndicator.id, rightIndicator.id)] ?? 1)} onChange={(event) => updateRecordField("ahpPreferences", pairKey(leftIndicator.id, rightIndicator.id), Number(event.target.value))} style={{ marginTop: 6 }}>{[{ value: 9, label: "9" }, { value: 7, label: "7" }, { value: 5, label: "5" }, { value: 3, label: "3" }, { value: 1, label: "1" }, { value: 1 / 3, label: "1/3" }, { value: 1 / 5, label: "1/5" }, { value: 1 / 7, label: "1/7" }, { value: 1 / 9, label: "1/9" }].map((option) => <option key={`${option.value}`} value={String(option.value)}>{option.label}</option>)}</select></label>)}</div> : null}
              <div className={styles.formSection}><div className={styles.formLabel}>Derived weights</div>{displayedWeights.map((weight) => <div key={weight.indicatorId} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 12, color: "var(--syn-text-primary)" }}>{weight.label}</span><span className={styles.formHint}>{formatPercent(weight.weight, 1)}</span></div><div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ width: `${weight.weight * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #0EA5E9, #22C55E)" }} /></div></div>)}</div>
            </> : null}

            {step === 4 ? <>
              <div className={styles.formSection}><div className={styles.formLabel}>Aggregation selector</div>{(["additive", "geometric"] as CompositeAggregationMethod[]).map((method) => <label key={method} className={styles.checkboxRow} style={{ padding: "10px 12px", border: "1px solid var(--syn-overlay-light)", borderRadius: 10, background: form.aggregationMethod === method ? "color-mix(in srgb, var(--syn-status-info) 8%, transparent)" : "transparent", marginBottom: 8 }}><input type="radio" checked={form.aggregationMethod === method} onChange={() => updateForm("aggregationMethod", method)} /><span><strong>{method}</strong></span></label>)}</div>
              {form.aggregationMethod === "geometric" ? <div className={styles.formSection}><div className={styles.formLabel}>Geometric floor</div><input type="range" min={0.0001} max={0.02} step={0.0001} aria-label="Geometric floor" value={form.geometricFloor} onChange={(event) => updateForm("geometricFloor", Number(event.target.value))} style={{ width: "100%" }} /><div className={styles.formHint}>{form.geometricFloor.toExponential(2)}</div></div> : null}
              {previewResult ? <div className={styles.readonlyBlock}>Top unit {previewResult.units[0]?.label ?? "n/a"} ({formatMetric(previewResult.units[0]?.scorePercent)}). Bottom unit {previewResult.units[previewResult.units.length - 1]?.label ?? "n/a"} ({formatMetric(previewResult.units[previewResult.units.length - 1]?.scorePercent)}).</div> : null}
            </> : null}

            {step === 5 ? <>
              <div className={styles.formSection}><div className={styles.formLabel}>Monte Carlo sensitivity controls</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}><label className={styles.formLabel}>Runs<input type="number" className={styles.textInput} min={50} max={2000} step={25} value={form.sensitivityRuns} onChange={(event) => updateForm("sensitivityRuns", clamp(Number(event.target.value) || 50, 50, 2000))} style={{ marginTop: 6 }} /></label><label className={styles.formLabel}>Weight perturbation<input type="number" className={styles.textInput} min={0} max={0.5} step={0.01} value={form.weightPerturbation} onChange={(event) => updateForm("weightPerturbation", clamp(Number(event.target.value) || 0, 0, 0.5))} style={{ marginTop: 6 }} /></label><label className={styles.formLabel}>Indicator noise<input type="number" className={styles.textInput} min={0} max={0.2} step={0.01} value={form.indicatorNoise} onChange={(event) => updateForm("indicatorNoise", clamp(Number(event.target.value) || 0, 0, 0.2))} style={{ marginTop: 6 }} /></label><label className={styles.formLabel}>Confidence level<input type="number" className={styles.textInput} min={0.5} max={0.99} step={0.01} value={form.confidenceLevel} onChange={(event) => updateForm("confidenceLevel", clamp(Number(event.target.value) || 0.9, 0.5, 0.99))} style={{ marginTop: 6 }} /></label><label className={styles.formLabel}>Top-K<input type="number" className={styles.textInput} min={1} max={Math.max(1, previewResult?.units.length ?? DEMO_DATASET.units.length)} value={form.topK} onChange={(event) => updateForm("topK", clamp(Number(event.target.value) || 1, 1, Math.max(1, previewResult?.units.length ?? DEMO_DATASET.units.length)))} style={{ marginTop: 6 }} /></label><label className={styles.formLabel}>Random seed<input type="number" className={styles.textInput} value={form.randomSeed} onChange={(event) => updateForm("randomSeed", Number(event.target.value))} style={{ marginTop: 6 }} /></label></div></div>
              {previewResult ? <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>{[{ label: "Robustness", value: previewResult.sensitivity.robustnessTier.toUpperCase() }, { label: "Mean Kendall tau", value: formatMetric(previewResult.sensitivity.meanKendallTauToBaseline, 3) }, { label: "Mean rank shift", value: formatMetric(previewResult.sensitivity.meanAbsoluteRankShift, 3) }, { label: `Top-${previewResult.sensitivity.topK} stability`, value: formatPercent(previewResult.sensitivity.topKStability, 1) }].map((metric) => <div key={metric.label} style={{ border: "1px solid var(--syn-overlay-light)", borderRadius: 8, padding: "10px 12px", background: "var(--syn-overlay-whisper)" }}><div className={styles.formHint}>{metric.label}</div><div style={{ fontSize: 17, fontWeight: 700, color: "var(--syn-text-primary)" }}>{metric.value}</div></div>)}</div><div className={styles.formSection}><div className={styles.formLabel}>Sobol-style proxy outputs</div><SobolBars result={previewResult} /></div></> : null}
            </> : null}

            {step === 6 ? <>
              <div className={styles.formSection}><div className={styles.formLabel}>Final report preview</div><div className={styles.readonlyBlock}>{reportPreview}</div></div>
              {previewResult ? <>
                <div className={styles.formSection}><div className={styles.formLabel}>Confidence bands</div><ConfidenceBands result={previewResult} /></div>
                <div className={styles.formSection}><div className={styles.formLabel}>Top-ranked units</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{["Rank", "Unit", "Score", "Confidence band", "Mean rank"].map((header) => <th key={header} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)", color: "var(--syn-text-primary)" }}>{header}</th>)}</tr></thead><tbody>{previewResult.units.slice(0, 8).map((unit) => <tr key={unit.unitId}><td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{unit.rank}</td><td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{unit.label}</td><td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatMetric(unit.scorePercent)}</td><td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatMetric(unit.confidenceBand.lower)}-{formatMetric(unit.confidenceBand.upper)}</td><td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatMetric(unit.meanRank, 2)}</td></tr>)}</tbody></table></div></div>
                <NarrativeGenerationPanel input={narrativeInput ?? undefined} subject={form.outputTitle} />
                <div className={styles.formSection}><div className={styles.formLabel}>Export artifacts</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" className={styles.outlineBtn} onClick={publishPreview}>Publish to map & completed runs</button><button type="button" className={styles.outlineBtn} onClick={exportConfigurationPackage}>Export configuration package</button><button type="button" className={styles.outlineBtn} onClick={exportResultJson}>Export full result JSON</button><button type="button" className={styles.outlineBtn} onClick={exportScoresCsv}>Export scores CSV</button><button type="button" className={styles.outlineBtn} onClick={exportUncertaintyCsv}>Export uncertainty CSV</button><button type="button" className={styles.outlineBtn} onClick={exportReportPreview}>Export report preview</button><button type="button" className={styles.outlineBtn} onClick={exportWorkflowJson}>Export workflow JSON</button></div></div>
              </> : null}
              {publishMessage ? <div className={previewResult ? styles.readonlyBlock : styles.warn} style={{ marginTop: 12 }}>{publishMessage}</div> : null}
            </> : null}
          </div>

          <MapPreview result={previewResult} error={previewError} selectedUnitId={selectedUnitId} onSelectUnit={setSelectedUnitId} />
        </div>
      </div>

      <CrossPanelActions flowId="indicator_composite" stepLabel={STEPS[step]!.label} />

      <footer className={styles.flowFooter}>
        <button type="button" className={styles.outlineBtn} disabled={step === 0} onClick={() => setStep((previous) => clamp(previous - 1, 0, MAX_STEP))}>← Previous</button>
        <button type="button" className={styles.outlineBtn} disabled={step === MAX_STEP || !currentValidation.valid} onClick={() => setStep((previous) => clamp(previous + 1, 0, MAX_STEP))}>Next →</button>
      </footer>
    </section>
  );
};

export default CompositeIndicatorFlow;
