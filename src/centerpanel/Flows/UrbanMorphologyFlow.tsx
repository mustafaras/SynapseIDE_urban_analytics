import React, { useMemo, useState } from "react";
import { executeKMeansClusteringAsync } from "@/services/analysis/BackgroundAnalyticsQueue";
import { useUrbanContextId, useUrbanContextStore } from "@/features/urbanAnalytics/useUrbanContextStore";
import { buildRunManifest } from "@/features/urbanAnalytics/lib/runManifest";
import {
  adaptClusterResult,
  createAnalysisCompletedRun,
} from "@/services/map/MapEngineAdapter";
import { useBackgroundTaskStore } from "@/stores/useBackgroundTaskStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { toastError, toastInfo, toastSuccess } from "@/ui/toast/api";
import { isBackgroundTaskCancelledError } from "@/workers/pool";
import type { ClusterResult } from "@/engine/spatial-stats/types";
import { buildCompositeIndicatorDemoDataset } from "./compositeIndicatorDemo";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import { downloadJSON, exportFlowJSON, restoreFormState } from "./flowUtils";
import { FLOW_LIBRARY_ITEMS } from "./flowLibraryMeta";
import { evaluateWorkflowReadiness } from "./workflowReadiness";
import CrossPanelActions from "./rail/CrossPanelActions";
import styles from "../styles/flows.module.css";

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === "urban_morphology")!;
const FLOW_META = FLOW_LIBRARY_ITEMS.find((item) => item.flowId === "urban_morphology") ?? null;
const STEPS = FLOW_DEF.steps;
const FORM_KEY = "urban_morphology_form";
const DEMO_DATASET = buildCompositeIndicatorDemoDataset();

interface UrbanMorphologyForm {
  scenarioName: string;
  selectedIndicatorIds: string[];
  clusterCount: number;
  randomSeed: number;
  includePopulation: boolean;
  standardizeInputs: boolean;
}

interface UrbanMorphologyPreparedInput {
  featureCollection: GeoJSON.FeatureCollection;
  matrix: number[][];
  columnLabels: string[];
  includedUnits: Array<{
    id: string;
    label: string;
    group: string;
    typology: string;
  }>;
  skippedUnits: string[];
}

interface UrbanMorphologyRunState {
  clusterResult: ClusterResult;
  preparedInput: UrbanMorphologyPreparedInput;
  formSnapshot: UrbanMorphologyForm;
  layerName: string;
  runId: string;
}

const DEFAULT_FORM: UrbanMorphologyForm = {
  scenarioName: "Morphotype Segmentation",
  selectedIndicatorIds: [
    "transit_access",
    "green_space",
    "pm25",
    "housing_burden",
    "employment_access",
  ],
  clusterCount: 4,
  randomSeed: 20260435,
  includePopulation: true,
  standardizeInputs: true,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "urban-morphology";
}

function snapshotForm(form: UrbanMorphologyForm): UrbanMorphologyForm {
  return {
    ...form,
    selectedIndicatorIds: [...form.selectedIndicatorIds],
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], center: number): number {
  const variance = values.reduce((sum, value) => sum + (value - center) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function zScoreMatrix(matrix: number[][]): number[][] {
  if (matrix.length === 0 || matrix[0]?.length === 0) {
    return matrix;
  }

  const columnCount = matrix[0].length;
  const centers = Array.from({ length: columnCount }, (_, columnIndex) =>
    mean(matrix.map((row) => row[columnIndex])),
  );
  const spreads = Array.from({ length: columnCount }, (_, columnIndex) =>
    standardDeviation(matrix.map((row) => row[columnIndex]), centers[columnIndex]),
  );

  return matrix.map((row) => row.map((value, columnIndex) => {
    const spread = spreads[columnIndex];
    if (!Number.isFinite(spread) || spread <= 0) {
      return 0;
    }
    return (value - centers[columnIndex]) / spread;
  }));
}

function formatMetric(value: number, maximumFractionDigits = 3): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : Math.min(2, maximumFractionDigits),
  });
}

