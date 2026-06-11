import React from "react";
import type { MapExportFormat, MapExportTarget } from "../../services/map/MapDataExporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapDataExportDialogProps {
  open: boolean;
  format: MapExportFormat;
  target: MapExportTarget;
  precision: number;
  prettyPrint: boolean;
  includeProperties: boolean;
  onFormatChange: (format: MapExportFormat) => void;
  onTargetChange: (target: MapExportTarget) => void;
  onPrecisionChange: (precision: number) => void;
  onPrettyPrintChange: (pretty: boolean) => void;
  onIncludePropertiesChange: (includeProperties: boolean) => void;
  onClose: () => void;
  onExport: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const dialogStyle: React.CSSProperties = {
  width: 360,
  maxWidth: "calc(100% - 2rem)",
  maxHeight: "var(--map-popover-max-height, calc(100% - 2rem))",
  overflowY: "auto",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.panel,
  padding: MAP_SPACING.lg,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: `7px ${MAP_SPACING.sm}`,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  boxSizing: "border-box",
  fontSize: 12,
  marginBottom: 10,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
  color: MAP_COLORS.textSecondary,
  fontSize: 12,
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 12,
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontSize: 12,
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: MAP_COLORS.interactionSubtle,
  borderColor: MAP_COLORS.focus,
  color: MAP_COLORS.interaction,
};

export const MapDataExportDialog: React.FC<MapDataExportDialogProps> = ({
  open,
  format,
  target,
  precision,
  prettyPrint,
  includeProperties,
  onFormatChange,
  onTargetChange,
  onPrecisionChange,
  onPrettyPrintChange,
  onIncludePropertiesChange,
  onClose,
  onExport,
}) => {
  if (!open) return null;

  const isGeoJson = format === "geojson";

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div style={overlayStyle} onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Spatial data export options">
        <div
          style={{
            color: MAP_COLORS.text,
            fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
            fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
            fontSize: 14,
            marginBottom: 14,
          }}
        >
          Export Spatial Data
        </div>

        <label style={labelStyle}>
          Export Format
          <select
            style={inputStyle}
            value={format}
            onChange={(event) => onFormatChange(event.target.value as MapExportFormat)}
          >
            <option value="geojson">GeoJSON</option>
            <option value="geoparquet">GeoParquet</option>
          </select>
        </label>

        <label style={labelStyle}>
          Export Target
          <select
            style={inputStyle}
            value={target}
            onChange={(event) => onTargetChange(event.target.value as MapExportTarget)}
          >
            <option value="pins">Pins</option>
            <option value="drawings">Drawings</option>
            <option value="visible-layers">Visible Layers</option>
          </select>
        </label>

        <label style={labelStyle}>
          Coordinate Precision
          <input
            style={isGeoJson ? inputStyle : { ...inputStyle, opacity: 0.55, cursor: "not-allowed" }}
            type="number"
            min={0}
            max={12}
            step={1}
            value={precision}
            onChange={(event) => onPrecisionChange(Number(event.target.value))}
            disabled={!isGeoJson}
          />
        </label>

        <label style={rowStyle}>
          <input
            type="checkbox"
            checked={prettyPrint}
            onChange={(event) => onPrettyPrintChange(event.target.checked)}
            disabled={!isGeoJson}
          />
          Pretty-print JSON output
        </label>

        <label style={rowStyle}>
          <input
            type="checkbox"
            checked={includeProperties}
            onChange={(event) => onIncludePropertiesChange(event.target.checked)}
          />
          Include feature properties
        </label>

        <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: "1.45" }}>
          {isGeoJson
            ? "Visible-layer export merges all visible GeoJSON-capable layers into a single FeatureCollection."
            : "GeoParquet preserves binary columnar geometry, writes spatial metadata, and keeps the original coordinate precision."}
        </div>

        <div style={{ display: "grid", gap: 6, padding: 10, marginTop: 10, borderRadius: MAP_RADIUS.sm, border: MAP_STROKES.hairlineSubtle, background: MAP_COLORS.bg, fontSize: 11 }}>
          <div style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Format Comparison</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ padding: "6px 8px", borderRadius: MAP_RADIUS.sm, border: isGeoJson ? `1px solid ${MAP_COLORS.focus}` : MAP_STROKES.hairlineSubtle, background: isGeoJson ? MAP_COLORS.selectedSubtle : "transparent" }}>
              <div style={{ color: isGeoJson ? MAP_COLORS.interaction : MAP_COLORS.textMuted, fontSize: 11, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>GeoJSON</div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>Human-readable, universal compatibility, larger file size</div>
            </div>
            <div style={{ padding: "6px 8px", borderRadius: MAP_RADIUS.sm, border: !isGeoJson ? `1px solid ${MAP_COLORS.focus}` : MAP_STROKES.hairlineSubtle, background: !isGeoJson ? MAP_COLORS.selectedSubtle : "transparent" }}>
              <div style={{ color: !isGeoJson ? MAP_COLORS.interaction : MAP_COLORS.textMuted, fontSize: 11, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>GeoParquet</div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>Binary columnar, WKB geometry, 40–70% smaller, spatial metadata</div>
            </div>
          </div>
        </div>

        <div style={buttonRowStyle}>
          <button type="button" style={buttonStyle} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={primaryButtonStyle} onClick={onExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapDataExportDialog;
