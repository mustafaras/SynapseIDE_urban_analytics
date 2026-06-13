import React, { Suspense } from "react";

/* eslint @typescript-eslint/no-explicit-any: "off" */

import { MapVoxCityOverlay } from "../../MapVoxCityOverlay";
import { MapHeatmapLayer } from "../../MapHeatmapLayer";
import { MapSymbolLayer } from "../../MapSymbolLayer";
import { BASE_STYLES, MAP_BOOKMARK_LIMIT, type BaseLayerId, type OverlayLayerConfig } from "../mapTypes";
import { type GisStatusKey, mapStyles } from "../mapTokens";
import { MapWorkspaceOverviewSummary } from "../MapWorkspaceOverviewSummary";
import type { MapWorkbenchSidebarTab } from "../sidebar";
import { MapCanvasControls } from "../MapCanvasControls";
import { buildDemoPackCatalogInsertion, MapCatalogPanel } from "../catalog";
import type { MapDataActivitySectionId } from "../catalog/MapCatalogPanel";
import { MapContentsTreePanel } from "../contents";
import { MapLayerBookmarksPanel, MapLayerCartographyPanel, MapLayerManager, MapLayerSourcesPanel } from "../MapLayerManager";
import { CartographyRecommendationList } from "../CartographyRecommendationList";
import {
  MapAnalyzeDataOperationsPanel,
  MapAnalyzeStatisticsPanel,
} from "../analyze";
import {
  MapStyleAdvisorPanel,
  MapStyleLabelsPanel,
  MapStyleLegendPanel,
  MapStyleRendererPanel,
  MapStyleSymbolsPanel,
} from "../style";
import { GisEmptyState } from "../ui";
import { RasterLayerPanel } from "../raster/RasterLayerPanel";
import { TemporalScenePanel } from "../temporal";
import { Scene3DPanel } from "../scene3d/Scene3DPanel";
import { SunShadowPanel } from "../scene3d/SunShadowPanel";
import { ZoningRulesPanel } from "../zoning/ZoningRulesPanel";
import { MassingScenarioPanel } from "../zoning/MassingScenarioPanel";
import { MapProcessingToolboxPanel } from "../processing";
import { MapModelBuilderPanel } from "../modelBuilder";
import { MapNLQueryPanel } from "../MapNLQueryPanel";
import { MapWorkflowDrawer } from "../MapWorkflowDrawer";
import { resolveOverlayLayerCrsSummary } from "../mapLayerMetadata";
import type { MapSceneStatusChip } from "../scene";
import type { MapPublishPathAction, MapPublishPathMeta } from "../publish";
import {
  buildDataExportInventory,
  buildOfflinePackageInventory,
  buildPublishReadinessItems,
  buildReportHandoffInventory,
  collectLayerEvidenceIds,
  findReadinessCheck,
  formatCompactList,
  formatPublishBounds,
  readinessSeverityToGisStatus,
  uniquePublishStrings,
} from "./mapExplorerPublishHelpers";
import {
  formatSceneStatusValue,
  formatTemporalGeneratedLabel,
  layerCrsChip,
  resolveSceneTabId,
  sceneStatusChip,
  sceneVerticalDatumChip,
  sourceHandleCrs,
  sourceHandleSceneKind,
  viewportSyncChip,
} from "./mapExplorerSceneHelpers";
import { buildMapPublishWorkspaceElements } from "./mapPublishWorkspaceElements";

const LazyMapReportHandoffDrawer = React.lazy(async () => {
  const module = await import("../MapReportHandoffDrawer");
  return { default: module.MapReportHandoffDrawer };
});

type BuildMapRuntimeRenderModelArgs = Record<string, any>;

