import React from "react";

import { MapLegendOverlay } from "../inspector/style/MapLegendOverlay";
import { MapLayoutDesignerPanel } from "../layout/MapLayoutDesignerPanel";
import {
  MapPublicationMarksPanel,
  MapPublishOutputInventory,
  type MapPublishPathAction,
  type MapPublishPathMeta,
  MapPublishPathPanel,
} from "../publish";
import { getSerializedLegendSpecFromStyle } from "../inspector/style/legendContract";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../mapTokens";
import {
  type buildDataExportInventory,
  type buildOfflinePackageInventory,
  type buildReportHandoffInventory,
  formatCompactList,
} from "./mapExplorerPublishHelpers";

interface BuildMapPublishWorkspaceElementsArgs {
  annotationCount: number;
  annotationMode: boolean;
  bearing: number;
  bookmarkCount: number;
  dataExportActions: MapPublishPathAction[];
  dataExportInventory: ReturnType<typeof buildDataExportInventory>;
  dataExportMeta: MapPublishPathMeta[];
  exportDisabledReason: string | undefined;
  exportFormat: "geojson" | "geoparquet";
  figureActions: MapPublishPathAction[];
  figureMeta: MapPublishPathMeta[];
  handleOpenPublishTab: (tabId: "publish-data-export" | "publish-report" | "publish-review-package", announcement: string) => void;
  handleTemporalRestoreRequestHandled: React.ComponentProps<typeof MapLayoutDesignerPanel>["onRestoreRequestHandled"];
  mapPublicationLegendItems: React.ComponentProps<typeof MapLegendOverlay>["items"];
  mapPublicationReadinessCaveats: string[];
  offlineActions: MapPublishPathAction[];
  offlineMeta: MapPublishPathMeta[];
  offlinePackageInventory: ReturnType<typeof buildOfflinePackageInventory>;
  overlayLayers: React.ComponentProps<typeof MapLayoutDesignerPanel>["overlayLayers"];
  packageExportDisabled: boolean;
  packageExportDisabledReason: string;
  pinCount: number;
  pinSidebarVisible: boolean;
  publishBoundsLabel: string;
  publishBoundsStatus: GisStatusKey;
  publishEvidenceIds: string[];
  reportActions: MapPublishPathAction[];
  reportDisabledReason: string | undefined;
  reportDrawer: React.ReactNode;
  reportHandoffInventory: ReturnType<typeof buildReportHandoffInventory>;
  reportMeta: MapPublishPathMeta[];
  reviewActions: MapPublishPathAction[];
  reviewMeta: MapPublishPathMeta[];
  scientificQA: React.ComponentProps<typeof MapLayoutDesignerPanel>["qaState"];
  setShowFigureComposer: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLayerPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMapExportDialog: React.Dispatch<React.SetStateAction<boolean>>;
  temporalLayoutRestoreRequest: React.ComponentProps<typeof MapLayoutDesignerPanel>["restoreRequest"];
  toggleAnnotationMode: () => void;
  togglePinSidebar: () => void;
  visiblePublicationLayerIds: string[];
  visiblePublicationLayers: React.ComponentProps<typeof MapLayoutDesignerPanel>["overlayLayers"];
  announce: (message: string) => void;
}

type BuildMapPublishWorkspaceElementsResult = {
  dataExport: React.ReactNode;
  figure: React.ReactNode;
  offlinePackage: React.ReactNode;
  report: React.ReactNode;
  reviewPackage: React.ReactNode;
};

