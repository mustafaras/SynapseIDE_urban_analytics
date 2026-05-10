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

const buttonGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const flowCardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 10,
};

const journeyGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 10,
};

const journeyCardStyle: React.CSSProperties = {
  border: "1px solid var(--syn-overlay-light)",
  borderRadius: 8,
  padding: 12,
  background: "var(--syn-overlay-whisper)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const flowCardStyle: React.CSSProperties = {
  border: "1px solid var(--syn-overlay-light)",
  borderRadius: 8,
  padding: 12,
  background: "var(--syn-overlay-whisper)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid var(--syn-overlay-medium)",
  background: "var(--syn-depth-subtle)",
  fontSize: 10,
  color: "var(--syn-text-muted)",
  fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
};

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
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>Flow Cockpit</div>
          <div className={styles.flowTitleMeta}>Prompt 15-25 navigation layer</div>
        </div>
        <div className={styles.flowSubtitle}>
          If the workbench feels dense, use this cockpit first. It explains what each feature is for,
          what it expects as input, and which workflow should come next.
        </div>
      </header>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Recommended operating sequence</div>
        <div className={styles.formHint}>
          1. Build an interpretable evidence layer. 2. Move into 3D or simulation only when the project question requires it.
          3. Finish in Scenario Comparison when you need to brief trade-offs across intervention packages.
        </div>
        <div style={buttonGridStyle}>
          {recommendedFlows.map((flowId) => {
            const meta = WORKFLOW_EXPERIENCE[flowId];
            return (
              <button
                key={flowId}
                type="button"
                className={styles.outlineBtn}
                onClick={() => onSelectFlow(flowId)}
              >
                {meta?.prompt ?? "Flow"} - {meta?.quickUse ?? flowId}
              </button>
            );
          })}
          {onOpenScenarioDashboard ? (
            <button type="button" className={styles.outlineBtn} onClick={onOpenScenarioDashboard}>
              Open Scenario Dashboard
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Journey map</div>
        <div style={journeyGridStyle}>
          {WORKFLOW_JOURNEYS.map((journey) => {
            const flowIds = orderedFlowIds.filter((flowId) => WORKFLOW_EXPERIENCE[flowId]?.journey === journey.id);
            return (
              <div key={journey.id} style={journeyCardStyle}>
                <div>
                  <div className={styles.formLabel}>{journey.label}</div>
                  <div className={styles.formHint}>{journey.hint}</div>
                </div>
                <div style={buttonGridStyle}>
                  {flowIds.map((flowId) => {
                    const meta = WORKFLOW_EXPERIENCE[flowId]!;
                    return (
                      <button
                        key={flowId}
                        type="button"
                        className={styles.outlineBtn}
                        onClick={() => onSelectFlow(flowId)}
                        style={{
                          borderColor: flowId === activeFlowId ? "var(--syn-accent-primary)" : undefined,
                        }}
                      >
                        {meta.prompt} - {meta.quickUse}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Prompt 15-25 feature map</div>
        <div style={flowCardGridStyle}>
          {orderedFlowIds.map((flowId) => {
            const meta = WORKFLOW_EXPERIENCE[flowId]!;
            const runCount = completedRuns.filter((run) => run.flowId === flowId).length;
            return (
              <div key={flowId} style={flowCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div className={styles.formLabel}>{flowId === activeFlowId ? `${meta.prompt} · Active` : meta.prompt}</div>
                  <span style={chipStyle}>{meta.complexity}</span>
                </div>
                <div className={styles.formHint}>{meta.quickUse}</div>
                <div style={{ fontSize: 11, color: "var(--syn-text-primary)" }}>
                  <strong>Inputs:</strong> {meta.inputs}
                </div>
                <div style={{ fontSize: 11, color: "var(--syn-text-primary)" }}>
                  <strong>Outputs:</strong> {meta.outputs}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={chipStyle}>{runCount > 0 ? `${runCount} saved run${runCount > 1 ? "s" : ""}` : "Ready to run"}</span>
                  <span style={chipStyle}>{meta.journey.replace(/_/g, " ")}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className={styles.outlineBtn} onClick={() => onSelectFlow(flowId)}>
                    Open workflow
                  </button>
                  {flowId === "scenario_comparison" && onOpenScenarioDashboard ? (
                    <button type="button" className={styles.outlineBtn} onClick={onOpenScenarioDashboard}>
                      Open dashboard
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowCockpit;