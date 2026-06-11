import React from "react";

import { IconLayers } from "../MapIcons";
import { MapPanelErrorBoundary } from "../MapPanelErrorBoundary";
import { MapProcessingToolboxPanel } from "../processing";
import { MapModelBuilderPanel } from "../modelBuilder";
import { MapPluginPanel } from "../plugins";
import { ScientificQAPanel } from "../ScientificQAPanel";
import { MapNLQueryPanel } from "../MapNLQueryPanel";
import { MapWorkflowDrawer } from "../MapWorkflowDrawer";
import { MapChoroplethLayer } from "../../MapChoroplethLayer";
import { MapClusterViz } from "../../MapClusterViz";
import { MapHotSpotViz } from "../../MapHotSpotViz";
import { MapEmergingHotSpotViz } from "../../MapEmergingHotSpotViz";
import { MapDrawingManager } from "../../MapDrawingManager";
import { MapMeasurementTool } from "../../MapMeasurementTool";
import { MapContextMenu } from "../../MapContextMenu";
import { MapAnnotationLayer } from "../../MapAnnotationLayer";
import { MapPinSidebar } from "../MapPinSidebar";
import { MapTemporalPlayer } from "../../MapTemporalPlayer";
import { MapCanvasControls } from "../MapCanvasControls";
import { MapLegendOverlay } from "../inspector/style/MapLegendOverlay";
import { MapPerformanceBudgetBanner } from "../MapPerformanceDiagnosticsPanel";
import { MapRightDockHost } from "../MapRightDockHost";
import { MapUrbanMethodCompatibilityRail } from "../MapUrbanMethodCompatibilityRail";
import { MapLayoutDesignerPanel } from "../layout/MapLayoutDesignerPanel";
import { WorkflowPreviewOverlay } from "./MapWorkflowPreviewOverlay";
import { Scene3DInteractionStrip } from "../scene3d/Scene3DInteractionStrip";
import { ScenarioComparisonStrip } from "../scene3d/ScenarioComparisonStrip";
import type { MapSceneTabId } from "../scene";

