import React from "react";
import {
  AlertTriangle,
  BarChart3,
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
  RectangleHorizontal,
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
  Upload,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import BackgroundTasksControl from "../BackgroundTasksControl";
import type { DrawToolId, LayerQaStatus, MeasureToolId } from "./mapTypes";
import type { MapWorkspaceView } from "./mapExperience";
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
  pinMode: boolean;
  onTogglePinMode: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  pinCount: number;
  showLayerPanel?: boolean;
  onToggleLayerPanel?: () => void;
  layerCount?: number;
  visibleLayerCount?: number;
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
  onAddToReportClick?: () => void;
  onSaveProjectClick?: () => void;
  onLoadProjectClick?: () => void;
  isImporting?: boolean;
  importProgress?: number | null;
  exportDisabled?: boolean;
  reportDisabled?: boolean;
  isExportingImage?: boolean;
  isSavingProject?: boolean;
  isLoadingProject?: boolean;
  persistenceDisabled?: boolean;
}

type CommandTone = "default" | "accent" | "danger" | "success" | "warning";
type ToolbarRole = "explore" | "analyze" | "publish";
type ToolbarDensity = "compact" | "comfortable" | "expert";
type ToolbarBreakpoint = "mobile" | "tablet" | "desktop";
type OverflowGroupId = "tools" | "export" | "advanced";

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
  badge?: number | string | null;
  tone?: CommandTone;
  contextBoost?: "empty" | "point" | "polygon" | "aoi" | "quality" | "query" | undefined;
  navigator?: boolean;
  shortcut?: string;
}

interface ToolbarCommandButtonProps {
  command: ToolbarCommand;
  density: ToolbarDensity;
  menuItem?: boolean;
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
  | "reportDisabled"
  | "isExportingImage"
  | "isSavingProject"
  | "isLoadingProject"
  | "persistenceDisabled"
>> {
  importProgress: number | null;
  onWorkspaceViewChange?: ((view: MapWorkspaceView) => void) | undefined;
  onToggleLayerPanel?: (() => void) | undefined;
  onToggleScientificQAPanel?: (() => void) | undefined;
  onToggleNLQueryPanel?: (() => void) | undefined;
  onToggleWorkflowDrawer?: (() => void) | undefined;
  onToggleReviewTimeline?: (() => void) | undefined;
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
  onAddToReportClick?: (() => void) | undefined;
  onSaveProjectClick?: (() => void) | undefined;
  onLoadProjectClick?: (() => void) | undefined;
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

const ROLE_LABELS: Record<ToolbarRole, string> = {
  explore: "Explore",
  analyze: "Analyze",
  publish: "Publish",
};

const DENSITY_LABELS: Record<ToolbarDensity, string> = {
  compact: "Compact",
  comfortable: "Comfort",
  expert: "Expert",
};

const OVERFLOW_META: Record<OverflowGroupId, { label: string; title: string; icon: LucideIcon }> = {
  tools: {
    label: "Tools",
    title: "Drawing, measuring, and map interaction tools",
    icon: Waypoints,
  },
  export: {
    label: "Export",
    title: "Save, load, and export map outputs",
    icon: Download,
  },
  advanced: {
    label: "Advanced",
    title: "Scientific QA, 3D sync, density, and command controls",
    icon: Settings2,
  },
};

const TOOLBAR_DENSITY_STORAGE_KEY = "synapse-map-toolbar-density";

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
  gap: "0.1875rem",
  minWidth: MAP_SPACING.zero,
  maxWidth: "100%",
  overflowX: "clip",
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
  borderRight: MAP_STROKES.hairlineSubtle,
  gap: "0.125rem",
};

const commandRail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  flex: "1 1 auto",
  minWidth: MAP_SPACING.zero,
  gap: "0.125rem",
  overflow: "hidden",
};

const overflowRail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  flex: "0 0 auto",
  gap: "0.125rem",
  borderLeft: MAP_STROKES.hairlineSubtle,
  paddingLeft: MAP_SPACING.xs,
};

