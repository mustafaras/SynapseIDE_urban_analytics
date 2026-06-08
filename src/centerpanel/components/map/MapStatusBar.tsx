import React, { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LayerQaStatus, LayerRenderMode, MeasureUnit } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export type MapStatusBarCollaborationState = "connected" | "local-only" | "offline";

type MapStatusBarSegmentId =
  | "cursor"
  | "view"
  | "project"
  | "mode"
  | "layers"
  | "selection"
  | "sketch"
  | "measure"
  | "units"
  | "crs"
  | "qa"
  | "review"
  | "tasks"
  | "perf"
  | "sync"
  | "provider";

export interface MapStatusBarProps {
  cursor: { lng: number; lat: number } | null;
  zoom: number;
  projectId?: string | null;
  workspaceLabel?: string | null;
  taskLensLabel?: string | null;
  densityLabel?: string | null;
  layerCount?: number;
  visibleLayerCount?: number;
  pinCount?: number;
  drawnFeatureCount?: number;
  measurementCount?: number;
  measureUnit?: MeasureUnit;
  crs?: string;
  syncStatus?: string;
  selectedFeatureCount?: number;
  activeCanvasToolLabel?: string | null;
  hasActiveAoi?: boolean;
  qaStatus?: LayerQaStatus;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  performanceMode?: LayerRenderMode;
  performanceIssueCount?: number;
  onOpenInspect?: () => void;
  onOpenProject?: () => void;
  onOpenLayers?: () => void;
  onOpenCrsReadiness?: () => void;
  onOpenProblems?: () => void;
  onOpenAttributes?: () => void;
  onOpenSelection?: () => void;
  onOpenDraw?: () => void;
  onOpenMeasurements?: () => void;
  reviewEventCount?: number;
  onOpenTimeline?: () => void;
  taskCount?: number;
  activeTaskCount?: number;
  onOpenTasks?: () => void;
  collaborationStatus?: MapStatusBarCollaborationState;
  collaborationPresenceCount?: number;
  collaborationCommentCount?: number;
  onOpenCollaboration?: () => void;
  onOpenDiagnostics?: () => void;
  lastRenderDurationMs?: number | null;
  isSaving?: boolean;
  isLoading?: boolean;
  lastSavedAt?: string | null;
  autoSaveEnabled?: boolean;
  providerLabel?: string;
  providerHref?: string | undefined;
  reducedMotion?: boolean;
  layoutWidthOverride?: number;
  style?: React.CSSProperties;
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const STATUS_TONE_COLOR: Record<StatusTone, string> = {
  neutral: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))",
  info: "var(--syn-status-info, #38bdf8)",
  error: "var(--syn-status-error, #ef4444)",
  valid: "var(--syn-status-valid, #22c55e)",
  running: "var(--syn-status-running, #60a5fa)",
  pending: "var(--syn-status-pending, #a78bfa)",
  stale: "var(--syn-status-stale, #94a3b8)",
  warning: "var(--syn-status-warning, #fbbf24)",
};

const TONE_SEVERITY: Record<StatusTone, number> = {
  error: 7,
  warning: 6,
  pending: 5,
  running: 4,
  info: 3,
  valid: 2,
  stale: 1,
  neutral: 0,
};

const statusBar: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "1.9rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_STROKES.hairlineSubtle,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.textMuted,
  flexShrink: 0,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  transition: MAP_TRANSITIONS.fast,
};

const segmentStripStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: MAP_SPACING.zero,
  flex: 1,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const segmentBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  maxWidth: "100%",
  padding: `0 ${MAP_SPACING.sm}`,
  height: "1.45rem",
  borderRight: MAP_STROKES.hairlineSubtle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  color: "inherit",
  textDecoration: "none",
};

const segmentButtonStyle: React.CSSProperties = {
  ...segmentBaseStyle,
  borderTop: MAP_SPACING.zero,
  borderLeft: MAP_SPACING.zero,
  borderBottom: MAP_SPACING.zero,
  background: "transparent",
  cursor: "pointer",
  margin: MAP_SPACING.zero,
  font: "inherit",
  textAlign: "left",
};

