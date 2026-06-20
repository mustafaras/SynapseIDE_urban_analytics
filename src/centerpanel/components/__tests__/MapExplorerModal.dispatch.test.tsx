// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import type { OverlayLayerConfig } from "../map/mapTypes";
import { createMapWorkflowResultEvidenceArtifact } from "../map/mapEvidenceArtifacts";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

const executeHotSpotSpatialStatsAsyncMock = vi.fn();

vi.mock("@/ui/toast/api", () => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

vi.mock("../map/useFocusTrap", () => ({
  useFocusTrap: () => ({ trapRef: { current: null }, activate: vi.fn() }),
}));

vi.mock("../map/useAnnouncer", () => ({
  useAnnouncer: () => ({ announce: vi.fn(), AnnouncerRegion: () => null }),
}));

vi.mock("../map/useMapKeyboardControls", () => ({
  useMapKeyboardControls: () => undefined,
}));

vi.mock("../map/useLayerSync", () => ({
  useLayerSync: () => undefined,
}));

vi.mock("../registry/state", () => ({
  useProjectRegistryOptional: () => null,
}));

vi.mock("../map/MapWorkspaceShell", () => ({
  MapWorkspaceShell: ({ children }: { children: React.ReactNode }) => <div data-map-explorer-shell="true">{children}</div>,
  MapActivityRail: () => <nav data-testid="map-activity-rail" aria-label="Map Explorer activity" />,
  MapCanvasRegion: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    return <div {...props} ref={ref} data-testid="map-canvas-region" />;
  }),
  MapPanelRail: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    ariaLabel?: string;
    children: React.ReactNode;
    height?: number | string;
    maxWidth?: number;
    minWidth?: number;
    onWidthChange?: (width: number) => void;
    resizable?: boolean;
    side?: string;
    width?: number | string;
  }>(({ ariaLabel, children, height, maxWidth, minWidth, onWidthChange, resizable, side, width, ...props }, ref) => {
    void height;
    void maxWidth;
    void minWidth;
    void onWidthChange;
    void resizable;
    void width;
    return <div {...props} ref={ref} aria-label={ariaLabel} data-map-panel-rail={side} data-testid="map-layer-panel-rail">{children}</div>;
  }),
  MapBottomTimeline: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-bottom-timeline">{children}</div>,
}));

