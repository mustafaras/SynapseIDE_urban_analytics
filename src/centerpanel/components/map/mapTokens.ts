/* ================================================================== */
/*  Map Explorer Design Tokens                                         */
/*  All visual values are aliases of DESIGN_TOKENS.                    */
/* ================================================================== */

import type React from "react";
import { DESIGN_TOKENS } from "@/constants/design";

const mapToken = DESIGN_TOKENS.mapExplorer;

/* ---- Map Workbench Palette (semantic map aliases) ---- */
export const MAP_COLORS = {
  bg: mapToken.colors.charcoalBase,
  bgPanel: mapToken.colors.charcoalPanel,
  bgHeader: mapToken.colors.charcoalHeader,
  bgWorkspace: mapToken.colors.charcoalWorkspace,
  interaction: mapToken.colors.interaction,
  interactionSoft: mapToken.colors.interactionSoft,
  interactionSubtle: mapToken.colors.interactionSubtle,
  selected: mapToken.colors.selected,
  selectedSubtle: mapToken.colors.selectedSubtle,
  focus: mapToken.colors.focus,
  hairline: mapToken.colors.hairline,
  hairlineStrong: mapToken.colors.hairlineStrong,
  hairlineSubtle: mapToken.colors.hairlineSubtle,
  dashed: mapToken.colors.dashed,
  caveat: mapToken.colors.caveat,
  caveatText: mapToken.colors.caveatText,
  neutral: mapToken.colors.neutral,
  neutralSubtle: mapToken.colors.neutralSubtle,
  text: mapToken.colors.warmText,
  textSecondary: mapToken.colors.warmTextSecondary,
  textMuted: mapToken.colors.warmTextMuted,
  error: "var(--syn-status-error, #f87171)",
  success: "var(--syn-status-valid, #4ec27d)",
  warning: mapToken.colors.caveatText,
  white: mapToken.colors.markerWhite,
  overlayBg: mapToken.colors.overlay,
  transparent: mapToken.colors.transparent,
} as const;

export type MapChromeSlotKey =
  | "activityRail"
  | "commandCenter"
  | "sidebar"
  | "rightInspector"
  | "bottomPanel"
  | "statusBar"
  | "canvasOverlay"
  | "problemsPanel";

export const MAP_CHROME_SLOT_KEYS: readonly MapChromeSlotKey[] = [
  "activityRail",
  "commandCenter",
  "sidebar",
  "rightInspector",
  "bottomPanel",
  "statusBar",
  "canvasOverlay",
  "problemsPanel",
] as const;

export const MAP_CHROME_TOKENS: Record<
  MapChromeSlotKey,
  {
    readonly surface: string;
    readonly border: string;
    readonly text: string;
    readonly accent: string;
    readonly activeBg: string;
  }
> = {
  activityRail: {
    surface: MAP_COLORS.bgHeader,
    border: MAP_COLORS.hairlineSubtle,
    text: MAP_COLORS.textSecondary,
    accent: MAP_COLORS.interaction,
    activeBg: MAP_COLORS.selectedSubtle,
  },
  commandCenter: {
    surface: MAP_COLORS.bgHeader,
    border: MAP_COLORS.hairline,
    text: MAP_COLORS.text,
    accent: MAP_COLORS.interaction,
    activeBg: MAP_COLORS.interactionSubtle,
  },
  sidebar: {
    surface: MAP_COLORS.bgPanel,
    border: MAP_COLORS.hairlineSubtle,
    text: MAP_COLORS.text,
    accent: MAP_COLORS.interaction,
    activeBg: MAP_COLORS.selectedSubtle,
  },
  rightInspector: {
    surface: MAP_COLORS.bgPanel,
    border: MAP_COLORS.hairlineSubtle,
    text: MAP_COLORS.text,
    accent: MAP_COLORS.focus,
    activeBg: MAP_COLORS.selectedSubtle,
  },
  bottomPanel: {
    surface: MAP_COLORS.bgPanel,
    border: MAP_COLORS.hairlineSubtle,
    text: MAP_COLORS.textSecondary,
    accent: MAP_COLORS.interaction,
    activeBg: MAP_COLORS.interactionSubtle,
  },
  statusBar: {
    surface: MAP_COLORS.bgHeader,
    border: MAP_COLORS.hairlineSubtle,
    text: MAP_COLORS.textMuted,
    accent: MAP_COLORS.neutral,
    activeBg: MAP_COLORS.neutralSubtle,
  },
  canvasOverlay: {
    surface: MAP_COLORS.overlayBg,
    border: MAP_COLORS.hairlineStrong,
    text: MAP_COLORS.text,
    accent: MAP_COLORS.focus,
    activeBg: MAP_COLORS.selectedSubtle,
  },
  problemsPanel: {
    surface: MAP_COLORS.bgPanel,
    border: MAP_COLORS.hairlineStrong,
    text: MAP_COLORS.text,
    accent: MAP_COLORS.caveatText,
    activeBg: MAP_COLORS.caveat,
  },
} as const;

/* ----------------------------------------------------------------- */
/*  MapLibre-safe color resolution                                    */
/*  MapLibre GL paint properties (fill-color, line-color, …) cannot   */
/*  parse CSS `var(...)` or `color-mix(...)` expressions, which is     */
/*  what most MAP_COLORS tokens are. Resolve them to a concrete        */
/*  rgb()/rgba() string via the browser before handing them to the    */
/*  map. Falls back to the raw value when no DOM is available.         */
/* ----------------------------------------------------------------- */
let colorProbe: HTMLSpanElement | null = null;
const resolvedColorCache = new Map<string, string>();

