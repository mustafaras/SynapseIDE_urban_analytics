import {
  MAP_SURFACE_INVENTORY,
  type MapSurfaceInventoryEntry,
  type MapWorkbenchTargetHome,
} from "./mapSurfaceInventory";

export type MapActivityId =
  | "overview"
  | "data"
  | "layers"
  | "analyze"
  | "style"
  | "scene"
  | "publish"
  | "qa"
  | "review"
  | "diagnostics"
  | "extensions";

export type MapActivityPlacement = "primary-rail" | "utility-rail";

export type MapSidebarTabId =
  | "overview-readiness"
  | "overview-notes"
  | "data-import"
  | "data-catalog"
  | "data-connections"
  | "data-health"
  | "data-demo"
  | "layers-stack"
  | "layers-contents"
  | "layers-sources"
  | "layers-cartography"
  | "analyze-workflows"
  | "analyze-tools"
  | "analyze-query"
  | "analyze-models"
  | "analyze-statistics"
  | "analyze-data-operations"
  | "analyze-measurements"
  | "style-renderer"
  | "style-symbols"
  | "style-labels"
  | "style-legend"
  | "style-advisor"
  | "scene-raster"
  | "scene-temporal"
  | "scene-3d"
  | "scene-urban-form"
  | "scene-voxcity"
  | "publish-figure"
  | "publish-export"
  | "publish-package"
  | "publish-report"
  | "extensions-registry";

export type MapInspectorContextId =
  | "layer"
  | "feature-selection"
  | "analysis-run"
  | "qa-issue"
  | "publish-item"
  | "scene-item"
  | "source"
  | "extension";

export type MapBottomPanelTabId =
  | "problems"
  | "attributes"
  | "timeline"
  | "tasks"
  | "diagnostics"
  | "console"
  | "measurements";

export type MapTaskLensId = "analyst" | "planner" | "reviewer" | "publisher";

export interface MapActivityDefinition {
  id: MapActivityId;
  label: string;
  ariaLabel: string;
  description: string;
  placement: MapActivityPlacement;
  order: number;
  mnemonic: string;
  iconName: string;
  defaultSidebarTabId: MapSidebarTabId | null;
  defaultInspectorContextId: MapInspectorContextId | null;
  defaultBottomPanelTabId: MapBottomPanelTabId | null;
  commandCategory: string;
  commandKeywords: readonly string[];
}

export interface MapSidebarTabDefinition {
  id: MapSidebarTabId;
  activityId: MapActivityId;
  label: string;
  ariaLabel: string;
  description: string;
}

export interface MapInspectorContextDefinition {
  id: MapInspectorContextId;
  label: string;
  ariaLabel: string;
  description: string;
}

export interface MapBottomPanelTabDefinition {
  id: MapBottomPanelTabId;
  label: string;
  ariaLabel: string;
  description: string;
}

export interface MapTaskLensDefinition {
  id: MapTaskLensId;
  label: string;
  ariaLabel: string;
  description: string;
  defaultActivityId: MapActivityId;
  activityPriority: readonly MapActivityId[];
  sidebarTabPriority: readonly MapSidebarTabId[];
  inspectorContextPriority: readonly MapInspectorContextId[];
  bottomPanelTabPriority: readonly MapBottomPanelTabId[];
  preserveCommandPalette: true;
}

export interface MapInventoryNavigationBinding {
  inventoryId: string;
  sourceId: string;
  activityId: MapActivityId;
  placement: MapActivityPlacement;
  sidebarTabId: MapSidebarTabId | null;
  inspectorContextId: MapInspectorContextId | null;
  bottomPanelTabId: MapBottomPanelTabId | null;
}

export const MAP_PRIMARY_ACTIVITY_ORDER = [
  "overview",
  "data",
  "layers",
  "analyze",
  "style",
  "scene",
  "publish",
] as const satisfies readonly MapActivityId[];

export const MAP_UTILITY_ACTIVITY_ORDER = [
  "qa",
  "review",
  "diagnostics",
  "extensions",
] as const satisfies readonly MapActivityId[];

