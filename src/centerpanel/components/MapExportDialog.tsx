import React from "react";
import { DESIGN_TOKENS } from "@/constants/design";
import type { MapCompositionOptions, MapPublicationReadiness } from "@/services/map/MapExportService";
import { MapCompositionLayout } from "./MapCompositionLayout";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

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

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 50,
  background: "rgba(0,0,0,0.58)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const dialogStyle: React.CSSProperties = {
  width: 1080,
  maxWidth: "96vw",
  maxHeight: "92vh",
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "minmax(360px, 0.9fr) minmax(320px, 1.1fr)",
  gap: 20,
  padding: 20,
  borderRadius: MAP_RADIUS.lg,
  border: `1px solid ${DESIGN_TOKENS.glassmorphism.border.dark}`,
  background: DESIGN_TOKENS.glassmorphism.background.glassDark,
  backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.glassDark,
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(13,13,13,0.82)",
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  borderRadius: MAP_RADIUS.md,
  padding: 16,
};

const headingStyle: React.CSSProperties = {
  color: MAP_COLORS.amber,
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
  background: "linear-gradient(180deg, rgba(23,23,23,0.95), rgba(13,13,13,0.98))",
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  borderRadius: MAP_RADIUS.md,
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

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.52,
  cursor: "not-allowed",
};

const readinessStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  paddingTop: 14,
  borderTop: `1px solid ${MAP_COLORS.amberBorder}`,
};

const readinessHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const readinessBadgeStyle: React.CSSProperties = {
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
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

function getReadinessBadgeTone(status: MapPublicationReadiness["status"]): React.CSSProperties {
  if (status === "blocked") return { color: "#fca5a5", background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.34)" };
  if (status === "ready-with-caveats") return { color: MAP_COLORS.amber, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.34)" };
  return { color: "#86efac", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.28)" };
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Publication map export options">
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
      </div>
    </div>
  );
};

export default MapExportDialog;
