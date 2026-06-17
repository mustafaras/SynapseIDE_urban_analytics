import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMapDialogLayoutStore } from "../../../stores/useMapDialogLayoutStore";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_Z_INDEX,
} from "./mapTokens";

export interface DraggableMapPanelBindings {
  panelPositionStyle: React.CSSProperties;
  resetPosition: () => void;
  dragHandleProps: {
    onPointerDown: React.PointerEventHandler<HTMLElement>;
    onDoubleClick: React.MouseEventHandler<HTMLElement>;
    title: string;
  };
  dragHandleStyle: React.CSSProperties;
}

export interface DraggableMapPanelOptions {
  boundsPadding?: number;
  /** Choose drag bounds source. "container" keeps panel inside offset parent; "viewport" uses window bounds. */
  dragBounds?: "container" | "viewport";
  /** When set, drag offset is remembered durably (Zustand persist). */
  memoryKey?: string;
  /** Optional controlled offset. When provided, this value is used as the drag source of truth. */
  offset?: { x: number; y: number };
  /** Receives the clamped offset during drag and on drag end. */
  onOffsetChange?: (offset: { x: number; y: number }) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createOpaqueFloatingPanelStyle(
  width: number | string,
  zIndex = MAP_Z_INDEX.dropdown + 8,
): React.CSSProperties {
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    right: "auto",
    bottom: "auto",
    width,
    maxWidth: `calc(100% - ${MAP_SPACING.xl})`,
    maxHeight: `calc(100% - ${MAP_SPACING.xl})`,
    display: "flex",
    flexDirection: "column",
    background: MAP_COLORS.bgPanel,
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    border: MAP_STROKES.hairlineStrong,
    borderRadius: MAP_RADIUS.md,
    boxShadow: MAP_SHADOWS.dropdown,
    overflow: "hidden",
    zIndex,
  };
}

export function useDraggableMapPanel(options: DraggableMapPanelOptions = {}): DraggableMapPanelBindings {
  const { memoryKey, offset: controlledOffset, onOffsetChange } = options;
  const persistedGeometry = useMapDialogLayoutStore((state) => (memoryKey ? state.geometry[memoryKey] ?? null : null));
  const persistOffset = useMapDialogLayoutStore((state) => state.setOffset);
  const resetGeometry = useMapDialogLayoutStore((state) => state.resetGeometry);
  const [offsetState, setOffsetState] = useState(() =>
    persistedGeometry ? { x: persistedGeometry.offsetX, y: persistedGeometry.offsetY } : { x: 0, y: 0 },
  );
  const offset = controlledOffset ?? offsetState;
  const lastEmittedOffsetRef = useRef(offset);
  const boundsPadding = options.boundsPadding ?? 12;
  const dragBounds = options.dragBounds ?? "container";

  useEffect(() => {
    lastEmittedOffsetRef.current = offset;
  }, [offset]);

  const commitOffset = useCallback(
    (next: { x: number; y: number }) => {
      onOffsetChange?.(next);
      if (memoryKey) persistOffset(memoryKey, next.x, next.y);
    },
    [memoryKey, onOffsetChange, persistOffset],
  );

  const setOffset = useCallback((next: { x: number; y: number } | ((current: { x: number; y: number }) => { x: number; y: number })) => {
    if (typeof next === "function") {
      const resolver = next as (current: { x: number; y: number }) => { x: number; y: number };
      const resolved = resolver(controlledOffset ?? offsetState);
      if (controlledOffset == null) {
        setOffsetState(resolved);
      }
      lastEmittedOffsetRef.current = resolved;
      onOffsetChange?.(resolved);
      return;
    }
    if (controlledOffset == null) {
      setOffsetState(next);
    }
    lastEmittedOffsetRef.current = next;
    onOffsetChange?.(next);
  }, [controlledOffset, offsetState, onOffsetChange]);

  const handlePointerDown = useCallback<React.PointerEventHandler<HTMLElement>>((event) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("button,input,select,textarea,a,[data-no-panel-drag='true']")) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = offset;
    const panelElement = event.currentTarget.closest("[data-draggable-map-panel='true']") as HTMLElement | null
      ?? event.currentTarget.parentElement;

    // Measure the panel once at drag start. We work entirely in viewport
    // coordinates and derive the panel's geometry from its real rendered rect,
    // so the clamp is correct regardless of how the panel is positioned
    // (fixed, absolute, transformed ancestor, etc.).
    const startRect = panelElement?.getBoundingClientRect() ?? null;

    // The bounding box (viewport coords) the panel centre must stay inside.
    const resolveBounds = (): { left: number; top: number; right: number; bottom: number } => {
      if (dragBounds === "container" && panelElement) {
        const container = panelElement.offsetParent instanceof HTMLElement ? panelElement.offsetParent : null;
        const rect = container?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        }
      }
      return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    };

    const bounds = typeof window === "undefined" ? null : resolveBounds();

    // rendered centre = base centre + applied offset  →  base = measured centre − startOffset.
    const baseCentreX = startRect ? startRect.left + startRect.width / 2 - startOffset.x : 0;
    const baseCentreY = startRect ? startRect.top + startRect.height / 2 - startOffset.y : 0;

    const clampOffset = (candidate: { x: number; y: number }): { x: number; y: number } => {
      if (!startRect || !bounds || startRect.width <= 0 || startRect.height <= 0) {
        return candidate;
      }
      const halfWidth = startRect.width / 2;
      const halfHeight = startRect.height / 2;
      const centreX = baseCentreX + candidate.x;
      const centreY = baseCentreY + candidate.y;
      const minCentreX = bounds.left + boundsPadding + halfWidth;
      const maxCentreX = bounds.right - boundsPadding - halfWidth;
      const minCentreY = bounds.top + boundsPadding + halfHeight;
      const maxCentreY = bounds.bottom - boundsPadding - halfHeight;
      const clampedCentreX = clamp(centreX, minCentreX, Math.max(minCentreX, maxCentreX));
      const clampedCentreY = clamp(centreY, minCentreY, Math.max(minCentreY, maxCentreY));
      return {
        x: clampedCentreX - baseCentreX,
        y: clampedCentreY - baseCentreY,
      };
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setOffset(clampOffset({
        x: startOffset.x + moveEvent.clientX - startX,
        y: startOffset.y + moveEvent.clientY - startY,
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      commitOffset(lastEmittedOffsetRef.current);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.preventDefault();
  }, [boundsPadding, commitOffset, dragBounds, offset, setOffset]);

  const resetPosition = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    if (memoryKey) resetGeometry(memoryKey);
  }, [memoryKey, resetGeometry]);

  return {
    panelPositionStyle: {
      left: `calc(50% + ${offset.x}px)`,
      top: `calc(50% + ${offset.y}px)`,
      transform: "translate(-50%, -50%)",
    },
    resetPosition,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onDoubleClick: resetPosition,
      title: "Drag panel. Double-click to center.",
    },
    dragHandleStyle: {
      cursor: "grab",
      touchAction: "none",
      userSelect: "none",
    },
  };
}
