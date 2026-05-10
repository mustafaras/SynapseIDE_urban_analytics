import React, { useEffect, useMemo, useState } from 'react';

import coveragePolicy from '@/config/coveragePolicy.json';

import styles from '../../styles/tools.module.css';

const METRICS = ['statements', 'branches', 'functions', 'lines'] as const;

type CoverageMetricName = (typeof METRICS)[number];

type CoverageMetric = {
  pct: number;
  covered: number;
  total: number;
  skipped: number;
};

type CoverageThreshold = Record<CoverageMetricName, number>;

type CoveragePolicyDocument = {
  global: CoverageThreshold;
  modules: Array<{
    id: string;
    label: string;
    include: string[];
    minimum: CoverageThreshold;
  }>;
};

export type CoverageDiagnosticsSummary = {
  generatedAt: string;
  source: string;
  overall: Record<CoverageMetricName, CoverageMetric>;
  globalMinimum: CoverageThreshold;
  modules: Array<{
    id: string;
    label: string;
    fileCount: number;
    minimum: CoverageThreshold;
    coverage: Record<CoverageMetricName, CoverageMetric>;
    pass: boolean;
  }>;
  overallPass: boolean;
  notes: string[];
};

type CoverageDiagnosticsPanelProps = {
  initialSummary?: CoverageDiagnosticsSummary | null;
  artifactPath?: string;
};

const metricCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  minHeight: 82,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid color-mix(in srgb, var(--ui-border) 78%, var(--syn-accent-primary) 22%)',
  background: 'linear-gradient(180deg, color-mix(in srgb, var(--ui-card-bg) 92%, var(--syn-accent-primary) 8%), color-mix(in srgb, var(--ui-card-bg) 96%, var(--syn-bg-root) 4%))',
};

const badgeStyle = (pass: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 84,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: pass ? '#09140c' : '#3a1700',
  background: pass
    ? 'color-mix(in srgb, #d7f3be 78%, white 22%)'
    : 'color-mix(in srgb, #f6c18a 82%, white 18%)',
});

function formatPct(metric?: CoverageMetric): string {
  return metric ? `${metric.pct.toFixed(1)}%` : '—';
}

function formatTimestamp(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) {
    return 'Awaiting coverage run';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoTimestamp));
}

function meetsThreshold(metric: CoverageMetric | undefined, minimum: number): boolean {
  return metric !== undefined && metric.pct >= minimum;
}

function formatGate(minimum: CoverageThreshold): string {
  return `S ${minimum.statements}% · B ${minimum.branches}% · F ${minimum.functions}% · L ${minimum.lines}%`;
}

const typedCoveragePolicy = coveragePolicy as CoveragePolicyDocument;

