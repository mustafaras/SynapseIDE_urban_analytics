import {
  getDashboardBinding,
  registerDashboardBinding,
} from '@/features/dashboard/dataBindings';
import { queuePendingDashboardBinding } from '@/features/dashboard/storage';
import type {
  DashboardBinding,
  DashboardComparisonBinding,
  DashboardMapBinding,
  DashboardMetricBinding,
  DashboardSeriesBinding,
  DashboardTableBinding,
  DashboardTemplateId,
  DashboardTextBinding,
  DashboardWidgetType,
} from '@/features/dashboard/types';
import { getIndicatorDefinition } from '../indicators/catalog';
import { getLatestComputedIndicatorRecord } from '../indicators/storage';
import { useUrbanContextStore } from '../useUrbanContextStore';
import { useFlowStore } from '@/stores/useFlowStore';
import {
  buildUrbanScenarioComparisonHandoff,
  buildUrbanScenarioInterpretationGuidance,
  buildUrbanScenarioLimitationNotes,
  extractUrbanScenarioComparison,
} from './scenarioComparisonMetadata';
import type {
  AnalyticalFlowId,
  ChartOutput,
  CompletedAnalysisRun,
  DataOutput,
  MapOutput,
  UrbanDashboardBinding,
  UrbanDashboardBindingKind,
  UrbanDashboardRefreshMode,
  UrbanDashboardWidgetType,
  UrbanEvidenceArtifact,
  UrbanEvidenceQAState,
  UrbanScenarioComparison,
  UrbanEvidenceScalar,
  UrbanWorkflowRunManifest,
} from '../lib/types';

const MAX_TEXT = 420;
const MAX_POINTS = 8;
const MAX_TABLE_ROWS = 8;

export interface BuildUrbanDashboardBindingInput {
  artifact: UrbanEvidenceArtifact;
  run?: CompletedAnalysisRun | null;
  manifest?: UrbanWorkflowRunManifest | null;
  generatedAt?: string;
}

export interface EnqueueUrbanDashboardBindingResult {
  binding: UrbanDashboardBinding;
  dashboardBinding: DashboardBinding;
  evidenceArtifactId: string;
  queued: true;
}

export interface UrbanDashboardBindingEligibility {
  eligible: boolean;
  reason: string | null;
  existingBindingId?: string;
  existingWidgetType?: DashboardWidgetType;
}

function now(): string {
  return new Date().toISOString();
}

function clip(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== 'string') return '';
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > max ? text.slice(0, max) : text;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clip(value, 160);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }
  return output;
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function scalarMetadata(value: unknown): UrbanEvidenceScalar {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  return null;
}

function widgetTypeForBindingKind(bindingKind: UrbanDashboardBindingKind): UrbanDashboardWidgetType {
  switch (bindingKind) {
    case 'metric':
      return 'kpi';
    case 'series':
      return 'chart';
    case 'table':
      return 'table';
    case 'map':
      return 'map';
    case 'comparison':
      return 'comparison';
    case 'live':
      return 'live_indicator';
    case 'text':
    default:
      return 'text';
  }
}

function dashboardWidgetType(widgetType: UrbanDashboardWidgetType): DashboardWidgetType {
  return widgetType;
}

function flowTags(flowId: AnalyticalFlowId | null | undefined): DashboardTemplateId[] {
  switch (flowId) {
    case 'accessibility':
    case 'walkability':
    case 'fifteen_min_city':
    case 'transit_gap':
    case 'equity_audit':
      return ['accessibility_equity', 'city_profile'];
    case 'vulnerability':
    case 'heat_island':
    case 'green_deficit':
      return ['risk_assessment', 'sdg_monitoring'];
    case 'scenario_comparison':
    case 'system_dynamics':
      return ['neighborhood_comparison', 'risk_assessment'];
    case 'indicator_composite':
      return ['sdg_monitoring', 'city_profile'];
    case 'site_suitability':
    case 'urban_morphology':
    case 'voxcity_3d':
    case 'cityjson_loader':
    case 'sunlight_sim':
      return ['city_profile', 'neighborhood_comparison'];
    default:
      return ['city_profile'];
  }
}

