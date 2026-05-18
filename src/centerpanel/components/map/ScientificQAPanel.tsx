import React, { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Info,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  MapScientificQACategory,
  MapScientificQAIssue,
  MapScientificQAIssueSeverity,
  MapScientificQASeverity,
  MapScientificQAState,
} from "@/services/map/MapScientificQA";
import type { LayerScientificQABadge, OverlayLayerConfig } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";

export interface ScientificQAPanelProps {
  visible: boolean;
  qaState: MapScientificQAState | null;
  overlayLayers: OverlayLayerConfig[];
  onClose: () => void;
  onShowDetails?: (issue: MapScientificQAIssue) => void;
  presentation?: "floating" | "right-rail" | "bottom-drawer";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
}

const SEVERITY_LABELS: Record<MapScientificQAIssueSeverity, string> = {
  blocker: "Blocker",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const DOMAIN_SEVERITY_LABELS: Record<MapScientificQASeverity, string> = {
  pass: "Pass",
  warning: "Warning",
  blocked: "Blocked",
  unknown: "Unknown",
};

const CATEGORY_LABELS: Record<MapScientificQACategory, string> = {
  crs: "CRS",
  "geometry-validity": "Geometry validity",
  schema: "Schema",
  scale: "Scale",
  missingness: "Missingness",
  "source-provenance": "Source/provenance",
  "attribution-license": "Attribution/license",
  "workflow-readiness": "Workflow readiness",
  "export-readiness": "Export readiness",
};

const BADGE_LABELS: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Invalid geometry",
  missing_crs: "Missing CRS",
  sample_data: "Sample data",
  stale_result: "Stale result",
  uncertain_output: "Uncertain output",
};

const BADGE_TITLES: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Feature-level geometry validation found invalid geometry.",
  missing_crs: "Projection metadata is missing or unknown.",
  sample_data: "This layer is demo or teaching data.",
  stale_result: "Analysis result is stale relative to source data.",
  uncertain_output: "The output has QA caveats that should be reviewed.",
};

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(`min(28rem, calc(100% - ${MAP_SPACING.xl}))`),
};

const rightRailResizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  left: "-0.3125rem",
  width: "0.625rem",
  padding: MAP_SPACING.zero,
  border: MAP_STROKES.none,
  cursor: "col-resize",
  touchAction: "none",
  background: MAP_COLORS.transparent,
  zIndex: MAP_Z_INDEX.symbologyPanel + 1,
};

function clampPanelWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

function getDockedPanelStyle(presentation: "right-rail" | "bottom-drawer", width?: number): React.CSSProperties {
  if (presentation === "bottom-drawer") {
    return {
      ...mapStyles.sidePanelSurface,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      top: "auto",
      height: "min(24rem, 54%)",
      borderTop: MAP_STROKES.hairlineStrong,
      zIndex: MAP_Z_INDEX.symbologyPanel,
    };
  }

  return {
    ...mapStyles.sidePanelSurface,
    top: MAP_SPACING.zero,
    right: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: `${width ?? 384}px`,
    maxWidth: "calc(100% - 2rem)",
    borderLeft: MAP_STROKES.hairlineSubtle,
    zIndex: MAP_Z_INDEX.symbologyPanel,
  };
}

const statusBand: React.CSSProperties = {
  ...mapStyles.sidePanelStatusBand,
  display: "grid",
  gridTemplateColumns: "1.5rem minmax(0, 1fr)",
  alignItems: "start",
  gap: MAP_SPACING.sm,
  background: MAP_COLORS.transparent,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const statusTitle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const statusCopy: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  marginTop: MAP_SPACING.xs,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const badgeGrid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minHeight: "1.375rem",
  maxWidth: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const categoryGrid: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
};

const categoryRowStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.none,
  borderBottom: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
  minWidth: MAP_SPACING.zero,
};

const categoryHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
};

const issueListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
};

const issueCardBase: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.none,
  borderBottom: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.transparent,
  minWidth: MAP_SPACING.zero,
};

const issueTopLine: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
  gap: MAP_SPACING.sm,
  alignItems: "start",
};

const issueTitle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const issueMeta: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const issueCopy: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const fixStyle: React.CSSProperties = {
  ...issueCopy,
  color: MAP_COLORS.text,
  padding: MAP_SPACING.sm,
  borderLeft: `2px solid ${MAP_COLORS.interaction}`,
  background: MAP_COLORS.transparent,
};

const detailButton: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  width: "100%",
  justifyContent: "space-between",
};

const detailPre: React.CSSProperties = {
  margin: 0,
  maxHeight: "8rem",
  overflow: "auto",
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const emptyStyle: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
  display: "grid",
  gap: MAP_SPACING.sm,
};

function severityColor(severity: MapScientificQAIssueSeverity): string {
  switch (severity) {
    case "blocker":
    case "error":
      return MAP_COLORS.error;
    case "warning":
      return MAP_COLORS.warning;
    default:
      return MAP_COLORS.textMuted;
  }
}

function domainSeverityColor(severity: MapScientificQASeverity): string {
  switch (severity) {
    case "blocked":
      return MAP_COLORS.error;
    case "warning":
      return MAP_COLORS.warning;
    case "unknown":
      return MAP_COLORS.textMuted;
    default:
      return MAP_COLORS.success;
  }
}

function renderSeverityIcon(severity: MapScientificQAIssueSeverity): React.ReactNode {
  const color = severityColor(severity);
  switch (severity) {
    case "blocker":
      return <ShieldAlert size={MAP_ICON_SIZES.sm} color={color} aria-hidden="true" />;
    case "error":
      return <CircleAlert size={MAP_ICON_SIZES.sm} color={color} aria-hidden="true" />;
    case "warning":
      return <AlertTriangle size={MAP_ICON_SIZES.sm} color={color} aria-hidden="true" />;
    default:
      return <Info size={MAP_ICON_SIZES.sm} color={color} aria-hidden="true" />;
  }
}

function statusText(qaState: MapScientificQAState | null): { title: string; copy: string; color: string } {
  if (!qaState) {
    return {
      title: "Scientific QA not run yet",
      copy: "Missing prerequisite: add at least one map layer so CRS, geometry, lineage, scale, and temporal checks can run.",
      color: MAP_COLORS.textMuted,
    };
  }

  if (qaState.status === "error") {
    return {
      title: "Blocking scientific caveats detected",
      copy: "Review CRS, geometry, lineage, scale, or temporal issues before dispatching analysis.",
      color: MAP_COLORS.error,
    };
  }
  if (qaState.status === "warning") {
    return {
      title: "Scientific warnings available",
      copy: "The map can be inspected, but caveats should be recorded before interpreting results.",
      color: MAP_COLORS.warning,
    };
  }
  return {
    title: "Scientific QA passed",
    copy: "Visible layers passed deterministic blocking checks for the current map state.",
    color: MAP_COLORS.success,
  };
}

function formatLayerLabel(issue: MapScientificQAIssue): string {
  const layer = issue.layerName ?? "Visible stack";
  if (issue.featureId) {
    return `${layer} / feature ${issue.featureId}`;
  }
  if (issue.featureIndex != null) {
    return `${layer} / feature ${issue.featureIndex + 1}`;
  }
  return layer;
}

