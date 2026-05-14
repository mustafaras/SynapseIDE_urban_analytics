import React from "react";
import type { MapExplorerMode } from "./mapTypes";
import { MAP_LAYER_PANEL_MAX_WIDTH, MAP_LAYER_PANEL_MIN_WIDTH } from "./mapDocking";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_NUMERIC,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

export interface MapWorkspaceShellProps {
  mode: MapExplorerMode;
  children: React.ReactNode;
  shellRef?: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
  labelledBy?: string;
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

function formatCssSize(value: number | string | undefined, fallback: string): string {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return value ?? fallback;
}

function clampPanelWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.max(minWidth, Math.min(maxWidth, width));
}

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
  minWidth: MAP_SPACING.zero,
  display: "grid",
  background: MAP_COLORS.bgPanel,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const bottomTimelineSlotStyle: React.CSSProperties = {
  ...mapStyles.bottomTimelineRegion,
  borderTop: MAP_STROKES.none,
};

const workspaceFocusCss = `
[data-map-explorer-shell="true"] :focus-visible {
  outline: 2px solid var(--syn-focus-ring, ${MAP_COLORS.amber}) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16) !important;
}
[data-map-explorer-shell="true"] [role="separator"]:focus-visible {
  background: rgba(245, 158, 11, 0.18) !important;
}
`;

function getPanelRailStyle(side: MapPanelRailSide, width: number | string | undefined, height: number | string | undefined): React.CSSProperties {
  if (side === "bottom") {
    return {
      ...panelRailBaseStyle,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      height: formatCssSize(height, "min(24rem, 52%)"),
      width: "auto",
      maxHeight: "min(30rem, 68%)",
      borderTop: MAP_STROKES.hairlineStrong,
      borderRight: MAP_STROKES.none,
    };
  }

  return {
    ...panelRailBaseStyle,
    top: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: formatCssSize(width, MAP_DIMENSIONS.layerPanelWidth),
    ...(side === "left"
      ? { left: MAP_SPACING.zero, borderRight: MAP_STROKES.hairlineSubtle }
      : { right: MAP_SPACING.zero, borderLeft: MAP_STROKES.hairlineSubtle }),
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
        style={isModal ? mapStyles.modal : mapStyles.embeddedSurface}
        ref={shellRef}
        className="MapWorkspaceShell__surface"
        data-map-explorer-shell="true"
        data-map-explorer-mode={mode}
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
