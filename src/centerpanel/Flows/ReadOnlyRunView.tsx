import React, { useMemo } from "react";
import styles from "../styles/flows.module.css";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import NarrativeGenerationPanel from "../components/NarrativeGenerationPanel";
import { buildCompletedRunNarrativeInput } from "./narrativeBuilders";

export interface ReadOnlyRunViewProps {
  run: CompletedAnalysisRun;
  onBackToFlows?: () => void;
}

function pad2(n: number) { return String(n).padStart(2, "0"); }
function tsLocal(value: number | string): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())} (local)`;
}

const ReadOnlyRunView: React.FC<ReadOnlyRunViewProps> = ({ run, onBackToFlows }) => {
  const timestamp = useMemo(() => tsLocal(run.insertedAt), [run.insertedAt]);
  const text = run.paragraphFull ?? run.paragraph ?? "";
  const narrativeInput = useMemo(() => buildCompletedRunNarrativeInput(run), [run]);

  return (
    <div className={styles.readOnlyRunWrapper}>
      <div className={styles.readOnlyRunHeaderCard}>
        <div className={styles.readOnlyRunTitleRow}>
          <div>{run.label ?? "Completed Summary"}</div>
          <div className={styles.readOnlyRunTimestamp}>Recorded {timestamp}</div>
        </div>
        <div className={styles.readOnlyRunDisclaimer}>
          This summary reflects analyst documentation during this session. It is not a directive.
        </div>
        {onBackToFlows ? (
          <div>
            <button className={styles.btnGhost} onClick={onBackToFlows}>
              Back to Flows
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.readOnlyRunBodyCard}>
        {text}
      </div>

      <NarrativeGenerationPanel input={narrativeInput ?? undefined} subject={run.label} />
    </div>
  );
};

export default ReadOnlyRunView;
