/**
 * Prompt 14 — Workflow Runtime Run Manifest
 *
 * Tests covering:
 *   1. buildRunManifest — correct field population
 *   2. resolveLegacyRunManifest — conservative null/unknown defaults
 *   3. assertManifestForFlow — flowId assertion
 *   4. useFlowStore manifest sidecar registry — registerManifest, lookupManifest
 *   5. lookupManifest legacy fallback for runs without a registered manifest
 *   6. reset clears the manifest registry
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  assertManifestForFlow,
  buildRunManifest,
  resolveLegacyRunManifest,
} from '@/features/urbanAnalytics/lib/runManifest';
import type { CompletedAnalysisRun } from '@/features/urbanAnalytics/lib/types';
import { useFlowStore } from '../useFlowStore';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRun(runId: string, flowId: CompletedAnalysisRun['flowId'] = 'accessibility'): CompletedAnalysisRun {
  return {
    runId,
    flowId,
    label: `Run ${runId}`,
    insertedAt: '2026-05-08T10:00:00.000Z',
    paragraph: 'summary',
    paragraphPreview: 'summary',
    paragraphFull: 'summary',
    mapOutputs: [],
    chartOutputs: [],
    dataOutputs: [],
  };
}

// ---------------------------------------------------------------------------
// Store reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  useFlowStore.setState(useFlowStore.getInitialState());
});

// ---------------------------------------------------------------------------
// buildRunManifest
// ---------------------------------------------------------------------------

describe('buildRunManifest', () => {
  it('populates all fields from the supplied options', () => {
    const run = makeRun('run-001');

    const manifest = buildRunManifest(run, {
      contextId: 'ctx-abc',
      inputs: { layerId: 'lyr-1', threshold: 15 },
      parameters: { weightingMethod: 'ahp' },
      methodValidity: null,
      dataFitness: null,
      mapArtifactIds: ['map-1'],
      codeArtifactIds: ['code-1'],
      reportInsertIds: ['rpt-1'],
      dashboardBindingIds: [],
      indicatorResultIds: ['ind-1', 'ind-2'],
      runtimeMode: 'live',
    });

    expect(manifest.runId).toBe('run-001');
    expect(manifest.flowId).toBe('accessibility');
    expect(manifest.contextId).toBe('ctx-abc');
    expect(manifest.inputs).toEqual({ layerId: 'lyr-1', threshold: 15 });
    expect(manifest.parameters).toEqual({ weightingMethod: 'ahp' });
    expect(manifest.methodValidity).toBeNull();
    expect(manifest.dataFitness).toBeNull();
    expect(manifest.mapArtifactIds).toEqual(['map-1']);
    expect(manifest.codeArtifactIds).toEqual(['code-1']);
    expect(manifest.reportInsertIds).toEqual(['rpt-1']);
    expect(manifest.dashboardBindingIds).toEqual([]);
    expect(manifest.indicatorResultIds).toEqual(['ind-1', 'ind-2']);
    expect(manifest.runtimeMode).toBe('live');
    expect(manifest.readiness).toBeNull();
    expect(new Date(manifest.createdAt).getTime()).not.toBeNaN();
  });

  it('defaults inputs, parameters, and artifact arrays to empty when omitted', () => {
    const manifest = buildRunManifest(makeRun('run-002'), { contextId: null });

    expect(manifest.inputs).toEqual({});
    expect(manifest.parameters).toEqual({});
    expect(manifest.mapArtifactIds).toEqual([]);
    expect(manifest.codeArtifactIds).toEqual([]);
    expect(manifest.reportInsertIds).toEqual([]);
    expect(manifest.dashboardBindingIds).toEqual([]);
    expect(manifest.indicatorResultIds).toEqual([]);
  });

  it('defaults runtimeMode to "live" when not specified', () => {
    const manifest = buildRunManifest(makeRun('run-003'), { contextId: null });
    expect(manifest.runtimeMode).toBe('live');
  });

  it('records demo mode when explicitly set', () => {
    const manifest = buildRunManifest(makeRun('run-004'), {
      contextId: null,
      runtimeMode: 'demo',
    });
    expect(manifest.runtimeMode).toBe('demo');
  });

  it('records readiness snapshot when provided', () => {
    const manifest = buildRunManifest(makeRun('run-005'), {
      contextId: null,
      runtimeMode: 'demo',
      readiness: {
        status: 'demo_only',
        runtimeMode: 'demo',
        reasons: ['Demo execution mode is enabled.'],
        remediationActions: ['Keep demo labels visible in downstream outputs.'],
        issues: [{ code: 'runtime:demo', severity: 'warning', message: 'Demo mode active.' }],
        checkedAt: '2026-05-08T12:00:00.000Z',
      },
    });
    expect(manifest.readiness?.status).toBe('demo_only');
    expect(manifest.readiness?.issues).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// resolveLegacyRunManifest
// ---------------------------------------------------------------------------

describe('resolveLegacyRunManifest', () => {
  it('produces a manifest with unknown runtimeMode and null fitness/validity', () => {
    const run = makeRun('legacy-run-1', 'site_suitability');
    const manifest = resolveLegacyRunManifest(run);

    expect(manifest.runId).toBe('legacy-run-1');
    expect(manifest.flowId).toBe('site_suitability');
    expect(manifest.runtimeMode).toBe('unknown');
    expect(manifest.readiness).toBeNull();
    expect(manifest.contextId).toBeNull();
    expect(manifest.methodValidity).toBeNull();
    expect(manifest.dataFitness).toBeNull();
  });

  it('sets all artifact ID arrays to empty', () => {
    const manifest = resolveLegacyRunManifest(makeRun('legacy-run-2'));

    expect(manifest.mapArtifactIds).toEqual([]);
    expect(manifest.codeArtifactIds).toEqual([]);
    expect(manifest.reportInsertIds).toEqual([]);
    expect(manifest.dashboardBindingIds).toEqual([]);
    expect(manifest.indicatorResultIds).toEqual([]);
  });

  it('preserves the run insertedAt as createdAt', () => {
    const run = makeRun('legacy-run-3');
    const manifest = resolveLegacyRunManifest(run);
    expect(manifest.createdAt).toBe(run.insertedAt);
  });

  it('sets inputs and parameters to empty objects', () => {
    const manifest = resolveLegacyRunManifest(makeRun('legacy-run-4'));
    expect(manifest.inputs).toEqual({});
    expect(manifest.parameters).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// assertManifestForFlow
// ---------------------------------------------------------------------------

describe('assertManifestForFlow', () => {
  it('does not throw when flowId matches', () => {
    const manifest = buildRunManifest(makeRun('run-match'), { contextId: null });
    expect(() => assertManifestForFlow(manifest, 'accessibility')).not.toThrow();
  });

  it('throws when flowId does not match', () => {
    const manifest = buildRunManifest(makeRun('run-mismatch', 'vulnerability'), { contextId: null });
    expect(() => assertManifestForFlow(manifest, 'accessibility')).toThrow(/flowId mismatch/);
  });
});

// ---------------------------------------------------------------------------
// useFlowStore — manifest sidecar registry
// ---------------------------------------------------------------------------

describe('useFlowStore manifest registry', () => {
  it('registerManifest stores a manifest keyed by runId', () => {
    const run = makeRun('reg-001');
    const manifest = buildRunManifest(run, { contextId: 'ctx-1', runtimeMode: 'live' });

    useFlowStore.getState().registerManifest(manifest);

    const stored = useFlowStore.getState().manifests['reg-001'];
    expect(stored).toBeDefined();
    expect(stored?.runtimeMode).toBe('live');
    expect(stored?.contextId).toBe('ctx-1');
  });

  it('registerManifest overwrites an existing manifest for the same runId', () => {
    const run = makeRun('reg-002');

    const v1 = buildRunManifest(run, { contextId: 'ctx-v1', runtimeMode: 'demo' });
    const v2 = buildRunManifest(run, { contextId: 'ctx-v2', runtimeMode: 'live' });

    useFlowStore.getState().registerManifest(v1);
    useFlowStore.getState().registerManifest(v2);

    const stored = useFlowStore.getState().manifests['reg-002'];
    expect(stored?.runtimeMode).toBe('live');
    expect(stored?.contextId).toBe('ctx-v2');
  });

  it('lookupManifest returns the registered manifest when present', () => {
    const run = makeRun('lookup-001');
    const manifest = buildRunManifest(run, { contextId: 'ctx-x', runtimeMode: 'synthetic' });

    useFlowStore.getState().registerManifest(manifest);

    const result = useFlowStore.getState().lookupManifest('lookup-001');
    expect(result).not.toBeNull();
    expect(result?.runtimeMode).toBe('synthetic');
  });

  it('lookupManifest returns null for an entirely unknown runId', () => {
    const result = useFlowStore.getState().lookupManifest('does-not-exist');
    expect(result).toBeNull();
  });

  it('lookupManifest falls back to a legacy manifest for runs in completedRuns with no manifest', () => {
    const run = makeRun('legacy-fallback-1', 'scenario_comparison');
    useFlowStore.getState().upsertCompletedRun(run);

    // No registerManifest call — should fall back
    const result = useFlowStore.getState().lookupManifest('legacy-fallback-1');
    expect(result).not.toBeNull();
    expect(result?.runtimeMode).toBe('unknown');
    expect(result?.contextId).toBeNull();
    expect(result?.flowId).toBe('scenario_comparison');
  });

  it('lookupManifest prefers registered manifest over legacy fallback', () => {
    const run = makeRun('prefer-registered');
    useFlowStore.getState().upsertCompletedRun(run);

    const manifest = buildRunManifest(run, { contextId: 'ctx-real', runtimeMode: 'live' });
    useFlowStore.getState().registerManifest(manifest);

    const result = useFlowStore.getState().lookupManifest('prefer-registered');
    expect(result?.runtimeMode).toBe('live');
    expect(result?.contextId).toBe('ctx-real');
  });

  it('reset clears the manifest registry', () => {
    const run = makeRun('reset-test');
    const manifest = buildRunManifest(run, { contextId: null });
    useFlowStore.getState().registerManifest(manifest);

    useFlowStore.getState().reset();

    expect(useFlowStore.getState().manifests).toEqual({});
    expect(useFlowStore.getState().lookupManifest('reset-test')).toBeNull();
  });

  it('registering a manifest does not affect active flow state', () => {
    useFlowStore.getState().startFlow('equity_audit');
    useFlowStore.getState().nextStep();
    useFlowStore.getState().setStepData('demographics', { source: 'census' });

    const manifest = buildRunManifest(makeRun('side-effect-check'), { contextId: null });
    useFlowStore.getState().registerManifest(manifest);

    const state = useFlowStore.getState();
    expect(state.activeFlow).toBe('equity_audit');
    expect(state.currentStep).toBe(1);
    expect(state.stepData).toEqual({ demographics: { source: 'census' } });
  });
});