export const MAP_ACTIVITY_DEFINITIONS = [
  {
    id: "overview",
    label: "Overview",
    ariaLabel: "Overview activity",
    description: "Readiness, next action, project context, AOI state, and field notes.",
    placement: "primary-rail",
    order: 0,
    mnemonic: "O",
    iconName: "Compass",
    defaultSidebarTabId: "overview-readiness",
    defaultInspectorContextId: null,
    defaultBottomPanelTabId: null,
    commandCategory: "Overview",
    commandKeywords: ["overview", "navigator", "readiness", "project", "notes"],
  },
  {
    id: "data",
    label: "Data",
    ariaLabel: "Data activity",
    description: "Local import, external services, source catalog, restore health, and demo data.",
    placement: "primary-rail",
    order: 1,
    mnemonic: "D",
    iconName: "Database",
    defaultSidebarTabId: "data-import",
    defaultInspectorContextId: "source",
    defaultBottomPanelTabId: "tasks",
    commandCategory: "Data",
    commandKeywords: ["data", "import", "source", "catalog", "service", "connection", "demo"],
  },
  {
    id: "layers",
    label: "Layers",
    ariaLabel: "Layers activity",
    description: "Layer stack, contents tree, visibility, grouping, scale filters, and layer metadata.",
    placement: "primary-rail",
    order: 2,
    mnemonic: "L",
    iconName: "Layers3",
    defaultSidebarTabId: "layers-stack",
    defaultInspectorContextId: "layer",
    defaultBottomPanelTabId: "attributes",
    commandCategory: "Layers",
    commandKeywords: ["layers", "contents", "stack", "visibility", "schema", "attributes"],
  },
  {
    id: "analyze",
    label: "Analyze",
    ariaLabel: "Analyze activity",
    description: "Workflows, processing tools, model chains, query scope, statistics, AOI, and measurement work.",
    placement: "primary-rail",
    order: 3,
    mnemonic: "A",
    iconName: "Workflow",
    defaultSidebarTabId: "analyze-workflows",
    defaultInspectorContextId: "analysis-run",
    defaultBottomPanelTabId: "tasks",
    commandCategory: "Analyze",
    commandKeywords: ["analyze", "workflow", "processing", "model", "query", "statistics", "data operations", "measure"],
  },
  {
    id: "style",
    label: "Style",
    ariaLabel: "Style activity",
    description: "Renderers, symbols, labels, legend, and cartography recommendations.",
    placement: "primary-rail",
    order: 4,
    mnemonic: "S",
    iconName: "Palette",
    defaultSidebarTabId: "style-renderer",
    defaultInspectorContextId: "layer",
    defaultBottomPanelTabId: null,
    commandCategory: "Style",
    commandKeywords: ["style", "symbology", "choropleth", "label", "legend", "cartography"],
  },
  {
    id: "scene",
    label: "Scene",
    ariaLabel: "Scene activity",
    description: "Raster, temporal, 3D, zoning, massing, sun and shadow, and VoxCity controls.",
    placement: "primary-rail",
    order: 5,
    mnemonic: "C",
    iconName: "Box",
    defaultSidebarTabId: "scene-3d",
    defaultInspectorContextId: "scene-item",
    defaultBottomPanelTabId: "timeline",
    commandCategory: "Scene",
    commandKeywords: ["scene", "raster", "temporal", "3d", "zoning", "massing", "voxcity"],
  },
  {
    id: "publish",
    label: "Publish",
    ariaLabel: "Publish activity",
    description: "Figure composition, map image export, data export, offline package, and report handoff.",
    placement: "primary-rail",
    order: 6,
    mnemonic: "P",
    iconName: "FileImage",
    defaultSidebarTabId: "publish-figure",
    defaultInspectorContextId: "publish-item",
    defaultBottomPanelTabId: "tasks",
    commandCategory: "Publish",
    commandKeywords: ["publish", "figure", "export", "package", "report", "attribution"],
  },
  {
    id: "qa",
    label: "QA",
    ariaLabel: "QA activity",
    description: "Scientific blockers, warnings, CRS issues, geometry repair, and source caveats.",
    placement: "utility-rail",
    order: 0,
    mnemonic: "Q",
    iconName: "ShieldAlert",
    defaultSidebarTabId: null,
    defaultInspectorContextId: "qa-issue",
    defaultBottomPanelTabId: "problems",
    commandCategory: "QA",
    commandKeywords: ["qa", "problems", "crs", "projection", "geometry", "caveat"],
  },
  {
    id: "review",
    label: "Review",
    ariaLabel: "Review activity",
    description: "Timeline, audit records, collaboration status, comments, and evidence-linked review events.",
    placement: "utility-rail",
    order: 1,
    mnemonic: "R",
    iconName: "History",
    defaultSidebarTabId: null,
    defaultInspectorContextId: "publish-item",
    defaultBottomPanelTabId: "timeline",
    commandCategory: "Review",
    commandKeywords: ["review", "timeline", "audit", "collaboration", "comments", "evidence"],
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    ariaLabel: "Diagnostics activity",
    description: "Render budget, worker tasks, performance warnings, redacted telemetry, and recovery actions.",
    placement: "utility-rail",
    order: 2,
    mnemonic: "G",
    iconName: "Activity",
    defaultSidebarTabId: null,
    defaultInspectorContextId: null,
    defaultBottomPanelTabId: "diagnostics",
    commandCategory: "Diagnostics",
    commandKeywords: ["diagnostics", "performance", "render", "worker", "telemetry", "recovery"],
  },
  {
    id: "extensions",
    label: "Extensions",
    ariaLabel: "Extensions activity",
    description: "Plugin registry and typed source, renderer, processing, and Urban bridge extensions.",
    placement: "utility-rail",
    order: 3,
    mnemonic: "X",
    iconName: "Puzzle",
    defaultSidebarTabId: "extensions-registry",
    defaultInspectorContextId: "extension",
    defaultBottomPanelTabId: null,
    commandCategory: "Extensions",
    commandKeywords: ["extensions", "plugins", "registry", "source connector", "renderer", "urban bridge"],
  },
] as const satisfies readonly MapActivityDefinition[];

