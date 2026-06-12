import React from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
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
}

const dockStyle: React.CSSProperties = {
  position: "absolute",
  top: "var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem)))",
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  width: "min(var(--map-canvas-control-dock-width, 20rem), calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  maxWidth: "calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem)",
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12, 16, 24, 0.96)) 92%, transparent)",
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  pointerEvents: "auto",
  zIndex: MAP_Z_INDEX.mapFurniture,
};

const rowStyle: React.CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.1875rem",
};

const contextualStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  paddingTop: MAP_SPACING.xs,
  borderTop: MAP_STROKES.hairlineSubtle,
};

export const MapCanvasControlDock: React.FC<MapCanvasControlDockProps> = ({
  primary,
  contextual,
  chips,
  ariaLabel = "Map canvas control dock",
  testId = "map-canvas-control-dock",
  style,
}) => (
  <aside
    style={{ ...dockStyle, ...style }}
    aria-label={ariaLabel}
    data-testid={testId}
    data-map-canvas-control-dock="true"
    data-map-safe-inset-consumer="control-dock"
  >
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

export default MapCanvasControlDock;
