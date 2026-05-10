// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { FileNode } from '@/types/state';
import {
  _uninstallMapToIdeReceiverForTesting,
  clearMapInbox,
  describeLastIncomingMapEvent,
  getLastIncomingMapEvent,
  getMapInbox,
  insertSpatialQueryScaffold,
  installMapToIdeReceiver,
  isMapToIdeReceiverInstalled,
  MAP_HANDOFF_INCOMING_TAG,
  MAP_INBOX_LIMIT,
  openMapAnalysisScript,
  subscribeMapInbox,
} from '../mapToIdeHandoff';

// ── helpers ────────────────────────────────────────────────────────────────

function ts(): string {
  return busTimestamp();
}

function makeFile(path: string, content = ''): FileNode {
  const name = path.split('/').pop() || path;
  return {
    id: `file-${path}`,
    name,
    type: 'file',
    path,
    content,
    language: 'python',
    lastModified: new Date(),
    size: content.length,
  };
}

function resetStores(): void {
  useEditorStore.setState({ tabs: [], activeTabId: null, history: {} });
  useFileExplorerStore.setState({ files: [], selectedFiles: [] });
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

// ── lifecycle ──────────────────────────────────────────────────────────────

describe('mapToIdeHandoff — lifecycle', () => {
  beforeEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
  });

  afterEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    vi.restoreAllMocks();
  });

  it('install is idempotent', () => {
    expect(isMapToIdeReceiverInstalled()).toBe(false);
    expect(installMapToIdeReceiver()).toBe(true);
    expect(isMapToIdeReceiverInstalled()).toBe(true);
    expect(installMapToIdeReceiver()).toBe(false);
  });

  it('uninstall clears subscriptions and inbox', () => {
    installMapToIdeReceiver();
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-1',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(getMapInbox()).toHaveLength(1);

    _uninstallMapToIdeReceiverForTesting();
    expect(isMapToIdeReceiverInstalled()).toBe(false);
    expect(getMapInbox()).toHaveLength(0);

    // After uninstall, events are no longer recorded.
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-2',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(getMapInbox()).toHaveLength(0);
  });
});

// ── inbox & filtering ──────────────────────────────────────────────────────

