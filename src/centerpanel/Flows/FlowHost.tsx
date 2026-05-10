import React, { Suspense, useEffect, useState } from "react";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import { MAP_ANALYSIS_DISPATCH_KEY, type MapAnalysisDispatchPayload } from "@/services/map/MapAnalysisDispatcher";
import styles from "../styles/flows.module.css";
import { useProjectRegistry } from "../registry/state";
import type { ProjectRecord } from "../registry/types";
import type { FlowId } from "./flowTypes";
import ReadOnlyRunView from "./ReadOnlyRunView";
import { useFlowsUIStore } from "./uiStore";
import { useFlowStore } from "@/stores/useFlowStore";
import WorkflowCockpit from "./WorkflowCockpit";
import { ChunkLoadBoundary, lazyWithRetry } from "@/utils/lazyWithRetry";
import { useUrbanContextStore } from "@/features/urbanAnalytics/useUrbanContextStore";

const SiteSuitabilityFlow = lazyWithRetry(() => import("./SiteSuitabilityFlow"));
const AccessibilityFlow = lazyWithRetry(() => import("./AccessibilityFlow"));
const VulnerabilityFlow = lazyWithRetry(() => import("./VulnerabilityFlow"));
const UrbanMorphologyFlow = lazyWithRetry(() => import("./UrbanMorphologyFlow"));
const ObjectDetectionFlow = lazyWithRetry(() => import("./ObjectDetectionFlow"));
const CompositeIndicatorFlow = lazyWithRetry(() => import("./CompositeIndicatorFlow"));
const ScenarioComparisonFlow = lazyWithRetry(() => import("./ScenarioComparisonFlow"));
const EquityAuditFlow = lazyWithRetry(() => import("./EquityAuditFlow"));
const ChangeDetectionFlow = lazyWithRetry(() => import("./ChangeDetectionFlow"));
const EmergingHotSpotFlow = lazyWithRetry(() => import("./EmergingHotSpotFlow"));
const AnalyticalRunReviewFlow = lazyWithRetry(() => import("./AnalyticalRunReviewFlow"));
const VoxCity3DFlow = lazyWithRetry(() => import("./VoxCity3DFlow"));
const CityJSONFlow = lazyWithRetry(() => import("./CityJSONFlow"));
const SunlightSimFlow = lazyWithRetry(() => import("./SunlightSimFlow"));
const CellularAutomataFlow = lazyWithRetry(() => import("./CellularAutomataFlow"));
const FacilityOptimisationFlow = lazyWithRetry(() => import("./FacilityOptimisationFlow"));
const SystemDynamicsFlow = lazyWithRetry(() => import("./SystemDynamicsFlow"));
const ScenarioComparisonDashboardModule = lazyWithRetry(() => import("../../features/dashboard/ScenarioComparisonDashboard"));

type WorkspaceView = "navigator" | "active" | "dashboard";

type FlowHostProps = {
  activeFlowId: FlowId;
  activeReviewRun?: { sessionId: string; runIndex: number } | null;
};

type StoredFlowSession = {
  id: string;
  when?: number | string;
  completedRuns?: CompletedAnalysisRun[];
};

type StoredFlowProject = ProjectRecord & {
  sessions?: StoredFlowSession[];
  encounters?: StoredFlowSession[];
};

const Loading: React.FC = () => (
  <div className={styles.emptyFlowPlaceholder}>
    <div className={styles.emptyFlowTitle}>Loading workflow…</div>
  </div>
);

function describeMapDispatch(dispatch: MapAnalysisDispatchPayload): string {
  if (dispatch.kind === "flow-aoi") {
    const geometryType = dispatch.aoi.geometry.type === "MultiPolygon" ? "multi-polygon AOI" : "polygon AOI";
    return `Map dispatch attached a ${geometryType} to this workflow${dispatch.restrictToView ? " and preserved the current extent filter" : ""}.`;
  }
  if (dispatch.kind === "isochrone") {
    return `Map dispatch seeded an accessibility run from ${dispatch.origin.lng.toFixed(4)}, ${dispatch.origin.lat.toFixed(4)} with a ${dispatch.thresholdMinutes}-minute threshold.`;
  }
  return `Map dispatch prepared a hot spot run around ${dispatch.origin.lng.toFixed(4)}, ${dispatch.origin.lat.toFixed(4)}.`;
}

function renderLazyFlow(flowId: FlowId, Component: React.LazyExoticComponent<React.ComponentType<any>>): React.ReactElement {
  return (
    <div data-testid={`workflow-${flowId}-root`}>
      <ChunkLoadBoundary
        compact
        title="Workflow temporarily unavailable"
        message="This workflow chunk did not load. Retry once the dev server reconnects, or reload the app if the problem persists."
      >
        <Suspense fallback={<Loading />}>
          <Component />
        </Suspense>
      </ChunkLoadBoundary>
    </div>
  );
}