export default function CoverageDiagnosticsPanel({
  initialSummary = null,
  artifactPath = '/diagnostics/test-coverage-summary.json',
}: CoverageDiagnosticsPanelProps) {
  const [summary, setSummary] = useState<CoverageDiagnosticsSummary | null>(initialSummary);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(initialSummary ? 'ready' : 'loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSummary) {
      return;
    }

    let disposed = false;

    async function loadSummary() {
      setLoadState('loading');
      setErrorMessage(null);

      try {
        const response = await fetch(artifactPath, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Coverage artifact unavailable (${response.status})`);
        }

        const payload = (await response.json()) as CoverageDiagnosticsSummary;
        if (disposed) {
          return;
        }

        setSummary(payload);
        setLoadState('ready');
      } catch (error) {
        if (disposed) {
          return;
        }

        setLoadState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load analytical coverage diagnostics.');
      }
    }

    void loadSummary();

    return () => {
      disposed = true;
    };
  }, [artifactPath, initialSummary]);

  const moduleRows = useMemo(() => {
    if (summary) {
      return summary.modules;
    }

    return typedCoveragePolicy.modules.map((modulePolicy) => ({
      id: modulePolicy.id,
      label: modulePolicy.label,
      fileCount: 0,
      minimum: modulePolicy.minimum,
      coverage: {
        statements: { pct: 0, covered: 0, total: 0, skipped: 0 },
        branches: { pct: 0, covered: 0, total: 0, skipped: 0 },
        functions: { pct: 0, covered: 0, total: 0, skipped: 0 },
        lines: { pct: 0, covered: 0, total: 0, skipped: 0 },
      },
      pass: false,
    }));
  }, [summary]);

  return (
    <div style={{ display: 'grid', gap: 14 }} data-testid="coverage-diagnostics-panel">
      <div className={`${styles.callout} ${summary?.overallPass ? styles.calloutSuccess : styles.calloutInfo}`}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Analytical QA Coverage</div>
          <div className={styles.calloutMeta}>
            {summary ? `Snapshot ${formatTimestamp(summary.generatedAt)}` : 'Thresholds ready for local or CI publication'}
          </div>
        </div>
        <div className={styles.calloutBody} style={{ display: 'grid', gap: 10 }}>
          <div className={styles.meta}>
            This panel turns the Vitest coverage artifact into a scientific QA surface for the analytical engine. Critical modules carry explicit minimum gates so CI can enforce meaningful test depth without conflating it with unrelated presentation code.
          </div>
          {!summary ? (
            <div className={styles.meta}>
              {loadState === 'error'
                ? `Observed coverage is not available yet. ${errorMessage ?? ''} Run npm run test:coverage:publish to generate the diagnostics artifact.`
                : 'Run npm run test:coverage:publish to refresh observed metrics and publish the JSON artifact consumed by this panel.'}
            </div>
          ) : null}
        </div>
      </div>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Coverage snapshot</div>
          <div className={styles.calloutMeta}>
            {summary ? `Source ${summary.source}` : 'Awaiting observed metrics'}
          </div>
        </div>
        <div className={styles.calloutBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {METRICS.map((metricName) => {
              const metric = summary?.overall[metricName];
              const threshold = summary?.globalMinimum[metricName] ?? typedCoveragePolicy.global[metricName];
              const pass = meetsThreshold(metric, threshold);

              return (
                <div key={metricName} className={styles.metric} style={metricCardStyle}>
                  <div className={styles.metricLabel}>{metricName}</div>
                  <div className={styles.metricValue}>{formatPct(metric)}</div>
                  <div className={styles.meta}>Minimum {threshold}%</div>
                  <div style={badgeStyle(summary ? pass : false)}>{summary ? (pass ? 'Pass' : 'Check') : 'Awaiting run'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.callout} ${styles.calloutInfo}`} style={{ display: 'grid', gap: 10 }}>
        <div className={styles.calloutHeader}>
          <div className={styles.calloutTitle}>Critical module thresholds</div>
          <div className={styles.calloutMeta}>CI-ready coverage thresholds for analytical modules</div>
        </div>
        <div className={styles.calloutBody} style={{ display: 'grid', gap: 10 }}>
          <div className={styles.tableScroll}>
            <table className={`${styles.tableV2} ${styles.rowZebra}`}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Module</th>
                  <th className={styles.num}>Files</th>
                  <th className={styles.num}>Statements</th>
                  <th className={styles.num}>Branches</th>
                  <th className={styles.num}>Functions</th>
                  <th className={styles.num}>Lines</th>
                  <th style={{ textAlign: 'left' }}>Gate</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {moduleRows.map((moduleSummary) => (
                  <tr key={moduleSummary.id}>
                    <td>{moduleSummary.label}</td>
                    <td className={styles.num}>{moduleSummary.fileCount.toLocaleString()}</td>
                    <td className={styles.num}>{formatPct(moduleSummary.coverage.statements)}</td>
                    <td className={styles.num}>{formatPct(moduleSummary.coverage.branches)}</td>
                    <td className={styles.num}>{formatPct(moduleSummary.coverage.functions)}</td>
                    <td className={styles.num}>{formatPct(moduleSummary.coverage.lines)}</td>
                    <td>{formatGate(moduleSummary.minimum)}</td>
                    <td>
                      <span style={badgeStyle(summary ? moduleSummary.pass : false)}>
                        {summary ? (moduleSummary.pass ? 'Pass' : 'Review') : 'Awaiting run'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(summary?.notes ?? [
            'Use npm run test:coverage:publish to refresh observed coverage and regenerate the diagnostics artifact.',
            'Coverage gates focus on analytical modules so CI decisions remain interpretable to researchers and developers.',
          ]).map((note) => (
            <div key={note} className={styles.meta}>{note}</div>
          ))}
        </div>
      </section>
    </div>
  );
}