export type ScenarioMetricId =
  | "housing_capacity"
  | "green_network"
  | "transit_access"
  | "affordability"
  | "carbon_intensity"
  | "flood_risk";

export type ScenarioObjective = "maximize" | "minimize";

export interface ScenarioMetricDefinition {
  id: ScenarioMetricId;
  label: string;
  shortLabel: string;
  unit: string;
  direction: ScenarioObjective;
  description: string;
}

export interface ScenarioParameters {
  housingIntensity: number;
  transitInvestment: number;
  greeningProgram: number;
  resilienceProgramme: number;
  affordabilitySafeguards: number;
  energyTransition: number;
}

export type ScenarioLeverId = keyof ScenarioParameters;

export interface ScenarioLeverDefinition {
  id: ScenarioLeverId;
  label: string;
  description: string;
}

export interface ScenarioUnitResponseProfile {
  housingIntensity: number;
  transitInvestment: number;
  greeningProgram: number;
  resilienceProgramme: number;
  affordabilitySafeguards: number;
  energyTransition: number;
}

export interface ScenarioSpatialUnit {
  unitId: string;
  label: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  baselineMetrics: Record<ScenarioMetricId, number>;
  responseProfile: ScenarioUnitResponseProfile;
}

export interface ScenarioAlternativeDefinition {
  id: string;
  name: string;
  description: string;
  assumptions: string;
  parameters: ScenarioParameters;
}

export interface ScenarioUnitResult {
  unitId: string;
  label: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  baselineMetrics: Record<ScenarioMetricId, number>;
  scenarioMetrics: Record<ScenarioMetricId, number>;
  absoluteDeltas: Record<ScenarioMetricId, number>;
  percentDeltas: Record<ScenarioMetricId, number | null>;
  improvementDeltas: Record<ScenarioMetricId, number>;
  compositeScore: number;
}

export interface ScenarioMetricAggregate {
  metricId: ScenarioMetricId;
  label: string;
  shortLabel: string;
  unit: string;
  direction: ScenarioObjective;
  baseline: number;
  scenario: number;
  absoluteDelta: number;
  percentDelta: number | null;
  normalizedBaseline: number;
  normalizedScenario: number;
  improvementDelta: number;
}

export interface ScenarioAlternativeResult {
  scenarioId: string;
  name: string;
  description: string;
  assumptions: string;
  parameters: ScenarioParameters;
  compositeScore: number;
  meanImprovement: number;
  metrics: ScenarioMetricAggregate[];
  units: ScenarioUnitResult[];
  paretoCandidate: boolean;
}

export interface ScenarioTradeOffCell {
  metricId: ScenarioMetricId;
  label: string;
  improvementDelta: number;
  status: "gain" | "loss" | "neutral";
  baselineValue: number;
  scenarioValue: number;
}

export interface ScenarioTradeOffRow {
  scenarioId: string;
  scenarioName: string;
  compositeScore: number;
  paretoCandidate: boolean;
  cells: ScenarioTradeOffCell[];
}

export interface ScenarioComparisonInput {
  baselineName: string;
  units: ScenarioSpatialUnit[];
  scenarios: ScenarioAlternativeDefinition[];
  selectedMetricIds?: ScenarioMetricId[];
}

export interface ScenarioComparisonResult {
  baselineName: string;
  metricDefinitions: ScenarioMetricDefinition[];
  baselineCompositeScore: number;
  baselineAverages: Record<ScenarioMetricId, number>;
  scenarios: ScenarioAlternativeResult[];
  paretoScenarioIds: string[];
  tradeOffMatrix: ScenarioTradeOffRow[];
  narrativeSummary: string;
}

const LEVER_KEYS: ScenarioLeverId[] = [
  "housingIntensity",
  "transitInvestment",
  "greeningProgram",
  "resilienceProgramme",
  "affordabilitySafeguards",
  "energyTransition",
];

const EPSILON = 1e-6;