export function buildMapRuntimeRenderModel(args: BuildMapRuntimeRenderModelArgs) {
  const {
    activeActivityId,
    activeAnalysisResultLayerIds,
    activeBaseLayer,
    activeDrawTool,
    activeMeasureTool,
    activeRightDockRoutePanel,
    activePublishTabId,
    activeRasterLayerId,
    activeRasterLayerName,
    activeRasterState,
    activeSceneTabId: _activeSceneTabId,
    activeStyleLayer,
    activeTemporalLayer,
    activeTool,
    addOverlayLayer,
    annotationMode,
    annotations,
    announce,
    bearing,
    bookmarks,
    cartographyReviewState,
    cartographyUndoStack,
    contextSummary,
    currentMapBounds,
    drawnFeatures,
    effectiveShowLayerPanel,
    effectiveShowSidebar,
    exportFormat,
    exportTarget,
    flyTo,
    handleApplyCartographyRecommendation,
    handleApplyLayerStyle,
    handleBindLayerToDashboard,
    handleCatalogAddConnection,
    handleCatalogAddDemoPack,
    handleCatalogBrowseSources,
    handleCatalogReconnectSource,
    handleCatalogRepairSource,
    handleClearActiveCanvasTool,
    handleClearLayerCache,
    handleCanvasResetView,
    handleDeclareLayerCrs,
    handleDismissCartographyRecommendation,
    handleDuplicateContentsLayer,
    handleDownloadReportHandoffPdf,
    handleExportMapModelToIdeAndUrban,
    handleExportRequest,
    handleExternalServiceLayerReady,
    handleExternalServiceProgress,
    handleFocusLayer,
    handleInspectLayer,
    handleLayerReportRequest,
    handleMapExportRequest,
    handleMapQuickAction,
    handleOpenAnalyzeTab,
    handleOpenAttributeTable,
    handleOpenCanvasCrsReadiness,
    handleOpenCurrentMapReportHandoff,
    handleOpenExportNoteInIde,
    handleOpenLayerEducationReference,
    handleOpenLayerInIde,
    handleOpenMapManifestInIde,
    handleOpenPointSymbology,
    handleOpenPublishTab,
    handleOpenSelectionFromStatus,
    handleOpenStyleTab,
    handleOpenWorkflowScriptInIde,
    handleOfflinePackageExport,
    handleCanvasFitSelectedContext,
    handleCanvasFitVisibleLayers,
    handleCanvasZoom,
    handleRemoveLayerViaCommand,
    handlePreviewProcessingTool,
    handleRepairContentsSource,
    handleRepairLayerGeometry,
    handleReportHandoffOptionsChange,
    handleRefreshReportHandoffSnapshot,
    handleRegisterReportEvidenceBlock,
    handleReRunAnalysisLayer,
    handleRunMapModel,
    handleRunMapModelBatch,
    handleRunMapNLQuery,
    handleMapNLQueryProposalGenerated,
    handleMapNLQueryPreviewDecision,
    handleRunProcessingTool,
    handleRunSelectionStatistics,
    handleSaveBookmark,
    handleSaveWorkflowReport,
    handleSendLayerToUrban,
    handleSetBaseLayer,
    handleSetDrawTool,
    handleSetMeasureTool,
    handleSetSelectionDragTool,
    handleSetWorkspaceView,
    handleShowCartographyDetails,
    handleTemporalFrameExport,
    handleTemporalLayerSelection,
    handleTemporalRestoreRequestHandled,
    handleToggleAnnotationMode,
    handleToggleCanvasKeyboardHelp,
    handleToggleCanvasLegend,
    handleToggleCanvasNorthArrow,
    handleToggleCanvasScaleBar,
    handleToggleCanvasSwipeCompare,
    handleToggleClusterViz,
    handleToggleEmergingHotSpotViz,
    handleToggleHotSpotViz,
    handleToggleSidebar,
    handleUndoCartographyRecommendation,
    handleRestoreBookmark,
    handleRemovePin,
    handleClearPins,
    handleApplyMapWorkflow,
    handleCancelMapWorkflow,
    handleCloseReportHandoff,
    handleExecuteMapWorkflow,
    handleInsertReportHandoff,
    isExportingOfflinePackage,
    isExportingReportHandoffPdf,
    isGeneratingReportHandoffSnapshot,
    isLoadingPointSymbology,
    isRunningMapNLQuery,
    lastMapNLQuerySummary,
    lastSavedAt,
    layersCartographyScopeId,
    mapCompositionOptions,
    mapEvidenceArtifacts,
    mapInstanceRef,
    mapPublicationLegendItems,
    mapPublicationReadiness,
    measurements,
    nlQueryToolbarContext,
    openLayersActivityTab,
    openMapProblems,
    openRightDockPanel,
    overlayLayers,
    pins,
    pointSymbologyCollection,
    pointSymbologyError,
    pointSymbologyFields,
    pointSymbologyLayerId,
    pointSymbologyMode,
    processingToolDescriptors,
    processingToolboxLayers,
    reducedMotion,
    reportHandoffDraft,
    reportHandoffOptions,
    reportHandoffSnapshot,
    reviewSession,
    scene3DActiveLayerCrs,
    scene3DBuildings,
    scene3DCityModelHandle,
    scene3DMode,
    scene3DTerrainHandle,
    sceneUrbanFormCrs,
    sceneUrbanFormVerticalDatum,
    scientificQA,
    scientificQABlockerCount,
    scientificQAIssueCount,
    searchProcessingTools,
    selectedAoiFeatureForQuery,
    selectedFeatureCount,
    selectedFeatureIds,
    selectedLayerCartographyRecommendations,
    selectedPointSymbologyLayer,
    selectedProjectId,
    selectionDragTool,
    selectionStatsAvailable,
    selectedCanvasFitContext,
    setActiveAnalysisResultLayers,
    setInspectorLayerId,
    setLayersCartographyScopeId,
    setLayerOpacity,
    setPointSymbologyLayerId,
    setPointSymbologyMode,
    setShowChoroplethPanel,
    setShowExternalServiceDialog,
    setShowFigureComposer,
    setShowLayerPanel,
    setShowMapExportDialog,
    setShowVoxCityOverlay,
    setStyleWorkspaceLayerId,
    setUrbanWorkflowDraftRequest,
    setWorkbenchSidebarTab,
    setWorkflowPreview,
    showCanvasKeyboardHelp,
    showSwipeCompare,
    showChoroplethPanel,
    showClusterViz,
    showEmergingHotSpotViz,
    showHotSpotViz,
    showLayerPanel,
    sourceHandles,
    styleWorkspaceLayerId,
    temporalLayers,
    temporalLayoutRestoreRequest,
    temporalRuntimeMode,
    toolbarDensity,
    toggleLayerVisibility,
    updateLayerMetadata,
    visibleLayerFitBounds,
    visiblePublicationLayers,
    viewportSyncEnabled,
    viewportSyncStatus,
    workflowContext,
    workflowExecution,
    urbanWorkflowDraftRequest,
    workbenchSidebarTab,
    workspaceView,
    zoom,
    activeAoiLabel,
    reorderLayers,
    rerunningAnalysisToken,
  } = args;
  void _activeSceneTabId;
  const transitionStyle = reducedMotion ? "none" : undefined;
  const exportDisabled =
    pins.length === 0 &&
    drawnFeatures.length === 0 &&
    overlayLayers.filter((layer: OverlayLayerConfig) => layer.visible).length === 0;
  const exportDisabledReason = exportDisabled
    ? "Add pins, drawings, or visible GeoJSON-capable overlay layers before exporting spatial data."
    : undefined;
  const packageExportDisabled =
    pins.length === 0 &&
    bookmarks.length === 0 &&
    annotations.length === 0 &&
    drawnFeatures.length === 0 &&
    overlayLayers.length === 0 &&
    mapEvidenceArtifacts.length === 0;
  const packageExportDisabledReason = "Add pins, drawings, overlay layers, bookmarks, annotations, or map evidence before exporting an offline package.";
  const reportDisabledReason = isGeneratingReportHandoffSnapshot
    ? "The current map report snapshot is still rendering."
    : undefined;
  const publishEvidenceIds = uniquePublishStrings([
    ...visiblePublicationLayers.flatMap(collectLayerEvidenceIds),
    ...mapEvidenceArtifacts.map((artifact: { id: string }) => artifact.id),
  ], 24);
  const publishReadinessItems = buildPublishReadinessItems({
    readiness: mapPublicationReadiness,
    visibleLayers: visiblePublicationLayers,
    composition: mapCompositionOptions,
    evidenceIds: publishEvidenceIds,
  });
  const mapImageExportDisabledReason = mapPublicationReadiness.status === "blocked"
    ? mapPublicationReadiness.blockers[0]?.message ?? "Resolve publication readiness blockers before exporting a map image."
    : undefined;
  const publishBoundsLabel = formatPublishBounds(currentMapBounds);
  const publishBoundsStatus: GisStatusKey = currentMapBounds ? "ready" : "caveat";
  const dataExportInventory = buildDataExportInventory({
    overlayLayers,
    target: exportTarget,
    pinCount: pins.length,
    drawingCount: drawnFeatures.length,
  });
  const offlinePackageInventory = buildOfflinePackageInventory({ overlayLayers, sourceHandles });
  const reportHandoffInventory = buildReportHandoffInventory({
    overlayLayers,
    snapshotCaptured: Boolean(reportHandoffSnapshot?.dataUrl),
    readinessCaveats: (reportHandoffDraft?.publicationReadiness ?? mapPublicationReadiness).caveats,
  });
  const figureActions: MapPublishPathAction[] = [
    {
      label: "Map image export",
      onClick: handleMapExportRequest,
      primary: true,
      disabled: Boolean(mapImageExportDisabledReason),
      ...(mapImageExportDisabledReason ? { disabledReason: mapImageExportDisabledReason } : {}),
    },
  ];
  const dataExportActions: MapPublishPathAction[] = [
    {
      label: "Spatial data export",
      onClick: handleExportRequest,
      primary: true,
      disabled: exportDisabled,
      ...(exportDisabledReason ? { disabledReason: exportDisabledReason } : {}),
    },
  ];
  const reportActions: MapPublishPathAction[] = reportHandoffDraft
    ? []
    : [
        {
          label: "Prepare report handoff",
          onClick: handleOpenCurrentMapReportHandoff,
          primary: true,
          disabled: Boolean(reportDisabledReason),
          ...(reportDisabledReason ? { disabledReason: reportDisabledReason } : {}),
        },
      ];
  const offlineActions: MapPublishPathAction[] = [
    {
      label: isExportingOfflinePackage ? "Packaging..." : "Export offline package",
      onClick: () => {
        void handleOfflinePackageExport();
      },
      primary: true,
      disabled: packageExportDisabled || isExportingOfflinePackage,
      ...(packageExportDisabled
        ? { disabledReason: packageExportDisabledReason }
        : isExportingOfflinePackage
          ? { disabledReason: "Offline package export is already running." }
          : {}),
    },
  ];
  const reviewActions: MapPublishPathAction[] = [
    {
      label: "Review timeline",
      onClick: () => openRightDockPanel("timeline", "Review timeline opened in the right dock", "toolbar"),
    },
    {
      label: "IDE manifest",
      onClick: handleOpenMapManifestInIde,
    },
    {
      label: "IDE note",
      onClick: handleOpenExportNoteInIde,
    },
  ];
  const figurePageSizeLabel = mapCompositionOptions.pageSize === "custom"
    ? `${Math.round(mapCompositionOptions.customWidthMm)}×${Math.round(mapCompositionOptions.customHeightMm)} mm`
    : mapCompositionOptions.pageSize.toUpperCase();
  const figureGraticuleInsetLabel = [
    mapCompositionOptions.includeGraticule ? "Graticule" : null,
    mapCompositionOptions.includeInsetMap ? "Inset" : null,
  ].filter((value): value is string => Boolean(value)).join(" + ") || "Off";
  const figureCrsCheck = findReadinessCheck(mapPublicationReadiness, "crs-measurement");
  const figureCrsValues = uniquePublishStrings(
    visiblePublicationLayers.map((layer: OverlayLayerConfig) => resolveOverlayLayerCrsSummary(layer).crs),
    3,
  );
  const figureAttributionCheck = findReadinessCheck(mapPublicationReadiness, "attribution-license");
  const figureMeta: MapPublishPathMeta[] = [
    { label: "Page size", value: figurePageSizeLabel },
    { label: "Resolution", value: `${mapCompositionOptions.format.toUpperCase()} @ ${mapCompositionOptions.dpi} DPI` },
    { label: "Visible layers", value: visiblePublicationLayers.length.toLocaleString(), status: visiblePublicationLayers.length > 0 ? "ready" : "blocked" },
    { label: "Legend", value: `${mapPublicationLegendItems.length.toLocaleString()} item${mapPublicationLegendItems.length === 1 ? "" : "s"}`, status: mapPublicationReadiness.hasLegend ? "ready" : "blocked" },
    { label: "Scale bar", value: mapCompositionOptions.includeScaleBar ? "On" : "Off", status: mapCompositionOptions.includeScaleBar ? "ready" : "caveat" },
    { label: "North arrow", value: mapCompositionOptions.includeNorthArrow ? "On" : "Off", status: mapCompositionOptions.includeNorthArrow ? "ready" : "caveat" },
    { label: "Graticule / inset", value: figureGraticuleInsetLabel },
    { label: "Attribution", value: mapCompositionOptions.includeAttribution ? "Included" : "Off", status: figureAttributionCheck ? readinessSeverityToGisStatus(figureAttributionCheck.status) : mapCompositionOptions.includeAttribution ? "ready" : "caveat" },
    { label: "CRS", value: figureCrsValues.length > 0 ? formatCompactList(figureCrsValues, "missing") : "missing", status: figureCrsCheck ? readinessSeverityToGisStatus(figureCrsCheck.status) : figureCrsValues.length > 0 ? "ready" : "caveat" },
    { label: "QA caveats", value: mapPublicationReadiness.caveats.length.toLocaleString(), status: mapPublicationReadiness.caveats.length > 0 ? "caveat" : "ready" },
    { label: "Annotations", value: annotations.length.toLocaleString(), status: annotations.length > 0 ? "ready" : "caveat" },
    { label: "Readiness", value: mapPublicationReadiness.status.replace(/-/g, " "), status: mapPublicationReadiness.status === "blocked" ? "blocked" : mapPublicationReadiness.status === "ready-with-caveats" ? "caveat" : "ready" },
  ];
  const dataExportMeta: MapPublishPathMeta[] = [
    { label: "Target", value: exportTarget.replace(/-/g, " ") },
    { label: "Format", value: exportFormat === "geoparquet" ? "GeoParquet" : "GeoJSON" },
    { label: "Pins", value: pins.length.toLocaleString() },
    { label: "Drawings", value: drawnFeatures.length.toLocaleString() },
  ];
  const reportMeta: MapPublishPathMeta[] = [
    { label: "Snapshot", value: reportHandoffDraft?.snapshot.filename ?? (reportHandoffSnapshot?.dataUrl ? "captured" : "metadata only"), status: reportHandoffSnapshot?.dataUrl ? "ready" : "caveat" },
    { label: "Evidence block", value: reportHandoffDraft?.evidenceBlock.id ?? "not prepared", status: reportHandoffDraft ? "ready" : "unknown" },
    { label: "Citations", value: (reportHandoffDraft?.citations.length ?? 0).toLocaleString() },
    { label: "Annotations", value: annotations.length.toLocaleString(), status: annotations.length > 0 ? "ready" : "caveat" },
    { label: "Readiness", value: (reportHandoffDraft?.publicationReadiness.status ?? mapPublicationReadiness.status).replace(/-/g, " ") },
  ];
  const offlineMeta: MapPublishPathMeta[] = [
    { label: "Source bounds", value: formatPublishBounds(currentMapBounds), status: currentMapBounds ? "ready" : "caveat" },
    { label: "Layers", value: overlayLayers.length.toLocaleString() },
    { label: "Source handles", value: sourceHandles.length.toLocaleString() },
    { label: "Marks", value: (annotations.length + pins.length + bookmarks.length).toLocaleString(), status: annotations.length + pins.length + bookmarks.length > 0 ? "ready" : "caveat" },
    { label: "Evidence IDs", value: publishEvidenceIds.length.toLocaleString(), status: publishEvidenceIds.length > 0 ? "ready" : "caveat" },
  ];
  const reviewMeta: MapPublishPathMeta[] = [
    { label: "Readiness ID", value: mapPublicationReadiness.id },
    { label: "Checked", value: new Date(mapPublicationReadiness.checkedAt).toLocaleString() },
    { label: "Review events", value: reviewSession.events.length.toLocaleString(), status: reviewSession.events.length > 0 ? "ready" : "caveat" },
    { label: "Marks", value: `${annotations.length.toLocaleString()} annotations / ${pins.length.toLocaleString()} pins / ${bookmarks.length.toLocaleString()} views`, status: annotations.length + pins.length + bookmarks.length > 0 ? "ready" : "caveat" },
    { label: "Caveats", value: mapPublicationReadiness.caveats.length.toLocaleString(), status: mapPublicationReadiness.caveats.length > 0 ? "caveat" : "ready" },
  ];
  const reportDrawerElement = reportHandoffDraft ? (
    <Suspense fallback={null}>
      <LazyMapReportHandoffDrawer
        draft={reportHandoffDraft}
        options={reportHandoffOptions}
        isGeneratingSnapshot={isGeneratingReportHandoffSnapshot}
        isExportingPdf={isExportingReportHandoffPdf}
        presentation="embedded"
        onOptionsChange={handleReportHandoffOptionsChange}
        onRefreshSnapshot={handleRefreshReportHandoffSnapshot}
        onRegisterEvidence={handleRegisterReportEvidenceBlock}
        onDownloadPdf={handleDownloadReportHandoffPdf}
        onInsert={handleInsertReportHandoff}
        onClose={handleCloseReportHandoff}
      />
    </Suspense>
  ) : null;
  const publishWorkspaceElements = buildMapPublishWorkspaceElements({
    annotationCount: annotations.length,
    annotationMode,
    bearing,
    bookmarkCount: bookmarks.length,
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
    mapPublicationReadinessCaveats: mapPublicationReadiness.caveats,
    offlineActions,
    offlineMeta,
    offlinePackageInventory,
    overlayLayers,
    packageExportDisabled,
    packageExportDisabledReason,
    pinCount: pins.length,
    pinSidebarVisible: effectiveShowSidebar,
    publishBoundsLabel,
    publishBoundsStatus,
    publishEvidenceIds,
    reportActions,
    reportDisabledReason,
    reportDrawer: reportDrawerElement,
    reportHandoffInventory,
    reportMeta,
    reviewActions,
    reviewMeta,
    scientificQA,
    setShowFigureComposer,
    setShowLayerPanel,
    setShowMapExportDialog,
    temporalLayoutRestoreRequest,
    toggleAnnotationMode: handleToggleAnnotationMode,
    togglePinSidebar: handleToggleSidebar,
    visiblePublicationLayerIds: visiblePublicationLayers.map((layer: OverlayLayerConfig) => layer.id),
    visiblePublicationLayers,
    announce,
  });
  const publishFigureElement = publishWorkspaceElements.figure;
  const publishDataExportElement = publishWorkspaceElements.dataExport;
  const publishReportElement = publishWorkspaceElements.report;
  const publishOfflinePackageElement = publishWorkspaceElements.offlinePackage;
  const publishReviewPackageElement = publishWorkspaceElements.reviewPackage;
  const isWorkbenchActivity =
    activeActivityId === "overview" ||
    activeActivityId === "data" ||
    activeActivityId === "layers" ||
    activeActivityId === "analyze" ||
    activeActivityId === "style" ||
    activeActivityId === "scene" ||
    activeActivityId === "publish";
  const analyzeSidebarActive = activeActivityId === "analyze" && effectiveShowLayerPanel;
  const analyzeWorkflowsTabActive = analyzeSidebarActive && workbenchSidebarTab === "analyze-workflows";
  const analyzeToolsTabActive = analyzeSidebarActive && workbenchSidebarTab === "analyze-tools";
  const analyzeQueryTabActive = analyzeSidebarActive && workbenchSidebarTab === "analyze-query";
  const analyzeModelsTabActive = analyzeSidebarActive && workbenchSidebarTab === "analyze-models";
  const styleSidebarActive = activeActivityId === "style" && effectiveShowLayerPanel;
  const styleRendererTabActive = styleSidebarActive && workbenchSidebarTab === "style-renderer";
  const sceneSidebarActive = activeActivityId === "scene" && effectiveShowLayerPanel;
  const activeSceneTabId = resolveSceneTabId(workbenchSidebarTab);
  const sceneRasterTabActive = sceneSidebarActive && activeSceneTabId === "scene-raster";
  const sceneTemporalTabActive = sceneSidebarActive && activeSceneTabId === "scene-temporal";
  const scene3DTabActive = sceneSidebarActive && activeSceneTabId === "scene-3d";
  const sceneZoningTabActive = sceneSidebarActive && activeSceneTabId === "scene-zoning";
  const sceneMassingTabActive = sceneSidebarActive && activeSceneTabId === "scene-massing";
  const sceneSunShadowTabActive = sceneSidebarActive && activeSceneTabId === "scene-sun-shadow";
  const sceneVoxCityTabActive = sceneSidebarActive && activeSceneTabId === "scene-voxcity";
  const publishSidebarActive = activeActivityId === "publish" && effectiveShowLayerPanel;
  const publishFigureTabActive = publishSidebarActive && activePublishTabId === "publish-figure";
  const publishReportTabActive = publishSidebarActive && activePublishTabId === "publish-report";
  const activeAnalysisOutputLayerIds = new Set(activeAnalysisResultLayerIds);
  const analysisOutputLayers = overlayLayers.filter((layer: OverlayLayerConfig) =>
    activeAnalysisOutputLayerIds.has(layer.id) || layer.group === "analysis" || Boolean(layer.metadata?.analysisResult),
  );
  const handleToggleStyleRenderer = (): void => {
    if (styleRendererTabActive && showLayerPanel) {
      setShowLayerPanel(false);
      announce("Renderer styling closed");
      return;
    }

    setPointSymbologyLayerId(null);
    setShowChoroplethPanel(false);
    handleOpenStyleTab("style-renderer", "Renderer styling opened in Style", activeStyleLayer?.id ?? null);
  };

  const layerStackElement = (
    <MapLayerManager
      overlayLayers={overlayLayers}
      activeBaseLayerName={BASE_STYLES[activeBaseLayer as BaseLayerId].name}
      onToggleVisibility={toggleLayerVisibility}
      onSetOpacity={setLayerOpacity}
      onRemoveLayer={handleRemoveLayerViaCommand}
      onReorderLayers={reorderLayers}
      onAddLayer={(layer) => {
        if (layer.sourceKind === "external" || layer.metadata?.externalService) {
          handleExternalServiceLayerReady(layer);
          return;
        }
        addOverlayLayer(layer);
      }}
      onAddDemoPack={() => handleCatalogAddDemoPack(buildDemoPackCatalogInsertion())}
      onFocusLayer={handleFocusLayer}
      onAddLayerToReport={handleLayerReportRequest}
      onBindLayerToDashboard={handleBindLayerToDashboard}
      onOpenLayerEducationReference={handleOpenLayerEducationReference}
      onSendLayerToUrban={handleSendLayerToUrban}
      onRepairGeometry={handleRepairLayerGeometry}
      selectedFeatureCount={selectedFeatureCount}
      qaIssueCount={scientificQAIssueCount}
      qaBlockerCount={scientificQABlockerCount}
      onOpenSourcesSection={() => openLayersActivityTab("layers-sources", "Layer sources opened")}
      onOpenContentsSection={() => openLayersActivityTab("layers-contents", "Layer contents opened")}
      onOpenSelectionDetail={handleOpenSelectionFromStatus}
      onOpenLayerQaDetail={() => openMapProblems("quick-action")}
      onDeclareLayerCrs={handleDeclareLayerCrs}
      onInspectLayer={handleInspectLayer}
      onOpenAttributeTable={handleOpenAttributeTable}
      onOpenLayerInIde={handleOpenLayerInIde}
      onClearLayerCache={handleClearLayerCache}
      onReRunAnalysisLayer={handleReRunAnalysisLayer}
      activeRerunToken={rerunningAnalysisToken}
      onOpenSymbology={handleOpenPointSymbology}
      activeSymbologyLayerId={pointSymbologyLayerId}
      cartographyReviewState={cartographyReviewState}
      onApplyCartographyRecommendation={handleApplyCartographyRecommendation}
      onDismissCartographyRecommendation={handleDismissCartographyRecommendation}
      onUndoCartographyRecommendation={handleUndoCartographyRecommendation}
      canUndoCartographyRecommendation={cartographyUndoStack.length > 0}
      onShowCartographyDetails={handleShowCartographyDetails}
      onOpenCartographyReviewScope={(layerId) => {
        handleOpenStyleTab("style-advisor", "Cartography recommendations opened in Style Advisor", layerId);
      }}
      presentation="embedded"
      cartographyReviewPlacement="none"
      onRequestClose={() => {
        setShowLayerPanel(false);
        announce("Layer panel closed");
      }}
      panelStyle={{ width: "100%", height: "100%" }}
      density={toolbarDensity === "compact" ? "compact" : "comfortable"}
      onAnnounce={announce}
    />
  );

  // Left-panel Overview tab renders a compact, width-aware readiness summary —
  // NOT the full launch/readiness cockpit. The full cockpit body remains the
  // navigator-stage overview experience only (never the left panel). See
  // map-explorer-premium-redesign Prompt 04 (UX-02 launch decoupling).
  const overviewCockpitElement = (
    <MapWorkspaceOverviewSummary
      workspaceView={workspaceView}
      onSelectView={handleSetWorkspaceView}
      onQuickAction={handleMapQuickAction}
      contextSummary={contextSummary}
      overlayLayers={overlayLayers}
      pinCount={pins.length}
      drawnFeatureCount={drawnFeatures.length}
      measurementCount={measurements.length}
      selectedProjectId={selectedProjectId}
      lastSavedAt={lastSavedAt}
      activeAoiLabel={activeAoiLabel}
      qaIssueCount={scientificQAIssueCount}
      qaBlockerCount={scientificQABlockerCount}
      visiblePublicationLayerCount={visiblePublicationLayers.length}
    />
  );

  const handleOpenExternalServicesFromDataActivity = (): void => {
    setShowExternalServiceDialog(true);
    announce("External services opened from Data activity");
  };

  const renderDataActivitySection = (activeSection: MapDataActivitySectionId): React.ReactNode => (
    <MapCatalogPanel
      visible
      presentation="embedded"
      activeSection={activeSection}
      sourceHandles={sourceHandles}
      layers={overlayLayers}
      onClose={() => {
        setShowLayerPanel(false);
        announce("Data activity closed");
      }}
      onBrowseSources={handleCatalogBrowseSources}
      onAddDemoPack={handleCatalogAddDemoPack}
      onRepairSource={handleCatalogRepairSource}
      onReconnectSource={handleCatalogReconnectSource}
      onAddConnection={handleCatalogAddConnection}
      onOpenExternalServices={handleOpenExternalServicesFromDataActivity}
    />
  );

  const layersCatalogElement = (
    <MapCatalogPanel
      visible
      presentation="embedded"
      activeSection="catalog"
      sourceHandles={sourceHandles}
      layers={overlayLayers}
      onClose={() => {
        openLayersActivityTab("layers-stack", "Layer stack opened");
      }}
      onBrowseSources={handleCatalogBrowseSources}
      onAddDemoPack={handleCatalogAddDemoPack}
      onRepairSource={handleCatalogRepairSource}
      onReconnectSource={handleCatalogReconnectSource}
      onAddConnection={handleCatalogAddConnection}
      onOpenExternalServices={handleOpenExternalServicesFromDataActivity}
    />
  );

  const layersContentsElement = (
    <MapContentsTreePanel
      visible
      presentation="embedded"
      layers={overlayLayers}
      zoom={zoom}
      onClose={() => {
        openLayersActivityTab("layers-stack", "Layer stack opened");
      }}
      onUpdateLayer={updateLayerMetadata}
      onDuplicateLayer={handleDuplicateContentsLayer}
      onRepairSource={handleRepairContentsSource}
      onOpenProperties={handleInspectLayer}
      onToggleVisibility={toggleLayerVisibility}
      onReorderLayers={reorderLayers}
    />
  );

  const layersSourcesElement = (
    <MapLayerSourcesPanel
      overlayLayers={overlayLayers}
      sourceHandles={sourceHandles}
      onInspectLayer={handleInspectLayer}
      onOpenAttributeTable={handleOpenAttributeTable}
      onSendLayerToUrban={handleSendLayerToUrban}
      onOpenLayerInIde={handleOpenLayerInIde}
      onAddLayerToReport={handleLayerReportRequest}
      onBindLayerToDashboard={handleBindLayerToDashboard}
      onOpenLayerEducationReference={handleOpenLayerEducationReference}
      onDeclareLayerCrs={handleDeclareLayerCrs}
      onRepairGeometry={handleRepairLayerGeometry}
      onFocusLayer={handleFocusLayer}
      onAnnounce={announce}
    />
  );

  const layersBookmarksElement = (
    <MapLayerBookmarksPanel
      bookmarks={bookmarks}
      pins={pins}
      maxBookmarks={MAP_BOOKMARK_LIMIT}
      onSaveBookmark={handleSaveBookmark}
      onRestoreBookmark={handleRestoreBookmark}
      onRemovePin={handleRemovePin}
      onClearPins={handleClearPins}
      onFlyTo={flyTo}
    />
  );

  const layersCartographyElement = (
    <MapLayerCartographyPanel
      overlayLayers={overlayLayers}
      cartographyReviewState={cartographyReviewState}
      activeLayerId={layersCartographyScopeId}
      onActiveLayerChange={setLayersCartographyScopeId}
      onOpenSymbology={handleOpenPointSymbology}
      onApplyCartographyRecommendation={handleApplyCartographyRecommendation}
      onDismissCartographyRecommendation={handleDismissCartographyRecommendation}
      onUndoCartographyRecommendation={handleUndoCartographyRecommendation}
      canUndoCartographyRecommendation={cartographyUndoStack.length > 0}
      onShowCartographyDetails={handleShowCartographyDetails}
    />
  );

  const pointSymbologyControlBody = (
    <div style={mapStyles.symbologyBody} data-testid="map-style-point-symbol-controls">
      {selectedPointSymbologyLayer ? (
        <CartographyRecommendationList
          title="Scientific symbology review"
          recommendations={selectedLayerCartographyRecommendations}
          emptyMessage="No pending cartographic issues for this layer."
          maxItems={3}
          canUndo={cartographyUndoStack.length > 0}
          onApply={handleApplyCartographyRecommendation}
          onDismiss={handleDismissCartographyRecommendation}
          onUndo={handleUndoCartographyRecommendation}
          onShowDetails={handleShowCartographyDetails}
        />
      ) : null}

      {isLoadingPointSymbology ? (
        <div style={mapStyles.symbologyLoading}>Loading point layer...</div>
      ) : null}

      {pointSymbologyError ? (
        <div style={mapStyles.symbologyError}>{pointSymbologyError}</div>
      ) : null}

      {selectedPointSymbologyLayer && pointSymbologyCollection ? (
        pointSymbologyMode === "heatmap" ? (
          <MapHeatmapLayer
            mapRef={mapInstanceRef}
            layer={selectedPointSymbologyLayer}
            featureCollection={pointSymbologyCollection}
            numericFields={pointSymbologyFields}
          />
        ) : (
          <MapSymbolLayer
            mapRef={mapInstanceRef}
            layer={selectedPointSymbologyLayer}
            featureCollection={pointSymbologyCollection}
            numericFields={pointSymbologyFields}
            mode={pointSymbologyMode}
          />
        )
      ) : null}
    </div>
  );

  const activeStyleLayerId = activeStyleLayer?.id ?? null;
  const styleLayerPanelProps = {
    layers: overlayLayers,
    activeLayer: activeStyleLayer,
    activeLayerId: activeStyleLayerId,
    onActiveLayerChange: setStyleWorkspaceLayerId,
    onInspectLayer: handleInspectLayer,
  };
  const styleRendererElement = (
    <MapStyleRendererPanel
      {...styleLayerPanelProps}
      onApplyStyle={handleApplyLayerStyle}
      choroplethPreviewActive={showChoroplethPanel}
      onOpenChoroplethPreview={() => {
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(true);
        announce("Live choropleth preview opened from Style Renderer");
      }}
    />
  );
  const styleSymbolsElement = (
    <MapStyleSymbolsPanel
      {...styleLayerPanelProps}
      activeMode={pointSymbologyMode}
      symbologyActive={Boolean(activeStyleLayerId && pointSymbologyLayerId === activeStyleLayerId)}
      isLoading={isLoadingPointSymbology}
      error={pointSymbologyError}
      symbolControls={pointSymbologyLayerId === activeStyleLayerId ? pointSymbologyControlBody : null}
      onOpenPointSymbology={(mode) => {
        if (!activeStyleLayer) return;
        setPointSymbologyMode(mode);
        setPointSymbologyLayerId(activeStyleLayer.id);
        setShowChoroplethPanel(false);
        announce(`Point ${mode} styling opened for ${activeStyleLayer.name}`);
      }}
      onClosePointSymbology={() => {
        setPointSymbologyLayerId(null);
        announce("Point symbology panel closed");
      }}
    />
  );
  const styleLabelsElement = (
    <MapStyleLabelsPanel
      {...styleLayerPanelProps}
      onApplyStyle={handleApplyLayerStyle}
      annotationCount={annotations.length}
      pinCount={pins.length}
      bookmarkCount={bookmarks.length}
      annotationMode={annotationMode}
      pinSidebarVisible={effectiveShowSidebar}
      onToggleAnnotationMode={handleToggleAnnotationMode}
      onTogglePinSidebar={handleToggleSidebar}
      onOpenPublishMarks={() => handleOpenPublishTab("publish-review-package", "Publication marks opened in Publish Review Package")}
    />
  );
  const styleLegendElement = <MapStyleLegendPanel {...styleLayerPanelProps} />;
  const styleAdvisorElement = (
    <MapStyleAdvisorPanel
      {...styleLayerPanelProps}
      advisor={(
        <MapLayerCartographyPanel
          overlayLayers={overlayLayers}
          cartographyReviewState={cartographyReviewState}
          activeLayerId={styleWorkspaceLayerId}
          onActiveLayerChange={setStyleWorkspaceLayerId}
          onOpenSymbology={handleOpenPointSymbology}
          onApplyCartographyRecommendation={handleApplyCartographyRecommendation}
          onDismissCartographyRecommendation={handleDismissCartographyRecommendation}
          onUndoCartographyRecommendation={handleUndoCartographyRecommendation}
          canUndoCartographyRecommendation={cartographyUndoStack.length > 0}
          onShowCartographyDetails={handleShowCartographyDetails}
        />
      )}
    />
  );

  const sceneViewportSyncChip = viewportSyncChip(viewportSyncEnabled, viewportSyncStatus);
  const sceneStatusChips: MapSceneStatusChip[] = (() => {
    const sync = sceneViewportSyncChip;
    const referenceLayer =
      activeTemporalLayer ??
      overlayLayers.find((layer: OverlayLayerConfig) => layer.visible) ??
      overlayLayers[0] ??
      null;

    if (activeSceneTabId === "scene-raster") {
      const meta = activeRasterState?.inspection?.metadata;
      return [
        sceneStatusChip("source-mode", activeRasterLayerId ? "Source mode: raster" : "Source mode: no raster", activeRasterLayerId ? "ready" : "unknown"),
        sceneStatusChip("crs", meta?.epsgCode ? `CRS: ${meta.epsgCode}` : "CRS: missing", meta?.epsgCode ? "ready" : "blocked"),
        sceneStatusChip("vertical-datum", "Vertical datum: n/a", "unknown"),
        sceneStatusChip("sample-generated", meta?.sampled ? "Sample/generated: sampled stats" : "Sample/generated: full stats", meta?.sampled ? "caveat" : activeRasterLayerId ? "ready" : "unknown"),
        sync,
      ];
    }

    if (activeSceneTabId === "scene-temporal") {
      const runtimeStatus: GisStatusKey =
        temporalRuntimeMode === "live" ? "ready" : temporalRuntimeMode === "demo" ? "demo" : temporalRuntimeMode === "synthetic" ? "synthetic" : "unknown";
      return [
        sceneStatusChip("source-mode", activeTemporalLayer ? `Source mode: ${formatSceneStatusValue(temporalRuntimeMode, "temporal")}` : "Source mode: no temporal layer", activeTemporalLayer ? runtimeStatus : "unknown"),
        layerCrsChip(activeTemporalLayer, "CRS: temporal layer unknown"),
        sceneStatusChip("vertical-datum", "Vertical datum: n/a", "unknown"),
        sceneStatusChip("sample-generated", `Sample/generated: ${formatTemporalGeneratedLabel(temporalRuntimeMode)}`, runtimeStatus),
        sync,
      ];
    }

    if (activeSceneTabId === "scene-3d") {
      const sourceKind = sourceHandleSceneKind(scene3DCityModelHandle) ?? sourceHandleSceneKind(scene3DTerrainHandle);
      const runtimeMode = scene3DCityModelHandle?.scene3d?.runtimeMode ?? scene3DTerrainHandle?.scene3d?.runtimeMode ?? null;
      const crs = scene3DActiveLayerCrs ?? sourceHandleCrs(scene3DTerrainHandle) ?? sourceHandleCrs(scene3DCityModelHandle);
      const generated = sourceKind === "generated-massing" || sourceKind === "zoning-envelope" || sourceKind === "sun-shadow-result";
      const modeStatus: GisStatusKey = generated ? "synthetic" : runtimeMode === "sample" || sourceKind === "sample-3d" ? "demo" : sourceKind ? "ready" : "unknown";
      return [
        sceneStatusChip("source-mode", `Source mode: ${formatSceneStatusValue(sourceKind ?? scene3DMode, "3D scene")}`, modeStatus),
        sceneStatusChip("crs", crs ? `CRS: ${crs}` : "CRS: missing", crs ? "ready" : "blocked"),
        sceneVerticalDatumChip(scene3DTerrainHandle, scene3DCityModelHandle),
        sceneStatusChip("sample-generated", `Sample/generated: ${generated ? "Generated" : runtimeMode === "sample" || sourceKind === "sample-3d" ? "Sample" : "Real/derived"}`, modeStatus),
        sync,
      ];
    }

    if (activeSceneTabId === "scene-zoning") {
      return [
        sceneStatusChip("source-mode", selectedFeatureIds.length > 0 ? "Source mode: selected parcel" : "Source mode: parcel required", selectedFeatureIds.length > 0 ? "ready" : "caveat"),
        layerCrsChip(referenceLayer, "CRS: parcel layer unknown"),
        sceneStatusChip(
          "vertical-datum",
          sceneUrbanFormVerticalDatum ? `Vertical datum: ${sceneUrbanFormVerticalDatum}` : "Vertical datum: planar zoning heights",
          sceneUrbanFormVerticalDatum ? "ready" : "caveat",
        ),
        sceneStatusChip("sample-generated", "Sample/generated: user rules", "ready"),
        sync,
      ];
    }

    if (activeSceneTabId === "scene-massing") {
      return [
        sceneStatusChip("source-mode", selectedFeatureIds.length > 0 ? "Source mode: parcel scenario" : "Source mode: parcel required", selectedFeatureIds.length > 0 ? "ready" : "caveat"),
        layerCrsChip(referenceLayer, "CRS: massing layer unknown"),
        sceneVerticalDatumChip(scene3DTerrainHandle, scene3DCityModelHandle),
        sceneStatusChip("sample-generated", "Sample/generated: generated massing", "synthetic"),
        sync,
      ];
    }

    if (activeSceneTabId === "scene-sun-shadow") {
      return [
        sceneStatusChip("source-mode", "Source mode: sun/shadow scenario", "synthetic"),
        layerCrsChip(referenceLayer, "CRS: scene layer unknown"),
        sceneVerticalDatumChip(scene3DTerrainHandle, scene3DCityModelHandle),
        sceneStatusChip("sample-generated", "Sample/generated: generated shadows", "synthetic"),
        sync,
      ];
    }

    return [
      sceneStatusChip("source-mode", "Source mode: demo / active layer / OSM", "caveat"),
      sceneStatusChip("crs", "CRS: EPSG:4326 display", "ready"),
      sceneStatusChip("vertical-datum", "Vertical datum: CityJSON not recorded", "caveat"),
      sceneStatusChip("sample-generated", "Sample/generated: labels explicit", "caveat"),
      sync,
    ];
  })();

  const handleSceneWorkspaceTabChange = (id: string): void => {
    setWorkbenchSidebarTab(id);
    setShowVoxCityOverlay(id === "scene-voxcity");
  };

  const sceneRasterElement = sceneRasterTabActive
    ? activeRasterLayerId ? (
      <RasterLayerPanel
        layerId={activeRasterLayerId}
        layerName={activeRasterLayerName}
        visible
        presentation="embedded"
        onClose={() => {
          setShowLayerPanel(false);
          announce("Raster evidence panel closed");
        }}
      />
    ) : (
      <GisEmptyState
        title="No raster layer"
        description="Import a raster source before reviewing noData, histogram, QA, and evidence details."
        compact
      />
    )
    : null;

  const sceneTemporalElement = activeTemporalLayer ? (
    <TemporalScenePanel
      activeLayer={activeTemporalLayer}
      temporalLayers={temporalLayers}
      onLayerChange={handleTemporalLayerSelection}
      onExportFrame={handleTemporalFrameExport}
    />
  ) : (
    <GisEmptyState
      title="No temporal layer"
      description="Run or import a temporal analysis layer before using playback controls."
      compact
    />
  );

  const scene3DElement = scene3DTabActive ? (
    <Scene3DPanel
      visible
      presentation="embedded"
      viewportSync={{
        label: sceneViewportSyncChip.label,
        status: sceneViewportSyncChip.status,
        ...(sceneViewportSyncChip.title ? { title: sceneViewportSyncChip.title } : {}),
      }}
      onClose={() => {
        setShowLayerPanel(false);
        announce("3D scene panel closed");
      }}
      onModeChange={(mode) => announce(`3D mode: ${mode}`)}
    />
  ) : null;

  const sceneZoningElement = (
    <ZoningRulesPanel
      visible
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        announce("Zoning rules panel closed");
      }}
      selectedParcelId={selectedFeatureIds[0] ?? null}
      declaredCrs={sceneUrbanFormCrs}
      verticalDatum={sceneUrbanFormVerticalDatum}
      buildingPrerequisiteCount={scene3DBuildings.length}
    />
  );

  const sceneMassingElement = (
    <MassingScenarioPanel
      visible
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        announce("Massing scenarios panel closed");
      }}
      parcelId={selectedFeatureIds[0] ?? null}
      declaredCrs={sceneUrbanFormCrs}
      verticalDatum={sceneUrbanFormVerticalDatum}
      buildingPrerequisiteCount={scene3DBuildings.length}
    />
  );

  const sceneSunShadowElement = (
    <SunShadowPanel
      visible
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        announce("Sun/shadow analysis panel closed");
      }}
    />
  );

  const sceneVoxCityElement = (
    <MapVoxCityOverlay
      mapRef={mapInstanceRef}
      panelVisible
      presentation="embedded"
      onPanelClose={() => {
        setShowLayerPanel(false);
        setShowVoxCityOverlay(false);
        announce("VoxCity 2D overlay closed");
      }}
      onAnnounce={announce}
      onExternalImportProgress={handleExternalServiceProgress}
    />
  );

  const analyzeWorkflowElement = (
    <MapWorkflowDrawer
      visible={analyzeWorkflowsTabActive || activeRightDockRoutePanel === "workflow"}
      context={workflowContext}
      initialDraftRequest={urbanWorkflowDraftRequest}
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        setWorkflowPreview(null);
        setUrbanWorkflowDraftRequest(null);
        announce("Analyze workflows closed");
      }}
      onApply={handleApplyMapWorkflow}
      onSaveReport={handleSaveWorkflowReport}
      onPreviewChange={setWorkflowPreview}
      onOpenWorkflowScript={handleOpenWorkflowScriptInIde}
      onExecuteWorkflow={handleExecuteMapWorkflow}
      onCancelWorkflow={handleCancelMapWorkflow}
      workflowExecution={workflowExecution}
      onAnnounce={announce}
    />
  );

  const analyzeToolsElement = (
    <MapProcessingToolboxPanel
      visible={analyzeToolsTabActive}
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        announce("Analyze tools closed");
      }}
      searchTools={searchProcessingTools}
      layers={processingToolboxLayers}
      onPreview={handlePreviewProcessingTool}
      onRun={handleRunProcessingTool}
    />
  );

  const analyzeQueryElement = (
    <MapNLQueryPanel
      visible={analyzeQueryTabActive}
      presentation="embedded"
      overlayLayers={overlayLayers}
      selectedAoiFeature={selectedAoiFeatureForQuery}
      currentMapBounds={currentMapBounds}
      isRunning={isRunningMapNLQuery}
      lastRunSummary={lastMapNLQuerySummary}
      onRun={handleRunMapNLQuery}
      onProposalGenerated={handleMapNLQueryProposalGenerated}
      onPreviewDecision={handleMapNLQueryPreviewDecision}
      onClose={() => {
        setShowLayerPanel(false);
        announce("Analyze query closed");
      }}
      onAnnounce={announce}
    />
  );

  const analyzeModelsElement = analyzeModelsTabActive ? (
    <MapModelBuilderPanel
      visible
      presentation="embedded"
      onClose={() => {
        setShowLayerPanel(false);
        announce("Analyze models closed");
      }}
      tools={processingToolDescriptors}
      layers={processingToolboxLayers}
      onRun={handleRunMapModel}
      onRunBatch={handleRunMapModelBatch}
      onExportToIdeAndUrban={handleExportMapModelToIdeAndUrban}
    />
  ) : null;

  const analyzeStatisticsElement = (
    <MapAnalyzeStatisticsPanel
      hasAnalysisLayers={overlayLayers.some((layer: OverlayLayerConfig) => {
        if (!layer.visible || layer.type !== "geojson") {
          return false;
        }
        const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
        return geometryType.length === 0 || geometryType.includes("polygon") || geometryType.includes("multi");
      })}
      analysisOutputLayers={analysisOutputLayers}
      selectedFeatureCount={selectedFeatureCount}
      selectionStatsAvailable={selectionStatsAvailable}
      lisaActive={showClusterViz}
      hotSpotActive={showHotSpotViz}
      emergingHotSpotActive={showEmergingHotSpotViz}
      onOpenLISA={handleToggleClusterViz}
      onOpenHotSpot={handleToggleHotSpotViz}
      onOpenEmergingHotSpot={handleToggleEmergingHotSpotViz}
      onRunSelectionStatistics={handleRunSelectionStatistics}
    />
  );

  const analyzeDataOperationsElement = (
    <MapAnalyzeDataOperationsPanel
      layers={analysisOutputLayers}
      activeLayerIds={activeAnalysisResultLayerIds}
      selectedFeatureCount={selectedFeatureCount}
      onOpenAttributes={handleOpenAttributeTable}
      onInspectLayer={handleInspectLayer}
      onSetActiveLayer={(layerId) => {
        setActiveAnalysisResultLayers([layerId]);
        setInspectorLayerId(layerId);
        announce("Analysis output layer activated");
      }}
      onRunSelectionStatistics={handleRunSelectionStatistics}
      onOpenTools={() => handleOpenAnalyzeTab("analyze-tools", "Processing toolbox opened in Analyze Tools")}
    />
  );

  const workbenchSidebarTabs: MapWorkbenchSidebarTab[] =
    activeActivityId === "overview"
      ? [
          {
            id: "overview-readiness",
            label: "Overview",
            render: () => overviewCockpitElement,
          },
        ]
      : activeActivityId === "data"
        ? [
            {
              id: "data-import",
              label: "Add Data",
              render: () => renderDataActivitySection("add-data"),
            },
            {
              id: "data-connections",
              label: "Connections",
              render: () => renderDataActivitySection("connections"),
            },
            {
              id: "data-catalog",
              label: "Catalog",
              render: () => renderDataActivitySection("catalog"),
            },
            {
              id: "data-health",
              label: "Source Health",
              render: () => renderDataActivitySection("source-health"),
            },
            {
              id: "data-demo",
              label: "Demo Data",
              render: () => renderDataActivitySection("demo-data"),
            },
          ]
        : [
            {
              id: "layers-stack",
              label: "Layers",
              render: () => layerStackElement,
            },
            {
              id: "layers-contents",
              label: "Contents",
              render: () => layersContentsElement,
            },
            {
              id: "layers-catalog",
              label: "Catalog",
              render: () => layersCatalogElement,
            },
            {
              id: "layers-sources",
              label: "Sources",
              render: () => layersSourcesElement,
            },
            {
              id: "layers-bookmarks",
              label: "Bookmarks",
              render: () => layersBookmarksElement,
            },
          ];
  void layersCartographyElement;
  const layersContentsTabActive =
    showLayerPanel && activeActivityId === "layers" && workbenchSidebarTab === "layers-contents";
  const dataCatalogTabActive =
    showLayerPanel && activeActivityId === "data" && workbenchSidebarTab === "data-catalog";

  // Shared props for the unified command-bar tool cluster (header) and the
  // map-canvas overlays (north arrow + keyboard help). One source of truth so the
  // embedded "bar" surface and the "overlay" surface never drift apart.
  const mapCanvasControlsProps = {
    activeBaseLayer,
    onSetBaseLayer: handleSetBaseLayer,
    activeTool,
    selectionDragTool,
    activeDrawTool,
    activeMeasureTool,
    selectionModeDisabled: nlQueryToolbarContext.queryableLayers.length === 0,
    selectionModeDisabledReason: "No queryable visible layers are available for selection.",
    selectedFeatureCount,
    visibleLayerCount: visiblePublicationLayers.length,
    hasActiveAoi: Boolean(contextSummary.activeAoi),
    legendVisible: mapCompositionOptions.includeLegend && mapPublicationLegendItems.length > 0,
    legendAvailable: mapPublicationLegendItems.length > 0,
    scaleBarVisible: mapCompositionOptions.includeScaleBar,
    swipeCompareVisible: showSwipeCompare,
    northArrowVisible: mapCompositionOptions.includeNorthArrow,
    bearing,
    mapOnlyMode: !effectiveShowLayerPanel && !effectiveShowSidebar,
    pinCount: pins.length,
    bookmarkCount: bookmarks.length,
    fitSelectedDisabled: !selectedCanvasFitContext,
    fitSelectedReason: "Select a layer, feature, or AOI before fitting the map.",
    fitVisibleDisabled: !visibleLayerFitBounds,
    fitVisibleReason: "Show at least one layer before fitting visible layers.",
    onZoomIn: () => handleCanvasZoom(1),
    onZoomOut: () => handleCanvasZoom(-1),
    onResetView: handleCanvasResetView,
    onFitVisibleLayers: handleCanvasFitVisibleLayers,
    onFitSelectedContext: handleCanvasFitSelectedContext,
    onOpenCrsReadiness: handleOpenCanvasCrsReadiness,
    onToggleLegend: handleToggleCanvasLegend,
    onToggleScaleBar: handleToggleCanvasScaleBar,
    onToggleSwipeCompare: handleToggleCanvasSwipeCompare,
    onToggleNorthArrow: handleToggleCanvasNorthArrow,
    onSetSelectionDragTool: handleSetSelectionDragTool,
    onDrawAoi: () => handleSetDrawTool(activeDrawTool === "polygon" ? null : "polygon"),
    onMeasureDistance: () => handleSetMeasureTool(activeMeasureTool === "measure-distance" ? null : "measure-distance"),
    onMeasureArea: () => handleSetMeasureTool(activeMeasureTool === "measure-area" ? null : "measure-area"),
    keyboardHelpVisible: showCanvasKeyboardHelp,
    onToggleKeyboardHelp: handleToggleCanvasKeyboardHelp,
    onClearActiveTool: handleClearActiveCanvasTool,
  } satisfies Omit<React.ComponentProps<typeof MapCanvasControls>, "surface">;
  const dockControlLabel = effectiveShowLayerPanel ? "Hide docked panels" : "Show docked panels";
  return {
    analyzeDataOperationsElement,
    analyzeModelsElement,
    analyzeQueryElement,
    analyzeStatisticsElement,
    analyzeToolsElement,
    analyzeWorkflowElement,
    analyzeModelsTabActive,
    analyzeQueryTabActive,
    analyzeToolsTabActive,
    analyzeWorkflowsTabActive,
    dataCatalogTabActive,
    dockControlLabel,
    exportDisabled,
    exportDisabledReason,
    isWorkbenchActivity,
    layerStackElement,
    layersContentsTabActive,
    mapCanvasControlsProps,
    packageExportDisabled,
    packageExportDisabledReason,
    pointSymbologyControlBody,
    publishDataExportElement,
    publishFigureElement,
    publishFigureTabActive,
    publishOfflinePackageElement,
    publishReadinessItems,
    publishReportElement,
    publishReportTabActive,
    publishReviewPackageElement,
    reportDisabledReason,
    scene3DElement,
    scene3DTabActive,
    sceneMassingElement,
    sceneMassingTabActive,
    sceneRasterElement,
    sceneRasterTabActive,
    sceneStatusChips,
    sceneSunShadowElement,
    sceneSunShadowTabActive,
    sceneTemporalElement,
    sceneTemporalTabActive,
    sceneVoxCityElement,
    sceneVoxCityTabActive,
    sceneZoningElement,
    sceneZoningTabActive,
    styleAdvisorElement,
    styleLabelsElement,
    styleLegendElement,
    styleRendererElement,
    styleRendererTabActive,
    styleSymbolsElement,
    transitionStyle,
    workbenchSidebarTabs,
    handleSceneWorkspaceTabChange,
    handleToggleStyleRenderer,
  };
}