vi.mock("../map/MapCanvas", () => ({
  MapCanvas: ({ onMapDestroy, onMapReady }: {
    onMapDestroy: () => void;
    onMapReady: (map: {
      boxZoom: { enable: () => void };
      doubleClickZoom: { enable: () => void };
      dragPan: { enable: () => void };
      easeTo: () => void;
      fitBounds: () => void;
      getBounds: () => { getEast: () => number; getNorth: () => number; getSouth: () => number; getWest: () => number };
      getBearing: () => number;
      getCenter: () => { lat: number; lng: number };
      getContainer: () => { getBoundingClientRect: () => DOMRect };
      getPitch: () => number;
      getZoom: () => number;
      keyboard: { enable: () => void };
      off: () => void;
      on: () => void;
      scrollZoom: { enable: () => void };
      touchZoomRotate: { enable: () => void };
    }) => void;
  }) => {
    React.useEffect(() => {
      onMapReady({
        boxZoom: { enable: () => undefined },
        doubleClickZoom: { enable: () => undefined },
        dragPan: { enable: () => undefined },
        easeTo: () => undefined,
        fitBounds: () => undefined,
        getBounds: () => ({
          getEast: () => 28.98,
          getNorth: () => 41.03,
          getSouth: () => 40.99,
          getWest: () => 28.94,
        }),
        getBearing: () => 0,
        getCenter: () => ({ lat: 41.01, lng: 28.96 }),
        getContainer: () => ({ getBoundingClientRect: () => new DOMRect(0, 0, 1024, 768) }),
        getPitch: () => 0,
        getZoom: () => 12,
        keyboard: { enable: () => undefined },
        off: () => undefined,
        on: () => undefined,
        scrollZoom: { enable: () => undefined },
        touchZoomRotate: { enable: () => undefined },
      });
      return onMapDestroy;
    }, [onMapDestroy, onMapReady]);

    return <div data-testid="map-canvas" />;
  },
}));
vi.mock("../map/MapToolbar", () => ({
  MapToolbar: ({
    onExportClick,
    onImageExportClick,
    onImportClick,
    onSetDrawTool,
    onSetMeasureTool,
    onToggleReviewTimeline,
  }: {
    onExportClick?: () => void;
    onImageExportClick?: () => void;
    onImportClick?: () => void;
    onSetDrawTool?: (tool: "polygon" | null) => void;
    onSetMeasureTool?: (tool: "measure-distance" | null) => void;
    onToggleReviewTimeline?: () => void;
  }) => (
    <div data-testid="map-toolbar">
      <button type="button" data-testid="toolbar-import" onClick={onImportClick}>
        Import
      </button>
      <button type="button" data-testid="toolbar-data-export" onClick={onExportClick}>
        Data export
      </button>
      <button type="button" data-testid="toolbar-image-export" onClick={onImageExportClick}>
        Image export
      </button>
      <button type="button" data-testid="toolbar-draw-polygon" onClick={() => onSetDrawTool?.("polygon")}>
        Draw polygon
      </button>
      <button type="button" data-testid="toolbar-measure-distance" onClick={() => onSetMeasureTool?.("measure-distance")}>
        Measure distance
      </button>
      <button type="button" data-testid="toolbar-review-timeline" onClick={onToggleReviewTimeline}>
        Review timeline
      </button>
    </div>
  ),
}));
vi.mock("../map/MapLayerPanel", () => ({ MapLayerPanel: () => null }));
vi.mock("../map/MapLayerManager", () => ({
  MapLayerManager: () => null,
  MapLayerSourcesPanel: () => null,
  MapLayerCartographyPanel: () => null,
  MapLayerBookmarksPanel: () => null,
}));
vi.mock("../MapDrawingManager", () => ({ MapDrawingManager: () => null }));
vi.mock("../MapMeasurementTool", () => ({ MapMeasurementTool: () => null }));
vi.mock("../MapChoroplethLayer", () => ({ MapChoroplethLayer: () => null }));
vi.mock("../MapClusterViz", () => ({ MapClusterViz: () => null }));
vi.mock("../MapEmergingHotSpotViz", () => ({ MapEmergingHotSpotViz: () => null }));
vi.mock("../MapHeatmapLayer", () => ({ MapHeatmapLayer: () => null }));
vi.mock("../MapHotSpotViz", () => ({ MapHotSpotViz: () => null }));
vi.mock("../MapSymbolLayer", () => ({ MapSymbolLayer: () => null }));
vi.mock("../MapTemporalPlayer", () => ({ MapTemporalPlayer: () => null }));
vi.mock("../MapAnnotationLayer", () => ({ MapAnnotationLayer: () => null }));
vi.mock("../MapDataExportDialog", () => ({
  MapDataExportDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <section data-testid="data-export-dialog">
        <button type="button" data-testid="data-export-close" onClick={onClose}>
          Close data export
        </button>
      </section>
    ) : null,
}));
vi.mock("../MapExportDialog", () => ({
  MapExportDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <section data-testid="image-export-dialog">
        <button type="button" data-testid="image-export-close" onClick={onClose}>
          Close image export
        </button>
      </section>
    ) : null,
}));
vi.mock("../MapCsvImportDialog", () => ({ MapCsvImportDialog: () => null }));
vi.mock("../MapColumnarImportDialog", () => ({ MapColumnarImportDialog: () => null }));
vi.mock("../MapDataImportHubDialog", () => ({
  MapDataImportHubDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <section data-testid="import-hub-dialog">
        <button type="button" data-testid="import-hub-close" onClick={onClose}>
          Close import
        </button>
      </section>
    ) : null,
}));
vi.mock("../map/MapRightDockHost", () => ({
  MapRightDockHost: ({
    children,
    onClose,
    route,
  }: {
    children?: React.ReactNode;
    onClose?: () => void;
    route: { panel: string };
  }) => (
    <aside data-testid="map-right-dock-host" data-active-panel={route.panel}>
      <button type="button" data-testid="right-dock-close" onClick={onClose}>
        Close dock
      </button>
      {children}
    </aside>
  ),
}));
vi.mock("../map/MapSearchBar", () => ({ MapSearchBar: () => null }));
vi.mock("../map/MapStatusBar", () => ({ MapStatusBar: () => null }));
vi.mock("../map/MapPinSidebar", () => ({ MapPinSidebar: () => null }));
vi.mock("../map/MapWorkspaceCockpit", () => ({ MapWorkspaceCockpit: () => null }));

