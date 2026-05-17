// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type maplibregl from "maplibre-gl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapAnnotationLayer, ANNOTATION_SYMBOL_LAYER_ID } from "../../MapAnnotationLayer";
import { MapBookmarkBar } from "../../MapBookmarkBar";
import { MapToolbar } from "../MapToolbar";
import {
  MAP_ANNOTATION_LIMIT,
  MAP_BOOKMARK_LIMIT,
  type MapAnnotation,
  type MapAnnotationStyleSettings,
  type OverlayLayerConfig,
} from "../mapTypes";
import { useMapExplorerStore } from "../../../../stores/useMapExplorerStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const annotationStyle: MapAnnotationStyleSettings = {
  fontSize: 16,
  color: "#F59E0B",
  bold: true,
  italic: false,
  rotation: 0,
  hasBackground: true,
  leaderLine: true,
};

function resetMapStore(): void {
  useMapExplorerStore.setState({
    center: [29, 41],
    zoom: 10,
    bearing: 0,
    pitch: 0,
    bookmarks: [],
    annotations: [],
    selectedAnnotationId: null,
    annotationToolSettings: annotationStyle,
    overlayLayers: [],
    activeAnalysisResultLayerIds: [],
  });
}

function makeLayer(id: string, visible: boolean): OverlayLayerConfig {
  return {
    id,
    name: id,
    type: "geojson",
    visible,
    opacity: 1,
  };
}

function makeAnnotation(id = "annotation-1"): MapAnnotation {
  return {
    id,
    type: "Feature",
    geometry: { type: "Point", coordinates: [29.1, 41.1] },
    properties: {
      ...annotationStyle,
      text: "Flood risk note",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      leaderTarget: [29, 41],
    },
  };
}

function createMockMap() {
  const sources = new Map<string, Record<string, unknown>>();
  const layers = new Map<string, Record<string, unknown>>();
  const listeners = new Map<string, Array<(event?: maplibregl.MapMouseEvent) => void>>();
  const canvas = { style: {} as Record<string, string> };

  const map = {
    getStyle: vi.fn(() => ({ version: 8 })),
    isStyleLoaded: vi.fn(() => true),
    addSource: vi.fn((id: string, source: Record<string, unknown>) => {
      sources.set(id, {
        ...source,
        setData: vi.fn((data: unknown) => {
          const current = sources.get(id);
          if (current) current.data = data;
        }),
      });
    }),
    getSource: vi.fn((id: string) => sources.get(id)),
    removeSource: vi.fn((id: string) => sources.delete(id)),
    addLayer: vi.fn((layer: Record<string, unknown>) => {
      layers.set(String(layer.id), layer);
    }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    removeLayer: vi.fn((id: string) => layers.delete(id)),
    setFilter: vi.fn(),
    queryRenderedFeatures: vi.fn(() => []),
    getCanvas: vi.fn(() => canvas),
    dragPan: {
      disable: vi.fn(),
      enable: vi.fn(),
    },
    on: vi.fn((type: string, handler: (event?: maplibregl.MapMouseEvent) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), handler]);
    }),
    off: vi.fn((type: string, handler: (event?: maplibregl.MapMouseEvent) => void) => {
      listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== handler));
    }),
  } as unknown as maplibregl.Map;

  return { map, sources, layers };
}

