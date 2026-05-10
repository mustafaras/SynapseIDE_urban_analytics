/**
 * Synapse Evidence — Prompt 25 unit tests.
 *
 * Pure-function coverage for the evidence registry helpers. No store
 * coupling: each test constructs a `SynapseArtifactEntry[]` fixture and
 * asserts selector / summarizer / eligibility behavior.
 */

import { describe, expect, it } from 'vitest';
import type { SynapseArtifactEntry } from '../../types/synapse-workspace';
import {
  EVIDENCE_SUMMARY_DEFAULT_MAX_CHARS,
  evaluateEvidenceEligibility,
  findArtifactById,
  findArtifactByUri,
  selectArtifactsByModule,
  selectArtifactsByScenario,
  selectArtifactsByStatus,
  selectArtifactsByType,
  selectArtifactsByValidation,
  selectRecentArtifacts,
  summarizeEvidenceForAi,
} from '../synapseEvidence';

function makeEntry(
  partial: Partial<SynapseArtifactEntry> & Pick<SynapseArtifactEntry, 'id' | 'type'>,
): SynapseArtifactEntry {
  return {
    title: partial.title ?? `Artifact ${partial.id}`,
    status: partial.status ?? 'active',
    updatedAt: partial.updatedAt ?? '2025-01-01T00:00:00.000Z',
    provenance: partial.provenance ?? {
      sourceModule: 'ide',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    ...partial,
  };
}

const fixtures: SynapseArtifactEntry[] = [
  makeEntry({
    id: 'a1',
    type: 'spatial-layer',
    uri: '/data/layer.geojson',
    spatialRef: 'EPSG:4326',
    updatedAt: '2025-03-10T10:00:00.000Z',
    provenance: { sourceModule: 'map-explorer', createdAt: '2025-03-10T10:00:00.000Z' },
    confidence: 0.9,
  }),
  makeEntry({
    id: 'a2',
    type: 'analysis-result',
    uri: '/results/r1.csv',
    scenarioId: 'sc-1',
    updatedAt: '2025-03-11T10:00:00.000Z',
    provenance: { sourceModule: 'urban-analytics', createdAt: '2025-03-11T10:00:00.000Z' },
    uncertainty: { confidence: 0.42, caveats: ['Sparse sample in north quadrant'] },
    validationState: 'validated',
  }),
  makeEntry({
    id: 'a3',
    type: 'scenario',
    scenarioId: 'sc-1',
    updatedAt: '2025-03-09T10:00:00.000Z',
    provenance: { sourceModule: 'urban-analytics', createdAt: '2025-03-09T10:00:00.000Z' },
    status: 'archived',
  }),
  makeEntry({
    id: 'a4',
    type: 'generated-patch',
    uri: '/src/feature.ts',
    fileRange: { startLine: 10, endLine: 42 },
    updatedAt: '2025-03-12T10:00:00.000Z',
    provenance: { sourceModule: 'ide', createdAt: '2025-03-12T10:00:00.000Z' },
    validationState: 'failed',
  }),
];

describe('synapseEvidence selectors', () => {
  it('filters by type and sorts newest first', () => {
    const r = selectArtifactsByType(fixtures, 'analysis-result');
    expect(r.map((a) => a.id)).toEqual(['a2']);
  });

  it('filters by source module', () => {
    const r = selectArtifactsByModule(fixtures, 'urban-analytics');
    expect(r.map((a) => a.id)).toEqual(['a2', 'a3']);
  });

  it('filters by scenario id', () => {
    const r = selectArtifactsByScenario(fixtures, 'sc-1');
    expect(r.map((a) => a.id)).toEqual(['a2', 'a3']);
    expect(selectArtifactsByScenario(fixtures, '')).toEqual([]);
  });

  it('filters by status', () => {
    expect(selectArtifactsByStatus(fixtures, 'archived').map((a) => a.id)).toEqual(['a3']);
    expect(selectArtifactsByStatus(fixtures, 'active')).toHaveLength(3);
  });

  it('filters by validation state with default unvalidated', () => {
    expect(selectArtifactsByValidation(fixtures, 'validated').map((a) => a.id)).toEqual(['a2']);
    expect(selectArtifactsByValidation(fixtures, 'failed').map((a) => a.id)).toEqual(['a4']);
    expect(selectArtifactsByValidation(fixtures, 'unvalidated').map((a) => a.id)).toEqual([
      'a1',
      'a3',
    ]);
  });

  it('finds by uri and id', () => {
    expect(findArtifactByUri(fixtures, '/results/r1.csv')?.id).toBe('a2');
    expect(findArtifactByUri(fixtures, '')).toBeUndefined();
    expect(findArtifactById(fixtures, 'a4')?.type).toBe('generated-patch');
    expect(findArtifactById(fixtures, '')).toBeUndefined();
  });

  it('returns recent artifacts up to limit, newest first', () => {
    const r = selectRecentArtifacts(fixtures, 2);
    expect(r.map((a) => a.id)).toEqual(['a4', 'a2']);
    expect(selectRecentArtifacts(fixtures, 0)).toEqual([]);
    expect(selectRecentArtifacts(fixtures, -3)).toEqual([]);
  });

  it('selectors do not mutate input array', () => {
    const before = fixtures.map((a) => a.id).join(',');
    selectArtifactsByType(fixtures, 'spatial-layer');
    selectRecentArtifacts(fixtures, 10);
    expect(fixtures.map((a) => a.id).join(',')).toBe(before);
  });
});

describe('evaluateEvidenceEligibility', () => {
  it('reports counts and capability flags', () => {
    const e = evaluateEvidenceEligibility(fixtures);
    expect(e.hasAny).toBe(true);
    expect(e.hasActive).toBe(true);
    expect(e.countsByType['spatial-layer']).toBe(1);
    expect(e.countsByType['analysis-result']).toBe(1);
    expect(e.countsByType['generated-patch']).toBe(1);
    expect(e.canSendSpatialEvidenceToMap).toBe(true);
    expect(e.canOpenScenarioFromEvidence).toBe(true);
    expect(e.canOpenAnalysisResultInEditor).toBe(true);
    expect(e.canReplayGeneratedPatch).toBe(true);
  });

  it('handles empty registry', () => {
    const e = evaluateEvidenceEligibility([]);
    expect(e.hasAny).toBe(false);
    expect(e.hasActive).toBe(false);
    expect(e.canSendSpatialEvidenceToMap).toBe(false);
    expect(e.canOpenScenarioFromEvidence).toBe(false);
    expect(e.canReplayGeneratedPatch).toBe(false);
  });

  it('hasActive is false when no active artifact exists', () => {
    const archivedOnly: SynapseArtifactEntry[] = [
      makeEntry({ id: 'x', type: 'code', status: 'archived' }),
    ];
    expect(evaluateEvidenceEligibility(archivedOnly).hasActive).toBe(false);
  });
});

describe('summarizeEvidenceForAi', () => {
  it('returns empty string when no artifacts', () => {
    expect(summarizeEvidenceForAi([])).toBe('');
  });

  it('renders newest first with metadata', () => {
    const out = summarizeEvidenceForAi(fixtures);
    expect(out).toContain('### Evidence Artifacts');
    // a4 is newest
    const a4Idx = out.indexOf('a4');
    const a1Idx = out.indexOf('/data/layer.geojson');
    expect(a4Idx).toBeGreaterThan(0);
    expect(a4Idx).toBeLessThan(a1Idx);
    expect(out).toContain('module=ide');
    expect(out).toContain('module=urban-analytics');
    expect(out).toContain('module=map-explorer');
    expect(out).toContain('confidence=0.42'); // uncertainty.confidence wins
    expect(out).toContain('confidence=0.9'); // legacy top-level
    expect(out).toContain('validation=validated');
    expect(out).toContain('validation=failed');
    expect(out).toContain('crs=EPSG:4326');
    expect(out).toContain('L10-42');
    expect(out).toContain('caveat="Sparse sample in north quadrant"');
  });

  it('respects scenario filter', () => {
    const out = summarizeEvidenceForAi(fixtures, { scenarioId: 'sc-1' });
    expect(out).toContain('a2');
    expect(out).toContain('a3');
    expect(out).not.toContain('a4');
    expect(out).not.toContain('a1');
  });

  it('respects type filter', () => {
    const out = summarizeEvidenceForAi(fixtures, { types: ['spatial-layer'] });
    expect(out).toContain('a1');
    expect(out).not.toContain('a2');
    expect(out).not.toContain('a3');
    expect(out).not.toContain('a4');
  });

  it('honors maxChars ceiling', () => {
    const out = summarizeEvidenceForAi(fixtures, { maxChars: 400 });
    expect(out.length).toBeLessThanOrEqual(420); // small slack for trailing newline
  });

  it('honors limit', () => {
    const out = summarizeEvidenceForAi(fixtures, { limit: 1 });
    // Newest only — a4
    expect(out).toContain('a4');
    expect(out).not.toContain('a2');
    expect(out).not.toContain('a1');
  });

  it('clamps confidence into [0,1]', () => {
    const weird: SynapseArtifactEntry[] = [
      makeEntry({ id: 'k', type: 'code', confidence: 5 }),
      makeEntry({ id: 'k2', type: 'code', confidence: -2 }),
    ];
    const out = summarizeEvidenceForAi(weird);
    expect(out).toContain('confidence=1');
    expect(out).toContain('confidence=0');
  });

  it('default ceiling is reasonable', () => {
    expect(EVIDENCE_SUMMARY_DEFAULT_MAX_CHARS).toBeGreaterThan(512);
    expect(EVIDENCE_SUMMARY_DEFAULT_MAX_CHARS).toBeLessThanOrEqual(4096);
  });

  it('returns empty when filtered pool is empty', () => {
    expect(summarizeEvidenceForAi(fixtures, { scenarioId: 'nope' })).toBe('');
  });
});
