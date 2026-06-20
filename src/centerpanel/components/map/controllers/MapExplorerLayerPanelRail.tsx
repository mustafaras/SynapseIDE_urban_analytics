import React from "react";

import {
  MapPanelRail,
  type MapPanelRailSide,
} from "../MapWorkspaceShell";
import { MapWorkbenchSidebar } from "../sidebar";
import { MapDockPanelFrame } from "../shell";
import {
  MapAnalyzeWorkspace,
} from "../analyze";
import {
  MapStyleWorkspace,
} from "../style";
import {
  MapSceneWorkspace,
} from "../scene";
import {
  MapPublishWorkspace,
} from "../publish";
import {
  MAP_LAYER_PANEL_MAX_WIDTH,
  MAP_LAYER_PANEL_MIN_WIDTH,
} from "../mapDocking";
import type { MapActivityId } from "../mapActivityRuntime";

interface MapExplorerLayerPanelRailProps {
  activeActivityId: MapActivityId;
  activeActivityLabel: string;
  /** Which screen edge this dock attaches to. The current workbench keeps
   *  workspace content on the left edge so the right edge stays contextual. */
  side?: MapPanelRailSide;
  analyzeDataOperationsElement: React.ReactNode;
  analyzeModelsElement: React.ReactNode;
  analyzeQueryElement: React.ReactNode;
  analyzeStatisticsElement: React.ReactNode;
  analyzeToolsElement: React.ReactNode;
  analyzeWorkflowElement: React.ReactNode;
  announce: (message: string) => void;
  collapsed: boolean;
  dataExportElement: React.ReactNode;
  dockLayerPanelPlacement: string | null;
  figureElement: React.ReactNode;
  focusActiveActivityButton: () => void;
  isWorkbenchActivity: boolean;
  layerCount: number;
  crsWarningCount: number;
  layerPanelWidth: number;
  layerStackElement: React.ReactNode;
  legendRef: React.Ref<HTMLDivElement>;
  massingElement: React.ReactNode;
  offlinePackageElement: React.ReactNode;
  onLayerPanelWidthChange: (width: number) => void;
  onPublishTabChange: React.ComponentProps<typeof MapPublishWorkspace>["onTabChange"];
  onSceneTabChange: React.ComponentProps<typeof MapSceneWorkspace>["onTabChange"];
  publishReadinessItems: React.ComponentProps<typeof MapPublishWorkspace>["readinessItems"];
  reportElement: React.ReactNode;
  reviewPackageElement: React.ReactNode;
  scene3DElement: React.ReactNode;
  sceneRasterElement: React.ReactNode;
  sceneStatusChips: React.ComponentProps<typeof MapSceneWorkspace>["statusChips"];
  sceneSunShadowElement: React.ReactNode;
  sceneTemporalElement: React.ReactNode;
  sceneVoxCityElement: React.ReactNode;
  sceneZoningElement: React.ReactNode;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFigureComposer: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLayerPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowVoxCityOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  clearWorkflowPreview: () => void;
  styleAdvisorElement: React.ReactNode;
  styleLabelsElement: React.ReactNode;
  styleLegendElement: React.ReactNode;
  styleRendererElement: React.ReactNode;
  styleSymbolsElement: React.ReactNode;
  workbenchSidebarTab: string;
  workbenchSidebarTabs: React.ComponentProps<typeof MapWorkbenchSidebar>["tabs"];
  onWorkbenchSidebarTabChange: (id: string) => void;
}

