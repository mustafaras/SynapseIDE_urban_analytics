import React from "react";
import type { MapCompositionLegendItem } from "@/services/map/MapExportService";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../../mapTokens";

export interface MapLegendOverlayProps {
  items: MapCompositionLegendItem[];
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  right: MAP_SPACING.md,
  bottom: MAP_SPACING.md,
  width: "min(17rem, 34vw)",
  maxHeight: "40%",
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.overlay,
  overflow: "auto",
};

const titleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.85rem minmax(0, 1fr)",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const MapLegendOverlay: React.FC<MapLegendOverlayProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <aside
      style={containerStyle}
      aria-label="Map legend"
      data-testid="map-legend-overlay"
    >
      <div style={titleStyle}>Legend</div>
      {items.slice(0, 12).map((item, index) => (
        <div key={`${item.label}-${item.secondaryLabel ?? "map"}-${index}`} style={rowStyle}>
          <span
            aria-hidden="true"
            style={{
              width: "0.85rem",
              height: item.kind === "line" ? "0.2rem" : "0.85rem",
              borderRadius: item.kind === "circle" ? MAP_RADIUS.full : MAP_RADIUS.xs,
              background: item.kind === "label" ? MAP_COLORS.transparent : item.color,
              border: MAP_STROKES.hairlineSubtle,
              color: item.color,
              fontSize: MAP_TYPOGRAPHY.fontSize.xs,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
              lineHeight: 1,
            }}
          >
            {item.kind === "label" ? "Aa" : null}
          </span>
          <span style={labelStyle} title={item.secondaryLabel ? `${item.label} / ${item.secondaryLabel}` : item.label}>
            {item.label}
          </span>
        </div>
      ))}
    </aside>
  );
};
