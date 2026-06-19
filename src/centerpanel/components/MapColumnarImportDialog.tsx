import React from "react";
import type { ColumnarImportSession } from "../../services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";
import { MapDialogShell } from "./map/MapDialogShell";

export interface MapColumnarImportDialogProps {
  open: boolean;
  session: ColumnarImportSession | null;
  onClose: () => void;
  onImport: () => void;
}

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
  maxWidth: "min(14rem, 46vw)",
  minWidth: 0,
};

const headerBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 0,
  padding: MAP_SPACING.zero,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const summaryCellStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: MAP_SPACING.md,
  borderRight: MAP_STROKES.hairlineSubtle,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const bodyStyle: React.CSSProperties = {
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
  gap: 0,
};

const sectionStyle: React.CSSProperties = {
  padding: MAP_SPACING.md,
  display: "grid",
  gap: 12,
  alignContent: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const tableShellStyle: React.CSSProperties = {
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  overflow: "auto",
  background: MAP_COLORS.bg,
};

const footerCaveatsStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  maxWidth: 560,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.caveat,
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

const tableHeaderRowStyle: React.CSSProperties = {
  background: MAP_COLORS.bgHeader,
};

const tableHeaderCellStyle: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  color: MAP_COLORS.textMuted,
  borderBottom: MAP_STROKES.hairlineSubtle,
  position: "sticky",
  top: 0,
  fontSize: 10,
  textTransform: "uppercase",
};

const tableCellStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
};

const infoPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
  fontSize: 11,
};

