import React, { useCallback, useState } from "react";
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
  dragHandleProps: {
    onPointerDown: React.PointerEventHandler<HTMLElement>;
    onDoubleClick: React.MouseEventHandler<HTMLElement>;
    title: string;
  };
  dragHandleStyle: React.CSSProperties;
}

export interface DraggableMapPanelOptions {
  boundsPadding?: number;
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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const boundsPadding = options.boundsPadding ?? 12;

  const clampOffsetToViewport = useCallback((nextOffset: { x: number; y: number }, panelElement: HTMLElement | null) => {
    if (typeof window === "undefined" || !panelElement) {
      return nextOffset;
    }

    const panelWidth = panelElement.offsetWidth;
    const panelHeight = panelElement.offsetHeight;
    if (panelWidth <= 0 || panelHeight <= 0) {
      return nextOffset;
    }

    const nextLeft = window.innerWidth / 2 + nextOffset.x - panelWidth / 2;
    const nextTop = window.innerHeight / 2 + nextOffset.y - panelHeight / 2;
    const maxLeft = Math.max(boundsPadding, window.innerWidth - panelWidth - boundsPadding);
    const maxTop = Math.max(boundsPadding, window.innerHeight - panelHeight - boundsPadding);
    const clampedLeft = clamp(nextLeft, boundsPadding, maxLeft);
    const clampedTop = clamp(nextTop, boundsPadding, maxTop);

    return {
      x: clampedLeft + panelWidth / 2 - window.innerWidth / 2,
      y: clampedTop + panelHeight / 2 - window.innerHeight / 2,
    };
  }, [boundsPadding]);

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

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setOffset(clampOffsetToViewport({
        x: startOffset.x + moveEvent.clientX - startX,
        y: startOffset.y + moveEvent.clientY - startY,
      }, panelElement));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.preventDefault();
  }, [clampOffsetToViewport, offset]);

  return {
    panelPositionStyle: {
      left: `calc(50% + ${offset.x}px)`,
      top: `calc(50% + ${offset.y}px)`,
      transform: "translate(-50%, -50%)",
    },
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onDoubleClick: () => setOffset({ x: 0, y: 0 }),
      title: "Drag panel. Double-click to center.",
    },
    dragHandleStyle: {
      cursor: "grab",
      touchAction: "none",
      userSelect: "none",
    },
  };
}
