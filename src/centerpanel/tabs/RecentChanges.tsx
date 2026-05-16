import React from "react";
import styles from "../styles/note.module.css";
import { loadUrbanFromPersist } from "../registry/storage";
import { useProjectRegistry } from "../registry/state";
import {
  buildProjectHistoryFeed,
  normalizeProjectSnapshots,
  PROJECT_HISTORY_REFRESH_EVENT,
} from "@/features/collaboration/projectHistory";
import { useFlowStore } from "@/stores/useFlowStore";
import type { SlotKey } from "../../stores/useNoteStore";

const SLOT_TITLES: Record<SlotKey, string> = {
  objective: "Objective",
  methodology: "Methodology",
  findings: "Findings",
  recommendations: "Recommendations",
  dataRefs: "Data References",
  limitations: "Limitations",
  summary: "Summary",
  plan: "Plan",
  refs: "References (APA)",
  outcome: "Flow Outcome",
  vitals: "Vitals / Results",
};

function formatExactWhen(ms: number): string {
  if (!Number.isFinite(ms)) return "Unknown time";
  return new Date(ms).toLocaleString();
}

function formatRelativeWhen(ms: number): string {
  if (!Number.isFinite(ms)) return "unknown";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function formatSourceModeLabel(mode: "real" | "demo" | "mixed" | "unknown"): string {
  switch (mode) {
    case "real":
      return "Real data";
    case "demo":
      return "Demo data";
    case "mixed":
      return "Mixed sources";
    default:
      return "Unknown source";
  }
}

export function RecentChanges(props: {
  slot: SlotKey;
  projectId?: string;
  onDiff: (snapId: string) => void;
}) {
  const { state } = useProjectRegistry();
  const completedRuns = useFlowStore((store) => store.completedRuns);
  const targetProjectId = props.projectId ?? state.selectedProjectId;
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    const onHistoryRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!detail?.projectId || !targetProjectId || detail.projectId === targetProjectId) {
        setRefreshTick((value) => value + 1);
      }
    };

    window.addEventListener(PROJECT_HISTORY_REFRESH_EVENT, onHistoryRefresh as EventListener);
    return () => window.removeEventListener(PROJECT_HISTORY_REFRESH_EVENT, onHistoryRefresh as EventListener);
  }, [targetProjectId]);

  const projectFromState = targetProjectId
    ? state.projects.find((entry) => entry.id === targetProjectId)
    : undefined;
  const projectFromPersist = React.useMemo(
    () => (targetProjectId ? loadUrbanFromPersist()?.find((entry) => entry.id === targetProjectId) : undefined),
    [refreshTick, targetProjectId],
  );
  const project = React.useMemo(() => {
    if (!projectFromPersist) {
      return projectFromState;
    }
    if (!projectFromState) {
      return projectFromPersist;
    }

    const persistedSnapshotCount = normalizeProjectSnapshots(projectFromPersist.reportSnapshots).length;
    const stateSnapshotCount = normalizeProjectSnapshots(projectFromState.reportSnapshots).length;
    const persistedChangeCount = buildProjectHistoryFeed(projectFromPersist, { slotId: props.slot, completedRuns }).length;
    const stateChangeCount = buildProjectHistoryFeed(projectFromState, { slotId: props.slot, completedRuns }).length;

    if (persistedSnapshotCount > stateSnapshotCount || persistedChangeCount > stateChangeCount) {
      return projectFromPersist;
    }
    return projectFromState;
  }, [completedRuns, projectFromPersist, projectFromState, props.slot]);

  const recentItems = React.useMemo(
    () => buildProjectHistoryFeed(project, { slotId: props.slot, limit: 5, completedRuns }),
    [completedRuns, project, props.slot],
  );

  return (
    <section
      className={styles.recentChanges}
      data-testid="note-recent-changes"
      data-slot={props.slot}
      aria-label={`Recent changes for ${SLOT_TITLES[props.slot] ?? props.slot}`}
    >
      <div className={styles.slotHeaderRow}>
        <span className={styles.slotHeaderTitle}>Recent Changes</span>
        <span className={styles.snapshotMeta}>{project ? `${normalizeProjectSnapshots(project.reportSnapshots).length} snapshots` : "No project"}</span>
      </div>
      {recentItems.length === 0 ? (
        <div className={styles.meta}>
          Save a snapshot, save the report, or complete an analytical run to populate review history for this project.
        </div>
      ) : (
        recentItems.map((item) => {
          const changedAtMs = Date.parse(item.changedAt);
          return (
          <div key={item.id} className={styles.recentChangeRow}>
            <span className={styles.recentChangeTime} title={formatExactWhen(changedAtMs)}>
              {formatRelativeWhen(changedAtMs)}
            </span>
            <div className={styles.recentChangePreview}>
              <strong>{item.title}</strong>
              {` · ${formatSourceModeLabel(item.sourceMode)} · ${item.description}`}
            </div>
            <div className={styles.recentChangeActions}>
              {item.snapshotId ? (
                <button type="button" onClick={() => props.onDiff(item.snapshotId!)}>
                  Compare
                </button>
              ) : (
                <span className={styles.snapshotMeta}>{item.artifact.label}</span>
              )}
            </div>
          </div>
          );
        })
      )}
    </section>
  );
}
