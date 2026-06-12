import React from "react";
import type { SourceProfile } from "@/services/map/MapDataImporter";
import {
  MAP_COLORS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";
import { useDraggableMapPanel } from "./useDraggableMapPanel";

export interface MapImportPreviewDialogProps {
  open: boolean;
  profile: SourceProfile | null;
  onClose: () => void;
  onImport?: () => void;
}

interface SourceFormatCard {
  id: string;
  label: string;
  detail: string;
  state: "active" | "supported" | "profile-only";
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: MAP_COLORS.overlayBg,
  zIndex: MAP_Z_INDEX.dialog,
  padding: MAP_SPACING.lg,
};

/* Shares the standard Map Explorer dialog footprint (--map-dialog-w/h) so
   every modal opens with the same geometry. */
const dialogStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "var(--map-dialog-w, min(1040px, calc(100vw - 4rem)))",
  maxWidth: "calc(100% - 2rem)",
  height: "var(--map-dialog-h, min(680px, calc(100vh - 10rem)))",
  maxHeight: "min(680px, calc(100% - 2rem))",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: 2,
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 2,
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

const formatCardsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 8,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const formatCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: MAP_SPACING.sm,
  borderRadius: 3,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const schemaSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: MAP_SPACING.sm,
  borderRadius: 3,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bg,
};

const schemaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(8rem, 1fr) minmax(6rem, 0.5fr) minmax(0, 1fr)",
  gap: 0,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: 3,
  overflow: "hidden",
};

