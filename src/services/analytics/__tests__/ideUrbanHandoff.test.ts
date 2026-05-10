// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUrbanStore } from '@/features/urbanAnalytics/store';
import { synapseBus } from '@/services/synapseBus';
import { useEditorStore } from '@/stores/editorStore';
import { useFileExplorerStore } from '@/stores/fileExplorerStore';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import type { FileNode } from '@/types/state';
import {
  attachScriptToScenario,
  evaluateIdeUrbanHandoffEligibility,
  IDE_URBAN_HANDOFF_TAG,
  openScenarioInUrbanAnalytics,
  registerIndicatorDefinition,
  sendResultArtifactToUrbanAnalytics,
} from '../ideUrbanHandoff';

// ── Test fixtures ──────────────────────────────────────────────────────────

function makeFile(path: string, content: string, opts?: Partial<FileNode>): FileNode {
  return {
    id: `file-${path}`,
    name: path.split('/').pop() || path,
    type: 'file',
    path,
    content,
    language: 'plaintext',
    lastModified: new Date(),
    size: content.length,
    ...(opts ?? {}),
  };
}

function activateTab(file: FileNode, language = 'plaintext'): void {
  useEditorStore.setState({
    tabs: [
      {
        id: `tab-${file.path}`,
        fileId: file.id,
        name: file.name,
        path: file.path,
        content: file.content || '',
        language,
        isDirty: false,
        isActive: true,
        cursorPosition: { line: 1, column: 1 },
        scrollPosition: { top: 0, left: 0 },
        selections: [],
        origin: 'user',
      },
    ],
    activeTabId: `tab-${file.path}`,
  });
}

function resetStores(): void {
  useEditorStore.setState({ tabs: [], activeTabId: null });
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
  // Close the urban modal between tests so handoff toggles are observable.
  useUrbanStore.setState({ isOpen: false });
}