export const MAP_SIDEBAR_TAB_DEFINITIONS = [
  {
    id: "overview-readiness",
    activityId: "overview",
    label: "Readiness",
    ariaLabel: "Overview readiness tab",
    description: "Project context, next action, current blockers, AOI state, and readiness sequence.",
  },
  {
    id: "overview-notes",
    activityId: "overview",
    label: "Notes",
    ariaLabel: "Overview notes tab",
    description: "Pins, bookmarks, annotations, and lightweight field notes.",
  },
  {
    id: "data-import",
    activityId: "data",
    label: "Add Data",
    ariaLabel: "Data Add Data tab",
    description: "Local files, teaching datasets, preflight, CSV mapping, and import progress.",
  },
  {
    id: "data-catalog",
    activityId: "data",
    label: "Catalog",
    ariaLabel: "Data catalog tab",
    description: "Source catalog, source handles, restore state, demo packs, and repair actions.",
  },
  {
    id: "data-connections",
    activityId: "data",
    label: "Connections",
    ariaLabel: "Data connections tab",
    description: "External services, providers, credentials caveats, attribution, and connection health.",
  },
  {
    id: "data-health",
    activityId: "data",
    label: "Source Health",
    ariaLabel: "Data source health tab",
    description: "Recoverable, unavailable, metadata-only, and external dependency states.",
  },
  {
    id: "data-demo",
    activityId: "data",
    label: "Demo Data",
    ariaLabel: "Data Demo Data tab",
    description: "Synthetic teaching packs, demo provenance, and non-observational source labels.",
  },
  {
    id: "layers-stack",
    activityId: "layers",
    label: "Stack",
    ariaLabel: "Layers stack tab",
    description: "Visible layer stack, opacity, order, focus, remove, and layer actions.",
  },
  {
    id: "layers-contents",
    activityId: "layers",
    label: "Contents",
    ariaLabel: "Layers contents tab",
    description: "Groups, scale ranges, definition filters, duplication, and properties.",
  },
  {
    id: "layers-sources",
    activityId: "layers",
    label: "Sources",
    ariaLabel: "Layers sources tab",
    description: "Layer-source relationships, source handles, provenance, and restore state.",
  },
  {
    id: "layers-cartography",
    activityId: "layers",
    label: "Cartography",
    ariaLabel: "Layers cartography tab",
    description: "Per-layer cartography review, recommendations, and undoable style actions.",
  },
  {
    id: "analyze-workflows",
    activityId: "analyze",
    label: "Workflows",
    ariaLabel: "Analyze workflows tab",
    description: "AOI, buffer, intersect, union, difference, compare, preview, and evidence output.",
  },
  {
    id: "analyze-tools",
    activityId: "analyze",
    label: "Tools",
    ariaLabel: "Analyze tools tab",
    description: "Processing toolbox, parameter forms, runtime chips, progress, and blocked reasons.",
  },
  {
    id: "analyze-query",
    activityId: "analyze",
    label: "Query",
    ariaLabel: "Analyze query tab",
    description: "Natural-language query, scope limits, selection query, and human confirmation.",
  },
  {
    id: "analyze-models",
    activityId: "analyze",
    label: "Models",
    ariaLabel: "Analyze models tab",
    description: "Model builder, chain execution, batch execution, and IDE or Urban handoff.",
  },
  {
    id: "analyze-statistics",
    activityId: "analyze",
    label: "Statistics",
    ariaLabel: "Analyze statistics tab",
    description: "LISA, Getis-Ord Gi*, emerging hot spot, and selected-feature summary statistics.",
  },
  {
    id: "analyze-data-operations",
    activityId: "analyze",
    label: "Data Operations",
    ariaLabel: "Analyze data operations tab",
    description: "Analysis output layers, selected-feature operations, attribute routing, and inspector handoff.",
  },
  {
    id: "analyze-measurements",
    activityId: "analyze",
    label: "Measurements",
    ariaLabel: "Analyze measurements tab",
    description: "Distance and area measurements, units, CRS caveats, and measurement results.",
  },
  {
    id: "style-renderer",
    activityId: "style",
    label: "Renderer",
    ariaLabel: "Style renderer tab",
    description: "Choropleth, classification, thematic style, and renderer eligibility.",
  },
  {
    id: "style-symbols",
    activityId: "style",
    label: "Symbols",
    ariaLabel: "Style symbols tab",
    description: "Point symbols, heatmap, proportional symbols, graduated symbols, and active layer style.",
  },
  {
    id: "style-labels",
    activityId: "style",
    label: "Labels",
    ariaLabel: "Style labels tab",
    description: "Labels, annotations, publication marks, and export-aware controls.",
  },
  {
    id: "style-legend",
    activityId: "style",
    label: "Legend",
    ariaLabel: "Style legend tab",
    description: "Map legend, report legend, export legend, and legend contract parity.",
  },
  {
    id: "style-advisor",
    activityId: "style",
    label: "Advisor",
    ariaLabel: "Style advisor tab",
    description: "Cartography recommendations, QA-linked details, undo, and stale style review.",
  },
  {
    id: "scene-raster",
    activityId: "scene",
    label: "Raster",
    ariaLabel: "Scene raster tab",
    description: "Raster source, CRS, noData, band metadata, histogram, legend, and evidence references.",
  },
  {
    id: "scene-temporal",
    activityId: "scene",
    label: "Temporal",
    ariaLabel: "Scene temporal tab",
    description: "Temporal layers, frame cursor, speed, reduced motion, and frame export.",
  },
  {
    id: "scene-3d",
    activityId: "scene",
    label: "3D",
    ariaLabel: "Scene 3D tab",
    description: "3D scene, terrain, CityJSON, 3D Tiles, vertical datum, and viewport sync.",
  },
  {
    id: "scene-urban-form",
    activityId: "scene",
    label: "Urban Form",
    ariaLabel: "Scene urban form tab",
    description: "Zoning, massing, sun and shadow, view corridors, sections, and assumptions.",
  },
  {
    id: "scene-voxcity",
    activityId: "scene",
    label: "VoxCity",
    ariaLabel: "Scene VoxCity tab",
    description: "VoxCity 2D overlay, source priority, real versus sample geometry, and sync evidence.",
  },
  {
    id: "publish-figure",
    activityId: "publish",
    label: "Figure",
    ariaLabel: "Publish figure tab",
    description: "Figure composer, page size, DPI, legend, scale bar, north arrow, attribution, and CRS.",
  },
  {
    id: "publish-export",
    activityId: "publish",
    label: "Export",
    ariaLabel: "Publish export tab",
    description: "Map image export, data export, included layers, excluded layers, and disabled reasons.",
  },
  {
    id: "publish-package",
    activityId: "publish",
    label: "Package",
    ariaLabel: "Publish package tab",
    description: "Offline package, bounded source sidecars, manifests, and recoverability caveats.",
  },
  {
    id: "publish-report",
    activityId: "publish",
    label: "Report",
    ariaLabel: "Publish report tab",
    description: "Report handoff, snapshot, evidence IDs, metadata, attribution, and QA caveats.",
  },
  {
    id: "extensions-registry",
    activityId: "extensions",
    label: "Registry",
    ariaLabel: "Extensions registry tab",
    description: "Source, renderer, processing, and Urban bridge plugin descriptors.",
  },
] as const satisfies readonly MapSidebarTabDefinition[];

