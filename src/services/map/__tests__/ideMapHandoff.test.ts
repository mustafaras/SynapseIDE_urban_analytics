// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { FileNode } from '@/types/state';
import type { OverlayLayerConfig } from '@/centerpanel/components/map/mapTypes';
import {
  clearSelectionRegistry,
  evaluateIdeMapHandoffEligibility,
  focusRelatedLayer,
  getSelectionReference,
  openInMapExplorer,
  registerSpatialArtifact,
  sendSelectionToMap,
} from '../ideMapHandoff';

function makeSpatialFile(path: string, content: string): FileNode {
  return {
    id: `file-${path}`,
    name: path.split('/').pop() || path,
    type: 'file',
    path,
    content,
    language: 'json',
    semanticStatus: { mapLayerCandidate: true },
    lastModified: new Date(),
    size: content.length,
  };
}

function makeLayer(id: string, name: string): OverlayLayerConfig {
  return {
    id,
    name,
    type: 'geojson',
    visible: true,
    opacity: 1,
    group: 'data',
    sourceKind: 'imported',
    queryable: true,
  };
}

function resetStores(): void {
  useEditorStore.setState({ tabs: [], activeTabId: null });
  useFileExplorerStore.setState({ files: [], selectedFiles: [] });
  useMapExplorerStore.setState({
    isOpen: false,
    overlayLayers: [],
    selectedFeatureIds: {},
    activeAnalysisResultLayerIds: [],
  });
  useSynapseWorkspaceStore.setState({
    workspace: null,
    artifacts: [],
    applyHistoryRefs: [],
    syncState: {
      schemaVersion: '1.0',
      modules: {},
      pendingHandoffIds: [],
      updatedAt: new Date().toISOString(),
    },
    isHydrated: true,
    storageSource: 'memory',
  });
}

