import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import { getMapWorkspaceReadiness, getRecommendedMapQuickAction } from "../mapExperience";

function createLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "layer-1",
    name: "Urban Layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    ...overrides,
  };
}

describe("mapExperience workspace readiness", () => {
  it("starts in the load data stage when no layers are present", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [],
      pinCount: 0,
      drawnFeatureCount: 0,
      measurementCount: 0,
      lastSavedAt: null,
    });

    expect(readiness.label).toBe("Foundational");
    expect(readiness.focusLabel).toBe("Load Data");
    expect(readiness.sequence[0]?.status).toBe("current");
    expect(readiness.sequence[1]?.status).toBe("upcoming");
  });

  it("moves into analysis framing once curated layers are available", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 0,
      measurementCount: 0,
      lastSavedAt: null,
    });

    expect(readiness.label).toBe("Operational");
    expect(readiness.focusLabel).toBe("Frame Analysis");
    expect(readiness.sequence[0]?.status).toBe("complete");
    expect(readiness.sequence[1]?.status).toBe("complete");
    expect(readiness.sequence[2]?.status).toBe("current");
  });

  it("becomes delivery ready once analysis is saved into the project state", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer({ group: "analysis" })],
      pinCount: 2,
      drawnFeatureCount: 1,
      measurementCount: 1,
      lastSavedAt: "2026-04-17T18:30:00.000Z",
    });

    expect(readiness.label).toBe("Delivery Ready");
    expect(readiness.score).toBe(100);
    expect(readiness.sequence.every((step) => step.status === "complete")).toBe(true);
  });
});

describe("getRecommendedMapQuickAction", () => {
  it("recommends theming once AOI exists but no analysis result is available", () => {
    const action = getRecommendedMapQuickAction({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 1,
      measurementCount: 0,
    });

    expect(action).toBe("theme-data");
  });
});