const toolbarButtonText: React.CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const toolbarBadge: React.CSSProperties = {
  minWidth: "0.875rem",
  height: "0.875rem",
  padding: `${MAP_SPACING.zero} 0.1875rem`,
  borderRadius: MAP_RADIUS.full,
  background: MAP_COLORS.amberSubtle,
  border: MAP_STROKES.none,
  color: MAP_COLORS.amber,
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
  width: "min(22rem, calc(100vw - 2rem))",
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.dropdown,
  display: "grid",
  gap: "0.125rem",
};

const paletteBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: MAP_Z_INDEX.dropdown,
  background: "rgba(0, 0, 0, 0.28)",
};

const paletteStyle: React.CSSProperties = {
  position: "fixed",
  top: "5.5rem",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  width: "min(42rem, calc(100vw - 2rem))",
  maxHeight: "min(38rem, calc(100vh - 7rem))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxShadow: MAP_SHADOWS.modal,
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

const segmentedControlStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  padding: "0.125rem",
};

const toolbarFocusOutline = `2px solid ${MAP_COLORS.amberBorderStrong}`;

function toneColor(tone: CommandTone): string {
  switch (tone) {
    case "danger":
      return MAP_COLORS.error;
    case "success":
      return MAP_COLORS.success;
    case "warning":
      return MAP_COLORS.warning;
    case "accent":
      return MAP_COLORS.amber;
    default:
      return MAP_COLORS.textSecondary;
  }
}

function commandButtonStyle(
  active = false,
  disabled = false,
  tone: CommandTone = "default",
  density: ToolbarDensity = "expert",
  menuItem = false,
): React.CSSProperties {
  const color = active ? MAP_COLORS.amber : toneColor(tone);
  const height = menuItem ? "2.125rem" : density === "comfortable" ? "1.95rem" : "1.7rem";
  const paddingX = menuItem ? MAP_SPACING.sm : density === "comfortable" ? MAP_SPACING.sm : MAP_SPACING.xs;
  const maxWidth = menuItem ? "100%" : density === "comfortable" ? "7.25rem" : density === "compact" ? "5.9rem" : "5.25rem";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: menuItem ? "flex-start" : "center",
    gap: density === "comfortable" || menuItem ? "0.375rem" : "0.25rem",
    minHeight: height,
    maxWidth,
    padding: `${MAP_SPACING.zero} ${paddingX}`,
    borderRadius: MAP_RADIUS.sm,
    border: active ? `1px solid ${MAP_COLORS.amberBorderStrong}` : "1px solid transparent",
    background: active ? MAP_COLORS.amberSubtle : MAP_COLORS.transparent,
    color,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: MAP_TRANSITIONS.fast,
    boxShadow: "none",
  };
}

function toolbarButtonInteraction(
  active = false,
  disabled = false,
): Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"> {
  return {
    onMouseEnter: (event) => {
      if (active || disabled) return;
      event.currentTarget.style.background = MAP_COLORS.amberDim;
      event.currentTarget.style.color = MAP_COLORS.amber;
    },
    onMouseLeave: (event) => {
      if (active || disabled) return;
      event.currentTarget.style.background = MAP_COLORS.transparent;
      event.currentTarget.style.color = "";
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

function roleButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "1.5rem",
    padding: `0 ${MAP_SPACING.xs}`,
    border: MAP_STROKES.none,
    borderRadius: MAP_RADIUS.sm,
    background: active ? MAP_COLORS.amberSubtle : MAP_COLORS.transparent,
    color: active ? MAP_COLORS.amber : MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    cursor: "pointer",
    textTransform: "uppercase",
  };
}

function iconForQAStatus(status: LayerQaStatus): LucideIcon {
  if (status === "error") return ShieldAlert;
  if (status === "warning") return AlertTriangle;
  return ShieldCheck;
}

function normalizeGeometryType(value?: string | null): "point" | "polygon" | "line" | "mixed" | "unknown" {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("point")) return "point";
  if (normalized.includes("polygon") || normalized.includes("multi")) return "polygon";
  if (normalized.includes("line")) return "line";
  if (normalized.includes("mixed")) return "mixed";
  return "unknown";
}

function getDefaultRole(workspaceView: MapWorkspaceView): ToolbarRole {
  if (workspaceView === "analyze") return "analyze";
  return "explore";
}

