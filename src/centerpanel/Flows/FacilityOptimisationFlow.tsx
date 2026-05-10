import React, { useMemo, useState } from "react";
import {
  adaptFacilityCatchmentsResult,
  adaptFacilitySitesResult,
  createAnalysisCompletedRun,
  createAnalysisMapOutput,
} from "@/services/map/MapEngineAdapter";
import {
  type FacilityCandidateSite,
  type FacilityDemandPoint,
  type FacilityEquityMode,
  type FacilityOptimisationModel,
  type FacilityOptimisationResult,
  runFacilityOptimisation,
} from "@/engine/simulation";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { downloadJSON, exportFlowJSON, restoreFormState } from "./flowUtils";
import StepPills from "./StepPills";
import { FLOW_DEFINITIONS } from "./flowTypes";
import styles from "../styles/flows.module.css";
import CrossPanelActions from "./rail/CrossPanelActions";
import { buildFacilityOptimisationDemoDataset } from "./facilityOptimisationDemo";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildFacilityOptimisationNarrativeInput } from "./narrativeBuilders";

const FLOW_DEF = FLOW_DEFINITIONS.find((definition) => definition.id === "facility_optimisation")!;
const STEPS = FLOW_DEF.steps;
const FORM_KEY = "facility_optimisation_form";
const DEMO_DATASET = buildFacilityOptimisationDemoDataset();

type CandidateCategory = "public_land" | "co_location" | "private_parcel";

interface FacilityOptimisationForm {
  scenarioName: string;
  model: FacilityOptimisationModel;
  selectedCategories: CandidateCategory[];
  facilityCount: number;
  serviceRadiusKm: number;
  equityMode: FacilityEquityMode;
  equityWeight: number;
  priorityGroups: string[];
  minGroupCoverageRatio: number;
  maxMeanTravelGapKm: number;
}

interface VariantRun {
  id: string;
  label: string;
  result: FacilityOptimisationResult;
  formSnapshot: FacilityOptimisationForm;
}

