import React, { useMemo } from "react";
import styles from "../styles/flows.module.css";
import { useFlowStore } from "@/stores/useFlowStore";
import type { FlowId } from "./flowTypes";
import {
  getRecommendedNextFlows,
  WORKFLOW_EXPERIENCE,
  WORKFLOW_JOURNEYS,
} from "./workflowExperience";

interface WorkflowCockpitProps {
  activeFlowId: FlowId;
  onSelectFlow: (flowId: FlowId) => void;
  onOpenScenarioDashboard?: () => void;
}

const WorkflowCockpit: React.FC<WorkflowCockpitProps> = ({
  activeFlowId,
  onSelectFlow,
  onOpenScenarioDashboard,
}) => {
  const completedRuns = useFlowStore((state) => state.completedRuns);

  const recommendedFlows = useMemo(
    () => getRecommendedNextFlows(completedRuns),
    [completedRuns],
  );

  const orderedFlowIds = useMemo(
    () => Object.entries(WORKFLOW_EXPERIENCE)
      .sort((left, right) => (left[1]?.order ?? 999) - (right[1]?.order ?? 999))
      .map(([flowId]) => flowId as FlowId),
    [],
  );

  return (
    <section className={`${styles.panel} ${styles.workflowCockpit}`}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>Flow Cockpit</div>
          <div className={styles.flowTitleMeta}>Workflow navigation layer</div>
        </div>
        <div className={styles.flowSubtitle}>
          If the workbench feels dense, use this cockpit first. It explains what each feature is for,
          what it expects as input, and which workflow should come next.
        </div>
      </header>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Recommended operating sequence</div>
        <div className={styles.workflowCommandIntro}>
          Build an interpretable evidence layer, move into 3D or simulation only when the project question requires it,
          and finish in Scenario Comparison when trade-offs must be briefed across intervention packages.
        </div>
        <div className={styles.workflowCommandList}>
          {recommendedFlows.map((flowId) => {
            const meta = WORKFLOW_EXPERIENCE[flowId];
            return (
              <button
                key={flowId}
                type="button"
                className={styles.workflowCommandButton}
                onClick={() => onSelectFlow(flowId)}
              >
                <span className={styles.workflowCommandLabel}>{meta?.label ?? "Flow"}</span>
                <span className={styles.workflowCommandText}>{meta?.quickUse ?? flowId}</span>
              </button>
            );
          })}
          {onOpenScenarioDashboard ? (
            <button type="button" className={styles.workflowCommandButton} onClick={onOpenScenarioDashboard}>
              <span className={styles.workflowCommandLabel}>Dashboard</span>
              <span className={styles.workflowCommandText}>Open Scenario Dashboard</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Journey map</div>
        <div className={styles.workflowJourneyGrid}>
          {WORKFLOW_JOURNEYS.map((journey) => {
            const flowIds = orderedFlowIds.filter((flowId) => WORKFLOW_EXPERIENCE[flowId]?.journey === journey.id);
            return (
              <section key={journey.id} className={styles.workflowJourneySection}>
                <header className={styles.workflowJourneyHeader}>
                  <div className={styles.formLabel}>{journey.label}</div>
                  <div className={styles.formHint}>{journey.hint}</div>
                </header>
                <div className={styles.workflowJourneyList}>
                  {flowIds.map((flowId) => {
                    const meta = WORKFLOW_EXPERIENCE[flowId]!;
                    return (
                      <button
                        key={flowId}
                        type="button"
                        className={styles.workflowJourneyButton}
                        onClick={() => onSelectFlow(flowId)}
                        data-active={flowId === activeFlowId ? "true" : undefined}
                      >
                        <span className={styles.workflowButtonLabel}>{meta.label}</span>
                        <span className={styles.workflowButtonUse}>{meta.quickUse}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Workflow feature map</div>
        <div className={styles.workflowFeatureMap}>
          {orderedFlowIds.map((flowId) => {
            const meta = WORKFLOW_EXPERIENCE[flowId]!;
            const runCount = completedRuns.filter((run) => run.flowId === flowId).length;
            return (
              <article
                key={flowId}
                className={styles.workflowFeatureRow}
                data-active={flowId === activeFlowId ? "true" : undefined}
              >
                <div className={styles.workflowFeatureHeader}>
                  <div className={styles.workflowFeatureLabel}>
                    {flowId === activeFlowId ? `${meta.label} - Active` : meta.label}
                  </div>
                  <span className={styles.workflowFeatureChip}>{meta.complexity}</span>
                </div>
                <div className={styles.workflowFeatureUse}>{meta.quickUse}</div>
                <div className={styles.workflowFeatureDetail}>
                  <strong>Inputs:</strong> {meta.inputs}
                </div>
                <div className={styles.workflowFeatureDetail}>
                  <strong>Outputs:</strong> {meta.outputs}
                </div>
                <div className={styles.workflowFeatureMetaRow}>
                  <span className={styles.workflowFeatureChip}>
                    {runCount > 0 ? `${runCount} saved run${runCount > 1 ? "s" : ""}` : "Ready to run"}
                  </span>
                  <span className={styles.workflowFeatureChip}>{meta.journey.replace(/_/g, " ")}</span>
                </div>
                <div className={styles.workflowFeatureActions}>
                  <button type="button" className={styles.workflowInlineAction} onClick={() => onSelectFlow(flowId)}>
                    Open workflow
                  </button>
                  {flowId === "scenario_comparison" && onOpenScenarioDashboard ? (
                    <button type="button" className={styles.workflowInlineAction} onClick={onOpenScenarioDashboard}>
                      Open dashboard
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowCockpit;
