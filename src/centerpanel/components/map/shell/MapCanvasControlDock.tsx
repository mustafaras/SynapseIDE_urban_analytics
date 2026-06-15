import React from "react";
import { GripHorizontal, X } from "lucide-react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";

export interface MapCanvasControlDockProps {
  primary: React.ReactNode;
  contextual?: React.ReactNode;
  chips?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

const dockStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  width: "min(var(--map-canvas-control-dock-width, 58rem), calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  maxWidth: "calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem)",
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: 0,
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12, 16, 24, 0.96)) 92%, transparent)",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  pointerEvents: "auto",
  zIndex: MAP_Z_INDEX.mapFurniture,
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "thin",
};

const rowStyle: React.CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: "0.1875rem",
  flexShrink: 0,
};

const contextualStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  paddingLeft: MAP_SPACING.sm,
  borderLeft: MAP_STROKES.hairlineSubtle,
  flexShrink: 1,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  minHeight: "2rem",
  padding: `0 ${MAP_SPACING.sm} 0 0`,
  borderRight: MAP_STROKES.hairlineSubtle,
  cursor: "grab",
  userSelect: "none",
  touchAction: "none",
  flexShrink: 0,
};

const titleStackStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const subtitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const headerSeparatorStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
};

const headerActionsStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
  flexShrink: 0,
};

const chromeButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.5rem",
  height: "1.5rem",
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const MapCanvasControlDock: React.FC<MapCanvasControlDockProps> = ({
  primary,
  contextual,
  chips,
  ariaLabel = "Map canvas control dock",
  testId = "map-canvas-control-dock",
  style,
  draggable = false,
  title,
  subtitle,
  onClose,
}) => {
  const dockRef = React.useRef<HTMLElement | null>(null);
  const [dragPosition, setDragPosition] = React.useState<{ left: number; top: number } | null>(null);
  const hasHeader = draggable || title != null || subtitle != null || onClose != null;
  const titleId = React.useId();

  const handleHeaderPointerDown = React.useCallback<React.PointerEventHandler<HTMLDivElement>>((event) => {
    if (!draggable || event.button !== 0) {
      return;
    }

    const node = dockRef.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 8;

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      const nextLeft = startLeft + moveEvent.clientX - startX;
      const nextTop = startTop + moveEvent.clientY - startY;
      setDragPosition({
        left: clamp(nextLeft, gutter, Math.max(gutter, viewportWidth - rect.width - gutter)),
        top: clamp(nextTop, gutter, Math.max(gutter, viewportHeight - rect.height - gutter)),
      });
    };

    const handlePointerUp = (): void => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, [draggable]);

  return (
    <aside
      ref={dockRef}
      style={{
        ...dockStyle,
        ...(dragPosition
          ? { left: dragPosition.left, top: dragPosition.top, right: "auto" }
          : null),
        ...style,
      }}
      id={testId}
      role={draggable ? "dialog" : "region"}
      aria-modal={draggable ? false : undefined}
      aria-label={ariaLabel}
      aria-labelledby={hasHeader ? titleId : undefined}
      data-testid={testId}
      data-map-canvas-control-dock="true"
      data-map-safe-inset-consumer="control-dock"
      data-draggable={draggable ? "true" : undefined}
    >
      {hasHeader ? (
        <div
          style={headerStyle}
          onPointerDown={handleHeaderPointerDown}
          data-testid="map-canvas-control-dock-drag-handle"
          title={draggable ? "Drag view controls" : undefined}
        >
          <span style={titleStackStyle}>
            <span id={titleId} style={titleStyle}>{title ?? "View controls"}</span>
            {subtitle ? (
              <>
                <span aria-hidden="true" style={headerSeparatorStyle}>/</span>
                <span style={subtitleStyle}>{subtitle}</span>
              </>
            ) : null}
          </span>
          <span style={headerActionsStyle}>
            {draggable ? <GripHorizontal size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" /> : null}
            {onClose ? (
              <button
                type="button"
                style={chromeButtonStyle}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={onClose}
                aria-label="Close view controls"
                title="Close view controls"
                data-testid="map-canvas-control-dock-close"
              >
                <X size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
      <div style={rowStyle} data-map-canvas-dock-primary="true">
        {primary}
      </div>
      {chips ? (
        <div style={rowStyle} data-map-canvas-dock-chips="true">
          {chips}
        </div>
      ) : null}
      {contextual ? (
        <div style={contextualStyle} data-map-canvas-dock-contextual="true">
          {contextual}
        </div>
      ) : null}
    </aside>
  );
};

export default MapCanvasControlDock;
