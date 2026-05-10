// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { SynapseArtifactEntry } from '@/types/synapse-workspace';
import { clearAllSynapseFiles } from '@/utils/synapseMemory';
import { useSynapseWorkspaceStore } from '../useSynapseWorkspaceStore';

const ISO = '2026-05-06T00:00:00.000Z';

const makeArtifact = (
  overrides: Partial<SynapseArtifactEntry> & { id: string },
): SynapseArtifactEntry => ({
  id: overrides.id,
  type: overrides.type ?? 'code',
  title: overrides.title ?? overrides.id,
  status: overrides.status ?? 'active',
  provenance: overrides.provenance ?? {
    sourceModule: 'synapse-ide',
    createdAt: ISO,
  },
  updatedAt: overrides.updatedAt ?? ISO,
  ...(overrides.uri !== undefined ? { uri: overrides.uri } : {}),
  ...(overrides.validationState !== undefined
    ? { validationState: overrides.validationState }
    : {}),
});

const resetStore = () => {
  useSynapseWorkspaceStore.setState({
    workspace: null,
    artifacts: [],
    applyHistoryRefs: [],
    isHydrated: false,
    storageSource: 'none',
  });
};

beforeEach(() => {
  resetStore();
  try {
    clearAllSynapseFiles();
    localStorage.clear();
  } catch {}
});

describe('useSynapseWorkspaceStore — Prompt 27 stale-state recovery', () => {
  it('marks artifacts whose local URI no longer resolves as validationState=stale', () => {
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({ id: 'art-1', uri: 'src/missing.ts' }),
    );

    useSynapseWorkspaceStore.getState().recoverRestoredArtifacts([
      'src/present.ts',
    ]);

    const entry = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.id === 'art-1');
    expect(entry?.validationState).toBe('stale');
  });

  it('clears stale marker when the artifact URI resolves again', () => {
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({
        id: 'art-1',
        uri: 'src/present.ts',
        validationState: 'stale',
      }),
    );

    useSynapseWorkspaceStore
      .getState()
      .recoverRestoredArtifacts(['src/present.ts']);

    const entry = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.id === 'art-1');
    expect(entry?.validationState).toBeUndefined();
  });

  it('leaves resolving artifacts untouched (no spurious validationState)', () => {
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({ id: 'art-ok', uri: 'src/present.ts' }),
    );

    useSynapseWorkspaceStore
      .getState()
      .recoverRestoredArtifacts(['src/present.ts']);

    const entry = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.id === 'art-ok');
    expect(entry?.validationState).toBeUndefined();
  });

  it('skips external URI schemes (http, https, synapse://, bus://, mem:, blob:, data:)', () => {
    const cases: Array<{ id: string; uri: string }> = [
      { id: 'http', uri: 'http://example.com/x' },
      { id: 'https', uri: 'https://example.com/x' },
      { id: 'synapse', uri: 'synapse://workspace/x' },
      { id: 'bus', uri: 'bus://module/x' },
      { id: 'mem', uri: 'mem:layer-123' },
      { id: 'blob', uri: 'blob:abc' },
      { id: 'data', uri: 'data:text/plain;base64,QQ==' },
    ];

    for (const c of cases) {
      useSynapseWorkspaceStore.getState().registerArtifact(
        makeArtifact({ id: c.id, uri: c.uri }),
      );
    }

    useSynapseWorkspaceStore
      .getState()
      .recoverRestoredArtifacts([] /* empty tree on purpose */);

    const arts = useSynapseWorkspaceStore.getState().artifacts;
    for (const c of cases) {
      const entry = arts.find((a) => a.id === c.id);
      expect(entry, `entry for ${c.id}`).toBeDefined();
      expect(entry?.validationState, `${c.id} should not be marked stale`).toBeUndefined();
    }
  });

  it('treats file:// URIs as local and resolves their bare path', () => {
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({ id: 'file-ok', uri: 'file://src/present.ts' }),
    );
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({ id: 'file-missing', uri: 'file://src/gone.ts' }),
    );

    useSynapseWorkspaceStore
      .getState()
      .recoverRestoredArtifacts(['src/present.ts']);

    const arts = useSynapseWorkspaceStore.getState().artifacts;
    expect(
      arts.find((a) => a.id === 'file-ok')?.validationState,
    ).toBeUndefined();
    expect(
      arts.find((a) => a.id === 'file-missing')?.validationState,
    ).toBe('stale');
  });

  it('is a no-op when artifacts array is empty', () => {
    expect(() =>
      useSynapseWorkspaceStore
        .getState()
        .recoverRestoredArtifacts(['src/anything.ts']),
    ).not.toThrow();
    expect(useSynapseWorkspaceStore.getState().artifacts).toEqual([]);
  });

  it('handles leading-slash path normalization symmetrically', () => {
    useSynapseWorkspaceStore.getState().registerArtifact(
      makeArtifact({ id: 'leading', uri: '/src/present.ts' }),
    );

    useSynapseWorkspaceStore
      .getState()
      .recoverRestoredArtifacts(['src/present.ts']);

    const entry = useSynapseWorkspaceStore
      .getState()
      .artifacts.find((a) => a.id === 'leading');
    expect(entry?.validationState).toBeUndefined();
  });
});
