import React from "react";

import { MapMeasurementTool } from "../../MapMeasurementTool";
import { MapDrawingManager } from "../../MapDrawingManager";
import { MapAttributeWorkflowPanel } from "../table/MapAttributeWorkflowPanel";
import { MapBottomPanelScrollBody, type MapBottomPanelTask, MapBottomPanelTasksBody } from "../bottom";
import { MapSelectionTools, type SelectionDragTool } from "../MapSelectionTools";
import { ScientificQAPanel } from "../ScientificQAPanel";
import { type MapProblemRow, MapProblemsPanel } from "../problems";
import { MapPanelErrorBoundary } from "../MapPanelErrorBoundary";
import { MapPerformanceDiagnosticsPanel } from "../MapPerformanceDiagnosticsPanel";
import { GisEmptyState } from "../ui";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  mapStyles,
} from "../mapTokens";
import type { SelectionStatisticsSummary } from "../../../../services/map/MapAnalysisDispatcher";

interface MapRightDockBodyContentProps {
  activeDrawTool: React.ComponentProps<typeof MapDrawingManager>["activeDrawTool"];
  activeMeasureTool: React.ComponentProps<typeof MapMeasurementTool>["activeMeasureTool"];
  activeRightDockPanel: string | null;
  addDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onAddFeature"];
  addMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onAddMeasurement"];
  announce: (message: string) => void;
  attributeTableLayerId: string | null;
  bottomPanelTasks: MapBottomPanelTask[];
  bottomProblemsModel: React.ComponentProps<typeof MapProblemsPanel>["model"];
  clearDrawnFeatures: React.ComponentProps<typeof MapDrawingManager>["onClearFeatures"];
  clearMeasurements: React.ComponentProps<typeof MapMeasurementTool>["onClearMeasurements"];
  drawingSnapSources: React.ComponentProps<typeof MapDrawingManager>["snapSources"];
  drawnFeatures: React.ComponentProps<typeof MapDrawingManager>["drawnFeatures"];
  handleAttributeTableSelection: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onSelectFeatures"];
  handleBottomProblemAction: (problem: MapProblemRow) => void;
  handleCancelDraw: React.ComponentProps<typeof MapDrawingManager>["onCancelDraw"];
  handleCancelMeasure: React.ComponentProps<typeof MapMeasurementTool>["onCancelMeasure"];
  handleClearSelectedFeatures: React.ComponentProps<typeof MapSelectionTools>["onClearSelectedFeatures"];
  handleCloseRightDockHost: () => void;
  handleCommitDrawnFeatureEdit: React.ComponentProps<typeof MapDrawingManager>["onCommitFeatureEdit"];
  handleCreateAttributeDerivedLayer: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onCreateDerivedLayer"];
  handleFocusAttributeFeature: React.ComponentProps<typeof MapAttributeWorkflowPanel>["onFocusFeature"];
  handleFocusLayer: React.ComponentProps<typeof ScientificQAPanel>["onOpenLayer"];
  handleInspectLayer: React.ComponentProps<typeof ScientificQAPanel>["onInspectLayer"];
  handleOpenPublishTab: (tabId: "publish-data-export", announcement: string) => void;
  handleRepairLayerGeometry: React.ComponentProps<typeof ScientificQAPanel>["onRepairGeometry"];
  handleRetryWorkerJob: React.ComponentProps<typeof MapPerformanceDiagnosticsPanel>["onRetryWorkerJob"];
  handleRunSelectionStatistics: () => void;
  handleSelectionResult: React.ComponentProps<typeof MapSelectionTools>["onSelectionResult"];
  handleSetSelectedFeatures: React.ComponentProps<typeof MapSelectionTools>["onSetSelectedFeatures"];
  mapRef: React.ComponentProps<typeof MapMeasurementTool>["mapRef"];
  measureUnit: React.ComponentProps<typeof MapMeasurementTool>["measureUnit"];
  measurementSeed: React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"];
  measurements: React.ComponentProps<typeof MapMeasurementTool>["measurements"];
  overlayLayers: React.ComponentProps<typeof ScientificQAPanel>["overlayLayers"];
  performanceDiagnostics: React.ComponentProps<typeof MapPerformanceDiagnosticsPanel>["diagnostics"];
  queryableLayers: React.ComponentProps<typeof MapSelectionTools>["queryableLayers"];
  removeDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onRemoveFeature"];
  removeMeasurement: React.ComponentProps<typeof MapMeasurementTool>["onRemoveMeasurement"];
  renderReviewTimeline: (visible: boolean, onClose: () => void, initialTab?: "timeline" | "collaboration") => React.ReactNode;
  rightAttributesDockActive: boolean;
  rightCollaborationDockActive: boolean;
  rightDiagnosticsDockActive: boolean;
  rightDrawDockActive: boolean;
  rightMeasureDockActive: boolean;
  rightPerformanceDockActive: boolean;
  rightProblemsDockActive: boolean;
  rightScientificQADockActive: boolean;
  rightSelectionDockActive: boolean;
  rightTasksDockActive: boolean;
  rightTimelineDockActive: boolean;
  scientificQA: React.ComponentProps<typeof ScientificQAPanel>["qaState"];
  selectedFeatureCount: number;
  selectedFeatureId: React.ComponentProps<typeof MapDrawingManager>["selectedFeatureId"];
  selectedFeatureIds: React.ComponentProps<typeof MapSelectionTools>["selectedFeatureIds"];
  selectionDragTool: SelectionDragTool | null;
  selectionStatsSummary: SelectionStatisticsSummary[] | null;
  setActiveAnalysisResultLayers: React.ComponentProps<typeof MapSelectionTools>["onSetActiveAnalysisResultLayers"];
  setAttributeTableLayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setDrawSeed: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapDrawingManager>["seedDrawStart"]>>;
  setMeasureUnit: React.ComponentProps<typeof MapMeasurementTool>["onSetMeasureUnit"];
  setMeasurementSeed: React.Dispatch<React.SetStateAction<React.ComponentProps<typeof MapMeasurementTool>["seedMeasurementStart"]>>;
  setSelectedFeatureId: React.ComponentProps<typeof MapDrawingManager>["onSelectFeature"];
  setSelectionDragTool: React.Dispatch<React.SetStateAction<SelectionDragTool | null>>;
  setSelectionStatsSummary: React.Dispatch<React.SetStateAction<SelectionStatisticsSummary[] | null>>;
  updateDrawnFeature: React.ComponentProps<typeof MapDrawingManager>["onUpdateFeature"];
  openRightDockPanel: (panel: "attributes", announcement: string, source: "panel-tab", detail?: string) => void;
}