describe('ideMapHandoff', () => {
  beforeEach(() => {
    resetStores();
    clearSelectionRegistry();
    synapseBus._resetForTesting();
    vi.restoreAllMocks();
  });

  it('reports disabled eligibility when there is no active tab', () => {
    const eligibility = evaluateIdeMapHandoffEligibility();
    expect(eligibility.canOpenInMapExplorer).toBe(false);
    expect(eligibility.canFocusRelatedLayer).toBe(false);
    expect(eligibility.canSendSelectionToMap).toBe(false);
    expect(eligibility.canRegisterSpatialArtifact).toBe(false);
  });

  it('enables open and register eligibility for active spatial file', () => {
    const node = makeSpatialFile('data/districts.geojson', '{"type":"FeatureCollection","features":[]}');
    useFileExplorerStore.getState().setFiles([node]);
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-1',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content: node.content || '',
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-1',
    });

    const eligibility = evaluateIdeMapHandoffEligibility();
    expect(eligibility.canOpenInMapExplorer).toBe(true);
    expect(eligibility.canRegisterSpatialArtifact).toBe(true);
  });

  it('opens map and emits ide.file.open on handoff', () => {
    const node = makeSpatialFile('data/parcels.geojson', '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[28.97993,41.00858]},"properties":{}}]}');
    useFileExplorerStore.getState().setFiles([node]);
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-2',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content: node.content || '',
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-2',
    });

    const ideFileOpen = vi.fn();
    synapseBus.on('ide.file.open', ideFileOpen);

    const result = openInMapExplorer();

    expect(result.ok).toBe(true);
    expect(useMapExplorerStore.getState().isOpen).toBe(true);
    expect(useMapExplorerStore.getState().center).toEqual([28.97993, 41.00858]);
    expect(ideFileOpen).toHaveBeenCalledOnce();
    expect(ideFileOpen.mock.calls[0][0]).toMatchObject({ path: 'data/parcels.geojson', source: 'ide' });
  });

  it('focuses related layer and emits map.layer.focus', () => {
    const node = makeSpatialFile('data/roads.geojson', '{"type":"FeatureCollection","features":[]}');
    const layer = makeLayer('layer-roads', 'Roads');
    useFileExplorerStore.getState().setFiles([node]);
    useMapExplorerStore.setState({ overlayLayers: [layer] });
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-3',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content: node.content || '',
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-3',
    });

    const mapFocus = vi.fn();
    synapseBus.on('map.layer.focus', mapFocus);

    const result = focusRelatedLayer();
    expect(result.ok).toBe(true);
    expect(useMapExplorerStore.getState().activeAnalysisResultLayerIds).toEqual(['layer-roads']);
    expect(mapFocus).toHaveBeenCalledOnce();
    expect(mapFocus.mock.calls[0][0]).toMatchObject({ layerId: 'layer-roads', source: 'ide' });
  });

  it('materializes a related layer from active spatial file when none exists', () => {
    const content = '{"type":"FeatureCollection","features":[{"type":"Feature","id":"zone-1","geometry":{"type":"Point","coordinates":[29,41]},"properties":{}}]}';
    const node = makeSpatialFile('data/materialize.geojson', content);

    useFileExplorerStore.getState().setFiles([node]);
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-materialize',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content,
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-materialize',
    });

    const result = focusRelatedLayer();
    expect(result.ok).toBe(true);

    const layer = useMapExplorerStore
      .getState()
      .overlayLayers
      .find((entry) => entry.name === 'materialize.geojson');
    expect(layer).toBeTruthy();
    expect(useMapExplorerStore.getState().activeAnalysisResultLayerIds).toEqual([layer?.id]);
  });

  it('sends selection reference to map and stores retrievable selection metadata', () => {
    const content = '{"type":"FeatureCollection","features":[{"type":"Feature","id":"feat-1","geometry":{"type":"Point","coordinates":[29,41]}}]}';
    const node = makeSpatialFile('data/selection.geojson', content);
    const layer = makeLayer('layer-selection', 'Selection');

    useFileExplorerStore.getState().setFiles([node]);
    useMapExplorerStore.setState({ overlayLayers: [layer] });
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-4',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content,
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [
            {
              start: { line: 1, column: 1 },
              end: { line: 1, column: content.length },
            },
          ],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-4',
    });

    const exported = vi.fn();
    synapseBus.on('map.selection.export', exported);

    const result = sendSelectionToMap();
    expect(result.ok).toBe(true);
    expect(result.selectionId).toBeTruthy();
    expect(exported).toHaveBeenCalledOnce();

    const ref = getSelectionReference(result.selectionId as string);
    expect(ref).not.toBeNull();
    expect(ref?.featureIds).toContain('feat-1');
    expect(useMapExplorerStore.getState().selectedFeatureIds['layer-selection']).toContain('feat-1');
  });

  it('uses whole-file spatial content as fallback selection when explicit selection is absent', () => {
    const content = '{"type":"FeatureCollection","features":[{"type":"Feature","id":"feat-auto-1","geometry":{"type":"Point","coordinates":[29,41]},"properties":{}}]}';
    const node = makeSpatialFile('data/auto-selection.geojson', content);
    useFileExplorerStore.getState().setFiles([node]);
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-auto-selection',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content,
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-auto-selection',
    });

    const eligibility = evaluateIdeMapHandoffEligibility();
    expect(eligibility.canSendSelectionToMap).toBe(true);

    const result = sendSelectionToMap();
    expect(result.ok).toBe(true);
    expect(result.selectionId).toBeTruthy();

    const ref = getSelectionReference(result.selectionId as string);
    expect(ref?.featureIds).toContain('feat-auto-1');
  });

  it('registers a spatial artifact and emits evidence.artifact.register', () => {
    const node = makeSpatialFile('data/zones.geojson', '{"type":"FeatureCollection","features":[]}');
    useFileExplorerStore.getState().setFiles([node]);
    useEditorStore.setState({
      tabs: [
        {
          id: 'tab-5',
          fileId: node.id,
          name: node.name,
          path: node.path,
          content: node.content || '',
          language: 'json',
          isDirty: false,
          isActive: true,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
        },
      ],
      activeTabId: 'tab-5',
    });

    const evidenceEvt = vi.fn();
    synapseBus.on('evidence.artifact.register', evidenceEvt);

    const result = registerSpatialArtifact();
    expect(result.ok).toBe(true);
    expect(result.artifactId).toBeTruthy();
    expect(useSynapseWorkspaceStore.getState().artifacts[0]?.id).toBe(result.artifactId);
    expect(useSynapseWorkspaceStore.getState().syncState.pendingHandoffIds).toContain(result.artifactId as string);
    expect(evidenceEvt).toHaveBeenCalledOnce();
  });
});
