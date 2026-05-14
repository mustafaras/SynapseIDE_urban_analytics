import React from "react";
import type maplibregl from "maplibre-gl";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Focus,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

const PAN_DELTA = 100;
const ZOOM_DELTA = 1;

export interface MapCanvasKeyboardFallbackControlsProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  mapElementId: string;
  reducedMotion: boolean;
  defaultCenter: [number, number];
  defaultZoom: number;
  onAnnounce?: (message: string) => void;
}

const controlShellStyle: React.CSSProperties = {
  position: "absolute",
  right: `calc(var(--map-dock-right, 0px) + ${MAP_SPACING.md})`,
  bottom: MAP_SPACING.md,
  zIndex: MAP_Z_INDEX.sidebar + 2,
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: "rgba(13, 13, 13, 0.82)",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.textSecondary,
};

const panGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1.75rem)",
  gridTemplateRows: "repeat(3, 1.75rem)",
  gap: "0.1875rem",
};

const secondaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1.75rem)",
  gap: "0.1875rem",
};

const controlButtonStyle: React.CSSProperties = {
  width: "1.75rem",
  height: "1.75rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const gridSpacerStyle: React.CSSProperties = {
  width: "1.75rem",
  height: "1.75rem",
};

function runWithMap(
  mapRef: React.RefObject<maplibregl.Map | null>,
  onMissingMap: () => void,
  callback: (map: maplibregl.Map) => void,
): void {
  const map = mapRef.current;
  if (!map) {
    onMissingMap();
    return;
  }
  callback(map);
}

export const MapCanvasKeyboardFallbackControls: React.FC<MapCanvasKeyboardFallbackControlsProps> = ({
  mapRef,
  mapElementId,
  reducedMotion,
  defaultCenter,
  defaultZoom,
  onAnnounce,
}) => {
  const animate = !reducedMotion;
  const announceMissingMap = React.useCallback(() => {
    onAnnounce?.("Map controls are not ready yet");
  }, [onAnnounce]);

  const focusMapCanvas = React.useCallback(() => {
    document.getElementById(mapElementId)?.focus();
    onAnnounce?.("Interactive map canvas focused");
  }, [mapElementId, onAnnounce]);

  const panMap = React.useCallback((direction: "north" | "south" | "west" | "east") => {
    runWithMap(mapRef, announceMissingMap, (map) => {
      const offset: [number, number] =
        direction === "north"
          ? [0, -PAN_DELTA]
          : direction === "south"
            ? [0, PAN_DELTA]
            : direction === "west"
              ? [-PAN_DELTA, 0]
              : [PAN_DELTA, 0];
      map.panBy(offset, { animate });
      onAnnounce?.(`Map panned ${direction}`);
    });
  }, [animate, announceMissingMap, mapRef, onAnnounce]);

  const zoomMap = React.useCallback((delta: number) => {
    runWithMap(mapRef, announceMissingMap, (map) => {
      const nextZoom = +(map.getZoom() + delta).toFixed(1);
      map.zoomTo(nextZoom, { animate });
      onAnnounce?.(`Zoom level ${nextZoom}`);
    });
  }, [animate, announceMissingMap, mapRef, onAnnounce]);

  const resetMap = React.useCallback(() => {
    runWithMap(mapRef, announceMissingMap, (map) => {
      const resetOptions = {
        center: defaultCenter,
        zoom: defaultZoom,
        bearing: 0,
        pitch: 0,
      };
      if (reducedMotion) {
        map.jumpTo(resetOptions);
      } else {
        map.flyTo({ ...resetOptions, duration: 1200 });
      }
      onAnnounce?.("Map view reset to default");
    });
  }, [announceMissingMap, defaultCenter, defaultZoom, mapRef, onAnnounce, reducedMotion]);

  return (
    <div
      style={controlShellStyle}
      role="group"
      aria-label="Keyboard map canvas controls"
      data-map-canvas-fallback-controls="true"
    >
      <span style={mapStyles.srOnly}>
        Map canvas fallback controls for pan, zoom, reset, and focus.
      </span>
      <div style={panGridStyle} aria-label="Pan map controls">
        <span style={gridSpacerStyle} aria-hidden="true" />
        <button type="button" style={controlButtonStyle} onClick={() => panMap("north")} aria-label="Pan map north" title="Pan map north">
          <ArrowUp size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <span style={gridSpacerStyle} aria-hidden="true" />
        <button type="button" style={controlButtonStyle} onClick={() => panMap("west")} aria-label="Pan map west" title="Pan map west">
          <ArrowLeft size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button type="button" style={controlButtonStyle} onClick={focusMapCanvas} aria-label="Focus interactive map canvas" title="Focus map canvas">
          <Focus size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button type="button" style={controlButtonStyle} onClick={() => panMap("east")} aria-label="Pan map east" title="Pan map east">
          <ArrowRight size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <span style={gridSpacerStyle} aria-hidden="true" />
        <button type="button" style={controlButtonStyle} onClick={() => panMap("south")} aria-label="Pan map south" title="Pan map south">
          <ArrowDown size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <span style={gridSpacerStyle} aria-hidden="true" />
      </div>
      <div style={secondaryGridStyle} aria-label="Zoom and reset map controls">
        <button type="button" style={controlButtonStyle} onClick={() => zoomMap(ZOOM_DELTA)} aria-label="Zoom map in" title="Zoom map in">
          <ZoomIn size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button type="button" style={controlButtonStyle} onClick={() => zoomMap(-ZOOM_DELTA)} aria-label="Zoom map out" title="Zoom map out">
          <ZoomOut size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button type="button" style={controlButtonStyle} onClick={resetMap} aria-label="Reset map view" title="Reset map view">
          <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
        <button type="button" style={controlButtonStyle} onClick={focusMapCanvas} aria-label="Return focus to map canvas" title="Return focus to map canvas">
          <Focus size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
