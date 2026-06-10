// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  clearMapTelemetryEvents,
  getMapTelemetryEvents,
  recordMapTelemetryEvent,
} from "@/services/map/observability";
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
  afterEach(() => {
    clearMapTelemetryEvents();
  });

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

  it("renders redacted observability events with worker retry affordance", () => {
    recordMapTelemetryEvent({
      kind: "worker.failure",
      severity: "error",
      source: "worker-pool",
      message: "Worker failed for alex@example.test with token=secret-worker-token",
      recoverable: true,
      recoveryLabel: "Retry worker job",
      details: {
        jobId: "job-worker-1",
        taskKind: "geometry/workflow",
        error: "token=secret-worker-token",
      },
    });
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [largeLayer()],
      telemetryEvents: getMapTelemetryEvents(),
    });
    const html = renderToStaticMarkup(
      <MapPerformanceDiagnosticsPanel
        visible
        diagnostics={diagnostics}
        onClose={vi.fn()}
        onRetryWorkerJob={vi.fn()}
      />,
    );

    expect(html).toContain("Operations Log");
    expect(html).toContain("worker.failure");
    expect(html).toContain("Retry worker job");
    expect(html).toContain("[REDACTED]");
    expect(html).not.toContain("alex@example.test");
    expect(html).not.toContain("secret-worker-token");
  });

  it("groups observability events into readable, redacted categories", () => {
    recordMapTelemetryEvent({
      kind: "worker.failure",
      severity: "error",
      source: "worker-pool",
      message: "Worker crashed",
      recoverable: true,
      recoveryLabel: "Retry worker job",
      details: { jobId: "job-1" },
    });
    recordMapTelemetryEvent({
      kind: "external-service.error",
      severity: "warning",
      source: "external-service",
      message: "WFS request failed with api_key=plain-secret",
      details: { endpoint: "https://services.example.test/wfs?api_key=plain-secret" },
    });
    recordMapTelemetryEvent({
      kind: "command.run",
      severity: "error",
      source: "map-command",
      message: "Buffer command failed",
    });
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [largeLayer()],
      telemetryEvents: getMapTelemetryEvents(),
    });
    const html = renderToStaticMarkup(
      <MapPerformanceDiagnosticsPanel visible diagnostics={diagnostics} onClose={vi.fn()} />,
    );

    expect(html).toContain("Worker failures");
    expect(html).toContain("External service errors");
    expect(html).toContain("Command activity");
    expect(html).toContain("map-observability-category-worker.failure");
    expect(html).toContain("map-observability-redaction-note");
    expect(html).toContain("redacted before any event is stored");
    expect(html).toContain("[REDACTED]");
    expect(html).not.toContain("plain-secret");
  });

  it("surfaces severity-first operational summaries before advanced raw event details", () => {
    recordMapTelemetryEvent({
      kind: "external-service.error",
      severity: "warning",
      source: "external-service",
      message: "Tile provider timed out",
    });
    recordMapTelemetryEvent({
      kind: "worker.failure",
      severity: "error",
      source: "worker-pool",
      message: "Worker execution stopped unexpectedly",
      recoverable: true,
      recoveryLabel: "Retry worker job",
      details: { jobId: "job-priority-1" },
    });
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [largeLayer()],
      telemetryEvents: getMapTelemetryEvents(),
    });

    const html = renderToStaticMarkup(
      <MapPerformanceDiagnosticsPanel
        visible
        diagnostics={diagnostics}
        onClose={vi.fn()}
        onRetryWorkerJob={vi.fn()}
      />,
    );

    expect(html).toContain("map-operational-status-list");
    expect(html).toContain("Advanced details and raw event history");
    expect(html).toContain("A worker-backed task is blocked");
    expect(html).toContain("Provider availability or remote service responses need attention");
    expect(html.indexOf("Worker failures")).toBeLessThan(html.indexOf("External service errors"));
  });

  it("renders a production no-issues state while keeping advanced details reachable", () => {
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [],
      telemetryEvents: [],
      timings: [{
        kind: "render",
        label: "Layer sync",
        durationMs: 42,
        measuredAt: "2026-06-10T00:00:00.000Z",
      }],
    });

    const html = renderToStaticMarkup(
      <MapPerformanceDiagnosticsPanel visible diagnostics={diagnostics} onClose={vi.fn()} />,
    );

    expect(html).toContain("Current layer stack is within the documented interactive render budgets");
    expect(html).toContain("No diagnostics events recorded for this map session");
  });
});