vi.mock("../MapContextMenu", () => ({
  MapContextMenu: ({ onHotSpotAroundHere }: { onHotSpotAroundHere?: (coord: { lng: number; lat: number }) => void }) => (
    <button
      type="button"
      data-testid="dispatch-hotspot"
      onClick={() => onHotSpotAroundHere?.({ lng: 28.955, lat: 41.01 })}
    >
      Quick hotspot
    </button>
  ),
}));

vi.mock("@/services/map/SpatialStatsExecutionQueue", () => ({
  executeHotSpotSpatialStatsAsync: (...args: unknown[]) => executeHotSpotSpatialStatsAsyncMock(...args),
}));

import { MapExplorerModal } from "../MapExplorerModal";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function buildSourceLayer(): OverlayLayerConfig {
  return {
    id: "dispatch-source-layer",
    name: "Dispatch Source Districts",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "district-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.95, 41.0], [28.96, 41.0], [28.96, 41.02], [28.95, 41.02], [28.95, 41.0]]],
          },
          properties: {
            value: 42,
          },
        },
      ],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 1,
      fields: ["value"],
    },
    queryable: true,
  };
}

function buildResultLayer(): OverlayLayerConfig {
  return {
    id: "hotspot-result-layer",
    name: "Quick Hot Spot Result",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "analysis",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "district-1",
          geometry: {
            type: "Polygon",
            coordinates: [[[28.95, 41.0], [28.96, 41.0], [28.96, 41.02], [28.95, 41.02], [28.95, 41.0]]],
          },
          properties: {
            gi_star: 2.1,
            z_score: 2.3,
            p_value: 0.02,
            confidence_level: "hot_95",
          },
        },
      ],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 1,
      fields: ["gi_star", "z_score", "p_value", "confidence_level"],
      analysisResult: {
        engine: "GetisOrdGi",
        runTimestamp: new Date().toISOString(),
        parameterSummary: "Quick hotspot dispatch",
        inputParameters: { valueField: "value" },
        statisticalSummary: {},
        visualization: {
          kind: "hotspot",
          field: "value",
          classificationMethod: "categorical",
        },
      },
    },
    queryable: true,
    sourceKind: "derived",
  };
}

function mountModal() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

async function waitFor(check: () => void, timeoutMs = 4000): Promise<void> {
  const startedAt = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - startedAt > timeoutMs) {
        throw error;
      }
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
    }
  }
}

beforeEach(() => {
  useFlowStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useMapExplorerStore.setState({
    overlayLayers: [buildSourceLayer()],
    currentMapBounds: [28.94, 40.99, 28.98, 41.03],
  });
  executeHotSpotSpatialStatsAsyncMock.mockReset();
  executeHotSpotSpatialStatsAsyncMock.mockReturnValue({
    promise: Promise.resolve({
      adaptedResult: {
        layer: buildResultLayer(),
        visualization: {
          kind: "hotspot",
          field: "value",
          classificationMethod: "categorical",
        },
        evidenceArtifact: createMapWorkflowResultEvidenceArtifact({
          id: "map-evidence-hotspot-result-layer",
          title: "Quick Hot Spot Result",
          workflowId: "quick-hotspot",
          runId: "quick-hotspot-run",
          sourceLayerIds: ["dispatch-source-layer"],
          derivedLayerId: "hotspot-result-layer",
          qa: { state: "valid", issues: [] },
        }),
      },
      summary: {
        hot_99: 0,
        hot_95: 1,
        hot_90: 0,
        not_significant: 0,
        cold_90: 0,
        cold_95: 0,
        cold_99: 0,
      },
      validFeatureCount: 1,
      skippedFeatureCount: 0,
    }),
  });
  document.body.innerHTML = "";
});

