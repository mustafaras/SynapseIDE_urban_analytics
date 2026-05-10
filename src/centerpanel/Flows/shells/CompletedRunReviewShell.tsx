import React, { lazy, Suspense, useMemo } from "react";
import styles from "../../styles/flows.module.css";
import { useProjectRegistry } from "../../registry/state";

const NarrativeGenerationPanel = lazy(() => import("../../components/NarrativeGenerationPanel"));

export type ReviewTarget = { sessionId: string; runIndex: number } | null;

function pad2(n: number) { return String(n).padStart(2, "0"); }

const CompletedRunReviewShell: React.FC<{ reviewTarget: ReviewTarget }> = ({ reviewTarget }) => {
  const { state } = useProjectRegistry();

  const { run, timestampStr } = useMemo(() => {
    if (!reviewTarget) return { run: null as any, timestampStr: "" };
    const project = state.selectedProjectId
      ? state.projects.find((p) => p.id === state.selectedProjectId)
      : state.projects[0];
    if (!project) return { run: null as any, timestampStr: "" };

    const sessions = (project as any)?.sessions ?? (project as any)?.encounters ?? [];
    const enc = sessions.find((e: any) => e.id === reviewTarget.sessionId) as any;
    if (!enc || !enc.completedRuns) return { run: null as any, timestampStr: "" };

    const r = enc.completedRuns[reviewTarget.runIndex];
    if (!r) return { run: null as any, timestampStr: "" };

    const d = new Date(r.insertedAt);
    const HH = pad2(d.getHours());
    const MM = pad2(d.getMinutes());
    const YYYY = d.getFullYear();
    const MMmo = pad2(d.getMonth() + 1);
    const DD = pad2(d.getDate());
    const ts = `${YYYY}-${MMmo}-${DD} ${HH}:${MM} (local)`;

    return { run: r, timestampStr: ts };
  }, [reviewTarget, state]);

  if (!run) {
    return (
      <section className={styles.panel}>
        <header className={styles.flowHeader}>
          <div className={styles.flowTitle}>Completed Summary</div>
          <div className={styles.flowSubtitle}>
          Select an item from &quot;Completed This Session&quot; to review the inserted documentation.
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitle}>{String(run.label ?? run.flowId)}</div>
        <div className={styles.flowSubtitle}>
          This text reflects analyst documentation recorded during this session. It supports communication, quality assurance, and analytical clarity. It is not a policy directive or binding recommendation.
        </div>
      </header>

      <div className={styles.warn} role="note" aria-label="analytical framing">
        Documentation below mirrors what was inserted into the session note. It does not replace direct analytical judgment, review, methodology standards, or established protocols.
      </div>

      <div className={styles.stepCard}>
        <div className={styles.stepCardTitle}>Inserted {timestampStr}</div>
        <div className={styles.row}>
         <div className={styles.rowLabel}>Summary paragraph</div>
          <div className={styles.rowInput}>
            <div className={styles.readonlyBlock}>
              {String(run.paragraph ?? "")}
            </div>
            <div className={styles.hint}>
              This paragraph was appended to the session note&#39;s outcome section at the recorded time. Language is intentionally descriptive, focused on observation, analytical reasoning, and communication. It is not a directive.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Suspense fallback={null}>
          <NarrativeGenerationPanel subject={String(run.label ?? run.flowId)} />
        </Suspense>
      </div>
    </section>
  );
};

export default CompletedRunReviewShell;
