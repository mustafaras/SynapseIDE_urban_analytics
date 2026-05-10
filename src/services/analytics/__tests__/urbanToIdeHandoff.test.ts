// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { busTimestamp, synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { FileNode } from '@/types/state';
import {
  _uninstallUrbanToIdeReceiverForTesting,
  clearPendingScaffolds,
  clearUrbanInbox,
  consumePendingScaffold,
  describeLastIncomingUrbanEvent,
  getLastIncomingUrbanEvent,
  getPendingScaffold,
  getPendingScaffolds,
  getUrbanInbox,
  installUrbanToIdeReceiver,
  isUrbanToIdeReceiverInstalled,
  subscribePendingScaffolds,
  subscribeUrbanInbox,
  URBAN_HANDOFF_INCOMING_TAG,
  URBAN_INBOX_LIMIT,
  URBAN_PENDING_SCAFFOLD_LIMIT,
  URBAN_SCAFFOLD_MAX_BYTES,
} from '../urbanToIdeHandoff';

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

async function flushDeferred(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ── lifecycle ──────────────────────────────────────────────────────────────

describe('urbanToIdeHandoff — lifecycle', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    vi.restoreAllMocks();
  });

  it('install is idempotent', () => {
    expect(isUrbanToIdeReceiverInstalled()).toBe(false);
    expect(installUrbanToIdeReceiver()).toBe(true);
    expect(isUrbanToIdeReceiverInstalled()).toBe(true);
    expect(installUrbanToIdeReceiver()).toBe(false);
  });

  it('uninstall clears subscriptions, inbox, and pending scaffolds', () => {
    installUrbanToIdeReceiver();
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-1',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(1);

    _uninstallUrbanToIdeReceiverForTesting();
    expect(isUrbanToIdeReceiverInstalled()).toBe(false);
    expect(getUrbanInbox()).toHaveLength(0);
    expect(getPendingScaffolds()).toHaveLength(0);

    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-2',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(0);
  });
});

// ── inbox & source filtering ───────────────────────────────────────────────

