import type {
  CellularAutomataResult,
  CompositeIndicatorResult,
  FacilityOptimisationResult,
  ScenarioComparisonResult,
} from '@/engine/simulation';
import type { NarrativeInput } from '@/engine/geoai/nlp/ReportNarrativeGenerator';
import type { CompletedAnalysisRun } from '@/features/urbanAnalytics/lib/types';
import type {
  BuildingExposureSummary,
  SunlightConfig,
  SunlightResult,
} from '@/features/urbanAnalytics/voxcity/sunlightTypes';
import type { ScenarioComparisonForm } from './scenarioComparisonShared';

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function asPercent(value: number): number {
  return value * 100;
}

function countUrbanCells(values: readonly number[]): number {
  return values.filter((value) => value >= 0.5).length;
}

export function buildCompositeIndicatorNarrativeInput(
  config: {
    outputTitle: string;
    scenarioName: string;
    normalizationMethod: string;
    weightingMethod: string;
    aggregationMethod: string;
  },
  result: CompositeIndicatorResult,
): NarrativeInput {
  const topUnit = result.units[0];
  const bottomUnit = result.units[result.units.length - 1];
  const findings: NonNullable<NarrativeInput['findings']> = [];

  if (topUnit) {
    findings.push({
      id: 'composite-top-unit',
      label: `Top-ranked unit (${topUnit.label})`,
      value: topUnit.scorePercent,
      unit: 'points',
      sourceField: 'units[0].scorePercent',
    });
  }

  if (bottomUnit) {
    findings.push({
      id: 'composite-bottom-unit',
      label: `Lowest-ranked unit (${bottomUnit.label})`,
      value: bottomUnit.scorePercent,
      unit: 'points',
      sourceField: 'units[last].scorePercent',
    });
  }

  findings.push(
    {
      id: 'composite-topk-stability',
      label: `Top-${result.sensitivity.topK} stability`,
      value: asPercent(result.sensitivity.topKStability),
      unit: '%',
      sourceField: 'sensitivity.topKStability',
    },
    {
      id: 'composite-kendall',
      label: 'Mean Kendall tau to baseline',
      value: result.sensitivity.meanKendallTauToBaseline,
      sourceField: 'sensitivity.meanKendallTauToBaseline',
    },
  );

  return {
    analysisId: `indicator-composite:${result.configurationPackage?.generatedAt ?? config.scenarioName}`,
    analysisTitle: config.outputTitle,
    studyArea: config.scenarioName,
    sampleSize: result.units.length,
    findings,
    comparisons: topUnit && bottomUnit
      ? [
          {
            id: 'composite-score-gap',
            label: 'Composite score spread',
            groupA: topUnit.label,
            groupB: bottomUnit.label,
            valueA: topUnit.scorePercent,
            valueB: bottomUnit.scorePercent,
            unit: 'points',
            sourceField: 'units.scorePercent',
          },
        ]
      : [],
    recommendations: [
      {
        id: 'composite-recommendation',
        subject: config.outputTitle,
        action: `carry forward the ${titleCase(config.normalizationMethod)} normalization and ${titleCase(config.weightingMethod)} weighting assumptions into report review, and scrutinize lower-ranked units before any decision framing`,
        supportingClaimIds: ['composite-top-unit', 'composite-bottom-unit', 'composite-topk-stability'],
        priority: 'medium',
      },
    ],
    methodology: {
      id: 'oecd-jrc-composite-indicator',
      name: 'OECD/JRC-style Composite Indicator Workflow',
      description: `${titleCase(config.normalizationMethod)} normalization, ${titleCase(config.weightingMethod)} weighting, and ${titleCase(config.aggregationMethod)} aggregation with Monte Carlo sensitivity diagnostics.`,
    },
  };
}

