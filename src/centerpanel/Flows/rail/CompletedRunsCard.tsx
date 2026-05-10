import React, { useMemo } from "react";
import styles from "../../styles/flows.module.css";
import { useProjectRegistry } from "../../registry/state";
import { useFlowsUIStore } from "../uiStore";

function pad2(n: number) { return String(n).padStart(2, "0"); }

const CompletedRunsCard: React.FC = () => {
  const { state } = useProjectRegistry();
  const reviewRun = useFlowsUIStore((s) => s.reviewRun);

  const activeEnc = useMemo(() => {
    const project = state.selectedProjectId
      ? state.projects.find((p) => p.id === state.selectedProjectId)
      : state.projects[0];
    if (!project) return undefined;
    const sessions = (project as any)?.sessions ?? (project as any)?.encounters ?? [];
    const enc = sessions.find((e: any) => e.id === state.selectedSessionId)
      ?? [...sessions].sort((a: any, b: any) => (b.when ?? 0) - (a.when ?? 0))[0];
    return enc;
  }, [state]);

  const runs = useMemo(() => {
    return [...(activeEnc?.completedRuns || [])]
      .filter(Boolean)
      .sort((a, b) => (b.insertedAt ?? 0) - (a.insertedAt ?? 0));
  }, [activeEnc?.completedRuns]);

  const count = runs.length;

  return (
    <section className={styles.completedCard} aria-label="Completed This Session">
      <div className={styles.completedCardHeader}>
        Completed This Session {count > 0 ? <span className={styles.railCountPill}>{count}</span> : null}
      </div>

      <div className={styles.completedRunList}>
        {count === 0 ? (
          <div className={styles.completedEmpty}>Run an analytical workflow to completion — results will be listed here for review and comparison.</div>
        ) : (
          runs.map((run) => {
            const d = new Date(run.insertedAt ?? 0);
            const ts = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
            const runId = run.runId || `${run.flowId}-${run.insertedAt}`;
            return (
              <div
                key={runId}
                className={styles.completedRunRow}
                role="button"
                tabIndex={0}
                onClick={() => reviewRun(runId)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reviewRun(runId); } }}
                aria-label={`Review ${run.label || run.flowId} inserted at ${ts}`}
              >
                <div className={styles.completedRunTime}>{ts}</div>
                <div className={styles.completedRunLabel}>{String(run.label ?? run.flowId)}</div>
                <div className={styles.completedRunStatus}>→ inserted</div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.completedDisclaimer}>
        These summaries reflect analyst documentation during this session. They are not policy directives.
      </div>
    </section>
  );
};

export default CompletedRunsCard;