export const MAP_INSPECTOR_CONTEXT_DEFINITIONS = [
  {
    id: "layer",
    label: "Layer",
    ariaLabel: "Layer inspector context",
    description: "Layer overview, source, schema, CRS, QA, style, lineage, and report actions.",
  },
  {
    id: "feature-selection",
    label: "Selection",
    ariaLabel: "Feature selection inspector context",
    description: "Selected feature attributes, geometry, source, and selection actions.",
  },
  {
    id: "analysis-run",
    label: "Analysis",
    ariaLabel: "Analysis run inspector context",
    description: "Analysis inputs, CRS, preview, output, evidence, and logs.",
  },
  {
    id: "qa-issue",
    label: "QA Issue",
    ariaLabel: "QA issue inspector context",
    description: "Issue detail, affected layers, fixes, and evidence references.",
  },
  {
    id: "publish-item",
    label: "Publish",
    ariaLabel: "Publish inspector context",
    description: "Figure, metadata, attribution, export checks, and report handoff readiness.",
  },
  {
    id: "scene-item",
    label: "Scene",
    ariaLabel: "Scene inspector context",
    description: "Raster, 3D, temporal, source, QA, controls, and evidence state.",
  },
  {
    id: "source",
    label: "Source",
    ariaLabel: "Source inspector context",
    description: "Source handle, restore state, provenance, metadata-only state, and external caveats.",
  },
  {
    id: "extension",
    label: "Extension",
    ariaLabel: "Extension inspector context",
    description: "Plugin contribution type, status, capability, and safe recovery actions.",
  },
] as const satisfies readonly MapInspectorContextDefinition[];

