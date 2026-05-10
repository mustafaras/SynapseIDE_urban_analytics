import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  MapCartographyRecommendation,
  MapCartographyReviewState,
} from "@/services/map/MapCartographyAdvisor";
import type { LayerGroupId, LayerQaStatus, LayerScientificQABadge, LayerSourceKind, OverlayLayerConfig } from "./mapTypes";
import { CartographyRecommendationList } from "./CartographyRecommendationList";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import { IconClose, IconEyeClosed, IconEyeOpen } from "./MapIcons";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapLayerManagerProps {
  /** All overlay layers from the store */
  overlayLayers: OverlayLayerConfig[];
  /** Active base layer name for display */
  activeBaseLayerName: string;
  /** Toggles */
  onToggleVisibility: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayers: (orderedIds: string[]) => void;
  onAddLayer: (layer: OverlayLayerConfig) => void;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  onAddLayerToReport?: (id: string) => void;
  activeRerunToken?: string | null;
  onOpenSymbology?: (id: string) => void;
  activeSymbologyLayerId?: string | null;
  cartographyReviewState?: MapCartographyReviewState | null;
  onApplyCartographyRecommendation?: (recommendationId: string) => void;
  onDismissCartographyRecommendation?: (recommendationId: string) => void;
  onUndoCartographyRecommendation?: () => void;
  canUndoCartographyRecommendation?: boolean;
  onShowCartographyDetails?: (recommendation: MapCartographyRecommendation) => void;
  onRequestClose?: () => void;
  panelStyle?: React.CSSProperties;
  /** Screen reader announcement */
  onAnnounce?: (msg: string) => void;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const POPOVER_ESTIMATED_HEIGHT = 260;

const GROUP_ORDER: LayerGroupId[] = ["data", "voxcity", "analysis"];
const GROUP_LABELS: Record<LayerGroupId, string> = {
  base: "Base Layers",
  data: "Data Layers",
  voxcity: "VoxCity",
  analysis: "Analysis Results",
};
const SOURCE_KIND_LABELS: Record<LayerSourceKind, string> = {
  project: "Project",
  imported: "Imported",
  external: "External",
  derived: "Derived",
  demo: "Demo",
};

const QA_STATUS_LABELS: Record<LayerQaStatus, string> = {
  unchecked: "QA unchecked",
  passed: "QA passed",
  warning: "QA warning",
  error: "QA error",
};

const SCIENTIFIC_QA_BADGE_LABELS: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Invalid geometry",
  missing_crs: "Missing CRS",
  sample_data: "Sample data",
  stale_result: "Stale result",
  uncertain_output: "Uncertain output",
};

const SCIENTIFIC_QA_BADGE_TITLES: Record<LayerScientificQABadge, string> = {
  invalid_geometry: "Scientific QA found invalid feature geometry.",
  missing_crs: "Projection metadata is missing or unknown.",
  sample_data: "Layer is demo or teaching data.",
  stale_result: "Layer is stale relative to its source data.",
  uncertain_output: "Layer output has scientific caveats.",
};

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const panelContainer: React.CSSProperties = {
  ...mapStyles.sidePanelSurface,
  left: 0,
  width: "100%",
  borderRight: MAP_STROKES.hairlineSubtle,
  overflow: "visible",
};

const panelCollapsed: React.CSSProperties = {
  ...panelContainer,
  width: "2.5rem",
  overflow: "hidden",
};

const toggleBtn: React.CSSProperties = {
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
  color: MAP_COLORS.amber,
  cursor: "pointer",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.xs}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  transition: MAP_TRANSITIONS.fast,
};

const panelHeader: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
};

const panelTitle: React.CSSProperties = {
  ...mapStyles.sidePanelTitle,
};

const panelCloseBtn: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
};

const searchInputStyle: React.CSSProperties = {
  ...mapStyles.sidePanelSearchInput,
};

const groupHeader: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase" as const,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.xs}`,
  marginTop: 0,
};

const layerRow: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.5rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  fontSize: 12,
  cursor: "grab",
};

const layerRowDragging: React.CSSProperties = {
  ...layerRow,
  opacity: 0.5,
  background: MAP_COLORS.amberDim,
};

const visibilityBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  padding: 2,
  lineHeight: 1,
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const layerContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "grid",
  gap: 5,
};

const layerNameButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  textAlign: "left",
  padding: 0,
  cursor: "pointer",
  minWidth: 0,
};

const layerName: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  cursor: "pointer",
};

const layerTextBlock: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const layerNameLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const analysisMetaText: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const analysisSummaryText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const layerMetaRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
};

const layerMetaText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const layerControlRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
};

const staleChip: React.CSSProperties = {
  padding: "2px 5px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const columnarChip: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid rgba(56, 189, 248, 0.45)`,
  background: "rgba(8, 47, 73, 0.55)",
  color: "#7DD3FC",
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const scientificQaChip: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(255,255,255,0.025)",
  color: MAP_COLORS.textSecondary,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  flexShrink: 0,
  maxWidth: "9rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const scientificQaChipError: React.CSSProperties = {
  border: `1px solid ${MAP_COLORS.error}`,
  color: MAP_COLORS.error,
  background: "rgba(248, 113, 113, 0.1)",
};

