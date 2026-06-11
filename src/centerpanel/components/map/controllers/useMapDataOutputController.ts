import React, { useCallback, useEffect } from "react";

/* eslint @typescript-eslint/no-explicit-any: "off" */

import { useRasterLayerStore } from "@/stores/useRasterLayerStore";
import { applyMapContextToUrban } from "../../../../features/urbanAnalytics/context/mapContextAdapter";
import { registerDashboardBinding } from "@/features/dashboard/dataBindings";
import { queuePendingDashboardBinding } from "@/features/dashboard/storage";
import { loadRealOsmCityIntoMapWorkspace, loadTeachingDatasetIntoMapWorkspace, type TeachingDatasetId } from "../../../../services/data/datasetLibrary";
import { loadArrowIPC } from "../../../../engine/spatial-db/SpatialDB";
import { buildMapDashboardBinding, buildMapEducationReference } from "../../../../services/map/MapPublicationOutputBindingService";
import { sendMapContextToUrban } from "../../../../services/map/MapToUrbanContextAdapter";
import {
  buildMapCompositionLegendItems,
  buildMapPublicationReadiness,
  calculateScaleBarSpec,
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  exportMapPublication,
  type MapCompositionOptions,
  mapPublicationReadinessToEvidenceQA,
  renderMapExportPreview,
  triggerMapPublicationDownload,
} from "../../../../services/map/MapExportService";
import { exportMapData, triggerMapDataDownload } from "../../../../services/map/MapDataExporter";
import { exportOfflineMapPackage, triggerOfflineMapPackageDownload } from "../../../../services/map/MapOfflinePackageService";
import { measureMapPerformance } from "../../../../services/map/MapPerformanceDiagnostics";
import {
  cacheConnectionMetadata,
  checkConnectionHealth,
  createConnectionDescriptor,
} from "../../../../services/map/sources/MapConnectionRegistry";
import {
  type ColumnarImportSession,
  completeCsvImport,
  IMPORT_PROGRESS_THRESHOLD_BYTES,
  type ImportedGeoJSONLayer,
  type ImportedRasterLayer,
  prepareMapImportFile,
} from "../../../../services/map/MapDataImporter";
import {
  buildUrbanToMapMethodRequestPayload,
  buildUrbanToMapMethodRequestPreview,
  type UrbanToMapMethodRequest,
} from "../../../../services/map/bridge/MapUrbanBridgeService";
import {
  attachSourceHandleToExternalLayer,
  buildCatalogConnectionLayer,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
} from "../catalog";
import { buildUserDeclaredCrsSummary } from "../mapLayerMetadata";
import type { MapQuickActionId } from "../mapExperience";
import type { MapEvidenceScalar, OverlayLayerConfig } from "../mapTypes";
import {
  buildReportHandoffComposition,
} from "./mapExplorerPublishHelpers";
import {
  formatBytes,
  isImportedRasterLayer,
  waitForMapCanvasCaptureMode,
} from "./mapExplorerControllerHelpers";
import { useMapReportEvidenceActions } from "./useMapReportEvidenceActions";
import { useMapReportHandoffActions } from "./useMapReportHandoffActions";
import { useMapUrbanBridgeController } from "./useMapUrbanBridgeController";
import {
  DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  type MapReportHandoffOptions,
  type MapReportHandoffSource,
} from "../../../../services/map/MapReportHandoffService";
import {
  createMapEvidenceArtifact,
  createMapExportEvidenceArtifact,
  createMapLayerEvidenceArtifact,
} from "../mapEvidenceArtifacts";
import { toastError, toastInfo, toastSuccess, toastWarning } from "../../../../ui/toast/api";

type UseMapDataOutputControllerArgs = Record<string, any>;