export const MAP_BOTTOM_PANEL_TAB_DEFINITIONS = [
  {
    id: "problems",
    label: "Problems",
    ariaLabel: "Problems bottom panel tab",
    description: "Scientific QA blockers, warnings, CRS issues, geometry validity, and render errors.",
  },
  {
    id: "attributes",
    label: "Attributes",
    ariaLabel: "Attributes bottom panel tab",
    description: "Attribute table, selected rows, field profile, derived fields, and join preview.",
  },
  {
    id: "timeline",
    label: "Timeline",
    ariaLabel: "Timeline bottom panel tab",
    description: "Review timeline, audit trail, collaboration status, and evidence-linked comments.",
  },
  {
    id: "tasks",
    label: "Tasks",
    ariaLabel: "Tasks bottom panel tab",
    description: "Imports, workflow runs, worker tasks, exports, and background progress.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    ariaLabel: "Diagnostics bottom panel tab",
    description: "Render budget, worker failures, redacted telemetry, and retry actions.",
  },
  {
    id: "console",
    label: "Console",
    ariaLabel: "Console bottom panel tab",
    description: "Optional redacted operational log without raw data, secrets, or source bytes.",
  },
  {
    id: "measurements",
    label: "Measurements",
    ariaLabel: "Measurements bottom panel tab",
    description: "Measurement results, units, and CRS caveats.",
  },
] as const satisfies readonly MapBottomPanelTabDefinition[];