describe('ideUrbanHandoff', () => {
  beforeEach(() => {
    resetStores();
    synapseBus._resetForTesting();
    vi.restoreAllMocks();
  });

  // ── Eligibility ────────────────────────────────────────────────────────

  it('reports all-disabled eligibility with no active tab', () => {
    const e = evaluateIdeUrbanHandoffEligibility();
    expect(e.hasActiveTab).toBe(false);
    expect(e.canOpenScenario).toBe(false);
    expect(e.canAttachScript).toBe(false);
    expect(e.canRegisterIndicator).toBe(false);
    expect(e.canSendResultArtifact).toBe(false);
  });

  it('detects scenario configuration files by filename', () => {
    const file = makeFile('config/city-scenario.json', '{"version":1}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');
    const e = evaluateIdeUrbanHandoffEligibility();
    expect(e.canOpenScenario).toBe(true);
    expect(e.canRegisterIndicator).toBe(false);
  });

  it('respects semanticStatus.scenarioArtifact even without filename token', () => {
    const file = makeFile('plans/baseline.json', '{}', {
      semanticStatus: { scenarioArtifact: true },
    });
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');
    expect(evaluateIdeUrbanHandoffEligibility().canOpenScenario).toBe(true);
  });

  it('detects indicator definitions by filename or path', () => {
    const fByName = makeFile('config/city-indicators.json', '{}');
    useFileExplorerStore.getState().setFiles([fByName]);
    activateTab(fByName, 'json');
    expect(evaluateIdeUrbanHandoffEligibility().canRegisterIndicator).toBe(true);

    resetStores();

    const fByPath = makeFile('indicators/density.yaml', 'name: density');
    useFileExplorerStore.getState().setFiles([fByPath]);
    activateTab(fByPath, 'yaml');
    expect(evaluateIdeUrbanHandoffEligibility().canRegisterIndicator).toBe(true);
  });

  it('detects analysis scripts by extension', () => {
    const file = makeFile('analysis/compute_density.py', '# python');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'python');
    const e = evaluateIdeUrbanHandoffEligibility();
    expect(e.canAttachScript).toBe(true);
    expect(e.canOpenScenario).toBe(false);
  });

  it('detects result artifacts via /results path token', () => {
    const file = makeFile('outputs/density.csv', 'a,b\n1,2');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'csv');
    expect(evaluateIdeUrbanHandoffEligibility().canSendResultArtifact).toBe(true);
  });

  it('detects result artifacts via semanticStatus.analysisOutput', () => {
    const file = makeFile('data/density.parquet', 'binary', {
      semanticStatus: { analysisOutput: true },
    });
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'binary');
    expect(evaluateIdeUrbanHandoffEligibility().canSendResultArtifact).toBe(true);
  });

  it('does not flag arbitrary .json files as scenarios', () => {
    const file = makeFile('config/settings.json', '{}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');
    expect(evaluateIdeUrbanHandoffEligibility().canOpenScenario).toBe(false);
  });

  // ── Action: openScenarioInUrbanAnalytics ──────────────────────────────

  it('refuses scenario open when the active file is not a scenario', () => {
    const file = makeFile('analysis/script.py', '# x');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'python');
    const result = openScenarioInUrbanAnalytics();
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/scenario/i);
  });

  it('opens Urban Analytics, registers a scenario artifact, and emits typed events', () => {
    const file = makeFile('plans/scenario-2030.json', '{"v":1}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');

    const onScenarioOpen = vi.fn();
    const onArtifactRegister = vi.fn();
    synapseBus.on('analytics.scenario.open', onScenarioOpen);
    synapseBus.on('evidence.artifact.register', onArtifactRegister);

    const before = useUrbanStore.getState().isOpen;
    expect(before).toBe(false);

    const result = openScenarioInUrbanAnalytics();

    expect(result.ok).toBe(true);
    expect(result.scenarioId).toMatch(/^scenario-/);
    expect(result.artifactId).toMatch(/^artifact-/);
    expect(useUrbanStore.getState().isOpen).toBe(true);

    const ws = useSynapseWorkspaceStore.getState();
    expect(ws.artifacts).toHaveLength(1);
    expect(ws.artifacts[0]?.type).toBe('scenario');
    expect(ws.artifacts[0]?.tags).toContain(IDE_URBAN_HANDOFF_TAG);
    expect(ws.artifacts[0]?.scenarioId).toBe(result.scenarioId);
    expect(ws.syncState.modules['urban-analytics']?.online).toBe(true);
    expect(ws.syncState.modules['urban-analytics']?.lastArtifactId).toBe(result.artifactId);
    expect(ws.syncState.pendingHandoffIds).toContain(result.artifactId);

    expect(onScenarioOpen).toHaveBeenCalledTimes(1);
    expect(onScenarioOpen.mock.calls[0]?.[0]).toMatchObject({
      scenarioId: result.scenarioId,
      filePath: 'plans/scenario-2030.json',
      source: 'ide',
    });
    expect(onArtifactRegister).toHaveBeenCalledTimes(1);
    expect(onArtifactRegister.mock.calls[0]?.[0]).toMatchObject({
      artifactId: result.artifactId,
      sourceModule: 'ide',
      source: 'ide',
      artifactType: 'scenario',
    });
  });

  // ── Action: attachScriptToScenario ────────────────────────────────────

  it('refuses script attach when no analysis script is active', () => {
    const file = makeFile('config/scenario.json', '{}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');
    expect(attachScriptToScenario().ok).toBe(false);
  });

  it('attaches script and links to a recent scenario when one exists in workspace memory', () => {
    // Step 1: open a scenario so workspace memory has one.
    const scenarioFile = makeFile('plans/scenario-baseline.json', '{}');
    useFileExplorerStore.getState().setFiles([scenarioFile]);
    activateTab(scenarioFile, 'json');
    const scenarioResult = openScenarioInUrbanAnalytics();
    expect(scenarioResult.ok).toBe(true);

    // Step 2: open a script and attach.
    const scriptFile = makeFile('analysis/density.py', 'print(1)');
    useFileExplorerStore.getState().setFiles([scenarioFile, scriptFile]);
    activateTab(scriptFile, 'python');

    const onArtifactRegister = vi.fn();
    synapseBus.on('evidence.artifact.register', onArtifactRegister);

    const result = attachScriptToScenario();
    expect(result.ok).toBe(true);
    expect(result.scenarioId).toBe(scenarioResult.scenarioId);

    const codeArtifact = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.type === 'code');
    expect(codeArtifact).toBeDefined();
    expect(codeArtifact?.scenarioId).toBe(scenarioResult.scenarioId);
    expect(codeArtifact?.uri).toBe('analysis/density.py');
    expect(codeArtifact?.tags).toContain(IDE_URBAN_HANDOFF_TAG);
    expect(onArtifactRegister).toHaveBeenCalled();
  });

  it('attaches script as standalone artifact when no scenario is in memory', () => {
    const scriptFile = makeFile('analysis/density.py', 'print(1)');
    useFileExplorerStore.getState().setFiles([scriptFile]);
    activateTab(scriptFile, 'python');

    const result = attachScriptToScenario();
    expect(result.ok).toBe(true);
    expect(result.scenarioId).toBeUndefined();

    const codeArtifact = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.type === 'code');
    expect(codeArtifact).toBeDefined();
    expect(codeArtifact?.scenarioId).toBeUndefined();
  });

  // ── Action: registerIndicatorDefinition ───────────────────────────────

  it('registers an indicator artifact and opens Urban Analytics', () => {
    const file = makeFile('indicators/walkability.yaml', 'name: walkability');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'yaml');

    const result = registerIndicatorDefinition();
    expect(result.ok).toBe(true);

    const ind = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.type === 'indicator');
    expect(ind).toBeDefined();
    expect(ind?.uri).toBe('indicators/walkability.yaml');
    expect(useUrbanStore.getState().isOpen).toBe(true);
  });

  it('refuses indicator registration for unrelated files', () => {
    const file = makeFile('analysis/script.py', '# x');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'python');
    expect(registerIndicatorDefinition().ok).toBe(false);
  });

  // ── Action: sendResultArtifactToUrbanAnalytics ────────────────────────

  it('publishes analytics.artifact.publish for a result artifact', () => {
    const file = makeFile('outputs/density-2030.csv', 'a,b');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'csv');

    const onPublish = vi.fn();
    synapseBus.on('analytics.artifact.publish', onPublish);

    const result = sendResultArtifactToUrbanAnalytics();
    expect(result.ok).toBe(true);
    expect(onPublish).toHaveBeenCalledTimes(1);
    expect(onPublish.mock.calls[0]?.[0]).toMatchObject({
      artifactId: result.artifactId,
      artifactType: 'analysis-result',
      source: 'ide',
    });

    const r = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.type === 'analysis-result');
    expect(r).toBeDefined();
    expect(r?.uri).toBe('outputs/density-2030.csv');
  });

  it('refuses result handoff for plain config files', () => {
    const file = makeFile('config/scenario.json', '{}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');
    expect(sendResultArtifactToUrbanAnalytics().ok).toBe(false);
  });

  // ── Loop safety ───────────────────────────────────────────────────────

  it('every emitted event carries source: ide for loop-safety with Urban→IDE receivers', () => {
    const file = makeFile('plans/scenario-2030.json', '{}');
    useFileExplorerStore.getState().setFiles([file]);
    activateTab(file, 'json');

    const seen: string[] = [];
    synapseBus.on('analytics.scenario.open', (p) => seen.push(`scenario:${p.source}`));
    synapseBus.on('evidence.artifact.register', (p) => seen.push(`evidence:${p.source}`));

    openScenarioInUrbanAnalytics();
    expect(seen).toEqual(['scenario:ide', 'evidence:ide']);
  });
});
