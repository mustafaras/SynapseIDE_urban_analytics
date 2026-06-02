import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import { getMapWorkspaceReadiness, getRecommendedMapQuickAction, hasMapLayerSourceEvidence } from "../mapExperience";

function createLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "layer-1",
    name: "Urban Layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    metadata: {
      featureCount: 12,
      fields: ["id", "value"],
    },
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

    expect(readiness.state).toBe("no-data");
    expect(readiness.label).toBe("No Data");
    expect(readiness.focusLabel).toBe("Import Data");
    expect(readiness.nextActionId).toBe("import-data");
    expect(readiness.sequence[0]?.status).toBe("current");
    expect(readiness.sequence[1]?.status).toBe("upcoming");
  });

  it("reports data loaded when source-backed visible data still needs readiness review", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 0,
      measurementCount: 0,
      lastSavedAt: null,
      qaStatus: "unchecked",
    });

    expect(readiness.state).toBe("data-loaded");
    expect(readiness.label).toBe("Data Loaded");
    expect(readiness.focusLabel).toBe("Review Readiness");
    expect(readiness.nextActionId).toBe("review-problems");
    expect(readiness.sequence[0]?.status).toBe("complete");
    expect(readiness.sequence[1]?.status).toBe("current");
  });

  it("reports invisible layers before claiming operational readiness", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer({ visible: false })],
      pinCount: 0,
      drawnFeatureCount: 0,
      measurementCount: 0,
      lastSavedAt: null,
      qaStatus: "passed",
    });

    expect(readiness.state).toBe("invisible-layers");
    expect(readiness.focusLabel).toBe("Reveal Layers");
    expect(readiness.nextActionId).toBe("review-layers");
  });

  it("reports stale analysis before claiming publish readiness", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [
        createLayer({
          group: "analysis",
          metadata: {
            featureCount: 12,
            analysisResult: {
              runId: "run-1",
              algorithmId: "buffer",
              algorithmLabel: "Buffer",
              createdAt: "2026-05-10T20:12:00.000Z",
              sourceLayerIds: ["layer-source"],
              stale: true,
            },
          },
        }),
      ],
      pinCount: 1,
      drawnFeatureCount: 1,
      measurementCount: 0,
      lastSavedAt: "2026-05-10T20:12:00.000Z",
      hasActiveAoi: true,
      qaStatus: "passed",
      visiblePublicationLayerCount: 1,
    });

    expect(readiness.state).toBe("stale-analysis");
    expect(readiness.focusLabel).toBe("Refresh Outputs");
    expect(readiness.nextActionId).toBe("review-layers");
  });

  it("reports missing AOI once visible data has passed QA", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 0,
      measurementCount: 0,
      lastSavedAt: null,
      hasActiveAoi: false,
      qaStatus: "passed",
    });

    expect(readiness.state).toBe("missing-aoi");
    expect(readiness.focusLabel).toBe("Draw AOI");
    expect(readiness.nextActionId).toBe("draw-aoi");
    expect(readiness.sequence[2]?.status).toBe("current");
  });

  it("reports QA blockers as a blocked readiness state", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 1,
      measurementCount: 0,
      lastSavedAt: null,
      hasActiveAoi: true,
      qaStatus: "error",
      qaBlockerCount: 2,
      visiblePublicationLayerCount: 1,
    });

    expect(readiness.state).toBe("qa-blockers");
    expect(readiness.tone).toBe("blocked");
    expect(readiness.focusLabel).toBe("Review Problems");
    expect(readiness.nextActionId).toBe("review-problems");
  });

  it("becomes publish ready only with source data, QA, AOI, publication layer, and saved state", () => {
    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [createLayer({ group: "analysis" })],
      pinCount: 2,
      drawnFeatureCount: 1,
      measurementCount: 1,
      lastSavedAt: "2026-04-17T18:30:00.000Z",
      hasActiveAoi: true,
      qaStatus: "passed",
      visiblePublicationLayerCount: 1,
    });

    expect(readiness.state).toBe("publish-ready");
    expect(readiness.label).toBe("Publish Ready");
    expect(readiness.score).toBe(100);
    expect(readiness.nextActionId).toBe("export-map");
    expect(readiness.sequence.every((step) => step.status === "complete")).toBe(true);
  });

  it("never claims publish readiness without real data or source state", () => {
    const placeholderLayer = {
      id: "placeholder",
      name: "Placeholder",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "analysis",
    } satisfies OverlayLayerConfig;

    expect(hasMapLayerSourceEvidence(placeholderLayer)).toBe(false);

    const readiness = getMapWorkspaceReadiness({
      overlayLayers: [placeholderLayer],
      pinCount: 1,
      drawnFeatureCount: 1,
      measurementCount: 1,
      lastSavedAt: "2026-04-17T18:30:00.000Z",
      hasActiveAoi: true,
      qaStatus: "passed",
      visiblePublicationLayerCount: 1,
    });

    expect(readiness.state).toBe("no-data");
    expect(readiness.label).not.toBe("Publish Ready");
    expect(readiness.score).toBeLessThan(100);
  });
});

describe("getRecommendedMapQuickAction", () => {
  it("recommends theming once AOI exists but no analysis result is available", () => {
    const action = getRecommendedMapQuickAction({
      overlayLayers: [createLayer()],
      pinCount: 0,
      drawnFeatureCount: 1,
      measurementCount: 0,
      hasActiveAoi: true,
      qaStatus: "passed",
    });

    expect(action).toBe("theme-data");
  });

  it("routes QA caveats to problems instead of claiming publish readiness", () => {
    const action = getRecommendedMapQuickAction({
      overlayLayers: [createLayer()],
      pinCount: 1,
      drawnFeatureCount: 1,
      measurementCount: 1,
      hasActiveAoi: true,
      qaStatus: "warning",
      qaIssueCount: 1,
      visiblePublicationLayerCount: 1,
      lastSavedAt: "2026-04-17T18:30:00.000Z",
    });

    expect(action).toBe("review-problems");
  });
});