export function buildFacilityOptimisationNarrativeInput(
  config: {
    scenarioName: string;
    model: string;
    serviceRadiusKm: number;
    equityMode: string;
    priorityGroups: string[];
  },
  result: FacilityOptimisationResult,
): NarrativeInput {
  const orderedGroups = [...result.equityDiagnostics.groups].sort((left, right) => left.coverageRatio - right.coverageRatio);
  const lowestCoverage = orderedGroups[0];
  const highestCoverage = orderedGroups[orderedGroups.length - 1];

  return {
    analysisId: `facility-optimisation:${config.scenarioName}`,
    analysisTitle: config.scenarioName,
    studyArea: `Service radius ${config.serviceRadiusKm.toFixed(1)} km`,
    sampleSize: result.assignments.length,
    findings: [
      {
        id: 'facility-covered-demand',
        label: 'Covered demand ratio',
        value: asPercent(result.demandSummary.coveredDemandRatio),
        unit: '%',
        sourceField: 'demandSummary.coveredDemandRatio',
      },
      {
        id: 'facility-mean-travel',
        label: 'Mean travel burden',
        value: result.demandSummary.meanTravelBurdenKm,
        unit: 'km',
        sourceField: 'demandSummary.meanTravelBurdenKm',
      },
      {
        id: 'facility-coverage-gap',
        label: 'Coverage gap',
        value: asPercent(result.equityDiagnostics.coverageGap),
        unit: '%',
        sourceField: 'equityDiagnostics.coverageGap',
      },
    ],
    comparisons: lowestCoverage && highestCoverage
      ? [
          {
            id: 'facility-group-coverage',
            label: 'Group coverage ratio',
            groupA: titleCase(lowestCoverage.group),
            groupB: titleCase(highestCoverage.group),
            valueA: asPercent(lowestCoverage.coverageRatio),
            valueB: asPercent(highestCoverage.coverageRatio),
            unit: '%',
            sourceField: 'equityDiagnostics.groups.coverageRatio',
          },
        ]
      : [],
    recommendations: [
      {
        id: 'facility-recommendation',
        subject: config.scenarioName,
        action: `review site placement under the ${titleCase(config.model)} objective and ${titleCase(config.equityMode)} equity mode before final reporting, with explicit attention to ${config.priorityGroups.join(', ') || 'non-priority'} groups`,
        supportingClaimIds: ['facility-covered-demand', 'facility-coverage-gap'],
        priority: result.equityDiagnostics.coverageGap > 0.08 ? 'high' : 'medium',
      },
    ],
    methodology: {
      id: 'facility-location-allocation',
      name: 'Location-allocation with equity diagnostics',
      description: `${titleCase(config.model)} siting with a ${config.serviceRadiusKm.toFixed(1)} km catchment radius and ${titleCase(config.equityMode)} equity controls.`,
    },
  };
}

export function buildCellularAutomataNarrativeInput(
  config: {
    scenarioName: string;
    predictionSteps: number;
    perturbationFactor: number;
    growthMultiplier: number;
  },
  result: CellularAutomataResult,
  calibrationLabels: string[],
): NarrativeInput {
  const finalState = result.predictedStates[result.predictedStates.length - 1];
  const observedState = result.observedState;
  const firstState = result.predictedStates[0];
  const findings: NonNullable<NarrativeInput['findings']> = [];

  if (finalState) {
    findings.push({
      id: 'ca-final-urban-cells',
      label: 'Predicted urban cells in final state',
      value: countUrbanCells(finalState.values),
      sourceField: 'predictedStates[last].values',
    });
  }

  if (result.validation) {
    findings.push(
      {
        id: 'ca-figure-of-merit',
        label: 'Figure of merit',
        value: asPercent(result.validation.figureOfMerit),
        unit: '%',
        sourceField: 'validation.figureOfMerit',
      },
      {
        id: 'ca-overall-accuracy',
        label: 'Overall accuracy',
        value: asPercent(result.validation.overallAccuracy),
        unit: '%',
        sourceField: 'validation.overallAccuracy',
      },
    );
  }

  return {
    analysisId: `urban-growth-ca:${config.scenarioName}`,
    analysisTitle: config.scenarioName,
    studyArea: calibrationLabels.join(', '),
    sampleSize: result.predictedStates.length,
    findings,
    comparisons: finalState && observedState
      ? [
          {
            id: 'ca-predicted-vs-observed',
            label: 'Final predicted versus observed urban cells',
            groupA: 'Predicted final state',
            groupB: observedState.label ?? 'Observed state',
            valueA: countUrbanCells(finalState.values),
            valueB: countUrbanCells(observedState.values),
            unit: 'cells',
            sourceField: 'predictedStates[last].values',
          },
        ]
      : [],
    trends: firstState && finalState
      ? [
          {
            id: 'ca-urban-growth-trend',
            label: 'Urban cell growth across simulated states',
            from: { t: firstState.label ?? 'Initial predicted state', value: countUrbanCells(firstState.values) },
            to: { t: finalState.label ?? 'Final predicted state', value: countUrbanCells(finalState.values) },
            unit: 'cells',
            sourceField: 'predictedStates.values',
          },
        ]
      : [],
    recommendations: [
      {
        id: 'ca-recommendation',
        subject: config.scenarioName,
        action: `treat this ${config.predictionSteps}-step scenario as an exploratory growth stub and carry its calibration assumptions into downstream scenario comparison only after validation review`,
        supportingClaimIds: ['ca-final-urban-cells', 'ca-figure-of-merit', 'ca-overall-accuracy'],
        priority: result.validation?.fitQuality === 'strong' ? 'medium' : 'high',
      },
    ],
    methodology: {
      id: 'constrained-cellular-automata',
      name: 'Constrained cellular automata urban growth model',
      description: `Forward simulation with ${config.predictionSteps} steps, perturbation ${config.perturbationFactor.toFixed(2)}, and growth multiplier ${config.growthMultiplier.toFixed(2)}.`,
    },
  };
}