const scientificQaChipWarning: React.CSSProperties = {
  border: `1px solid ${MAP_COLORS.warning}`,
  color: MAP_COLORS.warning,
  background: "rgba(251, 191, 36, 0.1)",
};

const opacitySlider: React.CSSProperties = {
  width: "100%",
  minWidth: 72,
  height: 4,
  accentColor: MAP_COLORS.amber,
  cursor: "pointer",
  flex: 1,
  margin: 0,
};

const removeBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  background: "transparent",
  border: `1px solid color-mix(in srgb, ${MAP_COLORS.error} 44%, transparent)`,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.error,
  cursor: "pointer",
  fontSize: 11,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  lineHeight: 1.2,
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const symbologyBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  padding: "2px 6px",
  lineHeight: 1.2,
  borderRadius: MAP_RADIUS.sm,
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
};

const cartographyBtn: React.CSSProperties = {
  ...symbologyBtn,
  border: "1px solid rgba(56, 189, 248, 0.42)",
  color: "#7DD3FC",
};

const cartographyReviewStrip: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const cartographyReviewTopLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const cartographyReviewTitle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const cartographyReviewMeta: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const cartographyReviewActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexWrap: "wrap",
};

const addLayerBtn: React.CSSProperties = {
  margin: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  ...mapStyles.sidePanelPrimaryButton,
  textAlign: "center" as const,
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  left: `calc(var(--map-layer-panel-width, ${MAP_DIMENSIONS.layerPanelWidth}) + ${MAP_SPACING.sm})`,
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  padding: MAP_SPACING.md,
  zIndex: MAP_Z_INDEX.dropdown,
  width: 300,
  maxHeight: "calc(100% - 16px)",
  overflowY: "auto",
  boxSizing: "border-box",
  fontSize: 11,
  color: MAP_COLORS.text,
};

const dialogOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: MAP_Z_INDEX.dropdown + 1,
};