function qaStatusToMetricStatus(state: UrbanEvidenceQAState): DashboardMetricBinding['status'] {
  switch (state) {
    case 'blocked':
    case 'invalid':
      return 'critical';
    case 'warning':
    case 'stale':
      return 'watch';
    case 'valid':
      return 'improving';
    case 'unvalidated':
    default:
      return 'steady';
  }
}

function firstFiniteNumber(values: Iterable<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function numericFields(record: Record<string, unknown>): Array<[string, number]> {
  return Object.entries(record).flatMap(([key, value]) =>
    typeof value === 'number' && Number.isFinite(value) ? [[key, value] as [string, number]] : [],
  );
}

function labelFromRecord(record: Record<string, unknown>, fallback: string): string {
  const value = record.label ?? record.name ?? record.category ?? record.id ?? record.key;
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 48) : fallback;
}

function pointsFromChartOutput(output: ChartOutput): DashboardSeriesBinding['points'] {
  const data = output.data;
  if (Array.isArray(data)) {
    const numericArray = data.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));
    if (numericArray.length > 0 && numericArray.length === data.length) {
      return numericArray.slice(0, MAX_POINTS).map((value, index) => ({
        label: `${index + 1}`,
        value,
      }));
    }

    const recordPoints = data.flatMap((entry, index) => {
      if (!isRecord(entry)) return [];
      const numeric = numericFields(entry)[0];
      if (!numeric) return [];
      return [{
        label: labelFromRecord(entry, `${index + 1}`),
        value: numeric[1],
      }];
    });
    if (recordPoints.length > 0) return recordPoints.slice(0, MAX_POINTS);
  }

  if (isRecord(data)) {
    const numeric = numericFields(data);
    if (numeric.length > 0) {
      return numeric.slice(0, MAX_POINTS).map(([label, value]) => ({ label, value }));
    }
  }

  return [{ label: output.title, value: 1 }];
}

function comparisonItemsFromChartOutputs(outputs: readonly ChartOutput[]): DashboardComparisonBinding['items'] {
  for (const output of outputs) {
    const data = output.data;
    if (!Array.isArray(data)) continue;
    const items = data.flatMap((entry, index) => {
      if (!isRecord(entry)) return [];
      const numeric = numericFields(entry);
      if (numeric.length < 2) return [];
      return [{
        label: labelFromRecord(entry, `${index + 1}`),
        primary: numeric[0]![1],
        secondary: numeric[1]![1],
      }];
    });
    if (items.length > 0) return items.slice(0, MAX_POINTS);
  }
  return [];
}

function mapOutputValue(output: MapOutput, index: number): number {
  const summary = output.engineBridge?.statisticalSummary ?? {};
  return firstFiniteNumber(Object.values(summary)) ?? index + 1;
}

function dataOutputRows(outputs: readonly DataOutput[]): DashboardTableBinding['rows'] {
  const rows = outputs.slice(0, MAX_TABLE_ROWS).map((output) => ({
    Output: output.id,
    Format: output.format,
    Rows: output.rows,
    Columns: output.columns.length,
  }));
  return rows.length > 0
    ? rows
    : [{ Output: 'No tabular outputs', Format: 'reference', Rows: 0, Columns: 0 }];
}

function dashboardBindingIdFor(
  artifact: UrbanEvidenceArtifact,
  bindingKind: UrbanDashboardBindingKind,
  runId: string | null,
): string {
  const hash = stableHash(`${artifact.id}:${runId ?? 'no-run'}:${artifact.indicatorKind ?? 'no-indicator'}:${bindingKind}`);
  return `urban-dashboard-${hash}`;
}

