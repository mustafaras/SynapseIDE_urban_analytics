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
import type { ProcessingToolDescriptor, ToolParameterDescriptor } from "@/services/map/contracts/gisContracts";
import {
  formatMapKeybinding,
  isOpenPaletteShortcut,
  searchMapPaletteCommands,
  shouldIgnoreMapPaletteShortcut,
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
  onAddToReportClick?: () => void;
  onSaveProjectClick?: () => void;
  onLoadProjectClick?: () => void;
  isImporting?: boolean;
  importProgress?: number | null;
  exportDisabled?: boolean;
  exportDisabledReason?: string | undefined;
  reportDisabled?: boolean;
  reportDisabledReason?: string | undefined;
  isExportingImage?: boolean;
  isSavingProject?: boolean;
  isLoadingProject?: boolean;
  persistenceDisabled?: boolean;
  processingTools?: readonly ProcessingToolDescriptor[];
  processingLayerOptions?: readonly ProcessingPaletteLayerOption[];
  onRunProcessingToolCommand?: (toolId: string, params: Record<string, string | number | boolean>) => void;
}

type CommandTone = "default" | "accent" | "danger" | "success" | "warning";
type ToolbarRole = "explore" | "analyze" | "publish";
type ToolbarDensity = MapToolbarDensityPreference;
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
  processingToolId?: string;
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
  | "reportDisabled"
  | "reportDisabledReason"
  | "isExportingImage"
  | "isSavingProject"
  | "isLoadingProject"
  | "persistenceDisabled"
>> {
  importProgress: number | null;
  onWorkspaceViewChange?: ((view: MapWorkspaceView) => void) | undefined;
  onToggleLayerPanel?: (() => void) | undefined;
  onToggleCatalog?: (() => void) | undefined;
  onToggleContents?: (() => void) | undefined;
  onToggleScientificQAPanel?: (() => void) | undefined;
  onToggleNLQueryPanel?: (() => void) | undefined;
  onToggleWorkflowDrawer?: (() => void) | undefined;
  onToggleReviewTimeline?: (() => void) | undefined;
  onTogglePerformanceDiagnostics?: (() => void) | undefined;
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
  width: "min(22rem, calc(100vw - 2rem))",
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.none,
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

const segmentedControlStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  padding: "0.125rem",
};

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
  density: ToolbarDensity = "expert",
  menuItem = false,
): React.CSSProperties {
  const color = active ? MAP_COLORS.interaction : toneColor(tone);
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
    border: active ? `1px solid ${MAP_COLORS.focus}` : "1px solid transparent",
    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: active ? MAP_TYPOGRAPHY.fontWeight.semibold : MAP_TYPOGRAPHY.fontWeight.medium,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: MAP_TRANSITIONS.fast,
    boxShadow: active ? `inset 2px 0 0 ${MAP_COLORS.interaction}` : "none",
  };
}

function toolbarButtonInteraction(
  active = false,
  disabled = false,
): Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "onMouseEnter" | "onMouseLeave" | "onFocus" | "onBlur"> {
  return {
    onMouseEnter: (event) => {
      if (active || disabled) return;
      event.currentTarget.style.background = MAP_COLORS.neutralSubtle;
      event.currentTarget.style.color = MAP_COLORS.interaction;
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
    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
    color: active ? MAP_COLORS.interaction : MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
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
        tool.category,
        ...tool.parameters.map((parameter) => parameter.label),
      ],
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
      source: "processing-tool",
      processingToolId: tool.toolId,
    };
  });
}