function buildMorphologyInput(form: UrbanMorphologyForm): UrbanMorphologyPreparedInput {
  const selectedIndicators = DEMO_DATASET.indicators.filter((indicator) =>
    form.selectedIndicatorIds.includes(indicator.id),
  );

  const columnLabels = selectedIndicators.map((indicator) => indicator.label);
  if (form.includePopulation) {
    columnLabels.push("Population");
  }

  const features: GeoJSON.Feature[] = [];
  const matrix: number[][] = [];
  const includedUnits: UrbanMorphologyPreparedInput["includedUnits"] = [];
  const skippedUnits: string[] = [];

  for (const unit of DEMO_DATASET.units) {
    const unitProperties = unit.properties ?? {};
    const population = Number(unitProperties.population ?? 0);
    const unitGroup = unit.group ?? "unassigned";
    const unitTypology = String(unitProperties.typology ?? "Unknown");
    const indicatorValues = selectedIndicators.map((indicator) => unit.values[indicator.id]);
    const hasMissingIndicator = indicatorValues.some((value) => typeof value !== "number" || !Number.isFinite(value));
    const invalidPopulation = form.includePopulation && (!Number.isFinite(population) || population <= 0);

    if (hasMissingIndicator || invalidPopulation) {
      skippedUnits.push(unit.label);
      continue;
    }

    const numericRow = indicatorValues.map((value) => Number(value));
    if (form.includePopulation) {
      numericRow.push(population);
    }

    matrix.push(numericRow);
    includedUnits.push({
      id: unit.id,
      label: unit.label,
      group: unitGroup,
      typology: unitTypology,
    });

    features.push({
      type: "Feature",
      geometry: unit.geometry,
      properties: {
        unit_id: unit.id,
        unit_label: unit.label,
        group: unitGroup,
        typology: unitTypology,
        population,
        ...Object.fromEntries(selectedIndicators.map((indicator, index) => [indicator.id, numericRow[index]])),
      },
    });
  }

  return {
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
    matrix: form.standardizeInputs ? zScoreMatrix(matrix) : matrix,
    columnLabels,
    includedUnits,
    skippedUnits,
  };
}

function buildClusterCounts(result: ClusterResult): Array<{ clusterId: number; count: number }> {
  return Array.from({ length: result.k }, (_, index) => ({
    clusterId: index + 1,
    count: result.labels.filter((label) => label === index).length,
  }));
}

function buildRunNarrative(runState: UrbanMorphologyRunState): string {
  const indicatorPhrase = runState.preparedInput.columnLabels.join(", ");
  const skippedPhrase = runState.preparedInput.skippedUnits.length
    ? `Skipped units with incomplete fields: ${runState.preparedInput.skippedUnits.join(", ")}.`
    : "All study units passed the completeness screen.";

  return [
    `${runState.formSnapshot.scenarioName} segmented ${runState.preparedInput.includedUnits.length} districts into ${runState.clusterResult.k} urban morphotypes.`,
    `Inputs: ${indicatorPhrase}. ${runState.formSnapshot.standardizeInputs ? "Z-score standardisation applied." : "Raw indicator scales preserved."}`,
    `Mean silhouette ${formatMetric(runState.clusterResult.meanSilhouette)} with total within-cluster sum of squares ${formatMetric(runState.clusterResult.totalWcss, 1)}.`,
    skippedPhrase,
  ].join(" ");
}

const UrbanMorphologyFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runState, setRunState] = useState<UrbanMorphologyRunState | null>(null);

  const { stepData, setStepData, upsertCompletedRun, registerManifest } = useFlowStore();
  const urbanContextId = useUrbanContextId();
  const registerEvidenceArtifact = useUrbanContextStore((state) => state.registerEvidenceArtifact);
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMapExplorer = useMapExplorerStore((state) => state.open);
  const openTaskPanel = useBackgroundTaskStore((state) => state.openPanel);

  const [form, setForm] = useState<UrbanMorphologyForm>(() =>
    restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
  );

  const selectedIndicators = DEMO_DATASET.indicators.filter((indicator) =>
    form.selectedIndicatorIds.includes(indicator.id),
  );
  const preparedInput = buildMorphologyInput(form);
  const MAX_STEP = STEPS.length - 1;

  const readiness = useMemo(() => evaluateWorkflowReadiness({
    runtimeMode: "demo",
    hasActiveContext: urbanContextId !== null,
    requiredInputs: [
      {
        id: "indicator-count",
        message: "At least two indicators are required for defensible morphology clustering.",
        remediation: "Select at least two indicators in the Variables step.",
        satisfied: selectedIndicators.length >= 2,
      },
      {
        id: "sample-size",
        message: `Need at least ${form.clusterCount} complete study units for k=${form.clusterCount}.`,
        remediation: "Adjust k or include indicators with lower missingness so enough units remain.",
        satisfied: preparedInput.includedUnits.length >= form.clusterCount,
      },
    ],
    environmentChecks: [
      {
        id: "worker-availability",
        message: "Background workers are unavailable in this environment.",
        remediation: "Run this workflow in a browser environment with Worker support.",
        satisfied: typeof Worker !== "undefined",
      },
    ],
    methodValidity: FLOW_META?.validityEnvelope ?? null,
    dataFitness: null,
  }), [
    urbanContextId,
    selectedIndicators.length,
    form.clusterCount,
    preparedInput.includedUnits.length,
  ]);

  const updateForm = <K extends keyof UrbanMorphologyForm>(key: K, value: UrbanMorphologyForm[K]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      setStepData(FORM_KEY, next);
      return next;
    });
  };

  const toggleIndicator = (indicatorId: string) => {
    const selected = form.selectedIndicatorIds.includes(indicatorId)
      ? form.selectedIndicatorIds.filter((value) => value !== indicatorId)
      : [...form.selectedIndicatorIds, indicatorId];
    updateForm("selectedIndicatorIds", selected);
  };

  const handleExportJSON = () => {
    const payload = exportFlowJSON(
      "urban_morphology",
      form as unknown as Record<string, unknown>,
      {
        summary: runState
          ? {
              meanSilhouette: runState.clusterResult.meanSilhouette,
              totalWcss: runState.clusterResult.totalWcss,
              usableUnits: runState.preparedInput.includedUnits.length,
              skippedUnits: runState.preparedInput.skippedUnits,
              clusterCounts: buildClusterCounts(runState.clusterResult),
            }
          : {
              usableUnits: preparedInput.includedUnits.length,
              skippedUnits: preparedInput.skippedUnits,
            },
      },
    );
    downloadJSON(payload);
  };

  const runClustering = async () => {
    if (readiness.status === "blocked") {
      const blockedReasons = readiness.issues
        .filter((issue) => issue.severity === "blocked")
        .map((issue) => issue.message);
      const message = blockedReasons[0] ?? "Workflow readiness is blocked. Resolve blockers before running.";
      setRunError(message);
      registerEvidenceArtifact({
        kind: "workflow-run",
        title: `${form.scenarioName.trim() || "Urban Morphology"} readiness gate blocked`,
        summary: message,
        state: "invalid",
        sourceModule: "urban-analytics",
        flowId: "urban_morphology",
        linkedContextId: urbanContextId ?? undefined,
        tags: ["workflow", "readiness", "blocked"],
        qa: {
          state: "invalid",
          warnings: blockedReasons,
          limitations: readiness.remediationActions,
          invalidReason: message,
        },
        metadata: {
          readinessStatus: readiness.status,
          issueCount: readiness.issues.length,
          blockerCount: blockedReasons.length,
          remediationCount: readiness.remediationActions.length,
        },
      });
      return;
    }

    setRunError(null);
    setIsRunning(true);

    const runId = `urban-morphology-${Date.now()}`;
    const layerName = `${form.scenarioName.trim() || "Urban Morphology"} · K-Means`;
    const preparedSnapshot = buildMorphologyInput(form);
    const formSnapshot = snapshotForm(form);

    try {
      const viewResult = () => {
        openMapExplorer();
        setStep(3);
      };

      const clusteringHandle = executeKMeansClusteringAsync({
        data: preparedSnapshot.matrix,
        options: {
          k: formSnapshot.clusterCount,
          seed: formSnapshot.randomSeed,
        },
      }, {
        timeoutMs: 180_000,
        viewAction: {
          label: "View result",
          onClick: viewResult,
        },
      });

      openTaskPanel();

      const clusterResult = await clusteringHandle.promise;
      const adapted = adaptClusterResult({
        featureCollection: preparedSnapshot.featureCollection,
        result: clusterResult,
        layerId: `${slugify(formSnapshot.scenarioName)}-${runId}`,
        layerName,
        runId,
        labelPrefix: "Morphotype",
        parameters: {
          clusterCount: formSnapshot.clusterCount,
          randomSeed: formSnapshot.randomSeed,
          selectedIndicators: preparedSnapshot.columnLabels,
          standardizeInputs: formSnapshot.standardizeInputs,
          includePopulation: formSnapshot.includePopulation,
          skippedUnits: preparedSnapshot.skippedUnits,
        },
      });

      addOverlayLayer(adapted.layer);

      const nextRunState: UrbanMorphologyRunState = {
        clusterResult,
        preparedInput: preparedSnapshot,
        formSnapshot,
        layerName,
        runId,
      };

      const completedRun = createAnalysisCompletedRun(adapted, {
        flowId: "urban_morphology",
        runId,
        label: layerName,
        paragraph: buildRunNarrative(nextRunState),
        paragraphPreview: buildRunNarrative(nextRunState),
        paragraphFull: buildRunNarrative(nextRunState),
        chartOutputs: [
          {
            id: `${runId}-cluster-counts`,
            type: "bar",
            title: `${layerName} Cluster Membership`,
            data: buildClusterCounts(clusterResult).map((entry) => ({
              cluster: `Morphotype ${entry.clusterId}`,
              count: entry.count,
            })),
          },
        ],
        dataOutputs: [
          {
            id: `${runId}-assignments`,
            format: "cluster-assignments",
            rows: preparedSnapshot.includedUnits.length,
            columns: ["unit", "group", "typology", "cluster", "silhouette"],
            preview: preparedSnapshot.includedUnits.slice(0, 8).map((unit, index) => ({
              unit: unit.label,
              group: unit.group,
              typology: unit.typology,
              cluster: `Morphotype ${(clusterResult.labels[index] ?? 0) + 1}`,
              silhouette: clusterResult.silhouetteScores[index] ?? null,
            })),
          },
        ],
      });
      upsertCompletedRun(completedRun);

      registerManifest(buildRunManifest(completedRun, {
        contextId: urbanContextId,
        inputs: {
          selectedIndicatorIds: [...formSnapshot.selectedIndicatorIds],
          includedUnitCount: preparedSnapshot.includedUnits.length,
          skippedUnits: [...preparedSnapshot.skippedUnits],
        },
        parameters: {
          scenarioName: formSnapshot.scenarioName,
          clusterCount: formSnapshot.clusterCount,
          randomSeed: formSnapshot.randomSeed,
          includePopulation: formSnapshot.includePopulation,
          standardizeInputs: formSnapshot.standardizeInputs,
        },
        methodValidity: FLOW_META?.validityEnvelope ?? null,
        dataFitness: null,
        mapArtifactIds: adapted.layer.id ? [adapted.layer.id] : [],
        runtimeMode: "demo",
        readiness,
      }));

      // Register a workflow-run evidence artifact so the evidence tray and
      // right panel dossier reflect this completed run.
      registerEvidenceArtifact({
        kind: "workflow-run",
        title: layerName,
        summary: `K-means morphotype clustering (k=${formSnapshot.clusterCount}) completed in demo mode. ` +
          `${preparedSnapshot.includedUnits.length} districts classified into ${formSnapshot.clusterCount} morphotypes. ` +
          `Mean silhouette: ${clusterResult.meanSilhouette.toFixed(3)}. ` +
          `This is a demo-mode run — method validity envelope and real data fitness have not been evaluated.`,
        state: "published",
        sourceModule: "urban-analytics",
        flowId: "urban_morphology",
        cardId: "typo-urban-morphology-classification",
        linkedRunId: runId,
        linkedContextId: urbanContextId ?? undefined,
        linkedLayerIds: adapted.layer.id ? [adapted.layer.id] : [],
        tags: ["workflow", "clustering", "morphology", "demo"],
        provenance: {
          sourceModule: "urban-analytics",
          createdAt: new Date().toISOString(),
          runId,
          flowId: "urban_morphology",
          methodId: "typo-urban-morphology-classification",
          methodName: "Urban Morphology Clustering",
          layerIds: adapted.layer.id ? [adapted.layer.id] : [],
          filePaths: [],
          inputArtifactIds: [],
          parentArtifactIds: [],
          notes: `Demo run. k=${formSnapshot.clusterCount}, seed=${formSnapshot.randomSeed}.`,
        },
        qa: {
          state: "warning",
          warnings: [
            "Run executed in demo mode — not production-ready evidence.",
            "Method validity envelope is not available for this workflow.",
            "Data fitness profile is not evaluated for this run.",
          ],
          limitations: [
            "Attach a method validity envelope to the workflow metadata.",
            "Evaluate data fitness before interpreting this run as production-ready evidence.",
            "Keep demo labels visible in all downstream publications.",
          ],
        },
        metadata: {
          runtimeMode: "demo",
          clusterCount: formSnapshot.clusterCount,
          includedUnits: preparedSnapshot.includedUnits.length,
          skippedUnits: preparedSnapshot.skippedUnits.length,
          meanSilhouette: Math.round(clusterResult.meanSilhouette * 1000) / 1000,
          totalWcss: Math.round(clusterResult.totalWcss * 100) / 100,
        },
      });

      setRunState(nextRunState);
      setStep(3);

      toastSuccess(`${layerName} published from the shared worker pool.`, {
        action: {
          label: "View result",
          onClick: viewResult,
        },
      });
    } catch (error) {
      if (isBackgroundTaskCancelledError(error)) {
        setRunError(null);
        toastInfo("Urban morphology clustering was cancelled.", {
          action: {
            label: "Open tasks",
            onClick: () => openTaskPanel(),
          },
        });
      } else {
        const message = error instanceof Error ? error.message : "Urban morphology clustering failed.";
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

  const clusterCounts = runState ? buildClusterCounts(runState.clusterResult) : [];

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>{FLOW_DEF.icon} {FLOW_DEF.label}</div>
          <div className={styles.flowTitleMeta}>Step {step + 1} of {STEPS.length}</div>
        </div>
        <div className={styles.flowSubtitle}>{FLOW_DEF.description}</div>
      </header>

      <StepPills
        steps={STEPS.map((entry) => ({ key: entry.key, label: entry.label }))}
        currentIndex={step}
        onSelect={(nextStep) => setStep(clamp(nextStep, 0, MAX_STEP))}
      />

      <div className={styles.flowBodyArea}>
        {step === 0 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Study Units</div>
            <p className={styles.formHint}>
              This morphology exercise uses twelve synthetic districts with polygon geometry, socioeconomic attributes, and environmental indicators so the clustering contract can publish directly into Map Explorer.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <div className={styles.readonlyBlock}>Districts: {DEMO_DATASET.units.length}</div>
              <div className={styles.readonlyBlock}>Indicators: {DEMO_DATASET.indicators.length}</div>
              <div className={styles.readonlyBlock}>Bounds: {DEMO_DATASET.bounds.map((value) => value.toFixed(3)).join(", ")}</div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formLabel}>District Inventory</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {DEMO_DATASET.units.map((unit) => (
                  <div key={unit.id} className={styles.readonlyBlock}>
                    <strong>{unit.label}</strong>
                    <div className={styles.formHint}>{String(unit.group ?? "unassigned").toUpperCase()} · {String(unit.properties?.typology ?? "Unknown")}</div>
                    <div className={styles.formHint}>Population: {Number(unit.properties?.population ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Variables</div>
            <p className={styles.formHint}>
              Select the indicator bundle that defines urban form. Districts with missing values in any selected field are screened out before clustering to keep the solution statistically coherent.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              {DEMO_DATASET.indicators.map((indicator) => {
                const checked = form.selectedIndicatorIds.includes(indicator.id);
                return (
                  <label
                    key={indicator.id}
                    className={styles.readonlyBlock}
                    style={{ display: "grid", gap: 6, cursor: "pointer", borderColor: checked ? "var(--syn-accent-primary)" : undefined }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIndicator(indicator.id)}
                      />
                      <strong>{indicator.label}</strong>
                    </span>
                    <span className={styles.formHint}>{indicator.description}</span>
                    <span className={styles.formHint}>{indicator.group} · Reference {indicator.referenceValue} {indicator.unit}</span>
                  </label>
                );
              })}
            </div>

            <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <input
                type="checkbox"
                checked={form.includePopulation}
                onChange={(event) => updateForm("includePopulation", event.target.checked)}
              />
              Include population as an additional morphology dimension
            </label>

            <div className={styles.readonlyBlock} style={{ marginTop: 14 }}>
              Usable districts with current selection: {preparedInput.includedUnits.length} / {DEMO_DATASET.units.length}
              {preparedInput.skippedUnits.length > 0 ? ` · Skipped: ${preparedInput.skippedUnits.join(", ")}` : ""}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Model Settings</div>
            <p className={styles.formHint}>
              K-means is sensitive to scale. Standardising the selected inputs is recommended unless all variables already share a common measurement range.
            </p>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Scenario label
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.scenarioName}
                  onChange={(event) => updateForm("scenarioName", event.target.value)}
                  style={{ marginLeft: "0.5rem", width: "20rem" }}
                />
              </label>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Cluster count (k)
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={form.clusterCount}
                  onChange={(event) => updateForm("clusterCount", Number(event.target.value))}
                  style={{ marginLeft: "0.5rem" }}
                />
                <span style={{ minWidth: "3rem", textAlign: "right" }}>{form.clusterCount}</span>
              </label>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Random seed
                <input
                  type="number"
                  className={styles.textInput}
                  value={form.randomSeed}
                  onChange={(event) => updateForm("randomSeed", Number(event.target.value) || DEFAULT_FORM.randomSeed)}
                  style={{ marginLeft: "0.5rem", width: "8rem" }}
                />
              </label>
            </div>

            <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.standardizeInputs}
                onChange={(event) => updateForm("standardizeInputs", event.target.checked)}
              />
              Z-score selected indicators before clustering
            </label>

            <div className={styles.readonlyBlock} style={{ marginTop: 14 }}>
              Worker-ready matrix: {preparedInput.includedUnits.length} rows × {preparedInput.columnLabels.length} columns
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Run And Publish</div>
            <p className={styles.formHint}>
              The shared worker pool will queue this run, report progress in the task panel, and publish the resulting morphotype layer into Map Explorer once complete.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div className={styles.readonlyBlock}>Selected indicators: {preparedInput.columnLabels.join(", ") || "None"}</div>
              <div className={styles.readonlyBlock}>Complete districts: {preparedInput.includedUnits.length}</div>
              <div className={styles.readonlyBlock}>Missing-data exclusions: {preparedInput.skippedUnits.length}</div>
            </div>

            <div
              className={styles.readonlyBlock}
              style={{
                marginTop: 14,
                borderColor:
                  readiness.status === "blocked"
                    ? "var(--syn-danger-border)"
                    : readiness.status === "warning" || readiness.status === "demo_only"
                      ? "var(--syn-accent-primary)"
                      : undefined,
              }}
            >
              <strong>Readiness: {readiness.status.replace("_", " ").toUpperCase()}</strong>
              <div className={styles.formHint}>Runtime mode: {readiness.runtimeMode.toUpperCase()}</div>
              <div className={styles.formHint}>Checked: {new Date(readiness.checkedAt).toLocaleString()}</div>
              {readiness.reasons.length > 0 ? (
                <div className={styles.formHint} style={{ marginTop: 8 }}>
                  Reasons: {readiness.reasons.join(" | ")}
                </div>
              ) : (
                <div className={styles.formHint} style={{ marginTop: 8 }}>No blockers detected.</div>
              )}
              {readiness.remediationActions.length > 0 ? (
                <div className={styles.formHint} style={{ marginTop: 8 }}>
                  Remediation: {readiness.remediationActions.join(" | ")}
                </div>
              ) : null}
            </div>

            {runError ? <div className={styles.readonlyBlock} style={{ marginTop: 14, borderColor: "var(--syn-danger-border)" }}>{runError}</div> : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => { void runClustering(); }}
                disabled={isRunning || readiness.status === "blocked"}
              >
                {isRunning ? "Running k-means in background..." : readiness.status === "blocked" ? "Resolve blockers to run" : "Run k-means morphology"}
              </button>
              <button type="button" className={styles.outlineBtn} onClick={handleExportJSON}>
                Export JSON
              </button>
              {runState ? (
                <button type="button" className={styles.outlineBtn} onClick={() => openMapExplorer()}>
                  Open Map Explorer
                </button>
              ) : null}
            </div>

            {runState ? (
              <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  <div className={styles.readonlyBlock}>Mean silhouette: {formatMetric(runState.clusterResult.meanSilhouette)}</div>
                  <div className={styles.readonlyBlock}>Total WCSS: {formatMetric(runState.clusterResult.totalWcss, 1)}</div>
                  <div className={styles.readonlyBlock}>Published layer: {runState.layerName}</div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Cluster Composition</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    {clusterCounts.map((entry) => (
                      <div key={entry.clusterId} className={styles.readonlyBlock}>
                        <strong>Morphotype {entry.clusterId}</strong>
                        <div className={styles.formHint}>{entry.count} district(s)</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Assignment Preview</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {runState.preparedInput.includedUnits.map((unit, index) => (
                      <div key={unit.id} className={styles.readonlyBlock}>
                        <strong>{unit.label}</strong>
                        <div className={styles.formHint}>
                          {unit.typology} · Morphotype {(runState.clusterResult.labels[index] ?? 0) + 1} · Silhouette {formatMetric(runState.clusterResult.silhouetteScores[index] ?? 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <CrossPanelActions flowId="urban_morphology" stepLabel={STEPS[step].label} />

      <footer className={styles.flowFooter} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem" }}>
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

export default UrbanMorphologyFlow;