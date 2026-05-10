// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createUrbanEvidenceArtifact,
  createUrbanEvidenceArtifactFromCompletedRun,
  selectUrbanEvidenceArtifactsByContext,
  selectUrbanEvidenceArtifactsByKind,
  selectUrbanEvidenceArtifactsByRun,
  selectUrbanEvidenceArtifactsBySourceModule,
} from '../context/evidenceArtifacts';
import { useUrbanContextStore } from '../useUrbanContextStore';
import type { CompletedAnalysisRun } from '../lib/types';

function resetStore() {
  localStorage.clear();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
}

function makeCompletedRun(): CompletedAnalysisRun {
  return {
    runId: 'run-access-001',
    flowId: 'accessibility',
    label: 'Transit accessibility gap run',
    insertedAt: '2026-05-07T10:00:00.000Z',
    paragraph: 'Full analytical narrative.',
    paragraphPreview: 'Transit accessibility gaps were screened.',
    paragraphFull: 'Full analytical narrative.',
    mapOutputs: [
      {
        id: 'analysis-layer-001',
        type: 'choropleth',
        title: 'Transit gap choropleth',
        geojson: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { name: 'heavy-payload' }, geometry: null },
          ],
        },
        engineBridge: {
          domain: 'spatial-stats',
          engine: 'GlobalMoransI',
          runTimestamp: '2026-05-07T10:00:00.000Z',
          parameters: { k: 8 },
          statisticalSummary: { moranI: 0.42 },
          sourceLayerIds: ['source-layer-001'],
          visualization: {
            kind: 'choropleth',
            title: 'Transit gap choropleth',
          },
        },
      },
    ],
    chartOutputs: [
      {
        id: 'chart-001',
        type: 'bar',
        title: 'Access by district',
        data: [{ district: 'A', value: 1 }],
      },
    ],
    dataOutputs: [
      {
        id: 'table-001',
        format: 'json',
        rows: 1,
        columns: ['district', 'value'],
        preview: [{ district: 'A', value: 1 }],
      },
    ],
  };
}

beforeEach(resetStore);

describe('Urban evidence artifact helpers', () => {
  it('normalizes a lightweight evidence artifact with stable identity and provenance', () => {
    const artifact = createUrbanEvidenceArtifact({
      id: 'artifact-indicator-001',
      kind: 'indicator',
      title: 'Walk score result',
      sourceModule: 'urban-analytics',
      sourceId: 'indicator-result-001',
      linkedContextId: 'ctx-001',
      linkedLayerIds: ['layer-1', 'layer-1', 'layer-2'],
      indicatorKind: 'walk_score',
      qa: {
        state: 'warning',
        confidence: 1.4,
        warnings: ['Input network has missing sidewalks.'],
        limitations: ['Screening indicator only.'],
      },
      createdAt: '2026-05-07T10:00:00.000Z',
    });

    expect(artifact.id).toBe('artifact-indicator-001');
    expect(artifact.artifactId).toBe('artifact-indicator-001');
    expect(artifact.linkedLayerIds).toEqual(['layer-1', 'layer-2']);
    expect(artifact.provenance.contextId).toBe('ctx-001');
    expect(artifact.qa.confidence).toBe(1);
    expect(artifact.metadata).toBeUndefined();
  });

  it('creates a completed-run compatibility artifact without copying heavy outputs', () => {
    const artifact = createUrbanEvidenceArtifactFromCompletedRun(makeCompletedRun(), {
      contextId: 'ctx-run',
      studyAreaId: 'study-istanbul',
    });
    const serialized = JSON.stringify(artifact);

    expect(artifact.kind).toBe('workflow-run');
    expect(artifact.linkedRunId).toBe('run-access-001');
    expect(artifact.linkedContextId).toBe('ctx-run');
    expect(artifact.linkedStudyAreaId).toBe('study-istanbul');
    expect(artifact.linkedLayerIds).toEqual(['analysis-layer-001', 'source-layer-001']);
    expect(artifact.metadata).toEqual({
      mapOutputCount: 1,
      chartOutputCount: 1,
      dataOutputCount: 1,
    });
    expect(serialized).not.toContain('FeatureCollection');
    expect(serialized).not.toContain('heavy-payload');
    expect(serialized).not.toContain('preview');
  });
});

describe('Urban evidence registry store actions', () => {
  it('registers, links, and marks stale or invalid evidence truthfully', () => {
    const artifact = useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-map-001',
      kind: 'map-layer',
      title: 'Heat island layer',
      sourceModule: 'map-explorer',
      mapLayerId: 'layer-heat-001',
      createdAt: '2026-05-07T10:00:00.000Z',
    });

    useUrbanContextStore.getState().createContext({ activeQuestion: 'Where are heat risks?' });
    const contextId = useUrbanContextStore.getState().context?.contextId;
    const linked = useUrbanContextStore.getState().linkEvidenceArtifactToContext(artifact.id);

    expect(linked?.linkedContextId).toBe(contextId);
    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(1);

    const stale = useUrbanContextStore
      .getState()
      .markEvidenceArtifactStale(artifact.id, 'Source layer was updated after registration.');

    expect(stale?.state).toBe('stale');
    expect(stale?.qa.state).toBe('stale');
    expect(stale?.qa.warnings).toContain('Source layer was updated after registration.');

    const invalid = useUrbanContextStore
      .getState()
      .markEvidenceArtifactInvalid(artifact.id, 'Referenced layer no longer exists.');

    expect(invalid?.state).toBe('invalid');
    expect(invalid?.qa.state).toBe('invalid');
    expect(invalid?.qa.invalidReason).toBe('Referenced layer no longer exists.');
  });

  it('selects evidence by context, run, kind, and source module', () => {
    const first = useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-run-older',
      kind: 'workflow-run',
      title: 'Older run',
      sourceModule: 'urban-analytics',
      linkedContextId: 'ctx-1',
      linkedRunId: 'run-1',
      createdAt: '2026-05-07T10:00:00.000Z',
      updatedAt: '2026-05-07T10:00:00.000Z',
    });
    const second = useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-run-newer',
      kind: 'workflow-run',
      title: 'Newer run',
      sourceModule: 'urban-analytics',
      linkedContextId: 'ctx-1',
      linkedRunId: 'run-1',
      createdAt: '2026-05-07T11:00:00.000Z',
      updatedAt: '2026-05-07T11:00:00.000Z',
    });
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: 'artifact-code',
      kind: 'code-artifact',
      title: 'Generated notebook',
      sourceModule: 'synapse-ide',
      linkedContextId: 'ctx-2',
      linkedRunId: 'run-2',
      createdAt: '2026-05-07T12:00:00.000Z',
      updatedAt: '2026-05-07T12:00:00.000Z',
    });
    const artifacts = useUrbanContextStore.getState().evidenceArtifacts;

    expect(selectUrbanEvidenceArtifactsByContext(artifacts, 'ctx-1').map((a) => a.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(selectUrbanEvidenceArtifactsByRun(artifacts, 'run-1').map((a) => a.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(selectUrbanEvidenceArtifactsByKind(artifacts, 'code-artifact').map((a) => a.id)).toEqual([
      'artifact-code',
    ]);
    expect(selectUrbanEvidenceArtifactsBySourceModule(artifacts, 'synapse-ide').map((a) => a.id)).toEqual([
      'artifact-code',
    ]);
  });
});
