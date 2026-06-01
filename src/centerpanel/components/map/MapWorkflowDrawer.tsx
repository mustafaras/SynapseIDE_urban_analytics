/* ================================================================== */
/*  MapWorkflowDrawer                                                  */
/*                                                                     */
/*  UI surface for the AOI / Buffer / Intersect / Diff /              */
/*  Union / Comparison guided workflows backed by MapWorkflowService.  */
/*                                                                    */
/*  - Stepper: source → operation → parameters → preview → apply →   */
/*    report                                                          */
/*  - Live preview metrics, issues, guidance                         */
/*  - Disabled controls when inputs are missing or layers don't      */
/*    match the operation's geometry requirements                     */
/*  - Suggestions are rendered as explicit actions, never auto-apply */
/* ================================================================== */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Code2,
  GitBranch,
  Info,
  Layers,
  MapPin,
  Plus,
  Save,
  Scissors,
  SplitSquareHorizontal,
  Workflow,
  X,
} from "lucide-react";
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
import {
  createOpaqueFloatingPanelStyle,
  useDraggableMapPanel,
} from "./useDraggableMapPanel";
import {
  applyMapWorkflowPreview,
  createDefaultDraft,
  generateMapWorkflowPreview,
  MAP_WORKFLOW_AOI_SOURCE_LABELS,
  MAP_WORKFLOW_COMPARISON_VIEW_LABELS,
  MAP_WORKFLOW_DISTANCE_UNIT_LABELS,
  MAP_WORKFLOW_STEP_LABELS,
  MAP_WORKFLOW_STEP_ORDER,
  type MapWorkflowAOIDraft,
  type MapWorkflowAOISourceKind,
  type MapWorkflowApplyResult,
  type MapWorkflowBufferDraft,
  type MapWorkflowComparisonDraft,
  type MapWorkflowComparisonView,
  type MapWorkflowContext,
  type MapWorkflowDifferenceDraft,
  type MapWorkflowDistanceUnit,
  type MapWorkflowDraft,
  type MapWorkflowExecutionUpdate,
  type MapWorkflowIntersectDraft,
  type MapWorkflowKind,
  type MapWorkflowPreview,
  type MapWorkflowReportItem,
  type MapWorkflowStepId,
  type MapWorkflowSuggestedAction,
  type MapWorkflowUnionDraft,
} from "@/services/map/MapWorkflowService";

export interface MapWorkflowDrawerProps {
  visible: boolean;
  context: MapWorkflowContext;
  onClose: () => void;
  onApply: (result: MapWorkflowApplyResult) => void;
  onSaveReport?: (report: MapWorkflowReportItem) => void;
  onPreviewChange?: (preview: MapWorkflowPreview | null) => void;
  /** Run a large-input workflow off the main thread (worker). */
  onExecuteWorkflow?: (preview: MapWorkflowPreview) => void;
  /** Cancel the in-flight worker execution. */
  onCancelWorkflow?: () => void;
  /** Live worker execution state (progress/cancel/failure). */
  workflowExecution?: MapWorkflowExecutionUpdate | null;
  onOpenWorkflowScript?: (preview: MapWorkflowPreview) => void;
  initialDraftRequest?: {
    requestId: string;
    kind: MapWorkflowKind;
    draft: MapWorkflowDraft;
  } | null;
  onAnnounce?: (message: string) => void;
  presentation?: "floating" | "right-rail" | "bottom-drawer" | "embedded";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
}

const WORKFLOW_OPTIONS: Array<{
  kind: MapWorkflowKind;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    kind: "aoi",
    label: "Create AOI",
    description: "Build a study area from viewport, drawn polygon, selection, geocoded place, or Urban context.",
    icon: <MapPin size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    kind: "buffer",
    label: "Buffer",
    description: "Geodesic ring around point/line/polygon features.",
    icon: <Workflow size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    kind: "intersect",
    label: "Intersect",
    description: "Spatial overlap of two polygon layers.",
    icon: <Scissors size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    kind: "difference",
    label: "Difference",
    description: "A − B for scenario comparison.",
    icon: <CircleOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    kind: "union",
    label: "Union",
    description: "Combine A ∪ B coverage.",
    icon: <Plus size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
  {
    kind: "comparison",
    label: "Compare",
    description: "Synchronized split, swipe, or opacity blend.",
    icon: <SplitSquareHorizontal size={MAP_ICON_SIZES.sm} aria-hidden="true" />,
  },
];

const DISTANCE_UNITS: MapWorkflowDistanceUnit[] = ["meters", "kilometers", "feet", "miles"];
const AOI_SOURCES: MapWorkflowAOISourceKind[] = [
  "viewport",
  "selected-features",
  "drawn-polygon",
  "geocoded-place",
  "urban-study-area",
];
const COMPARISON_VIEWS: MapWorkflowComparisonView[] = ["split", "swipe", "blend"];

/* ---- Styles ---- */

const drawerStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(48rem, calc(100% - 2.5rem))"),
};

const workflowResizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  left: "-0.3125rem",
  width: "0.625rem",
  cursor: "col-resize",
  touchAction: "none",
  background: MAP_COLORS.transparent,
  zIndex: MAP_Z_INDEX.symbologyPanel + 9,
};

function clampPanelWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

