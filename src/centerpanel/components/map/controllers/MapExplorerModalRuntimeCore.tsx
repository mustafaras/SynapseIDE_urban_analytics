import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type maplibregl from 'maplibre-gl';
import { Maximize2 } from 'lucide-react';
import type { FeatureCollection, Geometry } from 'geojson';
import { BASE_STYLES, type DrawnFeature, type DrawToolId, type LayerQaStatus, type LayerSchemaFieldSummary, type LayerScientificQABadge, MAP_BOOKMARK_LIMIT, MAP_LAYER_REGISTRY_EVENT, type MapBookmark, type MapEvidenceArtifact, type MapExplorerMode, type MapLayerRegistryChangeDetail, type MapPin, type MeasureToolId, type OverlayLayerConfig } from '../mapTypes';
import { resolveOverlayLayerCrsSummary } from '../mapLayerMetadata';
import { applyMapCommand, type MapActionEffects, redoMapCommand, revertMapCommand } from '@/services/map/actions/MapActionExecutor';
import { createMapActionHistory, findRedoableEntry, findRevertableEntry, findUndoableEntry, type MapActionHistory, type MapActionHistoryEntry, markMapActionRedone, markMapActionUndone, recordMapActionHistoryEntry, summarizeMapUndoRedo } from '@/services/map/actions/MapActionHistoryService';
import { type GisStatusKey, MAP_COLORS, MAP_ICON_SIZES, MAP_RADIUS, MAP_SPACING, MAP_STROKES, MAP_TYPOGRAPHY, mapStyles } from '../mapTokens';
import { MAP_LAYOUT_TOKENS } from '../mapLayoutTokens';
import { MapCanvas } from '../MapCanvas';
import { MapScaleIndicator } from '../MapScaleIndicator';
import { MapNavExtras } from '../MapNavExtras';
import { MapCanvasControls } from '../MapCanvasControls';
import { MapTopCommandSurface } from '../MapTopCommandSurface';
import { MapToolbar } from '../MapToolbar';
import { ToolbarButton } from '../ContextToolbar';
import { GisEmptyState, GisIconButton, GisStatusChip } from '../ui';
import { SAMPLE_BUILDINGS } from '@/features/urbanAnalytics/voxcity';
import type { SymbolMode } from '../../MapSymbolLayer';
import { type TemporalFrameExportPayload, useTemporalLayerStore } from '@/stores/useTemporalLayerStore';
import { useRasterLayerStore } from '@/stores/useRasterLayerStore';
import { mergeTemporalEvidenceIntoMetadata, type TemporalFrameDefinition } from '@/services/map/temporal';
import { selectScene3DActiveLayerCrs, selectScene3DBuildings, selectScene3DCityModelSourceHandle, selectScene3DMode, selectScene3DTerrainSourceHandle, useScene3DStore } from '@/stores/useScene3DStore';
import type { MapServiceDialogProgressDetail } from '../../MapServiceDialog';
import { MapBookmarkBar } from '../../MapBookmarkBar';
import { MapSearchBar } from '../MapSearchBar';
import { MapBottomTimeline, MapCanvasRegion, MapWorkspaceShell } from '../MapWorkspaceShell';
import { type MapAnalyzeTabId } from '../analyze';
import { type MapStyleTabId } from '../style';
import { type LayerStyleUpdate } from '../inspector/style/legendContract';
import { type MapSceneTabId } from '../scene';
import { type MapPublishReadinessItem, type MapPublishTabId } from '../publish';
import { MapBottomPanelScrollBody, type MapBottomPanelTask, MapBottomPanelTasksBody } from '../bottom';
import { buildMapProblemsModel, MapProblemsPanel, type MapProblemRow } from '../problems';
import type { MapNLQueryPanelRunSummary } from '../MapNLQueryPanel';
import { MapSelectionTools, type SelectionDragTool } from '../MapSelectionTools';
import { summarizeDrawnGeometryValidation, validateDrawnGeometry } from '@/services/map/DrawnGeometryValidation';
import { MapReviewTimelinePanel } from '../MapReviewTimelinePanel';
import type { ProcessingToolboxLayerOption } from '../processing';
import { buildDemoPackCatalogInsertion } from '../catalog';
import { applyContentsToRenderLayers } from '../contents';
import { createMapProcessingRegistry, previewProcessingTool, runProcessingTool } from '../../../../services/map/processing';
import { createMapExtensionRegistry } from '../../../../services/map/plugins';
import { buildMapModelCodeArtifactRequest, executeMapModel, executeMapModelBatch, type MapModelBatchResult, type MapModelBatchTarget, type MapModelDefinition, type MapModelRunResult } from '../../../../services/map/model';
import { type AttrFeature, type MapAttributeDerivedFieldDraft } from '../table/MapAttributeTable';
import { MapAttributeWorkflowPanel } from '../table/MapAttributeWorkflowPanel';
import type { MapInspectorHostContext } from '../inspector';
import { createMapWorkflowResultEvidenceArtifact } from '../mapEvidenceArtifacts';
import { useDraggableMapPanel } from '../useDraggableMapPanel';
import { type MapRightDockPanel } from '../mapDocking';
import { createMapRightDockRoute, getMapRightDockPanelDefinition, MAP_RIGHT_DOCK_PANEL_IDS, type MapRightDockRouteSource } from '../mapRightDockRoutes';
import { type MapWorkspaceView } from '../mapExperience';
import { createInitialMapStartDialogState, dismissMapStartDialog, hasMapStartDialogWorkspaceContent, type MapStartDialogHandoff, type MapStartDialogState } from '../mapStartDialogState';
import { selectMapExplorerContextSummary } from '../mapContextSummary';
import { DEFAULT_MAP_EXPLORER_LAYOUT_PREFERENCES, useMapExplorerStore } from '../../../../stores/useMapExplorerStore';
import { useMapKeyboardControls } from '../useMapKeyboardControls';
import { useAnnouncer } from '../useAnnouncer';
import { useMapAoiDispatch } from '../useMapAoiDispatch';
import { useLayerSync } from '../useLayerSync';
import { useMapPanelCommands } from '../useMapPanelCommands';
import { useMapCommandHandlers } from './useMapCommandHandlers';
import { useMapExplorerLifecycle } from './useMapExplorerLifecycle';
import { useMapExplorerRuntimeStores } from './useMapExplorerRuntimeStores';
import { useMapDataOutputController } from './useMapDataOutputController';
import { useMapPanelLayout } from './useMapPanelLayout';
import { useMapImportExportState } from './useMapImportExportState';
import { useMapPerformanceRuntime } from './useMapPerformanceRuntime';
import { useMapReportController } from './useMapReportController';
import { useMapProjectPersistenceController } from './useMapProjectPersistenceController';
import { useMapProjectPersistenceState } from './useMapProjectPersistenceState';
import { useMapRightDockRouting } from './useMapRightDockRouting';
import { useMapActivityRailSelection } from './useMapActivityRailSelection';
import { useMapActivityRailItems } from './useMapActivityRailItems';
import { useMapWorkflowController } from './useMapWorkflowController';
import { MapExplorerDialogStack } from './MapExplorerDialogStack';
import { MapActivityRailPresenter } from './MapActivityRailPresenter';
import { MapCanvasOverlayChrome } from './MapCanvasOverlayChrome';
import { MapExplorerLayerPanelRail } from './MapExplorerLayerPanelRail';
import { MapFlowDispatchDialog } from './MapFlowDispatchDialog';
import { MapExplorerModalRuntimeView } from './MapExplorerModalRuntimeView';
import { MapNavigatorStageView } from './MapNavigatorStageView';
import { MapPointSymbologyFloatingPanel } from './MapPointSymbologyFloatingPanel';
import { MapRightDockBodyContent } from './MapRightDockBodyContent';
import { buildMapRuntimeRenderModel } from './buildMapRuntimeRenderModel';
import { type MapStatusBarCursorHandle, MapStatusBarWithCursor } from './MapStatusBarWithCursor';
import {
  MAP_BOTTOM_OUTPUT_DRAWER_DEFAULT_HEIGHT,
  MAP_BOTTOM_OUTPUT_DRAWER_MAX_HEIGHT,
  MAP_BOTTOM_OUTPUT_DRAWER_MIN_HEIGHT,
  MAP_BOTTOM_OUTPUT_DRAWER_TABS,
  MapBottomOutputDrawer,
  type MapBottomOutputDrawerTabId,
} from '../shell';
import { buildDrawingSnapSources, buildDrawnAoiFromWorkflowResult, filterFeatureCollectionToBounds, getFeatureBounds, getLayerFitBounds, getSelectedFeatureFitBounds, hasPolygonGeometry, isPolygonLayerCandidate, matchesSpatialStatsOutput, mergeBounds, replaceSpatialStatsOutput, resolveFlowDispatchAoiCandidate } from './mapExplorerSpatialHelpers';
import { publishTabLabel } from './mapExplorerPublishHelpers';
import { buildTemporalFrameDefinitions, collectTemporalSourceFields, resolvePublishTabId, resolveTemporalRuntimeMode, sceneVerticalDatumValue, sourceHandleCrs } from './mapExplorerSceneHelpers';
import { type DispatchFeedbackState, MAP_RENDER_ERROR_NOTICE_COOLDOWN_MS, type MapProjectSaveTrigger, restoreFocusToElement, sameMapProjectSaveTrigger } from './mapExplorerControllerHelpers';
import { IconClose } from '../MapIcons';
import { getRuntimeMapActivityDefinition, getRuntimeMapTaskLensDefinition, type MapActivityId, type MapTaskLensId } from '../mapActivityRuntime';
import { contextBarDividerStyle, contextToolbarCountStyle, MAP_ACTIVITY_RAIL_WIDTH, MAP_NAVIGATOR_STAGE_MARGIN, mapActivityRailOverlayStyle, modalControlCloseButtonStyle, modalControlCloseDividerStyle, modalControlClusterStyle, srOnlyFocusable } from './mapExplorerRuntimeShellUi';
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion';
import { buildFeatureCollectionMetadata, getFeatureCollectionBounds, MAP_IMPORT_ACCEPT_ATTRIBUTE } from '../../../../services/map/MapDataImporter';
import { collectNumericFields, hasPointGeometry, isPointCandidate, resolveFeatureCollection } from '../symbologyUtils';
import { buildMapPerformanceDiagnostics } from '../../../../services/map/MapPerformanceDiagnostics';
import { recordMapTelemetryEvent } from '../../../../services/map/observability';
import { bindTableAlias, loadGeoJSON, toGeoJSON } from '../../../../engine/spatial-db/SpatialDB';
import { buildMapCompositionLegendItems, buildMapPublicationReadiness } from '../../../../services/map/MapExportService';
import { attachSpatialStatsRerun, createAnalysisCompletedRun, createAnalysisMapOutput, createSpatialStatsCompletedRun, hasAnalysisRerun, rerunAnalysisResult } from '../../../../services/map/MapEngineAdapter';
import { buildBufferedPointBounds, dispatchRecommendationFlow, getCompatibleAoiFlows, type SelectionStatisticsSummary, setMapViewRestriction } from '../../../../services/map/MapAnalysisDispatcher';
import { resolveMapAnalysisBounds } from '../../../../services/map/MapAnalysisBounds';
import { publishViewportSync, setViewportSyncEnabled, subscribeToViewportSync, useViewportSyncStore } from '../../../../services/map/MapSyncService';
import { sendMapContextToUrban } from '../../../../services/map/MapToUrbanContextAdapter';
import { createSpatialStatsExecutionIdentity } from '../../../../services/map/SpatialStatsExecutionService';
import { executeHotSpotSpatialStatsAsync } from '../../../../services/map/SpatialStatsExecutionQueue';
import { evaluateAnalysisQAGate, evaluateMapScientificQA, evaluateMapScientificQASync } from '../../../../services/map/MapScientificQA';
import { previewLayerTopologyRepair } from '../../../../services/map/topology/TopologyRepairService';
import { buildMapNLQueryAuditDetails, buildMapNLQueryContext, executeMapNLQueryPreview, type MapNLQueryPreview } from '../../../../services/map/MapNLQueryBuilder';
import type { MapQueryExecutionResult } from '../../../../services/map/query/MapQueryPlanner';
import { buildMapAIProposalReviewEvent, mapAIGuardrailDetails } from '../../../../services/map/MapAIGuardrails';
import { buildMapWorkflowContext, buildMapWorkflowPreviewLayer, executeMapWorkflow, type MapWorkflowApplyResult, type MapWorkflowExecutionHandle, type MapWorkflowExecutionUpdate, type MapWorkflowPreview, type MapWorkflowReportItem } from '../../../../services/map/MapWorkflowService';
import { createMapWorkflowWorkerExecutor } from '../../../../services/map/geometry/mapWorkflowWorkerExecutor';
import { buildExportPackageNoteRequest, buildMapManifestRequest, buildSqlQueryRequest, buildWorkflowScriptRequest, dispatchMapCodeArtifactRequest, type MapCodeArtifactRequest } from '../../../../services/map/MapCodeArtifactRequestService';
import { type UrbanToMapMethodRequestPayload, type UrbanToMapMethodRequestPreview } from '../../../../services/map/bridge/MapUrbanBridgeService';
import { generateMapAnalysisRecommendations, type MapAnalysisRecommendation, type MapAnalysisUrbanContextSummary } from '../../../../services/map/MapAnalysisRecommender';
import { applyMapContextToUrban } from '../../../../features/urbanAnalytics/context/mapContextAdapter';
import { buildMapReportHandoffDraft } from '../../../../services/map/MapReportHandoffService';
import { buildLayerRegistryReviewEvent, buildMapReviewContextSnapshot, buildRecommendationActionReviewEvent, buildRecommendationReviewEvent, buildScientificQAReviewEvent, type MapReviewTimelineEventInput } from '../../../../services/map/MapReviewSessionService';
import { getMapReviewCollaborationConnectionBadge, MAP_REVIEW_COLLABORATION_SCHEMA_VERSION, type MapReviewCollaborationSnapshot } from '../../../../services/map/collaboration/MapReviewCollaborationService';
import { applyCartographyRecommendationToLayer, generateMapCartographyReview, type MapCartographyRecommendation } from '../../../../services/map/MapCartographyAdvisor';
import { toastError, toastInfo, toastSuccess, toastWarning } from '../../../../ui/toast/api';
import { isBackgroundTaskCancelledError } from '../../../../workers/pool';

const LazyMapReportHandoffDrawer = React.lazy(async () => {
  const module = await import('../MapReportHandoffDrawer');
  return { default: module.MapReportHandoffDrawer };
});

const LazyMapInspectorHost = React.lazy(async () => {
  const module = await import('../inspector/MapInspectorHost');
  return { default: module.MapInspectorHost };
});
type NumericFieldInfo = import('../symbologyUtils').NumericFieldInfo;

interface CartographyUndoEntry {
  recommendationId: string;
  layerId: string;
  label: string;
  beforeLayer: OverlayLayerConfig;
}

const outputDrawerStackStyle: React.CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: MAP_SPACING.md,
  minHeight: '100%',
  minWidth: 0,
};

const outputDrawerSectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: MAP_SPACING.sm,
  minWidth: 0,
  paddingBottom: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const outputDrawerSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const outputDrawerEyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: 'uppercase',
};

const outputDrawerTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
};

const outputDrawerRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'start',
  gap: MAP_SPACING.md,
  minWidth: 0,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgWorkspace,
};

const outputDrawerRowTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const outputDrawerRowMetaStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const outputDrawerRowDetailStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  overflowWrap: 'anywhere',
};

function OutputDrawerSection({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section style={outputDrawerSectionStyle}>
      <div style={outputDrawerSectionHeaderStyle}>
        <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
          {eyebrow ? <span style={outputDrawerEyebrowStyle}>{eyebrow}</span> : null}
          <h3 style={outputDrawerTitleStyle}>{title}</h3>
        </div>
        {meta}
      </div>
      {children}
    </section>
  );
}

function formatOutputDrawerTimestamp(value: string | null | undefined): string {
  if (!value) return 'not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'not recorded';
  return parsed.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function evidenceStateStatus(state: MapEvidenceArtifact['state']): GisStatusKey {
  switch (state) {
    case 'active':
    case 'published':
      return 'ready';
    case 'blocked':
      return 'blocked';
    case 'stale':
      return 'stale';
    case 'archived':
      return 'metadata-only';
    case 'draft':
    default:
      return 'unknown';
  }
}

function evidenceQaStatus(state: MapEvidenceArtifact['qa']['state']): GisStatusKey {
  switch (state) {
    case 'passed':
      return 'ready';
    case 'warning':
      return 'caveat';
    case 'error':
    case 'blocked':
      return 'blocked';
    case 'unchecked':
    default:
      return 'unknown';
  }
}

function MapEvidenceArtifactsDrawerBody({ artifacts }: { artifacts: readonly MapEvidenceArtifact[] }): React.ReactElement {
  if (artifacts.length === 0) {
    return (
      <MapBottomPanelScrollBody padding={12}>
        <GisEmptyState
          title="No evidence artifacts"
          description="Workflow outputs, QA findings, exports, and report snapshots will appear here after they are registered."
          compact
        />
      </MapBottomPanelScrollBody>
    );
  }

  const recentArtifacts = [...artifacts]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, 20);

  return (
    <MapBottomPanelScrollBody padding={12} data-testid="map-output-drawer-evidence-body">
      <div style={outputDrawerStackStyle}>
        <OutputDrawerSection
          eyebrow="Evidence"
          title="Registered artifact references"
          meta={<GisStatusChip status="metadata-only" label={`${artifacts.length.toLocaleString()} total`} density="compact" />}
        >
          <div role="list" aria-label="Map evidence artifacts" style={{ display: 'grid', gap: MAP_SPACING.sm }}>
            {recentArtifacts.map((artifact) => (
              <article key={artifact.id} role="listitem" style={outputDrawerRowStyle}>
                <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                  <span title={artifact.title} style={outputDrawerRowTitleStyle}>{artifact.title}</span>
                  <span style={outputDrawerRowMetaStyle}>
                    {artifact.kind} / {artifact.sourceModule} / updated {formatOutputDrawerTimestamp(artifact.updatedAt)}
                  </span>
                  {artifact.summary ? <span style={outputDrawerRowDetailStyle}>{artifact.summary}</span> : null}
                  <span style={outputDrawerRowMetaStyle}>
                    layers {artifact.linkedLayerIds.length.toLocaleString()} / qa issues {artifact.qa.issueCount.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'end', gap: MAP_SPACING.xs }}>
                  <GisStatusChip status={evidenceStateStatus(artifact.state)} label={artifact.state} density="compact" />
                  <GisStatusChip status={evidenceQaStatus(artifact.qa.state)} label={`qa ${artifact.qa.state}`} density="compact" />
                </div>
              </article>
            ))}
          </div>
        </OutputDrawerSection>
      </div>
    </MapBottomPanelScrollBody>
  );
}

function MapRuntimeLogsDrawerBody({
  tasks,
  telemetryEvents,
  warnings,
}: {
  tasks: readonly MapBottomPanelTask[];
  telemetryEvents: readonly {
    id: string;
    severity: 'info' | 'warning' | 'error';
    source: string;
    message: string;
    createdAt: string;
    recoverable: boolean;
  }[];
  warnings: readonly string[];
}): React.ReactElement {
  const recentTelemetry = telemetryEvents.slice(-8).reverse();
  const hasLogContent = tasks.length > 0 || recentTelemetry.length > 0 || warnings.length > 0;

  if (!hasLogContent) {
    return (
      <MapBottomPanelScrollBody padding={12}>
        <GisEmptyState
          title="No runtime output"
          description="Background tasks, performance warnings, and redacted operational telemetry will appear here when available."
          compact
        />
      </MapBottomPanelScrollBody>
    );
  }

  return (
    <MapBottomPanelScrollBody padding={12} data-testid="map-output-drawer-logs-body">
      <div style={outputDrawerStackStyle}>
        <OutputDrawerSection
          eyebrow="Runtime"
          title="Background tasks"
          meta={<GisStatusChip status={tasks.some((task) => task.status === 'running') ? 'running' : tasks.length > 0 ? 'ready' : 'unknown'} label={`${tasks.length.toLocaleString()} tracked`} density="compact" />}
        >
          <MapBottomPanelTasksBody tasks={tasks} />
        </OutputDrawerSection>

        {warnings.length > 0 ? (
          <OutputDrawerSection
            eyebrow="Performance"
            title="Current warnings"
            meta={<GisStatusChip status="caveat" label={`${warnings.length.toLocaleString()} warning(s)`} density="compact" />}
          >
            <div role="list" aria-label="Performance warnings" style={{ display: 'grid', gap: MAP_SPACING.sm }}>
              {warnings.map((warning) => (
                <div key={warning} role="listitem" style={outputDrawerRowStyle}>
                  <span style={outputDrawerRowDetailStyle}>{warning}</span>
                  <GisStatusChip status="caveat" label="warning" density="compact" />
                </div>
              ))}
            </div>
          </OutputDrawerSection>
        ) : null}

        {recentTelemetry.length > 0 ? (
          <OutputDrawerSection
            eyebrow="Telemetry"
            title="Redacted operational events"
            meta={<GisStatusChip status={recentTelemetry.some((event) => event.severity === 'error') ? 'blocked' : recentTelemetry.some((event) => event.severity === 'warning') ? 'caveat' : 'ready'} label={`${recentTelemetry.length.toLocaleString()} recent`} density="compact" />}
          >
            <div role="list" aria-label="Operational telemetry events" style={{ display: 'grid', gap: MAP_SPACING.sm }}>
              {recentTelemetry.map((event) => {
                const status: GisStatusKey = event.severity === 'error' ? 'blocked' : event.severity === 'warning' ? 'caveat' : 'ready';
                return (
                  <article key={event.id} role="listitem" style={outputDrawerRowStyle}>
                    <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                      <span style={outputDrawerRowTitleStyle}>{event.message}</span>
                      <span style={outputDrawerRowMetaStyle}>{event.source} / {formatOutputDrawerTimestamp(event.createdAt)}</span>
                    </div>
                    <GisStatusChip status={status} label={event.recoverable ? `${event.severity} recoverable` : event.severity} density="compact" />
                  </article>
                );
              })}
            </div>
          </OutputDrawerSection>
        ) : null}
      </div>
    </MapBottomPanelScrollBody>
  );
}

function MapReportsDrawerBody({
  readinessItems,
  dataExportElement,
  reportElement,
  reviewPackageElement,
}: {
  readinessItems: readonly MapPublishReadinessItem[];
  dataExportElement: React.ReactNode;
  reportElement: React.ReactNode;
  reviewPackageElement: React.ReactNode;
}): React.ReactElement {
  const blockedCount = readinessItems.filter((item) => item.status === 'blocked').length;
  const caveatCount = readinessItems.filter((item) => item.status === 'caveat' || item.status === 'stale' || item.status === 'unknown').length;
  const readinessStatus: GisStatusKey = blockedCount > 0 ? 'blocked' : caveatCount > 0 ? 'caveat' : 'ready';

  return (
    <MapBottomPanelScrollBody padding={12} data-testid="map-output-drawer-reports-body">
      <div style={outputDrawerStackStyle}>
        <OutputDrawerSection
          eyebrow="Publish"
          title="Readiness"
          meta={<GisStatusChip status={readinessStatus} label={`${readinessItems.length.toLocaleString()} checks`} density="compact" />}
        >
          {readinessItems.length > 0 ? (
            <div role="list" aria-label="Publish readiness checks" style={{ display: 'grid', gap: MAP_SPACING.sm }}>
              {readinessItems.map((item) => (
                <article key={item.id} role="listitem" title={item.title} style={outputDrawerRowStyle}>
                  <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                    <span style={outputDrawerRowTitleStyle}>{item.label}</span>
                    <span style={outputDrawerRowDetailStyle}>{item.detail}</span>
                  </div>
                  <GisStatusChip status={item.status} label={item.status.replace(/-/g, ' ')} density="compact" />
                </article>
              ))}
            </div>
          ) : (
            <GisEmptyState
              title="No publish checks"
              description="Publish readiness will appear when map layers, export targets, or report metadata are available."
              compact
            />
          )}
        </OutputDrawerSection>
        <OutputDrawerSection eyebrow="Report" title="Report handoff">
          {reportElement}
        </OutputDrawerSection>
        <OutputDrawerSection eyebrow="Package" title="Review package">
          {reviewPackageElement}
        </OutputDrawerSection>
        <OutputDrawerSection eyebrow="Data" title="Data export">
          {dataExportElement}
        </OutputDrawerSection>
      </div>
    </MapBottomPanelScrollBody>
  );
}

/* ================================================================== */
/*  Visually-hidden style (skip-nav link)                              */
/* ================================================================== */

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

/* ================================================================== */
/*  Component — Shell (portal, overlay, layout grid)                   */
/* ================================================================== */