function readStoredDensity(): ToolbarDensity {
  if (typeof window === "undefined") return "expert";
  const stored = window.localStorage.getItem(TOOLBAR_DENSITY_STORAGE_KEY);
  if (stored === "compact" || stored === "comfortable" || stored === "expert") {
    return stored;
  }
  return "expert";
}

function getBreakpoint(width: number): ToolbarBreakpoint {
  if (width < 720) return "mobile";
  if (width < 1120) return "tablet";
  return "desktop";
}

function getVisibleCommandLimit(breakpoint: ToolbarBreakpoint, density: ToolbarDensity): number {
  if (breakpoint === "mobile") {
    return density === "expert" ? 5 : density === "compact" ? 4 : 3;
  }
  if (breakpoint === "tablet") {
    return density === "expert" ? 7 : density === "compact" ? 7 : 6;
  }
  return density === "expert" ? 7 : density === "compact" ? 8 : 7;
}

function isCommandVisibleInRole(command: ToolbarCommand, role: ToolbarRole, workspaceView: MapWorkspaceView): boolean {
  if (workspaceView === "navigator") {
    return Boolean(command.navigator);
  }
  return command.roles.includes(role);
}

function getContextScore(command: ToolbarCommand, args: {
  visibleLayerCount: number;
  geometryType: ReturnType<typeof normalizeGeometryType>;
  hasSelectedAoi: boolean;
}): number {
  let score = command.priority;
  if (command.active) score += 50;
  if (command.contextBoost === "empty" && args.visibleLayerCount === 0) score += 34;
  if (command.contextBoost === "query" && args.visibleLayerCount > 0) score += 16;
  if (command.contextBoost === "quality" && args.visibleLayerCount > 0) score += 12;
  if (command.contextBoost === "aoi" && !args.hasSelectedAoi) score += 10;
  if (command.contextBoost === "point" && args.geometryType === "point") score += 28;
  if (command.contextBoost === "polygon" && args.geometryType === "polygon") score += 28;
  return score;
}

function getCommandCategory(command: ToolbarCommand): string {
  if (command.id === "command-palette") return "System";
  return OVERFLOW_META[command.overflowGroup]?.label ?? "Map";
}