function determineBindingKind(
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
): UrbanDashboardBindingKind {
  if (artifact.kind === 'indicator') {
    const record = artifact.indicatorKind ? getLatestComputedIndicatorRecord(artifact.indicatorKind) : null;
    const definition = artifact.indicatorKind ? getIndicatorDefinition(artifact.indicatorKind) : null;
    if ((record?.result.components?.length ?? 0) > 0 && definition?.dashboardBindingKind === 'series') {
      return 'series';
    }
    return 'metric';
  }

  if (artifact.kind === 'workflow-run' && run) {
    const comparisonItems = run.flowId === 'scenario_comparison'
      ? comparisonItemsFromChartOutputs(run.chartOutputs)
      : [];
    if (comparisonItems.length > 0) return 'comparison';
    if (run.chartOutputs.length > 0) return 'series';
    if (run.dataOutputs.length > 0) return 'table';
    if (run.mapOutputs.length > 0) return 'map';
    return 'text';
  }

  if (artifact.kind === 'map-layer') return 'map';
  return 'text';
}

function runtimeLimitations(manifest: UrbanWorkflowRunManifest | null | undefined): string[] {
  if (!manifest || manifest.runtimeMode === 'live') return [];
  if (manifest.runtimeMode === 'demo') {
    return ['Dashboard binding references a demo-mode workflow run; label widget interpretation as demonstration output.'];
  }
  if (manifest.runtimeMode === 'synthetic') {
    return ['Dashboard binding references a synthetic workflow run; do not present widget output as real-world evidence.'];
  }
  return ['Dashboard binding references a workflow run with unknown runtime mode; treat widget interpretation as unverified.'];
}