export const MAP_TASK_LENSES = [
  {
    id: "analyst",
    label: "Analyst",
    ariaLabel: "Analyst task lens",
    description: "Prioritizes data loading, layer review, analysis, and QA.",
    defaultActivityId: "data",
    activityPriority: ["data", "layers", "analyze", "qa", "overview", "style", "publish", "review", "diagnostics", "scene", "extensions"],
    sidebarTabPriority: ["data-import", "data-catalog", "layers-stack", "analyze-workflows", "analyze-tools", "analyze-query", "analyze-data-operations"],
    inspectorContextPriority: ["source", "layer", "analysis-run", "qa-issue"],
    bottomPanelTabPriority: ["problems", "attributes", "tasks", "diagnostics"],
    preserveCommandPalette: true,
  },
  {
    id: "planner",
    label: "Planner",
    ariaLabel: "Planner task lens",
    description: "Prioritizes layer interpretation, scene review, styling, and publish readiness.",
    defaultActivityId: "layers",
    activityPriority: ["layers", "scene", "style", "publish", "overview", "analyze", "qa", "review", "diagnostics", "data", "extensions"],
    sidebarTabPriority: ["layers-stack", "scene-3d", "scene-urban-form", "style-renderer", "publish-figure"],
    inspectorContextPriority: ["layer", "scene-item", "publish-item", "qa-issue"],
    bottomPanelTabPriority: ["attributes", "timeline", "problems", "tasks"],
    preserveCommandPalette: true,
  },
  {
    id: "reviewer",
    label: "Reviewer",
    ariaLabel: "Reviewer task lens",
    description: "Prioritizes QA, review timeline, provenance, source caveats, and inspector evidence.",
    defaultActivityId: "qa",
    activityPriority: ["qa", "review", "data", "layers", "diagnostics", "overview", "publish", "analyze", "style", "scene", "extensions"],
    sidebarTabPriority: ["data-health", "data-catalog", "layers-sources", "layers-contents", "overview-readiness"],
    inspectorContextPriority: ["qa-issue", "source", "layer", "analysis-run", "publish-item"],
    bottomPanelTabPriority: ["problems", "timeline", "diagnostics", "console"],
    preserveCommandPalette: true,
  },
  {
    id: "publisher",
    label: "Publisher",
    ariaLabel: "Publisher task lens",
    description: "Prioritizes styling, publishing, review, attribution, and export readiness.",
    defaultActivityId: "publish",
    activityPriority: ["publish", "style", "review", "qa", "layers", "overview", "data", "scene", "analyze", "diagnostics", "extensions"],
    sidebarTabPriority: ["publish-figure", "publish-report", "publish-export", "style-legend", "style-labels"],
    inspectorContextPriority: ["publish-item", "layer", "qa-issue", "source"],
    bottomPanelTabPriority: ["timeline", "problems", "tasks", "attributes"],
    preserveCommandPalette: true,
  },
] as const satisfies readonly MapTaskLensDefinition[];

const ACTIVITY_TARGET_HOMES = new Set<MapWorkbenchTargetHome>([
  "overview",
  "data",
  "layers",
  "analyze",
  "style",
  "scene",
  "publish",
  "qa",
  "review",
  "diagnostics",
  "extensions",
]);