const DEFAULT_FORM: FacilityOptimisationForm = {
  scenarioName: DEMO_DATASET.defaultScenarioName,
  model: "p_median",
  selectedCategories: ["public_land", "co_location", "private_parcel"],
  facilityCount: DEMO_DATASET.recommendedFacilityCount,
  serviceRadiusKm: DEMO_DATASET.serviceRadiusKm,
  equityMode: "none",
  equityWeight: 0.7,
  priorityGroups: ["low_income"],
  minGroupCoverageRatio: 0.82,
  maxMeanTravelGapKm: 1.2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "facility-optimisation";
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetric(value: number | null | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${value.toFixed(2)}${suffix}`;
}

function modelLabel(model: FacilityOptimisationModel): string {
  switch (model) {
    case "p_median":
      return "P-median";
    case "lscp":
      return "LSCP";
    case "mclp":
      return "MCLP";
    default:
      return model;
  }
}

function equityLabel(mode: FacilityEquityMode): string {
  switch (mode) {
    case "maximin":
      return "Maximin";
    case "constraint":
      return "Constraint";
    default:
      return "None";
  }
}

function projectPoint(
  lng: number,
  lat: number,
  bounds: [number, number, number, number],
  width: number,
  height: number,
): { x: number; y: number } {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  return { x, y };
}

function buildNarrative(
  form: FacilityOptimisationForm,
  result: FacilityOptimisationResult,
): string {
  return [
    `${form.scenarioName} executed with ${modelLabel(form.model)} and ${result.selectedSiteCount} selected site(s).`,
    `Demand served ${result.demandSummary.demandServed.toFixed(0)} of ${result.demandSummary.totalDemand.toFixed(0)}; covered demand ${formatPercent(result.demandSummary.coveredDemandRatio)} within ${form.serviceRadiusKm.toFixed(1)} km.`,
    `Mean travel burden ${formatMetric(result.demandSummary.meanTravelBurdenKm, " km")}; max travel ${formatMetric(result.demandSummary.maxTravelBurdenKm, " km")}.`,
    `Equity mode ${equityLabel(form.equityMode)}. Maximin coverage ${formatPercent(result.equityDiagnostics.maximinCoverageScore)}, coverage gap ${formatPercent(result.equityDiagnostics.coverageGap)}, mean-travel gap ${formatMetric(result.equityDiagnostics.meanTravelGapKm, " km")}.`,
    `Priority groups: ${form.priorityGroups.join(", ") || "none"}.`,
  ].join("\n");
}

function buildComparisonCsv(variants: VariantRun[]): string {
  const header = [
    "label",
    "model",
    "selected_sites",
    "demand_served",
    "covered_demand_ratio",
    "mean_travel_burden_km",
    "coverage_gap",
    "mean_travel_gap_km",
    "objective_name",
    "objective_value",
  ];

  const rows = variants.map((variant) => [
    variant.label,
    variant.result.model,
    variant.result.selectedSiteCount,
    variant.result.demandSummary.demandServed,
    variant.result.demandSummary.coveredDemandRatio,
    variant.result.demandSummary.meanTravelBurdenKm,
    variant.result.equityDiagnostics.coverageGap,
    variant.result.equityDiagnostics.meanTravelGapKm,
    variant.result.objectiveName,
    variant.result.objectiveValue,
  ]);

  return `${header.join(",")}\n${rows.map((row) => row.join(",")).join("\n")}\n`;
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

const CandidateDemandPreview: React.FC<{
  bounds: [number, number, number, number];
  demandPoints: FacilityDemandPoint[];
  candidateSites: FacilityCandidateSite[];
  result?: FacilityOptimisationResult | null;
}> = ({ bounds, demandPoints, candidateSites, result }) => {
  const width = 520;
  const height = 320;
  const selectedIds = new Set(result?.chosenSites.map((site) => site.siteId) ?? []);
  const assignments = new Map(
    result?.assignments.map((assignment) => [assignment.demandId, assignment]) ?? [],
  );

  return (
    <div
      style={{
        border: "1px solid var(--syn-overlay-light)",
        borderRadius: 10,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        padding: 10,
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        <rect x={0} y={0} width={width} height={height} rx={12} fill="#0B1220" />
        <g opacity={0.16} stroke="#94A3B8" strokeWidth={1}>
          {Array.from({ length: 5 }, (_, index) => (
            <line key={`grid-x-${index}`} x1={(width / 4) * index} y1={0} x2={(width / 4) * index} y2={height} />
          ))}
          {Array.from({ length: 5 }, (_, index) => (
            <line key={`grid-y-${index}`} x1={0} y1={(height / 4) * index} x2={width} y2={(height / 4) * index} />
          ))}
        </g>
        {result?.catchments.map((catchment) => (
          <path
            key={catchment.siteId}
            d={`M ${catchment.geometry.coordinates[0]
              .map(([lng, lat], index) => {
                const point = projectPoint(lng, lat, bounds, width, height);
                return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
              })
              .join(" ")} Z`}
            fill="rgba(14,165,233,0.16)"
            stroke="rgba(14,165,233,0.7)"
            strokeWidth={1.5}
          />
        ))}
        {demandPoints.map((demand) => {
          const point = projectPoint(demand.lng, demand.lat, bounds, width, height);
          const assignment = assignments.get(demand.id);
          const fill = result
            ? assignment?.covered ? "#F59E0B" : "#EF4444"
            : demand.equityGroup === "low_income" ? "#F97316" : "#CBD5E1";
          return (
            <circle
              key={demand.id}
              cx={point.x}
              cy={point.y}
              r={Math.max(4, Math.sqrt(demand.demand) / 6.5)}
              fill={fill}
              opacity={0.88}
              stroke="#111827"
              strokeWidth={1}
            />
          );
        })}
        {candidateSites.map((site) => {
          const point = projectPoint(site.lng, site.lat, bounds, width, height);
          const selected = selectedIds.has(site.id);
          return (
            <rect
              key={site.id}
              x={point.x - 5}
              y={point.y - 5}
              width={10}
              height={10}
              fill={selected ? "#22C55E" : "#94A3B8"}
              stroke={selected ? "#DCFCE7" : "#111827"}
              strokeWidth={selected ? 1.5 : 1}
              rx={selected ? 2 : 1}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {[
          { label: "Demand", color: result ? "#F59E0B" : "#CBD5E1" },
          { label: "Low-income demand", color: "#F97316" },
          { label: "Candidate site", color: "#94A3B8" },
          { label: "Selected facility", color: "#22C55E" },
          { label: "Uncovered demand", color: "#EF4444" },
        ].map((entry) => (
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
            <span style={{ width: 10, height: 10, borderRadius: 999, background: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const FacilityOptimisationFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRun[]>([]);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  const { stepData, setStepData, upsertCompletedRun } = useFlowStore();
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);

  const [form, setForm] = useState<FacilityOptimisationForm>(() =>
    restoreFormState(stepData, FORM_KEY, DEFAULT_FORM),
  );

  const categoryOptions = useMemo(
    () =>
      [...new Set(DEMO_DATASET.candidateSites.map((site) => site.category).filter(Boolean))] as CandidateCategory[],
    [],
  );
  const equityGroups = useMemo(
    () =>
      [...new Set(DEMO_DATASET.demandPoints.map((point) => point.equityGroup ?? "all"))],
    [],
  );

  const filteredCandidates = useMemo(
    () =>
      DEMO_DATASET.candidateSites.filter((site) =>
        site.category ? form.selectedCategories.includes(site.category as CandidateCategory) : true,
      ),
    [form.selectedCategories],
  );

  const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? null;
  const activeResult = activeVariant?.result ?? null;
  const activeVariantCandidates = useMemo(() => {
    if (!activeVariant) {
      return filteredCandidates;
    }
    return DEMO_DATASET.candidateSites.filter((site) =>
      site.category
        ? activeVariant.formSnapshot.selectedCategories.includes(site.category as CandidateCategory)
        : true,
    );
  }, [activeVariant, filteredCandidates]);
  const canRun =
    filteredCandidates.length > 0 &&
    (form.model === "lscp" || form.facilityCount <= filteredCandidates.length);

  const updateForm = <K extends keyof FacilityOptimisationForm>(
    key: K,
    value: FacilityOptimisationForm[K],
  ) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      setStepData(FORM_KEY, next);
      return next;
    });
  };

  const toggleCategory = (category: CandidateCategory) => {
    const next = form.selectedCategories.includes(category)
      ? form.selectedCategories.filter((value) => value !== category)
      : [...form.selectedCategories, category];
    updateForm("selectedCategories", next);
  };

  const togglePriorityGroup = (group: string) => {
    const next = form.priorityGroups.includes(group)
      ? form.priorityGroups.filter((value) => value !== group)
      : [...form.priorityGroups, group];
    updateForm("priorityGroups", next);
  };

  const runVariant = async () => {
    if (!canRun) {
      setRunError("Adjust candidate filters or facility count before running the optimisation.");
      return;
    }

    setRunError(null);
    setIsRunning(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 30));

    try {
      const scenarioLabel = `${form.scenarioName.trim() || "Facility scenario"} — ${modelLabel(form.model)}`;
      const result = runFacilityOptimisation({
        model: form.model,
        demandPoints: DEMO_DATASET.demandPoints,
        candidateSites: filteredCandidates,
        serviceRadiusKm: form.serviceRadiusKm,
        scenarioName: scenarioLabel,
        ...(form.model !== "lscp" ? { facilityCount: form.facilityCount } : {}),
        equity: {
          mode: form.equityMode,
          objectiveWeight: form.equityWeight,
          priorityGroups: form.priorityGroups,
          ...(form.equityMode === "constraint"
            ? {
                minGroupCoverageRatio: form.minGroupCoverageRatio,
                maxMeanTravelGapKm: form.maxMeanTravelGapKm,
              }
            : {}),
        },
      });

      const runId = `facility-optimisation-${Date.now()}`;
      const adaptedCatchments = adaptFacilityCatchmentsResult({
        result,
        runId,
        layerId: `${slugify(scenarioLabel)}-${runId}-catchments`,
        layerName: `${scenarioLabel} Catchments`,
        parameters: {
          model: form.model,
          facilityCount: form.model === "lscp" ? result.selectedSiteCount : form.facilityCount,
          serviceRadiusKm: form.serviceRadiusKm,
          equityMode: form.equityMode,
          priorityGroups: form.priorityGroups,
        },
      });
      const adaptedSites = adaptFacilitySitesResult({
        result,
        runId,
        layerId: `${slugify(scenarioLabel)}-${runId}-sites`,
        layerName: `${scenarioLabel} Sites`,
        parameters: {
          model: form.model,
          facilityCount: form.model === "lscp" ? result.selectedSiteCount : form.facilityCount,
          serviceRadiusKm: form.serviceRadiusKm,
          equityMode: form.equityMode,
          priorityGroups: form.priorityGroups,
        },
      });

      addOverlayLayer(adaptedCatchments.layer);
      addOverlayLayer(adaptedSites.layer);

      const narrative = buildNarrative(form, result);
      upsertCompletedRun(
        createAnalysisCompletedRun(adaptedCatchments, {
          flowId: "facility_optimisation",
          runId,
          label: scenarioLabel,
          paragraph: narrative,
          paragraphPreview: narrative,
          paragraphFull: narrative,
          mapOutputs: [
            createAnalysisMapOutput(adaptedCatchments),
            createAnalysisMapOutput(adaptedSites),
          ],
          chartOutputs: [
            {
              id: `${runId}-coverage-by-group`,
              type: "bar",
              title: `${scenarioLabel} Coverage by Group`,
              data: result.equityDiagnostics.groups.map((group) => ({
                group: group.group,
                coverageRatio: group.coverageRatio,
                meanTravelKm: group.meanTravelKm,
              })),
            },
            {
              id: `${runId}-site-demand`,
              type: "bar",
              title: `${scenarioLabel} Demand by Selected Site`,
              data: result.chosenSites.map((site) => ({
                site: site.label,
                assignedDemand: site.assignedDemand,
                coveredDemand: site.coveredDemand,
              })),
            },
          ],
          dataOutputs: [
            {
              id: `${runId}-sites`,
              format: "selected-sites",
              rows: result.chosenSites.length,
              columns: ["site", "assignedDemand", "coveredDemand", "meanAssignedDistanceKm"],
              preview: result.chosenSites.map((site) => ({
                site: site.label,
                assignedDemand: site.assignedDemand,
                coveredDemand: site.coveredDemand,
                meanAssignedDistanceKm: site.meanAssignedDistanceKm,
              })),
            },
            {
              id: `${runId}-equity`,
              format: "equity-audit-bridge",
              rows: result.equityAuditBridge.records.length,
              columns: ["demandLabel", "equityGroup", "demand", "servedDemand", "coverageRatio", "travelKm"],
              preview: result.equityAuditBridge.records.slice(0, 8),
            },
            {
              id: `${runId}-assignments`,
              format: "demand-assignments",
              rows: result.assignments.length,
              columns: ["demandLabel", "assignedSiteLabel", "distanceKm", "covered"],
              preview: result.assignments.slice(0, 8).map((assignment) => ({
                demandLabel: assignment.demandLabel,
                assignedSiteLabel: assignment.assignedSiteLabel,
                distanceKm: assignment.distanceKm,
                covered: assignment.covered,
              })),
            },
          ],
        }),
      );

      const variantId = `${runId}-${form.model}`;
      const variant: VariantRun = {
        id: variantId,
        label: scenarioLabel,
        result,
        formSnapshot: { ...form },
      };

      setVariants((previous) => [...previous.slice(-5), variant]);
      setActiveVariantId(variantId);
      setStep(3);
    } catch (error) {
      setRunError(
        error instanceof Error ? error.message : "Facility optimisation failed.",
      );
    } finally {
      setIsRunning(false);
    }
  };

  const exportCurrentResult = () => {
    if (!activeResult || !activeVariant) {
      return;
    }
    downloadTextFile(
      `${slugify(activeVariant.label)}.json`,
      JSON.stringify(activeResult, null, 2),
    );
  };

  const exportComparisonTable = () => {
    if (variants.length === 0) {
      return;
    }
    downloadTextFile(
      `${slugify(form.scenarioName)}-comparison.csv`,
      buildComparisonCsv(variants),
      "text/csv;charset=utf-8",
    );
  };

  const exportWorkflowJson = () => {
    const payload = exportFlowJSON("facility_optimisation", form as unknown as Record<string, unknown>, {
      variants: variants.map((variant) => ({
        label: variant.label,
        model: variant.result.model,
        selectedSiteCount: variant.result.selectedSiteCount,
        coveredDemandRatio: variant.result.demandSummary.coveredDemandRatio,
        meanTravelBurdenKm: variant.result.demandSummary.meanTravelBurdenKm,
      })),
    });
    downloadJSON(payload);
  };

  const MAX_STEP = STEPS.length - 1;
  const activeNarrativeInput = activeResult
    ? buildFacilityOptimisationNarrativeInput(
        {
          scenarioName: activeVariant?.label ?? form.scenarioName,
          model: form.model,
          serviceRadiusKm: form.serviceRadiusKm,
          equityMode: form.equityMode,
          priorityGroups: form.priorityGroups,
        },
        activeResult,
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
            <div className={styles.stepCardTitle}>Model Selection & Candidate Map Input</div>
            <p className={styles.formHint}>
              Review the demo district demand and candidate-site layer, select the optimisation model, and filter the candidate map input before running facility siting variants.
            </p>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Scenario name
                <input type="text" className={styles.textInput} value={form.scenarioName} onChange={(event) => updateForm("scenarioName", event.target.value)} style={{ marginTop: 6 }} />
              </label>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Optimisation model</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["p_median", "lscp", "mclp"] as FacilityOptimisationModel[]).map((model) => (
                  <label key={model} className={styles.checkboxRow}>
                    <input type="radio" checked={form.model === model} onChange={() => updateForm("model", model)} />
                    {modelLabel(model)}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Candidate site filters</div>
              {categoryOptions.map((category) => (
                <label key={category} className={styles.checkboxRow}>
                  <input type="checkbox" checked={form.selectedCategories.includes(category)} onChange={() => toggleCategory(category)} />
                  {category.replace(/_/g, " ")}
                </label>
              ))}
              <div className={styles.formHint}>
                {filteredCandidates.length} candidate sites active; {DEMO_DATASET.demandPoints.length} demand points in the study district.
              </div>
            </div>
            <CandidateDemandPreview bounds={DEMO_DATASET.bounds} demandPoints={DEMO_DATASET.demandPoints} candidateSites={filteredCandidates} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Constraint Configuration & Equity Controls</div>
            <p className={styles.formHint}>
              Configure facility counts, service catchments, and equity-aware logic. Maximin boosts the worst-served group; constraint mode enforces coverage floors or travel-gap limits with penalty-style feasibility handling.
            </p>
            {form.model !== "lscp" ? (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  Facility count
                  <input
                    type="number"
                    className={styles.textInput}
                    value={form.facilityCount}
                    min={1}
                    max={Math.max(filteredCandidates.length, 1)}
                    onChange={(event) => updateForm("facilityCount", clamp(Number(event.target.value) || 1, 1, Math.max(filteredCandidates.length, 1)))}
                    style={{ marginTop: 6, width: 120 }}
                  />
                </label>
              </div>
            ) : (
              <div className={styles.formSection}>
                <div className={styles.readonlyBlock}>
                  LSCP selects the minimum number of sites needed to cover the demand set within the configured service radius.
                </div>
              </div>
            )}
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Service radius (km)</div>
              <input type="range" min={0.8} max={4} step={0.1} value={form.serviceRadiusKm} onChange={(event) => updateForm("serviceRadiusKm", Number(event.target.value))} style={{ width: "100%" }} />
              <div className={styles.formHint}>{form.serviceRadiusKm.toFixed(1)} km catchment radius for coverage diagnostics and catchment polygons.</div>
            </div>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Equity mode</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["none", "maximin", "constraint"] as FacilityEquityMode[]).map((mode) => (
                  <label key={mode} className={styles.checkboxRow}>
                    <input type="radio" checked={form.equityMode === mode} onChange={() => updateForm("equityMode", mode)} />
                    {equityLabel(mode)}
                  </label>
                ))}
              </div>
            </div>
            {form.equityMode !== "none" ? (
              <>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Priority demographic groups</div>
                  {equityGroups.map((group) => (
                    <label key={group} className={styles.checkboxRow}>
                      <input type="checkbox" checked={form.priorityGroups.includes(group)} onChange={() => togglePriorityGroup(group)} />
                      {group.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Equity objective weight</div>
                  <input type="range" min={0} max={2} step={0.05} value={form.equityWeight} onChange={(event) => updateForm("equityWeight", Number(event.target.value))} style={{ width: "100%" }} />
                  <div className={styles.formHint}>{form.equityWeight.toFixed(2)}</div>
                </div>
              </>
            ) : null}
            {form.equityMode === "constraint" ? (
              <>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Minimum group coverage ratio</div>
                  <input type="range" min={0.5} max={1} step={0.01} value={form.minGroupCoverageRatio} onChange={(event) => updateForm("minGroupCoverageRatio", Number(event.target.value))} style={{ width: "100%" }} />
                  <div className={styles.formHint}>{formatPercent(form.minGroupCoverageRatio)}</div>
                </div>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Maximum mean-travel gap (km)</div>
                  <input type="range" min={0.3} max={2.5} step={0.05} value={form.maxMeanTravelGapKm} onChange={(event) => updateForm("maxMeanTravelGapKm", Number(event.target.value))} style={{ width: "100%" }} />
                  <div className={styles.formHint}>{formatMetric(form.maxMeanTravelGapKm, " km")}</div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Run Facility Variants</div>
            <p className={styles.formHint}>
              Execute the configured scenario. Each run is preserved as a variant for side-by-side comparison and also published into completed runs for review or Equity Audit import.
            </p>
            <div className={styles.readonlyBlock}>
              Model: {modelLabel(form.model)}
              {"\n"}Candidate sites: {filteredCandidates.length}
              {"\n"}Facility count: {form.model === "lscp" ? "optimised by LSCP" : form.facilityCount}
              {"\n"}Service radius: {form.serviceRadiusKm.toFixed(1)} km
              {"\n"}Equity mode: {equityLabel(form.equityMode)}
              {"\n"}Priority groups: {form.priorityGroups.join(", ") || "none"}
            </div>
            {runError ? <div className={styles.warn}>{runError}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button type="button" className={styles.outlineBtn} onClick={() => { void runVariant(); }} disabled={isRunning || !canRun}>
                {isRunning ? "Running optimisation..." : "Run scenario variant"}
              </button>
              <span className={styles.formHint}>Stored variants: {variants.length}</span>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Results Map</div>
            {!activeResult ? (
              <p className={styles.formHint}>Run a scenario variant first to inspect selected sites and service catchments.</p>
            ) : (
              <>
                <CandidateDemandPreview bounds={DEMO_DATASET.bounds} demandPoints={DEMO_DATASET.demandPoints} candidateSites={activeVariantCandidates} result={activeResult} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
                  {activeResult.chosenSites.map((site) => (
                    <div key={site.siteId} style={{ border: "1px solid var(--syn-overlay-light)", borderRadius: 8, padding: "10px 12px", background: "var(--syn-overlay-whisper)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--syn-text-primary)" }}>{site.label}</div>
                      <div className={styles.formHint}>Assigned demand {site.assignedDemand.toFixed(0)}</div>
                      <div className={styles.formHint}>Covered demand {site.coveredDemand.toFixed(0)}</div>
                      <div className={styles.formHint}>Mean assigned distance {formatMetric(site.meanAssignedDistanceKm, " km")}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Demand Coverage & Equity Diagnostics</div>
            {!activeResult ? (
              <p className={styles.formHint}>Run a scenario variant first to compute travel burden and equity diagnostics.</p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {[
                    { label: "Demand served", value: activeResult.demandSummary.demandServed.toFixed(0) },
                    { label: "Covered demand", value: formatPercent(activeResult.demandSummary.coveredDemandRatio) },
                    { label: "Mean travel burden", value: formatMetric(activeResult.demandSummary.meanTravelBurdenKm, " km") },
                    { label: "Coverage gap", value: formatPercent(activeResult.equityDiagnostics.coverageGap) },
                    { label: "Travel gap", value: formatMetric(activeResult.equityDiagnostics.meanTravelGapKm, " km") },
                    { label: "Travel Gini", value: formatMetric(activeResult.equityDiagnostics.weightedTravelGini) },
                  ].map((metric) => (
                    <div key={metric.label} style={{ border: "1px solid var(--syn-overlay-light)", borderRadius: 8, padding: "10px 12px", background: "var(--syn-overlay-whisper)" }}>
                      <div className={styles.formHint}>{metric.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--syn-text-primary)" }}>{metric.value}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.formSection} style={{ marginTop: 16 }}>
                  <div className={styles.formLabel}>Equity diagnostic chart</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {activeResult.equityDiagnostics.groups.map((group) => (
                      <div key={group.group}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontSize: 12, color: "var(--syn-text-primary)" }}>{group.group.replace(/_/g, " ")}</span>
                          <span className={styles.formHint}>coverage {formatPercent(group.coverageRatio)} | mean travel {formatMetric(group.meanTravelKm, " km")}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 4 }}>
                          <div
                            style={{
                              width: `${group.coverageRatio * 100}%`,
                              height: "100%",
                              background: group.group === "low_income"
                                ? "linear-gradient(90deg, #F97316, #F59E0B)"
                                : "linear-gradient(90deg, #0EA5E9, #22C55E)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Comparison Table & Export</div>
            {variants.length === 0 ? (
              <p className={styles.formHint}>Run at least one scenario variant to compare model outputs and export summaries.</p>
            ) : (
              <>
                <div className={styles.formSection}>
                  <div className={styles.formLabel}>Variant comparison</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          {["Variant", "Model", "Sites", "Covered", "Mean burden", "Coverage gap", "Travel gap"].map((header) => (
                            <th key={header} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)", color: "var(--syn-text-primary)" }}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((variant) => (
                          <tr key={variant.id}>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{variant.label}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{modelLabel(variant.result.model)}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{variant.result.selectedSiteCount}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatPercent(variant.result.demandSummary.coveredDemandRatio)}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatMetric(variant.result.demandSummary.meanTravelBurdenKm, " km")}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatPercent(variant.result.equityDiagnostics.coverageGap)}</td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--syn-overlay-light)" }}>{formatMetric(variant.result.equityDiagnostics.meanTravelGapKm, " km")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className={styles.formSection}>
                  <div className={styles.readonlyBlock}>
                    Equity Audit hook: completed facility-optimisation runs can be imported into the Equity Audit workflow as a service layer seed with group-level coverage records.
                  </div>
                </div>
                <NarrativeGenerationPanel input={activeNarrativeInput ?? undefined} subject={activeVariant?.label ?? form.scenarioName} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className={styles.outlineBtn} onClick={exportCurrentResult} disabled={!activeResult}>Export active result</button>
                  <button type="button" className={styles.outlineBtn} onClick={exportComparisonTable}>Export comparison CSV</button>
                  <button type="button" className={styles.outlineBtn} onClick={exportWorkflowJson}>Export workflow JSON</button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      <CrossPanelActions flowId="facility_optimisation" stepLabel={STEPS[step]!.label} />

      <footer className={styles.flowFooter}>
        <button type="button" className={styles.outlineBtn} disabled={step === 0} onClick={() => setStep((previous) => clamp(previous - 1, 0, MAX_STEP))}>
          ← Previous
        </button>
        <button type="button" className={styles.outlineBtn} disabled={step === MAX_STEP} onClick={() => setStep((previous) => clamp(previous + 1, 0, MAX_STEP))}>
          Next →
        </button>
      </footer>
    </section>
  );
};

export default FacilityOptimisationFlow;
