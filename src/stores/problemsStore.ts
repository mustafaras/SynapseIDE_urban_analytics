import { create } from 'zustand';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export type DiagnosticSource =
  | 'monaco'
  | 'ts'
  | 'python'
  | 'task'
  | 'lint'
  | 'analysis'
  | 'apply'
  | 'terminal'
  | 'qa'
  | 'plan';

export type DiagnosticProducerStatus = 'empty' | 'loading' | 'ready' | 'error' | 'stale';

export interface DiagnosticPosition {
  line: number;
  column: number;
}

export interface DiagnosticRange {
  start: DiagnosticPosition;
  end: DiagnosticPosition;
}

export interface DiagnosticRelatedArtifact {
  type: 'editor-tab' | 'task' | 'terminal-log' | 'apply-plan' | 'analysis-output' | 'artifact';
  id: string;
  label: string;
  path?: string;
}

export interface Diagnostic {
  id: string;
  source: DiagnosticSource;
  producerId?: string;
  severity: DiagnosticSeverity;
  file?: string;
  range?: DiagnosticRange;
  message: string;
  code?: string | number;
  timestamp: string;
  relatedArtifact?: DiagnosticRelatedArtifact;
  stale?: boolean;
}

export type DiagnosticInput = Omit<Diagnostic, 'id' | 'timestamp'> &
  Partial<Pick<Diagnostic, 'id' | 'timestamp'>>;

export interface DiagnosticProducerState {
  producerId: string;
  label: string;
  status: DiagnosticProducerStatus;
  updatedAt: string;
  message?: string;
}

export interface DiagnosticSeverityCounts {
  error: number;
  warning: number;
  info: number;
  hint: number;
}

interface ProblemsStore {
  diagnostics: Diagnostic[];
  producerStates: Record<string, DiagnosticProducerState>;
  severityCounts: DiagnosticSeverityCounts;
  setDiagnosticsForProducer: (
    producerId: string,
    diagnostics: DiagnosticInput[],
    status?: DiagnosticProducerStatus,
    label?: string
  ) => void;
  upsertDiagnostic: (diagnostic: DiagnosticInput, producerId?: string, label?: string) => Diagnostic;
  clearDiagnosticsForProducer: (producerId: string, label?: string) => void;
  markProducerLoading: (producerId: string, label?: string) => void;
  markProducerError: (producerId: string, message: string, label?: string) => void;
  markProducerStale: (producerId: string, message?: string, label?: string) => void;
  clearAllDiagnostics: () => void;
}

interface TerminalLogLike {
  channel: string;
  level: 'info' | 'success' | 'error' | 'warn' | 'warning';
  message: string;
  timestamp?: Date | string;
}

export const MAX_DIAGNOSTICS = 500;
export const MAX_DIAGNOSTIC_PRODUCERS = 120;
const MAX_DIAGNOSTIC_MESSAGE_CHARS = 1200;
const MAX_DIAGNOSTIC_FILE_CHARS = 260;

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3,
};

const nowIso = () => new Date().toISOString();

function normalizeTimestamp(value?: string | Date) {
  if (!value) return nowIso();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeLine(value: unknown, fallback = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : fallback;
}

function normalizeColumn(value: unknown, fallback = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.floor(numeric)) : fallback;
}

