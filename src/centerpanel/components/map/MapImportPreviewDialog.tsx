import React from "react";
import type { SourceProfile } from "@/services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./mapTokens";

export interface MapImportPreviewDialogProps {
  open: boolean;
  profile: SourceProfile | null;
  onClose: () => void;
  onImport?: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: MAP_COLORS.overlayBg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 42,
  padding: MAP_SPACING.lg,
};

const dialogStyle: React.CSSProperties = {
  width: 880,
  maxWidth: "calc(100vw - 48px)",
  maxHeight: "calc(100vh - 72px)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.sm,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

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

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
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

const caveatPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.caveat,
};

const boundedPreviewPanelStyle: React.CSSProperties = {
  ...caveatPanelStyle,
  borderColor: MAP_COLORS.caveatText,
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

function formatCount(value: number | null | undefined): string {
  return value == null ? "unknown" : value.toLocaleString();
}

function formatLabel(value: string): string {
  return value
    .split(/[_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function crsLabel(profile: SourceProfile): string {
  if (profile.crsSummary.crs) return profile.crsSummary.crs;
  return `CRS ${profile.crsSummary.status}`;
}

function supportTone(profile: SourceProfile): React.CSSProperties {
  if (profile.supportStatus === "supported") {
    return { borderColor: MAP_COLORS.success, color: MAP_COLORS.success };
  }
  if (profile.supportStatus === "partial") {
    return { borderColor: MAP_COLORS.caveatText, color: MAP_COLORS.caveatText, background: MAP_COLORS.caveat };
  }
  return { borderColor: MAP_COLORS.error, color: MAP_COLORS.error };
}

export const MapImportPreviewDialog: React.FC<MapImportPreviewDialogProps> = ({
  open,
  profile,
  onClose,
  onImport,
}) => {
  if (!open || !profile) return null;

  const importEnabled = Boolean(onImport && profile.canCommit);
  const disabledReason = profile.supportStatus === "partial"
    ? "This format is profiled here, but full commit support is scheduled for a later import hardening slice."
    : profile.featureCount === 0
      ? "This source contains no spatial features to commit."
      : "Resolve preflight blockers before commit.";

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Import source preflight">
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={badgeStyle}>{profile.format.toUpperCase()}</span>
            <span style={{ ...badgeStyle, ...supportTone(profile) }}>{formatLabel(profile.supportStatus)}</span>
            <span style={badgeStyle}>{profile.profileStrategy}</span>
            <span style={{ ...badgeStyle, color: profile.workerReady ? MAP_COLORS.success : MAP_COLORS.textMuted }}>
              Worker {profile.workerReady ? "ready" : "not required"}
            </span>
          </div>
          <div>
            <div
              style={{
                color: MAP_COLORS.text,
                fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
                fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              Review Source Before Import
            </div>
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.55, maxWidth: 760 }}>
              {profile.sourceName} has been profiled. Review CRS, schema, row quality, size, and worker readiness before committing it to the map workspace.
            </div>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Features</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{formatCount(profile.featureCount)}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {profile.totalRecords != null ? `${profile.totalRecords.toLocaleString()} source record(s)` : "Feature count from profile"}
            </span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Skipped Rows</span>
            <span style={{ color: (profile.skippedRecordCount ?? 0) > 0 ? MAP_COLORS.caveatText : MAP_COLORS.text, fontSize: 16, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {(profile.skippedRecordCount ?? 0).toLocaleString()}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {profile.skippedRecordCount ? `${profile.skippedRecordCount.toLocaleString()} skipped rows require review.` : "No skipped rows reported."}
            </span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>CRS</span>
            <span style={{ color: profile.crsSummary.status === "known" ? MAP_COLORS.success : MAP_COLORS.caveatText, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {crsLabel(profile)}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>{profile.crsSummary.notes[0] ?? "CRS review required."}</span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Size</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{formatBytes(profile.sizeBytes)}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>Memory estimate: {formatBytes(profile.estimatedMemoryBytes)}</span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Schema</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{profile.schemaSummary?.fieldCount ?? 0} fields</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {profile.schemaSummary?.fields.slice(0, 4).map((field) => field.name).join(", ") || "No attribute schema detected."}
            </span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>License</span>
            <span style={{ color: profile.license ? MAP_COLORS.text : MAP_COLORS.caveatText, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{profile.license ?? "unknown"}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>{profile.attribution ?? "Attribution not declared."}</span>
          </div>
        </div>

        <div style={bodyStyle}>
          {profile.rendering?.mode === "preview" ? (
            <div style={boundedPreviewPanelStyle} role="status" data-testid="map-import-bounded-preview-warning">
              <div style={{ color: MAP_COLORS.caveatText, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                Bounded preview mode
              </div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.5 }}>
                This source exceeds the interactive render budget. The map canvas will draw a bounded visual preview while the original source remains available for metadata, export, and worker-backed analysis.
              </div>
              <div style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 11 }}>
                Source {profile.rendering.featureCount.toLocaleString()} features / preview {(profile.rendering.previewFeatureCount ?? 0).toLocaleString()} features / budget {profile.rendering.renderFeatureLimit.toLocaleString()}.
              </div>
            </div>
          ) : null}

          {profile.extent ? (
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.55 }}>
              <span style={{ color: MAP_COLORS.textMuted, textTransform: "uppercase", fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Extent </span>
              <span style={{ fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>{profile.extent.map((value) => value.toFixed(5)).join(", ")}</span>
            </div>
          ) : null}

          {profile.caveats.length > 0 ? (
            <div style={caveatPanelStyle}>
              {profile.caveats.map((caveat) => (
                <div key={caveat} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{caveat}</div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={footerStyle}>
          <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: 1.45, maxWidth: 520 }}>
            {importEnabled ? "Import will publish this profiled source as a QA-aware layer." : disabledReason}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={buttonStyle} onClick={onClose}>Cancel</button>
            <button
              type="button"
              style={importEnabled ? primaryButtonStyle : { ...primaryButtonStyle, opacity: 0.55, cursor: "not-allowed" }}
              onClick={onImport}
              disabled={!importEnabled}
            >
              Import Source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapImportPreviewDialog;