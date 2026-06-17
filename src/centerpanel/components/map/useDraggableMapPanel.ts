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
      commitOffset(lastEmittedOffsetRef.current);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    event.preventDefault();
  }, [clampOffsetToViewport, commitOffset, offset]);

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