function isActivityTargetHome(targetHome: MapWorkbenchTargetHome): targetHome is MapActivityId {
  return ACTIVITY_TARGET_HOMES.has(targetHome);
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function getActivityIdForUtilitySurface(entry: MapSurfaceInventoryEntry): MapActivityId {
  if (includesAny(entry.sourceId, ["qaStatus", "crs"])) return "qa";
  if (includesAny(entry.sourceId, ["syncStatus"])) return "scene";
  if (includesAny(entry.sourceId, ["selectedFeatureCount"])) return "layers";
  if (includesAny(entry.sourceId, ["performanceMode"])) return "diagnostics";
  if (includesAny(entry.sourceId, ["MapSelectionTools", "MapContextMenu"])) return "analyze";
  if (includesAny(entry.sourceId, ["pin-mode", "pins", "open-pins"])) return "overview";
  return "overview";
}

export function getMapActivityIdForInventoryEntry(entry: MapSurfaceInventoryEntry): MapActivityId {
  if (isActivityTargetHome(entry.targetHome)) return entry.targetHome;
  return getActivityIdForUtilitySurface(entry);
}

function getSidebarTabForInventoryEntry(entry: MapSurfaceInventoryEntry, activityId: MapActivityId): MapSidebarTabId | null {
  const fingerprint = `${entry.sourceId} ${entry.label} ${entry.targetSurface} ${entry.currentSurface}`.toLowerCase();

  if (activityId === "overview") {
    return includesAny(fingerprint, ["pin", "note", "bookmark", "annotation"]) ? "overview-notes" : "overview-readiness";
  }

  if (activityId === "data") {
    if (includesAny(fingerprint, ["connection", "service", "provider", "wms", "wfs", "xyz"])) return "data-connections";
    if (includesAny(fingerprint, ["demo pack", "demo data", "synthetic"])) return "data-demo";
    if (includesAny(fingerprint, ["catalog", "source catalog"])) return "data-catalog";
    if (includesAny(fingerprint, ["health", "restore", "recoverable", "unavailable", "metadata-only"])) return "data-health";
    return "data-import";
  }

  if (activityId === "layers") {
    if (includesAny(fingerprint, ["contents", "tree", "group", "scale", "filter"])) return "layers-contents";
    if (includesAny(fingerprint, ["source", "provenance", "restore"])) return "layers-sources";
    if (includesAny(fingerprint, ["cartography", "recommendation"])) return "layers-cartography";
    return "layers-stack";
  }

  if (activityId === "analyze") {
    if (includesAny(fingerprint, ["query", "nl", "selection query"])) return "analyze-query";
    if (includesAny(fingerprint, ["model"])) return "analyze-models";
    if (includesAny(fingerprint, ["lisa", "hot spot", "hotspot", "statistics", "summary"])) return "analyze-statistics";
    if (includesAny(fingerprint, ["output", "attribute", "data operation", "derived layer"])) return "analyze-data-operations";
    if (includesAny(fingerprint, ["measure", "measurement", "distance", "area"])) return "analyze-measurements";
    if (includesAny(fingerprint, ["toolbox", "processing", "tool"])) return "analyze-tools";
    return "analyze-workflows";
  }

  if (activityId === "style") {
    if (includesAny(fingerprint, ["symbol", "symbology", "heatmap", "proportional", "graduated"])) return "style-symbols";
    if (includesAny(fingerprint, ["label", "annotation", "mark"])) return "style-labels";
    if (includesAny(fingerprint, ["legend"])) return "style-legend";
    if (includesAny(fingerprint, ["advisor", "cartography", "recommendation"])) return "style-advisor";
    return "style-renderer";
  }

  if (activityId === "scene") {
    if (includesAny(fingerprint, ["raster", "geotiff", "nodata"])) return "scene-raster";
    if (includesAny(fingerprint, ["temporal", "timeline", "frame"])) return "scene-temporal";
    if (includesAny(fingerprint, ["zoning", "massing", "sun", "shadow", "urban form"])) return "scene-urban-form";
    if (includesAny(fingerprint, ["voxcity", "cityjson"])) return "scene-voxcity";
    return "scene-3d";
  }

  if (activityId === "publish") {
    if (includesAny(fingerprint, ["report", "handoff"])) return "publish-report";
    if (includesAny(fingerprint, ["package", "offline"])) return "publish-package";
    if (includesAny(fingerprint, ["export", "geojson", "image", "png", "data"])) return "publish-export";
    return "publish-figure";
  }

  if (activityId === "extensions") return "extensions-registry";

  return null;
}

function getInspectorContextForInventoryEntry(entry: MapSurfaceInventoryEntry, activityId: MapActivityId): MapInspectorContextId | null {
  if (entry.targetSlot !== "right-inspector" && entry.kind !== "inspector-context" && entry.kind !== "drawer") {
    return null;
  }

  const fingerprint = `${entry.sourceId} ${entry.label} ${entry.targetSurface} ${entry.currentSurface}`.toLowerCase();
  if (activityId === "qa" || includesAny(fingerprint, ["qa issue", "problem", "blocker"])) return "qa-issue";
  if (activityId === "scene" || includesAny(fingerprint, ["scene", "raster", "3d", "voxcity"])) return "scene-item";
  if (activityId === "publish" || includesAny(fingerprint, ["publish", "figure", "report", "export"])) return "publish-item";
  if (activityId === "analyze" || includesAny(fingerprint, ["analysis", "workflow", "urban method"])) return "analysis-run";
  if (activityId === "data" || includesAny(fingerprint, ["source"])) return "source";
  if (activityId === "extensions") return "extension";
  if (includesAny(fingerprint, ["attribute", "selection"])) return "feature-selection";
  return "layer";
}

function getBottomPanelTabForInventoryEntry(entry: MapSurfaceInventoryEntry, activityId: MapActivityId): MapBottomPanelTabId | null {
  const fingerprint = `${entry.sourceId} ${entry.label} ${entry.targetSurface} ${entry.currentSurface}`.toLowerCase();

  if (entry.targetSlot !== "bottom-panel" && !includesAny(fingerprint, ["timeline", "status", "task", "diagnostic", "attribute", "measure"])) {
    return null;
  }

  if (activityId === "qa" || includesAny(fingerprint, ["qa", "problem", "crs"])) return "problems";
  if (activityId === "review" || includesAny(fingerprint, ["review", "timeline", "audit", "collaboration"])) return "timeline";
  if (activityId === "diagnostics" || includesAny(fingerprint, ["diagnostic", "performance", "worker", "render"])) return "diagnostics";
  if (includesAny(fingerprint, ["attribute", "selection"])) return "attributes";
  if (includesAny(fingerprint, ["measure", "measurement"])) return "measurements";
  if (includesAny(fingerprint, ["console", "log"])) return "console";
  return "tasks";
}

export function buildMapInventoryNavigationBinding(entry: MapSurfaceInventoryEntry): MapInventoryNavigationBinding {
  const activityId = getMapActivityIdForInventoryEntry(entry);
  const activity = MAP_ACTIVITY_DEFINITIONS.find((definition) => definition.id === activityId);
  const sidebarTabId = getSidebarTabForInventoryEntry(entry, activityId);
  const inspectorContextId = getInspectorContextForInventoryEntry(entry, activityId);
  const bottomPanelTabId = getBottomPanelTabForInventoryEntry(entry, activityId);

  return {
    inventoryId: entry.id,
    sourceId: entry.sourceId,
    activityId,
    placement: activity?.placement ?? "primary-rail",
    sidebarTabId,
    inspectorContextId,
    bottomPanelTabId,
  };
}

export const MAP_INVENTORY_NAVIGATION_BINDINGS = MAP_SURFACE_INVENTORY.map(
  buildMapInventoryNavigationBinding,
) as readonly MapInventoryNavigationBinding[];

export function getMapActivityDefinition(activityId: MapActivityId): MapActivityDefinition {
  const match = MAP_ACTIVITY_DEFINITIONS.find((activity) => activity.id === activityId);
  if (!match) {
    throw new Error(`Unknown map activity: ${activityId}`);
  }
  return match;
}

export function getMapInventoryNavigationBinding(inventoryId: string): MapInventoryNavigationBinding | undefined {
  return MAP_INVENTORY_NAVIGATION_BINDINGS.find((binding) => binding.inventoryId === inventoryId);
}
