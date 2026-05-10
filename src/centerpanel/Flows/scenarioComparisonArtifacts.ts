import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import type {
  AnalyticalFlowId,
  CompletedAnalysisRun,
  UrbanScenarioComparison,
} from '@/features/urbanAnalytics/lib/types';
import {
  buildScenarioDeltaFeatureCollection,
  type ScenarioComparisonResult,
  type ScenarioMetricId,
} from '@/engine/simulation';
import {
  buildScenarioComparisonNarrativeText,
  buildScenarioComparisonSummaryText,
  type ScenarioComparisonForm,
} from './scenarioComparisonShared';

export type ScenarioDeltaMode = ScenarioComparisonForm['deltaMode'];

export interface ScenarioSeriesPoint {
  metric: ScenarioComparisonResult['metricDefinitions'][number];
  value: number;
}

export interface ScenarioChartSeries {
  id: string;
  label: string;
  color: string;
  values: ScenarioSeriesPoint[];
}

export interface ScenarioChartDataExport {
  radarSeries: Array<{
    id: string;
    label: string;
    metrics: Array<{
      metricId: ScenarioMetricId;
      metricLabel: string;
      normalizedValue: number;
    }>;
  }>;
  parallelSeries: Array<{
    id: string;
    label: string;
    metrics: Array<{
      metricId: ScenarioMetricId;
      metricLabel: string;
      normalizedValue: number;
    }>;
  }>;
  tradeOffMatrix: ScenarioComparisonResult['tradeOffMatrix'];
}

function nowIso(): string {
  return new Date().toISOString();
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function scenarioAssumptionList(value: string): string[] {
  const normalized = value.trim();
  return normalized.length > 0 ? [normalized] : [];
}

function buildScenarioComparisonMetadata(
  runId: string,
  createdAt: string,
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
  outputReferences: {
    mapOutputIds: string[];
    chartOutputIds: string[];
    dataOutputIds: string[];
  },
): UrbanScenarioComparison {
  const ranked = [...result.scenarios].sort((left, right) => right.compositeScore - left.compositeScore);
  const lead = ranked[0] ?? null;
  const importedCandidateCount = form.scenarios.filter((scenario) => Boolean(scenario.sourceRunId)).length;

  const assumptions = unique([
    form.baselineDescription,
    ...form.scenarios.flatMap((scenario) => scenarioAssumptionList(scenario.assumptions)),
    ...result.scenarios.flatMap((scenario) => scenarioAssumptionList(scenario.assumptions)),
  ]);

  const uncertaintyNotes = unique([
    'Scenario comparison baseline uses an embedded district-scale fixture and requires local calibration for operational planning.',
    'Composite scores depend on selected indicators, normalization choices, and comparison framing.',
    importedCandidateCount < form.scenarios.length
      ? 'At least one scenario is analyst-authored without an imported source run; provenance depth is uneven across alternatives.'
      : 'Candidate scenarios are partially imported from prior runs; verify each source run assumptions before cross-policy interpretation.',
  ]);

  const guidance = unique([
    'Treat scenario rankings as decision-support guidance, not as guaranteed policy outcomes.',
    'Review trade-offs per indicator before selecting an intervention package.',
    'Validate candidate scenarios with local datasets, stakeholder review, and sensitivity checks.',
  ]);

  const recommendedFollowUps = unique([
    'Run local calibration and sensitivity analysis before policy commitment.',
    'Check equity, displacement risk, and distributional effects for the top-ranked scenarios.',
    'Document implementation constraints that are outside this synthetic lever-response model.',
  ]);

  const policySummary = lead
    ? `${lead.name} currently leads this comparison set (${lead.compositeScore.toFixed(1)}/100), but the ranking is guidance-only and depends on assumptions.`
    : 'Scenario comparison output is guidance-only and requires analyst review.';

  return {
    comparisonId: `${runId}-comparison`,
    runId,
    flowId: 'scenario_comparison',
    createdAt,
    baseline: {
      label: form.baselineName,
      runId: null,
      description: form.baselineDescription.trim() || null,
    },
    candidateRuns: form.scenarios.map((scenario) => ({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      runId: scenario.sourceRunId ?? null,
      flowId: (scenario.sourceFlowId as AnalyticalFlowId | undefined) ?? null,
      assumptions: scenarioAssumptionList(scenario.assumptions),
    })),
    indicatorsCompared: result.metricDefinitions.map((metric) => ({
      indicatorId: metric.id,
      label: metric.label,
      unit: metric.unit,
      direction: metric.direction,
    })),
    deltas: result.scenarios.flatMap((scenario) =>
      scenario.metrics.map((metric) => ({
        deltaId: `${scenario.scenarioId}:${metric.metricId}`,
        scenarioId: scenario.scenarioId,
        indicatorId: metric.metricId,
        baselineValue: metric.baseline,
        candidateValue: metric.scenario,
        absoluteDelta: metric.absoluteDelta,
        percentDelta: metric.percentDelta,
        improvementDelta: metric.improvementDelta,
      })),
    ),
    uncertaintyNotes,
    policyInterpretation: {
      mode: 'guidance',
      summary: policySummary,
      guidance,
      assumptions,
      uncertaintyNotes,
      recommendedFollowUps,
    },
    limitations: unique([
      'Composite scenario ranking is sensitive to metric selection and normalization; rank shifts are expected under alternative weighting assumptions.',
      'Trade-off matrix aggregates district-level responses and may conceal intra-district heterogeneity.',
      'Lever-response relationships are deterministic scenario abstractions and should not be treated as calibrated causal forecasts.',
    ]),
    evidence: {
      artifactIds: [],
      mapOutputIds: outputReferences.mapOutputIds,
      chartOutputIds: outputReferences.chartOutputIds,
      dataOutputIds: outputReferences.dataOutputIds,
    },
  };
}

export function slugifyScenarioComparisonOutput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'scenario-comparison';
}

