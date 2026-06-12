import React, { useState } from "react";
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
  right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
  bottom: "var(--map-overlay-safe-bottom, 6.75rem)",
  width: "min(17rem, calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem))",
  maxHeight: "var(--map-popover-max-height, min(24rem, calc(100vh - 8rem)))",
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.mapFurniture,
  overflow: "auto",
};

const titleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const countStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const toggleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "1.5rem",
  padding: `0 ${MAP_SPACING.xs}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  cursor: "pointer",
};

const bodyStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: 0,
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

const secondaryLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const MapLegendOverlay: React.FC<MapLegendOverlayProps> = ({ items }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;
  const visibleItems = items.slice(0, 12);

  return (
    <aside
      style={containerStyle}
      aria-label="Map legend"
      data-testid="map-legend-overlay"
      data-collapsed={collapsed ? "true" : "false"}
      data-map-safe-inset-consumer="legend"
    >
      <div style={headerStyle}>
        <div style={titleStyle}>Legend</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs }}>
          <div style={countStyle}>{items.length} item{items.length === 1 ? "" : "s"}</div>
          <button
            type="button"
            style={toggleStyle}
            aria-expanded={!collapsed}
            aria-controls="map-legend-overlay-body"
            aria-label={collapsed ? "Expand map legend" : "Collapse map legend"}
            data-testid="map-legend-toggle"
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>
      {!collapsed ? (
        <div id="map-legend-overlay-body" style={bodyStyle}>
          {visibleItems.map((item, index) => (
            <div key={`${item.label}-${item.secondaryLabel ?? "map"}-${index}`} style={rowStyle}>
              <span
                aria-hidden="true"
                style={{
                  width: "0.85rem",
                  height: item.kind === "line" ? "0.2rem" : "0.85rem",
                  borderRadius: item.kind === "circle" || item.kind === "dot-density" ? MAP_RADIUS.full : MAP_RADIUS.xs,
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
              <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                <span style={labelStyle} title={item.secondaryLabel ? `${item.label} / ${item.secondaryLabel}` : item.label}>
                  {item.label}
                </span>
                {item.secondaryLabel ? <span style={secondaryLabelStyle}>{item.secondaryLabel}</span> : null}
              </span>
            </div>
          ))}
          {items.length > visibleItems.length ? (
            <div style={countStyle}>+{items.length - visibleItems.length} more</div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
};
