// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAP_ANALYSIS_DISPATCH_KEY,
  buildBoundsPolygon,
  collectSelectionStatistics,
  dispatchFlowSelection,
} from "../MapAnalysisDispatcher";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
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