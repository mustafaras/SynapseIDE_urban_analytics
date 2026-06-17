import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LayerQaStatus, LayerRenderMode, MeasureUnit } from "./mapTypes";
import {
  MAP_COLORS,
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
  | "scale"
  | "camera"
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
  bearing?: number;
  pitch?: number;
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
  height: "var(--map-shell-status-height, 1.75rem)",
  minHeight: "var(--map-shell-status-height, 1.75rem)",
  maxHeight: "var(--map-shell-status-height, 1.75rem)",
  padding: `0 ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgHeader,
  borderTop: MAP_STROKES.hairlineSubtle,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.textMuted,
  flexShrink: 0,
  minWidth: MAP_SPACING.zero,
  overflow: "visible",
  transition: MAP_TRANSITIONS.fast,
};

const segmentStripStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.zero,
  flex: 1,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const segmentStripLeftStyle: React.CSSProperties = {
  ...segmentStripStyle,
  flex: "0 1 auto",
};

const segmentStripRightStyle: React.CSSProperties = {
  ...segmentStripStyle,
  justifyContent: "flex-end",
};

const segmentClusterDividerStyle: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--syn-hairline-subtle, rgba(148, 163, 184, 0.28))",
  marginInline: MAP_SPACING.xs,
  flexShrink: 0,
};

const segmentBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  maxWidth: "100%",
  flexShrink: 0,
  padding: `0 ${MAP_SPACING.sm}`,
  height: "1.35rem",
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

const segmentButtonActiveStyle: React.CSSProperties = {
  background: "var(--syn-overlay-muted, rgba(59, 130, 246, 0.14))",
  color: MAP_COLORS.text,
};

const segmentLabelStyle: React.CSSProperties = {
  flexShrink: 0,
  color: MAP_COLORS.textMuted,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
};

const segmentValueStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  maxWidth: "100%",
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
  /* Opens upward from the status bar — stays above the bar, below map controls */
  bottom: "calc(100% + 0.35rem)",
  display: "grid",
  gap: "2px",
  minWidth: "16rem",
  maxWidth: "22rem",
  /* Cap height for dense segment lists; allows scroll so all items are reachable */
  maxHeight: "var(--map-popover-max-height, min(20rem, calc(100vh - 6rem)))",
  overflowY: "auto",
  padding: MAP_SPACING.xs,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: 2,
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
  borderRadius: 0,
};

const detailPopoverStyle: React.CSSProperties = {
  position: "absolute",
  left: MAP_SPACING.md,
  bottom: "calc(100% + 0.4rem)",
  display: "grid",
  gap: MAP_SPACING.xs,
  width: "min(24rem, calc(100vw - 2rem))",
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: 2,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.textSecondary,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.42)",
  zIndex: MAP_Z_INDEX.dropdown,
  pointerEvents: "none",
};

const detailHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const detailTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const detailMetaStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.45,
};

const detailBarsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 2,
  height: 14,
  alignItems: "end",
};

type StatusTone = "neutral" | "info" | "error" | "valid" | "running" | "pending" | "stale" | "warning";
type StatusGroup = "view" | "data" | "runtime";

type StatusSegment = {
  id: MapStatusBarSegmentId;
  group: StatusGroup;
  label: string;
  value: string;
  title: string;
  widthPx: number;
  priority: number;
  critical?: boolean;
  tone?: StatusTone;
  busy?: boolean;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
};

type SegmentWidthMap = Partial<Record<MapStatusBarSegmentId, number>>;

const MAP_STATUS_LEFT_SEGMENTS: readonly MapStatusBarSegmentId[] = ["cursor", "view", "scale", "camera"];

function isLeftStatusSegment(id: MapStatusBarSegmentId): boolean {
  return MAP_STATUS_LEFT_SEGMENTS.includes(id);
}

function widthMapsEqual(left: SegmentWidthMap, right: SegmentWidthMap): boolean {
  const leftKeys = Object.keys(left) as MapStatusBarSegmentId[];
  const rightKeys = Object.keys(right) as MapStatusBarSegmentId[];
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
}

function partitionStatusSegments(
  segments: readonly StatusSegment[],
  availableWidth: number,
  segmentWidths: SegmentWidthMap,
  overflowTriggerWidth: number,
): { visibleSegments: StatusSegment[]; overflowSegments: StatusSegment[] } {
  if (!Number.isFinite(availableWidth)) {
    return { visibleSegments: [...segments], overflowSegments: [] };
  }

  const widthOf = (segment: StatusSegment): number => {
    const measuredWidth = segmentWidths[segment.id];
    if (typeof measuredWidth === "number" && Number.isFinite(measuredWidth) && measuredWidth > 0) {
      return measuredWidth;
    }
    return segment.widthPx;
  };

  const totalWidth = segments.reduce((sum, segment) => sum + widthOf(segment), 0);
  if (totalWidth <= availableWidth) {
    return { visibleSegments: [...segments], overflowSegments: [] };
  }

  const triggerWidth = Math.max(64, overflowTriggerWidth);
  const visibleBudget = Math.max(availableWidth - triggerWidth, 0);
  const rankedSegments = [...segments].sort((left, right) => {
    if (Boolean(right.critical) !== Boolean(left.critical)) {
      return right.critical ? 1 : -1;
    }
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return segments.indexOf(left) - segments.indexOf(right);
  });

  const selectedIds = new Set<MapStatusBarSegmentId>();
  let usedWidth = 0;

  for (const segment of rankedSegments) {
    if (!segment.critical) {
      continue;
    }
    selectedIds.add(segment.id);
    usedWidth += widthOf(segment);
  }

  for (const segment of rankedSegments) {
    if (segment.critical) {
      continue;
    }
    const segmentWidth = widthOf(segment);
    if (usedWidth + segmentWidth > visibleBudget) {
      continue;
    }
    selectedIds.add(segment.id);
    usedWidth += segmentWidth;
  }

  if (selectedIds.size === 0 && rankedSegments.length > 0) {
    selectedIds.add(rankedSegments[0].id);
  }

  const visibleSegments = segments.filter((segment) => selectedIds.has(segment.id));
  const overflowSegments = segments.filter((segment) => !selectedIds.has(segment.id));
  return { visibleSegments, overflowSegments };
}

function renderDetailBars(segment: StatusSegment): React.ReactNode {
  const toneColor = segment.tone ? STATUS_TONE_COLOR[segment.tone] : MAP_COLORS.textMuted;
  return (
    <span style={detailBarsStyle} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => {
        const height = 4 + ((segment.priority + index * 7) % 11);
        return (
          <span
            key={`${segment.id}-bar-${index}`}
            style={{
              height,
              borderRadius: 2,
              background: toneColor,
              opacity: 0.34 + index * 0.055,
            }}
          />
        );
      })}
    </span>
  );
}

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

function providerTone(providerLabel: string): StatusTone {
  const normalized = providerLabel.toLowerCase();
  if (normalized.includes("error") || normalized.includes("failed") || normalized.includes("unavailable")) {
    return "error";
  }
  if (normalized.includes("offline") || normalized.includes("degraded")) {
    return "warning";
  }
  return "neutral";
}

function crsTone(crs: string): StatusTone {
  const normalized = crs.toLowerCase();
  if (normalized.includes("unknown") || normalized.includes("missing") || normalized.includes("unset")) {
    return "warning";
  }
  return "info";
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
  bearing = 0,
  pitch = 0,
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
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const overflowTriggerMeasureRef = useRef<HTMLButtonElement | null>(null);
  const availableWidth = useAvailableWidth(containerRef, layoutWidthOverride);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activeDetailSegmentId, setActiveDetailSegmentId] = useState<MapStatusBarSegmentId | null>(null);
  const [activeInteractiveSegmentId, setActiveInteractiveSegmentId] = useState<MapStatusBarSegmentId | null>(null);
  const [measuredSegmentWidths, setMeasuredSegmentWidths] = useState<SegmentWidthMap>({});
  const [measuredOverflowTriggerWidth, setMeasuredOverflowTriggerWidth] = useState(92);

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
  const scaleLabel = formatApproximateScaleLabel(zoom);
  const viewLabel = `z${zoom.toFixed(1)}`;
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
  const providerValueTone = providerTone(providerLabel);
  const crsValueTone = crsTone(crs);
  const syncSummary = `${syncStatus} · ${collaborationLabel}`;
  const syncSummaryTone = mergeTone(syncValueTone, collaborationValueTone);
  const saveValueTone = saveTone(isLoading, isSaving, lastSavedAt);
  const tasksValueTone = taskTone(taskCount, activeTaskCount);

  const segments = useMemo<StatusSegment[]>(() => {
    const nextSegments: StatusSegment[] = [];
    const cameraCompass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      Math.round((((bearing % 360) + 360) % 360) / 45) % 8
    ] ?? "N";

    if (cursor != null) {
      nextSegments.push({
        id: "cursor",
        group: "view",
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
        group: "view",
        label: "View",
        value: viewLabel,
        title: `Zoom ${zoom.toFixed(1)} with approximate scale ${scaleLabel}`,
        widthPx: 148,
        priority: 96,
        onClick: onOpenInspect,
        ariaLabel: "Open zoom and scale detail",
      },
      {
        id: "scale",
        group: "view",
        label: "Scale",
        value: scaleLabel,
        title: `Approximate representative fraction ${scaleLabel} at zoom ${zoom.toFixed(1)}`,
        widthPx: 112,
        priority: 95,
        tone: "info",
        onClick: onOpenInspect,
        ariaLabel: "Open map scale detail",
      },
      {
        id: "camera",
        group: "view",
        label: "Cam",
        value: `${cameraCompass} ${Math.round(((bearing % 360) + 360) % 360)}° · ${Math.round(pitch)}°↑`,
        title: `Camera bearing ${Math.round(((bearing % 360) + 360) % 360)}° (${cameraCompass}), pitch ${Math.round(pitch)}°`,
        widthPx: 132,
        priority: 60,
        ariaLabel: "Map camera bearing and pitch",
      },
      {
        id: "project",
        group: "view",
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
        group: "view",
        label: "Mode",
        value: modeLabel,
        title: `Workspace state ${modeLabel}`,
        widthPx: 152,
        priority: 76,
      },
      {
        id: "layers",
        group: "data",
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
        group: "data",
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
        group: "data",
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
        group: "data",
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
        group: "data",
        label: "Units",
        value: measureUnit === "metric" ? "metric" : "imperial",
        title: `Measurement units ${measureUnit === "metric" ? "metric" : "imperial"}`,
        widthPx: 92,
        priority: 68,
      },
      {
        id: "crs",
        group: "data",
        label: "CRS",
        value: crs,
        title: `Coordinate reference system ${crs}`,
        widthPx: 130,
        priority: 94 + (crsValueTone === "warning" ? 22 : 0),
        critical: crsValueTone === "warning" || crsValueTone === "error",
        tone: crsValueTone,
        onClick: onOpenCrsReadiness,
        ariaLabel: "Open CRS readiness",
      },
      {
        id: "qa",
        group: "data",
        label: "QA",
        value: qaLabel,
        title: `${qaLabel}; blockers ${qaBlockerCount}; issues ${qaIssueCount}`,
        widthPx: 110,
        priority: 98 + (qaValueTone === "error" || qaValueTone === "warning" ? 18 : 0),
        critical: qaValueTone === "error" || qaValueTone === "warning",
        tone: qaValueTone,
        onClick: onOpenProblems,
        ariaLabel: "Open QA Problems",
      },
      {
        id: "review",
        group: "runtime",
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
        group: "runtime",
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
        group: "runtime",
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
        group: "runtime",
        label: "Sync",
        value: syncSummary,
        title: `Viewport sync ${syncStatus}; collaboration ${collaborationLabel}`,
        widthPx: 152,
        priority: 80 + (syncSummaryTone === "error" || syncSummaryTone === "warning" ? 12 : 0),
        critical: syncSummaryTone === "error" || syncSummaryTone === "warning",
        tone: syncSummaryTone,
        onClick: onOpenCollaboration,
        ariaLabel: `Open Review collaboration (${collaborationLabel})`,
      },
      {
        id: "provider",
        group: "runtime",
        label: "Base",
        value: providerLabel,
        title: `Basemap provider ${providerLabel}`,
        widthPx: 126,
        priority: 70 + (providerValueTone === "error" || providerValueTone === "warning" ? 16 : 0),
        critical: providerValueTone === "error" || providerValueTone === "warning",
        tone: providerValueTone,
        href: providerHref,
        ariaLabel: `Open basemap attribution for ${providerLabel}`,
      },
    );

    return nextSegments;
  }, [
    bearing,
    pitch,
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
    providerValueTone,
    providerHref,
    providerLabel,
    crsValueTone,
    qaBlockerCount,
    qaIssueCount,
    qaLabel,
    qaValueTone,
    reviewEventCount,
    saveLabel,
    saveValueTone,
    scaleLabel,
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

  useLayoutEffect(() => {
    const measureRoot = measurementRef.current;
    if (!measureRoot) {
      return;
    }

    const measured: SegmentWidthMap = {};
    const nodes = measureRoot.querySelectorAll<HTMLElement>("[data-map-status-measure-segment]");
    nodes.forEach((node) => {
      const segmentId = node.dataset.mapStatusMeasureSegment as MapStatusBarSegmentId | undefined;
      if (!segmentId) {
        return;
      }
      const width = Math.ceil(node.getBoundingClientRect().width);
      if (Number.isFinite(width) && width > 0) {
        measured[segmentId] = width;
      }
    });

    setMeasuredSegmentWidths((current) => (widthMapsEqual(current, measured) ? current : measured));

    const triggerWidth = overflowTriggerMeasureRef.current
      ? Math.ceil(overflowTriggerMeasureRef.current.getBoundingClientRect().width)
      : 0;
    if (Number.isFinite(triggerWidth) && triggerWidth > 0) {
      setMeasuredOverflowTriggerWidth((current) => (current === triggerWidth ? current : triggerWidth));
    }
  }, [segments]);

  const { visibleSegments, overflowSegments } = useMemo(() => {
    return partitionStatusSegments(segments, availableWidth, measuredSegmentWidths, measuredOverflowTriggerWidth);
  }, [availableWidth, measuredOverflowTriggerWidth, measuredSegmentWidths, segments]);

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

  const activeDetailSegment = useMemo(
    () => visibleSegments.find((segment) => segment.id === activeDetailSegmentId) ?? null,
    [activeDetailSegmentId, visibleSegments],
  );

  const visibleLeftSegments = useMemo(
    () => visibleSegments.filter((segment) => isLeftStatusSegment(segment.id)),
    [visibleSegments],
  );

  const visibleRightSegments = useMemo(
    () => visibleSegments.filter((segment) => !isLeftStatusSegment(segment.id)),
    [visibleSegments],
  );

  const renderInlineSegment = (
    segment: StatusSegment,
    index: number,
    list: StatusSegment[],
  ): React.ReactNode => {
    const isGroupStart = index > 0 && list[index - 1]?.group !== segment.group;
    const isInteractive = Boolean(segment.onClick || segment.href);
    const isInteractiveActive = activeInteractiveSegmentId === segment.id;
    const sharedProps = {
      title: segment.title,
      "data-map-status-segment": segment.id,
      "data-map-status-side": isLeftStatusSegment(segment.id) ? "left" : "right",
      "data-map-status-tone": segment.tone ?? "neutral",
      "data-map-status-interactive": isInteractive ? "true" : "false",
      onMouseEnter: () => setActiveDetailSegmentId(segment.id),
      onFocus: () => setActiveDetailSegmentId(segment.id),
      onMouseLeave: () => setActiveDetailSegmentId((current) => (current === segment.id ? null : current)),
      onBlur: () => setActiveDetailSegmentId((current) => (current === segment.id ? null : current)),
      style: {
        ...(isInteractive ? segmentButtonStyle : segmentBaseStyle),
        ...(isInteractive && isInteractiveActive ? segmentButtonActiveStyle : null),
        width: `${measuredSegmentWidths[segment.id] ?? segment.widthPx}px`,
        borderLeft: isGroupStart ? MAP_STROKES.hairlineSubtle : undefined,
      },
      "aria-label": segment.ariaLabel ?? `${segment.label}: ${segment.value}`,
    } as const;

    if (segment.onClick) {
      return (
        <button
          key={segment.id}
          type="button"
          {...sharedProps}
          onMouseEnter={() => {
            setActiveDetailSegmentId(segment.id);
            setActiveInteractiveSegmentId(segment.id);
          }}
          onFocus={() => {
            setActiveDetailSegmentId(segment.id);
            setActiveInteractiveSegmentId(segment.id);
          }}
          onMouseLeave={() => {
            setActiveDetailSegmentId((current) => (current === segment.id ? null : current));
            setActiveInteractiveSegmentId((current) => (current === segment.id ? null : current));
          }}
          onBlur={() => {
            setActiveDetailSegmentId((current) => (current === segment.id ? null : current));
            setActiveInteractiveSegmentId((current) => (current === segment.id ? null : current));
          }}
          onClick={segment.onClick}
        >
          {renderSegmentBody(segment, reducedMotion)}
        </button>
      );
    }

    if (segment.href) {
      return (
        <a
          key={segment.id}
          {...sharedProps}
          onMouseEnter={() => {
            setActiveDetailSegmentId(segment.id);
            setActiveInteractiveSegmentId(segment.id);
          }}
          onFocus={() => {
            setActiveDetailSegmentId(segment.id);
            setActiveInteractiveSegmentId(segment.id);
          }}
          onMouseLeave={() => {
            setActiveDetailSegmentId((current) => (current === segment.id ? null : current));
            setActiveInteractiveSegmentId((current) => (current === segment.id ? null : current));
          }}
          onBlur={() => {
            setActiveDetailSegmentId((current) => (current === segment.id ? null : current));
            setActiveInteractiveSegmentId((current) => (current === segment.id ? null : current));
          }}
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
    const isInteractive = Boolean(segment.onClick || segment.href);
    const sharedProps = {
      title: segment.title,
      "data-map-status-segment": segment.id,
      "data-map-status-side": isLeftStatusSegment(segment.id) ? "left" : "right",
      "data-map-status-overflow": "true",
      "data-map-status-tone": segment.tone ?? "neutral",
      "data-map-status-interactive": isInteractive ? "true" : "false",
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
      data-ui-proof="real-status-bar"
      data-map-status-bar="true"
      data-map-status-overflow-count={overflowSegments.length}
    >
      <div style={segmentStripLeftStyle} data-map-status-cluster="left">
        {visibleLeftSegments.map(renderInlineSegment)}
      </div>

      {visibleLeftSegments.length > 0 && visibleRightSegments.length > 0 ? (
        <span aria-hidden="true" style={segmentClusterDividerStyle} />
      ) : null}

      <div style={segmentStripRightStyle} data-map-status-cluster="right">
        {visibleRightSegments.map(renderInlineSegment)}
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

      {activeDetailSegment ? (
        <div
          style={detailPopoverStyle}
          role="tooltip"
          data-map-status-detail-popover={activeDetailSegment.id}
        >
          <span style={detailHeaderStyle}>
            <span style={detailTitleStyle}>{activeDetailSegment.label}</span>
            <span style={{ ...segmentValueStyle, color: activeDetailSegment.tone ? STATUS_TONE_COLOR[activeDetailSegment.tone] : segmentValueStyle.color }}>
              {activeDetailSegment.value}
            </span>
          </span>
          {renderDetailBars(activeDetailSegment)}
          <span style={detailMetaStyle}>{activeDetailSegment.title}</span>
        </div>
      ) : null}

      <div
        ref={measurementRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -100_000,
          top: MAP_SPACING.zero,
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "stretch",
          gap: MAP_SPACING.zero,
          height: MAP_SPACING.zero,
          overflow: "hidden",
        }}
      >
        {segments.map((segment, index) => {
          const isGroupStart = index > 0 && segments[index - 1]?.group !== segment.group;
          return (
            <span
              key={`${segment.id}-measure`}
              data-map-status-measure-segment={segment.id}
              style={{
                ...(segment.onClick || segment.href ? segmentButtonStyle : segmentBaseStyle),
                width: "auto",
                maxWidth: "none",
                overflow: "visible",
                borderLeft: isGroupStart ? MAP_STROKES.hairlineSubtle : undefined,
              }}
            >
              {renderSegmentBody(segment, reducedMotion)}
            </span>
          );
        })}
        <button
          ref={overflowTriggerMeasureRef}
          type="button"
          style={overflowTriggerStyle}
        >
          <span style={segmentLabelStyle}>More</span>
          <span style={segmentValueStyle}>
            <MoreHorizontal aria-hidden size={12} />
            {segments.length}
          </span>
        </button>
      </div>
    </div>
  );
};
