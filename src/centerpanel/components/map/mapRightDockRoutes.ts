import type { MapRightDockPanel } from "./mapDocking";
import type { MapBottomPanelTabId } from "./mapLegacyBottomTabs";
import type { MapActivityId } from "./navigation/mapNavigationModel";

export type MapRightDockRouteSource =
  | "activity-rail"
  | "bottom-tab"
  | "panel-tab"
  | "programmatic"
  | "quick-action"
  | "status-bar"
  | "toolbar"
  | "worker";

export type MapRightDockFocusReturn = "trigger" | "none";

export interface MapRightDockPanelDefinition {
  id: MapRightDockPanel;
  label: string;
  activityId: MapActivityId;
  serializable: true;
}

export interface MapRightDockRoute {
  panel: MapRightDockPanel;
  source: MapRightDockRouteSource;
  legacyBottomTabId: MapBottomPanelTabId | null;
  focusReturn: MapRightDockFocusReturn;
  detail: string | null;
}

export interface MapRightDockRouteState {
  activeRoute: MapRightDockRoute | null;
  lastRoute: MapRightDockRoute | null;
}

export const MAP_RIGHT_DOCK_PANEL_DEFINITIONS = {
  inspect: {
    id: "inspect",
    label: "Inspector",
    activityId: "layers",
    serializable: true,
  },
  style: {
    id: "style",
    label: "Style",
    activityId: "layers",
    serializable: true,
  },
  attributes: {
    id: "attributes",
    label: "Attributes",
    activityId: "layers",
    serializable: true,
  },
  problems: {
    id: "problems",
    label: "QA",
    activityId: "qa",
    serializable: true,
  },
  timeline: {
    id: "timeline",
    label: "Review",
    activityId: "review",
    serializable: true,
  },
  tasks: {
    id: "tasks",
    label: "Tasks",
    activityId: "diagnostics",
    serializable: true,
  },
  diagnostics: {
    id: "diagnostics",
    label: "Diagnostics",
    activityId: "diagnostics",
    serializable: true,
  },
  pins: {
    id: "pins",
    label: "Pins",
    activityId: "overview",
    serializable: true,
  },
  draw: {
    id: "draw",
    label: "Draw",
    activityId: "analyze",
    serializable: true,
  },
  measure: {
    id: "measure",
    label: "Measure",
    activityId: "analyze",
    serializable: true,
  },
  selection: {
    id: "selection",
    label: "Selection",
    activityId: "layers",
    serializable: true,
  },
  scientificQA: {
    id: "scientificQA",
    label: "Scientific QA",
    activityId: "qa",
    serializable: true,
  },
  qa: {
    id: "qa",
    label: "QA",
    activityId: "qa",
    serializable: true,
  },
  workflow: {
    id: "workflow",
    label: "Workflow",
    activityId: "analyze",
    serializable: true,
  },
  report: {
    id: "report",
    label: "Publish",
    activityId: "publish",
    serializable: true,
  },
  performance: {
    id: "performance",
    label: "Performance",
    activityId: "diagnostics",
    serializable: true,
  },
  collaboration: {
    id: "collaboration",
    label: "Collaboration",
    activityId: "review",
    serializable: true,
  },
  urbanMethod: {
    id: "urbanMethod",
    label: "Urban Method",
    activityId: "analyze",
    serializable: true,
  },
} as const satisfies Record<MapRightDockPanel, MapRightDockPanelDefinition>;

export const MAP_RIGHT_DOCK_PANEL_IDS = Object.keys(MAP_RIGHT_DOCK_PANEL_DEFINITIONS) as MapRightDockPanel[];

/** Panels always visible in the primary tab rail (summary-level access). */
export const MAP_RIGHT_DOCK_PRIMARY_PANELS: readonly MapRightDockPanel[] = [
  "inspect",
  "style",
  "problems",
  "workflow",
  "report",
];

/**
 * Panels shown contextually when activated (draw, measure, selection, scientific work,
 * urban method, pins). Hidden from the tab rail until the user or context activates them,
 * at which point they appear inline.
 */
export const MAP_RIGHT_DOCK_CONTEXTUAL_PANELS: readonly MapRightDockPanel[] = [
  "attributes",
  "selection",
  "draw",
  "measure",
  "pins",
  "scientificQA",
  "urbanMethod",
];

/**
 * Advanced panels that are always reachable but not shown in the primary tab rail.
 * Surfaced via the grouped overflow menu.
 */
export const MAP_RIGHT_DOCK_ADVANCED_PANELS: readonly MapRightDockPanel[] = [
  "timeline",
  "tasks",
  "qa",
  "collaboration",
];

