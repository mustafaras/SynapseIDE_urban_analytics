// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useUrbanStore } from '../store';
import { useUrbanContextStore } from '../useUrbanContextStore';
import {
  _uninstallUrbanIdeArtifactReceiverForTesting,
  classifyUrbanIdeArtifact,
  getLastUrbanIdeArtifactEvent,
  installUrbanIdeArtifactReceiver,
  isUrbanIdeArtifactReceiverInstalled,
  recognizeUrbanIdeArtifact,
} from '../context/ideArtifactRecognition';

function resetUrbanStores(): void {
  localStorage.clear();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useUrbanStore.setState(useUrbanStore.getInitialState());
}

describe('IDE artifact recognition', () => {
  beforeEach(() => {
    _uninstallUrbanIdeArtifactReceiverForTesting();
    synapseBus._resetForTesting();
    resetUrbanStores();
  });

  afterEach(() => {
    _uninstallUrbanIdeArtifactReceiverForTesting();
  });

  it('classifies supported Urban IDE file references without reading editor buffers', () => {
    expect(classifyUrbanIdeArtifact({ filePath: 'outputs/run.urban.json' })).toMatchObject({
      status: 'recognized',
      artifactKind: 'urban-manifest',
      language: 'json',
    });
    expect(classifyUrbanIdeArtifact({ filePath: 'layers/buildings.geojson' })).toMatchObject({
      status: 'recognized',
      artifactKind: 'geojson-layer',
      language: 'geojson',
    });
    expect(classifyUrbanIdeArtifact({ filePath: 'notebooks/audit.ipynb' })).toMatchObject({
      status: 'recognized',
      artifactKind: 'notebook',
      language: 'ipynb',
    });
    expect(classifyUrbanIdeArtifact({ filePath: 'sql/accessibility.sql' })).toMatchObject({
      status: 'recognized',
      artifactKind: 'sql-query',
      language: 'sql',
    });
  });

  it('registers a workflow manifest reference, updates safe context refs, and surfaces runtime warnings', () => {
    const result = recognizeUrbanIdeArtifact({
      filePath: 'outputs/walkability_run.urban.json',
      language: 'json',
      manifestMetadata: {
        schemaVersion: '1.0',
        contextId: 'ctx-from-manifest',
        runId: 'run-walk-001',
        flowId: 'walkability',
        methodId: 'walkability_v2',
        methodName: 'Walkability Composite Indicator',
        runtimeMode: 'demo',
        studyAreaId: 'manual:kadikoy',
        studyAreaName: 'Kadikoy',
        layerIds: ['streets-layer', 'amenities-layer'],
        codeArtifactIds: ['urban-code-python-walkability-001'],
        evidenceIds: ['fitness-artifact-001'],
      },
      sourceModule: 'synapse-ide',
      title: 'Walkability run manifest',
    });

    expect(result.ok).toBe(true);
    expect(result.artifactKind).toBe('urban-manifest');
    expect(result.recommendations.some((entry) => entry.targetId === 'walkability')).toBe(true);
    expect(result.warnings.join(' ')).toContain('demo');

    const context = useUrbanContextStore.getState().context;
    expect(context).not.toBeNull();
    expect(context?.studyAreaId).toBe('manual:kadikoy');
    expect(context?.studyAreaName).toBe('Kadikoy');
    expect(context?.activeRunId).toBe('run-walk-001');
    expect(context?.activeFlowId).toBe('walkability');
    expect(context?.activeLayerIds).toEqual(['streets-layer', 'amenities-layer']);
    expect(context?.activeCodeArtifactId).toBe('urban-code-python-walkability-001');
    expect(useUrbanStore.getState().recMode).toBe(true);

    const artifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.id === result.evidenceArtifactId,
    );
    expect(artifact).toBeDefined();
    expect(artifact?.kind).toBe('workflow-run');
    expect(artifact?.sourceModule).toBe('synapse-ide');
    expect(artifact?.linkedFilePaths).toEqual(['outputs/walkability_run.urban.json']);
    expect(artifact?.linkedRunId).toBe('run-walk-001');
    expect(artifact?.linkedLayerIds).toEqual(['streets-layer', 'amenities-layer']);
    expect(artifact?.metadata?.manifestContextId).toBe('ctx-from-manifest');
    expect(artifact?.qa.state).toBe('warning');
    expect(artifact?.qa.warnings.join(' ')).toContain('demo');
  });

  it('registers GeoJSON file references as unvalidated dataset evidence with layer refs only', () => {
    const result = recognizeUrbanIdeArtifact({
      filePath: 'data/building_footprints.geojson',
      relatedLayerIds: ['ide-layer-building-footprints'],
      sourceModule: 'synapse-ide',
      title: 'Building footprints',
      sizeBytes: 12048,
    });

    expect(result.ok).toBe(true);
    expect(result.artifactKind).toBe('geojson-layer');
    expect(result.recommendations.some((entry) => entry.id === 'workflow:review:geojson')).toBe(true);

    const context = useUrbanContextStore.getState().context;
    expect(context?.activeLayerIds).toEqual(['ide-layer-building-footprints']);

    const artifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.id === result.evidenceArtifactId,
    );
    expect(artifact?.kind).toBe('dataset');
    expect(artifact?.linkedLayerIds).toEqual(['ide-layer-building-footprints']);
    expect(artifact?.linkedFilePaths).toEqual(['data/building_footprints.geojson']);
    expect(artifact?.metadata?.sizeBytes).toBe(12048);
    expect(artifact?.qa.limitations.join(' ')).toContain('Map Explorer must validate GeoJSON');
  });

  it('labels unsupported and invalid references truthfully without registering evidence', () => {
    const unsupported = recognizeUrbanIdeArtifact({ filePath: 'notes/readme.txt' });
    expect(unsupported.ok).toBe(false);
    expect(unsupported.status).toBe('unsupported');
    expect(unsupported.reason).toContain('Unsupported');

    const invalid = recognizeUrbanIdeArtifact({ filePath: '' });
    expect(invalid.ok).toBe(false);
    expect(invalid.status).toBe('invalid');

    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(0);
  });

  it('receives existing IDE evidence.artifact.register events and converts them into Urban evidence', () => {
    expect(isUrbanIdeArtifactReceiverInstalled()).toBe(false);
    expect(installUrbanIdeArtifactReceiver()).toBe(true);
    expect(installUrbanIdeArtifactReceiver()).toBe(false);

    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'ide-artifact-script-001',
      artifactType: 'code',
      sourceModule: 'ide',
      source: 'ide',
      title: 'Accessibility script',
      summary: 'Script reference sent from Synapse IDE.',
      relatedFilePaths: ['analysis/accessibility_service_area.py'],
      relatedRunIds: ['run-access-001'],
      relatedLayerIds: ['streets-layer'],
      language: 'python',
      artifactKind: 'python-script',
      requestedAt: busTimestamp(),
    });

    const event = getLastUrbanIdeArtifactEvent();
    expect(event?.result.ok).toBe(true);
    expect(event?.result.artifactKind).toBe('python-script');

    const context = useUrbanContextStore.getState().context;
    expect(context?.activeRunId).toBe('run-access-001');
    expect(context?.activeLayerIds).toEqual(['streets-layer']);
    expect(context?.activeCodeArtifactId).toMatch(/^ide-code-/);

    const artifact = useUrbanContextStore.getState().evidenceArtifacts.find((entry) =>
      entry.linkedFilePaths.includes('analysis/accessibility_service_area.py'),
    );
    expect(artifact?.kind).toBe('code-artifact');
    expect(artifact?.linkedArtifactIds).toContain('ide-artifact-script-001');
    expect(artifact?.metadata?.language).toBe('python');
  });
});
