import React from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  Circle,
  CircleDot,
  Command,
  Compass,
  Download,
  FileImage,
  FileJson,
  FileText,
  Focus,
  FolderOpen,
  GitBranch,
  Globe2,
  History,
  Keyboard,
  Layers3,
  Link2,
  MapPin,
  Palette,
  PanelTop,
  Pentagon,
  Pencil,
  Puzzle,
  RectangleHorizontal,
  Redo2,
  Route,
  Ruler,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Square,
  Target,
  Type,
  Undo2,
  Upload,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ProcessingToolDescriptor, ToolParameterDescriptor } from "@/services/map/contracts/gisContracts";
import {
  formatMapKeybinding,
  groupMapPaletteCommandsByTaxonomy,
  isEditableShortcutTarget,
  isMapRedoShortcut,
  isMapUndoShortcut,
  isOpenPaletteShortcut,
  MAP_COMMAND_TAXONOMY_META,
  MAP_COMMAND_TAXONOMY_ORDER,
  searchMapPaletteCommands,
  shouldIgnoreMapPaletteShortcut,
  type MapCommandTaxonomyId,
  type MapPaletteSearchCommand,
} from "@/services/map/commands/MapCommandPalette";
import BackgroundTasksControl from "../BackgroundTasksControl";
import {
  useMapToolbarPreferencesStore,
  type MapToolbarDensityPreference,
} from "../../../stores/useMapToolbarPreferencesStore";
import type { DrawToolId, LayerQaStatus, MeasureToolId } from "./mapTypes";
import type { MapWorkspaceView } from "./mapExperience";
import {
  MAP_RUNTIME_TASK_LENSES,
  type MapTaskLensId,
} from "./mapActivityRuntime";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapToolbarProps {
  workspaceView?: MapWorkspaceView;
  onWorkspaceViewChange?: (view: MapWorkspaceView) => void;
  taskLens?: MapTaskLensId;
  onTaskLensChange?: (lens: MapTaskLensId) => void;
  onResetLayout?: () => void;
  onCollapsePanels?: () => void;
  onFocusMapCanvas?: () => void;
  onRestoreDefaultWidths?: () => void;
  pinMode: boolean;
  onTogglePinMode: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  pinCount: number;
  showLayerPanel?: boolean;
  onToggleLayerPanel?: () => void;
  layerCount?: number;
  visibleLayerCount?: number;
  showCatalog?: boolean;
  onToggleCatalog?: () => void;
  catalogSourceCount?: number;
  showContents?: boolean;
  onToggleContents?: () => void;
  activeLayerGeometryType?: string | null;
  hasSelectedAoi?: boolean;
  scientificQAStatus?: LayerQaStatus;
  scientificQAIssueCount?: number;
  scientificQABlockerCount?: number;
  showScientificQAPanel?: boolean;
  onToggleScientificQAPanel?: () => void;
  showNLQueryPanel?: boolean;
  onToggleNLQueryPanel?: () => void;
  nlQueryLayerCount?: number;
  showWorkflowDrawer?: boolean;
  onToggleWorkflowDrawer?: () => void;
  workflowReadyCount?: number;
  showReviewTimeline?: boolean;
  onToggleReviewTimeline?: () => void;
  reviewEventCount?: number;
  showPerformanceDiagnostics?: boolean;
  onTogglePerformanceDiagnostics?: () => void;
  performanceIssueCount?: number;
  showPluginPanel?: boolean;
  onTogglePluginPanel?: () => void;
  pluginExtensionCount?: number;
  showProcessingToolbox?: boolean;
  onToggleProcessingToolbox?: () => void;
  processingToolCount?: number;
  showModelBuilder?: boolean;
  onToggleModelBuilder?: () => void;
  showFigureComposer?: boolean;
  onToggleFigureComposer?: () => void;
  showChoroplethPanel?: boolean;
  onToggleChoroplethPanel?: () => void;
  showClusterViz?: boolean;
  onToggleClusterViz?: () => void;
  showHotSpotViz?: boolean;
  onToggleHotSpotViz?: () => void;
  showEmergingHotSpotViz?: boolean;
  onToggleEmergingHotSpotViz?: () => void;
  viewportSyncEnabled?: boolean;
  onToggleViewportSync?: () => void;
  showVoxCityOverlayPanel?: boolean;
  onToggleVoxCityOverlayPanel?: () => void;
  voxCityFootprintCount?: number;
  restrictToMapView?: boolean;
  onToggleRestrictToMapView?: () => void;
  activeDrawTool?: DrawToolId | null;
  onSetDrawTool?: (tool: DrawToolId | null) => void;
  drawnFeatureCount?: number;
  showDrawPanel?: boolean;
  onToggleDrawPanel?: () => void;
  annotationMode?: boolean;
  onToggleAnnotationMode?: () => void;
  annotationCount?: number;
  activeMeasureTool?: MeasureToolId | null;
  onSetMeasureTool?: (tool: MeasureToolId | null) => void;
  measurementCount?: number;
  showMeasurePanel?: boolean;
  onToggleMeasurePanel?: () => void;
  onImportClick?: () => void;
  onOpenExternalServices?: () => void;
  onExportClick?: () => void;
  onImageExportClick?: () => void;
  onExportPackageClick?: () => void;
  onAddToReportClick?: () => void;
  onSaveProjectClick?: () => void;
  onLoadProjectClick?: () => void;
  isImporting?: boolean;
  importProgress?: number | null;
  exportDisabled?: boolean;
  exportDisabledReason?: string | undefined;
  packageExportDisabled?: boolean;
  packageExportDisabledReason?: string | undefined;
  reportDisabled?: boolean;
  reportDisabledReason?: string | undefined;
  isExportingImage?: boolean;
  isExportingPackage?: boolean;
  isSavingProject?: boolean;
  isLoadingProject?: boolean;
  persistenceDisabled?: boolean;
  hasUnsavedProjectChanges?: boolean;
  processingTools?: readonly ProcessingToolDescriptor[];
  processingLayerOptions?: readonly ProcessingPaletteLayerOption[];
  onRunProcessingToolCommand?: (toolId: string, params: Record<string, string | number | boolean>) => void;
  canUndoMapAction?: boolean;
  canRedoMapAction?: boolean;
  undoMapActionLabel?: string | null;
  redoMapActionLabel?: string | null;
  onUndoMapAction?: () => void;
  onRedoMapAction?: () => void;
}

type CommandTone = "default" | "accent" | "danger" | "success" | "warning";
type ToolbarRole = "explore" | "analyze" | "publish";
type ToolbarDensity = MapToolbarDensityPreference;
type ToolbarBreakpoint = "mobile" | "tablet" | "desktop";
type OverflowGroupId = "tools" | "export" | "advanced";
type CommandTaxonomyId = MapCommandTaxonomyId;
type TopSurfaceGroupId = "data" | "view" | "analyze" | "evidence" | "publish" | "advanced";

interface ToolbarCommand {
  id: string;
  label: string;
  shortLabel: string;
  title: string;
  keywords: readonly string[];
  icon: LucideIcon;
  onClick: () => void;
  roles: readonly ToolbarRole[];
  overflowGroup: OverflowGroupId;
  priority: number;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string | undefined;
  badge?: number | string | null;
  tone?: CommandTone;
  contextBoost?: "empty" | "point" | "polygon" | "aoi" | "quality" | "query" | undefined;
  navigator?: boolean;
  shortcut?: string;
}

export interface ProcessingPaletteLayerOption {
  id: string;
  name: string;
  fields: readonly string[];
}

type PaletteCommandSource = "toolbar" | "processing-tool";

interface PaletteCommand extends ToolbarCommand, MapPaletteSearchCommand {
  category: string;
  source: PaletteCommandSource;
  taxonomy: CommandTaxonomyId;
  processingToolId?: string;
}

interface ToolbarCommandButtonProps {
  command: ToolbarCommand;
  density: ToolbarDensity;
  menuItem?: boolean;
  primary?: boolean;
  onAfterClick?: () => void;
}

interface BuildToolbarCommandsArgs extends Required<Pick<
  MapToolbarProps,
  | "workspaceView"
  | "pinMode"
  | "onTogglePinMode"
  | "showSidebar"
  | "onToggleSidebar"
  | "pinCount"
  | "showLayerPanel"
  | "layerCount"
  | "visibleLayerCount"
  | "showCatalog"
  | "catalogSourceCount"
  | "showContents"
  | "activeLayerGeometryType"
  | "hasSelectedAoi"
  | "scientificQAStatus"
  | "scientificQAIssueCount"
  | "scientificQABlockerCount"
  | "showScientificQAPanel"
  | "showNLQueryPanel"
  | "nlQueryLayerCount"
  | "showWorkflowDrawer"
  | "workflowReadyCount"
  | "showReviewTimeline"
  | "reviewEventCount"
  | "showPerformanceDiagnostics"
  | "performanceIssueCount"
  | "showPluginPanel"
  | "pluginExtensionCount"
  | "showProcessingToolbox"
  | "processingToolCount"
  | "showModelBuilder"
  | "showFigureComposer"
  | "showChoroplethPanel"
  | "showClusterViz"
  | "showHotSpotViz"
  | "showEmergingHotSpotViz"
  | "viewportSyncEnabled"
  | "showVoxCityOverlayPanel"
  | "voxCityFootprintCount"
  | "restrictToMapView"
  | "activeDrawTool"
  | "drawnFeatureCount"
  | "showDrawPanel"
  | "annotationMode"
  | "annotationCount"
  | "activeMeasureTool"
  | "measurementCount"
  | "showMeasurePanel"
  | "isImporting"
  | "exportDisabled"
  | "exportDisabledReason"
  | "packageExportDisabled"
  | "packageExportDisabledReason"
  | "reportDisabled"
  | "reportDisabledReason"
  | "isExportingImage"
  | "isExportingPackage"
  | "isSavingProject"
  | "isLoadingProject"
  | "persistenceDisabled"
  | "hasUnsavedProjectChanges"
  | "canUndoMapAction"
  | "canRedoMapAction"
  | "undoMapActionLabel"
  | "redoMapActionLabel"
>> {
  importProgress: number | null;
  onUndoMapAction?: (() => void) | undefined;
  onRedoMapAction?: (() => void) | undefined;
  onWorkspaceViewChange?: ((view: MapWorkspaceView) => void) | undefined;
  onToggleLayerPanel?: (() => void) | undefined;
  onToggleCatalog?: (() => void) | undefined;
  onToggleContents?: (() => void) | undefined;
  onToggleScientificQAPanel?: (() => void) | undefined;
  onToggleNLQueryPanel?: (() => void) | undefined;
  onToggleWorkflowDrawer?: (() => void) | undefined;
  onToggleReviewTimeline?: (() => void) | undefined;
  onTogglePerformanceDiagnostics?: (() => void) | undefined;
  onTogglePluginPanel?: (() => void) | undefined;
  onToggleProcessingToolbox?: (() => void) | undefined;
  onToggleModelBuilder?: (() => void) | undefined;
  onToggleFigureComposer?: (() => void) | undefined;
  onToggleChoroplethPanel?: (() => void) | undefined;
  onToggleClusterViz?: (() => void) | undefined;
  onToggleHotSpotViz?: (() => void) | undefined;
  onToggleEmergingHotSpotViz?: (() => void) | undefined;
  onToggleViewportSync?: (() => void) | undefined;
  onToggleVoxCityOverlayPanel?: (() => void) | undefined;
  onToggleRestrictToMapView?: (() => void) | undefined;
  onSetDrawTool?: ((tool: DrawToolId | null) => void) | undefined;
  onToggleDrawPanel?: (() => void) | undefined;
  onToggleAnnotationMode?: (() => void) | undefined;
  onSetMeasureTool?: ((tool: MeasureToolId | null) => void) | undefined;
  onToggleMeasurePanel?: (() => void) | undefined;
  onImportClick?: (() => void) | undefined;
  onOpenExternalServices?: (() => void) | undefined;
  onExportClick?: (() => void) | undefined;
  onImageExportClick?: (() => void) | undefined;
  onExportPackageClick?: (() => void) | undefined;
  onAddToReportClick?: (() => void) | undefined;
  onSaveProjectClick?: (() => void) | undefined;
  onLoadProjectClick?: (() => void) | undefined;
  taskLens: MapTaskLensId;
  density: ToolbarDensity;
  onTaskLensChange: (lens: MapTaskLensId) => void;
  onSwitchDensity: () => void;
  onResetLayout?: (() => void) | undefined;
  onCollapsePanels?: (() => void) | undefined;
  onFocusMapCanvas?: (() => void) | undefined;
  onRestoreDefaultWidths?: (() => void) | undefined;
}

const DRAW_TOOLS: Array<{
  id: DrawToolId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  title: string;
  priority: number;
}> = [
  { id: "point", label: "Point", shortLabel: "Point", icon: CircleDot, title: "Draw point", priority: 47 },
  { id: "linestring", label: "Line", shortLabel: "Line", icon: Route, title: "Draw line", priority: 46 },
  { id: "polygon", label: "Polygon", shortLabel: "Poly", icon: Pentagon, title: "Draw polygon AOI", priority: 71 },
  { id: "rectangle", label: "Rectangle", shortLabel: "Rect", icon: RectangleHorizontal, title: "Draw rectangle AOI", priority: 49 },
  { id: "circle", label: "Circle", shortLabel: "Circle", icon: Circle, title: "Draw circle AOI", priority: 45 },
];