function clampText(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1))}…` : value;
}

function normalizeRange(range?: DiagnosticRange): DiagnosticRange | undefined {
  if (!range) return undefined;
  const startLine = normalizeLine(range.start.line);
  const startColumn = normalizeColumn(range.start.column);
  const endLine = Math.max(startLine, normalizeLine(range.end.line, startLine));
  const endColumn = endLine === startLine
    ? Math.max(startColumn, normalizeColumn(range.end.column, startColumn))
    : normalizeColumn(range.end.column);
  return {
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn },
  };
}

export function createDiagnosticId(input: {
  source: DiagnosticSource;
  file?: string;
  range?: DiagnosticRange;
  message: string;
  code?: string | number;
  relatedArtifact?: DiagnosticRelatedArtifact;
}) {
  const range = normalizeRange(input.range);
  const basis = [
    input.source,
    input.file || '',
    range?.start.line ?? '',
    range?.start.column ?? '',
    range?.end.line ?? '',
    range?.end.column ?? '',
    input.code ?? '',
    input.relatedArtifact?.id ?? '',
    input.message.trim(),
  ].join('|');
  return `diag:${hashString(basis)}`;
}

function stampDiagnostic(input: DiagnosticInput, producerId?: string): Diagnostic {
  const range = normalizeRange(input.range);
  const resolvedProducerId = producerId || input.producerId;
  const base = {
    source: input.source,
    severity: input.severity,
    message: clampText(input.message.trim() || 'Diagnostic message unavailable.', MAX_DIAGNOSTIC_MESSAGE_CHARS),
    timestamp: normalizeTimestamp(input.timestamp),
    ...(resolvedProducerId ? { producerId: resolvedProducerId } : {}),
    ...(input.file ? { file: clampText(input.file.replace(/\\/g, '/'), MAX_DIAGNOSTIC_FILE_CHARS) } : {}),
    ...(range ? { range } : {}),
    ...(typeof input.code !== 'undefined' ? { code: input.code } : {}),
    ...(input.relatedArtifact ? { relatedArtifact: input.relatedArtifact } : {}),
    ...(input.stale ? { stale: true } : {}),
  };
  return {
    id: input.id || createDiagnosticId(base),
    ...base,
  };
}

function countSeverities(diagnostics: Diagnostic[]): DiagnosticSeverityCounts {
  return diagnostics.reduce<DiagnosticSeverityCounts>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0, hint: 0 }
  );
}

function sortDiagnostics(diagnostics: Diagnostic[]) {
  return [...diagnostics].sort((a, b) => {
    const severity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severity !== 0) return severity;
    const fileCompare = (a.file || '').localeCompare(b.file || '');
    if (fileCompare !== 0) return fileCompare;
    const lineCompare = (a.range?.start.line ?? 0) - (b.range?.start.line ?? 0);
    if (lineCompare !== 0) return lineCompare;
    return b.timestamp.localeCompare(a.timestamp);
  });
}

function capDiagnostics(diagnostics: Diagnostic[]) {
  return diagnostics.length > MAX_DIAGNOSTICS
    ? diagnostics.slice(0, MAX_DIAGNOSTICS)
    : diagnostics;
}

function producerLabel(producerId: string, label?: string) {
  return label || producerId;
}

function setProducerState(
  states: Record<string, DiagnosticProducerState>,
  producerId: string,
  status: DiagnosticProducerStatus,
  label?: string,
  message?: string
) {
  const next = {
    ...states,
    [producerId]: {
      producerId,
      label: producerLabel(producerId, label || states[producerId]?.label),
      status,
      updatedAt: nowIso(),
      ...(message ? { message } : {}),
    },
  };
  const entries = Object.entries(next);
  if (entries.length <= MAX_DIAGNOSTIC_PRODUCERS) return next;
  return Object.fromEntries(
    entries
      .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_DIAGNOSTIC_PRODUCERS)
  );
}

function inferTerminalSource(channel: string, message: string): DiagnosticSource {
  const haystack = `${channel} ${message}`.toLowerCase();
  if (/\b(eslint|lint|ruff|flake8|pylint)\b/.test(haystack)) return 'lint';
  if (channel === 'build') return 'task';
  if (/\b(analysis|python|pyodide|spatial|projection|crs|geojson|latex)\b/.test(haystack)) {
    return 'analysis';
  }
  return 'terminal';
}

function extractCode(message: string): string | number | undefined {
  const tsCode = /\b(TS\d{4})\b/.exec(message)?.[1];
  if (tsCode) return tsCode;
  const bracketCode = /\[([^\]\s][^\]]{0,80})\]\s*$/.exec(message)?.[1];
  if (bracketCode) return bracketCode;
  const eslintCode = /\b([a-z]+(?:\/[a-z0-9-]+)+)\b/i.exec(message)?.[1];
  return eslintCode || undefined;
}

function parseTerminalLocation(message: string): { file?: string; range?: DiagnosticRange } {
  const parenMatch =
    /(?<file>(?:[A-Za-z]:[\\/])?[^:\n()]+?\.(?:[cm]?[jt]sx?|py|json|css|html?|md|sql|r|geojson|csv|tsv|ya?ml))\((?<line>\d+),(?<column>\d+)\)/i.exec(message);
  const colonMatch =
    /(?<file>(?:[A-Za-z]:[\\/])?[^:\n()]+?\.(?:[cm]?[jt]sx?|py|json|css|html?|md|sql|r|geojson|csv|tsv|ya?ml)):(?<line>\d+)(?::(?<column>\d+))?/i.exec(message);
  const match = parenMatch || colonMatch;
  if (!match?.groups?.file || !match.groups.line) return {};
  const line = normalizeLine(match.groups.line);
  const column = normalizeColumn(match.groups.column);
  return {
    file: match.groups.file.trim().replace(/\\/g, '/'),
    range: {
      start: { line, column },
      end: { line, column },
    },
  };
}

export function diagnosticFromTerminalLog(log: TerminalLogLike): DiagnosticInput | null {
  if (log.level !== 'error') return null;
  const location = parseTerminalLocation(log.message);
  const source = inferTerminalSource(log.channel, log.message);
  const code = extractCode(log.message);
  return {
    source,
    severity: 'error',
    message: log.message,
    timestamp: normalizeTimestamp(log.timestamp),
    ...(location.file ? { file: location.file } : {}),
    ...(location.range ? { range: location.range } : {}),
    ...(code !== undefined ? { code } : {}),
    relatedArtifact: {
      type: log.channel === 'build' ? 'task' : 'terminal-log',
      id: `terminal:${log.channel}`,
      label: `${log.channel} output`,
    },
  };
}

export const useProblemsStore = create<ProblemsStore>(set => ({
  diagnostics: [],
  producerStates: {},
  severityCounts: { error: 0, warning: 0, info: 0, hint: 0 },

  setDiagnosticsForProducer: (producerId, inputs, status = 'ready', label) => {
    set(state => {
      const diagnostics = capDiagnostics(sortDiagnostics([
        ...state.diagnostics.filter(diagnostic => diagnostic.producerId !== producerId),
        ...inputs.map(input => stampDiagnostic(input, producerId)),
      ]));
      return {
        diagnostics,
        severityCounts: countSeverities(diagnostics),
        producerStates: setProducerState(
          state.producerStates,
          producerId,
          inputs.length === 0 && status === 'ready' ? 'empty' : status,
          label
        ),
      };
    });
  },

  upsertDiagnostic: (input, producerId, label) => {
    const diagnostic = stampDiagnostic(input, producerId);
    set(state => {
      const diagnostics = capDiagnostics(sortDiagnostics([
        ...state.diagnostics.filter(existing => existing.id !== diagnostic.id),
        diagnostic,
      ]));
      return {
        diagnostics,
        severityCounts: countSeverities(diagnostics),
        producerStates: setProducerState(
          state.producerStates,
          diagnostic.producerId || producerId || diagnostic.source,
          'ready',
          label
        ),
      };
    });
    return diagnostic;
  },

  clearDiagnosticsForProducer: (producerId, label) => {
    set(state => {
      const diagnostics = state.diagnostics.filter(diagnostic => diagnostic.producerId !== producerId);
      return {
        diagnostics,
        severityCounts: countSeverities(diagnostics),
        producerStates: setProducerState(state.producerStates, producerId, 'empty', label),
      };
    });
  },

  markProducerLoading: (producerId, label) => {
    set(state => ({
      producerStates: setProducerState(state.producerStates, producerId, 'loading', label),
    }));
  },

  markProducerError: (producerId, message, label) => {
    set(state => ({
      producerStates: setProducerState(state.producerStates, producerId, 'error', label, message),
    }));
  },

  markProducerStale: (producerId, message, label) => {
    set(state => {
      const diagnostics = capDiagnostics(state.diagnostics.map(diagnostic =>
        diagnostic.producerId === producerId ? { ...diagnostic, stale: true } : diagnostic
      ));
      return {
        diagnostics,
        severityCounts: countSeverities(diagnostics),
        producerStates: setProducerState(state.producerStates, producerId, 'stale', label, message),
      };
    });
  },

  clearAllDiagnostics: () => {
    set({
      diagnostics: [],
      producerStates: {},
      severityCounts: { error: 0, warning: 0, info: 0, hint: 0 },
    });
  },
}));

export function recordTerminalLogDiagnostic(log: TerminalLogLike) {
  const diagnostic = diagnosticFromTerminalLog(log);
  if (!diagnostic) return null;
  const producerId = log.channel === 'build' ? 'task:build' : `terminal:${log.channel}`;
  return useProblemsStore.getState().upsertDiagnostic(diagnostic, producerId, `${log.channel} output`);
}

export function recordTaskStateDiagnostic(kind: 'run' | 'build' | 'typecheck' | 'lint' | 'test', state: 'idle' | 'queued' | 'running' | 'success' | 'error' | 'cancelled') {
  const producerId = `task:${kind}`;
  const store = useProblemsStore.getState();
  if (state === 'running') {
    store.clearDiagnosticsForProducer(producerId, `${kind} task`);
    store.markProducerLoading(producerId, `${kind} task`);
    return;
  }
  if (state === 'idle' || state === 'success' || state === 'queued' || state === 'cancelled') {
    store.clearDiagnosticsForProducer(producerId, `${kind} task`);
    return;
  }

  const existing = store.diagnostics.some(diagnostic => diagnostic.producerId === producerId);
  if (!existing) {
    store.upsertDiagnostic(
      {
        source: 'task',
        severity: 'error',
        message: `${kind} task reported a failed state.`,
        code: 'task_failed',
        relatedArtifact: {
          type: 'task',
          id: producerId,
          label: `${kind} task`,
        },
      },
      producerId,
      `${kind} task`
    );
  }
  store.markProducerError(producerId, `${kind} task failed.`, `${kind} task`);
}

export function recordApplyPlanErrorDiagnostic(error: unknown, artifactId = 'apply:last') {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Apply plan failed.';
  return useProblemsStore.getState().upsertDiagnostic(
    {
      source: 'apply',
      severity: 'error',
      message,
      code: 'apply_failed',
      relatedArtifact: {
        type: 'apply-plan',
        id: artifactId,
        label: 'AI apply plan',
      },
    },
    artifactId,
    'AI apply plan'
  );
}
