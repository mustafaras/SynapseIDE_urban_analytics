import React from "react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

export interface ContextToolbarProps {
  leftGroup?: React.ReactNode;
  centerGroup?: React.ReactNode;
  rightGroup?: React.ReactNode;
  style?: React.CSSProperties;
}

const hostStyle: React.CSSProperties = {
  position: "relative",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2.875rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md} ${MAP_SPACING.xs} calc(var(--map-activity-rail-width, 2.625rem) + ${MAP_SPACING.md})`,
  borderBottom: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 46%, transparent)",
  background: [
    "linear-gradient(180deg, color-mix(in srgb, var(--syn-surface-panel, #171c23) 94%, #0b0f14 6%), var(--syn-surface-panel, #171c23))",
    "linear-gradient(90deg, color-mix(in srgb, var(--syn-interaction-active, #3794ff) 6%, transparent), transparent 38%)",
  ].join(", "),
  boxShadow: "none",
};

const groupBaseStyle: React.CSSProperties = {
  minWidth: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.zero}`,
  overflow: "visible",
};

const leftGroupStyle: React.CSSProperties = {
  ...groupBaseStyle,
  flex: "0 1 auto",
  borderRight: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.14)) 42%, transparent)",
  paddingRight: MAP_SPACING.sm,
};

const centerGroupStyle: React.CSSProperties = {
  ...groupBaseStyle,
  flex: "1 1 24rem",
  borderRight: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.14)) 42%, transparent)",
  paddingRight: MAP_SPACING.sm,
};

const rightGroupStyle: React.CSSProperties = {
  ...groupBaseStyle,
  flex: "0 1 auto",
  marginLeft: "auto",
};

export const ToolbarButton: React.FC<{
  label: string;
  title: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, title, active = false, onClick }) => (
  <button
    type="button"
    aria-label={title}
    title={title}
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: "2rem",
      padding: `0 ${MAP_SPACING.sm}`,
      borderRadius: MAP_RADIUS.sm,
      border: active ? "1px solid color-mix(in srgb, var(--syn-interaction-active, #3794ff) 28%, transparent)" : "1px solid transparent",
      background: active
        ? "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 12%, transparent)"
        : "transparent",
      color: active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
      fontFamily: MAP_TYPOGRAPHY.fontFamily,
      fontSize: MAP_TYPOGRAPHY.fontSize.xs,
      fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </button>
);

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  leftGroup,
  centerGroup,
  rightGroup,
  style,
}) => (
  <section style={{ ...hostStyle, ...style }} aria-label="Contextual map toolbar" data-testid="map-context-toolbar">
    <div style={leftGroupStyle} role="group" aria-label="Layer controls" data-testid="map-context-toolbar-left">
      {leftGroup}
    </div>
    <div style={centerGroupStyle} role="group" aria-label="Selection and filter controls" data-testid="map-context-toolbar-center">
      {centerGroup}
    </div>
    <div style={rightGroupStyle} role="group" aria-label="Viewport and map furniture controls" data-testid="map-context-toolbar-right">
      {rightGroup}
    </div>
  </section>
);
