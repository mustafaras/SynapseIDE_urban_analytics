// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import type { CellularAutomataResult } from "@/engine/simulation";
import { useBackgroundTaskStore } from "@/stores/useBackgroundTaskStore";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

const executeCellularAutomataScenarioAsyncMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/analysis/BackgroundAnalyticsQueue", () => ({
  executeCellularAutomataScenarioAsync: executeCellularAutomataScenarioAsyncMock,
}));

vi.mock("@/ui/toast/api", () => ({
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../rail/CrossPanelActions", () => ({
  default: () => React.createElement("div", { "data-testid": "cross-panel-actions-stub" }, "Cross panel actions"),
}));

vi.mock("../../components/NarrativeGenerationPanel", () => ({
  default: () => React.createElement("div", { "data-testid": "narrative-panel-stub" }, "Narrative panel"),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeTemporalFeatureCollection(values: number[], step: number, label: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: values.map((value, index) => ({
      type: "Feature",
      id: `cell-${step}-${index + 1}`,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [index, 0],
          [index + 0.9, 0],
          [index + 0.9, 0.9],
          [index, 0.9],
          [index, 0],
        ]],
      },
      properties: {
        value,
        time_step: step,
        time_label: label,
      },
    })),
  };
}

function makeCellularAutomataResult(): CellularAutomataResult {
  return {
    scenarioName: "Transit Corridor Consolidation",
    valueField: "value",
    frames: [
      {
        step: 0,
        label: "Observed 2020",
        featureCollection: makeTemporalFeatureCollection([0, 1], 0, "Observed 2020"),
      },
      {
        step: 1,
        label: "Transit corridor step 1",
        featureCollection: makeTemporalFeatureCollection([1, 1], 1, "Transit corridor step 1"),
      },
    ],
    calibration: {
      neighborhoodRadius: 1,
      urbanThreshold: 0.5,
      maxSlope: 0.68,
      growthRate: 0.12,
      meanNewUrbanCells: 1,
      spontaneousGrowthShare: 0.08,
      suitabilityWeight: 0.42,
      neighborhoodWeight: 0.38,
      structureWeight: 0.2,
      slopePenalty: 0.18,
      neighborhoodThreshold: 0.16,
      structureThreshold: 0.22,
      minTransitionScore: 0.35,
      transitionSampleSize: 18,
      stableSampleSize: 42,
    },
    predictedStates: [
      { width: 2, height: 1, step: 0, label: "Observed 2020", values: [0, 1] },
      { width: 2, height: 1, step: 1, label: "Transit corridor step 1", values: [1, 1] },
    ],
    observedState: { width: 2, height: 1, step: 1, label: "Observed 2026", values: [1, 1] },
    validation: {
      figureOfMerit: 0.61,
      overallAccuracy: 0.88,
      kappa: 0.72,
      kappaChange: 0.58,
      fitQuality: "strong",
      confusion: {
        urban: {
          truePositive: 8,
          falsePositive: 2,
          falseNegative: 1,
          trueNegative: 13,
        },
        change: {
          hits: 5,
          misses: 1,
          falseAlarms: 2,
          correctRejections: 16,
        },
      },
    },
    constraintSummary: {
      protectedCells: 5,
      waterCells: 4,
      steepSlopeCells: 3,
      structureLimitedCells: 6,
    },
    stepSummaries: [
      {
        step: 0,
        label: "Observed 2020",
        newUrbanCells: 0,
        totalUrbanCells: 1,
        targetNewUrbanCells: 0,
        eligibleCandidateCells: 0,
        meanSelectedScore: 0,
      },
      {
        step: 1,
        label: "Transit corridor step 1",
        newUrbanCells: 1,
        totalUrbanCells: 2,
        targetNewUrbanCells: 1,
        eligibleCandidateCells: 3,
        meanSelectedScore: 0.63,
      },
    ],
    simplifications: [
      "Binary urban-state simulation for interactive scenario comparison.",
    ],
  };
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
  useFlowStore.getState().reset();
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
  useBackgroundTaskStore.setState({ panelOpen: false, panelHostId: null });
  executeCellularAutomataScenarioAsyncMock.mockReset();
});

describe("CellularAutomataFlow", () => {
  it("publishes the selected temporal layer", async () => {
    executeCellularAutomataScenarioAsyncMock.mockReturnValue({
      promise: Promise.resolve(makeCellularAutomataResult()),
    });

    const { default: CellularAutomataFlow } = await import("../CellularAutomataFlow");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<CellularAutomataFlow />);
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Next"),
    ) ?? null;

    await dispatchClick(nextButton);
    await dispatchClick(nextButton);
    await dispatchClick(nextButton);

    const runButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Run calibration + simulation"),
    ) ?? null;

    await dispatchClick(runButton);

    await waitFor(() => {
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
      expect(useFlowStore.getState().completedRuns).toHaveLength(1);
    });

    const store = useMapExplorerStore.getState();
    const selectedLayer = store.overlayLayers[0];
    expect(selectedLayer?.metadata?.analysisResult?.engine).toBe("CellularAutomata");
    expect(selectedLayer?.metadata?.analysisResult?.visualization).toEqual(
      expect.objectContaining({
        kind: "temporal",
      }),
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});