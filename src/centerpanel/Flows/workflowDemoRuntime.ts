import type {
  AnalyticalFlowId,
  ChartOutput,
  CompletedAnalysisRun,
  DataOutput,
  MapOutput,
} from "@/features/urbanAnalytics/lib/types";

type DemoMetricKey =
  | "transit"
  | "landUse"
  | "density"
  | "environment"
  | "walk"
  | "cycle"
  | "transitMode"
  | "drive"
  | "flood"
  | "heat"
  | "seismic"
  | "compound"
  | "exposure"
  | "sensitivity"
  | "capacity"
  | "serviceAccess"
  | "deprivation"
  | "agePressure"
  | "disabilityPressure";

type DemoArea = {
  id: string;
  label: string;
  population: number;
  geometry: GeoJSON.Feature<GeoJSON.Polygon>;
  metrics: Record<DemoMetricKey, number>;
};

type CriterionInput = {
  name: string;
  weight: number;
  dataLayer: string;
};

type VulnerabilityIndicatorInput = {
  name: string;
  weight: number;
  source: string;
};

type SiteWeightingMethod = "equal" | "rank_sum" | "ahp" | "manual";
type AccessibilityMode = "walk" | "cycle" | "transit" | "drive";
type EquityDimension = "income" | "race" | "age" | "disability" | "none";
type VulnerabilityHazardType = "flood" | "heat" | "seismic" | "compound";
type EquityMeasure = "gini" | "theil" | "atkinson" | "spatial";

export interface SiteSuitabilityDemoInput {
  criteria: CriterionInput[];
  weightingMethod: SiteWeightingMethod;
  constraints: string[];
  monteCarloRuns: number;
  outputTitle: string;
}

export interface AccessibilityDemoInput {
  mode: AccessibilityMode;
  thresholdMinutes: number;
  selectedPOIs: string[];
  populationWeighting: boolean;
  equityDimension: EquityDimension;
  outputTitle: string;
}

export interface VulnerabilityDemoInput {
  hazardType: VulnerabilityHazardType;
  hazardDataSource: string;
  exposureIndicators: VulnerabilityIndicatorInput[];
  sensitivityIndicators: VulnerabilityIndicatorInput[];
  adaptiveCapacityIndicators: VulnerabilityIndicatorInput[];
  outputTitle: string;
}

export interface EquityAuditDemoInput {
  demographicSource: string;
  demographicDimensions: string[];
  serviceLayer: string;
  serviceType: string;
  importedFacilityRunId: string;
  spatialUnit: string;
  equityMeasure: EquityMeasure;
  atkinsonEpsilon: number;
  gapThreshold: number;
  outputTitle: string;
}

type SiteAreaSummary = {
  areaId: string;
  label: string;
  score: number;
  robustness: number;
  rank: number;
};

type AccessibilityAreaSummary = {
  areaId: string;
  label: string;
  score: number;
  reachableOpportunities: number;
  averageTravelMinutes: number;
  equityGap: number;
  rank: number;
};

type VulnerabilityAreaSummary = {
  areaId: string;
  label: string;
  score: number;
  hazard: number;
  exposure: number;
  sensitivity: number;
  adaptiveCapacity: number;
  classLabel: string;
  rank: number;
};

type EquityAreaSummary = {
  areaId: string;
  label: string;
  equityScore: number;
  serviceLevel: number;
  disparityPressure: number;
  flaggedGap: boolean;
  rank: number;
};

type WorkflowResultBase<TAreaSummary> = {
  summaryText: string;
  reportText: string;
  mapOutput: MapOutput;
  chartOutputs: ChartOutput[];
  dataOutputs: DataOutput[];
  completedRun: CompletedAnalysisRun;
  workflowExportPayload: Record<string, unknown>;
  reportDownloadText: string;
  areaSummaries: TAreaSummary[];
};

export interface SiteSuitabilityDemoResult extends WorkflowResultBase<SiteAreaSummary> {
  sensitivityCsv: string;
}

export interface AccessibilityDemoResult extends WorkflowResultBase<AccessibilityAreaSummary> {
  accessibilityCsv: string;
}

export interface VulnerabilityDemoResult extends WorkflowResultBase<VulnerabilityAreaSummary> {
  statisticsCsv: string;
}

export interface EquityAuditDemoResult extends WorkflowResultBase<EquityAreaSummary> {
  equityCsv: string;
  measureValue: number;
}

const DEMO_AREA_SIZE = 0.0125;

