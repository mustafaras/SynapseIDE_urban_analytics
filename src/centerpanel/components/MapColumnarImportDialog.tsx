import React from "react";
import type { ColumnarImportSession } from "../../services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapColumnarImportDialogProps {
  open: boolean;
  session: ColumnarImportSession | null;
  onClose: () => void;
  onImport: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.58)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 42,
  padding: 24,
};

const dialogStyle: React.CSSProperties = {
  width: 980,
  maxWidth: "calc(100vw - 48px)",
  maxHeight: "calc(100vh - 72px)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: MAP_SPACING.lg,
  borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
  background:
    "radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.82))",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 999,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  background: MAP_COLORS.amberDim,
  color: MAP_COLORS.amber,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
  padding: `0 ${MAP_SPACING.lg} ${MAP_SPACING.lg}`,
  borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
};

const summaryCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: 12,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(15,23,42,0.55)",
};

const bodyStyle: React.CSSProperties = {
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
  gap: 0,
};

const sectionStyle: React.CSSProperties = {
  padding: MAP_SPACING.lg,
  display: "grid",
  gap: 12,
  alignContent: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.amber,
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

const tableShellStyle: React.CSSProperties = {
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  borderRadius: MAP_RADIUS.sm,
  overflow: "hidden",
  background: MAP_COLORS.bg,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: MAP_SPACING.lg,
  borderTop: `1px solid ${MAP_COLORS.amberBorder}`,
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontSize: 12,
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: MAP_COLORS.amberDim,
  borderColor: MAP_COLORS.amberBorderStrong,
  color: MAP_COLORS.amber,
};

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatLabel(value: string): string {
  return value
    .split(/[_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: "#22C55E",
  good: "#3B82F6",
  fair: "#F59E0B",
  poor: "#EF4444",
};

function qualityColor(grade: string): string {
  return QUALITY_COLORS[grade] ?? MAP_COLORS.textMuted;
}

function formatNumber(value: number | undefined, decimals = 1): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

export const MapColumnarImportDialog: React.FC<MapColumnarImportDialogProps> = ({
  open,
  session,
  onClose,
  onImport,
}) => {
  if (!open || !session) return null;

  const formatLabelText = session.format === "geoparquet" ? "GeoParquet" : "Arrow";
  const geometryDescriptor = session.geometryColumn
    ? `${session.geometryColumn} (${formatLabel(session.geometryEncoding)})`
    : session.longitudeColumn && session.latitudeColumn
      ? `${session.longitudeColumn} / ${session.latitudeColumn} (Lon/Lat)`
      : formatLabel(session.geometryEncoding);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label={`${formatLabelText} schema preview`}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={badgeStyle}>{formatLabelText}</span>
            {session.geoParquet?.version ? <span style={{ ...badgeStyle, opacity: 0.8 }}>Geo {session.geoParquet.version}</span> : null}
            <span style={{ ...badgeStyle, borderColor: qualityColor(session.quality.grade), color: qualityColor(session.quality.grade), background: `${qualityColor(session.quality.grade)}18` }}>
              Quality {session.quality.score}/100 — {session.quality.grade}
            </span>
            {session.sizeComparison.savingsPercent > 0 ? (
              <span style={{ ...badgeStyle, borderColor: "#22C55E", color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>
                {session.sizeComparison.savingsPercent}% smaller than GeoJSON
              </span>
            ) : null}
          </div>

          <div>
            <div
              style={{
                color: MAP_COLORS.amber,
                fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
                fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              Review {formatLabelText} Import
            </div>
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.55, maxWidth: 860 }}>
              {session.fileName} is ready for commit. Inspect the column schema, geometry encoding,
              preview rows, and the projected memory footprint before publishing the dataset into the map workspace.
            </div>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Rows</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {session.importedFeatureCount.toLocaleString()} / {session.rowCount.toLocaleString()}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {session.skippedRowCount > 0
                ? `${session.skippedRowCount.toLocaleString()} rows will be skipped during geometry decoding.`
                : "All rows resolve to valid spatial features."}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Geometry</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{geometryDescriptor}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {session.geoParquet?.geometryTypes.length
                ? session.geoParquet.geometryTypes.join(", ")
                : "Geometry types will be inferred from decoded rows."}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Memory</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {formatBytes(session.estimatedMemoryBytes)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              Arrow IPC worker transfer: {formatBytes(session.transferSizeBytes)}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Worker Table</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
              {session.workerTableName}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              The dataset is staged for DuckDB-WASM worker transfer after import.
            </span>
          </div>

          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Data Quality</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: qualityColor(session.quality.grade), fontSize: 20, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{session.quality.score}</span>
              <span style={{ color: qualityColor(session.quality.grade), fontSize: 11, textTransform: "uppercase" }}>{session.quality.grade}</span>
            </div>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {Math.round(session.quality.completeness * 100)}% complete • {Math.round(session.quality.validity * 100)}% valid
            </span>
          </div>

          <div style={summaryCardStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Size vs GeoJSON</span>
            <span style={{ color: session.sizeComparison.savingsPercent > 0 ? "#22C55E" : MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {formatBytes(session.sizeComparison.columnarBytes)} → {formatBytes(session.sizeComparison.estimatedGeoJsonBytes)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {session.sizeComparison.savingsPercent > 0
                ? `Columnar is ${session.sizeComparison.savingsPercent}% smaller than equivalent GeoJSON.`
                : "Columnar is comparable in size to GeoJSON for this dataset."}
            </span>
          </div>
        </div>

        <div style={bodyStyle}>
          <div style={{ ...sectionStyle, borderRight: `1px solid ${MAP_COLORS.amberBorder}` }}>
            <div style={sectionTitleStyle}>Schema</div>
            <div style={tableShellStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "rgba(245,158,11,0.08)" }}>
                    {[
                      ["Field", 140],
                      ["Role", 70],
                      ["Type", 100],
                      ["Nulls", 52],
                      ["Unique", 52],
                      ["Min / Max", 120],
                    ].map(([label, minWidth]) => (
                      <th
                        key={label}
                        style={{
                          padding: "8px 8px",
                          textAlign: "left",
                          color: MAP_COLORS.amber,
                          borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
                          minWidth,
                          position: "sticky",
                          top: 0,
                          fontSize: 10,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {session.schema.map((field) => (
                    <tr key={field.name}>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, color: MAP_COLORS.text, fontSize: 11 }}>
                        {field.name}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: field.role === "geometry" ? MAP_COLORS.amber : field.role === "coordinate" ? "#38BDF8" : MAP_COLORS.textSecondary, fontSize: 10 }}>
                        {formatLabel(field.role)}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: MAP_COLORS.textSecondary, fontSize: 10 }}>
                        {field.type}{field.nullable ? "" : " • req"}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: (field.stats?.nullPercent ?? 0) > 50 ? "#EF4444" : MAP_COLORS.textMuted, fontSize: 10, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {field.stats ? `${field.stats.nullPercent}%` : "—"}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: MAP_COLORS.textMuted, fontSize: 10, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {field.stats?.uniqueCount?.toLocaleString() ?? "—"}
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: MAP_COLORS.textMuted, fontSize: 10, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {field.stats && field.role !== "geometry"
                          ? field.stats.mean !== undefined
                            ? `μ${formatNumber(field.stats.mean)} σ${formatNumber(field.stats.stddev)}`
                            : field.stats.min !== undefined
                              ? `${field.stats.min} … ${field.stats.max}`
                              : "—"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {session.warnings.length > 0 ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={sectionTitleStyle}>Validation Notes</div>
                <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: MAP_RADIUS.sm, border: `1px solid rgba(245,158,11,0.28)`, background: "rgba(245,158,11,0.06)" }}>
                  {session.warnings.map((warning) => (
                    <div key={warning} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{warning}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {(session.quality.sparseFields.length > 0 || session.quality.constantFields.length > 0) ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={sectionTitleStyle}>Quality Flags</div>
                <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: MAP_RADIUS.sm, border: `1px solid ${MAP_COLORS.amberBorder}`, background: "rgba(15,23,42,0.55)", fontSize: 11 }}>
                  {session.quality.sparseFields.length > 0 ? (
                    <div style={{ lineHeight: 1.5 }}>
                      <span style={{ color: "#EF4444" }}>Sparse (&gt;50% null): </span>
                      <span style={{ color: MAP_COLORS.textSecondary, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{session.quality.sparseFields.join(", ")}</span>
                    </div>
                  ) : null}
                  {session.quality.constantFields.length > 0 ? (
                    <div style={{ lineHeight: 1.5 }}>
                      <span style={{ color: MAP_COLORS.textMuted }}>Constant (single value): </span>
                      <span style={{ color: MAP_COLORS.textSecondary, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{session.quality.constantFields.join(", ")}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Preview Rows</div>
            <div style={tableShellStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "rgba(245,158,11,0.08)" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: MAP_COLORS.amber, borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, position: "sticky", top: 0 }}>Row</th>
                    {session.schema.map((field) => (
                      <th
                        key={`preview-${field.name}`}
                        style={{
                          padding: "8px 10px",
                          textAlign: "left",
                          color: MAP_COLORS.amber,
                          borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
                          minWidth: 110,
                          position: "sticky",
                          top: 0,
                        }}
                      >
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {session.previewRows.map((row) => (
                    <tr key={`row-${row.rowNumber}`}>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {row.rowNumber}
                      </td>
                      {session.schema.map((field) => (
                        <td key={`${row.rowNumber}-${field.name}`} style={{ padding: "8px 10px", borderBottom: `1px solid ${MAP_COLORS.amberBorder}`, color: MAP_COLORS.textSecondary, verticalAlign: "top" }}>
                          {row.values[field.name] || <span style={{ color: MAP_COLORS.textMuted }}>-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {session.geoParquet ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={sectionTitleStyle}>Spatial Metadata</div>
                <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: MAP_RADIUS.sm, border: `1px solid ${MAP_COLORS.amberBorder}`, background: "rgba(15,23,42,0.55)", fontSize: 11 }}>
                  {session.geoParquet.primaryColumn ? (
                    <div><span style={{ color: MAP_COLORS.textMuted }}>Primary column: </span><span>{session.geoParquet.primaryColumn}</span></div>
                  ) : null}
                  {session.geoParquet.crs ? (
                    <div><span style={{ color: MAP_COLORS.textMuted }}>CRS: </span><span>{session.geoParquet.crs}</span></div>
                  ) : null}
                  {session.geoParquet.bbox ? (
                    <div><span style={{ color: MAP_COLORS.textMuted }}>BBox: </span><span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{session.geoParquet.bbox.map((value) => value.toFixed(4)).join(", ")}</span></div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={footerStyle}>
          <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: 1.45, maxWidth: 540 }}>
            Import will publish a standard map layer for visual inspection and a worker-ready Arrow IPC transfer for downstream analytics.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={buttonStyle} onClick={onClose}>Cancel</button>
            <button type="button" style={primaryButtonStyle} onClick={onImport}>Import Dataset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapColumnarImportDialog;