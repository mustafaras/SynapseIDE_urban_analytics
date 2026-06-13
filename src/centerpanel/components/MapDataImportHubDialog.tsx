import React from "react";
import { DatasetLibraryBrowser } from "../../features/education/DatasetLibraryBrowser";
import type { TeachingDatasetId } from "../../services/data/datasetLibrary";
import { MapDialogShell } from "./map/MapDialogShell";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "./map/mapTokens";

export interface MapDataImportHubDialogProps {
  open: boolean;
  loadingDatasetId?: TeachingDatasetId | null;
  onClose: () => void;
  onBrowseLocalFiles: () => void;
  onLoadDataset: (datasetId: TeachingDatasetId) => void | Promise<void>;
}

const primaryButtonStyle: React.CSSProperties = {
  border: `1px solid ${MAP_COLORS.focus}`,
  borderRadius: MAP_RADIUS.sm,
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  background: MAP_COLORS.interactionSubtle,
  color: MAP_COLORS.interaction,
};

const bodyStyle: React.CSSProperties = {
  overflow: "auto",
  padding: MAP_SPACING.md,
  display: "grid",
  gap: MAP_SPACING.md,
};

const localFormatSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const localFormatListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  padding: MAP_SPACING.sm,
  overflow: "hidden",
  background: MAP_COLORS.bg,
};

const localFormatGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const localFormatGroupHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: 3,
  color: MAP_COLORS.textSecondary,
  fontSize: 11,
};

const localFormatRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(6rem, 0.26fr) minmax(7rem, 0.3fr) minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  alignItems: "start",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const localFormatLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: MAP_COLORS.text,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const sourceStatusStripStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.md,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.56))",
};

const LOCAL_FORMAT_GROUPS = [
  {
    label: "Local vector files",
    summary: "Committed after modal preflight when the supported local path can produce map features.",
    formats: [
      {
        label: "GeoJSON / JSON",
        extensions: ".geojson, .json",
        description: "Direct feature publishing with topology validation and extent extraction; CRS is unknown unless trusted metadata declares it.",
      },
      {
        label: "CSV",
        extensions: ".csv",
        description: "Coordinate mapping workflow for point datasets with row preview and skipped-row diagnostics.",
      },
      {
        label: "KML / KMZ / GPX",
        extensions: ".kml, .kmz, .gpx",
        description: "Field traces and placemarks are converted without fabricating unsupported constructs or device semantics.",
      },
      {
        label: "Shapefile / GeoPackage",
        extensions: ".shp, .zip, .gpkg",
        description: "Shapefile sidecars and GeoPackage layer metadata are used when available; multi-layer packages require a selected layer.",
      },
    ],
  },
  {
    label: "Columnar vector",
    summary: "Supported with schema preview, memory estimate, and worker-transfer readiness.",
    formats: [
      {
        label: "Arrow / Feather / IPC",
        extensions: ".arrow, .feather, .ipc",
        description: "Columnar import with schema preview, row counts, worker transfer, and geometry decoding.",
      },
      {
        label: "GeoParquet / Parquet",
        extensions: ".geoparquet, .parquet",
        description: "GeoParquet metadata, CRS declarations, geometry column, quality scoring, and GeoJSON size comparison are surfaced before commit.",
      },
    ],
  },
  {
    label: "External or profile-only",
    summary: "Profiled or connected without claiming generic local full-file commit support.",
    formats: [
      {
        label: "FlatGeobuf / PMTiles",
        extensions: ".fgb, .pmtiles",
        description: "Local uploads remain metadata/profile-oriented; streaming/rendering uses URL, vector-tile, or range-capable source paths.",
      },
      {
        label: "WMS / WFS / XYZ / Overpass",
        extensions: "service URLs",
        description: "Use External Services; provider availability, CORS, credentials, rate limits, and attribution remain explicit caveats.",
      },
    ],
  },
  {
    label: "Raster and scene-specific",
    summary: "Handled by sampled raster or scene workflows, not generic full-resolution vector import.",
    formats: [
      {
        label: "GeoTIFF",
        extensions: ".tif, .tiff",
        description: "Sampled raster rendering with band histogram, noData handling, CRS caveats, and raster QA rather than full-resolution analytics.",
      },
      {
        label: "COG / STAC / CityJSON / 3D Tiles",
        extensions: "catalog or scene paths",
        description: "Scene and EO sources preserve source metadata, CRS/vertical caveats, and external dependency labels.",
      },
    ],
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
    <MapDialogShell
      ariaLabel="Spatial data import hub"
      title="Spatial Data Import Hub"
      subtitle="Connect real local files and external services with source preflight; configured teaching packs stay clearly labelled with CRS, schema, license, and provenance metadata."
      width="min(82rem, calc(100% - 2rem))"
      maxHeight="calc(100% - 2rem)"
      bodyStyle={bodyStyle}
      headerActions={(
        <button type="button" style={primaryButtonStyle} onClick={onBrowseLocalFiles}>
          Browse Local File
        </button>
      )}
      onClose={onClose}
    >
        <div style={sourceStatusStripStyle}>
          <div style={{ color: MAP_COLORS.text, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
            Source workflow
          </div>
          <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.55 }}>
            Local imports now commit only after source preflight. Service URLs, OSM/Overpass, STAC/EO, and scene sources remain configurable through their dedicated panels with provider caveats and attribution preserved.
          </div>
        </div>

          <div style={localFormatSectionStyle}>
            <div>
              <div style={{ color: MAP_COLORS.textMuted, fontSize: 12, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, marginBottom: 6, textTransform: "uppercase" }}>
                Source Support Matrix
              </div>
              <div style={{ color: MAP_COLORS.textSecondary, fontSize: 12, lineHeight: 1.55 }}>
                Local files now surface source quality before commit: CRS status, schema, size, skipped rows, license and attribution gaps, and worker readiness.
                Columnar formats now surface schema previews, worker transfer diagnostics, and geometry decoding notes.
              </div>
            </div>

            <div style={localFormatListStyle}>
              {LOCAL_FORMAT_GROUPS.map((group) => (
                <section key={group.label} style={localFormatGroupStyle}>
                  <div style={localFormatGroupHeaderStyle}>
                    <strong style={{ color: MAP_COLORS.text, fontSize: 11, textTransform: "uppercase" }}>{group.label}</strong>
                    <span>{group.summary}</span>
                  </div>
                  {group.formats.map((format) => (
                    <div key={format.label} style={localFormatRowStyle}>
                      <span style={localFormatLabelStyle}>{format.label}</span>
                      <div style={{ color: MAP_COLORS.textSecondary, fontSize: 11, fontFamily: MAP_TYPOGRAPHY.fontFamilyMono }}>
                        {format.extensions}
                      </div>
                      <div style={{ color: MAP_COLORS.textMuted, fontSize: 11, lineHeight: 1.55 }}>
                        {format.description}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>

          <DatasetLibraryBrowser
            onLoadDataset={onLoadDataset}
            loadingDatasetId={loadingDatasetId}
            introTitle="Configured city packs with explicit provenance"
            introText="Each package includes spatial extent thumbnails, thematic tags, source and license metadata, update date, CRS, and schema summaries. Loading a pack validates the bundle before publishing it to Map Explorer."
            testIdPrefix="map-import-dataset"
          />
    </MapDialogShell>
  );
};

export default MapDataImportHubDialog;