const segmentLabelStyle: React.CSSProperties = {
  flexShrink: 0,
  color: MAP_COLORS.textMuted,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
};

const segmentValueStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: MAP_COLORS.textSecondary,
};

const spinnerStyle: React.CSSProperties = {
  width: "0.75rem",
  height: "0.75rem",
  color: "var(--syn-status-running, #60a5fa)",
  flexShrink: 0,
};

const overflowShellStyle: React.CSSProperties = {
  position: "relative",
  flexShrink: 0,
};

const overflowTriggerStyle: React.CSSProperties = {
  ...segmentButtonStyle,
  borderRight: MAP_SPACING.zero,
  borderLeft: MAP_STROKES.hairlineSubtle,
  paddingInline: MAP_SPACING.sm,
  minWidth: "4.75rem",
  justifyContent: "center",
};

const overflowMenuStyle: React.CSSProperties = {
  position: "absolute",
  right: MAP_SPACING.zero,
  bottom: "calc(100% + 0.35rem)",
  display: "grid",
  gap: "2px",
  minWidth: "16rem",
  maxWidth: "22rem",
  padding: MAP_SPACING.xs,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.42)",
  zIndex: MAP_Z_INDEX.dropdown,
};

const overflowMenuItemStyle: React.CSSProperties = {
  ...segmentButtonStyle,
  width: "100%",
  maxWidth: "100%",
  height: "1.9rem",
  paddingInline: MAP_SPACING.sm,
  borderRight: MAP_SPACING.zero,
  borderRadius: MAP_RADIUS.sm,
};

type StatusTone = "neutral" | "info" | "error" | "valid" | "running" | "pending" | "stale" | "warning";

type StatusSegment = {
  id: MapStatusBarSegmentId;
  label: string;
  value: string;
  title: string;
  widthPx: number;
  priority: number;
  tone?: StatusTone;
  busy?: boolean;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
};

