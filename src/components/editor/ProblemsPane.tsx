import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CircleDot,
  Clock3,
  FileCode2,
  Info,
  Loader2,
} from 'lucide-react';
import {
  type Diagnostic,
  type DiagnosticProducerState,
  type DiagnosticSeverity,
  useProblemsStore,
} from '@/stores/problemsStore';
import './problemsPane.css';

interface ProblemsPaneProps {
  onOpenDiagnostic?: (diagnostic: Diagnostic) => void;
}

const severityLabel: Record<DiagnosticSeverity, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  hint: 'Hint',
};

const severityIcon: Record<
  DiagnosticSeverity,
  React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  hint: CircleDot,
};

function formatLocation(diagnostic: Diagnostic) {
  if (!diagnostic.file) return 'Workspace';
  const line = diagnostic.range?.start.line;
  const column = diagnostic.range?.start.column;
  if (line && column) return `${diagnostic.file}:${line}:${column}`;
  if (line) return `${diagnostic.file}:${line}`;
  return diagnostic.file;
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function summarizeProducerStates(states: DiagnosticProducerState[]) {
  const loading = states.filter(state => state.status === 'loading');
  const errors = states.filter(state => state.status === 'error');
  const stale = states.filter(state => state.status === 'stale');
  return { loading, errors, stale };
}

export const ProblemsPane: React.FC<ProblemsPaneProps> = ({ onOpenDiagnostic }) => {
  const diagnostics = useProblemsStore(state => state.diagnostics);
  const counts = useProblemsStore(state => state.severityCounts);
  const producerStates = useProblemsStore(state => state.producerStates);
  const states = useMemo(() => Object.values(producerStates), [producerStates]);
  const stateSummary = useMemo(() => summarizeProducerStates(states), [states]);

  const total = diagnostics.length;

  return (
    <section className="syn-problems-pane" aria-label="Problems">
      <header className="syn-problems-pane__header">
        <div className="syn-problems-pane__title-block">
          <AlertCircle size={15} aria-hidden="true" />
          <h2>Problems</h2>
          <span className="syn-problems-pane__total">{total}</span>
        </div>
        <div className="syn-problems-pane__summary" aria-label="Problem severity counts">
          <span data-severity="error">{counts.error} Errors</span>
          <span data-severity="warning">{counts.warning} Warnings</span>
          <span data-severity="info">{counts.info} Info</span>
          {counts.hint > 0 ? <span data-severity="hint">{counts.hint} Hints</span> : null}
        </div>
        <div className="syn-problems-pane__source-states" aria-label="Diagnostic source states">
          {stateSummary.loading.length > 0 ? (
            <span data-state="loading">
              <Loader2 size={12} aria-hidden="true" />
              Updating
            </span>
          ) : null}
          {stateSummary.errors.length > 0 ? (
            <span data-state="error" title={stateSummary.errors[0]?.message || 'Diagnostic source error'}>
              Source error
            </span>
          ) : null}
          {stateSummary.stale.length > 0 ? (
            <span data-state="stale" title={stateSummary.stale[0]?.message || 'Diagnostics may be stale'}>
              Stale
            </span>
          ) : null}
        </div>
      </header>

      {total === 0 ? (
        <div className="syn-problems-pane__empty" role="status">
          <FileCode2 size={18} aria-hidden="true" />
          <span>No diagnostics from connected sources.</span>
        </div>
      ) : (
        <div className="syn-problems-pane__list" role="list" aria-label="Diagnostic list">
          {diagnostics.map(diagnostic => {
            const Icon = severityIcon[diagnostic.severity];
            const canOpen = Boolean(diagnostic.file && diagnostic.range && onOpenDiagnostic);
            const time = formatTime(diagnostic.timestamp);

            return (
              <button
                key={diagnostic.id}
                type="button"
                className="syn-problems-pane__row"
                data-severity={diagnostic.severity}
                data-stale={diagnostic.stale ? 'true' : 'false'}
                disabled={!canOpen}
                onClick={() => {
                  if (canOpen) onOpenDiagnostic?.(diagnostic);
                }}
                title={canOpen ? `Open ${formatLocation(diagnostic)}` : diagnostic.message}
              >
                <span className="syn-problems-pane__severity">
                  <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                  {severityLabel[diagnostic.severity]}
                </span>
                <span className="syn-problems-pane__source">{diagnostic.source}</span>
                <span className="syn-problems-pane__location">{formatLocation(diagnostic)}</span>
                <span className="syn-problems-pane__message">
                  {diagnostic.message}
                  {typeof diagnostic.code !== 'undefined' ? (
                    <span className="syn-problems-pane__code">{String(diagnostic.code)}</span>
                  ) : null}
                </span>
                <span className="syn-problems-pane__artifact">
                  {diagnostic.relatedArtifact?.label || ''}
                </span>
                <span className="syn-problems-pane__time">
                  {time ? <Clock3 size={12} aria-hidden="true" /> : null}
                  {time}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProblemsPane;
