// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildScenarioComparisonResult,
  DEFAULT_SCENARIO_COMPARISON_FORM,
} from '@/centerpanel/Flows/scenarioComparisonShared';
import { buildScenarioComparisonCompletedRun } from '@/centerpanel/Flows/scenarioComparisonArtifacts';
import { compileReport } from '@/services/reporting/ReportEngine';
import {
  createDefaultReportDocument,
  drainPendingInserts,
  mergePendingInserts,
} from '@/services/reporting/storage';
import { useFlowStore } from '@/stores/useFlowStore';

import {
  buildUrbanReportEvidenceBlock,
  enqueueUrbanMethodCardReportBlock,
  enqueueUrbanReportEvidenceBlock,
} from '../context/reportArtifactBuilder';
import { requireUrbanMethodValidityEnvelopePreset } from '../context/methodValidity';
import type {
  AnalyticalFlowId,
  Card,
  CompletedAnalysisRun,
  MapOutput,
  UrbanEvidenceArtifact,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import { useUrbanContextStore } from '../useUrbanContextStore';

const FLOW_ID = 'indicator_composite' as AnalyticalFlowId;
const INSERTED_AT = '2026-05-09T08:00:00.000Z';

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

function makeMapOutput(): MapOutput {
  return {
    id: 'moran-map-output',
    type: 'choropleth',
    title: 'Moran cluster output',
    geojson: {
      type: 'FeatureCollection',
      features: [],
    },
  };
}

function makeRun(): CompletedAnalysisRun {
  return {
    runId: 'run-report-001',
    flowId: FLOW_ID,
    label: 'Moran spatial autocorrelation run',
    insertedAt: '2026-05-09T07:45:00.000Z',
    paragraph: 'Moran run completed.',
    paragraphPreview: 'Moran run completed for district zones.',
    paragraphFull: 'Moran run completed for district zones with an explicit spatial weights matrix.',
    mapOutputs: [makeMapOutput()],
    chartOutputs: [],
    dataOutputs: [],
  };
}

function makeCard(): Card {
  const validityEnvelope = requireUrbanMethodValidityEnvelopePreset('card:ss-morans-i');
  return {
    id: 'ss-morans-i',
    title: "Global Moran's I",
    sectionId: 'spatial_stats',
    summary: 'Measure global spatial autocorrelation for a numeric indicator.',
    tags: ['spatial_stats'],
    methodology: 'Compute a global autocorrelation statistic against a declared spatial weights matrix.',
    datasets: ['Polygon zones with numeric indicator'],
    tools: ['PySAL', 'GeoPandas'],
    evidence: ['Moran, P. A. P. (1950). Notes on continuous stochastic phenomena.'],
    prompts: ['print("moran")'],
    limitations: 'Interpretation depends on spatial weights and aggregation units.',
    validityEnvelope,
    capabilityStatus: validityEnvelope.capabilityStatus,
  };
}

function makeManifest(
  contextId: string,
  runtimeMode: UrbanWorkflowRunManifest['runtimeMode'] = 'live',
): UrbanWorkflowRunManifest {
  return {
    runId: 'run-report-001',
    flowId: FLOW_ID,
    contextId,
    inputs: {
      zoneLayerId: 'layer-zones',
      valueField: 'heat_index',
    },
    parameters: {
      weights: 'queen-contiguity',
      permutations: 999,
    },
    methodValidity: requireUrbanMethodValidityEnvelopePreset('card:ss-morans-i'),
    dataFitness: null,
    mapArtifactIds: ['artifact-moran-layer'],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode,
    readiness: null,
    createdAt: '2026-05-09T07:40:00.000Z',
  };
}

function createContext(): string {
  useUrbanContextStore.getState().createContext({
    studyAreaId: 'istanbul-report-study',
    studyAreaName: 'Istanbul report study',
    activeLayerIds: ['layer-zones'],
    activeFlowId: FLOW_ID,
    activeRunId: 'run-report-001',
  });
  const contextId = useUrbanContextStore.getState().context?.contextId;
  if (!contextId) throw new Error('Expected test context.');
  return contextId;
}

function registerWorkflowEvidence(contextId: string): UrbanEvidenceArtifact {
  return useUrbanContextStore.getState().registerEvidenceArtifact({
    id: 'artifact-moran-run',
    kind: 'workflow-run',
    title: 'Moran run evidence',
    summary: 'Workflow output reference for a Moran spatial autocorrelation run.',
    state: 'active',
    sourceModule: 'urban-analytics',
    sourceId: 'run-report-001',
    linkedContextId: contextId,
    linkedStudyAreaId: 'istanbul-report-study',
    linkedRunId: 'run-report-001',
    linkedLayerIds: ['layer-zones'],
    mapLayerId: 'layer-zones',
    flowId: FLOW_ID,
    provenance: {
      runId: 'run-report-001',
      flowId: FLOW_ID,
      methodId: 'ss-morans-i',
      methodName: "Global Moran's I",
      layerIds: ['layer-zones'],
      notes: 'Weights and permutation settings are stored in the run manifest.',
    },
    qa: {
      state: 'warning',
      confidence: 0.82,
      warnings: ['Review spatial weights before publication.'],
      limitations: ['Fixture evidence stores references only, not raw geometry.'],
    },
    createdAt: '2026-05-09T07:50:00.000Z',
    updatedAt: '2026-05-09T07:55:00.000Z',
  });
}

beforeEach(() => {
  resetStores();
});

describe('Urban report artifact builder', () => {
  it('builds report-ready evidence blocks with provenance, QA, assumptions, limitations, and figure references', () => {
    const contextId = createContext();
    const artifact = registerWorkflowEvidence(contextId);
    const run = makeRun();
    const manifest = makeManifest(contextId, 'synthetic');
    const card = makeCard();

    const block = buildUrbanReportEvidenceBlock({
      artifact,
      run,
      manifest,
      methodCard: card,
      methodSummary: 'Explicit Moran method summary for the report.',
      citationNotes: ['Istanbul open data catalog metadata.'],
      insertedAt: INSERTED_AT,
    });

    expect(block.reportInsertId).toMatch(/^urban-report-/);
    expect(block.artifactId).toBe(artifact.id);
    expect(block.runId).toBe(run.runId);
    expect(block.methodSummary).toBe('Explicit Moran method summary for the report.');
    expect(block.dataSummary).toContain('1 map output(s)');
    expect(block.dataSummary).toContain('Manifest input fields: zoneLayerId, valueField.');
    expect(block.dataSummary).toContain('Declared toolchain: PySAL, GeoPandas.');
    expect(block.qaSummary).toContain('Evidence QA state: warning.');
    expect(block.qaSummary).toContain('Confidence: 82%.');
    expect(block.assumptions.some((item) => item.includes('continuous or ordinal'))).toBe(true);
    expect(block.limitations.some((item) => item.includes('modifiable areal unit problem'))).toBe(true);
    expect(block.limitations.some((item) => item.includes('runtimeMode is synthetic'))).toBe(true);
    expect(block.mapFigureReference?.mapLayerId).toBe('layer-zones');
    expect(block.mapFigureReference?.layerIds).toContain('layer-zones');
    expect(block.citationNotes).toContain('Istanbul open data catalog metadata.');
    expect(block.provenance).toMatchObject({
      contextId,
      studyAreaId: 'istanbul-report-study',
      flowId: FLOW_ID,
      methodId: 'ss-morans-i',
      methodName: "Global Moran's I",
    });
  });

  it('queues pending report inserts, records evidence bindings, and appends the sidecar manifest', () => {
    const contextId = createContext();
    const artifact = registerWorkflowEvidence(contextId);
    const run = makeRun();
    const manifest = makeManifest(contextId, 'live');
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest(manifest);

    const result = enqueueUrbanReportEvidenceBlock({
      artifact,
      run,
      manifest,
      methodCard: makeCard(),
      insertedAt: INSERTED_AT,
    });

    const inserts = drainPendingInserts();
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.id).toBe(result.block.reportInsertId);
    expect(inserts[0]?.sections[0]?.badgeLabel).toBe('Urban evidence block');
    expect(inserts[0]?.sections[1]?.badgeLabel).toBe('Reproducibility block');

    const compiled = compileReport(mergePendingInserts(createDefaultReportDocument(), inserts));
    expect(compiled.markdown).toContain('Moran run evidence - Evidence Block');
    expect(compiled.markdown).toContain('Provenance and QA');
    expect(compiled.markdown).toContain('Limitation: Fixture evidence stores references only, not raw geometry.');

    const sourceArtifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.id === artifact.id,
    );
    expect(sourceArtifact?.reportInsertId).toBe(result.block.reportInsertId);
    expect(sourceArtifact?.metadata?.lastReportInsertId).toBe(result.block.reportInsertId);

    const reportArtifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.kind === 'report-insert' && entry.reportInsertId === result.block.reportInsertId,
    );
    expect(reportArtifact?.linkedArtifactIds).toContain(artifact.id);
    expect(reportArtifact?.metadata?.sourceEvidenceArtifactId).toBe(artifact.id);

    expect(useFlowStore.getState().lookupManifest(run.runId)?.reportInsertIds).toEqual([
      result.block.reportInsertId,
    ]);
  });

  it('carries scenario comparison interpretation metadata as guidance-only report handoff', () => {
    const contextId = createContext();
    const scenarioForm = {
      ...DEFAULT_SCENARIO_COMPARISON_FORM,
      outputTitle: 'Scenario comparison report handoff fixture',
    };
    const scenarioResult = buildScenarioComparisonResult(scenarioForm);
    const run = buildScenarioComparisonCompletedRun(scenarioForm, scenarioResult, {
      runId: 'run-report-scenario-001',
      insertedAt: INSERTED_AT,
    });
    const artifact = useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-scenario-report-run',
      kind: 'workflow-run',
      title: 'Scenario comparison run evidence',
      summary: 'Scenario comparison workflow output reference.',
      state: 'active',
      sourceModule: 'urban-analytics',
      sourceId: run.runId,
      linkedContextId: contextId,
      linkedStudyAreaId: 'istanbul-report-study',
      linkedRunId: run.runId,
      flowId: 'scenario_comparison',
      provenance: {
        runId: run.runId,
        flowId: 'scenario_comparison',
        methodId: 'scenario-comparison',
        methodName: 'Scenario Comparison Workflow',
        layerIds: [],
        notes: 'Scenario outputs are interpreted as guidance-only decision support.',
      },
      qa: {
        state: 'warning',
        warnings: ['Scenario comparison fixture uses a demo baseline.'],
        limitations: ['Do not treat scenario ranking as a guaranteed policy outcome.'],
      },
      createdAt: INSERTED_AT,
      updatedAt: INSERTED_AT,
    });
    const manifest: UrbanWorkflowRunManifest = {
      runId: run.runId,
      flowId: 'scenario_comparison',
      contextId,
      inputs: {},
      parameters: {},
      methodValidity: null,
      dataFitness: null,
      mapArtifactIds: [],
      codeArtifactIds: [],
      reportInsertIds: [],
      dashboardBindingIds: [],
      indicatorResultIds: [],
      runtimeMode: 'demo',
      readiness: null,
      createdAt: INSERTED_AT,
    };

    const block = buildUrbanReportEvidenceBlock({
      artifact,
      run,
      manifest,
      insertedAt: INSERTED_AT,
    });

    expect(block.scenarioComparison?.comparisonId).toBe('run-report-scenario-001-comparison');
    expect(block.scenarioComparison?.policyInterpretationMode).toBe('guidance');
    expect(block.qaSummary).toContain('guidance-only');
    expect(block.dataSummary).toContain('Scenario comparison run-report-scenario-001-comparison references baseline');
    expect(block.limitations.some((item) => item.includes('deterministic scenario abstractions'))).toBe(true);
  });

  it('supports method-card report inserts without analytical output claims', () => {
    const contextId = createContext();
    const card = makeCard();

    const result = enqueueUrbanMethodCardReportBlock({
      card,
      methodSummary: 'Method-card summary only; no run outputs are embedded.',
      citationNotes: ['Moran citation note.'],
      insertedAt: INSERTED_AT,
    });

    const inserts = drainPendingInserts();
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.source).toBe(`urban-evidence:urban-method-card-report-source-${card.id}`);
    expect(result.block.runId).toBeNull();
    expect(result.block.dataSummary).toContain('Layer references: layer-zones.');
    expect(result.block.dataSummary).toContain('Declared dataset requirements: Polygon zones with numeric indicator.');
    expect(result.block.assumptions.some((item) => item.includes('spatial weights matrix'))).toBe(true);
    expect(result.block.limitations.some((item) => item.includes('aggregation units'))).toBe(true);

    const methodSource = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.kind === 'method-card' && entry.cardId === card.id,
    );
    expect(methodSource?.linkedContextId).toBe(contextId);
    expect(methodSource?.linkedLayerIds).toEqual(['layer-zones']);
    expect(methodSource?.reportInsertId).toBe(result.block.reportInsertId);
    expect(useUrbanContextStore.getState().evidenceArtifacts.some((entry) =>
      entry.kind === 'report-insert' && entry.reportInsertId === result.block.reportInsertId,
    )).toBe(true);
  });
});