describe('urbanToIdeHandoff — inbox & source filtering', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
  });

  it('captures analytics.scenario.open from urban-analytics', () => {
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-A',
      title: 'Baseline',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    const inbox = getUrbanInbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.kind).toBe('scenario.open');
  });

  it('captures analytics.artifact.publish and registers a workspace artifact', async () => {
    synapseBus.emit('analytics.artifact.publish', {
      artifactId: 'art-pub-1',
      artifactType: 'analysis-result',
      title: 'Heatmap result',
      summary: 'Density of incidents',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();
    const ws = useSynapseWorkspaceStore.getState();
    const entry = ws.artifacts.find((a) => a.id === 'art-pub-1');
    expect(entry).toBeDefined();
    expect(entry?.type).toBe('analysis-result');
    expect(entry?.tags).toContain(URBAN_HANDOFF_INCOMING_TAG);
    expect(entry?.provenance.method).toContain('Density of incidents');
  });

  it('ignores analytics.scenario.open emitted by IDE itself (loop-safe)', () => {
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-from-ide',
      source: 'ide',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(0);
  });

  it('ignores evidence.artifact.register from non-urban sources', () => {
    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'art-not-urban',
      artifactType: 'spatial-layer',
      sourceModule: 'map-explorer',
      title: 'Some layer',
      source: 'map-explorer',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(0);
  });

  it('updates module sync lastReceivedAt on every accepted event', async () => {
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-X',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();
    const sync = useSynapseWorkspaceStore.getState().syncState.modules['urban-analytics'];
    expect(sync?.online).toBe(true);
    expect(typeof sync?.lastReceivedAt).toBe('string');
  });

  it('caps inbox at URBAN_INBOX_LIMIT', () => {
    for (let i = 0; i < URBAN_INBOX_LIMIT + 5; i += 1) {
      synapseBus.emit('analytics.scenario.open', {
        scenarioId: `sc-${i}`,
        source: 'urban-analytics',
        requestedAt: ts(),
      });
    }
    expect(getUrbanInbox()).toHaveLength(URBAN_INBOX_LIMIT);
  });

  it('subscribeUrbanInbox notifies and unsubscribes cleanly', () => {
    const handler = vi.fn();
    const off = subscribeUrbanInbox(handler);
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-sub',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 'sc-sub-2',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clearUrbanInbox empties inbox without affecting subscriptions', () => {
    const handler = vi.fn();
    subscribeUrbanInbox(handler);
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 's',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    clearUrbanInbox();
    expect(getUrbanInbox()).toHaveLength(0);
    synapseBus.emit('analytics.scenario.open', {
      scenarioId: 's2',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

// ── script / report / indicator open ──────────────────────────────────────

describe('urbanToIdeHandoff — file open handlers', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
  });

  it('analytics.script.open opens an existing file via fileExplorer + editor', async () => {
    const node = makeFile('analysis/run.py', '# starter');
    useFileExplorerStore.setState({ files: [node] });

    synapseBus.emit('analytics.script.open', {
      path: node.path,
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();

    const tabs = useEditorStore.getState().tabs;
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.path).toBe(node.path);
    expect(tabs[0]?.origin).toBe('bridge');
  });

  it('analytics.report.open falls back to editor bridge when file is not registered', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    synapseBus.emit('analytics.report.open', {
      path: 'reports/2026-may.md',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();
    // The legacy editor bridge dispatches a CustomEvent on window.
    expect(dispatchSpy).toHaveBeenCalled();
    const inbox = getUrbanInbox();
    expect(inbox[0]?.kind).toBe('report.open');
  });

  it('analytics.indicator.inspect opens file at range and registers indicator artifact with confidence', async () => {
    const node = makeFile('indicators/walkability.json', '{}');
    useFileExplorerStore.setState({ files: [node] });

    synapseBus.emit('analytics.indicator.inspect', {
      path: node.path,
      indicatorId: 'ind-walk',
      title: 'Walkability index',
      fromLine: 10,
      toLine: 24,
      uncertainty: {
        confidence: 0.72,
        assumptions: ['Pedestrian network is complete'],
        caveats: ['No data for new districts'],
        methodologyId: 'walk-v3',
      },
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();

    const tabs = useEditorStore.getState().tabs;
    expect(tabs[0]?.path).toBe(node.path);

    const ws = useSynapseWorkspaceStore.getState();
    const entry = ws.artifacts.find((a) => a.id === 'ind-walk');
    expect(entry).toBeDefined();
    expect(entry?.type).toBe('indicator');
    expect(entry?.uri).toBe(node.path);
    expect(entry?.confidence).toBeCloseTo(0.72);
    expect(entry?.fileRange).toEqual({ startLine: 10, endLine: 24 });
    expect(entry?.provenance.method).toContain('confidence=0.72');
    expect(entry?.provenance.method).toContain('walk-v3');
    expect(entry?.provenance.method).toContain('assumes(1)');
  });

  it('rejects script.open with empty path (fail-safe)', () => {
    synapseBus.emit('analytics.script.open', {
      path: '',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(0);
    expect(useEditorStore.getState().tabs).toHaveLength(0);
  });
});

// ── scenario.register: provenance + uncertainty ───────────────────────────

describe('urbanToIdeHandoff — analytics.scenario.register', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
  });

  it('registers scenario as artifact with full provenance + preserved uncertainty metadata', async () => {
    synapseBus.emit('analytics.scenario.register', {
      scenarioId: 'sc-baseline',
      title: 'Baseline 2026',
      summary: 'Pre-intervention reference state',
      filePath: 'scenarios/baseline.json',
      relatedArtifactIds: ['ind-walk', 'ind-traffic'],
      uncertainty: {
        confidence: 0.85,
        confidenceInterval: { lower: 0.78, upper: 0.92, level: 0.95 },
        assumptions: ['Population grows at 1.2%/yr', 'No new transit lines'],
        caveats: ['Excludes informal housing'],
        dataLineage: 'OSM 2025-Q4 + Census 2024',
        methodologyId: 'baseline-v1',
      },
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();

    const ws = useSynapseWorkspaceStore.getState();
    const entry = ws.artifacts.find((a) => a.id === 'sc-baseline');
    expect(entry).toBeDefined();
    expect(entry?.type).toBe('scenario');
    expect(entry?.title).toBe('Baseline 2026');
    expect(entry?.uri).toBe('scenarios/baseline.json');
    expect(entry?.scenarioId).toBe('sc-baseline');
    expect(entry?.confidence).toBeCloseTo(0.85);
    expect(entry?.provenance.sourceModule).toBe('urban-analytics');
    expect(entry?.provenance.method).toContain('Pre-intervention reference state');
    expect(entry?.provenance.method).toContain('confidence=0.85');
    expect(entry?.provenance.method).toContain('ci95=[0.78,0.92]');
    expect(entry?.provenance.method).toContain('assumes(2)');
    // The schema bounds provenance.method to 200 chars — when uncertainty +
    // summary together exceed that, the clamp marker must be present (data is
    // preserved on the wire; the on-artifact summary is intentionally bounded).
    expect(entry?.provenance.method?.length).toBeLessThanOrEqual(200);
    expect(entry?.tags).toContain(URBAN_HANDOFF_INCOMING_TAG);
  });

  it('rejects scenario.register without a stable id (fail-safe)', () => {
    synapseBus.emit('analytics.scenario.register', {
      // @ts-expect-error — intentionally invalid payload to exercise guard
      scenarioId: '',
      title: 'Bad',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getUrbanInbox()).toHaveLength(0);
  });
});

// ── scaffold.propose: NEVER auto-insert ───────────────────────────────────

describe('urbanToIdeHandoff — scaffold proposals (apply-preview gate)', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    clearPendingScaffolds();
  });

  it('stages scaffold without inserting into editor — generated code is never silent', () => {
    // Prime an active editor tab; even with one open, the receiver must NOT insert.
    const node = makeFile('analysis/run.py');
    useFileExplorerStore.setState({ files: [node] });
    useEditorStore.getState().openTab(node, { origin: 'bridge' });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    dispatchSpy.mockClear();

    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-1',
      code: '# reproducibility scaffold\nprint("ok")\n',
      language: 'python',
      purpose: 'Reproduce indicator run',
      uncertainty: { confidence: 0.6, assumptions: ['Random seed = 42'] },
      source: 'urban-analytics',
      requestedAt: ts(),
    });

    // No editor:insertAtCursor event should have been dispatched.
    const insertCalls = dispatchSpy.mock.calls.filter((c) => {
      const evt = c[0] as Event & { detail?: { type?: string } };
      return evt?.detail?.type === 'editor:insertAtCursor';
    });
    expect(insertCalls).toHaveLength(0);

    const pending = getPendingScaffolds();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe('sf-1');
    expect(pending[0]?.status).toBe('pending');
    expect(pending[0]?.uncertainty?.confidence).toBeCloseTo(0.6);
    expect(pending[0]?.uncertainty?.assumptions).toEqual(['Random seed = 42']);
  });

  it('drops oversized scaffold proposals (fail-safe, > URBAN_SCAFFOLD_MAX_BYTES)', () => {
    const oversized = 'x'.repeat(URBAN_SCAFFOLD_MAX_BYTES + 100);
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-big',
      code: oversized,
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getPendingScaffolds()).toHaveLength(0);
  });

  it('de-duplicates pending scaffolds by id (newer replaces older)', () => {
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-dup',
      code: 'v1',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-dup',
      code: 'v2',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    const pending = getPendingScaffolds();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.code).toBe('v2');
  });

  it('caps pending queue at URBAN_PENDING_SCAFFOLD_LIMIT', () => {
    for (let i = 0; i < URBAN_PENDING_SCAFFOLD_LIMIT + 5; i += 1) {
      synapseBus.emit('analytics.scaffold.propose', {
        scaffoldId: `sf-${i}`,
        code: '// noop',
        source: 'urban-analytics',
        requestedAt: ts(),
      });
    }
    expect(getPendingScaffolds()).toHaveLength(URBAN_PENDING_SCAFFOLD_LIMIT);
  });

  it('subscribePendingScaffolds notifies on every change', () => {
    const handler = vi.fn();
    const off = subscribePendingScaffolds(handler);
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-notify',
      code: '// noop',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(handler).toHaveBeenCalled();
    off();
  });

  it('consumePendingScaffold(reject) discards without inserting', () => {
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-rej',
      code: '// noop',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    dispatchSpy.mockClear();

    const r = consumePendingScaffold('sf-rej', 'reject');
    expect(r.ok).toBe(true);
    expect(getPendingScaffold('sf-rej')).toBeNull();

    const inserts = dispatchSpy.mock.calls.filter((c) => {
      const evt = c[0] as Event & { detail?: { type?: string } };
      return evt?.detail?.type === 'editor:insertAtCursor';
    });
    expect(inserts).toHaveLength(0);
  });

  it('consumePendingScaffold(accept) inserts ONLY through editor bridge after explicit decision', () => {
    const node = makeFile('analysis/run.py');
    useFileExplorerStore.setState({ files: [node] });
    useEditorStore.getState().openTab(node, { origin: 'bridge' });

    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-acc',
      code: '# reproducible\n',
      source: 'urban-analytics',
      requestedAt: ts(),
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    dispatchSpy.mockClear();

    const r = consumePendingScaffold('sf-acc', 'accept');
    expect(r.ok).toBe(true);
    expect(r.snippet).toBe('# reproducible\n');

    const inserts = dispatchSpy.mock.calls.filter((c) => {
      const evt = c[0] as Event & { detail?: { type?: string } };
      return evt?.detail?.type === 'editor:insertAtCursor';
    });
    expect(inserts).toHaveLength(1);
  });

  it('consumePendingScaffold(accept) without active tab re-stages the scaffold', () => {
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-no-tab',
      code: '// noop',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    const r = consumePendingScaffold('sf-no-tab', 'accept');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/open a file/i);
    // Re-staged — still pending.
    expect(getPendingScaffold('sf-no-tab')).not.toBeNull();
  });

  it('consumePendingScaffold returns ok:false for unknown id', () => {
    const r = consumePendingScaffold('does-not-exist', 'accept');
    expect(r.ok).toBe(false);
  });

  it('clearPendingScaffolds empties queue', () => {
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-clear',
      code: '// noop',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    expect(getPendingScaffolds()).toHaveLength(1);
    clearPendingScaffolds();
    expect(getPendingScaffolds()).toHaveLength(0);
  });
});

// ── evidence.artifact.register filter ─────────────────────────────────────

describe('urbanToIdeHandoff — evidence.artifact.register routing', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
  });

  it('captures evidence from urban-analytics and registers in workspace', async () => {
    synapseBus.emit('evidence.artifact.register', {
      artifactId: 'ev-1',
      artifactType: 'analysis-result',
      sourceModule: 'urban-analytics',
      title: 'Run results',
      summary: 'Output of scenario S1',
      relatedFilePaths: ['outputs/s1.json'],
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    await flushDeferred();

    const ws = useSynapseWorkspaceStore.getState();
    const entry = ws.artifacts.find((a) => a.id === 'ev-1');
    expect(entry).toBeDefined();
    expect(entry?.uri).toBe('outputs/s1.json');
    expect(entry?.tags).toContain(URBAN_HANDOFF_INCOMING_TAG);
  });
});

// ── provenance descriptor ─────────────────────────────────────────────────

describe('urbanToIdeHandoff — describeLastIncomingUrbanEvent', () => {
  beforeEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
    synapseBus._resetForTesting();
    resetStores();
    installUrbanToIdeReceiver();
  });

  afterEach(() => {
    _uninstallUrbanToIdeReceiverForTesting();
  });

  it('returns null when inbox is empty', () => {
    expect(describeLastIncomingUrbanEvent()).toBeNull();
  });

  it('describes most recent event in a bounded string', () => {
    synapseBus.emit('analytics.scaffold.propose', {
      scaffoldId: 'sf-desc',
      code: '// noop',
      purpose: 'Reproduce run',
      source: 'urban-analytics',
      requestedAt: ts(),
    });
    const desc = describeLastIncomingUrbanEvent();
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeLessThanOrEqual(240);
    expect(desc).toContain('preview required');
    expect(getLastIncomingUrbanEvent()?.kind).toBe('scaffold.propose');
  });
});
