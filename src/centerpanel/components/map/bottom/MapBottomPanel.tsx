import React, { useMemo, useRef } from "react";
import { Activity, AlertTriangle, CheckCircle2, Circle, CircleDashed, X } from "lucide-react";
import type { MapBottomPanelTabId as NavigationMapBottomPanelTabId } from "../navigation";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_ICON_SIZES,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { GisEmptyState, GisIconButton } from "../ui";

export type MapBottomPanelCoreTabId = Extract<
  NavigationMapBottomPanelTabId,
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

export interface MapBottomPanelProps {
  visible: boolean;
  activeTabId: MapBottomPanelCoreTabId;
  onTabChange: (tabId: MapBottomPanelCoreTabId) => void;
  onClose: () => void;
  problems: React.ReactNode;
  attributes: React.ReactNode;
  timeline: React.ReactNode;
  diagnostics: React.ReactNode;
  tasks: readonly MapBottomPanelTask[];
}

const TAB_DEFINITIONS: ReadonlyArray<{
  id: MapBottomPanelCoreTabId;
  label: string;
  description: string;
}> = [
  {
    id: "problems",
    label: "Problems",
    description: "Scientific QA blockers, warnings, caveats, and render issues.",
  },
  {
    id: "attributes",
    label: "Attributes",
    description: "Attribute table, selected rows, field profile, and derived field tools.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Review events, audit log, evidence references, and revert actions.",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Imports, workflow execution, worker transfer, and background status.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description: "Render budgets, worker failures, redacted telemetry, and retry actions.",
  },
];

const panelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  minHeight: "12rem",
  height: MAP_PANEL_SIZES.bottomPanelHeight,
  maxHeight: MAP_PANEL_SIZES.bottomPanelMaxHeight,
  minWidth: MAP_SPACING.zero,
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_STROKES.hairlineStrong,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
};

const tabListStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.zero,
  minWidth: MAP_SPACING.zero,
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  scrollbarGutter: "stable",
};

const tabButtonBaseStyle: React.CSSProperties = {
  position: "relative",
  minHeight: MAP_DENSITY.compact.rowHeight,
  maxWidth: "10.5rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  border: MAP_STROKES.none,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textMuted,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.chipLabel,
};

const tabButtonActiveStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  background: MAP_COLORS.selectedSubtle,
  boxShadow: `inset 0 -2px 0 ${MAP_COLORS.interaction}`,
};

const closeSlotStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `0 ${MAP_SPACING.sm}`,
};

const bodyStyle: React.CSSProperties = {
  minHeight: MAP_SPACING.zero,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

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

function statusTone(status: MapBottomPanelTaskStatus): { color: string; background: string; icon: React.ReactNode } {
  switch (status) {
    case "running":
      return {
        color: "var(--syn-status-running, #60a5fa)",
        background: "rgba(37, 99, 235, 0.14)",
        icon: <Activity size={MAP_ICON_SIZES.xs} aria-hidden="true" />,
      };
    case "warning":
      return {
        color: MAP_COLORS.caveatText,
        background: MAP_COLORS.caveat,
        icon: <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />,
      };
    case "blocked":
      return {
        color: MAP_COLORS.error,
        background: "rgba(127, 29, 29, 0.28)",
        icon: <AlertTriangle size={MAP_ICON_SIZES.xs} aria-hidden="true" />,
      };
    case "ready":
    case "complete":
      return {
        color: MAP_COLORS.success,
        background: MAP_COLORS.selectedSubtle,
        icon: <CheckCircle2 size={MAP_ICON_SIZES.xs} aria-hidden="true" />,
      };
    case "idle":
    default:
      return {
        color: MAP_COLORS.textMuted,
        background: MAP_COLORS.transparent,
        icon: <CircleDashed size={MAP_ICON_SIZES.xs} aria-hidden="true" />,
      };
  }
}

function TaskStatusChip({ status }: { status: MapBottomPanelTaskStatus }): React.ReactElement {
  const tone = statusTone(status);
  return (
    <span style={{ ...taskStatusStyle, color: tone.color, background: tone.background, borderColor: tone.color }}>
      {tone.icon}
      {status}
    </span>
  );
}

function TasksPanel({ tasks }: { tasks: readonly MapBottomPanelTask[] }): React.ReactElement {
  if (tasks.length === 0) {
    return (
      <div style={scrollBodyStyle}>
        <GisEmptyState
          icon={<Circle size={MAP_ICON_SIZES.md} aria-hidden="true" />}
          title="No background tasks"
          description="Imports, workflow execution, worker transfer, and diagnostics jobs will appear here when they run."
          compact
        />
      </div>
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

export function MapBottomPanel({
  visible,
  activeTabId,
  onTabChange,
  onClose,
  problems,
  attributes,
  timeline,
  diagnostics,
  tasks,
}: MapBottomPanelProps): React.ReactElement | null {
  const tabRefs = useRef<Partial<Record<MapBottomPanelCoreTabId, HTMLButtonElement | null>>>({});
  const activeTab = useMemo(
    () => TAB_DEFINITIONS.find((tab) => tab.id === activeTabId) ?? TAB_DEFINITIONS[0],
    [activeTabId],
  );

  if (!visible) return null;

  const focusTab = (tabId: MapBottomPanelCoreTabId): void => {
    const applyFocus = (): void => tabRefs.current[tabId]?.focus();
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(applyFocus);
      return;
    }
    applyFocus();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabId: MapBottomPanelCoreTabId): void => {
    const currentIndex = TAB_DEFINITIONS.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_DEFINITIONS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_DEFINITIONS.length) % TAB_DEFINITIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TAB_DEFINITIONS.length - 1;
    }

    if (nextIndex == null) return;

    event.preventDefault();
    const nextTabId = TAB_DEFINITIONS[nextIndex]?.id ?? "problems";
    onTabChange(nextTabId);
    focusTab(nextTabId);
  };

  const activeContent = (() => {
    switch (activeTab.id) {
      case "attributes":
        return attributes;
      case "timeline":
        return timeline;
      case "tasks":
        return <TasksPanel tasks={tasks} />;
      case "diagnostics":
        return diagnostics;
      case "problems":
      default:
        return problems;
    }
  })();

  return (
    <section
      style={panelStyle}
      aria-label="Map bottom panel"
      data-testid="map-bottom-panel"
      data-active-bottom-tab={activeTab.id}
    >
      <header style={headerStyle}>
        <div style={tabListStyle} role="tablist" aria-label="Map bottom panel tabs">
          {TAB_DEFINITIONS.map((tab) => {
            const selected = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[tab.id] = element;
                }}
                type="button"
                role="tab"
                id={`map-bottom-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`map-bottom-tabpanel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                title={tab.description}
                data-testid={`map-bottom-tab-${tab.id}`}
                style={{ ...tabButtonBaseStyle, ...(selected ? tabButtonActiveStyle : undefined) }}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div style={closeSlotStyle}>
          <GisIconButton
            label="Close bottom panel"
            icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
            onClick={onClose}
            size="sm"
          />
        </div>
      </header>

      <div style={bodyStyle}>
        <div
          id={`map-bottom-tabpanel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`map-bottom-tab-${activeTab.id}`}
          style={panelBodyStyle}
          data-testid={`map-bottom-panel-content-${activeTab.id}`}
        >
          {activeContent}
        </div>
      </div>
    </section>
  );
}

export default MapBottomPanel;