function getCommandStatus(command: ToolbarCommand): { label: string; tone: CommandTone } {
  if (command.disabled) return { label: "Unavailable", tone: "warning" };
  if (command.active) return { label: "Active", tone: "accent" };
  return { label: "Ready", tone: "default" };
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

  add(args.onImportClick && {
    id: "import",
    label: args.isImporting ? "Importing" : "Import",
    shortLabel: args.isImporting ? "Import" : "Import",
    title: "Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files",
    keywords: ["import geojson", "upload data", "load file", "add data"],
    icon: Upload,
    onClick: args.onImportClick,
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "tools",
    priority: hasLayers ? 88 : 125,
    disabled: args.isImporting,
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
    keywords: ["3d sync", "voxcfity camera", "linked viewport"],
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

  add(args.onSaveProjectClick && !args.persistenceDisabled && {
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
    disabled: args.isSavingProject,
    contextBoost: "empty",
    navigator: true,
  });

  add(args.onLoadProjectClick && !args.persistenceDisabled && {
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
    disabled: args.isLoadingProject,
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
    navigator: true,
  });

  add(args.onExportClick && !args.exportDisabled && {
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
  });

  return commands;
}

function ToolbarCommandButton({
  command,
  density,
  menuItem = false,
  onAfterClick,
}: ToolbarCommandButtonProps): React.ReactElement {
  const Icon = command.icon;
  const label = density === "comfortable" || menuItem ? command.label : command.shortLabel;
  const active = Boolean(command.active);
  const disabled = Boolean(command.disabled);
  const color = active ? MAP_COLORS.amber : toneColor(command.tone ?? "default");

  return (
    <button
      type="button"
      style={commandButtonStyle(active, disabled, command.tone, density, menuItem)}
      onClick={() => {
        if (disabled) return;
        command.onClick();
        onAfterClick?.();
      }}
      title={command.title}
      aria-label={command.title}
      aria-pressed={active || undefined}
      disabled={disabled}
      {...toolbarButtonInteraction(active, disabled)}
    >
      <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} color={color} aria-hidden="true" />
      <span style={toolbarButtonText}>{label}</span>
      {command.badge != null && command.badge !== 0 ? <span style={toolbarBadge} aria-hidden="true">{command.badge}</span> : null}
    </button>
  );
}

function RoleSwitch({
  role,
  onRoleChange,
}: {
  role: ToolbarRole;
  onRoleChange: (role: ToolbarRole) => void;
}): React.ReactElement {
  return (
    <div style={roleSwitch} role="group" aria-label="Role-based toolbar modes">
      {(Object.keys(ROLE_LABELS) as ToolbarRole[]).map((entry) => (
        <button
          key={entry}
          type="button"
          style={roleButtonStyle(role === entry)}
          onClick={() => onRoleChange(entry)}
          title={`Switch toolbar to ${ROLE_LABELS[entry]} mode`}
          aria-label={`Switch toolbar to ${ROLE_LABELS[entry]} mode`}
          aria-pressed={role === entry}
          {...toolbarButtonInteraction(role === entry, false)}
        >
          {ROLE_LABELS[entry]}
        </button>
      ))}
    </div>
  );
}

function ToolbarOverflowMenu({
  id,
  commands,
  density,
  open,
  onToggle,
  onClose,
  children,
}: {
  id: OverflowGroupId;
  commands: ToolbarCommand[];
  density: ToolbarDensity;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}): React.ReactElement | null {
  const meta = OVERFLOW_META[id];
  const Icon = meta.icon;
  const hasBody = commands.length > 0 || children != null;
  if (!hasBody) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={commandButtonStyle(open, false, "default", density)}
        onClick={onToggle}
        title={meta.title}
        aria-label={meta.title}
        aria-expanded={open}
        aria-haspopup="menu"
        {...toolbarButtonInteraction(open, false)}
      >
        <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
        <span style={toolbarButtonText}>{meta.label}</span>
        <ChevronDown size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open ? (
        <div style={overflowMenuStyle} role="menu" aria-label={`${meta.label} commands`}>
          <div style={menuHeaderStyle}>
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
          {children}
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
  commands: ToolbarCommand[];
  onClose: () => void;
}): React.ReactElement | null {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filteredCommands = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const candidates = commands;
    if (!normalized) return candidates.slice(0, 16);
    return candidates
      .filter((command) => {
        const haystack = [
          command.label,
          command.shortLabel,
          command.title,
          command.id,
          ...command.keywords,
        ].join(" ").toLowerCase();
        return normalized.split(/\s+/).every((part) => haystack.includes(part));
      })
      .slice(0, 16);
  }, [commands, query]);

  if (!open) return null;
  const firstRunnableCommand = filteredCommands.find((command) => !command.disabled);

  return (
    <>
      <div style={paletteBackdropStyle} onClick={onClose} aria-hidden="true" />
      <div style={paletteStyle} role="dialog" aria-modal="true" aria-label="Map command palette">
        <input
          ref={inputRef}
          style={paletteInputStyle}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
            if (event.key === "Enter" && firstRunnableCommand) {
              event.preventDefault();
              firstRunnableCommand.onClick();
              onClose();
            }
          }}
          placeholder="Search map commands: import geojson, query layers, draw polygon, export image"
          aria-label="Search map commands"
        />
        <div style={paletteListStyle} role="listbox" aria-label="Available map commands">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: MAP_SPACING.md, color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.sm }}>
              No matching command
            </div>
          ) : filteredCommands.map((command) => (
            (() => {
              const status = getCommandStatus(command);
              return (
            <button
              key={command.id}
              type="button"
              style={{
                ...commandButtonStyle(Boolean(command.active), false, command.tone, "comfortable", true),
                maxWidth: "100%",
                minHeight: "3rem",
                display: "grid",
                gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
                opacity: command.disabled ? 0.55 : 1,
                cursor: command.disabled ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                if (command.disabled) return;
                command.onClick();
                onClose();
              }}
              role="option"
              aria-selected={command.active || undefined}
              disabled={command.disabled}
            >
              {React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true })}
              <span style={{ display: "grid", minWidth: 0, textAlign: "left", gap: "0.125rem" }}>
                <span style={{ color: MAP_COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {command.label}
                </span>
                <span style={{ color: MAP_COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {command.title}
                </span>
              </span>
              <span style={{ display: "grid", justifyItems: "end", gap: "0.125rem" }}>
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                  {getCommandCategory(command)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.1875rem" }}>
                  {command.shortcut ? (
                    <span style={{ ...toolbarBadge, color: MAP_COLORS.textMuted, background: MAP_COLORS.bg }}>
                      {command.shortcut}
                    </span>
                  ) : null}
                  <span style={{ ...toolbarBadge, color: toneColor(status.tone), background: status.tone === "default" ? MAP_COLORS.bg : MAP_COLORS.amberSubtle }}>
                    {command.badge != null && command.badge !== 0 ? command.badge : status.label}
                  </span>
                </span>
              </span>
            </button>
              );
            })()
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
  pinMode,
  onTogglePinMode,
  showSidebar,
  onToggleSidebar,
  pinCount,
  showLayerPanel = false,
  onToggleLayerPanel,
  layerCount = 0,
  visibleLayerCount = layerCount,
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
  onAddToReportClick,
  onSaveProjectClick,
  onLoadProjectClick,
  isImporting = false,
  importProgress = null,
  exportDisabled = false,
  reportDisabled = false,
  isExportingImage = false,
  isSavingProject = false,
  isLoadingProject = false,
  persistenceDisabled = false,
}) => {
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const [toolbarWidth, setToolbarWidth] = React.useState(1280);
  const [density, setDensity] = React.useState<ToolbarDensity>(readStoredDensity);
  const [toolbarRole, setToolbarRole] = React.useState<ToolbarRole>(() => getDefaultRole(workspaceView));
  const [openMenu, setOpenMenu] = React.useState<OverflowGroupId | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    setToolbarRole(getDefaultRole(workspaceView));
  }, [workspaceView]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOOLBAR_DENSITY_STORAGE_KEY, density);
  }, [density]);

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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        setOpenMenu(null);
        return;
      }
      if (event.key === "Escape") {
        setOpenMenu(null);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commands = React.useMemo(
    () => buildToolbarCommands({
      workspaceView,
      onWorkspaceViewChange,
      pinMode,
      onTogglePinMode,
      showSidebar,
      onToggleSidebar,
      pinCount,
      showLayerPanel,
      onToggleLayerPanel,
      layerCount,
      visibleLayerCount,
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
      onAddToReportClick,
      onSaveProjectClick,
      onLoadProjectClick,
      isImporting,
      importProgress,
      exportDisabled,
      reportDisabled,
      isExportingImage,
      isSavingProject,
      isLoadingProject,
      persistenceDisabled,
    }),
    [
      activeDrawTool,
      activeLayerGeometryType,
      activeMeasureTool,
      annotationCount,
      annotationMode,
      drawnFeatureCount,
      exportDisabled,
      hasSelectedAoi,
      importProgress,
      isExportingImage,
      isImporting,
      isLoadingProject,
      isSavingProject,
      layerCount,
      measurementCount,
      nlQueryLayerCount,
      onWorkspaceViewChange,
      onExportClick,
      onImageExportClick,
      onAddToReportClick,
      onImportClick,
      onLoadProjectClick,
      onOpenExternalServices,
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
      onToggleMeasurePanel,
      onToggleNLQueryPanel,
      onToggleWorkflowDrawer,
      onTogglePinMode,
      onToggleRestrictToMapView,
      onToggleScientificQAPanel,
      onToggleSidebar,
      onToggleViewportSync,
      onToggleVoxCityOverlayPanel,
      persistenceDisabled,
      pinCount,
      pinMode,
      restrictToMapView,
      reportDisabled,
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
      showMeasurePanel,
      showNLQueryPanel,
      showReviewTimeline,
      showWorkflowDrawer,
      onToggleReviewTimeline,
      workflowReadyCount,
      showScientificQAPanel,
      showSidebar,
      showVoxCityOverlayPanel,
      visibleLayerCount,
      voxCityFootprintCount,
      viewportSyncEnabled,
      workspaceView,
    ],
  );

  const breakpoint = getBreakpoint(toolbarWidth);
  const geometryType = normalizeGeometryType(activeLayerGeometryType);
  const visibleCommandLimit = getVisibleCommandLimit(breakpoint, density);
  const availableRoleCommands = React.useMemo(
    () => commands.filter((command) => isCommandVisibleInRole(command, toolbarRole, workspaceView)),
    [commands, toolbarRole, workspaceView],
  );
  const sortedRoleCommands = React.useMemo(
    () => [...availableRoleCommands].sort((a, b) => (
      getContextScore(b, { visibleLayerCount, geometryType, hasSelectedAoi })
      - getContextScore(a, { visibleLayerCount, geometryType, hasSelectedAoi })
    )),
    [availableRoleCommands, geometryType, hasSelectedAoi, visibleLayerCount],
  );

  const visibleCommands = sortedRoleCommands.slice(0, visibleCommandLimit);
  const visibleIds = new Set(visibleCommands.map((command) => command.id));
  const overflowCommands = sortedRoleCommands.filter((command) => !visibleIds.has(command.id));
  const overflowByGroup = (id: OverflowGroupId): ToolbarCommand[] => {
    const sourceCommands = id === "advanced" ? sortedRoleCommands : overflowCommands;
    return sourceCommands.filter((command) => command.overflowGroup === id);
  };

  const commandPaletteCommand: ToolbarCommand = {
    id: "command-palette",
    label: "Commands",
    shortLabel: "Cmd",
    title: "Open command palette (Ctrl+K)",
    keywords: ["command palette", "ctrl k", "search commands"],
    icon: Command,
    onClick: () => {
      setPaletteOpen(true);
      setOpenMenu(null);
    },
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 999,
    shortcut: "Ctrl K",
  };

  const paletteCommands = React.useMemo(
    () => [commandPaletteCommand, ...commands],
    [commands],
  );

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
        <span>Ctrl+K searches every available map command.</span>
      </div>
    </>
  );

  return (
    <div
      ref={toolbarRef}
      style={toolbarShell}
      aria-label={`Adaptive map toolbar for ${workspaceView} workspace`}
      data-toolbar-density={density}
      data-toolbar-breakpoint={breakpoint}
    >
      {workspaceView !== "navigator" ? (
        <RoleSwitch
          role={toolbarRole}
          onRoleChange={(nextRole) => {
            setToolbarRole(nextRole);
            if (nextRole === "explore") {
              onWorkspaceViewChange?.("explore");
            } else if (nextRole === "analyze") {
              onWorkspaceViewChange?.("analyze");
            }
          }}
        />
      ) : (
        <div style={{ ...roleSwitch, color: MAP_COLORS.textMuted }}>
          <Compass size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />
          <span style={{ fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Data</span>
        </div>
      )}

      <div style={commandRail} aria-label="Priority map commands">
        {visibleCommands.map((command) => (
          <ToolbarCommandButton key={command.id} command={command} density={density} />
        ))}
      </div>

      <div style={overflowRail} aria-label="Overflow map command groups">
        <ToolbarOverflowMenu
          id="tools"
          commands={overflowByGroup("tools")}
          density={density}
          open={openMenu === "tools"}
          onToggle={() => setOpenMenu((current) => current === "tools" ? null : "tools")}
          onClose={() => setOpenMenu(null)}
        />
        <ToolbarOverflowMenu
          id="export"
          commands={overflowByGroup("export")}
          density={density}
          open={openMenu === "export"}
          onToggle={() => setOpenMenu((current) => current === "export" ? null : "export")}
          onClose={() => setOpenMenu(null)}
        />
        <ToolbarOverflowMenu
          id="advanced"
          commands={overflowByGroup("advanced")}
          density={density}
          open={openMenu === "advanced"}
          onToggle={() => setOpenMenu((current) => current === "advanced" ? null : "advanced")}
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
        Toolbar commands adapt to screen width. Less frequent commands are grouped as Tools, Export, and Advanced.
      </span>
    </div>
  );
};