export function resolveMapPaintColor(value: string): string {
  if (!value || (!value.includes("var(") && !value.includes("color-mix("))) {
    return value;
  }
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
    return value;
  }
  const cached = resolvedColorCache.get(value);
  if (cached !== undefined) return cached;
  try {
    if (!colorProbe) {
      colorProbe = document.createElement("span");
      colorProbe.style.display = "none";
      document.body.appendChild(colorProbe);
    }
    colorProbe.style.color = "";
    colorProbe.style.color = value;
    const resolved = getComputedStyle(colorProbe).color;
    const out = resolved && resolved.trim() !== "" ? resolved : value;
    resolvedColorCache.set(value, out);
    return out;
  } catch {
    return value;
  }
}

/* ---- Border Radius ---- */
export const MAP_RADIUS = {
  none: DESIGN_TOKENS.borderRadius.geometric,
  xs: DESIGN_TOKENS.borderRadius.xs,
  sm: DESIGN_TOKENS.borderRadius.hover,
  md: DESIGN_TOKENS.borderRadius.sm,
  lg: DESIGN_TOKENS.borderRadius.sm,
  glass: DESIGN_TOKENS.borderRadius.sm,
  full: DESIGN_TOKENS.borderRadius.full,
} as const;

/* ---- Shadows ---- */
export const MAP_SHADOWS = {
  none: "none",
  modal: "none",
  dropdown: "0 8px 24px rgba(0, 0, 0, 0.28)",
  marker: DESIGN_TOKENS.shadows.sm,
  panel: "none",
} as const;

/* ---- Transitions ---- */
export const MAP_TRANSITIONS = {
  none: "none",
  fast: DESIGN_TOKENS.transitions.sm,
  standard: DESIGN_TOKENS.transitions.md,
} as const;