function buildDescription(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string {
  const runtimeNotes = runtimeLimitations(manifest);
  const scenarioNotes = scenarioComparison
    ? [
        'Scenario interpretation mode: guidance-only (decision support, not certainty).',
        ...buildUrbanScenarioInterpretationGuidance(scenarioComparison),
      ]
    : [];
  const parts = [
    artifact.summary,
    'Static Urban evidence binding. Refresh by regenerating the binding from the evidence tray.',
    ...scenarioNotes,
    ...runtimeNotes,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
  return clip(parts.join(' '), MAX_TEXT);
}

function uncertaintyLabel(
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): string {
  const note = scenarioComparison?.uncertaintyNotes[0]
    ?? scenarioComparison?.policyInterpretation.uncertaintyNotes[0]
    ?? artifact.dataFitness?.uncertaintyNotes[0]
    ?? manifest?.dataFitness?.uncertaintyNotes[0]
    ?? artifact.qa.warnings[0];
  return note ? clip(note, 120) : 'Not quantified';
}

function scaleLabel(manifest: UrbanWorkflowRunManifest | null | undefined): string {
  const scales = manifest?.methodValidity?.validSpatialScales ?? [];
  return scales.length > 0 ? scales.join(', ') : 'Not recorded';
}

function buildTraceability(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  scenarioComparison: UrbanScenarioComparison | null,
): NonNullable<DashboardBinding['traceability']> {
  const scenarioNotes = scenarioComparison
    ? [
        `Scenario comparison ${scenarioComparison.comparisonId}`,
        `Scenario interpretation mode ${scenarioComparison.policyInterpretation.mode}`,
      ]
    : [];
  return {
    sourceArtifactId: binding.artifactId,
    ...(binding.runId ? { sourceRunId: binding.runId } : {}),
    ...(binding.indicatorKind ? { sourceIndicatorKind: binding.indicatorKind } : {}),
    refreshMode: binding.refreshMode,
    scaleLabel: scaleLabel(manifest),
    uncertaintyLabel: uncertaintyLabel(artifact, manifest, scenarioComparison),
    provenanceNotes: [
      `Artifact ${binding.artifactId}`,
      ...(binding.runId ? [`Run ${binding.runId}`] : []),
      ...(binding.provenance.flowId ? [`Flow ${binding.provenance.flowId}`] : []),
      ...scenarioNotes,
    ],
    qaState: binding.qa.state,
    qaWarnings: binding.qa.warnings,
    qaLimitations: binding.qa.limitations,
  };
}

function createMetricBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardMetricBinding {
  const record = artifact.indicatorKind ? getLatestComputedIndicatorRecord(artifact.indicatorKind) : null;
  const result = record?.result ?? null;
  const rawValue = result?.value
    ?? (typeof artifact.metadata?.value === 'number' ? artifact.metadata.value : null)
    ?? (typeof artifact.metadata?.indicatorValue === 'number' ? artifact.metadata.indicatorValue : null)
    ?? 0;
  const unit = result?.unit ?? (typeof artifact.metadata?.unit === 'string' ? artifact.metadata.unit : undefined);
  return {
    id: binding.bindingId,
    kind: 'metric',
    label: binding.title,
    description: binding.description,
    formattedValue: result?.displayValue ?? `${rawValue}${unit ? ` ${unit}` : ''}`,
    rawValue,
    ...(unit ? { unit } : {}),
    ...(result?.classification ? { changeLabel: result.classification } : {}),
    status: qaStatusToMetricStatus(binding.qa.state),
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function createSeriesBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardSeriesBinding {
  const record = artifact.indicatorKind ? getLatestComputedIndicatorRecord(artifact.indicatorKind) : null;
  const componentPoints = record?.result.components?.map((component) => ({
    label: component.label,
    value: component.value,
  })) ?? [];
  const chartPoints = run?.chartOutputs.flatMap(pointsFromChartOutput) ?? [];
  const points = (componentPoints.length > 0 ? componentPoints : chartPoints).slice(0, MAX_POINTS);
  return {
    id: binding.bindingId,
    kind: 'series',
    label: binding.title,
    description: binding.description,
    ...(record?.result.unit ? { unit: record.result.unit } : {}),
    points: points.length > 0 ? points : [{ label: 'Outputs', value: run?.chartOutputs.length ?? 0 }],
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function createTableBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardTableBinding {
  return {
    id: binding.bindingId,
    kind: 'table',
    label: binding.title,
    description: binding.description,
    columns: ['Output', 'Format', 'Rows', 'Columns'],
    rows: dataOutputRows(run?.dataOutputs ?? []),
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function createMapBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardMapBinding {
  const areas = run?.mapOutputs.slice(0, MAX_POINTS).map((output, index) => {
    const value = mapOutputValue(output, index);
    return {
      id: output.id,
      label: output.title,
      value,
      formattedValue: `${value}`,
      status: qaStatusToMetricStatus(binding.qa.state),
    };
  }) ?? [];
  const layerAreas = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds])
    .slice(0, MAX_POINTS)
    .map((layerId, index) => ({
      id: layerId,
      label: layerId,
      value: index + 1,
      formattedValue: 'Layer ref',
      status: qaStatusToMetricStatus(binding.qa.state),
    }));
  return {
    id: binding.bindingId,
    kind: 'map',
    label: binding.title,
    description: binding.description,
    unit: 'reference',
    areas: areas.length > 0 ? areas : layerAreas,
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function createComparisonBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardComparisonBinding {
  return {
    id: binding.bindingId,
    kind: 'comparison',
    label: binding.title,
    description: binding.description,
    primaryLabel: 'Baseline',
    secondaryLabel: 'Scenario',
    items: comparisonItemsFromChartOutputs(run?.chartOutputs ?? []),
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function createTextBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
  tags: DashboardTemplateId[],
  scenarioComparison: UrbanScenarioComparison | null,
): DashboardTextBinding {
  const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
  const limitations = unique([...binding.qa.limitations, ...runtimeLimitations(manifest)]);
  return {
    id: binding.bindingId,
    kind: 'text',
    label: binding.title,
    description: binding.description,
    headline: binding.title,
    paragraphs: [
      clip(run?.paragraphFull ?? run?.paragraph ?? artifact.summary ?? 'Reference-only Urban evidence binding.'),
      `QA state: ${binding.qa.state}. Refresh mode: ${binding.refreshMode}.`,
      limitations.length > 0
        ? `Limitations: ${limitations.join(' ')}`
        : 'No artifact-specific limitations are recorded; this does not imply external validation.',
    ],
    highlights: [
      `Artifact: ${artifact.id}`,
      ...(binding.runId ? [`Run: ${binding.runId}`] : []),
      layerIds.length > 0 ? `${layerIds.length} layer ref(s)` : 'No layer refs',
    ],
    updatedAt: binding.provenance.generatedAt,
    tags,
    traceability: buildTraceability(binding, artifact, manifest, scenarioComparison),
  };
}

function toDashboardBinding(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
  run: CompletedAnalysisRun | null | undefined,
  manifest: UrbanWorkflowRunManifest | null | undefined,
): DashboardBinding {
  const tags = flowTags(binding.provenance.flowId);
  const scenarioComparison = extractUrbanScenarioComparison(run);
  switch (binding.bindingKind) {
    case 'metric':
      return createMetricBinding(binding, artifact, manifest, tags, scenarioComparison);
    case 'series':
      return createSeriesBinding(binding, artifact, run, manifest, tags, scenarioComparison);
    case 'table':
      return createTableBinding(binding, artifact, run, manifest, tags, scenarioComparison);
    case 'map':
      return createMapBinding(binding, artifact, run, manifest, tags, scenarioComparison);
    case 'comparison':
      return createComparisonBinding(binding, artifact, run, manifest, tags, scenarioComparison);
    case 'text':
    case 'live':
    default:
      return createTextBinding(binding, artifact, run, manifest, tags, scenarioComparison);
  }
}

export function getUrbanDashboardBindingEligibility(
  artifact: UrbanEvidenceArtifact,
  run?: CompletedAnalysisRun | null,
): UrbanDashboardBindingEligibility {
  if (artifact.dashboardBindingId) {
    const existing = getDashboardBinding(artifact.dashboardBindingId);
    if (existing) {
      return {
        eligible: true,
        reason: null,
        existingBindingId: existing.id,
        existingWidgetType: dashboardWidgetType(widgetTypeForBindingKind(existing.kind)),
      };
    }
  }

  if (artifact.kind === 'indicator') {
    return { eligible: true, reason: null };
  }

  if (artifact.kind === 'workflow-run') {
    if (!artifact.linkedRunId) {
      return { eligible: false, reason: 'No workflow run ID is linked to this artifact.' };
    }
    if (!run) {
      return { eligible: false, reason: `Run ${artifact.linkedRunId} is not registered in the workflow store.` };
    }
    return { eligible: true, reason: null };
  }

  if (artifact.kind === 'map-layer') {
    const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
    return layerIds.length > 0
      ? { eligible: true, reason: null }
      : { eligible: false, reason: 'No map layer reference is linked to this artifact.' };
  }

  return {
    eligible: false,
    reason: 'Dashboard bindings are available for indicator, workflow-run, and map-layer evidence artifacts.',
  };
}

export function buildUrbanDashboardBinding(input: BuildUrbanDashboardBindingInput): UrbanDashboardBinding {
  const artifact = input.artifact;
  const generatedAt = input.generatedAt ?? now();
  const run = input.run ?? null;
  const manifest = input.manifest ?? null;
  const scenarioComparison = extractUrbanScenarioComparison(run);
  const runId = run?.runId ?? artifact.linkedRunId ?? artifact.provenance.runId ?? manifest?.runId ?? null;
  const bindingKind = determineBindingKind(artifact, run);
  const widgetType = widgetTypeForBindingKind(bindingKind);
  const indicatorKind = artifact.indicatorKind ?? null;
  const flowId = artifact.flowId ?? artifact.provenance.flowId ?? run?.flowId ?? manifest?.flowId ?? null;
  const methodName = artifact.provenance.methodName
    ?? (indicatorKind ? getIndicatorDefinition(indicatorKind)?.title : null)
    ?? null;
  const layerIds = unique([...artifact.linkedLayerIds, ...artifact.provenance.layerIds]);
  const filePaths = unique([...artifact.linkedFilePaths, ...artifact.provenance.filePaths]);
  const refreshMode: UrbanDashboardRefreshMode = 'static';
  const runtimeNotes = runtimeLimitations(manifest);
  const scenarioLimitations = scenarioComparison ? buildUrbanScenarioLimitationNotes(scenarioComparison) : [];

  return {
    bindingId: dashboardBindingIdFor(artifact, bindingKind, runId),
    artifactId: artifact.id,
    indicatorKind,
    runId,
    widgetType,
    bindingKind,
    refreshMode,
    title: `${artifact.title} Dashboard Binding`,
    description: buildDescription(artifact, manifest, scenarioComparison),
    provenance: {
      sourceModule: artifact.sourceModule,
      contextId: artifact.linkedContextId ?? artifact.provenance.contextId ?? manifest?.contextId ?? null,
      studyAreaId: artifact.linkedStudyAreaId ?? null,
      flowId,
      runId,
      methodId: artifact.provenance.methodId ?? null,
      methodName,
      indicatorKind,
      layerIds,
      filePaths,
      linkedArtifactIds: unique([artifact.id, ...artifact.linkedArtifactIds, ...artifact.provenance.inputArtifactIds]),
      generatedAt,
    },
    qa: {
      state: artifact.qa.state,
      warnings: unique(artifact.qa.warnings),
      limitations: unique([...artifact.qa.limitations, ...runtimeNotes, ...scenarioLimitations]),
    },
    ...(scenarioComparison
      ? { scenarioComparison: buildUrbanScenarioComparisonHandoff(scenarioComparison) }
      : {}),
  };
}

function appendDashboardBindingToManifest(runId: string | null, bindingId: string): void {
  if (!runId) return;
  const flowStore = useFlowStore.getState();
  const manifest = flowStore.lookupManifest(runId);
  if (!manifest || manifest.dashboardBindingIds.includes(bindingId)) return;
  flowStore.registerManifest({
    ...manifest,
    dashboardBindingIds: [...manifest.dashboardBindingIds, bindingId],
  });
}

function registerUrbanDashboardBindingEvidence(
  binding: UrbanDashboardBinding,
  artifact: UrbanEvidenceArtifact,
): string {
  const evidenceId = `urban-dashboard-evidence-${binding.bindingId}`;
  const urbanStore = useUrbanContextStore.getState();
  const sourceMetadata = artifact.metadata ?? {};
  urbanStore.updateEvidenceArtifactState(artifact.id, {
    dashboardBindingId: binding.bindingId,
    metadata: {
      ...sourceMetadata,
      lastDashboardBindingId: binding.bindingId,
      lastDashboardBoundAt: binding.provenance.generatedAt,
      dashboardRefreshMode: binding.refreshMode,
      ...(binding.scenarioComparison
        ? {
            lastScenarioComparisonId: binding.scenarioComparison.comparisonId,
            lastScenarioPolicyInterpretationMode: binding.scenarioComparison.policyInterpretationMode,
            lastScenarioGuidanceSummary: binding.scenarioComparison.guidanceSummary,
          }
        : {}),
    },
  });

  urbanStore.registerEvidenceArtifact({
    id: evidenceId,
    kind: 'dashboard-binding',
    title: `Dashboard binding: ${artifact.title}`,
    summary: `Static dashboard binding generated from ${artifact.title}; Dashboard Builder owns widget placement.`,
    state: 'active',
    sourceModule: 'dashboard',
    sourceId: binding.bindingId,
    ...(binding.provenance.contextId ? { linkedContextId: binding.provenance.contextId } : {}),
    ...(binding.provenance.studyAreaId ? { linkedStudyAreaId: binding.provenance.studyAreaId } : {}),
    ...(binding.runId ? { linkedRunId: binding.runId } : {}),
    linkedLayerIds: binding.provenance.layerIds,
    linkedFilePaths: binding.provenance.filePaths,
    linkedArtifactIds: unique([artifact.id, ...binding.provenance.linkedArtifactIds]),
    ...(binding.provenance.flowId ? { flowId: binding.provenance.flowId } : {}),
    ...(binding.indicatorKind ? { indicatorKind: binding.indicatorKind } : {}),
    dashboardBindingId: binding.bindingId,
    tags: ['data_engineering', 'indicators'],
    provenance: {
      sourceModule: 'dashboard',
      createdAt: binding.provenance.generatedAt,
      sourceId: binding.bindingId,
      sourceTitle: binding.title,
      ...(binding.provenance.contextId ? { contextId: binding.provenance.contextId } : {}),
      ...(binding.runId ? { runId: binding.runId } : {}),
      ...(binding.provenance.flowId ? { flowId: binding.provenance.flowId } : {}),
      ...(binding.provenance.methodId ? { methodId: binding.provenance.methodId } : {}),
      ...(binding.provenance.methodName ? { methodName: binding.provenance.methodName } : {}),
      layerIds: binding.provenance.layerIds,
      filePaths: binding.provenance.filePaths,
      inputArtifactIds: [artifact.id],
      parentArtifactIds: [artifact.id],
      notes: 'Urban dashboard binding descriptor generated from evidence metadata; no raw dataset or geometry payload is embedded.',
    },
    qa: {
      state: binding.qa.state,
      warnings: binding.qa.warnings,
      limitations: binding.qa.limitations,
    },
    metadata: {
      dashboardBindingId: binding.bindingId,
      sourceEvidenceArtifactId: binding.artifactId,
      widgetType: binding.widgetType,
      bindingKind: binding.bindingKind,
      refreshMode: binding.refreshMode,
      runId: scalarMetadata(binding.runId),
      indicatorKind: scalarMetadata(binding.indicatorKind),
      scenarioComparisonId: scalarMetadata(binding.scenarioComparison?.comparisonId),
      scenarioPolicyInterpretationMode: scalarMetadata(binding.scenarioComparison?.policyInterpretationMode),
      scenarioGuidanceSummary: scalarMetadata(binding.scenarioComparison?.guidanceSummary),
      scenarioCandidateCount: binding.scenarioComparison?.candidateCount ?? null,
      scenarioIndicatorCount: binding.scenarioComparison?.indicatorCount ?? null,
    },
  });

  return evidenceId;
}

export function enqueueUrbanDashboardBinding(
  input: BuildUrbanDashboardBindingInput,
): EnqueueUrbanDashboardBindingResult {
  const eligibility = getUrbanDashboardBindingEligibility(input.artifact, input.run ?? null);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? 'Dashboard binding is not eligible for this artifact.');
  }

  const binding = buildUrbanDashboardBinding(input);
  const dashboardBinding = toDashboardBinding(binding, input.artifact, input.run ?? null, input.manifest ?? null);
  if (!registerDashboardBinding(dashboardBinding)) {
    throw new Error('Dashboard binding registry rejected the Urban binding descriptor.');
  }
  if (!queuePendingDashboardBinding({
    bindingId: binding.bindingId,
    widgetType: dashboardWidgetType(binding.widgetType),
  })) {
    throw new Error('Dashboard pending binding queue is unavailable.');
  }

  const evidenceArtifactId = registerUrbanDashboardBindingEvidence(binding, input.artifact);
  appendDashboardBindingToManifest(binding.runId, binding.bindingId);

  return {
    binding,
    dashboardBinding,
    evidenceArtifactId,
    queued: true,
  };
}