const TASK_LENS_SHORT_LABELS: Record<MapTaskLensId, string> = {
  analyst: "Analyst",
  planner: "Planner",
  reviewer: "Reviewer",
  publisher: "Publisher",
};

const TASK_LENS_MICRO_LABELS: Record<MapTaskLensId, string> = {
  analyst: "A",
  planner: "P",
  reviewer: "R",
  publisher: "Pub",
};

const TASK_LENS_TOOLBAR_ROLES: Record<MapTaskLensId, ToolbarRole> = {
  analyst: "analyze",
  planner: "explore",
  reviewer: "explore",
  publisher: "publish",
};

const DENSITY_LABELS: Record<ToolbarDensity, string> = {
  compact: "Compact",
  comfortable: "Comfort",
};

const TOOLBAR_DENSITY_ORDER = ["compact", "comfortable"] as const satisfies readonly ToolbarDensity[];

const COMMAND_TAXONOMY_ICONS: Record<CommandTaxonomyId, LucideIcon> = {
  data: Upload,
  layers: Layers3,
  contents: Layers3,
  qa: ShieldAlert,
  analyze: Workflow,
  query: Search,
  style: Palette,
  scene: Building2,
  publish: Download,
  review: History,
  diagnostics: BarChart3,
  project: Settings2,
  extensions: Puzzle,
};

const COMMAND_TAXONOMY_ORDER: readonly CommandTaxonomyId[] = MAP_COMMAND_TAXONOMY_ORDER;
const TOP_SURFACE_GROUP_ORDER: readonly TopSurfaceGroupId[] = ["data", "analyze", "evidence", "publish", "view", "advanced"];

const TOP_SURFACE_GROUP_META: Record<TopSurfaceGroupId, {
  label: string;
  shortLabel: string;
  title: string;
  icon: LucideIcon;
}> = {
  data: {
    label: "Data",
    shortLabel: "Data",
    title: "Open layers, import, catalog, and service commands",
    icon: Upload,
  },
  view: {
    label: "View",
    shortLabel: "View",
    title: "Open map view, scene, and canvas interaction commands",
    icon: Layers3,
  },
  analyze: {
    label: "Analyze",
    shortLabel: "Analyze",
    title: "Open workflow, query, processing, and statistical commands",
    icon: BarChart3,
  },
  evidence: {
    label: "Evidence",
    shortLabel: "QA",
    title: "Open QA, diagnostics, and review evidence commands",
    icon: ShieldAlert,
  },
  publish: {
    label: "Publish",
    shortLabel: "Publish",
    title: "Save, load, and export map outputs",
    icon: Download,
  },
  advanced: {
    label: "Advanced",
    shortLabel: "More",
    title: "Open layout recovery, plugins, and advanced map commands",
    icon: Settings2,
  },
};

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const toolbarShell: React.CSSProperties = {
  position: "relative",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  display: "flex",
  alignItems: "center",
  alignContent: "center",
  flexWrap: "nowrap",
  flex: "1 1 100%",
  gap: MAP_SPACING.xs,
  height: "2rem",
  padding: "0 0.125rem",
  boxSizing: "border-box",
  minWidth: MAP_SPACING.zero,
  maxWidth: "100%",
  overflowX: "visible",
  overflowY: "visible",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const roleSwitch: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  flex: "0 0 auto",
  minWidth: MAP_SPACING.zero,
  height: "1.75rem",
  padding: "0 0.125rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.38))",
  gap: "0.125rem",
};

const commandRail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  minWidth: MAP_SPACING.zero,
  gap: MAP_SPACING.xs,
  overflow: "hidden",
};

const overflowRail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  flex: "0 0 auto",
  gap: MAP_SPACING.xs,
  paddingLeft: MAP_SPACING.xs,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const commandGroupRail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  gap: MAP_SPACING.xs,
  overflow: "hidden",
};

const primaryActionShell: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  flex: "0 1 auto",
};

const toolbarButtonText: React.CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const commandGroupButtonText: React.CSSProperties = {
  ...toolbarButtonText,
  maxWidth: "5.75rem",
};

const toolbarBadge: React.CSSProperties = {
  minWidth: "0.875rem",
  height: "0.875rem",
  padding: `${MAP_SPACING.zero} 0.1875rem`,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.selectedSubtle,
  border: MAP_STROKES.none,
  color: MAP_COLORS.interaction,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const overflowMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.375rem)",
  right: 0,
  zIndex: MAP_Z_INDEX.dropdown,
  width: "min(30rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 1rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.none,
  display: "grid",
  gap: "0.125rem",
  overflowY: "auto",
};

const commandGroupMenuStyle: React.CSSProperties = {
  ...overflowMenuStyle,
  left: 0,
  right: "auto",
  width: "min(19rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 1rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
};

const overflowSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.125rem",
  padding: `${MAP_SPACING.xs} 0`,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const overflowSectionHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const paletteBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: MAP_Z_INDEX.dropdown,
  background: "rgba(0, 0, 0, 0.28)",
};

const paletteStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--map-overlay-safe-top, 5.5rem)",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  width: "min(42rem, calc(100vw - 2rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxShadow: MAP_SHADOWS.none,
  overflow: "hidden",
};

const paletteInputStyle: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  border: MAP_STROKES.none,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  outline: MAP_STROKES.none,
  padding: `0 ${MAP_SPACING.md}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
};

const paletteListStyle: React.CSSProperties = {
  overflowY: "auto",
  padding: MAP_SPACING.xs,
  display: "grid",
  gap: "0.125rem",
};

const menuHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const commandGroupMenuHeaderStyle: React.CSSProperties = {
  ...menuHeaderStyle,
  borderBottom: MAP_STROKES.none,
  paddingBottom: MAP_SPACING.zero,
};

const segmentedControlStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  padding: "0.125rem",
};

const primaryCommandButtonBackground =
  "linear-gradient(180deg, color-mix(in srgb, var(--syn-interaction-active, #3794ff) 16%, transparent), color-mix(in srgb, var(--syn-interaction-active, #3794ff) 7%, transparent))";

const toolbarFocusOutline = `2px solid ${MAP_COLORS.focus}`;

function toneColor(tone: CommandTone): string {
  switch (tone) {
    case "danger":
      return MAP_COLORS.error;
    case "success":
      return MAP_COLORS.success;
    case "warning":
      return MAP_COLORS.warning;
    case "accent":
      return MAP_COLORS.interaction;
    default:
      return MAP_COLORS.textSecondary;
  }
}

function commandButtonStyle(
  active = false,
  disabled = false,
  tone: CommandTone = "default",
  density: ToolbarDensity = "comfortable",
  menuItem = false,
  primary = false,
): React.CSSProperties {
  const color = active ? MAP_COLORS.interaction : toneColor(tone);
  const height = menuItem ? "2.125rem" : primary ? "1.825rem" : density === "comfortable" ? "1.75rem" : "1.625rem";
  const paddingX = menuItem ? MAP_SPACING.sm : density === "comfortable" ? MAP_SPACING.sm : MAP_SPACING.xs;
  const maxWidth = menuItem
    ? "100%"
    : primary
      ? density === "compact" ? "6.75rem" : "10.5rem"
      : density === "comfortable"
        ? "6.75rem"
        : density === "compact"
          ? "5.9rem"
          : "5.25rem";
  const border = primary
    ? `1px solid color-mix(in srgb, ${MAP_COLORS.interaction} 46%, ${MAP_COLORS.hairlineSubtle})`
    : active
      ? `1px solid ${MAP_COLORS.focus}`
      : "1px solid transparent";
  const background = primary
    ? primaryCommandButtonBackground
    : active
      ? MAP_COLORS.selectedSubtle
      : MAP_COLORS.transparent;

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: menuItem ? "flex-start" : "center",
    gap: density === "comfortable" || menuItem ? "0.375rem" : "0.25rem",
    minHeight: height,
    minWidth: primary ? density === "compact" ? "5.5rem" : "7.75rem" : undefined,
    maxWidth,
    padding: `${MAP_SPACING.zero} ${paddingX}`,
    borderRadius: MAP_RADIUS.sm,
    border,
    background,
    color: primary && !disabled ? MAP_COLORS.interaction : color,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: active || primary ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: MAP_TRANSITIONS.fast,
    boxShadow: primary
      ? `inset 2px 0 0 ${MAP_COLORS.interaction}`
      : active
        ? `inset 2px 0 0 ${MAP_COLORS.interaction}`
        : "none",
  };
}

function toolbarButtonInteraction(
  active = false,
  disabled = false,
  primary = false,
): Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"> {
  return {
    onMouseEnter: (event) => {
      if (active || disabled) return;
      event.currentTarget.style.background = primary ? MAP_COLORS.selectedSubtle : MAP_COLORS.neutralSubtle;
      event.currentTarget.style.color = MAP_COLORS.interaction;
    },
    onMouseLeave: (event) => {
      if (active || disabled) return;
      event.currentTarget.style.background = primary ? primaryCommandButtonBackground : MAP_COLORS.transparent;
      event.currentTarget.style.color = primary ? MAP_COLORS.interaction : "";
    },
    onFocus: (event) => {
      event.currentTarget.style.outline = toolbarFocusOutline;
      event.currentTarget.style.outlineOffset = "2px";
    },
    onBlur: (event) => {
      event.currentTarget.style.outline = "";
      event.currentTarget.style.outlineOffset = "";
    },
  };
}

function roleButtonStyle(active: boolean, compact = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "1.4375rem",
    minWidth: compact ? "1.5rem" : undefined,
    padding: compact ? `0 ${MAP_SPACING.xs}` : `0 0.375rem`,
    border: active ? `1px solid color-mix(in srgb, ${MAP_COLORS.interaction} 38%, transparent)` : "1px solid transparent",
    borderRadius: MAP_RADIUS.sm,
    background: active ? MAP_COLORS.selectedSubtle : "transparent",
    color: active ? MAP_COLORS.interaction : MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: "0.625rem",
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    cursor: "pointer",
    textTransform: "uppercase",
    boxShadow: active ? `inset 0 -2px 0 ${MAP_COLORS.interaction}` : "none",
  };
}

function iconForQAStatus(status: LayerQaStatus): LucideIcon {
  if (status === "error") return ShieldAlert;
  if (status === "warning") return AlertTriangle;
  return ShieldCheck;
}

function getRoleForTaskLens(taskLens: MapTaskLensId, workspaceView: MapWorkspaceView): ToolbarRole {
  if (workspaceView === "analyze" && taskLens === "analyst") return "analyze";
  return TASK_LENS_TOOLBAR_ROLES[taskLens];
}

function getNextToolbarDensityPreference(density: ToolbarDensity): ToolbarDensity {
  const currentIndex = TOOLBAR_DENSITY_ORDER.indexOf(density);
  return TOOLBAR_DENSITY_ORDER[(currentIndex + 1) % TOOLBAR_DENSITY_ORDER.length] ?? "compact";
}

function getBreakpoint(width: number): ToolbarBreakpoint {
  if (width < 720) return "mobile";
  if (width < 1120) return "tablet";
  return "desktop";
}

function getProcessingCategoryIcon(category: string): LucideIcon {
  const normalized = category.toLowerCase();
  if (normalized.includes("statistics")) return BarChart3;
  if (normalized.includes("raster")) return FileImage;
  if (normalized.includes("join")) return Link2;
  if (normalized.includes("geometry")) return Boxes;
  return Workflow;
}

function valueFromDefault(parameter: ToolParameterDescriptor): string | number | boolean | null {
  if (typeof parameter.defaultValue === "string" || typeof parameter.defaultValue === "number" || typeof parameter.defaultValue === "boolean") {
    return parameter.defaultValue;
  }
  return null;
}

function defaultProcessingParams(
  descriptor: ProcessingToolDescriptor,
  layers: readonly ProcessingPaletteLayerOption[],
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  const layerIds = layers.map((layer) => layer.id);
  let nextLayerIndex = 0;

  for (const parameter of descriptor.parameters) {
    const defaultValue = valueFromDefault(parameter);
    if (defaultValue !== null) {
      params[parameter.key] = defaultValue;
      continue;
    }

    if (parameter.type === "layer") {
      const layerId = layerIds[Math.min(nextLayerIndex, Math.max(layerIds.length - 1, 0))] ?? "";
      params[parameter.key] = layerId;
      nextLayerIndex += 1;
    } else if (parameter.type === "field") {
      params[parameter.key] = layers[0]?.fields[0] ?? "";
    } else if (parameter.type === "enum") {
      params[parameter.key] = parameter.enumValues?.[0] ?? "";
    } else if (parameter.type === "boolean") {
      params[parameter.key] = false;
    } else {
      params[parameter.key] = "";
    }
  }

  return params;
}

function getProcessingToolDisabledReason(
  descriptor: ProcessingToolDescriptor,
  layers: readonly ProcessingPaletteLayerOption[],
  runner: MapToolbarProps["onRunProcessingToolCommand"],
): string | null {
  if (!descriptor.implemented) {
    return `${descriptor.title} is registered but not wired yet. ${descriptor.summary}`;
  }
  if (!runner) {
    return "Processing command runner is not connected.";
  }

  const requiredLayerCount = descriptor.parameters.filter((parameter) => parameter.required && parameter.type === "layer").length;
  if (layers.length < requiredLayerCount) {
    return requiredLayerCount <= 1
      ? "Add a map layer before running this processing tool."
      : `Add at least ${requiredLayerCount} map layers before running this processing tool.`;
  }

  const needsField = descriptor.parameters.some((parameter) => parameter.required && parameter.type === "field");
  if (needsField && !layers.some((layer) => layer.fields.length > 0)) {
    return "Add a layer with fields before running this processing tool.";
  }

  return null;
}

function uniqueCommandTerms(terms: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const term of terms) {
    const normalized = term?.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
}

const LEGACY_COMMAND_ALIASES: Record<string, readonly string[]> = {
  "command-palette": ["old command search", "map commands", "ctrl k", "cmd k", "keyboard shortcut"],
  layers: ["layer panel", "toggle layer panel", "layer manager", "inspect layer", "attribute table", "field schema"],
  navigator: ["overview", "cockpit", "workspace navigator", "map cockpit", "quick actions"],
  import: ["data import hub", "local files", "upload layer", "GeoJSON", "GeoParquet", "Shapefile", "GeoPackage", "GeoTIFF", "CSV", "Arrow", "KML", "KMZ", "GPX", "CRS", "projection"],
  services: ["add connection", "external service", "OGC", "WMS", "WMTS", "WFS", "XYZ", "source", "provider attribution"],
  catalog: ["browse source", "source browser", "source catalog", "restore health", "demo data", "metadata-only", "external reference", "GeoTIFF", "Shapefile", "GeoParquet", "WMS", "WFS"],
  contents: ["contents tree", "layer tree", "group layers", "scale range", "definition filter", "duplicate layer", "source repair", "field", "schema", "field schema"],
  qa: ["scientific qa", "quality assurance", "problems", "CRS", "projection", "declare CRS", "repair geometry", "noData", "source caveats"],
  query: ["NL query", "natural language query", "selection query", "attribute query", "field", "schema", "SQL"],
  workflow: ["workflow drawer", "AOI workflow", "buffer", "intersect", "union", "difference", "compare", "spatial join"],
  "review-timeline": ["review timeline", "audit", "revert command", "comments", "collaboration", "session log"],
  "undo-map-action": ["undo", "revert", "history", "Ctrl+Z", "Cmd+Z"],
  "redo-map-action": ["redo", "history", "Ctrl+Y", "Cmd+Shift+Z"],
  "reset-layout": ["layout reset", "recover layout", "map-first", "restore layout"],
  "collapse-panels": ["collapse all panels", "hide panels", "close drawers"],
  "focus-map-canvas": ["focus map", "keyboard focus", "canvas focus"],
  "restore-default-widths": ["default widths", "sidebar width", "inspector width"],
  "switch-density": ["compact density", "comfortable density"],
  "performance-diagnostics": ["diagnostics", "render budget", "worker transfer", "telemetry", "recovery", "performance"],
  "plugin-registry": ["plugins", "extensions", "extension registry", "source connector", "renderer extension", "Urban bridge"],
  "processing-toolbox": ["processing toolbox", "geoprocessing", "buffer", "intersect", "spatial join", "field calculator"],
  "model-builder": ["model builder", "workflow graph", "batch", "processing chain", "buffer", "intersect", "join"],
  "figure-composer": ["layout figure", "figure composer", "map book", "legend", "scale bar", "north arrow", "attribution", "CRS", "projection"],
  theme: ["theme data", "choropleth", "renderer", "symbology", "classification", "style layer"],
  extent: ["current extent", "map view", "viewport scope", "AOI"],
  lisa: ["LISA", "Local Moran", "cluster map", "spatial autocorrelation", "spatial statistics"],
  hotspot: ["Gi*", "Gi star", "Getis-Ord", "hot spot", "cold spot", "spatial statistics"],
  "emerging-hotspot": ["emerging hot spot", "temporal hotspot", "time series", "space time"],
  sync: ["3D sync", "viewport sync", "terrain", "linked camera", "scene"],
  voxcity: ["VoxCity", "CityJSON", "3D", "3D Tiles", "terrain", "building footprints"],
  "pin-mode": ["drop pin", "map note", "field note", "review note"],
  pins: ["pin sidebar", "notes", "field notes", "review notes"],
  drawings: ["draw panel", "drawings", "features", "AOI"],
  annotations: ["annotation", "label", "map text", "publication mark"],
  "measure-distance": ["distance", "measure distance", "ruler", "projected CRS"],
  "measure-area": ["area", "measure area", "polygon area", "projected CRS"],
  "measure-results": ["measurements", "measurement results", "units", "CRS caveats"],
  "save-project": ["save project", "persist map", "project state"],
  "load-project": ["load project", "restore map", "open saved state"],
  "export-image": ["image export", "PNG", "screenshot", "legend", "scale", "attribution"],
  "export-offline-package": ["offline package", "review package", "source bounds", "GeoJSON", "GeoParquet", "attribution"],
  "add-map-to-report": ["report handoff", "citation", "attribution", "evidence", "map finding"],
  "export-geojson": ["GeoJSON", "GeoParquet", "data export", "schema", "field", "download data", "attribution"],
};

function getCommandAliases(command: Pick<ToolbarCommand, "id" | "shortLabel" | "label">): readonly string[] {
  return uniqueCommandTerms([
    command.id.replace(/-/g, " "),
    command.shortLabel,
    ...(LEGACY_COMMAND_ALIASES[command.id] ?? []),
  ]);
}

function getEnrichedCommandKeywords(
  command: Pick<ToolbarCommand, "id" | "keywords" | "label" | "shortLabel" | "title" | "shortcut">,
  taxonomy: CommandTaxonomyId,
  aliases: readonly string[],
): readonly string[] {
  const taxonomyMeta = MAP_COMMAND_TAXONOMY_META[taxonomy];
  return uniqueCommandTerms([
    ...command.keywords,
    ...aliases,
    command.label,
    command.shortLabel,
    command.title,
    command.shortcut,
    taxonomyMeta.label,
    taxonomyMeta.title,
    ...taxonomyMeta.keywords,
  ]);
}

function getProcessingCommandAliases(tool: ProcessingToolDescriptor): readonly string[] {
  return uniqueCommandTerms([
    tool.toolId.replace(/-/g, " "),
    tool.title,
    `processing ${tool.title}`,
    `toolbox ${tool.title}`,
    tool.category,
  ]);
}

function buildProcessingPaletteCommands({
  tools,
  layers,
  onRun,
}: {
  tools: readonly ProcessingToolDescriptor[];
  layers: readonly ProcessingPaletteLayerOption[];
  onRun?: MapToolbarProps["onRunProcessingToolCommand"];
}): PaletteCommand[] {
  return tools.map((tool) => {
    const disabledReason = getProcessingToolDisabledReason(tool, layers, onRun);
    const params = defaultProcessingParams(tool, layers);
    const disabled = Boolean(disabledReason);
    const aliases = getProcessingCommandAliases(tool);

    return {
      id: `processing:${tool.toolId}`,
      label: tool.title,
      shortLabel: tool.title,
      title: tool.summary,
      keywords: [
        "processing",
        "toolbox",
        "geoprocessing",
        tool.toolId,
        tool.title,
        tool.summary,
        tool.category,
        ...tool.parameters.map((parameter) => parameter.label),
        ...tool.parameters.map((parameter) => parameter.key),
        ...aliases,
        ...MAP_COMMAND_TAXONOMY_META.analyze.keywords,
      ],
      aliases,
      icon: getProcessingCategoryIcon(tool.category),
      onClick: () => {
        if (disabled) return;
        onRun?.(tool.toolId, params);
      },
      roles: ["explore", "analyze", "publish"],
      overflowGroup: "advanced",
      priority: tool.implemented ? 70 : 8,
      disabled,
      ...(disabledReason ? { disabledReason } : {}),
      badge: tool.implemented ? null : "Blocked",
      tone: tool.implemented ? "default" : "warning",
      category: `Tool: ${tool.category}`,
      taxonomy: "analyze",
      source: "processing-tool",
      processingToolId: tool.toolId,
    };
  });
}

function getCommandStatus(command: ToolbarCommand): { label: string; tone: CommandTone } {
  if (command.disabled) return { label: "Unavailable", tone: "warning" };
  if (command.active) return { label: "Active", tone: "accent" };
  return { label: "Ready", tone: "default" };
}

function getCommandUnavailableReason(command: ToolbarCommand): string {
  return command.disabledReason ?? "Unavailable in the current map state.";
}

function getCommandAccessibleTitle(command: ToolbarCommand): string {
  if (!command.disabled) return command.title;
  return `${command.title}. ${getCommandUnavailableReason(command)}`;
}

function getCommandDomIdSegment(commandId: string): string {
  return commandId.replace(/[^a-z0-9_-]/gi, "-");
}

function getCommandTaxonomy(command: Pick<ToolbarCommand, "id" | "overflowGroup">): CommandTaxonomyId {
  const id = command.id;
  if (
    id === "command-palette" ||
    id === "navigator" ||
    id.startsWith("task-lens-") ||
    [
      "undo-map-action",
      "redo-map-action",
      "reset-layout",
      "collapse-panels",
      "focus-map-canvas",
      "restore-default-widths",
      "switch-density",
      "save-project",
      "load-project",
    ].includes(id)
  ) {
    return "project";
  }
  if (["import", "services", "catalog"].includes(id)) return "data";
  if (id === "layers") return "layers";
  if (id === "contents") return "contents";
  if (id === "qa") return "qa";
  if (id === "query") return "query";
  if (
    id === "workflow" ||
    id === "processing-toolbox" ||
    id === "model-builder" ||
    id === "extent" ||
    id === "lisa" ||
    id === "hotspot" ||
    id === "emerging-hotspot" ||
    id === "drawings" ||
    id === "measure-results" ||
    id.startsWith("draw-") ||
    id.startsWith("measure-")
  ) {
    return "analyze";
  }
  if (["theme", "annotations"].includes(id)) return "style";
  if (["sync", "voxcity"].includes(id)) return "scene";
  if (
    id === "figure-composer" ||
    id === "export-image" ||
    id === "export-offline-package" ||
    id === "add-map-to-report" ||
    id === "export-geojson"
  ) {
    return "publish";
  }
  if (["review-timeline", "pin-mode", "pins"].includes(id)) return "review";
  if (id === "performance-diagnostics") return "diagnostics";
  if (id === "plugin-registry") return "extensions";
  return command.overflowGroup === "export" ? "publish" : "project";
}

function getCommandCategory(command: ToolbarCommand | PaletteCommand): string {
  if ("category" in command) return command.category;
  return MAP_COMMAND_TAXONOMY_META[getCommandTaxonomy(command)].label;
}

function getTopSurfaceGroup(command: ToolbarCommand): TopSurfaceGroupId | null {
  const id = command.id;
  if (id.startsWith("task-lens-") || id === "command-palette") {
    return null;
  }
  if (id === "save-project" || id === "load-project") {
    return "publish";
  }
  if (
    id === "navigator" ||
    id === "pin-mode" ||
    id === "pins" ||
    id === "drawings" ||
    id === "annotations" ||
    id === "measure-results" ||
    id.startsWith("draw-") ||
    id.startsWith("measure-")
  ) {
    return "view";
  }
  if (
    [
      "undo-map-action",
      "redo-map-action",
      "reset-layout",
      "collapse-panels",
      "focus-map-canvas",
      "restore-default-widths",
      "switch-density",
      "plugin-registry",
    ].includes(id)
  ) {
    return "advanced";
  }

  const taxonomy = getCommandTaxonomy(command);
  if (taxonomy === "data" || taxonomy === "layers" || taxonomy === "contents") return "data";
  if (taxonomy === "scene") return "view";
  if (taxonomy === "qa" || taxonomy === "review" || taxonomy === "diagnostics") return "evidence";
  if (taxonomy === "query" || taxonomy === "analyze" || taxonomy === "style") return "analyze";
  if (taxonomy === "publish") return "publish";
  if (taxonomy === "extensions" || taxonomy === "project") return "advanced";
  return "advanced";
}

function sortCommandsForSurface(commands: readonly ToolbarCommand[]): ToolbarCommand[] {
  return [...commands].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return left.label.localeCompare(right.label);
  });
}

function groupCommandsByTopSurface(commands: readonly ToolbarCommand[]): Array<{
  id: TopSurfaceGroupId;
  commands: ToolbarCommand[];
}> {
  return TOP_SURFACE_GROUP_ORDER.map((id) => ({
    id,
    commands: sortCommandsForSurface(commands.filter((command) => getTopSurfaceGroup(command) === id)),
  })).filter((group) => group.commands.length > 0);
}

function getTopSurfaceGroupTone(commands: readonly ToolbarCommand[]): CommandTone {
  if (commands.some((command) => (command.tone ?? "default") === "danger" && (command.active || command.badge != null))) {
    return "danger";
  }
  if (commands.some((command) => command.active && (command.tone ?? "default") === "warning")) {
    return "warning";
  }
  if (commands.some((command) => command.active)) {
    return "accent";
  }
  if (commands.some((command) => (command.tone ?? "default") === "warning" && command.badge != null)) {
    return "warning";
  }
  return "default";
}

function getVisibleTopSurfaceGroupIds(width: number): readonly TopSurfaceGroupId[] {
  if (width < 420) return ["data"];
  if (width < 560) return ["data", "analyze"];
  if (width < 720) return ["data", "analyze", "evidence"];
  return ["data", "analyze", "evidence", "publish"];
}

function getToolbarTaskLensDefinition(taskLensId: MapTaskLensId) {
  const definition = MAP_RUNTIME_TASK_LENSES.find((taskLens) => taskLens.id === taskLensId);
  if (!definition) {
    throw new Error(`Unknown toolbar task lens: ${taskLensId}`);
  }
  return definition;
}

function createTaskLensCommand(args: BuildToolbarCommandsArgs, input: {
  id: string;
  lensId: MapTaskLensId;
  priority: number;
}): ToolbarCommand {
  const lens = getToolbarTaskLensDefinition(input.lensId);
  const active = args.taskLens === input.lensId;
  return {
    id: input.id,
    label: lens.label,
    shortLabel: TASK_LENS_SHORT_LABELS[lens.id],
    title: `Switch to ${lens.label} task lens. ${lens.description}`,
    keywords: ["task lens", "persona", "layout preset", "view preset", lens.id, lens.label, lens.description],
    icon: Compass,
    onClick: () => args.onTaskLensChange(input.lensId),
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: active ? input.priority + 20 : input.priority,
    active,
    badge: active ? "Lens" : null,
    navigator: true,
  };
}

function buildToolbarCommands(args: BuildToolbarCommandsArgs): ToolbarCommand[] {
  const commands: ToolbarCommand[] = [];
  const visibleLayerCount = args.visibleLayerCount;
  const hasLayers = args.layerCount > 0;
  const hasVisibleLayers = visibleLayerCount > 0;
  const hasQueryableLayers = args.nlQueryLayerCount > 0;
  const qaHasSignal = hasLayers || args.scientificQAIssueCount > 0 || args.scientificQAStatus !== "unchecked";

  const add = (command: ToolbarCommand | false | null | undefined): void => {
    if (command) commands.push(command);
  };

  add(args.onToggleLayerPanel && {
    id: "layers",
    label: "Layers",
    shortLabel: "Layers",
    title: `Toggle layer panel - ${args.layerCount} overlay layer${args.layerCount !== 1 ? "s" : ""}`,
    keywords: ["layer stack", "review layers", "visible layers"],
    icon: Layers3,
    onClick: args.onToggleLayerPanel,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "tools",
    priority: hasLayers ? 98 : 80,
    active: args.showLayerPanel,
    badge: args.layerCount,
    contextBoost: "empty",
    navigator: true,
  });

  add(args.onWorkspaceViewChange && {
    id: "navigator",
    label: "Navigator",
    shortLabel: "Nav",
    title: "Open map navigator cockpit",
    keywords: ["navigator", "workspace", "map cockpit", "quick actions"],
    icon: Compass,
    onClick: () => args.onWorkspaceViewChange?.("navigator"),
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.workspaceView === "navigator" ? 122 : 42,
    active: args.workspaceView === "navigator",
    navigator: true,
  });

  add(createTaskLensCommand(args, {
    id: "task-lens-analyst",
    lensId: "analyst",
    priority: 119,
  }));

  add(createTaskLensCommand(args, {
    id: "task-lens-planner",
    lensId: "planner",
    priority: 118,
  }));

  add(createTaskLensCommand(args, {
    id: "task-lens-reviewer",
    lensId: "reviewer",
    priority: 117,
  }));

  add(createTaskLensCommand(args, {
    id: "task-lens-publisher",
    lensId: "publisher",
    priority: 116,
  }));

  add(args.onImportClick && {
    id: "import",
    label: args.isImporting ? "Importing" : "Import",
    shortLabel: args.isImporting ? "Import" : "Import",
    title: "Open spatial data import options for GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, GPX, Shapefile, GeoPackage, and sampled GeoTIFF files",
    keywords: ["import geojson", "upload data", "load file", "add data", "geoparquet", "shapefile", "geopackage", "geotiff"],
    icon: Upload,
    onClick: args.onImportClick,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "tools",
    priority: hasLayers ? 88 : 125,
    disabled: args.isImporting,
    disabledReason: "An import is already running.",
    badge: args.isImporting && args.importProgress != null ? `${Math.round(args.importProgress)}%` : null,
    contextBoost: "empty",
    navigator: true,
  });

  add(args.onOpenExternalServices && {
    id: "services",
    label: "External Services",
    shortLabel: "Services",
    title: "Open external map services dialog",
    keywords: ["external services", "wms", "wfs", "xyz", "osm", "cityjson"],
    icon: Globe2,
    onClick: args.onOpenExternalServices,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: hasLayers ? 72 : 112,
    contextBoost: "empty",
    navigator: true,
  });

  add(args.onToggleCatalog && {
    id: "catalog",
    label: "Catalog",
    shortLabel: "Catalog",
    title: "Open source catalog, restore health, and connection manager",
    keywords: ["catalog", "source browser", "connections", "restore", "data sources", "repair"],
    icon: FolderOpen,
    onClick: args.onToggleCatalog,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.showCatalog ? 127 : hasLayers ? 87 : 121,
    active: args.showCatalog,
    badge: args.catalogSourceCount > 0 ? args.catalogSourceCount : null,
    tone: "default",
    navigator: true,
  });

  add(args.onToggleContents && {
    id: "contents",
    label: "Contents",
    shortLabel: "Contents",
    title: "Open professional contents tree with grouping, field schema, scale ranges, filters, and repair actions",
    keywords: ["contents", "layer tree", "group layers", "field schema", "schema", "field", "scale range", "definition filter", "duplicate layer"],
    icon: Layers3,
    onClick: args.onToggleContents,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.showContents ? 128 : hasLayers ? 92 : 120,
    active: args.showContents,
    badge: args.layerCount > 0 ? args.layerCount : null,
    tone: "default",
    navigator: true,
  });

  add(args.onToggleScientificQAPanel && qaHasSignal && {
    id: "qa",
    label: "QA",
    shortLabel: "QA",
    title: "Toggle scientific QA panel",
    keywords: ["qa", "quality", "crs", "geometry validation", "projection warning"],
    icon: iconForQAStatus(args.scientificQAStatus),
    onClick: args.onToggleScientificQAPanel,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.scientificQABlockerCount > 0 ? 130 : args.scientificQAIssueCount > 0 ? 116 : 83,
    active: args.showScientificQAPanel || args.scientificQAStatus === "error",
    badge: args.scientificQAIssueCount > 0 ? args.scientificQAIssueCount : null,
    tone: args.scientificQABlockerCount > 0 ? "danger" : args.scientificQAIssueCount > 0 ? "warning" : "success",
    contextBoost: "quality",
    navigator: true,
  });

  add(args.onToggleNLQueryPanel && hasQueryableLayers && {
    id: "query",
    label: "Query",
    shortLabel: "Query",
    title: "Open natural-language map query builder",
    keywords: ["query layers", "natural language query", "sql", "spatial predicate"],
    icon: Search,
    onClick: args.onToggleNLQueryPanel,
    roles: ["explore", "analyze"],
    overflowGroup: "advanced",
    priority: 114,
    active: args.showNLQueryPanel,
    badge: args.nlQueryLayerCount,
    tone: "accent",
    contextBoost: "query",
    navigator: true,
  });

  add(args.onToggleWorkflowDrawer && {
    id: "workflow",
    label: "Workflow",
    shortLabel: "Flow",
    title: "Open AOI · Buffer · Intersect · Union · Difference · Compare workflow drawer",
    keywords: [
      "workflow",
      "aoi",
      "buffer",
      "intersect",
      "difference",
      "union",
      "compare",
      "side by side",
      "swipe",
    ],
    icon: GitBranch,
    onClick: args.onToggleWorkflowDrawer,
    roles: ["analyze", "explore"],
    overflowGroup: "advanced",
    priority: 113,
    active: args.showWorkflowDrawer,
    badge: args.workflowReadyCount,
    tone: "accent",
    contextBoost: "polygon",
    navigator: true,
  });

  add(args.onToggleReviewTimeline && {
    id: "review-timeline",
    label: "Review",
    shortLabel: "Review",
    title: "Open review timeline with filters and reproducible session export",
    keywords: ["review", "timeline", "audit", "session log", "markdown export", "json export"],
    icon: History,
    onClick: args.onToggleReviewTimeline,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.showReviewTimeline ? 126 : 89,
    active: args.showReviewTimeline,
    badge: args.reviewEventCount,
    tone: args.reviewEventCount > 0 ? "accent" : "default",
    navigator: true,
  });

  add(args.onUndoMapAction && {
    id: "undo-map-action",
    label: "Undo",
    shortLabel: "Undo",
    title: args.undoMapActionLabel ? `Undo ${args.undoMapActionLabel}` : "Undo last reversible map edit",
    keywords: ["undo", "revert", "history", "ctrl z", "cmd z", args.undoMapActionLabel ?? "last edit"],
    icon: Undo2,
    onClick: args.onUndoMapAction,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.canUndoMapAction ? 132 : 38,
    disabled: !args.canUndoMapAction,
    disabledReason: "No reversible map edits are available to undo.",
    tone: args.canUndoMapAction ? "accent" : "default",
    shortcut: formatMapKeybinding("undoAction"),
    navigator: true,
  });

  add(args.onRedoMapAction && {
    id: "redo-map-action",
    label: "Redo",
    shortLabel: "Redo",
    title: args.redoMapActionLabel ? `Redo ${args.redoMapActionLabel}` : "Redo last undone map edit",
    keywords: ["redo", "history", "ctrl y", "cmd shift z", args.redoMapActionLabel ?? "last undone edit"],
    icon: Redo2,
    onClick: args.onRedoMapAction,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.canRedoMapAction ? 131 : 37,
    disabled: !args.canRedoMapAction,
    disabledReason: "Undo a reversible map edit before using redo.",
    tone: args.canRedoMapAction ? "accent" : "default",
    shortcut: formatMapKeybinding("redoAction"),
    navigator: true,
  });

  add(args.onResetLayout && {
    id: "reset-layout",
    label: "Reset layout",
    shortLabel: "Reset",
    title: "Restore map-first chrome, default panel widths, and the Layers workbench without clearing map data",
    keywords: ["reset layout", "recover layout", "map first", "default chrome", "panels"],
    icon: Redo2,
    onClick: args.onResetLayout,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 110,
    navigator: true,
  });

  add(args.onCollapsePanels && {
    id: "collapse-panels",
    label: "Collapse panels",
    shortLabel: "Collapse",
    title: "Collapse side panels, bottom panel, drawers, and floating map tools",
    keywords: ["collapse all panels", "close panels", "hide drawers", "map canvas"],
    icon: PanelTop,
    onClick: args.onCollapsePanels,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 109,
    navigator: true,
  });

  add(args.onFocusMapCanvas && {
    id: "focus-map-canvas",
    label: "Focus map canvas",
    shortLabel: "Focus",
    title: "Move keyboard focus to the interactive map canvas",
    keywords: ["focus map canvas", "keyboard", "skip to map", "canvas"],
    icon: Focus,
    onClick: args.onFocusMapCanvas,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 108,
    navigator: true,
  });

  add(args.onRestoreDefaultWidths && {
    id: "restore-default-widths",
    label: "Default widths",
    shortLabel: "Widths",
    title: "Restore default sidebar and inspector widths without changing map content",
    keywords: ["restore default widths", "sidebar width", "inspector width", "layout width"],
    icon: RectangleHorizontal,
    onClick: args.onRestoreDefaultWidths,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 107,
    navigator: true,
  });

  add({
    id: "switch-density",
    label: "Switch density",
    shortLabel: "Density",
    title: `Switch toolbar density from ${DENSITY_LABELS[args.density]} to ${DENSITY_LABELS[getNextToolbarDensityPreference(args.density)]}`,
    keywords: ["switch density", "compact density", "comfortable density", "toolbar density"],
    icon: Settings2,
    onClick: args.onSwitchDensity,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 106,
    badge: DENSITY_LABELS[args.density],
    navigator: true,
  });

  add(args.onTogglePerformanceDiagnostics && {
    id: "performance-diagnostics",
    label: "Diagnostics",
    shortLabel: "Diag",
    title: "Open live render budgets and performance diagnostics",
    keywords: ["performance", "diagnostics", "render budget", "preview mode", "worker transfer"],
    icon: BarChart3,
    onClick: args.onTogglePerformanceDiagnostics,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.performanceIssueCount > 0 ? 128 : args.showPerformanceDiagnostics ? 123 : 84,
    active: args.showPerformanceDiagnostics,
    badge: args.performanceIssueCount > 0 ? args.performanceIssueCount : null,
    tone: args.performanceIssueCount > 0 ? "warning" : "default",
    contextBoost: "quality",
    navigator: true,
  });

  add(args.onTogglePluginPanel && {
    id: "plugin-registry",
    label: "Plugins",
    shortLabel: "Plug",
    title: "Open plugin and extension registry",
    keywords: ["plugins", "extensions", "extension registry", "source connector", "renderer", "urban bridge"],
    icon: Puzzle,
    onClick: args.onTogglePluginPanel,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: args.showPluginPanel ? 127 : 82,
    active: args.showPluginPanel,
    badge: args.pluginExtensionCount > 0 ? args.pluginExtensionCount : null,
    tone: "default",
    navigator: true,
  });

  add(args.onToggleProcessingToolbox && {
    id: "processing-toolbox",
    label: "Toolbox",
    shortLabel: "Tools",
    title: "Open the processing toolbox: searchable geometry and selection tools",
    keywords: ["processing", "toolbox", "buffer", "centroid", "attribute filter", "geoprocessing", "tools"],
    icon: Boxes,
    onClick: args.onToggleProcessingToolbox,
    roles: ["analyze", "explore"],
    overflowGroup: "advanced",
    priority: args.showProcessingToolbox ? 124 : 86,
    active: args.showProcessingToolbox,
    badge: args.processingToolCount > 0 ? args.processingToolCount : null,
    tone: "default",
    contextBoost: "polygon",
    navigator: true,
  });

  add(args.onToggleModelBuilder && {
    id: "model-builder",
    label: "Model",
    shortLabel: "Model",
    title: "Open model builder: chain processing steps, rerun, batch, and publish evidence",
    keywords: ["model", "builder", "workflow designer", "batch", "processing chain", "publish evidence"],
    icon: GitBranch,
    onClick: args.onToggleModelBuilder,
    roles: ["analyze", "explore"],
    overflowGroup: "advanced",
    priority: args.showModelBuilder ? 125 : 85,
    active: args.showModelBuilder,
    badge: null,
    tone: "default",
    contextBoost: "polygon",
    navigator: true,
  });

  add(args.onToggleFigureComposer && {
    id: "figure-composer",
    label: "Figure",
    shortLabel: "Figure",
    title: "Compose a gate-checked publication figure (legend, scale bar, north arrow, attribution, CRS)",
    keywords: ["figure", "compose", "publication", "layout", "legend", "scale bar", "north arrow", "export figure"],
    icon: FileImage,
    onClick: args.onToggleFigureComposer,
    roles: ["publish"],
    overflowGroup: "advanced",
    priority: args.showFigureComposer ? 124 : 86,
    active: args.showFigureComposer,
  });

  add(args.onToggleChoroplethPanel && {
    id: "theme",
    label: "Theme",
    shortLabel: "Theme",
    title: "Open thematic choropleth panel",
    keywords: ["theme data", "choropleth", "style layer", "classify"],
    icon: Palette,
    onClick: args.onToggleChoroplethPanel,
    roles: ["analyze"],
    overflowGroup: "tools",
    priority: 94,
    active: args.showChoroplethPanel,
    contextBoost: "polygon",
  });

  add(args.onToggleRestrictToMapView && {
    id: "extent",
    label: "Extent",
    shortLabel: "Extent",
    title: "Restrict map dispatch and workflow launch to the current extent",
    keywords: ["current extent", "restrict map view", "viewport scope"],
    icon: Focus,
    onClick: args.onToggleRestrictToMapView,
    roles: ["analyze"],
    overflowGroup: "advanced",
    priority: 76,
    active: args.restrictToMapView,
  });

  add(args.onToggleClusterViz && {
    id: "lisa",
    label: "LISA",
    shortLabel: "LISA",
    title: "Open Local Moran's I cluster map panel",
    keywords: ["cluster", "local moran", "lisa", "spatial autocorrelation"],
    icon: Workflow,
    onClick: args.onToggleClusterViz,
    roles: ["analyze"],
    overflowGroup: "tools",
    priority: 82,
    active: args.showClusterViz,
    contextBoost: "point",
  });

  add(args.onToggleHotSpotViz && {
    id: "hotspot",
    label: "Gi*",
    shortLabel: "Gi*",
    title: "Open Getis-Ord Gi* hot and cold spot panel",
    keywords: ["hotspot", "hot spot", "getis ord", "gi star"],
    icon: Target,
    onClick: args.onToggleHotSpotViz,
    roles: ["analyze"],
    overflowGroup: "tools",
    priority: 80,
    active: args.showHotSpotViz,
    contextBoost: "point",
  });

  add(args.onToggleEmergingHotSpotViz && {
    id: "emerging-hotspot",
    label: "Emerging",
    shortLabel: "Emerg",
    title: "Open Emerging Hot Spot temporal analysis panel",
    keywords: ["emerging hot spot", "temporal hotspot", "time series"],
    icon: BarChart3,
    onClick: args.onToggleEmergingHotSpotViz,
    roles: ["analyze"],
    overflowGroup: "tools",
    priority: 68,
    active: args.showEmergingHotSpotViz,
  });

  add(args.onToggleViewportSync && {
    id: "sync",
    label: "Sync",
    shortLabel: "Sync",
    title: "Toggle 2D and 3D viewport sync",
    keywords: ["3d sync", "voxcity camera", "linked viewport", "terrain"],
    icon: Link2,
    onClick: args.onToggleViewportSync,
    roles: ["explore", "analyze"],
    overflowGroup: "advanced",
    priority: args.viewportSyncEnabled ? 91 : 55,
    active: args.viewportSyncEnabled,
    badge: args.viewportSyncEnabled ? "3D" : null,
  });

  add(args.onToggleVoxCityOverlayPanel && {
    id: "voxcity",
    label: "VoxCity",
    shortLabel: "Vox",
    title: "Project VoxCity buildings and CityJSON surfaces onto the 2D map",
    keywords: ["voxcity", "cityjson", "3d buildings", "building footprints"],
    icon: Building2,
    onClick: args.onToggleVoxCityOverlayPanel,
    roles: ["explore", "analyze"],
    overflowGroup: "advanced",
    priority: args.showVoxCityOverlayPanel ? 90 : 52,
    active: args.showVoxCityOverlayPanel,
    badge: args.voxCityFootprintCount,
  });

  add({
    id: "pin-mode",
    label: "Pin",
    shortLabel: "Pin",
    title: "Click on map to drop pins",
    keywords: ["pin", "drop pin", "map note"],
    icon: MapPin,
    onClick: args.onTogglePinMode,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "tools",
    priority: args.pinMode ? 109 : 66,
    active: args.pinMode,
  });

  add({
    id: "pins",
    label: "Pins",
    shortLabel: "Pins",
    title: "Toggle pin sidebar",
    keywords: ["pins", "notes", "field notes", "pin sidebar"],
    icon: MapPin,
    onClick: args.onToggleSidebar,
    roles: ["explore", "publish"],
    overflowGroup: "tools",
    priority: args.showSidebar || args.pinCount > 0 ? 86 : 50,
    active: args.showSidebar,
    badge: args.pinCount,
  });

  if (args.onSetDrawTool) {
    DRAW_TOOLS.forEach((tool) => {
      const active = args.activeDrawTool === tool.id;
      add({
        id: `draw-${tool.id}`,
        label: tool.label,
        shortLabel: tool.shortLabel,
        title: tool.title,
        keywords: ["draw", tool.label.toLowerCase(), tool.id, tool.title.toLowerCase()],
        icon: tool.icon,
        onClick: () => args.onSetDrawTool?.(active ? null : tool.id),
        roles: ["explore", "analyze"],
        overflowGroup: "tools",
        priority: active ? 118 : tool.priority,
        active,
        contextBoost: tool.id === "polygon" || tool.id === "rectangle" ? "aoi" : undefined,
      });
    });
  }

  add(args.onToggleDrawPanel && {
    id: "drawings",
    label: "Drawings",
    shortLabel: "Draw",
    title: "Toggle drawings panel",
    keywords: ["drawings", "draw panel", "features"],
    icon: Pencil,
    onClick: args.onToggleDrawPanel,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "tools",
    priority: args.showDrawPanel || args.drawnFeatureCount > 0 ? 84 : 48,
    active: args.showDrawPanel,
    badge: args.drawnFeatureCount,
  });

  add(args.onToggleAnnotationMode && {
    id: "annotations",
    label: "Text",
    shortLabel: "Text",
    title: "Toggle text annotation tool",
    keywords: ["annotation", "text", "label", "map text"],
    icon: Type,
    onClick: args.onToggleAnnotationMode,
    roles: ["explore", "publish"],
    overflowGroup: "tools",
    priority: args.annotationMode || args.annotationCount > 0 ? 88 : 54,
    active: args.annotationMode,
    badge: args.annotationCount,
  });

  if (args.onSetMeasureTool) {
    add({
      id: "measure-distance",
      label: "Distance",
      shortLabel: "Dist",
      title: "Measure distance",
      keywords: ["measure distance", "distance", "ruler"],
      icon: Ruler,
      onClick: () => args.onSetMeasureTool?.(args.activeMeasureTool === "measure-distance" ? null : "measure-distance"),
      roles: ["analyze"],
      overflowGroup: "tools",
      priority: args.activeMeasureTool === "measure-distance" ? 112 : 70,
      active: args.activeMeasureTool === "measure-distance",
    });
    add({
      id: "measure-area",
      label: "Area",
      shortLabel: "Area",
      title: "Measure area",
      keywords: ["measure area", "area", "polygon area"],
      icon: Square,
      onClick: () => args.onSetMeasureTool?.(args.activeMeasureTool === "measure-area" ? null : "measure-area"),
      roles: ["analyze"],
      overflowGroup: "tools",
      priority: args.activeMeasureTool === "measure-area" ? 111 : 69,
      active: args.activeMeasureTool === "measure-area",
      contextBoost: "polygon",
    });
  }

  add(args.onToggleMeasurePanel && {
    id: "measure-results",
    label: "Results",
    shortLabel: "Results",
    title: "Toggle measurements panel",
    keywords: ["measurement results", "measurements", "results"],
    icon: PanelTop,
    onClick: args.onToggleMeasurePanel,
    roles: ["analyze", "publish"],
    overflowGroup: "tools",
    priority: args.showMeasurePanel || args.measurementCount > 0 ? 81 : 44,
    active: args.showMeasurePanel,
    badge: args.measurementCount,
  });

  const saveProjectDisabledReason = args.persistenceDisabled
    ? "Select or create a project before saving map state."
    : args.isSavingProject
      ? "The current map project save is already in progress."
      : undefined;

  add(args.onSaveProjectClick && {
    id: "save-project",
    label: args.isSavingProject ? "Saving" : "Save",
    shortLabel: "Save",
    title: "Save map state to selected project",
    keywords: ["save project", "persist map", "project state"],
    icon: Save,
    onClick: args.onSaveProjectClick,
    roles: ["explore", "publish"],
    overflowGroup: "export",
    priority: args.isSavingProject ? 115 : 87,
    disabled: Boolean(saveProjectDisabledReason),
    ...(saveProjectDisabledReason ? { disabledReason: saveProjectDisabledReason } : {}),
    contextBoost: "empty",
    navigator: true,
  });

  const loadProjectDisabledReason = args.persistenceDisabled
    ? "Select or create a project before loading map state."
    : args.isLoadingProject
      ? "A saved map project is already loading."
      : undefined;

  add(args.onLoadProjectClick && {
    id: "load-project",
    label: args.isLoadingProject ? "Loading" : "Load",
    shortLabel: "Load",
    title: "Load saved map state from selected project",
    keywords: ["load project", "restore map", "open saved state"],
    icon: FolderOpen,
    onClick: args.onLoadProjectClick,
    roles: ["explore", "publish"],
    overflowGroup: "export",
    priority: args.isLoadingProject || !hasLayers ? 92 : 64,
    disabled: Boolean(loadProjectDisabledReason),
    ...(loadProjectDisabledReason ? { disabledReason: loadProjectDisabledReason } : {}),
    contextBoost: "empty",
    navigator: true,
  });

  add(args.onImageExportClick && {
    id: "export-image",
    label: args.isExportingImage ? "Rendering" : "Image",
    shortLabel: "Image",
    title: "Export current map as PNG",
    keywords: ["export image", "png", "map image", "screenshot"],
    icon: FileImage,
    onClick: args.onImageExportClick,
    roles: ["publish", "explore"],
    overflowGroup: "export",
    priority: args.isExportingImage ? 113 : 78,
    disabled: args.isExportingImage,
    disabledReason: "The current map image export is still rendering.",
  });

  add(args.onExportPackageClick && {
    id: "export-offline-package",
    label: args.isExportingPackage ? "Packaging" : "Export package",
    shortLabel: "Package",
    title: "Export reproducible offline package",
    keywords: ["offline package", "reproducible package", "zip", "project package", "review package"],
    icon: Download,
    onClick: args.onExportPackageClick,
    roles: ["publish", "explore"],
    overflowGroup: "export",
    priority: args.isExportingPackage ? 116 : 84,
    disabled: args.isExportingPackage || args.packageExportDisabled,
    disabledReason: args.isExportingPackage
      ? "The offline package export is already running."
      : args.packageExportDisabledReason ?? "Add map content before exporting an offline package.",
  });

  add(args.onAddToReportClick && {
    id: "add-map-to-report",
    label: "Report",
    shortLabel: "Report",
    title: "Add current map finding to report",
    keywords: ["report", "citation", "map finding", "handoff"],
    icon: FileText,
    onClick: args.onAddToReportClick,
    roles: ["publish", "explore"],
    overflowGroup: "export",
    priority: 81,
    disabled: args.reportDisabled,
    disabledReason: args.reportDisabledReason ?? "The current map report snapshot is still rendering.",
    navigator: true,
  });

  add(args.onExportClick && {
    id: "export-geojson",
    label: "GeoJSON",
    shortLabel: "GeoJSON",
    title: "Export visible map data as GeoJSON",
    keywords: ["export geojson", "download data", "visible map data"],
    icon: FileJson,
    onClick: args.onExportClick,
    roles: ["publish", "explore"],
    overflowGroup: "export",
    priority: hasVisibleLayers ? 83 : 58,
    disabled: args.exportDisabled,
    disabledReason: args.exportDisabledReason ?? "Add pins, drawings, or visible overlay layers before exporting GeoJSON.",
  });

  return commands;
}

function findFirstCommand(commands: readonly ToolbarCommand[], ids: readonly string[]): ToolbarCommand | null {
  for (const id of ids) {
    const command = commands.find((candidate) => candidate.id === id);
    if (command) return command;
  }
  return null;
}

type ContextualPrimaryReason = "import" | "inspect-layer" | "review-problems" | "publish" | "save";

const CONTEXTUAL_PRIMARY_LABELS: Record<ContextualPrimaryReason, Pick<ToolbarCommand, "label" | "shortLabel" | "title" | "tone">> = {
  import: {
    label: "Import Data",
    shortLabel: "Import",
    title: "Import data into the empty map",
    tone: "accent",
  },
  "inspect-layer": {
    label: "Inspect Layer",
    shortLabel: "Inspect",
    title: "Inspect the selected map layer",
    tone: "accent",
  },
  "review-problems": {
    label: "Review Problems",
    shortLabel: "Problems",
    title: "Review QA blockers in the map problems panel",
    tone: "danger",
  },
  publish: {
    label: "Publish",
    shortLabel: "Publish",
    title: "Publish the ready map composition",
    tone: "accent",
  },
  save: {
    label: "Save",
    shortLabel: "Save",
    title: "Save unsaved map project changes",
    tone: "accent",
  },
};

function asContextualPrimaryCommand(command: ToolbarCommand | null, reason: ContextualPrimaryReason): ToolbarCommand | null {
  if (!command) return null;
  const primary = CONTEXTUAL_PRIMARY_LABELS[reason];
  return {
    ...command,
    ...primary,
    keywords: uniqueCommandTerms([...command.keywords, primary.label]),
  };
}

function selectContextualPrimaryCommand(args: {
  commands: readonly ToolbarCommand[];
  toolbarRole: ToolbarRole;
  taskLens: MapTaskLensId;
  workspaceView: MapWorkspaceView;
  visibleLayerCount: number;
  hasSelectedAoi: boolean;
  scientificQABlockerCount: number;
  scientificQAIssueCount: number;
  isImporting: boolean;
  /** True when a layer is selected/active and not an AOI — shows Inspect Layer */
  hasSelectedLayer: boolean;
  /** True when the map is publish-ready (no QA blockers, has content, publisher lens) */
  isPublishReady: boolean;
  /** True when the project has unsaved map changes and can be saved */
  canSave: boolean;
}): ToolbarCommand | null {
  const primaryEligibleCommands = args.commands.filter((command) =>
    !command.id.startsWith("task-lens-") &&
    !["reset-layout", "collapse-panels", "focus-map-canvas", "restore-default-widths", "switch-density"].includes(command.id)
  );
  const activeCommand = primaryEligibleCommands.find((command) => command.active && !command.disabled);
  if (args.isImporting) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["import"]), "import") ?? activeCommand ?? null;
  }
  if (args.scientificQABlockerCount > 0) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["qa"]), "review-problems") ?? activeCommand ?? null;
  }
  if (args.visibleLayerCount === 0) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["import"]), "import")
      ?? findFirstCommand(args.commands, ["catalog", "services"])
      ?? activeCommand
      ?? null;
  }
  /* Selected layer (non-AOI) → Inspect Layer via the layer stack */
  if (args.hasSelectedLayer && !args.hasSelectedAoi) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["layers", "contents"]), "inspect-layer") ?? activeCommand ?? null;
  }
  if (args.taskLens === "reviewer") {
    return findFirstCommand(args.commands, ["qa", "review-timeline", "performance-diagnostics", "catalog"]) ?? activeCommand ?? null;
  }
  if (args.taskLens === "planner") {
    return findFirstCommand(args.commands, ["layers", "contents", "theme", "voxcity", "figure-composer"]) ?? activeCommand ?? null;
  }
  /* Publish-ready map → Publish (checked before generic publisher lens to surface it prominently) */
  if (args.isPublishReady) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["figure-composer", "add-map-to-report", "export-image"]), "publish") ?? activeCommand ?? null;
  }
  if (args.taskLens === "publisher") {
    return findFirstCommand(args.commands, ["figure-composer", "export-image", "add-map-to-report", "export-geojson"]) ?? activeCommand ?? null;
  }
  if (args.taskLens === "analyst") {
    const analystPrimary =
      findFirstCommand(args.commands, args.hasSelectedAoi ? ["workflow", "processing-toolbox", "query"] : ["layers", "processing-toolbox", "query"]) ??
      activeCommand;
    /* When the analyst lens has a specific command available, surface it immediately.
       If none of the analyst commands are registered (no callbacks provided), fall
       through to the project-management tier so "Save" can surface as primary. */
    if (analystPrimary != null) return analystPrimary;
  }
  if (args.toolbarRole === "publish") {
    return findFirstCommand(args.commands, ["figure-composer", "export-image", "add-map-to-report", "export-geojson"]) ?? activeCommand ?? null;
  }
  if (args.toolbarRole === "analyze" || args.workspaceView === "analyze") {
    const analyzePrimary =
      findFirstCommand(args.commands, args.hasSelectedAoi ? ["workflow", "processing-toolbox"] : ["processing-toolbox", "workflow"]) ??
      activeCommand;
    /* Fall through to project-management tier when no analyze-specific command is registered. */
    if (analyzePrimary != null) return analyzePrimary;
  }
  /* Dirty project → Save */
  if (args.canSave) {
    return asContextualPrimaryCommand(findFirstCommand(args.commands, ["save-project"]), "save") ?? activeCommand ?? null;
  }
  return findFirstCommand(args.commands, ["layers", "contents", "catalog", "import"]) ?? activeCommand ?? null;
}

function groupCommandsByTaxonomy(commands: readonly ToolbarCommand[]): Array<{
  id: CommandTaxonomyId;
  commands: ToolbarCommand[];
}> {
  return COMMAND_TAXONOMY_ORDER.map((id) => ({
    id,
    commands: commands.filter((command) => getCommandTaxonomy(command) === id),
  })).filter((group) => group.commands.length > 0);
}

function ToolbarCommandButton({
  command,
  density,
  menuItem = false,
  primary = false,
  onAfterClick,
}: ToolbarCommandButtonProps): React.ReactElement {
  const Icon = command.icon;
  const label = density === "comfortable" || menuItem ? command.label : command.shortLabel;
  const active = Boolean(command.active);
  const disabled = Boolean(command.disabled);
  const color = primary && !disabled ? MAP_COLORS.interaction : active ? MAP_COLORS.interaction : toneColor(command.tone ?? "default");
  const accessibleTitle = getCommandAccessibleTitle(command);
  const disabledReason = disabled ? getCommandUnavailableReason(command) : null;
  const disabledReasonId = disabledReason
    ? `map-toolbar-command-${getCommandDomIdSegment(command.id)}-disabled-reason`
    : undefined;

  return (
    <button
      type="button"
      style={commandButtonStyle(active, disabled, command.tone, density, menuItem, primary)}
      onClick={() => {
        if (disabled) return;
        command.onClick();
        onAfterClick?.();
      }}
      title={accessibleTitle}
      aria-label={accessibleTitle}
      aria-pressed={active || undefined}
      aria-disabled={disabled || undefined}
      aria-describedby={disabledReasonId}
      disabled={disabled}
      role={menuItem ? "menuitem" : undefined}
      data-testid={`map-toolbar-command-${command.id}`}
      data-map-command-id={command.id}
      data-disabled-reason={disabledReason ?? undefined}
      {...toolbarButtonInteraction(active, disabled, primary)}
    >
      <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} color={color} aria-hidden="true" />
      <span style={toolbarButtonText}>{label}</span>
      {command.badge != null && command.badge !== 0 ? <span style={toolbarBadge} aria-hidden="true">{command.badge}</span> : null}
      {disabledReason && disabledReasonId ? (
        <span id={disabledReasonId} style={mapStyles.srOnly}>
          Disabled: {disabledReason}
        </span>
      ) : null}
    </button>
  );
}

function TaskLensSwitch({
  taskLens,
  onTaskLensChange,
  compact = false,
}: {
  taskLens: MapTaskLensId;
  onTaskLensChange: (taskLens: MapTaskLensId) => void;
  compact?: boolean;
}): React.ReactElement {
  return (
    <div
      style={{
        ...roleSwitch,
        ...(compact ? { gap: "0.0625rem", padding: "0 0.0625rem" } satisfies React.CSSProperties : null),
      }}
      role="group"
      aria-label="Task lens selector"
    >
      {MAP_RUNTIME_TASK_LENSES.map((entry) => (
        <button
          key={entry.id}
          type="button"
          style={roleButtonStyle(taskLens === entry.id, compact)}
          onClick={() => onTaskLensChange(entry.id)}
          title={entry.description}
          aria-label={`Switch to ${entry.label} task lens`}
          aria-pressed={taskLens === entry.id}
          data-testid={`map-task-lens-${entry.id}`}
          {...toolbarButtonInteraction(taskLens === entry.id, false)}
        >
          {compact ? TASK_LENS_MICRO_LABELS[entry.id] : TASK_LENS_SHORT_LABELS[entry.id]}
        </button>
      ))}
    </div>
  );
}

function ToolbarOverflowMenu({
  commands,
  density,
  open,
  onToggle,
  onClose,
  children,
}: {
  commands: ToolbarCommand[];
  density: ToolbarDensity;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}): React.ReactElement | null {
  const groupedCommands = groupCommandsByTaxonomy(commands);
  const hasBody = commands.length > 0 || children != null;
  if (!hasBody) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={commandButtonStyle(open, false, "default", density)}
        onClick={onToggle}
        title="Open overflow map commands"
        aria-label="Open overflow map commands"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="map-command-center-overflow"
        {...toolbarButtonInteraction(open, false)}
      >
        <Settings2 size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
        <span style={toolbarButtonText}>More</span>
        <ChevronDown size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open ? (
        <div style={overflowMenuStyle} role="menu" aria-label="Overflow map commands">
          <div style={menuHeaderStyle}>
            <span>Command Center</span>
            <span>{commands.length} cmd</span>
          </div>
          {groupedCommands.map((group) => {
            const meta = MAP_COMMAND_TAXONOMY_META[group.id];
            const Icon = COMMAND_TAXONOMY_ICONS[group.id];
            return (
              <section key={group.id} style={overflowSectionStyle} aria-label={meta.title}>
                <div style={overflowSectionHeaderStyle}>
                  <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
                  <span>{meta.label}</span>
                  <span>{group.commands.length}</span>
                </div>
                {group.commands.map((command) => (
                  <ToolbarCommandButton
                    key={command.id}
                    command={command}
                    density="comfortable"
                    menuItem
                    onAfterClick={onClose}
                  />
                ))}
              </section>
            );
          })}
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarCommandGroupMenu({
  groupId,
  commands,
  density,
  open,
  onToggle,
  onClose,
  showLabel,
}: {
  groupId: TopSurfaceGroupId;
  commands: readonly ToolbarCommand[];
  density: ToolbarDensity;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  showLabel: boolean;
}): React.ReactElement | null {
  if (commands.length === 0) return null;

  const meta = TOP_SURFACE_GROUP_META[groupId];
  const Icon = meta.icon;
  const active = open || commands.some((command) => command.active);
  const tone = getTopSurfaceGroupTone(commands);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={commandButtonStyle(active, false, tone, density)}
        onClick={onToggle}
        title={meta.title}
        aria-label={meta.title}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid={`map-command-group-${groupId}`}
        {...toolbarButtonInteraction(active, false)}
      >
        <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
        {showLabel ? <span style={commandGroupButtonText}>{meta.shortLabel}</span> : <span style={mapStyles.srOnly}>{meta.label}</span>}
        <ChevronDown size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open ? (
        <div
          style={{
            ...commandGroupMenuStyle,
            ...(groupId === "publish" || groupId === "advanced" ? { left: "auto", right: 0 } : null),
          }}
          role="menu"
          aria-label={groupId === "publish" ? "Export commands" : `${meta.label} command group`}
          data-testid={`map-command-group-menu-${groupId}`}
        >
          <div style={commandGroupMenuHeaderStyle}>
            <span>{meta.label}</span>
            <span>{commands.length} cmd</span>
          </div>
          {commands.map((command) => (
            <ToolbarCommandButton
              key={command.id}
              command={command}
              density="comfortable"
              menuItem
              onAfterClick={onClose}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DensitySwitch({
  density,
  onDensityChange,
}: {
  density: ToolbarDensity;
  onDensityChange: (density: ToolbarDensity) => void;
}): React.ReactElement {
  return (
    <div style={{ display: "grid", gap: MAP_SPACING.xs, padding: MAP_SPACING.xs }}>
      <div style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
        Density
      </div>
      <div style={segmentedControlStyle} role="group" aria-label="Toolbar density">
        {(Object.keys(DENSITY_LABELS) as ToolbarDensity[]).map((entry) => (
          <button
            key={entry}
            type="button"
            style={roleButtonStyle(density === entry)}
            onClick={() => onDensityChange(entry)}
            aria-pressed={density === entry}
            aria-label={`Use ${DENSITY_LABELS[entry]} toolbar density`}
          >
            {DENSITY_LABELS[entry]}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommandPalette({
  open,
  commands,
  onClose,
}: {
  open: boolean;
  commands: PaletteCommand[];
  onClose: () => void;
}): React.ReactElement | null {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      const target = restoreFocusRef.current;
      if (target && document.contains(target)) {
        window.requestAnimationFrame(() => target.focus());
      }
    };
  }, [open]);

  const filteredCommands = React.useMemo(() => {
    return searchMapPaletteCommands(commands, query, 20);
  }, [commands, query]);
  const groupedFilteredCommands = React.useMemo(() => {
    return groupMapPaletteCommandsByTaxonomy(filteredCommands).map((group) => ({
      ...group,
      commands: group.commands.map((command) => ({
        command,
        index: filteredCommands.indexOf(command),
      })),
    }));
  }, [filteredCommands]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const firstRunnableIndex = filteredCommands.findIndex((command) => !command.disabled);
    const nextIndex = firstRunnableIndex >= 0 ? firstRunnableIndex : 0;
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [filteredCommands, open]);

  if (!open) return null;
  const selectedCommand = filteredCommands[activeIndex] ?? filteredCommands.find((command) => !command.disabled) ?? null;
  const runSelectedCommand = (): void => {
    if (!selectedCommand || selectedCommand.disabled) return;
    selectedCommand.onClick();
    onClose();
  };
  const moveActiveIndex = (delta: 1 | -1): void => {
    if (filteredCommands.length === 0) return;
    setActiveIndex((current) => {
      const next = (current + delta + filteredCommands.length) % filteredCommands.length;
      return next;
    });
  };
  const trapTabFocus = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [],
    ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    trapTabFocus(event);
  };
  const runShortcutLabel = formatMapKeybinding("runSelected");

  return (
    <>
      <div style={paletteBackdropStyle} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        style={paletteStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Map command palette"
        data-testid="map-command-palette"
        onKeyDown={handleDialogKeyDown}
      >
        <input
          ref={inputRef}
          style={paletteInputStyle}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveActiveIndex(1);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveActiveIndex(-1);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              runSelectedCommand();
            }
          }}
          placeholder="Search map commands and tools: buffer, import geojson, query layers, draw polygon"
          aria-label="Search map commands"
          aria-controls="map-command-palette-list"
          aria-activedescendant={selectedCommand ? `map-command-palette-option-${getCommandDomIdSegment(selectedCommand.id)}` : undefined}
        />
        <div id="map-command-palette-list" style={paletteListStyle} role="listbox" aria-label="Available map commands">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: MAP_SPACING.md, color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.sm }}>
              No matching command
            </div>
          ) : groupedFilteredCommands.map((group) => (
            <div
              key={group.taxonomyId}
              role="group"
              aria-label={group.metadata.title}
              data-testid={`map-command-palette-group-${group.taxonomyId}`}
              style={{ display: "grid", gap: MAP_SPACING.xs, paddingBlock: MAP_SPACING.xs }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: MAP_SPACING.sm,
                padding: `0 ${MAP_SPACING.sm}`,
                color: MAP_COLORS.textMuted,
                fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                textTransform: "uppercase",
                letterSpacing: 0,
              }}>
                <span>{group.metadata.label}</span>
                <span>{group.commands.length}</span>
              </div>
              {group.commands.map(({ command, index }) => (
                (() => {
                  const status = getCommandStatus(command);
                  const accessibleTitle = getCommandAccessibleTitle(command);
                  const optionId = `map-command-palette-option-${getCommandDomIdSegment(command.id)}`;
                  const selected = index === activeIndex;
                  const shortcutLabel = command.disabled ? null : command.shortcut ?? runShortcutLabel;
                  const disabledReason = command.disabled ? getCommandUnavailableReason(command) : null;
                  const disabledReasonId = disabledReason ? `${optionId}-disabled-reason` : undefined;
                  return (
                    <button
                      key={command.id}
                      id={optionId}
                      type="button"
                      style={{
                        ...commandButtonStyle(Boolean(command.active), Boolean(command.disabled), command.tone, "comfortable", true),
                        maxWidth: "100%",
                        minHeight: "3rem",
                        display: "grid",
                        gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
                        background: selected ? MAP_COLORS.neutralSubtle : command.active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
                        opacity: command.disabled ? 0.55 : 1,
                        cursor: command.disabled ? "not-allowed" : "pointer",
                      }}
                      data-testid={`map-command-palette-option-${command.id}`}
                      onClick={() => {
                        if (command.disabled) return;
                        command.onClick();
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      title={accessibleTitle}
                      role="option"
                      aria-label={command.disabled ? `${command.label}. ${accessibleTitle}` : `${command.label}. ${command.title}`}
                      aria-selected={selected || command.active || undefined}
                      aria-disabled={command.disabled || undefined}
                      aria-describedby={disabledReasonId}
                      data-disabled-reason={disabledReason ?? undefined}
                      disabled={command.disabled}
                    >
                      {React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true })}
                      <span style={{ display: "grid", minWidth: 0, textAlign: "left", gap: "0.125rem" }}>
                        <span style={{ color: MAP_COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {command.label}
                        </span>
                        <span style={{ color: MAP_COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {command.disabled ? accessibleTitle : command.title}
                        </span>
                      </span>
                      <span style={{ display: "grid", justifyItems: "end", gap: "0.125rem" }}>
                        <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                          {getCommandCategory(command)}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.1875rem" }}>
                          {shortcutLabel ? (
                            <span style={{ ...toolbarBadge, color: MAP_COLORS.textMuted, background: MAP_COLORS.bg }}>
                              {shortcutLabel}
                            </span>
                          ) : null}
                          <span style={{ ...toolbarBadge, color: toneColor(status.tone), background: status.tone === "default" ? MAP_COLORS.bg : MAP_COLORS.selectedSubtle }}>
                            {command.badge != null && command.badge !== 0 ? command.badge : status.label}
                          </span>
                        </span>
                      </span>
                      {disabledReason && disabledReasonId ? (
                        <span id={disabledReasonId} style={mapStyles.srOnly}>
                          Disabled: {disabledReason}
                        </span>
                      ) : null}
                    </button>
                  );
                })()
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapToolbar: React.FC<MapToolbarProps> = ({
  workspaceView = "explore",
  onWorkspaceViewChange,
  taskLens: taskLensProp,
  onTaskLensChange,
  onResetLayout,
  onCollapsePanels,
  onFocusMapCanvas,
  onRestoreDefaultWidths,
  pinMode,
  onTogglePinMode,
  showSidebar,
  onToggleSidebar,
  pinCount,
  showLayerPanel = false,
  onToggleLayerPanel,
  layerCount = 0,
  visibleLayerCount = layerCount,
  showCatalog = false,
  onToggleCatalog,
  catalogSourceCount = 0,
  showContents = false,
  onToggleContents,
  activeLayerGeometryType = null,
  hasSelectedAoi = false,
  scientificQAStatus = "unchecked",
  scientificQAIssueCount = 0,
  scientificQABlockerCount = 0,
  showScientificQAPanel = false,
  onToggleScientificQAPanel,
  showNLQueryPanel = false,
  onToggleNLQueryPanel,
  nlQueryLayerCount = 0,
  showWorkflowDrawer = false,
  onToggleWorkflowDrawer,
  workflowReadyCount = 0,
  showReviewTimeline = false,
  onToggleReviewTimeline,
  reviewEventCount = 0,
  showPerformanceDiagnostics = false,
  onTogglePerformanceDiagnostics,
  performanceIssueCount = 0,
  showPluginPanel = false,
  onTogglePluginPanel,
  pluginExtensionCount = 0,
  showProcessingToolbox = false,
  onToggleProcessingToolbox,
  processingToolCount = 0,
  showModelBuilder = false,
  onToggleModelBuilder,
  showFigureComposer = false,
  onToggleFigureComposer,
  showChoroplethPanel = false,
  onToggleChoroplethPanel,
  showClusterViz = false,
  onToggleClusterViz,
  showHotSpotViz = false,
  onToggleHotSpotViz,
  showEmergingHotSpotViz = false,
  onToggleEmergingHotSpotViz,
  viewportSyncEnabled = false,
  onToggleViewportSync,
  showVoxCityOverlayPanel = false,
  onToggleVoxCityOverlayPanel,
  voxCityFootprintCount = 0,
  restrictToMapView = false,
  onToggleRestrictToMapView,
  activeDrawTool = null,
  onSetDrawTool,
  drawnFeatureCount = 0,
  showDrawPanel = false,
  onToggleDrawPanel,
  annotationMode = false,
  onToggleAnnotationMode,
  annotationCount = 0,
  activeMeasureTool = null,
  onSetMeasureTool,
  measurementCount = 0,
  showMeasurePanel = false,
  onToggleMeasurePanel,
  onImportClick,
  onOpenExternalServices,
  onExportClick,
  onImageExportClick,
  onExportPackageClick,
  onAddToReportClick,
  onSaveProjectClick,
  onLoadProjectClick,
  isImporting = false,
  importProgress = null,
  exportDisabled = false,
  exportDisabledReason = undefined,
  packageExportDisabled = false,
  packageExportDisabledReason = undefined,
  reportDisabled = false,
  reportDisabledReason = undefined,
  isExportingImage = false,
  isExportingPackage = false,
  isSavingProject = false,
  isLoadingProject = false,
  persistenceDisabled = false,
  hasUnsavedProjectChanges = false,
  processingTools = [],
  processingLayerOptions = [],
  onRunProcessingToolCommand,
  canUndoMapAction = false,
  canRedoMapAction = false,
  undoMapActionLabel = null,
  redoMapActionLabel = null,
  onUndoMapAction,
  onRedoMapAction,
}) => {
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const [toolbarWidth, setToolbarWidth] = React.useState(1280);
  const density = useMapToolbarPreferencesStore((state) => state.density);
  const setDensity = useMapToolbarPreferencesStore((state) => state.setDensity);
  const storedTaskLens = useMapToolbarPreferencesStore((state) => state.taskLens);
  const setStoredTaskLens = useMapToolbarPreferencesStore((state) => state.setTaskLens);
  const taskLens = taskLensProp ?? storedTaskLens;
  const toolbarRole = getRoleForTaskLens(taskLens, workspaceView);
  const [openMenu, setOpenMenu] = React.useState<TopSurfaceGroupId | "more" | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const element = toolbarRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setToolbarWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isMapUndoShortcut(event) && !isEditableShortcutTarget(event.target)) {
        if (canUndoMapAction && onUndoMapAction) {
          event.preventDefault();
          onUndoMapAction();
        }
        return;
      }
      if (isMapRedoShortcut(event) && !isEditableShortcutTarget(event.target)) {
        if (canRedoMapAction && onRedoMapAction) {
          event.preventDefault();
          onRedoMapAction();
        }
        return;
      }
      if (isOpenPaletteShortcut(event) && !shouldIgnoreMapPaletteShortcut(event)) {
        event.preventDefault();
        setPaletteOpen(true);
        setOpenMenu(null);
        return;
      }
      if (event.key === "Escape" && (paletteOpen || openMenu)) {
        event.preventDefault();
        event.stopPropagation();
        setOpenMenu(null);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [canRedoMapAction, canUndoMapAction, onRedoMapAction, onUndoMapAction, openMenu, paletteOpen]);

  React.useEffect(() => {
    if (!openMenu) return;
    const handlePointerDown = (event: MouseEvent): void => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener("mousedown", handlePointerDown, { capture: true });
    return () => window.removeEventListener("mousedown", handlePointerDown, { capture: true });
  }, [openMenu]);

  const handleTaskLensChange = React.useCallback((nextTaskLens: MapTaskLensId) => {
    setStoredTaskLens(nextTaskLens);
    onTaskLensChange?.(nextTaskLens);
    setOpenMenu(null);
  }, [onTaskLensChange, setStoredTaskLens]);

  const handleSwitchDensity = React.useCallback(() => {
    setDensity(getNextToolbarDensityPreference(density));
  }, [density, setDensity]);

  const commands = React.useMemo(
    () => buildToolbarCommands({
      workspaceView,
      onWorkspaceViewChange,
      taskLens,
      density,
      onTaskLensChange: handleTaskLensChange,
      onSwitchDensity: handleSwitchDensity,
      onResetLayout,
      onCollapsePanels,
      onFocusMapCanvas,
      onRestoreDefaultWidths,
      pinMode,
      onTogglePinMode,
      showSidebar,
      onToggleSidebar,
      pinCount,
      showLayerPanel,
      onToggleLayerPanel,
      layerCount,
      visibleLayerCount,
      showCatalog,
      onToggleCatalog,
      catalogSourceCount,
      showContents,
      onToggleContents,
      activeLayerGeometryType,
      hasSelectedAoi,
      scientificQAStatus,
      scientificQAIssueCount,
      scientificQABlockerCount,
      showScientificQAPanel,
      onToggleScientificQAPanel,
      showNLQueryPanel,
      onToggleNLQueryPanel,
      nlQueryLayerCount,
      showWorkflowDrawer,
      onToggleWorkflowDrawer,
      workflowReadyCount,
      showReviewTimeline,
      onToggleReviewTimeline,
      reviewEventCount,
      showPerformanceDiagnostics,
      onTogglePerformanceDiagnostics,
      performanceIssueCount,
      showPluginPanel,
      onTogglePluginPanel,
      pluginExtensionCount,
      showProcessingToolbox,
      onToggleProcessingToolbox,
      processingToolCount,
      showModelBuilder,
      onToggleModelBuilder,
      showFigureComposer,
      onToggleFigureComposer,
      showChoroplethPanel,
      onToggleChoroplethPanel,
      showClusterViz,
      onToggleClusterViz,
      showHotSpotViz,
      onToggleHotSpotViz,
      showEmergingHotSpotViz,
      onToggleEmergingHotSpotViz,
      viewportSyncEnabled,
      onToggleViewportSync,
      showVoxCityOverlayPanel,
      onToggleVoxCityOverlayPanel,
      voxCityFootprintCount,
      restrictToMapView,
      onToggleRestrictToMapView,
      activeDrawTool,
      onSetDrawTool,
      drawnFeatureCount,
      showDrawPanel,
      onToggleDrawPanel,
      annotationMode,
      onToggleAnnotationMode,
      annotationCount,
      activeMeasureTool,
      onSetMeasureTool,
      measurementCount,
      showMeasurePanel,
      onToggleMeasurePanel,
      onImportClick,
      onOpenExternalServices,
      onExportClick,
      onImageExportClick,
      onExportPackageClick,
      onAddToReportClick,
      onSaveProjectClick,
      onLoadProjectClick,
      isImporting,
      importProgress,
      exportDisabled,
      exportDisabledReason,
      packageExportDisabled,
      packageExportDisabledReason,
      reportDisabled,
      reportDisabledReason,
      isExportingImage,
      isExportingPackage,
      isSavingProject,
      isLoadingProject,
      persistenceDisabled,
      hasUnsavedProjectChanges,
      canUndoMapAction,
      canRedoMapAction,
      undoMapActionLabel,
      redoMapActionLabel,
      onUndoMapAction,
      onRedoMapAction,
    }),
    [
      activeDrawTool,
      activeLayerGeometryType,
      activeMeasureTool,
      annotationCount,
      annotationMode,
      canRedoMapAction,
      canUndoMapAction,
      density,
      drawnFeatureCount,
      exportDisabled,
      exportDisabledReason,
      handleSwitchDensity,
      handleTaskLensChange,
      hasSelectedAoi,
      importProgress,
      isExportingImage,
      isExportingPackage,
      isImporting,
      isLoadingProject,
      isSavingProject,
      layerCount,
      catalogSourceCount,
      measurementCount,
      nlQueryLayerCount,
      onRedoMapAction,
      onWorkspaceViewChange,
      onCollapsePanels,
      onExportClick,
      onFocusMapCanvas,
      onImageExportClick,
      onExportPackageClick,
      onAddToReportClick,
      onImportClick,
      onLoadProjectClick,
      onOpenExternalServices,
      onResetLayout,
      onRestoreDefaultWidths,
      onSaveProjectClick,
      onSetDrawTool,
      onSetMeasureTool,
      onToggleAnnotationMode,
      onToggleChoroplethPanel,
      onToggleClusterViz,
      onToggleDrawPanel,
      onToggleEmergingHotSpotViz,
      onToggleHotSpotViz,
      onToggleLayerPanel,
      onToggleCatalog,
      onToggleContents,
      onToggleMeasurePanel,
      onToggleNLQueryPanel,
      onTogglePerformanceDiagnostics,
      onTogglePluginPanel,
      onToggleProcessingToolbox,
      onToggleModelBuilder,
      onToggleWorkflowDrawer,
      onTogglePinMode,
      onToggleRestrictToMapView,
      onToggleScientificQAPanel,
      onToggleSidebar,
      onToggleViewportSync,
      onToggleVoxCityOverlayPanel,
      onUndoMapAction,
      persistenceDisabled,
      packageExportDisabled,
      packageExportDisabledReason,
      performanceIssueCount,
      pluginExtensionCount,
      processingToolCount,
      pinCount,
      pinMode,
      restrictToMapView,
      reportDisabled,
      reportDisabledReason,
      redoMapActionLabel,
      reviewEventCount,
      scientificQABlockerCount,
      scientificQAIssueCount,
      scientificQAStatus,
      showChoroplethPanel,
      showClusterViz,
      showDrawPanel,
      showEmergingHotSpotViz,
      showHotSpotViz,
      showLayerPanel,
      showCatalog,
      showContents,
      showMeasurePanel,
      showNLQueryPanel,
      showPerformanceDiagnostics,
      showPluginPanel,
      showProcessingToolbox,
      showModelBuilder,
      showReviewTimeline,
      showFigureComposer,
      showWorkflowDrawer,
      onToggleReviewTimeline,
      onToggleFigureComposer,
      workflowReadyCount,
      showScientificQAPanel,
      showSidebar,
      showVoxCityOverlayPanel,
      taskLens,
      undoMapActionLabel,
      visibleLayerCount,
      voxCityFootprintCount,
      viewportSyncEnabled,
      workspaceView,
    ],
  );

  const breakpoint = getBreakpoint(toolbarWidth);
  const compactTaskLens = toolbarWidth < 760;
  const primaryButtonDensity: ToolbarDensity = toolbarWidth < 340 ? "compact" : "comfortable";
  const paletteButtonDensity: ToolbarDensity = toolbarWidth < 500 ? "compact" : "comfortable";
  const commandRegistry = commands;
  const primaryCommand = React.useMemo(
    () => selectContextualPrimaryCommand({
      commands: commandRegistry,
      toolbarRole,
      taskLens,
      workspaceView,
      visibleLayerCount,
      hasSelectedAoi,
      scientificQABlockerCount,
      scientificQAIssueCount,
      isImporting,
      hasSelectedLayer: activeLayerGeometryType != null,
      isPublishReady:
        visibleLayerCount > 0 &&
        scientificQABlockerCount === 0 &&
        scientificQAIssueCount === 0 &&
        taskLens === "publisher",
      canSave:
        hasUnsavedProjectChanges &&
        !persistenceDisabled &&
        !isSavingProject &&
        onSaveProjectClick != null,
    }),
    [
      activeLayerGeometryType,
      commandRegistry,
      hasSelectedAoi,
      hasUnsavedProjectChanges,
      isImporting,
      isSavingProject,
      layerCount,
      onSaveProjectClick,
      persistenceDisabled,
      scientificQABlockerCount,
      scientificQAIssueCount,
      taskLens,
      toolbarRole,
      visibleLayerCount,
      workspaceView,
    ],
  );
  const showInlinePalette = true;

  const openPaletteShortcut = formatMapKeybinding("openPalette");
  const commandPaletteCommand = React.useMemo<PaletteCommand>(() => ({
    id: "command-palette",
    label: "Commands",
    shortLabel: "Cmd",
    title: `Open command palette (${openPaletteShortcut})`,
    keywords: uniqueCommandTerms([
      "command palette",
      "ctrl k",
      "cmd k",
      "search commands",
      "keyboard",
      ...MAP_COMMAND_TAXONOMY_META.project.keywords,
      ...(LEGACY_COMMAND_ALIASES["command-palette"] ?? []),
    ]),
    aliases: LEGACY_COMMAND_ALIASES["command-palette"],
    icon: Command,
    onClick: () => {
      setPaletteOpen(true);
      setOpenMenu(null);
    },
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 999,
    shortcut: openPaletteShortcut,
    category: MAP_COMMAND_TAXONOMY_META.project.label,
    taxonomy: "project",
    source: "toolbar",
  }), [openPaletteShortcut]);

  const processingPaletteCommands = React.useMemo(
    () => buildProcessingPaletteCommands({
      tools: processingTools,
      layers: processingLayerOptions,
      onRun: onRunProcessingToolCommand,
    }),
    [onRunProcessingToolCommand, processingLayerOptions, processingTools],
  );

  const paletteCommands = React.useMemo(
    () => [
      commandPaletteCommand,
      ...commands.map((command): PaletteCommand => {
        const taxonomy = getCommandTaxonomy(command);
        const aliases = getCommandAliases(command);
        return {
          ...command,
          category: getCommandCategory(command),
          taxonomy,
          aliases,
          keywords: getEnrichedCommandKeywords(command, taxonomy, aliases),
          source: "toolbar",
        };
      }),
      ...processingPaletteCommands,
    ],
    [commandPaletteCommand, commands, processingPaletteCommands],
  );

  const inlineGroups = React.useMemo(() => {
    const visibleGroupIds = new Set(getVisibleTopSurfaceGroupIds(toolbarWidth));
    const grouped = groupCommandsByTopSurface(commandRegistry);
    return grouped.filter((group) => visibleGroupIds.has(group.id));
  }, [commandRegistry, toolbarWidth]);
  const showGroupLabels = toolbarWidth >= 860;
  const groupButtonDensity: ToolbarDensity = toolbarWidth < 620 ? "compact" : density;
  const directCommandIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (primaryCommand) ids.add(primaryCommand.id);
    return ids;
  }, [primaryCommand]);
  const overflowCommands = React.useMemo(
    () => commandRegistry.filter((command) => !directCommandIds.has(command.id)),
    [commandRegistry, directCommandIds],
  );
  const visibleCommandCount =
    1
    + (workspaceView !== "navigator" ? 1 : 0)
    + (primaryCommand ? 1 : 0)
    + inlineGroups.length;

  const advancedFooter = (
    <>
      <DensitySwitch
        density={density}
        onDensityChange={(nextDensity) => {
          setDensity(nextDensity);
          setOpenMenu(null);
        }}
      />
      <ToolbarCommandButton
        command={commandPaletteCommand}
        density="comfortable"
        menuItem
        onAfterClick={() => setOpenMenu(null)}
      />
      <div style={{
        display: "grid",
        gridTemplateColumns: "1rem minmax(0, 1fr)",
        gap: MAP_SPACING.xs,
        padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
        color: MAP_COLORS.textMuted,
        fontSize: MAP_TYPOGRAPHY.fontSize.xs,
        borderTop: MAP_STROKES.hairlineSubtle,
      }}>
        <Keyboard size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
        <span>{openPaletteShortcut} searches map commands and processing tools.</span>
      </div>
    </>
  );

  return (
    <div
      ref={toolbarRef}
      style={toolbarShell}
      aria-label={`Map command center for ${workspaceView} workspace`}
      data-testid="map-command-center"
      data-map-command-center="true"
      data-command-registry-count={commandRegistry.length}
      data-command-center-visible-count={String(visibleCommandCount)}
      data-toolbar-density={density}
      data-task-lens={taskLens}
      data-toolbar-breakpoint={breakpoint}
    >
      {workspaceView !== "navigator" ? (
        <div data-testid="map-command-center-active-lens" data-active-lens={taskLens}>
          <TaskLensSwitch
            taskLens={taskLens}
            onTaskLensChange={handleTaskLensChange}
            compact={compactTaskLens}
          />
        </div>
      ) : (
        <div
          style={{ ...roleSwitch, color: MAP_COLORS.textMuted }}
          data-testid="map-command-center-active-lens"
          data-active-lens="overview"
        >
          <Compass size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
          <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Overview</span>
        </div>
      )}

      <div style={commandRail} aria-label="Task lens, primary action, direct actions, and grouped map commands">
        {primaryCommand ? (
          <div style={primaryActionShell} data-testid="map-command-center-primary-action">
            <ToolbarCommandButton command={primaryCommand} density={primaryButtonDensity} primary />
          </div>
        ) : null}
        {showInlinePalette ? (
          <ToolbarCommandButton command={commandPaletteCommand} density={paletteButtonDensity} />
        ) : null}
        <div style={commandGroupRail} aria-label="Grouped top-surface commands">
          {inlineGroups.map((group) => (
            <ToolbarCommandGroupMenu
              key={group.id}
              groupId={group.id}
              commands={group.commands}
              density={groupButtonDensity}
              open={openMenu === group.id}
              onToggle={() => setOpenMenu((current) => current === group.id ? null : group.id)}
              onClose={() => setOpenMenu(null)}
              showLabel={showGroupLabels}
            />
          ))}
        </div>
      </div>

      <div style={overflowRail} aria-label="Overflow map command groups">
        <ToolbarOverflowMenu
          commands={overflowCommands}
          density={density}
          open={openMenu === "more"}
          onToggle={() => setOpenMenu((current) => current === "more" ? null : "more")}
          onClose={() => setOpenMenu(null)}
        >
          {advancedFooter}
        </ToolbarOverflowMenu>
        {workspaceView === "analyze" || workspaceView === "navigator" ? <BackgroundTasksControl compact /> : null}
      </div>

      <CommandPalette
        open={paletteOpen}
        commands={paletteCommands}
        onClose={() => setPaletteOpen(false)}
      />
      <span style={mapStyles.srOnly}>
        The visible command center shows the task lens selector, contextual primary action, direct undo and redo when available, grouped data and analysis menus, and grouped overflow. The command palette keeps the complete map command registry searchable.
      </span>
    </div>
  );
};