export const MapExplorerLayerPanelRail: React.FC<MapExplorerLayerPanelRailProps> = ({
  activeActivityId,
  activeActivityLabel,
  side = "left",
  analyzeDataOperationsElement,
  analyzeModelsElement,
  analyzeQueryElement,
  analyzeStatisticsElement,
  analyzeToolsElement,
  analyzeWorkflowElement,
  announce,
  collapsed,
  dataExportElement,
  dockLayerPanelPlacement,
  figureElement,
  focusActiveActivityButton,
  isWorkbenchActivity,
  layerCount,
  crsWarningCount,
  layerPanelWidth,
  layerStackElement,
  legendRef,
  massingElement,
  offlinePackageElement,
  onLayerPanelWidthChange,
  onPublishTabChange,
  onSceneTabChange,
  publishReadinessItems,
  reportElement,
  reviewPackageElement,
  scene3DElement,
  sceneRasterElement,
  sceneStatusChips,
  sceneSunShadowElement,
  sceneTemporalElement,
  sceneVoxCityElement,
  sceneZoningElement,
  setCollapsed,
  setShowFigureComposer,
  setShowLayerPanel,
  setShowVoxCityOverlay,
  clearWorkflowPreview,
  styleAdvisorElement,
  styleLabelsElement,
  styleLegendElement,
  styleRendererElement,
  styleSymbolsElement,
  workbenchSidebarTab,
  workbenchSidebarTabs,
  onWorkbenchSidebarTabChange,
}) => {
  const activeWorkspaceName =
    workbenchSidebarTabs.find((tab) => tab.id === workbenchSidebarTab)?.label ?? activeActivityLabel;
  const activeContextSummaryItem = (() => {
    if (activeActivityId === "publish") {
      const blocked = publishReadinessItems.filter((item) => item.status === "blocked").length;
      return {
        id: "workspace",
        label: "Publish",
        value: blocked > 0 ? `${blocked} blocked` : `${publishReadinessItems.length} checks`,
        title: blocked > 0
          ? `${blocked} publish readiness check${blocked === 1 ? "" : "s"} blocked`
          : `${publishReadinessItems.length} publish readiness check${publishReadinessItems.length === 1 ? "" : "s"} available`,
      };
    }
    if (activeActivityId === "scene") {
      return {
        id: "workspace",
        label: "Scene",
        value: `${sceneStatusChips.length} signal${sceneStatusChips.length === 1 ? "" : "s"}`,
        title: `${activeWorkspaceName} scene workspace with ${sceneStatusChips.length} status signal${sceneStatusChips.length === 1 ? "" : "s"}`,
      };
    }
    if (activeActivityId === "analyze") {
      return {
        id: "workspace",
        label: "Analyze",
        value: activeWorkspaceName,
        title: `Active analysis workspace: ${activeWorkspaceName}`,
      };
    }
    if (activeActivityId === "style") {
      return {
        id: "workspace",
        label: "Style",
        value: activeWorkspaceName,
        title: `Active cartography workspace: ${activeWorkspaceName}`,
      };
    }
    return {
      id: "workspace",
      label: "Workspace",
      value: activeWorkspaceName,
      title: `Active left workspace: ${activeWorkspaceName}`,
    };
  })();
  const dockSummaryItems = [
    activeContextSummaryItem,
    {
      id: "layers",
      label: "Layers",
      value: layerCount.toLocaleString(),
      title: `${layerCount.toLocaleString()} layer${layerCount === 1 ? "" : "s"} in the map stack`,
    },
    {
      id: "crs",
      label: "CRS",
      value: `${crsWarningCount.toLocaleString()} warning${crsWarningCount === 1 ? "" : "s"}`,
      title: `${crsWarningCount.toLocaleString()} layer${crsWarningCount === 1 ? "" : "s"} require CRS review`,
    },
  ];
  const leftDockTitle = activeActivityId === "layers" ? "Layers/Data" : activeActivityLabel;

  return (
    <MapPanelRail
      ref={legendRef}
      side={side}
      width={layerPanelWidth}
      minWidth={MAP_LAYER_PANEL_MIN_WIDTH}
      maxWidth={MAP_LAYER_PANEL_MAX_WIDTH}
      resizable={side === "right" || dockLayerPanelPlacement === "left"}
      onWidthChange={onLayerPanelWidthChange}
      ariaLabel={side === "right" ? "Workspace panel" : "Workspace and layer panel"}
      data-ui-proof={side === "right" ? "real-workspace-dock" : "real-left-dock"}
      data-testid="map-layer-panel-rail"
      data-map-panel-side={side}
    >
      {isWorkbenchActivity ? (
      activeActivityId === "analyze" ? (
        <MapAnalyzeWorkspace
          activeTabId={workbenchSidebarTab}
          onTabChange={onWorkbenchSidebarTabChange}
          workflows={analyzeWorkflowElement}
          tools={analyzeToolsElement}
          query={analyzeQueryElement}
          models={analyzeModelsElement}
          statistics={analyzeStatisticsElement}
          dataOperations={analyzeDataOperationsElement}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
          onClose={() => {
            setShowLayerPanel(false);
            clearWorkflowPreview();
            announce("Analyze workspace closed");
            focusActiveActivityButton();
          }}
          width="100%"
        />
      ) : activeActivityId === "style" ? (
        <MapStyleWorkspace
          activeTabId={workbenchSidebarTab}
          onTabChange={onWorkbenchSidebarTabChange}
          renderer={styleRendererElement}
          symbols={styleSymbolsElement}
          labels={styleLabelsElement}
          legend={styleLegendElement}
          advisor={styleAdvisorElement}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
          onClose={() => {
            setShowLayerPanel(false);
            announce("Style workspace closed");
            focusActiveActivityButton();
          }}
          width="100%"
        />
      ) : activeActivityId === "scene" ? (
        <MapSceneWorkspace
          activeTabId={workbenchSidebarTab}
          onTabChange={onSceneTabChange}
          statusChips={sceneStatusChips}
          raster={sceneRasterElement}
          temporal={sceneTemporalElement}
          scene3d={scene3DElement}
          zoning={sceneZoningElement}
          massing={massingElement}
          sunShadow={sceneSunShadowElement}
          voxCity={sceneVoxCityElement}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
          onClose={() => {
            setShowLayerPanel(false);
            setShowVoxCityOverlay(false);
            announce("Scene workspace closed");
            focusActiveActivityButton();
          }}
          width="100%"
        />
      ) : activeActivityId === "publish" ? (
        <MapPublishWorkspace
          activeTabId={workbenchSidebarTab}
          onTabChange={onPublishTabChange}
          readinessItems={publishReadinessItems}
          figure={figureElement}
          dataExport={dataExportElement}
          report={reportElement}
          offlinePackage={offlinePackageElement}
          reviewPackage={reviewPackageElement}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
          onClose={() => {
            setShowLayerPanel(false);
            setShowFigureComposer(false);
            announce("Publish workspace closed");
            focusActiveActivityButton();
          }}
          width="100%"
        />
      ) : (
        <MapWorkbenchSidebar
          title={leftDockTitle}
          subtitle="Layer/Data workspace"
          summaryItems={dockSummaryItems}
          tabs={workbenchSidebarTabs}
          activeTabId={workbenchSidebarTab}
          onTabChange={onWorkbenchSidebarTabChange}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
          onClose={() => {
            setShowLayerPanel(false);
            announce("Workbench sidebar closed");
            focusActiveActivityButton();
          }}
          width="100%"
        />
      )
    ) : (
      <MapDockPanelFrame
        title="Layers/Data"
        subtitle="Layer/Data workspace"
        activeWorkspaceName="Layers"
        summaryItems={dockSummaryItems}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onClose={() => {
          setShowLayerPanel(false);
          announce("Layer panel closed");
          focusActiveActivityButton();
        }}
        collapseLabel="Collapse layer and data panel"
        closeLabel="Close layer and data panel"
        bodyStyle={{ display: "flex", minHeight: 0 }}
      >
        {layerStackElement}
      </MapDockPanelFrame>
    )}
    </MapPanelRail>
  );
};
