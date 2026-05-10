/**
 * ProjectSummaryCard — read-only summary of a ProjectRecord.
 * Urban analytics project summary card.
 */

import styles from './newProject.module.css';
import type { ProjectRecord } from '../registry/types';

const VULN_COLOR: Record<string, string> = {
  low: 'var(--risk-g1)',
  medium: 'var(--risk-g3)',
  high: 'var(--risk-g4)',
  critical: 'var(--risk-g5)',
};

export default function ProjectSummaryCard({ project }: { project: ProjectRecord }) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTitle}>Project Summary</div>
        <div className={styles.cardSub}>Key metadata and spatial configuration.</div>
      </header>
      <div className={styles.cardBody}>
        {/* Name + Scale + Priority */}
        <div className={styles.rowGrid}>
          <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
            <span className={styles.fieldLabel}>Name</span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{project.name}</div>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Scale</span>
            <span className={styles.riskChip}>{project.scale}</span>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Priority</span>
            <span className={styles.riskChip}>P{project.priority}</span>
          </div>
        </div>

        {/* Description */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Description</span>
          <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.85 }}>
            {project.description || '—'}
          </div>
        </div>

        {/* Spatial details */}
        <div className={styles.rowGrid}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Area</span>
            <div style={{ fontSize: 12 }}>
              {project.area_km2 != null ? `${project.area_km2.toLocaleString()} km²` : '—'}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>CRS</span>
            <div style={{ fontSize: 12 }}>{project.crs}</div>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Bbox</span>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono, monospace)' }}>
              {project.bbox ? `[${project.bbox.join(', ')}]` : '—'}
            </div>
          </div>
        </div>

        {/* Climate + data completeness */}
        <div className={styles.rowGrid}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Climate Vulnerability</span>
            <span
              className={styles.riskChip}
              style={{
                color: VULN_COLOR[project.climateVulnerability ?? ''] ?? undefined,
                borderColor: VULN_COLOR[project.climateVulnerability ?? ''] ?? undefined,
              }}
            >
              {project.climateVulnerability ?? '—'}
            </span>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Data Completeness</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${project.dataCompleteness ?? 0}%`,
                    height: '100%',
                    background: 'var(--color-accent, #f59e0b)',
                    borderRadius: 3,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, minWidth: 32, textAlign: 'right' }}>
                {project.dataCompleteness ?? 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Tags</span>
          <div className={styles.chipRow}>
            {project.tags.length > 0 ? (
              project.tags.map((t) => (
                <span key={t} className={styles.riskChip}>
                  {t.replace(/_/g, ' ')}
                </span>
              ))
            ) : (
              <span style={{ fontSize: 11, opacity: 0.5 }}>No tags assigned</span>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ fontSize: 10, opacity: 0.4, fontFamily: 'var(--mono, monospace)' }}>
          Created {project.createdAt} · Updated {project.updatedAt}
        </div>
      </div>
    </section>
  );
}
