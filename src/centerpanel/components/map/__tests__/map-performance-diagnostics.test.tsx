// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  MAP_GEOJSON_RENDER_FEATURE_BUDGET,
  buildFeatureCollectionMetadata,
} from "@/services/map/MapDataImporter";
import {
  buildMapPerformanceDiagnostics,
  formatPerformanceBytes,
  type MapPerformanceTimingMetric,
} from "@/services/map/MapPerformanceDiagnostics";
import {
  MapPerformanceBudgetBanner,
  MapPerformanceDiagnosticsPanel,
} from "../MapPerformanceDiagnosticsPanel";
import type { OverlayLayerConfig } from "../mapTypes";
import { fcLarge } from "./fixtures/gisFixtures";

function largeLayer(): OverlayLayerConfig {
  const featureCollection = fcLarge(MAP_GEOJSON_RENDER_FEATURE_BUDGET + 25);
  return {
    id: "fc-large-layer",
    name: "fcLarge stress layer",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: featureCollection,
    metadata: buildFeatureCollectionMetadata(featureCollection),
    group: "data",
  };
}

describe("Map performance diagnostics", () => {
  it("summarizes live render budgets and bounded preview layers", () => {
    const renderMetric: MapPerformanceTimingMetric = {
      kind: "render",
      label: "Layer sync",
      durationMs: 123,
      measuredAt: "2026-05-25T10:00:00.000Z",
      featureCount: MAP_GEOJSON_RENDER_FEATURE_BUDGET + 25,
    };
    const exportMetric: MapPerformanceTimingMetric = {
      kind: "export",
      label: "GeoJSON data export",
      durationMs: 456,
      measuredAt: "2026-05-25T10:00:01.000Z",
      featureCount: MAP_GEOJSON_RENDER_FEATURE_BUDGET + 25,
      byteLength: 1024,
    };
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [largeLayer()],
      timings: [renderMetric, exportMetric],
    });

    expect(diagnostics.renderMode).toBe("preview");
    expect(diagnostics.previewLayerCount).toBe(1);
    expect(diagnostics.totalFeatureCount).toBe(MAP_GEOJSON_RENDER_FEATURE_BUDGET + 25);
    expect(diagnostics.lastRenderTiming?.durationMs).toBe(123);
    expect(diagnostics.lastExportTiming?.durationMs).toBe(456);
    expect(diagnostics.warnings.join(" ")).toContain("bounded preview mode");
  });

  it("renders diagnostics numbers and the bounded-mode banner", () => {
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [largeLayer()],
      timings: [{
        kind: "render",
        label: "Layer sync",
        durationMs: 101,
        measuredAt: "2026-05-25T10:00:00.000Z",
      }],
    });
    const html = renderToStaticMarkup(
      <>
        <MapPerformanceBudgetBanner diagnostics={diagnostics} />
        <MapPerformanceDiagnosticsPanel visible diagnostics={diagnostics} onClose={vi.fn()} />
      </>,
    );

    expect(html).toContain("Map performance diagnostics");
    expect(html).toContain("Bounded preview mode");
    expect(html).toContain("fcLarge stress layer");
    expect(html).toContain("30,025");
    expect(html).toContain("30,000");
    expect(html).toContain(formatPerformanceBytes(diagnostics.estimatedRenderBytes));
  });
});
