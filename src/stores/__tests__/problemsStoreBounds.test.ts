import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDiagnosticId,
  MAX_DIAGNOSTICS,
  useProblemsStore,
} from '../problemsStore';
import type { DiagnosticInput } from '../problemsStore';

// ── helpers ───────────────────────────────────────────────────────────────────

const d = (
  overrides: Partial<DiagnosticInput> & { message: string },
): DiagnosticInput => ({
  source: 'monaco',
  severity: 'error',
  ...overrides,
});

beforeEach(() => {
  useProblemsStore.getState().clearAllDiagnostics();
});

// ── upsertDiagnostic ──────────────────────────────────────────────────────────

describe('problemsStore — upsertDiagnostic (Prompt 07 / 28)', () => {
  it('inserts a new diagnostic and returns it', () => {
    const result = useProblemsStore
      .getState()
      .upsertDiagnostic(d({ message: 'Type error.' }));
    expect(result.id).toMatch(/^diag:/);
    expect(useProblemsStore.getState().diagnostics).toHaveLength(1);
  });

  it('updates existing diagnostic by id rather than duplicating', () => {
    const first = useProblemsStore
      .getState()
      .upsertDiagnostic(d({ message: 'Error A.', file: 'src/a.ts' }));
    // Upsert the same content → same id → should not duplicate
    useProblemsStore
      .getState()
      .upsertDiagnostic(d({ message: 'Error A.', file: 'src/a.ts' }));

    expect(useProblemsStore.getState().diagnostics).toHaveLength(1);
    expect(useProblemsStore.getState().diagnostics[0].id).toBe(first.id);
  });

  it('updates severity counts after upsert', () => {
    useProblemsStore
      .getState()
      .upsertDiagnostic(d({ message: 'Err.', severity: 'error' }));
    useProblemsStore
      .getState()
      .upsertDiagnostic(d({ message: 'Warn.', severity: 'warning' }));

    const counts = useProblemsStore.getState().severityCounts;
    expect(counts.error).toBe(1);
    expect(counts.warning).toBe(1);
  });
});

// ── producer state transitions ────────────────────────────────────────────────

describe('problemsStore — producer state transitions (Prompt 28)', () => {
  it('markProducerLoading sets producer status to loading', () => {
    useProblemsStore.getState().markProducerLoading('pid:test', 'Test producer');
    expect(
      useProblemsStore.getState().producerStates['pid:test']?.status,
    ).toBe('loading');
  });

  it('markProducerError sets producer status to error with message', () => {
    useProblemsStore
      .getState()
      .markProducerError('pid:err', 'Connection refused', 'My producer');
    const state = useProblemsStore.getState().producerStates['pid:err'];
    expect(state?.status).toBe('error');
    expect(state?.message).toBe('Connection refused');
  });

  it('markProducerStale marks all producer diagnostics as stale and sets status', () => {
    useProblemsStore
      .getState()
      .setDiagnosticsForProducer('pid:stale', [
        d({ message: 'Stale error 1.' }),
        d({ message: 'Stale error 2.' }),
      ]);

    useProblemsStore.getState().markProducerStale('pid:stale', 'Outdated', 'Stale producer');

    const diags = useProblemsStore
      .getState()
      .diagnostics.filter(x => x.producerId === 'pid:stale');
    expect(diags.every(x => x.stale === true)).toBe(true);
    expect(
      useProblemsStore.getState().producerStates['pid:stale']?.status,
    ).toBe('stale');
  });

  it('clearDiagnosticsForProducer removes only that producer and sets status=empty', () => {
    useProblemsStore
      .getState()
      .setDiagnosticsForProducer('pid:a', [d({ message: 'A error.' })]);
    useProblemsStore
      .getState()
      .setDiagnosticsForProducer('pid:b', [d({ message: 'B error.' })]);

    useProblemsStore.getState().clearDiagnosticsForProducer('pid:a');

    const state = useProblemsStore.getState();
    expect(state.diagnostics.some(x => x.producerId === 'pid:a')).toBe(false);
    expect(state.diagnostics.some(x => x.producerId === 'pid:b')).toBe(true);
    expect(state.producerStates['pid:a']?.status).toBe('empty');
  });
});

// ── MAX_DIAGNOSTICS cap ───────────────────────────────────────────────────────

describe('problemsStore — MAX_DIAGNOSTICS cap (Prompt 28)', () => {
  it('never exceeds MAX_DIAGNOSTICS entries', () => {
    const batch: DiagnosticInput[] = Array.from({ length: MAX_DIAGNOSTICS + 20 }, (_, i) =>
      d({ message: `Error number ${i}`, file: `src/f${i}.ts` }),
    );
    useProblemsStore.getState().setDiagnosticsForProducer('pid:cap', batch);
    expect(useProblemsStore.getState().diagnostics.length).toBeLessThanOrEqual(MAX_DIAGNOSTICS);
  });
});

// ── message clamping ──────────────────────────────────────────────────────────

describe('problemsStore — message clamping (Prompt 28)', () => {
  it('clamps messages longer than 1200 chars with an ellipsis', () => {
    const longMsg = 'x'.repeat(1300);
    useProblemsStore.getState().upsertDiagnostic(d({ message: longMsg }));
    const stored = useProblemsStore.getState().diagnostics[0];
    expect(stored.message.length).toBeLessThanOrEqual(1200);
    expect(stored.message.endsWith('…')).toBe(true);
  });

  it('does not clamp messages at exactly 1200 chars', () => {
    const exactly1200 = 'y'.repeat(1200);
    useProblemsStore.getState().upsertDiagnostic(d({ message: exactly1200 }));
    const stored = useProblemsStore.getState().diagnostics[0];
    expect(stored.message.length).toBe(1200);
    expect(stored.message.endsWith('…')).toBe(false);
  });
});

// ── createDiagnosticId determinism ────────────────────────────────────────────

describe('problemsStore — createDiagnosticId (Prompt 28)', () => {
  it('produces the same id for identical inputs', () => {
    const input = { source: 'ts' as const, file: 'src/a.ts', message: 'Error.' };
    expect(createDiagnosticId(input)).toBe(createDiagnosticId(input));
  });

  it('produces different ids for different messages', () => {
    const a = createDiagnosticId({ source: 'ts' as const, message: 'Error A.' });
    const b = createDiagnosticId({ source: 'ts' as const, message: 'Error B.' });
    expect(a).not.toBe(b);
  });

  it('id starts with the diag: prefix', () => {
    expect(createDiagnosticId({ source: 'monaco' as const, message: 'x' })).toMatch(/^diag:/);
  });
});
