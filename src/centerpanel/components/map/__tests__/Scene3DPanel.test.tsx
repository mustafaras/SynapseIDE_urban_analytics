// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scene3DPanel } from "../scene3d/Scene3DPanel";
import { type MapSceneStatusChip, MapSceneWorkspace } from "../scene";
import { buildingFootprints } from "./fixtures/gisFixtures";
import { useScene3DStore } from "@/stores/useScene3DStore";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let canvasSpy: ReturnType<typeof vi.spyOn> | null = null;

function mockCanvasContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function resetScene3DStore(): void {
  useScene3DStore.setState({
    runtimeMode: "2d",
    interactionMode: "inspect",
    cameraBookmarks: [],
    activeLayerId: null,
    activeCollection: null,
    activeLayerCrs: null,
    sceneBuildings: [],
    cityModelSourceHandle: null,
    terrainSourceHandle: null,
    extrusionAnalysis: null,
    buildingConfig: null,
    selectedFeatureIds: [],
    inspectorEntries: [],
    sceneMetadata: null,
    viewCorridorDefinition: null,
    viewCorridorResult: null,
    sectionPlaneDefinition: null,
    sectionPlaneResult: null,
    heightFieldOverride: null,
    floorFieldOverride: null,
    metersPerLevelOverride: 3,
  });
}

function render(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(node);
  });
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