function getWorkflowDrawerStyle(
  presentation: "floating" | "right-rail" | "bottom-drawer" | "embedded",
  width?: number,
): React.CSSProperties {
  if (presentation === "embedded") {
    return {
      position: "relative",
      inset: "auto",
      width: "100%",
      height: "100%",
      minHeight: "34rem",
      maxWidth: "none",
      display: "flex",
      flexDirection: "column",
      border: MAP_STROKES.none,
      borderRadius: 0,
      background: MAP_COLORS.bgPanel,
      boxShadow: "none",
      zIndex: "auto",
      overflow: "hidden",
    };
  }

  if (presentation === "bottom-drawer") {
    return {
      ...mapStyles.sidePanelSurface,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      top: "auto",
      height: "min(28rem, 62%)",
      maxHeight: "min(34rem, 74%)",
      display: "flex",
      flexDirection: "column",
      borderTop: MAP_STROKES.hairlineStrong,
      zIndex: MAP_Z_INDEX.symbologyPanel + 8,
    };
  }

  if (presentation === "right-rail") {
    return {
      ...mapStyles.sidePanelSurface,
      top: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      width: `${width ?? 480}px`,
      maxWidth: "calc(100% - 2rem)",
      display: "flex",
      flexDirection: "column",
      borderLeft: MAP_STROKES.hairlineSubtle,
      zIndex: MAP_Z_INDEX.symbologyPanel + 8,
    };
  }

  return drawerStyle;
}

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const sectionTitle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const stepperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexWrap: "wrap",
};

const stepPillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.bg,
};

const stepPillCurrent: React.CSSProperties = {
  ...stepPillBase,
  border: MAP_STROKES.hairlineStrong,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
  boxShadow: `inset 2px 0 0 ${MAP_COLORS.interaction}`,
};

const stepPillCompleted: React.CSSProperties = {
  ...stepPillBase,
  border: `1px solid ${MAP_COLORS.success}`,
  color: MAP_COLORS.success,
};

const stepPillBlocked: React.CSSProperties = {
  ...stepPillBase,
  border: `1px solid ${MAP_COLORS.error}`,
  color: MAP_COLORS.error,
};

const optionRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
  gap: MAP_SPACING.sm,
};

const tileButtonBase: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const tileButtonActive: React.CSSProperties = {
  ...tileButtonBase,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.selectedSubtle,
  color: MAP_COLORS.interaction,
  boxShadow: `inset 2px 0 0 ${MAP_COLORS.interaction}`,
};

const tileButtonDisabled: React.CSSProperties = {
  ...tileButtonBase,
  opacity: 0.45,
  cursor: "not-allowed",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  outline: MAP_STROKES.none,
};

const numberInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
};

const metricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
  gap: MAP_SPACING.sm,
};

const metricCell: React.CSSProperties = {
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  display: "grid",
  gap: MAP_SPACING.xs,
};

const metricLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metricValue: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const guidanceItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1rem minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const issueLine = (severity: "blocker" | "warning" | "info"): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: "1rem minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color:
    severity === "blocker"
      ? MAP_COLORS.error
      : severity === "warning"
        ? MAP_COLORS.warning
        : MAP_COLORS.textSecondary,
});

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
};

const fieldGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
  gap: MAP_SPACING.sm,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapWorkflowDrawer: React.FC<MapWorkflowDrawerProps> = ({
  visible,
  context,
  onClose,
  onApply,
  onSaveReport,
  onPreviewChange,
  onOpenWorkflowScript,
  onExecuteWorkflow,
  onCancelWorkflow,
  workflowExecution,
  onAnnounce,
  presentation = "floating",
  width,
  minWidth = 300,
  maxWidth = 520,
  onWidthChange,
  initialDraftRequest,
}) => {
  const [kind, setKind] = useState<MapWorkflowKind>("aoi");
  const [draftsByKind, setDraftsByKind] = useState<Record<MapWorkflowKind, MapWorkflowDraft>>(() => ({
    aoi: createDefaultDraft("aoi"),
    buffer: createDefaultDraft("buffer"),
    intersect: createDefaultDraft("intersect"),
    difference: createDefaultDraft("difference"),
    union: createDefaultDraft("union"),
    comparison: createDefaultDraft("comparison"),
  }));
  const [report, setReport] = useState<{ title: string; description: string } | null>(null);
  const drag = useDraggableMapPanel();
  const docked = presentation !== "floating";
  const handleResizePointerDown = React.useCallback<React.PointerEventHandler<HTMLDivElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }

    const panelElement = event.currentTarget.parentElement;
    const startWidth = panelElement?.getBoundingClientRect().width ?? width ?? 480;
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

  const handleResizeKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
    if (presentation !== "right-rail" || !onWidthChange) {
      return;
    }

    const currentWidth = width ?? 430;
    const step = event.shiftKey ? 32 : 12;
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") {
      nextWidth = currentWidth + step;
    } else if (event.key === "ArrowRight") {
      nextWidth = currentWidth - step;
    } else if (event.key === "Home") {
      nextWidth = minWidth;
    } else if (event.key === "End") {
      nextWidth = maxWidth;
    }

    if (nextWidth == null) {
      return;
    }

    event.preventDefault();
    onWidthChange(clampPanelWidth(nextWidth, minWidth, maxWidth));
    onAnnounce?.(`Workflow panel resized to ${clampPanelWidth(nextWidth, minWidth, maxWidth)} pixels`);
  }, [maxWidth, minWidth, onAnnounce, onWidthChange, presentation, width]);

  useEffect(() => {
    if (!visible || !initialDraftRequest) {
      return;
    }
    setKind(initialDraftRequest.kind);
    setDraftsByKind((current) => ({
      ...current,
      [initialDraftRequest.kind]: initialDraftRequest.draft,
    }));
  }, [initialDraftRequest, visible]);

  const draft = draftsByKind[kind];
  const preview = useMemo(
    () => generateMapWorkflowPreview(draft, context),
    [draft, context],
  );
  const crsBlocker = preview.issues.find(
    (issue) => issue.severity === "blocker" && issue.code.startsWith("crs-"),
  );

  useEffect(() => {
    if (!visible) {
      onPreviewChange?.(null);
      return undefined;
    }

    onPreviewChange?.(preview);
    return () => onPreviewChange?.(null);
  }, [onPreviewChange, preview, visible]);

  if (!visible) return null;

  const updateDraft = (patch: Partial<MapWorkflowDraft>) => {
    setDraftsByKind((current) => {
      const next = { ...current };
      const merged: MapWorkflowDraft = { ...current[kind], ...patch } as MapWorkflowDraft;
      next[kind] = merged;
      return next;
    });
  };

  const applySuggestion = (suggestion: MapWorkflowSuggestedAction) => {
    updateDraft(suggestion.patch);
    onAnnounce?.(`Applied suggestion: ${suggestion.label}`);
  };

  const handleApply = () => {
    // Large inputs run off the main thread with progress + cancel.
    if (preview.needsWorker && onExecuteWorkflow) {
      onExecuteWorkflow(preview);
      onAnnounce?.(`Running ${preview.workflow} in a background worker.`);
      return;
    }
    const result = applyMapWorkflowPreview(preview, context);
    if (!result) {
      onAnnounce?.("Workflow could not be applied. Resolve the highlighted blockers and try again.");
      return;
    }
    onApply(result);
    onPreviewChange?.(null);
    setReport({
      title: result.layer.name,
      description: result.reportItem.description,
    });
    onAnnounce?.(`${result.layer.name} added to map.`);
  };

  const handleSaveReport = () => {
    const result = applyMapWorkflowPreview(preview, context);
    if (!result) return;
    onSaveReport?.(result.reportItem);
    onAnnounce?.(`${result.reportItem.title} saved as report item.`);
  };
  const announceCrsRemedy = (remedy: NonNullable<MapWorkflowPreview["issues"][number]["remedy"]>) => {
    const label = formatCrsRemedyLabel(remedy);
    const instruction = remedy === "declare-crs"
      ? "Open the layer inspector CRS controls and declare the source CRS before rerunning this workflow."
      : remedy === "reproject"
        ? "Reproject the source layer to a suitable projected CRS before rerunning this workflow."
        : remedy === "use-geodesic"
          ? "Switch to a geodesic display measurement when an analytical planar result is not required."
          : "No CRS remedy is required.";
    onAnnounce?.(`${label}: ${instruction}`);
  };
  const applyStatusId = "map-workflow-apply-status";
  const executionActive = workflowExecution?.status === "queued" || workflowExecution?.status === "running";
  const executionFailed = workflowExecution?.status === "failed";
  const applyStatusText = executionActive
    ? `Running in worker — ${workflowExecution?.stage ?? "processing"} (${workflowExecution?.percent ?? 0}%).`
    : preview.canApply
      ? preview.needsWorker
        ? "Large input — runs in a background worker with progress and cancel."
        : "Ready to apply; derived layer will register with provenance and QA."
      : preview.nextRequiredStep
        ? `Missing prerequisite: complete ${MAP_WORKFLOW_STEP_LABELS[preview.nextRequiredStep]}.`
        : "Missing prerequisite: configure workflow inputs.";

  return (
    <div
      style={{ ...getWorkflowDrawerStyle(presentation, width), ...(docked ? {} : drag.panelPositionStyle) }}
      role="dialog"
      aria-label="Map workflow drawer"
      data-testid="map-workflow-drawer"
      data-map-workflow-panel={presentation}
    >
      {presentation === "right-rail" && onWidthChange ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize workflow analysis panel"
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={width ?? 430}
          aria-valuetext={`${width ?? 430} pixels`}
          tabIndex={0}
          style={workflowResizeHandleStyle}
          onPointerDown={handleResizePointerDown}
          onKeyDown={handleResizeKeyDown}
          data-testid="map-workflow-panel-resize-handle"
          title="Drag or use arrow keys to resize workflow analysis panel"
        />
      ) : null}
      <div
        style={{ ...mapStyles.sidePanelHeader, ...(docked ? {} : drag.dragHandleStyle) }}
        {...(docked ? {} : drag.dragHandleProps)}
      >
        <div style={mapStyles.sidePanelTitleStack}>
          <div style={mapStyles.sidePanelEyebrow}>Spatial workflow</div>
          <div style={mapStyles.sidePanelTitle}>
            <GitBranch size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            AOI · Buffer · Compare
          </div>
        </div>
        <div style={mapStyles.sidePanelHeaderActions}>
          <button
            type="button"
            style={mapStyles.sidePanelActionButton}
            onClick={onClose}
            aria-label="Close map workflow drawer"
          >
            <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div style={{ ...mapStyles.sidePanelBody, overflowY: "auto" }}>
        <Stepper preview={preview} />

        {/* Operation tiles */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>{MAP_WORKFLOW_STEP_LABELS.operation}</div>
          <div style={optionRow}>
            {WORKFLOW_OPTIONS.map((option) => {
              const active = option.kind === kind;
              return (
                <button
                  key={option.kind}
                  type="button"
                  style={active ? tileButtonActive : tileButtonBase}
                  onClick={() => setKind(option.kind)}
                  aria-pressed={active}
                  aria-label={`${option.label}: ${option.description}`}
                >
                  <div style={{ display: "flex", gap: MAP_SPACING.xs, alignItems: "center" }}>
                    {option.icon}
                    <span style={{ fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{option.label}</span>
                  </div>
                  <div style={{ color: MAP_COLORS.textMuted }}>{option.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source + parameter editor (workflow-specific) */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>
            {MAP_WORKFLOW_STEP_LABELS.source} · {MAP_WORKFLOW_STEP_LABELS.parameters}
          </div>
          {renderWorkflowEditor({ draft, context, updateDraft })}
        </div>

        {/* Preview metrics */}
        <div style={sectionStyle}>
          <div style={{ ...sectionTitle, display: "flex", justifyContent: "space-between" }}>
            <span>{MAP_WORKFLOW_STEP_LABELS.preview}</span>
            <PreviewBadge preview={preview} />
          </div>
          {crsBlocker ? (
            <div
              style={{
                ...issueLine("blocker"),
                padding: MAP_SPACING.sm,
                border: `1px solid ${MAP_COLORS.error}`,
                borderRadius: MAP_RADIUS.sm,
                background: MAP_COLORS.selectedSubtle,
              }}
              data-testid="map-workflow-crs-blocked-card"
            >
              <CircleOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              <span>
                <strong style={{ color: MAP_COLORS.text }}>CRS preflight blocked:</strong>{" "}
                {crsBlocker.message}
                {crsBlocker.remedy ? (
                  <button
                    type="button"
                    style={{ ...mapStyles.sidePanelActionButton, marginTop: MAP_SPACING.xs, width: "fit-content" }}
                    onClick={() => crsBlocker.remedy ? announceCrsRemedy(crsBlocker.remedy) : undefined}
                    aria-label={`${formatCrsRemedyLabel(crsBlocker.remedy)} for blocked CRS preflight`}
                  >
                    {formatCrsRemedyLabel(crsBlocker.remedy)}
                  </button>
                ) : null}
              </span>
            </div>
          ) : null}
          <div style={metricGrid}>
            {Object.entries(preview.metrics).map(([key, value]) => (
              <div key={key} style={metricCell}>
                <span style={metricLabel} title={key}>{formatMetricLabel(key)}</span>
                <span style={metricValue} title={String(value)}>{formatMetricValue(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <ManifestSummary preview={preview} />

        {onOpenWorkflowScript ? (
          <div style={{ ...sectionStyle, display: "flex", justifyContent: "space-between", gap: MAP_SPACING.sm, alignItems: "center" }}>
            <div style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: 1.45 }}>
              Manifest-linked script
            </div>
            <button
              type="button"
              style={mapStyles.sidePanelActionButton}
              onClick={() => onOpenWorkflowScript(preview)}
              aria-label="Open workflow script in Synapse IDE"
              title="Open a new IDE tab with a reproducible workflow script."
            >
              <Code2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              IDE script
            </button>
          </div>
        ) : null}

        {/* Guidance */}
        {preview.guidance.length > 0 ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>Why each input is required</div>
            {preview.guidance.map((entry, index) => (
              <div key={`${entry.step}:${index}`} style={guidanceItemStyle}>
                <Info size={MAP_ICON_SIZES.sm} color={MAP_COLORS.textMuted} aria-hidden="true" />
                <span>
                  <strong style={{ color: MAP_COLORS.text }}>{entry.title}</strong>
                  <span style={{ color: MAP_COLORS.textMuted }}> · </span>
                  {entry.body}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Issues */}
        {preview.issues.length > 0 ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>Validation</div>
            {preview.issues.map((issue, index) => (
              <div key={`${issue.code}:${index}`} style={issueLine(issue.severity)}>
                {issue.severity === "blocker" ? (
                  <CircleOff size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                ) : issue.severity === "warning" ? (
                  <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                ) : (
                  <Info size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                )}
                <span>
                  <strong style={{ color: MAP_COLORS.text }}>
                    {MAP_WORKFLOW_STEP_LABELS[issue.step]}:
                  </strong>{" "}
                  {issue.message}
                  {issue.remedy ? (
                    <button
                      type="button"
                      style={{ ...mapStyles.sidePanelActionButton, marginTop: MAP_SPACING.xs, width: "fit-content" }}
                      onClick={() => issue.remedy ? announceCrsRemedy(issue.remedy) : undefined}
                      aria-label={`${formatCrsRemedyLabel(issue.remedy)} for CRS blocker`}
                    >
                      {formatCrsRemedyLabel(issue.remedy)}
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Suggestions — explicit actions */}
        {preview.suggestions.length > 0 ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>Suggestions</div>
            {preview.suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                style={tileButtonBase}
                onClick={() => applySuggestion(suggestion)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.xs }}>
                  <ChevronRight size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  <strong>{suggestion.label}</strong>
                </span>
                <span style={{ color: MAP_COLORS.textMuted }}>{suggestion.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Report capture */}
        {report ? (
          <div style={sectionStyle}>
            <div style={sectionTitle}>{MAP_WORKFLOW_STEP_LABELS.report}</div>
            <div style={{ display: "grid", gap: MAP_SPACING.xs, color: MAP_COLORS.textSecondary }}>
              <strong style={{ color: MAP_COLORS.text }}>{report.title}</strong>
              <span style={{ color: MAP_COLORS.textMuted }}>{report.description}</span>
              {onSaveReport ? (
                <button
                  type="button"
                  style={mapStyles.sidePanelActionButton}
                  onClick={handleSaveReport}
                >
                  <Save size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  Save as report item
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {executionActive || executionFailed ? (
        <div
          style={{
            display: "grid",
            gap: MAP_SPACING.xs,
            padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
            borderTop: MAP_STROKES.hairlineSubtle,
          }}
          data-testid="map-workflow-execution"
        >
          {executionActive ? (
            <>
              <div
                role="progressbar"
                aria-label="Workflow execution progress"
                aria-valuenow={workflowExecution?.percent ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                data-testid="map-workflow-progress"
                style={{
                  position: "relative",
                  height: "0.375rem",
                  borderRadius: MAP_RADIUS.full,
                  background: MAP_COLORS.selectedSubtle,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${Math.max(4, Math.min(100, workflowExecution?.percent ?? 0))}%`,
                    background: MAP_COLORS.interaction,
                    transition: "width 120ms linear",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: MAP_SPACING.sm }}>
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  {workflowExecution?.detail ?? workflowExecution?.stage ?? "Processing"}
                </span>
                {onCancelWorkflow ? (
                  <button
                    type="button"
                    style={mapStyles.sidePanelActionButton}
                    onClick={onCancelWorkflow}
                    data-testid="map-workflow-cancel"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div
              style={{ color: MAP_COLORS.error, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}
              role="alert"
              data-testid="map-workflow-error"
            >
              {workflowExecution?.error ?? "Worker geometry execution failed."}
            </div>
          )}
        </div>
      ) : null}

      <div
        style={{
          ...mapStyles.sidePanelHeader,
          justifyContent: "space-between",
          gap: MAP_SPACING.sm,
        }}
      >
        <div
          id={applyStatusId}
          style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}
          role="status"
          aria-live="polite"
        >
          {applyStatusText}
        </div>
        <button
          type="button"
          style={{
            ...mapStyles.sidePanelPrimaryButton,
            opacity: preview.canApply && !executionActive ? 1 : 0.5,
            cursor: preview.canApply && !executionActive ? "pointer" : "not-allowed",
          }}
          onClick={handleApply}
          disabled={!preview.canApply || executionActive}
          aria-describedby={applyStatusId}
          aria-label={preview.canApply ? "Apply spatial workflow" : `Apply spatial workflow blocked: ${applyStatusText}`}
          title={preview.canApply
            ? preview.needsWorker
              ? "Run the workflow in a background worker; the UI stays responsive and you can cancel."
              : "Apply the configured workflow and register provenance, QA, and report metadata."
            : preview.nextRequiredStep
              ? `Missing prerequisite: complete ${MAP_WORKFLOW_STEP_LABELS[preview.nextRequiredStep]}.`
              : "Missing prerequisite: configure the workflow inputs."}
        >
          <Layers size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          {executionActive
            ? "Running…"
            : preview.workflow === "comparison"
              ? "Apply comparison"
              : preview.needsWorker
                ? "Run in worker"
                : "Apply workflow"}
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Stepper, badges                                                    */
/* ================================================================== */

const Stepper: React.FC<{ preview: MapWorkflowPreview }> = ({ preview }) => {
  return (
    <div style={{ ...sectionStyle, paddingTop: MAP_SPACING.sm, paddingBottom: MAP_SPACING.sm }}>
      <div style={sectionTitle}>Workflow steps</div>
      <div style={stepperStyle} role="list" aria-label="Workflow stepper">
        {MAP_WORKFLOW_STEP_ORDER.map((stepId) => {
          const isCurrent = preview.nextRequiredStep === stepId;
          const blockerOnStep = preview.issues.some(
            (issue) => issue.step === stepId && issue.severity === "blocker",
          );
          const completed =
            !isCurrent &&
            !blockerOnStep &&
            (preview.canApply || isStepBeforeCurrent(stepId, preview.nextRequiredStep));
          const style = blockerOnStep
            ? stepPillBlocked
            : isCurrent
              ? stepPillCurrent
              : completed
                ? stepPillCompleted
                : stepPillBase;
          return (
            <span key={stepId} style={style} role="listitem">
              {MAP_WORKFLOW_STEP_LABELS[stepId]}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const PreviewBadge: React.FC<{ preview: MapWorkflowPreview }> = ({ preview }) => {
  const tone = preview.canApply ? MAP_COLORS.success : MAP_COLORS.warning;
  const label = preview.canApply
    ? "Preview ready"
    : preview.nextRequiredStep
      ? `Awaiting ${MAP_WORKFLOW_STEP_LABELS[preview.nextRequiredStep]}`
      : "Awaiting input";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs, color: tone }}>
      {preview.canApply ? (
        <CheckCircle2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      ) : (
        <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
};

const ManifestSummary: React.FC<{ preview: MapWorkflowPreview }> = ({ preview }) => {
  const manifest = preview.manifest;
  return (
    <div style={sectionStyle}>
      <div style={{ ...sectionTitle, display: "flex", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
        <span>Reproducibility manifest</span>
        <span title={manifest.manifestId}>{shortManifestId(manifest.manifestId)}</span>
      </div>
      <div style={metricGrid}>
        <div style={metricCell}>
          <span style={metricLabel}>Status</span>
          <span style={metricValue}>{manifest.status}</span>
        </div>
        <div style={metricCell}>
          <span style={metricLabel}>Sources</span>
          <span style={metricValue}>{manifest.sourceLayerIds.length.toLocaleString()}</span>
        </div>
        <div style={metricCell}>
          <span style={metricLabel}>CRS</span>
          <span style={metricValue}>{manifest.crsSummary.status}</span>
        </div>
        <div style={metricCell}>
          <span style={metricLabel}>QA gate</span>
          <span style={metricValue}>
            {manifest.qaSummary.blockerCount.toLocaleString()} blocker{manifest.qaSummary.blockerCount === 1 ? "" : "s"}
            {" · "}
            {manifest.qaSummary.warningCount.toLocaleString()} warning{manifest.qaSummary.warningCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
        Expected output: {manifest.expectedOutput.layerName ?? "derived layer"} · {manifest.expectedOutput.geometryClass} · {manifest.expectedOutput.featureCount.toLocaleString()} feature{manifest.expectedOutput.featureCount === 1 ? "" : "s"}
      </div>
    </div>
  );
};

function isStepBeforeCurrent(
  stepId: MapWorkflowStepId,
  current: MapWorkflowStepId | null,
): boolean {
  if (!current) return true;
  return MAP_WORKFLOW_STEP_ORDER.indexOf(stepId) < MAP_WORKFLOW_STEP_ORDER.indexOf(current);
}

function shortManifestId(value: string): string {
  return value.length > 22 ? `${value.slice(0, 18)}...` : value;
}

function formatCrsRemedyLabel(remedy: NonNullable<MapWorkflowPreview["issues"][number]["remedy"]>): string {
  switch (remedy) {
    case "declare-crs":
      return "Declare CRS";
    case "reproject":
      return "Reproject";
    case "use-geodesic":
      return "Use geodesic";
    case "none":
      return "No remedy needed";
  }
}

/* ================================================================== */
/*  Workflow-specific editors                                          */
/* ================================================================== */

interface EditorParams {
  draft: MapWorkflowDraft;
  context: MapWorkflowContext;
  updateDraft: (patch: Partial<MapWorkflowDraft>) => void;
}

function renderWorkflowEditor(params: EditorParams): React.ReactNode {
  switch (params.draft.kind) {
    case "aoi":
      return <AOIEditor {...params} draft={params.draft} />;
    case "buffer":
      return <BufferEditor {...params} draft={params.draft} />;
    case "intersect":
      return <IntersectEditor {...params} draft={params.draft} />;
    case "difference":
      return <DifferenceEditor {...params} draft={params.draft} />;
    case "union":
      return <UnionEditor {...params} draft={params.draft} />;
    case "comparison":
      return <ComparisonEditor {...params} draft={params.draft} />;
  }
}

const AOIEditor: React.FC<EditorParams & { draft: MapWorkflowAOIDraft }> = ({ draft, context, updateDraft }) => {
  return (
    <>
      <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
        <span style={labelStyle}>AOI source</span>
        <div style={optionRow}>
          {AOI_SOURCES.map((sourceKind) => {
            const disabledReason = sourceDisabledReason(sourceKind, context);
            const active = draft.source === sourceKind;
            const style = disabledReason
              ? tileButtonDisabled
              : active
                ? tileButtonActive
                : tileButtonBase;
            return (
              <button
                key={sourceKind}
                type="button"
                style={style}
                disabled={Boolean(disabledReason)}
                onClick={() => updateDraft({ source: sourceKind })}
                title={disabledReason ?? undefined}
                aria-pressed={active}
                aria-label={disabledReason
                  ? `${MAP_WORKFLOW_AOI_SOURCE_LABELS[sourceKind]} unavailable: ${disabledReason}`
                  : `Use ${MAP_WORKFLOW_AOI_SOURCE_LABELS[sourceKind]} as AOI source`}
              >
                <strong>{MAP_WORKFLOW_AOI_SOURCE_LABELS[sourceKind]}</strong>
                {disabledReason ? (
                  <span style={{ color: MAP_COLORS.textMuted }}>{disabledReason}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div style={fieldGrid}>
        <Field label="AOI name">
          <input
            type="text"
            style={inputStyle}
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
            aria-label="AOI name"
          />
        </Field>
        <Field label="Edge expansion">
          <input
            type="number"
            style={numberInputStyle}
            value={draft.bufferDistance}
            min={0}
            step={10}
            onChange={(event) => updateDraft({ bufferDistance: Number(event.target.value) })}
            aria-label="AOI edge expansion"
          />
        </Field>
        <Field label="Unit">
          <UnitSelector
            value={draft.bufferUnit}
            onChange={(value) => updateDraft({ bufferUnit: value })}
          />
        </Field>
      </div>
    </>
  );
};

const BufferEditor: React.FC<EditorParams & { draft: MapWorkflowBufferDraft }> = ({
  draft,
  context,
  updateDraft,
}) => {
  const layers = context.layers;
  const sourceMode = draft.sourceMode ?? "layer";
  return (
    <>
      <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
        <span style={labelStyle}>Buffer source</span>
        <div style={optionRow}>
          <button
            type="button"
            style={sourceMode === "layer" ? tileButtonActive : tileButtonBase}
            onClick={() => updateDraft({ sourceMode: "layer" })}
            aria-pressed={sourceMode === "layer"}
          >
            <strong>Whole visible layer</strong>
            <span style={{ color: MAP_COLORS.textMuted }}>Buffer every feature in one source layer.</span>
          </button>
          <button
            type="button"
            style={context.selectedFeatures.length === 0
              ? tileButtonDisabled
              : sourceMode === "selected-features"
                ? tileButtonActive
                : tileButtonBase}
            disabled={context.selectedFeatures.length === 0}
            onClick={() => updateDraft({ sourceMode: "selected-features", sourceLayerId: null })}
            aria-pressed={sourceMode === "selected-features"}
            aria-label={context.selectedFeatures.length === 0
              ? "Selected features buffer source unavailable: select one or more map features."
              : `Use ${context.selectedFeatures.length.toLocaleString()} selected feature(s) as buffer source`}
            title={context.selectedFeatures.length === 0 ? "Select map features before buffering a selection" : undefined}
          >
            <strong>Selected features</strong>
            <span style={{ color: MAP_COLORS.textMuted }}>
              {context.selectedFeatures.length > 0
                ? `${context.selectedFeatures.length.toLocaleString()} selected feature(s)`
                : "Missing prerequisite: select one or more map features."}
            </span>
          </button>
        </div>
      </div>

      <Field label="Source layer">
        <LayerSelector
          value={draft.sourceLayerId}
          layers={layers}
          predicate={(layer) => layer.hasGeometry}
          emptyMessage="Missing prerequisite: add or show a geometry layer before buffering."
          disabled={sourceMode === "selected-features"}
          onChange={(value) => updateDraft({ sourceLayerId: value })}
        />
      </Field>
      <div style={fieldGrid}>
        <Field label="Distance">
          <input
            type="number"
            style={numberInputStyle}
            value={draft.distance}
            min={0}
            step={50}
            onChange={(event) => updateDraft({ distance: Number(event.target.value) })}
            aria-label="Buffer distance"
          />
        </Field>
        <Field label="Unit">
          <UnitSelector
            value={draft.unit}
            onChange={(value) => updateDraft({ unit: value })}
          />
        </Field>
        <Field label="Segments">
          <input
            type="number"
            style={numberInputStyle}
            min={4}
            max={256}
            value={draft.segments}
            onChange={(event) => updateDraft({ segments: Number(event.target.value) })}
            aria-label="Buffer segments"
          />
        </Field>
        <Field label="Dissolve overlapping rings">
          <select
            style={selectStyle}
            value={draft.dissolve ? "yes" : "no"}
            onChange={(event) => updateDraft({ dissolve: event.target.value === "yes" })}
            aria-label="Dissolve buffer rings"
          >
            <option value="no">No (preserve features)</option>
            <option value="yes">Yes (single output)</option>
          </select>
        </Field>
      </div>
      <Field label="Result layer name">
        <input
          type="text"
          style={inputStyle}
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
      </Field>
    </>
  );
};

const IntersectEditor: React.FC<EditorParams & { draft: MapWorkflowIntersectDraft }> = ({
  draft,
  context,
  updateDraft,
}) => {
  const polygonLayers = context.layers.filter(
    (layer) => layer.geometryClass === "polygon" && layer.hasGeometry,
  );
  return (
    <>
      <div style={fieldGrid}>
        <Field label="Layer A">
          <LayerSelector
            value={draft.layerAId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a polygon layer."
            onChange={(value) => updateDraft({ layerAId: value })}
          />
        </Field>
        <Field label="Layer B">
          <LayerSelector
            value={draft.layerBId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a second polygon layer."
            onChange={(value) => updateDraft({ layerBId: value })}
          />
        </Field>
      </div>
      <div style={fieldGrid}>
        <Field label="Attribute strategy">
          <select
            style={selectStyle}
            value={draft.preserveAttributes}
            onChange={(event) =>
              updateDraft({
                preserveAttributes: event.target.value as MapWorkflowIntersectDraft["preserveAttributes"],
              })
            }
            aria-label="Attribute preservation strategy"
          >
            <option value="both">Both (a_*, b_*)</option>
            <option value="a">From A only</option>
            <option value="b">From B only</option>
          </select>
        </Field>
        <Field label="Result layer name">
          <input
            type="text"
            style={inputStyle}
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
        </Field>
      </div>
    </>
  );
};

const DifferenceEditor: React.FC<EditorParams & { draft: MapWorkflowDifferenceDraft }> = ({
  draft,
  context,
  updateDraft,
}) => {
  const polygonLayers = context.layers.filter(
    (layer) => layer.geometryClass === "polygon" && layer.hasGeometry,
  );
  return (
    <>
      <div style={fieldGrid}>
        <Field label="Layer A (minuend)">
          <LayerSelector
            value={draft.minuendLayerId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a polygon layer for Layer A."
            onChange={(value) => updateDraft({ minuendLayerId: value })}
          />
        </Field>
        <Field label="Layer B (subtrahend)">
          <LayerSelector
            value={draft.subtrahendLayerId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a polygon layer for Layer B."
            onChange={(value) => updateDraft({ subtrahendLayerId: value })}
          />
        </Field>
      </div>
      <Field label="Result layer name">
        <input
          type="text"
          style={inputStyle}
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
      </Field>
    </>
  );
};

const UnionEditor: React.FC<EditorParams & { draft: MapWorkflowUnionDraft }> = ({
  draft,
  context,
  updateDraft,
}) => {
  const polygonLayers = context.layers.filter(
    (layer) => layer.geometryClass === "polygon" && layer.hasGeometry,
  );
  return (
    <>
      <div style={fieldGrid}>
        <Field label="Layer A">
          <LayerSelector
            value={draft.layerAId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a polygon layer."
            onChange={(value) => updateDraft({ layerAId: value })}
          />
        </Field>
        <Field label="Layer B">
          <LayerSelector
            value={draft.layerBId}
            layers={polygonLayers}
            emptyMessage="Missing prerequisite: add or show a second polygon layer."
            onChange={(value) => updateDraft({ layerBId: value })}
          />
        </Field>
      </div>
      <div style={fieldGrid}>
        <Field label="Dissolve overlap">
          <select
            style={selectStyle}
            value={draft.dissolve ? "yes" : "no"}
            onChange={(event) => updateDraft({ dissolve: event.target.value === "yes" })}
            aria-label="Dissolve union overlap"
          >
            <option value="yes">Yes (one combined polygon)</option>
            <option value="no">No (keep each feature)</option>
          </select>
        </Field>
        <Field label="Result layer name">
          <input
            type="text"
            style={inputStyle}
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
        </Field>
      </div>
    </>
  );
};

const ComparisonEditor: React.FC<EditorParams & { draft: MapWorkflowComparisonDraft }> = ({
  draft,
  context,
  updateDraft,
}) => {
  const layers = context.layers;
  return (
    <>
      <div style={fieldGrid}>
        <Field label="Layer A">
          <LayerSelector
            value={draft.layerAId}
            layers={layers}
            emptyMessage="Missing prerequisite: add at least one visible layer."
            onChange={(value) => updateDraft({ layerAId: value })}
          />
        </Field>
        <Field label="Layer B">
          <LayerSelector
            value={draft.layerBId}
            layers={layers}
            emptyMessage="Missing prerequisite: add a second visible layer for comparison."
            onChange={(value) => updateDraft({ layerBId: value })}
          />
        </Field>
      </div>
      <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
        <span style={labelStyle}>Comparison view</span>
        <div style={optionRow}>
          {COMPARISON_VIEWS.map((view) => {
            const active = draft.view === view;
            return (
              <button
                key={view}
                type="button"
                style={active ? tileButtonActive : tileButtonBase}
                onClick={() => updateDraft({ view })}
                aria-pressed={active}
              >
                <strong>{MAP_WORKFLOW_COMPARISON_VIEW_LABELS[view]}</strong>
              </button>
            );
          })}
        </div>
      </div>
      {draft.view === "swipe" ? (
        <Field label={`Swipe position (${(draft.swipePosition * 100).toFixed(0)}%)`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={draft.swipePosition}
            onChange={(event) => updateDraft({ swipePosition: Number(event.target.value) })}
            aria-label="Swipe divider position"
          />
        </Field>
      ) : null}
      {draft.view === "blend" ? (
        <div style={fieldGrid}>
          <Field label={`A opacity (${(draft.blendOpacityA * 100).toFixed(0)}%)`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.blendOpacityA}
              onChange={(event) => updateDraft({ blendOpacityA: Number(event.target.value) })}
              aria-label="Layer A blend opacity"
            />
          </Field>
          <Field label={`B opacity (${(draft.blendOpacityB * 100).toFixed(0)}%)`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.blendOpacityB}
              onChange={(event) => updateDraft({ blendOpacityB: Number(event.target.value) })}
              aria-label="Layer B blend opacity"
            />
          </Field>
        </div>
      ) : null}
      <Field label="Comparison name">
        <input
          type="text"
          style={inputStyle}
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
      </Field>
    </>
  );
};

/* ================================================================== */
/*  Atoms                                                              */
/* ================================================================== */

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: "grid", gap: MAP_SPACING.xs }}>
    <span style={labelStyle}>{label}</span>
    {children}
  </label>
);

interface LayerSelectorProps {
  value: string | null;
  layers: ReadonlyArray<{ id: string; name: string; geometryClass: string; sourceKind: string | undefined; visible: boolean; featureCount: number; hasGeometry: boolean }>;
  predicate?: (layer: LayerSelectorProps["layers"][number]) => boolean;
  emptyMessage: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({
  value,
  layers,
  predicate,
  emptyMessage,
  disabled = false,
  onChange,
}) => {
  const filtered = predicate ? layers.filter(predicate) : layers;
  if (filtered.length === 0) {
    return (
      <span
        style={{
          ...inputStyle,
          color: MAP_COLORS.textMuted,
          fontStyle: "italic",
        }}
      >
        {emptyMessage}
      </span>
    );
  }
  return (
    <select
      style={selectStyle}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value || null)}
      aria-label="Layer selector"
    >
      <option value="">— Select a layer —</option>
      {filtered.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.name} · {layer.geometryClass} · {layer.featureCount.toLocaleString()} features
          {layer.visible ? "" : " · hidden"}
          {layer.sourceKind === "demo" ? " · demo" : ""}
        </option>
      ))}
    </select>
  );
};

const UnitSelector: React.FC<{
  value: MapWorkflowDistanceUnit;
  onChange: (value: MapWorkflowDistanceUnit) => void;
}> = ({ value, onChange }) => (
  <select
    style={selectStyle}
    value={value}
    onChange={(event) => onChange(event.target.value as MapWorkflowDistanceUnit)}
    aria-label="Distance unit"
  >
    {DISTANCE_UNITS.map((unit) => (
      <option key={unit} value={unit}>
        {unit} · {MAP_WORKFLOW_DISTANCE_UNIT_LABELS[unit]}
      </option>
    ))}
  </select>
);

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function sourceDisabledReason(
  source: MapWorkflowAOISourceKind,
  context: MapWorkflowContext,
): string | null {
  switch (source) {
    case "viewport":
      return context.viewportBounds ? null : "Missing prerequisite: pan or zoom the map until viewport bounds are available.";
    case "selected-features":
      return context.selectedFeatures.length > 0 ? null : "Missing prerequisite: select one or more map features.";
    case "drawn-polygon":
      return context.drawnPolygons.length > 0 ? null : "Missing prerequisite: draw a polygon AOI on the map.";
    case "geocoded-place":
      return context.geocodedPlace ? null : "Missing prerequisite: search and choose a geocoded place.";
    case "urban-study-area":
      return context.urbanStudyArea ? null : "Missing prerequisite: apply an Urban Analytics study area.";
  }
}

function formatMetricLabel(key: string): string {
  return key.replace(/_/g, " ");
}

function formatMetricValue(value: number | string | null): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)} K`;
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(3);
  }
  return value;
}
