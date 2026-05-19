import React from "react";
import type { CsvImportSession } from "../../services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapCsvImportDialogProps {
  open: boolean;
  session: CsvImportSession | null;
  latitudeColumn: string;
  longitudeColumn: string;
  onLatitudeColumnChange: (value: string) => void;
  onLongitudeColumnChange: (value: string) => void;
  onClose: () => void;
  onImport: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 42,
};

const dialogStyle: React.CSSProperties = {
  width: 720,
  maxWidth: "calc(100vw - 48px)",
  maxHeight: "calc(100vh - 96px)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const sectionStyle: React.CSSProperties = {
  padding: MAP_SPACING.md,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: MAP_COLORS.textMuted,
  fontSize: 11,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  marginBottom: 4,
  textTransform: "uppercase",
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

export const MapCsvImportDialog: React.FC<MapCsvImportDialogProps> = ({
  open,
  session,
  latitudeColumn,
  longitudeColumn,
  onLatitudeColumnChange,
  onLongitudeColumnChange,
  onClose,
  onImport,
}) => {
  if (!open || !session) return null;

  const importDisabled =
    latitudeColumn.length === 0 ||
    longitudeColumn.length === 0 ||
    latitudeColumn === longitudeColumn;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="CSV coordinate mapping">
        <div
          style={{
            ...sectionStyle,
            paddingBottom: MAP_SPACING.md,
            borderBottom: MAP_STROKES.hairlineSubtle,
          }}
        >
          <div
            style={{
              color: MAP_COLORS.text,
              fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            Import CSV Points
          </div>
          <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
            {session.fileName} contains {session.totalRows.toLocaleString()} data row
            {session.totalRows !== 1 ? "s" : ""}. Map the coordinate columns to convert each row
            into a GeoJSON point feature.
          </div>
        </div>

        <div
          style={{
            ...sectionStyle,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: MAP_SPACING.md,
            borderBottom: MAP_STROKES.hairlineSubtle,
          }}
        >
          <label style={labelStyle}>
            Latitude column
            <select
              style={inputStyle}
              value={latitudeColumn}
              onChange={(event) => onLatitudeColumnChange(event.target.value)}
            >
              <option value="">Select latitude column</option>
              {session.headers.map((header) => (
                <option key={`lat-${header}`} value={header}>
                  {header}
                </option>
              ))}
            </select>
            {session.latitudeCandidates.length > 0 ? (
              <div style={{ marginTop: 6, color: MAP_COLORS.textMuted, fontSize: 11 }}>
                Detected: {session.latitudeCandidates.join(", ")}
              </div>
            ) : null}
          </label>

          <label style={labelStyle}>
            Longitude column
            <select
              style={inputStyle}
              value={longitudeColumn}
              onChange={(event) => onLongitudeColumnChange(event.target.value)}
            >
              <option value="">Select longitude column</option>
              {session.headers.map((header) => (
                <option key={`lng-${header}`} value={header}>
                  {header}
                </option>
              ))}
            </select>
            {session.longitudeCandidates.length > 0 ? (
              <div style={{ marginTop: 6, color: MAP_COLORS.textMuted, fontSize: 11 }}>
                Detected: {session.longitudeCandidates.join(", ")}
              </div>
            ) : null}
          </label>
        </div>

        <div style={{ ...sectionStyle, overflow: "auto", flex: 1 }}>
          <div
            style={{
              color: MAP_COLORS.textMuted,
              fontSize: 12,
              fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Preview (first 5 rows)
          </div>

          <div
            style={{
              border: MAP_STROKES.hairlineSubtle,
              borderRadius: MAP_RADIUS.sm,
              overflow: "hidden",
              background: MAP_COLORS.bg,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              }}
            >
              <thead>
                <tr style={{ background: MAP_COLORS.bgHeader }}>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      color: MAP_COLORS.textMuted,
                      borderBottom: MAP_STROKES.hairlineSubtle,
                      position: "sticky",
                      top: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    Row
                  </th>
                  {session.headers.map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        color: MAP_COLORS.textMuted,
                        borderBottom: MAP_STROKES.hairlineSubtle,
                        minWidth: 120,
                        position: "sticky",
                        top: 0,
                        textTransform: "uppercase",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.previewRows.map((row) => (
                  <tr key={`preview-${row.rowNumber}`}>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: MAP_COLORS.textMuted,
                        borderBottom: MAP_STROKES.hairlineSubtle,
                        fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
                      }}
                    >
                      {row.rowNumber}
                    </td>
                    {session.headers.map((header) => (
                      <td
                        key={`${row.rowNumber}-${header}`}
                        style={{
                          padding: "8px 10px",
                          color: MAP_COLORS.textSecondary,
                          borderBottom: MAP_STROKES.hairlineSubtle,
                          verticalAlign: "top",
                        }}
                      >
                        {row.values[header] || <span style={{ color: MAP_COLORS.textMuted }}>-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importDisabled ? (
            <div style={{ marginTop: 10, color: MAP_COLORS.textMuted, fontSize: 11 }}>
              Choose distinct latitude and longitude columns to continue.
            </div>
          ) : null}
        </div>

        <div
          style={{
            ...sectionStyle,
            paddingTop: MAP_SPACING.md,
            borderTop: MAP_STROKES.hairlineSubtle,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button type="button" style={buttonStyle} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            style={importDisabled ? { ...primaryButtonStyle, opacity: 0.55, cursor: "not-allowed" } : primaryButtonStyle}
            onClick={onImport}
            disabled={importDisabled}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapCsvImportDialog;
