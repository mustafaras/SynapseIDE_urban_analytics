import React from "react";
import { profileCsvImportSession, type CsvImportSession } from "../../services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";
import { useDraggableMapPanel } from "./map/useDraggableMapPanel";

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
  maxWidth: "calc(100% - 2rem)",
  maxHeight: "var(--map-popover-max-height, calc(100% - 2rem))",
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

const footerStyle: React.CSSProperties = {
  ...sectionStyle,
  paddingTop: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: MAP_SPACING.md,
};

const footerCaveatsStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  maxWidth: 460,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.caveat,
};

const preflightGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
  gap: 0,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const preflightCellStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: MAP_SPACING.md,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

function formatBytes(value: number | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

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
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel();

  if (!open || !session) return null;

  const sourceProfile = profileCsvImportSession(session, {
    latitudeColumn,
    longitudeColumn,
  });

  const importDisabled =
    latitudeColumn.length === 0 ||
    longitudeColumn.length === 0 ||
    latitudeColumn === longitudeColumn;
  const commitCaveats = sourceProfile.caveats.slice(0, 5);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        style={{ ...dialogStyle, position: "absolute", ...panelPositionStyle }}
        role="dialog"
        aria-modal="true"
        aria-label="CSV coordinate mapping"
        data-draggable-map-panel="true"
      >
        <div
          {...dragHandleProps}
          style={{
            ...dragHandleStyle,
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

        <div style={preflightGridStyle} aria-label="CSV source preflight">
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Valid Features</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {sourceProfile.featureCount?.toLocaleString() ?? "unknown"}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {sourceProfile.totalRecords?.toLocaleString() ?? session.totalRows.toLocaleString()} source rows profiled.
            </span>
          </div>
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Skipped Rows</span>
            <span style={{ color: (sourceProfile.skippedRecordCount ?? 0) > 0 ? MAP_COLORS.caveatText : MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {(sourceProfile.skippedRecordCount ?? 0).toLocaleString()}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {(sourceProfile.skippedRecordCount ?? 0) > 0
                ? `${(sourceProfile.skippedRecordCount ?? 0).toLocaleString()} skipped rows will be excluded.`
                : "No skipped rows detected for the current mapping."}
            </span>
          </div>
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>CRS</span>
            <span style={{ color: MAP_COLORS.caveatText, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              CRS {sourceProfile.crsSummary.status}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              Coordinate columns do not prove a declared CRS.
            </span>
          </div>
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Geometry</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {sourceProfile.geometrySummary?.geometryType ?? "Point"}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {sourceProfile.geometrySummary?.notes[0] ?? "Point geometry requires coordinate column review."}
            </span>
          </div>
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Source Size</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {formatBytes(sourceProfile.sizeBytes)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              Memory estimate: {formatBytes(sourceProfile.estimatedMemoryBytes)}
            </span>
          </div>
          <div style={preflightCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Worker Transfer</span>
            <span style={{ color: sourceProfile.workerReady ? MAP_COLORS.success : MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {sourceProfile.workerReady ? "Ready" : "Not required"}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {sourceProfile.workerReady ? "Prepared for worker-backed handling." : "CSV commit does not stage a worker table."}
            </span>
          </div>
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

        <div style={footerStyle}>
          <div style={footerCaveatsStyle} aria-label="CSV commit caveats">
            <div style={{ color: MAP_COLORS.caveatText, fontSize: 10, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, textTransform: "uppercase" }}>
              Commit caveats
            </div>
            {commitCaveats.map((caveat) => (
              <div key={caveat} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.45 }}>{caveat}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
    </div>
  );
};

export default MapCsvImportDialog;
