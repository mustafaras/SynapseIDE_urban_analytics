import React from "react";
import type { MapExplorerMode } from "./mapTypes";
import { MAP_LAYER_PANEL_MAX_WIDTH, MAP_LAYER_PANEL_MIN_WIDTH } from "./mapDocking";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_NUMERIC,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";
import { GisIconButton } from "./ui/GisIconButton";

export interface MapWorkspaceShellProps {
  mode: MapExplorerMode;
  children: React.ReactNode;
  shellRef?: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
  labelledBy?: string;
  activeActivityId?: string | null;
}

export type MapPanelRailSide = "left" | "right" | "bottom";

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
  width: "2.625rem",
  minWidth: "2.625rem",
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
    borderRadius: MAP_RADIUS.sm,
    width: "2rem",
    height: "2rem",
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
        label={item.label}
        icon={item.icon}
        active={item.active}
        disabled={item.disabled}
        disabledReason={item.disabledReason}
        data-testid={`activity-btn-${item.id}`}
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
            label={item.label}
            icon={item.icon}
            active={item.active}
            disabled={item.disabled}
            disabledReason={item.disabledReason}
            data-testid={`activity-btn-${item.id}`}
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
const MAP_CHROME_BORDER_STRONG = "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.48))";

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
  width: "0.625rem",
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
  overflow: "hidden",
};

const bottomTimelineSlotStyle: React.CSSProperties = {
  ...mapStyles.bottomTimelineRegion,
  borderTop: MAP_STROKES.none,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
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
  [data-map-explorer-shell="true"] [data-testid="map-inspector-host"],
  [data-map-explorer-shell="true"] [data-testid="map-bottom-panel"] {
    border-color: CanvasText !important;
  }
  [data-map-explorer-shell="true"] [data-gis-progress-bar="true"] > div {
    background: Highlight !important;
  }
}
`;

function getPanelRailStyle(side: MapPanelRailSide, width: number | string | undefined, height: number | string | undefined): React.CSSProperties {
  if (side === "bottom") {
    return {
      ...panelRailBaseStyle,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      height: formatCssSize(height, MAP_PANEL_SIZES.bottomPanelHeight),
      width: "auto",
      maxHeight: MAP_PANEL_SIZES.bottomPanelMaxHeight,
      borderTop: MAP_CHROME_BORDER_STRONG,
      borderRight: MAP_STROKES.none,
    };
  }

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
  onClose,
  labelledBy = "map-explorer-title",
  activeActivityId = null,
}) => {
  const isModal = mode === "modal" || mode === "presentation";
  const rootRef = React.useRef<HTMLDivElement | null>(null);

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
      (element) => element !== root && element !== selfBranch,
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop click closes modal; Escape is handled by the caller.
    <div
      style={isModal ? mapStyles.overlay : mapStyles.embeddedShell}
      onClick={(event) => {
        if (isModal && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={labelledBy}
      ref={rootRef}
      className="MapWorkspaceShell"
      data-map-workspace-shell={isModal ? "modal" : "embedded"}
    >
      <div
        style={{
          ...(isModal ? mapStyles.modal : mapStyles.embeddedSurface),
          ...mapExplorerA11yVars,
        }}
        ref={shellRef}
        className="MapWorkspaceShell__surface"
        data-map-explorer-shell="true"
        data-map-explorer-mode={mode}
        data-map-active-activity={activeActivityId ?? undefined}
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
    if (!resizable || side === "bottom" || !onWidthChange) {
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
    if (!resizable || side === "bottom" || !onWidthChange) {
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
      {resizable && side !== "bottom" ? (
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