interface MapExplorerModalRuntimeViewProps {
  announce: (message: string) => void;
  handleOpenSceneTab: (tabId: MapSceneTabId, announcement: string) => void;
  navigatorStageMode: boolean;
  scene3DTabActive: boolean;
  sceneMassingTabActive: boolean;
  sceneRasterTabActive: boolean;
  sceneSunShadowTabActive: boolean;
  sceneZoningTabActive: boolean;
  showPluginPanel: boolean;
  setShowPluginPanel: React.Dispatch<React.SetStateAction<boolean>>;
  pluginExtensions: React.ComponentProps<typeof MapPluginPanel>["extensions"];
  showProcessingToolbox: boolean;
  setShowProcessingToolbox: React.Dispatch<React.SetStateAction<boolean>>;
  analyzeToolsTabActive: boolean;
  searchProcessingTools: React.ComponentProps<typeof MapProcessingToolboxPanel>["searchTools"];
  processingToolboxLayers: React.ComponentProps<typeof MapProcessingToolboxPanel>["layers"];
  handlePreviewProcessingTool: React.ComponentProps<typeof MapProcessingToolboxPanel>["onPreview"];
  handleRunProcessingTool: React.ComponentProps<typeof MapProcessingToolboxPanel>["onRun"];
  showModelBuilder: boolean;
  setShowModelBuilder: React.Dispatch<React.SetStateAction<boolean>>;
  analyzeModelsTabActive: boolean;
  processingToolDescriptors: React.ComponentProps<typeof MapModelBuilderPanel>["tools"];
  handleRunMapModel: React.ComponentProps<typeof MapModelBuilderPanel>["onRun"];
  handleRunMapModelBatch: React.ComponentProps<typeof MapModelBuilderPanel>["onRunBatch"];
  handleExportMapModelToIdeAndUrban: React.ComponentProps<typeof MapModelBuilderPanel>["onExportToIdeAndUrban"];
  effectiveShowWorkflowDrawer: boolean;
  analyzeWorkflowsTabActive: boolean;
  workflowPreview: React.ComponentProps<typeof WorkflowPreviewOverlay>["preview"];
  effectiveShowScientificQAPanel: boolean;
  scientificQA: React.ComponentProps<typeof ScientificQAPanel>["qaState"];
  overlayLayers: React.ComponentProps<typeof ScientificQAPanel>["overlayLayers"];
  compactDock: boolean;
  rightPanelWidth: number;
  handleRightPanelWidthChange: (nextWidth: number) => void;
  setShowScientificQAPanel: React.Dispatch<React.SetStateAction<boolean>>;
  handleFocusLayer: React.ComponentProps<typeof ScientificQAPanel>["onOpenLayer"];
  handleInspectLayer: React.ComponentProps<typeof ScientificQAPanel>["onInspectLayer"];
  handleRepairLayerGeometry: React.ComponentProps<typeof ScientificQAPanel>["onRepairGeometry"];
  handleOpenPublishTab: (tabId: "publish-data-export", announcement: string) => void;
  effectiveShowNLQueryPanel: boolean;
  analyzeQueryTabActive: boolean;
  selectedAoiFeatureForQuery: React.ComponentProps<typeof MapNLQueryPanel>["selectedAoiFeature"];
  currentMapBounds: React.ComponentProps<typeof MapNLQueryPanel>["currentMapBounds"];
  isRunningMapNLQuery: boolean;
  lastMapNLQuerySummary: React.ComponentProps<typeof MapNLQueryPanel>["lastRunSummary"];
  handleRunMapNLQuery: React.ComponentProps<typeof MapNLQueryPanel>["onRun"];
  handleMapNLQueryProposalGenerated: React.ComponentProps<typeof MapNLQueryPanel>["onProposalGenerated"];
  handleMapNLQueryPreviewDecision: React.ComponentProps<typeof MapNLQueryPanel>["onPreviewDecision"];
  setShowNLQueryPanel: React.Dispatch<React.SetStateAction<boolean>>;
  urbanWorkflowDraftRequest: React.ComponentProps<typeof MapWorkflowDrawer>["initialDraftRequest"];
  workflowContext: React.ComponentProps<typeof MapWorkflowDrawer>["context"];
  setShowWorkflowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  setWorkflowPreview: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof WorkflowPreviewOverlay>["preview"]>>;
  setUrbanWorkflowDraftRequest: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapWorkflowDrawer>["initialDraftRequest"]>>;
  handleApplyMapWorkflow: React.ComponentProps<typeof MapWorkflowDrawer>["onApply"];
  handleSaveWorkflowReport: React.ComponentProps<typeof MapWorkflowDrawer>["onSaveReport"];
  handleOpenWorkflowScriptInIde: React.ComponentProps<typeof MapWorkflowDrawer>["onOpenWorkflowScript"];
  handleExecuteMapWorkflow: React.ComponentProps<typeof MapWorkflowDrawer>["onExecuteWorkflow"];
  handleCancelMapWorkflow: React.ComponentProps<typeof MapWorkflowDrawer>["onCancelWorkflow"];
  workflowExecution: React.ComponentProps<typeof MapWorkflowDrawer>["workflowExecution"];
  mapCanvasControlsProps: React.ComponentProps<typeof MapCanvasControls>;
  showLegendOverlay: boolean;
  mapPublicationLegendItems: React.ComponentProps<typeof MapLegendOverlay>["items"];
  performanceDiagnostics: React.ComponentProps<typeof MapPerformanceBudgetBanner>["diagnostics"];
  openPerformanceRightDock: (announcement: string, source: "quick-action" | "status-bar") => void;
  activeRightDockRoute: React.ComponentProps<typeof MapRightDockHost>["route"] | null;
  rightDockPanels: React.ComponentProps<typeof MapRightDockHost>["panels"];
  rightDockBodyContent: React.ReactNode;
  handleRightDockHostPanelChange: React.ComponentProps<typeof MapRightDockHost>["onPanelChange"];
  handleCollapseRightDockHost: React.ComponentProps<typeof MapRightDockHost>["onCollapse"];
  handleCloseRightDockHost: React.ComponentProps<typeof MapRightDockHost>["onClose"];
  effectiveShowUrbanMethodPanel: boolean;
  activeUrbanMethodRequest: React.ComponentProps<typeof MapUrbanMethodCompatibilityRail>["request"];
  activeUrbanMethodPreview: React.ComponentProps<typeof MapUrbanMethodCompatibilityRail>["preview"];
  handleCloseUrbanMethodRail: React.ComponentProps<typeof MapUrbanMethodCompatibilityRail>["onClose"];
  handleFocusUrbanMethodLayer: React.ComponentProps<typeof MapUrbanMethodCompatibilityRail>["onFocusLayer"];
  handlePreviewUrbanMethodWorkflow: React.ComponentProps<typeof MapUrbanMethodCompatibilityRail>["onPreviewWorkflow"];
  showFigureComposer: boolean;
  publishFigureTabActive: boolean;
  bearing: number;
  temporalLayoutRestoreRequest: React.ComponentProps<typeof MapLayoutDesignerPanel>["restoreRequest"];
  setShowFigureComposer: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMapExportDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleTemporalRestoreRequestHandled: React.ComponentProps<typeof MapLayoutDesignerPanel>["onRestoreRequestHandled"];
  mapRef: React.ComponentProps<typeof MapChoroplethLayer>["mapRef"];
  reducedMotion: boolean;
  temporalPlayerMap: React.ComponentProps<typeof MapTemporalPlayer>["map"];
  temporalFrames: React.ComponentProps<typeof MapTemporalPlayer>["frames"];
  temporalTimeProperty: React.ComponentProps<typeof MapTemporalPlayer>["timeProperty"];
  temporalSourceId: React.ComponentProps<typeof MapTemporalPlayer>["sourceId"] | null;
  temporalLayerId: React.ComponentProps<typeof MapTemporalPlayer>["layerId"] | null;
  temporalLayerName: React.ComponentProps<typeof MapTemporalPlayer>["layerName"] | null;
  temporalPlayerVisible: boolean;
  showChoroplethPanel: boolean;
  setShowChoroplethPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showClusterViz: boolean;
  setShowClusterViz: React.Dispatch<React.SetStateAction<boolean>>;
  showHotSpotViz: boolean;
  setShowHotSpotViz: React.Dispatch<React.SetStateAction<boolean>>;
  showEmergingHotSpotViz: boolean;
  setShowEmergingHotSpotViz: React.Dispatch<React.SetStateAction<boolean>>;
  activeDrawTool: React.ComponentProps<typeof MapDrawingManager>["activeDrawTool"];
  drawSeed: React.ComponentProps<typeof MapDrawingManager>["seedDrawStart"];
  drawnFeatures: React.ComponentProps<typeof MapDrawingManager>["drawnFeatures"];
  drawingSnapSources: React.ComponentProps<typeof MapDrawingManager>["snapSources"];
  selectedFeatureId: React.ComponentProps<typeof MapDrawingManager>["selectedFeatureId"];
  addDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onAddFeature"];
  removeDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onRemoveFeature"];
  updateDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onUpdateFeature"];
  handleCommitDrawnFeatureEdit: React.ComponentProps<typeof MapDrawingManager>["onCommitFeatureEdit"];
  clearDrawnFeatures: React.ComponentProps<typeof MapDrawingManager>["onClearFeatures"];
  setSelectedFeatureId: React.ComponentProps<typeof MapDrawingManager>["onSelectFeature"];
  handleCancelDraw: React.ComponentProps<typeof MapDrawingManager>["onCancelDraw"];
  setDrawSeed: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapDrawingManager>["seedDrawStart"]>>;
  effectiveShowMeasurePanel: boolean;
  rightMeasureDockActive: boolean;
  activeMeasureTool: React.ComponentProps<typeof MapMeasurementTool>["activeMeasureTool"];
  measurementSeed: React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"];
  measurements: React.ComponentProps<typeof MapMeasurementTool>["measurements"];
  measureUnit: React.ComponentProps<typeof MapMeasurementTool>["measureUnit"];
  addMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onAddMeasurement"];
  removeMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onRemoveMeasurement"];
  clearMeasurements: React.ComponentProps<typeof MapMeasurementTool>["onClearMeasurements"];
  setMeasureUnit: React.ComponentProps<typeof MapMeasurementTool>["onSetMeasureUnit"];
  handleCancelMeasure: React.ComponentProps<typeof MapMeasurementTool>["onCancelMeasure"];
  setMeasurementSeed: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"]>>;
  pins: React.ComponentProps<typeof MapPinSidebar>["pins"];
  effectiveShowSidebar: boolean;
  handleRemovePin: React.ComponentProps<typeof MapPinSidebar>["onRemovePin"];
  handleClearPins: React.ComponentProps<typeof MapPinSidebar>["onClearAll"];
  flyTo: React.ComponentProps<typeof MapPinSidebar>["onFlyTo"];
  effectiveShowLayerPanel: boolean;
  layerPanelOpenButtonStyle: React.CSSProperties;
  layerOpenButtonIconSize: number;
  handleMapClick: React.ComponentProps<typeof MapContextMenu>["onAddPin"];
  handleStartMeasureFromContext: React.ComponentProps<typeof MapContextMenu>["onStartMeasure"];
  handleStartPolygonFromContext: React.ComponentProps<typeof MapContextMenu>["onStartPolygonDraw"];
  handleOpenFlowDispatchDialog: React.ComponentProps<typeof MapContextMenu>["onAnalyzeArea"];
  handleIsochroneDispatch: React.ComponentProps<typeof MapContextMenu>["onIsochroneFromHere"];
  handleHotSpotDispatch: React.ComponentProps<typeof MapContextMenu>["onHotSpotAroundHere"];
  handleRunSelectionStatistics: React.ComponentProps<typeof MapContextMenu>["onRunStatisticsOnSelection"];
  selectionStatsAvailable: boolean;
  annotationMode: React.ComponentProps<typeof MapAnnotationLayer>["active"];
  annotations: React.ComponentProps<typeof MapAnnotationLayer>["annotations"];
  selectedAnnotationId: React.ComponentProps<typeof MapAnnotationLayer>["selectedAnnotationId"];
  annotationToolSettings: React.ComponentProps<typeof MapAnnotationLayer>["settings"];
  handleAddMapAnnotation: React.ComponentProps<typeof MapAnnotationLayer>["onAddAnnotation"];
  handleUpdateMapAnnotation: React.ComponentProps<typeof MapAnnotationLayer>["onUpdateAnnotation"];
  handleMoveMapAnnotation: React.ComponentProps<typeof MapAnnotationLayer>["onMoveAnnotation"];
  handleRemoveMapAnnotation: React.ComponentProps<typeof MapAnnotationLayer>["onRemoveAnnotation"];
  setSelectedAnnotationId: React.ComponentProps<typeof MapAnnotationLayer>["onSelectAnnotation"];
  setAnnotationToolSettings: React.ComponentProps<typeof MapAnnotationLayer>["onSettingsChange"];
  handleDeactivateAnnotationMode: React.ComponentProps<typeof MapAnnotationLayer>["onDeactivate"];
  setShowComparisonStrip: React.Dispatch<React.SetStateAction<boolean>>;
  setShowInteractionStrip: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLayerPanel: (next: boolean) => void;
  showComparisonStrip: boolean;
  showInteractionStrip: boolean;
}

