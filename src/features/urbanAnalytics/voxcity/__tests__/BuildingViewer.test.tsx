// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import BuildingViewer from "../BuildingViewer";
import { useBuildingScene } from "../hooks/useBuildingScene";
import { useCityJSONScene } from "../hooks/useCityJSONScene";
import { useVoxCityBridgeStore } from "../voxCityDataBridge";
import {
  publishViewportSync,
  resetViewportSyncService,
  setViewportSyncEnabled,
  useViewportSyncStore,
  viewportSyncTokens,
} from "@/services/map/MapSyncService";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { useUrbanContextStore } from "@/features/urbanAnalytics/useUrbanContextStore";

const cameraPosition = {
  x: 0,
  y: 0,
  z: 0,
  set: vi.fn((x: number, y: number, z: number) => {
    cameraPosition.x = x;
    cameraPosition.y = y;
    cameraPosition.z = z;
  }),
};
const cameraPositionSet = cameraPosition.set;
const cameraLookAt = vi.fn();
const orbitTarget = {
  x: 0,
  y: 0,
  z: 0,
  set: vi.fn((x: number, y: number, z: number) => {
    orbitTarget.x = x;
    orbitTarget.y = y;
    orbitTarget.z = z;
  }),
};
const orbitTargetSet = orbitTarget.set;
const orbitListeners = new Set<() => void>();
const orbitControlsUpdate = vi.fn(() => {
  orbitListeners.forEach((listener) => listener());
});

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
  useThree: () => ({
    camera: {
      position: cameraPosition,
      lookAt: cameraLookAt,
    },
  }),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: React.forwardRef((_props: object, ref: React.ForwardedRef<{
    target: typeof orbitTarget;
    update: () => void;
    addEventListener: (_eventName: string, listener: () => void) => void;
    removeEventListener: (_eventName: string, listener: () => void) => void;
  }>) => {
    const controls = {
      target: orbitTarget,
      update: orbitControlsUpdate,
      addEventListener: (_eventName: string, listener: () => void) => {
        orbitListeners.add(listener);
      },
      removeEventListener: (_eventName: string, listener: () => void) => {
        orbitListeners.delete(listener);
      },
    };

    if (typeof ref === "function") {
      ref(controls);
    } else if (ref) {
      ref.current = controls;
    }

    return null;
  }),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const importedBuildingLayer = {
  id: "imported-building-layer",
  name: "Imported Building Footprints",
  type: "geojson" as const,
  visible: true,
  opacity: 1,
  group: "data" as const,
  sourceData: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        id: "parcel-a",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[28.94, 41.01], [28.945, 41.01], [28.945, 41.015], [28.94, 41.015], [28.94, 41.01]]],
        },
        properties: {
          name: "Parcel A",
          height: 18,
          building: "residential",
        },
      },
      {
        type: "Feature" as const,
        id: "parcel-b",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[28.946, 41.01], [28.951, 41.01], [28.951, 41.014], [28.946, 41.014], [28.946, 41.01]]],
        },
        properties: {
          name: "Parcel B",
          height: 24,
          building: "office",
        },
      },
    ],
  },
  metadata: {
    featureCount: 2,
    geometryType: "polygon",
    updatedAt: "2026-04-23T09:15:00.000Z",
    datasetContext: {
      layerTitle: "Imported Building Footprints",
      crs: "EPSG:4326",
    },
  },
};

function mountComponent() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

async function dispatchClick(element: Element | null): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function waitFor(check: () => void, timeoutMs = 4000): Promise<void> {
  const started = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() - started > timeoutMs) {
        throw error;
      }
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
    }
  }
}

beforeEach(() => {
  cameraPositionSet.mockClear();
  cameraLookAt.mockClear();
  orbitTargetSet.mockClear();
  orbitControlsUpdate.mockClear();
  orbitListeners.clear();
  cameraPosition.x = 0;
  cameraPosition.y = 0;
  cameraPosition.z = 0;
  orbitTarget.x = 0;
  orbitTarget.y = 0;
  orbitTarget.z = 0;
  resetViewportSyncService();
  useBuildingScene.getState().reset();
  useCityJSONScene.getState().reset();
  useFlowStore.getState().reset();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: 'available',
  });
  useVoxCityBridgeStore.getState().clearSunlightHandoff();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useMapExplorerStore.getState().addOverlayLayer(importedBuildingLayer);
});

