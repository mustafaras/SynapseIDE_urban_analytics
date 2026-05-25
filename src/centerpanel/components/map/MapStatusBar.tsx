import React from "react";
import type { LayerQaStatus, LayerRenderMode, MeasureUnit } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_SPACING,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
} from "./mapTokens";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapStatusBarProps {
  cursor: { lng: number; lat: number } | null;
  zoom: number;
  projectId?: string | null;
  workspaceLabel?: string | null;
  layerCount?: number;
  visibleLayerCount?: number;
  pinCount?: number;
  drawnFeatureCount?: number;
  measurementCount?: number;
  measureUnit?: MeasureUnit;
  crs?: string;
  syncStatus?: string;
  selectedFeatureCount?: number;
  hasActiveAoi?: boolean;
  qaStatus?: LayerQaStatus;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  performanceMode?: LayerRenderMode;
  performanceIssueCount?: number;
  lastRenderDurationMs?: number | null;
  isSaving?: boolean;
  isLoading?: boolean;
  lastSavedAt?: string | null;
  autoSaveEnabled?: boolean;
  style?: React.CSSProperties;
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const statusBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgPanel,
  borderTop: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  color: MAP_COLORS.textMuted,
  flexShrink: 0,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  transition: MAP_TRANSITIONS.fast,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "none",
};

const statusLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const statusItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  whiteSpace: "nowrap",
};

const separatorStyle: React.CSSProperties = {
  color: "var(--syn-border-subtle, rgba(148, 163, 184, 0.56))",
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  color: MAP_COLORS.textSecondary,
  textOverflow: "ellipsis",
};

const busyValueStyle: React.CSSProperties = {
  ...valueStyle,
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
};

const spinnerStyle: React.CSSProperties = {
  width: "0.75rem",
  height: "0.75rem",
  color: "var(--syn-status-running, #60a5fa)",
  flexShrink: 0,
};

const linkStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  textDecoration: "none",
};

type StatusItem = {
  label: string;
  value: string;
  maxWidth?: string;
  busy?: boolean;
  tone?: StatusTone;
};

type StatusTone = "neutral" | "info" | "error" | "valid" | "running" | "pending" | "stale" | "warning";

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

function StatusSpinner(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label="Project persistence in progress"
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
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 8 8"
          to="360 8 8"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function formatProjectLabel(projectId?: string | null): string {
  if (!projectId) return "none";
  return projectId
    .replace(/^proj[_-]?/i, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatSaveLabel(value?: string | null): string {
  if (!value) return "draft";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "draft";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    return issueCount > 0 ? "info" : "stale";
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

function formatPerformanceLabel(mode: LayerRenderMode, issueCount: number, durationMs?: number | null): string {
  const durationLabel = durationMs != null && Number.isFinite(durationMs) ? ` ${Math.round(durationMs)}ms` : "";
  if (mode === "preview") {
    return `preview${issueCount > 0 ? ` ${issueCount}` : ""}${durationLabel}`;
  }
  return `full${durationLabel}`;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapStatusBar: React.FC<MapStatusBarProps> = ({
  cursor,
  zoom,
  projectId = null,
  workspaceLabel = null,
  layerCount = 0,
  visibleLayerCount = 0,
  pinCount = 0,
  drawnFeatureCount = 0,
  measurementCount = 0,
  measureUnit = "metric",
  crs = "EPSG:4326",
  syncStatus = "3D link off",
  selectedFeatureCount = 0,
  hasActiveAoi = false,
  qaStatus = "unchecked",
  qaIssueCount = 0,
  qaBlockerCount = 0,
  performanceMode = "full",
  performanceIssueCount = 0,
  lastRenderDurationMs = null,
  isSaving = false,
  isLoading = false,
  lastSavedAt = null,
  autoSaveEnabled = true,
  style: styleProp,
}) => {
  const saveLabel = isLoading
    ? "loading"
    : isSaving
      ? "saving"
      : lastSavedAt
        ? formatSaveLabel(lastSavedAt)
        : "draft";
  const syncLabel = syncStatus;
  const projectLabel = formatProjectLabel(projectId);
  const geometryLabel = `${drawnFeatureCount} draw / ${measurementCount} meas / ${pinCount} pin`;
  const qaLabel = formatQaLabel(qaStatus, qaIssueCount, qaBlockerCount);
  const performanceLabel = formatPerformanceLabel(performanceMode, performanceIssueCount, lastRenderDurationMs);
  const qaValueTone = qaTone(qaStatus, qaIssueCount, qaBlockerCount);
  const performanceTone: StatusTone = performanceMode === "preview" || performanceIssueCount > 0 ? "warning" : "valid";
  const syncValueTone = syncTone(syncLabel);
  const saveValueTone = saveTone(isLoading, isSaving, lastSavedAt);
  const statusItems: StatusItem[] = [
    { label: "Zoom", value: zoom.toFixed(1) },
    ...(cursor != null ? [{ label: "Cursor", value: `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}`, maxWidth: "12rem" }] : []),
    { label: "Project", value: projectLabel, maxWidth: "12rem" },
    { label: "Mode", value: workspaceLabel ?? "explore" },
    { label: "Layers", value: `${visibleLayerCount}/${layerCount}` },
    { label: "Select", value: `${selectedFeatureCount}` },
    { label: "AOI", value: hasActiveAoi ? "active" : "none", tone: hasActiveAoi ? "info" : "stale" },
    { label: "Marks", value: geometryLabel },
    { label: "Units", value: measureUnit === "metric" ? "metric" : "imperial" },
    { label: "CRS", value: crs, tone: "info" },
    { label: "QA", value: qaLabel, tone: qaValueTone },
    { label: "Perf", value: performanceLabel, tone: performanceTone },
    { label: "Sync", value: syncLabel, tone: syncValueTone },
    { label: "Saved", value: saveLabel, busy: isSaving || isLoading, tone: saveValueTone },
  ];

  return (
    <div style={{ ...statusBar, ...styleProp }} role="status" aria-label="Map status">
      <div style={statusLine}>
        {statusItems.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 ? <span style={separatorStyle}>/</span> : null}
            <span style={{ ...statusItem, maxWidth: item.maxWidth }}>
              <b style={labelStyle}>{item.label}</b>
              <span
                style={{
                  ...(item.busy ? busyValueStyle : valueStyle),
                  color: item.tone ? STATUS_TONE_COLOR[item.tone] : valueStyle.color,
                }}
              >
                :
                {item.busy ? <StatusSpinner /> : null}
                {item.value}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: MAP_SPACING.sm }} />
      <span style={{ ...statusItem, flexShrink: 0 }}>
        <b style={labelStyle}>Auto</b>
        <span style={valueStyle}>: {autoSaveEnabled ? "on" : "off"}</span>
      </span>
      <span style={separatorStyle}>/</span>
      <span style={{ ...statusItem, flexShrink: 0 }}>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          OSM
        </a>
      </span>
    </div>
  );
};
