import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCcw, X } from "lucide-react";

import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { useDraggableMapPanel } from "./useDraggableMapPanel";
import { GisIconButton } from "./ui";

export interface MapDialogShellProps {
  ariaLabel: string;
  title: string;
  subtitle?: string;
  width?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  panelStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  headerActions?: React.ReactNode;
  maximizable?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const overlayBaseStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: MAP_Z_INDEX.dialog,
  display: "grid",
  placeItems: "center",
  padding: MAP_SPACING.lg,
  background: "rgba(0,0,0,0.56)",
};

const panelBaseStyle: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  minWidth: "min(22rem, calc(100% - 2rem))",
  minHeight: "14rem",
  maxWidth: "calc(100% - 2rem)",
  maxHeight: "var(--map-dialog-max-height, calc(100% - 2rem))",
  overflow: "hidden",
  resize: "both",
  borderRadius: MAP_RADIUS.md,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxShadow: MAP_SHADOWS.dropdown,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.lg}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: "color-mix(in srgb, var(--syn-surface-header, rgba(20,27,36,0.96)) 88%, transparent)",
};

const headingWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const subtitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: 1.4,
};

const actionsStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexShrink: 0,
};

const bodyBaseStyle: React.CSSProperties = {
  minHeight: 0,
  overflow: "auto",
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((node) => {
    const disabled = node.getAttribute("aria-disabled") === "true";
    const hidden = node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true";
    return !disabled && !hidden;
  });
}

export function MapDialogShell({
  ariaLabel,
  title,
  subtitle,
  width = "min(42rem, calc(100% - 2rem))",
  maxWidth = "calc(100% - 2rem)",
  maxHeight = "var(--map-dialog-max-height, calc(100% - 2rem))",
  panelStyle,
  bodyStyle,
  overlayStyle,
  headerActions,
  maximizable = true,
  onClose,
  children,
}: MapDialogShellProps): React.ReactElement {
  const { panelPositionStyle, resetPosition, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const firstFocusable = getFocusableElements(panel)[0];
    (firstFocusable ?? panel)?.focus({ preventScroll: true });

    return () => {
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  const handleDialogKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  const handleResetPosition = () => {
    setMaximized(false);
    resetPosition();
    panelRef.current?.focus({ preventScroll: true });
  };

  const handleToggleMaximized = () => {
    setMaximized((current) => {
      if (!current) {
        resetPosition();
      }
      return !current;
    });
  };

  const maximizedPanelStyle: React.CSSProperties = maximized
    ? {
        left: "50%",
        top: "50%",
        width: "calc(100% - 2rem)",
        height: "calc(100% - 2rem)",
        maxWidth: "calc(100% - 2rem)",
        maxHeight: "calc(100% - 2rem)",
        resize: "none",
      }
    : {};

  return (
    <div
      style={{ ...overlayBaseStyle, ...overlayStyle }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        data-draggable-map-panel="true"
        onKeyDown={handleDialogKeyDown}
        style={{
          ...panelBaseStyle,
          width,
          maxWidth,
          maxHeight,
          ...panelPositionStyle,
          ...panelStyle,
          ...maximizedPanelStyle,
          resize: maximized ? "none" : panelStyle?.resize ?? panelBaseStyle.resize,
        }}
      >
        <div {...dragHandleProps} style={{ ...headerStyle, ...(maximized ? { cursor: "default" } : dragHandleStyle) }}>
          <div style={headingWrapStyle}>
            <h2 style={titleStyle}>{title}</h2>
            {subtitle ? <span style={subtitleStyle}>{subtitle}</span> : null}
          </div>
          <div style={actionsStyle}>
            {headerActions}
            <GisIconButton
              label={`Center ${title}`}
              tooltip={`Center ${title}`}
              icon={<RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              onClick={handleResetPosition}
            />
            {maximizable ? (
              <GisIconButton
                label={maximized ? `Restore ${title}` : `Maximize ${title}`}
                tooltip={maximized ? `Restore ${title}` : `Maximize ${title}`}
                icon={maximized
                  ? <Minimize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                  : <Maximize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
                size="sm"
                onClick={handleToggleMaximized}
              />
            ) : null}
            <GisIconButton
              label={`Close ${title}`}
              tooltip={`Close ${title}`}
              icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              size="sm"
              onClick={onClose}
            />
          </div>
        </div>
        <div style={{ ...bodyBaseStyle, ...bodyStyle }}>{children}</div>
      </div>
    </div>
  );
}

export default MapDialogShell;