export function useMapDataOutputController(args: UseMapDataOutputControllerArgs) {
  const {
    activeAoiId,
    activeAnalysisResultLayerIds,
    activeBaseLayer,
    activeFlow,
    activeStyleLayer,
    activeUrbanMethodPreview,
    addOverlayLayer,
    announce,
    annotations,
    bearing,
    bookmarks,
    buildCurrentReviewSnapshot,
    closeFloatingRightPanels,
    closeMapStartDialog,
    closeRightDockPanels,
    completedRuns,
    contextSummary,
    currentMapBounds,
    csvLatitudeColumn,
    csvLongitudeColumn,
    dragCounterRef,
    drawnFeatures,
    exportFormat,
    exportIncludeProperties,
    exportPrecision,
    exportPrettyPrint,
    exportTarget,
    fitToBounds,
    getCurrentViewportState,
    handleFocusLayer,
    handleOpenPublishTab,
    handleOpenStyleTab,
    handleProjectSave,
    handleSetDrawTool,
    handleSetMeasureTool,
    handleSetWorkspaceView,
    importInputRef,
    mapCompositionOptions,
    mapEvidenceArtifacts,
    mapInstanceRef,
    mapPublicationReadiness,
    mapStartDialogState,
    open,
    openDataActivitySection,
    openRightDockPanel,
    overlayLayers,
    pendingColumnarImport,
    pendingCsvImport,
    pendingImportPreview,
    pins,
    recordMapReviewEvent,
    recordPerformanceTiming,
    reportHandoffDraft,
    reportHandoffOptions,
    reportHandoffSource,
    reviewSession,
    reducedMotion,
    scientificQA,
    selectedFeatureIds,
    selectedProjectId,
    setActiveDrawTool,
    setActiveMeasureTool,
    setActiveTool,
    setActiveUrbanMethodPreview,
    setActiveUrbanMethodRequest,
    setCsvLatitudeColumn,
    setCsvLongitudeColumn,
    setDispatchFeedback,
    setDrawSeed,
    setImportLabel,
    setImportProgress,
    setIsDragActive,
    setIsExportingMapImage,
    setIsExportingOfflinePackage,
    setIsExportingReportHandoffPdf,
    setIsGeneratingMapExportPreview,
    setIsGeneratingReportHandoffSnapshot,
    setIsImporting,
    setLoadingTeachingDatasetId,
    setMapCompositionOptions,
    setMapExportPreviewUrl,
    setMeasurementSeed,
    setPendingColumnarImport,
    setPendingCsvImport,
    setPendingImportPreview,
    setPointSymbologyLayerId,
    setReportHandoffOptions,
    setReportHandoffSnapshot,
    setReportHandoffSource,
    setSelectionDragTool,
    setShowChoroplethPanel,
    setShowDrawPanel,
    setShowExportDialog,
    setShowExternalServiceDialog,
    setShowImportHub,
    setShowImportProgress,
    setShowLayerPanel,
    setShowMapExportDialog,
    setShowMeasurePanel,
    setShowNLQueryPanel,
    setShowScientificQAPanel,
    setShowSidebar,
    setShowWorkflowDrawer,
    setUrbanWorkflowDraftRequest,
    setWorkflowPreview,
    setWorkspaceView,
    showMapExportDialog,
    sourceHandles,
    upsertMapEvidenceArtifact,
    upsertSourceHandle,
    updateLayerMetadata,
    visiblePublicationLayers,
    workflowContext,
  } = args;
  const resetImportUi = useCallback(() => {
    setIsImporting(false);
    setShowImportProgress(false);
    setImportProgress(null);
    setImportLabel(null);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  }, []);

  const clearPendingCsvImport = useCallback(() => {
    setPendingCsvImport(null);
    setCsvLatitudeColumn("");
    setCsvLongitudeColumn("");
  }, []);

  const clearPendingColumnarImport = useCallback(() => {
    setPendingColumnarImport(null);
  }, []);

  const clearPendingImportPreview = useCallback(() => {
    setPendingImportPreview(null);
  }, []);

  const registerLayerEvidenceCandidate = useCallback((
    layer: OverlayLayerConfig,
    sourceModule: "map-explorer" | "external-service",
  ) => {
    const metadata: Record<string, MapEvidenceScalar> = {
      sourceKind: layer.sourceKind ?? "project",
      layerType: layer.type,
      queryable: layer.queryable ?? false,
      qaStatus: layer.qaStatus ?? "unchecked",
    };
    const importSource = layer.metadata?.importSource;
    if (importSource) {
      metadata.importFormat = importSource.format;
      metadata.importedFeatureCount = importSource.importedFeatureCount;
      metadata.skippedRecordCount = importSource.skippedRecordCount ?? 0;
      metadata.sourceConfidence = importSource.sourceConfidence;
      metadata.workerTransferStatus = importSource.workerTransferStatus ?? "not-required";
    }
    const externalService = layer.metadata?.externalService;
    if (externalService) {
      metadata.externalServiceKind = externalService.kind;
      metadata.externalDependencyStatus = externalService.dependencyStatus ?? "unknown";
      metadata.externalEndpoint = externalService.endpoint;
      metadata.cacheHit = externalService.cacheHit ?? false;
      metadata.staleAt = externalService.staleAt ?? null;
    }

    const { sourceData: _sourceData, ...evidenceLayer } = layer;
    void _sourceData;

    const artifact = createMapLayerEvidenceArtifact(evidenceLayer, {
      sourceModule,
      metadata,
    });
    upsertMapEvidenceArtifact(artifact);
    return artifact;
  }, [upsertMapEvidenceArtifact]);

  const handleImportedLayerReady = useCallback(async (
    result: ImportedGeoJSONLayer,
    columnarSession?: ColumnarImportSession,
  ) => {
    upsertSourceHandle(result.sourceHandle);
    addOverlayLayer(result.layer);
    let layerForEvidence: OverlayLayerConfig = result.layer;

    const bounds = result.layer.metadata?.bounds ?? getFeatureCollectionBounds(result.featureCollection);
    if (bounds) {
      fitToBounds(bounds);
    }

    const summary = result.summary;
    let workerTransferReady = false;
    if (columnarSession) {
      try {
        await loadArrowIPC(columnarSession.workerTableName, columnarSession.arrowIPC);
        workerTransferReady = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Worker transfer failed.";
        toastWarning(`Imported ${result.layer.name}, but the columnar analytics worker could not be primed: ${message}`);
      }

      if (result.layer.metadata?.importSource && result.layer.metadata.scientificQA) {
        const workerTransferStatus = workerTransferReady ? "ready" : "failed";
        upsertSourceHandle({
          ...result.sourceHandle,
          restoreStatus: workerTransferReady ? "recoverable" : "unavailable",
          workerTableName: columnarSession.workerTableName,
          sourceRef: columnarSession.workerTableName,
          caveats: Array.from(new Set([
            ...result.sourceHandle.caveats,
            ...(workerTransferReady
              ? ["Columnar worker transfer is ready for local analytical previews."]
              : ["Columnar worker transfer failed; source must be re-imported before worker-backed analysis."]),
          ])),
        });
        const workerIssueId = `import-worker-${workerTransferStatus}-${result.layer.id}`;
        const existingQa = result.layer.metadata.scientificQA;
        const caveats = Array.from(new Set([
          ...result.layer.metadata.importSource.caveats,
          ...(workerTransferReady
            ? ["Columnar worker transfer is ready for local analytical previews."]
            : ["Columnar worker transfer failed; map layer remains visible, but columnar analytics should be retried before analysis."]),
        ]));
        const issueIds = workerTransferReady
          ? existingQa.issueIds.filter((issueId) => !issueId.includes("import-worker-pending") && !issueId.includes("import-worker-failed"))
          : Array.from(new Set([
            ...existingQa.issueIds.filter((issueId) => !issueId.includes("import-worker-pending")),
            workerIssueId,
          ]));
        const scientificQA = {
          ...existingQa,
          status: workerTransferReady ? existingQa.status : "warning",
          issueIds,
          caveats,
          signature: `${existingQa.signature}:${workerTransferStatus}`,
        } satisfies NonNullable<OverlayLayerConfig["metadata"]>["scientificQA"];
        const metadata = {
          ...result.layer.metadata,
          sourceRestoreStatus: workerTransferReady ? "recoverable" : "unavailable",
          importSource: {
            ...result.layer.metadata.importSource,
            workerTransferStatus,
            workerTableName: columnarSession.workerTableName,
            caveats,
          },
          ...(result.layer.metadata.persistence
            ? {
                persistence: {
                  ...result.layer.metadata.persistence,
                  sourceRestoreStatus: workerTransferReady ? "recoverable" as const : "unavailable" as const,
                  restoreState: workerTransferReady ? "metadata-only" as const : "stale-reference" as const,
                  restoreWarnings: workerTransferReady
                    ? result.layer.metadata.persistence.restoreWarnings
                    : ["Columnar worker transfer failed; source must be re-imported before worker-backed analysis."],
                },
              }
            : {}),
          scientificQA,
        } satisfies NonNullable<OverlayLayerConfig["metadata"]>;
        layerForEvidence = {
          ...result.layer,
          qaStatus: scientificQA.status,
          metadata,
        };
        updateLayerMetadata(result.layer.id, {
          qaStatus: scientificQA.status,
          metadata,
        });
      }
    }

    const recordImportEvidence = () => {
      try {
        const evidenceArtifact = registerLayerEvidenceCandidate(layerForEvidence, "map-explorer");
        recordMapReviewEvent({
          type: "layer-change",
          category: "layer-import",
          status: "recorded",
          title: `Import evidence registered: ${result.layer.name}`,
          summary: `${result.summary.sourceType.toUpperCase()} import added as a QA-aware evidence candidate with CRS ${layerForEvidence.metadata?.crsSummary?.crs ?? "unknown"}.`,
          layerIds: [result.layer.id],
          evidenceArtifactIds: [evidenceArtifact.id],
          actionIds: [evidenceArtifact.id],
          details: {
            evidenceArtifactId: evidenceArtifact.id,
            sourceType: result.summary.sourceType,
            featureCount: result.summary.importedFeatureCount,
            skippedRecordCount: result.summary.skippedRecordCount ?? 0,
            workerTransferReady,
            crsStatus: layerForEvidence.metadata?.crsSummary?.status ?? "unknown",
            licenseStatus: layerForEvidence.metadata?.licenseAttribution?.license ?? "unknown",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Evidence registration failed.";
        toastWarning(`Imported ${result.layer.name}, but evidence registration could not be completed: ${message}`);
      }
    };

    if (typeof globalThis.setTimeout === "function") {
      globalThis.setTimeout(recordImportEvidence, 0);
    } else {
      recordImportEvidence();
    }

    if (summary?.sourceType === "csv" && summary.totalRecords != null) {
      const skipped = summary.skippedRecordCount ?? 0;
      const imported = summary.importedFeatureCount;
      if (skipped > 0) {
        toastSuccess(
          `Imported ${imported.toLocaleString()} of ${summary.totalRecords.toLocaleString()} points (${skipped.toLocaleString()} rows skipped due to invalid coordinates).`,
        );
      } else {
        toastSuccess(`Imported ${imported.toLocaleString()} points from ${result.layer.name}.`);
      }
    } else if ((summary?.sourceType === "arrow" || summary?.sourceType === "geoparquet") && summary.totalRecords != null) {
      const skipped = summary.skippedRecordCount ?? 0;
      const imported = summary.importedFeatureCount;
      const baseMessage = skipped > 0
        ? `Imported ${imported.toLocaleString()} of ${summary.totalRecords.toLocaleString()} spatial rows from ${result.layer.name} (${skipped.toLocaleString()} rows skipped during geometry decoding).`
        : `Imported ${imported.toLocaleString()} spatial rows from ${result.layer.name}.`;
      toastSuccess(workerTransferReady ? `${baseMessage} Columnar worker transfer is ready for analytics.` : baseMessage);
    } else {
      toastSuccess(`Imported ${result.layer.name} (${result.featureCollection.features.length} features).`);
    }

    announce(`Imported layer ${result.layer.name}`);
  }, [addOverlayLayer, announce, fitToBounds, recordMapReviewEvent, registerLayerEvidenceCandidate, updateLayerMetadata, upsertSourceHandle]);

  const handleImportedRasterLayerReady = useCallback(async (result: ImportedRasterLayer) => {
    upsertSourceHandle(result.sourceHandle);
    const rasterStore = useRasterLayerStore.getState();
    rasterStore.registerRasterLayer(result.layer.id, result.renderConfig);
    const scientificQA = result.layer.metadata?.scientificQA;
    if (scientificQA) {
      rasterStore.applyInspection({
        layerId: result.layer.id,
        inspection: result.inspection,
        qa: scientificQA,
        histogram: result.histogram,
      });
    }
    addOverlayLayer(result.layer);
    if (result.layer.metadata?.bounds) {
      fitToBounds(result.layer.metadata.bounds);
    }

    const evidenceArtifact = registerLayerEvidenceCandidate(result.layer, "map-explorer");
    recordMapReviewEvent({
      type: "layer-change",
      category: "layer-import",
      status: "recorded",
      title: `Raster import evidence registered: ${result.layer.name}`,
      summary: `GEOTIFF import added as a sampled raster layer with ${result.summary.sampledPixelCount.toLocaleString()} sampled pixel(s), CRS ${result.layer.metadata?.crsSummary?.crs ?? "unknown"}, and QA state ${result.layer.qaStatus ?? "unchecked"}.`,
      layerIds: [result.layer.id],
      evidenceArtifactIds: [evidenceArtifact.id],
      actionIds: [evidenceArtifact.id],
      details: {
        evidenceArtifactId: evidenceArtifact.id,
        sourceType: result.summary.sourceType,
        rasterPixelCount: result.summary.rasterPixelCount,
        sampledPixelCount: result.summary.sampledPixelCount,
        bandCount: result.inspection.metadata.bandCount,
        noData: result.inspection.metadata.noData,
        crsStatus: result.layer.metadata?.crsSummary?.status ?? "unknown",
      },
    });

    toastSuccess(`Imported raster ${result.layer.name} as a sampled GeoTIFF layer.`);
    announce(`Imported raster layer ${result.layer.name}`);
  }, [addOverlayLayer, announce, fitToBounds, recordMapReviewEvent, registerLayerEvidenceCandidate, upsertSourceHandle]);

  const handleCatalogAddDemoPack = useCallback((insertion: MapCatalogLayerInsertion) => {
    if (mapStartDialogState.open) {
      closeMapStartDialog("demo-pack", "Map launch dialog dismissed");
    }

    for (const sourceHandle of insertion.sourceHandles) {
      upsertSourceHandle(sourceHandle);
    }
    for (const layer of insertion.layers) {
      addOverlayLayer(layer);
      registerLayerEvidenceCandidate(layer, "map-explorer");
    }
    handleSetWorkspaceView("explore");
    toastSuccess("Added synthetic demo pack with registered source records.");
    announce("Catalog added synthetic demo pack to the map");
  }, [addOverlayLayer, announce, closeMapStartDialog, handleSetWorkspaceView, mapStartDialogState.open, registerLayerEvidenceCandidate, upsertSourceHandle]);

  const handleCatalogBrowseSources = useCallback(() => {
    setShowImportHub(true);
    announce("Catalog opened the data import browser");
  }, [announce]);

  const handleStartDialogOpenSources = useCallback(() => {
    if (mapStartDialogState.open) {
      closeMapStartDialog("continue", "Map launch dialog dismissed");
    }
    setShowImportHub(true);
    announce("Opened data sources from the launch dialog");
  }, [announce, closeMapStartDialog, mapStartDialogState.open]);

  const handleCatalogRepairSource = useCallback((item: MapCatalogItem) => {
    setShowImportHub(true);
    announce(`Repair source requested for ${item.title}`);
  }, [announce]);

  const handleCatalogAddConnection = useCallback(async (
    draft: MapCatalogConnectionDraft,
  ): Promise<MapCatalogActionResult> => {
    try {
      const sourceId = `catalog-${draft.serviceKind}-${Date.now().toString(36)}`;
      const descriptor = createConnectionDescriptor({
        sourceId,
        serviceKind: draft.serviceKind,
        endpoint: draft.endpoint,
        title: draft.title,
        layerName: draft.title,
        ...(draft.urlTemplate ? { urlTemplate: draft.urlTemplate } : {}),
        ...(draft.crs ? { crs: draft.crs } : {}),
        ...(draft.license ? { license: draft.license } : {}),
        ...(draft.attribution ? { attribution: draft.attribution } : {}),
      });
      const health = await checkConnectionHealth(descriptor);
      const result = buildCatalogConnectionLayer(descriptor, health);
      cacheConnectionMetadata(descriptor, result.layer.metadata!.externalService!, health);
      upsertSourceHandle(result.sourceHandle);
      addOverlayLayer(result.layer);
      registerLayerEvidenceCandidate(result.layer, "external-service");
      const usable = health.dependencyStatus !== "offline";
      const message = usable
        ? `${draft.title} registered with ${health.dependencyStatus} service health.`
        : `${draft.title} registered but unavailable: ${health.offlineReason ?? "service health check failed."}`;
      if (usable) toastSuccess(message);
      else toastWarning(message);
      return { ok: usable, message, status: health.dependencyStatus };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection could not be registered.";
      toastWarning(message);
      return { ok: false, message };
    }
  }, [addOverlayLayer, registerLayerEvidenceCandidate, upsertSourceHandle]);

  const handleCatalogReconnectSource = useCallback(async (
    item: MapCatalogItem,
  ): Promise<MapCatalogActionResult> => {
    const sourceLayer = overlayLayers.find((layer) => item.layerIds.includes(layer.id));
    const externalService = sourceLayer?.metadata?.externalService;
    if (!sourceLayer || !externalService || externalService.kind === "cityjson") {
      setShowExternalServiceDialog(true);
      return { ok: false, message: "Open External Services to repair this connection record." };
    }
    try {
      const descriptor = createConnectionDescriptor({
        sourceId: item.sourceId ?? `source-${sourceLayer.id}`,
        serviceKind: externalService.kind,
        endpoint: externalService.endpoint,
        ...(externalService.title ? { title: externalService.title } : {}),
        ...(externalService.layerName ? { layerName: externalService.layerName } : {}),
        ...(externalService.urlTemplate ? { urlTemplate: externalService.urlTemplate } : {}),
        ...(externalService.crs ? { crs: externalService.crs } : {}),
        ...(externalService.license ? { license: externalService.license } : {}),
        ...(externalService.attribution ? { attribution: externalService.attribution } : {}),
      });
      const health = await checkConnectionHealth(descriptor);
      const refreshed = buildCatalogConnectionLayer(descriptor, health);
      cacheConnectionMetadata(descriptor, refreshed.layer.metadata!.externalService!, health);
      upsertSourceHandle(refreshed.sourceHandle);
      updateLayerMetadata(sourceLayer.id, {
        qaStatus: refreshed.layer.qaStatus,
        metadata: {
          ...(sourceLayer.metadata ?? {}),
          ...(refreshed.layer.metadata ?? {}),
        },
      });
      const ok = health.dependencyStatus !== "offline";
      const message = ok
        ? `${sourceLayer.name} service health is ${health.dependencyStatus}.`
        : `${sourceLayer.name} remains unavailable: ${health.offlineReason ?? "service health check failed."}`;
      return { ok, message, status: health.dependencyStatus };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Reconnect failed." };
    }
  }, [overlayLayers, updateLayerMetadata, upsertSourceHandle]);

  const handleDuplicateContentsLayer = useCallback((layer: OverlayLayerConfig) => {
    const duplicate = duplicateMapContentsLayer(layer);
    addOverlayLayer(duplicate);
    recordMapReviewEvent({
      type: "layer-change",
      status: "applied",
      title: `Layer duplicated: ${layer.name}`,
      summary: `Created ${duplicate.name} as a second view of the same source and retained its provenance and QA metadata.`,
      layerIds: [layer.id, duplicate.id],
      details: {
        sourceLayerId: layer.id,
        duplicateLayerId: duplicate.id,
        sourceId: layer.metadata?.sourceId ?? null,
        provenanceRetained: Boolean(layer.provenance || layer.metadata?.registry?.provenance),
      },
    });
    announce(`Duplicated layer ${layer.name}`);
  }, [addOverlayLayer, announce, recordMapReviewEvent]);

  const handleRepairContentsSource = useCallback((layer: OverlayLayerConfig) => {
    openDataActivitySection("data-health", `Source health opened to repair source for ${layer.name}`);
  }, [openDataActivitySection]);

  const handleExternalServiceLayerReady = useCallback((layer: OverlayLayerConfig) => {
    const registered = attachSourceHandleToExternalLayer(layer);
    upsertSourceHandle(registered.sourceHandle);
    addOverlayLayer(registered.layer);
    const evidenceArtifact = registerLayerEvidenceCandidate(registered.layer, "external-service");
    const dependencyStatus = registered.layer.metadata?.externalService?.dependencyStatus ?? "unknown";
    recordMapReviewEvent({
      type: "layer-change",
      status: dependencyStatus === "offline" ? "failed" : dependencyStatus === "stale" ? "previewed" : "recorded",
      title: `External service evidence registered: ${registered.layer.name}`,
      summary: `${registered.layer.metadata?.externalService?.kind?.toUpperCase() ?? "External"} layer added with dependency status ${dependencyStatus} and CRS ${registered.layer.metadata?.crsSummary?.crs ?? "unknown"}.`,
      layerIds: [registered.layer.id],
      actionIds: [evidenceArtifact.id],
      details: {
        evidenceArtifactId: evidenceArtifact.id,
        serviceKind: registered.layer.metadata?.externalService?.kind ?? null,
        endpoint: registered.layer.metadata?.externalService?.endpoint ?? null,
        dependencyStatus,
        cacheHit: registered.layer.metadata?.externalService?.cacheHit ?? false,
        staleAt: registered.layer.metadata?.externalService?.staleAt ?? null,
        crsStatus: registered.layer.metadata?.crsSummary?.status ?? "unknown",
        attribution: registered.layer.metadata?.licenseAttribution?.attribution ?? null,
      },
    });
  }, [addOverlayLayer, recordMapReviewEvent, registerLayerEvidenceCandidate, upsertSourceHandle]);

  const handleImportFiles = useCallback(async (files: FileList | File[] | null) => {
    const nextFile = files ? Array.from(files)[0] : null;
    if (!nextFile) return;

    clearPendingImportPreview();
    clearPendingCsvImport();
    clearPendingColumnarImport();
    setIsImporting(true);
    setImportProgress({
      loaded: 0,
      total: nextFile.size,
      percent: 0,
      stage: "Reading file",
    });
    setShowImportProgress(
      nextFile.size > IMPORT_PROGRESS_THRESHOLD_BYTES || /\.(arrow|feather|ipc|parquet|geoparquet|tif|tiff)$/i.test(nextFile.name),
    );
    setImportLabel(nextFile.name);

    try {
      const prepared = await prepareMapImportFile(nextFile, {
        onProgress: (progress) => {
          setImportProgress(progress);
        },
      });

      if (prepared.kind === "csv") {
        setPendingCsvImport(prepared.session);
        setCsvLatitudeColumn(prepared.session.suggestedLatitudeColumn ?? "");
        setCsvLongitudeColumn(prepared.session.suggestedLongitudeColumn ?? "");
        announce("CSV loaded. Select latitude and longitude columns to finish import.");
        return;
      }

      if (prepared.kind === "columnar") {
        setPendingColumnarImport(prepared.session);
        announce(`${prepared.session.format === "geoparquet" ? "GeoParquet" : "Arrow"} loaded. Review the schema preview to finish import.`);
        return;
      }

      if (prepared.kind === "profile") {
        setPendingImportPreview({ profile: prepared.profile });
        announce(`${prepared.profile.format.toUpperCase()} source profiled. Review source quality before import.`);
        return;
      }

      if (prepared.kind === "raster") {
        setPendingImportPreview({
          profile: prepared.result.sourceProfile,
          result: prepared.result,
        });
        announce("GEOTIFF source profiled. Review raster QA before import.");
        return;
      }

      setPendingImportPreview({
        profile: prepared.result.sourceProfile,
        result: prepared.result,
      });
      announce(`${(prepared.result.summary?.sourceType ?? prepared.result.sourceProfile.format).toUpperCase()} source profiled. Review source quality to finish import.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spatial import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    } finally {
      resetImportUi();
    }
  }, [announce, clearPendingColumnarImport, clearPendingCsvImport, clearPendingImportPreview, resetImportUi]);

  const handleImportPreviewConfirm = useCallback(async () => {
    if (!pendingImportPreview?.result) return;

    try {
      if (isImportedRasterLayer(pendingImportPreview.result)) {
        await handleImportedRasterLayerReady(pendingImportPreview.result);
      } else {
        await handleImportedLayerReady(pendingImportPreview.result);
      }
      clearPendingImportPreview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spatial import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    }
  }, [announce, clearPendingImportPreview, handleImportedLayerReady, handleImportedRasterLayerReady, pendingImportPreview]);

  const handleCsvImportConfirm = useCallback(async () => {
    if (!pendingCsvImport) return;

    try {
      await new Promise<void>((resolve) => {
        if (typeof globalThis.setTimeout === "function") {
          globalThis.setTimeout(resolve, 0);
          return;
        }
        resolve();
      });
      const result = completeCsvImport(pendingCsvImport, {
        latitudeColumn: csvLatitudeColumn,
        longitudeColumn: csvLongitudeColumn,
      });
      await handleImportedLayerReady(result);
      clearPendingCsvImport();
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    }
  }, [
    announce,
    clearPendingCsvImport,
    csvLatitudeColumn,
    csvLongitudeColumn,
    handleImportedLayerReady,
    pendingCsvImport,
  ]);

  const handleColumnarImportConfirm = useCallback(async () => {
    if (!pendingColumnarImport) return;

    try {
      await handleImportedLayerReady(pendingColumnarImport.result, pendingColumnarImport);
      clearPendingColumnarImport();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Columnar import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    }
  }, [announce, clearPendingColumnarImport, handleImportedLayerReady, pendingColumnarImport]);

  const handleImportRequest = useCallback(() => {
    if (mapStartDialogState.open) {
      closeMapStartDialog("import", "Map launch dialog dismissed");
    }
    setShowImportHub(true);
  }, [closeMapStartDialog, mapStartDialogState.open]);

  const handleBrowseLocalFiles = useCallback(() => {
    importInputRef.current?.click();
    setShowImportHub(false);
  }, []);

  const handleTeachingDatasetImport = useCallback(async (datasetId: TeachingDatasetId) => {
    setLoadingTeachingDatasetId(datasetId);
    try {
      // Prefer REAL OpenStreetMap data (buildings + roads, © ODbL) for a
      // CRS-safe central window so the loaded geometry aligns with the
      // actual street grid. Fall back to the deterministic synthetic
      // teaching fixture — labelled honestly — only when OSM is unreachable.
      try {
        const real = await loadRealOsmCityIntoMapWorkspace(datasetId);
        fitToBounds(real.window);
        setShowImportHub(false);
        toastSuccess(
          `Loaded real OpenStreetMap data for ${real.city}: ${real.roadCount} roads + ${real.buildingCount} buildings (© ODbL).`,
        );
        announce(`Loaded real OpenStreetMap data for ${real.city}`);
        
      } catch (osmError) {
        const reason = osmError instanceof Error ? osmError.message : "external service unavailable";
        const result = loadTeachingDatasetIntoMapWorkspace(datasetId);
        fitToBounds(result.dataset.spatialExtent.bounds);
        setShowImportHub(false);
        toastWarning(
          `Live OpenStreetMap data unavailable (${reason}). Loaded the synthetic ${result.dataset.city} teaching fixture instead — labelled as demo data.`,
        );
        announce(`OpenStreetMap unavailable; loaded synthetic teaching fixture for ${result.dataset.city}`);
        
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Teaching dataset import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    } finally {
      setLoadingTeachingDatasetId(null);
    }
  }, [announce, fitToBounds]);

  const handleExportRequest = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleMapExportRequest = useCallback(() => {
    if (!mapInstanceRef.current) {
      toastInfo("Map is still initializing. Try the publication export again in a moment.");
      return;
    }
    setShowMapExportDialog(true);
  }, []);

  const handleMapCompositionChange = useCallback((patch: Partial<MapCompositionOptions>) => {
    setMapCompositionOptions((current) => ({ ...current, ...patch }));
  }, []);

  const captureReportHandoffSnapshot = useCallback(async (
    source: MapReportHandoffSource,
    options: MapReportHandoffOptions = DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  ) => {
    const map = mapInstanceRef.current;
    const legendItems = buildMapCompositionLegendItems(visiblePublicationLayers);
    const scaleBarSpec = map ? calculateScaleBarSpec(map) : null;
    const attributionText = DEFAULT_MAP_COMPOSITION_OPTIONS.attributionText;

    setReportHandoffSnapshot({
      legendItems,
      scaleBarLabel: scaleBarSpec?.label ?? null,
      northArrowBearing: map?.getBearing() ?? bearing,
      attributionText,
    });

    if (!map) {
      toastInfo("Map is still initializing. Report handoff metadata is ready; refresh the snapshot in a moment.");
      return;
    }

    setIsGeneratingReportHandoffSnapshot(true);
    try {
      await waitForMapCanvasCaptureMode();
      const captureMap = mapInstanceRef.current;
      if (!captureMap) {
        throw new Error("Map canvas is not ready for report snapshot capture.");
      }
      const composition = buildReportHandoffComposition(source, options, captureMap);
      const result = await renderMapExportPreview(captureMap, {
        resolution: "screen",
        composition,
        overlayLayers: visiblePublicationLayers,
        maxPreviewWidth: 620,
      });
      setReportHandoffSnapshot({
        dataUrl: result.dataUrl,
        filename: result.filename,
        width: result.width,
        height: result.height,
        legendItems,
        scaleBarLabel: scaleBarSpec?.label ?? null,
        northArrowBearing: captureMap.getBearing(),
        attributionText,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Map report snapshot failed.";
      toastWarning(message);
      announce(`Report snapshot failed: ${message}`);
    } finally {
      setIsGeneratingReportHandoffSnapshot(false);
    }
  }, [announce, bearing, visiblePublicationLayers]);

  const {
    handleCloseReportHandoff,
    handleFeatureReportRequest,
    handleLayerReportRequest,
    handleOpenCurrentMapReportHandoff,
    handleReportHandoffOptionsChange,
  } = useMapReportHandoffActions({
    announce,
    captureReportHandoffSnapshot,
    closeFloatingRightPanels,
    closeRightDockPanels,
    overlayLayers,
    reportHandoffOptions,
    reportHandoffSource,
    setIsExportingReportHandoffPdf,
    setIsGeneratingReportHandoffSnapshot,
    setReportHandoffOptions,
    setReportHandoffSnapshot,
    setReportHandoffSource,
    setShowScientificQAPanel,
    setShowWorkflowDrawer,
    setUrbanWorkflowDraftRequest,
    setWorkflowPreview,
  });

  const handleBindLayerToDashboard = useCallback((layerId: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    if (!layer) {
      toastWarning("Layer is no longer available for dashboard binding.");
      announce("Dashboard binding failed: layer unavailable");
      return;
    }

    const layerPublicationReadiness = buildMapPublicationReadiness({
      mode: "public-map",
      overlayLayers: [{ ...layer, visible: true }],
      composition: { ...mapCompositionOptions, title: `${layer.name} dashboard binding` },
      scientificQA,
      legendItems: buildMapCompositionLegendItems([{ ...layer, visible: true }]),
    });
    const binding = buildMapDashboardBinding({
      layer,
      contextSummary,
      publicationReadiness: layerPublicationReadiness,
      evidenceArtifacts: mapEvidenceArtifacts,
    });

    if (!registerDashboardBinding(binding.dashboardBinding)) {
      toastError("Dashboard binding registry is unavailable; widget was not added.");
      announce("Dashboard binding failed: registry unavailable");
      return;
    }
    if (!queuePendingDashboardBinding({ bindingId: binding.bindingId, widgetType: binding.widgetType })) {
      toastError("Dashboard binding queue is unavailable; widget was not added.");
      announce("Dashboard binding failed: queue unavailable");
      return;
    }

    upsertMapEvidenceArtifact(createMapEvidenceArtifact({
      kind: "dashboard-binding",
      title: binding.title,
      summary: binding.summary,
      dashboardBindingId: binding.bindingId,
      linkedLayerIds: binding.layerIds,
      sourceLayerIds: binding.sourceLayerIds,
      linkedArtifactIds: binding.provenance.evidenceArtifactIds,
      qa: {
        state: binding.qa.state,
        issueIds: binding.qa.issueIds,
        blockerCount: binding.qa.blockerCount,
        caveats: binding.qa.caveats,
        ...(binding.qa.checkedAt ? { checkedAt: binding.qa.checkedAt } : {}),
      },
      provenance: {
        sourceModule: "map-explorer",
        sourceName: "Map dashboard binding",
        method: "MapPublicationOutputBindingService.buildMapDashboardBinding",
        sourceLayerIds: binding.sourceLayerIds,
        inputArtifactIds: binding.provenance.evidenceArtifactIds,
        parentArtifactIds: binding.provenance.evidenceArtifactIds,
        notes: binding.provenance.notes,
      },
      metadata: {
        ...binding.metadata,
        bindingVersion: binding.version,
        dashboardWidgetType: binding.widgetType,
        readinessId: layerPublicationReadiness.id,
      },
      createdAt: binding.dashboardBinding.updatedAt,
    }));
    recordMapReviewEvent({
      type: "action-status",
      status: "applied",
      title: "Dashboard binding queued",
      summary: `${layer.name} queued as a static dashboard map widget with QA state ${binding.qa.state}.`,
      layerIds: binding.layerIds,
      qaIssueIds: binding.qa.issueIds,
      actionIds: [binding.bindingId],
      details: {
        dashboardBindingId: binding.bindingId,
        widgetType: binding.widgetType,
        bindingMode: binding.bindingMode,
        refreshMode: binding.refreshMode,
        isLive: binding.isLive,
        qaState: binding.qa.state,
        caveatCount: binding.qa.caveats.length,
        evidenceArtifactIds: binding.provenance.evidenceArtifactIds,
        readinessStatus: layerPublicationReadiness.status,
      },
    });

    window.dispatchEvent(new CustomEvent("synapse:navigate", {
      detail: {
        tab: "Dashboard",
        dashboardBindingId: binding.bindingId,
        dashboardWidgetType: binding.widgetType,
        dashboardRequestedAt: Date.now(),
      },
    }));
    toastSuccess(`Queued ${layer.name} as a static dashboard map widget.`);
    announce(`${layer.name} dashboard binding queued`);
  }, [
    announce,
    contextSummary,
    mapCompositionOptions,
    mapEvidenceArtifacts,
    overlayLayers,
    recordMapReviewEvent,
    scientificQA,
    upsertMapEvidenceArtifact,
  ]);

  const handleOpenLayerEducationReference = useCallback((layerId: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    if (!layer) {
      toastWarning("Layer is no longer available for education reference.");
      announce("Education reference failed: layer unavailable");
      return;
    }

    const layerPublicationReadiness = buildMapPublicationReadiness({
      mode: "public-map",
      overlayLayers: [{ ...layer, visible: true }],
      composition: { ...mapCompositionOptions, title: `${layer.name} education reference` },
      scientificQA,
      legendItems: buildMapCompositionLegendItems([{ ...layer, visible: true }]),
    });

    const reference = buildMapEducationReference({
      layer,
      contextSummary,
      publicationReadiness: layerPublicationReadiness,
      evidenceArtifacts: mapEvidenceArtifacts,
    });
    upsertMapEvidenceArtifact(createMapEvidenceArtifact({
      kind: "education-reference",
      title: reference.title,
      summary: reference.summary,
      linkedLayerIds: reference.layerIds,
      sourceLayerIds: reference.layerIds,
      linkedArtifactIds: reference.evidenceArtifactIds,
      qa: {
        state: reference.qa.state,
        issueIds: reference.qa.issueIds,
        blockerCount: reference.qa.blockerCount,
        caveats: reference.qa.caveats,
        ...(reference.qa.checkedAt ? { checkedAt: reference.qa.checkedAt } : {}),
      },
      provenance: {
        sourceModule: "map-explorer",
        sourceName: "Map education reference",
        method: "MapPublicationOutputBindingService.buildMapEducationReference",
        sourceLayerIds: reference.layerIds,
        inputArtifactIds: reference.evidenceArtifactIds,
        parentArtifactIds: reference.evidenceArtifactIds,
        notes: reference.provenance.notes,
      },
      metadata: {
        ...reference.metadata,
        bindingVersion: reference.version,
        educationRationale: reference.target.rationale,
        readinessId: layerPublicationReadiness.id,
      },
      createdAt: new Date(reference.focusRequest.requestedAt).toISOString(),
    }));
    recordMapReviewEvent({
      type: "action-status",
      status: "applied",
      title: "Education reference opened",
      summary: `${layer.name} opened a static education reference for ${reference.topic}.`,
      layerIds: reference.layerIds,
      qaIssueIds: reference.qa.issueIds,
      actionIds: [reference.referenceId],
      details: {
        educationReferenceId: reference.referenceId,
        educationTopic: reference.topic,
        educationPathId: reference.target.pathId,
        educationExplainerId: reference.target.explainerId ?? null,
        bindingMode: reference.bindingMode,
        isLive: reference.isLive,
        qaState: reference.qa.state,
        evidenceArtifactIds: reference.evidenceArtifactIds,
        readinessStatus: layerPublicationReadiness.status,
      },
    });

    window.dispatchEvent(new CustomEvent("synapse:navigate", {
      detail: {
        tab: "Education",
        educationView: reference.focusRequest.view,
        educationPathId: reference.focusRequest.pathId,
        educationRequestedAt: reference.focusRequest.requestedAt,
        ...(reference.focusRequest.explainerId ? { educationExplainerId: reference.focusRequest.explainerId } : {}),
      },
    }));
    toastSuccess(`Opened ${reference.topic} guidance for ${layer.name}.`);
    announce(`${layer.name} education reference opened`);
  }, [
    announce,
    contextSummary,
    mapCompositionOptions,
    mapEvidenceArtifacts,
    overlayLayers,
    recordMapReviewEvent,
    scientificQA,
    upsertMapEvidenceArtifact,
  ]);

  const handleDeclareLayerCrs = useCallback((layerId: string, crs: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    if (!layer) return;
    const crsSummary = buildUserDeclaredCrsSummary(crs);
    updateLayerMetadata(layerId, { metadata: { ...layer.metadata, crsSummary } });
    announce(`Declared CRS ${crsSummary.crs} for ${layer.name} (user-declared, caveated).`);
  }, [announce, overlayLayers, updateLayerMetadata]);

  const handleSendLayerToUrban = useCallback((layerId: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    const result = sendMapContextToUrban({
      contextSummary,
      overlayLayers,
      drawnFeatures,
      activeAoiId,
      selectedFeatureIds,
      mapEvidenceArtifacts,
      scientificQA,
      activeWorkflowId: activeFlow,
      completedRunIds: completedRuns.map((run) => run.runId),
      requestedLayerId: layerId,
      receiver: (payload) => {
        const applied = applyMapContextToUrban({
          payload,
          triggerRecommendations: true,
        });
        return {
          contextId: applied.contextId,
          evidenceArtifactId: applied.evidenceArtifactId,
          recommendationTriggered: applied.recommendationTriggered,
          recommendationReason: applied.recommendationReason,
        };
      },
    });

    if (result.status === "blocked") {
      const reason = result.disabledReasons[0] ?? "No usable map context is available for Urban Analytics.";
      setDispatchFeedback({
        tone: "error",
        title: "Urban handoff blocked",
        description: reason,
      });
      toastWarning(reason);
      announce(`Urban Analytics handoff blocked: ${reason}`);
      recordMapReviewEvent({
        type: "action-status",
        status: "failed",
        title: "Urban handoff blocked",
        summary: reason,
        layerIds: [layerId],
        actionIds: [result.payload.payloadId],
        details: {
          payloadId: result.payload.payloadId,
          requestedLayerId: layerId,
          disabledReasons: result.disabledReasons,
          qaBlockingIssueCount: result.payload.qaSummary.blockingIssueIds.length,
        },
      });
      return;
    }

    const sentLayerCount = result.payload.layerSummaries.length;
    const evidenceCount = result.payload.evidenceSummaries.length;
    const selectedFeatureCount = result.payload.context.selection.totalSelectedFeatures;
    const layerLabel = layer?.name ?? "Map context";
    setDispatchFeedback({
      tone: "success",
      title: "Urban context sent",
      description: `${layerLabel} sent with ${sentLayerCount} layer summary(s), ${selectedFeatureCount} selected feature(s), and ${evidenceCount} evidence reference(s).`,
    });
    toastSuccess("Map context sent to Urban Analytics.");
    announce(`${layerLabel} context sent to Urban Analytics`);
    recordMapReviewEvent({
      type: "action-status",
      status: "applied",
      title: "Map context sent to Urban Analytics",
      summary: `Explicit Map to Urban handoff sent payload ${result.payload.payloadId} with ${sentLayerCount} layer summary(s) and ${evidenceCount} evidence reference(s).`,
      layerIds: [layerId],
      actionIds: [result.payload.payloadId],
      details: {
        payloadId: result.payload.payloadId,
        payloadVersion: result.payload.version,
        requestedLayerId: layerId,
        eventDispatched: result.eventDispatched,
        urbanContextId: result.urbanContextId,
        urbanEvidenceArtifactId: result.evidenceArtifactId,
        recommendationTriggered: result.recommendationTriggered,
        recommendationReason: result.recommendationReason,
        layerSummaryCount: sentLayerCount,
        selectedFeatureCount,
        evidenceSummaryCount: evidenceCount,
        visibleLayerCount: result.payload.visibleLayerIds.length,
        queryableLayerCount: result.payload.queryableLayerIds.length,
        qaStatus: result.payload.qaSummary.status,
        crsMissingLayerCount: result.payload.crsSummary.missingLayerIds.length,
      },
    });
  }, [
    activeAnalysisResultLayerIds,
    activeAoiId,
    activeFlow,
    announce,
    completedRuns,
    contextSummary,
    currentMapBounds,
    drawnFeatures,
    mapEvidenceArtifacts,
    overlayLayers,
    recordMapReviewEvent,
    scientificQA,
    selectedFeatureIds,
  ]);

  const handleUrbanToMapMethodRequest = useCallback((request: UrbanToMapMethodRequest) => {
    const canonicalRequest = buildUrbanToMapMethodRequestPayload(request);
    const preview = buildUrbanToMapMethodRequestPreview({
      request: canonicalRequest,
      contextSummary,
      overlayLayers,
      workflowContext,
      scientificQA,
    });
    const actionTypes = preview.requestedActions.map((action) => action.type);
    const compatibleLayerIds = preview.compatibleLayers
      .filter((layer) => layer.status !== "blocked")
      .map((layer) => layer.layerId);
    const feedbackDescription = preview.missingPrerequisites[0]
      ?? preview.warnings[0]
      ?? `${preview.methodLabel} is ready to preview with ${compatibleLayerIds.length} compatible layer${compatibleLayerIds.length === 1 ? "" : "s"}.`;

    setDispatchFeedback({
      tone: preview.status === "blocked" ? "error" : preview.status === "ready" ? "success" : "info",
      title: preview.status === "blocked" ? "Urban map request blocked" : "Urban map request previewed",
      description: feedbackDescription,
    });

    setWorkspaceView("explore");
    setActiveUrbanMethodRequest(canonicalRequest);
    setActiveUrbanMethodPreview(preview);
    closeRightDockPanels();
    closeFloatingRightPanels();
    setShowScientificQAPanel(false);
    setShowNLQueryPanel(false);
    setShowWorkflowDrawer(false);
    setUrbanWorkflowDraftRequest(null);
    setReportHandoffSource(null);
    setReportHandoffSnapshot(null);
    if (actionTypes.includes("focus-compatible-layers")) {
      setShowLayerPanel(true);
    }

    recordMapReviewEvent({
      type: "analysis-dispatch",
      status: "previewed",
      title: "Urban method request previewed",
      summary: `${preview.methodLabel} requested ${actionTypes.join(", ")} from Urban Analytics; Map Explorer produced a ${preview.status} preview without applying map mutations.`,
      layerIds: compatibleLayerIds,
      qaIssueIds: preview.qaBlockers.map((issue) => issue.issueId),
      actionIds: [canonicalRequest.requestId],
      details: {
        requestId: canonicalRequest.requestId,
        methodId: canonicalRequest.methodId,
        status: preview.status,
        actionTypes,
        compatibleLayerIds,
        blockedLayerIds: preview.blockedLayerIds,
        missingPrerequisites: preview.missingPrerequisites,
        warningCount: preview.warnings.length,
        qaBlockerCount: preview.qaBlockers.length,
        workflowKind: preview.workflowPreview?.workflow ?? null,
        workflowCanApply: preview.workflowPreview?.canApply ?? null,
        reportSnapshotStatus: preview.reportSnapshotPreview?.status ?? null,
      },
    });

    if (preview.status === "blocked") {
      toastWarning(feedbackDescription);
      announce(`Urban map request blocked: ${feedbackDescription}`);
      return;
    }
    toastInfo(feedbackDescription);
    announce(`Urban map request previewed: ${preview.methodLabel}`);
  }, [
    announce,
    closeFloatingRightPanels,
    closeRightDockPanels,
    contextSummary,
    overlayLayers,
    recordMapReviewEvent,
    scientificQA,
    workflowContext,
  ]);

  const handleCloseUrbanMethodRail = useCallback(() => {
    setActiveUrbanMethodRequest(null);
    setActiveUrbanMethodPreview(null);
    announce("Urban method compatibility rail closed");
  }, [announce]);

  const handleFocusUrbanMethodLayer = useCallback((layerId: string) => {
    handleFocusLayer(layerId);
    announce("Urban method compatible layer focused");
  }, [announce, handleFocusLayer]);

  const handlePreviewUrbanMethodWorkflow = useCallback(() => {
    if (!activeUrbanMethodPreview || activeUrbanMethodPreview.status === "blocked" || !activeUrbanMethodPreview.workflowDraftRequest) {
      return;
    }
    const draftRequest = activeUrbanMethodPreview.workflowDraftRequest;
    closeRightDockPanels();
    closeFloatingRightPanels();
    setActiveUrbanMethodRequest(null);
    setActiveUrbanMethodPreview(null);
    setUrbanWorkflowDraftRequest(draftRequest);
    setShowWorkflowDrawer(true);
    announce(`Workflow preview opened for ${activeUrbanMethodPreview.methodLabel}`);
  }, [activeUrbanMethodPreview, announce, closeFloatingRightPanels, closeRightDockPanels, setShowWorkflowDrawer, setUrbanWorkflowDraftRequest]);

  useMapUrbanBridgeController({
    open,
    reducedMotion,
    mapInstanceRef,
    onUrbanToMapMethodRequest: handleUrbanToMapMethodRequest,
  });

  const handleRefreshReportHandoffSnapshot = useCallback(() => {
    if (!reportHandoffSource) return;
    void captureReportHandoffSnapshot(reportHandoffSource, reportHandoffOptions);
  }, [captureReportHandoffSnapshot, reportHandoffOptions, reportHandoffSource]);

  const {
    handleDownloadReportHandoffPdf,
    handleInsertReportHandoff,
    handleRegisterReportEvidenceBlock,
  } = useMapReportEvidenceActions({
    announce,
    buildCurrentReviewSnapshot,
    mapInstanceRef,
    mapPublicationReadiness,
    recordMapReviewEvent,
    reportHandoffDraft,
    reportHandoffOptionsSnapshotFit: reportHandoffOptions.snapshotFit,
    reportHandoffSourceTitle: reportHandoffSource?.title,
    scientificQA,
    setIsExportingReportHandoffPdf,
    setReportHandoffSnapshot,
    setReportHandoffSource,
    toastError,
    toastSuccess,
    upsertMapEvidenceArtifact,
    visiblePublicationLayers,
    waitForMapCanvasCaptureMode,
  });

  const handleMapQuickAction = useCallback((actionId: MapQuickActionId) => {
    if (mapStartDialogState.open) {
      closeMapStartDialog(getMapStartDialogQuickActionHandoff(actionId), "Map launch dialog dismissed");
    }

    switch (actionId) {
      case "import-data":
        handleSetWorkspaceView("explore");
        handleImportRequest();
        break;
      case "review-layers":
        handleSetWorkspaceView("explore");
        setShowLayerPanel(true);
        break;
      case "review-problems":
        openRightDockPanel("problems", "QA Problems opened from Overview readiness cockpit", "quick-action");
        break;
      case "open-pins":
        handleSetWorkspaceView("explore");
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowSidebar(true);
        setShowDrawPanel(false);
        setShowMeasurePanel(false);
        setActiveTool("pin");
        announce("Pin mode enabled and pin sidebar opened");
        break;
      case "draw-aoi":
        handleSetWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowDrawPanel(true);
        handleSetDrawTool("polygon");
        break;
      case "measure":
        handleSetWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowMeasurePanel(true);
        handleSetMeasureTool("measure-distance");
        break;
      case "theme-data":
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        handleOpenStyleTab("style-renderer", "Renderer styling opened in Style", activeStyleLayer?.id ?? null);
        break;
      case "export-map":
        handleOpenPublishTab("publish-figure", "Publish Figure opened for map export");
        handleMapExportRequest();
        break;
      case "save-project":
        handleSetWorkspaceView("explore");
        void handleProjectSave();
        break;
      default:
        break;
    }
  }, [activeStyleLayer, announce, closeFloatingRightPanels, closeMapStartDialog, handleImportRequest, handleMapExportRequest, handleOpenPublishTab, handleOpenStyleTab, handleProjectSave, handleSetDrawTool, handleSetMeasureTool, handleSetWorkspaceView, mapStartDialogState.open, openRightDockPanel, setActiveTool]);

  const handleExportConfirm = useCallback(async () => {
    try {
      const { result, metric } = await measureMapPerformance({
        kind: "export",
        label: `${exportFormat.toUpperCase()} data export`,
      }, () => exportMapData({
        target: exportTarget,
        pins,
        drawings: drawnFeatures,
        overlayLayers,
        options: {
          format: exportFormat,
          precision: exportPrecision,
          prettyPrint: exportPrettyPrint,
          includeProperties: exportIncludeProperties,
        },
      }));
      recordPerformanceTiming({
        ...metric,
        featureCount: result.collection.features.length,
        byteLength: result.byteLength,
      });

      triggerMapDataDownload(result);
      setShowExportDialog(false);
      toastSuccess(
        result.format === "geoparquet"
          ? `Exported ${result.collection.features.length} features to ${result.filename} (${formatBytes(result.byteLength)}).`
          : `Exported ${result.collection.features.length} features to ${result.filename}.`,
      );
      if (result.skippedLayers.length > 0) {
        toastInfo(`Skipped non-GeoJSON layers: ${result.skippedLayers.join(", ")}`);
      }
      announce(`Export completed for ${exportTarget}`);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `${exportFormat === "geoparquet" ? "GeoParquet" : "GeoJSON"} export failed.`;
      toastError(message);
      announce(`Export failed: ${message}`);
    }
  }, [
    announce,
    drawnFeatures,
    exportFormat,
    exportIncludeProperties,
    exportPrecision,
    exportPrettyPrint,
    exportTarget,
    overlayLayers,
    pins,
    recordPerformanceTiming,
  ]);

  const handleOfflinePackageExport = useCallback(async () => {
    const hasPackageContent = pins.length > 0 ||
      bookmarks.length > 0 ||
      annotations.length > 0 ||
      drawnFeatures.length > 0 ||
      overlayLayers.length > 0 ||
      mapEvidenceArtifacts.length > 0;
    if (!hasPackageContent) {
      toastInfo("Add map content before exporting an offline package.");
      announce("Offline package export skipped: no map content");
      return;
    }

    setIsExportingOfflinePackage(true);
    try {
      const projectId = selectedProjectId ?? "map-session";
      const { result, metric } = await measureMapPerformance({
        kind: "export",
        label: "Offline reproducible package export",
        featureCount: overlayLayers.reduce((sum, layer) => sum + (layer.metadata?.featureCount ?? 0), 0),
      }, () => exportOfflineMapPackage({
        projectId,
        activeBaseLayer,
        viewport: getCurrentViewportState(),
        pins,
        bookmarks,
        annotations,
        drawnFeatures,
        overlayLayers,
        sourceHandles,
        mapEvidenceArtifacts,
        scientificQA,
        reviewSession,
      }));
      recordPerformanceTiming({
        ...metric,
        byteLength: result.byteLength,
      });
      triggerOfflineMapPackageDownload(result);
      recordMapReviewEvent(result.reviewEvent);
      toastSuccess(
        `Exported offline package ${result.filename} with ${result.packageManifest.embeddedSourceCount.toLocaleString()} embedded source${result.packageManifest.embeddedSourceCount === 1 ? "" : "s"}.`,
      );
      if (result.packageManifest.unavailableSourceCount > 0) {
        toastInfo(`${result.packageManifest.unavailableSourceCount.toLocaleString()} source${result.packageManifest.unavailableSourceCount === 1 ? "" : "s"} restored as unavailable metadata.`);
      }
      announce("Offline reproducible package exported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Offline package export failed.";
      toastError(message);
      announce(`Offline package export failed: ${message}`);
    } finally {
      setIsExportingOfflinePackage(false);
    }
  }, [
    activeBaseLayer,
    announce,
    annotations,
    bookmarks,
    drawnFeatures,
    getCurrentViewportState,
    mapEvidenceArtifacts,
    overlayLayers,
    pins,
    recordMapReviewEvent,
    recordPerformanceTiming,
    reviewSession,
    scientificQA,
    selectedProjectId,
    sourceHandles,
  ]);

  const handleMapExportConfirm = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) {
      toastError("Map canvas is not ready for export.");
      announce("Map export failed: canvas not ready");
      return;
    }
    if (mapPublicationReadiness.status === "blocked") {
      const message = mapPublicationReadiness.blockers[0]?.message ?? "Publication readiness blockers must be resolved before formal export.";
      toastError(message);
      announce(`Map publication export blocked: ${message}`);
      return;
    }

    setIsExportingMapImage(true);
    try {
      await waitForMapCanvasCaptureMode();
      const captureMap = mapInstanceRef.current;
      if (!captureMap) {
        throw new Error("Map canvas is not ready for export.");
      }
      const { result, metric } = await measureMapPerformance({
        kind: "export",
        label: `${mapCompositionOptions.format.toUpperCase()} publication export`,
        featureCount: visiblePublicationLayers.reduce((sum, layer) => sum + (layer.metadata?.featureCount ?? 0), 0),
      }, () => exportMapPublication(captureMap, {
        composition: mapCompositionOptions,
        overlayLayers: visiblePublicationLayers,
        scientificQA,
      }));
      recordPerformanceTiming(metric);

      triggerMapPublicationDownload(result);
      const readiness = result.readiness ?? mapPublicationReadiness;
      upsertMapEvidenceArtifact(createMapExportEvidenceArtifact({
        title: `${mapCompositionOptions.title || "Map publication"} export`,
        summary: `Formal ${result.format.toUpperCase()} export recorded with publication readiness status ${readiness.status}.`,
        exportReference: {
          exportId: result.manifest?.manifestId ?? result.filename,
          filename: result.filename,
          format: result.format,
          mimeType: result.mimeType,
        },
        linkedLayerIds: visiblePublicationLayers.map((layer) => layer.id),
        sourceLayerIds: visiblePublicationLayers.map((layer) => layer.id),
        qa: mapPublicationReadinessToEvidenceQA(readiness),
        metadata: {
          publicationReadinessStatus: readiness.status,
          readinessBlockerCount: readiness.blockers.length,
          readinessWarningCount: readiness.warnings.length,
          readinessCaveatCount: readiness.caveats.length,
          ...(result.manifest ? { manifestId: result.manifest.manifestId, manifestVersion: result.manifest.version } : {}),
        },
        createdAt: result.manifest?.createdAt ?? readiness.checkedAt,
      }));
      setShowMapExportDialog(false);
      toastSuccess(`${result.format.toUpperCase()} map publication rendered: ${result.filename}.`);
      announce("Map publication export completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Map publication export failed.";
      toastError(message);
      announce(`Map export failed: ${message}`);
    } finally {
      setIsExportingMapImage(false);
    }
  }, [
    announce,
    mapPublicationReadiness,
    mapCompositionOptions,
    recordPerformanceTiming,
    scientificQA,
    upsertMapEvidenceArtifact,
    visiblePublicationLayers,
  ]);

  useEffect(() => {
    if (!showMapExportDialog) {
      setMapExportPreviewUrl(null);
      setIsGeneratingMapExportPreview(false);
      return undefined;
    }

    let cancelled = false;
    const timerId = window.setTimeout(() => {
      setIsGeneratingMapExportPreview(true);
      void waitForMapCanvasCaptureMode()
        .then(() => {
          const captureMap = mapInstanceRef.current;
          if (!captureMap) {
            throw new Error("Map canvas is not ready for export preview.");
          }
          return renderMapExportPreview(captureMap, {
            resolution: "screen",
            composition: mapCompositionOptions,
            overlayLayers: visiblePublicationLayers,
            maxPreviewWidth: 520,
          });
        })
        .then((result) => {
          if (cancelled) return;
          setMapExportPreviewUrl(result.dataUrl);
        })
        .catch(() => {
          if (cancelled) return;
          setMapExportPreviewUrl(null);
        })
        .finally(() => {
          if (!cancelled) {
            setIsGeneratingMapExportPreview(false);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [
    mapCompositionOptions,
    showMapExportDialog,
    visiblePublicationLayers,
  ]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    await handleImportFiles(event.dataTransfer?.files ?? null);
  }, [handleImportFiles]);

  const handleStartMeasureFromContext = useCallback((coordinate: [number, number]) => {
    setWorkspaceView("analyze");
    setShowScientificQAPanel(false);
    closeFloatingRightPanels();
    setShowSidebar(false);
    setShowDrawPanel(false);
    setShowMeasurePanel(false);
    setSelectionDragTool(null);
    setActiveTool(null);
    setActiveDrawTool(null);
    setActiveMeasureTool("measure-distance");
    setMeasurementSeed({
      coordinate,
      tool: "measure-distance",
      token: Date.now(),
    });
    openRightDockPanel(
      "measure",
      "Measurement workspace opened in the right dock",
      "quick-action",
      "context-measure",
    );
  }, [closeFloatingRightPanels, openRightDockPanel, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const handleStartPolygonFromContext = useCallback((coordinate: [number, number]) => {
    setWorkspaceView("analyze");
    setShowScientificQAPanel(false);
    closeFloatingRightPanels();
    setShowSidebar(false);
    setShowMeasurePanel(false);
    setSelectionDragTool(null);
    setActiveTool(null);
    setActiveMeasureTool(null);
    setActiveDrawTool("polygon");
    openRightDockPanel("draw", "Draw workspace opened in the right dock", "quick-action", "context-draw");
    setDrawSeed({
      coordinate,
      tool: "polygon",
      token: Date.now(),
    });
  }, [closeFloatingRightPanels, openRightDockPanel, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);


  return {
    clearPendingColumnarImport,
    clearPendingCsvImport,
    clearPendingImportPreview,
    handleBindLayerToDashboard,
    handleBrowseLocalFiles,
    handleCatalogAddConnection,
    handleCatalogAddDemoPack,
    handleCatalogBrowseSources,
    handleCatalogReconnectSource,
    handleCatalogRepairSource,
    handleCloseReportHandoff,
    handleCloseUrbanMethodRail,
    handleColumnarImportConfirm,
    handleCsvImportConfirm,
    handleDeclareLayerCrs,
    handleDownloadReportHandoffPdf,
    handleDuplicateContentsLayer,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleExportConfirm,
    handleExportRequest,
    handleExternalServiceLayerReady,
    handleFeatureReportRequest,
    handleFocusUrbanMethodLayer,
    handleImportFiles,
    handleImportPreviewConfirm,
    handleImportRequest,
    handleInsertReportHandoff,
    handleLayerReportRequest,
    handleMapCompositionChange,
    handleMapExportConfirm,
    handleMapExportRequest,
    handleMapQuickAction,
    handleOfflinePackageExport,
    handleOpenCurrentMapReportHandoff,
    handleOpenLayerEducationReference,
    handlePreviewUrbanMethodWorkflow,
    handleRefreshReportHandoffSnapshot,
    handleRegisterReportEvidenceBlock,
    handleRepairContentsSource,
    handleReportHandoffOptionsChange,
    handleSendLayerToUrban,
    handleStartDialogOpenSources,
    handleStartMeasureFromContext,
    handleStartPolygonFromContext,
    handleTeachingDatasetImport,
  };
}
