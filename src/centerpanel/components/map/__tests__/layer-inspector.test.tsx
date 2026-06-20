// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  type InspectorTabId,
  LayerInspector,
  MapInspectorHost,
  type MapInspectorHostContext,
} from "../inspector";

function pointsLayer(): OverlayLayerConfig {
  return {
    id: "points",
    name: "WGS84 points",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    metadata: {
      geometryType: "Point",
      featureCount: 25,
      fields: ["id", "name", "value", "date"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
    },
  };
}

function missingCrsLayer(): OverlayLayerConfig {
  return {
    id: "missing",
    name: "Missing CRS parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    metadata: { geometryType: "Polygon", featureCount: 10 },
  };
}

function analysisLayer(): OverlayLayerConfig {
  return {
    id: "derived",
    name: "Hotspot result",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "derived",
    metadata: {
      geometryType: "Polygon",
      featureCount: 5,
      analysisResult: {
        engine: "MapWorkflowService",
        runId: "run-123",
        runTimestamp: "2026-05-23T00:00:00.000Z",
        parameterSummary: "buffer 500m",
        inputParameters: {},
        statisticalSummary: {},
        sourceLayerIds: ["src-a"],
        reproducibilityManifest: {
          manifestId: "man-1",
          workflowId: "wf-1",
          inputLayerIds: ["src-a"],
          outputLayerIds: ["derived"],
        },
      },
    } as OverlayLayerConfig["metadata"],
  };
}

const noop = (): void => {};

afterEach(() => cleanup());

function markup(layer: OverlayLayerConfig, initialTab: InspectorTabId): string {
  return renderToStaticMarkup(
    <LayerInspector layer={layer} sourceHandle={null} onClose={noop} initialTab={initialTab} />,
  );
}

describe("LayerInspector", () => {
  it("lists schema fields including 'value' for a known points layer", () => {
    expect(markup(pointsLayer(), "schema")).toContain("value");
  });

  it("shows EPSG:4326 on the CRS tab for a known layer", () => {
    expect(markup(pointsLayer(), "crs")).toContain("EPSG:4326");
  });

  it("shows 'missing' on the CRS tab for a layer with no CRS metadata (no blank)", () => {
    expect(markup(missingCrsLayer(), "crs")).toContain("missing");
  });

  it("links lineage run + manifest ids for an analysis layer", () => {
    const html = markup(analysisLayer(), "lineage");
    expect(html).toContain("run-123");
    expect(html).toContain("man-1");
    expect(html).toContain("wf-1");
  });

  it("explains the absence of lineage for a source layer instead of leaving it blank", () => {
    expect(markup(pointsLayer(), "lineage")).toContain("source layer");
  });

  it("renders the inspector dialog with every tab control", () => {
    const html = markup(pointsLayer(), "overview");
    expect(html).toContain("Layer inspector");
    expect(html).toContain("WGS84 points");
    for (const tab of ["overview", "source", "schema", "crs", "qa", "style", "lineage", "report"]) {
      expect(html).toContain(`map-layer-inspector-tab-${tab}`);
    }
  });

  it("renders source handle restore details explicitly on the source tab", () => {
    const handle: SourceHandle = {
      sourceId: "source-points",
      kind: "imported",
      storageMode: "indexeddb-local",
      restoreStatus: "restored",
      format: "geojson",
      crsSummary: { crs: "EPSG:4326", status: "known", source: "import-source", notes: [] },
      featureCount: 25,
      caveats: ["Profiled source handle."],
      profiledAt: "2026-05-31T12:00:00.000Z",
    };
    const html = renderToStaticMarkup(
      <LayerInspector layer={pointsLayer()} sourceHandle={handle} onClose={noop} initialTab="source" />,
    );

    expect(html).toContain("source-points");
    expect(html).toContain("indexeddb-local");
    expect(html).toContain("restored");
  });

  it("renders a summary-first overview with warnings, actions, and collapsed technical details", () => {
    const html = markup(missingCrsLayer(), "overview");

    expect(html).toContain("Summary");
    expect(html).toContain("Warnings");
    expect(html).toContain("Actions");
    expect(html).toContain("Core metadata");
    expect(html).toContain("Technical details");
    expect(html).toContain("Coordinate reference system needs review");
    expect(html).toContain("Inspect schema");
    expect(html).toContain("Check report readiness");
  });
});

describe("MapInspectorHost", () => {
  it("hosts the layer inspector in one right-side inspector shell", () => {
    render(
      <MapInspectorHost
        visible
        context={{ kind: "layer", layer: pointsLayer() }}
        onClose={noop}
      />,
    );

    expect(screen.getByTestId("map-inspector-host").getAttribute("data-context")).toBe("layer");
    expect(screen.getByTestId("map-layer-inspector").getAttribute("data-presentation")).toBe("embedded");
    expect(screen.getByRole("tab", { name: "Overview" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Report" })).toBeDefined();
  });

  it("provides placeholders for non-layer inspector contexts", () => {
    const contexts: MapInspectorHostContext[] = [
      { kind: "none" },
      { kind: "map" },
      { kind: "feature-selection" },
      { kind: "qa-issue" },
      { kind: "workflow-preview" },
      { kind: "publish" },
      { kind: "scene" },
    ];

    for (const context of contexts) {
      const html = renderToStaticMarkup(
        <MapInspectorHost visible context={context} onClose={noop} />,
      );
      expect(html).toContain("map-inspector-host");
      expect(html).toContain(`data-context="${context.kind}"`);
    }
  });

  it("returns focus to the opener when closed", () => {
    vi.useFakeTimers();
    const opener = document.createElement("button");
    opener.textContent = "Inspect";
    document.body.appendChild(opener);
    opener.focus();
    const onClose = vi.fn();

    render(
      <MapInspectorHost
        visible
        context={{ kind: "layer", layer: pointsLayer() }}
        onClose={onClose}
        returnFocusTo={opener}
      />,
    );
    vi.runAllTimers();

    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(onClose).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(document.activeElement).toBe(opener);
    opener.remove();
    vi.useRealTimers();
  });
});
