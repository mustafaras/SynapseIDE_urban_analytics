import React from "react";
import { Map } from "lucide-react";
import { BASE_STYLES, type BaseLayerId } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./mapTokens";
import { AppDropdownMenu, AppMenuItem, ToolbarMenuButton } from "./ui";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapLayerPanelProps {
  activeLayer: BaseLayerId;
  onSetLayer: (layer: BaseLayerId) => void;
  compact?: boolean;
}

const baseLayerShell: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const baseLayerLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const baseLayerSelect: React.CSSProperties = {
  minHeight: "1.75rem",
  maxWidth: "8.75rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  cursor: "pointer",
};

const compactBaseShell: React.CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.xs,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapLayerPanel: React.FC<MapLayerPanelProps> = ({
  activeLayer,
  onSetLayer,
  compact = false,
}) => {
  const [open, setOpen] = React.useState(false);

  if (compact) {
    return (
      <div style={compactBaseShell} aria-label="Base map layer selector">
        <AppDropdownMenu
          open={open}
          onOpenChange={setOpen}
          align="end"
          minWidth={300}
          maxWidth={380}
          ariaLabel="Base map layers"
          testId="map-basemap-menu"
          trigger={(
            <ToolbarMenuButton
              label={`Base ${BASE_STYLES[activeLayer].name}`}
              icon={<Map size={MAP_ICON_SIZES.sm} aria-hidden="true" />}
              active={open}
              expanded={open}
              compact
              title="Select base map layer"
              ariaLabel={`Select base map layer, current ${BASE_STYLES[activeLayer].name}`}
              testId="map-basemap-trigger"
              style={{ maxWidth: "9rem" }}
            />
          )}
        >
          {(Object.keys(BASE_STYLES) as BaseLayerId[]).map((key) => {
            const selected = key === activeLayer;
            return (
              <AppMenuItem
                key={key}
                icon={<Map size={MAP_ICON_SIZES.xs} aria-hidden="true" />}
                label={BASE_STYLES[key].name}
                role="menuitemradio"
                checked={selected}
                onSelect={() => {
                  onSetLayer(key);
                  setOpen(false);
                }}
              />
            );
          })}
        </AppDropdownMenu>
      </div>
    );
  }

  return (
    <label
      style={{
        ...baseLayerShell,
        ...(compact ? {
          flex: "0 0 auto",
          gap: "0.1875rem",
          padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
        } satisfies React.CSSProperties : null),
      }}
      aria-label="Base map layer selector"
    >
      <span style={{
        ...baseLayerLabel,
        ...(compact ? {
          fontSize: "0.6875rem",
          letterSpacing: 0,
        } satisfies React.CSSProperties : null),
      }}>
        Base
      </span>
      <select
        style={{
          ...baseLayerSelect,
          ...(compact ? {
            minHeight: "1.625rem",
            maxWidth: "7.5rem",
            padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
            border: "1px solid transparent",
            fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
          } satisfies React.CSSProperties : null),
        }}
        value={activeLayer}
        onChange={(event) => onSetLayer(event.target.value as BaseLayerId)}
        aria-label="Select base map layer"
        title="Select base map layer"
      >
        {(Object.keys(BASE_STYLES) as BaseLayerId[]).map((key) => (
          <option key={key} value={key}>
            {BASE_STYLES[key].name}
          </option>
        ))}
      </select>
    </label>
  );
};
