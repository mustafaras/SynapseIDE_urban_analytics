import React from "react";
import type { MapCompositionOptions, MapPublicationReadiness } from "@/services/map/MapExportService";
import { MapCompositionLayout } from "./MapCompositionLayout";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";
import { MapDialogShell } from "./map/MapDialogShell";

export interface MapExportDialogProps {
  open: boolean;
  compositionOptions: MapCompositionOptions;
  legendAvailable?: boolean;
  visibleLayerCount?: number;
  readiness?: MapPublicationReadiness | null;
  previewUrl: string | null;
  isGeneratingPreview?: boolean;
  isExporting?: boolean;
  onCompositionChange: (patch: Partial<MapCompositionOptions>) => void;
  onClose: () => void;
  onExport: () => void;
  onOpenManifestInIde?: () => void;
  onOpenExportNoteInIde?: () => void;
}

const dialogBodyStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
  gap: 20,
  padding: 20,
  minHeight: 0,
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(13,13,13,0.82)",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  padding: 16,
};

const headingStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
  fontSize: 14,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  marginBottom: 16,
};

const previewShell: React.CSSProperties = {
  ...sectionStyle,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const previewFrame: React.CSSProperties = {
  minHeight: 360,
  background: MAP_COLORS.bg,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const buttonRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: MAP_SPACING.sm,
  marginTop: 16,
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 14px",
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

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.52,
  cursor: "not-allowed",
};

const readinessStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  paddingTop: 14,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const readinessHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const readinessBadgeStyle: React.CSSProperties = {
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  padding: "4px 7px",
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
};

const readinessListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 5,
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
  lineHeight: 1.42,
};

type VisibleReadinessStatus = MapPublicationReadiness["status"] | "needs-review" | "stale" | "unknown";

function getReadinessBadgeTone(status: VisibleReadinessStatus): React.CSSProperties {
  if (status === "blocked") return { color: MAP_COLORS.error, background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.34)" };
  if (status === "ready-with-caveats") return { color: MAP_COLORS.caveatText, background: MAP_COLORS.caveat, borderColor: MAP_COLORS.focus };
  if (status === "ready") return { color: MAP_COLORS.success, background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.28)" };
  if (status === "needs-review") return { color: MAP_COLORS.interaction, background: MAP_COLORS.interactionSubtle, borderColor: MAP_COLORS.focus };
  if (status === "stale") return { color: MAP_COLORS.textMuted, background: MAP_COLORS.neutralSubtle, borderColor: MAP_COLORS.hairlineStrong };
  return { color: MAP_COLORS.textSecondary, background: MAP_COLORS.neutralSubtle, borderColor: MAP_COLORS.hairlineStrong };
}

export const MapExportDialog: React.FC<MapExportDialogProps> = ({
  open,
  compositionOptions,
  legendAvailable = false,
  visibleLayerCount = 0,
  readiness = null,
  previewUrl,
  isGeneratingPreview = false,
  isExporting = false,
  onCompositionChange,
  onClose,
  onExport,
  onOpenManifestInIde,
  onOpenExportNoteInIde,
}) => {
  if (!open) return null;

  const exportBlocked = readiness?.status === "blocked";
  const readinessFindings = readiness ? (readiness.blockers.length > 0 ? readiness.blockers : readiness.warnings) : [];

  return (
    <MapDialogShell
      ariaLabel="Publication map export options"
      memoryKey="map-publication-export"
      title="Publication Export"
      subtitle="Compose the map figure, inspect readiness, and render the selected output format."
      width={1080}
      maxWidth="calc(100% - 2rem)"
      maxHeight="var(--map-dialog-max-height, calc(100% - 2rem))"
      bodyStyle={dialogBodyStyle}
      onClose={onClose}
    >
        <div style={sectionStyle}>
          <MapCompositionLayout
            options={compositionOptions}
            legendAvailable={legendAvailable}
            visibleLayerCount={visibleLayerCount}
            onChange={onCompositionChange}
          />

          {readiness ? (
            <section style={readinessStyle} aria-label="Publication readiness">
              <div style={readinessHeaderStyle}>
                <div style={headingStyle}>Publication readiness</div>
                <span style={{ ...readinessBadgeStyle, ...getReadinessBadgeTone(readiness.status) }}>
                  {readiness.status.replace(/-/g, " ")}
                </span>
              </div>
              <div style={{ color: MAP_COLORS.textMuted, fontSize: 11 }}>
                {readiness.blockers.length} blocker(s), {readiness.warnings.length} warning(s), {readiness.caveats.length} caveat(s)
              </div>
              {readinessFindings.length > 0 ? (
                <ul style={readinessListStyle}>
                  {readinessFindings.slice(0, 5).map((check) => <li key={`${check.criterion}-${check.message}`}>{check.message}</li>)}
                </ul>
              ) : null}
            </section>
          ) : null}

          <div style={buttonRow}>
            {onOpenManifestInIde ? (
              <button type="button" style={buttonStyle} onClick={onOpenManifestInIde}>
                IDE manifest
              </button>
            ) : null}
            {onOpenExportNoteInIde ? (
              <button type="button" style={buttonStyle} onClick={onOpenExportNoteInIde}>
                IDE note
              </button>
            ) : null}
            <button type="button" style={buttonStyle} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              style={{ ...primaryButtonStyle, ...(exportBlocked ? disabledButtonStyle : {}) }}
              onClick={onExport}
              disabled={isExporting || exportBlocked}
              title={exportBlocked ? "Resolve publication readiness blockers before creating a formal export." : undefined}
            >
              {isExporting
                ? `Rendering ${compositionOptions.format.toUpperCase()}...`
                : exportBlocked
                  ? "Export blocked"
                  : `Download ${compositionOptions.format.toUpperCase()}`}
            </button>
          </div>
        </div>

        <div style={previewShell}>
          <div style={headingStyle}>Preview</div>
          <div style={previewFrame}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Map export preview"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={{ color: MAP_COLORS.textMuted, fontSize: 12 }}>
                {isGeneratingPreview ? "Rendering preview..." : "Preview unavailable"}
              </div>
            )}
          </div>

          {isGeneratingPreview ? (
            <div style={{ color: MAP_COLORS.textMuted, fontSize: 11 }}>
              Refreshing preview with the latest settings...
            </div>
          ) : null}
        </div>
    </MapDialogShell>
  );
};

export default MapExportDialog;