function toSortableTimestamp(value?: number | string): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function renderFlow(flowId: FlowId): React.ReactElement {
  switch (flowId) {
    case "site_suitability":
      return renderLazyFlow("site_suitability", SiteSuitabilityFlow);
    case "accessibility":
      return renderLazyFlow("accessibility", AccessibilityFlow);
    case "vulnerability":
      return renderLazyFlow("vulnerability", VulnerabilityFlow);
    case "urban_morphology":
      return renderLazyFlow("urban_morphology", UrbanMorphologyFlow);
    case "object_detection":
      return renderLazyFlow("object_detection", ObjectDetectionFlow);
    case "indicator_composite":
      return renderLazyFlow("indicator_composite", CompositeIndicatorFlow);
    case "scenario_comparison":
      return renderLazyFlow("scenario_comparison", ScenarioComparisonFlow);
    case "equity_audit":
      return renderLazyFlow("equity_audit", EquityAuditFlow);
    case "change_detection":
      return renderLazyFlow("change_detection", ChangeDetectionFlow);
    case "emerging_hot_spot":
      return renderLazyFlow("emerging_hot_spot", EmergingHotSpotFlow);
    case "voxcity_3d":
      return renderLazyFlow("voxcity_3d", VoxCity3DFlow);
    case "cityjson_loader":
      return renderLazyFlow("cityjson_loader", CityJSONFlow);
    case "sunlight_sim":
      return renderLazyFlow("sunlight_sim", SunlightSimFlow);
    case "facility_optimisation":
      return renderLazyFlow("facility_optimisation", FacilityOptimisationFlow);
    case "urban_growth_ca":
      return renderLazyFlow("urban_growth_ca", CellularAutomataFlow);
    case "system_dynamics":
      return renderLazyFlow("system_dynamics", SystemDynamicsFlow);
    case "review":
      return renderLazyFlow("review", AnalyticalRunReviewFlow);
    default:
      return <PlaceholderFlow title={flowId} icon="—" />;
  }
}

const PlaceholderFlow: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <section className={styles.panel}>
    <header className={styles.flowHeader}>
      <div className={styles.flowTitleRow}>
        <div className={styles.flowTitleMain}>{icon} {title}</div>
      </div>
      <div className={styles.flowSubtitle}>
        This workflow id is not registered in the current workflow library.
      </div>
    </header>
    <div className={styles.flowBodyArea}>
      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Unsupported workflow route</div>
        <p style={{ opacity: 0.7, padding: "1rem" }}>
          Select an available workflow from the Navigator, or reopen the related method card to launch a supported analytical surface.
        </p>
      </div>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// StudyAreaBanner — shows current study area or prompts user to set one
// Rendered before every active workflow so the analysis location is always
// visible and can be changed without leaving the workflow surface.
// ---------------------------------------------------------------------------

function StudyAreaBanner() {
  const studyAreaName = useUrbanContextStore((s) => s.context?.studyAreaName ?? null);
  const studyAreaBounds = useUrbanContextStore((s) => s.context?.studyAreaBounds ?? null);

  if (studyAreaName) {
    return (
      <section
        className={styles.panel}
        data-testid="study-area-banner"
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 6,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span style={{ fontSize: 10, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--codefont)" }}>
            Analysis area
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", fontFamily: "var(--codefont)" }}>
            {studyAreaName}
          </span>
          {studyAreaBounds && (
            <span style={{ fontSize: 10, opacity: 0.4, fontFamily: "var(--codefont)" }}>
              ({studyAreaBounds[0].toFixed(2)}, {studyAreaBounds[1].toFixed(2)}) — ({studyAreaBounds[2].toFixed(2)}, {studyAreaBounds[3].toFixed(2)})
            </span>
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("synapse:urban:open", { detail: { tab: "context" } }))}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.45)",
              borderRadius: 4,
              padding: "1px 7px",
              fontSize: 10,
              cursor: "pointer",
              fontFamily: "var(--codefont)",
            }}
          >
            change
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      data-testid="study-area-banner-unset"
      style={{ paddingTop: 0, paddingBottom: 0 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderRadius: 6,
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.22)",
        }}
      >
        <span style={{ fontSize: 11, color: "#fbbf24", opacity: 0.85, fontFamily: "var(--codefont)" }}>
          ⚠ No study area defined
        </span>
        <span style={{ fontSize: 11, opacity: 0.55, fontFamily: "var(--codefont)" }}>
          — set a study area in Urban Analytics to anchor this analysis to a real location.
          Results will use demo extents until an area is selected.
        </span>
      </div>
    </section>
  );
}