export function scenarioStroke(index: number): string {
  const palette = ['#F59E0B', '#38BDF8', '#22C55E', '#F97316', '#E879F9'];
  return palette[index % palette.length] ?? palette[0]!;
}

export function buildScenarioRadarSeries(result: ScenarioComparisonResult): ScenarioChartSeries[] {
  const baselineMetricSource = result.scenarios[0]?.metrics ?? [];
  return [
    {
      id: 'baseline',
      label: result.baselineName,
      color: '#A8A29E',
      values: result.metricDefinitions.map((metric) => ({
        metric,
        value: baselineMetricSource.find((entry) => entry.metricId === metric.id)?.normalizedBaseline ?? 0,
      })),
    },
    ...result.scenarios.map((scenario, index) => ({
      id: scenario.scenarioId,
      label: scenario.name,
      color: scenarioStroke(index),
      values: scenario.metrics.map((metric) => ({
        metric: result.metricDefinitions.find((definition) => definition.id === metric.metricId) ?? result.metricDefinitions[0]!,
        value: metric.normalizedScenario,
      })),
    })),
  ];
}

export function buildScenarioParallelSeries(result: ScenarioComparisonResult): ScenarioChartSeries[] {
  const baselineMetricSource = result.scenarios[0]?.metrics ?? [];
  return [
    {
      id: 'baseline',
      label: result.baselineName,
      color: '#A8A29E',
      values: result.metricDefinitions.map((metric) => ({
        metric,
        value: baselineMetricSource.find((entry) => entry.metricId === metric.id)?.normalizedBaseline ?? 0,
      })),
    },
    ...result.scenarios.map((scenario, index) => ({
      id: scenario.scenarioId,
      label: scenario.name,
      color: scenarioStroke(index),
      values: scenario.metrics.map((metric) => ({
        metric: result.metricDefinitions.find((definition) => definition.id === metric.metricId) ?? result.metricDefinitions[0]!,
        value: metric.normalizedScenario,
      })),
    })),
  ];
}

export function buildScenarioChartDataExport(result: ScenarioComparisonResult): ScenarioChartDataExport {
  const radarSeries = buildScenarioRadarSeries(result);
  const parallelSeries = buildScenarioParallelSeries(result);

  return {
    radarSeries: radarSeries.map((series) => ({
      id: series.id,
      label: series.label,
      metrics: series.values.map((entry) => ({
        metricId: entry.metric.id,
        metricLabel: entry.metric.label,
        normalizedValue: entry.value,
      })),
    })),
    parallelSeries: parallelSeries.map((series) => ({
      id: series.id,
      label: series.label,
      metrics: series.values.map((entry) => ({
        metricId: entry.metric.id,
        metricLabel: entry.metric.label,
        normalizedValue: entry.value,
      })),
    })),
    tradeOffMatrix: result.tradeOffMatrix,
  };
}

