import React from "react";
import type { MapExplorerMode } from "./mapTypes";
import { MAP_LAYER_PANEL_MAX_WIDTH, MAP_LAYER_PANEL_MIN_WIDTH } from "./mapDocking";
import shellStyles from "./shell/MapPremiumShell.module.css";
import {
  createMapShellCssVars,
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_NUMERIC,
  MAP_RADIUS,
  MAP_SHELL_DIMENSIONS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import { getMapShellResponsiveMode } from "./shell";
import { GisIconButton } from "./ui/GisIconButton";

export interface MapWorkspaceShellProps {
  mode: MapExplorerMode;
  children: React.ReactNode;
  shellRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  onClose?: () => void;
  labelledBy?: string;
  activeActivityId?: string | null;
}

export type MapPanelRailSide = "left" | "right";

export interface MapPanelRailProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  side: MapPanelRailSide;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  onWidthChange?: (width: number) => void;
  ariaLabel: string;
}

export interface MapCanvasRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  minViewportHeight?: number | string;
}

export interface MapBottomTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  timelineSlot?: React.ReactNode;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  MapActivityRail — Prompt 36                                         */
/*  Slim vertical icon strip (VS Code activity bar).                   */
/*  Uses GisIconButton with the sidePanelRowActive inset accent.       */
/* ------------------------------------------------------------------ */

export interface MapActivityItem {
  id: string;
  label: string;
  ariaLabel?: string;
  tooltip?: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

export interface MapActivityRailProps {
  items: MapActivityItem[];
  bottomItems?: MapActivityItem[];
  "aria-label"?: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const activityRailStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
  padding: "4px 2px",
  width: MAP_SHELL_DIMENSIONS.activityRailWidth,
  minWidth: MAP_SHELL_DIMENSIONS.activityRailWidth,
  maxWidth: MAP_SHELL_DIMENSIONS.activityRailWidth,
  boxSizing: "border-box",
  background: MAP_COLORS.bgPanel,
  borderRight: MAP_STROKES.hairline,
  zIndex: MAP_Z_INDEX.sidebar,
  flexShrink: 0,
  overflow: "hidden",
};

const activityRailDividerStyle: React.CSSProperties = {
  width: "1.25rem",
  height: "1px",
  background: MAP_COLORS.hairlineSubtle,
  margin: `${MAP_SPACING.xs} auto`,
  flexShrink: 0,
};

function buildActivityButtonStyle(active: boolean): React.CSSProperties {
  return {
    /* Override default ghost to use the sidePanelRowActive inset accent */
    ...(active ? mapStyles.sidePanelRowActive : {}),
    ...(active
      ? {
          outline: `1px solid ${MAP_COLORS.hairlineStrong}`,
          outlineOffset: "-1px",
          boxShadow: `inset 3px 0 0 ${MAP_COLORS.interaction}, inset 0 0 0 1px ${MAP_COLORS.hairlineSubtle}`,
        }
      : {}),
    borderRadius: MAP_RADIUS.xs,
  };
}

function handleActivityRailKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
  const isForward = event.key === "ArrowDown" || event.key === "ArrowRight";
  const isBackward = event.key === "ArrowUp" || event.key === "ArrowLeft";
  const isBoundary = event.key === "Home" || event.key === "End";
  if (!isForward && !isBackward && !isBoundary) {
    return;
  }

  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-gis-icon-button="true"]:not(:disabled)'),
  );
  if (buttons.length === 0) {
    return;
  }

  const currentIndex = buttons.findIndex((button) => button === event.target);
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? buttons.length - 1
      : isForward
        ? (Math.max(currentIndex, 0) + 1) % buttons.length
        : (currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1);

  event.preventDefault();
  buttons[nextIndex]?.focus();
}