const FlowHost: React.FC<FlowHostProps> = ({ activeFlowId }) => {

  const { currentViewMode, currentFlowId, selectedRunId, activateFlow } = useFlowsUIStore();
  const { state } = useProjectRegistry();
  const queuedMapDispatch = useFlowStore((store) => store.stepData[MAP_ANALYSIS_DISPATCH_KEY] as MapAnalysisDispatchPayload | null);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("navigator");

  useEffect(() => {
    if (currentViewMode === "flowActive" && currentFlowId) {
      setWorkspaceView("active");
    }
  }, [currentFlowId, currentViewMode]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: WorkspaceView; flowId?: FlowId }>).detail;
      if (detail?.flowId) {
        activateFlow(detail.flowId);
      }
      if (detail?.view) {
        setWorkspaceView(detail.view);
      }
    };

    window.addEventListener("synapse:workflow-workspace", handler);
    return () => window.removeEventListener("synapse:workflow-workspace", handler);
  }, [activateFlow]);

  if (currentViewMode === "runReview" && selectedRunId) {
    const project = (state.selectedProjectId
      ? state.projects.find((p) => p.id === state.selectedProjectId)
      : state.projects[0]) as StoredFlowProject | undefined;
    const sessions = project?.sessions ?? project?.encounters ?? [];
    const session = sessions.find((entry) => entry.id === state.selectedSessionId)
      ?? [...sessions].sort((left, right) => toSortableTimestamp(right.when) - toSortableTimestamp(left.when))[0];
    const run = session?.completedRuns?.find((entry) => (entry.runId || `${entry.flowId}-${entry.insertedAt}`) === selectedRunId);
    if (run) {
      return <ReadOnlyRunView run={run} onBackToFlows={() => {
        activateFlow((currentFlowId as FlowId | null) ?? activeFlowId);
        setWorkspaceView("active");
      }} />;
    }

    return (
      <div className={styles.panel}>
        <div className={styles.flowTitle}>Completed Summary</div>
        <div className={styles.flowSubtitle}>That run could not be found. It may have been cleared from this session.</div>
      </div>
    );
  }

  const resolvedFlowId = (currentFlowId as FlowId | null) ?? activeFlowId;
  const activeDispatch = queuedMapDispatch && (
    (queuedMapDispatch.kind === "flow-aoi" && queuedMapDispatch.flowId === resolvedFlowId) ||
    (queuedMapDispatch.kind === "isochrone" && resolvedFlowId === "accessibility")
  ) ? queuedMapDispatch : null;

  return (
    <div className={styles.flowShellOuter}>
      <section className={styles.panel}>
        <header className={styles.flowHeader}>
          <div className={styles.flowTitleRow}>
            <div className={styles.flowTitleMain}>Workflow Workspace</div>
            <div className={styles.flowTitleMeta}>Discover, run, and compare Prompt 01-25 capabilities</div>
          </div>
          <div className={styles.flowSubtitle}>
            Navigator explains where each capability fits. Active Workflow opens the selected flow. Scenario Dashboard exposes the Prompt 23 comparison surface as a dedicated module, while System Dynamics and Emerging Hot Spot Analysis extend the simulation and spatiotemporal evidence surfaces with execution-grade workflow entry points.
          </div>
        </header>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => setWorkspaceView("navigator")}
            style={{ borderColor: workspaceView === "navigator" ? "var(--syn-accent-primary)" : undefined }}
          >
            Navigator
          </button>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => setWorkspaceView("active")}
            style={{ borderColor: workspaceView === "active" ? "var(--syn-accent-primary)" : undefined }}
          >
            Active Workflow
          </button>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => {
              activateFlow("scenario_comparison");
              setWorkspaceView("dashboard");
            }}
            style={{ borderColor: workspaceView === "dashboard" ? "var(--syn-accent-primary)" : undefined }}
          >
            Scenario Dashboard
          </button>
        </div>
      </section>

      {workspaceView === "navigator" ? (
        <WorkflowCockpit
          activeFlowId={resolvedFlowId}
          onSelectFlow={(flowId) => {
            activateFlow(flowId);
            setWorkspaceView("active");
          }}
          onOpenScenarioDashboard={() => {
            activateFlow("scenario_comparison");
            setWorkspaceView("dashboard");
          }}
        />
      ) : null}

      {workspaceView === "dashboard" ? (
        <ChunkLoadBoundary
          compact
          title="Dashboard temporarily unavailable"
          message="The scenario dashboard chunk did not load. Retry after the dev server reconnects, or reload the app if it persists."
        >
          <Suspense fallback={<Loading />}>
            <ScenarioComparisonDashboardModule
              onOpenFlow={() => {
                activateFlow("scenario_comparison");
                setWorkspaceView("active");
              }}
            />
          </Suspense>
        </ChunkLoadBoundary>
      ) : null}

      {workspaceView === "active" && activeDispatch ? (
        <section className={styles.panel} data-testid="map-dispatch-banner">
          <div className={styles.stepContentCard}>
            <div className={styles.stepCardTitle}>Map Dispatch Ready</div>
            <p className={styles.formHint}>{describeMapDispatch(activeDispatch)}</p>
          </div>
        </section>
      ) : null}

      {workspaceView === "active" ? <StudyAreaBanner /> : null}

      {workspaceView === "active" ? renderFlow(resolvedFlowId) : null}
    </div>
  );
};

export default FlowHost;
