

import { useEffect, useState } from 'react';
import { terminalInfo } from '@/components/terminal/terminalLogBus';
import { recordTaskStateDiagnostic } from '@/stores/problemsStore';

export type TaskKind = 'run' | 'build' | 'typecheck' | 'lint' | 'test';
export type TaskState = 'idle' | 'queued' | 'running' | 'success' | 'error' | 'cancelled';

/** Source that originated a task trigger. */
export type TaskSource = 'command-palette' | 'keyboard' | 'toolbar' | 'api';

/** Metadata record for a single task execution. */
export interface TaskRecord {
  kind: TaskKind;
  /** Human-readable npm script command, e.g. "npm run dev". */
  command: string;
  /** Working directory — project root in browser context (simulated). */
  workingDirectory: string;
  source: TaskSource;
  startedAt: Date | null;
  endedAt: Date | null;
  /** Wall-clock duration in milliseconds; null until the task settles. */
  durationMs: number | null;
  /** Exit code from the simulated task; null while running or queued. */
  exitCode: number | null;
  state: TaskState;
}

const TASK_COMMANDS: Record<TaskKind, string> = {
  run: 'npm run dev',
  build: 'npm run build',
  typecheck: 'npm run typecheck',
  lint: 'npm run lint',
  test: 'npm test',
};

const SIMULATED_MESSAGES: Record<TaskKind, string> = {
  run: 'Run: Starting dev server (simulated). Use the real terminal for actual processes.',
  build: 'Build: Compiling project (simulated). Use the real terminal for actual builds.',
  typecheck: 'Typecheck: Running tsc type checks (simulated). Use the real terminal for actual type checking.',
  lint: 'Lint: Running ESLint (simulated). Use the real terminal for actual linting.',
  test: 'Test: Running Vitest (simulated). Use the real terminal for actual test runs.',
};

const WORKING_DIR = '/workspace'; // browser-context placeholder

const ALL_KINDS: TaskKind[] = ['run', 'build', 'typecheck', 'lint', 'test'];

function makeInitialRecord(kind: TaskKind): TaskRecord {
  return {
    kind,
    command: TASK_COMMANDS[kind],
    workingDirectory: WORKING_DIR,
    source: 'api',
    startedAt: null,
    endedAt: null,
    durationMs: null,
    exitCode: null,
    state: 'idle',
  };
}

let handler: null | ((kind: TaskKind) => void) = null;
let taskStates: Record<TaskKind, TaskState> = {
  run: 'idle', build: 'idle', typecheck: 'idle', lint: 'idle', test: 'idle',
};
let taskRecords: Record<TaskKind, TaskRecord> = Object.fromEntries(
  ALL_KINDS.map(k => [k, makeInitialRecord(k)])
) as Record<TaskKind, TaskRecord>;

const stateListeners = new Set<() => void>();

const emitState = () => {
  stateListeners.forEach(l => {
    try { l(); } catch {}
  });
};

export function setTasksHandler(fn: ((kind: TaskKind) => void) | null) {
  handler = fn;
}

export function getTaskStates(): Record<TaskKind, TaskState> {
  return taskStates;
}

export function getTaskRecord(kind: TaskKind): TaskRecord {
  return taskRecords[kind];
}

export function setTaskState(
  kind: TaskKind,
  state: TaskState,
  opts?: { source?: TaskSource; exitCode?: number }
) {
  if (taskStates[kind] === state) return;
  taskStates = { ...taskStates, [kind]: state };

  const prev = taskRecords[kind];
  const now = new Date();
  let updated: TaskRecord = { ...prev, state };

  if (state === 'running') {
    updated = {
      ...updated,
      startedAt: now,
      endedAt: null,
      durationMs: null,
      exitCode: null,
      ...(opts?.source !== undefined ? { source: opts.source } : {}),
    };
  } else if (state === 'success' || state === 'error' || state === 'cancelled') {
    const durationMs = prev.startedAt ? now.getTime() - prev.startedAt.getTime() : null;
    updated = {
      ...updated,
      endedAt: now,
      durationMs,
      exitCode: opts?.exitCode ?? (state === 'success' ? 0 : state === 'error' ? 1 : null),
    };
  }

  taskRecords = { ...taskRecords, [kind]: updated };

  try {
    recordTaskStateDiagnostic(kind, state);
  } catch {}
  emitState();
}

export function subscribeTaskStates(fn: () => void): () => void {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

export function triggerTask(kind: TaskKind, source: TaskSource = 'api') {
  setTaskState(kind, 'running', { source });
  if (handler) {
    try {
      handler(kind);
    } catch (err) {
      setTaskState(kind, 'error');
      throw err;
    }
    return;
  }

  terminalInfo(SIMULATED_MESSAGES[kind], 'build');

  // Simulated mode has no real lifecycle; settle quickly so UI returns to idle.
  setTimeout(() => setTaskState(kind, 'idle'), 800);
}

export function hasCustomTasksHandler() {
  return !!handler;
}

export function useTaskStates(): Record<TaskKind, TaskState> {
  const [snapshot, setSnapshot] = useState(() => getTaskStates());
  useEffect(() => {
    // Re-read in case state changed between initial render and subscribe.
    setSnapshot(getTaskStates());
    const unsub = subscribeTaskStates(() => setSnapshot(getTaskStates()));
    return () => { unsub(); };
  }, []);
  return snapshot;
}

export default { setTasksHandler, triggerTask, hasCustomTasksHandler, getTaskStates, setTaskState, subscribeTaskStates, getTaskRecord };
