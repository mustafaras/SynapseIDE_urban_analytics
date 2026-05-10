// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFlowStore } from '@/stores/useFlowStore';

import {
  buildJsonManifestRequest,
  buildMarkdownMethodNoteRequest,
  buildPythonScriptRequest,
  buildTypeScriptAdapterRequest,
  dispatchUrbanCodeArtifactRequest,
  assessUrbanCodeArtifactRequestSize,
  type UrbanCodeArtifactSeed,
} from '../context/codeArtifactRequests';
import { useUrbanContextStore } from '../useUrbanContextStore';
import {
  MAX_URBAN_CODE_ARTIFACT_BYTES,
  type UrbanWorkflowRunManifest,
} from '../lib/types';
import { URBAN_MORPHOLOGY } from '../python/templates/urban_morphology';

// ---------------------------------------------------------------------------
// Bridge mock — keeps a record of openNewTab invocations
// ---------------------------------------------------------------------------

const bridgeCalls: Array<{ filename: string; code: string; language?: string }> = [];

vi.mock('@/services/editorBridge', () => ({
  openNewTab: vi.fn(async (opts: { filename: string; code: string; language?: string }) => {
    bridgeCalls.push(opts);
    return { tabId: `tab-${bridgeCalls.length}` };
  }),
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const FIXED_TIME = new Date('2026-05-09T08:30:00.000Z');

function baseSeed(overrides: Partial<UrbanCodeArtifactSeed> = {}): UrbanCodeArtifactSeed {
  return {
    methodName: 'Walkability Composite Indicator',
    methodId: 'walkability_v2',
    methodSlug: 'walkability_composite',
    flowId: 'walkability',
    contextId: 'ctx-test-1',
    studyAreaId: 'manual:kadikoy',
    studyAreaName: 'Kadikoy',
    studyAreaBounds: [28.97, 40.96, 29.09, 41.02],
    inputDescriptors: ['layer:streets', 'dataset:amenities'],
    parameters: { threshold_minutes: 15, mode: 'walking' },
    assumptions: ['Pedestrian network is connected.'],
    limitations: ['Computed in EPSG:4326 — reproject for area metrics.'],
    citations: ['Lee, A. (2024). Walkability indices.'],
    timestamp: FIXED_TIME,
    ...overrides,
  };
}

function makeManifest(runId: string, runtimeMode: UrbanWorkflowRunManifest['runtimeMode'] = 'live'): UrbanWorkflowRunManifest {
  return {
    runId,
    flowId: 'walkability',
    contextId: 'ctx-test-1',
    inputs: {},
    parameters: {},
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: [],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode,
    readiness: null,
    createdAt: '2026-05-09T08:00:00.000Z',
  };
}

beforeEach(() => {
  bridgeCalls.length = 0;
  localStorage.clear();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useUrbanContextStore.getState().createContext({ studyAreaName: 'Kadikoy', studyAreaId: 'manual:kadikoy' });
  useFlowStore.setState({
    activeFlow: null,
    currentStep: 0,
    stepData: {},
    completedRuns: [],
    manifests: {},
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Filename / language tests
// ---------------------------------------------------------------------------

describe('Urban code artifact filename pattern', () => {
  it('uses the canonical urban_<slug>_<yyyymmdd_hhmm>.<ext> pattern for analysis scripts', () => {
    const request = buildPythonScriptRequest(baseSeed());
    expect(request.targetFilename).toBe('urban_walkability_composite_20260509_0830.py');
    expect(request.language).toBe('python');
  });

  it('uses the .manifest.json variant for JSON manifests', () => {
    const request = buildJsonManifestRequest(baseSeed());
    expect(request.targetFilename).toBe('urban_walkability_composite_20260509_0830.manifest.json');
    expect(request.language).toBe('json');
  });

  it('uses the method_note variant for Markdown notes', () => {
    const request = buildMarkdownMethodNoteRequest(baseSeed());
    expect(request.targetFilename).toBe('urban_walkability_composite_method_note.md');
    expect(request.language).toBe('markdown');
  });

  it('uses the adapter variant for TypeScript snippets', () => {
    const request = buildTypeScriptAdapterRequest(baseSeed());
    expect(request.targetFilename).toBe('urban_walkability_composite_adapter.ts');
    expect(request.language).toBe('typescript');
  });

  it('falls back to a safe slug when no method information is available', () => {
    const request = buildPythonScriptRequest({ timestamp: FIXED_TIME });
    expect(request.targetFilename).toBe('urban_analysis_20260509_0830.py');
  });
});

// ---------------------------------------------------------------------------
// Header / content tests (Section 26.1, 26.2, 26.3, 26.4)
// ---------------------------------------------------------------------------

describe('Python script generator', () => {
  it('emits a Synapse Urban Analytics header with method, flow, study area, manifest, assumptions, and limitations', () => {
    const request = buildPythonScriptRequest(baseSeed());
    expect(request.content.startsWith('#!/usr/bin/env python3\n"""')).toBe(true);
    expect(request.content).toContain('Synapse Urban Analytics Artifact');
    expect(request.content).toContain('Method: Walkability Composite Indicator');
    expect(request.content).toContain('Flow: walkability');
    expect(request.content).toContain('Study area: Kadikoy (bounds: 28.9700, 40.9600, 29.0900, 41.0200)');
    expect(request.content).toContain('Manifest: urban_walkability_composite_20260509_0830.manifest.json');
    expect(request.content).toContain('Scientific assumptions:');
    expect(request.content).toContain('Pedestrian network is connected.');
    expect(request.content).toContain('Limitations:');
    expect(request.content).toContain('Computed in EPSG:4326 — reproject for area metrics.');
    expect(request.content).toContain('References:');
    expect(request.content).toContain('PARAMS = {');
    expect(request.content).toContain('"threshold_minutes": 15,');
    expect(request.content).toContain('"mode": "walking",');
  });

  it('puts the shebang on the very first line when caller provides a template body that already starts with #!', () => {
    const request = buildPythonScriptRequest(baseSeed({ pythonBody: URBAN_MORPHOLOGY }));
    expect(request.content.startsWith('#!/usr/bin/env python3\n"""')).toBe(true);
    expect(request.content).not.toContain('"""\n\n#!/usr/bin/env python3');
    expect(request.content.indexOf('Synapse Urban Analytics Artifact')).toBeLessThan(
      request.content.indexOf('Urban Morphology — Building Morphometrics'),
    );
  });

  it('prepends a default shebang when caller-provided body has no shebang', () => {
    const body = '# user-provided\nprint("hello")';
    const request = buildPythonScriptRequest(baseSeed({ pythonBody: body }));
    expect(request.content).toMatch(/^#!\/usr\/bin\/env python3\n"""\nSynapse Urban Analytics Artifact/);
    expect(request.content).toContain('# user-provided');
    expect(request.content.endsWith('\n')).toBe(true);
  });

  it('scaffold path also starts with #!/usr/bin/env python3', () => {
    const request = buildPythonScriptRequest(baseSeed());
    expect(request.content.split('\n').slice(0, 3)).toEqual([
      '#!/usr/bin/env python3',
      '"""',
      'Synapse Urban Analytics Artifact',
    ]);
    expect(request.content).toContain('raise NotImplementedError("Implement analysis body.")');
  });

  it('records python safety notes (isolated env, CRS validation)', () => {
    const request = buildPythonScriptRequest(baseSeed());
    expect(request.safetyNotes).toContain('Run inside an isolated Python environment with the listed dependencies.');
    expect(request.safetyNotes).toContain('Verify CRS and geometry validity before measurement.');
  });
});

describe('JSON manifest generator', () => {
  it('emits a parseable JSON document with context, study area, method, run, parameters, qaGate, citations', () => {
    const manifest = makeManifest('run-7');
    useFlowStore.getState().registerManifest(manifest);
    const request = buildJsonManifestRequest(baseSeed({ runId: 'run-7', runManifest: manifest }));
    const parsed = JSON.parse(request.content) as Record<string, unknown>;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.artifactKind).toBe('reproducibility-manifest');
    expect((parsed.studyArea as Record<string, unknown>).name).toBe('Kadikoy');
    expect((parsed.method as Record<string, unknown>).flowId).toBe('walkability');
    expect((parsed.run as Record<string, unknown>).id).toBe('run-7');
    const runManifest = (parsed.run as Record<string, unknown>).manifest as Record<string, unknown>;
    expect(runManifest.runId).toBe('run-7');
    expect(runManifest.runtimeMode).toBe('live');
    expect((parsed.qaGate as Record<string, unknown>).limitations).toEqual([
      'Computed in EPSG:4326 — reproject for area metrics.',
    ]);
  });
});

describe('Markdown method note generator', () => {
  it('contains every required section from Section 26.3', () => {
    const request = buildMarkdownMethodNoteRequest(baseSeed());
    expect(request.content).toContain('# Walkability Composite Indicator');
    expect(request.content).toContain('## Research question');
    expect(request.content).toContain('## Method');
    expect(request.content).toContain('## Data inputs');
    expect(request.content).toContain('## Parameters');
    expect(request.content).toContain('## Assumptions');
    expect(request.content).toContain('## Results placeholder');
    expect(request.content).toContain('## Limitations');
    expect(request.content).toContain('## Reproducibility');
    expect(request.content).toContain('## References');
    expect(request.content).toContain('Manifest file: `urban_walkability_composite_20260509_0830.manifest.json`');
    expect(request.content).toContain('Script file:   `urban_walkability_composite_20260509_0830.py`');
  });
});

describe('TypeScript adapter snippet generator', () => {
  it('defaults to map-output + register-evidence intents and emits typed adapter functions', () => {
    const request = buildTypeScriptAdapterRequest(baseSeed());
    expect(request.content).toContain('Synapse Urban Analytics Artifact — TypeScript Adapter Snippet');
    expect(request.content).toContain('export interface UrbanAdapterInput');
    expect(request.content).toContain('export function transformResultToMapOutput');
    expect(request.content).toContain('export function registerEvidenceArtifact');
  });

  it('honours caller-provided intent set', () => {
    const request = buildTypeScriptAdapterRequest(
      baseSeed({ adapterIntents: ['transform-result-to-report-insert'] }),
    );
    expect(request.content).toContain('export function transformResultToReportInsert');
    expect(request.content).not.toContain('transformResultToMapOutput');
  });
});

// ---------------------------------------------------------------------------
// Size guard
// ---------------------------------------------------------------------------

describe('size guard', () => {
  it('reports byte length and budget within the contract', () => {
    const request = buildPythonScriptRequest(baseSeed());
    const sizing = assessUrbanCodeArtifactRequestSize(request);
    expect(sizing.budget).toBe(MAX_URBAN_CODE_ARTIFACT_BYTES);
    expect(sizing.bytes).toBeGreaterThan(0);
    expect(sizing.withinBudget).toBe(true);
  });

  it('rejects oversized payloads at dispatch time and never routes through the bridge', async () => {
    const seed = baseSeed({ pythonBody: 'x'.repeat(MAX_URBAN_CODE_ARTIFACT_BYTES + 1024) });
    const request = buildPythonScriptRequest(seed);
    await expect(dispatchUrbanCodeArtifactRequest(request)).rejects.toThrow(/exceeds/);
    expect(bridgeCalls).toHaveLength(0);
    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Bridge dispatch + evidence registration
// ---------------------------------------------------------------------------

describe('dispatchUrbanCodeArtifactRequest', () => {
  it('opens a NEW IDE tab (never silent insert) and registers a code-artifact evidence entry', async () => {
    const request = buildPythonScriptRequest(baseSeed());
    const result = await dispatchUrbanCodeArtifactRequest(request);

    expect(bridgeCalls).toHaveLength(1);
    expect(bridgeCalls[0]!.filename).toBe(request.targetFilename);
    expect(bridgeCalls[0]!.language).toBe('python');
    expect(result.bridgeRouted).toBe(true);
    expect(result.tabId).toBe('tab-1');

    const evidence = useUrbanContextStore.getState().evidenceArtifacts;
    expect(evidence).toHaveLength(1);
    const artifact = evidence[0]!;
    expect(artifact.id).toBe(result.evidenceArtifactId);
    expect(artifact.kind).toBe('code-artifact');
    expect(artifact.sourceModule).toBe('urban-analytics');
    expect(artifact.codeArtifactId).toBe(request.artifactId);
    expect(artifact.linkedFilePaths).toEqual([request.targetFilename]);
    expect(artifact.qa.state).toBe('unvalidated');
    expect(artifact.metadata?.language).toBe('python');
    expect(artifact.metadata?.bridgeTabId).toBe('tab-1');
  });

  it('appends the code artifact ID to the sidecar run manifest exactly once', async () => {
    const manifest = makeManifest('run-7');
    useFlowStore.getState().registerManifest(manifest);
    const request = buildPythonScriptRequest(baseSeed({ runId: 'run-7' }));

    await dispatchUrbanCodeArtifactRequest(request);
    await dispatchUrbanCodeArtifactRequest(request);

    const updated = useFlowStore.getState().lookupManifest('run-7');
    expect(updated?.codeArtifactIds).toEqual([request.artifactId]);
  });

  it('skips bridge routing when routeThroughBridge=false but still registers evidence (preview-only mode)', async () => {
    const request = buildJsonManifestRequest(baseSeed());
    const result = await dispatchUrbanCodeArtifactRequest(request, { routeThroughBridge: false });
    expect(bridgeCalls).toHaveLength(0);
    expect(result.bridgeRouted).toBe(false);
    expect(result.tabId).toBeNull();
    expect(useUrbanContextStore.getState().evidenceArtifacts).toHaveLength(1);
  });
});