describe("MapExplorerModal map dispatch", () => {
  it("opens and closes import and export dialogs from toolbar actions", async () => {
    const { container, root } = mountModal();
    await act(async () => {
      root.render(<MapExplorerModal open onClose={() => undefined} mode="embedded" mapCanvasRef={{ current: null }} />);
    });

    const importButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-import"]');
    expect(importButton).not.toBeNull();
    await act(async () => {
      importButton?.click();
    });
    expect(document.body.querySelector('[data-testid="import-hub-dialog"]')).not.toBeNull();

    const closeImportButton = document.body.querySelector<HTMLButtonElement>('[data-testid="import-hub-close"]');
    expect(closeImportButton).not.toBeNull();
    await act(async () => {
      closeImportButton?.click();
    });
    expect(document.body.querySelector('[data-testid="import-hub-dialog"]')).toBeNull();

    const dataExportButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-data-export"]');
    expect(dataExportButton).not.toBeNull();
    await act(async () => {
      dataExportButton?.click();
    });
    expect(document.body.querySelector('[data-testid="data-export-dialog"]')).not.toBeNull();

    const closeDataExportButton = document.body.querySelector<HTMLButtonElement>('[data-testid="data-export-close"]');
    expect(closeDataExportButton).not.toBeNull();
    await act(async () => {
      closeDataExportButton?.click();
    });
    expect(document.body.querySelector('[data-testid="data-export-dialog"]')).toBeNull();

    const imageExportButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-image-export"]');
    expect(imageExportButton).not.toBeNull();
    await act(async () => {
      imageExportButton?.click();
    });
    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="image-export-dialog"]')).not.toBeNull();
    });

    const closeImageExportButton = document.body.querySelector<HTMLButtonElement>('[data-testid="image-export-close"]');
    expect(closeImageExportButton).not.toBeNull();
    await act(async () => {
      closeImageExportButton?.click();
    });
    expect(document.body.querySelector('[data-testid="image-export-dialog"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  }, 15000);

  it("routes toolbar draw and measurement actions through the canvas tool state", async () => {
    const { container, root } = mountModal();
    await act(async () => {
      root.render(<MapExplorerModal open onClose={() => undefined} mode="embedded" mapCanvasRef={{ current: null }} />);
    });

    const drawButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-draw-polygon"]');
    expect(drawButton).not.toBeNull();
    await act(async () => {
      drawButton?.click();
    });
    await waitFor(() => {
      expect(useMapExplorerStore.getState().activeDrawTool).toBe("polygon");
      expect(useMapExplorerStore.getState().activeMeasureTool).toBeNull();
    });

    const measureButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-measure-distance"]');
    expect(measureButton).not.toBeNull();
    await act(async () => {
      measureButton?.click();
    });
    await waitFor(() => {
      expect(useMapExplorerStore.getState().activeMeasureTool).toBe("measure-distance");
      expect(useMapExplorerStore.getState().activeDrawTool).toBeNull();
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  }, 15000);

  it("opens the review timeline in the right dock from the toolbar", async () => {
    const { container, root } = mountModal();
    await act(async () => {
      root.render(<MapExplorerModal open onClose={() => undefined} mode="embedded" mapCanvasRef={{ current: null }} />);
    });

    expect(document.body.querySelector('[data-testid="map-right-dock-host"]')).toBeNull();

    const timelineButton = document.body.querySelector<HTMLButtonElement>('[data-testid="toolbar-review-timeline"]');
    expect(timelineButton).not.toBeNull();
    await act(async () => {
      timelineButton?.click();
    });

    expect(document.body.querySelector('[data-testid="map-right-dock-host"]')?.getAttribute("data-active-panel")).toBe("timeline");

    await act(async () => {
      document.body.querySelector<HTMLButtonElement>('[data-testid="right-dock-close"]')?.click();
    });
    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="map-right-dock-host"]')).toBeNull();
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  }, 15000);

  it("runs quick hot spot dispatch and publishes the analysis layer", async () => {
    const { container, root } = mountModal();
    await act(async () => {
      root.render(<MapExplorerModal open onClose={() => undefined} mode="embedded" mapCanvasRef={{ current: null }} />);
    });

    const trigger = document.body.querySelector('[data-testid="dispatch-hotspot"]') as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(2);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    const resultLayer = useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === "hotspot-result-layer");
    expect(executeHotSpotSpatialStatsAsyncMock).toHaveBeenCalledTimes(1);
    expect(resultLayer?.metadata?.analysisResult?.engine).toBe("GetisOrdGi");
    expect(useMapExplorerStore.getState().activeAnalysisResultLayerIds).toEqual(["hotspot-result-layer"]);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  }, 15000);
});