export function buildScenarioComparisonNarrativeInput(
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
): NarrativeInput {
  const orderedScenarios = [...result.scenarios].sort((left, right) => right.compositeScore - left.compositeScore);
  const best = orderedScenarios[0];
  const weakest = orderedScenarios[orderedScenarios.length - 1];
  const findings: NonNullable<NarrativeInput['findings']> = [];

  if (best) {
    findings.push(
      {
        id: 'scenario-best-score',
        label: `Highest composite score (${best.name})`,
        value: best.compositeScore,
        unit: 'points',
        sourceField: 'scenarios.compositeScore',
      },
      {
        id: 'scenario-best-improvement',
        label: `Mean improvement for ${best.name}`,
        value: best.meanImprovement,
        unit: 'points',
        sourceField: 'scenarios.meanImprovement',
      },
    );
  }

  findings.push({
    id: 'scenario-pareto-count',
    label: 'Pareto candidate scenarios',
    value: result.paretoScenarioIds.length,
    sourceField: 'paretoScenarioIds',
  });

  return {
    analysisId: `scenario-comparison:${form.outputTitle}`,
    analysisTitle: form.outputTitle,
    studyArea: result.baselineName,
    sampleSize: result.scenarios.length,
    findings,
    comparisons: best && weakest
      ? [
          {
            id: 'scenario-score-spread',
            label: 'Composite score spread',
            groupA: best.name,
            groupB: weakest.name,
            valueA: best.compositeScore,
            valueB: weakest.compositeScore,
            unit: 'points',
            sourceField: 'scenarios.compositeScore',
          },
        ]
      : [],
    recommendations: [
      {
        id: 'scenario-recommendation',
        subject: form.outputTitle,
        action: 'carry the leading scenario and any Pareto candidates into policy briefing, but explicitly document the weakest trade-off dimensions before sign-off',
        supportingClaimIds: ['scenario-best-score', 'scenario-best-improvement', 'scenario-pareto-count'],
        priority: 'medium',
      },
    ],
    methodology: {
      id: 'scenario-dashboard-comparison',
      name: 'Aligned multi-scenario comparison dashboard',
      description: `${result.scenarios.length} scenarios evaluated against ${result.metricDefinitions.length} aligned metrics with a baseline-normalized trade-off frame.`,
    },
  };
}