export const MAP_MOTION = {
  duration: {
    panel: "180ms",
    row: "200ms",
    status: "320ms",
    progress: "1s",
    focus: "220ms",
  },
  easing: {
    panel: "cubic-bezier(0.2, 0, 0, 1)",
    row: DESIGN_TOKENS.animation.easing.easeOut,
    status: DESIGN_TOKENS.animation.easing.easeOut,
    progress: "linear",
    focus: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

/* ---- Typography ---- */
export const MAP_TYPOGRAPHY = {
  fontFamily: DESIGN_TOKENS.typography.fontFamily.primary,
  fontFamilyBrand: DESIGN_TOKENS.typography.fontFamily.brand,
  fontFamilyMono: DESIGN_TOKENS.typography.fontFamily.mono,
  fontSize: {
    xs: DESIGN_TOKENS.typography.fontSize.xs,
    sm: DESIGN_TOKENS.typography.fontSize.sm,
    md: DESIGN_TOKENS.typography.fontSize.md,
  },
  fontWeight: {
    medium: DESIGN_TOKENS.typography.fontWeight.medium,
    semibold: DESIGN_TOKENS.typography.fontWeight.semibold,
    bold: DESIGN_TOKENS.typography.fontWeight.bold,
  },
  lineHeight: {
    tight: DESIGN_TOKENS.typography.lineHeight.tight,
    normal: DESIGN_TOKENS.typography.lineHeight.normal,
    relaxed: DESIGN_TOKENS.typography.lineHeight.relaxed,
  },
  letterSpacing: {
    title: mapToken.letterSpacing.title,
    label: mapToken.letterSpacing.label,
    caps: mapToken.letterSpacing.caps,
  },
} as const;

/* ---- Spacing ---- */
export const MAP_SPACING = {
  zero: MAP_RADIUS.none,
  xs: DESIGN_TOKENS.spacing.xs,
  sm: DESIGN_TOKENS.spacing.sm,
  md: DESIGN_TOKENS.spacing.md,
  lg: DESIGN_TOKENS.spacing.lg,
  xl: DESIGN_TOKENS.spacing.xl,
  panel: DESIGN_TOKENS.spacing.glass,
} as const;

/* ---- Dimensions ---- */
export const MAP_DIMENSIONS = {
  viewportWidth: mapToken.dimensions.viewportWidth,
  viewportHeight: mapToken.dimensions.viewportHeight,
  searchWidth: mapToken.dimensions.searchWidth,
  searchMaxWidth: mapToken.dimensions.searchMaxWidth,
  pinSidebarWidth: mapToken.dimensions.pinSidebarWidth,
  layerPanelWidth: mapToken.dimensions.layerPanelWidth,
  drawingPanelWidth: mapToken.dimensions.drawingPanelWidth,
  measurementPanelWidth: mapToken.dimensions.measurementPanelWidth,
  navigatorMaxWidth: mapToken.dimensions.navigatorMaxWidth,
  navigatorMaxHeight: mapToken.dimensions.navigatorMaxHeight,
  importProgressWidth: mapToken.dimensions.importProgressWidth,
  closeButtonSize: mapToken.dimensions.closeButtonSize,
  symbologyPanelWidth: mapToken.dimensions.symbologyPanelWidth,
  pinMarkerSize: mapToken.dimensions.pinMarkerSize,
  separatorWidth: mapToken.dimensions.separatorWidth,
  toolbarSeparatorHeight: mapToken.dimensions.toolbarSeparatorHeight,
  progressTrackHeight: mapToken.dimensions.progressTrackHeight,
  hiddenSize: mapToken.dimensions.hiddenSize,
} as const;

export const MAP_SHELL_DIMENSIONS = {
  activityRailWidth: "2.625rem",
  railButtonSize: "2.25rem",
  modalChromeHeight: "2.75rem",
  commandCenterHeight: "5.34375rem",
  menuBarHeight: "5.34375rem",
  topCommandHeight: "5.34375rem",
  leftSidebarMinWidth: "18.75rem",
  leftSidebarWidth: "clamp(19rem, 22vw, 24rem)",
  leftSidebarMaxWidth: "47.5rem",
  leftPanelWidth: "clamp(19rem, 22vw, 24rem)",
  rightInspectorMinWidth: "20rem",
  rightInspectorWidth: "clamp(20rem, 24vw, 26rem)",
  rightInspectorMaxWidth: "35rem",
  rightDockWidth: "clamp(20rem, 24vw, 26rem)",
  bottomPanelMinHeight: "13.75rem",
  bottomPanelHeight: "clamp(13.75rem, 30vh, 21.25rem)",
  bottomPanelMaxHeight: "21.25rem",
  bottomPanelHeightDefault: "clamp(13.75rem, 30vh, 21.25rem)",
  bottomDrawerHeight: "clamp(13.75rem, 30vh, 21.25rem)",
  statusBarHeight: "1.75rem",
  statusHeight: "1.75rem",
  canvasOverlayInset: MAP_SPACING.md,
  shellSafeInsetTop: "0.5rem",
  shellSafeInsetRight: "0.75rem",
  shellSafeInsetBottom: "0.75rem",
  shellSafeInsetLeft: "0.75rem",
  separatorWidth: MAP_DIMENSIONS.separatorWidth,
} as const;

export const MAP_LAYOUT_TOKENS = {
  modalChromeHeight: MAP_SHELL_DIMENSIONS.modalChromeHeight,
  menuBarHeight: MAP_SHELL_DIMENSIONS.menuBarHeight,
  topCommandHeight: MAP_SHELL_DIMENSIONS.topCommandHeight,
  statusBarHeight: MAP_SHELL_DIMENSIONS.statusBarHeight,
  leftPanelWidth: MAP_SHELL_DIMENSIONS.leftPanelWidth,
  leftPanelMinWidth: MAP_SHELL_DIMENSIONS.leftSidebarMinWidth,
  leftPanelMaxWidth: MAP_SHELL_DIMENSIONS.leftSidebarMaxWidth,
  rightDockWidth: MAP_SHELL_DIMENSIONS.rightDockWidth,
  rightPanelMinWidth: MAP_SHELL_DIMENSIONS.rightInspectorMinWidth,
  rightPanelMaxWidth: MAP_SHELL_DIMENSIONS.rightInspectorMaxWidth,
  bottomPanelHeight: MAP_SHELL_DIMENSIONS.bottomPanelHeightDefault,
  bottomDrawerHeight: MAP_SHELL_DIMENSIONS.bottomDrawerHeight,
  overlaySafeInsetX: MAP_SHELL_DIMENSIONS.shellSafeInsetLeft,
  overlaySafeInsetY: MAP_SHELL_DIMENSIONS.shellSafeInsetTop,
  overlaySafeBottom: "6.75rem",
  safeInsetTop: MAP_SHELL_DIMENSIONS.shellSafeInsetTop,
  safeInsetRight: MAP_SHELL_DIMENSIONS.shellSafeInsetRight,
  safeInsetBottom: MAP_SHELL_DIMENSIONS.shellSafeInsetBottom,
  safeInsetLeft: MAP_SHELL_DIMENSIONS.shellSafeInsetLeft,
  breakpoints: {
    wide: 1440,
    medium: 1200,
    narrow: 900,
  },
  popoverMaxHeight: "min(24rem, calc(100vh - 8rem))",
  dialogMaxHeight: "min(42rem, calc(100vh - 3rem))",
  /* Standard floating dialog geometry — every Map Explorer modal shares the
     same footprint so stacked workflows feel like one coherent surface. */
  dialogWidth: "min(1040px, calc(100vw - 4rem))",
  dialogHeight: "min(680px, calc(100vh - 10rem))",
} as const;

export function createMapShellCssVars(): React.CSSProperties {
  return {
    "--map-shell-modal-chrome-height": MAP_LAYOUT_TOKENS.modalChromeHeight,
    "--map-menu-h": MAP_LAYOUT_TOKENS.menuBarHeight,
    "--map-shell-command-height": MAP_LAYOUT_TOKENS.topCommandHeight,
    "--map-shell-left-panel-width": MAP_LAYOUT_TOKENS.leftPanelWidth,
    "--map-shell-right-dock-width": MAP_LAYOUT_TOKENS.rightDockWidth,
    "--map-shell-bottom-panel-height": MAP_LAYOUT_TOKENS.bottomPanelHeight,
    "--map-shell-bottom-drawer-height": MAP_LAYOUT_TOKENS.bottomDrawerHeight,
    "--map-shell-status-height": MAP_LAYOUT_TOKENS.statusBarHeight,
    "--map-status-h": MAP_LAYOUT_TOKENS.statusBarHeight,
    "--map-left-min": MAP_LAYOUT_TOKENS.leftPanelMinWidth,
    "--map-left-w": MAP_LAYOUT_TOKENS.leftPanelWidth,
    "--map-right-min": MAP_LAYOUT_TOKENS.rightPanelMinWidth,
    "--map-right-w": MAP_LAYOUT_TOKENS.rightPanelWidth,
    "--map-overlay-safe-inset-x": MAP_LAYOUT_TOKENS.overlaySafeInsetX,
    "--map-overlay-safe-inset-y": MAP_LAYOUT_TOKENS.overlaySafeInsetY,
    "--map-overlay-safe-bottom": MAP_LAYOUT_TOKENS.overlaySafeBottom,
    "--map-shell-safe-inset-top": MAP_LAYOUT_TOKENS.safeInsetTop,
    "--map-shell-safe-inset-right": MAP_LAYOUT_TOKENS.safeInsetRight,
    "--map-shell-safe-inset-bottom": MAP_LAYOUT_TOKENS.safeInsetBottom,
    "--map-shell-safe-inset-left": MAP_LAYOUT_TOKENS.safeInsetLeft,
    "--map-shell-breakpoint-wide": `${MAP_LAYOUT_TOKENS.breakpoints.wide}px`,
    "--map-shell-breakpoint-medium": `${MAP_LAYOUT_TOKENS.breakpoints.medium}px`,
    "--map-shell-breakpoint-narrow": `${MAP_LAYOUT_TOKENS.breakpoints.narrow}px`,
    "--map-popover-max-height": MAP_LAYOUT_TOKENS.popoverMaxHeight,
    "--map-dialog-max-height": MAP_LAYOUT_TOKENS.dialogMaxHeight,
    "--map-dialog-w": MAP_LAYOUT_TOKENS.dialogWidth,
    "--map-dialog-h": MAP_LAYOUT_TOKENS.dialogHeight,
  } as React.CSSProperties;
}

export const MAP_NUMERIC = {
  ...mapToken.numeric,
} as const;

export const MAP_ICON_SIZES = {
  xs: MAP_NUMERIC.iconXs,
  sm: MAP_NUMERIC.iconSm,
  md: MAP_NUMERIC.iconMd,
} as const;

/* ---- Visual system polish aliases ---- */
export const MAP_FOCUS_STYLES = {
  ring: {
    outline: `2px solid ${MAP_COLORS.focus}`,
    outlineOffset: "2px",
    boxShadow: `0 0 0 3px color-mix(in srgb, ${MAP_COLORS.focus} 28%, transparent)`,
  } satisfies React.CSSProperties,
} as const;

export const MAP_TEXT_STYLES = {
  titleWrap: {
    minWidth: MAP_SPACING.zero,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "normal",
    hyphens: "auto",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  } satisfies React.CSSProperties,
  valueWrap: {
    minWidth: MAP_SPACING.zero,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  } satisfies React.CSSProperties,
  truncate: {
    minWidth: MAP_SPACING.zero,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,
  chipLabel: {
    minWidth: MAP_SPACING.zero,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,
} as const;

export const MAP_PANEL_SIZES = {
  sidebarExpanded: "clamp(22.5rem, 26vw, 29rem)",
  inspectorRightRail: "min(34rem, calc(100% - 2rem))",
  inspectorBottomDrawer: "min(26rem, 58%)",
  bottomPanelHeight: "clamp(10rem, 28vh, 20rem)",
  bottomPanelMaxHeight: "min(20rem, 42vh)",
} as const;

/* ---- Blur ---- */
export const MAP_BLUR = {
  overlay: DESIGN_TOKENS.blur.md,
  glass: DESIGN_TOKENS.glassmorphism.backdrop.glassDark,
} as const;

/* ---- Z-Index ---- */
export const MAP_Z_INDEX = {
  canvas: DESIGN_TOKENS.zIndex.base,
  mapFurniture: MAP_NUMERIC.sidebarZIndex - 10,
  commandBar: MAP_NUMERIC.sidebarZIndex - 8,
  panel: MAP_NUMERIC.sidebarZIndex,
  modalChrome: MAP_NUMERIC.overlayZIndex,
  overlay: MAP_NUMERIC.overlayZIndex,
  dropdown: MAP_NUMERIC.dropdownZIndex,
  /* Portaled overlay surfaces (dropdown menus, popovers) render into
     document.body and must paint above the fullscreen map modal (10050).
     Uses the shared design tier: modal 10050 < popover 10060 < tooltip 10070. */
  popover: DESIGN_TOKENS.zIndex.popover,
  dialog: DESIGN_TOKENS.zIndex.popover + 1,
  toast: DESIGN_TOKENS.zIndex.toast,
  tooltip: DESIGN_TOKENS.zIndex.tooltip,
  closeBtn: MAP_NUMERIC.closeButtonZIndex,
  sidebar: MAP_NUMERIC.sidebarZIndex,
  temporalSelector: MAP_NUMERIC.temporalSelectorZIndex,
  symbologyPanel: MAP_NUMERIC.symbologyPanelZIndex,
  dragOverlay: MAP_NUMERIC.dragOverlayZIndex,
  importProgress: MAP_NUMERIC.importProgressZIndex,
} as const;

/* ---- Borders ---- */
export const MAP_STROKES = {
  none: "none",
  hairline: `1px solid ${MAP_COLORS.hairline}`,
  hairlineStrong: `1px solid ${MAP_COLORS.hairlineStrong}`,
  hairlineSubtle: `1px solid ${MAP_COLORS.hairlineSubtle}`,
  dashedStrong: `2px dashed ${MAP_COLORS.dashed}`,
  marker: `2px solid ${MAP_COLORS.white}`,
} as const;

/* ================================================================== */
/*  Pre-composed inline style objects                                  */
/* ================================================================== */

export const mapStyles = {
  srOnly: {
    position: "absolute",
    width: MAP_DIMENSIONS.hiddenSize,
    height: MAP_DIMENSIONS.hiddenSize,
    padding: MAP_SPACING.zero,
    margin: `-${MAP_DIMENSIONS.hiddenSize}`,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: MAP_STROKES.none,
  } satisfies React.CSSProperties,

  skipNavFocus: {
    position: "absolute",
    width: "auto",
    height: "auto",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    margin: MAP_SPACING.zero,
    overflow: "visible",
    clip: "auto",
    whiteSpace: "normal",
    zIndex: DESIGN_TOKENS.zIndex.tooltip,
    top: MAP_SPACING.sm,
    left: MAP_SPACING.sm,
    background: MAP_COLORS.bgPanel,
    color: MAP_COLORS.interaction,
    borderRadius: MAP_RADIUS.sm,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    textDecoration: "none",
    border: MAP_STROKES.hairlineStrong,
  } satisfies React.CSSProperties,

  overlay: {
    position: "fixed",
    inset: MAP_SPACING.zero,
    zIndex: MAP_Z_INDEX.overlay,
    background: MAP_COLORS.bg,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
  } satisfies React.CSSProperties,

  modal: {
    position: "relative",
    width: MAP_DIMENSIONS.viewportWidth,
    height: MAP_DIMENSIONS.viewportHeight,
    background: MAP_COLORS.bg,
    border: MAP_STROKES.none,
    borderRadius: MAP_RADIUS.none,
    overflow: "hidden",
    overflowX: "clip",
    overflowY: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: MAP_SHADOWS.none,
  } satisfies React.CSSProperties,

  embeddedShell: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: MAP_DIMENSIONS.navigatorMaxHeight,
    zIndex: DESIGN_TOKENS.zIndex.base,
    background: MAP_COLORS.bg,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
  } satisfies React.CSSProperties,

  embeddedSurface: {
    position: "relative",
    width: "100%",
    height: "100%",
    background: MAP_COLORS.bg,
    border: MAP_STROKES.none,
    borderRadius: MAP_RADIUS.none,
    overflow: "hidden",
    overflowX: "clip",
    overflowY: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: MAP_SHADOWS.none,
  } satisfies React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    alignContent: "flex-start",
    flexWrap: "wrap",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.xs} calc(${MAP_SPACING.md} + ${MAP_DIMENSIONS.closeButtonSize} + ${MAP_SPACING.md}) ${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    background: MAP_COLORS.bgHeader,
    borderBottom: MAP_STROKES.hairline,
    flexShrink: 0,
    maxWidth: "100%",
    minWidth: MAP_SPACING.zero,
    overflowX: "clip",
  } satisfies React.CSSProperties,

  title: {
    color: MAP_COLORS.interaction,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.title,
    textTransform: "uppercase",
    marginRight: MAP_SPACING.sm,
  } satisfies React.CSSProperties,

  btn: {
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.sm,
    border: MAP_STROKES.hairline,
    background: MAP_COLORS.transparent,
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
    cursor: "pointer",
    transition: MAP_TRANSITIONS.fast,
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
  } satisfies React.CSSProperties,

  btnActive: {
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.sm,
    border: `1px solid ${MAP_COLORS.focus}`,
    background: MAP_COLORS.selectedSubtle,
    color: MAP_COLORS.interaction,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
    cursor: "pointer",
    transition: MAP_TRANSITIONS.fast,
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    boxShadow: `inset 2px 0 0 ${MAP_COLORS.interaction}`,
  } satisfies React.CSSProperties,

  btnDisabled: {
    opacity: DESIGN_TOKENS.opacity[48],
    cursor: "not-allowed",
  } satisfies React.CSSProperties,

  btnBusy: {
    opacity: DESIGN_TOKENS.opacity[64],
    cursor: "wait",
  } satisfies React.CSSProperties,

  closeBtn: {
    position: "absolute",
    top: MAP_SPACING.sm,
    right: MAP_SPACING.md,
    zIndex: MAP_Z_INDEX.closeBtn,
    background: MAP_COLORS.bgPanel,
    border: MAP_STROKES.hairline,
    color: MAP_COLORS.textSecondary,
    borderRadius: MAP_RADIUS.sm,
    width: MAP_DIMENSIONS.closeButtonSize,
    height: MAP_DIMENSIONS.closeButtonSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: MAP_TYPOGRAPHY.fontSize.md,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  } satisfies React.CSSProperties,

  mapContainer: {
    flex: 1,
    position: "relative",
    minHeight: MAP_SPACING.zero,
  } satisfies React.CSSProperties,

  workspaceBar: {
    display: "flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    background: MAP_COLORS.bgHeader,
    borderBottom: MAP_STROKES.hairlineSubtle,
    boxShadow: MAP_SHADOWS.none,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  workspaceLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    color: MAP_COLORS.textMuted,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
    textTransform: "uppercase",
    paddingRight: MAP_SPACING.sm,
    borderRight: MAP_STROKES.hairlineSubtle,
  } satisfies React.CSSProperties,

  workspaceSpacer: {
    flex: 1,
  } satisfies React.CSSProperties,

  workspaceHint: {
    color: MAP_COLORS.textSecondary,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.label,
    maxWidth: "28rem",
    textAlign: "right",
    opacity: DESIGN_TOKENS.opacity[80],
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,

  extensionSlotBar: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: MAP_SPACING.sm,
    minHeight: "1.875rem",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    background: MAP_COLORS.bgPanel,
    borderBottom: MAP_STROKES.hairlineSubtle,
    boxShadow: MAP_SHADOWS.none,
    flexShrink: 0,
    overflowX: "auto",
  } satisfies React.CSSProperties,

  extensionSlotRegion: {
    flex: "1 1 0",
    minWidth: "8.5rem",
    display: "flex",
    alignItems: "stretch",
  } satisfies React.CSSProperties,

  extensionSlotNotice: {
    flex: 1,
    minWidth: MAP_SPACING.zero,
    display: "flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.zero} ${MAP_SPACING.sm}`,
    background: MAP_COLORS.transparent,
    border: MAP_STROKES.none,
    borderLeft: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: MAP_RADIUS.none,
    color: MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } satisfies React.CSSProperties,

  bottomTimelineRegion: {
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    background: MAP_COLORS.bgPanel,
    borderTop: MAP_STROKES.hairlineSubtle,
    boxShadow: MAP_SHADOWS.none,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  bottomTimelineNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: MAP_SPACING.sm,
    minWidth: MAP_SPACING.zero,
    padding: `${MAP_SPACING.zero} ${MAP_SPACING.sm}`,
    background: MAP_COLORS.transparent,
    border: MAP_STROKES.none,
    borderLeft: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: MAP_RADIUS.none,
    color: MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } satisfies React.CSSProperties,

  dragOverlay: {
    position: "absolute",
    inset: MAP_SPACING.md,
    zIndex: MAP_Z_INDEX.dragOverlay,
    border: MAP_STROKES.hairlineStrong,
    borderRadius: MAP_RADIUS.sm,
    background: MAP_COLORS.overlayBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: MAP_COLORS.interaction,
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    pointerEvents: "none",
  } satisfies React.CSSProperties,

  importProgress: {
    position: "absolute",
    top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
    left: "50%",
    transform: "translateX(-50%)",
    width: MAP_DIMENSIONS.importProgressWidth,
    maxWidth: `calc(100% - ${MAP_SPACING.xl})`,
    zIndex: MAP_Z_INDEX.importProgress,
    background: MAP_COLORS.bgPanel,
    border: MAP_STROKES.hairlineStrong,
    borderRadius: MAP_RADIUS.sm,
    boxShadow: MAP_SHADOWS.none,
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    color: MAP_COLORS.text,
  } satisfies React.CSSProperties,

  importProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    marginBottom: MAP_SPACING.sm,
  } satisfies React.CSSProperties,

  importProgressMeta: {
    display: "grid",
    gap: MAP_SPACING.xs,
    marginBottom: MAP_SPACING.sm,
  } satisfies React.CSSProperties,

  importProgressStage: {
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  } satisfies React.CSSProperties,

  importProgressStats: {
    display: "flex",
    justifyContent: "space-between",
    gap: MAP_SPACING.md,
    color: MAP_COLORS.textMuted,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  } satisfies React.CSSProperties,

  importProgressTrack: {
    width: "100%",
    height: MAP_DIMENSIONS.progressTrackHeight,
    borderRadius: MAP_RADIUS.sm,
    background: MAP_COLORS.hairlineSubtle,
    overflow: "hidden",
  } satisfies React.CSSProperties,

  importProgressFill: {
    height: "100%",
    background: MAP_COLORS.interaction,
    transition: `width var(--gis-motion-duration-progress, ${MAP_MOTION.duration.progress}) var(--gis-motion-easing-progress, ${MAP_MOTION.easing.progress})`,
  } satisfies React.CSSProperties,

  navigatorStage: {
    position: "absolute",
    zIndex: MAP_Z_INDEX.importProgress - 2,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  } satisfies React.CSSProperties,

  navigatorStageInner: {
    maxWidth: "100%",
    maxHeight: "100%",
    pointerEvents: "auto",
  } satisfies React.CSSProperties,

  layerManagerFrame: {
    position: "absolute",
    top: MAP_SPACING.zero,
    left: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: MAP_DIMENSIONS.layerPanelWidth,
  } satisfies React.CSSProperties,

  layerPanelOpenButton: {
    position: "absolute",
    top: "calc(var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 5.34375rem) + var(--map-overlay-safe-inset-y, 0.25rem))) + 0.75rem)",
    left: MAP_SPACING.zero,
    zIndex: MAP_Z_INDEX.sidebar,
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    background: MAP_COLORS.bgPanel,
    color: MAP_COLORS.interaction,
    border: MAP_STROKES.hairlineSubtle,
    borderLeft: MAP_STROKES.none,
    borderRadius: `0 ${MAP_RADIUS.xs} ${MAP_RADIUS.xs} 0`,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    cursor: "pointer",
  } satisfies React.CSSProperties,

  sidePanelSurface: {
    position: "absolute",
    top: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    background: MAP_COLORS.bgPanel,
    color: MAP_COLORS.text,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    zIndex: MAP_Z_INDEX.sidebar,
    boxShadow: MAP_SHADOWS.none,
  } satisfies React.CSSProperties,

  sidePanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: MAP_SPACING.sm,
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    borderBottom: MAP_STROKES.hairlineSubtle,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  sidePanelTitleStack: {
    minWidth: MAP_SPACING.zero,
    display: "grid",
    gap: MAP_SPACING.xs,
  } satisfies React.CSSProperties,

  sidePanelEyebrow: {
    color: MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
    textTransform: "uppercase",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  } satisfies React.CSSProperties,

  sidePanelTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    ...MAP_TEXT_STYLES.titleWrap,
    color: MAP_COLORS.text,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  } satisfies React.CSSProperties,

  sidePanelHeaderActions: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: MAP_SPACING.xs,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  sidePanelActionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: MAP_SPACING.xs,
    minHeight: "1.625rem",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    border: MAP_STROKES.hairlineSubtle,
    borderRadius: MAP_RADIUS.sm,
    background: MAP_COLORS.transparent,
    color: MAP_COLORS.textSecondary,
    cursor: "pointer",
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    transition: MAP_TRANSITIONS.fast,
  } satisfies React.CSSProperties,

  sidePanelPrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: MAP_SPACING.xs,
    minHeight: "1.875rem",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    border: `1px solid ${MAP_COLORS.focus}`,
    borderRadius: MAP_RADIUS.sm,
    background: MAP_COLORS.transparent,
    color: MAP_COLORS.interaction,
    cursor: "pointer",
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
    transition: MAP_TRANSITIONS.fast,
  } satisfies React.CSSProperties,

  sidePanelSummaryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: MAP_SPACING.zero,
    borderBottom: MAP_STROKES.hairlineSubtle,
    background: MAP_COLORS.transparent,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  sidePanelMetric: {
    minWidth: MAP_SPACING.zero,
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
    borderRight: MAP_STROKES.hairlineSubtle,
    display: "grid",
    gap: MAP_SPACING.xs,
  } satisfies React.CSSProperties,

  sidePanelMetricLabel: {
    color: MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
    textTransform: "uppercase",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,

  sidePanelMetricValue: {
    color: MAP_COLORS.text,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,

  sidePanelSearchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.sm,
    border: MAP_STROKES.hairlineSubtle,
    background: MAP_COLORS.bg,
    color: MAP_COLORS.text,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    outline: MAP_STROKES.none,
  } satisfies React.CSSProperties,

  sidePanelBody: {
    flex: 1,
    minHeight: MAP_SPACING.zero,
    overflowY: "auto",
    overflowX: "hidden",
  } satisfies React.CSSProperties,

  sidePanelRow: {
    minWidth: MAP_SPACING.zero,
    borderBottom: MAP_STROKES.hairlineSubtle,
    color: MAP_COLORS.textSecondary,
    transition: MAP_TRANSITIONS.fast,
  } satisfies React.CSSProperties,

  sidePanelRowActive: {
    background: MAP_COLORS.selectedSubtle,
    color: MAP_COLORS.interaction,
    boxShadow: `inset 2px 0 0 ${MAP_COLORS.interaction}`,
  } satisfies React.CSSProperties,

  sidePanelEmpty: {
    padding: `${MAP_SPACING.lg} ${MAP_SPACING.md}`,
    color: MAP_COLORS.textMuted,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  } satisfies React.CSSProperties,

  sidePanelStatusBand: {
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    background: MAP_COLORS.caveat,
    borderBottom: MAP_STROKES.hairlineSubtle,
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
    flexShrink: 0,
  } satisfies React.CSSProperties,

  temporalSelector: {
    position: "absolute",
    top: MAP_SPACING.md,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: MAP_Z_INDEX.temporalSelector,
    minWidth: "16.25rem",
    maxWidth: "22.5rem",
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    display: "flex",
    flexDirection: "column",
    gap: MAP_SPACING.xs,
    background: MAP_COLORS.bgPanel,
    backdropFilter: MAP_BLUR.overlay,
    WebkitBackdropFilter: MAP_BLUR.overlay,
    border: MAP_STROKES.hairlineSubtle,
    borderRadius: MAP_RADIUS.sm,
    boxShadow: MAP_SHADOWS.none,
  } satisfies React.CSSProperties,

  temporalLabel: {
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    color: MAP_COLORS.textMuted,
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
    textTransform: "uppercase",
  } satisfies React.CSSProperties,

  temporalSelect: {
    width: "100%",
    padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    background: MAP_COLORS.bg,
    color: MAP_COLORS.text,
    border: MAP_STROKES.hairlineSubtle,
    borderRadius: MAP_RADIUS.sm,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  } satisfies React.CSSProperties,

  temporalLayerName: {
    color: MAP_COLORS.text,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  } satisfies React.CSSProperties,

  temporalMeta: {
    color: MAP_COLORS.textMuted,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  } satisfies React.CSSProperties,

  symbologyPanel: {
    position: "absolute",
    top: MAP_SPACING.md,
    right: MAP_SPACING.md,
    width: MAP_DIMENSIONS.symbologyPanelWidth,
    maxWidth: `calc(100% - ${MAP_SPACING.xl})`,
    maxHeight: `calc(100% - ${MAP_SPACING.xl})`,
    display: "flex",
    flexDirection: "column",
    background: MAP_COLORS.bgPanel,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.glassDark,
    border: MAP_STROKES.hairlineStrong,
    borderRadius: MAP_RADIUS.sm,
    boxShadow: MAP_SHADOWS.none,
    overflow: "hidden",
    zIndex: MAP_Z_INDEX.symbologyPanel,
  } satisfies React.CSSProperties,

  symbologyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: MAP_SPACING.md,
    padding: `${MAP_SPACING.md} ${MAP_SPACING.md}`,
    borderBottom: MAP_STROKES.hairline,
    color: MAP_COLORS.text,
  } satisfies React.CSSProperties,

  symbologyEyebrow: {
    color: MAP_COLORS.textMuted,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: MAP_TYPOGRAPHY.letterSpacing.label,
  } satisfies React.CSSProperties,

  symbologyLayerName: {
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  } satisfies React.CSSProperties,

  symbologyCloseButton: {
    border: MAP_STROKES.hairline,
    background: MAP_COLORS.transparent,
    color: MAP_COLORS.textSecondary,
    width: "1.75rem",
    height: "1.75rem",
    borderRadius: MAP_RADIUS.sm,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } satisfies React.CSSProperties,

  symbologyModeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: MAP_SPACING.sm,
    padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.zero}`,
  } satisfies React.CSSProperties,

  symbologyModeButton: {
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.sm}`,
    borderRadius: MAP_RADIUS.sm,
    border: MAP_STROKES.hairline,
    background: MAP_COLORS.transparent,
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    cursor: "pointer",
  } satisfies React.CSSProperties,

  symbologyModeButtonActive: {
    border: `1px solid ${MAP_COLORS.focus}`,
    background: MAP_COLORS.selectedSubtle,
    color: MAP_COLORS.interaction,
  } satisfies React.CSSProperties,

  symbologyBody: {
    padding: MAP_SPACING.md,
    overflowY: "auto",
  } satisfies React.CSSProperties,

  symbologyLoading: {
    color: MAP_COLORS.textSecondary,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  } satisfies React.CSSProperties,

  symbologyError: {
    color: MAP_COLORS.error,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  } satisfies React.CSSProperties,
} as const;

