// @vitest-environment jsdom
/**
 * Tests for educationArtifactBuilder.ts (Prompt 22 / Prompt 28 QA)
 *
 * Covers resolveUrbanLearningPath logic: source resolution, derived
 * prerequisites/steps/intermediate values, and null-safe fallbacks.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '../../lib/types';

// ---------------------------------------------------------------------------
// Mocks — education module dependencies
// ---------------------------------------------------------------------------

vi.mock('@/features/education/learningPaths', () => ({
  LEARNING_PATHS: [
    { id: 'lp-transit', title: 'Transit Accessibility', lessons: [] },
    { id: 'lp-climate', title: 'Climate Resilience', lessons: [] },
  ],
}));

vi.mock('@/features/education/methodologyData', () => ({
  getMethodologyExplainer: (id: string) => {
    const map: Record<string, { title: string }> = {
      'exp-morans-i': { title: "Understanding Moran's I" },
      'exp-hotspot': { title: 'Hot Spot Analysis' },
    };
    return map[id] ?? null;
  },
}));

vi.mock('@/features/education/navigation', () => ({
  openEducationWorkspace: vi.fn(),
}));

vi.mock('@/centerpanel/Flows/flowLibraryMeta', () => ({
  FLOW_LIBRARY_ITEMS: [
    {
      flowId: 'accessibility',
      learningPath: {
        methodId: 'flow-access-method',
        pathId: 'lp-transit',
        explainerId: 'exp-morans-i',
        concepts: ['isochrone'],
        prerequisites: ['GTFS data'],
        intermediateValues: [],
        interpretationPrompts: ['Consider modal split.'],
        teachingSteps: [],
      },
    },
  ],
}));

import { resolveUrbanLearningPath } from '../educationArtifactBuilder';
import { useUrbanContextStore } from '../../useUrbanContextStore';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeCard(overrides?: Partial<Card>): Card {
  return {
    id: 'card-test-001',
    title: 'Transit Gap Analysis',
    sectionId: 'accessibility',
    summary: 'Identify gaps in transit coverage.',
    tags: ['transit', 'accessibility', 'equity'],
    methodology: '1. Compute isochrones.\n2. Overlay demographics.\n3. Calculate gap index.',
    limitations: 'Requires GTFS feed. Schedule-based only.',
    validityEnvelope: {
      requiredFields: ['stop_id', 'geometry'],
      requiredGeometryTypes: ['Point', 'Polygon'],
      requiresProjectedCrs: true,
      minimumFeatureCount: 50,
      assumptions: ['Transit coverage is isotropic.', 'Walking speed is 4.5 km/h.'],
      interpretationWarnings: ['Gap index does not capture informal transport.'],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

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
describe('resolveUrbanLearningPath', () => {
  it('returns null when card has no learningPath and flowId is null', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: null,
    });
    expect(result).toBeNull();
  });

  it('resolves from flow library when card has no learningPath', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
    });
    expect(result).not.toBeNull();
    expect(result!.reference.methodId).toBe('flow-access-method');
    expect(result!.pathTitle).toBe('Transit Accessibility');
    expect(result!.explainerTitle).toBe("Understanding Moran's I");
  });

  it('resolves from card learningPath when present', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({
        learningPath: {
          methodId: 'card-method-001',
          pathId: 'lp-climate',
          explainerId: 'exp-hotspot',
          concepts: ['heat island'],
          prerequisites: ['Temperature grid'],
          intermediateValues: [],
          interpretationPrompts: ['Consider urban form.'],
        },
      }),
      flowId: null,
    });
    expect(result).not.toBeNull();
    expect(result!.reference.methodId).toBe('card-method-001');
    expect(result!.pathTitle).toBe('Climate Resilience');
    expect(result!.explainerTitle).toBe('Hot Spot Analysis');
  });

  it('derives prerequisites from validity envelope when source has none', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
    });
    expect(result).not.toBeNull();
    const prereqs = result!.reference.prerequisites;
    expect(prereqs).toContain('GTFS data');
    expect(prereqs.some((p) => p.includes('stop_id'))).toBe(true);
    expect(prereqs.some((p) => p.includes('Point'))).toBe(true);
    expect(prereqs.some((p) => p.includes('Projected CRS'))).toBe(true);
  });

  it('derives teaching steps from assumptions and limitations when source has none', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
    });
    expect(result).not.toBeNull();
    const steps = result!.reference.teachingSteps;
    expect(steps.length).toBeGreaterThan(0);
    const sources = steps.map((s) => s.source);
    expect(sources).toContain('assumption');
    expect(sources).toContain('limitation');
  });

  it('derives intermediate values from methodology bullets when source has none', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
    });
    expect(result).not.toBeNull();
    const ivs = result!.reference.intermediateValues;
    expect(ivs.length).toBeGreaterThan(0);
    expect(ivs[0].source).toBe('methodology');
    expect(ivs[0].description).toContain('isochrones');
  });

  it('includes card tags as concepts', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
    });
    expect(result).not.toBeNull();
    const concepts = result!.reference.concepts;
    expect(concepts).toContain('isochrone');
    expect(concepts).toContain('transit');
  });

  it('caps evidence artifact IDs at 16', () => {
    const manyIds = Array.from({ length: 20 }, (_, i) => `art-${i}`);
    const result = resolveUrbanLearningPath({
      card: makeCard({ learningPath: undefined }),
      flowId: 'accessibility',
      linkedArtifactIds: manyIds,
    });
    expect(result).not.toBeNull();
    expect(result!.reference.evidenceArtifactIds.length).toBeLessThanOrEqual(16);
  });

  it('returns null pathTitle for unknown pathId', () => {
    const result = resolveUrbanLearningPath({
      card: makeCard({
        learningPath: {
          methodId: 'test',
          pathId: 'lp-nonexistent' as any,
          concepts: ['x'],
          prerequisites: [],
          intermediateValues: [],
          interpretationPrompts: [],
        },
      }),
    });
    expect(result).not.toBeNull();
    expect(result!.pathTitle).toBeNull();
  });
});
