// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import { LayerInspector, type InspectorTabId } from "../inspector/LayerInspector";

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
});
