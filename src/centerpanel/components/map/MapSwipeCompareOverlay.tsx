import React, { useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import { Columns2, X } from "lucide-react";

import { BASE_STYLES, type BaseLayerId, type MapPin, type OverlayLayerConfig, type ViewportState } from "./mapTypes";
import { MapCanvas } from "./MapCanvas";
import { useLayerSync } from "./useLayerSync";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { GisIconButton } from "./ui";

export interface MapSwipeCompareOverlayProps {
  visible: boolean;
  baseLayer: BaseLayerId;
  compareBaseLayer: BaseLayerId;
  overlayLayers: OverlayLayerConfig[];
  pins: MapPin[];
  viewport: Pick<ViewportState, "center" | "zoom" | "bearing" | "pitch">;
  reducedMotion?: boolean;
  onCompareBaseLayerChange: (layer: BaseLayerId) => void;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
}

const BASE_LAYER_IDS = Object.keys(BASE_STYLES) as BaseLayerId[];

const rootStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: MAP_Z_INDEX.mapFurniture,
  pointerEvents: "none",
};

const comparePaneStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
};

const dividerStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, 2.5rem)",
  bottom: "calc(var(--map-status-h, 1.75rem) + 0.75rem)",
  width: 18,
  marginLeft: -9,
  border: 0,
  padding: 0,
  background: "transparent",
  cursor: "ew-resize",
  pointerEvents: "auto",
  touchAction: "none",
};

const dividerLineStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: "50%",
  width: 2,
  transform: "translateX(-50%)",
  background: "var(--syn-interaction-active, #d09a48)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 0 18px rgba(208,154,72,0.36)",
};

const dividerThumbStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  display: "grid",
  placeItems: "center",
  width: 30,
  height: 30,
  transform: "translate(-50%, -50%)",
  borderRadius: MAP_RADIUS.full,
  border: MAP_STROKES.hairlineStrong,
  background: "var(--syn-surface-panel, rgba(12,16,24,0.96))",
  color: MAP_COLORS.text,
  boxShadow: "0 8px 22px rgba(0,0,0,0.32)",
};

const toolbarStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, 2.5rem)",
  left: "calc(var(--map-dock-left, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  maxWidth: "min(26rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  padding: "4px 6px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12,16,24,0.96)) 92%, transparent)",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  boxShadow: "0 10px 26px rgba(0,0,0,0.26)",
  pointerEvents: "auto",
};

const titleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  paddingInline: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  whiteSpace: "nowrap",
};

const selectStyle: React.CSSProperties = {
  minWidth: "8.5rem",
  height: "1.75rem",
  borderRadius: MAP_RADIUS.xs,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

function clampSwipePercent(value: number): number {
  return Math.max(12, Math.min(88, value));
}

export function MapSwipeCompareOverlay({
  visible,
  baseLayer,
  compareBaseLayer,
  overlayLayers,
  pins,
  viewport,
  reducedMotion = false,
  onCompareBaseLayerChange,
  onClose,
  onAnnounce,
}: MapSwipeCompareOverlayProps): React.ReactElement | null {
  const [swipePercent, setSwipePercent] = useState(50);
  const [compareMap, setCompareMap] = useState<maplibregl.Map | null>(null);
  const layerSyncRef = useMemo<React.RefObject<maplibregl.Map | null>>(
    () => ({ current: compareMap }),
    [compareMap],
  );
  const dragStateRef = useRef<{ rect: DOMRect } | null>(null);

  useLayerSync(layerSyncRef, visible && compareMap ? overlayLayers : []);

  if (!visible) {
    return null;
  }

  const handlePointerMove = (event: PointerEvent): void => {
    const rect = dragStateRef.current?.rect;
    if (!rect) return;
    const next = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    setSwipePercent(clampSwipePercent(next));
  };

  const handlePointerUp = (): void => {
    dragStateRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    const region = event.currentTarget.closest<HTMLElement>("[data-testid='map-canvas-region']");
    const rect = region?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = { rect };
    handlePointerMove(event.nativeEvent);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    window.addEventListener("pointercancel", handlePointerUp, { once: true });
    event.preventDefault();
  };

  return (
    <div style={rootStyle} data-testid="map-swipe-compare-overlay" data-map-furniture="swipe-compare">
      <div
        style={{
          ...comparePaneStyle,
          clipPath: `inset(0 ${100 - swipePercent}% 0 0)`,
        }}
        aria-hidden="true"
      >
        <MapCanvas
          id="map-swipe-compare-canvas"
          baseLayer={compareBaseLayer}
          pinMode={false}
          pins={pins}
          interactiveLayerIds={[]}
          reducedMotion={reducedMotion}
          preserveDrawingBuffer={false}
          showScaleBar={false}
          initialViewport={viewport}
          syncViewport={viewport}
          viewportMode="controlled"
          onCursorMove={() => undefined}
          onZoomChange={() => undefined}
          onViewportChange={() => undefined}
          onMapClick={() => undefined}
          onMapReady={(map) => setCompareMap(map)}
          onMapDestroy={() => setCompareMap(null)}
        />
      </div>

      <div style={toolbarStyle} role="toolbar" aria-label="Swipe compare controls">
        <span style={titleStyle}>
          <Columns2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          Swipe
        </span>
        <select
          style={selectStyle}
          value={compareBaseLayer}
          aria-label="Compare basemap"
          onChange={(event) => {
            const next = event.target.value as BaseLayerId;
            onCompareBaseLayerChange(next);
            onAnnounce?.(`Swipe compare basemap changed to ${BASE_STYLES[next].name}`);
          }}
        >
          {BASE_LAYER_IDS.map((layerId) => (
            <option key={layerId} value={layerId} disabled={layerId === baseLayer}>
              {BASE_STYLES[layerId].name}
            </option>
          ))}
        </select>
        <GisIconButton
          label="Close swipe compare"
          tooltip="Close swipe compare"
          icon={<X size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
          size="sm"
          onClick={onClose}
        />
      </div>

      <button
        type="button"
        style={{ ...dividerStyle, left: `${swipePercent}%` }}
        aria-label={`Move swipe divider, ${Math.round(swipePercent)} percent`}
        title={`Swipe divider ${Math.round(swipePercent)}%`}
        onPointerDown={handlePointerDown}
      >
        <span style={dividerLineStyle} aria-hidden="true" />
        <span style={dividerThumbStyle} aria-hidden="true">
          <Columns2 size={MAP_ICON_SIZES.sm} />
        </span>
      </button>
    </div>
  );
}

export default MapSwipeCompareOverlay;