export function buildScenarioDeltaCsv(
  result: ScenarioComparisonResult,
  scenarioId: string,
  metricId: ScenarioMetricId,
): string {
  const scenario = result.scenarios.find((entry) => entry.scenarioId === scenarioId) ?? result.scenarios[0]!;
  const headers = [
    'unit_id',
    'unit_label',
    'baseline_value',
    'scenario_value',
    'absolute_delta',
    'percent_delta',
    'improvement_delta',
  ];
  const rows = scenario.units.map((unit) => [
    unit.unitId,
    unit.label,
    unit.baselineMetrics[metricId].toFixed(4),
    unit.scenarioMetrics[metricId].toFixed(4),
    unit.absoluteDeltas[metricId].toFixed(4),
    unit.percentDeltas[metricId] == null ? '' : unit.percentDeltas[metricId]!.toFixed(4),
    unit.improvementDeltas[metricId].toFixed(4),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function buildScenarioDeltaLayer(
  result: ScenarioComparisonResult,
  scenarioId: string,
  metricId: ScenarioMetricId,
  deltaMode: ScenarioDeltaMode,
  options?: {
    layerId?: string;
    updatedAt?: string;
  },
): OverlayLayerConfig {
  const scenario = result.scenarios.find((entry) => entry.scenarioId === scenarioId) ?? result.scenarios[0]!;
  const metric = result.metricDefinitions.find((entry) => entry.id === metricId) ?? result.metricDefinitions[0]!;
  const featureCollection = buildScenarioDeltaFeatureCollection(result, scenario.scenarioId, metric.id, deltaMode);

  return {
    id: options?.layerId ?? `scenario-delta-${scenario.scenarioId}-${metric.id}-${deltaMode}`,
    name: `${scenario.name} - ${metric.label} ${deltaMode === 'percent' ? 'percent' : 'absolute'} delta`,
    type: 'geojson',
    visible: true,
    opacity: 0.84,
    sourceData: featureCollection,
    group: 'analysis',
    metadata: {
      featureCount: featureCollection.features.length,
      geometryType: 'polygon',
      updatedAt: options?.updatedAt ?? nowIso(),
      fields: [
        'baseline_value',
        'scenario_value',
        'absolute_delta',
        'percent_delta',
        'improvement_delta',
        'display_value',
      ],
    },
  };
}

export function buildScenarioComparisonCompletedRun(
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
  options?: {
    runId?: string;
    insertedAt?: string;
  },
): CompletedAnalysisRun {
  const insertedAt = options?.insertedAt ?? nowIso();
  const runId = options?.runId ?? `scenario-comparison-${Date.now()}`;
  const mapOutputId = `${runId}-delta`;
  const radarOutputId = `${runId}-radar`;
  const parallelOutputId = `${runId}-parallel`;
  const tradeoffOutputId = `${runId}-tradeoff-matrix`;
  const activeScenario = result.scenarios.find((scenario) => scenario.scenarioId === form.activeScenarioId) ?? result.scenarios[0]!;
  const activeMetric = result.metricDefinitions.find((metric) => metric.id === form.activeMetricId) ?? result.metricDefinitions[0]!;
  const deltaLayer = buildScenarioDeltaLayer(result, activeScenario.scenarioId, activeMetric.id, form.deltaMode, {
    layerId: `${runId}-delta-layer`,
    updatedAt: insertedAt,
  });
  const chartData = buildScenarioChartDataExport(result);
  const summary = buildScenarioComparisonSummaryText(form, result);
  const narrative = buildScenarioComparisonNarrativeText(form, result);
  const comparisonMetadata = buildScenarioComparisonMetadata(runId, insertedAt, form, result, {
    mapOutputIds: [mapOutputId],
    chartOutputIds: [radarOutputId, parallelOutputId],
    dataOutputIds: [tradeoffOutputId],
  });

  return {
    runId,
    flowId: 'scenario_comparison',
    label: form.outputTitle.trim() || 'Scenario Comparison Dashboard',
    insertedAt,
    paragraph: narrative,
    paragraphPreview: summary,
    paragraphFull: `${summary}\n\n${narrative}`,
    mapOutputs: [
      {
        id: mapOutputId,
        type: 'choropleth',
        geojson: deltaLayer.sourceData ?? { type: 'FeatureCollection', features: [] },
        title: deltaLayer.name,
        layerName: deltaLayer.name,
        metadata: {
          scenarioComparisonId: comparisonMetadata.comparisonId,
          outputRole: 'map_delta',
          policyInterpretationMode: comparisonMetadata.policyInterpretation.mode,
        },
        scenarioComparison: {
          outputRole: 'map_delta',
          comparison: comparisonMetadata,
        },
      },
    ],
    chartOutputs: [
      {
        id: radarOutputId,
        type: 'radar',
        title: 'Scenario radar comparison',
        data: chartData.radarSeries,
        metadata: {
          scenarioComparisonId: comparisonMetadata.comparisonId,
          outputRole: 'chart_radar',
          policyInterpretationMode: comparisonMetadata.policyInterpretation.mode,
        },
        scenarioComparison: {
          outputRole: 'chart_radar',
          comparison: comparisonMetadata,
        },
      },
      {
        id: parallelOutputId,
        type: 'line',
        title: 'Scenario parallel coordinate data',
        data: chartData.parallelSeries,
        metadata: {
          scenarioComparisonId: comparisonMetadata.comparisonId,
          outputRole: 'chart_parallel',
          policyInterpretationMode: comparisonMetadata.policyInterpretation.mode,
        },
        scenarioComparison: {
          outputRole: 'chart_parallel',
          comparison: comparisonMetadata,
        },
      },
    ],
    dataOutputs: [
      {
        id: tradeoffOutputId,
        format: 'tradeoff-matrix',
        rows: result.tradeOffMatrix.length,
        columns: ['scenario', ...result.metricDefinitions.map((metric) => metric.id), 'compositeScore'],
        preview: result.tradeOffMatrix.map((row) => ({
          scenario: row.scenarioName,
          compositeScore: row.compositeScore,
          ...Object.fromEntries(row.cells.map((cell) => [cell.metricId, cell.improvementDelta])),
        })),
        metadata: {
          scenarioComparisonId: comparisonMetadata.comparisonId,
          outputRole: 'data_tradeoff_matrix',
          policyInterpretationMode: comparisonMetadata.policyInterpretation.mode,
        },
        scenarioComparison: {
          outputRole: 'data_tradeoff_matrix',
          comparison: comparisonMetadata,
        },
      },
    ],
  };
}