import { MAP_LAYOUT_TOKENS } from "../mapLayoutTokens";

export type MapShellResponsiveMode = "wide" | "medium" | "narrow" | "compact";

export interface MapShellSafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
  activityRail: number;
  leftPanel: number;
  rightPanel: number;
  statusBar: number;
  bottomDrawer: number;
}

export interface MapShellVisibility {
  leftPanel: boolean;
  rightPanel: boolean;
  bottomOutput: boolean;
  menuLabels: "full" | "compact" | "icons" | "button";
}

export const MAP_SHELL_RESPONSIVE_BREAKPOINTS = MAP_LAYOUT_TOKENS.breakpoints;

export function getMapShellResponsiveMode(width: number): MapShellResponsiveMode {
  if (width < MAP_SHELL_RESPONSIVE_BREAKPOINTS.narrow) {
    return "compact";
  }
  if (width < MAP_SHELL_RESPONSIVE_BREAKPOINTS.medium) {
    return "narrow";
  }
  if (width < MAP_SHELL_RESPONSIVE_BREAKPOINTS.wide) {
    return "medium";
  }
  return "wide";
}

export function getMapShellVisibility(width: number): MapShellVisibility {
  const responsiveMode = getMapShellResponsiveMode(width);
  if (responsiveMode === "wide") {
    return { leftPanel: true, rightPanel: true, bottomOutput: false, menuLabels: "full" };
  }
  if (responsiveMode === "medium") {
    return { leftPanel: true, rightPanel: true, bottomOutput: false, menuLabels: "compact" };
  }
  if (responsiveMode === "narrow") {
    return { leftPanel: true, rightPanel: false, bottomOutput: false, menuLabels: "icons" };
  }
  return { leftPanel: false, rightPanel: false, bottomOutput: false, menuLabels: "button" };
}

export function createMapShellSafeInsets(options: {
  activityRailWidth?: number;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  statusBarHeight?: number;
  bottomDrawerHeight?: number;
  topInset?: number;
  rightInset?: number;
  bottomInset?: number;
  leftInset?: number;
} = {}): MapShellSafeInsets {
  const activityRailWidth = options.activityRailWidth ?? 42;
  const leftPanelWidth = options.leftPanelWidth ?? 384;
  const rightPanelWidth = options.rightPanelWidth ?? 432;
  const statusBarHeight = options.statusBarHeight ?? 28;
  const bottomDrawerHeight = options.bottomDrawerHeight ?? 340;
  const topInset = options.topInset ?? 8;
  const rightInset = options.rightInset ?? 12;
  const bottomInset = options.bottomInset ?? 12;
  const leftInset = options.leftInset ?? 12;

  return {
    top: topInset,
    right: rightInset,
    bottom: bottomInset,
    left: leftInset,
    activityRail: activityRailWidth,
    leftPanel: leftPanelWidth,
    rightPanel: rightPanelWidth,
    statusBar: statusBarHeight,
    bottomDrawer: bottomDrawerHeight,
  };
}