function StatusSpinner({
  reducedMotion,
  ariaLabel = "Project persistence in progress",
}: {
  reducedMotion: boolean;
  ariaLabel?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label={ariaLabel}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={spinnerStyle}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="24 14"
      >
        {reducedMotion ? null : (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 8 8"
            to="360 8 8"
            dur="0.8s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}

function formatIdentifierLabel(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return value
    .replace(/^proj[_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSaveLabel(value?: string | null): string {
  if (!value) return "draft";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "draft";
  return `saved ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatSaveTitle(value?: string | null): string {
  if (!value) return "Draft workspace state";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Draft workspace state";
  return `Saved ${parsed.toLocaleString()}`;
}

function formatQaLabel(status: LayerQaStatus, issueCount: number, blockerCount: number): string {
  if (blockerCount > 0 || status === "error") {
    return blockerCount > 0 ? `${blockerCount} blocked` : "blocked";
  }
  if (issueCount > 0 || status === "warning") {
    return issueCount > 0 ? `${issueCount} issues` : "caveats";
  }
  if (status === "passed") {
    return "ready";
  }
  return "unchecked";
}

function qaTone(status: LayerQaStatus, issueCount: number, blockerCount: number): StatusTone {
  if (blockerCount > 0 || status === "error") {
    return "error";
  }
  if (issueCount > 0 || status === "warning") {
    return "warning";
  }
  if (status === "passed") {
    return "valid";
  }
  return "stale";
}

function saveTone(isLoading: boolean, isSaving: boolean, lastSavedAt?: string | null): StatusTone {
  if (isLoading) {
    return "pending";
  }
  if (isSaving) {
    return "running";
  }
  return lastSavedAt ? "valid" : "stale";
}

function syncTone(syncStatus: string): StatusTone {
  const normalized = syncStatus.toLowerCase();
  if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("offline")) {
    return "error";
  }
  if (normalized.includes("pending") || normalized.includes("wait")) {
    return "pending";
  }
  if (normalized.includes("sync") || normalized.includes("linked") || normalized.includes("connected")) {
    return "info";
  }
  return "stale";
}

function collaborationTone(status: MapStatusBarCollaborationState): StatusTone {
  if (status === "connected") return "valid";
  if (status === "offline") return "error";
  return "warning";
}

function mergeTone(...tones: readonly StatusTone[]): StatusTone {
  return tones.reduce<StatusTone>((highest, tone) => {
    return TONE_SEVERITY[tone] > TONE_SEVERITY[highest] ? tone : highest;
  }, "neutral");
}

function formatCollaborationLabel(
  status: MapStatusBarCollaborationState,
  presenceCount: number,
  commentCount: number,
): string {
  const stateLabel = status === "connected" ? "live" : status === "local-only" ? "local-only" : "offline";
  const details = [
    presenceCount > 0 ? `${presenceCount}p` : null,
    commentCount > 0 ? `${commentCount}c` : null,
  ].filter((entry): entry is string => entry !== null);
  return details.length > 0 ? `${stateLabel} ${details.join("/")}` : stateLabel;
}

function formatPerformanceLabel(mode: LayerRenderMode, issueCount: number, durationMs?: number | null): string {
  const durationLabel = durationMs != null && Number.isFinite(durationMs) ? ` ${Math.round(durationMs)}ms` : "";
  if (mode === "preview") {
    return `preview${issueCount > 0 ? ` ${issueCount}` : ""}${durationLabel}`;
  }
  return `full${durationLabel}`;
}

function formatApproximateScaleLabel(zoom: number): string {
  const approximateScale = Math.max(1, Math.round(591_657_528 / (2 ** zoom)));
  if (approximateScale >= 1_000_000) {
    return `1:${(approximateScale / 1_000_000).toFixed(1)}M`;
  }
  if (approximateScale >= 1_000) {
    return `1:${Math.round(approximateScale / 1_000)}k`;
  }
  return `1:${approximateScale}`;
}

function formatSketchValue(hasActiveAoi: boolean, drawnFeatureCount: number, pinCount: number): string {
  return `${hasActiveAoi ? "AOI" : "no AOI"} · d${drawnFeatureCount} · p${pinCount}`;
}

function formatMeasureValue(measurementCount: number): string {
  return measurementCount > 0 ? `${measurementCount} saved` : "idle";
}

function taskTone(taskCount: number, activeTaskCount: number): StatusTone {
  if (activeTaskCount > 0) {
    return "running";
  }
  if (taskCount > 0) {
    return "valid";
  }
  return "stale";
}

function formatTaskValue(taskCount: number, activeTaskCount: number): string {
  if (activeTaskCount > 0) {
    return `${activeTaskCount} active / ${taskCount}`;
  }
  if (taskCount > 0) {
    return `${taskCount} tracked`;
  }
  return "idle";
}

function useAvailableWidth(
  containerRef: React.RefObject<HTMLDivElement | null>,
  layoutWidthOverride?: number,
): number {
  const [availableWidth, setAvailableWidth] = useState<number>(Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (typeof layoutWidthOverride === "number" && Number.isFinite(layoutWidthOverride)) {
      setAvailableWidth(layoutWidthOverride);
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = (nextWidth: number): void => {
      setAvailableWidth(nextWidth > 0 ? nextWidth : Number.POSITIVE_INFINITY);
    };

    updateWidth(element.clientWidth);

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => updateWidth(element.clientWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? element.clientWidth;
      updateWidth(nextWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, layoutWidthOverride]);

  return availableWidth;
}

function renderSegmentValue(
  segment: StatusSegment,
  reducedMotion: boolean,
  menuItem = false,
): React.ReactNode {
  return (
    <span
      style={{
        ...segmentValueStyle,
        color: segment.tone ? STATUS_TONE_COLOR[segment.tone] : segmentValueStyle.color,
        width: menuItem ? "auto" : undefined,
      }}
    >
      {segment.busy ? <StatusSpinner reducedMotion={reducedMotion} /> : null}
      {segment.value}
    </span>
  );
}

function renderSegmentBody(
  segment: StatusSegment,
  reducedMotion: boolean,
  menuItem = false,
): React.ReactNode {
  return (
    <>
      <span style={segmentLabelStyle}>{segment.label}</span>
      {renderSegmentValue(segment, reducedMotion, menuItem)}
    </>
  );
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapStatusBar: React.FC<MapStatusBarProps> = ({
  cursor,
  zoom,
  projectId = null,
  workspaceLabel = null,
  taskLensLabel = null,
  densityLabel = null,
  layerCount = 0,
  visibleLayerCount = 0,
  pinCount = 0,
  drawnFeatureCount = 0,
  measurementCount = 0,
  measureUnit = "metric",
  crs = "EPSG:4326",
  syncStatus = "3D link off",
  selectedFeatureCount = 0,
  activeCanvasToolLabel = null,
  hasActiveAoi = false,
  qaStatus = "unchecked",
  qaIssueCount = 0,
  qaBlockerCount = 0,
  performanceMode = "full",
  performanceIssueCount = 0,
  onOpenInspect,
  onOpenProject,
  onOpenLayers,
  onOpenCrsReadiness,
  onOpenProblems,
  onOpenAttributes,
  onOpenSelection,
  onOpenDraw,
  onOpenMeasurements,
  reviewEventCount = 0,
  onOpenTimeline,
  taskCount = 0,
  activeTaskCount = 0,
  onOpenTasks,
  collaborationStatus = "local-only",
  collaborationPresenceCount = 0,
  collaborationCommentCount = 0,
  onOpenCollaboration,
  onOpenDiagnostics,
  lastRenderDurationMs = null,
  isSaving = false,
  isLoading = false,
  lastSavedAt = null,
  autoSaveEnabled = true,
  providerLabel = "OpenStreetMap",
  providerHref,
  reducedMotion = false,
  layoutWidthOverride,
  style: styleProp,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflowRef = useRef<HTMLDivElement | null>(null);
  const availableWidth = useAvailableWidth(containerRef, layoutWidthOverride);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const saveLabel = isLoading
    ? "loading"
    : isSaving
      ? "saving"
      : formatSaveLabel(lastSavedAt);
  const projectLabel = formatIdentifierLabel(projectId, "No project");
  const modeLabel = [
    formatIdentifierLabel(workspaceLabel ?? "explore", "Explore"),
    taskLensLabel ? formatIdentifierLabel(taskLensLabel, taskLensLabel) : null,
    densityLabel ? formatIdentifierLabel(densityLabel, densityLabel) : null,
    activeCanvasToolLabel ? formatIdentifierLabel(activeCanvasToolLabel, activeCanvasToolLabel) : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(" · ");
  const viewLabel = `z${zoom.toFixed(1)} · ${formatApproximateScaleLabel(zoom)}`;
  const sketchValue = formatSketchValue(hasActiveAoi, drawnFeatureCount, pinCount);
  const measureValue = formatMeasureValue(measurementCount);
  const qaLabel = formatQaLabel(qaStatus, qaIssueCount, qaBlockerCount);
  const qaValueTone = qaTone(qaStatus, qaIssueCount, qaBlockerCount);
  const performanceLabel = formatPerformanceLabel(performanceMode, performanceIssueCount, lastRenderDurationMs);
  const performanceTone: StatusTone = performanceIssueCount > 0 || performanceMode === "preview" ? "warning" : "valid";
  const collaborationLabel = formatCollaborationLabel(
    collaborationStatus,
    collaborationPresenceCount,
    collaborationCommentCount,
  );
  const syncValueTone = syncTone(syncStatus);
  const collaborationValueTone = collaborationTone(collaborationStatus);
  const syncSummary = `${syncStatus} · ${collaborationLabel}`;
  const syncSummaryTone = mergeTone(syncValueTone, collaborationValueTone);
  const saveValueTone = saveTone(isLoading, isSaving, lastSavedAt);
  const tasksValueTone = taskTone(taskCount, activeTaskCount);

  const segments = useMemo<StatusSegment[]>(() => {
    const nextSegments: StatusSegment[] = [];

    if (cursor != null) {
      nextSegments.push({
        id: "cursor",
        label: "Cursor",
        value: `${cursor.lng.toFixed(5)}, ${cursor.lat.toFixed(5)}`,
        title: `Cursor longitude ${cursor.lng.toFixed(5)}, latitude ${cursor.lat.toFixed(5)}`,
        widthPx: 172,
        priority: 74,
        onClick: onOpenInspect,
        ariaLabel: "Open map view detail",
      });
    }

    nextSegments.push(
      {
        id: "view",
        label: "View",
        value: viewLabel,
        title: `Zoom ${zoom.toFixed(1)} with approximate scale ${formatApproximateScaleLabel(zoom)}`,
        widthPx: 124,
        priority: 96,
        onClick: onOpenInspect,
        ariaLabel: "Open zoom and scale detail",
      },
      {
        id: "project",
        label: "Project",
        value: `${projectLabel} · ${saveLabel}`,
        title: `${projectLabel}; ${isLoading ? "Loading project state" : isSaving ? "Saving project state" : formatSaveTitle(lastSavedAt)}; auto-save ${autoSaveEnabled ? "on" : "off"}`,
        widthPx: 192,
        priority: 100 + (isLoading || isSaving ? 24 : 0),
        tone: saveValueTone,
        busy: isLoading || isSaving,
        onClick: onOpenProject,
        ariaLabel: "Open project and save detail",
      },
      {
        id: "mode",
        label: "Mode",
        value: modeLabel,
        title: `Workspace state ${modeLabel}`,
        widthPx: 152,
        priority: 76,
      },
      {
        id: "layers",
        label: "Layers",
        value: `${visibleLayerCount}/${layerCount}`,
        title: `${visibleLayerCount} visible of ${layerCount} total layers`,
        widthPx: 84,
        priority: 86,
        onClick: onOpenLayers,
        ariaLabel: "Open layers workspace",
      },
      {
        id: "selection",
        label: "Select",
        value: `${selectedFeatureCount}`,
        title: `${selectedFeatureCount} selected features`,
        widthPx: 90,
        priority: 92 + (selectedFeatureCount > 0 ? 12 : 0),
        onClick: onOpenSelection ?? onOpenAttributes,
        ariaLabel: "Open selected feature details",
      },
      {
        id: "sketch",
        label: "Sketch",
        value: sketchValue,
        title: `AOI ${hasActiveAoi ? "active" : "inactive"}, ${drawnFeatureCount} drawn features, ${pinCount} pins`,
        widthPx: 150,
        priority: 82 + (hasActiveAoi || drawnFeatureCount > 0 ? 10 : 0),
        tone: hasActiveAoi ? "info" : "stale",
        onClick: onOpenDraw,
        ariaLabel: "Open draw and AOI detail",
      },
      {
        id: "measure",
        label: "Measure",
        value: measureValue,
        title: `${measurementCount} measurements recorded`,
        widthPx: 106,
        priority: 84 + (measurementCount > 0 ? 10 : 0),
        tone: measurementCount > 0 ? "info" : "stale",
        onClick: onOpenMeasurements,
        ariaLabel: "Open measurement results",
      },
      {
        id: "units",
        label: "Units",
        value: measureUnit === "metric" ? "metric" : "imperial",
        title: `Measurement units ${measureUnit === "metric" ? "metric" : "imperial"}`,
        widthPx: 92,
        priority: 68,
      },
      {
        id: "crs",
        label: "CRS",
        value: crs,
        title: `Coordinate reference system ${crs}`,
        widthPx: 130,
        priority: 94,
        tone: "info",
        onClick: onOpenCrsReadiness,
        ariaLabel: "Open CRS readiness",
      },
      {
        id: "qa",
        label: "QA",
        value: qaLabel,
        title: `${qaLabel}; blockers ${qaBlockerCount}; issues ${qaIssueCount}`,
        widthPx: 110,
        priority: 98 + (qaValueTone === "error" || qaValueTone === "warning" ? 18 : 0),
        tone: qaValueTone,
        onClick: onOpenProblems,
        ariaLabel: "Open QA Problems",
      },
      {
        id: "review",
        label: "Review",
        value: `${reviewEventCount}`,
        title: `${reviewEventCount} review timeline events`,
        widthPx: 88,
        priority: 78 + (reviewEventCount > 0 ? 4 : 0),
        onClick: onOpenTimeline,
        ariaLabel: "Open review timeline",
      },
      {
        id: "tasks",
        label: "Tasks",
        value: formatTaskValue(taskCount, activeTaskCount),
        title: `${activeTaskCount} active background tasks out of ${taskCount} tracked tasks`,
        widthPx: 134,
        priority: 90 + (activeTaskCount > 0 ? 18 : 0),
        tone: tasksValueTone,
        busy: activeTaskCount > 0,
        onClick: onOpenTasks,
        ariaLabel: "Open background tasks",
      },
      {
        id: "perf",
        label: "Perf",
        value: performanceLabel,
        title: `${performanceMode} render mode with ${performanceIssueCount} active performance caveats`,
        widthPx: 126,
        priority: 88 + (performanceIssueCount > 0 ? 18 : 0),
        tone: performanceTone,
        onClick: onOpenDiagnostics,
        ariaLabel: "Open performance diagnostics",
      },
      {
        id: "sync",
        label: "Sync",
        value: syncSummary,
        title: `Viewport sync ${syncStatus}; collaboration ${collaborationLabel}`,
        widthPx: 152,
        priority: 80 + (syncSummaryTone === "error" || syncSummaryTone === "warning" ? 12 : 0),
        tone: syncSummaryTone,
        onClick: onOpenCollaboration,
        ariaLabel: `Open Review collaboration (${collaborationLabel})`,
      },
      {
        id: "provider",
        label: "Base",
        value: providerLabel,
        title: `Basemap provider ${providerLabel}`,
        widthPx: 126,
        priority: 70,
        href: providerHref,
        ariaLabel: `Open basemap attribution for ${providerLabel}`,
      },
    );

    return nextSegments;
  }, [
    activeCanvasToolLabel,
    activeTaskCount,
    autoSaveEnabled,
    collaborationLabel,
    collaborationStatus,
    crs,
    cursor,
    drawnFeatureCount,
    hasActiveAoi,
    isLoading,
    isSaving,
    lastSavedAt,
    layerCount,
    measureUnit,
    measurementCount,
    modeLabel,
    onOpenAttributes,
    onOpenCollaboration,
    onOpenCrsReadiness,
    onOpenDiagnostics,
    onOpenDraw,
    onOpenInspect,
    onOpenLayers,
    onOpenMeasurements,
    onOpenProblems,
    onOpenProject,
    onOpenSelection,
    onOpenTasks,
    onOpenTimeline,
    performanceIssueCount,
    performanceLabel,
    performanceMode,
    performanceTone,
    pinCount,
    projectLabel,
    projectId,
    providerHref,
    providerLabel,
    qaBlockerCount,
    qaIssueCount,
    qaLabel,
    qaValueTone,
    reviewEventCount,
    saveLabel,
    saveValueTone,
    selectedFeatureCount,
    sketchValue,
    syncStatus,
    syncSummary,
    syncSummaryTone,
    taskCount,
    tasksValueTone,
    viewLabel,
    visibleLayerCount,
    zoom,
  ]);

  const { visibleSegments, overflowSegments } = useMemo(() => {
    if (!Number.isFinite(availableWidth)) {
      return { visibleSegments: segments, overflowSegments: [] as StatusSegment[] };
    }

    const totalWidth = segments.reduce((sum, segment) => sum + segment.widthPx, 0);
    if (totalWidth <= availableWidth) {
      return { visibleSegments: segments, overflowSegments: [] as StatusSegment[] };
    }

    const overflowTriggerWidth = 92;
    const visibleBudget = Math.max(availableWidth - overflowTriggerWidth, 0);
    const rankedSegments = [...segments].sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      return segments.indexOf(left) - segments.indexOf(right);
    });
    const selectedIds = new Set<MapStatusBarSegmentId>();
    let usedWidth = 0;

    for (const segment of rankedSegments) {
      if (usedWidth + segment.widthPx > visibleBudget) {
        continue;
      }
      selectedIds.add(segment.id);
      usedWidth += segment.widthPx;
    }

    if (selectedIds.size === 0 && segments.length > 0) {
      selectedIds.add(rankedSegments[0].id);
    }

    const nextVisible = segments.filter((segment) => selectedIds.has(segment.id));
    const nextOverflow = segments.filter((segment) => !selectedIds.has(segment.id));
    return { visibleSegments: nextVisible, overflowSegments: nextOverflow };
  }, [availableWidth, segments]);

  useEffect(() => {
    if (!overflowOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (overflowRef.current?.contains(event.target as Node)) {
        return;
      }
      setOverflowOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverflowOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [overflowOpen]);

  useEffect(() => {
    if (overflowSegments.length === 0 && overflowOpen) {
      setOverflowOpen(false);
    }
  }, [overflowOpen, overflowSegments.length]);

  const renderInlineSegment = (segment: StatusSegment): React.ReactNode => {
    const sharedProps = {
      title: segment.title,
      "data-map-status-segment": segment.id,
      style: {
        ...(segment.onClick || segment.href ? segmentButtonStyle : segmentBaseStyle),
        width: `${segment.widthPx}px`,
      },
      "aria-label": segment.ariaLabel ?? `${segment.label}: ${segment.value}`,
    } as const;

    if (segment.onClick) {
      return (
        <button key={segment.id} type="button" {...sharedProps} onClick={segment.onClick}>
          {renderSegmentBody(segment, reducedMotion)}
        </button>
      );
    }

    if (segment.href) {
      return (
        <a
          key={segment.id}
          {...sharedProps}
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {renderSegmentBody(segment, reducedMotion)}
        </a>
      );
    }

    return (
      <span key={segment.id} {...sharedProps}>
        {renderSegmentBody(segment, reducedMotion)}
      </span>
    );
  };

  const renderOverflowSegment = (segment: StatusSegment): React.ReactNode => {
    const sharedProps = {
      title: segment.title,
      "data-map-status-segment": segment.id,
      "data-map-status-overflow": "true",
      style: overflowMenuItemStyle,
      "aria-label": segment.ariaLabel ?? `${segment.label}: ${segment.value}`,
    } as const;

    if (segment.onClick) {
      return (
        <button
          key={`${segment.id}-overflow`}
          type="button"
          {...sharedProps}
          role="menuitem"
          onClick={() => {
            segment.onClick?.();
            setOverflowOpen(false);
          }}
        >
          {renderSegmentBody(segment, reducedMotion, true)}
        </button>
      );
    }

    if (segment.href) {
      return (
        <a
          key={`${segment.id}-overflow`}
          {...sharedProps}
          role="menuitem"
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOverflowOpen(false)}
        >
          {renderSegmentBody(segment, reducedMotion, true)}
        </a>
      );
    }

    return (
      <span key={`${segment.id}-overflow`} {...sharedProps} role="menuitem">
        {renderSegmentBody(segment, reducedMotion, true)}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ ...statusBar, ...styleProp }}
      role="status"
      aria-label="Map status"
      data-map-status-overflow-count={overflowSegments.length}
    >
      <div style={segmentStripStyle}>
        {visibleSegments.map(renderInlineSegment)}
      </div>

      {overflowSegments.length > 0 ? (
        <div ref={overflowRef} style={overflowShellStyle}>
          <button
            type="button"
            style={overflowTriggerStyle}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            aria-label={`Open status overflow (${overflowSegments.length} more)`}
            data-map-status-segment="overflow"
            onClick={() => setOverflowOpen((current) => !current)}
          >
            <span style={segmentLabelStyle}>More</span>
            <span style={segmentValueStyle}>
              <MoreHorizontal aria-hidden size={12} />
              {overflowSegments.length}
            </span>
          </button>

          {overflowOpen ? (
            <div role="menu" aria-label="Additional map status segments" style={overflowMenuStyle}>
              {overflowSegments.map(renderOverflowSegment)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
