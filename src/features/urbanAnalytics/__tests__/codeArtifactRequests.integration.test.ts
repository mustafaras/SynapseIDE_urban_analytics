// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useFlowStore } from '@/stores/useFlowStore';

import {
  buildJsonManifestRequest,
  buildPythonScriptRequest,
  dispatchUrbanCodeArtifactRequest,
  type UrbanCodeArtifactSeed,
} from '../context/codeArtifactRequests';
import { useUrbanContextStore } from '../useUrbanContextStore';

const FIXED_TIME = new Date('2026-05-09T08:30:00.000Z');

function baseSeed(overrides: Partial<UrbanCodeArtifactSeed> = {}): UrbanCodeArtifactSeed {
  return {
    methodName: 'Walkability Composite Indicator',
    methodId: 'walkability_v2',
    methodSlug: 'walkability_composite',
    flowId: 'walkability',
    contextId: 'ctx-bridge-1',
    studyAreaId: 'manual:kadikoy',
    studyAreaName: 'Kadikoy',
    studyAreaBounds: [28.97, 40.96, 29.09, 41.02],
    inputDescriptors: ['layer:streets', 'dataset:amenities'],
    parameters: { threshold_minutes: 15, mode: 'walking' },
    assumptions: ['Pedestrian network is connected.'],
    limitations: ['Generated integration-test scaffold; validate CRS before measurement.'],
    citations: ['Lee, A. (2024). Walkability indices.'],
    timestamp: FIXED_TIME,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useEditorStore.setState({
    tabs: [],
    activeTabId: null,
    history: {},
  });
  useFileExplorerStore.setState({
    files: [],
    selectedFiles: [],
    expandedFolders: [],
    draggedNode: null,
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useUrbanContextStore.getState().createContext({
    studyAreaName: 'Kadikoy',
    studyAreaId: 'manual:kadikoy',
    studyAreaBounds: [28.97, 40.96, 29.09, 41.02],
  });
  useFlowStore.setState({
    activeFlow: null,
    currentStep: 0,
    stepData: {},
    completedRuns: [],
    manifests: {},
  });
});

describe('dispatchUrbanCodeArtifactRequest integration', () => {
  it('routes Python requests through the real editor bridge into editor and file explorer stores', async () => {
    const request = buildPythonScriptRequest(baseSeed());
    const result = await dispatchUrbanCodeArtifactRequest(request);

    const tab = useEditorStore.getState().tabs.find((entry) => entry.name === request.targetFilename);
    expect(tab).toBeTruthy();
    expect(tab?.content).toBe(request.content);
    expect(tab?.language).toBe('python');

    const file = useFileExplorerStore.getState().getFileByPath(request.targetFilename);
    expect(file).toBeTruthy();
    expect(file?.content).toBe(request.content);

    const codeArtifacts = useUrbanContextStore.getState().evidenceArtifacts.filter((artifact) =>
      artifact.kind === 'code-artifact',
    );
    expect(codeArtifacts).toHaveLength(1);
    expect(codeArtifacts[0]?.metadata?.bridgeTabId).toBe(tab?.id);
    expect(result.tabId).toBe(tab?.id);
    expect(result.bridgeRouted).toBe(true);
  });

  it('routes JSON manifest requests as json editor tabs', async () => {
    const request = buildJsonManifestRequest(baseSeed());
    await dispatchUrbanCodeArtifactRequest(request);

    const tab = useEditorStore.getState().tabs.find((entry) => entry.name === request.targetFilename);
    expect(tab).toBeTruthy();
    expect(tab?.content).toBe(request.content);
    expect(tab?.language).toBe('json');

    const file = useFileExplorerStore.getState().getFileByPath(request.targetFilename);
    expect(file).toBeTruthy();
  });
});
