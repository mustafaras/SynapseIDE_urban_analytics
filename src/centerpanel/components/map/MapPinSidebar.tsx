import React from "react";
import type { MapPin } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_ICON_SIZES,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "./mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "./useDraggableMapPanel";
import { IconPin, IconTrash } from "./MapIcons";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapPinSidebarProps {
  pins: MapPin[];
  visible: boolean;
  onRemovePin: (id: string) => void;
  onClearAll: () => void;
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const sidebar: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.pinSidebarWidth),
};

const headerRow: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
};

const sidebarTitle: React.CSSProperties = {
  ...mapStyles.sidePanelTitle,
};

const emptyState: React.CSSProperties = {
  ...mapStyles.sidePanelEmpty,
};

const pinCard: React.CSSProperties = {
  ...mapStyles.sidePanelRow,
  display: "grid",
  gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  color: MAP_COLORS.text,
};

const coordsStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const actionBtnGroup: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
};

const smallBtn: React.CSSProperties = {
  ...mapStyles.sidePanelActionButton,
  minHeight: "1.5rem",
};

const iconOnlyBtn: React.CSSProperties = {
  ...smallBtn,
  width: "1.5rem",
  padding: MAP_SPACING.zero,
};

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5) : "--";
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapPinSidebar: React.FC<MapPinSidebarProps> = ({
  pins,
  visible,
  onRemovePin,
  onClearAll,
  onFlyTo,
}) => {
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();

  if (!visible) return null;

  const lastPin = pins[pins.length - 1] ?? null;

  return (
    <div style={{ ...sidebar, ...panelPositionStyle }} role="complementary" aria-label={`Pin sidebar — ${pins.length} pin${pins.length !== 1 ? "s" : ""}`}>
      <div style={{ ...headerRow, ...dragHandleStyle }} {...dragHandleProps}>
        <div style={mapStyles.sidePanelTitleStack}>
          <span style={mapStyles.sidePanelEyebrow}>Field notes</span>
          <span style={sidebarTitle}><IconPin size={MAP_ICON_SIZES.sm} /> Pins</span>
        </div>
        <div style={mapStyles.sidePanelHeaderActions}>
          {pins.length > 0 && (
            <button
              type="button"
              style={smallBtn}
              onClick={onClearAll}
              aria-label="Clear all pins"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div style={mapStyles.sidePanelSummaryStrip} aria-label="Pin summary">
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Pins</span>
          <span style={mapStyles.sidePanelMetricValue}>{pins.length}</span>
        </div>
        <div style={mapStyles.sidePanelMetric}>
          <span style={mapStyles.sidePanelMetricLabel}>Last Lat</span>
          <span style={mapStyles.sidePanelMetricValue}>{lastPin ? formatCoordinate(lastPin.lat) : "None"}</span>
        </div>
        <div style={{ ...mapStyles.sidePanelMetric, borderRight: MAP_STROKES.none }}>
          <span style={mapStyles.sidePanelMetricLabel}>Last Lng</span>
          <span style={mapStyles.sidePanelMetricValue}>{lastPin ? formatCoordinate(lastPin.lng) : "None"}</span>
        </div>
      </div>

      {pins.length === 0 ? (
        <div style={emptyState}>
          No pinned locations.
        </div>
      ) : (
        <div style={mapStyles.sidePanelBody} role="list" aria-label="Pinned location list">
          {pins.map((p) => {
            const label = p.label ?? p.id;
            return (
              <div key={p.id} style={pinCard} role="listitem">
                <span style={{ color: MAP_COLORS.interaction, display: "inline-flex", alignItems: "center" }}>
                  <IconPin size={MAP_ICON_SIZES.sm} />
                </span>
                <span style={{ minWidth: MAP_SPACING.zero, display: "grid", gap: MAP_SPACING.xs }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                    {label}
                  </span>
                  <span style={coordsStyle}>
                    {formatCoordinate(p.lat)}, {formatCoordinate(p.lng)}
                  </span>
                </span>
                <span style={actionBtnGroup}>
                  <button
                    type="button"
                    style={smallBtn}
                    onClick={() => onFlyTo(p.lng, p.lat)}
                    aria-label={`Fly to ${label}`}
                  >
                    Go
                  </button>
                  <button
                    type="button"
                    style={{ ...iconOnlyBtn, color: MAP_COLORS.error }}
                    onClick={() => onRemovePin(p.id)}
                    aria-label={`Remove ${label}`}
                    title={`Remove ${label}`}
                  >
                    <IconTrash size={MAP_ICON_SIZES.xs} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
