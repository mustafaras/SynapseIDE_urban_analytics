import type {
  MapEvidenceArtifact,
  MapScenarioComparisonEvidenceMetadata,
  OverlayLayerConfig,
} from '@/centerpanel/components/map/mapTypes';
import { createMapScenarioComparisonEvidenceArtifact } from '@/centerpanel/components/map/mapEvidenceArtifacts';
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

function scenarioEvidenceArtifactId(comparisonId: string): string {
  return `map-evidence-scenario-${slugifyScenarioComparisonOutput(comparisonId)}`;
}

function scenarioReportHandoffId(comparisonId: string): string {
  return `map-report-handoff-${slugifyScenarioComparisonOutput(comparisonId)}`;
}

function scenarioDashboardBindingId(comparisonId: string): string {
  return `map-dashboard-binding-${slugifyScenarioComparisonOutput(comparisonId)}`;
}

function buildScenarioComparisonMetadata(
  runId: string,
  createdAt: string,
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
  outputReferences: {
    artifactIds?: string[];
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
      artifactIds: outputReferences.artifactIds ?? [],
      mapOutputIds: outputReferences.mapOutputIds,
      chartOutputIds: outputReferences.chartOutputIds,
      dataOutputIds: outputReferences.dataOutputIds,
    },
  };
}

