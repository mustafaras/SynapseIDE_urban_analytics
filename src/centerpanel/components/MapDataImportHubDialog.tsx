import React from "react";
import { DatasetLibraryBrowser } from "../../features/education/DatasetLibraryBrowser";
import type { TeachingDatasetId } from "../../services/data/datasetLibrary";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapDataImportHubDialogProps {
  open: boolean;
  loadingDatasetId?: TeachingDatasetId | null;
  onClose: () => void;
  onBrowseLocalFiles: () => void;
  onLoadDataset: (datasetId: TeachingDatasetId) => void | Promise<void>;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 41,
  padding: 24,
};

const dialogStyle: React.CSSProperties = {
  width: 1280,
  maxWidth: "calc(100vw - 48px)",
  maxHeight: "calc(100vh - 72px)",
  display: "grid",
  gridTemplateRows: "auto 1fr",
  overflow: "hidden",
  background: MAP_COLORS.bgPanel,
  border: `1px solid ${MAP_COLORS.amberBorderStrong}`,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: MAP_SPACING.lg,
  borderBottom: `1px solid ${MAP_COLORS.amberBorder}`,
  background:
    "radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 28%), linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.82))",
};

const actionStripStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: MAP_RADIUS.sm,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  background: "linear-gradient(90deg, rgba(245,158,11,0.94), rgba(217,119,6,0.98))",
  color: "#111827",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  borderRadius: MAP_RADIUS.sm,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  background: "transparent",
  color: MAP_COLORS.textSecondary,
};

const bodyStyle: React.CSSProperties = {
  overflow: "auto",
  padding: MAP_SPACING.lg,
  display: "grid",
  gap: MAP_SPACING.lg,
};

const localFormatSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const localFormatGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const localFormatCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  padding: 12,
  borderRadius: MAP_RADIUS.sm,
  border: `1px solid ${MAP_COLORS.amberBorder}`,
  background: "rgba(15,23,42,0.55)",
};

const localFormatBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
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

const LOCAL_FORMATS = [
  {
    label: "GeoJSON",
    extensions: ".geojson, .json",
    description: "Direct feature publishing with topology validation and extent extraction.",
  },
  {
    label: "CSV",
    extensions: ".csv",
    description: "Coordinate mapping workflow for lat/lon point datasets with row preview.",
  },
  {
    label: "Arrow",
    extensions: ".arrow, .feather, .ipc",
    description: "Columnar import with schema preview, quality scoring, row counts, worker transfer, and geometry decoding.",
  },
  {
    label: "GeoParquet",
    extensions: ".geoparquet, .parquet",
    description: "Spatial metadata-aware columnar import with CRS, geometry column, quality scoring, and GeoJSON size comparison.",
  },
  {
    label: "KML / KMZ / GPX",
    extensions: ".kml, .kmz, .gpx",
    description: "Interoperability path for field traces, placemarks, and archival map packages.",
  },
] as const;

export const MapDataImportHubDialog: React.FC<MapDataImportHubDialogProps> = ({
  open,
  loadingDatasetId = null,
  onClose,
  onBrowseLocalFiles,
  onLoadDataset,
}) => {
  if (!open) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay click dismiss
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-label="Spatial data import hub">
        <div style={headerStyle}>
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
              Spatial Data Import Hub
            </div>
            <div style={{ color: MAP_COLORS.textSecondary, fontSize: 13, lineHeight: 1.55, maxWidth: 900 }}>
              Load a curated teaching city pack with validated CRS and schema metadata, or continue with a local GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, or GPX file.
            </div>
          </div>

          <div style={actionStripStyle}>
            <div style={{ color: MAP_COLORS.textMuted, fontSize: 12, lineHeight: 1.5 }}>
              Teaching datasets auto-configure the map workspace and publish multiple ready-to-inspect layers. Local files remain available for ad hoc imports.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={primaryButtonStyle} onClick={onBrowseLocalFiles}>
                Browse Local File
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>

        <div style={bodyStyle}>
          <div style={localFormatSectionStyle}>
            <div>
              <div style={{ color: MAP_COLORS.amber, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, marginBottom: 6 }}>
                Local Format Matrix
              </div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.55 }}>
                Columnar formats now surface schema previews, field statistics, quality scores, projected memory load, and worker-transfer readiness before commit.
              </div>
            </div>

            <div style={localFormatGridStyle}>
              {LOCAL_FORMATS.map((format) => (
                <div key={format.label} style={localFormatCardStyle}>
                  <span style={localFormatBadgeStyle}>{format.label}</span>
                  <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                    {format.extensions}
                  </div>
                  <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: 1.55 }}>
                    {format.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DatasetLibraryBrowser
            onLoadDataset={onLoadDataset}
            loadingDatasetId={loadingDatasetId}
            introTitle="Curated city packs for demonstration, onboarding, and benchmarking"
            introText="Each package includes spatial extent thumbnails, thematic tags, source and license metadata, update date, CRS, and schema summaries. Loading a pack validates the bundle before publishing it to Map Explorer."
            testIdPrefix="map-import-dataset"
          />
        </div>
      </div>
    </div>
  );
};

export default MapDataImportHubDialog;