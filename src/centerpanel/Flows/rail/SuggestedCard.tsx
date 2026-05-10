import React, { useMemo } from "react";
import styles from "../../styles/flows.module.css";
import { useProjectRegistry } from "../../registry/state";
import type { Patient } from "../../registry/types";
import { getSuggestions } from "../suggestions/getSuggestions";
import { useFlowsUIStore } from "../uiStore";

const SuggestedCard: React.FC = () => {
  const { state } = useProjectRegistry();
  const activateFlow = useFlowsUIStore((s) => s.activateFlow);

  const { project, session } = useMemo(() => {
    const p: Patient | undefined = state.selectedProjectId
      ? (state.projects as any[]).find((x) => x.id === state.selectedProjectId)
      : (state.projects as any[])[0];
    const sessions = (p as any)?.sessions ?? (p as any)?.encounters ?? [];
    const lastEnc = [...sessions].sort((a: any, b: any) => (b.when ?? 0) - (a.when ?? 0))[0];
    const e = sessions.find((k: any) => k.id === state.selectedSessionId) ?? lastEnc;
    return { project: p, session: e };
  }, [state]);

  const suggestions = useMemo(() => getSuggestions(project, session), [project, session]);

  return (
    <div className={styles.suggestedCard} aria-label="Suggested">
      <div className={styles.suggestedHeader}>Suggested</div>

      <div className={styles.suggestedList}>
        {suggestions.length === 0 ? (
          <div className={styles.suggestedEmpty}>Select a project and session to see workflow suggestions based on your data and analysis context.</div>
        ) : (
          suggestions.map((s) => (
            <button
              key={`${s.flowId}-${s.reasonCode ?? s.titleLine}`}
              className={styles.suggestedPill}
              onClick={() => activateFlow(s.flowId)}
            >
              <div className={styles.suggestedPillTitle}>{s.titleLine}</div>
              <div className={styles.suggestedPillExplainer}>{s.explainerLine}</div>
            </button>
          ))
        )}
      </div>

      <div className={styles.suggestedDisclaimer}>
        These prompts highlight documentation pathways for communication and quality monitoring. They are not policy directives or
        binding recommendations.
      </div>
    </div>
  );
};

export default SuggestedCard;