const caveatPanelStyle: React.CSSProperties = {
  ...infoPanelStyle,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.caveat,
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
  excellent: MAP_COLORS.success,
  good: MAP_COLORS.interaction,
  fair: MAP_COLORS.caveatText,
  poor: MAP_COLORS.error,
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
  const sourceProfile = session.result.sourceProfile;
  const geometryDescriptor = session.geometryColumn
    ? `${session.geometryColumn} (${formatLabel(session.geometryEncoding)})`
    : session.longitudeColumn && session.latitudeColumn
      ? `${session.longitudeColumn} / ${session.latitudeColumn} (Lon/Lat)`
      : formatLabel(session.geometryEncoding);
  const commitCaveats = Array.from(new Set([...sourceProfile.caveats, ...session.warnings])).slice(0, 6);

  return (
    <MapDialogShell
      ariaLabel={`${formatLabelText} schema preview`}
      title={`Review ${formatLabelText} Import`}
      subtitle={`${session.fileName} has been profiled for commit. Inspect the column schema, geometry encoding, preview rows, and the projected memory footprint before publishing the dataset into the map workspace.`}
      memoryKey="map.columnar-import"
      width={980}
      headerActions={
        <div style={headerActionsStyle}>
          <span style={headerBadgeStyle}>{formatLabelText}</span>
          {session.geoParquet?.version ? <span style={{ ...headerBadgeStyle, opacity: 0.8 }}>Geo {session.geoParquet.version}</span> : null}
        </div>
      }
      footerStyle={{ justifyContent: "space-between", alignItems: "flex-start" }}
      footer={
        <>
          <div style={footerCaveatsStyle} aria-label={`${formatLabelText} commit caveats`}>
            <div style={{ color: MAP_COLORS.caveatText, fontSize: 10, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, textTransform: "uppercase" }}>
              Commit caveats
            </div>
            {commitCaveats.length > 0 ? commitCaveats.map((caveat) => (
              <div key={caveat} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.45 }}>{caveat}</div>
            )) : (
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.45 }}>
                Import publishes a standard map layer and a worker-ready Arrow IPC transfer.
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={buttonStyle} onClick={onClose}>Cancel</button>
            <button type="button" style={primaryButtonStyle} onClick={onImport}>Import Dataset</button>
          </div>
        </>
      }
      onClose={onClose}
    >
        <div style={summaryGridStyle}>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Rows</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {session.importedFeatureCount.toLocaleString()} / {session.rowCount.toLocaleString()}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {session.skippedRowCount > 0
                ? `${session.skippedRowCount.toLocaleString()} rows will be skipped during geometry decoding.`
                : "All rows resolve to valid spatial features."}
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Geometry</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{geometryDescriptor}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {session.geoParquet?.geometryTypes.length
                ? session.geoParquet.geometryTypes.join(", ")
                : "Geometry types will be inferred from decoded rows."}
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Memory</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {formatBytes(session.estimatedMemoryBytes)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              Arrow IPC worker transfer: {formatBytes(session.transferSizeBytes)}
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Worker Table</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 13, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
              {session.workerTableName}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              The dataset is staged for DuckDB-WASM worker transfer after import.
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Data Quality</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: qualityColor(session.quality.grade), fontSize: 20, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{session.quality.score}</span>
              <span style={{ color: qualityColor(session.quality.grade), fontSize: 11, textTransform: "uppercase" }}>{session.quality.grade}</span>
            </div>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {Math.round(session.quality.completeness * 100)}% complete • {Math.round(session.quality.validity * 100)}% valid
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Source Preflight</span>
            <span style={{ color: sourceProfile.crsSummary.status === "known" ? MAP_COLORS.success : MAP_COLORS.caveatText, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {sourceProfile.crsSummary.crs ?? `CRS ${sourceProfile.crsSummary.status}`}
            </span>
            <span style={{ color: sourceProfile.workerReady ? MAP_COLORS.success : MAP_COLORS.textSecondary, fontSize: 11 }}>
              Worker {sourceProfile.workerReady ? "ready" : "not required"}; {sourceProfile.skippedRecordCount ?? session.skippedRowCount} skipped rows
            </span>
          </div>

          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Size vs GeoJSON</span>
            <span style={{ color: session.sizeComparison.savingsPercent > 0 ? MAP_COLORS.success : MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
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
          <div style={{ ...sectionStyle, borderRight: MAP_STROKES.hairlineSubtle }}>
            <div style={sectionTitleStyle}>Schema</div>
            <div style={tableShellStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
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
                          ...tableHeaderCellStyle,
                          padding: "8px 8px",
                          minWidth,
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
                      <td style={{ ...tableCellStyle, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, color: MAP_COLORS.text, fontSize: 11 }}>
                        {field.name}
                      </td>
                      <td style={{ ...tableCellStyle, color: field.role === "geometry" ? MAP_COLORS.interaction : field.role === "coordinate" ? MAP_COLORS.caveatText : MAP_COLORS.textSecondary }}>
                        {formatLabel(field.role)}
                      </td>
                      <td style={tableCellStyle}>
                        {field.type}{field.nullable ? "" : " • req"}
                      </td>
                      <td style={{ ...tableCellStyle, color: (field.stats?.nullPercent ?? 0) > 50 ? MAP_COLORS.error : MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {field.stats ? `${field.stats.nullPercent}%` : "—"}
                      </td>
                      <td style={{ ...tableCellStyle, color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {field.stats?.uniqueCount?.toLocaleString() ?? "—"}
                      </td>
                      <td style={{ ...tableCellStyle, color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
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
                <div style={caveatPanelStyle}>
                  {session.warnings.map((warning) => (
                    <div key={warning} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{warning}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {(session.quality.sparseFields.length > 0 || session.quality.constantFields.length > 0) ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={sectionTitleStyle}>Quality Flags</div>
                <div style={infoPanelStyle}>
                  {session.quality.sparseFields.length > 0 ? (
                    <div style={{ lineHeight: 1.5 }}>
                      <span style={{ color: MAP_COLORS.error }}>Sparse (&gt;50% null): </span>
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
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeaderCellStyle}>Row</th>
                    {session.schema.map((field) => (
                      <th
                        key={`preview-${field.name}`}
                        style={{
                          ...tableHeaderCellStyle,
                          minWidth: 110,
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
                      <td style={{ ...tableCellStyle, padding: "8px 10px", color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {row.rowNumber}
                      </td>
                      {session.schema.map((field) => (
                        <td key={`${row.rowNumber}-${field.name}`} style={{ ...tableCellStyle, padding: "8px 10px", verticalAlign: "top" }}>
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
                <div style={infoPanelStyle}>
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

    </MapDialogShell>
  );
};

export default MapColumnarImportDialog;
