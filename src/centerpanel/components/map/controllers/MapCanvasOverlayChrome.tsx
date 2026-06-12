import React from "react";

import { MapServiceDialog } from "../../MapServiceDialog";
import {
  MAP_RADIUS,
  MAP_Z_INDEX,
  mapStyles,
} from "../mapTokens";
import {
  type DispatchFeedbackState,
  feedbackAccent,
  formatBytes,
} from "./mapExplorerControllerHelpers";
import type { MapImportProgress } from "../../../../services/map/MapDataImporter";

interface MapCanvasOverlayChromeProps {
  announce: (message: string) => void;
  dispatchFeedback: DispatchFeedbackState | null;
  externalBounds: React.ComponentProps<typeof MapServiceDialog>["bounds"];
  externalBoundsLabel: React.ComponentProps<typeof MapServiceDialog>["boundsLabel"];
  handleExternalServiceLayerReady: React.ComponentProps<typeof MapServiceDialog>["onAddLayer"];
  handleExternalServiceProgress: React.ComponentProps<typeof MapServiceDialog>["onProgress"];
  handleOpenVoxCityOverlayFromService: React.ComponentProps<typeof MapServiceDialog>["onOpenVoxCityOverlay"];
  importLabel: string | null;
  importProgress: MapImportProgress | null;
  navigatorLeftInset: number;
  navigatorRightInset: number;
  overlayLayers: React.ComponentProps<typeof MapServiceDialog>["overlayLayers"];
  removeOverlayLayer: React.ComponentProps<typeof MapServiceDialog>["onRemoveLayer"];
  setShowExternalServiceDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showExternalServiceDialog: boolean;
  showImportProgress: boolean;
}

export const MapCanvasOverlayChrome: React.FC<MapCanvasOverlayChromeProps> = ({
  announce,
  dispatchFeedback,
  externalBounds,
  externalBoundsLabel,
  handleExternalServiceLayerReady,
  handleExternalServiceProgress,
  handleOpenVoxCityOverlayFromService,
  importLabel,
  importProgress,
  navigatorLeftInset,
  navigatorRightInset,
  overlayLayers,
  removeOverlayLayer,
  setShowExternalServiceDialog,
  showExternalServiceDialog,
  showImportProgress,
}) => (
  <>
    <MapServiceDialog
      open={showExternalServiceDialog}
      bounds={externalBounds}
      boundsLabel={externalBoundsLabel ?? null}
      overlayLayers={overlayLayers}
      onAddLayer={handleExternalServiceLayerReady}
      onRemoveLayer={removeOverlayLayer}
      onClose={() => {
        setShowExternalServiceDialog(false);
        handleExternalServiceProgress?.({ busy: false, label: null, progress: null });
        announce("External map services dialog closed");
      }}
      onAnnounce={announce}
      onProgress={handleExternalServiceProgress ?? (() => undefined)}
      onOpenVoxCityOverlay={handleOpenVoxCityOverlayFromService ?? (() => undefined)}
    />

    {showImportProgress ? (
      <div
        style={{
          ...mapStyles.importProgress,
          maxWidth: "calc(100% - var(--map-dock-left, 0px) - var(--map-dock-right, 0px) - 2rem)",
        }}
        role="status"
        aria-label={`Importing ${importLabel ?? "spatial data"} ${Math.round(importProgress?.percent ?? 0)} percent`}
        data-map-safe-inset-consumer="import-progress"
      >
        <div style={mapStyles.importProgressHeader}>
          <span>{importLabel ?? "Importing spatial data"}</span>
          <span>{Math.round(importProgress?.percent ?? 0)}%</span>
        </div>
        {importProgress?.stage || importProgress?.rowCount != null || importProgress?.estimatedMemoryBytes != null ? (
          <div style={mapStyles.importProgressMeta}>
            {importProgress?.stage ? (
              <span style={mapStyles.importProgressStage}>{importProgress.stage}</span>
            ) : null}
            {importProgress?.rowCount != null || importProgress?.estimatedMemoryBytes != null ? (
              <div style={mapStyles.importProgressStats}>
                <span>
                  {importProgress?.rowCount != null ? `${importProgress.rowCount.toLocaleString()} rows` : "Profiling rows"}
                </span>
                <span>
                  {importProgress?.estimatedMemoryBytes != null ? `~${formatBytes(importProgress.estimatedMemoryBytes)}` : "Calculating footprint"}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={mapStyles.importProgressTrack}>
          <div
            style={{ ...mapStyles.importProgressFill, width: `${Math.max(0, Math.min(importProgress?.percent ?? 0, 100))}%` }}
          />
        </div>
      </div>
    ) : null}

    {dispatchFeedback ? (
      <div
        style={{
          position: "absolute",
          top: "calc(var(--map-overlay-safe-top, calc(var(--map-shell-command-height, 2.75rem) + var(--map-overlay-safe-inset-y, 0.25rem))) + var(--map-canvas-control-dock-clearance, 9.75rem))",
          right: "calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))",
          width: 320,
          maxWidth: `calc(100% - ${navigatorLeftInset + navigatorRightInset}px)`,
          display: "grid",
          gap: 6,
          padding: "12px 14px",
          borderRadius: MAP_RADIUS.sm,
          border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.36))",
          background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.9))",
          zIndex: MAP_Z_INDEX.mapFurniture,
        }}
        data-map-safe-inset-consumer="dispatch-feedback"
        role="status"
        aria-live="polite"
      >
        <span style={{ color: feedbackAccent(dispatchFeedback.tone), fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {dispatchFeedback.title}
        </span>
        <span style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 12, lineHeight: 1.45 }}>
          {dispatchFeedback.description}
        </span>
      </div>
    ) : null}
  </>
);