export const MapExplorerModalRuntimeView: React.FC<MapExplorerModalRuntimeViewProps> = ({
  announce,
  handleOpenSceneTab,
  navigatorStageMode,
  scene3DTabActive,
  sceneMassingTabActive,
  sceneRasterTabActive,
  sceneSunShadowTabActive,
  sceneZoningTabActive,
  showPluginPanel,
  setShowPluginPanel,
  pluginExtensions,
  showProcessingToolbox,
  setShowProcessingToolbox,
  analyzeToolsTabActive,
  searchProcessingTools,
  processingToolboxLayers,
  handlePreviewProcessingTool,
  handleRunProcessingTool,
  showModelBuilder,
  setShowModelBuilder,
  analyzeModelsTabActive,
  processingToolDescriptors,
  handleRunMapModel,
  handleRunMapModelBatch,
  handleExportMapModelToIdeAndUrban,
  effectiveShowWorkflowDrawer,
  analyzeWorkflowsTabActive,
  workflowPreview,
  effectiveShowScientificQAPanel,
  scientificQA,
  overlayLayers,
  compactDock,
  rightPanelWidth,
  handleRightPanelWidthChange,
  setShowScientificQAPanel,
  handleFocusLayer,
  handleInspectLayer,
  handleRepairLayerGeometry,
  handleOpenPublishTab,
  effectiveShowNLQueryPanel,
  analyzeQueryTabActive,
  selectedAoiFeatureForQuery,
  currentMapBounds,
  isRunningMapNLQuery,
  lastMapNLQuerySummary,
  handleRunMapNLQuery,
  handleMapNLQueryProposalGenerated,
  handleMapNLQueryPreviewDecision,
  setShowNLQueryPanel,
  urbanWorkflowDraftRequest,
  workflowContext,
  setShowWorkflowDrawer,
  setWorkflowPreview,
  setUrbanWorkflowDraftRequest,
  handleApplyMapWorkflow,
  handleSaveWorkflowReport,
  handleOpenWorkflowScriptInIde,
  handleExecuteMapWorkflow,
  handleCancelMapWorkflow,
  workflowExecution,
  mapCanvasControlsProps,
  showLegendOverlay,
  mapPublicationLegendItems,
  performanceDiagnostics,
  openPerformanceRightDock,
  activeRightDockRoute,
  rightDockPanels,
  rightDockBodyContent,
  handleRightDockHostPanelChange,
  handleCollapseRightDockHost,
  handleCloseRightDockHost,
  effectiveShowUrbanMethodPanel,
  activeUrbanMethodRequest,
  activeUrbanMethodPreview,
  handleCloseUrbanMethodRail,
  handleFocusUrbanMethodLayer,
  handlePreviewUrbanMethodWorkflow,
  showFigureComposer,
  publishFigureTabActive,
  bearing,
  temporalLayoutRestoreRequest,
  setShowFigureComposer,
  setShowMapExportDialog,
  handleTemporalRestoreRequestHandled,
  mapRef,
  reducedMotion,
  temporalPlayerMap,
  temporalFrames,
  temporalTimeProperty,
  temporalSourceId,
  temporalLayerId,
  temporalLayerName,
  temporalPlayerVisible,
  showChoroplethPanel,
  setShowChoroplethPanel,
  showClusterViz,
  setShowClusterViz,
  showHotSpotViz,
  setShowHotSpotViz,
  showEmergingHotSpotViz,
  setShowEmergingHotSpotViz,
  activeDrawTool,
  drawSeed,
  drawnFeatures,
  drawingSnapSources,
  selectedFeatureId,
  addDrawnFeature,
  removeDrawnFeature,
  updateDrawnFeature,
  handleCommitDrawnFeatureEdit,
  clearDrawnFeatures,
  setSelectedFeatureId,
  handleCancelDraw,
  setDrawSeed,
  effectiveShowMeasurePanel,
  rightMeasureDockActive,
  activeMeasureTool,
  measurementSeed,
  measurements,
  measureUnit,
  addMeasurement,
  removeMeasurement,
  clearMeasurements,
  setMeasureUnit,
  handleCancelMeasure,
  setMeasurementSeed,
  pins,
  effectiveShowSidebar,
  handleRemovePin,
  handleClearPins,
  flyTo,
  effectiveShowLayerPanel,
  layerPanelOpenButtonStyle,
  layerOpenButtonIconSize,
  handleMapClick,
  handleStartMeasureFromContext,
  handleStartPolygonFromContext,
  handleOpenFlowDispatchDialog,
  handleIsochroneDispatch,
  handleHotSpotDispatch,
  handleRunSelectionStatistics,
  selectionStatsAvailable,
  annotationMode,
  annotations,
  selectedAnnotationId,
  annotationToolSettings,
  handleAddMapAnnotation,
  handleUpdateMapAnnotation,
  handleMoveMapAnnotation,
  handleRemoveMapAnnotation,
  setSelectedAnnotationId,
  setAnnotationToolSettings,
  handleDeactivateAnnotationMode,
  setShowComparisonStrip,
  setShowInteractionStrip,
  setShowLayerPanel,
  showComparisonStrip,
  showInteractionStrip,
}) => (
  <>
    {/* 3D + Zoning toggle triggers — accessible via toolbar or testid */}
    <button
      type="button"
      data-testid="toggle-raster-panel"
      aria-label="Toggle raster evidence panel"
      style={{ display: "none" }}
      onClick={() => {
        if (sceneRasterTabActive) {
          setShowLayerPanel(false);
          announce("Raster evidence panel closed");
          return;
        }
        handleOpenSceneTab("scene-raster", "Raster evidence panel opened in Scene");
      }}
    />
    <button
      type="button"
      data-testid="toggle-3d-panel"
      aria-label="Toggle 3D scene panel"
      style={{ display: "none" }}
      onClick={() => {
        if (scene3DTabActive) {
          setShowLayerPanel(false);
          announce("3D scene panel closed");
          return;
        }
        handleOpenSceneTab("scene-3d", "3D scene panel opened in Scene");
      }}
    />
    <button
      type="button"
      data-testid="toggle-zoning-panel"
      aria-label="Toggle zoning rules panel"
      style={{ display: "none" }}
      onClick={() => {
        if (sceneZoningTabActive) {
          setShowLayerPanel(false);
          announce("Zoning rules panel closed");
          return;
        }
        handleOpenSceneTab("scene-zoning", "Zoning rules panel opened in Scene");
      }}
    />
    <button
      type="button"
      data-testid="toggle-massing-panel"
      aria-label="Toggle massing scenarios panel"
      style={{ display: "none" }}
      onClick={() => {
        if (sceneMassingTabActive) {
          setShowLayerPanel(false);
          announce("Massing scenarios panel closed");
          return;
        }
        handleOpenSceneTab("scene-massing", "Massing scenarios panel opened in Scene");
      }}
    />
    <button
      type="button"
      data-testid="toggle-sunshadow-panel"
      aria-label="Toggle sun/shadow analysis panel"
      style={{ display: "none" }}
      onClick={() => {
        if (sceneSunShadowTabActive) {
          setShowLayerPanel(false);
          announce("Sun/shadow analysis panel closed");
          return;
        }
        handleOpenSceneTab("scene-sun-shadow", "Sun/shadow analysis panel opened in Scene");
      }}
    />
    <button
      type="button"
      data-testid="toggle-3d-interaction-strip"
      aria-label="Toggle 3D interaction strip"
      style={{ display: "none" }}
      onClick={() => setShowInteractionStrip((p) => !p)}
    />
    <button
      type="button"
      data-testid="toggle-3d-comparison-strip"
      aria-label="Toggle scenario comparison strip"
      style={{ display: "none" }}
      onClick={() => setShowComparisonStrip((p) => !p)}
    />

    <Scene3DInteractionStrip visible={!!showInteractionStrip && !navigatorStageMode} />

    {Boolean(showComparisonStrip) && !navigatorStageMode ? (
      <ScenarioComparisonStrip
        visible
        onClose={() => {
          setShowComparisonStrip(false);
          announce("Scenario comparison strip closed");
        }}
      />
    ) : null}

    {Boolean(showPluginPanel) && !navigatorStageMode ? (
      <MapPanelErrorBoundary
        panelName="Plugin registry"
        resetKey={showPluginPanel}
        onClose={() => {
          setShowPluginPanel(false);
          announce("Plugin registry closed");
        }}
      >
        <MapPluginPanel
          visible
          extensions={pluginExtensions}
          onClose={() => {
            setShowPluginPanel(false);
            announce("Plugin registry closed");
          }}
        />
      </MapPanelErrorBoundary>
    ) : null}

    <MapPanelErrorBoundary
      panelName="Processing toolbox"
      resetKey={showProcessingToolbox}
      onClose={() => {
        setShowProcessingToolbox(false);
        announce("Processing toolbox closed");
      }}
    >
      <MapProcessingToolboxPanel
        visible={!!showProcessingToolbox && !navigatorStageMode && !analyzeToolsTabActive}
        onClose={() => {
          setShowProcessingToolbox(false);
          announce("Processing toolbox closed");
        }}
        searchTools={searchProcessingTools}
        layers={processingToolboxLayers}
        onPreview={handlePreviewProcessingTool}
        onRun={handleRunProcessingTool}
      />
    </MapPanelErrorBoundary>

    {Boolean(showModelBuilder) && !navigatorStageMode && !analyzeModelsTabActive ? (
      <MapPanelErrorBoundary
        panelName="Model builder"
        resetKey={showModelBuilder}
        onClose={() => {
          setShowModelBuilder(false);
          announce("Model builder closed");
        }}
      >
        <MapModelBuilderPanel
          visible
          onClose={() => {
            setShowModelBuilder(false);
            announce("Model builder closed");
          }}
          tools={processingToolDescriptors}
          layers={processingToolboxLayers}
          onRun={handleRunMapModel}
          onRunBatch={handleRunMapModelBatch}
          onExportToIdeAndUrban={handleExportMapModelToIdeAndUrban}
        />
      </MapPanelErrorBoundary>
    ) : null}

    <WorkflowPreviewOverlay preview={(effectiveShowWorkflowDrawer || analyzeWorkflowsTabActive) ? workflowPreview : null} />

    <ScientificQAPanel
      visible={effectiveShowScientificQAPanel}
      qaState={scientificQA}
      overlayLayers={overlayLayers}
      presentation={compactDock ? "bottom-drawer" : "right-rail"}
      width={rightPanelWidth}
      onWidthChange={handleRightPanelWidthChange}
      onClose={() => {
        setShowScientificQAPanel(false);
        announce("Scientific QA panel closed");
      }}
      onShowDetails={(issue) => {
        announce(`Scientific QA details opened for ${issue.title}`);
      }}
      onOpenLayer={handleFocusLayer}
      onDeclareCrs={(layerId) => {
        handleInspectLayer(layerId);
        announce("Inspector opened — use the CRS tab to declare a coordinate reference system");
      }}
      onInspectLayer={handleInspectLayer}
      onRepairGeometry={handleRepairLayerGeometry}
      onOpenExportReadiness={() => {
        handleOpenPublishTab("publish-data-export", "Export readiness opened in Publish");
      }}
    />

    <MapNLQueryPanel
      visible={!!effectiveShowNLQueryPanel && !analyzeQueryTabActive}
      overlayLayers={overlayLayers}
      selectedAoiFeature={selectedAoiFeatureForQuery}
      currentMapBounds={currentMapBounds}
      isRunning={isRunningMapNLQuery}
      lastRunSummary={lastMapNLQuerySummary}
      onRun={handleRunMapNLQuery}
      onProposalGenerated={handleMapNLQueryProposalGenerated}
      onPreviewDecision={handleMapNLQueryPreviewDecision}
      onClose={() => {
        setShowNLQueryPanel(false);
        announce("Map query builder closed");
      }}
      onAnnounce={announce}
    />

    <MapWorkflowDrawer
      visible={!!effectiveShowWorkflowDrawer && !analyzeWorkflowsTabActive}
      context={workflowContext}
      initialDraftRequest={urbanWorkflowDraftRequest}
      presentation={compactDock ? "bottom-drawer" : "right-rail"}
      width={rightPanelWidth}
      onWidthChange={handleRightPanelWidthChange}
      onClose={() => {
        setShowWorkflowDrawer(false);
        setWorkflowPreview(null);
        setUrbanWorkflowDraftRequest(null);
        announce("Spatial workflow drawer closed");
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

    <MapCanvasControls {...mapCanvasControlsProps} surface="overlay" />

    {showLegendOverlay ? (
      <MapLegendOverlay items={mapPublicationLegendItems} />
    ) : null}

    {!navigatorStageMode ? (
      <MapPerformanceBudgetBanner
        diagnostics={performanceDiagnostics}
        rightInset="calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))"
        onOpenDetails={() => openPerformanceRightDock("Render budget details opened in the right dock", "quick-action")}
      />
    ) : null}

    {activeRightDockRoute && !navigatorStageMode ? (
      <MapRightDockHost
        route={activeRightDockRoute}
        panels={rightDockPanels}
        presentation={compactDock ? "side-drawer" : "right-dock"}
        width={rightPanelWidth}
        stateLabel={activeRightDockRoute.legacyBottomTabId ? "Migrating" : "Routed"}
        onPanelChange={handleRightDockHostPanelChange}
        onCollapse={handleCollapseRightDockHost}
        onClose={handleCloseRightDockHost}
      >
        {rightDockBodyContent}
      </MapRightDockHost>
    ) : null}

    <MapUrbanMethodCompatibilityRail
      visible={effectiveShowUrbanMethodPanel}
      request={activeUrbanMethodRequest}
      preview={activeUrbanMethodPreview}
      presentation={compactDock ? "bottom-drawer" : "right-rail"}
      width={rightPanelWidth}
      onClose={handleCloseUrbanMethodRail}
      onFocusLayer={handleFocusUrbanMethodLayer}
      onPreviewWorkflow={handlePreviewUrbanMethodWorkflow}
    />

    <MapLayoutDesignerPanel
      visible={!!showFigureComposer && !navigatorStageMode && !publishFigureTabActive}
      overlayLayers={overlayLayers}
      qaState={scientificQA}
      bearing={bearing}
      restoreRequest={temporalLayoutRestoreRequest}
      onClose={() => {
        setShowFigureComposer(false);
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

    {temporalSourceId != null && temporalLayerId != null && temporalLayerName != null ? (
      <MapTemporalPlayer
        map={temporalPlayerMap}
        frames={temporalFrames}
        timeProperty={temporalTimeProperty}
        sourceId={temporalSourceId}
        layerId={temporalLayerId}
        layerName={temporalLayerName}
        visible={temporalPlayerVisible}
        emitEvidenceArtifact={false}
      />
    ) : null}

    {!effectiveShowLayerPanel && !navigatorStageMode ? (
      <button
        type="button"
        style={layerPanelOpenButtonStyle}
        onClick={() => {
          setShowLayerPanel(true);
          announce("Layer panel opened");
        }}
        aria-label={`Open layer panel — ${overlayLayers.length} overlay layer${overlayLayers.length !== 1 ? "s" : ""}`}
      >
        <IconLayers size={layerOpenButtonIconSize} />
        Layers{overlayLayers.length > 0 ? ` (${overlayLayers.length})` : ""}
      </button>
    ) : null}

    <MapContextMenu
      mapRef={mapRef}
      pins={pins}
      drawnFeatures={drawnFeatures}
      overlayLayers={overlayLayers}
      reducedMotion={reducedMotion}
      onAddPin={handleMapClick}
      onStartMeasure={handleStartMeasureFromContext}
      onStartPolygonDraw={handleStartPolygonFromContext}
      onAnalyzeArea={handleOpenFlowDispatchDialog}
      onIsochroneFromHere={handleIsochroneDispatch}
      onHotSpotAroundHere={handleHotSpotDispatch}
      onRunStatisticsOnSelection={handleRunSelectionStatistics}
      selectionStatsAvailable={selectionStatsAvailable}
      onAnnounce={announce}
    />

    <MapAnnotationLayer
      mapRef={mapRef}
      active={annotationMode}
      annotations={annotations}
      selectedAnnotationId={selectedAnnotationId}
      settings={annotationToolSettings}
      onAddAnnotation={handleAddMapAnnotation}
      onUpdateAnnotation={handleUpdateMapAnnotation}
      onMoveAnnotation={handleMoveMapAnnotation}
      onRemoveAnnotation={handleRemoveMapAnnotation}
      onSelectAnnotation={setSelectedAnnotationId}
      onSettingsChange={setAnnotationToolSettings}
      onDeactivate={handleDeactivateAnnotationMode}
      onAnnounce={announce}
    />

    <MapChoroplethLayer
      mapRef={mapRef}
      overlayLayers={overlayLayers}
      visible={!!showChoroplethPanel && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
      onClose={() => setShowChoroplethPanel(false)}
      onAnnounce={announce}
    />

    <MapClusterViz
      mapRef={mapRef}
      overlayLayers={overlayLayers}
      visible={!!showClusterViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
      onClose={() => setShowClusterViz(false)}
      onAnnounce={announce}
    />

    <MapHotSpotViz
      mapRef={mapRef}
      overlayLayers={overlayLayers}
      visible={!!showHotSpotViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
      onClose={() => setShowHotSpotViz(false)}
      onAnnounce={announce}
    />

    <MapEmergingHotSpotViz
      overlayLayers={overlayLayers}
      visible={!!showEmergingHotSpotViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
      onClose={() => setShowEmergingHotSpotViz(false)}
      onAnnounce={announce}
    />

    {!navigatorStageMode ? (
      <MapDrawingManager
        mapRef={mapRef}
        activeDrawTool={activeDrawTool}
        presentation="headless"
        sidebarVisible={false}
        seedDrawStart={drawSeed}
        drawnFeatures={drawnFeatures}
        snapSources={drawingSnapSources}
        selectedFeatureId={selectedFeatureId}
        onAddFeature={addDrawnFeature}
        onRemoveFeature={removeDrawnFeature}
        onUpdateFeature={updateDrawnFeature}
        onCommitFeatureEdit={handleCommitDrawnFeatureEdit}
        onClearFeatures={clearDrawnFeatures}
        onSelectFeature={setSelectedFeatureId}
        onCancelDraw={handleCancelDraw}
        onSeedHandled={(token) =>
          setDrawSeed((current) => (current?.token === token ? null : current))
        }
        onAnnounce={announce}
      />
    ) : null}

    {!navigatorStageMode && effectiveShowMeasurePanel && !rightMeasureDockActive ? (
      <MapMeasurementTool
        mapRef={mapRef}
        activeMeasureTool={activeMeasureTool}
        presentation="headless"
        seedMeasurementStart={measurementSeed}
        measurements={measurements}
        measureUnit={measureUnit}
        onAddMeasurement={addMeasurement}
        onRemoveMeasurement={removeMeasurement}
        onClearMeasurements={clearMeasurements}
        onSetMeasureUnit={setMeasureUnit}
        onCancelMeasure={handleCancelMeasure}
        onSeedHandled={(token) =>
          setMeasurementSeed((current) =>
            current?.token === token ? null : current,
          )
        }
        onAnnounce={announce}
      />
    ) : null}

    <MapPinSidebar
      pins={pins}
      visible={effectiveShowSidebar}
      onRemovePin={handleRemovePin}
      onClearAll={handleClearPins}
      onFlyTo={flyTo}
    />
  </>
);
