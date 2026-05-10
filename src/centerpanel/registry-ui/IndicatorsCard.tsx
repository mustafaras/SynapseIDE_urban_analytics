/**
 * IndicatorsCard — displays computed indicator results for a project.
 * Urban analytics indicator card.
 */

import styles from './newProject.module.css';
import type { ProjectRecord } from '../registry/types';
import type { IndicatorResult } from '@/features/urbanAnalytics/lib/types';

function band(value: number, unit: string): { label: string; color: string } {
  if (unit === '%') {
    if (value >= 80) return { label: 'Excellent', color: 'var(--risk-g1)' };
    if (value >= 60) return { label: 'Good', color: 'var(--risk-g2)' };
    if (value >= 40) return { label: 'Moderate', color: 'var(--risk-g3)' };
    if (value >= 20) return { label: 'Low', color: 'var(--risk-g4)' };
    return { label: 'Critical', color: 'var(--risk-g5)' };
  }
  return { label: '', color: 'inherit' };
}

export default function IndicatorsCard({ project }: { project: ProjectRecord }) {
  const indicators = project.indicators;

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTitle}>Indicators</div>
        <div className={styles.cardSub}>
          {indicators.length} computed indicator{indicators.length !== 1 ? 's' : ''}
        </div>
      </header>
      <div className={styles.cardBody}>
        {indicators.length === 0 ? (
          <div style={{ fontSize: 11, opacity: 0.5, padding: '8px 0' }}>
            No indicators computed yet. Run an analysis session to generate results.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 0.6fr 1fr 1fr',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span>Indicator</span>
              <span>Value</span>
              <span>Unit</span>
              <span>Band</span>
              <span>Date</span>
            </div>

            {/* Rows */}
            {indicators.map((ind: IndicatorResult) => {
              const b = band(ind.value, ind.unit);
              return (
                <div
                  key={ind.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.8fr 0.6fr 1fr 1fr',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 11,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ind.kind}</span>
                  <span>{ind.value.toFixed(2)}</span>
                  <span style={{ opacity: 0.6 }}>{ind.unit}</span>
                  <span style={{ color: b.color, fontSize: 10, fontWeight: 600 }}>
                    {b.label}
                  </span>
                  <span style={{ opacity: 0.5, fontSize: 10 }}>{ind.when}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Sparkline placeholder */}
        {indicators.length > 0 && (
          <div className={styles.aiBlock}>
            <div className={styles.aiBlockHeader}>Trend Sparklines</div>
            <div className={styles.aiBlockSub}>
              Visual trend lines will render here when time-series indicator data is available.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
