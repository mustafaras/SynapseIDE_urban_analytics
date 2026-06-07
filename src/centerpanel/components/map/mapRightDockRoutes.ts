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
    label: "Inspect",
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
    label: "Problems",
    activityId: "qa",
    serializable: true,
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
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
    label: "Report",
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
