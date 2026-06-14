import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  MapCartographyRecommendation,
  MapCartographyReviewState,
} from "@/services/map/MapCartographyAdvisor";
import type { SourceHandle, SourceRestoreStatus } from "@/services/map/contracts/gisContracts";
import { buildMapCompositionLegendItems } from "@/services/map/MapExportService";
import { MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL } from "./mapTypes";
import type { LayerGroupId, LayerPublicationReadinessStatus, LayerQaStatus, LayerScientificQABadge, LayerSourceKind, MapBookmark, MapPin, OverlayLayerConfig } from "./mapTypes";
import { CartographyRecommendationList } from "./CartographyRecommendationList";
import { DeclareCrsControl } from "./DeclareCrsControl";
import { normalizeLayerRegistryMetadata } from "./mapLayerMetadata";
import {
  LAYER_ACTION_COMMAND_GROUPS,
  type LayerActionCommandGroupId,
} from "./contextMenuUtils";
import {
  MAP_COLORS,
  MAP_DENSITY,
  MAP_DIMENSIONS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import motionStyles from "./design/motion.module.css";
import { IconClose, IconEyeClosed, IconEyeOpen, IconLayers, IconLine, IconPin, IconPoint, IconPolygon, IconUnknown } from "./MapIcons";

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
  onAddDemoPack?: () => void;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  onAddLayerToReport?: (id: string) => void;
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onDeclareLayerCrs?: (id: string, crs: string) => void;
  onInspectLayer?: (id: string) => void;
  onOpenAttributeTable?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
  onFocusLayer?: (id: string) => void;
  onRepairGeometry?: (id: string) => void;
  selectedFeatureCount?: number;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  onOpenSourcesSection?: () => void;
  onOpenContentsSection?: () => void;
  onOpenSelectionDetail?: () => void;
  onOpenLayerQaDetail?: () => void;
  onClearLayerCache?: () => void;
  activeRerunToken?: string | null;
  onOpenSymbology?: (id: string) => void;
  activeSymbologyLayerId?: string | null;
  cartographyReviewState?: MapCartographyReviewState | null;
  onApplyCartographyRecommendation?: (recommendationId: string) => void;
  onDismissCartographyRecommendation?: (recommendationId: string) => void;
  onUndoCartographyRecommendation?: () => void;
  canUndoCartographyRecommendation?: boolean;
  onShowCartographyDetails?: (recommendation: MapCartographyRecommendation) => void;
  onOpenCartographyReviewScope?: (layerId: string | null) => void;
  presentation?: "standalone" | "embedded";
  cartographyReviewPlacement?: "inline" | "none";
  onRequestClose?: () => void;
  panelStyle?: React.CSSProperties;
  density?: MapLayerPanelDensity;
  /** Screen reader announcement */
  onAnnounce?: (msg: string) => void;
}

export type MapLayerPanelDensity = "compact" | "comfortable";

export interface MapLayerSourcesPanelProps {
  overlayLayers: readonly OverlayLayerConfig[];
  sourceHandles?: readonly SourceHandle[];
  onInspectLayer?: (id: string) => void;
  onOpenAttributeTable?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onAddLayerToReport?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
  onDeclareLayerCrs?: (id: string, crs: string) => void;
  onRepairGeometry?: (id: string) => void;
  onFocusLayer?: (id: string) => void;
  onAnnounce?: (msg: string) => void;
}

export interface MapLayerCartographyPanelProps {
  overlayLayers: readonly OverlayLayerConfig[];
  cartographyReviewState?: MapCartographyReviewState | null;
  activeLayerId?: string | null;
  onActiveLayerChange?: (layerId: string | null) => void;
  onOpenSymbology?: (id: string) => void;
  onApplyCartographyRecommendation?: (recommendationId: string) => void;
  onDismissCartographyRecommendation?: (recommendationId: string) => void;
  onUndoCartographyRecommendation?: () => void;
  canUndoCartographyRecommendation?: boolean;
  onShowCartographyDetails?: (recommendation: MapCartographyRecommendation) => void;
}

export interface MapLayerBookmarksPanelProps {
  bookmarks: readonly MapBookmark[];
  pins: readonly MapPin[];
  maxBookmarks: number;
  onSaveBookmark: (name: string) => void;
  onRestoreBookmark: (bookmark: MapBookmark) => void;
  onRemovePin: (id: string) => void;
  onClearPins: () => void;
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
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

const SOURCE_RESTORE_STATUS_LABELS: Record<SourceRestoreStatus, string> = {
  restored: "restored",
  recoverable: "recoverable",
  unavailable: "unavailable",
  "external-reference": "external ref",
  "metadata-only": "metadata only",
};

const PUBLICATION_READINESS_LABELS: Record<LayerPublicationReadinessStatus, string> = {
  ready: "Ready",
  "ready-with-caveats": "Ready with caveats",
  "needs-review": "Needs review",
  blocked: "Blocked",
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

const panelContainerEmbedded: React.CSSProperties = {
  ...panelContainer,
  position: "relative",
  inset: "auto",
  left: "auto",
  top: "auto",
  bottom: "auto",
  width: "100%",
  height: "100%",
  borderRight: MAP_STROKES.none,
  background: MAP_COLORS.transparent,
  zIndex: "auto",
};

const panelCollapsed: React.CSSProperties = {
  ...panelContainer,
  width: "2.5rem",
  overflow: "hidden",
};

const toggleBtn: React.CSSProperties = {
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
  color: MAP_COLORS.interaction,
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
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md} ${MAP_SPACING.xs}`,
  marginTop: 0,
  minHeight: MAP_DENSITY.compact.rowHeight,
};

const layerRow: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.625rem minmax(0, 1fr) 3.5rem",
  alignItems: "start",
  gap: "0.375rem",
  minHeight: "7.5rem",
  padding: "0.3125rem 0.375rem",
  boxSizing: "border-box",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  cursor: "grab",
};

const layerRowDragging: React.CSSProperties = {
  ...layerRow,
  opacity: 0.5,
  background: MAP_COLORS.neutralSubtle,
};

const layerRowDropTarget: React.CSSProperties = {
  boxShadow: `inset 0 -2px 0 ${MAP_COLORS.interaction}, inset 2px 0 0 ${MAP_COLORS.interaction}`,
};

const layerRowComfortable: React.CSSProperties = {
  minHeight: "2.75rem",
  padding: "0.4375rem 0.5rem",
};

const layerDragHandle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1rem",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 12,
  lineHeight: 1,
  cursor: "grab",
};

const layerTypeIconShell: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.25rem",
  height: "1.25rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.textSecondary,
  background: MAP_COLORS.transparent,
};

const visibilityBtn: React.CSSProperties = {
  background: "none",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  cursor: "pointer",
  fontSize: 14,
  width: "1.625rem",
  height: "1.625rem",
  padding: 0,
  lineHeight: 1,
  transition: MAP_TRANSITIONS.fast,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const layerContent: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "grid",
  alignContent: "start",
  gap: 3,
};

const layerNameButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  textAlign: "left",
  padding: 0,
  cursor: "pointer",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  display: "block",
};

const layerName: React.CSSProperties = {
  ...MAP_TEXT_STYLES.titleWrap,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
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
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const analysisMetaText: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal" as const,
};

const analysisSummaryText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  lineHeight: 1.35,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal" as const,
};

const layerMetaRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: 0,
  overflow: "visible",
};

const layerMetaText: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  lineHeight: 1.45,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal",
};

const layerModeRail: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  minHeight: "1.125rem",
  minWidth: 0,
};

const layerBadgeRail: React.CSSProperties = {
  ...layerModeRail,
};

const layerControlRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  minHeight: "1rem",
};

const opacityValueLabel: React.CSSProperties = {
  flex: "0 0 auto",
  minWidth: "2rem",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 9,
  textAlign: "right",
};

const layerSectionGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 0,
  padding: `0 ${MAP_SPACING.md} ${MAP_SPACING.xs}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

/* Flat summary rows — hairline separated, no boxed card chrome. */
const layerSectionCard: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
  padding: `${MAP_SPACING.xs} 0`,
  borderTop: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
};

const layerSectionCardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const layerSectionCardTitle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const layerSectionCardValue: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const layerSectionCardDetail: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 10,
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const layerSectionCardAction: React.CSSProperties = {
  justifySelf: "start",
  padding: 0,
  border: MAP_STROKES.none,
  borderRadius: 0,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

const layerReadinessGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 4,
  minWidth: 0,
};

/* Flat readiness cells — slim left accent only, no boxed chrome. */
const layerReadinessCellBase: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "3.25rem minmax(0, 1fr)",
  alignItems: "center",
  gap: 4,
  minHeight: MAP_DENSITY.compact.rowHeight,
  minWidth: 0,
  padding: "2px 5px",
  border: 0,
  borderLeft: MAP_STROKES.hairlineSubtle,
  borderLeftWidth: 2,
  borderRadius: 0,
  background: MAP_COLORS.transparent,
  boxSizing: "border-box",
};

const layerReadinessLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  whiteSpace: "nowrap",
};

const layerReadinessValue: React.CSSProperties = {
  ...MAP_TEXT_STYLES.valueWrap,
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const layerInlineActionButton: React.CSSProperties = {
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
};

const layerBadgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "11rem",
  minHeight: "1rem",
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  lineHeight: 1.2,
  ...MAP_TEXT_STYLES.chipLabel,
  flexShrink: 0,
};

const layerActionMenu: React.CSSProperties = {
  position: "relative",
  flexShrink: 0,
  justifySelf: "end",
  alignSelf: "start",
  zIndex: 2,
  width: "3.5rem",
};

const layerActionSummary: React.CSSProperties = {
  listStyle: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "3.5rem",
  minWidth: "3.5rem",
  minHeight: "2rem",
  boxSizing: "border-box",
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.interaction,
  appearance: "none",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  padding: "4px 8px",
  lineHeight: 1.2,
  borderRadius: MAP_RADIUS.sm,
  transition: MAP_TRANSITIONS.fast,
};

const layerActionGrid: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  /* right:0 keeps the menu from overflowing the right edge of its
     scroll container (the layer panel), which is already bounded. */
  right: 0,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 6,
  marginTop: 0,
  padding: 7,
  minWidth: 230,
  maxWidth: 260,
  /* Use the shell's popover max-height var so menus stay within the modal
     viewport regardless of short-height states. Falls back to 24rem. */
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100% - 4rem)))",
  overflowY: "auto",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.dropdown,
};

const layerActionGroup: React.CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const layerActionGroupDanger: React.CSSProperties = {
  marginTop: MAP_SPACING.xs,
  paddingTop: MAP_SPACING.xs,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const layerActionGroupLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  textTransform: "uppercase",
};

const layerActionGroupLabelDanger: React.CSSProperties = {
  ...layerActionGroupLabel,
  color: MAP_COLORS.error,
};

const layerActionButton: React.CSSProperties = {
  display: "grid",
  gap: 2,
  width: "100%",
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.text,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  padding: "7px 8px",
  lineHeight: 1.15,
  borderRadius: MAP_RADIUS.sm,
  transition: MAP_TRANSITIONS.fast,
  maxWidth: "100%",
  minWidth: 0,
  whiteSpace: "normal",
  textAlign: "left" as const,
};

