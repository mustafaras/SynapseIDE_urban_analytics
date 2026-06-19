import React, { useCallback, useEffect, useId, useRef, useState } from "react";
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
import { useMapDialogLayoutStore } from "../../../stores/useMapDialogLayoutStore";
import { GisIconButton } from "./ui";
import { useFocusTrap } from "@/hooks/useFocusTrap";

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
  /** Pinned footer (e.g. primary/secondary actions) below the scrolling body. */
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
  maximizable?: boolean;
  /** When set, drag position + resized size persist durably across sessions. */
  memoryKey?: string;
  /**
   * Non-modal mode: the backdrop does not capture pointer events (the map
   * stays interactive for drawing/measuring), clicking "outside" does NOT
   * close the dialog, and Tab focus is not trapped. The dialog still opens
   * focused and closes on Escape / the close button.
   */
  nonBlocking?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const overlayBaseStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: MAP_Z_INDEX.dialog,
  display: "grid",
  placeItems: "center",
  padding: "clamp(0.75rem, 2vw, 1.5rem)",
  background: "rgba(0,0,0,0.56)",
};

const panelBaseStyle: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  minWidth: "var(--map-dialog-min-w, min(24rem, calc(100% - 2rem)))",
  minHeight: "var(--map-dialog-min-h, min(18rem, calc(100% - 2rem)))",
  maxWidth: "calc(100% - 2rem)",
  maxHeight: "var(--map-dialog-max-height, calc(100% - 2rem))",
  overflow: "hidden",
  resize: "both",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxShadow: MAP_SHADOWS.dropdown,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  outline: "none",
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
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto",
  overscrollBehavior: "contain",
};

const footerBaseStyle: React.CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.lg}`,
  borderTop: MAP_STROKES.hairlineSubtle,
  background: "color-mix(in srgb, var(--syn-surface-header, rgba(20,27,36,0.96)) 88%, transparent)",
};

function clampRememberedDimension(value: number, axis: "width" | "height"): number {
  if (typeof window === "undefined") return value;
  const viewport = axis === "width" ? window.innerWidth : window.innerHeight;
  return Math.max(0, Math.min(value, viewport - 32));
}

export function MapDialogShell({
  ariaLabel,
  title,
  subtitle,
  width = "var(--map-dialog-w, min(42rem, calc(100% - 2rem)))",
  maxWidth = "calc(100% - 2rem)",
  maxHeight = "var(--map-dialog-max-height, calc(100% - 2rem))",
  panelStyle,
  bodyStyle,
  overlayStyle,
  headerActions,
  footer,
  footerStyle,
  maximizable = true,
  memoryKey,
  nonBlocking = false,
  onClose,
  children,
}: MapDialogShellProps): React.ReactElement {
  const { panelPositionStyle, resetPosition, dragHandleProps, dragHandleStyle } = useDraggableMapPanel(
    memoryKey ? { memoryKey, boundsPadding: 16 } : { boundsPadding: 16 },
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Accessible name (MFP-14): prefer the visible <h2> heading via aria-labelledby; fall
  // back to aria-label only when no title is provided so no dialog ends up unnamed.
  const titleId = useId();
  // Shared focus trap (MFP-13): document-level Tab trap + restore-to-opener. Skipped
  // when nonBlocking (the panel coexists with the page). Merge its ref onto panelRef.
  const { trapRef, activate } = useFocusTrap(!nonBlocking);
  const setPanelRef = useCallback((el: HTMLDivElement | null) => {
    panelRef.current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [trapRef]);
  const [maximized, setMaximized] = useState(false);
  const persistedSize = useMapDialogLayoutStore((state) => (memoryKey ? state.geometry[memoryKey] ?? null : null));
  const persistSize = useMapDialogLayoutStore((state) => state.setSize);
  const rememberedSize = persistedSize && persistedSize.width != null && persistedSize.height != null
    ? {
        width: clampRememberedDimension(persistedSize.width, "width"),
        height: clampRememberedDimension(persistedSize.height, "height"),
      }
    : null;

  // Persist user resize (native CSS resize) so size survives reopen/reload.
  useEffect(() => {
    if (!memoryKey || maximized) return undefined;
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return undefined;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (panel.offsetWidth > 0 && panel.offsetHeight > 0) {
          persistSize(memoryKey, panel.offsetWidth, panel.offsetHeight);
        }
      });
    });
    observer.observe(panel);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, [memoryKey, maximized, persistSize]);

  useEffect(() => {
    if (maximized || typeof window === "undefined") return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const outsideViewport =
      rect.left < 8 ||
      rect.top < 8 ||
      rect.right > window.innerWidth - 8 ||
      rect.bottom > window.innerHeight - 8;
    if (outsideViewport) {
      resetPosition();
    }
  }, [maximized, rememberedSize?.height, rememberedSize?.width, resetPosition]);

  // Move initial focus into the dialog on open (the hook restores it on close).
  useEffect(() => {
    if (!nonBlocking) activate();
  }, [nonBlocking, activate]);

  const handleDialogKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    // Escape closes; the Tab trap is owned by useFocusTrap.
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
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
      style={{
        ...overlayBaseStyle,
        ...overlayStyle,
        // Non-modal: let the map underneath stay interactive (draw/pan/zoom)
        // and drop the dimming backdrop so the canvas reads clearly.
        ...(nonBlocking ? { pointerEvents: "none", background: "transparent" } : {}),
      }}
      onClick={
        nonBlocking
          ? undefined
          : (event) => {
              if (event.target === event.currentTarget) onClose();
            }
      }
    >
      <div
        ref={setPanelRef}
        role="dialog"
        aria-modal={nonBlocking ? false : true}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        data-draggable-map-panel="true"
        data-ui-proof="real-modal-system"
        data-map-dialog-shell="true"
        data-map-dialog-state={maximized ? "maximized" : "floating"}
        onKeyDown={handleDialogKeyDown}
        style={{
          ...panelBaseStyle,
          width: rememberedSize && !maximized ? `${rememberedSize.width}px` : width,
          height: rememberedSize && !maximized ? `${rememberedSize.height}px` : undefined,
          maxWidth,
          maxHeight,
          ...panelPositionStyle,
          ...panelStyle,
          ...maximizedPanelStyle,
          resize: maximized ? "none" : panelStyle?.resize ?? panelBaseStyle.resize,
          // Re-enable interaction on the panel when the overlay is click-through.
          ...(nonBlocking ? { pointerEvents: "auto" } : {}),
        }}
      >
        <div {...dragHandleProps} style={{ ...headerStyle, ...(maximized ? { cursor: "default" } : dragHandleStyle) }}>
          <div style={headingWrapStyle}>
            <h2 id={titleId} style={titleStyle}>{title}</h2>
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
        {footer ? <div style={{ ...footerBaseStyle, ...footerStyle }}>{footer}</div> : null}
      </div>
    </div>
  );
}

export default MapDialogShell;