describe("BuildingViewer", () => {
  it("loads a real map layer by default, persists extrusion provenance, and hands selected geometry to sunlight simulation", async () => {
    const { container, root } = mountComponent();

    await act(async () => {
      root.render(<BuildingViewer />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="voxcity-source-select"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="voxcity-source-metadata"]')?.textContent).toContain("Project Data Active");
      expect(container.querySelector('[data-testid="voxcity-source-metadata"]')?.textContent).toContain("Imported Building Footprints");
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    expect((container.querySelector('[data-testid="voxcity-source-select"]') as HTMLSelectElement | null)?.value).toBe("imported-building-layer");
    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[0]?.preview[0]).toMatchObject({
      source_title: "Imported Building Footprints",
      source_kind: "map-layer",
      runtime_mode: "real",
      input_feature_count: 2,
      source_layer_id: "imported-building-layer",
    });

    expect(
      useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'workflow-run'
        && artifact.flowId === 'voxcity_3d'
        && artifact.metadata?.voxcity_simulation_type === 'building_extrusion',
      ),
    ).toBe(true);
    expect(
      useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === 'map-layer'
        && artifact.flowId === 'voxcity_3d'
        && typeof artifact.metadata?.voxcity_linked_scenario_artifact_id === 'string',
      ),
    ).toBe(true);

    await act(async () => {
      useBuildingScene.getState().selectBuilding("parcel-a");
    });

    await dispatchClick(container.querySelector('[data-testid="voxcity-send-to-solar"]'));

    await waitFor(() => {
      expect(useVoxCityBridgeStore.getState().sunlightHandoff).not.toBeNull();
    });

    expect(useVoxCityBridgeStore.getState().sunlightHandoff?.selectedBuildingIds).toEqual(["parcel-a"]);
    expect(useVoxCityBridgeStore.getState().sunlightHandoff?.source.metadata.kind).toBe("handoff");
    expect(useVoxCityBridgeStore.getState().sunlightHandoff?.source.metadata.featureCount).toBe(1);

    await dispatchClick(container.querySelector('[title="Add building footprints as a map overlay layer"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers.some((layer) => layer.metadata?.analysisResult?.engine === "BuildingExtrusion")).toBe(true);
    });

    const voxcityArtifacts = useUrbanContextStore.getState().evidenceArtifacts.filter((artifact) => artifact.flowId === 'voxcity_3d');
    const scenarioArtifact = voxcityArtifacts.find((artifact) => artifact.kind === 'workflow-run');
    const mapArtifact = voxcityArtifacts.find((artifact) => artifact.kind === 'map-layer');
    expect(scenarioArtifact).toBeDefined();
    expect(mapArtifact).toBeDefined();
    expect(scenarioArtifact?.linkedArtifactIds).toContain(mapArtifact?.id ?? '');
    expect(mapArtifact?.linkedArtifactIds).toContain(scenarioArtifact?.id ?? '');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("applies shared map sync events and emits debounced 3D viewport updates", async () => {
    const { container, root } = mountComponent();

    await act(async () => {
      root.render(<BuildingViewer />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="voxcity-sync-status"]')?.textContent).toContain("3D link off");
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
      expect(orbitListeners.size).toBeGreaterThan(0);
    });

    await act(async () => {
      setViewportSyncEnabled(true);
      publishViewportSync({
        source: "map-2d",
        center: [29.025, 41.02],
        zoom: 14.2,
        bearing: 24,
        pitch: 38,
      });
      await new Promise((resolve) => setTimeout(resolve, viewportSyncTokens.debounceMs + 20));
    });

    await waitFor(() => {
      expect(orbitTargetSet).toHaveBeenLastCalledWith(29.025, expect.any(Number), 41.02);
      expect(useViewportSyncStore.getState().statusLabel).toBe("Synced with 3D");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      orbitTarget.set(29.018, orbitTarget.y || 7, 41.012);
      cameraPosition.set(29.35, 18, 40.68);
      orbitControlsUpdate();
      await new Promise((resolve) => setTimeout(resolve, viewportSyncTokens.debounceMs + 20));
    });

    await waitFor(() => {
      expect(useViewportSyncStore.getState().lastSource).toBe("voxcity-3d");
      expect(useViewportSyncStore.getState().lastEvent?.center).toEqual([29.018, 41.012]);
    });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