const schemaHeaderCellStyle: React.CSSProperties = {
  padding: "6px 8px",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: 10,
  color: MAP_COLORS.textMuted,
  textTransform: "uppercase",
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const schemaCellStyle: React.CSSProperties = {
  padding: "7px 8px",
  fontSize: 11,
  color: MAP_COLORS.textSecondary,
  borderBottom: MAP_STROKES.hairlineSubtle,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const profileStatusRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 8,
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
  alignItems: "flex-end",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const footerNoteStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
  maxWidth: 560,
};

const footerCaveatsStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: MAP_SPACING.sm,
  borderRadius: 3,
  border: `1px solid ${MAP_COLORS.focus}`,
  background: MAP_COLORS.caveat,
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 3,
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
  borderRadius: 3,
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

function geometryLabel(profile: SourceProfile): string {
  return profile.geometrySummary?.geometryType ?? "unknown";
}

function geometryDetail(profile: SourceProfile): string {
  const summary = profile.geometrySummary;
  if (!summary) return "Geometry type was not exposed by this profile path.";
  if (summary.geometryTypes.length > 0) {
    return `${summary.geometryTypes.join(", ")} geometry; ${formatCount(summary.featureCount)} spatial feature(s).`;
  }
  return summary.notes[0] ?? "Geometry type requires review.";
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

function sourceFormatCards(profile: SourceProfile): SourceFormatCard[] {
  const activeFormat = profile.format.toUpperCase();
  return [
    {
      id: "active-format",
      label: activeFormat,
      detail: "Detected for this source",
      state: "active",
    },
    {
      id: "vector-support",
      label: "Vector formats",
      detail: "GeoJSON, KML, Shapefile ZIP, GeoPackage",
      state: "supported",
    },
    {
      id: "columnar-support",
      label: "Columnar formats",
      detail: "GeoParquet, Arrow IPC, Feather",
      state: "supported",
    },
    {
      id: "profile-only",
      label: "Profile-only formats",
      detail: "FlatGeobuf, PMTiles, selected services",
      state: "profile-only",
    },
  ];
}

function formatSampleValue(fieldName: string, profile: SourceProfile): string {
  if (profile.schemaSummary?.source === "feature-scan") {
    return `derived from ${fieldName}`;
  }
  return "sample unavailable";
}

export const MapImportPreviewDialog: React.FC<MapImportPreviewDialogProps> = ({
  open,
  profile,
  onClose,
  onImport,
}) => {
  const { panelPositionStyle, dragHandleProps, dragHandleStyle } = useDraggableMapPanel({ boundsPadding: 18 });

  React.useEffect(() => {
    if (!open || !profile) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, profile, onClose]);

  if (!open || !profile) return null;

  const importEnabled = Boolean(onImport && profile.canCommit);
  const disabledReason = profile.supportStatus === "partial"
    ? "This format is profiled here, but full commit support is scheduled for a later import hardening slice."
    : profile.featureCount === 0
      ? "This source contains no spatial features to commit."
      : "Resolve preflight blockers before commit.";
  const commitCaveats = profile.caveats.slice(0, 5);
  const formatCards = sourceFormatCards(profile);
  const schemaFields = profile.schemaSummary?.fields.slice(0, 8) ?? [];
  const profileSummary = [
    {
      label: "Profile stage",
      value: profile.profileStrategy.replace(/-/g, " "),
    },
    {
      label: "Profiled at",
      value: new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "2-digit",
      }).format(new Date(profile.profiledAt)),
    },
    {
      label: "Skipped rows",
      value: `${(profile.skippedRecordCount ?? 0).toLocaleString()} skipped`,
    },
  ];

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        style={{ ...dialogStyle, ...panelPositionStyle }}
        role="dialog"
        aria-modal="true"
        aria-label="Import source preflight"
        data-draggable-map-panel="true"
      >
        <div style={{ ...headerStyle, ...dragHandleStyle }} {...dragHandleProps}>
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

        <div style={formatCardsStyle} aria-label="Detected source format support">
          {formatCards.map((card) => (
            <div
              key={card.id}
              style={{
                ...formatCardStyle,
                borderColor: card.state === "active"
                  ? MAP_COLORS.focus
                  : card.state === "profile-only"
                    ? MAP_COLORS.caveatText
                    : MAP_COLORS.hairlineSubtle,
                background: card.state === "active" ? MAP_COLORS.interactionSubtle : MAP_COLORS.bg,
              }}
            >
              <span style={{ color: MAP_COLORS.text, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{card.label}</span>
              <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>{card.detail}</span>
            </div>
          ))}
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
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Geometry</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{geometryLabel(profile)}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>{geometryDetail(profile)}</span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Size</span>
            <span style={{ color: MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{formatBytes(profile.sizeBytes)}</span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>Memory estimate: {formatBytes(profile.estimatedMemoryBytes)}</span>
          </div>
          <div style={summaryCellStyle}>
            <span style={{ color: MAP_COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0 }}>Worker Transfer</span>
            <span style={{ color: profile.workerReady ? MAP_COLORS.success : MAP_COLORS.text, fontSize: 14, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
              {profile.workerReady ? "Ready" : "Not required"}
            </span>
            <span style={{ color: MAP_COLORS.textSecondary, fontSize: 11 }}>
              {profile.workerReady ? "Prepared for worker-backed import or analysis." : "Main-thread commit path; no worker table is staged."}
            </span>
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
          <section style={schemaSectionStyle} aria-label="Import profile progress and schema preview">
            <div style={profileStatusRowStyle}>
              {profileSummary.map((entry) => (
                <div key={entry.label} style={{ ...formatCardStyle, padding: "6px 8px" }}>
                  <span style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10, textTransform: "uppercase" }}>{entry.label}</span>
                  <span style={{ color: MAP_COLORS.text, fontSize: 12 }}>{entry.value}</span>
                </div>
              ))}
            </div>

            <div style={{ color: MAP_COLORS.textMuted, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono, fontSize: 10, textTransform: "uppercase" }}>
              Field/schema preview
            </div>
            <div style={schemaGridStyle} data-testid="map-import-schema-grid">
              <span style={schemaHeaderCellStyle}>Column</span>
              <span style={schemaHeaderCellStyle}>Type</span>
              <span style={schemaHeaderCellStyle}>Sample value</span>
              {schemaFields.length > 0 ? schemaFields.map((field) => (
                <React.Fragment key={field.name}>
                  <span style={schemaCellStyle} title={field.name}>{field.name}</span>
                  <span style={schemaCellStyle} title={field.type ?? "unknown"}>{field.type ?? "unknown"}</span>
                  <span style={schemaCellStyle} title={formatSampleValue(field.name, profile)}>{formatSampleValue(field.name, profile)}</span>
                </React.Fragment>
              )) : (
                <>
                  <span style={schemaCellStyle}>No fields detected</span>
                  <span style={schemaCellStyle}>n/a</span>
                  <span style={schemaCellStyle}>Preview unavailable for this source</span>
                </>
              )}
            </div>
          </section>

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
        </div>

        <div style={footerStyle}>
          <div style={footerNoteStackStyle}>
            <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: 1.45 }}>
              {importEnabled ? "Import will publish this profiled source as a QA-aware layer." : disabledReason}
            </div>
            {commitCaveats.length > 0 ? (
              <div style={footerCaveatsStyle} aria-label="Commit caveats">
                <div style={{ color: MAP_COLORS.caveatText, fontSize: 10, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, textTransform: "uppercase" }}>
                  Commit caveats
                </div>
                {commitCaveats.map((caveat) => (
                  <div key={caveat} style={{ color: MAP_COLORS.textSecondary, fontSize: 11, lineHeight: 1.45 }}>{caveat}</div>
                ))}
              </div>
            ) : null}
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