export const MapActivityRail: React.FC<MapActivityRailProps> = ({
  items,
  bottomItems,
  "aria-label": ariaLabel = "Workbench activity",
  style,
  "data-testid": testId,
}) => (
  <nav
    aria-label={ariaLabel}
    data-testid={testId ?? "map-activity-rail"}
    data-map-activity-rail="true"
    onKeyDown={handleActivityRailKeyDown}
    style={{ ...activityRailStyle, ...style }}
  >
    {items.map((item) => (
      <GisIconButton
        key={item.id}
        label={item.ariaLabel ?? item.label}
        tooltip={item.tooltip ?? item.label}
        icon={item.icon}
        active={item.active}
        size="rail"
        variant="rail"
        disabled={item.disabled}
        disabledReason={item.disabledReason}
        data-testid={`activity-btn-${item.id}`}
        data-map-activity-item={item.id}
        data-map-activity-label={item.label}
        data-map-activity-state={item.active ? "active" : "idle"}
        aria-current={item.active ? "page" : undefined}
        onClick={item.onClick}
        style={item.active ? buildActivityButtonStyle(true) : undefined}
      />
    ))}
    {bottomItems && bottomItems.length > 0 ? (
      <>
        <span aria-hidden style={{ flex: 1 }} />
        <span aria-hidden style={activityRailDividerStyle} />
        {bottomItems.map((item) => (
          <GisIconButton
            key={item.id}
            label={item.ariaLabel ?? item.label}
            tooltip={item.tooltip ?? item.label}
            icon={item.icon}
            active={item.active}
            size="rail"
            variant="rail"
            disabled={item.disabled}
            disabledReason={item.disabledReason}
            data-testid={`activity-btn-${item.id}`}
            data-map-activity-item={item.id}
            data-map-activity-label={item.label}
            data-map-activity-state={item.active ? "active" : "idle"}
            aria-current={item.active ? "page" : undefined}
            onClick={item.onClick}
            style={item.active ? buildActivityButtonStyle(true) : undefined}
          />
        ))}
      </>
    ) : null}
  </nav>
);

/* ------------------------------------------------------------------ */
/*  MapCommandBar — Prompt 36                                           */
/*  Slim top bar: breadcrumb title + trailing icon actions.            */
/* ------------------------------------------------------------------ */

export interface MapCommandBarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export interface MapCommandBarProps {
  title?: string;
  titleId?: string;
  breadcrumb?: string[];
  actions?: MapCommandBarAction[];
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const commandBarStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  height: "2.25rem",
  minHeight: "2.25rem",
  padding: `0 ${MAP_SPACING.md}`,
  background: MAP_COLORS.bgHeader,
  borderBottom: MAP_STROKES.hairline,
  flexShrink: 0,
  zIndex: MAP_Z_INDEX.sidebar,
  overflow: "hidden",
};

const commandBarTitleStyle: React.CSSProperties = {
  flex: 1,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.textSecondary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  letterSpacing: 0,
  margin: 0,
};

const breadcrumbSepStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  flexShrink: 0,
};

const commandBarActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexShrink: 0,
};