export function buildMapScenarioComparisonEvidenceMetadata(
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
  options?: {
    runId?: string | null;
    comparisonId?: string;
    createdAt?: string;
    activeScenarioId?: string;
    activeMetricId?: ScenarioMetricId;
    deltaMode?: ScenarioDeltaMode;
    mapOutputIds?: string[];
    chartOutputIds?: string[];
    dataOutputIds?: string[];
    outputLayerIds?: string[];
    evidenceArtifactIds?: string[];
    reportHandoffId?: string;
    dashboardBindingId?: string;
  },
): MapScenarioComparisonEvidenceMetadata {
  const createdAt = options?.createdAt ?? nowIso();
  const runId = options?.runId ?? null;
  const comparisonId = options?.comparisonId ?? `${runId ?? 'scenario-comparison-live'}-comparison`;
  const outputLayerIds = unique(options?.outputLayerIds ?? []);
  const activeScenarioId = options?.activeScenarioId ?? form.activeScenarioId;
  const activeMetricId = options?.activeMetricId ?? form.activeMetricId;
  const metric = result.metricDefinitions.find((entry) => entry.id === activeMetricId) ?? result.metricDefinitions[0]!;
  const urbanComparison = buildScenarioComparisonMetadata(runId ?? comparisonId, createdAt, form, result, {
    artifactIds: options?.evidenceArtifactIds ?? [scenarioEvidenceArtifactId(comparisonId)],
    mapOutputIds: options?.mapOutputIds ?? outputLayerIds,
    chartOutputIds: options?.chartOutputIds ?? [],
    dataOutputIds: options?.dataOutputIds ?? [],
  });

  return {
    version: 1,
    comparisonId: urbanComparison.comparisonId === `${runId ?? comparisonId}-comparison`
      ? comparisonId
      : urbanComparison.comparisonId,
    runId,
    createdAt,
    baseline: {
      label: urbanComparison.baseline.label,
      runId: urbanComparison.baseline.runId,
      description: urbanComparison.baseline.description,
    },
    candidates: urbanComparison.candidateRuns.map((candidate) => ({
      scenarioId: candidate.scenarioId,
      scenarioName: candidate.scenarioName,
      runId: candidate.runId,
      flowId: candidate.flowId,
      assumptionCount: candidate.assumptions.length,
    })),
    indicatorsCompared: urbanComparison.indicatorsCompared.map((indicator) => ({
      indicatorId: indicator.indicatorId,
      label: indicator.label,
      unit: indicator.unit,
      direction: indicator.direction,
    })),
    activeScenarioId,
    comparisonMetric: {
      indicatorId: metric.id,
      label: metric.label,
      unit: metric.unit,
      direction: metric.direction,
    },
    deltaMode: options?.deltaMode ?? form.deltaMode,
    deltas: urbanComparison.deltas.map((delta) => ({
      scenarioId: delta.scenarioId,
      indicatorId: delta.indicatorId,
      baselineValue: delta.baselineValue,
      candidateValue: delta.candidateValue,
      absoluteDelta: delta.absoluteDelta,
      percentDelta: delta.percentDelta,
      improvementDelta: delta.improvementDelta,
    })),
    mapOutputIds: urbanComparison.evidence.mapOutputIds,
    chartOutputIds: urbanComparison.evidence.chartOutputIds,
    dataOutputIds: urbanComparison.evidence.dataOutputIds,
    outputLayerIds,
    sourceRunIds: unique(form.scenarios.map((scenario) => scenario.sourceRunId).filter((value): value is string => Boolean(value))),
    evidenceArtifactIds: urbanComparison.evidence.artifactIds,
    uncertaintyNotes: urbanComparison.uncertaintyNotes,
    limitations: urbanComparison.limitations,
    policyInterpretationMode: urbanComparison.policyInterpretation.mode,
    guidanceSummary: urbanComparison.policyInterpretation.summary,
    handoff: {
      reportHandoffId: options?.reportHandoffId ?? scenarioReportHandoffId(comparisonId),
      dashboardBindingId: options?.dashboardBindingId ?? scenarioDashboardBindingId(comparisonId),
      reportCompatible: true,
      dashboardCompatible: true,
      refreshMode: 'static',
      liveStateLabel: 'Static scenario comparison evidence; refresh after scenario parameters, metrics, or source runs change.',
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
    evidenceArtifactId?: string;
    scenarioComparison?: MapScenarioComparisonEvidenceMetadata;
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
      ...(options?.evidenceArtifactId ? { evidenceArtifactId: options.evidenceArtifactId } : {}),
      ...(options?.scenarioComparison ? { scenarioComparison: options.scenarioComparison } : {}),
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

export function buildScenarioComparisonMapEvidenceArtifact(
  form: ScenarioComparisonForm,
  result: ScenarioComparisonResult,
  options?: {
    runId?: string | null;
    comparisonId?: string;
    createdAt?: string;
    activeScenarioId?: string;
    activeMetricId?: ScenarioMetricId;
    deltaMode?: ScenarioDeltaMode;
    mapOutputIds?: string[];
    chartOutputIds?: string[];
    dataOutputIds?: string[];
    outputLayerIds?: string[];
    sourceLayerIds?: string[];
    derivedLayerId?: string;
  },
): MapEvidenceArtifact {
  const comparison = buildMapScenarioComparisonEvidenceMetadata(form, result, {
    runId: options?.runId,
    comparisonId: options?.comparisonId,
    createdAt: options?.createdAt,
    activeScenarioId: options?.activeScenarioId,
    activeMetricId: options?.activeMetricId,
    deltaMode: options?.deltaMode,
    mapOutputIds: options?.mapOutputIds,
    chartOutputIds: options?.chartOutputIds,
    dataOutputIds: options?.dataOutputIds,
    outputLayerIds: options?.outputLayerIds,
  });
  const evidenceId = comparison.evidenceArtifactIds[0] ?? scenarioEvidenceArtifactId(comparison.comparisonId);
  return createMapScenarioComparisonEvidenceArtifact({
    id: evidenceId,
    scenarioComparison: {
      ...comparison,
      evidenceArtifactIds: unique([evidenceId, ...comparison.evidenceArtifactIds]),
    },
    title: form.outputTitle.trim() || 'Scenario comparison evidence',
    summary: `${comparison.candidates.length} scenario(s) compared against ${comparison.baseline.label}; ${comparison.comparisonMetric.label} is the active map delta metric.`,
    sourceLayerIds: options?.sourceLayerIds,
    linkedLayerIds: options?.outputLayerIds,
    derivedLayerId: options?.derivedLayerId ?? comparison.outputLayerIds[0],
    linkedRunId: options?.runId ?? undefined,
    createdAt: options?.createdAt ?? comparison.createdAt,
  });
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
  const comparisonId = `${runId}-comparison`;
  const evidenceArtifactId = scenarioEvidenceArtifactId(comparisonId);
  const outputLayerId = `${runId}-delta-layer`;
  const activeScenario = result.scenarios.find((scenario) => scenario.scenarioId === form.activeScenarioId) ?? result.scenarios[0]!;
  const activeMetric = result.metricDefinitions.find((metric) => metric.id === form.activeMetricId) ?? result.metricDefinitions[0]!;
  const mapScenarioEvidence = buildMapScenarioComparisonEvidenceMetadata(form, result, {
    runId,
    comparisonId,
    createdAt: insertedAt,
    activeScenarioId: activeScenario.scenarioId,
    activeMetricId: activeMetric.id,
    deltaMode: form.deltaMode,
    evidenceArtifactIds: [evidenceArtifactId],
    mapOutputIds: [mapOutputId],
    chartOutputIds: [radarOutputId, parallelOutputId],
    dataOutputIds: [tradeoffOutputId],
    outputLayerIds: [outputLayerId],
  });
  const deltaLayer = buildScenarioDeltaLayer(result, activeScenario.scenarioId, activeMetric.id, form.deltaMode, {
    layerId: outputLayerId,
    updatedAt: insertedAt,
    evidenceArtifactId,
    scenarioComparison: mapScenarioEvidence,
  });
  const chartData = buildScenarioChartDataExport(result);
  const summary = buildScenarioComparisonSummaryText(form, result);
  const narrative = buildScenarioComparisonNarrativeText(form, result);
  const comparisonMetadata = buildScenarioComparisonMetadata(runId, insertedAt, form, result, {
    artifactIds: [evidenceArtifactId],
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
          mapEvidenceArtifactId: evidenceArtifactId,
          reportHandoffId: mapScenarioEvidence.handoff.reportHandoffId,
          dashboardBindingId: mapScenarioEvidence.handoff.dashboardBindingId,
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
          mapEvidenceArtifactId: evidenceArtifactId,
          dashboardBindingId: mapScenarioEvidence.handoff.dashboardBindingId,
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
          mapEvidenceArtifactId: evidenceArtifactId,
          dashboardBindingId: mapScenarioEvidence.handoff.dashboardBindingId,
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
          mapEvidenceArtifactId: evidenceArtifactId,
          reportHandoffId: mapScenarioEvidence.handoff.reportHandoffId,
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
