import { MAP_PANEL_SIZES, MAP_SHELL_DIMENSIONS } from "./mapTokens";

/**
 * Consolidated layout tokens for the Map Explorer modal. These values alias
 * existing shell dimensions and panel sizes to avoid hard‑coded pixel strings
 * throughout layout components. Use these aliases for any height, width or
 * inset calculations related to the modal layout.
 */
export const MAP_LAYOUT_TOKENS = {
  /** Height of the premium modal chrome (command center) used by overlay bars */
  modalChromeHeight: MAP_SHELL_DIMENSIONS.commandCenterHeight,
  /** Height of the premium menu row used by the shell wrapper */
  menuBarHeight: MAP_SHELL_DIMENSIONS.menuBarHeight,
  /** Height of the thin command bar used in MapWorkspaceShell */
  commandBarHeight: "2.25rem",
  /** Default status bar height defined in the shell dimensions */
  statusBarHeight: MAP_SHELL_DIMENSIONS.statusBarHeight,
  /** Minimum height used by the status bar component */
  statusBarMinHeight: "1.9rem",
  /** Left sidebar panel sizing */
  leftPanelMinWidth: MAP_SHELL_DIMENSIONS.leftSidebarMinWidth,
  leftPanelWidth: MAP_SHELL_DIMENSIONS.leftSidebarWidth,
  leftPanelMaxWidth: MAP_SHELL_DIMENSIONS.leftSidebarMaxWidth,
  /** Right inspector/dock panel sizing */
  rightPanelMinWidth: MAP_SHELL_DIMENSIONS.rightInspectorMinWidth,
  rightPanelWidth: MAP_SHELL_DIMENSIONS.rightInspectorWidth,
  rightPanelMaxWidth: MAP_SHELL_DIMENSIONS.rightInspectorMaxWidth,
  /** Bottom panel sizing */
  bottomPanelMinHeight: MAP_SHELL_DIMENSIONS.bottomPanelMinHeight,
  bottomPanelHeight: MAP_SHELL_DIMENSIONS.bottomPanelHeight,
  bottomPanelMaxHeight: MAP_SHELL_DIMENSIONS.bottomPanelMaxHeight,
  bottomDrawerHeight: MAP_SHELL_DIMENSIONS.bottomDrawerHeight,
  /** Safe inset for floating map furniture such as north arrow or keyboard help */
  mapOverlayInset: MAP_SHELL_DIMENSIONS.canvasOverlayInset,
  safeInsetTop: MAP_SHELL_DIMENSIONS.shellSafeInsetTop,
  safeInsetRight: MAP_SHELL_DIMENSIONS.shellSafeInsetRight,
  safeInsetBottom: MAP_SHELL_DIMENSIONS.shellSafeInsetBottom,
  safeInsetLeft: MAP_SHELL_DIMENSIONS.shellSafeInsetLeft,
  breakpoints: {
    wide: 1440,
    medium: 1200,
    narrow: 900,
  },
  /** Maximum height for popovers/dialogs anchored to the canvas */
  dialogMaxHeight: MAP_PANEL_SIZES.bottomPanelMaxHeight,
} as const;