export const MapExplorerModal: React.FC<MapExplorerModalProps> = ({ open, onClose, mode = 'modal', mapCanvasRef, bottomTimelineSlot }) => {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const suppressViewportSyncPublishRef = useRef(false);
  const suppressViewportSyncTimerRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
  const lastMapRenderErrorRef = useRef<{ message: string; timestamp: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const statusBarRef = useRef<HTMLDivElement | null>(null);
  const bottomOutputDrawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const scientificQASequenceRef = useRef(0);
  const lastReviewQaSignatureRef = useRef<string | null>(null);
  const lastReviewRecommendationSignatureRef = useRef<string | null>(null);
  const recordedCopilotProposalIdsRef = useRef<Set<string>>(new Set());
  const recordedCopilotAuditIdsRef = useRef<Set<string>>(new Set());
  const recordedNLQueryProposalIdsRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef<{ lng: number; lat: number } | null>(null);
  const statusCursorRef = useRef<MapStatusBarCursorHandle | null>(null);
  const symbologyPanelDrag = useDraggableMapPanel();
  const mapCanvasId = 'map-explorer-canvas';

  /* ---- Accessibility hooks ---- */
  const { announce, AnnouncerRegion } = useAnnouncer();
  const reducedMotion = usePrefersReducedMotion();

  const { activeAoiId, activeAnalysisResultLayerIds, activeBaseLayer, activeDrawTool, activeFlow, activeMeasureTool, activeTaskLensId, activeTool, addDrawnFeature, addMapAnnotation, addMapBookmark, addMapReviewEvent, addMeasurement, addOverlayLayer, addPin, annotationToolSettings, annotations, appUser, autoSaveEnabled, bearing, bookmarks, center, clearDrawnFeatures, clearMapReviewSession, clearMeasurements, clearPins, clearProjectContent, clearSelectedFeatures, clearSourceHandles, completedRuns, contextSummary, copilotActionProposals, copilotAuditTrail, currentMapBounds, currentTimestep, drawnFeatures, layoutPreferences, mapEvidenceArtifacts, mapIsPlaying, mapPlaybackSpeed, mapStartDialogContext, measureUnit, measurements, moveMapAnnotation, overlayLayers, pins, pitch, removeDrawnFeature, removeMapAnnotation, removeMapBookmark, removeMeasurement, removeOverlayLayer, removePin, renameMapBookmark, reorderLayers, replaceOverlayLayers, restoreDefaultLayoutPreferences, restoreMapBookmark, restoreProjectState, reviewSession, scientificQA, selectedAnnotationId, selectedFeatureId, selectedFeatureIds, selectedProject, selectedProjectId, setActiveAnalysisResultLayers, setActiveDrawTool, setActiveMeasureTool, setActiveTool, setAnnotationToolSettings, setBaseLayer, setCurrentMapBounds, setCurrentTimestep, setIsPlaying, setLayerOpacity, setLayoutPreferences, setMeasureUnit, setPlaybackSpeed, setScientificQA, setSelectedAnnotationId, setSelectedFeatureId, setSelectedFeatures, setViewport, sourceHandles, toggleLayerVisibility, toolbarDensity, updateDrawnFeature, updateLayerMetadata, updateMapAnnotation, updateMapReviewEventStatus, upsertCompletedRun, upsertMapEvidenceArtifact, upsertSourceHandle, urbanContextSummary, viewportSyncEnabled, viewportSyncStatus, zoom } = useMapExplorerRuntimeStores();

  /* ---- Transient local state (not persisted) ---- */
  const [mapStartDialogState, setMapStartDialogState] = useState<MapStartDialogState>(() => createInitialMapStartDialogState(mapStartDialogContext));
  const initialWorkspaceView: MapWorkspaceView = 'explore';
  const initialActivityId: MapActivityId = 'layers';
  const [workspaceView, setWorkspaceView] = useState<MapWorkspaceView>(initialWorkspaceView);
  const [activeActivityId, setActiveActivityId] = useState<MapActivityId>(initialActivityId);
  const [workbenchSidebarTab, setWorkbenchSidebarTab] = useState<string>('layers-stack');
  const [bottomOutputDrawerOpen, setBottomOutputDrawerOpen] = useState(false);
  const [activeBottomOutputDrawerTabId, setActiveBottomOutputDrawerTabId] = useState<MapBottomOutputDrawerTabId>('attributes');
  const [bottomOutputDrawerHeight, setBottomOutputDrawerHeight] = useState(MAP_BOTTOM_OUTPUT_DRAWER_DEFAULT_HEIGHT);
  const closeMapStartDialog = useCallback(
    (action: MapStartDialogHandoff | 'dismiss' | 'close' | 'escape', announcement?: string) => {
      setMapStartDialogState(current => dismissMapStartDialog(current, action));
      if (announcement) {
        announce(announcement);
      }
    },
    [announce]
  );
  const handleMapExplorerCloseRequest = useCallback(() => {
    if (mapStartDialogState.open) {
      closeMapStartDialog('close', 'Map launch dialog dismissed');
      return;
    }
    onClose();
  }, [closeMapStartDialog, mapStartDialogState.open, onClose]);
  const handleMapExplorerEscapeRequest = useCallback(() => {
    if (mapStartDialogState.open) {
      closeMapStartDialog('escape', 'Map launch dialog dismissed');
      return;
    }
    onClose();
  }, [closeMapStartDialog, mapStartDialogState.open, onClose]);
  const dismissMapStartDialogForWorkspaceInteraction = useCallback(() => {
    if (!mapStartDialogState.open) {
      return;
    }
    closeMapStartDialog('continue');
  }, [closeMapStartDialog, mapStartDialogState.open]);
  const { trapRef } = useMapExplorerLifecycle({
    open,
    onClose: handleMapExplorerCloseRequest,
    onEscape: handleMapExplorerEscapeRequest,
  });
  useEffect(() => {
    if (!mapStartDialogState.open || !hasMapStartDialogWorkspaceContent(mapStartDialogContext)) {
      return;
    }
    setMapStartDialogState(current => dismissMapStartDialog(current, 'continue'));
  }, [mapStartDialogContext, mapStartDialogState.open]);
  const [workbenchSidebarCollapsed, setWorkbenchSidebarCollapsed] = useState(layoutPreferences.panelMode === 'collapsed');
  const [layersCartographyScopeId, setLayersCartographyScopeId] = useState<string | null>(null);
  const [styleWorkspaceLayerId, setStyleWorkspaceLayerId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLayerPanel, setShowLayerPanelState] = useState(layoutPreferences.panelMode !== 'collapsed');
  const setShowLayerPanel = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    next => {
      setShowLayerPanelState(current => {
        const resolved = typeof next === 'function' ? next(current) : next;
        if (resolved !== current) {
          setLayoutPreferences({ panelMode: resolved ? 'map-first' : 'collapsed' });
        }
        return resolved;
      });
    },
    [setLayoutPreferences]
  );
  const [showChoroplethPanel, setShowChoroplethPanel] = useState(false);
  const [showClusterViz, setShowClusterViz] = useState(false);
  const [showHotSpotViz, setShowHotSpotViz] = useState(false);
  const [showEmergingHotSpotViz, setShowEmergingHotSpotViz] = useState(false);
  const [showVoxCityOverlay, setShowVoxCityOverlay] = useState(false);
  const [showScientificQAPanel, setShowScientificQAPanel] = useState(false);
  const [activeUrbanMethodRequest, setActiveUrbanMethodRequest] = useState<UrbanToMapMethodRequestPayload | null>(null);
  const [activeUrbanMethodPreview, setActiveUrbanMethodPreview] = useState<UrbanToMapMethodRequestPreview | null>(null);
  const [showNLQueryPanel, setShowNLQueryPanel] = useState(false);
  const { showWorkflowDrawer, setShowWorkflowDrawer, workflowPreview, setWorkflowPreview, urbanWorkflowDraftRequest, setUrbanWorkflowDraftRequest, workflowGeocodedPlace, setWorkflowGeocodedPlace, setWorkflowReportItems } = useMapWorkflowController();
  const [showReviewTimeline, setShowReviewTimeline] = useState(false);
  const [showFigureComposer, setShowFigureComposer] = useState(false);
  const [showInteractionStrip, setShowInteractionStrip] = useState(false);
  const [showComparisonStrip, setShowComparisonStrip] = useState(false);
  const [showDrawPanel, setShowDrawPanel] = useState(false);
  const [showMeasurePanel, setShowMeasurePanel] = useState(false);
  const { activeRightDockRoute, bottomPanelReturnFocusRef, closeRightDockRoute, openDiagnosticsRightDock, openPerformanceRightDock, openRightDockPanel, switchRightDockRoute, toggleRightDockPanel } = useMapRightDockRouting({
    announce,
    closeMapStartDialog,
    mapStartDialogOpen: mapStartDialogState.open,
    setShowDrawPanel,
    setShowMeasurePanel,
    setShowReviewTimeline,
    setShowScientificQAPanel,
    setShowSidebar,
    setWorkspaceView,
    workspaceView,
  });

  const { handleRetryWorkerJob, performanceTimings, recordPerformanceTiming, telemetryEvents } = useMapPerformanceRuntime({
    announce,
    openDiagnosticsRightDock,
  });
  const handleTogglePerformanceDiagnostics = useCallback(() => {
    toggleRightDockPanel('performance', 'Performance diagnostics opened in the right dock', 'toolbar');
  }, [toggleRightDockPanel]);
  const openBottomOutputDrawer = useCallback(
    (tabId: MapBottomOutputDrawerTabId, announcement: string) => {
      const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
      bottomOutputDrawerReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      setActiveBottomOutputDrawerTabId(tabId);
      setBottomOutputDrawerOpen(true);
      announce(announcement);
    },
    [announce],
  );
  const closeBottomOutputDrawer = useCallback(() => {
    setBottomOutputDrawerOpen(false);
    announce('Output drawer closed');
    restoreFocusToElement(bottomOutputDrawerReturnFocusRef.current);
  }, [announce]);
  const [showProcessingToolbox, setShowProcessingToolbox] = useState(false);
  const [showModelBuilder, setShowModelBuilder] = useState(false);
  const [showPluginPanel, setShowPluginPanel] = useState(false);
  const [showSqlWorkspace, setShowSqlWorkspace] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [copiedViewState, setCopiedViewState] = useState<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  } | null>(null);
  const openAnalyzeActivityTab = useCallback(
    (tabId: MapAnalyzeTabId, announcement: string) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('analyze');
      setActiveActivityId('analyze');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      setShowNLQueryPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setShowScientificQAPanel(false);
      setShowChoroplethPanel(false);
      setShowClusterViz(false);
      setShowHotSpotViz(false);
      setShowEmergingHotSpotViz(false);
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction, setShowWorkflowDrawer, setWorkflowPreview]
  );
  const openStyleActivityTab = useCallback(
    (tabId: MapStyleTabId, announcement: string, layerId?: string | null) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('explore');
      setActiveActivityId('style');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      if (layerId !== undefined) {
        setStyleWorkspaceLayerId(layerId);
      }
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      setShowNLQueryPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setShowScientificQAPanel(false);
      setShowClusterViz(false);
      setShowHotSpotViz(false);
      setShowEmergingHotSpotViz(false);
      setShowVoxCityOverlay(false);
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction, setShowWorkflowDrawer, setWorkflowPreview]
  );
  const openSceneActivityTab = useCallback(
    (tabId: MapSceneTabId, announcement: string) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('explore');
      setActiveActivityId('scene');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      setShowNLQueryPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setShowScientificQAPanel(false);
      setShowClusterViz(false);
      setShowHotSpotViz(false);
      setShowEmergingHotSpotViz(false);
      setPointSymbologyLayerId(null);
      setShowChoroplethPanel(false);
      setShowVoxCityOverlay(tabId === 'scene-voxcity');
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction, setShowWorkflowDrawer, setWorkflowPreview]
  );
  const openPublishActivityTab = useCallback(
    (tabId: MapPublishTabId, announcement: string) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('explore');
      setActiveActivityId('publish');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      setShowFigureComposer(tabId === 'publish-figure');
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      setShowNLQueryPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setShowScientificQAPanel(false);
      setShowClusterViz(false);
      setShowHotSpotViz(false);
      setShowEmergingHotSpotViz(false);
      setPointSymbologyLayerId(null);
      setShowChoroplethPanel(false);
      setShowVoxCityOverlay(false);
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction, setShowWorkflowDrawer, setWorkflowPreview]
  );
  const extensionRegistry = useMemo(() => createMapExtensionRegistry(), []);
  const pluginExtensions = useMemo(() => extensionRegistry.list(), [extensionRegistry]);
  const processingExtensionExecutors = useMemo(() => extensionRegistry.processingToolExecutors(), [extensionRegistry]);
  const handleTogglePluginPanel = useCallback(() => {
    setShowPluginPanel(previous => {
      const next = !previous;
      if (next) {
        setShowProcessingToolbox(false);
        setShowModelBuilder(false);
        setShowSqlWorkspace(false);
      }
      return next;
    });
    announce('Plugin registry toggled');
  }, [announce]);
  const handleToggleSqlWorkspace = useCallback(() => {
    setShowSqlWorkspace(previous => {
      const next = !previous;
      if (next) {
        setShowPluginPanel(false);
      }
      announce(next ? 'SQL workspace opened' : 'SQL workspace closed');
      return next;
    });
  }, [announce]);
  const handleSqlResultToMap = useCallback((geojson: FeatureCollection) => {
    const layerId = `sql-result-${Date.now().toString(36)}`;
    addOverlayLayer({
      id: layerId,
      name: `SQL result (${geojson.features.length} features)`,
      type: 'geojson',
      visible: true,
      opacity: 0.9,
      sourceData: geojson,
      queryable: true,
      sourceKind: 'derived',
      provenance: {
        label: 'SQL workspace result',
        method: 'DuckDB-WASM spatial SQL',
        generatedAt: new Date().toISOString(),
      },
    });
    announce(`SQL result added to map: ${geojson.features.length} features`);
  }, [addOverlayLayer, announce]);
  const openDataActivitySection = useCallback(
    (tabId: 'data-import' | 'data-connections' | 'data-catalog' | 'data-health' | 'data-demo', announcement: string) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('explore');
      setActiveActivityId('data');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction]
  );
  const handleToggleCatalog = useCallback(() => {
    if (showLayerPanel && activeActivityId === 'data' && workbenchSidebarTab === 'data-catalog') {
      setShowLayerPanel(false);
      announce('Data catalog closed');
      return;
    }
    openDataActivitySection('data-catalog', 'Data catalog opened in Data activity');
  }, [activeActivityId, announce, openDataActivitySection, showLayerPanel, workbenchSidebarTab]);
  const openLayersActivityTab = useCallback(
    (tabId: 'layers-stack' | 'layers-contents' | 'layers-sources' | 'layers-cartography', announcement: string, cartographyScopeId: string | null = null) => {
      dismissMapStartDialogForWorkspaceInteraction();
      setWorkspaceView('explore');
      setActiveActivityId('layers');
      setShowLayerPanel(true);
      setWorkbenchSidebarCollapsed(false);
      setWorkbenchSidebarTab(tabId);
      setLayersCartographyScopeId(cartographyScopeId);
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      announce(announcement);
    },
    [announce, dismissMapStartDialogForWorkspaceInteraction]
  );
  const handleToggleContents = useCallback(() => {
    if (showLayerPanel && activeActivityId === 'layers' && workbenchSidebarTab === 'layers-contents') {
      setShowLayerPanel(false);
      announce('Contents tree closed');
      return;
    }
    openLayersActivityTab('layers-contents', 'Contents tree opened in Layers activity');
  }, [activeActivityId, announce, openLayersActivityTab, showLayerPanel, workbenchSidebarTab]);
  const processingRegistry = useMemo(() => createMapProcessingRegistry(extensionRegistry.processingToolDescriptors()), [extensionRegistry]);
  const processingToolDescriptors = useMemo(() => processingRegistry.list(), [processingRegistry]);
  const searchProcessingTools = useCallback((query: string) => processingRegistry.search(query), [processingRegistry]);
  const processingToolboxLayers = useMemo<ProcessingToolboxLayerOption[]>(
    () =>
      overlayLayers.map(layer => ({
        id: layer.id,
        name: layer.name,
        fields: layer.metadata?.schemaSummary?.fields.map(field => field.name) ?? layer.metadata?.fields ?? [],
      })),
    [overlayLayers]
  );
  const handlePreviewProcessingTool = useCallback((toolId: string, params: Record<string, string | number | boolean>) => previewProcessingTool(toolId, params, id => useMapExplorerStore.getState().overlayLayers.find(layer => layer.id === id) ?? null, { extensionExecutors: processingExtensionExecutors }), [processingExtensionExecutors]);
  const [inspectorLayerId, setInspectorLayerId] = useState<string | null>(null);
  const inspectorReturnFocusRef = useRef<HTMLElement | null>(null);
  const inspectorLayer = inspectorLayerId ? (overlayLayers.find(entry => entry.id === inspectorLayerId) ?? null) : null;
  const inspectorSourceHandle = inspectorLayer ? (sourceHandles.find(handle => handle.sourceId === inspectorLayer.metadata?.sourceId) ?? null) : null;
  const inspectorContext = useMemo<MapInspectorHostContext>(() => {
    if (!inspectorLayer) return { kind: 'none' };
    return {
      kind: 'layer',
      layer: inspectorLayer,
      ...(inspectorSourceHandle ? { sourceHandle: inspectorSourceHandle } : {}),
    };
  }, [inspectorLayer, inspectorSourceHandle]);
  const [attributeTableLayerId, setAttributeTableLayerId] = useState<string | null>(null);
  const attributeTableLayer = attributeTableLayerId ? (overlayLayers.find(entry => entry.id === attributeTableLayerId) ?? null) : null;
  const [showExternalServiceDialog, setShowExternalServiceDialog] = useState(false);
  const [pointSymbologyLayerId, setPointSymbologyLayerId] = useState<string | null>(null);
  const [pointSymbologyMode, setPointSymbologyMode] = useState<SymbolMode | 'heatmap'>('heatmap');
  const [selectionDragTool, setSelectionDragTool] = useState<SelectionDragTool | null>(null);
  const [showCanvasKeyboardHelp, setShowCanvasKeyboardHelp] = useState(false);
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
  const startDialogOpen = mapStartDialogState.open;
  const navigatorStageMode = startDialogOpen || workspaceView === 'navigator';

  const compatibleAoiFlows = useMemo(() => getCompatibleAoiFlows(), []);
  const flowDispatchAoi = useMemo(() => resolveFlowDispatchAoiCandidate(drawnFeatures, selectedFeatureId, currentMapBounds), [currentMapBounds, drawnFeatures, selectedFeatureId]);
  const selectedAoiFeatureForQuery = useMemo<Feature<Geometry> | null>(() => (flowDispatchAoi?.source === 'drawn-aoi' ? flowDispatchAoi.feature : null), [flowDispatchAoi]);
  const activeAoiLabel = useMemo(() => {
    const activeAoiIdFromContext = contextSummary.activeAoi?.aoiId;
    if (!activeAoiIdFromContext) {
      return null;
    }

    const activeAoiFeature = drawnFeatures.find(feature => feature.id === activeAoiIdFromContext);
    const label = activeAoiFeature?.properties?.label;
    return typeof label === 'string' && label.trim().length > 0 ? label.trim() : activeAoiIdFromContext;
  }, [contextSummary.activeAoi?.aoiId, drawnFeatures]);
  const externalServiceBounds = useMemo(
    () =>
      resolveMapAnalysisBounds({
        drawnFeatures,
        selectedFeatureId,
        currentMapBounds,
        ...(activeAoiId ? { activeAoiId } : {}),
      }),
    [activeAoiId, currentMapBounds, drawnFeatures, selectedFeatureId]
  );
  const selectionStatsAvailable = useMemo(() => Object.values(selectedFeatureIds).some(ids => ids.length > 0), [selectedFeatureIds]);
  const selectedFeatureCount = useMemo(() => Object.values(selectedFeatureIds).reduce((total, ids) => total + ids.length, 0), [selectedFeatureIds]);
  const activeUrbanContext = useMemo<MapAnalysisUrbanContextSummary>(
    () => ({
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
    }),
    [contextSummary.activeAoi?.aoiId, urbanContextSummary.artifactCount, urbanContextSummary.fitnessStatus, urbanContextSummary.flowId, urbanContextSummary.hasContext, urbanContextSummary.hasRestoreWarnings, urbanContextSummary.layerCount, urbanContextSummary.restoreWarningCount, urbanContextSummary.runId, urbanContextSummary.studyAreaBounds, urbanContextSummary.studyAreaId, urbanContextSummary.studyAreaName, urbanContextSummary.syncState]
  );
  const activeAnalysisInputLayerIds = useMemo(() => {
    const selectedLayerIds = Object.entries(selectedFeatureIds)
      .filter(([, ids]) => ids.length > 0)
      .map(([layerId]) => layerId);
    return Array.from(new Set([...selectedLayerIds, ...activeAnalysisResultLayerIds]));
  }, [activeAnalysisResultLayerIds, selectedFeatureIds]);
  const scientificQAIssueCount = useMemo(() => scientificQA?.issues.filter(issue => issue.severity !== 'info').length ?? 0, [scientificQA?.issues]);
  const scientificQABlockerCount = useMemo(() => (scientificQA ? scientificQA.metadata.issueCounts.blocker + scientificQA.metadata.issueCounts.error : 0), [scientificQA]);
  const analysisRecommendationState = useMemo(
    () =>
      generateMapAnalysisRecommendations({
        overlayLayers,
        selectedFeatureIds,
        scientificQA,
        currentMapBounds,
        userIntent: workspaceView,
        mapContextSummary: contextSummary,
        urbanContext: activeUrbanContext,
      }),
    [activeUrbanContext, contextSummary, currentMapBounds, overlayLayers, scientificQA, selectedFeatureIds, workspaceView]
  );
  const nlQueryToolbarContext = useMemo(
    () =>
      buildMapNLQueryContext(overlayLayers, {
        scope: 'visible',
        mode: 'live',
        selectedAoiFeature: selectedAoiFeatureForQuery,
        currentMapBounds,
      }),
    [currentMapBounds, overlayLayers, selectedAoiFeatureForQuery]
  );
  const workflowDrawnPolygons = useMemo<Array<Feature<Polygon | MultiPolygon>>>(
    () =>
      drawnFeatures
        .filter((entry): entry is typeof entry & { geometry: Polygon | MultiPolygon } => entry.geometry?.type === 'Polygon' || entry.geometry?.type === 'MultiPolygon')
        .map(
          entry =>
            ({
              type: 'Feature',
              properties: { ...entry.properties, drawn_feature_id: entry.id },
              geometry: entry.geometry,
            }) satisfies Feature<Polygon | MultiPolygon>
        ),
    [drawnFeatures]
  );
  const workflowSelectedFeatures = useMemo<Array<Feature<Geometry>>>(() => {
    const features: Array<Feature<Geometry>> = [];
    for (const [layerId, ids] of Object.entries(selectedFeatureIds)) {
      if (!ids.length) continue;
      const layer = overlayLayers.find(entry => entry.id === layerId);
      if (!layer) continue;
      const sourceData = layer.sourceData;
      if (!sourceData || typeof sourceData === 'string') continue;
      const collection = (sourceData as FeatureCollection).type === 'FeatureCollection' ? (sourceData as FeatureCollection) : null;
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
    () =>
      Object.entries(selectedFeatureIds)
        .filter(([, ids]) => ids.length > 0)
        .map(([layerId]) => layerId),
    [selectedFeatureIds]
  );
  const drawingSnapSources = useMemo(() => buildDrawingSnapSources(overlayLayers), [overlayLayers]);
  const workflowUrbanStudyArea = useMemo(() => {
    if (!activeUrbanContext.studyAreaBounds) return null;
    return {
      id: activeUrbanContext.studyAreaId ?? activeUrbanContext.activeAoiId ?? 'urban-study-area',
      label: activeUrbanContext.studyAreaName ?? 'Urban study area',
      bounds: activeUrbanContext.studyAreaBounds,
      ...(activeUrbanContext.activeAoiId ? { activeAoiId: activeUrbanContext.activeAoiId } : {}),
    };
  }, [activeUrbanContext.activeAoiId, activeUrbanContext.studyAreaBounds, activeUrbanContext.studyAreaId, activeUrbanContext.studyAreaName]);
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
    [currentMapBounds, overlayLayers, workflowDrawnPolygons, workflowGeocodedPlace, workflowSelectedFeatures, workflowSelectedLayerIds, workflowUrbanStudyArea]
  );
  const workflowReadyCount = useMemo(() => workflowContext.layers.filter(layer => layer.hasGeometry).length, [workflowContext.layers]);
  const cartographyReviewState = useMemo(
    () =>
      generateMapCartographyReview(overlayLayers, {
        viewport: {
          zoom,
          bounds: currentMapBounds,
        },
        dismissedRecommendationIds: dismissedCartographyRecommendationIds,
      }),
    [currentMapBounds, dismissedCartographyRecommendationIds, overlayLayers, zoom]
  );
  const selectedLayerCartographyRecommendations = useMemo(() => (pointSymbologyLayerId ? cartographyReviewState.recommendations.filter(recommendation => recommendation.layerId === pointSymbologyLayerId) : []), [cartographyReviewState.recommendations, pointSymbologyLayerId]);

  const buildCurrentReviewSnapshot = useCallback(() => {
    const map = mapInstanceRef.current;
    const mapCenter = map?.getCenter();
    return buildMapReviewContextSnapshot({
      overlayLayers,
      viewport:
        map && mapCenter
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
  }, [activeAnalysisResultLayerIds, activeAoiId, analysisRecommendationState.recommendations.length, bearing, center, currentMapBounds, overlayLayers, pitch, scientificQA, selectedFeatureIds, zoom]);

  const recordMapReviewEvent = useCallback(
    (event: MapReviewTimelineEventInput) => {
      addMapReviewEvent({
        ...event,
        snapshot: event.snapshot ?? buildCurrentReviewSnapshot(),
      });
    },
    [addMapReviewEvent, buildCurrentReviewSnapshot]
  );

  const handleSelectionResult = useCallback(
    (result: MapQueryExecutionResult, label: string) => {
      setSelectionStatsSummary(null);
      if (result.totalMatched > 0) {
        openRightDockPanel('selection', `${label} selection opened in the right dock`, 'programmatic', label.toLowerCase());
      }
      const matchedLayers = result.layers.filter(layer => layer.matchedFeatureCount > 0);
      recordMapReviewEvent({
        type: 'query-run',
        status: result.status === 'success' ? 'applied' : 'rejected',
        title: `${label} query`,
        summary: `${label} selected ${result.totalMatched.toLocaleString()} feature${result.totalMatched === 1 ? '' : 's'} across ${matchedLayers.length.toLocaleString()} layer${matchedLayers.length === 1 ? '' : 's'}.`,
        layerIds: result.layers.map(layer => layer.layerId),
        actionIds: [result.queryId],
        details: {
          queryId: result.queryId,
          interaction: label,
          totalMatched: result.totalMatched,
          scannedFeatureCount: result.scannedFeatureCount,
          candidateFeatureCount: result.candidateFeatureCount,
          bounded: result.bounded,
          truncated: result.truncated,
          warnings: result.warnings,
          blockers: result.blockers,
          provenance: result.provenance,
          matchedLayers: result.layers.map(layer => ({
            layerId: layer.layerId,
            layerName: layer.layerName,
            matchedFeatureCount: layer.matchedFeatureCount,
            candidateFeatureCount: layer.candidateFeatureCount,
            scannedFeatureCount: layer.scannedFeatureCount,
            sourceFeatureCount: layer.sourceFeatureCount,
            bounded: layer.bounded,
            truncated: layer.truncated,
          })),
        },
      });
    },
    [openRightDockPanel, recordMapReviewEvent]
  );

  // Map command lifecycle (Prompt 9): high-impact actions flow through
  // MapActionExecutor so each one is preflighted, audited (one review-timeline
  // event), and revertable. The history (with revert tokens) is transient.
  const mapActionHistoryRef = useRef<MapActionHistory>(createMapActionHistory());
  const [mapUndoRedoSummary, setMapUndoRedoSummary] = useState(() => summarizeMapUndoRedo(mapActionHistoryRef.current));

  const refreshMapUndoRedoSummary = useCallback(() => {
    setMapUndoRedoSummary(summarizeMapUndoRedo(mapActionHistoryRef.current));
  }, []);

  const recordMapActionHistory = useCallback(
    (entry: MapActionHistoryEntry) => {
      mapActionHistoryRef.current = recordMapActionHistoryEntry(mapActionHistoryRef.current, entry);
      refreshMapUndoRedoSummary();
    },
    [refreshMapUndoRedoSummary]
  );

  const buildMapActionEffects = useCallback((): MapActionEffects => {
    const readStore = useMapExplorerStore.getState;
    return {
      getLayer: id => readStore().overlayLayers.find(layer => layer.id === id) ?? null,
      getLayerOrder: () => readStore().overlayLayers.map(layer => layer.id),
      addLayer: layer => readStore().addOverlayLayer(layer),
      removeLayer: id => readStore().removeOverlayLayer(id),
      setLayerOrder: orderedIds => readStore().reorderLayers(orderedIds),
      setLayerStyle: (id, style) => readStore().updateLayerMetadata(id, { style }),
      removeReportItem: () => {
        /* report.handoff is not routed in-app yet; no-op keeps the boundary total. */
      },
      getDrawnFeature: id => readStore().drawnFeatures.find(feature => feature.id === id) ?? null,
      updateDrawnFeature: (id, patch) => readStore().updateDrawnFeature(id, patch),
    };
  }, []);

  const handleRemoveLayerViaCommand = useCallback(
    (layerId: string) => {
      const outcome = applyMapCommand({ kind: 'layer.remove', layerId }, buildMapActionEffects());
      recordMapReviewEvent(outcome.reviewEvent);
      if (outcome.result.status === 'applied') {
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
        announce('Removed layer; revert is available in the review timeline.');
      } else {
        announce(`Layer removal blocked: ${outcome.preflight.blockers.join(' ')}`);
      }
    },
    [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent]
  );

  const handleRunProcessingTool = useCallback(
    (toolId: string, params: Record<string, string | number | boolean>) => {
      const result = runProcessingTool(toolId, params, buildMapActionEffects(), {
        extensionExecutors: processingExtensionExecutors,
      });
      if (!result) return null;
      if (result.reviewEvent) recordMapReviewEvent(result.reviewEvent);
      if (result.status === 'applied') {
        if (result.outputLayer) {
          setActiveAnalysisResultLayers([result.outputLayer.id]);
          setInspectorLayerId(result.outputLayer.id);
        }
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
        announce(`${result.descriptor.title} blocked: ${result.preview.blockers.join(' ')}`);
      }
      return result;
    },
    [announce, buildMapActionEffects, processingExtensionExecutors, recordMapActionHistory, recordMapReviewEvent, setActiveAnalysisResultLayers]
  );

  const registerMapModelExecution = useCallback(
    (result: MapModelRunResult): MapModelRunResult => {
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
      if (result.status !== 'applied' || !result.manifest || !result.manifestHash || !result.finalOutputLayer) {
        announce(`Model blocked: ${result.blockers.join(' ')}`);
        return result;
      }
      setActiveAnalysisResultLayers([result.finalOutputLayer.id]);
      setInspectorLayerId(result.finalOutputLayer.id);
      announce(`${result.model.title} model applied; output layer carries its reproducibility manifest.`);
      return result;
    },
    [announce, recordMapActionHistory, recordMapReviewEvent, setActiveAnalysisResultLayers]
  );

  const handleRunMapModel = useCallback((model: MapModelDefinition): MapModelRunResult => registerMapModelExecution(executeMapModel(model, processingRegistry, buildMapActionEffects(), { mapContextId: contextSummary.contextId, extensionExecutors: processingExtensionExecutors })), [buildMapActionEffects, contextSummary.contextId, processingExtensionExecutors, processingRegistry, registerMapModelExecution]);

  const handleRunMapModelBatch = useCallback(
    (model: MapModelDefinition, targets: readonly MapModelBatchTarget[]) => {
      const batch = executeMapModelBatch(model, targets, processingRegistry, buildMapActionEffects(), { mapContextId: contextSummary.contextId, extensionExecutors: processingExtensionExecutors });
      batch.results.forEach(entry => registerMapModelExecution(entry.result));
      if (batch.status !== 'blocked') announce(`${batch.results.length} model batch target(s) processed.`);
      return batch;
    },
    [announce, buildMapActionEffects, contextSummary.contextId, processingExtensionExecutors, processingRegistry, registerMapModelExecution]
  );

  const handleCommitDrawnFeatureEdit = useCallback(
    (id: string, before: DrawnFeature, after: DrawnFeature) => {
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
          kind: 'aoi.edit',
          featureId: id,
          previousFeature: before,
          nextFeature: normalizedAfter,
          validation,
        },
        buildMapActionEffects()
      );
      recordMapReviewEvent(outcome.reviewEvent);
      if (outcome.result.status === 'applied') {
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
        announce(validation.status === 'warning' ? 'AOI edit applied with topology caveats; review timeline updated.' : 'AOI edit applied; review timeline updated.');
        return;
      }

      updateDrawnFeature(id, {
        geometry: before.geometry,
        properties: before.properties,
      });
      announce(`AOI edit blocked: ${summarizeDrawnGeometryValidation(validation)}`);
    },
    [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent, updateDrawnFeature]
  );

  const handleUndoMapAction = useCallback(
    (commandId?: string) => {
      const entry = commandId ? findRevertableEntry(mapActionHistoryRef.current, commandId) : findUndoableEntry(mapActionHistoryRef.current);
      if (!entry?.revertToken) {
        announce('There is no reversible map edit to undo.');
        return;
      }
      revertMapCommand(entry.revertToken, buildMapActionEffects());
      mapActionHistoryRef.current = markMapActionUndone(mapActionHistoryRef.current, entry.commandId);
      refreshMapUndoRedoSummary();
      updateMapReviewEventStatus(entry.reviewEventId, 'undone', 'Undone via map undo stack');
      announce(`Undid: ${entry.title}`);
    },
    [announce, buildMapActionEffects, refreshMapUndoRedoSummary, updateMapReviewEventStatus]
  );

  const handleRedoMapAction = useCallback(() => {
    const entry = findRedoableEntry(mapActionHistoryRef.current);
    if (!entry?.redoToken) {
      announce('There is no map edit to redo.');
      return;
    }
    redoMapCommand(entry.redoToken, buildMapActionEffects());
    mapActionHistoryRef.current = markMapActionRedone(mapActionHistoryRef.current, entry.commandId);
    refreshMapUndoRedoSummary();
    updateMapReviewEventStatus(entry.reviewEventId, 'applied', 'Redone via map undo stack');
    announce(`Redid: ${entry.title}`);
  }, [announce, buildMapActionEffects, refreshMapUndoRedoSummary, updateMapReviewEventStatus]);

  const handleRevertMapCommand = useCallback(
    (commandId: string) => {
      handleUndoMapAction(commandId);
    },
    [handleUndoMapAction]
  );

  const handleRepairLayerGeometry = useCallback(
    async (layerId: string) => {
      const layer = useMapExplorerStore.getState().overlayLayers.find(entry => entry.id === layerId);
      if (!layer) {
        toastWarning('The layer selected for topology repair is no longer available.');
        announce('Geometry repair blocked: layer is no longer available.');
        return;
      }

      try {
        announce(`Previewing topology repair for ${layer.name}.`);
        const preview = await previewLayerTopologyRepair(layer, {
          mapContextId: contextSummary.contextId,
        });
        if (!preview.canApply || !preview.outputLayer || !preview.manifest) {
          const reason = preview.blockers.join(' ') || 'No repairable topology changes were found.';
          toastWarning(`Geometry repair blocked: ${reason}`);
          announce(`Geometry repair blocked: ${reason}`);
          return;
        }

        const outcome = applyMapCommand(
          {
            kind: 'workflow.apply',
            workflowId: preview.manifest.workflowId,
            outputLayer: preview.outputLayer,
            replaceLayerId: layer.id,
            canApply: true,
            manifest: preview.manifest,
            caveats: preview.caveats,
          },
          buildMapActionEffects()
        );
        recordMapReviewEvent(outcome.reviewEvent);

        if (outcome.result.status !== 'applied') {
          const reason = outcome.preflight.blockers.join(' ') || 'Topology repair was not applied.';
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
        const message = `Geometry repair applied to ${layer.name}: ${repair.repairedFeatureCount.toLocaleString()} repaired, ${repair.removedFeatureCount.toLocaleString()} removed.`;
        toastSuccess(message);
        announce(`${message} Revert is available in the review timeline.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Topology repair failed.';
        toastWarning(`Geometry repair failed: ${message}`);
        announce(`Geometry repair failed: ${message}`);
      }
    },
    [activeAnalysisInputLayerIds, activeAnalysisResultLayerIds, announce, buildMapActionEffects, contextSummary.contextId, recordMapActionHistory, recordMapReviewEvent, setScientificQA, zoom]
  );

  const handleInspectLayer = useCallback(
    (layerId: string) => {
      if (typeof document !== 'undefined') {
        const activeElement = document.activeElement;
        inspectorReturnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      }
      setShowScientificQAPanel(false);
      setShowNLQueryPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setShowReviewTimeline(false);
      setPointSymbologyLayerId(null);
      setShowChoroplethPanel(false);
      setShowClusterViz(false);
      setShowHotSpotViz(false);
      setShowEmergingHotSpotViz(false);
      setShowVoxCityOverlay(false);
      setInspectorLayerId(layerId);
      openRightDockPanel('inspect', 'Layer inspector opened in the right dock', 'programmatic', layerId);
      announce('Layer inspector opened');
    },
    [announce, openRightDockPanel, setShowWorkflowDrawer, setWorkflowPreview]
  );

  const handleCloseInspectorHost = useCallback(() => {
    setInspectorLayerId(null);
    announce('Inspector closed');
  }, [announce]);

  const handleOpenAttributeTable = useCallback(
    (layerId: string) => {
      setAttributeTableLayerId(layerId);
      openRightDockPanel('attributes', 'Attribute table opened in the right dock', 'toolbar');
    },
    [openRightDockPanel]
  );

  const handleOpenAttributesFromToolbar = useCallback(() => {
    const selectedLayerId = Object.entries(selectedFeatureIds).find(([, featureIds]) => featureIds.length > 0)?.[0] ?? null;
    const analysisLayerId = activeAnalysisResultLayerIds.find(layerId => overlayLayers.some(layer => layer.id === layerId)) ?? null;
    const visibleLayerId = overlayLayers.find(layer => layer.visible)?.id ?? overlayLayers[0]?.id ?? null;
    const targetLayerId = attributeTableLayerId ?? selectedLayerId ?? analysisLayerId ?? visibleLayerId;

    if (targetLayerId) {
      setAttributeTableLayerId(targetLayerId);
      openRightDockPanel('attributes', 'Attribute table opened in the right dock', 'toolbar', targetLayerId);
      announce('Attribute table opened');
      return;
    }

    openRightDockPanel('attributes', 'Attributes opened in the right dock without an active layer', 'toolbar');
    announce('Attributes panel opened');
  }, [activeAnalysisResultLayerIds, announce, attributeTableLayerId, openRightDockPanel, overlayLayers, selectedFeatureIds]);

  const handleOpenInspectFromStatus = useCallback(() => {
    const selectedLayerId = Object.entries(selectedFeatureIds).find(([, featureIds]) => featureIds.length > 0)?.[0] ?? null;
    const analysisLayerId = activeAnalysisResultLayerIds.find(layerId => overlayLayers.some(layer => layer.id === layerId)) ?? null;
    const visibleLayerId = overlayLayers.find(layer => layer.visible)?.id ?? overlayLayers[0]?.id ?? null;
    const targetLayerId = inspectorLayerId ?? attributeTableLayerId ?? selectedLayerId ?? analysisLayerId ?? visibleLayerId;

    if (targetLayerId) {
      handleInspectLayer(targetLayerId);
      announce('Map view detail opened');
      return;
    }

    openRightDockPanel('attributes', 'Attributes opened in the right dock without an active layer', 'status-bar');
  }, [activeAnalysisResultLayerIds, announce, attributeTableLayerId, handleInspectLayer, inspectorLayerId, openRightDockPanel, overlayLayers, selectedFeatureIds]);

  const handleOpenProjectFromStatus = useCallback(() => {
    setWorkspaceView('explore');
    setActiveActivityId('data');
    setShowLayerPanel(true);
    setShowProcessingToolbox(false);
    setShowModelBuilder(false);
    setShowPluginPanel(false);
    setWorkbenchSidebarTab('data-import');
    announce(selectedProjectId ? 'Project and save detail opened in the data panel' : 'Data panel opened for project setup');
  }, [announce, selectedProjectId]);

  const handleOpenLayersFromStatus = useCallback(() => {
    setWorkspaceView('explore');
    setActiveActivityId('layers');
    setShowLayerPanel(true);
    setShowProcessingToolbox(false);
    setShowModelBuilder(false);
    setShowPluginPanel(false);
    setWorkbenchSidebarTab('layers-stack');
    announce('Layers workspace opened');
  }, [announce]);

  const handleOpenAttributesFromStatus = useCallback(() => {
    const selectedLayerId = Object.entries(selectedFeatureIds).find(([, featureIds]) => featureIds.length > 0)?.[0] ?? null;
    const analysisLayerId = activeAnalysisResultLayerIds.find(layerId => overlayLayers.some(layer => layer.id === layerId)) ?? null;
    const fallbackLayerId = overlayLayers.find(layer => layer.queryable !== false)?.id ?? overlayLayers[0]?.id ?? null;
    const targetLayerId = attributeTableLayerId ?? selectedLayerId ?? analysisLayerId ?? fallbackLayerId;

    if (targetLayerId) {
      setAttributeTableLayerId(targetLayerId);
      openBottomOutputDrawer('attributes', 'Selected feature attributes opened in the output drawer');
      return;
    }

    openBottomOutputDrawer('attributes', 'Attributes drawer opened without an active layer');
  }, [activeAnalysisResultLayerIds, attributeTableLayerId, openBottomOutputDrawer, overlayLayers, selectedFeatureIds]);

  const handleOpenSelectionFromStatus = useCallback(() => {
    const selectedCount = Object.values(selectedFeatureIds).reduce((total, featureIds) => total + featureIds.length, 0);
    openRightDockPanel('selection', selectedCount > 0 ? 'Selected feature details opened in the right dock' : 'Selection tools opened in the right dock', 'status-bar');
  }, [openRightDockPanel, selectedFeatureIds]);

  const handleOpenMeasurementsFromStatus = useCallback(() => {
    openRightDockPanel('measure', 'Measurement results opened in the right dock', 'status-bar');
  }, [openRightDockPanel]);

  const handleOpenDrawFromStatus = useCallback(() => {
    openRightDockPanel('draw', contextSummary.activeAoi || drawnFeatures.length > 0 ? 'Draw and AOI detail opened in the right dock' : 'Drawing tools opened in the right dock', 'status-bar');
  }, [contextSummary.activeAoi, drawnFeatures.length, openRightDockPanel]);

  const handleSetSelectedFeatures = useCallback(
    (layerId: string, featureIds: string[]) => {
      setSelectionStatsSummary(null);
      setSelectedFeatures(layerId, featureIds);
    },
    [setSelectedFeatures]
  );

  const handleClearSelectedFeatures = useCallback(() => {
    setSelectionStatsSummary(null);
    clearSelectedFeatures();
  }, [clearSelectedFeatures]);

  const handleAttributeTableSelection = useCallback(
    (layerId: string, featureIds: string[]) => {
      handleSetSelectedFeatures(layerId, featureIds);
      if (featureIds.length > 0) {
        setActiveAnalysisResultLayers([layerId]);
      }
    },
    [handleSetSelectedFeatures, setActiveAnalysisResultLayers]
  );

  const handleCreateAttributeDerivedLayer = useCallback(
    (draft: MapAttributeDerivedFieldDraft) => {
      const sourceLayer = overlayLayers.find(entry => entry.id === draft.sourceLayerId);
      if (!sourceLayer) {
        toastWarning('The source layer for this field calculation is no longer available.');
        announce('Field calculation blocked because the source layer is no longer available.');
        return;
      }

      const createdAt = new Date().toISOString();
      const layerId = `derived:fieldcalc:${sourceLayer.id}:${draft.fieldName}:${createdAt.replace(/[.:]/g, '-')}`;
      const layerName = `Field calc · ${sourceLayer.name} · ${draft.fieldName}`;
      const baseMetadata = buildFeatureCollectionMetadata(draft.featureCollection as FeatureCollection);
      const inheritedSchema = sourceLayer.metadata?.schemaSummary?.fields ?? sourceLayer.metadata?.registry?.schemaSummary.fields ?? [];
      const schemaFieldMap = new Map<string, LayerSchemaFieldSummary>();
      inheritedSchema.forEach(field => schemaFieldMap.set(field.name, { ...field }));
      baseMetadata.schemaSummary?.fields.forEach(field => {
        if (!schemaFieldMap.has(field.name)) schemaFieldMap.set(field.name, { ...field });
      });
      schemaFieldMap.set(draft.fieldName, {
        name: draft.fieldName,
        role: draft.fieldProfile.kind === 'temporal' ? 'temporal' : 'attribute',
        ...(draft.fieldProfile.kind === 'numeric' ? { type: 'number' } : draft.fieldProfile.kind === 'temporal' ? { type: 'date' } : { type: 'string' }),
      });
      const schemaFields = [...schemaFieldMap.values()];
      const sourceCrsSummary = sourceLayer.metadata?.crsSummary ?? sourceLayer.metadata?.registry?.crsSummary;
      const qaBadges = new Set<LayerScientificQABadge>();
      if (sourceLayer.sourceKind === 'demo' || sourceLayer.metadata?.analysisResult?.outputMode === 'demo') {
        qaBadges.add('sample_data');
      }
      if (!sourceCrsSummary?.crs) qaBadges.add('missing_crs');
      if (draft.nullCount > 0 || draft.errorCount > 0) qaBadges.add('uncertain_output');
      if (sourceLayer.metadata?.analysisResult?.stale) qaBadges.add('stale_result');

      const qaIssueIds = Array.from(new Set([...(sourceLayer.metadata?.scientificQA?.issueIds ?? []), ...(draft.errorCount > 0 ? ['fieldcalc_evaluation_error'] : []), ...(draft.nullCount > 0 ? ['fieldcalc_null_output'] : [])]));
      const qaCaveats = Array.from(new Set([`Sandboxed field calculator expression: ${draft.expression}.`, `Referenced fields: ${draft.referencedFields.join(', ') || 'none'}.`, ...draft.warnings, ...(sourceCrsSummary?.notes ?? []), ...(sourceLayer.qaStatus === 'warning' || sourceLayer.qaStatus === 'error' ? (sourceLayer.metadata?.scientificQA?.caveats ?? []) : [])]));
      const qaStatus: LayerQaStatus = sourceLayer.qaStatus === 'error' || sourceLayer.metadata?.scientificQA?.status === 'error' ? 'error' : qaCaveats.length > 0 || sourceLayer.qaStatus === 'warning' || sourceLayer.metadata?.scientificQA?.status === 'warning' ? 'warning' : 'passed';

      const derivedLayer: OverlayLayerConfig = {
        id: layerId,
        name: layerName,
        type: sourceLayer.type,
        visible: true,
        opacity: sourceLayer.opacity,
        ...(sourceLayer.style ? { style: sourceLayer.style } : {}),
        sourceData: draft.featureCollection,
        queryable: true,
        sourceKind: 'derived',
        group: 'analysis',
        provenance: {
          label: layerName,
          sourceName: sourceLayer.name,
          method: `Sandboxed field calculator: ${draft.fieldName}`,
          generatedAt: createdAt,
          sourceLayerIds: [sourceLayer.id],
          notes: [`Expression: ${draft.expression}`, ...(draft.referencedFields.length > 0 ? [`Referenced fields: ${draft.referencedFields.join(', ')}`] : []), ...draft.warnings],
        },
        qaStatus,
        metadata: {
          ...baseMetadata,
          updatedAt: createdAt,
          dataVersion: `fieldcalc:${createdAt}`,
          fields: schemaFields.map(field => field.name),
          schemaSummary: {
            fieldCount: schemaFields.length,
            fields: schemaFields,
            source: 'analysis-result',
            notes: [`Derived field ${draft.fieldName} generated from a sandboxed calculator expression.`],
            ...(baseMetadata.schemaSummary?.geometryField ? { geometryField: baseMetadata.schemaSummary.geometryField } : {}),
          },
          ...(sourceCrsSummary
            ? {
                crsSummary: {
                  crs: sourceCrsSummary.crs,
                  status: sourceCrsSummary.status,
                  source: sourceCrsSummary.source,
                  notes: [...sourceCrsSummary.notes],
                },
              }
            : {}),
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
      openRightDockPanel('attributes', 'Derived attribute table opened in the right dock', 'programmatic');
      setActiveAnalysisResultLayers([derivedLayer.id]);
      setInspectorLayerId(derivedLayer.id);
      recordMapReviewEvent({
        type: 'layer-change',
        status: 'applied',
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
          outcome: 'Derived layer added to the analysis stack.',
        },
      });
      const message = `Derived layer created: ${layerName}.`;
      toastSuccess(message);
      announce(message);
    },
    [addOverlayLayer, announce, openRightDockPanel, overlayLayers, recordMapReviewEvent, setActiveAnalysisResultLayers]
  );

  useEffect(() => {
    if (!open || reviewSession.events.length > 0) {
      return;
    }

    clearMapReviewSession({
      projectId: selectedProjectId,
      title: selectedProject?.name ? `${selectedProject.name} map review session` : 'Map review session',
      initialSnapshot: buildCurrentReviewSnapshot(),
    });
  }, [buildCurrentReviewSnapshot, clearMapReviewSession, open, reviewSession.events.length, selectedProject?.name, selectedProjectId]);

  const reviewCollaborationSnapshot = useMemo<MapReviewCollaborationSnapshot>(() => {
    const reviewerId = appUser?.id ?? 'local-reviewer';
    const reviewerName = appUser?.name ?? 'Local reviewer';
    return {
      schemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
      sessionId: reviewSession.id,
      connectionState: 'local-only',
      badge: getMapReviewCollaborationConnectionBadge('local-only'),
      annotations: [],
      comments: [],
      presence: [
        {
          clientId: `local:${reviewerId}`,
          userId: reviewerId,
          name: reviewerName,
          connectionState: 'local-only',
          lastActiveAt: reviewSession.updatedAt,
          isSelf: true,
        },
      ],
    };
  }, [appUser?.id, appUser?.name, reviewSession.id, reviewSession.updatedAt]);

  useEffect(() => {
    if (!open || typeof globalThis.addEventListener !== 'function') {
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
      recordMapReviewEvent(
        buildMapAIProposalReviewEvent(proposal.guardrail, {
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
        })
      );
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
      const proposal = copilotActionProposals.find(entry => entry.id === auditEntry.proposalId);
      recordMapReviewEvent({
        type: 'action-status',
        status: auditEntry.action === 'applied' ? 'applied' : auditEntry.action === 'rejected' ? 'rejected' : 'recorded',
        timestamp: auditEntry.timestamp,
        title: `AI-proposed action ${auditEntry.action}: ${proposal?.title ?? auditEntry.proposalId}`,
        summary: auditEntry.reason ? `AI-proposed action ${auditEntry.proposalId} was ${auditEntry.action}: ${auditEntry.reason}` : `AI-proposed action ${auditEntry.proposalId} was ${auditEntry.action}.`,
        actionIds: [auditEntry.proposalId],
        details: {
          auditId: auditEntry.id,
          kind: proposal?.kind ?? 'unknown',
          reason: auditEntry.reason ?? null,
          aiGuardrail: proposal?.guardrail ? mapAIGuardrailDetails(proposal.guardrail) : auditEntry.guardrail ? mapAIGuardrailDetails(auditEntry.guardrail) : null,
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

    return subscribeToViewportSync(event => {
      if (event.source !== 'voxcity-3d' || !useViewportSyncStore.getState().enabled) {
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
      suppressViewportSyncTimerRef.current = window.setTimeout(
        () => {
          suppressViewportSyncPublishRef.current = false;
          suppressViewportSyncTimerRef.current = null;
        },
        reducedMotion ? 80 : 280
      );
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
  const { reportHandoffSource, setReportHandoffSource, reportHandoffOptions, setReportHandoffOptions, reportHandoffSnapshot, setReportHandoffSnapshot, isGeneratingReportHandoffSnapshot, setIsGeneratingReportHandoffSnapshot, isExportingReportHandoffPdf, setIsExportingReportHandoffPdf } = useMapReportController();
  const activePublishTabId = resolvePublishTabId(workbenchSidebarTab);
  const publishReportTabDocked = activeActivityId === 'publish' && showLayerPanel && activePublishTabId === 'publish-report';
  const { dockLayout, effectiveShowSidebar, effectiveShowLayerPanel, effectiveShowDrawPanel, effectiveShowMeasurePanel, effectiveShowScientificQAPanel, effectiveShowUrbanMethodPanel, effectiveShowNLQueryPanel, effectiveShowWorkflowDrawer, navigatorLeftInset, navigatorRightInset } = useMapPanelLayout({
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
    hasReportHandoffSource: Boolean(reportHandoffSource) && !publishReportTabDocked,
    activeRightDockRoutePanel: activeRightDockRoute?.panel ?? null,
    navigatorStageMode,
    navigatorStageMargin: MAP_NAVIGATOR_STAGE_MARGIN,
    layoutPreferences,
  });
  const { closeFloatingRightPanels, closeRightDockPanels, handleToggleSidebar, handleToggleLayerPanel } = useMapPanelCommands({
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
  const openScientificQAPanel = useCallback(
    (routeSource: MapRightDockRouteSource = 'programmatic') => {
      openRightDockPanel('scientificQA', 'Scientific QA details opened in the right dock', routeSource);
    },
    [openRightDockPanel]
  );
  const handleOpenAnalyzeTab = useCallback(
    (tabId: MapAnalyzeTabId, announcement: string) => {
      closeFloatingRightPanels();
      closeRightDockPanels();
      openAnalyzeActivityTab(tabId, announcement);
    },
    [closeFloatingRightPanels, closeRightDockPanels, openAnalyzeActivityTab]
  );
  const handleOpenStyleTab = useCallback(
    (tabId: MapStyleTabId, announcement: string, layerId?: string | null) => {
      closeFloatingRightPanels();
      closeRightDockPanels();
      openStyleActivityTab(tabId, announcement, layerId);
    },
    [closeFloatingRightPanels, closeRightDockPanels, openStyleActivityTab]
  );
  const handleOpenSceneTab = useCallback(
    (tabId: MapSceneTabId, announcement: string) => {
      closeFloatingRightPanels();
      closeRightDockPanels();
      openSceneActivityTab(tabId, announcement);
    },
    [closeFloatingRightPanels, closeRightDockPanels, openSceneActivityTab]
  );
  const handleOpenPublishTab = useCallback(
    (tabId: MapPublishTabId, announcement: string) => {
      closeFloatingRightPanels();
      closeRightDockPanels();
      openPublishActivityTab(tabId, announcement);
    },
    [closeFloatingRightPanels, closeRightDockPanels, openPublishActivityTab]
  );
  const handlePublishWorkspaceTabChange = useCallback(
    (tabId: string) => {
      const resolvedTabId = resolvePublishTabId(tabId);
      setWorkbenchSidebarTab(resolvedTabId);
      setShowFigureComposer(resolvedTabId === 'publish-figure');
      announce(`Publish ${publishTabLabel(resolvedTabId)} opened`);
    },
    [announce]
  );
  const handleToggleFigureComposer = useCallback(() => {
    if (activeActivityId === 'publish' && showLayerPanel && activePublishTabId === 'publish-figure') {
      setShowLayerPanel(false);
      setShowFigureComposer(false);
      announce('Figure composer closed');
      return;
    }
    handleOpenPublishTab('publish-figure', 'Figure composer opened in Publish');
  }, [activeActivityId, activePublishTabId, announce, handleOpenPublishTab, showLayerPanel]);
  const handleToggleProcessingToolbox = useCallback(() => {
    if (activeActivityId === 'analyze' && showLayerPanel && workbenchSidebarTab === 'analyze-tools') {
      setShowLayerPanel(false);
      announce('Processing toolbox closed');
      return;
    }
    handleOpenAnalyzeTab('analyze-tools', 'Processing toolbox opened in Analyze Tools');
  }, [activeActivityId, announce, handleOpenAnalyzeTab, showLayerPanel, workbenchSidebarTab]);
  const handleToggleModelBuilder = useCallback(() => {
    if (activeActivityId === 'analyze' && showLayerPanel && workbenchSidebarTab === 'analyze-models') {
      setShowLayerPanel(false);
      announce('Model builder closed');
      return;
    }
    handleOpenAnalyzeTab('analyze-models', 'Model builder opened in Analyze Models');
  }, [activeActivityId, announce, handleOpenAnalyzeTab, showLayerPanel, workbenchSidebarTab]);
  const handleToggleWorkflowDrawer = useCallback(() => {
    if (activeActivityId === 'analyze' && showLayerPanel && workbenchSidebarTab === 'analyze-workflows') {
      setShowLayerPanel(false);
      setWorkflowPreview(null);
      announce('Spatial workflows closed');
      return;
    }
    handleOpenAnalyzeTab('analyze-workflows', 'Spatial workflows opened in Analyze Workflows');
  }, [activeActivityId, announce, handleOpenAnalyzeTab, setWorkflowPreview, showLayerPanel, workbenchSidebarTab]);
  const handleToggleNLQueryPanel = useCallback(() => {
    if (activeActivityId === 'analyze' && showLayerPanel && workbenchSidebarTab === 'analyze-query') {
      setShowLayerPanel(false);
      announce('Map query builder closed');
      return;
    }
    handleOpenAnalyzeTab('analyze-query', 'Map query builder opened in Analyze Query');
  }, [activeActivityId, announce, handleOpenAnalyzeTab, showLayerPanel, workbenchSidebarTab]);
  const handleToggleClusterViz = useCallback(() => {
    const closing = activeActivityId === 'analyze' && workbenchSidebarTab === 'analyze-statistics' && showClusterViz;
    handleOpenAnalyzeTab('analyze-statistics', closing ? 'LISA cluster panel closed' : 'LISA cluster panel opened in Analyze Statistics');
    if (!closing) {
      setShowClusterViz(true);
    }
  }, [activeActivityId, handleOpenAnalyzeTab, showClusterViz, workbenchSidebarTab]);
  const handleToggleHotSpotViz = useCallback(() => {
    const closing = activeActivityId === 'analyze' && workbenchSidebarTab === 'analyze-statistics' && showHotSpotViz;
    handleOpenAnalyzeTab('analyze-statistics', closing ? 'Getis-Ord Gi* panel closed' : 'Getis-Ord Gi* panel opened in Analyze Statistics');
    if (!closing) {
      setShowHotSpotViz(true);
    }
  }, [activeActivityId, handleOpenAnalyzeTab, showHotSpotViz, workbenchSidebarTab]);
  const handleToggleEmergingHotSpotViz = useCallback(() => {
    const closing = activeActivityId === 'analyze' && workbenchSidebarTab === 'analyze-statistics' && showEmergingHotSpotViz;
    handleOpenAnalyzeTab('analyze-statistics', closing ? 'Emerging hot spot panel closed' : 'Emerging hot spot panel opened in Analyze Statistics');
    if (!closing) {
      setShowEmergingHotSpotViz(true);
    }
  }, [activeActivityId, handleOpenAnalyzeTab, showEmergingHotSpotViz, workbenchSidebarTab]);
  const handleSelectionStatisticsReady = useCallback(
    (summary: SelectionStatisticsSummary[]) => {
      if (summary.length === 0) {
        return;
      }
      openRightDockPanel('selection', 'Selection statistics opened in the right dock', 'programmatic', 'statistics');
    },
    [openRightDockPanel]
  );
  const { handleToggleRestrictToMapView, handleOpenFlowDispatchDialog, handleRunSelectionStatistics, handleDispatchFlowSelection, handleIsochroneDispatch } = useMapAoiDispatch({
    announce,
    compatibleAoiFlows,
    contextSummary,
    currentMapBounds,
    flowDispatchAoi,
    onSelectionStatisticsReady: handleSelectionStatisticsReady,
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
  const { csvLatitudeColumn, csvLongitudeColumn, exportFormat, exportIncludeProperties, exportPrecision, exportPrettyPrint, exportTarget, importLabel, importProgress, isDragActive, isExportingMapImage, isExportingOfflinePackage, isGeneratingMapExportPreview, isImporting, loadingTeachingDatasetId, mapCompositionOptions, mapExportPreviewUrl, pendingColumnarImport, pendingCsvImport, pendingImportPreview, setCsvLatitudeColumn, setCsvLongitudeColumn, setExportFormat, setExportIncludeProperties, setExportPrecision, setExportPrettyPrint, setExportTarget, setImportLabel, setImportProgress, setIsDragActive, setIsExportingMapImage, setIsExportingOfflinePackage, setIsGeneratingMapExportPreview, setIsImporting, setLoadingTeachingDatasetId, setMapCompositionOptions, setMapExportPreviewUrl, setPendingColumnarImport, setPendingCsvImport, setPendingImportPreview, setShowExportDialog, setShowImportHub, setShowImportProgress, setShowMapExportDialog, showExportDialog, showImportHub, showImportProgress, showMapExportDialog } = useMapImportExportState();
  const [isLoadingPointSymbology, setIsLoadingPointSymbology] = useState(false);
  const [pointSymbologyError, setPointSymbologyError] = useState<string | null>(null);
  const [pointSymbologyCollection, setPointSymbologyCollection] = useState<GeoJSON.FeatureCollection | null>(null);
  const [pointSymbologyFields, setPointSymbologyFields] = useState<NumericFieldInfo[]>([]);
  const { isLoadingProject, isSavingProject, lastAutoSaveTriggerRef, lastSavedAt, lastSavedProjectTriggerRef, setIsLoadingProject, setIsSavingProject, setLastSavedAt } = useMapProjectPersistenceState();
  const [rerunningAnalysisToken, setRerunningAnalysisToken] = useState<string | null>(null);
  const [selectedTemporalLayerId, setSelectedTemporalLayerId] = useState<string | null>(null);
  const [temporalFrameExportRequest, setTemporalFrameExportRequest] = useState<TemporalFrameExportPayload | null>(null);

  const currentProjectSaveTrigger = useMemo<MapProjectSaveTrigger>(
    () => ({
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
    }),
    [activeBaseLayer, annotations, bearing, bookmarks, center, drawnFeatures, overlayLayers, pins, pitch, selectedProjectId, sourceHandles, zoom]
  );

  const hasPersistableMapContent = overlayLayers.length > 0 || pins.length > 0 || drawnFeatures.length > 0 || annotations.length > 0 || bookmarks.length > 0;
  const hasUnsavedProjectChanges = Boolean(selectedProjectId && hasPersistableMapContent && !sameMapProjectSaveTrigger(lastSavedProjectTriggerRef.current, currentProjectSaveTrigger));

  const pinMode = activeTool === 'pin';
  const mapCanvasCaptureMode = showMapExportDialog || isGeneratingReportHandoffSnapshot || isExportingReportHandoffPdf || isExportingMapImage;
  const annotationMode = activeTool === 'annotate';
  const selectedPointSymbologyLayer = pointSymbologyLayerId ? (overlayLayers.find(layer => layer.id === pointSymbologyLayerId) ?? null) : null;
  const activeStyleLayer = useMemo(() => {
    if (styleWorkspaceLayerId) {
      const explicitLayer = overlayLayers.find(layer => layer.id === styleWorkspaceLayerId);
      if (explicitLayer) return explicitLayer;
    }

    return selectedPointSymbologyLayer ?? inspectorLayer ?? overlayLayers.find(layer => layer.visible) ?? overlayLayers[0] ?? null;
  }, [inspectorLayer, overlayLayers, selectedPointSymbologyLayer, styleWorkspaceLayerId]);
  const topSurfaceActiveLayer = attributeTableLayer ?? inspectorLayer ?? activeStyleLayer;
  useEffect(() => {
    if (styleWorkspaceLayerId && !overlayLayers.some(layer => layer.id === styleWorkspaceLayerId)) {
      setStyleWorkspaceLayerId(null);
    }
  }, [overlayLayers, styleWorkspaceLayerId]);
  const contentsRenderLayers = useMemo(() => applyContentsToRenderLayers(overlayLayers, zoom), [overlayLayers, zoom]);
  const interactiveAnalysisLayerIds = useMemo(() => contentsRenderLayers.filter(layer => layer.visible && (layer.queryable ?? (layer.type === 'geojson' || layer.type === 'heatmap'))).map(layer => layer.id), [contentsRenderLayers]);
  const visiblePublicationLayers = useMemo(() => overlayLayers.filter(layer => layer.visible), [overlayLayers]);
  const mapPublicationLegendItems = useMemo(() => buildMapCompositionLegendItems(visiblePublicationLayers), [visiblePublicationLayers]);
  const mapPublicationReadiness = useMemo(
    () =>
      buildMapPublicationReadiness({
        mode: 'publication-export',
        overlayLayers: visiblePublicationLayers,
        composition: mapCompositionOptions,
        scientificQA,
        legendItems: mapPublicationLegendItems,
      }),
    [mapCompositionOptions, mapPublicationLegendItems, scientificQA, visiblePublicationLayers]
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
  }, [activeBaseLayer, bearing, center, currentMapBounds, overlayLayers, pitch, reportHandoffOptions, reportHandoffSnapshot, reportHandoffSource, scientificQA, selectedFeatureIds, zoom]);
  const workflowPreviewLayer = useMemo(() => (effectiveShowWorkflowDrawer ? buildMapWorkflowPreviewLayer(workflowPreview, workflowContext) : null), [effectiveShowWorkflowDrawer, workflowContext, workflowPreview]);
  const mapRenderLayers = useMemo(() => {
    const comparison = effectiveShowWorkflowDrawer ? workflowPreview?.comparisonState : undefined;
    const baseLayers =
      comparison?.view === 'blend'
        ? contentsRenderLayers.map(layer => {
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
  const performanceDiagnostics = useMemo(() => buildMapPerformanceDiagnostics({ overlayLayers: mapRenderLayers, timings: performanceTimings, telemetryEvents }), [mapRenderLayers, performanceTimings, telemetryEvents]);
  const performanceWarningFingerprint = performanceDiagnostics.warnings.join(' | ');
  useEffect(() => {
    if (!performanceWarningFingerprint) {
      return;
    }
    performanceWarningFingerprint.split(' | ').forEach(warning => {
      recordMapTelemetryEvent(
        {
          kind: 'performance.budget',
          severity: 'warning',
          source: 'performance-diagnostics',
          message: warning,
          code: 'MAP_PERFORMANCE_BUDGET',
          recoverable: true,
          recoveryLabel: 'Review render budgets',
          details: {
            renderMode: performanceDiagnostics.renderMode,
            previewLayerCount: performanceDiagnostics.previewLayerCount,
            visibleLayerCount: performanceDiagnostics.visibleLayerCount,
            workerTransferBytes: performanceDiagnostics.workerTransferBytes,
          },
          fingerprint: `performance:${warning}`,
        },
        { dedupeKey: `performance:${warning}`, dedupeMs: 30_000 }
      );
    });
  }, [performanceDiagnostics.previewLayerCount, performanceDiagnostics.renderMode, performanceDiagnostics.visibleLayerCount, performanceDiagnostics.workerTransferBytes, performanceWarningFingerprint]);
  const performanceIssueCount = performanceDiagnostics.warnings.length + performanceDiagnostics.telemetrySummary.warningCount + performanceDiagnostics.telemetrySummary.errorCount;
  const toolbarActiveGeometryType = useMemo(() => {
    const selectedLayer = selectedPointSymbologyLayer?.visible ? selectedPointSymbologyLayer : (visiblePublicationLayers[0] ?? null);
    return selectedLayer?.metadata?.geometryType ?? null;
  }, [selectedPointSymbologyLayer, visiblePublicationLayers]);
  // Prompt 46 — store-driven temporal player (frame export + playback engine).
  const temporalActiveFrameIndex = useTemporalLayerStore(state => state.activeFrameIndex);
  const temporalIsPlaying = useTemporalLayerStore(state => state.isPlaying);
  const temporalPlaybackSpeed = useTemporalLayerStore(state => state.speed);
  const temporalRuntimeMode = useTemporalLayerStore(state => state.runtimeMode);
  const temporalSetFrames = useTemporalLayerStore(state => state.setFrames);
  const temporalSetLayerReferences = useTemporalLayerStore(state => state.setLayerReferences);
  const temporalSetPlaybackMode = useTemporalLayerStore(state => state.setPlaybackMode);
  const temporalSetSpeed = useTemporalLayerStore(state => state.setSpeed);
  const temporalGoToFrame = useTemporalLayerStore(state => state.goToFrame);
  const temporalPlay = useTemporalLayerStore(state => state.play);
  const temporalPause = useTemporalLayerStore(state => state.pause);
  const temporalBuildEvidence = useTemporalLayerStore(state => state.buildEvidence);
  const temporalReset = useTemporalLayerStore(state => state.reset);
  const rasterLayerStates = useRasterLayerStore(state => state.layers);
  const rasterLayerIds = useMemo(() => Object.keys(rasterLayerStates), [rasterLayerStates]);
  const activeRasterLayerId = rasterLayerIds[0] ?? null;
  const activeRasterLayerName = activeRasterLayerId ? (overlayLayers.find(layer => layer.id === activeRasterLayerId)?.name ?? activeRasterLayerId) : 'Raster layer';
  const activeRasterState = activeRasterLayerId ? rasterLayerStates[activeRasterLayerId] : undefined;
  const temporalLayers = useMemo(() => overlayLayers.filter(layer => layer.visible && layer.metadata?.analysisResult?.visualization.kind === 'temporal' && (layer.metadata.analysisResult.visualization.temporalFrames?.length ?? 0) > 0), [overlayLayers]);
  const activeTemporalLayer = temporalLayers.find(layer => layer.id === selectedTemporalLayerId) ?? temporalLayers[0] ?? null;
  const activeTemporalVisualization = activeTemporalLayer?.metadata?.analysisResult?.visualization?.kind === 'temporal' ? activeTemporalLayer.metadata.analysisResult.visualization : null;
  const activeTemporalFrames = activeTemporalVisualization?.temporalFrames ?? [];
  const activeTemporalFrameDefinitions = useMemo<TemporalFrameDefinition[]>(() => buildTemporalFrameDefinitions(activeTemporalFrames, activeTemporalVisualization?.valueField), [activeTemporalFrames, activeTemporalVisualization?.valueField]);
  const activeTemporalSourceFields = useMemo(() => collectTemporalSourceFields(activeTemporalFrames, activeTemporalVisualization?.timeProperty), [activeTemporalFrames, activeTemporalVisualization?.timeProperty]);
  const activeTemporalSourceMode = useMemo(() => resolveTemporalRuntimeMode(activeTemporalLayer), [activeTemporalLayer]);
  const temporalLayoutRestoreRequest = useMemo(() => (temporalFrameExportRequest ? { id: temporalFrameExportRequest.exportedAt, metadata: temporalFrameExportRequest.restoreMetadata } : null), [temporalFrameExportRequest]);
  const scene3DMode = useScene3DStore(selectScene3DMode);
  const scene3DActiveLayerCrs = useScene3DStore(selectScene3DActiveLayerCrs);
  const scene3DBuildings = useScene3DStore(selectScene3DBuildings);
  const scene3DCityModelHandle = useScene3DStore(selectScene3DCityModelSourceHandle);
  const scene3DTerrainHandle = useScene3DStore(selectScene3DTerrainSourceHandle);
  const sceneUrbanFormCrs = scene3DActiveLayerCrs ?? sourceHandleCrs(scene3DTerrainHandle) ?? sourceHandleCrs(scene3DCityModelHandle);
  const sceneUrbanFormVerticalDatum = sceneVerticalDatumValue(scene3DTerrainHandle, scene3DCityModelHandle);

  const handleMapContainerRef = useCallback((element: HTMLDivElement | null) => {
    mapContainerRef.current = element;
    setMapContainerElement(element);
  }, []);

  const handleLayerPanelWidthChange = useCallback(
    (width: number) => {
      setLayoutPreferences({ layerPanelWidth: width });
    },
    [setLayoutPreferences]
  );

  const handleRightPanelWidthChange = useCallback(
    (width: number) => {
      setLayoutPreferences({ rightPanelWidth: width });
    },
    [setLayoutPreferences]
  );

  const handleRightDockHostPanelChange = useCallback(
    (panel: MapRightDockPanel) => {
      const definition = getMapRightDockPanelDefinition(panel);
      switchRightDockRoute(
        createMapRightDockRoute(panel, {
          source: 'panel-tab',
          focusReturn: activeRightDockRoute?.focusReturn ?? 'trigger',
          detail: activeRightDockRoute?.detail ?? null,
        })
      );
      if (panel === 'attributes' || panel === 'selection' || panel === 'timeline' || panel === 'tasks' || panel === 'measure' || panel === 'collaboration' || panel === 'problems' || panel === 'scientificQA' || panel === 'qa' || panel === 'diagnostics' || panel === 'performance') {
        setShowReviewTimeline(false);
        setShowScientificQAPanel(false);
        setShowMeasurePanel(false);
      }
      setActiveActivityId(definition.activityId);
      announce(`${definition.label} opened in the right dock`);
    },
    [activeRightDockRoute?.detail, activeRightDockRoute?.focusReturn, announce, switchRightDockRoute]
  );

  const handleCollapseRightDockHost = useCallback(() => {
    closeRightDockRoute();
    announce('Right dock collapsed');
  }, [announce, closeRightDockRoute]);

  const handleCloseRightDockHost = useCallback(() => {
    closeRightDockRoute();
    announce('Right dock closed');
    restoreFocusToElement(bottomPanelReturnFocusRef.current);
  }, [announce, closeRightDockRoute]);

  const handleSetWorkspaceView = useCallback(
    (view: MapWorkspaceView) => {
      if (mapStartDialogState.open) {
        closeMapStartDialog('continue', 'Map launch dialog dismissed');
      }
      setWorkspaceView(view);
      // Entering the explore workspace from the navigator-centric Overview
      // activity lands on the Layers workbench so the layer stack stays the
      // default left-rail surface (matches the long-standing explore contract).
      if (view === 'explore' && activeActivityId === 'overview') {
        setActiveActivityId('layers');
        setWorkbenchSidebarTab('layers-stack');
      }
      announce(`Map workspace switched to ${view}`);
    },
    [activeActivityId, announce, closeMapStartDialog, mapStartDialogState.open]
  );

  const focusActiveActivityButton = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-testid="activity-btn-${activeActivityId}"]`);
    restoreFocusToElement(target);
  }, [activeActivityId]);

  const focusInteractiveMapCanvas = useCallback(() => {
    const focusCanvas = () => {
      document.getElementById(mapCanvasId)?.focus({ preventScroll: true });
    };
    focusCanvas();
    window.requestAnimationFrame(focusCanvas);
    announce('Interactive map canvas focused');
  }, [announce, mapCanvasId]);

  const activeTaskLens = useMemo(() => getRuntimeMapTaskLensDefinition(activeTaskLensId), [activeTaskLensId]);

  const handleRestoreDefaultWidths = useCallback(() => {
    setLayoutPreferences({
      layerPanelWidth: DEFAULT_MAP_EXPLORER_LAYOUT_PREFERENCES.layerPanelWidth,
      rightPanelWidth: DEFAULT_MAP_EXPLORER_LAYOUT_PREFERENCES.rightPanelWidth,
    });
    announce(`Default panel widths restored (${DEFAULT_MAP_EXPLORER_LAYOUT_PREFERENCES.layerPanelWidth}px sidebar, ${DEFAULT_MAP_EXPLORER_LAYOUT_PREFERENCES.rightPanelWidth}px inspector)`);
  }, [announce, setLayoutPreferences]);

  const handleCollapseAllPanels = useCallback(() => {
    closeFloatingRightPanels();
    closeRightDockPanels();
    closeRightDockRoute();
    setLayoutPreferences({ panelMode: 'collapsed' });
    setShowLayerPanel(false);
    setWorkbenchSidebarCollapsed(true);
    setShowScientificQAPanel(false);
    setShowReviewTimeline(false);
    setShowProcessingToolbox(false);
    setShowModelBuilder(false);
    setShowPluginPanel(false);
    setShowFigureComposer(false);
    setShowInteractionStrip(false);
    setShowComparisonStrip(false);
    setShowWorkflowDrawer(false);
    setWorkflowPreview(null);
    announce('All map panels collapsed');
  }, [announce, closeRightDockRoute, closeFloatingRightPanels, closeRightDockPanels, setLayoutPreferences, setShowWorkflowDrawer, setWorkflowPreview]);

  const handleResetLayout = useCallback(() => {
    closeFloatingRightPanels();
    closeRightDockPanels();
    closeRightDockRoute();
    restoreDefaultLayoutPreferences();
    setWorkspaceView('explore');
    setActiveActivityId('layers');
    setWorkbenchSidebarTab('layers-stack');
    setWorkbenchSidebarCollapsed(false);
    setShowLayerPanel(true);
    setShowScientificQAPanel(false);
    setShowReviewTimeline(false);
    setShowProcessingToolbox(false);
    setShowModelBuilder(false);
    setShowPluginPanel(false);
    setShowFigureComposer(false);
    setShowInteractionStrip(false);
    setShowComparisonStrip(false);
    setShowWorkflowDrawer(false);
    setWorkflowPreview(null);
    announce('Map layout reset to map-first chrome');
  }, [announce, closeRightDockRoute, closeFloatingRightPanels, closeRightDockPanels, restoreDefaultLayoutPreferences, setShowWorkflowDrawer, setWorkflowPreview]);

  const handleTaskLensChange = useCallback(
    (nextTaskLensId: MapTaskLensId) => {
      const nextLens = getRuntimeMapTaskLensDefinition(nextTaskLensId);
      const targetActivityId = nextLens.defaultActivityId;
      const targetActivity = getRuntimeMapActivityDefinition(targetActivityId);
      const sidebarTab = nextLens.sidebarTabPriority[0] ?? targetActivity.defaultSidebarTabId ?? 'layers-stack';

      closeFloatingRightPanels();
      closeRightDockPanels();
      setShowProcessingToolbox(false);
      setShowModelBuilder(false);
      setShowPluginPanel(false);
      setShowScientificQAPanel(false);
      setShowWorkflowDrawer(false);
      setWorkflowPreview(null);
      setWorkbenchSidebarCollapsed(false);
      setActiveActivityId(targetActivityId);
      setWorkbenchSidebarTab(sidebarTab);
      setWorkspaceView(targetActivityId === 'analyze' ? 'analyze' : 'explore');

      if (targetActivityId === 'qa') {
        setShowLayerPanel(false);
        openRightDockPanel('problems', 'QA Problems opened in the right dock', 'toolbar');
      } else if (targetActivityId === 'review') {
        setShowLayerPanel(false);
        openRightDockPanel('timeline', 'Review timeline opened in the right dock', 'toolbar');
      } else if (targetActivityId === 'diagnostics') {
        setShowLayerPanel(false);
        setShowReviewTimeline(false);
        openPerformanceRightDock('Performance diagnostics opened in the right dock', 'toolbar');
      } else {
        setShowReviewTimeline(false);
        setShowLayerPanel(true);
      }

      announce(`${nextLens.label} lens applied`);
    },
    [announce, closeFloatingRightPanels, closeRightDockPanels, openPerformanceRightDock, openRightDockPanel, setShowWorkflowDrawer, setWorkflowPreview]
  );

  useEffect(() => {
    if (workspaceView !== 'analyze') {
      setShowLayerPanel(true);
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
      if (activeMeasureTool) {
        setActiveMeasureTool(null);
      }
      return;
    }

    setShowLayerPanel(true);
    if (activeRightDockRoute?.panel === 'measure') {
      setShowDrawPanel(false);
      setShowMeasurePanel(true);
    } else if (activeRightDockRoute?.panel === 'draw') {
      setShowMeasurePanel(false);
      setShowDrawPanel(true);
    } else {
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
    }
  }, [activeMeasureTool, activeRightDockRoute?.panel, setActiveMeasureTool, workspaceView]);

  useEffect(() => {
    if (!selectionDragTool) {
      return;
    }
    if (activeTool || activeDrawTool || activeMeasureTool) {
      setSelectionDragTool(null);
    }
  }, [activeDrawTool, activeMeasureTool, activeTool, selectionDragTool]);

  useEffect(() => {
    if (!open) return undefined;
    if (!mapContainerElement) return undefined;

    const updateWidth = () => {
      setMapContainerWidth(Math.round(mapContainerElement.getBoundingClientRect().width));
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
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

    if (!selectedTemporalLayerId || !temporalLayers.some(layer => layer.id === selectedTemporalLayerId)) {
      setSelectedTemporalLayerId(temporalLayers[0]!.id);
    }
  }, [selectedTemporalLayerId, temporalLayers]);

  useEffect(() => {
    temporalFrameSyncRef.current = { map: 0, temporal: 0 };
    temporalPlaybackSyncRef.current = { map: false, temporal: false };
    setIsPlaying(false);
    setCurrentTimestep(0);
  }, [activeTemporalLayer?.id, setCurrentTimestep, setIsPlaying]);

  useEffect(() => {
    if (!activeTemporalLayer || activeTemporalFrameDefinitions.length === 0) {
      temporalReset();
      return;
    }

    temporalSetFrames(activeTemporalFrameDefinitions);
    temporalSetPlaybackMode('snapshot');
    temporalSetLayerReferences({
      activeLayerId: activeTemporalLayer.id,
      sourceId: activeTemporalLayer.metadata?.sourceId ?? activeTemporalLayer.id,
      layerId: activeTemporalLayer.id,
      layerName: activeTemporalLayer.name,
      sourceFields: activeTemporalSourceFields,
      timeField: activeTemporalVisualization?.timeProperty ?? null,
      runtimeMode: activeTemporalSourceMode,
    });
  }, [activeTemporalFrameDefinitions, activeTemporalLayer?.id, activeTemporalLayer?.metadata?.sourceId, activeTemporalLayer?.name, activeTemporalSourceFields, activeTemporalSourceMode, activeTemporalVisualization?.timeProperty, temporalReset, temporalSetFrames, temporalSetLayerReferences, temporalSetPlaybackMode]);

  const temporalFrameSyncRef = useRef({
    map: currentTimestep,
    temporal: temporalActiveFrameIndex,
  });
  const temporalSpeedSyncRef = useRef({
    map: mapPlaybackSpeed,
    temporal: temporalPlaybackSpeed,
  });
  const temporalPlaybackSyncRef = useRef({
    map: mapIsPlaying,
    temporal: temporalIsPlaying,
  });

  useEffect(() => {
    const previous = temporalFrameSyncRef.current;
    if (currentTimestep === temporalActiveFrameIndex) {
      temporalFrameSyncRef.current = { map: currentTimestep, temporal: temporalActiveFrameIndex };
      return;
    }

    const mapChanged = currentTimestep !== previous.map;
    const temporalChanged = temporalActiveFrameIndex !== previous.temporal;

    if (mapChanged && !temporalChanged) {
      temporalFrameSyncRef.current = { map: currentTimestep, temporal: currentTimestep };
      temporalGoToFrame(currentTimestep);
      return;
    }

    temporalFrameSyncRef.current = {
      map: temporalActiveFrameIndex,
      temporal: temporalActiveFrameIndex,
    };
    setCurrentTimestep(temporalActiveFrameIndex);
  }, [currentTimestep, setCurrentTimestep, temporalActiveFrameIndex, temporalGoToFrame]);

  useEffect(() => {
    const previous = temporalSpeedSyncRef.current;
    if (mapPlaybackSpeed === temporalPlaybackSpeed) {
      temporalSpeedSyncRef.current = { map: mapPlaybackSpeed, temporal: temporalPlaybackSpeed };
      return;
    }

    const mapChanged = mapPlaybackSpeed !== previous.map;
    const temporalChanged = temporalPlaybackSpeed !== previous.temporal;

    if (mapChanged && !temporalChanged) {
      temporalSpeedSyncRef.current = { map: mapPlaybackSpeed, temporal: mapPlaybackSpeed };
      temporalSetSpeed(mapPlaybackSpeed);
      return;
    }

    temporalSpeedSyncRef.current = {
      map: temporalPlaybackSpeed,
      temporal: temporalPlaybackSpeed,
    };
    setPlaybackSpeed(temporalPlaybackSpeed);
  }, [mapPlaybackSpeed, setPlaybackSpeed, temporalPlaybackSpeed, temporalSetSpeed]);

  useEffect(() => {
    const previous = temporalPlaybackSyncRef.current;
    if (mapIsPlaying === temporalIsPlaying) {
      temporalPlaybackSyncRef.current = { map: mapIsPlaying, temporal: temporalIsPlaying };
      return;
    }

    const mapChanged = mapIsPlaying !== previous.map;
    const temporalChanged = temporalIsPlaying !== previous.temporal;

    if (mapChanged && !temporalChanged) {
      temporalPlaybackSyncRef.current = { map: mapIsPlaying, temporal: mapIsPlaying };
      if (mapIsPlaying) {
        temporalPlay();
        return;
      }
      temporalPause();
      return;
    }

    temporalPlaybackSyncRef.current = {
      map: temporalIsPlaying,
      temporal: temporalIsPlaying,
    };
    setIsPlaying(temporalIsPlaying);
  }, [mapIsPlaying, setIsPlaying, temporalIsPlaying, temporalPause, temporalPlay]);

  useEffect(() => {
    if (!activeTemporalLayer) {
      return;
    }
    const evidence = temporalBuildEvidence();
    if (!evidence) {
      return;
    }
    const existing = activeTemporalLayer.metadata?.temporalEvidence;
    const matchesExisting = existing?.temporalEvidenceId === evidence.temporalEvidenceId && existing?.step.index === evidence.step.index && existing?.frameCount === evidence.frameCount && existing?.timeField === evidence.timeField && existing?.playback.speed === evidence.playback.speed && existing?.playback.isPlaying === evidence.playback.isPlaying && existing?.reportExportFrameReference.frameIndex === evidence.reportExportFrameReference.frameIndex && existing?.playbackParameters.runtimeMode === evidence.playbackParameters.runtimeMode;
    if (matchesExisting) {
      return;
    }
    updateLayerMetadata(activeTemporalLayer.id, {
      metadata: mergeTemporalEvidenceIntoMetadata(activeTemporalLayer.metadata, evidence),
    });
  }, [activeTemporalLayer, temporalActiveFrameIndex, temporalBuildEvidence, temporalIsPlaying, temporalPlaybackSpeed, temporalRuntimeMode, updateLayerMetadata]);

  const handleTemporalLayerSelection = useCallback(
    (nextLayerId: string) => {
      setSelectedTemporalLayerId(nextLayerId);
      setActiveAnalysisResultLayers([nextLayerId]);
      setIsPlaying(false);
      setCurrentTimestep(0);

      const nextLayer = temporalLayers.find(layer => layer.id === nextLayerId);
      if (nextLayer) {
        announce(`Temporal layer selected: ${nextLayer.name}`);
      }
    },
    [announce, setActiveAnalysisResultLayers, setCurrentTimestep, setIsPlaying, temporalLayers]
  );

  const handleTemporalFrameExport = useCallback(
    (payload: TemporalFrameExportPayload) => {
      setTemporalFrameExportRequest(payload);
      setIsPlaying(false);
      handleOpenPublishTab('publish-figure', `Temporal frame ready for export: ${payload.frameLabel}`);
    },
    [handleOpenPublishTab, setIsPlaying]
  );

  const handleTemporalRestoreRequestHandled = useCallback((id: string) => {
    setTemporalFrameExportRequest(current => (current?.exportedAt === id ? null : current));
  }, []);

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
        .then(qa => {
          if (!cancelled && scientificQASequenceRef.current === sequence) {
            setScientificQA(qa);
          }
        })
        .catch(error => {
          if (cancelled) {
            return;
          }
          const message = error instanceof Error ? error.message : 'Scientific QA could not complete for the current map state.';
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
    onPanAnnounce: direction => announce(`Map panned ${direction}`),
    onZoomAnnounce: z => announce(`Zoom level ${z}`),
    onResetAnnounce: () => announce('Map view reset to default'),
  });

  /* ---- Map instance callbacks ---- */
  const handleMapReady = useCallback(
    (map: maplibregl.Map) => {
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
      setCurrentMapBounds([Number(bounds.getWest().toFixed(6)), Number(bounds.getSouth().toFixed(6)), Number(bounds.getEast().toFixed(6)), Number(bounds.getNorth().toFixed(6))]);

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
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: 64, duration: reducedMotion ? 0 : 900, essential: true }
          );
        }
        useMapExplorerStore.getState().consumePendingFitBounds();
      }
    },
    [mapCanvasRef, reducedMotion, setCurrentMapBounds]
  );

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

  const handleZoomChange = useCallback(
    (z: number) => {
      setViewport({ zoom: z });
    },
    [setViewport]
  );

  const handleViewportChange = useCallback(
    (v: { center: [number, number]; zoom: number; bearing: number; pitch: number }, meta?: { userInitiated: boolean }) => {
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
        setCurrentMapBounds([Number(bounds.getWest().toFixed(6)), Number(bounds.getSouth().toFixed(6)), Number(bounds.getEast().toFixed(6)), Number(bounds.getNorth().toFixed(6))]);
      }

      if (shouldPublishViewportSync) {
        publishViewportSync({
          source: 'map-2d',
          center: v.center,
          zoom: v.zoom,
          bearing: v.bearing,
          pitch: v.pitch,
        });
      }
    },
    [setCurrentMapBounds, setViewport, viewportSyncEnabled]
  );

  const handleToggleViewportSync = useCallback(() => {
    const nextEnabled = !useViewportSyncStore.getState().enabled;
    setViewportSyncEnabled(nextEnabled);
    announce(nextEnabled ? '2D and 3D viewport sync enabled' : '2D and 3D viewport sync disabled');
  }, [announce]);

  const handleExternalServiceProgress = useCallback((detail: MapServiceDialogProgressDetail) => {
    setIsImporting(detail.busy);
    setImportLabel(detail.label);
    setImportProgress(detail.progress);
    setShowImportProgress(detail.busy || detail.progress !== null);
  }, []);

  const handleOpenVoxCityOverlayFromService = useCallback(() => {
    setShowSidebar(false);
    setShowDrawPanel(false);
    setShowMeasurePanel(false);
    handleOpenSceneTab('scene-voxcity', 'VoxCity 2D overlay opened in Scene');
  }, [handleOpenSceneTab]);

  const handleMapRenderError = useCallback(
    (message: string) => {
      const now = Date.now();
      const previous = lastMapRenderErrorRef.current;
      if (previous?.message === message && now - previous.timestamp < MAP_RENDER_ERROR_NOTICE_COOLDOWN_MS) {
        return;
      }

      lastMapRenderErrorRef.current = { message, timestamp: now };
      setDispatchFeedback({
        tone: 'error',
        title: 'External service render issue',
        description: message,
      });
      toastWarning(message);
      announce(message);
    },
    [announce]
  );

  const handleMapClick = useCallback(
    (coords: { lng: number; lat: number }) => {
      const newPin: MapPin = {
        id: `pin-${Date.now()}`,
        lng: coords.lng,
        lat: coords.lat,
        label: `Pin ${pins.length + 1}`,
      };
      addPin(newPin);
      announce(`Pin added: ${newPin.label} at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    },
    [pins.length, addPin, announce]
  );

  /* ---- Wrapped actions with announcements ---- */
  const handleSetBaseLayer = useCallback(
    (layer: import('../mapTypes').BaseLayerId) => {
      setBaseLayer(layer);
      const names: Record<string, string> = {
        streets: 'OpenStreetMap',
        dark: 'Dark Matter',
        satellite: 'Satellite',
        terrain: 'Positron',
      };
      announce(`Base layer switched to ${names[layer] ?? layer}`);
    },
    [setBaseLayer, announce]
  );

  const handleRemovePin = useCallback(
    (id: string) => {
      const pin = pins.find(p => p.id === id);
      removePin(id);
      announce(`Pin removed: ${pin?.label ?? id}`);
    },
    [removePin, pins, announce]
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
          kind: 'workflow.apply',
          workflowId: result.manifest.workflowId,
          outputLayer: result.layer,
          canApply: true,
          manifest: result.manifest,
        },
        buildMapActionEffects()
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
        if (mapState.drawnFeatures.some(feature => feature.id === drawnAoi.id)) {
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
      const bounds = result.layer.metadata?.bounds ?? (result.preview.featureCollection ? getFeatureCollectionBounds(result.preview.featureCollection) : undefined);
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
              }
            );
          }
        }
      }
      setActiveAnalysisResultLayers([result.layer.id]);
      setInspectorLayerId(result.layer.id);
      setWorkflowReportItems(current => {
        const filtered = current.filter(item => item.id !== result.reportItem.id);
        return [...filtered, result.reportItem];
      });
      upsertMapEvidenceArtifact(
        createMapWorkflowResultEvidenceArtifact({
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
            source: 'workflow-summary',
            notes: [`Expected output group: ${result.manifest.expectedOutput.outputLayerGroup}`],
          },
          qa: {
            state: result.manifest.qaSummary.status === 'blocked' ? 'blocked' : result.manifest.qaSummary.warningCount > 0 ? 'warning' : 'passed',
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
        })
      );
      recordMapReviewEvent({
        id: workflowOutcome.result.commandId,
        type: 'workflow-action',
        status: 'applied',
        title: `Workflow applied: ${result.reportItem.title}`,
        summary: `${result.preview.workflow} workflow committed ${result.layer.name} as a derived, inspectable map layer.`,
        layerIds: [result.layer.id, ...result.reportItem.sourceLayerIds],
        reportItemIds: [result.reportItem.id],
        undo: {
          available: true,
          actionLabel: `Remove derived layer ${result.layer.name}`,
          outcome: 'Derived layer can be removed from the layer stack.',
        },
        details: {
          commandId: workflowOutcome.result.commandId,
          commandKind: 'workflow.apply',
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
        tone: 'success',
        title: 'Workflow applied',
        description: message,
      });
      toastSuccess(message);
      announce(message);
    },
    [announce, buildMapActionEffects, recordMapActionHistory, recordMapReviewEvent, reducedMotion, setActiveAnalysisResultLayers, upsertMapEvidenceArtifact]
  );

  const handleExecuteMapWorkflow = useCallback(
    (preview: MapWorkflowPreview) => {
      if (!workflowExecutorRef.current) {
        workflowExecutorRef.current = createMapWorkflowWorkerExecutor();
      }
      setWorkflowExecution({ status: 'queued', percent: 0, stage: 'Queued' });
      announce(`Running ${preview.workflow} workflow in a background worker.`);

      void executeMapWorkflow(preview, workflowContext, workflowExecutorRef.current, {
        onProgress: update => setWorkflowExecution(update),
        registerHandle: handle => {
          workflowExecutionHandleRef.current = handle;
        },
      })
        .then(result => {
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
          const messageText = error instanceof Error ? error.message : 'Worker geometry execution failed.';
          setWorkflowExecution({ status: 'failed', percent: 0, error: messageText });
          toastWarning(`Workflow failed: ${messageText}`);
          announce(`Workflow failed: ${messageText}`);
        });
    },
    [announce, handleApplyMapWorkflow, workflowContext]
  );

  const handleCancelMapWorkflow = useCallback(() => {
    workflowExecutionHandleRef.current?.cancel();
    workflowExecutionHandleRef.current = null;
    setWorkflowExecution(null);
  }, []);

  const handleSaveWorkflowReport = useCallback(
    (report: MapWorkflowReportItem) => {
      setWorkflowReportItems(current => {
        const filtered = current.filter(item => item.id !== report.id);
        return [...filtered, report];
      });
      recordMapReviewEvent({
        type: 'report-handoff',
        status: 'recorded',
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
    [announce, recordMapReviewEvent]
  );

  const handleDispatchMapCodeArtifact = useCallback(
    async (request: MapCodeArtifactRequest) => {
      try {
        const result = await dispatchMapCodeArtifactRequest(request);
        upsertMapEvidenceArtifact(request.evidenceArtifact);
        recordMapReviewEvent({
          type: 'action-status',
          status: result.bridgeRouted ? 'applied' : 'recorded',
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
          tone: result.bridgeRouted ? 'success' : 'info',
          title: result.bridgeRouted ? 'IDE artifact opened' : 'IDE artifact registered',
          description: message,
        });
        toastSuccess(message);
        announce(message);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Map IDE artifact request failed.';
        recordMapReviewEvent({
          type: 'action-status',
          status: 'failed',
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
          tone: 'error',
          title: 'IDE artifact failed',
          description: message,
        });
        toastError(message);
        announce(`IDE artifact failed: ${message}`);
      }
    },
    [announce, recordMapReviewEvent, upsertMapEvidenceArtifact]
  );

  const handleExportMapModelToIdeAndUrban = useCallback(
    (result: MapModelRunResult, batchResult: MapModelBatchResult | null) => {
      if (!result.manifest || !result.manifestHash || !result.finalOutputLayer) {
        announce('Run the model successfully before exporting it.');
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

      const sourceLayers = result.manifest.sourceLayerIds.map(layerId => mapState.overlayLayers.find(layer => layer.id === layerId)).filter((layer): layer is OverlayLayerConfig => layer !== undefined);
      const runtimeMode = sourceLayers.some(layer => layer.sourceKind === 'demo') ? 'demo' : 'unknown';
      const handoff = sendMapContextToUrban({
        contextSummary: currentContextSummary,
        overlayLayers: mapState.overlayLayers,
        drawnFeatures: mapState.drawnFeatures,
        ...(mapState.activeAoiId ? { activeAoiId: mapState.activeAoiId } : {}),
        selectedFeatureIds: mapState.selectedFeatureIds,
        mapEvidenceArtifacts: mapState.mapEvidenceArtifacts,
        scientificQA: mapState.scientificQA,
        requestedLayerId: result.finalOutputLayer.id,
        receiver: payload => {
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
      if (handoff.status === 'blocked') {
        const reason = handoff.disabledReasons[0] ?? 'Model result is not eligible for Urban evidence publication.';
        setDispatchFeedback({ tone: 'error', title: 'Model evidence blocked', description: reason });
        announce(`Model evidence blocked: ${reason}`);
        return;
      }
      setDispatchFeedback({
        tone: 'success',
        title: 'Model exported and published',
        description: `${result.model.title} opened in Synapse IDE and published to Urban evidence.`,
      });
      announce(`${result.model.title} exported to Synapse IDE and published to Urban evidence.`);
    },
    [announce, handleDispatchMapCodeArtifact]
  );

  const handleOpenLayerInIde = useCallback(
    (layerId: string) => {
      const layer = overlayLayers.find(entry => entry.id === layerId);
      if (!layer) {
        const message = 'Layer is no longer available for IDE handoff.';
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
    },
    [announce, contextSummary, handleDispatchMapCodeArtifact, mapEvidenceArtifacts, overlayLayers, scientificQA]
  );

  const handleOpenWorkflowScriptInIde = useCallback(
    (preview: MapWorkflowPreview) => {
      const request = buildWorkflowScriptRequest({
        contextSummary,
        overlayLayers,
        mapEvidenceArtifacts,
        scientificQA,
        workflowManifest: preview.manifest,
      });
      void handleDispatchMapCodeArtifact(request);
    },
    [contextSummary, handleDispatchMapCodeArtifact, mapEvidenceArtifacts, overlayLayers, scientificQA]
  );

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
    const next = pinMode ? null : 'pin';
    setActiveTool(next as import('../mapTypes').MapToolId);
    announce(next ? 'Pin mode enabled — click map to add pins' : 'Pin mode disabled');
  }, [pinMode, setActiveTool, announce]);

  const handleToggleAnnotationMode = useCallback(() => {
    const next = annotationMode ? null : 'annotate';
    setActiveTool(next as import('../mapTypes').MapToolId);
    if (next) {
      setActiveDrawTool(null);
      setActiveMeasureTool(null);
      setShowSidebar(false);
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
      setWorkspaceView('explore');
      announce('Text annotation tool enabled');
    } else {
      announce('Text annotation tool disabled');
    }
  }, [annotationMode, announce, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const handleDeactivateAnnotationMode = useCallback(() => {
    if (useMapExplorerStore.getState().activeTool === 'annotate') {
      setActiveTool(null);
    }
  }, [setActiveTool]);

  const handleOpenPointSymbology = useCallback(
    (layerId: string) => {
      const layerName = overlayLayers.find(layer => layer.id === layerId)?.name ?? layerId;
      if (pointSymbologyLayerId === layerId && activeActivityId === 'style' && showLayerPanel && workbenchSidebarTab === 'style-symbols') {
        setPointSymbologyLayerId(null);
        announce('Point symbology panel closed');
        return;
      }

      setPointSymbologyLayerId(layerId);
      setShowChoroplethPanel(false);
      handleOpenStyleTab('style-symbols', `Point symbology opened in Style Symbols for ${layerName}`, layerId);
    },
    [activeActivityId, announce, handleOpenStyleTab, overlayLayers, pointSymbologyLayerId, showLayerPanel, workbenchSidebarTab]
  );

  const handleAnalysisRecommendationAction = useCallback(
    (recommendation: MapAnalysisRecommendation) => {
      recordMapReviewEvent(buildRecommendationActionReviewEvent(recommendation, buildCurrentReviewSnapshot()));
      const { action } = recommendation;
      if (action.type === 'run-selection-statistics') {
        handleOpenAnalyzeTab('analyze-statistics', 'Selection statistics opened in Analyze Statistics');
        handleRunSelectionStatistics();
        return;
      }

      if (action.type === 'open-flow') {
        const payload = dispatchRecommendationFlow({
          recommendation,
          flowId: action.flowId,
          overlayLayers,
          mapContextSummary: contextSummary,
          urbanContext: activeUrbanContext,
        });

        recordMapReviewEvent({
          type: 'analysis-dispatch',
          status: 'previewed',
          title: `Recommendation dispatched: ${recommendation.title}`,
          summary: `Explicit recommendation dispatch queued ${action.flowId.replace(/_/g, ' ')} with ${payload.layerReferences?.length ?? 0} lightweight layer reference(s) and map context ${payload.contextSummary?.contextId ?? 'none'}.`,
          layerIds: payload.layerIds,
          recommendationIds: [recommendation.id],
          actionIds: [payload.requestId],
          details: {
            requestId: payload.requestId,
            flowId: action.flowId,
            readinessStatus: recommendation.readiness.status,
            readinessWarnings: recommendation.readiness.warnings,
            readinessBlockers: recommendation.readiness.blockers,
            reasonKinds: recommendation.reasons.map(reason => reason.kind),
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
          tone: 'success',
          title: `${recommendation.title} opened`,
          description: `Recommendation routed to the ${action.flowId.replace(/_/g, ' ')} workflow with ${payload.layerReferences?.length ?? 0} layer reference(s) attached.`,
        });
        toastInfo(`${recommendation.title} routed to workflow.`);
        announce(`${recommendation.title} routed to workflow`);
        return;
      }

      const openLayerId = action.layerId ?? recommendation.layerIds[0] ?? null;
      const layerName = openLayerId ? (overlayLayers.find(layer => layer.id === openLayerId)?.name ?? openLayerId) : 'current map';

      switch (action.panel) {
        case 'scientific-qa':
          openScientificQAPanel();
          break;
        case 'choropleth':
          setPointSymbologyLayerId(null);
          handleOpenStyleTab('style-renderer', `Renderer recommendation opened in Style for ${layerName}`, openLayerId);
          setShowChoroplethPanel(true);
          break;
        case 'cluster':
          handleOpenAnalyzeTab('analyze-statistics', `LISA recommendation opened for ${layerName}`);
          setShowClusterViz(true);
          break;
        case 'hotspot':
          handleOpenAnalyzeTab('analyze-statistics', `Hot spot recommendation opened for ${layerName}`);
          setShowHotSpotViz(true);
          break;
        case 'emerging-hotspot':
          handleOpenAnalyzeTab('analyze-statistics', `Emerging hot spot recommendation opened for ${layerName}`);
          setShowEmergingHotSpotViz(true);
          break;
        case 'point-symbology':
          if (!openLayerId) {
            toastInfo('Select or reveal a point layer before opening point symbology.');
            return;
          }
          setShowChoroplethPanel(false);
          setPointSymbologyMode(action.symbologyMode ?? 'heatmap');
          setPointSymbologyLayerId(openLayerId);
          handleOpenStyleTab('style-symbols', `Point symbology recommendation opened in Style for ${layerName}`, openLayerId);
          break;
        case 'voxcity-overlay':
          handleOpenSceneTab('scene-voxcity', 'VoxCity recommendation opened in Scene');
          break;
        case 'workflow':
          handleOpenAnalyzeTab('analyze-workflows', `Workflow recommendation opened for ${layerName}`);
          break;
        case 'nl-query':
          handleOpenAnalyzeTab('analyze-query', 'Natural-language map query recommendation opened in Analyze Query');
          break;
        case 'layer-panel':
          setWorkspaceView('explore');
          setShowLayerPanel(true);
          setDispatchFeedback({
            tone: 'info',
            title: `${recommendation.title} ready`,
            description: `Layer panel opened for ${layerName}; inspect provenance, QA, and styling before applying downstream analysis.`,
          });
          announce(`Layer panel opened for ${layerName}`);
          break;
        default:
          break;
      }
    },
    [activeUrbanContext, announce, buildCurrentReviewSnapshot, contextSummary, handleOpenAnalyzeTab, handleOpenSceneTab, handleOpenStyleTab, handleRunSelectionStatistics, openScientificQAPanel, overlayLayers, recordMapReviewEvent]
  );

  const handleApplyCartographyRecommendation = useCallback(
    (recommendationId: string) => {
      const recommendation = cartographyReviewState.recommendations.find(entry => entry.id === recommendationId);
      if (!recommendation) {
        toastWarning('This cartography recommendation is no longer available for the current map state.');
        return;
      }
      if (!recommendation.proposal) {
        toastInfo('This recommendation is informational and has no automatic style change.');
        return;
      }

      const layer = overlayLayers.find(entry => entry.id === recommendation.layerId);
      if (!layer) {
        toastWarning('The affected layer is no longer available.');
        return;
      }

      const nextLayer = applyCartographyRecommendationToLayer(layer, recommendation);
      addOverlayLayer(nextLayer);
      setCartographyUndoStack(current => [
        ...current.slice(-9),
        {
          recommendationId,
          layerId: layer.id,
          label: recommendation.proposal?.reversibleLabel ?? recommendation.title,
          beforeLayer: layer,
        },
      ]);
      setDismissedCartographyRecommendationIds(current => {
        const next = new Set(current);
        next.add(recommendationId);
        return next;
      });
      recordMapReviewEvent({
        type: 'action-status',
        status: 'applied',
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
    },
    [addOverlayLayer, announce, cartographyReviewState.recommendations, overlayLayers, recordMapReviewEvent]
  );

  const handleDismissCartographyRecommendation = useCallback(
    (recommendationId: string) => {
      setDismissedCartographyRecommendationIds(current => {
        const next = new Set(current);
        next.add(recommendationId);
        return next;
      });
      const recommendation = cartographyReviewState.recommendations.find(entry => entry.id === recommendationId);
      recordMapReviewEvent({
        type: 'action-status',
        status: 'rejected',
        title: `Cartography recommendation dismissed: ${recommendation?.title ?? recommendationId}`,
        summary: 'Analyst dismissed a cartographic recommendation without mutating layer styling.',
        layerIds: recommendation?.layerId ? [recommendation.layerId] : [],
        actionIds: [recommendationId],
        recommendationIds: [recommendationId],
        details: {
          severity: recommendation?.severity ?? 'unknown',
        },
      });
      announce('Cartography recommendation dismissed');
    },
    [announce, cartographyReviewState.recommendations, recordMapReviewEvent]
  );

  const handleUndoCartographyRecommendation = useCallback(() => {
    const lastEntry = cartographyUndoStack[cartographyUndoStack.length - 1];
    if (!lastEntry) {
      toastInfo('There is no cartography style change to undo.');
      return;
    }

    addOverlayLayer(lastEntry.beforeLayer);
    setCartographyUndoStack(current => current.slice(0, -1));
    setDismissedCartographyRecommendationIds(current => {
      const next = new Set(current);
      next.delete(lastEntry.recommendationId);
      return next;
    });
    recordMapReviewEvent({
      type: 'action-status',
      status: 'undone',
      title: `Cartography recommendation undone: ${lastEntry.label}`,
      summary: `Restored prior style for ${lastEntry.layerId}.`,
      layerIds: [lastEntry.layerId],
      actionIds: [lastEntry.recommendationId],
      recommendationIds: [lastEntry.recommendationId],
      undo: {
        available: false,
        outcome: 'Previous layer style restored.',
      },
    });
    toastInfo(`Undid ${lastEntry.label}.`);
    announce(`Undid cartography recommendation for ${lastEntry.layerId}`);
  }, [addOverlayLayer, announce, cartographyUndoStack, recordMapReviewEvent]);

  const handleShowCartographyDetails = useCallback(
    (recommendation: MapCartographyRecommendation) => {
      announce(`Cartography details opened for ${recommendation.title}`);
    },
    [announce]
  );

  const handleApplyLayerStyle = useCallback(
    (layerId: string, update: LayerStyleUpdate) => {
      const layer = overlayLayers.find(entry => entry.id === layerId);
      if (!layer) {
        toastWarning('The styled layer is no longer available.');
        return;
      }

      const outcome = applyMapCommand(
        {
          kind: 'layer.style',
          layerId,
          style: update.style,
          opacity: update.opacity,
          metadataPatch: update.metadataPatch,
          styleMode: update.legendSpec.mode,
          styleHash: update.legendSpec.styleHash,
          legendEntryCount: update.legendSpec.entries.length,
          noDataClass: update.legendSpec.noData.enabled,
          warnings: update.warnings,
        },
        buildMapActionEffects()
      );
      recordMapReviewEvent(outcome.reviewEvent);
      if (outcome.result.status !== 'applied') {
        toastWarning(`Layer style blocked: ${outcome.preflight.blockers.join(' ')}`);
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
    },
    [announce, buildMapActionEffects, overlayLayers, recordMapActionHistory, recordMapReviewEvent]
  );

  const handleReRunAnalysisLayer = useCallback(
    async (layerId: string, rerunToken?: string | null) => {
      if (!rerunToken) {
        toastInfo('No re-run handler is registered for this analysis result.');
        announce('Re-run is unavailable for this analysis result');
        return;
      }

      if (!hasAnalysisRerun(rerunToken)) {
        toastInfo('The original analysis runner is no longer available in this session.');
        announce('Re-run is unavailable for this analysis result');
        return;
      }

      setRerunningAnalysisToken(rerunToken);
      try {
        const rerunResult = await rerunAnalysisResult(rerunToken);
        if (!rerunResult) {
          toastInfo('The analysis did not return a refreshed map layer.');
          announce('Analysis re-run completed without a map layer update');
          return;
        }

        const runMetadata = rerunResult.layer.metadata?.analysisResult;
        const nextOutput = createAnalysisMapOutput(rerunResult);
        const existingRun = completedRuns.find(run => run.mapOutputs.some(output => matchesSpatialStatsOutput(output, layerId, rerunToken, runMetadata?.runId)));
        const persistedRunId = existingRun?.runId ?? runMetadata?.runId;
        const nextMapOutputs = existingRun ? replaceSpatialStatsOutput(existingRun.mapOutputs, nextOutput, layerId, rerunToken, runMetadata?.runId) : [nextOutput];

        upsertCompletedRun(
          createAnalysisCompletedRun(rerunResult, {
            flowId: existingRun?.flowId ?? 'review',
            mapOutputs: nextMapOutputs,
            ...(persistedRunId ? { runId: persistedRunId } : {}),
            ...(existingRun?.insertedAt ? { insertedAt: existingRun.insertedAt } : {}),
            ...(existingRun?.label ? { label: existingRun.label } : {}),
            ...(existingRun?.paragraph ? { paragraph: existingRun.paragraph } : {}),
            ...(existingRun?.paragraphPreview ? { paragraphPreview: existingRun.paragraphPreview } : {}),
            ...(existingRun?.paragraphFull ? { paragraphFull: existingRun.paragraphFull } : {}),
            ...(existingRun?.chartOutputs ? { chartOutputs: existingRun.chartOutputs } : {}),
            ...(existingRun?.dataOutputs ? { dataOutputs: existingRun.dataOutputs } : {}),
          })
        );

        addOverlayLayer(rerunResult.layer);
        upsertMapEvidenceArtifact(rerunResult.evidenceArtifact);
        toastSuccess(`Re-ran ${rerunResult.layer.name}.`);
        announce(`Analysis result refreshed for ${rerunResult.layer.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Analysis re-run failed.';
        toastError(message);
        announce(`Analysis re-run failed: ${message}`);
      } finally {
        setRerunningAnalysisToken(null);
      }
    },
    [addOverlayLayer, announce, completedRuns, upsertCompletedRun, upsertMapEvidenceArtifact]
  );

  /* ---- Drawing handlers ---- */
  const handleSetDrawTool = useCallback(
    (tool: DrawToolId | null) => {
      setActiveDrawTool(tool);
      setSelectionDragTool(null);
      setShowCanvasKeyboardHelp(false);
      // When activating draw, deactivate pin mode and open right dock draw panel
      if (tool) {
        setActiveTool(null);
        setActiveMeasureTool(null);
        setShowSidebar(false);
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowDrawPanel(false);
        setShowMeasurePanel(false);
        setWorkspaceView('analyze');
        openRightDockPanel('draw', `Draw workspace opened in the right dock`, 'toolbar');
        announce(`Drawing tool: ${tool}`);
      } else {
        announce('Drawing tool deactivated');
      }
    },
    [announce, closeFloatingRightPanels, openRightDockPanel, setActiveDrawTool, setActiveMeasureTool, setActiveTool]
  );

  const handleCancelDraw = useCallback(() => {
    setActiveDrawTool(null);
  }, [setActiveDrawTool]);

  const handleToggleDrawPanel = useCallback(() => {
    toggleRightDockPanel('draw', 'Drawings panel opened in the right dock', 'toolbar');
  }, [toggleRightDockPanel]);

  /* ---- Measurement handlers ---- */
  const handleSetMeasureTool = useCallback(
    (tool: MeasureToolId | null) => {
      setActiveMeasureTool(tool);
      setSelectionDragTool(null);
      setShowCanvasKeyboardHelp(false);
      // Deactivate pin mode and draw tool when measuring
      if (tool) {
        setActiveTool(null);
        setActiveDrawTool(null);
        setShowSidebar(false);
        setShowScientificQAPanel(false);
        closeFloatingRightPanels();
        setShowMeasurePanel(false);
        setShowDrawPanel(false);
        setWorkspaceView('analyze');
        openRightDockPanel('measure', `Measure ${tool === 'measure-distance' ? 'distance' : 'area'} opened in the right dock`, 'toolbar');
      } else {
        announce('Measure tool deactivated');
      }
    },
    [announce, closeFloatingRightPanels, openRightDockPanel, setActiveDrawTool, setActiveMeasureTool, setActiveTool]
  );

  const handleCancelMeasure = useCallback(() => {
    setActiveMeasureTool(null);
  }, [setActiveMeasureTool]);

  const handleToggleMeasurePanel = useCallback(() => {
    toggleRightDockPanel('measure', 'Measurements opened in the right dock', 'toolbar');
  }, [toggleRightDockPanel]);

  const handleSetSelectionDragTool = useCallback(
    (tool: SelectionDragTool | null) => {
      setSelectionDragTool(tool);
      setShowCanvasKeyboardHelp(false);
      if (!tool) {
        return;
      }
      setWorkspaceView('analyze');
      setShowScientificQAPanel(false);
      closeFloatingRightPanels();
      setShowSidebar(false);
      setShowDrawPanel(false);
      setShowMeasurePanel(false);
      setActiveTool(null);
      setActiveDrawTool(null);
      setActiveMeasureTool(null);
      openRightDockPanel('selection', tool === 'rectangle' ? 'Rectangle selection opened in the right dock' : 'Lasso selection opened in the right dock', 'toolbar');
    },
    [closeFloatingRightPanels, openRightDockPanel, setActiveDrawTool, setActiveMeasureTool, setActiveTool]
  );

  const handleToggleCanvasKeyboardHelp = useCallback(() => {
    setShowCanvasKeyboardHelp(current => {
      const next = !current;
      announce(next ? 'Map keyboard help opened' : 'Map keyboard help closed');
      return next;
    });
  }, [announce]);

  /* ---- Navigation ---- */
  const flyTo = useCallback(
    (lng: number, lat: number, z = 14) => {
      if (reducedMotion) {
        mapInstanceRef.current?.jumpTo({ center: [lng, lat], zoom: z });
      } else {
        mapInstanceRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 1500 });
      }
    },
    [reducedMotion]
  );

  const handleToggleMinimap = useCallback(() => {
    setShowMinimap(previous => {
      const next = !previous;
      announce(next ? 'Minimap shown' : 'Minimap hidden');
      return next;
    });
  }, [announce]);

  const handleCopyViewState = useCallback(() => {
    const snapshot = {
      center: [center[0], center[1]] as [number, number],
      zoom,
      bearing,
      pitch,
    };
    setCopiedViewState(snapshot);
    void navigator.clipboard?.writeText?.(JSON.stringify(snapshot)).catch(() => undefined);
    announce(`View state copied at zoom ${zoom.toFixed(1)}`);
  }, [announce, bearing, center, pitch, zoom]);

  const handleRestoreViewState = useCallback(() => {
    if (!copiedViewState) return;
    const map = mapInstanceRef.current;
    const target = {
      center: copiedViewState.center,
      zoom: copiedViewState.zoom,
      bearing: copiedViewState.bearing,
      pitch: copiedViewState.pitch,
    };
    if (map) {
      if (reducedMotion) {
        map.jumpTo(target);
      } else {
        map.flyTo({ ...target, duration: 1200 });
      }
    } else {
      setViewport(target);
    }
    announce('View state restored');
  }, [announce, copiedViewState, reducedMotion, setViewport]);

  const fitToBounds = useCallback(
    (bounds: [number, number, number, number]) => {
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
        }
      );
    },
    [flyTo, reducedMotion]
  );

  const handleFocusLayer = useCallback(
    (layerId: string) => {
      const layer = overlayLayers.find(entry => entry.id === layerId);
      const bounds = layer?.metadata?.bounds ?? layer?.metadata?.geometrySummary?.bounds ?? null;
      if (!layer || !bounds) {
        announce('Layer extent metadata is unavailable; cannot focus the map on this layer.');
        return;
      }

      fitToBounds(bounds);
      announce(`Map focused on ${layer.name}`);
    },
    [announce, fitToBounds, overlayLayers]
  );

  const handleFocusAttributeFeature = useCallback(
    (feature: AttrFeature) => {
      const bounds = getFeatureBounds(feature);
      if (!bounds) {
        announce('Feature extent is unavailable; cannot focus the map on this table row.');
        return;
      }
      fitToBounds(bounds);
    },
    [announce, fitToBounds]
  );

  const visibleLayerFitBounds = useMemo(() => mergeBounds(overlayLayers.filter(layer => layer.visible).map(getLayerFitBounds)), [overlayLayers]);
  const selectedCanvasFitContext = useMemo(() => {
    const activeAoiBounds = contextSummary.activeAoi?.bbox ?? null;
    if (activeAoiBounds) {
      return { bounds: activeAoiBounds, label: activeAoiLabel ?? 'active AOI' };
    }

    const selectedBounds = getSelectedFeatureFitBounds(overlayLayers, selectedFeatureIds);
    if (selectedBounds) {
      return { bounds: selectedBounds, label: 'selected features' };
    }

    const selectedDrawing = selectedFeatureId ? (drawnFeatures.find(feature => feature.id === selectedFeatureId) ?? null) : null;
    const selectedDrawingBounds = selectedDrawing ? getFeatureBounds(selectedDrawing) : null;
    if (selectedDrawingBounds) {
      const label = selectedDrawing.properties?.label;
      return { bounds: selectedDrawingBounds, label: typeof label === 'string' && label.trim() ? label.trim() : 'selected drawing' };
    }

    const activeLayer = attributeTableLayer ?? inspectorLayer ?? activeStyleLayer;
    const activeLayerBounds = activeLayer ? getLayerFitBounds(activeLayer) : null;
    if (activeLayerBounds) {
      return { bounds: activeLayerBounds, label: activeLayer.name };
    }

    return null;
  }, [activeAoiLabel, activeStyleLayer, attributeTableLayer, contextSummary.activeAoi?.bbox, drawnFeatures, inspectorLayer, overlayLayers, selectedFeatureId, selectedFeatureIds]);
  const topSurfaceScopeLabel = selectedCanvasFitContext?.label ?? (visibleLayerFitBounds ? 'visible extent' : 'no extent');
  const topSurfaceCrsSummary = useMemo(() => (topSurfaceActiveLayer ? resolveOverlayLayerCrsSummary(topSurfaceActiveLayer) : null), [topSurfaceActiveLayer]);
  const topSurfaceCrsLabel = useMemo(() => {
    if (!topSurfaceCrsSummary) {
      return visiblePublicationLayers.length > 0 ? 'EPSG:4326 display' : 'CRS unknown';
    }
    if (topSurfaceCrsSummary.crs) {
      return topSurfaceCrsSummary.crs;
    }
    if (topSurfaceCrsSummary.status === 'missing') {
      return 'CRS missing';
    }
    return 'CRS unknown';
  }, [topSurfaceCrsSummary, visiblePublicationLayers.length]);
  const topSurfaceCrsTone = useMemo<'accent' | 'warning' | 'danger' | 'success'>(() => {
    if (!topSurfaceCrsSummary) {
      return visiblePublicationLayers.length > 0 ? 'accent' : 'warning';
    }
    if (topSurfaceCrsSummary.status === 'known') {
      return 'success';
    }
    if (topSurfaceCrsSummary.status === 'missing') {
      return 'danger';
    }
    return 'warning';
  }, [topSurfaceCrsSummary, visiblePublicationLayers.length]);
  const topSurfaceCrsTitle = topSurfaceActiveLayer ? `${topSurfaceActiveLayer.name}: ${topSurfaceCrsSummary?.notes.join(' ') || 'CRS summary available in QA.'}` : 'Display CRS uses EPSG:4326. Open QA for coordinate reference details.';

  const handleCanvasZoom = useCallback(
    (delta: number) => {
      const map = mapInstanceRef.current;
      if (!map) {
        announce('Map controls are not ready yet');
        return;
      }
      const nextZoom = +(map.getZoom() + delta).toFixed(1);
      map.zoomTo(nextZoom, { animate: !reducedMotion });
      announce(`Zoom level ${nextZoom}`);
    },
    [announce, reducedMotion]
  );

  const handleCanvasResetView = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      announce('Map controls are not ready yet');
      return;
    }
    const nextView = {
      center: [29.0, 41.0] as [number, number],
      zoom: 10,
      bearing: 0,
      pitch: 0,
    };
    if (reducedMotion) {
      map.jumpTo(nextView);
    } else {
      map.flyTo({ ...nextView, duration: 900, essential: true });
    }
    setViewport(nextView);
    announce('Map view reset to default');
  }, [announce, reducedMotion, setViewport]);

  const handleCanvasFitVisibleLayers = useCallback(() => {
    if (!visibleLayerFitBounds) {
      handleCanvasResetView();
      return;
    }
    fitToBounds(visibleLayerFitBounds);
    announce('Map fitted to visible layers');
  }, [announce, fitToBounds, handleCanvasResetView, visibleLayerFitBounds]);

  const handleCanvasFitSelectedContext = useCallback(() => {
    if (!selectedCanvasFitContext) {
      announce('Select a layer, feature, or AOI before fitting the map.');
      return;
    }
    fitToBounds(selectedCanvasFitContext.bounds);
    announce(`Map fitted to ${selectedCanvasFitContext.label}`);
  }, [announce, fitToBounds, selectedCanvasFitContext]);

  const handleClearActiveCanvasTool = useCallback(() => {
    const hasActiveCanvasTool = Boolean(activeTool || activeDrawTool || activeMeasureTool || selectionDragTool);
    setActiveTool(null);
    setActiveDrawTool(null);
    setActiveMeasureTool(null);
    setSelectionDragTool(null);
    if (hasActiveCanvasTool) {
      announce('Active map tool cleared');
    }
  }, [activeDrawTool, activeMeasureTool, activeTool, announce, selectionDragTool, setActiveDrawTool, setActiveMeasureTool, setActiveTool]);

  const activeCanvasToolLabel = useMemo(() => {
    if (selectionDragTool === 'rectangle') return 'Rect select';
    if (selectionDragTool === 'lasso') return 'Lasso select';
    if (activeDrawTool === 'polygon') return 'Draw polygon';
    if (activeDrawTool === 'linestring') return 'Draw line';
    if (activeDrawTool) return `Draw ${activeDrawTool}`;
    if (activeMeasureTool === 'measure-distance') return 'Measure distance';
    if (activeMeasureTool === 'measure-area') return 'Measure area';
    if (activeTool === 'pin') return 'Pin placement';
    if (activeTool === 'annotate') return 'Annotation';
    return null;
  }, [activeDrawTool, activeMeasureTool, activeTool, selectionDragTool]);

  const handleHotSpotDispatch = useCallback(
    async (coordinate: [number, number]) => {
      if (isRunningQuickHotSpot) {
        return;
      }

      const origin = { lng: coordinate[0], lat: coordinate[1] };
      const analysisBounds = restrictToMapView && currentMapBounds ? currentMapBounds : buildBufferedPointBounds(origin, 1600);
      const prioritizedLayerIds = new Set(activeAnalysisResultLayerIds);
      const candidateLayers = [...overlayLayers].filter(isPolygonLayerCandidate).sort((left, right) => {
        const leftPriority = prioritizedLayerIds.has(left.id) ? 0 : 1;
        const rightPriority = prioritizedLayerIds.has(right.id) ? 0 : 1;
        return leftPriority - rightPriority;
      });

      setIsRunningQuickHotSpot(true);
      setDispatchFeedback({
        tone: 'busy',
        title: 'Running hot spot analysis',
        description: 'Resolving the nearest polygon layer and numeric field for a quick Getis-Ord Gi* run.',
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
          throw new Error('No visible polygon layer with numeric attributes intersects the selected analysis window.');
        }

        const qaGate = evaluateAnalysisQAGate(scientificQA, {
          layerIds: [resolvedLayer.layer.id],
          requiredGeometryTypes: ['polygon'],
          workflowLabel: 'Quick hot spot analysis',
        });
        if (qaGate.blocked) {
          openScientificQAPanel();
          throw new Error(qaGate.message);
        }
        if (qaGate.warnings.length > 0) {
          const warning = qaGate.warnings[0] ?? 'Scientific QA warnings are present on the selected analysis input.';
          setDispatchFeedback({
            tone: 'info',
            title: 'QA warning on analysis input',
            description: warning,
          });
          toastWarning(warning);
        }

        const executionIdentity = createSpatialStatsExecutionIdentity('hotspot', resolvedLayer.layer.id, resolvedLayer.numericField.name);

        const buildLatestResult = async () => {
          const latestLayer = useMapExplorerStore.getState().overlayLayers.find(layer => layer.id === resolvedLayer?.layer.id);
          if (!latestLayer) {
            throw new Error('The selected source layer is no longer available.');
          }

          const latestCollection = filterFeatureCollectionToBounds(await resolveFeatureCollection(latestLayer), analysisBounds);
          return (
            await executeHotSpotSpatialStatsAsync({
              sourceLayer: latestLayer,
              featureCollection: latestCollection,
              valueField: resolvedLayer.numericField.name,
              weightsMethod: 'queen',
              significanceThreshold: 0.05,
              selfWeight: true,
              runId: executionIdentity.runId,
              layerId: executionIdentity.layerId,
            }).promise
          ).adaptedResult;
        };

        const execution = await executeHotSpotSpatialStatsAsync({
          sourceLayer: resolvedLayer.layer,
          featureCollection: resolvedLayer.featureCollection,
          valueField: resolvedLayer.numericField.name,
          weightsMethod: 'queen',
          significanceThreshold: 0.05,
          selfWeight: true,
          runId: executionIdentity.runId,
          layerId: executionIdentity.layerId,
        }).promise;

        const rerunnableResult = attachSpatialStatsRerun(execution.adaptedResult, buildLatestResult, `${executionIdentity.layerId}::rerun`);

        addOverlayLayer(rerunnableResult.layer);
        upsertMapEvidenceArtifact(rerunnableResult.evidenceArtifact);
        upsertCompletedRun(createSpatialStatsCompletedRun(rerunnableResult, { flowId: 'review' }));
        setActiveAnalysisResultLayers([rerunnableResult.layer.id]);
        const resultBounds = rerunnableResult.layer.metadata?.bounds ?? getFeatureCollectionBounds(resolvedLayer.featureCollection);
        if (resultBounds) {
          fitToBounds(resultBounds);
        }
        const message = `Published ${rerunnableResult.layer.name} using ${resolvedLayer.layer.name} · ${resolvedLayer.numericField.name}.`;
        setDispatchFeedback({ tone: 'success', title: 'Hot spot result published', description: message });
        recordMapReviewEvent({
          type: 'analysis-dispatch',
          status: 'applied',
          title: `Hot spot analysis published: ${rerunnableResult.layer.name}`,
          summary: message,
          layerIds: [resolvedLayer.layer.id, rerunnableResult.layer.id],
          details: {
            engine: 'Getis-Ord Gi*',
            valueField: resolvedLayer.numericField.name,
            sourceLayerId: resolvedLayer.layer.id,
            resultLayerId: rerunnableResult.layer.id,
            runId: rerunnableResult.layer.metadata?.analysisResult?.runId ?? null,
            analysisBounds,
          },
        });
        toastSuccess(message);
        announce('Hot spot dispatch completed');
      } catch (error) {
        const message = isBackgroundTaskCancelledError(error) ? 'Hot spot analysis was cancelled before completion.' : error instanceof Error ? error.message : 'Hot spot analysis failed.';
        setDispatchFeedback({ tone: 'error', title: 'Hot spot analysis failed', description: message });
        recordMapReviewEvent({
          type: 'analysis-dispatch',
          status: 'failed',
          title: 'Hot spot analysis failed',
          summary: message,
          layerIds: candidateLayers.map(layer => layer.id),
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
    },
    [activeAnalysisResultLayerIds, addOverlayLayer, announce, currentMapBounds, fitToBounds, isRunningQuickHotSpot, openScientificQAPanel, overlayLayers, recordMapReviewEvent, restrictToMapView, scientificQA, setActiveAnalysisResultLayers, upsertCompletedRun, upsertMapEvidenceArtifact]
  );

  const handleMapNLQueryProposalGenerated = useCallback(
    (preview: MapNLQueryPreview) => {
      if (recordedNLQueryProposalIdsRef.current.has(preview.id)) {
        return;
      }
      recordedNLQueryProposalIdsRef.current.add(preview.id);
      recordMapReviewEvent(
        buildMapAIProposalReviewEvent(preview.aiGuardrail, {
          proposalId: preview.id,
          title: `Map query preview: ${preview.intentPreview.intentLabel}`,
          layerIds: preview.sourceLayers.map(layer => layer.id),
          actionIds: [preview.id],
          details: buildMapNLQueryAuditDetails(preview, {
            decision: 'proposed',
            mapMutationApplied: false,
          }),
        })
      );
    },
    [recordMapReviewEvent]
  );

  const handleMapNLQueryPreviewDecision = useCallback(
    (preview: MapNLQueryPreview, decision: 'accepted' | 'rejected') => {
      recordMapReviewEvent({
        type: 'query-run',
        status: decision === 'accepted' ? 'previewed' : 'rejected',
        title: decision === 'accepted' ? `AI-proposed map query confirmed: ${preview.intentPreview.intentLabel}` : `AI-proposed map query rejected: ${preview.intentPreview.intentLabel}`,
        summary: decision === 'accepted' ? `Analyst confirmed an AI-proposed NL query preview for ${preview.sourceLayers.length} affected layer(s); no map layer has been created yet.` : 'Analyst rejected an AI-proposed NL query preview without mutating map state.',
        layerIds: preview.sourceLayers.map(layer => layer.id),
        actionIds: [preview.id],
        details: buildMapNLQueryAuditDetails(preview, {
          decision,
          mapMutationApplied: false,
        }),
      });
    },
    [recordMapReviewEvent]
  );

  const handleRunMapNLQuery = useCallback(
    async (preview: MapNLQueryPreview, options: { confirmed: boolean }) => {
      if (isRunningMapNLQuery) {
        return;
      }

      if (!options.confirmed) {
        const reason = 'AI-proposed map query apply requires human confirmation.';
        recordMapReviewEvent({
          type: 'query-run',
          status: 'rejected',
          title: 'Map query execution blocked: confirmation required',
          summary: reason,
          layerIds: preview.sourceLayers.map(layer => layer.id),
          actionIds: [preview.id],
          details: buildMapNLQueryAuditDetails(preview, {
            decision: 'confirmation-required',
            mapMutationApplied: false,
          }),
        });
        toastWarning(reason);
        announce(reason);
        return;
      }

      if (!preview.canRun) {
        const reason = preview.blockers[0] ?? 'Map query preview is not executable.';
        recordMapReviewEvent({
          type: 'query-run',
          status: 'rejected',
          title: 'Map query execution blocked',
          summary: reason,
          layerIds: preview.sourceLayers.map(layer => layer.id),
          actionIds: [preview.id],
          details: buildMapNLQueryAuditDetails(preview, {
            decision: 'execution-blocked',
            mapMutationApplied: false,
          }),
        });
        toastWarning(reason);
        announce(reason);
        return;
      }

      setIsRunningMapNLQuery(true);
      setDispatchFeedback({
        tone: 'busy',
        title: 'Running map query',
        description: `Executing reviewed SQL against ${preview.sourceLayers.length} source layer${preview.sourceLayers.length === 1 ? '' : 's'}.`,
      });

      try {
        const result = await executeMapNLQueryPreview(
          preview,
          {
            loadGeoJSON,
            bindTableAlias,
            toGeoJSON,
          },
          { confirmed: options.confirmed }
        );
        addOverlayLayer(result.layer);
        upsertMapEvidenceArtifact(result.adapterResult.evidenceArtifact);
        upsertCompletedRun(createAnalysisCompletedRun(result.adapterResult, { flowId: 'review' }));
        setActiveAnalysisResultLayers([result.layer.id]);
        setInspectorLayerId(result.layer.id);
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
        const message = `Published ${result.layer.name} with ${result.featureCount.toLocaleString()} feature${result.featureCount === 1 ? '' : 's'}.`;
        setDispatchFeedback({ tone: 'success', title: 'Map query result published', description: message });
        recordMapReviewEvent({
          type: 'query-run',
          status: 'applied',
          title: `Map query published: ${result.layer.name}`,
          summary: `${message} Scope: ${preview.scopeLabel}; execution mode: ${preview.modeLabel}.`,
          layerIds: [result.layer.id, ...preview.sourceLayers.map(layer => layer.id)],
          actionIds: [preview.id],
          details: buildMapNLQueryAuditDetails(preview, {
            decision: 'accepted-and-applied',
            mapMutationApplied: true,
            resultLayerId: result.layer.id,
            featureCount: result.featureCount,
            geometryType: result.geometryType,
            elapsedMs: result.elapsedMs,
          }),
        });
        toastSuccess(message);
        announce('Map query completed');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Map query failed.';
        setDispatchFeedback({ tone: 'error', title: 'Map query failed', description: message });
        recordMapReviewEvent({
          type: 'query-run',
          status: 'failed',
          title: 'Map query failed',
          summary: message,
          layerIds: preview.sourceLayers.map(layer => layer.id),
          actionIds: [preview.id],
          details: buildMapNLQueryAuditDetails(preview, {
            decision: 'accepted-but-failed',
            mapMutationApplied: false,
            failureReason: message,
          }),
        });
        toastError(message);
        announce(message);
      } finally {
        setIsRunningMapNLQuery(false);
      }
    },
    [addOverlayLayer, announce, fitToBounds, isRunningMapNLQuery, recordMapReviewEvent, setActiveAnalysisResultLayers, upsertCompletedRun, upsertMapEvidenceArtifact]
  );

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

  const handleSaveBookmark = useCallback(
    (name: string) => {
      const viewport = getCurrentViewportState();
      const bookmark = addMapBookmark({
        name,
        ...viewport,
        layers: overlayLayers.filter(layer => layer.visible).map(layer => layer.id),
        activeVisualization: activeAnalysisResultLayerIds[0] ?? null,
      });

      if (!bookmark) {
        const message = `Maximum ${MAP_BOOKMARK_LIMIT} saved views reached.`;
        toastWarning(message);
        announce(message);
        return;
      }

      recordMapReviewEvent({
        type: 'bookmark',
        status: 'recorded',
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
    },
    [activeAnalysisResultLayerIds, addMapBookmark, announce, getCurrentViewportState, overlayLayers, recordMapReviewEvent]
  );

  const handleRestoreBookmark = useCallback(
    (bookmark: MapBookmark) => {
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
        type: 'bookmark',
        status: 'applied',
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
    },
    [announce, recordMapReviewEvent, reducedMotion, restoreMapBookmark, setActiveAnalysisResultLayers]
  );

  const handleRenameBookmark = useCallback(
    (id: string, name: string) => {
      renameMapBookmark(id, name);
      recordMapReviewEvent({
        type: 'bookmark',
        status: 'recorded',
        title: 'Viewport bookmark renamed',
        summary: `Bookmark ${id} renamed to ${name.trim() || 'Untitled view'}.`,
        bookmarkIds: [id],
      });
      announce('Saved view renamed');
    },
    [announce, recordMapReviewEvent, renameMapBookmark]
  );

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      removeMapBookmark(id);
      recordMapReviewEvent({
        type: 'bookmark',
        status: 'undone',
        title: 'Viewport bookmark deleted',
        summary: `Bookmark ${id} was removed from the saved view list.`,
        bookmarkIds: [id],
        undo: {
          available: false,
          outcome: 'Bookmark removed from current map session.',
        },
      });
      announce('Saved view deleted');
    },
    [announce, recordMapReviewEvent, removeMapBookmark]
  );

  const handleShareBookmark = useCallback(
    (bookmark: MapBookmark, encodedParam: string) => {
      const baseUrl = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
      const link = `${baseUrl}?mapBookmark=${encodedParam}`;
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (clipboard?.writeText) {
        void clipboard
          .writeText(link)
          .then(() => {
            toastSuccess(`Copied link for "${bookmark.name}".`);
            announce('Saved view link copied');
          })
          .catch(() => {
            if (typeof window.prompt === 'function') {
              window.prompt('Copy saved view link', link);
            }
            announce('Saved view link prepared');
          });
        return;
      }

      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('Copy saved view link', link);
      }
      announce('Saved view link prepared');
    },
    [announce]
  );

  const handleAddMapAnnotation = useCallback(
    (annotation: Parameters<typeof addMapAnnotation>[0]) => {
      const created = addMapAnnotation(annotation);
      if (created) {
        recordMapReviewEvent({
          type: 'annotation',
          status: 'recorded',
          timestamp: created.properties.createdAt,
          title: 'Map annotation added',
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
    },
    [addMapAnnotation, recordMapReviewEvent]
  );

  const handleUpdateMapAnnotation = useCallback(
    (id: string, patch: Parameters<typeof updateMapAnnotation>[1]) => {
      updateMapAnnotation(id, patch);
      recordMapReviewEvent({
        type: 'annotation',
        status: 'recorded',
        title: 'Map annotation edited',
        summary: `Annotation ${id} style, text, or geometry metadata was updated.`,
        annotationIds: [id],
        details: {
          hasGeometryPatch: Boolean(patch.geometry),
          propertyKeys: Object.keys(patch.properties ?? {}),
        },
      });
    },
    [recordMapReviewEvent, updateMapAnnotation]
  );

  const handleMoveMapAnnotation = useCallback(
    (id: string, coordinate: [number, number]) => {
      moveMapAnnotation(id, coordinate);
      recordMapReviewEvent({
        type: 'annotation',
        status: 'applied',
        title: 'Map annotation moved',
        summary: `Annotation ${id} moved to ${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}.`,
        annotationIds: [id],
        details: { coordinate },
      });
    },
    [moveMapAnnotation, recordMapReviewEvent]
  );

  const handleRemoveMapAnnotation = useCallback(
    (id: string) => {
      removeMapAnnotation(id);
      recordMapReviewEvent({
        type: 'annotation',
        status: 'undone',
        title: 'Map annotation removed',
        summary: `Annotation ${id} was removed from the map session.`,
        annotationIds: [id],
        undo: {
          available: false,
          outcome: 'Annotation removed from current map session.',
        },
      });
    },
    [recordMapReviewEvent, removeMapAnnotation]
  );

  const resetLayerRuntimeState = useCallback(() => {
    setActiveAnalysisResultLayers([]);
    setScientificQA(null);
    setPointSymbologyLayerId(null);
    setSelectionStatsSummary(null);
    setWorkflowPreview(null);
    setUrbanWorkflowDraftRequest(null);
    setCartographyUndoStack([]);
    setDismissedCartographyRecommendationIds(new Set());
  }, [setActiveAnalysisResultLayers, setCartographyUndoStack, setDismissedCartographyRecommendationIds, setPointSymbologyLayerId, setScientificQA, setSelectionStatsSummary, setUrbanWorkflowDraftRequest, setWorkflowPreview]);

  const { handleClearLayerCache, handleProjectLoad, handleProjectSave } = useMapProjectPersistenceController({
    activeBaseLayer,
    annotations,
    announce,
    autoSaveEnabled,
    bookmarks,
    clearProjectContent,
    clearSelectedFeatures,
    clearSourceHandles,
    closeMapStartDialog,
    currentProjectSaveTrigger,
    drawnFeatures,
    fitToBounds,
    getCurrentViewportState,
    isLoadingProject,
    isSavingProject,
    lastAutoSaveTriggerRef,
    lastSavedAt,
    lastSavedProjectTriggerRef,
    mapInstanceRef,
    mapStartDialogOpen: mapStartDialogState.open,
    open,
    overlayLayers,
    pins,
    recordMapReviewEvent,
    reducedMotion,
    replaceOverlayLayers,
    resetLayerRuntimeState,
    restoreProjectState,
    selectedProject,
    selectedProjectId,
    setIsLoadingProject,
    setIsSavingProject,
    setLastSavedAt,
    sourceHandles,
  });
  useEffect(() => {
    if (visiblePublicationLayers.length === 0 && mapCompositionOptions.includeLegend) {
      setMapCompositionOptions(current => ({ ...current, includeLegend: false }));
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
      .then(featureCollection => {
        if (cancelled) return;
        if (!hasPointGeometry(featureCollection)) {
          throw new Error('Selected layer does not contain point geometries.');
        }

        setPointSymbologyCollection(featureCollection);
        setPointSymbologyFields(collectNumericFields(featureCollection));
      })
      .catch(error => {
        if (cancelled) return;
        setPointSymbologyCollection(null);
        setPointSymbologyFields([]);
        setPointSymbologyError(error instanceof Error ? error.message : 'Failed to load point layer.');
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

  const { clearPendingColumnarImport, clearPendingCsvImport, clearPendingImportPreview, handleBindLayerToDashboard, handleBrowseLocalFiles, handleCatalogAddConnection, handleCatalogAddDemoPack, handleCatalogBrowseSources, handleCatalogReconnectSource, handleCatalogRepairSource, handleCloseReportHandoff, handleCloseUrbanMethodRail, handleColumnarImportConfirm, handleCsvImportConfirm, handleDeclareLayerCrs, handleDownloadReportHandoffPdf, handleDuplicateContentsLayer, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleExportConfirm, handleExportRequest, handleExternalServiceLayerReady, handleFeatureReportRequest, handleFocusUrbanMethodLayer, handleImportFiles, handleImportPreviewConfirm, handleImportRequest, handleInsertReportHandoff, handleLayerReportRequest, handleMapCompositionChange, handleMapExportConfirm, handleMapExportRequest, handleMapQuickAction, handleOfflinePackageExport, handleOpenCurrentMapReportHandoff, handleOpenLayerEducationReference, handlePreviewUrbanMethodWorkflow, handleRefreshReportHandoffSnapshot, handleRegisterReportEvidenceBlock, handleRepairContentsSource, handleReportHandoffOptionsChange, handleSendLayerToUrban, handleStartDialogOpenSources, handleStartMeasureFromContext, handleStartPolygonFromContext, handleTeachingDatasetImport } = useMapDataOutputController({
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
    clearSelectedFeatures,
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
    reportHandoffSnapshot,
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
  });
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

  const openMapProblems = useCallback(
    (routeSource: MapRightDockRouteSource = 'programmatic') => {
      openRightDockPanel('problems', 'QA Problems opened in the right dock', routeSource);
    },
    [openRightDockPanel]
  );

  const handleToggleMapProblems = useCallback(() => {
    toggleRightDockPanel('problems', 'QA Problems opened in the right dock', 'toolbar');
  }, [toggleRightDockPanel]);

  const handleOpenCanvasCrsReadiness = useCallback(() => {
    openMapProblems();
    announce('CRS readiness opened in QA Problems');
  }, [announce, openMapProblems]);

  const handleToggleCanvasScaleBar = useCallback(() => {
    const includeScaleBar = !mapCompositionOptions.includeScaleBar;
    setMapCompositionOptions(current => ({ ...current, includeScaleBar }));
    announce(includeScaleBar ? 'Scale bar shown for publish preview' : 'Scale bar hidden for publish preview');
  }, [announce, mapCompositionOptions.includeScaleBar]);

  const handleToggleCanvasNorthArrow = useCallback(() => {
    const includeNorthArrow = !mapCompositionOptions.includeNorthArrow;
    setMapCompositionOptions(current => ({ ...current, includeNorthArrow }));
    announce(includeNorthArrow ? 'North arrow shown for publish preview' : 'North arrow hidden for publish preview');
  }, [announce, mapCompositionOptions.includeNorthArrow]);

  const handleToggleCanvasLegend = useCallback(() => {
    if (mapPublicationLegendItems.length === 0) {
      announce('No visible layer legend is available');
      return;
    }
    const includeLegend = !mapCompositionOptions.includeLegend;
    setMapCompositionOptions(current => ({ ...current, includeLegend }));
    announce(includeLegend ? 'Legend shown for publish preview' : 'Legend hidden for publish preview');
  }, [announce, mapCompositionOptions.includeLegend, mapPublicationLegendItems.length]);

  const handleToggleReviewTimelineRightDock = useCallback(() => {
    toggleRightDockPanel('timeline', 'Review timeline opened in the right dock', 'toolbar');
  }, [toggleRightDockPanel]);

  const handleSelectMapActivity = useMapActivityRailSelection({
    announce,
    dismissMapStartDialogForWorkspaceInteraction,
    openAnalyzeActivityTab,
    openDiagnosticsRightDock,
    openMapProblems,
    openPublishActivityTab,
    openRightDockPanel,
    openSceneActivityTab,
    openStyleActivityTab,
    setActiveActivityId,
    setShowLayerPanel,
    setShowModelBuilder,
    setShowPluginPanel,
    setShowProcessingToolbox,
    setWorkbenchSidebarTab,
    setWorkspaceView,
  });

  const bottomProblemsModel = useMemo(() => buildMapProblemsModel({ qaState: scientificQA, overlayLayers }), [overlayLayers, scientificQA]);

  const handleBottomProblemAction = useCallback(
    (problem: MapProblemRow) => {
      const targetLayerId = problem.actionTarget.targetId ?? problem.affectedLayerId ?? null;
      if (targetLayerId) {
        handleInspectLayer(targetLayerId);
        announce(`${problem.actionTarget.label} opened for ${problem.affectedLabel}`);
        return;
      }

      openScientificQAPanel();
      announce('Scientific QA details opened');
    },
    [announce, handleInspectLayer, openScientificQAPanel]
  );

  const bottomPanelTasks = useMemo<MapBottomPanelTask[]>(() => {
    const tasks: MapBottomPanelTask[] = [];

    if (isImporting || importProgress) {
      tasks.push({
        id: 'import',
        label: 'Data import',
        status: isImporting ? 'running' : 'complete',
        detail: importProgress?.stage ?? 'Import worker is preparing spatial metadata.',
        meta: `${Math.round(importProgress?.percent ?? 0)}%`,
      });
    }

    if (isRunningQuickHotSpot) {
      tasks.push({
        id: 'quick-hotspot',
        label: 'Quick hot spot',
        status: 'running',
        detail: 'Executing bounded hot spot analysis for the active map extent.',
        meta: 'worker',
      });
    }

    if (isRunningMapNLQuery) {
      tasks.push({
        id: 'map-nl-query',
        label: 'Map query',
        status: 'running',
        detail: 'Running the current natural-language map query against queryable layers.',
        meta: 'query',
      });
    }

    if (effectiveShowWorkflowDrawer && workflowPreview) {
      tasks.push({
        id: 'workflow-preview',
        label: 'Workflow preview',
        status: workflowPreview.canApply ? 'ready' : 'warning',
        detail: workflowPreview.canApply ? 'Preview is ready to apply with declared provenance and QA metadata.' : 'Preview is waiting for required inputs before it can be applied.',
        meta: workflowPreview.workflow,
      });
    }

    tasks.push({
      id: 'render-budget',
      label: 'Render budget',
      status: performanceIssueCount > 0 ? 'warning' : 'complete',
      detail: performanceDiagnostics.warnings[0] ?? 'Visible layers are within the declared render and telemetry budgets.',
      meta: performanceDiagnostics.renderMode,
    });

    return tasks;
  }, [effectiveShowWorkflowDrawer, importProgress, isImporting, isRunningMapNLQuery, isRunningQuickHotSpot, performanceDiagnostics.renderMode, performanceDiagnostics.warnings, performanceIssueCount, workflowPreview]);

  const activeBackgroundTaskCount = useMemo(() => bottomPanelTasks.filter(task => task.status === 'running').length, [bottomPanelTasks]);

  const handleOpenTasksFromStatus = useCallback(() => {
    openBottomOutputDrawer('logs', activeBackgroundTaskCount > 0 ? 'Background task log opened in the output drawer' : 'Runtime log opened in the output drawer');
  }, [activeBackgroundTaskCount, openBottomOutputDrawer]);

  const rightAttributesDockActive = activeRightDockRoute?.panel === 'attributes';
  const rightSelectionDockActive = activeRightDockRoute?.panel === 'selection';
  const rightTimelineDockActive = activeRightDockRoute?.panel === 'timeline';
  const rightTasksDockActive = activeRightDockRoute?.panel === 'tasks';
  const rightMeasureDockActive = activeRightDockRoute?.panel === 'measure';
  const rightCollaborationDockActive = activeRightDockRoute?.panel === 'collaboration';
  const rightProblemsDockActive = activeRightDockRoute?.panel === 'problems';
  const rightScientificQADockActive = activeRightDockRoute?.panel === 'scientificQA' || activeRightDockRoute?.panel === 'qa';
  const rightDiagnosticsDockActive = activeRightDockRoute?.panel === 'diagnostics';
  const rightPerformanceDockActive = activeRightDockRoute?.panel === 'performance';
  const rightDrawDockActive = activeRightDockRoute?.panel === 'draw';

  const buildReviewTimeline = (visible: boolean, onClose: () => void, initialTab: 'timeline' | 'collaboration' = 'timeline'): React.ReactNode => (
    <MapReviewTimelinePanel
      visible={visible}
      presentation="embedded"
      initialTab={initialTab}
      session={reviewSession}
      collaborationSnapshot={reviewCollaborationSnapshot}
      overlayLayers={overlayLayers}
      qaState={scientificQA}
      onClose={onClose}
      onRecordEvent={recordMapReviewEvent}
      onRevertCommand={handleRevertMapCommand}
      onUpdateEventStatus={(eventId, status, outcome) => {
        updateMapReviewEventStatus(eventId, status, outcome);
        announce(`Timeline event ${status}`);
      }}
      onClearSession={() => {
        clearMapReviewSession({
          projectId: selectedProjectId,
          title: selectedProject?.name ? `${selectedProject.name} map review session` : 'Map review session',
          initialSnapshot: buildCurrentReviewSnapshot(),
        });
        lastReviewQaSignatureRef.current = null;
        lastReviewRecommendationSignatureRef.current = null;
        recordedCopilotProposalIdsRef.current = new Set();
        recordedCopilotAuditIdsRef.current = new Set();
        recordedNLQueryProposalIdsRef.current = new Set();
        announce('New map review session started');
      }}
      onAnnounce={announce}
    />
  );

  const persistenceDisabled = !selectedProjectId;
  const { activeActivity, activityRailBottomItems, activityRailItems } = useMapActivityRailItems({
    activeActivityId,
    handleSelectMapActivity,
    persistenceDisabled,
    saveProject: toolbarCommandHandlers.saveProject,
  });

  /* ---- Render ---- */
  if (!open) return null;

  const { analyzeDataOperationsElement, analyzeModelsElement, analyzeQueryElement, analyzeStatisticsElement, analyzeToolsElement, analyzeWorkflowElement, analyzeModelsTabActive, analyzeQueryTabActive, analyzeToolsTabActive, analyzeWorkflowsTabActive, dataCatalogTabActive, exportDisabled, exportDisabledReason, isWorkbenchActivity, layerStackElement, layersContentsTabActive, mapCanvasControlsProps, packageExportDisabled, packageExportDisabledReason, pointSymbologyControlBody, publishDataExportElement, publishFigureElement, publishFigureTabActive, publishOfflinePackageElement, publishReadinessItems, publishReportElement, publishReportTabActive, publishReviewPackageElement, reportDisabledReason, scene3DElement, scene3DTabActive, sceneMassingElement, sceneMassingTabActive, sceneRasterElement, sceneRasterTabActive, sceneStatusChips, sceneSunShadowElement, sceneSunShadowTabActive, sceneTemporalElement, sceneTemporalTabActive, sceneVoxCityElement, sceneVoxCityTabActive, sceneZoningElement, sceneZoningTabActive, styleAdvisorElement, styleLabelsElement, styleLegendElement, styleRendererElement, styleRendererTabActive, styleSymbolsElement, transitionStyle, workbenchSidebarTabs, handleSceneWorkspaceTabChange, handleToggleStyleRenderer } = buildMapRuntimeRenderModel({
    activeActivityId,
    activeAnalysisResultLayerIds,
    activeBaseLayer,
    activeDrawTool,
    activeMeasureTool,
    activeRightDockRoutePanel: activeRightDockRoute?.panel ?? null,
    activePublishTabId,
    activeRasterLayerId,
    activeRasterLayerName,
    activeRasterState,
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
    effectiveShowWorkflowDrawer,
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
    handleMapNLQueryPreviewDecision,
    handleMapNLQueryProposalGenerated,
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
    handleToggleCatalog,
    handleToggleClusterViz,
    handleToggleContents,
    handleToggleEmergingHotSpotViz,
    handleToggleHotSpotViz,
    handleToggleLayerPanel,
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
    processingRegistry,
    processingToolDescriptors,
    processingToolboxLayers,
    publishTabLabel,
    recordMapReviewEvent,
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
    selectedCanvasFitContext,
    selectedFeatureCount,
    selectedFeatureIds,
    selectedLayerCartographyRecommendations,
    selectedPointSymbologyLayer,
    selectedProjectId,
    selectionDragTool,
    selectionStatsAvailable,
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
    setShowWorkflowDrawer,
    setStyleWorkspaceLayerId,
    setUrbanWorkflowDraftRequest,
    setWorkbenchSidebarTab,
    setWorkflowPreview,
    showCanvasKeyboardHelp,
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
    workflowPreview,
    workbenchSidebarTab,
    workspaceView,
    zoom,
    activeAoiLabel,
    reorderLayers,
    rerunningAnalysisToken,
  });

  const rightDockBodyContent = (
    <MapRightDockBodyContent
      activeDrawTool={activeDrawTool}
      activeMeasureTool={activeMeasureTool}
      activePublishTabId={activePublishTabId}
      activeRightDockPanel={activeRightDockRoute?.panel ?? null}
      addDrawnFeature={addDrawnFeature}
      addMeasurement={addMeasurement}
      announce={announce}
      attributeTableLayerId={attributeTableLayerId}
      bottomPanelTasks={bottomPanelTasks}
      bottomProblemsModel={bottomProblemsModel}
      clearDrawnFeatures={clearDrawnFeatures}
      clearMeasurements={clearMeasurements}
      drawingSnapSources={drawingSnapSources}
      drawnFeatures={drawnFeatures}
      handleAttributeTableSelection={handleAttributeTableSelection}
      handleBottomProblemAction={handleBottomProblemAction}
      handleCancelDraw={handleCancelDraw}
      handleCancelMeasure={handleCancelMeasure}
      handleClearSelectedFeatures={handleClearSelectedFeatures}
      handleCloseRightDockHost={handleCloseRightDockHost}
      handleCommitDrawnFeatureEdit={handleCommitDrawnFeatureEdit}
      handleCreateAttributeDerivedLayer={handleCreateAttributeDerivedLayer}
      handleFocusAttributeFeature={handleFocusAttributeFeature}
      handleFocusLayer={handleFocusLayer}
      handleInspectLayer={handleInspectLayer}
      handleOpenPublishTab={handleOpenPublishTab}
      handlePublishWorkspaceTabChange={handlePublishWorkspaceTabChange}
      handleRepairLayerGeometry={handleRepairLayerGeometry}
      handleRetryWorkerJob={handleRetryWorkerJob}
      handleRunSelectionStatistics={handleRunSelectionStatistics}
      handleSelectionResult={handleSelectionResult}
      handleSetSelectedFeatures={handleSetSelectedFeatures}
      inspectorContext={inspectorContext}
      mapRef={mapInstanceRef}
      measureUnit={measureUnit}
      measurementSeed={measurementSeed}
      measurements={measurements}
      onApplyLayerStyle={handleApplyLayerStyle}
      overlayLayers={overlayLayers}
      performanceDiagnostics={performanceDiagnostics}
      publishDataExportElement={publishDataExportElement}
      publishFigureElement={publishFigureElement}
      publishOfflinePackageElement={publishOfflinePackageElement}
      publishReadinessItems={publishReadinessItems}
      publishReportElement={publishReportElement}
      publishReviewPackageElement={publishReviewPackageElement}
      queryableLayers={nlQueryToolbarContext.queryableLayers}
      removeDrawnFeature={removeDrawnFeature}
      removeMeasurement={removeMeasurement}
      renderReviewTimeline={buildReviewTimeline}
      rightAttributesDockActive={rightAttributesDockActive}
      rightCollaborationDockActive={rightCollaborationDockActive}
      rightDiagnosticsDockActive={rightDiagnosticsDockActive}
      rightDrawDockActive={rightDrawDockActive}
      rightMeasureDockActive={rightMeasureDockActive}
      rightPerformanceDockActive={rightPerformanceDockActive}
      rightProblemsDockActive={rightProblemsDockActive}
      rightScientificQADockActive={rightScientificQADockActive}
      rightSelectionDockActive={rightSelectionDockActive}
      rightTasksDockActive={rightTasksDockActive}
      rightTimelineDockActive={rightTimelineDockActive}
      scientificQA={scientificQA}
      selectedFeatureCount={selectedFeatureCount}
      selectedFeatureId={selectedFeatureId}
      selectedFeatureIds={selectedFeatureIds}
      selectionDragTool={selectionDragTool}
      selectionStatsSummary={selectionStatsSummary}
      setActiveAnalysisResultLayers={setActiveAnalysisResultLayers}
      setAttributeTableLayerId={setAttributeTableLayerId}
      setDrawSeed={setDrawSeed}
      setMeasureUnit={setMeasureUnit}
      setMeasurementSeed={setMeasurementSeed}
      setSelectedFeatureId={setSelectedFeatureId}
      setSelectionDragTool={setSelectionDragTool}
      setSelectionStatsSummary={setSelectionStatsSummary}
      styleAdvisorElement={styleAdvisorElement}
      styleLabelsElement={styleLabelsElement}
      styleLegendElement={styleLegendElement}
      styleRendererElement={styleRendererElement}
      styleSymbolsElement={styleSymbolsElement}
      updateDrawnFeature={updateDrawnFeature}
      workflowElement={analyzeWorkflowElement}
      openRightDockPanel={openRightDockPanel}
    />
  );

  const bottomOutputDrawerTabs = MAP_BOTTOM_OUTPUT_DRAWER_TABS.map((tab) => {
    const badge = (() => {
      switch (tab.id) {
        case 'attributes':
          return selectedFeatureCount > 0 ? selectedFeatureCount.toLocaleString() : null;
        case 'timeline':
          return reviewSession.events.length > 0 ? reviewSession.events.length.toLocaleString() : null;
        case 'problems':
          return bottomProblemsModel.rows.length > 0 ? bottomProblemsModel.rows.length.toLocaleString() : null;
        case 'logs':
          return activeBackgroundTaskCount > 0 ? `${activeBackgroundTaskCount.toLocaleString()} active` : bottomPanelTasks.length > 0 ? bottomPanelTasks.length.toLocaleString() : null;
        case 'evidence':
          return mapEvidenceArtifacts.length > 0 ? mapEvidenceArtifacts.length.toLocaleString() : null;
        case 'review':
          return reviewCollaborationSnapshot.comments.length > 0 ? reviewCollaborationSnapshot.comments.length.toLocaleString() : null;
        case 'reports': {
          const blockedCount = publishReadinessItems.filter((item) => item.status === 'blocked').length;
          return blockedCount > 0 ? `${blockedCount.toLocaleString()} blocked` : null;
        }
        default:
          return null;
      }
    })();
    return badge ? { ...tab, badge } : tab;
  });

  const bottomOutputDeferredBody = (
    title: string,
    description: string,
  ): React.ReactElement => (
    <MapBottomPanelScrollBody padding={12}>
      <GisEmptyState title={title} description={description} compact />
    </MapBottomPanelScrollBody>
  );

  const bottomOutputDrawerContent: Readonly<Record<MapBottomOutputDrawerTabId, React.ReactNode>> = {
    attributes: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'attributes' ? (
      <MapAttributeWorkflowPanel
        layers={overlayLayers}
        activeLayerId={attributeTableLayerId}
        selectedFeatureIds={selectedFeatureIds}
        onActiveLayerChange={setAttributeTableLayerId}
        onSelectFeatures={handleAttributeTableSelection}
        onFocusFeature={handleFocusAttributeFeature}
        onCreateDerivedLayer={handleCreateAttributeDerivedLayer}
        onClose={closeBottomOutputDrawer}
        onAnnounce={announce}
      />
    ) : bottomOutputDeferredBody(
      'Attributes are loaded on demand',
      'Open this tab to mount the active layer table, selected rows, field profile, and join preview.',
    ),
    timeline: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'timeline'
      ? buildReviewTimeline(true, closeBottomOutputDrawer, 'timeline')
      : bottomOutputDeferredBody(
        'Timeline is loaded on demand',
        'Open this tab to review timeline events, audit trail entries, and revertable commands.',
      ),
    problems: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'problems' ? (
      <MapBottomPanelScrollBody padding={12} data-testid="map-output-drawer-problems-body">
        <MapProblemsPanel model={bottomProblemsModel} compact onProblemAction={handleBottomProblemAction} />
      </MapBottomPanelScrollBody>
    ) : bottomOutputDeferredBody(
      'Problems are loaded on demand',
      'Open this tab to inspect QA blockers, warnings, CRS issues, and geometry validity rows.',
    ),
    logs: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'logs' ? (
      <MapRuntimeLogsDrawerBody
        tasks={bottomPanelTasks}
        telemetryEvents={performanceDiagnostics.telemetryEvents}
        warnings={performanceDiagnostics.warnings}
      />
    ) : bottomOutputDeferredBody(
      'Runtime logs are loaded on demand',
      'Open this tab to inspect background tasks, performance warnings, and redacted telemetry.',
    ),
    evidence: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'evidence'
      ? <MapEvidenceArtifactsDrawerBody artifacts={mapEvidenceArtifacts} />
      : bottomOutputDeferredBody(
        'Evidence is loaded on demand',
        'Open this tab to inspect artifact references, provenance, linked layers, and QA state.',
      ),
    review: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'review'
      ? buildReviewTimeline(true, closeBottomOutputDrawer, 'collaboration')
      : bottomOutputDeferredBody(
        'Review is loaded on demand',
        'Open this tab to inspect collaboration status, comments, handoff state, and audit export.',
      ),
    reports: bottomOutputDrawerOpen && activeBottomOutputDrawerTabId === 'reports' ? (
      <MapReportsDrawerBody
        readinessItems={publishReadinessItems}
        dataExportElement={publishDataExportElement}
        reportElement={publishReportElement}
        reviewPackageElement={publishReviewPackageElement}
      />
    ) : bottomOutputDeferredBody(
      'Reports are loaded on demand',
      'Open this tab to inspect publish readiness, report handoff, review package, and data export output.',
    ),
  };

  const bottomOutputDrawerStatusText = (() => {
    switch (activeBottomOutputDrawerTabId) {
      case 'attributes':
        return attributeTableLayer?.name ?? 'No active attribute layer';
      case 'problems':
        return `${bottomProblemsModel.rows.length.toLocaleString()} QA problem(s)`;
      case 'logs':
        return `${activeBackgroundTaskCount.toLocaleString()} active task(s)`;
      case 'evidence':
        return `${mapEvidenceArtifacts.length.toLocaleString()} evidence artifact(s)`;
      case 'reports':
        return `${publishReadinessItems.length.toLocaleString()} publish check(s)`;
      case 'review':
        return reviewCollaborationSnapshot.connectionState;
      case 'timeline':
      default:
        return `${reviewSession.events.length.toLocaleString()} timeline event(s)`;
    }
  })();

  return createPortal(
    <MapWorkspaceShell mode={mode} shellRef={trapRef} onClose={handleMapExplorerCloseRequest} activeActivityId={activeActivityId}>
      {reducedMotion ? <style>{'[data-map-explorer-shell="true"], [data-map-explorer-shell="true"] * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }'}</style> : null}
      <input
        ref={importInputRef}
        type="file"
        accept={MAP_IMPORT_ACCEPT_ATTRIBUTE}
        style={{ display: 'none' }}
        onChange={event => {
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
        data-map-skip-link="true"
        onClick={event => {
          event.preventDefault();
          focusInteractiveMapCanvas();
        }}
        onKeyDown={event => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          event.preventDefault();
          focusInteractiveMapCanvas();
        }}
        onFocus={e => {
          /* Make visible on focus */
          const el = e.currentTarget;
          Object.assign(el.style, mapStyles.skipNavFocus);
        }}
        onBlur={e => {
          const el = e.currentTarget;
          Object.assign(el.style, mapStyles.srOnly);
        }}
      >
        Skip to map canvas
      </a>

      {/* Screen reader announcements */}
      <AnnouncerRegion />

      <MapActivityRailPresenter items={activityRailItems} bottomItems={activityRailBottomItems} style={mapActivityRailOverlayStyle} />

      {/* Header bar */}
      <MapTopCommandSurface
        activeActivityLabel={activeActivity.label}
        projectName={selectedProject?.name ?? null}
        workspaceView={workspaceView}
        taskLensLabel={activeTaskLens.label}
        hasUnsavedProjectChanges={hasUnsavedProjectChanges}
        persistenceDisabled={persistenceDisabled}
        isSavingProject={isSavingProject}
        isLoadingProject={isLoadingProject}
        lastSavedAt={lastSavedAt}
        scopeLabel={topSurfaceScopeLabel}
        scopeTitle={`Current scope: ${topSurfaceScopeLabel}.`}
        crsLabel={topSurfaceCrsLabel}
        crsTone={topSurfaceCrsTone}
        crsTitle={topSurfaceCrsTitle}
        onOpenCrsReadiness={topSurfaceCrsTone === 'success' ? undefined : handleOpenCanvasCrsReadiness}
        activeLayerLabel={topSurfaceActiveLayer?.name ?? null}
        activeLayerTitle={topSurfaceActiveLayer?.name ?? 'No active layer available.'}
        searchSlot={
          <MapSearchBar
            compact
            onFlyTo={flyTo}
            onPlaceSelected={place => {
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
            onResultCount={count => announce(`${count} search result${count !== 1 ? 's' : ''} found`)}
          />
        }
        commandSlot={
          <MapToolbar
            workspaceView={workspaceView}
            onWorkspaceViewChange={handleSetWorkspaceView}
            taskLens={activeTaskLensId}
            onTaskLensChange={handleTaskLensChange}
            onResetLayout={handleResetLayout}
            onCollapsePanels={handleCollapseAllPanels}
            onFocusMapCanvas={focusInteractiveMapCanvas}
            onRestoreDefaultWidths={handleRestoreDefaultWidths}
            pinMode={pinMode}
            onTogglePinMode={handleTogglePinMode}
            showSidebar={effectiveShowSidebar}
            onToggleSidebar={handleToggleSidebar}
            pinCount={pins.length}
            showLayerPanel={effectiveShowLayerPanel}
            onToggleLayerPanel={handleToggleLayerPanel}
            layerCount={overlayLayers.length}
            visibleLayerCount={visiblePublicationLayers.length}
            showCatalog={dataCatalogTabActive}
            onToggleCatalog={handleToggleCatalog}
            catalogSourceCount={sourceHandles.length}
            showContents={layersContentsTabActive}
            onToggleContents={handleToggleContents}
            showAttributeTable={rightAttributesDockActive}
            onOpenAttributeTableClick={handleOpenAttributesFromToolbar}
            activeLayerGeometryType={toolbarActiveGeometryType}
            hasSelectedAoi={Boolean(selectedAoiFeatureForQuery)}
            scientificQAStatus={scientificQA?.status ?? 'unchecked'}
            scientificQAIssueCount={scientificQAIssueCount}
            scientificQABlockerCount={scientificQABlockerCount}
            showScientificQAPanel={rightProblemsDockActive || rightScientificQADockActive}
            onToggleScientificQAPanel={handleToggleMapProblems}
            showNLQueryPanel={showNLQueryPanel || analyzeQueryTabActive}
            onToggleNLQueryPanel={handleToggleNLQueryPanel}
            nlQueryLayerCount={nlQueryToolbarContext.queryableLayers.length}
            showWorkflowDrawer={showWorkflowDrawer || analyzeWorkflowsTabActive}
            onToggleWorkflowDrawer={handleToggleWorkflowDrawer}
            workflowReadyCount={workflowReadyCount}
            showReviewTimeline={rightTimelineDockActive || rightCollaborationDockActive}
            onToggleReviewTimeline={handleToggleReviewTimelineRightDock}
            reviewEventCount={reviewSession.events.length}
            showPerformanceDiagnostics={rightDiagnosticsDockActive || rightPerformanceDockActive}
            onTogglePerformanceDiagnostics={handleTogglePerformanceDiagnostics}
            performanceIssueCount={performanceIssueCount}
            showPluginPanel={showPluginPanel}
            onTogglePluginPanel={handleTogglePluginPanel}
            pluginExtensionCount={pluginExtensions.length}
            showProcessingToolbox={showProcessingToolbox || analyzeToolsTabActive}
            onToggleProcessingToolbox={handleToggleProcessingToolbox}
            processingToolCount={processingRegistry.implementedCount()}
            showSqlWorkspace={showSqlWorkspace}
            onToggleSqlWorkspace={handleToggleSqlWorkspace}
            showMinimap={showMinimap}
            onToggleMinimap={handleToggleMinimap}
            onCopyViewState={handleCopyViewState}
            onRestoreViewState={handleRestoreViewState}
            viewStateRestoreAvailable={copiedViewState != null}
            showModelBuilder={showModelBuilder || analyzeModelsTabActive}
            onToggleModelBuilder={handleToggleModelBuilder}
            showFigureComposer={showFigureComposer || publishFigureTabActive}
            onToggleFigureComposer={handleToggleFigureComposer}
            showChoroplethPanel={showChoroplethPanel || styleRendererTabActive}
            onToggleChoroplethPanel={handleToggleStyleRenderer}
            showClusterViz={showClusterViz}
            onToggleClusterViz={handleToggleClusterViz}
            showHotSpotViz={showHotSpotViz}
            onToggleHotSpotViz={handleToggleHotSpotViz}
            showEmergingHotSpotViz={showEmergingHotSpotViz}
            onToggleEmergingHotSpotViz={handleToggleEmergingHotSpotViz}
            viewportSyncEnabled={viewportSyncEnabled}
            onToggleViewportSync={handleToggleViewportSync}
            showVoxCityOverlayPanel={showVoxCityOverlay || sceneVoxCityTabActive}
            onToggleVoxCityOverlayPanel={() => {
              if (sceneVoxCityTabActive) {
                setShowLayerPanel(false);
                setShowVoxCityOverlay(false);
                announce('VoxCity 2D overlay closed');
                return;
              }
              handleOpenSceneTab('scene-voxcity', 'VoxCity 2D overlay opened in Scene');
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
            showMeasurePanel={effectiveShowMeasurePanel || rightMeasureDockActive}
            onToggleMeasurePanel={handleToggleMeasurePanel}
            onImportClick={toolbarCommandHandlers.importData}
            onOpenExternalServices={() => {
              setShowExternalServiceDialog(true);
              announce('External map services dialog opened');
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
            packageExportDisabledReason={packageExportDisabledReason}
            reportDisabled={isGeneratingReportHandoffSnapshot}
            reportDisabledReason={reportDisabledReason}
            isExportingImage={isExportingMapImage}
            isExportingPackage={isExportingOfflinePackage}
            isSavingProject={isSavingProject}
            isLoadingProject={isLoadingProject}
            persistenceDisabled={persistenceDisabled}
            hasUnsavedProjectChanges={hasUnsavedProjectChanges}
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
        }
        utilitySlot={<MapBookmarkBar variant="menu" bookmarks={bookmarks} maxBookmarks={MAP_BOOKMARK_LIMIT} onSaveBookmark={handleSaveBookmark} onRestoreBookmark={handleRestoreBookmark} onRenameBookmark={handleRenameBookmark} onDeleteBookmark={handleDeleteBookmark} onShareBookmark={handleShareBookmark} />}
        contextBarSlot={
          <>
            {/* Layer context group */}
            <ToolbarButton label="Layers" title={effectiveShowLayerPanel ? 'Hide layers workspace' : 'Show layers workspace'} active={effectiveShowLayerPanel} onClick={handleToggleLayerPanel} />
            <ToolbarButton label="Contents" title={layersContentsTabActive ? 'Hide contents tree' : 'Show contents tree'} active={layersContentsTabActive} onClick={handleToggleContents} />
            <ToolbarButton label="Catalog" title={dataCatalogTabActive ? 'Hide data catalog' : 'Show data catalog'} active={dataCatalogTabActive} onClick={handleToggleCatalog} />
            <span style={contextToolbarCountStyle} aria-label={`${overlayLayers.length.toLocaleString()} layers`}>
              {overlayLayers.length.toLocaleString()} layers
            </span>
            <span style={contextBarDividerStyle} aria-hidden="true" />
            {/* Selection tools */}
            <MapSelectionTools mapRef={mapInstanceRef} queryableLayers={nlQueryToolbarContext.queryableLayers} selectedFeatureIds={selectedFeatureIds} activeDragTool={selectionDragTool} showModeButtons variant="bar" onSetSelectedFeatures={handleSetSelectedFeatures} onClearSelectedFeatures={handleClearSelectedFeatures} onSetActiveAnalysisResultLayers={setActiveAnalysisResultLayers} onAddDrawnFeature={addDrawnFeature} onActiveDragToolChange={setSelectionDragTool} onSelectionResult={handleSelectionResult} onAnnounce={announce} />
            <span style={contextBarDividerStyle} aria-hidden="true" />
            {/* Canvas controls */}
            <MapCanvasControls {...mapCanvasControlsProps} surface="bar" />
          </>
        }
        modalControlSlot={
          <div style={modalControlClusterStyle} data-testid="map-modal-control-cluster">
            <GisIconButton label="Expand map workspace to default layout" tooltip="Expand map workspace to default layout" icon={<Maximize2 size={MAP_ICON_SIZES.sm} aria-hidden="true" />} size="md" showPressedState={false} onClick={handleResetLayout} data-testid="map-modal-control-expand" />
            <span style={modalControlCloseDividerStyle} aria-hidden="true" />
            <GisIconButton label="Close map explorer (Escape)" tooltip="Close map explorer (Escape)" icon={<IconClose size={MAP_ICON_SIZES.md} aria-hidden="true" />} size="md" variant="accent" showPressedState={false} style={modalControlCloseButtonStyle} onClick={onClose} data-testid="map-modal-control-close" />
          </div>
        }
      />

      {/* Map area */}
      <MapCanvasRegion
        ref={handleMapContainerRef}
        style={
          {
            '--map-shell-command-height': MAP_LAYOUT_TOKENS.commandBarHeight,
            '--map-dock-left': `${navigatorLeftInset}px`,
            '--map-dock-right': `${navigatorRightInset}px`,
            '--map-overlay-safe-inset-x': '0.75rem',
            '--map-overlay-safe-inset-y': '0.25rem',
            '--map-overlay-safe-top': 'calc(var(--map-shell-command-height, 2.25rem) + var(--map-overlay-safe-inset-y, 0.25rem))',
            '--map-overlay-safe-bottom': '6.75rem',
            '--map-canvas-control-dock-width': '20rem',
            '--map-canvas-control-dock-clearance': '10rem',
            '--map-popover-max-height': 'min(24rem, calc(100vh - 8rem))',
            '--map-layer-panel-width': `${dockLayout.layerPanelWidth}px`,
            '--map-activity-rail-width': MAP_ACTIVITY_RAIL_WIDTH,
            width: `calc(100% - ${MAP_ACTIVITY_RAIL_WIDTH})`,
            marginLeft: MAP_ACTIVITY_RAIL_WIDTH,
          } as React.CSSProperties
        }
        data-map-dock-compact={dockLayout.compactDock ? 'true' : 'false'}
        data-map-right-panel={dockLayout.activeRightPanel ?? 'none'}
        data-map-layer-placement={dockLayout.layerPanelPlacement ?? 'none'}
        data-testid="map-canvas-region"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={event => {
          void handleDrop(event);
        }}
        onKeyDown={event => {
          if (event.key !== 'Escape') {
            return;
          }
          if (activeTool || activeDrawTool || activeMeasureTool || selectionDragTool || showCanvasKeyboardHelp) {
            event.preventDefault();
            event.stopPropagation();
            if (showCanvasKeyboardHelp) {
              setShowCanvasKeyboardHelp(false);
              announce('Map keyboard help closed');
              return;
            }
            handleClearActiveCanvasTool();
            return;
          }
          event.preventDefault();
          handleMapExplorerEscapeRequest();
        }}
      >
        {isDragActive ? (
          <div
            style={{
              ...mapStyles.dragOverlay,
              inset: 'calc(var(--map-overlay-safe-inset-x, 0.75rem) + 0.25rem)',
              display: 'grid',
              placeItems: 'center',
              alignContent: 'center',
              gap: '0.75rem',
              textAlign: 'center',
              border: '1px solid var(--syn-border-active, rgba(56, 189, 248, 0.6))',
              background: 'var(--syn-surface-overlay, rgba(8, 12, 18, 0.68))',
              color: 'var(--syn-text-secondary, rgba(203, 213, 225, 0.92))',
            }}
            aria-hidden="true"
            data-map-safe-inset-consumer="drag-drop"
          >
            <span style={{ display: 'grid', gap: 4 }}>
              <span style={{ color: 'var(--syn-text-primary, rgba(244, 247, 255, 0.94))', fontSize: 14, fontWeight: 700 }}>
                Drop spatial data to import
              </span>
              <span style={{ color: 'var(--syn-text-muted, rgba(148, 163, 184, 0.86))', fontSize: 12, fontFamily: 'var(--syn-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)' }}>
                GeoJSON . CSV . Arrow . GeoParquet . KML/KMZ . GPX . GeoTIFF
              </span>
            </span>
          </div>
        ) : null}

        <MapCanvasOverlayChrome announce={announce} dispatchFeedback={dispatchFeedback} externalBounds={externalServiceBounds?.bounds ?? null} externalBoundsLabel={externalServiceBounds?.label ?? null} handleExternalServiceLayerReady={handleExternalServiceLayerReady} handleExternalServiceProgress={handleExternalServiceProgress} handleOpenVoxCityOverlayFromService={handleOpenVoxCityOverlayFromService} importLabel={importLabel} importProgress={importProgress} navigatorLeftInset={navigatorLeftInset} navigatorRightInset={navigatorRightInset} overlayLayers={overlayLayers} removeOverlayLayer={removeOverlayLayer} setShowExternalServiceDialog={setShowExternalServiceDialog} showExternalServiceDialog={showExternalServiceDialog} showImportProgress={showImportProgress} />

        {isFlowDispatchDialogOpen ? <MapFlowDispatchDialog compatibleAoiFlows={compatibleAoiFlows} flowDispatchAoi={flowDispatchAoi} hasCurrentMapBounds={Boolean(currentMapBounds)} restrictToMapView={restrictToMapView} onClose={() => setIsFlowDispatchDialogOpen(false)} onToggleRestrictToMapView={handleToggleRestrictToMapView} onDispatchFlow={handleDispatchFlowSelection} /> : null}

        <MapNavigatorStageView
          visible={navigatorStageMode}
          startDialogOpen={startDialogOpen}
          reason={mapStartDialogState.reason}
          selectedProjectId={selectedProjectId}
          lastSavedAt={lastSavedAt}
          overlayLayers={overlayLayers}
          contextSummary={contextSummary}
          pinCount={pins.length}
          drawnFeatureCount={drawnFeatures.length}
          measurementCount={measurements.length}
          activeAoiLabel={activeAoiLabel}
          qaIssueCount={scientificQAIssueCount}
          qaBlockerCount={scientificQABlockerCount}
          workflowReadyCount={workflowReadyCount}
          visiblePublicationLayerCount={visiblePublicationLayers.length}
          viewportSyncEnabled={viewportSyncEnabled}
          syncStatus={viewportSyncStatus}
          analysisRecommendations={analysisRecommendationState.recommendations}
          navigatorLeftInset={navigatorLeftInset}
          navigatorRightInset={navigatorRightInset}
          workspaceView={workspaceView}
          onSelectView={handleSetWorkspaceView}
          onQuickAction={handleMapQuickAction}
          onAnalysisRecommendationAction={handleAnalysisRecommendationAction}
          onImport={handleImportRequest}
          onOpenProject={() => {
            void handleProjectLoad();
          }}
          onAddDemoPack={() => handleCatalogAddDemoPack(buildDemoPackCatalogInsertion())}
          onContinue={() => closeMapStartDialog('continue', 'Map launch dialog dismissed')}
          onClose={handleMapExplorerCloseRequest}
          onOpenSourceHealth={handleStartDialogOpenSources}
        />

        {effectiveShowLayerPanel ? <MapExplorerLayerPanelRail activeActivityId={activeActivityId} activeActivityLabel={activeActivity.label} analyzeDataOperationsElement={analyzeDataOperationsElement} analyzeModelsElement={analyzeModelsElement} analyzeQueryElement={analyzeQueryElement} analyzeStatisticsElement={analyzeStatisticsElement} analyzeToolsElement={analyzeToolsElement} analyzeWorkflowElement={analyzeWorkflowElement} announce={announce} collapsed={workbenchSidebarCollapsed} dataExportElement={publishDataExportElement} dockLayerPanelPlacement={dockLayout.layerPanelPlacement ?? null} figureElement={publishFigureElement} focusActiveActivityButton={focusActiveActivityButton} isWorkbenchActivity={isWorkbenchActivity} layerCount={overlayLayers.length} crsWarningCount={overlayLayers.filter((layer) => resolveOverlayLayerCrsSummary(layer).status !== 'known').length} layerPanelWidth={dockLayout.layerPanelWidth} layerStackElement={layerStackElement} legendRef={legendRef} massingElement={sceneMassingElement} offlinePackageElement={publishOfflinePackageElement} onLayerPanelWidthChange={handleLayerPanelWidthChange} onPublishTabChange={handlePublishWorkspaceTabChange} onSceneTabChange={handleSceneWorkspaceTabChange} publishReadinessItems={publishReadinessItems} reportElement={publishReportElement} reviewPackageElement={publishReviewPackageElement} scene3DElement={scene3DElement} sceneRasterElement={sceneRasterElement} sceneStatusChips={sceneStatusChips} sceneSunShadowElement={sceneSunShadowElement} sceneTemporalElement={sceneTemporalElement} sceneVoxCityElement={sceneVoxCityElement} sceneZoningElement={sceneZoningElement} setCollapsed={setWorkbenchSidebarCollapsed} setShowFigureComposer={setShowFigureComposer} setShowLayerPanel={setShowLayerPanel} setShowVoxCityOverlay={setShowVoxCityOverlay} clearWorkflowPreview={() => setWorkflowPreview(null)} styleAdvisorElement={styleAdvisorElement} styleLabelsElement={styleLabelsElement} styleLegendElement={styleLegendElement} styleRendererElement={styleRendererElement} styleSymbolsElement={styleSymbolsElement} workbenchSidebarTab={workbenchSidebarTab} workbenchSidebarTabs={workbenchSidebarTabs} onWorkbenchSidebarTabChange={setWorkbenchSidebarTab} /> : null}

        <MapCanvas id={mapCanvasId} baseLayer={activeBaseLayer} pinMode={pinMode} pins={pins} interactiveLayerIds={interactiveAnalysisLayerIds} reducedMotion={reducedMotion} preserveDrawingBuffer={mapCanvasCaptureMode} showScaleBar={false} onCursorMove={handleCursorMove} onZoomChange={handleZoomChange} onViewportChange={handleViewportChange} onMapClick={handleMapClick} onMapReady={handleMapReady} onMapDestroy={handleMapDestroy} onRenderError={handleMapRenderError} onFeatureReportRequest={handleFeatureReportRequest} />

        {!navigatorStageMode ? (
          <MapScaleIndicator visible={mapCompositionOptions.includeScaleBar} />
        ) : null}

        {!navigatorStageMode ? (
          <MapNavExtras flyTo={flyTo} onAnnounce={announce} />
        ) : null}

        {overlayLayers.length === 0 && !navigatorStageMode && !isDragActive ? (
          <div
            style={{
              position: 'absolute',
              left: 'calc(var(--map-dock-left, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))',
              right: 'calc(var(--map-dock-right, 0px) + var(--map-overlay-safe-inset-x, 0.75rem))',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'grid',
              placeItems: 'center',
              gap: '0.75rem',
              pointerEvents: 'none',
              zIndex: 1,
              color: 'var(--syn-text-secondary, rgba(203, 213, 225, 0.92))',
              textAlign: 'center',
            }}
            role="status"
            aria-label="Empty map state"
            data-testid="map-empty-canvas-state"
            data-map-safe-inset-consumer="empty-map-state"
          >
            <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '28rem', padding: '0.75rem 1rem', pointerEvents: 'auto' }}>
              <span style={{ color: 'var(--syn-text-primary, rgba(244, 247, 255, 0.94))', fontSize: 14, fontWeight: 700 }}>
                No map layers yet
              </span>
              <span style={{ color: 'var(--syn-text-muted, rgba(148, 163, 184, 0.86))', fontSize: 12 }}>
                Add Data or drop GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, GPX, or GeoTIFF files on the canvas.
              </span>
              <button
                type="button"
                style={{
                  ...mapStyles.btn,
                  justifySelf: 'center',
                  border: '1px solid var(--syn-border-active, rgba(56, 189, 248, 0.6))',
                  color: 'var(--syn-text-primary, rgba(244, 247, 255, 0.94))',
                  background: 'color-mix(in srgb, var(--syn-interaction-active, #3794ff) 14%, transparent)',
                  pointerEvents: 'auto',
                }}
                onClick={handleImportRequest}
              >
                Add Data
              </button>
            </div>
          </div>
        ) : null}

        {publishReportTabActive ? null : (
          <Suspense fallback={null}>
            <LazyMapReportHandoffDrawer draft={reportHandoffDraft} options={reportHandoffOptions} isGeneratingSnapshot={isGeneratingReportHandoffSnapshot} isExportingPdf={isExportingReportHandoffPdf} presentation={dockLayout.compactDock ? 'bottom-drawer' : 'right-rail'} width={dockLayout.rightPanelWidth} onWidthChange={handleRightPanelWidthChange} onOptionsChange={handleReportHandoffOptionsChange} onRefreshSnapshot={handleRefreshReportHandoffSnapshot} onRegisterEvidence={handleRegisterReportEvidenceBlock} onDownloadPdf={handleDownloadReportHandoffPdf} onInsert={handleInsertReportHandoff} onClose={handleCloseReportHandoff} />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <LazyMapInspectorHost visible={inspectorContext.kind !== 'none'} context={inspectorContext} presentation={dockLayout.compactDock ? 'bottom-drawer' : 'right-rail'} width={dockLayout.rightPanelWidth} onClose={handleCloseInspectorHost} onApplyLayerStyle={handleApplyLayerStyle} returnFocusTo={inspectorReturnFocusRef.current} />
        </Suspense>
        <MapExplorerModalRuntimeView announce={announce} handleOpenSceneTab={handleOpenSceneTab} navigatorStageMode={navigatorStageMode} scene3DTabActive={scene3DTabActive} sceneMassingTabActive={sceneMassingTabActive} sceneRasterTabActive={sceneRasterTabActive} sceneSunShadowTabActive={sceneSunShadowTabActive} sceneZoningTabActive={sceneZoningTabActive} showPluginPanel={showPluginPanel} setShowPluginPanel={setShowPluginPanel} pluginExtensions={pluginExtensions} showProcessingToolbox={showProcessingToolbox} setShowProcessingToolbox={setShowProcessingToolbox} showSqlWorkspace={showSqlWorkspace} setShowSqlWorkspace={setShowSqlWorkspace} handleSqlResultToMap={handleSqlResultToMap} showMinimap={showMinimap} minimapCenter={center} minimapZoom={zoom} analyzeToolsTabActive={analyzeToolsTabActive} searchProcessingTools={searchProcessingTools} processingToolboxLayers={processingToolboxLayers} handlePreviewProcessingTool={handlePreviewProcessingTool} handleRunProcessingTool={handleRunProcessingTool} showModelBuilder={showModelBuilder} setShowModelBuilder={setShowModelBuilder} analyzeModelsTabActive={analyzeModelsTabActive} processingToolDescriptors={processingToolDescriptors} handleRunMapModel={handleRunMapModel} handleRunMapModelBatch={handleRunMapModelBatch} handleExportMapModelToIdeAndUrban={handleExportMapModelToIdeAndUrban} effectiveShowWorkflowDrawer={effectiveShowWorkflowDrawer} analyzeWorkflowsTabActive={analyzeWorkflowsTabActive} workflowPreview={workflowPreview} effectiveShowScientificQAPanel={effectiveShowScientificQAPanel} scientificQA={scientificQA} overlayLayers={overlayLayers} compactDock={dockLayout.compactDock} rightPanelWidth={dockLayout.rightPanelWidth} handleRightPanelWidthChange={handleRightPanelWidthChange} setShowScientificQAPanel={setShowScientificQAPanel} handleFocusLayer={handleFocusLayer} handleInspectLayer={handleInspectLayer} handleRepairLayerGeometry={handleRepairLayerGeometry} handleOpenPublishTab={handleOpenPublishTab} effectiveShowNLQueryPanel={effectiveShowNLQueryPanel} analyzeQueryTabActive={analyzeQueryTabActive} selectedAoiFeatureForQuery={selectedAoiFeatureForQuery} currentMapBounds={currentMapBounds} isRunningMapNLQuery={isRunningMapNLQuery} lastMapNLQuerySummary={lastMapNLQuerySummary} handleRunMapNLQuery={handleRunMapNLQuery} handleMapNLQueryProposalGenerated={handleMapNLQueryProposalGenerated} handleMapNLQueryPreviewDecision={handleMapNLQueryPreviewDecision} setShowNLQueryPanel={setShowNLQueryPanel} urbanWorkflowDraftRequest={urbanWorkflowDraftRequest} workflowContext={workflowContext} setShowWorkflowDrawer={setShowWorkflowDrawer} setWorkflowPreview={setWorkflowPreview} setUrbanWorkflowDraftRequest={setUrbanWorkflowDraftRequest} handleApplyMapWorkflow={handleApplyMapWorkflow} handleSaveWorkflowReport={handleSaveWorkflowReport} handleOpenWorkflowScriptInIde={handleOpenWorkflowScriptInIde} handleExecuteMapWorkflow={handleExecuteMapWorkflow} handleCancelMapWorkflow={handleCancelMapWorkflow} workflowExecution={workflowExecution} mapCanvasControlsProps={mapCanvasControlsProps} showLegendOverlay={mapCompositionOptions.includeLegend} mapPublicationLegendItems={mapPublicationLegendItems} performanceDiagnostics={performanceDiagnostics} openPerformanceRightDock={openPerformanceRightDock} activeRightDockRoute={activeRightDockRoute} rightDockPanels={MAP_RIGHT_DOCK_PANEL_IDS} rightDockBodyContent={rightDockBodyContent} rightDockPresentation={dockLayout.rightPanelPlacement === 'drawer' ? 'side-drawer' : 'right-dock'} handleRightDockHostPanelChange={handleRightDockHostPanelChange} handleCollapseRightDockHost={handleCollapseRightDockHost} handleCloseRightDockHost={handleCloseRightDockHost} effectiveShowUrbanMethodPanel={effectiveShowUrbanMethodPanel} activeUrbanMethodRequest={activeUrbanMethodRequest} activeUrbanMethodPreview={activeUrbanMethodPreview} handleCloseUrbanMethodRail={handleCloseUrbanMethodRail} handleFocusUrbanMethodLayer={handleFocusUrbanMethodLayer} handlePreviewUrbanMethodWorkflow={handlePreviewUrbanMethodWorkflow} showFigureComposer={showFigureComposer} publishFigureTabActive={publishFigureTabActive} bearing={bearing} temporalLayoutRestoreRequest={temporalLayoutRestoreRequest} setShowFigureComposer={setShowFigureComposer} setShowMapExportDialog={setShowMapExportDialog} handleTemporalRestoreRequestHandled={handleTemporalRestoreRequestHandled} mapRef={mapInstanceRef} reducedMotion={reducedMotion} temporalPlayerMap={mapInstanceRef.current} temporalFrames={activeTemporalLayer?.metadata?.analysisResult?.visualization.temporalFrames ?? []} temporalTimeProperty={activeTemporalLayer?.metadata?.analysisResult?.visualization.timeProperty ?? 'timestamp'} temporalSourceId={activeTemporalLayer?.id ?? null} temporalLayerId={activeTemporalLayer?.id ?? null} temporalLayerName={activeTemporalLayer?.name ?? null} temporalPlayerVisible={!!open && sceneTemporalTabActive} showChoroplethPanel={showChoroplethPanel} setShowChoroplethPanel={setShowChoroplethPanel} showClusterViz={showClusterViz} setShowClusterViz={setShowClusterViz} showHotSpotViz={showHotSpotViz} setShowHotSpotViz={setShowHotSpotViz} showEmergingHotSpotViz={showEmergingHotSpotViz} setShowEmergingHotSpotViz={setShowEmergingHotSpotViz} activeDrawTool={activeDrawTool} drawSeed={drawSeed} drawnFeatures={drawnFeatures} drawingSnapSources={drawingSnapSources} selectedFeatureId={selectedFeatureId} addDrawnFeature={addDrawnFeature} removeDrawnFeature={removeDrawnFeature} updateDrawnFeature={updateDrawnFeature} handleCommitDrawnFeatureEdit={handleCommitDrawnFeatureEdit} clearDrawnFeatures={clearDrawnFeatures} setSelectedFeatureId={setSelectedFeatureId} handleCancelDraw={handleCancelDraw} setDrawSeed={setDrawSeed} effectiveShowMeasurePanel={effectiveShowMeasurePanel} rightMeasureDockActive={rightMeasureDockActive} activeMeasureTool={activeMeasureTool} measurementSeed={measurementSeed} measurements={measurements} measureUnit={measureUnit} addMeasurement={addMeasurement} removeMeasurement={removeMeasurement} clearMeasurements={clearMeasurements} setMeasureUnit={setMeasureUnit} handleCancelMeasure={handleCancelMeasure} setMeasurementSeed={setMeasurementSeed} pins={pins} effectiveShowSidebar={effectiveShowSidebar} handleRemovePin={handleRemovePin} handleClearPins={handleClearPins} flyTo={flyTo} effectiveShowLayerPanel={effectiveShowLayerPanel} layerPanelOpenButtonStyle={mapStyles.layerPanelOpenButton} layerOpenButtonIconSize={MAP_ICON_SIZES.sm} handleMapClick={handleMapClick} handleStartMeasureFromContext={handleStartMeasureFromContext} handleStartPolygonFromContext={handleStartPolygonFromContext} handleOpenFlowDispatchDialog={handleOpenFlowDispatchDialog} handleIsochroneDispatch={handleIsochroneDispatch} handleHotSpotDispatch={handleHotSpotDispatch} handleRunSelectionStatistics={handleRunSelectionStatistics} selectionStatsAvailable={selectionStatsAvailable} annotationMode={annotationMode} annotations={annotations} selectedAnnotationId={selectedAnnotationId} annotationToolSettings={annotationToolSettings} handleAddMapAnnotation={handleAddMapAnnotation} handleUpdateMapAnnotation={handleUpdateMapAnnotation} handleMoveMapAnnotation={handleMoveMapAnnotation} handleRemoveMapAnnotation={handleRemoveMapAnnotation} setSelectedAnnotationId={setSelectedAnnotationId} setAnnotationToolSettings={setAnnotationToolSettings} handleDeactivateAnnotationMode={handleDeactivateAnnotationMode} setShowComparisonStrip={setShowComparisonStrip} setShowInteractionStrip={setShowInteractionStrip} setShowLayerPanel={setShowLayerPanel} showComparisonStrip={showComparisonStrip} showInteractionStrip={showInteractionStrip} />

        <MapPointSymbologyFloatingPanel visible={Boolean(pointSymbologyLayerId) && !styleSymbolsTabActive && !effectiveShowScientificQAPanel && !effectiveShowNLQueryPanel} layerName={selectedPointSymbologyLayer?.name ?? 'Point layer'} mode={pointSymbologyMode} controls={pointSymbologyControlBody} panelPositionStyle={symbologyPanelDrag.panelPositionStyle} dragHandleStyle={symbologyPanelDrag.dragHandleStyle} dragHandleProps={symbologyPanelDrag.dragHandleProps} onModeChange={setPointSymbologyMode} onClose={() => setPointSymbologyLayerId(null)} />

        <MapBottomOutputDrawer
          open={bottomOutputDrawerOpen}
          activeTabId={activeBottomOutputDrawerTabId}
          onTabChange={setActiveBottomOutputDrawerTabId}
          onClose={closeBottomOutputDrawer}
          tabs={bottomOutputDrawerTabs}
          childrenByTab={bottomOutputDrawerContent}
          height={bottomOutputDrawerHeight}
          minHeight={MAP_BOTTOM_OUTPUT_DRAWER_MIN_HEIGHT}
          maxHeight={MAP_BOTTOM_OUTPUT_DRAWER_MAX_HEIGHT}
          onHeightChange={setBottomOutputDrawerHeight}
          statusText={bottomOutputDrawerStatusText}
        />
      </MapCanvasRegion>

      <MapBottomTimeline timelineSlot={bottomTimelineSlot} data-testid="map-bottom-timeline" data-map-right-dock-route={activeRightDockRoute?.panel ?? 'none'} data-map-right-dock-route-source={activeRightDockRoute?.source ?? 'none'} data-map-legacy-bottom-tab={activeRightDockRoute?.legacyBottomTabId ?? 'none'} style={{ paddingLeft: MAP_ACTIVITY_RAIL_WIDTH }}>
        <div ref={statusBarRef}>
          <MapStatusBarWithCursor ref={statusCursorRef} zoom={zoom} projectId={selectedProjectId} workspaceLabel={workspaceView} taskLensLabel={activeTaskLens.label} densityLabel={toolbarDensity === 'comfortable' ? 'comfort' : toolbarDensity} layerCount={overlayLayers.length} visibleLayerCount={overlayLayers.filter(layer => layer.visible).length} pinCount={pins.length} drawnFeatureCount={drawnFeatures.length} measurementCount={measurements.length} measureUnit={measureUnit} crs="EPSG:4326" syncStatus={viewportSyncStatus} selectedFeatureCount={contextSummary.selection.totalSelectedFeatures} activeCanvasToolLabel={activeCanvasToolLabel} hasActiveAoi={Boolean(contextSummary.activeAoi)} qaStatus={contextSummary.qa.status} qaIssueCount={scientificQAIssueCount} qaBlockerCount={scientificQABlockerCount} onOpenInspect={handleOpenInspectFromStatus} onOpenProject={handleOpenProjectFromStatus} onOpenLayers={handleOpenLayersFromStatus} onOpenCrsReadiness={handleOpenCanvasCrsReadiness} onOpenProblems={() => openBottomOutputDrawer('problems', 'QA Problems opened in the output drawer')} onOpenAttributes={handleOpenAttributesFromStatus} onOpenSelection={handleOpenSelectionFromStatus} onOpenDraw={handleOpenDrawFromStatus} onOpenMeasurements={handleOpenMeasurementsFromStatus} reviewEventCount={reviewSession.events.length} onOpenTimeline={() => openBottomOutputDrawer('timeline', 'Review timeline opened in the output drawer')} taskCount={bottomPanelTasks.length} activeTaskCount={activeBackgroundTaskCount} onOpenTasks={handleOpenTasksFromStatus} collaborationStatus={reviewCollaborationSnapshot.connectionState} collaborationPresenceCount={reviewCollaborationSnapshot.presence.length} collaborationCommentCount={reviewCollaborationSnapshot.comments.length} onOpenCollaboration={() => openRightDockPanel('collaboration', 'Review collaboration opened in the right dock', 'status-bar')} onOpenDiagnostics={() => openPerformanceRightDock('Performance diagnostics opened in the right dock', 'status-bar')} performanceMode={performanceDiagnostics.renderMode} performanceIssueCount={performanceIssueCount} lastRenderDurationMs={performanceDiagnostics.lastRenderTiming?.durationMs ?? null} isSaving={isSavingProject} isLoading={isLoadingProject} lastSavedAt={lastSavedAt} autoSaveEnabled={autoSaveEnabled} providerLabel={BASE_STYLES[activeBaseLayer].name} providerHref={activeBaseLayer === 'streets' ? 'https://www.openstreetmap.org/copyright' : activeBaseLayer === 'dark' || activeBaseLayer === 'terrain' ? 'https://carto.com/attributions' : undefined} reducedMotion={reducedMotion} style={{ transition: transitionStyle }} />
        </div>
      </MapBottomTimeline>

      <MapExplorerDialogStack
        dataExport={{
          open: showExportDialog,
          format: exportFormat,
          target: exportTarget,
          precision: exportPrecision,
          prettyPrint: exportPrettyPrint,
          includeProperties: exportIncludeProperties,
          onFormatChange: setExportFormat,
          onTargetChange: setExportTarget,
          onPrecisionChange: precision => setExportPrecision(Number.isFinite(precision) ? Math.max(0, Math.min(12, precision)) : 6),
          onPrettyPrintChange: setExportPrettyPrint,
          onIncludePropertiesChange: setExportIncludeProperties,
          onClose: () => setShowExportDialog(false),
          onExport: () => {
            void handleExportConfirm();
          },
        }}
        mapExport={{
          open: showMapExportDialog,
          compositionOptions: mapCompositionOptions,
          legendAvailable: visiblePublicationLayers.length > 0,
          visibleLayerCount: visiblePublicationLayers.length,
          readiness: mapPublicationReadiness,
          previewUrl: mapExportPreviewUrl,
          isGeneratingPreview: isGeneratingMapExportPreview,
          isExporting: isExportingMapImage,
          onCompositionChange: handleMapCompositionChange,
          onClose: () => setShowMapExportDialog(false),
          onOpenManifestInIde: handleOpenMapManifestInIde,
          onOpenExportNoteInIde: handleOpenExportNoteInIde,
          onExport: () => {
            void handleMapExportConfirm();
          },
        }}
        importHub={{
          open: showImportHub,
          loadingDatasetId: loadingTeachingDatasetId,
          onClose: () => setShowImportHub(false),
          onBrowseLocalFiles: handleBrowseLocalFiles,
          onLoadDataset: handleTeachingDatasetImport,
        }}
        importPreview={{
          open: pendingImportPreview != null,
          profile: pendingImportPreview?.profile ?? null,
          onClose: clearPendingImportPreview,
          onImport: pendingImportPreview?.result
            ? () => {
                void handleImportPreviewConfirm();
              }
            : undefined,
        }}
        csvImport={{
          open: pendingCsvImport != null,
          session: pendingCsvImport,
          latitudeColumn: csvLatitudeColumn,
          longitudeColumn: csvLongitudeColumn,
          onLatitudeColumnChange: setCsvLatitudeColumn,
          onLongitudeColumnChange: setCsvLongitudeColumn,
          onClose: clearPendingCsvImport,
          onImport: () => {
            void handleCsvImportConfirm();
          },
        }}
        columnarImport={{
          open: pendingColumnarImport != null,
          session: pendingColumnarImport,
          onClose: clearPendingColumnarImport,
          onImport: () => {
            void handleColumnarImportConfirm();
          },
        }}
      />
    </MapWorkspaceShell>,
    document.body
  );
};