export const SCENARIO_LEVERS: ScenarioLeverDefinition[] = [
  {
    id: "housingIntensity",
    label: "Housing Intensity",
    description: "Development capacity, densification pressure, and delivery volume.",
  },
  {
    id: "transitInvestment",
    label: "Transit Investment",
    description: "Network upgrades, service uplift, and stop-area improvements.",
  },
  {
    id: "greeningProgram",
    label: "Greening Program",
    description: "Parks, tree canopy, stormwater landscapes, and habitat corridors.",
  },
  {
    id: "resilienceProgramme",
    label: "Resilience Programme",
    description: "Flood mitigation, cooling, backup systems, and emergency readiness.",
  },
  {
    id: "affordabilitySafeguards",
    label: "Affordability Safeguards",
    description: "Inclusionary housing, rent support, and anti-displacement measures.",
  },
  {
    id: "energyTransition",
    label: "Energy Transition",
    description: "District energy, retrofit pace, and low-carbon infrastructure delivery.",
  },
];

export const SCENARIO_METRICS: ScenarioMetricDefinition[] = [
  {
    id: "housing_capacity",
    label: "Housing Capacity",
    shortLabel: "Housing",
    unit: "index",
    direction: "maximize",
    description: "Ability to absorb new housing while keeping delivery feasible.",
  },
  {
    id: "green_network",
    label: "Green Network",
    shortLabel: "Green",
    unit: "index",
    direction: "maximize",
    description: "Connected green-space access and environmental surface quality.",
  },
  {
    id: "transit_access",
    label: "Transit Access",
    shortLabel: "Transit",
    unit: "index",
    direction: "maximize",
    description: "Population access to frequent, high-capacity public transport.",
  },
  {
    id: "affordability",
    label: "Affordability",
    shortLabel: "Afford.",
    unit: "index",
    direction: "maximize",
    description: "Relative household affordability after policy and infrastructure shifts.",
  },
  {
    id: "carbon_intensity",
    label: "Carbon Intensity",
    shortLabel: "Carbon",
    unit: "index",
    direction: "minimize",
    description: "Operational and mobility emissions burden associated with the scenario.",
  },
  {
    id: "flood_risk",
    label: "Flood Risk",
    shortLabel: "Flood",
    unit: "index",
    direction: "minimize",
    description: "Residual flood exposure after land-use and resilience interventions.",
  },
];