export const MapRightDockBodyContent: React.FC<MapRightDockBodyContentProps> = ({
  activeDrawTool,
  activeMeasureTool,
  activeRightDockPanel,
  addDrawnFeature,
  addMeasurement,
  announce,
  attributeTableLayerId,
  bottomPanelTasks,
  bottomProblemsModel,
  clearDrawnFeatures,
  clearMeasurements,
  drawingSnapSources,
  drawnFeatures,
  handleAttributeTableSelection,
  handleBottomProblemAction,
  handleCancelDraw,
  handleCancelMeasure,
  handleClearSelectedFeatures,
  handleCloseRightDockHost,
  handleCommitDrawnFeatureEdit,
  handleCreateAttributeDerivedLayer,
  handleFocusAttributeFeature,
  handleFocusLayer,
  handleInspectLayer,
  handleOpenPublishTab,
  handleRepairLayerGeometry,
  handleRetryWorkerJob,
  handleRunSelectionStatistics,
  handleSelectionResult,
  handleSetSelectedFeatures,
  mapRef,
  measureUnit,
  measurementSeed,
  measurements,
  overlayLayers,
  performanceDiagnostics,
  queryableLayers,
  removeDrawnFeature,
  removeMeasurement,
  renderReviewTimeline,
  rightAttributesDockActive,
  rightCollaborationDockActive,
  rightDiagnosticsDockActive,
  rightDrawDockActive,
  rightMeasureDockActive,
  rightPerformanceDockActive,
  rightProblemsDockActive,
  rightScientificQADockActive,
  rightSelectionDockActive,
  rightTasksDockActive,
  rightTimelineDockActive,
  scientificQA,
  selectedFeatureCount,
  selectedFeatureId,
  selectedFeatureIds,
  selectionDragTool,
  selectionStatsSummary,
  setActiveAnalysisResultLayers,
  setAttributeTableLayerId,
  setDrawSeed,
  setMeasureUnit,
  setMeasurementSeed,
  setSelectedFeatureId,
  setSelectionDragTool,
  setSelectionStatsSummary,
  updateDrawnFeature,
  openRightDockPanel,
}) => {
  if (rightAttributesDockActive) {
    return (
      <div data-testid="map-right-dock-attributes-body" style={{ height: "100%", minHeight: 0 }}>
        <MapAttributeWorkflowPanel
          layers={overlayLayers}
          activeLayerId={attributeTableLayerId}
          selectedFeatureIds={selectedFeatureIds}
          onActiveLayerChange={setAttributeTableLayerId}
          onSelectFeatures={handleAttributeTableSelection}
          onFocusFeature={handleFocusAttributeFeature}
          onCreateDerivedLayer={handleCreateAttributeDerivedLayer}
          onClose={() => {
            setAttributeTableLayerId(null);
            handleCloseRightDockHost();
            announce("Attribute workflow closed");
          }}
          onAnnounce={announce}
        />
      </div>
    );
  }

  if (rightSelectionDockActive) {
    const selectedLayerEntries = Object.entries(selectedFeatureIds).filter(([, featureIds]) => featureIds.length > 0);
    const selectionStatsCount = selectionStatsSummary?.reduce(
      (total, summary) => total + summary.selectedFeatureCount,
      0,
    ) ?? 0;
    const selectionActionButtonStyle: React.CSSProperties = {
      ...mapStyles.btn,
      minHeight: "1.875rem",
      padding: `0 ${MAP_SPACING.sm}`,
    };
    const selectionActionDisabledStyle: React.CSSProperties = {
      opacity: 0.5,
      cursor: "not-allowed",
    };

    return (
      <MapBottomPanelScrollBody data-testid="map-right-dock-selection-body" padding={0}>
        <MapSelectionTools
          mapRef={mapRef}
          queryableLayers={queryableLayers}
          selectedFeatureIds={selectedFeatureIds}
          activeDragTool={selectionDragTool}
          showModeButtons
          variant="embedded"
          onSetSelectedFeatures={handleSetSelectedFeatures}
          onClearSelectedFeatures={handleClearSelectedFeatures}
          onSetActiveAnalysisResultLayers={setActiveAnalysisResultLayers}
          onAddDrawnFeature={addDrawnFeature}
          onActiveDragToolChange={setSelectionDragTool}
          onSelectionResult={handleSelectionResult}
          onAnnounce={announce}
        />
        <div style={{ display: "grid", gap: MAP_SPACING.md, padding: `${MAP_SPACING.sm} ${MAP_SPACING.md} ${MAP_SPACING.md}` }}>
          <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
            <div style={{ display: "grid", gap: "0.125rem" }}>
              <span
                style={{
                  color: MAP_COLORS.textMuted,
                  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                  textTransform: "uppercase",
                }}
              >
                Selection detail
              </span>
              <span
                style={{
                  color: MAP_COLORS.text,
                  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
                  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                }}
              >
                {selectedFeatureCount.toLocaleString()} selected feature(s) across {selectedLayerEntries.length.toLocaleString()} layer(s)
              </span>
              <span style={{ color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                Keep selections here, then open layer attributes or compute descriptive statistics without covering the map canvas.
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs }}>
              <button
                type="button"
                style={{
                  ...selectionActionButtonStyle,
                  ...(selectedLayerEntries.length === 0 ? selectionActionDisabledStyle : {}),
                }}
                disabled={selectedLayerEntries.length === 0}
                title={selectedLayerEntries.length === 0 ? "Select one or more features before computing statistics" : "Compute descriptive statistics for the current selection"}
                onClick={handleRunSelectionStatistics}
              >
                Run statistics
              </button>
              {selectionStatsSummary?.length ? (
                <button
                  type="button"
                  style={selectionActionButtonStyle}
                  onClick={() => setSelectionStatsSummary(null)}
                >
                  Hide statistics
                </button>
              ) : null}
            </div>
          </div>
          {selectedLayerEntries.length > 0 ? (
            selectedLayerEntries.map(([layerId, featureIds]) => {
              const layerName = overlayLayers.find((layer) => layer.id === layerId)?.name ?? layerId;
              return (
                <div
                  key={layerId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto auto",
                    gap: MAP_SPACING.sm,
                    minWidth: 0,
                    padding: `${MAP_SPACING.xs} 0`,
                    borderTop: MAP_STROKES.hairlineSubtle,
                    color: MAP_COLORS.textSecondary,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: MAP_COLORS.text }}>{layerName}</span>
                  <span style={{ color: MAP_COLORS.textMuted }}>{featureIds.length.toLocaleString()} selected feature(s)</span>
                  <button
                    type="button"
                    style={selectionActionButtonStyle}
                    onClick={() => {
                      setAttributeTableLayerId(layerId);
                      openRightDockPanel(
                        "attributes",
                        "Selected feature attributes opened in the right dock",
                        "panel-tab",
                        "selection",
                      );
                    }}
                  >
                    Attributes
                  </button>
                </div>
              );
            })
          ) : (
            <GisEmptyState
              title="No selected features"
              description="Use rectangle, lasso, or attribute filters to select queryable features before exporting, focusing, or converting to an AOI."
              compact
            />
          )}
          {selectionStatsSummary?.length ? (
            <div
              data-testid="map-right-dock-selection-stats"
              style={{
                display: "grid",
                gap: MAP_SPACING.sm,
                padding: MAP_SPACING.md,
                border: MAP_STROKES.hairlineSubtle,
                borderRadius: MAP_RADIUS.sm,
                background: "var(--syn-surface-subtle, rgba(15, 23, 42, 0.56))",
              }}
            >
              <div style={{ display: "grid", gap: "0.125rem" }}>
                <span
                  style={{
                    color: MAP_COLORS.textMuted,
                    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
                    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                    textTransform: "uppercase",
                  }}
                >
                  Quick statistics
                </span>
                <span
                  style={{
                    color: MAP_COLORS.text,
                    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
                    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
                  }}
                >
                  {selectionStatsCount.toLocaleString()} feature(s) summarized
                </span>
              </div>
              {selectionStatsSummary.map((summary) => (
                <div
                  key={summary.layerId}
                  style={{
                    display: "grid",
                    gap: MAP_SPACING.xs,
                    paddingTop: MAP_SPACING.sm,
                    borderTop: MAP_STROKES.hairlineSubtle,
                  }}
                >
                  <div style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                    {summary.layerName} · {summary.selectedFeatureCount.toLocaleString()} selected
                  </div>
                  {summary.numericFields.length === 0 ? (
                    <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      Missing prerequisite: selected features need numeric attributes before summary statistics can be computed.
                    </span>
                  ) : summary.numericFields.slice(0, 4).map((field) => (
                    <div key={field.field} style={{ display: "grid", gap: "0.125rem", color: MAP_COLORS.textSecondary, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>
                      <strong style={{ color: MAP_COLORS.interaction, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>{field.field}</strong>
                      <span>min {field.min.toFixed(2)} · max {field.max.toFixed(2)} · mean {field.mean.toFixed(2)} · median {field.median.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </MapBottomPanelScrollBody>
    );
  }

  if (rightTimelineDockActive || rightCollaborationDockActive) {
    return (
      <div
        data-testid={rightCollaborationDockActive ? "map-right-dock-collaboration-body" : "map-right-dock-timeline-body"}
        style={{ height: "100%", minHeight: 0 }}
      >
        {renderReviewTimeline(
          true,
          handleCloseRightDockHost,
          rightCollaborationDockActive ? "collaboration" : "timeline",
        )}
      </div>
    );
  }

  if (rightTasksDockActive) {
    return <MapBottomPanelTasksBody tasks={bottomPanelTasks} />;
  }

  if (rightMeasureDockActive) {
    return (
      <div data-testid="map-right-dock-measure-body" style={{ height: "100%", minHeight: 0 }}>
        <MapMeasurementTool
          mapRef={mapRef}
          activeMeasureTool={activeMeasureTool}
          presentation="embedded"
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
      </div>
    );
  }

  if (rightProblemsDockActive) {
    return (
      <MapBottomPanelScrollBody data-testid="map-right-dock-problems-body" padding={12}>
        <MapProblemsPanel model={bottomProblemsModel} compact onProblemAction={handleBottomProblemAction} />
      </MapBottomPanelScrollBody>
    );
  }

  if (rightScientificQADockActive) {
    return (
      <ScientificQAPanel
        visible
        qaState={scientificQA}
        overlayLayers={overlayLayers}
        presentation="embedded"
        onClose={handleCloseRightDockHost}
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
    );
  }

  if (rightDiagnosticsDockActive || rightPerformanceDockActive) {
    const diagnosticsPanelTestId = rightPerformanceDockActive
      ? "map-right-dock-performance-body"
      : "map-right-dock-diagnostics-body";
    return (
      <div data-testid={diagnosticsPanelTestId} style={{ height: "100%", minHeight: 0 }}>
        <MapPanelErrorBoundary
          panelName={rightPerformanceDockActive ? "Performance diagnostics" : "Render diagnostics"}
          resetKey={activeRightDockPanel ?? "diagnostics"}
          onClose={handleCloseRightDockHost}
        >
          <MapPerformanceDiagnosticsPanel
            visible
            presentation="embedded"
            diagnostics={performanceDiagnostics}
            onRetryWorkerJob={handleRetryWorkerJob}
            onClose={handleCloseRightDockHost}
          />
        </MapPanelErrorBoundary>
      </div>
    );
  }

  if (rightDrawDockActive) {
    return (
      <MapDrawingManager
        mapRef={mapRef}
        activeDrawTool={activeDrawTool}
        presentation="embedded"
        sidebarVisible
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
    );
  }

  return null;
};