function text(testId: string): string {
  return query(testId)?.textContent ?? "";
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function crsSummary(crs: string | null): SourceHandle["crsSummary"] {
  return {
    crs,
    status: crs ? "known" : "unknown",
    source: "import-source",
    notes: crs ? [`3D source declared ${crs}.`] : ["3D source did not declare a CRS."],
  };
}

function cityJsonHandle(): SourceHandle {
  return {
    sourceId: "cityjson-sample",
    kind: "imported",
    storageMode: "metadata-only",
    restoreStatus: "metadata-only",
    format: "cityjson",
    crsSummary: crsSummary("EPSG:4979"),
    featureCount: 8,
    scene3d: {
      sourceKind: "cityjson",
      runtimeMode: "sample",
      verticalDatum: {
        status: "unknown",
        value: null,
        source: "cityjson-metadata",
        caveats: ["CityJSON sample does not declare a vertical datum."],
      },
      objectCount: 8,
      lods: ["1.2", "2.0"],
      bbox3d: [29, 41, 12, 29.01, 41.01, 86],
    },
    caveats: ["Sample CityJSON, not surveyed output."],
    profiledAt: "2026-06-04T00:00:00.000Z",
  };
}

function terrainHandle(): SourceHandle {
  return {
    sourceId: "terrain-dem",
    kind: "imported",
    storageMode: "metadata-only",
    restoreStatus: "metadata-only",
    format: "geotiff",
    crsSummary: crsSummary("EPSG:32635"),
    featureCount: null,
    scene3d: {
      sourceKind: "terrain-dem",
      runtimeMode: "real",
      verticalDatum: {
        status: "known",
        value: "EGM96 geoid height",
        source: "user-declared",
        caveats: [],
      },
      objectCount: null,
      lods: [],
      bbox3d: [29, 41, 10, 29.02, 41.02, 32],
      terrain: {
        sourceKind: "dem-geotiff",
        width: 64,
        height: 32,
        bbox: [29, 41, 29.02, 41.02],
        elevationRangeM: [10, 32],
        sampleCount: 2048,
      },
    },
    caveats: [],
    profiledAt: "2026-06-04T00:00:00.000Z",
  };
}

function tilesHandle(): SourceHandle {
  return {
    sourceId: "tiles-3d",
    kind: "external",
    storageMode: "url-refetch",
    restoreStatus: "external-reference",
    sourceRef: "https://example.test/tileset.json",
    format: "3d-tiles",
    crsSummary: crsSummary(null),
    featureCount: 2,
    scene3d: {
      sourceKind: "3d-tiles",
      runtimeMode: "metadata-only",
      verticalDatum: {
        status: "unknown",
        value: null,
        source: "3d-tiles-metadata",
        caveats: ["3D Tiles tileset metadata does not declare an explicit vertical datum."],
      },
      objectCount: null,
      lods: [],
      bbox3d: [29, 41, 3, 29.01, 41.01, 18],
      tileset: {
        assetVersion: "1.1",
        rootGeometricError: 50,
        tileCount: 2,
        contentCount: 2,
        rootRefine: "ADD",
      },
    },
    caveats: ["Tileset metadata only; payloads are refetched externally."],
    profiledAt: "2026-06-04T00:00:00.000Z",
  };
}

beforeEach(() => {
  window.localStorage.clear();
  resetScene3DStore();
  canvasSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(() => mockCanvasContext());
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  canvasSpy?.mockRestore();
  root = null;
  host = null;
  canvasSpy = null;
  resetScene3DStore();
  window.localStorage.clear();
});

describe("Scene3DPanel", () => {
  it("keeps CityJSON, terrain, vertical datum, sample state, sync, tools, and scenarios visible", () => {
    useScene3DStore.getState().setActiveLayer("buildings", buildingFootprints, {
      declaredCrs: "EPSG:32635",
      cityModelSourceHandle: cityJsonHandle(),
      terrainSourceHandle: terrainHandle(),
    });
    useScene3DStore.getState().setRuntimeMode("3d");

    render(
      <Scene3DPanel
        visible
        presentation="embedded"
        viewportSync={{ label: "Sync: synced", status: "ready" }}
        onClose={() => undefined}
      />,
    );

    expect(text("scene3d-source-mode-chip").toLowerCase()).toContain("sample cityjson");
    expect(text("scene3d-generation-state-chip").toLowerCase()).toContain("sample");
    expect(text("scene3d-vertical-assumption-chip")).toContain("EGM96 geoid height");
    expect(text("scene3d-viewport-sync-chip")).toContain("Sync: synced");
    expect(text("scene3d-cityjson-metadata")).toContain("CityJSON");
    expect(text("scene3d-cityjson-metadata")).toContain("1.2, 2.0");
    expect(text("scene3d-terrain-metadata")).toContain("Terrain");
    expect(text("scene3d-terrain-metadata")).toContain("2,048");
    expect(text("scene3d-tiles-metadata")).toContain("not linked");
    expect(text("scene3d-urban-form-controls")).toContain("View corridor: ready");
    expect(text("scene3d-urban-form-controls")).toContain("Section/cut plane: ready");
    expect(text("scene3d-analysis-projected-crs-chip")).toContain("EPSG:32635");
    expect(text("scene3d-analysis-vertical-chip")).toContain("EGM96 geoid height");
    expect(query("scene3d-terrain-canvas")).not.toBeNull();
    expect(query("scene3d-interaction-strip")?.getAttribute("data-presentation")).toBe("embedded");
    expect(query("scene3d-interaction-strip")?.getAttribute("data-position")).toBe("docked");
    expect(query("scenario-comparison-strip")?.getAttribute("data-presentation")).toBe("embedded");
  });

  it("surfaces 3D Tiles metadata without treating metadata-only payloads as source-backed", () => {
    useScene3DStore.getState().setActiveLayer("buildings", buildingFootprints, {
      declaredCrs: null,
      cityModelSourceHandle: tilesHandle(),
      terrainSourceHandle: null,
    });
    useScene3DStore.getState().setRuntimeMode("3d");

    render(
      <Scene3DPanel
        visible
        presentation="embedded"
        viewportSync={{ label: "Sync: off", status: "caveat" }}
        onClose={() => undefined}
      />,
    );

    expect(text("scene3d-source-mode-chip").toLowerCase()).toContain("metadata only");
    expect(text("scene3d-generation-state-chip").toLowerCase()).toContain("metadata only");
    expect(text("scene3d-vertical-assumption-chip").toLowerCase()).toContain("unknown");
    expect(text("scene3d-tiles-metadata")).toContain("3D Tiles");
    expect(text("scene3d-tiles-metadata")).toContain("1.1");
    expect(text("scene3d-tiles-metadata")).toContain("2 tiles / 2 content");
    expect(text("scene3d-tiles-metadata")).toContain("ADD");
  });

  it("does not mount the real 3D panel while another Scene tab is active", () => {
    const statusChips: MapSceneStatusChip[] = [
      { id: "source-mode", label: "Source mode: raster", status: "ready" },
      { id: "crs", label: "CRS: EPSG:32635", status: "ready" },
      { id: "vertical-datum", label: "Vertical datum: EGM96", status: "ready" },
      { id: "sample-generated", label: "Sample/generated: sample", status: "demo" },
      { id: "sync-state", label: "Sync: synced", status: "ready" },
    ];

    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("scene-raster");
      return (
        <MapSceneWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          statusChips={statusChips}
          raster={<div data-testid="scene-content-raster">Raster content</div>}
          temporal={null}
          scene3d={<Scene3DPanel visible presentation="embedded" onClose={() => undefined} />}
          zoning={null}
          massing={null}
          sunShadow={null}
          voxCity={null}
        />
      );
    };

    render(<Harness />);

    expect(query("scene-content-raster")).not.toBeNull();
    expect(query("scene3d-panel")).toBeNull();
    expect(query("scene3d-terrain-canvas")).toBeNull();

    click("map-workbench-sidebar-tab-scene-3d");

    expect(query("scene3d-panel")).not.toBeNull();
  });
});
