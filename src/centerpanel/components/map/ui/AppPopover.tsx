import React from "react";
import { createPortal } from "react-dom";
import { MAP_Z_INDEX } from "../mapTokens";
import { getMapOverlayPortalRoot } from "./mapOverlayPortal";

export type AppPopoverPlacement = "bottom-start" | "bottom-end";

export interface AppPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  placement?: AppPopoverPlacement;
  offset?: number;
  minWidth?: number;
  maxWidth?: number | string;
  widthMode?: "content" | "anchor";
  role?: React.AriaRole;
  ariaLabel?: string;
  zIndex?: number;
  returnFocusOnClose?: boolean;
  style?: React.CSSProperties;
  testId?: string;
}

type PopoverPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

const VIEWPORT_PADDING = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const AppPopover: React.FC<AppPopoverProps> = ({
  open,
  anchorRef,
  onClose,
  children,
  placement = "bottom-start",
  offset = 6,
  minWidth,
  maxWidth,
  widthMode = "content",
  role = "menu",
  ariaLabel,
  zIndex = MAP_Z_INDEX.popover,
  returnFocusOnClose = true,
  style,
  testId,
}) => {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const [position, setPosition] = React.useState<PopoverPosition | null>(null);

  const updatePosition = React.useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const baseTop = anchorRect.bottom + offset;
    const canFlipTop = anchorRect.top - panelRect.height - offset >= VIEWPORT_PADDING;
    const overflowsBottom = baseTop + panelRect.height > viewportHeight - VIEWPORT_PADDING;
    const useTopPlacement = overflowsBottom && canFlipTop;

    const rawTop = useTopPlacement
      ? anchorRect.top - panelRect.height - offset
      : baseTop;

    const rawLeft = placement === "bottom-end"
      ? anchorRect.right - panelRect.width
      : anchorRect.left;

    const left = clamp(
      rawLeft,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, viewportWidth - panelRect.width - VIEWPORT_PADDING),
    );

    const top = clamp(
      rawTop,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, viewportHeight - panelRect.height - VIEWPORT_PADDING),
    );

    setPosition({
      top,
      left,
      placement: useTopPlacement ? "top" : "bottom",
    });
  }, [anchorRef, offset, placement]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    if (returnFocusOnClose) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    }

    const rafId = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(rafId);
  }, [open, returnFocusOnClose, updatePosition]);

  React.useEffect(() => {
    if (!open) {
      if (returnFocusOnClose) {
        const target = restoreFocusRef.current;
        if (target && document.contains(target)) {
          window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
        }
      }
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    const handleLayoutChange = (): void => {
      updatePosition();
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [anchorRef, onClose, open, returnFocusOnClose, updatePosition]);

  if (!open || typeof document === "undefined") return null;

  const portalRoot = getMapOverlayPortalRoot();
  if (!portalRoot) return null;

  const anchorWidth = anchorRef.current?.getBoundingClientRect().width ?? 0;
  const width = widthMode === "anchor"
    ? Math.max(minWidth ?? 0, Math.round(anchorWidth))
    : undefined;

  const panelStyle: React.CSSProperties = {
    display: "grid",
    gap: "0.375rem",
    padding: "0.625rem",
    borderRadius: "12px",
    border: "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.34))",
    background: "color-mix(in srgb, var(--syn-surface-panel, #111827) 98%, #05070d 2%)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 22px 56px rgba(0, 0, 0, 0.46)",
    color: "var(--syn-text-primary, #f4f7ff)",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
    pointerEvents: "auto",
  };

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-label={ariaLabel}
      data-popover-placement={position?.placement ?? "bottom"}
      data-testid={testId}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        zIndex,
        minWidth: minWidth != null ? `${minWidth}px` : undefined,
        maxWidth,
        width,
        ...style,
      }}
    >
      <div style={panelStyle}>{children}</div>
    </div>,
    portalRoot,
  );
};