/**
 * Developer/ops diagnostic panels: always reachable, hidden from the primary tab rail
 * by default. Surfaced in a separate overflow group.
 */
export const MAP_RIGHT_DOCK_DIAGNOSTICS_PANELS: readonly MapRightDockPanel[] = [
  "diagnostics",
  "performance",
];

/** Human-readable group labels for overflow menu sections. */
export const MAP_RIGHT_DOCK_OVERFLOW_GROUPS = [
  { label: "Advanced", panels: MAP_RIGHT_DOCK_ADVANCED_PANELS },
  { label: "Diagnostics", panels: MAP_RIGHT_DOCK_DIAGNOSTICS_PANELS },
] as const;

/**
 * Returns the tier for a panel: "primary" | "contextual" | "advanced" | "diagnostics".
 */
export function getMapRightDockPanelTier(panel: MapRightDockPanel): "primary" | "contextual" | "advanced" | "diagnostics" {
  if (MAP_RIGHT_DOCK_PRIMARY_PANELS.includes(panel)) return "primary";
  if (MAP_RIGHT_DOCK_CONTEXTUAL_PANELS.includes(panel)) return "contextual";
  if (MAP_RIGHT_DOCK_DIAGNOSTICS_PANELS.includes(panel)) return "diagnostics";
  return "advanced";
}

/**
 * Returns the set of panels that should be visible in the primary tab rail.
 * Always includes primary panels plus the current active panel (so contextual/
 * advanced panels remain inline while active).
 */
export function getRightDockVisibleTabPanels(activePanel: MapRightDockPanel): readonly MapRightDockPanel[] {
  const primary = MAP_RIGHT_DOCK_PRIMARY_PANELS;
  if (primary.includes(activePanel)) return primary;
  return [...primary, activePanel];
}

export const MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL = {
  problems: "problems",
  attributes: "attributes",
  timeline: "timeline",
  tasks: "tasks",
  diagnostics: "diagnostics",
  console: "diagnostics",
  measurements: "measure",
} as const satisfies Record<MapBottomPanelTabId, MapRightDockPanel>;

export const EMPTY_MAP_RIGHT_DOCK_ROUTE_STATE: MapRightDockRouteState = {
  activeRoute: null,
  lastRoute: null,
};

export function getRightDockPanelForBottomTab(tabId: MapBottomPanelTabId): MapRightDockPanel {
  return MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL[tabId];
}

export function getMapRightDockPanelDefinition(panel: MapRightDockPanel): MapRightDockPanelDefinition {
  return MAP_RIGHT_DOCK_PANEL_DEFINITIONS[panel];
}

export function getMapActivityIdForRightDockPanel(panel: MapRightDockPanel): MapActivityId {
  return getMapRightDockPanelDefinition(panel).activityId;
}

export function createMapRightDockRoute(
  panel: MapRightDockPanel,
  options: {
    source?: MapRightDockRouteSource;
    legacyBottomTabId?: MapBottomPanelTabId | null;
    focusReturn?: MapRightDockFocusReturn;
    detail?: string | null;
  } = {},
): MapRightDockRoute {
  return {
    panel,
    source: options.source ?? "programmatic",
    legacyBottomTabId: options.legacyBottomTabId ?? null,
    focusReturn: options.focusReturn ?? "trigger",
    detail: options.detail ?? null,
  };
}

export function createMapRightDockRouteFromBottomTab(
  tabId: MapBottomPanelTabId,
  options: {
    source?: MapRightDockRouteSource;
    focusReturn?: MapRightDockFocusReturn;
    detail?: string | null;
  } = {},
): MapRightDockRoute {
  return createMapRightDockRoute(getRightDockPanelForBottomTab(tabId), {
    source: options.source ?? "bottom-tab",
    legacyBottomTabId: tabId,
    focusReturn: options.focusReturn ?? "trigger",
    detail: options.detail ?? null,
  });
}

export function openMapRightDockRouteState(
  current: MapRightDockRouteState,
  route: MapRightDockRoute,
): MapRightDockRouteState {
  return {
    activeRoute: route,
    lastRoute: current.lastRoute,
  };
}

export function switchMapRightDockRouteState(
  current: MapRightDockRouteState,
  route: MapRightDockRoute,
): MapRightDockRouteState {
  return {
    activeRoute: route,
    lastRoute: current.activeRoute,
  };
}

export function closeMapRightDockRouteState(current: MapRightDockRouteState): MapRightDockRouteState {
  return {
    activeRoute: null,
    lastRoute: current.activeRoute ?? current.lastRoute,
  };
}

export function buildMapRightDockRouteAnnouncement(route: MapRightDockRoute): string {
  const label = getMapRightDockPanelDefinition(route.panel).label;
  return `${label} right dock route selected`;
}