export const MapCommandBar: React.FC<MapCommandBarProps> = ({
  title,
  titleId,
  breadcrumb,
  actions,
  style,
  "data-testid": testId,
}) => {
  return (
    <div
      data-testid={testId ?? "map-command-bar"}
      data-map-command-bar="true"
      style={{ ...commandBarStyle, ...style }}
    >
      {breadcrumb && breadcrumb.length > 0 ? (
        <span style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.xs, flex: 1, minWidth: 0, overflow: "hidden" }}>
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb}>
              {i > 0 && <span aria-hidden style={breadcrumbSepStyle}>›</span>}
              <span
                style={{
                  ...commandBarTitleStyle,
                  flex: i === breadcrumb.length - 1 ? 1 : "none",
                  color: i === breadcrumb.length - 1 ? MAP_COLORS.text : MAP_COLORS.textMuted,
                }}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </span>
      ) : title ? (
        <p id={titleId} style={commandBarTitleStyle}>
          {title}
        </p>
      ) : (
        <span style={{ flex: 1 }} />
      )}

      {actions && actions.length > 0 ? (
        <div
          role="toolbar"
          aria-label="Command bar actions"
          style={commandBarActionsStyle}
        >
          {actions.map((action) => (
            <GisIconButton
              key={action.id}
              label={action.label}
              icon={action.icon}
              disabled={action.disabled}
              disabledReason={action.disabledReason}
              data-testid={`command-bar-action-${action.id}`}
              onClick={action.onClick}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

function formatCssSize(value: number | string | undefined, fallback: string): string {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return value ?? fallback;
}

function clampPanelWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

const MAP_CHROME_BORDER_SUBTLE = "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))";

const panelRailBaseStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: MAP_Z_INDEX.sidebar,
  display: "flex",
  flexDirection: "column",
  minWidth: MAP_SPACING.zero,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "visible",
};

const railResizeHandleBaseStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  width: "0.75rem",
  zIndex: MAP_Z_INDEX.sidebar + 1,
  cursor: "col-resize",
  touchAction: "none",
  background: MAP_COLORS.transparent,
};

const bottomTimelineShellStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "100%",
  maxWidth: "100%",
  minWidth: MAP_SPACING.zero,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_CHROME_BORDER_SUBTLE,
  overflow: "visible",
};

const bottomTimelineSlotStyle: React.CSSProperties = {
  ...mapStyles.bottomTimelineRegion,
  borderTop: MAP_STROKES.none,
  minWidth: MAP_SPACING.zero,
  overflow: "visible",
};

const mapExplorerA11yVars = {
  "--syn-text-muted": "#95a1af",
  "--syn-interaction-active": "#69b6ff",
  "--syn-interaction-focus-ring": "#69b6ff",
  "--syn-border-focus": "#69b6ff",
  "--syn-text-link": "#69b6ff",
} as React.CSSProperties;

const workspaceFocusCss = `
[data-map-explorer-shell="true"] :focus-visible {
  outline: 2px solid var(--syn-border-focus, var(--syn-interaction-focus-ring, #3794ff)) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 28%, transparent) !important;
}
[data-map-explorer-shell="true"] [data-gis-status-chip="true"],
[data-map-explorer-shell="true"] [data-gis-tab="true"],
[data-map-explorer-shell="true"] [data-gis-empty-state="true"] {
  min-width: 0;
  max-width: 100%;
}
[data-map-explorer-shell="true"] [data-gis-status-chip="true"] {
  box-sizing: border-box;
}
[data-map-explorer-shell="true"] [role="separator"] {
  border-inline: 1px solid transparent;
}
[data-map-explorer-shell="true"] [role="separator"]:hover,
[data-map-explorer-shell="true"] [role="separator"]:focus-visible {
  background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent) !important;
  border-inline-color: var(--syn-border-focus, #3794ff) !important;
}
/* Discoverable grip on the panel resize handle, mirroring the right dock. */
[data-map-explorer-shell="true"] [data-testid="map-panel-resize-handle"]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 26px;
  transform: translate(-50%, -50%);
  border-radius: 3px;
  background-image: radial-gradient(var(--syn-text-muted, #8993a3) 38%, transparent 42%);
  background-size: 3px 6px;
  background-repeat: repeat-y;
  opacity: 0;
  transition: opacity 140ms ease;
  pointer-events: none;
}
[data-map-explorer-shell="true"] [data-testid="map-panel-resize-handle"]:hover::after,
[data-map-explorer-shell="true"] [data-testid="map-panel-resize-handle"]:focus-visible::after {
  opacity: 0.85;
}
@media (prefers-reduced-motion: reduce) {
  [data-map-explorer-shell="true"] [data-testid="map-panel-resize-handle"]::after {
    transition: none;
  }
}
/* ---- Premium status bar interaction feedback ---- */
[data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment] {
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] button[data-map-status-segment]:hover,
[data-map-explorer-shell="true"] [data-map-status-bar="true"] a[data-map-status-segment]:hover {
  background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent) !important;
  color: var(--syn-text-default, #d7dce5) !important;
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] button[data-map-status-segment]:hover,
[data-map-explorer-shell="true"] [data-map-status-bar="true"] a[data-map-status-segment]:hover {
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--syn-interaction-active, #3794ff) 60%, transparent);
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] button[data-map-status-segment]:active {
  background: color-mix(in srgb, var(--syn-interaction-active, #3794ff) 18%, transparent) !important;
}
/* Attention tones carry a slim bottom signal instead of coloured frames. */
[data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment][data-map-status-tone="error"] {
  box-shadow: inset 0 -2px 0 var(--syn-status-error, #ef4444);
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment][data-map-status-tone="warning"] {
  box-shadow: inset 0 -2px 0 var(--syn-status-warning, #fbbf24);
}
/* Running work gets a live, breathing underline so async activity reads as live. */
@keyframes mapStatusRunningPulse {
  0%, 100% { box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--syn-status-running, #60a5fa) 45%, transparent); }
  50% { box-shadow: inset 0 -2px 0 var(--syn-status-running, #60a5fa); }
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment][data-map-status-tone="running"] {
  animation: mapStatusRunningPulse 1.6s ease-in-out infinite;
}
[data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment][data-map-status-tone="pending"] {
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--syn-status-pending, #a78bfa) 70%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  [data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment][data-map-status-tone="running"] {
    animation: none;
    box-shadow: inset 0 -2px 0 var(--syn-status-running, #60a5fa);
  }
  [data-map-explorer-shell="true"] [data-map-status-bar="true"] [data-map-status-segment] {
    transition: none;
  }
}

@media (forced-colors: active) {
  [data-map-explorer-shell="true"] :focus-visible {
    outline: 2px solid Highlight !important;
    box-shadow: none !important;
  }
  [data-map-explorer-shell="true"] [data-gis-status-chip="true"] {
    color: CanvasText !important;
    background: Canvas !important;
    border-color: CanvasText !important;
  }
  [data-map-explorer-shell="true"] [data-gis-icon-button="true"][aria-pressed="true"] {
    outline: 1px solid Highlight !important;
  }
  [data-map-explorer-shell="true"] [data-status="blocked"] {
    border-width: 2px !important;
  }
  [data-map-explorer-shell="true"] [data-status="demo"],
  [data-map-explorer-shell="true"] [data-status="synthetic"] {
    border-style: dashed !important;
  }
  [data-map-explorer-shell="true"] [data-map-workbench-sidebar="true"],
  [data-map-explorer-shell="true"] [data-map-panel-rail],
  [data-map-explorer-shell="true"] [data-testid="map-inspector-host"] {
    border-color: CanvasText !important;
  }
  [data-map-explorer-shell="true"] [data-gis-progress-bar="true"] > div {
    background: Highlight !important;
  }
}
`;

function getPanelRailStyle(side: MapPanelRailSide, width: number | string | undefined, _height: number | string | undefined): React.CSSProperties {
  return {
    ...panelRailBaseStyle,
    top: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: formatCssSize(width, MAP_DIMENSIONS.layerPanelWidth),
    ...(side === "left"
      ? { left: MAP_SPACING.zero, borderRight: MAP_CHROME_BORDER_SUBTLE }
      : { right: MAP_SPACING.zero, borderLeft: MAP_CHROME_BORDER_SUBTLE }),
  };
}

function getResizeHandleStyle(side: MapPanelRailSide): React.CSSProperties {
  return {
    ...railResizeHandleBaseStyle,
    ...(side === "left" ? { right: "-0.3125rem" } : { left: "-0.3125rem" }),
  };
}

export const MapWorkspaceShell: React.FC<MapWorkspaceShellProps> = ({
  mode,
  children,
  shellRef,
  className,
  onClose,
  labelledBy = "map-explorer-title",
  activeActivityId = null,
}) => {
  const isModal = mode === "modal" || mode === "presentation";
  const [shellViewportWidth, setShellViewportWidth] = React.useState<number>(() => (typeof window === "undefined" ? 1440 : window.innerWidth));
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = (): void => {
      setShellViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shellViewportMode = getMapShellResponsiveMode(shellViewportWidth);

  React.useEffect(() => {
    if (!isModal || !rootRef.current) {
      return undefined;
    }

    const root = rootRef.current;
    // The modal portals to <body> and uses a position:fixed overlay covering the
    // entire viewport (mapStyles.overlay). That overlay already blocks pointer
    // interaction with the page behind it, so we MUST NOT also flip
    // pointer-events on body siblings — doing so disables sibling portals that
    // legitimately belong to the modal subtree (tooltips, popovers, and maplibre
    // child portals) and locks every interaction inside the map.
    //
    // We only need aria-hidden on body siblings for assistive tech, and we walk
    // up to find the body-level ancestor that CONTAINS this modal so we can
    // exclude it from being marked aria-hidden along with the rest of the page.
    let selfBranch: Element | null = root;
    while (selfBranch && selfBranch.parentElement && selfBranch.parentElement !== document.body) {
      selfBranch = selfBranch.parentElement;
    }
    const siblings = Array.from(document.body.children).filter(
      (element) =>
        element !== root &&
        element !== selfBranch &&
        element.getAttribute("data-map-overlay-root") !== "true",
    );
    const previousValues = siblings.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    for (const element of siblings) {
      element.setAttribute("aria-hidden", "true");
    }

    return () => {
      for (const { element, ariaHidden } of previousValues) {
        if (ariaHidden == null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      }
    };
  }, [isModal]);

  return (
    // Keep the backdrop passive: closing via explicit controls/Escape avoids
    // accidental modal exits when dock interactions miss hit targets.
    <div
      style={isModal ? mapStyles.overlay : mapStyles.embeddedShell}
      className={["MapWorkspaceShell", shellStyles.mapPremiumShellRoot, className].filter(Boolean).join(" ")}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={labelledBy}
      ref={rootRef}
      data-map-workspace-shell={isModal ? "modal" : "embedded"}
    >
      <div
        style={{
          ...(isModal ? mapStyles.modal : mapStyles.embeddedSurface),
          ...createMapShellCssVars(),
          ...mapExplorerA11yVars,
          display: "grid",
          gridTemplateRows: "var(--map-menu-h, 4.875rem) minmax(0, 1fr) var(--map-status-h, 1.75rem)",
        }}
        ref={shellRef}
        className={["MapWorkspaceShell__surface", shellStyles.mapPremiumShellSurface].join(" ")}
        data-map-explorer-shell="true"
        data-ui-proof="real-map-explorer"
        data-map-explorer-mode={mode}
        data-map-active-activity={activeActivityId ?? undefined}
        data-map-shell-viewport-mode={shellViewportMode}
      >
        <style>{workspaceFocusCss}</style>
        {children}
      </div>
    </div>
  );
};

export const MapPanelRail = React.forwardRef<HTMLDivElement, MapPanelRailProps>(({
  side,
  children,
  width,
  height,
  minWidth = MAP_LAYER_PANEL_MIN_WIDTH,
  maxWidth = MAP_LAYER_PANEL_MAX_WIDTH,
  resizable = false,
  onWidthChange,
  ariaLabel,
  style,
  className,
  ...props
}, ref) => {
  const handlePointerDown = React.useCallback<React.PointerEventHandler<HTMLDivElement>>((event) => {
    if (!resizable || !onWidthChange) {
      return;
    }

    const railElement = event.currentTarget.parentElement;
    const startWidth = railElement?.getBoundingClientRect().width ?? (typeof width === "number" ? width : MAP_NUMERIC.layerPanelWidth);
    const startX = event.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = side === "left" ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      onWidthChange(clampPanelWidth(Math.round(startWidth + delta), minWidth, maxWidth));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, [maxWidth, minWidth, onWidthChange, resizable, side, width]);

  const handleResizeKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
    if (!resizable || !onWidthChange) {
      return;
    }

    const currentWidth = typeof width === "number" ? width : MAP_NUMERIC.layerPanelWidth;
    const step = event.shiftKey ? 32 : 12;
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") {
      nextWidth = side === "left" ? currentWidth - step : currentWidth + step;
    } else if (event.key === "ArrowRight") {
      nextWidth = side === "left" ? currentWidth + step : currentWidth - step;
    } else if (event.key === "Home") {
      nextWidth = minWidth;
    } else if (event.key === "End") {
      nextWidth = maxWidth;
    }

    if (nextWidth == null) {
      return;
    }

    event.preventDefault();
    onWidthChange(clampPanelWidth(nextWidth, minWidth, maxWidth));
  }, [maxWidth, minWidth, onWidthChange, resizable, side, width]);

  return (
    <aside
      {...props}
      ref={ref}
      role="region"
      aria-label={ariaLabel}
      className={["MapPanelRail", `MapPanelRail--${side}`, className].filter(Boolean).join(" ")}
      data-map-panel-rail={side}
      style={{
        ...getPanelRailStyle(side, width, height),
        "--map-layer-panel-width": formatCssSize(width, MAP_DIMENSIONS.layerPanelWidth),
        ...style,
      } as React.CSSProperties}
    >
      {children}
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${ariaLabel.toLowerCase()}`}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={typeof width === "number" ? width : MAP_NUMERIC.layerPanelWidth}
          aria-valuetext={`${typeof width === "number" ? width : MAP_NUMERIC.layerPanelWidth} pixels`}
          tabIndex={0}
          style={getResizeHandleStyle(side)}
          onPointerDown={handlePointerDown}
          onKeyDown={handleResizeKeyDown}
          data-testid="map-panel-resize-handle"
          title={`Drag or use arrow keys to resize ${ariaLabel.toLowerCase()}`}
        />
      ) : null}
    </aside>
  );
});
MapPanelRail.displayName = "MapPanelRail";

export const MapCanvasRegion = React.forwardRef<HTMLDivElement, MapCanvasRegionProps>(({
  children,
  minViewportHeight = "min(36rem, calc(100vh - 7rem))",
  style,
  className,
  ...props
}, ref) => {
  return (
    <div
      {...props}
      ref={ref}
      className={["MapCanvasRegion", className].filter(Boolean).join(" ")}
      data-map-canvas-region="true"
      data-map-min-viewport-height={typeof minViewportHeight === "number" ? `${minViewportHeight}px` : minViewportHeight}
      style={{
        ...mapStyles.mapContainer,
        minHeight: minViewportHeight,
        minBlockSize: minViewportHeight,
        background: MAP_COLORS.bgWorkspace,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
});
MapCanvasRegion.displayName = "MapCanvasRegion";

export const MapBottomTimeline: React.FC<MapBottomTimelineProps> = ({
  timelineSlot,
  children,
  style,
  className,
  ...props
}) => (
  <div
    {...props}
    className={["MapBottomTimeline", className].filter(Boolean).join(" ")}
    data-map-bottom-timeline="true"
    style={{ ...bottomTimelineShellStyle, ...style }}
  >
    {timelineSlot ? (
      <div style={bottomTimelineSlotStyle} data-map-slot="bottom-timeline">
        {timelineSlot}
      </div>
    ) : null}
    {children}
  </div>
);