describe('mapToIdeHandoff — inbox & source filtering', () => {
  beforeEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installMapToIdeReceiver();
  });

  afterEach(() => {
    _uninstallMapToIdeReceiverForTesting();
  });

  it('captures map.layer.focus from map-explorer', () => {
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-A',
      layerTitle: 'District boundary',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    const inbox = getMapInbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.kind).toBe('layer.focus');
    if (inbox[0]?.kind === 'layer.focus') {
      expect(inbox[0].payload.layerId).toBe('lyr-A');
    }
  });

  it('captures map.selection.export from map-explorer', () => {
    synapseBus.emit('map.selection.export', {
      selectionId: 'sel-1',
      featureCount: 3,
      layerId: 'lyr-A',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    const last = getLastIncomingMapEvent();
    expect(last?.kind).toBe('selection.export');
  });

  it('captures evidence.artifact.register from map-explorer and registers in workspace', async () => {
    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'art-1',
      artifactType: 'spatial-layer',
      sourceModule: 'map-explorer',
      title: 'Park polygons',
      summary: 'Polygons of municipal parks',
      relatedFilePaths: ['data/parks.geojson'],
      source: 'map-explorer',
      requestedAt: ts(),
    });

    // Workspace mutations are deferred to the next microtask to avoid
    // re-entering Zustand from inside a synchronous bus emit.
    await Promise.resolve();
    await Promise.resolve();

    const inbox = getMapInbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.kind).toBe('artifact.register');

    const ws = useSynapseWorkspaceStore.getState();
    expect(ws.artifacts).toHaveLength(1);
    const entry = ws.artifacts[0]!;
    expect(entry.id).toBe('art-1');
    expect(entry.type).toBe('spatial-layer');
    expect(entry.uri).toBe('data/parks.geojson');
    expect(entry.tags).toContain(MAP_HANDOFF_INCOMING_TAG);
    expect(entry.provenance.sourceModule).toBe('map-explorer');
  });

  it('ignores map.layer.focus emitted by IDE itself (loop-safe)', () => {
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-from-ide',
      source: 'ide',
      requestedAt: ts(),
    });
    expect(getMapInbox()).toHaveLength(0);
  });

  it('ignores evidence.artifact.register from non-map sources', () => {
    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'art-not-map',
      artifactType: 'analysis-result',
      sourceModule: 'urban-analytics',
      title: 'Scenario result',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getMapInbox()).toHaveLength(0);
    expect(useSynapseWorkspaceStore.getState().artifacts).toHaveLength(0);
  });

  it('updates module sync lastReceivedAt on every accepted event', async () => {
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-X',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    await Promise.resolve();
    await Promise.resolve();
    const sync = useSynapseWorkspaceStore.getState().syncState.modules['map-explorer'];
    expect(sync?.online).toBe(true);
    expect(typeof sync?.lastReceivedAt).toBe('string');
  });

  it('caps inbox at MAP_INBOX_LIMIT', () => {
    for (let i = 0; i < MAP_INBOX_LIMIT + 5; i += 1) {
      synapseBus.emit('map.layer.focus', {
        layerId: `lyr-${i}`,
        source: 'map-explorer',
        requestedAt: ts(),
      });
    }
    expect(getMapInbox()).toHaveLength(MAP_INBOX_LIMIT);
    // newest first
    const first = getMapInbox()[0];
    if (first?.kind === 'layer.focus') {
      expect(first.payload.layerId).toBe(`lyr-${MAP_INBOX_LIMIT + 4}`);
    }
  });

  it('subscribeMapInbox notifies on new events and unsubscribes cleanly', () => {
    const handler = vi.fn();
    const off = subscribeMapInbox(handler);
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-sub',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr-sub-2',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clearMapInbox empties inbox without affecting subscriptions', () => {
    const handler = vi.fn();
    subscribeMapInbox(handler);
    synapseBus.emit('map.layer.focus', {
      layerId: 'l',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    clearMapInbox();
    expect(getMapInbox()).toHaveLength(0);
    synapseBus.emit('map.layer.focus', {
      layerId: 'l2',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

// ── openMapAnalysisScript ─────────────────────────────────────────────────

describe('mapToIdeHandoff — openMapAnalysisScript', () => {
  beforeEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installMapToIdeReceiver();
  });

  afterEach(() => {
    _uninstallMapToIdeReceiverForTesting();
  });

  it('rejects empty path', () => {
    const r = openMapAnalysisScript({ path: '   ' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/required/i);
  });

  it('opens an existing file via fileExplorer + editorStore', () => {
    const node = makeFile('analysis/parks_query.py', '# starter');
    useFileExplorerStore.setState({ files: [node] });
    const r = openMapAnalysisScript({ path: node.path });
    expect(r.ok).toBe(true);
    expect(r.path).toBe(node.path);
    const tabs = useEditorStore.getState().tabs;
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.path).toBe(node.path);
    expect(tabs[0]?.origin).toBe('bridge');
  });

  it('falls back to editor bridge when file is not registered', () => {
    const r = openMapAnalysisScript({ path: 'generated/derived.py' });
    expect(r.ok).toBe(true);
    expect(r.path).toBe('generated/derived.py');
  });
});

// ── insertSpatialQueryScaffold ────────────────────────────────────────────

describe('mapToIdeHandoff — insertSpatialQueryScaffold', () => {
  beforeEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installMapToIdeReceiver();
  });

  afterEach(() => {
    _uninstallMapToIdeReceiverForTesting();
  });

  it('refuses when no editor tab is active', () => {
    const r = insertSpatialQueryScaffold({ layerId: 'lyr', selectionId: 'sel' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Open a file/i);
  });

  it('inserts a python scaffold when an active tab exists', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: 't1',
          fileId: 'f1',
          name: 'q.py',
          path: 'q.py',
          content: '',
          language: 'python',
          isDirty: false,
          isActive: true,
          isPinned: false,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
          previewMode: false,
          lastAccessedAt: new Date().toISOString(),
        },
      ],
      activeTabId: 't1',
    });

    const r = insertSpatialQueryScaffold({
      layerId: 'lyr-1',
      selectionId: 'sel-1',
      featureCount: 5,
      layerTitle: 'Parks',
      language: 'python',
    });
    expect(r.ok).toBe(true);
    expect(r.snippet).toContain('lyr-1');
    expect(r.snippet).toContain('sel-1');
    expect(r.snippet).toContain('Parks');
  });

  it('supports typescript and sql languages', () => {
    useEditorStore.setState({
      tabs: [
        {
          id: 't2',
          fileId: 'f2',
          name: 'q.ts',
          path: 'q.ts',
          content: '',
          language: 'typescript',
          isDirty: false,
          isActive: true,
          isPinned: false,
          cursorPosition: { line: 1, column: 1 },
          scrollPosition: { top: 0, left: 0 },
          selections: [],
          origin: 'user',
          previewMode: false,
          lastAccessedAt: new Date().toISOString(),
        },
      ],
      activeTabId: 't2',
    });

    const tsResult = insertSpatialQueryScaffold({
      layerId: 'lyr-ts',
      selectionId: 'sel-ts',
      language: 'typescript',
    });
    expect(tsResult.ok).toBe(true);
    expect(tsResult.snippet).toContain('SpatialQueryRef');

    const sqlResult = insertSpatialQueryScaffold({
      layerId: "lyr'sql",
      selectionId: 'sel-sql',
      language: 'sql',
    });
    expect(sqlResult.ok).toBe(true);
    // single quote escaping
    expect(sqlResult.snippet).toContain("lyr''sql");
  });
});

// ── describeLastIncomingMapEvent ──────────────────────────────────────────

describe('mapToIdeHandoff — describeLastIncomingMapEvent', () => {
  beforeEach(() => {
    _uninstallMapToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installMapToIdeReceiver();
  });

  afterEach(() => {
    _uninstallMapToIdeReceiverForTesting();
  });

  it('returns null when inbox is empty', () => {
    expect(describeLastIncomingMapEvent()).toBeNull();
  });

  it('describes layer.focus, selection.export, and artifact.register', () => {
    synapseBus.emit('map.layer.focus', {
      layerId: 'lyr',
      layerTitle: 'Roads',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(describeLastIncomingMapEvent()).toContain('Roads');

    synapseBus.emit('map.selection.export', {
      selectionId: 'sel',
      featureCount: 12,
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(describeLastIncomingMapEvent()).toContain('12 features');

    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'art',
      artifactType: 'analysis-result',
      sourceModule: 'map-explorer',
      title: 'Heatmap',
      relatedFilePaths: ['out/heatmap.geojson'],
      source: 'map-explorer',
      requestedAt: ts(),
    });
    const desc = describeLastIncomingMapEvent();
    expect(desc).toContain('Heatmap');
    expect(desc).toContain('heatmap.geojson');
  });
});