const layerActionButtonLabel: React.CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
};

const layerActionDisabledReason: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

const layerActionButtonDanger: React.CSSProperties = {
  color: MAP_COLORS.error,
  background: "rgba(248, 113, 113, 0.08)",
  border: `1px solid ${MAP_COLORS.error}`,
};

const layerActionButtonWarning: React.CSSProperties = {
  color: MAP_COLORS.warning,
  background: MAP_COLORS.transparent,
};

const layerActionButtonDisabled: React.CSSProperties = {
  opacity: 0.9,
  cursor: "not-allowed",
  color: MAP_COLORS.textMuted,
  background: "rgba(255,255,255,0.022)",
};

const staleChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: MAP_COLORS.warning,
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const columnarChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
  color: "#7DD3FC",
  fontSize: 9,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  flexShrink: 0,
};

const scientificQaChip: React.CSSProperties = {
  padding: "1px 3px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.none,
  background: "transparent",
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
  color: MAP_COLORS.error,
};

const scientificQaChipWarning: React.CSSProperties = {
  color: MAP_COLORS.warning,
};

const opacitySlider: React.CSSProperties = {
  width: "100%",
  minWidth: 48,
  height: 4,
  accentColor: MAP_COLORS.interaction,
  cursor: "pointer",
  flex: 1,
  margin: 0,
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
  ...mapStyles.sidePanelActionButton,
  width: "100%",
  minWidth: 0,
  minHeight: "2rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.xs}`,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: 1.15,
  textAlign: "center" as const,
  whiteSpace: "normal" as const,
  overflowWrap: "anywhere" as const,
};

const layerFooterActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const layerFooterStatusLine: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 10,
  lineHeight: 1.3,
};

const addManualLayerBtn: React.CSSProperties = {
  ...addLayerBtn,
};

const clearLayerCacheBtn: React.CSSProperties = {
  ...addLayerBtn,
  color: MAP_COLORS.warning,
};

const clearLayerCacheConfirmBtn: React.CSSProperties = {
  ...clearLayerCacheBtn,
  border: `1px solid ${MAP_COLORS.warning}`,
};

const layerAuxPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const layerAuxSummary: React.CSSProperties = {
  ...mapStyles.sidePanelSummaryStrip,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const layerAuxBody: React.CSSProperties = {
  ...mapStyles.sidePanelBody,
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
};

const layerSourceRow: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
};

const layerSourceHead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: MAP_SPACING.sm,
};

const layerSourceTitle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  overflowWrap: "anywhere",
};

const layerSourceMetaGrid: React.CSSProperties = {
  display: "grid",
  gap: 2,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 10,
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const layerSourceActionRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
};

const bookmarkPanelBody: React.CSSProperties = {
  ...layerAuxBody,
  gap: MAP_SPACING.md,
};

const bookmarkSection: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const bookmarkSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minHeight: "1.625rem",
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const bookmarkSectionTitle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
};

const bookmarkRows: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const bookmarkRow: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2.5rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
};

const bookmarkRowTitle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.truncate,
};

const bookmarkRowMeta: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 10,
  ...MAP_TEXT_STYLES.truncate,
};

const layerAuxEmpty: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
  padding: MAP_SPACING.md,
};

const fileDropOverlay: React.CSSProperties = {
  position: "absolute",
  inset: MAP_SPACING.sm,
  zIndex: MAP_Z_INDEX.dropdown,
  display: "grid",
  placeItems: "center",
  pointerEvents: "none",
  border: `1px dashed ${MAP_COLORS.interaction}`,
  borderRadius: MAP_RADIUS.md,
  background: "rgba(6, 10, 16, 0.78)",
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textAlign: "center",
};

const cartographyScopeRail: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const cartographyScopeButton: React.CSSProperties = {
  ...layerInlineActionButton,
  maxWidth: "100%",
};

const cartographyScopeButtonActive: React.CSSProperties = {
  ...cartographyScopeButton,
  color: MAP_COLORS.interaction,
  border: `1px solid ${MAP_COLORS.focus}`,
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  left: `calc(var(--map-layer-panel-width, ${MAP_DIMENSIONS.layerPanelWidth}) + ${MAP_SPACING.sm})`,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.none,
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
  /* Use named dialog tier so this confirm overlay sits above dropdowns
     and popovers but below toast notifications. */
  zIndex: MAP_Z_INDEX.dialog,
};