describe("Map bookmarks and annotations store", () => {
  beforeEach(resetMapStore);

  it("saves and restores bookmarks with exact viewport and visible layers", () => {
    useMapExplorerStore.setState({
      overlayLayers: [makeLayer("roads", true), makeLayer("parcels", true), makeLayer("hotspots", false)],
    });

    const bookmark = useMapExplorerStore.getState().addMapBookmark({
      name: "Downtown review",
      center: [29.25, 41.05],
      zoom: 13.75,
      bearing: 22,
      pitch: 38,
      layers: ["roads", "hotspots"],
      activeVisualization: "hotspots",
    });

    expect(bookmark).not.toBeNull();
    const restored = useMapExplorerStore.getState().restoreMapBookmark(bookmark!.id);
    const state = useMapExplorerStore.getState();

    expect(restored?.name).toBe("Downtown review");
    expect(state.center).toEqual([29.25, 41.05]);
    expect(state.zoom).toBe(13.75);
    expect(state.bearing).toBe(22);
    expect(state.pitch).toBe(38);
    expect(state.overlayLayers.map((layer) => [layer.id, layer.visible])).toEqual([
      ["roads", true],
      ["parcels", false],
      ["hotspots", true],
    ]);
    expect(state.activeAnalysisResultLayerIds).toEqual(["hotspots"]);
  });

  it("enforces bookmark and annotation storage caps", () => {
    for (let index = 0; index < MAP_BOOKMARK_LIMIT; index += 1) {
      expect(useMapExplorerStore.getState().addMapBookmark({
        name: `View ${index + 1}`,
        center: [29, 41],
        zoom: 10,
        bearing: 0,
        pitch: 0,
        layers: [],
      })).not.toBeNull();
    }

    expect(useMapExplorerStore.getState().addMapBookmark({
      name: "Overflow",
      center: [29, 41],
      zoom: 10,
      bearing: 0,
      pitch: 0,
      layers: [],
    })).toBeNull();

    for (let index = 0; index < MAP_ANNOTATION_LIMIT; index += 1) {
      expect(useMapExplorerStore.getState().addMapAnnotation({
        coordinate: [29 + index * 0.0001, 41],
        text: `Note ${index + 1}`,
        style: annotationStyle,
      })).not.toBeNull();
    }

    expect(useMapExplorerStore.getState().addMapAnnotation({
      coordinate: [29, 41],
      text: "Overflow note",
      style: annotationStyle,
    })).toBeNull();
  });

  it("stores annotations as GeoJSON points with clamped style properties", () => {
    const annotation = useMapExplorerStore.getState().addMapAnnotation({
      coordinate: [29.2, 41.2],
      text: "Design review label",
      style: {
        ...annotationStyle,
        fontSize: 99,
        rotation: 999,
      },
      leaderTarget: [29.1, 41.1],
    });

    expect(annotation?.type).toBe("Feature");
    expect(annotation?.geometry).toEqual({ type: "Point", coordinates: [29.2, 41.2] });
    expect(annotation?.properties.text).toBe("Design review label");
    expect(annotation?.properties.fontSize).toBe(36);
    expect(annotation?.properties.rotation).toBe(180);
    expect(annotation?.properties.leaderTarget).toEqual([29.1, 41.1]);
  });
});

describe("Map bookmarks and annotations UI surfaces", () => {
  it("renders saved-view chips and annotation toolbar command", () => {
    const bookmarkHtml = renderToStaticMarkup(
      <MapBookmarkBar
        bookmarks={[{
          id: "bookmark-1",
          name: "Downtown",
          center: [29, 41],
          zoom: 12,
          bearing: 0,
          pitch: 0,
          layers: ["roads"],
          timestamp: "2026-04-28T00:00:00.000Z",
        }]}
        maxBookmarks={MAP_BOOKMARK_LIMIT}
        onSaveBookmark={() => undefined}
        onRestoreBookmark={() => undefined}
        onRenameBookmark={() => undefined}
        onDeleteBookmark={() => undefined}
        onShareBookmark={() => undefined}
      />,
    );

    expect(bookmarkHtml).toContain("Saved Views");
    expect(bookmarkHtml).toContain("Downtown");

    const toolbarHtml = renderToStaticMarkup(
      <MapToolbar
        pinMode={false}
        onTogglePinMode={() => undefined}
        showSidebar={false}
        onToggleSidebar={() => undefined}
        pinCount={0}
        annotationMode
        annotationCount={2}
        onToggleAnnotationMode={() => undefined}
      />,
    );

    expect(toolbarHtml).toContain("Toggle text annotation tool");
    expect(toolbarHtml).toContain("Text");
  });

  it("adds a dedicated symbol layer and leader source for annotations", async () => {
    const { map, sources, layers } = createMockMap();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MapAnnotationLayer
          mapRef={{ current: map }}
          active={false}
          annotations={[makeAnnotation()]}
          selectedAnnotationId="annotation-1"
          settings={annotationStyle}
          onAddAnnotation={() => null}
          onUpdateAnnotation={() => undefined}
          onMoveAnnotation={() => undefined}
          onRemoveAnnotation={() => undefined}
          onSelectAnnotation={() => undefined}
          onSettingsChange={() => undefined}
          onDeactivate={() => undefined}
        />,
      );
    });

    expect(layers.get(ANNOTATION_SYMBOL_LAYER_ID)?.type).toBe("symbol");
    expect(sources.get("synapse-map-annotations-src")?.setData).toHaveBeenCalled();
    expect(sources.get("synapse-map-annotation-leaders-src")?.setData).toHaveBeenCalled();
    expect(map.setFilter).toHaveBeenCalledWith(
      "synapse-map-annotations-selected",
      ["==", ["get", "__annotationId"], "annotation-1"],
    );

    await act(async () => {
      root.unmount();
    });
  });
});
