// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import { getDashboardBinding } from '@/features/dashboard/dataBindings';
import { consumePendingDashboardBinding } from '@/features/dashboard/storage';
import { createComputedIndicatorRecord } from '../indicators/catalog';
import { upsertComputedIndicatorRecord } from '../indicators/storage';
import { useFlowStore } from '@/stores/useFlowStore';

import {
  buildUrbanDashboardBinding,
  enqueueUrbanDashboardBinding,
  getUrbanDashboardBindingEligibility,
} from '../context/dashboardArtifactBuilder';
import type {
  AnalyticalFlowId,
  ChartOutput,
  CompletedAnalysisRun,
  UrbanEvidenceArtifact,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';

const INSERTED_AT = '2026-05-09T12:00:00.000Z';

function resetStores(): void {
  window.localStorage.clear();
  useFlowStore.setState({
    activeFlow: null,
    currentStep: 0,
    stepData: {},
    completedRuns: [],
    manifests: {},
    step: 0,
    eligible: null,
    contraindications: '',
    baselineNotes: '',
    doseMg: 1,
    route: 'IV',
    effect: 'none',
    adverse: '',
  });
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
}

function createContext(flowId: AnalyticalFlowId = 'indicator_composite'): string {
  useUrbanContextStore.getState().createContext({
    studyAreaId: 'istanbul-dashboard-study',
    studyAreaName: 'Istanbul dashboard study',
    activeLayerIds: ['layer-dashboard-zones'],
    activeFlowId: flowId,
    activeRunId: 'run-dashboard-001',
  });
  const contextId = useUrbanContextStore.getState().context?.contextId;
  if (!contextId) throw new Error('Expected test context.');
  return contextId;
}

function makeChartOutput(id = 'chart-outputs'): ChartOutput {
  return {
    id,
    type: 'bar',
    title: 'Heat exposure trend',
    data: [
      { label: 'North', value: 34 },
      { label: 'East', value: 52 },
      { label: 'South', value: 41 },
    ],
  };
}

function makeRun(flowId: AnalyticalFlowId = 'indicator_composite'): CompletedAnalysisRun {
  return {
    runId: 'run-dashboard-001',
    flowId,
    label: 'Dashboard-ready run',
    insertedAt: INSERTED_AT,
    paragraph: 'Dashboard run completed.',
    paragraphPreview: 'Dashboard run',
    paragraphFull: 'Dashboard run completed with chart outputs and reference-only provenance.',
    mapOutputs: [],
    chartOutputs: [makeChartOutput()],
    dataOutputs: [{
      id: 'table-output',
      format: 'json',
      rows: 24,
      columns: ['district', 'score'],
      preview: [{ district: 'raw-preview-should-not-bind', score: 99 }],
    }],
  };
}

function makeScenarioRun(): CompletedAnalysisRun {
  const comparison = {
    comparisonId: 'run-dashboard-001-comparison',
    runId: 'run-dashboard-001',
    flowId: 'scenario_comparison' as const,
    createdAt: INSERTED_AT,
    baseline: {
      label: 'Baseline',
      runId: null,
      description: 'Fixture baseline',
    },
    candidateRuns: [
      {
        scenarioId: 'scenario-a',
        scenarioName: 'Transit-first package',
        runId: null,
        flowId: null,
        assumptions: ['Fixture assumptions'],
      },
    ],
    indicatorsCompared: [
      {
        indicatorId: 'heat_exposure',
        label: 'Heat exposure',
        unit: 'index',
        direction: 'minimize' as const,
      },
    ],
    deltas: [
      {
        deltaId: 'scenario-a:heat_exposure',
        scenarioId: 'scenario-a',
        indicatorId: 'heat_exposure',
        baselineValue: 72,
        candidateValue: 58,
        absoluteDelta: -14,
        percentDelta: -19.44,
        improvementDelta: 14,
      },
    ],
    uncertaintyNotes: ['Fixture uncertainty note.'],
    policyInterpretation: {
      mode: 'guidance' as const,
      summary: 'Fixture guidance summary.',
      guidance: ['Use as guidance only.'],
      assumptions: ['Fixture assumptions'],
      uncertaintyNotes: ['Fixture uncertainty note.'],
      recommendedFollowUps: ['Validate with local data.'],
    },
    limitations: ['Fixture limitation.'],
    evidence: {
      artifactIds: [],
      mapOutputIds: [],
      chartOutputIds: ['scenario-chart'],
      dataOutputIds: [],
    },
  };

  return {
    ...makeRun('scenario_comparison'),
    chartOutputs: [{
      id: 'scenario-chart',
      type: 'bar',
      title: 'Baseline vs scenario',
      data: [
        { label: 'Heat exposure', baseline: 72, scenario: 58 },
        { label: 'Green deficit', baseline: 44, scenario: 31 },
      ],
      metadata: {
        scenarioComparisonId: comparison.comparisonId,
      },
      scenarioComparison: {
        outputRole: 'chart_parallel',
        comparison,
      },
    }],
  };
}

function makeManifest(
  contextId: string,
  runtimeMode: UrbanWorkflowRunManifest['runtimeMode'] = 'live',
  flowId: AnalyticalFlowId = 'indicator_composite',
): UrbanWorkflowRunManifest {
  return {
    runId: 'run-dashboard-001',
    flowId,
    contextId,
    inputs: {
      sourceLayerId: 'layer-dashboard-zones',
    },
    parameters: {
      classification: 'quantile',
    },
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: [],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode,
    readiness: null,
    createdAt: INSERTED_AT,
  };
}

function registerWorkflowEvidence(contextId: string, run: CompletedAnalysisRun): UrbanEvidenceArtifact {
  return useUrbanContextStore.getState().registerEvidenceArtifact({
    id: 'artifact-dashboard-run',
    kind: 'workflow-run',
    title: 'Dashboard workflow evidence',
    summary: 'Workflow output reference for dashboard binding tests.',
    state: 'active',
    sourceModule: 'urban-analytics',
    sourceId: run.runId,
    linkedContextId: contextId,
    linkedStudyAreaId: 'istanbul-dashboard-study',
    linkedRunId: run.runId,
    linkedLayerIds: ['layer-dashboard-zones'],
    flowId: run.flowId,
    provenance: {
      runId: run.runId,
      flowId: run.flowId,
      methodId: 'indicator_composite',
      methodName: 'Composite indicator workflow',
      layerIds: ['layer-dashboard-zones'],
      notes: 'Dashboard binding carries references only.',
    },
    qa: {
      state: 'warning',
      confidence: 0.7,
      warnings: ['Review run QA before dashboard publication.'],
      limitations: ['Fixture run stores output references only.'],
    },
    createdAt: INSERTED_AT,
    updatedAt: INSERTED_AT,
  });
}

function registerIndicatorEvidence(contextId: string): UrbanEvidenceArtifact {
  return useUrbanContextStore.getState().registerEvidenceArtifact({
    id: 'artifact-dashboard-indicator',
    kind: 'indicator',
    title: 'Building energy intensity indicator',
    summary: 'Computed indicator evidence for dashboard KPI binding.',
    state: 'active',
    sourceModule: 'urban-analytics',
    linkedContextId: contextId,
    linkedStudyAreaId: 'istanbul-dashboard-study',
    indicatorKind: 'buildingEnergyIntensity',
    provenance: {
      methodId: 'indicator:buildingEnergyIntensity',
      methodName: 'Building Energy Intensity',
      layerIds: ['layer-dashboard-zones'],
    },
    qa: {
      state: 'valid',
      warnings: [],
      limitations: ['Indicator fixture is scalar-only.'],
    },
    createdAt: INSERTED_AT,
    updatedAt: INSERTED_AT,
  });
}

beforeEach(() => {
  resetStores();
});

describe('Urban dashboard artifact builder', () => {
  it('queues static workflow-run dashboard bindings with provenance, QA, and manifest linkage', () => {
    const contextId = createContext();
    const run = makeRun();
    const manifest = makeManifest(contextId, 'synthetic');
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest(manifest);
    const artifact = registerWorkflowEvidence(contextId, run);

    const result = enqueueUrbanDashboardBinding({
      artifact,
      run,
      manifest,
      generatedAt: INSERTED_AT,
    });

    expect(result.binding.refreshMode).toBe('static');
    expect(result.binding.widgetType).toBe('chart');
    expect(result.binding.bindingKind).toBe('series');
    expect(result.binding.qa.limitations.some((item) => item.includes('synthetic'))).toBe(true);

    const dashboardBinding = getDashboardBinding(result.binding.bindingId);
    expect(dashboardBinding?.kind).toBe('series');
    expect(dashboardBinding?.traceability).toMatchObject({
      sourceArtifactId: artifact.id,
      sourceRunId: run.runId,
      refreshMode: 'static',
      qaState: 'warning',
    });
    expect(dashboardBinding && 'points' in dashboardBinding ? dashboardBinding.points : []).toHaveLength(3);
    expect(JSON.stringify(dashboardBinding)).not.toContain('raw-preview-should-not-bind');

    expect(consumePendingDashboardBinding()).toEqual({
      bindingId: result.binding.bindingId,
      widgetType: 'chart',
    });

    const sourceArtifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.id === artifact.id);
    expect(sourceArtifact?.dashboardBindingId).toBe(result.binding.bindingId);
    expect(sourceArtifact?.metadata?.lastDashboardBindingId).toBe(result.binding.bindingId);

    const bindingEvidence = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.kind === 'dashboard-binding' && entry.dashboardBindingId === result.binding.bindingId,
    );
    expect(bindingEvidence?.linkedArtifactIds).toContain(artifact.id);
    expect(bindingEvidence?.metadata?.refreshMode).toBe('static');

    expect(useFlowStore.getState().lookupManifest(run.runId)?.dashboardBindingIds).toEqual([
      result.binding.bindingId,
    ]);

    enqueueUrbanDashboardBinding({ artifact, run, manifest, generatedAt: INSERTED_AT });
    expect(useFlowStore.getState().lookupManifest(run.runId)?.dashboardBindingIds).toEqual([
      result.binding.bindingId,
    ]);
  });

  it('builds KPI bindings for computed indicator evidence', () => {
    const contextId = createContext();
    upsertComputedIndicatorRecord(createComputedIndicatorRecord('buildingEnergyIntensity', {
      annualEnergyKWh: 1880000,
      floorAreaM2: 12800,
    }));
    const artifact = registerIndicatorEvidence(contextId);

    const binding = buildUrbanDashboardBinding({
      artifact,
      generatedAt: INSERTED_AT,
    });
    const result = enqueueUrbanDashboardBinding({
      artifact,
      generatedAt: INSERTED_AT,
    });

    expect(binding.indicatorKind).toBe('buildingEnergyIntensity');
    expect(result.binding.widgetType).toBe('kpi');
    const dashboardBinding = getDashboardBinding(result.binding.bindingId);
    expect(dashboardBinding?.kind).toBe('metric');
    expect(dashboardBinding?.traceability?.sourceIndicatorKind).toBe('buildingEnergyIntensity');
    expect(dashboardBinding && 'formattedValue' in dashboardBinding ? dashboardBinding.formattedValue : '').toContain('146.88');
    expect(consumePendingDashboardBinding()?.widgetType).toBe('kpi');
  });

  it('recognizes scenario chart outputs as static comparison bindings when baseline and scenario values are explicit', () => {
    const contextId = createContext('scenario_comparison');
    const run = makeScenarioRun();
    const manifest = makeManifest(contextId, 'demo', 'scenario_comparison');
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest(manifest);
    const artifact = registerWorkflowEvidence(contextId, run);

    const eligibility = getUrbanDashboardBindingEligibility(artifact, run);
    expect(eligibility.eligible).toBe(true);

    const result = enqueueUrbanDashboardBinding({
      artifact,
      run,
      manifest,
      generatedAt: INSERTED_AT,
    });

    expect(result.binding.widgetType).toBe('comparison');
    expect(result.binding.bindingKind).toBe('comparison');
    expect(result.binding.qa.limitations.some((item) => item.includes('demo-mode'))).toBe(true);
    expect(result.binding.description).toContain('guidance-only');
    expect(result.binding.scenarioComparison?.policyInterpretationMode).toBe('guidance');
    expect(result.binding.scenarioComparison?.candidateCount).toBeGreaterThan(0);

    const dashboardBinding = getDashboardBinding(result.binding.bindingId);
    expect(dashboardBinding?.kind).toBe('comparison');
    expect(dashboardBinding?.traceability?.provenanceNotes.some((entry) =>
      entry.includes(result.binding.scenarioComparison?.comparisonId ?? ''),
    )).toBe(true);
    expect(dashboardBinding && 'items' in dashboardBinding ? dashboardBinding.items : []).toEqual([
      { label: 'Heat exposure', primary: 72, secondary: 58 },
      { label: 'Green deficit', primary: 44, secondary: 31 },
    ]);

    const sourceArtifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) => entry.id === artifact.id);
    expect(sourceArtifact?.metadata?.lastScenarioComparisonId).toBe(result.binding.scenarioComparison?.comparisonId);

    const bindingEvidence = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.kind === 'dashboard-binding' && entry.dashboardBindingId === result.binding.bindingId,
    );
    expect(bindingEvidence?.metadata?.scenarioComparisonId).toBe(result.binding.scenarioComparison?.comparisonId);

    expect(consumePendingDashboardBinding()).toEqual({
      bindingId: result.binding.bindingId,
      widgetType: 'comparison',
    });
  });
});
