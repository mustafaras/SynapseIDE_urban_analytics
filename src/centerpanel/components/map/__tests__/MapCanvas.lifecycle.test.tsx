// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mapMockState = vi.hoisted(() => {
  return {
    abortPreventDefault: vi.fn(),
    instances: [] as Array<{
      emit: (type: string, event: { error?: unknown; sourceId?: string; status?: number }) => void;
      options?: { preserveDrawingBuffer?: boolean };
      addControl: ReturnType<typeof vi.fn>;
      removeControl: ReturnType<typeof vi.fn>;
    }>,
  };
});

vi.mock("maplibre-gl", () => {
  class MockMap {
    private listeners = new Map<string, Array<(event: { error?: unknown; preventDefault?: () => void }) => void>>();

    constructor(options?: { preserveDrawingBuffer?: boolean }) {
      mapMockState.instances.push({
        options,
        addControl: this.addControl,
        removeControl: this.removeControl,
        emit: (type, event) => {
          for (const handler of this.listeners.get(type) ?? []) {
            handler(event);
          }
        },
      });
    }

    addControl = vi.fn();

    removeControl = vi.fn();

    on = vi.fn((type: string, handler: (event: { error?: unknown; preventDefault?: () => void }) => void) => {
      const handlers = this.listeners.get(type) ?? [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
      return this;
    });

    getLayer = vi.fn(() => null);

    queryRenderedFeatures = vi.fn(() => []);

    getZoom = vi.fn(() => 11);

    getCenter = vi.fn(() => ({ lng: 29, lat: 41 }));

    getBearing = vi.fn(() => 0);

    getPitch = vi.fn(() => 0);

    setStyle = vi.fn();

    remove = vi.fn(() => {
      const errorEvent = {
        error: new DOMException("Aborted", "AbortError"),
        preventDefault: mapMockState.abortPreventDefault,
      };
      for (const handler of this.listeners.get("error") ?? []) {
        handler(errorEvent);
      }
      throw new DOMException("Aborted", "AbortError");
    });
  }

  class MockMarker {
    remove = vi.fn();

    setLngLat = vi.fn(() => this);

    setPopup = vi.fn(() => this);
  }

  class MockPopup {
    remove = vi.fn();

    setLngLat = vi.fn(() => this);

    setHTML = vi.fn(() => this);

    addTo = vi.fn(() => this);
  }

  class MockNavigationControl {}
  class MockScaleControl {
    kind = "scale";
  }
  class MockAttributionControl {
    kind = "attribution";
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      NavigationControl: MockNavigationControl,
      ScaleControl: MockScaleControl,
      AttributionControl: MockAttributionControl,
    },
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockNavigationControl,
    ScaleControl: MockScaleControl,
    AttributionControl: MockAttributionControl,
  };
});

describe("MapCanvas lifecycle", () => {
  afterEach(() => {
    mapMockState.abortPreventDefault.mockReset();
    mapMockState.instances = [];
    document.body.innerHTML = "";
  });

  it("keeps the WebGL drawing buffer disabled by default", async () => {
    const { MapCanvas } = await import("../MapCanvas");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MapCanvas
          baseLayer="dark"
          pinMode={false}
          pins={[]}
          onCursorMove={() => undefined}
          onZoomChange={() => undefined}
          onViewportChange={() => undefined}
          onMapClick={() => undefined}
          onMapReady={() => undefined}
          onMapDestroy={() => undefined}
        />,
      );
    });

    expect(mapMockState.instances[0]?.options?.preserveDrawingBuffer).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it("enables the WebGL drawing buffer for capture mode", async () => {
    const { MapCanvas } = await import("../MapCanvas");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MapCanvas
          baseLayer="dark"
          pinMode={false}
          pins={[]}
          preserveDrawingBuffer
          onCursorMove={() => undefined}
          onZoomChange={() => undefined}
          onViewportChange={() => undefined}
          onMapClick={() => undefined}
          onMapReady={() => undefined}
          onMapDestroy={() => undefined}
        />,
      );
    });

    expect(mapMockState.instances[0]?.options?.preserveDrawingBuffer).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });

  it("toggles the MapLibre scale control without recreating the canvas", async () => {
    const { MapCanvas } = await import("../MapCanvas");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const renderCanvas = (showScaleBar: boolean) => (
      <MapCanvas
        baseLayer="dark"
        pinMode={false}
        pins={[]}
        showScaleBar={showScaleBar}
        onCursorMove={() => undefined}
        onZoomChange={() => undefined}
        onViewportChange={() => undefined}
        onMapClick={() => undefined}
        onMapReady={() => undefined}
        onMapDestroy={() => undefined}
      />
    );

    await act(async () => {
      root.render(renderCanvas(false));
    });

    expect(mapMockState.instances).toHaveLength(1);
    expect(mapMockState.instances[0]?.addControl.mock.calls.some(([control]) => control?.kind === "scale")).toBe(false);

    await act(async () => {
      root.render(renderCanvas(true));
    });

    expect(mapMockState.instances).toHaveLength(1);
    const scaleControl = mapMockState.instances[0]?.addControl.mock.calls.find(([control]) => control?.kind === "scale")?.[0];
    expect(scaleControl).toBeDefined();

    await act(async () => {
      root.render(renderCanvas(false));
    });

    expect(mapMockState.instances).toHaveLength(1);
    expect(mapMockState.instances[0]?.removeControl).toHaveBeenCalledWith(scaleControl);

    await act(async () => {
      root.unmount();
    });
  });

  it("suppresses abort-like MapLibre errors during teardown", async () => {
    const { MapCanvas } = await import("../MapCanvas");
    const onMapReady = vi.fn();
    const onMapDestroy = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MapCanvas
          baseLayer="dark"
          pinMode={false}
          pins={[]}
          onCursorMove={() => undefined}
          onZoomChange={() => undefined}
          onViewportChange={() => undefined}
          onMapClick={() => undefined}
          onMapReady={onMapReady}
          onMapDestroy={onMapDestroy}
        />,
      );
    });

    expect(onMapReady).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });

    expect(mapMockState.abortPreventDefault).toHaveBeenCalledTimes(1);
    expect(onMapDestroy).toHaveBeenCalledTimes(1);
  });

  it("reports external service render failures with CORS proxy guidance", async () => {
    const { MapCanvas } = await import("../MapCanvas");
    const { useMapExplorerStore } = await import("@/stores/useMapExplorerStore");
    useMapExplorerStore.setState({
      overlayLayers: [{
        id: "external-wms-layer",
        name: "External WMS Layer",
        type: "raster-tile",
        visible: true,
        opacity: 0.82,
        sourceKind: "external",
        sourceData: "https://maps.example.test/wms?bbox={bbox-epsg-3857}",
      }],
    });
    const onRenderError = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MapCanvas
          baseLayer="dark"
          pinMode={false}
          pins={[]}
          onCursorMove={() => undefined}
          onZoomChange={() => undefined}
          onViewportChange={() => undefined}
          onMapClick={() => undefined}
          onMapReady={() => undefined}
          onMapDestroy={() => undefined}
          onRenderError={onRenderError}
        />,
      );
    });

    await act(async () => {
      mapMockState.instances[0]?.emit("error", {
        sourceId: "external-wms-layer",
        error: new TypeError("Failed to fetch"),
      });
    });

    expect(onRenderError).toHaveBeenCalledWith(expect.stringContaining("External WMS Layer"));
    expect(onRenderError).toHaveBeenCalledWith(expect.stringContaining("CORS proxy"));

    await act(async () => {
      root.unmount();
    });
  });
});