const dialogStyle: React.CSSProperties = {
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  padding: MAP_SPACING.lg,
  width: 340,
  maxWidth: "90%",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: `6px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontSize: 12,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  marginBottom: 8,
  outline: "none",
  boxSizing: "border-box" as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const fieldLabel: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  marginBottom: 4,
  display: "block",
};

const dialogBtnRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 12,
};

const dialogBtn: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  transition: MAP_TRANSITIONS.fast,
};

const dialogBtnPrimary: React.CSSProperties = {
  ...dialogBtn,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
};

const emptyGroupMsg: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  padding: `4px ${MAP_SPACING.md}`,
  fontStyle: "italic",
};

const analysisSectionTitle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 6,
  color: MAP_COLORS.amber,
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const analysisStatList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 8,
};

const analysisStatRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "baseline",
};

const analysisLegendRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "12px minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
};

const rerunBtn: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "6px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  transition: MAP_TRANSITIONS.fast,
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function resolveLayerSourceKind(layer: OverlayLayerConfig): LayerSourceKind {
  if (layer.sourceKind) return layer.sourceKind;
  if ((layer.group ?? "data") === "analysis" || layer.metadata?.analysisResult) return "derived";
  if (layer.metadata?.datasetContext?.datasetId || layer.metadata?.eoSource?.isDemo) return "demo";
  if (layer.metadata?.eoSource || (typeof layer.sourceData === "string" && /^https?:\/\//i.test(layer.sourceData))) return "external";
  if (layer.sourceData) return "imported";
  return "project";
}

function resolveLayerQaStatus(layer: OverlayLayerConfig): LayerQaStatus {
  if (layer.qaStatus) return layer.qaStatus;
  return layer.metadata?.analysisResult?.stale ? "warning" : "unchecked";
}

function isLayerQueryable(layer: OverlayLayerConfig): boolean {
  if (layer.queryable !== undefined) return layer.queryable;
  return layer.type === "geojson" || layer.type === "heatmap";
}

function resolveLayerCrs(layer: OverlayLayerConfig): string {
  return layer.metadata?.datasetContext?.crs
    ?? layer.metadata?.columnar?.crs
    ?? layer.metadata?.eoSource?.crs
    ?? "EPSG:4326";
}

function resolveLayerProvenanceLabel(layer: OverlayLayerConfig): string {
  const analysis = layer.metadata?.analysisResult;
  return layer.provenance?.label
    ?? analysis?.parameterSummary
    ?? layer.metadata?.datasetContext?.source
    ?? layer.metadata?.eoSource?.provider
    ?? (typeof layer.sourceData === "string" ? layer.sourceData : "No provenance recorded");
}

function formatBounds(bounds: [number, number, number, number]): string {
  return `[${bounds.map((b) => b.toFixed(4)).join(", ")}]`;
}

function formatAnalysisTimestamp(timestamp?: string): string {
  if (!timestamp) return "unknown time";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSummaryValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: Math.abs(value) < 10 ? 0 : 2,
    });
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value == null) {
    return "null";
  }
  return String(value);
}

function formatBytes(value?: number): string {
  if (!value || !Number.isFinite(value)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatColumnarLabel(format: "arrow" | "geoparquet"): string {
  return format === "geoparquet" ? "GeoParquet" : "Arrow";
}

function formatImportSourceLabel(format?: NonNullable<OverlayLayerConfig["metadata"]>["importFormat"]): string | null {
  switch (format) {
    case "geojson":
      return "GeoJSON";
    case "csv":
      return "CSV";
    case "arrow":
      return "Arrow";
    case "geoparquet":
      return "GeoParquet";
    case "kml":
      return "KML";
    case "kmz":
      return "KMZ";
    case "gpx":
      return "GPX";
    default:
      return null;
  }
}

function scientificQaBadgeStyle(badge: LayerScientificQABadge): React.CSSProperties {
  if (badge === "invalid_geometry" || badge === "missing_crs") {
    return { ...scientificQaChip, ...scientificQaChipError };
  }
  if (badge === "sample_data" || badge === "stale_result" || badge === "uncertain_output") {
    return { ...scientificQaChip, ...scientificQaChipWarning };
  }
  return scientificQaChip;
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

/* ---- Metadata Popover ---- */

interface MetadataPopoverProps {
  layer: OverlayLayerConfig;
  topOffset: number;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  onAddLayerToReport?: (id: string) => void;
  activeRerunToken?: string | null;
}

const MetadataPopover: React.FC<MetadataPopoverProps> = ({
  layer,
  topOffset,
  onReRunAnalysisLayer,
  onAddLayerToReport,
  activeRerunToken,
}) => {
  const meta = layer.metadata;
  const analysisResult = meta?.analysisResult;
  const datasetContext = meta?.datasetContext;
  const columnar = meta?.columnar;
  const sourceKind = resolveLayerSourceKind(layer);
  const qaStatus = resolveLayerQaStatus(layer);
  const scientificQA = meta?.scientificQA;
  const cartographyReview = meta?.cartographyReview;
  const queryable = isLayerQueryable(layer);
  const crs = resolveLayerCrs(layer);
  const provenanceLabel = resolveLayerProvenanceLabel(layer);
  const isRerunning = Boolean(
    analysisResult?.rerunToken && activeRerunToken === analysisResult.rerunToken,
  );

  return (
    <div
      style={{
        ...popoverStyle,
        top: `clamp(8px, ${topOffset}px, calc(100% - ${POPOVER_ESTIMATED_HEIGHT + 8}px))`,
      }}
      role="tooltip"
      aria-label={`Metadata for ${layer.name}`}
    >
      <div style={{ fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, color: MAP_COLORS.amber, marginBottom: 8 }}>
        {layer.name}
      </div>
      {onAddLayerToReport ? (
        <button
          type="button"
          style={{ ...rerunBtn, marginBottom: 10 }}
          onClick={() => onAddLayerToReport(layer.id)}
        >
          Add to report
        </button>
      ) : null}
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Type: </span>
        <span>{layer.type}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Source Kind: </span>
        <span>{SOURCE_KIND_LABELS[sourceKind]}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Provenance: </span>
        <span title={provenanceLabel}>{provenanceLabel}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Queryable: </span>
        <span>{queryable ? "Yes" : "No"}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
        <span>{crs}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>QA Status: </span>
        <span>{QA_STATUS_LABELS[qaStatus]}</span>
      </div>
      {scientificQA ? (
        <div>
          <div style={analysisSectionTitle}>Scientific QA</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Checked: </span>
            <span>{formatAnalysisTimestamp(scientificQA.checkedAt)}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Feature Issues: </span>
            <span>{scientificQA.featureIssueCount.toLocaleString()}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Worker: </span>
            <span>{scientificQA.usedWorker ? "Used for geometry validation" : "Inline validation"}</span>
          </div>
          {scientificQA.badges.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {scientificQA.badges.map((badge) => (
                <span key={badge} style={scientificQaBadgeStyle(badge)} title={SCIENTIFIC_QA_BADGE_TITLES[badge]}>
                  {SCIENTIFIC_QA_BADGE_LABELS[badge]}
                </span>
              ))}
            </div>
          ) : null}
          {scientificQA.caveats.length > 0 ? (
            <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
              {scientificQA.caveats.slice(0, 3).map((caveat) => (
                <div key={caveat} style={{ color: MAP_COLORS.textSecondary, lineHeight: 1.35 }}>
                  {caveat}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {cartographyReview ? (
        <div>
          <div style={analysisSectionTitle}>Cartography Review</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Status: </span>
            <span>{cartographyReview.status}</span>
          </div>
          {cartographyReview.reviewedAt ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Reviewed: </span>
              <span>{formatAnalysisTimestamp(cartographyReview.reviewedAt)}</span>
            </div>
          ) : null}
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Applied: </span>
            <span>{cartographyReview.appliedRecommendationIds.length.toLocaleString()} recommendation(s)</span>
          </div>
          {cartographyReview.lastAppliedTitle ? (
            <div style={{ color: MAP_COLORS.textSecondary, lineHeight: 1.35 }}>
              {cartographyReview.lastAppliedTitle}
            </div>
          ) : null}
        </div>
      ) : null}
      {meta?.geometryType ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Geometry: </span>
          <span>{meta.geometryType}</span>
        </div>
      ) : null}
      {meta?.featureCount != null ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Features: </span>
          <span>{meta.featureCount.toLocaleString()}</span>
        </div>
      ) : null}
      {columnar ? (
        <div>
          <div style={analysisSectionTitle}>Columnar Runtime</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Format: </span>
            <span>{formatColumnarLabel(columnar.format)}</span>
          </div>
          {columnar.geometryColumn ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Geometry Column: </span>
              <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{columnar.geometryColumn}</span>
            </div>
          ) : null}
          {columnar.geometryEncoding ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Encoding: </span>
              <span>{columnar.geometryEncoding}</span>
            </div>
          ) : null}
          {columnar.rowCount != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Rows: </span>
              <span>{columnar.rowCount.toLocaleString()}</span>
            </div>
          ) : null}
          {columnar.estimatedMemoryBytes != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Memory: </span>
              <span>{formatBytes(columnar.estimatedMemoryBytes)}</span>
            </div>
          ) : null}
          {columnar.transferSizeBytes != null ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Worker Transfer: </span>
              <span>{formatBytes(columnar.transferSizeBytes)}</span>
            </div>
          ) : null}
          {columnar.crs ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
              <span>{columnar.crs}</span>
            </div>
          ) : null}
          {columnar.geometryTypes && columnar.geometryTypes.length > 0 ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Geometry Types: </span>
              <span>{columnar.geometryTypes.join(", ")}</span>
            </div>
          ) : null}
          {columnar.workerTableName ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Worker Table: </span>
              <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>{columnar.workerTableName}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {meta?.bounds ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MAP_COLORS.textMuted }}>Extent: </span>
          <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>
            {formatBounds(meta.bounds)}
          </span>
        </div>
      ) : null}
      {meta?.fields && meta.fields.length > 0 ? (
        <div>
          <span style={{ color: MAP_COLORS.textMuted }}>Fields: </span>
          <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10 }}>
            {meta.fields.join(", ")}
          </span>
        </div>
      ) : null}
      {datasetContext ? (
        <div>
          <div style={analysisSectionTitle}>Teaching Dataset</div>
          {datasetContext.datasetTitle ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Package: </span>
              <span>{datasetContext.datasetTitle}</span>
            </div>
          ) : null}
          {datasetContext.source ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Source: </span>
              <span>{datasetContext.source}</span>
            </div>
          ) : null}
          {datasetContext.license ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>License: </span>
              <span>{datasetContext.license}</span>
            </div>
          ) : null}
          {datasetContext.crs ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>CRS: </span>
              <span>{datasetContext.crs}</span>
            </div>
          ) : null}
          {datasetContext.spatialExtent ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Window: </span>
              <span>{datasetContext.spatialExtent}</span>
            </div>
          ) : null}
          {datasetContext.thematicCoverage && datasetContext.thematicCoverage.length > 0 ? (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Themes: </span>
              <span>{datasetContext.thematicCoverage.join(", ")}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {analysisResult ? (
        <div>
          <div style={analysisSectionTitle}>Analysis Result</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Engine: </span>
            <span>{analysisResult.engine}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Run Time: </span>
            <span>{formatAnalysisTimestamp(analysisResult.runTimestamp)}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Status: </span>
            <span>{analysisResult.stale ? "Stale" : "Fresh"}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: MAP_COLORS.textMuted }}>Parameters: </span>
            <span title={analysisResult.parameterSummary}>{analysisResult.parameterSummary}</span>
          </div>
          {Object.keys(analysisResult.statisticalSummary).length > 0 ? (
            <div style={analysisStatList}>
              {Object.entries(analysisResult.statisticalSummary).map(([key, value]) => (
                <div key={key} style={analysisStatRow}>
                  <span style={{ color: MAP_COLORS.textMuted }}>{key}</span>
                  <span style={{ textAlign: "right" }}>{formatSummaryValue(value)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {analysisResult.visualization.legendEntries && analysisResult.visualization.legendEntries.length > 0 ? (
            <div>
              <div style={analysisSectionTitle}>Legend</div>
              <div style={analysisStatList}>
                {analysisResult.visualization.legendEntries.map((entry) => (
                  <div key={`${entry.value}`} style={analysisLegendRow}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: entry.color ?? MAP_COLORS.textMuted,
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />
                    <span style={{ minWidth: 0 }}>{entry.label}</span>
                    <span style={{ textAlign: "right", color: MAP_COLORS.textMuted }}>
                      {entry.count != null ? formatSummaryValue(entry.count) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {onReRunAnalysisLayer ? (
            <button
              type="button"
              style={{ ...rerunBtn, cursor: analysisResult.rerunToken ? (isRerunning ? "progress" : "pointer") : "not-allowed", opacity: analysisResult.rerunToken ? 1 : 0.5 }}
              onClick={() => onReRunAnalysisLayer(layer.id, analysisResult.rerunToken)}
              disabled={!analysisResult.rerunToken || isRerunning}
              title={analysisResult.rerunToken ? "Re-run this analysis with the recorded method and source layer." : "Missing prerequisite: this analysis result has no rerun token."}
            >
              {isRerunning ? "Re-running..." : "Re-run"}
            </button>
          ) : null}
        </div>
      ) : null}
      {!meta && (
        <div style={{ color: MAP_COLORS.textMuted, fontStyle: "italic" }}>
          Metadata unavailable: this layer has no provenance, schema, or analysis metadata attached.
        </div>
      )}
    </div>
  );
};

/* ---- Add Layer Dialog ---- */

interface AddLayerDialogProps {
  onAdd: (layer: OverlayLayerConfig) => void;
  onClose: () => void;
}

const AddLayerDialog: React.FC<AddLayerDialogProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<OverlayLayerConfig["type"]>("geojson");
  const [sourceKind, setSourceKind] = useState<LayerSourceKind>("imported");
  const [url, setUrl] = useState("");
  const requiresUrl = type === "raster-tile" || type === "vector-tile";
  const canSubmit = Boolean(name.trim()) && (!requiresUrl || Boolean(url.trim()));

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const nextUrl = url.trim();
    const nextName = name.trim();
    const isGeoJsonBacked = type === "geojson" || type === "heatmap";
    const sourceData = nextUrl
      ? nextUrl
      : ({ type: "FeatureCollection", features: [] } satisfies GeoJSON.FeatureCollection);
    const layer: OverlayLayerConfig = {
      id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: nextName,
      type,
      visible: true,
      opacity: 1,
      group: "data",
      sourceData,
      sourceKind,
      qaStatus: "unchecked",
      queryable: isGeoJsonBacked,
      provenance: nextUrl
        ? { label: nextUrl, sourceUrl: nextUrl }
        : { label: `${SOURCE_KIND_LABELS[sourceKind]} layer` },
      ...(isGeoJsonBacked
        ? {
            metadata: {
              featureCount: 0,
              geometryType: "Unknown",
            },
          }
        : {}),
    };
    onAdd(layer);
    onClose();
  }, [canSubmit, name, onAdd, onClose, sourceKind, type, url]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click to dismiss
    <div style={dialogOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Add layer">
        <div style={{ ...panelTitle, marginBottom: 12 }}>Add Layer</div>

        <label style={fieldLabel}>
          Layer Name
          <input
            style={inputStyle}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Layer"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog focus is intentional UX
            autoFocus
          />
        </label>

        <label style={fieldLabel}>
          Layer Type
          <select
            style={selectStyle}
            value={type}
            onChange={(e) => setType(e.target.value as OverlayLayerConfig["type"])}
          >
            <option value="geojson">GeoJSON</option>
            <option value="heatmap">Heatmap</option>
            <option value="raster-tile">Raster Tile (XYZ)</option>
            <option value="vector-tile">Vector Tile</option>
          </select>
        </label>

        <label style={fieldLabel}>
          Source Kind
          <select
            style={selectStyle}
            value={sourceKind}
            onChange={(e) => setSourceKind(e.target.value as LayerSourceKind)}
          >
            {(Object.keys(SOURCE_KIND_LABELS) as LayerSourceKind[]).map((kind) => (
              <option key={kind} value={kind}>{SOURCE_KIND_LABELS[kind]}</option>
            ))}
          </select>
        </label>

        <label style={fieldLabel}>
          Source URL {requiresUrl ? "(required)" : "(optional)"}
          <input
            style={inputStyle}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/data.geojson"
          />
        </label>

        <div style={dialogBtnRow}>
          <button type="button" style={dialogBtn} onClick={onClose}>Cancel</button>
          <button
            type="button"
            style={dialogBtnPrimary}
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Add layer"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Layer Row                                                          */
/* ================================================================== */

interface LayerRowProps {
  layer: OverlayLayerConfig;
  onToggleVisibility: (id: string) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onRemove: (id: string) => void;
  onNameClick: (id: string, top: number) => void;
  onOpenSymbology?: (id: string) => void;
  isSymbologyActive?: boolean;
  cartographyRecommendationCount?: number;
  onReviewCartography?: (id: string) => void;
  /** Drag and drop */
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  onToggleVisibility,
  onSetOpacity,
  onRemove,
  onNameClick,
  onOpenSymbology,
  isSymbologyActive = false,
  cartographyRecommendationCount = 0,
  onReviewCartography,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const analysisResult = layer.metadata?.analysisResult;
  const columnar = layer.metadata?.columnar;
  const scientificQA = layer.metadata?.scientificQA;
  const sourceKind = resolveLayerSourceKind(layer);
  const qaStatus = resolveLayerQaStatus(layer);
  const queryable = isLayerQueryable(layer);
  const crs = resolveLayerCrs(layer);
  const featureCount = layer.metadata?.featureCount;
  const importFormat = formatImportSourceLabel(layer.metadata?.importFormat);
  const detailSummary = [
    SOURCE_KIND_LABELS[sourceKind],
    importFormat,
    qaStatus === "unchecked" ? null : QA_STATUS_LABELS[qaStatus],
    scientificQA?.featureIssueCount ? `${scientificQA.featureIssueCount.toLocaleString()} QA feature issue(s)` : null,
    queryable ? "queryable" : null,
    featureCount != null ? `${featureCount.toLocaleString()} features` : null,
    crs,
  ].filter(Boolean).join(" / ");

  const handleNameClick = useCallback(() => {
    const top = rowRef.current?.offsetTop ?? 0;
    onNameClick(layer.id, top);
  }, [layer.id, onNameClick]);

  return (
    <div
      ref={rowRef}
      style={isDragging ? layerRowDragging : layerRow}
      draggable
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, layer.id)}
      onDragEnd={onDragEnd}
      role="option"
      aria-selected={false}
      aria-label={`Layer: ${layer.name}`}
      tabIndex={0}
    >
      {/* Visibility toggle */}
      <button
        type="button"
        style={visibilityBtn}
        onClick={() => onToggleVisibility(layer.id)}
        aria-label={`${layer.visible ? "Hide" : "Show"} layer ${layer.name}`}
        aria-pressed={layer.visible}
      >
        <span style={{ color: layer.visible ? MAP_COLORS.amber : MAP_COLORS.textMuted, display: "inline-flex", alignItems: "center" }}>
          {layer.visible ? <IconEyeOpen size={13} /> : <IconEyeClosed size={13} />}
        </span>
      </button>

      <div style={layerContent}>
        <div style={layerNameLine}>
          <button
            type="button"
            style={layerNameButton}
            onClick={handleNameClick}
            title="Show layer details"
            aria-label={`Show metadata for ${layer.name}`}
          >
            <span style={layerName}>{layer.name}</span>
          </button>
          {analysisResult?.stale ? (
            <span style={staleChip} title="Source data changed after this analysis result was computed">
              Stale
            </span>
          ) : null}
          {columnar ? (
            <span
              style={columnarChip}
              title={`${formatColumnarLabel(columnar.format)} dataset${columnar.geometryColumn ? ` / ${columnar.geometryColumn}` : ""}`}
            >
              {formatColumnarLabel(columnar.format)}
            </span>
          ) : null}
          {scientificQA?.badges
            .filter((badge) => badge !== "stale_result" || !analysisResult?.stale)
            .map((badge) => (
              <span key={badge} style={scientificQaBadgeStyle(badge)} title={SCIENTIFIC_QA_BADGE_TITLES[badge]}>
                {SCIENTIFIC_QA_BADGE_LABELS[badge]}
              </span>
            ))}
        </div>

        {analysisResult ? (
          <div style={layerTextBlock}>
            <span style={analysisMetaText} title={`${analysisResult.engine} at ${formatAnalysisTimestamp(analysisResult.runTimestamp)}`}>
              {analysisResult.engine} • {formatAnalysisTimestamp(analysisResult.runTimestamp)}
            </span>
            <span style={analysisSummaryText} title={analysisResult.parameterSummary}>
              {analysisResult.parameterSummary}
            </span>
          </div>
        ) : null}

        <div style={layerMetaRow} aria-label={`Layer metadata for ${layer.name}`}>
          <span style={layerMetaText} title={detailSummary}>{detailSummary}</span>
        </div>

        <div style={layerControlRow}>
          {onOpenSymbology ? (
            <button
              type="button"
              style={{
                ...symbologyBtn,
                color: isSymbologyActive ? MAP_COLORS.amber : MAP_COLORS.textSecondary,
                border: `1px solid ${isSymbologyActive ? MAP_COLORS.amberBorderStrong : MAP_COLORS.amberBorder}`,
                background: isSymbologyActive ? MAP_COLORS.amberDim : "transparent",
              }}
              onClick={(event) => {
                event.stopPropagation();
                onOpenSymbology(layer.id);
              }}
              aria-label={`Open symbology panel for ${layer.name}`}
              title="Symbology"
            >
              Style
            </button>
          ) : null}

          {onReviewCartography ? (
            <button
              type="button"
              style={{
                ...cartographyBtn,
                border: `1px solid ${cartographyRecommendationCount > 0 ? MAP_COLORS.warning : "rgba(56, 189, 248, 0.42)"}`,
                color: cartographyRecommendationCount > 0 ? MAP_COLORS.warning : "#7DD3FC",
                background: cartographyRecommendationCount > 0 ? "rgba(251, 191, 36, 0.1)" : "transparent",
              }}
              onClick={(event) => {
                event.stopPropagation();
                onReviewCartography(layer.id);
              }}
              aria-label={`Review symbology for ${layer.name}`}
              title="Review symbology"
            >
              Review{cartographyRecommendationCount > 0 ? ` ${cartographyRecommendationCount}` : ""}
            </button>
          ) : null}

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.opacity}
            onChange={(e) => onSetOpacity(layer.id, parseFloat(e.target.value))}
            style={opacitySlider}
            aria-label={`Opacity for ${layer.name}: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        style={removeBtn}
        onClick={() => onRemove(layer.id)}
        aria-label={`Remove layer ${layer.name}`}
        title="Remove layer"
      >
        <IconClose size={11} />
        Delete
      </button>
    </div>
  );
};

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export const MapLayerManager: React.FC<MapLayerManagerProps> = ({
  overlayLayers,
  onToggleVisibility,
  onSetOpacity,
  onRemoveLayer,
  onReorderLayers,
  onAddLayer,
  onReRunAnalysisLayer,
  onAddLayerToReport,
  activeRerunToken = null,
  onOpenSymbology,
  activeSymbologyLayerId = null,
  cartographyReviewState = null,
  onApplyCartographyRecommendation,
  onDismissCartographyRecommendation,
  onUndoCartographyRecommendation,
  canUndoCartographyRecommendation = false,
  onShowCartographyDetails,
  onRequestClose,
  panelStyle,
  onAnnounce,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [popoverLayerId, setPopoverLayerId] = useState<string | null>(null);
  const [popoverTop, setPopoverTop] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartographyPanelOpen, setCartographyPanelOpen] = useState(false);
  const [cartographyLayerFilterId, setCartographyLayerFilterId] = useState<string | null>(null);
  const hasSearch = query.trim().length > 0;

  const filteredOverlayLayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return overlayLayers.filter((layer) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        layer.name,
        layer.type,
        resolveLayerSourceKind(layer),
        SOURCE_KIND_LABELS[resolveLayerSourceKind(layer)],
        resolveLayerQaStatus(layer),
        QA_STATUS_LABELS[resolveLayerQaStatus(layer)],
        resolveLayerCrs(layer),
        resolveLayerProvenanceLabel(layer),
        isLayerQueryable(layer) ? "queryable" : "not queryable",
        layer.metadata?.geometryType,
        formatImportSourceLabel(layer.metadata?.importFormat),
        layer.metadata?.columnar?.format,
        layer.metadata?.columnar?.geometryColumn,
        layer.metadata?.columnar?.workerTableName,
        layer.metadata?.columnar?.crs,
        layer.metadata?.analysisResult?.engine,
        layer.metadata?.analysisResult?.parameterSummary,
        layer.metadata?.datasetContext?.datasetTitle,
        layer.metadata?.datasetContext?.datasetCity,
        layer.metadata?.datasetContext?.layerTitle,
        layer.metadata?.scientificQA?.status,
        ...(layer.metadata?.datasetContext?.thematicCoverage ?? []),
        ...(layer.metadata?.columnar?.geometryTypes ?? []),
        ...(layer.metadata?.scientificQA?.badges.map((badge) => SCIENTIFIC_QA_BADGE_LABELS[badge]) ?? []),
        ...(layer.metadata?.scientificQA?.caveats ?? []),
        ...(layer.metadata?.fields ?? []),
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [overlayLayers, query]);

  const layerSummary = useMemo(() => ({
    total: overlayLayers.length,
    visible: overlayLayers.filter((layer) => layer.visible).length,
    data: overlayLayers.filter((layer) => (layer.group ?? "data") === "data").length,
    analysis: overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length,
  }), [overlayLayers]);

  const cartographyRecommendations = cartographyReviewState?.recommendations ?? [];
  const cartographyRecommendationCountByLayer = useMemo(() => {
    const counts = new Map<string, number>();
    cartographyRecommendations.forEach((recommendation) => {
      counts.set(recommendation.layerId, (counts.get(recommendation.layerId) ?? 0) + 1);
    });
    return counts;
  }, [cartographyRecommendations]);

  const scopedCartographyRecommendations = useMemo(() => {
    if (!cartographyLayerFilterId) return cartographyRecommendations;
    return cartographyRecommendations.filter((recommendation) => recommendation.layerId === cartographyLayerFilterId);
  }, [cartographyLayerFilterId, cartographyRecommendations]);

  const cartographyLayerFilterName = cartographyLayerFilterId
    ? overlayLayers.find((layer) => layer.id === cartographyLayerFilterId)?.name ?? "Selected layer"
    : "Visible map";

  /* Group layers */
  const grouped = useMemo(() => {
    const groups: Record<LayerGroupId, OverlayLayerConfig[]> = {
      base: [],
      data: [],
      voxcity: [],
      analysis: [],
    };
    for (const layer of filteredOverlayLayers) {
      const g = layer.group ?? "data";
      groups[g].push(layer);
    }
    return groups;
  }, [filteredOverlayLayers]);

  /* ---- Drag and drop ---- */
  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    const ids = overlayLayers.map((l) => l.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId);
    onReorderLayers(reordered);
    onAnnounce?.("Layer order updated");
    setDragId(null);
  }, [dragId, overlayLayers, onReorderLayers, onAnnounce]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
  }, []);

  /* ---- Popover ---- */
  const handleNameClick = useCallback((id: string, top: number) => {
    setPopoverLayerId((prev) => (prev === id ? null : id));
    setPopoverTop(top);
  }, []);

  /* ---- Add layer ---- */
  const handleAddLayer = useCallback((layer: OverlayLayerConfig) => {
    onAddLayer(layer);
    onAnnounce?.(`Layer "${layer.name}" added`);
  }, [onAddLayer, onAnnounce]);

  /* ---- Toggle visibility with announcement ---- */
  const handleToggle = useCallback((id: string) => {
    const layer = overlayLayers.find((l) => l.id === id);
    onToggleVisibility(id);
    if (layer) {
      onAnnounce?.(`Layer "${layer.name}" ${layer.visible ? "hidden" : "shown"}`);
    }
  }, [onToggleVisibility, overlayLayers, onAnnounce]);

  const handleOpenCartographyReview = useCallback((layerId: string | null) => {
    setCartographyLayerFilterId(layerId);
    setCartographyPanelOpen(true);
    const layerName = layerId
      ? overlayLayers.find((layer) => layer.id === layerId)?.name ?? "selected layer"
      : "visible map";
    onAnnounce?.(`Symbology review opened for ${layerName}`);
  }, [onAnnounce, overlayLayers]);

  /* ---- Remove with announcement ---- */
  const handleRemove = useCallback((id: string) => {
    const layer = overlayLayers.find((l) => l.id === id);
    onRemoveLayer(id);
    setPopoverLayerId(null);
    onAnnounce?.(`Layer "${layer?.name ?? id}" removed`);
  }, [onRemoveLayer, overlayLayers, onAnnounce]);

  /* ---- Popover layer data ---- */
  const popoverLayer = popoverLayerId
    ? overlayLayers.find((l) => l.id === popoverLayerId) ?? null
    : null;

  /* ---- Collapsed state ---- */
  if (collapsed) {
    return (
      <div style={panelCollapsed} role="region" aria-label="Layer panel (collapsed)">
        <button
          type="button"
          style={toggleBtn}
          onClick={() => setCollapsed(false)}
          aria-label="Expand layer panel"
          title="Expand layer panel"
        >
          ▶
        </button>
      </div>
    );
  }

  const handleClosePanel = () => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    setCollapsed(true);
  };

  return (
    <div style={{ ...panelContainer, ...panelStyle }} role="region" aria-label="Layer management panel">
      {/* Panel header */}
      <div style={panelHeader}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Layer stack</span>
          <span style={panelTitle}>Layers</span>
        </div>
        <button
          type="button"
          style={panelCloseBtn}
          onClick={handleClosePanel}
          aria-label="Close layer panel"
          title="Close layer panel"
        >
          <IconClose size={11} />
          Close
        </button>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Layer stack summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Visible</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.visible}/{layerSummary.total} visible</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Data</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.data}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Analysis</span>
          <span style={mapStyles.sidePanelMetricValue}>{layerSummary.analysis}</span>
        </div>
      </div>

      {cartographyReviewState && onApplyCartographyRecommendation && onDismissCartographyRecommendation ? (
        <div style={cartographyReviewStrip} aria-label="Cartography review summary">
          <div style={cartographyReviewTopLine}>
            <div>
              <div style={cartographyReviewTitle}>Symbology review</div>
              <div style={cartographyReviewMeta}>
                {cartographyRecommendations.length} recommendation{cartographyRecommendations.length === 1 ? "" : "s"} / {cartographyReviewState.metadata.visibleLayerCount} visible layers
              </div>
            </div>
            <div style={cartographyReviewActions}>
              <button
                type="button"
                style={cartographyRecommendations.length > 0 ? dialogBtnPrimary : dialogBtn}
                onClick={() => handleOpenCartographyReview(null)}
              >
                Review map
              </button>
              {cartographyPanelOpen ? (
                <button type="button" style={dialogBtn} onClick={() => setCartographyPanelOpen(false)}>
                  Hide
                </button>
              ) : null}
            </div>
          </div>

          {cartographyPanelOpen ? (
            <CartographyRecommendationList
              title={`Cartography / ${cartographyLayerFilterName}`}
              recommendations={scopedCartographyRecommendations}
              emptyMessage="No pending cartographic issues in this scope."
              maxItems={4}
              canUndo={canUndoCartographyRecommendation}
              onApply={onApplyCartographyRecommendation}
              onDismiss={onDismissCartographyRecommendation}
              {...(onUndoCartographyRecommendation ? { onUndo: onUndoCartographyRecommendation } : {})}
              {...(onShowCartographyDetails ? { onShowDetails: onShowCartographyDetails } : {})}
            />
          ) : null}
        </div>
      ) : null}

      <div style={{ padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}` }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ ...searchInputStyle, margin: 0, width: "100%" }}
          placeholder="Search layers..."
          aria-label="Search layers"
        />
      </div>

      {/* Layer groups */}
      <div style={mapStyles.sidePanelBody} role="list" aria-label="Layer list">
        {filteredOverlayLayers.length === 0 ? (
          <div style={emptyGroupMsg}>
            {hasSearch
              ? "No layers match the current search. Clear the search or add a layer whose name, CRS, source, or field metadata matches."
              : "Missing prerequisite: no overlay layers added. Import or add a dataset to enable layer controls, QA, comparison, and report handoff."}
          </div>
        ) : null}

        {/* Data Layers + Analysis Results groups */}
        {GROUP_ORDER.map((groupId) => (
          <React.Fragment key={groupId}>
            {grouped[groupId].length > 0 ? (
              <>
                <div style={groupHeader}>{GROUP_LABELS[groupId]}</div>
                {grouped[groupId].map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={handleToggle}
                    onSetOpacity={onSetOpacity}
                    onRemove={handleRemove}
                    onNameClick={handleNameClick}
                    isSymbologyActive={activeSymbologyLayerId === layer.id}
                    cartographyRecommendationCount={cartographyRecommendationCountByLayer.get(layer.id) ?? 0}
                    {...(cartographyReviewState ? { onReviewCartography: handleOpenCartographyReview } : {})}
                    isDragging={dragId === layer.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    {...(onOpenSymbology &&
                      layer.type === "geojson" &&
                      (layer.metadata?.geometryType?.toLowerCase() ?? "").includes("point")
                        ? { onOpenSymbology }
                        : {})}
                  />
                ))}
              </>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {/* Add Layer button */}
      <button
        type="button"
        style={addLayerBtn}
        onClick={() => setShowAddDialog(true)}
        aria-label="Add a new layer"
      >
        Add Layer
      </button>

      {/* Metadata popover */}
      {popoverLayer ? (
        <MetadataPopover
          layer={popoverLayer}
          topOffset={popoverTop}
          activeRerunToken={activeRerunToken}
          {...(onAddLayerToReport ? { onAddLayerToReport } : {})}
          {...(onReRunAnalysisLayer ? { onReRunAnalysisLayer } : {})}
        />
      ) : null}

      {/* Add layer dialog */}
      {showAddDialog ? (
        <AddLayerDialog
          onAdd={handleAddLayer}
          onClose={() => setShowAddDialog(false)}
        />
      ) : null}
    </div>
  );
};
