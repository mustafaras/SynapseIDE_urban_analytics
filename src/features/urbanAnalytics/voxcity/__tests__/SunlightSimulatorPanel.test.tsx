// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";

import SunlightSimulatorPanel from "../SunlightSimulatorPanel";
import { useCityJSONScene } from "../hooks/useCityJSONScene";
import { useSunlightSimStore } from "../hooks/useSunlightSim";
import { resolveVoxCityMapLayerSource, useVoxCityBridgeStore } from "../voxCityDataBridge";
import { useUrbanContextStore } from "@/features/urbanAnalytics/useUrbanContextStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

const cameraPositionSet = vi.fn();
const cameraLookAt = vi.fn();

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => <div data-testid="mock-canvas">{children}</div>,
  useThree: () => ({
    camera: {
      position: { set: cameraPositionSet },
      lookAt: cameraLookAt,
    },
  }),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
}));

vi.mock("@/centerpanel/components/NarrativeGenerationPanel", () => ({
  default: () => <div data-testid="mock-narrative-panel" />,
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
        },
      },
    ],
  },
  metadata: {
    featureCount: 1,
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

async function waitFor(check: () => void, timeoutMs = 5000): Promise<void> {
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
  useCityJSONScene.getState().reset();
  useSunlightSimStore.getState().reset();
  useFlowStore.getState().reset();
  useUrbanContextStore.setState({
    context: null,
    evidenceArtifacts: [],
    restoreWarnings: [],
    lastPersistedAt: null,
    lastRestoredAt: null,
    storageStatus: "available",
  });
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useVoxCityBridgeStore.getState().clearSunlightHandoff();

  const resolved = resolveVoxCityMapLayerSource(importedBuildingLayer);
  if (!resolved) {
    throw new Error("Expected imported building layer to resolve for sunlight test.");
  }

  useVoxCityBridgeStore.getState().setSunlightHandoff(resolved, ["parcel-a"]);
});

describe("SunlightSimulatorPanel", () => {
  it("runs from handed-off real geometry, persists provenance, and publishes exposure results", async () => {
    const { container, root } = mountComponent();

    await act(async () => {
      root.render(<SunlightSimulatorPanel />);
    });

    await waitFor(() => {
      expect(container.querySelector('[data-testid="sunlight-source-metadata"]')?.textContent).toContain("Project Data Active");
      expect(container.querySelector('[data-testid="sunlight-source-metadata"]')?.textContent).toContain("Building Viewer handoff active");
      expect(useSunlightSimStore.getState().buildings).toHaveLength(1);
    });

    await dispatchClick(container.querySelector('[aria-label="Run sunlight simulation"]'));

    await waitFor(() => {
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
      expect(useSunlightSimStore.getState().result).not.toBeNull();
    });

    expect(useFlowStore.getState().completedRuns[0]?.dataOutputs[0]?.preview[0]).toMatchObject({
      source_title: "Imported Building Footprints — Selected Buildings",
      source_kind: "handoff",
      runtime_mode: "real",
      input_feature_count: 1,
    });

    expect(
      useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === "workflow-run"
        && artifact.flowId === "sunlight_sim"
        && artifact.metadata?.voxcity_simulation_type === "sunlight_exposure",
      ),
    ).toBe(true);
    expect(
      useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.kind === "map-layer"
        && artifact.flowId === "sunlight_sim"
        && typeof artifact.metadata?.voxcity_linked_scenario_artifact_id === "string",
      ),
    ).toBe(true);

    await dispatchClick(container.querySelector('[aria-label="Add solar exposure to map"]'));

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers.some((layer) => layer.metadata?.analysisResult?.engine === "SunlightSimulation")).toBe(true);
    });

    const sunlightArtifacts = useUrbanContextStore.getState().evidenceArtifacts.filter((artifact) => artifact.flowId === "sunlight_sim");
    const scenarioArtifact = sunlightArtifacts.find((artifact) => artifact.kind === "workflow-run");
    const mapArtifact = sunlightArtifacts.find((artifact) => artifact.kind === "map-layer");
    expect(scenarioArtifact).toBeDefined();
    expect(mapArtifact).toBeDefined();
    expect(scenarioArtifact?.linkedArtifactIds).toContain(mapArtifact?.id ?? "");
    expect(mapArtifact?.linkedArtifactIds).toContain(scenarioArtifact?.id ?? "");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

});