function squarePolygon(lng: number, lat: number, halfSize: number): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates: [[
      [lng - halfSize, lat - halfSize],
      [lng + halfSize, lat - halfSize],
      [lng + halfSize, lat + halfSize],
      [lng - halfSize, lat + halfSize],
      [lng - halfSize, lat - halfSize],
    ]],
  };
}

const DEMO_AREAS: DemoArea[] = [
  {
    id: "harbour_point",
    label: "Harbour Point",
    population: 4800,
    geometry: { type: "Feature", properties: { id: "harbour_point" }, geometry: squarePolygon(-0.145, 51.495, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.88,
      landUse: 0.76,
      density: 0.68,
      environment: 0.52,
      walk: 0.84,
      cycle: 0.73,
      transitMode: 0.86,
      drive: 0.63,
      flood: 0.74,
      heat: 0.58,
      seismic: 0.21,
      compound: 0.69,
      exposure: 0.67,
      sensitivity: 0.48,
      capacity: 0.62,
      serviceAccess: 0.82,
      deprivation: 0.34,
      agePressure: 0.22,
      disabilityPressure: 0.18,
    },
  },
  {
    id: "civic_square",
    label: "Civic Square",
    population: 6200,
    geometry: { type: "Feature", properties: { id: "civic_square" }, geometry: squarePolygon(-0.11, 51.512, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.81,
      landUse: 0.83,
      density: 0.74,
      environment: 0.61,
      walk: 0.87,
      cycle: 0.69,
      transitMode: 0.79,
      drive: 0.67,
      flood: 0.42,
      heat: 0.64,
      seismic: 0.19,
      compound: 0.51,
      exposure: 0.59,
      sensitivity: 0.44,
      capacity: 0.71,
      serviceAccess: 0.79,
      deprivation: 0.28,
      agePressure: 0.26,
      disabilityPressure: 0.2,
    },
  },
  {
    id: "university_district",
    label: "University District",
    population: 5300,
    geometry: { type: "Feature", properties: { id: "university_district" }, geometry: squarePolygon(-0.088, 51.536, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.78,
      landUse: 0.69,
      density: 0.63,
      environment: 0.72,
      walk: 0.76,
      cycle: 0.81,
      transitMode: 0.74,
      drive: 0.59,
      flood: 0.33,
      heat: 0.47,
      seismic: 0.18,
      compound: 0.39,
      exposure: 0.48,
      sensitivity: 0.37,
      capacity: 0.77,
      serviceAccess: 0.74,
      deprivation: 0.19,
      agePressure: 0.15,
      disabilityPressure: 0.14,
    },
  },
  {
    id: "green_belt_edge",
    label: "Green Belt Edge",
    population: 3600,
    geometry: { type: "Feature", properties: { id: "green_belt_edge" }, geometry: squarePolygon(-0.168, 51.545, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.52,
      landUse: 0.58,
      density: 0.44,
      environment: 0.91,
      walk: 0.51,
      cycle: 0.64,
      transitMode: 0.49,
      drive: 0.82,
      flood: 0.29,
      heat: 0.35,
      seismic: 0.16,
      compound: 0.31,
      exposure: 0.31,
      sensitivity: 0.41,
      capacity: 0.68,
      serviceAccess: 0.46,
      deprivation: 0.31,
      agePressure: 0.29,
      disabilityPressure: 0.21,
    },
  },
  {
    id: "river_market",
    label: "River Market",
    population: 7100,
    geometry: { type: "Feature", properties: { id: "river_market" }, geometry: squarePolygon(-0.046, 51.505, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.74,
      landUse: 0.79,
      density: 0.81,
      environment: 0.49,
      walk: 0.83,
      cycle: 0.66,
      transitMode: 0.77,
      drive: 0.71,
      flood: 0.57,
      heat: 0.67,
      seismic: 0.22,
      compound: 0.61,
      exposure: 0.72,
      sensitivity: 0.56,
      capacity: 0.54,
      serviceAccess: 0.77,
      deprivation: 0.39,
      agePressure: 0.24,
      disabilityPressure: 0.23,
    },
  },
  {
    id: "innovation_quay",
    label: "Innovation Quay",
    population: 4400,
    geometry: { type: "Feature", properties: { id: "innovation_quay" }, geometry: squarePolygon(-0.071, 51.489, DEMO_AREA_SIZE) },
    metrics: {
      transit: 0.9,
      landUse: 0.86,
      density: 0.71,
      environment: 0.64,
      walk: 0.88,
      cycle: 0.79,
      transitMode: 0.91,
      drive: 0.58,
      flood: 0.46,
      heat: 0.61,
      seismic: 0.2,
      compound: 0.55,
      exposure: 0.53,
      sensitivity: 0.4,
      capacity: 0.79,
      serviceAccess: 0.86,
      deprivation: 0.18,
      agePressure: 0.17,
      disabilityPressure: 0.12,
    },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function normaliseWeights(rawWeights: number[]): number[] {
  const safeWeights = rawWeights.map((value) => Math.max(0, Number.isFinite(value) ? value : 0));
  const total = safeWeights.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || safeWeights.length === 0) {
    return safeWeights.length === 0 ? [] : safeWeights.map(() => 1 / safeWeights.length);
  }
  return safeWeights.map((value) => value / total);
}

function rankSumWeights(rawWeights: number[]): number[] {
  const ranked = rawWeights
    .map((weight, index) => ({ index, weight }))
    .sort((left, right) => right.weight - left.weight);

  const rankTotals = ranked.map((_, index) => ranked.length - index);
  const total = rankTotals.reduce((sum, value) => sum + value, 0);
  const resolved = new Array(rawWeights.length).fill(0);
  ranked.forEach((entry, index) => {
    resolved[entry.index] = rankTotals[index]! / total;
  });
  return resolved;
}

function resolveSiteWeights(criteria: CriterionInput[], weightingMethod: SiteWeightingMethod): number[] {
  if (criteria.length === 0) {
    return [];
  }

  const rawWeights = criteria.map((criterion) => criterion.weight);
  if (weightingMethod === "equal") {
    return criteria.map(() => 1 / criteria.length);
  }
  if (weightingMethod === "rank_sum") {
    return rankSumWeights(rawWeights);
  }
  if (weightingMethod === "ahp") {
    return normaliseWeights(rawWeights.map((value) => Math.max(value, 0.05) ** 2));
  }
  return normaliseWeights(rawWeights);
}

function quoteCsv(value: string | number | boolean | null): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(headers: string[], rows: Array<Array<string | number | boolean | null>>): string {
  return [
    headers.join(","),
    ...rows.map((row) => row.map((value) => quoteCsv(value)).join(",")),
  ].join("\n");
}

function buildFeatureCollection<T extends Record<string, unknown>>(
  values: Array<{ area: DemoArea; properties: T }>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: values.map(({ area, properties }) => ({
      type: "Feature",
      geometry: area.geometry.geometry,
      properties: {
        area_id: area.id,
        area_label: area.label,
        population: area.population,
        ...properties,
      },
    })),
  };
}

function buildCompletedRun(
  flowId: AnalyticalFlowId,
  label: string,
  narrative: string,
  mapOutput: MapOutput,
  chartOutputs: ChartOutput[],
  dataOutputs: DataOutput[],
): CompletedAnalysisRun {
  const insertedAt = new Date().toISOString();
  const runId = `${flowId}-${Date.now()}`;
  return {
    runId,
    flowId,
    label,
    insertedAt,
    paragraph: narrative,
    paragraphPreview: narrative,
    paragraphFull: narrative,
    mapOutputs: [mapOutput],
    chartOutputs,
    dataOutputs,
  };
}

function buildMapOutput(id: string, title: string, type: MapOutput["type"], geojson: GeoJSON.FeatureCollection): MapOutput {
  return {
    id,
    type,
    geojson,
    title,
    layerName: title,
  };
}

function inferSiteMetric(name: string, fallbackIndex: number): DemoMetricKey {
  const lower = name.toLowerCase();
  if (lower.includes("transit")) return "transit";
  if (lower.includes("land")) return "landUse";
  if (lower.includes("population") || lower.includes("density")) return "density";
  if (lower.includes("environment") || lower.includes("green") || lower.includes("ecolog")) return "environment";
  if (lower.includes("service") || lower.includes("access")) return "serviceAccess";
  const fallback: DemoMetricKey[] = ["transit", "landUse", "density", "environment", "serviceAccess"];
  return fallback[fallbackIndex % fallback.length]!;
}

function classifyVulnerability(score: number): string {
  if (score >= 0.75) return "Severe";
  if (score >= 0.58) return "High";
  if (score >= 0.42) return "Moderate";
  return "Managed";
}

function hazardMetricKey(hazardType: VulnerabilityHazardType): DemoMetricKey {
  switch (hazardType) {
    case "flood":
      return "flood";
    case "heat":
      return "heat";
    case "seismic":
      return "seismic";
    default:
      return "compound";
  }
}

function areaDisparityPressure(area: DemoArea, dimensions: string[]): number {
  if (dimensions.length === 0) {
    return area.metrics.deprivation * 0.7;
  }

  const dimensionWeight = dimensions.reduce((total, dimension) => {
    const lower = dimension.toLowerCase();
    if (lower.includes("income") || lower.includes("race") || lower.includes("housing")) {
      return total + area.metrics.deprivation;
    }
    if (lower.includes("age")) {
      return total + area.metrics.agePressure;
    }
    if (lower.includes("disability")) {
      return total + area.metrics.disabilityPressure;
    }
    return total + (area.metrics.deprivation + area.metrics.agePressure + area.metrics.disabilityPressure) / 3;
  }, 0);

  return clamp01(dimensionWeight / dimensions.length);
}

function computeGini(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return 0;
  }
  const weightedSum = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return ((2 * weightedSum) / (sorted.length * total)) - ((sorted.length + 1) / sorted.length);
}

function computeTheil(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const average = mean(values);
  if (average === 0) {
    return 0;
  }
  return mean(values.map((value) => {
    if (value <= 0) {
      return 0;
    }
    const ratio = value / average;
    return ratio * Math.log(ratio);
  }));
}

function computeAtkinson(values: number[], epsilon: number): number {
  if (values.length === 0) {
    return 0;
  }
  const safeValues = values.map((value) => Math.max(value, 0.0001));
  const average = mean(safeValues);
  if (average === 0) {
    return 0;
  }
  if (Math.abs(epsilon - 1) < 0.001) {
    const geometricMean = Math.exp(mean(safeValues.map((value) => Math.log(value))));
    return 1 - (geometricMean / average);
  }
  const powerMean = mean(safeValues.map((value) => value ** (1 - epsilon))) ** (1 / (1 - epsilon));
  return 1 - (powerMean / average);
}

function computeSpatialGap(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => right - left);
  return clamp(sorted[0]! - sorted[sorted.length - 1]!, 0, 1);
}

export function slugifyWorkflowOutput(value: string, fallback = "workflow-output"): string {
  const trimmed = value.trim().toLowerCase();
  const slug = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, 64) || fallback;
}

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function runSiteSuitabilityDemo(input: SiteSuitabilityDemoInput): SiteSuitabilityDemoResult {
  const weights = resolveSiteWeights(input.criteria, input.weightingMethod);
  const activeConstraints = input.constraints.map((constraint) => constraint.trim()).filter(Boolean);
  const constraintFactor = clamp(1 - activeConstraints.length * 0.035, 0.74, 1);

  const rankedAreas = DEMO_AREAS.map((area, areaIndex) => {
    const componentScores = input.criteria.map((criterion, criterionIndex) => {
      const metricKey = inferSiteMetric(criterion.name, criterionIndex);
      const baseMetric = area.metrics[metricKey];
      const layerFactor = criterion.dataLayer.trim() ? 1.03 : 0.95;
      const indexPerturbation = (((areaIndex + 1) * (criterionIndex + 3)) % 5 - 2) * 0.012;
      return clamp01(baseMetric * layerFactor + indexPerturbation);
    });
    const weightedScore = componentScores.reduce((sum, score, index) => sum + score * (weights[index] ?? 0), 0);
    const robustness = clamp(0.64 + Math.min(input.monteCarloRuns, 2400) / 4000 - standardDeviation(componentScores) * 0.3, 0.52, 0.97);
    const score = clamp01(weightedScore * constraintFactor + robustness * 0.03);
    return {
      area,
      score,
      robustness,
      componentScores,
    };
  }).sort((left, right) => right.score - left.score).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const areaSummaries: SiteAreaSummary[] = rankedAreas.map((entry) => ({
    areaId: entry.area.id,
    label: entry.area.label,
    score: Number((entry.score * 100).toFixed(1)),
    robustness: Number((entry.robustness * 100).toFixed(1)),
    rank: entry.rank,
  }));

  const featureCollection = buildFeatureCollection(rankedAreas.map((entry) => ({
    area: entry.area,
    properties: {
      suitability_score: Number((entry.score * 100).toFixed(2)),
      suitability_rank: entry.rank,
      robustness: Number((entry.robustness * 100).toFixed(2)),
    },
  })));

  const topArea = areaSummaries[0]!;
  const robustTopShare = mean(areaSummaries.slice(0, 3).map((entry) => entry.robustness));
  const scoreSpread = areaSummaries[0]!.score - areaSummaries[areaSummaries.length - 1]!.score;
  const summaryText = `${input.outputTitle} ranks ${topArea.label} as the strongest candidate with a suitability score of ${topArea.score.toFixed(1)} and a robustness score of ${topArea.robustness.toFixed(1)}. Constraint masking reduced all scores by ${(100 - constraintFactor * 100).toFixed(1)}%, and the top-three robustness average is ${robustTopShare.toFixed(1)}.`;
  const reportText = `${summaryText} Sensitivity testing across ${input.monteCarloRuns} Monte Carlo iterations produced a ${scoreSpread.toFixed(1)}-point spread between the highest- and lowest-ranked areas, which is suitable for briefing and shortlist review.`;
  const sensitivityCsv = buildCsv(
    ["area_id", "label", "rank", "score", "robustness"],
    areaSummaries.map((entry) => [entry.areaId, entry.label, entry.rank, entry.score, entry.robustness]),
  );

  const mapOutput = buildMapOutput(
    `${slugifyWorkflowOutput(input.outputTitle, "site-suitability")}-surface`,
    input.outputTitle,
    "choropleth",
    featureCollection,
  );
  const chartOutputs: ChartOutput[] = [{
    id: `${mapOutput.id}-ranking`,
    type: "bar",
    title: `${input.outputTitle} ranking`,
    data: areaSummaries.map((entry) => ({ label: entry.label, score: entry.score, robustness: entry.robustness })),
  }];
  const dataOutputs: DataOutput[] = [{
    id: `${mapOutput.id}-scores`,
    format: "site-suitability-scores",
    rows: areaSummaries.length,
    columns: ["label", "rank", "score", "robustness"],
    preview: areaSummaries,
  }];
  const completedRun = buildCompletedRun("site_suitability", input.outputTitle, reportText, mapOutput, chartOutputs, dataOutputs);

  return {
    summaryText,
    reportText,
    mapOutput,
    chartOutputs,
    dataOutputs,
    completedRun,
    workflowExportPayload: {
      weightingMethod: input.weightingMethod,
      activeConstraints,
      monteCarloRuns: input.monteCarloRuns,
      topAreas: areaSummaries.slice(0, 3),
      robustnessAverage: robustTopShare,
    },
    reportDownloadText: reportText,
    areaSummaries,
    sensitivityCsv,
  };
}

export function runAccessibilityDemo(input: AccessibilityDemoInput): AccessibilityDemoResult {
  const modeMetricKey: Record<AccessibilityMode, DemoMetricKey> = {
    walk: "walk",
    cycle: "cycle",
    transit: "transitMode",
    drive: "drive",
  };
  const selectedPoiCount = input.selectedPOIs.length;
  const poiFactor = clamp(0.56 + selectedPoiCount * 0.08, 0.56, 1.28);
  const thresholdFactor = clamp(input.thresholdMinutes / 30, 0.35, 1.75);
  const equityPenaltyFactor: Record<EquityDimension, (area: DemoArea) => number> = {
    none: () => 0,
    income: (area) => area.metrics.deprivation * 0.15,
    race: (area) => area.metrics.deprivation * 0.12 + area.metrics.disabilityPressure * 0.03,
    age: (area) => area.metrics.agePressure * 0.16,
    disability: (area) => area.metrics.disabilityPressure * 0.2,
  };

  const scoredAreas = DEMO_AREAS.map((area) => {
    const base = area.metrics[modeMetricKey[input.mode]];
    const weightingBoost = input.populationWeighting ? clamp(area.population / 80000, 0.02, 0.1) : 0;
    const equityGap = clamp(equityPenaltyFactor[input.equityDimension](area) + (input.populationWeighting ? 0.02 : 0), 0, 0.35);
    const score = clamp01(base * 0.72 + poiFactor * 0.1 + thresholdFactor * 0.08 + weightingBoost - equityGap);
    return {
      area,
      score,
      reachableOpportunities: Math.round(score * (selectedPoiCount * 18 + 36) + area.population / 420),
      averageTravelMinutes: Math.round(input.thresholdMinutes * (1.05 - base * 0.28)),
      equityGap: Number((equityGap * 100).toFixed(1)),
    };
  }).sort((left, right) => right.score - left.score).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const areaSummaries: AccessibilityAreaSummary[] = scoredAreas.map((entry) => ({
    areaId: entry.area.id,
    label: entry.area.label,
    score: Number((entry.score * 100).toFixed(1)),
    reachableOpportunities: entry.reachableOpportunities,
    averageTravelMinutes: entry.averageTravelMinutes,
    equityGap: entry.equityGap,
    rank: entry.rank,
  }));

  const featureCollection = buildFeatureCollection(scoredAreas.map((entry) => ({
    area: entry.area,
    properties: {
      accessibility_score: Number((entry.score * 100).toFixed(2)),
      reachable_opportunities: entry.reachableOpportunities,
      average_travel_minutes: entry.averageTravelMinutes,
      equity_gap: entry.equityGap,
      accessibility_rank: entry.rank,
    },
  })));

  const bestArea = areaSummaries[0]!;
  const averageScore = mean(areaSummaries.map((entry) => entry.score));
  const summaryText = `${input.outputTitle} finds ${bestArea.label} to have the strongest ${input.mode} accessibility at ${bestArea.score.toFixed(1)} points, with ${bestArea.reachableOpportunities} reachable opportunities inside the ${input.thresholdMinutes}-minute threshold. The portfolio-wide average accessibility score is ${averageScore.toFixed(1)}.`;
  const reportText = `${summaryText} ${input.populationWeighting ? "Population weighting was applied to emphasise high-demand districts." : "Spatial units were treated equally."} Equity disaggregation on ${input.equityDimension === "none" ? "the aggregate population" : input.equityDimension} produced an average accessibility gap of ${mean(areaSummaries.map((entry) => entry.equityGap)).toFixed(1)} points.`;
  const accessibilityCsv = buildCsv(
    ["area_id", "label", "rank", "score", "reachable_opportunities", "average_travel_minutes", "equity_gap"],
    areaSummaries.map((entry) => [entry.areaId, entry.label, entry.rank, entry.score, entry.reachableOpportunities, entry.averageTravelMinutes, entry.equityGap]),
  );
  const mapOutput = buildMapOutput(
    `${slugifyWorkflowOutput(input.outputTitle, "accessibility")}-isochrones`,
    input.outputTitle,
    "isochrone",
    featureCollection,
  );
  const chartOutputs: ChartOutput[] = [{
    id: `${mapOutput.id}-accessibility`,
    type: "bar",
    title: `${input.outputTitle} opportunities`,
    data: areaSummaries.map((entry) => ({ label: entry.label, score: entry.score, reachableOpportunities: entry.reachableOpportunities })),
  }];
  const dataOutputs: DataOutput[] = [{
    id: `${mapOutput.id}-summary`,
    format: "accessibility-summary",
    rows: areaSummaries.length,
    columns: ["label", "rank", "score", "reachableOpportunities", "averageTravelMinutes", "equityGap"],
    preview: areaSummaries,
  }];
  const completedRun = buildCompletedRun("accessibility", input.outputTitle, reportText, mapOutput, chartOutputs, dataOutputs);

  return {
    summaryText,
    reportText,
    mapOutput,
    chartOutputs,
    dataOutputs,
    completedRun,
    workflowExportPayload: {
      mode: input.mode,
      thresholdMinutes: input.thresholdMinutes,
      selectedPOIs: input.selectedPOIs,
      populationWeighting: input.populationWeighting,
      equityDimension: input.equityDimension,
      averageScore,
      bestArea,
    },
    reportDownloadText: reportText,
    areaSummaries,
    accessibilityCsv,
  };
}

function indicatorCompleteness(indicators: VulnerabilityIndicatorInput[]): number {
  if (indicators.length === 0) {
    return 0;
  }
  return mean(indicators.map((indicator) => {
    const sourceFactor = indicator.source.trim() ? 1 : 0.88;
    return clamp01(Math.max(indicator.weight, 0) * sourceFactor + 0.08);
  }));
}

export function runVulnerabilityDemo(input: VulnerabilityDemoInput): VulnerabilityDemoResult {
  const hazardKey = hazardMetricKey(input.hazardType);
  const exposureCompleteness = indicatorCompleteness(input.exposureIndicators);
  const sensitivityCompleteness = indicatorCompleteness(input.sensitivityIndicators);
  const capacityCompleteness = indicatorCompleteness(input.adaptiveCapacityIndicators);

  const rankedAreas = DEMO_AREAS.map((area) => {
    const hazard = area.metrics[hazardKey];
    const exposure = clamp01(area.metrics.exposure * 0.82 + exposureCompleteness * 0.22);
    const sensitivity = clamp01(area.metrics.sensitivity * 0.8 + sensitivityCompleteness * 0.24);
    const adaptiveCapacity = clamp01(area.metrics.capacity * 0.84 + capacityCompleteness * 0.16);
    const score = clamp01(hazard * 0.35 + exposure * 0.27 + sensitivity * 0.24 + (1 - adaptiveCapacity) * 0.14);
    return {
      area,
      score,
      hazard,
      exposure,
      sensitivity,
      adaptiveCapacity,
    };
  }).sort((left, right) => right.score - left.score).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const areaSummaries: VulnerabilityAreaSummary[] = rankedAreas.map((entry) => ({
    areaId: entry.area.id,
    label: entry.area.label,
    score: Number((entry.score * 100).toFixed(1)),
    hazard: Number((entry.hazard * 100).toFixed(1)),
    exposure: Number((entry.exposure * 100).toFixed(1)),
    sensitivity: Number((entry.sensitivity * 100).toFixed(1)),
    adaptiveCapacity: Number((entry.adaptiveCapacity * 100).toFixed(1)),
    classLabel: classifyVulnerability(entry.score),
    rank: entry.rank,
  }));

  const featureCollection = buildFeatureCollection(rankedAreas.map((entry) => ({
    area: entry.area,
    properties: {
      vulnerability_score: Number((entry.score * 100).toFixed(2)),
      hazard_pressure: Number((entry.hazard * 100).toFixed(2)),
      exposure_score: Number((entry.exposure * 100).toFixed(2)),
      sensitivity_score: Number((entry.sensitivity * 100).toFixed(2)),
      adaptive_capacity: Number((entry.adaptiveCapacity * 100).toFixed(2)),
      vulnerability_class: classifyVulnerability(entry.score),
      vulnerability_rank: entry.rank,
    },
  })));

  const highestRisk = areaSummaries[0]!;
  const summaryText = `${input.outputTitle} identifies ${highestRisk.label} as the highest-priority ${input.hazardType} vulnerability hotspot with a composite score of ${highestRisk.score.toFixed(1)}. Hazard pressure is ${highestRisk.hazard.toFixed(1)} while adaptive capacity remains ${highestRisk.adaptiveCapacity.toFixed(1)}.`;
  const reportText = `${summaryText} The assessment uses ${input.exposureIndicators.length} exposure indicators, ${input.sensitivityIndicators.length} sensitivity indicators, and ${input.adaptiveCapacityIndicators.length} adaptive-capacity indicators. The supplied hazard source was ${input.hazardDataSource || "not named in the form"}.`;
  const statisticsCsv = buildCsv(
    ["area_id", "label", "rank", "score", "hazard", "exposure", "sensitivity", "adaptive_capacity", "class_label"],
    areaSummaries.map((entry) => [entry.areaId, entry.label, entry.rank, entry.score, entry.hazard, entry.exposure, entry.sensitivity, entry.adaptiveCapacity, entry.classLabel]),
  );
  const mapOutput = buildMapOutput(
    `${slugifyWorkflowOutput(input.outputTitle, "vulnerability")}-risk-map`,
    input.outputTitle,
    "choropleth",
    featureCollection,
  );
  const chartOutputs: ChartOutput[] = [{
    id: `${mapOutput.id}-risk`,
    type: "bar",
    title: `${input.outputTitle} hotspot ranking`,
    data: areaSummaries.map((entry) => ({ label: entry.label, score: entry.score, classLabel: entry.classLabel })),
  }];
  const dataOutputs: DataOutput[] = [{
    id: `${mapOutput.id}-risk-table`,
    format: "vulnerability-summary",
    rows: areaSummaries.length,
    columns: ["label", "rank", "score", "hazard", "exposure", "sensitivity", "adaptiveCapacity", "classLabel"],
    preview: areaSummaries,
  }];
  const completedRun = buildCompletedRun("vulnerability", input.outputTitle, reportText, mapOutput, chartOutputs, dataOutputs);

  return {
    summaryText,
    reportText,
    mapOutput,
    chartOutputs,
    dataOutputs,
    completedRun,
    workflowExportPayload: {
      hazardType: input.hazardType,
      hazardDataSource: input.hazardDataSource,
      highestRisk,
      averageScore: mean(areaSummaries.map((entry) => entry.score)),
    },
    reportDownloadText: reportText,
    areaSummaries,
    statisticsCsv,
  };
}

export function runEquityAuditDemo(input: EquityAuditDemoInput): EquityAuditDemoResult {
  const serviceBoost = input.importedFacilityRunId ? 0.05 : 0;
  const scoredAreas = DEMO_AREAS.map((area) => {
    const serviceLevel = clamp01(area.metrics.serviceAccess + serviceBoost);
    const disparityPressure = areaDisparityPressure(area, input.demographicDimensions);
    const equityScore = clamp01(serviceLevel * 0.76 + (1 - disparityPressure) * 0.24 - (input.serviceType.trim() ? 0 : 0.02));
    return {
      area,
      serviceLevel,
      disparityPressure,
      equityScore,
      flaggedGap: equityScore < input.gapThreshold,
    };
  }).sort((left, right) => right.equityScore - left.equityScore).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const areaSummaries: EquityAreaSummary[] = scoredAreas.map((entry) => ({
    areaId: entry.area.id,
    label: entry.area.label,
    equityScore: Number((entry.equityScore * 100).toFixed(1)),
    serviceLevel: Number((entry.serviceLevel * 100).toFixed(1)),
    disparityPressure: Number((entry.disparityPressure * 100).toFixed(1)),
    flaggedGap: entry.flaggedGap,
    rank: entry.rank,
  }));

  const rawScores = scoredAreas.map((entry) => entry.equityScore);
  const measureValue = (() => {
    switch (input.equityMeasure) {
      case "theil":
        return computeTheil(rawScores);
      case "atkinson":
        return computeAtkinson(rawScores, input.atkinsonEpsilon);
      case "spatial":
        return computeSpatialGap(rawScores);
      default:
        return computeGini(rawScores);
    }
  })();

  const flaggedCount = areaSummaries.filter((entry) => entry.flaggedGap).length;
  const featureCollection = buildFeatureCollection(scoredAreas.map((entry) => ({
    area: entry.area,
    properties: {
      equity_score: Number((entry.equityScore * 100).toFixed(2)),
      service_level: Number((entry.serviceLevel * 100).toFixed(2)),
      disparity_pressure: Number((entry.disparityPressure * 100).toFixed(2)),
      gap_flag: entry.flaggedGap,
      equity_rank: entry.rank,
    },
  })));

  const summaryText = `${input.outputTitle} computed a ${input.equityMeasure} value of ${measureValue.toFixed(3)} across ${input.spatialUnit} units and flagged ${flaggedCount} under-served areas using a ${input.gapThreshold.toFixed(2)} gap threshold.`;
  const reportText = `${summaryText} The audit used ${input.demographicDimensions.length || 1} demographic lens${input.demographicDimensions.length === 1 ? "" : "es"}, a service layer of ${input.serviceLayer || "unspecified service layer"}, and ${input.demographicSource || "an unnamed demographic source"}.`;
  const equityCsv = buildCsv(
    ["area_id", "label", "rank", "equity_score", "service_level", "disparity_pressure", "flagged_gap"],
    areaSummaries.map((entry) => [entry.areaId, entry.label, entry.rank, entry.equityScore, entry.serviceLevel, entry.disparityPressure, entry.flaggedGap]),
  );
  const mapOutput = buildMapOutput(
    `${slugifyWorkflowOutput(input.outputTitle, "equity-audit")}-equity-map`,
    input.outputTitle,
    "choropleth",
    featureCollection,
  );
  const chartOutputs: ChartOutput[] = [{
    id: `${mapOutput.id}-equity`,
    type: "bar",
    title: `${input.outputTitle} service equity`,
    data: areaSummaries.map((entry) => ({ label: entry.label, equityScore: entry.equityScore, flaggedGap: entry.flaggedGap })),
  }];
  const dataOutputs: DataOutput[] = [{
    id: `${mapOutput.id}-equity-table`,
    format: "equity-audit-summary",
    rows: areaSummaries.length,
    columns: ["label", "rank", "equityScore", "serviceLevel", "disparityPressure", "flaggedGap"],
    preview: areaSummaries,
  }];
  const completedRun = buildCompletedRun("equity_audit", input.outputTitle, reportText, mapOutput, chartOutputs, dataOutputs);

  return {
    summaryText,
    reportText,
    mapOutput,
    chartOutputs,
    dataOutputs,
    completedRun,
    workflowExportPayload: {
      demographicSource: input.demographicSource,
      demographicDimensions: input.demographicDimensions,
      serviceLayer: input.serviceLayer,
      serviceType: input.serviceType,
      spatialUnit: input.spatialUnit,
      equityMeasure: input.equityMeasure,
      atkinsonEpsilon: input.atkinsonEpsilon,
      gapThreshold: input.gapThreshold,
      measureValue,
      flaggedCount,
    },
    reportDownloadText: reportText,
    areaSummaries,
    equityCsv,
    measureValue: Number(measureValue.toFixed(3)),
  };
}