function getCommandCategory(command: ToolbarCommand | PaletteCommand): string {
  if ("category" in command) return command.category;
  if (command.id === "command-palette") return "System";
  return OVERFLOW_META[command.overflowGroup]?.label ?? "Map";
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
    title: "Open professional contents tree with grouping, scale ranges, filters, and repair actions",
    keywords: ["contents", "layer tree", "group layers", "scale range", "definition filter", "duplicate layer"],
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
    disabledReason: "The current map project save is already in progress.",
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
    disabledReason: "A saved map project is already loading.",
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
  const color = active ? MAP_COLORS.interaction : toneColor(command.tone ?? "default");
  const accessibleTitle = getCommandAccessibleTitle(command);

  return (
    <button
      type="button"
      style={commandButtonStyle(active, disabled, command.tone, density, menuItem)}
      onClick={() => {
        if (disabled) return;
        command.onClick();
        onAfterClick?.();
      }}
      title={accessibleTitle}
      aria-label={accessibleTitle}
      aria-pressed={active || undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      role={menuItem ? "menuitem" : undefined}
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

  React.useEffect(() => {
    const firstRunnableIndex = filteredCommands.findIndex((command) => !command.disabled);
    setActiveIndex(firstRunnableIndex >= 0 ? firstRunnableIndex : 0);
  }, [filteredCommands]);

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
        onKeyDown={trapTabFocus}
      >
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
          aria-activedescendant={selectedCommand ? `map-command-palette-option-${selectedCommand.id.replace(/[^a-z0-9_-]/gi, "-")}` : undefined}
        />
        <div id="map-command-palette-list" style={paletteListStyle} role="listbox" aria-label="Available map commands">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: MAP_SPACING.md, color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.sm }}>
              No matching command
            </div>
          ) : filteredCommands.map((command, index) => (
            (() => {
              const status = getCommandStatus(command);
              const accessibleTitle = getCommandAccessibleTitle(command);
              const optionId = `map-command-palette-option-${command.id.replace(/[^a-z0-9_-]/gi, "-")}`;
              const selected = index === activeIndex;
              const shortcutLabel = command.disabled ? null : command.shortcut ?? runShortcutLabel;
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
  onAddToReportClick,
  onSaveProjectClick,
  onLoadProjectClick,
  isImporting = false,
  importProgress = null,
  exportDisabled = false,
  exportDisabledReason = undefined,
  reportDisabled = false,
  reportDisabledReason = undefined,
  isExportingImage = false,
  isSavingProject = false,
  isLoadingProject = false,
  persistenceDisabled = false,
  processingTools = [],
  processingLayerOptions = [],
  onRunProcessingToolCommand,
}) => {
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const [toolbarWidth, setToolbarWidth] = React.useState(1280);
  const density = useMapToolbarPreferencesStore((state) => state.density);
  const setDensity = useMapToolbarPreferencesStore((state) => state.setDensity);
  const [toolbarRole, setToolbarRole] = React.useState<ToolbarRole>(() => getDefaultRole(workspaceView));
  const [openMenu, setOpenMenu] = React.useState<OverflowGroupId | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    setToolbarRole(getDefaultRole(workspaceView));
  }, [workspaceView]);

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
      if (isOpenPaletteShortcut(event) && !shouldIgnoreMapPaletteShortcut(event)) {
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
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
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
      onAddToReportClick,
      onSaveProjectClick,
      onLoadProjectClick,
      isImporting,
      importProgress,
      exportDisabled,
      exportDisabledReason,
      reportDisabled,
      reportDisabledReason,
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
      exportDisabledReason,
      hasSelectedAoi,
      importProgress,
      isExportingImage,
      isImporting,
      isLoadingProject,
      isSavingProject,
      layerCount,
      catalogSourceCount,
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
      onToggleCatalog,
      onToggleContents,
      onToggleMeasurePanel,
      onToggleNLQueryPanel,
      onTogglePerformanceDiagnostics,
      onToggleProcessingToolbox,
      onToggleModelBuilder,
      onToggleWorkflowDrawer,
      onTogglePinMode,
      onToggleRestrictToMapView,
      onToggleScientificQAPanel,
      onToggleSidebar,
      onToggleViewportSync,
      onToggleVoxCityOverlayPanel,
      persistenceDisabled,
      performanceIssueCount,
      processingToolCount,
      pinCount,
      pinMode,
      restrictToMapView,
      reportDisabled,
      reportDisabledReason,
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

  const openPaletteShortcut = formatMapKeybinding("openPalette");
  const commandPaletteCommand = React.useMemo<PaletteCommand>(() => ({
    id: "command-palette",
    label: "Commands",
    shortLabel: "Cmd",
    title: `Open command palette (${openPaletteShortcut})`,
    keywords: ["command palette", "ctrl k", "cmd k", "search commands", "keyboard"],
    icon: Command,
    onClick: () => {
      setPaletteOpen(true);
      setOpenMenu(null);
    },
    roles: ["explore", "analyze", "publish"],
    overflowGroup: "advanced",
    priority: 999,
    shortcut: openPaletteShortcut,
    category: "System",
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
      ...commands.map((command): PaletteCommand => ({
        ...command,
        category: getCommandCategory(command),
        source: "toolbar",
      })),
      ...processingPaletteCommands,
    ],
    [commandPaletteCommand, commands, processingPaletteCommands],
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
        <span>{openPaletteShortcut} searches map commands and processing tools.</span>
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
