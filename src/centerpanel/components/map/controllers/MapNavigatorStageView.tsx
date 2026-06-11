import React from "react";

import { MapStartDialog } from "../MapStartDialog";
import { MapWorkspaceCockpit } from "../MapWorkspaceCockpit";
import { MAP_DIMENSIONS, MAP_SPACING, mapStyles } from "../mapTokens";
import {
  MAP_NAVIGATOR_STAGE_BOTTOM,
  MAP_NAVIGATOR_STAGE_TOP,
} from "./mapExplorerRuntimeShellUi";

interface MapNavigatorStageViewProps {
  activeAoiLabel: string | null;
  analysisRecommendations: React.ComponentProps<typeof MapWorkspaceCockpit>["analysisRecommendations"];
  contextSummary: React.ComponentProps<typeof MapWorkspaceCockpit>["contextSummary"];
  drawnFeatureCount: number;
  lastSavedAt: string | null;
  measurementCount: number;
  navigatorLeftInset: number;
  navigatorRightInset: number;
  onAddDemoPack: React.ComponentProps<typeof MapStartDialog>["onAddDemoPack"];
  onAnalysisRecommendationAction: React.ComponentProps<typeof MapWorkspaceCockpit>["onAnalysisRecommendationAction"];
  onClose: React.ComponentProps<typeof MapStartDialog>["onClose"];
  onContinue: React.ComponentProps<typeof MapStartDialog>["onContinue"];
  onImport: React.ComponentProps<typeof MapStartDialog>["onImport"];
  onOpenProject: React.ComponentProps<typeof MapStartDialog>["onOpenProject"];
  onOpenSourceHealth: React.ComponentProps<typeof MapStartDialog>["onOpenSourceHealth"];
  onQuickAction: React.ComponentProps<typeof MapWorkspaceCockpit>["onQuickAction"];
  onSelectView: React.ComponentProps<typeof MapWorkspaceCockpit>["onSelectView"];
  overlayLayers: React.ComponentProps<typeof MapWorkspaceCockpit>["overlayLayers"];
  pinCount: number;
  qaBlockerCount: number;
  qaIssueCount: number;
  reason: React.ComponentProps<typeof MapStartDialog>["reason"];
  selectedProjectId: string | null;
  startDialogOpen: boolean;
  syncStatus: React.ComponentProps<typeof MapWorkspaceCockpit>["syncStatus"];
  viewportSyncEnabled: boolean;
  visible: boolean;
  visiblePublicationLayerCount: number;
  workflowReadyCount: number;
  workspaceView: React.ComponentProps<typeof MapWorkspaceCockpit>["workspaceView"];
}

export const MapNavigatorStageView: React.FC<MapNavigatorStageViewProps> = ({
  activeAoiLabel,
  analysisRecommendations,
  contextSummary,
  drawnFeatureCount,
  lastSavedAt,
  measurementCount,
  navigatorLeftInset,
  navigatorRightInset,
  onAddDemoPack,
  onAnalysisRecommendationAction,
  onClose,
  onContinue,
  onImport,
  onOpenProject,
  onOpenSourceHealth,
  onQuickAction,
  onSelectView,
  overlayLayers,
  pinCount,
  qaBlockerCount,
  qaIssueCount,
  reason,
  selectedProjectId,
  startDialogOpen,
  syncStatus,
  viewportSyncEnabled,
  visible,
  visiblePublicationLayerCount,
  workflowReadyCount,
  workspaceView,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      data-map-start-dialog-state={startDialogOpen ? "open" : "closed"}
      data-map-start-dialog-reason={reason ?? undefined}
      style={{
        ...mapStyles.navigatorStage,
        top: MAP_NAVIGATOR_STAGE_TOP,
        left: navigatorLeftInset,
        right: navigatorRightInset,
        bottom: MAP_NAVIGATOR_STAGE_BOTTOM,
      }}
    >
      {startDialogOpen ? (
        <MapStartDialog
          reason={reason}
          selectedProjectId={selectedProjectId}
          lastSavedAt={lastSavedAt}
          overlayLayers={overlayLayers}
          contextSummary={contextSummary}
          pinCount={pinCount}
          drawnFeatureCount={drawnFeatureCount}
          measurementCount={measurementCount}
          activeAoiLabel={activeAoiLabel}
          qaIssueCount={qaIssueCount}
          qaBlockerCount={qaBlockerCount}
          onImport={onImport}
          onOpenProject={onOpenProject}
          onAddDemoPack={onAddDemoPack}
          onContinue={onContinue}
          onClose={onClose}
          onOpenSourceHealth={onOpenSourceHealth}
        />
      ) : (
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
            onSelectView={onSelectView}
            onQuickAction={onQuickAction}
            contextSummary={contextSummary}
            overlayLayers={overlayLayers}
            pinCount={pinCount}
            drawnFeatureCount={drawnFeatureCount}
            measurementCount={measurementCount}
            selectedProjectId={selectedProjectId}
            lastSavedAt={lastSavedAt}
            activeAoiLabel={activeAoiLabel}
            qaIssueCount={qaIssueCount}
            qaBlockerCount={qaBlockerCount}
            workflowReadyCount={workflowReadyCount}
            visiblePublicationLayerCount={visiblePublicationLayerCount}
            viewportSyncEnabled={viewportSyncEnabled}
            syncStatus={syncStatus}
            analysisRecommendations={analysisRecommendations}
            onAnalysisRecommendationAction={onAnalysisRecommendationAction}
          />
        </div>
      )}
    </div>
  );
};
