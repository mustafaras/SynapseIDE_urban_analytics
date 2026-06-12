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
  MAP_SPACING,
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
  surface?: "floating" | "bar";
}

const controlShellStyle: React.CSSProperties = {
  position: "absolute",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  bottom: "var(--map-overlay-safe-bottom, 6.75rem)",
  zIndex: MAP_Z_INDEX.mapFurniture,
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.xs,
  border: "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.42))",
  borderRadius: MAP_RADIUS.sm,
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12, 16, 24, 0.96)) 88%, transparent)",
  color: MAP_COLORS.textSecondary,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
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
  border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const gridSpacerStyle: React.CSSProperties = {
  width: "1.75rem",
  height: "1.75rem",
};

const inlineShellStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.1875rem",
  flex: "0 0 auto",
  height: "1.875rem",
  padding: "0 0.25rem",
  border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
  borderRadius: MAP_RADIUS.sm,
  background: "color-mix(in srgb, var(--syn-surface-panel, #151a21) 58%, transparent)",
  color: MAP_COLORS.textSecondary,
};

const inlineClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.125rem",
};

const inlineButtonStyle: React.CSSProperties = {
  width: "1.5rem",
  height: "1.5rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid transparent",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const inlineLabelStyle: React.CSSProperties = {
  padding: "0 0.25rem",
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: 0,
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
  surface = "floating",
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

  if (surface === "bar") {
    return (
      <div
        style={inlineShellStyle}
        role="group"
        aria-label="Keyboard map canvas controls"
        data-map-canvas-fallback-controls="true"
        data-map-canvas-fallback-surface="bar"
      >
        <span style={mapStyles.srOnly}>
          Map canvas topbar controls for pan and focus.
        </span>
        <span style={inlineLabelStyle} aria-hidden="true">NAV</span>
        <span style={inlineClusterStyle} aria-label="Pan map controls">
          <button type="button" style={inlineButtonStyle} onClick={() => panMap("west")} aria-label="Pan map west" title="Pan map west">
            <ArrowLeft size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={inlineButtonStyle} onClick={() => panMap("north")} aria-label="Pan map north" title="Pan map north">
            <ArrowUp size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={inlineButtonStyle} onClick={() => panMap("south")} aria-label="Pan map south" title="Pan map south">
            <ArrowDown size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={inlineButtonStyle} onClick={() => panMap("east")} aria-label="Pan map east" title="Pan map east">
            <ArrowRight size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
          <button type="button" style={inlineButtonStyle} onClick={focusMapCanvas} aria-label="Return focus to map canvas" title="Return focus to map canvas">
            <Focus size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div
      style={controlShellStyle}
      role="group"
      aria-label="Keyboard map canvas controls"
      data-map-canvas-fallback-controls="true"
      data-map-safe-inset-consumer="keyboard-fallback"
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
