import React, { lazy, Suspense } from "react";
import navCss from "../styles/centerpanel.module.css";
import flowCss from "../styles/flows.module.css";
import stripCss from "../urban-context-strip.module.css";
import { useProjectRegistry } from "../registry/state";
import FlowLibraryCard from "./FlowLibraryCard";
import type { FlowId } from "./flowTypes";
import type { ProjectRecord } from "../registry/types";
import CompletedRunsCard from "./rail/CompletedRunsCard";
import RelatedMethodsCard from "./rail/RelatedMethodsCard";
import { useFlowsUIStore } from "./uiStore";
import { usePanelBridgeStore } from "../../stores/usePanelBridgeStore";

const EngineCapabilitiesPanel = lazy(() => import("../components/EngineCapabilitiesPanel"));

function fmtWhen(ts?: number): string | undefined {
  if (!ts) return undefined;
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Severity = "info" | "med" | "high";

const FlowsRail: React.FC<{
  activeFlowId: FlowId;
  onSelectFlow: (fid: FlowId) => void;
  onOpenReviewRun?: (sessionId: string, runIndex: number) => void;
}> = ({ activeFlowId, onSelectFlow, onOpenReviewRun: _onOpenReviewRun }) => {
  const { state } = useProjectRegistry();

  const project: ProjectRecord | undefined = state.selectedProjectId
    ? state.projects.find((p) => p.id === state.selectedProjectId)
    : state.projects[0];

  const lastSession = (project as any)?.sessions ?? (project as any)?.encounters
    ? [...((project as any).sessions ?? (project as any).encounters ?? [])].sort((a: any, b: any) => b.when - a.when)[0]
    : undefined;

  // Build header from project info
  const headerParts: string[] = [];
  if (project?.name) headerParts.push(String(project.name));
  const headerLine = headerParts.join(" • ");

  const tagList: string[] = Array.isArray(project?.tags) ? project!.tags : [];

  // Derive urban metrics from project data
  const metrics: Array<{ label: string; value: string; sev: Severity }> = [];

  // Dataset count
  const datasetCount = lastSession?.completedRuns?.length ?? 0;
  if (datasetCount > 0) {
    metrics.push({ label: "Runs", value: String(datasetCount), sev: "info" });
  }

  const lastLine = lastSession
    ? `Last session: ${fmtWhen(lastSession.when)}${lastSession.location ? ` • ${lastSession.location}` : ""}`
    : undefined;

  const activateFlow = useFlowsUIStore((s) => s.activateFlow);

  const openFlow = (fid: FlowId) => {
    activateFlow(fid);
    onSelectFlow(fid);
    usePanelBridgeStore.getState().setActiveFlowId(fid);
  };

  return (
    <div className={flowCss.railStack} data-outline-class={navCss.outline}>
      <section
        className={`${flowCss.railCard} ${flowCss.snapshotCard}`}
        aria-label="Project context"
      >
        <header className={flowCss.railCardHeader}>
          <div className={flowCss.snapshotIdentLine} title={headerLine}>
            {headerLine || "No project selected"}
          </div>

          <div className={flowCss.snapshotTagsRow}>
            {tagList.map((tag) => (
              <span key={tag} className={flowCss.snapshotTagChip} data-tag={tag}>
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className={flowCss.snapBody}>
          {metrics.length > 0 && (
            <div className={flowCss.snapshotMetricsRow} aria-label="Project metrics">
              {metrics.map((m, idx) => (
                <span key={idx} className={`${stripCss.metricPill} ${flowCss.snapshotMetricPill}`} data-severity={m.sev}>
                  <span className={stripCss.kvLabel}>{m.label}:</span>
                  <span className={stripCss.kvValue} style={{ marginLeft: 4 }}>{m.value}</span>
                </span>
              ))}
            </div>
          )}

          {lastLine ? <div className={flowCss.snapshotSessionTime}>{lastLine}</div> : null}

          <div className={flowCss.snapshotDisclaimer}>
            Analytical workflows provide structured step-by-step guidance
            for urban analysis. Results depend on input data quality and
            methodological assumptions.
          </div>
        </div>
      </section>

      <FlowLibraryCard
        activeFlowId={activeFlowId}
        onSelectFlow={(fid) => {
          openFlow(fid);
        }}
      />

      <RelatedMethodsCard activeFlowId={activeFlowId} />

      <CompletedRunsCard />

      <Suspense fallback={null}>
        <EngineCapabilitiesPanel />
      </Suspense>

      <section className={flowCss.railCard} aria-label="GeoAI and reporting entry points">
        <div className={flowCss.railCardHeader}>
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              color: "var(--syn-text-muted, rgba(255,255,255,0.55))",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}
          >
            GeoAI & Reporting
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.45)",
              marginTop: 2,
            }}
          >
            GeoAI publishing and narrative drafting now live inside the active workflows and saved-run review surfaces rather than in disconnected rail demos.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 10px 10px" }}>
          <div className={flowCss.snapshotDisclaimer}>
            Object Detection now runs as a dedicated workflow and publishes a traceable GeoJSON layer, class summary, and saved analytical run directly into Map Explorer and Completed Run Review.
          </div>
          <div className={flowCss.snapshotDisclaimer}>
            Analytical Narrative Drafting is now available from the live result views of the major workflows and from completed-run review, using real structured outputs instead of placeholder content.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className={flowCss.outlineBtn} onClick={() => openFlow("object_detection")}>Open Detection Workflow</button>
            <button type="button" className={flowCss.outlineBtn} onClick={() => openFlow("review")}>Open Run Review</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlowsRail;
