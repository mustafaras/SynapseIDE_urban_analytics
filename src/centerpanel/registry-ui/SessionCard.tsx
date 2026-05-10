/**
 * SessionCard — displays analysis session info for a project.
 * Urban analytics session card.
 */

import styles from './newProject.module.css';
import type { ProjectRecord, SessionRecord } from '../registry/types';

const TYPE_COLORS: Record<string, string> = {
  baseline: 'var(--risk-g1)',
  field_survey: 'var(--risk-g2)',
  desk_study: 'var(--risk-g3)',
  stakeholder: '#818cf8',
  scenario_modeling: '#f472b6',
  monitoring: '#38bdf8',
  reporting: '#a78bfa',
};

export default function SessionCard({ project }: { project: ProjectRecord }) {
  // Sessions are stored on the registry record using the sessionsCount.
  // When full session data becomes available, this card renders session details.
  // For now, we display placeholder rows from project metadata.

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTitle}>Analysis Sessions</div>
        <div className={styles.cardSub}>
          {project.sessionsCount} session{project.sessionsCount !== 1 ? 's' : ''} recorded
        </div>
      </header>
      <div className={styles.cardBody}>
        {project.sessionsCount === 0 ? (
          <div style={{ fontSize: 11, opacity: 0.5, padding: '8px 0' }}>
            No analysis sessions recorded yet. Start a workflow to create the first session.
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className={styles.rowGrid}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Total Sessions</span>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{project.sessionsCount}</div>
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Last Session</span>
                <div style={{ fontSize: 12 }}>{project.lastSessionDate ?? '—'}</div>
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Indicators Computed</span>
                <div style={{ fontSize: 12 }}>{project.indicators.length}</div>
              </div>
            </div>

            {/* Placeholder for detailed session list */}
            <div className={styles.aiBlock}>
              <div className={styles.aiBlockHeader}>Session Timeline</div>
              <div className={styles.aiBlockSub}>
                Detailed session records with type badges, datasets used, methods applied, and
                findings summaries will populate here as analysis workflows are completed.
              </div>
              <div className={styles.aiBlockText}>
                Session types: baseline · field_survey · desk_study · stakeholder · scenario_modeling · monitoring · reporting
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Utility: render a single session record row. Used when full session data is available. */
export function SessionRecordRow({ session }: { session: SessionRecord }) {
  const color = TYPE_COLORS[session.type] ?? 'inherit';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 2fr 2fr',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontSize: 11,
        alignItems: 'center',
      }}
    >
      <span>
        <span
          className={styles.riskChip}
          style={{ color, borderColor: color }}
        >
          {session.type.replace(/_/g, ' ')}
        </span>
      </span>
      <span style={{ opacity: 0.6 }}>{session.date}</span>
      <span style={{ opacity: 0.7 }}>
        {session.datasetsUsed.length > 0
          ? session.datasetsUsed.join(', ')
          : '—'}
      </span>
      <span style={{ opacity: 0.7 }}>
        {session.methodsApplied.length > 0
          ? session.methodsApplied.join(', ')
          : '—'}
      </span>
    </div>
  );
}