const dialogStyle: React.CSSProperties = {
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.none,
  padding: MAP_SPACING.lg,
  width: 340,
  maxWidth: "90%",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: `6px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "var(--syn-surface-input, #1a1f26)",
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
  border: MAP_STROKES.hairlineSubtle,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  transition: MAP_TRANSITIONS.fast,
};

const dialogBtnPrimary: React.CSSProperties = {
  ...dialogBtn,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  border: `1px solid ${MAP_COLORS.focus}`,
};

const emptyGroupMsg: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  justifyItems: "start",
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  padding: `4px ${MAP_SPACING.md}`,
  lineHeight: 1.45,
};

const analysisSectionTitle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 6,
  color: MAP_COLORS.interaction,
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

const layerLegendPreview: React.CSSProperties = {
  display: "grid",
  gap: 3,
  marginTop: MAP_SPACING.xs,
};

const layerLegendPreviewRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "10px minmax(0, 1fr)",
  gap: 6,
  alignItems: "center",
};

const layerLegendPreviewLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 9,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const layerAdvancedDetails: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const layerAdvancedSummary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minHeight: "2rem",
  width: "fit-content",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
  listStyle: "none",
};

const layerActiveState: React.CSSProperties = {
  boxShadow: `inset 2px 0 0 ${MAP_COLORS.interaction}`,
  background: MAP_COLORS.selectedSubtle,
};

const layerPrimarySummaryRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

interface LayerSectionCardModel {
  id: "layers" | "sources" | "contents" | "selection" | "layer-qa";
  title: string;
  value: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}

const rerunBtn: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "6px 10px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  transition: MAP_TRANSITIONS.fast,
};

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function resolveLayerSourceKind(layer: OverlayLayerConfig): LayerSourceKind {
  return normalizeLayerRegistryMetadata(layer).sourceKind;
}

function resolveLayerQaStatus(layer: OverlayLayerConfig): LayerQaStatus {
  return normalizeLayerRegistryMetadata(layer).qaStatus;
}

function isLayerQueryable(layer: OverlayLayerConfig): boolean {
  return normalizeLayerRegistryMetadata(layer).queryable;
}

function resolveLayerCrs(layer: OverlayLayerConfig): string {
  return normalizeLayerRegistryMetadata(layer).crsSummary.crs ?? "Unknown CRS";
}

function resolveLayerProvenanceLabel(layer: OverlayLayerConfig): string {
  return normalizeLayerRegistryMetadata(layer).provenance.label;
}

function resolveLayerSourceRestoreStatus(layer: OverlayLayerConfig): SourceRestoreStatus | null {
  const explicit = layer.metadata?.sourceRestoreStatus ?? layer.metadata?.persistence?.sourceRestoreStatus;
  if (explicit) return explicit;

  switch (layer.metadata?.persistence?.restoreState) {
    case "restored":
      return "restored";
    case "external-reference":
      return "external-reference";
    case "metadata-only":
      return "metadata-only";
    case "stale-reference":
      return "unavailable";
    default:
      return null;
  }
}

function sourceRestoreBadgeTone(status: SourceRestoreStatus | null, sourceKind: LayerSourceKind): LayerBadgeTone {
  if (status === "restored") return sourceKind === "demo" ? "warning" : "good";
  if (status === "recoverable" || status === "metadata-only") return "warning";
  if (status === "unavailable") return "error";
  if (status === "external-reference") return "info";
  return sourceKind === "external" ? "info" : sourceKind === "demo" ? "warning" : "neutral";
}

function formatBounds(bounds: [number, number, number, number]): string {
  return `[${bounds.map((b) => b.toFixed(4)).join(", ")}]`;
}

function getLayerBounds(layer: OverlayLayerConfig): [number, number, number, number] | null {
  return layer.metadata?.bounds ?? layer.metadata?.geometrySummary?.bounds ?? null;
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

function formatLayerGeometryFeatureSummary(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  const geometryType = registry.geometrySummary.geometryType;
  const featureCount = registry.featureCount;
  if (featureCount != null && geometryType !== "Unknown") {
    return `${geometryType} / ${featureCount.toLocaleString()} features`;
  }
  if (featureCount != null) {
    return `${featureCount.toLocaleString()} features`;
  }
  return geometryType !== "Unknown" ? geometryType : null;
}

function formatLayerGeometryChip(layer: OverlayLayerConfig): string {
  return formatLayerGeometryFeatureSummary(layer) ?? layer.type;
}

function getLayerGeometryIconKind(layer: OverlayLayerConfig): "point" | "line" | "polygon" | "pin" | "layer" | "unknown" {
  const geometry = normalizeLayerRegistryMetadata(layer).geometrySummary.geometryType.toLowerCase();
  if (geometry.includes("point")) return "point";
  if (geometry.includes("line")) return "line";
  if (geometry.includes("polygon")) return "polygon";
  if (layer.type === "marker") return "pin";
  if (layer.type === "geojson" || layer.type === "heatmap" || layer.type === "symbol-density") return "layer";
  return "unknown";
}

function formatBookmarkTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "saved view";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasFileDrag(event: React.DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
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

type LayerBadgeTone = "neutral" | "info" | "good" | "warning" | "error";

interface LayerBadgeModel {
  id: string;
  label: string;
  title: string;
  tone: LayerBadgeTone;
}

interface LayerReadinessCellModel {
  id: string;
  label: string;
  value: string;
  title: string;
  tone: LayerBadgeTone;
}

type LayerActionId =
  | "inspect"
  | "table"
  | "locate"
  | "move-up"
  | "move-down"
  | "style"
  | "review"
  | "rerun"
  | "repair-geometry"
  | "export"
  | "urban"
  | "ide"
  | "report"
  | "dashboard"
  | "education"
  | "remove"
  | "confirm-remove"
  | "cancel-remove";

type LayerActionTone = "default" | "warning" | "danger";

type LayerActionDensityClass = "primary" | "secondary" | "destructive" | "advanced-metadata";

interface LayerEvidenceActionModel {
  id: LayerActionId;
  groupId: LayerActionCommandGroupId;
  label: string;
  title: string;
  tone?: LayerActionTone;
  disabledReason?: string;
  onSelect?: () => void;
  testId?: string;
}

const LAYER_ACTION_DENSITY_CLASSIFICATION: Readonly<Record<LayerActionId, LayerActionDensityClass>> = {
  inspect: "advanced-metadata",
  table: "advanced-metadata",
  locate: "primary",
  "move-up": "secondary",
  "move-down": "secondary",
  style: "primary",
  review: "secondary",
  rerun: "secondary",
  "repair-geometry": "secondary",
  export: "secondary",
  urban: "secondary",
  ide: "secondary",
  report: "secondary",
  dashboard: "secondary",
  education: "advanced-metadata",
  remove: "destructive",
  "confirm-remove": "destructive",
  "cancel-remove": "destructive",
} as const;

function getLayerActionDensityClass(action: LayerEvidenceActionModel): LayerActionDensityClass {
  return LAYER_ACTION_DENSITY_CLASSIFICATION[action.id];
}

interface LayerEvidenceActionCallbacks {
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onAddLayerToReport?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
}

function layerBadgeToneStyle(tone: LayerBadgeTone): React.CSSProperties {
  switch (tone) {
    case "good":
      return {
        color: "#86EFAC",
        background: "transparent",
      };
    case "warning":
      return {
        color: MAP_COLORS.warning,
        background: "transparent",
      };
    case "error":
      return {
        color: MAP_COLORS.error,
        background: "transparent",
      };
    case "info":
      return {
        color: "#7DD3FC",
        background: "transparent",
      };
    case "neutral":
    default:
      return {};
  }
}

function qaBadgeTone(status: LayerQaStatus): LayerBadgeTone {
  switch (status) {
    case "passed":
      return "good";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "unchecked":
    default:
      return "neutral";
  }
}

function publicationBadgeTone(status: LayerPublicationReadinessStatus): LayerBadgeTone {
  switch (status) {
    case "ready":
      return "good";
    case "ready-with-caveats":
      return "warning";
    case "blocked":
      return "error";
    case "needs-review":
    default:
      return "warning";
  }
}

function formatMetadataField(field: string): string {
  if (field.toLowerCase() === "crs") return "CRS";
  return field.replace(/-/g, " ");
}

function formatMetadataFieldList(fields: string[]): string {
  return fields.map(formatMetadataField).join(", ");
}

function buildPublicationGateReason(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  const readiness = registry.publicationReadiness;
  if (readiness.status === "blocked") {
    const issueLabel = readiness.blockingIssueIds.length > 0
      ? readiness.blockingIssueIds.join(", ")
      : "QA blocker";
    return `Publication blocked by ${issueLabel}.`;
  }
  if (readiness.status === "needs-review") {
    const missing = registry.readiness.missingFields.length > 0
      ? formatMetadataFieldList(registry.readiness.missingFields)
      : "metadata review";
    return `Publication needs review: missing ${missing}.`;
  }
  return null;
}

function buildTableGateReason(layer: OverlayLayerConfig): string | null {
  return normalizeLayerRegistryMetadata(layer).queryable
    ? null
    : "Missing prerequisite: layer is not queryable vector data.";
}

function formatFeatureCountLabel(featureCount: number | null): string {
  return featureCount == null ? "count unknown" : `${featureCount.toLocaleString()} features`;
}

function buildCrsReadinessValue(layer: OverlayLayerConfig): string {
  const registry = normalizeLayerRegistryMetadata(layer);
  const crs = registry.crsSummary.crs;
  if (registry.crsSummary.source === "user-declared") {
    return crs ? `${crs} user-declared (caveat)` : "user-declared (caveat) CRS";
  }
  if (registry.crsSummary.status === "known") {
    return crs ?? "CRS known";
  }
  if (registry.crsSummary.status === "missing") {
    return "CRS missing";
  }
  return "CRS unknown";
}

function buildLayerReadinessCells(layer: OverlayLayerConfig): LayerReadinessCellModel[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const sourceRestoreStatus = resolveLayerSourceRestoreStatus(layer);
  const sourceRestoreLabel = sourceRestoreStatus ? SOURCE_RESTORE_STATUS_LABELS[sourceRestoreStatus] : "unregistered";
  const baseSourceLabel = SOURCE_KIND_LABELS[registry.sourceKind];
  const sourceLabel = registry.sourceKind === "demo" ? "Demo / synthetic" : baseSourceLabel;
  const geometryType = registry.geometrySummary.geometryType !== "Unknown"
    ? registry.geometrySummary.geometryType
    : "Unknown geometry";
  const featureCountLabel = formatFeatureCountLabel(registry.featureCount);
  const crsValue = buildCrsReadinessValue(layer);
  const publicationLabel = `Publication ${PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status].toLowerCase()}`;
  return [
    {
      id: "source",
      label: "Source",
      value: sourceLabel,
      title: `Source kind: ${baseSourceLabel} / ${sourceRestoreLabel}. Provenance: ${registry.provenance.label}`,
      tone: sourceRestoreBadgeTone(sourceRestoreStatus, registry.sourceKind),
    },
    {
      id: "restore",
      label: "Restore",
      value: sourceRestoreLabel,
      title: sourceRestoreStatus
        ? `Source restore state: ${SOURCE_RESTORE_STATUS_LABELS[sourceRestoreStatus]}.`
        : "Source restore state: unregistered. No source handle or restore state is registered for this layer.",
      tone: sourceRestoreStatus ? sourceRestoreBadgeTone(sourceRestoreStatus, registry.sourceKind) : "neutral",
    },
    {
      id: "geometry",
      label: "Geom",
      value: geometryType,
      title: `Geometry type: ${geometryType}.`,
      tone: geometryType === "Unknown geometry" ? "warning" : "neutral",
    },
    {
      id: "features",
      label: "Features",
      value: featureCountLabel,
      title: `Feature count: ${featureCountLabel}.`,
      tone: registry.featureCount == null ? "warning" : "neutral",
    },
    {
      id: "crs",
      label: "CRS",
      value: crsValue,
      title: registry.crsSummary.notes.length > 0
        ? registry.crsSummary.notes.join(" ")
        : `CRS status: ${crsValue}.`,
      tone: registry.crsSummary.status === "known"
        ? (registry.crsSummary.source === "user-declared" ? "warning" : "good")
        : "error",
    },
    {
      id: "qa",
      label: "QA",
      value: QA_STATUS_LABELS[registry.qaStatus],
      title: `Scientific QA status: ${QA_STATUS_LABELS[registry.qaStatus]}.`,
      tone: qaBadgeTone(registry.qaStatus),
    },
    {
      id: "publication",
      label: "Publish",
      value: publicationLabel,
      title: buildPublicationGateReason(layer) ?? (registry.publicationReadiness.caveats.join(" ") || "Layer metadata is publication-ready."),
      tone: publicationBadgeTone(registry.publicationReadiness.status),
    },
  ];
}

function createLayerAction(
  groupId: LayerActionCommandGroupId,
  layer: OverlayLayerConfig,
  id: LayerActionId,
  label: string,
  callback: ((id: string) => void) | undefined,
  disabledReason: string | null,
  fallbackDisabledReason: string,
  options: {
    tone?: LayerActionTone;
    testId?: string;
  } = {},
): LayerEvidenceActionModel {
  const reason = disabledReason ?? (callback ? null : fallbackDisabledReason);
  return {
    id,
    groupId,
    label,
    title: reason ?? `${label} ${layer.name}`,
    ...(options.tone ? { tone: options.tone } : {}),
    ...(reason ? { disabledReason: reason } : {}),
    ...(!reason && callback ? { onSelect: () => callback(layer.id) } : {}),
    ...(options.testId ? { testId: options.testId } : {}),
  };
}

function buildLayerEvidenceActions(
  layer: OverlayLayerConfig,
  callbacks: LayerEvidenceActionCallbacks,
): LayerEvidenceActionModel[] {
  const registry = normalizeLayerRegistryMetadata(layer);
  const publicationGateReason = buildPublicationGateReason(layer);
  const queryGateReason = registry.queryable ? null : "Layer must be queryable before sending feature context to Urban Analytics.";
  const crsGateReason = registry.crsSummary.status === "known" ? null : "Layer needs declared CRS before analytical handoff.";
  const ideGateReason = registry.evidenceArtifactId || registry.provenance.sourceUrl || layer.metadata?.analysisResult?.runId
    ? null
    : "Layer needs an evidence artifact, source URL, or analysis run before IDE handoff.";

  return [
    createLayerAction(
      "publish-report",
      layer,
      "export",
      "Export",
      callbacks.onExportLayer,
      publicationGateReason,
      "Publication export is not connected from the layer rail yet.",
    ),
    createLayerAction(
      "bridge",
      layer,
      "urban",
      "Urban",
      callbacks.onSendLayerToUrban,
      queryGateReason ?? crsGateReason,
      "Urban Analytics handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      "bridge",
      layer,
      "ide",
      "IDE",
      callbacks.onOpenLayerInIde,
      ideGateReason,
      "IDE handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      "publish-report",
      layer,
      "report",
      "Report",
      callbacks.onAddLayerToReport,
      publicationGateReason,
      "Report handoff is not connected from the layer rail yet.",
    ),
    createLayerAction(
      "publish-report",
      layer,
      "dashboard",
      "Dashboard",
      callbacks.onBindLayerToDashboard,
      publicationGateReason,
      "Dashboard binding is not connected from the layer rail yet.",
    ),
    createLayerAction(
      "publish-report",
      layer,
      "education",
      "Education",
      callbacks.onOpenLayerEducationReference,
      null,
      "Education reference is not connected from the layer rail yet.",
    ),
  ];
}

function buildLayerCoreCommandActions(
  layer: OverlayLayerConfig,
  callbacks: {
    onInspectLayer?: (id: string) => void;
    onOpenAttributeTable?: (id: string) => void;
  },
): LayerEvidenceActionModel[] {
  return [
    createLayerAction(
      "inspect",
      layer,
      "inspect",
      "Inspect",
      callbacks.onInspectLayer,
      null,
      "Layer inspector is not connected from the layer rail yet.",
      { testId: "map-layer-inspect-trigger" },
    ),
    createLayerAction(
      "data-table",
      layer,
      "table",
      "Table",
      callbacks.onOpenAttributeTable,
      buildTableGateReason(layer),
      "Attribute table is not connected from the layer rail yet.",
      { testId: "map-layer-table-trigger" },
    ),
  ];
}

function buildLayerRerunAction(
  layer: OverlayLayerConfig,
  callback: ((id: string, rerunToken?: string | null) => void) | undefined,
  activeRerunToken: string | null,
): LayerEvidenceActionModel {
  const analysisResult = layer.metadata?.analysisResult;
  const isRerunning = Boolean(
    analysisResult?.rerunToken && activeRerunToken === analysisResult.rerunToken,
  );
  const disabledReason = !analysisResult
    ? "Layer is not an analysis result."
    : !callback
      ? "Analysis rerun is not connected from the layer rail yet."
      : !analysisResult.rerunToken
        ? "Missing prerequisite: this analysis result has no rerun token."
        : isRerunning
          ? "Analysis is already re-running."
          : null;
  return {
    id: "rerun",
    groupId: "analyze-rerun",
    label: isRerunning ? "Re-running" : "Re-run",
    title: disabledReason ?? "Re-run this analysis with the recorded method and source layer.",
    tone: isRerunning ? "warning" : "default",
    ...(disabledReason ? { disabledReason } : {}),
    ...(!disabledReason && callback ? { onSelect: () => callback(layer.id, analysisResult?.rerunToken) } : {}),
  };
}

function buildRepairGeometryAction(
  layer: OverlayLayerConfig,
  callback: ((id: string) => void) | undefined,
): LayerEvidenceActionModel {
  const hasInvalidGeometry = Boolean(layer.metadata?.scientificQA?.badges.includes("invalid_geometry"));
  const hasInlineGeometry = typeof layer.sourceData === "object" && layer.sourceData !== null;
  const disabledReason = !hasInvalidGeometry
    ? "No invalid geometry QA finding is present."
    : !hasInlineGeometry
      ? "Repair geometry needs an inline GeoJSON source."
      : !callback
        ? "Topology repair is not connected from this layer surface."
        : null;
  return {
    id: "repair-geometry",
    groupId: "crs-qa",
    label: "Repair geometry",
    title: disabledReason ?? "Preview and apply GEOS topology repair for this layer.",
    tone: "warning",
    ...(disabledReason ? { disabledReason } : {}),
    ...(!disabledReason && callback ? { onSelect: () => callback(layer.id) } : {}),
  };
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

const LayerBadge: React.FC<{ badge: LayerBadgeModel }> = ({ badge }) => (
  <span style={{ ...layerBadgeBase, ...layerBadgeToneStyle(badge.tone) }} title={badge.title}>
    {badge.label}
  </span>
);

const LayerGeometryIcon: React.FC<{ layer: OverlayLayerConfig }> = ({ layer }) => {
  const kind = getLayerGeometryIconKind(layer);
  const color = MAP_COLORS.textSecondary;
  switch (kind) {
    case "point":
      return <IconPoint size={13} color={color} />;
    case "line":
      return <IconLine size={13} color={color} />;
    case "polygon":
      return <IconPolygon size={13} color={color} />;
    case "pin":
      return <IconPin size={13} color={color} />;
    case "layer":
      return <IconLayers size={13} color={color} />;
    case "unknown":
    default:
      return <IconUnknown size={13} color={color} />;
  }
};

function layerReadinessCellStyle(tone: LayerBadgeTone): React.CSSProperties {
  const toneStyle = layerBadgeToneStyle(tone);
  return {
    ...layerReadinessCellBase,
    borderLeftColor: toneStyle.color ?? MAP_COLORS.hairlineStrong,
  };
}

const LayerReadinessCell: React.FC<{
  layerId: string;
  cell: LayerReadinessCellModel;
}> = ({ layerId, cell }) => (
  <span
    style={layerReadinessCellStyle(cell.tone)}
    title={cell.title}
    data-layer-readiness={cell.id}
    data-testid={`map-layer-readiness-${layerId}-${cell.id}`}
  >
    <span style={layerReadinessLabel}>{cell.label}</span>
    <span style={{ ...layerReadinessValue, ...layerBadgeToneStyle(cell.tone) }}>{cell.value}</span>
  </span>
);

interface LayerActionMenuProps {
  layerName: string;
  actions: LayerEvidenceActionModel[];
  forceOpen?: boolean;
  onAnnounce?: (msg: string) => void;
}

function layerActionToneStyle(tone: LayerActionTone | undefined): React.CSSProperties {
  if (tone === "danger") return layerActionButtonDanger;
  if (tone === "warning") return layerActionButtonWarning;
  return {};
}

const LayerActionMenu: React.FC<LayerActionMenuProps> = ({ layerName, actions, forceOpen = false, onAnnounce }) => {
  const [expanded, setExpanded] = useState(forceOpen);
  const summaryRef = useRef<HTMLButtonElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = React.useId();
  const open = forceOpen || expanded;
  const groupedActions = LAYER_ACTION_COMMAND_GROUPS
    .map((group) => ({
      group,
      actions: actions.filter((action) => action.groupId === group.id),
    }))
    .filter((group) => group.actions.length > 0);

  const flattenedActions = groupedActions.flatMap((group) => group.actions);

  const focusMenuAction = useCallback((direction: "first" | "last" | "next" | "prev") => {
    const focusableIndexes = flattenedActions
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => !action.disabledReason && action.onSelect)
      .map(({ index }) => index);
    if (focusableIndexes.length === 0) return;

    const activeElement = typeof document !== "undefined" ? document.activeElement : null;
    const currentIndex = menuItemRefs.current.findIndex((node) => node === activeElement);
    const currentFocusableIndex = focusableIndexes.findIndex((index) => index === currentIndex);

    if (direction === "first") {
      menuItemRefs.current[focusableIndexes[0]]?.focus({ preventScroll: true });
      return;
    }
    if (direction === "last") {
      menuItemRefs.current[focusableIndexes[focusableIndexes.length - 1]]?.focus({ preventScroll: true });
      return;
    }

    const nextFocusableIndex = direction === "next"
      ? (currentFocusableIndex < 0 ? 0 : (currentFocusableIndex + 1) % focusableIndexes.length)
      : (currentFocusableIndex < 0
        ? focusableIndexes.length - 1
        : (currentFocusableIndex - 1 + focusableIndexes.length) % focusableIndexes.length);
    menuItemRefs.current[focusableIndexes[nextFocusableIndex]]?.focus({ preventScroll: true });
  }, [flattenedActions]);

  React.useEffect(() => {
    if (!open) return;
    focusMenuAction("first");
  }, [focusMenuAction, open]);

  return (
    <div style={layerActionMenu}>
      <button
        ref={summaryRef}
        type="button"
        style={layerActionSummary}
        aria-label={`Layer actions for ${layerName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Layer command menu"
        data-testid="map-layer-actions-summary"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          event.stopPropagation();
          setExpanded(true);
        }}
      >
        Actions
      </button>
      <div
        id={menuId}
        style={{ ...layerActionGrid, display: open ? layerActionGrid.display : "none" }}
        role="menu"
        aria-label={`Layer command menu for ${layerName}`}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setExpanded(false);
            summaryRef.current?.focus({ preventScroll: true });
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            focusMenuAction("next");
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            focusMenuAction("prev");
            return;
          }
          if (event.key === "Home") {
            event.preventDefault();
            focusMenuAction("first");
            return;
          }
          if (event.key === "End") {
            event.preventDefault();
            focusMenuAction("last");
          }
        }}
      >
        {groupedActions.map(({ group, actions: groupActions }) => (
          <div
            key={group.id}
            style={{
              ...layerActionGroup,
              ...(group.id === "cache-remove" ? layerActionGroupDanger : {}),
            }}
            role="group"
            aria-label={group.label}
            data-layer-action-group={group.id}
          >
            <div style={group.id === "cache-remove" ? layerActionGroupLabelDanger : layerActionGroupLabel}>{group.label}</div>
            {groupActions.map((action) => {
              const actionIndex = flattenedActions.findIndex((candidate) => candidate.id === action.id && candidate.groupId === action.groupId);
              const disabled = Boolean(action.disabledReason || !action.onSelect);
              const title = action.disabledReason ?? action.title;
              return (
                <button
                  key={action.id}
                  type="button"
                  style={{
                    ...layerActionButton,
                    ...layerActionToneStyle(action.tone),
                    ...(disabled ? layerActionButtonDisabled : {}),
                  }}
                  disabled={disabled}
                  title={title}
                  role="menuitem"
                  aria-disabled={disabled || undefined}
                  aria-label={disabled ? `${action.label}: ${title}` : `${action.label} ${layerName}`}
                  data-layer-action={action.id}
                  data-layer-action-class={getLayerActionDensityClass(action)}
                  {...(action.testId ? { "data-testid": action.testId } : {})}
                  {...(action.disabledReason ? { "data-disabled-reason": action.disabledReason } : {})}
                  ref={(node) => {
                    if (actionIndex >= 0) {
                      menuItemRefs.current[actionIndex] = node;
                    }
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (disabled || !action.onSelect) {
                      if (action.disabledReason) {
                        onAnnounce?.(`${action.label} disabled for ${layerName}: ${action.disabledReason}`);
                      }
                      return;
                    }
                    action.onSelect();
                    onAnnounce?.(`${action.label} requested for ${layerName}`);
                  }}
                >
                  <span style={layerActionButtonLabel}>{action.label}</span>
                  {disabled ? (
                    <span style={layerActionDisabledReason}>{title}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MapLayerSourcesPanel: React.FC<MapLayerSourcesPanelProps> = ({
  overlayLayers,
  sourceHandles = [],
  onInspectLayer,
  onOpenAttributeTable,
  onSendLayerToUrban,
  onOpenLayerInIde,
  onAddLayerToReport,
  onBindLayerToDashboard,
  onOpenLayerEducationReference,
  onDeclareLayerCrs,
  onRepairGeometry,
  onFocusLayer,
  onAnnounce,
}) => {
  const sourceSummary = useMemo(() => {
    const restored = overlayLayers.filter((layer) => {
      const handle = layer.metadata?.sourceId
        ? sourceHandles.find((candidate) => candidate.sourceId === layer.metadata?.sourceId)
        : null;
      return (handle?.restoreStatus ?? resolveLayerSourceRestoreStatus(layer)) === "restored";
    }).length;
    const atRisk = overlayLayers.length - restored;
    return { total: overlayLayers.length, restored, atRisk };
  }, [overlayLayers, sourceHandles]);

  return (
    <section style={layerAuxPanel} aria-label="Layer sources" data-testid="map-layer-sources-panel">
      <div style={layerAuxSummary} aria-label="Layer source restore summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Restored</span>
          <span style={mapStyles.sidePanelMetricValue}>{sourceSummary.restored}/{sourceSummary.total}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Needs attention</span>
          <span style={mapStyles.sidePanelMetricValue}>{sourceSummary.atRisk}</span>
        </div>
      </div>
      <div style={layerAuxBody}>
        {overlayLayers.length === 0 ? (
          <p style={layerAuxEmpty}>Add a layer to inspect source handles, restore state, and provenance.</p>
        ) : null}
        {overlayLayers.map((layer) => {
          const registry = normalizeLayerRegistryMetadata(layer);
          const sourceHandle = layer.metadata?.sourceId
            ? sourceHandles.find((handle) => handle.sourceId === layer.metadata?.sourceId) ?? null
            : null;
          const restoreStatus = sourceHandle?.restoreStatus ?? resolveLayerSourceRestoreStatus(layer);
          const storageMode = sourceHandle?.storageMode ?? layer.metadata?.sourceStorageMode ?? null;
          const geometryFeatureSummary = formatLayerGeometryFeatureSummary(layer);
          const layerBounds = getLayerBounds(layer);
          const coreCommandActions = buildLayerCoreCommandActions(layer, {
            ...(onInspectLayer ? { onInspectLayer } : {}),
            ...(onOpenAttributeTable ? { onOpenAttributeTable } : {}),
          });
          const evidenceActions = buildLayerEvidenceActions(layer, {
            ...(onSendLayerToUrban ? { onSendLayerToUrban } : {}),
            ...(onOpenLayerInIde ? { onOpenLayerInIde } : {}),
            ...(onAddLayerToReport ? { onAddLayerToReport } : {}),
            ...(onBindLayerToDashboard ? { onBindLayerToDashboard } : {}),
            ...(onOpenLayerEducationReference ? { onOpenLayerEducationReference } : {}),
          }).filter((action) => action.id !== "export");
          const repairGeometryAction = buildRepairGeometryAction(layer, onRepairGeometry);
          const utilityActions: LayerEvidenceActionModel[] = [
            {
              id: "locate" as const,
              groupId: "view-focus",
              label: "Locate",
              title: layerBounds ? `Zoom to extent ${formatBounds(layerBounds)}` : "Layer extent metadata is unavailable.",
              ...(!layerBounds
                ? { disabledReason: "Layer extent metadata is unavailable." }
                : onFocusLayer
                  ? { onSelect: () => onFocusLayer(layer.id) }
                  : { disabledReason: "Focus callback is not connected from the layer sources panel yet." }),
            },
            repairGeometryAction,
          ];
          const sourceActions = [...coreCommandActions, ...utilityActions, ...evidenceActions];
          return (
            <article key={layer.id} style={layerSourceRow} data-testid={`map-layer-source-row-${layer.id}`}>
              <div style={layerSourceHead}>
                <div style={layerSourceTitle}>{layer.name}</div>
                <LayerBadge
                  badge={{
                    id: "restore",
                    label: restoreStatus ? SOURCE_RESTORE_STATUS_LABELS[restoreStatus] : "unregistered",
                    title: restoreStatus
                      ? `Source restore status: ${SOURCE_RESTORE_STATUS_LABELS[restoreStatus]}.`
                      : "No source handle or restore state is registered for this layer.",
                    tone: sourceRestoreBadgeTone(restoreStatus, registry.sourceKind),
                  }}
                />
              </div>
              <div style={layerBadgeRail}>
                <LayerBadge
                  badge={{
                    id: "source",
                    label: SOURCE_KIND_LABELS[registry.sourceKind],
                    title: `Source kind: ${SOURCE_KIND_LABELS[registry.sourceKind]}.`,
                    tone: sourceRestoreBadgeTone(restoreStatus, registry.sourceKind),
                  }}
                />
                <LayerBadge
                  badge={{
                    id: "qa",
                    label: QA_STATUS_LABELS[registry.qaStatus],
                    title: `Scientific QA status: ${QA_STATUS_LABELS[registry.qaStatus]}.`,
                    tone: qaBadgeTone(registry.qaStatus),
                  }}
                />
                <LayerBadge
                  badge={{
                    id: "publication",
                    label: PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status],
                    title: buildPublicationGateReason(layer) ?? (registry.publicationReadiness.caveats.join(" ") || "Layer metadata is publication-ready."),
                    tone: publicationBadgeTone(registry.publicationReadiness.status),
                  }}
                />
                {geometryFeatureSummary ? (
                  <LayerBadge
                    badge={{
                      id: "geometry",
                      label: geometryFeatureSummary,
                      title: `Geometry and feature count: ${geometryFeatureSummary}.`,
                      tone: "neutral",
                    }}
                  />
                ) : null}
              </div>
              <div style={layerSourceMetaGrid}>
                <span data-testid={`map-layer-source-restore-${layer.id}`}>
                  Restore: {restoreStatus ? SOURCE_RESTORE_STATUS_LABELS[restoreStatus] : "unregistered"}
                </span>
                <span>Handle: {sourceHandle?.sourceId ?? layer.metadata?.sourceId ?? "not registered"}</span>
                <span>Storage: {storageMode ?? "unknown"}</span>
                <span title={registry.provenance.label}>Provenance: {registry.provenance.label}</span>
              </div>
              <div style={layerSourceActionRow}>
                <LayerActionMenu
                  layerName={layer.name}
                  actions={sourceActions}
                  {...(onAnnounce ? { onAnnounce } : {})}
                />
              </div>
              {onDeclareLayerCrs && (registry.crsSummary.status !== "known" || registry.crsSummary.source === "user-declared") ? (
                <DeclareCrsControl
                  layerId={layer.id}
                  layerName={layer.name}
                  currentCrs={registry.crsSummary.crs}
                  isUserDeclared={registry.crsSummary.source === "user-declared"}
                  bounds={layerBounds}
                  onDeclare={onDeclareLayerCrs}
                  {...(onAnnounce ? { onAnnounce } : {})}
                />
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export const MapLayerBookmarksPanel: React.FC<MapLayerBookmarksPanelProps> = ({
  bookmarks,
  pins,
  maxBookmarks,
  onSaveBookmark,
  onRestoreBookmark,
  onRemovePin,
  onClearPins,
  onFlyTo,
}) => {
  const handleSaveBookmark = (): void => {
    const fallback = `View ${bookmarks.length + 1}`;
    const name = typeof window !== "undefined" && typeof window.prompt === "function"
      ? window.prompt("Name this map view", fallback)
      : fallback;
    if (name == null) return;
    onSaveBookmark(name);
  };

  return (
    <section style={layerAuxPanel} aria-label="Layer bookmarks and pins" data-testid="map-layer-bookmarks-panel">
      <div style={layerAuxSummary} aria-label="Bookmark and pin summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Bookmarks</span>
          <span style={mapStyles.sidePanelMetricValue}>{bookmarks.length}/{maxBookmarks}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Pins</span>
          <span style={mapStyles.sidePanelMetricValue}>{pins.length}</span>
        </div>
      </div>
      <div style={bookmarkPanelBody}>
        <section style={bookmarkSection} aria-label="Saved views">
          <div style={bookmarkSectionHeader}>
            <span style={bookmarkSectionTitle}>
              <IconLayers size={12} />
              Saved views
            </span>
            <button
              type="button"
              style={layerInlineActionButton}
              onClick={handleSaveBookmark}
              disabled={bookmarks.length >= maxBookmarks}
              title={bookmarks.length >= maxBookmarks ? `Maximum ${maxBookmarks} saved views reached` : "Save current map view"}
            >
              Save View
            </button>
          </div>
          {bookmarks.length === 0 ? (
            <p style={layerAuxEmpty}>No saved views yet. Save the current map view to return to this viewport and visible-layer set.</p>
          ) : (
            <div style={bookmarkRows} role="list" aria-label="Saved map views">
              {bookmarks.map((bookmark) => (
                <article key={bookmark.id} style={bookmarkRow} role="listitem" data-testid={`map-layer-bookmark-row-${bookmark.id}`}>
                  <IconLayers size={13} color={MAP_COLORS.interaction} />
                  <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                    <span style={bookmarkRowTitle}>{bookmark.name}</span>
                    <span style={bookmarkRowMeta}>
                      {formatBookmarkTimestamp(bookmark.timestamp)} / {bookmark.layers.length} visible layer{bookmark.layers.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <button
                    type="button"
                    style={layerInlineActionButton}
                    onClick={() => onRestoreBookmark(bookmark)}
                    aria-label={`Zoom to saved view ${bookmark.name}`}
                  >
                    Zoom
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={bookmarkSection} aria-label="Pinned locations">
          <div style={bookmarkSectionHeader}>
            <span style={bookmarkSectionTitle}>
              <IconPin size={12} />
              Pins
            </span>
            {pins.length > 0 ? (
              <button type="button" style={layerInlineActionButton} onClick={onClearPins}>
                Clear Pins
              </button>
            ) : null}
          </div>
          {pins.length === 0 ? (
            <p style={layerAuxEmpty}>No pinned locations. Use the pin tool on the map to create zoom targets.</p>
          ) : (
            <div style={bookmarkRows} role="list" aria-label="Pinned map locations">
              {pins.map((pin) => {
                const label = pin.label ?? pin.id;
                return (
                  <article key={pin.id} style={bookmarkRow} role="listitem" data-testid={`map-layer-pin-row-${pin.id}`}>
                    <IconPin size={13} color={MAP_COLORS.interaction} />
                    <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                      <span style={bookmarkRowTitle}>{label}</span>
                      <span style={bookmarkRowMeta}>{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs }}>
                      <button
                        type="button"
                        style={layerInlineActionButton}
                        onClick={() => onFlyTo(pin.lng, pin.lat)}
                        aria-label={`Zoom to pin ${label}`}
                      >
                        Zoom
                      </button>
                      <button
                        type="button"
                        style={{ ...layerInlineActionButton, color: MAP_COLORS.error }}
                        onClick={() => onRemovePin(pin.id)}
                        aria-label={`Remove pin ${label}`}
                      >
                        Remove
                      </button>
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export const MapLayerCartographyPanel: React.FC<MapLayerCartographyPanelProps> = ({
  overlayLayers,
  cartographyReviewState = null,
  activeLayerId = null,
  onActiveLayerChange,
  onOpenSymbology,
  onApplyCartographyRecommendation,
  onDismissCartographyRecommendation,
  onUndoCartographyRecommendation,
  canUndoCartographyRecommendation = false,
  onShowCartographyDetails,
}) => {
  const recommendations = cartographyReviewState?.recommendations ?? [];
  const countsByLayer = useMemo(() => {
    const counts = new Map<string, number>();
    recommendations.forEach((recommendation) => {
      counts.set(recommendation.layerId, (counts.get(recommendation.layerId) ?? 0) + 1);
    });
    return counts;
  }, [recommendations]);
  const scopedRecommendations = activeLayerId
    ? recommendations.filter((recommendation) => recommendation.layerId === activeLayerId)
    : recommendations;
  const scopedLayerName = activeLayerId
    ? overlayLayers.find((layer) => layer.id === activeLayerId)?.name ?? "Selected layer"
    : "Visible map";

  if (!cartographyReviewState || !onApplyCartographyRecommendation || !onDismissCartographyRecommendation) {
    return (
      <section style={layerAuxPanel} aria-label="Layer cartography" data-testid="map-layer-cartography-panel">
        <p style={layerAuxEmpty}>
          Cartography recommendations appear here after the map style review runs for visible layers.
        </p>
      </section>
    );
  }

  return (
    <section style={layerAuxPanel} aria-label="Layer cartography" data-testid="map-layer-cartography-panel">
      <div style={layerAuxSummary} aria-label="Cartography review summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Recommendations</span>
          <span style={mapStyles.sidePanelMetricValue}>{recommendations.length}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Visible layers</span>
          <span style={mapStyles.sidePanelMetricValue}>{cartographyReviewState.metadata.visibleLayerCount}</span>
        </div>
      </div>
      <div style={cartographyScopeRail} aria-label="Cartography recommendation scope">
        <button
          type="button"
          style={activeLayerId === null ? cartographyScopeButtonActive : cartographyScopeButton}
          onClick={() => onActiveLayerChange?.(null)}
        >
          Visible map
        </button>
        {overlayLayers.map((layer) => {
          const count = countsByLayer.get(layer.id) ?? 0;
          return (
            <button
              key={layer.id}
              type="button"
              style={activeLayerId === layer.id ? cartographyScopeButtonActive : cartographyScopeButton}
              title={`${count} recommendation${count === 1 ? "" : "s"} for ${layer.name}`}
              onClick={() => onActiveLayerChange?.(layer.id)}
            >
              {layer.name}{count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
        {activeLayerId && onOpenSymbology ? (
          <button
            type="button"
            style={layerInlineActionButton}
            onClick={() => onOpenSymbology(activeLayerId)}
          >
            Open style
          </button>
        ) : null}
      </div>
      <div style={layerAuxBody}>
        <CartographyRecommendationList
          title={`Cartography / ${scopedLayerName}`}
          recommendations={scopedRecommendations}
          emptyMessage="No pending cartographic issues in this scope."
          maxItems={6}
          canUndo={canUndoCartographyRecommendation}
          onApply={onApplyCartographyRecommendation}
          onDismiss={onDismissCartographyRecommendation}
          {...(onUndoCartographyRecommendation ? { onUndo: onUndoCartographyRecommendation } : {})}
          {...(onShowCartographyDetails ? { onShowDetails: onShowCartographyDetails } : {})}
        />
      </div>
    </section>
  );
};

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
  const registry = normalizeLayerRegistryMetadata(layer);
  const sourceKind = registry.sourceKind;
  const qaStatus = registry.qaStatus;
  const scientificQA = meta?.scientificQA;
  const cartographyReview = meta?.cartographyReview;
  const queryable = registry.queryable;
  const crs = registry.crsSummary.crs ?? "Unknown CRS";
  const provenanceLabel = registry.provenance.label;
  const reportAction = buildLayerEvidenceActions(layer, {
    ...(onAddLayerToReport ? { onAddLayerToReport } : {}),
  }).find((action) => action.id === "report");
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
      <div style={{ fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, color: MAP_COLORS.interaction, marginBottom: 8 }}>
        {layer.name}
      </div>
      {onAddLayerToReport && reportAction ? (
        <button
          type="button"
          style={{
            ...rerunBtn,
            marginBottom: 10,
            ...(reportAction.disabledReason ? layerActionButtonDisabled : {}),
          }}
          onClick={() => reportAction.onSelect?.()}
          disabled={Boolean(reportAction.disabledReason || !reportAction.onSelect)}
          title={reportAction.disabledReason ?? "Add this layer to the report handoff draft."}
          aria-label={reportAction.disabledReason
            ? `Add ${layer.name} to report unavailable: ${reportAction.disabledReason}`
            : `Add ${layer.name} to report`}
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
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: MAP_COLORS.textMuted }}>Publication: </span>
        <span>{PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status]}</span>
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
              aria-label={analysisResult.rerunToken
                ? `Re-run analysis for ${layer.name}`
                : `Re-run analysis for ${layer.name} unavailable: missing rerun token`}
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- overlay click to dismiss
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
  onRequestRemove: (id: string) => void;
  onCancelRemove: (id: string) => void;
  onNameClick: (id: string, top: number) => void;
  onOpenSymbology?: (id: string) => void;
  onExportLayer?: (id: string) => void;
  onSendLayerToUrban?: (id: string) => void;
  onOpenLayerInIde?: (id: string) => void;
  onDeclareLayerCrs?: (id: string, crs: string) => void;
  onInspectLayer?: (id: string) => void;
  onOpenAttributeTable?: (id: string) => void;
  onAddLayerToReport?: (id: string) => void;
  onBindLayerToDashboard?: (id: string) => void;
  onOpenLayerEducationReference?: (id: string) => void;
  onFocusLayer?: (id: string) => void;
  onRepairGeometry?: (id: string) => void;
  onReRunAnalysisLayer?: (id: string, rerunToken?: string | null) => void;
  activeRerunToken?: string | null;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isSymbologyActive?: boolean;
  isRemovePending: boolean;
  cartographyRecommendationCount?: number;
  onReviewCartography?: (id: string) => void;
  onAnnounce?: (msg: string) => void;
  density: MapLayerPanelDensity;
  /** Drag and drop */
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  onToggleVisibility,
  onSetOpacity,
  onRemove,
  onRequestRemove,
  onCancelRemove,
  onNameClick,
  onOpenSymbology,
  onExportLayer,
  onSendLayerToUrban,
  onOpenLayerInIde,
  onDeclareLayerCrs,
  onInspectLayer,
  onOpenAttributeTable,
  onAddLayerToReport,
  onBindLayerToDashboard,
  onFocusLayer,
  onRepairGeometry,
  onReRunAnalysisLayer,
  activeRerunToken = null,
  onMoveLayer,
  canMoveUp,
  canMoveDown,
  onOpenLayerEducationReference,
  isSymbologyActive = false,
  isRemovePending,
  cartographyRecommendationCount = 0,
  onReviewCartography,
  onAnnounce,
  density,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const analysisResult = layer.metadata?.analysisResult;
  const columnar = layer.metadata?.columnar;
  const scientificQA = layer.metadata?.scientificQA;
  const sourceKind = resolveLayerSourceKind(layer);
  const qaStatus = resolveLayerQaStatus(layer);
  const queryable = isLayerQueryable(layer);
  const crs = resolveLayerCrs(layer);
  const registry = normalizeLayerRegistryMetadata(layer);
  const geometryFeatureSummary = formatLayerGeometryFeatureSummary(layer);
  const layerBounds = getLayerBounds(layer);
  const readinessCells = buildLayerReadinessCells(layer);
  const legendPreviewItems = buildMapCompositionLegendItems([{ ...layer, visible: true }]).slice(0, 4);
  const vectorTiles = layer.metadata?.vectorTiles;
  const coreCommandActions = buildLayerCoreCommandActions(layer, {
    ...(onInspectLayer ? { onInspectLayer } : {}),
    ...(onOpenAttributeTable ? { onOpenAttributeTable } : {}),
  });
  const evidenceActions = buildLayerEvidenceActions(layer, {
    ...(onExportLayer ? { onExportLayer } : {}),
    ...(onSendLayerToUrban ? { onSendLayerToUrban } : {}),
    ...(onOpenLayerInIde ? { onOpenLayerInIde } : {}),
    ...(onAddLayerToReport ? { onAddLayerToReport } : {}),
    ...(onBindLayerToDashboard ? { onBindLayerToDashboard } : {}),
    ...(onOpenLayerEducationReference ? { onOpenLayerEducationReference } : {}),
  });
  const repairGeometryAction = buildRepairGeometryAction(layer, onRepairGeometry);
  const utilityActions: LayerEvidenceActionModel[] = [
    {
      id: "locate" as const,
      groupId: "view-focus",
      label: "Locate",
      title: layerBounds ? `Zoom to extent ${formatBounds(layerBounds)}` : "Layer extent metadata is unavailable.",
      ...(!layerBounds
        ? { disabledReason: "Layer extent metadata is unavailable." }
        : onFocusLayer
          ? { onSelect: () => onFocusLayer(layer.id) }
          : { disabledReason: "Focus callback is not connected from the layer rail yet." }),
    },
    {
      id: "move-up" as const,
      groupId: "view-focus",
      label: "Move up",
      title: "Move this layer higher in the drawing order.",
      ...(canMoveUp
        ? { onSelect: () => onMoveLayer(layer.id, "up") }
        : { disabledReason: "Layer is already at the top of the drawing order." }),
    },
    {
      id: "move-down" as const,
      groupId: "view-focus",
      label: "Move down",
      title: "Move this layer lower in the drawing order.",
      ...(canMoveDown
        ? { onSelect: () => onMoveLayer(layer.id, "down") }
        : { disabledReason: "Layer is already at the bottom of the drawing order." }),
    },
    ...(onOpenSymbology
      ? [{
          id: "style" as const,
          groupId: "style" as const,
          label: isSymbologyActive ? "Style active" : "Style",
          title: `Open symbology panel for ${layer.name}`,
          tone: isSymbologyActive ? "warning" as const : "default" as const,
          onSelect: () => onOpenSymbology(layer.id),
        }]
      : [{
          id: "style" as const,
          groupId: "style" as const,
          label: "Style",
          title: "Symbology is unavailable for this layer from the layer rail.",
          disabledReason: "Symbology is unavailable for this layer from the layer rail.",
        }]),
    ...(onReviewCartography
      ? [{
          id: "review" as const,
          groupId: "style" as const,
          label: cartographyRecommendationCount > 0 ? `Review ${cartographyRecommendationCount}` : "Review",
          title: `Review symbology for ${layer.name}`,
          tone: cartographyRecommendationCount > 0 ? "warning" as const : "default" as const,
          onSelect: () => onReviewCartography(layer.id),
        }]
      : [{
          id: "review" as const,
          groupId: "style" as const,
          label: "Review",
          title: "Cartography review is not connected from the layer rail yet.",
          disabledReason: "Cartography review is not connected from the layer rail yet.",
        }]),
    repairGeometryAction,
    buildLayerRerunAction(layer, onReRunAnalysisLayer, activeRerunToken),
  ];
  const removalActions: LayerEvidenceActionModel[] = isRemovePending
    ? [
        {
          id: "confirm-remove",
          groupId: "cache-remove",
          label: "Confirm delete",
          title: "Confirm layer removal",
          tone: "danger",
          onSelect: () => onRemove(layer.id),
        },
        {
          id: "cancel-remove",
          groupId: "cache-remove",
          label: "Cancel",
          title: "Cancel layer removal",
          onSelect: () => onCancelRemove(layer.id),
        },
      ]
    : [{
        id: "remove",
        groupId: "cache-remove",
        label: "Delete",
        title: "Remove layer",
        tone: "danger",
        onSelect: () => onRequestRemove(layer.id),
      }];
  const rowActions = [...coreCommandActions, ...utilityActions, ...evidenceActions, ...removalActions];
  const menuActions = rowActions;
  const importFormat = formatImportSourceLabel(layer.metadata?.importFormat);
  const restoreStatus = resolveLayerSourceRestoreStatus(layer);
  const sourceRestoreLabel = restoreStatus ? SOURCE_RESTORE_STATUS_LABELS[restoreStatus] : "unregistered";
  const geometryChip = formatLayerGeometryChip(layer);
  const outputMode = analysisResult?.outputMode;
  const detailSummary = [
    SOURCE_KIND_LABELS[sourceKind],
    restoreStatus ? SOURCE_RESTORE_STATUS_LABELS[restoreStatus] : null,
    importFormat,
    qaStatus === "unchecked" ? null : QA_STATUS_LABELS[qaStatus],
    scientificQA?.featureIssueCount ? `${scientificQA.featureIssueCount.toLocaleString()} QA feature issue(s)` : null,
    queryable ? "queryable" : null,
    geometryFeatureSummary,
    crs,
  ].filter(Boolean).join(" / ");

  const handleNameClick = useCallback(() => {
    const top = rowRef.current?.offsetTop ?? 0;
    onNameClick(layer.id, top);
  }, [layer.id, onNameClick]);

  const shouldEmphasizeRow = detailsOpen || isSymbologyActive || isRemovePending;
  const alwaysVisibleSummary = [
    geometryFeatureSummary,
    registry.publicationReadiness.status === "blocked"
      ? "publish blocked"
      : registry.publicationReadiness.status === "needs-review"
        ? "publish review"
        : null,
    queryable ? "queryable" : "not queryable",
  ].filter(Boolean).join(" / ");

  return (
    <div
      ref={rowRef}
      style={{
        ...(isDragging ? layerRowDragging : layerRow),
        ...(density === "comfortable" ? layerRowComfortable : {}),
        ...(isDropTarget ? layerRowDropTarget : {}),
        ...(shouldEmphasizeRow ? layerActiveState : {}),
      }}
      className={motionStyles.layerFade}
      data-layer-row-density={density}
      data-layer-drop-target={isDropTarget ? "true" : undefined}
      draggable
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={(e) => onDragOver(e, layer.id)}
      onDrop={(e) => onDrop(e, layer.id)}
      onDragEnd={onDragEnd}
      role="listitem"
      aria-label={`Layer: ${layer.name}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isRemovePending) {
          onCancelRemove(layer.id);
        }
      }}
    >
      <button
        type="button"
        style={visibilityBtn}
        onClick={() => onToggleVisibility(layer.id)}
        aria-label={`${layer.visible ? "Hide" : "Show"} layer ${layer.name}`}
        aria-pressed={layer.visible}
      >
        <span style={{ color: layer.visible ? MAP_COLORS.interaction : MAP_COLORS.textMuted, display: "inline-flex", alignItems: "center" }}>
          {layer.visible ? <IconEyeOpen size={13} /> : <IconEyeClosed size={13} />}
        </span>
      </button>
      <div style={layerContent}>
        <div style={layerNameLine}>
          <span style={layerDragHandle} aria-hidden="true" title="Drag to reorder">
            ::
          </span>
          <span style={layerTypeIconShell} title={`${geometryChip} layer type`} aria-hidden="true">
            <LayerGeometryIcon layer={layer} />
          </span>
          <button
            type="button"
            style={layerNameButton}
            onClick={handleNameClick}
            title="Show layer details"
            aria-label={`Show metadata for ${layer.name}`}
          >
            <span style={layerName}>{layer.name}</span>
          </button>
          <LayerBadge
            badge={{
              id: "geometry",
              label: geometryChip,
              title: `Geometry/type: ${geometryChip}.`,
              tone: geometryChip === layer.type ? "neutral" : "info",
            }}
          />
        </div>

        <div style={layerModeRail} aria-label={`Layer mode and caveat badges for ${layer.name}`}>
          <LayerBadge
            badge={{
              id: "source",
              label: `${SOURCE_KIND_LABELS[sourceKind]} / ${sourceRestoreLabel}`,
              title: `Source kind: ${SOURCE_KIND_LABELS[sourceKind]}. Restore state: ${sourceRestoreLabel}.`,
              tone: sourceRestoreBadgeTone(restoreStatus, sourceKind),
            }}
          />
          <LayerBadge
            badge={{
              id: "crs",
              label: buildCrsReadinessValue(layer),
              title: registry.crsSummary.notes.length > 0
                ? registry.crsSummary.notes.join(" ")
                : `CRS status: ${buildCrsReadinessValue(layer)}.`,
              tone: registry.crsSummary.status === "known"
                ? (registry.crsSummary.source === "user-declared" ? "warning" : "good")
                : "error",
            }}
          />
          <LayerBadge
            badge={{
              id: "qa",
              label: QA_STATUS_LABELS[qaStatus],
              title: `Scientific QA status: ${QA_STATUS_LABELS[qaStatus]}.`,
              tone: qaBadgeTone(qaStatus),
            }}
          />
          {isSymbologyActive ? (
            <span style={staleChip} title="This layer is active in the style workspace">
              Active style
            </span>
          ) : null}
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
          {outputMode === "demo" || outputMode === "synthetic" ? (
            <span
              style={outputMode === "synthetic" ? scientificQaBadgeStyle("uncertain_output") : scientificQaBadgeStyle("sample_data")}
              title={`Analysis output mode: ${outputMode}.`}
            >
              {outputMode === "synthetic" ? "Synthetic output" : "Demo output"}
            </span>
          ) : null}
          <span
            style={queryable ? layerBadgeBase : { ...layerBadgeBase, ...layerBadgeToneStyle("warning") }}
            title={queryable ? "Layer is queryable from the map registry." : "Layer is not queryable from the map registry."}
          >
            {queryable ? "queryable" : "not queryable"}
          </span>
          {vectorTiles?.generalization === "zoom-dependent" ? (
            <span
              style={scientificQaBadgeStyle("uncertain_output")}
              title={vectorTiles.caveats.join(" ") || "Layer is rendered from generalized vector tiles at low zoom."}
            >
              {vectorTiles.caveatLabel || MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL}
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

        <div style={layerPrimarySummaryRow} aria-label={`Layer summary for ${layer.name}`}>
          {alwaysVisibleSummary ? (
            <span style={layerMetaText} title={detailSummary}>{alwaysVisibleSummary}</span>
          ) : null}
          <button
            type="button"
            style={layerAdvancedSummary}
            aria-expanded={detailsOpen}
            aria-label={`${detailsOpen ? "Hide" : "Show"} advanced layer details for ${layer.name}`}
            data-testid={`map-layer-details-toggle-${layer.id}`}
            onClick={() => setDetailsOpen((current) => !current)}
          >
            <span>{detailsOpen ? "Hide details" : "Show details"}</span>
          </button>
        </div>

        {onDeclareLayerCrs && (registry.crsSummary.status !== "known" || registry.crsSummary.source === "user-declared") ? (
          <div style={{ marginTop: MAP_SPACING.xs }}>
            <DeclareCrsControl
              layerId={layer.id}
              layerName={layer.name}
              currentCrs={registry.crsSummary.crs}
              isUserDeclared={registry.crsSummary.source === "user-declared"}
              bounds={layerBounds}
              onDeclare={onDeclareLayerCrs}
              {...(onAnnounce ? { onAnnounce } : {})}
            />
          </div>
        ) : null}

        <div
          style={{ ...layerAdvancedDetails, display: detailsOpen ? "grid" : "none" }}
          data-testid={`map-layer-advanced-details-${layer.id}`}
          hidden={!detailsOpen}
        >
            <div style={layerReadinessGrid} aria-label={`Layer readiness for ${layer.name}: ${detailSummary}`}>
              {readinessCells.map((cell) => (
                <LayerReadinessCell key={cell.id} layerId={layer.id} cell={cell} />
              ))}
            </div>

            {legendPreviewItems.length > 0 ? (
              <div style={layerLegendPreview} aria-label={`Layer legend for ${layer.name}`}>
                {legendPreviewItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} style={layerLegendPreviewRow}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 10,
                        height: item.kind === "line" ? 2 : 10,
                        borderRadius: item.kind === "circle" || item.kind === "dot-density" ? MAP_RADIUS.full : MAP_RADIUS.xs,
                        background: item.kind === "label" ? MAP_COLORS.transparent : item.color,
                        border: MAP_STROKES.hairlineSubtle,
                        color: item.color,
                        fontSize: 9,
                        fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
                        lineHeight: 1,
                      }}
                    >
                      {item.kind === "label" ? "Aa" : null}
                    </span>
                    <span style={layerLegendPreviewLabel} title={item.secondaryLabel ? `${item.label} / ${item.secondaryLabel}` : item.label}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

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
        </div>

        <div style={layerControlRow}>
          <span style={opacityValueLabel}>{Math.round(layer.opacity * 100)}%</span>
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
      <LayerActionMenu
        layerName={layer.name}
        actions={menuActions}
        forceOpen={isRemovePending}
        {...(onAnnounce ? { onAnnounce } : {})}
      />
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
  onExportLayer,
  onSendLayerToUrban,
  onOpenLayerInIde,
  onDeclareLayerCrs,
  onInspectLayer,
  onOpenAttributeTable,
  onBindLayerToDashboard,
  onOpenLayerEducationReference,
  onFocusLayer,
  onRepairGeometry,
  selectedFeatureCount = 0,
  qaIssueCount = 0,
  qaBlockerCount = 0,
  onOpenSourcesSection,
  onOpenContentsSection,
  onOpenSelectionDetail,
  onOpenLayerQaDetail,
  onClearLayerCache,
  activeRerunToken = null,
  onOpenSymbology,
  activeSymbologyLayerId = null,
  cartographyReviewState = null,
  onApplyCartographyRecommendation,
  onDismissCartographyRecommendation,
  onUndoCartographyRecommendation,
  canUndoCartographyRecommendation = false,
  onShowCartographyDetails,
  onOpenCartographyReviewScope,
  presentation = "standalone",
  cartographyReviewPlacement = "inline",
  onRequestClose,
  panelStyle,
  density = "compact",
  onAnnounce,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [popoverLayerId, setPopoverLayerId] = useState<string | null>(null);
  const [popoverTop, setPopoverTop] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [fileDropActive, setFileDropActive] = useState(false);
  const [query, setQuery] = useState("");
  const [cartographyPanelOpen, setCartographyPanelOpen] = useState(false);
  const [cartographyLayerFilterId, setCartographyLayerFilterId] = useState<string | null>(null);
  const [pendingRemoveLayerId, setPendingRemoveLayerId] = useState<string | null>(null);
  const [pendingClearLayerCache, setPendingClearLayerCache] = useState(false);
  const hasSearch = query.trim().length > 0;

  const filteredOverlayLayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return overlayLayers.filter((layer) => {
      if (!normalizedQuery) {
        return true;
      }

      const registry = normalizeLayerRegistryMetadata(layer);

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
        registry.publicationReadiness.status,
        PUBLICATION_READINESS_LABELS[registry.publicationReadiness.status],
        ...registry.readiness.missingFields.map(formatMetadataField),
        ...registry.publicationReadiness.caveats,
        layer.metadata?.geometryType,
        formatImportSourceLabel(layer.metadata?.importFormat),
        layer.metadata?.columnar?.format,
        layer.metadata?.columnar?.geometryColumn,
        layer.metadata?.columnar?.workerTableName,
        layer.metadata?.sourceId,
        layer.metadata?.sourceStorageMode,
        layer.metadata?.sourceRestoreStatus,
        layer.metadata?.persistence?.sourceRestoreStatus,
        layer.metadata?.persistence?.restoreState,
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

  const sourceBackedLayerCount = useMemo(
    () => overlayLayers.filter((layer) => {
      const sourceKind = resolveLayerSourceKind(layer);
      return sourceKind !== "derived" || Boolean(layer.metadata?.sourceId) || Boolean(layer.provenance?.sourceName);
    }).length,
    [overlayLayers],
  );

  const queryableLayerCount = useMemo(
    () => overlayLayers.filter((layer) => isLayerQueryable(layer)).length,
    [overlayLayers],
  );

  const layerWarningCount = useMemo(
    () => overlayLayers.filter((layer) => {
      const registry = normalizeLayerRegistryMetadata(layer);
      return registry.qaStatus === "warning" || registry.qaStatus === "error" || registry.crsSummary.status !== "known";
    }).length,
    [overlayLayers],
  );

  const layerSectionCards: LayerSectionCardModel[] = [
    {
      id: "layers",
      title: "Layers",
      value: `${layerSummary.visible}/${layerSummary.total} visible`,
      detail: `${layerSummary.data} data / ${layerSummary.analysis} analysis`,
    },
    {
      id: "sources",
      title: "Sources",
      value: `${sourceBackedLayerCount} registered`,
      detail: `${Math.max(0, overlayLayers.length - sourceBackedLayerCount)} need source context`,
      ...(onOpenSourcesSection ? { actionLabel: "Open sources", onAction: onOpenSourcesSection } : {}),
    },
    {
      id: "contents",
      title: "Contents",
      value: `${queryableLayerCount} queryable`,
      detail: `${overlayLayers.length - queryableLayerCount} non-queryable`,
      ...(onOpenContentsSection ? { actionLabel: "Open contents", onAction: onOpenContentsSection } : {}),
    },
    {
      id: "selection",
      title: "Selection",
      value: `${selectedFeatureCount.toLocaleString()} selected`,
      detail: selectedFeatureCount > 0 ? "Selection tools and right-dock detail available" : "No active feature selection",
      ...(onOpenSelectionDetail ? { actionLabel: "Open selection", onAction: onOpenSelectionDetail } : {}),
    },
    {
      id: "layer-qa",
      title: "Layer QA",
      value: qaBlockerCount > 0 ? `${qaBlockerCount} blocked` : `${qaIssueCount} issues`,
      detail: `${layerWarningCount} layer warning${layerWarningCount === 1 ? "" : "s"} currently visible`,
      ...(onOpenLayerQaDetail ? { actionLabel: "Open QA", onAction: onOpenLayerQaDetail } : {}),
    },
  ];

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

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDropTargetId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDropTargetId(null);
      return;
    }

    const ids = overlayLayers.map((l) => l.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDropTargetId(null);
      return;
    }

    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId);
    onReorderLayers(reordered);
    onAnnounce?.("Layer order updated");
    setDragId(null);
    setDropTargetId(null);
  }, [dragId, overlayLayers, onReorderLayers, onAnnounce]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropTargetId(null);
  }, []);

  const handlePanelDragEnter = useCallback((event: React.DragEvent) => {
    if (hasFileDrag(event)) {
      setFileDropActive(true);
    }
  }, []);

  const handlePanelDragOver = useCallback((event: React.DragEvent) => {
    if (hasFileDrag(event)) {
      setFileDropActive(true);
    }
  }, []);

  const handlePanelDragLeave = useCallback((event: React.DragEvent) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setFileDropActive(false);
  }, []);

  const handlePanelDrop = useCallback(() => {
    setFileDropActive(false);
  }, []);

  const handleMoveLayer = useCallback((id: string, direction: "up" | "down") => {
    const ids = overlayLayers.map((layer) => layer.id);
    const fromIdx = ids.indexOf(id);
    if (fromIdx < 0) return;

    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    const layer = overlayLayers[fromIdx];
    if (toIdx < 0 || toIdx >= ids.length) {
      onAnnounce?.(`${layer?.name ?? "Layer"} is already at the ${direction === "up" ? "top" : "bottom"} of the drawing order`);
      return;
    }

    const reordered = [...ids];
    const [moved] = reordered.splice(fromIdx, 1);
    if (!moved) return;
    reordered.splice(toIdx, 0, moved);
    onReorderLayers(reordered);
    onAnnounce?.(`${layer?.name ?? "Layer"} moved ${direction} in the layer stack`);
  }, [onAnnounce, onReorderLayers, overlayLayers]);

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

  const handleRequestRemove = useCallback((id: string) => {
    const layer = overlayLayers.find((entry) => entry.id === id);
    setPendingRemoveLayerId(id);
    onAnnounce?.(`Confirm removal for layer "${layer?.name ?? id}"`);
  }, [onAnnounce, overlayLayers]);

  const handleCancelRemove = useCallback((id: string) => {
    setPendingRemoveLayerId((current) => (current === id ? null : current));
    const layer = overlayLayers.find((entry) => entry.id === id);
    onAnnounce?.(`Removal cancelled for layer "${layer?.name ?? id}"`);
  }, [onAnnounce, overlayLayers]);

  const handleOpenCartographyReview = useCallback((layerId: string | null) => {
    if (onOpenCartographyReviewScope) {
      onOpenCartographyReviewScope(layerId);
      return;
    }
    setCartographyLayerFilterId(layerId);
    setCartographyPanelOpen(true);
    const layerName = layerId
      ? overlayLayers.find((layer) => layer.id === layerId)?.name ?? "selected layer"
      : "visible map";
    onAnnounce?.(`Symbology review opened for ${layerName}`);
  }, [onAnnounce, onOpenCartographyReviewScope, overlayLayers]);

  /* ---- Remove with announcement ---- */
  const handleRemove = useCallback((id: string) => {
    const layer = overlayLayers.find((l) => l.id === id);
    onRemoveLayer(id);
    setPopoverLayerId(null);
    setPendingRemoveLayerId(null);
    onAnnounce?.(`Layer "${layer?.name ?? id}" removed`);
  }, [onRemoveLayer, overlayLayers, onAnnounce]);

  const handleClearLayerCacheClick = useCallback(() => {
    if (!onClearLayerCache) {
      return;
    }

    if (!pendingClearLayerCache) {
      setPendingClearLayerCache(true);
      onAnnounce?.("Confirm clearing Map Explorer layer cache.");
      return;
    }

    onClearLayerCache();
    setPendingClearLayerCache(false);
  }, [onAnnounce, onClearLayerCache, pendingClearLayerCache]);

  /* ---- Popover layer data ---- */
  const popoverLayer = popoverLayerId
    ? overlayLayers.find((l) => l.id === popoverLayerId) ?? null
    : null;

  /* ---- Collapsed state ---- */
  if (collapsed && presentation !== "embedded") {
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
    <div
      style={{ ...(presentation === "embedded" ? panelContainerEmbedded : panelContainer), position: "relative", ...panelStyle }}
      role="region"
      aria-label="Layer management panel"
      data-presentation={presentation}
      data-layer-panel-density={density}
      onDragEnter={handlePanelDragEnter}
      onDragOver={handlePanelDragOver}
      onDragLeave={handlePanelDragLeave}
      onDrop={handlePanelDrop}
    >
      {/* Panel header */}
      {presentation === "standalone" ? (
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
      ) : null}

      {/* The Visible/Data/Analysis strip duplicated the "Layers" section card
          and the rail header counts; removed to declutter the composition
          dock so the layer tree leads. */}
      <div style={layerSectionGrid} aria-label="Layer workspace sections" data-testid="map-layer-section-grid">
        {layerSectionCards.map((section, index) => (
          <section
            key={section.id}
            style={index === 0 ? { ...layerSectionCard, borderTop: MAP_STROKES.none } : layerSectionCard}
            aria-label={`${section.title} summary`}
            data-testid={`map-layer-section-${section.id}`}
          >
            <div style={layerSectionCardHeader}>
              <span style={layerSectionCardTitle}>{section.title}</span>
              <span style={layerSectionCardValue}>{section.value}</span>
            </div>
            <div style={layerSectionCardHeader}>
              <span style={layerSectionCardDetail}>{section.detail}</span>
              {section.actionLabel && section.onAction ? (
                <button
                  type="button"
                  style={layerSectionCardAction}
                  onClick={section.onAction}
                  data-testid={`map-layer-section-action-${section.id}`}
                >
                  {section.actionLabel}
                </button>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {cartographyReviewPlacement === "inline" && cartographyReviewState && onApplyCartographyRecommendation && onDismissCartographyRecommendation ? (
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
            <span>
              {hasSearch
                ? "No layers match the current search. Clear the search or add a layer whose name, CRS, source, or field metadata matches."
                : "Drop files on the map or use Add Data to enable layer controls, QA, comparison, and report handoff."}
            </span>
            {!hasSearch ? (
              <button
                type="button"
                style={{ ...layerInlineActionButton, marginTop: MAP_SPACING.sm }}
                onClick={() => setShowAddDialog(true)}
              >
                Add Data
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Data Layers + Analysis Results groups */}
        {GROUP_ORDER.map((groupId) => (
          <React.Fragment key={groupId}>
            {grouped[groupId].length > 0 ? (
              <>
                <div style={groupHeader}>{GROUP_LABELS[groupId]}</div>
                {grouped[groupId].map((layer) => (
                  (() => {
                    const layerIndex = overlayLayers.findIndex((entry) => entry.id === layer.id);
                    return (
                      <LayerRow
                        key={layer.id}
                        layer={layer}
                        onToggleVisibility={handleToggle}
                        onSetOpacity={onSetOpacity}
                        onRemove={handleRemove}
                        onRequestRemove={handleRequestRemove}
                        onCancelRemove={handleCancelRemove}
                        onNameClick={handleNameClick}
                        onMoveLayer={handleMoveLayer}
                        canMoveUp={layerIndex > 0}
                        canMoveDown={layerIndex >= 0 && layerIndex < overlayLayers.length - 1}
                        isSymbologyActive={activeSymbologyLayerId === layer.id}
                        isRemovePending={pendingRemoveLayerId === layer.id}
                        cartographyRecommendationCount={cartographyRecommendationCountByLayer.get(layer.id) ?? 0}
                        {...(cartographyReviewState ? { onReviewCartography: handleOpenCartographyReview } : {})}
                        {...(onExportLayer ? { onExportLayer } : {})}
                        {...(onSendLayerToUrban ? { onSendLayerToUrban } : {})}
                        {...(onOpenLayerInIde ? { onOpenLayerInIde } : {})}
                        {...(onDeclareLayerCrs ? { onDeclareLayerCrs } : {})}
                        {...(onInspectLayer ? { onInspectLayer } : {})}
                        {...(onOpenAttributeTable ? { onOpenAttributeTable } : {})}
                        {...(onAddLayerToReport ? { onAddLayerToReport } : {})}
                        {...(onBindLayerToDashboard ? { onBindLayerToDashboard } : {})}
                        {...(onOpenLayerEducationReference ? { onOpenLayerEducationReference } : {})}
                        {...(onFocusLayer ? { onFocusLayer } : {})}
                        {...(onRepairGeometry ? { onRepairGeometry } : {})}
                        activeRerunToken={activeRerunToken}
                        {...(onReRunAnalysisLayer ? { onReRunAnalysisLayer } : {})}
                        {...(onAnnounce ? { onAnnounce } : {})}
                        density={density}
                        isDragging={dragId === layer.id}
                        isDropTarget={dropTargetId === layer.id && dragId !== layer.id}
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
                    );
                  })()
                ))}
              </>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {/* Add layer actions */}
      <div style={layerFooterActions}>
        <div style={layerFooterStatusLine}>
          <span>{selectedFeatureCount.toLocaleString()} selected</span>
          <span>{layerSummary.visible.toLocaleString()} / {layerSummary.total.toLocaleString()} visible layers</span>
        </div>
        <button
          type="button"
          style={addManualLayerBtn}
          onClick={() => setShowAddDialog(true)}
          aria-label="Add a new layer"
          title="Add Layer / Add Data"
        >
          Add Data
        </button>
        {onClearLayerCache ? (
          <button
            type="button"
            style={pendingClearLayerCache ? clearLayerCacheConfirmBtn : clearLayerCacheBtn}
            onClick={handleClearLayerCacheClick}
            aria-label={pendingClearLayerCache
              ? "Confirm clearing Map Explorer layers and project map cache"
              : "Clear Map Explorer layer cache"}
            data-testid="map-layer-cache-clear-button"
            title="Removes active overlay layers and cached project map snapshots. Urban evidence, reports, and unrelated browser storage are not deleted."
          >
            {pendingClearLayerCache ? "Confirm Clear" : "Clear Cache"}
          </button>
        ) : null}
      </div>

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
      {fileDropActive ? (
        <div style={fileDropOverlay} aria-hidden="true">
          Drop files on the map or use Add Data
        </div>
      ) : null}
    </div>
  );
};