const METRIC_EFFECTS: Record<ScenarioMetricId, Partial<Record<ScenarioLeverId, number>>> = {
  housing_capacity: {
    housingIntensity: 0.34,
    transitInvestment: 0.08,
    greeningProgram: -0.05,
    affordabilitySafeguards: 0.05,
  },
  green_network: {
    greeningProgram: 0.38,
    housingIntensity: -0.14,
    resilienceProgramme: 0.09,
    transitInvestment: 0.03,
  },
  transit_access: {
    transitInvestment: 0.42,
    housingIntensity: 0.09,
    greeningProgram: 0.03,
  },
  affordability: {
    affordabilitySafeguards: 0.46,
    housingIntensity: -0.16,
    transitInvestment: 0.05,
    energyTransition: 0.04,
  },
  carbon_intensity: {
    energyTransition: -0.44,
    transitInvestment: -0.14,
    housingIntensity: 0.18,
  },
  flood_risk: {
    resilienceProgramme: -0.48,
    greeningProgram: -0.18,
    housingIntensity: 0.13,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getMetricDefinition(metricId: ScenarioMetricId): ScenarioMetricDefinition {
  return SCENARIO_METRICS.find((definition) => definition.id === metricId) ?? SCENARIO_METRICS[0]!;
}

export function normalizeScenarioMetricValue(
  metric: ScenarioMetricDefinition | ScenarioMetricId,
  value: number,
): number {
  const definition = typeof metric === "string" ? getMetricDefinition(metric) : metric;
  const bounded = clamp(value, 0, 100);
  return definition.direction === "maximize" ? bounded : 100 - bounded;
}

function computeSynergy(
  metricId: ScenarioMetricId,
  parameters: ScenarioParameters,
  responseProfile: ScenarioUnitResponseProfile,
): number {
  if (metricId === "housing_capacity") {
    return Math.min(parameters.housingIntensity, parameters.transitInvestment) * 0.06 * responseProfile.housingIntensity;
  }
  if (metricId === "green_network") {
    return Math.min(parameters.greeningProgram, parameters.resilienceProgramme) * 0.04 * responseProfile.greeningProgram;
  }
  if (metricId === "affordability") {
    return Math.min(parameters.affordabilitySafeguards, parameters.energyTransition) * 0.05 * responseProfile.affordabilitySafeguards;
  }
  if (metricId === "carbon_intensity") {
    return -Math.min(parameters.energyTransition, parameters.transitInvestment) * 0.04 * responseProfile.energyTransition;
  }
  if (metricId === "flood_risk") {
    return -Math.min(parameters.greeningProgram, parameters.resilienceProgramme) * 0.05 * responseProfile.resilienceProgramme;
  }
  return 0;
}

function deriveScenarioMetricValue(
  baselineValue: number,
  metricId: ScenarioMetricId,
  parameters: ScenarioParameters,
  responseProfile: ScenarioUnitResponseProfile,
): number {
  let nextValue = baselineValue;

  for (const leverKey of LEVER_KEYS) {
    nextValue += (METRIC_EFFECTS[metricId][leverKey] ?? 0) * parameters[leverKey] * responseProfile[leverKey];
  }

  nextValue += computeSynergy(metricId, parameters, responseProfile);

  return clamp(nextValue, 0, 100);
}

function getStatusFromImprovement(value: number): "gain" | "loss" | "neutral" {
  if (value > 0.75) {
    return "gain";
  }
  if (value < -0.75) {
    return "loss";
  }
  return "neutral";
}

function pickMetricRecord(
  source: Record<ScenarioMetricId, number>,
  metricDefinitions: ScenarioMetricDefinition[],
): Record<ScenarioMetricId, number> {
  const record = {} as Record<ScenarioMetricId, number>;
  for (const metric of metricDefinitions) {
    record[metric.id] = source[metric.id];
  }
  return record;
}

export function deriveScenarioUnits(
  units: ScenarioSpatialUnit[],
  metricDefinitions: ScenarioMetricDefinition[],
  parameters: ScenarioParameters,
): ScenarioUnitResult[] {
  return units.map((unit) => {
    const baselineMetrics = pickMetricRecord(unit.baselineMetrics, metricDefinitions);
    const scenarioMetrics = {} as Record<ScenarioMetricId, number>;
    const absoluteDeltas = {} as Record<ScenarioMetricId, number>;
    const percentDeltas = {} as Record<ScenarioMetricId, number | null>;
    const improvementDeltas = {} as Record<ScenarioMetricId, number>;

    for (const metric of metricDefinitions) {
      const baselineValue = unit.baselineMetrics[metric.id];
      const scenarioValue = deriveScenarioMetricValue(
        baselineValue,
        metric.id,
        parameters,
        unit.responseProfile,
      );

      scenarioMetrics[metric.id] = scenarioValue;
      absoluteDeltas[metric.id] = scenarioValue - baselineValue;
      percentDeltas[metric.id] = Math.abs(baselineValue) > EPSILON
        ? ((scenarioValue - baselineValue) / baselineValue) * 100
        : null;
      improvementDeltas[metric.id] =
        normalizeScenarioMetricValue(metric, scenarioValue) - normalizeScenarioMetricValue(metric, baselineValue);
    }

    return {
      unitId: unit.unitId,
      label: unit.label,
      geometry: unit.geometry,
      baselineMetrics,
      scenarioMetrics,
      absoluteDeltas,
      percentDeltas,
      improvementDeltas,
      compositeScore: mean(metricDefinitions.map((metric) => normalizeScenarioMetricValue(metric, scenarioMetrics[metric.id]))),
    };
  });
}

function dominates(
  left: ScenarioAlternativeResult,
  right: ScenarioAlternativeResult,
  metricDefinitions: ScenarioMetricDefinition[],
): boolean {
  const leftByMetric = new Map(left.metrics.map((metric) => [metric.metricId, metric]));
  const rightByMetric = new Map(right.metrics.map((metric) => [metric.metricId, metric]));

  const noWorse = metricDefinitions.every((metric) =>
    (leftByMetric.get(metric.id)?.normalizedScenario ?? 0) >= (rightByMetric.get(metric.id)?.normalizedScenario ?? 0) - EPSILON,
  );
  const strictlyBetter = metricDefinitions.some((metric) =>
    (leftByMetric.get(metric.id)?.normalizedScenario ?? 0) > (rightByMetric.get(metric.id)?.normalizedScenario ?? 0) + EPSILON,
  );

  return noWorse && strictlyBetter;
}

function identifyParetoScenarioIds(
  scenarios: ScenarioAlternativeResult[],
  metricDefinitions: ScenarioMetricDefinition[],
): string[] {
  return scenarios
    .filter((candidate) =>
      !scenarios.some((other) => other.scenarioId !== candidate.scenarioId && dominates(other, candidate, metricDefinitions)),
    )
    .map((scenario) => scenario.scenarioId);
}

export function buildScenarioComparisonNarrative(result: ScenarioComparisonResult): string {
  if (result.scenarios.length === 0) {
    return "No alternative scenarios are available for comparison.";
  }

  const ordered = [...result.scenarios].sort((left, right) => right.compositeScore - left.compositeScore);
  const leader = ordered[0]!;
  const strongestGain = [...leader.metrics].sort((left, right) => right.improvementDelta - left.improvementDelta)[0]!;
  const clearestTradeOff = [...leader.metrics].sort((left, right) => left.improvementDelta - right.improvementDelta)[0]!;
  const paretoLabels = ordered.filter((scenario) => scenario.paretoCandidate).map((scenario) => scenario.name);

  return [
    `${leader.name} leads the current comparison set with a composite score of ${leader.compositeScore.toFixed(1)} out of 100.`,
    `${strongestGain.label} shows the strongest improvement relative to the ${result.baselineName} baseline (${strongestGain.improvementDelta >= 0 ? "+" : ""}${strongestGain.improvementDelta.toFixed(1)} normalized points).`,
    `${clearestTradeOff.label} remains the main trade-off for ${leader.name} (${clearestTradeOff.improvementDelta >= 0 ? "+" : ""}${clearestTradeOff.improvementDelta.toFixed(1)} normalized points).`,
    paretoLabels.length > 0
      ? `Pareto-efficient candidates in the current option set: ${paretoLabels.join(", ")}.`
      : "No Pareto-efficient alternative could be isolated from the current option set.",
  ].join(" ");
}

export function runScenarioComparison(
  input: ScenarioComparisonInput,
): ScenarioComparisonResult {
  const selectedMetricSet = new Set(
    (input.selectedMetricIds?.length ? input.selectedMetricIds : SCENARIO_METRICS.map((metric) => metric.id))
      .filter((metricId) => SCENARIO_METRICS.some((metric) => metric.id === metricId)),
  );

  const metricDefinitions = SCENARIO_METRICS.filter((metric) => selectedMetricSet.has(metric.id));

  if (metricDefinitions.length === 0) {
    throw new RangeError("Scenario comparison requires at least one aligned metric.");
  }

  if (input.scenarios.length < 2) {
    throw new RangeError("Scenario comparison requires at least two alternative scenarios.");
  }

  const baselineAverages = {} as Record<ScenarioMetricId, number>;
  for (const metric of metricDefinitions) {
    baselineAverages[metric.id] = mean(input.units.map((unit) => unit.baselineMetrics[metric.id]));
  }

  const baselineCompositeScore = mean(
    metricDefinitions.map((metric) => normalizeScenarioMetricValue(metric, baselineAverages[metric.id])),
  );

  const scenarioResults = input.scenarios.map<ScenarioAlternativeResult>((scenario) => {
    const units = deriveScenarioUnits(input.units, metricDefinitions, scenario.parameters);
    const metrics = metricDefinitions.map<ScenarioMetricAggregate>((metric) => {
      const scenarioAverage = mean(units.map((unit) => unit.scenarioMetrics[metric.id]));
      const baselineAverage = baselineAverages[metric.id];
      const normalizedScenario = normalizeScenarioMetricValue(metric, scenarioAverage);
      const normalizedBaseline = normalizeScenarioMetricValue(metric, baselineAverage);
      const absoluteDelta = scenarioAverage - baselineAverage;
      const percentDelta = Math.abs(baselineAverage) > EPSILON
        ? (absoluteDelta / baselineAverage) * 100
        : null;

      return {
        metricId: metric.id,
        label: metric.label,
        shortLabel: metric.shortLabel,
        unit: metric.unit,
        direction: metric.direction,
        baseline: baselineAverage,
        scenario: scenarioAverage,
        absoluteDelta,
        percentDelta,
        normalizedBaseline,
        normalizedScenario,
        improvementDelta: normalizedScenario - normalizedBaseline,
      };
    });

    return {
      scenarioId: scenario.id,
      name: scenario.name,
      description: scenario.description,
      assumptions: scenario.assumptions,
      parameters: scenario.parameters,
      compositeScore: mean(metrics.map((metric) => metric.normalizedScenario)),
      meanImprovement: mean(metrics.map((metric) => metric.improvementDelta)),
      metrics,
      units,
      paretoCandidate: false,
    };
  });

  const paretoScenarioIds = identifyParetoScenarioIds(scenarioResults, metricDefinitions);

  const scenarios = scenarioResults.map((scenario) => ({
    ...scenario,
    paretoCandidate: paretoScenarioIds.includes(scenario.scenarioId),
  }));

  const tradeOffMatrix: ScenarioTradeOffRow[] = scenarios.map((scenario) => ({
    scenarioId: scenario.scenarioId,
    scenarioName: scenario.name,
    compositeScore: scenario.compositeScore,
    paretoCandidate: scenario.paretoCandidate,
    cells: scenario.metrics.map((metric) => ({
      metricId: metric.metricId,
      label: metric.label,
      improvementDelta: metric.improvementDelta,
      status: getStatusFromImprovement(metric.improvementDelta),
      baselineValue: metric.baseline,
      scenarioValue: metric.scenario,
    })),
  }));

  const result: ScenarioComparisonResult = {
    baselineName: input.baselineName,
    metricDefinitions,
    baselineCompositeScore,
    baselineAverages,
    scenarios,
    paretoScenarioIds,
    tradeOffMatrix,
    narrativeSummary: "",
  };

  return {
    ...result,
    narrativeSummary: buildScenarioComparisonNarrative(result),
  };
}

export function buildScenarioDeltaFeatureCollection(
  result: ScenarioComparisonResult,
  scenarioId: string,
  metricId: ScenarioMetricId,
  mode: "absolute" | "percent",
): GeoJSON.FeatureCollection {
  const metric = result.metricDefinitions.find((definition) => definition.id === metricId) ?? result.metricDefinitions[0];
  const scenario = result.scenarios.find((candidate) => candidate.scenarioId === scenarioId) ?? result.scenarios[0];

  if (!metric || !scenario) {
    return { type: "FeatureCollection", features: [] };
  }

  return {
    type: "FeatureCollection",
    features: scenario.units.map((unit) => ({
      type: "Feature",
      id: unit.unitId,
      geometry: unit.geometry,
      properties: {
        id: unit.unitId,
        unit_label: unit.label,
        scenario_id: scenario.scenarioId,
        scenario_name: scenario.name,
        metric_id: metric.id,
        metric_label: metric.label,
        metric_direction: metric.direction,
        baseline_value: unit.baselineMetrics[metric.id],
        scenario_value: unit.scenarioMetrics[metric.id],
        absolute_delta: unit.absoluteDeltas[metric.id],
        percent_delta: unit.percentDeltas[metric.id],
        improvement_delta: unit.improvementDeltas[metric.id],
        display_value: mode === "percent"
          ? unit.percentDeltas[metric.id]
          : unit.absoluteDeltas[metric.id],
      },
    })),
  };
}