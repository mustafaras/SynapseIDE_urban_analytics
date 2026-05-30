import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import {
  BASE_STYLES,
  type DrawnFeature,
  type DrawToolId,
  type LayerQaStatus,
  type LayerSchemaFieldSummary,
  type LayerScientificQABadge,
  MAP_BOOKMARK_LIMIT,
  MAP_LAYER_REGISTRY_EVENT,
  type MapEvidenceScalar,
  type MapBookmark,
  type MapExplorerMode,
  type MapLayerRegistryChangeDetail,
  type MapPin,
  type MeasureToolId,
  type OverlayLayerConfig,
} from "../mapTypes";
import { buildUserDeclaredCrsSummary } from "../mapLayerMetadata";
import {
  applyMapCommand,
  redoMapCommand,
  revertMapCommand,
  type MapActionEffects,
} from "@/services/map/actions/MapActionExecutor";
import {
  createMapActionHistory,
  findRedoableEntry,
  findRevertableEntry,
  findUndoableEntry,
  markMapActionRedone,
  markMapActionUndone,
  recordMapActionHistoryEntry,
  summarizeMapUndoRedo,
  type MapActionHistory,
  type MapActionHistoryEntry,
} from "@/services/map/actions/MapActionHistoryService";
import {
  MAP_COLORS,
  MAP_DIMENSIONS,
  MAP_ICON_SIZES,
  MAP_NUMERIC,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../mapTokens";
import { MapCanvas, type MapFeatureReportRequest } from "../MapCanvas";
import { MapCanvasKeyboardFallbackControls } from "../MapCanvasKeyboardFallbackControls";
import { MapToolbar } from "../MapToolbar";
import { MapLayerPanel } from "../MapLayerPanel";
import { MapLayerManager } from "../MapLayerManager";
import { MapDrawingManager, type MapDrawingSnapSource } from "../../MapDrawingManager";
import { MapMeasurementTool } from "../../MapMeasurementTool";
import { MapContextMenu } from "../../MapContextMenu";
import { MapChoroplethLayer } from "../../MapChoroplethLayer";
import { MapVoxCityOverlay } from "../../MapVoxCityOverlay";
import { SAMPLE_BUILDINGS } from "@/features/urbanAnalytics/voxcity";
import { MapClusterViz } from "../../MapClusterViz";
import { MapEmergingHotSpotViz } from "../../MapEmergingHotSpotViz";
import { MapHeatmapLayer } from "../../MapHeatmapLayer";
import { MapHotSpotViz } from "../../MapHotSpotViz";
import { MapSymbolLayer, type SymbolMode } from "../../MapSymbolLayer";
import { MapTemporalPlayer } from "../../MapTemporalPlayer";
import { TemporalPlayerPanel } from "../temporal";
import {
  selectTemporalFrameCount,
  useTemporalLayerStore,
} from "@/stores/useTemporalLayerStore";
import { MapDataExportDialog } from "../../MapDataExportDialog";
import { MapExportDialog } from "../../MapExportDialog";
import { MapCsvImportDialog } from "../../MapCsvImportDialog";
import { MapColumnarImportDialog } from "../../MapColumnarImportDialog";
import { MapDataImportHubDialog } from "../../MapDataImportHubDialog";
import { MapImportPreviewDialog } from "../MapImportPreviewDialog";
import { MapServiceDialog, type MapServiceDialogProgressDetail } from "../../MapServiceDialog";
import { MapBookmarkBar } from "../../MapBookmarkBar";
import { MapAnnotationLayer } from "../../MapAnnotationLayer";
import { MapSearchBar } from "../MapSearchBar";
import { MapStatusBar, type MapStatusBarProps } from "../MapStatusBar";
import { MapPinSidebar } from "../MapPinSidebar";
import {
  MapBottomTimeline,
  MapCanvasRegion,
  MapPanelRail,
  MapWorkspaceShell,
} from "../MapWorkspaceShell";
import { MapWorkspaceCockpit } from "../MapWorkspaceCockpit";
import { ScientificQAPanel } from "../ScientificQAPanel";
import { MapNLQueryPanel, type MapNLQueryPanelRunSummary } from "../MapNLQueryPanel";
import { MapSelectionTools } from "../MapSelectionTools";
import { MapWorkflowDrawer } from "../MapWorkflowDrawer";
import { MapUrbanMethodCompatibilityRail } from "../MapUrbanMethodCompatibilityRail";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
} from "@/services/map/DrawnGeometryValidation";
import { MapReviewTimelinePanel } from "../MapReviewTimelinePanel";
import { MapLayoutDesignerPanel } from "../layout/MapLayoutDesignerPanel";
import { Scene3DPanel } from "../scene3d/Scene3DPanel";
import { Scene3DInteractionStrip } from "../scene3d/Scene3DInteractionStrip";
import { ScenarioComparisonStrip } from "../scene3d/ScenarioComparisonStrip";
import { SunShadowPanel } from "../scene3d/SunShadowPanel";
import { ZoningRulesPanel } from "../zoning/ZoningRulesPanel";
import { MassingScenarioPanel } from "../zoning/MassingScenarioPanel";
import {
  MapPerformanceBudgetBanner,
  MapPerformanceDiagnosticsPanel,
} from "../MapPerformanceDiagnosticsPanel";
import { MapPanelErrorBoundary } from "../MapPanelErrorBoundary";
import { MapProcessingToolboxPanel, type ProcessingToolboxLayerOption } from "../processing";
import { MapModelBuilderPanel } from "../modelBuilder";
import { MapPluginPanel } from "../plugins";
import {
  MapCatalogPanel,
  attachSourceHandleToExternalLayer,
  buildCatalogConnectionLayer,
  buildDemoPackCatalogInsertion,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
} from "../catalog";
import {
  MapContentsTreePanel,
  applyContentsToRenderLayers,
  duplicateMapContentsLayer,
} from "../contents";
import {
  createMapProcessingRegistry,
  previewProcessingTool,
  runProcessingTool,
} from "../../../../services/map/processing";
import { createMapExtensionRegistry } from "../../../../services/map/plugins";
import {
  buildMapModelCodeArtifactRequest,
  executeMapModel,
  executeMapModelBatch,
  type MapModelBatchResult,
  type MapModelBatchTarget,
  type MapModelDefinition,
  type MapModelRunResult,
} from "../../../../services/map/model";
import {
  cacheConnectionMetadata,
  checkConnectionHealth,
  createConnectionDescriptor,
} from "../../../../services/map/sources/MapConnectionRegistry";
import {
  MapAttributeTable,
  type AttrFeature,
  type MapAttributeDerivedFieldDraft,
} from "../table/MapAttributeTable";
import { CartographyRecommendationList } from "../CartographyRecommendationList";
import { MapLegendOverlay } from "../inspector/style/MapLegendOverlay";
import type { LayerStyleUpdate } from "../inspector/style/legendContract";
import {
  createMapEvidenceArtifact,
  createMapExportEvidenceArtifact,
  createMapLayerEvidenceArtifact,
  createMapReportSnapshotEvidenceArtifact,
  createMapWorkflowResultEvidenceArtifact,
} from "../mapEvidenceArtifacts";
import { registerDashboardBinding } from "@/features/dashboard/dataBindings";
import { queuePendingDashboardBinding } from "@/features/dashboard/storage";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";
import {
  MAP_LAYER_PANEL_MAX_WIDTH,
  MAP_LAYER_PANEL_MIN_WIDTH,
} from "../mapDocking";
import {
  type MapQuickActionId,
  type MapWorkspaceView,
} from "../mapExperience";
import { selectMapExplorerContextSummary } from "../mapContextSummary";
import {
  selectLayoutPreferences,
  selectMapBearing,
  selectMapCenter,
  selectMapPitch,
  selectMapZoom,
  useMapExplorerStore,
} from "../../../../stores/useMapExplorerStore";
import { useAppStore } from "../../../../stores/appStore";
import { useFlowStore } from "../../../../stores/useFlowStore";
import { useProjectRegistryOptional } from "../../../registry/state";
import { useMapKeyboardControls } from "../useMapKeyboardControls";
import { useAnnouncer } from "../useAnnouncer";
import { useMapAoiDispatch } from "../useMapAoiDispatch";
import { useLayerSync } from "../useLayerSync";
import { useMapPanelCommands } from "../useMapPanelCommands";
import { useMapCommandHandlers } from "./useMapCommandHandlers";
import { useMapExplorerLifecycle } from "./useMapExplorerLifecycle";
import { useMapLayerRuntime } from "./useMapLayerRuntime";
import { useMapPanelLayout } from "./useMapPanelLayout";
import { useMapReportController } from "./useMapReportController";
import { useMapUrbanBridgeController } from "./useMapUrbanBridgeController";
import { useMapWorkflowController } from "./useMapWorkflowController";
import { IconClose, IconLayers } from "../MapIcons";
import { usePrefersReducedMotion } from "../../../../hooks/usePrefersReducedMotion";
import {
  buildFeatureCollectionMetadata,
  completeCsvImport,
  getFeatureCollectionBounds,
  IMPORT_PROGRESS_THRESHOLD_BYTES,
  MAP_IMPORT_ACCEPT_ATTRIBUTE,
  type MapImportProgress,
  prepareMapImportFile,
} from "../../../../services/map/MapDataImporter";
import {
  loadRealOsmCityIntoMapWorkspace,
  loadTeachingDatasetIntoMapWorkspace,
  type TeachingDatasetId,
} from "../../../../services/data/datasetLibrary";
import {
  collectNumericFields,
  hasPointGeometry,
  isPointCandidate,
  resolveFeatureCollection,
} from "../symbologyUtils";
import {
  exportMapData,
  type MapExportFormat,
  type MapExportTarget,
  triggerMapDataDownload,
} from "../../../../services/map/MapDataExporter";
import {
  buildMapPerformanceDiagnostics,
  measureMapPerformance,
  type MapPerformanceTimingMetric,
} from "../../../../services/map/MapPerformanceDiagnostics";
import {
  getMapTelemetryEvents,
  recordMapTelemetryEvent,
  subscribeMapTelemetryEvents,
} from "../../../../services/map/observability";
import { bindTableAlias, loadArrowIPC, loadGeoJSON, toGeoJSON } from "../../../../engine/spatial-db/SpatialDB";
import {
  buildMapCompositionLegendItems,
  buildMapPublicationReadiness,
  calculateScaleBarSpec,
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  exportMapOnlyA0LandscapePdf,
  exportMapPublication,
  type MapCompositionOptions,
  mapPublicationReadinessToEvidenceQA,
  renderMapExportPreview,
  triggerMapPublicationDownload,
} from "../../../../services/map/MapExportService";
import {
  exportOfflineMapPackage,
  triggerOfflineMapPackageDownload,
} from "../../../../services/map/MapOfflinePackageService";
import {
  clearPersistedMapProjectSnapshots,
  getRestorableOverlayLayers,
  loadProjectMapState,
  saveProjectMapState,
} from "../../../../services/map/MapPersistenceService";
import {
  attachSpatialStatsRerun,
  createAnalysisCompletedRun,
  createAnalysisMapOutput,
  createSpatialStatsCompletedRun,
  hasAnalysisRerun,
  rerunAnalysisResult,
} from "../../../../services/map/MapEngineAdapter";
import {
  buildBoundsPolygon,
  buildBufferedPointBounds,
  dispatchRecommendationFlow,
  getCompatibleAoiFlows,
  type SelectionStatisticsSummary,
  setMapViewRestriction,
} from "../../../../services/map/MapAnalysisDispatcher";
import { resolveMapAnalysisBounds } from "../../../../services/map/MapAnalysisBounds";
import {
  publishViewportSync,
  setViewportSyncEnabled,
  subscribeToViewportSync,
  useViewportSyncStore,
} from "../../../../services/map/MapSyncService";
import { sendMapContextToUrban } from "../../../../services/map/MapToUrbanContextAdapter";
import { createSpatialStatsExecutionIdentity } from "../../../../services/map/SpatialStatsExecutionService";
import { executeHotSpotSpatialStatsAsync } from "../../../../services/map/SpatialStatsExecutionQueue";
import {
  evaluateAnalysisQAGate,
  evaluateMapScientificQA,
  evaluateMapScientificQASync,
} from "../../../../services/map/MapScientificQA";
import { previewLayerTopologyRepair } from "../../../../services/map/topology/TopologyRepairService";
import {
  buildMapNLQueryAuditDetails,
  buildMapNLQueryContext,
  executeMapNLQueryPreview,
  type MapNLQueryPreview,
} from "../../../../services/map/MapNLQueryBuilder";
import { buildMapAIProposalReviewEvent, mapAIGuardrailDetails } from "../../../../services/map/MapAIGuardrails";
import type { MapQueryExecutionResult } from "../../../../services/map/query/MapQueryPlanner";
import {
  buildMapWorkflowContext,
  buildMapWorkflowPreviewLayer,
  executeMapWorkflow,
  type MapWorkflowApplyResult,
  type MapWorkflowExecutionHandle,
  type MapWorkflowExecutionUpdate,
  type MapWorkflowPreview,
  type MapWorkflowReportItem,
} from "../../../../services/map/MapWorkflowService";
import { createMapWorkflowWorkerExecutor } from "../../../../services/map/geometry/mapWorkflowWorkerExecutor";
import {
  buildExportPackageNoteRequest,
  buildMapManifestRequest,
  buildSqlQueryRequest,
  buildWorkflowScriptRequest,
  dispatchMapCodeArtifactRequest,
  type MapCodeArtifactRequest,
} from "../../../../services/map/MapCodeArtifactRequestService";
import {
  buildMapDashboardBinding,
  buildMapEducationReference,
} from "../../../../services/map/MapPublicationOutputBindingService";
import {
  buildUrbanToMapMethodRequestPayload,
  buildUrbanToMapMethodRequestPreview,
  type UrbanToMapMethodRequest,
  type UrbanToMapMethodRequestPayload,
  type UrbanToMapMethodRequestPreview,
} from "../../../../services/map/bridge/MapUrbanBridgeService";
import {
  generateMapAnalysisRecommendations,
  type MapAnalysisRecommendation,
  type MapAnalysisUrbanContextSummary,
} from "../../../../services/map/MapAnalysisRecommender";
import { applyMapContextToUrban } from "../../../../features/urbanAnalytics/context/mapContextAdapter";
import { useUrbanContextSummary } from "../../../../features/urbanAnalytics/useUrbanContextStore";
import {
  buildMapReportHandoffDraft,
  buildPendingReportInsertFromMapHandoff,
  DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  enqueueMapReportHandoff,
  type MapReportHandoffOptions,
  type MapReportHandoffSource,
} from "../../../../services/map/MapReportHandoffService";
import {
  buildLayerRegistryReviewEvent,
  buildMapReviewContextSnapshot,
  buildRecommendationActionReviewEvent,
  buildRecommendationReviewEvent,
  buildReportHandoffReviewEvent,
  buildScientificQAReviewEvent,
  createMapReviewEvent,
  type MapReviewTimelineEventInput,
} from "../../../../services/map/MapReviewSessionService";
import {
  applyCartographyRecommendationToLayer,
  generateMapCartographyReview,
  type MapCartographyRecommendation,
} from "../../../../services/map/MapCartographyAdvisor";
import { toastError, toastInfo, toastSuccess, toastWarning } from "../../../../ui/toast/api";
import { analyticsWorkerPool, isBackgroundTaskCancelledError } from "../../../../workers/pool";

type CsvImportSession = import("../../../../services/map/MapDataImporter").CsvImportSession;
type ColumnarImportSession = import("../../../../services/map/MapDataImporter").ColumnarImportSession;
type ImportedGeoJSONLayer = import("../../../../services/map/MapDataImporter").ImportedGeoJSONLayer;
type SourceProfile = import("../../../../services/map/MapDataImporter").SourceProfile;

const LazyMapReportHandoffDrawer = React.lazy(async () => {
  const module = await import("../MapReportHandoffDrawer");
  return { default: module.MapReportHandoffDrawer };
});

const LazyLayerInspector = React.lazy(async () => {
  const module = await import("../inspector/LayerInspector");
  return { default: module.LayerInspector };
});
type MapProjectSnapshot = import("../../../../services/map/MapPersistenceService").MapProjectSnapshot;
type MapOutput = import("../../../../features/urbanAnalytics/lib/types").MapOutput;
type NumericFieldInfo = import("../symbologyUtils").NumericFieldInfo;

type DispatchFeedbackTone = "info" | "busy" | "success" | "error";

interface DispatchFeedbackState {
  tone: DispatchFeedbackTone;
  title: string;
  description: string;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getReportHandoffPageDimensionsMm(
  frame: MapReportHandoffOptions["snapshotFrame"],
  map: maplibregl.Map | null,
): { width: number; height: number } {
  if (frame === "landscape") return { width: 297, height: 210 };
  if (frame === "portrait") return { width: 210, height: 297 };
  if (frame === "square") return { width: 240, height: 240 };

  const rect = map?.getContainer().getBoundingClientRect();
  const aspect = rect && rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;
  const height = 210;
  return {
    width: clampNumber(Math.round(height * aspect), 180, 380),
    height,
  };
}

function buildReportHandoffComposition(
  source: MapReportHandoffSource,
  options: MapReportHandoffOptions,
  map: maplibregl.Map | null,
): MapCompositionOptions {
  const dimensions = getReportHandoffPageDimensionsMm(options.snapshotFrame, map);
  return {
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
    format: "png",
    dpi: 72,
    pageSize: "custom",
    customWidthMm: dimensions.width,
    customHeightMm: dimensions.height,
    mapFit: options.snapshotFit,
    title: source.title ?? "Map report handoff",
    subtitle: `${source.scope.replace("-", " ")} evidence snapshot`,
    includeInsetMap: false,
  };
}

interface CartographyUndoEntry {
  recommendationId: string;
  layerId: string;
  label: string;
  beforeLayer: OverlayLayerConfig;
}

const workflowPreviewHudStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: `calc(${MAP_SPACING.lg} + ${MAP_SPACING.lg})`,
  transform: "translateX(-50%)",
  zIndex: MAP_NUMERIC.sidebarZIndex,
  display: "grid",
  gap: MAP_SPACING.xs,
  minWidth: "min(26rem, calc(100% - 2rem))",
  maxWidth: "34rem",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  border: "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.48))",
  borderRadius: MAP_RADIUS.sm,
  background: "var(--syn-surface-panel, rgba(15, 20, 28, 0.92))",
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  pointerEvents: "none",
};

const workflowDividerStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.zero,
  bottom: MAP_SPACING.zero,
  width: MAP_DIMENSIONS.separatorWidth,
  background: "var(--syn-status-info, #38bdf8)",
  pointerEvents: "none",
  zIndex: MAP_NUMERIC.sidebarZIndex - 1,
};

const comparisonLegendStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const comparisonLegendItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.75rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.textSecondary,
};

const comparisonLegendSwatchStyle: React.CSSProperties = {
  width: "0.75rem",
  height: "0.75rem",
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
};

const comparisonLayerBColor = "var(--syn-status-pending, #a78bfa)";

const workflowPreviewMetaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const workflowExecutionCrsChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: "1px solid currentColor",
  borderRadius: MAP_RADIUS.sm,
  color: MAP_COLORS.interaction,
  background: MAP_COLORS.selectedSubtle,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const WorkflowPreviewOverlay: React.FC<{ preview: MapWorkflowPreview | null }> = ({ preview }) => {
  if (!preview) {
    return null;
  }

  const comparison = preview.comparisonState;
  const dividerLeft = comparison
    ? `${Math.round((comparison.view === "split" ? 0.5 : comparison.swipePosition) * 100)}%`
    : null;

  return (
    <>
      {comparison && comparison.view !== "blend" && dividerLeft ? (
        <div
          style={{
            ...workflowDividerStyle,
            left: dividerLeft,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div style={workflowPreviewHudStyle} data-testid="map-workflow-preview-hud" aria-live="polite">
        <strong style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))" }}>
          {comparison ? "Comparison preview" : "Workflow preview layer"}
        </strong>
        {comparison ? (
          <>
            <div style={workflowPreviewMetaRowStyle}>
              <span>
                {comparison.layerAName} vs {comparison.layerBName} - {comparison.view}
                {comparison.view === "blend"
                  ? ` - opacity ${Math.round(comparison.blendOpacityA * 100)}% / ${Math.round(comparison.blendOpacityB * 100)}%`
                  : ` - divider ${Math.round(comparison.swipePosition * 100)}%`}
                {` - manifest ${shortMapManifestId(preview.manifest.manifestId)}`}
              </span>
              <WorkflowExecutionCrsChip preview={preview} />
            </div>
            <div style={comparisonLegendStyle} data-testid="map-comparison-legend" aria-label="Synchronized comparison legend">
              <span style={comparisonLegendItemStyle} title={comparison.layerAName}>
                <span style={{ ...comparisonLegendSwatchStyle, background: "var(--syn-status-info, #38bdf8)" }} aria-hidden="true" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>A · {comparison.layerAName}</span>
              </span>
              <span style={comparisonLegendItemStyle} title={comparison.layerBName}>
                <span style={{ ...comparisonLegendSwatchStyle, background: comparisonLayerBColor }} aria-hidden="true" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>B · {comparison.layerBName}</span>
              </span>
            </div>
          </>
        ) : (
          <div style={workflowPreviewMetaRowStyle}>
            <span>
              {preview.featureCount.toLocaleString()} preview feature{preview.featureCount === 1 ? "" : "s"} - manifest {shortMapManifestId(preview.manifest.manifestId)}
            </span>
            <WorkflowExecutionCrsChip preview={preview} />
          </div>
        )}
      </div>
    </>
  );
};

const WorkflowExecutionCrsChip: React.FC<{ preview: MapWorkflowPreview }> = ({ preview }) => {
  const summary = preview.manifest.crsSummary;
  const label = summary.executionCrs
    ? `Execution CRS ${summary.executionCrs}`
    : summary.sourceCrs
      ? "Execution CRS unresolved"
      : "Execution CRS unknown";
  const title = [
    `Source CRS: ${summary.sourceCrs ?? "unknown"}`,
    `Display CRS: ${summary.displayCrs}`,
    `Execution kind: ${summary.executionKind ?? "planar"}`,
  ].join("; ");
  return (
    <span
      style={workflowExecutionCrsChipStyle}
      data-testid="map-workflow-execution-crs-chip"
      title={title}
      aria-label={label}
    >
      {label}
    </span>
  );
};

function shortMapManifestId(value: string): string {
  return value.length > 20 ? `${value.slice(0, 16)}...` : value;
}

interface FlowDispatchAoiCandidate {
  feature: Feature<Polygon | MultiPolygon>;
  source: "drawn-aoi" | "map-context-menu";
  label: string;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/* ================================================================== */
/*  Visually-hidden style (skip-nav link)                              */
/* ================================================================== */

const MAP_NAVIGATOR_STAGE_MARGIN = MAP_NUMERIC.navigatorStageMargin;
const MAP_NAVIGATOR_STAGE_TOP = MAP_NUMERIC.navigatorStageTop;
const MAP_NAVIGATOR_STAGE_BOTTOM = MAP_NUMERIC.navigatorStageBottom;

const srOnlyFocusable: React.CSSProperties = {
  ...mapStyles.srOnly,
};

const commandHeaderStyle: React.CSSProperties = {
  ...mapStyles.header,
  position: "relative",
  zIndex: MAP_NUMERIC.importProgressZIndex + 1,
  flexWrap: "nowrap",
  alignContent: "center",
  gap: MAP_SPACING.xs,
  minHeight: "2.75rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  overflowX: "visible",
  overflowY: "visible",
  background: MAP_COLORS.bgHeader,
  borderBottom: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
};

const commandHeaderTitleStyle: React.CSSProperties = {
  ...mapStyles.title,
  flex: "0 0 auto",
  marginRight: MAP_SPACING.zero,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  whiteSpace: "nowrap",
};

const commandHeaderToolbarSlot: React.CSSProperties = {
  flex: "1 1 20rem",
  minWidth: MAP_SPACING.zero,
  display: "flex",
  alignItems: "center",
  overflow: "visible",
};

const commandHeaderCloseButton: React.CSSProperties = {
  ...mapStyles.closeBtn,
  position: "static",
  flex: "0 0 auto",
  width: "1.75rem",
  height: "1.75rem",
  border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
};

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapExplorerModalProps {
  open: boolean;
  onClose: () => void;
  mode?: MapExplorerMode;
  mapCanvasRef?: React.MutableRefObject<maplibregl.Map | null>;
  bottomTimelineSlot?: React.ReactNode;
}

function matchesSpatialStatsOutput(
  output: MapOutput,
  layerId: string,
  rerunToken?: string | null,
  runId?: string,
): boolean {
  if (output.id === layerId) {
    return true;
  }

  if (rerunToken && output.engineBridge?.rerunToken === rerunToken) {
    return true;
  }

  return Boolean(runId && output.engineBridge?.runId === runId);
}

function replaceSpatialStatsOutput(
  outputs: MapOutput[],
  nextOutput: MapOutput,
  layerId: string,
  rerunToken?: string | null,
  runId?: string,
): MapOutput[] {
  const index = outputs.findIndex((output) => matchesSpatialStatsOutput(output, layerId, rerunToken, runId));
  if (index === -1) {
    return [...outputs, nextOutput];
  }

  const nextOutputs = [...outputs];
  nextOutputs[index] = nextOutput;
  return nextOutputs;
}

function isPolygonGeometry(geometry: GeoJSON.Geometry | null | undefined): geometry is Polygon | MultiPolygon {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function isPolygonLayerCandidate(layer: OverlayLayerConfig): boolean {
  if (!layer.visible || layer.type !== "geojson") {
    return false;
  }
  const geometryType = layer.metadata?.geometryType?.toLowerCase() ?? "";
  return !geometryType || geometryType.includes("polygon") || geometryType.includes("multi");
}

function hasPolygonGeometry(collection: GeoJSON.FeatureCollection): boolean {
  return collection.features.some((feature) => isPolygonGeometry(feature.geometry));
}

function visitCoordinates(geometry: GeoJSON.Geometry, visitor: (coordinate: [number, number]) => void): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitCoordinates(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      visitor([Number(value[0]), Number(value[1])]);
      return;
    }
    for (const entry of value) {
      walk(entry);
    }
  };
  walk(geometry.coordinates);
}

function getFeatureBounds(feature: GeoJSON.Feature): [number, number, number, number] | null {
  if (!feature.geometry) {
    return null;
  }
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  visitCoordinates(feature.geometry, ([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat];
}

function doBoundsIntersect(
  first: [number, number, number, number],
  second: [number, number, number, number],
): boolean {
  return first[0] <= second[2]
    && first[2] >= second[0]
    && first[1] <= second[3]
    && first[3] >= second[1];
}

function filterFeatureCollectionToBounds(
  collection: GeoJSON.FeatureCollection,
  bounds: [number, number, number, number],
): GeoJSON.FeatureCollection {
  return {
    ...collection,
    features: collection.features.filter((feature) => {
      const featureBounds = getFeatureBounds(feature);
      return featureBounds ? doBoundsIntersect(featureBounds, bounds) : false;
    }),
  };
}

function coerceOverlayFeatureCollection(layer: OverlayLayerConfig): GeoJSON.FeatureCollection | null {
  const { sourceData } = layer;
  if (!sourceData || typeof sourceData === "string") return null;
  return (sourceData as GeoJSON.FeatureCollection).type === "FeatureCollection"
    ? sourceData as GeoJSON.FeatureCollection
    : null;
}

function buildDrawingSnapSources(layers: readonly OverlayLayerConfig[]): MapDrawingSnapSource[] {
  const sources: MapDrawingSnapSource[] = [];
  for (const layer of layers) {
    if (!layer.visible || !layer.queryable) continue;
    const featureCollection = coerceOverlayFeatureCollection(layer);
    if (!featureCollection || featureCollection.features.length === 0) continue;
    sources.push({
      id: layer.id,
      name: layer.name,
      featureCollection: {
        ...featureCollection,
        features: featureCollection.features.slice(0, 1_000),
      },
    });
    if (sources.length >= 8) break;
  }
  return sources;
}

function cloneGeometry<T extends GeoJSON.Geometry>(geometry: T): T {
  return JSON.parse(JSON.stringify(geometry)) as T;
}

function buildDrawnAoiFromWorkflowResult(result: MapWorkflowApplyResult): DrawnFeature | null {
  if (result.preview.workflow !== "aoi") return null;
  const feature = result.preview.featureCollection?.features[0];
  if (!feature?.geometry || !isPolygonGeometry(feature.geometry)) return null;
  const validation = validateDrawnGeometry(feature.geometry);
  if (validation.status === "blocked") return null;
  return {
    id: `aoi-${result.layer.id}`,
    geometry: cloneGeometry(feature.geometry),
    properties: {
      label: result.layer.name || "Workflow AOI",
      createdAt: new Date().toISOString(),
      style: {
        strokeColor: MAP_COLORS.interaction,
        fillColor: MAP_COLORS.interaction,
        strokeWidth: 2,
        fillOpacity: 0.12,
      },
      validation,
    },
  };
}

function resolveFlowDispatchAoiCandidate(
  drawnFeatures: DrawnFeature[],
  selectedFeatureId: string | null,
  currentMapBounds: [number, number, number, number] | null,
): FlowDispatchAoiCandidate | null {
  const selectedPolygon = selectedFeatureId
    ? drawnFeatures.find((feature) => feature.id === selectedFeatureId && isPolygonGeometry(feature.geometry))
    : null;
  const latestPolygon = selectedPolygon
    ?? [...drawnFeatures].reverse().find((feature) => isPolygonGeometry(feature.geometry));

  if (latestPolygon && isPolygonGeometry(latestPolygon.geometry)) {
    return {
      feature: {
        type: "Feature",
        id: latestPolygon.id,
        geometry: latestPolygon.geometry,
        properties: latestPolygon.properties,
      } as Feature<Polygon | MultiPolygon>,
      source: "drawn-aoi",
      label: String(latestPolygon.properties?.label ?? "Latest drawn AOI"),
    };
  }

  if (currentMapBounds) {
    return {
      feature: buildBoundsPolygon(currentMapBounds),
      source: "map-context-menu",
      label: "Current visible map extent",
    };
  }

  return null;
}

function feedbackAccent(tone: DispatchFeedbackTone): string {
  switch (tone) {
    case "success":
      return "var(--syn-status-valid, #34d399)";
    case "error":
      return "var(--syn-status-error, #f87171)";
    case "busy":
      return "var(--syn-status-running, #60a5fa)";
    default:
      return "var(--syn-status-info, #38bdf8)";
  }
}

function waitForMapCanvasCaptureMode(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

const MAP_RENDER_ERROR_NOTICE_COOLDOWN_MS = 60_000;
const MAP_QUOTA_WARNING_NOTICE_COOLDOWN_MS = 5 * 60_000;
const MAP_AUTOSAVE_ERROR_NOTICE_COOLDOWN_MS = 2 * 60_000;

type MapCursorCoordinates = { lng: number; lat: number };

interface MapStatusBarCursorHandle {
  setCursor: (cursor: MapCursorCoordinates | null) => void;
}

type MapStatusBarWithCursorProps = Omit<MapStatusBarProps, "cursor">;

const MapStatusBarWithCursor = React.forwardRef<MapStatusBarCursorHandle, MapStatusBarWithCursorProps>(
  (props, ref) => {
    const [cursor, setCursor] = useState<MapCursorCoordinates | null>(null);

    React.useImperativeHandle(ref, () => ({ setCursor }), []);

    return <MapStatusBar {...props} cursor={cursor} />;
  },
);
MapStatusBarWithCursor.displayName = "MapStatusBarWithCursor";

/* ================================================================== */
/*  Component — Shell (portal, overlay, layout grid)                   */
/* ================================================================== */

export const MapExplorerModal: React.FC<MapExplorerModalProps> = ({
  open,
  onClose,
  mode = "modal",
  mapCanvasRef,
  bottomTimelineSlot,
}) => {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const suppressViewportSyncPublishRef = useRef(false);
  const suppressViewportSyncTimerRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const lastMapRenderErrorRef = useRef<{ message: string; timestamp: number } | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const statusBarRef = useRef<HTMLDivElement | null>(null);
  const scientificQASequenceRef = useRef(0);
  const lastReviewQaSignatureRef = useRef<string | null>(null);
  const lastReviewRecommendationSignatureRef = useRef<string | null>(null);
  const recordedCopilotProposalIdsRef = useRef<Set<string>>(new Set());
  const recordedCopilotAuditIdsRef = useRef<Set<string>>(new Set());
  const recordedNLQueryProposalIdsRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef<{ lng: number; lat: number } | null>(null);
  const statusCursorRef = useRef<MapStatusBarCursorHandle | null>(null);
  const symbologyPanelDrag = useDraggableMapPanel();
  const mapCanvasId = "map-explorer-canvas";

  /* ---- Accessibility hooks ---- */
  const { trapRef } = useMapExplorerLifecycle({ open, onClose });
  const { announce, AnnouncerRegion } = useAnnouncer();
  const reducedMotion = usePrefersReducedMotion();

  /* ---- Store selectors ---- */
  const activeBaseLayer = useMapExplorerStore((s) => s.activeBaseLayer);
  const setBaseLayer = useMapExplorerStore((s) => s.setBaseLayer);
  const activeFlow = useFlowStore((s) => s.activeFlow);
  const completedRuns = useFlowStore((s) => s.completedRuns);
  const upsertCompletedRun = useFlowStore((s) => s.upsertCompletedRun);
  const pins = useMapExplorerStore((s) => s.pins);
  const addPin = useMapExplorerStore((s) => s.addPin);
  const removePin = useMapExplorerStore((s) => s.removePin);
  const clearPins = useMapExplorerStore((s) => s.clearPins);
  const bookmarks = useMapExplorerStore((s) => s.bookmarks);
  const addMapBookmark = useMapExplorerStore((s) => s.addMapBookmark);
  const renameMapBookmark = useMapExplorerStore((s) => s.renameMapBookmark);
  const removeMapBookmark = useMapExplorerStore((s) => s.removeMapBookmark);
  const restoreMapBookmark = useMapExplorerStore((s) => s.restoreMapBookmark);
  const annotations = useMapExplorerStore((s) => s.annotations);
  const annotationToolSettings = useMapExplorerStore((s) => s.annotationToolSettings);
  const selectedAnnotationId = useMapExplorerStore((s) => s.selectedAnnotationId);
  const setAnnotationToolSettings = useMapExplorerStore((s) => s.setAnnotationToolSettings);
  const addMapAnnotation = useMapExplorerStore((s) => s.addMapAnnotation);
  const updateMapAnnotation = useMapExplorerStore((s) => s.updateMapAnnotation);
  const moveMapAnnotation = useMapExplorerStore((s) => s.moveMapAnnotation);
  const removeMapAnnotation = useMapExplorerStore((s) => s.removeMapAnnotation);
  const setSelectedAnnotationId = useMapExplorerStore((s) => s.setSelectedAnnotationId);
  const activeTool = useMapExplorerStore((s) => s.activeTool);
  const setActiveTool = useMapExplorerStore((s) => s.setActiveTool);
  const center = useMapExplorerStore(selectMapCenter);
  const zoom = useMapExplorerStore(selectMapZoom);
  const bearing = useMapExplorerStore(selectMapBearing);
  const pitch = useMapExplorerStore(selectMapPitch);
  const setViewport = useMapExplorerStore((s) => s.setViewport);
  const restoreProjectState = useMapExplorerStore((s) => s.restoreProjectState);
  const clearProjectContent = useMapExplorerStore((s) => s.clearProjectContent);
  const replaceOverlayLayers = useMapExplorerStore((s) => s.replaceOverlayLayers);
  const currentMapBounds = useMapExplorerStore((s) => s.currentMapBounds);
  const setCurrentMapBounds = useMapExplorerStore((s) => s.setCurrentMapBounds);
  const contextSummary = useMapExplorerStore(selectMapExplorerContextSummary);
  const urbanContextSummary = useUrbanContextSummary();
  const viewportSyncEnabled = useViewportSyncStore((s) => s.enabled);
  const viewportSyncStatus = useViewportSyncStore((s) => s.statusLabel);
  const setActiveAnalysisResultLayers = useMapExplorerStore((s) => s.setActiveAnalysisResultLayers);
  const activeAnalysisResultLayerIds = useMapExplorerStore((s) => s.activeAnalysisResultLayerIds);
  const scientificQA = useMapExplorerStore((s) => s.scientificQA);
  const setScientificQA = useMapExplorerStore((s) => s.setScientificQA);
  const reviewSession = useMapExplorerStore((s) => s.reviewSession);
  const addMapReviewEvent = useMapExplorerStore((s) => s.addMapReviewEvent);
  const updateMapReviewEventStatus = useMapExplorerStore((s) => s.updateMapReviewEventStatus);
  const clearMapReviewSession = useMapExplorerStore((s) => s.clearMapReviewSession);
  const mapEvidenceArtifacts = useMapExplorerStore((s) => s.mapEvidenceArtifacts);
  const upsertMapEvidenceArtifact = useMapExplorerStore((s) => s.upsertMapEvidenceArtifact);
  const sourceHandles = useMapExplorerStore((s) => s.sourceHandles);
  const upsertSourceHandle = useMapExplorerStore((s) => s.upsertSourceHandle);
  const clearSourceHandles = useMapExplorerStore((s) => s.clearSourceHandles);
  const copilotActionProposals = useMapExplorerStore((s) => s.copilotActionProposals);
  const copilotAuditTrail = useMapExplorerStore((s) => s.copilotAuditTrail);
  const layoutPreferences = useMapExplorerStore(selectLayoutPreferences);
  const setLayoutPreferences = useMapExplorerStore((s) => s.setLayoutPreferences);

  /* ---- Overlay layer store selectors ---- */
  const {
    overlayLayers,
    addOverlayLayer,
    updateLayerMetadata,
    removeOverlayLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    reorderLayers,
  } = useMapLayerRuntime();

  /* ---- Drawing store selectors ---- */
  const activeDrawTool = useMapExplorerStore((s) => s.activeDrawTool);
  const setActiveDrawTool = useMapExplorerStore((s) => s.setActiveDrawTool);
  const drawnFeatures = useMapExplorerStore((s) => s.drawnFeatures);
  const addDrawnFeature = useMapExplorerStore((s) => s.addDrawnFeature);
  const removeDrawnFeature = useMapExplorerStore((s) => s.removeDrawnFeature);
  const updateDrawnFeature = useMapExplorerStore((s) => s.updateDrawnFeature);
  const clearDrawnFeatures = useMapExplorerStore((s) => s.clearDrawnFeatures);
  const selectedFeatureId = useMapExplorerStore((s) => s.selectedFeatureId);
  const selectedFeatureIds = useMapExplorerStore((s) => s.selectedFeatureIds);
  const setSelectedFeatureId = useMapExplorerStore((s) => s.setSelectedFeatureId);
  const setSelectedFeatures = useMapExplorerStore((s) => s.setSelectedFeatures);
  const clearSelectedFeatures = useMapExplorerStore((s) => s.clearSelectedFeatures);
  const activeAoiId = useMapExplorerStore((s) => s.activeAoiId);

  /* ---- Measurement store selectors ---- */
  const activeMeasureTool = useMapExplorerStore((s) => s.activeMeasureTool);
  const setActiveMeasureTool = useMapExplorerStore((s) => s.setActiveMeasureTool);
  const measurements = useMapExplorerStore((s) => s.measurements);
  const addMeasurement = useMapExplorerStore((s) => s.addMeasurement);
  const removeMeasurement = useMapExplorerStore((s) => s.removeMeasurement);
  const clearMeasurements = useMapExplorerStore((s) => s.clearMeasurements);
  const measureUnit = useMapExplorerStore((s) => s.measureUnit);
  const setMeasureUnit = useMapExplorerStore((s) => s.setMeasureUnit);
  const setCurrentTimestep = useMapExplorerStore((s) => s.setCurrentTimestep);
  const setIsPlaying = useMapExplorerStore((s) => s.setIsPlaying);

  const projectRegistry = useProjectRegistryOptional();
  const selectedProjectId = projectRegistry?.state.selectedProjectId ?? null;
  const selectedProject = selectedProjectId
    ? projectRegistry?.state.projects.find((project) => project.id === selectedProjectId) ?? null
    : null;
  const autoSaveEnabled = useAppStore((s) => s.user?.preferences.autoSave ?? true);
  const initialWorkspaceView: MapWorkspaceView =
    overlayLayers.length > 0 || pins.length > 0 || drawnFeatures.length > 0 || annotations.length > 0 || measurements.length > 0
      ? "explore"
      : "navigator";

  /* ---- Transient local state (not persisted) ---- */
  const [workspaceView, setWorkspaceView] = useState<MapWorkspaceView>(initialWorkspaceView);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [showChoroplethPanel, setShowChoroplethPanel] = useState(false);
  const [showClusterViz, setShowClusterViz] = useState(false);
  const [showHotSpotViz, setShowHotSpotViz] = useState(false);
  const [showEmergingHotSpotViz, setShowEmergingHotSpotViz] = useState(false);
  const [showVoxCityOverlay, setShowVoxCityOverlay] = useState(false);
  const [showScientificQAPanel, setShowScientificQAPanel] = useState(false);
  const [activeUrbanMethodRequest, setActiveUrbanMethodRequest] = useState<UrbanToMapMethodRequestPayload | null>(null);
  const [activeUrbanMethodPreview, setActiveUrbanMethodPreview] = useState<UrbanToMapMethodRequestPreview | null>(null);
  const [showNLQueryPanel, setShowNLQueryPanel] = useState(false);
  const {
    showWorkflowDrawer,
    setShowWorkflowDrawer,
    workflowPreview,
    setWorkflowPreview,
    urbanWorkflowDraftRequest,
    setUrbanWorkflowDraftRequest,
    workflowGeocodedPlace,
    setWorkflowGeocodedPlace,
    setWorkflowReportItems,
  } = useMapWorkflowController();
  const [showReviewTimeline, setShowReviewTimeline] = useState(false);
  const [showFigureComposer, setShowFigureComposer] = useState(false);
  const [show3DPanel, setShow3DPanel] = useState(false);
  const [showZoningPanel, setShowZoningPanel] = useState(false);
  const [showMassingPanel, setShowMassingPanel] = useState(false);
  const [showSunShadowPanel, setShowSunShadowPanel] = useState(false);
  const [showInteractionStrip, setShowInteractionStrip] = useState(false);
  const [showComparisonStrip, setShowComparisonStrip] = useState(false);
  const handleToggleFigureComposer = useCallback(() => setShowFigureComposer((previous) => !previous), []);
  const [showPerformanceDiagnostics, setShowPerformanceDiagnostics] = useState(false);
  const [performanceTimings, setPerformanceTimings] = useState<MapPerformanceTimingMetric[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState(() => getMapTelemetryEvents());
  useEffect(() => subscribeMapTelemetryEvents(() => setTelemetryEvents(getMapTelemetryEvents())), []);
  const recordPerformanceTiming = useCallback((metric: MapPerformanceTimingMetric) => {
    setPerformanceTimings((previous) => [...previous.slice(-19), metric]);
  }, []);
  const handleRetryWorkerJob = useCallback((jobId: string) => {
    const handle = analyticsWorkerPool.retryJob(jobId);
    if (!handle) {
      announce("Worker retry is unavailable for that task");
      return;
    }
    void handle.promise.catch(() => undefined);
    setShowPerformanceDiagnostics(true);
    announce("Worker retry queued");
  }, [announce]);
  const handleTogglePerformanceDiagnostics = useCallback(() => {
    setShowPerformanceDiagnostics((previous) => !previous);
    announce("Performance diagnostics toggled");
  }, [announce]);
  const [showProcessingToolbox, setShowProcessingToolbox] = useState(false);
  const [showModelBuilder, setShowModelBuilder] = useState(false);
  const [showPluginPanel, setShowPluginPanel] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showContents, setShowContents] = useState(false);
  const extensionRegistry = useMemo(() => createMapExtensionRegistry(), []);
  const pluginExtensions = useMemo(() => extensionRegistry.list(), [extensionRegistry]);
  const processingExtensionExecutors = useMemo(() => extensionRegistry.processingToolExecutors(), [extensionRegistry]);
  const handleToggleProcessingToolbox = useCallback(() => {
    setShowProcessingToolbox((previous) => {
      const next = !previous;
      if (next) setShowModelBuilder(false);
      if (next) setShowPluginPanel(false);
      return next;
    });
    announce("Processing toolbox toggled");
  }, [announce]);
  const handleToggleModelBuilder = useCallback(() => {
    setShowModelBuilder((previous) => {
      const next = !previous;
      if (next) setShowProcessingToolbox(false);
      if (next) setShowPluginPanel(false);
      return next;
    });
    announce("Model builder toggled");
  }, [announce]);
  const handleTogglePluginPanel = useCallback(() => {
    setShowPluginPanel((previous) => {
      const next = !previous;
      if (next) {
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
      }
      return next;
    });
    announce("Plugin registry toggled");
  }, [announce]);
  const handleToggleCatalog = useCallback(() => {
    setShowCatalog((previous) => {
      const next = !previous;
      if (next) {
        setWorkspaceView("explore");
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
        setShowPluginPanel(false);
        setShowContents(false);
      }
      return next;
    });
    announce("Catalog toggled");
  }, [announce]);
  const handleToggleContents = useCallback(() => {
    setShowContents((previous) => {
      const next = !previous;
      if (next) {
        setWorkspaceView("explore");
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
        setShowCatalog(false);
        setShowPluginPanel(false);
      }
      return next;
    });
    announce("Contents tree toggled");
  }, [announce]);
  const processingRegistry = useMemo(
    () => createMapProcessingRegistry(extensionRegistry.processingToolDescriptors()),
    [extensionRegistry],
  );
  const processingToolDescriptors = useMemo(() => processingRegistry.list(), [processingRegistry]);
  const searchProcessingTools = useCallback(
    (query: string) => processingRegistry.search(query),
    [processingRegistry],
  );
  const processingToolboxLayers = useMemo<ProcessingToolboxLayerOption[]>(
    () =>
      overlayLayers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        fields:
          layer.metadata?.schemaSummary?.fields.map((field) => field.name) ??
          layer.metadata?.fields ??
          [],
      })),
    [overlayLayers],
  );
  const handlePreviewProcessingTool = useCallback(
    (toolId: string, params: Record<string, string | number | boolean>) =>
      previewProcessingTool(
        toolId,
        params,
        (id) => useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === id) ?? null,
        { extensionExecutors: processingExtensionExecutors },
      ),
    [processingExtensionExecutors],
  );
  const [inspectorLayerId, setInspectorLayerId] = useState<string | null>(null);
  const inspectorLayer = inspectorLayerId
    ? overlayLayers.find((entry) => entry.id === inspectorLayerId) ?? null
    : null;
  const inspectorSourceHandle = inspectorLayer
    ? sourceHandles.find((handle) => handle.sourceId === inspectorLayer.metadata?.sourceId) ?? null
    : null;
  const [attributeTableLayerId, setAttributeTableLayerId] = useState<string | null>(null);
  const attributeTableLayer = attributeTableLayerId
    ? overlayLayers.find((entry) => entry.id === attributeTableLayerId) ?? null
    : null;
  const [showExternalServiceDialog, setShowExternalServiceDialog] = useState(false);
  const [pointSymbologyLayerId, setPointSymbologyLayerId] = useState<string | null>(null);
  const [pointSymbologyMode, setPointSymbologyMode] = useState<SymbolMode | "heatmap">("heatmap");
  const [showDrawPanel, setShowDrawPanel] = useState(true);
  const [showMeasurePanel, setShowMeasurePanel] = useState(false);
  const [mapContainerElement, setMapContainerElement] = useState<HTMLDivElement | null>(null);
  const [mapContainerWidth, setMapContainerWidth] = useState(0);
  const [restrictToMapView, setRestrictToMapView] = useState(() => Boolean(currentMapBounds));
  const [dispatchFeedback, setDispatchFeedback] = useState<DispatchFeedbackState | null>(null);
  const [selectionStatsSummary, setSelectionStatsSummary] = useState<SelectionStatisticsSummary[] | null>(null);
  const [isFlowDispatchDialogOpen, setIsFlowDispatchDialogOpen] = useState(false);
  const [isRunningQuickHotSpot, setIsRunningQuickHotSpot] = useState(false);
  const [isRunningMapNLQuery, setIsRunningMapNLQuery] = useState(false);
  const [lastMapNLQuerySummary, setLastMapNLQuerySummary] = useState<MapNLQueryPanelRunSummary | null>(null);
  const [dismissedCartographyRecommendationIds, setDismissedCartographyRecommendationIds] = useState<Set<string>>(() => new Set());
  const [cartographyUndoStack, setCartographyUndoStack] = useState<CartographyUndoEntry[]>([]);
  const navigatorStageMode = workspaceView === "navigator";

  const compatibleAoiFlows = useMemo(() => getCompatibleAoiFlows(), []);
  const flowDispatchAoi = useMemo(
    () => resolveFlowDispatchAoiCandidate(drawnFeatures, selectedFeatureId, currentMapBounds),
    [currentMapBounds, drawnFeatures, selectedFeatureId],
  );
  const selectedAoiFeatureForQuery = useMemo<Feature<Geometry> | null>(
    () => flowDispatchAoi?.source === "drawn-aoi" ? flowDispatchAoi.feature : null,
    [flowDispatchAoi],
  );
  const activeAoiLabel = useMemo(() => {
    const activeAoiIdFromContext = contextSummary.activeAoi?.aoiId;
    if (!activeAoiIdFromContext) {
      return null;
    }

    const activeAoiFeature = drawnFeatures.find((feature) => feature.id === activeAoiIdFromContext);
    const label = activeAoiFeature?.properties?.label;
    return typeof label === "string" && label.trim().length > 0 ? label.trim() : activeAoiIdFromContext;
  }, [contextSummary.activeAoi?.aoiId, drawnFeatures]);
  const externalServiceBounds = useMemo(
    () => resolveMapAnalysisBounds({
      drawnFeatures,
      selectedFeatureId,
      currentMapBounds,
      ...(activeAoiId ? { activeAoiId } : {}),
    }),
    [activeAoiId, currentMapBounds, drawnFeatures, selectedFeatureId],
  );
  const selectionStatsAvailable = useMemo(
    () => Object.values(selectedFeatureIds).some((ids) => ids.length > 0),
    [selectedFeatureIds],
  );
  const activeUrbanContext = useMemo<MapAnalysisUrbanContextSummary>(() => ({
    hasContext: urbanContextSummary.hasContext,
    contextId: urbanContextSummary.studyAreaId ?? null,
    studyAreaId: urbanContextSummary.studyAreaId,
    studyAreaName: urbanContextSummary.studyAreaName,
    studyAreaBounds: urbanContextSummary.studyAreaBounds,
    activeFlowId: urbanContextSummary.flowId,
    activeAoiId: contextSummary.activeAoi?.aoiId ?? null,
    activeRunId: urbanContextSummary.runId,
    layerCount: urbanContextSummary.layerCount,
    artifactCount: urbanContextSummary.artifactCount,
    fitnessStatus: urbanContextSummary.fitnessStatus,
    syncState: urbanContextSummary.syncState,
    hasRestoreWarnings: urbanContextSummary.hasRestoreWarnings,
    restoreWarningCount: urbanContextSummary.restoreWarningCount,
  }), [
    contextSummary.activeAoi?.aoiId,
    urbanContextSummary.artifactCount,
    urbanContextSummary.fitnessStatus,
    urbanContextSummary.flowId,
    urbanContextSummary.hasContext,
    urbanContextSummary.hasRestoreWarnings,
    urbanContextSummary.layerCount,
    urbanContextSummary.restoreWarningCount,
    urbanContextSummary.runId,
    urbanContextSummary.studyAreaBounds,
    urbanContextSummary.studyAreaId,
    urbanContextSummary.studyAreaName,
    urbanContextSummary.syncState,
  ]);
  const activeAnalysisInputLayerIds = useMemo(() => {
    const selectedLayerIds = Object.entries(selectedFeatureIds)
      .filter(([, ids]) => ids.length > 0)
      .map(([layerId]) => layerId);
    return Array.from(new Set([...selectedLayerIds, ...activeAnalysisResultLayerIds]));
  }, [activeAnalysisResultLayerIds, selectedFeatureIds]);
  const scientificQAIssueCount = useMemo(
    () => scientificQA?.issues.filter((issue) => issue.severity !== "info").length ?? 0,
    [scientificQA?.issues],
  );
  const scientificQABlockerCount = useMemo(
    () => scientificQA
      ? scientificQA.metadata.issueCounts.blocker + scientificQA.metadata.issueCounts.error
      : 0,
    [scientificQA],
  );
  const analysisRecommendationState = useMemo(
    () => generateMapAnalysisRecommendations({
      overlayLayers,
      selectedFeatureIds,
      scientificQA,
      currentMapBounds,
      userIntent: workspaceView,
      mapContextSummary: contextSummary,
      urbanContext: activeUrbanContext,
    }),
    [activeUrbanContext, contextSummary, currentMapBounds, overlayLayers, scientificQA, selectedFeatureIds, workspaceView],
  );
  const nlQueryToolbarContext = useMemo(
    () => buildMapNLQueryContext(overlayLayers, {
      scope: "visible",
      mode: "live",
      selectedAoiFeature: selectedAoiFeatureForQuery,
      currentMapBounds,
    }),
    [currentMapBounds, overlayLayers, selectedAoiFeatureForQuery],
  );
  const workflowDrawnPolygons = useMemo<Array<Feature<Polygon | MultiPolygon>>>(
    () =>
      drawnFeatures
        .filter(
          (entry): entry is typeof entry & { geometry: Polygon | MultiPolygon } =>
            entry.geometry?.type === "Polygon" || entry.geometry?.type === "MultiPolygon",
        )
        .map((entry) => ({
          type: "Feature",
          properties: { ...entry.properties, drawn_feature_id: entry.id },
          geometry: entry.geometry,
        }) satisfies Feature<Polygon | MultiPolygon>),
    [drawnFeatures],
  );
  const workflowSelectedFeatures = useMemo<Array<Feature<Geometry>>>(() => {
    const features: Array<Feature<Geometry>> = [];
    for (const [layerId, ids] of Object.entries(selectedFeatureIds)) {
      if (!ids.length) continue;
      const layer = overlayLayers.find((entry) => entry.id === layerId);
      if (!layer) continue;
      const sourceData = layer.sourceData;
      if (!sourceData || typeof sourceData === "string") continue;
      const collection =
        (sourceData as FeatureCollection).type === "FeatureCollection"
          ? (sourceData as FeatureCollection)
          : null;
      if (!collection) continue;
      const idSet = new Set(ids.map(String));
      for (const feature of collection.features) {
        const featureId = feature.id == null ? null : String(feature.id);
        if (featureId && idSet.has(featureId)) {
          features.push({
            ...feature,
            properties: {
              ...(feature.properties ?? {}),
              __selection_layer_id: layerId,
            },
          });
        }
      }
    }
    return features;
  }, [overlayLayers, selectedFeatureIds]);
  const workflowSelectedLayerIds = useMemo(
    () => Object.entries(selectedFeatureIds)
      .filter(([, ids]) => ids.length > 0)
      .map(([layerId]) => layerId),
    [selectedFeatureIds],
  );
  const drawingSnapSources = useMemo(
    () => buildDrawingSnapSources(overlayLayers),
    [overlayLayers],
  );
  const workflowUrbanStudyArea = useMemo(() => {
    if (!activeUrbanContext.studyAreaBounds) return null;
    return {
      id: activeUrbanContext.studyAreaId ?? activeUrbanContext.activeAoiId ?? "urban-study-area",
      label: activeUrbanContext.studyAreaName ?? "Urban study area",
      bounds: activeUrbanContext.studyAreaBounds,
      ...(activeUrbanContext.activeAoiId ? { activeAoiId: activeUrbanContext.activeAoiId } : {}),
    };
  }, [
    activeUrbanContext.activeAoiId,
    activeUrbanContext.studyAreaBounds,
    activeUrbanContext.studyAreaId,
    activeUrbanContext.studyAreaName,
  ]);
  const workflowContext = useMemo(
    () =>
      buildMapWorkflowContext(overlayLayers, {
        selectedFeatures: workflowSelectedFeatures,
        selectedLayerIds: workflowSelectedLayerIds,
        drawnPolygons: workflowDrawnPolygons,
        viewportBounds: currentMapBounds,
        geocodedPlace: workflowGeocodedPlace,
        urbanStudyArea: workflowUrbanStudyArea,
      }),
    [currentMapBounds, overlayLayers, workflowDrawnPolygons, workflowGeocodedPlace, workflowSelectedFeatures, workflowSelectedLayerIds, workflowUrbanStudyArea],
  );
  const workflowReadyCount = useMemo(
    () => workflowContext.layers.filter((layer) => layer.hasGeometry).length,
    [workflowContext.layers],
  );
  const cartographyReviewState = useMemo(
    () => generateMapCartographyReview(overlayLayers, {
      viewport: {
        zoom,
        bounds: currentMapBounds,
      },
      dismissedRecommendationIds: dismissedCartographyRecommendationIds,
    }),
    [currentMapBounds, dismissedCartographyRecommendationIds, overlayLayers, zoom],
  );
  const selectedLayerCartographyRecommendations = useMemo(
    () => pointSymbologyLayerId
      ? cartographyReviewState.recommendations.filter((recommendation) => recommendation.layerId === pointSymbologyLayerId)
      : [],
    [cartographyReviewState.recommendations, pointSymbologyLayerId],
  );

  const buildCurrentReviewSnapshot = useCallback(() => {
    const map = mapInstanceRef.current;
    const mapCenter = map?.getCenter();
    return buildMapReviewContextSnapshot({
      overlayLayers,
      viewport: map && mapCenter
        ? {
            center: [mapCenter.lng, mapCenter.lat],
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          }
        : { center, zoom, bearing, pitch },
      currentMapBounds,
      selectedFeatureIds,
      activeAoiId: activeAoiId ?? null,
      activeAnalysisResultLayerIds,
      scientificQA,
      recommendationCount: analysisRecommendationState.recommendations.length,
    });
  }, [
    activeAnalysisResultLayerIds,
    activeAoiId,
    analysisRecommendationState.recommendations.length,
    bearing,
    center,
    currentMapBounds,
    overlayLayers,
    pitch,
    scientificQA,
    selectedFeatureIds,
    zoom,
  ]);

  const recordMapReviewEvent = useCallback((event: MapReviewTimelineEventInput) => {
    addMapReviewEvent({
      ...event,
      snapshot: event.snapshot ?? buildCurrentReviewSnapshot(),
    });
  }, [addMapReviewEvent, buildCurrentReviewSnapshot]);

  // Map command lifecycle (Prompt 9): high-impact actions flow through
  // MapActionExecutor so each one is preflighted, audited (one review-timeline
  // event), and revertable. The history (with revert tokens) is transient.
  const mapActionHistoryRef = useRef<MapActionHistory>(createMapActionHistory());
  const [mapUndoRedoSummary, setMapUndoRedoSummary] = useState(() => summarizeMapUndoRedo(mapActionHistoryRef.current));

  const refreshMapUndoRedoSummary = useCallback(() => {
    setMapUndoRedoSummary(summarizeMapUndoRedo(mapActionHistoryRef.current));
  }, []);

  const recordMapActionHistory = useCallback((entry: MapActionHistoryEntry) => {
    mapActionHistoryRef.current = recordMapActionHistoryEntry(mapActionHistoryRef.current, entry);
    refreshMapUndoRedoSummary();
  }, [refreshMapUndoRedoSummary]);

  const buildMapActionEffects = useCallback((): MapActionEffects => {
    const readStore = useMapExplorerStore.getState;
    return {
      getLayer: (id) => readStore().overlayLayers.find((layer) => layer.id === id) ?? null,
      getLayerOrder: () => readStore().overlayLayers.map((layer) => layer.id),
      addLayer: (layer) => readStore().addOverlayLayer(layer),
      removeLayer: (id) => readStore().removeOverlayLayer(id),
      setLayerOrder: (orderedIds) => readStore().reorderLayers(orderedIds),
      setLayerStyle: (id, style) => readStore().updateLayerMetadata(id, { style }),
      removeReportItem: () => {
        /* report.handoff is not routed in-app yet; no-op keeps the boundary total. */
      },
      getDrawnFeature: (id) => readStore().drawnFeatures.find((feature) => feature.id === id) ?? null,
      updateDrawnFeature: (id, patch) => readStore().updateDrawnFeature(id, patch),
    };
  }, []);

  const handleRemoveLayerViaCommand = useCallback((layerId: string) => {
    const outcome = applyMapCommand({ kind: "layer.remove", layerId }, buildMapActionEffects());
    recordMapReviewEvent(outcome.reviewEvent);
    if (outcome.result.status === "applied") {
      recordMapActionHistory({
        commandId: outcome.result.commandId,
        kind: outcome.result.kind,
        title: outcome.reviewEvent.title,
        reviewEventId: outcome.result.reviewEventId ?? outcome.result.commandId,
        appliedAt: outcome.result.createdAt,
        revertable: outcome.result.revertable,
        reverted: false,
        ...(outcome.revertToken ? { revertToken: outcome.revertToken } : {}),
        ...(outcome.redoToken ? { redoToken: outcome.redoToken } : {}),
      });
      announce("Removed layer; revert is available in the review timeline.");
    } else {
      announce(`Layer removal blocked: ${outcome.preflight.blockers.join(" ")}`);
    }
  }, [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent]);

  const handleRunProcessingTool = useCallback(
    (toolId: string, params: Record<string, string | number | boolean>) => {
      const result = runProcessingTool(toolId, params, buildMapActionEffects(), {
        extensionExecutors: processingExtensionExecutors,
      });
      if (!result) return null;
      if (result.reviewEvent) recordMapReviewEvent(result.reviewEvent);
      if (result.status === "applied") {
        if (result.revertToken) {
          recordMapActionHistory({
            commandId: result.command.commandId,
            kind: result.command.kind,
            title: result.reviewEvent?.title ?? result.descriptor.title,
            reviewEventId: result.command.reviewEventId ?? result.command.commandId,
            appliedAt: result.command.createdAt,
            revertable: result.command.revertable,
            reverted: false,
            revertToken: result.revertToken,
            ...(result.redoToken ? { redoToken: result.redoToken } : {}),
          });
        }
        announce(`${result.descriptor.title} applied; output layer added. Revert is available in the review timeline.`);
      } else {
        announce(`${result.descriptor.title} blocked: ${result.preview.blockers.join(" ")}`);
      }
      return result;
    },
    [announce, buildMapActionEffects, processingExtensionExecutors, recordMapActionHistory, recordMapReviewEvent],
  );

  const registerMapModelExecution = useCallback((result: MapModelRunResult): MapModelRunResult => {
    for (const step of result.stepRuns) {
      if (step.result.reviewEvent) recordMapReviewEvent(step.result.reviewEvent);
      if (step.result.revertToken) {
        recordMapActionHistory({
          commandId: step.result.command.commandId,
          kind: step.result.command.kind,
          title: step.result.reviewEvent?.title ?? step.step.label,
          reviewEventId: step.result.command.reviewEventId ?? step.result.command.commandId,
          appliedAt: step.result.command.createdAt,
          revertable: step.result.command.revertable,
          reverted: false,
          revertToken: step.result.revertToken,
          ...(step.result.redoToken ? { redoToken: step.result.redoToken } : {}),
        });
      }
    }
    if (result.finalOutcome) {
      recordMapReviewEvent(result.finalOutcome.reviewEvent);
      if (result.finalOutcome.revertToken) {
        recordMapActionHistory({
          commandId: result.finalOutcome.result.commandId,
          kind: result.finalOutcome.result.kind,
          title: result.finalOutcome.reviewEvent.title,
          reviewEventId: result.finalOutcome.result.reviewEventId ?? result.finalOutcome.result.commandId,
          appliedAt: result.finalOutcome.result.createdAt,
          revertable: result.finalOutcome.result.revertable,
          reverted: false,
          revertToken: result.finalOutcome.revertToken,
          ...(result.finalOutcome.redoToken ? { redoToken: result.finalOutcome.redoToken } : {}),
        });
      }
    }
    if (result.status !== "applied" || !result.manifest || !result.manifestHash || !result.finalOutputLayer) {
      announce(`Model blocked: ${result.blockers.join(" ")}`);
      return result;
    }
    setActiveAnalysisResultLayers([result.finalOutputLayer.id]);
    announce(`${result.model.title} model applied; output layer carries its reproducibility manifest.`);
    return result;
  }, [announce, recordMapActionHistory, recordMapReviewEvent, setActiveAnalysisResultLayers]);

  const handleRunMapModel = useCallback(
    (model: MapModelDefinition): MapModelRunResult => registerMapModelExecution(executeMapModel(
      model,
      processingRegistry,
      buildMapActionEffects(),
      { mapContextId: contextSummary.contextId, extensionExecutors: processingExtensionExecutors },
    )),
    [buildMapActionEffects, contextSummary.contextId, processingExtensionExecutors, processingRegistry, registerMapModelExecution],
  );

  const handleRunMapModelBatch = useCallback(
    (model: MapModelDefinition, targets: readonly MapModelBatchTarget[]) => {
      const batch = executeMapModelBatch(
        model,
        targets,
        processingRegistry,
        buildMapActionEffects(),
        { mapContextId: contextSummary.contextId, extensionExecutors: processingExtensionExecutors },
      );
      batch.results.forEach((entry) => registerMapModelExecution(entry.result));
      if (batch.status !== "blocked") announce(`${batch.results.length} model batch target(s) processed.`);
      return batch;
    },
    [announce, buildMapActionEffects, contextSummary.contextId, processingExtensionExecutors, processingRegistry, registerMapModelExecution],
  );

  const handleCommitDrawnFeatureEdit = useCallback((id: string, before: DrawnFeature, after: DrawnFeature) => {
    const validation = after.properties.validation ?? validateDrawnGeometry(after.geometry);
    const normalizedAfter: DrawnFeature = {
      ...after,
      properties: {
        ...after.properties,
        validation,
      },
    };
    const outcome = applyMapCommand(
      {
        kind: "aoi.edit",
        featureId: id,
        previousFeature: before,
        nextFeature: normalizedAfter,
        validation,
      },
      buildMapActionEffects(),
    );
    recordMapReviewEvent(outcome.reviewEvent);
    if (outcome.result.status === "applied") {
      recordMapActionHistory({
        commandId: outcome.result.commandId,
        kind: outcome.result.kind,
        title: outcome.reviewEvent.title,
        reviewEventId: outcome.result.reviewEventId ?? outcome.result.commandId,
        appliedAt: outcome.result.createdAt,
        revertable: outcome.result.revertable,
        reverted: false,
        ...(outcome.revertToken ? { revertToken: outcome.revertToken } : {}),
        ...(outcome.redoToken ? { redoToken: outcome.redoToken } : {}),
      });
      announce(validation.status === "warning"
        ? "AOI edit applied with topology caveats; review timeline updated."
        : "AOI edit applied; review timeline updated.");
      return;
    }

    updateDrawnFeature(id, {
      geometry: before.geometry,
      properties: before.properties,
    });
    announce(`AOI edit blocked: ${summarizeDrawnGeometryValidation(validation)}`);
  }, [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent, updateDrawnFeature]);

  const handleUndoMapAction = useCallback((commandId?: string) => {
    const entry = commandId
      ? findRevertableEntry(mapActionHistoryRef.current, commandId)
      : findUndoableEntry(mapActionHistoryRef.current);
    if (!entry?.revertToken) {
      announce("There is no reversible map edit to undo.");
      return;
    }
    revertMapCommand(entry.revertToken, buildMapActionEffects());
    mapActionHistoryRef.current = markMapActionUndone(mapActionHistoryRef.current, entry.commandId);
    refreshMapUndoRedoSummary();
    updateMapReviewEventStatus(entry.reviewEventId, "undone", "Undone via map undo stack");
    announce(`Undid: ${entry.title}`);
  }, [announce, buildMapActionEffects, refreshMapUndoRedoSummary, updateMapReviewEventStatus]);

  const handleRedoMapAction = useCallback(() => {
    const entry = findRedoableEntry(mapActionHistoryRef.current);
    if (!entry?.redoToken) {
      announce("There is no map edit to redo.");
      return;
    }
    redoMapCommand(entry.redoToken, buildMapActionEffects());
    mapActionHistoryRef.current = markMapActionRedone(mapActionHistoryRef.current, entry.commandId);
    refreshMapUndoRedoSummary();
    updateMapReviewEventStatus(entry.reviewEventId, "applied", "Redone via map undo stack");
    announce(`Redid: ${entry.title}`);
  }, [announce, buildMapActionEffects, refreshMapUndoRedoSummary, updateMapReviewEventStatus]);

  const handleRevertMapCommand = useCallback((commandId: string) => {
    handleUndoMapAction(commandId);
  }, [handleUndoMapAction]);

  const handleRepairLayerGeometry = useCallback(async (layerId: string) => {
    const layer = useMapExplorerStore.getState().overlayLayers.find((entry) => entry.id === layerId);
    if (!layer) {
      toastWarning("The layer selected for topology repair is no longer available.");
      announce("Geometry repair blocked: layer is no longer available.");
      return;
    }

    try {
      announce(`Previewing topology repair for ${layer.name}.`);
      const preview = await previewLayerTopologyRepair(layer, {
        mapContextId: contextSummary.contextId,
      });
      if (!preview.canApply || !preview.outputLayer || !preview.manifest) {
        const reason = preview.blockers.join(" ") || "No repairable topology changes were found.";
        toastWarning(`Geometry repair blocked: ${reason}`);
        announce(`Geometry repair blocked: ${reason}`);
        return;
      }

      const outcome = applyMapCommand(
        {
          kind: "workflow.apply",
          workflowId: preview.manifest.workflowId,
          outputLayer: preview.outputLayer,
          replaceLayerId: layer.id,
          canApply: true,
          manifest: preview.manifest,
          caveats: preview.caveats,
        },
        buildMapActionEffects(),
      );
      recordMapReviewEvent(outcome.reviewEvent);

      if (outcome.result.status !== "applied") {
        const reason = outcome.preflight.blockers.join(" ") || "Topology repair was not applied.";
        toastWarning(`Geometry repair blocked: ${reason}`);
        announce(`Geometry repair blocked: ${reason}`);
        return;
      }

      recordMapActionHistory({
        commandId: outcome.result.commandId,
        kind: outcome.result.kind,
        title: `Geometry repaired: ${layer.name}`,
        reviewEventId: outcome.result.reviewEventId ?? outcome.result.commandId,
        appliedAt: outcome.result.createdAt,
        revertable: outcome.result.revertable,
        reverted: false,
        ...(outcome.revertToken ? { revertToken: outcome.revertToken } : {}),
        ...(outcome.redoToken ? { redoToken: outcome.redoToken } : {}),
      });
      const qa = evaluateMapScientificQASync(useMapExplorerStore.getState().overlayLayers, {
        viewportZoom: zoom,
        activeAnalysisInputLayerIds,
        comparisonLayerIds: activeAnalysisResultLayerIds,
      });
      setScientificQA(qa);

      const repair = preview.preview;
      const message =
        `Geometry repair applied to ${layer.name}: ${repair.repairedFeatureCount.toLocaleString()} repaired, ${repair.removedFeatureCount.toLocaleString()} removed.`;
      toastSuccess(message);
      announce(`${message} Revert is available in the review timeline.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Topology repair failed.";
      toastWarning(`Geometry repair failed: ${message}`);
      announce(`Geometry repair failed: ${message}`);
    }
  }, [
    activeAnalysisInputLayerIds,
    activeAnalysisResultLayerIds,
    announce,
    buildMapActionEffects,
    contextSummary.contextId,
    recordMapActionHistory,
    recordMapReviewEvent,
    setScientificQA,
    zoom,
  ]);

  const handleInspectLayer = useCallback((layerId: string) => {
    setInspectorLayerId(layerId);
    announce("Layer inspector opened");
  }, [announce]);

  const handleOpenAttributeTable = useCallback((layerId: string) => {
    setAttributeTableLayerId(layerId);
    announce("Attribute table opened");
  }, [announce]);

  const handleAttributeTableSelection = useCallback((layerId: string, featureIds: string[]) => {
    setSelectedFeatures(layerId, featureIds);
    if (featureIds.length > 0) {
      setActiveAnalysisResultLayers([layerId]);
    }
  }, [setActiveAnalysisResultLayers, setSelectedFeatures]);

  const handleCreateAttributeDerivedLayer = useCallback((draft: MapAttributeDerivedFieldDraft) => {
    const sourceLayer = overlayLayers.find((entry) => entry.id === draft.sourceLayerId);
    if (!sourceLayer) {
      toastWarning("The source layer for this field calculation is no longer available.");
      announce("Field calculation blocked because the source layer is no longer available.");
      return;
    }

    const createdAt = new Date().toISOString();
    const layerId = `derived:fieldcalc:${sourceLayer.id}:${draft.fieldName}:${createdAt.replace(/[.:]/g, "-")}`;
    const layerName = `Field calc · ${sourceLayer.name} · ${draft.fieldName}`;
    const baseMetadata = buildFeatureCollectionMetadata(draft.featureCollection as FeatureCollection);
    const inheritedSchema = sourceLayer.metadata?.schemaSummary?.fields
      ?? sourceLayer.metadata?.registry?.schemaSummary.fields
      ?? [];
    const schemaFieldMap = new Map<string, LayerSchemaFieldSummary>();
    inheritedSchema.forEach((field) => schemaFieldMap.set(field.name, { ...field }));
    baseMetadata.schemaSummary?.fields.forEach((field) => {
      if (!schemaFieldMap.has(field.name)) schemaFieldMap.set(field.name, { ...field });
    });
    schemaFieldMap.set(draft.fieldName, {
      name: draft.fieldName,
      role: draft.fieldProfile.kind === "temporal" ? "temporal" : "attribute",
      ...(draft.fieldProfile.kind === "numeric"
        ? { type: "number" }
        : draft.fieldProfile.kind === "temporal"
          ? { type: "date" }
          : { type: "string" }),
    });
    const schemaFields = [...schemaFieldMap.values()];
    const sourceCrsSummary = sourceLayer.metadata?.crsSummary ?? sourceLayer.metadata?.registry?.crsSummary;
    const qaBadges = new Set<LayerScientificQABadge>();
    if (sourceLayer.sourceKind === "demo" || sourceLayer.metadata?.analysisResult?.outputMode === "demo") {
      qaBadges.add("sample_data");
    }
    if (!sourceCrsSummary?.crs) qaBadges.add("missing_crs");
    if (draft.nullCount > 0 || draft.errorCount > 0) qaBadges.add("uncertain_output");
    if (sourceLayer.metadata?.analysisResult?.stale) qaBadges.add("stale_result");

    const qaIssueIds = Array.from(new Set([
      ...(sourceLayer.metadata?.scientificQA?.issueIds ?? []),
      ...(draft.errorCount > 0 ? ["fieldcalc_evaluation_error"] : []),
      ...(draft.nullCount > 0 ? ["fieldcalc_null_output"] : []),
    ]));
    const qaCaveats = Array.from(new Set([
      `Sandboxed field calculator expression: ${draft.expression}.`,
      `Referenced fields: ${draft.referencedFields.join(", ") || "none"}.`,
      ...draft.warnings,
      ...(sourceCrsSummary?.notes ?? []),
      ...((sourceLayer.qaStatus === "warning" || sourceLayer.qaStatus === "error")
        ? (sourceLayer.metadata?.scientificQA?.caveats ?? [])
        : []),
    ]));
    const qaStatus: LayerQaStatus = sourceLayer.qaStatus === "error" || sourceLayer.metadata?.scientificQA?.status === "error"
      ? "error"
      : qaCaveats.length > 0 || sourceLayer.qaStatus === "warning" || sourceLayer.metadata?.scientificQA?.status === "warning"
        ? "warning"
        : "passed";

    const derivedLayer: OverlayLayerConfig = {
      id: layerId,
      name: layerName,
      type: sourceLayer.type,
      visible: true,
      opacity: sourceLayer.opacity,
      ...(sourceLayer.style ? { style: sourceLayer.style } : {}),
      sourceData: draft.featureCollection,
      queryable: true,
      sourceKind: "derived",
      group: "analysis",
      provenance: {
        label: layerName,
        sourceName: sourceLayer.name,
        method: `Sandboxed field calculator: ${draft.fieldName}`,
        generatedAt: createdAt,
        sourceLayerIds: [sourceLayer.id],
        notes: [
          `Expression: ${draft.expression}`,
          ...(draft.referencedFields.length > 0 ? [`Referenced fields: ${draft.referencedFields.join(", ")}`] : []),
          ...draft.warnings,
        ],
      },
      qaStatus,
      metadata: {
        ...baseMetadata,
        updatedAt: createdAt,
        dataVersion: `fieldcalc:${createdAt}`,
        fields: schemaFields.map((field) => field.name),
        schemaSummary: {
          fieldCount: schemaFields.length,
          fields: schemaFields,
          source: "analysis-result",
          notes: [`Derived field ${draft.fieldName} generated from a sandboxed calculator expression.`],
          ...(baseMetadata.schemaSummary?.geometryField ? { geometryField: baseMetadata.schemaSummary.geometryField } : {}),
        },
        ...(sourceCrsSummary ? {
          crsSummary: {
            crs: sourceCrsSummary.crs,
            status: sourceCrsSummary.status,
            source: sourceCrsSummary.source,
            notes: [...sourceCrsSummary.notes],
          },
        } : {}),
        scientificQA: {
          status: qaStatus,
          issueIds: qaIssueIds,
          badges: [...qaBadges],
          checkedAt: createdAt,
          featureIssueCount: draft.nullCount + draft.errorCount,
          usedWorker: false,
          caveats: qaCaveats,
          signature: `fieldcalc:${sourceLayer.id}:${draft.fieldName}:${createdAt}`,
        },
      },
    };

    addOverlayLayer(derivedLayer);
    setAttributeTableLayerId(derivedLayer.id);
    setActiveAnalysisResultLayers([derivedLayer.id]);
    recordMapReviewEvent({
      type: "layer-change",
      status: "applied",
      title: `Field calculator applied: ${draft.fieldName}`,
      summary: `${sourceLayer.name} produced ${layerName} with a sandboxed calculator expression and preserved provenance/QA caveats.`,
      layerIds: [sourceLayer.id, derivedLayer.id],
      actionIds: [draft.fieldName],
      details: {
        expression: draft.expression,
        sourceLayerId: sourceLayer.id,
        derivedLayerId: derivedLayer.id,
        referencedFieldCount: draft.referencedFields.length,
        nullCount: draft.nullCount,
        totalValueCount: draft.totalValueCount,
        errorCount: draft.errorCount,
      },
      undo: {
        available: false,
        outcome: "Derived layer added to the analysis stack.",
      },
    });
    const message = `Derived layer created: ${layerName}.`;
    toastSuccess(message);
    announce(message);
  }, [addOverlayLayer, announce, overlayLayers, recordMapReviewEvent, setActiveAnalysisResultLayers]);

  const handleSelectionQueryResult = useCallback((result: MapQueryExecutionResult, label: string) => {
    const layerIds = result.layers
      .filter((layer) => layer.matchedFeatureCount > 0)
      .map((layer) => layer.layerId);
    recordMapReviewEvent({
      type: "query-run",
      status: result.status === "success" ? "applied" : "failed",
      title: `${label} query`,
      summary: `${label} matched ${result.totalMatched.toLocaleString()} feature(s) from ${result.scannedFeatureCount.toLocaleString()} scanned candidate row(s).${result.truncated ? " Execution was truncated by the declared query scope." : ""}`,
      layerIds,
      details: {
        queryId: result.queryId,
        plannerVersion: result.provenance.plannerVersion,
        totalMatched: result.totalMatched,
        scannedFeatureCount: result.scannedFeatureCount,
        candidateFeatureCount: result.candidateFeatureCount,
        bounded: result.bounded,
        truncated: result.truncated,
        warnings: result.warnings,
        blockers: result.blockers,
        provenance: result.provenance,
      },
    });
  }, [recordMapReviewEvent]);

  useEffect(() => {
    if (!open || reviewSession.events.length > 0) {
      return;
    }

    clearMapReviewSession({
      projectId: selectedProjectId,
      title: selectedProject?.name ? `${selectedProject.name} map review session` : "Map review session",
      initialSnapshot: buildCurrentReviewSnapshot(),
    });
  }, [buildCurrentReviewSnapshot, clearMapReviewSession, open, reviewSession.events.length, selectedProject?.name, selectedProjectId]);

  useEffect(() => {
    if (!open || typeof globalThis.addEventListener !== "function") {
      return undefined;
    }

    const handleLayerRegistryChange = (event: Event) => {
      const detail = (event as CustomEvent<MapLayerRegistryChangeDetail>).detail;
      if (!detail) return;
      recordMapReviewEvent(buildLayerRegistryReviewEvent(detail, buildCurrentReviewSnapshot()));
    };

    globalThis.addEventListener(MAP_LAYER_REGISTRY_EVENT, handleLayerRegistryChange as EventListener);
    return () => globalThis.removeEventListener(MAP_LAYER_REGISTRY_EVENT, handleLayerRegistryChange as EventListener);
  }, [buildCurrentReviewSnapshot, open, recordMapReviewEvent]);

  useEffect(() => {
    if (!open || !scientificQA) {
      return;
    }

    const signature = scientificQA.metadata.signature;
    if (lastReviewQaSignatureRef.current === signature) {
      return;
    }

    lastReviewQaSignatureRef.current = signature;
    recordMapReviewEvent(buildScientificQAReviewEvent(scientificQA, buildCurrentReviewSnapshot()));
  }, [buildCurrentReviewSnapshot, open, recordMapReviewEvent, scientificQA]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const signature = analysisRecommendationState.metadata.signature;
    if (lastReviewRecommendationSignatureRef.current === signature) {
      return;
    }

    lastReviewRecommendationSignatureRef.current = signature;
    const event = buildRecommendationReviewEvent(analysisRecommendationState, buildCurrentReviewSnapshot());
    if (event) {
      recordMapReviewEvent(event);
    }
  }, [analysisRecommendationState, buildCurrentReviewSnapshot, open, recordMapReviewEvent]);

  useEffect(() => {
    if (!open) {
      return;
    }

    for (const proposal of copilotActionProposals) {
      if (recordedCopilotProposalIdsRef.current.has(proposal.id)) {
        continue;
      }
      recordedCopilotProposalIdsRef.current.add(proposal.id);
      recordMapReviewEvent(buildMapAIProposalReviewEvent(proposal.guardrail, {
        proposalId: proposal.id,
        title: proposal.title,
        timestamp: proposal.queuedAt,
        actionIds: [proposal.id],
        details: {
          kind: proposal.kind,
          status: proposal.status,
          confirmationRequired: proposal.confirmationRequired,
          guardrailBlockers: proposal.guardrailBlockers,
        },
      }));
    }
  }, [copilotActionProposals, open, recordMapReviewEvent]);

  useEffect(() => {
    if (!open) {
      return;
    }

    for (const auditEntry of copilotAuditTrail) {
      if (recordedCopilotAuditIdsRef.current.has(auditEntry.id)) {
        continue;
      }
      recordedCopilotAuditIdsRef.current.add(auditEntry.id);
      const proposal = copilotActionProposals.find((entry) => entry.id === auditEntry.proposalId);
      recordMapReviewEvent({
        type: "action-status",
        status: auditEntry.action === "applied" ? "applied" : auditEntry.action === "rejected" ? "rejected" : "recorded",
        timestamp: auditEntry.timestamp,
        title: `AI-proposed action ${auditEntry.action}: ${proposal?.title ?? auditEntry.proposalId}`,
        summary: auditEntry.reason
          ? `AI-proposed action ${auditEntry.proposalId} was ${auditEntry.action}: ${auditEntry.reason}`
          : `AI-proposed action ${auditEntry.proposalId} was ${auditEntry.action}.`,
        actionIds: [auditEntry.proposalId],
        details: {
          auditId: auditEntry.id,
          kind: proposal?.kind ?? "unknown",
          reason: auditEntry.reason ?? null,
          aiGuardrail: proposal?.guardrail
            ? mapAIGuardrailDetails(proposal.guardrail)
            : auditEntry.guardrail
              ? mapAIGuardrailDetails(auditEntry.guardrail)
              : null,
        },
      });
    }
  }, [copilotActionProposals, copilotAuditTrail, open, recordMapReviewEvent]);

  useEffect(() => {
    setMapViewRestriction(currentMapBounds ?? null, restrictToMapView);
  }, [currentMapBounds, restrictToMapView]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    return subscribeToViewportSync((event) => {
      if (event.source !== "voxcity-3d" || !useViewportSyncStore.getState().enabled) {
        return;
      }

      const map = mapInstanceRef.current;
      if (!map) {
        return;
      }

      suppressViewportSyncPublishRef.current = true;
      if (suppressViewportSyncTimerRef.current !== null) {
        window.clearTimeout(suppressViewportSyncTimerRef.current);
      }
      suppressViewportSyncTimerRef.current = window.setTimeout(() => {
        suppressViewportSyncPublishRef.current = false;
        suppressViewportSyncTimerRef.current = null;
      }, reducedMotion ? 80 : 280);
      setViewport({
        center: event.center,
        zoom: event.zoom,
        bearing: event.bearing,
        pitch: event.pitch,
      });

      map.easeTo({
        center: event.center,
        zoom: event.zoom,
        bearing: event.bearing,
        pitch: event.pitch,
        duration: reducedMotion ? 0 : 180,
        essential: true,
      });
    });
  }, [open, reducedMotion, setViewport]);
  const {
    reportHandoffSource,
    setReportHandoffSource,
    reportHandoffOptions,
    setReportHandoffOptions,
    reportHandoffSnapshot,
    setReportHandoffSnapshot,
    isGeneratingReportHandoffSnapshot,
    setIsGeneratingReportHandoffSnapshot,
    isExportingReportHandoffPdf,
    setIsExportingReportHandoffPdf,
  } = useMapReportController();
  const {
    dockLayout,
    effectiveShowSidebar,
    effectiveShowLayerPanel,
    effectiveShowDrawPanel,
    effectiveShowMeasurePanel,
    effectiveShowScientificQAPanel,
    effectiveShowUrbanMethodPanel,
    effectiveShowNLQueryPanel,
    effectiveShowWorkflowDrawer,
    navigatorLeftInset,
    navigatorRightInset,
  } = useMapPanelLayout({
    mapContainerWidth,
    showLayerPanel,
    showSidebar,
    showDrawPanel,
    showMeasurePanel,
    showScientificQAPanel,
    showUrbanMethodPanel: activeUrbanMethodPreview !== null,
    showNLQueryPanel,
    showWorkflowDrawer,
    showReviewTimeline,
    hasReportHandoffSource: Boolean(reportHandoffSource),
    navigatorStageMode,
    navigatorStageMargin: MAP_NAVIGATOR_STAGE_MARGIN,
    layoutPreferences,
  });
  const {
    closeFloatingRightPanels,
    closeRightDockPanels,
    openScientificQAPanel,
    handleToggleScientificQAPanel,
    handleToggleNLQueryPanel,
    handleToggleWorkflowDrawer,
    handleToggleReviewTimeline,
    handleToggleSidebar,
    handleToggleLayerPanel,
    handleToggleChoroplethPanel,
    handleToggleClusterViz,
    handleToggleHotSpotViz,
    handleToggleEmergingHotSpotViz,
  } = useMapPanelCommands({
    announce,
    compactDock: dockLayout.compactDock,
    effectiveShowLayerPanel,
    navigatorStageMode,
    setPointSymbologyLayerId,
    setShowChoroplethPanel,
    setShowClusterViz,
    setShowDrawPanel,
    setShowEmergingHotSpotViz,
    setShowHotSpotViz,
    setShowLayerPanel,
    setShowMeasurePanel,
    setShowNLQueryPanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowSidebar,
    setShowVoxCityOverlay,
    setShowWorkflowDrawer,
    setWorkspaceView,
    setWorkflowPreview,
    showLayerPanel,
  });
  const {
    handleToggleRestrictToMapView,
    handleOpenFlowDispatchDialog,
    handleRunSelectionStatistics,
    handleDispatchFlowSelection,
    handleIsochroneDispatch,
  } = useMapAoiDispatch({
    announce,
    compatibleAoiFlows,
    contextSummary,
    currentMapBounds,
    flowDispatchAoi,
    overlayLayers,
    recordMapReviewEvent,
    restrictToMapView,
    selectedFeatureIds,
    setDispatchFeedback,
    setIsFlowDispatchDialogOpen,
    setRestrictToMapView,
    setSelectionStatsSummary,
  });
  const [drawSeed, setDrawSeed] = useState<{
    coordinate: [number, number];
    tool: DrawToolId;
    token: number;
  } | null>(null);
  const [measurementSeed, setMeasurementSeed] = useState<{
    coordinate: [number, number];
    tool: MeasureToolId;
    token: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<MapImportProgress | null>(null);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importLabel, setImportLabel] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingImportPreview, setPendingImportPreview] = useState<{
    profile: SourceProfile;
    result?: ImportedGeoJSONLayer;
  } | null>(null);
  const [pendingCsvImport, setPendingCsvImport] = useState<CsvImportSession | null>(null);
  const [pendingColumnarImport, setPendingColumnarImport] = useState<ColumnarImportSession | null>(null);
  const [csvLatitudeColumn, setCsvLatitudeColumn] = useState("");
  const [csvLongitudeColumn, setCsvLongitudeColumn] = useState("");
  const [showImportHub, setShowImportHub] = useState(false);
  const [loadingTeachingDatasetId, setLoadingTeachingDatasetId] = useState<TeachingDatasetId | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMapExportDialog, setShowMapExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<MapExportFormat>("geojson");
  const [exportTarget, setExportTarget] = useState<MapExportTarget>("visible-layers");
  const [exportPrecision, setExportPrecision] = useState(6);
  const [exportPrettyPrint, setExportPrettyPrint] = useState(true);
  const [exportIncludeProperties, setExportIncludeProperties] = useState(true);
  const [mapCompositionOptions, setMapCompositionOptions] = useState<MapCompositionOptions>(() => ({
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
  }));
  const [mapExportPreviewUrl, setMapExportPreviewUrl] = useState<string | null>(null);
  const [isGeneratingMapExportPreview, setIsGeneratingMapExportPreview] = useState(false);
  const [isExportingMapImage, setIsExportingMapImage] = useState(false);
  const [isExportingOfflinePackage, setIsExportingOfflinePackage] = useState(false);
  const [isLoadingPointSymbology, setIsLoadingPointSymbology] = useState(false);
  const [pointSymbologyError, setPointSymbologyError] = useState<string | null>(null);
  const [pointSymbologyCollection, setPointSymbologyCollection] = useState<GeoJSON.FeatureCollection | null>(null);
  const [pointSymbologyFields, setPointSymbologyFields] = useState<NumericFieldInfo[]>([]);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [rerunningAnalysisToken, setRerunningAnalysisToken] = useState<string | null>(null);
  const [selectedTemporalLayerId, setSelectedTemporalLayerId] = useState<string | null>(null);
  const quotaWarningShownRef = useRef<{ key: string; timestamp: number } | null>(null);
  const lastProjectSaveErrorRef = useRef<{ key: string; timestamp: number } | null>(null);
  const lastAutoSaveTriggerRef = useRef<{
    activeBaseLayer: typeof activeBaseLayer;
    annotations: typeof annotations;
    bearing: typeof bearing;
    bookmarks: typeof bookmarks;
    center: typeof center;
    drawnFeatures: typeof drawnFeatures;
    overlayLayers: typeof overlayLayers;
    pins: typeof pins;
    pitch: typeof pitch;
    selectedProjectId: typeof selectedProjectId;
    sourceHandles: typeof sourceHandles;
    zoom: typeof zoom;
  } | null>(null);
  const isRestoringProjectRef = useRef(false);
  const previousProjectIdRef = useRef<string | null>(selectedProjectId);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinMode = activeTool === "pin";
  const mapCanvasCaptureMode = showMapExportDialog
    || isGeneratingReportHandoffSnapshot
    || isExportingReportHandoffPdf
    || isExportingMapImage;
  const annotationMode = activeTool === "annotate";
  const selectedPointSymbologyLayer = pointSymbologyLayerId
    ? overlayLayers.find((layer) => layer.id === pointSymbologyLayerId) ?? null
    : null;
  const contentsRenderLayers = useMemo(
    () => applyContentsToRenderLayers(overlayLayers, zoom),
    [overlayLayers, zoom],
  );
  const interactiveAnalysisLayerIds = useMemo(
    () => contentsRenderLayers
      .filter((layer) =>
        layer.visible &&
        (layer.queryable ?? (layer.type === "geojson" || layer.type === "heatmap")),
      )
      .map((layer) => layer.id),
    [contentsRenderLayers],
  );
  const visiblePublicationLayers = useMemo(
    () => overlayLayers.filter((layer) => layer.visible),
    [overlayLayers],
  );
  const mapPublicationLegendItems = useMemo(
    () => buildMapCompositionLegendItems(visiblePublicationLayers),
    [visiblePublicationLayers],
  );
  const mapPublicationReadiness = useMemo(
    () => buildMapPublicationReadiness({
      mode: "publication-export",
      overlayLayers: visiblePublicationLayers,
      composition: mapCompositionOptions,
      scientificQA,
      legendItems: mapPublicationLegendItems,
    }),
    [mapCompositionOptions, mapPublicationLegendItems, scientificQA, visiblePublicationLayers],
  );
  const reportHandoffDraft = useMemo(() => {
    if (!reportHandoffSource) return null;
    return buildMapReportHandoffDraft({
      overlayLayers,
      viewport: { center, zoom, bearing, pitch },
      currentMapBounds,
      baseLayerName: BASE_STYLES[activeBaseLayer].name,
      selectedFeatureIds,
      scientificQA,
      source: reportHandoffSource,
      snapshot: reportHandoffSnapshot,
      options: reportHandoffOptions,
    });
  }, [
    activeBaseLayer,
    bearing,
    center,
    currentMapBounds,
    overlayLayers,
    pitch,
    reportHandoffOptions,
    reportHandoffSnapshot,
    reportHandoffSource,
    scientificQA,
    selectedFeatureIds,
    zoom,
  ]);
  const workflowPreviewLayer = useMemo(
    () => effectiveShowWorkflowDrawer
      ? buildMapWorkflowPreviewLayer(workflowPreview, workflowContext)
      : null,
    [effectiveShowWorkflowDrawer, workflowContext, workflowPreview],
  );
  const mapRenderLayers = useMemo(() => {
    const comparison = effectiveShowWorkflowDrawer ? workflowPreview?.comparisonState : undefined;
    const baseLayers = comparison?.view === "blend"
      ? contentsRenderLayers.map((layer) => {
          if (layer.id === comparison.layerAId) {
            return { ...layer, opacity: comparison.blendOpacityA };
          }
          if (layer.id === comparison.layerBId) {
            return { ...layer, opacity: comparison.blendOpacityB };
          }
          return layer;
        })
      : contentsRenderLayers;
    return workflowPreviewLayer ? [...baseLayers, workflowPreviewLayer] : baseLayers;
  }, [contentsRenderLayers, effectiveShowWorkflowDrawer, workflowPreview?.comparisonState, workflowPreviewLayer]);
  const performanceDiagnostics = useMemo(
    () => buildMapPerformanceDiagnostics({ overlayLayers: mapRenderLayers, timings: performanceTimings, telemetryEvents }),
    [mapRenderLayers, performanceTimings, telemetryEvents],
  );
  const performanceWarningFingerprint = performanceDiagnostics.warnings.join(" | ");
  useEffect(() => {
    if (!performanceWarningFingerprint) {
      return;
    }
    performanceWarningFingerprint.split(" | ").forEach((warning) => {
      recordMapTelemetryEvent({
        kind: "performance.budget",
        severity: "warning",
        source: "performance-diagnostics",
        message: warning,
        code: "MAP_PERFORMANCE_BUDGET",
        recoverable: true,
        recoveryLabel: "Review render budgets",
        details: {
          renderMode: performanceDiagnostics.renderMode,
          previewLayerCount: performanceDiagnostics.previewLayerCount,
          visibleLayerCount: performanceDiagnostics.visibleLayerCount,
          workerTransferBytes: performanceDiagnostics.workerTransferBytes,
        },
        fingerprint: `performance:${warning}`,
      }, { dedupeKey: `performance:${warning}`, dedupeMs: 30_000 });
    });
  }, [
    performanceDiagnostics.previewLayerCount,
    performanceDiagnostics.renderMode,
    performanceDiagnostics.visibleLayerCount,
    performanceDiagnostics.workerTransferBytes,
    performanceWarningFingerprint,
  ]);
  const performanceIssueCount = performanceDiagnostics.warnings.length
    + performanceDiagnostics.telemetrySummary.warningCount
    + performanceDiagnostics.telemetrySummary.errorCount;
  const toolbarActiveGeometryType = useMemo(() => {
    const selectedLayer = selectedPointSymbologyLayer?.visible
      ? selectedPointSymbologyLayer
      : visiblePublicationLayers[0] ?? null;
    return selectedLayer?.metadata?.geometryType ?? null;
  }, [selectedPointSymbologyLayer, visiblePublicationLayers]);
  // Prompt 46 — store-driven temporal player (frame export + playback engine).
  const temporalStoreFrameCount = useTemporalLayerStore(selectTemporalFrameCount);
  const temporalLayers = useMemo(
    () => overlayLayers.filter((layer) =>
      layer.visible &&
      layer.metadata?.analysisResult?.visualization.kind === "temporal" &&
      (layer.metadata.analysisResult.visualization.temporalFrames?.length ?? 0) > 0,
    ),
    [overlayLayers],
  );
  const activeTemporalLayer = temporalLayers.find((layer) => layer.id === selectedTemporalLayerId)
    ?? temporalLayers[0]
    ?? null;

  const handleMapContainerRef = useCallback((element: HTMLDivElement | null) => {
    mapContainerRef.current = element;
    setMapContainerElement(element);
  }, []);

  const handleLayerPanelWidthChange = useCallback((width: number) => {
    setLayoutPreferences({ layerPanelWidth: width });
  }, [setLayoutPreferences]);

  const handleRightPanelWidthChange = useCallback((width: number) => {
    setLayoutPreferences({ rightPanelWidth: width });
  }, [setLayoutPreferences]);

  const handleSetWorkspaceView = useCallback((view: MapWorkspaceView) => {
    setWorkspaceView(view);
    announce(`Map workspace switched to ${view}`);
  }, [announce]);

  const focusInteractiveMapCanvas = useCallback(() => {
    const focusCanvas = () => {
      document.getElementById(mapCanvasId)?.focus({ preventScroll: true });
    };
    focusCanvas();
    window.requestAnimationFrame(focusCanvas);
    announce("Interactive map canvas focused");
  }, [announce, mapCanvasId]);

  useEffect(() => {
    if (workspaceView !== "analyze") {
      setShowLayerPanel(true);
      setShowMeasurePanel(false);
      if (activeMeasureTool) {
        setActiveMeasureTool(null);
      }
      return;
    }

    setShowLayerPanel(true);
    if (activeMeasureTool || showMeasurePanel) {
      setShowDrawPanel(false);
      setShowMeasurePanel(true);
    } else {
      setShowDrawPanel(true);
    }
  }, [activeMeasureTool, setActiveMeasureTool, showMeasurePanel, workspaceView]);

  useEffect(() => {
    if (!open) return undefined;
    if (!mapContainerElement) return undefined;

    const updateWidth = () => {
      setMapContainerWidth(Math.round(mapContainerElement.getBoundingClientRect().width));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(mapContainerElement);
    return () => observer.disconnect();
  }, [mapContainerElement, open]);

  useEffect(() => {
    if (temporalLayers.length === 0) {
      if (selectedTemporalLayerId !== null) {
        setSelectedTemporalLayerId(null);
      }
      return;
    }

    if (!selectedTemporalLayerId || !temporalLayers.some((layer) => layer.id === selectedTemporalLayerId)) {
      setSelectedTemporalLayerId(temporalLayers[0]!.id);
    }
  }, [selectedTemporalLayerId, temporalLayers]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTimestep(0);
  }, [activeTemporalLayer?.id, setCurrentTimestep, setIsPlaying]);

  const handleTemporalLayerSelection = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLayerId = event.target.value;
    setSelectedTemporalLayerId(nextLayerId);
    setActiveAnalysisResultLayers([nextLayerId]);
    setIsPlaying(false);
    setCurrentTimestep(0);

    const nextLayer = temporalLayers.find((layer) => layer.id === nextLayerId);
    if (nextLayer) {
      announce(`Temporal layer selected: ${nextLayer.name}`);
    }
  }, [announce, setActiveAnalysisResultLayers, setCurrentTimestep, setIsPlaying, temporalLayers]);

  /* ---- Sync overlay layers to MapLibre ---- */
  useLayerSync(mapInstanceRef, mapRenderLayers, recordPerformanceTiming);

  /* ---- Scientific QA evaluation ---- */
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    // Debounce QA evaluation. `zoom` is both an effect dependency and an input to the
    // per-layer QA cache signature, so a camera move (e.g. the fit-to-bounds animation
    // after an import) would otherwise re-run a full QA pass on every frame. For some
    // layers the result never settles within a single animation, producing a re-render
    // storm that starves the main thread. Coalescing rapid zoom/layer changes into a
    // single evaluation after the view settles keeps QA correct without the thrash.
    const timer = setTimeout(() => {
      const sequence = scientificQASequenceRef.current + 1;
      scientificQASequenceRef.current = sequence;

      void evaluateMapScientificQA(overlayLayers, {
        viewportZoom: zoom,
        activeAnalysisInputLayerIds,
        comparisonLayerIds: activeAnalysisResultLayerIds,
      })
        .then((qa) => {
          if (!cancelled && scientificQASequenceRef.current === sequence) {
            setScientificQA(qa);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          const message = error instanceof Error
            ? error.message
            : "Scientific QA could not complete for the current map state.";
          toastWarning(message);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeAnalysisInputLayerIds, activeAnalysisResultLayerIds, open, overlayLayers, setScientificQA, zoom]);

  /* ---- Keyboard map controls ---- */
  useMapKeyboardControls(mapInstanceRef, {
    enabled: open,
    mapElementId: mapCanvasId,
    reducedMotion,
    defaultCenter: [29.0, 41.0],
    defaultZoom: 10,
    onPanAnnounce: (direction) => announce(`Map panned ${direction}`),
    onZoomAnnounce: (z) => announce(`Zoom level ${z}`),
    onResetAnnounce: () => announce("Map view reset to default"),
  });

  /* ---- Map instance callbacks ---- */
  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map;
    if (mapCanvasRef) {
      mapCanvasRef.current = map;
    }
    /* Defensive: re-enable interaction handlers in case a previous session
       (or a child overlay that unmounted mid-drag) left them disabled. */
    try {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
      map.keyboard.enable();
    } catch {
      /* maplibre instance gone; ignore */
    }
    const bounds = map.getBounds();
    setCurrentMapBounds([
      Number(bounds.getWest().toFixed(6)),
      Number(bounds.getSouth().toFixed(6)),
      Number(bounds.getEast().toFixed(6)),
      Number(bounds.getNorth().toFixed(6)),
    ]);

    /* Drain any pending fit-bounds request queued before the canvas was
       ready (e.g. the Urban Analytics study-area picker calling
       `openMapExplorerWithStudyAreaPreview`). The typed store contract
       guarantees the latest request is honoured exactly once. */
    const pending = useMapExplorerStore.getState().pendingFitBounds;
    if (pending) {
      const [minLng, minLat, maxLng, maxLat] = pending.bounds;
      if (minLng === maxLng && minLat === maxLat) {
        map.easeTo({
          center: [minLng, minLat],
          zoom: Math.max(map.getZoom(), 14),
          duration: reducedMotion ? 0 : 500,
          essential: true,
        });
      } else {
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 64, duration: reducedMotion ? 0 : 900, essential: true },
        );
      }
      useMapExplorerStore.getState().consumePendingFitBounds();
    }
  }, [mapCanvasRef, reducedMotion, setCurrentMapBounds]);

  const handleMapDestroy = useCallback(() => {
    mapInstanceRef.current = null;
    if (mapCanvasRef) {
      mapCanvasRef.current = null;
    }
  }, [mapCanvasRef]);

  /* ---- Map event callbacks ---- */
  const handleCursorMove = useCallback((coords: { lng: number; lat: number }) => {
    cursorRef.current = coords;
    statusCursorRef.current?.setCursor(coords);
  }, []);

  const handleZoomChange = useCallback((z: number) => {
    setViewport({ zoom: z });
  }, [setViewport]);

  const handleViewportChange = useCallback(
    (
      v: { center: [number, number]; zoom: number; bearing: number; pitch: number },
      meta?: { userInitiated: boolean },
    ) => {
      setViewport(v);
      const shouldPublishViewportSync = viewportSyncEnabled && !suppressViewportSyncPublishRef.current;

      /* Once the user actively pans/zooms the main canvas, an in-flight
         explicit fit request from a prior open cycle is no longer relevant
         and must be cleared so subsequent project autoloads can restore
         their stored viewport normally. */
      if (meta?.userInitiated) {
        useMapExplorerStore.getState().clearLastExplicitFitRequest();
      }

      const bounds = mapInstanceRef.current?.getBounds();
      if (bounds) {
        setCurrentMapBounds([
          Number(bounds.getWest().toFixed(6)),
          Number(bounds.getSouth().toFixed(6)),
          Number(bounds.getEast().toFixed(6)),
          Number(bounds.getNorth().toFixed(6)),
        ]);
      }

      if (shouldPublishViewportSync) {
        publishViewportSync({
          source: "map-2d",
          center: v.center,
          zoom: v.zoom,
          bearing: v.bearing,
          pitch: v.pitch,
        });
      }
    },
    [setCurrentMapBounds, setViewport, viewportSyncEnabled],
  );

  const handleToggleViewportSync = useCallback(() => {
    const nextEnabled = !useViewportSyncStore.getState().enabled;
    setViewportSyncEnabled(nextEnabled);
    announce(nextEnabled ? "2D and 3D viewport sync enabled" : "2D and 3D viewport sync disabled");
  }, [announce]);

  const handleExternalServiceProgress = useCallback((detail: MapServiceDialogProgressDetail) => {
    setIsImporting(detail.busy);
    setImportLabel(detail.label);
    setImportProgress(detail.progress);
    setShowImportProgress(detail.busy || detail.progress !== null);
  }, []);

  const handleOpenVoxCityOverlayFromService = useCallback(() => {
    setWorkspaceView("explore");
    setShowScientificQAPanel(false);
    setShowNLQueryPanel(false);
    setShowSidebar(false);
    setShowDrawPanel(false);
    setShowMeasurePanel(false);
    setPointSymbologyLayerId(null);
    setShowChoroplethPanel(false);
    setShowClusterViz(false);
    setShowHotSpotViz(false);
    setShowEmergingHotSpotViz(false);
    setShowVoxCityOverlay(true);
    announce("VoxCity 2D overlay opened for external building source");
  }, [announce]);

  const handleMapRenderError = useCallback((message: string) => {
    const now = Date.now();
    const previous = lastMapRenderErrorRef.current;
    if (previous?.message === message && now - previous.timestamp < MAP_RENDER_ERROR_NOTICE_COOLDOWN_MS) {
      return;
    }

    lastMapRenderErrorRef.current = { message, timestamp: now };
    setDispatchFeedback({
      tone: "error",
      title: "External service render issue",
      description: message,
    });
    toastWarning(message);
    announce(message);
  }, [announce]);

  const handleMapClick = useCallback((coords: { lng: number; lat: number }) => {
    const newPin: MapPin = {
      id: `pin-${Date.now()}`,
      lng: coords.lng,
      lat: coords.lat,
      label: `Pin ${pins.length + 1}`,
    };
    addPin(newPin);
    announce(`Pin added: ${newPin.label} at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
  }, [pins.length, addPin, announce]);

  /* ---- Wrapped actions with announcements ---- */
  const handleSetBaseLayer = useCallback(
    (layer: import("../mapTypes").BaseLayerId) => {
      setBaseLayer(layer);
      const names: Record<string, string> = {
        streets: "OpenStreetMap",
        dark: "Dark Matter",
        satellite: "Satellite",
        terrain: "Positron",
      };
      announce(`Base layer switched to ${names[layer] ?? layer}`);
    },
    [setBaseLayer, announce],
  );

  const handleRemovePin = useCallback(
    (id: string) => {
      const pin = pins.find((p) => p.id === id);
      removePin(id);
      announce(`Pin removed: ${pin?.label ?? id}`);
    },
    [removePin, pins, announce],
  );

  const handleClearPins = useCallback(() => {
    const count = pins.length;
    clearPins();
    announce(`All ${count} pins cleared`);
  }, [clearPins, pins.length, announce]);

  const [workflowExecution, setWorkflowExecution] = useState<MapWorkflowExecutionUpdate | null>(null);
  const workflowExecutionHandleRef = useRef<MapWorkflowExecutionHandle | null>(null);
  const workflowExecutorRef = useRef<ReturnType<typeof createMapWorkflowWorkerExecutor> | null>(null);

  const handleApplyMapWorkflow = useCallback(
    (result: MapWorkflowApplyResult) => {
      setWorkflowPreview(null);
      setUrbanWorkflowDraftRequest(null);
      // Route the derived-layer commit through the command lifecycle so the
      // workflow apply is auditable and the timeline "Revert" removes the layer.
      const workflowOutcome = applyMapCommand(
        {
          kind: "workflow.apply",
          workflowId: result.manifest.workflowId,
          outputLayer: result.layer,
          canApply: true,
          manifest: result.manifest,
        },
        buildMapActionEffects(),
      );
      recordMapActionHistory({
        commandId: workflowOutcome.result.commandId,
        kind: workflowOutcome.result.kind,
        title: `Workflow applied: ${result.reportItem.title}`,
        reviewEventId: workflowOutcome.result.reviewEventId ?? workflowOutcome.result.commandId,
        appliedAt: workflowOutcome.result.createdAt,
        revertable: workflowOutcome.result.revertable,
        reverted: false,
        ...(workflowOutcome.revertToken ? { revertToken: workflowOutcome.revertToken } : {}),
        ...(workflowOutcome.redoToken ? { redoToken: workflowOutcome.redoToken } : {}),
      });
      const drawnAoi = buildDrawnAoiFromWorkflowResult(result);
      if (drawnAoi) {
        const mapState = useMapExplorerStore.getState();
        if (mapState.drawnFeatures.some((feature) => feature.id === drawnAoi.id)) {
          mapState.updateDrawnFeature(drawnAoi.id, {
            geometry: drawnAoi.geometry,
            properties: drawnAoi.properties,
          });
        } else {
          mapState.addDrawnFeature(drawnAoi);
        }
        mapState.setActiveAoi(drawnAoi.id);
        mapState.setSelectedFeatureId(drawnAoi.id);
      }
      const bounds =
        result.layer.metadata?.bounds ??
        (result.preview.featureCollection
          ? getFeatureCollectionBounds(result.preview.featureCollection)
          : undefined);
      if (bounds) {
        const map = mapInstanceRef.current;
        if (map) {
          const [minLng, minLat, maxLng, maxLat] = bounds;
          if (minLng === maxLng && minLat === maxLat) {
            map.easeTo({
              center: [minLng, minLat],
              zoom: Math.max(map.getZoom(), 14),
              duration: reducedMotion ? 0 : 500,
              essential: true,
            });
          } else {
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              {
                padding: 64,
                duration: reducedMotion ? 0 : 900,
                essential: true,
              },
            );
          }
        }
      }
      setActiveAnalysisResultLayers([result.layer.id]);
      setWorkflowReportItems((current) => {
        const filtered = current.filter((item) => item.id !== result.reportItem.id);
        return [...filtered, result.reportItem];
      });
      upsertMapEvidenceArtifact(createMapWorkflowResultEvidenceArtifact({
        title: `${result.reportItem.title} workflow result`,
        summary: `${result.preview.workflow} workflow output registered with reproducibility manifest ${result.manifest.manifestId}.`,
        workflowId: result.manifest.workflowId,
        sourceLayerIds: result.reportItem.sourceLayerIds,
        derivedLayerId: result.layer.id,
        linkedLayerIds: [result.layer.id],
        crsSummary: {
          displayCrs: result.manifest.crsSummary.displayCrs,
          sourceLayerCrs: result.manifest.crsSummary.sourceLayerCrs,
          missingLayerIds: result.manifest.crsSummary.missingLayerIds,
          notes: result.manifest.crsSummary.notes,
        },
        geometrySummary: {
          geometryTypes: [result.preview.geometryClass],
          featureCount: result.preview.featureCount,
          ...(result.preview.bounds ? { bounds: result.preview.bounds } : {}),
          source: "workflow-summary",
          notes: [`Expected output group: ${result.manifest.expectedOutput.outputLayerGroup}`],
        },
        qa: {
          state: result.manifest.qaSummary.status === "blocked"
            ? "blocked"
            : result.manifest.qaSummary.warningCount > 0
              ? "warning"
              : "passed",
          issueIds: result.manifest.qaIssueIds,
          issueCount: result.manifest.qaIssueIds.length,
          blockerCount: result.manifest.qaSummary.blockerCount,
          caveats: result.manifest.qaSummary.caveats,
          checkedAt: result.manifest.createdAt,
        },
        metadata: {
          manifestId: result.manifest.manifestId,
          manifestVersion: result.manifest.version,
          workflowKind: result.manifest.workflowKind,
          workflowStatus: result.manifest.status,
          sourceLayerCount: result.manifest.sourceLayerIds.length,
          outputLayerCount: result.manifest.outputLayerIds.length,
          expectedFeatureCount: result.manifest.expectedOutput.featureCount,
          qaBlockerCount: result.manifest.qaSummary.blockerCount,
          qaWarningCount: result.manifest.qaSummary.warningCount,
          needsWorker: result.manifest.expectedOutput.needsWorker,
        },
        createdAt: result.manifest.createdAt,
      }));
      recordMapReviewEvent({
        id: workflowOutcome.result.commandId,
        type: "workflow-action",
        status: "applied",
        title: `Workflow applied: ${result.reportItem.title}`,
        summary: `${result.preview.workflow} workflow committed ${result.layer.name} as a derived, inspectable map layer.`,
        layerIds: [result.layer.id, ...result.reportItem.sourceLayerIds],
        reportItemIds: [result.reportItem.id],
        undo: {
          available: true,
          actionLabel: `Remove derived layer ${result.layer.name}`,
          outcome: "Derived layer can be removed from the layer stack.",
        },
        details: {
          commandId: workflowOutcome.result.commandId,
          commandKind: "workflow.apply",
          revertable: workflowOutcome.result.revertable,
          workflow: result.reportItem.workflow,
          derivedLayerId: result.reportItem.derivedLayerId,
          sourceLayerIds: result.reportItem.sourceLayerIds,
          manifestId: result.manifest.manifestId,
          workflowId: result.manifest.workflowId,
          metrics: result.reportItem.metrics,
          comparisonState: result.reportItem.comparisonState ?? null,
        },
      });
      const message = `${result.reportItem.title} registered as a derived layer.`;
      setDispatchFeedback({
        tone: "success",
        title: "Workflow applied",
        description: message,
      });
      toastSuccess(message);
      announce(message);
    },
    [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent, reducedMotion, setActiveAnalysisResultLayers, upsertMapEvidenceArtifact],
  );

  const handleExecuteMapWorkflow = useCallback(
    (preview: MapWorkflowPreview) => {
      if (!workflowExecutorRef.current) {
        workflowExecutorRef.current = createMapWorkflowWorkerExecutor();
      }
      setWorkflowExecution({ status: "queued", percent: 0, stage: "Queued" });
      announce(`Running ${preview.workflow} workflow in a background worker.`);

      void executeMapWorkflow(preview, workflowContext, workflowExecutorRef.current, {
        onProgress: (update) => setWorkflowExecution(update),
        registerHandle: (handle) => {
          workflowExecutionHandleRef.current = handle;
        },
      })
        .then((result) => {
          workflowExecutionHandleRef.current = null;
          setWorkflowExecution(null);
          handleApplyMapWorkflow(result);
        })
        .catch((error: unknown) => {
          workflowExecutionHandleRef.current = null;
          if (isBackgroundTaskCancelledError(error)) {
            setWorkflowExecution(null);
            toastInfo(`${preview.workflow} workflow cancelled.`);
            announce(`${preview.workflow} workflow cancelled.`);
            return;
          }
          const messageText = error instanceof Error ? error.message : "Worker geometry execution failed.";
          setWorkflowExecution({ status: "failed", percent: 0, error: messageText });
          toastWarning(`Workflow failed: ${messageText}`);
          announce(`Workflow failed: ${messageText}`);
        });
    },
    [announce, handleApplyMapWorkflow, workflowContext],
  );

  const handleCancelMapWorkflow = useCallback(() => {
    workflowExecutionHandleRef.current?.cancel();
    workflowExecutionHandleRef.current = null;
    setWorkflowExecution(null);
  }, []);

  const handleSaveWorkflowReport = useCallback(
    (report: MapWorkflowReportItem) => {
      setWorkflowReportItems((current) => {
        const filtered = current.filter((item) => item.id !== report.id);
        return [...filtered, report];
      });
      recordMapReviewEvent({
        type: "report-handoff",
        status: "recorded",
        timestamp: report.createdAt,
        title: `Workflow report item saved: ${report.title}`,
        summary: `${report.workflow} workflow report item references derived layer ${report.derivedLayerId}.`,
        layerIds: [report.derivedLayerId, ...report.sourceLayerIds],
        reportItemIds: [report.id],
        details: {
          workflow: report.workflow,
          parameters: report.parameters,
          metrics: report.metrics,
          caveats: report.caveats,
        },
      });
      toastInfo(`Saved ${report.title} as a report item.`);
      announce(`${report.title} saved as report item.`);
    },
    [announce, recordMapReviewEvent],
  );

  const handleDispatchMapCodeArtifact = useCallback(async (request: MapCodeArtifactRequest) => {
    try {
      const result = await dispatchMapCodeArtifactRequest(request);
      upsertMapEvidenceArtifact(request.evidenceArtifact);
      recordMapReviewEvent({
        type: "action-status",
        status: result.bridgeRouted ? "applied" : "recorded",
        title: `IDE artifact requested: ${request.title}`,
        summary: `${request.kind} opened as ${request.targetFileSuggestion}; evidence ${result.evidenceArtifactId} registered with reference-only provenance.`,
        layerIds: request.layerIds,
        qaIssueIds: request.provenance.qaIssueIds,
        actionIds: [request.requestId],
        details: {
          artifactId: request.artifactId,
          evidenceArtifactId: result.evidenceArtifactId,
          targetFileSuggestion: request.targetFileSuggestion,
          language: request.language,
          bytes: result.bytes,
          bridgeRouted: result.bridgeRouted,
          evidenceEventPublished: result.evidenceEventPublished,
        },
      });
      const message = `${request.targetFileSuggestion} opened in Synapse IDE.`;
      setDispatchFeedback({
        tone: result.bridgeRouted ? "success" : "info",
        title: result.bridgeRouted ? "IDE artifact opened" : "IDE artifact registered",
        description: message,
      });
      toastSuccess(message);
      announce(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Map IDE artifact request failed.";
      recordMapReviewEvent({
        type: "action-status",
        status: "failed",
        title: `IDE artifact failed: ${request.title}`,
        summary: message,
        layerIds: request.layerIds,
        qaIssueIds: request.provenance.qaIssueIds,
        actionIds: [request.requestId],
        details: {
          artifactId: request.artifactId,
          targetFileSuggestion: request.targetFileSuggestion,
          kind: request.kind,
          language: request.language,
        },
      });
      setDispatchFeedback({
        tone: "error",
        title: "IDE artifact failed",
        description: message,
      });
      toastError(message);
      announce(`IDE artifact failed: ${message}`);
    }
  }, [announce, recordMapReviewEvent, upsertMapEvidenceArtifact]);

  const handleExportMapModelToIdeAndUrban = useCallback((result: MapModelRunResult, batchResult: MapModelBatchResult | null) => {
    if (!result.manifest || !result.manifestHash || !result.finalOutputLayer) {
      announce("Run the model successfully before exporting it.");
      return;
    }
    const mapState = useMapExplorerStore.getState();
    const currentContextSummary = selectMapExplorerContextSummary(mapState);
    const request = buildMapModelCodeArtifactRequest({
      result,
      contextSummary: currentContextSummary,
      overlayLayers: mapState.overlayLayers,
      mapEvidenceArtifacts: mapState.mapEvidenceArtifacts,
      scientificQA: mapState.scientificQA,
    });
    void handleDispatchMapCodeArtifact(request);

    const sourceLayers = result.manifest.sourceLayerIds
      .map((layerId) => mapState.overlayLayers.find((layer) => layer.id === layerId))
      .filter((layer): layer is OverlayLayerConfig => layer !== undefined);
    const runtimeMode = sourceLayers.some((layer) => layer.sourceKind === "demo") ? "demo" : "unknown";
    const handoff = sendMapContextToUrban({
      contextSummary: currentContextSummary,
      overlayLayers: mapState.overlayLayers,
      drawnFeatures: mapState.drawnFeatures,
      ...(mapState.activeAoiId ? { activeAoiId: mapState.activeAoiId } : {}),
      selectedFeatureIds: mapState.selectedFeatureIds,
      mapEvidenceArtifacts: mapState.mapEvidenceArtifacts,
      scientificQA: mapState.scientificQA,
      requestedLayerId: result.finalOutputLayer.id,
      receiver: (payload) => {
        const applied = applyMapContextToUrban({
          payload,
          modelResult: {
            modelId: result.model.modelId,
            modelTitle: result.model.title,
            manifestId: result.manifest!.manifestId,
            manifestHash: result.manifestHash!,
            workflowId: result.manifest!.workflowId,
            outputLayerId: result.finalOutputLayer!.id,
            sourceLayerIds: result.manifest!.sourceLayerIds,
            stepCount: result.stepRuns.length,
            batchTargetCount: batchResult?.results.length ?? 1,
            runtimeMode,
          },
        });
        return {
          contextId: applied.contextId,
          evidenceArtifactId: applied.evidenceArtifactId,
          recommendationTriggered: applied.recommendationTriggered,
          recommendationReason: applied.recommendationReason,
        };
      },
    });
    if (handoff.status === "blocked") {
      const reason = handoff.disabledReasons[0] ?? "Model result is not eligible for Urban evidence publication.";
      setDispatchFeedback({ tone: "error", title: "Model evidence blocked", description: reason });
      announce(`Model evidence blocked: ${reason}`);
      return;
    }
    setDispatchFeedback({
      tone: "success",
      title: "Model exported and published",
      description: `${result.model.title} opened in Synapse IDE and published to Urban evidence.`,
    });
    announce(`${result.model.title} exported to Synapse IDE and published to Urban evidence.`);
  }, [announce, handleDispatchMapCodeArtifact]);

  const handleOpenLayerInIde = useCallback((layerId: string) => {
    const layer = overlayLayers.find((entry) => entry.id === layerId);
    if (!layer) {
      const message = "Layer is no longer available for IDE handoff.";
      toastWarning(message);
      announce(message);
      return;
    }
    const request = buildSqlQueryRequest({
      contextSummary,
      overlayLayers,
      mapEvidenceArtifacts,
      scientificQA,
      requestedLayerId: layer.id,
    });
    void handleDispatchMapCodeArtifact(request);
  }, [announce, contextSummary, handleDispatchMapCodeArtifact, mapEvidenceArtifacts, overlayLayers, scientificQA]);

  const handleOpenWorkflowScriptInIde = useCallback((preview: MapWorkflowPreview) => {
    const request = buildWorkflowScriptRequest({
      contextSummary,
      overlayLayers,
      mapEvidenceArtifacts,
      scientificQA,
      workflowManifest: preview.manifest,
    });
    void handleDispatchMapCodeArtifact(request);
  }, [contextSummary, handleDispatchMapCodeArtifact, mapEvidenceArtifacts, overlayLayers, scientificQA]);

  const handleOpenMapManifestInIde = useCallback(() => {
    const request = buildMapManifestRequest({
      contextSummary,
      overlayLayers: visiblePublicationLayers.length > 0 ? visiblePublicationLayers : overlayLayers,
      mapEvidenceArtifacts,
      scientificQA,
      publicationReadiness: mapPublicationReadiness,
      compositionOptions: mapCompositionOptions,
    });
    void handleDispatchMapCodeArtifact(request);
  }, [contextSummary, handleDispatchMapCodeArtifact, mapCompositionOptions, mapEvidenceArtifacts, mapPublicationReadiness, overlayLayers, scientificQA, visiblePublicationLayers]);

  const handleOpenExportNoteInIde = useCallback(() => {
    const request = buildExportPackageNoteRequest({
      contextSummary,
      overlayLayers: visiblePublicationLayers.length > 0 ? visiblePublicationLayers : overlayLayers,
      mapEvidenceArtifacts,
      scientificQA,
      publicationReadiness: mapPublicationReadiness,
      compositionOptions: mapCompositionOptions,
    });
    void handleDispatchMapCodeArtifact(request);
  }, [contextSummary, handleDispatchMapCodeArtifact, mapCompositionOptions, mapEvidenceArtifacts, mapPublicationReadiness, overlayLayers, scientificQA, visiblePublicationLayers]);

  const handleTogglePinMode = useCallback(() => {
    const next = pinMode ? null : "pin";
    setActiveTool(next as import("../mapTypes").MapToolId);
    announce(next ? "Pin mode enabled — click map to add pins" : "Pin mode disabled");
  }, [pinMode, setActiveTool, announce]);

  const handleToggleAnnotationMode = useCallback(() => {
    const next = annotationMode ? null : "annotate";
    setActiveTool(next as import("../mapTypes").MapToolId);
    if (next) {
      setActiveDrawTool(null);
      setActiveMeasureTool(null);
      setShowSidebar(false);
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
      setWorkspaceView("explore");
      announce("Text annotation tool enabled");
    } else {
      announce("Text annotation tool disabled");
    }
  }, [annotationMode, announce, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const handleDeactivateAnnotationMode = useCallback(() => {
    if (useMapExplorerStore.getState().activeTool === "annotate") {
      setActiveTool(null);
    }
  }, [setActiveTool]);

  const handleOpenPointSymbology = useCallback((layerId: string) => {
    setPointSymbologyLayerId((current) => {
      const next = current === layerId ? null : layerId;
      if (next) {
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        announce(`Point symbology panel opened for ${overlayLayers.find((layer) => layer.id === layerId)?.name ?? layerId}`);
      } else {
        announce("Point symbology panel closed");
      }
      return next;
    });
  }, [announce, closeRightDockPanels, overlayLayers]);

  const handleAnalysisRecommendationAction = useCallback((recommendation: MapAnalysisRecommendation) => {
    recordMapReviewEvent(buildRecommendationActionReviewEvent(recommendation, buildCurrentReviewSnapshot()));
    const { action } = recommendation;
    if (action.type === "run-selection-statistics") {
      handleRunSelectionStatistics();
      return;
    }

    if (action.type === "open-flow") {
      const payload = dispatchRecommendationFlow({
        recommendation,
        flowId: action.flowId,
        overlayLayers,
        mapContextSummary: contextSummary,
        urbanContext: activeUrbanContext,
      });

      recordMapReviewEvent({
        type: "analysis-dispatch",
        status: "previewed",
        title: `Recommendation dispatched: ${recommendation.title}`,
        summary: `Explicit recommendation dispatch queued ${action.flowId.replace(/_/g, " ")} with ${payload.layerReferences?.length ?? 0} lightweight layer reference(s) and map context ${payload.contextSummary?.contextId ?? "none"}.`,
        layerIds: payload.layerIds,
        recommendationIds: [recommendation.id],
        actionIds: [payload.requestId],
        details: {
          requestId: payload.requestId,
          flowId: action.flowId,
          readinessStatus: recommendation.readiness.status,
          readinessWarnings: recommendation.readiness.warnings,
          readinessBlockers: recommendation.readiness.blockers,
          reasonKinds: recommendation.reasons.map((reason) => reason.kind),
          contextId: payload.contextSummary?.contextId ?? null,
          activeAoiId: payload.contextSummary?.activeAoiId ?? null,
          selectedFeatureCount: payload.contextSummary?.selectedFeatureCount ?? 0,
          layerReferenceCount: payload.layerReferences?.length ?? 0,
          urbanActiveFlowId: payload.contextSummary?.urbanContext.activeFlowId ?? null,
          explicit: payload.audit?.explicit ?? true,
          reversible: payload.audit?.reversible ?? true,
        },
      });
      setDispatchFeedback({
        tone: "success",
        title: `${recommendation.title} opened`,
        description: `Recommendation routed to the ${action.flowId.replace(/_/g, " ")} workflow with ${payload.layerReferences?.length ?? 0} layer reference(s) attached.`,
      });
      toastInfo(`${recommendation.title} routed to workflow.`);
      announce(`${recommendation.title} routed to workflow`);
      return;
    }

    const openLayerId = action.layerId ?? recommendation.layerIds[0] ?? null;
    const layerName = openLayerId
      ? overlayLayers.find((layer) => layer.id === openLayerId)?.name ?? openLayerId
      : "current map";

    switch (action.panel) {
      case "scientific-qa":
        openScientificQAPanel();
        break;
      case "choropleth":
        setWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowChoroplethPanel(true);
        announce(`Choropleth recommendation opened for ${layerName}`);
        break;
      case "cluster":
        setWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowClusterViz(true);
        announce(`LISA recommendation opened for ${layerName}`);
        break;
      case "hotspot":
        setWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowHotSpotViz(true);
        announce(`Hot spot recommendation opened for ${layerName}`);
        break;
      case "emerging-hotspot":
        setWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowEmergingHotSpotViz(true);
        announce(`Emerging hot spot recommendation opened for ${layerName}`);
        break;
      case "point-symbology":
        if (!openLayerId) {
          toastInfo("Select or reveal a point layer before opening point symbology.");
          return;
        }
        setWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setPointSymbologyMode(action.symbologyMode ?? "heatmap");
        setPointSymbologyLayerId(openLayerId);
        announce(`Point symbology recommendation opened for ${layerName}`);
        break;
      case "voxcity-overlay":
        setWorkspaceView("explore");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowWorkflowDrawer(false);
        setShowVoxCityOverlay(true);
        announce("VoxCity recommendation opened");
        break;
      case "workflow":
        setWorkspaceView("explore");
        closeRightDockPanels();
        setShowScientificQAPanel(false);
        setShowNLQueryPanel(false);
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(true);
        announce(`Workflow recommendation opened for ${layerName}`);
        break;
      case "nl-query":
        setWorkspaceView("explore");
        closeRightDockPanels();
        setShowScientificQAPanel(false);
        setPointSymbologyLayerId(null);
        setShowChoroplethPanel(false);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowEmergingHotSpotViz(false);
        setShowVoxCityOverlay(false);
        setShowWorkflowDrawer(false);
        setShowNLQueryPanel(true);
        announce("Natural-language map query recommendation opened");
        break;
      case "layer-panel":
        setWorkspaceView("explore");
        setShowLayerPanel(true);
        setDispatchFeedback({
          tone: "info",
          title: `${recommendation.title} ready`,
          description: `Layer panel opened for ${layerName}; inspect provenance, QA, and styling before applying downstream analysis.`,
        });
        announce(`Layer panel opened for ${layerName}`);
        break;
      default:
        break;
    }
  }, [activeUrbanContext, announce, buildCurrentReviewSnapshot, closeRightDockPanels, contextSummary, handleRunSelectionStatistics, openScientificQAPanel, overlayLayers, recordMapReviewEvent]);

  const handleApplyCartographyRecommendation = useCallback((recommendationId: string) => {
    const recommendation = cartographyReviewState.recommendations.find((entry) => entry.id === recommendationId);
    if (!recommendation) {
      toastWarning("This cartography recommendation is no longer available for the current map state.");
      return;
    }
    if (!recommendation.proposal) {
      toastInfo("This recommendation is informational and has no automatic style change.");
      return;
    }

    const layer = overlayLayers.find((entry) => entry.id === recommendation.layerId);
    if (!layer) {
      toastWarning("The affected layer is no longer available.");
      return;
    }

    const nextLayer = applyCartographyRecommendationToLayer(layer, recommendation);
    addOverlayLayer(nextLayer);
    setCartographyUndoStack((current) => [
      ...current.slice(-9),
      {
        recommendationId,
        layerId: layer.id,
        label: recommendation.proposal?.reversibleLabel ?? recommendation.title,
        beforeLayer: layer,
      },
    ]);
    setDismissedCartographyRecommendationIds((current) => {
      const next = new Set(current);
      next.add(recommendationId);
      return next;
    });
    recordMapReviewEvent({
      type: "action-status",
      status: "applied",
      title: `Cartography recommendation applied: ${recommendation.title}`,
      summary: `${recommendation.proposal.reversibleLabel} was applied to ${layer.name}.`,
      layerIds: [layer.id],
      actionIds: [recommendation.id],
      recommendationIds: [recommendation.id],
      undo: {
        available: true,
        actionLabel: recommendation.proposal.reversibleLabel,
      },
      details: {
        severity: recommendation.severity,
        rationale: recommendation.rationale,
      },
    });
    toastSuccess(`Applied cartography recommendation for ${layer.name}.`);
    announce(`Applied cartography recommendation for ${layer.name}`);
  }, [addOverlayLayer, announce, cartographyReviewState.recommendations, overlayLayers, recordMapReviewEvent]);

  const handleDismissCartographyRecommendation = useCallback((recommendationId: string) => {
    setDismissedCartographyRecommendationIds((current) => {
      const next = new Set(current);
      next.add(recommendationId);
      return next;
    });
    const recommendation = cartographyReviewState.recommendations.find((entry) => entry.id === recommendationId);
    recordMapReviewEvent({
      type: "action-status",
      status: "rejected",
      title: `Cartography recommendation dismissed: ${recommendation?.title ?? recommendationId}`,
      summary: "Analyst dismissed a cartographic recommendation without mutating layer styling.",
      layerIds: recommendation?.layerId ? [recommendation.layerId] : [],
      actionIds: [recommendationId],
      recommendationIds: [recommendationId],
      details: {
        severity: recommendation?.severity ?? "unknown",
      },
    });
    announce("Cartography recommendation dismissed");
  }, [announce, cartographyReviewState.recommendations, recordMapReviewEvent]);

  const handleUndoCartographyRecommendation = useCallback(() => {
    const lastEntry = cartographyUndoStack[cartographyUndoStack.length - 1];
    if (!lastEntry) {
      toastInfo("There is no cartography style change to undo.");
      return;
    }

    addOverlayLayer(lastEntry.beforeLayer);
    setCartographyUndoStack((current) => current.slice(0, -1));
    setDismissedCartographyRecommendationIds((current) => {
      const next = new Set(current);
      next.delete(lastEntry.recommendationId);
      return next;
    });
    recordMapReviewEvent({
      type: "action-status",
      status: "undone",
      title: `Cartography recommendation undone: ${lastEntry.label}`,
      summary: `Restored prior style for ${lastEntry.layerId}.`,
      layerIds: [lastEntry.layerId],
      actionIds: [lastEntry.recommendationId],
      recommendationIds: [lastEntry.recommendationId],
      undo: {
        available: false,
        outcome: "Previous layer style restored.",
      },
    });
    toastInfo(`Undid ${lastEntry.label}.`);
    announce(`Undid cartography recommendation for ${lastEntry.layerId}`);
  }, [addOverlayLayer, announce, cartographyUndoStack, recordMapReviewEvent]);

  const handleShowCartographyDetails = useCallback((recommendation: MapCartographyRecommendation) => {
    announce(`Cartography details opened for ${recommendation.title}`);
  }, [announce]);

  const handleApplyLayerStyle = useCallback((layerId: string, update: LayerStyleUpdate) => {
    const layer = overlayLayers.find((entry) => entry.id === layerId);
    if (!layer) {
      toastWarning("The styled layer is no longer available.");
      return;
    }

    const outcome = applyMapCommand({
      kind: "layer.style",
      layerId,
      style: update.style,
      opacity: update.opacity,
      metadataPatch: update.metadataPatch,
      styleMode: update.legendSpec.mode,
      styleHash: update.legendSpec.styleHash,
      legendEntryCount: update.legendSpec.entries.length,
      noDataClass: update.legendSpec.noData.enabled,
      warnings: update.warnings,
    }, buildMapActionEffects());
    recordMapReviewEvent(outcome.reviewEvent);
    if (outcome.result.status !== "applied") {
      toastWarning(`Layer style blocked: ${outcome.preflight.blockers.join(" ")}`);
      announce(`Layer style blocked for ${layer.name}`);
      return;
    }
    recordMapActionHistory({
      commandId: outcome.result.commandId,
      kind: outcome.result.kind,
      title: outcome.reviewEvent.title,
      reviewEventId: outcome.result.reviewEventId ?? outcome.result.commandId,
      appliedAt: outcome.result.createdAt,
      revertable: outcome.result.revertable,
      reverted: false,
      ...(outcome.revertToken ? { revertToken: outcome.revertToken } : {}),
      ...(outcome.redoToken ? { redoToken: outcome.redoToken } : {}),
    });
    toastSuccess(`Applied ${update.legendSpec.mode} style to ${layer.name}.`);
    announce(`Applied style and serialized legend for ${layer.name}. Undo is available.`);
  }, [announce, buildMapActionEffects, overlayLayers, recordMapActionHistory, recordMapReviewEvent]);

  const handleReRunAnalysisLayer = useCallback(async (layerId: string, rerunToken?: string | null) => {
    if (!rerunToken) {
      toastInfo("No re-run handler is registered for this analysis result.");
      announce("Re-run is unavailable for this analysis result");
      return;
    }

    if (!hasAnalysisRerun(rerunToken)) {
      toastInfo("The original analysis runner is no longer available in this session.");
      announce("Re-run is unavailable for this analysis result");
      return;
    }

    setRerunningAnalysisToken(rerunToken);
    try {
      const rerunResult = await rerunAnalysisResult(rerunToken);
      if (!rerunResult) {
        toastInfo("The analysis did not return a refreshed map layer.");
        announce("Analysis re-run completed without a map layer update");
        return;
      }

      const runMetadata = rerunResult.layer.metadata?.analysisResult;
      const nextOutput = createAnalysisMapOutput(rerunResult);
      const existingRun = completedRuns.find((run) =>
        run.mapOutputs.some((output) => matchesSpatialStatsOutput(output, layerId, rerunToken, runMetadata?.runId)),
      );
      const persistedRunId = existingRun?.runId ?? runMetadata?.runId;
      const nextMapOutputs = existingRun
        ? replaceSpatialStatsOutput(existingRun.mapOutputs, nextOutput, layerId, rerunToken, runMetadata?.runId)
        : [nextOutput];

      upsertCompletedRun(createAnalysisCompletedRun(rerunResult, {
        flowId: existingRun?.flowId ?? "review",
        mapOutputs: nextMapOutputs,
        ...(persistedRunId ? { runId: persistedRunId } : {}),
        ...(existingRun?.insertedAt ? { insertedAt: existingRun.insertedAt } : {}),
        ...(existingRun?.label ? { label: existingRun.label } : {}),
        ...(existingRun?.paragraph ? { paragraph: existingRun.paragraph } : {}),
        ...(existingRun?.paragraphPreview ? { paragraphPreview: existingRun.paragraphPreview } : {}),
        ...(existingRun?.paragraphFull ? { paragraphFull: existingRun.paragraphFull } : {}),
        ...(existingRun?.chartOutputs ? { chartOutputs: existingRun.chartOutputs } : {}),
        ...(existingRun?.dataOutputs ? { dataOutputs: existingRun.dataOutputs } : {}),
      }));

      addOverlayLayer(rerunResult.layer);
      upsertMapEvidenceArtifact(rerunResult.evidenceArtifact);
      toastSuccess(`Re-ran ${rerunResult.layer.name}.`);
      announce(`Analysis result refreshed for ${rerunResult.layer.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis re-run failed.";
      toastError(message);
      announce(`Analysis re-run failed: ${message}`);
    } finally {
      setRerunningAnalysisToken(null);
    }
  }, [addOverlayLayer, announce, completedRuns, upsertCompletedRun, upsertMapEvidenceArtifact]);

  /* ---- Drawing handlers ---- */
  const handleSetDrawTool = useCallback(
    (tool: DrawToolId | null) => {
      setActiveDrawTool(tool);
      // When activating draw, deactivate pin mode
      if (tool) {
        setActiveTool(null);
        setActiveMeasureTool(null);
        setShowSidebar(false);
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowDrawPanel(true);
        setShowMeasurePanel(false);
        setWorkspaceView("analyze");
        announce(`Drawing tool: ${tool}`);
      } else {
        announce("Drawing tool deactivated");
      }
    },
    [announce, closeFloatingRightPanels, setActiveDrawTool, setActiveMeasureTool, setActiveTool],
  );

  const handleCancelDraw = useCallback(() => {
    setActiveDrawTool(null);
  }, [setActiveDrawTool]);

  const handleToggleDrawPanel = useCallback(() => {
    setShowDrawPanel((prev) => {
      if (!prev) {
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowSidebar(false);
        setShowMeasurePanel(false);
      }
      announce(!prev ? "Drawings panel opened" : "Drawings panel closed");
      return !prev;
    });
  }, [announce, closeFloatingRightPanels]);

  /* ---- Measurement handlers ---- */
  const handleSetMeasureTool = useCallback(
    (tool: MeasureToolId | null) => {
      setActiveMeasureTool(tool);
      // Deactivate pin mode and draw tool when measuring
      if (tool) {
        setActiveTool(null);
        setActiveDrawTool(null);
        setShowSidebar(false);
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowMeasurePanel(true);
        setShowDrawPanel(false);
        setWorkspaceView("analyze");
        announce(`Measure tool: ${tool === "measure-distance" ? "distance" : "area"}`);
      } else {
        announce("Measure tool deactivated");
      }
    },
    [announce, closeFloatingRightPanels, setActiveDrawTool, setActiveMeasureTool, setActiveTool],
  );

  const handleCancelMeasure = useCallback(() => {
    setActiveMeasureTool(null);
  }, [setActiveMeasureTool]);

  const handleToggleMeasurePanel = useCallback(() => {
    setShowMeasurePanel((prev) => {
      if (!prev) {
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowSidebar(false);
        setShowDrawPanel(false);
      }
      announce(!prev ? "Measurements panel opened" : "Measurements panel closed");
      return !prev;
    });
  }, [announce, closeFloatingRightPanels]);

  /* ---- Navigation ---- */
  const flyTo = useCallback((lng: number, lat: number, z = 14) => {
    if (reducedMotion) {
      mapInstanceRef.current?.jumpTo({ center: [lng, lat], zoom: z });
    } else {
      mapInstanceRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 1500 });
    }
  }, [reducedMotion]);

  const fitToBounds = useCallback((bounds: [number, number, number, number]) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const [minLng, minLat, maxLng, maxLat] = bounds;
    if (minLng === maxLng && minLat === maxLat) {
      flyTo(minLng, minLat, Math.max(map.getZoom(), 14));
      return;
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 64,
        duration: reducedMotion ? 0 : 900,
        essential: true,
      },
    );
  }, [flyTo, reducedMotion]);

  const handleFocusLayer = useCallback((layerId: string) => {
    const layer = overlayLayers.find((entry) => entry.id === layerId);
    const bounds = layer?.metadata?.bounds ?? layer?.metadata?.geometrySummary?.bounds ?? null;
    if (!layer || !bounds) {
      announce("Layer extent metadata is unavailable; cannot focus the map on this layer.");
      return;
    }

    fitToBounds(bounds);
    announce(`Map focused on ${layer.name}`);
  }, [announce, fitToBounds, overlayLayers]);

  const handleFocusAttributeFeature = useCallback((feature: AttrFeature) => {
    const bounds = getFeatureBounds(feature);
    if (!bounds) {
      announce("Feature extent is unavailable; cannot focus the map on this table row.");
      return;
    }
    fitToBounds(bounds);
  }, [announce, fitToBounds]);

  const handleHotSpotDispatch = useCallback(async (coordinate: [number, number]) => {
    if (isRunningQuickHotSpot) {
      return;
    }

    const origin = { lng: coordinate[0], lat: coordinate[1] };
    const analysisBounds = restrictToMapView && currentMapBounds
      ? currentMapBounds
      : buildBufferedPointBounds(origin, 1600);
    const prioritizedLayerIds = new Set(activeAnalysisResultLayerIds);
    const candidateLayers = [...overlayLayers]
      .filter(isPolygonLayerCandidate)
      .sort((left, right) => {
        const leftPriority = prioritizedLayerIds.has(left.id) ? 0 : 1;
        const rightPriority = prioritizedLayerIds.has(right.id) ? 0 : 1;
        return leftPriority - rightPriority;
      });

    setIsRunningQuickHotSpot(true);
    setDispatchFeedback({
      tone: "busy",
      title: "Running hot spot analysis",
      description: "Resolving the nearest polygon layer and numeric field for a quick Getis-Ord Gi* run.",
    });

    try {
      let resolvedLayer: { layer: OverlayLayerConfig; featureCollection: GeoJSON.FeatureCollection; numericField: NumericFieldInfo } | null = null;

      for (const layer of candidateLayers) {
        const featureCollection = await resolveFeatureCollection(layer);
        if (!hasPolygonGeometry(featureCollection)) {
          continue;
        }

        const clippedCollection = filterFeatureCollectionToBounds(featureCollection, analysisBounds);
        if (!hasPolygonGeometry(clippedCollection)) {
          continue;
        }

        const numericFields = collectNumericFields(clippedCollection);
        if (numericFields.length === 0) {
          continue;
        }

        resolvedLayer = {
          layer,
          featureCollection: clippedCollection,
          numericField: numericFields[0]!,
        };
        break;
      }

      if (!resolvedLayer) {
        throw new Error("No visible polygon layer with numeric attributes intersects the selected analysis window.");
      }

      const qaGate = evaluateAnalysisQAGate(scientificQA, {
        layerIds: [resolvedLayer.layer.id],
        requiredGeometryTypes: ["polygon"],
        workflowLabel: "Quick hot spot analysis",
      });
      if (qaGate.blocked) {
        openScientificQAPanel();
        throw new Error(qaGate.message);
      }
      if (qaGate.warnings.length > 0) {
        const warning = qaGate.warnings[0] ?? "Scientific QA warnings are present on the selected analysis input.";
        setDispatchFeedback({
          tone: "info",
          title: "QA warning on analysis input",
          description: warning,
        });
        toastWarning(warning);
      }

      const executionIdentity = createSpatialStatsExecutionIdentity(
        "hotspot",
        resolvedLayer.layer.id,
        resolvedLayer.numericField.name,
      );

      const buildLatestResult = async () => {
        const latestLayer = useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === resolvedLayer?.layer.id);
        if (!latestLayer) {
          throw new Error("The selected source layer is no longer available.");
        }

        const latestCollection = filterFeatureCollectionToBounds(await resolveFeatureCollection(latestLayer), analysisBounds);
        return (await executeHotSpotSpatialStatsAsync({
          sourceLayer: latestLayer,
          featureCollection: latestCollection,
          valueField: resolvedLayer.numericField.name,
          weightsMethod: "queen",
          significanceThreshold: 0.05,
          selfWeight: true,
          runId: executionIdentity.runId,
          layerId: executionIdentity.layerId,
        }).promise).adaptedResult;
      };

      const execution = await executeHotSpotSpatialStatsAsync({
        sourceLayer: resolvedLayer.layer,
        featureCollection: resolvedLayer.featureCollection,
        valueField: resolvedLayer.numericField.name,
        weightsMethod: "queen",
        significanceThreshold: 0.05,
        selfWeight: true,
        runId: executionIdentity.runId,
        layerId: executionIdentity.layerId,
      }).promise;

      const rerunnableResult = attachSpatialStatsRerun(
        execution.adaptedResult,
        buildLatestResult,
        `${executionIdentity.layerId}::rerun`,
      );

      addOverlayLayer(rerunnableResult.layer);
      upsertMapEvidenceArtifact(rerunnableResult.evidenceArtifact);
      upsertCompletedRun(createSpatialStatsCompletedRun(rerunnableResult, { flowId: "review" }));
      setActiveAnalysisResultLayers([rerunnableResult.layer.id]);
      const resultBounds = rerunnableResult.layer.metadata?.bounds ?? getFeatureCollectionBounds(resolvedLayer.featureCollection);
      if (resultBounds) {
        fitToBounds(resultBounds);
      }
      const message = `Published ${rerunnableResult.layer.name} using ${resolvedLayer.layer.name} · ${resolvedLayer.numericField.name}.`;
      setDispatchFeedback({ tone: "success", title: "Hot spot result published", description: message });
      recordMapReviewEvent({
        type: "analysis-dispatch",
        status: "applied",
        title: `Hot spot analysis published: ${rerunnableResult.layer.name}`,
        summary: message,
        layerIds: [resolvedLayer.layer.id, rerunnableResult.layer.id],
        details: {
          engine: "Getis-Ord Gi*",
          valueField: resolvedLayer.numericField.name,
          sourceLayerId: resolvedLayer.layer.id,
          resultLayerId: rerunnableResult.layer.id,
          runId: rerunnableResult.layer.metadata?.analysisResult?.runId ?? null,
          analysisBounds,
        },
      });
      toastSuccess(message);
      announce("Hot spot dispatch completed");
    } catch (error) {
      const message = isBackgroundTaskCancelledError(error)
        ? "Hot spot analysis was cancelled before completion."
        : error instanceof Error
          ? error.message
          : "Hot spot analysis failed.";
      setDispatchFeedback({ tone: "error", title: "Hot spot analysis failed", description: message });
      recordMapReviewEvent({
        type: "analysis-dispatch",
        status: "failed",
        title: "Hot spot analysis failed",
        summary: message,
        layerIds: candidateLayers.map((layer) => layer.id),
        details: {
          analysisBounds,
          restrictToView: restrictToMapView,
        },
      });
      toastError(message);
      announce(message);
    } finally {
      setIsRunningQuickHotSpot(false);
    }
  }, [activeAnalysisResultLayerIds, addOverlayLayer, announce, currentMapBounds, fitToBounds, isRunningQuickHotSpot, openScientificQAPanel, overlayLayers, recordMapReviewEvent, restrictToMapView, scientificQA, setActiveAnalysisResultLayers, upsertCompletedRun, upsertMapEvidenceArtifact]);

  const handleMapNLQueryProposalGenerated = useCallback((preview: MapNLQueryPreview) => {
    if (recordedNLQueryProposalIdsRef.current.has(preview.id)) {
      return;
    }
    recordedNLQueryProposalIdsRef.current.add(preview.id);
    recordMapReviewEvent(buildMapAIProposalReviewEvent(preview.aiGuardrail, {
      proposalId: preview.id,
      title: `Map query preview: ${preview.intentPreview.intentLabel}`,
      layerIds: preview.sourceLayers.map((layer) => layer.id),
      actionIds: [preview.id],
      details: buildMapNLQueryAuditDetails(preview, {
        decision: "proposed",
        mapMutationApplied: false,
      }),
    }));
  }, [recordMapReviewEvent]);

  const handleMapNLQueryPreviewDecision = useCallback((preview: MapNLQueryPreview, decision: "accepted" | "rejected") => {
    recordMapReviewEvent({
      type: "query-run",
      status: decision === "accepted" ? "previewed" : "rejected",
      title: decision === "accepted"
        ? `AI-proposed map query confirmed: ${preview.intentPreview.intentLabel}`
        : `AI-proposed map query rejected: ${preview.intentPreview.intentLabel}`,
      summary: decision === "accepted"
        ? `Analyst confirmed an AI-proposed NL query preview for ${preview.sourceLayers.length} affected layer(s); no map layer has been created yet.`
        : "Analyst rejected an AI-proposed NL query preview without mutating map state.",
      layerIds: preview.sourceLayers.map((layer) => layer.id),
      actionIds: [preview.id],
      details: buildMapNLQueryAuditDetails(preview, {
        decision,
        mapMutationApplied: false,
      }),
    });
  }, [recordMapReviewEvent]);

  const handleRunMapNLQuery = useCallback(async (preview: MapNLQueryPreview, options: { confirmed: boolean }) => {
    if (isRunningMapNLQuery) {
      return;
    }

    if (!options.confirmed) {
      const reason = "AI-proposed map query apply requires human confirmation.";
      recordMapReviewEvent({
        type: "query-run",
        status: "rejected",
        title: "Map query execution blocked: confirmation required",
        summary: reason,
        layerIds: preview.sourceLayers.map((layer) => layer.id),
        actionIds: [preview.id],
        details: buildMapNLQueryAuditDetails(preview, {
          decision: "confirmation-required",
          mapMutationApplied: false,
        }),
      });
      toastWarning(reason);
      announce(reason);
      return;
    }

    if (!preview.canRun) {
      const reason = preview.blockers[0] ?? "Map query preview is not executable.";
      recordMapReviewEvent({
        type: "query-run",
        status: "rejected",
        title: "Map query execution blocked",
        summary: reason,
        layerIds: preview.sourceLayers.map((layer) => layer.id),
        actionIds: [preview.id],
        details: buildMapNLQueryAuditDetails(preview, {
          decision: "execution-blocked",
          mapMutationApplied: false,
        }),
      });
      toastWarning(reason);
      announce(reason);
      return;
    }

    setIsRunningMapNLQuery(true);
    setDispatchFeedback({
      tone: "busy",
      title: "Running map query",
      description: `Executing reviewed SQL against ${preview.sourceLayers.length} source layer${preview.sourceLayers.length === 1 ? "" : "s"}.`,
    });

    try {
      const result = await executeMapNLQueryPreview(
        preview,
        {
          loadGeoJSON,
          bindTableAlias,
          toGeoJSON,
        },
        { confirmed: options.confirmed },
      );
      addOverlayLayer(result.layer);
      upsertMapEvidenceArtifact(result.adapterResult.evidenceArtifact);
      upsertCompletedRun(createAnalysisCompletedRun(result.adapterResult, { flowId: "review" }));
      setActiveAnalysisResultLayers([result.layer.id]);
      setLastMapNLQuerySummary({
        layerName: result.layer.name,
        featureCount: result.featureCount,
        geometryType: result.geometryType,
        elapsedMs: result.elapsedMs,
        followUpSuggestions: result.followUpSuggestions,
      });
      const resultBounds = result.layer.metadata?.bounds ?? getFeatureCollectionBounds(result.featureCollection);
      if (resultBounds) {
        fitToBounds(resultBounds);
      }
      const message = `Published ${result.layer.name} with ${result.featureCount.toLocaleString()} feature${result.featureCount === 1 ? "" : "s"}.`;
      setDispatchFeedback({ tone: "success", title: "Map query result published", description: message });
      recordMapReviewEvent({
        type: "query-run",
        status: "applied",
        title: `Map query published: ${result.layer.name}`,
        summary: `${message} Scope: ${preview.scopeLabel}; execution mode: ${preview.modeLabel}.`,
        layerIds: [result.layer.id, ...preview.sourceLayers.map((layer) => layer.id)],
        actionIds: [preview.id],
        details: buildMapNLQueryAuditDetails(preview, {
          decision: "accepted-and-applied",
          mapMutationApplied: true,
          resultLayerId: result.layer.id,
          featureCount: result.featureCount,
          geometryType: result.geometryType,
          elapsedMs: result.elapsedMs,
        }),
      });
      toastSuccess(message);
      announce("Map query completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Map query failed.";
      setDispatchFeedback({ tone: "error", title: "Map query failed", description: message });
      recordMapReviewEvent({
        type: "query-run",
        status: "failed",
        title: "Map query failed",
        summary: message,
        layerIds: preview.sourceLayers.map((layer) => layer.id),
        actionIds: [preview.id],
        details: buildMapNLQueryAuditDetails(preview, {
          decision: "accepted-but-failed",
          mapMutationApplied: false,
          failureReason: message,
        }),
      });
      toastError(message);
      announce(message);
    } finally {
      setIsRunningMapNLQuery(false);
    }
  }, [addOverlayLayer, announce, fitToBounds, isRunningMapNLQuery, recordMapReviewEvent, setActiveAnalysisResultLayers, upsertCompletedRun, upsertMapEvidenceArtifact]);

  const getCurrentViewportState = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return {
        center,
        zoom,
        bearing,
        pitch,
      };
    }

    const mapCenter = map.getCenter();
    return {
      center: [mapCenter.lng, mapCenter.lat] as [number, number],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
  }, [bearing, center, pitch, zoom]);

  const handleSaveBookmark = useCallback((name: string) => {
    const viewport = getCurrentViewportState();
    const bookmark = addMapBookmark({
      name,
      ...viewport,
      layers: overlayLayers.filter((layer) => layer.visible).map((layer) => layer.id),
      activeVisualization: activeAnalysisResultLayerIds[0] ?? null,
    });

    if (!bookmark) {
      const message = `Maximum ${MAP_BOOKMARK_LIMIT} saved views reached.`;
      toastWarning(message);
      announce(message);
      return;
    }

    recordMapReviewEvent({
      type: "bookmark",
      status: "recorded",
      timestamp: bookmark.timestamp,
      title: `Viewport bookmark saved: ${bookmark.name}`,
      summary: `Saved viewport at zoom ${bookmark.zoom.toFixed(2)} with ${bookmark.layers.length} visible layer reference(s).`,
      layerIds: bookmark.layers,
      bookmarkIds: [bookmark.id],
      details: {
        center: bookmark.center,
        zoom: bookmark.zoom,
        bearing: bookmark.bearing,
        pitch: bookmark.pitch,
        activeVisualization: bookmark.activeVisualization ?? null,
      },
    });
    toastSuccess(`Saved map view "${bookmark.name}".`);
    announce(`Saved map view ${bookmark.name}`);
  }, [activeAnalysisResultLayerIds, addMapBookmark, announce, getCurrentViewportState, overlayLayers, recordMapReviewEvent]);

  const handleRestoreBookmark = useCallback((bookmark: MapBookmark) => {
    const restoredBookmark = restoreMapBookmark(bookmark.id) ?? bookmark;
    const map = mapInstanceRef.current;
    const nextView = {
      center: restoredBookmark.center,
      zoom: restoredBookmark.zoom,
      bearing: restoredBookmark.bearing,
      pitch: restoredBookmark.pitch,
    };

    if (restoredBookmark.activeVisualization) {
      setActiveAnalysisResultLayers([restoredBookmark.activeVisualization]);
      setSelectedTemporalLayerId(restoredBookmark.activeVisualization);
    }

    if (map) {
      if (reducedMotion) {
        map.jumpTo(nextView);
      } else {
        map.flyTo({
          ...nextView,
          duration: 900,
          essential: true,
        });
      }
    }

    recordMapReviewEvent({
      type: "bookmark",
      status: "applied",
      timestamp: new Date().toISOString(),
      title: `Viewport bookmark restored: ${restoredBookmark.name}`,
      summary: `Restored bookmark ${restoredBookmark.name} and ${restoredBookmark.layers.length} stored layer visibility reference(s).`,
      layerIds: restoredBookmark.layers,
      bookmarkIds: [restoredBookmark.id],
      details: {
        center: restoredBookmark.center,
        zoom: restoredBookmark.zoom,
        bearing: restoredBookmark.bearing,
        pitch: restoredBookmark.pitch,
        activeVisualization: restoredBookmark.activeVisualization ?? null,
      },
    });
    toastInfo(`Restored map view "${restoredBookmark.name}".`);
    announce(`Restored map view ${restoredBookmark.name}`);
  }, [announce, recordMapReviewEvent, reducedMotion, restoreMapBookmark, setActiveAnalysisResultLayers]);

  const handleRenameBookmark = useCallback((id: string, name: string) => {
    renameMapBookmark(id, name);
    recordMapReviewEvent({
      type: "bookmark",
      status: "recorded",
      title: "Viewport bookmark renamed",
      summary: `Bookmark ${id} renamed to ${name.trim() || "Untitled view"}.`,
      bookmarkIds: [id],
    });
    announce("Saved view renamed");
  }, [announce, recordMapReviewEvent, renameMapBookmark]);

  const handleDeleteBookmark = useCallback((id: string) => {
    removeMapBookmark(id);
    recordMapReviewEvent({
      type: "bookmark",
      status: "undone",
      title: "Viewport bookmark deleted",
      summary: `Bookmark ${id} was removed from the saved view list.`,
      bookmarkIds: [id],
      undo: {
        available: false,
        outcome: "Bookmark removed from current map session.",
      },
    });
    announce("Saved view deleted");
  }, [announce, recordMapReviewEvent, removeMapBookmark]);

  const handleShareBookmark = useCallback((bookmark: MapBookmark, encodedParam: string) => {
    const baseUrl = typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}`;
    const link = `${baseUrl}?mapBookmark=${encodedParam}`;
    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (clipboard?.writeText) {
      void clipboard.writeText(link)
        .then(() => {
          toastSuccess(`Copied link for "${bookmark.name}".`);
          announce("Saved view link copied");
        })
        .catch(() => {
          if (typeof window.prompt === "function") {
            window.prompt("Copy saved view link", link);
          }
          announce("Saved view link prepared");
        });
      return;
    }

    if (typeof window !== "undefined" && typeof window.prompt === "function") {
      window.prompt("Copy saved view link", link);
    }
    announce("Saved view link prepared");
  }, [announce]);

  const handleAddMapAnnotation = useCallback((annotation: Parameters<typeof addMapAnnotation>[0]) => {
    const created = addMapAnnotation(annotation);
    if (created) {
      recordMapReviewEvent({
        type: "annotation",
        status: "recorded",
        timestamp: created.properties.createdAt,
        title: "Map annotation added",
        summary: `Annotation ${created.id} placed at ${created.geometry.coordinates[0].toFixed(5)}, ${created.geometry.coordinates[1].toFixed(5)}.`,
        annotationIds: [created.id],
        details: {
          text: created.properties.text,
          coordinate: created.geometry.coordinates,
          hasLeaderLine: Boolean(created.properties.leaderLine),
          leaderTarget: created.properties.leaderTarget ?? null,
        },
      });
    }
    return created;
  }, [addMapAnnotation, recordMapReviewEvent]);

  const handleUpdateMapAnnotation = useCallback((id: string, patch: Parameters<typeof updateMapAnnotation>[1]) => {
    updateMapAnnotation(id, patch);
    recordMapReviewEvent({
      type: "annotation",
      status: "recorded",
      title: "Map annotation edited",
      summary: `Annotation ${id} style, text, or geometry metadata was updated.`,
      annotationIds: [id],
      details: {
        hasGeometryPatch: Boolean(patch.geometry),
        propertyKeys: Object.keys(patch.properties ?? {}),
      },
    });
  }, [recordMapReviewEvent, updateMapAnnotation]);

  const handleMoveMapAnnotation = useCallback((id: string, coordinate: [number, number]) => {
    moveMapAnnotation(id, coordinate);
    recordMapReviewEvent({
      type: "annotation",
      status: "applied",
      title: "Map annotation moved",
      summary: `Annotation ${id} moved to ${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}.`,
      annotationIds: [id],
      details: { coordinate },
    });
  }, [moveMapAnnotation, recordMapReviewEvent]);

  const handleRemoveMapAnnotation = useCallback((id: string) => {
    removeMapAnnotation(id);
    recordMapReviewEvent({
      type: "annotation",
      status: "undone",
      title: "Map annotation removed",
      summary: `Annotation ${id} was removed from the map session.`,
      annotationIds: [id],
      undo: {
        available: false,
        outcome: "Annotation removed from current map session.",
      },
    });
  }, [recordMapReviewEvent, removeMapAnnotation]);

  const applyProjectSnapshot = useCallback((snapshot: MapProjectSnapshot) => {
    isRestoringProjectRef.current = true;

    /* If an explicit user-driven fit-bounds request is in effect for this
       open cycle (e.g. an Urban Analytics study-area selection), the
       project's stored viewport must NOT override it. We still restore the
       project's overlays, pins, bookmarks, annotations, and drawn features
       so the analytical context is intact, but the viewport portion is
       skipped both at the store level and on the live map instance. */
    const explicitFit = useMapExplorerStore.getState().lastExplicitFitRequest;
    const skipViewportRestore = explicitFit !== null;

    restoreProjectState({
      viewport: snapshot.viewport,
      activeBaseLayer: snapshot.activeBaseLayer,
      pins: snapshot.pins,
      bookmarks: snapshot.bookmarks,
      annotations: snapshot.annotations,
      drawnFeatures: snapshot.drawnFeatures,
      overlayLayers: getRestorableOverlayLayers(snapshot),
      sourceHandles: snapshot.sourceHandles,
      measurements: [],
      skipViewport: skipViewportRestore,
    });

    if (!skipViewportRestore) {
      const map = mapInstanceRef.current;
      if (map) {
        const nextView = {
          center: snapshot.viewport.center,
          zoom: snapshot.viewport.zoom,
          bearing: snapshot.viewport.bearing,
          pitch: snapshot.viewport.pitch,
        };

        if (reducedMotion) {
          map.jumpTo(nextView);
        } else {
          map.easeTo({
            ...nextView,
            duration: 700,
            essential: true,
          });
        }
      }
    }

    window.setTimeout(() => {
      isRestoringProjectRef.current = false;
    }, 0);
  }, [reducedMotion, restoreProjectState]);

  const handleProjectSave = useCallback(async (projectIdOverride?: string | null, options?: {
    silent?: boolean;
    reason?: "manual" | "autosave" | "project-switch";
  }) => {
    const projectId = projectIdOverride ?? selectedProjectId;
    if (!projectId) {
      if (!options?.silent) {
        toastInfo("Select a project before saving map state.");
      }
      return false;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setIsSavingProject(true);
    try {
      const result = await saveProjectMapState({
        projectId,
        activeBaseLayer,
        viewport: getCurrentViewportState(),
        pins,
        bookmarks,
        annotations,
        drawnFeatures,
        overlayLayers,
        sourceHandles,
      });

      setLastSavedAt(result.snapshot.savedAt);

      if (result.quota.warning) {
        const now = Date.now();
        const warningKey = `${projectId}:${Math.floor(result.quota.projectedPercentUsed * 10)}`;
        const previousWarning = quotaWarningShownRef.current;
        const shouldShowQuotaWarning = !previousWarning
          || previousWarning.key !== warningKey
          || (!options?.silent && now - previousWarning.timestamp > MAP_QUOTA_WARNING_NOTICE_COOLDOWN_MS);
        if (shouldShowQuotaWarning) {
          quotaWarningShownRef.current = { key: warningKey, timestamp: now };
          toastWarning(
            `Map storage is ${Math.round(result.quota.projectedPercentUsed * 100)}% full. Further saves may fail soon.`,
          );
        }
      } else {
        quotaWarningShownRef.current = null;
      }

      if (!options?.silent) {
        toastSuccess(
          `Saved ${result.persistedFeatureCount.toLocaleString()} map feature${result.persistedFeatureCount === 1 ? "" : "s"} to project ${projectId}.`,
        );
        recordMapReviewEvent({
          type: "snapshot",
          status: "recorded",
          timestamp: result.snapshot.savedAt,
          title: "Project map state saved",
          summary: `Persisted map viewport, layers, drawings, bookmarks, annotations, and ${result.persistedFeatureCount.toLocaleString()} feature reference(s) to project ${projectId}.`,
          layerIds: overlayLayers.map((layer) => layer.id),
          details: {
            projectId,
            persistedFeatureCount: result.persistedFeatureCount,
            storageWarning: result.quota.warning,
          },
        });
      }
      announce(`Project map state saved for ${projectId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Project map save failed.";
      const now = Date.now();
      const errorKey = `${projectId}:${message}`;
      const previousError = lastProjectSaveErrorRef.current;
      const shouldNotify = !options?.silent
        || !previousError
        || previousError.key !== errorKey
        || now - previousError.timestamp > MAP_AUTOSAVE_ERROR_NOTICE_COOLDOWN_MS;
      if (shouldNotify) {
        lastProjectSaveErrorRef.current = { key: errorKey, timestamp: now };
        if (options?.silent) {
          toastWarning(message);
        } else {
          toastError(message);
        }
        announce(`Project save failed: ${message}`);
      }
      return false;
    } finally {
      setIsSavingProject(false);
    }
  }, [
    activeBaseLayer,
    announce,
    annotations,
    bookmarks,
    drawnFeatures,
    getCurrentViewportState,
    overlayLayers,
    pins,
    recordMapReviewEvent,
    selectedProjectId,
    sourceHandles,
  ]);

  const handleProjectLoad = useCallback(async (projectIdOverride?: string | null, options?: {
    silent?: boolean;
  }) => {
    const projectId = projectIdOverride ?? selectedProjectId;
    if (!projectId) {
      if (!options?.silent) {
        toastInfo("Select a project before loading map state.");
      }
      return false;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setIsLoadingProject(true);
    try {
      const result = await loadProjectMapState(projectId);
      if (!result.snapshot) {
        setLastSavedAt(null);
        clearProjectContent();
        /* Do not pull the project's default bbox over an explicit fit-bounds
           request from the current open cycle (e.g. Urban Analytics study
           area selection). */
        const explicitFit = useMapExplorerStore.getState().lastExplicitFitRequest;
        if (selectedProject?.bbox && !explicitFit) {
          fitToBounds(selectedProject.bbox);
        }
        if (!options?.silent) {
          toastInfo(`No saved map state was found for project ${projectId}.`);
        }
        announce(`No saved map state for ${projectId}`);
        return false;
      }

      applyProjectSnapshot(result.snapshot);
      setLastSavedAt(result.snapshot.savedAt);
      if (!options?.silent) {
        toastSuccess(
          `Restored ${result.restoredFeatureCount.toLocaleString()} feature${result.restoredFeatureCount === 1 ? "" : "s"} from project ${projectId}.`,
        );
      }
      announce(`Project map state loaded for ${projectId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Project map load failed.";
      toastError(message);
      announce(`Project load failed: ${message}`);
      return false;
    } finally {
      setIsLoadingProject(false);
    }
  }, [
    announce,
    applyProjectSnapshot,
    clearProjectContent,
    fitToBounds,
    selectedProject?.bbox,
    selectedProjectId,
  ]);

  const handleClearLayerCache = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const activeLayerCount = overlayLayers.length;
    const removedProjectSnapshots = clearPersistedMapProjectSnapshots();

    if (activeLayerCount > 0) {
      replaceOverlayLayers([]);
    }
    clearSourceHandles();
    clearSelectedFeatures();
    setActiveAnalysisResultLayers([]);
    setScientificQA(null);
    setPointSymbologyLayerId(null);
    setSelectionStatsSummary(null);
    setWorkflowPreview(null);
    setUrbanWorkflowDraftRequest(null);
    setCartographyUndoStack([]);
    setDismissedCartographyRecommendationIds(new Set());
    setLastSavedAt(null);
    lastAutoSaveTriggerRef.current = null;

    const layerLabel = activeLayerCount === 1 ? "layer" : "layers";
    const snapshotLabel = removedProjectSnapshots === 1 ? "snapshot" : "snapshots";
    const message = activeLayerCount === 0 && removedProjectSnapshots === 0
      ? "Map Explorer layer cache is already clean."
      : `Cleared ${activeLayerCount.toLocaleString()} active ${layerLabel} and ${removedProjectSnapshots.toLocaleString()} cached project map ${snapshotLabel}.`;

    if (activeLayerCount === 0 && removedProjectSnapshots === 0) {
      toastInfo(message);
    } else {
      toastSuccess(message);
    }
    announce(message);
  }, [
    announce,
    clearSelectedFeatures,
    clearSourceHandles,
    overlayLayers.length,
    replaceOverlayLayers,
    setActiveAnalysisResultLayers,
    setScientificQA,
    setUrbanWorkflowDraftRequest,
    setWorkflowPreview,
  ]);

  const handleProjectSaveRef = useRef(handleProjectSave);
  const handleProjectLoadRef = useRef(handleProjectLoad);

  useEffect(() => {
    handleProjectSaveRef.current = handleProjectSave;
  }, [handleProjectSave]);

  useEffect(() => {
    handleProjectLoadRef.current = handleProjectLoad;
  }, [handleProjectLoad]);

  useEffect(() => {
    if (!open || !selectedProjectId) {
      previousProjectIdRef.current = selectedProjectId;
      return undefined;
    }

    let cancelled = false;
    const previousProjectId = previousProjectIdRef.current;
    previousProjectIdRef.current = selectedProjectId;

    void (async () => {
      if (previousProjectId && previousProjectId !== selectedProjectId && autoSaveEnabled) {
        await handleProjectSaveRef.current(previousProjectId, {
          silent: true,
          reason: "project-switch",
        });
      }

      if (!cancelled) {
        await handleProjectLoadRef.current(selectedProjectId, { silent: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoSaveEnabled, open, selectedProjectId]);

  useEffect(() => {
    if (
      !open ||
      !selectedProjectId ||
      !autoSaveEnabled ||
      isLoadingProject ||
      isSavingProject ||
      isRestoringProjectRef.current
    ) {
      return undefined;
    }

    const nextAutoSaveTrigger = {
      activeBaseLayer,
      annotations,
      bearing,
      bookmarks,
      center,
      drawnFeatures,
      overlayLayers,
      pins,
      pitch,
      selectedProjectId,
      sourceHandles,
      zoom,
    };
    const previousAutoSaveTrigger = lastAutoSaveTriggerRef.current;
    if (
      previousAutoSaveTrigger?.activeBaseLayer === nextAutoSaveTrigger.activeBaseLayer &&
      previousAutoSaveTrigger.annotations === nextAutoSaveTrigger.annotations &&
      previousAutoSaveTrigger.bearing === nextAutoSaveTrigger.bearing &&
      previousAutoSaveTrigger.bookmarks === nextAutoSaveTrigger.bookmarks &&
      previousAutoSaveTrigger.center === nextAutoSaveTrigger.center &&
      previousAutoSaveTrigger.drawnFeatures === nextAutoSaveTrigger.drawnFeatures &&
      previousAutoSaveTrigger.overlayLayers === nextAutoSaveTrigger.overlayLayers &&
      previousAutoSaveTrigger.pins === nextAutoSaveTrigger.pins &&
      previousAutoSaveTrigger.pitch === nextAutoSaveTrigger.pitch &&
      previousAutoSaveTrigger.selectedProjectId === nextAutoSaveTrigger.selectedProjectId &&
      previousAutoSaveTrigger.sourceHandles === nextAutoSaveTrigger.sourceHandles &&
      previousAutoSaveTrigger.zoom === nextAutoSaveTrigger.zoom
    ) {
      return undefined;
    }
    lastAutoSaveTriggerRef.current = nextAutoSaveTrigger;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void handleProjectSave(selectedProjectId, {
        silent: true,
        reason: "autosave",
      });
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    activeBaseLayer,
    annotations,
    autoSaveEnabled,
    bearing,
    bookmarks,
    center,
    drawnFeatures,
    handleProjectSave,
    isLoadingProject,
    isSavingProject,
    open,
    overlayLayers,
    pitch,
    pins,
    selectedProjectId,
    sourceHandles,
    zoom,
  ]);

  useEffect(() => {
    if (visiblePublicationLayers.length === 0 && mapCompositionOptions.includeLegend) {
      setMapCompositionOptions((current) => ({ ...current, includeLegend: false }));
    }
  }, [mapCompositionOptions.includeLegend, visiblePublicationLayers.length]);

  useEffect(() => {
    if (!pointSymbologyLayerId) {
      setPointSymbologyCollection(null);
      setPointSymbologyFields([]);
      setPointSymbologyError(null);
      setIsLoadingPointSymbology(false);
      return undefined;
    }

    if (!selectedPointSymbologyLayer || !selectedPointSymbologyLayer.visible || !isPointCandidate(selectedPointSymbologyLayer)) {
      setPointSymbologyLayerId(null);
      setPointSymbologyCollection(null);
      setPointSymbologyFields([]);
      setPointSymbologyError(null);
      setIsLoadingPointSymbology(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingPointSymbology(true);
    setPointSymbologyError(null);

    void resolveFeatureCollection(selectedPointSymbologyLayer)
      .then((featureCollection) => {
        if (cancelled) return;
        if (!hasPointGeometry(featureCollection)) {
          throw new Error("Selected layer does not contain point geometries.");
        }

        setPointSymbologyCollection(featureCollection);
        setPointSymbologyFields(collectNumericFields(featureCollection));
      })
      .catch((error) => {
        if (cancelled) return;
        setPointSymbologyCollection(null);
        setPointSymbologyFields([]);
        setPointSymbologyError(error instanceof Error ? error.message : "Failed to load point layer.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPointSymbology(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pointSymbologyLayerId, selectedPointSymbologyLayer]);

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

  const handleCatalogAddDemoPack = useCallback((insertion: MapCatalogLayerInsertion) => {
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
  }, [addOverlayLayer, announce, handleSetWorkspaceView, registerLayerEvidenceCandidate, upsertSourceHandle]);

  const handleCatalogBrowseSources = useCallback(() => {
    setShowCatalog(false);
    setShowImportHub(true);
    announce("Catalog opened the data import browser");
  }, [announce]);

  const handleCatalogRepairSource = useCallback((item: MapCatalogItem) => {
    setShowCatalog(false);
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
    setShowContents(false);
    setShowCatalog(true);
    announce(`Catalog opened to repair source for ${layer.name}`);
  }, [announce]);

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
      nextFile.size > IMPORT_PROGRESS_THRESHOLD_BYTES || /\.(arrow|feather|ipc|parquet|geoparquet)$/i.test(nextFile.name),
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
      await handleImportedLayerReady(pendingImportPreview.result);
      clearPendingImportPreview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Spatial import failed.";
      toastError(message);
      announce(`Import failed: ${message}`);
    }
  }, [announce, clearPendingImportPreview, handleImportedLayerReady, pendingImportPreview]);

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
    setShowImportHub(true);
  }, []);

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
        return;
      } catch (osmError) {
        const reason = osmError instanceof Error ? osmError.message : "external service unavailable";
        const result = loadTeachingDatasetIntoMapWorkspace(datasetId);
        fitToBounds(result.dataset.spatialExtent.bounds);
        setShowImportHub(false);
        toastWarning(
          `Live OpenStreetMap data unavailable (${reason}). Loaded the synthetic ${result.dataset.city} teaching fixture instead — labelled as demo data.`,
        );
        announce(`OpenStreetMap unavailable; loaded synthetic teaching fixture for ${result.dataset.city}`);
        return;
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

  const handleReportHandoffOptionsChange = useCallback((nextOptions: MapReportHandoffOptions) => {
    const shouldRefreshSnapshot = nextOptions.snapshotFrame !== reportHandoffOptions.snapshotFrame
      || nextOptions.snapshotFit !== reportHandoffOptions.snapshotFit;
    setReportHandoffOptions(nextOptions);
    if (shouldRefreshSnapshot && reportHandoffSource) {
      void captureReportHandoffSnapshot(reportHandoffSource, nextOptions);
    }
  }, [
    captureReportHandoffSnapshot,
    reportHandoffOptions.snapshotFit,
    reportHandoffOptions.snapshotFrame,
    reportHandoffSource,
  ]);

  const handleOpenReportHandoff = useCallback((source: MapReportHandoffSource) => {
    const initialOptions = DEFAULT_MAP_REPORT_HANDOFF_OPTIONS;
    closeRightDockPanels();
    closeFloatingRightPanels();
    setShowScientificQAPanel(false);
    setShowWorkflowDrawer(false);
    setWorkflowPreview(null);
    setUrbanWorkflowDraftRequest(null);
    setReportHandoffSource(source);
    setReportHandoffOptions(initialOptions);
    setReportHandoffSnapshot(null);
    void captureReportHandoffSnapshot(source, initialOptions);
    announce("Map report preview opened");
  }, [announce, captureReportHandoffSnapshot, closeFloatingRightPanels, closeRightDockPanels]);

  const handleOpenCurrentMapReportHandoff = useCallback(() => {
    handleOpenReportHandoff({ scope: "map-view", title: "Current map evidence" });
  }, [handleOpenReportHandoff]);

  const handleLayerReportRequest = useCallback((layerId: string) => {
    const layer = overlayLayers.find((candidate) => candidate.id === layerId);
    handleOpenReportHandoff({
      scope: "layer",
      layerId,
      title: `${layer?.name ?? "Selected layer"} map finding`,
    });
  }, [handleOpenReportHandoff, overlayLayers]);

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

  const handleFeatureReportRequest = useCallback((payload: MapFeatureReportRequest) => {
    const titleValue = [
      payload.properties.detection_class,
      payload.properties.land_cover_class,
      payload.properties.cluster_label,
      payload.properties.query_intent,
      payload.properties.name,
      payload.properties.label,
      payload.properties.id,
      payload.properties.feature_id,
    ].find((value) => value != null && value !== "");
    handleOpenReportHandoff({
      scope: "feature",
      featureId: payload.featureId,
      properties: payload.properties,
      coordinate: payload.coordinate,
      title: `${titleValue ? String(titleValue) : "Selected feature"} feature finding`,
      ...(payload.layerId ? { layerId: payload.layerId } : {}),
    });
  }, [handleOpenReportHandoff]);

  const handleRefreshReportHandoffSnapshot = useCallback(() => {
    if (!reportHandoffSource) return;
    void captureReportHandoffSnapshot(reportHandoffSource, reportHandoffOptions);
  }, [captureReportHandoffSnapshot, reportHandoffOptions, reportHandoffSource]);

  const handleDownloadReportHandoffPdf = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) {
      toastError("Map canvas is not ready for A0 export.");
      announce("A0 map PDF export failed: canvas not ready");
      return;
    }
    if (reportHandoffDraft?.publicationReadiness.status === "blocked") {
      const message = reportHandoffDraft.publicationReadiness.blockers[0]?.message ?? "Publication readiness blockers must be resolved before formal PDF export.";
      toastError(message);
      announce(`A0 map PDF export blocked: ${message}`);
      return;
    }

    setIsExportingReportHandoffPdf(true);
    try {
      await waitForMapCanvasCaptureMode();
      const captureMap = mapInstanceRef.current;
      if (!captureMap) {
        throw new Error("Map canvas is not ready for A0 export.");
      }
      const result = await exportMapOnlyA0LandscapePdf(captureMap, {
        mapFit: reportHandoffOptions.snapshotFit,
        title: reportHandoffSource?.title ?? reportHandoffDraft?.title ?? "Current map evidence",
        overlayLayers: visiblePublicationLayers,
        attributionText: DEFAULT_MAP_COMPOSITION_OPTIONS.attributionText,
        scientificQA,
      });
      triggerMapPublicationDownload(result);
      const readiness = result.readiness ?? reportHandoffDraft?.publicationReadiness ?? mapPublicationReadiness;
      upsertMapEvidenceArtifact(createMapExportEvidenceArtifact({
        title: `${reportHandoffDraft?.title ?? "Current map evidence"} A0 PDF export`,
        summary: `Formal A0 PDF export recorded with publication readiness status ${readiness.status}.`,
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
      toastSuccess(`Exported A0 landscape map PDF: ${result.filename}.`);
      announce("A0 landscape map PDF exported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "A0 landscape map PDF export failed.";
      toastError(message);
      announce(`A0 landscape map PDF export failed: ${message}`);
    } finally {
      setIsExportingReportHandoffPdf(false);
    }
  }, [
    announce,
    mapPublicationReadiness,
    reportHandoffDraft,
    reportHandoffOptions.snapshotFit,
    reportHandoffSource?.title,
    scientificQA,
    upsertMapEvidenceArtifact,
    visiblePublicationLayers,
  ]);

  const handleRegisterReportEvidenceBlock = useCallback(() => {
    if (!reportHandoffDraft) return;
    const sourceLayerIds = reportHandoffDraft.references
      .map((reference) => reference.layerId)
      .filter((layerId): layerId is string => Boolean(layerId));
    const artifact = createMapReportSnapshotEvidenceArtifact({
      title: `${reportHandoffDraft.title} structured report evidence`,
      summary: `Structured map evidence block ${reportHandoffDraft.evidenceBlock.id} registered with publication readiness status ${reportHandoffDraft.publicationReadiness.status}.`,
      reportReference: {
        reportDraftId: reportHandoffDraft.id,
        snapshotAssetId: reportHandoffDraft.snapshot.assetId,
        sectionIds: [],
      },
      linkedLayerIds: sourceLayerIds,
      sourceLayerIds,
      qa: mapPublicationReadinessToEvidenceQA(reportHandoffDraft.publicationReadiness),
      metadata: {
        reportEvidenceBlockId: reportHandoffDraft.evidenceBlock.id,
        reportEvidenceBlockVersion: reportHandoffDraft.evidenceBlock.version,
        reportEvidenceLayerCount: reportHandoffDraft.evidenceBlock.payload.composition.layerStack.length,
        reportEvidenceLegendItemCount: reportHandoffDraft.evidenceBlock.payload.composition.legendItems.length,
        reportEvidenceCitationCount: reportHandoffDraft.evidenceBlock.payload.provenance.citationIds.length,
        publicationReadinessStatus: reportHandoffDraft.publicationReadiness.status,
        readinessBlockerCount: reportHandoffDraft.publicationReadiness.blockers.length,
        readinessWarningCount: reportHandoffDraft.publicationReadiness.warnings.length,
        readinessCaveatCount: reportHandoffDraft.publicationReadiness.caveats.length,
      },
      createdAt: reportHandoffDraft.createdAt,
    });
    upsertMapEvidenceArtifact(artifact);
    toastSuccess(`Registered structured map evidence block ${reportHandoffDraft.evidenceBlock.id}.`);
    announce("Structured map report evidence registered");
  }, [announce, reportHandoffDraft, upsertMapEvidenceArtifact]);

  const handleInsertReportHandoff = useCallback(() => {
    if (!reportHandoffDraft) return;
    if (reportHandoffDraft.publicationReadiness.status === "blocked") {
      const message = reportHandoffDraft.publicationReadiness.blockers[0]?.message ?? "Publication readiness blockers must be resolved before report insertion.";
      toastError(message);
      announce(`Map report insertion blocked: ${message}`);
      return;
    }
    const snapshot = buildCurrentReviewSnapshot();
    const provisionalInsert = buildPendingReportInsertFromMapHandoff(reportHandoffDraft);
    const reviewEventInput = buildReportHandoffReviewEvent(reportHandoffDraft, provisionalInsert, snapshot);
    const reviewEventId = createMapReviewEvent(reviewEventInput).id;
    const insert = enqueueMapReportHandoff(reportHandoffDraft, { mapReviewEventIds: [reviewEventId] });
    const sourceLayerIds = reportHandoffDraft.references
      .map((reference) => reference.layerId)
      .filter((layerId): layerId is string => Boolean(layerId));
    upsertMapEvidenceArtifact(createMapReportSnapshotEvidenceArtifact({
      title: `${reportHandoffDraft.title} report snapshot`,
      summary: `Report handoff inserted with publication readiness status ${reportHandoffDraft.publicationReadiness.status}.`,
      reportReference: {
        reportInsertId: insert.id,
        reportDraftId: reportHandoffDraft.id,
        snapshotAssetId: reportHandoffDraft.snapshot.assetId,
        sectionIds: insert.sections.map((section) => section.id),
      },
      linkedLayerIds: sourceLayerIds,
      sourceLayerIds,
      qa: mapPublicationReadinessToEvidenceQA(reportHandoffDraft.publicationReadiness),
      metadata: {
        reportEvidenceBlockId: reportHandoffDraft.evidenceBlock.id,
        reportEvidenceBlockVersion: reportHandoffDraft.evidenceBlock.version,
        reportEvidenceLayerCount: reportHandoffDraft.evidenceBlock.payload.composition.layerStack.length,
        reportEvidenceLegendItemCount: reportHandoffDraft.evidenceBlock.payload.composition.legendItems.length,
        publicationReadinessStatus: reportHandoffDraft.publicationReadiness.status,
        readinessBlockerCount: reportHandoffDraft.publicationReadiness.blockers.length,
        readinessWarningCount: reportHandoffDraft.publicationReadiness.warnings.length,
        readinessCaveatCount: reportHandoffDraft.publicationReadiness.caveats.length,
        citationCount: reportHandoffDraft.citations.length,
        reportSectionCount: insert.sections.length,
      },
      createdAt: reportHandoffDraft.createdAt,
    }));
    recordMapReviewEvent({ ...reviewEventInput, id: reviewEventId });
    setReportHandoffSource(null);
    setReportHandoffSnapshot(null);
    toastSuccess(`Added ${insert.sections.length} map report section(s) to the report builder.`);
    announce("Map finding added to report builder");
    window.dispatchEvent(new CustomEvent("synapse:navigate", { detail: { tab: "Report" } }));
  }, [announce, buildCurrentReviewSnapshot, recordMapReviewEvent, reportHandoffDraft, upsertMapEvidenceArtifact]);

  const handleCloseReportHandoff = useCallback(() => {
    setReportHandoffSource(null);
    setReportHandoffSnapshot(null);
    setIsGeneratingReportHandoffSnapshot(false);
    setIsExportingReportHandoffPdf(false);
    announce("Map report preview closed");
  }, [announce]);

  const handleMapQuickAction = useCallback((actionId: MapQuickActionId) => {
    switch (actionId) {
      case "import-data":
        handleSetWorkspaceView("explore");
        handleImportRequest();
        break;
      case "review-layers":
        handleSetWorkspaceView("explore");
        setShowLayerPanel(true);
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
        handleSetWorkspaceView("analyze");
        setShowScientificQAPanel(false);
        closeRightDockPanels();
        setShowLayerPanel(true);
        setPointSymbologyLayerId(null);
        setShowClusterViz(false);
        setShowHotSpotViz(false);
        setShowChoroplethPanel(true);
        announce("Thematic analysis panel opened");
        break;
      case "export-map":
        handleSetWorkspaceView("explore");
        handleMapExportRequest();
        break;
      case "save-project":
        handleSetWorkspaceView("explore");
        void handleProjectSave();
        break;
      default:
        break;
    }
  }, [announce, closeFloatingRightPanels, closeRightDockPanels, handleImportRequest, handleMapExportRequest, handleProjectSave, handleSetDrawTool, handleSetMeasureTool, handleSetWorkspaceView, setActiveTool]);

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
    setShowMeasurePanel(true);
    setActiveTool(null);
    setActiveDrawTool(null);
    setActiveMeasureTool("measure-distance");
    setMeasurementSeed({
      coordinate,
      tool: "measure-distance",
      token: Date.now(),
    });
  }, [closeFloatingRightPanels, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const handleStartPolygonFromContext = useCallback((coordinate: [number, number]) => {
    setWorkspaceView("analyze");
    setShowScientificQAPanel(false);
    closeFloatingRightPanels();
    setShowSidebar(false);
    setShowDrawPanel(true);
    setShowMeasurePanel(false);
    setActiveTool(null);
    setActiveMeasureTool(null);
    setActiveDrawTool("polygon");
    setDrawSeed({
      coordinate,
      tool: "polygon",
      token: Date.now(),
    });
  }, [closeFloatingRightPanels, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const toolbarCommandHandlers = useMapCommandHandlers({
    onImport: handleImportRequest,
    onDataExport: handleExportRequest,
    onImageExport: handleMapExportRequest,
    onPackageExport: handleOfflinePackageExport,
    onReportHandoff: handleOpenCurrentMapReportHandoff,
    onProjectSave: () => {
      void handleProjectSave();
    },
    onProjectLoad: () => {
      void handleProjectLoad();
    },
  });

  /* ---- Render ---- */
  if (!open) return null;

  const transitionStyle = reducedMotion ? "none" : undefined;
  const exportDisabled =
    pins.length === 0 &&
    drawnFeatures.length === 0 &&
    overlayLayers.filter((layer) => layer.visible).length === 0;
  const exportDisabledReason = exportDisabled
    ? "Add pins, drawings, or visible overlay layers before exporting GeoJSON."
    : undefined;
  const packageExportDisabled =
    pins.length === 0 &&
    bookmarks.length === 0 &&
    annotations.length === 0 &&
    drawnFeatures.length === 0 &&
    overlayLayers.length === 0 &&
    mapEvidenceArtifacts.length === 0;
  const reportDisabledReason = isGeneratingReportHandoffSnapshot
    ? "The current map report snapshot is still rendering."
    : undefined;
  const persistenceDisabled = !selectedProjectId;

  return createPortal(
    <MapWorkspaceShell mode={mode} shellRef={trapRef} onClose={onClose}>
        {reducedMotion ? (
          <style>
            {'[data-map-explorer-shell="true"], [data-map-explorer-shell="true"] * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }'}
          </style>
        ) : null}

        <input
          ref={importInputRef}
          type="file"
          accept={MAP_IMPORT_ACCEPT_ATTRIBUTE}
          style={{ display: "none" }}
          onChange={(event) => {
            void handleImportFiles(event.target.files);
          }}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Skip navigation link */}
        <a
          href={`#${mapCanvasId}`}
          style={srOnlyFocusable}
          aria-label="Skip to interactive map canvas"
          onClick={(event) => {
            event.preventDefault();
            focusInteractiveMapCanvas();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }
            event.preventDefault();
            focusInteractiveMapCanvas();
          }}
          onFocus={(e) => {
            /* Make visible on focus */
            const el = e.currentTarget;
            Object.assign(el.style, mapStyles.skipNavFocus);
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            Object.assign(el.style, mapStyles.srOnly);
          }}
        >
          Skip to map canvas
        </a>

        {/* Screen reader announcements */}
        <AnnouncerRegion />

        {/* Header bar */}
        <div ref={headerRef} style={commandHeaderStyle} role="toolbar" aria-label="Map command bar">
          <span style={commandHeaderTitleStyle} id="map-explorer-title">Map Explorer</span>

          <MapSearchBar
            compact
            onFlyTo={flyTo}
            onPlaceSelected={(place) => {
              if (place.bbox) {
                setWorkflowGeocodedPlace({
                  label: place.label,
                  bbox: place.bbox,
                  center: place.center,
                  source: place.source,
                });
              } else {
                setWorkflowGeocodedPlace(null);
              }
            }}
            onResultCount={(count) => announce(`${count} search result${count !== 1 ? "s" : ""} found`)}
          />

          <div style={commandHeaderToolbarSlot}>
            <MapToolbar
              workspaceView={workspaceView}
              onWorkspaceViewChange={handleSetWorkspaceView}
              pinMode={pinMode}
              onTogglePinMode={handleTogglePinMode}
              showSidebar={effectiveShowSidebar}
              onToggleSidebar={handleToggleSidebar}
              pinCount={pins.length}
              showLayerPanel={effectiveShowLayerPanel}
              onToggleLayerPanel={handleToggleLayerPanel}
              layerCount={overlayLayers.length}
              visibleLayerCount={visiblePublicationLayers.length}
              showCatalog={showCatalog}
              onToggleCatalog={handleToggleCatalog}
              catalogSourceCount={sourceHandles.length}
              showContents={showContents}
              onToggleContents={handleToggleContents}
              activeLayerGeometryType={toolbarActiveGeometryType}
              hasSelectedAoi={Boolean(selectedAoiFeatureForQuery)}
              scientificQAStatus={scientificQA?.status ?? "unchecked"}
              scientificQAIssueCount={scientificQAIssueCount}
              scientificQABlockerCount={scientificQABlockerCount}
              showScientificQAPanel={showScientificQAPanel}
              onToggleScientificQAPanel={handleToggleScientificQAPanel}
              showNLQueryPanel={showNLQueryPanel}
              onToggleNLQueryPanel={handleToggleNLQueryPanel}
              nlQueryLayerCount={nlQueryToolbarContext.queryableLayers.length}
              showWorkflowDrawer={showWorkflowDrawer}
              onToggleWorkflowDrawer={handleToggleWorkflowDrawer}
              workflowReadyCount={workflowReadyCount}
              showReviewTimeline={showReviewTimeline}
              onToggleReviewTimeline={handleToggleReviewTimeline}
              reviewEventCount={reviewSession.events.length}
              showPerformanceDiagnostics={showPerformanceDiagnostics}
              onTogglePerformanceDiagnostics={handleTogglePerformanceDiagnostics}
              performanceIssueCount={performanceIssueCount}
              showPluginPanel={showPluginPanel}
              onTogglePluginPanel={handleTogglePluginPanel}
              pluginExtensionCount={pluginExtensions.length}
              showProcessingToolbox={showProcessingToolbox}
              onToggleProcessingToolbox={handleToggleProcessingToolbox}
              processingToolCount={processingRegistry.implementedCount()}
              showModelBuilder={showModelBuilder}
              onToggleModelBuilder={handleToggleModelBuilder}
              showFigureComposer={showFigureComposer}
              onToggleFigureComposer={handleToggleFigureComposer}
              showChoroplethPanel={showChoroplethPanel}
              onToggleChoroplethPanel={handleToggleChoroplethPanel}
              showClusterViz={showClusterViz}
              onToggleClusterViz={handleToggleClusterViz}
              showHotSpotViz={showHotSpotViz}
              onToggleHotSpotViz={handleToggleHotSpotViz}
              showEmergingHotSpotViz={showEmergingHotSpotViz}
              onToggleEmergingHotSpotViz={handleToggleEmergingHotSpotViz}
              viewportSyncEnabled={viewportSyncEnabled}
              onToggleViewportSync={handleToggleViewportSync}
              showVoxCityOverlayPanel={showVoxCityOverlay}
              onToggleVoxCityOverlayPanel={() => {
                setShowVoxCityOverlay((current) => {
                  const next = !current;
                  if (next) {
                    setShowScientificQAPanel(false);
                    setShowNLQueryPanel(false);
                    closeRightDockPanels();
                    setPointSymbologyLayerId(null);
                    setShowChoroplethPanel(false);
                    setShowClusterViz(false);
                    setShowHotSpotViz(false);
                    setShowEmergingHotSpotViz(false);
                  }
                  announce(next ? "VoxCity 2D overlay opened" : "VoxCity 2D overlay closed");
                  return next;
                });
              }}
              voxCityFootprintCount={SAMPLE_BUILDINGS.length}
              restrictToMapView={restrictToMapView}
              onToggleRestrictToMapView={handleToggleRestrictToMapView}
              activeDrawTool={activeDrawTool}
              onSetDrawTool={handleSetDrawTool}
              drawnFeatureCount={drawnFeatures.length}
              showDrawPanel={effectiveShowDrawPanel}
              onToggleDrawPanel={handleToggleDrawPanel}
              annotationMode={annotationMode}
              onToggleAnnotationMode={handleToggleAnnotationMode}
              annotationCount={annotations.length}
              activeMeasureTool={activeMeasureTool}
              onSetMeasureTool={handleSetMeasureTool}
              measurementCount={measurements.length}
              showMeasurePanel={effectiveShowMeasurePanel}
              onToggleMeasurePanel={handleToggleMeasurePanel}
              onImportClick={toolbarCommandHandlers.importData}
              onOpenExternalServices={() => {
                setShowExternalServiceDialog(true);
                announce("External map services dialog opened");
              }}
              onImageExportClick={toolbarCommandHandlers.exportImage}
              onExportPackageClick={toolbarCommandHandlers.exportPackage}
              onAddToReportClick={toolbarCommandHandlers.openReportHandoff}
              onExportClick={toolbarCommandHandlers.exportData}
              onSaveProjectClick={toolbarCommandHandlers.saveProject}
              onLoadProjectClick={toolbarCommandHandlers.loadProject}
              isImporting={isImporting}
              importProgress={importProgress?.percent ?? null}
              exportDisabled={exportDisabled}
              exportDisabledReason={exportDisabledReason}
              packageExportDisabled={packageExportDisabled}
              packageExportDisabledReason="Add pins, drawings, overlay layers, or map evidence before exporting an offline package."
              reportDisabled={isGeneratingReportHandoffSnapshot}
              reportDisabledReason={reportDisabledReason}
              isExportingImage={isExportingMapImage}
              isExportingPackage={isExportingOfflinePackage}
              isSavingProject={isSavingProject}
              isLoadingProject={isLoadingProject}
              persistenceDisabled={persistenceDisabled}
              processingTools={processingToolDescriptors}
              processingLayerOptions={processingToolboxLayers}
              onRunProcessingToolCommand={handleRunProcessingTool}
              canUndoMapAction={mapUndoRedoSummary.canUndo}
              canRedoMapAction={mapUndoRedoSummary.canRedo}
              undoMapActionLabel={mapUndoRedoSummary.undoLabel}
              redoMapActionLabel={mapUndoRedoSummary.redoLabel}
              onUndoMapAction={() => handleUndoMapAction()}
              onRedoMapAction={handleRedoMapAction}
            />
          </div>

          <MapBookmarkBar
            variant="menu"
            bookmarks={bookmarks}
            maxBookmarks={MAP_BOOKMARK_LIMIT}
            onSaveBookmark={handleSaveBookmark}
            onRestoreBookmark={handleRestoreBookmark}
            onRenameBookmark={handleRenameBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onShareBookmark={handleShareBookmark}
          />

          <MapLayerPanel compact activeLayer={activeBaseLayer} onSetLayer={handleSetBaseLayer} />

          <button
            type="button"
            style={commandHeaderCloseButton}
            onClick={onClose}
            aria-label="Close map explorer (Escape)"
          >
            <IconClose size={MAP_ICON_SIZES.md} />
          </button>
        </div>

        {/* Map area */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- map surface needs drag-and-drop file handling */}
        <MapCanvasRegion
          ref={handleMapContainerRef}
          style={{
            "--map-dock-left": `${navigatorLeftInset}px`,
            "--map-dock-right": `${navigatorRightInset}px`,
            "--map-layer-panel-width": `${dockLayout.layerPanelWidth}px`,
          } as React.CSSProperties}
          data-map-dock-compact={dockLayout.compactDock ? "true" : "false"}
          data-map-right-panel={dockLayout.activeRightPanel ?? "none"}
          data-map-layer-placement={dockLayout.layerPanelPlacement ?? "none"}
          data-testid="map-canvas-region"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(event) => {
            void handleDrop(event);
          }}
        >
          {isDragActive ? (
            <div
              style={{
                ...mapStyles.dragOverlay,
                border: "1px solid var(--syn-border-active, rgba(56, 189, 248, 0.6))",
                background: "var(--syn-surface-overlay, rgba(8, 12, 18, 0.68))",
                color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))",
              }}
              aria-hidden="true"
            >
              Drop GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, or GPX to import
            </div>
          ) : null}

          <MapServiceDialog
            open={showExternalServiceDialog}
            bounds={externalServiceBounds?.bounds ?? null}
            boundsLabel={externalServiceBounds?.label ?? null}
            overlayLayers={overlayLayers}
            onAddLayer={handleExternalServiceLayerReady}
            onRemoveLayer={removeOverlayLayer}
            onClose={() => {
              setShowExternalServiceDialog(false);
              handleExternalServiceProgress({ busy: false, label: null, progress: null });
              announce("External map services dialog closed");
            }}
            onAnnounce={announce}
            onProgress={handleExternalServiceProgress}
            onOpenVoxCityOverlay={handleOpenVoxCityOverlayFromService}
          />

          {showImportProgress ? (
            <div
              style={mapStyles.importProgress}
              role="status"
              aria-label={`Importing ${importLabel ?? "spatial data"} ${Math.round(importProgress?.percent ?? 0)} percent`}
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
                top: 16,
                right: navigatorRightInset,
                width: 320,
                maxWidth: `calc(100% - ${navigatorLeftInset + navigatorRightInset}px)`,
                display: "grid",
                gap: 6,
                padding: "12px 14px",
                borderRadius: MAP_RADIUS.sm,
                border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.36))",
                background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.9))",
                zIndex: 20,
              }}
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

          {selectionStatsSummary && selectionStatsSummary.length > 0 ? (
            <div
              style={{
                position: "absolute",
                right: navigatorRightInset,
                bottom: 16,
                width: 360,
                maxWidth: `calc(100% - ${navigatorLeftInset + navigatorRightInset}px)`,
                display: "grid",
                gap: 10,
                padding: "12px 14px",
                borderRadius: MAP_RADIUS.sm,
                border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.34))",
                background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.92))",
                zIndex: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: "var(--syn-status-info, #38bdf8)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Quick Statistics
                  </div>
                  <div style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 13, fontWeight: 600 }}>
                    Selected feature summary
                  </div>
                </div>
                <button
                  type="button"
                  style={mapStyles.btn}
                  onClick={() => setSelectionStatsSummary(null)}
                  aria-label="Close selection statistics panel"
                >
                  <IconClose size={MAP_ICON_SIZES.sm} />
                </button>
              </div>
              {selectionStatsSummary.map((summary) => (
                <div key={summary.layerId} style={{ display: "grid", gap: 8, paddingTop: 4, borderTop: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.3))" }}>
                  <div style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 12, fontWeight: 600 }}>
                    {summary.layerName} · {summary.selectedFeatureCount.toLocaleString()} selected
                  </div>
                  {summary.numericFields.length === 0 ? (
                    <div style={{ color: "var(--syn-text-muted, rgba(148, 163, 184, 0.88))", fontSize: 12 }}>
                      Missing prerequisite: selected features need numeric attributes before summary statistics can be computed.
                    </div>
                  ) : summary.numericFields.slice(0, 4).map((field) => (
                    <div key={field.field} style={{ display: "grid", gap: 2, fontSize: 11, color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.9))" }}>
                      <strong style={{ color: "var(--syn-status-info, #38bdf8)", fontWeight: 600 }}>{field.field}</strong>
                      <span>min {field.min.toFixed(2)} · max {field.max.toFixed(2)} · mean {field.mean.toFixed(2)} · median {field.median.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {isFlowDispatchDialogOpen && flowDispatchAoi ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(0, 0, 0, 0.34)",
                zIndex: 22,
              }}
            >
              <div
                style={{
                  width: 460,
                  maxWidth: "calc(100% - 32px)",
                  display: "grid",
                  gap: 14,
                  padding: "18px 18px 16px",
                  borderRadius: MAP_RADIUS.sm,
                  border: "1px solid var(--syn-border-strong, rgba(148, 163, 184, 0.42))",
                  background: "var(--syn-surface-panel, rgba(12, 16, 24, 0.94))",
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Choose workflow for map analysis dispatch"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ color: "var(--syn-status-info, #38bdf8)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Analyze This Area
                    </div>
                    <div style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 15, fontWeight: 600 }}>
                      Route {flowDispatchAoi.label.toLowerCase()} into a workflow
                    </div>
                  </div>
                  <button
                    type="button"
                    style={mapStyles.btn}
                    onClick={() => setIsFlowDispatchDialogOpen(false)}
                    aria-label="Close map analysis workflow selector"
                  >
                    <IconClose size={MAP_ICON_SIZES.sm} />
                  </button>
                </div>
                <div style={{ color: "var(--syn-text-muted, rgba(148, 163, 184, 0.9))", fontSize: 12, lineHeight: 1.5 }}>
                  The selected workflow will open in CenterPanel with this AOI attached as map-dispatch input{restrictToMapView && currentMapBounds ? " and the current view preserved as a spatial filter" : ""}.
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {compatibleAoiFlows.map((flow) => (
                    <button
                      key={flow.id}
                      type="button"
                      style={{
                        display: "grid",
                        gap: 4,
                        padding: "12px 14px",
                        borderRadius: MAP_RADIUS.sm,
                        border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
                        background: MAP_COLORS.transparent,
                        color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDispatchFlowSelection(flow.id)}
                    >
                      <span style={{ color: "var(--syn-interaction-active, #3794ff)", fontSize: 13, fontWeight: 600 }}>{flow.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.64)", fontSize: 12, lineHeight: 1.45 }}>{flow.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {workspaceView === "navigator" ? (
            <div
              style={{
                ...mapStyles.navigatorStage,
                top: MAP_NAVIGATOR_STAGE_TOP,
                left: navigatorLeftInset,
                right: navigatorRightInset,
                bottom: MAP_NAVIGATOR_STAGE_BOTTOM,
              }}
            >
              <div
                style={{
                  ...mapStyles.navigatorStageInner,
                  width: `min(calc(100% - ${MAP_SPACING.lg}), ${MAP_DIMENSIONS.navigatorMaxWidth})`,
                  height: `calc(100% - ${MAP_SPACING.xs})`,
                  maxWidth: `min(calc(100% - ${MAP_SPACING.lg}), ${MAP_DIMENSIONS.navigatorMaxWidth})`,
                  maxHeight: `min(calc(100% - ${MAP_SPACING.sm}), ${MAP_DIMENSIONS.navigatorMaxHeight})`,
                  overflow: "hidden",
                }}
              >
                <MapWorkspaceCockpit
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
                  workflowReadyCount={workflowReadyCount}
                  visiblePublicationLayerCount={visiblePublicationLayers.length}
                  viewportSyncEnabled={viewportSyncEnabled}
                  syncStatus={viewportSyncStatus}
                  analysisRecommendations={analysisRecommendationState.recommendations}
                  onAnalysisRecommendationAction={handleAnalysisRecommendationAction}
                />
              </div>
            </div>
          ) : null}

          {/* Layer management panel (left side) */}
          {effectiveShowLayerPanel ? (
            <MapPanelRail
              ref={legendRef}
              side={dockLayout.layerPanelPlacement === "bottom" ? "bottom" : "left"}
              width={dockLayout.layerPanelWidth}
              height="min(24rem, 54%)"
              minWidth={MAP_LAYER_PANEL_MIN_WIDTH}
              maxWidth={MAP_LAYER_PANEL_MAX_WIDTH}
              resizable={dockLayout.layerPanelPlacement === "left"}
              onWidthChange={handleLayerPanelWidthChange}
              ariaLabel="Layer and data panel"
              data-testid="map-layer-panel-rail"
            >
              <MapLayerManager
                overlayLayers={overlayLayers}
                activeBaseLayerName={BASE_STYLES[activeBaseLayer].name}
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
                onRequestClose={() => {
                  setShowLayerPanel(false);
                  announce("Layer panel closed");
                }}
                panelStyle={{ width: "100%", height: "100%" }}
                onAnnounce={announce}
              />
            </MapPanelRail>
          ) : null}

          <MapCanvas
            id={mapCanvasId}
            baseLayer={activeBaseLayer}
            pinMode={pinMode}
            pins={pins}
            interactiveLayerIds={interactiveAnalysisLayerIds}
            reducedMotion={reducedMotion}
            preserveDrawingBuffer={mapCanvasCaptureMode}
            onCursorMove={handleCursorMove}
            onZoomChange={handleZoomChange}
            onViewportChange={handleViewportChange}
            onMapClick={handleMapClick}
            onMapReady={handleMapReady}
            onMapDestroy={handleMapDestroy}
            onRenderError={handleMapRenderError}
            onFeatureReportRequest={handleFeatureReportRequest}
          />

          <MapCanvasKeyboardFallbackControls
            mapRef={mapInstanceRef}
            mapElementId={mapCanvasId}
            reducedMotion={reducedMotion}
            defaultCenter={[29.0, 41.0]}
            defaultZoom={10}
            onAnnounce={announce}
          />

          <MapLegendOverlay items={mapPublicationLegendItems} />

          {!navigatorStageMode ? (
            <MapPerformanceBudgetBanner
              diagnostics={performanceDiagnostics}
              rightInset={navigatorRightInset + 16}
            />
          ) : null}

          {!navigatorStageMode ? (
            <MapSelectionTools
              mapRef={mapInstanceRef}
              queryableLayers={nlQueryToolbarContext.queryableLayers}
              selectedFeatureIds={selectedFeatureIds}
              leftInset={navigatorLeftInset}
              onSetSelectedFeatures={setSelectedFeatures}
              onClearSelectedFeatures={() => clearSelectedFeatures()}
              onSetActiveAnalysisResultLayers={setActiveAnalysisResultLayers}
              onAddDrawnFeature={addDrawnFeature}
              onSelectionResult={handleSelectionQueryResult}
              onAnnounce={announce}
            />
          ) : null}

          <MapUrbanMethodCompatibilityRail
            visible={effectiveShowUrbanMethodPanel}
            request={activeUrbanMethodRequest}
            preview={activeUrbanMethodPreview}
            presentation={dockLayout.compactDock ? "bottom-drawer" : "right-rail"}
            width={dockLayout.rightPanelWidth}
            onClose={handleCloseUrbanMethodRail}
            onFocusLayer={handleFocusUrbanMethodLayer}
            onPreviewWorkflow={handlePreviewUrbanMethodWorkflow}
          />

          <Suspense fallback={null}>
            <LazyMapReportHandoffDrawer
              draft={reportHandoffDraft}
              options={reportHandoffOptions}
              isGeneratingSnapshot={isGeneratingReportHandoffSnapshot}
              isExportingPdf={isExportingReportHandoffPdf}
              presentation={dockLayout.compactDock ? "bottom-drawer" : "right-rail"}
              width={dockLayout.rightPanelWidth}
              onWidthChange={handleRightPanelWidthChange}
              onOptionsChange={handleReportHandoffOptionsChange}
              onRefreshSnapshot={handleRefreshReportHandoffSnapshot}
              onRegisterEvidence={handleRegisterReportEvidenceBlock}
              onDownloadPdf={handleDownloadReportHandoffPdf}
              onInsert={handleInsertReportHandoff}
              onClose={handleCloseReportHandoff}
            />
          </Suspense>

          {inspectorLayer ? (
            <Suspense fallback={null}>
              <LazyLayerInspector
                layer={inspectorLayer}
                sourceHandle={inspectorSourceHandle}
                onClose={() => {
                  setInspectorLayerId(null);
                  announce("Layer inspector closed");
                }}
                onApplyStyle={handleApplyLayerStyle}
              />
            </Suspense>
          ) : null}
          {attributeTableLayer ? (
            <MapAttributeTable
              layer={attributeTableLayer}
              selectedIds={selectedFeatureIds[attributeTableLayer.id] ?? []}
              onSelectFeatures={(featureIds) => handleAttributeTableSelection(attributeTableLayer.id, featureIds)}
              onFocusFeature={handleFocusAttributeFeature}
              onCreateDerivedLayer={handleCreateAttributeDerivedLayer}
              onClose={() => {
                setAttributeTableLayerId(null);
                announce("Attribute table closed");
              }}
              onAnnounce={announce}
            />
          ) : null}
          <MapReviewTimelinePanel
            visible={showReviewTimeline && !navigatorStageMode}
            session={reviewSession}
            overlayLayers={overlayLayers}
            qaState={scientificQA}
            onClose={() => {
              setShowReviewTimeline(false);
              announce("Review timeline closed");
            }}
            onRecordEvent={recordMapReviewEvent}
            onRevertCommand={handleRevertMapCommand}
            onUpdateEventStatus={(eventId, status, outcome) => {
              updateMapReviewEventStatus(eventId, status, outcome);
              announce(`Timeline event ${status}`);
            }}
            onClearSession={() => {
              clearMapReviewSession({
                projectId: selectedProjectId,
                title: selectedProject?.name ? `${selectedProject.name} map review session` : "Map review session",
                initialSnapshot: buildCurrentReviewSnapshot(),
              });
              lastReviewQaSignatureRef.current = null;
              lastReviewRecommendationSignatureRef.current = null;
              recordedCopilotProposalIdsRef.current = new Set();
              recordedCopilotAuditIdsRef.current = new Set();
              recordedNLQueryProposalIdsRef.current = new Set();
              announce("New map review session started");
            }}
            onAnnounce={announce}
          />

          <MapLayoutDesignerPanel
            visible={showFigureComposer && !navigatorStageMode}
            overlayLayers={overlayLayers}
            qaState={scientificQA}
            bearing={bearing}
            onClose={() => {
              setShowFigureComposer(false);
              announce("Layout designer closed");
            }}
            onExportBook={(_book) => {
              setShowFigureComposer(false);
              setShowMapExportDialog(true);
              announce("Map book exported — opening publication export");
            }}
            onAnnounce={announce}
          />

          {/* 3D + Zoning toggle triggers — accessible via toolbar or testid */}
          <button
            type="button"
            data-testid="toggle-3d-panel"
            aria-label="Toggle 3D scene panel"
            style={{ display: "none" }}
            onClick={() => setShow3DPanel((p) => !p)}
          />
          <button
            type="button"
            data-testid="toggle-zoning-panel"
            aria-label="Toggle zoning rules panel"
            style={{ display: "none" }}
            onClick={() => setShowZoningPanel((p) => !p)}
          />
          <button
            type="button"
            data-testid="toggle-massing-panel"
            aria-label="Toggle massing scenarios panel"
            style={{ display: "none" }}
            onClick={() => setShowMassingPanel((p) => !p)}
          />
          <button
            type="button"
            data-testid="toggle-sunshadow-panel"
            aria-label="Toggle sun/shadow analysis panel"
            style={{ display: "none" }}
            onClick={() => setShowSunShadowPanel((p) => !p)}
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

          {show3DPanel && !navigatorStageMode && (
            <Scene3DPanel
              visible
              onClose={() => {
                setShow3DPanel(false);
                announce("3D scene panel closed");
              }}
              onModeChange={(mode) => announce(`3D mode: ${mode}`)}
            />
          )}

          {showZoningPanel && !navigatorStageMode && (
            <ZoningRulesPanel
              visible
              onClose={() => {
                setShowZoningPanel(false);
                announce("Zoning rules panel closed");
              }}
              selectedParcelId={selectedFeatureIds[0] ?? null}
            />
          )}

          {showMassingPanel && !navigatorStageMode && (
            <MassingScenarioPanel
              visible
              onClose={() => {
                setShowMassingPanel(false);
                announce("Massing scenarios panel closed");
              }}
              parcelId={selectedFeatureIds[0] ?? null}
            />
          )}

          {showSunShadowPanel && !navigatorStageMode && (
            <SunShadowPanel
              visible
              onClose={() => {
                setShowSunShadowPanel(false);
                announce("Sun/shadow analysis panel closed");
              }}
            />
          )}

          <Scene3DInteractionStrip visible={showInteractionStrip && !navigatorStageMode} />

          {showComparisonStrip && !navigatorStageMode && (
            <ScenarioComparisonStrip
              visible
              onClose={() => {
                setShowComparisonStrip(false);
                announce("Scenario comparison strip closed");
              }}
            />
          )}

          <MapPanelErrorBoundary
            panelName="Render diagnostics"
            resetKey={showPerformanceDiagnostics}
            onClose={() => {
              setShowPerformanceDiagnostics(false);
              announce("Performance diagnostics closed");
            }}
          >
            <MapPerformanceDiagnosticsPanel
              visible={showPerformanceDiagnostics && !navigatorStageMode}
              diagnostics={performanceDiagnostics}
              onRetryWorkerJob={handleRetryWorkerJob}
              onClose={() => {
                setShowPerformanceDiagnostics(false);
                announce("Performance diagnostics closed");
              }}
            />
          </MapPanelErrorBoundary>

          <MapPanelErrorBoundary
            panelName="Plugin registry"
            resetKey={showPluginPanel}
            onClose={() => {
              setShowPluginPanel(false);
              announce("Plugin registry closed");
            }}
          >
            <MapPluginPanel
              visible={showPluginPanel && !navigatorStageMode}
              extensions={pluginExtensions}
              onClose={() => {
                setShowPluginPanel(false);
                announce("Plugin registry closed");
              }}
            />
          </MapPanelErrorBoundary>

          <MapPanelErrorBoundary
            panelName="Processing toolbox"
            resetKey={showProcessingToolbox}
            onClose={() => {
              setShowProcessingToolbox(false);
              announce("Processing toolbox closed");
            }}
          >
            <MapProcessingToolboxPanel
              visible={showProcessingToolbox && !navigatorStageMode}
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

          <MapPanelErrorBoundary
            panelName="Model builder"
            resetKey={showModelBuilder}
            onClose={() => {
              setShowModelBuilder(false);
              announce("Model builder closed");
            }}
          >
            <MapModelBuilderPanel
              visible={showModelBuilder && !navigatorStageMode}
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

          <MapPanelErrorBoundary
            panelName="Catalog"
            resetKey={showCatalog}
            onClose={() => {
              setShowCatalog(false);
              announce("Catalog closed");
            }}
          >
            <MapCatalogPanel
              visible={showCatalog && !navigatorStageMode}
              sourceHandles={sourceHandles}
              layers={overlayLayers}
              onClose={() => {
                setShowCatalog(false);
                announce("Catalog closed");
              }}
              onBrowseSources={handleCatalogBrowseSources}
              onAddDemoPack={handleCatalogAddDemoPack}
              onRepairSource={handleCatalogRepairSource}
              onReconnectSource={handleCatalogReconnectSource}
              onAddConnection={handleCatalogAddConnection}
            />
          </MapPanelErrorBoundary>

          <MapPanelErrorBoundary
            panelName="Contents"
            resetKey={showContents}
            onClose={() => {
              setShowContents(false);
              announce("Contents tree closed");
            }}
          >
            <MapContentsTreePanel
              visible={showContents && !navigatorStageMode}
              layers={overlayLayers}
              zoom={zoom}
              onClose={() => {
                setShowContents(false);
                announce("Contents tree closed");
              }}
              onUpdateLayer={updateLayerMetadata}
              onDuplicateLayer={handleDuplicateContentsLayer}
              onRepairSource={handleRepairContentsSource}
              onOpenProperties={handleInspectLayer}
              onToggleVisibility={toggleLayerVisibility}
              onReorderLayers={reorderLayers}
            />
          </MapPanelErrorBoundary>

          <WorkflowPreviewOverlay preview={effectiveShowWorkflowDrawer ? workflowPreview : null} />

          <ScientificQAPanel
            visible={effectiveShowScientificQAPanel}
            qaState={scientificQA}
            overlayLayers={overlayLayers}
            presentation={dockLayout.compactDock ? "bottom-drawer" : "right-rail"}
            width={dockLayout.rightPanelWidth}
            onWidthChange={handleRightPanelWidthChange}
            onClose={() => {
              setShowScientificQAPanel(false);
              announce("Scientific QA panel closed");
            }}
            onShowDetails={(issue) => {
              announce(`Scientific QA details opened for ${issue.title}`);
            }}
          />

          <MapNLQueryPanel
            visible={effectiveShowNLQueryPanel}
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
            visible={effectiveShowWorkflowDrawer}
            context={workflowContext}
            initialDraftRequest={urbanWorkflowDraftRequest}
            presentation={dockLayout.compactDock ? "bottom-drawer" : "right-rail"}
            width={dockLayout.rightPanelWidth}
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

          {!effectiveShowLayerPanel && !navigatorStageMode ? (
            <button
              type="button"
              style={mapStyles.layerPanelOpenButton}
              onClick={() => {
                setShowLayerPanel(true);
                announce("Layer panel opened");
              }}
              aria-label={`Open layer panel — ${overlayLayers.length} overlay layer${overlayLayers.length !== 1 ? "s" : ""}`}
            >
              <IconLayers size={MAP_ICON_SIZES.sm} />
              Layers{overlayLayers.length > 0 ? ` (${overlayLayers.length})` : ""}
            </button>
          ) : null}

          {temporalLayers.length > 1 ? (
            <div
              style={mapStyles.temporalSelector}
              role="group"
              aria-label="Temporal layer selector"
            >
              <span
                style={mapStyles.temporalLabel}
              >
                Temporal Layer
              </span>

              {temporalLayers.length > 1 ? (
                <select
                  aria-label="Select temporal analysis layer"
                  value={activeTemporalLayer?.id ?? ""}
                  onChange={handleTemporalLayerSelection}
                  style={mapStyles.temporalSelect}
                >
                  {temporalLayers.map((layer) => (
                    <option key={layer.id} value={layer.id}>{layer.name}</option>
                  ))}
                </select>
              ) : (
                <span
                  style={mapStyles.temporalLayerName}
                >
                  {activeTemporalLayer?.name}
                </span>
              )}

              <span
                style={mapStyles.temporalMeta}
              >
                {activeTemporalLayer?.metadata?.analysisResult?.visualization.temporalFrames?.length ?? 0} frames loaded
              </span>
            </div>
          ) : null}

          {activeTemporalLayer ? (
            <MapTemporalPlayer
              map={mapInstanceRef.current}
              frames={activeTemporalLayer.metadata?.analysisResult?.visualization.temporalFrames ?? []}
              timeProperty={activeTemporalLayer.metadata?.analysisResult?.visualization.timeProperty ?? "timestamp"}
              sourceId={activeTemporalLayer.id}
              layerId={activeTemporalLayer.id}
              layerName={activeTemporalLayer.name}
              visible={open}
            />
          ) : null}

          {open && temporalStoreFrameCount > 0 ? (
            <div
              data-testid="temporal-player-panel-host"
              style={{
                position: "absolute",
                left: "50%",
                bottom: "1rem",
                transform: "translateX(-50%)",
                zIndex: 6,
                maxWidth: "min(46rem, 92%)",
              }}
            >
              <TemporalPlayerPanel visible />
            </div>
          ) : null}

          <MapContextMenu
            mapRef={mapInstanceRef}
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
            mapRef={mapInstanceRef}
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
            mapRef={mapInstanceRef}
            overlayLayers={overlayLayers}
            visible={showChoroplethPanel && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
            onClose={() => setShowChoroplethPanel(false)}
            onAnnounce={announce}
          />

          <MapClusterViz
            mapRef={mapInstanceRef}
            overlayLayers={overlayLayers}
            visible={showClusterViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
            onClose={() => setShowClusterViz(false)}
            onAnnounce={announce}
          />

          <MapHotSpotViz
            mapRef={mapInstanceRef}
            overlayLayers={overlayLayers}
            visible={showHotSpotViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
            onClose={() => setShowHotSpotViz(false)}
            onAnnounce={announce}
          />

          <MapEmergingHotSpotViz
            overlayLayers={overlayLayers}
            visible={showEmergingHotSpotViz && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel}
            onClose={() => setShowEmergingHotSpotViz(false)}
            onAnnounce={announce}
          />

          {showVoxCityOverlay && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel ? (
            <MapVoxCityOverlay
              mapRef={mapInstanceRef}
              panelVisible={showVoxCityOverlay}
              onPanelClose={() => {
                setShowVoxCityOverlay(false);
                announce("VoxCity 2D overlay closed");
              }}
              onAnnounce={announce}
              onExternalImportProgress={handleExternalServiceProgress}
            />
          ) : null}

          {pointSymbologyLayerId && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel ? (
            <div
              style={{
                ...createOpaqueFloatingPanelStyle(MAP_DIMENSIONS.symbologyPanelWidth),
                ...symbologyPanelDrag.panelPositionStyle,
              }}
              role="dialog"
              aria-label="Point symbology configuration"
            >
              <div
                style={{ ...mapStyles.symbologyHeader, ...symbologyPanelDrag.dragHandleStyle }}
                {...symbologyPanelDrag.dragHandleProps}
              >
                <div>
                  <div
                    style={mapStyles.symbologyEyebrow}
                  >
                    Symbology
                  </div>
                  <div style={mapStyles.symbologyLayerName}>
                    {selectedPointSymbologyLayer?.name ?? "Point layer"}
                  </div>
                </div>

                <button
                  type="button"
                  style={mapStyles.symbologyCloseButton}
                  onClick={() => setPointSymbologyLayerId(null)}
                  aria-label="Close symbology panel"
                >
                  <IconClose size={MAP_ICON_SIZES.md} />
                </button>
              </div>

              <div
                style={mapStyles.symbologyModeGrid}
              >
                {(["heatmap", "proportional", "graduated"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPointSymbologyMode(mode)}
                    style={{
                      ...mapStyles.symbologyModeButton,
                      ...(pointSymbologyMode === mode ? mapStyles.symbologyModeButtonActive : {}),
                    }}
                    aria-pressed={pointSymbologyMode === mode}
                  >
                    {mode === "heatmap" ? "Heatmap" : mode === "proportional" ? "Proportional" : "Graduated"}
                  </button>
                ))}
              </div>

              <div style={mapStyles.symbologyBody}>
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
                  <div style={mapStyles.symbologyError}>
                    {pointSymbologyError}
                  </div>
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
            </div>
          ) : null}

          {/* Drawing manager + sidebar (right side) */}
          {!navigatorStageMode ? (
            <MapDrawingManager
              mapRef={mapInstanceRef}
              activeDrawTool={activeDrawTool}
              sidebarVisible={effectiveShowDrawPanel}
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

          {/* Measurement tool + sidebar */}
          {effectiveShowMeasurePanel ? (
            <MapMeasurementTool
              mapRef={mapInstanceRef}
              activeMeasureTool={activeMeasureTool}
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
        </MapCanvasRegion>

        <MapBottomTimeline timelineSlot={bottomTimelineSlot} data-testid="map-bottom-timeline">
          <div ref={statusBarRef}>
            <MapStatusBarWithCursor
              ref={statusCursorRef}
              zoom={zoom}
              projectId={selectedProjectId}
              workspaceLabel={workspaceView}
              layerCount={overlayLayers.length}
              visibleLayerCount={overlayLayers.filter((layer) => layer.visible).length}
              pinCount={pins.length}
              drawnFeatureCount={drawnFeatures.length}
              measurementCount={measurements.length}
              measureUnit={measureUnit}
              crs="EPSG:4326"
              syncStatus={viewportSyncStatus}
              selectedFeatureCount={contextSummary.selection.totalSelectedFeatures}
              hasActiveAoi={Boolean(contextSummary.activeAoi)}
              qaStatus={contextSummary.qa.status}
              qaIssueCount={scientificQAIssueCount}
              qaBlockerCount={scientificQABlockerCount}
              performanceMode={performanceDiagnostics.renderMode}
              performanceIssueCount={performanceIssueCount}
              lastRenderDurationMs={performanceDiagnostics.lastRenderTiming?.durationMs ?? null}
              isSaving={isSavingProject}
              isLoading={isLoadingProject}
              lastSavedAt={lastSavedAt}
              autoSaveEnabled={autoSaveEnabled}
              style={{ transition: transitionStyle }}
            />
          </div>
        </MapBottomTimeline>

        <MapDataExportDialog
          open={showExportDialog}
          format={exportFormat}
          target={exportTarget}
          precision={exportPrecision}
          prettyPrint={exportPrettyPrint}
          includeProperties={exportIncludeProperties}
          onFormatChange={setExportFormat}
          onTargetChange={setExportTarget}
          onPrecisionChange={(precision) => setExportPrecision(Number.isFinite(precision) ? Math.max(0, Math.min(12, precision)) : 6)}
          onPrettyPrintChange={setExportPrettyPrint}
          onIncludePropertiesChange={setExportIncludeProperties}
          onClose={() => setShowExportDialog(false)}
          onExport={() => {
            void handleExportConfirm();
          }}
        />

        <MapExportDialog
          open={showMapExportDialog}
          compositionOptions={mapCompositionOptions}
          legendAvailable={visiblePublicationLayers.length > 0}
          visibleLayerCount={visiblePublicationLayers.length}
          readiness={mapPublicationReadiness}
          previewUrl={mapExportPreviewUrl}
          isGeneratingPreview={isGeneratingMapExportPreview}
          isExporting={isExportingMapImage}
          onCompositionChange={handleMapCompositionChange}
          onClose={() => setShowMapExportDialog(false)}
          onOpenManifestInIde={handleOpenMapManifestInIde}
          onOpenExportNoteInIde={handleOpenExportNoteInIde}
          onExport={() => {
            void handleMapExportConfirm();
          }}
        />

        <MapDataImportHubDialog
          open={showImportHub}
          loadingDatasetId={loadingTeachingDatasetId}
          onClose={() => setShowImportHub(false)}
          onBrowseLocalFiles={handleBrowseLocalFiles}
          onLoadDataset={handleTeachingDatasetImport}
        />

        <MapImportPreviewDialog
          open={pendingImportPreview != null}
          profile={pendingImportPreview?.profile ?? null}
          onClose={clearPendingImportPreview}
          onImport={pendingImportPreview?.result ? () => {
            void handleImportPreviewConfirm();
          } : undefined}
        />

        <MapCsvImportDialog
          open={pendingCsvImport != null}
          session={pendingCsvImport}
          latitudeColumn={csvLatitudeColumn}
          longitudeColumn={csvLongitudeColumn}
          onLatitudeColumnChange={setCsvLatitudeColumn}
          onLongitudeColumnChange={setCsvLongitudeColumn}
          onClose={clearPendingCsvImport}
          onImport={() => {
            void handleCsvImportConfirm();
          }}
        />

        <MapColumnarImportDialog
          open={pendingColumnarImport != null}
          session={pendingColumnarImport}
          onClose={clearPendingColumnarImport}
          onImport={() => {
            void handleColumnarImportConfirm();
          }}
        />

    </MapWorkspaceShell>,
    document.body,
  );
};
