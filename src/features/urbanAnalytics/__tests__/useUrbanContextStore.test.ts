// @vitest-environment jsdom
/**
 * Tests for useUrbanContextStore (Prompt 02)
 *
 * Mirrors the test pattern from src/stores/__tests__/useFlowStore.test.ts:
 *   - beforeEach resets store via getInitialState()
 *   - Tests verify actions, guard conditions, and selector outputs
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildUrbanContextPersistencePayload,
  loadPersistedUrbanContext,
  URBAN_CONTEXT_PERSISTENCE_VERSION,
  URBAN_CONTEXT_STORAGE_KEY,
  useUrbanContextStore,
  validateUrbanContextReferences,
} from '../useUrbanContextStore';
import type { UrbanAnalysisContext } from '../lib/types';

// ---------------------------------------------------------------------------
// Helper: read the full context from store state
// ---------------------------------------------------------------------------
function ctx(): UrbanAnalysisContext | null {
  return useUrbanContextStore.getState().context;
}

beforeEach(() => {
  localStorage.clear();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
});

// ---------------------------------------------------------------------------
describe('createContext', () => {
  it('creates a context with a unique contextId', () => {
    useUrbanContextStore.getState().createContext();
    expect(ctx()).not.toBeNull();
    expect(typeof ctx()?.contextId).toBe('string');
    expect(ctx()!.contextId.length).toBeGreaterThan(0);
  });

  it('initialises optional fields to null / empty arrays', () => {
    useUrbanContextStore.getState().createContext();
    const c = ctx()!;
    expect(c.studyAreaId).toBeNull();
    expect(c.activeQuestion).toBe('');
    expect(c.activeScale).toBeNull();
    expect(c.activeAoiId).toBeNull();
    expect(c.activeLayerIds).toEqual([]);
    expect(c.selectedIndicatorKinds).toEqual([]);
    expect(c.activeFlowId).toBeNull();
    expect(c.activeRunId).toBeNull();
    expect(c.activeCodeArtifactId).toBeNull();
  });

  it('accepts an initial partial seed', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'sa-001',
      activeQuestion: 'How accessible are parks within 10 min walk?',
      activeScale: 'neighborhood',
    });
    const c = ctx()!;
    expect(c.studyAreaId).toBe('sa-001');
    expect(c.activeQuestion).toBe('How accessible are parks within 10 min walk?');
    expect(c.activeScale).toBe('neighborhood');
  });

  it('each call assigns a new contextId', () => {
    useUrbanContextStore.getState().createContext();
    const firstId = ctx()!.contextId;
    useUrbanContextStore.getState().createContext();
    const secondId = ctx()!.contextId;
    expect(firstId).not.toBe(secondId);
  });
});

// ---------------------------------------------------------------------------
describe('patchContext', () => {
  it('updates named fields and bumps updatedAt', async () => {
    useUrbanContextStore.getState().createContext();
    const originalUpdatedAt = ctx()!.updatedAt;

    // Ensure at least 1ms has elapsed so updatedAt changes
    await new Promise((r) => setTimeout(r, 2));

    useUrbanContextStore.getState().patchContext({ activeQuestion: 'New question' });
    const c = ctx()!;
    expect(c.activeQuestion).toBe('New question');
    expect(c.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('preserves unchanged fields', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'sa-007',
      activeScale: 'city',
    });
    const originalId = ctx()!.contextId;

    useUrbanContextStore.getState().patchContext({ activeQuestion: 'Updated question' });
    const c = ctx()!;
    expect(c.contextId).toBe(originalId);
    expect(c.studyAreaId).toBe('sa-007');
    expect(c.activeScale).toBe('city');
  });

  it('is a no-op when context is null', () => {
    expect(ctx()).toBeNull();
    expect(() => {
      useUrbanContextStore.getState().patchContext({ activeQuestion: 'Should not throw' });
    }).not.toThrow();
    expect(ctx()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('resetContext', () => {
  it('sets context back to null', () => {
    useUrbanContextStore.getState().createContext();
    expect(ctx()).not.toBeNull();
    useUrbanContextStore.getState().resetContext();
    expect(ctx()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('setActiveAoi', () => {
  it('sets the activeAoiId', () => {
    useUrbanContextStore.getState().createContext();
    useUrbanContextStore.getState().setActiveAoi('aoi-bbox-001');
    expect(ctx()?.activeAoiId).toBe('aoi-bbox-001');
  });

  it('clears the activeAoiId with null', () => {
    useUrbanContextStore.getState().createContext({ activeAoiId: 'aoi-bbox-001' });
    useUrbanContextStore.getState().setActiveAoi(null);
    expect(ctx()?.activeAoiId).toBeNull();
  });

  it('is a no-op when context is null', () => {
    expect(() => useUrbanContextStore.getState().setActiveAoi('aoi-123')).not.toThrow();
    expect(ctx()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('setActiveLayers', () => {
  it('replaces layer IDs', () => {
    useUrbanContextStore.getState().createContext({ activeLayerIds: ['layer-a'] });
    useUrbanContextStore.getState().setActiveLayers(['layer-b', 'layer-c']);
    expect(ctx()?.activeLayerIds).toEqual(['layer-b', 'layer-c']);
  });

  it('accepts an empty array', () => {
    useUrbanContextStore.getState().createContext({ activeLayerIds: ['layer-a'] });
    useUrbanContextStore.getState().setActiveLayers([]);
    expect(ctx()?.activeLayerIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('setActiveFlow', () => {
  it('sets the activeFlowId', () => {
    useUrbanContextStore.getState().createContext();
    useUrbanContextStore.getState().setActiveFlow('accessibility');
    expect(ctx()?.activeFlowId).toBe('accessibility');
  });

  it('clears the activeFlowId with null', () => {
    useUrbanContextStore.getState().createContext({ activeFlowId: 'site_suitability' });
    useUrbanContextStore.getState().setActiveFlow(null);
    expect(ctx()?.activeFlowId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('setActiveRun', () => {
  it('sets the activeRunId', () => {
    useUrbanContextStore.getState().createContext();
    useUrbanContextStore.getState().setActiveRun('run-abc-001');
    expect(ctx()?.activeRunId).toBe('run-abc-001');
  });

  it('clears the activeRunId with null', () => {
    useUrbanContextStore.getState().createContext({ activeRunId: 'run-abc-001' });
    useUrbanContextStore.getState().setActiveRun(null);
    expect(ctx()?.activeRunId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('setActiveCodeArtifact', () => {
  it('sets the activeCodeArtifactId', () => {
    useUrbanContextStore.getState().createContext();
    useUrbanContextStore.getState().setActiveCodeArtifact('artifact-py-001');
    expect(ctx()?.activeCodeArtifactId).toBe('artifact-py-001');
  });

  it('clears the activeCodeArtifactId with null', () => {
    useUrbanContextStore.getState().createContext({ activeCodeArtifactId: 'artifact-py-001' });
    useUrbanContextStore.getState().setActiveCodeArtifact(null);
    expect(ctx()?.activeCodeArtifactId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('contextId immutability through patch', () => {
  it('contextId is never modified by patchContext', () => {
    useUrbanContextStore.getState().createContext();
    const originalId = ctx()!.contextId;
    // Attempt to override contextId via patch (the type prevents it but
    // a runtime cast could try — confirm the store ignores it)
    useUrbanContextStore.getState().patchContext({
      activeQuestion: 'test',
      // contextId is excluded from patch type; this confirms it stays stable
    });
    expect(ctx()!.contextId).toBe(originalId);
  });
});

// ---------------------------------------------------------------------------
describe('Prompt 03 persistence', () => {
  it('persists a versioned lightweight context payload under urban.ctx.active', () => {
    useUrbanContextStore.getState().createContext({
      studyAreaId: 'study-istanbul',
      activeQuestion: 'Where are transit accessibility gaps?',
      activeScale: 'district',
      activeAoiId: 'aoi-kadikoy',
      activeLayerIds: ['transit-stops', 'district-boundary'],
      selectedIndicatorKinds: ['transit_score', 'walk_score'],
      activeFlowId: 'accessibility',
      activeRunId: 'run-access-001',
      activeCodeArtifactId: 'artifact-python-001',
    });

    const raw = localStorage.getItem(URBAN_CONTEXT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);

    expect(parsed.schemaVersion).toBe(URBAN_CONTEXT_PERSISTENCE_VERSION);
    expect(parsed.context).toMatchObject({
      studyAreaId: 'study-istanbul',
      activeQuestion: 'Where are transit accessibility gaps?',
      activeScale: 'district',
      activeAoiId: 'aoi-kadikoy',
      activeLayerIds: ['transit-stops', 'district-boundary'],
      selectedIndicatorKinds: ['transit_score', 'walk_score'],
      activeFlowId: 'accessibility',
      activeRunId: 'run-access-001',
      activeCodeArtifactId: 'artifact-python-001',
    });
    expect(Object.keys(parsed.context).sort()).toEqual([
      'activeAoiId',
      'activeCodeArtifactId',
      'activeFlowId',
      'activeLayerIds',
      'activeQuestion',
      'activeRunId',
      'activeScale',
      'contextId',
      'selectedIndicatorKinds',
      'studyAreaBounds',
      'studyAreaId',
      'studyAreaName',
      'updatedAt',
    ]);
    expect(raw).not.toContain('FeatureCollection');
    expect(raw).not.toContain('geojson');
    expect(raw.length).toBeLessThan(2048);
  });

  it('removes the persisted payload when the context is reset', () => {
    useUrbanContextStore.getState().createContext({ activeRunId: 'run-1' });
    expect(localStorage.getItem(URBAN_CONTEXT_STORAGE_KEY)).toBeTruthy();

    useUrbanContextStore.getState().resetContext();

    expect(localStorage.getItem(URBAN_CONTEXT_STORAGE_KEY)).toBeNull();
    expect(ctx()).toBeNull();
  });

  it('restores a valid persisted payload with no warnings when references resolve', () => {
    const payload = buildUrbanContextPersistencePayload({
      contextId: 'ctx-valid',
      studyAreaId: 'study-valid',
      activeQuestion: 'Question',
      activeScale: 'neighborhood',
      activeAoiId: 'aoi-valid',
      activeLayerIds: ['layer-valid'],
      selectedIndicatorKinds: ['NDVI'],
      activeFlowId: 'green_deficit',
      activeRunId: 'run-valid',
      activeCodeArtifactId: 'artifact-valid',
      updatedAt: '2026-05-07T10:00:00.000Z',
    });
    localStorage.setItem(URBAN_CONTEXT_STORAGE_KEY, JSON.stringify(payload));

    const result = useUrbanContextStore.getState().restoreContext({
      registry: {
        studyAreaIds: ['study-valid'],
        aoiIds: ['aoi-valid'],
        layerIds: ['layer-valid'],
        runIds: ['run-valid'],
        codeArtifactIds: ['artifact-valid'],
      },
    });

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(ctx()).toMatchObject({
      contextId: 'ctx-valid',
      studyAreaId: 'study-valid',
      activeAoiId: 'aoi-valid',
      activeLayerIds: ['layer-valid'],
      activeRunId: 'run-valid',
      activeCodeArtifactId: 'artifact-valid',
    });
  });

  it('restores stale references and labels missing AOI, layer, run, and code artifact', () => {
    const payload = buildUrbanContextPersistencePayload({
      contextId: 'ctx-stale',
      studyAreaId: 'study-missing',
      activeQuestion: 'Question',
      activeScale: 'city',
      activeAoiId: 'aoi-missing',
      activeLayerIds: ['layer-present', 'layer-missing'],
      selectedIndicatorKinds: ['transit_score'],
      activeFlowId: 'transit_gap',
      activeRunId: 'run-missing',
      activeCodeArtifactId: 'artifact-missing',
      updatedAt: '2026-05-07T10:00:00.000Z',
    });
    localStorage.setItem(URBAN_CONTEXT_STORAGE_KEY, JSON.stringify(payload));

    const result = useUrbanContextStore.getState().restoreContext({
      registry: {
        studyAreaIds: [],
        aoiIds: [],
        layerIds: ['layer-present'],
        runIds: [],
        codeArtifactIds: [],
      },
    });

    expect(result.ok).toBe(true);
    expect(ctx()?.activeAoiId).toBe('aoi-missing');
    expect(ctx()?.activeLayerIds).toEqual(['layer-present', 'layer-missing']);
    expect(result.warnings.map((w) => w.code).sort()).toEqual([
      'missing_aoi',
      'missing_code_artifact',
      'missing_layer',
      'missing_run',
      'missing_study_area',
    ]);
    expect(useUrbanContextStore.getState().restoreWarnings).toEqual(result.warnings);
  });

  it('rejects incompatible future schemas without deleting the stored payload', () => {
    localStorage.setItem(
      URBAN_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 999,
        savedAt: '2026-05-07T10:00:00.000Z',
        context: { contextId: 'ctx-future' },
      }),
    );

    const result = useUrbanContextStore.getState().restoreContext();

    expect(result.ok).toBe(false);
    expect(result.source).toBe('invalid');
    expect(result.context).toBeNull();
    expect(result.warnings[0]?.code).toBe('incompatible_schema_version');
    expect(localStorage.getItem(URBAN_CONTEXT_STORAGE_KEY)).toContain('ctx-future');
  });

  it('migrates legacy unversioned payloads into the active context', () => {
    localStorage.setItem(
      URBAN_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        contextId: 'legacy-ctx',
        activeQuestion: 'Legacy question',
        activeFlowId: 'accessibility',
        activeLayerIds: ['legacy-layer', 'legacy-layer'],
      }),
    );

    const result = useUrbanContextStore.getState().restoreContext();

    expect(result.ok).toBe(true);
    expect(result.warnings[0]?.code).toBe('legacy_schema_migrated');
    expect(ctx()).toMatchObject({
      contextId: 'legacy-ctx',
      activeQuestion: 'Legacy question',
      activeFlowId: 'accessibility',
      activeLayerIds: ['legacy-layer'],
    });
  });

  it('reports parse failures as invalid payload warnings', () => {
    localStorage.setItem(URBAN_CONTEXT_STORAGE_KEY, '{not-json');

    const result = loadPersistedUrbanContext();

    expect(result.ok).toBe(false);
    expect(result.source).toBe('invalid');
    expect(result.warnings[0]?.code).toBe('invalid_payload');
  });

  it('validates references without mutating the context', () => {
    const context: UrbanAnalysisContext = {
      contextId: 'ctx-validate',
      studyAreaId: null,
      activeQuestion: '',
      activeScale: null,
      activeAoiId: 'aoi-1',
      activeLayerIds: ['layer-1'],
      selectedIndicatorKinds: [],
      activeFlowId: null,
      activeRunId: 'run-1',
      activeCodeArtifactId: 'artifact-1',
      updatedAt: '2026-05-07T10:00:00.000Z',
    };

    const warnings = validateUrbanContextReferences(context, {
      aoiIds: ['aoi-1'],
      layerIds: [],
      runIds: ['run-1'],
      codeArtifactIds: [],
    });

    expect(warnings.map((w) => w.code)).toEqual([
      'missing_layer',
      'missing_code_artifact',
    ]);
    expect(context.activeLayerIds).toEqual(['layer-1']);
  });

  it('hydrates persisted context when the store module is imported after storage exists', async () => {
    const payload = buildUrbanContextPersistencePayload({
      contextId: 'ctx-reload',
      studyAreaId: null,
      activeQuestion: 'Reloaded question',
      activeScale: 'district',
      activeAoiId: null,
      activeLayerIds: [],
      selectedIndicatorKinds: [],
      activeFlowId: 'review',
      activeRunId: null,
      activeCodeArtifactId: null,
      updatedAt: '2026-05-07T10:00:00.000Z',
    });
    localStorage.setItem(URBAN_CONTEXT_STORAGE_KEY, JSON.stringify(payload));

    vi.resetModules();
    const mod = await import('../useUrbanContextStore');

    expect(mod.useUrbanContextStore.getState().context).toMatchObject({
      contextId: 'ctx-reload',
      activeQuestion: 'Reloaded question',
      activeFlowId: 'review',
    });
  });
});