export const buildMapPublishWorkspaceElements = ({
  annotationCount,
  annotationMode,
  bearing,
  bookmarkCount,
  dataExportActions,
  dataExportInventory,
  dataExportMeta,
  exportDisabledReason,
  exportFormat,
  figureActions,
  figureMeta,
  handleOpenPublishTab,
  handleTemporalRestoreRequestHandled,
  mapPublicationLegendItems,
  mapPublicationReadinessCaveats,
  offlineActions,
  offlineMeta,
  offlinePackageInventory,
  overlayLayers,
  packageExportDisabled,
  packageExportDisabledReason,
  pinCount,
  pinSidebarVisible,
  publishBoundsLabel,
  publishBoundsStatus,
  publishEvidenceIds,
  reportActions,
  reportDisabledReason,
  reportDrawer,
  reportHandoffInventory,
  reportMeta,
  reviewActions,
  reviewMeta,
  scientificQA,
  setShowFigureComposer,
  setShowLayerPanel,
  setShowMapExportDialog,
  temporalLayoutRestoreRequest,
  toggleAnnotationMode,
  togglePinSidebar,
  visiblePublicationLayerIds,
  visiblePublicationLayers,
  announce,
}: BuildMapPublishWorkspaceElementsArgs): BuildMapPublishWorkspaceElementsResult => {
  const renderPublicationMarksPanel = () => (
    <MapPublicationMarksPanel
      annotationCount={annotationCount}
      pinCount={pinCount}
      bookmarkCount={bookmarkCount}
      annotationMode={annotationMode}
      pinSidebarVisible={pinSidebarVisible}
      onToggleAnnotationMode={toggleAnnotationMode}
      onTogglePinSidebar={togglePinSidebar}
      onOpenDataExport={() => handleOpenPublishTab("publish-data-export", "Publication mark data export opened")}
      onOpenReport={() => handleOpenPublishTab("publish-report", "Publication mark report handoff opened")}
      onOpenReviewPackage={() => handleOpenPublishTab("publish-review-package", "Publication mark review package opened")}
    />
  );
  const visibleLegendSpecs = visiblePublicationLayers
    .map((layer) => getSerializedLegendSpecFromStyle(layer.style))
    .filter((spec) => spec !== null);
  const legendContractWarnings = visibleLegendSpecs.flatMap((spec) =>
    spec.warnings.map((warning) => `${spec.layerName}: ${warning}`),
  );
  const legendNoDataClassCount = visibleLegendSpecs.filter((spec) => spec.noData.enabled).length;
  const publishLegendParityElement = (
    <section
      style={{
        display: "grid",
        gap: MAP_SPACING.sm,
        paddingTop: MAP_SPACING.sm,
        borderTop: MAP_STROKES.hairlineSubtle,
      }}
      aria-label="Legend contract parity"
      data-testid="map-publish-legend-parity-panel"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
        <h4 style={{ margin: 0, color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.sm, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
          Legend contract
        </h4>
        <span style={mapStyles.sidePanelMetricValue}>{mapPublicationLegendItems.length.toLocaleString()} item{mapPublicationLegendItems.length === 1 ? "" : "s"}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs }} data-testid="map-publish-legend-parity-targets">
        {["Map", "Inspector", "Report", "Export"].map((target) => (
          <span key={target} style={mapStyles.sidePanelMetricLabel}>{target}</span>
        ))}
        <span style={legendNoDataClassCount > 0 ? { ...mapStyles.sidePanelMetricLabel, color: MAP_COLORS.caveatText } : mapStyles.sidePanelMetricLabel}>
          {legendNoDataClassCount.toLocaleString()} noData
        </span>
        <span style={legendContractWarnings.length > 0 ? { ...mapStyles.sidePanelMetricLabel, color: MAP_COLORS.caveatText } : mapStyles.sidePanelMetricLabel}>
          {legendContractWarnings.length.toLocaleString()} caveats
        </span>
      </div>
      <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-publish-legend-parity-items">
        {mapPublicationLegendItems.length > 0 ? mapPublicationLegendItems.slice(0, 8).map((item, index) => (
          <div
            key={`${item.label}-${item.secondaryLabel ?? "legend"}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1rem minmax(0, 1fr) auto",
              alignItems: "center",
              gap: MAP_SPACING.sm,
              padding: MAP_SPACING.xs,
              borderBottom: MAP_STROKES.hairlineSubtle,
            }}
          >
            <span
              aria-hidden
              style={{
                width: item.kind === "line" ? "1rem" : "0.9rem",
                height: item.kind === "line" ? "0.25rem" : "0.9rem",
                borderRadius: item.kind === "circle" || item.kind === "dot-density" ? MAP_RADIUS.full : MAP_RADIUS.xs,
                border: MAP_STROKES.hairlineSubtle,
                background: item.kind === "label" ? MAP_COLORS.transparent : item.color,
                color: item.color,
                fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
                lineHeight: 1,
              }}
            >
              {item.kind === "label" ? "Aa" : null}
            </span>
            <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
              <span style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.xs, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
              {item.secondaryLabel ? (
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.secondaryLabel}
                </span>
              ) : null}
            </span>
            <span style={mapStyles.sidePanelMetricLabel}>{item.kind}</span>
          </div>
        )) : (
          <div style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
            No legend items
          </div>
        )}
      </div>
      {legendContractWarnings.length > 0 ? (
        <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-publish-legend-parity-caveats">
          {legendContractWarnings.slice(0, 3).map((warning) => (
            <span key={warning} style={{ color: MAP_COLORS.caveatText, fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>
              {warning}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );

  return {
    figure: (
      <MapPublishPathPanel
        eyebrow="Map image"
        title="Figure and map image"
        description="Figure composition uses the visible layer stack, cartographic elements, attribution text, CRS caveats, and publication readiness checks before rendering."
        meta={figureMeta}
        actions={figureActions}
      >
        {publishLegendParityElement}
        {renderPublicationMarksPanel()}
        <MapLayoutDesignerPanel
          visible
          presentation="embedded"
          overlayLayers={overlayLayers}
          qaState={scientificQA}
          bearing={bearing}
          restoreRequest={temporalLayoutRestoreRequest}
          onClose={() => {
            setShowFigureComposer(false);
            setShowLayerPanel(false);
            announce("Layout designer closed");
          }}
          onExportBook={(_book) => {
            setShowFigureComposer(false);
            setShowMapExportDialog(true);
            announce("Map book exported — opening publication export");
          }}
          onRestoreRequestHandled={handleTemporalRestoreRequestHandled}
          onAnnounce={announce}
        />
      </MapPublishPathPanel>
    ),
    dataExport: (
      <MapPublishPathPanel
        eyebrow="Spatial data"
        title="GeoJSON and GeoParquet export"
        description="Data export keeps the selected target, GeoJSON precision controls, GeoParquet spatial metadata, skipped-layer notices, and feature-property rules in the existing export dialog."
        meta={dataExportMeta}
        actions={dataExportActions}
      >
        <MapPublishOutputInventory
          outputType={`${exportFormat === "geoparquet" ? "GeoParquet" : "GeoJSON"} FeatureCollection — vector geometry + properties`}
          outputTypeNote="Only visible vector (GeoJSON/heatmap) layers with in-memory geometry are written. Raster, vector-tile, and external-service layers are excluded, and coordinates are exported in their source CRS without reprojection."
          included={dataExportInventory.included}
          excluded={dataExportInventory.excluded}
          bounds={publishBoundsLabel}
          boundsStatus={publishBoundsStatus}
          evidenceIds={publishEvidenceIds}
          caveats={dataExportInventory.caveats}
          {...(exportDisabledReason ? { disabledReason: exportDisabledReason } : {})}
        />
        {publishLegendParityElement}
        {renderPublicationMarksPanel()}
      </MapPublishPathPanel>
    ),
    report: (
      <MapPublishPathPanel
        eyebrow="Report handoff"
        title="Snapshot and structured evidence"
        description="Report handoff carries the current snapshot, citations, structured references, caveats, attribution, and evidence block into the report builder."
        meta={reportMeta}
        actions={reportActions}
      >
        <MapPublishOutputInventory
          outputType="Static report snapshot (raster image) + structured evidence block and citations"
          outputTypeNote="The snapshot is a rendered raster image of the current map, not live or queryable data. Layer geometry and source bytes are not embedded; evidence travels as references."
          included={reportHandoffInventory.included}
          excluded={reportHandoffInventory.excluded}
          bounds={publishBoundsLabel}
          boundsStatus={publishBoundsStatus}
          evidenceIds={publishEvidenceIds}
          caveats={reportHandoffInventory.caveats}
          {...(reportDisabledReason ? { disabledReason: reportDisabledReason } : {})}
        />
        {publishLegendParityElement}
        {renderPublicationMarksPanel()}
        {reportDrawer}
      </MapPublishPathPanel>
    ),
    offlinePackage: (
      <MapPublishPathPanel
        eyebrow="Offline package"
        title="Bounded reproducibility package"
        description="Offline package export preserves project state, source handles, bounded inline source sidecars, unavailable-source caveats, review events, and evidence references."
        meta={offlineMeta}
        actions={offlineActions}
      >
        <MapPublishOutputInventory
          outputType="Offline package (.zip) — snapshot metadata, styles, manifests, review timeline, evidence references"
          outputTypeNote="Only inline vector sources within the 1 MB limit are embedded. External, worker-table, DuckDB, URL, and oversized sources are referenced and are NOT recoverable from the package alone."
          included={offlinePackageInventory.included}
          excluded={offlinePackageInventory.excluded}
          sourceRestore={offlinePackageInventory.sourceRestore}
          bounds={publishBoundsLabel}
          boundsStatus={publishBoundsStatus}
          evidenceIds={publishEvidenceIds}
          caveats={offlinePackageInventory.caveats}
          includedLabel="Embedded in package"
          excludedLabel="Referenced only (not embedded)"
          emptyIncludedLabel="No inline sources qualify for embedding; all sources are referenced."
          {...(packageExportDisabled ? { disabledReason: packageExportDisabledReason } : {})}
        />
        {publishLegendParityElement}
        {renderPublicationMarksPanel()}
      </MapPublishPathPanel>
    ),
    reviewPackage: (
      <MapPublishPathPanel
        eyebrow="Review package"
        title="Pre-handoff metadata review"
        description="Review package lists the readiness outcome, source bounds, caveats, evidence IDs, review timeline, and export notes before any formal output is handed off."
        meta={reviewMeta}
        actions={reviewActions}
      >
        {publishLegendParityElement}
        {renderPublicationMarksPanel()}
        <div style={{ display: "grid", gap: MAP_SPACING.sm, color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs, lineHeight: MAP_TYPOGRAPHY.lineHeight.normal }}>
          <div>
            <strong style={{ color: MAP_COLORS.text }}>Evidence IDs:</strong>{" "}
            {formatCompactList(publishEvidenceIds, "No evidence IDs attached", 8)}
          </div>
          <div>
            <strong style={{ color: MAP_COLORS.text }}>Visible layer IDs:</strong>{" "}
            {formatCompactList(visiblePublicationLayerIds, "No visible overlay layers", 8)}
          </div>
          <div>
            <strong style={{ color: MAP_COLORS.text }}>QA caveats:</strong>{" "}
            {formatCompactList(mapPublicationReadinessCaveats, "No caveats required by readiness", 3)}
          </div>
        </div>
      </MapPublishPathPanel>
    ),
  };
};
