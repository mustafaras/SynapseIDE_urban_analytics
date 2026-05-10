import { beforeEach, describe, expect, it } from 'vitest';
import { emitTerminalLog } from '@/components/terminal/terminalLogBus';
import {
  diagnosticFromTerminalLog,
  recordTaskStateDiagnostic,
  useProblemsStore,
} from '../problemsStore';

beforeEach(() => {
  useProblemsStore.getState().clearAllDiagnostics();
});

describe('problemsStore - Prompt 07 diagnostics model', () => {
  it('starts empty and does not seed demo diagnostics', () => {
    const state = useProblemsStore.getState();

    expect(state.diagnostics).toEqual([]);
    expect(state.severityCounts).toEqual({ error: 0, warning: 0, info: 0, hint: 0 });
    expect(state.producerStates).toEqual({});
  });

  it('replaces diagnostics by producer and updates severity counts', () => {
    const store = useProblemsStore.getState();

    store.setDiagnosticsForProducer('monaco:tab-1', [
      {
        source: 'monaco',
        severity: 'error',
        file: 'src/model.ts',
        range: { start: { line: 3, column: 5 }, end: { line: 3, column: 6 } },
        message: 'Unexpected token.',
      },
      {
        source: 'monaco',
        severity: 'warning',
        file: 'src/model.ts',
        range: { start: { line: 9, column: 1 }, end: { line: 9, column: 4 } },
        message: 'Unused local.',
      },
    ]);

    expect(useProblemsStore.getState().diagnostics).toHaveLength(2);
    expect(useProblemsStore.getState().severityCounts).toEqual({
      error: 1,
      warning: 1,
      info: 0,
      hint: 0,
    });

    store.setDiagnosticsForProducer('monaco:tab-1', []);

    expect(useProblemsStore.getState().diagnostics).toHaveLength(0);
    expect(useProblemsStore.getState().producerStates['monaco:tab-1']?.status).toBe('empty');
  });

  it('parses lint-style terminal errors into file-range diagnostics', () => {
    const diagnostic = diagnosticFromTerminalLog({
      channel: 'build',
      level: 'error',
      message: 'src/analysis.ts:12:7: error TS2304: Cannot find name "rows".',
      timestamp: new Date('2026-05-03T12:00:00.000Z'),
    });

    expect(diagnostic?.source).toBe('task');
    expect(diagnostic?.file).toBe('src/analysis.ts');
    expect(diagnostic?.range?.start).toEqual({ line: 12, column: 7 });
    expect(diagnostic?.code).toBe('TS2304');
  });

  it('records terminal error logs without recording info logs', () => {
    emitTerminalLog({
      channel: 'build',
      level: 'info',
      message: 'Build started.',
      timestamp: new Date('2026-05-03T12:00:00.000Z'),
    });

    expect(useProblemsStore.getState().diagnostics).toHaveLength(0);

    emitTerminalLog({
      channel: 'build',
      level: 'error',
      message: 'eslint: src/pipeline.py:4:1: Undefined name [pylint/undefined-variable]',
      timestamp: new Date('2026-05-03T12:00:01.000Z'),
    });

    const state = useProblemsStore.getState();
    expect(state.diagnostics).toHaveLength(1);
    expect(state.diagnostics[0]?.source).toBe('lint');
    expect(state.diagnostics[0]?.file).toBe('src/pipeline.py');
    expect(state.severityCounts.error).toBe(1);
  });

  it('records task failure state and clears it after success', () => {
    recordTaskStateDiagnostic('build', 'error');

    expect(useProblemsStore.getState().diagnostics[0]?.source).toBe('task');
    expect(useProblemsStore.getState().producerStates['task:build']?.status).toBe('error');

    recordTaskStateDiagnostic('build', 'success');

    expect(useProblemsStore.getState().diagnostics).toHaveLength(0);
    expect(useProblemsStore.getState().producerStates['task:build']?.status).toBe('empty');
  });
});