export const ScientificQAPanel: React.FC<ScientificQAPanelProps> = ({
  visible,
  qaState,
  overlayLayers,
  onClose,
  onShowDetails,
  presentation = "floating",
  width,
  minWidth = 300,
  maxWidth = 520,
  onWidthChange,
}) => {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();

  const layerBadgeRows = useMemo(() => {
    return overlayLayers
      .map((layer) => {
        const summary = qaState?.layerSummaries.find((entry) => entry.layerId === layer.id);
        const badges = layer.metadata?.scientificQA?.badges ?? summary?.badges ?? [];
        return {
          layerId: layer.id,
          layerName: layer.name,
          status: layer.metadata?.scientificQA?.status ?? summary?.status ?? layer.qaStatus ?? "unchecked",
          featureIssueCount: layer.metadata?.scientificQA?.featureIssueCount ?? summary?.featureIssueCount ?? 0,
          badges,
        };
      })
      .filter((entry) => entry.badges.length > 0 || entry.featureIssueCount > 0 || entry.status === "error");
  }, [overlayLayers, qaState?.layerSummaries]);

  const layerNameById = useMemo(() => {
    return new Map(overlayLayers.map((layer) => [layer.id, layer.name]));
  }, [overlayLayers]);

  const categoryRows = qaState?.metadata.categorySummaries ?? [];
  const categoryRiskCount = categoryRows.filter((row) => row.severity !== "pass").length;

  const summary = statusText(qaState);
  const issueCount = qaState?.issues.length ?? 0;
  const warningCount = qaState?.metadata.issueCounts.warning ?? 0;
  const blockerCount = (qaState?.metadata.issueCounts.blocker ?? 0) + (qaState?.metadata.issueCounts.error ?? 0);
  const checkedAt = qaState ? new Date(qaState.checkedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) : "Pending";
  const handleResizePointerDown = useCallback<React.PointerEventHandler<HTMLButtonElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }

    const panelElement = event.currentTarget.parentElement;
    const startWidth = panelElement?.getBoundingClientRect().width ?? width ?? 384;
    const startX = event.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onWidthChange(clampPanelWidth(Math.round(startWidth + startX - moveEvent.clientX), minWidth, maxWidth));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, [maxWidth, minWidth, onWidthChange, presentation, width]);

  const handleResizeKeyDown = useCallback<React.KeyboardEventHandler<HTMLButtonElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }
    const step = event.shiftKey ? 32 : 12;
    if (event.key === "ArrowLeft") {
      onWidthChange(clampPanelWidth((width ?? 384) + step, minWidth, maxWidth));
      event.preventDefault();
    }
    if (event.key === "ArrowRight") {
      onWidthChange(clampPanelWidth((width ?? 384) - step, minWidth, maxWidth));
      event.preventDefault();
    }
  }, [maxWidth, minWidth, onWidthChange, presentation, width]);

  if (!visible) {
    return null;
  }

  const floating = presentation === "floating";
  const resolvedPanelStyle = floating
    ? { ...panelStyle, ...panelPositionStyle }
    : getDockedPanelStyle(presentation, width);
  const resolvedHeaderStyle = floating
    ? { ...mapStyles.sidePanelHeader, ...dragHandleStyle }
    : mapStyles.sidePanelHeader;

  return (
    <aside style={resolvedPanelStyle} role="dialog" aria-modal="false" aria-label="Scientific QA side panel">
      {presentation === "right-rail" && onWidthChange ? (
        <button
          type="button"
          aria-label="Resize scientific QA panel"
          style={rightRailResizeHandleStyle}
          onPointerDown={handleResizePointerDown}
          onKeyDown={handleResizeKeyDown}
          data-testid="map-right-panel-resize-handle"
          title="Drag or use arrow keys to resize scientific QA panel"
        />
      ) : null}
      <div style={resolvedHeaderStyle} {...(floating ? dragHandleProps : {})}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Scientific control</span>
          <span style={mapStyles.sidePanelTitle}>
            <ShieldCheck size={MAP_ICON_SIZES.sm} color={summary.color} aria-hidden="true" />
            Scientific QA
          </span>
        </div>
        <button
          type="button"
          style={mapStyles.sidePanelActionButton}
          onClick={onClose}
          aria-label="Close scientific QA panel"
          title="Close scientific QA panel"
        >
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </div>

      <div
        style={statusBand}
        role="status"
        aria-live="polite"
        aria-label={`${summary.title}. ${summary.copy}. ${blockerCount} blocker${blockerCount === 1 ? "" : "s"} and ${warningCount} warning${warningCount === 1 ? "" : "s"}.`}
      >
        {qaState?.status === "passed" ? (
          <BadgeCheck size={MAP_ICON_SIZES.md} color={summary.color} aria-hidden="true" />
        ) : (
          <ShieldAlert size={MAP_ICON_SIZES.md} color={summary.color} aria-hidden="true" />
        )}
        <div>
          <div style={statusTitle}>{summary.title}</div>
          <div style={statusCopy}>{summary.copy}</div>
        </div>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Scientific QA summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Issues</span>
          <span style={mapStyles.sidePanelMetricValue}>{issueCount}</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Blockers</span>
          <span style={mapStyles.sidePanelMetricValue}>{blockerCount}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Checked</span>
          <span style={mapStyles.sidePanelMetricValue}>{checkedAt}</span>
        </div>
      </div>

      <div style={mapStyles.sidePanelBody}>
        <section style={sectionStyle} aria-label="Scientific QA domains">
          <div style={sectionHeaderStyle}>
            <span>QA domains</span>
            <span>{categoryRiskCount > 0 ? `${categoryRiskCount} need review` : "9 checked"}</span>
          </div>
          {categoryRows.length > 0 ? (
            <div style={categoryGrid}>
              {categoryRows.map((row) => {
                const color = domainSeverityColor(row.severity);
                const affectedLayers = row.affectedLayerIds
                  .map((layerId) => layerNameById.get(layerId) ?? layerId)
                  .slice(0, 3);
                return (
                  <div key={row.category} style={categoryRowStyle}>
                    <div style={categoryHeaderStyle}>
                      <span style={issueTitle}>{CATEGORY_LABELS[row.category]}</span>
                      <span style={{ ...badgeStyle, color, border: `1px solid ${color}` }}>
                        {DOMAIN_SEVERITY_LABELS[row.severity]}
                      </span>
                    </div>
                    <div style={issueCopy}>{row.reasons[0] ?? "No QA reason recorded for this domain."}</div>
                    {affectedLayers.length > 0 ? (
                      <div style={issueMeta}>Affected: {affectedLayers.join(", ")}</div>
                    ) : null}
                    {row.recommendedFixes.length > 0 ? (
                      <div style={fixStyle}>
                        <strong>Recommended fix:</strong> {row.recommendedFixes[0]}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={issueCopy}>QA domains appear after scientific QA runs for the visible map state.</div>
          )}
        </section>

        <section style={sectionStyle} aria-label="QA layer badges">
          <div style={sectionHeaderStyle}>
            <span>Layer badges</span>
            <span>{layerBadgeRows.length}</span>
          </div>
          {layerBadgeRows.length > 0 ? (
            <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
              {layerBadgeRows.map((row) => (
                <div key={row.layerId} style={{ display: "grid", gap: MAP_SPACING.xs, minWidth: MAP_SPACING.zero }}>
                  <div style={{ ...issueMeta, color: row.status === "error" ? MAP_COLORS.error : MAP_COLORS.textMuted }}>
                    {row.layerName}{row.featureIssueCount > 0 ? ` / ${row.featureIssueCount} feature issue(s)` : ""}
                  </div>
                  <div style={badgeGrid}>
                    {row.badges.map((badge) => (
                      <span key={`${row.layerId}-${badge}`} style={badgeStyle} title={BADGE_TITLES[badge]}>
                        {BADGE_LABELS[badge]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={issueCopy}>No layer-level scientific QA badges for the current map state.</div>
          )}
        </section>

        <section style={{ borderBottom: MAP_STROKES.none }} aria-label="Scientific QA issues">
          <div style={{ ...sectionHeaderStyle, padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.zero}` }}>
            <span>Issues</span>
            <span>{warningCount > 0 ? `${warningCount} warning(s)` : "Deterministic"}</span>
          </div>

          {!qaState || qaState.issues.length === 0 ? (
            <div style={emptyStyle}>
              <ShieldCheck size={MAP_ICON_SIZES.md} color={MAP_COLORS.success} aria-hidden="true" />
              <span>{qaState ? "No scientific QA issues are currently open." : "Scientific QA is pending until a map layer is available."}</span>
            </div>
          ) : (
            <div style={issueListStyle}>
              {qaState.issues.map((issue) => {
                const expanded = expandedIssueId === issue.id;
                const color = severityColor(issue.severity);
                return (
                  <article
                    key={issue.id}
                    aria-label={`${SEVERITY_LABELS[issue.severity]} QA issue: ${issue.title}. ${issue.explanation}`}
                    style={{
                      ...issueCardBase,
                      border: MAP_STROKES.none,
                      borderBottom: MAP_STROKES.hairlineSubtle,
                      borderLeft: `2px solid ${color}`,
                    }}
                  >
                    <div style={issueTopLine}>
                      {renderSeverityIcon(issue.severity)}
                      <div style={{ minWidth: MAP_SPACING.zero }}>
                        <div style={issueTitle}>{issue.title}</div>
                        <div style={issueMeta}>
                          {SEVERITY_LABELS[issue.severity]} / {issue.category} / {formatLayerLabel(issue)}
                        </div>
                      </div>
                      <span style={{ ...badgeStyle, color, border: `1px solid ${color}` }}>
                        {issue.code}
                      </span>
                    </div>

                    <div style={issueCopy}>{issue.explanation}</div>
                    <div style={fixStyle}>
                      <strong>Suggested fix:</strong> {issue.suggestedFix}
                    </div>

                    <button
                      type="button"
                      style={detailButton}
                      onClick={() => {
                        setExpandedIssueId((current) => current === issue.id ? null : issue.id);
                        onShowDetails?.(issue);
                      }}
                      aria-expanded={expanded}
                      aria-controls={`scientific-qa-details-${issue.id}`}
                      aria-label={`${expanded ? "Hide" : "Show"} details for QA issue ${issue.title}`}
                    >
                      <span>Show details</span>
                      {expanded ? (
                        <ChevronDown size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                      )}
                    </button>

                    {expanded ? (
                      <pre id={`scientific-qa-details-${issue.id}`} style={detailPre}>
                        {JSON.stringify({
                          id: issue.id,
                          layerId: issue.layerId,
                          featureId: issue.featureId,
                          featureIndex: issue.featureIndex,
                          details: issue.details ?? null,
                        }, null, 2)}
                      </pre>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};