export function buildSunlightNarrativeInput(
  config: SunlightConfig,
  result: SunlightResult,
  summaries: readonly BuildingExposureSummary[],
): NarrativeInput {
  const orderedBuildings = [...summaries].sort((left, right) => left.avgExposureHours - right.avgExposureHours);
  const lowestExposure = orderedBuildings[0];
  const highestExposure = orderedBuildings[orderedBuildings.length - 1];

  return {
    analysisId: `sunlight:${result.id}`,
    analysisTitle: 'Sunlight & Solar Exposure Simulation',
    studyArea: `${config.startDate} to ${config.endDate} at ${config.location.latitude.toFixed(4)}, ${config.location.longitude.toFixed(4)}`,
    sampleSize: result.buildings.length,
    findings: [
      {
        id: 'sunlight-mean-exposure',
        label: 'Mean grid exposure',
        value: result.stats.meanExposure,
        unit: 'h',
        sourceField: 'stats.meanExposure',
      },
      {
        id: 'sunlight-total-daylight',
        label: 'Total daylight hours',
        value: result.totalDaylightHours,
        unit: 'h',
        sourceField: 'totalDaylightHours',
      },
      {
        id: 'sunlight-building-count',
        label: 'Buildings evaluated',
        value: result.buildings.length,
        sourceField: 'buildings.length',
      },
    ],
    comparisons: lowestExposure && highestExposure
      ? [
          {
            id: 'sunlight-building-contrast',
            label: 'Average building exposure contrast',
            groupA: lowestExposure.label,
            groupB: highestExposure.label,
            valueA: lowestExposure.avgExposureHours,
            valueB: highestExposure.avgExposureHours,
            unit: 'h',
            sourceField: 'buildingSummaries.avgExposureHours',
          },
        ]
      : [],
    recommendations: [
      {
        id: 'sunlight-recommendation',
        subject: 'Solar exposure results',
        action: 'use the lowest-exposure buildings as daylight review candidates before framing any solar-access or shading recommendations',
        supportingClaimIds: ['sunlight-mean-exposure', 'sunlight-total-daylight', 'sunlight-building-count'],
        priority: lowestExposure && lowestExposure.sunlitFraction < 0.45 ? 'high' : 'medium',
      },
    ],
    methodology: {
      id: 'discrete-sun-position-simulation',
      name: 'Discrete sun-position simulation',
      description: `${config.intervalMinutes}-minute sampling between hours ${config.startHour} and ${config.endHour} with UTC offset ${config.utcOffset}.`,
    },
  };
}

export function buildCompletedRunNarrativeInput(run: CompletedAnalysisRun): NarrativeInput | null {
  const primaryMapOutput = run.mapOutputs.find((output) => typeof output.engineBridge === 'object' && output.engineBridge !== null);
  const summary = (primaryMapOutput?.engineBridge as { statisticalSummary?: Record<string, unknown>; engine?: string; domain?: string } | undefined)?.statisticalSummary ?? {};
  const numericSummaryEntries = Object.entries(summary)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
    .slice(0, 4);

  const findings = numericSummaryEntries.map(([key, value], index) => ({
    id: `completed-run-${index}`,
    label: titleCase(key),
    value,
    sourceField: `mapOutputs[0].engineBridge.statisticalSummary.${key}`,
  }));

  if (findings.length === 0) {
    findings.push(
      {
        id: 'completed-run-map-count',
        label: 'Published map outputs',
        value: run.mapOutputs.length,
        sourceField: 'mapOutputs.length',
      },
      {
        id: 'completed-run-data-count',
        label: 'Published data outputs',
        value: run.dataOutputs.length,
        sourceField: 'dataOutputs.length',
      },
    );
  }

  return {
    analysisId: run.runId,
    analysisTitle: run.label,
    studyArea: titleCase(run.flowId),
    sampleSize: run.dataOutputs[0]?.rows ?? undefined,
    findings,
    recommendations: [
      {
        id: 'completed-run-recommendation',
        subject: run.label,
        action: 'use the saved analytical outputs as the reference evidence package when inserting narrative text into the report',
        supportingClaimIds: findings.map((finding) => finding.id),
        priority: 'medium',
      },
    ],
    methodology: {
      id: 'completed-run-review',
      name: primaryMapOutput?.engineBridge
        ? `${titleCase((primaryMapOutput.engineBridge as { engine?: string }).engine ?? 'analysis')} review envelope`
        : 'Completed analysis review envelope',
      description: primaryMapOutput?.engineBridge
        ? `Narrative generated from saved ${titleCase((primaryMapOutput.engineBridge as { domain?: string }).domain ?? 'analysis')} outputs and persisted review artifacts.`
        : 'Narrative generated from persisted run outputs and review-ready summary artifacts.',
    },
  };
}