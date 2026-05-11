// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAP_ANALYSIS_DISPATCH_KEY,
  MAP_ANALYSIS_RECOMMENDATION_KEY,
  buildMapAnalysisDispatchContextSummary,
  buildMapAnalysisLayerReferences,
  buildBoundsPolygon,
  collectSelectionStatistics,
  dispatchFlowSelection,
  dispatchRecommendationFlow,
} from "../MapAnalysisDispatcher";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapAnalysisRecommendation } from "../MapAnalysisRecommender";
import { useFlowStore } from "@/stores/useFlowStore";

beforeEach(() => {
  useFlowStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MapAnalysisDispatcher", () => {
  it("queues AOI flow dispatch and emits workflow navigation", () => {
    const handler = vi.fn();
    window.addEventListener("synapse:navigate", handler as EventListener);

    const payload = dispatchFlowSelection({
      flowId: "site_suitability",
      aoi: buildBoundsPolygon([28.95, 40.99, 29.01, 41.03]),
      source: "map-context-menu",
      restrictToView: true,
      viewBounds: [28.95, 40.99, 29.01, 41.03],
    });

    expect(payload.kind).toBe("flow-aoi");
    expect(useFlowStore.getState().stepData[MAP_ANALYSIS_DISPATCH_KEY]).toMatchObject({
      kind: "flow-aoi",
      flowId: "site_suitability",
      restrictToView: true,
    });
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as CustomEvent<{ tab: string; flowId: string }>;
    expect(event.detail).toMatchObject({ tab: "Workflows", flowId: "site_suitability" });
  });

  it("enriches AOI dispatches with map context summary and layer references", () => {
    const layer: OverlayLayerConfig = {
      id: "districts",
      name: "District Scores",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: {
        geometryType: "polygon",
        featureCount: 2,
        fields: ["population", "score"],
      },
    };
    const contextSummary = buildMapAnalysisDispatchContextSummary({
      mapContextSummary: {
        contextId: "map-context-1",
        updatedAt: "2026-05-11T00:00:00.000Z",
        viewport: { center: [29, 41], zoom: 10, bearing: 0, pitch: 0, baseLayerId: "dark" },
        currentBounds: [28.95, 40.99, 29.01, 41.03],
        currentBoundsUpdatedAt: "2026-05-11T00:00:00.000Z",
        activeAoi: { aoiId: "aoi-1", geometryFamily: "polygon" },
        visibleLayerIds: ["districts"],
        selectedLayerIds: ["districts"],
        activeAnalysisResultLayerIds: [],
        selection: { totalSelectedFeatures: 0, layerCounts: [] },
        qa: {
          status: "passed",
          checkedAt: "2026-05-11T00:00:00.000Z",
          layerCount: 1,
          blockedLayerCount: 0,
          issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
        },
      },
    });
    const layerReferences = buildMapAnalysisLayerReferences([layer], ["districts"], "selected-context");

    const payload = dispatchFlowSelection({
      flowId: "site_suitability",
      aoi: buildBoundsPolygon([28.95, 40.99, 29.01, 41.03]),
      source: "map-context-menu",
      restrictToView: false,
      contextSummary,
      layerReferences,
    });

    expect(payload.contextSummary).toMatchObject({
      contextId: "map-context-1",
      activeAoiId: "aoi-1",
      qaStatus: "passed",
    });
    expect(payload.layerReferences).toEqual([
      expect.objectContaining({ layerId: "districts", role: "selected-context", featureCount: 2 }),
    ]);
    expect(payload.audit).toMatchObject({ explicit: true, reviewEventType: "analysis-dispatch" });
  });

  it("queues recommendation dispatch payloads without changing the legacy dispatch key", () => {
    const handler = vi.fn();
    window.addEventListener("synapse:navigate", handler as EventListener);
    const layer: OverlayLayerConfig = {
      id: "events",
      name: "Event points",
      type: "geojson",
      visible: true,
      opacity: 1,
      metadata: { geometryType: "point", featureCount: 12 },
    };
    const recommendation: MapAnalysisRecommendation = {
      id: "analysis-rec:point:accessibility:events",
      category: "point",
      severity: "high",
      score: 900,
      title: "Test access around point events",
      rationale: "Point events can seed access analysis.",
      requiredInputs: ["Point origins", "Travel threshold"],
      expectedOutput: "Accessibility workflow with isochrone-ready map output.",
      scientificCaveat: "Network quality affects access interpretation.",
      actionLabel: "Open accessibility",
      action: { type: "open-flow", flowId: "accessibility", layerIds: ["events"] },
      layerIds: ["events"],
      evidence: ["12 point features"],
      reasons: [
        { kind: "geometry", tone: "supporting", label: "Geometry", detail: "Point layer available.", layerIds: ["events"] },
      ],
      readiness: {
        status: "ready",
        label: "Ready",
        blockers: [],
        warnings: [],
        requiredActions: ["Dispatch explicitly from the recommendation action."],
        qaBlockingIssueCount: 0,
        hasActiveAoi: true,
        checkedAt: "2026-05-11T00:00:00.000Z",
        contextId: "map-context-2",
      },
    };

    const payload = dispatchRecommendationFlow({
      recommendation,
      flowId: "accessibility",
      overlayLayers: [layer],
      mapContextSummary: {
        contextId: "map-context-2",
        updatedAt: "2026-05-11T00:00:00.000Z",
        viewport: { center: [29, 41], zoom: 10, bearing: 0, pitch: 0, baseLayerId: "dark" },
        currentBounds: null,
        currentBoundsUpdatedAt: null,
        activeAoi: { aoiId: "aoi-2", geometryFamily: "polygon" },
        visibleLayerIds: ["events"],
        selectedLayerIds: ["events"],
        activeAnalysisResultLayerIds: [],
        selection: { totalSelectedFeatures: 3, layerCounts: [{ layerId: "events", count: 3 }] },
        qa: {
          status: "passed",
          checkedAt: "2026-05-11T00:00:00.000Z",
          layerCount: 1,
          blockedLayerCount: 0,
          issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
        },
      },
      urbanContext: {
        hasContext: true,
        contextId: "urban-context-2",
        studyAreaName: "Kadikoy access",
        activeFlowId: "accessibility",
        layerCount: 1,
        artifactCount: 0,
        syncState: "synced",
      },
    });

    expect(useFlowStore.getState().stepData[MAP_ANALYSIS_RECOMMENDATION_KEY]).toMatchObject({
      kind: "recommendation",
      recommendationId: recommendation.id,
      flowId: "accessibility",
      contextSummary: {
        contextId: "map-context-2",
        selectedFeatureCount: 3,
        urbanContext: {
          contextId: "urban-context-2",
          activeFlowId: "accessibility",
        },
      },
    });
    expect(useFlowStore.getState().stepData[MAP_ANALYSIS_DISPATCH_KEY]).toBeUndefined();
    expect(payload.layerReferences?.[0]).toMatchObject({ layerId: "events", role: "recommendation-source" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("summarizes numeric statistics for selected features", () => {
    const layer: OverlayLayerConfig = {
      id: "districts",
      name: "District Scores",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "a",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.9, 41], [28.91, 41], [28.91, 41.01], [28.9, 41.01], [28.9, 41]]],
            },
            properties: {
              population: 1200,
              score: 40,
            },
          },
          {
            type: "Feature",
            id: "b",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.91, 41], [28.92, 41], [28.92, 41.01], [28.91, 41.01], [28.91, 41]]],
            },
            properties: {
              population: 1800,
              score: 60,
            },
          },
        ],
      },
    };

    const summaries = collectSelectionStatistics([layer], { districts: ["a", "b"] });

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.selectedFeatureCount).toBe(2);
    expect(summaries[0]?.numericFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "population", mean: 1500, median: 1500, min: 1200, max: 1800 }),
        expect.objectContaining({ field: "score", mean: 50, median: 50, min: 40, max: 60 }),
      ]),
    );
  });
});