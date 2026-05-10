// @vitest-environment jsdom
/**
 * Tests for useFlowStore bounds enforcement (Prompt 27 / Prompt 28 QA)
 *
 * Verifies that completedRuns and manifests are capped at their
 * respective MAX limits to prevent unbounded growth in long sessions.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useFlowStore } from '../useFlowStore';
import type { CompletedAnalysisRun, UrbanWorkflowRunManifest } from '@/features/urbanAnalytics/lib/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRun(index: number): CompletedAnalysisRun {
  return {
    runId: `run-${String(index).padStart(4, '0')}`,
    flowId: 'accessibility',
    label: `Run ${index}`,
    insertedAt: `2026-05-10T${String(index % 24).padStart(2, '0')}:00:00.000Z`,
    paragraph: `Narrative ${index}.`,
    paragraphPreview: `Preview ${index}.`,
    paragraphFull: `Full narrative ${index}.`,
    mapOutputs: [],
    chartOutputs: [],
    dataOutputs: [],
  };
}

function makeManifest(index: number): UrbanWorkflowRunManifest {
  return {
    runId: `run-${String(index).padStart(4, '0')}`,
    flowId: 'accessibility',
    contextId: null,
    inputs: {},
    parameters: {},
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: [],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode: 'live',
    readiness: null,
    createdAt: `2026-05-10T${String(index % 24).padStart(2, '0')}:00:00.000Z`,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
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
});

// ---------------------------------------------------------------------------
describe('completedRuns bounds', () => {
  it('caps completedRuns at 200 entries via completeFlow', () => {
    const store = useFlowStore.getState();

    for (let i = 0; i < 210; i++) {
      store.completeFlow(makeRun(i));
    }

    const runs = useFlowStore.getState().completedRuns;
    expect(runs.length).toBe(200);
    // Oldest runs are pruned — run-0010 should be the first remaining
    expect(runs[0].runId).toBe('run-0010');
    expect(runs[199].runId).toBe('run-0209');
  });

  it('caps completedRuns at 200 entries via upsertCompletedRun (new inserts)', () => {
    const store = useFlowStore.getState();

    for (let i = 0; i < 205; i++) {
      store.upsertCompletedRun(makeRun(i));
    }

    const runs = useFlowStore.getState().completedRuns;
    expect(runs.length).toBe(200);
    expect(runs[0].runId).toBe('run-0005');
    expect(runs[199].runId).toBe('run-0204');
  });

  it('upsertCompletedRun updates in place without growing the array', () => {
    const store = useFlowStore.getState();

    for (let i = 0; i < 5; i++) {
      store.upsertCompletedRun(makeRun(i));
    }
    expect(useFlowStore.getState().completedRuns.length).toBe(5);

    // Upsert existing run
    const updated = makeRun(2);
    updated.label = 'Updated run 2';
    store.upsertCompletedRun(updated);

    const runs = useFlowStore.getState().completedRuns;
    expect(runs.length).toBe(5);
    expect(runs[2].label).toBe('Updated run 2');
  });
});

// ---------------------------------------------------------------------------
describe('manifests bounds', () => {
  it('caps manifests at 200 entries via registerManifest', () => {
    const store = useFlowStore.getState();

    for (let i = 0; i < 210; i++) {
      store.registerManifest(makeManifest(i));
    }

    const manifests = useFlowStore.getState().manifests;
    const keys = Object.keys(manifests);
    expect(keys.length).toBe(200);
    // Oldest entries (run-0000 through run-0009) should have been pruned
    expect(manifests['run-0000']).toBeUndefined();
    expect(manifests['run-0009']).toBeUndefined();
    expect(manifests['run-0010']).toBeDefined();
    expect(manifests['run-0209']).toBeDefined();
  });

  it('registerManifest overwrites existing entry without changing count', () => {
    const store = useFlowStore.getState();

    for (let i = 0; i < 5; i++) {
      store.registerManifest(makeManifest(i));
    }
    expect(Object.keys(useFlowStore.getState().manifests).length).toBe(5);

    // Overwrite with updated data
    const updated = makeManifest(2);
    updated.runtimeMode = 'demo';
    store.registerManifest(updated);

    const manifests = useFlowStore.getState().manifests;
    expect(Object.keys(manifests).length).toBe(5);
    expect(manifests['run-0002'].runtimeMode).toBe('demo');
  });
});
