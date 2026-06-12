import React from "react";
import { Circle } from "lucide-react";
import type { MapBottomPanelTabId } from "../mapLegacyBottomTabs";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { GisEmptyState, GisStatusChip } from "../ui";

export type MapBottomPanelCoreTabId = Extract<
  MapBottomPanelTabId,
  "problems" | "attributes" | "timeline" | "tasks" | "diagnostics"
>;

export type MapBottomPanelTaskStatus = "idle" | "ready" | "running" | "warning" | "blocked" | "complete";

export interface MapBottomPanelTask {
  id: string;
  label: string;
  status: MapBottomPanelTaskStatus;
  detail: string;
  meta?: string;
}

export interface MapBottomPanelBodyContent {
  problems: React.ReactNode;
  attributes: React.ReactNode;
  timeline: React.ReactNode;
  diagnostics: React.ReactNode;
  tasks: readonly MapBottomPanelTask[];
}

export interface MapBottomPanelScrollBodyProps {
  children: React.ReactNode;
  "data-testid"?: string;
  padding?: React.CSSProperties["padding"];
}

export interface MapBottomPanelActiveBodyProps extends MapBottomPanelBodyContent {
  activeTabId: MapBottomPanelCoreTabId;
  panelId: string;
  labelledBy: string;
}

const panelBodyStyle: React.CSSProperties = {
  height: "100%",
  minHeight: MAP_SPACING.zero,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const scrollBodyStyle: React.CSSProperties = {
  height: "100%",
  minHeight: MAP_SPACING.zero,
  overflow: "auto",
  padding: MAP_SPACING.md,
};

const tasksListStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  height: "100%",
  minWidth: MAP_SPACING.zero,
  overflow: "auto",
};

const taskRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 0.55fr) minmax(0, 1fr) minmax(7rem, auto)",
  alignItems: "center",
  gap: MAP_SPACING.md,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
};

const taskLabelStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.titleWrap,
};

const taskDetailStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  overflowWrap: "anywhere",
};

const taskMetaStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  ...MAP_TEXT_STYLES.truncate,
};

const taskStatusStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  width: "fit-content",
  minHeight: "1.375rem",
  padding: `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "capitalize",
};

function taskStatusToGisStatus(status: MapBottomPanelTaskStatus): GisStatusKey {
  switch (status) {
    case "running":
      return "running";
    case "warning":
      return "caveat";
    case "blocked":
      return "blocked";
    case "ready":
    case "complete":
      return "ready";
    case "idle":
    default:
      return "unknown";
  }
}

function TaskStatusChip({ status }: { status: MapBottomPanelTaskStatus }): React.ReactElement {
  return (
    <GisStatusChip
      status={taskStatusToGisStatus(status)}
      label={status}
      density="compact"
      style={taskStatusStyle}
    />
  );
}

export function MapBottomPanelScrollBody({
  children,
  "data-testid": testId,
  padding,
}: MapBottomPanelScrollBodyProps): React.ReactElement {
  return (
    <div style={padding == null ? scrollBodyStyle : { ...scrollBodyStyle, padding }} data-testid={testId}>
      {children}
    </div>
  );
}

export function MapBottomPanelTasksBody({ tasks }: { tasks: readonly MapBottomPanelTask[] }): React.ReactElement {
  if (tasks.length === 0) {
    return (
      <MapBottomPanelScrollBody>
        <GisEmptyState
          icon={<Circle size={MAP_ICON_SIZES.md} aria-hidden="true" />}
          title="No background tasks"
          description="Imports, workflow execution, worker transfer, and diagnostics jobs will appear here when they run."
          compact
        />
      </MapBottomPanelScrollBody>
    );
  }

  return (
    <div style={tasksListStyle} role="list" aria-label="Map background tasks" data-testid="map-bottom-panel-tasks">
      {tasks.map((task) => (
        <article key={task.id} role="listitem" style={taskRowStyle}>
          <div style={taskLabelStyle}>{task.label}</div>
          <div style={taskDetailStyle}>{task.detail}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: MAP_SPACING.sm, justifyContent: "end" }}>
            {task.meta ? <span style={taskMetaStyle}>{task.meta}</span> : null}
            <TaskStatusChip status={task.status} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function MapBottomPanelActiveBody({
  activeTabId,
  panelId,
  labelledBy,
  problems,
  attributes,
  timeline,
  diagnostics,
  tasks,
}: MapBottomPanelActiveBodyProps): React.ReactElement {
  const activeContent = (() => {
    switch (activeTabId) {
      case "attributes":
        return attributes;
      case "timeline":
        return timeline;
      case "tasks":
        return <MapBottomPanelTasksBody tasks={tasks} />;
      case "diagnostics":
        return diagnostics;
      case "problems":
      default:
        return problems;
    }
  })();

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      style={panelBodyStyle}
      data-testid={`map-bottom-panel-content-${activeTabId}`}
    >
      {activeContent}
    </div>
  );
}