/* ================================================================== */
/*  Status tokens — semantic layer readiness / QA state colours        */
/*  Every value resolves through MAP_COLORS — no bare hex allowed.     */
/* ================================================================== */

export type GisStatusKey =
  | "ready"
  | "caveat"
  | "unknown"
  | "demo"
  | "synthetic"
  | "generated"
  | "external"
  | "metadata-only"
  | "external-offline"
  | "stale"
  | "blocked"
  | "running";

export const MAP_STATUS_TOKENS: Record<
  GisStatusKey,
  { readonly text: string; readonly bg: string; readonly border: string }
> = {
  ready: {
    text: MAP_COLORS.success,
    bg: `color-mix(in srgb, ${MAP_COLORS.success} 12%, transparent)`,
    border: `color-mix(in srgb, ${MAP_COLORS.success} 28%, transparent)`,
  },
  caveat: {
    text: MAP_COLORS.caveatText,
    bg: MAP_COLORS.caveat,
    border: `color-mix(in srgb, ${MAP_COLORS.caveatText} 28%, transparent)`,
  },
  unknown: {
    text: MAP_COLORS.neutral,
    bg: MAP_COLORS.neutralSubtle,
    border: MAP_COLORS.hairlineSubtle,
  },
  demo: {
    text: MAP_COLORS.interaction,
    bg: MAP_COLORS.interactionSubtle,
    border: MAP_COLORS.dashed,
  },
  synthetic: {
    text: MAP_COLORS.textSecondary,
    bg: MAP_COLORS.neutralSubtle,
    border: MAP_COLORS.hairlineSubtle,
  },
  generated: {
    text: MAP_COLORS.interaction,
    bg: MAP_COLORS.interactionSubtle,
    border: MAP_COLORS.hairlineStrong,
  },
  external: {
    text: MAP_COLORS.caveatText,
    bg: `color-mix(in srgb, ${MAP_COLORS.caveatText} 10%, transparent)`,
    border: MAP_COLORS.hairlineStrong,
  },
  "metadata-only": {
    text: MAP_COLORS.neutral,
    bg: MAP_COLORS.neutralSubtle,
    border: MAP_COLORS.dashed,
  },
  "external-offline": {
    text: MAP_COLORS.error,
    bg: `color-mix(in srgb, ${MAP_COLORS.error} 12%, transparent)`,
    border: `color-mix(in srgb, ${MAP_COLORS.error} 28%, transparent)`,
  },
  stale: {
    text: MAP_COLORS.caveatText,
    bg: `color-mix(in srgb, ${MAP_COLORS.caveatText} 8%, transparent)`,
    border: `color-mix(in srgb, ${MAP_COLORS.caveatText} 20%, transparent)`,
  },
  blocked: {
    text: MAP_COLORS.error,
    bg: `color-mix(in srgb, ${MAP_COLORS.error} 12%, transparent)`,
    border: `color-mix(in srgb, ${MAP_COLORS.error} 28%, transparent)`,
  },
  running: {
    text: MAP_COLORS.interaction,
    bg: MAP_COLORS.interactionSubtle,
    border: MAP_COLORS.interactionSoft,
  },
} as const;

/* ================================================================== */
/*  Density presets — compact / comfortable row geometry               */
/* ================================================================== */

const MAP_COMFORTABLE_DENSITY = {
  rowHeight: "2rem",
  cellPadding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  gap: MAP_SPACING.sm,
  iconSize: MAP_ICON_SIZES.sm,
} as const;

export const MAP_DENSITY = {
  compact: {
    rowHeight: "1.625rem",
    cellPadding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    gap: MAP_SPACING.xs,
    iconSize: MAP_ICON_SIZES.xs,
  },
  comfortable: MAP_COMFORTABLE_DENSITY,
  default: MAP_COMFORTABLE_DENSITY,
} as const;

export type GisDensity = keyof typeof MAP_DENSITY;

/** Ordered list of all GIS status keys — safe to iterate in UI. */
export const GIS_STATUS_KEYS: readonly GisStatusKey[] = [
  "ready",
  "caveat",
  "unknown",
  "demo",
  "synthetic",
  "generated",
  "external",
  "metadata-only",
  "external-offline",
  "stale",
  "blocked",
  "running",
] as const;
