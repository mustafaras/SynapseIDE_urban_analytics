import React from "react";

import {
  MapPanelRail,
} from "../MapWorkspaceShell";
import { MapWorkbenchSidebar, type MapWorkbenchSidebarTab } from "../sidebar";
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
  workbenchSidebarTab: MapWorkbenchSidebarTab;
  workbenchSidebarTabs: React.ComponentProps<typeof MapWorkbenchSidebar>["tabs"];
  onWorkbenchSidebarTabChange: React.Dispatch<React.SetStateAction<MapWorkbenchSidebarTab>>;
}

export const MapExplorerLayerPanelRail: React.FC<MapExplorerLayerPanelRailProps> = ({
  activeActivityId,
  activeActivityLabel,
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
}) => (
  <MapPanelRail
    ref={legendRef}
    side="left"
    width={layerPanelWidth}
    height="min(24rem, 54%)"
    minWidth={MAP_LAYER_PANEL_MIN_WIDTH}
    maxWidth={MAP_LAYER_PANEL_MAX_WIDTH}
    resizable={dockLayerPanelPlacement === "left"}
    onWidthChange={onLayerPanelWidthChange}
    ariaLabel="Layer and data panel"
    data-testid="map-layer-panel-rail"
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
          title={activeActivityLabel}
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
      layerStackElement
    )}
  </MapPanelRail>
);
