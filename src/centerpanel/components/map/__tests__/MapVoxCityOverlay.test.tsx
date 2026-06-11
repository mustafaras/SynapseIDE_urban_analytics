// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type maplibregl from "maplibre-gl";
import { __VOXCITY_OVERLAY_LAYER_IDS__, MapVoxCityOverlay } from "../../MapVoxCityOverlay";
import type { OverlayLayerConfig } from "../mapTypes";
import { useCityJSONScene } from "@/features/urbanAnalytics/voxcity/hooks/useCityJSONScene";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("maplibre-gl", () => {
  class MockPopup {
    remove = vi.fn();
    setLngLat = vi.fn(() => this);
    setHTML = vi.fn(() => this);
    addTo = vi.fn(() => this);
    getElement = vi.fn(() => document.createElement("div"));
  }

  return {
    default: { Popup: MockPopup },
    Popup: MockPopup,
  };
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const projectFootprints: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "project-building-1",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29, 41],
          [29.001, 41],
          [29.001, 41.001],
          [29, 41.001],
          [29, 41],
        ]],
      },
      properties: {
        building_id: "project-building-1",
        height: 24,
        type: "office",
      },
    },
  ],
};

const osmFootprints: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "osm-building-1",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29.01, 41.01],
          [29.011, 41.01],
          [29.011, 41.011],
          [29.01, 41.011],
          [29.01, 41.01],
        ]],
      },
      properties: {
        building_id: "osm-building-1",
        osm_id: "way/1",
        height: 15,
      },
    },
  ],
};

function createProjectLayer(): OverlayLayerConfig {
  return {
    id: "project-buildings",
    name: "Project Buildings",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceKind: "project",
    sourceData: projectFootprints,
    provenance: { label: "Project parcel/building upload" },
    metadata: {
      featureCount: 1,
      geometryType: "Polygon",
      datasetContext: {
        layerTitle: "Project building footprints",
        source: "Project upload",
        crs: "EPSG:4326",
      },
    },
  };
}

function createOsmLayer(): OverlayLayerConfig {
  return {
    id: "osm-buildings",
    name: "OSM Buildings",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "voxcity",
    sourceKind: "external",
    sourceData: osmFootprints,
    provenance: {
      label: "OpenStreetMap Overpass ODbL",
      sourceName: "OpenStreetMap Overpass",
    },
    metadata: {
      featureCount: 1,
      geometryType: "Polygon",
      datasetContext: {
        layerTitle: "OpenStreetMap buildings",
        source: "OpenStreetMap Overpass",
        crs: "EPSG:4326",
      },
    },
  };
}

function renderPanel(): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapVoxCityOverlay
        mapRef={{ current: null } as React.RefObject<maplibregl.Map | null>}
        panelVisible
        onPanelClose={() => undefined}
        presentation="embedded"
      />,
    );
  });
}

function query(testId: string): Element {
  const element = host?.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`${testId} was not rendered`);
  return element;
}

function clickButton(text: string): void {
  const button = Array.from(host?.querySelectorAll("button") ?? [])
    .find((entry) => entry.textContent?.includes(text));
  if (!button) throw new Error(`Button containing "${text}" was not rendered`);
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function replaceOverlayLayers(layers: OverlayLayerConfig[]): void {
  act(() => {
    useMapExplorerStore.getState().replaceOverlayLayers(layers);
  });
}

function findRegistryLayer(id: string): OverlayLayerConfig | undefined {
  return useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === id);
}

beforeEach(() => {
  replaceOverlayLayers([]);
  useCityJSONScene.setState({ objects: [], summary: null });
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  root = null;
  host = null;
  replaceOverlayLayers([]);
  useCityJSONScene.setState({ objects: [], summary: null });
});

describe("MapVoxCityOverlay bridge surface", () => {
  it("keeps demo/sample geometry unmistakable and non-project", () => {
    renderPanel();
    clickButton("Demo");

    expect(query("voxcity-source-priority").textContent).toContain("Project polygon layer");
    expect(query("voxcity-source-priority").textContent).toContain("OSM buildings");
    expect(query("voxcity-source-priority").textContent).toContain("Demo/sample fallback");
    expect(query("voxcity-active-source-mode").textContent).toContain("DEMO SAMPLE - not project data");
    expect(query("voxcity-crs-caveat-chip").textContent).toContain("anchored display");
    expect(query("voxcity-vertical-caveat-chip").textContent).toContain("sample heights");
    expect(query("voxcity-evidence-state-chip").textContent).toContain("sample-labelled");
    expect(query("voxcity-real-sample-proof").textContent).toContain("not project geometry");
  });

  it("prefers a real project polygon layer and registers it as project source", () => {
    replaceOverlayLayers([createProjectLayer()]);
    renderPanel();
    clickButton("Active map layer");

    expect(query("voxcity-active-source-mode").textContent).toContain("REAL project layer");
    expect(query("voxcity-footprint-count-chip").textContent).toContain("Footprints: 1");
    expect(query("voxcity-crs-caveat-chip").textContent).toContain("EPSG:4326");
    expect(query("voxcity-evidence-state-chip").textContent).toContain("reference-only handoff");
    expect(query("voxcity-real-sample-proof").textContent).toContain("Project geometry is active");
    expect(host?.textContent).toContain("Real Building Footprints");

    const registryLayer = findRegistryLayer(__VOXCITY_OVERLAY_LAYER_IDS__.registry.footprints);
    expect(registryLayer?.name).toBe("VoxCity Project Building Footprints");
    expect(registryLayer?.sourceKind).toBe("project");
  });

  it("labels OSM geometry as external rather than project data", () => {
    replaceOverlayLayers([createOsmLayer()]);
    renderPanel();

    expect(query("voxcity-active-source-mode").textContent).toContain("REAL OSM buildings");
    expect(query("voxcity-real-sample-proof").textContent).toContain("not municipal project data");
    expect(query("voxcity-footprint-count-chip").textContent).toContain("Footprints: 1");

    const registryLayer = findRegistryLayer(__VOXCITY_OVERLAY_LAYER_IDS__.registry.footprints);
    expect(registryLayer?.name).toBe("VoxCity OSM Building Footprints");
    expect(registryLayer?.sourceKind).toBe("external");
  });
});
